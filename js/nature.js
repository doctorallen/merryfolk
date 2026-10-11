'use strict';
// ---------------------------------------------------------------------------
// The living countryside: wind, and the things that move in it. A breeze
// blows across the valley in slow swells and gusts (stiffer in rain, wild in
// a storm, still in fog). Trees lean and sway with it, tops more than trunks;
// bushes stir; long grass and riverside reeds ripple as the gusts pass along.
// Rocks and boulders lie about the fields and woods.
// ---------------------------------------------------------------------------

const Wind = { s: 0.35 };
const WIND_BY_WEATHER = { clear: 0.32, fog: 0.08, cloudy: 0.5, rain: 0.7, snow: 0.45, storm: 1.35 };
function updateWind(dt) {
  const target = WIND_BY_WEATHER[Game.weather] ?? 0.35;
  Wind.s += (target - Wind.s) * Math.min(1, dt * 0.25);
}
// How far things lean at a point (east is positive), roughly -1..2: a steady
// push, slow swells, and gusts that roll across the valley from the west.
function windAt(x, y = 0) {
  const t = tReal;
  const swell = 0.55 + 0.45 * Math.sin(t * 0.7 + x * 0.008 + y * 0.004);
  const gust = Math.pow(Math.max(0, Math.sin(t * 0.45 - x * 0.012 - y * 0.003)), 4) * 1.4;
  return Wind.s * (swell + gust);
}

// Draws a sprite leaning in the wind: rows near the top shift furthest, the
// base not at all. Rows that shift alike are drawn together, so a tree costs
// only a handful of draws.
function blitSway(ctx, img, x, y, amp) {
  const src = img.hd ? img : hd(img);
  const lw = img.hd ? img.width / RS : img.width, lh = img.hd ? img.height / RS : img.height;
  if (Math.abs(amp) < 0.3) { ctx.drawImage(src, x, y, lw, lh); return; }
  const H = src.height, W = src.width;
  const offAt = (row) => Math.round(amp * Math.pow(Math.max(0, 1 - row / H), 1.8) * RS) / RS;
  let row = 0;
  while (row < H) {
    const off = offAt(row);
    let end = row + 2;
    while (end < H && offAt(end) === off) end += 2;
    end = Math.min(end, H);
    ctx.drawImage(src, 0, row, W, end - row, x + off, y + row / RS, lw, (end - row) / RS);
    row = end;
  }
}
// How much a static leans right now.
function swayAmp(s) {
  const flutter = Math.sin(tReal * 3.3 + s.x * 0.37) * 0.18 * Wind.s;
  return (windAt(s.x, s.y) + flutter) * s.sway * clamp(s.img.height / 34, 0.6, 1.5) * 2.6;
}

// ----- long grass and reeds -----
// A tuft is drawn pixel for pixel at world size, in five leaning poses, per season.
const TUFT_CACHE = new Map();
const TUFT_W = 9, TUFT_H = 13;
function tuftSprite(v, season, lean) {
  const key = v + ':' + season + ':' + lean;
  let c = TUFT_CACHE.get(key);
  if (c) return c;
  if (v >= TALL_V) { c = tallSprite(v, season, lean); TUFT_CACHE.set(key, c); return c; }
  if (v >= WILD_V) { c = wildSprite(v, season, lean); TUFT_CACHE.set(key, c); return c; }
  let ctx;
  [c, ctx] = makeCanvas(TUFT_W, TUFT_H);
  const rng = mulberry32(v * 977 + 5);
  const reed = v >= 6;
  const winter = season === 'winter';
  const greens = {
    spring: ['#2e6424', '#4a8a30', '#7cbc48'], summer: ['#1f4a1c', '#346e26', '#68a03a'],
    autumn: ['#6a5a22', '#988232', '#ccb056'], winter: ['#5a4a32', '#7a6a48', '#a89870'],
  }[season];
  const blades = reed ? 4 : 4 + (v % 2);
  for (let i = 0; i < blades; i++) {
    const bx = 1 + Math.round(rng() * (TUFT_W - 3));
    const h = Math.round(((reed ? 8 : 4) + rng() * (reed ? 4 : 3 + (v % 2) * 2)) * (winter && !reed ? 0.6 : 1));
    const bend = ((rng() - 0.5) * 2 + lean * 1.6) * 0.5;
    for (let j = 0; j < h; j++) {
      const f = j / h;
      const px = Math.round(bx + bend * f * f * (reed ? 1.4 : 1)), py = TUFT_H - 1 - j;
      ctx.fillStyle = f < 0.35 ? greens[0] : f < 0.75 ? greens[1] : greens[2];
      ctx.fillRect(px, py, 1, 1);
    }
    const tipX = Math.round(bx + bend * (reed ? 1.4 : 1)), tipY = TUFT_H - h;
    // seed heads in summer, bulrush heads on the reeds, snow in winter
    if (reed && i % 2 === 0) { ctx.fillStyle = winter ? '#6a4a2a' : '#7a4a22'; ctx.fillRect(tipX, tipY, 1, 2); ctx.fillStyle = '#a06a3a'; ctx.fillRect(tipX, tipY, 1, 1); }
    else if (!reed && season === 'summer' && i % 3 === 0) { ctx.fillStyle = '#d8c890'; ctx.fillRect(tipX, tipY - 1, 1, 1); }
    else if (winter && i % 2 === 0) { ctx.fillStyle = '#f4f8ff'; ctx.fillRect(tipX, tipY, 1, 1); }
  }
  TUFT_CACHE.set(key, c);
  return c;
}
function drawTuft(ctx, g) {
  const w = windAt(g.x, g.y) + Math.sin(tReal * 2.6 + g.ph) * 0.25 * Wind.s;
  const lean = clamp(Math.round(w * 1.6), -1, 2);
  const spr = tuftSprite(g.v, World.season, lean);
  ctx.drawImage(spr, Math.round(g.x - spr.width / 2), Math.round(g.y - spr.height + 1));
}

// ----- tall grass -----
// Thick stands of meadow grass, eight to twelve pixels high: planted close,
// so a grown hobbit walking through is hidden half to three-quarters of the
// way up by the stems in front of them, and a little one nearly to the chin. Seed heads in summer, gold in
// autumn, flattened straw in winter. A tuft's v of TALL_V and up, six variants.
const TALL_V = 300, TALL_W = 13, TALL_H = 17;
function tallSprite(v, season, lean) {
  const [c, x] = makeCanvas(TALL_W, TALL_H);
  const rng = mulberry32((v - TALL_V) * 389 + 11);
  const winter = season === 'winter';
  // five shades from the shadowed foot of the stand to the sunlit tips, and a seed-head colour
  const cols = { spring: ['#1e4a1c', '#2e6a26', '#468e30', '#68ae44', '#90cc5e', '#a8d070'], summer: ['#1c461a', '#2a6224', '#3e7e2c', '#5c9c3a', '#80b84c', '#cabe82'], autumn: ['#4a4a1e', '#6a6428', '#8c8236', '#b0a24c', '#cebc66', '#e0cc88'], winter: ['#5a4a30', '#6e5c3a', '#8e7a52', '#ae9a6c', '#c8b88e', '#d8ccaa'] }[season];
  for (let i = 0, n = winter ? 5 : 10 + Math.floor(rng() * 3); i < n; i++) {
    const bx = 1 + Math.round(rng() * (TALL_W - 3));
    const h = Math.round((8 + rng() * 4.5) * (winter ? 0.6 : 1));
    const bend = ((rng() - 0.5) * 1.6 + lean * 1.4) * (winter ? 2 : 1);
    const tone = rng() < 0.35 ? -1 : rng() < 0.3 ? 1 : 0; // some stems darker, some lighter
    for (let j = 0; j < h; j++) {
      const f = j / h, k = clamp((f < 0.25 ? 0 : f < 0.55 ? 1 : f < 0.85 ? 2 : 3) + tone, 0, 4);
      x.fillStyle = cols[k];
      x.fillRect(Math.round(bx + bend * f * f), TALL_H - 1 - j, 1, 1);
    }
    // a seed head on the odd tall stem
    if (h >= 11 && !winter && season !== 'spring' && rng() < 0.4) { x.fillStyle = cols[5]; const tx = Math.round(bx + bend); x.fillRect(tx, TALL_H - h - 1, 1, 2); }
  }
  return c;
}

