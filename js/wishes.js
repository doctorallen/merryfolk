'use strict';
// ---------------------------------------------------------------------------
// Wishes and dreams (as in The Sims' wants and lifetime aspirations).
//
// Wishes are small, near things: a plate of their favourite, a dance at the
// next party, a good natter with an old friend, making it up after a squabble,
// a slice of seed-cake, fireworks. Folk carry one or two at a time, chosen by
// their nature and how things stand; a wish leans them a little towards what
// would grant it, and if it comes true they're delighted for a day. Some are
// in your gift: drop a cake or a storybook nearby, set off fireworks, give
// them a pat or a lesson. Wishes that don't come true in a day or two fade.
//
// A dream is a whole life's hope, one for each grown-up: to become an expert
// at their trade, to raise a big family, to have friends all over the village,
// to marry, to fill the house with things they've made or found, to be the
// most learned hobbit in the valley, or (for the rift-folk) to make a real
// home among the hill-folk. Its progress shows in their Mind tab; when it's
// achieved, the village hears of it and they glow with it for days.
// ---------------------------------------------------------------------------

const kidsOfV = (v) => Game.villagers.filter((o) => o.parents.includes(v.id)).length + Object.values(Game.archive || {}).filter((o) => o && o.parents && o.parents.includes(v.id)).length;
const goodFriends = (v, min = 0.5) => Object.entries(v.rel).filter(([id, r]) => r >= min && personById(+id) && Game.villagers.includes(personById(+id)));
const grownOrKid = (v) => v.isGrown() || v.isChild();

