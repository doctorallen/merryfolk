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
  let boulders = 0;
  const rock = (x, y, size, bias = 0) => {
    const img = makeRock(Math.floor(rng() * 9999), size);
    addStatic(img, x * 16 + 8 + Math.round((rng() - 0.5) * 6), y * 16 + 13, { sortBias: size < 2 ? -6 : bias });
    if (size >= 2) { blk(x, y); boulders++; }
  };
  for (let y = 1; y < MAP_H - 1; y++) for (let x = 1; x < MAP_W - 1; x++) {
    if (!open(x, y)) continue;
    const hb = habitat(x, y, treeNear);
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
  const RADIUS = { oak: 2.1, birch: 1.4, pine: 1.6, fir: 1.4, poplar: 1.3, sapling: 1.0 };
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
    const kind = kindFor(x, y), r = RADIUS[kind];
    if (near(x, y, r)) continue;
    const [s0, sn] = TREE_SEEDS[kind];
    const tseed = s0 + Math.floor(rng() * sn);
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
    if (rng() > (edge ? 0.16 : deep ? 0.05 : 0.008)) continue;
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
        const kind = rng() < 0.6 ? 'oak' : 'birch', [s0, sn] = TREE_SEEDS[kind], seed = s0 + Math.floor(rng() * sn);
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
