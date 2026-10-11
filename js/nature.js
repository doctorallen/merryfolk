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
// A tuft is drawn at double resolution in five leaning poses, per season.
const TUFT_CACHE = new Map();
const TUFT_W = 18, TUFT_H = 26;
function tuftSprite(v, season, lean) {
  const key = v + ':' + season + ':' + lean;
  let c = TUFT_CACHE.get(key);
  if (c) return c;
  let ctx;
  [c, ctx] = makeCanvas(TUFT_W, TUFT_H);
  const rng = mulberry32(v * 977 + 5);
  const reed = v >= 6;
  const winter = season === 'winter';
  const greens = {
    spring: ['#3f7a2c', '#5c9a3a', '#86c24e'], summer: ['#2e5a20', '#467a2c', '#7aa83e'],
    autumn: ['#7a6a2a', '#a8903a', '#d0b85a'], winter: ['#6a5a3a', '#8a7a52', '#b0a078'],
  }[season];
  const blades = reed ? 5 : 6 + (v % 3);
  for (let i = 0; i < blades; i++) {
    const bx = 3 + Math.round(rng() * (TUFT_W - 7));
    const h = Math.round((reed ? 16 : 7) + rng() * (reed ? 8 : 6 + (v % 2) * 4)) * (winter && !reed ? 0.6 : 1);
    const bend = (rng() - 0.5) * 2 + lean * 1.6;
    for (let j = 0; j < h; j++) {
      const f = j / h;
      const px = Math.round(bx + bend * f * f * (reed ? 1.4 : 1)), py = TUFT_H - 1 - j;
      ctx.fillStyle = f < 0.35 ? greens[0] : f < 0.75 ? greens[1] : greens[2];
      ctx.fillRect(px, py, 1, 1);
    }
    const tipX = Math.round(bx + bend * (reed ? 1.4 : 1)), tipY = TUFT_H - h;
    // seed heads in summer, bulrush heads on the reeds, snow in winter
    if (reed && i % 2 === 0) { ctx.fillStyle = winter ? '#6a4a2a' : '#7a4a22'; ctx.fillRect(tipX - 1, tipY + 1, 2, 4); ctx.fillStyle = '#a06a3a'; ctx.fillRect(tipX - 1, tipY + 1, 1, 1); }
    else if (!reed && season === 'summer' && i % 3 === 0) { ctx.fillStyle = '#d8c890'; ctx.fillRect(tipX, tipY - 1, 1, 2); }
    else if (winter && i % 2 === 0) { ctx.fillStyle = '#f4f8ff'; ctx.fillRect(tipX, tipY, 1, 1); }
  }
  c.hd = true;
  TUFT_CACHE.set(key, c);
  return c;
}
function drawTuft(ctx, g) {
  const w = windAt(g.x, g.y) + Math.sin(tReal * 2.6 + g.ph) * 0.25 * Wind.s;
  const lean = clamp(Math.round(w * 1.6), -1, 2);
  const spr = tuftSprite(g.v, World.season, lean);
  ctx.drawImage(spr, g.x - TUFT_W / RS / 2, g.y - TUFT_H / RS + 1, TUFT_W / RS, TUFT_H / RS);
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

// Scatters long grass, reeds and rocks over the open country, once the map
// and its trees are laid out.
function plantNature(rng, addStatic, blk) {
  const tiles = World.tiles;
  World.grass = [];
  const noise = makeNoise(World.seed + 31);
  const open = (x, y) => inMap(x, y) && tiles[tIdx(x, y)] === T.GRASS && !World.reserved[tIdx(x, y)] && !World.block[tIdx(x, y)];
  const near = (x, y, r, test) => { for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) if (inMap(i, j) && test(tiles[tIdx(i, j)], i, j)) return true; return false; };
  const roadish = (t) => t === T.PATH || t === T.COBBLE || t === T.BRIDGE;
  const treeNear = new Set((World.treeAt || []).map(([x, y]) => x + ',' + y));
  for (let y = 1; y < MAP_H - 1; y++) for (let x = 1; x < MAP_W - 1; x++) {
    if (!open(x, y) || near(x, y, 1, roadish)) continue;
    const water = near(x, y, 1, (t) => t === T.WATER);
    const woods = near(x, y, 2, (t, i, j) => treeNear.has(i + ',' + j));
    const meadow = noise(x * 0.09, y * 0.09);
    let n = 0;
    if (water) n = rng() < 0.75 ? 2 + Math.floor(rng() * 2) : 0;
    else if (meadow > 0.58) n = rng() < 0.7 ? 1 + Math.floor(rng() * 3) : 0;
    else if (woods) n = rng() < 0.4 ? 1 + Math.floor(rng() * 2) : 0;
    else if (rng() < 0.06) n = 1;
    for (let k = 0; k < n; k++) World.grass.push({ x: x * 16 + 2 + Math.floor(rng() * 12), y: y * 16 + 4 + Math.floor(rng() * 12), v: water && rng() < 0.7 ? 6 + Math.floor(rng() * 2) : Math.floor(rng() * 6), ph: rng() * 6 });
  }
  // rocks: pebbles and stones anywhere open, boulders in the woods and on the banks
  let boulders = 0;
  for (let k = 0; k < 900; k++) {
    const x = 1 + Math.floor(rng() * (MAP_W - 2)), y = 1 + Math.floor(rng() * (MAP_H - 2));
    if (!open(x, y) || near(x, y, 1, roadish)) continue;
    const woods = near(x, y, 2, (t, i, j) => treeNear.has(i + ',' + j)), water = near(x, y, 2, (t) => t === T.WATER);
    const r = rng();
    let size;
    if ((woods || water) && r < 0.35 && boulders < 40) size = r < 0.12 ? 3 : 2;
    else if (r < 0.55) size = 0;
    else if (r < 0.8) size = 1;
    else continue;
    if (rng() > (woods || water ? 0.5 : 0.18)) continue;
    const seed = Math.floor(rng() * 9999);
    const img = makeRock(seed, size);
    addStatic(img, x * 16 + 8 + Math.round((rng() - 0.5) * 6), y * 16 + 13, { sortBias: size < 2 ? -6 : 0 });
    if (size >= 2) { blk(x, y); boulders++; }
  }
}
