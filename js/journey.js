'use strict';
// ---------------------------------------------------------------------------
// The wizard's journeys. Playing as the wizard, you don't stay in Thistledown
// for ever: take to the road, and choose where and for how long (over the
// hills for a day, east to the Mountain or west to the Sea for a season, the
// long road south for a year, and once the golden doors stand open, through
// to Neverdark). The children follow the wagon to the bridge, and then the
// village lives on without you, the real simulation run fast behind a
// journal page: the wagon on the road, the days ticking by, and letters
// catching you up as things happen, each in its writer's own hand (a small
// child's is a drawing, then misspelt, then fluent). When something big is
// coming (a child you know coming of age, a baby due, an elder near the
// end, a Moot) a letter asks you to come back, and you can turn the wagon
// round or stay on the road and miss it.
//
// While you're away your bonds fade a little, and small children who never
// heard one of your tales forget you. When you come back the children run to
// meet you, grown; a short page says what's happened since you were last
// here, most important first, with a way to go and see each; the first word
// with each friend is a reunion ("You missed the wedding, you old goat!"),
// and "What have I missed?" gets you their news. For a day, new folk and new
// homes carry a mark. Each journey brings something back: a new tale from
// where you've been, a present for someone, and from Neverdark letters and
// sometimes someone's lost family.
// ---------------------------------------------------------------------------

const JOURNEYS = {
  hills: { name: 'Over the hills', to: 'over the hills', days: 1, brings: 'a present for someone, picked up on the way', gift: 'a basket of wild strawberries', land: 'hills',
    road: ['The road winds up over the downs. Larks everywhere.', 'A night under the stars, wrapped in a blanket that smells of pipe-smoke.'] },
  mountain: { name: 'East to the Mountain', to: 'from the Mountain', days: 3, brings: 'a new tale of the dwarves, and a dwarf-made present', gift: 'a little silver bell, dwarf-made', land: 'mountain', tale: 'mountain',
    road: ['The Lonely Mountain on the skyline, blue and far off.', 'Supper with dwarves, who sang about gold until two in the morning.', 'A long climb, and a door in the rock that opened when I knocked politely.'] },
  sea: { name: 'West to the Sea', to: 'from the Sea', days: 3, brings: 'a tale of the Grey Havens, and a present from the shore', gift: 'a shell that hums like the sea', land: 'sea', tale: 'havens',
    road: ['Gulls! The air tastes of salt.', 'The white ships rocking at the quays, quite still, as if waiting.', 'An elf asked after the Shire. I said it was very well, thank you.'] },
  longroad: { name: 'The long road south', to: 'from the long road south', days: 12, brings: 'a tale of the wide world, and presents for two', gift: 'a carved wooden horse from the south', gift2: 'a scarf of southern silk', land: 'plains', tale: 'south',
    road: ['Fields of sunflowers taller than the wagon.', 'A market where nobody had heard of second breakfast. I pitied them.', 'Rain for three days. The horse is not speaking to me.', 'A river crossing with a ferryman who charged in riddles.', 'Oliphaunts, far off. Nobody at home will believe me.'] },
  neverdark: { name: 'Through the golden door to Neverdark', to: 'from Neverdark', days: 3, brings: 'letters and news for the rift-folk, and perhaps someone they lost', gift: 'a tiny lamp that never goes out', land: 'neverdark', tale: 'neverdark', rift: true,
    when: () => typeof story === 'function' && story().finale === 'hearthlink',
    road: ['Through the golden door: rain on neon, and a smell of noodles.', 'The Lamplighter hums in the dark. It knew my name.', 'The city has stars now. I counted eleven.'] },
};
const JOURNEY_TALES = {
  mountain: { x: 'of the dwarves under the Mountain', lines: [
    'I have just come from the Lonely Mountain, and I have news of the dwarves.', 'They are digging again, deeper than ever, and singing as they dig.', 'A dwarf will spend a hundred years on a single door, and it will open to a whisper.', 'They asked after you all. Well, they asked after the pies.', 'Never trust a dwarf\'s directions. Always trust a dwarf\'s doors.'] },
  havens: { x: 'of the Grey Havens', lines: [
    'I have stood on the quays of the Grey Havens, where the land runs out.', 'The ships there are white, and they make no sound at all when they sail.', 'An old elf there remembered this valley when it was all woods and badgers.', 'He said the Shire-folk were the only ones who never asked him for anything.', 'I told him that wasn\'t quite true. You do like presents.'] },
  south: { x: 'of the wide world to the south', lines: [
    'South, south and south again, until the grass grows taller than a hobbit.', 'There are markets there with a thousand stalls, and not one of them sells a decent scone.', 'I saw an oliphaunt. Bigger than the inn, with a tower on its back.', 'And a city of white stone, where nobody ever sits down to supper together.', 'I thought of you all, the whole way. It is a big world. This is the best corner of it.'] },
  neverdark: { x: 'of the city of Neverdark', lines: [
    'I have walked the streets of Neverdark, the city on the far side of the rifts.', 'It is all rain and neon, and towers that hum, and noodles on every corner.', 'At its heart the Lamplighter turns, very old and very tired, and very kind.', 'It asked after its children. I told it they had learned second breakfast.', 'It made a sound I can only call a laugh. The city\'s lights came up a little.'] },
};
MOODLETS.wizard_back = ['The wizard\'s back!', 0.08, 720, ['He\'s back! I knew he would be.']];
MOODLETS.wizard_present = ['The wizard brought me {x}', 0.15, 2880, ['He brought it all the way back, just for me.']];

const Journey = { cut: false, noRender: false, drawing: false, pendingCall: null };
const jStage = (v) => (v.stage === 'baby' ? 'baby' : v.isChild() ? kidBand(v) : v.stage);
function journeyOf() { return Game.journey || null; }
function journeyBack() { return Game.wizBack && Game.day <= Game.wizBack.day + 1 ? Game.wizBack : null; }

// The household he lodges with (fork A's hearth, if there is one), else the folk fondest of him.
function hearthIds() {
  const hh = Game.hearth;
  const hid = hh == null ? null : typeof hh === 'number' ? hh : (hh.homeId ?? hh.home ?? null);
  return hid == null ? [] : Game.villagers.filter((v) => v.homeId === hid).map((v) => v.id);
}
function closeToHim(v) { return hearthIds().includes(v.id) || regardOf(v) > 0.2; }
function weight(v) { return hearthIds().includes(v.id) ? 3 : 1 + Math.max(0, regardOf(v)) * 4 + ((Game.wizMet || {})[v.id] ? 0.5 : 0); }

