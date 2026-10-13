'use strict';
// ---------------------------------------------------------------------------
// The rifts, played as the wizard. When you are the wizard (Game.mode
// 'wizard') the story of the Lamplighter's Children is something you take
// part in by talking:
//
// - Strangers into neighbours. Ask one of the rift-folk about home and,
//   warmly asked, they tell you what they miss, who they lost and what they
//   did in the city. Each of them has a thread on the Rift-folk page with its
//   four beats (home, the one they lost, their knack, a true friend among the
//   hill-folk) ticked as you learn or cause them. You can walk them over to
//   meet someone (the miller whose wheel squeaks, for a grid-tech), and that
//   first natter starts warmer and is likelier to make a friend for life.
//   Once you know a lost one's name you keep it in mind, and a later rift is
//   likelier to bring them through.
// - The mystery by conversation. Each clue is something somebody knows or
//   notices, and you find it by asking the right person at the right time:
//   the kettle on a rift-born sleeve, an old song an elder half remembers
//   with one of the rift-folk humming nearby, a coin a child found at a rift
//   scar, a portrait in a parlour, a voice on a gadget at dusk, the rifts'
//   edges on a night when every lamp is lit, and at last, from the oldest
//   hobbit, the name in the ledger. The stages that wait on machines move on
//   friendships and time instead. Nothing stalls for long: a clue nobody has
//   asked about for four days turns up the old way. Once the ledger is found
//   the wizard remembers a tinker called Fernsby, and has a tale to tell.
// - The Long Dim, won by persuasion. When it comes there's no Steward to
//   decide: the Moot meets in two days and every grown-up votes. How each
//   leans comes from what they hold dear, their wariness, their rift-born
//   friends, the true friendships and reunions they've seen, and what they
//   heard last (a tale, a post on the Relay, a word from the wizard). You only
//   know their mind once you've asked. Go-betweens count twice. If the village
//   leans to Hearthlink, the dynamo and the turbine go up the day before as a
//   village work party, and the Moot plays out as a short scene.
//
// The Relay board is in relay.js. Everything here is the wizard's game: the
// Steward's game keeps the story as it was.
// ---------------------------------------------------------------------------

function rp() {
  const g = Game.riftPlay || (Game.riftPlay = {});
  for (const [k, d] of [['known', {}], ['intro', {}], ['introSaid', {}], ['names', []], ['ask', {}], ['sway', {}], ['heard', {}], ['argued', {}], ['vote', null], ['lastClue', null], ['said', {}]]) if (g[k] === undefined) g[k] = Array.isArray(d) ? [] : d && typeof d === 'object' ? {} : d;
  return g;
}
const riftWiz = () => typeof playMode === 'function' && playMode();
const riftOutcome = () => (Game.riftStory ? Game.riftStory.finale : null);
MOODLETS.introduced = ['The wizard introduced me to {x}', 0.06, 1440, ['Fancy the wizard taking the trouble to introduce us.']];

// --- What they'll tell you about home ---------------------------------------------------------
const HOME_ASKS = {
  warm: ['You must miss it. Tell me about home.', 'What do you miss most, from the city?'],
  curious: ['What did you do, back in the city?', 'What was your work, over there?'],
};
const SKILL_SAY = {
  courier: 'I ran parcels across the rooftops. Fastest feet in the eastern stack.',
  gridtech: 'I kept the grid up. Turbines, junctions, the whole hum of it. Your mill-wheel makes me homesick.',
  medic: 'Street medic. Patched folk up under the overpass, no questions asked.',
  cook: 'I had a noodle stall under the overpass. Best broth in Neverdark, ask anyone.',
  teacher: 'I taught the little ones their numbers. Binary first, then the rest.',
  grower: 'Rooftop gardens. Lettuces under lamps, forty storeys up.',
};
function knowArc(v, beat) { const k = rp().known[v.id] || (rp().known[v.id] = {}); if (!k[beat]) k[beat] = Game.day; }
function homeAsk(v, T, tone) {
  const text = R.pick(HOME_ASKS[tone]);
  T.wiz(text);
  const a = v.arc, k = rp().known[v.id] || {};
  const tm = temperOf(v), open = regardOf(v) + (tone === 'warm' ? 0.15 : 0) + (tm === 'shy' || tm === 'gloomy' ? -0.08 : 0) + (tm === 'curious' || tm === 'cheerful' ? 0.05 : 0);
  if (tone === 'curious') {
    T.reply(SKILL_SAY[a.skill] || 'I kept busy.');
    knowArc(v, 'skill'); addRegard(v, k.skill ? 0.01 : 0.04);
    return;
  }
  if (!k.home || open < 0.12) {
    T.reply(`${a.home.charAt(0).toUpperCase() + a.home.slice(1)}. I dream about ${a.home} most nights.`);
    knowArc(v, 'home'); addRegard(v, 0.05);
    if (open < 0.12) T.reply('...I don\'t talk about the rest. Not yet.');
    return;
  }
  // warm, and trusted: the one they lost
  if (a.lost.found) T.reply(`I lost my ${a.lost.rel}, ${a.lost.name}, in the crossing. And then the sky gave ${a.lost.sex === 'f' ? 'her' : 'him'} back. I still can't believe it.`);
  else {
    T.reply(`My ${a.lost.rel}. ${a.lost.name}. We were meant to come through together. I don't know if ${a.lost.sex === 'f' ? 'she' : 'he'} got out.`);
    if (!rp().names.includes(a.lost.name)) {
      rp().names.push(a.lost.name);
      T.wiz(`I'll keep ${a.lost.name} in mind. If ever the sky brings that name, you'll know.`);
    }
  }
  knowArc(v, 'lost'); addRegard(v, 0.07); v.lost = Math.max(0, (v.lost || 0) - 0.1);
}
// A name kept in mind makes a reunion likelier (riftstory.js arriveFromRift).
function reunionBoost() { return riftWiz() && wizardOf() && rp().names.length ? 0.3 : 0; }
function keptNames() { return riftWiz() ? rp().names : []; }

