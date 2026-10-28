'use strict';
// ---------------------------------------------------------------------------
// Word of mouth. What folk say to each other changes what they feel, what
// they know and what they choose to do. Every natter can carry a message, and
// a message has intents: it can sway a choice ("You must try the pumpkin cake
// at the Tipsy Badger!" and off they go for supper), pass on a bit of
// knowledge (the inn's dish of the day), lift or sink a mood (a friend's
// "chin up", a grump's moaning), or teach: a tip or a trick that makes the
// listener a little better at a craft, and now and then sparks a wish to try
// a hobby themselves. Try it, like it, and they'll take it up. How much a
// message moves someone depends on how much they trust the speaker, how
// open-minded they are, and whether it suits their own tastes. Try what a
// friend recommended and like it, and you'll be the one recommending it next.
//
// Deeper than a tip: a master of a trade or a hobby can take on an
// apprentice, who comes along while the master works and learns at several
// times the pace, until the day they finish their apprenticeship.
// ---------------------------------------------------------------------------

MOODLETS.cheered = ['{x} cheered me up', 0.08, 300, ['{x} always knows what to say.', 'I feel better for that talk with {x}.']];
MOODLETS.grumbled_at = ['{x} was in a grump', -0.03, 120, ['{x} was in a right mood today.']];
MOODLETS.good_tip = ['Tried what {x} recommended', 0.08, 360, ['{x} was right, you know.', 'I must thank {x} for that tip.']];
MOODLETS.bad_tip = ['{x}\'s advice was a let-down', -0.04, 240, ['I don\'t know what {x} was on about.']];
MOODLETS.special = ['Had the {x} at the inn', 0.07, 300, ['That {x}... I can still taste it.']];
MOODLETS.learned_trick = ['Learned a new trick: {x}', 0.05, 300, ['I\'ll be trying that trick for {x} again.']];
MOODLETS.taught = ['Passed on what I know', 0.04, 240, ['It\'s nice to be asked.']];
MOODLETS.apprenticed = ['Taken on as an apprentice', 0.12, 1440, ['An apprentice! Me!', 'I mean to learn everything {x} knows.']];
MOODLETS.graduated = ['Finished my apprenticeship!', 0.18, 2880, ['I learned from the best, I did.']];
MOODLETS.new_hobby = ['Taken up {x}', 0.12, 1440, ['Who\'d have thought I\'d take to {x}!']];

// --- what the listener says back -------------------------------------------
Object.assign(LINES, {
  tip_thanks: {
    plain: ['Huh. I\'ll try that.', 'Well, there\'s a thing. Thanks.', 'Never knew that.'],
    common: ['That\'s a clever trick! Thank you.', 'I\'ll remember that, I will.', 'Well I never. I\'ll give that a go.'],
    fine: ['How very useful. I\'m obliged to you.', 'A capital tip. Thank you.'],
    child: ['Ooh! Can I try?', 'Wow, really?', 'I didn\'t know that!'],
    bright: ['That\'s clever! I\'ll remember it.', 'Oh! So that\'s how it\'s done.'],
  },
  tip_curious: {
    plain: ['Might give that a go myself.', 'Sounds like something I could take to.'],
    common: ['I might have a go at that myself, you know.', 'Ooh, would you show me sometime?'],
    fine: ['I\'ve half a mind to take it up myself.', 'You make it sound most rewarding.'],
    child: ['Can you teach me?', 'I want to try!'],
    bright: ['Could I try it too? Please?'],
  },
  keen: {
    plain: ['Might just do that.', 'Oh aye? Might go and see.'],
    common: ['Ooh, now you\'ve got me thinking.', 'Is it? I\'ll have to try that!', 'You\'ve talked me into it.'],
    fine: ['How tempting. I may well.', 'Then I shall have to see for myself.'],
    child: ['Ooh! Can we go?', 'Yes! Let\'s!'],
    bright: ['Really? Then I\'m going!'],
  },
  unkeen: {
    plain: ['Not for me, thanks.', 'Hm. Each to their own.'],
    common: ['Not really my sort of thing, but thanks.', 'Hm, I\'m not sure that\'s for me.'],
    fine: ['Each to their own, I suppose.', 'I fear it wouldn\'t suit me.'],
    child: ['Eww.', 'Nah.', 'Boring!'],
  },
  heeded: {
    plain: ['Right. I\'ll steer clear.', 'Good to know.'],
    common: ['Oh dear. Thanks for the warning.', 'I\'ll give that a miss, then.'],
    fine: ['A timely warning. Thank you.'],
    child: ['Okay!', 'Yuck!'],
  },
  cheered: {
    plain: ['Thanks. That helps.', 'You\'re a good sort.'],
    common: ['You always know what to say.', 'Thank you. I needed that.', 'I do feel a bit better.'],
    fine: ['You\'re very kind. I do feel better.', 'Thank you. That means a great deal.'],
    child: ['Okay... *sniff* thanks.', 'Will you play with me?'],
  },
  sympathy: {
    plain: ['Rotten luck.', 'Ah, it\'ll pass.'],
    common: ['Oh dear. Tomorrow\'ll be better.', 'Chin up, eh?', 'Come on, it can\'t be as bad as all that.'],
    fine: ['How tiresome for you.', 'I\'m sorry to hear it.'],
    child: ['Aww.', 'Do you want a hug?'],
  },
  admire: {
    plain: ['Not bad at all.', 'Good on you.'],
    common: ['Well done, you!', 'I\'d love to see it.', 'Aren\'t you clever.'],
    fine: ['Splendid. I\'d very much like to see it.', 'How accomplished you\'re becoming.'],
    child: ['Can I see? Can I see?', 'Wow!'],
  },
  special_ooh: {
    plain: ['Oh aye? I\'ll have some of that.', 'Now you\'re talking.'],
    common: ['Ooh! I\'d better get down there before it\'s gone.', 'Is it? My mouth\'s watering already.'],
    fine: ['How delightful. I may dine out tonight.'],
    child: ['Yum! Can we go?', 'Cake? CAKE?'],
  },
  accept: {
    plain: ['Right you are. I\'ll be there.', 'I\'d like that.'],
    common: ['I\'d like that very much!', 'Really? When do we start?'],
    fine: ['I\'d be honored.', 'Nothing would please me more.'],
    child: ['Yes! Yes please!'],
    bright: ['Truly? I\'d love to!'],
  },
  decline: {
    plain: ['Not just now, thanks.', 'Maybe another time.'],
    common: ['That\'s kind, but I\'ve my hands full just now.', 'Maybe one day.'],
    fine: ['Most kind, but I must decline for now.'],
    child: ['Um... maybe later?'],
  },
});

