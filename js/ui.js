// ---------- panels, menus, speech bubbles, labels ----------

// tiny DOM helper: h("div", {class:"card", onclick:fn}, "text", child...). Text is always added as text, never as HTML.
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "style") e.style.cssText = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k in e && k !== "list") e[k] = v;
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(9)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
const other2 = k => k === "g" ? "b" : "g";
const fmtDate = ts => new Date(ts).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
const fmtWhen = ts => new Date(ts).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// ---------- panels ----------
const PANELS = {};          // id -> {title, render(body, el), close()}
let openId = null;
function definePanel(id, title, render, close) { PANELS[id] = { title, render, close }; }
function openPanel(id, arg) {
  const def = PANELS[id]; if (!def) return;
  closePanels();
  let el = $("p-" + id);
  if (!el) {
    el = h("section", { class: "panel", id: "p-" + id, role: "dialog", "aria-label": def.title },
      h("header", null, h("b"), h("button", { class: "x", "aria-label": "Close", onclick: () => closePanels() }, "×")),
      h("div", { class: "body" }));
    el.addEventListener("pointerdown", e => e.stopPropagation());
    $("ui").appendChild(el);
  }
  el.querySelector("header b").textContent = typeof def.title === "function" ? def.title(arg) : def.title;
  const body = el.querySelector(".body"); body.innerHTML = "";
  def.render(body, el, arg);
  void el.offsetWidth; el.classList.add("on"); document.body.classList.add("sheet");   // reflow first so the slide-in still plays
  openId = id; SFX.play("page");
}
function closePanels() {
  if (openId) { const d = PANELS[openId]; try { d.close && d.close(); } catch (e) {} $("p-" + openId)?.classList.remove("on"); openId = null; }
  if ($("chat").classList.contains("on")) { $("chat").classList.remove("on"); setTyping(false); }
  document.body.classList.remove("sheet");
}
// redraw an open panel in place (keeps its scroll position)
function rerender(id, arg) {
  if (openId !== id) return;
  const body = $("p-" + id).querySelector(".body"), st = body.scrollTop;
  body.innerHTML = ""; PANELS[id].render(body, $("p-" + id), arg); body.scrollTop = st;
}
function goHome() { closePanels(); if (typeof zoomOut !== "undefined" && zoomOut) toggleZoom(); cam.snap = true; }

// ---------- "More" (Gamer view): the painted sidebar's places, then things to do ----------
// In Room view these places are the sidebar painted into the room; on phones that strip is framed out, so they live here.
const PLACES = [["home", "🏠", "Home"], ["letter", "✉️", "Our Letters"], ["memories", "📸", "Memories"], ["games", "🎮", "Games"], ["map", "🗺️", "Our Map"],
  ["plans", "✈️", "Future Plans"], ["music", "🎵", "Music"], ["jar", "🫙", "Surprise Me"], ["wardrobe", "👗", "Wardrobe"], ["settings", "⚙️", "Settings"]];
const MORE = [["sit", "🪑", "Sit"], ["feed", "🍓", "Eat"], ["sleep", "🌙", "Sleep"], ["hands", "🤝", "Hold hands"], ["e", "🎁", "Surprise"], ["emote", "😊", "Emote"],
  ["cat", "🐱", "Pet cat"], ["feedcat", "🥣", "Feed cat"], ["water", "🪴", "Water plant"], ["night", "🌗", "Day / Night"], ["lamp", "💡", "Lamp"]];
definePanel("more", "Our Little World", body => {
  body.append(h("h4", null, "Places"), h("div", { class: "tiles" }, PLACES.map(([id, ic, label]) => h("button", { class: "tile", onclick: () => {
    if (id === "home") goHome(); else if (id === "letter") openChat("letter"); else openPanel(id);
  } }, h("i", null, ic), label)),
    h("button", { class: "tile", "data-id": "sound", onclick: () => { SFX.setMuted(!SFX.isMuted()); muteIcon(); SFX.play("tap"); } })));
  body.append(h("h4", null, "Things to do"), h("div", { class: "tiles" }, MORE.map(([a, ic, label]) => h("button", { class: "tile", onclick: () => { closePanels(); act(a); } }, h("i", null, ic), label))));
  body.append(h("p", { class: "muted" }, "Tip: tap the bed, sofa, desk, mirror, plant or lamp in the room for more."));
  muteIcon();
});

