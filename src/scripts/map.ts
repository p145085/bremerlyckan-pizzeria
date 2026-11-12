// Laddar kartan (Leaflet + OpenStreetMap) först när den närmar sig skärmen,
// så att startsidan förblir snabb.

const el = document.querySelector<HTMLElement>("[data-map]");

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function init(node: HTMLElement) {
  const [{ default: L }] = await Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]);
  const { lat, lng, name = "", address = "", directions = "", logo = "" } = node.dataset;
  const pos: [number, number] = [Number(lat), Number(lng)];

  node.querySelector(".map-fallback")?.remove();

  const map = L.map(node, {
    center: pos,
    zoom: 15,
    scrollWheelZoom: false,
    // På mobil: en finger scrollar sidan, kartan zoomas med knapparna eller två fingrar
    dragging: !L.Browser.mobile,
    attributionControl: true,
  });
  map.attributionControl.setPrefix(false);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare',
  }).addTo(map);

  const icon = L.divIcon({
    className: "map-pin",
    html: `<span class="map-pin-badge"><img src="${esc(logo)}" alt="" width="56" height="56"></span><span class="map-pin-pulse"></span>`,
    iconSize: [64, 76],
    iconAnchor: [32, 76],
    popupAnchor: [0, -74],
    tooltipAnchor: [34, -44],
  });

  const marker = L.marker(pos, { icon, title: name, alt: name, keyboard: true, riseOnHover: true }).addTo(map);
  marker.bindTooltip(esc(name), { permanent: true, direction: "right", className: "map-label", offset: [4, 0] });
  marker.bindPopup(
    `<strong>${esc(name)}</strong><br>${esc(address)}<br><a href="${esc(directions)}" target="_blank" rel="noopener">Vägbeskrivning →</a>`,
  );

  // Kartan kan ha fått sin storlek efter att den skapades (t.ex. grid-layout)
  requestAnimationFrame(() => map.invalidateSize());
}

if (el) {
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          init(el).catch((err) => console.error("Kartan kunde inte laddas", err));
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
  } else {
    init(el);
  }
}
