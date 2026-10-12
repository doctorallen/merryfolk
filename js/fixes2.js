'use strict';
// ---------------------------------------------------------------------------
// Fixes and rebalancing from the second strategy playtest.
// ---------------------------------------------------------------------------

// --- Never block a lamp's (or a bench's, a well's) service spot, and nobody stays stuck ---
function serviceSpotAt(tx, ty) {
  const at = (x, y) => Math.floor(x / 16) === tx && Math.floor((y - 2) / 16) === ty;
  return World.lamps.some((l) => at(l.footX, l.footY)) || World.benches.some((b) => at(b.x, b.y)) || (World.wells || []).some((w) => at(w.x, w.y)) || (World.wellSpot && at(World.wellSpot.x, World.wellSpot.y));
}
{
  const tw = tileWhy;
  tileWhy = function (tool, tx, ty) {
    const w = tw(tool, tx, ty);
    if (w) return w;
    if (['tree', 'bench', 'lamp', 'hedge', 'statue', 'fountain', 'hive', 'orchard', 'woodlot', 'pond'].includes(tool) && serviceSpotAt(tx, ty)) return 'Folk need to stand there';
    return '';
  };
  // a villager who hasn't got anywhere for two hours gives up and thinks again
  patch(Villager.prototype, 'update', (upd) => function (dt, h) {
    const t = this.task;
    if (t && t.phase === 'go' && !this.inside && !this.carried && !this.leaving) {
      const moved = this._stuckAt ? dist(this.x, this.y, this._stuckAt[0], this._stuckAt[1]) : 99;
      if (moved > 6) { this._stuckAt = [this.x, this.y]; this._stuckT = 0; }
      else if ((this._stuckT = (this._stuckT || 0) + dt) > 120) {
        devLog('decide', `${this.first} was stuck on the way to ${t.a.id} and gave up`);
        this.cool[t.a.id] = Game.time + 90;
        this.abort();
        const nw = nearestWalkable(Math.floor(this.x / 16), Math.floor((this.y - 2) / 16));
        if (nw) { this.x = nw[0] * 16 + 8; this.y = nw[1] * 16 + 12; }
        this._stuckT = 0;
      }
    } else this._stuckT = 0;
    return upd.call(this, dt, h);
  }, 'fixes2');
}

// --- The Buildings tool can site a public building (scrub is cleared as it goes up) ---
{
  const sf = siteFor;
  siteFor = function (tool, tx, ty) {
    if (tool !== 'civic') return sf(tool, tx, ty);
    const lot = Build.civicKey && World.lots.find((l) => l.key === Build.civicKey);
    if (!lot || lot.state !== 'planned') return { why: 'Pick a building from the list first' };
    const def = lot.def, x0 = tx - Math.floor(def.w / 2);
    const sh = lotShape('building', def, x0, ty);
    const own = lot.x0 != null ? lotShape('building', def, lot.x0, lot.y1).core : null;
    const inOwn = (x, y) => own && x >= own[0] && x <= own[2] && y >= own[1] && y <= own[3];
    const [a, b, c, d] = sh.core;
    if (a < 3 || c > 118 || b < 4 || d > 91) return { why: 'Too near the edge of the valley' };
    for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) {
      const i = tIdx(x, y), t = World.tiles[i];
      if (t !== T.GRASS && t !== T.LAWN) return { why: 'Needs open grass: no paths, water or gardens' };
      if (underBuilding(x, y)) return { why: 'Too close to a building' };
      if (World.block[i] && !staticsOnTile(x, y).every(clearable)) return { why: 'Something there can\'t be cleared' };
      if (World.reserved[i] && !World.block[i] && !inOwn(x, y)) return { why: 'That ground is spoken for' };
    }
    const spur = findSpur(sh.starts, sh.avoid);
    return spur ? { sh, spur, rect: sh.core, x0, y1: ty, lot } : { why: 'No way to reach it from a path' };
  };
  const ps = placeSite;
  placeSite = function (tool, tx, ty, quiet = false) {
    if (tool === 'civic') { const s = siteFor(tool, tx, ty); if (s && !s.why) { const [a, b, c, d] = s.sh.core; for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) { for (const st of staticsOnTile(x, y).filter(clearable)) World.statics.splice(World.statics.indexOf(st), 1); World.block[tIdx(x, y)] = 0; } } }
    return ps(tool, tx, ty, quiet);
  };
}

