'use strict';
// ---------------------------------------------------------------------------
// The minds: Tyrell (vendor/tycho/dist/tyrell.js, a script loaded before the
// game's own) runs every villager's needs and choices. This file is
// Merryfolk's shell for it.
//
// What lives in Tyrell: the twelve needs (villager.js's drives and minds.js's
// three more), each rising at a pace the villager's genes, age and trade set
// (MIND_RISE, mindRates); the habits they learn, and your pats and tut-tuts
// (Bicameral's habits and world.reward); their inborn instincts (the genome's
// tastes); and every choice of what to do next. Tyrell weighs each action by
// the relief it promises for the needs it meets, and by every reason the
// game's own score() gives (the hour, their nature, the weather, a baby in
// their arms, a sulk, a wish...), which reach it through a module of the
// game's (MIND_MODULE: consider and block), and Palantír keeps each choice
// with every option weighed, for the dev drawer's Brain tab.
//
// Families are Tyrell's too: each villager's genome is Delos's (genetics.js's
// genes, carried as alleles and blended values: mindGenome), so a baby is
// made in Tyrell from both parents (Shell.born), and Cradle keeps who is whose
// child, the couples, the ages and who has left. Their skills are Tyrell's
// skills, learned at their talent's pace (the genome's aptitudes) and their
// schooling's (mindSkills); practice the game gives is told in, a quarter
// hour of it at a time.
//
// What stays in the game: space. Tyrell has no coordinates, so the game
// walks villagers to the bench, field or doorway an action needs, works out
// who is near whom, and runs what an action does to the valley (a harvest, a
// loaf, a letter through the door). The game carries out each choice and
// tells Tyrell how it went: done, stopped part way (the relief they got so
// far, mf.stop), or impossible after all (failed, so it isn't tried again at
// once). And whatever the game sets a villager doing on its own (a queued
// errand, a baby picked up, a natter someone else began) Tyrell is told too
// (mf.do), so its record of what everyone is doing is always the game's:
// every task is a Tyrell doing (task.ty is its seq). The needs the valley
// itself moves (the chill, aches, comfort, quiet, unease, a baby fed in
// someone's arms) the game writes in, a step's worth at a time (mf.needs).
//
// Everyone is always on screen, so there is no "far" to agree with: the game
// may end an action early, and Tyrell's clock follows the game's (simulate:
// minutes since the first midnight). Time walk (Esper) is off.
// ---------------------------------------------------------------------------

// How fast each need rises, per game hour, before a villager's own nature
// scales it (mindRates); 0 for the needs the valley moves, which the game
// writes in (villager.js and minds.js work them out).
const MIND_RISE = { hunger: 0.085, thirst: 0.08, tired: 0.045, lonely: 0.05, bored: 0.06, craving: 0.04, industry: 0.12 };
// The needs that can break through what someone's doing when they get urgent;
// the rest color a day but never break into it.
const MIND_VITAL = new Set(['hunger', 'thirst', 'tired']);
// Asleep, the other needs rise at about a third of their pace and tiredness
// not at all; a night's sleep takes off this much tiredness over its length
// (about a sixth an hour; a rough night less).
const MIND_SLEEP_RATES = { hunger: 0.35, thirst: 0.35, lonely: 0.35, bored: 0.35, craving: 0.35, tired: 0 };
const MIND_SLEEP = { sleep: 2, lodge: 2, sleep_rough: 1.2 };
// Tyrell's settings (its docs, deciding.md): habits learned at Merryfolk's
// pace and kept to its range, no weight for the walk (the game picks the
// nearest spot), half an hour before something that failed is tried again,
// and a short log (it goes in the save).
const MIND_CONFIG = { logSize: 200, decisions: 6, habitFast: 0.1, habitSlow: 0.05, habitMin: 0.35, habitMax: 2.2, travelScale: 1e9, backoff: 30, idle: 10 };
// The multipliers score() gives that Tyrell works out for itself.
const MIND_OWN = new Set(['habit', 'instinct', 'did it last']);
// Cradle's settings: a Merryfolk year is a day, and its stages; the game
// keeps the rest of a life (it ages folk at its own pace, matches its own
// couples, has its own babies and sees its elders off on adventures), so
// Cradle neither pairs, nor has children, nor lets anyone die of its own
// accord. Fellowship keeps the couples and the families' sentiments; the
// game works out who meets whom (Tyrell has no places for them to meet in).
const MIND_MODULES = {
  cradle: { year: 1440, stages: [['baby', 0], ['child', BABY_DAYS], ['adult', CHILD_DAYS], ['elder', ELDER_DAYS]], lifespan: [1e9, 1e9], fertile: [1e9, 1e9], fertility: 0, autoPair: null },
  fellowship: { meetGain: 0, imitation: 0, decay: 0, forget: 0, sentiments: 8 },
  reverie: { memoryCap: 16 },
  // the wizard's talks (threads.js): how a remark that lands strongly moves
  // their fondness for him (the game's regard), and the lines' topics
  voice: {
    offers: 3, choices: 3, theirs: 0.3, strong: 2, greet: 'greet', bye: 'bye.them', close: 'close.patience', react: 'react',
    onWell: [() => { const T = Play.talk; if (T) addRegard(T.v, 0.015); }],
    onBadly: [() => { const T = Play.talk; if (T) { (T.flags || (T.flags = {})).misjudged = true; addRegard(T.v, -0.02); } }],
  },
};

// The drives and habits of a villager, as the game reads and writes them:
// with Tyrell, its needs and habits; before they join it, their own. (Every
// villager's view has the same getters and setters, which find the villager
// through the view's hidden _v, so the game's reads of any villager's needs
// all take the same quick path.)
function mindView(v, keys, kind, read, write) {
  const o = {}, ix = MIND_IX[kind], acc = MIND_ACC[kind];
  Object.defineProperty(o, '_v', { value: v });
  for (const k of keys) {
    if (ix[k] === undefined) ix[k] = Object.keys(ix).length;
    const i = ix[k];
    Object.defineProperty(o, k, acc[k] || (acc[k] = { get() { return read(this._v, k, i); }, set(x) { write(this._v, k, x, i); }, enumerable: true }));
  }
  return o;
}
// (each need, habit and skill has a number of its own, for the quick caches)
const MIND_ACC = { drives: {}, habits: {}, skills: {} }, MIND_IX = { drives: {}, habits: {}, skills: {} };
function mindDrives(v, init) {
  v._md = { ...init };
  v._nb = null; v._nbi = []; v._pid = 'v' + v.id; v._ver = 0;
  v._ncAt = []; v._ncLv = []; v._ncGen = 0; v._ncVer = -1; v._ncNow = -1;
  return mindView(v, DRIVES, 'drives', (u, d, i) => Shell.need(u, d, i), (u, d, x, i) => Shell.setNeed(u, d, x, i));
}
function mindHabits(v, init) {
  v._mh = { ...init };
  v._hcAt = []; v._hcLv = []; v._hcGen = 0; v._hcVer = -1; v._hcW = null;
  return mindView(v, Object.keys(ACTIONS), 'habits', (u, k, i) => Shell.habit(u, k, i), (u, k, x) => Shell.setHabit(u, k, x));
}
// A villager's skills as the game reads and writes them (points, 0 to 100).
function mindSkillView(v, init) {
  v._ms = { ...init };
  v._tr = null;
  return mindView(v, SKILLS, 'skills', (u, s) => Shell.skill(u, s), (u, s, x) => Shell.setSkill(u, s, x));
}
// When Cradle has someone born: the game's age is what they were at the last
// midnight (they grow a year, a day, each midnight), so Cradle's age runs
// from it through the day and they agree at every midnight.
function mindBorn(now, age) { return Math.round((Math.floor(now / 1440) - age) * 1440 * 100) / 100; }
// Where a villager is, to Tyrell: a place of their own (the game keeps where
// they really are), so what they do is done "here", and nobody meets anybody
// in the minds (the game works out who's near whom).
const mindPlace = (id) => 'at_v' + id;
// Is this villager's mind Tyrell's just now?
function minded(v) { return Shell.on && v._mw === Shell.gen && !v.leaving; }

