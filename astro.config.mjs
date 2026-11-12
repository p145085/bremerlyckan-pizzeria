// @ts-check
import { defineConfig } from "astro/config";

// Slutlig adress – används för canonical-länkar, delningsbilder och sitemap.
// Kan skrivas över vid bygget, t.ex. för förhandsvisningen på GitHub Pages:
//   SITE_URL=https://anvandare.github.io BASE_PATH=/repo-namn PUBLIC_DEMO=true npm run build
const site = process.env.SITE_URL || "https://www.bremerlyckanpizzeria.se";
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
  build: { inlineStylesheets: "auto" },
});
