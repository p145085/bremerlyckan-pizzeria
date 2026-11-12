// Alla länkar med [data-order] går till beställningen.
// Utan JavaScript fungerar de som vanliga länkar till webbshoppen.
import { ordering } from "../data/site.js";

const chooser = document.querySelector<HTMLDialogElement>("#order-dialog");
const frame = document.querySelector<HTMLDialogElement>("#order-frame");

/** Grov "registrerbar domän" – räcker för .se/.com/.nu */
const siteOf = (host: string) => host.replace(/^www\./, "").split(".").slice(-2).join(".");

function shouldEmbed(): boolean {
  if (!frame || typeof frame.showModal !== "function") return false;
  if (window.matchMedia("(max-width: 767px)").matches) return false; // mobil: samma flik
  const mode = ordering.direct.embed;
  if (mode === "never") return false;
  if (mode === "always") return true;
  // "auto": bara om webbshoppen ligger på samma webbplats, annars blockerar
  // webbläsare (Safari m.fl.) cookies i rutan och kassan slutar fungera.
  try {
    return siteOf(new URL(ordering.direct.url).hostname) === siteOf(location.hostname);
  } catch {
    return false;
  }
}

function openFrame() {
  if (!frame) return;
  const iframe = frame.querySelector("iframe");
  if (iframe && !iframe.getAttribute("src")) iframe.src = iframe.dataset.src ?? ordering.direct.url;
  frame.showModal();
}

document.addEventListener("click", (e) => {
  const link = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[data-order]");
  if (!link) return;
  // Låt ctrl/cmd-klick m.m. öppna i ny flik som vanligt
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const isDirect = link.dataset.order === "direct";
  if (chooser && !isDirect && typeof chooser.showModal === "function") {
    e.preventDefault();
    chooser.showModal();
    return;
  }
  if (shouldEmbed()) {
    e.preventDefault();
    chooser?.close();
    openFrame();
  }
});

for (const dialog of document.querySelectorAll<HTMLDialogElement>("dialog")) {
  dialog.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", () => dialog.close()));
  // Klick på bakgrunden stänger
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
}