// The genome as Delos carries it: genetics.js's genes (looks with alleles, a
// sex, thirteen traits, talents for the nine skills, inborn tastes for every
// action and for each food), so that children are made in Tyrell from both
// parents, as genetics.js made them: looks one parent's or the other's, eye
// color, freckles and curls by dominance (so they skip a generation), the
// traits mostly one parent's with a share of both and a little of their own,
// and the odd mutation (a hair color, a trait jumping, a natural gift).
function mindGenome(w) {
  const d = w.delos, idx = (list) => list.map((_, i) => String(i));
  d.gene({ id: 'sex', alleles: ['f', 'm'], copies: 1 });
  d.gene({ id: 'eyes', alleles: EYE_ALLELES.slice(), weights: [5, 2, 1.5, 2.5], mutate: 0.04 });
  d.gene({ id: 'freckles', alleles: ['0', '1'], weights: [3, 1], mutate: 0.03 }); // (freckled only with two copies)
  d.gene({ id: 'curls', alleles: ['0', '1'], weights: [7, 3] });
  d.gene({ id: 'chrome', alleles: ['1', '0'], weights: [0, 1] }); // (one copy shows: rift-blood)
  d.gene({ id: 'hair', alleles: HAIR_COLS.slice(), copies: 1, mutate: 0.06 });
  d.gene({ id: 'vest', alleles: VEST_COLS.slice(), copies: 1, mutate: 0.4 });
  d.gene({ id: 'shirt', alleles: SHIRT_COLS.slice(), copies: 1, mutate: 1 }); // (whatever comes to hand)
  d.gene({ id: 'legs', alleles: LEG_COLS.slice(), copies: 1 });
  d.gene({ id: 'style', alleles: ['0', '1', '2'], copies: 1 });
  d.gene({ id: 'garment', alleles: ['0', '1'], weights: [0.55, 0.45], copies: 1 });
  d.gene({ id: 'neon', alleles: idx(NEON_COLS), copies: 1 });
  d.look({ id: 'skin', founders: [0, SKIN_TONES.length - 1], bounds: [0, SKIN_TONES.length - 1], cross: 0, noise: 0.7, round: true });
  d.look({ id: 'rift', founders: [0, 0], bounds: [0, 1], cross: 0, noise: 0 });
  for (const f in FOODS) d.look({ id: 'food_' + f, founders: [0.7, 1.3], bounds: [0.5, 1.5], cross: 1, noise: 0.1 });
  for (const t of TRAITS) d.trait({ id: t, founders: [0.1, 0.95], bounds: [0.03, 1], cross: 0.65, noise: 0.1 });
  for (const s of SKILLS) d.talent({ id: s, founders: s === 'tinkering' ? [0.05, 0.45] : [0.15, 1], bounds: [0.05, 1], cross: 0.7, noise: 0.08, express: (a) => Math.round((0.4 + a * 1.2) * 1e4) / 1e4 });
  for (const k in ACTIONS) d.instinct({ id: k, founders: [0.8, 1.25], bounds: [0.6, 1.4], cross: 0, noise: 0.1 });
}
// The game's genes as a Delos genome, and back.
function genomeOfGenes(g) {
  const two = (p) => (Array.isArray(p) ? p : [0, 0]).map(String);
  const looks = { skin: g.skin, rift: g.rift || 0 };
  for (const f in FOODS) looks['food_' + f] = g.food[f] ?? 1;
  return {
    genes: { sex: [g.sex || 'm'], eyes: (g.eyes || ['B', 'B']).slice(), freckles: two(g.freckles), curls: two(g.curls), chrome: two(g.chrome), hair: [g.hair], vest: [g.vest], shirt: [g.shirt], legs: [g.legs], style: [String(g.style)], garment: [String(g.garment)], neon: [String(g.neon)] },
    traits: Object.fromEntries(TRAITS.map((t) => [t, g[t]])), talents: { ...g.apt }, instincts: { ...g.taste }, looks,
  };
}
function genesOfGenome(G, mutations = []) {
  const one = (k) => (G.genes[k] ? G.genes[k][0] : undefined);
  const g = {
    sex: one('sex'), skin: G.looks.skin, hair: one('hair'), vest: one('vest'), shirt: one('shirt'), legs: one('legs'), style: +one('style') || 0, garment: +one('garment') || 0,
    eyes: G.genes.eyes.slice(), freckles: G.genes.freckles.map(Number), curls: G.genes.curls.map(Number), chrome: G.genes.chrome.map(Number), rift: G.looks.rift || 0, neon: +one('neon') || 0,
    taste: { ...G.instincts }, food: {}, apt: { ...G.talents }, mutations,
  };
  for (const t of TRAITS) g[t] = G.traits[t];
  for (const f in FOODS) g.food[f] = G.looks['food_' + f] ?? 1;
  return g;
}
// What a mutation in a newborn is called (the ones genetics.js named).
function mutationWords(m) {
  if (m.kind === 'gene' && m.what === 'hair') return 'an unexpected hair color';
  if (m.kind === 'trait' && TRAIT_INFO[m.what]) return `${m.by > 0 ? 'unusually high' : 'unusually low'} ${TRAIT_INFO[m.what][0].toLowerCase()}`;
  if (m.kind === 'talent' && SKILL_LABEL[m.what]) return `a natural gift for ${SKILL_LABEL[m.what].toLowerCase()}`;
  return null;
}

// Skills as Tyrell keeps them: a level 0 to 1 (a hundred points in the game),
// learned at Merryfolk's pace: three-quarters of a point an hour at a talent
// of 1, scaled by their schooling (eduSkillMul) and by how much room is left
// below 110 points; skilled at 50, expert at 75, a master at 100.
function mindSkills(w) {
  const schooling = { name: 'schooling', input: (ctx) => { const v = Shell.byPid.get(ctx.person.id); return v ? eduSkillMul(v) : 1; }, range: [0, 10], out: [0, 10] };
  for (const s of SKILLS) w.skill({ id: s, label: SKILL_LABEL[s], max: 1.1, rate: 0.0072, diminish: 1, levels: [[0.5, 'skilled'], [0.75, 'expert'], [1, 'master']], learn: [schooling] });
}

// How fast each need rises for a villager this hour, against MIND_RISE (the
// old per-step rates of villager.js, by the hour: Tyrell keeps them steady
// between hours, settling everyone's needs on the hour).
function mindRates(v, h) {
  const g = v.genes, c = v.chem, baby = v.stage === 'baby', grown = v.isGrown();
  const r = {
    hunger: (baby ? 0.13 / 0.085 : 1) * (0.6 + g.appetite * 0.8) * (c.toxin > 0.4 ? 0.3 : 1) * (World.season === 'winter' ? 0.85 : 1),
    tired: (baby ? 2 : v.isChild() ? 0.06 / 0.045 : 1) * (0.8 + g.laziness * 0.4) * (v.isSick() ? 1.6 : 1) * (c.ale > 0.6 ? 1.5 : 1),
    lonely: (baby ? 0.09 / 0.05 : 1) * (0.4 + g.sociability),
    bored: 0.5 + g.curiosity,
    craving: grown ? g.pipeLove : 0,
    industry: 0,
  };
  if (grown && v.job && h >= 7 && h < 19) r.industry = (1.25 - g.laziness) * (v.stage === 'elder' ? 0.6 : 1);
  else if (grown && !v.job && h >= 7 && h < 18) r.industry = (typeof TUNE !== 'undefined' ? (v.stage === 'elder' ? TUNE.purpose.elderRate : TUNE.purpose.joblessRate) : 0.02) * (1.1 - g.laziness) / MIND_RISE.industry;
  return r;
}

// One of the game's actions as Tyrell knows it: what it relieves (its sat),
// how long it takes, and its pose; the rest of what decides it is the game's
// (MIND_MODULE). Actions with an appeal of their own (extra), or none at all,
// keep a sliver of base so the game's appeal can count.
function mindAction(a) {
  const relieves = {};
  for (const d in a.sat) if (a.sat[d] < 0 && DRIVES.includes(d)) relieves[d] = Math.round(-a.sat[d] * 1e4) / 1e4;
  if (MIND_SLEEP[a.id]) relieves.tired = MIND_SLEEP[a.id];
  const def = { id: a.id, label: a.label, minutes: a.dur < 1e6 ? [a.dur * 0.8, a.dur * 1.2] : 1e6, fill: false, pose: a.pose || 'idle' };
  if (Object.keys(relieves).length) def.relieves = relieves;
  if (a.extra || !def.relieves) def.base = 0.001;
  if (a.queued || ROUNDS[a.id]) def.rank = -1; // (a trade's main work is chosen as its round: mindRounds)
  const tags = [];
  if (MIND_SLEEP[a.id]) tags.push('sleep');
  if (a.social) tags.push('social');
  if (a.job) tags.push('work');
  if (a.outdoor) tags.push('outdoors');
  if (tags.length) def.tags = tags;
  if (MIND_SLEEP[a.id]) def.rates = MIND_SLEEP_RATES;
  else if (a.id === 'party') def.rates = { tired: 0.6 };
  return def;
}
// How firmly something the game set a villager doing holds against what
// Tyrell would rather: errands and minding hold like a story (only a break
// takes them off it); anything else gives way to an urgent need.
function mindRank(a) { return a.queued || a.manual ? 3 : 1.2; }