// --- trust and open-mindedness -----------------------------------------------
// How much a listener takes in from a speaker: friends are believed, rivals not.
function trustIn(l, s) { return clamp(0.45 + (l.rel[s.id] ?? 0.1) * 0.9, 0.15, 1.3); }
function openness(l) { return 0.55 + l.genes.curiosity * 0.35 + l.genes.sociability * 0.15 + (l.isChild() ? 0.15 : 0); }
const innName = () => (World.inn && World.inn.name) || 'the inn';

// --- notions: a pull toward (or away from) something, from what was heard ---
function heardOf(v) { return (v.heard = (v.heard || []).filter((n) => n.until > Game.time)); }
function addNotion(l, s, a, w, why, opts = {}) {
  const list = heardOf(l);
  const until = Game.time + (opts.mins || R.f(480, 1200));
  const dish = opts.dish || null;
  const old = list.find((n) => n.a === a && (n.dish || null) === dish);
  if (old) { old.w = w > 1 ? Math.max(old.w, w) : Math.min(old.w, w); old.until = Math.max(old.until, until); old.from = s.first; old.fromId = s.id; old.why = why; return old; }
  const n = { a, w, until, from: s.first, fromId: s.id, why, dish };
  list.push(n);
  if (list.length > 4) { list.sort((x, y) => Math.abs(y.w - 1) - Math.abs(x.w - 1)); list.length = 4; }
  return n;
}
// how strongly a recommendation pulls: trust, openness and how well it suits them
function swayWeight(l, s, strength, fit = 1) { return clamp(1 + strength * trustIn(l, s) * openness(l) * fit, 1, 2.4); }

// --- raves: good (and bad) experiences, kept to pass on ----------------------
const EVERYDAY = { tea: 0.2, stroll: 0.4, ale: 0.5, garden: 0.7 };
const RAVE_ACTS = new Set(['fish', 'garden', 'forage', 'stroll', 'read', 'tea', 'market', 'ale', 'play', 'eat_inn']);
function ravesOf(v) { return (v.raves = (v.raves || []).filter((r) => Game.time - r.t < 1440)); }
function addRave(v, r) {
  const list = ravesOf(v).filter((x) => !(x.a === r.a && x.food === r.food));
  list.unshift({ ...r, t: Game.time });
  if (list.length > 3) list.length = 3;
  v.raves = list;
}
const HOBBY_DOING = { carving: 'carving', basketry: 'weaving baskets', pottery: 'at the potter\'s wheel', knitting: 'knitting', painting: 'painting down by the river', collecting: 'combing the riverbank for finds', birdwatching: 'out with my bird book' };
function raveLine(s, r) {
  const food = r.food ? (r.dish || FOODS[r.food].label) : '';
  if (r.a === 'eat_inn' && !r.good) return R.pick([`I'd steer clear of the ${food} at ${innName()}, if I were you, {name}.`, `Don't bother with the ${food} at ${innName()}. Dreadful.`]);
  if (r.a === 'eat_inn') return R.pick([`You must try the ${food} at ${innName()}, {name}. It's wonderful!`, `I had the ${food} at ${innName()} today. Best I've had in an age.`, `If you're peckish, {name}, the ${food} at ${innName()} is a treat.`]);
  if (r.a.startsWith('hobby_')) { const k = r.a.slice(6); return R.pick([`I've been ${HOBBY_DOING[k]} all morning. You'd love it, {name}.`, `There's nothing like ${HOBBY_DOING[k].replace(/^at the /, 'an hour at the ')} to settle the mind.`]); }
  const L = {
    fish: ['The fish are biting down by the river today, {name}!', 'Caught a beauty this morning. You should get down to the river.'],
    garden: ['There\'s nothing like an hour in the garden to set you right, {name}.', 'My beans are coming up a treat. You should get your hands in the soil.'],
    forage: ['The mushrooms are up in the woods! Baskets of them.', 'I found a whole ring of mushrooms by the old stump. Go and look!'],
    stroll: ['I had the loveliest walk by the river. You should go before the weather turns.', 'Get out for a stroll, {name}. The valley\'s looking its best.'],
    read: ['I\'ve just finished the most marvelous book. You must read it, {name}.', 'I couldn\'t put my book down last night. Dragons and riddles!'],
    tea: ['A pot of tea at four, {name}. Best part of the day.', 'Nothing like a cup of tea to set the world right.'],
    market: ['The market\'s full of good things today, {name}.', 'They\'ve the best cheeses on the market stalls today.'],
    ale: [`The ale's good and cold at ${innName()} tonight, {name}.`, `Come down to ${innName()} later. Good ale, good company.`],
    play: ['Come and play by the oak! We\'re playing hide-and-seek!', 'We made a den by the hedge! Come and see!'],
  }[r.a];
  return L ? R.pick(L) : null;
}

// --- the inn's dish of the day -------------------------------------------------
const SPECIALS = {
  pie: { spring: ['rhubarb pie', 'gooseberry pie'], summer: ['strawberry pie', 'gooseberry pie'], autumn: ['pumpkin pie', 'blackberry and apple pie'], winter: ['mince pie', 'mushroom pie'] },
  cake: { spring: ['honey cake'], summer: ['strawberry cake'], autumn: ['pumpkin cake', 'pumpkin cake', 'seed-cake'], winter: ['plum cake', 'ginger cake'] },
  stew: { spring: ['spring lamb stew'], summer: ['garden stew'], autumn: ['rabbit stew', 'mushroom stew'], winter: ['mutton hotpot', 'barley broth'] },
  fish: { spring: ['fried trout'], summer: ['river perch in butter'], autumn: ['smoked trout'], winter: ['fish pie'] },
  veg: { spring: ['buttered new potatoes'], summer: ['tomato and herb soup'], autumn: ['roast pumpkin', 'pumpkin soup'], winter: ['root vegetable soup'] },
  bread: { spring: ['warm cottage loaf'], summer: ['cheese and pickle loaf'], autumn: ['apple and cheese loaf'], winter: ['hot buttered crumpets'] },
};
function innSpecial() { const s = Game.innSpecial; return s && s.day === Game.day ? s : null; }
function pickSpecial() {
  if (!World.inn) { Game.innSpecial = null; return; }
  const opts = Object.keys(SPECIALS).filter((k) => (Village.stores[k] || 0) >= 2).map((k) => [Math.sqrt(Village.stores[k]) * (0.3 + FOODS[k].joy * 3), k]);
  if (!opts.length) { Game.innSpecial = null; return; }
  const food = R.weighted(opts);
  const name = R.pick(SPECIALS[food][World.season] || SPECIALS[food].autumn);
  const knowers = Game.villagers.filter((v) => v.job === 'innkeeper' || (v.inside === World.inn && v.stage !== 'baby')).map((v) => v.id);
  Game.innSpecial = { food, name, day: Game.day, knowers };
  devLog('talk', `Today at ${innName()}: ${name} (${knowers.length} know)`);
}
function knowsSpecial(v) { const s = innSpecial(); return !!s && s.knowers.includes(v.id); }

