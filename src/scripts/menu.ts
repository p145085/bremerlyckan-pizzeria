// Sök, vegetariskt-filter och aktiv kategori-flik i menyn.

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const root = document.querySelector<HTMLElement>("#meny");

if (root) {
  const input = root.querySelector<HTMLInputElement>("[data-menu-search]")!;
  const vegBtn = root.querySelector<HTMLButtonElement>("[data-menu-veg]")!;
  const printBtn = root.querySelector<HTMLButtonElement>("[data-menu-print]");
  const clearBtn = root.querySelector<HTMLButtonElement>("[data-menu-clear]");
  const empty = root.querySelector<HTMLElement>("[data-menu-empty]")!;
  const live = root.querySelector<HTMLElement>("[data-menu-live]")!;
  const tabsNav = root.querySelector<HTMLElement>("[data-menu-tabs]")!;
  const tabsList = tabsNav.querySelector("ul")!;
  const tabs = [...tabsNav.querySelectorAll<HTMLAnchorElement>("[data-tab]")];
  const cats = [...root.querySelectorAll<HTMLElement>("[data-cat]")];
  const items = [...root.querySelectorAll<HTMLElement>("[data-item]")];

  let liveTimer = 0;

  // Kortare platshållartext på smala skärmar
  if (window.matchMedia("(max-width: 599px)").matches) input.placeholder = "Sök i menyn";

  function apply() {
    const tokens = fold(input.value.trim()).split(/\s+/).filter(Boolean);
    const vegOnly = vegBtn.getAttribute("aria-pressed") === "true";
    const filtering = tokens.length > 0 || vegOnly;
    let shown = 0;

    for (const item of items) {
      // Såser och drycker påverkas inte av veg-filtret (de är listor, inte rätter)
      const exempt = item.hasAttribute("data-veg-exempt");
      const hay = item.dataset.search ?? "";
      const matchText = tokens.every((t) => hay.includes(t));
      const matchVeg = !vegOnly || exempt || item.hasAttribute("data-veg");
      const ok = matchText && matchVeg;
      item.hidden = !ok;
      // Räkna bara rätter – såser/drycker räknas när man faktiskt söker på dem
      if (ok && (!exempt || tokens.length > 0)) shown++;
    }

    for (const cat of cats) {
      let catVisible = false;
      for (const group of cat.querySelectorAll<HTMLElement>("[data-group]")) {
        const any = group.querySelector("[data-item]:not([hidden])") !== null;
        group.hidden = !any;
        catVisible ||= any;
      }
      cat.hidden = !catVisible;
      const tab = tabs.find((t) => t.dataset.tab === cat.dataset.cat);
      tab?.classList.toggle("is-empty", !catVisible);
    }

    empty.hidden = !filtering || shown > 0;

    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => {
      live.textContent = filtering ? (shown === 0 ? "Inga rätter matchar." : `${shown} rätter visas.`) : "";
    }, 400);
  }

  function reset() {
    input.value = "";
    vegBtn.setAttribute("aria-pressed", "false");
    apply();
  }

  input.addEventListener("input", apply);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      apply();
    }
    if (e.key === "Enter") {
      // Hoppa till första träffen
      const first = items.find((i) => !i.hidden);
      first?.closest<HTMLElement>("[data-cat]")?.scrollIntoView({ block: "start" });
    }
  });
  vegBtn.addEventListener("click", () => {
    vegBtn.setAttribute("aria-pressed", String(vegBtn.getAttribute("aria-pressed") !== "true"));
    apply();
  });
  clearBtn?.addEventListener("click", () => {
    reset();
    input.focus();
  });
  printBtn?.addEventListener("click", () => {
    reset();
    window.print();
  });

  // ── Aktiv flik medan man scrollar ──
  function setActive(id: string) {
    for (const t of tabs) {
      const active = t.dataset.tab === id;
      if (active) t.setAttribute("aria-current", "true");
      else t.removeAttribute("aria-current");
      if (active) {
        const li = t.parentElement!;
        const left = li.offsetLeft - tabsList.clientWidth / 2 + li.clientWidth / 2;
        tabsList.scrollTo({ left, behavior: "smooth" });
      }
    }
  }

  const visible = new Map<string, boolean>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) visible.set((e.target as HTMLElement).dataset.cat!, e.isIntersecting);
      const current = cats.find((c) => !c.hidden && visible.get(c.dataset.cat!));
      if (current) setActive(current.dataset.cat!);
    },
    // Ett smalt band strax under sidhuvud + flikar avgör vilken kategori som är aktiv
    { rootMargin: "-160px 0px -65% 0px" },
  );
  cats.forEach((c) => io.observe(c));

  // Flikraden får bakgrund först när den klistrat fast under sidhuvudet.
  // (En scroll-kontroll i stället för IntersectionObserver, som missar hopp
  // rakt förbi gränsen, t.ex. via ankarlänkar.)
  const sentinel = root.querySelector<HTMLElement>("[data-tabs-sentinel]");
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (sentinel) {
    const updateStuck = () =>
      tabsNav.toggleAttribute("data-stuck", sentinel.getBoundingClientRect().top < (header?.offsetHeight ?? 64) + 1);
    let queued = false;
    window.addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          updateStuck();
        });
      },
      { passive: true },
    );
    updateStuck();
  }

  // Länk till en sökning: /?q=kebab#meny fyller i sökrutan
  const q = new URLSearchParams(location.search).get("q");
  if (q) {
    input.value = q;
    apply();
  }
}
