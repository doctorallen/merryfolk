'use strict';
// ---------------------------------------------------------------------------
// The market and the caravans (Stronghold's marketplace, Anno's traders).
//
// On Trewsday, market day, a trader's wagon rolls up the West Road and stands
// in the square from eight till five; once Thistledown is a Market Town, they
// come on Mersday too. Each is different: the Bree carter, the dwarf pedlar
// from the Blue Mountains, a Tookland cheesemonger, and (once the rift-folk
// have come) a rift scavenger with a cart of salvage. Every trader wants a
// couple of things badly and pays over the odds for them; prices fall as you
// sell them more of something and rise as you buy. It's your job to sell what
// the village can spare (mind the winter!) and buy what it's short of. Coin
// pays for statues and fountains, and for a crew of dwarf masons, who double
// the pace of every building job for two days.
// ---------------------------------------------------------------------------

const PRICE = { grain: 1, flour: 2, bread: 2, pie: 4, cake: 5, veg: 1, fish: 2, apple: 1, egg: 1, honey: 4, ale: 2, leaf: 3, wood: 2, herbs: 3, remedy: 6, cheese: 4, wool: 3, scrap: 3 };
const TRADERS = [
  { key: 'bree', name: 'Barliman the Bree carter', sells: ['wood', 'flour', 'cheese', 'remedy'], buys: ['grain', 'leaf', 'ale', 'wool', 'apple', 'honey'], wants: ['leaf', 'ale', 'grain'] },
  { key: 'dwarf', name: 'Dwalin\'s cousin, a dwarf pedlar', sells: ['wood', 'remedy', 'scrap'], buys: ['ale', 'cake', 'pie', 'honey', 'cheese', 'bread'], wants: ['cake', 'pie', 'ale'], masons: true },
  { key: 'took', name: 'a Tookland cheesemonger', sells: ['cheese', 'honey', 'egg', 'apple'], buys: ['wool', 'grain', 'veg', 'fish', 'herbs'], wants: ['wool', 'herbs', 'fish'] },
  { key: 'rift', name: 'Vex the rift scavenger', sells: ['scrap', 'remedy', 'wood'], buys: ['bread', 'veg', 'fish', 'stew', 'apple', 'cheese'], wants: ['bread', 'fish'], rift: true },
];
const RES_WORD = { grain: 'barley', flour: 'flour', bread: 'loaves', pie: 'pies', cake: 'seed-cakes', veg: 'vegetables', fish: 'fish', apple: 'apples', egg: 'eggs', honey: 'honey', ale: 'ale', leaf: 'pipe-weed', wood: 'timber', herbs: 'herbs', remedy: 'remedies', cheese: 'cheese', wool: 'wool', scrap: 'scrap', stew: 'stew' };

