/* Rush Hour – the map you walk around (each player has their own copy) */
(function (RH) {
  'use strict';
  const CELL = RH.Maps.CELL;
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const PICKUPS = { speed: '⚡', skip: '⏭️', freeze: '❄️', ink: '🎨' };
  RH.PICKUPS = PICKUPS;

  const easeOut = (t) => 1 - Math.pow(1 - RH.clamp(t, 0, 1), 3);
  const easeIn = (t) => Math.pow(RH.clamp(t, 0, 1), 3);

  class Game {
    constructor(host, map, opts) {
      this.host = host;
      this.map = RH.Maps.prepare(map);
      this.opts = opts;
      this.avatar = opts.avatar;
      this.canvas = RH.h('canvas', { class: 'game-canvas' });
      host.append(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      const st = this.map.start;
      this.px = (st.x + 0.5) * CELL; this.py = (st.y + 0.5) * CELL;
      this.path = []; this.dest = null; this.targetStation = null;
      this.walk = 0; this.idle = 0; this.moving = false;
      this.boostUntil = 0; this.frozen = false; this.locked = false;
      this.remaining = {};
      this.pickups = []; this.nextSpawn = Date.now() + 20000;
      this.cam = { x: this.px, y: this.py };
      this.ending = null;
      this.resize();
      this._rs = () => this.resize();
      window.addEventListener('resize', this._rs);
      this._pd = (e) => { this.dragging = true; this.onPointer(e); };
      this._pm = (e) => { if (this.dragging && performance.now() - this.lastRetarget > 200) this.onPointer(e, true); };
      this._pu = () => { this.dragging = false; };
      this.canvas.addEventListener('pointerdown', this._pd);
      this.canvas.addEventListener('pointermove', this._pm);
      window.addEventListener('pointerup', this._pu);
      for (let i = 0; i < 3; i++) this.spawnPickup();
      this.running = true;
      this.last = performance.now();
      this._loop = (t) => this.loop(t);
      requestAnimationFrame(this._loop);
    }

    destroy() {
      this.running = false;
      window.removeEventListener('resize', this._rs);
      window.removeEventListener('pointerup', this._pu);
      this.canvas.remove();
    }

    resize() {
      const r = this.host.getBoundingClientRect();
      this.cw = Math.max(200, r.width); this.ch = Math.max(200, r.height);
      this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.canvas.width = Math.round(this.cw * this.dpr); this.canvas.height = Math.round(this.ch * this.dpr);
      this.canvas.style.width = this.cw + 'px'; this.canvas.style.height = this.ch + 'px';
      this.zoom = RH.clamp(Math.min(this.cw / 430, this.ch / 620), 0.7, 1.6);
      const R = Math.min(2, Math.max(1, this.zoom * this.dpr));
      if (!this.mapImg || Math.abs(R - this.mapR) > 0.3) { this.mapR = R; this.mapImg = RH.Maps.render(this.map, R); }
    }

    setRemaining(rem) { this.remaining = Object.assign({}, rem); }
    setLocked(v) { this.locked = v; if (v) { this.path = []; this.targetStation = null; } }
    setFrozen(v) { this.frozen = v; if (v) { this.path = []; this.targetStation = null; } }
    boost(ms) { this.boostUntil = Date.now() + ms; }

    // ---------- Input ----------
    toWorld(e) {
      const r = this.canvas.getBoundingClientRect();
      const sx = e.clientX - r.left, sy = e.clientY - r.top;
      return [this.cam.x + (sx - this.cw / 2) / this.zoom, this.cam.y + (sy - this.ch / 2) / this.zoom, sx, sy];
    }
    onPointer(e, drag) {
      if (this.ending || this.frozen || this.locked) return;
      this.lastRetarget = performance.now();
      const [wx, wy, sx, sy] = this.toWorld(e);
      // Off-screen arrow tapped?
      if (!drag && this._arrows) {
        const hit = this._arrows.find((a) => Math.hypot(a.x - sx, a.y - sy) < 26);
        if (hit) { this.goToStation(hit.n); return; }
      }
      if (!drag) {
        for (const k in this.map.stations) {
          const s = this.map.stations[k];
          const cx = (s.x + 0.5) * CELL, cy = (s.y + 0.5) * CELL;
          if (Math.hypot(wx - cx, wy - cy) < 28 || Math.hypot(wx - cx, wy - (cy - 36)) < 24) { this.goToStation(+k); return; }
        }
      }
      this.goToPoint(wx, wy);
    }

    cellOf(x, y) { return [Math.floor(x / CELL), Math.floor(y / CELL)]; }
    solidAt(x, y) {
      const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
      if (cx < 0 || cy < 0 || cx >= this.map.W || cy >= this.map.H) return true;
      return this.map.solid[cy * this.map.W + cx] === 1;
    }
    walkable(cx, cy) { return cx >= 0 && cy >= 0 && cx < this.map.W && cy < this.map.H && !this.map.solid[cy * this.map.W + cx]; }

    nearestWalkable(cx, cy) {
      if (this.walkable(cx, cy)) return [cx, cy];
      let best = null, bd = 1e9;
      for (let r = 1; r <= 4 && !best; r++) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (this.walkable(cx + dx, cy + dy)) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [cx + dx, cy + dy]; } }
        }
      }
      return best;
    }

    goToStation(n) {
      const s = this.map.stations[n];
      if (!s) return;
      const [cx, cy] = this.cellOf(this.px, this.py);
      if (cx === s.x && cy === s.y) { this.path = []; this.targetStation = null; this.opts.onStation(n); return; }
      if (this.route(s.x, s.y, (s.x + 0.5) * CELL, (s.y + 0.5) * CELL)) this.targetStation = n;
    }

    goToPoint(wx, wy) {
      let [cx, cy] = this.cellOf(wx, wy);
      const exact = this.walkable(cx, cy);
      const nw = this.nearestWalkable(cx, cy);
      if (!nw) return;
      [cx, cy] = nw;
      const ccx = (cx + 0.5) * CELL, ccy = (cy + 0.5) * CELL;
      const tx = exact ? RH.clamp(wx, ccx - 8, ccx + 8) : ccx, ty = exact ? RH.clamp(wy, ccy - 8, ccy + 8) : ccy;
      const ch = this.map.cells[cy][cx];
      this.targetStation = null;
      if (this.route(cx, cy, tx, ty) && ch >= '1' && ch <= '5') this.targetStation = +ch;
      else if (!this.path.length && ch >= '1' && ch <= '5') this.opts.onStation(+ch);
    }

    route(tcx, tcy, tx, ty) {
      const [sx, sy] = this.cellOf(this.px, this.py);
      const cells = this.astar(sx, sy, tcx, tcy);
      if (!cells) return false;
      const pts = [[this.px, this.py]].concat(cells.slice(1).map(([x, y]) => [(x + 0.5) * CELL, (y + 0.5) * CELL]));
      pts.push([tx, ty]);
      this.path = this.smooth(pts);
      this.dest = [tx, ty];
      return true;
    }

    astar(sx, sy, tx, ty) {
      const W = this.map.W, H = this.map.H, N = W * H;
      const g = new Float32Array(N).fill(Infinity), f = new Float32Array(N).fill(Infinity);
      const came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
      const start = sy * W + sx, goal = ty * W + tx;
      const hfn = (i) => { const x = i % W, y = (i / W) | 0; const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
      g[start] = 0; f[start] = hfn(start);
      const open = [start];
      while (open.length) {
        let bi = 0;
        for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
        const cur = open[bi]; open.splice(bi, 1);
        if (cur === goal) {
          const out = []; let c = cur;
          while (c !== -1) { out.push([c % W, (c / W) | 0]); c = came[c]; }
          return out.reverse();
        }
        closed[cur] = 1;
        const cx = cur % W, cy = (cur / W) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cx + dx, ny = cy + dy;
          if (!this.walkable(nx, ny)) continue;
          if (dx && dy && (!this.walkable(cx + dx, cy) || !this.walkable(cx, cy + dy))) continue;
          const ni = ny * W + nx;
          if (closed[ni]) continue;
          const ng = g[cur] + (dx && dy ? 1.414 : 1);
          if (ng < g[ni]) { g[ni] = ng; f[ni] = ng + hfn(ni); came[ni] = cur; if (open.indexOf(ni) < 0) open.push(ni); }
        }
      }
      return null;
    }

    los(a, b) {
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.ceil(d / 8));
      for (let k = 0; k <= n; k++) {
        const x = a[0] + ((b[0] - a[0]) * k) / n, y = a[1] + ((b[1] - a[1]) * k) / n;
        if (this.solidAt(x - 12, y - 12) || this.solidAt(x + 12, y - 12) || this.solidAt(x - 12, y + 12) || this.solidAt(x + 12, y + 12)) return false;
      }
      return true;
    }
    smooth(pts) {
      const out = [];
      let i = 0;
      while (i < pts.length - 1) {
        let j = pts.length - 1;
        while (j > i + 1 && !this.los(pts[i], pts[j])) j--;
        out.push(pts[j]); i = j;
      }
      return out;
    }

    // ---------- Pick-ups ----------
    spawnPickup(kind) {
      if (!kind) { const r = Math.random(); kind = r < 0.35 ? 'speed' : r < 0.5 ? 'skip' : r < 0.75 ? 'freeze' : 'ink'; }
      for (let tries = 0; tries < 80; tries++) {
        const cx = RH.randInt(0, this.map.W - 1), cy = RH.randInt(0, this.map.H - 1);
        if (!this.walkable(cx, cy)) continue;
        const ch = this.map.cells[cy][cx];
        if ((ch >= '1' && ch <= '5') || ch === 'P') continue;
        // must be reachable from the start
        const x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL;
        if (Math.hypot(x - this.px, y - this.py) < 160) continue;
        if (this.pickups.some((p) => Math.hypot(p.x - x, p.y - y) < 120)) continue;
        if (!this._reach) this._reach = this.reachableSet();
        if (!this._reach[cy * this.map.W + cx]) continue;
        this.pickups.push({ kind, x, y, t: Math.random() * 6 });
        return;
      }
    }
    reachableSet() {
      const W = this.map.W, seen = new Uint8Array(W * this.map.H);
      const s = this.map.start, q = [[s.x, s.y]]; seen[s.y * W + s.x] = 1;
      while (q.length) {
        const [x, y] = q.pop();
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (this.walkable(nx, ny) && !seen[ny * W + nx]) { seen[ny * W + nx] = 1; q.push([nx, ny]); } });
      }
      return seen;
    }

    // ---------- Loop ----------
    loop(t) {
      if (!this.running) return;
      const dt = Math.min(0.05, (t - this.last) / 1000);
      this.last = t;
      try { this.update(dt); this.draw(t / 1000); } catch (e) { console.error(e); }
      requestAnimationFrame(this._loop);
    }

    update(dt) {
      const now = Date.now();
      const wasMoving = this.path.length > 0;
      if (!this.ending && !this.frozen && !this.locked && this.path.length) {
        let step = 175 * (now < this.boostUntil ? 1.8 : 1) * dt;
        while (step > 0 && this.path.length) {
          const [tx, ty] = this.path[0];
          const dx = tx - this.px, dy = ty - this.py, d = Math.hypot(dx, dy);
          if (d <= step) { this.px = tx; this.py = ty; this.path.shift(); step -= d; }
          else { this.px += (dx / d) * step; this.py += (dy / d) * step; step = 0; }
        }
        if (!this.path.length && wasMoving) {
          const n = this.targetStation; this.targetStation = null; this.dest = null;
          if (n) this.opts.onStation(n);
        }
      }
      this.moving = !this.ending && !this.frozen && !this.locked && this.path.length > 0;
      if (this.moving) this.walk += dt * (now < this.boostUntil ? 20 : 12); else this.idle += dt * 3;

      if (!this.ending) {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
          const p = this.pickups[i];
          if (Math.hypot(p.x - this.px, p.y - this.py) < 28) { this.pickups.splice(i, 1); this.opts.onPickup(p.kind); }
        }
        if (now > this.nextSpawn) { this.nextSpawn = now + 22000; if (this.pickups.length < 4) this.spawnPickup(); }
      }

      // Camera
      let tx = this.px, ty = this.py;
      if (this.ending && this.ending.cam) { tx = this.ending.cam[0]; ty = this.ending.cam[1]; }
      const k = this.ending ? 1 - Math.pow(0.02, dt) : 1 - Math.pow(0.0005, dt);
      this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
      const vw = this.cw / this.zoom, vh = this.ch / this.zoom, mw = this.map.W * CELL, mh = this.map.H * CELL;
      this.cam.x = vw >= mw ? mw / 2 : RH.clamp(this.cam.x, vw / 2, mw - vw / 2);
      this.cam.y = vh >= mh ? mh / 2 : RH.clamp(this.cam.y, vh / 2, mh - vh / 2);
    }

    draw(time) {
      const ctx = this.ctx, z = this.zoom, d = this.dpr, map = this.map;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.fillStyle = map.bg; ctx.fillRect(0, 0, this.cw, this.ch);
      let shakeX = 0, shakeY = 0;
      if (this.ending && this.ending.shake) { const e = (performance.now() - this.ending.t0) / 1000; if (e < 2.5) { shakeX = (Math.random() - 0.5) * 8; shakeY = (Math.random() - 0.5) * 8; } }
      const vx = this.cam.x - this.cw / 2 / z + shakeX, vy = this.cam.y - this.ch / 2 / z + shakeY;
      ctx.setTransform(d * z, 0, 0, d * z, -vx * z * d, -vy * z * d);

      // Map image (only the visible part)
      const R = this.mapR, mw = map.W * CELL, mh = map.H * CELL;
      const sx = Math.max(0, vx), sy = Math.max(0, vy), sw = Math.min(mw, vx + this.cw / z) - sx, sh = Math.min(mh, vy + this.ch / z) - sy;
      if (sw > 0 && sh > 0) ctx.drawImage(this.mapImg, sx * R, sy * R, sw * R, sh * R, sx, sy, sw, sh);

      const E = this.ending ? (performance.now() - this.ending.t0) / 1000 : 0;

      // Town lamp posts (always there; they light up at night)
      if (map.lamps) map.lamps.forEach(([c, r]) => {
        const x = (c + 0.5) * CELL, y = (r + 0.5) * CELL;
        ctx.fillStyle = '#3c3f48'; ctx.fillRect(x - 2, y - 30, 4, 30);
        ctx.fillStyle = '#2b2e36'; ctx.beginPath(); ctx.arc(x, y - 32, 6, 0, 7); ctx.fill();
        ctx.fillStyle = '#eee8c0'; ctx.beginPath(); ctx.arc(x, y - 31, 3.5, 0, 7); ctx.fill();
      });

      // Stations
      for (const k in map.stations) {
        const s = map.stations[k], rem = this.remaining[k] || 0;
        const cx = (s.x + 0.5) * CELL, cy = (s.y + 0.5) * CELL;
        if (rem > 0) {
          const pulse = 0.5 + 0.5 * Math.sin(time * 4 + +k);
          ctx.strokeStyle = `rgba(255,209,102,${0.5 + pulse * 0.5})`; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.ellipse(cx, cy + 8, 17 + pulse * 3, 8 + pulse * 1.5, 0, 0, 7); ctx.stroke();
          const by = cy - 38 + Math.sin(time * 3 + +k) * 3;
          ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(cx + 1, by + 3, 19, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, by, 19, 0, 7); ctx.fill();
          ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - 6, by + 17); ctx.lineTo(cx, by + 26); ctx.lineTo(cx + 6, by + 17); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.font = `20px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(this.opts.stationEmoji[k] || '❗', cx, by + 1);
          ctx.fillStyle = '#ef233c'; ctx.beginPath(); ctx.arc(cx + 15, by - 14, 9, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Fredoka, Arial, sans-serif'; ctx.fillText(rem > 1 ? '×' + rem : '!', cx + 15, by - 13);
        } else if (this.remaining[k] === 0) {
          ctx.fillStyle = 'rgba(46,196,182,0.9)'; ctx.beginPath(); ctx.arc(cx, cy - 4, 11, 0, 7); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 5, cy - 4); ctx.lineTo(cx - 1, cy); ctx.lineTo(cx + 6, cy - 9); ctx.stroke();
        }
      }

      // Pick-ups
      this.pickups.forEach((p) => {
        const b = Math.sin(time * 3 + p.t) * 4;
        const g = ctx.createRadialGradient(p.x, p.y + b, 2, p.x, p.y + b, 24);
        g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y + b, 24, 0, 7); ctx.fill();
        ctx.font = `22px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(PICKUPS[p.kind], p.x, p.y + b);
      });

      // Destination marker
      if (this.dest && this.path.length) {
        const pulse = (time * 2) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${1 - pulse})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(this.dest[0], this.dest[1] + 8, 6 + pulse * 12, 3 + pulse * 6, 0, 0, 7); ctx.stroke();
      }

      // Ending layers under the player
      if (this.ending) this.drawEndingUnder(ctx, E);

      // Player
      let alpha = 1;
      if (this.ending && this.ending.playerAlpha != null) alpha = this.ending.playerAlpha;
      if (Date.now() < this.boostUntil && this.moving) {
        ctx.strokeStyle = 'rgba(255,214,10,0.8)'; ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) { const yy = this.py - 10 - i * 12; ctx.beginPath(); ctx.moveTo(this.px - 26, yy); ctx.lineTo(this.px - 38, yy); ctx.moveTo(this.px + 26, yy); ctx.lineTo(this.px + 38, yy); ctx.stroke(); }
      }
      if (alpha > 0) RH.Avatar.draw(ctx, this.avatar, this.px, this.py + 12, 0.62, { moving: this.moving, walk: this.walk, idle: this.idle, alpha });
      if (this.frozen) {
        ctx.fillStyle = 'rgba(160,220,255,0.55)'; RH.Avatar.rr(ctx, this.px - 22, this.py - 58, 44, 74, 10); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();
      }

      if (this.ending) this.drawEndingOver(ctx, E);

      // Screen-space: arrows to tasks that are off screen
      ctx.setTransform(d, 0, 0, d, 0, 0);
      this._arrows = [];
      if (!this.ending) {
        for (const k in map.stations) {
          if (!(this.remaining[k] > 0)) continue;
          const s = map.stations[k];
          const wx = (s.x + 0.5) * CELL, wy = (s.y + 0.5) * CELL - 20;
          const ssx = (wx - vx) * z, ssy = (wy - vy) * z;
          const m = 30;
          if (ssx > m && ssx < this.cw - m && ssy > 120 && ssy < this.ch - 110) continue;
          const cx = this.cw / 2, cy = this.ch / 2;
          const ang = Math.atan2(ssy - cy, ssx - cx);
          const hw = this.cw / 2 - m, hhTop = cy - 124, hhBot = this.ch - cy - 118;
          const tx = Math.cos(ang), ty = Math.sin(ang);
          const scale = Math.min(Math.abs(hw / (tx || 1e-6)), ty < 0 ? Math.abs(hhTop / ty) : Math.abs(hhBot / (ty || 1e-6)));
          const ax = cx + tx * scale, ay = cy + ty * scale;
          this._arrows.push({ x: ax, y: ay, n: +k });
          ctx.save(); ctx.translate(ax, ay);
          ctx.fillStyle = 'rgba(20,24,48,0.75)'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.fill();
          ctx.rotate(ang); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(15, -7); ctx.lineTo(15, 7); ctx.fill();
          ctx.rotate(-ang);
          ctx.font = `16px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.opts.stationEmoji[k] || '❗', 0, 1);
          ctx.restore();
        }
      }
    }

    // ---------- Endings ----------
    playEnding(kind, done) {
      this.path = []; this.targetStation = null; this.dest = null;
      const e = this.ending = { kind, t0: performance.now(), done, fired: false };
      const map = this.map;
      if (kind === 'school') {
        const stop = map.stations && map.roads && map.roads[0];
        e.busY = stop ? stop.mid * CELL : (map.H - 1) * CELL;
        e.stopX = 12.5 * CELL;
        e.cam = [e.stopX, e.busY - 110];
        e.length = 5.6;
      } else if (kind === 'bank') { e.shake = true; e.length = 4.2; }
      else if (kind === 'shop') { e.length = 1.2 + (map.lights || []).length * 0.4 + 1.2; }
      else if (kind === 'town') {
        e.length = 4.6;
        e.lightOrder = (map._windows || []).map((w) => ({ x: w[0], y: w[1], win: true, at: 1.0 + Math.random() * 2.2 }))
          .concat((map.lamps || []).map(([c, r]) => ({ x: (c + 0.5) * CELL, y: (r + 0.5) * CELL - 31, at: 1.0 + Math.random() * 2.0 })));
      } else e.length = 3;
      const tick = () => {
        if (!this.running || this.ending !== e) return;
        const t = (performance.now() - e.t0) / 1000;
        if (t >= e.length) { if (!e.fired) { e.fired = true; done && done(); } return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    drawEndingUnder(ctx, t) {
      const e = this.ending, map = this.map;
      if (e.kind === 'school') {
        // Move the player to the bus stop and walk them onto the bus
        if (t > 0.7 && !e.placed) { e.placed = true; this.px = e.stopX; this.py = 31.5 * CELL; }
        if (t > 2.9) { const k = RH.clamp((t - 2.9) / 0.6, 0, 1); this.py = 31.5 * CELL + k * 52; e.playerAlpha = 1 - k; }
      }
      if (e.kind === 'shop') {
        (map.lights || []).forEach(([x, y, w, h], i) => {
          const a = RH.clamp((t - 1.2 - i * 0.4) / 0.25, 0, 1) * 0.86;
          if (a > 0) { ctx.fillStyle = `rgba(5,6,18,${a})`; ctx.fillRect(x * CELL, y * CELL, w * CELL, h * CELL); }
        });
        const all = RH.clamp((t - 1.2 - (map.lights || []).length * 0.4) / 0.5, 0, 1) * 0.75;
        if (all > 0) { ctx.fillStyle = `rgba(5,6,18,${all})`; ctx.fillRect(0, 0, map.W * CELL, map.H * CELL); }
      }
      if (e.kind === 'town' && t > 0.9) {
        ctx.fillStyle = 'rgba(12,18,60,0.68)'; ctx.fillRect(0, 0, map.W * CELL, map.H * CELL);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        e.lightOrder.forEach((L) => {
          if (t < L.at) return;
          const k = RH.clamp((t - L.at) / 0.15, 0, 1);
          const r = L.win ? 26 : 70;
          const g = ctx.createRadialGradient(L.x, L.y, 1, L.x, L.y, r);
          g.addColorStop(0, `rgba(255,214,120,${0.75 * k})`); g.addColorStop(1, 'rgba(255,214,120,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.x, L.y, r, 0, 7); ctx.fill();
        });
        ctx.restore();
        e.lightOrder.forEach((L) => {
          if (t < L.at) return;
          ctx.fillStyle = '#ffe08a';
          if (L.win) ctx.fillRect(L.x - 7, L.y - 6, 14, 12); else { ctx.beginPath(); ctx.arc(L.x, L.y, 4.5, 0, 7); ctx.fill(); }
        });
      }
    }

    drawEndingOver(ctx, t) {
      const e = this.ending;
      if (e.kind === 'school') {
        let bx;
        if (t < 0.8) bx = 1250;
        else if (t < 2.7) bx = 1250 - (1250 - (e.stopX + 30)) * easeOut((t - 0.8) / 1.9);
        else if (t < 3.8) bx = e.stopX + 30;
        else bx = e.stopX + 30 - 900 * easeIn((t - 3.8) / 1.6);
        if (t > 2.6 && !e.horn) { e.horn = true; RH.Sound.play('horn'); }
        drawBus(ctx, bx, e.busY);
      }
    }
  }

  function drawBus(ctx, x, y) {
    const rr = RH.Avatar.rr;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 32, 92, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffc300'; rr(ctx, -90, -40, 180, 68, 12); ctx.fill();
    ctx.fillStyle = '#e0a800'; ctx.fillRect(-90, 6, 180, 6);
    ctx.fillStyle = '#9ad1ff';
    for (let i = 0; i < 5; i++) { rr(ctx, -62 + i * 28, -32, 22, 20, 3); ctx.fill(); }
    rr(ctx, -86, -32, 20, 30, 4); ctx.fill(); // windscreen (front faces left)
    ctx.fillStyle = '#333'; ctx.font = 'bold 13px Fredoka, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SCHOOL BUS', 10, -2);
    ctx.fillStyle = '#e74c3c'; ctx.fillRect(84, -10, 6, 10);
    ctx.fillStyle = '#fff6a0'; ctx.fillRect(-90, 14, 7, 7);
    [-55, 55].forEach((wx) => { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(wx, 28, 13, 0, 7); ctx.fill(); ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(wx, 28, 5, 0, 7); ctx.fill(); });
    ctx.restore();
  }

  RH.Game = Game;
})(window.RH);