// --- Setting off -------------------------------------------------------------------------
function roadSheet() {
  const w = wizardOf();
  if (!w) return;
  const keys = Object.keys(JOURNEYS).filter((k) => !JOURNEYS[k].when || JOURNEYS[k].when());
  Sheet.open({
    kind: 'pick road', title: 'Take to the road', sub: 'Where to? The village will carry on without you, and letters will find you on the way.',
    html: '<p class="j-hint">The longer you\'re gone, the more you\'ll find changed.</p>',
    choices: keys.map((k) => {
      const J = JOURNEYS[k], grow = growingUp(J.days);
      return { label: `<b>${J.name}</b> <small>${J.days === 1 ? 'about a day' : J.days === 3 ? 'a season, three days' : 'a year, twelve days'}</small><br><small>Brings back ${J.brings}.${grow ? ` ${grow}` : ''}</small>`, run: () => { Sheet.close(true); farewell(k); } };
    }).concat([{ label: 'Not yet', back: true, run: () => Sheet.close(true) }]),
  });
}
// a word on who'll be grown up by the time he's back
function growingUp(days) {
  const kids = Game.villagers.filter((v) => v.isChild() && (Game.wizMet || {})[v.id] && v.age + days >= CHILD_DAYS && v.age < CHILD_DAYS);
  if (kids.length) return `${kids.slice(0, 2).map((v) => v.first).join(' and ')} will have come of age by then.`;
  const babies = Game.villagers.filter((v) => v.stage === 'baby' && v.age + days >= BABY_DAYS);
  return days >= 3 && babies.length ? `${babies[0].first} will be toddling about.` : '';
}
function farewell(key) {
  const w = wizardOf();
  if (!w) return;
  const J = JOURNEYS[key];
  // back mid-morning on the day he's due
  const back = (Math.floor(Game.time / 1440) + J.days) * 1440 + 10 * 60;
  const snap = {};
  for (const v of Game.villagers) snap[v.id] = { s: jStage(v), age: v.age, first: v.first, sp: v.spouse || null, job: v.job || null, edu: v.edu, home: v.homeId, r: regardOf(v), met: !!(Game.wizMet || {})[v.id] };
  Game.journey = { phase: 'leaving', dest: key, leftDay: Game.day, leftTime: Game.time, back, snap, homes: World.homes.filter((h) => h.built).map((h) => h.id), told: w.told || [], letters: [], events: [], calls: [], sent: {}, frags: typeof story === 'function' ? story().frags.length : 0, stage: typeof story === 'function' ? story().stage : 0 };
  Journey.cut = false;
  wizSay(R.pick(['Well! The road goes ever on, and I must go with it.', 'I shall be back before you\'ve missed me. Probably.', 'Look after the place for me.']));
  wizWalkTo(w.camp.x + w.face * 18, w.camp.y + 4, { kind: 'depart', run: driveOff });
}
function driveOff(w) {
  const J = journeyOf();
  if (!J) return;
  w.phase = 'going'; w.doing = 'drive'; w.fpath = null;
  const ex = WEST_EXIT, end = { x: clamp(ex.x, 8, MAP_W * 16 - 8), y: ex.y };
  w.path = wizPath({ x: w.x, y: w.y }, end); w.pi = 0;
  J.driveStart = Game.time;
  chronicle(`Gandalf has climbed up onto his wagon and set off ${JOURNEYS[J.dest].to.replace(/^from /, 'for ')}${J.dest === 'hills' ? '' : ''}, waving his hat. The children ran after him as far as the bridge.`.replace('set off for the Mountain', 'set off east for the Mountain').replace('set off for the Sea', 'set off west for the Sea').replace('set off over the hills', 'set off over the hills').replace('set off for the long road south', 'set off on the long road south').replace('set off for Neverdark', 'set off through the golden door for Neverdark'), 'party');
  Game.follow = true;
  if (!w.path) wizardGone();
}
// the children see him off
function farewellCheers(w) {
  for (const v of Game.villagers) {
    if (!v.isChild() || v.inside || v.stage === 'baby' || (w.waved || (w.waved = [])).includes(v.id) || dist(v.x, v.y, w.x, w.y) > 110) continue;
    w.waved.push(v.id);
    v.say(R.pick(['Bye, Gandalf! Come back soon!', 'Bring me something!', 'Don\'t forget us!', 'Will you be back for my birthday?']), 3);
    if (!v.task || !v.task.chatLock) { v.abort(); v.begin({ ...ACTIONS.stroll, id: 'stroll', target: () => ({ x: w.x - w.face * 30, y: w.y + 6, facing: 'left' }) }, Game.hour); }
  }
}

// --- On the road ------------------------------------------------------------------------
function beginAway() {
  const J = journeyOf();
  if (!J) return;
  J.phase = 'away';
  const D = JOURNEYS[J.dest];
  Journey.heldSpeed = Game.speedIdx || Journey.heldSpeed || 1;
  setSpeed(0);
  Journey.noRender = true;
  Sheet.close(true);
  const card = document.querySelector('#skip .skip-card');
  card.classList.add('journey');
  let cv = $('journey-road');
  if (!cv) { cv = document.createElement('canvas'); cv.id = 'journey-road'; cv.width = 320; cv.height = 96; card.insertBefore(cv, $('skip-clock')); }
  cv.hidden = false;
  Journey.drawing = true; drawRoad();
  const mins = Math.max(30, J.back - Game.time);
  const p = skipTime(mins, { title: `${D.name}`, text: R.pick(D.road), hold: true, budget: 120, stop: () => Journey.cut, onDay: journeyDay });
  // letters already written (a journey resumed after a reload) go back on the page
  for (const l of J.letters) showLetter(l, true);
  p.then(() => journeyHome());
}
function journeyDay(day) {
  const J = journeyOf();
  if (!J) return;
  const D = JOURNEYS[J.dest];
  $('skip-text').textContent = D.road[(day - J.leftDay) % D.road.length];
  writeLetters();
  watchForCalls();
}
// The road: a little picture of the wagon on its way, under the sky of where it's going.
function drawRoad() {
  const J = journeyOf(), cv = $('journey-road');
  if (!Journey.drawing || !J || !cv) return;
  const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  const W = cv.width, H = cv.height, t = performance.now() / 1000, land = JOURNEYS[J.dest].land;
  const night = Game.hour < 6 || Game.hour >= 20.5;
  const sky = night ? ['#141a34', '#1c2446', '#26305a'] : land === 'neverdark' ? ['#2a1a3a', '#3a2450', '#4a2e66'] : ['#8cc4e8', '#a8d4ee', '#c4e2f2'];
  sky.forEach((c, i) => { x.fillStyle = c; x.fillRect(0, i * 16, W, 16); });
  if (night) for (let i = 0; i < 30; i++) { x.fillStyle = '#e8f0ff'; x.fillRect((i * 53) % W, (i * 17) % 40, 1, 1); }
  const scroll = (sp) => (t * sp) % W;
  // the far land
  const far = { hills: '#6a9a5a', mountain: '#7a7a8e', sea: '#3a6a9a', plains: '#c8b45a', neverdark: '#1a1424' }[land];
  for (let i = -1; i < 3; i++) {
    const ox = i * W - scroll(6);
    x.fillStyle = far;
    if (land === 'mountain') for (const [mx, mh] of [[40, 30], [130, 44], [230, 26]]) for (let k = 0; k < mh; k++) { x.fillStyle = k < mh * 0.22 ? '#e8eef4' : far; x.fillRect(ox + mx - k, 58 - mh + k, k * 2 + 1, 1); }
    else if (land === 'sea') { x.fillRect(ox, 46, W, 12); x.fillStyle = '#5a8ab8'; for (let k = 0; k < W; k += 9) x.fillRect(ox + k + (Math.floor(t * 2) % 3), 48 + (k % 3), 4, 1); }
    else if (land === 'neverdark') { for (let k = 0; k < W; k += 22) { const h = 18 + ((k * 7) % 23); x.fillRect(ox + k, 58 - h, 16, h); x.fillStyle = (k / 22) % 2 ? '#ff3aa8' : '#3af0ff'; x.fillRect(ox + k + 3, 58 - h + 4, 2, 2); x.fillRect(ox + k + 9, 58 - h + 10, 2, 2); x.fillStyle = far; } }
    else for (let k = 0; k < W; k++) { const h = 8 + Math.round(Math.sin((k + i * W) / 26) * 5 + Math.sin((k + i * W) / 9) * 2); x.fillRect(ox + k, 58 - h, 1, h); }
  }
  // the near ground and the road
  x.fillStyle = land === 'plains' ? '#b8a44a' : land === 'neverdark' ? '#22202c' : '#5a8a3a'; x.fillRect(0, 58, W, 38);
  x.fillStyle = land === 'neverdark' ? '#3a3846' : '#a8845a'; x.fillRect(0, 74, W, 10);
  x.fillStyle = land === 'neverdark' ? '#4a4858' : '#8a6a44'; for (let k = 0; k < W + 20; k += 14) x.fillRect(k - scroll(30) % 14, 78, 5, 1);
  // the wagon, bumping along, with the old man on the bench
  const spr = wagonSprite(Math.floor(t * 6) % 2), bob = Math.floor(t * 6) % 2;
  x.drawImage(spr, Math.round(W / 2 - 40), 48 - bob);
  const s = wizSprite('side', 'sit');
  x.drawImage(s, Math.round(W / 2 - 40 + 41 - s.width / s.res / 2), 48 - bob + 16 - s.height / s.res + 1, s.width / s.res, s.height / s.res);
  if (night) { x.fillStyle = 'rgba(255, 210, 120, 0.35)'; x.fillRect(W / 2 - 40, 46, 8, 8); }
  requestAnimationFrame(drawRoad);
}

