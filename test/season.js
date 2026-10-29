'use strict';
// A season of village life, headless, in numbers: the yardstick for changes
// to how villagers think (it measured the village before its folk moved onto
// Tyrell, and after). A fresh village in the original valley runs for a
// season (SEASON_DAYS days) with chance seeded, for each of a few seeds, and
// the runner records what a village's life comes to: meals eaten and missed,
// hours worked and the jobs done, goods made and used and the Store's levels,
// weddings, births and departures, moods over time, breaks, friendships and
// falling-outs, illness, skills, wishes, where everyone's time went, and what
// passed between them: natters begun and the lines said in them, natters
// walked off from, long and good ones, squabbles, table talk and gatherings,
// and with the natters on Bree, the grudges, feuds, making up, natters turned
// squabbles, patience kept and someone stepping in; the body (pints drunk,
// and each spell's count, length and share of everyone's time: in drink,
// tipsy, a cold, the sniffles, a toadstool, the flu, a sprain, recently
// recovered); and with harm on Morgul, scuffles and their blows and wounds,
// tending, pranks set and sprung, and who suspected whom.
//
//   node test/season.js                     prints the numbers, writes test/out/season.json
//   node test/season.js --record before     ...and keeps them as test/season-before.json
//   node test/season.js --compare a b       a table of two kept runs (names or paths)
//   --days N, --seeds 1,2,3                 a longer run, other seeds
//   --no-wizard                             the wizard kept away (his visits, a crowd round him
//                                           for a tale, move friendships a lot from run to run)
//
// It isn't part of npm test (a season takes a while); run it after a change
// to how folk behave and compare.
const fs = require('fs');
const path = require('path');
const { launch, openGame, outDir, finish } = require('./lib');

const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : dflt; };

