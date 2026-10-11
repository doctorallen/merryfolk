'use strict';
// ---------------------------------------------------------------------------
// Hearts: deeper relationships and moods (The Sims' sentiments, Wildermyth's
// rivals, RimWorld's inspirations, Dwarf Fortress's strange moods).
//
//  * Sentiments: how one villager feels about another, and why. Not just a
//    friendship number but "Grateful (brought me flowers)", "Hurt (that
//    squabble)", "Welcomed (had me to supper)". Up to three per person, fading
//    with time, shown on the Kin tab. They warm or cool a friendship, and come
//    out when the two meet ("Thank you again for the flowers!").
//  * Likes and dislikes: rain, mushrooms, music, gardens, rift-tech, quiet,
//    crowds, poetry, sunshine, animals. Folk who share them get on faster.
//    A rain-lover enjoys a downpour; a crowd-hater is glad to leave a party.
//  * Rivals: many grown-ups have one friendly rival, usually in the same
//    trade or hobby. On market day and at the autumn fair they compete (best
//    marrow, best pie, best ale, finest carving) and the Chronicle reports the
//    winner. Rivals who become real friends shake hands, and it's a story.
//  * Inspirations and sulks: someone very happy for a while may be struck by
//    inspiration (a baking spree for the whole village, a burst of creative
//    work, matchmaking, wanderlust); someone miserable may sulk (shut indoors,
//    comfort-eating, a huffy walk). Friends, letters and kindness end sulks.
//  * Masterpieces: once in a lifetime, a skilled maker is seized by a fey
//    mood, shuts themselves in their workshop and comes out with a named
//    heirloom that shows their dearest memory, and the village is proud of it.
// ---------------------------------------------------------------------------

// --- Sentiments --------------------------------------------------------------------
const SENT = {
  grateful: ['Grateful', 1], fond: ['Fond', 1], welcomed: ['Welcomed', 1], kindred: ['Kindred', 1], touched: ['Touched', 1], cherished: ['Cherished', 1], admiring: ['Admiring', 1],
  hurt: ['Hurt', -1], prickly: ['Prickly', -1], jealous: ['Jealous', -1],
};
// what turns a feeling about someone into a sentiment
const FEEL_SENT = { flowers: ['fond', 'brought me flowers'], present: ['grateful', 'a present'], quarrel: ['hurt', 'that squabble'], supper: ['welcomed', 'supper together'], turned: ['kindred', 'a true friendship'], got_letter: ['touched', 'a letter'], keepsake: ['cherished', 'the keepsake'], reunion: ['cherished', 'finding each other again'], good_chat: ['fond', 'a good natter'] };
function sentimentsOf(v, o) { const s = v.sent && v.sent[o.id]; return s ? s.filter((x) => x.until > Game.time) : []; }
function addSentiment(v, o, tag, why, days = 6) {
  if (!v || !o || v === o || v.stage === 'baby') return;
  const S = v.sent || (v.sent = {});
  const list = (S[o.id] || []).filter((x) => x.until > Game.time && x.tag !== tag);
  list.unshift({ tag, why, until: Game.time + days * 1440 });
  S[o.id] = list.slice(0, 3);
  // a lasting warmth (or coolness)
  v.rel[o.id] = clamp((v.rel[o.id] ?? 0.1) + SENT[tag][1] * 0.04, -1, 1);
}
{
  const f = feel;
  feel = function (v, key, x = '', mins) {
    f(v, key, x, mins);
    const m = FEEL_SENT[key];
    if (!m || !v || !x || (key === 'good_chat' && !R.chance(0.25))) return;
    const o = Game.villagers.filter((p) => p.first === x && p !== v).sort((a, b) => (v.rel[b.id] || 0) - (v.rel[a.id] || 0))[0];
    if (o) addSentiment(v, o, m[0], m[1]);
  };
  // the cure, nursing: grateful to the nurse
  const cure = Villager.prototype.cure;
  Villager.prototype.cure = function (by, nurse) { const sick = this.isSick(); const r = cure.call(this, by, nurse); if (sick && nurse) addSentiment(this, nurse, 'grateful', 'nursed me when I was poorly', 8); return r; };
  // sentiments warm or cool a friendship, and shared likes help
  const bond = Villager.prototype.bond;
  Villager.prototype.bond = function (o, amt) {
    let k = 1;
    if (amt > 0) {
      const sh = sharedLikes(this, o);
      k += sh * 0.25;
      if (clashes(this, o)) k -= 0.3;
      for (const s of sentimentsOf(this, o)) k += SENT[s.tag][1] * 0.15;
    }
    return bond.call(this, o, amt * Math.max(0.2, k));
  };
}
// A sentiment comes out when they meet.
const SENT_LINES = {
  grateful: ['Thank you again for {why}, {name}.', 'I still owe you for {why}!'], fond: ['There\'s my favourite {name}!', 'I was hoping I\'d see you, {name}.'], welcomed: ['That supper was the nicest evening I\'ve had in an age.'],
  kindred: ['Kindred spirits, you and me, {name}.'], touched: ['Your letter made my week, {name}.'], cherished: ['I keep it by my bed, you know.'], admiring: ['How do you do it, {name}?'],
  hurt: ['I haven\'t forgotten {why}, {name}.', 'Oh. It\'s you.'], prickly: ['Enjoy it while it lasts, {name}.', 'Hmph. Next year, {name}.'], jealous: ['Some folk have all the luck.'],
};
{
  const cv = converse;
  converse = function (s, l, mode) {
    if (!mode && R.chance(0.25)) {
      const st = sentimentsOf(s, l)[0];
      if (st && SENT_LINES[st.tag]) return R.pick(SENT_LINES[st.tag]).replace('{name}', l.first).replace('{why}', st.why);
    }
    return cv(s, l, mode);
  };
}

