'use strict';
// ---------------------------------------------------------------------------
// Particles, fireworks, weather, ambient critters and lighting.
// Positions are world pixels; timers are real seconds.
// ---------------------------------------------------------------------------

const FIREWORK_COLS = [['#ff5a4a', '#ffd0a0'], ['#ffd34a', '#fff6c0'], ['#6ad0ff', '#e0f6ff'], ['#9aff7a', '#e6ffd0'], ['#ff8ae0', '#ffe0f6'], ['#c89aff', '#f0e0ff']];

const FX = {
  parts: [],
  queue: [],
  butterflies: [],
  fireflies: [],
  rain: [],
  clouds: [],

  add(p) { p.vx = p.vx || 0; p.vy = p.vy || 0; if (this.parts.length < 2000) this.parts.push(p); },

  smokeRing(x, y) { this.add({ k: 'ring', x, y, vx: R.f(1, 3), vy: -R.f(5, 8), t: 0, life: R.f(2.2, 3), r: 1 }); },
  chimney(x, y, heavy) { this.add({ k: 'smoke', x: x + R.f(-1, 1), y, vx: R.f(3, 7), vy: -R.f(7, 12), t: 0, life: R.f(3.5, 5.5), r: R.f(2, 3) + (heavy ? 1 : 0), heavy }); },
  zzz(x, y) { this.add({ k: 'z', x, y, vx: R.f(1, 3), vy: -6, t: 0, life: 2.5, ph: R.f(0, 6) }); },
  hearts(x, y) { for (let i = 0; i < 4; i++) this.add({ k: 'heart', x: x + R.f(-6, 6), y: y + R.f(-3, 3), vx: R.f(-4, 4), vy: -R.f(10, 18), t: -i * 0.15, life: 1.6 }); },
  puff(x, y) { for (let i = 0; i < 5; i++) this.add({ k: 'puff', x: x + R.f(-5, 5), y: y + R.f(-3, 3), vx: R.f(-6, 6), vy: -R.f(2, 6), t: 0, life: 1, r: R.f(1.5, 3) }); },
  chatPuff(x, y) { this.add({ k: 'dots', x, y, vx: 0, vy: -4, t: 0, life: 1.2 }); },
  note(x, y) { this.add({ k: 'note', x: x + R.f(-4, 4), y, vx: R.f(-3, 3), vy: -R.f(8, 12), t: 0, life: 2, col: R.pick(['#2a1c12', '#7a2a6a', '#2a4a8a']) }); },
  splash(x, y) { for (let i = 0; i < 8; i++) this.add({ k: 'drop', x, y, vx: R.f(-14, 14), vy: -R.f(15, 30), t: 0, life: 0.6 }); },
  chips(x, y) { for (let i = 0; i < 3; i++) this.add({ k: 'drop', x, y, vx: R.f(-20, 20), vy: -R.f(10, 25), t: 0, life: 0.5, col: R.pick(['#d8b07a', '#8a6440']) }); },
  dirt(x, y) { for (let i = 0; i < 3; i++) this.add({ k: 'drop', x: x + R.f(-4, 4), y, vx: R.f(-15, 15), vy: -R.f(15, 30), t: 0, life: 0.6, col: R.pick(['#6a4630', '#4a2e1a']) }); },
  snowball(x1, y1, x2, y2) { this.add({ k: 'snowball', x: x1, y: y1, sx: x1, sy: y1, ex: x2 + R.f(-6, 6), ey: y2, t: 0, life: 0.7 }); },
  sparkle(x, y, col = '#fff6c0') { for (let i = 0; i < 6; i++) this.add({ k: 'spark', x, y, vx: R.f(-20, 20), vy: R.f(-30, 0), t: 0, life: R.f(0.5, 1), col, g: 40 }); },

  firework(x, y, delay = 0) {
    this.queue.push({ at: delay, x: x + R.f(-10, 10), y });
  },
  launch(x, y) {
    const h = R.f(70, 130);
    this.add({ k: 'rocket', x, y, vx: R.f(-8, 8), vy: -h * 1.4, t: 0, life: 0.7, cols: R.pick(FIREWORK_COLS), style: R.i(0, 3) });
    Sound.whoosh();
  },
  burst(x, y, cols, style) {
    const n = style === 2 ? 26 : 44;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R.f(-0.05, 0.05);
      const sp = style === 1 ? R.f(40, 85) : style === 2 ? 70 : R.f(55, 80);
      this.add({ k: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.8, t: 0, life: style === 1 ? R.f(2, 2.8) : R.f(1.4, 2),
        col: i % 3 === 0 ? cols[1] : cols[0], g: style === 1 ? 14 : 22, drag: 0.965, light: i % 5 === 0, trail: style === 1 || i % 4 === 0, big: true });
    }
    if (style === 3) for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      this.add({ k: 'spark', x, y, vx: Math.cos(a) * 25, vy: Math.sin(a) * 20, t: 0, life: 1.4, col: '#ffffff', g: 25, drag: 0.95 });
    }
    this.add({ k: 'flash', x, y, t: 0, life: 0.7, col: cols[0] });
    Sound.boom();
  },

  update(dt, game) {
    for (const q of this.queue) q.at -= dt;
    while (this.queue.length && this.queue[0].at <= 0) { const q = this.queue.shift(); this.launch(q.x, q.y); }
    this.queue.sort((a, b) => a.at - b.at);
    const out = [];
    for (const p of this.parts) {
      p.t += dt;
      if (p.t < 0) { out.push(p); continue; }
      if (p.t >= p.life) {
        if (p.k === 'rocket') this.burst(p.x, p.y, p.cols, p.style);
        if (p.k === 'snowball') for (let i = 0; i < 5; i++) this.add({ k: 'drop', x: p.x, y: p.y, vx: R.f(-14, 14), vy: -R.f(5, 18), t: 0, life: 0.4, col: '#ffffff' });
        continue;
      }
      if (p.k === 'snowball') {
        const f = p.t / p.life;
        p.x = lerp(p.sx, p.ex, f); p.y = lerp(p.sy, p.ey, f) - Math.sin(f * Math.PI) * 14;
        out.push(p); continue;
      }
      if (p.drag) { p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60); }
      if (p.g) p.vy += p.g * dt;
      if (p.k === 'drop') p.vy += 90 * dt;
      if (p.k === 'rocket') {
        p.vy *= Math.pow(0.97, dt * 60);
        if (Math.random() < 0.8) this.add({ k: 'spark', x: p.x, y: p.y + 2, vx: R.f(-5, 5), vy: R.f(5, 15), t: 0, life: 0.4, col: '#ffd890', g: 10 });
      }
      if (p.trail && Math.random() < dt * 8) this.add({ k: 'spark', x: p.x, y: p.y, vx: 0, vy: 4, t: 0, life: 0.5, col: '#ffcf80', g: 6 });
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 'smoke') p.r += dt * 1.6;
      if (p.k === 'ring') p.r += dt * 1.6;
      if (p.k === 'z' || p.k === 'note') p.x += Math.sin(p.t * 3 + (p.ph || 0)) * dt * 6;
      out.push(p);
    }
    this.parts = out;
    this.updateAmbient(dt, game);
  },

  // Emissive particles (fireworks) are drawn after the lighting pass so they glow.
  // Particles are drawn in half-pixels, like everything else.
  draw(ctx, emissive = false) {
    const hp = (v) => Math.round(v * RS) / RS, H = 1 / RS;
    const R = (x, y, w, h) => ctx.fillRect(x, y, w * H, h * H); // a box measured in half-pixels
    // smoke and puffs are round blobs of whole world pixels, as chunky as the art
    const round = (x, y, r, col) => disc(ctx, Math.round(x), Math.round(y), Math.max(1, Math.round(r)), col);
    for (const p of this.parts) {
      if (p.t < 0) continue;
      if ((p.k === 'spark' || p.k === 'rocket' || p.k === 'flash') !== emissive) continue;
      const f = p.t / p.life;
      const x = hp(p.x), y = hp(p.y);
      switch (p.k) {
        case 'ring': {
          ctx.globalAlpha = (1 - f) * 0.85;
          ctx.fillStyle = '#f0ece4';
          for (let a = 0; a < 20; a++) { const an = a / 20 * Math.PI * 2; R(hp(x + Math.cos(an) * p.r), hp(y + Math.sin(an) * p.r * 0.6), 1, 1); }
          break;
        }
        case 'smoke':
          ctx.globalAlpha = (1 - f) * (p.heavy ? 0.65 : 0.55);
          round(x, y, p.r, p.heavy ? '#b8b4ac' : '#dcd8d0');
          if (p.r > 2) { ctx.globalAlpha *= 0.6; round(x - 0.5, y - 0.5, p.r * 0.55, '#f4f2ee'); }
          break;
        case 'puff':
          ctx.globalAlpha = (1 - f) * 0.8;
          round(x, y, p.r, '#8a8a8a');
          break;
        case 'z':
          ctx.globalAlpha = 1 - f;
          ctx.fillStyle = '#e8f0ff';
          R(x, y, 5, 1); R(x + 3 * H, y + H, 1, 1); R(x + 2 * H, y + 2 * H, 1, 1); R(x + H, y + 3 * H, 1, 1); R(x, y + 4 * H, 5, 1);
          break;
        case 'heart': {
          ctx.globalAlpha = 1 - f * f;
          const rows = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
          ctx.fillStyle = '#e8404a';
          rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') R(x + (i - 3) * H, y + (j - 2) * H, 1, 1); });
          ctx.fillStyle = '#ff9aa0'; R(x - 2 * H, y - H, 1, 1);
          break;
        }
        case 'note':
          ctx.globalAlpha = 1 - f;
          ctx.fillStyle = p.col;
          R(x + 3 * H, y - 6 * H, 1, 8); R(x, y, 4, 3); R(x + H, y - H, 2, 1); R(x + 4 * H, y - 6 * H, 2, 1); R(x + 5 * H, y - 5 * H, 1, 2);
          break;
        case 'dots':
          ctx.globalAlpha = 1 - f;
          ctx.fillStyle = '#ffffff'; R(x - 10 * H, y - 4 * H, 21, 9); R(x - 8 * H, y + 5 * H, 2, 2);
          ctx.fillStyle = '#2a1c12'; for (let i = 0; i < 3; i++) R(x - 6 * H + i * 5 * H, y, 2, 2);
          break;
        case 'drop':
          ctx.globalAlpha = 1 - f;
          ctx.fillStyle = p.col || '#cfe8ff'; R(x, y, 1, 2);
          break;
        case 'snowball':
          ctx.globalAlpha = 1;
          round(x, y, 1.5, '#ffffff'); ctx.fillStyle = '#c8d8e8'; R(x + H, y + H, 1, 1);
          break;
        case 'spark':
          ctx.globalAlpha = 1 - f * f;
          ctx.fillStyle = p.col;
          if (p.big && f < 0.6) { R(x - H, y - H, 3, 3); ctx.fillStyle = '#ffffff'; R(x, y, 1, 1); }
          else R(x, y, 1, 1);
          if (p.big && f < 0.25) { ctx.globalAlpha = 0.5; ctx.fillStyle = p.col; R(x - 3 * H, y, 7, 1); R(x, y - 3 * H, 1, 7); }
          break;
        case 'rocket':
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#fff2c0'; R(x, y, 1, 4); ctx.fillStyle = '#ffb040'; R(x, y + 4 * H, 1, 2);
          break;
        case 'flash':
          ctx.globalAlpha = (1 - f) * 0.5;
          round(x, y, 6 + f * 10, p.col);
          break;
      }
    }
    ctx.globalAlpha = 1;
  },

  lights(out) {
    for (const p of this.parts) {
      if (p.t < 0) continue;
      if (p.k === 'flash') out.push({ x: p.x, y: p.y, r: 190 * (1 - p.t / p.life) + 60, a: 0.95 * (1 - p.t / p.life), col: p.col });
      else if (p.k === 'spark' && p.light) out.push({ x: p.x, y: p.y, r: 30, a: 0.7 * (1 - p.t / p.life), col: p.col });
      else if (p.k === 'rocket') out.push({ x: p.x, y: p.y, r: 16, a: 0.6 });
    }
  },

  // ----- ambient critters & weather -----
  initAmbient() {
    this.butterflies = [];
    for (let i = 0; i < 12; i++) {
      const f = R.pick(World.flowers);
      this.butterflies.push({ x: f.x, y: f.y - 10, hx: f.x, hy: f.y, t: R.f(0, 10), col: R.pick(['#ffffff', '#f2d24a', '#ff9a4a', '#a8c8ff']) });
    }
    this.fireflies = [];
    for (let i = 0; i < 45; i++) {
      const near = R.chance(0.5) ? R.pick(World.waterTiles) : [R.i(2, MAP_W - 3), R.i(2, MAP_H - 3)];
      this.fireflies.push({ x: near[0] * 16 + R.f(-20, 20), y: near[1] * 16 + R.f(-20, 20), t: R.f(0, 20), sp: R.f(0.3, 1) });
    }
    this.clouds = [];
    for (let i = 0; i < 6; i++) this.clouds.push({ x: R.f(0, MAP_W * 16), y: R.f(0, MAP_H * 16), r: R.f(80, 160) });
  },

  updateAmbient(dt, game) {
    for (const b of this.butterflies) {
      b.t += dt;
      b.x += Math.cos(b.t * 1.3 + b.hx) * dt * 14 + (b.hx - b.x) * dt * 0.3;
      b.y += Math.sin(b.t * 1.9 + b.hy) * dt * 10 + (b.hy - 10 - b.y) * dt * 0.3;
      if (Math.random() < dt * 0.05) { const f = R.pick(World.flowers); b.hx = f.x; b.hy = f.y; }
    }
    for (const f of this.fireflies) { f.t += dt * f.sp; f.x += Math.cos(f.t * 0.9) * dt * 6; f.y += Math.sin(f.t * 1.3) * dt * 4; }
    for (const c of this.clouds) { c.x += dt * 6; if (c.x - c.r > MAP_W * 16) { c.x = -c.r; c.y = R.f(0, MAP_H * 16); } }
  },

  drawAmbientDay(ctx, game, cam) {
    if (game.darkness > 0.35 || game.raining || World.season === 'winter' || World.season === 'autumn') return;
    for (const b of this.butterflies) {
      const x = Math.round(b.x * RS) / RS, y = Math.round(b.y * RS) / RS, H = 1 / RS;
      if (x < cam.x - 10 || x > cam.x + cam.w + 10 || y < cam.y - 10 || y > cam.y + cam.h + 10) continue;
      const open = Math.sin(b.t * 18) > 0;
      ctx.fillStyle = b.col;
      if (open) { ctx.fillRect(x - 2.5, y - 1, 2, 1.5); ctx.fillRect(x + 1, y - 1, 2, 1.5); ctx.fillRect(x - 2, y + 0.5, 1.5, 1); ctx.fillRect(x + 1, y + 0.5, 1.5, 1); }
      else { ctx.fillRect(x - 1, y - 1.5, H, 2); ctx.fillRect(x + 1, y - 1.5, H, 2); }
      ctx.fillStyle = '#2a1c12'; ctx.fillRect(x, y - 0.5, 1, 2);
    }
  },

  drawClouds(ctx, game) {
    const a = game.raining ? 0.1 : game.weather === 'cloudy' ? 0.08 : 0.04;
    for (const c of this.clouds) {
      // a cloud's shadow, in three flattened steps
      for (let k = 3; k >= 1; k--) ellipseFill(ctx, Math.round(c.x), Math.round(c.y), Math.round((c.r * k) / 3), Math.round((c.r * k * 0.7) / 3), `rgba(20,30,40,${a * 0.45})`);
    }
  },

  drawFireflies(ctx, game, cam, lights) {
    if (game.darkness < 0.3 || game.raining || World.season === 'winter') return;
    for (const f of this.fireflies) {
      const on = Math.sin(f.t * 3) > 0.2;
      if (!on) continue;
      if (f.x < cam.x || f.x > cam.x + cam.w || f.y < cam.y || f.y > cam.y + cam.h) continue;
      ctx.fillStyle = '#e8ff8a'; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
      lights.push({ x: f.x, y: f.y, r: 9, a: 0.5 });
    }
  },

  // Falling things in screen space: snowflakes, blossom petals, autumn leaves.
  flakes: [],
  drawFalling(ctx, game, cam, dt) {
    const season = World.season;
    let kind = null, want = 0;
    if (game.weather === 'snow') { kind = 'snow'; want = Math.floor(cam.w * cam.h / 700); }
    else if (season === 'spring' && !game.raining && game.darkness < 0.5) { kind = 'petal'; want = Math.floor(cam.w * cam.h / 9000); }
    else if (season === 'autumn' && !game.raining) { kind = 'leaf'; want = Math.floor(cam.w * cam.h / 7000); }
    if (!kind) { this.flakes.length = 0; return; }
    this.flakes = this.flakes.filter((f) => f.kind === kind);
    while (this.flakes.length < want) this.flakes.push({ kind, x: R.f(0, cam.w + 40), y: R.f(-cam.h, cam.h), v: kind === 'snow' ? R.f(14, 30) : R.f(8, 16), ph: R.f(0, 6), col: kind === 'leaf' ? R.pick(['#d8782a', '#c84a1e', '#e8b84a', '#a8561a']) : kind === 'petal' ? R.pick(['#ffd0e0', '#ffffff', '#ffb0c8']) : '#ffffff' });
    for (const f of this.flakes) {
      f.y += f.v * dt; f.ph += dt * 2; f.x += Math.sin(f.ph) * dt * (kind === 'snow' ? 6 : 14) - dt * (kind === 'snow' ? 2 : 8);
      if (f.y > cam.h + 4) { f.y = R.f(-20, 0); f.x = R.f(0, cam.w + 40); }
      if (f.x < -10) f.x = cam.w + 10;
      const x = Math.round((cam.x + f.x) * RS) / RS, y = Math.round((cam.y + f.y) * RS) / RS;
      ctx.fillStyle = f.col;
      if (kind === 'snow') { ctx.globalAlpha = 0.9; const s2 = f.v > 22 ? 1.5 : 1; ctx.fillRect(x, y, s2, s2); }
      else { ctx.globalAlpha = 0.85; ctx.fillRect(x, y, 1.5, 1); if (Math.sin(f.ph) > 0) ctx.fillRect(x + 0.5, y + 1, 1, 0.5); }
    }
    ctx.globalAlpha = 1;
  },

  drawFog(ctx, game, cam) {
    if (game.weather !== 'fog') return;
    const t = performance.now() / 1000;
    for (let i = 0; i < 9; i++) {
      const fx = cam.x + ((i * 173 + t * 6) % (cam.w + 300)) - 150, fy = cam.y + (i * 97) % cam.h;
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 160);
      g.addColorStop(0, 'rgba(230,236,240,0.32)'); g.addColorStop(1, 'rgba(230,236,240,0)');
      ctx.fillStyle = g; ctx.fillRect(fx - 160, fy - 160, 320, 320);
    }
    ctx.fillStyle = 'rgba(220,228,232,0.18)'; ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
  },

  lightning: 0,
  drawLightning(ctx, game, cam, dt) {
    if (game.weather === 'storm' && Math.random() < dt * 0.08) { this.lightning = 0.35; setTimeout(() => Sound.thunder(), R.i(300, 1500)); }
    if (this.lightning > 0) {
      ctx.fillStyle = `rgba(235,240,255,${this.lightning * 1.6})`; ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
      this.lightning -= dt;
    }
  },

  drawRain(ctx, game, cam, dt) {
    if (!game.raining) { this.rain.length = 0; return; }
    const want = Math.floor(cam.w * cam.h / (game.weather === 'storm' ? 500 : 900));
    while (this.rain.length < want) this.rain.push({ x: R.f(0, cam.w + 40), y: R.f(-cam.h, cam.h), v: R.f(160, 220) });
    ctx.fillStyle = 'rgba(200,220,255,0.55)';
    for (const r of this.rain) {
      r.y += r.v * dt; r.x -= r.v * dt * 0.25;
      if (r.y > cam.h) {
        if (Math.random() < 0.4) this.add({ k: 'drop', x: cam.x + r.x, y: cam.y + r.y - R.f(0, 30), vx: R.f(-8, 8), vy: -R.f(8, 14), t: 0, life: 0.3 });
        r.y = R.f(-40, 0); r.x = R.f(0, cam.w + 40);
      }
      const x = Math.round((cam.x + r.x) * RS) / RS, y = Math.round((cam.y + r.y) * RS) / RS;
      ctx.fillRect(x, y, 0.5, 3); ctx.fillRect(x - 0.5, y + 3, 0.5, 2);
    }
  },
};