// on: what grants it, 'feel:<moodlet>' (its {x} must match the wish's x if
// the wish has one), 'act:<action>' when they finish that action, or 'poll'
// (checked every hour). nudge: actions they lean towards while they wish it.
const WISHES = {
  fav_food: {
    w: (v) => (grownOrKid(v) ? 1 : 0), make: (v) => ({ x: FOODS[v.favouriteFood()].label }),
    text: (w) => `A plate of ${w.x}`, on: ['feel:fav_food'], nudge: ['eat_home', 'eat_inn', 'market', 'bake_home'],
    say: ['I could just eat some {x}.', 'What I wouldn\'t give for {x}.'],
  },
  cake: {
    w: (v) => (grownOrKid(v) ? 0.4 + (v.genes.food.cake || 1) * 0.5 + (v.isChild() ? 0.6 : 0) : 0),
    text: () => 'A slice of seed-cake', on: ['act:eat_item'], nudge: ['eat_item'], hint: 'Drop a seed-cake near them',
    say: ['A slice of seed-cake would go down nicely.', 'Is there cake? I smell cake.'],
  },
  book: {
    w: (v) => (v.isChild() ? 1.2 : v.isGrown() ? v.genes.curiosity * 0.8 + v.edu * 0.6 : 0),
    text: () => 'A new storybook', on: ['act:read_item'], nudge: ['read_item', 'read'], hint: 'Drop a storybook nearby',
    say: ['I\'ve read every book in the house twice.', 'I wish I had a new story to read.'],
  },
  pint: {
    w: (v) => (v.isGrown() ? 0.3 + (v.genes.taste.ale || 1) * 0.6 + v.genes.sociability * 0.4 : 0),
    text: () => 'A pint at the Tipsy Badger', on: ['act:ale', 'act:ale_item'], nudge: ['ale'], hint: 'Or roll out a keg of ale',
    say: ['A pint would set me right.', 'I\'ve a thirst only the Badger can fix.'],
  },
  party: {
    w: (v) => (grownOrKid(v) ? v.genes.merriness * 0.8 + v.genes.sociability * 0.6 - (v.stage === 'elder' ? 0.4 : 0) : 0),
    text: () => 'Dance at a party', on: ['feel:party'], nudge: ['party'], hint: 'Fireworks in the party field start a party',
    say: ['I could do with a good knees-up.', 'When\'s the next party, I wonder?'],
  },
  fireworks: {
    w: (v) => (v.isChild() ? 1.4 : v.isGrown() ? v.genes.merriness * 0.4 : 0),
    text: () => 'See fireworks', on: ['fireworks'], hint: 'Set off fireworks',
    say: ['I want to see the fireworks go BANG!', 'Fireworks! Please let there be fireworks.'],
  },
  catch_up: {
    w: (v) => (grownOrKid(v) && goodFriends(v).length ? 0.6 + v.genes.sociability : 0),
    make: (v) => { const f = goodFriends(v).map(([id]) => personById(+id)).filter((o) => o && o.homeId !== v.homeId && o.stage !== 'baby'); return f.length ? { x: R.pick(f).first } : null; },
    text: (w) => `A good natter with ${w.x}`, on: ['feel:good_chat'], nudge: ['chat'],
    say: ['I haven\'t seen {x} in an age.', 'I must catch up with {x}.'],
  },
  make_up: {
    w: () => 0, // only after a squabble
    text: (w) => `Make it up with ${w.x}`, on: ['feel:good_chat', 'poll'], nudge: ['chat'], days: 2,
    poll: (v, w) => { const o = Game.villagers.find((p) => p.first === w.x); return o && (v.rel[o.id] ?? 0) >= 0.25; },
    say: ['I was too hard on {x}.', 'I ought to say sorry to {x}.'],
  },
  make_piece: {
    w: (v) => (hobbyAge(v) && hobbiesOf(v).some((k) => HOBBIES[k].craft || k === 'knitting' || k === 'painting') ? 1 : 0),
    make: (v) => { const ks = hobbiesOf(v).filter((k) => HOBBIES[k].craft || k === 'knitting' || k === 'painting'); const k = R.pick(ks); return { x: HOBBIES[k].made[0], hk: k }; },
    text: (w) => `Finish a ${w.x}`, on: ['feel:made_piece'], nudge: (w) => ['hobby_' + w.hk],
    say: ['I\'ve a {x} half-done that wants finishing.', 'Just a few more evenings on that {x}.'],
  },
  present: {
    w: (v) => (v.isGrown() ? v.genes.sociability * 0.6 + v.genes.merriness * 0.4 : 0),
    text: () => 'Give someone a present', on: ['feel:gave_gift'], nudge: ['gift'],
    say: ['I\'d like to make someone smile today.'],
  },
  fish: {
    w: (v) => (grownOrKid(v) ? 0.3 + (v.genes.taste.fish || 1) * 0.4 + (v.job === 'fisher' ? 0.2 : 0) : 0),
    text: () => 'Catch a fish', on: ['act:fish', 'act:work_fish'], nudge: ['fish'],
    say: ['They\'ll be biting down at the river today.'],
  },
  play: {
    w: (v) => (v.isChild() ? 1.3 : 0),
    text: () => 'Play out with my friends', on: ['act:play', 'act:chase'], nudge: ['play', 'chase'],
    say: ['Can I go out to play? Please?'],
  },
  sunshine: {
    w: (v) => (grownOrKid(v) && (Game.raining || Game.weather === 'cloudy') && World.season !== 'winter' ? 0.6 : 0),
    text: () => 'A bright, sunny day', on: ['feel:sunshine'],
    say: ['I wish this weather would clear.', 'Come out, sun!'],
  },
  pat: {
    w: (v) => (grownOrKid(v) ? 0.25 + v.genes.sociability * 0.2 : 0),
    text: () => 'A kindly pat from above', on: ['feel:patted'], hint: 'Pat them (P)',
    say: ['I do hope someone up there is watching.'],
  },
  lesson: {
    w: (v) => (v.isChild() ? 0.8 : v.isGrown() && v.edu < 0.6 ? v.genes.curiosity * 0.5 : 0),
    make: (v) => ({ n: v.edu }), text: () => 'Learn something new', on: ['poll'], poll: (v, w) => v.edu >= w.n + 0.02, nudge: ['school', 'read', 'read_item'], hint: 'Teach them (E)',
    say: ['I want to know how everything works!', 'I wish I knew my letters better.'],
  },
  remedy: {
    w: (v) => (v.isSick() && v.stage !== 'baby' ? 3 : 0),
    text: () => 'Something for this cold', on: ['poll'], poll: (v) => !v.isSick(), nudge: ['remedy_item', 'sleep'], hint: 'Drop a remedy near them',
    say: ['*sniff* I feel awful.', 'Has anyone got a remedy? *achoo*'],
  },
  sweetheart: {
    w: (v) => (v.stage === 'adult' && !v.spouse && !v.sweetheart ? v.genes.romance * 1.4 : 0), days: 3,
    text: () => 'Find a sweetheart', on: ['poll'], poll: (v) => v.sweetheart != null, nudge: ['party', 'eat_inn', 'ale', 'chat'],
    say: ['Is there nobody for me in all Thistledown?', 'Maybe at the next party I\'ll meet someone.'],
  },
  baby: {
    w: (v) => (v.stage === 'adult' && v.spouse && kidsOfV(v) < 4 ? v.genes.fertility * 0.9 + (kidsOfV(v) ? 0 : 0.6) : 0), days: 4,
    make: (v) => ({ n: kidsOfV(v) }), text: () => 'A little one of our own', on: ['poll'], poll: (v, w) => kidsOfV(v) > w.n,
    say: ['Wouldn\'t a little one be lovely?', 'I keep looking at cradles.'],
  },
  roof: {
    w: (v) => (v.homeId < 0 && v.isGrown() ? 4 : 0), days: 4,
    text: () => 'A roof of my own', on: ['poll'], poll: (v) => v.homeId >= 0,
    say: ['One night under a proper roof, that\'s all.'],
  },
  birds: {
    w: (v) => (hasHobby(v, 'birdwatching') ? 1.2 : 0),
    make: (v) => ({ n: v.birds || 0 }), text: () => 'Spot a bird I\'ve never seen', on: ['poll'], poll: (v, w) => (v.birds || 0) > w.n, nudge: ['hobby_birdwatching'],
    say: ['They say there\'s a kingfisher down by the mill.'],
  },
};