// --- Introductions ------------------------------------------------------------------------------
const INTRO_SAY = {
  courier: ['Need anything carried? I\'m quick. Very quick.', 'Quick, are you? I\'ve a letter for Bree that\'s been waiting a month.'],
  gridtech: ['Your wheel drags on the downstroke. Hear it? Thunk... thunk.', 'Forty years it\'s done that. You think you can fix it?'],
  medic: ['That cut on your hand wants cleaning. Let me look.', 'Oh, it\'s nothing. ...Is it? Go on, then.'],
  cook: ['Have you ever had broth with mushrooms in it? Real broth?', 'I\'ve had mushrooms with everything. Never in broth. Go on.'],
  teacher: ['I hear your little ones are quick with numbers.', 'Quick with mischief, more like. You teach, do you?'],
  grower: ['Your rows are good. Have you tried growing up instead of along?', 'Up? Lettuces don\'t climb, do they?'],
};
function introCandidates(v) {
  const job = ARC_SKILLS[v.arc.skill].job;
  return Game.villagers.filter((o) => o !== v && !o.isRiftborn() && o.isGrown() && !o.inside && !o.leaving && (v.rel[o.id] || 0) < 0.45 && !related(o, v))
    .map((o) => [o, (o.job === job ? 2 : 0) + riftWary(o) * 0.8 - dist(o.x, o.y, v.x, v.y) / 500 + (o.stage === 'elder' ? 0.2 : 0)])
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([o]) => o);
}
function introHint(v, o) {
  if (o.job && o.job === ARC_SKILLS[v.arc.skill].job) return `${o.first} the ${JOBS[o.job].label.toLowerCase()}: ${v.first} was ${ARC_SKILLS[v.arc.skill].label}`;
  if (riftWary(o) > 0.35) return `${o.first}, who crosses the lane to avoid the rift-folk`;
  return `${o.first}${o.job ? ` the ${JOBS[o.job].label.toLowerCase()}` : ''}`;
}
function introduce(v, o) {
  rp().intro[v.id] = o.id;
  for (const p of [v, o]) { p.abort(); p.queue = []; }
  // the hill-folk waits where they are to be introduced
  o.task = { a: ACTIONS.await_intro, phase: 'do', target: { x: o.x, y: o.y }, t: 90, data: { by: v.id }, before: { ...o.drives }, chatLock: true };
  o.pose = 'stand'; o.path = null;
  v.rel[o.id] = Math.max(v.rel[o.id] || 0, 0.25) + 0.12; o.rel[v.id] = Math.max(o.rel[v.id] || 0, 0.15) + 0.12;
  v.begin({ ...ACTIONS.chat, target: () => ({ other: o }) }, Game.hour); o.thinkDelay = 0;
  feel(v, 'introduced', o.first); feel(o, 'introduced', v.first);
  wizWalkTo(o.x + 10, o.y + 4, null);
}
ACTIONS.await_intro = {
  id: 'await_intro', label: 'Waiting to be introduced', icon: 'chat', sat: {}, dur: 90, pose: 'stand', queued: true, stages: AWAKE,
  target: (v) => ({ x: v.x, y: v.y }),
  tick: (o, task) => {
    const v = personById(task.data.by);
    if (!v || !(v.task && v.task.a.id === 'chat')) { task.t = Math.min(task.t, 0.01); return; }
    o.facing = facingOf(v.x - o.x, v.y - o.y);
    // free to talk the moment they arrive (a chat won't start with someone who's busy)
    if (dist(v.x, v.y, o.x, o.y) < 40) { o.task = null; o.thinkDelay = 8; o.pose = 'stand'; }
  },
};
ACTION_NAMES.await_intro = 'Introductions';
// introduced pairs need less to become true friends (riftstory.js arcsDaily)
function turnThreshold(v, o) { return rp().intro[v.id] === o.id ? 0.45 : 0.6; }
// the first words of an introduction, once they're face to face
function introTick() {
  const P = rp();
  for (const id in P.intro) {
    if (P.introSaid[id]) continue;
    const v = Game.villagers.find((x) => x.id === +id), o = v && Game.villagers.find((x) => x.id === P.intro[id]);
    if (!v || !o || !v.arc) { P.introSaid[id] = true; continue; }
    if (v.task && v.task.a.id === 'chat' && v.task.phase === 'do' && dist(v.x, v.y, o.x, o.y) < 30) {
      const [a, b] = INTRO_SAY[v.arc.skill] || ['Hello. The wizard said we should meet.', 'Did he now. Well, hello.'];
      v.say(a, 3.4, { to: o }); setTimeout(() => o.say(b, 3.4, { to: v }), 1600);
      P.introSaid[id] = true;
    }
  }
}

