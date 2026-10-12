'use strict';
// ---------------------------------------------------------------------------
// Lore: what the village learns, and what you choose it learns (Age of
// Empires' technologies, Civilization's tree, made bookish). Every hour of
// reading by the fire, every letter written, every lesson at the story
// circle adds a little lore. You pick what the village studies next on the
// Lore page of the Charter: crop rotation, smoking and salting, mill gears,
// cold frames, wells and pumps, master masons, a weather almanack... Each
// discovery changes how the village works for good.
// ---------------------------------------------------------------------------

const LORE = {
  rotation: { name: 'Crop rotation', tier: 1, cost: 29, desc: 'Fields and gardens rested in turn: every crop grows 15% faster.' },
  smoking: { name: 'Smoking and salting', tier: 1, cost: 29, desc: 'Food in the Store spoils 40% more slowly.' },
  herbs: { name: 'Herb lore', tier: 1, cost: 25, desc: 'Herbalists get twice as many remedies from their herbs.' },
  bees: { name: 'Bee-keeping', tier: 1, cost: 22, desc: 'Hives give half as much honey again.' },
  hedges: { name: 'Hedge-laying', tier: 1, cost: 22, desc: 'Hedgerows laid the old way are twice as lovely.' },
  drystone: { name: 'Dry-stone walling', tier: 1, cost: 32, desc: 'Raising and lowering the land goes twice as fast, and floods take only half the crops.' },
  gears: { name: 'Mill gears', tier: 2, cost: 50, desc: 'The mills grind a quarter more flour, and the Store holds half as much flour again.' },
  brewing: { name: 'Brewing lore', tier: 2, cost: 50, desc: 'A quarter more ale from every brew.' },
  frames: { name: 'Cold frames', tier: 2, cost: 58, desc: 'Gardens and allotments keep growing through winter, slowly.' },
  wells: { name: 'Wells and pumps', tier: 2, cost: 47, desc: 'In a drought, crops are watered from twice as far from a well or pond.' },
  masons: { name: 'Master masons', tier: 2, cost: 65, desc: 'All building works go 30% faster.' },
  almanack: { name: 'The Weather Almanack', tier: 3, cost: 86, desc: 'Hazards are foreseen two days ahead instead of one, and droughts and blights are gentler.' },
  library: { name: 'The Lending Library', tier: 3, cost: 86, desc: 'Every hour of reading is worth half as much lore again; little ones learn faster.' },
  rifteng: { name: 'Rift-and-hill engineering', tier: 3, cost: 101, desc: 'Hill and rift know-how together: the Hearthlink needs only one of the Dynamo or the Turbine, and the rift-folk\'s machines gather power faster.', rift: true },
};
function lore() { return Game.lore || (Game.lore = { pts: 0, known: [], study: null, prog: 0, made: 0 }); }
function hasLore(k) { return lore().known.includes(k); }
function loreOpen(k) {
  const L = LORE[k];
  if (hasLore(k)) return false;
  if (L.rift && !Game.villagers.some((v) => v.isRiftborn())) return false;
  const known = lore().known.filter((x) => LORE[x]);
  if (L.tier === 2) return known.filter((x) => LORE[x].tier === 1).length >= 2;
  if (L.tier === 3) return known.filter((x) => LORE[x].tier === 2).length >= 2;
  return true;
}
function addLore(n) {
  const Lr = lore();
  n *= hasLore('library') ? 1.5 : 1;
  Lr.pts += n; Lr.made += n;
  if (Lr.study) {
    Lr.prog += n;
    const L = LORE[Lr.study];
    if (Lr.prog >= L.cost) {
      Lr.known.push(Lr.study); Lr.prog = 0;
      chronicle(`The village has learned ${L.name.toLowerCase()}! ${L.desc}`, 'learn');
      applyLore();
      Lr.study = null;
      Game.renown = (Game.renown || 0) + 5;
    }
  }
}
// standing changes the moment it's learned (and again when a village is loaded)
const SPOIL_BASE = { ...SPOIL };
function applyLore() {
  for (const r in SPOIL_BASE) SPOIL[r] = SPOIL_BASE[r] * (hasLore('smoking') ? 0.6 : 1);
  SEASON_GROWTH.winter = hasLore('frames') ? 0.3 : 0;
}

// where lore comes from
{
  patch(Villager.prototype, 'finish', (fin) => function () {
    const t = this.task;
    if (t) {
      const id = t.a.id, e = this.edu || 0;
      const n = { read: 0.6 + e, read_item: 1 + e, work_story: 2.5, school: 0.3, write_letter: 0.5 + e * 0.5, study_power: 1, teach: 0.5 }[id];
      if (n) addLore(n);
    }
    return fin.call(this);
  }, 'lore');
  patch(Villager.prototype, 'teach', (tch) => function () { addLore(0.5); return tch.call(this); }, 'lore');
}

