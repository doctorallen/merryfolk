'use strict';
// ---------------------------------------------------------------------------
// Appeal and the notice board: why it's worth building (SimCity's land value,
// RimWorld's beauty, Animal Crossing's requests).
//
// Every tile has an appeal from what's around it: flowers, trees, hedges,
// benches, lamp-posts, statues, fountains, ponds and the river nearby, with
// bare dug earth and stony ground counting against it. Folk whose holes look
// out on lovely surroundings are happier; a drab outlook wears on them. In
// build mode the Appeal button paints it over the map, as SimCity paints land
// value.
//
// And folk ask for things. Every day or two someone pins a request to the
// notice board in the square: "A bench by the river would be lovely", "It's
// awfully dark on our lane at night", "Could we have some flowers by the
// well?". Each is tied to a spot (a pin on the map in build mode). Build the
// thing near enough and the one who asked is delighted, and the village
// earns renown and a few pennies besides.
// ---------------------------------------------------------------------------

const APPEAL_R = 5;
function computeAppeal() {
  const W = MAP_W, H = MAP_H, src = new Float32Array(W * H);
  const add = (tx, ty, v) => { if (inMap(tx, ty)) src[ty * W + tx] += v; };
  for (const f of World.flowers) add(Math.floor(f.x / 16), Math.floor(f.y / 16), 0.12);
  for (const s of World.statics) {
    if (s.hidden) continue;
    const tx = Math.floor(s.x / 16), ty = Math.floor((s.y - 2) / 16);
    if (s.decor === 'fountain') add(tx, ty, 5);
    else if (s.decor === 'statue') add(tx, ty, 3.5);
    else if (s.gen && s.gen.type === 'tree') add(tx, ty, s.gen.kind === 'big' ? 1.2 : 0.45);
    else if (s.gen && s.gen.type === 'hedge') add(tx, ty, 0.25);
    else if (s.gen && s.gen.type === 'bush') add(tx, ty, 0.25);
  }
  for (const b of World.benches) add(Math.floor(b.x / 16), Math.floor(b.y / 16), 0.9);
  for (const l of World.lamps) add(Math.floor(l.x / 16), Math.floor((l.y + 22) / 16), 0.7);
  for (let i = 0; i < W * H; i++) { const t = World.tiles[i]; if (t === T.WATER) src[i] += 0.12; else if (t === T.SOIL) src[i] -= 0.08; }
  // spread over a few tiles, fading
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = src[y * W + x];
    if (!v) continue;
    for (let j = -APPEAL_R; j <= APPEAL_R; j++) for (let i = -APPEAL_R; i <= APPEAL_R; i++) {
      const nx = x + i, ny = y + j; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const d = Math.hypot(i, j); if (d > APPEAL_R) continue;
      out[ny * W + nx] += v * (1 - d / (APPEAL_R + 1));
    }
  }
  World.appeal = out; World.appealAt = Game.time;
  return out;
}
function appealAt(tx, ty) {
  if (!World.appeal || Math.abs(Game.time - (World.appealAt || 0)) > 60) computeAppeal();
  return inMap(tx, ty) ? World.appeal[ty * MAP_W + tx] : 0;
}
function homeAppeal(h) { return h ? appealAt(Math.floor(h.stepX / 16), Math.floor(h.stepY / 16)) : 0; }
function appealWord(a) { return a >= 7 ? 'Delightful' : a >= 4 ? 'Lovely' : a >= 2 ? 'Pleasant' : a >= 0.5 ? 'Plain' : 'Drab'; }
{
  const sf = stateFeelings;
  stateFeelings = function (v) {
    const out = sf(v);
    if (v.stage === 'baby' || v.homeId < 0) return out;
    const a = homeAppeal(v.home());
    if (a >= 7) out.push(['Delightful surroundings at home', 0.07]);
    else if (a >= 4) out.push(['Lovely surroundings at home', 0.04]);
    else if (a < 0.5) out.push(['A drab outlook from home', -0.04]);
    return out;
  };
}

