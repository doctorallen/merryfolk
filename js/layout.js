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
  townCentre: { x: 62, y: 46 },
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
  FIELDS = L.fields; STORY = L.story; WEST_EXIT = L.exit; TOWN_CENTRE = L.townCentre;
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
