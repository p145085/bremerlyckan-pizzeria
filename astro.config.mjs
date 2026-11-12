// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // Slutlig adress – används för canonical-länkar, delningsbilder och sitemap.
  site: "https://www.bremerlyckanpizzeria.se",
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
  build: { inlineStylesheets: "auto" },
});
