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

// The drives and habits of a villager, as the game reads and writes them:
// with Tyrell, its needs and habits; before they join it, their own.
function mindDrives(v, init) {
  v._d = { ...init };
  v._nb = null; v._nc = null; v._pid = 'v' + v.id;
  const o = {};
  for (const d of DRIVES) Object.defineProperty(o, d, { enumerable: true, get: () => Shell.need(v, d), set: (x) => Shell.setNeed(v, d, x) });
  return o;
}
function mindHabits(v, init) {
  v._h = { ...init };
  const o = {};
  for (const k in ACTIONS) Object.defineProperty(o, k, { enumerable: true, get: () => Shell.habit(v, k), set: (x) => Shell.setHabit(v, k, x) });
  return o;
}
// Is this villager's mind Tyrell's just now?
function minded(v) { return Shell.on && v._mw === Shell.gen && !v.leaving; }

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
  if (a.queued) def.rank = -1;
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

// The game's say in every choice: score()'s reasons, as Tyrell factors.
const MIND_MODULE = {
  name: 'merryfolk',
  attach(w) { this.w = w; },
  block(p, c) { const j = Shell.judge(p, c); return j ? j.blocked : null; },
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
  w: null, on: false, gen: 0, pver: {}, byPid: new Map(), ends: {}, picking: null, quiet: null, _jk: null, _jv: null,
  pid: (v) => 'v' + v.id,
  // their person in the running world, if they're about
  live(v) {
    if (!minded(v)) return null;
    const p = this.w.s.people[this.pid(v)];
    return p && p.status === 'active' ? p : null;
  },

  // ---- making the world: on founding a village and on loading one --------
  start() {
    if (typeof Tyrell === 'undefined') return; // (without the engine, the minds are the old ones)
    this.stop();
    if (!Game.mindSeed) Game.mindSeed = 'mf-' + Tyrell.hash(String(World.seed), ...Game.villagers.slice(0, 12).map((v) => v.first + v.id));
    const w = (this.w = Tyrell.create({
      seed: Game.mindSeed, start: Game.time, modules: [], esper: { on: false },
      config: Object.assign({}, MIND_CONFIG, typeof Dev !== 'undefined' && Dev.on ? { logSize: 2000, decisions: 12 } : {}),
      extra: [MIND_MODULE], shell: { travel: () => 0 },
    }));
    for (const d of DRIVES) w.need(Object.assign({ id: d, rise: MIND_RISE[d] || 0, start: 0.2, label: DRIVE_LABEL[d] }, MIND_VITAL.has(d) ? {} : { urgent: 1.1 }));
    w.place({ id: 'valley' });
    for (const k in ACTIONS) w.action(mindAction(ACTIONS[k]));
    w.action({ id: 'mf_busy', label: 'busy', minutes: 1e6, rank: -1, fill: false });
    this.inputs(w);
    if (Game.minds && Game.minds.s) {
      try { w.load(Game.minds); } catch (e) { if (typeof noteError === 'function') noteError(e, 'loading the minds'); }
    }
    this.gen++; this.on = true; this.byPid.clear(); this.ends = {}; this.pver = {};
    w.focus([]); // (nobody needs a body: the game draws them all, from its own tasks)
    this.sync();
  },
  stop() { this.on = false; this.w = null; this.byPid.clear(); this.ends = {}; this.picking = null; this.quiet = null; this._jk = null; },

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
        w.clock.interrupt(p, 'the game', false);
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
      p.status = 'active'; delete p.away; p.place = 'valley'; p.doing = null;
      for (const k in levels) w.mind.setLevel(p, k, levels[k]);
      w.clock.think(p);
    });
  },
  input(name, args) { return this.w.input(name, args); },
  // an input about one villager: what the game wrote of their needs goes first
  tell(v, name, args) { this.flush(v, true); this.touch(args[0]); try { return this.input(name, args); } finally { this.touch(args[0]); } },
  // anything about someone in the minds changed: what was read of them is stale
  touch(pid) { this.pver[pid] = (this.pver[pid] || 0) + 1; },

  // ---- every step: the minds' clock first, then who's here -----------------
  advance(t) { if (t > this.w.now) this.w.advanceTo(t); },
  sync() {
    const here = new Set();
    for (const v of Game.villagers) {
      if (v.leaving) continue;
      here.add(this.pid(v));
      if (v._mw !== this.gen) this.join(v);
    }
    for (const [pid, v] of this.byPid) {
      if (here.has(pid)) continue;
      this.byPid.delete(pid);
      v._mw = -1;
      const p = this.w.s.people[pid];
      if (!p || p.status !== 'active') continue;
      if (v.leaving === 'trip') this.input('away', [pid, this.w.now + 1e7, 'off on an adventure', null]);
      else this.input('remove', [pid, v.leaving === 'final' ? 'adventure' : v.leaving || 'gone']);
    }
    for (const v of Game.villagers) this.flush(v);
  },
  // a villager joins the minds (founding, birth, arrival), or comes back to them
  join(v) {
    const w = this.w, id = this.pid(v), p = w.s.people[id];
    this.byPid.set(id, v); v._mw = this.gen; v._pid = id; v._nb = null; v._nc = null;
    v._rates = mindRates(v, w.hour);
    if (!p) {
      const def = { name: v.name(), place: 'valley', needs: { ...v._d }, data: { vid: v.id } };
      const inst = {};
      for (const k in v.genes.taste) if (Math.abs(v.genes.taste[k] - 1) > 1e-3 && w.actions.has(k)) inst[k] = Math.round(v.genes.taste[k] * 1000) / 1000;
      if (Object.keys(inst).length) def.instincts = inst;
      this.input('person', [id, def]);
      const hab = {};
      for (const k in v._h) if (Math.abs(v._h[k] - 1) > 1e-6 && w.actions.has(k)) hab[k] = v._h[k];
      if (Object.keys(hab).length) this.input('mf.habits', [id, hab]);
    } else if (p.status !== 'active') this.input('mf.back', [id, { ...v._d }]);
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
  need(v, d) {
    const nb = v._nb;
    if (nb !== null && nb[d] !== undefined) return nb[d];
    if (!this.on || v._mw !== this.gen || v.leaving) return v._d[d] ?? 0;
    const pid = v._pid, now = this.w.s.now, ver = this.pver[pid] || 0;
    let c = v._nc;
    if (c === null || c.ver !== ver || c.now !== now) c = v._nc = { ver, now, lv: {} };
    const x = c.lv[d];
    return x !== undefined ? x : (c.lv[d] = this.w.needOf(pid, d));
  },
  // A need the game moved: kept by the villager until it's told (at the end
  // of the step); the ones the valley moves (the chill, aches...) drift a
  // little every step, so they wait until they've moved enough, or a few
  // minutes have gone by.
  setNeed(v, d, x) {
    x = Number.isFinite(x) ? clamp(x, 0, 1) : 0;
    if (!minded(v)) { v._d[d] = x; return; }
    if (Math.abs(x - this.need(v, d)) < 1e-9) return;
    if (!v._nb) { v._nb = {}; v._nbAt = Game.time; }
    v._nb[d] = x;
  },
  flush(v, now) {
    if (!v._nb) return;
    if (!now && minded(v) && Game.time - v._nbAt < 5) {
      let moved = false;
      for (const d in v._nb) if (MIND_RISE[d] || Math.abs(v._nb[d] - this.w.needOf(this.pid(v), d)) > 0.01) { moved = true; break; }
      if (!moved) return;
    }
    const nb = v._nb, pid = this.pid(v);
    v._nb = null;
    if (minded(v)) { this.touch(pid); this.input('mf.needs', [pid, nb]); this.touch(pid); }
  },
  habit(v, k) {
    if (!minded(v)) return v._h[k] ?? 1;
    return this.w.mind.habit(this.w.s.people[this.pid(v)], k);
  },
  // a habit the game nudged (a pat, a tut-tut, a good example): Tyrell's reward
  // moves the fast weight, and a quarter as much the slow, so the habit by
  // 0.625 of it
  setHabit(v, k, x) {
    if (!Number.isFinite(x)) return;
    if (!minded(v)) { v._h[k] = x; return; }
    const delta = x - this.habit(v, k);
    if (Math.abs(delta) > 1e-6) this.tell(v, 'reward', [this.pid(v), k, delta / 0.625]);
  },

  // ---- choosing ----------------------------------------------------------
  // score()'s reasons for an option, once per option (block, then consider)
  judge(p, c) {
    const v = this.byPid.get(p.id), a = ACTIONS[c.id];
    if (!v || !a) return null;
    const now = this.w.s.now, key = p.id + '|' + c.id + '|' + now;
    if (this._jk === key) return this._jv;
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
    this._jk = key; this._jv = out;
    return out;
  },
  // nothing in hand: start what Tyrell chose (and if there's no way to do it,
  // say so, and it chooses again)
  decide(v, h) {
    const id = this.pid(v);
    for (let tries = 0; tries < 6; tries++) {
      const p = this.live(v);
      if (!p) { v.thinkAlone(h); return; }
      const d = p.doing;
      if (!d || d.kind !== 'act' || !ACTIONS[d.action]) break;
      if (d.seq === v._tyDone) { this.tell(v, 'mf.stop', [id, 0]); continue; } // (one already done with: think again)
      this.picking = { v, seq: d.seq, id: d.action };
      let ok = false;
      try { ok = v.begin(ACTIONS[d.action], h); } finally { this.picking = null; }
      if (ok) return;
      this.tell(v, 'report', [id, 'failed', 'no way to do it just now']);
    }
    // nothing worked out: what they'd always do
    v.begin(v.stage === 'baby' ? ACTIONS.cradle : needsMinder(v) ? ACTIONS.putter : ACTIONS.stroll, h);
  },

  // ---- the game's tasks as Tyrell's doings ----------------------------------
  // (villager.js's task is this property: every task set or put down comes here)
  taskSet(v, old, t) {
    const p = this.live(v);
    if (!p) return;
    const cur = p.doing ? p.doing.seq : null;
    // the same thing carried on in a new task (a natter that's begun, say)
    if (old && t && old.ty != null && old.ty === cur && t.ty == null && old.a.id === t.a.id) { t.ty = old.ty; return; }
    if (old && old.ty != null && old.ty === cur && this.quiet !== v) this.ended(v, old);
    if (t && t.ty == null) {
      if (this.picking && this.picking.v === v && this.picking.id === t.a.id) t.ty = this.picking.seq;
      else t.ty = this.tell(v, 'mf.do', [this.pid(v), t.a.id, mindRank(t.a)]) ?? -1;
    }
  },
  // the game is done with a task: how it went
  ended(v, task) {
    const id = this.pid(v), t0 = task.t0 ?? task.t, frac = t0 > 0 && t0 < 1e6 ? clamp((task.el || 0) / t0, 0, 1) : 0;
    this.correct(v, task, frac);
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

// Saving: the minds go in the save as they are (Game.minds, Tyrell's own
// save), with the seed they were made from.
window.addEventListener('DOMContentLoaded', () => {
  registerField('minds', null, { nullish: true });
  registerField('mindSeed', null, { nullish: true });
  addHook('newVillage', () => { Shell.stop(); Game.minds = null; Game.mindSeed = null; });
  // (after the other features have had their say about the founding families)
  addHook('afterNewVillage', () => Shell.start());
  // (Tyrell's state as it stands, which the save writes out as it is: Tyrell's own save is a copy of the same)
  patch(window, 'save', (sv) => function () { if (Shell.on) Game.minds = { tyrell: 'world', v: Shell.w.s.v, s: Shell.w.s }; return sv.apply(this, arguments); }, 'shell');
  // a save from before the minds were Tyrell's has none: they're made afresh,
  // from each villager's drives and habits as they were (mindDrives, join)
  patch(window, 'load', (ld) => function () { Shell.stop(); const r = ld.apply(this, arguments); if (r) Shell.start(); return r; }, 'shell');
  // the minds' clock runs to the end of the step first, then the villagers act on it
  patch(window, 'simulate', (sim) => function (dt) {
    if (Shell.on) { Shell.sync(); Shell.advance(Game.time + dt); }
    sim.call(this, dt);
    if (Shell.on) Shell.sync();
  }, 'shell');
});
