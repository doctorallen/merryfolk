'use strict';
// ---------------------------------------------------------------------------
// Production you lay out yourself, and land that matters (Banished, Anno,
// Farthest Frontier): plough new barley fields where the soil is good, plant
// orchards and woodlots, set out beehives. Crops grow faster on rich soil
// (river alluvium best, then loam, heavy clay, and thin stony ground worst),
// and the build ghost tells you what the ground is like before you commit.
// And a map of the whole valley in the corner, to see the shape of things and
// jump about.
// ---------------------------------------------------------------------------

const SOIL_YIELD = [1.25, 1, 0.85, 0.65]; // alluvium, loam, clay, thin
const FW = 9, FH = 6; // a field you lay out
const SOIL_WORD = ['rich river soil', 'good loam', 'heavy clay', 'thin, stony ground'];
function soilAt(tx, ty) { return World.land ? World.land.soil[clamp(ty, 0, MAP_H - 1) * MAP_W + clamp(tx, 0, MAP_W - 1)] : 1; }
function soilYield(tx, ty) { return SOIL_YIELD[soilAt(tx, ty)] ?? 1; }
{
  const gp = growPlot;
  growPlot = function (p, dtMin, rate) { return gp(p, dtMin, p.tx != null ? rate * soilYield(p.tx, p.ty) : rate); };
}

