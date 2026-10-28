'use strict';
// ---------------------------------------------------------------------------
// Tidying the story (from the playtests): names are kept unique (no two
// living hobbits share a first name, and a baby takes its family's surname),
// and the small hours' churn of growing-up news (comings of age, first steps,
// gray hairs) is gathered into one line in the morning rather than a flurry
// at midnight.
// ---------------------------------------------------------------------------

function uniqueFirst(v) {
  const taken = (n) => Game.villagers.some((o) => o !== v && o.first === n) || (Game.pets || []).some((p) => p.name === n);
  if (!taken(v.first)) return;
  const old = v.first;
  for (let i = 0; i < 20; i++) {
    const n = v.isRiftborn() ? riftName(v.genes.sex) : (v.genes.rift || 0) > 0.2 && R.chance(0.5) ? hybridName(v.genes.sex) : randomFirstName(v.genes.sex);
    if (!taken(n)) { v.first = n; break; }
  }
  if (v.first === old) v.first = old + (R.chance(0.5) ? 'o' : 'a');
}
{
  const bi = birth;
  birth = function (a, b) {
    const baby = bi(a, b);
    // brothers and sisters share a surname: the family's
    const sib = Game.villagers.find((o) => o !== baby && o.parents.includes(a.id) && o.parents.includes(b.id));
    baby.surname = sib ? sib.surname : (a.genes.sex === 'm' ? a : b).surname || baby.surname;
    uniqueFirst(baby);
    return baby;
  };
  const af = arriveFromRift;
  const renamed = (v, old) => { if (!v || v.first === old) return; for (const l of Game.log.slice(0, 4)) if (l.text.includes(old)) l.text = l.text.split(old).join(v.first); if (typeof renderLog === 'function') renderLog(); };
  arriveFromRift = function (r) { const v = af(r); if (v) { const old = v.first; uniqueFirst(v); renamed(v, old); } return v; };
  const wt = welcomeTraveler;
  welcomeTraveler = function (data, quiet, sex) { const r = wt(data, quiet, sex); if (r && r.v && !data) { const old = r.v.first; uniqueFirst(r.v); renamed(r.v, old); } return r; };
}
// the founding families too: two Burdocks from day one would muddle every letter and natter
addHook('afterNewVillage', () => { for (const v of Game.villagers) uniqueFirst(v); });
// the morning digest
const DIGEST = /(is toddling about now|has come of age!|is getting on a bit, and has gone a little gray)/;
window.addEventListener('DOMContentLoaded', () => {
  const ch = chronicle;
  chronicle = function (text, kind = 'info') {
    if (DIGEST.test(text) && (Game.hour < 6 || Game.hour >= 23)) { (Game.digest || (Game.digest = [])).push(text.replace(/ There'll be a party tonight\.?/, '').replace(/, and getting into everything\./, '.').replace(/ is getting on a bit, and/, '')); return; }
    return ch(text, kind);
  };
  addHook('onHour', (h) => {
    if (h === 7 && Game.digest && Game.digest.length) {
      const d = Game.digest; Game.digest = [];
      const of = d.filter((t) => /come of age/.test(t)).map((t) => t.replace(/ has come of age!.*/, ''));
      const toddle = d.filter((t) => /toddling/.test(t)).map((t) => t.replace(/^Little /, '').replace(/ is toddling.*/, ''));
      const grey = d.filter((t) => /gray/.test(t)).map((t) => t.replace(/ has gone a little gray.*/, ''));
      const list = (xs) => xs.length > 1 ? xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1] : xs[0];
      const bits = [];
      if (of.length) bits.push(`${list(of)} ${of.length > 1 ? 'have' : 'has'} come of age${Game.party.planned || Game.party.on ? ' (there\'ll be a party tonight)' : ''}`);
      if (toddle.length) bits.push(`little ${list(toddle)} ${toddle.length > 1 ? 'are' : 'is'} toddling about now`);
      if (grey.length) bits.push(`${list(grey)} ${grey.length > 1 ? 'have' : 'has'} gone a little gray`);
      if (bits.length) chronicle(`Growing up and growing old: ${bits.join('; ')}.`, of.length ? 'party' : 'birth');
    }
  });
});
