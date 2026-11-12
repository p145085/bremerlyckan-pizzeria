import menuData from "../data/menu.json";

export interface MenuItem {
  /** FoodToday-id – används av `npm run sync-menu` för att uppdatera pris och ingredienser */
  ft?: number;
  /** Pizzanummer, t.ex. "01" */
  no?: string;
  name: string;
  /** Kort tillägg efter namnet, t.ex. "inbakad" */
  note?: string;
  ingredients?: string[];
  price: number;
  /** Det som ingår, t.ex. ["sås", "dricka"] */
  includes?: string[];
  veg?: boolean;
}

export interface MenuGroup {
  id?: string;
  title?: string;
  ftCategory?: number;
  items: MenuItem[];
}

export interface MenuCategory {
  id: string;
  title: string;
  /** Text under kategorirubriken */
  note?: string;
  /** Ingredienser som alla rätter i kategorin har (visas inte per rätt om alla finns med) */
  baseIngredients?: string[];
  /** "compact" = bara namn och pris i flera spalter (såser, drycker) */
  layout?: "list" | "compact";
  groups: MenuGroup[];
}

export interface Menu {
  currency: string;
  updated: string;
  categories: MenuCategory[];
}

export const menu = menuData as unknown as Menu;

export const allItems = (cat: MenuCategory) => cat.groups.flatMap((g) => g.items);

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Ingredienser att visa för en rätt – utan kategorins basingredienser om rätten har alla. */
export function displayIngredients(item: MenuItem, cat: MenuCategory): string {
  const list = item.ingredients ?? [];
  const base = cat.baseIngredients ?? [];
  const hasAllBase = base.length > 0 && base.every((b) => list.includes(b));
  const shown = hasAllBase ? list.filter((x) => !base.includes(x)) : list;
  return capitalize(shown.join(", "));
}

/** Det som ingår i alla rätter i kategorin (visas en gång i rubriken). */
export function commonIncludes(cat: MenuCategory): string[] {
  const items = allItems(cat);
  if (items.length === 0) return [];
  const first = items[0].includes ?? [];
  return first.filter((inc) => items.every((it) => it.includes?.includes(inc)));
}

/** ["sås", "dricka"] -> "Sås och dricka ingår" */
export function includesText(list: string[]): string {
  if (list.length === 0) return "";
  const words = list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} och ${list.at(-1)}`;
  return `${capitalize(words)} ingår`;
}

export const price = (n: number) => `${n.toLocaleString("sv-SE")} kr`;

/** "125 kr" eller "145–160 kr" */
export function priceRange(items: MenuItem[]): string {
  const ps = items.map((i) => i.price);
  const lo = Math.min(...ps);
  const hi = Math.max(...ps);
  return lo === hi ? price(lo) : `${lo}–${hi} kr`;
}

/** Sök-sträng utan diakritiska tecken, så att "rakor" hittar "räkor". */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function searchText(item: MenuItem, cat: MenuCategory, group?: MenuGroup): string {
  return fold(
    [item.no, item.name, item.note, ...(item.ingredients ?? []), cat.title, group?.title].filter(Boolean).join(" "),
  );
}
