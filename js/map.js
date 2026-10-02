// ---------- Our Map: Pins for places you've been and want to go, plus Kolkata ↔ Chicago ----------
// Leaflet and OpenStreetMap tiles are free for a site this small; they're only loaded when the map is opened.
const HOME = { g: [22.5726, 88.3639], b: [41.8781, -87.6298] };
let leaflet = null, mapObj = null, pinUnsub = null;
function loadLeaflet() {
  if (leaflet) return leaflet;
  return leaflet = new Promise((ok, no) => {
    document.head.append(h("link", { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" }));
    const s = h("script", { src: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" });
    s.onload = () => ok(window.L); s.onerror = () => { leaflet = null; no(); }; document.head.append(s);
  });
}
function km(a, b) {
  const R = 6371, r = d => d * Math.PI / 180, dl = r(b[0] - a[0]), dn = r(b[1] - a[1]);
  const x = Math.sin(dl / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dn / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}
definePanel("map", "Our Map", async body => {
  const t = cityTime("g"), u = cityTime("b"), d = km(HOME.g, HOME.b);
  body.append(h("div", { class: "row", style: "justify-content:space-between" },
    h("span", null, (t.day ? "☀ " : "☾ ") + NAME.g + " · Kolkata · " + t.time),
    h("b", { style: "color:var(--hot)" }, "♥ " + d.toLocaleString() + " km (" + Math.round(d * .621).toLocaleString() + " mi) ♥"),
    h("span", null, (u.day ? "☀ " : "☾ ") + NAME.b + " · Chicago · " + u.time)));
  const box = h("div", { style: "height:min(56vh,46cqw);min-height:280px;border-radius:10px;overflow:hidden;border:2px solid var(--edge)" });
  const hint = h("p", { class: "muted", style: "margin:0" }, "Tap anywhere on the map to drop a Pin.");
  const list = h("div", { style: "display:flex;flex-direction:column;gap:6px" });
  body.append(box, hint, list);
  let L;
  try { L = await loadLeaflet(); } catch (e) { box.replaceChildren(h("p", { class: "empty" }, "The map couldn't load. Check your connection.")); return; }
  if (openId !== "map") return;
  mapObj = L.map(box, { worldCopyJump: true, zoomControl: true }).setView([33, 0], 2);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(mapObj);
  const face = k => L.divIcon({ className: "", iconSize: [44, 44], iconAnchor: [22, 22],
    html: `<img src="assets/portrait-${k}.png" alt="" style="width:44px;height:44px;border-radius:50%;border:3px solid #EFA0B5;background:#fff;image-rendering:pixelated">` });
  L.marker(HOME.g, { icon: face("g"), title: NAME.g + " · Kolkata" }).addTo(mapObj);
  L.marker(HOME.b, { icon: face("b"), title: NAME.b + " · Chicago" }).addTo(mapObj);
  L.polyline([HOME.b, [52, 0], HOME.g], { color: "#E8506F", weight: 3, dashArray: "6 8", smoothFactor: 2 }).addTo(mapObj);
  const pinIcon = kind => L.divIcon({ className: "", iconSize: [26, 26], iconAnchor: [13, 24],
    html: `<div style="font-size:24px;line-height:1;color:${kind === "been" ? "#E8506F" : "#7a5bc7"};text-shadow:0 0 2px #fff,0 0 2px #fff">${kind === "been" ? "♥" : "♡"}</div>` });
  const layer = L.layerGroup().addTo(mapObj);
  const fit = () => { if (!mapObj) return; mapObj.invalidateSize(); mapObj.fitBounds([HOME.g, HOME.b], { padding: [36, 36] }); };
  fit(); setTimeout(fit, 260);
  if (!db) { hint.textContent = "Pins need our shared world."; return; }
  // drop a Pin: a little form in a popup
  mapObj.on("click", e => {
    const name = h("input", { class: "in", placeholder: "Place", maxLength: 60, style: "width:100%" });
    const note = h("input", { class: "in", placeholder: "A note (optional)", maxLength: 140, style: "width:100%" });
    let kind = "want";
    const kb = h("div", { class: "row" }, ["want", "been"].map(k => h("button", { class: "btn sm" + (k === kind ? " p" : ""), onclick: ev => { kind = k; kb.querySelectorAll("button").forEach(b => b.classList.toggle("p", b === ev.target)); } }, k === "been" ? "♥ Been there" : "♡ Want to go")));
    const save = h("button", { class: "btn p", style: "width:100%", onclick: () => {
      if (!name.value.trim()) return name.focus();
      db.collection("pins").add({ by: me(), name: name.value.trim(), note: note.value.trim(), kind, lat: e.latlng.lat, lng: e.latlng.lng, ts: Date.now() });
      mapObj.closePopup(); SFX.play("chime"); toast("Pinned ♥");
    } }, "Save Pin");
    L.popup({ minWidth: 220 }).setLatLng(e.latlng).setContent(h("div", { style: "display:flex;flex-direction:column;gap:6px;font-family:'Pixelify Sans',monospace" }, name, note, kb, save)).openOn(mapObj);
    setTimeout(() => name.focus(), 50);
  });
  pinUnsub = db.collection("pins").orderBy("ts", "desc").limit(300).onSnapshot(snap => {
    layer.clearLayers(); list.replaceChildren();
    snap.docs.forEach(d => { const p = d.data();
      const pop = h("div", { style: "font-family:'Pixelify Sans',monospace;display:flex;flex-direction:column;gap:4px" },
        h("b", null, p.name), p.note ? h("span", null, p.note) : null, h("small", null, (p.kind === "been" ? "♥ Been there" : "♡ Want to go") + " · added by " + who(p.by)),
        h("div", { class: "row" },
          h("button", { class: "btn sm", onclick: () => db.doc("pins/" + d.id).update({ kind: p.kind === "been" ? "want" : "been" }) }, p.kind === "been" ? "Mark want to go" : "We went! ♥"),
          h("button", { class: "btn sm", onclick: () => { if (confirm("Remove this Pin?")) db.doc("pins/" + d.id).delete(); } }, "Remove")));
      L.marker([p.lat, p.lng], { icon: pinIcon(p.kind), title: p.name }).bindPopup(pop).addTo(layer);
      list.append(h("button", { class: "card", style: "text-align:left;cursor:pointer", onclick: () => mapObj.flyTo([p.lat, p.lng], 9) },
        (p.kind === "been" ? "♥ " : "♡ ") , h("b", null, p.name), p.note ? " — " + p.note : ""));
    });
    if (!snap.docs.length) list.append(h("p", { class: "empty" }, "No Pins yet. Where should you two go first?"));
  }, () => {});
}, () => { pinUnsub && pinUnsub(); pinUnsub = null; if (mapObj) { mapObj.remove(); mapObj = null; } });
