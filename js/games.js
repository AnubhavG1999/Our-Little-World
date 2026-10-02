// ---------- Games: tic-tac-toe, rock-paper-scissors, "How well do you know me?", catch the hearts ----------
// Turn-based and stored in Firestore, so they work live or across the time difference.
let gameUnsub = null;
const stopGame = () => { gameUnsub && gameUnsub(); gameUnsub = null; };
const backToGames = () => h("div", { class: "row" }, h("button", { class: "btn sm", onclick: () => openPanel("games") }, "← Games"));
const canPlay = k => !LIVE || k === role;          // on one device you play both sides
const needDb = body => { if (db) return false; body.append(h("p", { class: "empty" }, "Games need our shared world.")); return true; };

definePanel("games", "Games", body => {
  const t = (id, ic, label, sub) => h("button", { class: "tile", onclick: () => openPanel(id) }, h("i", null, ic), label, h("small", { class: "muted" }, sub));
  body.append(h("div", { class: "tiles" },
    t("ttt", "⭕", "Tic-tac-toe", "♥ vs ✦"), t("rps", "✊", "Rock paper scissors", "best of forever"),
    t("quiz", "💭", "How well do you know me?", "write & answer"), t("hearts", "💗", "Catch the hearts", "30 seconds")));
});

// ----- tic-tac-toe -----
const MARK = { g: "♥", b: "✦" }, LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
definePanel("ttt", "Tic-tac-toe", body => {
  body.append(backToGames()); if (needDb(body)) return;
  const info = h("p", { style: "text-align:center;font-size:1.15em;margin:0" }), score = h("p", { class: "muted", style: "text-align:center;margin:0" });
  const grid = h("div", { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:min(100%,330px);margin:auto" });
  const again = h("button", { class: "btn p" }, "New game");
  body.append(info, grid, h("div", { class: "row", style: "justify-content:center" }, again), score);
  let G = null;
  const fresh = turn => ({ b: ".........", turn, win: null, line: null, score: (G && G.score) || { g: 0, b: 0 }, ts: Date.now() });
  again.onclick = () => { const turn = G && G.win && G.win !== "draw" ? other2(G.win) : G && G.turn ? other2(G.turn) : "g"; db.doc("games/ttt").set(fresh(turn)); SFX.play("swish"); };
  const cells = [...Array(9)].map((_, i) => { const c = h("button", { class: "btn", style: "aspect-ratio:1;font-size:2.2em;padding:0;line-height:1", onclick: () => move(i) }); grid.append(c); return c; });
  function move(i) {
    if (!G || G.win || G.b[i] !== "." || !canPlay(G.turn)) return;
    const b = G.b.slice(0, i) + G.turn + G.b.slice(i + 1), line = LINES.find(l => l.every(j => b[j] === G.turn));
    const win = line ? G.turn : b.includes(".") ? null : "draw", sc = { ...G.score }; if (line) sc[G.turn]++;
    db.doc("games/ttt").set({ ...G, b, turn: other2(G.turn), win, line: line || null, score: sc, ts: Date.now() }); SFX.play("tap");
  }
  function draw(prev) {
    cells.forEach((c, i) => { const v = G.b[i]; c.textContent = v === "." ? "" : MARK[v]; c.style.color = v === "g" ? "#E8506F" : "#7a5bc7"; c.style.background = G.line && G.line.includes(i) ? "#FFE3EA" : ""; });
    info.textContent = G.win === "draw" ? "A draw. Again?" : G.win ? (G.win === me() && LIVE ? "You win! ♥" : who(G.win) + (G.win === me() ? " win!" : " wins!")) : (LIVE ? (G.turn === role ? "Your turn (" + MARK[role] + ")" : NAME[G.turn] + "'s turn…") : who(G.turn) + "'s turn (" + MARK[G.turn] + ")");
    score.textContent = NAME.g + " " + G.score.g + " · " + G.score.b + " " + NAME.b;
    if (prev && G.win && !prev.win) { SFX.play(G.win === "draw" ? "chime" : !LIVE || G.win === role ? "win" : "lose"); if (G.win !== "draw") hearts(50, 45, 6); }
    else if (prev && prev.b !== G.b) SFX.play("tap");
  }
  gameUnsub = db.doc("games/ttt").onSnapshot(s => { const prev = G; G = s.exists ? s.data() : null; if (!G) { G = fresh("g"); db.doc("games/ttt").set(G); } draw(prev); }, () => {});
}, stopGame);

// ----- rock paper scissors -----
const RPS = { r: "✊", p: "✋", s: "✌️" }, BEATS = { r: "s", p: "r", s: "p" }, RPS_NAME = { r: "Rock", p: "Paper", s: "Scissors" };
definePanel("rps", "Rock paper scissors", body => {
  body.append(backToGames()); if (needDb(body)) return;
  const res = h("div", { class: "card", style: "text-align:center" }), rows = h("div", { style: "display:flex;flex-direction:column;gap:10px" }), score = h("p", { class: "muted", style: "text-align:center;margin:0" });
  body.append(res, rows, score);
  let G = null;
  // whoever picks second settles the round in the same write; if you both pick at once, Pratiksha's device settles it
  const settle = (pg, pb) => {
    const w = pg === pb ? "draw" : BEATS[pg] === pb ? "g" : "b", sc = { ...(G.score || { g: 0, b: 0 }) }; if (w !== "draw") sc[w]++;
    db.doc("games/rps").set({ g: null, b: null, score: sc, last: { g: pg, b: pb, w }, round: (G.round || 0) + 1, ts: Date.now() });
  };
  const pick = (k, c) => {
    SFX.play("tap"); const o = other2(k);
    if (G && G[o]) settle(k === "g" ? c : G.g, k === "b" ? c : G.b);
    else db.doc("games/rps").set({ [k]: c, ts: Date.now() }, { merge: true });
  };
  function resolve() { if (G.g && G.b && (!LIVE || role === "g")) settle(G.g, G.b); }
  function draw(prev) {
    const L = G.last;
    res.replaceChildren(L ? h("div", null, h("div", { style: "font-size:2.4em" }, RPS[L.g] + "  vs  " + RPS[L.b]),
      L.w === "draw" ? "A draw!" : who(L.w) + (L.w === me() ? " win the round!" : " wins the round!")) : h("div", null, "Pick one! Picks stay hidden until you've both chosen."));
    rows.replaceChildren(...["g", "b"].filter(k => canPlay(k) || LIVE).map(k => h("div", { class: "card" },
      h("b", null, who(k) + ": "),
      G[k] ? h("span", null, canPlay(k) ? "picked " + RPS[G[k]] + " — waiting…" : "has picked ✓") : canPlay(k)
        ? h("span", { class: "row", style: "display:inline-flex" }, Object.keys(RPS).map(c => h("button", { class: "btn", style: "font-size:1.5em", title: RPS_NAME[c], onclick: () => pick(k, c) }, RPS[c])))
        : h("span", { class: "muted" }, "thinking…"))));
    const sc = G.score || { g: 0, b: 0 }; score.textContent = NAME.g + " " + sc.g + " · " + sc.b + " " + NAME.b;
    if (prev && G.round !== prev.round && L) SFX.play(L.w === "draw" ? "chime" : !LIVE || L.w === role ? "win" : "lose");
    resolve();
  }
  gameUnsub = db.doc("games/rps").onSnapshot(s => { const prev = G; G = s.exists ? s.data() : { g: null, b: null, score: { g: 0, b: 0 } }; draw(prev); }, () => {});
}, stopGame);

// ----- How well do you know me? -----
definePanel("quiz", "How well do you know me?", body => {
  body.append(backToGames()); if (needDb(body)) return;
  const k = me(), o = other2(k);
  const list = h("div", { style: "display:flex;flex-direction:column;gap:10px" }), stats = h("p", { class: "muted", style: "margin:0" });
  const q = h("input", { class: "in", placeholder: "A question about you…", maxLength: 140 });
  const opts = [0, 1, 2, 3].map(i => h("input", { class: "in", placeholder: i < 2 ? "Answer " + (i + 1) : "Answer " + (i + 1) + " (optional)", maxLength: 60, style: "flex:1" }));
  let right = 0; const radios = opts.map((inp, i) => h("label", { class: "row", style: "flex-wrap:nowrap" },
    h("input", { type: "radio", name: "qa", checked: i === 0, onchange: () => right = i, "aria-label": "Correct answer" }), inp));
  const add = h("button", { class: "btn p", onclick: async () => {
    const os = opts.map(i => i.value.trim()), keep = os.map((v, i) => [v, i]).filter(([v]) => v);
    if (!q.value.trim() || keep.length < 2) return toast("Write a question and at least two answers.");
    if (!os[right]) return toast("Tick the right answer.");
    await db.collection("quiz").add({ by: k, q: q.value.trim(), opts: keep.map(([v]) => v), ans: keep.findIndex(([, i]) => i === right), a: null, ts: Date.now() });
    q.value = ""; opts.forEach(i => i.value = ""); toast("Question sent to " + NAME[o] + " ♥"); SFX.play("chime");
  } }, "Send question");
  body.append(stats, h("h4", null, "For you to answer"), list,
    h("h4", null, "Write one about you"), h("div", { class: "card", style: "display:flex;flex-direction:column;gap:8px" }, q, ...radios, h("small", { class: "muted" }, "Tick the right answer."), add));
  gameUnsub = db.collection("quiz").orderBy("ts", "desc").limit(80).onSnapshot(snap => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const forMe = all.filter(x => LIVE ? x.by === o : true), mine = all.filter(x => x.by === k && x.a);
    const got = forMe.filter(x => x.a && x.a.right).length, done = forMe.filter(x => x.a).length;
    stats.textContent = "You know " + NAME[o] + ": " + got + "/" + done + " · " + NAME[o] + " knows you: " + mine.filter(x => x.a.right).length + "/" + mine.length;
    list.replaceChildren(...(forMe.length ? forMe : []).map(x => h("div", { class: "card" },
      h("b", null, x.q), h("small", { class: "muted" }, " · from " + who(x.by)),
      h("div", { class: "row", style: "margin-top:6px" }, x.opts.map((op, i) => h("button", {
        class: "btn sm", disabled: !!x.a, style: x.a ? (i === x.ans ? "background:#d9f2d0" : x.a.pick === i ? "background:#ffd6dd" : "") : "",
        onclick: () => { const ok = i === x.ans; db.doc("quiz/" + x.id).update({ a: { pick: i, right: ok, ts: Date.now() } });
          SFX.play(ok ? "win" : "lose"); toast(ok ? "Right! ♥" : "Not quite — it was “" + x.opts[x.ans] + "”"); if (ok) hearts(50, 45, 5); }
      }, op))))));
    if (!forMe.length) list.append(h("p", { class: "empty" }, "No questions from " + NAME[o] + " yet."));
  }, () => {});
}, stopGame);

// ----- catch the hearts -----
let heartsRun = null;
definePanel("hearts", "Catch the hearts", body => {
  body.append(backToGames());
  const cv = h("canvas", { width: 360, height: 440, style: "width:min(100%,360px);aspect-ratio:36/44;margin:auto;display:block;background:linear-gradient(#2a1a3a,#5b2f55);border-radius:12px;touch-action:none" });
  const info = h("p", { style: "text-align:center;margin:0" }, "Catch as many hearts as you can in 30 seconds. Gold ones are worth 3."), best = h("p", { class: "muted", style: "text-align:center;margin:0" });
  const go = h("button", { class: "btn p" }, "Start");
  body.append(info, cv, h("div", { class: "row", style: "justify-content:center" }, go), best);
  const showBest = d => best.textContent = "Best: " + NAME.g + " " + ((d && d.g) || 0) + " · " + ((d && d.b) || 0) + " " + NAME.b;
  if (db) gameUnsub = db.doc("games/hearts").onSnapshot(s => showBest(s.exists ? s.data() : null), () => {}); else showBest(null);
  const x = cv.getContext("2d"), me0 = me(), spr = new Image(); spr.src = SRC(me0 + "_idle");
  const sw = 64, sh = sw * S[me0 + "_idle"].h / S[me0 + "_idle"].w;
  let px = 180, drag = false;
  const toX = e => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 360; };
  cv.onpointerdown = e => { drag = true; px = toX(e); cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (drag) px = toX(e); };
  cv.onpointerup = cv.onpointercancel = () => drag = false;
  function frame0() { x.clearRect(0, 0, 360, 440); x.drawImage(spr, px - sw / 2, 440 - sh - 6, sw, sh); }
  spr.onload = frame0;
  go.onclick = () => {
    if (heartsRun) return; go.disabled = true; SFX.play("swish");
    const items = []; let score = 0, t0 = performance.now(), lastT = t0, spawn = 0;
    const step = t => {
      const dt = Math.min(.05, (t - lastT) / 1000), el = (t - t0) / 1000; lastT = t;
      if (keys.has("arrowleft") || keys.has("a")) px -= 260 * dt; if (keys.has("arrowright") || keys.has("d")) px += 260 * dt;
      px = Math.max(sw / 2, Math.min(360 - sw / 2, px));
      spawn -= dt; if (spawn <= 0) { spawn = Math.max(.28, .75 - el * .015); items.push({ x: 20 + Math.random() * 320, y: -20, v: 110 + el * 6 + Math.random() * 60, gold: Math.random() < .12 }); }
      x.clearRect(0, 0, 360, 440); x.drawImage(spr, px - sw / 2, 440 - sh - 6, sw, sh);
      x.textAlign = "center"; x.font = "26px sans-serif";
      for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; it.y += it.v * dt;
        if (it.y > 440 - sh + 4 && it.y < 440 - sh + 40 && Math.abs(it.x - px) < sw * .55) { score += it.gold ? 3 : 1; SFX.play(it.gold ? "sparkle" : "heart"); items.splice(i, 1); continue; }
        if (it.y > 460) { items.splice(i, 1); continue; }
        x.fillStyle = it.gold ? "#FFD84D" : "#ff7a9a"; x.fillText("♥", it.x, it.y); }
      x.fillStyle = "#fff"; x.font = '600 20px "Pixelify Sans", monospace'; x.textAlign = "left"; x.fillText("♥ " + score, 12, 28);
      x.textAlign = "right"; x.fillText(Math.max(0, 30 - el).toFixed(0) + "s", 348, 28);
      if (el < 30 && openId === "hearts") { heartsRun = requestAnimationFrame(step); return; }
      heartsRun = null; go.disabled = false; go.textContent = "Again";
      if (openId !== "hearts") return;
      info.textContent = "You caught " + score + " ♥"; SFX.play("win"); hearts(50, 45, 5);
      if (db) db.doc("games/hearts").get().then(s => { const d = s.exists ? s.data() : {}; if (score > (d[me0] || 0)) { db.doc("games/hearts").set({ [me0]: score }, { merge: true }); toast("New best! ♥"); } }).catch(() => {});
    };
    heartsRun = requestAnimationFrame(step);
  };
}, () => { stopGame(); if (heartsRun) cancelAnimationFrame(heartsRun); heartsRun = null; });
