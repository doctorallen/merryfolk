// @ts-check
'use strict';
// ---------------------------------------------------------------------------
// Cliffs. Out in the wilder parts of the valley, well away from anything
// built, some of the terrace banks are bare rock: a tall face of weathered
// boulders, grass hanging over the lip and a shadow along the foot. Nobody
// climbs one. Where a lane runs up a cliff, steps are cut into the rock, and
// so they are wherever the ground above would otherwise be cut off.
//
// Which banks turn to rock comes from a broad noise field, faded out near the
// village (World.cliffMask, per tile). The tiles a face or foot covers are
// blocked and kept clear (World.cliff: 1 rock, 2 steps). Both are worked out
// from the seed at world generation, so a reloaded valley has the same cliffs.
// ---------------------------------------------------------------------------

const CLIFF_MIN = 0.35;          // mask strength at which a bank turns to rock
const CLIFF_FACE = [16, 40];     // how far a face drops, in world pixels, as the mask strengthens
const cliffFaceH = (m) => Math.round(CLIFF_FACE[0] + clamp((m - CLIFF_MIN) / 0.3, 0, 1) * (CLIFF_FACE[1] - CLIFF_FACE[0]));

// The mask at a world pixel, blended between tile centres.
function cliffAt(px, py, M = World.cliffMask) {
  if (!M) return 0;
  const gx = clamp(px / TILE - 0.5, 0, MAP_W - 1.001), gy = clamp(py / TILE - 0.5, 0, MAP_H - 1.001);
  const ix = Math.floor(gx), iy = Math.floor(gy), wx = gx - ix, wy = gy - iy, i = iy * MAP_W + ix;
  return (M[i] * (1 - wx) + M[i + 1] * wx) * (1 - wy) + (M[i + MAP_W] * (1 - wx) + M[i + MAP_W + 1] * wx) * wy;
}
const cliffTile = (tx, ty) => (World.cliff && inMap(tx, ty) ? World.cliff[tIdx(tx, ty)] : 0);
// Inside a rocky stretch the ground steps up a whole terrace along a wavy
// line, so every stretch has an escarpment for its cliff to follow.
function cliffRise(x, y) {
  const m = cliffAt(x * TILE, y * TILE, World.cliffZone);
  if (m <= CLIFF_MIN * 0.6) return 0;
  if (!World._cliffEdge) return 0;
  const e = World._cliffEdge(x * 0.11, y * 0.11) - 0.5;
  const t = clamp((e + 0.025) / 0.05, 0, 1), s = clamp((m - CLIFF_MIN * 0.6) / (CLIFF_MIN * 0.6), 0, 1);
  // the full terrace where the rock is strong, dying away quickly round its edges
  return s * 0.27 * t * t * (3 - 2 * t);
}
// Raising or lowering ground beside a cliff would leave its face hanging.
function nearCliff(tx, ty, r = 3) {
  if (!World.cliffMask) return false;
  for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (inMap(x, y) && World.cliffMask[tIdx(x, y)] > CLIFF_MIN * 0.5) return true;
  return false;
}

