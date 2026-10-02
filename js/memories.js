// ---------- Memories: Snapshots from the in-game Camera, and real photos you upload ----------
// Each Memory is two documents: mem/{id} (who, when, caption, a small thumbnail) and memimg/{id} (the full picture).
// Pictures are shrunk in the browser so they fit Firestore's free tier (see docs/adr/0003).
const IMG = {};
const loadImg = src => IMG[src] || (IMG[src] = new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }));

// a JPEG data URL no longer than maxChars, at most maxSide pixels on its long side
function shrink(src, maxSide, maxChars, q = .86) {
  const w0 = src.naturalWidth || src.width, h0 = src.naturalHeight || src.height;
  let scale = Math.min(1, maxSide / Math.max(w0, h0)), out = "";
  for (let tries = 0; tries < 8; tries++) {
    const c = document.createElement("canvas"); c.width = Math.round(w0 * scale); c.height = Math.round(h0 * scale);
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, 0, 0, c.width, c.height);
    out = c.toDataURL("image/jpeg", q);
    if (out.length <= maxChars) break;
    if (q > .55) q -= .1; else scale *= .82;
  }
  return out;
}

// ----- the Snapshot: the Room as it is right now, framed like a polaroid -----
async function takeSnapshot() {
  try {
    await document.fonts.load('40px "Pixelify Sans"').catch(() => {});
    const RW = 1536, RH = 856, c = document.createElement("canvas"); c.width = RW; c.height = RH;
    const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
    x.drawImage(await loadImg(BG), 0, 0, RW, RH, 0, 0, RW, RH);
    if (!W.night) {   // daytime sky in the window
      const sx = .442 * RW, sw = .222 * RW, sh = .154 * 1024, gr = x.createLinearGradient(0, 0, 0, sh);
      gr.addColorStop(0, "#7FC8F2"); gr.addColorStop(1, "#E3F5FF"); x.fillStyle = gr; x.fillRect(sx, 0, sw, sh);
      x.fillStyle = "#FFF6B8"; x.beginPath(); x.arc(sx + sw * .78, sh * .32, sh * .16, 0, 7); x.fill();
    }
    // the Day badge overlay, the bowl, the plant and everyone in the Room, back to front
    const items = [];
    const sprite = (key, xp, yp) => items.push({ key, x: xp, y: yp });
    if (pair) { if (pair.n === "photo") { sprite("g_happy", pair.x - 3.5, pair.y); sprite("b_happy", pair.x + 3.5, pair.y); } else sprite(pair.n, pair.x, pair.y); }
    else for (const k of ["g", "b"]) sprite(els[k]._k || k + "_idle", P[k].x, P[k].y);
    sprite(els.c._k || "cat_sit", cat.x, cat.y);
    items.sort((a, b) => a.y - b.y);
    const plant = await loadImg($("plant").src), pw = .054 * RW, ph = pw * plant.height / plant.width;
    x.drawImage(plant, PLANT.x / 100 * RW - pw / 2, PLANT.y / 100 * 1024 - ph, pw, ph);
    const bx = BOWL.x / 100 * RW, by = BOWL.y / 100 * 1024;
    x.fillStyle = "#E9799A"; x.strokeStyle = "#52303F"; x.lineWidth = 4; x.beginPath(); x.ellipse(bx, by - 14, 34, 16, 0, 0, Math.PI); x.fill(); x.stroke();
    for (const it of items) {
      const s = S[it.key], w = s.w * K, hh = s.h * K, img = await loadImg(SRC(it.key)), px = it.x / 100 * RW, py = it.y / 100 * 1024;
      const sg = x.createRadialGradient(px, py, 2, px, py, w * .34); sg.addColorStop(0, "rgba(45,12,32,.32)"); sg.addColorStop(1, "rgba(45,12,32,0)");
      x.fillStyle = sg; x.save(); x.translate(px, py); x.scale(1, .3); x.beginPath(); x.arc(0, 0, w * .34, 0, 7); x.restore(); x.fill();
      x.drawImage(img, px - w / 2, py - hh, w, hh);
    }
    if (!W.night) { x.fillStyle = "rgba(255,214,150,.16)"; x.fillRect(0, 0, RW, RH); }
    else if (W.lamp === false) { x.fillStyle = "rgba(12,6,32,.42)"; x.fillRect(0, 0, RW, RH); }
    else for (const [gx, gy, gs] of [[72.85, 15, 7], [94, 45.9, 8], [34.4, 15.3, 6]]) {
      const cx = gx / 100 * RW, cy = gy / 100 * 1024, r = gs / 100 * RW / 2, gr = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, "rgba(255,214,140,.26)"); gr.addColorStop(1, "rgba(255,190,120,0)"); x.fillStyle = gr; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    // polaroid frame with the day and date
    const pad = 40, bottom = 160, f = document.createElement("canvas"); f.width = RW + pad * 2; f.height = RH + pad + bottom;
    const y = f.getContext("2d"); y.fillStyle = "#fffaf6"; y.fillRect(0, 0, f.width, f.height); y.drawImage(c, pad, pad);
    y.fillStyle = "#7A2A46"; y.textAlign = "center"; y.font = '600 52px "Pixelify Sans", monospace';
    y.fillText(dayLabel() + "  ·  " + fmtDate(Date.now()), f.width / 2, RH + pad + 92);
    y.fillStyle = "#E8506F"; y.font = '40px "Pixelify Sans", monospace'; y.fillText("♥", pad + 40, RH + pad + 92); y.fillText("♥", f.width - pad - 40, RH + pad + 92);
    openPanel("snapshot", { data: shrink(f, 1600, 700000), kind: "snap" });
  } catch (e) { toast("The camera jammed. Try again?"); }
}

