// @ts-check
'use strict';
// ---------------------------------------------------------------------------
// The lie of the village: where the river runs, the square, the inn and the
// workshops, the knolls the hobbit-holes are dug into, the fields, the party
// field, the pond, the lanes between them, and the spots the village grows
// into later. The original valley of Thistledown is `CLASSIC_LAYOUT`, with
// every number it always had; new valleys are planned from their seed by
// `planValley` (further down). `applyLayout` sets the globals the rest of the
// game reads (PLAZA, PARTY, ROADS and so on) from whichever is in use.
// ---------------------------------------------------------------------------

// The heart of the village, set by applyLayout (used by town.js and others).
let TOWN_CENTER = { x: 62, y: 46 };

const CLASSIC_LAYOUT = {
  w: 128, h: 96,
  // the river: y = base + meanders (see makeRiverY), calming near calmX
  river: { base: 54, calmX: 36, tilt: 0, waves: [[2.5, 0.06, 0.8], [1.2, 0.17, 0]], wild: [1.3, 0.11, 2] },
  // hobbit-holes: `site` marks a grassy knoll where a new home can be dug
  homes: [
    { cx: 64, cy: 9, rx: 9, ry: 5.5, grand: true },
    { cx: 46, cy: 16, rx: 5, ry: 3.5 },
    { cx: 33, cy: 21, rx: 4.5, ry: 3 },
    { cx: 20, cy: 25, rx: 4.5, ry: 3 },
    { cx: 80, cy: 18, rx: 5, ry: 3.5 },
    { cx: 50, cy: 40, rx: 4.5, ry: 3 },
    { cx: 33, cy: 36, rx: 4.5, ry: 3 },
    { cx: 92, cy: 32, rx: 4.5, ry: 3 },
    { cx: 46, cy: 66, rx: 4.5, ry: 3 },
    { cx: 82, cy: 66, rx: 4.5, ry: 3 },
    { cx: 36, cy: 47, rx: 4.5, ry: 3, site: true },
    { cx: 98, cy: 44, rx: 4.5, ry: 3, site: true },
    { cx: 36, cy: 62, rx: 4.5, ry: 3, site: true },
    { cx: 12, cy: 62, rx: 4.5, ry: 3, site: true },
    { cx: 72, cy: 80, rx: 4.5, ry: 3, site: true },
    { cx: 88, cy: 86, rx: 4.5, ry: 3, site: true },
  ],
  roads: [
    [1.1, [64, 15], [64, 25]],
    [1.1, [64, 31], [64, 46], [64, 58], [64, 72], [64, 92]],
    [1.0, [0, 30], [14, 30], [26, 29], [40, 29], [52, 28.5], [61, 28]],
    [1.0, [67, 27], [80, 26], [91, 22]],
    [0.85, [80, 22], [80, 26]],
    [0.85, [46, 20], [50, 24], [56, 26], [61, 27]],
    [0.85, [33, 25], [36, 29]],
    [0.85, [50, 44], [56, 42], [62, 40]],
    [0.85, [33, 40], [40, 42], [46, 44], [50, 44]],
    [0.85, [92, 36], [86, 39], [82, 42]],
    [0.85, [80, 26], [86, 30], [92, 36], [100, 38], [106, 38]],
    [0.85, [106, 38], [104, 46], [102, 50], [102, 58], [106, 64]],
    [0.8, [98, 48], [102, 50]],
    [0.9, [24, 30], [25, 40], [26, 50], [26, 60], [26, 73]],
    [0.85, [36, 51], [30, 50], [26, 50]],
    [0.85, [14, 30], [14, 20], [17, 13]],
    [0.9, [64, 73], [46, 73], [26, 73], [12, 73]],
    [0.85, [46, 70], [46, 73]],
    [0.85, [36, 66], [36, 73]],
    [0.85, [12, 66], [12, 73]],
    [0.9, [64, 72], [82, 72], [92, 72], [100, 68], [106, 64]],
    [0.85, [82, 70], [82, 72]],
    [0.85, [64, 86], [72, 84]],
    [0.85, [64, 90], [80, 90], [88, 90]],
    [0.8, [64, 43], [68, 43]],
    [0.8, [82, 42], [78, 43]],
    [0.8, [59, 70], [64, 70]],
    [0.85, [86, 8], [87, 15], [89, 20], [91, 22]],
  ],
  pond: { cx: 100, cy: 78, rx: 6, ry: 4 },
  party: { cx: 100, cy: 16, rx: 11, ry: 7, treeX: 100, treeY: 12, danceX: 100, danceY: 17.4, tables: [[91, 14], [109, 14], [92, 20], [108, 20], [100, 22]], maypole: [94.5, 18.6], bonfire: [106, 18], hay: [[88, 10], [113, 19]] },
  plaza: { cx: 64, cy: 28, r: 4, well: [67.5, 25], wellBlk: [67, 24], stall: [60.5, 25.4], stallBlk: [[59, 24], [60, 24], [61, 24]], market: [60.5, 26.3], board: [68.5, 31.3], boardBlk: [68, 30], post: [68.5, 32], sign: [60, 31.5], signBlk: [59, 30] },
  inn: { x0: 69, x1: 76, y0: 36, y1: 40 },
  weed: { x0: 6, x1: 18, y0: 33, y1: 41 },
  fields: [{ x0: 14, x1: 30, y0: 75, y1: 86, name: 'the west barley field' }, { x0: 38, x1: 56, y0: 76, y1: 88, name: 'the east barley field' }],
  story: { x: 44, y: 32 },
  exit: { x: 0 * 16 + 4, y: 30 * 16 + 12 },
  buildings: {
    bakery: { x0: 52, x1: 56, y0: 32, y1: 34 }, brewhouse: { x0: 80, x1: 84, y0: 37, y1: 39 }, workshop: { x0: 104, x1: 108, y0: 35, y1: 37 },
    herbalist: { x0: 104, x1: 108, y0: 61, y1: 63 }, store: { x0: 54, x1: 58, y0: 22, y1: 24 }, barn: { x0: 57, x1: 62, y0: 66, y1: 68 },
  },
  mills: [87, 44],
  windmill: [86, 6],
  benches: [[61, 30], [66.5, 30.5], [58, 36], [69, 33], [52, 46], [40, 50], [62, 50], [70, 58], [92, 56], [96, 66], [30, 31], [80, 29], [56, 63]],
  lamps: [[61.5, 25], [66.5, 27.5], [62.4, 33.5], [66.3, 39.5], [66.4, 45.4], [78.6, 45], [64.6, 17.6], [62.6, 51], [65.6, 59.5],
    [62.6, 69.5], [56.5, 29], [80.6, 28.6], [24.5, 31.5], [47, 21], [91, 24.6], [101, 37.6], [27.6, 51.6], [100.5, 59.6], [83.6, 43.5]],
  henhouse: [53, 70],
  herbs: { x0: 99, x1: 103, y0: 66, y1: 68 },
  orchard: { x0: 6, x1: 26, y0: 6, y1: 14 },
  hives: [[31, 8], [32, 10.5], [31, 13]],
  // where the later lots are surveyed from
  anchors: {
    sheep: [8, 62], cow: [86, 80], pig: [48, 70], orchard2: [22, 64], allot: [[70, 76], [30, 44]], memorial: [34, 22],
    well_south: [44, 64], storehouse: [44, 24], smokehouse: [78, 47], well_east: [96, 26], inn2: [40, 66], field3: [42, 7], bakery2: [82, 72], field4: [80, 80], well_west: [20, 50],
    relay: [58, 14], glowworm: [86, 46], array: [26, 66], turbine: [48, 8], dynamoX: 74,
  },
  townCenter: { x: 62, y: 46 },
  stroll: [[64, 28], [64, 40], [48, 24], [80, 27], [96, 40], [30, 31], [14, 28], [64, 62], [46, 73], [82, 74], [100, 70], [96, 26],
    [40, 50], [72, 50], [20, 16], [56, 80], [94, 60], [26, 60], [110, 50], [74, 88]],
  // the deep border woods: a side of the map, and how far in they reach
  forest: { side: 'east', depth: 16 },
};

