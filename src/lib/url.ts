// Länkar som fungerar både på egen domän (base "/") och i en undermapp,
// t.ex. förhandsvisningen på GitHub Pages: https://anvandare.github.io/repo/
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** withBase("/#meny") -> "/#meny" eller "/repo/#meny" */
export const withBase = (path = "/") => `${base}/${path.replace(/^\//, "")}`;

/** Byggt för förhandsvisning (noindex + infobanner)? */
export const isDemo = import.meta.env.PUBLIC_DEMO === "true";
