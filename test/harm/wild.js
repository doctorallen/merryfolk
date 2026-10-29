// Why scuffles and spoiled suppers are rare in the wild: a village left to
// itself (no forcing), counting every squabble (where it was, whether either
// side could come to blows and how readily, how many turns landed sour) and
// every prank planned (who for, the grudge, whether the pranker knows a
// toadstool, whether the victim's home was empty, what was chosen).
//
//   node test/harm/wild.js [seeds] [days] [rate]     node test/harm/wild.js 1,2,3,4 12
//   (rate: SCUFFLE.rate to try; every sour turn of a squabble asks Scuffle.escalation, so each ask is listed)
const { launch, openGame } = require('../lib');
(async () => {
  const seeds = (process.argv[2] || '1,2').split(',').map(Number), days = +(process.argv[3] || 6), rate = process.argv[4] == null ? null : +process.argv[4];
  const kit = await launch();
  const all = [];
  for (const seed of seeds) {
    const { page, errors } = await openGame(kit);
    const r = await page.evaluate(async ({ seed, days, rate }) => {
      Math.random = mulberry32(seed); startGame(true); Game.generating = true;
      if (rate != null) SCUFFLE.rate = rate;
      const res = { seed, squabbles: [], scuffles: 0, blows: 0, pranks: [], asks: [], calmed: 0, taints: 0, sets: 0 };
      const esc0 = Scuffle.escalation.bind(Scuffle);
      Scuffle.escalation = (ctx) => { const x = esc0(ctx); const v = Shell.byPid.get(ctx.person.id); res.asks.push([v && v.first, +x.toFixed(3)]); return x; };
      const live = new Map();
      const w = Shell.w;
      w.on('morgul:tainted', () => res.taints++);
      w.on('morgul:set', () => res.sets++);
      w.on('bree:start', (e) => { if (e.kind === 'squabble') live.set(e.id, { who: e.who, sour: 0, turns: 0, p: [] }); });
      w.on('bree:escalated', (e) => {
        if (e.to === 'squabble') live.set(e.id, { who: e.who, sour: 0, turns: 0, p: [], from: e.from });
        if (e.to === 'scuffle') { res.scuffles++; const s = live.get(e.id); if (s) s.blows = true; }
      });
      w.on('bree:turn', (t) => {
        const s = live.get(t.id || t.exchange);
        if (t.harm) res.blows++;
        if (t.step === 'calm' && t.kind === 'squabble') res.calmed++;
        if (!s || t.kind !== 'squabble') return;
        s.turns++; if (t.landed === 'sour' || t.landed === 'row') s.sour++;
      });
      w.on('bree:end', (e) => {
        const s = live.get(e.id);
        if (!s) return;
        live.delete(e.id);
        const [a, b] = (s.who || e.who || []).map((id) => Shell.byPid.get(id));
        const esc = (x, y) => (x && y ? +Scuffle.escalation({ person: { id: x._pid }, target: y._pid }).toFixed(3) : null);
        res.squabbles.push({ a: a && a.first, b: b && b.first, inside: !!(a && a.inside), kids: [a && a.isChild(), b && b.isChild()], esc: [esc(a, b), esc(b, a)], sour: s.sour, turns: s.turns, blows: !!s.blows, why: e.why });
      });
      const plan = Mischief.plan.bind(Mischief);
      Mischief.plan = function (v) {
        const t = this.victim(v), out = plan(v);
        if (t) {
          const o = t.o, home = o.home();
          res.pranks.push({ by: v.first, for: o.first, grudge: +t.grudge.toFixed(3), knows: v.wary > 0.2 || v.skills.herbalism > 25 || v.edu > 0.6, grown: v.isGrown(), out: !o.inside, empty: !!(home && !home.inside.length), kind: out && out.prank && out.prank.kind });
        }
        return out;
      };
      for (let d = 0; d < days; d++) for (let i = 0; i < 2880; i++) simulate(0.5);
      return res;
    }, { seed, days, rate });
    if (errors.length) console.log('errors', errors.slice(0, 3));
    all.push(r);
    await page.close();
  }
  await kit.close();
  for (const r of all) {
    console.log(`seed ${r.seed}: ${r.squabbles.length} squabbles, ${r.asks.length} sour turns asked, ${r.calmed} kept calm, ${r.scuffles} scuffles, ${r.blows} blows; ${r.pranks.length} pranks planned, ${r.sets} traps set, ${r.taints} pots spiked`);
    console.log('  asks', JSON.stringify(r.asks));
    for (const s of r.squabbles) console.log('  squabble', JSON.stringify(s));
    for (const p of r.pranks) console.log('  prank', JSON.stringify(p));
  }
})();
