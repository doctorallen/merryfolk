// What body-given.js saw, side by side: colds (those that stayed colds and
// weren't given a remedy), toadstools and the flu, and each cold's person,
// hardiness, hours with it / hours sniffling (F: it turned to flu, C: a
// remedy, with the germs/toxin it was given at).
//
//   node test/harm/body-given-sum.js before.log after.log
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const line = fs.readFileSync(f, 'utf8').split('\n').find((l) => l.startsWith('['));
  if (!line) { console.log(f, 'no data'); continue; }
  const all = JSON.parse(line);
  const m = (xs, g) => (xs.length ? (xs.reduce((a, x) => a + g(x), 0) / xs.length).toFixed(1) : '-');
  const colds = all.filter((x) => x.kind === 'cold'), plain = colds.filter((x) => !x.flu), cured = plain.filter((x) => x.cures.length), un = plain.filter((x) => !x.cures.length);
  console.log(f.split('/').pop(), 'colds', colds.length, 'flu', colds.length - plain.length, '| plain uncured', un.length, 'cold', m(un, (x) => x.cold), 'sniff', m(un, (x) => x.sniff), 'asleep', m(un, (x) => x.asleep), 'hardy', m(un, (x) => x.hardy), '| cured', cured.length, 'cold', m(cured, (x) => x.cold), 'sniff', m(cured, (x) => x.sniff));
  const toads = all.filter((x) => x.kind === 'toad');
  console.log('  toads', toads.length, 'toxin', m(toads, (x) => x.toxin), 'poorly', m(toads, (x) => x.sick), 'cured', toads.filter((x) => x.cures.length).length, toads.map((x) => x.toxin.toFixed(1)).join(' '));
  const flus = all.filter((x) => x.kind === 'flu');
  console.log('  flu', flus.length, 'laid up', m(flus, (x) => x.flu), 'germs', m(flus, (x) => x.cold), 'sniff', m(flus, (x) => x.sniff), 'cured', flus.filter((x) => x.cures.length).length, flus.map((x) => x.flu.toFixed(0) + '/' + x.cold.toFixed(0)).join(' '));
  console.log('  per cold', colds.map((x) => `${x.name}:${x.hardy}:${x.cold.toFixed(0)}/${x.sniff.toFixed(0)}${x.flu ? 'F' : ''}${x.cures.length ? 'C' + x.cures.join(',') : ''}`).join(' '));
}