// --- Likes and dislikes -----------------------------------------------------------------
const LIKES = { rain: 'the rain', mushrooms: 'mushrooms', music: 'music', gardens: 'gardens', rifttech: 'rift-tech', quiet: 'peace and quiet', crowds: 'a good crowd', poetry: 'poetry', sunshine: 'sunshine', animals: 'animals' };
function likesOf(v) {
  if (v.likes) return v.likes;
  const g = v.genes, w = {
    rain: 0.3 + g.hardiness * 0.4, mushrooms: (g.food.mush || 1) * 0.6, music: g.apt.music * 0.8 + g.merriness * 0.2, gardens: g.apt.farming * 0.5 + g.apt.herbalism * 0.3,
    rifttech: v.tech * 1.2 + g.curiosity * 0.2, quiet: (1 - g.sociability) * 0.8, crowds: g.sociability * 0.8, poetry: v.edu * 0.6 + g.wit * 0.3, sunshine: 0.4 + g.merriness * 0.3, animals: 0.3 + g.fertility * 0.4,
  };
  const keys = Object.keys(w).map((k) => [k, w[k] * (0.6 + hash2(v.id * 13 + k.length, k.charCodeAt(0)) * 0.8)]).sort((a, b) => b[1] - a[1]);
  v.likes = keys.slice(0, 2).map((x) => x[0]);
  v.dislikes = [keys[keys.length - 1][0] === 'crowds' && v.likes.includes('quiet') ? 'crowds' : keys[keys.length - 1][0]];
  if (v.likes.includes('quiet') && v.likes.includes('crowds')) v.likes[1] = keys[2][0];
  return v.likes;
}
const likes = (v, k) => likesOf(v).includes(k);
const dislikes = (v, k) => (likesOf(v), v.dislikes.includes(k));
function sharedLikes(a, b) { return likesOf(a).filter((k) => likesOf(b).includes(k)).length; }
function clashes(a, b) { likesOf(a); likesOf(b); return a.likes.some((k) => b.dislikes.includes(k)) || b.likes.some((k) => a.dislikes.includes(k)); }
MOODLETS.liked = ['Enjoyed {x}', 0.06, 240, ['I do love {x}.']];
MOODLETS.disliked = ['Had to put up with {x}', -0.05, 180, ['I can\'t abide {x}.']];
{
  const sf = stateFeelings;
  stateFeelings = function (v) {
    const out = sf(v);
    if (v.stage === 'baby') return out;
    if (Game.raining && !v.inside) { if (likes(v, 'rain')) out.push(['Loves the rain', 0.08]); else if (dislikes(v, 'rain')) out.push(['Hates the rain', -0.05]); }
    if (Game.weather === 'clear' && !v.inside && Game.hour > 9 && Game.hour < 18 && likes(v, 'sunshine')) out.push(['Basking in the sunshine', 0.04]);
    return out;
  };
  const fin = Villager.prototype.finish;
  Villager.prototype.finish = function () {
    const t = this.task;
    if (t && this.stage !== 'baby') {
      const id = t.a.id;
      const map = { party: id === 'party' ? 'crowds' : null, fiddle: 'music', garden: 'gardens', forage: 'mushrooms', read: 'poetry', read_item: 'poetry', pet_pet: 'animals', jack_in: 'rifttech', gadget: 'rifttech', stroll: 'quiet' };
      const k = map[id];
      if (k && likes(this, k)) feel(this, 'liked', LIKES[k]);
      else if (k && dislikes(this, k)) feel(this, 'disliked', LIKES[k]);
      if (id === 'party' && likes(this, 'music')) feel(this, 'liked', 'the fiddling');
    }
    return fin.call(this);
  };
}