// ---------------------------------------------------------------------------
// In the page: watch the village (wrapping what it does from outside, so the
// game's own code is untouched), then run it a day at a time.
// ---------------------------------------------------------------------------
function installProbe({ seed, wizard }) {
  Math.random = mulberry32(seed); // every R.* draw goes through Math.random
  startGame(true); // a fresh village in the original valley
  if (!wizard) WIZARD.chance = 0;
  Game.generating = true; // the page's own frames neither run the village nor draw between our steps
  const P = window.__probe = {
    seed, t0: Game.time, day0: Game.day, ms: 0,
    done: {}, meals: {}, made: {}, used: {}, madePriv: {}, usedPriv: {}, feels: {}, departed: {}, trips: 0,
    mins: {}, cat: {}, workMin: {}, commuteMin: {}, workerMin: {}, hungry: 0, awake: 0, sick: 0, alive: 0,
    mood: [], needs: {}, needN: 0, stores: [], daily: [], sulks: {}, tantrums: 0, colds: 0, ills: {}, poisoned: 0, wishes: 0, dreams: 0,
    seen: {}, mealsBy: {}, cats: {},
  };
  const kind = (a) => (a.job || ['build', 'plow', 'deliver', 'nurse'].includes(a.id) ? 'work'
    : ['sleep', 'nap', 'cradle'].includes(a.id) ? 'sleep'
    : ['eat_home', 'eat_inn', 'eat_item'].includes(a.id) ? 'eat'
    : ['school', 'apprentice', 'lesson'].includes(a.id) ? 'school'
    : ['chat', 'gift', 'party', 'gather', 'visit', 'tend_baby', 'give_present', 'bring_soup', 'write_letter'].includes(a.id) ? 'social'
    : 'leisure');
  P.kind = kind;
  // what they finished doing
  const fin = Villager.prototype.finish;
  Villager.prototype.finish = function () {
    const t = this.task;
    if (t && t.phase === 'do') {
      const id = t.a.id;
      P.done[id] = (P.done[id] || 0) + 1;
      if (kind(t.a) === 'eat') { P.meals[id] = (P.meals[id] || 0) + 1; P.mealsBy[this.id] = (P.mealsBy[this.id] || 0) + 1; }
    }
    return fin.apply(this, arguments);
  };
  // the Store's comings and goings
  const pr = Village.produce, us = Village.use;
  Village.produce = function (res, n, priv) { if (n > 0) { const o = priv ? P.madePriv : P.made; o[res] = (o[res] || 0) + n; } return pr.apply(this, arguments); };
  Village.use = function (res, n, priv) { if (n > 0) { const o = priv ? P.usedPriv : P.used; o[res] = (o[res] || 0) + n; } return us.apply(this, arguments); };
  // feelings, by name (breaks, wishes, quarrels and kindnesses all come through here)
  const fl = feel;
  feel = function (v, key) { P.feels[key] = (P.feels[key] || 0) + 1; return fl.apply(this, arguments); };
  const gw = grantWish;
  grantWish = function () { P.wishes++; return gw.apply(this, arguments); };
  const ap = archivePerson;
  archivePerson = function (v, reason) { P.departed[reason] = (P.departed[reason] || 0) + 1; return ap.apply(this, arguments); };
  // natters: each one begun (the task of whoever walked up), the lines said in
  // them, and the talk round tables and at gatherings, line by line
  P.natters = 0; P.natterLines = 0; P.groupTalks = 0; P.groupLines = 0; P.natterSeen = new WeakSet();
  const ltl = logTalkLine;
  logTalkLine = function () { P.natterLines++; return ltl.apply(this, arguments); };
  const tgt = talkGroupThread;
  talkGroupThread = function () { P.groupTalks++; return tgt.apply(this, arguments); };
  const lgl = logGroupLine;
  logGroupLine = function (th, who, text) { if (text && th && talksList().includes(th)) P.groupLines++; return lgl.apply(this, arguments); };
  // with the natters on Bree: what passed between them
  P.bree = null;
  if (typeof Shell !== 'undefined' && Shell.w && Shell.w.bree && Shell.w.bree.kinds.size) {
    const B = P.bree = { kinds: {}, ends: {}, outcomes: {}, escalated: 0, calmed: 0, steppedIn: 0, grudges: 0, mended: 0, feuds: 0, witnessed: 0 };
    const w = Shell.w, inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
    w.on('bree:start', (e) => inc(B.kinds, e.kind));
    w.on('bree:end', (e) => { inc(B.ends, e.why); inc(B.outcomes[e.kind] || (B.outcomes[e.kind] = {}), e.outcome); });
    w.on('bree:escalated', () => B.escalated++);
    w.on('bree:turn', (t) => { if (t.step === 'calm') B.calmed++; else if (t.step === 'step_in') B.steppedIn++; });
    w.on('bree:grudge', () => B.grudges++);
    w.on('bree:mended', () => B.mended++);
    w.on('bree:feud', (e) => { if (e.strength > 0) B.feuds++; });
    w.on('bree:witnessed', () => B.witnessed++);
  }
  // the body: how long a pint, a cold, a toadstool and the flu last, spell by
  // spell (a spell is a run of ten-minute looks with it), and how much of
  // everyone's time each takes
  P.body = { spells: {}, mins: {}, levels: {}, n: 0 };
  // harm, with it on Morgul: scuffles and their blows, wounds, pranks and suspicion
  P.harm = null;
  if (typeof Shell !== 'undefined' && Shell.w && Shell.w.morgul) {
    const H = P.harm = { fights: 0, blows: 0, landed: 0, wounds: {}, down: 0, steppedIn: 0, fightEnds: {}, tended: 0, set: {}, sprung: {}, tainted: 0, dosed: 0, suspects: 0, suspectRight: 0, harms: 0, seen: 0, pranks: 0 };
    const w = Shell.w, inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
    w.on('bree:escalated', (e) => { if (w.morgul.fights(e.to)) H.fights++; });
    w.on('bree:turn', (t) => { if (t.harm) { H.blows++; } if (t.step === 'step_in' && w.morgul.fights(t.kind)) H.steppedIn++; });
    w.on('bree:end', (e) => { if (w.morgul.fights(e.kind)) inc(H.fightEnds, e.why); });
    w.on('morgul:harm', (h) => { H.harms++; if (h.wound) inc(H.wounds, h.wound); H.seen += (h.seenBy || []).length; });
    w.on('morgul:down', () => H.down++);
    w.on('morgul:set', (e) => inc(H.set, e.kind));
    w.on('morgul:sprung', (e) => inc(H.sprung, e.kind));
    w.on('morgul:tainted', () => H.tainted++);
    w.on('morgul:suspect', (e) => { H.suspects++; if (e.right) H.suspectRight++; });
    w.on('tended', () => H.tended++);
  }
  const sa = startAdventure;
  startAdventure = function (v, k) { if (k === 'trip') P.trips++; return sa.apply(this, arguments); };
  const snap = () => ({
    pop: Game.villagers.length,
    stages: Game.villagers.reduce((o, v) => { o[v.stage] = (o[v.stage] || 0) + 1; return o; }, {}),
    skills: Object.fromEntries(Game.villagers.map((v) => [v.id, SKILLS.reduce((s, k) => s + (v.skills[k] || 0), 0)])),
    levels: Object.fromEntries(Game.villagers.map((v) => [v.id, SKILLS.reduce((s, k) => s + Math.floor((v.skills[k] || 0) / 25), 0)])),
    pairs: pairsOf(), sweet: Game.villagers.filter((v) => v.sweetheart).length, spouses: Game.villagers.filter((v) => v.spouse).length,
    rivals: Game.villagers.filter((v) => v.rival).length,
    weddings: Game.stats.weddings || 0, births: Game.stats.births || 0, coin: Game.coin || 0,
    stores: { ...Village.stores }, food: Village.foodTotal(),
    dreams: Game.villagers.reduce((s, v) => s + (v.dreamsDone || []).length, 0),
    ids: Game.villagers.map((v) => v.id),
  });
  function pairsOf() {
    const friends = [], foes = [];
    for (const v of Game.villagers) for (const k in v.rel) {
      const id = +k;
      if (id <= v.id || !Game.villagers.some((o) => o.id === id)) continue;
      if (v.rel[k] >= 0.5) friends.push(v.id + '-' + id);
      else if (v.rel[k] <= -0.3) foes.push(v.id + '-' + id);
    }
    return { friends, foes };
  }
  P.snap = snap;
  P.start = snap();
  P.prev = {};
  return { folk: Game.villagers.length, time: Game.time };
}