// A life's dream: progress 0..1.
const DREAMS = {
  master: {
    w: (v) => 0.8 + v.genes.laziness * -0.5 + (v.job ? 0.4 : 0),
    make: (v) => { const s = v.job ? JOBS[v.job].skill : topTalents(v.genes, 1)[0]; return { s }; },
    text: (d) => `Become an expert at ${SKILL_LABEL[d.s].toLowerCase()}`, prog: (v, d) => (v.skills[d.s] || 0) / 75,
  },
  family: {
    w: (v) => (v.stage === 'adult' ? v.genes.fertility * 0.8 + v.genes.romance * 0.5 : 0),
    text: () => 'Raise a big family', prog: (v) => kidsOfV(v) / 3,
  },
  friends: {
    w: (v) => v.genes.sociability * 1.2 + v.genes.merriness * 0.3,
    text: () => 'Have ten good friends in the village', prog: (v) => goodFriends(v).length / 10,
  },
  wed: {
    w: (v) => (v.stage === 'adult' && !v.spouse ? v.genes.romance * 1.4 : 0),
    text: () => 'Marry my true love', prog: (v) => (v.spouse ? 1 : v.sweetheart ? 0.5 + (v.love[v.sweetheart] || 0) * 0.4 : 0),
  },
  treasures: {
    w: (v) => (hobbyAge(v) && hobbiesOf(v).length ? 0.9 : 0),
    make: (v) => ({ hk: R.pick(hobbiesOf(v)) }),
    text: (d) => (d.hk === 'collecting' || d.hk === 'birdwatching' ? 'Fill the house with finds and curios' : `Fill the house with my ${HOBBIES[d.hk].made[1]}`),
    prog: (v, d) => (v.homeId < 0 ? 0 : d.hk === 'collecting' || d.hk === 'birdwatching' ? collectionTotal(v.home()) / 30 : (homeCrafts(v.home())[d.hk] || 0) / 25),
  },
  learned: {
    w: (v) => v.genes.curiosity * 0.8 + v.genes.wit * 0.5 + v.edu * 0.6,
    make: (v) => ({ from: v.edu }), text: () => 'Become the most learned hobbit in the valley', prog: (v) => (v.edu - 0.3) / 0.6,
  },
  belong: {
    w: (v) => (v.isRiftborn() ? 3 : 0),
    text: () => 'Make a real home among the hill-folk', prog: (v) => (v.homeId >= 0 ? 0.4 : 0) + Math.min(0.6, goodFriends(v, 0.45).filter(([id]) => !personById(+id).isRiftborn()).length * 0.15),
  },
};