// --- tips and tricks -----------------------------------------------------------
const TIPS = {
  farming: ['Plant your beans when the oak leaves are the size of a mouse\'s ear, {name}. Never fails.', 'A bit of ash from the hearth round the cabbages keeps the slugs off.', 'Water at dusk, not at noon. The sun drinks it otherwise.'],
  cooking: ['Rest the dough under a damp cloth, {name}. It rises twice as well.', 'A pinch of salt in the apple pie. Trust me.', 'Never stir a stew once the dumplings are in.'],
  brewing: ['Keep the barrels out of the sun and the ale stays sweet.', 'Taste the wort before the yeast goes in. Your tongue knows.', 'A handful more hops for a winter ale, {name}.'],
  fishing: ['Fish the shady side of the willows in the afternoon, {name}.', 'A bit of cheese on the hook. The trout can\'t resist it.', 'Don\'t stamp on the bank. They hear you coming.'],
  woodcraft: ['Always split with the grain, {name}, never across.', 'Keep your axe sharp and it does half the work.', 'Ash for handles, oak for beams, willow for nothing much.'],
  herbalism: ['Pick feverfew in the morning, before the dew\'s off.', 'Yarrow for cuts, chamomile for nerves. Never mix them up.', 'If a toadstool smells of radish, leave it be, {name}.'],
  lore: ['Pause before the dragon comes in. Let them lean forward.', 'Always end a story on a song, {name}. They remember the song.', 'Start with the weather. Every good tale starts with the weather.'],
  music: ['Loosen your wrist on the bow, {name}. It\'s a dance, not a fight.', 'Tap your foot on the off-beat and the jig plays itself.'],
  tinkering: ['Ground the copper before you touch the coil. Learned that the hard way.', 'Sun-glass works better at an angle. Tilt it to the south, {name}.'],
  carving: ['Cut away from your thumb, {name}, always away.', 'Find the animal in the wood first. Then let it out.'],
  basketry: ['Soak the reeds overnight and they won\'t split on you.', 'Start the base tight, {name}. A loose base never comes right.'],
  pottery: ['Wet your hands, not the clay. The clay goes sloppy otherwise.', 'Center it slow, {name}. Rush the centering and the pot wobbles.'],
  knitting: ['Count your stitches at the end of every row. Saves tears later.', 'Knit loose for scarves and tight for socks, {name}.'],
  painting: ['Paint the sky first and work down, {name}.', 'Squint at the hills. You see the shapes better.'],
  collecting: ['The best stones turn up after a flood, down by the bend.', 'Check under the conker tree after a windy night, {name}.'],
  birdwatching: ['Sit still by the hedge at dawn and they forget you\'re there.', 'The wren\'s the loud one, {name}. Tiny bird, big song.'],
};
// a craft is a trade skill ('skill:farming') or a hobby ('hobby:pottery')
function craftParts(c) { const i = c.indexOf(':'); return [c.slice(0, i), c.slice(i + 1)]; }
function craftLabel(c) { const [t, k] = craftParts(c); return t === 'skill' ? SKILL_LABEL[k].toLowerCase() : HOBBIES[k].label.toLowerCase(); }
function craftLevel(v, c) { const [t, k] = craftParts(c); return t === 'skill' ? v.skills[k] || 0 : (v.hobbySkill && v.hobbySkill[k]) || 0; }
function raiseCraft(v, c, amt) {
  const [t, k] = craftParts(c);
  if (t === 'skill') { v.practice(k, amt); return; }
  v.hobbySkill = v.hobbySkill || {};
  const cur = v.hobbySkill[k] || 0;
  v.hobbySkill[k] = Math.min(100, cur + amt * 0.04 * (0.5 + HOBBIES[k].w(v, v.genes) * 0.5) * (1 - cur / 110));
}
// a leisure action that exercises a trade skill, to be tempted toward
const SKILL_PASTIME = { fishing: 'fish', farming: 'garden', herbalism: 'forage', lore: 'read', cooking: 'bake_home' };
// The crafts a speaker knows well enough to pass on.
function craftsOf(v) {
  const out = [];
  if (v.job && JOBS[v.job]) out.push('skill:' + JOBS[v.job].skill);
  for (const s of SKILLS) if ((v.skills[s] || 0) >= 45 && !out.includes('skill:' + s)) out.push('skill:' + s);
  if (hobbyAge(v)) for (const k of hobbiesOf(v)) out.push('hobby:' + k);
  return out;
}
function canTakeUp(v, k) { return hobbyAge(v) && !hobbiesOf(v).includes(k) && hobbiesOf(v).length < 3 && !(v.isChild() && !KID_HOBBIES.includes(k)) && !(v.curious && v.curious.until > Game.time); }
function curiousAbout(v, k) { return !!(v.curious && v.curious.k === k && v.curious.until > Game.time); }