// A trade's round of jobs (work.js) as a Mentat plan. The task has the
// trade's main action's id, so it carries its habit and instinct and is
// weighed by the game as the trade always was (MIND_MODULE); its way is a
// slot for each of the trade's jobs, in work.js's order, and each slot is a
// task of its own with two ways: the job, or nothing this round. Whether a
// job is in this round is drawn as work.js drew it, by how much the valley
// wants it just now (the game's say: the plots unsown, the eggs laid, a full
// bucket), about five to a round, from the person's own random stream.
// Children, and anyone with a baby in their arms, just do the work itself.
const MIND_ROUND = 5;
function mindRounds(w) {
  for (const main in ROUNDS) {
    const defs = ROUNDS[main], rest = defs.find((d) => d.id.endsWith('_rest'));
    const jobs = defs.filter((d) => d !== rest).map((d, i) => [d, i]).sort((x, y) => (ORDER[x[0].id] || 5) - (ORDER[y[0].id] || 5) || x[1] - y[1]).map(([d]) => d);
    const step = (id) => (id === main ? { action: id } : id); // (the main action is a step of some rounds: as an action, not this task again)
    const steps = jobs.map((d, i) => {
      const id = `${main}#${i}`;
      w.task({ id, label: d.label || d.a.label, rank: -1, methods: [
        { name: 'this round', if: [(ctx) => mindRoundDraw(ctx, main, d)], do: Array.from({ length: d.repeat || 1 }, () => step(d.id)) },
        { name: 'not this round', do: [] },
      ] });
      return id;
    });
    // the sit at the end, after a proper round; and the work itself, if nothing else was wanted
    if (rest) { w.task({ id: `${main}#rest`, label: rest.a.label, rank: -1, methods: [{ if: [(ctx) => mindRoundCount(ctx) >= 3], do: [rest.id] }, { do: [] }] }); steps.push(`${main}#rest`); }
    w.task({ id: `${main}#none`, label: ACTIONS[main].label, rank: -1, methods: [{ if: [(ctx) => mindRoundCount(ctx) === 0], do: [{ action: main }] }, { do: [] }] });
    steps.push(`${main}#none`);
    const ad = mindAction(ACTIONS[main]);
    w.task({ id: main, label: ACTIONS[main].label, relieves: ad.relieves, base: ad.base, tags: ad.tags, methods: [
      { name: 'a round of jobs', if: [(ctx) => { const v = Shell.byPid.get(ctx.person.id); return !!v && v.isGrown() && !v._arms; }], do: steps },
      { name: 'just the work', do: [{ action: main }] },
    ] });
  }
}
// how many jobs this round has drawn so far (the game keeps the count, by the plan's start)
function mindRoundCount(ctx) { const v = Shell.byPid.get(ctx.person.id), p = ctx.person; return v && v._rd && p.plan && v._rd.at === p.plan.started ? v._rd.n : 0; }
function mindRoundDraw(ctx, main, d) {
  const v = Shell.byPid.get(ctx.person.id), p = ctx.person;
  if (!v || !p.plan) return false;
  const h = (ctx.world.now % 1440) / 60;
  const want = (x) => { const n = x.need ? x.need(v, h) : 1; return n > 0 && !(x.a.avail && !x.a.avail(v, h)) ? n * (x.id === v._lastSub ? 0.3 : 1) : 0; };
  if (!v._rd || v._rd.at !== p.plan.started) v._rd = { at: p.plan.started, n: 0 };
  const mine = want(d);
  if (!(mine > 0)) return false;
  let total = 0;
  for (const x of ROUNDS[main]) if (!x.id.endsWith('_rest')) total += want(x);
  const yes = ctx.world.stream(p).chance(Math.min(1, (mine * MIND_ROUND) / total));
  if (yes) v._rd.n++;
  return yes;
}

// The Common Store as Ceres keeps it: a place, 'store', whose stock is the
// village's goods. Village.stores reads and writes it (MindStore); what's
// made and used through Village.produce and Village.use is counted as Ceres
// counts production, and anything else (a caravan's trade, spoilage, a hard
// start) sets the stock without counting, as the game's own ledger did. The
// Store's caps stay the game's (storeCap: they grow with the buildings).
// Each production chain's link is a Ceres chain, piling up past half the
// first good's cap while the next is down to a sixth or so of its own.
function mindStore(w) {
  w.place({ id: 'store', label: 'the Common Store' });
  for (const c of CHAINS) w.ceres.chain({ id: `${c.from}>${c.to}`, label: c.say, goods: [c.from, c.to], store: 'store', get plenty() { return storeCap(c.from) * 0.5; }, get short() { return storeCap(c.to) * 0.15; } });
}
const MindStore = {
  plain: {}, flow: 0, proxy: null,
  on() { return Shell.on && !!Shell.w; },
  stock() { const st = Shell.w.s.places.store; return (st && st.stock) || {}; },
  // into the minds: their stock is the Store's (made afresh from the game's for a new world, or one saved before)
  start(w) {
    const st = w.s.places.store;
    if (!st || !st.stock || !Object.keys(st.stock).length) Shell.input('mf.store', [{ ...this.plain }]);
  },
  // out of them: the game keeps the stock itself again
  stop() { if (this.on()) this.plain = { ...this.stock() }; },
  make() {
    this.proxy = new Proxy({}, {
      get: (_, k) => (typeof k !== 'string' ? undefined : this.on() ? this.stock()[k] : this.plain[k]),
      set: (_, k, x) => {
        if (!this.on()) { this.plain[k] = x; return true; }
        const before = this.stock()[k] || 0;
        if (Number.isFinite(x) && Math.abs(x - before) > 1e-9) Shell.input(this.flow ? 'stock' : 'mf.store', this.flow ? ['store', k, x - before] : [{ [k]: x }]);
        return true;
      },
      has: (_, k) => k in (this.on() ? this.stock() : this.plain),
      deleteProperty: (_, k) => { if (this.on()) Shell.input('mf.store', [{ [k]: 0 }]); else delete this.plain[k]; return true; },
      ownKeys: () => Object.keys(this.on() ? this.stock() : this.plain),
      getOwnPropertyDescriptor: (_, k) => { const o = this.on() ? this.stock() : this.plain; return k in o ? { value: o[k], writable: true, enumerable: true, configurable: true } : undefined; },
    });
  },
  // Village.reset makes a fresh plain object: the Store takes it over
  wrap() { if (Village.stores !== this.proxy) { this.plain = Village.stores; Village.stores = this.proxy; } },
};

// ---- feelings, memories and the folk they know: Reverie and Fellowship ----
// The passing feelings (moodlets.js's MOODLETS) are Reverie's feelings, kept
// as the game kept them (one of a kind per cause, a few of a kind refreshed
// whatever the cause, a dozen at most, the weakest going first, and a while
// to last that the game may set); the memories are Reverie's memories,
// fading as Reverie's do (a strong one lasts longer), a dozen and a half
// kept; and how they feel about each other (rel), the spark between two
// (love) and the reasons why (sentiments: hearts.js) are Fellowship's regard,
// attraction and sentiments. The game reads and writes them as it always
// did (villager.js's moodlets, memories, rel, love and sent are views of the
// minds), and its own rules for them stand: the mood is the game's (needs
// and feelings, as minds.js and moodlets.js weigh them, and Reverie's mood
// reads it), friendship is symmetric where the game makes it so, and nothing
// drifts or is forgotten in the minds that the game doesn't let go itself.
const MIND_FEEL_ONE = new Set(['soaked', 'sunshine', 'festival', 'well_slept', 'slept_rough', 'made_piece']);
function mindFeelings(w) {
  for (const k in MOODLETS) { const M = MOODLETS[k]; w.reverie.feeling({ id: k, label: M[0], weight: M[1], minutes: Math.min(M[2], 1e6), stack: 12, stackMul: 1, stress: 0 }); }
  w.reverie.mood = (id) => { const v = Shell.byPid.get(id); return v ? v.mood() : 0.5; };
}
// a memory's kind keeps how it felt: 'mf:-2' .. 'mf:3'
const mindMemKind = (val) => 'mf:' + (Math.round(val) || 0);
const mindMemVal = (k) => (k && k.startsWith('mf:') ? +k.slice(3) || 0 : null);
// what the game keeps of someone's feelings, memories and relationships, before they join the minds or after they leave
function mindHearts(v, o) {
  v._moodlets = o.moodlets ?? [];
  v._memories = o.memories ?? [];
  v._rel = { ...(o.rel || {}) };
  v._love = { ...(o.love || {}) };
  v._sent = { ...(o.sent || {}) };
}
// A dictionary of the game's (rel, love, sent: by the other's id) that is
// Fellowship's when the villager is in the minds, and their own otherwise.
function mindDict(v, kind) {
  const own = () => v['_' + kind];
  const on = () => Shell.on && v._mw === Shell.gen;
  return new Proxy({}, {
    get: (_, k) => (typeof k !== 'string' ? undefined : on() ? Shell.rel(v, kind, k) : own()[k]),
    set: (_, k, x) => { if (on()) Shell.setRel(v, kind, k, x); else own()[k] = x; return true; },
    has: (_, k) => (on() ? Shell.rel(v, kind, k) !== undefined : k in own()),
    deleteProperty: (_, k) => { if (on()) Shell.setRel(v, kind, k, undefined); else delete own()[k]; return true; },
    ownKeys: () => (on() ? Shell.relKeys(v, kind) : Object.keys(own())),
    getOwnPropertyDescriptor: (_, k) => { const x = on() ? Shell.rel(v, kind, k) : own()[k]; return x === undefined ? undefined : { value: x, writable: true, enumerable: true, configurable: true }; },
  });
}