function caravan() { return Game.caravan || null; }
function caravanDue(day) { return isMarketDay(day) || (era() >= 2 && weekday(day) === 'Mersday'); }
function arriveCaravan() {
  const pool = TRADERS.filter((t) => !t.rift || Game.villagers.some((v) => v.isRiftborn()));
  const last = Game.lastTrader;
  const t = R.pick(pool.filter((x) => x.key !== last)) || pool[0];
  Game.lastTrader = t.key;
  const wants = t.wants.slice().sort(() => Math.random() - 0.5).slice(0, 2);
  Game.caravan = { key: t.key, wants, sold: {}, bought: {}, day: Game.day, until: Math.floor(Game.time / 1440) * 1440 + 17 * 60 };
  chronicle(`${t.name.charAt(0).toUpperCase() + t.name.slice(1)} has drawn up a wagon in the square for market day, paying well for ${wants.map((k) => RES_WORD[k]).join(' and ')}. Open the Market tab to trade.`, 'info');
  showCaravan(true);
}
function leaveCaravan() {
  const c = caravan();
  if (!c) return;
  const t = TRADERS.find((x) => x.key === c.key);
  const earned = c.earned || 0, spent = c.spent || 0;
  if (earned || spent) chronicle(`${t.name.charAt(0).toUpperCase() + t.name.slice(1)} has packed up and rolled off down the West Road. The village ${earned ? `took ${earned} pennies` : ''}${earned && spent ? ' and ' : ''}${spent ? `spent ${spent}` : ''}.`, 'info');
  Game.caravan = null;
  showCaravan(false);
}
// Prices: a trader's favourites fetch half as much again; each sale this visit knocks the price down, each purchase pushes it up.
function sellPrice(k) {
  const c = caravan(); if (!c) return 0;
  const base = PRICE[k] || 1, want = c.wants.includes(k) ? 1.6 : 1;
  return Math.max(0.2, base * want * Math.pow(0.97, c.sold[k] || 0)) * 0.8;
}
function buyPrice(k) {
  const c = caravan(); if (!c) return 0;
  return (PRICE[k] || 1) * 1.25 * Math.pow(1.03, c.bought[k] || 0);
}
function sell(k, n) {
  const c = caravan(); if (!c) return;
  n = Math.min(n, Math.floor(Village.stores[k] || 0));
  if (n <= 0) return;
  let coin = 0;
  for (let i = 0; i < n; i++) { coin += sellPrice(k); c.sold[k] = (c.sold[k] || 0) + 1; }
  coin = Math.round(coin);
  Village.use(k, n);
  Game.coin = (Game.coin || 0) + coin; c.earned = (c.earned || 0) + coin;
  Game.stats.sold = (Game.stats.sold || 0) + coin;
  toast(`Sold ${n} ${RES_WORD[k]} for ${coin} pennies.`, 'info');
}
function buy(k, n) {
  const c = caravan(); if (!c) return;
  const room = Math.max(0, Math.floor(storeCap(k) - (Village.stores[k] || 0)));
  if (room <= 0) { toast(`The Store can't hold any more ${RES_WORD[k]}.`, 'info'); return; }
  n = Math.min(n, room);
  let cost = 0, got = 0;
  for (let i = 0; i < n; i++) { const p = buyPrice(k); if ((Game.coin || 0) < Math.round(cost + p)) break; cost += p; got++; c.bought[k] = (c.bought[k] || 0) + 1; }
  cost = Math.round(cost);
  if (!got) { toast('Not enough pennies in the chest.', 'info'); return; }
  Game.coin -= cost; c.spent = (c.spent || 0) + cost;
  Village.produce(k, got);
  toast(`Bought ${got} ${RES_WORD[k]} for ${cost} pennies.`, 'info');
}
function hireMasons() {
  const cost = 40;
  if ((Game.coin || 0) < cost) { toast('The masons want 40 pennies.', 'info'); return; }
  Game.coin -= cost; Game.masonsUntil = Game.time + 2 * 1440;
  const c = caravan(); if (c) c.spent = (c.spent || 0) + cost;
  chronicle('A crew of dwarf masons has been hired from the pedlar\'s wagon. For two days every building job goes twice as fast, and there\'s a great deal of singing about gold.', 'build');
}
const masonsOn = () => (Game.masonsUntil || 0) > Game.time;
// the masons' help
{
  const wp = ACTIONS.work_plan.tick;
  ACTIONS.work_plan.tick = (v, task, dt) => wp(v, task, masonsOn() ? dt * 2 : dt);
  const wpj = workProject;
  workProject = function (v, p) { const r = wpj(v, p); if (masonsOn() && Village.projects.includes(p)) wpj(v, p); return r; };
}

