// ---------- little touches: sparkles, hearts, fireflies, lamp glow, sunbeam, tap rings ----------
function particle(x, y, ch, o = {}) {
  const e = document.createElement("i"); e.className = "pt"; e.textContent = ch;
  e.style.cssText = `left:${x}%;top:${y}%;font-size:${o.size || 1.6}cqw;${o.color ? "color:" + o.color : ""};z-index:${o.z || 1800}`;
  e.style.setProperty("--dx", (o.dx || 0) + "cqw"); e.style.setProperty("--dy", (o.dy ?? -6) + "cqw");
  e.style.setProperty("--d", (o.d || 1.6) + "s"); e.style.setProperty("--r", (o.r || 0) + "deg"); e.style.setProperty("--s", o.s || 1);
  stage.appendChild(e); setTimeout(() => e.remove(), (o.d || 1.6) * 1000 + 60);
}
const rnd = (a, b) => a + Math.random() * (b - a);
function sparkle(x, y, n = 5) {
  for (let i = 0; i < n; i++) setTimeout(() => particle(x + rnd(-4, 4), y + rnd(-3, 3), Math.random() < .5 ? "✦" : "✧",
    { color: ["#FFD86B", "#fff", "#F7A8C4"][i % 3], size: rnd(1, 1.9), dx: rnd(-1.5, 1.5), dy: rnd(-5, -2), d: rnd(.9, 1.5), r: rnd(-60, 60) }), i * 70);
}
function hearts(x, y, n = 6) {
  for (let i = 0; i < n; i++) setTimeout(() => particle(x + rnd(-3, 3), y + rnd(-2, 1), "♥",
    { color: ["#E8506F", "#F7A8C4", "#ff7a9a"][i % 3], size: rnd(1.4, 2.4), dx: rnd(-2, 2), dy: rnd(-8, -5), d: rnd(1.3, 2), r: rnd(-25, 25) }), i * 90);
}
function drops(x, y) {
  for (let i = 0; i < 7; i++) setTimeout(() => particle(x + rnd(-1.5, 1.5), y + rnd(-1, 1), "💧",
    { size: rnd(.8, 1.2), dx: rnd(-1, 1), dy: rnd(2, 4), d: rnd(.6, 1), z: 1810 }), i * 60);
}
function confetti(n = 46) {
  for (let i = 0; i < n; i++) setTimeout(() => particle(rnd(4, 96), rnd(-4, 6), ["♥", "✦", "✿", "♥"][i % 4],
    { color: ["#E8506F", "#FFD86B", "#F7A8C4", "#9fd3ff", "#fff"][i % 5], size: rnd(1.2, 2.4), dx: rnd(-4, 4), dy: rnd(40, 62), d: rnd(2.4, 3.6), r: rnd(-200, 200), z: 2100 }), i * 45);
}
function tapRing(x, y) {
  const e = document.createElement("i"); e.className = "ring";
  e.style.cssText = `left:${x}%;top:${y}%;z-index:${Math.round(y * 10) - 2}`;
  stage.appendChild(e); setTimeout(() => e.remove(), 520);
}

// fireflies by the window and plants at night
const FIREFLIES = [];
[[49, 12], [56, 9], [62, 14], [52, 20], [12, 38], [18, 46], [8, 52], [40, 30], [69, 36], [78, 58], [63, 8], [30, 62]].forEach(([x, y], i) => {
  const e = document.createElement("i"); e.className = "ff";
  e.style.cssText = `left:${x}%;top:${y}%;animation-delay:${-rnd(0, 9)}s`;
  for (const v of ["--a", "--b", "--c"]) e.style.setProperty(v, rnd(-2.6, 2.6).toFixed(2) + "cqw");
  e.style.setProperty("--t", rnd(6, 11).toFixed(1) + "s");
  stage.appendChild(e); FIREFLIES.push(e);
});
// lamp glows: bedside, the cube lamp by the TV, the desk lamp ([x%, y%, size%])
const GLOWS = [[72.85, 15, 7], [94, 45.9, 8], [34.4, 15.3, 6]].map(([x, y, s]) => {
  const e = document.createElement("i"); e.className = "glow";
  e.style.cssText = `left:${x}%;top:${y}%;width:${s}%;aspect-ratio:1`; stage.appendChild(e); return e;
});
const MOTES = document.createElement("i"); MOTES.className = "motes"; stage.appendChild(MOTES);
const DARK = document.createElement("i"); DARK.id = "dark"; stage.appendChild(DARK);
function lightFx() {
  const lit = W.night && W.lamp !== false;
  GLOWS.forEach(g => g.classList.toggle("on", lit));
  DARK.classList.toggle("on", W.night && W.lamp === false);
  FIREFLIES.forEach(f => f.classList.toggle("on", W.night));
  MOTES.classList.toggle("on", !W.night);
}
function fxStep(dt, t) {
  const pl = $("plant"); if (pl) pl.style.transform = `translate(-50%,-100%) rotate(${(Math.sin(t / 900) * 1.6).toFixed(2)}deg)`;
}
