'use strict';
// ---------------------------------------------------------------------------
// Values: the two things each hobbit holds dear, handed down from their
// parents (with the odd one picked up from nowhere). Thrift, merrymaking, the
// old ways, learning, family, craft, the green valley, or tidiness. A value
// leans them towards what serves it, warms them to folk who share it and
// cools them a little to folk who hold the opposite, and makes them glad or
// vexed when the Steward and the Moot decide things. Numbers in TUNE.values.
// ---------------------------------------------------------------------------

const VALUES = {
  thrift: { label: 'Thrift', say: 'waste not, want not', acts: ['put_by', 'garden', 'forage', 'bake_home', 'eat_home'], clash: 'merriment', faction: 'crafts' },
  merriment: { label: 'Merrymaking', say: 'a village that sings together', acts: ['party', 'ale', 'fiddle', 'gather', 'play', 'eat_inn', 'swing', 'market'], clash: 'thrift', faction: 'young' },
  tradition: { label: 'The old ways', say: 'what was good enough for my grandmother', acts: ['work_story', 'visit_stone', 'tea', 'eat_home', 'school'], clash: 'learning', faction: 'elders' },
  learning: { label: 'Learning', say: 'a mind is for filling', acts: ['read', 'read_item', 'school', 'lesson', 'apprentice', 'write_letter'], clash: 'tradition', faction: 'rift' },
  kin: { label: 'Family', say: 'blood and the hearth', acts: ['eat_home', 'tend_baby', 'gift', 'cradle', 'bake_home', 'write_letter'], clash: null, faction: 'kids' },
  craft: { label: 'Craft', say: 'a thing well made', acts: ['hobby_carving', 'hobby_basketry', 'hobby_pottery', 'hobby_knitting', 'hobby_painting', 'build', 'work_wood', 'bake_home'], clash: null, faction: 'crafts' },
  nature: { label: 'The green valley', say: 'the trees and the river', acts: ['fish', 'forage', 'garden', 'stroll', 'hobby_birdwatching', 'nap', 'watch'], clash: 'order', faction: 'farmers' },
  order: { label: 'Tidiness', say: 'a place for everything', acts: ['potter', 'put_by', 'work_odd', 'market'], clash: 'nature', faction: null },
};
const VALUE_KEYS = Object.keys(VALUES);
// which value a Moot's tradition speaks to
const TRAD_VALUE = { farming: 'nature', building: 'craft', merry: 'merriment', commerce: 'thrift', learning: 'learning', hospitality: 'kin', renown: 'merriment', tidiness: 'order', outdoors: 'nature' };

// How a value sits with a nature: the leaning each gene gives it.
function valueLeanings(v) {
  const g = v.genes, h = (k) => hash2(v.id * 31 + k, 11) * 0.25;
  return {
    thrift: (1 - g.laziness) * 0.5 + (1 - g.appetite) * 0.4 + h(0),
    merriment: g.merriness * 0.7 + g.sociability * 0.3 + h(1),
    tradition: (1 - g.curiosity) * 0.6 + (v.stage === 'elder' ? 0.3 : 0) + h(2),
    learning: g.curiosity * 0.4 + g.wit * 0.35 + (v.edu || 0) * 0.2 + h(3),
    kin: g.fertility * 0.6 + g.romance * 0.3 + h(4),
    craft: (1 - g.laziness) * 0.4 + Math.max(...SKILLS.map((s) => g.apt[s] || 0)) * 0.5 + h(5),
    nature: g.bravery * 0.4 + g.hardiness * 0.4 + h(6),
    order: (1 - g.temper) * 0.5 + (1 - g.curiosity) * 0.3 + 0.1 + h(7),
  };
}
// The two values, decided once (from the parents where there are any) and kept.
function valuesOf(v) {
  if (v.values && v.values.length) return v.values;
  if (v.stage === 'baby') return [];
  const lean = valueLeanings(v);
  const picked = [];
  const parents = (v.parents || []).map((id) => personById(id)).filter(Boolean);
  const rng = mulberry32(v.id * 7919 + 101);
  for (const p of parents) {
    const pv = (p.values || []).filter((k) => !picked.includes(k) && !picked.some((q) => VALUES[q].clash === k));
    if (pv.length && rng() >= TUNE.values.mutation) picked.push(pv[Math.floor(rng() * pv.length)]);
    if (picked.length >= 2) break;
  }
  const rest = VALUE_KEYS.filter((k) => !picked.includes(k) && !picked.some((q) => VALUES[q].clash === k)).sort((a, b) => lean[b] - lean[a]);
  while (picked.length < 2 && rest.length) { const k = rest.shift(); if (!picked.some((q) => VALUES[q].clash === k)) picked.push(k); }
  v.values = picked;
  return picked;
}
function valueWords(v) { return valuesOf(v).map((k) => VALUES[k].label.toLowerCase()).join(' and '); }
// shared values warm a friendship; opposite ones cool it
function valueAccord(a, b) {
  const va = valuesOf(a), vb = valuesOf(b);
  if (!va.length || !vb.length) return 1;
  let f = 1;
  for (const k of va) { if (vb.includes(k)) f *= TUNE.values.shared; if (VALUES[k].clash && vb.includes(VALUES[k].clash)) f *= TUNE.values.clash; }
  return f;
}
{
  patch(Villager.prototype, 'score', (score) => function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s <= 0 || this.stage === 'baby') return s;
    for (const k of valuesOf(this)) if (VALUES[k].acts.includes(a.id)) { s *= TUNE.values.pull; if (ex) ex.mul.push(['holds ' + VALUES[k].label.toLowerCase() + ' dear', TUNE.values.pull]); break; }
    return s;
  }, 'values');
  patch(Villager.prototype, 'bond', (bond) => function (o, amt) { return bond.call(this, o, amt > 0 ? amt * valueAccord(this, o) : amt); }, 'values');
  // the Steward's answers please or vex those whose values they touch
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof answerPetition !== 'function') return;
    const ap = answerPetition;
    answerPetition = function (i) {
      const pt = Game.petition && PETITIONS.find((p) => p.id === Game.petition.id);
      const o = pt && pt.opts[i];
      ap(i);
      if (!o || !o.fx) return;
      for (const v of Game.villagers) {
        if (!v.isGrown()) continue;
        for (const k of valuesOf(v)) {
          const f = VALUES[k].faction, n = f && o.fx[f];
          if (!n) continue;
          feel(v, n > 0 ? 'heartened' : 'vexed', VALUES[k].label.toLowerCase());
          break;
        }
      }
    };
  });
}
