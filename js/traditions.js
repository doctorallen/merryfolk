'use strict';
// ---------------------------------------------------------------------------
// Traditions (Age of Empires' age-up choices). Each time the Moot raises
// Thistledown a rank, it also chooses what the village will be known for,
// and that tradition stays:
//   Village:     farming (crops grow faster), building (works go faster) or
//                merrymaking (parties and feasts lift spirits more)
//   Market Town: commerce (better prices from the caravans), learning (more
//                lore) or hospitality (travellers settle more readily)
//   Shire Town:  renown (charters pay more), tidiness (everything is lovelier)
//                or the great outdoors (hazards are gentler)
// ---------------------------------------------------------------------------

const TRADITIONS = {
  1: [
    { k: 'farming', name: 'A farming tradition', desc: 'Crops grow 15% faster.' },
    { k: 'building', name: 'A building tradition', desc: 'All building works go 25% faster.' },
    { k: 'merry', name: 'A merrymaking tradition', desc: 'Parties and feasts lift spirits more, and for longer.' },
  ],
  2: [
    { k: 'commerce', name: 'A tradition of commerce', desc: 'The caravans pay 20% more and charge 10% less.' },
    { k: 'learning', name: 'A tradition of learning', desc: 'Half as much lore again from every source.' },
    { k: 'hospitality', name: 'A tradition of hospitality', desc: 'Travellers settle more readily, even when spirits are only fair.' },
  ],
  3: [
    { k: 'renown', name: 'A tradition of renown', desc: 'Every charter pays half as much again.' },
    { k: 'tidy', name: 'A tradition of tidiness', desc: 'Every corner of the village is lovelier.' },
    { k: 'outdoors', name: 'A love of the outdoors', desc: 'Floods, droughts, blights and frosts are gentler.' },
  ],
};
const hasTrad = (k) => (Game.traditions || []).includes(k);
function chooseTradition(e) {
  const opts = TRADITIONS[e];
  if (!opts) return;
  askMoot(`Thistledown, the ${ERAS[e].name}: what will we be known for?`, 'The Moot is still on the party field, and there\'s one more thing to settle: what will Thistledown be known for, from now on?', opts.map((o) => ({ label: o.name, desc: o.desc, fn: () => { (Game.traditions || (Game.traditions = [])).push(o.k); chronicle(`The Moot has chosen: ${o.name.charAt(0).toLowerCase() + o.name.slice(1)}. ${o.desc}`, 'party'); } })));
}
window.addEventListener('DOMContentLoaded', () => {
  const hm = holdMoot;
  holdMoot = function () { const e0 = era(); hm(); if (era() > e0) queueMoot(() => chooseTradition(era())); };
  // effects
  const gp = growPlot;
  growPlot = function (p, dtMin, rate) { return gp(p, dtMin, hasTrad('farming') ? rate * 1.15 : rate); };
  const wp = workProject;
  workProject = function (v, p) { const r = wp(v, p); if (hasTrad('building') && R.chance(0.25) && Village.projects.includes(p)) wp(v, p); return r; };
  const wpt = ACTIONS.work_plan.tick;
  ACTIONS.work_plan.tick = (v, task, dt) => wpt(v, task, hasTrad('building') ? dt * 1.25 : dt);
  const f = feel;
  feel = function (v, key, x = '', mins) { if (hasTrad('merry') && ['party', 'feasted', 'festival', 'singsong', 'feast_dined', 'bday_guest', 'holiday'].includes(key)) mins = Math.round(MOODLETS[key][2] * 1.5); return f(v, key, x, mins); };
  const sp = sellPrice, bp = buyPrice;
  sellPrice = function (k) { return sp(k) * (hasTrad('commerce') ? 1.2 : 1); };
  buyPrice = function (k) { return bp(k) * (hasTrad('commerce') ? 0.9 : 1); };
  const al = addLore;
  addLore = function (n) { return al(hasTrad('learning') ? n * 1.5 : n); };
  const md = migrationDaily;
  migrationDaily = function () {
    if (!hasTrad('hospitality')) return md();
    const c = contentment();
    if (c >= 55 && c < 66 && Game.villagers.length < MAX_POP - 2 && Game.day - (Game.lastTraveller ?? -9) >= 2 && R.chance(0.25)) {
      const r = welcomeTraveller(null, true);
      if (r && r.ok !== false) { Game.lastTraveller = Game.day; chronicle(`Thistledown's famous hospitality has drawn ${r.v ? r.v.name() : 'a traveller'} up the West Road to settle.`, 'birth'); }
      return;
    }
    return md();
  };
  const ct = chartersTick;
  chartersTick = function () { for (const c of Game.charters || []) if (hasTrad('renown') && !c.boosted) { c.reward.coin = Math.round(c.reward.coin * 1.5); c.reward.renown = Math.round(c.reward.renown * 1.5); c.boosted = true; } return ct(); };
  const ca = computeAppeal;
  computeAppeal = function () { const out = ca(); if (hasTrad('tidy')) for (let i = 0; i < out.length; i++) out[i] += 0.8; return out; };
  const g2 = growPlot;
  growPlot = function (p, dtMin, rate) { const z = hasTrad('outdoors') && hazardActive(); if (z && (z.k === 'drought' || z.k === 'blight')) rate *= 1.6; return g2(p, dtMin, rate); };
  const fl = floodNow;
  floodNow = function () { if (!hasTrad('outdoors')) return fl(); const save = []; for (const fd of World.fields) for (const p of fd.plots) save.push([p, p.stage, p.prog]); const lost = fl(); let kept = 0; for (const [p, st, pg] of save) if (p.stage !== st && R.chance(0.5)) { p.stage = st; p.prog = pg; kept++; } return lost - kept; };
  // on the Charter
  const ch = charterHTML;
  charterHTML = function () { const t = Game.traditions || []; const all = Object.values(TRADITIONS).flat(); return ch() + (t.length ? `<h3>Thistledown's traditions</h3><div class="likes">${t.map((k) => { const o = all.find((x) => x.k === k); return o ? `<div><b>${escapeHtml(o.name)}.</b> ${escapeHtml(o.desc)}</div>` : ''; }).join('')}</div>` : ''); };
  addHook('newVillage', () => { Game.traditions = []; });
});
