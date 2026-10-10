'use strict';
// ---------------------------------------------------------------------------
// Town planning: Thistledown grows with its folk. When the world is made, spare
// land is surveyed: knolls for new hobbit-holes, lots for public buildings and
// room for more barley fields. Those lots are kept clear of trees, and each
// one is opened when the village needs it. Woodwrights then dig and build them,
// and farmers plough the new fields.
// ---------------------------------------------------------------------------

const HOME_LOTS_MAX = 34;
const TOWN_CENTRE = { x: 62, y: 46 };

// Public buildings, opened in order once the village is big enough.
const CIVIC_DEFS = [
  { key: 'well_south', kind: 'well', name: 'the South Well', anchor: [44, 64], pop: 22, desc: 'A second well, for the folk south of the river' },
  {
    key: 'storehouse', kind: 'building', name: 'The New Storehouse', anchor: [44, 24], pop: 30, w: 5, pw: 84, doorOff: 42,
    desc: 'More room in the Common Store: everything keeps half as much again',
    make: (lit) => makeCottage({ w: 84, h: 84, roof: 'barn', sign: 'sack', windows: [], door: 42, lit }),
  },
  {
    key: 'smokehouse', kind: 'building', name: 'The Smokehouse', anchor: [78, 47], pop: 34, w: 4, pw: 70, doorOff: 30, chimneys: [52],
    desc: 'Fish, bread and mushrooms keep twice as long, smoked and hung',
    make: (lit) => makeCottage({ w: 70, wall: '#cfc2a2', roof: 'slate', sign: 'fish', windows: [50], door: 30, chimneys: [52], lit }),
  },
  { key: 'well_east', kind: 'well', name: 'the East Well', anchor: [96, 26], pop: 38, desc: 'Cool water by the party field' },
  {
    key: 'inn2', kind: 'building', name: 'The Hedgehog and Kettle', anchor: [40, 66], pop: 40, w: 6, pw: 96, doorOff: 48, chimneys: [20, 70], yard: 4, inn: true,
    desc: 'A snug second tavern on the south bank: more seats, shorter walks',
    make: (lit) => makeCottage({ w: 96, wall: '#f0e2bc', roof: 'thatch', sign: 'mug', windows: [12, 30, 66, 80], door: 48, chimneys: [20, 70], lit }),
  },
  { key: 'field3', kind: 'field', name: 'the hill barley field', anchor: [42, 7], pop: 34, desc: 'Fresh-ploughed barley' },
  {
    key: 'bakery2', kind: 'building', name: 'The South Bakehouse', anchor: [82, 72], pop: 46, w: 5, pw: 88, doorOff: 44, chimneys: [62],
    desc: 'A second oven: more bread, pies and cakes for a growing village',
    make: (lit) => makeCottage({ w: 88, wall: '#f2e6c6', roof: 'thatch', sign: 'bread', windows: [12, 64], door: 44, chimneys: [62], lit }),
  },
  { key: 'field4', kind: 'field', name: 'the far barley field', anchor: [80, 80], pop: 44, desc: 'Fresh-ploughed barley' },
  { key: 'well_west', kind: 'well', name: 'the West Well', anchor: [20, 50], pop: 52, desc: 'A well for the western holes' },
];
const BUILD_PHRASES = {
  home: ['Dig, dig, dig!', 'A fine smial this\'ll be.', 'Round door, round door...'],
  building: ['Up she goes!', 'Mind the scaffold!', 'Hand me that beam, would you?', 'Square and true.'],
  well: ['Deeper, deeper...', 'I can hear water!', 'Pass the bucket down.'],
  field: ['Straight furrows, now.', 'Good dark soil, this.', 'Barley by summer!'],
  retrofit: ['Patching in the neon...', 'Sky-dish, aligned.', 'Mind the cable!', 'Hold this. Don\'t lick it.'],
  rift: ['Wood frame, steel skin.', 'Splice that, would you?', 'Bit of rift, bit of hill.'],
};
// Built by the Riftfolk (with the woodwrights' help) as their numbers and ways
// grow. Surveyed after the hobbit-hole knolls, so older villages keep their lots.
const RIFT_CIVIC = [
  {
    key: 'relay', kind: 'building', rift: true, name: 'The Relay Mast', anchor: [58, 14], w: 3, pw: 52, doorOff: 26, tall: 7,
    due: () => riftAdults() >= 2, when: 'once two rift-born grown-ups live here',
    desc: 'A humming lattice mast over a tin shack: the rift-minded jack in here, and the curious pick up rift ways',
    make: (lit) => makeRelay(lit),
  },
  {
    key: 'glowworm', kind: 'building', rift: true, inn: true, name: 'The Glowworm', anchor: [86, 46], w: 5, pw: 80, doorOff: 40, chimneys: [56],
    due: () => techFolk() >= 6, when: 'once six folk keep rift ways',
    desc: 'A neon-lit tavern: ale, stew and synth-fiddle, for hill-folk and rift-folk alike',
    make: (lit) => makeNeonBar(lit),
  },
  {
    key: 'array', kind: 'building', rift: true, name: 'The Sun-Glass Array', anchor: [26, 66], w: 5, pw: 84, doorOff: 42,
    due: () => techFolk() >= 10, when: 'once ten folk keep rift ways',
    desc: 'Panels of glass that drink the sunshine: hearths burn half the firewood',
    make: (lit) => makeSolarArray(lit),
  },
];
const CIVIC_BY_KEY = Object.fromEntries(CIVIC_DEFS.concat(RIFT_CIVIC).map((d) => [d.key, d]));
// How quickly each kind of project goes up, and how much timber a step takes.
const PROJECT_KIND = {
  home: { rate: 0.05, wood: 2 },
  building: { rate: 0.034, wood: 2 },
  well: { rate: 0.14, wood: 0 },
  field: { rate: 0.09, wood: 0 },
  retrofit: { rate: 0.2, wood: 0, scrap: 2 },
};