// Called at world generation once the built ground is levelled, before the
// hedges, woods and grass go in, so they keep off the rock.
function computeCliffs(seed) {
  World.cliffMask = null; World.cliffZone = null; World.cliff = null;
  const k = gen('cliffs');
  if (!k) return;
  World._cliffEdge = makeNoise(seed + 61);
  const W = MAP_W, H = MAP_H, N = W * H, tiles = World.tiles;
  // how far each tile is from anything built, laid out or wet
  const dist = new Uint8Array(N).fill(255), q = [];
  const settle = (i) => { if (dist[i]) { dist[i] = 0; q.push(i); } };
  for (let i = 0; i < N; i++) {
    const t = tiles[i];
    if ((t !== T.GRASS && t !== T.PATH) || World.reserved[i] || World.block[i]) settle(i);
  }
  for (const p of World.pads || []) for (let y = Math.max(0, p.y0); y <= Math.min(H - 1, p.y1); y++) for (let x = Math.max(0, p.x0); x <= Math.min(W - 1, p.x1); x++) settle(y * W + x);
  for (const l of World.lots || []) if (l.tx != null) settle(tIdx(clamp(l.tx, 0, W - 1), clamp(l.ty, 0, H - 1)));
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % W, y = (i / W) | 0, d = dist[i] + 1;
    if (d > 8) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (dist[n] > d) { dist[n] = d; q.push(n); }
    }
  }
  // rocky stretches come and go along the banks, more of them for a craggier valley
  const nc = makeNoise(seed + 53), nh0 = makeNoise(seed + 9), lo = 0.53 - (k - 1) * 0.09;
  const M = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    M[i] = clamp((nc(x * 0.075, y * 0.075) - lo) / 0.1, 0, 1) * clamp((dist[i] - 2.5) / 2.5, 0, 1);
  }
  // a crag needs room: rocky patches squeezed between the lots are let go
  const seen = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (seen[i] || M[i] <= CLIFF_MIN) continue;
    const zone = [i]; seen[i] = 1;
    for (let h = 0; h < zone.length; h++) {
      const j = zone[h], x = j % W, y = (j / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, n = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[n] || M[n] <= CLIFF_MIN) continue;
        seen[n] = 1; zone.push(n);
      }
    }
    if (zone.length < 30) for (const j of zone) M[j] = 0;
  }
  World.cliffZone = M;
  // crags: on broken ground, the steepest of the natural banks nearer the
  // village are bare rock too, though the land isn't raised for them
  const M2 = new Float32Array(M), rf = gen('relief');
  if (rf) {
    const thr = 0.055 / Math.sqrt(rf * k);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (dist[i] < 2 || M2[i] > CLIFF_MIN || tiles[i] !== T.GRASS) continue;
      const g = Math.hypot(landHeight(nh0, x + 1.5, y + 0.5) - landHeight(nh0, x - 0.5, y + 0.5), landHeight(nh0, x + 0.5, y + 1.5) - landHeight(nh0, x + 0.5, y - 0.5)) / 2;
      if (g > thr) M2[i] = clamp(CLIFF_MIN + 0.05 + (g - thr) * 10, 0, 0.9);
    }
    // a crag is a stretch of bank, not one stone: lone tiles are let go, and
    // gaps of one tile closed; then the rock spreads a tile either way, so it
    // still counts once blended between tile centres
    const one = new Float32Array(M2);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      let nb = 0; for (const d of [1, -1, W, -W]) if (one[i + d] > CLIFF_MIN) nb++;
      if (one[i] > CLIFF_MIN && !nb) M2[i] = M[i];
      else if (one[i] <= CLIFF_MIN && nb >= 3 && dist[i] >= 2) M2[i] = Math.max(M2[i], CLIFF_MIN + 0.1);
    }
    // and three tiles together at the least, or it's a stub of rock sticking up
    const seen2 = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (seen2[i] || M2[i] <= CLIFF_MIN || M[i] > CLIFF_MIN) continue;
      const run = [i]; seen2[i] = 1;
      for (let h = 0; h < run.length; h++) {
        const j = run[h], x = j % W, y = (j / W) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, n = ny * W + nx;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen2[n] || M2[n] <= CLIFF_MIN || M[n] > CLIFF_MIN) continue;
          seen2[n] = 1; run.push(n);
        }
      }
      if (run.length < 3) for (const j of run) M2[j] = M[j];
    }
    const core = new Float32Array(M2);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (core[i] > CLIFF_MIN && M[i] <= CLIFF_MIN) {
        M2[i] = Math.max(M2[i], 0.85);
        for (const d of [1, -1, W, -W, W + 1, W - 1, -W + 1, -W - 1]) if (dist[i + d] >= 1 && core[i + d] <= CLIFF_MIN) M2[i + d] = Math.max(M2[i + d], 0.7);
      }
    }
  }
  World.cliffMask = M2;

  // which tiles a face covers, or sit at the foot of the rock
  const nh = makeNoise(seed + 9);
  const lvAt = (px, py) => Math.floor(groundHeight(nh, px / TILE, py / TILE) * TERRACES);
  const C = new Uint8Array(N);
  const reach = CLIFF_FACE[1] + 2;
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const i = ty * W + tx, sx = tx * TILE + 8, sy = ty * TILE + 11;
    if (cliffAt(sx, sy) <= CLIFF_MIN && cliffAt(sx, sy - reach) <= CLIFF_MIN) continue;
    const lv = lvAt(sx, sy);
    let rock = false;
    // a face hanging over it from an edge above, as tall as the rock is strong there
    for (const cx of [sx - 5, sx, sx + 5]) for (let d = 3; d <= reach && !rock; d += 3) {
      if (lvAt(cx, sy - d) <= lv) continue;
      const m = cliffAt(cx, sy - d);
      rock = m > CLIFF_MIN && d <= cliffFaceH(m) + 2;
      break;
    }
    // or the foot of rock rising beside or behind it
    if (!rock && M[i] > CLIFF_MIN) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]]) if (lvAt(sx + dx * 14, sy + dy * 14) > lv) rock = true;
    if (rock) C[i] = isRoadTile(tiles[i]) ? 2 : 1;
  }
  World.cliff = C;
  cutCliffSteps();
  for (let i = 0; i < N; i++) if (C[i] === 1) { World.block[i] = 1; World.reserved[i] = 1; }
}