// --- masters and apprentices -----------------------------------------------------
function masterOf(v) { return v.master ? personById(v.master.id) : null; }
function apprenticesOf(m) { return Game.villagers.filter((o) => o.master && o.master.id === m.id && !o.leaving); }
const MASTER_AT = { skill: 32, hobby: 25 }, GRADUATE_AT = { skill: 45, hobby: 40 };
// trades whose work can't be watched by day, or isn't the craft itself
const UNTAUGHT = new Set(['lamplighter', 'nanny', 'mailcarrier']);
function canMaster(m, c) {
  if (!m.isGrown() || m.leaving || m.newcomer || craftLevel(m, c) < MASTER_AT[craftParts(c)[0]]) return false;
  const [t, k] = craftParts(c);
  if (t === 'skill' ? !(m.job && JOBS[m.job] && JOBS[m.job].skill === k && !UNTAUGHT.has(m.job)) : !hasHobby(m, k)) return false;
  return apprenticesOf(m).length < (m.stage === 'elder' ? 2 : 1);
}
// What someone could be apprenticed in: youths and young grown-ups in a trade,
// anyone in a hobby they're still new to (or curious about).
function apprenticeCrafts(v) {
  if (v.master || v.leaving || v.stage === 'baby' || v.newcomer) return [];
  const out = [];
  const youth = kidBand(v) === 'youth' && v.years() >= 20;
  if (youth || (v.stage === 'adult' && v.years() < 50)) {
    let skills;
    if (youth) skills = [...new Set([...(v.apprenticedTo && JOBS[v.apprenticedTo] ? [JOBS[v.apprenticedTo].skill] : []), ...topTalents(v.genes, 2)])];
    else skills = v.job && JOBS[v.job] ? [JOBS[v.job].skill] : [];
    for (const s of skills) if ((v.skills[s] || 0) < 25 && (s !== 'tinkering' || v.tech >= 0.3) && !((v.trained || []).includes(s))) out.push('skill:' + s);
  }
  if (hobbyAge(v)) {
    for (const k of hobbiesOf(v)) if (craftLevel(v, 'hobby:' + k) < 18) out.push('hobby:' + k);
    if (v.curious && v.curious.until > Game.time) out.push('hobby:' + v.curious.k);
  }
  return out;
}
// Is the master at it right now, so an apprentice can come and watch?
function practicing(m, c) {
  const t = m.task;
  if (!t || t.phase !== 'do') return false;
  const [ty, k] = craftParts(c);
  return ty === 'skill' ? !!(t.a.job && JOBS[m.job] && JOBS[m.job].skill === k) : t.a.hobby === k;
}
function craftTitle(m, c) {
  const [t, k] = craftParts(c);
  if (t === 'skill') return m && m.job && JOBS[m.job] && JOBS[m.job].skill === k ? JOBS[m.job].label.toLowerCase() : SKILL_LABEL[k].toLowerCase();
  return HOBBIES[k].label.toLowerCase();
}
function acceptChance(v, m) { return clamp(0.45 + (v.rel[m.id] ?? 0.1) * 0.5 + v.genes.curiosity * 0.2 - v.genes.laziness * 0.3, 0.1, 0.95); }
function startApprenticeship(v, m, c) {
  v.master = { id: m.id, craft: c, since: Game.day, lessons: 0, last: Game.day, start: Math.round(craftLevel(v, c)) };
  v.bond(m, 0.06);
  feel(v, 'apprenticed', m.first);
  v.remember(`${m.first} took me on as an apprentice in ${craftLabel(c)}.`, 2);
  m.remember(`Took ${v.first} on as my apprentice.`, 1);
  const [t] = craftParts(c);
  chronicle(t === 'skill'
    ? `${m.name()} has taken ${v.isChild() ? 'young ' : ''}${v.first} on as an apprentice ${craftTitle(m, c)}.`
    : `${m.name()} is teaching ${v.first} ${craftLabel(c)}, and says ${v.pron.they} has a feel for it.`, 'learn');
}
function endApprenticeship(v, why) {
  const m = masterOf(v), c = v.master.craft;
  if (why === 'done' && m) {
    const [t, k] = craftParts(c);
    if (t === 'skill') (v.trained || (v.trained = [])).push(k);
    else if (canTakeUp(v, k) || curiousAbout(v, k)) adoptHobby(v, k, m.first, true);
    m.stats.taught = (m.stats.taught || 0) + 1;
    feel(v, 'graduated');
    addSentiment(v, m, 'grateful', `teaching me ${craftLabel(c)}`, 20);
    addSentiment(m, v, 'fond', 'being such a good apprentice', 12);
    v.remember(`Finished my apprenticeship in ${craftLabel(c)} with ${m.first}.`, 2);
    m.remember(`${v.first} finished ${v.pron.their} apprenticeship with me. Proud as anything.`, 2);
    chronicle(t === 'skill'
      ? `${v.name()} has finished ${v.pron.their} apprenticeship with ${m.first} and is a ${craftTitle(m, c)} in ${v.pron.their} own right.${m.stats.taught >= 3 ? ` That's ${m.stats.taught} apprentices ${m.first} has trained.` : ''}`
      : `${v.name()} has learned all ${m.first} can teach of ${craftLabel(c)}.`, 'learn');
  } else if (why === 'lapsed' && m) {
    v.remember(`Drifted away from my lessons with ${m.first}.`, 0);
  } else if (why === 'gone') {
    v.remember(`My lessons ended when my master went away.`, -1);
  }
  devLog('talk', `${v.first}'s apprenticeship in ${craftLabel(c)} ended (${why})`);
  v.master = null;
}
function checkApprenticeships() {
  for (const v of Game.villagers) {
    if (!v.master) continue;
    const m = masterOf(v), [t] = craftParts(v.master.craft);
    if (!m || m.leaving) endApprenticeship(v, 'gone');
    else if (craftLevel(v, v.master.craft) >= Math.min(GRADUATE_AT[t], craftLevel(m, v.master.craft) - 5)) endApprenticeship(v, 'done');
    else if (Game.day - v.master.last > 5) endApprenticeship(v, 'lapsed');
  }
}
// Now and then someone keen goes looking for a master of their own.
function seekMasters() {
  for (const v of Game.villagers) {
    if (!R.chance(0.12)) continue;
    const crafts = apprenticeCrafts(v);
    if (!crafts.length) continue;
    let best = null, bs = -1e9;
    for (const c of crafts) for (const m of Game.villagers) {
      if (m === v || !canMaster(m, c) || craftLevel(m, c) - craftLevel(v, c) < 15 || (v.rel[m.id] ?? 0.1) < -0.1 || m.rival === v.id) continue;
      const s = (v.rel[m.id] ?? 0.1) + craftLevel(m, c) / 100 + (m.homeId === v.homeId ? 0.2 : 0) + Math.random() * 0.3;
      if (s > bs) { bs = s; best = [m, c]; }
    }
    if (best && R.chance(acceptChance(v, best[0]))) startApprenticeship(v, best[0], best[1]);
  }
}

// Take up a hobby, after trying it out.
function adoptHobby(v, k, from, quiet = false) {
  hobbiesOf(v);
  if (!v.hobbies.includes(k)) v.hobbies.push(k);
  v.curious = null;
  feel(v, 'new_hobby', hobbyName(v, k).toLowerCase());
  v.remember(`Took up ${hobbyName(v, k).toLowerCase()}${from ? `, thanks to ${from}` : ''}.`, 2);
  if (!quiet) chronicle(`${v.name()} has taken up ${hobbyName(v, k).toLowerCase()}${from ? `, after ${from} showed ${v.pron.them} the knack` : ''}.`, 'learn');
}