// ----- weeds and wild plants -----
// Twelve kinds, each through the year and swaying like the long grass: a
// tuft's v of WILD_V and up is a wild plant, its kind and one of four
// variants (height and lean) packed in. Broad-leaved ones get an outline.
const WILD = ['dandelion', 'nettle', 'dock', 'thistle', 'parsley', 'plantain', 'clover', 'bracken', 'foxtail', 'sorrel', 'ragwort', 'horsetail'];
const WILD_V = 100, WILD_W = 15, WILD_H = 20;
const wildV = (kind, rng) => WILD_V + WILD.indexOf(kind) * 4 + Math.floor(rng() * 4);
function wildSprite(v, season, lean) {
  const kind = WILD[Math.floor((v - WILD_V) / 4) % WILD.length], vr = (v - WILD_V) % 4;
  const [c, x] = makeCanvas(WILD_W, WILD_H);
  const rng = mulberry32(v * 131 + 7);
  const P = (px, py, col) => { px = Math.round(px); py = Math.round(py); if (px >= 0 && py >= 0 && px < WILD_W && py < WILD_H) { x.fillStyle = col; x.fillRect(px, py, 1, 1); } };
  const B = WILD_H - 1, C = 7;
  const win = season === 'winter', aut = season === 'autumn', spr = season === 'spring';
  const G = { spring: ['#2e6424', '#4a8a30', '#7cbc48'], summer: ['#24521e', '#3a7428', '#62a03a'], autumn: ['#4a5a1e', '#6e7a2a', '#9a9a3a'], winter: ['#5a4a32', '#7a6a48', '#a89870'] }[season];
  const DEAD = ['#4a3420', '#6e5034', '#94744a'];
  const L = win ? DEAD : G;
  // a stem rising h pixels from (sx, B), bending with the wind; gives its x at each height
  const stem = (sx, h, col, tilt = 0) => { const b = lean * 0.9 + tilt; const at = (j) => Math.round(sx + b * (j / h) * (j / h)); for (let j = 0; j < h; j++) P(at(j), B - j, col); return at; };
  // a leaf from (x0, y0) out along angle a, len long, widest in the middle
  const leaf = (x0, y0, a, len, wmax, cols, vein) => {
    const dx = Math.cos(a), dy = -Math.sin(a);
    for (let i = 0; i <= len; i++) {
      const w = Math.round(wmax * Math.sin((Math.PI * i) / len));
      for (let k = -w; k <= w; k++) P(x0 + dx * i - dy * k, y0 + dy * i + dx * k, k < 0 ? cols[2] : cols[1]);
      if (vein) P(x0 + dx * i, y0 + dy * i, vein);
    }
  };
  // a low rosette of toothed leaves
  const rosette = (r, cols, teeth) => {
    for (let k = -r; k <= r; k++) P(C + k, B, cols[0]);
    for (let k = -r + 1; k <= r - 1; k++) if (!teeth || Math.abs(k) < r - 2 || k % 2) P(C + k, B - 1, cols[1]);
    for (let k = -1; k <= 1; k++) P(C + k, B - 2, cols[2]);
    if (teeth) { P(C - r + 1, B - 2, cols[1]); P(C + r - 1, B - 2, cols[1]); }
  };
  let outline = false;
  // in winter the low rosettes lie under the snow
  if (win && (kind === 'dandelion' || kind === 'plantain' || kind === 'clover')) return c;
  switch (kind) {
    case 'dandelion': {
      rosette(win ? 3 : 4 + (vr % 2), L, true); outline = true;
      if (win) break;
      const h = 4 + vr, at = stem(C + (vr % 2 ? 1 : -1), h, G[1]), hx = at(h - 1), hy = B - h;
      if (aut ? vr < 2 : spr || vr < 3) {
        if (aut || (!spr && vr === 2)) { for (const [i, j] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1]]) P(hx + i, hy + j, '#f4f4ee'); P(hx, hy, '#c8c8c0'); }
        else { for (const [i, j] of [[-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]]) P(hx + i, hy + j, '#f2d24a'); P(hx, hy, '#e8a020'); }
      }
      break;
    }
    case 'nettle': {
      // upright stems, staggered, with pairs of drooping toothed leaves
      for (let k = 0, n = 2 + (vr % 2); k < n; k++) {
        const h = (win ? 6 : 9) + vr + Math.floor(rng() * 3), at = stem(C - 3 + k * 3 + Math.round(rng()), h, L[0], (rng() - 0.5) * 0.8);
        if (win) continue;
        for (let j = 2 + (k % 2); j < h - 1; j += 3) { const lx = at(j); P(lx - 1, B - j, G[1]); P(lx - 2, B - j + 1, G[1]); P(lx - 3, B - j + 2, G[0]); P(lx + 1, B - j, G[2]); P(lx + 2, B - j + 1, G[1]); P(lx + 3, B - j + 2, G[0]); if (!spr && !aut) P(lx, B - j + 1, '#9aa860'); }
        P(at(h - 1), B - h, G[2]); P(at(h - 1) - 1, B - h + 1, G[1]); P(at(h - 1) + 1, B - h + 1, G[1]);
      }
      break;
    }
    case 'dock': {
      outline = true;
      const cols = win ? DEAD : G, vein = vr % 2 ? '#8a3a2a' : null;
      if (!win) { leaf(C, B, 2.7, 7, 2, cols, vein); leaf(C, B, 0.45, 7, 2, cols, vein); leaf(C, B, 1.55, 6, 2, cols, vein); }
      if (!spr) {
        // a slim spike of rusty seed clusters
        const h = 11 + vr, at = stem(C + 1, h, win ? DEAD[0] : '#6a5a2a');
        const seed = aut || win ? ['#6a3418', '#8a4a22', '#a8622a'] : ['#7a7a3a', '#9a7a3a', '#a8903a'];
        for (let j = h - 7; j < h; j++) P(at(j) + (j % 2 ? 1 : -1), B - j, seed[j % 3]);
      }
      break;
    }
    case 'thistle': {
      outline = true;
      if (!win) { rosette(4, L, true); P(C - 4, B - 1, '#c8d8a0'); P(C + 4, B - 1, '#c8d8a0'); }
      if (spr) break;
      const h = 7 + vr, at = stem(C, h, L[0]);
      for (let j = 3; j < h - 2; j += 3) { const lx = at(j); P(lx - 1, B - j, L[1]); P(lx - 2, B - j - 1, L[2]); P(lx + 1, B - j, L[1]); P(lx + 2, B - j - 1, L[2]); if (!win) { P(lx - 3, B - j - 1, '#c8d8a0'); P(lx + 3, B - j - 1, '#c8d8a0'); } }
      const hx = at(h - 1), hy = B - h;
      P(hx - 1, hy + 1, L[1]); P(hx, hy + 1, L[2]); P(hx + 1, hy + 1, L[1]); P(hx, hy + 2, L[0]);
      const top = win ? ['#6e5034', '#94744a'] : aut ? ['#f0ece0', '#d8d4c8'] : ['#b05ac8', '#d890e8'];
      P(hx - 1, hy, top[0]); P(hx, hy, top[1]); P(hx + 1, hy, top[0]); P(hx, hy - 1, top[1]);
      break;
    }
    case 'parsley': {
      // feathery leaves low down, a tall stem branching into lacy umbels
      for (let k = 0; k < 16; k++) { const lx = C + Math.round((rng() - 0.5) * 10), ly = B - Math.floor(rng() * 5); if (!win) P(lx, ly, rng() < 0.5 ? G[1] : G[2]); }
      const h = (win ? 9 : 12) + vr, at = stem(C, h, win ? DEAD[1] : G[0], (vr - 1.5) * 0.4);
      const head = win ? ['#6e5034', '#94744a'] : aut ? ['#7a5a32', '#9a7a4a'] : spr ? ['#f4f4ec', '#ffffff', '#d8d8c8'] : ['#a8b878', '#c8d098', '#8a9a5a'];
      const umbel = (hx, hy, r) => {
        for (let k = -r; k <= r; k++) { P(hx + k * 0.6, hy + 2 - Math.abs(k) * 0.3, L[0]); if (!win || k % 2) P(hx + k, hy, head[(k + 9) % head.length]); }
        for (let k = -r + 1; k <= r - 1; k++) if (!win || !(k % 2)) P(hx + k, hy - 1, head[(k + 10) % head.length]);
      };
      umbel(at(h - 1), B - h, 3);
      // side branches with smaller umbels
      const j1 = h - 4 - (vr % 2), sx = at(j1);
      for (let k = 1; k <= 3; k++) P(sx - k, B - j1 - k, win ? DEAD[1] : G[0]);
      umbel(sx - 4, B - j1 - 4, 2);
      if (vr > 1) { const j2 = h - 6, s2 = at(j2); for (let k = 1; k <= 2; k++) P(s2 + k, B - j2 - k, win ? DEAD[1] : G[0]); umbel(s2 + 3, B - j2 - 3, 2); }
      break;
    }
    case 'plantain': {
      outline = true;
      for (const [a, len] of [[2.75, 5], [0.4, 5], [2.2, 4], [0.95, 4]]) leaf(C, B, a, len, 1, L, L[0]);
      if (spr || win) break;
      for (let k = 0, n = 1 + (vr % 2); k < n; k++) {
        const h = 6 + vr + k, at = stem(C - 1 + k * 2, h, aut ? '#7a6a3a' : G[0], (k - 0.5) * 0.6);
        for (let j = h - 3; j < h; j++) P(at(j), B - j, aut ? '#5a4a2a' : '#6a5a3a');
        if (!aut) P(at(h - 2) + 1, B - h + 2, '#e8e0c0');
      }
      break;
    }
    case 'clover': {
      outline = true;
      for (let k = 0, n = win ? 4 : 8; k < n; k++) { const lx = C + Math.round((rng() - 0.5) * 9), ly = B - Math.floor(rng() * 3); P(lx, ly, L[1]); P(lx + 1, ly, L[1]); P(lx, ly - 1, L[2]); }
      if (win) break;
      const red = vr % 2, head = aut ? ['#8a6a4a', '#a8865a'] : red ? ['#c86aa8', '#e8a0c8'] : ['#f4f0f4', '#e8d8e8'];
      for (let k = 0, n = aut ? 1 : 2 + (vr >> 1); k < n; k++) { const hx = C - 3 + k * 3 + Math.round(rng()), hy = B - 4 - Math.floor(rng() * 2); P(hx, hy + 1, G[0]); P(hx, hy, head[0]); P(hx + 1, hy, head[1]); P(hx, hy - 1, head[1]); P(hx + 1, hy - 1, head[0]); }
      break;
    }
    case 'bracken': {
      // fronds that rise and arch over, with leaflets down each side
      const cols = win ? ['#5a3a20', '#6e4a2a'] : aut ? ['#8a4a1a', '#b8682a'] : [G[1], G[2]];
      for (let k = 0, n = 2 + (vr % 2); k < n; k++) {
        const dir = k % 2 ? 1 : -1, len = (win ? 6 : 10) + vr + Math.floor(rng() * 2), rise = win ? 0.5 : 1.25;
        for (let t = 0; t < len; t++) {
          const f = t / len, fx = C + dir * (t * 0.55 + f * f * 3) + lean * 0.6 * f, fy = B - t * rise + f * f * len * (win ? 0.2 : 0.75);
          P(fx, fy, cols[0]);
          if (t > 1) { const lf = Math.max(1, Math.round((1 - f) * 2.5)); for (let q = 1; q <= lf; q++) { P(fx - dir * q * 0.5 - 0.5, fy + q * 0.5 - (t % 2), cols[1]); P(fx + dir * q * 0.5 + 0.5, fy + q - (t % 2), cols[t % 2]); } }
        }
        if (spr && k === 0) { P(C + dir * 2, B - len + 1, '#7cbc48'); P(C + dir * 3, B - len + 2, '#4a8a30'); }
      }
      break;
    }
    case 'foxtail': {
      const blade = win ? DEAD : G;
      for (let k = 0; k < 4; k++) { const bx = C - 3 + k * 2, h = 3 + Math.floor(rng() * 3); for (let j = 0; j < h; j++) P(bx + Math.round(lean * 0.4 * (j / h)), B - j, blade[j < h / 2 ? 0 : 1]); }
      const plume = win ? '#a08a62' : aut ? '#b89a5a' : spr ? '#8ab04a' : '#d8c890', tip = win ? '#c0aa80' : spr ? '#a8c868' : '#f0e2b0';
      for (let k = 0, n = 2 + (vr % 2); k < n; k++) {
        const h = 9 + vr + Math.floor(rng() * 3), at = stem(C - 2 + k * 2, h, win ? DEAD[1] : G[1], (k - 1) * 0.7 + (win ? 1.5 : 0));
        for (let j = h - 4; j < h; j++) P(at(j), B - j, plume);
        P(at(h - 1), B - h, tip);
      }
      break;
    }
    case 'sorrel': {
      for (const a of [2.6, 0.55]) leaf(C, B, a, 3, 1, L, null);
      const head = win ? ['#6e5034', '#94744a'] : aut ? ['#7a2a14', '#9a4020'] : spr ? ['#8a6a3a', '#a07a40'] : ['#c8402a', '#a83020'];
      for (let k = 0, n = 2 + (vr % 2); k < n; k++) {
        const h = 8 + vr + Math.floor(rng() * 3), at = stem(C - 2 + k * 2, h, win ? DEAD[0] : '#5a6a2a', (k - 1) * 0.6);
        // little whorls of seed spaced up the top of each spike
        for (let j = h - 6 + k; j < h; j += 2) { P(at(j) + 1, B - j, head[0]); P(at(j) - 1, B - j + 1, head[1]); }
        P(at(h - 1), B - h, head[1]);
      }
      break;
    }
    case 'ragwort': {
      // a leafy stem branching into a flat spray of yellow daisies
      const h = 8 + vr, at = stem(C, h, L[0]);
      for (let j = 2; j < h - 3; j += 2) { const lx = at(j); P(lx + (j % 4 ? 1 : -1), B - j, L[1]); P(lx + (j % 4 ? 2 : -2), B - j - 1, L[2]); }
      const hx = at(h - 1), hy = B - h, top = win ? ['#6e5034', '#94744a'] : spr ? [G[1], G[2]] : aut ? ['#c89a2a', '#a87a1a'] : ['#f2c81a', '#e8a820'];
      for (const d of [-1, 1]) { P(hx + d, hy + 1, L[0]); P(hx + d * 2, hy, L[0]); P(hx + d * 3, hy - 1, L[0]); }
      for (const [dx, dy] of [[0, -1], [-2, -2], [2, -2], [-4, -2], [4, -2], [-1, -3], [1, -3], [-3, -3], [3, -3]]) P(hx + dx, hy + dy, top[(dx + dy + 10) % 2]);
      break;
    }
    case 'horsetail': {
      const cols = win ? DEAD : aut ? ['#6a6a24', '#8a8a30', '#aaa848'] : G;
      for (let k = 0, n = 3 + (vr % 2); k < n; k++) {
        const h = 6 + vr + Math.floor(rng() * 4), at = stem(C - 3 + k * 2, h, cols[1], (rng() - 0.5) * 0.8);
        // whorls of fine needles, sloping down, staggered between stems
        for (let j = 2 + (k % 2); j < h - 1; j += 2) P(at(j) + (j % 4 < 2 ? 1 : -1), B - j + 1, cols[0]);
        P(at(h - 1), B - h, cols[2]);
      }
      break;
    }
  }
  return outline ? outlineCanvas(c) : c;
}