// ---------------------------------------------------------------------------
// Surveying, done once when the world is made
// ---------------------------------------------------------------------------
// The core of a lot must be open, unclaimed grass. Its margin only needs to be
// walkable ground (a road, or another lot's edge will do).
function lotFree(core, margin) {
  const [mx0, my0, mx1, my1] = margin || core;
  if (mx0 < 3 || mx1 > 118 || my0 < 4 || my1 > 91) return false;
  for (let y = my0; y <= my1; y++) for (let x = mx0; x <= mx1; x++) {
    const i = tIdx(x, y), t = World.tiles[i];
    if (World.block[i]) return false;
    if (x >= core[0] && x <= core[2] && y >= core[1] && y <= core[3]) { if (t !== T.GRASS || World.reserved[i]) return false; }
    else if (t !== T.GRASS && t !== T.PATH && t !== T.COBBLE && t !== T.LAWN) return false;
  }
  return true;
}

// The shortest walk from any of `starts` through open grass to an existing
// road, avoiding the lot itself. Returns the tiles to pave, or null.
function findSpur(starts, avoid, maxLen = 18) {
  const prev = new Map(), depth = new Map(), q = [];
  for (const [x, y] of starts) { const i = tIdx(x, y); prev.set(i, -1); depth.set(i, 0); q.push(i); }
  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi], cx = cur % MAP_W, cy = (cur / MAP_W) | 0;
    if (depth.get(cur) >= maxLen) continue;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (!inMap(nx, ny)) continue;
      const ni = tIdx(nx, ny);
      if (prev.has(ni)) continue;
      const t = World.tiles[ni];
      if (t === T.PATH || t === T.COBBLE) {
        const out = [];
        for (let n = cur; n !== -1; n = prev.get(n)) out.push([n % MAP_W, (n / MAP_W) | 0]);
        return out.reverse();
      }
      if (t !== T.GRASS || World.reserved[ni] || World.block[ni]) continue;
      if (avoid && nx >= avoid[0] && nx <= avoid[2] && ny >= avoid[1] && ny <= avoid[3]) continue;
      prev.set(ni, cur); depth.set(ni, depth.get(cur) + 1); q.push(ni);
    }
  }
  return null;
}

function reserveRect(x0, y0, x1, y1) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inMap(x, y)) World.reserved[tIdx(x, y)] = 1; }
function reserveTiles(list) { for (const [x, y] of list) World.reserved[tIdx(x, y)] = 1; }