function wishesOf(v) { return v.wishes || (v.wishes = []); }
function wishText(w) { return WISHES[w.k] ? WISHES[w.k].text(w) : w.k; }
function dreamText(d) { return DREAMS[d.k] ? DREAMS[d.k].text(d) : d.k; }
function dreamProgress(v) { const d = v.dream; return d && DREAMS[d.k] ? clamp(DREAMS[d.k].prog(v, d), 0, 1) : 0; }

function addWish(v, k, extra = {}) {
  const W = WISHES[k];
  if (!W || v.stage === 'baby' || v.leaving) return null;
  const list = wishesOf(v);
  if (list.some((w) => w.k === k)) return null;
  const made = W.make ? W.make(v) : {};
  if (made === null) return null;
  const w = { k, ...made, ...extra, made: Game.time, until: Game.time + (W.days || 1.5) * 1440 };
  list.push(w);
  if (typeof devLog === 'function' && Game.selected === v) devLog('mood', `${v.first} wishes: ${wishText(w)}`);
  return w;
}
// A new wish, chosen by their nature and how things stand.
function rollWish(v) {
  const list = wishesOf(v);
  const max = v.isChild() ? 2 : 2;
  if (list.length >= max) return;
  const opts = [];
  for (const k in WISHES) { if (list.some((w) => w.k === k)) continue; const w = Math.max(0, WISHES[k].w(v)); if (w > 0) opts.push([k, w * R.f(0.5, 1.5)]); }
  if (!opts.length) return;
  opts.sort((a, b) => b[1] - a[1]);
  addWish(v, opts[0][0]);
}
function grantWish(v, w) {
  v.wishes = wishesOf(v).filter((x) => x !== w);
  const text = wishText(w);
  feel(v, 'wish', text.charAt(0).toLowerCase() + text.slice(1));
  v.remember(`Got my wish: ${text.toLowerCase()}.`, 2);
  v.stats.wishes = (v.stats.wishes || 0) + 1;
  if (!v.inside) { FX.sparkle(v.x, v.y - 20, '#ffe680'); v.say(R.pick(['My wish came true!', 'Oh, how wonderful!', 'Just what I wanted!']), 2.6); }
  // the ones you granted get a word in the corner
  if (WISHES[w.k].hint && !WISHES[w.k].on.includes('poll') && typeof toast === 'function') toast(`${v.first}'s wish came true: ${text.toLowerCase()}.`, 'love');
  devLog('mood', `${v.first}'s wish came true: ${text}`);
}
// Something happened to them: does it grant a wish?
function wishEvent(v, ev, x) {
  if (!v.wishes || !v.wishes.length) return;
  for (const w of v.wishes.slice()) {
    const W = WISHES[w.k];
    if (!W || !W.on.includes(ev)) continue;
    if (w.x && x !== undefined && x !== w.x && ev.startsWith('feel:')) continue;
    grantWish(v, w);
  }
}

function pickDream(v) {
  const opts = [];
  for (const k in DREAMS) {
    if ((v.dreamsDone || []).some((d) => d.k === k)) continue;
    const w = DREAMS[k].w(v);
    if (w > 0) opts.push([k, w * R.f(0.6, 1.4)]);
  }
  if (!opts.length) return;
  opts.sort((a, b) => b[1] - a[1]);
  const k = opts[0][0];
  v.dream = { k, ...(DREAMS[k].make ? DREAMS[k].make(v) : {}), since: Game.day };
  // a dream that's already as good as done isn't much of a dream
  if (dreamProgress(v) >= 0.9) { (v.dreamsDone || (v.dreamsDone = [])).push({ k, text: dreamText(v.dream), day: Game.day, quiet: true }); v.dream = null; }
}

