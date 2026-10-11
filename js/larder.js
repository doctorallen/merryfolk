'use strict';
// ---------------------------------------------------------------------------
// Putting by for winter. Nothing much grows in the cold months, so in autumn
// every household that can puts food by: apples bottled into jam and dried,
// vegetables pickled, fish smoked and packed in salt. The jars go on the top
// pantry shelf and never spoil. Through the winter, when the pantry runs low,
// a jar or two comes down. A hole that went into winter with full shelves
// rests easy; one with bare shelves worries.
// ---------------------------------------------------------------------------

const JAR_KINDS = { apple: ['jar of bramble-apple jam', 'jars of bramble-apple jam', '#b8402a', 'bottling apple jam'], veg: ['jar of pickles', 'jars of pickles', '#6a8a2a', 'pickling vegetables'], fish: ['side of smoked fish', 'sides of smoked fish', '#b88a4a', 'smoking fish'] };
const JAR_CAP = (h) => (h.grand ? 36 : 24);
function jarsOf(h) { return h.jars || (h.jars = {}); }
function jarsTotal(h) { return Object.values(jarsOf(h)).reduce((s, n) => s + n, 0); }
const puttingBySeason = () => World.season === 'autumn' || (World.season === 'summer' && dayOfSeason(Game.day) === SEASON_DAYS);
// what's to hand to put by: the house's own first, then a fair share from the Store
function putBySource(v) {
  const home = v.home();
  for (const k in JAR_KINDS) if ((home.pantry[k] || 0) > 1) return { k, from: 'home' };
  const share = Math.max(1, Math.floor(Game.villagers.length / 6));
  const ks = Object.keys(JAR_KINDS).filter((k) => (Village.stores[k] || 0) > share * 3);
  return ks.length ? { k: R.pick(ks), from: 'store' } : null;
}

ACTIONS.put_by = {
  id: 'put_by', label: 'Putting food by for winter', icon: 'cup', sat: { industry: -0.3, bored: -0.25 }, dur: 45, pose: 'inside', stages: ADULT, skill: 'cooking',
  label2: (v) => (v.task && v.task.data.k ? `Putting by for winter: ${JAR_KINDS[v.task.data.k][3]}` : 'Putting food by for winter'),
  avail: (v) => puttingBySeason() && v.homeId >= 0 && jarsTotal(v.home()) < JAR_CAP(v.home()) && !!putBySource(v),
  // keener the barer the shelves, and more so for the careful sort
  extra: (v) => 0.7 * (1 - jarsTotal(v.home()) / JAR_CAP(v.home())) + 0.1,
  trait: (v) => 0.6 + (1 - v.genes.laziness) * 0.7,
  time: (h) => (h >= 9 && h < 19 ? 1 : 0.02),
  target: (v) => ({ building: v.home() }),
  start: (v, task) => { const s = putBySource(v); if (!s) return false; task.data.k = s.k; task.data.from = s.from; return true; },
  done: (v, task) => {
    const home = v.home(), { k, from } = task.data, J = jarsOf(home);
    let n = 0;
    for (let i = 0; i < 4 && jarsTotal(home) < JAR_CAP(home); i++) {
      if (from === 'home' && (home.pantry[k] || 0) > 1) home.pantry[k]--;
      else if (from === 'store' && (Village.stores[k] || 0) > 0) Village.use(k, 1);
      else break;
      n++;
    }
    // a skilled cook gets an extra jar out of it
    if (n && R.chance((v.skills.cooking || 0) / 120)) n++;
    J[k] = (J[k] || 0) + n;
    if (n && R.chance(0.15)) v.say(R.pick(['That\'s another for the top shelf.', 'Let the snow come!', 'Mind the jars, they\'re hot.']), 2.5);
  },
};
ACTION_NAMES.put_by = 'Putting by';
HABIT_KEYS.push('put_by');

// In winter, when the pantry runs low, jars come down off the shelf.
function openJars() {
  if (World.season !== 'winter' && !(World.season === 'autumn' && dayOfSeason(Game.day) === SEASON_DAYS)) return;
  for (const h of World.homes) {
    if (!h.built || !h.jars) continue;
    const res = residentsOf(h).length;
    if (!res) continue;
    let want = res * 2 - pantryTotal(h);
    for (const k in JAR_KINDS) {
      while (want > 0 && (h.jars[k] || 0) > 0) { h.jars[k]--; h.pantry[k] = (h.pantry[k] || 0) + 1; want--; }
    }
  }
}
function winterReckoning() {
  let full = 0, bare = 0;
  for (const h of World.homes) {
    if (!h.built) continue;
    const res = residentsOf(h).filter((v) => v.isGrown());
    if (!res.length) continue;
    const per = jarsTotal(h) / residentsOf(h).length;
    if (per >= 3) { full++; for (const v of res) feel(v, 'larder_full'); }
    else if (per < 1) { bare++; for (const v of res) feel(v, 'larder_bare'); }
  }
  chronicle(`Winter is in. ${full ? `${full} hole${full > 1 ? 's go' : ' goes'} into it with shelves full of jam, pickles and smoked fish` : 'Hardly anyone has put much by'}${bare ? `, and ${bare} ${bare > 1 ? 'have' : 'has'} worryingly bare shelves` : ''}.`, full >= bare ? 'season' : 'sick');
}

window.addEventListener('DOMContentLoaded', () => {
  const oh = onHour;
  onHour = function (h) {
    const r = oh(h);
    if (h === 6) openJars();
    if (h === 7 && dayOfSeason(Game.day) === 1 && World.season === 'autumn') chronicle('Autumn, and the putting-by has begun: every kitchen smells of jam and vinegar.', 'season');
    if (h === 8 && dayOfSeason(Game.day) === 1 && World.season === 'winter') winterReckoning();
    return r;
  };
  // the jars on the top shelf of the pantry
  const dp = drawPantry;
  drawPantry = function (L, it) {
    dp(L, it);
    const J = L.h.jars;
    if (!J) return;
    const x0 = it.x, w = it.w, sy = WALL_B - 60;
    const list = [];
    for (const k in JAR_KINDS) for (let i = 0; i < Math.min(J[k] || 0, 12); i++) list.push(k);
    if (!list.length) return;
    IR(x0, sy, w, 2, L.pal.l); IR(x0, sy, w, 1, L.pal.h);
    let cx = x0 + 3;
    for (const k of list) {
      if (cx + 4 > x0 + w - 2) break;
      if (k === 'fish') { IR(cx, sy - 7, 3, 7, '#b88a4a'); IR(cx, sy - 7, 3, 1, '#8a5e2a'); IP(cx + 1, sy - 8, '#5a3a22'); }
      else { IR(cx, sy - 5, 4, 5, JAR_KINDS[k][2]); IR(cx, sy - 6, 4, 1, '#f4ead0'); IP(cx, sy - 4, '#ffffff'); IR(cx, sy - 7, 4, 1, '#c8c0b0'); }
      cx += 5;
    }
  };
  const ik = interiorKey;
  interiorKey = function (h) { return ik(h) + '|' + JSON.stringify(h.jars || {}); };
});