// The game's say in every choice: score()'s reasons, as Tyrell factors.
const MIND_MODULE = {
  name: 'merryfolk',
  attach(w) { this.w = w; },
  block(p, c) { if (c.layer === 'plan') return null; const j = Shell.judge(p, c); return j ? j.blocked : null; },
  consider(p, c) {
    const j = Shell.judge(p, c);
    if (!j || j.blocked) return null;
    const out = [];
    // the appeal of its own that score() adds to the relief
    const base = c.parts.length ? c.parts[0][1] : 0;
    if (j.appeal > 1e-9 && base > 0) out.push(['appeal', (base + j.appeal) / base]);
    for (const f of j.factors) out.push(f);
    return out;
  },
  rate(p, need) { const v = Shell.byPid.get(p.id); return v && v._rates && v._rates[need] !== undefined ? v._rates[need] : 1; },
  hour() { Shell.hourly(); },
  started(p) { Shell.touch(p.id); },
  ended(p, d, frac, interrupted) { Shell.touch(p.id); Shell.ends[p.id] = { seq: d.seq, interrupted }; },
};

const Shell = {
  w: null, on: false, gen: 0, byPid: new Map(), ends: {}, picking: null, quiet: null, muts: {}, _jk: null, _jv: null,
  pid: (v) => 'v' + v.id,
  // their person in the running world, if they're about
  live(v) {
    if (!minded(v)) return null;
    const p = this.w.s.people[v._pid];
    return p && p.status === 'active' ? p : null;
  },

  // ---- making the world: on founding a village and on loading one --------
  start() {
    if (typeof Tyrell === 'undefined') return; // (without the engine, the minds are the old ones)
    this.stop();
    if (!Game.mindSeed) Game.mindSeed = 'mf-' + Tyrell.hash(String(World.seed), ...Game.villagers.slice(0, 12).map((v) => v.first + v.id));
    const w = (this.w = Tyrell.create({
      seed: Game.mindSeed, start: Game.time, modules: ['reverie', 'fellowship', 'cradle', 'delos', 'mentat', 'ceres', 'cityspeak', 'voice'], moduleConfig: MIND_MODULES, esper: { on: false },
      config: Object.assign({}, MIND_CONFIG, typeof Dev !== 'undefined' && Dev.on ? { logSize: 2000, decisions: 12 } : {}),
      extra: [MIND_MODULE], shell: { travel: () => 0 },
    }));
    for (const d of DRIVES) w.need(Object.assign({ id: d, rise: MIND_RISE[d] || 0, start: 0.2, label: DRIVE_LABEL[d] }, MIND_VITAL.has(d) ? {} : { urgent: 1.1 }));
    for (const k in ACTIONS) w.action(mindAction(ACTIONS[k]));
    for (const v of Game.villagers) w.place({ id: mindPlace(v.id) });
    w.action({ id: 'mf_busy', label: 'busy', minutes: 1e6, rank: -1, fill: false });
    mindGenome(w);
    mindSkills(w);
    mindFeelings(w);
    mindRounds(w);
    mindStore(w);
    this.inputs(w);
    // (a relationship Fellowship makes for the first time: the index of them is out of date)
    const fs = w.fellowship, rec = fs.record;
    fs.record = function (a, b) { if (!w.s.mod.fellowship.rel[a + '>' + b]) Shell.relMade++; return rec.call(this, a, b); };
    // a newborn's mutations, as Delos makes them (Shell.born names them)
    w.on('mutated', (e) => { if (this.muts[e.id]) this.muts[e.id].push(e); });
    // a named level of a skill reached: remembered, felt, and the big ones told
    w.on('skill', (e) => {
      const v = this.byPid.get(e.id);
      if (!v || !v.isGrown()) return;
      const label = SKILL_LABEL[e.skill].toLowerCase();
      v.remember(`Became ${e.level === 'expert' ? 'an' : 'a'} ${e.level} hand at ${label}.`, 1);
      feel(v, 'skill_up', label);
      if (e.level !== 'skilled') chronicle(`${v.name()} has become ${e.level === 'master' ? 'a master' : 'an expert'} at ${label}.`, 'learn');
    });
    Tycho.minds.restore(w, Game.minds, { onError: (e) => { if (typeof noteError === 'function') noteError(e, 'loading the minds'); } });
    this.gen++; this.on = true; this.byPid.clear(); this.ends = {};
    MindStore.start(w);
    voiceDeclare();
    w.focus([]); // (nobody needs a body: the game draws them all, from its own tasks)
    this.sync();
  },
  stop() { MindStore.stop(); this.on = false; this.w = null; this.byPid.clear(); this.ends = {}; this.picking = null; this.quiet = null; this._jk = null; },

  // The game's own inputs (Tyrell records them as it does its own).
  inputs(w) {
    const mid = (r) => (Array.isArray(r) ? (r[0] + r[1]) / 2 : r);
    // needs the game moved: a level now, as the game saw it (with any relief
    // under way from what they're doing counted back in)
    w.defineInput('mf.needs', (id, levels) => {
      const p = w.s.people[id];
      if (!p) return;
      const d = p.doing, a = d && d.kind === 'act' ? w.actions.get(d.action) : null;
      const f = a && w.s.now > d.start ? clamp((w.s.now - d.start) / Math.max(1, d.end - d.start), 0, 1) : 0;
      for (const need in levels) {
        let x = levels[need];
        if (f && a.relieves && a.relieves[need] !== undefined) x += mid(a.relieves[need]) * f;
        w.mind.setLevel(p, need, x);
      }
    });
    // what they'd learned before they had a mind of Tyrell's (an older save)
    w.defineInput('mf.habits', (id, hab) => { const p = w.s.people[id]; if (p) for (const k in hab) p.habits[k] = [hab[k], hab[k]]; });
    // the game put down what they were doing part way through: the relief so far, and think again
    w.defineInput('mf.stop', (id, frac) => {
      const p = w.s.people[id];
      if (!p || p.status !== 'active') return;
      const d = p.doing;
      if (d && d.kind === 'act' && frac > 0 && frac < 1 && w.s.now > d.start) d.end = d.start + (w.s.now - d.start) / frac;
      if (d) w.clock.rethink(p, 'put down'); else w.clock.think(p);
    });
    // the game set them doing something of its own (it holds at `rank`)
    w.defineInput('mf.do', (id, action, rank) => {
      const p = w.s.people[id];
      if (!p || p.status !== 'active') return null;
      const d = p.doing, last = p.last, lastEnd = p.lastEnd;
      if (d) {
        w.clock.interrupt(p, 'the game', true);
        if (d.start >= w.s.now - 1e-9) { p.last = last; p.lastEnd = lastEnd; } // (only just chosen: it doesn't count as done)
      }
      const act = w.actions.has(action) ? action : 'mf_busy';
      w.clock.act(p, { id: act, kind: 'action', place: p.place, rank, layer: rank > 0 ? 'story' : 'need', weight: 1, parts: [], fill: false, minutes: 1e6 });
      return p.doing ? p.doing.seq : null;
    });
    // how long the game expects what they're doing to take from now
    w.defineInput('mf.length', (id, seq, minutes) => {
      const p = w.s.people[id], d = p && p.doing;
      if (!d || d.seq !== seq || d.kind !== 'act') return null;
      const ns = w.nextSeq();
      d.seq = ns; d.end = w.s.now + Math.max(0.5, minutes);
      w.clock.schedule({ t: d.end, k: 'end', who: id, ref: ns });
      w.clock.scheduleChecks(p);
      return ns;
    });
    // back from a trip, with whatever their needs came to on the road
    w.defineInput('mf.back', (id, levels) => {
      const p = w.s.people[id];
      if (!p || p.status === 'active') return;
      p.status = 'active'; delete p.away; p.place = mindPlace(id.slice(1)); p.doing = null;
      for (const k in levels) w.mind.setLevel(p, k, levels[k]);
      w.clock.think(p);
    });
    // Who someone's parents and partner are, from the game (the founding
    // families, travelers who came as a couple, an older save): Cradle's and
    // Fellowship's record of them, without a wedding or a birth.
    w.defineInput('mf.kin', (id, parents, partner) => {
      if (!w.s.people[id]) return;
      if (parents.length && !w.cradle.st.parents[id]) w.cradle.st.parents[id] = parents.slice();
      if (partner && w.s.people[partner] && w.fellowship.partner(id) !== partner) {
        w.fellowship.applyPartners(id, partner);
        w.fellowship.applySentiment(id, partner, 'my partner', 0.3);
        w.fellowship.applySentiment(partner, id, 'my partner', 0.3);
      }
    });
    // a place of their own, for someone from minds saved when they shared one
    w.defineInput('mf.place', (id, place) => { const p = w.s.people[id]; if (p) { p.place = place; if (p.doing && p.doing.kind === 'act') p.doing.place = place; } });
    // the Store's stock set outright, not counted as made or used (a caravan's
    // trade, the day's spoilage, a new village's stock)
    w.defineInput('mf.store', (vals) => { const st = w.ring.state('store'); st.stock || (st.stock = {}); for (const k in vals) st.stock[k] = Math.max(0, Number(vals[k]) || 0); });
    // the game set them to a task of Tyrell's (a trade's round, when the working day starts)
    w.defineInput('mf.plan', (id, task, rank) => {
      const p = w.s.people[id];
      if (!p || p.status !== 'active' || !w.tasks.has(task)) return null;
      if (p.doing) w.clock.interrupt(p, 'the game', true);
      w.clock.begin(p, { id: task, kind: 'task', place: p.place, rank, layer: 'story', weight: 1, parts: [], fill: false });
      return p.doing ? p.doing.seq : null;
    });
    // The game's own menus begin a thread of the wizard's talk (threads.js):
    // something else (Voice opens it, as at the hub), or with his opening
    // already said, the approach it came with landing first (passing the time;
    // a situation's way in, at the beat it led to).
    w.defineInput('mf.thread', (by, id, ap, beat, door) => {
      const V = w.voice, talk = V.st && V.st.talks[by], def = V.threads.get(id);
      if (!talk || !def) return null;
      talk.lines = []; V.live = talk;
      try {
        if (talk.thread) V.finishThread(talk, false);
        if (!talk.over) {
          if (ap && door) V.land(talk, ap);
          if (beat && def.beats[beat]) {
            talk.thread = { id, beat, label: typeof def.label === 'function' ? def.label(V.ctx(talk)) : def.label ?? id };
            if (!talk.done.includes(id)) talk.done.push(id);
            V.runBeat(talk, beat);
          } else V.enter(talk, def, false, !!door);
        }
        if (!talk.thread && !talk.over && V.theirTurn(talk)) return V.view(talk, false);
        V.refresh(talk);
      } finally { V.live = null; }
      return V.view(talk, false);
    });
    // Feelings as the game keeps them (moodlets.js's feel): one of a kind per
    // cause, a few kinds refreshed whatever the cause, a dozen at most.
    w.defineInput('mf.feel', (id, key, x, until) => {
      const def = w.reverie.feelingDefs.get(key), st = w.s.mod.reverie;
      if (!w.s.people[id] || !def || !st) return;
      const now = w.s.now, list = (st.f[id] || []).filter((f) => f.until > now);
      const old = list.find((f) => f.id === key && (f.cause || '') === x) || (MIND_FEEL_ONE.has(key) && list.find((f) => f.id === key));
      if (old) { old.until = Math.max(old.until, until); if (x) old.cause = x; else delete old.cause; }
      else { const f = { id: key, t: now, until, w: def.weight }; if (x) f.cause = x; list.push(f); w.log('felt', id, { feeling: key, label: def.label, ...(x ? { cause: x } : {}) }); }
      if (list.length > 12) { list.sort((a, b) => Math.abs(b.w) - Math.abs(a.w)); list.length = 12; }
      st.f[id] = list;
    });
    // their feelings set outright (some put aside, or an older save's), [key, cause, until] each
    w.defineInput('mf.feelings', (id, list) => {
      const st = w.s.mod.reverie;
      if (!w.s.people[id] || !st) return;
      const keep = (st.f[id] || []).filter((f) => !MOODLETS[f.id]);
      st.f[id] = keep.concat(list.filter(([k]) => w.reverie.feelingDefs.has(k)).map(([k, x, until]) => { const f = { id: k, t: w.s.now, until, w: w.reverie.feelingDefs.get(k).weight }; if (x) f.cause = x; return f; }));
    });
    // a memory, with how it felt (-3 to 3) as its kind and how much it mattered
    w.defineInput('mf.remember', (id, text, val) => w.reverie.applyRemember(id, { k: mindMemKind(val), imp: clamp(4 + Math.abs(val), 1, 10), text }));
    // their memories set outright (some let go, or an older save's), [day, text, val] each, newest first
    w.defineInput('mf.memories', (id, list) => {
      const st = w.s.mod.reverie;
      if (!w.s.people[id] || !st) return;
      const keep = (st.m[id] || []).filter((m) => mindMemVal(m.k) === null);
      st.m[id] = keep.concat(list.slice().reverse().map(([d, text, val]) => ({ k: mindMemKind(val), t: Math.min(w.s.now, (d - 1) * 1440 + 720), imp: clamp(4 + Math.abs(val), 1, 10), recalls: 0, text })));
    });
    // how one feels about another (rel), the spark (love) and the reasons why
    // (sent), to the last decimal (a friendship grows by the ten-thousandth in
    // a natter, a spark by less: rounding would stop them growing)
    w.defineInput('mf.rel', (kind, a, b, x) => {
      const f = w.fellowship, r = f.record(a, b);
      if (kind === 'rel') r.r = clamp(Number(x) || 0, -1, 1);
      else if (kind === 'love') r.a = clamp(Number(x) || 0, -1, 1);
      else r.s = r.s.filter((s) => !s.label.includes('|')).concat((x || []).map((s) => ({ label: s.tag + '|' + (s.why || ''), by: SENT[s.tag] ? SENT[s.tag][1] * 0.1 : 0, until: s.until })));
    });
    // an older save's feelings, memories and relationships, as the villager kept them
    w.defineInput('mf.hearts', (id, h) => {
      const f = w.fellowship;
      for (const kind of ['rel', 'love']) for (const o in h[kind] || {}) { const r = f.record(id, 'v' + o); if (kind === 'rel') r.r = clamp(Number(h.rel[o]) || 0, -1, 1); else r.a = clamp(Number(h.love[o]) || 0, -1, 1); }
      for (const o in h.sent || {}) { const r = f.record(id, 'v' + o); r.s = r.s.concat((h.sent[o] || []).filter((s) => s.until > w.s.now).map((s) => ({ label: s.tag + '|' + (s.why || ''), by: SENT[s.tag] ? SENT[s.tag][1] * 0.1 : 0, until: s.until }))); }
    });
    // a newborn named after the birth (the game names them by their looks)
    w.defineInput('mf.name', (id, name) => { const p = w.s.people[id]; if (p) { p.name = name; p.def.name = name; } });
    // the game ages folk at its own pace (a wizard's village's children grow
    // slower), so Cradle's record of when they were born follows it
    w.defineInput('mf.age', (id, days) => { const p = w.s.people[id]; if (p) p.born = mindBorn(w.s.now, days); });
  },
  iv: 0,
  input(name, args) { this.iv++; return this.w.input(name, args); },
  // an input about one villager: what the game wrote of their needs goes first
  tell(v, name, args) { this.flush(v, true); this.touch(args[0]); try { return this.input(name, args); } finally { this.touch(args[0]); } },
  // anything about someone in the minds changed: what was read of them is stale
  touch(pid) { const v = this.byPid.get(pid); if (v) v._ver++; },

  // ---- every step: the minds' clock first, then who's here -----------------
  advance(t) { if (t > this.w.now) this.w.advanceTo(t); },
  sync() {
    const here = new Set();
    for (const v of Game.villagers) {
      if (v.leaving) continue;
      here.add(v._pid);
      if (v._mw !== this.gen) this.join(v);
      else if (v.age !== v._age) { v._age = v.age; this.input('mf.age', [v._pid, v.age]); }
    }
    for (const [pid, v] of this.byPid) {
      if (here.has(pid)) continue;
      this.unhook(v);
      this.byPid.delete(pid);
      v._mw = -1;
      const p = this.w.s.people[pid];
      if (!p || p.status !== 'active') continue;
      if (v.leaving === 'trip') this.input('away', [pid, this.w.now + 1e7, 'off on an adventure', null]);
      else this.input('depart', [pid, v.leaving === 'final' ? 'adventure' : v.leaving || 'gone']);
    }
    for (const v of Game.villagers) { this.flush(v); if (v._tr && v._trH >= 0.25) this.flushTrain(v); }
  },
  // A villager leaves the minds (off on a trip or for good, or the minds
  // stop): what Tyrell knew of their needs, habits and skills goes back to
  // the villager, for the trip's record and for the archive.
  unhook(v) {
    if (!this.on || v._mw !== this.gen || v._unhooking) return;
    v._unhooking = true;
    try {
      this.flushTrain(v);
      const p = this.w.s.people[this.pid(v)];
      if (!p) return;
      for (const d of DRIVES) v._md[d] = this.need(v, d);
      v._nb = null;
      for (const k in ACTIONS) v._mh[k] = this.w.mind.habit(p, k);
      for (const s of SKILLS) v._ms[s] = this.skill(v, s);
      v._moodlets = this.moodlets(v); v._memories = this.memories(v);
      for (const kind of ['rel', 'love', 'sent']) { const o = {}; for (const k of this.relKeys(v, kind)) o[k] = this.rel(v, kind, k); v['_' + kind] = o; }
    } finally { v._unhooking = false; }
  },
  // a villager joins the minds (founding, birth, arrival), or comes back to them
  join(v) {
    const w = this.w, id = this.pid(v), p = w.s.people[id];
    this.byPid.set(id, v); v._mw = this.gen; v._pid = id; v._nb = null; v._ncVer = -1;
    v._rates = mindRates(v, w.hour);
    v._age = v.age;
    if (!w.ring.get(mindPlace(v.id))) w.place({ id: mindPlace(v.id) });
    if (!p) {
      const skills = {};
      for (const s of SKILLS) if (v._ms[s] > 0) skills[s] = Math.round(clamp(v._ms[s] / 100, 0, 1) * 1e5) / 1e5;
      this.input('person', [id, { name: v.name(), place: mindPlace(v.id), needs: { ...v._md }, skills, born: mindBorn(w.s.now, v.age), data: { vid: v.id } }]);
      this.input('genome', [id, genomeOfGenes(v.genes)]);
      const hab = {};
      for (const k in v._mh) if (Math.abs(v._mh[k] - 1) > 1e-6 && w.actions.has(k)) hab[k] = v._mh[k];
      if (Object.keys(hab).length) this.input('mf.habits', [id, hab]);
      this.hearts(v);
      const sp = v.spouse != null ? 'v' + v.spouse : null;
      if (v.parents.length || (sp && w.s.people[sp])) this.input('mf.kin', [id, v.parents.map((x) => 'v' + x), sp]);
      return;
    }
    if (p.status !== 'active') this.input('mf.back', [id, { ...v._md }]);
    else if (p.place !== mindPlace(v.id)) this.input('mf.place', [id, mindPlace(v.id)]); // (minds saved when they shared one)
    if (p.name !== v.name()) this.input('mf.name', [id, v.name()]);
    if (!w.s.mod.delos || !w.s.mod.delos.g || !w.s.mod.delos.g[id]) this.input('genome', [id, genomeOfGenes(v.genes)]); // (minds from before they had genomes)
    if (!this.hasHearts(id)) this.hearts(v); // (or before they had feelings, memories and friends)
  },
  // on the hour: everyone's needs settled at the old pace, then the new pace
  hourly() {
    const w = this.w;
    for (const [pid, v] of this.byPid) {
      const p = w.s.people[pid];
      if (!p || p.status !== 'active') continue;
      w.mind.settleRise(p);
      v._rates = mindRates(v, w.hour);
      this.touch(pid);
    }
  },

  // ---- needs and habits ---------------------------------------------------
  // (levels are read often, so each is kept until anything in the minds changes)
  need(v, d, i = MIND_IX.drives[d]) {
    if (v._nb !== null) { const x = i === undefined ? v._nb[d] : v._nbi[i]; if (x !== undefined) return x; }
    if (!this.on || v._mw !== this.gen) return v._md[d] ?? 0;
    return this.mindNeed(v, d, i);
  },
  // what the minds hold of a need now (kept until anything about them changes, or the clock moves)
  mindNeed(v, d, i = MIND_IX.drives[d]) {
    const now = this.w.s.now;
    if (v._ncVer !== v._ver || v._ncNow !== now) { v._ncVer = v._ver; v._ncNow = now; v._ncGen++; }
    if (i === undefined) return this.w.needOf(v._pid, d); // (not one of the game's needs)
    if (v._ncAt[i] === v._ncGen) return v._ncLv[i];
    v._ncAt[i] = v._ncGen;
    return (v._ncLv[i] = this.w.needOf(v._pid, d));
  },
  // A need the game moved: kept by the villager until it's told (at the end
  // of the step); the ones the valley moves (the chill, aches...) drift a
  // little every step, so they wait until they've moved enough, or a few
  // minutes have gone by.
  setNeed(v, d, x, i = MIND_IX.drives[d]) {
    x = Number.isFinite(x) ? clamp(x, 0, 1) : 0;
    if (!minded(v)) { v._md[d] = x; return; }
    if (Math.abs(x - this.need(v, d, i)) < 1e-9) return;
    if (!v._nb) { v._nb = {}; v._nbAt = Game.time; v._nbi.length = 0; }
    v._nb[d] = x; if (i !== undefined) v._nbi[i] = x;
    v._nbW = (v._nbW || 0) + 1;
  },
  flush(v, now) {
    if (!v._nb) return;
    if (!now && minded(v) && Game.time - v._nbAt < 5) {
      // (nothing written and nothing changed in the minds since the last look: still not moved enough)
      const t = Game.time, wn = this.w.s.now;
      if (v._nfT === t && v._nfN === wn && v._nfV === v._ver && v._nfW === v._nbW) return;
      let moved = false;
      for (const d in v._nb) if (MIND_RISE[d] || Math.abs(v._nb[d] - this.mindNeed(v, d)) > 0.01) { moved = true; break; }
      if (!moved) { v._nfT = t; v._nfN = wn; v._nfV = v._ver; v._nfW = v._nbW; return; }
    }
    const nb = v._nb, pid = this.pid(v);
    v._nb = null;
    if (minded(v)) { this.touch(pid); this.input('mf.needs', [pid, nb]); this.touch(pid); }
  },
  habit(v, k, i = MIND_IX.habits[k]) {
    if (!minded(v)) return v._mh[k] ?? 1;
    if (v._hcVer !== v._ver || v._hcW !== this.w) { v._hcVer = v._ver; v._hcW = this.w; v._hcGen++; }
    if (i !== undefined && v._hcAt[i] === v._hcGen) return v._hcLv[i];
    const x = this.w.mind.habit(this.w.s.people[v._pid], k);
    if (i !== undefined) { v._hcAt[i] = v._hcGen; v._hcLv[i] = x; }
    return x;
  },
  // a habit the game nudged (a pat, a tut-tut, a good example): Tyrell's reward
  // moves the fast weight, and a quarter as much the slow, so the habit by
  // 0.625 of it
  setHabit(v, k, x) {
    if (!Number.isFinite(x)) return;
    if (!minded(v)) { v._mh[k] = x; return; }
    const delta = x - this.habit(v, k);
    if (Math.abs(delta) > 1e-6) this.tell(v, 'reward', [this.pid(v), k, delta / 0.625]);
  },

  // ---- feelings, memories and relationships (Reverie and Fellowship) --------
  // what the villager kept of them themselves, into the minds
  hearts(v) {
    const w = this.w, id = v._pid, h = { rel: v._rel, love: v._love, sent: v._sent };
    if (Object.keys(h.rel).length || Object.keys(h.love).length || Object.keys(h.sent).length) this.input('mf.hearts', [id, h]);
    if (v._moodlets.length) this.input('mf.feelings', [id, v._moodlets.filter((m) => m.until > w.now).map((m) => [m.k, m.x || '', m.until])]);
    if (v._memories.length) this.input('mf.memories', [id, v._memories.map((m) => [m.d, m.t, m.v || 0])]);
  },
  hasHearts(id) {
    const rv = this.w.s.mod.reverie, rel = this.w.s.mod.fellowship.rel;
    if (rv && ((rv.f[id] && rv.f[id].length) || (rv.m[id] && rv.m[id].length))) return true;
    for (const k in rel) if (k.startsWith(id + '>')) return true;
    return false;
  },
  moodlets(v) {
    const st = this.w.s.mod.reverie, now = this.w.s.now;
    return ((st && st.f[v._pid]) || []).filter((f) => f.until > now && MOODLETS[f.id]).map((f) => ({ k: f.id, x: f.cause || '', until: f.until }));
  },
  setMoodlets(v, list) {
    const cur = this.moodlets(v), now = this.w.s.now;
    const live = (list || []).filter((m) => m && m.until > now && MOODLETS[m.k]);
    if (live.length === cur.length && live.every((m, i) => cur[i].k === m.k && cur[i].x === (m.x || '') && cur[i].until === m.until)) return;
    this.tell(v, 'mf.feelings', [v._pid, live.map((m) => [m.k, m.x || '', m.until])]);
  },
  feel(v, key, x, until) { this.tell(v, 'mf.feel', [v._pid, key, x || '', until]); },
  memories(v) {
    const st = this.w.s.mod.reverie;
    return ((st && st.m[v._pid]) || []).filter((m) => mindMemVal(m.k) !== null).sort((a, b) => b.t - a.t).map((m) => ({ d: Math.floor(m.t / 1440) + 1, t: m.text || '', v: mindMemVal(m.k) }));
  },
  setMemories(v, list) {
    const cur = this.memories(v);
    if (list.length === cur.length && list.every((m, i) => m.t === cur[i].t && m.d === cur[i].d)) return;
    this.tell(v, 'mf.memories', [v._pid, list.map((m) => [m.d, m.t, m.v || 0])]);
  },
  remember(v, text, val) { this.tell(v, 'mf.remember', [v._pid, text, val || 0]); },
  rel(v, kind, k) {
    const r = this.w.s.mod.fellowship.rel[(v._rp || (v._rp = v._pid + '>v')) + k];
    if (!r) return undefined;
    if (kind === 'rel') return r.r;
    if (kind === 'love') return r.a || 0;
    const now = this.w.s.now, s = r.s.filter((x) => x.label.includes('|') && (x.until === undefined || x.until > now)).map((x) => { const i = x.label.indexOf('|'); return { tag: x.label.slice(0, i), why: x.label.slice(i + 1), until: x.until }; });
    return s.length ? s : undefined;
  },
  setRel(v, kind, k, x) { this.input('mf.rel', [kind, v._pid, 'v' + k, kind === 'sent' ? (x || []).map((s) => ({ tag: s.tag, why: s.why, until: s.until })) : x === undefined ? 0 : x]); },
  relKeys(v, kind) {
    const w = this.w, at = this.iv + ':' + w.s.now, c = v._rkc || (v._rkc = {});
    if (c[kind] && c[kind].at === at && c[kind].w === w) return c[kind].keys.slice();
    const out = [];
    for (const k of this.relIndex().get(v._pid) || []) if (this.rel(v, kind, k) !== undefined) out.push(k);
    c[kind] = { at, w, keys: out };
    return out.slice();
  },
  // everyone's relationships with the villagers, by whose they are, in the
  // order Fellowship keeps them (one pass over them all, kept until a new
  // one is made: relMade)
  _ri: null, relMade: 0,
  relIndex() {
    const w = this.w, rel = w.s.mod.fellowship.rel;
    if (this._ri && this._ri.n === this.relMade && this._ri.rel === rel) return this._ri.m;
    const m = new Map();
    for (const key in rel) {
      const i = key.indexOf('>');
      if (i < 0 || key.charCodeAt(i + 1) !== 118) continue; // ('v': another villager)
      const a = key.slice(0, i), list = m.get(a);
      if (list) list.push(key.slice(i + 2)); else m.set(a, [key.slice(i + 2)]);
    }
    this._ri = { n: this.relMade, rel, m };
    return m;
  },

  // ---- skills -------------------------------------------------------------
  // Points, 0 to 100, from Tyrell's level (0 to 1.1, kept to the game's 100).
  skill(v, s) {
    if (!this.on || v._mw !== this.gen) return v._ms[s] ?? 0;
    const p = this.w.s.people[v._pid];
    return p ? Math.min(100, this.w.skills.level(p, s) * 100) : v._ms[s] ?? 0;
  },
  // a level set outright (a lesson, a story's gift, a newcomer's trade)
  setSkill(v, s, x) {
    if (!Number.isFinite(x)) return;
    if (!minded(v)) { v._ms[s] = x; return; }
    if (v._tr && v._tr[s]) this.flushTrain(v);
    if (Math.abs(x - this.skill(v, s)) > 1e-6) this.tell(v, 'skill', [v._pid, s, clamp(x / 100, 0, 1)]);
  },
  // Practice from the game (an hour's work at a trade, watching a master):
  // hours of it, gathered and told to Tyrell a quarter hour at a time.
  practice(v, s, hours) {
    if (!(hours > 0)) return;
    if (!v._tr) { v._tr = {}; v._trH = 0; }
    v._tr[s] = (v._tr[s] || 0) + hours;
    v._trH += hours;
  },
  flushTrain(v) {
    const tr = v._tr;
    if (!tr) return;
    v._tr = null; v._trH = 0;
    if (!this.on || v._mw !== this.gen) return;
    for (const s of Object.keys(tr).sort()) this.tell(v, 'train', [v._pid, s, Math.round(tr[s] * 1e6) / 1e6]);
  },

  // ---- choosing ----------------------------------------------------------
  // score()'s reasons for an option, once per option (block, then consider)
  judge(p, c) {
    const v = this.byPid.get(p.id), a = ACTIONS[c.id];
    if (!v || !a) return null;
    const now = this.w.s.now;
    if (this._jk === p.id && this._jc === c.id && this._jt === now) return this._jv;
    // what they have in their care, once a moment
    if (v._careAt !== now) {
      const care = careLoad(v);
      v._arms = care.arms; v._kids = care.kids; v._stuck = care.stuck; v._flagging = care.flagging; v._careAt = now;
    }
    const ex = {};
    v.score(a, (now % 1440) / 60, ex);
    let out;
    if (ex.blocked) out = { blocked: ex.blocked };
    else {
      // what score() adds to the relief Tyrell counts itself: an appeal of its own, and being useful
      let sat = 0;
      for (const d in a.sat) { const red = -a.sat[d]; if (red > 0) sat += Math.pow(v.drives[d], 1.5) * red; }
      const relief = (ex.relief || []).reduce((t, r) => t + r[1], 0);
      out = { blocked: null, appeal: (ex.extra || 0) + Math.max(0, relief - sat), factors: (ex.mul || []).filter(([n]) => !MIND_OWN.has(n)) };
    }
    this._jk = p.id; this._jc = c.id; this._jt = now; this._jv = out;
    return out;
  },
  // nothing in hand: start what Tyrell chose (and if there's no way to do it,
  // say so, and it chooses again)
  decide(v, h, only) {
    const id = this.pid(v);
    for (let tries = 0; tries < 6; tries++) {
      const p = this.live(v);
      if (!p) { v.thinkAlone(h); return; }
      const d = p.doing;
      if (!d || d.kind !== 'act' || !ACTIONS[d.action]) break;
      if (d.seq === v._tyDone) { this.tell(v, 'mf.stop', [id, 0]); continue; } // (one already done with: think again)
      this.picking = { v, seq: d.seq, id: d.action };
      let ok = false;
      try { ok = v.begin(ACTIONS[d.action], h, this.stepExtra(p, d.action)); } finally { this.picking = null; }
      if (ok) return;
      this.tell(v, 'report', [id, 'failed', 'no way to do it just now']);
    }
    if (only) return;
    // nothing worked out: what they'd always do
    v.begin(v.stage === 'baby' ? ACTIONS.cradle : needsMinder(v) ? ACTIONS.putter : ACTIONS.stroll, h);
  },
  // How a step of a trade's round is begun: as work.js began a round's jobs,
  // each with its stint.
  stepExtra(p, id) {
    const plan = p.plan;
    if (!plan || !ROUNDS[plan.task]) return undefined;
    const def = ROUNDS[plan.task].find((d) => d.id === id);
    return { round: true, dur: def ? def.dur : undefined, main: plan.task };
  },
  // The working day starts (or anything else begins a trade's main work):
  // Tyrell plans the round, and the game begins its first job.
  round(v, main, h) {
    const p = this.live(v);
    if (!p || !this.w.tasks.has(main)) return false;
    this.tell(v, 'mf.plan', [v._pid, main, mindRank(ACTIONS[main])]);
    this.decide(v, h, true);
    return !!v.task;
  },
  // is a round of theirs still going (or set aside, to be taken up again)?
  inRound(v) { const p = this.live(v); return !!p && ((p.plan && !!ROUNDS[p.plan.task]) || p.suspended.some((x) => !!ROUNDS[x.task])); },

  // ---- the game's tasks as Tyrell's doings ----------------------------------
  // (villager.js's task is this property: every task set or put down comes here)
  taskSet(v, old, t) {
    const p = this.live(v);
    if (!p) return;
    const cur = p.doing ? p.doing.seq : null;
    // the same thing carried on in a new task (a natter that's begun, say)
    const same = !!(old && t && old.ty != null && old.ty === cur && t.ty == null && old.a.id === t.a.id);
    if (same && !t.chatLock) { t.ty = old.ty; return; }
    if (old && old.ty != null && old.ty === cur && this.quiet !== v && !same) this.ended(v, old);
    if (t && t.ty == null) {
      if (this.picking && this.picking.v === v && this.picking.id === t.a.id) t.ty = this.picking.seq;
      // (a natter both have stopped for is held to its end, as the game always
      // held one: hunger waits for it, and only a break comes first)
      else t.ty = this.tell(v, 'mf.do', [this.pid(v), t.a.id, t.chatLock ? 3 : mindRank(t.a)]) ?? -1;
    }
  },
  // the game is done with a task: how it went
  ended(v, task) {
    const id = this.pid(v), t0 = task.t0 ?? task.t, frac = t0 > 0 && t0 < 1e6 ? clamp((task.el || 0) / t0, 0, 1) : 0;
    this.correct(v, task, frac);
    this.flushTrain(v);
    v._tyDone = task.ty;
    if (task.done && frac >= 0.9) this.tell(v, 'report', [id, 'done', '']);
    else this.tell(v, 'mf.stop', [id, frac]);
    // a squabble isn't what anyone hoped of a natter
    if (task.data && task.data.quarrel && task.a.id === 'chat') this.tell(v, 'reward', [id, 'chat', -0.05]);
  },
  // What a task really relieved, where that differs from what Tyrell expected
  // of the action (a meal of their favorite, a natter with the innkeeper, a
  // squabble): the difference, for the share of it done, before Tyrell
  // applies its own.
  correct(v, task, frac) {
    if (!task.sat || task.sat === task.a.sat || !frac) return;
    const def = this.w.actions.get(task.a.id), rel = (def && def.relieves) || {};
    const mid = (r) => (Array.isArray(r) ? (r[0] + r[1]) / 2 : r);
    for (const d of new Set([...Object.keys(task.sat), ...Object.keys(rel)])) {
      if (!DRIVES.includes(d)) continue;
      const diff = Math.max(0, -(task.sat[d] || 0)) - (rel[d] !== undefined ? mid(rel[d]) : 0);
      if (Math.abs(diff) > 1e-6) v.drives[d] = v.drives[d] - diff * frac;
    }
  },
  // every step, for a villager with a task: has Tyrell moved on (something
  // mattered more, or its time ran out)? Then the game puts it down too.
  follow(v) {
    const t = v.task, p = this.live(v);
    if (!p) return;
    if (t.ty == null) { this.taskSet(v, null, t); return; } // (one set while Tyrell wasn't listening)
    if (p.doing && p.doing.seq === t.ty) return;
    const e = this.ends[p.id];
    this.quiet = v;
    try { if (e && e.seq === t.ty && !e.interrupted) v.finish(); else v.abort(); } finally { this.quiet = null; }
    v.thinkDelay = 0;
  },
  // Tyrell's doing lasts as long as the game expects the task to (the walk
  // there and the doing), so its relief comes at the game's pace, and never
  // ends before the game's own end.
  lengthen(v, task) {
    if (!(task.ty >= 0) || !(task.t < 1e6)) return;
    const p = this.live(v), d = p && p.doing;
    if (!d || d.seq !== task.ty) return;
    let minutes;
    if (!task._len) {
      if (task.t0 == null) task.t0 = task.t; // (what the game plans for the doing itself, once any round has set it)
      let walk = 0;
      if (task.phase === 'go') {
        if (v.path) { let x = v.x, y = v.y; for (let i = v.pathI; i < v.path.length; i++) { walk += Math.hypot(v.path[i][0] - x, v.path[i][1] - y); x = v.path[i][0]; y = v.path[i][1]; } }
        else if (task.target && task.target.other) walk = dist(v.x, v.y, task.target.other.x, task.target.other.y);
      }
      minutes = (walk / WALK_SPEED) * 1.4 + Math.max(0, task.t) + 3;
      task._len = true;
    } else if (d.end - this.w.now < Math.max(0, task.t) + 0.5) minutes = Math.max(0, task.t) + 5; // (running long)
    else return;
    const seq = this.tell(v, 'mf.length', [this.pid(v), task.ty, minutes]);
    if (seq != null) task.ty = seq;
  },

  // ---- families: Cradle and Delos --------------------------------------------
  // A baby is born in the minds: Cradle makes them, and Delos their genome
  // from both parents'. Returns the baby's genes (genetics.js's shape), or
  // null when the parents aren't both known to the minds (the old way, then).
  // (The other parent may be away, or gone: Delos keeps their genome.)
  born(mother, father, id, def) {
    if (!this.on || !minded(mother) || !father) return null;
    const w = this.w, pid = 'v' + id, pf = 'v' + father.id, g = w.s.mod.delos && w.s.mod.delos.g;
    if (w.s.people[pid] || !g || !g[mother._pid] || !g[pf]) return null;
    this.muts[pid] = [];
    if (!w.ring.get(mindPlace(id))) w.place({ id: mindPlace(id) });
    try {
      this.tell(mother, 'birth', [[mother._pid, pf], { ...def, home: mindPlace(id) }, pid]);
      const G = w.delos.genome(pid);
      return G ? genesOfGenome(G, this.muts[pid].map(mutationWords).filter(Boolean)) : null;
    } finally { delete this.muts[pid]; }
  },
  // a wedding
  pair(a, b) { if (minded(a) && minded(b)) this.tell(a, 'pair', [a._pid, b._pid]); },

  // ---- for the dev drawer and the console ------------------------------------
  why(v) { return this.on && this.w ? this.w.palantir.history(this.pid(v)) : []; },
  options(v) { const p = this.live(v); return p ? this.w.peek(() => this.w.mind.options(p)) : []; },
  describe(v) { return this.on && this.w.get(this.pid(v)) ? this.w.describe(this.pid(v)) : 'not in the minds'; },
};