// Wherever a stretch of open ground can't be reached from the square without
// climbing, steps are cut through the shortest bit of cliff in the way.
function cutCliffSteps() {
  const W = MAP_W, H = MAP_H, N = W * H, C = World.cliff;
  const open = (i) => C[i] !== 1 && walkable(i % W, (i / W) | 0);
  const s0 = nearestWalkable(PLAZA.cx, PLAZA.cy);
  if (!s0) return;
  const comp = new Int32Array(N).fill(-1), sizes = [];
  for (let i = 0; i < N; i++) {
    if (comp[i] >= 0 || !open(i)) continue;
    const id = sizes.length, q = [i];
    comp[i] = id;
    for (let h = 0; h < q.length; h++) {
      const j = q[h], x = j % W, y = (j / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, n = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || comp[n] >= 0 || !open(n)) continue;
        comp[n] = id; q.push(n);
      }
    }
    sizes.push(q.length);
  }
  const main = new Uint8Array(sizes.length);
  main[comp[tIdx(s0[0], s0[1])]] = 1;
  // join each cut-off patch (bigger than a nook) to the ground already joined, nearest first
  for (let pass = 0; pass < 80; pass++) {
    let best = null;
    for (let id = 0; id < sizes.length; id++) {
      if (main[id] || sizes[id] < 4) continue;
      // through the rock from this patch, straight up or down by preference, to joined ground
      const from = new Int32Array(N).fill(-2), q = [];
      for (let i = 0; i < N; i++) if (comp[i] === id) { from[i] = -1; q.push(i); }
      let hit = -1;
      for (let h = 0; h < q.length && hit < 0; h++) {
        const j = q[h], x = j % W, y = (j / W) | 0;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nx = x + dx, ny = y + dy, n = ny * W + nx;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || from[n] !== -2) continue;
          if (comp[n] >= 0 && main[comp[n]]) { from[n] = j; hit = n; break; }
          if (C[n] !== 1) continue;
          let depth = 0; for (let k = j; from[k] >= 0; k = from[k]) depth++;
          if (depth >= 4) continue;
          from[n] = j; q.push(n);
        }
      }
      if (hit < 0) continue;
      const run = [];
      for (let k = from[hit]; k >= 0 && comp[k] !== id; k = from[k]) run.push(k);
      if (!best || run.length < best.run.length) best = { id, run };
    }
    if (!best) break;
    for (const i of best.run) C[i] = 2;
    main[best.id] = 1;
    // anything that patch already touched is joined now too
    for (let id = 0; id < sizes.length; id++) if (!main[id] && best.run.some((i) => [1, -1, W, -W].some((d) => comp[i + d] === id))) main[id] = 1;
  }
}

