// ---------- little sounds, made on the fly (no audio files) ----------
const SFX = (() => {
  let ac = null, muted = false;
  try { muted = localStorage.getItem("mute") === "1"; } catch (e) {}
  const ctx = () => {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ac.state === "suspended") ac.resume();
    return ac;
  };
  addEventListener("pointerdown", () => ctx(), { once: true });   // browsers only allow sound after a tap
  function tone(f0, f1, dur, type = "sine", vol = .06, delay = 0) {
    const a = ctx(); if (!a || muted) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .03);
  }
  function noise(dur, f0, f1, vol = .05, delay = 0, q = 1) {
    const a = ctx(); if (!a || muted) return;
    const t = a.currentTime + delay, n = a.createBufferSource(), b = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    n.connect(f).connect(g).connect(a.destination); n.start(t);
  }
  const SOUNDS = {
    tap: () => tone(660, 880, .06, "triangle", .03),
    pop: () => { tone(520, 1180, .12, "sine", .07); tone(1180, 1500, .08, "sine", .03, .07); },
    hug: () => { tone(392, 523, .25, "triangle", .05); tone(523, 659, .3, "triangle", .04, .12); },
    meow: () => { tone(700, 1100, .12, "triangle", .04); tone(1100, 620, .22, "triangle", .045, .11); },
    purr: () => noise(.6, 130, 90, .06, 0, 4),
    chime: () => [784, 988, 1319].forEach((f, i) => tone(f, 0, .35, "triangle", .04, i * .09)),
    letter: () => [659, 784, 1047, 1319].forEach((f, i) => tone(f, 0, .4, "sine", .04, i * .1)),
    page: () => noise(.18, 1800, 4000, .05, 0, .8),
    pour: () => { noise(.7, 600, 2400, .035, 0, 2); [0, .12, .25, .4].forEach(d => tone(900 + Math.random() * 500, 500, .08, "sine", .022, d)); },
    water: () => [0, .1, .2, .32, .45].forEach(d => tone(1200 + Math.random() * 800, 600, .07, "sine", .028, d)),
    shutter: () => { noise(.05, 3000, 3000, .09, 0, .5); noise(.07, 1500, 800, .07, .07, .5); },
    swish: () => noise(.25, 500, 3000, .035, 0, .7),
    sparkle: () => [0, .06, .12, .18].forEach((d, i) => tone(1568 + i * 220, 0, .18, "sine", .022, d)),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0, .3, "square", .022, i * .11)),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0, .3, "triangle", .04, i * .13)),
    on: () => tone(440, 660, .08, "square", .018), off: () => tone(660, 440, .08, "square", .018),
    heart: () => tone(880, 1320, .09, "sine", .035),
  };
  return {
    play(name) { try { SOUNDS[name] && SOUNDS[name](); } catch (e) {} },
    isMuted: () => muted,
    setMuted(v) { muted = v; try { localStorage.setItem("mute", v ? "1" : "0"); } catch (e) {} }
  };
})();
