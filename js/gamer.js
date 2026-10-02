// ---------- Gamer view: a close-up that follows your Character, with a joystick and hotbar ----------
let VIEW = "auto";                 // "auto" (phones held upright), "gamer" or "room" — remembered per device
try { VIEW = localStorage.getItem("view") || "auto"; } catch (e) {}
let zoomOut = false;               // Gamer view zoomed out to the whole Room
const cam = { x: 0, y: 0, w: 0, h: 0, vw: 0, vh: 0, snap: true };

function isGamer() {
  if (VIEW === "gamer") return true;
  if (VIEW === "room") return false;
  return matchMedia("(pointer:coarse)").matches && innerHeight > innerWidth;
}
function applyView() {
  const g = isGamer(), was = document.body.classList.contains("gamer");
  document.body.classList.toggle("gamer", g);
  if (g !== was) { closePanels(); for (const k of ["g", "b"]) SB[k].until = 0; }
  layout();
}
function setView(v) { VIEW = v; try { localStorage.setItem("view", v); } catch (e) {} applyView(); }
function toggleZoom() { zoomOut = !zoomOut; $("hzoom").textContent = zoomOut ? "⤡" : "⤢"; layout(); }

// size the Room for the screen: in Gamer view the Room fills the play area's height and the camera pans
function layout() {
  if (!document.body.classList.contains("gamer")) {
    stage.style.width = stage.style.height = stage.style.transform = ""; return;
  }
  const v = $("view"), vw = v.clientWidth, vh = v.clientHeight;
  let w, hgt;
  if (zoomOut) { w = Math.min(vw, vh / .836 * 1.5); hgt = w / 1.5; }
  else { hgt = vh / .836; w = hgt * 1.5; if (w < vw) { w = vw; hgt = w / 1.5; } }
  stage.style.width = w + "px"; stage.style.height = hgt + "px";
  Object.assign(cam, { w, h: hgt, vw, vh, snap: true });
}
function camStep(dt) {
  if (!document.body.classList.contains("gamer") || !cam.w) return;
  const roomH = cam.h * .836;            // the painting's bottom strip sits under Pratiksha's control bar, so it's never shown
  let tx, ty;
  if (zoomOut) { tx = (cam.vw - cam.w) / 2; ty = (cam.vh - roomH) / 2; }
  else {
    const f = pair ? { x: pair.x, y: pair.y } : P[me()];
    tx = cam.vw / 2 - f.x / 100 * cam.w; ty = cam.vh * .58 - f.y / 100 * cam.h;
    tx = Math.min(0, Math.max(cam.vw - cam.w, tx));
    ty = roomH <= cam.vh ? (cam.vh - roomH) / 2 : Math.min(0, Math.max(cam.vh - roomH, ty));
  }
  if (cam.snap) { cam.x = tx; cam.y = ty; cam.snap = false; }
  else { const k = 1 - Math.pow(.002, dt); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; }
  stage.style.transform = `translate3d(${cam.x.toFixed(1)}px,${cam.y.toFixed(1)}px,0)`;
}
addEventListener("resize", applyView);
addEventListener("orientationchange", () => setTimeout(applyView, 250));

// ---------- the joystick ----------
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
