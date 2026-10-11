'use strict';
// ---------------------------------------------------------------------------
// Rifts: every so often the air over the village tears open, and folk from a
// neon, wired-up world step through. The Riftfolk settle in, take up trades
// (tinkering above all), marry hill-folk and raise children of both bloods.
// Their ways spread the way any habit does, by talk and by example: a neon
// belt here, a visor there, and before long a hobbit-hole with a sky-dish on
// its roof. The hill-folk rub off on them too: rift-born settle into wool
// waistcoats and second breakfasts, though they never lose the knack.
//
//   genes.rift    rift-blood, 0 to 1, averaged from both parents
//   genes.chrome  a dominant chrome-eye gene
//   v.tech        rift ways, 0 to 1: culture, not blood, so it spreads
// ---------------------------------------------------------------------------

const RIFT_NAMES_F = ['Nyx', 'Vesper', 'Kira', 'Juno', 'Echo', 'Lyra', 'Rae', 'Zia', 'Mika', 'Sable', 'Ivy', 'Kestra', 'Quinn', 'Yuki'];
const RIFT_NAMES_M = ['Vex', 'Kade', 'Rook', 'Jax', 'Orin', 'Dex', 'Zane', 'Kaito', 'Ryker', 'Sol', 'Hex', 'Talon', 'Ash', 'Niko'];
const RIFT_SURNAMES = ['Voss', 'Okabe', 'Strand', 'Halcyon', 'Cipher', 'Mercer', 'Vance', 'Quill', 'Sato', 'Kestrel', 'Holloway', 'Arclight', 'Reyes', 'Byrne', 'Lark', 'Marlowe'];
// Children of both worlds often get a hill-name with a rift ending: Pipix, Bramax, Tumyra.
const HYBRID_END_F = ['ix', 'yra', 'ena', 'ia', 'exa'];
const HYBRID_END_M = ['ex', 'on', 'ax', 'or', 'yx'];

const RIFT_TIERS = [0.35, 0.7];
function techTier(t) { return t >= RIFT_TIERS[1] ? 2 : t >= RIFT_TIERS[0] ? 1 : 0; }
function techWord(v) {
  const t = v.tech;
  if (v.isRiftborn()) return t >= 0.7 ? 'Rift-born, and every inch of it' : 'Rift-born, gone native: wool, tea and second breakfast';
  return t >= 0.7 ? 'Thoroughly rift-minded' : t >= 0.35 ? 'Taking up rift ways' : t >= 0.12 ? 'Curious about rift ways' : 'Hill-folk through and through';
}
function bloodWord(g) {
  const r = g.rift || 0;
  if (r >= 0.99) return 'Rift-born';
  if (r >= 0.4) return 'Half rift-blood';
  if (r > 0.05) return 'A little rift-blood';
  return null;
}

function riftGenes(sex) {
  const g = randomGenes();
  if (sex) g.sex = sex;
  g.rift = 1;
  if (R.chance(0.75)) g.hair = R.pick(RIFT_HAIR);
  g.chrome = [R.chance(0.6) ? 1 : 0, R.chance(0.45) ? 1 : 0];
  g.vest = R.pick(RIFT_JACKETS); g.legs = R.pick(['#26262e', '#2a2a3a', '#3a3448']); g.shirt = R.pick(['#c8ccd4', '#9aa0a8', '#e0e0ea']);
  g.pipeLove = R.f(0.03, 0.25); g.curiosity = R.f(0.5, 0.95); g.bravery = R.f(0.45, 0.95); g.wit = R.f(0.45, 0.95);
  g.apt.tinkering = R.f(0.6, 1);
  g.taste.gadget = R.f(1.1, 1.35); g.taste.jack_in = R.f(1.1, 1.35); g.taste.smoke = 0.7;
  return g;
}
function riftName(sex) { return R.pick(sex === 'f' ? RIFT_NAMES_F : RIFT_NAMES_M); }
function hybridName(sex) { return R.pick(NAME_A) + R.pick(sex === 'f' ? HYBRID_END_F : HYBRID_END_M); }
// What a baby is called depends a little on how much rift-blood they carry.
function babyName(genes) {
  const r = genes.rift || 0;
  if (r < 0.2) return null;
  if (R.chance(0.45)) return hybridName(genes.sex);
  if (R.chance(r * 0.7)) return riftName(genes.sex);
  return null;
}

// ---------------------------------------------------------------------------
// Rifts opening and closing
// ---------------------------------------------------------------------------
const RIFT_ARRIVE_SAY = [
  'Where... is this? It smells of rain and bread.', 'No signal. None at all. Huh.', 'Is that a real tree? Like, grown?',
  'Easy now. We come in peace. Mostly.', 'The grid\'s gone dark. Just... sky.', 'Somebody tell me this isn\'t a simulation.',
];
const RIFT_GAWK_SAY = {
  adult: ['Bless my buttons, what is that?', 'The sky\'s come unstitched!', 'Don\'t touch it. It might bite.', 'It hums, like bees in a jar.', 'Well I never. A hole in the air!'],
  kid: ['Ooh, it\'s all sparkly!', 'Can I go through? Can I?', 'It\'s purple! And blue! And purple!', 'Is it a door? Where does it go?'],
};

function placeName(x, y) {
  let best = null, bd = 220;
  for (const h of World.homes) if (h.built) { const d = dist(h.doorX, h.doorY, x, y); if (d < bd) { bd = d; best = 'by ' + h.name; } }
  for (const k in World.buildings) { const b = World.buildings[k]; const d = dist(b.stepX, b.stepY, x, y); if (d < bd) { bd = d; best = 'near ' + b.name.replace(/^the /, 'the '); } }
  if (best) return best;
  if (Math.hypot(x / 16 - PARTY.cx, y / 16 - PARTY.cy) < 16) return 'over the party field';
  return Math.abs(y / 16 - RIVER_Y(x / 16)) < 8 ? 'down by the river' : 'out in the fields';
}

// A spot of open, reachable ground for a rift: not on anyone's doorstep.
function riftSpot() {
  for (let tries = 0; tries < 600; tries++) {
    const near = tries < 400;
    const tx = near ? Math.round(TOWN_CENTRE.x + R.f(-38, 38)) : R.i(8, 112), ty = near ? Math.round(TOWN_CENTRE.y + R.f(-28, 28)) : R.i(8, 88);
    if (!inMap(tx, ty) || tx < 6 || tx > 114 || ty < 6 || ty > 90) continue;
    const t = tileAt(tx, ty);
    if (t !== T.GRASS && t !== T.LAWN) continue;
    let ok = true;
    for (let j = -3; j <= 1 && ok; j++) for (let i = -2; i <= 2; i++) if (!walkable(tx + i, ty + j)) { ok = false; break; }
    if (!ok) continue;
    const x = tx * 16 + 8, y = ty * 16 + 12;
    if (World.homes.some((h) => dist(h.doorX, h.doorY, x, y) < 70)) continue;
    if (World.rifts.some((r) => dist(r.x, r.y, x, y) < 200)) continue;
    if (!findPath(tx, ty, PLAZA.cx, PLAZA.cy + 1)) continue;
    return { x, y };
  }
  return null;
}

function riftOpen() { return World.rifts.some((r) => !r.closing && r.a > 0.3); }

// ---------------------------------------------------------------------------
// Curious but cautious. While the Riftfolk are new, hill-folk watch them from
// a safe distance, whisper about them and make their excuses when one comes
// over to say hello. The bold and sociable go and introduce themselves, and
// make the first friendships. The novelty wears off over a fortnight or so,
// and anyone with a rift-born friend stops being wary.
// ---------------------------------------------------------------------------
function riftNovelty() {
  const first = Game.stats.firstRiftDay;
  if (first == null) return 1;
  return clamp(1 - (Game.day - first) / 14, 0.12, 1);
}
// A new tear in the sky is thrilling; the tenth, less so.
function riftSpectacle() { return clamp(1.15 - ((Game.stats.rifts || 1) - 1) * 0.15, 0.3, 1.15); }
function boldness(v) { return v.genes.bravery * 0.6 + v.genes.sociability * 0.25 + v.genes.curiosity * 0.15; }
function hasRiftFriend(v) { return Game.villagers.some((o) => o.isRiftborn() && (v.rel[o.id] || 0) > 0.4); }
function riftWary(v) {
  if (v.isRiftborn() || v.tech >= RIFT_TIERS[0] || v.stage === 'baby') return 0;
  if (hasRiftFriend(v)) return 0;
  return riftNovelty() * clamp(1.2 - boldness(v) * 1.35, 0, 1);
}