// The footprint a lot needs to be clear, and where its path starts.
function lotShape(kind, def, ax, ay) {
  if (kind === 'home') {
    return { core: [ax - 4, ay - 3, ax + 4, ay + 3], area: [ax - 4, ay - 4, ax + 4, ay + 4], avoid: [ax - 4, ay - 3, ax + 4, ay + 3], starts: [[ax, ay + 3]] };
  }
  if (kind === 'well') return { core: [ax - 1, ay - 1, ax + 1, ay + 1], area: [ax - 2, ay - 2, ax + 2, ay + 2], avoid: [ax - 1, ay - 1, ax + 1, ay], starts: [[ax, ay + 1]] };
  if (kind === 'field') {
    const x1 = ax + 11, y1 = ay + 6, mx = ax + 6;
    return { core: [ax, ay, x1, y1], area: [ax - 1, ay - 1, x1 + 1, y1 + 1], avoid: [ax, ay, x1, y1], starts: [[mx, y1 + 1], [mx, ay - 1], [ax - 1, ay + 3], [x1 + 1, ay + 3]] };
  }
  // a building: ax = x0, ay = y1 (its bottom row of tiles)
  const x1 = ax + def.w - 1;
  const left = Math.round((ax + x1 + 1) * 8 - def.pw / 2);
  const doorTx = Math.floor((left + def.doorOff) / 16);
  const up = def.tall || 4;
  return { core: [ax, ay - up, x1, ay + (def.yard || 1)], area: [ax - 1, ay - up - 1, x1 + 1, ay + 1 + (def.yard || 1)], avoid: [ax - 1, ay - 5, x1 + 1, ay], starts: [[doorTx, ay + 1]] };
}

function surveyLot(kind, def, ax, ay, maxR) {
  let best = null, bs = 1e9;
  for (let dy = -maxR; dy <= maxR; dy++) for (let dx = -maxR; dx <= maxR; dx++) {
    const x = ax + dx, y = ay + dy;
    const sh = lotShape(kind, def, x, y);
    if (!lotFree(sh.core, sh.area)) continue;
    const spur = findSpur(sh.starts, sh.avoid);
    if (!spur) continue;
    const s = Math.hypot(dx, dy) + spur.length * 0.6;
    if (s < bs) { bs = s; best = { x, y, sh, spur }; }
  }
  return best;
}

function planLots(seed) {
  World.lots = []; World.lotSeq = 0;
  // the six original knolls will want their gardens one day
  for (const h of World.homes) if (!h.built) { const [sx, sy] = h.stepTile; reserveRect(sx - 5, sy, sx + 5, sy + 1); }
  // public buildings and fields, each near the spot it suits
  for (const def of CIVIC_DEFS) surveyCivic(def, 16);
  // spare knolls for hobbit-holes, nearest the heart of the village first
  const cands = [];
  for (let cy = 8; cy <= 87; cy++) for (let cx = 7; cx <= 114; cx++) {
    const sh = lotShape('home', null, cx, cy);
    if (!lotFree(sh.core, sh.area)) continue;
    cands.push([cx, cy, Math.hypot(cx - TOWN_CENTRE.x, (cy - TOWN_CENTRE.y) * 1.2)]);
  }
  cands.sort((a, b) => a[2] - b[2]);
  let n = 0;
  for (const [cx, cy] of cands) {
    if (n >= HOME_LOTS_MAX) break;
    const sh = lotShape('home', null, cx, cy);
    if (!lotFree(sh.core, sh.area)) continue;
    const spur = findSpur(sh.starts, sh.avoid, 26);
    if (!spur) continue;
    World.lots.push({ i: World.lots.length, kind: 'home', cx, cy, spur, state: 'planned' });
    reserveRect(...sh.core); reserveTiles(spur);
    n++;
  }
  for (const def of RIFT_CIVIC) surveyCivic(def, 26);
}
function surveyCivic(def, maxR) {
  const found = surveyLot(def.kind, def, def.anchor[0], def.anchor[1], maxR);
  if (!found) return;
  const { x, y, sh, spur } = found;
  const lot = { i: World.lots.length, kind: def.kind, key: def.key, def, spur, state: 'planned' };
  if (def.kind === 'building') Object.assign(lot, { x0: x, x1: x + def.w - 1, y1: y, y0: y - 2 });
  else if (def.kind === 'field') Object.assign(lot, { x0: x, x1: x + 11, y0: y, y1: y + 6 });
  else Object.assign(lot, { tx: x, ty: y });
  World.lots.push(lot);
  reserveRect(...sh.core); reserveTiles(spur);
}

