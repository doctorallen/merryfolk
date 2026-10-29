'use strict';
// ---------------------------------------------------------------------------
// Scuffles. Now and then (rarely: a squabble almost always stays words) a
// squabble in the lane comes to blows: Bree's squabble escalates into a
// scuffle, and a scuffle is a fight by numbers on Morgul, Tyrell's harm
// module (vendor/tycho/tyrell/docs/modules/morgul.md). Each of its turns one
// of the two lands a blow, by the odds of their nerve and temper; each blow
// is a harm that leaves a bruise, or now and then a bloody nose (an Athelas
// course that heals in a day or two, the sooner for being seen to), a sting,
// a grudge against whoever started it, and a little less fondness; and it
// ends when one gives in, walks off, or someone there pulls them apart.
// Nobody is ever badly hurt, and nobody dies of it (lethality 0). Whoever is
// about sees it and doesn't like it, the chronicle hears of it (so gossip
// carries it round the village), and a friend or someone of the family may
// come round later to see to the bruises.
//
// On screen it's a tussle in step with the fight's turns: the bridge's
// scuffles (Tycho.minds.scuffles, vendor/tycho/docs/minds.md, "Harm") gives
// the beats, and each is played as it comes: the two square up, each blow
// a lunge and the one struck knocked back (stars for a heavy one, a drop or
// two of red for a bloody nose), and how it ended. Space stays the game's:
// who's near enough to see, who's together.
// ---------------------------------------------------------------------------

// How a scuffle goes: rare, short, and never worse than a bloody nose.
const SCUFFLE = {
  // a squabble's sour turn comes to blows at this share of Bree's chance, times their temper (0.4 + temper × 1.2);
  // children only scuffle with children, never with an elder, a toddler, a sweetheart or their own parent
  rate: 0.35, kids: 0.8,
  // a blow is heavy (stars) from this, and a bloody nose from this
  heavyAt: 0.07, noseAt: 0.078,
  // folk who like the one hurt come round to see to it, at these hours, this often
  tendHours: [10, 14, 18], tendChance: 0.55, tendFrom: 0.35,
};
// Morgul's settings for Merryfolk (Tyrell's tuning.md, Morgul): a scuffle is
// six blows at most, a fist's worth each (give or take), and someone gives
// in once two or three have landed; nobody goes down, nobody dies. Might is
// nerve and temper (and a child's is a child's). Space is the game's, so
// nobody fears a place (each villager has a place of their own in Tyrell),
// and traps are the game's to spring (mischief.js).
const MIND_MORGUL = {
  lethality: 0,
  fights: ['scuffle'], fighting: 'scuffle', down: 'knocked_flat',
  blows: 6, fist: 0.055, blowSpread: 0.5, yieldAt: 0.15, yieldCourage: 1, walkOff: 0.4,
  might: [{ name: 'nerve and temper', input: (ctx) => scuffleMight(ctx), range: [0, 10], out: [0, 10] }],
  shakenAt: 0.25, wary: 0, catch: 0, eats: ['meal'], dose: 0.3,
};
MIND_MODULES.morgul = MIND_MORGUL;
function scuffleMight(ctx) {
  const v = ctx.person ? Shell.byPid.get(ctx.person.id) : null;
  if (!v) return 1;
  return (0.6 + v.genes.bravery * 0.8) * (0.8 + v.genes.temper * 0.4) * (0.9 + v.genes.hardiness * 0.2) * (v.isChild() ? 0.6 : 1);
}

// What a harm leaves them feeling (Morgul's feelings, in the game's measure: one at a time, refreshed)
MOODLETS.in_pain = ['Smarting', -0.05, 240, ['Ow. That smarts.', 'Still sore, that is.']];
MOODLETS.shaken = ['Shaken up', -0.06, 720, ['I\'m all of a tremble.']];
MOODLETS.furious = ['Fuming', -0.06, 720, ['Of all the nerve!', 'I\'m that cross I could spit.']];
MOODLETS.scared = ['Rattled', -0.05, 480, ['I don\'t like it. Not one bit.']];
MOODLETS.saw_harm = ['Saw {x} hurt', -0.04, 300, ['Poor {x}.']];
MOODLETS.cared_for = ['{x} looked after me', 0.08, 1440, ['That was kind of {x}.']];
MOODLETS.scuffled = ['Came to blows with {x}', -0.1, 1440, ['I shouldn\'t have let {x} get to me.', 'My knuckles still smart.']];
MOODLETS.saw_scuffle = ['Saw a scuffle in the lane', -0.05, 360, ['Fists, in Thistledown! Whatever next?', 'I don\'t like to see folk come to blows.']];
const HARM_FEELINGS = ['in_pain', 'shaken', 'furious', 'scared', 'saw_harm', 'cared_for'];

