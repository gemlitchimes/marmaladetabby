// Music-box chime synth shared by the content script and the popup (Web Audio, no audio files).
(() => {
  if (globalThis.TabbyChime) return;

  const DEFAULTS = {
    enabled: true,
    intro: true,
    sound: true,
    doneChime: true,
    volume: 55,
  };

  const SECONDS = { long: 2, medium: 0.8, short: 0.3, done: 2.6 };
  const NOTES = [1318.5, 1568, 1760, 2093, 2349.3, 2637, 3136, 3520];
  let ctx = null;

  function bell(ac, out, freq, start, dur, gain) {
    [1, 2.76, 5.4].forEach((ratio, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.value = freq * ratio;
      const peak = gain / (i + 1.5);
      const d = dur / (1 + i * 0.8);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(peak, start + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, start + d);
      o.connect(g).connect(out);
      o.start(start);
      o.stop(start + d + 0.05);
    });
  }

  function play(len, volume = DEFAULTS.volume) {
    try {
      ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      const ac = ctx;
      if (ac.state === "suspended") ac.resume();
      const total = SECONDS[len] ?? SECONDS.medium;
      const master = ac.createGain();
      master.gain.value = 0.36 * Math.max(0, Math.min(100, volume)) / 100;
      master.connect(ac.destination);
      const now = ac.currentTime;
      const pick = () => NOTES[Math.floor(Math.random() * NOTES.length)];

      if (len === "short") {
        bell(ac, master, pick(), now, total, 0.6);
      } else if (len === "medium") {
        bell(ac, master, pick(), now, total, 0.55);
        bell(ac, master, pick(), now + 0.09, total * 0.8, 0.4);
      } else if (len === "done") {
        [0, 2, 4, 5, 7].forEach((n, i) => {
          const t = i * 0.14;
          bell(ac, master, NOTES[n], now + t, total - t, 0.45 - i * 0.04);
        });
      } else {
        for (let i = 0; i < 6; i++) {
          const t = i * 0.16 + Math.random() * 0.06;
          bell(ac, master, pick(), now + t, Math.max(0.5, total - t), 0.5 - i * 0.05);
        }
      }
    } catch (_) { /* audio unavailable */ }
  }

  function lengthFor(el) {
    const explicit = el.dataset && el.dataset.chime;
    if (explicit && explicit in SECONDS) return explicit;
    if (el.tagName === "A" && el.getAttribute("href")) return "long";
    const r = el.getBoundingClientRect();
    return r.width * r.height < 4000 ? "short" : "medium";
  }

  globalThis.TabbyChime = { DEFAULTS, SECONDS, play, lengthFor };
})();
