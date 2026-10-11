'use strict';
// ---------------------------------------------------------------------------
// Mathoms: anything a hobbit has no use for but can't bring themselves to
// throw away. Every hole has a few (a chipped blue teapot, a clock that runs
// backwards, a vase shaped like a frog), and the trouble with birthdays, where
// it's the birthday hobbit who gives the presents, is that many of those
// presents are mathoms, given on. Some have been round the whole village and
// come back again. Travellers bring new ones home from their adventures.
// ---------------------------------------------------------------------------

const MATHOM_ADJ = ['chipped', 'odd', 'lopsided', 'faded', 'dented', 'one-eared', 'mysterious', 'slightly singed', 'rather ugly', 'enormous', 'tiny', 'tarnished', 'much-mended', 'cracked'];
const MATHOM_THING = ['blue teapot', 'umbrella stand', 'brass doorknob', 'pewter mug', 'clock that runs backwards', 'vase shaped like a frog', 'fire-screen', 'pair of bookends', 'toast rack', 'bird cage', 'embroidered cushion', 'tea cosy', 'barometer', 'wooden duck', 'hat-stand', 'pickle fork', 'music box', 'painted plate', 'candlestick', 'gravy boat', 'paperweight', 'pipe-rack', 'egg-timer', 'bellows'];
function newMathom(home, origin = 'old') {
  Game.mathoms = Game.mathoms || [];
  const m = { id: (Game.mathomSeq = (Game.mathomSeq || 0) + 1), name: `${R.pick(MATHOM_ADJ)} ${R.pick(MATHOM_THING)}`, home: home.id, passed: 0, homes: [home.id], origin };
  Game.mathoms.push(m);
  return m;
}
function mathomsAt(h) { return (Game.mathoms || []).filter((m) => m.home === h.id); }
const aAn = (s) => (/^[aeiou]/i.test(s) ? 'an ' : 'a ') + s;

// a present might well be a mathom, given on
{
  const pf = presentFor;
  presentFor = function (giver, to) {
    const home = giver.homeId >= 0 ? giver.home() : null;
    const ms = home ? mathomsAt(home).filter((m) => m.home !== to.homeId) : [];
    if (to.isGrown() && ms.length && R.chance(0.45)) {
      // the one they've had longest, or least like
      const m = R.pick(ms);
      m.home = to.homeId; m.passed++;
      if (!m.homes.includes(to.homeId)) m.homes.push(to.homeId);
      const back = m.passed > 1 && m.homes.length < m.passed + 1;
      if (m.passed === 5 || (back && R.chance(0.3))) chronicle(`The ${m.name} has been given as a birthday present ${m.passed === 5 ? 'for the fifth time' : 'again, and has ended up back at ' + to.home().name}. Nobody has ever used it.`, 'info');
      return `${aAn(m.name)} (a mathom${m.passed > 1 ? `, given on ${m.passed} times now` : ''})`;
    }
    return pf(giver, to);
  };
}
window.addEventListener('DOMContentLoaded', () => {
  // every hole starts with a few
  const nv = newVillage;
  newVillage = function () {
    Game.mathoms = []; Game.mathomSeq = 0;
    const r = nv();
    for (const h of World.homes) if (h.built) for (let i = R.i(1, 3); i > 0; i--) newMathom(h);
    return r;
  };
  // adventurers come home with oddments
  const rt = returnFromTrip;
  returnFromTrip = function (entry) {
    const r = rt(entry);
    const v = Game.villagers.find((o) => o.id === entry.id);
    if (v && v.homeId >= 0 && R.chance(0.7)) { const m = newMathom(v.home(), 'trip'); m.name = R.pick(['carved troll', 'foreign coin on a string', 'dwarvish spoon', 'jar of sand from far away', 'mannikin of a Big Person', 'elvish-looking lamp']); v.remember(`Brought home ${aAn(m.name)} for the mantelpiece.`, 1); }
    return r;
  };
});
