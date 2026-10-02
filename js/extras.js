// ---------- the Room's extras: Day count, the Plant, lamps, the wall frame, the cat's welcome, both clocks ----------

// ----- Day count (from the anniversary in Settings) -----
const localDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
function dayCount() {
  if (!W.anniv) return null;
  const [y, m, d] = W.anniv.split("-").map(Number);
  return Math.max(1, Math.round((localDay() - new Date(y, m - 1, d)) / 864e5) + 1);
}
function dayLabel() { const n = dayCount(); return n ? "Day " + n.toLocaleString() : "Day 1"; }
function dayBadge() {
  $("dayb").replaceChildren(h("b", null, dayLabel()), h("small", null, "Our Little World"));
  $("tdayn").textContent = dayLabel();
}
function checkAnniversary() {
  if (!W.anniv) return;
  const [y, m, d] = W.anniv.split("-").map(Number), now = new Date();
  if (now.getMonth() + 1 !== m || now.getDate() !== d || now.getFullYear() <= y) return;
  const key = "anniv-" + now.getFullYear(); try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch (e) {}
  const yrs = now.getFullYear() - y;
  setTimeout(() => { confetti(); SFX.play("win"); toast("Happy anniversary ♥ " + yrs + " year" + (yrs > 1 ? "s" : "") + " together!"); }, 1500);
}

// ----- the Plant: grows while either of you waters it each day, droops when you both forget -----
const PLANT = { x: 58.9, y: 29.3, standX: 58.9, standY: 38 };
const todayKey = () => new Date().toISOString().slice(0, 10);   // the UTC day, the same date for both of you
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
function plantState() {
  const p = W.plant || {}, since = p.last ? daysBetween(p.last, todayKey()) : 0;
  return { stage: Math.min(6, Math.floor((p.days || 0) / 2)), mood: !p.last || since <= 1 ? "ok" : since === 2 ? "droopy" : "wilted", watered: p.last === todayKey(), days: p.days || 0 };
}
// pixel-art plant drawn on a 24x34 grid, then outlined like Pratiksha's sprites
const PLANT_ART = {};
function plantArt(stg, mood) {
  const id = stg + mood; if (PLANT_ART[id]) return PLANT_ART[id];
  const Wd = 24, Ht = 34, g = Array.from({ length: Ht }, () => Array(Wd).fill(null)), put = (x, y, c) => { if (x >= 0 && x < Wd && y >= 0 && y < Ht) g[y][x] = c; };
  // pot
  for (let x = 6; x <= 17; x++) { put(x, 24, "#f2a7bb"); put(x, 25, "#e991a8"); }
  for (let x = 8; x <= 15; x++) put(x, 24, "#5a3a2a");
  for (let y = 26; y <= 33; y++) { const i = Math.floor((y - 26) / 3); for (let x = 7 + i; x <= 16 - i; x++) put(x, y, x <= 8 + i ? "#fbc8d6" : x >= 15 - i ? "#c96a84" : "#e8899f"); }
  [[11, 28], [13, 28], [10, 29], [11, 29], [12, 29], [13, 29], [14, 29], [11, 30], [12, 30], [13, 30], [12, 31]].forEach(([x, y]) => put(x, y, "#fff4f7"));
  // stem and leaves
  const hgt = [2, 4, 7, 10, 13, 15, 16][stg], wilt = mood === "wilted", droop = mood !== "ok";
  const stem = wilt ? "#7d7a3c" : "#4f8a3c", leaf = wilt ? "#a07d4a" : droop ? "#a9c66a" : "#6cbf5a", hi = wilt ? "#c39b62" : droop ? "#cfe08c" : "#9be07f";
  let sx = 12;
  for (let i = 0; i < hgt; i++) { const y = 23 - i; if (wilt && i > hgt * .45) sx = 12 + Math.round((i - hgt * .45) * .55); else if (droop && i > hgt * .7) sx = 13; put(sx, y, stem); g[y]._x = sx; }
  const leafAt = (y, side, big) => { const x = (g[y] && g[y]._x) || 12, dir = side, d = droop ? 1 : 0;
    put(x + dir, y, leaf); put(x + 2 * dir, y - 1 + d, leaf); put(x + 3 * dir, y - 1 + d * 2, leaf); put(x + 2 * dir, y + d, hi);
    if (big) { put(x + 3 * dir, y - 2 + d * 2, leaf); put(x + 4 * dir, y - 2 + d * 3, hi); put(x + 1 * dir, y - 1, hi); } };
  for (let i = 0, y = 21; y > 23 - hgt + 1; y -= 3, i++) leafAt(y, i % 2 ? 1 : -1, stg >= 3);
  if (stg >= 4) for (let i = 0, y = 20; y > 23 - hgt + 2; y -= 4, i++) leafAt(y, i % 2 ? -1 : 1, stg >= 5);
  if (hgt <= 2) { put(11, 22, leaf); put(13, 22, leaf); }
  const top = 23 - hgt + 1, tx = (g[top] && g[top]._x) || 12;
  const flower = (x, y) => { const p = wilt ? "#b98a8a" : "#ff8fb1"; [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(([a, b]) => put(x + a, y + b, p)); put(x, y, wilt ? "#c9a95a" : "#ffd84d"); };
  if (stg === 5) { put(tx, top - 1, "#ff8fb1"); put(tx + 1, top - 1, "#ff8fb1"); put(tx, top - 2, "#ffb3c9"); }
  if (stg >= 6) { flower(tx, top - 2); flower(tx - 4, top + 3); flower(tx + 4, top + 5); }
  // outline
  const out = g.map(r => r.slice());
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) if (!g[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[y + b] && g[y + b][x + a])) out[y][x] = "#3a2430";
  const c = document.createElement("canvas"), s = 4; c.width = Wd * s; c.height = Ht * s; const x2 = c.getContext("2d");
  out.forEach((r, y) => r.forEach((col, x) => { if (col) { x2.fillStyle = col; x2.fillRect(x * s, y * s, s, s); } }));
  return PLANT_ART[id] = c.toDataURL();
}
function drawPlant() { const st = plantState(); $("plant").src = plantArt(st.stage, st.mood); $("plant").alt = "Our plant (" + (st.mood === "ok" ? "happy" : st.mood) + ")"; }
function waterPlant() {
  const k = me(), a = P[k]; closePanels(); if (pair) clearHold();
  a.pose = null; a.hold = 0; a.tx = PLANT.standX + (k === "g" ? -4.5 : 4.5); a.ty = PLANT.standY;   // beside the pot, not in front of it
  job = { k, do: () => {
    drops(PLANT.x, PLANT.y - 7); SFX.play("water");
    const st = plantState();
    if (st.watered) { const by = W.plant.by; toast("Our plant already had water today" + (by && by !== me() ? " from " + NAME[by] : "") + " ♥"); return; }
    setWorld({ plant: { days: st.days + 1, last: todayKey(), by: k } });
    const grew = plantState().stage > st.stage;
    toast(grew ? "Our plant grew! 🌱" : st.mood === "ok" ? "You watered our plant 💧" : "Our plant perks back up 💧");
    sparkle(PLANT.x, PLANT.y - 8, grew ? 9 : 4); if (grew) SFX.play("sparkle");
  } };
}
$("plant").onclick = e => { e.stopPropagation(); SFX.play("tap"); waterPlant(); };