const RIFT_WATCH_SAY = {
  adult: ['Don\'t stare. But do look at that hair!', 'Is that eye... glowing?', 'They seem harmless enough. Probably.', 'What do you suppose they eat?', 'Keep your voice down, they\'ll hear.', 'I\'ll say hello tomorrow. Maybe.'],
  kid: ['Mum says not to stare.', 'Is it a robot? Is it?', 'I bet she can see in the dark!', 'Psst! Look at his eye!'],
};
const RIFT_NOTICE_SAY = ['Hey! I don\'t bite.', 'Hello there! You can come closer.', 'Ping! I mean... hello!', 'Morning! Nice village you have.'];
const RIFT_STARTLED_SAY = {
  adult: ['Eep! Er, good morning!', 'Oh! I was just... admiring the weather.', 'Must dash, the kettle\'s on!', 'Bless me! Hello! Goodbye!'],
  kid: ['Eek!', '*runs off giggling*', 'It talked to me!'],
};
const RIFT_BRAVE_HELLO = ['Hello! I\'m {me}. Welcome to Thistledown!', 'Well met! Is that eye real? Sorry, rude of me.', 'Hello! Fancy a cup of tea? We do a lovely cup of tea.', 'You must be from the rift! Tell me everything.'];
const RIFT_HELLO_BACK = ['Real enough. You\'re the first to say hello properly.', 'Tea? I\'ve read about tea! Yes please.', 'Everything? That\'ll take a while. Got a bench?', 'Nice to meet you, {name}. Ping. That means hello.'];
const RIFT_SHY_SAY = ['Oh! Er, must dash, the kettle\'s on!', 'Can\'t stop, sorry! Lovely... visor.', 'Ah! Er, another time perhaps!'];
const RIFT_SHUNNED_SAY = ['...Was it something I said?', 'Huh. Maybe next time.', 'Note to self: smile more, glow less.'];

