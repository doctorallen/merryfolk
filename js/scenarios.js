'use strict';
// ---------------------------------------------------------------------------
// Scenarios (SimCity's scenarios, Banished's starting conditions): chosen on
// the Shape your valley screen, each with its own conditions and a goal.
// Meet the goal and the village is honoured; miss it and you simply play on.
// ---------------------------------------------------------------------------

const SCENARIOS = {
  gentle: { name: 'A Gentle Start', desc: 'A well-stocked village in easy country. Goal: become a Village.', goal: () => era() >= 1, goalText: 'Become a Village', by: null },
  winter: { name: 'The Long Winter', desc: 'Every winter brings a hard frost, longer than most, and the Store starts lean. Goal: become a Village and see the village through its first winter.', goal: () => era() >= 1 && yearOf(Game.day) >= 2, goalText: 'Become a Village and see out the first winter', by: 2 },
  flood: { name: 'The Flood Plain', desc: 'A wild, meandering river on damp ground: it floods almost every spring. Goal: become a Market Town by the end of year two.', goal: () => era() >= 2, goalText: 'Become a Market Town', by: 3, gen: { river: 'meandering', wet: 'damp' } },
  hard: { name: 'Hard Times', desc: 'The Store is nearly bare, the chest is empty, and spirits are low. Goal: become a Market Town by the end of year two.', goal: () => era() >= 2, goalText: 'Become a Market Town', by: 3 },
  open: { name: 'The Open Valley', desc: 'No goal, no clock: just Thistledown.', goal: null },
};
MOODLETS.hard_times = ['Hard times', -0.1, 2880, ['Times are hard.', 'Tighten your belts, they say.']];
function scenario() { return (World.gen && World.gen.scenario) || 'open'; }

// on the setup screen
window.addEventListener('DOMContentLoaded', () => {
  const rws = renderWorldSetup;
  renderWorldSetup = function () {
    rws();
    const c = GenUI.cfg;
    if (!c.scenario) c.scenario = 'gentle';
    const box = $('wg-opts');
    const row = document.createElement('div');
    row.className = 'wg-row wg-scen';
    row.innerHTML = `<span class="wg-label">Scenario</span><div><div class="wg-seg">${Object.entries(SCENARIOS).map(([k, S]) => `<button data-scen="${k}" class="${c.scenario === k ? 'on' : ''}">${S.name}</button>`).join('')}</div><div class="sub">${SCENARIOS[c.scenario].desc}</div></div>`;
    box.prepend(row);
    row.querySelectorAll('[data-scen]').forEach((b) => b.addEventListener('click', () => { c.scenario = b.dataset.scen; Object.assign(c, SCENARIOS[c.scenario].gen || {}); renderWorldSetup(); }));
  };
  // starting conditions
  const nv = newVillage;
  newVillage = function () {
    const r = nv();
    const k = scenario();
    Game.scenarioDone = false;
    if (k === 'winter') { for (const f of ['bread', 'veg', 'fish', 'apple', 'pie', 'cake', 'egg', 'cheese']) Village.stores[f] = Math.floor((Village.stores[f] || 0) * 0.6); }
    if (k === 'hard') { for (const f in Village.stores) Village.stores[f] = Math.floor((Village.stores[f] || 0) * 0.4); Game.coin = 0; for (const v of Game.villagers) if (v.stage !== 'baby') feel(v, 'hard_times'); }
    if (k !== 'open') setTimeout(() => chronicle(`Scenario: ${SCENARIOS[k].name}. ${SCENARIOS[k].desc}`, 'season'), 200);
    return r;
  };
  // harsher seasons
  const ph = planHazard;
  planHazard = function () {
    const k = scenario();
    if ((k === 'winter' && World.season === 'winter') || (k === 'flood' && World.season === 'spring')) {
      if (Game.hazard || Game.day < 4) return;
      const key = seasonIdx(Game.day) + yearOf(Game.day) * 4;
      if (Game.hazardSeasonDone === key) return;
      Game.hazardSeasonDone = key;
      const hk = k === 'winter' ? 'frost' : 'flood';
      Game.hazard = { k: hk, state: 'warned', start: Game.day + 1, end: Game.day + 1 + HAZARDS[hk].days + (k === 'winter' ? 1 : 0) };
      chronicle(`⚠ ${HAZARDS[hk].warn}`, 'sick');
      return;
    }
    return ph();
  };
  // the goal
  const oh = onHour;
  onHour = function (h) {
    const r = oh(h);
    const S = SCENARIOS[scenario()];
    if (S && S.goal && !Game.scenarioDone) {
      if (S.goal()) { Game.scenarioDone = 'won'; Game.renown = (Game.renown || 0) + 50; chronicle(`🏆 Scenario complete: ${S.name}! ${S.goalText}: done. The whole Shire is talking about Thistledown. (+50 renown)`, 'party'); toast(`Scenario complete: ${S.name}!`, 'party'); for (const v of Game.villagers) if (v.stage !== 'baby') feel(v, 'era', 'village to be proud of'); }
      else if (S.by && yearOf(Game.day) >= S.by) { Game.scenarioDone = 'missed'; chronicle(`The scenario's goal (${S.goalText.toLowerCase()}) slipped by. No matter: Thistledown goes on, and so do you.`, 'info'); }
    }
    return r;
  };
  // shown on the Charter
  const ch = charterHTML;
  charterHTML = function () {
    const S = SCENARIOS[scenario()];
    const top = S && S.goal ? `<div class="note"><b>${S.name}.</b> Goal: ${S.goalText}${S.by ? ` by the end of year ${S.by - 1}` : ''}. ${Game.scenarioDone === 'won' ? '🏆 Done!' : Game.scenarioDone === 'missed' ? 'Missed, but play on.' : `It's now year ${yearOf(Game.day)}.`}</div>` : '';
    return top + ch();
  };
});
