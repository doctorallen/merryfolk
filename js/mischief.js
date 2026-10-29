'use strict';
// ---------------------------------------------------------------------------
// Mischief and pranks. Folk with a grudge (Bree's, against someone in
// particular) or a wicked streak (quick wits and a quick temper, and little
// merriness to soften them) now and then set a tripwire across someone's
// garden path, a snare by the hedge on their way into the village, or slip a
// bad mushroom into their supper. They're Morgul's traps and taints
// (vendor/tycho/tyrell/docs/modules/morgul.md): a trap is set at a place, by
// someone, for someone, and known to whoever saw it set; a taint is in their
// pot, quiet until it tells. Nothing worse comes of any of it than a few
// hours' sore ankle or a queasy afternoon, but it stings, it embarrasses, and
// it leaves grudges: whoever's caught, and whoever saw them caught, may
// suspect someone (Morgul's suspicion: whoever saw it set knows; anyone else
// goes by who bore them a grudge and who was about, and is right sometimes
// and wrong sometimes), and believe it, and hold it against them.
//
// Merryfolk draws everyone, so every trap is a trigger in the game (the
// bridge's traps, Tycho.minds.traps, vendor/tycho/docs/minds.md, "Harm"),
// drawn small where it lies: a cord between two pegs, a loop of twine. Whoever
// walks into one stumbles and sits down hard (unless they know it's there,
// or spot it in time and take it up); one left a day is found and taken in.
// What's tainted is eaten when they next sit down to a meal (Morgul's pot:
// every villager has a place of their own in Tyrell, and the taint is in it).
// ---------------------------------------------------------------------------

const MISCHIEF = {
  // how much a prank appeals: to someone with a grudge, this and the grudge's strength times this; with a wicked streak, this and the streak times this
  grudgeBase: 0.2, grudge: 0.6, streakBase: 0.15, streak: 0.25, grudgeAt: 0.12,
  // a wicked streak: wit × 0.6 + temper × 0.4 above this, softened by merriness
  streakAt: 0.62,
  // the hours for it; once a day at most in the village, and nobody twice in three days
  from: 9, to: 19, perDay: 1, gapDays: 3,
  // an unwary passer walks into it, or spots it in time (and takes it up); a trap left a day is taken in
  catch: 0.75, keepMinutes: 1440,
  // who sees it set or sprung (a stone's throw), and who was about (the lane): suspicion's evidence
  sees: 70, about: 180,
  // down on the ground a moment, in game minutes
  stumble: 4,
};
// What a prank is done with, declared to both halves (the bridge's means): Morgul's traps and the poison, Tycho's triggers.
const MISCHIEF_MEANS = [
  { id: 'tripwire', label: 'a tripwire', kinds: ['trip'], use: 'set', severity: 0.08, trigger: { zone: { w: 14, h: 6 }, once: true, hidden: true } },
  { id: 'snare', label: 'a snare', kinds: ['trip'], use: 'set', severity: 0.1, trigger: { zone: { w: 9, h: 9 }, once: true, hidden: true } },
  { id: 'toadstool', label: 'a bad mushroom', kinds: ['poison'], use: 'dose', course: 'spiked', severity: 0.3 },
];

MOODLETS.tripped = ['Tripped up by a prank', -0.06, 360, ['Somebody thinks they\'re very funny.', 'My ankle, and in front of everyone.']];
MOODLETS.pulled_prank = ['Got away with a prank', 0.04, 240, ['Heh.', '*whistles innocently*']];
MOODLETS.suspects = ['Sure it was {x}', -0.05, 1440, ['I know it was {x}. I just know it.']];