// --- The wagon in the square -----------------------------------------------------
function makeWagon() {
  const [c, x] = makeCanvas(52, 34);
  const R = (col, X, Y, W, H) => { x.fillStyle = col; x.fillRect(X, Y, W, H); };
  // the arched canvas cover, striped
  for (let i = 0; i < 26; i++) { const h = Math.round(Math.sqrt(1 - Math.pow((i - 12.5) / 13.5, 2)) * 9); R(Math.floor(i / 3) % 2 ? '#f4ead0' : '#c83a2a', 4 + i, 9 - h, 1, h + 5); }
  R('#a82a1e', 4, 13, 26, 1);
  // the bed of the wagon, with goods peeping out the back
  R('#7a5030', 2, 14, 30, 7); R('#9a6a40', 2, 14, 30, 1); R('#5a3a22', 2, 20, 30, 1);
  for (const [gx, col] of [[3, '#e8c24a'], [6, '#c83a2a'], [9, '#6a9a3a'], [12, '#f2c84a']]) R(col, gx, 11, 2, 3);
  // wheels
  for (const wx of [8, 25]) { x.fillStyle = '#3a2a1a'; x.beginPath(); x.arc(wx, 23, 5, 0, Math.PI * 2); x.fill(); x.fillStyle = '#8a6440'; x.beginPath(); x.arc(wx, 23, 3.5, 0, Math.PI * 2); x.fill(); R('#3a2a1a', wx - 3, 22.5, 7, 1); R('#3a2a1a', wx - 0.5, 20, 1, 7); R('#2a1c12', wx - 1, 22, 2, 2); }
  // shafts and the pony
  R('#5a3a22', 31, 17, 8, 1);
  R('#8a5a32', 36, 14, 11, 6); R('#a8703e', 36, 14, 11, 1); // body
  R('#8a5a32', 44, 9, 4, 7); R('#8a5a32', 46, 8, 5, 4); R('#2a1c12', 49, 9, 1, 1); R('#5a3a22', 44, 8, 2, 6); // neck, head, mane
  R('#2a1c12', 35, 14, 2, 4); // tail
  for (const lx of [37, 39, 44, 46]) R('#6a4428', lx, 20, 1, 6);
  R('#c8a46a', 38, 15, 6, 3); // harness blanket
  return outlineCanvas(c, OUTLINE);
}
function caravanSpot() {
  const m = World.marketSpot || { x: PLAZA.cx * 16, y: PLAZA.cy * 16 };
  for (const [dx, dy] of [[3, 2], [-3, 2], [3, -1], [-4, 0], [4, 0]]) { const tx = Math.floor(m.x / 16) + dx, ty = Math.floor(m.y / 16) + dy; if (walkable(tx, ty) && walkable(tx + 1, ty)) return [tx * 16 + 8, ty * 16 + 14]; }
  return [m.x + 40, m.y + 20];
}
function showCaravan(on) {
  if (!World._addStatic) return;
  if (!World.wagonStatic) { const [x, y] = caravanSpot(); World.wagonStatic = World._addStatic(makeWagon(), x, y, { snow: true }); }
  World.wagonStatic.hidden = !on;
}

