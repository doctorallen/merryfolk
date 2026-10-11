'use strict';
// ---------------------------------------------------------------------------
// The isometric view. The same village, drawn from a fixed angle at full
// resolution: painted ground, the home mounds as rounded hills with their
// doors set into cuttings, lit timber and stone buildings, trees in every
// season, and folk drawn afresh. The simulation is untouched; this file only
// takes over drawing, the camera, zoom and turning clicks into places.
//
// World pixels (16 to a tile) map onto the screen as
//   sx = (x - y) * 2 * zoom,   sy = (x + y - z) * zoom
// where z is a height in the same units. Things not yet drawn the new way
// (animals, crops, props) are drawn upright from their old sprites.
// The classic view stays available from the ⚙ menu, and build mode uses it
// for now.
// ---------------------------------------------------------------------------

const Iso = {
  on: true, suspended: false, zoom: 1.4, cx: 0, cy: 0,
  active() { return this.on && !this.suspended; },
};

(() => {
  const VIEW_KEY = 'merryfolk-view';
  try { Iso.on = localStorage.getItem(VIEW_KEY) !== 'classic'; } catch (e) { /* storage unavailable: isometric by default */ }
  // phones start further out, so the square and its homes fit on the screen
  Iso.zoom = window.innerWidth < 700 ? 0.8 : window.innerWidth < 1100 ? 1.1 : 1.4;

  const ZMS = [0.7, 1, 1.4, 2, 2.8];
  Iso.props = {};
  const TPX = 24;                 // ground texture pixels per tile
  const BK = 1.5;                 // sprite pixels per iso unit
  const KB = 1.7;                 // old sprites drawn upright: iso units per world pixel
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pick = (R, a) => a[Math.floor(R() * a.length)];
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const tint = (hex, k) => { const [r, g, b] = hexRgb(hex); const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  const pathPoly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  function batched(g, cols, n, mark, fill = false) {
    const paths = cols.map(() => new Path2D());
    for (let i = 0; i < n; i++) mark(paths[Math.floor(Math.random() * cols.length)], i);
    cols.forEach((c, k) => { if (fill) { g.fillStyle = c; g.fill(paths[k]); } else { g.strokeStyle = c; g.stroke(paths[k]); } });
  }
  Object.assign(Iso, { BK, rng, pick, tint, pathPoly });
  function noiseLayer(g, w, h, octaves, palette, R, mode = 'source-over') {
    g.save(); g.globalCompositeOperation = mode; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    const rgb = palette.map(hexRgb);
    for (const [cells, alpha] of octaves) {
      const cw = Math.max(2, Math.round(cells * (w / Math.max(w, h)))), ch = Math.max(2, Math.round(cells * (h / Math.max(w, h))));
      const s = mk(cw, ch), sg = s.getContext('2d'), img = sg.createImageData(cw, ch), d = img.data;
      for (let i = 0; i < cw * ch; i++) { const c = rgb[Math.floor(R() * rgb.length)]; d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; }
      sg.putImageData(img, 0, 0);
      g.globalAlpha = alpha; g.drawImage(s, 0, 0, w, h);
    }
    g.restore();
  }

  // --- camera -----------------------------------------------------------------
  const W = () => window.innerWidth, H = () => window.innerHeight;
  function w2s(x, y, z = 0) { const zm = Iso.zoom; return [((x - y) - (Iso.cx - Iso.cy)) * 2 * zm + W() / 2, ((x + y) - z - (Iso.cx + Iso.cy)) * zm + H() / 2]; }
  function s2w(sx, sy) {
    const zm = Iso.zoom, a = (sx - W() / 2) / (2 * zm) + (Iso.cx - Iso.cy), b = (sy - H() / 2) / zm + (Iso.cx + Iso.cy);
    return [(a + b) / 2, (b - a) / 2];
  }
  function isoClamp() {
    Iso.cx = Math.max(0, Math.min(MAP_W * 16, Iso.cx)); Iso.cy = Math.max(0, Math.min(MAP_H * 16, Iso.cy));
    // keep the old camera box roughly over what's in view, for the minimap and anything that culls by it
    const pts = [s2w(0, 0), s2w(W(), 0), s2w(0, H()), s2w(W(), H())];
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    Game.cam.x = Math.min(...xs); Game.cam.y = Math.min(...ys); Game.cam.w = Math.max(...xs) - Game.cam.x; Game.cam.h = Math.max(...ys) - Game.cam.y;
  }
  function isoResize() {
    dpr = window.devicePixelRatio || 1;
    view.width = Math.round(W() * dpr); view.height = Math.round(H() * dpr);
    view.style.width = W() + 'px'; view.style.height = H() + 'px';
    overlay.width = Math.round(W() * dpr); overlay.height = Math.round(H() * dpr);
    overlay.style.width = W() + 'px'; overlay.style.height = H() + 'px';
    isoClamp();
  }
  function isoZoomTo(z, ax, ay) {
    z = Math.max(0.6, Math.min(3.2, z));
    ax = ax ?? W() / 2; ay = ay ?? H() / 2;
    const [wx, wy] = s2w(ax, ay);
    Iso.zoom = z;
    const [nx, ny] = s2w(ax, ay);
    Iso.cx += wx - nx; Iso.cy += wy - ny; isoClamp();
  }
  // screen offset (px) to a world offset, for panning
  function screenDelta(dx, dy) { const zm = Iso.zoom, a = dx / (2 * zm), b = dy / zm; return [(a + b) / 2, (b - a) / 2]; }

  // --- ground: a painted texture drawn at an angle ------------------------------------
  let TEX = null, texSeason = null;
  const dirty = [];
  const SEASON_GRASS = {
    spring: ['#5f9a3c', '#74ad48', '#88b856', '#4e8a32', '#9cc060', '#3f7a2a'],
    summer: ['#5a8a34', '#6f9a3f', '#86a44a', '#507d2e', '#9da656', '#3c6526'],
    autumn: ['#7a8a3a', '#8e9a44', '#a8a04a', '#6a7a32', '#b8a454', '#5a6a2a'],
    winter: ['#dfe6ea', '#eef2f4', '#d2dade', '#c8d2d8', '#f6f8fa', '#b8c4cc'],
  };
  const BLADES = { spring: ['#7ab44a', '#4f8a2c', '#94c45a', '#3e7a24'], summer: ['#7aa44a', '#4f7c2c', '#94b45a', '#3e6a24'], autumn: ['#a0a04a', '#7a7a32', '#b8a858', '#6a6a2a'], winter: ['#c8d0d4', '#a8b2b8', '#e6eaec', '#b0bcc4'] };
  function tileAtT(tx, ty) { return tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H ? T.GRASS : World.tiles[ty * MAP_W + tx]; }
  // A mask for a kind of ground at 4px a tile: blurred, roughened and sharpened
  // again, so paths and ponds have curved, slightly ragged edges instead of steps.
  function softMask(types, rx0, ry0, rx1, ry1, soft) {
    const S = 4, w = (rx1 - rx0 + 1) * S, h = (ry1 - ry0 + 1) * S, a = new Float32Array(w * h);
    let any = false;
    for (let ty = ry0; ty <= ry1; ty++) for (let tx = rx0; tx <= rx1; tx++) if (types.includes(tileAtT(tx, ty))) { any = true; for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) a[((ty - ry0) * S + j) * w + (tx - rx0) * S + i] = 1; }
    if (!any) return null;
    const blur = (r) => { const b = new Float32Array(w * h); for (let y = 0; y < h; y++) { let acc = 0; for (let x = -r; x < w + r; x++) { acc += a[y * w + Math.min(w - 1, Math.max(0, x + r))] - a[y * w + Math.min(w - 1, Math.max(0, x - r - 1))]; if (x >= 0 && x < w) b[y * w + x] = acc / (2 * r + 1); } } for (let x = 0; x < w; x++) { let acc = 0; for (let y = -r; y < h + r; y++) { acc += b[Math.min(h - 1, Math.max(0, y + r)) * w + x] - b[Math.max(0, Math.min(h - 1, y - r - 1)) * w + x]; if (y >= 0 && y < h) a[y * w + x] = acc / (2 * r + 1); } } };
    blur(2); blur(2);
    const c = mk(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    for (let i = 0; i < w * h; i++) {
      const x = i % w, y = (i / w) | 0, n = (Math.sin((x + rx0 * S) * 0.9) * Math.sin((y + ry0 * S) * 1.1) + Math.sin((x + rx0 * S) * 0.31 + (y + ry0 * S) * 0.27)) * 0.06 * soft;
      const v = clamp01((a[i] + n - 0.38) / 0.24), e = v * v * (3 - 2 * v);
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = Math.round(e * 255);
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  function paintGround(rect) {
    const season = World.season || 'summer', full = !rect;
    if (full) { TEX = mk(MAP_W * TPX, MAP_H * TPX); texSeason = season; rect = [0, 0, MAP_W - 1, MAP_H - 1]; }
    const [rx0, ry0, rx1, ry1] = [Math.max(0, rect[0] - 2), Math.max(0, rect[1] - 2), Math.min(MAP_W - 1, rect[2] + 2), Math.min(MAP_H - 1, rect[3] + 2)];
    const g = TEX.getContext('2d'), R = rng(4242 + rx0 * 7 + ry0 * 13), Wt = TEX.width, Ht = TEX.height;
    const px0 = rx0 * TPX, py0 = ry0 * TPX, pw = (rx1 - rx0 + 1) * TPX, ph = (ry1 - ry0 + 1) * TPX;
    g.save(); g.beginPath(); g.rect(px0, py0, pw, ph); g.clip();
    g.fillStyle = SEASON_GRASS[season][0]; g.fillRect(px0, py0, pw, ph);
    noiseLayer(g, Wt, Ht, [[9, 0.5], [24, 0.38], [70, 0.28], [200, 0.18], [600, 0.12]], SEASON_GRASS[season], rng(77));
    // each kind of ground through a soft mask made from the tiles
    const layer = (types, paint, soft = 1) => {
      const m = softMask(types, rx0, ry0, rx1, ry1, soft);
      if (!m) return;
      const L = mk(pw, ph), lg = L.getContext('2d'); lg.imageSmoothingEnabled = true; lg.imageSmoothingQuality = 'high';
      lg.drawImage(m, 0, 0, pw, ph);
      lg.globalCompositeOperation = 'source-in'; lg.translate(-px0, -py0); paint(lg); g.drawImage(L, px0, py0);
    };
    const dirt = (lg, base, pal) => { lg.fillStyle = base; lg.fillRect(px0, py0, pw, ph); noiseLayer(lg, Wt, Ht, [[90, 0.35], [300, 0.3], [900, 0.2]], pal, rng(9), 'source-atop'); };
    layer([T.LAWN], (lg) => { lg.fillStyle = season === 'winter' ? '#e8eef0' : '#7aae4c'; lg.fillRect(px0, py0, pw, ph); lg.globalCompositeOperation = 'source-atop'; lg.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = py0; y < py0 + ph; y += 12) lg.fillRect(px0, y, pw, 6); });
    layer([T.WEED], (lg) => dirt(lg, season === 'winter' ? '#d8dee0' : '#5a7a30', ['#4a6a28', '#6a8a3a', '#3e5a22']));
    layer([T.SOIL, T.FIELD], (lg) => { dirt(lg, '#6a4a2c', ['#5a3c22', '#7a5634', '#4a3220']); lg.globalCompositeOperation = 'source-atop'; lg.fillStyle = 'rgba(40,24,10,0.35)'; for (let y = py0; y < py0 + ph; y += 8) lg.fillRect(px0, y, pw, 3); });
    layer([T.PATH, T.BRIDGE], (lg) => dirt(lg, '#9c7e55', ['#7a6040', '#b0905e', '#8a6c46', '#c4a674']));
    layer([T.COBBLE], (lg) => {
      lg.fillStyle = '#4e4840'; lg.fillRect(px0, py0, pw, ph); lg.globalCompositeOperation = 'source-atop';
      const Rc = rng(31 + rx0);
      for (let y = py0; y < py0 + ph; y += 7) for (let x = px0 - (((y / 7) | 0) % 2) * 4; x < px0 + pw; x += 8) { lg.fillStyle = pick(Rc, ['#9c968a', '#8c877c', '#aaa395', '#827d72']); lg.beginPath(); lg.roundRect(x + 0.5, y + 0.5, 7, 6, 2); lg.fill(); lg.fillStyle = 'rgba(255,250,235,0.25)'; lg.fillRect(x + 1.5, y + 1, 4, 1.5); }
    });
    layer([T.WATER], (lg) => {
      lg.fillStyle = season === 'winter' ? '#9cb8c8' : '#3e7d94'; lg.fillRect(px0, py0, pw, ph);
      noiseLayer(lg, Wt, Ht, [[40, 0.3], [160, 0.2]], season === 'winter' ? ['#b8d0dc', '#8eaabb', '#cfe0e8'] : ['#2c5d78', '#4d8ea2', '#3a7590'], rng(5), 'source-atop');
    });
    // wooden planks over the bridges
    for (let ty = ry0; ty <= ry1; ty++) for (let tx = rx0; tx <= rx1; tx++) if (tileAtT(tx, ty) === T.BRIDGE) {
      g.fillStyle = '#8a6a44'; g.fillRect(tx * TPX, ty * TPX, TPX, TPX);
      const across = tileAtT(tx - 1, ty) === T.WATER || tileAtT(tx + 1, ty) === T.WATER;
      g.fillStyle = 'rgba(50,30,14,0.5)'; for (let k = 0; k < TPX; k += 4) across ? g.fillRect(tx * TPX + k, ty * TPX, 1, TPX) : g.fillRect(tx * TPX, ty * TPX + k, TPX, 1);
    }
    // banks between terraces: shade the drop, light the lip
    if (World.tileLevel) for (let ty = ry0; ty <= ry1; ty++) for (let tx = rx0; tx <= rx1; tx++) {
      const lv = World.tileLevel[ty * MAP_W + tx];
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy; if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
        const nl = World.tileLevel[ny * MAP_W + nx]; if (nl >= lv) continue;
        const bx = dx > 0 ? (tx + 1) * TPX : dx < 0 ? tx * TPX : tx * TPX, by = dy > 0 ? (ty + 1) * TPX : dy < 0 ? ty * TPX : ty * TPX, B = 10;
        const gr = dx ? g.createLinearGradient(bx - dx * B, 0, bx + dx * B, 0) : g.createLinearGradient(0, by - dy * B, 0, by + dy * B);
        gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(0.42, 'rgba(255,240,190,0.12)'); gr.addColorStop(0.55, 'rgba(30,22,10,0.16)'); gr.addColorStop(1, 'rgba(30,22,10,0)');
        g.fillStyle = gr; if (dx) g.fillRect(bx - B, ty * TPX, B * 2, TPX); else g.fillRect(tx * TPX, by - B, TPX, B * 2);
      }
    }
    // grass blades, wildflowers and the beds folk have planted
    const grassAt = (x, y) => { const t = tileAtT(Math.floor(x / TPX), Math.floor(y / TPX)); return t === T.GRASS || t === T.HILL || t === T.LAWN; };
    const area = (rx1 - rx0 + 1) * (ry1 - ry0 + 1);
    const blade = (pp) => { const x = px0 + Math.random() * pw, y = py0 + Math.random() * ph; if (!grassAt(x, y)) return; const L = 2 + Math.random() * 3; pp.moveTo(x, y); pp.lineTo(x - L, y - L); };
    g.lineWidth = 0.9; batched(g, BLADES[season], area * 9, blade);
    if (season !== 'winter') batched(g, ['#f4f1e0', '#f2d75a', '#e48aa8', '#b49ae0', '#ffffff'], area * 0.35, (pp) => { const x = px0 + Math.random() * pw, y = py0 + Math.random() * ph; if (!grassAt(x, y)) return; for (let m = 0; m < 3; m++) { const fx = x + (Math.random() - 0.5) * 6, fy = y + (Math.random() - 0.5) * 6; pp.moveTo(fx + 1, fy); pp.arc(fx, fy, 1, 0, Math.PI * 2); } }, true);
    for (const f of World.flowers || []) {
      const fx = (f.x / 16) * TPX, fy = (f.y / 16) * TPX; if (fx < px0 - 20 || fx > px0 + pw + 20 || fy < py0 - 20 || fy > py0 + ph + 20) continue;
      const Rf = rng(f.seed || 1); for (let m = 0; m < 9; m++) { g.fillStyle = pick(Rf, ['#e44a6a', '#f2d75a', '#ffffff', '#b49ae0', '#f0a050']); g.beginPath(); g.arc(fx + (Rf() - 0.5) * 16, fy + (Rf() - 0.5) * 12, 1.4, 0, Math.PI * 2); g.fill(); }
    }
    g.restore();
  }
  function groundUpToDate() {
    if (!TEX || texSeason !== World.season) { paintGround(null); dirty.length = 0; return; }
    while (dirty.length) paintGround(dirty.shift());
  }

  // --- shared drawing for walls and roofs -----------------------------------------
  let GRIME = null;
  function grime() {
    if (GRIME) return GRIME;
    const c = mk(512, 512), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 512);
    noiseLayer(g, 512, 512, [[6, 0.5], [20, 0.4], [70, 0.3], [220, 0.2]], ['#ffffff', '#e8e2d6', '#cfc6b6', '#b6ab98', '#f6f1e8', '#a89c88'], rng(808));
    return (GRIME = c);
  }
  function weather(g, pts, alpha = 0.5) { g.save(); pathPoly(g, pts); g.clip(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = alpha; g.fillStyle = g.createPattern(grime(), 'repeat'); g.fillRect(-4000, -4000, 8000, 8000); g.restore(); }
  // a local frame on a vertical wall: x along it, y down from its top
  function wallFrame(g, a, b, z) { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ex = (b[0] - a[0]) / len, ey = (b[1] - a[1]) / len; g.setTransform(ex, ey, 0, 1, a[0], a[1] - z); return len; }
  function windowPane(g, x, y, w, h, lit) {
    g.fillStyle = '#2a1c12'; g.fillRect(x - 2, y - 2, w + 4, h + 4);
    const wg = g.createLinearGradient(0, y, 0, y + h);
    if (lit) { wg.addColorStop(0, '#ffe7a6'); wg.addColorStop(1, '#e09a40'); } else { wg.addColorStop(0, '#a8c8d8'); wg.addColorStop(1, '#4a6a7a'); }
    g.fillStyle = wg; g.fillRect(x, y, w, h);
    g.fillStyle = '#2a1c12'; g.fillRect(x + w / 2 - 0.75, y, 1.5, h); g.fillRect(x, y + h / 2 - 0.75, w, 1.5);
  }
  function roundWindow(g, u, v, r, lit) {
    g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(u, v, r + 3, 0, Math.PI * 2); g.fill();
    const wg = g.createRadialGradient(u - r * 0.3, v - r * 0.3, 1, u, v, r);
    if (lit) { wg.addColorStop(0, '#fff0b8'); wg.addColorStop(1, '#e8a442'); } else { wg.addColorStop(0, '#c8dce4'); wg.addColorStop(1, '#5a7a88'); }
    g.fillStyle = wg; g.beginPath(); g.arc(u, v, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(1, r * 0.18); g.beginPath(); g.moveTo(u - r, v); g.lineTo(u + r, v); g.moveTo(u, v - r); g.lineTo(u, v + r); g.stroke();
    g.fillStyle = '#6a4a2a'; g.fillRect(u - r - 3, v + r + 2, r * 2 + 6, r * 0.45);
    for (let k = 0; k < 6; k++) { g.fillStyle = ['#e44a6a', '#f2d75a', '#ffffff', '#b49ae0'][k % 4]; g.beginPath(); g.arc(u - r + k * (r * 2 / 5), v + r + 1, r * 0.2, 0, Math.PI * 2); g.fill(); }
  }
  function arch(g, x, y, w, h) { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); }
  function wallFace(style, g, len, h, lit, side, opts) {
    const R = rng(opts.seed || 1), s = BK;
    if (style === 'stone') {
      g.fillStyle = '#5a5046'; g.fillRect(0, 0, len, h);
      for (let y = h, row = 0; y > -12 * s; y -= 8 * s, row++) for (let x = -(row % 2) * 6 * s; x < len; x += (11 + R() * 7) * s) { const w = (10 + R() * 7) * s; g.fillStyle = pick(R, ['#a49884', '#968a76', '#b2a690', '#8a7e6a']); g.beginPath(); g.roundRect(x + 0.7, y - 7.4 * s, w - 1.4, 7 * s, 2); g.fill(); g.fillStyle = 'rgba(255,250,230,0.2)'; g.fillRect(x + 1.4, y - 7 * s, w - 2.8, 1.4 * s); }
    } else if (style === 'plank') {
      g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, len, h);
      for (let x = 0; x < len; x += 7 * s) { g.fillStyle = pick(R, ['#8a5634', '#7a4a2a', '#94603a', '#6e4224']); g.fillRect(x, 0, 6.2 * s, h); g.fillStyle = 'rgba(20,10,4,0.4)'; g.fillRect(x + 6.2 * s, 0, 0.8 * s, h); }
    } else {
      g.fillStyle = '#e6dcc2'; g.fillRect(0, 0, len, h);
      const beam = '#4a3220'; g.fillStyle = beam;
      g.fillRect(0, 0, len, 4 * s); g.fillRect(0, h - 4 * s, len, 4 * s); if (opts.storeys > 1) g.fillRect(0, h * 0.5 - 2.5 * s, len, 5 * s);
      const step = len / Math.max(2, Math.round(len / (26 * s)));
      for (let x = 0; x <= len + 1; x += step) g.fillRect(Math.min(x, len - 4 * s), 0, 4 * s, h);
      g.strokeStyle = beam; g.lineWidth = 3 * s;
      for (let x = 0; x + step <= len + 1; x += step * 2) { g.beginPath(); g.moveTo(x + 2 * s, h - 4 * s); g.lineTo(x + step, h * (opts.storeys > 1 ? 0.5 : 0.1) + 2 * s); g.stroke(); }
    }
    // windows (warm at night), with the door on the front
    const step = len / Math.max(1, Math.round(len / (30 * s)));
    for (let x = step / 2; x < len; x += step) for (const fy of opts.storeys > 1 ? [0.14, 0.6] : [0.3]) {
      if (side === 's' && opts.door != null && Math.abs(x - opts.door * len) < step * 0.55 && fy > 0.25) continue;
      const ww = Math.min(step * 0.45, 12 * s), wh = h * (opts.storeys > 1 ? 0.24 : 0.36);
      if (style === 'stone') { g.fillStyle = '#2a1c12'; arch(g, x - ww / 2 - 1.5, h * fy - 1.5, ww + 3, wh + 3); g.fill(); g.fillStyle = lit ? '#f2c068' : '#7a98a8'; arch(g, x - ww / 2, h * fy, ww, wh); g.fill(); g.fillStyle = '#2a1c12'; g.fillRect(x - 0.6, h * fy + 2, 1.2, wh - 2); }
      else windowPane(g, x - ww / 2, h * fy, ww, wh, lit);
    }
    if (side === 's' && opts.door != null) {
      const dx = opts.door * len, dw = 15 * s, dh = Math.min(h * 0.62, 26 * s);
      g.fillStyle = '#2a1c12'; arch(g, dx - dw / 2 - 2, h - dh - 2, dw + 4, dh + 2); g.fill();
      g.fillStyle = opts.doorCol || '#7a4a26'; arch(g, dx - dw / 2, h - dh, dw, dh); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; for (let x = dx - dw / 2 + 3 * s; x < dx + dw / 2; x += 3 * s) { g.beginPath(); g.moveTo(x, h); g.lineTo(x, h - dh + dw / 2); g.stroke(); }
      g.fillStyle = '#e8c060'; g.beginPath(); g.arc(dx + dw * 0.3, h - dh * 0.45, 1.3 * s, 0, Math.PI * 2); g.fill();
      if (opts.sign) { g.fillStyle = '#2a1c12'; g.fillRect(dx + dw, h - dh - 6 * s, 16 * s, 2 * s); g.fillStyle = '#6a3a1e'; g.fillRect(dx + dw + 4 * s, h - dh - 4 * s, 14 * s, 10 * s); g.strokeStyle = '#d6a24a'; g.lineWidth = 1; g.strokeRect(dx + dw + 4 * s, h - dh - 4 * s, 14 * s, 10 * s); }
    }
    if (!lit || side === 'e') { g.fillStyle = side === 'e' ? 'rgba(30,20,40,0.34)' : 'rgba(0,0,0,0)'; g.fillRect(0, 0, len, h); }
    const ao = g.createLinearGradient(0, h * 0.6, 0, h); ao.addColorStop(0, 'rgba(0,0,0,0)'); ao.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = ao; g.fillRect(0, 0, len, h);
  }
  function roofFacet(g, pts, lit, kind, R, snow) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const top = pts.reduce((a, p) => (p[1] < a[1] ? p : a)), bot = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
    let dx = bot[0] - top[0], dy = bot[1] - top[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    g.save(); pathPoly(g, pts); g.clip();
    const box = [minX - 4, minY - 4, maxX - minX + 8, maxY - minY + 8];
    if (kind === 'thatch') {
      g.fillStyle = '#b8924e'; g.fillRect(...box); g.lineWidth = 1.2;
      batched(g, ['#d2ad62', '#a8823e', '#8a6a32', '#e2c27a', '#bf9a52'], Math.round(((maxX - minX) * (maxY - minY)) / 6), (pp) => { const x = minX + Math.random() * (maxX - minX), y = minY + Math.random() * (maxY - minY), L = (5 + Math.random() * 7) * BK; pp.moveTo(x, y); pp.lineTo(x + dx * L, y + dy * L); });
    } else {
      const base = kind === 'red' ? '#8a3a2a' : kind === 'shingle' ? '#6a4a2e' : '#3e4450';
      const tiles = kind === 'red' ? ['#9a4430', '#8a3a2a', '#a8503a', '#7a3224'] : kind === 'shingle' ? ['#7a5634', '#6a4a2e', '#866040', '#5e4028'] : ['#4c5460', '#58606c', '#444a56', '#5e6672'];
      g.fillStyle = base; g.fillRect(...box);
      const [a, b] = [pts[0], pts[1]], el = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / el, uy = (b[1] - a[1]) / el, tw = 8 * BK, th = 4 * BK;
      for (let row = 0; row < 60; row++) { const off = row * th; for (let k = (row % 2) * (tw / 2) - tw; k < el + tw; k += tw) { const x = a[0] + ux * k, y = a[1] + uy * k - off; g.fillStyle = pick(R, tiles); g.beginPath(); g.moveTo(x, y); g.lineTo(x + ux * (tw - 1), y + uy * (tw - 1)); g.lineTo(x + ux * (tw - 1), y + uy * (tw - 1) - th + 0.5); g.lineTo(x, y - th + 0.5); g.closePath(); g.fill(); } }
    }
    g.fillStyle = `rgba(30,18,6,${(1 - lit) * 0.6})`; g.fillRect(...box);
    const lg = g.createLinearGradient(top[0], top[1], bot[0], bot[1]); lg.addColorStop(0, 'rgba(255,236,190,0.2)'); lg.addColorStop(1, 'rgba(40,22,6,0.28)'); g.fillStyle = lg; g.fillRect(...box);
    if (snow) { g.fillStyle = 'rgba(245,248,250,0.78)'; g.fillRect(...box); }
    g.restore();
    weather(g, pts, 0.45);
  }

  // --- trees and shrubs -------------------------------------------------------------
  const CANOPY = {
    spring: [[92, 48, 46], [98, 46, 30], [108, 42, 18]], summer: [[86, 46, 42], [96, 42, 26], [110, 40, 14]],
    autumn: [[34, 70, 52], [24, 64, 36], [14, 58, 22]], winter: null,
  };
  function treeSprite(kind, season, variant) {
    const R = rng(variant * 977 + kind.length * 31 + 7);
    const pine = kind === 'pine' || kind === 'fir', size = { big: 1.25, oak: 1, apple: 0.75, birch: 0.85, poplar: 0.9, willow: 1, sapling: 0.45, pine: 1, fir: 0.9 }[kind] || 1;
    const s = size * BK * 0.55;
    if (pine) {
      const Wd = Math.round(120 * s), Ht = Math.round(250 * s), c = mk(Wd, Ht), g = c.getContext('2d'), bx = Wd / 2, by = Ht - 10 * s;
      g.fillStyle = '#4a3524'; g.fillRect(bx - 5 * s, by - 40 * s, 10 * s, 40 * s);
      for (let k = 0; k < 7; k++) {
        const t = k / 6, y = by - 30 * s - t * 190 * s, w = (52 - t * 40) * s, h = (56 - t * 18) * s;
        const gr = g.createLinearGradient(bx - w, 0, bx + w, 0); gr.addColorStop(0, '#5f8f44'); gr.addColorStop(0.45, '#2f5a2a'); gr.addColorStop(1, '#14301a');
        g.fillStyle = gr; g.beginPath(); g.moveTo(bx, y - h); for (let x = -w; x <= w; x += 6 * s) g.lineTo(bx + x, y + (R() * 7 - 2) * s + Math.abs(x) * 0.05); g.closePath(); g.fill();
        if (season === 'winter') { g.fillStyle = 'rgba(240,246,250,0.85)'; g.beginPath(); g.moveTo(bx, y - h); g.lineTo(bx - w * 0.6, y - h * 0.25); g.quadraticCurveTo(bx, y - h * 0.4, bx + w * 0.3, y - h * 0.35); g.closePath(); g.fill(); }
      }
      return { c, ax: bx, ay: by, h: Ht };
    }
    const tall = kind === 'poplar', Wd = Math.round((tall ? 120 : 190) * s), Ht = Math.round((tall ? 280 : 230) * s), c = mk(Wd, Ht), g = c.getContext('2d');
    const bx = Wd / 2, by = Ht - 12 * s;
    const bark = kind === 'birch' ? ['#e8e2d4', '#c8c0b0', '#8a8278'] : ['#7a5d40', '#5a4230', '#3a2a1c'];
    const tg = g.createLinearGradient(bx - 12 * s, 0, bx + 12 * s, 0); tg.addColorStop(0, bark[0]); tg.addColorStop(0.5, bark[1]); tg.addColorStop(1, bark[2]);
    g.fillStyle = tg; g.beginPath(); g.moveTo(bx - 14 * s, by); g.quadraticCurveTo(bx - 7 * s, by - 10 * s, bx - 6 * s, by - 70 * s); g.lineTo(bx + 6 * s, by - 70 * s); g.quadraticCurveTo(bx + 7 * s, by - 10 * s, bx + 16 * s, by); g.closePath(); g.fill();
    if (kind === 'birch') { g.fillStyle = '#2a2420'; for (let k = 0; k < 8; k++) g.fillRect(bx - 5 * s + R() * 8 * s, by - R() * 60 * s, 3 * s, 1.2 * s); }
    g.strokeStyle = bark[1]; g.lineWidth = 4 * s; g.lineCap = 'round';
    const branches = season === 'winter' ? [-1.1, -0.6, -0.2, 0.3, 0.7, 1.1] : [-0.9, -0.3, 0.5, 1.0];
    for (const a of branches) { g.beginPath(); g.moveTo(bx, by - 55 * s); g.quadraticCurveTo(bx + Math.sin(a) * 30 * s, by - 80 * s, bx + Math.sin(a) * 55 * s, by - 60 * s - Math.cos(a) * 70 * s); g.stroke(); }
    const ccx = bx, ccy = Ht * (tall ? 0.36 : 0.37), rx = Wd * (tall ? 0.3 : 0.4), ry = Ht * (tall ? 0.34 : 0.28);
    if (season === 'winter') {
      g.lineWidth = 1.6 * s; g.strokeStyle = bark[1];
      for (let n = 0; n < 24; n++) { const a = R() * Math.PI * 2, d = 0.4 + R() * 0.6; g.beginPath(); g.moveTo(ccx + Math.cos(a) * d * rx * 0.4, ccy + Math.sin(a) * d * ry * 0.4); g.lineTo(ccx + Math.cos(a) * d * rx, ccy + Math.sin(a) * d * ry); g.stroke(); }
      g.fillStyle = 'rgba(240,246,250,0.7)'; for (let n = 0; n < 40; n++) { g.beginPath(); g.ellipse(ccx + (R() - 0.5) * rx * 1.6, ccy + (R() - 0.7) * ry, 3 * s, 1.4 * s, 0, 0, Math.PI * 2); g.fill(); }
      return { c, ax: bx, ay: by, h: Ht };
    }
    let pal = CANOPY[season];
    if (kind === 'willow') pal = pal.map(([h, sat, l]) => [h + 10, sat - 8, l + 4]);
    if (kind === 'birch' && season !== 'autumn') pal = pal.map(([h, sat, l]) => [h - 6, sat + 4, l + 6]);
    const blobs = [];
    for (let n = 0; n < 70; n++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()); blobs.push([ccx + Math.cos(a) * d * rx, ccy + Math.sin(a) * d * ry * 0.95 - (1 - d) * 10 * s, (15 + R() * 15) * s * (tall ? 0.75 : 1)]); }
    blobs.sort((p, q) => p[1] - q[1]);
    for (const [x, y, r] of blobs) {
      const L = clamp01(0.5 - ((x - ccx) / rx) * 0.3 - ((y - ccy) / ry) * 0.35);
      const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.1, x, y, r);
      gr.addColorStop(0, `hsl(${pal[0][0] + L * 6},${pal[0][1]}%,${pal[0][2] - 10 + L * 18}%)`); gr.addColorStop(0.7, `hsl(${pal[1][0]},${pal[1][1]}%,${pal[1][2] - 4 + L * 10}%)`); gr.addColorStop(1, `hsl(${pal[2][0]},${pal[2][1]}%,${pal[2][2] + L * 6}%)`);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    if (kind === 'willow') { g.strokeStyle = `hsla(${pal[1][0]},${pal[1][1]}%,${pal[1][2] + 6}%,0.7)`; g.lineWidth = 1.2 * s; for (let n = 0; n < 40; n++) { const x = ccx + (R() - 0.5) * rx * 1.8, y = ccy + R() * ry * 0.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 2 * s, y + 25 * s, x - 2 * s, y + (35 + R() * 25) * s); g.stroke(); } }
    const dabs = [new Path2D(), new Path2D()];
    for (let n = 0; n < 500 * size; n++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()), x = ccx + Math.cos(a) * d * rx, y = ccy + Math.sin(a) * d * ry, lit = -((x - ccx) / rx) - ((y - ccy) / ry); const k = lit > 0.3 ? 0 : 1; dabs[k].moveTo(x + 2 * s, y); dabs[k].ellipse(x, y, 2 * s, 1.4 * s, R() * 3, 0, Math.PI * 2); }
    g.fillStyle = season === 'autumn' ? 'rgba(255,210,120,0.45)' : 'rgba(200,225,120,0.45)'; g.fill(dabs[0]); g.fillStyle = 'rgba(10,30,8,0.32)'; g.fill(dabs[1]);
    if (kind === 'apple' && season !== 'spring') for (let n = 0; n < 22; n++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 0.9; g.fillStyle = '#c4302a'; g.beginPath(); g.arc(ccx + Math.cos(a) * d * rx, ccy + Math.sin(a) * d * ry, 3 * s, 0, Math.PI * 2); g.fill(); }
    if (kind === 'apple' && season === 'spring') for (let n = 0; n < 60; n++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()); g.fillStyle = R() < 0.5 ? '#f8e0e8' : '#ffffff'; g.beginPath(); g.arc(ccx + Math.cos(a) * d * rx, ccy + Math.sin(a) * d * ry, 2 * s, 0, Math.PI * 2); g.fill(); }
    return { c, ax: bx, ay: by, h: Ht };
  }
  function bushSprite(variant, season) {
    const R = rng(variant * 131 + 5), s = BK * 0.6, Wd = Math.round(70 * s), Ht = Math.round(54 * s), c = mk(Wd, Ht), g = c.getContext('2d');
    const hue = season === 'autumn' ? 40 : 92, sat = season === 'winter' ? 10 : 44;
    for (let n = 0; n < 22; n++) { const x = Wd / 2 + (R() - 0.5) * Wd * 0.6, y = Ht * 0.55 + (R() - 0.5) * Ht * 0.4, r = (8 + R() * 8) * s, L = 0.5 - (x - Wd / 2) / Wd - (y - Ht / 2) / Ht; const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, 1, x, y, r); gr.addColorStop(0, `hsl(${hue},${sat}%,${36 + L * 20}%)`); gr.addColorStop(1, `hsl(${hue + 14},${sat}%,${14 + L * 8}%)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    if (season === 'winter') { g.fillStyle = 'rgba(240,246,250,0.8)'; g.beginPath(); g.ellipse(Wd / 2 - 3 * s, Ht * 0.35, Wd * 0.3, Ht * 0.14, 0, 0, Math.PI * 2); g.fill(); }
    else if (variant % 3 === 1) for (let n = 0; n < 12; n++) { g.fillStyle = season === 'autumn' ? '#c4302a' : '#e44a6a'; g.beginPath(); g.arc(Wd / 2 + (R() - 0.5) * Wd * 0.6, Ht * 0.5 + (R() - 0.5) * Ht * 0.4, 1.6 * s, 0, Math.PI * 2); g.fill(); }
    return { c, ax: Wd / 2, ay: Ht - 6 * s, h: Ht };
  }

  // --- the home mounds: rounded hills, each door in a cutting ----------------------------
  function smialDoor(g, u, Hf, r, col, R) {
    const cy = Hf - r * 0.92;
    g.strokeStyle = '#d2c6aa'; g.lineWidth = r * 0.33; g.beginPath(); g.arc(u, cy, r + r * 0.17, Math.PI * 0.98, Math.PI * 2.02); g.lineTo(u + r * 1.17, Hf); g.moveTo(u - r * 1.17, Hf); g.lineTo(u - r * 1.17, cy); g.stroke();
    g.strokeStyle = 'rgba(60,46,30,0.55)'; g.lineWidth = 1; for (let k = 0; k <= 10; k++) { const a = Math.PI + (k / 10) * Math.PI; g.beginPath(); g.moveTo(u + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(u + Math.cos(a) * r * 1.33, cy + Math.sin(a) * r * 1.33); g.stroke(); }
    g.save(); g.beginPath(); g.arc(u, cy, r, 0, Math.PI * 2); g.rect(u - r, cy, r * 2, Hf - cy); g.clip();
    const dg = g.createLinearGradient(u - r, 0, u + r, 0); dg.addColorStop(0, tint(col, 0.18)); dg.addColorStop(1, tint(col, -0.35)); g.fillStyle = dg; g.fillRect(u - r, cy - r, r * 2, Hf - cy + r);
    g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 1; for (let x = u - r + r / 4; x < u + r; x += r / 4) { g.beginPath(); g.moveTo(x, cy - r); g.lineTo(x, Hf); g.stroke(); }
    g.restore();
    const kg = g.createRadialGradient(u - 1, cy - 1, 0.5, u, cy, r * 0.13); kg.addColorStop(0, '#fff2b0'); kg.addColorStop(1, '#a87a1e'); g.fillStyle = kg; g.beginPath(); g.arc(u, cy, r * 0.12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#a89c84'; g.beginPath(); g.roundRect(u - r * 0.9, Hf - 2, r * 1.8, r * 0.22, 2); g.fill();
  }
  function facade(g, len, Hf, D, lit) {
    const R = rng(D.seed), r = D.r, y0 = Hf * 0.5, cyc = -Hf * 0.32;
    const top = (t) => (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cyc + t * t * y0;
    g.save(); g.beginPath(); g.moveTo(0, Hf); g.lineTo(0, y0); g.quadraticCurveTo(len / 2, cyc, len, y0); g.lineTo(len, Hf); g.closePath(); g.clip();
    g.fillStyle = '#4e463c'; g.fillRect(0, -Hf, len, Hf * 2);
    const bh = 8 * BK;
    for (let y = Hf, row = 0; y > -bh * 2; y -= bh, row++) for (let x = -(row % 2) * 7 * BK; x < len; x += (11 + R() * 6) * BK) { const w = (10 + R() * 6) * BK; g.fillStyle = pick(R, ['#a89c84', '#9a8e76', '#b6aa92', '#8c806a', '#a2967e']); g.beginPath(); g.roundRect(x + 0.7, y - bh + 0.6, w - 1.4, bh - 1, 3); g.fill(); g.fillStyle = 'rgba(255,248,228,0.22)'; g.fillRect(x + 2, y - bh + 1, w - 4, 1.4); }
    const sg = g.createLinearGradient(0, 0, len, 0); sg.addColorStop(0, 'rgba(20,14,8,0.5)'); sg.addColorStop(0.18, 'rgba(0,0,0,0)'); sg.addColorStop(0.82, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(20,14,8,0.5)'); g.fillStyle = sg; g.fillRect(0, -Hf, len, Hf * 2);
    g.restore();
    const du = D.wins === 1 ? r * 1.8 + 6 : len / 2, off = r * 2.5 + 8 * BK;
    smialDoor(g, du, Hf, r, D.col, R);
    if (D.wins >= 2) { roundWindow(g, du - off, Hf - r * 1.25, r * 0.36, lit); roundWindow(g, du + off, Hf - r * 1.25, r * 0.36, lit); }
    else if (D.wins === 1) roundWindow(g, du + off, Hf - r * 1.25, r * 0.32, lit);
    if (lit) { const lg = g.createRadialGradient(du + r * 1.5, Hf - r * 1.6, 1, du + r * 1.5, Hf - r * 1.6, r * 1.4); lg.addColorStop(0, 'rgba(255,214,120,0.55)'); lg.addColorStop(1, 'rgba(255,214,120,0)'); g.fillStyle = lg; g.fillRect(du, Hf - r * 3.2, r * 3, r * 3); }
    g.fillStyle = '#2a2018'; g.fillRect(du + r * 1.35, Hf - r * 1.9, r * 0.3, r * 0.08); g.fillStyle = lit ? '#ffd77a' : '#b8a070'; g.fillRect(du + r * 1.42, Hf - r * 1.8, r * 0.22, r * 0.3);
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(20,14,8,0.3)'; g.lineWidth = 6 * BK; g.beginPath(); g.moveTo(-2, y0 + 5 * BK); g.quadraticCurveTo(len / 2, cyc + 5 * BK, len + 2, y0 + 5 * BK); g.stroke();
    const tg = g.createLinearGradient(0, cyc - 6, 0, y0 + 6); tg.addColorStop(0, D.snow ? '#eef2f4' : '#8ab04e'); tg.addColorStop(1, D.snow ? '#c8d2d8' : '#4e7a2c');
    g.strokeStyle = tg; g.lineWidth = 11 * BK; g.beginPath(); g.moveTo(-4, y0 + 1); g.quadraticCurveTo(len / 2, cyc - 1, len + 4, y0 + 1); g.stroke();
    g.lineWidth = 1.1 * BK;
    batched(g, D.snow ? ['#e8eef0', '#cfd8dc'] : ['#6f9a3e', '#4f7c2c', '#8aa84a', '#3e6a24'], Math.round(len * 1.6), (pp) => { const t = Math.random(), x = t * len, y = top(t) + 3 * BK, L = (3 + Math.random() * 8) * BK; pp.moveTo(x, y); pp.quadraticCurveTo(x + 1, y + L * 0.5, x + (Math.random() - 0.5) * 4, y + L); });
    g.restore();
  }
  function hillBake(h, lit, season) {
    const sh = homeShape(h.def, h.id);
    const Hh = Math.round(14 + sh.hry * 15), snow = season === 'winter';
    const x0 = sh.hcx - sh.hrx * 1.3, x1 = sh.hcx + sh.hrx * 1.3, y0 = sh.hcy - sh.hry * 1.3, y1 = sh.hcy + sh.hry * 1.3;
    const dx = (h.doorX + 0.5) / 16, dy0 = h.doorY / 16;
    let fy = dy0; while (fy > sh.hcy && sh.u(dx, fy) > 0.8) fy -= 0.05;
    const r = (h.def.grand ? 19 : 15) * BK, wins = h.v && h.v.nwin >= 2 ? 2 : 1;
    const lenU = (r / BK) * 3.6 + wins * ((r / BK) * 1.6 + 16), w = lenU / 35.78;
    const D = { r, wins, col: h.doorColor || '#2f6a3a', seed: h.id * 31 + 7, snow };
    const built = !!h.built;
    const ht = (x, y) => {
      let u = sh.u(x, y);
      u += 0.03 * Math.sin(x * 2.1 + y * 0.7) + 0.02 * Math.sin(y * 3.3 - x * 1.4);
      if (u >= 1) return 0;
      const e = Math.min(1, (1 - u) / 0.46), s2 = e * e * (3 - 2 * e);
      let z = Hh * (s2 * 0.84 + 0.16 * (1 - u * u));
      if (built) { const du = x - dx, dv = y - fy, fu = clamp01((w / 2 + 0.2 - Math.abs(du)) / 0.2), fv = clamp01((dv + 0.02) / 0.1); z *= 1 - fu * fv; }
      return z;
    };
    const O = { x: (x0 - y1) * 32 - 10, y: (x0 + y0) * 16 - Hh - 60 };
    const cw = ((x1 - y0) * 32 + 10 - O.x) * BK, ch = ((x1 + y1) * 16 + 24 - O.y) * BK;
    const c = mk(cw, ch), g = c.getContext('2d');
    const P = (x, y, z) => [((x - y) * 32 - O.x) * BK, ((x + y) * 16 - z - O.y) * BK];
    // soft shadow to the east
    { const [sx, sy] = P(sh.hcx + 0.9, sh.hcy + 0.6, 0), sg = g.createRadialGradient(sx, sy, 2, sx, sy, sh.hrx * 34 * BK); sg.addColorStop(0, 'rgba(20,24,8,0.32)'); sg.addColorStop(1, 'rgba(20,24,8,0)'); g.fillStyle = sg; g.save(); g.translate(sx, sy); g.scale(1, 0.5); g.translate(-sx, -sy); g.beginPath(); g.arc(sx, sy, sh.hrx * 34 * BK, 0, Math.PI * 2); g.fill(); g.restore(); }
    const items = [], step = 0.11;
    const base = hexRgb(snow ? '#e8eef2' : season === 'autumn' ? '#8a9a46' : season === 'spring' ? '#74aa48' : '#6f9a3f');
    for (let x = x0; x < x1; x += step) for (let y = y0; y < y1; y += step) {
      const h00 = ht(x, y), h10 = ht(x + step, y), h11 = ht(x + step, y + step), h01 = ht(x, y + step);
      if (h00 + h10 + h11 + h01 < 0.4) continue;
      const gx = (h10 + h11 - h00 - h01) / (2 * step * 32), gy = (h01 + h11 - h00 - h10) / (2 * step * 32), nl = Math.hypot(gx, gy, 1);
      const lit2 = Math.max(0, (gx * 0.62 + gy * 0.2 + 0.76) / nl), k = 0.5 + lit2 * 0.62, n = 0.92 + 0.16 * (Math.sin(x * 17.3 + y * 7.1) * 0.5 + Math.sin(x * 5.7 - y * 11.9) * 0.5 + 1) / 2;
      const steep = snow && Math.hypot(gx, gy) > 1.1, bc = steep ? hexRgb('#6a7a5a') : base;
      const col = `rgb(${Math.min(255, bc[0] * k * n) | 0},${Math.min(255, bc[1] * k * n) | 0},${Math.min(255, bc[2] * k * n) | 0})`;
      const pts = [P(x, y, h00), P(x + step, y, h10), P(x + step, y + step, h11), P(x, y + step, h01)];
      items.push([x + y + step, () => { g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 1; pathPoly(g, pts); g.fill(); g.stroke(); }]);
    }
    const Rh = rng(h.id * 13 + 1);
    if (!snow) for (let i = 0; i < 160; i++) {
      const a = Rh() * Math.PI * 2, d = Math.sqrt(Rh()) * 0.9, x = sh.hcx + Math.cos(a) * d * sh.hrx, y = sh.hcy + Math.sin(a) * d * sh.hry, z = ht(x, y); if (z < 3) continue;
      const [px, py] = P(x, y, z), flower = Rh() < 0.35, col = flower ? pick(Rh, ['#f4f1e0', '#f2d75a', '#e48aa8', '#ffffff']) : pick(Rh, ['#4f7c2c', '#7aa44a', '#3e6a24']);
      items.push([x + y + 0.01, () => { if (flower) { g.fillStyle = col; g.beginPath(); g.arc(px, py - 1, 1.3 * BK, 0, Math.PI * 2); g.fill(); } else { g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); for (let k = -1; k <= 1; k++) { g.moveTo(px + k * 1.5 * BK, py); g.lineTo(px + k * 2.2 * BK, py - (3 + Rh() * 2) * BK); } g.stroke(); } }]);
    }
    const chims = [];
    if (built) {
      const hf = (r / BK) * 2.9 + 10;
      items.push([dx + fy + 0.02, () => {
        let a = P(dx - w / 2, fy, 0), b = P(dx + w / 2, fy, 0);
        const len = wallFrame(g, a, b, hf * BK); facade(g, len, hf * BK, D, lit); g.setTransform(1, 0, 0, 1, 0, 0);
      }]);
      for (const [ox, oy] of h.chimney2 ? [[0.9, -1.1], [-1.2, -1.4]] : [[0.9, -1.1]]) {
        const cx = dx + ox, cy = fy + oy, z = ht(cx, cy) - 2;
        items.push([cx + cy + 0.08, () => {
          const [x, y] = P(cx, cy, z), s = BK * 0.75;
          g.fillStyle = '#8e4630'; g.beginPath(); g.moveTo(x - 9 * s, y); g.lineTo(x, y + 4 * s); g.lineTo(x, y - 30 * s); g.lineTo(x - 9 * s, y - 34 * s); g.closePath(); g.fill();
          g.fillStyle = '#5e2c1e'; g.beginPath(); g.moveTo(x, y + 4 * s); g.lineTo(x + 9 * s, y); g.lineTo(x + 9 * s, y - 34 * s); g.lineTo(x, y - 30 * s); g.closePath(); g.fill();
          g.fillStyle = snow ? '#f0f4f6' : '#b0a08a'; g.beginPath(); g.moveTo(x - 11 * s, y - 34 * s); g.lineTo(x, y - 29 * s); g.lineTo(x + 11 * s, y - 34 * s); g.lineTo(x, y - 39 * s); g.closePath(); g.fill();
          g.fillStyle = '#1a120c'; g.beginPath(); g.ellipse(x, y - 34.5 * s, 5 * s, 2.4 * s, 0, 0, Math.PI * 2); g.fill();
        }]);
        chims.push([(cx - cy) * 32, (cx + cy) * 16 - z - 30]);
      }
    }
    items.sort((a, b) => a[0] - b[0]).forEach(([, fn]) => fn());
    return { c, ox: O.x, oy: O.y, depth: (sh.hcx + sh.hcy) * 16, chims };
  }

  // --- buildings ---------------------------------------------------------------------
  const STYLE = {
    inn: { wall: 'timber', roof: 'thatch', storeys: 2, sign: true }, inn2: { wall: 'timber', roof: 'thatch', storeys: 2, sign: true },
    bakery: { wall: 'stone', roof: 'slate' }, bakery2: { wall: 'stone', roof: 'slate' }, brewhouse: { wall: 'stone', roof: 'thatch', copper: true },
    workshop: { wall: 'timber', roof: 'shingle' }, herbalist: { wall: 'timber', roof: 'thatch' }, store: { wall: 'stone', roof: 'slate', storeys: 2 },
    storehouse: { wall: 'stone', roof: 'slate' }, barn: { wall: 'plank', roof: 'red' }, smokehouse: { wall: 'stone', roof: 'slate' },
    mill: { wall: 'stone', roof: 'thatch' }, mill2: { wall: 'stone', roof: 'thatch' },
    relay: { wall: 'stone', roof: 'slate', neon: true }, glowworm: { wall: 'timber', roof: 'slate', neon: true }, array: { wall: 'stone', roof: 'slate', neon: true }, dynamo: { wall: 'stone', roof: 'slate', neon: true }, turbine: { wall: 'stone', roof: 'slate', neon: true },
  };
  function buildingBake(b, lit, season) {
    const st = STYLE[b.key] || (b.isInn ? STYLE.inn : { wall: b.key.length % 2 ? 'timber' : 'stone', roof: 'thatch' });
    const X0 = b.x0, X1 = b.x1 + 1, Y1 = b.y1 + 1, Y0 = Y1 - Math.max(1.6, Math.min(3, b.y1 - b.y0 + 1));
    const snow = season === 'winter', windmill = b.key === 'windmill';
    const hw = windmill ? 0 : st.storeys > 1 ? 58 : 38, rh = windmill ? 0 : (Y1 - Y0) * 13 + 6;
    const O = { x: (X0 - Y1) * 32 - 30, y: (X0 + Y0) * 16 - hw - rh - (windmill ? 190 : 60) };
    const cw = ((X1 - Y0) * 32 + 30 - O.x) * BK, ch = ((X1 + Y1) * 16 + 28 - O.y) * BK;
    const c = mk(cw, ch), g = c.getContext('2d'), R = rng(b.key.length * 97 + b.x0 * 7);
    const P = (x, y, z) => [((x - y) * 32 - O.x) * BK, ((x + y) * 16 - z - O.y) * BK];
    // soft shadow to the east
    { const base = [P(X0, Y0, 0), P(X1, Y0, 0), P(X1, Y1, 0), P(X0, Y1, 0)].map(([x, y]) => [x + (hw + rh) * 0.5 * BK, y + (hw + rh) * 0.18 * BK]); g.save(); g.filter = 'blur(6px)'; g.fillStyle = 'rgba(20,24,8,0.3)'; pathPoly(g, [P(X0, Y1, 0), P(X1, Y1, 0), P(X1, Y0, 0), ...base.slice(1, 3).reverse(), base[3]]); g.fill(); g.restore(); }
    const chims = [];
    if (windmill) {
      const [x, y] = P((X0 + X1) / 2, (Y0 + Y1) / 2, 0), Ht = 120 * BK, rb = 24 * BK, rt = 16 * BK;
      const tg = g.createLinearGradient(x - rb, 0, x + rb, 0); tg.addColorStop(0, '#f2ead8'); tg.addColorStop(0.5, '#d6ccb6'); tg.addColorStop(1, '#8e8470');
      g.fillStyle = tg; g.beginPath(); g.moveTo(x - rb, y); g.lineTo(x - rt, y - Ht); g.lineTo(x + rt, y - Ht); g.lineTo(x + rb, y); g.quadraticCurveTo(x, y + 7 * BK, x - rb, y); g.fill();
      g.strokeStyle = 'rgba(80,70,56,0.35)'; g.lineWidth = 1; for (let k = 1; k < 12; k++) { const yy = y - k * (Ht / 12), w = lerp(rb, rt, k / 12); g.beginPath(); g.moveTo(x - w, yy); g.quadraticCurveTo(x, yy + 4 * BK, x + w, yy); g.stroke(); }
      g.fillStyle = '#3a2614'; g.beginPath(); g.roundRect(x - 7 * BK, y - 22 * BK, 14 * BK, 21 * BK, [7 * BK, 7 * BK, 0, 0]); g.fill();
      for (const wy of [0.45, 0.75]) windowPane(g, x - 3 * BK, y - Ht * wy - 5 * BK, 6 * BK, 9 * BK, lit);
      const cg = g.createRadialGradient(x - 9 * BK, y - Ht - 12 * BK, 2, x, y - Ht - 4 * BK, 28 * BK); cg.addColorStop(0, snow ? '#f4f6f8' : '#d8b46c'); cg.addColorStop(1, snow ? '#b8c4cc' : '#6a4a22');
      g.fillStyle = cg; g.beginPath(); g.ellipse(x, y - Ht, 21 * BK, 8 * BK, 0, 0, Math.PI); g.lineTo(x - 21 * BK, y - Ht); g.quadraticCurveTo(x - 18 * BK, y - Ht - 30 * BK, x, y - Ht - 32 * BK); g.quadraticCurveTo(x + 18 * BK, y - Ht - 30 * BK, x + 21 * BK, y - Ht); g.fill();
      return { c, ox: O.x, oy: O.y, depth: ((X0 + X1) / 2 + Y1) * 16, chims, hub: [((X0 + X1) / 2 - (Y0 + Y1) / 2) * 32 + 9, ((X0 + X1) / 2 + (Y0 + Y1) / 2) * 16 - 128] };
    }
    const opts = { seed: b.x0 * 13 + b.y0, storeys: st.storeys || 1, door: clamp01((b.doorX / 16 - X0) / (X1 - X0)), sign: st.sign, doorCol: st.wall === 'stone' ? '#6a4222' : '#7a4a26' };
    const sA = P(X0, Y1, 0), sB = P(X1, Y1, 0), eA = P(X1, Y1, 0), eB = P(X1, Y0, 0);
    let len = wallFrame(g, sA, sB, hw * BK); wallFace(st.wall, g, len, hw * BK, lit, 's', opts); g.setTransform(1, 0, 0, 1, 0, 0);
    weather(g, [[sA[0], sA[1] - hw * BK], [sB[0], sB[1] - hw * BK], sB, sA], 0.5);
    len = wallFrame(g, eA, eB, hw * BK); wallFace(st.wall, g, len, hw * BK, lit, 'e', opts); g.setTransform(1, 0, 0, 1, 0, 0);
    weather(g, [[eA[0], eA[1] - hw * BK], [eB[0], eB[1] - hw * BK], eB, eA], 0.5);
    if (st.neon) { g.strokeStyle = 'rgba(255,58,168,0.85)'; g.lineWidth = 2 * BK; g.beginPath(); g.moveTo(sA[0], sA[1] - hw * BK + 3 * BK); g.lineTo(sB[0], sB[1] - hw * BK + 3 * BK); g.lineTo(eB[0], eB[1] - hw * BK + 3 * BK); g.stroke(); }
    // roof: hips when there's room, overhanging the walls a little
    const o = 0.18, ym = (Y0 + Y1) / 2, hip = X1 - X0 > (Y1 - Y0) * 1.1, inset = hip ? (Y1 - Y0) / 2 : -o;
    const E00 = [X0 - o, Y0 - o], E10 = [X1 + o, Y0 - o], E11 = [X1 + o, Y1 + o], E01 = [X0 - o, Y1 + o], R0 = [X0 + inset, ym], R1 = [X1 - inset, ym];
    const S = (p, z) => P(p[0], p[1], z), zE = hw - 3, zR = hw + rh;
    roofFacet(g, [S(E00, zE), S(E10, zE), S(R1, zR), S(R0, zR)], 0.25, st.roof, R, snow);
    if (hip) { roofFacet(g, [S(E01, zE), S(E00, zE), S(R0, zR)], 0.8, st.roof, R, snow); roofFacet(g, [S(E10, zE), S(E11, zE), S(R1, zR)], 0.3, st.roof, R, snow); }
    else { // a gable end at the east
      const p0 = P(X1, Y0, hw), p1 = P(X1, Y1, hw), p2 = P(X1, ym, hw + rh - 2);
      g.save(); pathPoly(g, [p0, p1, p2]); g.clip(); g.fillStyle = st.wall === 'stone' ? '#7e7462' : st.wall === 'plank' ? '#5e3a20' : '#c8bc9e'; g.fillRect(p1[0] - 300, p2[1] - 20, 600, 400); g.fillStyle = 'rgba(30,20,40,0.34)'; g.fillRect(p1[0] - 300, p2[1] - 20, 600, 400); g.restore();
    }
    roofFacet(g, [S(E01, zE), S(E11, zE), S(R1, zR), S(R0, zR)], 0.95, st.roof, R, snow);
    { const a = S(R0, zR), bb = S(R1, zR); g.strokeStyle = st.roof === 'thatch' ? '#6a4a22' : '#2a2e36'; g.lineWidth = 3 * BK; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(bb[0], bb[1]); g.stroke(); }
    const chimXs = (b.chimneys && b.chimneys.length ? b.chimneys.map((q) => q.x / 16) : st.copper ? [X0 + 0.8] : []).slice(0, 3);
    for (const cxT of chimXs) {
      const cyT = ym, [x, y] = P(Math.max(X0 + 0.4, Math.min(X1 - 0.4, cxT)), cyT, zR - 8), s = BK;
      if (st.copper) { const cg = g.createLinearGradient(x - 6 * s, 0, x + 6 * s, 0); cg.addColorStop(0, '#e2a46a'); cg.addColorStop(0.5, '#b86e3a'); cg.addColorStop(1, '#6a3a1a'); g.fillStyle = cg; g.fillRect(x - 6 * s, y - 30 * s, 12 * s, 36 * s); }
      else { g.fillStyle = '#8e4630'; g.fillRect(x - 5 * s, y - 20 * s, 10 * s, 26 * s); g.fillStyle = '#5e2c1e'; g.fillRect(x, y - 20 * s, 5 * s, 26 * s); g.fillStyle = snow ? '#f0f4f6' : '#b0a08a'; g.fillRect(x - 7 * s, y - 23 * s, 14 * s, 4 * s); }
      const px = Math.max(X0 + 0.4, Math.min(X1 - 0.4, cxT)); chims.push([(px - cyT) * 32, (px + cyT) * 16 - (zR - 8) - (st.copper ? 32 : 24)]);
    }
    return { c, ox: O.x, oy: O.y, depth: ((X0 + X1) / 2 + Y1) * 16 - 8, chims };
  }

  // --- sprite cache ---------------------------------------------------------------------
  const cache = new Map();
  function cached(key, make, limit = 400) {
    let e = cache.get(key);
    if (e) { cache.delete(key); cache.set(key, e); return e; }
    e = make(); cache.set(key, e);
    if (cache.size > limit) cache.delete(cache.keys().next().value);
    return e;
  }

  // --- folk ---------------------------------------------------------------------------
  function drawFolk(g, v, x, y, zm) {
    const pal = villagerPalette(v.genes, v.stage, v.look ? v.look() : {}), ex = expressed(v.genes);
    const stage = v.stage, baby = stage === 'baby';
    let s = (stage === 'child' ? 0.68 : stage === 'elder' ? 0.82 : 0.86) * zm;
    const face = v.facing === 'left' || v.facing === 'down' ? -1 : 1, back = v.facing === 'up' || v.facing === 'left';
    const walking = v.pose === 'walk' || (v.path && v.path.length), step = walking ? Math.sin((v.walkDist || 0) * 0.55) : 0;
    const sit = v.pose === 'sit', work = v.pose === 'work', dance = v.pose === 'dance';
    g.save(); g.translate(x, y);
    if (v.isTipsy && v.isTipsy()) g.rotate(Math.sin(tReal * 3 + v.id) * 0.08);
    g.fillStyle = 'rgba(20,18,8,0.3)'; g.beginPath(); g.ellipse(4 * s, 1 * s, 11 * s, 4 * s, 0, 0, Math.PI * 2); g.fill();
    if (Game.selected === v || Game.hovered === v) { const p = 1 + Math.sin(tReal * 3) * 0.04; g.strokeStyle = Game.selected === v ? '#ffd77a' : 'rgba(255,240,200,0.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 1 * s, 15 * s * p, 6 * s * p, 0, 0, Math.PI * 2); g.stroke(); }
    if (baby) {
      g.scale(s * face, s);
      g.fillStyle = pal.c; g.beginPath(); g.ellipse(0, -8, 7, 6, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = pal.s; g.beginPath(); g.arc(0, -15, 5, 0, Math.PI * 2); g.fill(); g.fillStyle = pal.h; g.beginPath(); g.arc(-1, -18, 3, 0, Math.PI * 2); g.fill();
      g.restore(); return { top: y - 22 * s, h: 22 * s };
    }
    const bob = dance ? -Math.abs(Math.sin(tReal * 8 + v.id)) * 3 : walking ? -Math.abs(step) : 0;
    g.translate(0, bob * s); g.scale(s * face, s);
    if (sit) g.translate(0, 7);
    const skin = pal.s, hair = pal.h, vest = pal.v, shirt = pal.c, legs = pal.t;
    if (!sit) { g.fillStyle = skin; g.beginPath(); g.ellipse(-4 + step * 2, -1, 4.5, 2.4, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(4 - step * 2, -1, 4.5, 2.4, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = tint(hair, -0.2); g.fillRect(-7 + step * 2, -3, 5, 1.2); g.fillRect(1 - step * 2, -3, 5, 1.2); }
    if (ex.garment) { g.fillStyle = vest; g.beginPath(); g.moveTo(-6.5, -14); g.lineTo(6.5, -14); g.lineTo(8.5, -2); g.lineTo(-8.5, -2); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.moveTo(1, -14); g.lineTo(6.5, -14); g.lineTo(8.5, -2); g.lineTo(2, -2); g.closePath(); g.fill(); }
    else { g.fillStyle = legs; g.beginPath(); g.roundRect(-5.5, -11, 11, 9, 2); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0.5, -11, 5, 9); }
    const tg = g.createLinearGradient(-8, 0, 8, 0); tg.addColorStop(0, shirt); tg.addColorStop(1, tint(shirt, -0.3));
    g.fillStyle = tg; g.beginPath(); g.roundRect(-7.5, -24, 15, 14, 4); g.fill();
    if (!back) { g.fillStyle = vest; g.beginPath(); g.moveTo(-7, -23); g.lineTo(-1.5, -23); g.lineTo(-2, -10); g.lineTo(-7, -11); g.closePath(); g.fill(); g.beginPath(); g.moveTo(7, -23); g.lineTo(1.5, -23); g.lineTo(2, -10); g.lineTo(7, -11); g.closePath(); g.fill(); g.fillStyle = '#e8c86a'; g.fillRect(-1.9, -20, 1.2, 1.2); g.fillRect(-2, -16, 1.2, 1.2); }
    else { g.fillStyle = vest; g.beginPath(); g.roundRect(-7, -23, 14, 12, 3); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(2, -23, 5, 12);
    const armSwing = work ? Math.sin(tReal * 7 + v.id) * 0.9 - 0.5 : dance ? -2.4 + Math.sin(tReal * 6) * 0.4 : 0.15 + step * 0.4;
    const arm = (sx, ang, front) => { g.save(); g.translate(sx, -22); g.rotate(ang); g.fillStyle = front ? shirt : tint(shirt, -0.3); g.beginPath(); g.roundRect(-2, 0, 4, 10, 2); g.fill(); g.fillStyle = skin; g.beginPath(); g.arc(0, 11, 2.2, 0, Math.PI * 2); g.fill(); g.restore(); };
    arm(-7, dance ? 2.4 - Math.sin(tReal * 6) * 0.4 : armSwing * (work ? 0.3 : 1), false); arm(7, -armSwing, true);
    if (stage === 'elder') { g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(10, -12); g.lineTo(11, 0); g.stroke(); }
    if (v.holding) { g.fillStyle = '#efe6d0'; g.beginPath(); g.ellipse(0, -16, 6, 4.5, 0.3, 0, Math.PI * 2); g.fill(); g.fillStyle = skin; g.beginPath(); g.arc(3, -18, 2.6, 0, Math.PI * 2); g.fill(); }
    const hg = g.createRadialGradient(-2.5, -31, 1, 0, -29, 7.5); hg.addColorStop(0, tint(skin, 0.12)); hg.addColorStop(1, tint(skin, -0.18));
    g.fillStyle = hg; g.beginPath(); g.arc(0, -29.5, 6.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = skin; g.beginPath(); g.moveTo(5.6, -31); g.lineTo(8.4, -34); g.lineTo(6.6, -28.5); g.closePath(); g.fill();
    if (!back) { g.fillStyle = 'rgba(220,90,80,0.35)'; g.beginPath(); g.arc(3.4, -27.6, 1.6, 0, Math.PI * 2); g.fill(); const shut = v.task && v.task.a && v.task.a.id === 'sleep'; g.fillStyle = '#2a1a10'; if (shut) g.fillRect(2.4, -30.2, 1.8, 0.6); else { g.beginPath(); g.arc(3.2, -30.2, 0.9, 0, Math.PI * 2); g.fill(); } }
    g.fillStyle = hair;
    const curls = back ? [[-5, -33, 3.2], [-2, -35.5, 3.3], [2, -35.5, 3.2], [5, -33.5, 2.8], [-6, -29.5, 2.8], [5.5, -29.5, 2.6], [0, -31, 4]] : [[-5, -33, 3], [-2, -35.5, 3.2], [2, -35.5, 3], [5, -33.5, 2.4], [-6, -29.5, 2.6], [-4.5, -26.5, 2]];
    for (const [hx, hy, hr] of curls) { g.beginPath(); g.arc(hx, hy, hr, 0, Math.PI * 2); g.fill(); }
    if (ex.style === 1 || (ex.sex === 'f' && ex.style !== 3)) { g.beginPath(); g.ellipse(-5, -24, 3, 6, 0.2, 0, Math.PI * 2); g.fill(); }
    if (ex.style === 2) { g.beginPath(); g.arc(-3, -37.5, 2.8, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(-3, -35.5, 1.6, 0, Math.PI * 2); g.fill();
    if (World.season === 'winter' && !back) { g.fillStyle = '#b8443a'; g.fillRect(-6, -24.5, 12, 3); }
    g.restore();
    const top = y + (bob - 38 + (sit ? 7 : 0)) * s;
    return { top, h: y - top };
  }

  // --- drawing old sprites upright --------------------------------------------------------
  function upright(g, img, fx, fy, ox, oy, k, flip) {
    if (!img) return;
    const lw = img.hd ? img.width / RS : img.width, lh = img.hd ? img.height / RS : img.height, src = img.hd ? img : hd(img);
    const [sx, sy] = w2s(fx, fy);
    if (flip) { g.save(); g.translate(sx + (lw - ox) * k, sy - oy * k); g.scale(-1, 1); g.drawImage(src, 0, 0, lw * k, lh * k); g.restore(); }
    else g.drawImage(src, sx - ox * k, sy - oy * k, lw * k, lh * k);
  }
  // runs an old world-space drawing upright around one world point
  function billboard(g, wx, wy, fn, k) {
    const [sx, sy] = w2s(wx, wy);
    g.save(); g.setTransform(k * dpr, 0, 0, k * dpr, (sx - wx * k) * dpr, (sy - wy * k) * dpr); fn(); g.restore();
  }
  function groundTransform(g) { const zm = Iso.zoom, e = W() / 2 - (Iso.cx - Iso.cy) * 2 * zm, f = H() / 2 - (Iso.cx + Iso.cy) * zm; g.setTransform(2 * zm * dpr, zm * dpr, -2 * zm * dpr, zm * dpr, e * dpr, f * dpr); }

  // --- the frame ------------------------------------------------------------------------
  const hits = [];
  function drawBaked(g, spr, x, y) { const zm = Iso.zoom, [sx, sy] = w2s(x, y); g.drawImage(spr.c, sx - (spr.ax / BK) * zm, sy - (spr.ay / BK) * zm, (spr.c.width / BK) * zm, (spr.c.height / BK) * zm); }
  function drawSprite(g, spr, kind, ref) {
    const zm = Iso.zoom, [sx, sy] = [(spr.ox - (Iso.cx - Iso.cy) * 2) * zm + W() / 2, (spr.oy - (Iso.cx + Iso.cy)) * zm + H() / 2];
    const w = (spr.c.width / BK) * zm, h = (spr.c.height / BK) * zm;
    if (sx > W() + 20 || sy > H() + 20 || sx + w < -20 || sy + h < -20) return;
    g.drawImage(spr.c, sx, sy, w, h);
    if (kind) hits.push({ kind, ref, x0: sx + w * 0.12, y0: sy + h * 0.15, x1: sx + w * 0.88, y1: sy + h * 0.92 });
    for (const [ix, iy] of spr.chims || []) if ((ref.smoking || ref.lit) && !ref.neon) smoke(g, (ix - (Iso.cx - Iso.cy) * 2) * zm + W() / 2, (iy - (Iso.cx + Iso.cy)) * zm + H() / 2, zm, ix);
    if (spr.hub) sails(g, (spr.hub[0] - (Iso.cx - Iso.cy) * 2) * zm + W() / 2, (spr.hub[1] - (Iso.cx + Iso.cy)) * zm + H() / 2, zm);
  }
  function smoke(g, x, y, zm, seed) {
    for (let k = 0; k < 6; k++) { const ph = (tReal * 0.3 + k / 6 + (seed % 97) * 0.013) % 1, sx = x + (Math.sin(ph * 5 + seed) * 4 + ph * 24) * zm, sy = y - ph * 80 * zm, r = (3 + ph * 12) * zm; g.fillStyle = `rgba(225,222,215,${(1 - ph) * 0.38})`; g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.fill(); }
  }
  function sails(g, hx, hy, zm) {
    const a0 = World.windmill ? World.windmill.a : tReal * 0.5;
    for (let k = 0; k < 4; k++) {
      const a = a0 + (k * Math.PI) / 2, ex = Math.cos(a) * 0.82, ey = Math.sin(a), L = 88 * zm, side = [Math.cos(a + Math.PI / 2) * 0.82, Math.sin(a + Math.PI / 2)];
      const tip = [hx + ex * L, hy + ey * L], q = [[hx + ex * 16 * zm, hy + ey * 16 * zm], tip, [tip[0] + side[0] * 16 * zm, tip[1] + side[1] * 16 * zm], [hx + ex * 16 * zm + side[0] * 12 * zm, hy + ey * 16 * zm + side[1] * 12 * zm]];
      g.fillStyle = 'rgba(236,226,202,0.92)'; pathPoly(g, q); g.fill(); g.strokeStyle = 'rgba(90,62,38,0.8)'; g.lineWidth = 1; for (let s = 1; s < 6; s++) { const f = s / 6; g.beginPath(); g.moveTo(lerp(q[0][0], q[1][0], f), lerp(q[0][1], q[1][1], f)); g.lineTo(lerp(q[3][0], q[2][0], f), lerp(q[3][1], q[2][1], f)); g.stroke(); }
      g.strokeStyle = '#4a3220'; g.lineWidth = 3 * zm; g.beginPath(); g.moveTo(hx, hy); g.lineTo(tip[0], tip[1]); g.stroke();
    }
    g.fillStyle = '#3a2614'; g.beginPath(); g.arc(hx, hy, 5 * zm, 0, Math.PI * 2); g.fill();
  }
  function isoRender(dtReal, dtWall) {
    const g = vctx, zm = Iso.zoom, season = World.season || 'summer', k = KB * zm;
    groundUpToDate();
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.fillStyle = '#1d2a17'; g.fillRect(0, 0, view.width, view.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // the ground, then what lies flat on it
    groundTransform(g); g.drawImage(TEX, 0, 0, MAP_W * 16, MAP_H * 16);
    const cr = { x: Game.cam.x, y: Game.cam.y, w: Game.cam.w, h: Game.cam.h };
    for (const p of Village.projects) if (p.kind === 'field') drawFieldSite(g, World.lots[p.lot], p.prog);
    for (const s of World.riftScars) drawRiftScar(g, s);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (Iso.water) Iso.water(g, w2s, zm);

    const list = [];
    const seen = (x, y, m = 160) => { const [sx, sy] = w2s(x, y); return sx > -m * zm && sx < W() + m * zm && sy > -m * 0.6 * zm && sy < H() + m * 1.6 * zm; };
    const skip = new Set();
    for (const key in World.buildings) { const b = World.buildings[key]; if (b.static) skip.add(b.static); }
    for (const h of World.homes) if (h.siteStatic) skip.add(h.siteStatic);
    for (const h of World.homes) {
      const sh = homeShape(h.def, h.id);
      if (!seen(sh.hcx * 16, sh.hcy * 16, 260)) continue;
      const lit = !!(h.lit && Game.darkness > 0.2);
      const spr = cached(`h${h.id}:${h.built ? 1 : 0}:${lit ? 1 : 0}:${season}:${h.doorColor}`, () => hillBake(h, lit, season), 400);
      list.push([spr.depth, () => { drawSprite(g, spr, h.built ? 'home' : null, h); if (!h.built && Village.projects.some((p) => p.homeId === h.id)) billboard(g, h.doorX, h.doorY, () => drawSite(g, h), k); }]);
    }
    for (const key in World.buildings) {
      const b = World.buildings[key];
      if (!seen((b.x0 + b.x1) * 8, (b.y1 + 1) * 16, 240)) continue;
      const lit = !!(b.lit && Game.darkness > 0.2);
      const spr = cached(`b${key}:${lit ? 1 : 0}:${season}`, () => buildingBake(b, lit, season), 400);
      list.push([spr.depth, () => drawSprite(g, spr, 'building', b)]);
    }
    for (const s of World.statics) {
      if (s.hidden || skip.has(s) || !seen(s.x, s.y)) continue;
      const depth = s.x + s.y;
      if (s.gen && s.gen.type === 'tree') {
        const spr = cached(`t${s.gen.kind}:${season}:${(s.gen.seed || 0) % 4}`, () => treeSprite(s.gen.kind, season, (s.gen.seed || 0) % 4));
        list.push([depth, () => { const [sx, sy] = w2s(s.x, s.y); g.drawImage(spr.c, sx - (spr.ax / BK) * zm, sy - (spr.ay / BK) * zm, (spr.c.width / BK) * zm, (spr.c.height / BK) * zm); }]);
      } else if (s.gen && s.gen.type === 'bush') {
        const spr = cached(`u${season}:${(s.gen.seed || 0) % 5}`, () => bushSprite((s.gen.seed || 0) % 5, season));
        list.push([depth, () => { const [sx, sy] = w2s(s.x, s.y); g.drawImage(spr.c, sx - (spr.ax / BK) * zm, sy - (spr.ay / BK) * zm, (spr.c.width / BK) * zm, (spr.c.height / BK) * zm); }]);
      } else {
        const im = s.useAlt && s.alt ? s.alt : s.img, kind = s.rock ? 'rock' : s.gen && s.gen.type === 'hedge' ? 'hedge' : im && im.isoKind, PR = kind && Iso.props[kind];
        if (PR) { const lit = !!s.useAlt, spr = cached(`p${kind}:${PR.key ? PR.key(s, lit, season) : ''}:${season}`, () => PR.bake(s, lit, season)); list.push([depth + (PR.bias || 0), () => drawBaked(g, spr, s.x, s.y)]); }
        else list.push([depth, () => upright(g, im, s.x, s.y, s.ox, s.oy, k, false)]);
      }
    }
    const winter = season === 'winter';
    const sprite = (img, x, iy, flip) => { if (!img) return; const lw = img.hd ? img.width / RS : img.width, lh = img.hd ? img.height / RS : img.height, fx = x + lw / 2, fy = iy + lh - 2; if (!seen(fx, fy, 60)) return; list.push([fx + fy, () => upright(g, img, fx, fy, lw / 2, lh - 2, k, flip)]); };
    const crop = (t, st, x, y) => { if (!Iso.cropBake || !seen(x, y, 40)) return; const spr = cached(`c${t}:${st}:${season}`, () => Iso.cropBake(t, st, season)); list.push([x + y, () => drawBaked(g, spr, x, y)]); };
    for (const h of World.homes) if (h.built) for (const p of h.plots) crop(h.cropType, p.stage, p.x, p.y);
    if (!winter) {
      for (const w of World.weed) crop('leaf', w.stage, w.x, w.y);
      for (const f of World.fields) for (const p of f.plots) crop('barley', p.stage, p.x, p.y);
      for (const p of World.herbBeds) crop('herb', p.stage, p.x, p.y);
      for (const m of World.mushrooms) if (m.amount > 0) sprite(SPR.mush, m.x - 6, m.y - 7);
      for (const m of World.wildHerbs) if (m.amount > 0) sprite(SPR.herbWild, m.x - 7, m.y - 12);
    }
    for (const al of World.allotments) for (const p of al.plots) crop(p.crop, p.stage, p.x, p.y);
    for (const it of World.items) { const im = SPR.items[it.kind]; if (im) sprite(im, it.x - Math.floor(im.width / 2), it.y - im.height + 2); }
    const beast = (kind, a, x, y) => { if (!seen(x, y, 40)) return; list.push([x + y, () => { const [sx, sy] = w2s(x, y); Iso.drawAnimal(g, kind, a, sx, sy, zm); }]); };
    for (const pt of Game.pets || []) if (!pt.inside) beast('pet', pt, pt.x, pt.y);
    for (const r of World.rabbits) beast('rabbit', r, r.x, r.y);
    for (const an of World.animals) beast(an.kind, an, an.x, an.y);
    for (const hn of World.hens) beast('hen', hn, hn.x, hn.y);
    for (const c of World.crows) if (c.state === 'peck') beast('crow', c, c.x, c.y);
    for (const d of World.ducks || []) beast('duck', d, d.x, d.y);
    for (const mw of World.millWheels) if (seen(mw.x, mw.y)) list.push([mw.x + mw.y + 12, () => billboard(g, mw.x, mw.y, () => drawMillWheel(g, mw), k)]);
    for (const r of World.rifts) if (seen(r.x, r.y)) list.push([r.x + r.y, () => billboard(g, r.x, r.y, () => drawRift(g, r, tReal), k)]);
    for (const p of Village.projects) {
      if (p.kind !== 'building' && p.kind !== 'well') continue;
      const lot = World.lots[p.lot], ax = lot.kind === 'well' ? lot.tx * 16 + 8 : (lot.x0 + lot.x1 + 1) * 8, ay = lot.kind === 'well' ? (lot.ty + 1) * 16 + 2 : (lot.y1 + 1) * 16 + 1;
      if (seen(ax, ay)) list.push([ax + ay, () => billboard(g, ax, ay, () => drawLotSite(g, lot, p.prog), k)]);
    }
    for (const v of Game.villagers) {
      if (v.inside || v.carried || v.heldBy) { v._isx = null; continue; }
      if (!seen(v.x, v.y, 40)) { v._isx = null; continue; }
      list.push([v.x + v.y, () => folk(g, v, zm)]);
    }
    list.sort((a, b) => a[0] - b[0]);
    hits.length = 0;
    for (const [, fn] of list) fn();
    if (winter && World.bonfire) billboard(g, World.bonfire.x, World.bonfire.y, () => drawBonfire(g, tReal, Game.party.on), k);
    for (const c of World.crows) if (c.state === 'fly') { const [sx, sy] = w2s(c.x, c.y, 30); Iso.drawAnimal(g, 'crow', { fly: true, flap: c.flap }, sx, sy, zm); }
    groundTransform(g);
    drawPartyLanterns(g, tReal, Game.party.on);
    FX.drawAmbientDay(g, Game, cr);
    FX.draw(g);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    // sky, night and weather
    const sky = skyState(Game.hour);
    Game.darkness = sky.dark;
    if (sky.dusk > 0.01) { g.fillStyle = `rgba(255,136,60,${sky.dusk * 0.13})`; g.fillRect(0, 0, W(), H()); }
    if (Game.raining) { g.fillStyle = 'rgba(70,90,110,0.12)'; g.fillRect(0, 0, W(), H()); }
    night(g, sky.dark, winter);
    groundTransform(g); FX.draw(g, true); FX.drawFireflies(g, Game, cr, []); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    { const q = 3, scr = { x: 0, y: 0, w: W() / q, h: H() / q }; g.setTransform(q * dpr, 0, 0, q * dpr, 0, 0); FX.drawFog(g, Game, scr); FX.drawFalling(g, Game, scr, dtReal); FX.drawRain(g, Game, scr, dtReal); FX.drawLightning(g, Game, scr, dtReal); g.setTransform(dpr, 0, 0, dpr, 0, 0); }

    if (Game.carrying) folk(g, Game.carrying, zm, 18);
    for (const v of Game.villagers) if (v._isx != null) billboard(g, v.x, v.y - 16, () => { const t = v._top; v._top = v.y - 16; drawThought(g, v); v._top = t; }, k * 0.8);
    const sel = Game.selected;
    if (sel && sel._isx != null) { const bob = Math.sin(tReal * 5) * 2, ax = sel._isx, ay = sel._isy - 10 + bob; g.fillStyle = '#2a1c12'; g.beginPath(); g.moveTo(ax - 7, ay - 6); g.lineTo(ax + 7, ay - 6); g.lineTo(ax, ay + 3); g.closePath(); g.fill(); g.fillStyle = '#ffe14a'; g.beginPath(); g.moveTo(ax - 4.5, ay - 4.5); g.lineTo(ax + 4.5, ay - 4.5); g.lineTo(ax, ay + 1); g.closePath(); g.fill(); }
    const vg = g.createRadialGradient(W() / 2, H() / 2, Math.min(W(), H()) * 0.45, W() / 2, H() / 2, Math.max(W(), H()) * 0.75);
    vg.addColorStop(0, 'rgba(20,12,4,0)'); vg.addColorStop(1, 'rgba(20,12,4,0.26)'); g.fillStyle = vg; g.fillRect(0, 0, W(), H());
  }
  function folk(g, v, zm, lift = 0) {
    const [sx, sy] = w2s(v.x, v.y); const y = sy - lift * zm;
    const r = drawFolk(g, v, sx, y, zm);
    v._isx = sx; v._isy = r.top; v._ibox = [sx - 9 * zm, r.top - 2, sx + 9 * zm, y + 4 * zm];
  }
  // darkness with warm pools of light where lamps, windows and pipes glow
  let darkC = null;
  function night(g, dark, winter) {
    if (dark < 0.02) return;
    if (!darkC || darkC.width !== view.width || darkC.height !== view.height) darkC = mk(view.width, view.height);
    const d = darkC.getContext('2d'), zm = Iso.zoom;
    d.setTransform(1, 0, 0, 1, 0, 0); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, darkC.width, darkC.height);
    d.fillStyle = winter ? `rgba(14,22,54,${dark * 0.86})` : `rgba(12,18,46,${dark * 0.86})`; d.fillRect(0, 0, darkC.width, darkC.height);
    d.globalCompositeOperation = 'destination-out'; d.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lights = collectLights();
    for (const L of lights) {
      const [x, y] = w2s(L.x, L.y), r = L.r * zm * 1.7; if (x < -r || y < -r || x > W() + r || y > H() + r) continue;
      const gr = d.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${Math.min(1, L.a)})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = gr; d.beginPath(); d.arc(x, y, r, 0, Math.PI * 2); d.fill();
    }
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(darkC, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalCompositeOperation = 'lighter';
    for (const L of lights) {
      const [x, y] = w2s(L.x, L.y), r = L.r * zm * 0.9; if (x < -r || y < -r || x > W() + r || y > H() + r) continue;
      const col = L.col || '255,190,110', gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${0.22 * dark * L.a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  }

  // --- taking over from the classic view --------------------------------------------------
  const _render = render, _resize = resize, _clampCam = clampCam, _centerOn = centerOn, _setZoom = setZoom, _zoomStep = zoomStep, _updateCamera = updateCamera;
  const _screenToWorld = screenToWorld, _villagerAt = villagerAt, _startPinch = startPinch, _movePinch = movePinch, _camGrab = camGrab, _camDrag = camDrag;
  const _headScreen = headScreen, _groundScreen = groundScreen, _liftScreen = liftScreen, _homeAt = homeAt, _buildingAt = buildingAt;
  render = function (dtReal, dtWall) { if (!Iso.active()) return _render(dtReal, dtWall); isoRender(dtReal, dtWall); };
  resize = function () { if (!Iso.active()) return _resize(); isoResize(); };
  clampCam = function () { if (!Iso.active()) return _clampCam(); isoClamp(); };
  centerOn = function (x, y) { if (!Iso.active()) return _centerOn(x, y); Iso.cx = x; Iso.cy = y; isoClamp(); };
  setZoom = function (z, ax, ay) { if (!Iso.active()) return _setZoom(z, ax, ay); isoZoomTo(ZMS[Math.max(0, Math.min(ZMS.length - 1, ZOOMS.indexOf(snapZoom(z)) + 1))], ax, ay); };
  zoomStep = function (dir, ax, ay) {
    if (!Iso.active()) return _zoomStep(dir, ax, ay);
    let i = ZMS.reduce((best, z, j) => (Math.abs(z - Iso.zoom) < Math.abs(ZMS[best] - Iso.zoom) ? j : best), 0);
    isoZoomTo(ZMS[Math.max(0, Math.min(ZMS.length - 1, i + dir))], ax, ay);
  };
  updateCamera = function (dt) {
    if (!Iso.active()) return _updateCamera(dt);
    const sp = 520 * dt;
    let mx = 0, my = 0;
    if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
    if (keys.has('d') || keys.has('arrowright')) mx += 1;
    if (keys.has('w') || keys.has('arrowup')) my -= 1;
    if (keys.has('s') || keys.has('arrowdown')) my += 1;
    if (mx || my) { const [dx, dy] = screenDelta(mx * sp, my * sp); Iso.cx += dx; Iso.cy += dy; Game.follow = false; updateFollowBtn(); }
    if (Game.follow && Game.selected) {
      const v = Game.selected, px = v.inside ? v.inside.stepX : v.x, py = v.inside ? v.inside.stepY : v.y;
      Iso.cx += (px - Iso.cx) * Math.min(1, dt * 4); Iso.cy += (py - Iso.cy) * Math.min(1, dt * 4);
    }
    isoClamp();
  };
  screenToWorld = function (sx, sy) { return Iso.active() ? s2w(sx, sy) : _screenToWorld(sx, sy); };
  villagerAt = function (wx, wy, touch = pointer.touch) {
    if (!Iso.active()) return _villagerAt(wx, wy, touch);
    const [sx, sy] = w2s(wx, wy), pad = touch ? 14 : 0;
    let best = null, bd = 1e9;
    for (const v of Game.villagers) {
      if (v.inside || v.carried || v.heldBy || !v._ibox) continue;
      const [x0, y0, x1, y1] = v._ibox;
      if (sx >= x0 - pad && sx <= x1 + pad && sy >= y0 - pad && sy <= y1 + pad) { const d = Math.abs(sx - v._isx) + Math.abs(sy - (y0 + y1) / 2); if (d < bd) { bd = d; best = v; } }
    }
    return best;
  };
  const hitAt = (kind, wx, wy) => { const [sx, sy] = w2s(wx, wy); for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (h.kind === kind && sx >= h.x0 && sx <= h.x1 && sy >= h.y0 && sy <= h.y1) return h.ref; } return null; };
  homeAt = function (wx, wy) { return Iso.active() ? hitAt('home', wx, wy) : _homeAt(wx, wy); };
  buildingAt = function (wx, wy) { return Iso.active() ? hitAt('building', wx, wy) : _buildingAt(wx, wy); };
  camGrab = function () { return Iso.active() ? [Iso.cx, Iso.cy] : _camGrab(); };
  camDrag = function (x0, y0, dx, dy) { if (!Iso.active()) return _camDrag(x0, y0, dx, dy); const [wx, wy] = screenDelta(dx, dy); Iso.cx = x0 - wx; Iso.cy = y0 - wy; isoClamp(); };
  let isoPinch = null;
  startPinch = function () {
    if (!Iso.active()) return _startPinch();
    const [a, b] = [...touches.values()], m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
    isoPinch = { d0: Math.max(20, m.d), z0: Iso.zoom, w: s2w(m.x, m.y) };
    pinch = true; pointer.down = false; pointer.cand = null; pointer.pinched = true; Game.follow = false; updateFollowBtn();
  };
  movePinch = function () {
    if (!Iso.active() || !isoPinch) return _movePinch();
    const [a, b] = [...touches.values()], m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
    Iso.zoom = Math.max(0.6, Math.min(3.2, isoPinch.z0 * (m.d / isoPinch.d0)));
    const [nx, ny] = s2w(m.x, m.y); Iso.cx += isoPinch.w[0] - nx; Iso.cy += isoPinch.w[1] - ny; isoClamp();
  };
  headScreen = function (v, cx, cy, z) { if (!Iso.active()) return _headScreen(v, cx, cy, z); if (v._isx != null) return [v._isx, v._isy]; const [x, y] = w2s(v.x, v.y); return [x, y - 34 * Iso.zoom]; };
  groundScreen = function (x, y, cx, cy, z) { return Iso.active() ? w2s(x, y) : _groundScreen(x, y, cx, cy, z); };
  liftScreen = function (px, z) { return Iso.active() ? px * Iso.zoom * 0.9 : _liftScreen(px, z); };
  // overlays that still speak in flat world positions only make sense in the classic view
  for (const name of ['devOverlay', 'drawAppealAndPins', 'drawHazard']) {
    const orig = window[name]; if (typeof orig !== 'function') continue;
    window[name] = function (...a) { if (!Iso.active()) return orig.apply(this, a); };
  }

  // the ground repaints with the classic one
  const _repaintRect = repaintRect;
  repaintRect = function (x, y, w, h) { _repaintRect(x, y, w, h); if (TEX) dirty.push([Math.floor(x / 16), Math.floor(y / 16), Math.ceil((x + w) / 16), Math.ceil((y + h) / 16)]); };
  const _plantFlowers = plantFlowers;
  plantFlowers = function (x, y, seed) { const r = _plantFlowers(x, y, seed); if (TEX) dirty.push([Math.floor(x / 16) - 1, Math.floor(y / 16) - 1, Math.floor(x / 16) + 1, Math.floor(y / 16) + 1]); return r; };
  // a new home or building changes its look; drop what was baked
  const forget = () => { for (const k of [...cache.keys()]) if (k[0] === 'h' || k[0] === 'b') cache.delete(k); };
  if (typeof completeHome === 'function') { const ch = completeHome; completeHome = function (...a) { const r = ch.apply(this, a); forget(); return r; }; }

  // switching views keeps the same spot in the middle of the screen
  function setView(on) {
    if (on === Iso.on) return;
    const wasActive = Iso.active();
    const center = wasActive ? [Iso.cx, Iso.cy] : [Game.cam.x + Game.cam.w / 2, Game.cam.y + Game.cam.h / 2];
    Iso.on = on;
    try { localStorage.setItem(VIEW_KEY, on ? 'iso' : 'classic'); } catch (e) { /* not remembered */ }
    applyView(center);
  }
  function applyView(center) {
    if (Iso.active()) { isoResize(); Iso.cx = center[0]; Iso.cy = center[1]; isoClamp(); }
    else { _resize(); _centerOn(center[0], center[1]); }
    vctx.imageSmoothingEnabled = Iso.active();
    const btn = document.getElementById('btn-view'); if (btn) btn.textContent = Iso.on ? 'Classic view' : 'Isometric view';
  }
  // build mode draws its plans and ghosts on the classic map for now
  const _setBuildMode = setBuildMode;
  setBuildMode = function (on) {
    const before = Iso.active(), center = before ? [Iso.cx, Iso.cy] : [Game.cam.x + Game.cam.w / 2, Game.cam.y + Game.cam.h / 2];
    Iso.suspended = !!on;
    if (before !== Iso.active()) applyView(center);
    return _setBuildMode(on);
  };
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-view');
    if (btn) { btn.textContent = Iso.on ? 'Classic view' : 'Isometric view'; btn.addEventListener('click', () => setView(!Iso.on)); }
    window.addEventListener('resize', () => { if (Iso.active()) isoResize(); });
  });
  Iso.w2s = w2s; Iso.s2w = s2w; Iso.setView = setView;
})();
