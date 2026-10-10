'use strict';
// ---------------------------------------------------------------------------
// Farmland: animal pens (sheep, cows, pigs) tended by the herder, a second
// orchard, and vegetable allotments the farmers work. Laid out when the world
// is made, on open land near the spot each one suits, before the woods grow.
// ---------------------------------------------------------------------------

const PEN_DEFS = [
  { kind: 'sheep', name: 'the sheepfold', w: 9, h: 5, anchor: [8, 62], count: 6 },
  { kind: 'cow', name: 'the cow paddock', w: 10, h: 6, anchor: [86, 80], count: 4 },
  { kind: 'pig', name: 'the pig sty', w: 6, h: 4, anchor: [48, 70], count: 3 },
];
const ANIMAL_INFO = {
  sheep: { speed: 3, label: 'Sheep', say: ['Baa!', 'Baaa-aa!', 'Meh-eh-eh!'] },
  cow: { speed: 2, label: 'Cows', say: ['Moo!', 'Mooooo.', 'Mrrrm.'] },
  pig: { speed: 3.5, label: 'Pigs', say: ['Oink!', 'Snrf snrf.', 'Oink oink!'] },
};

// Finds open grass for a w×h rectangle near an anchor, with a path to a road.
function surveyRect(w, h, ax, ay, maxR, startAt) {
  let best = null, bs = 1e9;
  for (let dy = -maxR; dy <= maxR; dy++) for (let dx = -maxR; dx <= maxR; dx++) {
    const x0 = ax + dx, y0 = ay + dy, x1 = x0 + w - 1, y1 = y0 + h - 1;
    if (!lotFree([x0, y0, x1, y1], [x0 - 1, y0 - 1, x1 + 1, y1 + 1])) continue;
    const gx = x0 + (w >> 1);
    const starts = startAt === 'any' ? [[gx, y1 + 1], [gx, y0 - 1]] : [[gx, y1 + 1]];
    const spur = findSpur(starts, [x0, y0, x1, y1], 16);
    if (!spur) continue;
    const s = Math.hypot(dx, dy) + spur.length * 0.5;
    if (s < bs) { bs = s; best = { x0, y0, x1, y1, spur, gx }; }
  }
  return best;
}

