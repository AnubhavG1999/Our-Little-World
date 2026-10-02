// ---------- the wardrobe: Outfit colours painted over Pratiksha's sprites, keeping her shading ----------
// Her sprites are small paintings (thousands of colours), so a colour swap won't do. Instead each clothing item
// is found by its colour family inside a body band, cleaned up to its big connected patches, grown into the
// soft edge pixels, then repainted with the new colour following the original light and shadow.
const WARD = (() => {
  const hsv = (r, g, b) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn; let h = 0;
    if (c) h = mx === r ? ((g - b) / c + 6) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4;
    return [h * 60, mx ? c / mx : 0, mx / 255, c / 255];
  };
  const hueIn = (h, a, b) => a <= b ? h >= a && h <= b : (h >= a || h <= b);
  // strict = the item's own colours, loose = its antialiased edge, band = where on the body (0 top .. 1 feet)
  const ITEMS = {
    g: {
      top:    { band: [.48, .80], strict: (h, s, v) => hueIn(h, 332, 6) && s > .45 && v < .75 && v > .10, loose: (h, s, v) => hueIn(h, 325, 10) && s > .30 && v < .85 },
      bottom: { band: [.52, .93], strict: (h, s, v) => hueIn(h, 195, 245) && s > .20 && v > .12, loose: (h, s, v) => hueIn(h, 185, 255) && s > .10 },
    },
    b: {
      top:    { band: [.50, .82], strict: (h, s, v) => s < .26 && v > .70, loose: (h, s, v) => s < .34 && v > .52 },
      bottom: { band: [.55, .93], strict: (h, s, v, c) => v < .30 && v > .07 && c < .10, loose: (h, s, v, c) => v < .40 && v > .04 && c < .14 },
    },
  };
  const EXCLUDE = { b_type: [.18, .55, .80, .84] };           // the laptop lid in the typing pose
  const PAIR_BAND = { g: [.3, 1], b: [.3, .8] };               // painted bubble icons sit above .3; his shoes below .8
  const PALETTE = {
    g: { top: [["Original", null], ["Blush", "#e3a0b2"], ["Rose", "#d98ca0"], ["Lavender", "#b7a3d8"], ["Sage", "#9fbf98"], ["Cream", "#efe3cf"], ["Sky", "#9cc3e0"], ["White", "#f6f2ee"], ["Black", "#2f2a2e"]],
         bottom: [["Original", null], ["Black", "#2f2a2e"], ["Light wash", "#8fb0d4"], ["Cream", "#e3d6bd"], ["Lavender", "#9a86b8"], ["Rose", "#c98a9b"], ["Olive", "#6f7350"], ["Brown", "#6b4a3a"]] },
    b: { top: [["Original", null], ["Navy", "#3b4a78"], ["Sage", "#9fbf98"], ["Match her", "match"], ["Rose", "#d9a0ae"], ["Sky", "#9cc3e0"], ["Lilac", "#b7a3d8"], ["Olive", "#6f7350"], ["Black", "#2f2a2e"]],
         bottom: [["Original", null], ["Denim", "#4a6ea8"], ["Light wash", "#8fb0d4"], ["Khaki", "#d8c8a8"], ["Olive", "#6f7350"], ["Brown", "#6b4a3a"], ["Grey", "#6b6b72"]] },
  };
  const OUT = { g: { top: null, bottom: null }, b: { top: null, bottom: null } };
  const BASE = {}, MASK = {}, CACHE = {};
  let building = 0;

  async function base(key) {
    if (BASE[key]) return BASE[key];
    const img = new Image(); img.src = S[key].src; await img.decode();
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0);
    return BASE[key] = x.getImageData(0, 0, c.width, c.height);
  }
  function mask(im, rule, minFrac, ex) {
    const { width: W, height: H, data: d } = im, n = W * H, strict = new Uint8Array(n), loose = new Uint8Array(n);
    for (let p = 0; p < n; p++) {
      const i = p * 4; if (d[i + 3] < 200) continue;
      const y = (p / W | 0) / H, x = (p % W) / W;
      if (ex && x >= ex[0] && x <= ex[2] && y >= ex[1] && y <= ex[3]) continue;
      const [hh, s, v, c] = hsv(d[i], d[i + 1], d[i + 2]);
      if (rule.loose(hh, s, v, c)) loose[p] = 1;
      if (y >= rule.band[0] && y <= rule.band[1] && rule.strict(hh, s, v, c)) strict[p] = 1;
    }
    const lab = new Int32Array(n), sizes = [0]; let L = 0;
    for (let p = 0; p < n; p++) {
      if (!strict[p] || lab[p]) continue; L++; let sz = 0; const st = [p]; lab[p] = L;
      while (st.length) { const q = st.pop(); sz++; const qx = q % W;
        for (const r of [q - W, q + W, qx > 0 ? q - 1 : -1, qx < W - 1 ? q + 1 : -1]) if (r >= 0 && r < n && strict[r] && !lab[r]) { lab[r] = L; st.push(r); } }
      sizes.push(sz);
    }
    const big = Math.max(0, ...sizes), keep = sizes.map(s => s >= Math.max(30, big * minFrac));
    const m = new Uint8Array(n); for (let p = 0; p < n; p++) if (lab[p] && keep[lab[p]]) m[p] = 1;
    for (let pass = 0; pass < 2; pass++) {
      const add = [];
      for (let p = 0; p < n; p++) { if (m[p] || !loose[p]) continue; const px = p % W;
        if ((p >= W && m[p - W]) || (p < n - W && m[p + W]) || (px > 0 && m[p - 1]) || (px < W - 1 && m[p + 1])) add.push(p); }
      add.forEach(p => m[p] = 1);
    }
    return m;
  }
  function maskOf(key, k, part, im) {
    const id = key + ":" + k + part; if (MASK[id]) return MASK[id];
    const solo = /^[gb]_/.test(key), r = ITEMS[k][part];
    return MASK[id] = solo ? mask(im, r, .3, EXCLUDE[key]) : mask(im, { ...r, band: PAIR_BAND[k] }, .15, EXCLUDE[key]);
  }
  const lum = (r, g, b) => (.299 * r + .587 * g + .114 * b) / 255;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function paint(im, m, target, k = .75) {
    const d = im.data, T = hex(target), tY = lum(...T); let sum = 0, cnt = 0;
    for (let p = 0; p < m.length; p++) if (m[p]) { const i = p * 4; sum += lum(d[i], d[i + 1], d[i + 2]); cnt++; }
    if (!cnt) return; const mY = sum / cnt;
    for (let p = 0; p < m.length; p++) { if (!m[p]) continue; const i = p * 4;
      const rel = (lum(d[i], d[i + 1], d[i + 2]) - mY) / Math.max(mY, .08), f = 1 + k * rel * (tY < .35 ? .8 : 1);
      for (let ch = 0; ch < 3; ch++) { let v = T[ch] * f; if (v > 255) v = 255 - (v - 255) * .2; d[i + ch] = Math.max(0, Math.min(255, v)); } }
  }
  const colour = (k, part) => { const c = OUT[k][part]; return c === "match" ? (OUT.g.top || "#7a2a3a") : c; };
  function parts(key) {
    if (key.startsWith("cat")) return [];
    if (/^[gb]_/.test(key)) { const k = key[0]; return ["top", "bottom"].filter(p => OUT[k][p]).map(p => [k, p]); }
    return [["g", "top"], ["g", "bottom"], ["b", "top"]].filter(([k, p]) => OUT[k][p]);   // his dark pants match his hair in shared pictures
  }
  async function render(key, out) {
    const ps = parts(key); if (!ps.length) return null;
    const b = await base(key), im = new ImageData(new Uint8ClampedArray(b.data), b.width, b.height);
    for (const [k, p] of ps) paint(im, maskOf(key, k, p, b), colour(k, p));
    const c = document.createElement("canvas"); c.width = b.width; c.height = b.height; c.getContext("2d").putImageData(im, 0, 0);
    return c.toDataURL();
  }
  // repaint every sprite that the current Outfits touch (a few at a time so the room keeps moving)
  async function rebuild() {
    const run = ++building, first = me() + "_idle";
    for (const key of [first, ...Object.keys(S).filter(k => k !== first)]) {
      if (run !== building) return;
      try { const url = await render(key); if (run !== building) return; if (url) CACHE[key] = url; else delete CACHE[key]; } catch (e) { delete CACHE[key]; }
      if (key === first && openId === "wardrobe") rerender("wardrobe");
      await new Promise(r => setTimeout(r, 0));
    }
  }
  function set(k, o) {
    const nt = o && o.top || null, nb = o && o.bottom || null;
    if (OUT[k].top === nt && OUT[k].bottom === nb) return;
    OUT[k].top = nt; OUT[k].bottom = nb; rebuild();
  }
  return { OUT, PALETTE, set, rebuild, src: key => CACHE[key] || S[key].src, render };
})();
const SRC = WARD.src;