// The river's course: a base line (tilted a little in new valleys), two
// meanders scaled by the river setting, and a wilder third one that calms
// near calmX so it never runs through anybody's garden.
function makeRiverY(p) {
  const [[a1, f1, p1], [a2, f2, p2]] = p.waves, [aw, fw, pw] = p.wild;
  return (x) => {
    const g = gen('river'), calm = Math.exp(-(((x - p.calmX) / 8) ** 2)), k = g > 1 ? g - (g - 1) * calm : g;
    return p.base + p.tilt * (x - p.tiltX) + (a1 * Math.sin(x * f1 + p1) + a2 * Math.sin(x * f2 + p2)) * k + (g > 1.2 ? aw * Math.sin(x * fw + pw) * (1 - calm) : 0);
  };
}

// Sets the globals the rest of the game reads from a layout.
function applyLayout(L) {
  World.L = L;
  HOME_DEFS = L.homes; ROADS = L.roads; POND = L.pond; PARTY = L.party; PLAZA = L.plaza; INN_RECT = L.inn; WEED_FIELD = L.weed;
  FIELDS = L.fields; STORY = L.story; WEST_EXIT = L.exit; TOWN_CENTER = L.townCenter;
  RIVER_Y = L.river.tilt ? makeRiverY(L.river) : makeRiverY({ ...L.river, tilt: 0, tiltX: 0 });
}
// Where a later lot is surveyed from, by key, or its old fixed spot.
function anchorOf(key, fallback) { const A = World.L && World.L.anchors; return (A && A[key]) || fallback; }
// How far into the deep border woods a tile is, in tiles: 0 at their edge,
// more inside, negative outside.
function forestDepth(x, y) {
  const f = (World.L || CLASSIC_LAYOUT).forest;
  if (f.side === 'east') return x - (MAP_W - f.depth);
  if (f.side === 'west') return f.depth - 1 - x;
  if (f.side === 'south') return y - (MAP_H - f.depth);
  return f.depth - 1 - y;
}

