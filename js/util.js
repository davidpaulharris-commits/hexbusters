/* Rush Hour – shared helpers, storage, toasts and sound effects */
window.RH = window.RH || {};
(function (RH) {
  'use strict';

  // Tiny element builder: h('div', {class:'x', onclick: fn}, 'text', child)
  RH.h = function (tag, props) {
    const e = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k === 'html') e.innerHTML = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) e.setAttribute(k, '');
        else e.setAttribute(k, v);
      }
    }
    for (let i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  };
  function add(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach((x) => add(e, x)); return; }
    e.append(c.nodeType ? c : String(c));
  }

  RH.randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  RH.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  RH.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  RH.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  RH.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Seeded random so every player gets the same task list
  RH.seeded = function (str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  RH.store = {
    get(k, d) { try { const v = localStorage.getItem('rh_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('rh_' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem('rh_' + k); } catch (e) { /* ignore */ } },
  };

  RH.fmtTime = function (ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };
  RH.money = function (pence, forceDecimals) {
    if (!forceDecimals && pence % 100 === 0) return '£' + pence / 100;
    return '£' + (pence / 100).toFixed(2);
  };

  // Toast messages at the top of the screen
  RH.toast = function (msg, ms) {
    let wrap = document.getElementById('toasts');
    if (!wrap) { wrap = RH.h('div', { id: 'toasts' }); document.body.append(wrap); }
    const t = RH.h('div', { class: 'toast' }, msg);
    wrap.append(t);
    while (wrap.children.length > 3) wrap.firstChild.remove();
    setTimeout(() => t.classList.add('out'), ms || 2600);
    setTimeout(() => t.remove(), (ms || 2600) + 400);
  };

  RH.shake = function (el) {
    if (!el) return;
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  };

  RH.say = function (text) {
    try {
      if (RH.Sound.muted || !window.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB'; u.rate = 0.95; u.pitch = 1;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* no speech */ }
  };

  // ---------- Sound effects (made with Web Audio, no files needed) ----------
  const Sound = RH.Sound = {
    ctx: null,
    muted: RH.store.get('muted', false),
    unlock() {
      try {
        if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      } catch (e) { /* no audio */ }
    },
    setMuted(m) { this.muted = m; RH.store.set('muted', m); },
    tone(freq, dur, o) {
      o = o || {};
      if (this.muted || !this.ctx) return;
      try {
        const c = this.ctx, t = c.currentTime + (o.at || 0);
        const osc = c.createOscillator(), g = c.createGain();
        osc.type = o.type || 'sine';
        osc.frequency.setValueAtTime(freq, t);
        if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
        const v = o.vol == null ? 0.16 : o.vol;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g); g.connect(c.destination);
        osc.start(t); osc.stop(t + dur + 0.05);
      } catch (e) { /* ignore */ }
    },
    noise(dur, o) {
      o = o || {};
      if (this.muted || !this.ctx) return;
      try {
        const c = this.ctx, t = c.currentTime + (o.at || 0);
        const len = Math.floor(c.sampleRate * dur);
        const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const s = c.createBufferSource(); s.buffer = buf;
        const f = c.createBiquadFilter(); f.type = o.filter || 'bandpass'; f.frequency.value = o.freq || 1000; f.Q.value = o.q || 1;
        const g = c.createGain(); g.gain.value = o.vol == null ? 0.15 : o.vol;
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
      } catch (e) { /* ignore */ }
    },
    play(name, n) {
      const T = this.tone.bind(this);
      switch (name) {
        case 'tap': T(660, 0.06, { type: 'triangle', vol: 0.07 }); break;
        case 'good': T(880, 0.1, { type: 'triangle' }); T(1320, 0.16, { type: 'triangle', at: 0.08 }); break;
        case 'bad': T(220, 0.28, { type: 'sawtooth', vol: 0.1, to: 120 }); break;
        case 'done': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.22, { type: 'triangle', at: i * 0.07, vol: 0.14 })); break;
        case 'pickup': T(700, 0.14, { type: 'square', vol: 0.06, to: 1500 }); break;
        case 'beep': T(1000, 0.12, { type: 'square', vol: 0.09 }); break;
        case 'go': T(523, 0.14, { type: 'square', vol: 0.09 }); T(1047, 0.35, { type: 'square', vol: 0.09, at: 0.15 }); break;
        case 'warn': T(440, 0.25, { type: 'square', vol: 0.09 }); T(440, 0.25, { type: 'square', vol: 0.09, at: 0.35 }); break;
        case 'freeze': T(1800, 0.7, { to: 300, vol: 0.12 }); this.noise(0.5, { freq: 6000, vol: 0.06 }); break;
        case 'splat': this.noise(0.3, { freq: 400, vol: 0.3, filter: 'lowpass' }); T(160, 0.2, { to: 60, vol: 0.12 }); break;
        case 'zap': T(1200, 0.2, { type: 'sawtooth', vol: 0.06, to: 200 }); break;
        case 'cash': T(2000, 0.05, { type: 'square', vol: 0.05 }); T(2600, 0.25, { vol: 0.1, at: 0.05 }); break;
        case 'quack': T(520, 0.13, { type: 'sawtooth', vol: 0.07, to: 340 }); break;
        case 'honk': T(330, 0.2, { type: 'square', vol: 0.08 }); T(330, 0.3, { type: 'square', vol: 0.08, at: 0.28 }); break;
        case 'splash': this.noise(0.6, { freq: 2500, vol: 0.15, q: 0.5 }); break;
        case 'bell': for (let i = 0; i < 26; i++) T(i % 2 ? 1250 : 1050, 0.07, { type: 'square', vol: 0.06, at: i * 0.08 }); break;
        case 'alarm': for (let i = 0; i < 5; i++) T(600, 0.45, { type: 'sawtooth', vol: 0.08, to: 1250, at: i * 0.5 }); break;
        case 'chime': [880, 698, 523].forEach((f, i) => { T(f, 1.0, { vol: 0.2, at: i * 0.45 }); T(f * 2, 0.6, { vol: 0.04, at: i * 0.45 }); }); break;
        case 'bong': for (let i = 0; i < (n || 4); i++) { T(196, 1.5, { vol: 0.25, at: i * 0.85 }); T(392, 1.0, { vol: 0.08, at: i * 0.85 }); T(587, 0.6, { vol: 0.04, at: i * 0.85 }); } break;
        case 'horn': T(311, 0.25, { type: 'square', vol: 0.09 }); T(311, 0.4, { type: 'square', vol: 0.09, at: 0.32 }); break;
        case 'win': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => T(f, 0.3, { type: 'triangle', at: i * 0.12, vol: 0.14 })); break;
        case 'lose': [392, 370, 349, 262].forEach((f, i) => T(f, i === 3 ? 0.8 : 0.3, { type: 'triangle', at: i * 0.32, vol: 0.14 })); break;
        case 'shutter': this.noise(0.12, { freq: 3000, vol: 0.25 }); break;
      }
    },
  };
  ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => Sound.unlock(), { passive: true }));
})(window.RH);
