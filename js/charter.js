'use strict';
// ---------------------------------------------------------------------------
// The Village Charter: goals, renown and the eras of Thistledown (Age of
// Empires' ages, SimCity's milestones, Anno's quests).
//
// Three charters are open at a time: lay forty yards of new path, light the
// lanes with twenty lamps, go into winter with sixty jars put by, see a
// wedding, keep the village contented through a whole day... Each pays coin
// and renown when it's met, and a fresh one takes its place.
//
// Renown, folk and contentment carry the village through its eras: a Hamlet
// becomes a Village, a Market Town and at last a Shire Town. Each step is
// yours to take: when everything's in place, call a Moot on the party field
// and the village votes itself up a rank, with a party. Each era opens new
// things to do: digging ponds and shaping the land, siting public buildings,
// a second caravan, grander decorations.
// ---------------------------------------------------------------------------

const ERAS = [
  { name: 'Hamlet', blurb: 'A handful of hobbit-holes round a well.' },
  { name: 'Village', need: { folk: 30, renown: 60, charters: 3, content: 50 }, unlock: ['raise', 'lower', 'pond', 'fill', 'civic', 'well'], blurb: 'Shape the land (raise and lower the ground, dig and fill ponds), sink new wells and choose where public buildings go.' },
  { name: 'Market Town', need: { folk: 42, renown: 180, charters: 8, content: 55, civic: 2 }, unlock: ['statue'], blurb: 'Raise statues on the green; the caravans come twice a week.' },
  { name: 'Shire Town', need: { folk: 55, renown: 400, charters: 15, content: 62, civic: 4 }, unlock: ['fountain'], blurb: 'A town of the Shire: fountains, and a Great Fair every season.' },
];
const ERA_TOOLS = new Set(ERAS.flatMap((e) => e.unlock || []));
function era() { return Game.era || 0; }
function toolUnlocked(id) { if (!ERA_TOOLS.has(id)) return true; const i = ERAS.findIndex((e) => (e.unlock || []).includes(id)); return era() >= i; }
function eraFor(id) { const e = ERAS.find((x) => (x.unlock || []).includes(id)); return e ? e.name : ''; }

