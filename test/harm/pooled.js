// The body's spells pooled over a kept run's seeds (every spell counts once:
// the mean of the seeds' means lets one seed's single long flu stand for
// all), with the counts summed: colds, flu, sprains, toadstools, pints,
// nursing and soup.
//
//   node test/harm/pooled.js harm-before harm-body            (test/season-<name>.json)
//   node test/harm/pooled.js harm-before-year harm-after-year
const fs = require('fs');
const path = require('path');
const file = (n) => (n.endsWith('.json') ? n : path.join(__dirname, '..', `season-${n}.json`));
for (const n of process.argv.slice(2)) {
  const m = JSON.parse(fs.readFileSync(file(n))), out = {};
  for (const k of ['drink', 'tipsy', 'cold', 'sniffles', 'toxin', 'flu', 'sprain', 'immune', 'sick']) {
    let sp = 0, h = 0; for (const r of m.runs) { sp += r.body[k].spells; h += r.body[k].spells * r.body[k].hours; }
    out[k] = `${sp} spells, ${sp ? (h / sp).toFixed(1) : '-'} h`;
  }
  const sum = (g) => m.runs.reduce((t, r) => t + (g(r) || 0), 0);
  console.log(n, JSON.stringify(out), 'colds', sum((r) => r.illness.colds), 'flu', sum((r) => r.illness.other.flu), 'sprain', sum((r) => r.illness.other.sprain), 'toad', sum((r) => r.illness.poisoned), 'pints', sum((r) => r.body.pints), 'nursed', sum((r) => r.body.nursed), 'soup', sum((r) => r.body.soup));
}