const MISCHIEF_WORDS = {
  trip: { child: ['Waah!', 'Ow! Who did that?!'], plain: ['Whoa! Oof!', 'Wha... ow!'], common: ['Whoa! Oof!', 'Ow! What the...'], fine: ['Good heavens! Oof!', 'I say! Oof!'] },
  after: { child: ['Somebody tied a string there! It\'s not funny!', 'I\'m telling!'], plain: ['Who strung that there? I\'ll have their ears!', 'Very funny. VERY funny.'], common: ['Someone\'s idea of a joke, I suppose.', 'Who would do such a thing?'], fine: ['A tripwire! Of all the childish...', 'Someone will answer for this.'] },
  spot: { child: ['Ooh, a string! Someone\'s playing tricks.'], plain: ['Hello, what\'s this? Someone\'s strung a cord across here!'], common: ['Somebody\'s set a snare here. Well, not for me, thank you.'], fine: ['A tripwire? How very juvenile.'] },
  laugh: { child: ['Ha ha! You fell over!', 'Hee hee!'], plain: ['Ha! Down you go!', 'Mind your feet!'], common: ['Oh dear! Are you alright?', 'Steady!'], fine: ['Good gracious, are you hurt?'] },
  queasy: { child: ['My tummy hurts...', 'I feel funny...'], plain: ['Ooh. That supper\'s not sitting right.', 'My belly... urgh.'], common: ['I don\'t feel at all well. Something I ate.', 'Ooh, my tummy...'], fine: ['I fear something disagreed with me.', 'Most unwell. That meal...'] },
  blame: { child: ['I bet it was {x}!'], plain: ['I\'ll wager it was {x}.', '{x}! It\'ll have been {x}.'], common: ['I\'m sure it was {x}.', 'That has {x} written all over it.'], fine: ['I have my suspicions, and they point at {x}.'] },
};
const mischiefSay = (v, k, x) => { if (v && !v.inside) v.say(pickFrom(MISCHIEF_WORDS[k], register(v)).replace(/\{x\}/g, x || 'someone'), 2.6); };

// ---- the prank itself: walk there, fiddle a moment, and off --------------------
// (it's chosen like anything else, by Tyrell, weighed by its appeal and the
// violence knob; how often is held by the caps: once a day in the village)
ACTIONS.prank = {
  id: 'prank', label: 'Up to something', sat: { bored: -0.45 }, dur: 6, pose: 'work', outdoor: true, stages: ['child', 'adult'], harm: true, instinct: false,
  avail: (v, h) => Mischief.can(v, h),
  extra: (v) => Mischief.appeal(v),
  time: (h) => (h >= MISCHIEF.from && h < MISCHIEF.to ? 1 : 0.02),
  trait: (v) => 0.6 + v.genes.wit * 0.8,
  target: (v) => Mischief.plan(v),
  done: (v, task) => Mischief.done(v, task),
};
ACTION_NAMES.prank = 'Getting up to mischief';