// The words of a scuffle, by who's speaking (education.js's registers).
const SCUFFLE_WORDS = {
  start: { child: ['Take it back!', 'Say that again!', 'You asked for it!'], plain: ['Right! That does it!', 'Put \'em up, then!', 'You\'ve had this coming!'], common: ['That does it!', 'Right, you!', 'I\'ll not stand for that!'], fine: ['I warn you, I box!', 'Very well. You leave me no choice.'] },
  back: { child: ['Make me!', 'Come on then!'], plain: ['Come on, then!', 'Just you try!'], common: ['Oh, is that so?', 'Come on, then!'], fine: ['If you insist!', 'Have at you, then!'] },
  swing: { child: ['Take that!', 'Ha!'], plain: ['Take that!', 'Have some of that!'], common: ['Take that!', 'There!'], fine: ['Take that, sir!', 'And that!'] },
  hit: { child: ['Ow!', 'Ouch!', 'Owww!'], plain: ['Oof!', 'Ow!', 'Ooh, my ribs!'], common: ['Oof!', 'Ouch!', 'Ow, that hurt!'], fine: ['Oof!', 'Oh! The brute!'] },
  nose: { child: ['My nose! Waaah!', 'You made my nose bleed!'], plain: ['My nose! My poor nose!', 'Ow! You\'ve bloodied my nose!'], common: ['Ow! My nose!', 'Now look, my nose is bleeding!'], fine: ['My nose! You\'ve drawn blood!', 'Good heavens, my nose!'] },
  yield: { child: ['Stop! Stop! I give in!', 'Okay! Okay! You win!'], plain: ['Alright! Alright! Enough!', 'Pax! Pax! I give in!'], common: ['Enough! Enough, I say!', 'Alright, you win! Leave off!'], fine: ['I yield! I yield!', 'Enough. I concede.'] },
  won: { child: ['Ha! I won!', 'And stay away!'], plain: ['And don\'t you forget it!', 'Serves you right.'], common: ['And let that be a lesson.', '...I\'m sorry. I don\'t know what came over me.'], fine: ['Let that be an end of it.', '...That was badly done of me. I apologize.'] },
  after: { child: ['*sniff*', 'I\'m telling!'], plain: ['Hmph.', 'Look what you made me do.'], common: ['Hmph.', 'Well. That\'s that.'], fine: ['Hmph.', 'Most undignified.'] },
  stars: { child: ['*sees stars*'], plain: ['*sees stars*', 'Whoa... three of you...'], common: ['*sees stars*'], fine: ['*sees stars*'] },
  see: { child: ['They\'re fighting!', 'Fight! Fight!'], plain: ['Here, stop that!', 'Oi! Not in the lane!'], common: ['Oh my goodness!', 'Stop it, the pair of you!'], fine: ['Good heavens!', 'Gentlefolk, please!'] },
};
const scuffleSay = (v, k, to) => { if (v && !v.inside && Game.villagers.includes(v)) v.say(pickFrom(SCUFFLE_WORDS[k], register(v)), 2.4, to ? { to } : {}); };
// a word said a moment later, in game minutes (so it keeps pace with the clock, fast or slow)
const harmSoon = [];
function harmLater(minutes, fn) { harmSoon.push({ at: Game.time + minutes, fn }); }
function harmTick() {
  if (!harmSoon.length) return;
  const due = harmSoon.filter((x) => x.at <= Game.time);
  if (!due.length) return;
  for (let i = harmSoon.length - 1; i >= 0; i--) if (harmSoon[i].at <= Game.time) harmSoon.splice(i, 1);
  for (const x of due) { try { x.fn(); } catch (e) { if (typeof noteError === 'function') noteError(e, 'a word after'); } }
}

