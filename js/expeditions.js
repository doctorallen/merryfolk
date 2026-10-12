'use strict';
// ---------------------------------------------------------------------------
// Expeditions (Heroes of Might and Magic's scouting, cosy). From the Charter,
// send a brave hobbit off to explore beyond the valley: the north hills, the
// east forest, the southern fens or along the West Road. It costs pennies and
// food for the pack, and they're gone two days. They come back with a tale
// and a discovery that opens something new for the village:
//   north hills: a stone quarry (stone to sell, and statues cost less) or
//                upland pasture (more wool)
//   east forest: a stand of old-growth timber, or wild bees (honey)
//   southern fens: a peat bog (winter fires burn peat before timber) or a
//                clay pit (clay to sell, and potters at home make more)
//   the West Road: a cache of old coins in a ruin, or a friendly hamlet
//                that sends a wagon every week
// Each region can be explored once; what's found is shown on the Charter.
// ---------------------------------------------------------------------------

const REGIONS = {
  north: { name: 'the north hills', finds: ['quarry', 'pasture'] },
  east: { name: 'the east forest', finds: ['timber', 'bees'] },
  south: { name: 'the southern fens', finds: ['peat', 'clay'] },
  west: { name: 'along the West Road', finds: ['cache', 'hamlet'] },
};
const FINDS = {
  quarry: { name: 'a stone quarry', text: 'There\'s good grey stone in the north hills, a day\'s walk off. The woodwrights can cut it: stone sells well, and statues cost half as much.', apply: () => { RES_INFO.stone = RES_INFO.stone || { label: 'Stone', icon: 'sack' }; if (!STORE_KEYS.includes('stone')) STORE_KEYS.push('stone'); STORE_CAP.stone = 80; PRICE.stone = 3; RES_WORD.stone = 'stone'; for (const t of TRADERS) if (t.key === 'bree' && !t.buys.includes('stone')) t.buys.push('stone'); } },
  pasture: { name: 'upland pasture', text: 'Sweet upland grazing in the north hills: the herders can summer the sheep there. Half as much wool again.', apply: () => {} },
  timber: { name: 'old-growth timber', text: 'A stand of huge old oaks deep in the east forest, enough timber for years. The woodwrights bring in more with every trip.', apply: () => {} },
  bees: { name: 'wild bees', text: 'Wild bees in hollow trees in the east forest. The orchard-keepers bring back honeycomb.', apply: () => {} },
  peat: { name: 'a peat bog', text: 'A great peat bog in the southern fens. Cut and dried, peat burns in winter hearths before timber does.', apply: () => {} },
  clay: { name: 'a clay pit', text: 'Good red clay in the southern fens. It sells to the caravans, and the potters at home make twice as much.', apply: () => { RES_INFO.clay = RES_INFO.clay || { label: 'Clay', icon: 'cup' }; if (!STORE_KEYS.includes('clay')) STORE_KEYS.push('clay'); STORE_CAP.clay = 60; PRICE.clay = 2; RES_WORD.clay = 'clay'; for (const t of TRADERS) if (t.key === 'took' && !t.buys.includes('clay')) t.buys.push('clay'); } },
  cache: { name: 'a cache of old coins', text: 'In a ruin along the West Road: a pot of old coins and a few odd treasures. Into the village chest they go (+60 pennies, and some mathoms).', apply: (first) => { if (first) { Game.coin = (Game.coin || 0) + 60; const h = World.homes.find((x) => x.built && residentsOf(x).length); if (h && typeof newMathom === 'function') { const m = newMathom(h, 'trip'); m.name = 'tarnished silver goblet'; } } } },
  hamlet: { name: 'a friendly hamlet', text: 'A little hamlet down the West Road, glad of new friends. Their wagon will come every Hevensday to trade.', apply: () => {} },
};
function expeditions() { return Game.exped || (Game.exped = { sent: {}, found: {} }); }
function hasFind(k) { return Object.values(expeditions().found).includes(k); }
function expeditionLeader() {
  return Game.villagers.filter((v) => v.isGrown() && v.stage === 'adult' && !v.leaving && !v.expecting && !v.newcomer && !Game.villagers.some((b) => b.stage === 'baby' && b.parents.includes(v.id)))
    .sort((a, b) => (b.genes.bravery + b.genes.curiosity) - (a.genes.bravery + a.genes.curiosity))[0];
}
function sendExpedition(region) {
  const E = expeditions();
  if (E.sent[region]) return;
  if ((Game.coin || 0) < 15 || Village.foodTotal() < 10) { toast('An expedition needs 15 pennies and 10 helpings of food for the pack.', 'info'); return; }
  const v = expeditionLeader();
  if (!v) { toast('Nobody is free to go.', 'info'); return; }
  Game.coin -= 15;
  let left = 10; for (const k of ['bread', 'cheese', 'apple', 'pie', 'cake', 'veg', 'fish']) { const n = Math.min(left, Math.floor(Village.stores[k] || 0)); Village.use(k, n); left -= n; if (!left) break; }
  E.sent[region] = { id: v.id, name: v.first, back: Game.day + 2 };
  startAdventure(v, 'trip');
  const entry = Game.away.find((a) => a.id === v.id);
  if (entry) { entry.back = Game.day + 2; entry.expedition = region; }
  chronicle(`${v.name()} has set off to explore ${REGIONS[region].name} for the village, with a full pack and a map with a lot of blank on it. Back in two days.`, 'adventure');
}
window.addEventListener('DOMContentLoaded', () => {
  const rt = returnFromTrip;
  returnFromTrip = function (entry) {
    const r = rt(entry);
    if (entry.expedition) {
      const i = Game.log.findIndex((l) => l.text.includes('is back from adventuring') && l.text.includes(entry.data.first));
      if (i >= 0 && i < 3) { Game.log.splice(i, 1); renderLog(); }
      const region = entry.expedition, E = expeditions();
      const k = R.pick(REGIONS[region].finds);
      E.found[region] = k;
      FINDS[k].apply(true);
      Game.renown = (Game.renown || 0) + 10;
      const v = Game.villagers.find((o) => o.id === entry.id);
      if (v) { v.remember(`Explored ${REGIONS[region].name} and found ${FINDS[k].name}.`, 3); feel(v, 'won', 'the honour of the expedition'); }
      chronicle(`${v ? v.first : 'The explorer'} is back from ${REGIONS[region].name}, footsore and very pleased: ${v ? v.pron.they : 'they'} found ${FINDS[k].name}! ${FINDS[k].text} (+10 renown)`, 'adventure');
    }
    return r;
  };
  // what the finds do, day to day
  const pr = Village.produce;
  Village.produce = function (res, n, priv) {
    if (n > 0) {
      if (res === 'wool' && hasFind('pasture')) n = Math.round(n * 1.5 + Math.random() * 0.5);
      if (res === 'wood' && hasFind('timber')) n += Math.random() < 0.5 ? 1 : 0;
    }
    return pr.call(this, res, n, priv);
  };
  addHook('onHour', (h) => {
    if (h === 14) {
      if (hasFind('quarry')) Village.produce('stone', Game.villagers.filter((v) => v.job === 'woodwright').length);
      if (hasFind('clay')) Village.produce('clay', 2);
      if (hasFind('bees') && World.season !== 'winter') Village.produce('honey', 1);
    }
    if (hasFind('hamlet') && weekday(Game.day) === 'Hevensday' && h === 8 && !caravan()) arriveCaravan();
  });
  // peat burns before timber in the cold months
  const lh = lightHearths;
  lightHearths = function () {
    if (!hasFind('peat')) return lh();
    const w = Village.stores.wood;
    lh();
    const used = w - Village.stores.wood;
    if (used > 0) Village.stores.wood += Math.round(used * 0.6);
  };
  // statues cost half with stone
  const pc = BTOOL.statue && BTOOL.statue.cost;
  const rb = renderBuildBar;
  renderBuildBar = function () { if (BTOOL.statue) BTOOL.statue.cost = hasFind('quarry') ? { coin: 15 } : pc; return rb(); };
  // on the Charter
  const ch = charterHTML;
  charterHTML = function () {
    const E = expeditions();
    let h = ch();
    h += '<h3>Beyond the valley</h3><div class="ex-grid">';
    for (const [k, R0] of Object.entries(REGIONS)) {
      const found = E.found[k], sent = E.sent[k];
      h += `<div class="ex">${found ? `<b>${escapeHtml(R0.name.charAt(0).toUpperCase() + R0.name.slice(1))}</b><span>Found ${escapeHtml(FINDS[found].name)}. ${escapeHtml(FINDS[found].text)}</span>` : sent ? `<b>${escapeHtml(R0.name.charAt(0).toUpperCase() + R0.name.slice(1))}</b><span>${escapeHtml(sent.name)} is out exploring; back about day ${sent.back}.</span>` : `<b>${escapeHtml(R0.name.charAt(0).toUpperCase() + R0.name.slice(1))}</b><span class="sub">Unexplored. Might hold ${R0.finds.map((f) => FINDS[f].name).join(' or ')}.</span><button data-exped="${k}">Send an expedition (15p, 10 food)</button>`}</div>`;
    }
    return h + '</div>';
  };
  const rv = renderVillage;
  renderVillage = function () { rv(); if (Game.villageTab === 'charter') $('village-body').querySelectorAll('[data-exped]').forEach((b) => b.addEventListener('click', () => { sendExpedition(b.dataset.exped); renderVillage(); })); };
  addHook('newVillage', () => { Game.exped = null; });
});
// after loading, the finds' goods exist again
function restoreFinds() { for (const k of Object.values(expeditions().found)) FINDS[k].apply(false); }
