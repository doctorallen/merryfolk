// Screenshots of a scuffle and a prank (test/out/scuffle.png, test/out/prank.png):
// a squabble forced into a scuffle and played until the first blow lands, then
// a tripwire and a snare by someone's door and a passer-by just caught by one.
//
//   node test/harm/shots.js
const path = require('path');
const { launch, openGame, outDir } = require('../lib');
(async () => {
  const kit = await launch({ gl: true });
  const { page, errors } = await openGame(kit, { width: 900, height: 640 });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await page.evaluate(() => {
    Math.random = mulberry32(5); startGame(true); Game.generating = true;
    for (let i = 0; i < 120; i++) simulate(0.5);
    const grown = Game.villagers.filter((x) => x.isGrown() && !x.inside && x.stage === 'adult');
    const [a, b] = grown;
    window.__a = a; window.__b = b;
    b.x = a.x + 12; b.y = a.y;
    a.abort(); b.abort();
    a.task = { a: ACTIONS.chat, phase: 'go', target: { other: b }, t: 30, data: {}, before: { ...a.drives } };
    Natter.w.bree.kinds.get('squabble').weight = () => 100; Natter.w.bree.kinds.get('squabble').base = -5; SCUFFLE.rate = 60;
    Natter.begin(a, b, ACTIONS.chat);
    let blows = 0;
    Shell.w.on('bree:turn', (t) => { if (t.harm) blows++; });
    for (let i = 0; i < 200 && !(blows >= 1 && a.pose === 'tussle' && b.pose === 'tussle'); i++) simulate(0.5);
    a.say('Take that!', 30, { to: b });
    Game.speed = 1; Game.generating = false; setZoom(8); centerOn((a.x + b.x) / 2, a.y - 10); Game.selected = null;
  });
  await page.addStyleTag({ content: '#game > *:not(#view):not(#overlay), body > *:not(#game) { visibility: hidden !important; }' });
  await sleep(900);
  await page.screenshot({ path: path.join(outDir(), 'scuffle.png'), clip: { x: 250, y: 200, width: 400, height: 260 } });
  await page.evaluate(() => {
    Game.generating = true;
    const v = Game.villagers.find((x) => x.isGrown() && x !== __a && x !== __b && x.homeId >= 0 && !x.inside && !x.isSick());
    const o = Game.villagers.find((x) => Mischief.fair(__a, x) && x !== v && x.homeId >= 0);
    // two pranks lying in wait by a door, and someone who's just walked into a third
    const h = o.home();
    Mischief.done(__a, { target: { prank: { kind: 'tripwire', for: o, x: h.stepX, y: h.stepY + 4 } } });
    Mischief.done(__b, { target: { prank: { kind: 'snare', for: o, x: h.stepX - 16, y: h.stepY + 16 } } });
    v.abort(); v.task = null; v.x = h.stepX + 12; v.y = h.stepY + 12; v.pose = 'stumble'; v._stumble = { until: Game.time + 50 }; FX.dust(v.x, v.y - 2); FX.stars(v.x, v.y - 18);
    v.say('Whoa! Oof!', 30);
    Game.speed = 0; Game.generating = false; setZoom(8); centerOn(h.stepX, h.stepY + 4);
    window.__h = h; window.__v = v;
  });
  await sleep(600);
  await page.evaluate(() => { __v.iconT = 0; });
  await sleep(600);
  await page.screenshot({ path: path.join(outDir(), 'prank.png'), clip: { x: 200, y: 150, width: 500, height: 300 } });
  console.log('errors', errors.slice(0, 5));
  await kit.close();
})();