// ---- the actions: scuffling, knocked flat, and seeing to someone's bruises ----
// (Morgul holds both fighters in the fight while it lasts, at its own rank; the
// game's action is what they're seen doing)
ACTIONS.scuffle = {
  id: 'scuffle', label: 'Scuffling', sat: {}, dur: 120, pose: 'tussle', instinct: false,
  label2: (v) => { const o = Scuffle.foe(v); return o ? `Scuffling with ${o.first}` : 'Scuffling'; },
  avail: (v) => Scuffle.inFight(v),
  target: (v) => { const o = Scuffle.foe(v); return o ? { x: v.x, y: v.y, faceTo: o, foe: o } : null; },
  start: (v, task) => { const ex = Scuffle.fight(v); if (ex) task.bree = ex.id; return !!ex; },
  tick: (v, task, dt) => Scuffle.tick(v, task, dt),
};
ACTIONS.knocked_flat = {
  id: 'knocked_flat', label: 'Knocked flat', sat: {}, dur: 40, pose: 'stumble', instinct: false,
  avail: (v) => Scuffle.on() && Shell.w.morgul.isDown(v._pid),
  target: (v) => ({ x: v.x, y: v.y }),
};
ACTIONS.tend_hurt = {
  id: 'tend_hurt', label: 'Seeing to someone\'s bruises', icon: 'remedy', sat: { lonely: -0.25, bored: -0.15 }, dur: 12, pose: 'stand', stages: ['adult', 'elder'], queued: true, instinct: false,
  label2: (v) => (v.task && v.task.target.patient ? `Seeing to ${v.task.target.patient.first}'s bruises` : 'Seeing to someone\'s bruises'),
  target: (v, h, extra) => {
    const p = extra && extra.patient;
    if (!p || !Game.villagers.includes(p) || p.leaving || !Scuffle.hurt(p)) return null;
    return p.inside ? { building: p.inside, patient: p } : { other: p, patient: p };
  },
  // met in the lane: they see to it there and then
  meet: (v, p, task) => { task.data.met = true; Scuffle.tend(v, p); },
  // or at the door, if they're still in
  done: (v, task) => { const p = task.target.patient; if (!task.data.met && p && p.inside && p.inside === v.inside) Scuffle.tend(v, p); },
};
for (const id of ['scuffle', 'knocked_flat', 'tend_hurt']) ACTION_NAMES[id] = ACTIONS[id].label;