// --- The clues, found by asking --------------------------------------------------------------------
const CLUE_HINT = {
  sigil: 'Ask one of the rift-folk about the little kettle on their sleeve.',
  lullaby: 'Get an old hobbit talking about the songs of their youth, with one of the rift-folk near, or on a sing night.',
  coin: 'Ask the children whether they\'ve found anything by the rift scars.',
  saint: 'Ask a rift-born who\'s had supper in a hill-family\'s parlour what surprised them there.',
  relay: 'Sit with one of the rift-folk at dusk and ask what they\'re listening to.',
  gold: 'On a night when every lamp is lit, look at an open rift with somebody.',
  ledger: 'With four clues found, ask the oldest hobbit in the village about a tinker who went missing long ago.',
  voice: 'It will come when the Long Dim comes.',
};
const clueCount = () => story().frags.filter((k) => k !== 'ledger' && k !== 'voice').length;
const lampsAllLit = () => (World.lamps.length && World.lamps.filter((l) => l.lit).length >= World.lamps.length * 0.85) || (Game.party.on && Game.hour >= 21);
const oldestHobbit = () => Game.villagers.filter((o) => !o.isRiftborn() && o.isGrown() && !o.leaving).sort((a, b) => b.age - a.age)[0];
function talkClue(k, by, T, reply, wiz) {
  T.reply(reply);
  if (wiz) T.wiz(wiz);
  Rift.talking = true;
  try { findFragment(k, by); } finally { Rift.talking = false; }
  rp().lastClue = Game.day;
  addRegard(by, 0.03);
}
const Rift = { talking: false };
const CLUE_ASKS = [
  { k: 'sigil', label: 'That little kettle on your sleeve…', when: (v) => v.isRiftborn(),
    run: (v, T) => { T.wiz('That little copper kettle on your sleeve. What does it mean?'); talkClue('sigil', v, T, '"It\'s the city\'s mark. It\'s always been the kettle. Nobody knows why, it just... is. It\'s on everything."', 'A kettle. How very homely, for a city of lights.'); } },
  { k: 'lullaby', label: 'Do you know any old songs?', when: (v) => !v.isRiftborn() && v.stage === 'elder' && story().stage >= 2,
    run: (v, T) => {
      T.wiz('Do you remember the songs your granny sang you?');
      const humming = Game.villagers.some((o) => o.isRiftborn() && !o.inside && dist(o.x, o.y, v.x, v.y) < 80);
      if (humming || (isSingNight(Game.day) && Game.hour >= 18)) talkClue('lullaby', v, T, '♪ Down by the willow lamp, where the river runs slow... ♪ Why, the rift-folk hum that one! How do they know our Willow Lamp?', 'How indeed. A hill song, on the far side of the sky.');
      else { T.reply('There was one about a lamp. Down by the... no, it\'s gone. It comes back when I hear it hummed.'); (rp().said.lullaby = Game.day); }
    } },
  { k: 'coin', label: 'Found anything by the rift scars?', when: (v) => v.isChild() && World.riftScars.length > 0,
    run: (v, T) => { T.wiz('Have you found anything interesting by the rift scars?'); talkClue('coin', v, T, 'I found a coin! It\'s got wires on one side and a DOOR on the other. A round one. Like ours!', 'May I see? ...Well. A round green door, on a coin from another world.'); } },
  { k: 'saint', label: 'What surprised you in our parlours?', when: (v) => v.isRiftborn() && story().stage >= 2 && (moodletsOf(v).some((m) => m.k === 'supper') || (v.homeId >= 0 && residentsOf(v.home()).some((o) => !o.isRiftborn())) || (story().suppers || 0) > 0),
    run: (v, T) => { T.wiz('You\'ve had supper in a hill-family\'s parlour. Did anything there surprise you?'); talkClue('saint', v, T, 'The portrait over the fire! That\'s Saint Mungo of the First Lamp. He\'s on our coins. What\'s he doing on your wall?', 'Saint Mungo. Mungo... now where have I heard that name?'); } },
  { k: 'relay', label: 'What are you listening to?', when: (v) => v.isRiftborn() && story().stage >= 3 && Game.hour >= 18 && Game.hour < 22.5,
    run: (v, T) => { T.wiz('What is it you\'re listening to, at this hour?'); talkClue('relay', v, T, 'Static, mostly. But at dusk there\'s a voice under it. Listen: "...lamp... lighter... is anyone... the kettle\'s gone cold..."', 'The kettle\'s gone cold. Hm.'); } },
  { k: 'gold', label: 'Look at the rift, tonight…', when: (v) => World.rifts.length > 0 && Game.hour >= 20 && lampsAllLit(),
    run: (v, T) => { T.wiz('Look at the rift tonight, with every lamp in the valley lit. Do you see its edges?'); talkClue('gold', v, T, 'They\'re gold! They\'re usually that angry pink. It\'s as if something on the other side steadies when we\'re all lit up.', 'Something on the other side is drawing on our light.'); } },
  { k: 'ledger', label: 'Did a tinker ever go missing, long ago?', when: (v) => v === oldestHobbit() && clueCount() >= 4,
    run: (v, T) => {
      T.wiz('Tell me: did a tinker ever go missing from Thistledown, long ago? In a storm, perhaps?');
      talkClue('ledger', v, T, 'My grandfather\'s grandfather used to say one walked into green lightning on the Long Meadow. It\'s in the old ledger in the mathom-chest. Fernsby, his name was. Mungo Fernsby.', 'Fernsby. I knew a Fernsby once, when I was young and the Shire was younger. He asked me about lightning. I wish I had listened harder.');
    } },
];

