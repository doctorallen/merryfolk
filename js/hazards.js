'use strict';
// ---------------------------------------------------------------------------
// The weather's moods: seasonal hazards to plan for (Banished's harsh winters,
// Timberborn's droughts, SimCity's disasters, but nobody is ever hurt).
//
// Most seasons bring one trial, always with a day's warning in the Chronicle
// and a ⚠ pill in the top bar (click it to see where):
//  * Spring flood: the river bursts onto its low meadows. Crops on flooded
//    ground are lost, and holes by the water get damp. Raised ground holds the
//    water back: banks you raise along the river with the Raise tool are
//    levees, and the water won't cross them.
//  * Summer drought: a dry spell. Crops grow at a third of the pace, except
//    those within reach of water: the river, a pond, or a well. Ponds and
//    wells near the fields are the answer.
//  * Autumn blight: a field of barley sickens and stops growing. The herbalist
//    can treat it with herbs, or you can buy dwarf sulphur from the chest
//    (15 pennies) to clear it at once.
//  * Winter hard frost: bitter nights. Every hearth burns twice the timber,
//    and folk caught out of doors feel it. Stock the woodpile before it comes.
// ---------------------------------------------------------------------------

const HAZARDS = {
  flood: { season: 'spring', word: 'Flood', warn: 'The river is high and brown and still rising. The low meadows may well flood tomorrow: anything growing on them is at risk. Raised banks along the river would hold it back.', start: 'The river has burst its banks onto the low meadows!', end: 'The flood has gone down, leaving the meadows muddy but rich.', days: 1 },
  drought: { season: 'summer', word: 'Drought', warn: 'Not a cloud in the sky, and the wells are low. A dry spell is coming: crops away from water will struggle. Ponds and wells near the fields would help.', start: 'The dry spell has come: the ground is cracking and the crops are thirsty.', end: 'Rain at last! The dry spell is broken.', days: 2 },
  blight: { season: 'autumn', word: 'Blight', warn: 'The farmers don\'t like the look of the barley: there\'s a blight going about. The herbalist should keep herbs ready.', start: 'Blight has got into {field}! The barley there has stopped growing. The herbalist can treat it with herbs, or you can buy dwarf sulphur (15 pennies) on the Steward\'s Desk.', end: 'The blight is gone from the fields.', days: 3 },
  frost: { season: 'winter', word: 'Hard frost', warn: 'The sky is clear and the air bites: a hard frost is coming. Every hearth will burn twice the timber. Is the woodpile stocked?', start: 'A hard frost has gripped Thistledown. Hearths roar and the woodpile shrinks.', end: 'The hard frost has eased.', days: 2 },
};
MOODLETS.damp = ['The flood got into the hole', -0.08, 1440, ['Everything smells of river.']];
MOODLETS.parched = ['Parched and dusty', -0.04, 720, ['When will it rain?']];
MOODLETS.weathered = ['Weathered the storm', 0.08, 1440, ['We came through it, didn\'t we?']];
function hazard() { return Game.hazard || null; }
function hazardActive() { const z = hazard(); return z && z.state === 'on' ? z : null; }