// ----- rocks -----
// Pebbles, stones and boulders (some mossy), in a few kinds of rock.
function makeRock(seed, size) {
  const rng = mulberry32(seed * 131 + 7);
  const dims = [[10, 6], [13, 9], [22, 15], [28, 18]][size];
  const W = dims[0] + 2, H = dims[1] + 3;
  const [c, x] = makeCanvas(W, H);
  const tints = [['#6e6a62', '#8e8a80', '#b0aca0'], ['#7a6a58', '#9a8a74', '#bcae94'], ['#5e6266', '#7e8488', '#a4aaae']];
  const [d0, d1, d2] = tints[Math.floor(rng() * tints.length)];
  const base = H - 2;
  if (size === 0) {
    // a scatter of pebbles
    for (let k = 0; k < 5; k++) { const px = 2 + Math.floor(rng() * (W - 5)), py = base - 1 - Math.floor(rng() * 3); x.fillStyle = d1; x.fillRect(px, py, 2 + (k % 2), 2); x.fillStyle = d2; x.fillRect(px, py, 1, 1); }
    return outlineCanvas(c, '#3a3630');
  }
  ellipseFill(x, W / 2, base, W * 0.42, 2, 'rgba(20,40,10,0.25)');
  const rx = dims[0] / 2 - 1, ryy = dims[1] / 2;
  const cx = W / 2, cy = base - ryy;
  // a lumpy outline: a few overlapping lobes
  const lobes = 3 + size;
  for (let k = 0; k < lobes; k++) { const a = (k / lobes) * Math.PI - Math.PI; const lx = cx + Math.cos(a) * rx * 0.45, ly = cy + Math.sin(a) * ryy * 0.3; ellipseFill(x, lx, ly + 1, rx * 0.62, ryy * 0.85, d0); }
  for (let k = 0; k < lobes; k++) { const a = (k / lobes) * Math.PI - Math.PI; const lx = cx + Math.cos(a) * rx * 0.45 - 1, ly = cy + Math.sin(a) * ryy * 0.3 - 1; ellipseFill(x, lx, ly, rx * 0.55, ryy * 0.7, d1); }
  ellipseFill(x, cx - rx * 0.3, cy - ryy * 0.35, rx * 0.35, ryy * 0.3, d2);
  const id = x.getImageData(0, 0, W, H).data;
  const solid = (px, py) => id[(py * W + px) * 4 + 3] > 200;
  // cracks, lichen and (on the big ones) moss on top
  for (let k = 0; k < 4 + size * 3; k++) { const px = Math.floor(rng() * W), py = Math.floor(rng() * base); if (solid(px, py)) { x.fillStyle = k % 3 ? d0 : '#c8c070'; x.fillRect(px, py, 1, 1); } }
  if (size >= 2 && rng() < 0.7) for (let px = 0; px < W; px++) for (let py = 0; py < base; py++) if (solid(px, py) && !solid(px, py - 1) && hash2(px, seed) < 0.65) { x.fillStyle = hash2(px, py) < 0.5 ? '#4a7a32' : '#5e9440'; x.fillRect(px, py, 1, 1 + (hash2(px + 1, seed) < 0.4 ? 1 : 0)); }
  return outlineCanvas(c, '#2e2a26');
}