// --- Counting what's been done ----------------------------------------------------
function builtCount(tool) { return (Game.planDone || []).filter((d) => d.tool === tool).reduce((s, d) => s + (['path', 'flowers', 'pond'].includes(tool) ? d.tiles.length : 1), 0); }
const CHARTER_KINDS = {
  paths: { text: (n) => `Lay ${n} yards of new path`, size: [20, 40, 70], val: () => builtCount('path'), delta: true },
  flowers: { text: (n) => `Sow ${n} yards of wildflowers`, size: [10, 25, 45], val: () => builtCount('flowers'), delta: true },
  benches: { text: (n) => `Put up ${n} new benches`, size: [2, 4, 6], val: () => builtCount('bench'), delta: true },
  trees: { text: (n) => `Plant ${n} trees`, size: [4, 8, 14], val: () => builtCount('tree'), delta: true },
  lamps: { text: (n) => `Light ${n} lamps on a single night`, size: [18, 22, 28], val: () => World.lamps.filter((l) => l.lit).length },
  folk: { text: (n) => `Grow to ${n} folk`, size: [8, 14, 22], val: () => Game.villagers.length, base: () => Game.villagers.length, add: true },
  homes: { text: (n) => (n === 1 ? 'Dig a new hobbit-hole' : `Dig ${n} new hobbit-holes`), size: [1, 2, 3], val: () => World.homes.filter((h) => h.built).length, delta: true },
  babies: { text: (n) => `Welcome ${n} babies`, size: [2, 3, 5], val: () => Game.stats.births || 0, delta: true },
  weddings: { text: (n) => `See ${n === 1 ? 'a wedding' : n + ' weddings'}`, size: [1, 2, 3], val: () => Game.stats.weddings || 0, delta: true },
  content: { text: (n) => `Keep contentment at ${n}% or more through a whole day`, size: [60, 66, 72], val: (c) => (Game.contentStreak || 0) >= 24 && contentment() >= c.n ? c.n : 0, target: true },
  jars: { text: (n) => `Put by ${n} jars for winter`, size: [40, 70, 110], val: () => World.homes.reduce((s, h) => s + (h.built && typeof jarsTotal === 'function' ? jarsTotal(h) : 0), 0), target: true, when: () => World.season === 'summer' || World.season === 'autumn' },
  wood: { text: (n) => `Stock ${n} timber in the Store`, size: [60, 90, 115], val: () => Village.stores.wood || 0, target: true },
  ale: { text: (n) => `Brew up ${n} pints of ale in the Store`, size: [50, 70, 85], val: () => Village.stores.ale || 0, target: true },
  pets: { text: (n) => `${n} households with a pet`, size: [4, 6, 9], val: () => (Game.pets || []).length, target: true },
  letters: { text: (n) => `Deliver ${n} letters`, size: [10, 20, 35], val: () => Game.villagers.reduce((s, v) => s + (v.stats.letters || 0), 0), delta: true },
  riftfriend: { text: () => 'Make one of the rift-folk at home: three hill-folk friends', size: [1, 1, 1], val: () => (Game.villagers.some((v) => v.isRiftborn() && Object.entries(v.rel).filter(([id, r]) => r > 0.45 && Game.villagers.some((o) => o.id === +id && !o.isRiftborn())).length >= 3) ? 1 : 0), target: true, when: () => Game.villagers.some((v) => v.isRiftborn()) },
  sold: { text: (n) => `Sell ${n} pennies' worth to the caravans`, size: [40, 100, 200], val: () => Game.stats.sold || 0, delta: true },
};
function newCharter(skip = []) {
  const tier = Math.min(2, era());
  const open = (Game.charters || []).map((c) => c.k);
  const kinds = Object.keys(CHARTER_KINDS).filter((k) => !open.includes(k) && !skip.includes(k) && (!CHARTER_KINDS[k].when || CHARTER_KINDS[k].when()));
  if (!kinds.length) return null;
  const k = R.pick(kinds), K = CHARTER_KINDS[k];
  const n = K.size[tier] * (K.add ? 1 : 1);
  const c = { k, n: K.add ? K.base() + n : n, base: K.delta ? K.val() : 0, day: Game.day };
  c.reward = { coin: 10 + tier * 10 + Math.round(R.f(0, 10)), renown: 15 + tier * 10 };
  return c;
}
function charterProgress(c) {
  const K = CHARTER_KINDS[c.k];
  if (!K) return 0;
  const v = K.delta ? K.val(c) - c.base : K.val(c);
  return clamp(v / c.n, 0, 1);
}
function charterText(c) { return CHARTER_KINDS[c.k] ? CHARTER_KINDS[c.k].text(c.n) : c.k; }
function chartersTick() {
  Game.charters = Game.charters || [];
  for (const c of Game.charters.slice()) {
    if (charterProgress(c) < 1) continue;
    Game.charters = Game.charters.filter((x) => x !== c);
    Game.chartersDone = (Game.chartersDone || 0) + 1;
    Game.coin = (Game.coin || 0) + c.reward.coin; Game.renown = (Game.renown || 0) + c.reward.renown;
    chronicle(`Charter met: ${charterText(c).charAt(0).toLowerCase() + charterText(c).slice(1)}! The village earns ${c.reward.coin} pennies and ${c.reward.renown} renown.`, 'party');
    if (typeof Sound !== 'undefined' && Sound.chime) Sound.chime();
    for (const v of Game.villagers) if (!v.inside && v.stage !== 'baby' && R.chance(0.15)) v.say(R.pick(['Well done, us!', 'Hurrah for Thistledown!', 'Didn\'t we do well?']), 2.4);
  }
  while (Game.charters.length < 3) { const c = newCharter(); if (!c) break; Game.charters.push(c); }
}
// Swap a charter you don't fancy for another (once a day).
function swapCharter(i) {
  if (Game.swapDay === Game.day) { toast('You can swap one charter a day.', 'info'); return; }
  const old = Game.charters[i];
  const c = newCharter([old.k]);
  if (!c) return;
  Game.charters[i] = c; Game.swapDay = Game.day;
}

// --- Eras -------------------------------------------------------------------------
function eraNeeds(i) {
  const N = ERAS[i].need, out = [];
  const civic = World.lots.filter((l) => l.kind === 'building' && l.state === 'done').length;
  if (N.folk) out.push([`${N.folk} folk`, Game.villagers.length, N.folk]);
  if (N.renown) out.push([`${N.renown} renown`, Game.renown || 0, N.renown]);
  if (N.charters) out.push([`${N.charters} charters met`, Game.chartersDone || 0, N.charters]);
  if (N.content) out.push([`Contentment ${N.content}%`, contentment(), N.content]);
  if (N.civic) out.push([`${N.civic} public buildings raised`, civic, N.civic]);
  return out;
}
function eraReady(i) { return i < ERAS.length && eraNeeds(i).every(([, have, want]) => have >= want); }
function holdMoot() {
  const i = era() + 1;
  if (!eraReady(i)) return;
  Game.era = i;
  Game.renown = (Game.renown || 0) + 20;
  chronicle(`The Moot has met on the party field, and by a great show of hands Thistledown is a ${ERAS[i].name} from this day! ${ERAS[i].blurb}`, 'party');
  if (typeof startParty === 'function' && !Game.party.on) { Game.party.planned = 'moot'; }
  for (const v of Game.villagers) if (v.stage !== 'baby') feel(v, 'era', ERAS[i].name);
  if (typeof renderBuildBar === 'function') renderBuildBar();
  renderVillage();
}
MOODLETS.era = ['Proud of our village: a {x} now', 0.12, 2880, ['A {x}! Who\'d have thought it.', 'Proud to live in a {x}, I am.']];

