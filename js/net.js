/* Rush Hour – talking to Supabase (online) or to robot players (practice) */
(function (RH) {
  'use strict';

  const ms = (v) => (v ? Date.parse(v) : null);
  RH.taskCountFor = (minutes) => Math.round(5 + (minutes - 5) * 0.4);

  function normRoom(r) {
    if (!r) return null;
    return { code: r.code, host_id: r.host_id, status: r.status, map_choice: r.map_choice || 'random', map: r.map, minutes: r.minutes, task_count: r.task_count, round: r.round, started_at: ms(r.started_at), ends_at: ms(r.ends_at), ended_at: ms(r.ended_at), winner_id: r.winner_id };
  }
  function normPlayer(p) {
    return { id: p.id, name: p.name, avatar: p.avatar || {}, tasks_done: p.tasks_done || 0, last_task_at: ms(p.last_task_at), joined_at: ms(p.joined_at) || 0, bot: !!p.bot };
  }

  // ---------------- Online (Supabase) ----------------
  class OnlineNet {
    constructor(url, key) {
      this.isOnline = true;
      this.sb = window.supabase.createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      this.offset = 0;
      this.msgFns = [];
      this.seq = 0;
      this.syncClock();
    }
    async syncClock() {
      try {
        const t0 = Date.now();
        const { data, error } = await this.sb.rpc('rh_now');
        const t1 = Date.now();
        if (!error && data) this.offset = Date.parse(data) - (t0 + t1) / 2;
      } catch (e) { /* keep local clock */ }
    }
    serverNow() { return Date.now() + this.offset; }
    async rpc(name, args) {
      const { data, error } = await this.sb.rpc(name, args);
      if (error) {
        const m = error.message || 'Something went wrong';
        if (/Could not find the function|schema cache/i.test(m)) throw new Error('The database is not set up yet. Run supabase/schema.sql in Supabase (see the README).');
        if (/Failed to fetch|NetworkError|Load failed/i.test(m)) throw new Error("Can't reach the game server. Check your internet connection.");
        throw new Error(m);
      }
      return data;
    }
    async createRoom(profile) { const d = await this.rpc('rh_create_room', { p_name: profile.name, p_avatar: profile.avatar }); return { code: d.code, playerId: d.player_id }; }
    async joinRoom(code, profile) { const d = await this.rpc('rh_join_room', { p_code: code, p_name: profile.name, p_avatar: profile.avatar }); return { code, playerId: d.player_id }; }
    async updatePlayer(pid, profile) { await this.rpc('rh_update_player', { p_player: pid, p_name: profile.name, p_avatar: profile.avatar }); this.refresh(); }
    async setSettings(code, pid, mapChoice, minutes) { await this.rpc('rh_set_settings', { p_code: code, p_player: pid, p_map_choice: mapChoice, p_minutes: minutes }); this.refresh(); }
    async startGame(code, pid, map) { await this.rpc('rh_start_game', { p_code: code, p_player: pid, p_map: map }); this.refresh(); }
    async completeTask(pid) { const d = await this.rpc('rh_complete_task', { p_player: pid }); this.refresh(); return d; }
    async endGame(code) { await this.rpc('rh_end_game', { p_code: code }); this.refresh(); }
    async resetRoom(code, pid) { await this.rpc('rh_reset_room', { p_code: code, p_player: pid }); this.refresh(); }
    async leave(pid) { try { await this.rpc('rh_leave', { p_player: pid }); } catch (e) { /* ignore */ } }
    async fetch(code) {
      const [a, b] = await Promise.all([
        this.sb.from('rh_rooms').select('*').eq('code', code).maybeSingle(),
        this.sb.from('rh_players').select('*').eq('room_code', code).order('joined_at', { ascending: true }),
      ]);
      if (a.error) throw new Error(a.error.message);
      if (b.error) throw new Error(b.error.message);
      return { room: normRoom(a.data), players: (b.data || []).map(normPlayer) };
    }
    subscribe(code, fn) {
      this.unsubscribe();
      this.code = code; this.fn = fn;
      this.channel = this.sb.channel('rh-' + code, { config: { broadcast: { self: false } } })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rh_rooms', filter: `code=eq.${code}` }, () => this.refresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rh_players', filter: `room_code=eq.${code}` }, () => this.refresh())
        .on('broadcast', { event: 'msg' }, (m) => this.msgFns.forEach((f) => f(m.payload)))
        .subscribe((status) => { if (status === 'SUBSCRIBED') this.refresh(); });
      this.poll = setInterval(() => this.refresh(), 3500);
      this._vis = () => { if (!document.hidden) { this.syncClock(); this.refresh(); } };
      document.addEventListener('visibilitychange', this._vis);
      this.refresh();
    }
    refresh() {
      if (!this.code) return;
      clearTimeout(this._rt);
      this._rt = setTimeout(async () => {
        const my = ++this.seq;
        try {
          const snap = await this.fetch(this.code);
          if (my === this.seq && this.fn) this.fn(snap);
        } catch (e) { console.warn('refresh failed', e); }
      }, 120);
    }
    onMessage(fn) { this.msgFns.push(fn); }
    send(msg) {
      if (!this.channel) return;
      try { this.channel.send({ type: 'broadcast', event: 'msg', payload: msg }); } catch (e) { console.warn(e); }
    }
    unsubscribe() {
      clearInterval(this.poll); clearTimeout(this._rt);
      if (this._vis) document.removeEventListener('visibilitychange', this._vis);
      if (this.channel) { try { this.sb.removeChannel(this.channel); } catch (e) { /* ignore */ } }
      this.channel = null; this.code = null; this.fn = null;
    }
  }

  // ---------------- Practice (robots, all on this phone) ----------------
  const BOT_NAMES = ['Robo Rob', 'Speedy Sam', 'Dozy Dot', 'Clever Cleo', 'Bleep Bloop', 'Captain Clank'];
  class LocalNet {
    constructor() { this.isOnline = false; this.msgFns = []; this.timers = []; }
    serverNow() { return Date.now(); }
    emit() {
      if (!this.fn) return;
      const snap = { room: this.room ? Object.assign({}, this.room) : null, players: this.players.map((p) => Object.assign({}, p)) };
      setTimeout(() => this.fn && this.fn(snap), 0);
    }
    async createRoom(profile) {
      const me = { id: 'me', name: profile.name, avatar: profile.avatar, tasks_done: 0, last_task_at: null, joined_at: 0 };
      const names = RH.shuffle(BOT_NAMES).slice(0, 3);
      this.players = [me].concat(names.map((n, i) => ({ id: 'bot' + i, name: n, avatar: RH.Avatar.random(), tasks_done: 0, last_task_at: null, joined_at: i + 1, bot: true })));
      this.room = { code: 'PRACTICE', host_id: 'me', status: 'lobby', map_choice: 'random', map: null, minutes: 5, task_count: 5, round: 0, started_at: null, ends_at: null, ended_at: null, winner_id: null };
      return { code: 'PRACTICE', playerId: 'me' };
    }
    async joinRoom() { throw new Error('Practice games cannot be joined'); }
    async updatePlayer(pid, profile) { const p = this.players.find((x) => x.id === pid); if (p) { p.name = profile.name; p.avatar = profile.avatar; } this.emit(); }
    async setSettings(code, pid, mapChoice, minutes) { this.room.map_choice = mapChoice; this.room.minutes = minutes; this.room.task_count = RH.taskCountFor(minutes); this.emit(); }
    async fetch() { return { room: this.room, players: this.players }; }
    subscribe(code, fn) { this.fn = fn; this.emit(); }
    onMessage(fn) { this.msgFns.push(fn); }
    send() { /* robots don't mind */ }
    clearTimers() { this.timers.forEach(clearTimeout); this.timers = []; }
    async startGame(code, pid, map) {
      const R = this.room;
      R.status = 'playing'; R.map = map; R.round++; R.task_count = RH.taskCountFor(R.minutes);
      R.started_at = Date.now() + 4000; R.ends_at = R.started_at + R.minutes * 60000; R.ended_at = null; R.winner_id = null;
      this.players.forEach((p) => { p.tasks_done = 0; p.last_task_at = null; });
      this.clearTimers();
      const dur = R.minutes * 60000;
      this.players.filter((p) => p.bot).forEach((bot, i) => {
        // Robots work at different speeds; the quickest finishes just before time runs out
        const pace = [0.88, 1.02, 1.2][i % 3];
        const step = (dur * pace) / R.task_count;
        const next = (delay) => this.timers.push(setTimeout(() => {
          if (R.status !== 'playing') return;
          this.completeTask(bot.id);
          if (bot.tasks_done < R.task_count) next(step * (0.6 + Math.random() * 0.8));
        }, delay));
        next(4000 + step * (0.6 + Math.random() * 0.8));
      });
      // One robot plays a cheeky trick on you mid-game
      const bot = RH.pick(this.players.filter((p) => p.bot));
      this.timers.push(setTimeout(() => {
        if (R.status !== 'playing') return;
        this.msgFns.forEach((f) => f({ type: 'sabotage', kind: RH.pick(['freeze', 'ink']), from: bot.id, to: 'me', round: R.round }));
      }, 4000 + dur * (0.3 + Math.random() * 0.3)));
      this.emit();
    }
    async completeTask(pid) {
      const R = this.room, now = Date.now();
      if (R.status !== 'playing' || now < R.started_at || now > R.ends_at) return { ok: false };
      const p = this.players.find((x) => x.id === pid);
      if (!p || p.tasks_done >= R.task_count) return { ok: false };
      p.tasks_done++; p.last_task_at = now;
      if (p.tasks_done >= R.task_count) { R.status = 'ended'; R.ended_at = now; R.winner_id = pid; this.clearTimers(); }
      this.emit();
      return { ok: true, tasks_done: p.tasks_done };
    }
    async endGame() {
      const R = this.room;
      if (R.status === 'playing' && Date.now() >= R.ends_at - 2000) { R.status = 'ended'; R.ended_at = Date.now(); this.clearTimers(); this.emit(); }
    }
    async resetRoom() {
      const R = this.room; R.status = 'lobby'; R.winner_id = null; R.started_at = null; R.ends_at = null;
      this.players.forEach((p) => { p.tasks_done = 0; p.last_task_at = null; });
      this.clearTimers(); this.emit();
    }
    async leave() { this.clearTimers(); this.fn = null; }
    unsubscribe() { this.clearTimers(); this.fn = null; this.msgFns = []; }
  }

  RH.OnlineNet = OnlineNet;
  RH.LocalNet = LocalNet;
  RH.onlineConfigured = function () {
    const c = window.RUSH_CONFIG || {};
    return !!(c.SUPABASE_URL && c.SUPABASE_ANON_KEY && /^https?:\/\//.test(c.SUPABASE_URL) && window.supabase);
  };
})(window.RH);
