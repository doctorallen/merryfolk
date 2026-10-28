// @ts-check
'use strict';
// ---------------------------------------------------------------------------
// The lie of the land, tile by tile, so that things grow and lie where they
// really would. Worked out in stages, each reading the ones before (as
// Dwarf Fortress builds its worlds):
//   height (the Hill, the river valley)
//   → slope and aspect (which way the ground faces, and so how sunny it is)
//   → water: every tile drains downhill (depressions filled first), and the
//     flow gathers into wet hollows and runnels
//   → wetness, from flow and nearness to the river and pond
//   → soil: rich alluvium on the low flood ground, loam on gentle slopes,
//     thin stony soil on the heights and steep banks, heavy clay where it's
//     wet and flat
// Trees, flowers, grass, rocks and hedges are then sited from these.
// ---------------------------------------------------------------------------

const SOIL = { ALLUVIUM: 0, LOAM: 1, THIN: 2, CLAY: 3 };
const SOIL_NAME = ['alluvium', 'loam', 'thin stony soil', 'heavy clay'];

function computeLand(seed) {
  const W = MAP_W, H = MAP_H, N = W * H, tiles = World.tiles;
  const nh = makeNoise(seed + 9);
  const at = (x, y) => clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1);
  // 1. height, the same land the terraces are painted from
  const h = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) h[y * W + x] = groundHeight(nh, x + 0.5, y + 0.5);
  // 2. slope, and which way it faces (south, toward the bottom of the map, gets the sun)
  const slope = new Float32Array(N), south = new Float32Array(N), sun = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const dx = (h[at(x + 1, y)] - h[at(x - 1, y)]) / 2, dy = (h[at(x, y + 1)] - h[at(x, y - 1)]) / 2;
    slope[i] = Math.hypot(dx, dy);
    south[i] = clamp(-dy / 0.03, -1, 1);
    sun[i] = clamp(0.55 + south[i] * 0.4 - Math.max(0, dx / 0.03) * 0.05, 0, 1);
  }
  // 3. water: the river and pond, how far every tile is from them
  const water = new Uint8Array(N), distWater = new Float32Array(N).fill(999);
  const q = [];
  for (let i = 0; i < N; i++) if (tiles[i] === T.WATER || tiles[i] === T.BRIDGE) { water[i] = 1; distWater[i] = 0; q.push(i); }
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % W, y = (i / W) | 0;
    for (let j = -1; j <= 1; j++) for (let ii = -1; ii <= 1; ii++) {
      if (!ii && !j) continue;
      const nx = x + ii, ny = y + j;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx, d = distWater[i] + (ii && j ? 1.414 : 1);
      if (d < distWater[n]) { distWater[n] = d; q.push(n); }
    }
  }
  // 4. drainage: fill the hollows so every tile can drain (Priority-Flood),
  // then each tile sends its water to its lowest neighbor and the flow adds up
  const filled = Float32Array.from(h), done = new Uint8Array(N);
  const heap = [];
  const push = (i, v) => { heap.push([v, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = c * 2 + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  for (let i = 0; i < N; i++) { const x = i % W, y = (i / W) | 0; if (water[i] || x === 0 || y === 0 || x === W - 1 || y === H - 1) { done[i] = 1; push(i, filled[i]); } }
  const order = [];
  while (heap.length) {
    const [v, i] = pop();
    order.push(i);
    const x = i % W, y = (i / W) | 0;
    for (let j = -1; j <= 1; j++) for (let ii = -1; ii <= 1; ii++) {
      const nx = x + ii, ny = y + j;
      if ((!ii && !j) || nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (done[n]) continue;
      done[n] = 1;
      filled[n] = Math.max(filled[n], v + 1e-5);
      push(n, filled[n]);
    }
  }
  const flow = new Float32Array(N).fill(1);
  for (let k = order.length - 1; k >= 0; k--) {
    const i = order[k];
    if (water[i]) continue;
    const x = i % W, y = (i / W) | 0;
    let best = -1, bv = filled[i];
    for (let j = -1; j <= 1; j++) for (let ii = -1; ii <= 1; ii++) {
      const nx = x + ii, ny = y + j;
      if ((!ii && !j) || nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (filled[n] < bv) { bv = filled[n]; best = n; }
    }
    if (best >= 0) flow[best] += flow[i];
  }
  // 5. wetness: water gathering where the ground is flat, and the river's banks
  const moist = new Float32Array(N), soil = new Uint8Array(N);
  let tmax = 0;
  const twi = new Float32Array(N);
  for (let i = 0; i < N; i++) { twi[i] = Math.log(flow[i] / (slope[i] + 0.004)); tmax = Math.max(tmax, twi[i]); }
  for (let i = 0; i < N; i++) {
    const t = clamp((twi[i] - 5) / Math.max(1, tmax - 5), 0, 1);
    moist[i] = water[i] ? 1 : clamp(0.62 * Math.exp(-distWater[i] / 4.5) + 0.5 * t + gen('wet'), 0, 1);
    // 6. soil, from where the tile lies
    const s = slope[i] / 0.03;
    soil[i] = h[i] < 0.24 && distWater[i] < 7 ? SOIL.ALLUVIUM : h[i] > 0.62 || s > 1.1 ? SOIL.THIN : moist[i] > 0.4 && s < 0.6 ? SOIL.CLAY : SOIL.LOAM;
  }
  World.land = { h, slope, south, sun, flow, moist, soil, distWater, filled };
  return World.land;
}
// Handy readers for one tile.
function landAt(key, tx, ty) { const L = World.land; return L ? L[key][clamp(ty, 0, MAP_H - 1) * MAP_W + clamp(tx, 0, MAP_W - 1)] : 0; }
function slopeN(tx, ty) { return clamp(landAt('slope', tx, ty) / 0.03, 0, 2); }

// Colors for the dev overlay, one per field.
const LAND_VIEWS = ['off', 'height', 'slope', 'sun', 'wet', 'flow', 'soil'];
function landColor(view, i) {
  const L = World.land;
  switch (view) {
    case 'height': { const v = L.h[i]; return `rgba(${Math.round(255 * v)},${Math.round(200 * v)},${Math.round(80 + 100 * (1 - v))},0.55)`; }
    case 'slope': { const v = clamp(L.slope[i] / 0.04, 0, 1); return `rgba(255,${Math.round(220 * (1 - v))},40,${0.15 + v * 0.5})`; }
    case 'sun': { const v = L.sun[i]; return `rgba(255,${Math.round(150 + 100 * v)},40,${Math.abs(v - 0.5) * 1.1})`; }
    case 'wet': { const v = L.moist[i]; return `rgba(40,${Math.round(120 + 60 * v)},255,${v * 0.6})`; }
    case 'flow': { const v = clamp(Math.log(L.flow[i]) / 6, 0, 1); return `rgba(60,200,255,${v * v * 0.8})`; }
    case 'soil': return ['rgba(140,90,40,0.5)', 'rgba(120,200,60,0.35)', 'rgba(200,200,200,0.5)', 'rgba(170,120,200,0.45)'][L.soil[i]];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Built ground is leveled. Fields, buildings, the square, pens, orchards,
// allotments, gardens and the plots surveyed for building each sit on a flat
// pad at one terrace's height (with a yard's margin for hedges, fences and
// doorsteps), blending back into the hillside over a couple of tiles, so no
// terrace bank runs through a barley field or under a bakery.
// ---------------------------------------------------------------------------
const PAD_MARGIN = 1, PAD_FADE = 2.5;
function gatherPads() {
  const P = [];
  const rect = (x0, y0, x1, y1) => P.push({ x0: x0 - PAD_MARGIN, y0: y0 - PAD_MARGIN, x1: x1 + PAD_MARGIN, y1: y1 + PAD_MARGIN });
  for (const f of FIELDS) rect(f.x0, f.y0, f.x1, f.y1);
  rect(WEED_FIELD.x0, WEED_FIELD.y0, WEED_FIELD.x1, WEED_FIELD.y1);
  rect(PLAZA.cx - 5, PLAZA.cy - 4, PLAZA.cx + 5, PLAZA.cy + 4);
  for (const b of Object.values(World.buildings)) rect(b.x0, b.y0 ?? b.y1 - 2, b.x1, b.y1 + 1);
  for (const p of World.pens || []) rect(p.x0, p.y0, p.x1, p.y1);
  for (const a of World.allotments || []) rect(a.x0, a.y0, a.x1, a.y1);
  const o2 = World.orchard2;
  if (o2) rect(o2.x0, o2.y0, o2.x1, o2.y1);
  // the old orchard on the Hill, round its rows of trees
  const old = (World.orchard || []).filter((t) => t.home == null && !(o2 && t.tx >= o2.x0 && t.tx <= o2.x1 && t.ty >= o2.y0 && t.ty <= o2.y1));
  if (old.length) rect(Math.min(...old.map((t) => t.tx)), Math.min(...old.map((t) => t.ty)), Math.max(...old.map((t) => t.tx)), Math.max(...old.map((t) => t.ty)) + 1);
  for (const l of World.lots || []) {
    if (l.kind === 'home') continue; // new holes are dug into their own knolls
    if (l.x0 != null) rect(l.x0, l.y0, l.x1, l.y1 + (l.kind === 'building' ? 1 : 0));
    else if (l.tx != null) rect(l.tx - 1, l.ty - 1, l.tx + 1, l.ty + 1);
  }
  if (World.memorial) { const m = World.memorial; rect(m.x0, m.y0, m.x1, m.y1); }
  // each hobbit-hole's garden strip in front of the door
  for (const h of World.homes) { const [sx, sy] = h.stepTile; rect(sx - 4, sy, sx + 4, sy + 1); }
  // each pad's height: the average of the ground it covers, set in the middle of a terrace
  const nh = makeNoise(World.seed + 9);
  for (const p of P) {
    let s = 0, n = 0;
    for (let y = p.y0; y <= p.y1; y++) for (let x = p.x0; x <= p.x1; x++) { s += landHeight(nh, x + 0.5, y + 0.5); n++; }
    p.h = (Math.floor((s / n) * TERRACES) + 0.5) / TERRACES;
  }
  // which pads reach each tile, so a height lookup checks only those
  const near = Array.from({ length: MAP_W * MAP_H }, () => null);
  P.forEach((p, k) => {
    for (let y = Math.max(0, Math.floor(p.y0 - PAD_FADE)); y <= Math.min(MAP_H - 1, Math.ceil(p.y1 + PAD_FADE)); y++)
      for (let x = Math.max(0, Math.floor(p.x0 - PAD_FADE)); x <= Math.min(MAP_W - 1, Math.ceil(p.x1 + PAD_FADE)); x++) (near[y * MAP_W + x] || (near[y * MAP_W + x] = [])).push(k);
  });
  World.pads = P; World.padNear = near;
}
// The height of the ground at a point (in tiles): the lie of the land, leveled where it's built on.
function groundHeight(nh, x, y) {
  let h = landHeight(nh, x, y);
  if (World.cliffMask) h = Math.min(0.999, h + cliffRise(x, y));
  const near = World.padNear && World.padNear[clamp(Math.floor(y), 0, MAP_H - 1) * MAP_W + clamp(Math.floor(x), 0, MAP_W - 1)];
  if (!near) return h;
  for (const k of near) {
    const p = World.pads[k];
    const dx = Math.max(p.x0 - x, 0, x - (p.x1 + 1)), dy = Math.max(p.y0 - y, 0, y - (p.y1 + 1));
    const d = Math.hypot(dx, dy);
    if (d >= PAD_FADE) continue;
    const t = 1 - d / PAD_FADE;
    h += (p.h - h) * t * t * (3 - 2 * t);
  }
  return h;
}
// Does a terrace bank run through this tile, where a tree or bush would stand?
function onBank(tx, ty) {
  if (cliffTile(tx, ty)) return true;
  const nh = World._nh || (World._nh = makeNoise(World.seed + 9));
  let lv = -1;
  for (const [fx, fy] of [[0.15, 0.2], [0.85, 0.2], [0.5, 0.6], [0.15, 1.05], [0.85, 1.05], [0.5, 1.4]]) {
    const l = Math.floor(groundHeight(nh, tx + fx, ty + fy) * TERRACES);
    if (lv < 0) lv = l; else if (l !== lv) return true;
  }
  return false;
}
