import type { APIRoute } from "astro";
import menu from "../data/menu.json";

export const GET: APIRoute = ({ site }) => {
  const url = new URL("/", site).href;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${url}</loc><lastmod>${menu.updated}</lastmod></url>
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