// --- The Long Dim: how each grown-up leans ---------------------------------------------------------
const VALUE_LEAN = { learning: 0.25, merriment: 0.12, craft: 0.08, tradition: -0.25, nature: -0.1, order: -0.08, kin: -0.04, thrift: -0.05 };
function riftLean(v) {
  const P = rp();
  let s = 0;
  if (v.isRiftborn()) s += v.homeId >= 0 ? 0.2 : 0.35;
  for (const k of valuesOf(v)) s += VALUE_LEAN[k] || 0;
  if (!v.isRiftborn()) s -= riftWary(v) * 0.6;
  if (hasRiftFriend(v)) s += 0.2;
  if (riftBorn().some((o) => o.arc && o.arc.turned === v.id)) s += 0.25;
  if (moodletsOf(v).some((m) => m.k === 'reunion')) s += 0.2;
  if (!v.isRiftborn() && v.homeId >= 0 && residentsOf(v.home()).some((o) => o.isRiftborn())) s += 0.15;
  s += P.sway[v.id] || 0;
  const h = P.heard[v.id]; if (h && Game.day - h.day <= 2) s += h.lean;
  return clamp(s, -1, 1);
}
const goBetween = (v) => (typeof isGoBetween === 'function' ? !!isGoBetween(v) : false);
const leanSide = (l) => (l > 0.08 ? 'hearthlink' : l < -0.08 ? 'softclose' : 'undecided');
function voters() { return Game.villagers.filter((v) => v.isGrown() && !v.leaving); }
function tally(onlyKnown) {
  const t = { hearthlink: 0, softclose: 0, undecided: 0, unknown: 0 };
  for (const v of voters()) {
    if (onlyKnown && !rp().ask[v.id]) { t.unknown++; continue; }
    t[leanSide(riftLean(v))] += goBetween(v) ? 2 : 1;
  }
  return t;
}
function voteOpen() { const S = story(); return riftWiz() && S.stage >= 6 && !S.finale; }
// what they say when asked, and why
function opinionLine(v) {
  const l = riftLean(v), side = leanSide(l), friend = riftBorn().find((o) => (v.rel[o.id] || 0) > 0.4 && o !== v);
  if (v.isRiftborn()) return side === 'hearthlink' ? 'If the doors stayed open I could go home and come back. Both. Do you know what that would mean?' : side === 'softclose' ? 'This is home now. Let the old city rest. I\'ve stopped looking back.' : 'Half of me is there and half is here. Ask me tomorrow.';
  if (side === 'hearthlink') return friend ? `${friend.first} is my friend. I'd want ${friend.pron.them} to see home again. Lend them our river, I say.` : 'Lend them our river? Why not. It\'s only water going by.';
  if (side === 'softclose') return riftWary(v) > 0.3 ? 'They make me uneasy, and that\'s the truth. Close the doors, gently, and let us be.' : 'It\'s kinder to close a door than to leave it banging. That\'s what I think.';
  return R.pick(['I don\'t rightly know. I keep changing my mind.', 'There\'s sense on both sides. I\'ll know when I\'m in the Moot.']);
}
const OPEN_TO = { curious: 1.3, dreamy: 1.3, cheerful: 1, witty: 0.9, shy: 0.85, gloomy: 0.8, proud: 0.6, ornery: 0.4 };
function argue(v, T, side) {
  const P = rp();
  const lines = side === 'hearthlink'
    ? ['They\'re children sent somewhere safe. We could keep their lamps lit with water that goes by anyway.', 'A door kept open is a lamp kept lit. Think of it that way.']
    : ['Perhaps it\'s kinder to close the door gently, and let them make their home here.', 'Some doors are best closed softly, before the wind slams them.'];
  T.wiz(R.pick(lines));
  if (P.argued[v.id] === Game.day) { T.reply('You\'ve said your piece today. I\'m thinking about it.'); return; }
  P.argued[v.id] = Game.day;
  const r = regardOf(v), open = OPEN_TO[temperOf(v)] || 1;
  let d = (side === 'hearthlink' ? 1 : -1) * 0.14 * open * (0.5 + Math.max(0, r));
  if (r < -0.1) d *= -0.5; // nobody likes being told by someone they can't abide
  P.sway[v.id] = clamp((P.sway[v.id] || 0) + d, -0.6, 0.6);
  T.reply(Math.abs(d) < 0.03 ? 'Hmph. We\'ll see.' : d * (side === 'hearthlink' ? 1 : -1) < 0 ? 'Don\'t lecture me, wizard.' : R.pick(['You may have something there.', 'I hadn\'t thought of it like that.', 'Hm. Let me sleep on that.']));
}
function askOpinion(v, T) {
  T.wiz(R.pick(['What do you make of the rifts, and the Long Dim?', 'When the Moot meets about the rifts, how will you vote?']));
  rp().ask[v.id] = Game.day;
  T.reply(opinionLine(v));
  T.choices([
    { label: '<span class="tone warm">for</span> Argue for keeping the doors open (Hearthlink)', run: () => argue(v, T, 'hearthlink') },
    { label: '<span class="tone curious">close</span> Argue for closing them softly', run: () => argue(v, T, 'softclose') },
    { label: 'Just listen', run: () => { T.wiz('Go on. I\'m listening.'); addRegard(v, 0.04); T.reply(riftWary(v) > 0.3 ? 'It\'s the not knowing. Lights in the sky, strangers at the door. I\'m too old for it.' : hasRiftFriend(v) ? 'It\'s my friends I think of. What would you do, if it were your home going dark?' : 'Nobody asks what we think, usually. Thank you for asking.'); } },
  ]);
}
// what they heard last: a tale (the tinker's most of all), a post on the Relay
function heard(v, lean) { if (voteOpen() || story().stage >= 6) rp().heard[v.id] = { lean, day: Game.day }; }