// --- Planning the season's trial -------------------------------------------------
function planHazard() {
  if (Game.hazard || Game.day < 4) return;
  const k = Object.keys(HAZARDS).find((x) => HAZARDS[x].season === World.season);
  if (!k || Game.hazardSeasonDone === seasonIdx(Game.day) + yearOf(Game.day) * 4 || !R.chance(0.65)) { Game.hazardSeasonDone = seasonIdx(Game.day) + yearOf(Game.day) * 4; return; }
  Game.hazardSeasonDone = seasonIdx(Game.day) + yearOf(Game.day) * 4;
  const startDay = Game.day + 1;
  Game.hazard = { k, state: 'warned', start: startDay, end: startDay + HAZARDS[k].days };
  if (k === 'blight') { const fs = World.fields.filter((f) => f.plots.some((p) => p.stage >= 1 && p.stage < 4)); if (!fs.length) { Game.hazard = null; return; } Game.hazard.field = World.fields.indexOf(R.pick(fs)); }
  chronicle(`⚠ ${HAZARDS[k].warn}`, 'sick');
}
function startHazard() {
  const z = hazard();
  z.state = 'on';
  const H = HAZARDS[z.k];
  if (z.k === 'flood') { const lost = floodNow(); chronicle(`${H.start} ${lost ? `${lost} plots of crops were lost under the water.` : 'Your banks held: not a single crop was lost!'}`, 'sick'); z.lost = lost; }
  else if (z.k === 'blight') { const f = World.fields[z.field]; f.blight = true; chronicle(H.start.replace('{field}', f.name || 'a barley field'), 'sick'); }
  else chronicle(H.start, 'sick');
  if (z.k === 'drought') { Game.weather = 'clear'; Game.raining = false; Game.rainUntil = 0; computeWatered(); }
}
function endHazard() {
  const z = hazard();
  const H = HAZARDS[z.k];
  if (z.k === 'blight') { const f = World.fields[z.field]; if (f) f.blight = false; }
  if (z.k === 'flood') { World.flooded = null; refreshFloodGround(); }
  chronicle(H.end, 'season');
  if (!(z.k === 'flood' && z.lost > 0)) for (const v of Game.villagers) if (v.isGrown() && R.chance(0.5)) feel(v, 'weathered');
  Game.hazard = null;
}

// --- The flood: low ground by the river, unless raised ground holds it back ------------------
function floodTiles() {
  const out = [], nh = World._nh || (World._nh = makeNoise(World.seed + 9));
  for (let y = 1; y < MAP_H - 1; y++) for (let x = 1; x < MAP_W - 1; x++) {
    const ry = RIVER_Y(x + 0.5);
    if (Math.abs(y + 0.5 - ry) > 3.6 + hash2(x, 7) * 1.4) continue;
    const t = World.tiles[tIdx(x, y)];
    if (t === T.WATER || t === T.BRIDGE || t === T.HILL || t === T.COBBLE) continue;
    const lv = Math.floor(groundHeight(nh, x + 0.5, y + 0.5) * TERRACES);
    if (lv >= 1) continue; // raised ground stays dry
    // the water only reaches what it can get to without crossing higher ground
    let ok = true;
    const dir = y + 0.5 < ry ? 1 : -1;
    for (let yy = y + dir; Math.abs(yy + 0.5 - ry) > 1.6 && ok; yy += dir) if (Math.floor(groundHeight(nh, x + 0.5, yy + 0.5) * TERRACES) >= 1) ok = false;
    if (ok) out.push(y * MAP_W + x);
  }
  return out;
}
function floodNow() {
  const tiles = new Set(floodTiles());
  World.flooded = tiles;
  let lost = 0;
  const hit = (p) => tiles.has(p.ty * MAP_W + p.tx);
  for (const f of World.fields) for (const p of f.plots) if (hit(p) && p.stage >= 1) { p.stage = 1; p.prog = 0; lost++; }
  for (const a of World.allotments) for (const p of a.plots) if (hit(p) && p.stage >= 1) { p.stage = 1; p.prog = 0; lost++; }
  for (const h of World.homes) {
    if (!h.built) continue;
    for (const p of h.plots) if (hit(p) && p.stage >= 1) { p.stage = 1; p.prog = 0; lost++; }
    if (tiles.has(Math.floor((h.stepY + 8) / 16) * MAP_W + Math.floor(h.stepX / 16))) for (const v of residentsOf(h)) feel(v, 'damp');
  }
  return lost;
}
function refreshFloodGround() { /* the flood is drawn as an overlay; nothing to repaint */ }
// after loading mid-hazard
function restoreHazard() {
  const z = hazard();
  if (!z || z.state !== 'on') return;
  if (z.k === 'flood') World.flooded = new Set(floodTiles());
  if (z.k === 'drought') computeWatered();
  if (z.k === 'blight' && World.fields[z.field]) World.fields[z.field].blight = true;
}

