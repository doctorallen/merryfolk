'use strict';
// ---------------------------------------------------------------------------
// Getting together. Now and then three or more folk with nothing pressing
// find each other and do something as a group: a game of skittles on the
// green, skimming stones at the pond, a gossip round the well, watching the
// sun go down from the river bank, the children in a game of tag, or two who
// were nattering in the lane joined by a third who happened by. Each one has
// a spot, a shape (a ring, a row), a few lines called out as it goes on, and
// leaves everyone a little happier and a little closer. They're kept rare
// enough not to crowd out the day's work: one at a time, with a rest between.
// ---------------------------------------------------------------------------

MOODLETS.gathered = ['{x} with friends', 0.07, 420, ['Good company, that was.', 'We should do that more often.']];

const GATHER_COOL = 110; // game minutes between one gathering and the next
function gatheringsList() { return Game.gatherings || (Game.gatherings = []); }
function gatheringOf(v) { const id = v.task && v.task.a.id === 'gather' && v.task.data.g; return id ? gatheringsList().find((g) => g.id === id) : null; }
const TIED_JOBS = new Set(['innkeeper', 'lamplighter', 'nanny', 'herder', 'postie']);
const freeToGather = (v) => !v.inside && !v.leaving && !(v.job && TIED_JOBS.has(v.job) && Game.hour >= 7 && Game.hour < 21) && !v.carried && !v.heldBy && v.stage !== 'baby' && !needsMinder(v) && !v.sulk && !v.isSick() && v.mood() > 0.3 && v.drives.hunger < 0.7 && v.drives.tired < 0.7
  && !(v.task && (v.task.a.job || v.task.chatLock || ['sleep', 'deliver', 'work_lamps', 'scene', 'see_off', 'gather', 'gift', 'eat_inn', 'ale', 'party', 'school', 'cradle', 'tend_baby', 'nurse', 'build', 'drop_off', 'collect_child', 'fetch_child', 'lesson', 'wizard_tale'].includes(v.task.a.id)));
// a walkable spot near a point, in tiles
function groundNear(tx, ty) { const t = nearestWalkable(Math.round(tx), Math.round(ty)); return t ? { x: t[0] * 16 + 8, y: t[1] * 16 + 12 } : null; }
// a patch of open grass near a point: a tile with grass all round it
function greenNear(tx, ty, r = 8) {
  let best = null, bd = 1e9;
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const x = Math.round(tx) + i, y = Math.round(ty) + j;
    if (!inMap(x, y)) continue;
    let ok = true;
    for (let b = -1; b <= 1 && ok; b++) for (let a = -1; a <= 1; a++) { const t = tileAt(x + a, y + b); if ((t !== T.GRASS && t !== T.LAWN) || !walkable(x + a, y + b)) { ok = false; break; } }
    if (!ok) continue;
    const d = Math.hypot(i, j) + hash2(x, y) * 2;
    if (d < bd) { bd = d; best = { x: x * 16 + 8, y: y * 16 + 12 }; }
  }
  return best;
}
const sunsetNow = (h) => { const [, set] = DAYLIGHT[World.season] || DAYLIGHT.summer; return h >= set - 1.3 && h < set + 0.2; };