function runDay() {
  const P = window.__probe;
  const t0 = performance.now();
  const day = Game.day;
  const hungerT = 0.85;
  for (let i = 0; i < 2880; i++) {
    simulate(0.5);
    // the sky, as the frame would set it (chill and lamps go by it)
    if (i % 20 === 0) Game.darkness = skyState(Game.hour).dark;
    // where everyone's time goes, a minute at a time
    if (i % 2 === 0) {
      for (const v of Game.villagers) {
        if (v.stage === 'baby') continue;
        const t = v.task;
        const cat = !t ? 'idle' : v.leaving ? 'away' : t.phase === 'go' ? 'travel' : P.kind(t.a);
        P.cat[cat] = (P.cat[cat] || 0) + 1;
        if (t) { const id = t.a.id + (t.phase === 'go' ? ':go' : ''); P.mins[id] = (P.mins[id] || 0) + 1; }
        if (t && t.a.id === 'chat' && t.phase === 'do' && t.data && t.data.leader && !P.natterSeen.has(t)) { P.natterSeen.add(t); P.natters++; }
        const asleep = t && t.a.id === 'sleep' && t.phase === 'do';
        if (!asleep) { P.awake++; if (v.drives.hunger >= hungerT) P.hungry++; }
        P.alive++;
        if (v.isSick()) P.sick++;
        if (v.isGrown() && v.job) {
          P.workerMin[v.job] = (P.workerMin[v.job] || 0) + 1;
          if (t && (t.a.job || ['build', 'plow', 'deliver', 'nurse'].includes(t.a.id))) {
            const o = t.phase === 'do' ? P.workMin : P.commuteMin;
            o[v.job] = (o[v.job] || 0) + 1;
          }
        }
      }
    }
    // breaks, illness and moods, every ten minutes
    if (i % 20 === 0) {
      for (const v of Game.villagers) {
        const pv = P.prev[v.id] || (P.prev[v.id] = {});
        if (v.sulk && v.sulk !== pv.sulk) P.sulks[v.sulk.k] = (P.sulks[v.sulk.k] || 0) + 1;
        if (v.tantrum && v.tantrum !== pv.tantrum) P.tantrums++;
        if (v.chem.germs > 0 && !(pv.germs > 0)) P.colds++;
        if (v.illness && v.illness !== pv.illness) P.ills[v.illness.kind] = (P.ills[v.illness.kind] || 0) + 1;
        if (v.chem.toxin > 0.35 && !(pv.toxin > 0.35)) P.poisoned++;
        pv.sulk = v.sulk; pv.tantrum = v.tantrum; pv.germs = v.chem.germs; pv.illness = v.illness; pv.toxin = v.chem.toxin;
        // the body's spells: tipsy, well away, a cold, sick with it, a toadstool, the flu, a sprain, a sore head
        if (v.stage === 'baby') continue;
        const B = P.body, c = v.chem, ill = v.illness && Game.time < v.illness.until ? v.illness.kind : null;
        const on = { tipsy: c.ale > 0.45, merry: c.ale > 0.6, drink: c.ale > 0, cold: c.germs > 0, sniffles: c.germs > 0.35, toxin: c.toxin > 0.35, flu: ill === 'flu', sprain: ill === 'sprain', sorehead: c.hangover > 0.25, immune: c.immune > 0.4, sick: v.isSick() };
        const sp = pv.spells || (pv.spells = {});
        for (const k in on) {
          if (on[k]) { B.mins[k] = (B.mins[k] || 0) + 10; if (sp[k] == null) sp[k] = Game.time; }
          else if (sp[k] != null) { (B.spells[k] || (B.spells[k] = [])).push(Game.time - sp[k]); sp[k] = null; }
        }
        if (c.ale > 0) B.levels.ale = (B.levels.ale || 0) + c.ale;
        B.n++;
      }
    }
    if (i % 120 === 0) {
      const ms = Game.villagers.filter((v) => v.stage !== 'baby').map((v) => v.mood());
      P.mood.push({ t: Game.time, m: ms });
      for (const v of Game.villagers) {
        if (v.stage === 'baby') continue;
        for (const d of DRIVES) P.needs[d] = (P.needs[d] || 0) + (v.drives[d] || 0);
        P.needN++;
      }
      P.stores.push({ t: Game.time, food: Village.foodTotal(), grain: Village.stores.grain || 0, flour: Village.stores.flour || 0, bread: Village.stores.bread || 0, ale: Village.stores.ale || 0, wood: Village.stores.wood || 0 });
    }
  }
  P.ms += performance.now() - t0;
  // the day's meals, for everyone here all day
  const s = P.snap();
  P.daily.push({ day, pop: s.pop, stages: s.stages, food: s.food, stores: s.stores, coin: s.coin, meals: { ...P.mealsBy }, here: P.dayStart || P.start.ids, contentment: typeof contentment === 'function' ? contentment() : null });
  P.dayStart = s.ids;
  P.mealsBy = {};
  Game.generating = true;
  return { day: Game.day, folk: Game.villagers.length };
}