// What's around a tile, for siting things by habitat.
function habitat(x, y, treeNear) {
  const tiles = World.tiles;
  const near = (r, test) => { for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) if (inMap(i, j) && test(tiles[tIdx(i, j)], i, j)) return true; return false; };
  const shade = near(1, (t, i, j) => treeNear.has(i + ',' + j));
  return {
    shade,
    edge: !shade && near(3, (t, i, j) => treeNear.has(i + ',' + j)),
    field: near(1, (t) => t === T.FIELD || t === T.WEED || t === T.SOIL),
    road: near(1, (t) => t === T.PATH || t === T.COBBLE || t === T.BRIDGE),
    moist: landAt('moist', x, y), soil: landAt('soil', x, y), sun: landAt('sun', x, y), slope: slopeN(x, y),
    flow: landAt('flow', x, y), water: landAt('distWater', x, y),
  };
}

// Long grass, reeds and rocks, where they'd really be: hay meadow on the
// flood ground, a long fringe along the woods, rushes down the wet runnels and
// reeds at the water's edge; rocky outcrops where the banks are steep and the
// soil thin, gravel in the runnels, and cairns of stones cleared off the fields.
function plantNature(rng, addStatic, blk) {
  const tiles = World.tiles;
  World.grass = [];
  const noise = makeNoise(World.seed + 31);
  const open = (x, y) => inMap(x, y) && tiles[tIdx(x, y)] === T.GRASS && !World.reserved[tIdx(x, y)] && !World.block[tIdx(x, y)];
  const treeNear = new Set((World.treeAt || []).map(([x, y]) => x + ',' + y));
  const tuft = (x, y, v) => World.grass.push({ x: x * 16 + 2 + Math.floor(rng() * 12), y: y * 16 + 4 + Math.floor(rng() * 12), v, ph: rng() * 6 });
  // stands of tall grass grow in patches out in the open, away from the lanes and doorsteps
  const tallN = makeNoise(World.seed + 57);
  const tallAt = (x, y, hb, steady) => !hb.road && !hb.field && !hb.shade && hb.water > 1.5 && World.land.settled && World.land.settled[tIdx(x, y)] >= 2
    && tallN(x * 0.13, y * 0.13) + (steady ? 0 : (hash2(x * 7, y * 13) - 0.5) * 0.05) > (hb.soil === SOIL.ALLUVIUM ? 0.6 : 0.66);
  const tallPatch = (x, y, hb) => {
    // planted close in staggered rows, so the stems in front hide whoever walks through;
    // thinner towards the edge of the stand, so it frays out into the meadow
    let edge = 0;
    for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!inMap(x + i, y + j) || !tallAt(x + i, y + j, habitat(x + i, y + j, treeNear), true)) edge++;
    for (let py = 2; py < 16; py += 4) for (let px = (py & 4) ? 3 : 0; px < 16; px += 6) {
      if (edge && rng() < 0.18 * edge) continue;
      World.grass.push({ x: x * 16 + px + Math.floor(rng() * 3), y: y * 16 + py + Math.floor(rng() * 2), v: TALL_V + Math.floor(rng() * 6), ph: rng() * 6 });
    }
  };
  let boulders = 0;
  const rock = (x, y, size, bias = 0) => {
    const img = makeRock(Math.floor(rng() * 9999), size);
    addStatic(img, x * 16 + 8 + Math.round((rng() - 0.5) * 6), y * 16 + 13, { sortBias: size < 2 ? -6 : bias }).rock = size + 1;
    if (size >= 2) { blk(x, y); boulders++; }
  };
  for (let y = 1; y < MAP_H - 1; y++) for (let x = 1; x < MAP_W - 1; x++) {
    if (!open(x, y)) continue;
    const hb = habitat(x, y, treeNear);
    if (tallAt(x, y, hb)) { tallPatch(x, y, hb); continue; }
    // weeds by habitat, in ones and twos
    const pick = (a) => a[Math.floor(rng() * a.length)], settled = World.land.settled ? World.land.settled[tIdx(x, y)] : 99;
    let weeds = null, wp = 0;
    if (hb.road) { weeds = ['dandelion', 'plantain', 'plantain', 'clover']; wp = 0.16; }
    else if (hb.water <= 2.5 || hb.moist > 0.72) { weeds = ['horsetail', 'horsetail', 'dock']; wp = 0.14; }
    else if (hb.field) { weeds = ['thistle', 'ragwort', 'dock', 'sorrel']; wp = 0.22; }
    else if (hb.shade) { weeds = ['bracken', 'bracken', 'nettle', 'parsley']; wp = 0.08; }
    else if (hb.edge) { weeds = ['parsley', 'parsley', 'nettle', 'foxtail']; wp = 0.15; }
    else if (settled <= 3) { weeds = ['nettle', 'dock', 'dandelion', 'clover']; wp = 0.1; }
    else if (hb.soil === SOIL.THIN) { weeds = ['thistle', 'ragwort', 'foxtail']; wp = 0.14; }
    else if (hb.soil === SOIL.ALLUVIUM) { weeds = ['sorrel', 'foxtail', 'clover']; wp = 0.12; }
    else { weeds = ['dandelion', 'clover', 'plantain', 'sorrel', 'sorrel', 'foxtail', 'thistle']; wp = 0.06; }
    if (rng() < wp) { const kind = pick(weeds); for (let k = 0, n = rng() < 0.4 ? 2 : 1; k < n; k++) tuft(x, y, wildV(kind, rng)); }
    if (hb.road) continue;
    // grass and reeds
    let n = 0, reed = false;
    if (hb.water <= 1.5) { reed = true; n = rng() < 0.8 ? 2 + Math.floor(rng() * 2) : 0; }
    else if (hb.flow > 25 && hb.slope < 0.8) { reed = rng() < 0.6; n = rng() < 0.55 ? 1 + Math.floor(rng() * 2) : 0; }
    else if (hb.soil === SOIL.ALLUVIUM) n = rng() < 0.7 ? 2 + Math.floor(rng() * 2) : 0;
    else if (hb.edge || hb.shade) n = rng() < 0.45 ? 1 + Math.floor(rng() * 2) : 0;
    else if (hb.soil === SOIL.CLAY) n = rng() < 0.4 ? 1 + Math.floor(rng() * 2) : 0;
    else if (hb.soil === SOIL.THIN) n = rng() < 0.04 ? 1 : 0;
    else n = noise(x * 0.09, y * 0.09) > 0.6 ? (rng() < 0.55 ? 1 + Math.floor(rng() * 2) : 0) : rng() < 0.05 ? 1 : 0;
    for (let k = 0; k < n; k++) tuft(x, y, reed && rng() < 0.75 ? 6 + Math.floor(rng() * 2) : Math.floor(rng() * 6));
    // rocks
    const r = rng() / gen('rocks');
    if (hb.soil === SOIL.THIN && hb.slope > 0.9 && r < 0.12 && boulders < 45) rock(x, y, r < 0.04 ? 3 : 2);
    else if (hb.soil === SOIL.THIN && r < 0.06) rock(x, y, 1);
    else if (hb.flow > 40 && hb.water > 1.5 && r < 0.18) rock(x, y, 0);
    else if (hb.field && r < 0.035) { rock(x, y, 1); if (rng() < 0.6) rock(x, y, 0); }
    else if (hb.shade && r < 0.015 && boulders < 45) rock(x, y, 2);
    else if (r < 0.006) rock(x, y, 0);
  }
}

