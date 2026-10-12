'use strict';
// ---------------------------------------------------------------------------
// The Almanac: a report at the turn of each season (SimCity's yearly budget
// report, Stronghold's popularity breakdown). How many folk came and went,
// how contented the village was, what the Store made and used, coin earned,
// charters met and things built, the season's best stories, and a few words
// of advice from the Steward's clerk about what to see to next.
// ---------------------------------------------------------------------------

function almanacSnapshot() {
  return {
    day: Game.day, season: World.season, year: yearOf(Game.day), pop: Game.villagers.length, births: Game.stats.births || 0, weddings: Game.stats.weddings || 0,
    departed: Object.keys(Game.archive || {}).length, coin: Game.coin || 0, renown: Game.renown || 0, charters: Game.chartersDone || 0, built: (Game.planDone || []).length,
    sold: Game.stats.sold || 0, logLen: Game.logCount || 0, made: {}, used: {},
  };
}
// keep a running total of what's made and used this season
{
  const pr = Village.produce, us = Village.use;
  Village.produce = function (res, n, priv) { pr.call(this, res, n, priv); const a = Game.almanac; if (a && n > 0) a.made[res] = (a.made[res] || 0) + n; };
  Village.use = function (res, n, priv) { us.call(this, res, n, priv); const a = Game.almanac; if (a && n > 0) a.used[res] = (a.used[res] || 0) + n; };
}
function almanacReport() {
  const a = Game.almanac;
  if (!a) return null;
  const n = almanacSnapshot();
  const contentLog = (Game.contentLog || []).slice(-SEASON_DAYS);
  const avg = contentLog.length ? Math.round(contentLog.reduce((s, x) => s + x, 0) / contentLog.length) : contentment();
  const food = PANTRY_KINDS.concat(['stew']);
  const madeFood = food.reduce((s, k) => s + (a.made[k] || 0), 0), usedFood = food.reduce((s, k) => s + (a.used[k] || 0), 0);
  const stories = Game.log.filter((l) => l.day >= a.day && ['love', 'birth', 'adventure', 'rift', 'party', 'learn'].includes(l.kind)).map((l) => l.text).slice(0, 40);
  const pick = stories.filter((t) => t.length < 200).sort(() => Math.random() - 0.5).slice(0, 3);
  const advice = [];
  const nextSeason = SEASONS[(seasonIdx(Game.day)) % 4];
  const jarsPer = World.homes.reduce((s, h) => s + (h.built && typeof jarsTotal === 'function' ? jarsTotal(h) : 0), 0) / Math.max(1, Game.villagers.length);
  if (nextSeason === 'Winter' && jarsPer < 3) advice.push(`Winter is coming and there are only ${jarsPer.toFixed(1)} jars put by per head. Lean rations, or buying food from the caravans, may be wise.`);
  if (avg < 50) advice.push('Spirits were low. Generous rations, flowing ale, an easy week, or something lovely built near people\'s homes would lift them.');
  if (usedFood > madeFood * 1.2) advice.push(`The village ate ${usedFood - madeFood} more helpings than it made. More hands on the farms, fishing and baking would help (see the Workforce on the Steward's Desk).`);
  if ((Village.stores.wood || 0) < 20) advice.push('Timber is short: more woodwrights, or buy timber from the Bree carter.');
  if (requestsList && requestsList().length >= 2) advice.push(`${requestsList().length} notes are waiting on the notice board. Answering them earns renown.`);
  if (typeof eraReady === 'function' && eraReady(era() + 1)) advice.push(`Everything's ready for Thistledown to become a ${ERAS[era() + 1].name}: call a Moot from the Charter tab.`);
  if (!advice.length) advice.push('All\'s well. Keep the charters coming and the larders full.');
  return {
    title: `The Almanac: ${a.season.charAt(0).toUpperCase() + a.season.slice(1)}, Year ${a.year}`,
    rows: [
      ['Folk', `${n.pop} (${n.pop - a.pop >= 0 ? '+' : ''}${n.pop - a.pop})`],
      ['Born · wed · left', `${n.births - a.births} · ${n.weddings - a.weddings} · ${n.departed - a.departed}`],
      ['Contentment', `${avg}% on average`],
      ['Food made · eaten', `${madeFood} · ${usedFood}`],
      ['Coin', `${n.coin} pennies (${n.coin - a.coin >= 0 ? '+' : ''}${n.coin - a.coin})`],
      ['Renown', `${n.renown} (+${n.renown - a.renown})`],
      ['Charters met', `${n.charters - a.charters}`],
      ['Things you built', `${n.built - a.built}`],
    ],
    stories: pick, advice,
  };
}
function showAlmanac(rep) {
  if (!rep) return;
  Game.lastAlmanac = rep;
  const el = $('moot');
  el.querySelector('h2').textContent = rep.title;
  el.querySelector('.moot-text').innerHTML = `<div class="alm-grid">${rep.rows.map(([k, v]) => `<div><span class="sub">${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join('')}</div>${rep.stories.length ? `<h3>The season's stories</h3><ul class="alm-list">${rep.stories.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}<h3>The clerk advises</h3><ul class="alm-list">${rep.advice.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`;
  const box = el.querySelector('.moot-opts');
  box.innerHTML = '';
  const b = document.createElement('button');
  b.className = 'moot-opt'; b.innerHTML = '<b>Onward</b><span>On into the new season.</span>';
  b.addEventListener('click', () => { el.hidden = true; Game.introOpen = false; });
  box.appendChild(b);
  el.hidden = false; Game.introOpen = true;
}
window.addEventListener('DOMContentLoaded', () => {
  const cs = checkSeason;
  checkSeason = function (announce) {
    const before = World.season;
    const r = cs(announce);
    if (announce && World.season !== before && Game.started) {
      const rep = almanacReport();
      Game.almanac = almanacSnapshot();
      if (rep) setTimeout(() => queueMoot(() => showAlmanac(rep), 'almanac'), 30);
    }
    if (!Game.almanac) Game.almanac = almanacSnapshot();
    return r;
  };
  addHook('afterNewVillage', () => { Game.almanac = almanacSnapshot(); });
  // the last report is kept on the Census tab
  const vc = villageCensus;
  villageCensus = function () {
    const rep = Game.lastAlmanac;
    return vc() + (rep ? `<h3>${escapeHtml(rep.title)}</h3><div class="alm-grid">${rep.rows.map(([k, v]) => `<div><span class="sub">${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join('')}</div><ul class="alm-list">${rep.advice.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : '');
  };
});