// ---------------------------------------------------------------------------
// Composing a message: what the speaker has to say to this listener, and the
// intents it carries.
// ---------------------------------------------------------------------------
function composeMessage(s, l) {
  const opts = [];
  const grown = s.isGrown(), fill = (t) => t.replace(/\{name\}/g, l.first);
  const kidOk = (a) => !l.isChild() || !['ale'].includes(a);
  // a rave (or a warning) about something they did
  for (const r of ravesOf(s)) {
    if (!kidOk(r.a) || !l.canDo(ACTIONS[r.a]) || heardOf(l).some((n) => n.a === r.a && n.fromId === s.id)) continue;
    if (r.a.startsWith('hobby_') && hasHobby(l, r.a.slice(6))) continue;
    opts.push([1.6, () => {
      const text = raveLine(s, r);
      if (!text) return null;
      return { tag: r.good ? 'rave' : 'warn', text: fill(text), intents: [{ k: r.good ? 'sway' : 'warn', a: r.a, food: r.food, dish: r.dish }] };
    }]);
    break;
  }
  // the inn's dish of the day
  const sp = innSpecial();
  if (sp && knowsSpecial(s) && !knowsSpecial(l) && !(l.isChild() && kidBand(l) !== 'youth')) {
    opts.push([1.4, () => ({ tag: 'special', text: fill(R.pick([`Have you heard, {name}? ${innName()} has ${sp.name} on today!`, `Word is there's ${sp.name} at ${innName()} today. Get there quick!`, `${innName()}'s doing ${sp.name} today, {name}. Thought you'd want to know.`])), intents: [{ k: 'know', what: 'special' }, { k: 'sway', a: 'eat_inn', food: sp.food, dish: sp.name, special: true }], reply: 'special_ooh' })]);
  }
  // a tip from someone who knows their craft
  if (grown || kidBand(s) === 'youth') {
    const cs = craftsOf(s).filter((c) => craftLevel(s, c) >= 25 && craftLevel(s, c) - craftLevel(l, c) >= 15 && TIPS[craftParts(c)[1]]);
    const tc = cs.filter((c) => { const [t, k] = craftParts(c); return t === 'skill' ? (l.job && JOBS[l.job] && JOBS[l.job].skill === k) || l.genes.apt[k] > 0.6 : hasHobby(l, k) || (canTakeUp(l, k) && !(l.tipDay && l.tipDay[c] === Game.day)); });
    const pool = tc.length ? tc : cs;
    const c = pool.length ? R.pick(pool) : null;
    if (c && !(l.tipDay && l.tipDay[c] === Game.day)) opts.push([tc.includes(c) ? 1.5 : 0.5, () => ({ tag: 'tip', text: fill(R.pick(TIPS[craftParts(c)[1]])), intents: [{ k: 'tip', craft: c }] })]);
  }
  // an offer of an apprenticeship
  if (!l.master && (s.rel[l.id] ?? 0.1) >= 0.2 && !(s.cool.offer > Game.time)) {
    const c = apprenticeCrafts(l).find((x) => canMaster(s, x) && craftLevel(s, x) - craftLevel(l, x) >= 15);
    if (c) opts.push([2.2, () => {
      const [t] = craftParts(c);
      const text = t === 'skill' ? `You've a feel for ${craftLabel(c)}, {name}. Come along with me and I'll teach you properly.` : `Your ${craftLabel(c)}'s coming on, {name}. Come by mine and I'll show you a thing or two.`;
      return { tag: 'offer', text: fill(text), intents: [{ k: 'offer', craft: c }] };
    }]);
  }
  // cheering up a friend who's down
  const down = l.mood() < 0.45 || (l.moodlets || []).some((m) => MOODLETS[m.k] && MOODLETS[m.k][1] <= -0.1 && m.until > Game.time);
  if (down && s.mood() > 0.55 && (s.rel[l.id] ?? 0.1) > 0.15 && s.stage !== 'baby') {
    opts.push([2, () => ({ tag: 'cheer', text: fill(R.pick(s.isChild() ? ['Don\'t be sad, {name}! Want to play?', 'Here, {name}, you can have my conker.'] : register(s) === 'fine' ? ['Chin up, {name}. These things have a way of coming right.', 'You look a little low, {name}. Come and take tea with me.'] : ['Chin up, {name}. It\'ll all come right.', 'Cheer up, {name}! Come and have a cup of tea with me.', 'You look a bit down, {name}. We all have days like that.'])), intents: [{ k: 'mood', key: 'cheered', lonely: 0.15 }], reply: 'cheered' })]);
  }
  // a grump spreading the gloom
  if (s.mood() < 0.3 && grown) {
    opts.push([1, () => ({ tag: 'grumble', text: fill(R.pick(['Nothing\'s gone right today, {name}.', 'I\'m that fed up, I could spit.', 'Don\'t ask how my day\'s been.', 'Everything\'s at sixes and sevens, {name}.'])), intents: [{ k: 'mood', key: 'grumbled_at', soft: true }], reply: 'sympathy' })]);
  }
  // a little bragging about something made or learned
  const proud = (s.moodlets || []).find((m) => (m.k === 'skill_up' || m.k === 'made_piece') && m.until > Game.time);
  if (proud && s.stage !== 'baby') {
    opts.push([1.1, () => {
      const text = proud.k === 'skill_up' ? `I'm getting rather good at ${proud.x}, if I say so myself.` : `I've just finished a ${proud.x}, {name}. Best one yet!`;
      const k = proud.k === 'made_piece' && HOBBIES[s.lastMade] ? s.lastMade : null;
      return { tag: 'brag', text: fill(text), intents: k ? [{ k: 'spark', hobby: k }] : [], reply: 'admire' };
    }]);
  }
  // an invitation
  const asked = (a) => heardOf(l).some((n) => n.a === a) || s.cool.invite > Game.time;
  if (grown && Game.party.planned && !Game.party.on && l.canDo(ACTIONS.party) && !asked('party')) opts.push([1.2, () => ({ tag: 'invite', text: fill(R.pick(['Are you coming to the party, {name}? There\'ll be fireworks!', 'You will come to the party, {name}? It won\'t be the same without you.'])), intents: [{ k: 'sway', a: 'party', strength: 0.7 }], reply: 'keen' })]);
  if (grown && l.isGrown() && typeof isSingNight === 'function' && isSingNight(Game.day) && Game.hour >= 12 && Game.hour < 20 && !asked('ale')) opts.push([0.9, () => ({ tag: 'invite', text: fill(`It's sing-song night at ${innName()}. You coming, {name}?`), intents: [{ k: 'sway', a: 'ale', strength: 0.6 }], reply: 'keen' })]);
  if (!opts.length) return null;
  const pick = R.weighted(opts);
  return pick();
}