function report() {
  const P = window.__probe, s0 = P.start, s1 = P.snap();
  const days = P.daily.length;
  const r2 = (x) => Math.round(x * 100) / 100;
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const sorted = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
  // meals per villager-day: the non-babies here from the start of a day to its end
  let vd = 0, meals = 0, under2 = 0, zero = 0;
  for (const d of P.daily) {
    const end = new Set(Game.villagers.map((v) => v.id));
    for (const id of d.here) {
      if (!d.meals || !end) continue;
      const v = Game.villagers.find((x) => x.id === id);
      if (!v || v.stage === 'baby' || v.born >= d.day) continue;
      const n = d.meals[id] || 0;
      vd++; meals += n; if (n < 2) under2++; if (n === 0) zero++;
    }
  }
  const all = P.mood.flatMap((x) => x.m).sort((a, b) => a - b);
  const q = (p) => (all.length ? r2(all[Math.min(all.length - 1, Math.floor(p * all.length))]) : null);
  const buckets = { 'put out (<0.2)': 0, 'grumbly (0.2-0.4)': 0, 'middling (0.4-0.6)': 0, 'content (0.6-0.8)': 0, 'merry (>0.8)': 0 };
  const bk = Object.keys(buckets);
  for (const m of all) buckets[bk[Math.min(4, Math.floor(m / 0.2))]]++;
  for (const k of bk) buckets[k] = r2(buckets[k] / Math.max(1, all.length));
  const byDay = [];
  for (let d = 0; d < days; d++) {
    const xs = P.mood.filter((x) => Math.floor((x.t - P.t0) / 1440) === d).flatMap((x) => x.m);
    byDay.push(r2(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)));
  }
  const workerDays = sum(P.workerMin) / 1440;
  const perJob = {};
  for (const j in P.workerMin) perJob[j] = { workers: r2(P.workerMin[j] / 1440 / days), hoursPerDay: r2(((P.workMin[j] || 0) / 60) / (P.workerMin[j] / 1440)), commutePerDay: r2(((P.commuteMin[j] || 0) / 60) / (P.workerMin[j] / 1440)) };
  const jobsDone = {};
  for (const id in P.done) { const a = ACTIONS[id]; if (a && (a.job || ['build', 'plow', 'deliver', 'nurse'].includes(id))) jobsDone[id] = P.done[id]; }
  const both = s0.ids.filter((id) => s1.ids.includes(id));
  const gained = both.reduce((t, id) => t + Math.max(0, s1.skills[id] - s0.skills[id]), 0);
  const levelUps = both.reduce((t, id) => t + Math.max(0, s1.levels[id] - s0.levels[id]), 0);
  const formed = s1.pairs.friends.filter((p) => !s0.pairs.friends.includes(p)).length;
  const fellOut = s1.pairs.foes.filter((p) => !s0.pairs.foes.includes(p)).length;
  const catTotal = sum(P.cat);
  const timeUse = sorted(Object.fromEntries(Object.entries(P.cat).map(([k, n]) => [k, r2(n / catTotal)])));
  const topActs = Object.fromEntries(Object.entries(P.mins).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, n]) => [k, r2(n / 60 / (catTotal / 1440))]));
  const needs = Object.fromEntries(Object.entries(P.needs).map(([k, n]) => [k, r2(n / Math.max(1, P.needN))]));
  const food = P.stores.map((x) => x.food);
  const storeSeries = {};
  for (const k of ['food', 'grain', 'flour', 'bread', 'ale', 'wood']) { const xs = P.stores.map((x) => x[k]); storeSeries[k] = { start: xs[0], min: Math.min(...xs), max: Math.max(...xs), end: xs[xs.length - 1] }; }
  const FOOD = PANTRY_KINDS.concat(['stew']);
  const foodMade = FOOD.reduce((t, k) => t + (P.made[k] || 0) + (P.madePriv[k] || 0), 0);
  const foodUsed = FOOD.reduce((t, k) => t + (P.used[k] || 0) + (P.usedPriv[k] || 0), 0);
  const B = (k) => P.feels[k] || 0;
  // the body: each spell's count, its mean length in hours (finished spells), and its share of everyone's time
  const PB = P.body, body = {};
  for (const k of ['drink', 'tipsy', 'merry', 'cold', 'sniffles', 'toxin', 'flu', 'sprain', 'sorehead', 'immune', 'sick']) {
    const xs = PB.spells[k] || [];
    body[k] = { spells: xs.length, hours: r2(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length) / 60), share: r2((PB.mins[k] || 0) / Math.max(1, PB.n * 10) * 1000) / 1000 };
  }
  body.pints = (P.done.ale || 0) + (P.done.ale_item || 0);
  body.aleLevel = r2((PB.levels.ale || 0) / Math.max(1, (PB.mins.drink || 0) / 10));
  body.nursed = P.done.nurse || 0; body.remedies = P.done.remedy_item || 0; body.soup = P.done.bring_soup || 0;
  return {
    seed: P.seed, days, msPerDay: Math.round(P.ms / days),
    folk: { start: s0.pop, end: s1.pop, stagesStart: s0.stages, stagesEnd: s1.stages },
    meals: { perVillagerDay: r2(meals / Math.max(1, vd)), villagerDays: vd, underTwoShare: r2(under2 / Math.max(1, vd)), noneShare: r2(zero / Math.max(1, vd)), hungryShare: r2(P.hungry / Math.max(1, P.awake)), byKind: P.meals },
    work: { workersPerDay: r2(workerDays / days), hoursPerWorkerDay: r2(sum(P.workMin) / 60 / Math.max(1, workerDays)), commutePerWorkerDay: r2(sum(P.commuteMin) / 60 / Math.max(1, workerDays)), byJob: perJob, done: sorted(jobsDone), doneTotal: sum(jobsDone) },
    timeUse, hoursPerDay: topActs,
    goods: { foodMade, foodUsed, made: sorted(P.made), used: sorted(P.used), madeAtHome: sorted(P.madePriv), usedAtHome: sorted(P.usedPriv) },
    stores: { series: storeSeries, foodHourly: { min: Math.min(...food), max: Math.max(...food) }, end: s1.stores, coin: { start: s0.coin, end: s1.coin } },
    life: { weddings: s1.weddings - s0.weddings, births: s1.births - s0.births, departed: P.departed, trips: P.trips, couplesEnd: s1.spouses / 2, sweetheartsEnd: s1.sweet },
    mood: { mean: r2(all.reduce((a, b) => a + b, 0) / Math.max(1, all.length)), p10: q(0.1), p50: q(0.5), p90: q(0.9), buckets, byDay, contentment: P.daily.map((d) => d.contentment) },
    needs,
    breaks: { sulks: P.sulks, tantrums: P.tantrums, total: sum(P.sulks) + P.tantrums, inspired: B('inspired') },
    bonds: { friendsStart: s0.pairs.friends.length, friendsEnd: s1.pairs.friends.length, formed, foesStart: s0.pairs.foes.length, foesEnd: s1.pairs.foes.length, fellOut, rivals: s1.rivals, quarrels: B('quarrel'), goodChats: B('good_chat') },
    talk: {
      natters: P.natters, natterLines: P.natterLines, linesPerNatter: r2(P.natterLines / Math.max(1, P.natters)),
      walkedOff: B('snubbed'), longNatters: B('long_chat'), goodNatters: B('good_chat'), quarrels: B('quarrel'),
      groupTalks: P.groupTalks, groupLines: P.groupLines, tableTalk: B('table_talk'), sawRow: B('saw_row'), madeUp: B('made_up'),
    },
    bree: P.bree ? { ...P.bree, grudgesHeld: Game.villagers.reduce((t, v) => t + (Shell.w.bree.grudges(v._pid) || []).length, 0), feudsNow: Shell.w.bree.feuds().length } : undefined,
    illness: { colds: P.colds, other: P.ills, poisoned: P.poisoned, sickShare: r2(P.sick / Math.max(1, P.alive)) },
    body,
    harm: P.harm ? { ...P.harm } : undefined,
    skills: { gained: Math.round(gained), perVillager: r2(gained / Math.max(1, both.length)), levelUps },
    wishes: { granted: P.wishes, dreams: s1.dreams - s0.dreams },
    feelings: sorted(P.feels),
  };
}