// Every hour: wishes come and go, dreams are checked.
function wishesHourly(h) {
  for (const v of Game.villagers) {
    if (v.stage === 'baby' || v.leaving) continue;
    const list = wishesOf(v);
    // polled wishes
    for (const w of list.slice()) { const W = WISHES[w.k]; if (W && W.on.includes('poll') && W.poll(v, w)) grantWish(v, w); }
    // stale ones fade
    for (const w of wishesOf(v).slice()) {
      if (w.until < Game.time) { v.wishes = v.wishes.filter((x) => x !== w); if (R.chance(0.4)) feel(v, 'wish_lost'); }
    }
    // new ones, mostly in the morning
    if ((h === 8 || h === 13 || h === 17) && R.chance(h === 8 ? 0.7 : 0.35)) rollWish(v);
    // dreams
    if (v.isGrown()) {
      if (!v.dream && (!v.dreamsDone || !v.dreamsDone.length || Game.day - v.dreamsDone[v.dreamsDone.length - 1].day >= 3)) pickDream(v);
      if (v.dream && dreamProgress(v) >= 1) {
        const text = dreamText(v.dream);
        (v.dreamsDone || (v.dreamsDone = [])).push({ k: v.dream.k, text, day: Game.day });
        v.dream = null;
        feel(v, 'dream', text.charAt(0).toLowerCase() + text.slice(1), 1440 * 4);
        v.remember(`Lived my dream: ${text.toLowerCase()}.`, 3);
        chronicle(`${v.name()} has lived ${v.pron.their} dream: ${text.charAt(0).toLowerCase() + text.slice(1)}.`, 'love');
        if (!v.inside) FX.sparkle(v.x, v.y - 20, '#ffe680');
      }
    }
  }
}

// --- Hooks -----------------------------------------------------------------
{
  const f = feel;
  feel = function (v, key, x = '', mins) {
    f(v, key, x, mins);
    if (v && key !== 'wish' && key !== 'dream') wishEvent(v, 'feel:' + key, x);
    // a squabble leaves a wish to make it up
    if (v && key === 'quarrel' && R.chance(0.6) && v.isGrown()) addWish(v, 'make_up', { x });
  };
  const finish = Villager.prototype.finish;
  Villager.prototype.finish = function () {
    const id = this.task && this.task.a.id;
    const r = finish.call(this);
    if (id) wishEvent(this, 'act:' + id);
    return r;
  };
  // fireworks and the hour are main.js's, which loads last: hook them just before it boots
  window.addEventListener('DOMContentLoaded', () => {
    const fw = fireworkShow;
    fireworkShow = function (x, y, n) {
      fw(x, y, n);
      for (const v of Game.villagers) if (!(v.task && v.task.a.id === 'sleep' && v.task.phase === 'do')) wishEvent(v, 'fireworks');
    };
    const oh = onHour;
    onHour = function (h) { wishesHourly(h); return oh(h); };
  });
  // a wish leans them towards what would grant it
  const score = Villager.prototype.score;
  Villager.prototype.score = function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s > 0 && this.wishes && this.wishes.length) {
      for (const w of this.wishes) {
        const W = WISHES[w.k];
        const nudge = W && (typeof W.nudge === 'function' ? W.nudge(w) : W.nudge);
        if (nudge && nudge.includes(a.id)) { s *= 1.35; if (ex) ex.mul.push(['a wish', 1.35]); break; }
      }
    }
    return s;
  };
  // and it's on their mind when they muse aloud
  const chatter = Villager.prototype.chatter;
  Villager.prototype.chatter = function () {
    const ws = (this.wishes || []).filter((w) => WISHES[w.k] && WISHES[w.k].say);
    if (ws.length && R.chance(0.22)) { const w = R.pick(ws); this.say(R.pick(WISHES[w.k].say).replace(/\{x\}/g, w.x || ''), undefined, { think: true }); return; }
    chatter.call(this);
  };
}