// ---------- emotes ----------
const EMOTES = [["wave", "👋", "Wave"], ["happy", "😊", "Happy"], ["shy", "🙈", "Shy"], ["heart", "♥", "Love"], ["laugh", "😂", "Laugh"], ["sleepy", "😴", "Sleepy"]];
const EMO_TEXT = { heart: "♥", laugh: "ha ha!", sleepy: "z z z" };
definePanel("emotes", "Emote", body => {
  body.append(h("div", { class: "tiles" }, EMOTES.map(([e, ic, label]) => h("button", { class: "tile", onclick: () => { closePanels(); emote(e); } }, h("i", null, ic), label))));
});
// show an emote over Character k; mine = tell the other device too
function emote(e, k = me(), mine = true) {
  const a = P[k];
  if (["wave", "happy", "shy"].includes(e)) { if (!a.pose && !pair) { a.em = e; a.emU = NOW + 2400; } }
  else {
    const el = h("i", { class: "emo" }, EMO_TEXT[e] || "♥");
    const key = pair ? pair.n : els[k]._k, x = pair ? pair.x + (k === "g" ? -3 : 3) : a.x, y = (pair ? pair.y : a.y) - S[key].h * K / 10.24 - 1;
    el.style.left = x + "%"; el.style.top = y + "%"; stage.appendChild(el); setTimeout(() => el.remove(), 2500);
    if (e === "heart") hearts(x, y + 2, 4);
  }
  SFX.play(e === "heart" ? "heart" : e === "laugh" ? "pop" : "chime");
  if (mine && LIVE) db.doc("live/emote_" + k).set({ e, ts: Date.now() }).catch(() => {});
}

// ---------- labels: "You" for the viewer, the other one by name ----------
function labels() {
  document.querySelector("#sg b").textContent = "♥ " + who("g");
  document.querySelector("#sb b").textContent = "♥ " + who("b");
  document.querySelector("#sg img").alt = who("g"); document.querySelector("#sb img").alt = who("b");
}

// ---------- speech bubbles over each Character ----------
const SB = {}, TYPING = { g: false, b: false };
for (const k of ["g", "b"]) {
  const e = h("div", { class: "sb", onclick: ev => { ev.stopPropagation(); SFX.play("tap"); openChat(SB[k].open || "chat"); } });
  stage.appendChild(e); SB[k] = { e, text: "", until: 0, kind: "", open: null, shown: "" };
}
// line = what a Character says (Gamer view only: Room view has Pratiksha's panels for that)
function sayBubbles(g, b) {
  if (!document.body.classList.contains("gamer")) return;
  if (g != null) bubble("g", g, 3400, "line"); if (b != null) bubble("b", b, 3400, "line");
}
function bubble(k, text, ms, kind, open) {
  const s = SB[k]; if (kind === "line" && s.kind !== "line" && NOW < s.until) return;   // don't talk over a Message
  Object.assign(s, { text, until: NOW + ms, kind, open: open || null });
}
// a Message or Letter arriving pops up over whoever sent it
function msgBubble(m) {
  const t = m.kind === "letter" ? "✉ I left you a letter" : m.text.length > 90 ? m.text.slice(0, 88) + "…" : m.text;
  bubble(m.from, t, m.kind === "letter" ? 6000 : Math.min(9000, 3500 + m.text.length * 60), m.kind === "letter" ? "letter" : "msg", m.kind === "letter" ? "letter" : "chat");
}
function charTop(k) {   // where the top of Character k's head is, in % of the room
  if (pair) return { x: pair.x + (k === "g" ? -5.5 : 5.5), y: pair.y - S[pair.n].h * K / 10.24 - (k === "g" ? 2.2 : 0) };   // staggered so the two don't overlap
  const key = els[k]._k || k + "_idle"; return { x: P[k].x, y: P[k].y - S[key].h * K / 10.24 };
}
function bubbleStep(t) {
  for (const k of ["g", "b"]) {
    const s = SB[k], live = t < s.until, typing = TYPING[k] && k !== me();
    const show = live ? s.kind + "|" + s.text : typing ? "typing" : "";
    if (show !== s.shown) {
      s.shown = show; s.e.className = "sb";
      if (show) { void s.e.offsetWidth; s.e.className = "sb on " + (live ? s.kind : "typing"); s.e.textContent = live ? s.text : "• • •"; }
    }
    const c = charTop(k), chip = CHIPS[k], up = chip && chip.classList.contains("on") ? 3.2 : 0;
    const seen = inView(c.x); s.e.style.visibility = chip.style.visibility = seen ? "" : "hidden";   // no bubbles for someone off-screen
    const lim = minTopPct(), Hs = stage.clientHeight || 1;
    if (show) { s.e.style.left = onScreenX(c.x, s.e.offsetWidth) + "%"; s.e.style.top = Math.max(c.y - 1.4 - up, lim + s.e.offsetHeight / Hs * 100) + "%"; s.e.style.zIndex = 1700 + Math.round(c.y); }
    if (chip) { chip.style.left = onScreenX(c.x, chip.offsetWidth) + "%"; chip.style.top = Math.max(c.y - .8, lim + chip.offsetHeight / Hs * 100) + "%"; }
  }
}
// the highest a thing may sit in Gamer view: just under the top bar (in % of the room)
function minTopPct() {
  if (!document.body.classList.contains("gamer")) return 0;
  return (($("tday").getBoundingClientRect().bottom || 50) + 8 - cam.y) / (stage.clientHeight || 1) * 100;
}
// nudge a popup (like the furniture menu) back inside the screen, clear of the top bar and the controls
function keepInView(el) {
  const r = el.getBoundingClientRect(), g = document.body.classList.contains("gamer");
  const top = g ? $("tday").getBoundingClientRect().bottom + 8 : 8, bottom = innerHeight - (g ? 180 : 8);
  let dx = 0, dy = 0;
  if (r.left < 8) dx = 8 - r.left; else if (r.right > innerWidth - 8) dx = innerWidth - 8 - r.right;
  if (r.top < top) dy = top - r.top; else if (r.bottom > bottom) dy = Math.max(top - r.top, bottom - r.bottom);
  if (dx || dy) { el.style.left = parseFloat(el.style.left) + dx / stage.clientWidth * 100 + "%"; el.style.top = parseFloat(el.style.top) + dy / stage.clientHeight * 100 + "%"; }
}
function inView(x) { if (!document.body.classList.contains("gamer")) return true; const W = stage.clientWidth || 1; return x > -cam.x / W * 100 - 2 && x < (-cam.x + cam.vw) / W * 100 + 2; }
// keep a bubble of width px fully on screen (Gamer view crops the Room; Room view shows all of it)
function onScreenX(x, px) {
  const W = stage.clientWidth || 1, half = px / 2 / W * 100 + .6;
  const lo = document.body.classList.contains("gamer") ? -cam.x / W * 100 : 0, hi = document.body.classList.contains("gamer") ? (-cam.x + cam.vw) / W * 100 : 100;
  return Math.min(hi - half, Math.max(lo + half, x));
}
// "♪ now playing" chips over each Character (filled in by music.js)
const CHIPS = {};
for (const k of ["g", "b"]) { CHIPS[k] = h("div", { class: "chip", onclick: e => { e.stopPropagation(); openPanel("music"); } }); stage.appendChild(CHIPS[k]); }