// --- One public work can go up alongside the homes ---------------------------------
function nextPublicWork() {
  const pop = Game.villagers.filter((v) => !v.leaving).length;
  for (const def of CIVIC_DEFS) { const lot = World.lots.find((l) => l.key === def.key); if (lot && lot.state === 'planned' && def.kind !== 'field') return { def, lot, due: pop >= def.pop }; }
  return null;
}
{
  const pt = planTown;
  planTown = function () {
    pt();
    const running = Village.projects.some((p) => (p.kind === 'building' || p.kind === 'well') && World.lots[p.lot] && !(World.lots[p.lot].def && World.lots[p.lot].def.rift));
    const n = nextPublicWork();
    if (!running && n && n.due) { startProject(n.lot); chronicle(`The woodwrights have begun ${n.def.kind === 'well' ? 'sinking' : 'raising'} ${n.def.name}. ${n.def.desc}.`, 'build'); }
  };
}

// --- Woodlots really take two days to grow --------------------------------------------
{
  const uw = updateWorld;
  updateWorld = function (dtMin, raining, season, hour) {
    for (const s of World.woodSpots) if (s.woodlot && !s.grown) { s.regrow = 0; s.stock = 0; s.grow = (s.grow || 0) + dtMin; if (s.grow > 1440 * 2) { s.grown = true; s.stock = 2; } }
    return uw(dtMin, raining, season, hour);
  };
}

// --- Better soil and crop rotation give a bigger harvest, not just a faster one ---------
{
  const fd = ACTIONS.work_farm.done;
  ACTIONS.work_farm.done = function (v, task) {
    const p = task.target.plot;
    Game._harvestMul = p ? soilYield(p.tx, p.ty) * (hasLore('rotation') ? 1.15 : 1) * (hasTrad('farming') ? 1.1 : 1) : 1;
    try { return fd(v, task); } finally { Game._harvestMul = 1; }
  };
  const qd = queueDelivery;
  queueDelivery = function (v, res, n, ...rest) { return qd(v, res, res === 'grain' && Game._harvestMul ? Math.round(n * Game._harvestMul) : n, ...rest); };
}