// Every task a villager takes up or puts down is told to the minds.
Object.defineProperty(Villager.prototype, 'task', {
  configurable: true,
  get() { return this._task; },
  set(t) { const old = this._task; this._task = t; if (old !== t && Shell.on && !this.leaving) Shell.taskSet(this, old, t); },
});
// A villager's feelings, memories and relationships, as the game reads and
// writes them: with Tyrell, Reverie's and Fellowship's; before they join it
// (or after they leave), their own.
for (const [key, read, write] of [
  ['moodlets', (v) => Shell.moodlets(v), (v, x) => Shell.setMoodlets(v, x)],
  ['memories', (v) => Shell.memories(v), (v, x) => Shell.setMemories(v, x)],
]) {
  Object.defineProperty(Villager.prototype, key, {
    configurable: true,
    get() { return minded(this) ? read(this) : this['_' + key]; },
    set(x) { if (minded(this)) write(this, x || []); else this['_' + key] = x || []; },
  });
}
for (const kind of ['rel', 'love', 'sent']) {
  const own = '_' + kind + 'P';
  Object.defineProperty(Villager.prototype, kind, {
    configurable: true,
    get() { return this[own] || (this[own] = mindDict(this, kind)); },
    set(x) { const o = { ...(x || {}) }; if (minded(this)) { for (const k in o) this[kind][k] = o[k]; } else this['_' + kind] = o; },
  });
}
// A villager setting off (on a trip or for good) takes their needs, habits
// and skills with them from the minds, as they are that moment.
Object.defineProperty(Villager.prototype, 'leaving', {
  configurable: true,
  get() { return this._leaving; },
  set(x) { if (x && !this._leaving && Shell.on && this._mw === Shell.gen) { Shell.unhook(this); this._mw = -2; } this._leaving = x; },
});

