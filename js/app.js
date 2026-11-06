/* Rush Hour – screens and game flow */
(function (RH) {
  'use strict';
  const h = RH.h;
  const app = document.getElementById('app');
  const MAPS = RH.Maps.list;
  const S = RH.S = { profile: RH.store.get('profile', null), net: null, code: null, me: null, room: null, players: [], key: null, view: null, play: null, photos: {}, lastMap: null };

  // ---------- Helpers ----------
  function setView(name, el, cleanup) {
    if (S.cleanup) { try { S.cleanup(); } catch (e) { console.error(e); } }
    S.cleanup = cleanup || null;
    S.view = name;
    S.lobbyUpdate = S.resultsUpdate = null;
    if (name !== 'play') S.play = null;
    app.replaceChildren(el);
    window.scrollTo(0, 0);
  }
  function btn(label, cls, onclick, attrs) { return h('button', Object.assign({ class: 'btn ' + (cls || ''), type: 'button' }, attrs || {}), label); }
  // Runs an async action once at a time, with friendly errors
  function action(button, fn) {
    button.addEventListener('click', async (e) => {
      if (button.dataset.busy) return;
      button.dataset.busy = '1'; button.classList.add('busy');
      try { await fn(e); } catch (err) { console.error(err); RH.toast('⚠️ ' + err.message, 4500); }
      finally { delete button.dataset.busy; button.classList.remove('busy'); }
    });
    return button;
  }
  function saveProfile(p) { S.profile = p; RH.store.set('profile', p); }
  function muteBtn(cls) {
    const b = h('button', { class: 'icon-btn ' + (cls || ''), title: 'Sound on/off', type: 'button' });
    const set = () => { b.textContent = RH.Sound.muted ? '🔇' : '🔊'; };
    b.addEventListener('click', () => { RH.Sound.setMuted(!RH.Sound.muted); set(); if (!RH.Sound.muted) RH.Sound.play('tap'); });
    set();
    return b;
  }
  function getOnline() {
    if (!S.online) {
      const c = window.RUSH_CONFIG;
      S.online = new RH.OnlineNet(c.SUPABASE_URL.trim(), c.SUPABASE_ANON_KEY.trim());
      S.online.onMessage(handleMsg);
    }
    return S.online;
  }
  function sheet(content, onClose) {
    const back = h('div', { class: 'sheet-back' });
    const box = h('div', { class: 'sheet' }, content);
    back.append(box);
    back.addEventListener('click', (e) => { if (e.target === back) close(); });
    function close() { back.remove(); onClose && onClose(); }
    document.body.append(back);
    return close;
  }
  function confirmSheet(text, yes, onYes) {
    const no = btn('No, stay', 'btn-ghost'), ok = btn(yes, 'btn-warn');
    const close = sheet(h('div', null, h('h3', null, text), h('div', { class: 'row-gap' }, no, ok)));
    no.onclick = () => close();
    ok.onclick = () => { close(); onYes(); };
  }
  const nameOf = (id) => { const p = S.players.find((x) => x.id === id); return p ? p.name : 'Someone'; };
  const shareUrl = (code) => location.origin + location.pathname.replace(/index\.html$/, '') + '?join=' + code;

  // Most jobs first; ties go to whoever got there first; a full tie is a fair coin-flip every phone agrees on
  function rank(players) {
    const round = (S.room && S.room.round) || 0;
    const flip = (p) => RH.seeded(p.id + ':' + round)();
    return players.slice().sort((a, b) => (b.tasks_done - a.tasks_done) || ((a.last_task_at || Infinity) - (b.last_task_at || Infinity)) || (flip(a) - flip(b)) || String(a.id).localeCompare(String(b.id)));
  }
  function taskPlan(room) {
    const n = Math.max(5, room.task_count || 5);
    const rnd = RH.seeded(room.code + ':' + room.round);
    const plan = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };
    const order = [1, 2, 3, 4, 5].sort(() => rnd() - 0.5);
    for (let k = 0; k < n - 5; k++) plan[order[k % 5]]++;
    return plan;
  }

  // ---------- Home ----------
  function Home() {
    const online = RH.onlineConfigured();
    const p = S.profile;
    const host = action(btn('🏁 Host a game', 'btn-go btn-big', null, online ? {} : { disabled: true }), () => withProfile(async (prof) => {
      const net = getOnline();
      const r = await net.createRoom(prof);
      enterRoom(net, r.code, r.playerId);
    }));
    const join = btn('🔑 Join a game', 'btn-blue btn-big', null, online ? {} : { disabled: true });
    join.onclick = () => JoinScreen('');
    const practice = btn('🤖 Practise against robots', 'btn-ghost btn-big');
    practice.onclick = () => withProfile(async (prof) => {
      const net = new RH.LocalNet();
      net.onMessage(handleMsg);
      const r = await net.createRoom(prof);
      enterRoom(net, r.code, r.playerId);
    });
    const el = h('div', { class: 'screen home' },
      h('div', { class: 'top-right' }, muteBtn()),
      logo(),
      p ? meCard(p, () => Creator((np) => { saveProfile(np); Home(); }, Home)) : null,
      h('div', { class: 'menu' }, host, join, practice),
      online ? null : h('p', { class: 'note-box' }, "Online games aren't switched on yet — add your Supabase details to js/config.js (the README shows how). You can still practise against the robots!"),
      h('p', { class: 'small-print' }, '2 to 10 players · each on their own phone'),
    );
    setView('home', el);
  }
  function logo() {
    return h('div', { class: 'logo' },
      h('div', { class: 'logo-lights' }, h('i', { class: 'l1' }), h('i', { class: 'l2' }), h('i', { class: 'l3' })),
      h('h1', null, 'RUSH', h('span', null, 'HOUR')),
      h('p', { class: 'tag' }, 'Race your family to finish all the jobs first!'));
  }
  function meCard(p, onEdit) {
    return h('div', { class: 'me-card' }, RH.Avatar.imgEl(p.avatar, 56, 56, 'head', 'me-head'), h('div', { class: 'grow' }, h('b', null, p.name), h('small', null, "That's you!")), onEdit ? h('button', { class: 'btn btn-small', type: 'button', onclick: onEdit }, '✏️ Change') : null);
  }
  function withProfile(fn) {
    if (S.profile && S.profile.name && S.profile.age) return fn(S.profile);
    Creator((p) => { saveProfile(p); Promise.resolve(fn(p)).catch((e) => { RH.toast('⚠️ ' + e.message, 4500); Home(); }); }, Home);
  }

  // ---------- Join ----------
  function JoinScreen(code) {
    const input = h('input', { class: 'code-input', maxlength: 4, placeholder: 'ABCD', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', value: code || '' });
    input.addEventListener('input', () => { input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); });
    const go = action(btn('Join the game ➜', 'btn-go btn-big'), async () => {
      const c = input.value.trim();
      if (c.length !== 4) { RH.shake(input); RH.toast('The code has 4 letters'); return; }
      if (!S.profile || !S.profile.age) { Creator((p) => { saveProfile(p); doJoin(c).catch((e) => { RH.toast('⚠️ ' + e.message, 4500); JoinScreen(c); }); }, () => JoinScreen(c)); return; }
      await doJoin(c);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go.click(); });
    const el = h('div', { class: 'screen' },
      h('div', { class: 'top-bar' }, btn('← Back', 'btn-small', null, { onclick: Home })),
      h('h2', null, 'Join a game'),
      h('p', { class: 't-sub' }, 'Type the 4-letter code on the host’s phone.'),
      input,
      S.profile ? meCard(S.profile, () => Creator((p) => { saveProfile(p); JoinScreen(input.value); }, () => JoinScreen(input.value))) : null,
      go);
    setView('join', el);
    if (!code) setTimeout(() => input.focus(), 50);
  }
  async function doJoin(code) {
    if (!RH.onlineConfigured()) throw new Error("Online games aren't set up yet");
    const net = getOnline();
    const r = await net.joinRoom(code, S.profile);
    enterRoom(net, code, r.playerId);
  }

  // ---------- Character creator ----------
  function Creator(onDone, onCancel) {
    const p = S.profile ? JSON.parse(JSON.stringify(S.profile)) : { name: '', age: null, avatar: RH.Avatar.defaults('boy') };
    let av = RH.Avatar.fix(p.avatar);
    let name = p.name || '', age = p.age || null;
    const A = RH.Avatar;
    const steps = [
      { id: 'gender', title: 'Boy or girl?' },
      { id: 'skin', title: 'Choose your skin tone' },
      { id: 'face', title: 'Choose a face' },
      { id: 'hair', title: 'Pick a hairstyle' },
      { id: 'hairColour', title: 'Pick a hair colour' },
      { id: 'outfit', title: 'Choose your clothes' },
      { id: 'age', title: 'How old are you?' },
      { id: 'name', title: "What's your name?" },
    ];
    let si = 0;
    const cv = h('canvas', { class: 'preview', width: 300, height: 340 });
    const pctx = cv.getContext('2d');
    let raf = 0, idle = 0;
    const drawPreview = () => {
      idle += 0.05;
      pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.clearRect(0, 0, 300, 340);
      A.draw(pctx, av, 150, 322, 2.6, { idle });
      raf = requestAnimationFrame(drawPreview);
    };
    const title = h('h2', { class: 'c-title' });
    const dots = h('div', { class: 'dots' }, steps.map(() => h('i')));
    const body = h('div', { class: 'c-body' });
    const back = btn('← Back', 'btn-ghost');
    const next = btn('Next ➜', 'btn-go');
    back.onclick = () => { if (si === 0) { onCancel ? onCancel() : Home(); } else { si--; render(); } };
    next.onclick = () => {
      if (steps[si].id === 'age' && !age) { RH.toast('Tap your age first'); return; }
      if (steps[si].id === 'name') { finish(); return; }
      si++; render();
    };
    function finish() {
      const n = name.trim();
      if (!n) { RH.toast('Type your name first'); RH.shake(body); return; }
      onDone({ name: n.slice(0, 14), age, avatar: av });
    }
    const opt = (content, on, onclick, cls) => h('button', { class: 'opt ' + (cls || '') + (on ? ' on' : ''), type: 'button', onclick: () => { RH.Sound.play('tap'); onclick(); render(); } }, content);
    const swatch = (c, on, onclick) => h('button', { class: 'swatch' + (on ? ' on' : ''), type: 'button', style: { background: c }, onclick: () => { RH.Sound.play('tap'); onclick(); render(); } });
    function render() {
      const st = steps[si];
      title.textContent = st.title;
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k <= si));
      back.textContent = si === 0 ? '✕ Cancel' : '← Back';
      next.textContent = st.id === 'name' ? "Let's go! 🏁" : 'Next ➜';
      let content;
      switch (st.id) {
        case 'gender':
          content = h('div', { class: 'opt-grid two' }, ['boy', 'girl'].map((g) => {
            const sample = Object.assign({}, av, { gender: g }); const fixed = A.fix(sample);
            if (av.gender !== g) { fixed.hair = A.HAIR[g][0].id; fixed.outfit = A.OUTFITS[g][0].id; }
            return opt([A.imgEl(fixed, 90, 110, 'full'), h('b', null, g === 'boy' ? 'Boy' : 'Girl')], av.gender === g, () => {
              if (av.gender !== g) { av = Object.assign({}, av, { gender: g, hair: A.HAIR[g][0].id, outfit: A.OUTFITS[g][0].id }); }
            }, 'big-opt');
          }));
          break;
        case 'skin':
          content = h('div', { class: 'swatches' }, A.SKIN.map((c) => swatch(c, av.skin === c, () => { av = Object.assign({}, av, { skin: c }); })));
          break;
        case 'face':
          content = h('div', { class: 'opt-grid' }, A.FACES.map((f) => opt([A.imgEl(Object.assign({}, av, { face: f.id }), 70, 70, 'head'), h('small', null, f.name)], av.face === f.id, () => { av = Object.assign({}, av, { face: f.id }); })));
          break;
        case 'hair':
          content = h('div', { class: 'opt-grid' }, A.HAIR[av.gender].map((hs) => opt([A.imgEl(Object.assign({}, av, { hair: hs.id }), 70, 70, 'head'), h('small', null, hs.name)], av.hair === hs.id, () => { av = Object.assign({}, av, { hair: hs.id }); })));
          break;
        case 'hairColour':
          content = h('div', { class: 'swatches' }, A.HAIR_COLOURS.map((hc) => swatch(hc.c, av.hairColour === hc.c, () => { av = Object.assign({}, av, { hairColour: hc.c }); })));
          break;
        case 'outfit':
          content = h('div', null,
            h('div', { class: 'opt-grid' }, A.OUTFITS[av.gender].map((o) => opt([A.imgEl(Object.assign({}, av, { outfit: o.id }), 64, 84, 'full'), h('small', null, o.name)], av.outfit === o.id, () => { av = Object.assign({}, av, { outfit: o.id }); }))),
            h('p', { class: 't-sub' }, 'Clothes colour'),
            h('div', { class: 'swatches' }, A.CLOTH_COLOURS.map((c) => swatch(c, av.colour === c, () => { av = Object.assign({}, av, { colour: c }); }))));
          break;
        case 'age':
          content = h('div', null,
            h('div', { class: 'age-grid' }, [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((a) => opt(a === 16 ? '16+' : String(a), age === a, () => { age = a; }, 'age-opt'))),
            h('p', { class: 'small-print' }, 'This makes your maths sums, spelling words and money tasks just right for you. It stays on this phone.'));
          break;
        case 'name': {
          const input = h('input', { class: 'name-input', maxlength: 14, placeholder: 'Your name', value: name, autocomplete: 'off', enterkeyhint: 'done' });
          input.addEventListener('input', () => { name = input.value; });
          input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(); });
          content = h('div', null, input);
          setTimeout(() => input.focus(), 60);
          break;
        }
      }
      body.replaceChildren(content);
    }
    const el = h('div', { class: 'screen creator' }, dots, h('div', { class: 'preview-wrap' }, cv), title, body, h('div', { class: 'c-nav' }, back, next));
    setView('creator', el, () => cancelAnimationFrame(raf));
    render();
    drawPreview();
  }

  // ---------- Room connection ----------
  function enterRoom(net, code, me) {
    S.net = net; S.code = code; S.me = me; S.key = null; S.photos = {};
    if (net.isOnline) RH.store.set('session', { code, me });
    setView('loading', h('div', { class: 'screen center-screen' }, h('div', { class: 'spinner' }), h('p', null, 'Connecting…')));
    net.subscribe(code, onSnap);
  }
  async function exitRoom(sendLeave) {
    const net = S.net;
    S.net = null; S.room = null; S.players = []; S.key = null; S.photos = {};
    RH.store.del('session');
    if (net) { net.unsubscribe(); if (sendLeave) await net.leave(S.me); }
    Home();
  }
  function onSnap(snap) {
    if (!S.net) return;
    if (!snap.room) { RH.toast('That game has closed.'); exitRoom(false); return; }
    if (!snap.players.some((p) => p.id === S.me)) { RH.toast("You're not in that game any more."); exitRoom(false); return; }
    S.room = snap.room; S.players = snap.players;
    const key = snap.room.status + ':' + snap.room.round;
    if (key !== S.key) { S.key = key; route(); } else refresh();
  }
  function route() {
    const st = S.room.status;
    if (st === 'lobby') Lobby();
    else if (st === 'playing') Play();
    else if (st === 'ended') { if (S.view === 'play' && S.play) S.play.finish(); else Results(); }
  }
  function refresh() {
    if (S.view === 'lobby' && S.lobbyUpdate) S.lobbyUpdate();
    else if (S.view === 'play' && S.play) S.play.update();
    else if (S.view === 'results' && S.resultsUpdate) S.resultsUpdate();
  }
  function handleMsg(m) {
    if (!m || !S.room) return;
    if (m.type === 'sabotage' && S.view === 'play' && S.play && m.round === S.room.round) S.play.sabotaged(m);
    if (m.type === 'photo' && m.round === S.room.round) { S.photos[m.round] = m; if (S.resultsUpdate) S.resultsUpdate(); }
    if (m.type === 'photo-request' && m.round === S.room.round) { const ph = S.photos[m.round]; if (ph && ph.from === S.me) S.net.send(ph); }
  }

  // ---------- Lobby ----------
  function Lobby() {
    S.photos = {};
    const practice = !S.net.isOnline;
    const code = S.room.code;
    const isHost = () => S.room.host_id === S.me;
    const playersBox = h('div', { class: 'players' });
    const countEl = h('span', { class: 'count' });
    const chips = h('div', { class: 'chips' });
    const slider = h('input', { type: 'range', min: 5, max: 30, step: 5, class: 'slider' });
    const minLabel = h('div', { class: 'min-label' });
    const hostNote = h('p', { class: 'small-print' });
    let dragging = false;
    slider.addEventListener('pointerdown', () => { dragging = true; });
    slider.addEventListener('input', () => { minLabel.textContent = `${slider.value} minutes · ${RH.taskCountFor(+slider.value)} tasks each`; });
    slider.addEventListener('change', () => { dragging = false; S.room.minutes = +slider.value; S.net.setSettings(code, S.me, S.room.map_choice, +slider.value).catch((e) => RH.toast('⚠️ ' + e.message)); });
    const start = action(btn('Start the race! 🏁', 'btn-go btn-big'), async () => {
      if (S.players.length < 2) { RH.toast('You need at least 2 players'); return; }
      let map = S.room.map_choice;
      if (map === 'random') { const opts = RH.Maps.ids.filter((m) => m !== S.lastMap); map = RH.pick(opts); }
      await S.net.startGame(code, S.me, map);
    });
    const leave = btn(practice ? '← Home' : '🚪 Leave', 'btn-small');
    leave.onclick = () => (practice ? exitRoom(true) : confirmSheet('Leave this game?', 'Leave', () => exitRoom(true)));
    const editMe = btn('✏️ Change my character', 'btn-small');
    editMe.onclick = () => Creator(async (p) => { saveProfile(p); try { await S.net.updatePlayer(S.me, p); } catch (e) { RH.toast('⚠️ ' + e.message); } route(); }, route);

    let joinBox;
    if (practice) {
      joinBox = h('div', { class: 'card practice-card' }, h('b', null, '🤖 Practice mode'), h('p', null, 'Race against three robots on this phone. Pick a map and a time, then press start!'));
    } else {
      const url = shareUrl(code);
      const qrEl = h('div', { class: 'qr' });
      try { const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make(); qrEl.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) { qrEl.remove(); }
      const share = btn('📤 Send the link', 'btn-blue');
      share.onclick = async () => {
        try { if (navigator.share) { await navigator.share({ title: 'Rush Hour', text: `Join my Rush Hour game! The code is ${code}`, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
        try { await navigator.clipboard.writeText(url); RH.toast('Link copied! Paste it in a message.'); } catch (e) { RH.toast(url, 6000); }
      };
      joinBox = h('div', { class: 'card join-card' },
        h('div', { class: 'join-left' }, h('small', null, 'GAME CODE'), h('div', { class: 'big-code' }, code), h('small', null, 'Scan, tap the link, or type the code'), share),
        qrEl);
    }
    const el = h('div', { class: 'screen lobby' },
      h('div', { class: 'top-bar' }, leave, h('span', { class: 'grow' }), muteBtn()),
      joinBox,
      h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('b', null, 'Players'), countEl), playersBox, editMe),
      h('div', { class: 'card' }, h('b', null, 'Map'), chips, h('b', null, 'Round length'), slider, minLabel, hostNote),
      start);
    function render() {
      const R = S.room, host = isHost();
      countEl.textContent = `${S.players.length} / 10`;
      const pk = JSON.stringify([R.host_id, S.players.map((p) => [p.id, p.name, p.avatar])]);
      if (pk !== render.pk) render.pk = pk, playersBox.replaceChildren(...S.players.map((p) => h('div', { class: 'player' + (p.id === S.me ? ' me' : '') },
        RH.Avatar.imgEl(p.avatar, 64, 76, 'full'),
        h('span', { class: 'p-name' }, p.name),
        p.id === R.host_id ? h('span', { class: 'crown' }, '👑') : null,
        p.id === S.me ? h('span', { class: 'you' }, 'YOU') : null)));
      const choices = [['random', '🎲', 'Random']].concat(RH.Maps.ids.map((id) => [id, MAPS[id].emoji, MAPS[id].name]));
      chips.replaceChildren(...choices.map(([id, e, n]) => h('button', { class: 'chip' + (R.map_choice === id ? ' on' : ''), type: 'button', disabled: !host, onclick: () => {
        S.room.map_choice = id; render(); RH.Sound.play('tap');
        S.net.setSettings(code, S.me, id, S.room.minutes).catch((err) => RH.toast('⚠️ ' + err.message));
      } }, e + ' ' + n)));
      slider.disabled = !host;
      if (!dragging) slider.value = R.minutes;
      minLabel.textContent = `${slider.value} minutes · ${RH.taskCountFor(+slider.value)} tasks each`;
      hostNote.textContent = host ? 'You’re the host — you choose the map and time.' : `${nameOf(R.host_id)} is the host and will start the game.`;
      start.style.display = host ? '' : 'none';
      start.disabled = S.players.length < 2;
      start.textContent = S.players.length < 2 ? 'Waiting for more players…' : 'Start the race! 🏁';
    }
    setView('lobby', el);
    S.lobbyUpdate = render;
    render();
  }

  // ---------- Playing ----------
  function Play() {
    const room = S.room;
    const map = MAPS[room.map] || MAPS.school;
    S.lastMap = map.id;
    RH.Maps.prepare(map);
    if (!S.profile) { const meP = S.players.find((x) => x.id === S.me); S.profile = { name: meP ? meP.name : 'Player', age: 10, avatar: meP ? meP.avatar : RH.Avatar.defaults() }; }
    const tier = RH.Difficulty.tier(S.profile.age);
    const plan = taskPlan(room);
    const total = Object.values(plan).reduce((a, b) => a + b, 0);
    const progKey = `prog_${room.code}_${room.round}_${room.started_at}`;
    let prog = RH.store.get(progKey, null) || { done: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, skips: 0, item: null };
    const myServer = () => { const p = S.players.find((x) => x.id === S.me); return p ? p.tasks_done : 0; };
    const doneCount = () => Object.values(prog.done).reduce((a, b) => a + b, 0);
    // If this phone lost its notes (e.g. after a refresh), trust the server's count
    let gap = myServer() - doneCount();
    for (let n = 1; n <= 5 && gap > 0; n++) while (prog.done[n] < plan[n] && gap > 0) { prog.done[n]++; gap--; }
    const save = () => RH.store.set(progKey, prog);
    const remaining = () => { const r = {}; for (let n = 1; n <= 5; n++) r[n] = Math.max(0, plan[n] - prog.done[n]); return r; };
    const stationEmoji = {}; map.tasks.forEach((t, i) => { stationEmoji[i + 1] = RH.Tasks[t].emoji; });

    const gameHost = h('div', { class: 'game-host' });
    const timerEl = h('div', { class: 'pill timer' }, '⏱ --:--');
    const tasksPill = h('button', { class: 'pill', type: 'button' });
    const strip = h('div', { class: 'strip' });
    const panel = h('div', { class: 'task-panel hidden' });
    const itemBtn = h('button', { class: 'item-btn hidden', type: 'button' });
    const skipBadge = h('div', { class: 'skip-badge hidden' });
    const layer = h('div', { class: 'layer' });
    const leaveB = h('button', { class: 'icon-btn', type: 'button', title: 'Leave' }, '🚪');
    leaveB.onclick = () => confirmSheet('Leave the race?', 'Leave', () => exitRoom(true));
    tasksPill.onclick = () => { panel.classList.toggle('hidden'); RH.Sound.play('tap'); };
    const root = h('div', { class: 'play' }, gameHost,
      h('div', { class: 'hud-top' }, h('div', { class: 'hud-row' }, timerEl, tasksPill, h('span', { class: 'grow' }), muteBtn(), leaveB), strip),
      h('div', { class: 'map-name' }, map.emoji + ' ' + map.name),
      panel, h('div', { class: 'hud-bottom' }, skipBadge, itemBtn), layer);

    let game = null, ticker = null, openTask = null, started = false, ending = false, warned = false, lastBeep = -1, lastEnd = 0, frozenUntil = 0, freezeEl = null;
    const P = S.play = {
      update() { renderStrip(); },
      finish() { finish(); },
      sabotaged(m) { sabotaged(m); },
    };

    function renderStrip() {
      const ranked = rank(S.players);
      strip.replaceChildren(...ranked.map((p, i) => h('div', { class: 'chip-p' + (p.id === S.me ? ' me' : '') },
        h('span', { class: 'pos' }, i + 1), RH.Avatar.imgEl(p.avatar, 26, 26, 'head'), h('span', { class: 'nm' }, p.name), h('b', null, `${Math.min(p.id === S.me ? Math.max(p.tasks_done, doneCount()) : p.tasks_done, total)}/${total}`))));
    }
    function renderTasks() {
      const rem = remaining();
      tasksPill.textContent = `📋 ${doneCount()}/${total} tasks`;
      panel.replaceChildren(h('div', { class: 'panel-head' }, h('b', null, 'Your jobs'), h('small', null, 'Tap one to walk there')),
        ...[1, 2, 3, 4, 5].map((n) => {
          const t = RH.Tasks[map.tasks[n - 1]];
          const left = rem[n];
          return h('button', { class: 'task-row' + (left ? '' : ' done'), type: 'button', onclick: () => { if (!left) return; panel.classList.add('hidden'); game && game.goToStation(n); } },
            h('span', { class: 'tr-e' }, left ? t.emoji : '✅'), h('span', { class: 'grow' }, h('b', null, t.name), h('small', null, map.stationNames[n - 1])), h('span', { class: 'tr-c' }, left ? (plan[n] > 1 ? `${plan[n] - left}/${plan[n]}` : '') : 'Done'));
        }));
      if (game) game.setRemaining(rem);
    }
    function renderItems() {
      skipBadge.classList.toggle('hidden', !prog.skips);
      skipBadge.textContent = `⏭️ ×${prog.skips}`;
      itemBtn.classList.toggle('hidden', !prog.item);
      if (prog.item) itemBtn.replaceChildren(h('span', { class: 'ib-e' }, RH.PICKUPS[prog.item]), h('small', null, prog.item === 'freeze' ? 'Freeze!' : 'Splat!'));
    }
    itemBtn.onclick = () => {
      if (!prog.item || ending) return;
      const others = rank(S.players).filter((p) => p.id !== S.me);
      if (!others.length) return;
      const kind = prog.item;
      const close = sheet(h('div', null, h('h3', null, kind === 'freeze' ? '❄️ Who do you want to freeze?' : '🎨 Who gets the paint splat?'),
        h('div', { class: 'target-list' }, others.map((p) => h('button', { class: 'target', type: 'button', onclick: () => {
          close();
          S.net.send({ type: 'sabotage', kind, from: S.me, to: p.id, round: S.room.round });
          prog.item = null; save(); renderItems();
          RH.Sound.play('zap');
          RH.toast(kind === 'freeze' ? `❄️ You froze ${p.name}!` : `🎨 You splatted ${p.name}!`);
        } }, RH.Avatar.imgEl(p.avatar, 36, 36, 'head'), h('span', { class: 'grow' }, p.name), h('b', null, `${p.tasks_done}/${total}`)))),
        btn('Keep it for later', 'btn-ghost', null, { onclick: () => close() })));
    };

    function banner(text, cls, ms) {
      const b = h('div', { class: 'banner ' + (cls || '') }, text);
      layer.append(b);
      if (ms) setTimeout(() => b.remove(), ms);
      return b;
    }

    function onStation(n) {
      if (!started || ending || openTask || Date.now() < frozenUntil) return;
      if (remaining()[n] <= 0) { RH.toast('✅ You’ve already done this job'); return; }
      openTaskModal(n);
    }
    function onPickup(kind) {
      RH.Sound.play('pickup');
      if (kind === 'speed') { game.boost(12000); RH.toast('⚡ Speed boost!'); }
      else if (kind === 'skip') { prog.skips++; RH.toast('⏭️ Skip card! Use it to skip any job.'); }
      else {
        const had = prog.item;
        prog.item = kind;
        RH.toast((kind === 'freeze' ? '❄️ Freeze ray! Tap it to freeze someone.' : '🎨 Paint splat! Tap it to splat someone’s screen.') + (had && had !== kind ? ' (swapped)' : ''));
      }
      save(); renderItems();
    }

    function openTaskModal(n) {
      const def = RH.Tasks[map.tasks[n - 1]];
      let cleanup = null, finished = false;
      game.setLocked(true);
      const body = h('div', { class: 'task-body' });
      const close = () => {
        if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } }
        modal.remove(); openTask = null;
        if (game && !ending) game.setLocked(false);
      };
      const finishTask = () => {
        if (finished) return;
        finished = true;
        RH.Sound.play('done');
        body.append(h('div', { class: 'task-done' }, h('span', null, '✅'), h('b', null, 'Job done!')));
        setTimeout(() => { close(); completeStation(n); }, 750);
      };
      const skipB = prog.skips ? btn(`⏭️ Use skip card (${prog.skips})`, 'btn-small', null, { onclick: () => { if (finished) return; prog.skips--; save(); renderItems(); finishTask(); } }) : null;
      const modal = h('div', { class: 'task-modal' }, h('div', { class: 'task-card' },
        h('div', { class: 'task-head' }, h('span', { class: 'th-e' }, def.emoji), h('div', { class: 'grow' }, h('b', null, def.name), h('small', null, def.help)), h('button', { class: 'icon-btn close', type: 'button', onclick: close, title: 'Leave this job' }, '✕')),
        body, skipB ? h('div', { class: 'center' }, skipB) : null));
      layer.append(modal);
      openTask = { n, close };
      try {
        cleanup = def.run(body, { tier, done: finishTask, good: () => RH.Sound.play('good'), bad: () => RH.Sound.play('bad') }) || null;
      } catch (e) { console.error(e); RH.toast('Oops, that job broke — have it for free!'); finishTask(); }
    }

    function completeStation(n) {
      prog.done[n] = Math.min(plan[n], prog.done[n] + 1); save();
      renderTasks(); renderStrip();
      const d = doneCount();
      if (d >= total) banner('🎉 All your jobs are done!', 'good', 2500);
      else RH.toast(`Job done! ${d}/${total} ✅`);
      S.net.completeTask(S.me).then((r) => { if (r && r.ok === false && !ending) console.warn('task not counted'); }).catch((e) => RH.toast('⚠️ ' + e.message));
    }

    function sabotaged(m) {
      if (ending) return;
      const from = nameOf(m.from);
      if (m.to !== S.me) { RH.toast(m.kind === 'freeze' ? `❄️ ${from} froze ${nameOf(m.to)}!` : `🎨 ${from} splatted ${nameOf(m.to)}!`); return; }
      if (m.kind === 'freeze') {
        RH.Sound.play('freeze');
        frozenUntil = Date.now() + 5000;
        game.setFrozen(true);
        if (freezeEl) freezeEl.remove();
        freezeEl = h('div', { class: 'frozen' }, h('div', { class: 'fz-e' }, '❄️'), h('b', null, `${from} froze you!`), h('span', { class: 'fz-c' }, '5'));
        layer.append(freezeEl);
      } else {
        RH.Sound.play('splat');
        const ink = h('div', { class: 'ink' }, Array.from({ length: 8 }, () => h('i', { style: { left: RH.randInt(-10, 80) + '%', top: RH.randInt(5, 80) + '%', width: RH.randInt(90, 200) + 'px', height: RH.randInt(90, 200) + 'px', background: RH.pick(['#e63946', '#3a86ff', '#8338ec', '#ff70a6', '#2ec4b6', '#ffb703']) } })), h('b', { class: 'ink-msg' }, `🎨 ${from} splatted you!`));
        layer.append(ink);
        setTimeout(() => ink.classList.add('fade'), 6000);
        setTimeout(() => ink.remove(), 7200);
      }
    }

    function finish() {
      if (ending) return;
      ending = true;
      if (openTask) openTask.close();
      panel.classList.add('hidden');
      document.querySelectorAll('.sheet-back').forEach((e) => e.remove());
      layer.querySelectorAll('.banner').forEach((e) => e.remove());
      if (freezeEl) { freezeEl.remove(); freezeEl = null; }
      if (game) { game.setFrozen(false); game.setLocked(true); }
      const R = S.room;
      const someoneFinished = R.winner_id && S.players.some((p) => p.id === R.winner_id && p.tasks_done >= R.task_count);
      const lead = someoneFinished ? `🏁 ${R.winner_id === S.me ? 'You' : nameOf(R.winner_id)} finished every job!` : '⏰ Time’s up!';
      const lines = {
        school: '🔔 Ding-a-ling! Home time — here comes the school bus!',
        bank: '🚨 The alarm is going off!',
        shop: '🔔 Ding dong! The shopping centre is now closing.',
        town: '🕰️ The town clock strikes… night falls!',
      };
      banner(h('div', null, h('div', { class: 'b-lead' }, lead), h('div', null, lines[map.ending])), 'ending');
      if (map.ending === 'school') RH.Sound.play('bell');
      if (map.ending === 'bank') { RH.Sound.play('alarm'); moneyRain(layer); }
      if (map.ending === 'shop') { RH.Sound.play('chime'); setTimeout(() => RH.say('Attention shoppers. The shopping centre is now closing. Please make your way to the exits.'), 1400); }
      if (map.ending === 'town') RH.Sound.play('bong', 4);
      let went = false;
      const go = () => { if (went) return; went = true; if (S.view === 'play' && S.room && S.room.status === 'ended') Results(); };
      if (game) game.playEnding(map.ending, () => setTimeout(go, 400)); else go();
      setTimeout(go, 9000);
    }

    function tick() {
      const R = S.room;
      if (!R || ending) return;
      const now = S.net.serverNow();
      if (now < R.started_at) {
        const s = Math.ceil((R.started_at - now) / 1000);
        if (P.cd !== s) { P.cd = s; countdown.textContent = s; RH.Sound.play('beep'); }
      } else if (!started) {
        started = true; countdown.remove(); RH.Sound.play('go');
        banner('GO! 🏁', 'go', 1100);
        if (game && !openTask) game.setLocked(false);
      }
      const left = R.ends_at - now;
      timerEl.textContent = '⏱ ' + RH.fmtTime(Math.min(left, R.ends_at - R.started_at));
      if (started && left <= 60000 && left > 0 && !warned) { warned = true; timerEl.classList.add('hurry'); RH.Sound.play('warn'); banner('⏰ 1 minute left!', 'warn', 2200); }
      if (left <= 10000 && left > 0) { const s = Math.ceil(left / 1000); if (s !== lastBeep) { lastBeep = s; RH.Sound.play('beep'); } }
      if (left <= 0 && R.status === 'playing' && Date.now() - lastEnd > 2500) { lastEnd = Date.now(); S.net.endGame(R.code).catch(() => {}); }
      if (frozenUntil) {
        const fl = frozenUntil - Date.now();
        if (fl <= 0) { frozenUntil = 0; game.setFrozen(false); if (freezeEl) { freezeEl.remove(); freezeEl = null; } }
        else if (freezeEl) freezeEl.querySelector('.fz-c').textContent = Math.ceil(fl / 1000);
      }
    }

    const countdown = h('div', { class: 'countdown' }, '');
    layer.append(countdown);
    setView('play', root, () => { clearInterval(ticker); if (openTask) openTask.close(); if (game) game.destroy(); game = null; });
    S.play = P;
    game = new RH.Game(gameHost, map, { avatar: S.profile.avatar, stationEmoji, onStation, onPickup });
    game.setLocked(true);
    renderTasks(); renderStrip(); renderItems();
    ticker = setInterval(tick, 200);
    tick();
    P.game = game;
  }

  function moneyRain(layer) {
    const box = h('div', { class: 'money-rain' }, h('div', { class: 'alarm-flash' }));
    for (let i = 0; i < 46; i++) {
      box.append(h('span', { class: 'cash', style: { left: RH.randInt(-5, 98) + '%', animationDuration: (1.6 + Math.random() * 1.8).toFixed(2) + 's', animationDelay: (Math.random() * 2.4).toFixed(2) + 's', fontSize: RH.randInt(26, 46) + 'px' } }, RH.pick(['💷', '💷', '💵', '💰', '🪙'])));
    }
    layer.append(box);
  }

  // ---------- Results ----------
  function Results() {
    const R = S.room;
    const ranked = rank(S.players);
    const total = Math.max(5, R.task_count);
    const winner = ranked[0];
    const loser = ranked.length > 1 ? ranked[ranked.length - 1] : null;
    const allSame = ranked.every((p) => p.tasks_done === ranked[0].tasks_done && p.tasks_done === 0);
    const isHost = R.host_id === S.me;
    const medals = ['🥇', '🥈', '🥉'];
    const photoBox = h('div', { class: 'card photo-card' });
    let cam = null;

    const winnerName = winner.id === S.me ? 'You win!' : `${winner.name} wins!`;
    const list = h('div', { class: 'results-list' }, ranked.map((p, i) => h('div', { class: 'res-row' + (p.id === S.me ? ' me' : '') },
      h('span', { class: 'medal' }, medals[i] || i + 1), RH.Avatar.imgEl(p.avatar, 40, 40, 'head'), h('span', { class: 'grow' }, p.name), h('b', null, `${p.tasks_done}/${total}`))));

    function renderPhoto() {
      if (cam) return; // camera is open, leave it alone
      const ph = S.photos[R.round];
      const k = ph ? ph.from + ':' + ph.img.length : 'none';
      if (k === renderPhoto.k) return;
      renderPhoto.k = k;
      if (allSame) { photoBox.replaceChildren(h('h3', null, 'Nobody finished a job! 😜'), h('p', null, 'Everyone pull your silliest face at each other instead!')); return; }
      if (!loser) { photoBox.replaceChildren(); return; }
      if (ph) {
        photoBox.replaceChildren(h('h3', null, `😂 ${ph.from === S.me ? 'Your' : nameOf(ph.from) + '’s'} silly photo!`), h('img', { class: 'silly-photo', src: ph.img, alt: 'Silly photo' }),
          ph.from === S.me ? btn('📸 Take another', 'btn-small', null, { onclick: () => { delete S.photos[R.round]; renderPhoto(); } }) : null);
        return;
      }
      if (loser.bot) {
        photoBox.replaceChildren(h('h3', null, `🤪 ${loser.name} came last!`), h('p', null, 'Robots can’t take photos, so here’s its silliest face:'), RH.Avatar.imgEl(loser.avatar, 130, 130, 'head', 'silly-bot', 'silly'));
        return;
      }
      if (loser.id === S.me) {
        const startCam = btn('📸 Take my silly photo', 'btn-go');
        startCam.onclick = () => { renderPhoto.k = null; cam = sillyCam(photoBox, (img) => { cam = null; const msg = { type: 'photo', round: R.round, from: S.me, img }; S.photos[R.round] = msg; S.net.send(msg); renderPhoto(); }, () => { cam = null; renderPhoto(); }); };
        photoBox.replaceChildren(h('h3', null, '📸 You came last!'), h('p', null, 'Time for your forfeit: pull your silliest face and take a photo. It pops up on everyone’s phone!'), startCam);
        return;
      }
      photoBox.replaceChildren(h('h3', null, `📸 ${loser.name} came last!`), h('p', null, `Waiting for ${loser.name}’s silly photo…`), h('div', { class: 'spinner small' }));
    }

    const again = isHost ? action(btn('Play again 🔁', 'btn-go btn-big'), async () => { await S.net.resetRoom(R.code, S.me); }) : null;
    const leave = btn(S.net.isOnline ? 'Leave game' : 'Home', 'btn-ghost');
    leave.onclick = () => exitRoom(true);
    const el = h('div', { class: 'screen results' },
      h('div', { class: 'winner' }, h('div', { class: 'crown-big' }, '👑'), RH.Avatar.imgEl(winner.avatar, 130, 150, 'full'), h('h1', null, '🏆 ' + winnerName)),
      list, photoBox,
      again, isHost ? null : h('p', { class: 'small-print' }, `${nameOf(R.host_id)} can start another round.`),
      leave);
    setView('results', el, () => { if (cam && cam.stop) cam.stop(); });
    S.resultsUpdate = renderPhoto;
    renderPhoto();
    RH.Sound.play(loser && loser.id === S.me ? 'lose' : 'win');
    confetti(el);
    if (loser && !loser.bot && loser.id !== S.me && S.net.isOnline) setTimeout(() => S.net.send({ type: 'photo-request', round: R.round }), 2500);
  }

  function confetti(el) {
    const box = h('div', { class: 'confetti' });
    for (let i = 0; i < 40; i++) box.append(h('i', { style: { left: RH.randInt(0, 100) + '%', background: RH.pick(['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#8338ec']), animationDelay: (Math.random() * 1.2).toFixed(2) + 's', animationDuration: (2 + Math.random() * 1.5).toFixed(2) + 's' } }));
    el.append(box);
    setTimeout(() => box.remove(), 4500);
  }

  // Camera for the loser's silly photo. Photos are never saved – they only travel to the other phones.
  function sillyCam(box, onPhoto, onCancel) {
    let stream = null;
    const stop = () => { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } };
    const shrink = (src, w0, h0, mirror) => {
      const w = Math.min(360, w0), hh = Math.round((h0 / w0) * w);
      const c = document.createElement('canvas'); c.width = w; c.height = hh;
      const x = c.getContext('2d');
      if (mirror) { x.translate(w, 0); x.scale(-1, 1); }
      x.drawImage(src, 0, 0, w, hh);
      return c.toDataURL('image/jpeg', 0.72);
    };
    const fileInput = h('input', { type: 'file', accept: 'image/*', capture: 'user', class: 'hidden' });
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      const img = new Image();
      img.onload = () => { const url = shrink(img, img.naturalWidth, img.naturalHeight, false); URL.revokeObjectURL(img.src); onPhoto(url); };
      img.src = URL.createObjectURL(f);
    });
    const cartoon = btn('🤪 Send a silly cartoon face instead', 'btn-small');
    cartoon.onclick = () => { stop(); onPhoto(RH.Avatar.canvas(S.profile.avatar, 240, 240, 'head', 'silly').toDataURL('image/png')); };
    const useApp = btn('📷 Use the camera app', 'btn-small');
    useApp.onclick = () => fileInput.click();
    const cancel = btn('Not now', 'btn-ghost btn-small');
    cancel.onclick = () => { stop(); onCancel(); };
    const fallback = (msg) => box.replaceChildren(h('h3', null, '📸 Silly photo time!'), msg ? h('p', null, msg) : null, h('div', { class: 'row-gap wrap' }, useApp, cartoon), fileInput, cancel);

    const video = h('video', { class: 'cam-video', autoplay: true, playsinline: true, muted: true });
    video.muted = true; video.setAttribute('playsinline', '');
    const count = h('div', { class: 'cam-count' });
    const snap = btn('📸 Snap!', 'btn-go btn-big');
    snap.onclick = () => {
      snap.disabled = true;
      let n = 3; count.textContent = n; RH.Sound.play('beep');
      const iv = setInterval(() => {
        n--;
        if (n > 0) { count.textContent = n; RH.Sound.play('beep'); return; }
        clearInterval(iv); count.textContent = ''; RH.Sound.play('shutter');
        const url = shrink(video, video.videoWidth || 480, video.videoHeight || 640, true);
        stop(); onPhoto(url);
      }, 800);
    };
    box.replaceChildren(h('h3', null, 'Pull your silliest face! 🤪'), h('div', { class: 'cam-wrap' }, video, count), snap, h('div', { class: 'row-gap wrap' }, useApp, cartoon), fileInput, cancel);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) fallback("This browser can't open the camera here.");
    else navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } }, audio: false })
      .then((s) => { stream = s; video.srcObject = s; return video.play(); })
      .catch(() => fallback('The camera didn’t open. You can use the camera app, or send a cartoon face.'));
    return { stop };
  }

  // ---------- Start up ----------
  async function boot() {
    const params = new URLSearchParams(location.search);
    const join = (params.get('join') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    if (join) history.replaceState(null, '', location.pathname);
    const sess = RH.store.get('session', null);
    if (sess && RH.onlineConfigured() && (!join || join === sess.code)) {
      try {
        const net = getOnline();
        const snap = await net.fetch(sess.code);
        if (snap.room && snap.players.some((p) => p.id === sess.me)) { enterRoom(net, sess.code, sess.me); return; }
      } catch (e) { console.warn(e); }
      RH.store.del('session');
    }
    if (join) { JoinScreen(join); return; }
    Home();
  }
  window.addEventListener('pageshow', () => {});
  boot();
})(window.RH);
