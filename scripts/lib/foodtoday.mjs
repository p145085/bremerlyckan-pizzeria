// Läser menyn från FoodTodays beställningsapp (samma sida som visas i
// "Beställ online"-rutan) och gör om den till enkel data.
//
// FoodToday har inget öppet API, så vi läser den server-renderade HTML:en.
// Om FoodToday ändrar sin markup kan parsern behöva justeras.

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

/**
 * Hämtar meny-HTML från FoodToday-appen.
 * @param {string} appUrl t.ex. "https://www.bremerlyckanpizzeria.se/app/"
 * @param {number} orderType 1 = avhämtning, 2 = utkörning
 */
export async function fetchMenuHtml(appUrl, orderType = 1) {
  const url = new URL("menu.aspx", appUrl.endsWith("/") ? appUrl : appUrl + "/");
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Cookie: `OrderType=${orderType}` },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`FoodToday svarade ${res.status} för ${url}`);
  return res.text();
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function text(s = "") {
  return decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function parsePrice(s) {
  const m = String(s).replace(/\s/g, "").match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(",", ".")) : null;
}

/** "sås Ingår, Dricka Ingår" -> ["sås", "dricka"] */
export function parseIncludes(list) {
  const out = [];
  for (const raw of list) {
    for (const part of raw.split(",")) {
      const w = part.replace(/ingår/i, "").trim().toLowerCase();
      if (w && !out.includes(w)) out.push(w);
    }
  }
  return out;
}

const QUALIFIER_FIRST = new Set(["färska", "färsk", "soltorkade", "inlagd", "inlagda"]);
const QUALIFIER_SHORT = { nötkött: "nöt" };

/**
 * Gör FoodTodays ingredienser läsbara:
 * "Champinjoner (Färska)" -> "färska champinjoner"
 * "Kebabkött (Nötkött)"   -> "kebabkött (nöt)"
 */
export function normalizeIngredient(raw) {
  const s = raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(\d)(st|cl|g)\b/gi, (_, d, u) => `${d} ${u.toLowerCase()}`);
  const m = s.match(/^(.*?)\s*\((.*?)\)$/);
  if (m) {
    const base = m[1].toLowerCase();
    const q = m[2].toLowerCase();
    if (QUALIFIER_FIRST.has(q)) return `${q} ${base}`;
    return `${base} (${QUALIFIER_SHORT[q] ?? q})`;
  }
  return s.toLowerCase();
}

/** Snyggar till mått i namn: "Lökringar 6st" -> "Lökringar 6 st", "Pepsi 1,5l" -> "Pepsi 1,5 l" */
export function prettyName(name) {
  return name
    .replace(/(\d)(st|cl|l|g)\b/gi, (_, d, u) => `${d} ${u.toLowerCase()}`)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * JSON med indrag, men korta listor med enkla värden på en rad
 * (t.ex. ingredienser) så att filen blir lätt att läsa och redigera.
 */
export function formatJson(value) {
  const json = JSON.stringify(value, null, 2);
  return (
    json.replace(/\[\s*\n([^[\]{}]*?)\n\s*\]/g, (m, inner) => {
      const parts = inner.split(/,\s*\n\s*/).map((s) => s.trim());
      const line = `[${parts.join(", ")}]`;
      return line.length <= 160 ? line : m;
    }) + "\n"
  );
}

export function splitIngredients(desc) {
  return desc
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map(normalizeIngredient);
}

/**
 * Tolkar meny-HTML:en.
 * @returns {{ categories: Array<{ ftCategory: number, name: string, kind: "meal"|"extra",
 *   items: Array<{ ft: number, name: string, sub: string, ingredients: string[],
 *   includes: string[], price: number|null, no: string|null, image: string|null }> }> }}
 */
export function parseMenu(html) {
  const categories = [];

  // Rätter (meals): <h5 class="title-holder category123"> ... <section itemID="..." class="card product-card">
  const catRe = /<h5 class="title-holder category(\d+)\s*">([\s\S]*?)<\/h5>/g;
  const cats = [...html.matchAll(catRe)];
  const extrasStart = html.search(/<h5 class="title-holder ingredientCategory/);
  cats.forEach((m, i) => {
    const start = m.index + m[0].length;
    let end = i + 1 < cats.length ? cats[i + 1].index : html.length;
    if (extrasStart > start && extrasStart < end) end = extrasStart;
    const chunk = html.slice(start, end);
    const items = [];
    const secRe = /<section itemID="(\d+)" class="card product-card[^"]*"[^>]*>([\s\S]*?)<\/section>/g;
    for (const s of chunk.matchAll(secRe)) {
      const body = s[2];
      const name = text(body.match(/<h5><a>([\s\S]*?)<\/a>/)?.[1]);
      const sub = text(body.match(/<h5><a>[\s\S]*?<\/a><em>([\s\S]*?)<\/em>/)?.[1]).replace(/^,\s*/, "");
      const desc = text(body.match(/<\/h5>\s*<p>([\s\S]*?)<\/p>/)?.[1]);
      const badges = [...body.matchAll(/<div class="sr-no badge mb-2"[^>]*>([\s\S]*?)<\/div>/g)]
        .map((b) => text(b[1]))
        .filter(Boolean);
      const included = [...body.matchAll(/<p class="Included">([\s\S]*?)<\/p>/g)].map((x) => text(x[1]));
      const price = parsePrice(text(body.match(/<strong class="price[^"]*">([\s\S]*?)<\/strong>/)?.[1]));
      const image = body.match(/<img src="([^"]+)"/)?.[1] ?? null;
      items.push({
        ft: Number(s[1]),
        name,
        sub,
        ingredients: desc ? splitIngredients(desc) : [],
        includes: parseIncludes(included),
        price,
        no: badges[0] ?? null,
        image,
      });
    }
    categories.push({ ftCategory: Number(m[1]), name: text(m[2]), kind: "meal", items });
  });

  // Tillval (såser, drycker, tillbehör): ingredientCategory-block
  const headRe = /<h5 class="title-holder ingredientCategory(\d+)\s*">([\s\S]*?)<\/h5>/g;
  const heads = new Map([...html.matchAll(headRe)].map((m) => [m[1], text(m[2])]));
  const blockRe = /<div class="row row-cols-1 row-cols-lg-2 gx-4 ingredientCategory(\d+)\s*">/g;
  const blocks = [...html.matchAll(blockRe)];
  blocks.forEach((b, i) => {
    const start = b.index + b[0].length;
    const end = i + 1 < blocks.length ? blocks[i + 1].index : html.length;
    const chunk = html.slice(start, end);
    const items = [];
    const secRe =
      /<section class="card product-card[^"]*" itemid="(\d+)" name="([^"]*)" pricetext="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g;
    for (const s of chunk.matchAll(secRe)) {
      items.push({
        ft: Number(s[1]),
        name: decode(s[2]).trim(),
        sub: "",
        ingredients: [],
        includes: [],
        price: parsePrice(s[3]),
        no: null,
        image: s[4].match(/<img src="([^"]+)"/)?.[1] ?? null,
      });
    }
    categories.push({ ftCategory: Number(b[1]), name: heads.get(b[1]) ?? "?", kind: "extra", items });
  });

  return { categories };
}