// The campaign: when the Long Dim comes, the Moot meets two days later at six.
function startVoteCampaign() {
  const S = story(), P = rp();
  if (S.finale || P.vote) return;
  P.vote = { day: Game.day + 2, work: false };
  chronicle('The Long Dim has come, and there\'s no Steward to decide it. The Moot will meet at the Tipsy Badger at six o\'clock in two days\' time, and every grown-up in Thistledown has a vote: lend the village\'s river and wind to the dark city (Hearthlink), or sing the rifts softly shut.', 'rift');
  toast('The Long Dim: the village votes in two days. Ask folk what they think.', 'info');
}
// the day before the Moot: if the village leans to Hearthlink, the machines go up as a village effort
function workParty() {
  const P = rp();
  if (!P.vote || P.vote.work) return;
  P.vote.work = true;
  const t = tally(false);
  if (t.hearthlink <= t.softclose) return;
  const names = voters().filter((v) => leanSide(riftLean(v)) === 'hearthlink').length;
  let built = [];
  for (const key of ['dynamo', 'turbine']) {
    const lot = World.lots.find((l) => l.key === key);
    if (!lot || lot.state === 'done') continue;
    if (lot.state === 'planned') openLot(lot, true);
    Village.projects = Village.projects.filter((p) => p.lot !== lot.i);
    finishLot(lot, true);
    built.push(lot.def && lot.def.name ? lot.def.name : key);
  }
  chronicle(`A petition went round the village with ${names} names on it, and this morning the whole of Thistledown turned out: hill-folk with spades and rift-folk with spanners${built.length ? `, and by sunset ${built.join(' and ')} stood finished by the river` : ', rigging the old mill to feed the Relay'}. There's a feast tonight to thank everyone.`, 'rift');
  if (Game.schedulePartyTonight && typeof PARTY_KINDS !== 'undefined' && PARTY_KINDS.feast) Game.schedulePartyTonight('feast');
}
// The Moot itself: a couple of speeches, then the vote.
function riftMoot() {
  const P = rp(), S = story();
  if (!P.vote || S.finale) return;
  const vs = voters(), byLean = vs.map((v) => [v, riftLean(v)]).sort((a, b) => a[1] - b[1]);
  const t = tally(false);
  const outcome = t.hearthlink > t.softclose && t.hearthlink >= t.undecided * 0.5 ? 'hearthlink' : t.softclose > t.hearthlink && t.softclose >= t.undecided * 0.5 ? 'softclose' : 'drift';
  const against = byLean.find(([v, l]) => l < -0.08 && v.stage === 'elder') || byLean.find(([, l]) => l < -0.08);
  const forIt = byLean.slice().reverse().find(([v, l]) => l > 0.08 && goBetween(v)) || byLean.slice().reverse().find(([v, l]) => l > 0.08 && v.isRiftborn()) || byLean.slice().reverse().find(([, l]) => l > 0.08);
  const speeches = [];
  if (against) speeches.push([against[0], R.pick(['We lend them our river. Then our wind. What do we lend them next year?', 'I\'ve nothing against the rift-folk. It\'s the sky I don\'t trust. Close it, gently, and let us be.'])]);
  if (forIt) speeches.push([forIt[0], forIt[0].isRiftborn() ? 'My city is going dark, one window at a time. You don\'t have to save it. Just keep a lamp in the window.' : R.pick(['They sat up all night with our poorly ones. We can lend them some water that\'s going by anyway.', 'A door kept open is a lamp kept lit. That\'s all I\'ll say.'])]);
  const word = { hearthlink: 'Hearthlink: the doors stay open, and Thistledown lends its river and wind', softclose: 'the rifts will be sung softly shut', drift: 'nothing at all: the Moot couldn\'t make up its mind, and the rifts drift' }[outcome];
  const html = `<p class="sub">The whole village is crammed into the Tipsy Badger.</p>${speeches.map(([v, s]) => `<p class="tk-line them"><b>${escapeHtml(v.first)}</b> ${escapeHtml(s)}</p>`).join('')}
    <div class="vote-bars">${[['hearthlink', 'Hearthlink'], ['softclose', 'Soft close'], ['undecided', 'Undecided']].map(([k, l]) => `<div class="vb ${k}"><span>${l}</span><i style="width:${Math.round((t[k] / Math.max(1, t.hearthlink + t.softclose + t.undecided)) * 100)}%"></i><b>${t[k]}</b></div>`).join('')}</div>
    <p>The Moot has chosen ${word}.</p>`;
  const done = () => { finale(outcome); P.vote.done = true; if (typeof onRiftOutcome === 'function') onRiftOutcome(outcome); };
  if (riftWiz() && wizardOf() && typeof Sheet !== 'undefined' && !Play.skipping) {
    const held = Game.speedIdx; setSpeed(0);
    Sheet.open({ kind: 'moot', title: 'The Long Dim Moot', sub: `${vs.length} grown-ups, and a go-between's word counts twice`, html, choices: [{ label: 'So be it', primary: true, run: () => { Sheet.close(true); setSpeed(held || 1); done(); } }], onClose: () => { setSpeed(held || 1); done(); } });
  } else done();
}