// --- The tools -------------------------------------------------------------------
BUILD_TOOLS.splice(BUILD_TOOLS.findIndex((t) => t.id === 'home'), 0,
  { id: 'field', label: 'Field', icon: 'grain', kind: 'site', hint: 'Click to have the farmers clear and plough a new barley field (9×6). Better soil, better barley.' },
  { id: 'orchard', label: 'Orchard', icon: 'apple', kind: 'box', unit: 25, cost: { wood: 1 }, hint: 'Drag a box to plant apple trees in rows (1 timber). The orchard-keeper picks them once they bear.' },
  { id: 'woodlot', label: 'Woodlot', icon: 'axe', kind: 'box', unit: 15, hint: 'Drag a box to plant a woodlot: saplings that grow into timber the woodwrights can fell, again and again.' },
  { id: 'hive', label: 'Hive', icon: 'honey', kind: 'point', unit: 30, cost: { wood: 1 }, hint: 'Click to set out a beehive (1 timber). Honey for the bakers, best near flowers.' },
);
for (const t of BUILD_TOOLS) BTOOL[t.id] = t;
const onGrid = (tool, x, y) => (tool === 'orchard' ? x % 3 === 0 && y % 3 === 1 : x % 2 === 0 && y % 2 === 0);
{
  const tw = tileWhy;
  tileWhy = function (tool, tx, ty) {
    if (tool === 'orchard' || tool === 'woodlot' || tool === 'hive') { const w = tw('tree', tx, ty); return w; }
    return tw(tool, tx, ty);
  };
  const st = strokeTiles;
  strokeTiles = function (tool, a, b) {
    if (tool === 'orchard' || tool === 'woodlot') return st('clear', a, b).filter(([x, y]) => onGrid(tool, x, y));
    return st(tool, a, b);
  };
  const apt = applyPlanTile;
  applyPlanTile = function (p, i, quiet) {
    if (p.tool !== 'orchard' && p.tool !== 'woodlot') return apt(p, i, quiet);
    const [x, y] = p.tiles[i];
    if (World.block[tIdx(x, y)]) return null;
    if (p.tool === 'orchard') {
      const seed = 900 + ((x + y) % 3);
      World._addStatic(makeTree(seed, 'apple'), x * 16 + 8, (y + 1) * 16 - 2, { gen: { type: 'tree', seed, kind: 'apple' } });
      World.orchard.push({ tx: x, ty: y, x: x * 16 + 8, y: (y + 1) * 16 + 12, apples: 0, claimed: null, planted: Game.day });
    } else {
      const seed = 300 + ((x * 7 + y) % 9), kind = (x + y) % 3 ? 'birch' : 'oak';
      World._addStatic(makeTree(seed, 'sapling'), x * 16 + 8, (y + 1) * 16 - 2, { gen: { type: 'tree', seed, kind: 'sapling' } });
      const nx = walkable(x, y + 1) ? [x, y + 1] : walkable(x + 1, y) ? [x + 1, y] : [x, y + 1];
      World.woodSpots.push({ tx: nx[0], ty: nx[1], x: nx[0] * 16 + 8, y: nx[1] * 16 + 12, stock: 0, claimed: null, facing: 'up', woodlot: true });
    }
    World._blk(x, y);
    return null;
  };
  const apw = applyPlanWhole;
  applyPlanWhole = function (p, quiet) {
    if (p.tool !== 'hive') return apw(p, quiet);
    const [x, y] = p.tiles[0];
    World._addStatic(makeHive ? makeHive() : makeBench(), x * 16 + 8, y * 16 + 14, {});
    World.hives.push({ x: x * 16 + 8, y: (y + 1) * 16 + 12, honey: 0, claimed: null });
    World._blk(x, y);
    return 'beehive';
  };
  // a field you choose
  const sf = siteFor;
  siteFor = function (tool, tx, ty) {
    if (tool !== 'field') return sf(tool, tx, ty);
    const x0 = tx - 4, y0 = ty - 3, x1 = x0 + FW - 1, y1 = y0 + FH - 1;
    // scrub, stones and trees are cleared as it's ploughed; a knoll only surveyed for a
    // hobbit-hole can be given over to it; buildings, water, paths and dug plots can't
    if (x0 < 3 || x1 > 118 || y0 < 4 || y1 > 91) return { why: 'Too near the edge of the valley' };
    const knolls = new Set();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = tIdx(x, y), t = World.tiles[i];
      if (t !== T.GRASS && t !== T.LAWN) return { why: 'Needs open grass: no paths, water or gardens' };
      if (underBuilding(x, y)) return { why: 'Too close to a building' };
      if (World.block[i] && !staticsOnTile(x, y).every(clearable)) return { why: 'Something there can\'t be cleared' };
      if (World.reserved[i] && !World.block[i]) {
        const k = World.lots.find((l) => l.kind === 'home' && l.state === 'planned' && Math.abs(x - l.cx) <= 4 && Math.abs(y - l.cy) <= 3);
        if (!k) return { why: 'That ground is spoken for' };
        knolls.add(k);
      }
    }
    const mx = Math.floor((x0 + x1) / 2), my = Math.floor((y0 + y1) / 2);
    const spur = findSpur([[mx, y1 + 1], [mx, y0 - 1], [x0 - 1, my], [x1 + 1, my]], [x0, y0, x1, y1], 26);
    if (!spur) return { why: 'No way to reach it from a path' };
    const sh = { core: [x0, y0, x1, y1] };
    let q = 0, n = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { q += soilYield(x, y); n++; }
    return { sh, spur, rect: sh.core, x0, y0, soil: q / n, knolls: [...knolls] };
  };
  const ps = placeSite;
  placeSite = function (tool, tx, ty, quiet = false) {
    if (tool !== 'field') return ps(tool, tx, ty, quiet);
    const s = siteFor(tool, tx, ty);
    if (!s || s.why) return s ? s.why : 'Not here';
    const n = World.lots.filter((l) => l.player && l.kind === 'field').length + 1;
    const name = `the ${['Long', 'Lower', 'Bramble', 'Sunny', 'Brook', 'Old Oak'][n % 6]} Field`;
    for (const k of s.knolls) { k.state = 'void'; (Game.voidLots || (Game.voidLots = [])).push(k.i); }
    const lot = { i: World.lots.length, kind: 'field', key: 'field_you' + n, def: { key: 'field_you' + n, kind: 'field', name, desc: 'A field you laid out' }, x0: s.x0, y0: s.y0, x1: s.x0 + FW - 1, y1: s.y0 + FH - 1, spur: s.spur, state: 'planned', player: true };
    World.lots.push(lot); reserveRect(...s.sh.core); reserveTiles(s.spur);
    clearFieldGround(lot, quiet);
    if (!quiet) {
      (Game.playerLots || (Game.playerLots = [])).push({ kind: 'field', x0: s.x0, y0: s.y0, spur: s.spur });
      startProject(lot);
      chronicle(`The farmers are fencing and ploughing ${name} where you showed them: ${SOIL_WORD[soilAt(tx, ty)]}, ${s.soil >= 1.1 ? 'and they\'re pleased with it' : s.soil < 0.85 ? 'and they\'re doubtful' : 'fair enough'}.`, 'build');
    }
    return lot;
  };
  // fields you laid out come back when the valley is rebuilt
  const rb = replayBuilds;
  replayBuilds = function () {
    const fields = (Game.playerLots || []).filter((l) => l.kind === 'field');
    Game.playerLots = (Game.playerLots || []).filter((l) => l.kind !== 'field');
    rb();
    for (const l of fields) { const lot = { i: World.lots.length, kind: 'field', key: 'field_you' + World.lots.length, def: { key: 'field_you' + World.lots.length, kind: 'field', name: 'the new field', desc: '' }, x0: l.x0, y0: l.y0, x1: l.x0 + FW - 1, y1: l.y0 + FH - 1, spur: l.spur, state: 'planned', player: true }; World.lots.push(lot); clearFieldGround(lot, true); }
    for (const i of Game.voidLots || []) if (World.lots[i]) World.lots[i].state = 'void';
    Game.playerLots = (Game.playerLots || []).concat(fields);
  };
}
function clearFieldGround(lot, quiet) {
  let felled = 0;
  for (let y = lot.y0; y <= lot.y1; y++) for (let x = lot.x0; x <= lot.x1; x++) {
    for (const st of staticsOnTile(x, y).filter(clearable)) { World.statics.splice(World.statics.indexOf(st), 1); if (st.gen && st.gen.type === 'tree') felled++; }
    World.block[tIdx(x, y)] = 0;
  }
  World.grass = World.grass.filter((g) => !(g.x >= lot.x0 * 16 && g.x < (lot.x1 + 1) * 16 && g.y >= lot.y0 * 16 && g.y < (lot.y1 + 1) * 16));
  World.flowers = World.flowers.filter((f) => !(f.x >= lot.x0 * 16 && f.x < (lot.x1 + 1) * 16 && f.y >= lot.y0 * 16 && f.y < (lot.y1 + 1) * 16));
  if (!quiet && felled) Village.produce('wood', felled * 2);
}
// woodlot saplings take a while to grow into timber
{
  const uw = updateWorld;
  updateWorld = function (dtMin, raining, season, hour) {
    for (const s of World.woodSpots) if (s.woodlot && s.stock === 0) { s.grow = (s.grow || 0) + dtMin; if (s.grow > 1440 * 2) { s.stock = 2; s.grow = 0; } }
    return uw(dtMin, raining, season, hour);
  };
}
function makeHive() {
  const rows = ['...kkkk...', '..kyYYyk..', '.kyyyyyyk.', '.kYYYYYYk.', '.kyyyyyyk.', '.kyyKKyyk.', '.kYYKKYYk.', '..kkkkkk..', '...k..k...'];
  return finishSprite(rows, { k: '#5a3a22', y: '#e8b84a', Y: '#c8942a', K: '#2a1c12' });
}

