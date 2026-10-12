'use strict';
// ---------------------------------------------------------------------------
// Balance: making the giant hand's gifts real, and the numbers honest.
//
// The gifts on the toolbar come out of somewhere now: a seed-cake, a keg, a
// pouch of leaf or a remedy is taken from the Common Store (and can't be given
// if there's none), a storybook or a patch of flowers costs a few pennies, and
// fireworks cost coin, with a party at most every other night. The Steward's
// policies are felt in full rather than lost under the cap on other feelings,
// the rations forecast matches how folk really eat, and the desk warns when
// hands in a trade are standing idle. And a Shire Town holds a Great Fair at
// every festival.
// ---------------------------------------------------------------------------

const GIFT_COST = { cake: ['cake', 1], ale: ['ale', 6], leaf: ['leaf', 3], remedy: ['remedy', 1], book: ['coin', 3], flowers: ['coin', 1], firework: ['coin', 8] };
function giftCostWord(tool) { const c = GIFT_COST[tool]; return c ? (c[0] === 'coin' ? `${c[1]} pennies` : `${c[1]} ${RES_WORD[c[0]] || c[0]} from the Store`) : ''; }
function canAfford(tool) { const c = GIFT_COST[tool]; if (!c) return true; return c[0] === 'coin' ? (Game.coin || 0) >= c[1] : (Village.stores[c[0]] || 0) >= c[1]; }
function payGift(tool) { const c = GIFT_COST[tool]; if (!c) return; if (c[0] === 'coin') Game.coin -= c[1]; else Village.use(c[0], c[1]); }

// the policies are felt in full, outside the cap on other feelings
const POLICY_FEELINGS = new Set(['Short rations', 'Generous helpings', 'Feasting every day', 'The taproom\'s gone dry', 'The ale\'s flowing', 'An easy week', 'All work and no play']);
feelingsLift = function (v) {
  let rest = 0, pol = 0;
  for (const f of feelingsOf(v)) { if (!f[3] && POLICY_FEELINGS.has(f[0])) pol += f[1]; else rest += f[1]; }
  return clamp(rest, -MOOD_SWAY, MOOD_SWAY) + pol;
};

// charters that can't be met, or are met already
CHARTER_KINDS.ale.size = [40, 55, 65];
CHARTER_KINDS.lamps.size = [2, 4, 6];
CHARTER_KINDS.lamps.text = (n) => `Put up ${n} new lamp-posts for the lamplighter`;
CHARTER_KINDS.lamps.val = (c) => World.lamps.length - (c.lampBase ?? World.lamps.length);
// letters ever delivered, so progress never slips back when someone leaves
CHARTER_KINDS.letters.val = () => Game.stats.letters || 0;
{
  const dl = deliverLetters;
  deliverLetters = function (home, by) { const n = dl(home, by); Game.stats.letters = (Game.stats.letters || 0) + n; return n; };
}
{
  const nc = newCharter;
  newCharter = function (skip) { const c = nc(skip); if (c && c.k === 'lamps') c.lampBase = World.lamps.length; return c; };
}

// trades with nothing to do
function idleTrade(j) {
  const worker = Game.villagers.find((v) => v.job === j && !v.leaving) || Game.villagers.find((v) => v.isGrown());
  if (!worker) return false;
  const acts = Object.values(ACTIONS).filter((a) => a.job === j || (a.jobs && a.jobs.includes(j)));
  if (!acts.length) return false;
  const h = 11;
  return !acts.some((a) => !a.avail || a.avail(worker, h));
}
const IDLE_WHY = { miller: 'the flour bins are full', baker: 'the bread shelves are full', brewer: 'the ale cellar is full', fisher: 'the fish are not biting', woodwright: 'nothing to build or fell', farmer: 'nothing to sow or reap just now', herbalist: 'no one is poorly and the herbs are in', orchardist: 'nothing to pick yet', herder: 'the animals are tended', grower: 'the leaf field is resting', postie: 'no letters in the bag', tinker: 'nothing to salvage or fix' };

window.addEventListener('DOMContentLoaded', () => {
  for (const t of TOOLS) if (GIFT_COST[t.id]) t.hint += ` (Costs ${giftCostWord(t.id)}.)`;
  const hc = handleClick;
  handleClick = function (sx, sy) {
    const tool = Game.tool;
    if (tool !== 'hand' && GIFT_COST[tool]) {
      if (!canAfford(tool)) { toast(`You can't: that takes ${giftCostWord(tool)}, and there isn't enough.`, 'info'); return; }
      if (tool === 'firework' && Game.lastFireworkParty === Game.day) {
        // fireworks are fine, but only one party a night
        const [wx, wy] = screenToWorld(sx, sy);
        if (Math.hypot(wx / 16 - PARTY.cx, (wy / 16 - PARTY.cy) * 1.4) < 10) { payGift(tool); fireworkShow(wx, wy, R.i(3, 5)); toast('Lovely fireworks, but folk have partied enough for one night.', 'info'); return; }
      }
      const before = JSON.stringify([World.items.length, Game.planted.length, Game.party.on, Game.fireworks && Game.fireworks.until]);
      const sel = Game.selected && Game.selected.isSick();
      hc(sx, sy);
      const after = JSON.stringify([World.items.length, Game.planted.length, Game.party.on, Game.fireworks && Game.fireworks.until]);
      const cured = tool === 'remedy' && sel && Game.selected && !Game.selected.isSick();
      if (before !== after || cured || (tool === 'remedy' && Game.selected)) {
        payGift(tool);
        if (tool === 'firework' && Game.party.on && Game.party.reason === 'fireworks') Game.lastFireworkParty = Game.day;
      }
      return;
    }
    return hc(sx, sy);
  };
  // honest forecast, idle trades on the desk
  const sh = stewardHTML;
  stewardHTML = function () {
    let h = sh();
    h = h.replace(/\{ lean: 0\.6/, '{ lean: 0.77');
    return h;
  };
  const hook = hookStewardUI;
  hookStewardUI = function (body) {
    body.querySelectorAll('.st-job').forEach((row) => {
      const b = row.querySelector('[data-job]'); if (!b) return;
      const j = b.dataset.job;
      if ((jobCounts()[j] || 0) > 0 && idleTrade(j)) { const w = document.createElement('span'); w.className = 'st-idle'; w.textContent = '⚠ idle'; w.title = `Hands standing idle: ${IDLE_WHY[j] || 'nothing for them to do'}. Move some elsewhere, or trade away the surplus.`; row.appendChild(w); }
    });
    return hook(body);
  };
  // a Great Fair at every festival, once a Shire Town
  const cs = checkSeason;
  checkSeason = function (announce) {
    const fd = Game.festivalDay;
    const r = cs(announce);
    if (announce && Game.festivalDay !== fd && era() >= 3) {
      chronicle('It\'s the Great Fair of Thistledown! Folk have come from all over the Shire: stalls, contests, a caravan in the square and music till late. (+10 renown)', 'party');
      Game.renown = (Game.renown || 0) + 10; Game.fairDay = Game.day;
    }
    return r;
  };
  addHook('onHour', (h) => {
    if (Game.fairDay === Game.day && h === 9 && !caravan()) arriveCaravan();
    if (Game.fairDay === Game.day && h === 14) holdContests('Great Fair');
  });
});