// ---------------------------------------------------------------------------
// Opening and finishing lots
// ---------------------------------------------------------------------------
function lotBounds(lot) {
  if (lot.kind === 'home') return [lot.cx - 7, lot.cy - 5, lot.cx + 7, lot.cy + 5];
  if (lot.kind === 'well') return [lot.tx - 2, lot.ty - 3, lot.tx + 2, lot.ty + 2];
  if (lot.kind === 'field') return [lot.x0 - 1, lot.y0 - 1, lot.x1 + 1, lot.y1 + 1];
  return [lot.x0 - 1, lot.y1 - 6, lot.x1 + 1, lot.y1 + 2 + (lot.def.yard || 1)];
}
function paveSpur(lot) { for (const [x, y] of lot.spur) if (World.tiles[tIdx(x, y)] === T.GRASS) World.tiles[tIdx(x, y)] = T.PATH; }

// Recomputes the ground after tiles change, and keeps any season repaint in
// progress up to date.
function refreshGround(rects) {
  if (!World.ground) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [a, b, c, d] of rects) { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c); y1 = Math.max(y1, d); }
  x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(MAP_W - 1, x1 + 1); y1 = Math.min(MAP_H - 1, y1 + 1);
  repaintRect(x0 * 16, y0 * 16, (x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16);
  if (World.paintJob) startSeasonPaint(World.paintJob.season);
}

// Anyone standing where the ground has just been raised steps aside.
function unstick() {
  for (const v of Game.villagers) {
    if (v.inside) continue;
    const tx = Math.floor(v.x / 16), ty = Math.floor(v.y / 16);
    if (!walkable(tx, ty)) { const t = nearestWalkable(tx, ty); if (t) { v.x = t[0] * 16 + 8; v.y = t[1] * 16 + 12; } }
    if (v.path && v.path.length && v.path.some(([x, y]) => !walkable(Math.floor(x / 16), Math.floor(y / 16)))) {
      const [lx, ly] = v.path[v.path.length - 1];
      v.repathTo(lx, ly);
    }
  }
}

function lotHomeName(lot) {
  const sn = SURNAMES[(lot.i * 7 + 3) % SURNAMES.length];
  return sn + ' ' + HOME_SUFFIX[(lot.i * 5 + 2) % HOME_SUFFIX.length];
}

function openLot(lot, silent = false) {
  lot.state = 'building';
  lot.openOrder = World.lotSeq++;
  paveSpur(lot);
  if (lot.kind === 'home') {
    // knolls come in different sizes
    const d = { cx: lot.cx, cy: lot.cy, rx: 4.1 + hash2(lot.i, 3) * 0.8, ry: 2.75 + hash2(lot.i, 5) * 0.5, site: true, lot: lot.i };
    const name = lotHomeName(lot);
    const home = createHome(d, World.homes.length, name.split(' ')[0], name);
    World.homes.push(home);
    lot.homeId = home.id;
    World._res(home.stepTile[0], home.stepTile[1], 1);
    home.siteStatic = World._addStatic(makeConstruction(), home.doorX + 2, home.doorY + 10, { snow: true });
    const bs = 601 + (home.id % 3);
    World._addStatic(makeBush(bs), (d.cx - d.rx * 0.45 + (home.id % 2)) * 16, (d.cy - d.ry * 0.3) * 16, { gen: { type: 'bush', seed: bs } });
    World.flowers = World.flowers.filter((f) => { const nx = (f.x / 16 - d.cx - 0.5) / (d.rx + 0.5), ny = (f.y / 16 - d.cy - 0.5) / (d.ry + 0.5); return nx * nx + ny * ny > 1; });
  } else if (lot.kind === 'building') {
    for (let y = lot.y0; y <= lot.y1; y++) for (let x = lot.x0; x <= lot.x1; x++) World._blk(x, y);
  } else if (lot.kind === 'well') {
    World._blk(lot.tx, lot.ty);
  }
  if (!silent) {
    applySeasonToStatics(World.season);
    refreshGround([lotBounds(lot), ...lot.spur.map(([x, y]) => [x, y, x, y])]);
    unstick();
  }
}