// Delivering it: each intent lands on the listener, and the reply follows.
function deliver(s, l, msg) {
  let reply = msg.reply || null;
  const notes = [];
  for (const it of msg.intents) {
    if (it.k === 'sway' || it.k === 'warn') {
      const a = it.a;
      let fit = 1;
      if (it.food) fit = clamp(((l.genes.food[it.food] || 1) * (l.foodLike[it.food] || 1)) - 0.2, 0.1, 1.4);
      if (a.startsWith('hobby_')) {
        const k = a.slice(6);
        if (canTakeUp(l, k)) { const r = spark(s, l, k, 0.8); notes.push(r ? `curious about ${k}` : `not taken with ${k}`); reply = r ? 'tip_curious' : 'unkeen'; continue; }
      }
      if (it.k === 'warn') {
        const w = clamp(1 - 0.35 * trustIn(l, s), 0.55, 0.95);
        addNotion(l, s, a, w, `${s.first} warned me off the ${it.food ? FOODS[it.food].label : ACTION_NAMES[a] || a}`, { food: it.food });
        notes.push(`warned off ${a} ×${w.toFixed(2)}`); reply = 'heeded';
        continue;
      }
      if (a === 'fish' || a === 'garden' || a === 'read' || a === 'forage') fit *= 0.6 + (l.weights[a] || 1) * 0.4;
      const w = swayWeight(l, s, it.strength || 0.9, fit);
      if (w < 1.15) { notes.push(`unmoved by ${a}`); reply = reply || 'unkeen'; continue; }
      const why = it.special ? `heard ${innName()} has ${it.dish} on` : it.food ? `${s.first} says the ${it.dish || FOODS[it.food].label} at ${innName()} is wonderful` : `${s.first} recommended it`;
      addNotion(l, s, a, w, why, { dish: it.food || null, mins: it.special ? Math.max(120, (24 - Game.hour) * 60) : undefined });
      notes.push(`sways ${a}${it.food ? ' (' + it.food + ')' : ''} ×${w.toFixed(2)}`);
      reply = reply || 'keen';
      if (msg.tag === 'invite') s.cool.invite = Game.time + 90;
    } else if (it.k === 'know') {
      const sp = innSpecial();
      if (sp && !sp.knowers.includes(l.id)) sp.knowers.push(l.id);
      notes.push('now knows the special');
    } else if (it.k === 'mood') {
      if (it.soft && l.genes.merriness > 0.55) { notes.push('shrugged off the gloom'); continue; }
      feel(l, it.key, s.first);
      if (it.lonely) l.drives.lonely = Math.max(0, l.drives.lonely - it.lonely);
      if (it.key === 'cheered') s.bond(l, 0.03);
      notes.push(it.key);
    } else if (it.k === 'tip') {
      const c = it.craft, [t, k] = craftParts(c);
      const gap = clamp((craftLevel(s, c) - craftLevel(l, c)) / 100, 0, 1);
      const take = trustIn(l, s) * openness(l);
      const before = craftLevel(l, c);
      raiseCraft(l, c, (40 + gap * 120) * take);
      (l.tipDay || (l.tipDay = {}))[c] = Game.day;
      l.stats.tips = (l.stats.tips || 0) + 1; s.stats.tipsGiven = (s.stats.tipsGiven || 0) + 1;
      feel(l, 'learned_trick', craftLabel(c)); feel(s, 'taught');
      s.bond(l, 0.02);
      if (R.chance(0.35)) l.remember(`${s.first} showed me a trick for ${craftLabel(c)}.`, 1);
      notes.push(`tip in ${craftLabel(c)} +${(craftLevel(l, c) - before).toFixed(1)}`);
      reply = 'tip_thanks';
      // a tip can spark an interest
      if (t === 'hobby' && canTakeUp(l, k) && spark(s, l, k, 0.6)) { reply = 'tip_curious'; notes.push(`curious about ${k}`); }
      else if (t === 'skill' && SKILL_PASTIME[k] && ACTIONS[SKILL_PASTIME[k]] && l.canDo(ACTIONS[SKILL_PASTIME[k]]) && R.chance(0.3 + l.genes.curiosity * 0.3)) {
        const w = swayWeight(l, s, 0.6, 0.6 + l.genes.apt[k] * 0.6);
        addNotion(l, s, SKILL_PASTIME[k], w, `${s.first} got me interested in ${craftLabel(c)}`);
        notes.push(`sways ${SKILL_PASTIME[k]} ×${w.toFixed(2)}`);
      }
    } else if (it.k === 'spark') {
      if (canTakeUp(l, it.hobby) && spark(s, l, it.hobby, 0.4)) { reply = 'tip_curious'; notes.push(`curious about ${it.hobby}`); }
    } else if (it.k === 'offer') {
      s.cool.offer = Game.time + 600;
      if (R.chance(acceptChance(l, s))) { startApprenticeship(l, s, it.craft); reply = 'accept'; notes.push(`became ${s.first}'s apprentice`); }
      else { reply = 'decline'; notes.push('declined an apprenticeship'); }
    }
  }
  l.pendingReply = reply;
  if (Game.selected === s || Game.selected === l) devLog('talk', `${s.first} → ${l.first} [${msg.tag}]: ${notes.join('; ') || 'no effect'}`);
}
// The wish to try a hobby for oneself.
function spark(s, l, k, base) {
  const p = clamp(base * openness(l) * trustIn(l, s) * (0.4 + Math.min(1.2, HOBBIES[k].w(l, l.genes)) * 0.6), 0, 0.9);
  if (!R.chance(p)) return false;
  l.curious = { k, from: s.first, fromId: s.id, tries: 0, joy: 0, until: Game.time + 1440 * 3 };
  return true;
}

// Folk sharing a room talk too: round the supper table, and above all in the
// taproom of an evening. What's said there lands just the same.
function roomTalk(h) {
  const rooms = new Map();
  for (const v of Game.villagers) {
    if (!v.inside || v.stage === 'baby' || v.leaving || register(v) === 'toddler' || (v.task && ['sleep', 'lodge'].includes(v.task.a.id))) continue;
    if (!rooms.has(v.inside)) rooms.set(v.inside, []);
    rooms.get(v.inside).push(v);
  }
  for (const [b, folk] of rooms) {
    if (folk.length < 2) continue;
    const atInn = b === World.inn, home = b.kind === 'home';
    const p = atInn ? (h >= 17 ? 0.75 : 0.4) : home ? (isDinner(h) || isMealTime(h) ? 0.55 : 0.2) : 0.3;
    for (let i = 0; i < (atInn ? Math.min(4, folk.length - 1) : 1); i++) {
      if (!R.chance(p)) continue;
      const s = R.pick(folk), l = R.pick(folk.filter((o) => o !== s));
      const msg = composeMessage(s, l);
      if (!msg) continue;
      deliver(s, l, msg);
      l.pendingReply = null;
      s.say(msg.text, undefined, { to: l });
    }
  }
}