const Scuffle = {
  w: null, beats: null, live: new Map(),
  on() { return !!this.w && Shell.on && Shell.w === this.w && !!this.w.morgul; },

  // ---- declaring ------------------------------------------------------------
  declare(w) {
    this.w = w; this.live.clear();
    const M = w.morgul, A = w.athelas, R = w.reverie;
    // the wounds a scuffle leaves: a bloody nose from a heavy blow, else a bruise; a second adds to the first
    A.course({ id: 'bruise', label: 'A bruise', tags: ['wound'], again: 'worsen', severity: { at: MIND_MORGUL.fist, stretch: 1.6, depth: 0.5 }, phases: [
      { id: 'smarting', label: 'smarting', minutes: [90, 150], weigh: { 'tag:work': 0.85, play: 0.7, party: 0.8, chase: 0.7 } },
      { id: 'bruised', label: 'black and blue', minutes: [1000, 1600], hurts: 0.35 },
    ] });
    A.course({ id: 'bloody_nose', label: 'A bloody nose', tags: ['wound'], again: 'worsen', severity: { at: SCUFFLE.noseAt, stretch: 1.4, depth: 0.5 }, phases: [
      { id: 'bleeding', label: 'bleeding', minutes: [20, 40], weigh: { sleep: 1, remedy_item: 1, '*': 0.6 } },
      { id: 'swollen', label: 'swollen', minutes: [1200, 2000], hurts: 0.4 },
    ] });
    M.wound({ id: 'bloody_nose', kinds: ['blunt'], at: [SCUFFLE.noseAt, 1], course: 'bloody_nose' });
    M.wound({ id: 'bruise', kinds: ['blunt'], course: 'bruise' });
    // what a harm leaves them feeling, as the game measures feelings (one at a time, refreshed)
    if (R) for (const k of HARM_FEELINGS) { const m = MOODLETS[k]; R.feeling({ id: k, label: m[0], weight: m[1], minutes: m[2], stack: 1, stress: 0 }); }
    this.beats = Tycho.minds.scuffles(w, { heavyAt: SCUFFLE.heavyAt });
  },

  // ---- reading ----------------------------------------------------------------
  fight(v) { if (!this.on() || !minded(v)) return null; const ex = this.w.bree.exchange(v._pid); return ex && this.w.morgul.fights(ex.kind) ? ex : null; },
  inFight(v) { return !!this.fight(v); },
  foe(v) { const ex = this.fight(v); if (!ex) return null; const o = ex.who.find((id) => id !== v._pid); return o ? Shell.byPid.get(o) || null : null; },
  hurt(v) { return this.on() && minded(v) ? this.w.morgul.hurt(v._pid) : 0; },
  wounds(v) { return this.on() && minded(v) ? this.w.morgul.wounds(v._pid) : []; },
  // Bree's squabble asks how readily it comes to blows: the one who'd start it, against the other
  escalation(ctx) {
    const v = ctx.person ? Shell.byPid.get(ctx.person.id) : null, o = ctx.target ? Shell.byPid.get(ctx.target) : null;
    if (!v || !o || v.inside || o.inside || v.carried || o.carried) return 0;
    if (v.isChild() !== o.isChild()) return 0;
    const out = (x) => x.stage === 'elder' || x.stage === 'baby' || register(x) === 'toddler' || !!x._arms;
    if (out(v) || out(o) || v.spouse === o.id || v.sweetheart === o.id || v.parents.includes(o.id) || o.parents.includes(v.id)) return 0;
    return SCUFFLE.rate * (0.4 + v.genes.temper * 1.2) * (v.isChild() ? SCUFFLE.kids : 1);
  },

  // ---- on screen --------------------------------------------------------------
  // the beats since the last look, played as they come
  flush() {
    harmTick();
    if (!this.on() || !this.beats) return;
    for (const b of this.beats.take()) { try { this.beat(b); } catch (e) { if (typeof noteError === 'function') noteError(e, 'a scuffle'); else console.error(e); } }
  },
  beat(b) {
    const [a, c] = b.who.map((id) => Shell.byPid.get(id));
    if (!a || !c) return;
    if (b.type === 'start') {
      const by = Shell.byPid.get(b.started) || a, other = by === a ? c : a;
      this.live.set(b.fight, { by, other, nose: [], place: placeWord(by), blows: 0 });
      scuffleSay(by, 'start', other);
      harmLater(2.6, () => scuffleSay(other, 'back', by));
      FX.puff((a.x + c.x) / 2, Math.min(a.y, c.y) - 14);
      // whoever's about sees it break out: a cry or two
      const seers = Natter.seers({ who: b.who }).map((id) => Shell.byPid.get(id)).filter((x) => x && !x.inside).slice(0, 2);
      seers.forEach((x, i) => harmLater(1.7 + i * 2.0, () => scuffleSay(x, 'see')));
      if (Game.selected === a || Game.selected === c) devLog('talk', `${by.first} and ${other.first} come to blows`);
      return;
    }
    const rec = this.live.get(b.fight);
    if (b.type === 'blow' && b.hit) {
      const by = Shell.byPid.get(b.hit.by), to = Shell.byPid.get(b.hit.to);
      if (!by || !to) return;
      if (rec) rec.blows++;
      // the one who swung lunges; the one struck is knocked back
      const dx = Math.sign(to.x - by.x) || 1;
      by._lunge = { dx, t: 0.35 }; to._knock = { dx, t: 0.5 };
      FX.puff(to.x, to.y - 12);
      if (b.hit.severity >= SCUFFLE.noseAt) {
        if (rec) rec.nose.push(to);
        FX.nosebleed(to.x, to.y - 14);
        scuffleSay(to, 'nose', by);
      } else {
        if (b.lands && R.chance(0.4)) scuffleSay(by, 'swing', to);
        harmLater(1.0, () => scuffleSay(to, b.hit.heavy && R.chance(0.3) ? 'stars' : 'hit', by));
      }
      if (b.hit.heavy) FX.stars(to.x, to.y - 20);
      return;
    }
    if (b.type === 'end') {
      this.live.delete(b.fight);
      if (!rec) return;
      this.ended(rec, b);
    }
  },
  // How it ended: a word from each, the chronicle (gossip carries it), and memories.
  ended(rec, b) {
    const { by, other } = rec;
    const mg = this.w.morgul;
    let text = '';
    if (b.end === 'yielded' || b.end === 'down') {
      // whoever is the more hurt gave in
      const loser = mg.hurt(by._pid) >= mg.hurt(other._pid) ? by : other, winner = loser === by ? other : by;
      // (after the last blow's cry)
      harmLater(1.6, () => scuffleSay(loser, b.end === 'down' ? 'stars' : 'yield', winner));
      harmLater(4, () => scuffleSay(winner, 'won', loser));
      loser.remember(`${winner.first} got the better of me in a scuffle.`, -2);
      text = `${loser.first} gave in first${rec.nose.includes(loser) ? ', with a bloody nose to show for it' : ''}.`;
    } else if (b.end === 'stepped in') {
      const m = Shell.byPid.get(b.mediator);
      if (m) { text = `${m.first} pulled them apart before it went any further.`; m.remember(`Pulled ${by.first} and ${other.first} apart when they came to blows.`, 0); }
      harmLater(3.4, () => { scuffleSay(by, 'after', other); scuffleSay(other, 'after', by); });
    } else if (b.end === 'left') {
      const l = Shell.byPid.get(b.left) || other;
      text = `${l.first} stalked off before it went any further.`;
    } else {
      harmLater(1.7, () => scuffleSay(other, 'after', by));
      text = 'Neither would say who came off best.';
    }
    const nose = rec.nose.filter((v) => !text.includes('bloody nose') || v !== rec.nose[0]);
    if (nose.length && b.end !== 'yielded') text += ` ${nose[0].first} came away with a bloody nose.`;
    chronicle(`${by.first} and ${other.first} came to blows ${rec.place}. ${text}`, 'quarrel');
    for (const [v, o] of [[by, other], [other, by]]) v.remember(`Came to blows with ${o.first} ${rec.place}.`, -2);
  },
  // the scuffle's end, for each of them (the kind's on.end): sore with each other, and sorry it came to that
  over(v, o) {
    v.bond(o, -0.05);
    feel(v, 'scuffled', o.first);
  },
  // the tussle itself, while it lasts: dust, and now and then a wild swing
  tick(v, task) {
    const o = Scuffle.foe(v);
    if (!o) return;
    if (o.x !== v.x) v.facing = o.x < v.x ? 'left' : 'right';
    if (v._pid < o._pid && Math.random() < 0.35) FX.dust((v.x + o.x) / 2, Math.max(v.y, o.y) - 4);
  },
  // How the tussle draws: a hop and a jostle, a lunge for a blow struck and a stagger for one taken (main.js).
  look(v, t) {
    const dtReal = v._lookT != null ? clamp(t - v._lookT, 0, 0.1) : 0;
    v._lookT = t;
    let xoff = Math.round(Math.sin(t * 13 + v.id) * 1.2), yoff = -Math.round(Math.abs(Math.sin(t * 9 + v.id * 1.7)) * 1.5);
    const pose = ['reach', 'stand', 'work', 'walk1'][Math.floor(t * 7 + v.id) % 4];
    for (const k of ['_lunge', '_knock']) {
      const m = v[k];
      if (!m) continue;
      m.t -= dtReal;
      if (m.t <= 0) { v[k] = null; continue; }
      xoff += Math.round(m.dx * (k === '_lunge' ? 3 : 4) * Math.min(1, m.t * 3));
      if (k === '_knock') yoff -= 1;
    }
    return { pose, xoff, yoff };
  },

  // ---- seeing to the hurt ---------------------------------------------------------
  // someone who likes them (family, a good friend, the herbalist) comes round to see to it
  tendRounds() {
    if (!this.on()) return;
    for (const p of Game.villagers) {
      if (p.leaving || !minded(p) || !(this.hurt(p) > 0.02) || this.wounds(p).every((w) => w.tended > 0)) continue;
      const kin = (o) => p.parents.includes(o.id) || o.parents.includes(p.id) || p.spouse === o.id || p.sweetheart === o.id;
      const folk = Game.villagers.filter((o) => o !== p && o.isGrown() && !o.leaving && minded(o) && !(this.hurt(o) > 0.02) && !this.inFight(o)
        && (kin(o) || (o.rel[p.id] || 0) > SCUFFLE.tendFrom || (o.job === 'herbalist' && R.chance(0.3))) && !o.queue.some((q) => q.a.id === 'tend_hurt'));
      folk.sort((x, y) => (kin(y) ? 1 : 0) - (kin(x) ? 1 : 0) || (y.rel[p.id] || 0) - (x.rel[p.id] || 0));
      if (folk.length && R.chance(SCUFFLE.tendChance)) folk[0].queue.push({ a: ACTIONS.tend_hurt, extra: { patient: p } });
    }
  },
  tend(v, p) {
    if (!this.on() || !minded(p) || !(this.hurt(p) > 0)) return;
    Shell.tell(p, 'morgul.tend', [p._pid, v._pid]);
    v.practice('herbalism', 10);
    if (!p.inside) {
      v.say(R.pick(['Let\'s have a look at that.', 'Hold still. This\'ll sting.', 'Dear me. Who did this to you?', 'A cold cloth, that\'s what you want.']), 2.6, { to: p });
      harmLater(3.4, () => p.say(R.pick(['Ow! ...Thank you.', 'You\'re very kind.', 'It\'s nothing, really. Ow.']), 2.4, { to: v }));
    }
    p.remember(`${v.first} came round to see to my bruises.`, 1);
    v.remember(`Saw to ${p.first}'s bruises.`, 1);
  },
};