// ---------------------------------------------------------------------------
// Lighting: a darkness overlay with pools of light cut out of it. The pools
// are stepped, four flattened rings each, and drawn pixel for pixel, so the
// glow stays as crisp as the art. Each pool is drawn once into a stamp and
// kept, since a village at night can have a hundred of them on screen.
// ---------------------------------------------------------------------------
const Light = {
  c: null, x: null, stamps: new Map(),
  // `rings` stepped ellipses, ring k of them r*k/div across, stacked by `op`
  stamp(r, rings, div, col, op) {
    const key = `${r}|${rings}|${div}|${col}|${op}`;
    let s = this.stamps.get(key);
    if (s) return s;
    if (this.stamps.size > 600) this.stamps.clear();
    const ry = Math.max(1, Math.round((r * rings * 0.62) / div)), rx = Math.round((r * rings) / div);
    const [c, x] = makeCanvas(rx * 2 + 1, ry * 2 + 1);
    x.globalCompositeOperation = op;
    for (let k = rings; k >= 1; k--) ellipseFill(x, rx, ry, Math.round((r * k) / div), Math.max(1, Math.round((r * k * 0.62) / div)), col);
    s = { c, rx, ry };
    this.stamps.set(key, s);
    return s;
  },
  render(ctx, cam, darkness, tint, lights) {
    if (darkness <= 0.01) return;
    if (!this.c || this.c.width !== cam.w || this.c.height !== cam.h) {
      [this.c, this.x] = makeCanvas(cam.w, cam.h);
    }
    const x = this.x;
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, cam.w, cam.h);
    x.fillStyle = `rgba(${tint},${darkness})`;
    x.fillRect(0, 0, cam.w, cam.h);
    x.globalCompositeOperation = 'destination-out';
    const seen = (l, sx, sy) => Number.isFinite(sx) && Number.isFinite(sy) && l.r > 0 && sx > -l.r && sy > -l.r && sx < cam.w + l.r && sy < cam.h + l.r;
    for (const l of lights) {
      const sx = Math.round(l.x - cam.x), sy = Math.round(l.y - cam.y);
      if (!seen(l, sx, sy)) continue;
      // four rings that together clear `a` of the dark; stamped `destination-out`,
      // their stacked alpha clears just what four rings drawn one by one would
      const step = 1 - Math.pow(1 - Math.min(0.98, l.a), 0.25);
      const st = this.stamp(Math.round(l.r), 4, 4, `rgba(0,0,0,${step.toFixed(3)})`, 'source-over');
      x.drawImage(st.c, sx - st.rx, sy - st.ry);
    }
    ctx.imageSmoothingEnabled = false; ctx.drawImage(this.c, cam.x, cam.y);
    // a warm glow added round each lamp and window, in steps too
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      if (!l.warm && !l.col) continue;
      const sx = Math.round(l.x), sy = Math.round(l.y);
      if (!seen(l, sx - cam.x, sy - cam.y)) continue;
      const [cr, cg, cb] = hexToRgb(l.col || '#ffaa50');
      // drawn at a quarter strength and scaled down to the glow wanted; `glow`
      // warms a bright light's pool more strongly
      const st = this.stamp(Math.round(l.r), 3, 5, `rgba(${cr},${cg},${cb},0.25)`, 'lighter');
      ctx.globalAlpha = Math.min(1, (0.09 * (l.glow || 1) * darkness * (l.a || 1)) / 0.25);
      ctx.drawImage(st.c, sx - st.rx, sy - st.ry);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  },
};
