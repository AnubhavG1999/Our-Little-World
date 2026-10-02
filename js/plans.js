// ---------- Future Plans: a shared list of things to do together ----------
let planUnsub = null;
definePanel("plans", "Future Plans", body => {
  const text = h("input", { class: "in", placeholder: "Something we'll do together…", maxLength: 140, style: "flex:1;min-width:12em" });
  const when = h("input", { class: "in", type: "date", title: "By when (optional)" });
  const add = h("button", { class: "btn p", onclick: () => {
    const v = text.value.trim(); if (!v) return text.focus();
    if (!db) return toast("Plans need our shared world.");
    db.collection("plans").add({ by: me(), text: v, due: when.value || "", done: false, ts: Date.now() });
    text.value = ""; when.value = ""; SFX.play("chime");
  } }, "Add");
  text.addEventListener("keydown", e => { if (e.key === "Enter") add.click(); });
  const todo = h("div", { style: "display:flex;flex-direction:column;gap:8px" }), done = h("div", { style: "display:flex;flex-direction:column;gap:8px" });
  body.append(h("div", { class: "row" }, text, when, add), todo, h("h4", null, "Done together ♥"), done);
  if (!db) { todo.append(h("p", { class: "empty" }, "Plans need our shared world.")); return; }
  planUnsub = db.collection("plans").orderBy("ts", "desc").limit(200).onSnapshot(snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const row = p => h("div", { class: "card row", style: "flex-wrap:nowrap;" + (p.done ? "opacity:.8" : "") },
      h("input", { type: "checkbox", checked: p.done, "aria-label": "Done", style: "width:1.4em;height:1.4em;accent-color:#B23A5E;flex:0 0 auto",
        onchange: e => {
          const v = e.target.checked;
          db.doc("plans/" + p.id).update({ done: v, doneBy: v ? me() : null, doneAt: v ? Date.now() : null });
          if (v) { celebratePlan(p.text); if (LIVE) db.doc("live/event").set({ type: "plan", text: p.text, by: me(), ts: Date.now() }).catch(() => {}); }
        } }),
      h("div", { style: "flex:1;min-width:0" }, h("div", { style: p.done ? "text-decoration:line-through" : "" }, p.text),
        h("small", { class: "muted" }, "added by " + who(p.by) + (p.due ? " · by " + fmtDate(Date.parse(p.due + "T12:00")) : "") + (p.done && p.doneAt ? " · done " + fmtDate(p.doneAt) : ""))),
      h("button", { class: "btn sm", "aria-label": "Remove", onclick: () => { if (confirm("Remove “" + p.text + "”?")) db.doc("plans/" + p.id).delete(); } }, "×"));
    const open = items.filter(p => !p.done).sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : 1);
    todo.replaceChildren(...open.map(row)); if (!open.length) todo.append(h("p", { class: "empty" }, "Nothing planned yet. Dream a little ♥"));
    const fin = items.filter(p => p.done); done.replaceChildren(...fin.map(row)); if (!fin.length) done.append(h("p", { class: "muted" }, "Tick one off and it lands here."));
  }, () => {});
}, () => { planUnsub && planUnsub(); planUnsub = null; });
function celebratePlan(text) {
  const c = pair ? { x: pair.x, y: pair.y - 10 } : { x: (P.g.x + P.b.x) / 2, y: Math.min(P.g.y, P.b.y) - 10 };
  hearts(c.x, c.y, 10); sparkle(c.x, c.y, 8); SFX.play("win"); toast("Done together: " + text + " ♥");
}