// --- Painting ---------------------------------------------------------------
const CLIFF_PAL = {
  spring: { hi: [206, 182, 122], mid: [156, 130, 84], lo: [98, 78, 50], gap: [54, 40, 28], moss: [104, 136, 58] },
  summer: { hi: [210, 186, 124], mid: [160, 134, 86], lo: [100, 80, 50], gap: [54, 40, 28], moss: [98, 128, 52] },
  autumn: { hi: [200, 172, 118], mid: [150, 122, 80], lo: [94, 72, 48], gap: [52, 38, 26], moss: [140, 120, 56] },
  winter: { hi: [214, 214, 222], mid: [146, 136, 128], lo: [92, 86, 84], gap: [50, 46, 48], moss: [240, 244, 250] },
};
const lerpRGB = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Weathered boulders, lit from the top left: the nearest of a jittered grid
// of stones, each shaded as a dome, with dark gaps where they meet.
function rockColour(px, py, k, fh, P, winter) {
  const SX = 10, SY = 8, gx = Math.floor(px / SX), gy = Math.floor(py / SY);
  let d1 = 1e9, d2 = 1e9, fx = 0, fy = 0, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = gx + i, cy = gy + j;
    const qx = (cx + 0.2 + hash2(cx, cy * 3 + 1) * 0.6) * SX, qy = (cy + 0.2 + hash2(cx * 5 + 2, cy) * 0.6) * SY;
    const d = Math.hypot(px + 0.5 - qx, (py + 0.5 - qy) * 1.15);
    if (d < d1) { d2 = d1; d1 = d; fx = qx; fy = qy; id = hash2(cx * 7, cy * 11); } else if (d < d2) d2 = d;
  }
  if (d2 - d1 < 1.1) return P.gap;
  const lx = px + 0.5 - fx, ly = py + 0.5 - fy;
  const sh = clamp(-(lx * 0.55 + ly * 0.9) / 4.5, -1, 1);
  let c = sh > 0 ? lerpRGB(P.mid, P.hi, sh * 0.85) : lerpRGB(P.mid, P.lo, -sh * 0.9);
  if (d2 - d1 < 2.2) c = lerpRGB(c, P.lo, 0.45);
  c = lerpRGB(c, id < 0.5 ? P.lo : P.hi, Math.abs(id - 0.5) * 0.25);
  // darker towards the foot, in the shadow of the rock above
  c = lerpRGB(c, P.gap, clamp(k / fh, 0, 1) * 0.3);
  // moss (or snow) on the tops of some stones
  if (ly < -1.4 && sh > 0.15 && (winter || id < 0.35)) c = lerpRGB(c, P.moss, winter ? 0.85 : 0.6);
  return c;
}
// Steps cut into the rock: stone treads with a lit front edge and a dark riser.
function stepColour(px, py, k) {
  const r = k % 4, n = hash2(px >> 2, (py - k) * 31 + Math.floor(k / 4));
  if (r === 0) return [66, 52, 38];
  if (r === 1) return [196, 184, 152];
  return lerpRGB([150, 138, 112], [170, 158, 128], n);
}

// The colour of a world pixel of grass or path where a cliff runs, or null
// to paint it as usual. `col` is the ground's own colour there.
function cliffPixel(px, py, lv, col, ctx) {
  const reach = CLIFF_FACE[1] + 6, m = cliffAt(px, py);
  if (m <= CLIFF_MIN && cliffAt(px, py - reach) <= CLIFF_MIN) return null;
  const { level1, W, H, season, lipCol, road } = ctx;
  const P = CLIFF_PAL[season], winter = season === 'winter';
  // how far below the top edge of a face this pixel is; the face is as tall as the rock is strong at its top
  let k = 0, fh = 0;
  for (let d = 1; d <= reach && py - d >= 0; d++) {
    if (level1[(py - d) * W + px] <= lv) continue;
    const me = cliffAt(px, py - d);
    if (me > CLIFF_MIN) { k = d; fh = cliffFaceH(me); }
    break;
  }
  if (k > fh + 5) k = 0;
  const ti = tIdx(px >> 4, py >> 4), steps = road || (World.cliff && World.cliff[ti] === 2);
  if (k && k <= fh) {
    if (steps) {
      // the steps' own walls where they're cut through the grass
      const ex = px & 15;
      if (!road && (ex < 2 || ex > 13)) return rockColour(px, py, k, fh, P, winter);
      return stepColour(px, py, k);
    }
    // grass hangs over the lip in a ragged fringe
    const lip = 1 + Math.floor(hash2(px >> 1, 77) * 3);
    if (k <= lip) return lerpRGB(lipCol, [40, 70, 30], winter ? 0.1 : (k - 1) * 0.3 + 0.2);
    // a hard dark line where the rock meets the ground
    if (k >= fh - 1) return P.gap;
    return rockColour(px, py, k, fh, P, winter);
  }
  if (k > fh && !road) {
    // the shadow at the foot, with a few fallen stones
    const t = 1 - (k - fh) / 6;
    if (hash2(px, py * 3) < 0.05) return lerpRGB(P.mid, P.lo, hash2(py, px));
    return lerpRGB(col, [20, 26, 16], 0.4 * t);
  }
  // a rock edge where the ground drops away to the north, or to the side (cut into steps on a step tile)
  if (!road && m > CLIFF_MIN) {
    let rim = false;
    for (let d = 1; d <= 2 && !rim; d++) if (py - d >= 0 && level1[(py - d) * W + px] < lv) rim = true;
    for (let d = 1; d <= 3 && !rim; d++) if ((px + d < W && level1[py * W + px + d] > lv) || (px - d >= 0 && level1[py * W + px - d] > lv)) rim = true;
    if (rim) return steps ? stepColour(px, py, py & 15) : rockColour(px, py, 3, 8, P, winter);
  }
  return null;
}