// --- The Rift-folk page: threads, casebook, who stands where ---------------------------------------
function threadHTML(v) {
  giveArc(v);
  const a = v.arc; if (!a) return '';
  const k = rp().known[v.id] || {};
  const friend = a.turned ? personById(a.turned) : null;
  const beat = (done, text, hint) => `<li class="${done ? 'done' : ''}"><span class="tick">${done ? '✓' : '◌'}</span>${done ? text : `<span class="sub">${hint}</span>`}</li>`;
  const cands = !a.turned ? introCandidates(v) : [];
  const next = !k.home ? 'Ask about home.' : !k.lost ? 'Ask again, warmly, once they trust you.' : !a.turned ? (cands.length ? `Introduce them to ${introHint(v, cands[0])}.` : 'Help them make a true friend among the hill-folk.') : a.lost.found ? 'Their story here is well begun.' : `Keep ${a.lost.name} in mind when the sky opens.`;
  return `<div class="thread"><div class="th-head"><a data-find="${v.id}">${escapeHtml(v.name())}</a><span class="sub">${k.skill ? ARC_SKILLS[a.skill].label : 'a stranger from the sky'}${v.homeId >= 0 ? ` · ${escapeHtml(v.home().name)}` : ' · sleeping rough'}</span></div>
    <ul>${beat(k.home, `Misses ${escapeHtml(a.home)}`, 'Home: ask them what they miss')}${beat(k.lost, a.lost.found ? `Found ${escapeHtml(a.lost.name)} again` : `Lost ${v.pron.their} ${a.lost.rel}, ${escapeHtml(a.lost.name)}`, 'The one they lost: ask warmly')}${beat(k.skill, `Was ${ARC_SKILLS[a.skill].label}`, 'Their knack: ask what they did')}${beat(!!friend, friend ? `A true friend in ${escapeHtml(friend.first)}` : '', 'A true friend among the hill-folk')}</ul>
    <p class="th-next">Next: ${escapeHtml(next)}</p></div>`;
}
function casebookHTML() {
  const S = story();
  return `<div class="casebook">${Object.keys(FRAGMENTS).map((k) => S.frags.includes(k) ? `<div class="clue found"><b>${escapeHtml(FRAGMENTS[k].title)}.</b> ${escapeHtml(FRAGMENTS[k].text)}</div>` : `<div class="clue"><b>◌</b> <span class="sub">${escapeHtml(CLUE_HINT[k])}</span></div>`).join('')}</div>`;
}
function opinionsHTML() {
  const t = tally(true), P = rp();
  const faces = voters().map((v) => { const known = !!P.ask[v.id], side = known ? leanSide(riftLean(v)) : 'unknown'; return `<a class="face ${side}${goBetween(v) ? ' gb' : ''}" data-find="${v.id}" title="${escapeHtml(v.first)}${known ? '' : ' (not asked)'}"><canvas data-face="${v.id}" width="30" height="40"></canvas><span>${escapeHtml(v.first)}</span></a>`; }).join('');
  return `<p class="sub">${P.vote ? `The Moot meets on day ${P.vote.day} at six.` : 'The Long Dim is coming.'} Of those you've asked: <b>${t.hearthlink}</b> for Hearthlink, <b>${t.softclose}</b> for closing the rifts, <b>${t.undecided}</b> undecided; ${t.unknown} not yet asked. Go-betweens count twice.</p><div class="faces">${faces}</div>`;
}
function hydrateFaces(root) {
  root.querySelectorAll('canvas[data-face]').forEach((c) => { const v = personById(+c.dataset.face); if (v) drawPortrait(c, v.genes, v.stage, !rp().ask[v.id], v.look ? v.look() : {}); });
}
function riftFolkSheet(tab = 'folk') {
  const S = story();
  const tabs = [['folk', 'The rift-folk'], ['clues', `Clues (${S.frags.length}/8)`]].concat(voteOpen() ? [['vote', 'The Long Dim']] : []);
  const body = tab === 'clues' ? casebookHTML() : tab === 'vote' ? opinionsHTML() : (riftBorn().filter((v) => !v.isChild() || v.arc).map(threadHTML).join('') || '<p class="sub">No rift-folk yet.</p>');
  Sheet.open({
    kind: 'rifts', title: 'The rift-folk', sub: `${RIFT_STAGES[S.stage].name}${S.finale ? ` · ${{ hearthlink: 'Hearthlink', softclose: 'the rifts are closed', drift: 'the rifts drift' }[S.finale]}` : ''}`,
    html: `<nav class="sh-tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</nav>${body}`,
    choices: [{ label: 'Close', back: true, run: () => Sheet.close(true) }],
  });
  const el = $('sheet-body');
  el.scrollTop = 0;
  el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => riftFolkSheet(b.dataset.tab)));
  el.querySelectorAll('[data-find]').forEach((a) => a.addEventListener('click', () => { const v = personById(+a.dataset.find); if (v) { Sheet.close(true); wizApproach(v); } }));
  hydrateFaces(el);
}