// Saving: the minds go in the save as they are (Game.minds, Tyrell's own
// save), with the seed they were made from.
window.addEventListener('DOMContentLoaded', () => {
  registerField('minds', null, { nullish: true });
  registerField('mindSeed', null, { nullish: true });
  addHook('newVillage', () => { Shell.stop(); Game.minds = null; Game.mindSeed = null; });
  // (after the other features have had their say about the founding families)
  addHook('afterNewVillage', () => Shell.start());
  // (Tyrell's state as it stands, which the save writes out as it is: Tyrell's own save is a copy of the same)
  // (what the game had yet to tell it, the needs it moved and the practice, is told first)
  patch(window, 'save', (sv) => function () {
    if (Shell.on) {
      for (const v of Game.villagers) if (minded(v)) { Shell.flush(v, true); Shell.flushTrain(v); }
      Game.minds = Tycho.minds.stash(Shell.w);
    }
    return sv.apply(this, arguments);
  }, 'shell');
  // a save from before the minds were Tyrell's has none: they're made afresh,
  // from each villager's drives and habits as they were (mindDrives, join)
  patch(window, 'load', (ld) => function () { Shell.stop(); const r = ld.apply(this, arguments); if (r) Shell.start(); return r; }, 'shell');
  // the Common Store is Ceres's (MindStore): what's made and used is counted,
  // and the Steward's economy board reads Ceres's production report
  MindStore.make(); MindStore.wrap();
  patch(Village, 'reset', (rs) => function () { const r = rs.apply(this, arguments); MindStore.wrap(); return r; }, 'shell');
  for (const k of ['produce', 'use']) {
    const f = Village[k];
    Village[k] = function () { MindStore.flow++; try { return f.apply(this, arguments); } finally { MindStore.flow--; } };
  }
  patch(window, 'econRows', (er) => function () {
    if (!MindStore.on()) return er.apply(this, arguments);
    const r = Shell.w.ceres.production('store').places.store || {};
    return ECON_GOODS.map((k) => {
      const g = r[k] || { stock: 0, made: 0, used: 0 }, have = Math.floor(g.stock), made = Math.round(g.made), used = Math.round(g.used), net = made - used;
      return { k, have, cap: storeCap(k), made, used, net, days: net < 0 && have > 0 ? have / -net : null };
    }).filter((x) => x.have || x.made || x.used);
  }, 'shell');
  patch(window, 'bottlenecks', (bn) => function () {
    const out = bn.apply(this, arguments);
    if (!MindStore.on()) return out;
    const links = Shell.w.ceres.production('store').bottlenecks, short = new Set(CHAINS.filter((c) => links.some((b) => b.from === c.from && b.to === c.to)));
    return out.filter((x) => !CHAINS.includes(x) || short.has(x)).concat(CHAINS.filter((c) => short.has(c) && !out.includes(c)));
  }, 'shell');
  // the minds' clock runs to the end of the step first, then the villagers act on it
  // Every chance the valley takes in a step (who catches a cold, which job comes
  // next, what's said) is drawn from a stream of the minds' seed and the
  // moment, not Math.random, so a village lives the same however it's watched
  // (the drawing keeps Math.random, for what nothing saves).
  patch(window, 'simulate', (sim) => function (dt) {
    if (!Shell.on) return sim.call(this, dt);
    const r = new Tyrell.Stream(Game.mindSeed, 'valley', Math.round(Game.time * 1e4)), mr = Math.random;
    Math.random = () => r.next();
    try {
      Shell.sync(); Shell.advance(Game.time + dt);
      sim.call(this, dt);
      if (Shell.on) Shell.sync();
    } finally { Math.random = mr; }
  }, 'shell');
});
