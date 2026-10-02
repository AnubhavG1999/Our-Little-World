// ---------- Gamer view: a close-up that follows your Character, with a joystick and hotbar ----------
let VIEW = "auto";                 // "auto" (phones held upright), "gamer" or "room" — remembered per device
try { VIEW = localStorage.getItem("view") || "auto"; } catch (e) {}
let zoomOut = false;               // Gamer view zoomed out to the whole Room
const cam = { x: 0, y: 0, w: 0, h: 0, vw: 0, vh: 0, snap: true };

function isGamer() {
  if (VIEW === "gamer") return true;
  if (VIEW === "room") return false;
  // touch screens held upright, and phones held sideways (too short for Pratiksha's bottom bar)
  return matchMedia("(pointer:coarse)").matches && (innerHeight > innerWidth || innerHeight < 560);
}
// iPhone Home Screen apps can report a viewport shorter than the screen (by the status bar's height), which leaves an
// empty strip at the bottom. Measure it so the room, panels and controls can reach the real bottom (iPhone/iPad only).
function fitScreen() {
  let gap = 0;
  if (navigator.standalone === true) {
    const full = innerHeight >= innerWidth ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    gap = full - innerHeight; if (gap < 0 || gap > 120) gap = 0;          // a keyboard or split view is not a gap
  }
  document.documentElement.style.setProperty("--gap", gap + "px");
}
function applyView() {
  fitScreen();
  const g = isGamer(), was = document.body.classList.contains("gamer");
  document.body.classList.toggle("gamer", g);
  if (g !== was) { closePanels(); for (const k of ["g", "b"]) SB[k].until = 0; }
  layout(); if (typeof clocks === "function") requestAnimationFrame(clocks);
}
function setView(v) { VIEW = v; try { localStorage.setItem("view", v); } catch (e) {} applyView(); }
function toggleZoom() { zoomOut = !zoomOut; $("hzoom").textContent = zoomOut ? "⤡" : "⤢"; layout(); }

// What Gamer view frames out of the painting: the sidebar (left of x0) and, when the camera is near it, the
// title (up to TITLE.y). Below y1 is Pratiksha's control bar. Zoomed out, you see her whole painting again.
const FRAME = { x0: .136, y0: .05, y1: .836 }, TITLE = { x: .27, y: .108 };
const GAMER_XMIN = 18.5;             // so your Character can't wander into the hidden strip
// size the Room for the screen: in Gamer view the framed Room fills the screen's height and the camera pans
function layout() {
  if (!document.body.classList.contains("gamer")) {
    stage.style.width = stage.style.height = stage.style.transform = ""; return;
  }
  const v = $("view"), vw = v.clientWidth, vh = v.clientHeight, fw = 1 - FRAME.x0, fh = FRAME.y1 - TITLE.y;
  let w, hgt;
  if (zoomOut) { w = Math.min(vw, vh / FRAME.y1 * 1.5); hgt = w / 1.5; }
  else { hgt = vh / fh; w = hgt * 1.5; if (w * fw < vw) { w = vw / fw; hgt = w / 1.5; } }
  stage.style.width = w + "px"; stage.style.height = hgt + "px";
  Object.assign(cam, { w, h: hgt, vw, vh, snap: true });
}
function camStep(dt) {
  if (!document.body.classList.contains("gamer") || !cam.w) return;
  let tx, ty;
  if (zoomOut) { tx = (cam.vw - cam.w) / 2; ty = (cam.vh - FRAME.y1 * cam.h) / 2; }
  else {
    const f = pair ? { x: pair.x, y: pair.y } : P[me()];
    tx = Math.min(-FRAME.x0 * cam.w, Math.max(cam.vw - cam.w, cam.vw / 2 - f.x / 100 * cam.w));
    const titleInView = -tx / cam.w < TITLE.x, top = -(titleInView ? TITLE.y : FRAME.y0) * cam.h;
    ty = Math.min(top, Math.max(cam.vh - FRAME.y1 * cam.h, cam.vh * .58 - f.y / 100 * cam.h));
  }
  if (cam.snap) { cam.x = tx; cam.y = ty; cam.snap = false; }
  else { const k = 1 - Math.pow(.002, dt); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; }
  stage.style.transform = `translate3d(${cam.x.toFixed(1)}px,${cam.y.toFixed(1)}px,0)`;
}
addEventListener("resize", applyView);
addEventListener("orientationchange", () => setTimeout(applyView, 250));

// ---------- the joystick ----------
// drawn as pixel art (a 32px base and a 14px knob, scaled up crisp) so it sits with Pratiksha's room
(() => {
  const art = (n, paint) => { const c = document.createElement("canvas"); c.width = c.height = n; const x = c.getContext("2d");
    for (let y = 0; y < n; y++) for (let X = 0; X < n; X++) { const col = paint(X + .5 - n / 2, y + .5 - n / 2, X, y); if (col) { x.fillStyle = col; x.fillRect(X, y, 1, 1); } }
    return c.toDataURL(); };
  const base = art(32, (dx, dy, X, y) => {
    const r = Math.hypot(dx, dy);
    if (r > 15.6) return null;
    if (r > 14.4) return "#6B2440";                                                    // outline
    if (r > 13.2) return "#F6C3D0";                                                    // pink rim
    const arrow = (a, b) => a >= 3 && a <= 5 && Math.abs(b) <= a - 2.5;                   // little ▲ ▼ ◀ ▶ notches, tip toward the edge
    if (arrow(y, X - 15.5) || arrow(31 - y, X - 15.5) || arrow(X, y - 15.5) || arrow(31 - X, y - 15.5)) return "#E8506F";
    if (Math.abs(r - 8.5) < .55 && (X + y) % 2) return "rgba(239,160,181,.9)";        // dotted inner ring
    return dy > 6 && r > 11 ? "rgba(246,195,208,.62)" : "rgba(253,239,238,.55)";
  });
  const knob = art(14, (dx, dy) => {
    const r = Math.hypot(dx, dy);
    if (r > 6.9) return null;
    if (r > 5.9) return "#6B2440";
    if (Math.hypot(dx + 2, dy + 2) < 1.8) return "#FFC2D3";                            // highlight
    if (Math.hypot(dx + 1.2, dy + 1.2) < 3.2) return "#FF8FB1";
    if (dx + dy > 4.2) return "#B23A5E";                                                // shade
    return "#E8506F";
  });
  $("joy").style.backgroundImage = `url(${base})`; $("joy").querySelector("i").style.backgroundImage = `url(${knob})`;
})();
(() => {
  const j = $("joy"), knob = j.querySelector("i"); let id = null;
  function move(e) {
    const r = j.getBoundingClientRect(), max = r.width * .34;
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy); if (m > max) { dx *= max / m; dy *= max / m; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const n = Math.min(1, m / max);
    JOY.x = n < .18 ? 0 : dx / max; JOY.y = n < .18 ? 0 : dy / max;
  }
  j.addEventListener("pointerdown", e => { e.preventDefault(); id = e.pointerId; j.setPointerCapture(id); JOY.on = true; clearHold(); move(e); });
  j.addEventListener("pointermove", e => { if (e.pointerId === id) move(e); });
  const end = e => { if (e.pointerId !== id) return; id = null; JOY.on = false; JOY.x = JOY.y = 0; knob.style.transform = ""; };
  j.addEventListener("pointerup", end); j.addEventListener("pointercancel", end);
})();
