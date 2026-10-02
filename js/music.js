// ---------- Music: our playlist, "♪ now playing" over each of you, and listen together (Spotify) ----------
// Spotify talks to the page directly (Authorization Code + PKCE, no server) through Anubhav's developer app;
// see docs/adr/0004 for why it's set up this way and what it depends on.
const SPOTIFY = { id: "eb4152c137514bfcaab686ef9a76af4a", api: "https://api.spotify.com/v1",
  scopes: "user-read-currently-playing user-read-playback-state user-modify-playback-state" };
const redirectUri = () => location.origin + location.pathname.replace(/index\.html$/, "");
const NOWP = { g: null, b: null };   // what each of you is listening to right now
let spTok = null;
try { spTok = JSON.parse(localStorage.getItem("sp_tok") || "null"); } catch (e) {}
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };

async function spConnect() {
  const v = b64url(crypto.getRandomValues(new Uint8Array(48))), st = b64url(crypto.getRandomValues(new Uint8Array(12)));
  const ch = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)));
  ls("sp_v", v); ls("sp_s", st);
  location.href = "https://accounts.spotify.com/authorize?" + new URLSearchParams({ client_id: SPOTIFY.id, response_type: "code", redirect_uri: redirectUri(),
    code_challenge_method: "S256", code_challenge: ch, scope: SPOTIFY.scopes, state: st });
}
// back from Spotify's sign-in page with ?code=…
async function spCallback() {
  const q = new URLSearchParams(location.search); if (!q.get("code") && !q.get("error")) return false;
  history.replaceState(null, "", redirectUri());
  if (q.get("error") || q.get("state") !== ls("sp_s")) { toast("Spotify wasn't linked. Try again from Music."); return true; }
  try {
    const r = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code: q.get("code"), redirect_uri: redirectUri(), client_id: SPOTIFY.id, code_verifier: ls("sp_v") || "" }) });
    if (!r.ok) throw 0;
    const j = await r.json(); spSave({ access: j.access_token, refresh: j.refresh_token, exp: Date.now() + j.expires_in * 1000 - 60000 });
    ls("sp_v", null); toast("Spotify linked ♥"); SFX.play("chime"); setTimeout(pollNow, 1500);
  } catch (e) { toast("Spotify linking didn't work. Try again from Music."); }
  return true;
}
// tokens live on this device and (once signed in) in your private spotify/{you} document, so your other devices can use them
function spSave(t) { spTok = t; ls("sp_tok", t ? JSON.stringify(t) : null); if (t && LIVE && db) db.doc("spotify/" + role).set(t).catch(() => {}); }
async function spLoadShared() { if (spTok || !LIVE) return; try { const s = await db.doc("spotify/" + role).get(); if (s.exists && s.data().refresh) { spTok = s.data(); ls("sp_tok", JSON.stringify(spTok)); pollNow(); } } catch (e) {} }
function spForget() { spSave(null); if (LIVE && db) db.doc("spotify/" + role).delete().catch(() => {}); publishNow(null); }
async function spToken() {
  if (!spTok) return null;
  if (Date.now() < spTok.exp) return spTok.access;
  if (LIVE) try { const s = await db.doc("spotify/" + role).get(); if (s.exists && s.data().exp > Date.now()) { spTok = s.data(); ls("sp_tok", JSON.stringify(spTok)); return spTok.access; } } catch (e) {}
  try {
    const r = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: spTok.refresh, client_id: SPOTIFY.id }) });
    if (!r.ok) { if (r.status === 400) { spForget(); toast("Spotify needs linking again (Music → Link Spotify)."); } return null; }
    const j = await r.json(); spSave({ access: j.access_token, refresh: j.refresh_token || spTok.refresh, exp: Date.now() + j.expires_in * 1000 - 60000 });
    return spTok.access;
  } catch (e) { return null; }
}
async function sp(path, opt = {}) {
  const t = await spToken(); if (!t) return null;
  return fetch(SPOTIFY.api + path, { ...opt, headers: { Authorization: "Bearer " + t, ...(opt.body ? { "Content-Type": "application/json" } : {}) } });
}

// ----- now playing -----
let lastNow = "";
async function pollNow() {
  if (!spTok || document.hidden) return;
  try {
    const r = await sp("/me/player/currently-playing"); if (!r) return;
    let np = null;
    if (r.status === 200) { const j = await r.json(), it = j && j.item;
      if (it && j.is_playing && j.currently_playing_type === "track") np = { title: it.name, artist: (it.artists || []).map(a => a.name).join(", "), uri: it.uri,
        url: (it.external_urls || {}).spotify || "", art: ((it.album || {}).images || []).slice(-1)[0]?.url || "" }; }
    publishNow(np);
  } catch (e) {}
}
function publishNow(np) {
  const key = np ? np.uri : "-"; if (key === lastNow) return; lastNow = key;
  NOWP[me()] = np; showChip(me());
  if (LIVE && db) db.doc("live/music_" + role).set(np ? { ...np, playing: true, ts: Date.now() } : { playing: false, ts: Date.now() }).catch(() => {});
  if (openId === "music") rerender("music");
}
setInterval(pollNow, 20000); document.addEventListener("visibilitychange", pollNow);
function showChip(k) {
  const c = CHIPS[k], n = NOWP[k]; if (!n) { c.classList.remove("on"); return; }
  c.replaceChildren(n.art ? h("img", { src: n.art, alt: "" }) : null, h("span", null, "♪ " + n.title + " — " + n.artist));
  c.title = who(k) + " is listening to " + n.title; c.classList.add("on");
}

