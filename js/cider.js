'use strict';
// ---------------------------------------------------------------------------
// Cider: a second drink, and a choice for the apple crop. Brewers press
// surplus apples into cider at the brewhouse (3 apples make 5 pints), the
// taproom pours it when the ale runs out, and the caravans pay well for it.
// Apples now go either into pies or into cider: the Economy board shows both.
// ---------------------------------------------------------------------------

RES_INFO.cider = { label: 'Cider', icon: 'mug' };
if (!STORE_KEYS.includes('cider')) STORE_KEYS.push('cider');
STORE_CAP.cider = 60;
PRICE.cider = 4;
RES_WORD.cider = 'cider';
ECON_GOODS.splice(ECON_GOODS.indexOf('ale') + 1, 0, 'cider');
CHAINS.push({ from: 'apple', to: 'cider', job: 'brewer', say: 'Apples are piling up and the cider barrels are empty: more brewers' });
for (const t of TRADERS) if (t.key === 'dwarf' || t.key === 'bree') { t.buys.push('cider'); if (t.key === 'dwarf') t.wants.push('cider'); }

ACTIONS.work_cider = {
  id: 'work_cider', label: 'Pressing cider', icon: 'apple', sat: { industry: -0.45, bored: -0.2 }, dur: 60, pose: 'inside', job: 'brewer', skill: 'brewing',
  // only from apples the bakers can spare
  avail: () => (Village.stores.apple || 0) >= 10 && (Village.stores.cider || 0) < storeCap('cider'),
  time: (h) => workHours(h, 8, 18),
  extra: () => 0.05 + ((Village.stores.apple || 0) > 30 ? 0.12 : 0),
  target: () => ({ building: World.buildings.brewhouse }),
  done: (v) => { Village.use('apple', 3); Village.produce('cider', Math.round(5 * v.skillMul('brewing'))); },
};
ACTION_NAMES.work_cider = 'Pressing cider';
// the taproom pours cider when the ale is gone
{
  const ale = ACTIONS.ale, av = ale.avail, st = ale.start;
  ale.avail = (v, h) => av(v, h) || (policy('ale') !== 'dry' && (Village.stores.cider || 0) >= 1);
  ale.start = function (v, task) {
    if ((Village.stores.ale || 0) < 1 && (Village.stores.cider || 0) >= 1) { Village.use('cider', 1); task.data.cider = true; if (R.chance(0.3)) v.say(R.pick(['Cider tonight, is it? Lovely.', 'Ooh, apple cider!']), 2.4); return true; }
    return st ? st.call(this, v, task) : true;
  };
}
