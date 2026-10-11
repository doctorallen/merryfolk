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
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) h[y * W + x] = landHeight(nh, x + 0.5, y + 0.5);
  // 2. slope, and which way it faces (south, towards the bottom of the map, gets the sun)
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
  // then each tile sends its water to its lowest neighbour and the flow adds up
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
// What a tile is like, for the dev overlay's hover.
function landWords(tx, ty) {
  return `height ${landAt('h', tx, ty).toFixed(2)} · slope ${slopeN(tx, ty).toFixed(2)} · sun ${landAt('sun', tx, ty).toFixed(2)} · wet ${landAt('moist', tx, ty).toFixed(2)} · flow ${Math.round(landAt('flow', tx, ty))} · ${SOIL_NAME[landAt('soil', tx, ty)]}`;
}

// Colours for the dev overlay, one per field.
const LAND_VIEWS = ['off', 'height', 'slope', 'sun', 'wet', 'flow', 'soil'];
function landColour(view, i) {
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
