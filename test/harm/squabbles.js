// How often a squabble comes to blows: squabbles forced between grown-ups,
// one at a time, each given 45 minutes, counting the scuffles they turn
// into, the blows, the bloody noses and how each scuffle ended.
//
//   node test/harm/squabbles.js [rate] [n]      rate: SCUFFLE.rate to try (default 0.3), n squabbles (60)
//   node test/harm/squabbles.js 0.35 160
const { launch, openGame } = require('../lib');
(async () => {
  const kit = await launch();
  const rate = +(process.argv[2] || 0.3), n = +(process.argv[3] || 60);
  const { page, errors } = await openGame(kit);
  const r = await page.evaluate(({ rate, n }) => {
    Math.random = mulberry32(11); startGame(true); Game.generating = true;
    for (let i = 0; i < 120; i++) simulate(0.5);
    SCUFFLE.rate = rate;
    const res = { squabbles: 0, scuffles: 0, ends: {}, sour: 0, turns: 0, blows: 0, nose: 0 };
    const w = Shell.w;
    w.on('bree:escalated', (e) => { if (e.to === 'scuffle') res.scuffles++; });
    w.on('bree:turn', (t) => { if (t.kind === 'squabble') { res.turns++; if (t.landed === 'sour' || t.landed === 'row') res.sour++; } if (t.harm) { res.blows++; if (t.harm.severity >= SCUFFLE.noseAt) res.nose++; } });
    w.on('bree:end', (e) => { if (e.kind === 'scuffle') res.ends[e.why] = (res.ends[e.why] || 0) + 1; });
    Natter.w.bree.kinds.get('squabble').weight = () => 100;
    for (let k = 0; k < n; k++) {
      const pool = Game.villagers.filter((x) => x.stage === 'adult' && !x.inside && !x.leaving && !(x.task && ['sleep', 'chat', 'scuffle'].includes(x.task.a.id)));
      if (pool.length < 2) { for (let i = 0; i < 20; i++) simulate(0.5); continue; }
      const a = pool[Math.floor(Math.random() * pool.length)], b = pool.filter((x) => x !== a && x.spouse !== a.id && x.sweetheart !== a.id)[0];
      if (!b) continue;
      b.x = a.x + 12; b.y = a.y; a.abort(); b.abort();
      a.task = { a: ACTIONS.chat, phase: 'go', target: { other: b }, t: 30, data: {}, before: { ...a.drives } };
      if (Natter.begin(a, b, ACTIONS.chat) && a.task && a.task.data.quarrel) res.squabbles++;
      for (let i = 0; i < 90; i++) simulate(0.5);
    }
    return res;
  }, { rate, n });
  console.log('rate', rate, JSON.stringify(r));
  if (errors.length) console.log('errors', errors.slice(0, 3));
  await kit.close();
})();
