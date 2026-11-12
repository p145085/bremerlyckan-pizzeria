#!/usr/bin/env node
// Jämför webbplatsens meny (src/data/menu.json) med FoodToday-menyn och
// uppdaterar priser, ingredienser och "ingår"-info.
//
//   npm run sync-menu                      visa skillnader (ändrar inget)
//   npm run sync-menu -- --write           skriv ändringarna till menu.json
//   npm run sync-menu -- --write --add-new lägg även till nya rätter
//
// Flaggor:  --url <adress till FoodToday-appen>   --file <sparad menu.aspx-HTML>
//
// Namn, ordning, kategorier och veg-märkning ändras aldrig automatiskt –
// skillnader i namn rapporteras bara.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ordering } from "../src/data/site.js";
import { fetchMenuHtml, formatJson, parseMenu, prettyName } from "./lib/foodtoday.mjs";

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

const MENU_PATH = fileURLToPath(new URL("../src/data/menu.json", import.meta.url));
const write = flag("--write");
const addNew = flag("--add-new");

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const same = (a = [], b = []) => a.length === b.length && a.every((x, i) => x === b[i]);

async function main() {
  const menu = JSON.parse(await readFile(MENU_PATH, "utf8"));

  const file = opt("--file");
  const url = opt("--url") ?? ordering.direct.url;
  const html = file ? await readFile(file, "utf8") : await fetchMenuHtml(url);
  console.log(c.dim(`Källa: ${file ?? url}`));

  const upstream = parseMenu(html);
  const remote = new Map();
  for (const cat of upstream.categories)
    for (const it of cat.items)
      if (!remote.has(it.ft)) remote.set(it.ft, { ...it, kind: cat.kind, ftCategory: cat.ftCategory, catName: cat.name });

  if (remote.size === 0) {
    console.error(c.red("Hittade inga rätter i FoodToday-HTML:en – har sidan ändrats?"));
    process.exit(1);
  }

  const ignoredCats = new Set(Object.keys(menu.ignoredFtCategories ?? {}).map(Number));
  const ignoredItems = new Set(Object.keys(menu.ignoredFtItems ?? {}).map(Number));
  const local = new Set();
  let changes = 0;
  const notes = [];

  for (const cat of menu.categories) {
    for (const group of cat.groups) {
      for (const item of group.items) {
        if (!item.ft) continue;
        local.add(item.ft);
        const r = remote.get(item.ft);
        const label = `${cat.title}${group.title ? ` / ${group.title}` : ""}: ${item.name}`;
        if (!r) {
          notes.push(c.yellow(`  ? ${label} finns inte längre i FoodToday (id ${item.ft})`));
          continue;
        }
        if (r.price != null && r.price !== item.price) {
          console.log(`  ${c.bold("pris")}  ${label}: ${item.price} kr → ${c.green(`${r.price} kr`)}`);
          item.price = r.price;
          changes++;
        }
        if (r.ingredients.length && !same(r.ingredients, item.ingredients)) {
          console.log(
            `  ${c.bold("ingredienser")}  ${label}:\n     ${c.dim((item.ingredients ?? []).join(", "))}\n   → ${c.green(r.ingredients.join(", "))}`,
          );
          item.ingredients = r.ingredients;
          changes++;
        }
        const inc = r.includes ?? [];
        if (r.kind !== "extra" && !same(inc, item.includes ?? [])) {
          console.log(`  ${c.bold("ingår")}  ${label}: [${(item.includes ?? []).join(", ")}] → [${c.green(inc.join(", "))}]`);
          if (inc.length) item.includes = inc;
          else delete item.includes;
          changes++;
        }
        if (prettyName(r.name).toLowerCase() !== item.name.toLowerCase()) {
          notes.push(c.dim(`  · ${label} heter "${r.name}" i FoodToday (namnet ändras inte automatiskt)`));
        }
      }
    }
  }

  // Nya rätter i FoodToday
  const groupsByFt = new Map();
  for (const cat of menu.categories) for (const g of cat.groups) if (g.ftCategory) groupsByFt.set(g.ftCategory, { cat, g });
  for (const r of remote.values()) {
    if (local.has(r.ft) || ignoredItems.has(r.ft) || ignoredCats.has(r.ftCategory)) continue;
    const target = groupsByFt.get(r.ftCategory);
    const where = target ? `${target.cat.title}${target.g.title ? ` / ${target.g.title}` : ""}` : `okänd kategori "${r.catName}" (${r.ftCategory})`;
    if (addNew && target) {
      const item = { ft: r.ft };
      if (r.no) item.no = r.no;
      item.name = prettyName(r.name);
      if (r.sub) item.note = r.sub.toLowerCase();
      if (r.ingredients.length) item.ingredients = r.ingredients;
      item.price = r.price;
      if (r.includes.length) item.includes = r.includes;
      target.g.items.push(item);
      console.log(`  ${c.green("+ ny")}  ${where}: ${item.name} (${item.price} kr)`);
      changes++;
    } else {
      notes.push(
        c.yellow(`  + Ny i FoodToday: ${r.name} (${r.price} kr) i ${where}, id ${r.ft}`) +
          (target ? c.dim(" – kör med --add-new för att lägga till") : c.dim(" – lägg till för hand eller i ignoredFtItems")),
      );
    }
  }

  if (notes.length) console.log("\n" + notes.join("\n"));

  if (changes === 0) {
    console.log(c.green("\nMenyn är i synk med FoodToday."));
    return;
  }
  if (!write) {
    console.log(c.yellow(`\n${changes} ändring(ar) hittades. Kör med --write för att spara.`));
    return;
  }
  menu.updated = new Date().toISOString().slice(0, 10);
  await writeFile(MENU_PATH, formatJson(menu));
  console.log(c.green(`\nSparade ${changes} ändring(ar) i src/data/menu.json. Bygg och publicera sajten igen.`));
}

main().catch((err) => {
  console.error(c.red(err.stack ?? String(err)));
  process.exit(1);
});