// --- Day labourers bring in the harvest; a drought withers ripe crops away from water ---
{
  const lab = ORDERS.find((o) => o.id === 'labour');
  if (lab) {
    lab.desc = 'Hands from over the hills bring in every ripe crop at once, and hoe the rest along.';
    lab.fn = () => {
      let grain = 0, veg = 0;
      for (const f of World.fields) for (const p of f.plots) { if (p.stage === 4) { grain += Math.round(4 * soilYield(p.tx, p.ty)); p.stage = 1; p.prog = 0; } else if (p.stage >= 1) p.prog = Math.min(0.99, p.prog + 0.5); }
      for (const a of World.allotments) for (const p of a.plots) if (p.stage === 4) { veg += 2; p.stage = 1; p.prog = 0; }
      if (grain) Village.produce('grain', grain); if (veg) Village.produce('veg', veg);
      chronicle(`Day labourers from over the hills brought in ${grain} barley${veg ? ` and ${veg} vegetables` : ''}, and hoed the rest along.`, 'work');
    };
  }
}
window.addEventListener('DOMContentLoaded', () => {
  addHook('onHour', (h) => {
    const z = hazardActive();
    if (z && z.k === 'drought' && h === 15 && World.watered) {
      let lost = 0;
      for (const f of World.fields) for (const p of f.plots) if (p.stage >= 3 && !World.watered[p.ty * MAP_W + p.tx] && R.chance(0.25)) { p.stage = 2; lost++; }
      if (lost) chronicle(`The drought is withering the barley: ${lost} ripening plots away from water have dried back. Ponds or wells near the fields would save them.`, 'sick');
    }
    // lore: study the next thing rather than nothing
    const Lr = lore();
    if (!Lr.study) { const k = Object.keys(LORE).filter(loreOpen).sort((a, b) => LORE[a].cost - LORE[b].cost)[0]; if (k) { Lr.study = k; Lr.prog = (Lr.saved && Lr.saved[k]) || 0; if (Lr.known.length) chronicle(`The village's readers have turned to ${LORE[k].name.toLowerCase()} next (change it on the Lore page).`, 'learn'); } }
  });
  // the workforce: + and − change the plan by one; say so when nobody can be spared
  const hook = hookStewardUI;
  hookStewardUI = function (body) {
    const res = hook(body);
    body.querySelectorAll('[data-job]').forEach((b) => {
      if (b.dataset.d === 'auto') return;
      const n = b.cloneNode(true); b.replaceWith(n);
      n.addEventListener('click', () => {
        const j = n.dataset.job, P = jobPlan();
        const base = typeof P[j] === 'number' ? P[j] : (jobCounts()[j] || 0);
        P[j] = Math.max(0, base + +n.dataset.d);
        trimTrades();
        const have = jobCounts()[j] || 0;
        if (+n.dataset.d > 0 && have < P[j]) toast(`Nobody else can be spared for the ${JOBS[j].label.toLowerCase()}'s work just now: every other trade is down to its last hands.`, 'info');
        renderVillage();
      });
    });
    return res;
  };
  // one food figure everywhere (Store, larders and jars), and builders explained
  const bn = bottlenecks;
  bottlenecks = function () {
    const out = bn().filter((b) => !/Less than a day's food/.test(b.say));
    const store = Village.foodTotal(), all = store + World.homes.reduce((n, hm) => n + (hm.built ? pantryTotal(hm) + (typeof jarsTotal === 'function' ? jarsTotal(hm) : 0) : 0), 0);
    const eat = Game.villagers.length * 2.2;
    if (all < eat) out.unshift({ say: `Less than a day's food in the village (${all} helpings, ${store} of them in the Store, for ${Game.villagers.length} folk): more farmers and fishers, lean rations, or buy food from a caravan` });
    const wrights = jobCounts().woodwright || 0;
    if (Village.projects.length && wrights < 2) out.push({ say: `Building works need woodwrights, and there ${wrights === 1 ? 'is only one' : 'are none'}: put more hands on the Woodwright trade` });
    const n = nextPublicWork();
    if (n && !n.due) out.push({ say: `Next public work: ${n.def.name.replace(/^the /, 'the ')}, once the village has ${n.def.pop} folk` });
    const ripe = World.fields.reduce((s, f) => s + f.plots.filter((p) => p.stage === 4).length, 0);
    if (ripe > 30 && (Village.stores.grain || 0) < 60) out.push({ say: `${ripe} plots of barley stand ripe and unharvested: more farmers, or hire day labourers` });
    return out;
  };
  // small text fixes
  const se = stewardHTML;
  stewardHTML = function () { return se().replace(/>1 days</g, '>a day<'); };
  const cr = contentmentReasons;
  contentmentReasons = function () {
    const r = cr();
    const tidy = (k) => k.replace(/( (a|an|the|my|new|of|with|from|by|at|to|for|our))+!?$/, '').replace(/ !$/, '!').replace(/\s+!$/, '!');
    r.up = r.up.map(([k, n]) => [tidy(k), n]); r.down = r.down.map(([k, n]) => [tidy(k), n]);
    return r;
  };
});
// cheaper charters pay less: flowers, trees and paths are easy
{
  const nc = newCharter;
  newCharter = function (skip) { const c = nc(skip); if (c && ['flowers', 'trees', 'paths'].includes(c.k)) { c.reward.coin = Math.round(c.reward.coin * 0.6); c.reward.renown = Math.round(c.reward.renown * 0.6); } return c; };
}
MOODLETS.new_pet[0] = 'A new pet: a {x}';