// ---------------------------------------------------------------------------
// Planning a new valley from its seed. The river's course is drawn first;
// then, on a grid of claims so nothing lands on anything else, the square
// goes on gentle ground on the north bank, the store, bakehouse, inn and
// brewhouse close round it, the fields on the flattest land within walking
// distance, the barn between them and the square, the pond in a hollow, the
// herbalist by the pond, the workshop toward the woods, the mills where the
// river runs straight, the windmill on the high ground, the party field, the
// story oak, the old orchard on a sunny slope, the Hall on the Hill above the
// square and the other knolls on south-facing slopes round about, with six
// spare knolls further out. Lanes join everything to the square by the
// easiest way, crossing the river by two bridges. Every number is drawn from
// the seed alone, so the same seed always gives the same valley.
// ---------------------------------------------------------------------------
function planValley(seed, W = MAP_W, H = MAP_H) {
  const r = mulberry32(seed * 31 + 0x5eed);
  const rf = (a, b) => a + r() * (b - a), ri = (a, b) => Math.floor(rf(a, b + 1)), pick = (a) => a[Math.floor(r() * a.length)];
  const sx = W / 128, sy = H / 96; // how much bigger than the original valley
  const L = { w: W, h: H, anchors: {}, benches: [], lamps: [], stroll: [], roads: [] };

  // --- the river ---
  const tilt = rf(-0.14, 0.14);
  L.river = {
    base: H * rf(0.46, 0.58), tilt, tiltX: W / 2, calmX: -1e6,
    waves: [[rf(2.4, 4) * sy, (0.06 / sx) * rf(0.75, 1.25), rf(0, 6.28)], [rf(1, 1.8), 0.17 * rf(0.8, 1.2), rf(0, 6.28)]],
    wild: [rf(1.3, 2.2), 0.11 * rf(0.8, 1.2), rf(0, 6.28)],
  };
  RIVER_Y = makeRiverY(L.river);
  const ry = (x) => RIVER_Y(x + 0.5);

  // --- the land, as the terraces will see it ---
  const nh = makeNoise(seed + 9);
  const hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) hgt[y * W + x] = landHeight(nh, x + 0.5, y + 0.5);
  const hAt = (x, y) => hgt[clamp(Math.round(y), 0, H - 1) * W + clamp(Math.round(x), 0, W - 1)];
  const water = (x, y) => Math.abs(y + 0.5 - ry(x)) < 3.2;
  const claim = new Uint8Array(W * H);
  const inside = (x0, y0, x1, y1) => x0 >= 2 && y0 >= 2 && x1 <= W - 3 && y1 <= H - 3;
  const free = (x0, y0, x1, y1, pad = 0) => {
    if (!inside(x0 - pad, y0 - pad, x1 + pad, y1 + pad)) return false;
    for (let y = y0 - pad; y <= y1 + pad; y++) for (let x = x0 - pad; x <= x1 + pad; x++) if (claim[y * W + x] || water(x, y)) return false;
    return true;
  };
  const take = (x0, y0, x1, y1, pad = 1) => { for (let y = Math.max(0, y0 - pad); y <= Math.min(H - 1, y1 + pad); y++) for (let x = Math.max(0, x0 - pad); x <= Math.min(W - 1, x1 + pad); x++) claim[y * W + x] = 1; };
  // how uneven a rectangle of ground is: the spread of its heights, and whether a terrace bank crosses it
  const rough = (x0, y0, x1, y1) => {
    let lo = 9, hi = -9;
    for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) { const h = hAt(x, y); if (h < lo) lo = h; if (h > hi) hi = h; }
    const banks = Math.floor(hi * TERRACES) - Math.floor(lo * TERRACES);
    return (hi - lo) + banks * 0.06;
  };
  const north = (x, y) => y < ry(x);
  // the best spot for a w×h rectangle among candidates scored by `score` (lower is better), or null
  const fit = (w, h, cands, score, pad = 1) => {
    let best = null, bs = 1e9;
    for (const [x0, y0] of cands) {
      const x1 = x0 + w - 1, y1 = y0 + h - 1;
      if (!free(x0, y0, x1, y1, pad)) continue;
      const s = score(x0, y0, x1, y1) + r() * 0.02;
      if (s < bs) { bs = s; best = [x0, y0, x1, y1]; }
    }
    return best;
  };
  // candidates in a ring (dmin..dmax) round a point, stepping by `step`
  const ring = (cx, cy, dmin, dmax, step = 2, bank = null) => {
    const out = [];
    for (let y = Math.max(2, Math.floor(cy - dmax)); y <= Math.min(H - 3, cy + dmax); y += step) for (let x = Math.max(2, Math.floor(cx - dmax)); x <= Math.min(W - 3, cx + dmax); x += step) {
      const d = Math.hypot(x - cx, (y - cy) * 1.3);
      if (d < dmin || d > dmax) continue;
      if (bank === 'north' && !north(x, y)) continue;
      if (bank === 'south' && north(x, y)) continue;
      out.push([x, y]);
    }
    return out;
  };

  // --- the square: gentle ground on the north bank, a little way up from the water ---
  {
    const cands = [];
    for (let x = Math.floor(W * 0.28); x <= W * 0.72; x += 2) for (let d = 12; d <= 22; d += 2) cands.push([x - 7, Math.round(ry(x) - d) - 6]);
    const sq = fit(15, 13, cands, (x0, y0, x1, y1) => rough(x0, y0, x1, y1) * 3 + Math.abs(ry(x0 + 7) - (y0 + 6) - 15) * 0.02 + (Math.abs(x0 + 7 - W / 2) / W) * 0.4, 2)
      || [Math.round(W / 2) - 7, Math.round(ry(W / 2)) - 20];
    const cx = sq[0] + 7, cy = sq[1] + 6;
    L.plaza = {
      cx, cy, r: 4, well: [cx + 3.5, cy - 3], wellBlk: [cx + 3, cy - 4], stall: [cx - 3.5, cy - 2.6], stallBlk: [[cx - 5, cy - 4], [cx - 4, cy - 4], [cx - 3, cy - 4]],
      market: [cx - 3.5, cy - 1.7], board: [cx + 4.5, cy + 3.3], boardBlk: [cx + 4, cy + 2], post: [cx + 4.5, cy + 4], sign: [cx - 4, cy + 3.5], signBlk: [cx - 5, cy + 2],
    };
    take(...sq, 2);
  }
  const P = L.plaza, PX = P.cx, PY = P.cy;
  const flip = r() < 0.5 ? -1 : 1; // the village mirrored left to right, half the time
  // --- the mills: where the river runs straight enough for a wheel, on the north bank ---
  L.mills = [];
  {
    const mcands = [];
    const topAt = (x) => Math.floor(ry(x) - 1); // the first water row in a column (as the river is stamped)
    for (let mx = 10; mx < W - 10; mx++) {
      const top = topAt(mx);
      // the lane comes in along the bank from the left of the door, so the
      // water mustn't rise higher there; and the wheel wants water close under it
      let ok = true;
      for (let x = mx - 8; x <= mx - 1 && ok; x++) if (topAt(x) < top) ok = false;
      for (let x = mx; x <= mx + 4 && ok; x++) if (topAt(x) < top || topAt(x) > top + 1) ok = false;
      if (!ok) continue;
      const s = Math.abs(ry(mx + 4) - ry(mx - 4));
      const x0 = mx - 2, x1 = mx + 2, y0 = top - 5, y1 = top - 2;
      if (!free(x0 - 6, y0 - 2, x1 + 2, y1 + 1, 1)) continue;
      mcands.push([mx, top, s]);
    }
    /** @param {number[]} c */
    const score1 = (c) => { const [mx, top, s] = c; return s + Math.abs(dist(mx, top, PX, PY) - 24) * 0.03 + r() * 0.05; };
    mcands.sort((a, b) => score1(a) - score1(b));
    for (const [mx, top] of mcands) {
      if (L.mills.length >= 2) break;
      if (L.mills.length && Math.abs(mx - L.mills[0]) < 18) continue;
      L.mills.push(mx); take(mx - 8, top - 7, mx + 4, top, 2);
    }
    if (!L.mills.length) L.mills.push(PX + flip * 20);
    L.millScanFrom = Math.max(0, Math.min(...L.mills.map((mx) => Math.floor(ry(mx)) - 12)));
    L.anchors.dynamoX = L.mills[0] + flip * 12;
  }
  // a building of w×3 tiles whose door should sit near (ax, ay), its bottom row at ay
  /** @param {(x0: number, y0: number, x1: number, y1: number) => number} [score] */
  const house = (w, ax, ay, radius, score = () => 0) => {
    const cands = [];
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) cands.push([ax + dx - (w >> 1), ay + dy - 2]);
    const b = fit(w, 3, cands, (x0, y0, x1, y1) => rough(x0, y0 - 4, x1, y1 + 1) * 3 + dist(x0 + (w >> 1), y1, ax, ay) * 0.015 + score(x0, y0, x1, y1), 1);
    if (!b) return null;
    // the roof rows above, the doorstep below and a margin round all of it are kept
    take(b[0], b[1] - 4, b[2], b[3] + 1, 1);
    return { x0: b[0], x1: b[2], y0: b[1], y1: b[3] };
  };
  L.buildings = {};
  L.buildings.store = house(5, PX - flip * 8, PY - 4, 5) || { x0: PX - 12, x1: PX - 8, y0: PY - 6, y1: PY - 4 };
  L.buildings.bakery = house(5, PX - flip * 10, PY + 6, 5) || { x0: PX - 12, x1: PX - 8, y0: PY + 4, y1: PY + 6 };
  // the inn, with its cobbled yard below
  {
    const cands = [];
    for (let dy = -8; dy <= 6; dy++) for (let dx = -10; dx <= 10; dx++) cands.push([PX + flip * 9 - 4 + dx, PY + 8 + dy - 2]);
    const score = (x0, y0, x1, y1) => rough(x0, y0 - 2, x1, y1) * 3 + dist(x0 + 4, y0 + 4, PX + flip * 9, PY + 12) * 0.015;
    const b = fit(8, 11, cands, score, 2) || fit(8, 11, ring(PX, PY, 6, 30, 1).map(([x, y]) => [x - 4, y - 5]), score, 1) || [PX + 5, PY + 8, PX + 12, PY + 18];
    L.inn = { x0: b[0], x1: b[2], y0: b[1], y1: b[1] + 4 };
    take(b[0] - 2, b[1] - 2, b[2] + 2, b[3], 1);
  }
  L.buildings.brewhouse = house(5, L.inn.x1 + flip * 8 + (flip < 0 ? -(L.inn.x1 - L.inn.x0) : 0), L.inn.y1 - 1, 6) || { x0: PX + 16, x1: PX + 20, y0: PY + 9, y1: PY + 11 };

  // --- the fields: the flattest open land within walking distance, on either bank ---
  const fieldDims = [[17, 12], [19, 13]], names = ['the west barley field', 'the east barley field'];
  L.fields = [];
  for (let k = 0; k < 2; k++) {
    const [fw, fh] = fieldDims[k];
    const cands = ring(PX, PY, 18, 46 * Math.min(sx, sy), 3).map(([x, y]) => [x - (fw >> 1), y - (fh >> 1)]);
    const f = fit(fw, fh, cands, (x0, y0, x1, y1) => rough(x0, y0, x1, y1) * 4 + dist(x0 + fw / 2, y0 + fh / 2, PX, PY) * 0.006 + (k && L.fields[0] ? Math.max(0, 24 - dist(x0 + fw / 2, y0 + fh / 2, L.fields[0].x0 + 8, L.fields[0].y0 + 6)) * 0.02 : 0), 2);
    if (f) { L.fields.push({ x0: f[0], y0: f[1], x1: f[2], y1: f[3], name: names[k] }); take(...f, 2); }
  }
  if (L.fields.length === 2 && L.fields[0].x0 > L.fields[1].x0) { [L.fields[0].name, L.fields[1].name] = [L.fields[1].name, L.fields[0].name]; }
  {
    const cands = ring(PX, PY, 16, 38 * Math.min(sx, sy), 3).map(([x, y]) => [x - 6, y - 4]);
    const f = fit(13, 9, cands, (x0, y0, x1, y1) => rough(x0, y0, x1, y1) * 4 + dist(x0 + 6, y0 + 4, PX, PY) * 0.006, 2) || [2, 2, 14, 10];
    L.weed = { x0: f[0], y0: f[1], x1: f[2], y1: f[3] }; take(...f, 2);
  }
  // the barn between the fields and the square, the henhouse beside it
  {
    const fc = L.fields.length ? [L.fields.reduce((s, f) => s + (f.x0 + f.x1) / 2, 0) / L.fields.length, L.fields.reduce((s, f) => s + (f.y0 + f.y1) / 2, 0) / L.fields.length] : [PX, PY + 30];
    const ax = Math.round((fc[0] * 2 + PX) / 3), ay = Math.round((fc[1] * 2 + PY) / 3);
    L.buildings.barn = house(6, ax, ay, 10) || { x0: ax - 3, x1: ax + 2, y0: ay - 2, y1: ay };
    const B = L.buildings.barn;
    L.henhouse = [B.x0 - 4, B.y1 + 2]; take(B.x0 - 7, B.y1 + 1, B.x0 - 1, B.y1 + 3, 1);
    L.anchors.pig = [B.x0 - 9, B.y1 + 2];
  }

  // --- the pond: a hollow away from the river ---
  {
    const cands = ring(PX, PY, 20, 56 * Math.min(sx, sy), 3).filter(([x, y]) => Math.abs(y - ry(x)) > 10 && Math.abs(y - ry(x)) < 34);
    const p = fit(13, 9, cands.map(([x, y]) => [x - 6, y - 4]), (x0, y0, x1, y1) => hAt(x0 + 6, y0 + 4) * 2 + rough(x0, y0, x1, y1) * 2, 2);
    L.pond = p ? { cx: p[0] + 6, cy: p[1] + 4, rx: 6, ry: 4 } : { cx: W - 20, cy: H - 16, rx: 6, ry: 4 };
    if (p) take(...p, 2);
    L.anchors.cow = [L.pond.cx - 14, L.pond.cy + 2];
  }
  // --- the herbalist by the pond, with the herb beds beside it; the workshop toward the woods ---
  L.forest = { side: flip > 0 ? 'east' : 'west', depth: Math.round(16 * sx) };
  L.exit = { x: flip > 0 ? 4 : W * 16 - 4, y: 0 };
  {
    const hb = house(5, L.pond.cx + 9, L.pond.cy - 6, 9) || house(5, PX + flip * 30, PY + 20, 12) || { x0: PX + 40, x1: PX + 44, y0: PY + 33, y1: PY + 35 };
    L.buildings.herbalist = hb;
    L.herbs = { x0: hb.x0 - 5, x1: hb.x0 - 1, y0: hb.y1 + 3, y1: hb.y1 + 5 }; take(hb.x0 - 6, hb.y1 + 2, hb.x0, hb.y1 + 6, 0);
    const wx = flip > 0 ? W - L.forest.depth - 10 : L.forest.depth + 10;
    L.buildings.workshop = house(5, wx, PY + ri(-6, 10), 12) || { x0: PX + 40, x1: PX + 44, y0: PY + 7, y1: PY + 9 };
  }

  // --- the windmill on the high ground of the Hill ---
  {
    const cands = ring(PX, PY, 16, 42 * Math.min(sx, sy), 2, 'north').map(([x, y]) => [x - 3, y - 5]);
    const w = fit(7, 6, cands, (x0, y0, x1, y1) => -hAt(x0 + 3, y0 + 5) * 3 + rough(x0, y0, x1, y1), 1);
    L.windmill = w ? [w[0] + 3, w[3]] : [PX + 22, Math.max(6, PY - 22)];
    if (w) take(...w, 1);
    L.anchors.turbine = [L.windmill[0] - flip * 20, L.windmill[1] + 2];
  }

  // --- the party field, the story oak, the old orchard with its hives ---
  {
    const cands = ring(PX, PY, 14, 34 * Math.min(sx, sy), 2).map(([x, y]) => [x - 11, y - 7]);
    const f = fit(23, 15, cands, (x0, y0, x1, y1) => rough(x0, y0, x1, y1) * 3 + dist(x0 + 11, y0 + 7, PX, PY) * 0.004, 1) || [PX + 25, PY - 19, PX + 47, PY - 5];
    const cx = f[0] + 11, cy = f[1] + 7;
    L.party = { cx, cy, rx: 11, ry: 7, treeX: cx, treeY: cy - 4, danceX: cx, danceY: cy + 1.4, tables: [[cx - 9, cy - 2], [cx + 9, cy - 2], [cx - 8, cy + 4], [cx + 8, cy + 4], [cx, cy + 6]], maypole: [cx - 5.5, cy + 2.6], bonfire: [cx + 6, cy + 2], hay: [[cx - 12, cy - 6], [cx + 13, cy + 3]] };
    take(...f, 1);
    L.anchors.well_east = [cx - 4, cy + 10];
  }
  {
    const cands = ring(PX, PY, 8, 18, 1).map(([x, y]) => [x - 3, y - 2]);
    const s = fit(7, 6, cands, (x0, y0, x1, y1) => rough(x0, y0, x1, y1) * 2 + Math.abs(dist(x0 + 3, y0 + 2, PX, PY) - 12) * 0.01, 1) || [PX - 23, PY + 2, PX - 17, PY + 7];
    L.story = { x: s[0] + 3, y: s[1] + 2 }; take(...s, 1);
  }
  {
    const cands = ring(PX, PY, 18, 46 * Math.min(sx, sy), 3, 'north').map(([x, y]) => [x - 10, y - 4]);
    const o = fit(21, 9, cands, (x0, y0, x1, y1) => rough(x0, y0, x1, y1) * 2 + (hAt(x0 + 10, y0 - 3) - hAt(x0 + 10, y1 + 3)) * -2 + dist(x0 + 10, y0 + 4, PX, PY) * 0.004, 2) || [4, 4, 24, 12];
    L.orchard = { x0: o[0], y0: o[1], x1: o[2], y1: o[3] };
    L.hives = [[o[2] + 5, o[1] + 2], [o[2] + 6, o[1] + 4.5], [o[2] + 5, o[1] + 7]];
    take(o[0], o[1], o[2] + 7, o[3], 1);
  }

  // --- the knolls: the Hall on the Hill above the square, nine homes on sunny slopes round about, six spare further out ---
  L.homes = []; L.fallbacks = 0;
  const knoll = (rx, ry_, dmin, dmax, grand, bank) => {
    const cands = ring(PX, PY, dmin, dmax, 2, bank);
    let best = null, bs = 1e9;
    for (const [cx, cy] of cands) {
      const x0 = Math.floor(cx - rx * 1.45) - 2, x1 = Math.ceil(cx + rx * 1.45) + 2, y0 = Math.floor(cy - ry_ * 1.35) - 2, y1 = Math.ceil(cy + ry_) + 3;
      if (!free(x0, y0, x1, y1, 0) || !free(cx - 6, y1, cx + 6, y1 + 1, 0)) continue;
      let clash = false;
      for (const h of L.homes) if (Math.abs(h.cx - cx) < h.rx + rx + 3 && Math.abs(h.cy - cy) < h.ry + ry_ + 4) { clash = true; break; }
      if (clash) continue;
      // south-facing: higher behind than in front; and not too rough underfoot
      const facing = hAt(cx, cy - ry_ - 1) - hAt(cx, cy + ry_ + 2);
      const s = -facing * 4 + rough(cx - 4, cy - 2, cx + 4, cy + 4) * 2 + (grand ? -hAt(cx, cy) * 2 + Math.abs(dist(cx, cy, PX, PY) - 18) * 0.01 : dist(cx, cy, PX, PY) * 0.004) + r() * 0.03;
      if (s < bs) { bs = s; best = [cx, cy, x0, y0, x1, y1]; }
    }
    if (!best) return null;
    const [cx, cy, x0, y0, x1, y1] = best;
    take(x0, y0, x1, y1 + 2, 0);
    const d = { cx, cy, rx, ry: ry_ };
    if (grand) d.grand = true;
    L.homes.push(d);
    return d;
  };
  // each knoll looks close in first, then further out, then anywhere there's room
  const anyKnoll = (rx, ry_, dmin, dmax, grand, bank) => knoll(rx, ry_, dmin, dmax, grand, bank) || knoll(rx, ry_, dmin, dmax * 1.6, grand, bank) || knoll(rx, ry_, 6, Math.max(W, H), grand, null);
  anyKnoll(9, 5.5, 10, 26, true, 'north') || anyKnoll(7, 4.5, 8, 40, true, null) || (L.fallbacks++, L.homes.push({ cx: PX, cy: Math.max(8, PY - 19), rx: 9, ry: 5.5, grand: true }));
  for (let k = 0; k < 9; k++) {
    const big = k < 3;
    anyKnoll(big ? 5 : 4.5, big ? 3.5 : 3, 8, 36 * Math.min(sx, sy), false, null) || anyKnoll(4, 2.8, 6, Math.max(W, H), false, null) || (L.fallbacks++, L.homes.push({ cx: PX - 20 + k * 5, cy: Math.max(8, PY - 26), rx: 4.5, ry: 3 }));
  }
  for (let k = 0; k < 6; k++) {
    const d = anyKnoll(4.5, 3, 24, 60 * Math.min(sx, sy), false, null);
    if (d) d.site = true; else { L.fallbacks++; L.homes.push({ cx: 12 + k * 8, cy: Math.max(8, PY - 26), rx: 4.5, ry: 3, site: true }); }
  }
  const doorTyOf = (d) => { let t = 0; for (let y = Math.floor(d.cy - d.ry - 1); y <= Math.ceil(d.cy + d.ry + 1); y++) { const ny = (y - d.cy) / d.ry; if (ny * ny < 1) t = Math.max(t, y); } return t; };

  // --- where later lots are surveyed from ---
  const A = L.anchors, south = (x, d) => Math.round(ry(x) + d);
  A.sheep = L.fields[0] ? [L.fields[0].x0 - 8, L.fields[0].y0 - 2] : [PX - 50, PY + 34];
  A.orchard2 = [PX - flip * 40, south(PX - flip * 40, 10)];
  A.allot = [[L.buildings.barn.x1 + 8, L.buildings.barn.y1 + 8], [PX - flip * 34, PY + 16]];
  A.memorial = [PX - flip * 30, PY - 6];
  A.well_south = [PX - flip * 20, south(PX - flip * 20, 10)];
  A.storehouse = [PX - flip * 20, PY - 4];
  A.smokehouse = [PX + flip * 14, PY + 19];
  A.inn2 = [PX - flip * 24, south(PX - flip * 24, 12)];
  A.field3 = [PX - flip * 22, Math.max(6, PY - 21)];
  A.bakery2 = [PX + flip * 18, south(PX + flip * 18, 18)];
  A.field4 = [PX + flip * 16, south(PX + flip * 16, 26)];
  A.well_west = [PX - flip * 44, PY + 22];
  A.relay = [PX - flip * 6, PY - 14];
  A.glowworm = [PX + flip * 22, PY + 18];
  A.array = [PX - flip * 38, south(PX - flip * 38, 12)];

  // --- the lanes ---
  // The main road runs through the square and over the river by a bridge
  // straight below it; the West Road (or East, in a mirrored valley) leaves
  // the map on the exit side. Every other place is joined to the nearest lane
  // already laid, the long stretches bending to follow the easy ground.
  const roads = L.roads;
  const bridgeAt = (x) => [[x, Math.round(ry(x)) - 6], [x, Math.round(ry(x)) + 6]];
  const laneNodes = []; // [x, y] points already on a lane, for joining to
  const addRoad = (w, pts) => { roads.push([w, ...pts]); for (let k = 0; k < pts.length - 1; k++) for (let t = 0; t <= 1; t += 0.2) laneNodes.push([pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t]); };
  // a bend or two between two points, following the gentler ground
  const bendy = (a, b) => {
    const len = dist(a[0], a[1], b[0], b[1]);
    if (len < 14) return [a, b];
    const n = Math.min(4, Math.floor(len / 12)), pts = [a];
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1), x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      const px = -(b[1] - a[1]) / len, py = (b[0] - a[0]) / len;
      let best = [x, y], bs = 1e9;
      for (let o = -6; o <= 6; o += 2) {
        const qx = x + px * o, qy = y + py * o;
        if (qx < 3 || qy < 3 || qx > W - 4 || qy > H - 4) continue;
        const s = Math.abs(hAt(qx, qy) - hAt(pts[pts.length - 1][0], pts[pts.length - 1][1])) * 20 + Math.abs(o) * 0.05 + (claim[Math.round(qy) * W + Math.round(qx)] ? 1.5 : 0);
        if (s < bs) { bs = s; best = [Math.round(qx), Math.round(qy)]; }
      }
      pts.push(best);
    }
    pts.push(b);
    return pts;
  };
  // joins a point to the lanes: via the bridge if the river is between
  const join = (p, w = 0.85) => {
    const needBridge = (q) => Math.sign(p[1] - ry(p[0])) !== Math.sign(q[1] - ry(q[0]));
    let best = null, bs = 1e9;
    for (const q of laneNodes) { if (needBridge(q)) continue; const d = dist(p[0], p[1], q[0], q[1]); if (d < bs) { bs = d; best = q; } }
    if (!best) {
      // nothing on this bank yet: cross by the nearest bridge
      const bx = L.bridges.reduce((a, b) => (Math.abs(b - p[0]) < Math.abs(a - p[0]) ? b : a));
      const [n, s] = bridgeAt(bx), end = north(p[0], p[1]) ? n : s;
      addRoad(w, bendy(p, end));
      return;
    }
    if (bs > 2) addRoad(w, bendy(p, [Math.round(best[0]), Math.round(best[1])]));
  };
  L.bridges = [PX, PX + flip * ri(26, 40)];
  if (L.bridges[1] < 8 || L.bridges[1] > W - 8) L.bridges[1] = PX - flip * 30;
  // the main road: down from the Hill through the square, over the bridge and on to the far edge
  const [b1n, b1s] = bridgeAt(L.bridges[0]);
  addRoad(1.1, [[PX, Math.max(3, PY - 13)], [PX, PY - 3]]);
  addRoad(1.1, [[PX, PY + 3], b1n]);
  addRoad(1.1, [b1n, b1s]);
  addRoad(1.1, [b1s, [PX, Math.round(b1s[1] + (H - b1s[1]) * 0.45)], [PX, H - 4]]);
  // the road out of the valley
  const ex = flip > 0 ? 0 : W - 1, ey = clamp(Math.round(ry(ex) - 24 * sy), 6, H - 6);
  L.exit.y = ey * 16 + 12;
  addRoad(1.0, bendy([ex, ey], [PX - flip * 5, PY]));
  addRoad(1.0, bendy([PX + flip * 5, PY - 1], [L.party.cx, L.party.cy + 8]));
  // the second bridge, joined on both banks
  const [b2n, b2s] = bridgeAt(L.bridges[1]);
  join(b2n, 0.9); addRoad(0.9, [b2n, b2s]); join(b2s, 0.9);
  // every building, field, knoll and the rest, nearest the square first
  /** @type {[number[], number][]} */
  const steps = [];
  for (const k in L.buildings) { const b = L.buildings[k]; steps.push([[Math.round((b.x0 + b.x1) / 2), b.y1 + 2], 0.85]); }
  steps.push([[Math.round((L.inn.x0 + L.inn.x1) / 2), L.inn.y1 + 7], 0.9]);
  for (const f of L.fields) steps.push([[Math.round((f.x0 + f.x1) / 2), f.y1 + 2], 0.9], [[Math.round((f.x0 + f.x1) / 2), f.y0 - 2], 0.85]);
  steps.push([[Math.round((L.weed.x0 + L.weed.x1) / 2), L.weed.y1 + 2], 0.85]);
  // the mills' lanes come in along the bank from the left of the door
  for (const mx of L.mills) { const sy_ = Math.floor(ry(mx) - 1) - 1; addRoad(0.9, [[mx, sy_], [mx - 5, sy_]]); steps.push([[mx - 5, sy_], 0.9]); }
  steps.push([[L.windmill[0], L.windmill[1] + 2], 0.85]);
  steps.push([[L.story.x, L.story.y + 5], 0.85]);
  steps.push([[L.orchard.x1 + 2, Math.round((L.orchard.y0 + L.orchard.y1) / 2)], 0.85]);
  steps.push([[L.pond.cx, L.pond.cy + 7], 0.8]);
  for (const d of L.homes) steps.push([[d.cx, doorTyOf(d) + 1], d.site ? 0.8 : 0.85]);
  steps.sort((a, b) => dist(a[0][0], a[0][1], PX, PY) - dist(b[0][0], b[0][1], PX, PY));
  for (const [p, w] of steps) join(p, w);

  // --- lamps along the lanes near the square, benches about the place ---
  L.lamps.push([PX - 2.5, PY - 3], [PX + 2.5, PY - 0.5], [PX - 1.6, PY + 5.5], [PX + 2.3, PY + 11.5]);
  let budget = 0;
  for (const [, ...pts] of roads) for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1], len = dist(a[0], a[1], b[0], b[1]);
    for (let t = 0; t < len; t += 1) {
      budget += 1;
      if (budget < 9) continue;
      const x = a[0] + (b[0] - a[0]) * (t / len), y = a[1] + (b[1] - a[1]) * (t / len);
      if (dist(x, y, PX, PY) > 34 || Math.abs(y - ry(x)) < 5) continue;
      budget = 0;
      if (L.lamps.length < Math.round(19 * Math.max(sx, sy))) L.lamps.push([Math.round(x) + 0.6, Math.round(y) + 0.5]);
    }
  }
  L.benches.push([PX - 3, PY + 2], [PX + 2.5, PY + 2.5], [PX - 6, PY + 8], [PX + 5, PY + 5]);
  for (const k in L.buildings) { const b = L.buildings[k]; L.benches.push([b.x1 + 2, b.y1 + 1]); }
  L.benches.push([L.party.cx - 10, L.party.cy + 8], [L.story.x - 4, L.story.y + 1], [L.pond.cx + 8, L.pond.cy - 2]);
  for (const f of L.fields) L.benches.push([f.x0 - 2, f.y0 - 2]);
  // --- the heart of the village, and where folk wander to ---
  const built = L.homes.filter((d) => !d.site);
  L.townCenter = { x: Math.round((PX + built.reduce((s, d) => s + d.cx, 0)) / (built.length + 1)), y: Math.round((PY + built.reduce((s, d) => s + d.cy, 0)) / (built.length + 1)) };
  L.stroll.push([PX, PY], [PX, PY + 12], [L.party.cx, L.party.cy + 8], [L.pond.cx, L.pond.cy + 7], [b1s[0], b1s[1] + 2], [b2n[0], b2n[1] - 2], [L.story.x, L.story.y + 4]);
  for (const k in L.buildings) { const b = L.buildings[k]; L.stroll.push([Math.round((b.x0 + b.x1) / 2), b.y1 + 2]); }
  for (const f of L.fields) L.stroll.push([Math.round((f.x0 + f.x1) / 2), f.y1 + 2]);
  for (let k = 0; k < 4; k++) L.stroll.push([ri(10, W - 10), ri(10, H - 10)]);
  return L;
}
