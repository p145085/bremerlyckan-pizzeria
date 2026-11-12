# Bremerlyckan Pizzeria – webbplats

Ny webbplats för Bremerlyckan Pizzeria, Vegagatan 2B i Kalmar. Byggd med [Astro](https://astro.build)
som en helt statisk sajt: snabb, billig att hosta och utan databas.

- **Hela menyn** med priser och ingredienser (92 rätter), sök, vegetariskt-filter och utskriftsvänlig layout
- **Beställ online** via restaurangens FoodToday-webbshop – och färdigt stöd för **Wolt, foodora, Uber Eats och Bolt Food**
- **Karta** (OpenStreetMap) med vägbeskrivning till Google Maps och Apple Kartor
- **Öppettider** med live-status ("Öppet nu · till 20:15") i svensk tid
- Strukturerad data för Google (adress, öppettider, meny, beställningsknapp), sitemap och delningsbild

## Kom igång

Kräver Node.js 20.3 eller senare.

```bash
npm install
npm run dev        # utvecklingsserver på http://localhost:4321
npm run build      # bygger den färdiga sajten till dist/
npm run preview    # förhandsgranska bygget
npm run check      # typkontroll
```

## Vanliga ändringar

Allt som rör restaurangen ligger i `src/data/` – du behöver inte röra komponenterna.

| Vad                                         | Fil                        |
| ------------------------------------------- | -------------------------- |
| Adress, telefon, koordinater, sociala medier | `src/data/site.js`         |
| Öppettider och avvikande dagar (jul m.m.)   | `src/data/site.js` → `hours` |
| Beställningslänkar (FoodToday, Wolt …)      | `src/data/site.js` → `ordering` |
| Menyn                                       | `src/data/menu.json`       |
| Bilder                                      | `src/assets/photos/`       |

### Avvikande öppettider

```js
special: [
  { date: "2026-12-24", label: "Julafton", closed: true },
  { date: "2026-12-31", label: "Nyårsafton", open: "12:00", close: "17:00" },
],
```

De visas under öppettiderna, påverkar "Öppet nu"-statusen och döljs automatiskt när datumet passerat.

### Koppla Wolt, foodora, Uber Eats …

Klistra in restaurangens länk hos tjänsten i `ordering.partners` i `src/data/site.js`:

```js
{ id: "wolt", name: "Wolt", url: "https://wolt.com/sv/swe/kalmar/restaurant/…", color: "#009DE0" },
```

Så fort en länk är ifylld:

- öppnar alla "Beställ"-knappar en ruta där kunden väljer *Direkt hos oss* (FoodToday) eller en leveranstjänst,
- visas "Finns även på Wolt · …" under knapparna i toppen och i sidfoten,
- läggs länken till i Googles strukturerade data.

Utan ifyllda länkar går "Beställ online" direkt till webbshoppen, utan mellansteg. Fler tjänster lägger du
till i samma format.

> Vill restaurangen få in Wolt-, foodora- och Uber Eats-beställningarna i *ett* system (samma surfplatta och
> en meny som uppdateras på ett ställe) är det en tjänst hos beställningsleverantören eller en så kallad
> aggregator – inte något som webbplatsen styr. Sajten länkar bara till rätt ställe.

### Hur webbshoppen öppnas

`ordering.direct.embed` styr hur FoodToday-shoppen öppnas på dator:

- `"auto"` (standard): i en ruta ovanpå sidan *om* shoppen ligger på samma domän som sajten, annars i samma
  flik. Webbläsare (särskilt Safari) blockerar cookies i inbäddade rutor från andra domäner, och då slutar
  kassan att fungera – därför är detta det säkra valet.
- `"always"` / `"never"`: alltid ruta / alltid samma flik.

På mobil öppnas shoppen alltid i samma flik.

## Menyn och FoodToday

Menyn är hämtad från FoodToday (samma meny som i beställningsrutan) och sparad i `src/data/menu.json`.
Varje rätt har sitt FoodToday-id (`ft`), så priser och ingredienser kan hållas i synk:

```bash
npm run sync-menu                       # visa skillnader mot FoodToday (ändrar inget)
npm run sync-menu -- --write            # spara nya priser/ingredienser
npm run sync-menu -- --write --add-new  # lägg även till nya rätter i rätt kategori
```

Namn, ordning, kategorier och veg-märkning ändras aldrig automatiskt – de redigeras för hand i
`menu.json`. Skriptet läser FoodTodays HTML (de har inget öppet API), så det kan behöva justeras om
FoodToday ändrar sin sida.

Följande är medvetet bortvalt jämfört med FoodToday (se `ignoredFtCategories`/`ignoredFtItems` i
`menu.json`):

- Kategorin *Kebabrätter* – samma rätter som *Rullar & pitabröd* och *Tallrikar*.
- Lökringar/chili cheese som *tillval* (billigare när de läggs till en rätt) – de står under *Chicken & snacks*.
- Tomma kategorier (Ben & Jerry's, Choklad, Snacks/Godis).

## Kartan

Kartan använder [Leaflet](https://leafletjs.com) och OpenStreetMaps kartbilder. Den laddas först när
besökaren scrollar ner mot den, sätter inga cookies och kräver ingen API-nyckel. Positionen styrs av
`site.geo` i `src/data/site.js`.

## Förhandsvisning på GitHub Pages

Varje push till `main` bygger och publicerar en förhandsvisning via GitHub Actions
(`.github/workflows/deploy-pages.yml`) på `https://<användare>.github.io/<repo>/`.

Förhandsvisningen byggs med tre miljövariabler:

| Variabel      | Exempel                          | Gör                                                   |
| ------------- | -------------------------------- | ----------------------------------------------------- |
| `SITE_URL`    | `https://p145085.github.io`      | adress för canonical-länkar och delningsbild          |
| `BASE_PATH`   | `/bremerlyckan-pizzeria`         | sajten ligger i en undermapp i stället för på roten   |
| `PUBLIC_DEMO` | `true`                           | `noindex` (syns inte i Google) och en "Förhandsvisning"-rad |

Samma sak lokalt:

```bash
SITE_URL=https://p145085.github.io BASE_PATH=/bremerlyckan-pizzeria PUBLIC_DEMO=true npm run build
```

Utan variablerna byggs den riktiga sajten för `https://www.bremerlyckanpizzeria.se`.

## Publicera

Sajten är statisk – `npm run build` ger mappen `dist/` som kan läggas på valfritt webbhotell
(Netlify, Cloudflare Pages, Vercel, GitHub Pages eller vanlig FTP-uppladdning).

- Byggkommando: `npm run build`
- Publiceringsmapp: `dist`
- Slutlig adress är förvald i `astro.config.mjs` (`site`) och används för canonical-länkar, delningsbild
  och sitemap. Bygg utan `PUBLIC_DEMO`, annars får sidan `noindex`.

### Viktigt om domänen

FoodTodays beställningsapp ligger idag på `https://www.bremerlyckanpizzeria.se/app/`, alltså på samma
domän som den gamla sajten (som FoodToday hostar). Om domänen pekas om till den nya sajten slutar `/app/`
att fungera. Innan bytet: be FoodToday om en egen adress för appen (t.ex.
`bestall.bremerlyckanpizzeria.se`) och lägg in den i `ordering.direct.url`. Ligger appen på en
underdomän till samma domän kan den dessutom öppnas i en ruta ovanpå sidan (se `embed` ovan).

Länken till köpvillkoren (`ordering.direct.termsUrl`) pekar också på den gamla sajten och behöver
uppdateras samtidigt.

## Bilder

Matbilderna kommer från restaurangens meny i FoodToday och har frilagts (bakgrunden borttagen) för
webbplatsen. Kontrollera att restaurangen får använda dem utanför FoodToday – eller, ännu bättre, byt till
egna foton. Lägg dem i `src/assets/photos/` (PNG med transparent bakgrund ger bäst resultat i toppen och
i bildbandet). Astro konverterar och skalar bilderna automatiskt vid bygget (AVIF/WebP).

Logotypen (`src/assets/brand/logo-round.png`) och slottssilhuetten i sidfoten (`src/assets/brand/castle.webp`)
är tagna från restaurangens logotyp.

## Teknik

- Astro 5, eftersom det fungerar med Node 20. Astro 7 kräver Node 22.23 eller senare. Koden är testad med
  Astro 7.4 på Node 22: den bygger utan ändringar, `astro check` ger 0 fel och `npm audit` 0 sårbarheter.
  När ni kör Node 22 eller nyare, uppgradera med:

  ```bash
  npm install astro@latest @astrojs/check@latest
  ```

- På Astro 5 varnar `npm audit` för kända brister. De gäller server-rendering, uppladdade bilder och
  osäker indata. Inget av det används här, eftersom sajten byggs statiskt från egna filer. Uppgradera ändå
  när ni har Node 22. `sharp` är redan låst till en patchad version via `overrides` i `package.json`.
- Typsnitten (Noto Serif Display och Archivo, SIL Open Font License) ligger lokalt i `src/assets/fonts/` –
  inga anrop till Google Fonts.
- Ingen spårning, inga cookies.

```
src/
  components/   Header, Hero, Menu, Visit (karta + öppettider), Footer, OrderDialogs …
  data/         site.js (restaurangen) och menu.json (menyn)
  lib/          öppettidslogik, menyhjälpare och länkar (withBase)
  scripts/      lite JavaScript för sök, status, karta och beställning
  styles/       global.css (färger, typsnitt, knappar)
scripts/        sync-menu.mjs – synkar menyn mot FoodToday
```
