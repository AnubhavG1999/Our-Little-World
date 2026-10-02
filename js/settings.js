// ---------- Settings ----------
let signOut = null;   // set by sync.js once Firebase is up
definePanel("settings", "Settings", body => {
  const ann = h("input", { class: "in", type: "date", value: W.anniv || "", max: todayKey() });
  const catName = h("input", { class: "in", placeholder: "e.g. Mochi", maxLength: 24, value: W.catName || "" });
  const viewSel = h("select", { class: "in" }, [["auto", "Automatic (Gamer view on phones and on tablets held upright)"], ["gamer", "Gamer view: close-up that follows you"], ["room", "Room view: the whole room"]]
    .map(([v, t]) => h("option", { value: v, selected: VIEW === v }, t)));
  viewSel.onchange = () => { setView(viewSel.value); toast("View changed."); };
  const sound = h("input", { type: "checkbox", checked: !SFX.isMuted(), onchange: e => { SFX.setMuted(!e.target.checked); muteIcon(); SFX.play("tap"); } });
  const save = (field, val, msg) => { setWorld({ [field]: val }); toast(msg); SFX.play("chime"); };
  body.append(
    h("div", { class: "card", style: "display:flex;flex-direction:column;gap:8px" },
      h("b", null, "Our anniversary"), h("small", { class: "muted" }, "The Day badge counts from here, and the room celebrates every year."),
      h("div", { class: "row" }, ann, h("button", { class: "btn p", onclick: () => save("anniv", ann.value, ann.value ? "Counting from " + fmtDate(Date.parse(ann.value + "T12:00")) + " ♥" : "Anniversary cleared.") }, "Save"))),
    h("div", { class: "card", style: "display:flex;flex-direction:column;gap:8px" },
      h("b", null, "The cat's name"),
      h("div", { class: "row" }, catName, h("button", { class: "btn p", onclick: () => { save("catName", catName.value.trim(), catName.value.trim() ? "Hello, " + catName.value.trim() + " ♥" : "Name cleared."); if (catName.value.trim()) catGreet(me()); } }, "Save"))),
    h("div", { class: "card", style: "display:flex;flex-direction:column;gap:8px" },
      h("b", null, "This device"), h("label", { style: "display:flex;flex-direction:column;gap:4px" }, "View", viewSel),
      h("label", { class: "row" }, sound, "Sound effects"),
      h("small", { class: "muted" }, "Tip: add the game to your Home Screen (Share → Add to Home Screen on iPhone, ⋮ → Install app on Android) and it opens full-screen like an app.")),
    h("div", { class: "card", style: "display:flex;flex-direction:column;gap:8px" },
      h("b", null, "Music"), h("button", { class: "btn", onclick: () => openPanel("music") }, "Playlist & Spotify →")),
    h("div", { class: "row" },
      signOut ? h("button", { class: "btn", onclick: () => { if (confirm("Sign out on this device?")) signOut(); } }, "Sign out") : null,
      h("small", { class: "muted" }, LIVE ? "Signed in as " + NAME[role] + "." : "Playing on this device only.")),
    h("p", { class: "muted", style: "text-align:center" }, "Our Little World — made with ♥ by ", h("b", null, NAME.g), "."));
});