// --- Letters ---------------------------------------------------------------------------
// Things that happen while he's away, caught from the Chronicle.
const JOURNEY_EVENTS = [
  ['wedding', /were wed beneath/, 5], ['birth', /(has|have) arrived at .*Proud parents/, 5], ['expecting', /are expecting/, 3], ['sweethearts', /Sweethearts/, 2],
  ['age', /has come of age/, 4], ['toddle', /toddling about now/, 2], ['farewell', /last great adventure/, 5], ['trip', /set off to see the world/, 2], ['back', /is back from adventuring/, 2],
  ['rift', /stepped out of the rift/, 3], ['home', /brand-new hobbit-hole|a home of their own/, 2], ['trade', /taken up the .* trade/, 1], ['party', /lanterns are lit|Mayday|Midsummer|Harvest Feast|Yule|Birthdays today/, 1],
  ['clue', /clue|Lamplighter|Mungo/, 3],
];
function noteEvent(text) {
  const J = journeyOf();
  if (!J || J.phase !== 'away') return;
  const e = JOURNEY_EVENTS.find(([, re]) => re.test(text));
  if (!e) return;
  const ids = Game.villagers.filter((v) => text.includes(v.first + ' ') || text.includes(v.first + ',') || text.includes(v.first + '\'') || text.includes(v.first + '!') || text.includes(v.first + '.')).map((v) => v.id);
  J.events.push({ k: e[0], text, ids, day: Game.day, w: e[2], told: false });
  if (J.events.length > 60) J.events.splice(0, J.events.length - 60);
  const ev = J.events[J.events.length - 1];
  if (e[0] === 'farewell') for (const id of ids) { const v = personById(id); if (v && (regardOf(v) > 0.05 || (Game.wizMet || {})[id]) && J.letters.length < letterCap(J) + 2 && !(J.bye = J.bye || []).includes(id)) { J.bye.push(id); ev.told = true; letterFrom(v, 'goodbye', { e: ev }); } }
}
const jName = (id) => { const v = personById(id); return v ? v.first : 'someone'; };
// how many letters a journey's worth
const letterCap = (J) => ({ 1: 3, 3: 6, 12: 14 })[JOURNEYS[J.dest].days] || 6;
function writeLetters() {
  const J = journeyOf();
  if (!J || J.letters.length >= letterCap(J)) return;
  const fresh = J.events.filter((e) => !e.told).map((e) => ({ e, score: e.w * (1 + Math.max(0, ...e.ids.map((id) => { const v = personById(id); return v ? weight(v) : 0; }))) })).sort((a, b) => b.score - a.score);
  let n = 0;
  const ofKind = (k) => J.letters.filter((l) => l.kind === k).length;
  for (const { e } of fresh) {
    if (n >= 2 || J.letters.length >= letterCap(J)) break;
    if (ofKind(e.k) >= 2) { e.told = true; continue; }
    const writer = writerFor(e);
    if (!writer) continue;
    e.told = true;
    letterFrom(writer, e.k, { e });
    n++;
  }
  // and a child who knows him, now and then, about nothing in particular
  if (n < 2 && J.letters.length < letterCap(J) && R.chance(0.45)) {
    const kids = Game.villagers.filter((v) => v.isChild() && kidBand(v) !== 'toddler' && (Game.wizMet || {})[v.id] && !J.sent[v.id]);
    if (kids.length) letterFrom(R.pick(kids), 'child', {});
  }
  // or the hearth, or the fondest, with the news of the week
  if (n === 0 && J.letters.length < letterCap(J) && R.chance(0.5)) {
    const pool = Game.villagers.filter((v) => v.isGrown() && closeToHim(v) && !J.sent[v.id]).sort((a, b) => weight(b) - weight(a));
    if (pool[0]) letterFrom(pool[0], 'roundup', {});
  }
}
// who'd write to him about it: one of the people it's about, if they're fond of him; else his hearth or best friend
function writerFor(e) {
  const J = journeyOf();
  const about = e.ids.map(personById).filter((v) => v && v.stage !== 'baby' && !v.leaving);
  const own = about.filter((v) => (closeToHim(v) || (Game.wizMet || {})[v.id]) && (v.isGrown() || kidBand(v) !== 'toddler')).sort((a, b) => weight(b) - weight(a))[0];
  if (own) return own;
  const fond = Game.villagers.filter((v) => v.isGrown() && !v.leaving && closeToHim(v) && !about.includes(v)).sort((a, b) => (J.sent[a.id] || 0) - (J.sent[b.id] || 0) || weight(b) - weight(a));
  return fond[0] || null;
}
// A letter in its writer's hand: a small child's is a drawing, then misspelt, then fluent.
const MISSPELL = [[/\bwizard\b/g, 'wizzard'], [/\bbecause\b/g, 'becos'], [/\bfireworks\b/g, 'firewurks'], [/\blittle\b/g, 'littel'], [/\bfriend/g, 'frend'], [/\bsaid\b/g, 'sed'], [/\bplease\b/g, 'pleez'], [/\bwas\b/g, 'wos'], [/\bvery\b/g, 'verry'], [/\bbirthday\b/g, 'burthday'], [/\bwedding\b/g, 'weding'], [/\bbaby\b/g, 'babby']];
function inHand(v, text, drawing) {
  if (v.isChild() && v.edu < 0.12) return `<i>A drawing in crayon: ${drawing || 'you, very tall, with a hat like a chimney, and a dragon'}. Underneath, in a grown-up's hand: "${escapeHtml(v.first)} wanted you to have this."</i>`;
  if (v.isChild() && v.edu < 0.45) {
    let t = text.toLowerCase().replace(/[’']/g, '');
    for (const [re, to] of MISSPELL) t = t.replace(re, to);
    return escapeHtml(t.replace(/\./g, '').replace(/!/g, '!!'));
  }
  if (v.isGrown() && v.edu < 0.12) return `${escapeHtml(text)} <i>(Written for ${v.pron.them} by the postie.)</i>`;
  return escapeHtml(text);
}
const SIGN = { cheerful: 'Love and cake,', ornery: 'Yours, I suppose,', shy: 'Yours (quietly),', curious: 'Write back and tell me everything!', dreamy: 'Under the same stars,', witty: 'Yours in haste, and in pie,', proud: 'With respect,', gloomy: 'It rained. Yours,' };
function letterFrom(v, kind, { e }) {
  const J = journeyOf();
  if (!J || !v) return;
  const ids = e ? e.ids : [], others = ids.filter((id) => id !== v.id).map(jName), me = ids.includes(v.id);
  const and = (xs) => (xs.length > 1 ? xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1] : xs[0] || '');
  let text = '', drawing = '';
  switch (kind) {
    case 'wedding': text = me ? `We were wed beneath the party tree, ${others[0] ? others[0] + ' and I' : 'at last'}. Everyone was there but you. We kept you a slice of cake, though it's gone a bit hard.` : `${and(ids.map(jName))} were wed beneath the party tree. We all wished you were there.`; drawing = 'two hobbits under a tree, and a very large cake'; break;
    case 'birth': { const baby = e.text.match(/, ([A-Z][a-z]+)(?: and [A-Z][a-z]+)?, ha/); text = me ? R.pick([`We've a little one! ${baby ? baby[1] : 'A baby'}, as loud as a kettle. Come home and meet ${baby ? 'them' : 'the baby'}.`, `${baby ? baby[1] : 'The baby'} has arrived, with a grip like a blacksmith. We haven't slept since.`, `A baby! ${baby ? baby[1] : 'Ours'}. I keep counting the toes. Ten, every time.`]) : `There's a new baby at ${and(ids.map(jName))}'s${baby ? `: ${baby[1]}` : ''}. Tiny, and very loud.`; drawing = 'a very small baby, and a very big rattle'; break; }
    case 'expecting': text = me ? R.pick(['We\'re expecting a little one! Don\'t tell anyone I told you. Everyone knows.', 'There\'s a little one on the way. I\'ve started knitting. It\'s going badly.']) : `${and(ids.map(jName))} are expecting! The knitting needles are out all over the village.`; break;
    case 'sweethearts': text = me ? `${others[0] || 'Somebody'} and I have been walking out together. Don't laugh.` : `Word is ${and(ids.map(jName))} are walking out together. About time, if you ask me.`; break;
    case 'age': text = me ? R.pick(['I\'ve come of age! There was a party and everything. I wish you\'d seen it.', 'I\'m grown up now. Officially. I\'ve a waistcoat and everything.', 'Came of age on the first fine day of the week. Everyone said I\'d grown. I said, that\'s rather the point.']) : `${and(ids.map(jName))} came of age. Where do the years go?`; drawing = 'a party, with you in it even though you weren\'t'; break;
    case 'toddle': text = `Little ${and(ids.map(jName))} is toddling about now and getting into everything.`; break;
    case 'goodbye': text = 'By the time this reaches you I\'ll be over the hills, on my last adventure. Thank you for the tales. Look after the little ones for me.'; break;
    case 'farewell': text = `Old ${and(ids.map(jName))} set off on a last great adventure. ${ids.length > 1 ? 'They' : 'They'} asked me to say goodbye to you.`; break;
    case 'trip': text = `${and(ids.map(jName))} has gone off to see the world, like a certain wizard I could name.`; break;
    case 'back': text = `${and(ids.map(jName))} is back from adventuring, with tales nearly as tall as yours.`; break;
    case 'rift': text = `Another one came through the rift: ${and(ids.map(jName)) || 'a stranger'}. Blinking, poor thing, and no idea what a scone is.`; break;
    case 'home': text = `There's a new hole finished on the knoll. The door's painted and the kettle's on.`; break;
    case 'trade': text = me ? `I've taken up a trade! ${v.job ? `I'm ${aAn(JOBS[v.job].label.toLowerCase())} now.` : ''}` : `${and(ids.map(jName))} has taken up a trade.`; break;
    case 'party': text = 'We had a party. The fireworks weren\'t a patch on yours.'; drawing = 'fireworks, in every colour of crayon'; break;
    case 'clue': text = 'Something odd about the rifts. The rift-folk are all whispering about it. Come back and make sense of it?'; break;
    case 'child': text = R.pick(['I learned my letters up to M!', 'I found a frog. I called it Gandalf.', 'When are you coming back? Mum says soon.', 'I can skim a stone four times now.', 'We had a party and I stayed up til ten.']); drawing = R.pick(['a frog with a pointed hat', 'you, riding a dragon', 'the wagon, with too many wheels']); break;
    case 'roundup': { const f = feelingsOf(v).find((x) => x[3] && MOODLETS[x[3].k] && MOODLETS[x[3].k][3] && !x[3].k.startsWith('wizard')); text = `All's well here. ${f ? MOODLETS[f[3].k][3][0].replace('{x}', f[3].x || '') : 'Nothing much has happened, and I mean that kindly.'}`; break; }
    default: return;
  }
  const temper = v.isChild() ? null : temperOf(v);
  const l = { id: v.id, from: v.first, kind, day: Game.day, body: inHand(v, text, drawing), sign: v.isChild() ? (v.edu < 0.12 ? '' : 'from') : SIGN[temper] || 'Yours,' };
  J.letters.push(l);
  J.sent[v.id] = (J.sent[v.id] || 0) + 1;
  showLetter(l);
}
function showLetter(l, old) {
  const li = document.createElement('li');
  li.className = 'letter' + (l.call ? ' call' : '');
  li.innerHTML = `<span class="j-day">Day ${l.day}</span>${l.body}${l.sign !== undefined ? `<span class="j-sign">${escapeHtml(l.sign)} ${escapeHtml(l.from)}</span>` : ''}`;
  if (l.call && !old && !Journey.cut) {
    const b = document.createElement('button'); b.className = 'j-come'; b.textContent = 'Turn the wagon round';
    b.addEventListener('click', () => { Journey.cut = true; b.disabled = true; b.textContent = 'Heading home…'; });
    li.appendChild(b);
  }
  $('skip-log').prepend(li);
}

// --- Called back --------------------------------------------------------------------------
// Something big is about to happen to folk he knows: a letter asks him to come home.
function watchForCalls() {
  const J = journeyOf();
  if (!J || Journey.cut || Game.time > J.back - 720) return;
  const called = (key) => J.calls.includes(key);
  // two calls a journey at most, one a day, so the journal isn't all pleading
  const call = (key, writer, text) => {
    if (called(key) || !writer || J.calls.length >= 2 || J.callDay === Game.day) return;
    J.callDay = Game.day;
    J.calls.push(key);
    const l = { id: writer.id, from: writer.first, kind: 'call', call: true, day: Game.day, body: inHand(writer, text), sign: writer.isChild() ? 'from' : 'Please come,' };
    J.letters.push(l); showLetter(l);
  };
  const best = (exclude = []) => Game.villagers.filter((v) => v.isGrown() && !exclude.includes(v) && closeToHim(v)).sort((a, b) => weight(b) - weight(a))[0];
  for (const v of Game.villagers.slice().sort((a, b) => weight(b) - weight(a))) {
    // a child he knows, nearly grown
    if (v.isChild() && (Game.wizMet || {})[v.id] && v.age >= CHILD_DAYS - 0.6 && v.age < CHILD_DAYS) call('age' + v.id, v.edu > 0.12 ? v : best(), v.edu > 0.12 ? 'I come of age tomorrow! Will you come back for it? Please?' : `${v.first} comes of age tomorrow, and keeps asking if you'll be there.`);
    // a baby due among folk fond of him
    if (v.expecting && closeToHim(v) && Game.day >= (v.expecting.due || 0) - 1) call('baby' + v.id, v, 'The baby\'s due any day now. It would mean the world if you were here.');
    // an elder near the end
    if (v.stage === 'elder' && closeToHim(v) && v.age >= ADVENTURE_DAYS - 1) call('old' + v.id, v, 'I\'m getting on, and I\'ve a mind to go on one last adventure. I\'d like to say goodbye properly. Come back?');
  }
  // sweethearts among his friends: a wedding's coming
  for (const e of J.events) if (e.k === 'sweethearts' && e.ids.some((id) => { const v = personById(id); return v && closeToHim(v); })) call('wed' + e.ids.join('-'), personById(e.ids[0]), 'There\'s going to be a wedding, I\'m sure of it. You must be here!');
  // the rifts: the Long Dim, and Moots
  if (typeof story === 'function' && story().stage >= 8 && J.stage < 8) call('longdim', best(), 'The Long Dim has come. The rifts are guttering, and there\'s to be a Moot. The village needs you.');
  if (!$('moot').hidden) call('moot' + Game.day, best(), 'The village has called a Moot, and folk keep asking what you\'d say. Come home?');
}

// --- Coming home ---------------------------------------------------------------------------
function journeyHome() {
  const J = journeyOf();
  Journey.drawing = false;
  if (!J) return;
  const D = JOURNEYS[J.dest];
  $('skip-title').textContent = Journey.cut ? 'Turning the wagon round' : `Home ${D.to}`;
  $('skip-text').textContent = Journey.cut ? 'Back down the road, as fast as the horse will go.' : 'The road turns for home, and Thistledown is over the next hill.';
  const card = document.querySelector('#skip .skip-card');
  let b = $('journey-home');
  if (!b) { b = document.createElement('button'); b.id = 'journey-home'; b.className = 'primary'; card.appendChild(b); }
  b.hidden = false; b.textContent = 'Drive into Thistledown';
  b.onclick = () => {
    b.hidden = true;
    $('skip').hidden = true; card.classList.remove('journey');
    const cv = $('journey-road'); if (cv) cv.hidden = true;
    Journey.noRender = false;
    setSpeed(Journey.heldSpeed || 1);
    arriveHome();
  };
}
function arriveHome() {
  const J = journeyOf();
  if (!J) return;
  const ex = WEST_EXIT, start = { x: clamp(ex.x, 8, MAP_W * 16 - 8), y: ex.y };
  const camp = wizardCamp(), path = wizPath(start, camp);
  Game.wizard = { phase: 'coming', day: Game.day, leave: Game.day + WIZARD.stay, x: start.x, y: start.y, face: start.x < camp.x ? 1 : -1, path, pi: 0, camp, doing: 'drive', fx: camp.x, fy: camp.y, facing: 'down', fpath: null, fpi: 0, dist: 0, told: J.told || [], taleDay: 0, showDay: 0, cheered: [] };
  if (!path) { Game.wizard.x = camp.x; Game.wizard.y = camp.y; }
  // start him some way along, so the wagon's in the valley when you look
  if (path && path.length > 30) { Game.wizard.pi = path.length - 30; [Game.wizard.x, Game.wizard.y] = path[Game.wizard.pi]; }
  J.phase = 'returning';
  Game.wizardLast = Game.day;
  Game.follow = true;
  chronicle(`Gandalf's wagon is rolling back up the road ${JOURNEYS[J.dest].to}, and the children are running to meet it!`, 'party');
}
// what he brings, what's faded, and what's new: run once he's drawn up
function settleHome() {
  const J = journeyOf();
  if (!J) return;
  const D = JOURNEYS[J.dest], days = Math.max(0.3, (Game.time - J.leftTime) / 1440), full = Game.time >= J.back - 1440 * D.days * 0.5;
  // bonds fade a little; small children who never heard a tale forget him
  const forgot = [];
  for (const id in Game.wizRel || {}) {
    const v = personById(+id); if (!v) continue;
    Game.wizRel[id] *= Math.pow(0.9, days / 3);
    const was = J.snap[id];
    if (was && ['baby', 'toddler', 'young'].includes(was.s) && !(Game.wizHeard || {})[id] && days >= 3) { delete Game.wizMet[id]; Game.wizRel[id] = 0; forgot.push(+id); }
  }
  // a new tale from the road, and presents
  if (full && D.tale && !(Game.wizTales || []).includes(D.tale)) { (Game.wizTales = Game.wizTales || []).push(D.tale); WIZARD_TALES[D.tale] = JOURNEY_TALES[D.tale]; }
  const pres = presentFor(), gifts = [];
  if (pres) gifts.push({ id: pres.id, what: D.gift });
  if (D.gift2) { const p2 = presentFor(pres); if (p2) gifts.push({ id: p2.id, what: D.gift2 }); }
  Game.wizGifts = (Game.wizGifts || []).concat(gifts);
  // from Neverdark: letters for the rift-folk, and perhaps someone they lost
  let found = null;
  if (D.rift) {
    const rb = Game.villagers.filter((v) => v.isRiftborn() && v.isGrown());
    for (const v of rb.slice(0, 3)) postLetter({ id: null, first: 'Neverdark' }, v, 'away');
    const waiting = rb.filter((o) => o.arc && !o.arc.lost.found);
    if (waiting.length && R.chance(0.7)) {
      const w = wizardOf();
      found = arriveFromRift({ x: w.camp.x + w.face * 40, y: w.camp.y, sent: 0, crew: 1, reunite: 1 });
      if (found) { const l = Game.log.find((x) => x.text.includes('stepped out of the rift')); if (l) l.text = `${found.name()} came back with the wizard from Neverdark, and stood blinking in the sunshine of the Shire.`; renderLog(); }
    }
  }
  const newIds = Game.villagers.filter((v) => !J.snap[v.id]).map((v) => v.id);
  const newHomes = World.homes.filter((h) => h.built && !J.homes.includes(h.id)).map((h) => h.id);
  const reunion = Object.keys(J.snap).map(Number).filter((id) => J.snap[id].met && personById(id) && !forgot.includes(id));
  Game.wizBack = { day: Game.day, left: J.leftDay, dest: J.dest, days: Math.round(days * 10) / 10, newIds, newHomes, reunion, forgot, asked: [], snap: J.snap, cards: sinceCards(J, newIds, newHomes, forgot, found) };
  for (const v of Game.villagers) if (!v.inside || v.isChild()) feel(v, 'wizard_back');
  Game.wizPack = refillPack();
  Game.journey = null;
  sinceSheet();
}
function presentFor(not) {
  const pool = Game.villagers.filter((v) => v !== not && v.stage !== 'baby' && ((Game.wizMet || {})[v.id] || hearthIds().includes(v.id)));
  // a child of the hearth first, then the fondest
  pool.sort((a, b) => (hearthIds().includes(b.id) && b.isChild() ? 5 : 0) - (hearthIds().includes(a.id) && a.isChild() ? 5 : 0) || weight(b) - weight(a));
  return pool[0] || null;
}

// --- Since you were last here ---------------------------------------------------------------
function sinceCards(J, newIds, newHomes, forgot, found) {
  const cards = [];
  const add = (score, c) => cards.push({ score, ...c });
  const imp = (id) => { const v = personById(id); return v ? weight(v) : 1; };
  for (const v of Game.villagers) {
    const was = J.snap[v.id];
    if (!was) {
      if (v.stage === 'baby' || v.isChild()) { const ps = v.parents.map(jName).filter((x) => x !== 'someone'); add(4 * Math.max(...v.parents.map(imp), 1), { id: v.id, grew: 'born', many: 'were born', head: `${v.first} was born`, text: ps.length ? `to ${ps.join(' and ')}. You've never met.` : 'You\'ve never met.', now: true }); }
      else if (found && v === found) add(9, { id: v.id, head: `${v.first} came home with you`, text: 'from Neverdark, to someone who\'d been waiting a long time.', now: true });
      else add(2, { id: v.id, head: `${v.first} is new in the village`, text: v.isRiftborn() ? 'Came through a rift while you were away.' : 'Came up the West Road while you were away.', now: true });
      continue;
    }
    const now = jStage(v);
    if (was.s !== now) {
      const grew = was.s === 'baby' ? 'toddling about' : now === 'adult' ? 'come of age' : now === 'elder' ? 'gone a little grey' : now === 'youth' ? 'shot up like a beanpole' : 'grown';
      const verb = (many) => (grew === 'toddling about' ? (many ? 'are ' : 'is ') : many ? 'have ' : 'has ') + grew;
      const sc = (now === 'adult' ? 4 : 2) * imp(v.id) * (was.met ? 1.5 : 1);
      const note = { 'come of age': 'You\'d hardly know them.', 'gone a little grey': 'Getting on a bit, though nobody says so.', 'toddling about': 'And into everything.', 'shot up like a beanpole': 'All knees and elbows.' }[grew] || '';
      add(sc, { id: v.id, grew, many: verb(true), head: `${v.first} ${verb(false)}`, text: forgot.includes(v.id) ? 'And doesn\'t remember you, I\'m afraid.' : was.met || grew !== 'come of age' ? note : '', then: was.s, now: true });
    }
    if (v.spouse && v.spouse !== was.sp) add(4 * Math.max(imp(v.id), imp(v.spouse)), { id: v.id, head: `${v.first} and ${jName(v.spouse)} were married`, text: 'beneath the party tree, without you.', now: true, pair: v.spouse });
    if (v.job && v.job !== was.job && was.s !== 'adult' && now === 'adult') { /* the coming of age says it */ }
  }
  for (const id in J.snap) {
    if (personById(+id)) continue;
    const was = J.snap[id], away = (Game.away || []).find((a) => a.id === +id);
    add(away ? 1.5 : 5 * (was.r > 0.2 ? 2 : 1), away ? { name: was.first, head: `${was.first} is off adventuring`, text: `Back around day ${away.back}.` } : { name: was.first, grew: 'gone', many: 'have gone on a last great adventure', head: `${was.first} has gone on a last great adventure`, text: 'over the hills and far away.' });
  }
  if (newHomes.length) add(1, { head: `${newHomes.length === 1 ? 'A new hobbit-hole' : `${newHomes.length} new hobbit-holes`}`, text: newHomes.map((id) => (World.homes[id] || {}).name).filter(Boolean).slice(0, 2).join(' and ') + ', dug while you were away.', home: newHomes[0] });
  if (typeof story === 'function' && story().stage > J.stage) add(3, { head: 'The rifts', text: `The story of the rifts has moved on: ${RIFT_STAGES[story().stage].name}.` });
  // several growing the same way make one card, led by whoever matters most to him
  const grown = cards.filter((c) => c.grew), rest = cards.filter((c) => !c.grew);
  const byKind = {};
  for (const c of grown) (byKind[c.grew] = byKind[c.grew] || []).push(c);
  for (const k in byKind) {
    const g = byKind[k].sort((a, b) => b.score - a.score);
    if (g.length === 1) { rest.push(g[0]); continue; }
    const names = g.map((c) => c.name || (personById(c.id) || {}).first || 'someone'), list = names.length > 4 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    rest.push({ ...g[0], score: g[0].score + g.length * 0.5, head: `${list} ${g[0].many}`, text: k === 'born' ? 'Babies everywhere. You\'ve met none of them.' : g[0].text });
  }
  cards.length = 0; cards.push(...rest);
  // pairs said once
  const seen = new Set();
  return cards.filter((c) => { const k = c.pair ? [c.id, c.pair].sort().join() : c.head; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.score - a.score).slice(0, 6);
}
function sinceSheet() {
  const B = Game.wizBack;
  if (!B || !B.cards) return;
  const D = JOURNEYS[B.dest] || { name: 'the road' };
  const html = B.cards.length ? B.cards.map((c, i) => `<div class="since-card">${c.id != null ? `<div class="since-pics">${c.then ? `<canvas data-then="${i}" width="60" height="80"></canvas><span class="since-arrow">→</span>` : ''}<canvas data-now="${i}" width="60" height="80"></canvas></div>` : ''}<div class="since-text"><b>${escapeHtml(c.head)}</b> ${escapeHtml(c.text || '')}${c.id != null && personById(c.id) ? `<button class="since-go" data-go="${c.id}">Go and see</button>` : ''}</div></div>`).join('') : '<p>Nothing much changed. The kettle\'s still on.</p>';
  Sheet.open({
    kind: 'since', title: 'Since you were last here', sub: `${B.days >= 1 ? `${Math.round(B.days)} day${Math.round(B.days) === 1 ? '' : 's'}` : 'less than a day'} away, ${D.to || 'on the road'}. The rest is in the Chronicle.`,
    html, choices: [{ label: 'Back to the valley', primary: true, run: () => { Sheet.close(true); B.cards = null; } }], onClose: () => { B.cards = null; },
  });
  const body = $('sheet-body'); body.scrollTop = 0;
  B.cards.forEach((c, i) => {
    const v = c.id != null ? personById(c.id) : null;
    if (!v) return;
    const now = body.querySelector(`[data-now="${i}"]`), then = body.querySelector(`[data-then="${i}"]`);
    if (now) drawPortrait(now, v.genes, v.stage, false, v.look ? v.look() : {});
    if (then) drawPortrait(then, v.genes, c.then === 'baby' ? 'baby' : ['toddler', 'young', 'school', 'youth'].includes(c.then) ? 'child' : c.then, true, {});
  });
  body.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { const v = personById(+b.dataset.go); B.cards = null; Sheet.close(true); if (v) wizApproach(v); }));
}