// Where a scuffle broke out, in a word: outside the building they're nearest, or in the lane.
function placeWord(v) {
  let best = null, bd = 5 * 16;
  for (const b of Object.values(World.buildings || {}).concat(World.homes || [])) {
    if (!b || !b.name || b.stepX == null || b.built === false) continue;
    const d = dist(v.x, v.y, b.stepX, b.stepY);
    if (d < bd) { bd = d; best = b; }
  }
  return best ? `outside ${best.name}` : 'in the lane';
}

// a dust cloud and a few stars: the scuffle's own effects
FX.dust = function (x, y) { for (let i = 0; i < 3; i++) this.add({ k: 'puff', x: x + R.f(-7, 7), y: y + R.f(-4, 2), vx: R.f(-8, 8), vy: -R.f(1, 5), t: 0, life: R.f(0.6, 1.1), r: R.f(2, 3.5), col: R.pick(['#b8a07a', '#c8b48e', '#9a8a6a']) }); };
FX.nosebleed = function (x, y) { for (let i = 0; i < 4; i++) this.add({ k: 'drop', x: x + R.f(-1, 1), y, vx: R.f(-8, 8), vy: -R.f(6, 14), t: 0, life: 0.5, col: '#c0282a' }); };
FX.stars = function (x, y) { for (let i = 0; i < 3; i++) this.add({ k: 'spark', x: x + R.f(-4, 4), y: y + R.f(-2, 2), vx: R.f(-10, 10), vy: -R.f(8, 16), t: -i * 0.1, life: 0.9, col: '#ffe24a', g: 10, big: true }); };