// --- Drought: what's near water keeps growing ------------------------------------------------
function computeWatered() {
  const near = new Uint8Array(MAP_W * MAP_H);
  const src = [];
  for (let i = 0; i < MAP_W * MAP_H; i++) if (World.tiles[i] === T.WATER) src.push([i % MAP_W, (i / MAP_W) | 0]);
  for (const w of World.wells || []) src.push([Math.floor(w.x / 16), Math.floor(w.y / 16)]);
  if (World.wellSpot) src.push([Math.floor(World.wellSpot.x / 16), Math.floor(World.wellSpot.y / 16)]);
  for (const [sx, sy] of src) for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const x = sx + i, y = sy + j; if (inMap(x, y) && i * i + j * j <= 36) near[y * MAP_W + x] = 1; }
  World.watered = near;
}
{
  const gp = growPlot;
  growPlot = function (p, dtMin, rate) {
    const z = hazardActive();
    if (z) {
      if (z.k === 'drought' && World.watered && !World.watered[p.ty * MAP_W + p.tx]) rate *= 0.33;
      if (z.k === 'blight' && World.fields[z.field] && World.fields[z.field].plots.includes(p)) rate = 0;
      if (z.k === 'flood' && World.flooded && World.flooded.has(p.ty * MAP_W + p.tx)) rate = 0;
    }
    return gp(p, dtMin, rate);
  };
  // hard frost: double the timber
  const lh = lightHearths;
  lightHearths = function () { lh(); const z = hazardActive(); if (z && z.k === 'frost') lh(); };
}

// The herbalist treats blight; or you buy dwarf sulphur.
ACTIONS.treat_blight = {
  id: 'treat_blight', label: 'Treating the blighted barley', icon: 'herb', sat: { industry: -0.5 }, dur: 60, pose: 'work', outdoor: true, job: 'herbalist', jobs: ['herbalist', 'farmer'], skill: 'herbalism',
  avail: () => { const z = hazardActive(); return !!(z && z.k === 'blight' && (Village.stores.herbs || 0) >= 2); },
  extra: () => 1.2,
  target: () => { const z = hazardActive(); const f = World.fields[z.field]; const p = f && R.pick(f.plots); return p ? { x: p.x, y: p.y + 4, facing: 'up' } : null; },
  done: (v) => {
    const z = hazardActive(); if (!z || z.k !== 'blight') return;
    Village.use('herbs', 2);
    z.treated = (z.treated || 0) + 1;
    if (z.treated >= 2) { chronicle(`${v.first} has treated the blighted barley with a strong herbal wash. The field is recovering.`, 'learn'); endHazard(); }
  },
};
ACTION_NAMES.treat_blight = 'Treating blight';
function buySulphur() {
  const z = hazardActive();
  if (!z || z.k !== 'blight') return;
  if ((Game.coin || 0) < 15) { toast('Dwarf sulphur costs 15 pennies.', 'info'); return; }
  Game.coin -= 15;
  chronicle('A sack of dwarf sulphur was bought and dusted over the blighted barley. That\'ll see it off.', 'learn');
  endHazard();
}