// --- The tab in the ledger --------------------------------------------------------
function charterHTML() {
  const e = era(), next = ERAS[e + 1];
  let h = `<p class="lede-s">Thistledown is a <b>${ERAS[e].name}</b>. ${ERAS[e].blurb} Renown ${Game.renown || 0} · ${Game.coin || 0} pennies in the village chest · ${Game.chartersDone || 0} charters met.</p>`;
  h += '<h3>Charters</h3><div class="ch-list">';
  (Game.charters || []).forEach((c, i) => {
    const p = charterProgress(c);
    h += `<div class="ch"><div class="ch-t">${escapeHtml(charterText(c))}</div>${bar(p, p >= 0.66 ? 'good' : 'mid')}<div class="ch-r"><span class="sub">${Math.round(p * 100)}% · reward ${c.reward.coin}p, ${c.reward.renown} renown</span><button data-swap="${i}" title="Swap for another charter (once a day)">Swap</button></div></div>`;
  });
  h += '</div>';
  if (next) {
    h += `<h3>Towards ${next.name}</h3><div class="ch-era">${eraNeeds(e + 1).map(([t, have, want]) => `<div class="${have >= want ? 'met' : ''}">${have >= want ? '✓' : '○'} ${escapeHtml(t)} <span class="sub">(${typeof have === 'number' ? Math.round(have) : have})</span></div>`).join('')}</div>`;
    h += `<div class="sub">${next.blurb}</div>`;
    h += `<div class="row-btns"><button id="ch-moot" class="${eraReady(e + 1) ? 'primary' : ''}" ${eraReady(e + 1) ? '' : 'disabled'}>Call a Moot: become a ${next.name}</button></div>`;
  } else h += '<p>Thistledown is as grand as a Shire town gets. Long may it prosper.</p>';
  const mps = Game.masterpieces || [];
  if (mps.length) h += `<h3>Treasures of Thistledown</h3><div class="likes">${mps.map((m) => `<div><b>${escapeHtml(m.name)}</b>, a ${escapeHtml(m.thing)} by ${escapeHtml(m.byName)} (day ${m.day}), showing ${escapeHtml(m.shows)}</div>`).join('')}</div>`;
  return h;
}

window.addEventListener('DOMContentLoaded', () => {
  const rv = renderVillage;
  renderVillage = function () {
    if (Game.villageTab === 'charter') {
      document.querySelectorAll('#village .tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'charter'));
      const body = $('village-body');
      body.innerHTML = charterHTML();
      body.querySelectorAll('[data-swap]').forEach((b) => b.addEventListener('click', () => { swapCharter(+b.dataset.swap); renderVillage(); }));
      const m = $('ch-moot'); if (m) m.addEventListener('click', holdMoot);
      return;
    }
    return rv();
  };
  const oh = onHour;
  onHour = function (h) {
    const r = oh(h);
    Game.contentStreak = contentment() >= 60 ? (Game.contentStreak || 0) + 1 : 0;
    chartersTick();
    if (eraReady(era() + 1) && Game.mootNote !== era()) { Game.mootNote = era(); chronicle(`Everything's in place for Thistledown to become a ${ERAS[era() + 1].name}. Call a Moot from the Charter tab of the village ledger!`, 'party'); }
    return r;
  };
  const nv = newVillage;
  newVillage = function () { Game.era = 0; Game.renown = 0; Game.coin = 20; Game.charters = []; Game.chartersDone = 0; Game.contentStreak = 0; Game.mootNote = -1; const r = nv(); chartersTick(); return r; };
  // locked build tools
  const rb = renderBuildBar;
  renderBuildBar = function () {
    rb();
    document.querySelectorAll('#buildbar [data-btool]').forEach((b) => {
      const id = b.dataset.btool;
      if (toolUnlocked(id)) return;
      b.classList.add('locked'); b.title = `Unlocked when Thistledown becomes a ${eraFor(id)}`;
      b.replaceWith(b.cloneNode(true));
    });
    document.querySelectorAll('#buildbar .locked').forEach((b) => b.addEventListener('click', () => toast(`That comes when Thistledown becomes a ${eraFor(b.dataset.btool)}. See the Charter tab.`, 'info')));
    if (!toolUnlocked(Build.tool)) { Build.tool = 'path'; }
  };
  const hud = updateHUD;
  updateHUD = function () {
    hud();
    const el = $('hud-coin');
    if (el) { el.textContent = `${Game.coin || 0}p · ${ERAS[era()].name}`; el.title = `${Game.coin || 0} pennies in the village chest · renown ${Game.renown || 0}: open the Charter`; }
  };
  $('hud-coin').addEventListener('click', () => { Game.villageTab = 'charter'; $('village').hidden = false; renderVillage(); });
});