// --- Reunions and news -------------------------------------------------------------------------
function reunionLine(v) {
  const B = Game.wizBack, was = B && B.snap[v.id];
  if (!was) return null;
  const now = jStage(v);
  if (B.forgot.includes(v.id)) return R.pick(['Do I know you? Mum says you were here before, when I was little.', '...Who are you? You\'ve got a very big hat.']);
  if (was.s !== 'adult' && now === 'adult') return `It's me, ${v.first}! I was this high when you left. I've come of age!`;
  if (was.s !== now && v.isChild()) return R.pick(['You came back! I\'ve grown a whole inch. Two!', `Gandalf! It's me! ${v.first}! Look how tall I am!`]);
  if (v.spouse && v.spouse !== was.sp) return R.pick(['You missed the wedding, you old goat! We saved you some cake.', `You missed the wedding! ${jName(v.spouse)} and I waited as long as we could.`]);
  const baby = Game.villagers.find((b) => b.parents.includes(v.id) && !B.snap[b.id]);
  if (baby) return `You must meet ${baby.first}! Born while you were off gallivanting.`;
  if (v.stage === 'elder') return 'Back at last! I\'d begun to think I\'d go before you did.';
  return regardOf(v) > 0.15 ? R.pick(['There he is! Where have you been all this time?', 'You\'re back! Sit down, sit down. Tell me everything.']) : R.pick(['Oh. You\'re back.', 'Back again, are you?']);
}
function missedNews(v) {
  const B = Game.wizBack;
  const known = Game.wizKnows || (Game.wizKnows = []);
  const ns = newsList().filter((n) => n.day >= B.left && knowsNews(v, n) && !known.includes(n.id) && !n.text.includes(v.first) && !/Gandalf|wizard|\(/.test(n.text) && !['learn', 'work'].includes(n.kind)).slice(0, 2);
  for (const n of ns) known.push(n.id);
  return ns.map((n, i) => { const t = /[.!?]$/.test(n.text) ? n.text : n.text + '.'; return i && /^The /.test(t) ? 't' + t.slice(1) : t; });
}
addTalkOption({
  id: 'missed', order: 15, label: 'What have I missed?',
  when: (v) => !!journeyBack() && !Game.wizBack.asked.includes(v.id),
  run: (v, T) => {
    Game.wizBack.asked.push(v.id);
    T.wiz(R.pick(['So. What have I missed?', 'Tell me everything that\'s happened.']));
    const ns = missedNews(v);
    if (ns.length) T.reply(`Where to start! ${ns.map((t, i) => (i ? 'And ' + t.charAt(0).toLowerCase() + t.slice(1) : t)).join(' ')}`);
    else T.reply(R.pick(['Oh, nothing much. Same as ever.', 'You\'d do better asking at the inn. I\'ve had my nose to the grindstone.']));
    addRegard(v, 0.03);
  },
});
addTalkOption({
  id: 'present', order: 12, label: 'I brought you something from the road',
  when: (v) => (Game.wizGifts || []).some((g) => g.id === v.id),
  run: (v, T) => {
    const g = Game.wizGifts.find((x) => x.id === v.id);
    Game.wizGifts = Game.wizGifts.filter((x) => x !== g);
    T.wiz(`I brought you something. ${g.what.charAt(0).toUpperCase() + g.what.slice(1)}. I thought of you when I saw it.`);
    T.reply(v.isChild() ? R.pick(['For ME? I\'m going to keep it for ever and ever!', 'Ooh! Is it magic? It looks magic.']) : R.pick(['Oh, you shouldn\'t have. I\'ll put it on the mantelpiece, where everyone can see.', 'All that way, and you thought of me.']));
    feel(v, 'wizard_present', g.what);
    addRegard(v, 0.12);
    v.remember(`The wizard brought me ${g.what}.`, 2);
    if (!v.inside) FX.hearts(v.x, v.y - 14);
  },
});

// --- New since you left --------------------------------------------------------------------
const isNewSince = (v) => { const B = journeyBack(); return !!B && B.newIds.includes(v.id); };
function drawNewMarks(ctx) {
  const B = journeyBack();
  if (!B || !B.newIds.length) return;
  for (const id of B.newIds) {
    const v = personById(id);
    if (!v || v.inside || v.carried) continue;
    const y = Math.round((v._top ?? v.y - 16) - 5 + Math.sin(tReal * 3 + id) * 1);
    ctx.fillStyle = '#2a1c12'; ctx.fillRect(Math.round(v.x) - 2, y - 2, 5, 5);
    ctx.fillStyle = '#ffe14a'; ctx.fillRect(Math.round(v.x) - 1, y - 1, 3, 3); ctx.fillStyle = '#fff6c0'; ctx.fillRect(Math.round(v.x), y - 2, 1, 5); ctx.fillRect(Math.round(v.x) - 2, y, 5, 1);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  registerField('journey', null, { nullish: true });
  registerField('wizBack', null, { nullish: true });
  registerField('wizTales', []);
  registerField('wizGifts', []);
  registerField('wizHeard', {});
  // the tales he's brought home are his to tell again
  const restoreTales = () => { for (const k of Game.wizTales || []) if (JOURNEY_TALES[k]) WIZARD_TALES[k] = JOURNEY_TALES[k]; };
  addWizardAction({
    id: 'road', order: 85, icon: 'pack', label: () => 'Take to the road',
    when: () => { const w = wizardOf(); return !!w && !journeyOf() && Game.hour >= 7 && Game.hour < 19 && !(Game.time < (w.taleUntil || 0)) && w.doing !== 'show' && !(Game.party.on && w.showDay !== Game.day); },
    run: () => roadSheet(),
  });
  // who's heard one of his tales (they remember him, however small they were)
  patch(window, 'feel', (f) => function (v, key) { if (key === 'wizard_tale' && v) (Game.wizHeard || (Game.wizHeard = {}))[v.id] = 1; return f.apply(this, arguments); }, 'journey');
  // the Chronicle tells the journal what's happened
  patch(window, 'chronicle', (c) => function (text) {
    // back home, he needs no telling how to walk
    const J0 = journeyOf(); if (J0 && J0.phase === 'returning' && /^Gandalf has drawn up his wagon/.test(String(text))) return;
    const r = c.apply(this, arguments); try { noteEvent(String(text)); } catch (e) { /* a missed letter is no great loss */ } return r; }, 'journey');
  // the wagon going: children wave, and once it's round the bend the journey begins
  patch(window, 'wizDrive', (wd) => function (w, dt) {
    const J = journeyOf();
    if (J && J.phase === 'leaving' && w.phase === 'going') {
      farewellCheers(w);
      if (Game.time - (J.driveStart || Game.time) > 35) w.path = null;
    }
    // coming home: the grown children say so
    if (w.phase === 'coming' && J && J.phase === 'returning') for (const v of Game.villagers) {
      if (!v.isChild() && !(J.snap[v.id] && J.snap[v.id].s !== 'adult' && v.stage === 'adult')) continue;
      if (v.inside || v.stage === 'baby' || (w.cheered || []).includes(v.id) || dist(v.x, v.y, w.x, w.y) > 90) continue;
      const was = J.snap[v.id];
      if (!was || was.s === jStage(v)) continue;
      (w.cheered = w.cheered || []).push(v.id);
      v.say(R.pick([`Gandalf! It's me, ${v.first}! Look how big I am!`, 'You\'re back! I\'m nearly as tall as your staff now!']), 3.4);
      FX.sparkle(w.x + w.face * 6, w.y - 46, '#ffd34a');
    }
    return wd.apply(this, arguments);
  }, 'journey');
  patch(window, 'wizardGone', (wg) => function () {
    const J = journeyOf();
    const r = wg.apply(this, arguments);
    if (J && J.phase === 'leaving' && playMode()) beginAway();
    return r;
  }, 'journey');
  patch(window, 'wizardParked', (wp) => function () {
    const r = wp.apply(this, arguments);
    const J = journeyOf();
    if (J && J.phase === 'returning') settleHome();
    return r;
  }, 'journey');
  // the first word after a long time away
  patch(window, 'greeting', (g) => function (v) {
    const B = journeyBack();
    if (B && B.reunion.includes(v.id)) { B.reunion = B.reunion.filter((id) => id !== v.id); const l = reunionLine(v); if (l) return l; }
    if (B && B.forgot.includes(v.id)) { B.forgot = B.forgot.filter((id) => id !== v.id); return reunionLine(v) || g.apply(this, arguments); }
    return g.apply(this, arguments);
  }, 'journey');
  patch(window, 'regardWord', (rw) => function (v) { return rw.apply(this, arguments) + (isNewSince(v) ? ' · new since you left' : ''); }, 'journey');
  patch(window, 'placeAt', (pa) => function (wx, wy) {
    const r = pa.apply(this, arguments);
    const B = journeyBack();
    if (r && B && B.newHomes.length) { const h = homeAt(wx, wy); if (h && B.newHomes.includes(h.id)) return r.concat(['✦ New since you left']); }
    return r;
  }, 'journey');
  // nothing to draw while he's on the road; the journal page covers it all
  for (const k of ['render', 'renderOverlay', 'stepPaint', 'updateHUD', 'interiorFrame']) patch(window, k, (fn) => function () { if (Journey.noRender) return; return fn.apply(this, arguments); }, 'journey');
  // the camera keeps up with the wagon, coming or going
  patch(window, 'updateCamera', (uc) => function (dt) {
    const w = wizard();
    if (playMode() && w && w.phase !== 'here' && Game.follow && !Game.selected) {
      const tx = w.x - Game.cam.w / 2, ty = w.y - 20 - Game.cam.h / 2;
      Game.cam.x += (tx - Game.cam.x) * Math.min(1, dt * 3); Game.cam.y += (ty - Game.cam.y) * Math.min(1, dt * 3);
    }
    return uc.apply(this, arguments);
  }, 'journey');
  // the Steward's season report waits while he's on the road
  patch(window, 'showAlmanac', (sa) => function () { if (journeyOf()) return; return sa.apply(this, arguments); }, 'journey');
  patch(window, 'queueMoot', (qm) => function (fn, tag) { if (tag === 'almanac' && journeyOf()) return; return qm.apply(this, arguments); }, 'journey');
  // the marks over new folk
  Visitors.push({ x: 0, y: 0, hidden: false, draw: drawNewMarks, sync: true });
  setInterval(() => { const m = Visitors.find((o) => o.sync && o.draw === drawNewMarks); if (m && Game.cam) { m.x = Game.cam.x + Game.cam.w / 2; m.y = Game.cam.y + Game.cam.h + 150; m.hidden = !journeyBack(); } }, 250);
  // after a reload: finish a journey that was under way, or show the page that was waiting
  const resume = () => {
    restoreTales();
    if (!playMode()) return;
    const J = journeyOf();
    if (J && J.phase === 'away' && !Play.skipping) setTimeout(beginAway, 50);
    else if (Game.wizBack && Game.wizBack.cards && Game.wizBack.cards.length) setTimeout(sinceSheet, 50);
  };
  patch(window, 'startGame', (sg) => function () { const r = sg.apply(this, arguments); resume(); return r; }, 'journey');
  patch(window, 'load', (ld) => function () { const r = ld.apply(this, arguments); restoreTales(); return r; }, 'journey');
  addHook('newVillage', () => { Game.journey = null; Game.wizBack = null; Game.wizTales = []; Game.wizGifts = []; Game.wizHeard = {}; });
});
