// Visar "Öppet nu / Stängt" live och markerar dagens rad i öppettiderna.
import { site } from "../data/site.js";
import { getStatus, stockholmNow } from "../lib/hours";

function update() {
  const now = stockholmNow();
  const st = getStatus(site.hours, now);
  const state = st.open ? (st.soon ? "soon" : "open") : "closed";

  for (const el of document.querySelectorAll<HTMLElement>("[data-status]")) {
    el.dataset.state = state;
    const text = el.querySelector<HTMLElement>("[data-status-text]");
    if (text) text.textContent = el.dataset.statusFormat === "short" ? st.text.split(" · ")[0] : st.text;
  }

  for (const row of document.querySelectorAll<HTMLElement>("[data-days]")) {
    const days = (row.dataset.days ?? "").split(",").map(Number);
    row.classList.toggle("is-today", days.includes(now.weekday));
  }

  // Avvikande dagar som redan passerat döljs (sidan kan ha byggts för länge sedan)
  for (const row of document.querySelectorAll<HTMLElement>("[data-special-date]")) {
    row.hidden = (row.dataset.specialDate ?? "") < now.date;
  }
  for (const block of document.querySelectorAll<HTMLElement>("[data-special-block]")) {
    block.hidden = block.querySelector("[data-special-date]:not([hidden])") === null;
  }
}

update();
window.setInterval(update, 30_000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) update();
});