// What each kind is: when it happens, who comes, where, how they stand, and what gets said.
const GATHERINGS = {
  skittles: {
    label: 'A game of skittles on the green', where: 'skittles on the green', pose: 'stand', shape: 'ring', dur: [35, 55], min: 3, max: 5,
    when: (h) => h >= 10 && h < 19 && !Game.raining && World.season !== 'winter',
    who: (v) => !v.isChild() || ['school', 'youth'].includes(kidBand(v)),
    spot: () => greenNear(PLAZA.cx + R.pick([-9, 9]), PLAZA.cy + R.pick([-3, 6]), 10) || greenNear(PARTY.cx, PARTY.cy + 9, 8),
    calls: ['Stand back, {name}, this one\'s going a mile.', 'Nine down! Did everyone see that? Nine!', 'Gutter. Again. The green\'s uneven, I swear it.', 'Your go, {name}. Don\'t throw it at the hens this time.', 'That\'s three to me and none to you, {name}.', 'Best of five, then. Best of seven.', 'Who moved the pins? Somebody moved the pins.', 'I\'ll hold your pipe, {name}. You\'ll want both hands.'],
    reacts: { cheerful: ['Ha! Good throw!', 'Oh, hard luck. Go again.'], ornery: ['That never counted.', 'Mind the pins. They cost timber.'], shy: ['...Well done.', '*claps, quietly*'], curious: ['How do you get it to curve like that?', 'What are the pins made of? Ash?'], dreamy: ['I like the sound they make. Like rain on a roof.'], witty: ['Nine? I counted eight and a wobble.', 'The hens are placing bets.'], proud: ['Watch and learn, {name}.', 'That\'s how it\'s done.'], gloomy: ['My aim\'s gone. Everything\'s gone.'], child: ['My turn! My turn!', 'I got one! I got ONE!'] },
    kidCalls: ['Can I have a go? Please?', 'I knocked one over! Did you see?'],
  },
  skim: {
    label: 'Skimming stones at the pond', where: 'at the pond, skimming stones', pose: 'stand', shape: 'row', facing: 'up', dur: [25, 40], min: 3, max: 5,
    when: (h) => h >= 9 && h < 19 && !Game.raining && World.season !== 'winter',
    who: (v) => !v.isChild() || ['school', 'youth'].includes(kidBand(v)),
    spot: () => groundNear(POND.cx, POND.cy + POND.ry + 1.5),
    fx: (g) => { if (R.chance(0.6)) FX.splash(POND.cx * 16 + R.f(-30, 30), POND.cy * 16 + R.f(-10, 20)); },
    calls: ['Four! Count them, {name}, four!', 'Flat ones, {name}. You want the flat ones.', 'That one sank like a pudding.', 'Mind the ducks!', 'Six! Nobody beats six.', 'My gran could do nine. Nine, on a calm day.', 'It\'s all in the wrist. And the stone. And the luck.', 'Your turn, {name}. Low and fast.'],
    reacts: { cheerful: ['Oh, lovely skim!', 'Ha! The ducks are furious.'], ornery: ['Three. It was three.', 'You\'ll frighten the fish.'], shy: ['...Good one.', '*looks for a flat stone*'], curious: ['Why do the flat ones go further? It can\'t just be the shape.', 'Do you think the fish mind?'], dreamy: ['Look at the rings go out. All the way to the reeds.', 'I could do this till dark.'], witty: ['Nine? Your gran was a liar, {name}. A lovely liar.', 'That stone had a family.'], proud: ['I had seven last {season}. Seven.', 'Stand back and I\'ll show you.'], gloomy: ['Mine always sink.', 'Mm.'], child: ['I did two! Two!', 'Watch me! Watch meee!'] },
    kidCalls: ['Can I throw a big one?', 'The duck looked at me!'],
  },
  well: {
    label: 'A gossip by the well', where: 'by the well', pose: 'stand', shape: 'ring', dur: [25, 40], min: 3, max: 5,
    when: (h) => h >= 9 && h < 18 && !Game.raining,
    who: (v) => v.isGrown(),
    spot: () => (World.wellSpot ? groundNear(World.wellSpot.x / 16, World.wellSpot.y / 16 + 1) : null),
    news: true,
    calls: ['Well now. Who\'s heard what?', 'I\'m saying nothing. But I will say this.', 'Not a word of this outside this circle, mind.', 'And that\'s not the half of it.', 'I had it from the innkeeper, and she had it from the postie.', 'You didn\'t hear it from me.', 'Between these three walls, as they say. Or no walls.'],
    reacts: { cheerful: ['Well I never! How lovely.', 'Ha! That\'s the best thing I\'ve heard all week.'], ornery: ['Hm. None of our business.', 'Folk should mind their own.'], shy: ['Oh. ...Oh dear.', '*listens, says nothing, remembers everything*'], curious: ['And then? Who said that?', 'When was this? Before or after the market?'], dreamy: ['Fancy. The whole village in a bucket of water.', 'I wonder what they say about us.'], witty: ['My lips are sealed. My ears, less so.', 'I could sell tickets to this.'], proud: ['I knew that on Sterday.', 'I could tell you things that would curl your hair.'], gloomy: ['People talk. People always talk.', 'Mm.'] },
  },
  sunset: {
    label: 'Watching the sunset from the bank', where: 'on the river bank, watching the sun go down', pose: 'sit', shape: 'row', facing: 'up', dur: [25, 40], min: 3, max: 5,
    when: (h) => sunsetNow(h) && !Game.raining && World.season !== 'winter',
    who: (v) => !v.isChild() || ['school', 'youth'].includes(kidBand(v)),
    spot: () => { const f = R.pick(World.fishing.filter((s) => !s.occ)); return f ? groundNear(f.x / 16, f.y / 16 - 1) : null; },
    calls: ['Look at that. Just look at it.', 'Red sky at night, {name}. Fine tomorrow.', 'The river\'s gone to gold.', 'Shh. Don\'t say anything. ...Well, say something.', 'My father brought me here to watch it. Same bank.', 'There go the swallows.', 'First star. Make a wish, {name}.'],
    reacts: { cheerful: ['Isn\'t it grand? Every single day, and never the same twice.', 'I\'ve made my wish. It involves pie.'], ornery: ['It\'s the sun going down. It does it daily.', 'My backside\'s damp.'], shy: ['...It\'s beautiful.', '*hugs knees, watching*'], curious: ['Why does it go red, do you think? The dust?', 'Where does it go? Really go?'], dreamy: ['If I could paint, I\'d paint that and nothing else.', 'I think the hills are listening.'], witty: ['Red sky at night, the brewer\'s delight.', 'Shepherd\'s delight. Though I\'ve met our herder. Nothing delights him.'], proud: ['I told you this was the best bank.', 'I\'ve seen a hundred of these. This one\'s in the top ten.'], gloomy: ['Another day gone.', 'I wished. Doesn\'t ever come to much.'], child: ['The sun\'s gone in the river!', 'I wished for a dog!'] },
  },
  tag: {
    label: 'A game of tag', where: 'playing tag on the green', pose: 'dance', shape: 'ring', dur: [20, 35], min: 3, max: 6,
    when: (h) => isDay(h) && h >= 9 && h < 18.5 && !Game.raining,
    who: (v) => v.isChild() && ['school', 'youth', 'young'].includes(kidBand(v)) && !needsMinder(v),
    spot: () => greenNear(STORY.x + 3, STORY.y + 5, 8) || greenNear(PARTY.cx, PARTY.cy + 9, 10),
    calls: ['You\'re it, {name}!', 'Can\'t catch me! Can\'t catch me!', 'No tag-backs! That\'s the rule!', 'Base! I\'m on base! You can\'t get me on base!', 'Ha! Got you, {name}!', 'I wasn\'t ready! That doesn\'t count!', 'Last one to the oak is a rotten egg!', 'Time out! I\'ve got a stitch!'],
    reacts: { child: ['Hee hee! Missed me!', 'No fair! You\'re faster!', 'I\'m it! I\'m it! Run!', 'Not the oak, the oak\'s base!'], any: ['Ha!'] },
    kids: true,
  },
  natter: {
    label: 'A natter in the lane', where: 'in the lane', pose: 'stand', shape: 'ring', dur: [20, 35], min: 3, max: 4,
    when: () => true, who: (v) => v.stage !== 'baby' && register(v) !== 'toddler',
    join: true,
    calls: ['Room for one more? What\'s the news?', 'Go on, I\'ll not interrupt. ...Much.', 'I heard my name. I always hear my name.', 'Well, {name}, you\'ll never guess what I\'ve just seen.', 'Three of us! Now it\'s a proper natter.', 'We should go to {inn} and do this sitting down.', 'Don\'t let me stop you. What were you saying about the mill?'],
    reacts: { cheerful: ['The more the merrier! Come here.', 'Ha! We were just talking about you. Good things.'], ornery: ['We were having a private word.', 'Oh, it\'s you.'], shy: ['Oh! Hello.', '...We were just talking about the weather.'], curious: ['What have you seen? Tell us.', 'Where\'ve you come from, then?'], dreamy: ['Come and stand in the sun with us.', 'We were putting the world to rights.'], witty: ['Pull up a bit of lane.', 'We were plotting. Don\'t tell anyone.'], proud: ['We were. I was explaining the mill.', 'You\'ve missed the best bit.'], gloomy: ['Mm. Hello.', 'Not much news. Not much anything.'], child: ['Hi! Hi! Can I stay?', 'We were talking about dragons.'] },
  },
};