// ----- lamps and the frame -----
hotspot("Bedside lamp", 1092, 118, 1146, 205, () => act("lamp"));
hotspot("Lamp", 1418, 428, 1474, 515, () => act("lamp"));
$("frame").onclick = e => { e.stopPropagation(); SFX.play("tap"); openPanel("memories"); };
function setFrame(thumb) { const f = $("frame"); if (!thumb) { f.classList.remove("on"); return; } f.querySelector("img").src = thumb; f.classList.add("on"); }

// ----- the cat comes to say hello -----
function catGreet(k) {
  if (cat.st === "eatgo" || cat.st === "eating") return;
  cat.who = k; goTo(P[k].x + (cat.x < P[k].x ? -6 : 6), P[k].y + .5, "visit");
  meow((W.catName ? W.catName + ": " : "") + "mrrp!");
}

// ----- both clocks: Pratiksha in Kolkata, Anubhav in Chicago -----
const CITY = { g: ["Kolkata", "Asia/Kolkata"], b: ["Chicago", "America/Chicago"] };
function cityTime(k) {
  const [c, tz] = CITY[k], d = new Date();
  const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: tz });
  const hr = +new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(d) % 24;
  return { city: c, time: t, day: hr >= 6 && hr < 18 };
}
function clocks() {
  ["g", "b"].forEach((k, i) => { const c = cityTime(k); $("clk" + (i + 1)).textContent = (c.day ? "☀ " : "☾ ") + c.city + " " + c.time; });
}
setInterval(clocks, 20000); clocks();

function worldExtras() {
  lightFx(); $("moon").classList.toggle("on", !!W.night); dayBadge(); drawPlant(); checkAnniversary();
}