// ----- listen together: start the same song on both of your Spotify apps (both need Premium + Spotify open) -----
async function playOnMine(t, quiet) {
  const r = await sp("/me/player/play", { method: "PUT", body: JSON.stringify({ uris: [t.uri] }) });
  if (!r) { if (!quiet) toast("Link your Spotify first (Music → Link Spotify)."); return false; }
  if (r.status === 404) { toast("Open Spotify on this device, play anything for a second, then try again."); return false; }
  if (r.status === 403) { toast("Spotify says Premium is needed to play from here."); return false; }
  if (!quiet) toast("Playing “" + t.title + "” ♪"); return true;
}
function listenTogether(t) {
  playOnMine(t); SFX.play("chime");
  if (LIVE && db) db.doc("live/listen").set({ uri: t.uri, title: t.title, artist: t.artist || "", by: role, ts: Date.now() }).catch(() => {});
}
function onListen(d) {   // the other one started a song for you both
  if (!d || d.by === role || Date.now() - d.ts > 60000) return;
  toast(NAME[d.by] + " started “" + d.title + "” for you both ♪");
  if (spTok && ls("sp_together") !== "0") playOnMine(d, true);
}

// ----- the Music panel -----
const playlistId = url => ((url || "").match(/playlist[/:]([A-Za-z0-9]{10,})/) || [])[1];
definePanel("music", "Music", body => {
  const card = (k, n) => h("div", { class: "card row", style: "flex-wrap:nowrap" },
    n && n.art ? h("img", { src: n.art, alt: "", style: "width:56px;height:56px;border-radius:6px;flex:0 0 auto" }) : h("div", { style: "font-size:2em;width:56px;text-align:center" }, "♪"),
    h("div", { style: "flex:1;min-width:0" }, h("b", null, who(k) + (n ? (k === me() ? " are" : " is") + " listening to" : (k === me() ? " aren't" : " isn't") + " playing anything")),
      n ? h("div", null, n.title + " — " + n.artist) : null,
      n ? h("div", { class: "row", style: "margin-top:4px" },
        n.url ? h("a", { class: "btn sm", href: n.url, target: "_blank", rel: "noopener" }, "Open in Spotify") : null,
        k !== me() ? h("button", { class: "btn sm", onclick: () => playOnMine(n) }, "Play on mine too") : null,
        h("button", { class: "btn sm p", onclick: () => listenTogether(n) }, "▶ Play for both of us")) : null));
  body.append(h("h4", null, "Right now"), card(me(), NOWP[me()]), card(other2(me()), NOWP[other2(me())]));
  // our playlist
  const id = playlistId(W.playlist);
  body.append(h("h4", null, "Our playlist"));
  if (id) {
    body.append(h("iframe", { src: "https://open.spotify.com/embed/playlist/" + id + "?utm_source=generator&theme=0", style: "width:100%;height:352px;border:0;border-radius:12px",
      allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture", loading: "lazy", title: "Our playlist" }));
    if (spTok) {
      const list = h("div", { style: "display:flex;flex-direction:column;gap:6px" });
      const load = h("button", { class: "btn", onclick: async () => {
        load.disabled = true; load.textContent = "Loading…";
        let r = await sp("/playlists/" + id + "/items?limit=50"); if (r && r.status === 404) r = await sp("/playlists/" + id + "/tracks?limit=50");
        if (!r || !r.ok) { load.textContent = "Couldn't load the songs"; return; }
        const j = await r.json(); load.remove();
        (j.items || []).map(x => x.track || x.item).filter(t => t && t.uri && t.type !== "episode").forEach(t => {
          const tr = { uri: t.uri, title: t.name, artist: (t.artists || []).map(a => a.name).join(", ") };
          list.append(h("div", { class: "card row", style: "flex-wrap:nowrap;padding:6px 10px" }, h("span", { style: "flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, tr.title + " — " + tr.artist),
            h("button", { class: "btn sm p", onclick: () => listenTogether(tr) }, "▶ both")));
        });
      } }, "Show songs to play together");
      body.append(load, list);
    }
  } else body.append(h("p", { class: "muted" }, "No playlist yet. Paste a Spotify playlist link below."));
  const link = h("input", { class: "in", placeholder: "https://open.spotify.com/playlist/…", value: W.playlist || "", style: "flex:1" });
  body.append(h("div", { class: "row" }, link, h("button", { class: "btn", onclick: () => {
    const v = link.value.trim(); if (v && !playlistId(v)) return toast("That doesn't look like a Spotify playlist link.");
    setWorld({ playlist: v }); toast(v ? "Playlist saved for you both ♪" : "Playlist removed."); rerender("music");
  } }, "Save")));
  // linking Spotify
  body.append(h("h4", null, "Your Spotify"));
  if (spTok) body.append(h("div", { class: "row" }, h("span", null, "Linked on this device ♥"), h("button", { class: "btn sm", onclick: () => { spForget(); rerender("music"); } }, "Unlink")),
    h("label", { class: "row" }, h("input", { type: "checkbox", checked: ls("sp_together") !== "0", onchange: e => ls("sp_together", e.target.checked ? "1" : "0") }),
      "Let " + NAME[other2(me())] + " start songs on my Spotify"));
  else body.append(h("button", { class: "btn p", onclick: spConnect }, "Link Spotify"),
    navigator.standalone ? h("p", { class: "muted" }, "On iPhone, link Spotify once from Safari (not the Home Screen app). After that the app picks it up.") : null);
  body.append(h("p", { class: "muted" }, "Playing together needs Spotify Premium for both of you and Spotify open on your phones. On phones the playlist above may only play 30-second previews; the ▶ buttons play full songs in your Spotify app."));
});