ACTIONS.gather = {
  id: 'gather', label: 'Getting together', icon: 'chat', sat: { lonely: -0.6, bored: -0.5 }, dur: 30, pose: 'stand', stages: AWAKE, queued: true,
  label2: (v) => { const g = gatheringOf(v); return g ? GATHERINGS[g.kind].label : 'Getting together'; },
  target: (v, h, extra) => extra && extra.spot ? extra.spot : { x: v.x, y: v.y },
  tick: (v, task, dt) => {
    const g = gatheringOf(v);
    if (!g || g.done) { task.t = Math.min(task.t, 0.5); return; }
    // the host keeps the thing going; if they've gone, somebody else does
    const all = g.members.map(personById).filter((o) => o && o.task && o.task.a.id === 'gather' && o.task.data.g === g.id);
    const folk = all.filter((o) => o.task.phase === 'do');
    if (!folk.some((o) => o.id === g.host)) g.host = folk.length ? folk[0].id : -1;
    if (g.host !== v.id) return;
    // the first to arrive wait for the rest; if the rest never come, it's off
    if (folk.length < 2) { if (all.length < 2 || Game.time - g.started > 40) endGathering(g); return; }
    if (all.length > folk.length && Game.time - g.started < 10 && folk.length < 3) return;
    if (Game.time < g.next) return;
    g.next = Game.time + R.f(2.5, 4.5);
    const K = GATHERINGS[g.kind];
    if (K.fx) K.fx(g);
    gatherLine(g, folk);
  },
  done: (v, task) => {
    const g = gatheringOf(v);
    if (!g) return;
    const K = GATHERINGS[g.kind];
    feel(v, 'gathered', K.where.charAt(0).toUpperCase() + K.where.slice(1));
    for (const id of g.members) { const o = personById(id); if (o && o !== v) v.bond(o, 0.02); }
    if (g.members.length && g.host === v.id) endGathering(g);
  },
};
ACTION_NAMES.gather = 'Getting together';