// what it changes
{
  const gp = growPlot;
  growPlot = function (p, dtMin, rate) { return gp(p, dtMin, hasLore('rotation') ? rate * 1.15 : rate); };
  const pr = Village.produce;
  Village.produce = function (res, n, priv) {
    if (n > 0) {
      if (res === 'remedy' && hasLore('herbs')) n *= 2;
      if (res === 'honey' && hasLore('bees')) n = Math.round(n * 1.5 + Math.random() * 0.5);
      if (res === 'flour' && hasLore('gears')) n = Math.round(n * 1.25 + Math.random() * 0.5);
      if (res === 'ale' && hasLore('brewing')) n = Math.round(n * 1.25 + Math.random() * 0.5);
    }
    return pr.call(this, res, n, priv);
  };
  const sc = storeCap;
  storeCap = function (res) { return Math.round(sc(res) * (res === 'flour' && hasLore('gears') ? 1.5 : 1)); };
  const wp = workProject;
  workProject = function (v, p) { const r = wp(v, p); if (hasLore('masons') && R.chance(0.3) && Village.projects.includes(p)) wp(v, p); return r; };
  const wpt = ACTIONS.work_plan.tick;
  ACTIONS.work_plan.tick = (v, task, dt) => wpt(v, task, hasLore('drystone') && task.target.plan && ['raise', 'lower'].includes(task.target.plan.tool) ? dt * 2 : dt);
  const fl = floodNow;
  floodNow = function () {
    if (!hasLore('drystone')) return fl();
    // half the crops are saved
    const save = [];
    for (const f of World.fields) for (const p of f.plots) save.push([p, p.stage, p.prog]);
    for (const a of World.allotments) for (const p of a.plots) save.push([p, p.stage, p.prog]);
    const lost = fl();
    let kept = 0;
    for (const [p, st, pg] of save) if (p.stage !== st && R.chance(0.5)) { p.stage = st; p.prog = pg; kept++; }
    return lost - kept;
  };
  const cw = computeWatered;
  computeWatered = function () {
    cw();
    if (!hasLore('wells') || !World.watered) return;
    const near = World.watered, out = Uint8Array.from(near);
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (near[y * MAP_W + x]) for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) { const nx = x + i, ny = y + j; if (inMap(nx, ny) && i * i + j * j <= 25) out[ny * MAP_W + nx] = 1; }
    World.watered = out;
  };
}
window.addEventListener('DOMContentLoaded', () => {
  // the almanack: two days' warning, gentler droughts and blights
  const ph = planHazard;
  planHazard = function () { ph(); const z = hazard(); if (z && z.state === 'warned' && hasLore('almanack') && !z.early) { z.early = true; z.start += 1; z.end += 1; } };
  const gp2 = growPlot;
  growPlot = function (p, dtMin, rate) { const z = hasLore('almanack') && hazardActive(); if (z && (z.k === 'drought' || z.k === 'blight')) rate *= 1.5; return gp2(p, dtMin, rate); };
  // rift engineering eases the Hearthlink
  const bc = builtCivic;
  builtCivic = function (key) { if (hasLore('rifteng') && (key === 'dynamo' || key === 'turbine')) return bc('dynamo') || bc('turbine'); return bc(key); };
  // hedges are lovelier
  const ca = computeAppeal;
  computeAppeal = function () {
    const out = ca();
    if (!hasLore('hedges')) return out;
    for (const s of World.statics) if (s.gen && s.gen.type === 'hedge' && !s.hidden) { const tx = Math.floor(s.x / 16), ty = Math.floor((s.y - 2) / 16); for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (inMap(tx + i, ty + j)) out[(ty + j) * MAP_W + tx + i] += 0.25 * (1 - Math.hypot(i, j) / 4); }
    return out;
  };
  // the Lore page, under the Charter
  const g = LEDGER.find((x) => x.key === 'charter');
  if (g && !g.subs.some((s) => s[0] === 'lore')) g.subs.push(['lore', 'Lore']);
  const rv = renderVillage;
  renderVillage = function () {
    if (Game.villageTab !== 'lore') return rv();
    const savedTab = 'lore';
    Game.villageTab = 'charter'; rv(); Game.villageTab = savedTab;
    const body = $('village-body');
    const sub = body.querySelector('.subtabs');
    body.innerHTML = '';
    if (sub) { body.appendChild(sub); sub.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.sub === 'lore')); }
    body.insertAdjacentHTML('beforeend', loreHTML());
    body.querySelectorAll('[data-study]').forEach((b) => b.addEventListener('click', () => { const Lr = lore(); if (Lr.study && Lr.prog > 0 && Lr.study !== b.dataset.study) toast('Progress on the old study is kept for when you come back to it.', 'info'); Lr.saved = Lr.saved || {}; if (Lr.study) Lr.saved[Lr.study] = Lr.prog; Lr.study = b.dataset.study; Lr.prog = Lr.saved[Lr.study] || 0; renderVillage(); }));
  };
  addHook('newVillage', () => { Game.lore = null; applyLore(); });
});
function loreHTML() {
  const Lr = lore();
  const perDay = Math.round((Lr.made || 0) / Math.max(1, Game.day - 1));
  let h = `<p class="lede-s">Reading by the fire, letters, lessons and the story circle all add lore: about ${perDay} a day lately. Choose what the village studies next.</p>`;
  if (Lr.study) { const L = LORE[Lr.study]; h += `<div class="lore-now"><b>Studying: ${escapeHtml(L.name)}</b>${bar(Lr.prog / L.cost, 'good')}<span class="sub">${Math.floor(Lr.prog)} of ${L.cost} lore</span></div>`; }
  else h += '<div class="note">Nothing is being studied. Pick something below.</div>';
  for (const tier of [1, 2, 3]) {
    h += `<h3>${['', 'Old knowledge', 'Craft knowledge', 'Deep knowledge'][tier]}${tier > 1 ? ` <span class="sub">(needs two from the row above)</span>` : ''}</h3><div class="lore-grid">`;
    for (const [k, L] of Object.entries(LORE).filter(([, x]) => x.tier === tier)) {
      const known = hasLore(k), open = loreOpen(k), cur = Lr.study === k;
      h += `<div class="lore-card${known ? ' known' : open ? '' : ' locked'}${cur ? ' cur' : ''}"><b>${escapeHtml(L.name)}</b><span>${escapeHtml(L.desc)}</span><span class="sub">${known ? '✓ Learned' : `${L.cost} lore${L.rift ? ' · needs rift-folk' : ''}`}</span>${!known && open && !cur ? `<button data-study="${k}">Study this</button>` : ''}</div>`;
    }
    h += '</div>';
  }
  return h;
}