// --- Rivals and contests ------------------------------------------------------------------
const CONTESTS = {
  farming: ['the biggest marrow', 'marrow'], cooking: ['the best pie', 'pie'], brewing: ['the finest ale', 'ale'], woodcraft: ['the finest carving', 'carving'],
  herbalism: ['the best remedy', 'remedy'], music: ['the best fiddling', 'tune'], fishing: ['the biggest fish', 'fish'], lore: ['the best tall tale', 'tale'], tinkering: ['the cleverest gadget', 'gadget'],
};
function rivalOf(v) { return v.rival != null ? Game.villagers.find((o) => o.id === v.rival) || null : null; }
function pickRivals() {
  for (const v of Game.villagers) {
    if (!v.isGrown() || v.rival != null || v.leaving || v.genes.temper < 0.5 || !R.chance(0.08)) continue;
    const skill = v.job ? JOBS[v.job].skill : topTalents(v.genes, 1)[0];
    const o = Game.villagers.filter((x) => x !== v && x.isGrown() && x.rival == null && !x.leaving && x.spouse !== v.id && !related(v, x) && (x.job ? JOBS[x.job].skill : '') === skill && (v.rel[x.id] ?? 0.1) < 0.5)
      .sort((a, b) => b.genes.temper - a.genes.temper)[0];
    if (!o) continue;
    v.rival = o.id; o.rival = v.id; v.rivalSkill = o.rivalSkill = skill; v.rivalScore = o.rivalScore = 0;
    devLog('story', `${v.first} and ${o.first} are friendly rivals at ${SKILL_LABEL[skill].toLowerCase()}`);
  }
}
function holdContests(occasion) {
  const done = new Set();
  const held = [];
  for (const v of Game.villagers) {
    const o = rivalOf(v);
    if (!o || done.has(v.id) || v.leaving || o.leaving) continue;
    done.add(v.id); done.add(o.id);
    const sk = v.rivalSkill || 'farming', [what] = CONTESTS[sk] || CONTESTS.farming;
    const sv = (v.skills[sk] || 0) + R.f(0, 30), so = (o.skills[sk] || 0) + R.f(0, 30);
    const [w, l] = sv >= so ? [v, o] : [o, v];
    w.rivalScore = (w.rivalScore || 0) + 1;
    feel(w, 'won', what); addSentiment(l, w, 'prickly', `winning ${what}`, 5); addSentiment(w, l, 'admiring', 'giving me a good run', 4);
    w.remember(`Won ${what} at the ${occasion}, beating ${l.first}!`, 2); l.remember(`${w.first} beat me for ${what} at the ${occasion}. Next year.`, -1);
    held.push(`${w.first} beat ${l.first} for ${what}`);
    // rivals who've become friends at heart shake hands
    if ((v.rel[o.id] ?? 0) > 0.55) {
      v.rival = o.rival = null;
      chronicle(`After all their contests, ${v.first} and ${o.first} shook hands at the ${occasion} and called it a draw. Friends, now, for good.`, 'love');
      addSentiment(v, o, 'kindred', 'all those contests'); addSentiment(o, v, 'kindred', 'all those contests');
    }
  }
  if (held.length) chronicle(`At the ${occasion}: ${held.slice(0, 3).join('; ')}${held.length > 3 ? `, and ${held.length - 3} more contests besides` : ''}.`, 'party');
}
MOODLETS.won = ['Won {x}!', 0.14, 1440, ['Did you see? I won {x}!']];
// rivals passing in the lane
{
  const ch = Villager.prototype.chatter;
  Villager.prototype.chatter = function () {
    const r = rivalOf(this);
    if (r && !r.inside && !this.inside && dist(r.x, r.y, this.x, this.y) < 70 && R.chance(0.5)) { this.say(R.pick([`Hmph. ${r.first}.`, `${r.first} thinks ${r.pron.they}'s so clever.`, `Just you wait, ${r.first}.`]), undefined, { think: true }); return; }
    return ch.call(this);
  };
}