// Wildflowers by habitat: buttercups, daisies and clover in the meadows,
// bluebells and wood anemones under the trees, marsh marigolds, irises and
// ragged robin in wet ground, poppies and cornflowers at the field edges,
// primroses, campion, foxgloves and asters along the woods, harebells and
// thyme on the thin dry banks. They grow in drifts, and only in their season.
const FLOWER_KINDS = {
  buttercup: { cols: [['#f2d24a', '#fff2a0']], seasons: ['spring', 'summer'] },
  daisy: { cols: [['#ffffff', '#f2d24a']], seasons: ['spring', 'summer', 'autumn'] },
  clover: { cols: [['#c86aa8', '#e8a0c8']], seasons: ['summer'] },
  bluebell: { cols: [['#5a6ad8', '#8a9aff']], seasons: ['spring'], bell: true },
  anemone: { cols: [['#f4f0f8', '#ffffff']], seasons: ['spring'] },
  marigold: { cols: [['#f2b81a', '#ffe070']], seasons: ['spring', 'summer'] },
  iris: { cols: [['#e8c82a', '#fff08a']], seasons: ['summer'], tall: true },
  robin: { cols: [['#e86aa8', '#ffb0d0']], seasons: ['summer'] },
  primrose: { cols: [['#f4e88a', '#fffac8']], seasons: ['spring'] },
  campion: { cols: [['#e85a8a', '#ffa0c0']], seasons: ['spring', 'summer'] },
  poppy: { cols: [['#e8322a', '#ff8a6a']], seasons: ['summer'] },
  cornflower: { cols: [['#3a6ae8', '#8ab0ff']], seasons: ['summer'] },
  foxglove: { cols: [['#b05ac8', '#e0a0f0']], seasons: ['summer'], tall: true, bell: true },
  harebell: { cols: [['#7a8ae8', '#b8c0ff']], seasons: ['summer', 'autumn'], bell: true },
  thyme: { cols: [['#c87ab0', '#e8b0d8']], seasons: ['summer'] },
  aster: { cols: [['#9a6ad8', '#c8b0ff']], seasons: ['autumn'] },
};
function flowerKindFor(hb, rng) {
  const pick = (a) => a[Math.floor(rng() * a.length)];
  if (hb.moist > 0.62 || hb.water <= 2) return [pick(['marigold', 'iris', 'robin', 'marigold']), 0.5];
  if (hb.shade) return [pick(['bluebell', 'bluebell', 'anemone']), 0.4];
  if (hb.field) return [pick(['poppy', 'poppy', 'cornflower']), 0.4];
  if (hb.edge) return [pick(['primrose', 'campion', 'foxglove', 'aster']), 0.32];
  if (hb.soil === SOIL.THIN) return [pick(['harebell', 'thyme']), 0.3];
  if (hb.soil === SOIL.ALLUVIUM || (hb.soil === SOIL.LOAM && hb.sun > 0.5)) return [pick(['buttercup', 'daisy', 'clover', 'buttercup']), 0.25];
  return [pick(['daisy', 'buttercup']), 0.05];
}
function plantWildflowers(rng) {
  const tiles = World.tiles;
  const treeNear = new Set((World.treeAt || []).map(([x, y]) => x + ',' + y));
  const ok = (x, y) => inMap(x, y) && (tiles[tIdx(x, y)] === T.GRASS || tiles[tIdx(x, y)] === T.LAWN) && !World.block[tIdx(x, y)];
  let placed = 0;
  for (let k = 0; k < 2600 * gen('flowers') && placed < 420 * gen('flowers'); k++) {
    const x = Math.floor(rng() * MAP_W), y = Math.floor(rng() * MAP_H);
    if (!ok(x, y)) continue;
    const hb = habitat(x, y, treeNear);
    const [kind, p] = flowerKindFor(hb, rng);
    if (rng() > p) continue;
    // a drift of the same kind
    const n = 1 + Math.floor(rng() * 3);
    for (let d = 0; d < n; d++) {
      const fx = x + (d ? Math.round((rng() - 0.5) * 2.4) : 0), fy = y + (d ? Math.round((rng() - 0.5) * 2) : 0);
      if (!ok(fx, fy)) continue;
      World.flowers.push({ x: fx * 16 + Math.floor(rng() * 8) + 4, y: fy * 16 + Math.floor(rng() * 8) + 10, seed: Math.floor(rng() * 9999), kind, ground: true });
      placed++;
    }
  }
}