// --- Requests ------------------------------------------------------------------
const REQUESTS = {
  bench: { tools: ['bench'], lines: ['A bench by {p} would be lovely, to rest my legs.', 'Somewhere to sit near {p}, please!'], icon: 'chat' },
  lamp: { tools: ['lamp'], lines: ['It\'s awfully dark near {p} of a night.', 'Could we have a lamp by {p}? I trip on the cobbles.'], icon: 'sun' },
  flowers: { tools: ['flowers'], lines: ['Some flowers near {p} would cheer everyone up.', 'It\'s ever so bare round {p}.'], icon: 'heart' },
  tree: { tools: ['tree'], lines: ['A shady tree near {p} for the summer, please.', 'I miss the trees. Could we plant one by {p}?'], icon: 'leaf' },
  pond: { tools: ['pond'], lines: ['A duck pond near {p}! Wouldn\'t that be grand?'], icon: 'fish', era: 1 },
  path: { tools: ['path'], lines: ['My boots are always muddy near {p}. A path, perhaps?'], icon: 'pack' },
  statue: { tools: ['statue', 'fountain'], lines: ['Something grand for {p}: a statue, say, to make the village proud.'], icon: 'ring', era: 2 },
};
function placeName(tx, ty) {
  const h = World.homes.filter((x) => x.built).sort((a, b) => dist(a.stepX, a.stepY, tx * 16, ty * 16) - dist(b.stepX, b.stepY, tx * 16, ty * 16))[0];
  const b = Object.values(World.buildings).sort((a, c) => dist(a.stepX, a.stepY, tx * 16, ty * 16) - dist(c.stepX, c.stepY, tx * 16, ty * 16))[0];
  if (Math.abs(ty + 0.5 - RIVER_Y(tx + 0.5)) < 5) return 'the river';
  if (b && (!h || dist(b.stepX, b.stepY, tx * 16, ty * 16) < dist(h.stepX, h.stepY, tx * 16, ty * 16))) return b.name.replace(/^The /, 'the ');
  return h ? h.name : 'the lane';
}
function requestsList() { return Game.requests || (Game.requests = []); }
function postRequest() {
  if (requestsList().length >= 4) return;
  const who = R.pick(Game.villagers.filter((v) => v.isGrown() && v.homeId >= 0 && !v.leaving && !requestsList().some((r) => r.by === v.id)));
  if (!who) return;
  const kinds = Object.keys(REQUESTS).filter((k) => (REQUESTS[k].era || 0) <= era());
  // what's lacking round their home, or somewhere they go
  const home = who.home(), spots = [[Math.floor(home.stepX / 16), Math.floor(home.stepY / 16) + 1]];
  for (const b of Object.values(World.buildings)) if (dist(b.stepX, b.stepY, who.x, who.y) < 400) spots.push([Math.floor(b.stepX / 16), Math.floor(b.stepY / 16) + 1]);
  const [tx, ty] = R.pick(spots);
  const near = (fn) => World.statics.some((s) => !s.hidden && fn(s) && dist(s.x, s.y, tx * 16, ty * 16) < 90);
  const lacks = kinds.filter((k) => ({
    bench: () => !World.benches.some((b) => dist(b.x, b.y, tx * 16, ty * 16) < 90),
    lamp: () => !World.lamps.some((l) => dist(l.x, l.y + 22, tx * 16, ty * 16) < 100),
    flowers: () => World.flowers.filter((f) => dist(f.x, f.y, tx * 16, ty * 16) < 70).length < 4,
    tree: () => !near((s) => s.gen && s.gen.type === 'tree'),
    pond: () => R.chance(0.3),
    path: () => R.chance(0.25),
    statue: () => !near((s) => s.decor),
  }[k] || (() => false))());
  if (!lacks.length) return;
  const k = R.pick(lacks), Q = REQUESTS[k];
  const r = { id: (Game.reqSeq = (Game.reqSeq || 0) + 1), k, by: who.id, tx, ty, place: placeName(tx, ty), text: R.pick(Q.lines).replace('{p}', placeName(tx, ty)), day: Game.day, since: (Game.planDone || []).length };
  requestsList().push(r);
  if (!who.inside) who.say('I\'ve put a note up on the board in the square.', 3);
  chronicle(`${who.first} has pinned a note to the board in the square: "${r.text}"`, 'info');
}
function checkRequests() {
  const done = Game.planDone || [];
  for (const r of requestsList().slice()) {
    const Q = REQUESTS[r.k];
    const met = done.slice(r.since).some((d) => Q.tools.includes(d.tool) && d.tiles.some(([x, y]) => Math.hypot(x - r.tx, y - r.ty) <= 6));
    const by = Game.villagers.find((v) => v.id === r.by);
    if (!by) { Game.requests = requestsList().filter((x) => x !== r); continue; }
    if (met) {
      Game.requests = requestsList().filter((x) => x !== r);
      Game.renown = (Game.renown || 0) + 8; Game.coin = (Game.coin || 0) + 5;
      feel(by, 'wish', 'my note on the board was answered');
      by.remember(`My request for ${r.place} was granted. How kind!`, 2);
      chronicle(`${by.first}'s note on the board has been answered: ${r.k === 'statue' ? 'something grand' : 'a new ' + (r.k === 'flowers' ? 'bed of flowers' : r.k)} by ${r.place}. ${by.first} is delighted. (+8 renown, +5 pennies)`, 'love');
    } else if (Game.day - r.day > 5) Game.requests = requestsList().filter((x) => x !== r);
  }
}