// ---------------------------------------------------------------------------
// Hooks into the brain, the conversations and the panels.
// ---------------------------------------------------------------------------
{
  // a natter may carry a message
  const cv = converse;
  converse = function (s, l, mode) {
    if (!mode && s.stage !== 'baby' && l.stage !== 'baby' && register(s) !== 'toddler' && R.chance(0.6)) {
      const msg = composeMessage(s, l);
      if (msg) { deliver(s, l, msg); return msg.text; }
    }
    return cv(s, l, mode);
  };

  // what they've heard leans their choices
  patch(Villager.prototype, 'score', (score) => function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s <= 0) return s;
    const mul = (name, f) => { s *= f; if (ex) ex.mul.push([name, f]); };
    if (this.heard && this.heard.length) for (const n of this.heard) if (n.a === a.id && n.until > Game.time) mul(n.w >= 1 ? `${n.from} said so` : `${n.from} warned them off`, n.w);
    if (a.hobby && curiousAbout(this, a.hobby) && !hobbiesOf(this).includes(a.hobby)) mul('keen to try it', 2.2);
    if (a.id === 'lesson') mul('apprenticed', 1.6);
    return s;
  }, 'talk');

  // which hobby their latest piece came from, for bragging about
  const mp = madePiece;
  madePiece = function (v, k, extra = '') { v.lastMade = k; return mp(v, k, extra); };

  // dabblers can try a hobby they don't have yet
  const hh = hasHobby;
  hasHobby = function (v, k) { return hh(v, k) || (hobbyAge(v) && curiousAbout(v, k)); };

  // at the inn, what you've heard about (or see on the board) is what you order
  const pf = pickFood;
  pickFood = function (v, counts, kinds) {
    if (counts === Village.stores) {
      const n = (v.heard || []).find((x) => x.a === 'eat_inn' && x.dish && x.w > 1 && x.until > Game.time && counts[x.dish] > 0 && kinds.includes(x.dish));
      if (n && R.chance(0.85)) return n.dish;
      const sp = innSpecial();
      if (sp && v.inside === World.inn && counts[sp.food] > 0 && kinds.includes(sp.food) && R.chance(0.4)) return sp.food;
    }
    return pf(v, counts, kinds);
  };

  // what they did, how it went, and what they'll say about it
  patch(Villager.prototype, 'finish', (fin) => function () {
    const t = this.task;
    if (t && this.stage !== 'baby') {
      const id = t.a.id;
      let r = 0;
      for (const d of DRIVES) r += Math.max(0, t.before[d] - this.drives[d]) * (d === 'industry' ? 0.6 : 1);
      const joy = r * (this.genes.taste[id] || 1) * (0.6 + (this.weights[id] || 1) * 0.4);
      // the dish of the day: seen on the board, and remembered
      const sp = innSpecial();
      if (id === 'eat_inn' && sp && !sp.knowers.includes(this.id)) sp.knowers.push(this.id);
      const food = t.data && t.data.food;
      const isSpecial = id === 'eat_inn' && sp && food === sp.food;
      if (isSpecial) feel(this, 'special', sp.name);
      const taste = food ? (this.genes.food[food] || 1) * (this.foodLike[food] || 1) : 1;
      // a recommendation put to the test
      // (a dish they were told about is only put to the test by eating that dish)
      const n = (this.heard || []).find((x) => x.a === id && x.w > 1 && x.until > Game.time && (!x.dish || x.dish === food));
      if (n) {
        const liked = food ? taste >= 1 : joy > 0.4;
        const src = personById(n.fromId);
        if (liked) { feel(this, 'good_tip', n.from); if (src) { this.bond(src, 0.03); addSentiment(this, src, 'grateful', 'a good recommendation', 3); } }
        else { feel(this, 'bad_tip', n.from); if (src) this.bond(src, -0.02); }
        if (R.chance(0.4)) this.remember(liked ? `Tried what ${n.from} recommended. ${n.from} was right!` : `Tried what ${n.from} recommended. Not for me.`, liked ? 1 : 0);
        this.heard = this.heard.filter((x) => x !== n);
      }
      // something to rave (or warn) about
      if (id === 'eat_inn' && food) {
        if (taste >= 1.15 || isSpecial) addRave(this, { a: id, food, dish: isSpecial ? sp.name : null, good: true });
        else if (taste < 0.8) addRave(this, { a: id, food, good: false });
      } else if ((RAVE_ACTS.has(id) || t.a.hobby) && joy > 0.5 && !(id === 'ale' && !this.isGrown()) && R.chance(EVERYDAY[id] || 1)) addRave(this, { a: id, good: true });
      // trying out a hobby
      if (t.a.hobby && curiousAbout(this, t.a.hobby) && !hobbiesOf(this).includes(t.a.hobby)) {
        const c = this.curious, k = t.a.hobby;
        c.tries++; c.joy += joy + Math.min(1.2, HOBBIES[k].w(this, this.genes)) * 0.35 + R.f(-0.15, 0.15);
        if (c.tries >= 2) {
          if (c.joy / c.tries > 0.5) adoptHobby(this, k, c.from);
          else { this.remember(`Tried ${HOBBIES[k].label.toLowerCase()}. Not for me.`, 0); if (!this.inside) this.say(`${HOBBIES[k].label}'s not really for me.`); this.curious = null; }
        }
      }
    }
    return fin.call(this);
  }, 'talk');

  // apprentices and the trades: a master's training counts when trades are handed out
  const jf = jobFit;
  jobFit = function (v, j) {
    let s = jf(v, j);
    const sk = JOBS[j] && JOBS[j].skill;
    if (v.master && v.master.craft === 'skill:' + sk) s += 15;
    if ((v.trained || []).includes(sk)) s += 10;
    return s;
  };
}