// The nearest rift-born a wary villager might keep an eye on.
function watchTarget(v) {
  let best = null, bd = 22 * 16;
  for (const o of Game.villagers) {
    if (!o.isRiftborn() || o.inside || o.leaving || o.carried || o.stage === 'baby' || (v.rel[o.id] || 0) > 0.35) continue;
    const d = dist(o.x, o.y, v.x, v.y);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

// Bold folk seek the newcomers out; the wary steer clear, for now.
function riftChatBias(v, o) {
  if (v.isRiftborn() === o.isRiftborn() || o.stage === 'baby' || v.stage === 'baby') return 0;
  const hill = v.isRiftborn() ? o : v;
  const nov = riftNovelty();
  if (hasRiftFriend(hill) && (hill.rel[(hill === v ? o : v).id] || 0) > 0.4) return 0;
  return nov * (boldness(hill) - 0.5) * 1.6;
}

// When a rift-born comes over to talk, a wary villager may make an excuse.
function riftShy(a, b) {
  const [rift, hill] = a.isRiftborn() && !b.isRiftborn() ? [a, b] : b.isRiftborn() && !a.isRiftborn() ? [b, a] : [null, null];
  if (!rift || hill !== b) return false;
  if ((hill.rel[rift.id] || 0) > 0.3 || !R.chance(riftWary(hill) * 0.75)) return false;
  hill.say(R.pick(hill.isChild() ? RIFT_STARTLED_SAY.kid : RIFT_SHY_SAY), 3);
  rift.say(R.pick(RIFT_SHUNNED_SAY), 3);
  rift.cool.chat = Game.time + 25;
  hill.remember(`One of the rift-folk, ${rift.first}, tried to talk to me. I made my excuses.`, 0);
  return true;
}

// A conversation between hill and rift: the first one is a proper introduction.
function riftMeeting(a, b) {
  if (a.isRiftborn() === b.isRiftborn() || a.stage === 'baby' || b.stage === 'baby') return;
  const [rift, hill] = a.isRiftborn() ? [a, b] : [b, a];
  const met = hill.stats.riftMet || (hill.stats.riftMet = []);
  const nov = riftNovelty(), bold = boldness(hill);
  if (!met.includes(rift.id)) {
    met.push(rift.id);
    hill.say(fillLine(hill, R.pick(RIFT_BRAVE_HELLO).replace('{me}', hill.first), { name: rift.first }), 4);
    // the reply comes as the conversation's next line
    const lead = a.task && a.task.data && a.task.data.leader ? a.task.data : null;
    if (lead) { lead.reply = { who: rift, to: hill, text: fillLine(rift, R.pick(RIFT_HELLO_BACK), { name: hill.first }) }; lead.talkT = 5; }
    hill.remember(`Met ${rift.first}, one of the rift-folk. ${bold > 0.55 ? 'Fascinating!' : 'Nicer than I expected.'}`, 1);
    rift.remember(`${hill.first} came and said hello. Friendly lot, the hill-folk.`, 1);
    // the bold hit it off; the wary are polite but stiff
    hill.bond(rift, nov * (bold > 0.55 ? 0.16 : 0.05));
    const n = Game.stats.riftHellos = (Game.stats.riftHellos || 0) + 1;
    if (n === 1) chronicle(`${hill.first} marched straight up to ${rift.first} and said hello, the first of the hill-folk to do it. Half the village watched from behind their curtains.`, 'rift');
  }
  const f = hill.rel[rift.id] || 0;
  const friends = hill.stats.riftFriends || (hill.stats.riftFriends = []);
  if (f > 0.4 && !friends.includes(rift.id)) {
    friends.push(rift.id);
    const n = Game.stats.riftFriendships = (Game.stats.riftFriendships || 0) + 1;
    hill.remember(`${rift.first} from the rift is a real friend now.`, 2);
    rift.remember(`${hill.first} is my first real friend here.`, 2);
    if (n <= 3) chronicle(n === 1 ? `${hill.first} and ${rift.first} have become fast friends: a hill-hobbit and one of the rift-folk, swapping stories on a bench. The village is talking.` : `${hill.first} has struck up a friendship with ${rift.first} from the rift.`, 'rift');
  }
}

function openRift(byPlayer = false) {
  if (World.rifts.length) return { ok: false, msg: 'A rift is already open. One tear in the sky at a time!' };
  const spot = riftSpot();
  if (!spot) return { ok: false, msg: 'The air won\'t tear just now. Try again later.' };
  const room = MAX_POP - Game.villagers.length;
  // fewer come through when the larders are bare
  const food = Village.foodTotal() + Village.stores.grain / 4, pop = Game.villagers.length;
  const lean = food < pop || World.season === 'winter';
  const crew = Math.max(0, Math.min(room - 1, food < pop * 0.4 ? 0 : lean ? 1 : R.weighted([[4, 1], [3, 2], [1, 3]])));
  const r = { x: spot.x, y: spot.y, born: Game.time, life: R.f(150, 260), a: 0, crew, sent: 0, nextOut: R.f(18, 30), seed: R.i(0, 9999), place: placeName(spot.x, spot.y) };
  World.rifts.push(r);
  Game.stats.rifts = (Game.stats.rifts || 0) + 1;
  const first = Game.stats.rifts === 1;
  chronicle(first
    ? `The air ${r.place} has torn open! A crackling seam of violet light hangs over the grass, humming like a hive, and shapes are moving on the other side.`
    : `Another rift has opened ${r.place}.${crew ? ' Someone is stepping through!' : ' Nobody comes through this time, only a glitter of strange salvage.'}`, 'rift');
  for (const v of Game.villagers) {
    if (v.inside || v.stage === 'baby' || v.isRiftborn() || dist(v.x, v.y, r.x, r.y) > 170) continue;
    v.say(R.pick(v.isChild() ? RIFT_GAWK_SAY.kid : RIFT_GAWK_SAY.adult), 4);
    v.remember(first ? 'Saw the sky tear open. I\'ll not forget that in a hurry.' : 'Saw another rift open.', 0);
  }
  if (typeof Sound !== 'undefined') Sound.whoosh();
  if (byPlayer) Game.lastRiftByPlayer = Game.day;
  return { ok: true, r };
}

// A Riftfolk newcomer steps out of the light.
function arriveFromRift(r) {
  if (Game.villagers.length >= MAX_POP) return null;
  r.sent++;
  if (Game.stats.firstRiftDay == null) Game.stats.firstRiftDay = Game.day;
  // a crew often includes a pair, so they have someone to court
  const sex = r.lastSex && R.chance(0.6) ? (r.lastSex === 'f' ? 'm' : 'f') : (R.chance(0.5) ? 'f' : 'm');
  r.lastSex = sex;
  const home = emptiestHome();
  const v = new Villager({
    genes: riftGenes(sex), first: riftName(sex), surname: R.pick(RIFT_SURNAMES), age: R.f(CHILD_DAYS + 1, 17), homeId: home.id,
    x: r.x, y: r.y + 4, born: Game.day, pouch: 0, tech: 1, visor: R.chance(0.5),
  });
  v.edu = R.f(0.4, 0.85);
  for (const s of SKILLS) v.skills[s] = R.f(0, 15) * v.genes.apt[s];
  v.skills.tinkering = R.f(12, 30);
  v.drives.bored = 0;
  v.lost = 1;
  v.remember('Stepped through a rift into a green, quiet world with no signal at all. Where am I?', -1);
  Game.villagers.push(v);
  // the rift-born stick together; hill-folk are wary but kindly
  for (const o of Game.villagers) if (o !== v) { const k = o.isRiftborn() ? 0.45 : 0.05; o.rel[v.id] = k; v.rel[o.id] = k; }
  v.say(R.pick(RIFT_ARRIVE_SAY), 6);
  v.begin({ ...ACTIONS.stroll, target: () => ({ x: PLAZA.cx * 16, y: (PLAZA.cy + 1) * 16, facing: 'down' }) }, Game.hour);
  for (const col of ['#c050ff', '#5af8ff']) FX.sparkle(r.x, r.y - 20, col);
  assignJobs(true);
  const eye = expressed(v.genes).chrome ? ', one eye glinting chrome' : v.visor ? ', a glowing visor over their eyes' : '';
  chronicle(`${v.name()} stepped out of the rift, blinking at the sunshine${eye}. ${v.pron.They} has been given a bed in ${home.name}.`, 'rift');
  return v;
}

function updateRifts(dtMin) {
  if (!Game.riftNext) Game.riftNext = Game.time + R.f(400, 1200);
  if (Game.time >= Game.riftNext) {
    if (Village.riftsOn && Game.villagers.length) openRift();
    Game.riftNext = Game.time + 1440 * R.f(1.6, 3.2);
  }
  for (const r of World.rifts) {
    const age = Game.time - r.born;
    if (!r.closing) r.a = Math.min(1, r.a + dtMin / 20);
    r.nextOut -= dtMin;
    if (!r.closing && r.a >= 1 && r.sent < r.crew && r.nextOut <= 0) { if (!arriveFromRift(r)) r.crew = r.sent; r.nextOut = R.f(15, 35); }
    if (!r.closing && age > r.life && r.sent >= r.crew) r.closing = true;
    if (r.closing) {
      r.a -= dtMin / 15;
      if (r.a <= 0) {
        r.gone = true;
        if (r.home) { chronicle('The golden rift has folded quietly shut. The way home is closed again, for now.', 'rift'); continue; }
        const stock = R.i(3, 6);
        World.riftScars.push({ x: r.x, y: r.y, stock, seed: r.seed });
        // old scars grass over in time
        if (World.riftScars.length > 4) World.riftScars.shift();
        chronicle(`The rift ${r.place} has snapped shut with a sound like a cork leaving a bottle. It's left a glittering scar in the grass, strewn with strange salvage.`, 'rift');
      }
    }
  }
  if (World.rifts.some((r) => r.gone)) World.rifts = World.rifts.filter((r) => !r.gone);
}

// ---------------------------------------------------------------------------
// Rift ways spreading
// ---------------------------------------------------------------------------
function shiftWays(v, d) {
  if (!d || v.stage === 'baby') return;
  const before = v.techTier;
  v.tech = clamp(v.tech + d, 0, 1);
  // the rift-born never quite lose the knack
  if (v.isRiftborn()) v.tech = Math.max(v.tech, 0.5);
  const t = techTier(v.tech);
  if (t === before) return;
  if (t >= 2 && !v.visor && v.isGrown() && R.chance(0.35)) v.visor = true;
  v.refreshSprites();
  techMilestone(v, before, t);
}

// Talking it over: the less rift-minded of the two picks up a little, and
// the more rift-minded softens a touch towards hill-folk ways.
function shareWays(a, b) {
  if (a.stage === 'baby' || b.stage === 'baby') return;
  const gap = Math.abs(a.tech - b.tech);
  if (gap < 0.02) return;
  const [hi, lo] = a.tech > b.tech ? [a, b] : [b, a];
  const open = (0.35 + lo.genes.curiosity * 0.8) * (lo.isChild() ? 1.8 : lo.stage === 'elder' ? 0.4 : 1) * (0.7 + Math.max(0, lo.rel[hi.id] || 0));
  shiftWays(lo, gap * 0.02 * open);
  shiftWays(hi, -gap * 0.0035 * (0.5 + hi.genes.sociability * 0.5));
}

function techMilestone(v, before, after) {
  const T2 = v.pron;
  if (v.isRiftborn()) {
    if (after < before) { chronicle(`${v.first} has swapped the synth-weave for a good wool waistcoat. The hill-folk ways are growing on ${T2.them}.`, 'rift'); v.remember('Traded my synth-weave for wool. Comfier, honestly.', 1); }
    return;
  }
  if (after > before) {
    // the first few converts make the news; after that it's just how things are
    const n = Game.stats['riftTier' + after] = (Game.stats['riftTier' + after] || 0) + 1;
    const kind = n <= 4 ? 'rift' : 'info';
    if (after === 1) {
      chronicle(v.isChild() ? `Little ${v.first} has started wearing a strip of neon and saying "ping" instead of hello.` : `${v.first} has taken to wearing a strip of neon, and calls the Relay "the net".${n === 1 ? ' The rift ways are catching on.' : ''}`, kind);
      v.remember('Started wearing a bit of neon. It suits me.', 1);
    } else {
      chronicle(`${v.first} has gone thoroughly rift: synth-weave jacket, glowing trim${v.visor ? ', a visor' : ''}, and talk of uplinks over second breakfast.`, kind);
      v.remember('Went all in on the rift ways.', 1);
    }
  } else if (after === 0) v.remember('Put the neon away. Wool and a pipe will do me.', 0);
}

function riftAdults() { return Game.villagers.filter((v) => v.isGrown() && v.isRiftborn() && !v.leaving).length; }
function techFolk() { return Game.villagers.filter((v) => v.tech >= RIFT_TIERS[0] && !v.leaving && v.stage !== 'baby').length; }
// The share of hill-folk who've taken up rift ways.
function riftShare() {
  const hill = Game.villagers.filter((v) => !v.isRiftborn() && v.stage !== 'baby' && !v.leaving);
  return hill.length ? hill.filter((v) => v.tech >= RIFT_TIERS[0]).length / hill.length : 0;
}

// The nightly round: households rub off on their members, neon homes on
// those who live in them, and the tinkers decide which hole to wire up next.
function dailyRifts() {
  settleLost();
  if (Game.stats.firstRiftDay == null && Game.villagers.some((v) => v.isRiftborn())) Game.stats.firstRiftDay = Game.day - 3;
  for (const h of World.homes) {
    if (!h.built) continue;
    const res = residentsOf(h).filter((v) => v.stage !== 'baby');
    if (!res.length) continue;
    const mean = res.reduce((s, v) => s + v.tech, 0) / res.length;
    for (const v of res) {
      shiftWays(v, (mean - v.tech) * (v.isChild() ? 0.25 : 0.05));
      if (h.neon && !v.isRiftborn()) shiftWays(v, 0.012 * (1 - v.tech));
    }
  }
  planRetrofits();
  const share = riftShare(), marks = Game.stats.riftMarks || (Game.stats.riftMarks = []);
  for (const [m, text] of [[0.1, 'A few hill-folk have taken up rift ways: neon trim on waistcoats, and talk of "signal" at the inn.'], [0.25, 'A quarter of the hill-folk have taken up rift ways. The old folk mutter into their pipes, but the young ones love it.'], [0.5, 'Half the hill-folk have gone rift-minded! Visors at the market, neon on the doorsteps, and "ping" is how you say hello now.'], [0.75, 'Rift ways are simply the village\'s ways now. Hardly anyone remembers it was ever otherwise.']]) {
    if (share >= m && !marks.includes(m)) { marks.push(m); chronicle(text, 'rift'); }
  }
}

// ---------------------------------------------------------------------------
// Neon homes: tinkers retrofit hobbit-holes whose families have gone rift
// ---------------------------------------------------------------------------
function planRetrofits() {
  const tinkers = Game.villagers.filter((v) => v.job === 'tinker').length;
  if (!tinkers || (Village.stores.scrap || 0) < 4) return;
  const open = Village.projects.filter((p) => p.kind === 'retrofit').length;
  if (open >= 1 + Math.floor(tinkers / 3)) return;
  const cand = World.homes.filter((h) => h.built && !h.neon && !Village.projects.some((p) => p.kind === 'retrofit' && p.homeId === h.id))
    .map((h) => { const rs = residentsOf(h).filter((v) => v.stage !== 'baby'); return [h, rs.length ? rs.reduce((s, v) => s + v.tech, 0) / rs.length : 0]; })
    .filter(([, m]) => m >= 0.45).sort((a, b) => b[1] - a[1])[0];
  if (!cand) return;
  const h = cand[0];
  Village.projects.push({ kind: 'retrofit', homeId: h.id, prog: 0 });
  chronicle(`The tinkers are fitting ${h.name} with neon, a sky-dish and a sun-glass panel. The family can't wait.`, 'build');
}
function finishRetrofit(h, v) {
  h.neon = true;
  chronicle(`${h.name} has been retrofitted! Its round door glows at night, and a little dish on the roof blinks red.`, 'build');
  if (v) v.remember(`Wired up ${h.name}.`, 2);
  for (const o of residentsOf(h)) if (!o.isRiftborn()) o.remember('Our hole got a neon makeover.', 1);
}

// Can this villager lend a hand on this project?
function canWorkProject(v, p) {
  if (p.kind === 'field' || !projectReady(p)) return false;
  if (p.kind === 'retrofit') return v.job === 'tinker';
  return true;
}

// ---------------------------------------------------------------------------
// Lost, and looking for the way home. The rift-born arrive bewildered and
// homesick. Together they study the rifts, the scars and (once it's up) the
// Relay, pooling what they learn. When they crack it, a steady golden rift
// opens and each of them must choose: home, or the friends and family they've
// made here. Each later attempt is harder, as the old frequencies drift.
// ---------------------------------------------------------------------------
const RIFT_LOST_SAY = {
  adult: [
    'Which sector is this? Nobody here has heard of the sectors.', 'Where are the towers? Where is... anything?', 'I keep reaching for my feed. There is no feed.',
    'If I find the frequency, I can get back. I have to get back.', 'Is this tree a hologram? It doesn\'t flicker.', 'Somebody back home is wondering where I went.',
    'The sky\'s the wrong colour. Too blue. Too much of it.', 'Excuse me, which way to the city? ...What do you mean, what city?',
  ],
  kid: ['I want to go home.', 'Where\'s our flat? Where\'s the lift?', 'Are we lost? We\'re lost, aren\'t we.'],
};
const RIFT_SEEK_SAY = [
  'Hold the sensor steady!', 'Same signature as the night we came through.', 'If we match the frequency, it should open.', 'Anyone remember the coordinates for home?',
  'Write it down, before it drifts!', 'Almost had it. Again!', 'It hums in threes. Did you notice? Threes.', 'Together, on my count.',
];
function lostWord(v) {
  const l = v.lost || 0;
  return l > 0.7 ? 'Utterly lost, and desperate to go home' : l > 0.4 ? 'Homesick, and hunting for a way back' : l > 0.15 ? 'Settling in, mostly' : 'This is home now';
}
// Who's looking for the way back, and where they meet to work on it.
function homeSeekers() { return Game.villagers.filter((v) => v.isRiftborn() && v.isGrown() && !v.leaving && (v.lost || 0) > 0.25); }
function seekSite() {
  const open = World.rifts.find((r) => r.a > 0.6 && !r.closing && !r.home);
  if (open) return { x: open.x, y: open.y, name: 'the open rift', boost: 3 };
  if (World.buildings.relay) return { x: World.buildings.relay.stepX, y: World.buildings.relay.stepY + 4, name: 'the Relay Mast', boost: 1.5 };
  const s = World.riftScars[World.riftScars.length - 1];
  if (s) return { x: s.x, y: s.y, name: 'the rift scar ' + placeName(s.x, s.y), boost: 1 };
  return null;
}

// Each night the homesick settle in a little, faster with a spouse, children and friends.
function settleLost() {
  for (const v of Game.villagers) {
    if (!v.isRiftborn() || !(v.lost > 0)) continue;
    const friends = Game.villagers.filter((o) => !o.isRiftborn() && (v.rel[o.id] || 0) > 0.4).length;
    const kids = Game.villagers.some((o) => o.parents.includes(v.id));
    v.lost = Math.max(0, v.lost - 0.035 - (v.spouse ? 0.05 : 0) - (kids ? 0.04 : 0) - Math.min(3, friends) * 0.015);
  }
}

function wayHomeProgress(amount) {
  const before = Village.wayHome || 0;
  Village.wayHome = Math.min(1, before + amount);
  const site = seekSite();
  const where = site ? site.name : 'the rift scars';
  for (const [m, text] of [
    [0.2, `The rift-folk have started meeting at ${where} with their blinking gadgets, night after night. They're trying to find a way home.`],
    [0.5, 'The rift-folk think they\'re onto something: the rifts hum on a frequency, and they\'ve caught it twice now. There\'s a lot of excited muttering.'],
    [0.8, `Sparks and shouting at ${where}! The rift-folk say they can almost hold a door open. Almost.`],
  ]) if (before < m && Village.wayHome >= m) chronicle(text, 'rift');
  if (Village.wayHome >= 1 && !World.rifts.some((r) => r.home)) openHomeRift();
}

// The way home opens. Everyone rift-born must decide.
function openHomeRift() {
  const site = seekSite() || { x: PLAZA.cx * 16 + 8, y: (PLAZA.cy + 3) * 16 };
  const spot = World.rifts.some((r) => !r.home && dist(r.x, r.y, site.x, site.y) < 40) ? { x: site.x + 60, y: site.y } : site;
  const t = nearestWalkable(Math.floor(spot.x / 16), Math.floor(spot.y / 16));
  const r = { x: t ? t[0] * 16 + 8 : spot.x, y: t ? t[1] * 16 + 12 : spot.y, born: Game.time, life: 240, a: 0, crew: 0, sent: 0, nextOut: 1e9, seed: R.i(0, 9999), place: placeName(spot.x, spot.y), home: true };
  World.rifts.push(r);
  Village.wayHome = 0;
  Village.wayHomeTries = (Village.wayHomeTries || 0) + 1;
  chronicle(`The rift-folk have done it! A steady, golden-edged rift hangs ${r.place}, and through it, faint and far, the lights of their city. Now each of them has to choose.`, 'rift');
  const rb = Game.villagers.filter((v) => v.isRiftborn() && !v.leaving);
  const decided = new Map();
  // ties to the village: a spouse, children, friends, and time spent settling in
  const ties = (v) => {
    const sp = Game.villagers.find((o) => o.id === v.spouse);
    let t = (1 - (v.lost || 0)) * 1.6;
    if (sp && !sp.isRiftborn()) t += 1.6;
    if (Game.villagers.some((o) => o.parents.includes(v.id) && !o.isRiftborn())) t += 1.6;
    t += Math.min(3, Game.villagers.filter((o) => !o.isRiftborn() && (v.rel[o.id] || 0) > 0.4).length) * 0.35;
    return t;
  };
  for (const v of rb) {
    if (decided.has(v.id) || !v.isGrown()) continue;
    const sp = rb.find((o) => o.id === v.spouse);
    const t = sp ? (ties(v) + ties(sp)) / 2 : ties(v);
    const pGo = clamp(0.85 - t * 0.32, 0.03, 0.9), go = R.chance(pGo);
    decided.set(v.id, go); if (sp) decided.set(sp.id, go);
  }
  // little ones go where their parents go
  for (const v of rb) if (!v.isGrown()) decided.set(v.id, v.parents.some((p) => decided.get(p)));
  const going = rb.filter((v) => decided.get(v.id)), staying = rb.filter((v) => !decided.get(v.id));
  for (const v of going) goHome(v, r);
  for (const v of staying) {
    v.lost = 0;
    v.remember('The way home opened. I looked through for a long while... and stayed.', 2);
  }
  // who they turned back for: a hill-folk spouse, or their dearest hill-folk friend
  const anchor = (v) => {
    const sp = Game.villagers.find((o) => o.id === v.spouse && !o.isRiftborn());
    if (sp) return sp.first;
    const f = Object.entries(v.rel).filter(([id]) => Game.villagers.some((o) => o.id === +id && !o.isRiftborn())).sort((a, b) => b[1] - a[1])[0];
    return f && f[1] > 0.3 ? Game.villagers.find((o) => o.id === +f[0]).first : null;
  };
  const told = new Set(), st = [];
  for (const v of staying.filter((x) => x.isGrown())) {
    if (told.has(v.id) || st.length >= 2) continue;
    told.add(v.id);
    const sp = staying.find((o) => o.id === v.spouse);
    const a = anchor(v);
    if (sp) { told.add(sp.id); st.push(`${v.first} and ${sp.first} looked through together for a long moment, then turned away, hand in hand. "This is home now."`); }
    else st.push(a ? `${v.first} looked through for a long moment, then turned back to ${a}. "This is home now."` : `${v.first} stayed, too.`);
  }
  if (going.length) chronicle(`${going.map((v) => v.first).join(', ').replace(/, ([^,]*)$/, ' and $1')} ${going.length > 1 ? 'have' : 'has'} gone home through the golden rift. ${st.join(' ')}`.trim(), 'rift');
  else if (staying.length) chronicle(`Not one of the rift-folk stepped through. ${st.join(' ')}`.trim(), 'rift');
}

function goHome(v, r) {
  v.abort();
  if (v.inside) v.exitBuilding();
  v.queue = [];
  archivePerson(v, 'home');
  v.leaving = 'home';
  v.say(R.pick(['Goodbye, hill-folk. Thank you.', 'I\'ll never forget the bread.', 'Home. Finally.', 'Keep the kettle warm for me.']), 5);
  v.repathTo(r.x, r.y + 2);
  for (const o of Game.villagers) {
    if (o === v || o.leaving) continue;
    if ((o.rel[v.id] || 0) > 0.4) { o.remember(`Waved ${v.first} off through the golden rift, home to the city.`, -1); o.drives.lonely = Math.min(1, o.drives.lonely + 0.25); }
  }
}

// ---------------------------------------------------------------------------
// Drawing: the rift itself, the scars it leaves, and neon homes
// ---------------------------------------------------------------------------
function drawRift(ctx, r, t) {
  const a = clamp(r.a, 0, 1);
  if (a <= 0) return;
  const alpha0 = ctx.globalAlpha;
  ctx.save(); ctx.scale(1 / RS, 1 / RS);
  // drawn in half-pixels: rows of light, two to every world pixel
  const H = Math.round(46 * a * RS), W = 9 * a * RS;
  const x = Math.round(r.x * RS), base = Math.round(r.y * RS);
  // a soft violet glow on the grass beneath
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.3 * a * alpha0;
  ellipseFill(ctx, x, base - 2, 20 * a * RS, 5 * a * RS, '#9a40ff');
  ctx.globalAlpha = 0.25 * a * alpha0;
  ellipseFill(ctx, x, base - 2, 11 * a * RS, 3 * a * RS, '#40e0ff');
  ctx.globalAlpha = alpha0; ctx.globalCompositeOperation = 'source-over';
  const glitch = hash2(Math.floor(t * 7), r.seed) > 0.8 ? Math.round((hash2(Math.floor(t * 7), r.seed + 1) - 0.5) * 16) : 0;
  const gRow = Math.floor(hash2(Math.floor(t * 7), r.seed + 2) * H);
  for (let j = 0; j < H; j++) {
    const k = j / H;
    let half = Math.sin(Math.PI * k) * W + Math.sin(t * 9 + j * 0.4 + r.seed) * 1.6;
    if (half < 1) half = 1;
    const off = Math.abs(j - gRow) < 6 ? glitch : 0;
    const y = base - 8 - H + j, hw = Math.round(half);
    ctx.fillStyle = r.home ? '#ffc840' : '#c050ff'; ctx.fillRect(x - hw - 2 + off, y, hw * 2 + 5, 1);
    ctx.fillStyle = r.home ? '#fff4c0' : '#5af8ff'; ctx.fillRect(x - hw - 1 + off, y, hw * 2 + 3, 1);
    ctx.fillStyle = r.home ? '#1a1030' : '#0c0618'; ctx.fillRect(x - hw + off, y, hw * 2 + 1, 1);
    // the city on the far side of a homeward rift
    if (r.home && j > H * 0.45 && hash2(Math.floor((x + off) / 2), j) > 0.6) { ctx.fillStyle = (j + Math.floor(t * 2)) % 7 ? '#ff3aa8' : '#3af0ff'; ctx.fillRect(x - Math.floor(hw * 0.7) + (j * 3) % Math.max(1, hw * 1.4 | 0) + off, y, 1, 1); }
    // stars on the far side
    for (let i = -hw; i <= hw; i++) {
      const h = hash2(i * 13 + r.seed, j * 7 + Math.floor(t * 3));
      if (h > 0.975) { ctx.fillStyle = h > 0.993 ? '#ffffff' : h > 0.985 ? '#ff6ac8' : '#6af0ff'; ctx.fillRect(x + i + off, y, 1, 1); }
    }
  }
  ctx.restore();
}

function drawRiftScar(ctx, s) {
  ctx.save(); ctx.scale(1 / RS, 1 / RS);
  const x = Math.round(s.x * RS), y = Math.round(s.y * RS);
  // a jagged crack in the turf, glinting violet now and then
  for (let i = -20; i <= 20; i++) {
    const yy = y - 4 + Math.round(Math.sin(i * 0.45 + s.seed) * 3);
    ctx.fillStyle = '#2a1a3a'; ctx.fillRect(x + i, yy, 1, 2);
    if (hash2(i + s.seed, Math.floor(tReal * 2)) > 0.85) { ctx.fillStyle = '#c050ff'; ctx.fillRect(x + i, yy - 1, 1, 1); }
  }
  // scattered salvage: bits of grey metal and glowing glass
  for (let k = 0; k < s.stock * 3; k++) {
    const dx = Math.round((hash2(k, s.seed) - 0.5) * 60), dy = Math.round((hash2(s.seed, k) - 0.5) * 20);
    ctx.fillStyle = k % 3 ? '#8a9098' : '#3af0ff'; ctx.fillRect(x + dx, y + dy, 3, k % 2 + 2);
    if (k % 3) { ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x + dx, y + dy, 2, 1); }
  }
  ctx.restore();
}

// A neon arch round the round door; drawn again over the night shade so it glows.
function drawNeonArch(ctx, h, alpha = 1) {
  ctx.save(); ctx.scale(1 / RS, 1 / RS);
  const K = RS, r = h.doorR * K, x = h.doorX * K, y = (h.doorY - h.doorR - 1) * K;
  const n1 = NEON_COLS[h.id % NEON_COLS.length], n2 = NEON_COLS[(h.id + 2) % NEON_COLS.length];
  const R2 = r + 11;
  ctx.globalAlpha = alpha * (0.75 + 0.25 * Math.sin(tReal * 2 + h.id));
  for (let k = 0; k <= 48; k++) {
    const ang = Math.PI + (k / 48) * Math.PI;
    ctx.fillStyle = Math.floor(k / 5 + tReal * 2) % 4 ? n1 : n2;
    ctx.fillRect(Math.round(x + Math.cos(ang) * R2) - 1, Math.round(y + Math.sin(ang) * R2) - 1, 2, 2);
  }
  ctx.fillStyle = n1; ctx.fillRect(x - R2 - 1, y, 2, r + 2); ctx.fillRect(x + R2 - 1, y, 2, r + 2);
  ctx.globalAlpha = 1;
  ctx.restore();
}
function dishPos(h) {
  const d = h.def;
  return { x: Math.round(h.doorX - d.rx * 16 * 0.22), y: Math.round((d.cy + 0.5) * 16 - (d.ry * 16 - 8)) + 5 };
}

function drawNeonHome(ctx, h) {
  drawNeonArch(ctx, h);
  ctx.save(); ctx.scale(1 / RS, 1 / RS);
  const K = RS, d = h.def, R = (x0, y0, w, hh, col) => { ctx.fillStyle = col; ctx.fillRect(x0, y0, w, hh); };
  const n2 = NEON_COLS[(h.id + 2) % NEON_COLS.length];
  const pulse = 0.7 + 0.3 * Math.sin(tReal * 2 + h.id);
  // a sky-dish on the mound, blinking red
  const p = dishPos(h), dx = p.x * K, top = p.y * K;
  R(dx, top - 10, 2, 11, '#4a4e56'); R(dx - 4, top, 10, 2, '#4a4e56');
  R(dx - 8, top - 20, 13, 10, '#9aa0a8'); R(dx - 7, top - 21, 11, 2, '#d8dce4'); R(dx - 7, top - 19, 9, 6, '#c8ccd4'); R(dx - 8, top - 11, 13, 1, '#6a7078');
  R(dx - 1, top - 26, 2, 6, '#4a4e56');
  R(dx - 1, top - 28, 2, 2, Math.floor(tReal * 1.4 + h.id) % 2 ? '#ff4a4a' : '#7a2a2a');
  // a sun-glass panel on the slope
  const sx = Math.round((h.doorX + d.rx * 16 * 0.02) * K), sy = (p.y + 3) * K;
  R(sx - 2, sy - 2, 28, 14, '#26262e'); R(sx, sy, 24, 10, '#1e3a6a');
  for (let k = 1; k < 4; k++) R(sx + k * 6, sy, 1, 10, '#5a7ab0');
  R(sx, sy + 5, 24, 1, '#5a7ab0'); R(sx + 2, sy + 1, 4, 1, '#c8e0ff');
  if (World.season === 'winter') { R(sx - 2, sy - 4, 28, 2, '#f4f8ff'); R(dx - 7, top - 23, 11, 2, '#f4f8ff'); }
  // a little holo-plate with the house number
  const px = (h.doorX + h.doorR + 8) * K, py = (h.doorY - h.doorR - 3) * K;
  R(px, py, 14, 10, '#14141c');
  ctx.globalAlpha = pulse; R(px + 2, py + 2, 2, 6, n2); R(px + 6, py + 2, 6, 2, n2); R(px + 10, py + 4, 2, 4, n2); ctx.globalAlpha = 1;
  ctx.restore();
}

// Neon and rift-light drawn over the night shade, so they glow in the dark.
function drawRiftEmissive(ctx, cam) {
  const dk = Game.darkness;
  if (dk < 0.08) return;
  const seen = (x, y) => x > cam.x - 60 && x < cam.x + cam.w + 60 && y > cam.y - 40 && y < cam.y + cam.h + 80;
  for (const h of World.homes) if (h.built && h.neon && seen(h.doorX, h.doorY)) {
    drawNeonArch(ctx, h, dk * 0.85);
    const p = dishPos(h);
    if (Math.floor(tReal * 1.4 + h.id) % 2) { ctx.fillStyle = '#ff5a5a'; ctx.fillRect(p.x, p.y - 14, 1, 1); }
  }
  ctx.globalAlpha = dk * 0.55;
  for (const r of World.rifts) if (seen(r.x, r.y)) drawRift(ctx, r, tReal);
  ctx.globalAlpha = 1;
  for (const v of Game.villagers) {
    if (v.inside || v.carried || v.stage === 'baby' || !v._top || !seen(v.x, v.y)) continue;
    const ex = expressed(v.genes), ey = v._top + 8 / RS;
    const side = v.facing === 'left' || v.facing === 'right';
    if (v.facing === 'up') continue;
    // eye and visor positions on the double-resolution sprite (22 half-pixels wide with its outline)
    const X = (cx, w) => v._sx + (v._flip ? 22 - cx - w : cx) / RS;
    ctx.globalAlpha = dk * 0.9;
    if (v.visor && v.techTier >= 2) { ctx.fillStyle = ex.neon; if (side) ctx.fillRect(X(12, 7), ey, 7 / RS, 3 / RS); else ctx.fillRect(X(4, 14), ey, 14 / RS, 3 / RS); }
    else if (ex.chrome) { ctx.fillStyle = '#7af8ff'; if (side) ctx.fillRect(X(15, 1), ey, 1 / RS, 3 / RS); else ctx.fillRect(X(13, 2), ey, 2 / RS, 3 / RS); }
    ctx.globalAlpha = 1;
  }
}

// Glowing sparks drifting up out of an open rift (real time, on screen only).
function emitRiftFx(dt) {
  for (const r of World.rifts) {
    if (r.a < 0.2 || Math.random() > dt * 14 * r.a) continue;
    FX.add({ k: 'spark', x: r.x + R.f(-8, 8) * r.a, y: r.y - 4 - R.f(0, 44) * r.a, vx: R.f(-8, 8), vy: -R.f(6, 18), t: 0, life: R.f(0.6, 1.3), col: R.pick(['#c050ff', '#5af8ff', '#ff6ac8', '#ffffff']), g: -4, drag: 0.98, light: Math.random() < 0.3 });
  }
}

function riftLights(L) {
  for (const r of World.rifts) {
    const H = 46 * r.a;
    L.push({ x: r.x, y: r.y - H / 2, r: 90 * r.a * (0.95 + Math.sin(tReal * 6) * 0.05), a: 0.95, col: r.home ? '#ffb840' : '#b050ff' });
    L.push({ x: r.x, y: r.y - H / 2, r: 36 * r.a, a: 0.8, col: r.home ? '#fff0c0' : '#5af8ff' });
  }
  for (const s of World.riftScars) L.push({ x: s.x, y: s.y - 2, r: 16, a: 0.4, col: '#c050ff' });
  for (const h of World.homes) {
    if (!h.built || !h.neon) continue;
    L.push({ x: h.doorX, y: h.doorY - h.doorR, r: 26, a: 0.7, col: NEON_COLS[h.id % NEON_COLS.length] });
    if (Math.floor(tReal * 1.4 + h.id) % 2) L.push({ x: Math.round(h.doorX - h.def.rx * 16 * 0.22), y: Math.round((h.def.cy + 0.5) * 16 - (h.def.ry * 16 - 8)) - 5, r: 8, a: 0.8, col: '#ff4a4a' });
  }
  for (const v of Game.villagers) {
    if (v.inside || v.carried || v.stage === 'baby') continue;
    const ex = expressed(v.genes);
    if (v.visor && v.techTier >= 2) L.push({ x: v.x, y: v.y - 13, r: 10, a: 0.55, col: ex.neon });
    else if (ex.chrome) L.push({ x: v.x + (v.facing === 'left' ? -1 : 1), y: v.y - 13, r: 6, a: 0.6, col: '#6af8ff' });
    if (v.techTier >= 1) L.push({ x: v.x, y: v.y - 4, r: 7, a: 0.4, col: ex.neon });
  }
  const relay = World.buildings.relay;
  if (relay && Math.floor(tReal * 1.2) % 2) L.push({ x: relay.left + 36, y: relay.bottom - relay.h + 6, r: 22, a: 0.9, col: '#ff4a4a' });
}

// ---------------------------------------------------------------------------
// Rift-minded speech. Hill-folk speech lives in education.js; folk with rift
// ways slip into this talk more and more as they take them up.
// ---------------------------------------------------------------------------
const RIFT_LINES = {
  greet: { adult: ['Ping, {name}. Signal\'s good today.', 'Hey, {name}. You look very... analogue. In a good way.', 'Morning, {name}. Still no grid. Still not complaining.'], kid: ['Ping ping, {name}!', 'Hi {name}! Wanna see my blinky?'] },
  weather: { adult: ['Free light from the sky, all day, no subscription.', 'Back home the rain stung. This stuff tastes of clover.', 'Weather\'s running smooth today.'], kid: ['The sky\'s a big screen and it\'s showing clouds!'] },
  sunny: { adult: ['Sun\'s charging my panels and my mood.', 'Free light from the sky, all day, no subscription.'], kid: ['Sunshine! Full battery!'] },
  rain: { adult: ['Water falling out of the sky, unfiltered. Wild.', 'Back home the rain was acid. This stuff tastes of clover.'], kid: ['Rain! Is it safe? It\'s safe!'] },
  snow: { adult: ['Frozen static, falling slow. Pretty.', 'My circuits hate this. My heart doesn\'t.'], kid: ['Snow! It\'s like white noise you can catch!'] },
  hungry: { adult: ['Running on low battery. Is there {food}?', 'Real {food}, not printed paste. Point me at it.'], kid: ['My tummy says low battery!'] },
  thirsty: { adult: ['Need fluids. Ale counts, right?', 'Throat\'s dry as a server room.'] },
  tired: { adult: ['Need to power down for a cycle.', 'Battery at three per cent. Bed.'], kid: ['I need to recharge...'] },
  cold: { adult: ['Synth-weave doesn\'t hold heat like wool. Who knew?', 'My fingers have gone offline.'] },
  bored: { adult: ['No feeds, no net, no noise. I need a project.', 'Somebody give me something to take apart.'], kid: ['Bored! Can I take the kettle apart?'] },
  lonely: { adult: ['Signal\'s weak out here. Talk to me, someone.'] },
  happy: { adult: ['Best upgrade I ever had: this village.', 'Full uptime. Feeling good.', 'Zero lag, all day. Bliss.'], kid: ['I\'m at a hundred per cent!', 'Beep boop! Happy robot!'] },
  party: { adult: ['Lanterns, fiddles and nobody logging any of it. Best party protocol.', 'Tonight we dance like nobody\'s recording.'], kid: ['Party mode: on!'] },
  tipsy: { adult: ['Ale\'s a better patch than anything I ever ran.', 'Whoa. My gyros are off. Hic.'] },
  work: { adult: ['Every tool here\'s hand-made. Beautiful firmware.', 'Being a {job} is honest work. Like code, but with dirt.'] },
  building: { adult: ['Wood and turf, but solid. I\'ll add some glow.', '{building} wants a few cables, I reckon.'] },
  newhome: { adult: ['Moved into a hole in a hill. Zero rent. Maximum cosy.'] },
  love: { adult: ['{sweet} makes my heart rate do things my monitor would flag.'] },
  ourbaby: { adult: ['The little one already tugs at my cables.', 'Half hill, half rift, all trouble. Love it.'] },
  sick: { adult: ['System error. Sniffles.', 'Something\'s corrupted my sinuses.'], kid: ['I\'ve got a virus! A real one!'] },
  idle: {
    adult: ['No signal. Strangely peaceful.', 'Still can\'t believe trees are free.', 'Back home, a garden like this would be a corporate park.', 'I miss the city lights. A little. Not much.', 'Nobody here has ever been hacked. Imagine.'],
    kid: ['Beep boop! I\'m a robot!', 'My eye glows in the dark!', 'Race you to the Relay!'],
  },
  play: { kid: ['Let\'s play hackers and dragons!', 'Tag! You\'re offline!'] },
  gossip: { adult: ['Heard {other} jacked in last night. Hooked already.', '{other} asked if my eye was a marble.', '{other}\'s been asking about visors, you know.'] },
  reply: { adult: ['Copy that.', 'Acknowledged. I mean... quite right!', 'Ha! Logged.'], kid: ['Copy!'] },
  books: { adult: ['Read a paper book today. Paper! It doesn\'t even need charging.', 'Your libraries have no search bar, but they smell wonderful.', 'Found a map of this world. Hand-drawn. I\'m keeping it forever.'], kid: ['Books are like screens that never run out!'] },
  simple: { adult: ['Plain work, plain food, plain sky. Best patch ever.'] },
  school: { kid: ['The story oak is better than any feed!', 'I learned a hill-song AND a rift-song today!'] },
  explain: { adult: ['It\'s like a letter, {name}, only it flies through the air in a blink.', 'Think of the Relay as a very tall, very clever postie.', 'Light can carry words, if you ask it nicely.'] },
  court: { adult: ['You\'re the only signal I need, {name}.', 'My eye goes fuzzy when you\'re near. Might be a fault. Might be you.'] },
  quarrel: { adult: ['Back off, {name}, before I reboot you.', 'You\'re corrupting my calm, {name}.'] },
};
// How hill-folk talk about it all, and how they answer rift-talk they don't follow.
const RIFT_HILL_LINES = {
  rifttalk: {
    plain: ['Folk falling out of the sky now. Whatever next?', 'That rift lot don\'t smoke a pipe. Odd.', 'Glowing eyes! In my day we had candles.'],
    common: ['The rift-folk are nice enough, once you\'re used to the eyes.', 'Saw a lass with pink hair helping at the mill. Hard worker.', 'They say there are more of them where they came from.'],
    fine: ['A tear between worlds! I must write this down.', 'These rift-folk carry a whole library in their spectacles, apparently.', 'Their world sounds dreadfully loud. No wonder they like it here.'],
    child: ['The rift people have glowy eyes!', 'I want blue hair!', 'Vex let me hold a blinky thing!'],
    bright: ['If the rift is a door, where\'s the other side?', 'Light carries words! I want to learn how!'],
  },
  riftpuzzle: {
    plain: ['A what-link?', 'Didn\'t follow a word of that, but you seem pleased.', 'Is that a sort of cheese?'],
    common: ['Up-link? Is that like a chain?', 'You\'ll have to say that again, slower.', 'Bless me, I didn\'t follow that.'],
    fine: ['Fascinating. Do go on, and do explain.', 'I shall pretend I understood that.'],
    child: ['What\'s a signal? Can I have one?', 'Say it again! Say "reboot"!'],
  },
};
Object.assign(CHAT, RIFT_HILL_LINES);

function riftLine(v, topic, ctx) {
  if (v.stage === 'baby') return null;
  // the newly arrived can hardly talk of anything but where they are and how to get home
  if (v.isRiftborn() && (v.lost || 0) > 0.35 && R.chance(v.lost * 0.6) && !['court', 'quarrel', 'reply'].includes(topic)) return fillLine(v, R.pick(v.isChild() ? RIFT_LOST_SAY.kid : RIFT_LOST_SAY.adult), ctx);
  if (v.techTier === 0) return null;
  if (!R.chance(v.techTier >= 2 ? 0.75 : 0.3)) return null;
  const t = RIFT_LINES[topic];
  const list = t && (v.isChild() ? t.kid : t.adult);
  return list ? fillLine(v, R.pick(list), ctx) : null;
}

// ---------------------------------------------------------------------------
// Rift actions: tinkers' work, gadgets, jacking in at the Relay, and gawking
// ---------------------------------------------------------------------------
function salvageSite(v) {
  const sites = World.rifts.filter((r) => r.a > 0.5 && !r.closing && !r.home).map((r) => ({ x: r.x, y: r.y, rift: r }))
    .concat(World.riftScars.filter((s) => s.stock > 0).map((s) => ({ x: s.x, y: s.y, scar: s })));
  if (!sites.length) return null;
  sites.sort((a, b) => dist(a.x, a.y, v.x, v.y) - dist(b.x, b.y, v.x, v.y));
  return sites[0];
}
function nearSpot(x, y, r0, r1) {
  for (let k = 0; k < 12; k++) {
    const ang = R.f(0, Math.PI * 2), rr = R.f(r0, r1);
    const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr * 0.6 + 8;
    if (walkable(Math.floor(px / 16), Math.floor(py / 16))) return { x: px, y: py, facing: Math.abs(px - x) > Math.abs(py - y) ? (px > x ? 'left' : 'right') : 'up' };
  }
  return null;
}

Object.assign(ACTIONS, {
  work_salvage: {
    label: 'Salvaging rift scrap', icon: 'chip', sat: { industry: -0.45, bored: -0.3 }, dur: 55, pose: 'work', prop: 'gadget', outdoor: true, job: 'tinker', skill: 'tinkering',
    avail: () => !!(World.rifts.some((r) => r.a > 0.5 && !r.closing) || World.riftScars.some((s) => s.stock > 0)) && (Village.stores.scrap || 0) < storeCap('scrap'),
    time: (h) => workHours(h, 8, 19),
    extra: () => 0.1 + ((Village.stores.scrap || 0) < 8 ? 0.1 : 0),
    target: (v) => { const s = salvageSite(v); if (!s) return null; const t = nearSpot(s.x, s.y, 8, 22); if (t) Object.assign(t, s.scar ? { scar: s.scar } : {}); return t; },
    tick: (v, task, dt) => { if (Math.random() < dt * 0.1) FX.sparkle(v.x + (v.facing === 'left' ? -6 : 6), v.y - 6, '#5af8ff'); },
    done: (v, task) => {
      const sc = task.target.scar;
      if (sc) { if (sc.stock <= 0) return; sc.stock--; if (sc.stock <= 0) World.riftScars = World.riftScars.filter((s) => s !== sc); }
      queueDelivery(v, 'scrap', Math.round(3 * v.skillMul('tinkering')));
    },
  },
  work_relay: {
    label: 'Tuning the Relay Mast', icon: 'chip', sat: { industry: -0.45, bored: -0.25 }, dur: 60, pose: 'inside', job: 'tinker', skill: 'tinkering',
    avail: () => !!World.buildings.relay,
    time: (h) => workHours(h, 8, 20),
    extra: () => 0.05,
    target: () => ({ building: World.buildings.relay }),
    done: () => { World.buildings.relay.tuned = Game.time + 720; },
  },
  gadget: {
    label: 'Fiddling with a gadget', icon: 'chip', sat: { bored: -0.45, craving: -0.2 }, dur: 35, pose: 'sit', prop: 'gadget', outdoor: true,
    avail: (v) => v.tech >= 0.45,
    extra: (v) => 0.02 + v.tech * 0.03,
    time: (h) => (isNight(h) ? 0.3 : 1),
    trait: (v) => 0.15 + v.tech * 1.3,
    target: (v) => benchTarget(v, true),
    skill: 'tinkering', skillRate: 0.3,
  },
  jack_in: {
    label: 'Jacked in at the Relay', icon: 'chip', sat: { bored: -0.65, lonely: -0.25 }, dur: 45, pose: 'sit', prop: 'gadget', social: true,
    avail: (v) => !!World.buildings.relay && v.tech >= 0.3,
    extra: (v) => 0.03 + v.tech * 0.05,
    time: (h) => (h >= 7 && h < 23.5 ? 1 : 0.15),
    trait: (v) => (0.2 + v.tech * 1.5) * (World.buildings.relay && World.buildings.relay.tuned > Game.time ? 1.2 : 0.8),
    target: () => { const b = World.buildings.relay; return nearSpot(b.stepX, b.stepY + 6, 10, 34) || { x: b.stepX, y: b.stepY, facing: 'up' }; },
    skill: 'tinkering', skillRate: 0.4,
    tick: (v, task, dt) => { learn(v, dt * 0.00025, 'net'); shiftWays(v, dt * 0.0003 * (1 - v.tech)); },
  },
  rift_gawk: {
    label: 'Gawking at the rift', icon: 'rift', sat: { bored: -0.7 }, dur: 25, pose: 'stand', outdoor: true, stages: AWAKE,
    avail: (v) => !v.isRiftborn() && World.rifts.some((r) => r.a > 0.6 && !r.closing && dist(r.x, r.y, v.x, v.y) < 900),
    extra: (v) => (0.12 + v.genes.curiosity * 0.3) * (v.isChild() ? 1.6 : 1) * riftSpectacle(),
    // the wary hang back; the bold go right up close
    target: (v) => { const r = World.rifts.find((x) => x.a > 0.6 && !x.closing); if (!r) return null; const w = 1 - boldness(v); return nearSpot(r.x, r.y, 22 + w * 36, 34 + w * 44); },
    tick: (v, task, dt) => { if (Math.random() < dt * 0.015) v.say(R.pick(v.isChild() ? RIFT_GAWK_SAY.kid : RIFT_GAWK_SAY.adult), 3); },
    done: (v) => { v.remember('Went to gawp at the rift.', 1); shiftWays(v, 0.02 * v.genes.curiosity); },
  },
  rift_lost: {
    label: 'Wandering about, utterly lost', icon: 'rift', sat: { bored: -0.3 }, dur: 18, pose: 'stand', outdoor: true, stages: AWAKE,
    avail: (v) => v.isRiftborn() && (v.lost || 0) > 0.5,
    extra: (v) => v.lost * 0.12,
    target: (v) => randomNearby(v, 9),
    tick: (v, task, dt) => {
      if (Math.random() < dt * 0.025) v.say(R.pick(v.isChild() ? RIFT_LOST_SAY.kid : RIFT_LOST_SAY.adult), 3.5);
      if (Math.random() < dt * 0.04) v.facing = R.pick(['left', 'right', 'up', 'down']);
    },
    done: (v) => { v.lost = Math.max(0, v.lost - 0.01); },
  },
  seek_home: {
    label: 'Searching for a way home', icon: 'rift', sat: { bored: -0.45, industry: -0.3, lonely: -0.2 }, dur: 50, pose: 'work', prop: 'gadget', outdoor: true, social: true, stages: ADULT,
    label2: (v) => { const s = seekSite(); return s ? `Studying ${s.name} for a way home` : 'Searching for a way home'; },
    avail: (v) => v.isRiftborn() && (v.lost || 0) > 0.25 && !World.rifts.some((r) => r.home) && !!seekSite(),
    // they work together: it's much likelier when others are already at it
    extra: (v) => v.lost * 0.22 + Math.min(3, Game.villagers.filter((o) => o !== v && o.task && o.task.a.id === 'seek_home').length) * 0.06,
    time: (h) => (h >= 7 && h < 23.5 ? 1 : 0.3),
    target: () => { const s = seekSite(); return s ? nearSpot(s.x, s.y, 14, 34) : null; },
    skill: 'tinkering', skillRate: 0.4,
    tick: (v, task, dt) => {
      const s = seekSite();
      if (!s) { task.t = 0; return; }
      const crew = Game.villagers.filter((o) => o.task && o.task.a.id === 'seek_home' && o.task.phase === 'do').length;
      // two heads are better than one, and five are better still
      wayHomeProgress(dt * 0.00011 * s.boost * (0.6 + v.skills.tinkering / 100) * (1 + Math.min(4, crew - 1) * 0.35) / (1 + (Village.wayHomeTries || 0) * 0.6));
      if (Math.random() < dt * 0.02) v.say(R.pick(RIFT_SEEK_SAY), 3);
      if (Math.random() < dt * 0.08) FX.sparkle(v.x + (v.facing === 'left' ? -6 : 6), v.y - 8, R.pick(['#5af8ff', '#c050ff']));
    },
  },
  rift_watch: {
    label: 'Keeping a wary eye on the newcomers', icon: 'rift', sat: { bored: -0.45 }, dur: 22, pose: 'stand', outdoor: true, stages: AWAKE,
    label2: (v) => (v.task && v.task.target.watch ? `Keeping a wary eye on ${v.task.target.watch.first}` : 'Keeping a wary eye on the newcomers'),
    avail: (v) => !v.isRiftborn() && v.tech < RIFT_TIERS[0] && riftNovelty() > 0.2 && !!watchTarget(v),
    extra: (v) => riftNovelty() * (0.05 + v.genes.curiosity * 0.2) * (v.isChild() ? 1.5 : 1) * (0.6 + riftWary(v)),
    time: (h) => (isDay(h) ? 1 : 0.2),
    target: (v) => {
      const o = watchTarget(v);
      if (!o) return null;
      const t = nearSpot(o.x, o.y - 8, 40 + riftWary(v) * 24, 60 + riftWary(v) * 30);
      if (t) { t.watch = o; t.faceTo = o; }
      return t;
    },
    tick: (v, task, dt) => {
      const o = task.target.watch;
      if (!o || !Game.villagers.includes(o) || o.inside || o.leaving) { task.t = 0; return; }
      v.facing = o.x < v.x ? 'left' : 'right';
      if (Math.random() < dt * 0.02) v.say(R.pick(v.isChild() ? RIFT_WATCH_SAY.kid : RIFT_WATCH_SAY.adult), 3);
      // now and then they're spotted
      if (!task.data.seen && Math.random() < dt * 0.012 && !o.isBusyForChat()) {
        task.data.seen = true;
        o.say(R.pick(RIFT_NOTICE_SAY), 3);
        if (R.chance(1 - riftWary(v))) { v.say('Oh! Er, hello!', 2.5); task.data.greet = o; }
        else { v.say(R.pick(v.isChild() ? RIFT_STARTLED_SAY.kid : RIFT_STARTLED_SAY.adult), 3); v.remember(`${o.first} from the rift waved at me. I scarpered.`, 0); }
        task.t = 0;
      }
    },
    done: (v, task) => {
      const o = task.target.watch;
      if (o) v.bond(o, 0.006);
      if (task.data.greet) v.queue.push({ a: { ...ACTIONS.chat, target: () => ({ other: task.data.greet }) } });
    },
  },
});
for (const k of ['work_salvage', 'work_relay', 'gadget', 'jack_in', 'rift_gawk', 'rift_watch', 'rift_lost', 'seek_home']) ACTIONS[k].id = k;
Object.assign(ACTION_NAMES, { work_salvage: 'Salvaging', work_relay: 'Tuning the Relay', gadget: 'Gadgets', jack_in: 'Jacking in', rift_gawk: 'Rift-gawking', rift_watch: 'Watching the rift-folk', rift_lost: 'Wandering lost', seek_home: 'Seeking the way home' });
HABIT_KEYS.push('gadget', 'jack_in');
