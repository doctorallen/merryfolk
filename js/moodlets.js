'use strict';
// ---------------------------------------------------------------------------
// Feelings (moodlets, as The Sims calls them). Besides their needs, folk carry
// a handful of passing feelings, each with a reason and a while to last:
// "Danced at the party", "Had words with Rose", "Slept rough". Each lifts or
// sinks their mood a little, they show in the villager's panel, and the
// strongest of them comes out now and then when they muse aloud. A few are
// states rather than events (tipsy, cozy by a lit hearth, no roof of their
// own) and last exactly as long as the state does.
// ---------------------------------------------------------------------------

// key: [label ({x} is filled in), lift (−/+), minutes it lasts, musings]
const MOODLETS = {
  fav_food: ['Had my favorite: {x}', 0.1, 240, ['I could eat {x} every day.', 'Nothing beats {x}.']],
  bad_food: ['Had to eat {x}', -0.05, 120, ['I can still taste that {x}. Ugh.']],
  well_slept: ['Slept soundly', 0.07, 360, ['What a night\'s sleep!', 'Fresh as a daisy, I am.']],
  slept_rough: ['Slept rough', -0.14, 600, ['My back... a hedge is no bed.', 'One night under a roof, that\'s all I ask.']],
  soaked: ['Caught in the rain', -0.07, 120, ['Soaked to the skin!', 'My boots are full of water.']],
  sunshine: ['A lovely bright day', 0.05, 180, ['What a day to be out!', 'Feel that sun.']],
  party: ['Danced at the party', 0.13, 720, ['Still humming that jig from last night.', 'What a party that was!']],
  festival: ['Festival day!', 0.06, 900, ['Festival day! Everyone\'s in good spirits.']],
  patted: ['A kindly pat from above', 0.07, 120, ['Someone up there likes me.']],
  tutted: ['Tutted at from above', -0.07, 120, ['I\'m sure I didn\'t deserve that.']],
  quarrel: ['Had words with {x}', -0.11, 360, ['{x}, of all the stubborn...', 'I shouldn\'t have said that to {x}.']],
  good_chat: ['A good natter with {x}', 0.05, 180, ['{x} always cheers me up.']],
  flowers: ['{x} brought me flowers', 0.16, 720, ['Flowers, from {x}! Fancy that.']],
  present: ['A present from {x}', 0.12, 720, ['What a kind thing of {x}.']],
  wedding: ['Just married!', 0.28, 2880, ['Married! Me!', 'I\'m the luckiest hobbit in the Shire.']],
  saw_wed: ['Saw {x} wed', 0.1, 1440, ['Didn\'t {x} look a picture.']],
  new_baby: ['A new baby in the family', 0.22, 2880, ['Little {x}! Such tiny toes.']],
  made_piece: ['Proud of my new {x}', 0.07, 300, ['That {x} came out rather well.']],
  skill_up: ['Getting good at {x}', 0.09, 720, ['I\'m getting the knack of {x}.']],
  wish: ['Wish come true: {x}', 0.22, 1440, ['Who\'d have thought it, {x}!']],
  dream: ['Living the dream: {x}', 0.2, 99999, ['I always said I would: {x}.']],
  wish_lost: ['A wish fell through', -0.06, 480, ['Ah well. Some things aren\'t meant to be.']],
  birthday: ['My birthday!', 0.16, 1440, ['Another year older, and wiser too!']],
  gave_gift: ['Gave a present', 0.07, 600, ['Did you see {x}\'s face?']],
  got_letter: ['A letter from {x}', 0.1, 720, ['Fancy {x} writing to me!']],
  pet: ['Cuddled {x}', 0.06, 240, ['Who\'s a good {x}?']],
  missed: ['Missing {x}', -0.12, 2880, ['I keep setting a place for {x}.', 'The house is quiet without {x}.']],
  inspired: ['Inspired!', 0.15, 600, ['I\'ve had the most marvelous idea.']],
  gossip: ['Heard some juicy news', 0.04, 240, ['You\'ll never guess what I heard.']],
  larder_full: ['Larder stocked for winter', 0.06, 1440, ['Let the snow come. We\'ve jars a-plenty.']],
  larder_bare: ['Worried about winter', -0.07, 1440, ['The shelves look thin for winter.']],
};
const MOOD_SWAY = 0.26; // the most feelings can lift or sink a mood

