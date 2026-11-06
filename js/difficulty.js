/* Rush Hour – age-based difficulty for maths, spelling and money tasks */
(function (RH) {
  'use strict';
  const r = RH.randInt, pick = RH.pick;
  const D = RH.Difficulty = {};

  // 0: up to 6, 1: 7–8, 2: 9–10, 3: 11–13, 4: 14 and over
  D.tier = function (age) {
    age = Number(age) || 10;
    if (age <= 6) return 0;
    if (age <= 8) return 1;
    if (age <= 10) return 2;
    if (age <= 13) return 3;
    return 4;
  };
  D.tierName = ['Starter', 'Easy', 'Medium', 'Tricky', 'Grown-up'];

  D.maths = function (t) {
    let a, b, c;
    switch (t) {
      case 0:
        if (Math.random() < 0.7) { a = r(1, 6); b = r(1, 10 - a); return { q: `${a} + ${b}`, a: a + b }; }
        a = r(3, 10); b = r(1, a - 1); return { q: `${a} − ${b}`, a: a - b };
      case 1:
        if (Math.random() < 0.5) { a = r(3, 12); b = r(2, 9); return { q: `${a} + ${b}`, a: a + b }; }
        a = r(8, 20); b = r(2, a - 2); return { q: `${a} − ${b}`, a: a - b };
      case 2: {
        const k = r(0, 2);
        if (k === 0) { a = r(2, 10); b = r(2, 10); return { q: `${a} × ${b}`, a: a * b }; }
        if (k === 1) { a = r(12, 55); b = r(11, 44); return { q: `${a} + ${b}`, a: a + b }; }
        a = r(30, 99); b = r(11, a - 5); return { q: `${a} − ${b}`, a: a - b };
      }
      case 3: {
        const k = r(0, 3);
        if (k === 0) { a = r(3, 12); b = r(6, 12); return { q: `${a} × ${b}`, a: a * b }; }
        if (k === 1) { b = r(3, 12); c = r(3, 12); return { q: `${b * c} ÷ ${b}`, a: c }; }
        if (k === 2) { a = r(120, 480); b = r(25, 99); return { q: `${a} − ${b}`, a: a - b }; }
        a = r(45, 190); b = r(36, 150); return { q: `${a} + ${b}`, a: a + b };
      }
      default: {
        const k = r(0, 4);
        if (k === 0) { a = r(14, 49); b = r(3, 9); return { q: `${a} × ${b}`, a: a * b }; }
        if (k === 1) { const p = pick([10, 20, 25, 50, 75]); b = pick([40, 60, 80, 120, 160, 200, 240]); return { q: `${p}% of ${b}`, a: (p * b) / 100 }; }
        if (k === 2) { a = r(6, 12); b = r(6, 12); c = r(5, 30); return { q: `${a} × ${b} − ${c}`, a: a * b - c }; }
        if (k === 3) { b = r(6, 15); c = r(11, 25); return { q: `${b * c} ÷ ${b}`, a: c }; }
        a = r(11, 15); return { q: `${a}²`, a: a * a };
      }
    }
  };

  // A clue whose answer is the single digit d (used for the vault code)
  D.digitClue = function (t, d) {
    if (t === 0) return { q: '⭐'.repeat(d), label: 'Count the stars' };
    if (t === 1) {
      if (Math.random() < 0.5) { const b = r(0, d); return { q: `${d - b} + ${b}` }; }
      const b = r(1, 9); return { q: `${d + b} − ${b}` };
    }
    if (t === 2) {
      const opts = [];
      if (d > 0) { const k = r(2, 5); opts.push(`${d * k} ÷ ${k}`); }
      for (let a = 2; a <= 9; a++) if (d % a === 0 && d / a >= 2 && d / a <= 9) opts.push(`${a} × ${d / a}`);
      opts.push(`half of ${d * 2}`);
      const b = r(10, 30); opts.push(`${d + b} − ${b}`);
      return { q: pick(opts) };
    }
    if (t === 3) {
      if (d > 0 && Math.random() < 0.5) { const k = r(3, 9); return { q: `${d * k} ÷ ${k}` }; }
      const a = r(2, 6), b = r(2, 6); const p = a * b;
      if (p >= d) return { q: `${a} × ${b} − ${p - d}` };
      return { q: `${a} × ${b} + ${d - p}` };
    }
    const k = r(2, 6), sum = d * k, x = r(1, Math.max(1, sum - 1));
    if (d > 0 && Math.random() < 0.5) return { q: `(${x} + ${sum - x}) ÷ ${k}` };
    const a = r(3, 5);
    return a * a >= d ? { q: `${a}² − ${a * a - d}` } : { q: `${a}² + ${d - a * a}` };
  };

  const WORDS = [
    [['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['hat', '🎩'], ['pig', '🐷'], ['bus', '🚌'], ['cup', '☕'], ['bed', '🛏️'], ['fox', '🦊'], ['egg', '🥚'], ['bee', '🐝'], ['car', '🚗']],
    [['frog', '🐸'], ['ship', '🚢'], ['tree', '🌳'], ['duck', '🦆'], ['cake', '🎂'], ['fish', '🐟'], ['star', '⭐'], ['rain', '🌧️'], ['book', '📖'], ['milk', '🥛'], ['moon', '🌙'], ['bike', '🚲'], ['shoe', '👟']],
    [['school', '🏫'], ['rabbit', '🐰'], ['garden', '🌷'], ['pencil', '✏️'], ['monkey', '🐵'], ['castle', '🏰'], ['planet', '🪐'], ['rocket', '🚀'], ['turtle', '🐢'], ['button', '🔘'], ['dragon', '🐉'], ['window', '🪟']],
    [['library'], ['because'], ['believe'], ['island'], ['friend'], ['science'], ['measure'], ['different'], ['calendar'], ['surprise'], ['knowledge'], ['favourite'], ['separate'], ['guard']],
    [['necessary'], ['rhythm'], ['accommodate'], ['conscience'], ['embarrass'], ['definitely'], ['mischievous'], ['questionnaire'], ['millennium'], ['occurrence'], ['bureaucracy'], ['manoeuvre']],
  ];
  D.words = function (t, n) {
    return RH.shuffle(WORDS[t]).slice(0, n).map(([w, e]) => ({ word: w, emoji: e || '' }));
  };
  D.wordShowMs = [4500, 4000, 3200, 2600, 2000];

  // Coins and notes in the till
  D.till = function (t) {
    const sets = [
      { vals: [100, 200], n: [3, 5], max: 1000 },
      { vals: [100, 200, 500], n: [3, 5], max: 2000 },
      { vals: [100, 200, 500, 1000, 2000], n: [4, 6], max: 6000 },
      { vals: [10, 20, 50, 100, 200, 500, 1000], n: [5, 7], max: 4000 },
      { vals: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000], n: [6, 9], max: 8000 },
    ][t];
    for (;;) {
      const n = r(sets.n[0], sets.n[1]);
      const items = [];
      for (let i = 0; i < n; i++) items.push(pick(sets.vals));
      const total = items.reduce((s, v) => s + v, 0);
      if (total <= sets.max) return { items: items.sort((a, b) => b - a), total, decimals: t >= 3 };
    }
  };

  // Checkout: prices, what the customer pays with, and the answer
  D.checkout = function (t) {
    const price = () => {
      switch (t) {
        case 0: return r(1, 3) * 100;
        case 1: return r(1, 4) * 100;
        case 2: return r(1, 9) * 50;
        case 3: return r(3, 59) * 10;
        default: return r(15, 999);
      }
    };
    const n = t === 0 ? 2 : t <= 2 ? 3 : r(3, 4);
    const prices = [];
    for (let i = 0; i < n; i++) prices.push(price());
    const total = prices.reduce((s, v) => s + v, 0);
    if (t === 0) return { prices, total, mode: 'total', answer: total, decimals: false };
    const pay = [500, 1000, 2000, 5000].find((p) => p > total) || 5000;
    return { prices, total, pay, mode: 'change', answer: pay - total, decimals: t >= 2 };
  };

  D.simonLength = [3, 4, 4, 5, 6];
  D.speed = [0.65, 0.8, 0.95, 1.1, 1.25];
  D.wordsOnly = (t) => t >= 2; // older players read words, younger players get pictures too

  // Parse "12.50", "£12.5", "12" into pence
  D.parsePence = function (s) {
    s = String(s).replace(/[£\s]/g, '');
    if (!/^\d+(\.\d{0,2})?$/.test(s)) return NaN;
    return Math.round(parseFloat(s) * 100);
  };
})(window.RH);