// The lesson itself: along with the master while they work.
ACTIONS.lesson = {
  label: 'At a lesson', icon: 'book', sat: { bored: -0.55, industry: -0.45, lonely: -0.25 }, dur: 40, pose: 'stand', stages: AWAKE,
  label2: (v) => { const m = masterOf(v); return m && v.master ? `Learning ${craftLabel(v.master.craft)} from ${m.first}` : 'At a lesson'; },
  avail: (v) => { const m = masterOf(v); return !!m && !m.leaving && practicing(m, v.master.craft) && !needsMinder(v); },
  extra: (v) => 0.22 + v.genes.curiosity * 0.12 + (1 - v.genes.laziness) * 0.12,
  time: (h) => (h >= 7 && h < 20 ? 1 : 0.05),
  trait: (v) => 0.8 + clamp(v.rel[v.master ? v.master.id : -1] ?? 0.1, -0.5, 1) * 0.4,
  target: (v) => {
    const m = masterOf(v);
    if (!m) return null;
    if (m.inside) return { building: m.inside, mentor: m };
    const t = randomNearby(v, 1.5, m.x, m.y);
    if (t) { t.mentor = m; t.faceTo = m; }
    return t;
  },
  tick: (v, task, dt) => {
    const m = masterOf(v);
    if (!m || !v.master || !practicing(m, v.master.craft)) { task.t = Math.min(task.t, 1); return; }
    // learning at the master's elbow is far quicker than on one's own
    raiseCraft(v, v.master.craft, dt * 3.2 * (0.6 + craftLevel(m, v.master.craft) / 100));
    v.bond(m, dt * 0.0008);
    m.drives.lonely = Math.max(0, m.drives.lonely - dt * 0.002);
    task.data.talkT = (task.data.talkT ?? R.f(2, 6)) - dt;
    if (task.data.talkT <= 0) {
      task.data.talkT = R.f(8, 14);
      const tip = TIPS[craftParts(v.master.craft)[1]];
      if (R.chance(0.55) && tip) m.say(R.pick(tip).replace(/\{name\}/g, v.first), undefined, { to: v });
      else v.say(R.pick(v.isChild() ? ['Like this?', 'Can I have a go?', 'Oops!', 'I did it!'] : ['Like this?', 'Oh! I see now.', 'Hmm, tricky...', 'Let me try that again.']), undefined, { to: m });
    }
  },
  done: (v, task) => {
    if (!v.master) return;
    v.master.lessons++; v.master.last = Game.day;
    const m = masterOf(v);
    if (m) feel(m, 'taught');
  },
};
ACTIONS.lesson.id = 'lesson';
ACTION_NAMES.lesson = 'Lessons with a master';

// --- panels -----------------------------------------------------------------------
function wordOfMouthHtml(v) {
  const out = [];
  for (const n of heardOf(v)) out.push(`${escapeHtml(n.why.charAt(0).toUpperCase() + n.why.slice(1))} <span class="sub">(${n.w >= 1 ? 'keen to ' + (n.a === 'eat_inn' ? 'go' : 'try it') : 'put off'})</span>`);
  if (v.curious && v.curious.until > Game.time) out.push(`Trying out ${HOBBIES[v.curious.k].label.toLowerCase()}, after ${escapeHtml(v.curious.from)} got ${v.pron.them} interested <span class="sub">(${v.curious.tries} of 2 goes)</span>`);
  const sp = innSpecial();
  if (sp && knowsSpecial(v) && !heardOf(v).some((n) => n.dish === sp.food)) out.push(`Knows ${innName()} has ${sp.name} on today`);
  const tips = v.stats.tips || 0, given = v.stats.tipsGiven || 0;
  if (tips || given) out.push(`Has picked up ${tips} tip${tips === 1 ? '' : 's'} from others and passed on ${given}`);
  if (!out.length) return '';
  return `<h3>Word of mouth</h3><ul class="edu-fx">${out.map((t) => `<li>${t}</li>`).join('')}</ul>`;
}
function apprenticeHtml(v) {
  let h = '';
  const m = masterOf(v);
  if (m && v.master) {
    const c = v.master.craft, [t] = craftParts(c), lvl = craftLevel(v, c);
    h += `<h3>Apprenticeship</h3><div class="sub">Apprentice to <b>${escapeHtml(m.name())}</b>${t === 'skill' ? ` (${craftTitle(m, c)})` : ''} in ${craftLabel(c)}, since day ${v.master.since}: ${v.master.lessons} lesson${v.master.lessons === 1 ? '' : 's'} so far.</div>`;
    const goal = Math.max(v.master.start + 1, Math.min(GRADUATE_AT[t], craftLevel(m, c) - 5));
    h += `<div class="drive"><span class="dl">Toward finishing</span>${bar(clamp((lvl - v.master.start) / (goal - v.master.start), 0, 1), 'good')}</div>`;
  }
  const aps = apprenticesOf(v);
  if (aps.length) h += `<h3>Teaching</h3><ul class="edu-fx">${aps.map((a) => `<li>${escapeHtml(a.name())}: ${craftLabel(a.master.craft)}, ${a.master.lessons} lesson${a.master.lessons === 1 ? '' : 's'}</li>`).join('')}</ul>`;
  if (v.stats.taught) h += `<div class="sub">Has trained ${v.stats.taught} apprentice${v.stats.taught === 1 ? '' : 's'}.</div>`;
  if ((v.trained || []).length) h += `<div class="sub">Learned ${v.trained.map((s) => SKILL_LABEL[s].toLowerCase()).join(' and ')} as an apprentice.</div>`;
  return h;
}

window.addEventListener('DOMContentLoaded', () => {
  addHook('onHour', (h) => {
    if (h >= 10 && !innSpecial()) pickSpecial(); // the day's dish goes up mid-morning, and stays up
    if (h === 7) { checkApprenticeships(); seekMasters(); }
    if (h >= 7 && h <= 23) roomTalk(h);
  });
  addHook('newVillage', () => { Game.innSpecial = null; });
  const pm = panelMind;
  panelMind = function (v) {
    const h = pm(v), w = wordOfMouthHtml(v);
    if (!w) return h;
    return h.includes('<h3>Education</h3>') ? h.replace('<h3>Education</h3>', w + '<h3>Education</h3>') : h + w;
  };
  const pw = panelWork;
  panelWork = function (v) {
    const h = pw(v), a = apprenticeHtml(v);
    return a ? h.replace('<h3>Skills</h3>', a + '<h3>Skills</h3>') : h;
  };
  const vc = villageCensus;
  villageCensus = function () {
    let h = vc();
    const sp = innSpecial(), pop = Game.villagers.filter((v) => v.stage !== 'baby').length;
    if (sp) h += `<h3>On at ${escapeHtml(innName())}</h3><div class="likes"><div>${escapeHtml(sp.name.charAt(0).toUpperCase() + sp.name.slice(1))} <span class="sub">(${sp.knowers.filter((id) => personById(id)).length} of ${pop} have heard)</span></div></div>`;
    const aps = Game.villagers.filter((v) => masterOf(v));
    if (aps.length) h += `<h3>Masters and apprentices</h3><div class="likes">${aps.map((a) => `<div><b>${escapeHtml(masterOf(a).name())}</b> is teaching ${escapeHtml(a.first)} ${craftLabel(a.master.craft)} <span class="sub">(${a.master.lessons} lessons)</span></div>`).join('')}</div>`;
    return h;
  };
});