// --- The soil, shown in the build ghost -------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // knolls given over to fields are never opened
  const st = saveTown;
  saveTown = function () { const r = st(); r.opened = r.opened.filter(([i, s]) => s !== 'void'); return r; };
  const dbo = drawBuildOverlay;
  drawBuildOverlay = function () {
    dbo();
    if (!Build.on || !Build.hover || !['field', 'orchard', 'woodlot', 'tree', 'flowers'].includes(Build.tool)) return;
    const [hx, hy] = Build.hover;
    const z = Game.zoom, cx = Math.round(Game.cam.x * RS) / RS, cy = Math.round(Game.cam.y * RS) / RS;
    let t;
    if (Build.tool === 'field') { const s = siteFor('field', hx, hy); if (!s || s.why) return; t = `Soil here: ${Math.round(s.soil * 100)}% barley yield`; }
    else t = `Soil: ${SOIL_WORD[soilAt(hx, hy)]}`;
    const [gx, gy] = groundScreen(hx * 16 + 16, hy * 16, cx, cy, z), sx = gx + 12, sy = gy + 42;
    octx.font = '600 12px "Pixelify Sans", monospace';
    const tw = octx.measureText(t).width;
    octx.fillStyle = 'rgba(42,28,18,0.85)'; octx.fillRect(sx - 6, sy - 9, tw + 12, 18);
    octx.fillStyle = '#d8f0b0'; octx.fillText(t, sx, sy);
  };
});