// Means of every number across the runs, in the same shape.
function meanOf(runs) {
  const walk = (xs) => {
    if (xs.every((x) => typeof x === 'number')) return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 100) / 100;
    if (xs.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
      const keys = [...new Set(xs.flatMap((x) => Object.keys(x)))];
      return Object.fromEntries(keys.map((k) => [k, walk(xs.map((x) => (k in x ? x[k] : 0)))]));
    }
    return undefined;
  };
  const m = walk(runs);
  delete m.seed;
  return m;
}

// ---------------------------------------------------------------------------
// Comparing two kept runs: the numbers that matter, side by side.
// ---------------------------------------------------------------------------
const KEY = [
  ['folk at the end', 'folk.end'], ['meals per villager-day', 'meals.perVillagerDay'], ['villager-days under two meals', 'meals.underTwoShare'], ['villager-days with no meal', 'meals.noneShare'],
  ['waking time very hungry', 'meals.hungryShare'], ['work hours per worker-day', 'work.hoursPerWorkerDay'], ['commute hours per worker-day', 'work.commutePerWorkerDay'], ['jobs done', 'work.doneTotal'],
  ['food made', 'goods.foodMade'], ['food eaten', 'goods.foodUsed'], ['food in the Store at the end', 'stores.series.food.end'], ['lowest food in the Store', 'stores.series.food.min'],
  ['grain at the end', 'stores.series.grain.end'], ['ale at the end', 'stores.series.ale.end'], ['timber at the end', 'stores.series.wood.end'], ['coin at the end', 'stores.coin.end'],
  ['weddings', 'life.weddings'], ['births', 'life.births'], ['mood, mean', 'mood.mean'], ['mood, lowest tenth', 'mood.p10'], ['mood, highest tenth', 'mood.p90'],
  ['breaks', 'breaks.total'], ['friendships formed', 'bonds.formed'], ['falling-outs', 'bonds.fellOut'], ['quarrels', 'bonds.quarrels'], ['good natters', 'bonds.goodChats'], ['colds caught', 'illness.colds'], ['time sick', 'illness.sickShare'],
  ['natters begun', 'talk.natters'], ['lines said in natters', 'talk.natterLines'], ['lines a natter', 'talk.linesPerNatter'], ['natters someone walked off from', 'talk.walkedOff'], ['long natters (each one\'s)', 'talk.longNatters'],
  ['table talks and gatherings', 'talk.groupTalks'], ['lines said round them', 'talk.groupLines'], ['good company at table (felt)', 'talk.tableTalk'],
  ['saw a squabble', 'talk.sawRow'], ['made it up', 'talk.madeUp'], ['grudges formed or deepened', 'bree.grudges'], ['grudges held at the end', 'bree.grudgesHeld'], ['feuds', 'bree.feuds'],
  ['natters turned squabbles', 'bree.escalated'], ['kept their patience', 'bree.calmed'], ['stepped in', 'bree.steppedIn'],
  ['pints drunk', 'body.pints'], ['tipsy spells', 'body.tipsy.spells'], ['hours a tipsy spell', 'body.tipsy.hours'], ['time tipsy', 'body.tipsy.share'], ['time well in drink (over 0.6)', 'body.merry.share'],
  ['hours a drink lasts (ale above 0)', 'body.drink.hours'], ['ale while in drink', 'body.aleLevel'],
  ['colds (spells)', 'body.cold.spells'], ['hours a cold', 'body.cold.hours'], ['hours a cold has them sniffling', 'body.sniffles.hours'], ['time with a cold', 'body.cold.share'],
  ['flu', 'illness.other.flu'], ['hours laid up with flu', 'body.flu.hours'], ['sprains', 'illness.other.sprain'], ['toadstools', 'illness.poisoned'], ['hours a toadstool sickens them', 'body.toxin.hours'],
  ['time feeling poorly', 'body.sick.share'], ['time recently recovered', 'body.immune.share'], ['nursed', 'body.nursed'], ['remedies taken', 'body.remedies'], ['soup brought', 'body.soup'],
  ['scuffles', 'harm.fights'], ['blows in them', 'harm.blows'], ['harms', 'harm.harms'], ['bruises', 'harm.wounds.bruise'], ['bloody noses', 'harm.wounds.bloody_nose'], ['knocked down', 'harm.down'], ['stepped in on a scuffle', 'harm.steppedIn'], ['tended', 'harm.tended'],
  ['tripwires set', 'harm.set.tripwire'], ['snares set', 'harm.set.snare'], ['traps sprung', 'harm.sprung.tripwire'], ['snares sprung', 'harm.sprung.snare'], ['stews spiked', 'harm.tainted'], ['suspected someone', 'harm.suspects'], ['suspected the right one', 'harm.suspectRight'],
  ['skill points gained per villager', 'skills.perVillager'], ['skill levels gained', 'skills.levelUps'], ['wishes granted', 'wishes.granted'],
  ['time asleep', 'timeUse.sleep'], ['time working', 'timeUse.work'], ['time eating', 'timeUse.eat'], ['time with others', 'timeUse.social'], ['time at leisure', 'timeUse.leisure'], ['time walking', 'timeUse.travel'], ['time idle', 'timeUse.idle'],
  ['milliseconds per day simulated', 'msPerDay'],
];
const at = (o, p) => p.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
function compare(a, b) {
  const load = (n) => JSON.parse(fs.readFileSync(fs.existsSync(n) ? n : path.join(__dirname, `season-${n}.json`), 'utf8'));
  const A = load(a), B = load(b);
  const rows = [`| | ${a} | ${b} |`, '|---|---:|---:|'];
  for (const [label, p] of KEY) rows.push(`| ${label} | ${at(A.mean, p) ?? '-'} | ${at(B.mean, p) ?? '-'} |`);
  return rows.join('\n');
}