async function keepMemory(data, kind, caption) {
  if (!db) { toast("Memories need our shared world. Try again in a moment."); return false; }
  try {
    const full = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = data; });
    const thumb = shrink(full, 360, 45000, .74);
    const ref = db.collection("mem").doc();
    await db.doc("memimg/" + ref.id).set({ data });
    await ref.set({ by: me(), ts: Date.now(), kind, caption: (caption || "").slice(0, 200), thumb });
    SFX.play("chime"); hearts(50, 40, 6);
    if (LIVE) db.doc("live/event").set({ type: "memory", by: me(), ts: Date.now() }).catch(() => {});
    return true;
  } catch (e) { toast(e && e.code === "resource-exhausted" ? "This device is out of room for photos." : "Couldn't keep that one. Check your connection."); return false; }
}
// save a picture to the phone or computer (the share sheet on phones lets you "Save Image")
async function saveImage(data, name) {
  try {
    const blob = await (await fetch(data)).blob(), file = new File([blob], name, { type: "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia("(pointer:coarse)").matches) { await navigator.share({ files: [file], title: "Our Little World" }); return; }
    const a = h("a", { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch (e) { if (e && e.name !== "AbortError") toast("Couldn't save it here. Try a long-press on the picture."); }
}

definePanel("snapshot", "Snapshot", (body, el, arg) => {
  const img = h("img", { src: arg.data, alt: "Snapshot", style: "width:100%;max-height:52vh;object-fit:contain;border-radius:.4cqw;display:block" });
  const cap = h("input", { class: "in", placeholder: "Add a caption (optional)", maxLength: 200 });
  const keep = h("button", { class: "btn p", onclick: async () => { keep.disabled = true; keep.textContent = "Keeping…"; if (await keepMemory(arg.data, arg.kind, cap.value)) { toast("Kept in Memories ♥"); openPanel("memories"); } else { keep.disabled = false; keep.textContent = "Keep in Memories ♥"; } } }, "Keep in Memories ♥");
  body.append(img, cap, h("div", { class: "row" }, keep,
    h("button", { class: "btn", onclick: () => saveImage(arg.data, "our-little-world-" + todayKey() + ".jpg") }, "Save to device"),
    h("button", { class: "btn", onclick: () => closePanels() }, "Not this one")));
});

// ----- the Memories wall -----
let memUnsub = null;
async function uploadPhotos(files, cap, btn) {
  btn.disabled = true; let n = 0;
  for (const file of files) {
    btn.textContent = "Adding " + (++n) + " of " + files.length + "…";
    try {
      const bmp = await createImageBitmap(file);
      const ok = await keepMemory(shrink(bmp, 1600, 700000), "photo", cap);
      if (!ok) break;
    } catch (e) { toast("Couldn't read one of those photos."); }
  }
  btn.disabled = false; btn.textContent = "＋ Add photos"; toast(n > 1 ? "Added to Memories ♥" : "Added ♥");
}
definePanel("memories", "Memories", body => {
  const grid = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(min(30%,150px),1fr));gap:10px" });
  const cap = h("input", { class: "in", placeholder: "Caption for new photos (optional)", maxLength: 200, style: "flex:1" });
  const file = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true });
  const add = h("button", { class: "btn p", onclick: () => file.click() }, "＋ Add photos");
  file.onchange = () => { if (file.files.length) uploadPhotos([...file.files], cap.value, add); file.value = ""; };
  body.append(
    h("div", { class: "row" }, h("button", { class: "btn", onclick: () => { closePanels(); snapFlash(true); } }, "📷 Take a Snapshot"), add, file),
    h("div", { class: "row" }, cap), grid);
  grid.append(h("p", { class: "empty", style: "grid-column:1/-1" }, "Loading…"));
  if (!db) { grid.replaceChildren(h("p", { class: "empty", style: "grid-column:1/-1" }, "Memories need our shared world.")); return; }
  memUnsub && memUnsub();
  memUnsub = db.collection("mem").orderBy("ts", "desc").limit(90).onSnapshot(snap => {
    grid.replaceChildren();
    if (!snap.docs.length) grid.append(h("p", { class: "empty", style: "grid-column:1/-1" }, "No Memories yet. Take a Snapshot, or add a photo of the two of you."));
    snap.docs.forEach(d => { const m = d.data();
      grid.append(h("button", { class: "card", style: "padding:6px 6px 8px;cursor:pointer;display:flex;flex-direction:column;gap:4px;transform:rotate(" + ((d.id.charCodeAt(0) % 5) - 2) + "deg)", onclick: () => openPanel("memory", { id: d.id, m }) },
        h("img", { src: m.thumb, alt: m.caption || "A Memory", loading: "lazy", style: "width:100%;aspect-ratio:1.2;object-fit:cover;border-radius:4px" }),
        h("small", { style: "color:var(--soft);font-size:.78em;text-align:center;line-height:1.2" }, m.caption || fmtDate(m.ts)))); });
  }, () => grid.replaceChildren(h("p", { class: "empty" }, "Couldn't load Memories.")));
}, () => { memUnsub && memUnsub(); memUnsub = null; });

definePanel("memory", a => a.m.caption || "A Memory", async (body, el, a) => {
  const img = h("img", { alt: a.m.caption || "A Memory", src: a.m.thumb, style: "width:100%;max-height:60vh;object-fit:contain;display:block;border-radius:6px;background:#fff" });
  const save = h("button", { class: "btn p", disabled: true }, "Save to device");
  body.append(img, h("p", { class: "muted" }, (a.m.kind === "snap" ? "Snapshot" : "Photo") + " from " + who(a.m.by) + " · " + fmtWhen(a.m.ts)),
    h("div", { class: "row" }, save,
      h("button", { class: "btn", onclick: () => openPanel("memories") }, "← All Memories"),
      h("button", { class: "btn", onclick: async () => {
        if (!confirm("Remove this Memory for both of you?")) return;
        await Promise.all([db.doc("mem/" + a.id).delete(), db.doc("memimg/" + a.id).delete()]).catch(() => {});
        toast("Removed."); openPanel("memories");
      } }, "Remove")));
  try {
    const d = await db.doc("memimg/" + a.id).get();
    if (d.exists) { const data = d.data().data; img.src = data; save.disabled = false; save.onclick = () => saveImage(data, "our-memory-" + todayKey() + ".jpg"); }
  } catch (e) { toast("Couldn't load the full picture."); }
});
// the latest Memory hangs on the wall above the desk
function watchFrame() { db.collection("mem").orderBy("ts", "desc").limit(1).onSnapshot(s => setFrame(s.docs[0] && s.docs[0].data().thumb), () => {}); }