// Builds the finished thing: furnishes a home, raises a building, digs a well
// or lays out a field.
function finishLot(lot, silent = false) {
  lot.state = 'done';
  const def = lot.def;
  if (lot.kind === 'home') {
    const h = World.homes[lot.homeId];
    if (!h.built) { if (silent) { h.built = true; h.buildProg = 1; if (h.siteStatic) h.siteStatic.hidden = true; furnishHome(h); addHomeFlowers(h); } else completeHome(h); }
    return;
  }
  if (lot.kind === 'building') {
    const b = World._addBuilding(def.key, { x0: lot.x0, x1: lot.x1, y0: lot.y0, y1: lot.y1, img: def.make(false), imgNight: def.make(true), doorOff: def.doorOff, name: def.name, chimneys: def.chimneys || [] });
    b.civic = def.key;
    if (def.rift) b.neon = true;
    if (def.inn) {
      b.isInn = true; b.seats = [];
      const tableImg = makeTable();
      for (const tx of [lot.x0, lot.x1]) {
        const ty = lot.y1 + 3;
        if (!walkable(tx, ty)) continue;
        const x = tx * 16 + 8, y = ty * 16 + 10;
        World._addStatic(tableImg, x, y + 2); World._blk(tx, ty);
        b.seats.push(makeSpot(x, y - 7, 'down', 'sit', 'inn'), makeSpot(x - 16, y + 1, 'right', 'sit', 'inn'), makeSpot(x + 16, y + 1, 'left', 'sit', 'inn'));
      }
      b.serveSpots = b.seats.length ? b.seats.map((s) => ({ x: s.x, y: s.y + 14 })) : [{ x: b.stepX, y: b.stepY }];
    }
  } else if (lot.kind === 'well') {
    World._addStatic(makeWell(), (lot.tx + 0.5) * 16, (lot.ty + 1) * 16 + 2);
    const spot = makeSpot((lot.tx + 0.5) * 16, (lot.ty + 1) * 16 + 12, 'up', 'stand', 'well');
    spot.name = def.name;
    World.wells.push(spot);
  } else if (lot.kind === 'field') {
    for (let y = lot.y0; y <= lot.y1; y++) for (let x = lot.x0; x <= lot.x1; x++) World.tiles[tIdx(x, y)] = T.FIELD;
    const field = { x0: lot.x0, x1: lot.x1, y0: lot.y0, y1: lot.y1, name: def.name, plots: [] };
    const sx = Math.round((lot.x0 + lot.x1) / 2), sy = lot.y0 + 3;
    for (let y = lot.y0; y <= lot.y1; y += 2) for (let x = lot.x0; x <= lot.x1; x++) {
      if (x === sx && y === sy) continue;
      field.plots.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, stage: World.season === 'winter' ? 0 : 1, prog: 0, claimed: null });
    }
    World._addStatic(makeScarecrow(), sx * 16 + 8, sy * 16 + 14); World._blk(sx, sy);
    field.scarecrow = { x: sx * 16 + 8, y: sy * 16 };
    World.fields.push(field);
  }
  if (!silent) {
    applySeasonToStatics(World.season);
    if (lot.kind === 'field') refreshGround([lotBounds(lot)]);
    unstick();
  }
}

// Timber the builders leave alone so every lived-in hole has a fire tonight.
function firewoodReserve() {
  const homes = World.homes.filter((h) => h.built && residentsOf(h).length).length;
  return Math.ceil(homes * ({ spring: 0.6, summer: 0.3, autumn: 1.5, winter: 2 }[World.season] || 1));
}
function buildWood() { return Math.max(0, Village.stores.wood - firewoodReserve()); }
function projectReady(p) {
  const K = PROJECT_KIND[p.kind];
  if (K.scrap && (Village.stores.scrap || 0) < K.scrap) return false;
  if (p.lot != null && World.lots[p.lot].def && World.lots[p.lot].def.rift && (Village.stores.scrap || 0) < 1) return false;
  return !K.wood || buildWood() >= 2;
}

function civicBuilt(key) { return World.lots.some((l) => l.key === key && l.state === 'done'); }
function storeCap(res) { return Math.round((STORE_CAP[res] || 999) * (civicBuilt('storehouse') ? 1.5 : 1)); }
function inns() { return Object.values(World.buildings).filter((b) => b.isInn); }