// A hobbit-hole's hill grows wild on top: clumps of long grass, drifts of
// wildflowers (a spring kind, a summer kind and one that lasts into autumn,
// so the hill is never bare of colour) and a fern, heather or leafy plant or
// two. All of it keeps off the stone face, the door and windows, and clear of
// the chimneys and the roof window. Each hill's planting comes from its home,
// so it's the same every time the village is loaded.
function plantHill(h) {
  const sh = homeShape(h.def, h.id, Math.round(h.doorY / 16) - 1);
  const rng = mulberry32(h.id * 7717 + 91);
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const cx = sh.hcx * 16, cy = sh.hcy * 16, rx = sh.hrx * 16, ry = sh.hry * 16;
  const keepClear = [h.chimney, h.chimney2, h.roofWin].filter(Boolean);
  const size = (rx * ry) / 5000; // a big hill gets more of everything
  const ok = (x, y, edge = 0.86) => {
    if (sh.u(x / 16, y / 16) > edge) return false;
    const b = sh.bottom(x / 16);
    if (b == null || y > b * 16 - 24) return false;
    return !keepClear.some((c) => Math.abs(c.x - x) < 10 && y > c.y - 16 && y < c.y + 8);
  };
  // long grass grows in a few thick clumps, thinner between
  const clumps = Array.from({ length: 3 + Math.floor(rng() * 3) }, () => [cx + (rng() - 0.5) * rx * 1.4, cy + (rng() - 0.6) * ry * 1.1]);
  for (let y = cy - ry; y < cy + ry; y += 6) for (let x = cx - rx; x < cx + rx; x += 6) {
    const tx = Math.round(x + (rng() - 0.5) * 5), ty = Math.round(y + (rng() - 0.5) * 4);
    if (!ok(tx, ty)) continue;
    const near = Math.min(...clumps.map(([qx, qy]) => Math.hypot(qx - tx, (qy - ty) * 1.4)));
    if (rng() < 0.12 + 0.62 * Math.exp(-(near * near) / (2 * 15 * 15))) World.grass.push({ x: tx, y: ty, v: Math.floor(rng() * 6), ph: rng() * 6 });
  }
  // drifts of wildflowers
  const kinds = [pick(['buttercup', 'primrose', 'campion', 'bluebell']), pick(['clover', 'poppy', 'thyme', 'foxglove', 'cornflower']), pick(['daisy', 'harebell', 'aster'])];
  for (let d = 0, n = 2 + Math.round(size * 1.6) + Math.floor(rng() * 3); d < n; d++) {
    const kind = kinds[d % kinds.length], ax = cx + (rng() - 0.5) * rx * 1.5, ay = cy + (rng() - 0.65) * ry * 1.2;
    for (let k = 0, m = 3 + Math.floor(rng() * 3); k < m; k++) {
      const fx = Math.round(ax + (rng() - 0.5) * 22), fy = Math.round(ay + (rng() - 0.5) * 12);
      if (ok(fx, fy, 0.82)) World.flowers.push({ x: fx, y: fy, seed: Math.floor(rng() * 9999), kind, ground: true });
    }
  }
  // a few weeds among the grass
  const hillWeeds = ['clover', 'dandelion', 'sorrel', 'foxtail', 'foxtail', 'thistle', 'ragwort'];
  for (let k = 0, n = 2 + Math.round(size * 1.5) + Math.floor(rng() * 3); k < n; k++) {
    const x = Math.round(cx + (rng() - 0.5) * rx * 1.5), y = Math.round(cy + (rng() - 0.6) * ry * 1.2);
    if (ok(x, y)) World.grass.push({ x, y, v: wildV(pick(hillWeeds), rng), ph: rng() * 6 });
  }
  // a fern, a sprig of heather or a leafy plant or two (the bush kinds by seed: 0 round, 4 fern, 6 heather)
  const plants = [0, 4, 6];
  for (let k = 0, n = 1 + Math.round(size * 0.5) + Math.floor(rng() * 2), tries = 0; k < n && tries < 30; tries++) {
    const x = Math.round(cx + (rng() - 0.5) * rx * 1.4), y = Math.round(cy + (rng() - 0.7) * ry * 1.1);
    if (!ok(x, y, 0.78) || World.statics.some((s) => Math.abs(s.x - x) < 16 && Math.abs(s.y - y) < 12)) continue;
    const seed = 700 + Math.floor(rng() * 40) * 7 + pick(plants);
    World._addStatic(makeBush(seed), x, y, { gen: { type: 'bush', seed } });
    k++;
  }
}