// A topic shared round the group: someone opens it, the others answer in
// their manner, and the opener follows it up.
function groupTopicLine(g, folk) {
  let gt = g.gt;
  if (!gt || gt.step >= 2 + gt.others.length) {
    const s = R.pick(folk), l = R.pick(folk.filter((o) => o !== s)) || s;
    const conv = { topics: g.topicsDone || (g.topicsDone = []) };
    const k = pickTopic(s, l, conv);
    if (!k) return null;
    g.topicsDone.push(k);
    gt = g.gt = { k, s: s.id, step: 0, others: folk.filter((o) => o !== s).map((o) => o.id) };
  }
  const T = TOPICS[gt.k], s = personById(gt.s);
  if (!s || !folk.includes(s)) { g.gt = null; return null; }
  let who, text, to;
  if (gt.step === 0) { who = s; to = personById(gt.others[0]); text = fillTalk(pickUnused(openerPool(T, s), g.used) || '', s, to, talkCtx(s, to)); }
  else if (gt.step <= gt.others.length) { who = personById(gt.others[gt.step - 1]); to = s; if (!who || !folk.includes(who)) { gt.step++; return groupTopicLine(g, folk); } text = fillTalk(pickUnused(replyPool(T.reply, who, g.temper[who.id] || 'cheerful'), g.used) || '', who, s, talkCtx(who, s)); }
  else { who = s; to = personById(gt.others[0]); text = T.memory ? '' : fillTalk(pickUnused(poolFor(T.more, s), g.used) || '', s, to, talkCtx(s, to)); }
  gt.step++;
  return text ? { who, to, text } : null;
}
// A line called out, or an answer to the last one, in the manner of whoever speaks.
function gatherLine(g, folk) {
  const K = GATHERINGS[g.kind];
  g.turn++;
  const last = g.last ? personById(g.last) : null;
  let who, text;
  // a natter is all talk; at a game or on the bank, talk runs alongside the calls
  if ((K.join && g.turn > 2) || (!K.kids && !K.news && g.turn > 3 && R.chance(0.3))) {
    const gl = groupTopicLine(g, folk);
    if (gl) { who = gl.who; text = gl.text; }
  }
  if (K.news && g.turn % 3 === 2) {
    // round the well, it's the news that goes round
    for (const s of folk) { const l = folk.find((o) => o !== s && typeof newsToTell === 'function' && newsToTell(s, o)); if (l) { const n = newsToTell(s, l); who = s; text = tellNews(s, l, n); for (const o of folk) if (o !== s && o !== l && !n.knowers.includes(o.id)) n.knowers.push(o.id); break; } }
  }
  if (!text && last && g.turn % 2 === 0 && folk.length > 1) {
    who = R.pick(folk.filter((o) => o !== last)) || folk[0];
    const pool = replyPool(K.reacts, who, g.temper[who.id] || 'cheerful') || K.reacts.any || K.reacts.cheerful;
    text = fillTalk(pickUnused(pool, g.used) || '', who, last);
  }
  if (!text) {
    const kids = folk.filter((o) => o.isChild());
    who = K.kidCalls && kids.length && R.chance(0.4) ? R.pick(kids) : R.pick(folk.filter((o) => !o.isChild() || K.kids)) || R.pick(folk);
    const pool = who.isChild() && K.kidCalls ? K.kidCalls : K.calls;
    text = fillTalk(pickUnused(pool, g.used) || '', who, R.pick(folk.filter((o) => o !== who)) || who);
  }
  if (!who || !text) return;
  who.say(text, undefined, { to: last && last !== who ? last : null });
  g.last = who.id;
  if (!g.thread) { g.thread = talkGroupThread(g.members.map(personById).filter(Boolean), K.where); g.thread.kind = g.kind; }
  logGroupLine(g.thread, who, text);
  if (g.kind === 'tag' && R.chance(0.5)) { const o = R.pick(folk); if (o) FX.chatPuff(o.x, o.y - 22); }
}
function endGathering(g) {
  if (g.done) return;
  g.done = true;
  for (const id of g.members) { const o = personById(id); if (o && o.task && o.task.a.id === 'gather' && o.task.data.g === g.id) o.task.t = Math.min(o.task.t, R.f(0.5, 3)); }
  Game.lastGather = Game.time;
  const i = gatheringsList().indexOf(g); if (i >= 0) gatheringsList().splice(i, 1);
}