// --- The minimap ---------------------------------------------------------------------------
const MINI_S = 1.5;
function drawMinimap() {
  const cv = $('minimap');
  if (!cv || cv.hidden || !World.tiles) return;
  const W = MAP_W, H = MAP_H, ctx = cv.getContext('2d');
  if (!World._mini || World._miniAt !== World.paintStamp || performance.now() - (World._miniT || 0) > 8000) {
    World._miniT = performance.now();
    const [c, g] = makeCanvas(W, H);
    const img = g.createImageData(W, H);
    const col = { [T.WATER]: [63, 127, 191], [T.BRIDGE]: [138, 100, 64], [T.PATH]: [200, 164, 106], [T.COBBLE]: [168, 164, 154], [T.FIELD]: [176, 150, 80], [T.SOIL]: [138, 94, 58], [T.WEED]: [106, 138, 58], [T.LAWN]: [140, 198, 90], [T.HILL]: [122, 176, 76] };
    for (let i = 0; i < W * H; i++) {
      const t = World.tiles[i];
      let rgb = col[t];
      if (!rgb) { const h = World.land ? World.land.h[i] : 0.4; const k = 0.75 + h * 0.4; rgb = [78 * k, 138 * k, 52 * k]; }
      img.data.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
    }
    g.putImageData(img, 0, 0);
    for (const s of World.statics) if (s.gen && s.gen.type === 'tree' && !s.hidden) { g.fillStyle = '#2e5a24'; g.fillRect(Math.floor(s.x / 16), Math.floor(s.y / 16) - 1, 1, 1); }
    for (const b of Object.values(World.buildings)) { g.fillStyle = '#7a4a2e'; g.fillRect(b.x0, b.y1 - 1, b.x1 - b.x0 + 1, 2); }
    for (const hm of World.homes) if (hm.built) { g.fillStyle = hm.doorColor; g.fillRect(Math.floor(hm.doorX / 16), Math.floor(hm.doorY / 16) - 1, 1, 1); }
    World._mini = c; World._miniAt = World.paintStamp;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(World._mini, 0, 0, W * MINI_S, H * MINI_S);
  // folk, plans, the camera
  ctx.fillStyle = '#fff6dc';
  for (const v of Game.villagers) if (!v.inside) ctx.fillRect(v.x / 16 * MINI_S - 0.5, v.y / 16 * MINI_S - 0.5, 1.5, 1.5);
  ctx.fillStyle = 'rgba(255,230,128,0.8)';
  for (const p of Game.plans || []) for (const [x, y] of p.tiles) ctx.fillRect(x * MINI_S, y * MINI_S, MINI_S, MINI_S);
  const z = hazard && hazard();
  if (z && z.state === 'on' && World.flooded) { ctx.fillStyle = 'rgba(70,120,200,0.55)'; for (const i of World.flooded) ctx.fillRect((i % W) * MINI_S, ((i / W) | 0) * MINI_S, MINI_S, MINI_S); }
  for (const r of requestsList()) { ctx.fillStyle = '#c83a2a'; ctx.fillRect(r.tx * MINI_S - 1.5, r.ty * MINI_S - 1.5, 3, 3); }
  ctx.strokeStyle = '#2a1c12'; ctx.lineWidth = 1.5;
  ctx.strokeRect(Game.cam.x / 16 * MINI_S, Game.cam.y / 16 * MINI_S, Game.cam.w / 16 * MINI_S, Game.cam.h / 16 * MINI_S);
}
window.addEventListener('DOMContentLoaded', () => {
  const cv = $('minimap');
  cv.width = MAP_W * MINI_S; cv.height = MAP_H * MINI_S;
  const jump = (e) => { const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * MAP_W * 16, y = (e.clientY - r.top) / r.height * MAP_H * 16; Game.follow = false; centerOn(x, y); };
  let drag = false;
  cv.addEventListener('pointerdown', (e) => { drag = true; cv.setPointerCapture(e.pointerId); jump(e); e.stopPropagation(); });
  cv.addEventListener('pointermove', (e) => { if (drag) jump(e); });
  cv.addEventListener('pointerup', () => { drag = false; });
  setInterval(drawMinimap, 250);
  // repaints of the ground refresh the minimap's picture
  const rr = refreshGround;
  refreshGround = function (rects) { World.paintStamp = (World.paintStamp || 0) + 1; return rr(rects); };
});