// ---------------------------------------------------------------------------
// Woods by suitability. Woodland grows where nobody has cleared it: on the
// steep, thin-soiled banks and wet clay that nobody farms, thick along the
// edges of the valley and in the eastern forest, and thinning out towards
// the lanes, fields and homes. Trees are spaced by their size (a big oak
// keeps the ground round it to itself) and each kind grows where it suits:
// oaks on deep loam and clay, birches and pines on thin dry soil and the
// heights, poplars on the damp flood ground, saplings springing up at the
// woods' edge. Then bushes gather at the edges by kind: gorse and heather on
// the dry banks, ferns and holly in the shade, brambles and thorn along the
// margins.
// ---------------------------------------------------------------------------
function plantWoods(rng, { addStatic, blk, nearRoad, nearNonGrass, noise, treeAt }) {
  const W = MAP_W, H = MAP_H, tiles = World.tiles;
  // how far every tile is from where folk live and work
  const settled = new Float32Array(W * H).fill(99), q = [];
  for (let i = 0; i < W * H; i++) {
    const t = tiles[i];
    if ((t !== T.GRASS && t !== T.WATER) || World.reserved[i]) { settled[i] = 0; q.push(i); }
  }
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (settled[i] + 1 < settled[n]) { settled[n] = settled[i] + 1; q.push(n); }
    }
  }
  World.land.settled = settled;
  // the chance of woodland on each tile
  const potential = (x, y) => {
    const i = y * W + x;
    const border = y <= 3 || y >= H - 3 || x <= 1 || x >= W - 2;
    if (border) return y <= 3 ? 0.65 : 0.45;
    if (x >= 112) return 0.35 + (x - 112) * 0.02;
    const soil = World.land.soil[i], slope = slopeN(x, y), moist = World.land.moist[i];
    let p = soil === SOIL.THIN ? 0.28 + slope * 0.12 : soil === SOIL.CLAY ? 0.26 : soil === SOIL.ALLUVIUM ? 0.05 : 0.04;
    if (moist > 0.85) p *= 0.4;
    p += Math.max(0, noise(x * 0.11, y * 0.11) - 0.6) * 0.8;
    // cleared round the village, with a ragged edge
    const d = settled[i];
    p *= clamp((d - 1.5 + (noise(x * 0.3, y * 0.3) - 0.5) * 3) / 6, 0, 1);
    return p;
  };
  // which kind of tree suits a tile
  const kindFor = (x, y) => {
    const i = y * W + x, soil = World.land.soil[i], h = World.land.h[i], moist = World.land.moist[i], d = settled[i];
    const edge = y <= 4 || x >= 116 || y >= H - 4;
    const w = {
      oak: soil === SOIL.LOAM ? 1 : soil === SOIL.CLAY ? 0.9 : soil === SOIL.ALLUVIUM ? 0.5 : 0.15,
      beech: soil === SOIL.LOAM || soil === SOIL.CLAY ? 0.45 : 0.06,
      copper: soil === SOIL.LOAM ? 0.04 : 0,
      birch: soil === SOIL.THIN ? 0.9 : 0.25 + (d < 5 ? 0.3 : 0),
      pine: (soil === SOIL.THIN && h > 0.5 ? 0.8 : 0.05) + (edge ? 0.5 : 0),
      fir: (h > 0.6 ? 0.5 : 0.04) + (edge ? 0.35 : 0),
      poplar: moist > 0.5 && soil !== SOIL.THIN ? 0.6 : 0.03,
      sapling: d < 5 ? 0.45 : 0.12,
    };
    const tot = Object.values(w).reduce((a, b) => a + b, 0);
    let r = rng() * tot;
    for (const k in w) { r -= w[k]; if (r <= 0) return k; }
    return 'oak';
  };
  const RADIUS = { oak: 2.1, beech: 2.2, copper: 2.2, birch: 1.4, pine: 1.6, fir: 1.4, poplar: 1.3, sapling: 1.0 };
  const placed = []; // [x, y, radius]
  const order = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) order.push([x, y]);
  for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
  const grid = new Map();
  const near = (x, y, r) => { for (let j = Math.floor(y - 3); j <= y + 3; j++) for (let i = Math.floor(x - 3); i <= x + 3; i++) { const o = grid.get(i + ',' + j); if (o && Math.hypot(o[0] - x, o[1] - y) < Math.max(r, o[2]) * 0.85) return true; } return false; };
  for (const [x, y] of order) {
    if (tiles[tIdx(x, y)] !== T.GRASS || World.reserved[tIdx(x, y)] || World.block[tIdx(x, y)] || nearRoad(x, y, 1)) continue;
    const p = potential(x, y);
    if (p <= 0 || rng() > p * 2.2 * gen('woods')) continue;
    // a big tree keeps more ground round it to itself than a small one
    const kind = kindFor(x, y), [s0, sn] = TREE_SEEDS[kind], tseed = s0 + Math.floor(rng() * sn);
    const r = RADIUS[kind] * (0.55 + 0.45 * treeShape(tseed, kind).s);
    if (near(x, y, r) || onBank(x, y)) continue;
    addStatic(makeTree(tseed, kind), x * 16 + 8 + Math.round((rng() - 0.5) * 4), (y + 1) * 16 - 2, { gen: { type: 'tree', seed: tseed, kind } });
    blk(x, y); treeAt.push([x, y]); grid.set(x + ',' + y, [x, y, r]);
    const border = y <= 3 || y >= H - 3 || x <= 1 || x >= W - 2 || x >= 112;
    if (!border && walkable(x, y + 1) && tiles[tIdx(x, y + 1)] === T.GRASS && World.shade.length < 22 && rng() < 0.6) World.shade.push(makeSpot(x * 16 + 8, (y + 1) * 16 + 10, 'down', 'sit', 'shade'));
  }
  // bushes: thick along the edges of the woods, scattered elsewhere, by kind
  const treeSet = new Set(treeAt.map(([x, y]) => x + ',' + y));
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (tiles[tIdx(x, y)] !== T.GRASS || World.reserved[tIdx(x, y)] || World.block[tIdx(x, y)] || nearRoad(x, y, 0) || nearNonGrass(x, y, 0)) continue;
    let trees = 0;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (treeSet.has((x + i) + ',' + (y + j))) trees++;
    const edge = trees >= 1 && trees <= 4, deep = trees > 4;
    if (rng() > (edge ? 0.16 : deep ? 0.05 : 0.008) || onBank(x, y)) continue;
    const i = y * W + x, soil = World.land.soil[i], sun = World.land.sun[i], moist = World.land.moist[i];
    // round, bramble, thorn, gorse, fern, holly, heather
    let kind;
    if (soil === SOIL.THIN && sun > 0.55) kind = rng() < 0.6 ? 3 : 6;
    else if (deep || moist > 0.6) kind = rng() < 0.55 ? 4 : 5;
    else if (edge) kind = [1, 2, 1, 0, 2][Math.floor(rng() * 5)];
    else kind = rng() < 0.6 ? 0 : 2;
    const bs = 500 + kind + 7 * Math.floor(rng() * 10);
    addStatic(makeBush(bs), x * 16 + 8, y * 16 + 14, { gen: { type: 'bush', seed: bs } });
    blk(x, y);
  }
}