// --- Inspirations and sulks ------------------------------------------------------------------
const INSPIRATIONS = {
  baking: { text: (v) => `${v.name()} is struck by a baking fit and has filled every tin in the village with seed-cake.`, fx: (v) => { Village.produce('cake', 6); Village.produce('pie', 4); } },
  creative: { text: (v) => `${v.name()} is inspired: ${v.pron.they}'s working on something wonderful and won't say what.`, fx: (v) => { v.inspired = Game.time + 1440; } },
  matchmaker: { text: (v) => `${v.name()} has decided it's high time some people got together, and is making introductions.`, fx: (v) => matchmake(v) },
  wanderlust: { text: (v) => `${v.name()} woke with itchy feet and walked the whole valley before breakfast, and came back with something odd.`, fx: (v) => { if (v.homeId >= 0 && typeof newMathom === 'function') { const m = newMathom(v.home(), 'trip'); m.name = R.pick(['curious green stone', 'bird\'s nest with a blue egg in it', 'old horseshoe', 'bottle with a note in it']); } } },
};
const SULKS = {
  holeup: { text: (v) => `${v.first} has shut ${v.pron.them}self indoors with the curtains drawn and won't come out.`, line: 'Leave me be.' },
  comfort: { text: (v) => `${v.first} is comfort-eating ${v.pron.their} way through the larder.`, line: 'Just one more slice. Or six.' },
  huffy: { text: (v) => `${v.first} has gone for a long, huffy walk.`, line: 'Hmph!' },
};
MOODLETS.sulk_over = ['Feeling better', 0.06, 480, ['That\'s better. Sorry, all.']];
function matchmake(v) {
  const singles = Game.villagers.filter((o) => o.stage === 'adult' && !o.spouse && !o.sweetheart && !o.leaving);
  for (let i = 0; i < singles.length; i++) for (let j = i + 1; j < singles.length; j++) if (canCourt(singles[i], singles[j])) {
    const a = singles[i], b = singles[j];
    const l = clamp((a.love[b.id] || 0) + 0.25, 0, 1); a.love[b.id] = l; b.love[a.id] = l; a.bond(b, 0.1);
    chronicle(`Thanks to ${v.first}'s matchmaking, ${a.first} and ${b.first} have been seen walking out together.`, 'love');
    return;
  }
}
function moodSwingsHourly() {
  for (const v of Game.villagers) {
    if (!v.isGrown() || v.leaving) continue;
    const m = v.mood();
    v.highT = m > 0.84 ? (v.highT || 0) + 1 : 0;
    v.lowT = m < 0.28 ? (v.lowT || 0) + 1 : 0;
    if (v.sulk) {
      if (Game.time > v.sulk.until || m > 0.55) { feel(v, 'sulk_over'); v.sulk = null; }
      continue;
    }
    if (v.highT >= 6 && R.chance(0.06) && (Game.lastInspired || -9) < Game.day) {
      const k = R.pick(Object.keys(INSPIRATIONS));
      Game.lastInspired = Game.day;
      feel(v, 'inspired'); INSPIRATIONS[k].fx(v); chronicle(INSPIRATIONS[k].text(v), 'learn');
      if (!v.inside) FX.sparkle(v.x, v.y - 20, '#ffe680');
      // and, once in a lifetime, a fey mood: a masterpiece
      if (k === 'creative') maybeMasterpiece(v);
    }
    if (v.lowT >= 6 && R.chance(0.1)) {
      const k = R.pick(Object.keys(SULKS));
      v.sulk = { k, until: Game.time + 600 };
      chronicle(`${SULKS[k].text(v)} A visit from a friend might help.`, 'sick');
    }
  }
}
// a sulk shapes what they'll do; a friend's visit, a letter or a pat ends it
{
  const score = Villager.prototype.score;
  Villager.prototype.score = function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s <= 0 || !this.sulk) return s;
    const k = this.sulk.k;
    const mul = (n, f) => { s *= f; if (ex) ex.mul.push([n, f]); };
    if (k === 'holeup') mul('sulking indoors', HOME_ACTS.has(a.id) ? 2 : 0.15);
    if (k === 'comfort') mul('comfort-eating', a.id === 'eat_home' ? 3 : 1);
    if (k === 'huffy') mul('a huffy walk', a.id === 'stroll' ? 3 : 0.6);
    return s;
  };
  const f = feel;
  feel = function (v, key, x = '', mins) {
    f(v, key, x, mins);
    if (v && v.sulk && ['good_chat', 'got_letter', 'patted', 'present', 'flowers', 'supper'].includes(key)) {
      v.sulk = null; f(v, 'sulk_over');
      if (key !== 'patted') chronicle(`${v.first} has come out of ${v.pron.their} sulk, thanks to ${x || 'a little kindness'}.`, 'love');
    }
  };
}