// --- What the player sees ----------------------------------------------------------------------
function drawHazard() {
  const z = hazard();
  if (!z) return;
  const zm = Game.zoom, cx = Math.round(Game.cam.x * RS) / RS, cy = Math.round(Game.cam.y * RS) / RS;
  const W = overlay.width / dpr, H = overlay.height / dpr;
  octx.save();
  if (z.k === 'flood') {
    const tiles = z.state === 'on' ? World.flooded : (Build.on ? new Set(floodTiles()) : null);
    if (tiles) for (const i of tiles) {
      const x = i % MAP_W, y = (i / MAP_W) | 0, sx = (x * 16 - cx) * zm, sy = (y * 16 - cy) * zm;
      if (sx < -40 || sy < -40 || sx > W || sy > H) continue;
      octx.fillStyle = z.state === 'on' ? `rgba(70,120,170,${0.45 + Math.sin(tReal * 2 + x * 0.5) * 0.05})` : 'rgba(70,120,200,0.22)';
      octx.fillRect(sx, sy, 16 * zm + 0.5, 16 * zm + 0.5);
    }
  }
  if (z.k === 'blight' && z.state === 'on') {
    const f = World.fields[z.field];
    if (f) { octx.fillStyle = 'rgba(120,90,40,0.35)'; octx.fillRect((f.x0 * 16 - cx) * zm, (f.y0 * 16 - cy) * zm, (f.x1 - f.x0 + 1) * 16 * zm, (f.y1 - f.y0 + 1) * 16 * zm); }
  }
  if (z.k === 'drought' && z.state === 'on' && Build.on && World.watered) {
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (World.watered[y * MAP_W + x]) { const sx = (x * 16 - cx) * zm, sy = (y * 16 - cy) * zm; if (sx > -20 && sy > -20 && sx < W && sy < H) { octx.fillStyle = 'rgba(90,160,230,0.12)'; octx.fillRect(sx, sy, 16 * zm + 0.5, 16 * zm + 0.5); } }
  }
  octx.restore();
}
function hazardPill() {
  const el = $('hud-hazard');
  if (!el) return;
  const z = hazard();
  el.hidden = !z;
  if (!z) return;
  el.textContent = `⚠ ${HAZARDS[z.k].word}${z.state === 'warned' ? ' tomorrow' : ''}`;
  el.title = z.state === 'warned' ? HAZARDS[z.k].warn : 'Click to see where';
}

window.addEventListener('DOMContentLoaded', () => {
  addHook('onHour', (h) => {
    if (h === 9) planHazard();
    const z = hazard();
    if (z) {
      if (z.state === 'warned' && Game.day >= z.start && h >= 6) startHazard();
      else if (z.state === 'on' && Game.day >= z.end && h >= 6) endHazard();
      else if (z.state === 'on' && z.k === 'drought') { Game.weather = 'clear'; Game.raining = false; if (h === 14) for (const v of Game.villagers) if (!v.inside && v.isGrown() && R.chance(0.3)) feel(v, 'parched'); }
    }
  });
  const ro = renderOverlay;
  renderOverlay = function () { ro(); drawHazard(); };
  const hud = updateHUD;
  updateHUD = function () { hud(); hazardPill(); };
  $('hud-hazard').addEventListener('click', () => {
    const z = hazard(); if (!z) return;
    if (z.k === 'flood') { const t = floodTiles()[0]; if (t != null) centerOn((t % MAP_W) * 16, ((t / MAP_W) | 0) * 16); }
    else if (z.k === 'blight' && World.fields[z.field]) { const f = World.fields[z.field]; centerOn((f.x0 + f.x1) * 8, (f.y0 + f.y1) * 8); }
    toast(z.state === 'warned' ? HAZARDS[z.k].warn : HAZARDS[z.k].start, 'info');
  });
  // dwarf sulphur on the Steward's Desk while blight is about
  const sh = stewardHTML;
  stewardHTML = function () {
    const z = hazardActive();
    return (z && z.k === 'blight' ? `<div class="note">Blight is in the barley. The herbalist can treat it with herbs, or <button id="st-sulphur">buy dwarf sulphur (15p)</button>.</div>` : '') + sh();
  };
  const hook = hookStewardUI;
  hookStewardUI = function (body) { const b = body.querySelector('#st-sulphur'); if (b) b.addEventListener('click', () => { buySulphur(); renderVillage(); }); return hook(body); };
  addHook('newVillage', () => { Game.hazard = null; Game.hazardSeasonDone = -1; });
});