function moodletsOf(v) { return v.moodlets || (v.moodlets = []); }

// Gives a villager a feeling (or refreshes it). `x` fills in the label.
function feel(v, key, x = '', mins) {
  const M = MOODLETS[key];
  if (!M || !v || v.stage === 'baby' || v.gone) return;
  const list = moodletsOf(v);
  const until = Game.time + (mins ?? M[2]);
  if (minded(v)) { Shell.feel(v, key, x, until); return; } // (Reverie's: shell.js)
  const old = list.find((m) => m.k === key && m.x === x) || (['soaked', 'sunshine', 'festival', 'well_slept', 'slept_rough', 'made_piece'].includes(key) && list.find((m) => m.k === key));
  if (old) { old.until = Math.max(old.until, until); old.x = x; return; }
  list.push({ k: key, x, until });
  // a dozen at most: the weakest go first
  if (list.length > 12) { list.sort((a, b) => Math.abs(MOODLETS[b.k][1]) - Math.abs(MOODLETS[a.k][1])); list.length = 12; }
  if (typeof devLog === 'function' && Game.selected === v) devLog('mood', `${v.first}: ${moodletLabel({ k: key, x })} (${M[1] > 0 ? '+' : ''}${Math.round(M[1] * 100)})`);
}
function unfeel(v, key) { if (v.moodlets) v.moodlets = v.moodlets.filter((m) => m.k !== key); }
function moodletLabel(m) { return MOODLETS[m.k][0].replace('{x}', m.x); }

// Feelings that last just as long as how things are.
function stateFeelings(v) {
  const out = [];
  if (v.stage === 'baby') return out;
  const at = v.inside, home = v.homeId >= 0 ? v.home() : null;
  if (v.chem.ale > 0.45) out.push(['Merrily tipsy', 0.06]);
  if (v.chem.hangover > 0.25) out.push(['Sore head', -0.08]);
  if (home && at === home && home.chilly) out.push(['Cold hearth at home', -0.08]);
  else if (home && at === home && (World.season === 'winter' || World.season === 'autumn') && Game.hour >= 18) out.push(['Warm and cozy by the fire', 0.06]);
  if (v.homeId < 0 && v.isGrown()) out.push(['No roof of my own', -0.09]);
  if (v.spouse && person(v.spouse) && !person(v.spouse).gone && Game.villagers.includes(person(v.spouse))) out.push(['Happily married', 0.04]);
  return out;
}

// All the feelings, strongest first: [label, lift, minutes left or null].
function feelingsOf(v) {
  const now = Game.time;
  const list = moodletsOf(v).filter((m) => m.until > now && MOODLETS[m.k]);
  v.moodlets = list;
  return list.map((m) => [moodletLabel(m), MOODLETS[m.k][1], m.until - now, m])
    .concat(stateFeelings(v).map(([l, val]) => [l, val, null, null]))
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
}
function feelingsLift(v) { return clamp(feelingsOf(v).reduce((s, f) => s + f[1], 0), -MOOD_SWAY, MOOD_SWAY); }

// Mood: how well their needs are met, lifted or sunk by how they feel.
{
  const baseMood = Villager.prototype.mood;
  Villager.prototype.baseMood = baseMood;
  Villager.prototype.mood = function () {
    // worked out a few times a game-minute at most
    if (this._moodAt === Game.time && this._moodVal != null) return this._moodVal;
    this._moodAt = Game.time;
    this._moodVal = clamp(baseMood.call(this) + (this.stage === 'baby' ? 0 : feelingsLift(this)), 0, 1);
    return this._moodVal;
  };
}