// --- The wizard's tale of the tinker, once the ledger is found ----------------------------------------
WIZARD_TALES.mungo = { x: 'of the tinker and the green lightning', locked: () => !(Game.riftStory && Game.riftStory.frags.includes('ledger')), lines: [
  'I will tell you a tale I have never told, because until this week I had forgotten it. It is about a tinker called Mungo Fernsby.',
  'He was a clever young hobbit, always mending kettles that weren\'t broken. He asked me once whether lightning could be caught in a jar.',
  'I laughed at him. I am sorry for that now. One summer evening a green storm came over the Long Meadow, and Mungo walked out into it with his copper kettle.',
  'The lightning took him, and he was never seen again. Not here.',
  'But I think he came out somewhere cold and dark. And I think he did what tinkers do: he mended it. He built a lamp, and a city grew around the lamp.',
  'And now the lamp is failing, and it remembers where Mungo came from: a place where the dark is soft. Here. This valley.',
  'So the folk who fall out of your sky are not strangers. They are Mungo\'s children\'s children, coming home. Be kind to them.',
] };

window.addEventListener('DOMContentLoaded', () => {
  registerField('riftPlay', null, { nullish: true });

  // talking with the rift-folk about home, and introductions
  addTalkOption({ id: 'home', order: 35, label: 'Tell me about home…', when: (v) => riftWiz() && v.isRiftborn() && (giveArc(v), !!v.arc),
    run: (v, T) => T.choices(['warm', 'curious'].map((tone) => ({ label: `<span class="tone ${tone}">${tone}</span> ${escapeHtml(HOME_ASKS[tone][0])}`, run: () => homeAsk(v, T, tone) }))) });
  addTalkOption({ id: 'intro', order: 47, label: 'Come and meet someone…', when: (v) => riftWiz() && v.isRiftborn() && v.isGrown() && v.arc && !v.arc.turned && !rp().intro[v.id] && introCandidates(v).length > 0,
    run: (v, T) => T.choices(introCandidates(v).map((o) => ({ label: escapeHtml(introHint(v, o)), run: () => { T.wiz(`Come with me, ${v.first}. There's someone you should meet.`); T.reply(R.pick(['Now? ...All right. Lead on.', 'If you say so. You usually know best.'])); endTalk(); introduce(v, o); } }))) });
  // the clues: what this person might know, right now
  addTalkOption({ id: 'clues', order: 45, label: 'About the rifts…', when: (v) => riftWiz() && CLUE_ASKS.some((c) => !story().frags.includes(c.k) && c.when(v)),
    run: (v, T) => T.choices(CLUE_ASKS.filter((c) => !story().frags.includes(c.k) && c.when(v)).map((c) => ({ label: escapeHtml(c.label), run: () => c.run(v, T) }))) });
  // the Long Dim: what they make of it
  addTalkOption({ id: 'longdim', order: 46, label: 'What do you make of the rifts?', when: (v) => voteOpen() && v.isGrown(), run: (v, T) => askOpinion(v, T) });

  addWizardAction({ id: 'riftfolk', order: 30, icon: 'rift', label: () => (rp().vote && !story().finale ? 'The Long Dim' : 'Rift-folk'), primary: () => !!rp().vote && !story().finale,
    when: () => riftWiz() && riftBorn().length > 0, run: () => riftFolkSheet(rp().vote ? 'vote' : 'folk') });

  // in the wizard's game, clues come from talk (or, after four quiet days, the old way)
  patch(window, 'findFragment', (ff) => function (k, by) {
    const S = story();
    if (!riftWiz() || Rift.talking || k === 'voice' || (k === 'ledger' && S.stage >= 6) || S.frags.includes(k)) return ff.apply(this, arguments);
    const since = rp().lastClue ?? S.stage2Day ?? Game.day;
    if (Game.day - since >= 4) { rp().lastClue = Game.day; return ff.apply(this, arguments); }
  }, 'riftplay');
  // the Long Dim is a vote, not a decree
  patch(window, 'longDimMoot', (ldm) => function () { if (riftWiz()) return startVoteCampaign(); return ldm.apply(this, arguments); }, 'riftplay');
  // a tale heard during the run-up stays with them; the tinker's tale most of all
  patch(window, 'feel', (fe) => function (v, key, x) {
    if (key === 'wizard_tale' && v && riftWiz() && story().stage >= 6 && !story().finale) heard(v, x === WIZARD_TALES.mungo.x ? 0.25 : 0.08);
    return fe.apply(this, arguments);
  }, 'riftplay');
  // the Rifts tab shows the threads and the casebook in the wizard's game
  patch(window, 'riftsHTML', (rh) => function () {
    if (!riftWiz()) return rh.apply(this, arguments);
    return `${rh.apply(this, arguments)}<h3>Threads</h3>${riftBorn().map(threadHTML).join('')}<h3>Casebook</h3>${casebookHTML()}${voteOpen() ? `<h3>The Long Dim</h3>${opinionsHTML()}` : ''}`;
  }, 'riftplay');

  addHook('onHour', (h) => {
    if (!riftWiz()) return;
    const S = story(), P = rp();
    if (S.stage >= 2 && S.stage2Day == null) S.stage2Day = Game.day;
    if (P.vote && !P.vote.done) {
      if (Game.day === P.vote.day - 1 && h === 9) workParty();
      if (Game.day >= P.vote.day && h === 18) riftMoot();
    }
  });
  patch(window, 'updateRabbits', (ur) => function () { const r = ur.apply(this, arguments); if (riftWiz()) introTick(); return r; }, 'riftplay');
  addHook('newVillage', () => { Game.riftPlay = null; });
});

// In the wizard's game the stages that wait on machines move on friendships and time
// (storyTick asks this first; null means "the usual rule").
function riftGate(next, S) {
  if (!riftWiz()) return null;
  const rb = riftBorn(), since = Game.day - (S.stageDay || 0);
  if (next === 4) return builtCivic('dynamo') || builtCivic('turbine') || (rb.filter((v) => hasRiftFriendOf(v)).length >= 2 && since >= 1) || since >= 4;
  if (next === 5) return builtCivic('relay') || (rb.some((v) => v.arc && v.arc.turned) && since >= 1) || since >= 4;
  if (next === 6) return S.frags.includes('ledger') || (clueCount() >= 4 && since >= 3);
  return null;
}
function hasRiftFriendOf(v) { return Game.villagers.some((o) => !o.isRiftborn() && (o.rel[v.id] || 0) > 0.45); }