// ---------------------------------------------------------------------------
// Hedgerows: hawthorn hedges round the barley and leaf fields and along the
// country lanes outside the village, with a gateway every few yards and an
// oak or ash left to grow up out of the hedge as a "standard" now and then.
// White with may blossom in spring, red with haws in autumn, bare in winter.
// ---------------------------------------------------------------------------
function makeHedge(seed, season = 'summer', len = 1, dir = 'h') {
  const rng = mulberry32(seed + len * 101);
  const W = dir === 'h' ? len * 16 + 2 : 18, H = dir === 'h' ? 15 : len * 16 + 6;
  const [c, x] = makeCanvas(W, H);
  const winter = season === 'winter', autumn = season === 'autumn', spring = season === 'spring';
  const pal = winter ? ['#4a3a2a', '#5a4632', '#6a5440'] : autumn ? ['#3a4a1e', '#5a6a2a', '#7a7a3a'] : spring ? ['#2e5a24', '#447a30', '#62a040'] : ['#24461f', '#336128', '#467f34'];
  const base = H - 3;
  ellipseFill(x, W / 2, base, W / 2 - 1, 2, 'rgba(20,40,10,0.22)');
  // one long, lumpy run of leaves (or a tall clipped block for the up-and-down stretches)
  const top = 3;
  x.fillStyle = pal[0]; x.fillRect(1, top + 4, W - 2, base - top - 4);
  if (dir === 'h') for (let k = 1; k < W - 1; k += 3) { const r = 3 + (hash2(k, seed) * 1.6) | 0; disc(x, k, top + 4 + (k % 2), r, pal[0]); disc(x, k - 0.5, top + 3 + (k % 2), r - 1, pal[1]); }
  else for (let k = top + 3; k < base - 2; k += 3) { for (const sx of [3, 9, 15]) { const r = 3 + (hash2(k, seed + sx) * 1.4) | 0; disc(x, sx, k, r, pal[0]); disc(x, sx - 0.5, k - 1, r - 1, pal[1]); } }
  for (let k = 0; k < W * 0.9; k++) { x.fillStyle = k % 2 ? pal[2] : pal[0]; x.fillRect(1 + Math.floor(rng() * (W - 2)), top + 1 + Math.floor(rng() * (base - top - 2)), 1, 1); }
  if (winter) { x.fillStyle = '#3a2a1a'; for (let k = 1; k < W - 1; k += 3) x.fillRect(k, top + (k % 2), 1, 4); }
  const dots = (n, cols) => { for (let k = 0; k < n; k++) { x.fillStyle = cols[k % cols.length]; x.fillRect(1 + Math.floor(rng() * (W - 2)), top + 1 + Math.floor(rng() * (base - top - 4)), 1, 1); } };
  if (spring) dots(Math.round(W * 0.9), ['#ffffff', '#f8eef0']);
  if (autumn) dots(Math.round(W * 0.6), ['#c82a2a', '#a81a1a']);
  const o = outlineCanvas(c, '#18301a');
  return winter ? addSnow(o, 0, base, 2, seed) : o;
}
function plantHedges(rng, { addStatic, blk }) {
  const tiles = World.tiles;
  World.hedges = [];
  // field edges are kept clear of building plots anyway, so hedges may go there
  let fieldEdge = false;
  const free = (x, y) => inMap(x, y) && tiles[tIdx(x, y)] === T.GRASS && (fieldEdge || !World.reserved[tIdx(x, y)]) && !World.block[tIdx(x, y)];
  const nextToPath = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => [T.PATH, T.COBBLE, T.BRIDGE].includes(tiles[tIdx(x + dx, y + dy)]));
  // lays one straight stretch: a gate every so often and wherever a lane meets
  // it, a standard tree now and then, and the hedge between drawn in one piece
  const run = (cells, dir, minLen = 1) => {
    let seg = [], n = 0;
    const flush = () => {
      if (seg.length < minLen) { seg = []; return; }
      const seed = 700 + Math.floor(rng() * 12);
      if (dir === 'h') {
        const [x0, y] = seg[0], len = seg.length;
        const s = addStatic(makeHedge(seed, 'summer', len, 'h'), x0 * 16 + len * 8, y * 16 + 14, { gen: { type: 'hedge', seed, len, dir: 'h' }, sway: 0.12 });
        World.hedges.push({ cells: seg.slice(), s });
      } else {
        const [x, y0] = seg[0], len = seg.length;
        const s = addStatic(makeHedge(seed, 'summer', len, 'v'), x * 16 + 8, (y0 + len - 1) * 16 + 16, { gen: { type: 'hedge', seed, len, dir: 'v' }, sway: 0.08 });
        World.hedges.push({ cells: seg.slice(), s });
      }
      for (const [x, y] of seg) blk(x, y);
      seg = [];
    };
    cells.forEach(([x, y], i) => {
      n++;
      if (!free(x, y) || nextToPath(x, y) || i % 8 === 4 || i % 8 === 5) { flush(); n = 0; return; }
      if (n % 9 === 0 && rng() < 0.7) {
        flush();
        const kind = rng() < 0.5 ? 'oak' : rng() < 0.6 ? 'birch' : 'beech', [s0, sn] = TREE_SEEDS[kind], seed = s0 + Math.floor(rng() * sn);
        addStatic(makeTree(seed, kind), x * 16 + 8, (y + 1) * 16 - 2, { gen: { type: 'tree', seed, kind } });
        (World.treeAt || []).push([x, y]); blk(x, y);
        return;
      }
      seg.push([x, y]);
    });
    flush();
  };
  const ring = (r) => {
    const top = [], bot = [], left = [], right = [];
    for (let x = r.x0 - 1; x <= r.x1 + 1; x++) { top.push([x, r.y0 - 1]); bot.push([x, r.y1 + 1]); }
    for (let y = r.y0; y <= r.y1; y++) { left.push([r.x0 - 1, y]); right.push([r.x1 + 1, y]); }
    run(top, 'h'); run(bot, 'h'); run(left, 'v'); run(right, 'v');
  };
  if (gen('hedges') > 0) {
    fieldEdge = true;
    for (const f of FIELDS) ring(f);
    ring(WEED_FIELD);
    fieldEdge = false;
  }
  // along the country lanes, well away from the village centre
  for (const [w, ...pts] of ROADS) {
    if (w < 0.85) continue;
    for (let s = 0; s < pts.length - 1; s++) {
      const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
      const len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len;
      for (const side of [-1, 1]) {
        const cells = [];
        for (let t = 0; t <= len; t += 1) {
          const px = ax + (bx - ax) * (t / len) + nx * side * (w + 1.2), py = ay + (by - ay) * (t / len) + ny * side * (w + 1.2);
          const x = Math.round(px), y = Math.round(py);
          if (Math.hypot(x - PLAZA.cx, y - PLAZA.cy) < 24 || (cells.length && cells[cells.length - 1][0] === x && cells[cells.length - 1][1] === y)) continue;
          cells.push([x, y]);
        }
        if (rng() < gen('hedges')) {
          // break the line into straight stretches, each across or up-and-down
          let part = [];
          const go = () => { if (part.length > 3) run(part, part[0][1] === part[part.length - 1][1] ? 'h' : 'v', 3); part = []; };
          for (const c of cells) { if (part.length && c[1] !== part[part.length - 1][1] && c[0] !== part[part.length - 1][0]) go(); part.push(c); }
          go();
        }
      }
    }
  }
}
// Makes sure no hedge (or anything else) cuts anyone off from where they
// need to go: if something important can't be reached from the village
// square, the hedges nearest it are opened up.
function keepReachable() {
  const W = MAP_W, H = MAP_H;
  const reach = () => {
    const seen = new Uint8Array(W * H), q = [];
    const s = nearestWalkable(PLAZA.cx, PLAZA.cy);
    if (!s) return seen;
    seen[tIdx(s[0], s[1])] = 1; q.push(s);
    for (let k = 0; k < q.length; k++) {
      const [x, y] = q[k];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (walkable(nx, ny) && !seen[tIdx(nx, ny)]) { seen[tIdx(nx, ny)] = 1; q.push([nx, ny]); } }
    }
    return seen;
  };
  const targets = [];
  for (const h of World.homes) targets.push(h.stepTile);
  for (const b of Object.values(World.buildings)) targets.push([Math.floor(b.stepX / 16), Math.floor(b.stepY / 16)]);
  for (const f of World.fields) for (const p of f.plots) targets.push([p.tx, p.ty]);
  for (const list of [World.woodSpots, World.mushrooms, World.wildHerbs]) for (const m of list) targets.push([m.tx, m.ty]);
  for (const s of World.fishing.concat(World.benches)) targets.push([Math.floor(s.x / 16), Math.floor(s.y / 16)]);
  for (let pass = 0; pass < 6; pass++) {
    const seen = reach();
    const lost = targets.filter(([x, y]) => inMap(x, y) && walkable(x, y) && !seen[tIdx(x, y)]);
    if (!lost.length) return;
    // open the hedges round each stranded place
    for (const [x, y] of lost) {
      for (const hd of World.hedges) {
        if (hd.gone || !hd.cells.some(([hx, hy]) => Math.abs(hx - x) <= 4 + pass * 2 && Math.abs(hy - y) <= 4 + pass * 2)) continue;
        hd.gone = true; hd.s.hidden = true; hd.s.seasons = [];
        for (const [hx, hy] of hd.cells) World.block[tIdx(hx, hy)] = 0;
      }
    }
  }
}