// ---------------------------------------------------------------------------
// Deciding what to build
// ---------------------------------------------------------------------------
// How many households are waiting for a home of their own.
function housingNeed() {
  let need = 0;
  for (const h of World.homes) {
    if (!h.built) continue;
    const res = residentsOf(h);
    if (res.length > HOME_CAP(h)) need += 1;
    const couples = res.filter((v) => v.spouse && res.some((o) => o.id === v.spouse)).length / 2;
    if (couples > 1) need += Math.floor(couples) - 1;
    if (res.some((v) => leavingNest(v, res))) need += 0.5;
  }
  return Math.ceil(need);
}
// A grown son or daughter who'd like their own place.
function leavingNest(v, res) {
  return v.isGrown() && !v.spouse && v.age >= CHILD_DAYS + 4 && res.length >= 4 && v.parents.some((p) => res.some((o) => o.id === p));
}

function projectLabel(p) {
  if (p.kind === 'home' || p.kind === 'retrofit') return World.homes[p.homeId].name;
  const lot = World.lots[p.lot];
  return lot.def.name.replace(/^the /, 'The ');
}

function startProject(lot) {
  openLot(lot);
  const p = { kind: lot.kind === 'home' ? 'home' : lot.kind, lot: lot.i, prog: 0 };
  if (lot.kind === 'home') p.homeId = lot.homeId;
  Village.projects.push(p);
  return p;
}

function planTown() {
  const live = Game.villagers.filter((v) => !v.leaving);
  const pop = live.length;
  const wrights = live.filter((v) => v.job === 'woodwright').length;
  const maxProjects = 1 + Math.min(2, Math.floor(wrights / 2));
  const P = Village.projects.filter((p) => p.kind !== 'retrofit');
  // homes first: always keep a spare hole or two ready for newlyweds and newcomers
  const built = World.homes.filter((h) => h.built);
  const empty = built.filter((h) => residentsOf(h).length === 0).length;
  const homeProjects = P.filter((p) => p.kind === 'home').length;
  let want = housingNeed() + 1 + Math.floor(pop / 25) - empty - homeProjects;
  while (want > 0 && P.filter((p) => p.kind !== 'field' && p.kind !== 'well').length < maxProjects) {
    // the original knolls first, then the surveyed ones
    const site = World.homes.filter((h) => !h.built && !P.some((p) => p.homeId === h.id))
      .sort((a, b) => dist(a.doorX, a.doorY, PLAZA.cx * 16, PLAZA.cy * 16) - dist(b.doorX, b.doorY, PLAZA.cx * 16, PLAZA.cy * 16))[0];
    if (site) {
      const np = { kind: 'home', homeId: site.id, prog: site.buildProg || 0 };
      P.push(np); Village.projects.push(np);
      if (site.siteStatic) site.siteStatic.hidden = false;
      chronicle(`The woodwrights have started digging a new hobbit-hole on the knoll at ${site.name.replace(/ \w+$/, '')}'s. Timber will be wanted!`, 'build');
    } else {
      const lot = World.lots.find((l) => l.kind === 'home' && l.state === 'planned');
      if (!lot) break;
      const p = startProject(lot);
      P.push(p);
      chronicle(`Thistledown is growing! The woodwrights have staked out a fresh knoll for ${World.homes[p.homeId].name}, a new hobbit-hole.`, 'build');
    }
    want--;
  }
  // the tinkers raise their own buildings alongside, one at a time
  if (!P.some((p) => p.lot != null && World.lots[p.lot].def && World.lots[p.lot].def.rift)) {
    const def = RIFT_CIVIC.find((d) => d.due() && World.lots.some((l) => l.key === d.key && l.state === 'planned'));
    if (def) {
      P.push(startProject(World.lots.find((l) => l.key === def.key)));
      chronicle(`The tinkers have begun raising ${def.name}, half timber and half rift-steel. ${def.desc}.`, 'build');
    }
  }
  // then public works, one at a time, as the village grows into them
  if (P.some((p) => (p.kind === 'building' && !World.lots[p.lot].def.rift) || p.kind === 'well')) return;
  const housed = housingNeed() <= 1;
  for (const def of CIVIC_DEFS) {
    const lot = World.lots.find((l) => l.key === def.key);
    if (!lot || lot.state !== 'planned') continue;
    const due = pop >= def.pop || (def.key === 'storehouse' && ['grain', 'bread', 'veg'].some((k) => Village.stores[k] >= STORE_CAP[k] * 0.95));
    if (!due) continue;
    if (def.kind === 'field') {
      if (P.some((p) => p.kind === 'field')) continue;
      P.push(startProject(lot));
      chronicle(`The farmers are fencing and ploughing ${def.name} to feed the growing village.`, 'build');
      continue;
    }
    if (!housed && P.length >= maxProjects) break;
    startProject(lot);
    chronicle(def.kind === 'well'
      ? `Diggers are sinking ${def.name}. ${def.desc}.`
      : `The woodwrights have begun raising ${def.name}. ${def.desc}.`, 'build');
    break;
  }
}

