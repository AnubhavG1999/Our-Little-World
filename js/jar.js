// ---------- Surprise Me: the jar of Open-when notes ----------
// Each of you hides notes in the jar for the other. Surprise Me draws a random unopened one from them;
// if the jar is empty for you, it falls back to Pratiksha's original surprise (a random Pair moment).
const OPEN_WHEN = ["Open when you miss me", "Open when you can't sleep", "Open when you need a smile", "Open when it's a bad day", "Open when you're proud of yourself", "Open anytime"];
let jarUnsub = null;
definePanel("jar", "Surprise Me", body => {
  if (!db) { body.append(h("p", { class: "empty" }, "The jar needs our shared world.")); return; }
  const k = me(), o = other2(k);
  const top = h("div", { class: "card", style: "text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center" });
  const reveal = h("div");
  const title = h("select", { class: "in" }, OPEN_WHEN.map(t => h("option", null, t)));
  const note = h("textarea", { class: "in", rows: 4, placeholder: "Your note for " + NAME[o] + "…", maxLength: 1200 });
  const hide = h("button", { class: "btn p", onclick: async () => {
    if (!note.value.trim()) return note.focus();
    await db.collection("jar").add({ by: k, to: o, title: title.value, text: note.value.trim(), opened: false, ts: Date.now() });
    note.value = ""; SFX.play("chime"); toast("Hidden in the jar for " + NAME[o] + " ♥");
  } }, "Hide it in the jar");
  const opened = h("div", { style: "display:flex;flex-direction:column;gap:8px" });
  body.append(top, reveal, h("h4", null, "Hide a note for " + NAME[o]), h("div", { class: "card", style: "display:flex;flex-direction:column;gap:8px" }, title, note, hide),
    h("h4", null, "Notes you've opened"), opened);
  jarUnsub = db.collection("jar").where("to", "==", k).limit(200).onSnapshot(snap => {
    const notes = snap.docs.map(d => ({ id: d.id, ...d.data() })), waiting = notes.filter(n => !n.opened);
    top.replaceChildren(h("div", { style: "font-size:3em;line-height:1" }, "🫙"),
      h("b", null, waiting.length ? waiting.length + " note" + (waiting.length > 1 ? "s" : "") + " from " + NAME[o] + " waiting" : "The jar is empty for you right now"),
      h("button", { class: "btn p", onclick: () => draw(waiting) }, waiting.length ? "Draw one ♥" : "Surprise me anyway"));
    const done = notes.filter(n => n.opened).sort((a, b) => b.openedAt - a.openedAt);
    opened.replaceChildren(...done.map(n => h("div", { class: "card" }, h("b", null, n.title), h("div", { style: "white-space:pre-wrap;margin-top:4px" }, n.text), h("small", { class: "muted" }, "from " + NAME[n.by] + " · opened " + fmtDate(n.openedAt)))));
    if (!done.length) opened.append(h("p", { class: "muted" }, "None yet."));
  }, () => {});
  function draw(waiting) {
    if (!waiting.length) { closePanels(); act("e"); return; }
    const n = waiting[Math.floor(Math.random() * waiting.length)];
    db.doc("jar/" + n.id).update({ opened: true, openedAt: Date.now() });
    SFX.play("sparkle"); confetti(18);
    reveal.replaceChildren(h("div", { class: "card", style: "background:#fffaf0;border-style:dashed;animation:rise .3s ease-out" },
      h("b", { style: "color:var(--hot)" }, n.title), h("div", { style: "white-space:pre-wrap;margin:6px 0;font-size:1.1em" }, n.text), h("small", { class: "muted" }, "from " + NAME[n.by] + " · written " + fmtDate(n.ts))));
    if (LIVE) db.doc("live/event").set({ type: "jar", by: k, ts: Date.now() }).catch(() => {});
  }
}, () => { jarUnsub && jarUnsub(); jarUnsub = null; });
