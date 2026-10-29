// Does a seed found the same village in two checkouts? Every Math.random
// draw made while founding, by where it was made, written to a file to diff
// (the new actions draw no instinct, so the harm branch should match main).
//
//   node test/harm/founding.js ../merryfolk-main /tmp/main.txt
//   node test/harm/founding.js . /tmp/harm.txt
//   diff <(sed -E 's#file:///[^ ]*/js/#js/#; s#:[0-9]+(:[0-9]+)?\)#)#g; s#\.js:[0-9]+#.js#g' /tmp/main.txt) \
//        <(sed -E 's#file:///[^ ]*/js/#js/#; s#:[0-9]+(:[0-9]+)?\)#)#g; s#\.js:[0-9]+#.js#g' /tmp/harm.txt)
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const { launch, openGame } = require(path.join(root, 'test/lib'));
(async () => {
  const kit = await launch();
  const { page } = await openGame(kit);
  const r = await page.evaluate(() => {
    const m = mulberry32(3); const seq = [];
    Math.random = () => { const st = new Error().stack.split('\n').slice(2, 6).map((l) => l.trim().replace(/\(.*\/(js|vendor)\//, '(').replace(/:\d+\)/, ')')).join(' < '); if (!/audio\.js/.test(st)) seq.push(st); return m(); };
    startGame(true);
    return seq.concat(Game.villagers.map((v) => v.first + ' ' + v.stage));
  });
  require('fs').writeFileSync(process.argv[3] || 'founding.txt', r.join('\n'));
  await kit.close();
})();