async function main() {
  if (process.argv.includes('--compare')) {
    const i = process.argv.indexOf('--compare');
    console.log(compare(process.argv[i + 1], process.argv[i + 2]));
    return;
  }
  const days = +arg('days', 0) || null;
  const seeds = arg('seeds', '1,2,3').split(',').map(Number);
  const record = arg('record', null);
  const kit = await launch();
  const runs = [];
  let failed = false;
  try {
    for (const seed of seeds) {
      const { page, errors } = await openGame(kit);
      const start = await page.evaluate(installProbe, { seed, wizard: !process.argv.includes('--no-wizard') });
      const n = days || (await page.evaluate(() => SEASON_DAYS));
      for (let d = 0; d < n; d++) {
        const r = await page.evaluate(runDay);
        process.stdout.write(`season: seed ${seed}, day ${r.day} with ${r.folk} folk\n`);
      }
      const rep = await page.evaluate(report);
      runs.push(rep);
      if (errors.length) { failed = true; console.error(`season: seed ${seed} had page errors:\n  ` + errors.slice(0, 8).join('\n  ')); }
      await page.close();
      void start;
    }
  } finally {
    await kit.close();
  }
  const out = { days: runs[0].days, seeds, built: new Date().toISOString().slice(0, 10), runs, mean: meanOf(runs) };
  const json = JSON.stringify(out, null, 1);
  fs.writeFileSync(path.join(outDir(), 'season.json'), json);
  if (record) fs.writeFileSync(path.join(__dirname, `season-${record}.json`), json + '\n');
  const m = out.mean;
  for (const [label, p] of KEY) console.log(`  ${label}: ${at(m, p)}`);
  finish('season', failed ? ['page errors'] : []);
}

main().catch((e) => { console.error(e); process.exit(1); });
