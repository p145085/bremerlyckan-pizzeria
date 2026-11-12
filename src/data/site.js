// @ts-check
// ─────────────────────────────────────────────────────────────────────────────
//  Allt som rör restaurangen samlat på ett ställe. Ändra här – sidan,
//  kartan, öppettiderna, sökmotordatan och beställningsknapparna följer med.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {{ days: number[], open: string, close: string }} WeeklyHours
 *   days: 1 = måndag … 7 = söndag. Tider i 24h-format "HH:MM" (svensk tid).
 * @typedef {{ date: string, label?: string, closed?: boolean, open?: string, close?: string }} SpecialDay
 *   Avvikande dag, t.ex. { date: "2026-12-24", label: "Julafton", closed: true }
 * @typedef {{ id: string, name: string, url: string, color: string }} Partner
 */

export const site = {
  name: "Bremerlyckan Pizzeria",
  shortName: "Bremerlyckan",
  city: "Kalmar",
  description:
    "Pizzeria på Vegagatan 2B i Kalmar. Se hela menyn med priser – pizza, kebab, sallader och burgare – och beställ online för avhämtning eller hemkörning.",

  phone: { display: "0480-42 22 24", href: "tel:+46480422224" },

  address: {
    street: "Vegagatan 2B",
    postalCode: "392 46",
    city: "Kalmar",
    country: "SE",
  },

  // Koordinater för kartan (samma punkt som den gamla sidans Google-karta)
  geo: { lat: 56.6621566, lng: 16.3470877 },

  company: { name: "Kareme I AB", orgNr: "559585-4802" },

  hours: {
    /** @type {WeeklyHours[]} */
    weekly: [
      { days: [1, 2, 3, 4, 5], open: "11:00", close: "20:15" },
      { days: [6, 7], open: "11:45", close: "20:15" },
    ],
    /** @type {SpecialDay[]} Avvikande öppettider (helgdagar m.m.) */
    special: [
      // { date: "2026-12-24", label: "Julafton", closed: true },
      // { date: "2026-12-31", label: "Nyårsafton", open: "12:00", close: "17:00" },
    ],
    note: "Samma tider för avhämtning och hemkörning.",
  },

  /** Sociala medier – lämna tomt för att dölja. */
  social: {
    facebook: "",
    instagram: "",
  },
};

export const ordering = {
  /**
   * Restaurangens egen webbshop (FoodToday). Lyfts alltid fram först –
   * där betalar restaurangen ingen provision till en leveranstjänst.
   *
   * OBS: Beställningsappen ligger idag på /app/ under den gamla domänen.
   * Om domänen flyttas till den nya sajten behöver FoodToday ge appen en
   * egen adress (t.ex. bestall.bremerlyckanpizzeria.se) – byt url här då.
   */
  direct: {
    name: "FoodToday",
    url: "https://www.bremerlyckanpizzeria.se/app/",
    /**
     * Hur knappen "Beställ online" öppnar webbshoppen på datorer:
     *  "auto"   – i en ruta ovanpå sidan om webbshoppen ligger på samma domän
     *             som sajten (annars i samma flik, eftersom webbläsare blockerar
     *             cookies i inbäddade rutor från andra domäner)
     *  "always" – alltid i en ruta ovanpå sidan
     *  "never"  – alltid i samma flik
     * På mobil öppnas den alltid i samma flik.
     * @type {"auto" | "always" | "never"}
     */
    embed: "auto",
    /** Parametrar som FoodToday använder när appen visas inbäddad. */
    embedParams: "BuiltIn=True&BuiltInType=modal",
    termsUrl: "https://www.bremerlyckanpizzeria.se/kopvillkor.aspx",
  },

  /**
   * Leveranstjänster. Klistra in länken till restaurangens sida hos tjänsten
   * så visas den automatiskt i beställningsrutan, i hero och i sidfoten.
   * Tom url = dold. Lägg gärna till fler i samma format.
   * @type {Partner[]}
   */
  partners: [
    { id: "wolt", name: "Wolt", url: "", color: "#009DE0" },
    { id: "foodora", name: "foodora", url: "", color: "#D70F64" },
    { id: "ubereats", name: "Uber Eats", url: "", color: "#06C167" },
    { id: "bolt", name: "Bolt Food", url: "", color: "#2A9D63" },
  ],
};

/** Partners med ifylld länk */
export const activePartners = ordering.partners.filter((p) => p.url.trim() !== "");

/** Länkar till kartappar */
export const mapLinks = {
  directions: `https://www.google.com/maps/dir/?api=1&destination=${site.geo.lat},${site.geo.lng}`,
  google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${site.name}, ${site.address.street}, ${site.address.city}`,
  )}`,
  apple: `https://maps.apple.com/?daddr=${site.geo.lat},${site.geo.lng}&q=${encodeURIComponent(site.name)}`,
};