// --- The Market tab ----------------------------------------------------------------
function marketHTML() {
  const c = caravan();
  let h = `<p class="lede-s">${Game.coin || 0} pennies in the village chest.${masonsOn() ? ' Dwarf masons are at work: building goes twice as fast.' : ''}</p>`;
  if (!c) {
    let d = Game.day + 1; while (!caravanDue(d)) d++;
    return h + `<p>No trader in the square today. The next wagon is due on <b>${weekday(d)}</b> (day ${d}), from eight in the morning till five.</p><p class="sub">Traders buy what the village can spare and sell what it's short of. Each wants a couple of things badly and pays half as much again for them.</p>`;
  }
  const t = TRADERS.find((x) => x.key === c.key);
  h += `<h3>${escapeHtml(t.name.charAt(0).toUpperCase() + t.name.slice(1))}, until five o'clock</h3><p class="sub">Paying well for <b>${c.wants.map((k) => RES_WORD[k]).join('</b> and <b>')}</b>. Prices drop as you sell more of a thing, and rise as you buy.</p>`;
  const need = Game.villagers.length * 2;
  h += '<div class="mk-grid"><div><h4>Sell</h4>';
  for (const k of t.buys) {
    const have = Math.floor(Village.stores[k] || 0), food = PANTRY_KINDS.includes(k) || k === 'grain';
    h += `<div class="mk-row${c.wants.includes(k) ? ' want' : ''}">${iconHTML(k === 'grain' ? 'grain' : k === 'leaf' ? 'leaf' : k === 'ale' ? 'mug' : k === 'wool' ? 'wool' : k === 'honey' ? 'honey' : k === 'apple' ? 'apple' : k === 'cheese' ? 'cheese' : k === 'fish' ? 'fish' : k === 'veg' ? 'veg' : k === 'bread' ? 'bread' : k === 'pie' ? 'pie' : k === 'cake' ? 'cake' : k === 'herbs' ? 'herb' : k === 'stew' ? 'stew' : 'sack')}<span>${RES_WORD[k]}</span><span class="sub">${have}${food && Village.foodTotal() < need ? ' ⚠' : ''}</span><span class="mk-p">${sellPrice(k).toFixed(1)}p</span><button data-sell="${k}" data-n="5" ${have < 1 ? 'disabled' : ''}>Sell 5</button><button data-sell="${k}" data-n="20" ${have < 1 ? 'disabled' : ''}>20</button></div>`;
  }
  h += '</div><div><h4>Buy</h4>';
  for (const k of t.sells) h += `<div class="mk-row">${iconHTML(k === 'wood' ? 'wood' : k === 'remedy' ? 'remedy' : k === 'scrap' ? 'chip' : k === 'cheese' ? 'cheese' : k === 'honey' ? 'honey' : k === 'egg' ? 'egg' : k === 'apple' ? 'apple' : k === 'flour' ? 'flour' : 'sack')}<span>${RES_WORD[k]}</span><span class="sub">${Math.floor(Village.stores[k] || 0)}</span><span class="mk-p">${buyPrice(k).toFixed(1)}p</span><button data-buy="${k}" data-n="5" title="About ${Math.round(buyPrice(k) * 5)}p">Buy 5</button><button data-buy="${k}" data-n="20" title="About ${Math.round(buyPrice(k) * 20 * 1.3)}p">20</button></div>`;
  if (t.masons) h += `<div class="mk-row"><span>⚒</span><span>Dwarf masons, two days</span><span></span><span class="mk-p">40p</span><button id="mk-masons" ${masonsOn() ? 'disabled' : ''}>Hire</button></div>`;
  h += '</div></div>';
  if (Village.foodTotal() < need) h += '<p class="sub">⚠ The Store is low on food: think twice before selling it.</p>';
  return h;
}
window.addEventListener('DOMContentLoaded', () => {
  const rv = renderVillage;
  renderVillage = function () {
    if (Game.villageTab === 'market') {
      document.querySelectorAll('#village .tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'market'));
      const body = $('village-body');
      body.innerHTML = marketHTML();
      hydrateIcons(body);
      body.querySelectorAll('[data-sell]').forEach((b) => b.addEventListener('click', () => { sell(b.dataset.sell, +b.dataset.n); renderVillage(); }));
      body.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => { buy(b.dataset.buy, +b.dataset.n); renderVillage(); }));
      const m = $('mk-masons'); if (m) m.addEventListener('click', () => { hireMasons(); renderVillage(); });
      return;
    }
    return rv();
  };
  const oh = onHour;
  onHour = function (h) {
    const r = oh(h);
    if (h === 8 && caravanDue(Game.day) && !caravan()) arriveCaravan();
    if (h >= 17 && caravan()) leaveCaravan();
    return r;
  };
  const nv = newVillage;
  newVillage = function () { Game.caravan = null; Game.masonsUntil = 0; World.wagonStatic = null; return nv(); };
});