// ---------- typing… ----------
let typingOn = false, typingAt = 0;
function setTyping(on) {
  if (!LIVE || !db) return;
  const now = Date.now();
  if (on === typingOn && (!on || now - typingAt < 4000)) return;
  typingOn = on; typingAt = now;
  db.doc("live/typing_" + role).set({ on, ts: now }).catch(() => {});
}

// ---------- unread Messages ----------
let unread = 0;
function bumpUnread() {
  if ($("chat").classList.contains("on") && !document.hidden) return;
  unread++; showUnread();
}
function markRead() { unread = 0; showUnread(); }
function showUnread() {
  document.querySelectorAll(".badge.msg").forEach(b => { b.textContent = unread > 9 ? "9+" : unread; b.classList.toggle("on", unread > 0); });
  document.title = (unread ? "(" + unread + ") " : "") + "Our Little World";
  try { if (navigator.setAppBadge) unread ? navigator.setAppBadge(unread) : navigator.clearAppBadge(); } catch (e) {}
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && $("chat").classList.contains("on")) markRead(); });
// a badge on Pratiksha's Messages button too
document.querySelectorAll('[data-a="chat"]').forEach(b => { if (!b.querySelector(".badge")) b.append(h("span", { class: "badge msg" })); });

// ---------- Gamer view top bar ----------
$("hmore").onclick = () => { SFX.play("tap"); openPanel("more"); };
$("dayb").onclick = e => { e.stopPropagation(); SFX.play("tap"); openPanel("settings"); };
$("hzoom").onclick = () => { SFX.play("tap"); toggleZoom(); };
$("tday").onclick = () => openPanel("settings");
function muteIcon() { const t = document.querySelector("#p-more [data-id=sound]"); if (t) t.replaceChildren(h("i", null, SFX.isMuted() ? "🔇" : "🔊"), SFX.isMuted() ? "Sound off" : "Sound on"); }

// phones: keep Messages and panel text boxes above the on-screen keyboard
if (window.visualViewport) {
  const vv = visualViewport, kb = () => { const k = innerHeight - vv.height - vv.offsetTop; document.documentElement.style.setProperty("--kb", (k > 80 ? k : 0) + "px"); };
  vv.addEventListener("resize", kb); vv.addEventListener("scroll", kb);
}