// --- Masterpieces ------------------------------------------------------------------------------
const MASTER_THINGS = { carving: ['carved chest', 'walking staff', 'cradle'], pottery: ['great jug', 'tea service', 'lamp'], painting: ['portrait', 'painted screen', 'mural'], knitting: ['wedding shawl', 'patchwork quilt'], basketry: ['market hamper', 'cradle-basket'], woodcraft: ['carved door', 'rocking chair'], cooking: ['wedding cake recipe', 'great pie'], brewing: ['barrel of legendary ale'], tinkering: ['clockwork songbird', 'music box that plays itself'], music: ['song', 'set of reels'] };
const MASTER_NAMES = ['Bramblecup', 'the Willowmere', 'Old Faithful', 'the Starling', 'Midsummer\'s Gift', 'the Little Dawn', 'Hearthsong', 'the Long Evening', 'Thistlecrown', 'the Kettle-Moon'];
function maybeMasterpiece(v) {
  if (v.masterpiece) return;
  const hob = hobbyAge(v) ? hobbiesOf(v).filter((k) => MASTER_THINGS[k]) : [];
  const sk = v.job && MASTER_THINGS[JOBS[v.job].skill] && (v.skills[JOBS[v.job].skill] || 0) >= 45 ? JOBS[v.job].skill : null;
  const kind = hob.length && (v.hobbySkill || {})[hob[0]] > 25 ? hob[0] : sk;
  if (!kind) return;
  const mem = v.memories.filter((m) => m.v >= 2 && !/wish|pat/i.test(m.t)).sort((a, b) => b.v - a.v)[0];
  const thing = R.pick(MASTER_THINGS[kind]), name = R.pick(MASTER_NAMES.filter((n) => !(Game.masterpieces || []).some((m) => m.name === n))) || 'the Heart of Thistledown';
  const shows = mem ? mem.t.replace(/\.$/, '').replace(/^(Married|Welcomed|Got|Won|Moved|Came|Lived)/, (w) => w.toLowerCase()) : 'the valley in spring';
  const mp = { name, thing, by: v.id, byName: v.name(), shows, day: Game.day, home: v.homeId };
  v.masterpiece = name;
  (Game.masterpieces || (Game.masterpieces = [])).push(mp);
  (v.heirlooms || (v.heirlooms = [])).push({ name: `${name}, a ${thing}`, from: v.id, day: Game.day });
  Game.renown = (Game.renown || 0) + 15;
  chronicle(`A fey mood came over ${v.name()}, who shut ${v.pron.them}self in for a day and a night and came out with a masterpiece: ${name}, a ${thing} that shows ${shows}. Folk are coming from all over the village to see it. (+15 renown)`, 'learn');
  for (const o of Game.villagers) if (o !== v && o.stage !== 'baby' && R.chance(0.3)) addSentiment(o, v, 'admiring', `making ${name}`);
}

window.addEventListener('DOMContentLoaded', () => {
  const oh = onHour;
  onHour = function (h) {
    const r = oh(h);
    moodSwingsHourly();
    if (h === 6) pickRivals();
    // contests: at the autumn fair (the harvest festival), and on market days in summer
    if (h === 15 && ((World.season === 'autumn' && dayOfSeason(Game.day) === 2) || (World.season === 'summer' && isMarketDay(Game.day)))) holdContests(World.season === 'autumn' ? 'Harvest Fair' : 'market-day show');
    return r;
  };
  const nv = newVillage;
  newVillage = function () { Game.masterpieces = []; Game.lastInspired = -9; return nv(); };
});
