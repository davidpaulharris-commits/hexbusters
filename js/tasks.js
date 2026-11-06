/* Rush Hour – the 20 mini-games (5 per map).
   Each task: { name, emoji, help, run(el, ctx) } where ctx = { tier, done(), good(), bad() }.
   run() may return a clean-up function. */
(function (RH) {
  'use strict';
  const h = RH.h, r = RH.randInt, pick = RH.pick, shuffle = RH.shuffle, D = RH.Difficulty;
  const T = RH.Tasks = {};
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }

  // ---------- Shared bits ----------
  function keypad(o) {
    let val = '';
    const disp = h('div', { class: 'kp-display' });
    const render = () => { disp.textContent = (o.prefix || '') + (val || '?'); disp.classList.toggle('empty', !val); };
    const press = (k) => {
      RH.Sound.play('tap');
      if (k === '⌫') val = val.slice(0, -1);
      else if (k === '.') { if (o.decimal && !val.includes('.')) val = (val || '0') + '.'; }
      else if (val.length < 8) { if (val.includes('.') && val.split('.')[1].length >= 2) return; val = val === '0' ? k : val + k; }
      render();
    };
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', o.decimal ? '.' : '', '0', '⌫'];
    const grid = h('div', { class: 'kp-grid' }, keys.map((k) => (k ? h('button', { class: 'kp-key', onclick: () => press(k) }, k) : h('span'))));
    const ok = h('button', { class: 'btn btn-go kp-ok', onclick: () => { if (val) o.onSubmit(val); } }, 'Check ✓');
    render();
    return { el: h('div', { class: 'keypad' }, disp, grid, ok), clear() { val = ''; render(); }, disp };
  }
  RH.keypad = keypad;

  function moneyEl(v, small) {
    if (v >= 500) {
      return h('div', { class: 'note n' + v + (small ? ' small' : '') }, h('span', { class: 'note-bank' }, 'BANK OF RUSH HOUR'), h('span', { class: 'note-val' }, '£' + v / 100), h('span', { class: 'note-star' }, '★'));
    }
    return h('div', { class: 'coin c' + v + (small ? ' small' : '') }, v >= 100 ? '£' + v / 100 : v + 'p');
  }
  RH.moneyEl = moneyEl;

  const FOODS = [['🍎', 'Apples'], ['🍌', 'Bananas'], ['🥛', 'Milk'], ['🍞', 'Bread'], ['🧀', 'Cheese'], ['🥚', 'Eggs'], ['🥕', 'Carrots'], ['🍪', 'Biscuits'], ['🧃', 'Juice'], ['🍅', 'Tomatoes'], ['🥦', 'Broccoli'], ['🍕', 'Pizza'], ['🍗', 'Chicken'], ['🐟', 'Fish'], ['🍇', 'Grapes'], ['🍓', 'Strawberries'], ['🧈', 'Butter'], ['🍚', 'Rice'], ['🥫', 'Beans'], ['🍦', 'Ice cream'], ['🍋', 'Lemons'], ['🥔', 'Potatoes']];

  // ================= SCHOOL =================
  T.books = {
    name: 'Sort the library books', emoji: '📚', help: 'Tap the shelf where each book belongs.',
    run(el, c) {
      const cats = shuffle([
        { name: 'Dinosaurs', icon: '🦖', items: ['🦖', '🦕'] },
        { name: 'Space', icon: '🚀', items: ['🚀', '🪐', '🌙', '👽', '🛸'] },
        { name: 'Animals', icon: '🐶', items: ['🐶', '🐱', '🐴', '🐰', '🐘', '🦁'] },
        { name: 'Cooking', icon: '🍰', items: ['🍰', '🍕', '🍳', '🧁', '🥞'] },
        { name: 'Sport', icon: '⚽', items: ['⚽', '🏀', '🎾', '🏈', '🏓'] },
      ]).slice(0, 3);
      const books = shuffle(cats.map((ct) => ({ cat: ct, e: pick(ct.items) })).concat([0, 1, 2].map(() => { const ct = pick(cats); return { cat: ct, e: pick(ct.items) }; })));
      const colours = ['#e63946', '#3a86ff', '#2a9d8f', '#8338ec', '#f4a261', '#ff70a6'];
      let i = 0;
      const prog = h('div', { class: 't-prog' });
      const book = h('div', { class: 'book' });
      const shelves = h('div', { class: 'choice-row' }, cats.map((ct) => h('button', { class: 'choice', onclick: () => tap(ct) }, h('span', { class: 'big' }, ct.icon), h('span', null, ct.name))));
      function show() { prog.textContent = `Book ${i + 1} of ${books.length}`; book.style.background = colours[i % colours.length]; book.textContent = books[i].e; }
      function tap(ct) {
        if (ct === books[i].cat) { c.good(); i++; if (i >= books.length) return c.done(); show(); }
        else { c.bad(); RH.shake(book); }
      }
      el.append(prog, h('div', { class: 'center' }, book), h('p', { class: 't-sub' }, 'Which shelf does this book go on?'), shelves);
      show();
    },
  };

  T.maths = {
    name: 'Solve the maths sums', emoji: '➗', help: 'Work out each sum on the whiteboard.',
    run(el, c) {
      const qs = [0, 1, 2].map(() => D.maths(c.tier));
      let i = 0, wrong = 0;
      const prog = h('div', { class: 't-prog' });
      const board = h('div', { class: 'whiteboard' });
      const kp = keypad({
        onSubmit: (v) => {
          if (Number(v) === qs[i].a) { c.good(); i++; wrong = 0; if (i >= qs.length) return c.done(); show(); }
          else {
            c.bad(); RH.shake(board); kp.clear(); wrong++;
            if (wrong >= 3) { RH.toast("Let's try a different one"); qs[i] = D.maths(c.tier); wrong = 0; show(); }
          }
        },
      });
      function show() { prog.textContent = `Sum ${i + 1} of ${qs.length}`; board.textContent = qs[i].q + ' = ?'; kp.clear(); }
      el.append(prog, board, kp.el);
      show();
    },
  };

  T.pekit = {
    name: 'Find your lost PE kit', emoji: '👟', help: 'Open the lockers to find your shirt, shorts and trainers.',
    run(el, c) {
      const kit = ['👕', '🩳', '👟'];
      const junk = shuffle(['🧦', '🍌', '🕷️', '📎', '🥪', '🧽', '🏸', '🧢', '🍪']).slice(0, 5);
      const contents = shuffle(kit.concat(junk, ['', '', '', '']));
      const found = new Set();
      const list = h('div', { class: 'kit-list' }, kit.map((k) => h('span', { class: 'kit-item', 'data-k': k }, k)));
      const grid = h('div', { class: 'lockers' }, contents.map((item, i) => {
        const b = h('button', { class: 'locker' }, h('span', { class: 'locker-n' }, i + 1));
        b.addEventListener('click', () => {
          if (b.classList.contains('open')) return;
          b.classList.add('open'); b.textContent = item || '·';
          if (kit.includes(item)) {
            found.add(item); c.good();
            list.querySelector(`[data-k="${item}"]`).classList.add('got');
            if (found.size === kit.length) setTimeout(() => c.done(), 350);
          } else RH.Sound.play('tap');
        });
        return b;
      }));
      el.append(h('p', { class: 't-sub' }, 'Find all three:'), list, grid);
    },
  };

  T.wires = {
    name: 'Fix the projector wires', emoji: '📽️', help: 'Tap a wire on the left, then the same colour on the right.',
    run(el, c) {
      const all = [['#e63946', 'Red'], ['#3a86ff', 'Blue'], ['#ffd166', 'Yellow'], ['#2ec4b6', 'Green'], ['#8338ec', 'Purple']];
      const n = c.tier >= 3 ? 5 : 4;
      const left = all.slice(0, n);
      let right;
      do { right = shuffle(left); } while (right.every((x, i) => x === left[i]));
      const H = 56 * n + 24;
      const s = svg('svg', { viewBox: `0 0 300 ${H}`, class: 'wires-svg' });
      const lines = svg('g', {}); s.append(lines);
      const ys = (i) => 40 + i * 56;
      let sel = null, connected = 0;
      const doneL = new Set(), doneR = new Set();
      const nodes = { L: [], R: [] };
      ['L', 'R'].forEach((side) => {
        const arr = side === 'L' ? left : right;
        arr.forEach(([col], i) => {
          const x = side === 'L' ? 50 : 250;
          s.append(svg('rect', { x: side === 'L' ? 0 : 250, y: ys(i) - 7, width: 50, height: 14, fill: col, rx: 3 }));
          const node = svg('circle', { cx: x, cy: ys(i), r: 17, fill: col, stroke: '#1b1f3b', 'stroke-width': 3, class: 'wire-node' });
          node.addEventListener('click', () => tap(side, i));
          nodes[side].push(node);
          s.append(node);
        });
      });
      function highlight() {
        ['L', 'R'].forEach((sd) => nodes[sd].forEach((nd, i) => nd.setAttribute('stroke', sel && sel.side === sd && sel.i === i ? '#fff' : '#1b1f3b')));
      }
      function tap(side, i) {
        if ((side === 'L' ? doneL : doneR).has(i)) return;
        RH.Sound.play('tap');
        if (!sel || sel.side === side) { sel = { side, i }; highlight(); return; }
        const li = side === 'L' ? i : sel.i, ri = side === 'R' ? i : sel.i;
        sel = null; highlight();
        const line = svg('line', { x1: 50, y1: ys(li), x2: 250, y2: ys(ri), stroke: left[li][0], 'stroke-width': 10, 'stroke-linecap': 'round' });
        lines.append(line);
        if (left[li] === right[ri]) {
          doneL.add(li); doneR.add(ri); connected++; c.good();
          if (connected === n) setTimeout(() => c.done(), 350);
        } else {
          line.setAttribute('stroke', '#555'); line.setAttribute('stroke-dasharray', '6 6');
          c.bad(); setTimeout(() => line.remove(), 450);
        }
      }
      el.append(h('p', { class: 't-sub' }, 'Join each wire to the same colour.'), h('div', { class: 'center' }, s));
    },
  };

  T.spelling = {
    name: 'Spelling test', emoji: '🔤', help: 'Remember the word, then spell it with the letter tiles.',
    run(el, c) {
      const words = D.words(c.tier, 2);
      const showMs = D.wordShowMs[c.tier];
      let i = 0, timer = null;
      const prog = h('div', { class: 't-prog' });
      const stage = h('div', { class: 'spell-stage' });
      el.append(prog, stage);
      function memorise() {
        const w = words[i];
        prog.textContent = `Word ${i + 1} of ${words.length}`;
        const bar = h('div', { class: 'timebar-fill' });
        stage.replaceChildren(
          h('p', { class: 't-sub' }, 'Remember this word!'),
          w.emoji ? h('div', { class: 'spell-emoji' }, w.emoji) : null,
          h('div', { class: 'spell-word' }, w.word.toUpperCase()),
          h('div', { class: 'timebar' }, bar),
        );
        requestAnimationFrame(() => { bar.style.transition = `width ${showMs}ms linear`; bar.style.width = '0%'; });
        timer = setTimeout(play, showMs);
      }
      function play() {
        const w = words[i], target = w.word.toUpperCase();
        const abc = 'ABCDEFGHIJKLMNOPRSTUWY';
        const letters = shuffle(target.split('').concat([pick(abc.split('')), pick(abc.split(''))]));
        let typed = [];
        const slots = h('div', { class: 'spell-slots' }, target.split('').map(() => h('span', { class: 'slot' })));
        const tiles = h('div', { class: 'spell-tiles' }, letters.map((L, idx) => {
          const b = h('button', { class: 'tile' }, L);
          b.addEventListener('click', () => {
            if (b.disabled || typed.length >= target.length) return;
            RH.Sound.play('tap');
            typed.push({ L, b }); b.disabled = true; refresh();
            if (typed.length === target.length) check();
          });
          return b;
        }));
        const refresh = () => { [...slots.children].forEach((s, k) => { s.textContent = typed[k] ? typed[k].L : ''; }); };
        const check = () => {
          if (typed.map((t) => t.L).join('') === target) {
            c.good(); i++;
            if (i >= words.length) return c.done();
            setTimeout(memorise, 400);
          } else {
            c.bad(); RH.shake(slots);
            setTimeout(() => { typed.forEach((t) => { t.b.disabled = false; }); typed = []; refresh(); }, 500);
          }
        };
        const back = h('button', { class: 'btn btn-small', onclick: () => { const t = typed.pop(); if (t) { t.b.disabled = false; refresh(); } } }, '⌫ Undo');
        const peek = h('button', { class: 'btn btn-small', onclick: () => { peekBox.textContent = target; peekBox.classList.add('show'); setTimeout(() => peekBox.classList.remove('show'), 1300); } }, '👀 Peek');
        const peekBox = h('div', { class: 'peek' });
        stage.replaceChildren(
          h('p', { class: 't-sub' }, 'Now spell it!'),
          w.emoji ? h('div', { class: 'spell-emoji small' }, w.emoji) : null,
          h('div', { class: 'rel' }, slots, peekBox),
          tiles,
          h('div', { class: 'row-gap' }, back, peek),
        );
      }
      memorise();
      return () => clearTimeout(timer);
    },
  };

  // ================= BANK =================
  T.vault = {
    name: 'Crack the vault code', emoji: '🔐', help: 'Solve each clue to find the three numbers of the code.',
    run(el, c) {
      const digits = [0, 1, 2].map(() => (c.tier === 0 ? r(1, 6) : r(0, 9)));
      const clues = digits.map((d) => D.digitClue(c.tier, d));
      const vals = [0, 0, 0];
      const ord = ['1st', '2nd', '3rd'];
      const cards = h('div', { class: 'clues' }, clues.map((cl, i) => h('div', { class: 'clue' }, h('b', null, ord[i] + ' number'), h('span', { class: 'clue-q' }, cl.q), cl.label ? h('small', null, cl.label) : null)));
      const dials = [0, 1, 2].map((i) => {
        const v = h('div', { class: 'dial-v' }, '0');
        const set = (d) => { vals[i] = (vals[i] + d + 10) % 10; v.textContent = vals[i]; box.classList.remove('right', 'wrong'); RH.Sound.play('tap'); };
        const box = h('div', { class: 'dial' }, h('button', { class: 'dial-b', onclick: () => set(1) }, '▲'), v, h('button', { class: 'dial-b', onclick: () => set(-1) }, '▼'));
        return box;
      });
      const door = h('div', { class: 'vault-door' }, h('div', { class: 'dials' }, dials));
      const open = h('button', { class: 'btn btn-go', onclick: () => {
        let ok = true;
        dials.forEach((d, i) => { const right = vals[i] === digits[i]; d.classList.toggle('right', right); d.classList.toggle('wrong', !right); if (!right) ok = false; });
        if (ok) { door.classList.add('opened'); c.good(); setTimeout(() => c.done(), 600); } else { c.bad(); RH.shake(door); }
      } }, 'Open the vault 🔓');
      el.append(cards, door, h('div', { class: 'center' }, open));
    },
  };

  T.till = {
    name: 'Count the cash in the till', emoji: '💷', help: 'Add up all the money in the till.',
    run(el, c) {
      let g = D.till(c.tier), wrong = 0;
      const tray = h('div', { class: 'till-tray' });
      const prompt = h('p', { class: 't-sub' });
      const kp = keypad({
        decimal: g.decimals, prefix: '£',
        onSubmit: (v) => {
          if (D.parsePence(v) === g.total) { c.good(); c.done(); return; }
          c.bad(); RH.shake(tray); kp.clear(); wrong++;
          if (wrong >= 3) { RH.toast("Let's count a new till"); g = D.till(c.tier); wrong = 0; show(); }
        },
      });
      function show() {
        tray.replaceChildren(...g.items.map((v) => moneyEl(v)));
        prompt.textContent = g.decimals ? 'How much money is in the till? (like 12.50)' : 'How many pounds are in the till?';
      }
      show();
      el.append(tray, prompt, kp.el);
    },
  };

  T.coins = {
    name: 'Sort the coins', emoji: '🪙', help: 'Tap the pile that matches each coin.',
    run(el, c) {
      const types = c.tier === 0 ? [10, 50, 100] : c.tier === 1 ? [10, 20, 50, 100] : [10, 20, 50, 100, 200];
      const queue = Array.from({ length: 8 }, () => pick(types));
      let i = 0;
      const counts = {};
      const prog = h('div', { class: 't-prog' });
      const cur = h('div', { class: 'coin-current' });
      const piles = h('div', { class: 'choice-row wrap' }, types.map((v) => {
        const cnt = h('span', { class: 'pile-count' }, '0');
        counts[v] = cnt;
        return h('button', { class: 'choice pile', onclick: () => tap(v) }, moneyEl(v, true), cnt);
      }));
      function show() { prog.textContent = `Coin ${i + 1} of ${queue.length}`; cur.replaceChildren(moneyEl(queue[i])); }
      function tap(v) {
        if (v === queue[i]) { RH.Sound.play('cash'); counts[v].textContent = +counts[v].textContent + 1; i++; if (i >= queue.length) return c.done(); show(); }
        else { c.bad(); RH.shake(cur); }
      }
      el.append(prog, h('div', { class: 'center' }, cur), h('p', { class: 't-sub' }, 'Which pile does it go on?'), piles);
      show();
    },
  };

  T.fake = {
    name: 'Spot the fake banknote', emoji: '🕵️', help: 'One note is a fake. Find the one that looks different!',
    run(el, c) {
      const easy = ['emblem', 'colour', 'missing'], hard = ['spelling', 'value', 'colour2', 'emblem2'];
      const kinds = c.tier <= 1 ? easy : c.tier === 2 ? easy.concat(hard) : hard;
      const rounds = 2;
      let round = 0;
      const prog = h('div', { class: 't-prog' });
      const grid = h('div', { class: 'fake-grid' });
      const baseCol = { 5: '#3aa57a', 10: '#e07b39', 20: '#7b4fc9' };
      function note(val, mod) {
        let col = baseCol[val], text = 'BANK OF RUSH HOUR', v = '£' + val, emblem = '★', serial = 'RH ' + r(100000, 999999);
        if (mod === 'colour') col = val === 10 ? '#3a86ff' : '#e63946';
        if (mod === 'colour2') col = RH.Avatar.shade(col, 0.28);
        if (mod === 'emblem') emblem = '🦆';
        if (mod === 'emblem2') emblem = '☆';
        if (mod === 'missing') emblem = '';
        if (mod === 'spelling') text = pick(['BANK OF RUSH HUOR', 'BANK OF RUHS HOUR', 'BAKN OF RUSH HOUR']);
        if (mod === 'value') v = { 5: '£S', 10: '£1O', 20: '£2O' }[val];
        return h('button', { class: 'note big-note', style: { background: col } }, h('span', { class: 'note-bank' }, text), h('span', { class: 'note-val' }, v), h('span', { class: 'note-star' }, emblem), h('span', { class: 'note-serial' }, serial));
      }
      function show() {
        prog.textContent = `Round ${round + 1} of ${rounds}`;
        const val = pick([5, 10, 20]), mod = pick(kinds), fakeAt = r(0, 5);
        grid.replaceChildren(...[0, 1, 2, 3, 4, 5].map((k) => {
          const b = note(val, k === fakeAt ? mod : null);
          b.addEventListener('click', () => {
            if (b.classList.contains('real')) return;
            if (k === fakeAt) { c.good(); round++; if (round >= rounds) return c.done(); show(); }
            else { b.classList.add('real'); c.bad(); }
          });
          return b;
        }));
      }
      el.append(prog, grid);
      show();
    },
  };

  T.atm = {
    name: 'Fix the cash machine', emoji: '🏧', help: 'Watch the buttons light up, then press them in the same order.',
    run(el, c) {
      const L = D.simonLength[c.tier];
      const seq = Array.from({ length: L }, () => r(0, 3));
      const cols = ['#e63946', '#3a86ff', '#ffd166', '#2ec4b6'], syms = ['▲', '●', '■', '★'], tones = [330, 392, 494, 587];
      const timers = [];
      let pos = 0, locked = true;
      const screen = h('div', { class: 'atm-screen' }, 'Get ready…');
      const btns = cols.map((col, i) => h('button', { class: 'atm-btn', style: { background: col }, onclick: () => press(i) }, syms[i]));
      const light = (i) => { btns[i].classList.add('lit'); RH.Sound.tone(tones[i], 0.3, { type: 'triangle', vol: 0.15 }); timers.push(setTimeout(() => btns[i].classList.remove('lit'), 380)); };
      function playSeq() {
        locked = true; pos = 0; screen.textContent = 'Watch carefully…';
        seq.forEach((b, k) => timers.push(setTimeout(() => light(b), 500 + k * 650)));
        timers.push(setTimeout(() => { locked = false; screen.textContent = 'Your turn!'; }, 500 + L * 650));
      }
      function press(i) {
        if (locked) return;
        light(i);
        if (seq[pos] === i) {
          pos++;
          screen.textContent = `${pos} / ${L}`;
          if (pos === L) { locked = true; screen.textContent = 'Fixed! 💷'; timers.push(setTimeout(() => c.done(), 500)); }
        } else { locked = true; c.bad(); screen.textContent = 'Oops! Watch again'; timers.push(setTimeout(playSeq, 900)); }
      }
      el.append(h('div', { class: 'atm' }, screen, h('div', { class: 'atm-grid' }, btns)), h('div', { class: 'center' }, h('button', { class: 'btn btn-small', onclick: () => { if (!locked) playSeq(); } }, '🔁 Show me again')));
      timers.push(setTimeout(playSeq, 300));
      return () => timers.forEach(clearTimeout);
    },
  };

  // ================= SHOPPING CENTRE =================
  T.shoplist = {
    name: 'Shopping list', emoji: '🛒', help: 'Find everything on the shopping list.',
    run(el, c) {
      const n = c.tier === 0 ? 3 : c.tier <= 2 ? 4 : 5;
      const all = shuffle(FOODS);
      const list = all.slice(0, n);
      const shelf = shuffle(all.slice(0, 16));
      const words = D.wordsOnly(c.tier);
      const got = new Set();
      const listEl = h('div', { class: 'shop-list' }, list.map(([e, name]) => h('div', { class: 'shop-li', 'data-e': e }, words ? '' : e + ' ', name)));
      const grid = h('div', { class: 'shelf-grid' }, shelf.map(([e]) => {
        const b = h('button', { class: 'shelf-item' }, e);
        b.addEventListener('click', () => {
          if (got.has(e)) return;
          if (list.some((x) => x[0] === e)) {
            got.add(e); b.classList.add('got'); listEl.querySelector(`[data-e="${e}"]`).classList.add('got'); c.good();
            if (got.size === list.length) setTimeout(() => c.done(), 300);
          } else { c.bad(); RH.shake(b); }
        });
        return b;
      }));
      el.append(h('div', { class: 'paper' }, h('b', null, '📝 Shopping list'), listEl), grid);
    },
  };

  T.checkout = {
    name: 'Work the checkout', emoji: '🧾', help: 'Scan every item, then work out the answer.',
    run(el, c) {
      const g = D.checkout(c.tier);
      const foods = shuffle(FOODS).slice(0, g.prices.length);
      const dec = g.decimals || c.tier >= 2;
      let scanned = 0;
      const receipt = h('div', { class: 'receipt' }, h('b', null, '🧾 Receipt'));
      const ask = h('div', { class: 'checkout-ask' });
      const belt = h('div', { class: 'belt' }, foods.map(([e, name], i) => {
        const b = h('button', { class: 'belt-item' }, e);
        b.addEventListener('click', () => {
          if (b.disabled) return;
          b.disabled = true; b.classList.add('scanned'); RH.Sound.play('beep');
          receipt.append(h('div', { class: 'r-line' }, h('span', null, `${e} ${name}`), h('span', null, RH.money(g.prices[i], dec))));
          scanned++;
          if (scanned === foods.length) question();
        });
        return b;
      }));
      function question() {
        let wrong = 0;
        const kp = keypad({
          decimal: dec, prefix: '£',
          onSubmit: (v) => {
            if (D.parsePence(v) === g.answer) { c.good(); c.done(); return; }
            c.bad(); RH.shake(ask); kp.clear(); wrong++;
            if (wrong >= 3) { hint.textContent = g.mode === 'total' ? 'Hint: add the prices on the receipt together.' : `Hint: ${RH.money(g.pay, dec)} take away ${RH.money(g.total, dec)}.`; }
          },
        });
        const hint = h('p', { class: 't-hint' });
        if (g.mode === 'total') ask.replaceChildren(h('p', { class: 't-sub' }, 'How much is that altogether?'), kp.el, hint);
        else {
          receipt.append(h('div', { class: 'r-line r-total' }, h('span', null, 'TOTAL'), h('span', null, RH.money(g.total, dec))));
          ask.replaceChildren(h('p', { class: 't-sub' }, 'The customer pays with ', moneyEl(g.pay, true), ' How much change do they get?'), kp.el, hint);
        }
      }
      el.append(h('p', { class: 't-sub' }, 'Tap each item to scan it.'), belt, receipt, ask);
    },
  };

  T.mannequin = {
    name: 'Dress the mannequin', emoji: '👗', help: 'Make the mannequin look just like the picture.',
    run(el, c) {
      const slots = [{ name: 'Hat', o: ['🎩', '🧢', '👒', '🎓'] }, { name: 'Top', o: ['👕', '👚', '🧥', '👔'] }, { name: 'Bag', o: ['👜', '🎒', '👛', '💼'] }, { name: 'Shoes', o: ['👟', '👞', '👠', '🥾'] }];
      const target = slots.map(() => r(0, 3));
      const cur = target.map((t) => (t + r(1, 3)) % 4);
      let finished = false;
      const card = h('div', { class: 'mq-card' }, h('b', null, 'Make it look like this:'), h('div', { class: 'mq-target' }, slots.map((s, i) => h('span', null, s.o[target[i]]))));
      const rows = slots.map((s, i) => {
        const v = h('button', { class: 'mq-val', onclick: () => step(1) }, s.o[cur[i]]);
        const step = (d) => { if (finished) return; cur[i] = (cur[i] + d + 4) % 4; v.textContent = s.o[cur[i]]; RH.Sound.play('tap'); check(); };
        return h('div', { class: 'mq-row' }, h('span', { class: 'mq-label' }, s.name), h('button', { class: 'dial-b', onclick: () => step(-1) }, '◀'), v, h('button', { class: 'dial-b', onclick: () => step(1) }, '▶'));
      });
      function check() { if (cur.every((v, i) => v === target[i])) { finished = true; c.good(); setTimeout(() => c.done(), 400); } }
      el.append(card, h('div', { class: 'mq' }, h('div', { class: 'mq-dummy' }, '🧍'), h('div', null, rows)));
    },
  };

  T.cctv = {
    name: 'Find the lost teddy', emoji: '🧸', help: 'Switch between the cameras and tap the teddy when you spot it.',
    run(el, c) {
      const teddyCam = r(0, 3);
      const things = ['🧍', '🧑', '👩', '👨', '👵', '🧒', '🛍️', '🪑', '🌵', '🎈', '🛒', '🧳', '🐶', '📦', '🗑️', '🧃', '👜', '🌴'];
      const decoys = c.tier >= 2 ? ['🐻', '🐼', '🐨', '🐵'] : [];
      const count = 14 + c.tier * 3;
      const scenes = [0, 1, 2, 3].map((cam) => {
        const items = [];
        let tx = 0, ty = 0;
        if (cam === teddyCam) { tx = r(8, 88); ty = r(12, 86); items.push({ e: '🧸', x: tx, y: ty, s: c.tier >= 3 ? 20 : 24, teddy: true }); }
        for (let k = 0; k < count; k++) {
          let x, y, tries = 0;
          do { x = r(4, 92); y = r(8, 90); tries++; } while (cam === teddyCam && Math.hypot(x - tx, (y - ty) * 0.75) < 9 && tries < 20);
          items.push({ e: decoys.length && Math.random() < 0.18 ? pick(decoys) : pick(things), x, y, s: r(20, 32) });
        }
        return shuffle(items);
      });
      let cam = 0;
      const view = h('div', { class: 'cctv-view' });
      const tabs = h('div', { class: 'cctv-tabs' }, [0, 1, 2, 3].map((k) => h('button', { class: 'cctv-tab', onclick: () => { cam = k; show(); RH.Sound.play('tap'); } }, 'CAM ' + (k + 1))));
      function show() {
        [...tabs.children].forEach((t, k) => t.classList.toggle('on', k === cam));
        view.replaceChildren(h('span', { class: 'rec' }, '● REC  CAM ' + (cam + 1)), ...scenes[cam].map((it) => {
          const s = h('span', { class: 'cctv-thing', style: { left: it.x + '%', top: it.y + '%', fontSize: it.s + 'px' } }, it.e);
          s.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); if (it.teddy) { c.good(); s.classList.add('found'); setTimeout(() => c.done(), 400); } else { RH.Sound.play('tap'); } });
          return s;
        }));
      }
      el.append(tabs, view);
      show();
    },
  };

  T.coffee = {
    name: 'Make the coffee order', emoji: '☕', help: 'Make the drink exactly how the customer ordered it.',
    run(el, c) {
      const rowsDef = [
        { key: 'size', label: 'Size', o: [['Small', '🥤'], ['Medium', '🥤'], ['Large', '🥤']] },
        { key: 'drink', label: 'Drink', o: [['Latte', '☕'], ['Hot chocolate', '🍫'], ['Tea', '🍵'], ['Babyccino', '🥛']] },
        { key: 'sugar', label: 'Sugar', o: [['None', '0'], ['One', '1'], ['Two', '2'], ['Three', '3']] },
        { key: 'top', label: 'Topping', o: [['None', '🚫'], ['Sprinkles', '🌈'], ['Marshmallows', '☁️'], ['Cream', '🍦']] },
      ].filter((rw) => !(c.tier === 0 && rw.key === 'sugar'));
      const order = {}, chosen = {};
      rowsDef.forEach((rw) => { order[rw.key] = r(0, rw.o.length - 1); chosen[rw.key] = -1; });
      const words = D.wordsOnly(c.tier);
      const sugarWords = ['no sugar', 'one sugar', 'two sugars', 'three sugars'];
      const topWords = ['no topping', 'sprinkles', 'marshmallows', 'cream'];
      let ticket;
      if (words) {
        const size = rowsDef[0].o[order.size][0].toLowerCase(), drink = rowsDef[1].o[order.drink][0].toLowerCase();
        const sugar = order.sugar != null ? sugarWords[order.sugar] : null;
        ticket = `“A ${size} ${drink}${sugar ? ' with ' + sugar : ''} and ${topWords[order.top]}, please!”`;
      } else {
        ticket = rowsDef.map((rw) => { const o = rw.o[order[rw.key]]; return rw.key === 'sugar' ? `${o[1]} sugar` : `${rw.key === 'size' ? '' : o[1] + ' '}${o[0]}`; }).join(' · ');
      }
      const rowEls = rowsDef.map((rw) => {
        const btns = rw.o.map((o, i) => h('button', { class: 'seg', onclick: () => { chosen[rw.key] = i; RH.Sound.play('tap'); btns.forEach((b, k) => b.classList.toggle('on', k === i)); row.classList.remove('wrong'); } }, rw.key === 'size' ? h('span', { style: { fontSize: [14, 19, 25][i] + 'px' } }, o[1]) : o[1], h('small', null, o[0])));
        const row = h('div', { class: 'seg-row' }, h('span', { class: 'mq-label' }, rw.label), h('div', { class: 'segs' }, btns));
        row._key = rw.key;
        return row;
      });
      const serve = h('button', { class: 'btn btn-go', onclick: () => {
        let ok = true;
        rowEls.forEach((row) => { const bad = chosen[row._key] !== order[row._key]; row.classList.toggle('wrong', bad); if (bad) ok = false; });
        if (ok) { c.good(); c.done(); } else { c.bad(); RH.toast("That's not quite what they ordered!"); }
      } }, 'Serve it ☕');
      el.append(h('div', { class: 'paper ticket' }, h('b', null, '🧾 Order'), h('p', null, ticket)), ...rowEls, h('div', { class: 'center' }, serve));
    },
  };

  // ================= TOWN =================
  T.letters = {
    name: 'Deliver the letters', emoji: '✉️', help: 'Post each letter through the right door.',
    run(el, c) {
      const two = c.tier >= 2;
      const streets = two ? ['Oak Road', 'Elm Street'] : ['Oak Road'];
      const per = two ? 8 : 10;
      const letters = shuffle(streets.flatMap((s) => Array.from({ length: per }, (_, k) => ({ s, n: k + 1 })))).slice(0, 5);
      let i = 0;
      const prog = h('div', { class: 't-prog' });
      const env = h('div', { class: 'envelope' });
      const houses = h('div', null, streets.map((s) => h('div', { class: 'street' }, two ? h('div', { class: 'street-name' }, s) : null, h('div', { class: 'houses' + (two ? ' four' : '') }, Array.from({ length: per }, (_, k) => {
        const b = h('button', { class: 'house' }, h('span', { class: 'roof' }), h('span', { class: 'door' }, k + 1));
        b.addEventListener('click', () => {
          const L = letters[i];
          if (L.s === s && L.n === k + 1) { c.good(); b.classList.add('posted'); setTimeout(() => b.classList.remove('posted'), 500); i++; if (i >= letters.length) return c.done(); show(); }
          else { c.bad(); RH.shake(env); }
        });
        return b;
      })))));
      function show() {
        const L = letters[i];
        prog.textContent = `Letter ${i + 1} of ${letters.length}`;
        env.replaceChildren(h('span', { class: 'stamp' }, '👑'), h('small', null, 'To:'), h('b', null, two ? `${L.n} ${L.s}` : `House number ${L.n}`));
      }
      el.append(prog, h('div', { class: 'center' }, env), houses);
      show();
    },
  };

  T.crossing = {
    name: 'Help the lady cross the road', emoji: '👵', help: 'Tap GO to step forward one lane when it is safe.',
    run(el, c) {
      const W = 320, Hh = 380, laneH = 80, top = 50;
      const cv = h('canvas', { class: 'cross-canvas', width: W * 2, height: Hh * 2 });
      const ctx = cv.getContext('2d'); ctx.scale(2, 2);
      const sp = D.speed[c.tier];
      const lanes = [0, 1, 2].map((k) => {
        const dir = k % 2 ? 1 : -1, speed = (80 + k * 28) * sp;
        const cars = []; let x = r(0, 120);
        while (x < W + 300) { cars.push({ x, e: pick(['🚗', '🚙', '🚕', '🚌', '🚚']) }); x += r(170, 250); }
        return { y: top + (2 - k) * laneH + laneH / 2, dir, speed, cars };
      });
      let lane = 0, drawY = Hh - 35, raf = 0, last = performance.now(), hitUntil = 0, finished = false;
      const ladyY = (L) => (L === 0 ? Hh - 35 : L === 4 ? 25 : lanes[L - 1].y);
      const go = h('button', { class: 'btn btn-go big-go', onclick: () => { if (finished || performance.now() < hitUntil) return; lane++; RH.Sound.play('tap'); if (lane === 4) { finished = true; c.good(); setTimeout(() => c.done(), 600); } } }, 'GO ⬆');
      function loop(t) {
        const dt = Math.min(0.05, (t - last) / 1000); last = t;
        lanes.forEach((L) => L.cars.forEach((car) => { car.x += L.dir * L.speed * dt; const span = W + 300; if (L.dir > 0 && car.x > W + 150) car.x -= span; if (L.dir < 0 && car.x < -150) car.x += span; }));
        drawY += (ladyY(lane) - drawY) * Math.min(1, dt * 14);
        if (lane >= 1 && lane <= 3 && !finished) {
          const L = lanes[lane - 1];
          if (Math.abs(drawY - L.y) < 22 && L.cars.some((car) => Math.abs(car.x - W / 2) < 36)) {
            lane = 0; hitUntil = performance.now() + 700; RH.Sound.play('honk'); c.bad(); RH.shake(cv);
          }
        }
        // draw
        ctx.fillStyle = '#cfc9bd'; ctx.fillRect(0, 0, W, Hh);
        ctx.fillStyle = '#3b3d45'; ctx.fillRect(0, top, W, laneH * 3);
        ctx.fillStyle = '#f5f5f5'; for (let k = 0; k < 6; k++) ctx.fillRect(W / 2 - 30, top + 8 + k * 40, 60, 22);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; [1, 2].forEach((k) => { for (let x = 0; x < W; x += 40) if (x < W / 2 - 40 || x > W / 2 + 30) ctx.fillRect(x, top + k * laneH - 2, 22, 4); });
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        lanes.forEach((L) => L.cars.forEach((car) => { ctx.save(); ctx.translate(car.x, L.y); if (L.dir > 0) ctx.scale(-1, 1); ctx.font = '46px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.fillText(car.e, 0, 0); ctx.restore(); }));
        ctx.font = '40px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.fillText('👵', W / 2, drawY);
        if (performance.now() < hitUntil) { ctx.fillStyle = 'rgba(239,35,60,0.25)'; ctx.fillRect(0, 0, W, Hh); }
        ctx.fillStyle = '#2a2f55'; ctx.font = 'bold 14px Fredoka, Arial, sans-serif'; ctx.fillText(finished ? 'Safely across! 🎉' : 'Get to this side', W / 2, 12);
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
      el.append(h('div', { class: 'center' }, cv), h('div', { class: 'center' }, go));
      return () => cancelAnimationFrame(raf);
    },
  };

  T.litter = {
    name: 'Pick up the litter', emoji: '🥤', help: 'Tap the litter before the wind blows it away. Leave the flowers!',
    run(el, c) {
      const need = 8;
      let got = 0, raf = 0, last = performance.now(), nextSpawn = 0, finished = false;
      const sp = D.speed[c.tier];
      const count = h('div', { class: 't-prog' }, `🗑️ 0 / ${need}`);
      const area = h('div', { class: 'park-area' }, h('span', { class: 'wind' }, '🌬️'));
      const items = [];
      function spawn() {
        const flower = Math.random() < 0.22;
        const e = flower ? pick(['🌼', '🐞', '🌸']) : pick(['🥤', '🍌', '📰', '🍫', '🧃', '🥫', '🍟']);
        const s = h('span', { class: 'litter' }, e);
        const it = { s, x: -8, y: r(8, 84), v: r(14, 22) * sp, w: Math.random() * 6, flower };
        s.addEventListener('pointerdown', (ev) => {
          ev.preventDefault();
          if (finished || it.gone) return;
          it.gone = true; s.remove();
          if (flower) { c.bad(); got = Math.max(0, got - 1); RH.toast('Leave the flowers and bugs!'); }
          else { got++; RH.Sound.play('pickup'); if (got >= need) { finished = true; c.good(); setTimeout(() => c.done(), 300); } }
          count.textContent = `🗑️ ${got} / ${need}`;
        });
        area.append(s); items.push(it);
      }
      function loop(t) {
        const dt = Math.min(0.05, (t - last) / 1000); last = t;
        if (!finished && t > nextSpawn) { spawn(); nextSpawn = t + 700 / sp; }
        for (let k = items.length - 1; k >= 0; k--) {
          const it = items[k];
          if (it.gone) { items.splice(k, 1); continue; }
          it.x += it.v * dt;
          const y = it.y + Math.sin(t / 300 + it.w) * 4;
          it.s.style.left = it.x + '%'; it.s.style.top = y + '%';
          it.s.style.transform = `translate(-50%,-50%) rotate(${(t / 6 + it.w * 60) % 360}deg)`;
          if (it.x > 108) { it.s.remove(); items.splice(k, 1); }
        }
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
      el.append(count, area);
      return () => cancelAnimationFrame(raf);
    },
  };

  T.ducks = {
    name: 'Feed the ducks', emoji: '🦆', help: 'Tap each hungry duck (the ones wanting bread) to feed it.',
    run(el, c) {
      const total = 7, hungryCount = 5;
      let fed = 0, raf = 0, last = performance.now(), finished = false;
      const count = h('div', { class: 't-prog' }, `🍞 0 / ${hungryCount} fed`);
      const pond = h('div', { class: 'pond' });
      const ducks = Array.from({ length: total }, (_, k) => {
        const hungry = k < hungryCount;
        const bubble = h('span', { class: 'duck-bubble' }, hungry ? '🍞?' : '😊');
        const body = h('span', { class: 'duck-body' }, '🦆');
        const s = h('span', { class: 'duck' }, bubble, body);
        const d = { s, body, bubble, hungry, x: r(10, 90), y: r(15, 85), vx: (Math.random() < 0.5 ? -1 : 1) * r(6, 14), vy: (Math.random() < 0.5 ? -1 : 1) * r(3, 8) };
        s.addEventListener('pointerdown', (ev) => {
          ev.preventDefault();
          if (finished) return;
          if (!d.hungry) { RH.Sound.play('quack'); return; }
          d.hungry = false; bubble.textContent = '❤️'; RH.Sound.play('quack'); fed++;
          const bread = h('span', { class: 'bread', style: { left: d.x + '%', top: d.y + '%' } }, '🍞');
          pond.append(bread); setTimeout(() => bread.remove(), 700);
          count.textContent = `🍞 ${fed} / ${hungryCount} fed`;
          if (fed >= hungryCount) { finished = true; c.good(); setTimeout(() => c.done(), 500); }
        });
        pond.append(s);
        return d;
      });
      function loop(t) {
        const dt = Math.min(0.05, (t - last) / 1000); last = t;
        ducks.forEach((d) => {
          d.x += d.vx * dt; d.y += d.vy * dt;
          if (d.x < 7 || d.x > 93) { d.vx *= -1; d.x = RH.clamp(d.x, 7, 93); }
          if (d.y < 14 || d.y > 88) { d.vy *= -1; d.y = RH.clamp(d.y, 14, 88); }
          d.s.style.left = d.x + '%'; d.s.style.top = d.y + '%';
          d.body.style.transform = d.vx > 0 ? 'scaleX(-1)' : 'none';
        });
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
      el.append(count, pond);
      return () => cancelAnimationFrame(raf);
    },
  };

  T.valves = {
    name: 'Fix the burst pipe', emoji: '🔧', help: "Turn each valve until its arrow matches the plumber's note.",
    run(el, c) {
      const n = c.tier === 0 ? 3 : 4;
      const names = ['A', 'B', 'C', 'D'];
      const arrows = ['⬆', '➡', '⬇', '⬅'];
      const target = Array.from({ length: n }, () => r(0, 3));
      const cur = target.map((t) => (t + r(1, 3)) % 4);
      const turns = cur.slice();
      let finished = false;
      const note = h('div', { class: 'paper' }, h('b', null, "🔧 Plumber's note"), h('div', { class: 'valve-note' }, target.map((t, i) => h('span', null, names[i] + ' ' + arrows[t]))));
      const spray = h('div', { class: 'spray' }, '💦💦💦');
      const valves = target.map((_, i) => {
        const arrow = h('span', { class: 'valve-arrow', style: { transform: `rotate(${turns[i] * 90}deg)` } }, '⬆');
        const b = h('button', { class: 'valve', onclick: () => {
          if (finished) return;
          cur[i] = (cur[i] + 1) % 4; turns[i]++;
          arrow.style.transform = `rotate(${turns[i] * 90}deg)`;
          RH.Sound.play('tap');
          if (cur.every((v, k) => v === target[k])) { finished = true; spray.classList.add('stopped'); spray.textContent = '✅ Fixed!'; c.good(); setTimeout(() => c.done(), 600); }
        } }, arrow);
        return h('div', { class: 'valve-wrap' }, b, h('b', null, names[i]));
      });
      el.append(note, h('div', { class: 'pipe' }, spray, h('div', { class: 'valves' }, valves)), h('p', { class: 't-sub' }, 'Tap a valve to turn it.'));
    },
  };
})(window.RH);