// Where each of them stands: a ring round the spot, or a row along it.
function formation(K, spot, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let px, py, facing;
    if (K.shape === 'row') { px = spot.x + (i - (n - 1) / 2) * 15; py = spot.y; facing = K.facing || 'up'; }
    else { const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + 0.4; const r = 10 + n * 2; px = spot.x + Math.cos(a) * r * 1.3; py = spot.y + Math.sin(a) * r * 0.8; facing = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'left' : 'right') : (Math.sin(a) > 0 ? 'up' : 'down'); }
    const g = groundNear(px / 16, py / 16);
    out.push(g ? { x: g.x, y: g.y, facing } : { x: spot.x, y: spot.y, facing });
  }
  return out;
}
// Sends someone to join: their task is the gathering, at their place in it.
function sendTo(v, g, place, dur) {
  v.abort(); v.queue = [];
  const task = { a: ACTIONS.gather, phase: 'go', target: { x: place.x, y: place.y, facing: place.facing }, t: dur, data: { g: g.id }, before: { ...v.drives } };
  v.task = task;
  if (dist(v.x, v.y, place.x, place.y) < 6) { v.arrive(); return true; }
  if (!v.repathTo(place.x, place.y)) { v.task = null; return false; }
  return true;
}
function startGathering(kind, host, others, spot) {
  const K = GATHERINGS[kind];
  const g = { id: (Game.gatherSeq = (Game.gatherSeq || 0) + 1), kind, x: spot.x, y: spot.y, members: [], host: host.id, started: Game.time, next: Game.time + R.f(1, 3), turn: 0, used: new Set(), temper: {}, thread: null, last: null, done: false };
  const folk = [host, ...others], places = formation(K, spot, folk.length), dur = R.f(K.dur[0], K.dur[1]);
  folk.forEach((v, i) => { if (sendTo(v, g, places[i], dur * R.f(0.85, 1.1))) { g.members.push(v.id); g.temper[v.id] = temperOf(v); } });
  if (g.members.length < K.min) { for (const id of g.members) { const o = personById(id); if (o) o.abort(); } return null; }
  if (!g.members.includes(host.id)) g.host = g.members[0];
  gatheringsList().push(g);
  Game.lastGather = Game.time;
  devLog('talk', `${K.label}: ${g.members.map((id) => personById(id).first).join(', ')}`);
  return g;
}
// Now and then, someone with time on their hands gets a few friends together.
function tryGather(h) {
  if (!Game.started || gatheringsList().length || (Game.lastGather != null && Game.time - Game.lastGather < GATHER_COOL)) return;
  if (!R.chance(0.45)) return;
  const kinds = Object.keys(GATHERINGS).filter((k) => !GATHERINGS[k].join && GATHERINGS[k].when(h));
  if (!kinds.length) return;
  const kind = R.pick(kinds), K = GATHERINGS[kind];
  const free = Game.villagers.filter((v) => freeToGather(v) && K.who(v));
  if (free.length < K.min) return;
  const hosts = free.filter((v) => v.genes.sociability > 0.35);
  if (!hosts.length) return;
  const host = R.pick(hosts);
  const spot = K.spot();
  if (!spot || dist(host.x, host.y, spot.x, spot.y) > 40 * 16) return;
  const near = (v) => dist(v.x, v.y, spot.x, spot.y) / 16;
  const others = free.filter((v) => v !== host && near(v) < 38 && (v.rel[host.id] ?? 0.1) >= 0.05 && !(host.rel[v.id] < -0.1))
    .sort((a, b) => ((b.rel[host.id] ?? 0) - near(b) * 0.012 + Math.random() * 0.25) - ((a.rel[host.id] ?? 0) - near(a) * 0.012 + Math.random() * 0.25)).slice(0, K.max - 1);
  if (others.length < K.min - 1) return;
  startGathering(kind, host, others, spot);
}
// Two nattering in the lane, and a friend happening by: room for one more.
function tryJoin(a, b) {
  if (a.inside || b.inside || gatheringsList().length || (Game.lastGather != null && Game.time - Game.lastGather < GATHER_COOL * 0.6)) return false;
  const K = GATHERINGS.natter;
  const third = Game.villagers.find((v) => v !== a && v !== b && freeToGather(v) && K.who(v) && dist(v.x, v.y, a.x, a.y) < 56 && ((v.rel[a.id] ?? 0) >= 0.25 || (v.rel[b.id] ?? 0) >= 0.25) && !(a.rel[v.id] < -0.1 || b.rel[v.id] < -0.1));
  if (!third) return false;
  const spot = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const g = startGathering('natter', a, [b, third], spot);
  if (g) devLog('talk', `${third.first} joins ${a.first} and ${b.first} in the lane`);
  return !!g;
}

window.addEventListener('DOMContentLoaded', () => {
  const uw = updateWorld;
  updateWorld = function (dtMin, raining, season, hour) {
    const r = uw(dtMin, raining, season, hour);
    if (Game.started) { Game._gatherT = (Game._gatherT || 0) + dtMin; if (Game._gatherT >= 20) { Game._gatherT = 0; tryGather(hour); } }
    return r;
  };
  addHook('newVillage', () => { Game.gatherings = []; Game.lastGather = null; });
});