function planFarmland() {
  World.pens = []; World.animals = []; World.allotments = [];
  const fenceH = makeFence(true), fenceV = makeFence(false);
  const add = World._addStatic, blk = World._blk;
  // --- pens with fences and a gate on the side nearest the road ---
  for (const def of PEN_DEFS) {
    const r = surveyRect(def.w, def.h, def.anchor[0], def.anchor[1], 18);
    if (!r) continue;
    reserveRect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1); reserveTiles(r.spur);
    for (const [x, y] of r.spur) if (World.tiles[tIdx(x, y)] === T.GRASS) World.tiles[tIdx(x, y)] = T.PATH;
    const pen = { ...def, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, gate: { x: r.gx * 16 + 8, y: (r.y1 + 1) * 16 + 12 }, tend: 0.6 };
    // fences run round the inside edge; the gate is left open at the bottom middle
    for (let x = r.x0; x <= r.x1; x++) {
      add(fenceH, x * 16 + 8, r.y0 * 16 + 4); blk(x, r.y0);
      if (x !== r.gx) { add(fenceH, x * 16 + 8, r.y1 * 16 + 14); blk(x, r.y1); }
    }
    for (let y = r.y0; y <= r.y1; y++) {
      add(fenceV, r.x0 * 16 + 2, y * 16 + 16); blk(r.x0, y);
      add(fenceV, r.x1 * 16 + 14, y * 16 + 16); blk(r.x1, y);
    }
    if (def.kind === 'pig') for (let y = r.y0 + 1; y < r.y1; y++) for (let x = r.x0 + 1; x < r.x1; x++) World.tiles[tIdx(x, y)] = T.SOIL;
    // a trough and a little shelter
    add(makeTrough(), (r.x0 + 1.5) * 16, (r.y0 + 1) * 16 + 12);
    blk(r.x0 + 1, r.y0 + 1);
    if (def.kind !== 'pig') { add(makeHay(), (r.x1 - 1) * 16, (r.y0 + 1) * 16 + 12); blk(r.x1 - 1, r.y0 + 1); }
    else { add(makeShelter(), (r.x1 - 1.5) * 16, (r.y0 + 2) * 16 + 4); blk(r.x1 - 2, r.y0 + 1); blk(r.x1 - 1, r.y0 + 1); }
    World.pens.push(pen);
    for (let i = 0; i < def.count; i++) {
      World.animals.push({
        kind: def.kind, pen, x: (r.x0 + 1.5 + Math.random() * (r.x1 - r.x0 - 2)) * 16, y: (r.y0 + 1.8 + Math.random() * (r.y1 - r.y0 - 2)) * 16,
        a: Math.random() * 6, t: 0, graze: 0, coat: i % 3,
      });
    }
  }
  // --- a second orchard on the south bank ---
  const orch = surveyRect(13, 8, 22, 64, 20);
  if (orch) {
    reserveRect(orch.x0 - 1, orch.y0 - 1, orch.x1 + 1, orch.y1 + 1); reserveTiles(orch.spur);
    for (const [x, y] of orch.spur) if (World.tiles[tIdx(x, y)] === T.GRASS) World.tiles[tIdx(x, y)] = T.PATH;
    for (let gy = orch.y0; gy <= orch.y1 - 1; gy += 3) for (let gx = orch.x0 + ((gy - orch.y0) % 6 ? 2 : 0); gx <= orch.x1; gx += 4) {
      const seed = 900 + ((gx + gy) % 3);
      add(makeTree(seed, 'apple'), gx * 16 + 8, (gy + 1) * 16 - 2, { gen: { type: 'tree', seed, kind: 'apple' } }); blk(gx, gy);
      World.orchard.push({ tx: gx, ty: gy, x: gx * 16 + 8, y: (gy + 1) * 16 + 12, apples: 2, claimed: null });
      if (World.shade.length < 30 && gy + 1 <= orch.y1) World.shade.push(makeSpot(gx * 16 + 8, (gy + 1) * 16 + 10, 'down', 'sit', 'shade'));
    }
    World.orchard2 = orch;
  }
  // --- vegetable allotments: rows of cabbages, carrots, taters and pumpkins ---
  for (const [ax, ay] of [[70, 76], [30, 44]]) {
    const r = surveyRect(10, 5, ax, ay, 16, 'any');
    if (!r) continue;
    reserveRect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1); reserveTiles(r.spur);
    for (const [x, y] of r.spur) if (World.tiles[tIdx(x, y)] === T.GRASS) World.tiles[tIdx(x, y)] = T.PATH;
    const allot = { x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, plots: [] };
    for (let y = r.y0; y <= r.y1; y += 2) for (let x = r.x0; x <= r.x1; x++) {
      World.tiles[tIdx(x, y)] = T.SOIL;
      allot.plots.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, crop: CROP_TYPES[((y - r.y0) / 2 + Math.floor((x - r.x0) / 4)) % CROP_TYPES.length], stage: 1 + Math.floor(Math.random() * 3), prog: Math.random(), claimed: null });
    }
    // a scarecrow-free patch, but a wheelbarrow by the gate
    add(makeBarrow(), (r.x1 + 0.6) * 16, (r.y1 + 1) * 16 + 6);
    World.allotments.push(allot);
  }
  // hay bales and a cart around the barley fields
  for (const f of FIELDS) {
    for (const [dx, dy] of [[-1.6, 1], [-1.4, 3.2]]) {
      const tx = Math.floor(f.x0 + dx), ty = Math.floor(f.y0 + dy);
      if (lotFree([tx, ty, tx, ty])) { add(makeHay(), (f.x0 + dx) * 16, (f.y0 + dy) * 16 + 12); blk(tx, ty); }
    }
  }
}

// Animals mill about inside their pens, grazing and nosing about.
function updateAnimals(dtMin) {
  for (const an of World.animals) {
    const p = an.pen, info = ANIMAL_INFO[an.kind];
    an.t -= dtMin;
    if (an.t <= 0) {
      an.graze = Math.random() < 0.55 ? 4 + Math.random() * 12 : 0;
      an.a = Math.random() * Math.PI * 2;
      an.t = 6 + Math.random() * 16;
      if (Math.random() < 0.04) an.say = { text: R.pick(info.say), t: 2 };
    }
    if (an.say) { an.say.t -= dtMin / 3; if (an.say.t <= 0) an.say = null; }
    if (an.graze > 0) { an.graze -= dtMin; continue; }
    const nx = an.x + Math.cos(an.a) * dtMin * info.speed, ny = an.y + Math.sin(an.a) * dtMin * info.speed * 0.6;
    if (nx > (p.x0 + 1.3) * 16 && nx < (p.x1 - 0.3) * 16 && ny > (p.y0 + 1.6) * 16 && ny < (p.y1 + 0.6) * 16) { an.x = nx; an.y = ny; }
    else an.t = 0;
  }
  for (const al of World.allotments) for (const pl of al.plots) growPlot(pl, dtMin, (Game.raining ? 1 / 170 : 1 / 340) * SEASON_GROWTH[World.season]);
  for (const p of World.pens) p.tend = Math.max(0, p.tend - dtMin / 2400);
}