// One shift of work on a project.
function workProject(v, p) {
  const K = PROJECT_KIND[p.kind];
  const lot = p.lot != null ? World.lots[p.lot] : null;
  const rift = !!(lot && lot.def && lot.def.rift);
  let step = K.rate;
  if (K.scrap) { if ((Village.stores.scrap || 0) < K.scrap) return; Village.use('scrap', K.scrap); }
  if (rift) { if ((Village.stores.scrap || 0) < 1) return; Village.use('scrap', 1); }
  if (K.wood) {
    const wood = Math.min(K.wood, buildWood());
    if (wood <= 0) return;
    Village.use('wood', wood);
    step = K.rate * wood;
  }
  const skill = p.kind === 'field' ? 'farming' : p.kind === 'retrofit' || (v.job === 'tinker' && rift) ? 'tinkering' : 'woodcraft';
  const before = p.prog;
  p.prog = Math.min(1, p.prog + step * v.skillMul(skill));
  // a hole the tinkers did most of the work on comes out wired
  if (v.job === 'tinker' && p.kind === 'home') p.tinkered = (p.tinkered || 0) + (p.prog - before);
  if (p.kind === 'home') World.homes[p.homeId].buildProg = p.prog;
  if (p.prog < 1) { if (R.chance(0.25)) v.say(R.pick(BUILD_PHRASES[rift ? 'rift' : p.kind])); return; }
  Village.projects = Village.projects.filter((x) => x !== p);
  if (p.kind === 'retrofit') { finishRetrofit(World.homes[p.homeId], v); return; }
  if (p.kind === 'home') {
    const h = World.homes[p.homeId];
    if (p.lot != null) finishLot(World.lots[p.lot]); else completeHome(h);
    if ((p.tinkered || 0) >= 0.5) h.neon = true;
    chronicle(`A brand-new hobbit-hole, ${h.name}, is finished! The round door is painted${h.neon ? ', the tinkers have wired in a neon arch' : ''} and the kettle's on.`, 'build');
    v.remember(`Finished building ${h.name}.`, 2);
    Game.schedulePartyTonight('house-warming');
    Village.wantHomes = Math.max(0, Village.wantHomes - 1);
    settleHomes(true);
    return;
  }
  finishLot(lot);
  const nm = lot.def.name;
  if (p.kind === 'field') chronicle(`${nm.charAt(0).toUpperCase() + nm.slice(1)} is ploughed and sown. More barley for bread and ale!`, 'build');
  else if (p.kind === 'well') chronicle(`${nm.charAt(0).toUpperCase() + nm.slice(1)} is finished, and the first bucket comes up cold and sweet.`, 'build');
  else { chronicle(`${nm} is finished! ${lot.def.desc}.`, 'build'); Game.schedulePartyTonight('the opening of ' + nm); }
  v.remember(`Helped build ${nm}.`, 2);
}

// Where a worker stands to work on a project.
function projectSpot(p) {
  if (p.kind === 'home' || p.kind === 'retrofit') { const h = World.homes[p.homeId]; return { x: h.doorX + R.i(-20, 20), y: h.doorY + 14, facing: 'up' }; }
  const lot = World.lots[p.lot];
  if (lot.kind === 'well') return { x: (lot.tx + 0.5) * 16 + R.pick([-20, 20]), y: (lot.ty + 1) * 16 + 10, facing: 'up' };
  if (lot.kind === 'field') {
    const tx = R.i(lot.x0, lot.x1), ty = R.i(lot.y0, lot.y1);
    return { x: tx * 16 + 8, y: ty * 16 + 12, facing: R.pick(['left', 'right']) };
  }
  return { x: (lot.x0 + R.f(0, lot.x1 - lot.x0 + 1)) * 16, y: (lot.y1 + 1) * 16 + 12, facing: 'up' };
}