// Every so often, a look at what's going on around them.
function moodTick(v, dt) {
  v._moodT = (v._moodT ?? Math.random() * 10) - dt;
  if (v._moodT > 0) return;
  v._moodT = 10;
  if (v.stage === 'baby' || v.leaving) return;
  const out = !v.inside && !v.carried;
  if (out && Game.raining && !(v.task && v.task.a.id === 'sleep_rough')) feel(v, 'soaked');
  if (out && Game.weather === 'clear' && (World.season === 'summer' || World.season === 'spring') && Game.hour > 9 && Game.hour < 18 && R.chance(0.3)) feel(v, 'sunshine');
  if (Game.festivalDay === Game.day && Game.hour > 8) feel(v, 'festival');
}

// When something's on their mind, it comes out when they muse aloud.
{
  patch(Villager.prototype, 'chatter', (chatter) => function () {
    if (this.isGrown() || this.isChild()) {
      const strong = feelingsOf(this).filter((f) => f[3] && Math.abs(f[1]) >= 0.07);
      if (strong.length && R.chance(0.3)) {
        const m = strong[0][3], lines = MOODLETS[m.k][3];
        if (lines && lines.length) { this.say(R.pick(lines).replace(/\{x\}/g, m.x), undefined, { think: true }); return; }
      }
    }
    chatter.call(this);
  }, 'moodlets');
}

// --- What brings feelings on ------------------------------------------------
{
  const am = afterMeal;
  afterMeal = function (v, kind) {
    am(v, kind);
    if (!kind) return;
    const taste = (v.genes.food[kind] || 1) * (v.foodLike[kind] || 1);
    if (kind === v.favoriteFood() || taste > 1.35) feel(v, 'fav_food', FOODS[kind].label);
    else if (taste < 0.75) feel(v, 'bad_food', FOODS[kind].label);
  };
  const pat = Villager.prototype.pat, tut = Villager.prototype.tut;
  Villager.prototype.pat = function () { feel(this, 'patted'); unfeel(this, 'tutted'); return pat.call(this); };
  Villager.prototype.tut = function () { feel(this, 'tutted'); unfeel(this, 'patted'); return tut.call(this); };
  patch(Villager.prototype, 'finish', (finish) => function () {
    const task = this.task;
    if (task) {
      const id = task.a.id;
      if (id === 'party') feel(this, 'party');
      else if (id === 'sleep' && this.inside && this.inside.kind === 'home' && this.drives.tired < 0.25 && !this.inside.chilly) { feel(this, 'well_slept'); unfeel(this, 'slept_rough'); }
      else if (id === 'sleep_rough') feel(this, 'slept_rough');
      else if (id === 'chat' && task.partner) {
        if (task.data.quarrel) feel(this, 'quarrel', task.partner.first);
        else if ((this.rel[task.partner.id] ?? 0) > 0.35 && R.chance(0.5)) feel(this, 'good_chat', task.partner.first);
      }
    }
    return finish.call(this);
  }, 'moodlets');
  const w = wed;
  wed = function (a, b) {
    w(a, b);
    feel(a, 'wedding'); feel(b, 'wedding');
    for (const o of Game.villagers) {
      if (o === a || o === b) continue;
      if (a.parents.includes(o.id) || b.parents.includes(o.id) || (o.rel[a.id] ?? 0) > 0.55 || (o.rel[b.id] ?? 0) > 0.55) feel(o, 'saw_wed', (o.rel[a.id] ?? 0) >= (o.rel[b.id] ?? 0) ? a.first : b.first);
    }
  };
  const bi = birth;
  birth = function (a, b) {
    const baby = bi(a, b);
    for (const o of Game.villagers) {
      if (o === baby) continue;
      if (o === a || o === b || o.parents.includes(a.id) || o.parents.includes(b.id) || a.parents.includes(o.id) || (b.parents && b.parents.includes(o.id))) feel(o, 'new_baby', baby.first);
    }
    return baby;
  };
  const mp = madePiece;
  madePiece = function (v, k, extra = '') {
    mp(v, k, extra);
    feel(v, 'made_piece', extra || HOBBIES[k].made[0]);
  };
}