definePanel("wardrobe", "Wardrobe", body => {
  const k = me(), pal = WARD.PALETTE[k], cur = WARD.OUT[k];
  const prev = h("img", { alt: "Your outfit", style: "height:min(34vh,22cqw);image-rendering:pixelated;display:block;margin:auto" });
  const draw = () => { const url = SRC(k + "_idle"); prev.src = url; };
  draw();
  const choose = (part, val) => {
    const next = { ...cur, [part]: val }; WARD.set(k, next); SFX.play("sparkle");
    if (db) db.doc("outfit/" + k).set({ top: next.top, bottom: next.bottom, ts: Date.now() }).catch(() => toast("That didn't save. Check your connection."));
    sparkle(P[k].x, P[k].y - 8, 6);
    setTimeout(() => rerender("wardrobe"), 120);
  };
  const row = part => h("div", { class: "row" }, pal[part].map(([label, c]) => h("button", {
    class: "sw" + (c ? "" : " orig") + ((cur[part] || null) === c ? " on" : ""), title: label, "aria-label": label,
    style: c ? "background:" + (c === "match" ? (WARD.OUT.g.top || "#7a2a3a") : c) : "", onclick: () => choose(part, c)
  })));
  body.append(
    h("div", { class: "card", style: "background:linear-gradient(#fff,#FFE9EF)" }, prev),
    h("h4", null, "Top"), row("top"),
    h("h4", null, "Bottoms"), row("bottom"),
    h("p", { class: "muted" }, "The colours keep ", NAME.g, "'s shading. In some together-moments a few pieces keep their original colours. Real new outfits come later, from her."));
  setTimeout(draw, 400);   // the repaint takes a moment the first time
});