window.addEventListener('DOMContentLoaded', () => {
  // the beats are played once the minds' clock has moved
  patch(Shell, 'advance', (adv) => function () { const r = adv.apply(this, arguments); Scuffle.flush(); return r; }, 'scuffle');
  addHook('onHour', (h) => { if (SCUFFLE.tendHours.includes(h)) Scuffle.tendRounds(); });
  // a scuffle is taken up where they stand (no walk there, no little ones to see to first)
  patch(Villager.prototype, 'begin', (begin) => function (a) {
    if (a !== ACTIONS.scuffle) return begin.apply(this, arguments);
    const o = Scuffle.foe(this), ex = Scuffle.fight(this);
    if (!o || !ex) return false;
    if (this.inside) this.exitBuilding();
    this.path = null;
    // (with the other as their partner in it: nobody downs it for work, and one leaving it brings the other's to an end)
    this.task = { a, phase: 'do', target: { x: this.x, y: this.y, foe: o }, t: a.dur, data: {}, before: { ...this.drives }, bree: ex.id, partner: o };
    this.pose = 'tussle'; this.facing = o.x < this.x ? 'left' : 'right';
    return true;
  }, 'scuffle');
  // nobody strikes up a natter with someone mid-scuffle
  patch(Villager.prototype, 'isBusyForChat', (busy) => function () { return (this.task && this.task.a.id === 'scuffle') || busy.call(this); }, 'scuffle');
  // the panel's health chips know about bruises and bloody noses
  const hc = healthChips;
  healthChips = function (v) {
    let out = hc(v);
    const hurt = Scuffle.wounds(v).filter((w) => !w.quiet);
    const chips = [];
    for (const w of hurt) {
      const label = { bruise: w.phase === 'smarting' ? 'Smarting from a scuffle' : 'Black and blue', bloody_nose: w.phase === 'bleeding' ? 'A bloody nose' : 'A swollen nose', sore_ankle: 'A sore ankle' }[w.wound];
      if (label) chips.push(`<span class="chip ${w.tended > 0 ? 'mid' : 'bad'}" title="${w.tended > 0 ? 'Seen to' : 'Nobody has seen to it yet'}">${label}</span>`);
    }
    if (chips.length) out = chips.join('') + out.replace('<span class="chip good">Hale and hearty</span>', '');
    return out;
  };
});