// ---------------------------------------------------------------------------
// Drawing things under construction
// ---------------------------------------------------------------------------
const SITE_IMG = {};
function lotImage(lot) {
  if (!SITE_IMG[lot.key]) SITE_IMG[lot.key] = lot.kind === 'well' ? makeWell() : lot.def.make(false);
  return SITE_IMG[lot.key];
}
// On the ground layer: stakes, string and fresh furrows for a new field.
function drawFieldSite(ctx, lot, prog) {
  const x0 = lot.x0 * 16, y0 = lot.y0 * 16, w = (lot.x1 - lot.x0 + 1) * 16, h = (lot.y1 - lot.y0 + 1) * 16;
  const rows = Math.round((lot.y1 - lot.y0 + 1) * prog);
  ctx.fillStyle = World.season === 'winter' ? 'rgba(150,140,130,0.6)' : 'rgba(106,70,48,0.85)';
  for (let r = 0; r < rows; r++) ctx.fillRect(x0, y0 + r * 16 + 3, w, 11);
  ctx.fillStyle = 'rgba(244,239,226,0.8)';
  ctx.fillRect(x0, y0, w, 1); ctx.fillRect(x0, y0 + h, w, 1); ctx.fillRect(x0, y0, 1, h); ctx.fillRect(x0 + w, y0, 1, h);
  ctx.fillStyle = '#c9a46a';
  for (const [sx, sy] of [[x0, y0], [x0 + w, y0], [x0, y0 + h], [x0 + w, y0 + h]]) ctx.fillRect(sx - 1, sy - 9, 2, 10);
}
// Y-sorted: the building rises from the ground inside its scaffolding.
function drawLotSite(ctx, lot, prog) {
  const img = lotImage(lot);
  let left, bottom;
  if (lot.kind === 'well') { left = Math.round((lot.tx + 0.5) * 16 - img.width / 2); bottom = (lot.ty + 1) * 16 + 2; }
  else { left = Math.round((lot.x0 + lot.x1 + 1) * 8 - img.width / 2); bottom = (lot.y1 + 1) * 16 + 1; }
  const shown = Math.round(img.height * clamp(prog, 0, 1) * 0.92);
  ctx.fillStyle = 'rgba(90,58,34,0.55)';
  ctx.fillRect(left + 4, bottom - 6, img.width - 8, 6);
  if (shown > 0) ctx.drawImage(img, 0, img.height - shown, img.width, shown, left, bottom - shown, img.width, shown);
  if (lot.kind === 'well') return;
  const top = bottom - Math.max(shown + 8, 20);
  ctx.fillStyle = '#8a6440';
  for (const px of [left + 2, left + img.width / 2 - 1, left + img.width - 5]) ctx.fillRect(Math.round(px), top, 3, bottom - top);
  ctx.fillStyle = '#a07a50';
  for (let y = bottom - 18; y >= top; y -= 18) ctx.fillRect(left, y, img.width, 2);
  ctx.fillRect(left, top, img.width, 3);
  // a stack of timber beside it
  ctx.fillStyle = '#7a5030';
  for (let k = 0; k < 3; k++) ctx.fillRect(left + img.width - 2, bottom - 4 - k * 4, 18 - k * 3, 3);
  ctx.fillStyle = '#d8b07a';
  for (let k = 0; k < 3; k++) ctx.fillRect(left + img.width - 2, bottom - 4 - k * 4, 2, 3);
}

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------
function saveTown() {
  return { opened: World.lots.filter((l) => l.state !== 'planned').sort((a, b) => a.openOrder - b.openOrder).map((l) => [l.i, l.state]), projects: Village.projects };
}
function loadTown(data) {
  if (!data) return;
  for (const [i, state] of data.opened || []) {
    const lot = World.lots[i];
    if (!lot) continue;
    openLot(lot, true);
    if (state === 'done') finishLot(lot, true);
  }
  Village.projects = (data.projects || []).filter((p) => (p.kind === 'home' || p.kind === 'retrofit' ? World.homes[p.homeId] : World.lots[p.lot]));
  for (const p of Village.projects) if (p.kind === 'home') { const h = World.homes[p.homeId]; if (h.siteStatic) h.siteStatic.hidden = false; }
}