// --- Drawing: the appeal map and the pins -------------------------------------
Build.showAppeal = false;
function drawAppealAndPins() {
  if (!Build.on) return;
  const z = Game.zoom, cam = Game.cam, cx = Math.round(cam.x * RS) / RS, cy = Math.round(cam.y * RS) / RS;
  const W = overlay.width / dpr, H = overlay.height / dpr;
  octx.save();
  if (Build.showAppeal) {
    const x0 = Math.max(0, Math.floor(cx / 16)), y0 = Math.max(0, Math.floor(cy / 16)), x1 = Math.min(MAP_W - 1, Math.ceil((cx + W / z) / 16)), y1 = Math.min(MAP_H - 1, Math.ceil((cy + H / z) / 16));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const a = appealAt(x, y);
      const t = clamp(a / 7, 0, 1);
      octx.fillStyle = a < 0.5 ? 'rgba(160,110,60,0.28)' : `rgba(${Math.round(255 - 140 * t)},${Math.round(210 + 30 * t)},${Math.round(90 + 60 * t)},${0.12 + t * 0.3})`;
      octx.fillRect((x * 16 - cx) * z, (y * 16 - cy) * z, 16 * z + 0.5, 16 * z + 0.5);
    }
  }
  // request pins
  for (const r of requestsList()) {
    const sx = (r.tx * 16 + 8 - cx) * z, sy = (r.ty * 16 - cy) * z;
    if (sx < -40 || sy < -40 || sx > W + 40 || sy > H + 40) continue;
    octx.fillStyle = '#c83a2a'; octx.beginPath(); octx.arc(sx, sy - 14, 9, 0, Math.PI * 2); octx.fill();
    octx.beginPath(); octx.moveTo(sx - 5, sy - 9); octx.lineTo(sx + 5, sy - 9); octx.lineTo(sx, sy); octx.fill();
    octx.fillStyle = '#fff6dc'; octx.font = '700 12px "Pixelify Sans", monospace'; octx.textAlign = 'center'; octx.fillText('!', sx, sy - 13); octx.textAlign = 'left';
    octx.strokeStyle = 'rgba(200,58,42,0.5)'; octx.setLineDash([4, 4]); octx.beginPath(); octx.arc(sx, sy - 6, 6 * 16 * z, 0, Math.PI * 2); octx.stroke(); octx.setLineDash([]);
  }
  octx.restore();
}

window.addEventListener('DOMContentLoaded', () => {
  const ro = renderOverlay;
  renderOverlay = function () { ro(); drawAppealAndPins(); };
  const oh = onHour;
  onHour = function (h) { const r = oh(h); if (h === 10 && R.chance(0.7)) postRequest(); checkRequests(); return r; };
  // a finished plan changes the view
  const cp = completePlan;
  completePlan = function (p, by, quiet) { const r = cp(p, by, quiet); World.appeal = null; if (!quiet) checkRequests(); return r; };
  const nv = newVillage;
  newVillage = function () { Game.requests = []; Game.reqSeq = 0; return nv(); };
  // requests in the build bar, and the appeal toggle
  const rb = renderBuildBar;
  renderBuildBar = function () {
    rb();
    const side = document.querySelector('#buildbar .bb-side');
    if (!side) return;
    const d = document.createElement('div');
    d.className = 'bb-reqs';
    d.innerHTML = `<button id="bb-appeal" class="${Build.showAppeal ? 'on' : ''}" title="Paint how lovely each spot is over the map">Appeal</button>${requestsList().length ? requestsList().map((r) => `<button class="bb-req" data-req="${r.id}" title="${escapeHtml(r.text)}">📌 ${escapeHtml(r.k === 'flowers' ? 'Flowers' : r.k.charAt(0).toUpperCase() + r.k.slice(1))} by ${escapeHtml(r.place)}</button>`).join('') : '<span class="sub">No requests on the board.</span>'}`;
    side.insertBefore(d, side.querySelector('.bb-row'));
    $('bb-appeal').addEventListener('click', () => { Build.showAppeal = !Build.showAppeal; renderBuildBar(); });
    d.querySelectorAll('[data-req]').forEach((b) => b.addEventListener('click', () => {
      const r = requestsList().find((x) => x.id === +b.dataset.req); if (!r) return;
      centerOn(r.tx * 16, r.ty * 16);
      const tool = REQUESTS[r.k].tools.find((t) => toolUnlocked(t)) || REQUESTS[r.k].tools[0];
      Build.tool = tool; toast(r.text, 'info'); renderBuildBar();
    }));
  };
  // the hover tooltip in build mode also says how lovely a spot is
  const dbo = drawBuildOverlay;
  drawBuildOverlay = function () {
    dbo();
    if (!Build.on || !Build.hover || !Build.showAppeal) return;
    const [hx, hy] = Build.hover, a = appealAt(hx, hy);
    const z = Game.zoom, cx = Math.round(Game.cam.x * RS) / RS, cy = Math.round(Game.cam.y * RS) / RS;
    const sx = (hx * 16 + 16 - cx) * z + 12, sy = (hy * 16 - cy) * z + 22;
    octx.font = '600 12px "Pixelify Sans", monospace';
    const t = `${appealWord(a)} (${a.toFixed(1)})`, tw = octx.measureText(t).width;
    octx.fillStyle = 'rgba(42,28,18,0.85)'; octx.fillRect(sx - 6, sy - 9, tw + 12, 18);
    octx.fillStyle = '#ffe680'; octx.fillText(t, sx, sy);
  };
});