const Mischief = {
  w: null, snares: null, arsenal: null, placed: new Map(),
  on() { return !!this.w && Shell.on && Shell.w === this.w && !!this.w.morgul; },

  // ---- declaring ------------------------------------------------------------
  declare(w) {
    this.w = w; this.placed.clear();
    const A = w.athelas, M = w.morgul;
    // a sore ankle from a tripwire or a snare: a few hours
    A.course({ id: 'sore_ankle', label: 'A sore ankle', tags: ['wound'], again: 'worsen', severity: { at: 0.08, stretch: 1.5, depth: 0.5 }, phases: [
      { id: 'smarting', label: 'smarting', minutes: [60, 120], weigh: { play: 0.5, chase: 0.5, stroll: 0.6, party: 0.7 } },
      { id: 'stiff', label: 'stiff', minutes: [120, 240], hurts: 0.4 },
    ] });
    // a bad mushroom in their supper: nothing for an hour or two, then a queasy afternoon (as a bad toadstool at its worst: body.js)
    A.course({ id: 'spiked', label: 'A bad mushroom', tags: ['illness', 'poison'], poison: 0.55, severity: { stretch: 1, depth: 0 }, phases: [
      { id: 'working', label: 'working', minutes: [60, 150], quiet: true },
      { id: 'queasy', label: 'queasy', minutes: [150, 240], tells: true, rates: { hunger: 0.3, tired: 1.6 }, weigh: { sleep: 1.5, remedy_item: 1, '*': 0.4 }, blocks: ['eat_home', 'eat_inn'] },
      { id: 'settling', label: 'settling', minutes: [120, 180] },
    ] });
    this.arsenal = Tycho.minds.means(w, MISCHIEF_MEANS, Tycho.harm.means);
    M.wound({ id: 'sore_ankle', kinds: ['trip'], course: 'sore_ankle' });
    // every trap is the game's to spring: Merryfolk draws everyone
    this.snares = Tycho.minds.traps(w, { regions: () => ['world'], make: (t) => this.make(t), drop: (t) => this.placed.delete(t.id) });
    w.on('morgul:sprung', (e) => Body.later(() => this.sprung(e)));
    w.on('morgul:suspect', (e) => Body.later(() => this.suspected(e)));
    w.on('shows', (e) => Body.later(() => this.shows(e)));
  },
  // loaded: the places traps have been set at, each a spot of the valley's own, declared again
  restored() {
    const st = this.w && this.w.s.mod.morgul;
    if (st && st.traps) for (const k of Object.keys(st.traps).sort()) this.placeAt(st.traps[k].place);
  },
  // a spot in the valley as a Tyrell place: 'mf_spot_<x>_<y>', in world pixels
  placeAt(x, y) {
    const id = typeof x === 'string' ? x : `mf_spot_${Math.round(x)}_${Math.round(y)}`;
    if (!this.w.ring.get(id)) this.w.place({ id, label: 'a spot in the valley' });
    return id;
  },
  spotOf(place) { const m = /^mf_spot_(-?\d+)_(-?\d+)$/.exec(place || ''); return m ? { x: +m[1], y: +m[2] } : null; },
  // a trap come near (all of them): the game's trigger, where it lies
  make(t) {
    const at = this.spotOf(t.place);
    if (!at || !t.means || !t.means.trigger) return null;
    const obj = { x: at.x, y: at.y, kind: t.kind, trap: t.id, by: t.by, t: t.t, trigger: new Tycho.harm.Trigger(t.means.trigger) };
    this.placed.set(t.id, obj);
    return obj;
  },

  // ---- choosing ---------------------------------------------------------------
  // a wicked streak, 0 to 1
  streak(v) { const x = v.genes.wit * 0.6 + v.genes.temper * 0.4 - (v.genes.merriness - 0.5) * 0.2; return clamp((x - MISCHIEF.streakAt) / (1 - MISCHIEF.streakAt), 0, 1); },
  // who they'd play it on: the one they bear the worst grudge, or for a wicked streak someone they're not fond of
  victim(v) {
    if (!this.on()) return null;
    let best = null, bs = MISCHIEF.grudgeAt;
    for (const g of this.w.bree.grudges(v._pid) || []) {
      const o = Shell.byPid.get(g.against || g.id || g.other);
      const s = o ? this.w.bree.animosity(v._pid, o._pid) : 0;
      if (o && s >= bs && this.fair(v, o)) { bs = s; best = o; }
    }
    if (best) return { o: best, grudge: bs };
    if (this.streak(v) <= 0) return null;
    // (a wicked streak picks the same someone all day)
    const pool = Game.villagers.filter((o) => this.fair(v, o) && (v.rel[o.id] ?? 0.1) < 0.3).sort((a, b) => a.id - b.id);
    if (!pool.length) return null;
    return { o: pool[Math.floor(hash2(v.id * 31 + Game.day, 7) * pool.length) % pool.length], grudge: 0 };
  },
  // never their own family, a little one, someone away or abed, someone with no hole to come out of
  fair(v, o) {
    return o !== v && !o.leaving && minded(o) && o.stage !== 'baby' && register(o) !== 'toddler' && o.homeId >= 0 && o.homeId !== v.homeId
      && v.spouse !== o.id && v.sweetheart !== o.id && !v.parents.includes(o.id) && !o.parents.includes(v.id) && (v.isChild() || !o.isChild());
  },
  can(v, h) {
    if (!this.on() || !minded(v) || v._arms || v.isSick() || register(v) === 'toddler' || v.stage === 'elder') return false;
    if (h < MISCHIEF.from || h >= MISCHIEF.to) return false;
    if (v._prankDay != null && Game.day - v._prankDay < MISCHIEF.gapDays) return false;
    const d = Game.pranks && Game.pranks.day === Game.day ? Game.pranks.n : 0;
    if (d >= MISCHIEF.perDay) return false;
    return !!this.victim(v);
  },
  appeal(v) {
    const t = this.victim(v);
    if (!t) return 0;
    return t.grudge > 0 ? MISCHIEF.grudgeBase + t.grudge * MISCHIEF.grudge : MISCHIEF.streakBase + this.streak(v) * MISCHIEF.streak;
  },
  // What and where: a bad mushroom in their supper (for a real grudge, by someone who knows a toadstool, while
  // nobody's home), a snare on their way into the village, or a tripwire across their garden path.
  plan(v) {
    const t = this.victim(v);
    if (!t) return null;
    const o = t.o, home = o.home();
    if (!home || !home.built) return null;
    const knows = v.wary > 0.2 || v.skills.herbalism > 25 || v.edu > 0.6;
    if (t.grudge >= 0.25 && knows && v.isGrown() && !o.inside && !home.inside.length && R.chance(0.4)) return { building: home, prank: { kind: 'toadstool', for: o } };
    let spot = { x: home.stepX, y: home.stepY };
    if (R.chance(0.5)) {
      // along their way toward the green, a few strides from the door
      const to = World.inn || World.buildings.inn;
      const p = to ? findPath(Math.floor(home.stepX / 16), Math.floor((home.stepY - 2) / 16), Math.floor(to.stepX / 16), Math.floor((to.stepY - 2) / 16)) : null;
      if (p && p.length > 5) { const [tx, ty] = p[Math.min(p.length - 2, 3 + Math.floor(Math.random() * 3))]; spot = { x: tx * 16 + 8, y: ty * 16 + 12, snare: true }; }
    }
    return { x: spot.x, y: spot.y + 2, facing: 'up', prank: { kind: spot.snare ? 'snare' : 'tripwire', for: o, x: spot.x, y: spot.y } };
  },
  // it's done: set, or slipped in, in front of whoever's about
  done(v, task) {
    const p = task.target && task.target.prank;
    if (!p || !this.on() || !minded(p.for) || p.for.leaving) return;
    const seen = this.seers(v).filter((id) => id !== p.for._pid || !p.for.inside || p.for.inside === v.inside);
    if (p.kind === 'toadstool') {
      Shell.tell(v, 'morgul.taint', [{ course: 'spiked', place: mindPlace(p.for.id), n: 1, by: v._pid, for: p.for._pid, what: 'toadstool', seenBy: seen }]);
    } else {
      const place = this.placeAt(p.x, p.y);
      Shell.tell(v, 'morgul.set', [p.kind, { by: v._pid, place, for: p.for._pid, seenBy: seen, about: this.seers(v, MISCHIEF.about).filter((id) => !seen.includes(id)) }]);
      this.sync();
    }
    v._prankDay = Game.day;
    Game.pranks = Game.pranks && Game.pranks.day === Game.day ? { day: Game.day, n: Game.pranks.n + 1 } : { day: Game.day, n: 1 };
    feel(v, 'pulled_prank');
    if (Game.selected === v) devLog('mood', `${v.first} has set ${MISCHIEF_MEANS.find((m) => m.id === p.kind).label} for ${p.for.first}${seen.length ? ', and was seen' : ''}`);
  },
  // who's about to see it: indoors, everyone in the room; outdoors, within a stone's throw (or as far as given)
  seers(v, reach = MISCHIEF.sees) {
    const out = [];
    for (const o of Game.villagers) {
      if (o === v || !minded(o) || o.stage === 'baby' || o.carried || o.leaving) continue;
      if (o.task && o.task.phase === 'do' && ['sleep', 'lodge', 'sleep_rough', 'nap'].includes(o.task.a.id)) continue;
      if (v.inside ? o.inside === v.inside : !o.inside && dist(o.x, o.y, v.x, v.y) < reach) out.push(o._pid);
    }
    return out.sort();
  },

  // ---- every step: who walks into one ---------------------------------------------
  sync() { if (this.on() && this.snares) this.snares.sync(); },
  step() {
    if (!this.on() || !this.snares) return;
    this.sync();
    if (!this.placed.size) return;
    const now = Game.time;
    for (const t of this.snares.list()) {
      const obj = this.placed.get(t.id);
      if (!obj) continue;
      // left a day: whoever set it takes it in (or someone finds it)
      if (now - t.t > MISCHIEF.keepMinutes) { this.snares.disarm(t.id, t.by || undefined); continue; }
      for (const v of Game.villagers) {
        if (v.inside || v.carried || v.leaving || v.pose !== 'walk' || !minded(v) || v.stage === 'baby') continue;
        const inside = obj.trigger.inside(obj, v.x, v.y, 2);
        const pass = v._trapPass || (v._trapPass = {});
        if (!inside) { if (pass[t.id]) delete pass[t.id]; continue; }
        if (pass[t.id]) continue;
        pass[t.id] = true;
        // the one who set it, and anyone who saw it set, steps over it
        if (t.by === v._pid || (t.known || []).includes(v._pid)) continue;
        if (R.chance(MISCHIEF.catch * (1.1 - v.genes.curiosity * 0.2))) {
          const seen = this.seers(v);
          this.snares.spring(t.id, v._pid, seen, this.seers(v, MISCHIEF.about).filter((id) => !seen.includes(id)));
          this.fall(v, obj);
        } else {
          // spotted in time: taken up
          mischiefSay(v, 'spot');
          this.snares.disarm(t.id, v._pid);
          v.remember(`Found ${MISCHIEF_MEANS.find((m) => m.id === t.kind).label} set by ${v.home() && dist(obj.x, obj.y, v.home().stepX, v.home().stepY) < 20 ? 'my door' : 'the path'}, and took it up.`, -1);
        }
        break;
      }
    }
  },
  // down they go
  fall(v, obj) {
    v._stumble = { until: Game.time + MISCHIEF.stumble };
    FX.dust(v.x, v.y - 2); FX.stars(v.x, v.y - 18);
    mischiefSay(v, 'trip');
    harmLater(4.6, () => mischiefSay(v, 'after'));
    obj.sprung = true;
  },

  // ---- what it set off ------------------------------------------------------------------
  sprung(e) {
    const v = Shell.byPid.get(e.id);
    if (!v) return;
    feel(v, 'tripped');
    const what = MISCHIEF_MEANS.find((m) => m.id === e.kind), at = this.spotOf(e.place);
    const home = v.home(), own = home && at && dist(at.x, at.y, home.stepX, home.stepY) < 20;
    v.remember(`Went flat on my face over ${what ? what.label : 'something'} someone left ${own ? 'by my own door' : 'on the path'}.`, -2);
    // whoever saw it: a laugh, or a kind word
    const seers = this.seers(v).map((id) => Shell.byPid.get(id)).filter((o) => o && !o.inside).slice(0, 2);
    seers.forEach((o, i) => harmLater(2.6 + i * 2.0, () => mischiefSay(o, 'laugh')));
    chronicle(`${v.first} went flat on ${v.pron.their} face over ${what ? what.label : 'a prank'} someone left ${own ? `outside ${home.name}` : 'on the path'}.${seers.length ? ' ' + seers[0].first + ' saw it all.' : ''}`, 'quarrel');
  },
  // a bad mushroom shows itself
  shows(e) {
    if (e.course !== 'spiked') return;
    const v = Shell.byPid.get(e.id);
    if (!v) return;
    mischiefSay(v, 'queasy');
    v.remember('Came over queasy after a meal. Something in it disagreed with me.', -2);
    if (R.chance(0.6)) chronicle(`${v.first} has come over queasy after a meal and has a dreadful tummy-ache.`, 'sick');
  },
  // someone has a suspect: right or wrong, they say so, and remember it
  suspected(e) {
    const v = Shell.byPid.get(e.id), s = Shell.byPid.get(e.suspect), to = Shell.byPid.get(e.to);
    if (!v || !s || !to) return;
    feel(v, 'suspects', s.first);
    if (v === to) {
      harmLater(9.1, () => mischiefSay(v, 'blame', s.first));
      v.remember(`I'm sure it was ${s.first} who played that trick on me.`, -2);
      if (R.chance(0.7)) chronicle(`${v.first} is sure it was ${s.first} behind it.`, 'quarrel');
    } else v.remember(`I've a feeling ${s.first} was behind what happened to ${to.first}.`, -1);
    if (Game.selected === v) devLog('mood', `${v.first} suspects ${s.first} (${e.why}${e.right ? ', and is right' : ''})`);
  },

  // ---- drawing ---------------------------------------------------------------------------
  // a cord between two pegs across the path; a loop of twine by the hedge
  draw(ctx, cam) {
    for (const obj of this.placed.values()) {
      if (obj.sprung || obj.x < cam.x - 20 || obj.x > cam.x + cam.w + 20 || obj.y < cam.y - 20 || obj.y > cam.y + cam.h + 20) continue;
      const x = Math.round(obj.x), y = Math.round(obj.y) + 1;
      if (obj.kind === 'tripwire') {
        ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x - 7, y - 3, 1, 3); ctx.fillRect(x + 6, y - 3, 1, 3);
        ctx.fillStyle = 'rgba(214,196,150,0.9)'; ctx.fillRect(x - 6, y - 2, 12, 0.5);
      } else {
        ctx.fillStyle = 'rgba(200,180,130,0.95)';
        ctx.fillRect(x - 2, y - 2, 4, 0.5); ctx.fillRect(x - 2, y + 1, 4, 0.5); ctx.fillRect(x - 2.5, y - 1.5, 0.5, 2.5); ctx.fillRect(x + 2, y - 1.5, 0.5, 2.5);
        ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x + 3, y - 3, 1, 3); ctx.fillStyle = 'rgba(200,180,130,0.95)'; ctx.fillRect(x + 2.5, y - 1, 1, 0.5);
      }
    }
  },
};

window.addEventListener('DOMContentLoaded', () => {
  // (each step, who walks into one)
  patch(Shell, 'advance', (adv) => function () { const r = adv.apply(this, arguments); Mischief.step(); return r; }, 'mischief');
  // down a moment where they fell, then up and on their way, hobbling a little while the ankle smarts
  patch(Villager.prototype, 'walk', (walk) => function (dt, boost = 1) {
    if (this._stumble) { if (Game.time < this._stumble.until) { this.pose = 'stumble'; return; } this._stumble = null; }
    const sore = Body.on(this) && Body.has(this, 'sore_ankle') && Body.phase(this, 'sore_ankle') === 'smarting';
    return walk.call(this, dt, sore ? boost * 0.75 : boost);
  }, 'mischief');
});
