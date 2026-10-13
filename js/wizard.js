'use strict';
// ---------------------------------------------------------------------------
// The wizard. Every couple of weeks or so, unannounced, a horse and wagon
// comes rattling up the West Road with an old man on the seat: a tall grey
// pointed hat, a long grey robe and a silver scarf, a grey beard down past
// his belt and a gnarled staff across his knees. It's Gandalf, and the back
// of the wagon is stacked with crates of fireworks marked with his rune. The
// children run to meet him and he lets off a puff of coloured stars for them.
// He draws up by the party field and stays two nights. Each afternoon he
// stands beneath the great party tree and tells a tale (trolls, dragons,
// eagles, the Fell Winter, Bullroarer Took and the invention of golf), and
// most of the village downs tools and sits in a ring on the grass to hear
// it. Whenever there's a party while he's here, the fireworks are his:
// rockets that climb twice as high and burst three times as wide, golden
// willows, hearts, his own G-rune written in sparks, and for the finale a
// red-gold dragon of fire that flies roaring over the field and bursts
// above it. On the third morning he drives off down the road again.
//
// He isn't a villager: he lives in `Game.wizard` (plain data, saved) and is
// drawn and speaks through `Visitors`, the list main.js draws alongside the
// folk.
// ---------------------------------------------------------------------------

const WIZARD = { name: 'Gandalf', title: 'Gandalf the Grey', walk: 14, drive: 15, gap: 8, chance: 0.15, stay: 2 };


MOODLETS.wizard_tale = ['Heard the wizard tell {x}', 0.12, 1440, ['Did you hear the wizard\'s tale? I can\'t stop thinking about it.', 'I\'d give a lot to see what he\'s seen.']];
MOODLETS.wizard_show = ['Saw the wizard\'s fireworks', 0.16, 1440, ['That dragon! I thought it would land on the inn.', 'Never seen fireworks like them. Never will again, I expect.']];
MOODLETS.wizard_came = ['The wizard\'s come!', 0.08, 720, ['Gandalf\'s here! There\'ll be fireworks!', 'A wizard, in our village!']];

// --- The tales ----------------------------------------------------------------
// Each is told a line at a time over an afternoon. `x` is how folk remember it.
const WIZARD_TALES = {
  greenfields: { x: 'of Bullroarer Took', lines: [
    'Gather in, gather in. Shall I tell you about Bandobras Took, whom they called the Bullroarer?',
    'He was so tall for a hobbit that he could sit on a horse. A real horse, mind, not a pony.',
    'In his day the goblins came down out of the north and raided the Northfarthing.',
    'Their king was a brute called Golfimbul. And the Bullroarer rode out to meet him with a club of ash.',
    'One swing! Just the one. And off came the goblin king\'s head, clean as a turnip from a stalk.',
    'It sailed a hundred yards through the air, and went straight down a rabbit hole.',
    'So the battle was won, and the game of golf was invented, both on the same afternoon.',
  ] },
  trolls: { x: 'of the three trolls', lines: [
    'Now then. Have any of you ever met a troll? No? Good. Keep it that way.',
    'There were three of them once, in the Trollshaws, sitting round a fire with a mutton bone apiece.',
    'They caught some travellers, and fell to arguing over how to cook them. Roast? Boil? Sit on them and make jelly?',
    'And while they argued, somebody kept throwing his voice from the trees, so each troll thought it was the other.',
    'They argued and they quarrelled, and they argued and they quarrelled... until the sky went grey in the east.',
    '"Dawn take you all, and be stone to you!" said the voice. And the sun came up.',
    'Trolls must be under ground before the sun rises, you see. They\'re standing there to this day, three lumps of rock, with a bird\'s nest in one\'s ear.',
  ] },
  dragon: { x: 'of the dragon under the Mountain', lines: [
    'Far to the east there is a Lonely Mountain, and under it, a hall of gold. And on the gold, a dragon.',
    'Red-gold he was, with a belly of jewels from lying so long on his treasure, and a nose for every coin.',
    'Now, a certain hobbit was asked to burgle that hoard. A hobbit! From a nice hole not unlike yours.',
    'Down the long tunnel he crept in the dark, and he could hear the great beast snoring like a furnace.',
    'He took one cup. One golden, two-handled cup. And the dragon woke in a fury that shook the mountain.',
    'But a hobbit is quieter than a mouse and braver than he looks. He came home again, and you know the rest.',
    'Or you don\'t, and that is another story, for another afternoon. Ha!',
  ] },
  eagles: { x: 'of the Eagles of the Misty Mountains', lines: [
    'Up in the Misty Mountains, higher than the clouds, the Great Eagles keep their eyries.',
    'Their wings are as wide as this field, and their eyes can count the mice in a barley field from a mile up.',
    'I was trapped once, up a pine tree on a hillside, with wolves below and goblins setting the trees alight.',
    'I thought my last hour had come. I even thought, well, I shall go out with a bang, at least.',
    'And then: a cry, high and clear. Down out of the moonlight came the eagles.',
    'They plucked us from the burning branches and carried us away over the mountains till dawn.',
    'Never be too proud to be rescued. Even wizards need a lift now and then.',
  ] },
  fellwinter: { x: 'of the Fell Winter', lines: [
    'You have had hard winters here. But you have never had a winter like the Fell Winter. Pray you never do.',
    'The Brandywine froze from bank to bank, so thick a cart could cross it.',
    'And over the ice, in the grey of the evening, came the white wolves out of the north.',
    'The hobbits of the Shire are not a warlike folk. But that winter they found out what they were made of.',
    'They blew the horns of Buckland, and every hole and farm lit a light, and they stood together at the gates.',
    'Shoulder to shoulder, farmer and miller and baker, with pitchforks and torches. And the wolves went back.',
    'You are tougher than you look, you hobbits. All of you. Remember it on the dark days.',
  ] },
  oldtook: { x: 'about the Old Took\'s parties', lines: [
    'I knew the Old Took, you know. Gerontius Took. He lived to a hundred and thirty, and enjoyed every year of it.',
    'His Midsummer parties were famous from here to the Sea. Long tables down the whole hillside.',
    'It was for him that I first made my fireworks. Squibs and crackers, back then. Nothing grand.',
    'Then came stars and fountains, and golden rain, and smoke that turned into flowers in the air.',
    'And the lanterns would bob about all night, and nobody went to bed before the sun was up.',
    'The young hobbits used to follow my cart all the way from the Bridge, shouting for fireworks.',
    'Just as yours did today. Some things, I am glad to say, never change.',
  ] },
  sea: { x: 'of the ships that sail into the West', lines: [
    'Have any of you seen the Sea? Ah. It is very large, and very wet, and it goes on further than you can think.',
    'At the end of the land there are grey havens, with white ships tied up at the quays.',
    'The elves go there when they are weary of the world, and sail away into the West.',
    'They say the ships go on and on, past the edge of all the maps, until the straight road rises.',
    'And there, beyond the rain and the grey curtain of the world, is a far green country under a swift sunrise.',
    'I have not seen it. Not yet. But I like to think about it, of an evening.',
    'There. That is enough sadness for one afternoon. Who would like to see a smoke ring shaped like a ship?',
  ] },
};
const TALE_REACTS = {
  cheerful: ['Ha! Marvellous!', 'Oh, what a story!', 'More! Tell more!'], ornery: ['Hmph. Likely tale.', 'And I suppose that\'s true as well, is it?'], shy: ['...Ooh.', '*listens, wide-eyed*'], curious: ['But how did he know?', 'Where is that, exactly? Is it far?'],
  dreamy: ['I can almost see it.', 'I\'d love to go there one day.'], witty: ['I\'d have had the cup and the jelly.', 'Golf! I knew it was a goblin\'s game.'], proud: ['My grandfather was a Took, you know.', 'I\'d not have been frightened.'], gloomy: ['That\'s a sad one.', 'Mm.'],
  child: ['Ooooh!', 'Again! Tell it again!', 'Was it a REALLY big dragon?', 'I\'d have hit him with a club too!', 'Shh! He\'s getting to the good bit!'],
};
const WIZARD_IDLE = ['Good morning! Or is it? Well, it is a good morning to be out walking, at any rate.', 'Has anybody here seen a hobbit with a taste for adventure? No? Pity.', 'Lovely leaf you grow here. Very lovely leaf.', 'Do not meddle in the affairs of wizards. Unless there is cake.', 'Fireworks tonight! If the weather holds, and if I can remember which crate is which.', 'Ah, the Shire. It never changes, and I hope it never does.', 'What a fine hole that is. Round door, brass knob, everything just so.', 'A wizard is never late. Nor early. He arrives precisely when he means to.'];
const WIZARD_PARTY = ['Splendid party! Splendid!', 'Is that a seed-cake? I think it might be a seed-cake.', 'Not long now, little ones. Patience!', 'Another tune, fiddler!', 'Hobbits do know how to throw a party. I have always said so.'];

// --- His party ------------------------------------------------------------------
// A night of his own among the occasions: it gives way to the calendar's
// festivals and the Steward's feasts (he comes to those, and the fireworks
// are his anyway), and wins over a wedding or a birthday, which are toasted at it.
addPartyKind('wizard', {
  rank: 3.5, label: 'The wizard\'s party', hud: 'Wizard!', fireworks: 0, encore: 0,
  note: 'The lanterns are lit in the party field: there\'s a do tonight for the wizard, and he\'s promised fireworks.',
  also: 'the wizard\'s visit',
  show: (x, y) => wizardShow(x, y),
  lines: ['Is it time for the fireworks yet?', 'Gandalf! Do the dragon!', 'A wizard at our party!', 'Faster, fiddler! The wizard\'s watching!'],
});
const wizardPartyTonight = () => (Game.schedulePartyTonight ? Game.schedulePartyTonight('wizard') : (Game.party.planned = Game.party.planned || 'wizard'));

// --- Where he is and what he's doing --------------------------------------------
function wizard() { return Game.wizard || null; }
function wizardHere() { const w = wizard(); return !!w && w.phase === 'here'; }
// telling a tale, and stood in his place to tell it
function wizardTelling() { const w = wizard(); return !!w && w.phase === 'here' && w.doing === 'tale' && !w.fpath && Game.time < (w.taleUntil || 0); }
function wizardTaleSpot() { return { x: PARTY.treeX * 16 + 8, y: (PARTY.treeY + 2) * 16 + 6 }; }
function wizardShowSpot() { return { x: PARTY.danceX * 16 + 8, y: (PARTY.danceY - 3) * 16 }; }

// A clear stretch of grass beside the party field for the wagon, five tiles long.
function wizardCamp() {
  let best = null, bd = 1e9;
  for (let dy = -9; dy <= 10; dy++) for (let dx = -18; dx <= 18; dx++) {
    const tx = Math.round(PARTY.cx) + dx, ty = Math.round(PARTY.cy) + dy;
    if ((dx / (PARTY.rx + 1)) ** 2 + (dy / (PARTY.ry + 1)) ** 2 < 1) continue;
    let ok = true;
    for (let i = -3; i <= 2 && ok; i++) for (let j = -1; j <= 0; j++) { const t = tileAt(tx + i, ty + j); if (!walkable(tx + i, ty + j) || (t !== T.GRASS && t !== T.LAWN && t !== T.PATH)) { ok = false; break; } }
    if (!ok) continue;
    const d = Math.hypot(dx - 14, (dy - 2) * 1.5) + hash2(tx, ty) * 2;
    if (d < bd) { bd = d; best = [tx, ty]; }
  }
  if (!best) best = nearestWalkable(Math.round(PARTY.cx) + 13, Math.round(PARTY.cy)) || [Math.round(PARTY.cx), Math.round(PARTY.cy) + 8];
  return { x: best[0] * 16 + 8, y: best[1] * 16 + 12 };
}
const wizTile = (p) => [Math.floor(p.x / 16), Math.floor(p.y / 16)];
function wizPath(from, to) {
  const [sx, sy] = wizTile(from), [tx, ty] = wizTile(to);
  const p = findPath(sx, sy, tx, ty);
  if (!p) return null;
  const out = p.map(([x, y]) => [x * 16 + 8, y * 16 + 12]);
  out.push([to.x, to.y]);
  return out;
}

// The wagon comes in from where the road leaves the valley.
function wizardArrive() {
  if (wizard()) return;
  const ex = WEST_EXIT, start = { x: clamp(ex.x, 8, MAP_W * 16 - 8), y: ex.y };
  const camp = wizardCamp();
  const path = wizPath(start, camp);
  Game.wizard = { phase: 'coming', day: Game.day, leave: Game.day + WIZARD.stay, x: start.x, y: start.y, face: start.x < camp.x ? 1 : -1, path, pi: 0, camp, doing: 'drive', fx: camp.x, fy: camp.y, facing: 'down', fpath: null, fpi: 0, dist: 0, told: [], taleDay: 0, showDay: 0, cheered: [] };
  if (!path) { Game.wizard.x = camp.x; Game.wizard.y = camp.y; }
  Game.wizardLast = Game.day;
  chronicle('A horse and wagon is rattling up the road into Thistledown, and on the seat sits an old man in a tall pointed grey hat and a long grey robe, a silver scarf at his throat and a grey beard down past his belt. It\'s Gandalf the Grey! And the wagon is stacked with crates of fireworks.', 'party');
  toast('Gandalf the wizard is coming up the road!', 'info');
}
function wizardParked() {
  const w = wizard();
  w.phase = 'here'; w.x = w.camp.x; w.y = w.camp.y; w.path = null; w.doing = 'wagon'; w.fx = w.camp.x + w.face * 30; w.fy = w.camp.y + 4;
  if (typeof playMode === 'function' && playMode()) {
    // you're the wizard: you stay as long as you like
    w.leave = 1e9; w.doing = 'player';
    chronicle('Gandalf has drawn up his wagon by the party field. Tap the ground to walk, and tap a hobbit to stop for a word.', 'party');
  } else chronicle('Gandalf has drawn up his wagon by the party field and is staying two nights. He\'ll tell tales beneath the great tree in the afternoons, and if there\'s a party, the fireworks are his.', 'party');
  wizardPartyTonight();
  for (const v of Game.villagers) if (!v.inside || v.isChild()) feel(v, 'wizard_came');
}
function wizardDepart() {
  const w = wizard();
  w.phase = 'going'; w.doing = 'drive'; w.fpath = null;
  const ex = WEST_EXIT, end = { x: clamp(ex.x, 8, MAP_W * 16 - 8), y: ex.y };
  w.path = wizPath({ x: w.x, y: w.y }, end); w.pi = 0;
  chronicle(w.showDay ? 'Gandalf has climbed up onto his wagon and driven off down the road, waving his hat. The children ran after him as far as the bridge.' : 'Gandalf has driven off down the road again. No party while he was here, so no fireworks this time! Folk are kicking themselves.', 'party');
  if (!w.path) wizardGone();
}
function wizardGone() { Game.wizard = null; Wiz.seats = []; }

// --- The wagon and the walk --------------------------------------------------------
function wizStep(o, pathKey, iKey, speed, dt) {
  const path = o[pathKey];
  let step = speed * dt, moved = 0, dx = 0, dy = 0;
  while (step > 0 && path && o[iKey] < path.length) {
    const [tx, ty] = path[o[iKey]], ax = o[pathKey === 'path' ? 'x' : 'fx'], ay = o[pathKey === 'path' ? 'y' : 'fy'];
    const ddx = tx - ax, ddy = ty - ay, d = Math.hypot(ddx, ddy);
    const k = pathKey === 'path' ? ['x', 'y'] : ['fx', 'fy'];
    if (d <= step) { o[k[0]] = tx; o[k[1]] = ty; step -= d; moved += d; o[iKey]++; dx += ddx; dy += ddy; }
    else { o[k[0]] += (ddx / d) * step; o[k[1]] += (ddy / d) * step; moved += step; dx += (ddx / d) * step; dy += (ddy / d) * step; step = 0; }
  }
  if (path && o[iKey] >= path.length) o[pathKey] = null;
  return { moved, dx, dy };
}
function wizDrive(w, dt) {
  const { moved, dx, dy } = wizStep(w, 'path', 'pi', WIZARD.drive, dt);
  w.dist = (w.dist || 0) + moved;
  // the wagon turns round only when it's clearly heading the other way
  if (Math.abs(dx) > Math.abs(dy) * 0.6 && Math.abs(dx) > 0.05) w.face = dx > 0 ? 1 : -1;
  // children run to see, and get a puff of coloured stars for their trouble
  if (w.phase === 'coming') for (const v of Game.villagers) {
    if (!v.isChild() || v.inside || v.stage === 'baby' || (w.cheered || []).includes(v.id) || dist(v.x, v.y, w.x, w.y) > 90) continue;
    (w.cheered = w.cheered || []).push(v.id);
    v.say(R.pick(['Gandalf! Gandalf!', 'Fireworks! Have you brought fireworks?', 'It\'s the wizard! Mum! It\'s the wizard!', 'Do a magic! Please?']), 3);
    v.drives.bored = Math.max(0, v.drives.bored - 0.3);
    feel(v, 'wizard_came');
    if (!Wiz.bubbleBusy()) wizSay(R.pick(['Ha! Here you are, then.', 'Fireworks? Whatever gave you that idea?', 'Stand back, now.']));
    FX.sparkle(w.x + w.face * 6, w.y - 46, R.pick(['#ff8ae0', '#6ad0ff', '#ffd34a', '#9aff7a']));
    FX.sparkle(w.x + w.face * 6, w.y - 46, '#ffffff');
  }
  if (!w.path) { if (w.phase === 'coming') wizardParked(); else wizardGone(); }
}

// What he means to be doing at an hour of his visit, and where.
function wizardPlan(w, h) {
  const night = h >= 23.75 || h < 7;
  if (w.leave <= Game.day && h >= 9) return { doing: 'leave', ...wizardSeat(w) };
  if (night && !(Game.party.on && h >= 23.75)) return { doing: 'sleep', ...wizardSeat(w) };
  if (Game.time < (w.taleUntil || 0)) return { doing: 'tale', ...wizardTaleSpot(), facing: 'down' };
  // after lunch he heads for the great tree, and begins when he gets there
  if (h >= 13.5 && h < 16.5 && w.taleDay !== Game.day && !Game.raining && w.leave > Game.day) return { doing: 'totale', ...wizardTaleSpot(), facing: 'down' };
  if (Game.party.on && ((w.showDay !== Game.day && h >= 21.5) || (w.showDay === Game.day && Game.fireworks.until > Game.time))) return { doing: 'show', x: wizardShowSpot().x - 26, y: wizardShowSpot().y + 30, facing: 'right' };
  if (Game.party.on && h >= 18) return { doing: 'party', x: (PARTY.danceX + 4) * 16 + 8, y: (PARTY.danceY + 1.5) * 16, facing: 'left' };
  if (Game.raining) return { doing: 'sleep', ...wizardSeat(w) };
  return { doing: 'wander' };
}
const wizardSeat = (w) => ({ x: w.camp.x - w.face * 2, y: w.camp.y + 2, facing: 'down' });
const WANDER_SPOTS = () => [World.wellSpot, World.marketSpot, World.postSpot, World.inn && { x: World.inn.left + 70, y: World.inn.bottom + 10 }, { x: PLAZA.cx * 16, y: PLAZA.cy * 16 }, wizardTaleSpot(), ...World.homes.filter((hm) => hm.built).slice(0, 12).map((hm) => ({ x: hm.stepX, y: hm.stepY + 10 }))].filter(Boolean);

function wizardTick(dt, h) {
  const w = wizard();
  Wiz.sync();
  if (!w) return;
  if (Wiz.speaker.bubble) { Wiz.speaker.bubble.t -= dt / (Game.minPerSec || 3); if (Wiz.speaker.bubble.t <= 0) Wiz.speaker.bubble = null; }
  if (w.phase !== 'here') { wizDrive(w, dt); return; }
  // played by you: no plans of his own
  if (typeof playMode === 'function' && playMode()) { playTick(w, dt); return; }
  const plan = wizardPlan(w, h);
  if (plan.doing === 'wander') {
    if (w.doing !== 'wander' || (!w.fpath && Game.time > (w.waitUntil || 0))) {
      const spots = WANDER_SPOTS(), s = R.pick(spots);
      w.doing = 'wander'; w.fpath = wizPath({ x: w.fx, y: w.fy }, randomish(s)); w.fpi = 0; w.waitUntil = Game.time + R.f(25, 60);
    }
  } else if (w.doing !== plan.doing) {
    if (plan.doing === 'totale' && w.summonDay !== Game.day) summonListeners(w);
    w.doing = plan.doing; w.fpath = wizPath({ x: w.fx, y: w.fy }, plan); w.fpi = 0; w.facingAt = plan.facing;
    if (!w.fpath) { w.fx = plan.x; w.fy = plan.y; }
  }
  if (w.fpath) {
    const { dx, dy } = wizStep(w, 'fpath', 'fpi', WIZARD.walk, dt);
    w.walkDist = (w.walkDist || 0) + Math.hypot(dx, dy);
    if (Math.hypot(dx, dy) > 0.01) w.facing = facingOf(dx, dy);
    if (!w.fpath && w.facingAt) w.facing = w.facingAt;
    return;
  }
  if (w.doing === 'leave') { wizardDepart(); return; }
  if (w.doing === 'totale') { wizardStartTale(); w.doing = 'tale'; return; }
  if (w.doing === 'tale') taleTick(w, dt);
  else if (w.doing === 'party' || w.doing === 'wander') {
    if (Math.random() < dt * 0.012) FX.smokeRing(w.fx + (facingLeft(w.facing) ? -6 : 6), w.fy - 30);
    if (!Wiz.bubbleBusy() && Math.random() < dt * 0.012) {
      const near = Game.villagers.find((v) => !v.inside && dist(v.x, v.y, w.fx, w.fy) < 60);
      if (near || w.doing === 'party') wizSay(R.pick(w.doing === 'party' ? WIZARD_PARTY : WIZARD_IDLE), near);
    }
  }
}
function randomish(s) { const t = nearestWalkable(Math.floor(s.x / 16) + R.i(-2, 2), Math.floor(s.y / 16) + R.i(-1, 2)); return t ? { x: t[0] * 16 + 8, y: t[1] * 16 + 12 } : s; }
function wizSay(text, to) { Wiz.speaker.bubble = { text, t: Math.max(4, 1.6 + text.length * 0.05), to: to || null, think: false }; }

// --- The tale --------------------------------------------------------------------
// Word goes round that the wizard's about to tell a tale, and most folk put
// down what they're doing (bar sleeping, minding babies, eating, carrying
// things and the like) and make for the great tree.
const TALE_NO_INTERRUPT = new Set(['sleep', 'held', 'cradle', 'nurse', 'tend_baby', 'deliver', 'work_lamps', 'work_nanny', 'scene', 'see_off', 'drop_off', 'collect_child', 'fetch_child', 'tag_along', 'eat_home', 'eat_inn', 'build', 'wizard_tale']);
function summonListeners(w) {
  w.summonDay = Game.day;
  for (const v of Game.villagers) {
    if (v.stage === 'baby' || v.leaving || v.carried || v.heldBy || v.isSick() || needsMinder(v)) continue;
    if (v.task && (TALE_NO_INTERRUPT.has(v.task.a.id) || v.task.chatLock)) continue;
    if (v.drives.hunger > 0.8 || v.drives.tired > 0.8) continue;
    if (!R.chance(0.55 + v.genes.curiosity * 0.35 + (v.isChild() ? 0.15 : 0))) continue;
    v.abort();
    v.queue.unshift({ a: ACTIONS.wizard_tale });
    v.thinkDelay = R.f(0, 10);
  }
}
function wizardStartTale(force, pick) {
  const w = wizard();
  if (!w || w.phase !== 'here') return;
  const left = Object.keys(WIZARD_TALES).filter((k) => !(w.told || []).includes(k));
  const key = pick && WIZARD_TALES[pick] ? pick : R.pick(left.length ? left : Object.keys(WIZARD_TALES));
  w.told = (w.told || []).concat(key);
  w.tale = key; w.line = 0; w.lineAt = 0; w.taleDay = Game.day;
  w.taleUntil = Game.time + 200; w.taleAt = Game.time;
  Wiz.makeSeats();
  if (!force) chronicle(`Gandalf is telling a tale beneath the great tree in the party field: the tale ${WIZARD_TALES[key].x}. Half the village has downed tools to listen.`, 'party');
}
function taleTick(w, dt) {
  const tale = WIZARD_TALES[w.tale];
  if (!tale) return;
  w.lineAt = (w.lineAt || 0) - dt;
  // he waits for a few to gather before he begins
  const listening = Game.villagers.filter((v) => v.task && v.task.a.id === 'wizard_tale' && v.task.phase === 'do');
  if (w.line === 0) {
    const coming = Game.villagers.filter((v) => v.task && v.task.a.id === 'wizard_tale').length;
    // until most of those coming have sat down, or it's gone a quarter past three
    const ready = listening.length >= Math.max(3, coming * 0.8) && Game.hour >= 14.5;
    if (!ready && Game.hour < 15.25 && Game.time < w.taleAt + 100) {
      if (!Wiz.bubbleBusy() && Math.random() < dt * 0.03) wizSay(R.pick(['Come along, come along! Sit wherever you like.', 'Is that everybody? No, here come some more.', 'Make room for the little ones at the front.', 'Patience. A tale is no good half-heard.']));
      return;
    }
    // once it begins, it runs a quarter of an hour a line, and then ends
    w.taleUntil = Game.time + tale.lines.length * 15 + 10;
  }
  if (w.lineAt <= 0 && w.line < tale.lines.length) {
    wizSay(tale.lines[w.line]);
    w.line++; w.lineAt = 15;
    w.raise = 6;
    if (w.line === Math.ceil(tale.lines.length * 0.7)) for (const c of ['#ff8a3a', '#ffd34a', '#ffffff']) FX.sparkle(w.fx + (facingLeft(w.facing) ? -10 : 10), w.fy - 52, c);
    // and somebody in the ring answers back
    const l = R.pick(listening);
    if (l && R.chance(0.6)) w.react = { id: l.id, at: Game.time + 5 };
  }
  if (w.react && Game.time >= w.react.at) {
    const l = Game.villagers.find((o) => o.id === w.react.id);
    w.react = null;
    if (l && l.task && l.task.a.id === 'wizard_tale') l.say(R.pick(TALE_REACTS[l.isChild() ? 'child' : temperOf(l)] || TALE_REACTS.cheerful), 2.6);
  }
  w.raise = Math.max(0, (w.raise || 0) - dt);
  if (w.line >= tale.lines.length && w.lineAt <= 0) {
    w.taleUntil = 0;
    for (const v of listening) feel(v, 'wizard_tale', tale.x);
  }
}

// --- The ring of listeners ----------------------------------------------------------
const Wiz = {
  seats: [],
  speaker: null,
  wagonVis: null,
  bubbleBusy() { return !!(this.speaker && this.speaker.bubble); },
  // half-rings on the grass in front of him, filled from the front, everyone facing his way
  makeSeats() {
    const c = wizardTaleSpot(), old = new Map(this.seats.map((s) => [s.x + ',' + s.y, s]));
    this.seats = [];
    [24, 38, 52, 66].forEach((r, ring) => {
      const n = Math.round((Math.PI * r * 0.9) / 15);
      for (let i = 0; i < n; i++) {
        const a = Math.PI * (0.1 + 0.8 * ((i + (ring % 2) * 0.5) / Math.max(1, n - 0.5)));
        const x = Math.round(c.x + Math.cos(a) * r * 1.3), y = Math.round(c.y + 4 + Math.sin(a) * r * 0.7);
        if (!walkable(Math.floor(x / 16), Math.floor(y / 16))) continue;
        const prev = old.get(x + ',' + y);
        const seat = prev || makeSpot(x, y, facingOf(c.x - x, (c.y - 20 - y) * 2), 'sit', 'storyseat');
        seat.ring = ring;
        this.seats.push(seat);
      }
    });
  },
  seatFor(v) {
    let best = null, bs = 1e9;
    for (const s of this.seats) {
      if (s.occ) continue;
      const sc = s.ring * 70 + dist(v.x, v.y, s.x, s.y) * 0.1 + Math.random() * 25;
      if (sc < bs) { bs = sc; best = s; }
    }
    return best ? { spot: best } : null;
  },
  sync() {
    const w = wizard();
    if (!w) { for (const o of [this.speaker, this.wagonVis]) { const i = Visitors.indexOf(o); if (o && i >= 0) Visitors.splice(i, 1); } return; }
    if (!this.speaker) this.make();
    for (const o of [this.speaker, this.wagonVis]) if (!Visitors.includes(o)) Visitors.push(o);
    const sp = this.speaker;
    const onSeat = w.phase !== 'here';
    sp.hidden = !onSeat && w.doing === 'sleep' && !w.fpath;
    sp.x = onSeat ? w.x + w.face * 2 : w.fx; sp.y = onSeat ? w.y + 1 : w.fy;
    sp._top = onSeat ? w.y - 58 : w.fy - 50;
    this.wagonVis.x = w.x; this.wagonVis.y = w.y;
  },
  make() {
    this.speaker = {
      first: WIZARD.name, inside: null, iconT: 0, bubble: null, hidden: false, x: 0, y: 0,
      isGrown: () => true, isSick: () => false,
      draw: (ctx) => { const w = wizard(); if (w && w.phase === 'here') drawWizardOnFoot(ctx, w); },
      lights: (L) => { const w = wizard(); if (w && w.phase === 'here' && !this.speaker.hidden && Game.darkness > 0.2) L.push({ x: w.fx + (facingLeft(w.facing) ? 10 : -10), y: w.fy - 46 - (w.doing === 'show' ? 8 : 0), r: w.doing === 'show' ? 40 : 22, a: 0.75, col: '#e8f0ff' }); },
    };
    this.wagonVis = {
      x: 0, y: 0,
      draw: (ctx) => { const w = wizard(); if (w) drawWizardWagon(ctx, w); },
      lights: (L) => { const w = wizard(); if (w && Game.darkness > 0.2) L.push({ x: w.x - w.face * 20, y: w.y - 22, r: 34, a: 0.8, warm: true }); },
    };
  },
};

// --- Folk who come to listen ---------------------------------------------------------
ACTIONS.wizard_tale = {
  label: 'Listening to the wizard\'s tale', icon: 'book', sat: { bored: -0.95, lonely: -0.45 }, dur: 170, pose: 'sit', outdoor: true, social: true, stages: ['child', 'adult', 'elder'],
  avail: () => wizardHere() && (Game.time < (wizard().taleUntil || 0) || wizard().doing === 'totale'),
  // nearly everybody wants to hear a wizard; the curious most of all
  extra: (v) => 1.6 + v.genes.curiosity * 0.8 + (v.isChild() ? 0.5 : 0),
  target: (v) => { if (!Wiz.seats.length) Wiz.makeSeats(); return Wiz.seatFor(v); },
  tick: (v, task, dt) => {
    if (task.phase !== 'do') return;
    const w = wizard();
    if (!w || w.phase !== 'here' || (w.doing !== 'totale' && Game.time >= (w.taleUntil || 0))) { task.t = Math.min(task.t, 1); return; }
    // the tale runs as long as it runs
    task.t = Math.max(task.t, 2);
    v.drives.industry = Math.max(0, v.drives.industry - dt * 0.002);
    if (v.isChild()) learn(v, dt * 0.0002, 'school');
  },
};
ACTIONS.wizard_tale.id = 'wizard_tale';
ACTION_NAMES.wizard_tale = 'Wizard\'s tales';

// --- Sprites ------------------------------------------------------------------------
// Drawn like the folk, on a grid of world pixels refined to quarter-pixels,
// but half as tall again: big folk. Palette letters as for the folk where
// the meaning is near enough (h beard and hair, s skin, v robe, t boots),
// plus c/C the hat, z the silver scarf, p/o/b the staff.
const WIZ_PAL = {
  c: '#8e8c88', C: '#64625e', h: '#d6d4ce', H: '#a8a6a0', j: '#f2f0ea', d: '#eeece6', s: '#e2b48e', S: '#c4946e', N: '#b47c5a',
  e: '#262630', w: '#ffffff', v: '#7e7c7a', V: '#585652', u: '#9e9c98', z: '#c6cedb', Z: '#e8eef8', t: '#3a2c22', T: '#261c14', l: '#4a3626',
  p: '#6e4c2c', o: '#4a321e', b: '#8e6c44', E: '#101018', B: '#ffffff',
};
const WIZ_W = 28;
function wizGrid(H) {
  const g = Array.from({ length: H }, () => Array(WIZ_W).fill('.'));
  const put = (x, y, k) => { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < H && x >= 0 && x < WIZ_W) g[y][x] = k; };
  const rect = (x0, y0, x1, y1, k) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, k); };
  return { g, put, rect };
}
// the hat: a tall cone with a bent tip, and a broad brim
function wizHat(put, rect, cx, lean, back) {
  for (let y = 0; y <= 12; y++) {
    const hw = 0.7 + y * 0.42, c = cx + (12 - y) * 0.16 * lean + (y < 3 ? (3 - y) * 0.9 * lean : 0);
    for (let x = Math.round(c - hw); x <= Math.round(c + hw); x++) put(x, y, (back ? x < c - hw * 0.3 : x > c + hw * 0.3) ? 'C' : 'c');
  }
  rect(cx - 11, 13, cx + 11, 13, 'c'); rect(cx - 12, 14, cx + 12, 14, 'C');
  put(cx - 12, 13, '.'); put(cx + 12, 13, '.');
}
// the staff, gnarled at the top, at column x from y0 down
function wizStaff(put, rect, x, y0, y1) {
  rect(x, y0 + 3, x, y1, 'p'); rect(x + 1, y0 + 3, x + 1, y1, 'o');
  rect(x - 1, y0, x + 2, y0 + 2, 'b'); put(x - 1, y0 - 1, 'b'); put(x + 2, y0 - 1, 'o'); put(x + 1, y0 + 2, 'o');
}
const WIZ_H = 52;
function wizFront(pose, back = false) {
  const H = WIZ_H, { g, put, rect } = wizGrid(H), cx = 14;
  wizHat(put, rect, cx, 1, back);
  // long hair to the shoulders
  rect(cx - 9, 15, cx - 7, 28, 'h'); rect(cx + 7, 15, cx + 9, 28, 'H');
  // the robe: shoulders, then flaring to the hem
  for (let y = 23; y <= 47; y++) {
    const hw = y < 31 ? 8 : 8 + (y - 31) * 0.22;
    const sway = (pose === 'walk1' ? 1 : pose === 'walk2' ? -1 : 0) * (y > 41 ? 1 : 0);
    for (let x = Math.round(cx - hw) + sway; x <= Math.round(cx + hw) + sway; x++) put(x, y, x >= cx + hw - 2 + sway ? 'V' : x <= cx - hw + sway ? 'u' : 'v');
  }
  for (const fx of [cx - 3, cx + 4]) for (let y = 39; y <= 47; y += 1) if (y % 2) put(fx, y, 'V');
  rect(cx - 7, 47, cx + 8, 47, 'V');
  // boots
  const feet = { walk1: [[-6, 0], [2, -1]], walk2: [[-6, -1], [2, 0]] }[pose] || [[-6, 0], [2, 0]];
  for (const [dx, dy] of feet) { rect(cx + dx, 48 + dy, cx + dx + 4, 49 + dy, 't'); rect(cx + dx + 3, 48 + dy, cx + dx + 4, 49 + dy, 'T'); }
  if (back) {
    // seen from behind: hair falling down the back, and nothing but robe
    for (let y = 15; y <= 32; y++) { const hw = 7 - Math.max(0, y - 26) * 0.7; rect(Math.round(cx - hw), y, Math.round(cx + hw), y, y > 28 ? 'H' : 'h'); }
    rect(cx - 7, 21, cx + 7, 22, 'z');
  } else {
    // the face, in the shadow of the brim
    rect(cx - 6, 15, cx + 6, 22, 's'); rect(cx + 4, 15, cx + 6, 22, 'S'); rect(cx - 6, 15, cx + 6, 15, 'S');
    // great bushy brows, a long nose, and little bright eyes beneath
    rect(cx - 6, 16, cx - 2, 16, 'd'); rect(cx + 2, 16, cx + 6, 16, 'd'); put(cx - 7, 17, 'd'); put(cx + 7, 17, 'd'); put(cx - 6, 17, 'd'); put(cx + 6, 17, 'd');
    rect(cx - 4, 18, cx - 3, 18, 'e'); rect(cx + 2, 18, cx + 3, 18, 'e');
    rect(cx - 1, 17, cx, 20, 'N'); put(cx - 1, 17, 'S');
    // moustache and beard, tapering to a point below the belt
    rect(cx - 5, 21, cx + 5, 21, 'h'); put(cx - 6, 22, 'h'); put(cx + 6, 22, 'H');
    for (let y = 22; y <= 39; y++) { const hw = 5.6 - (y - 22) * 0.27; for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) put(x, y, x > cx + 1 ? 'H' : (x + y) % 5 === 0 ? 'j' : 'h'); }
    // the silver scarf either side of the beard, an end hanging down
    rect(cx - 8, 23, cx - 6, 24, 'z'); rect(cx + 6, 23, cx + 8, 24, 'z'); rect(cx - 7, 25, cx - 6, 31, 'z'); put(cx - 7, 25, 'Z');
    rect(cx - 8, 34, cx - 5, 34, 'l'); rect(cx + 5, 34, cx + 8, 34, 'l');
  }
  // sleeves, wide at the cuff, and the staff in one hand
  const raise = pose === 'raise' || pose === 'show';
  const sL = back ? cx + 8 : cx - 11, sR = back ? cx - 11 : cx + 8;
  rect(sL, 24, sL + 3, raise ? 27 : 33, 'v'); rect(sL - 1, raise ? 26 : 32, sL + 3, raise ? 28 : 34, 'u');
  if (raise) {
    // the free arm flung up beside the hat, the wide sleeve fallen back from the hand
    rect(sR, 22, sR + 3, 26, 'v'); rect(sR + 1, 17, sR + 4, 22, 'v'); rect(sR + 2, 12, sR + 5, 17, back ? 'u' : 'V');
    rect(sR + 3, 9, sR + 4, 11, 's'); put(sR + 2, 9, 's'); put(sR + 5, 10, 's');
  } else { rect(sR, 24, sR + 3, 35, 'v'); rect(sR, 33, sR + 4, 36, back ? 'u' : 'V'); rect(sR + 1, 37, sR + 3, 37, 's'); }
  const sx = back ? cx + 10 : cx - 12, top = pose === 'show' ? 1 : raise ? 4 : pose === 'walk2' ? 7 : 8;
  wizStaff(put, rect, sx, top, Math.min(H - 1, top + 41));
  rect(sx - 1, raise ? 27 : 33, sx + 2, raise ? 28 : 34, 's');
  return g;
}
function wizSide(pose) {
  const sit = pose === 'sit';
  const H = sit ? 44 : WIZ_H, { g, put, rect } = wizGrid(H), cx = 13;
  wizHat(put, rect, cx, -1, false);
  // hair down the back of the head
  rect(cx - 7, 15, cx - 3, 30, 'h'); rect(cx - 7, 15, cx - 6, 30, 'H');
  // the face in profile: brow jutting, a long nose, the beard flowing down the front
  rect(cx - 2, 15, cx + 5, 22, 's'); rect(cx - 2, 15, cx + 5, 15, 'S');
  rect(cx + 1, 16, cx + 6, 16, 'd'); put(cx + 7, 17, 'd'); put(cx + 6, 17, 'd');
  rect(cx + 3, 18, cx + 4, 18, 'e');
  rect(cx + 6, 18, cx + 7, 20, 'N'); put(cx + 8, 20, 'N');
  put(cx - 1, 19, 'S'); put(cx - 1, 20, 'S');
  // the robe
  const bot = sit ? 36 : 47;
  for (let y = 23; y <= bot; y++) {
    const back = y < 31 ? 6 : 6 + (y - 31) * 0.2, front = y < 31 ? 5 : 5 + (y - 31) * 0.25;
    const sway = !sit && y > 41 ? (pose === 'walk1' ? 1 : pose === 'walk2' ? -1 : 0) : 0;
    for (let x = Math.round(cx - back) + sway; x <= Math.round(cx + front) + sway; x++) put(x, y, x <= cx - back + 1 + sway ? 'V' : 'v');
  }
  if (sit) {
    // seated on the wagon's bench: knees forward, boots dangling
    rect(cx, 33, cx + 10, 36, 'v'); rect(cx, 36, cx + 10, 36, 'V');
    rect(cx + 7, 37, cx + 10, 41, 'v'); rect(cx + 7, 42, cx + 12, 43, 't');
  } else {
    const feet = { walk1: [[-5, 0], [3, -1]], walk2: [[-3, -1], [1, 0]] }[pose] || [[-4, 0], [2, 0]];
    for (const [dx, dy] of feet) { rect(cx + dx, 48 + dy, cx + dx + 5, 49 + dy, 't'); put(cx + dx, 48 + dy, 'T'); }
  }
  for (let y = 21; y <= (sit ? 33 : 37); y++) { const hw = 3.2 - (y - 21) * 0.18; for (let x = Math.round(cx + 1); x <= Math.round(cx + 2 + hw * 1.6); x++) put(x, y, x === cx + 1 ? 'H' : (x + y) % 4 === 0 ? 'j' : 'h'); }
  rect(cx - 3, 23, cx, 25, 'z'); rect(cx - 5, 26, cx - 4, 33, 'z');
  if (!sit) rect(cx - 6, 34, cx - 1, 34, 'l');
  // the near arm, and the staff held out in front
  const raise = pose === 'raise' || pose === 'show';
  rect(cx - 2, 24, cx + 2, raise ? 27 : 32, 'v'); rect(cx - 1, 26, cx + 2, raise ? 27 : 33, 'V');
  if (raise) { rect(cx - 6, 14, cx - 3, 25, 'v'); rect(cx - 6, 14, cx - 5, 25, 'V'); rect(cx - 6, 11, cx - 4, 13, 's'); }
  if (sit) { rect(cx + 2, 30, cx + 8, 31, 'v'); rect(cx + 9, 30, cx + 10, 31, 's'); }
  else {
    const sx = cx + 8, top = pose === 'show' ? 1 : raise ? 4 : pose === 'walk1' ? 7 : 8;
    rect(cx + 2, raise ? 26 : 31, sx - 1, raise ? 27 : 32, 'v');
    wizStaff(put, rect, sx, top, Math.min(H - 1, top + 41));
    rect(sx - 1, raise ? 26 : 31, sx + 2, raise ? 27 : 32, 's');
  }
  return g;
}
// The finer grid: strands through the beard and hair, and a crease in the hat.
function refineWizard(F) {
  const H = F.length, W = F[0].length;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = F[y][x];
    if (k === 'h' && (x * 5 + Math.floor(y / 3)) % 7 === 0) F[y][x] = 'H';
    else if (k === 'h' && (x * 3 + Math.floor(y / 4)) % 9 === 1) F[y][x] = 'j';
    else if (k === 'c' && y > 8 && y < 24 && (x * 2 + y) % 13 === 0) F[y][x] = 'C';
  }
  return F;
}
const WIZ_SPR = {};
function wizSprite(view, pose) {
  const key = view + pose;
  if (WIZ_SPR[key]) return WIZ_SPR[key];
  const grid = view === 'side' ? wizSide(pose) : wizFront(pose, view === 'up');
  const c = gridCanvas(refineWizard(fineGrid(grid)), WIZ_PAL, 2, FOLK_RES);
  c.lo = gridCanvas(grid, WIZ_PAL, 1, RS);
  return (WIZ_SPR[key] = c);
}
function drawWizardOnFoot(ctx, w) {
  if (Wiz.speaker.hidden) return;
  const [dir, flip] = facingView(w.facing);
  let pose = 'stand';
  if (w.fpath) { const ph = Math.floor((w.walkDist || 0) / 4) % 4; pose = ph === 0 ? 'walk1' : ph === 2 ? 'walk2' : 'stand'; }
  else if (w.doing === 'show' && Game.fireworks.until > Game.time) pose = 'show';
  else if (w.doing === 'tale' && (w.raise || 0) > 0 && Math.floor(tReal * 1.5) % 3) pose = 'raise';
  const spr = wizSprite(dir, pose === 'show' && dir === 'up' ? 'raise' : pose);
  const W = spr.width / spr.res, H = spr.height / spr.res;
  ctx.fillStyle = 'rgba(20,30,10,0.25)'; ctx.fillRect(Math.round(w.fx) - 6, Math.round(w.fy) - 1, 13, 2); ctx.fillRect(Math.round(w.fx) - 5, Math.round(w.fy), 11, 1);
  blit(ctx, spr, Math.round((w.fx - W / 2) * RS) / RS, Math.round((w.fy - H + 1) * RS) / RS, flip);
  // a glimmer at the head of the staff after dark, or while the show is on
  if (Game.darkness > 0.2 || pose === 'show') {
    const sxw = (flip ? W - 1 - (dir === 'side' ? 21 : dir === 'up' ? 24 : 2) : (dir === 'side' ? 21 : dir === 'up' ? 24 : 2)) + 0.5;
    const top = pose === 'show' ? 1 : pose === 'raise' ? 4 : 8;
    ctx.fillStyle = Math.sin(tReal * 6) > 0 ? '#ffffff' : '#d8e8ff';
    ctx.fillRect(Math.round((w.fx - W / 2) * RS) / RS + sxw, Math.round((w.fy - H + 1) * RS) / RS + top - 1, 1, 1);
  }
}

// The wagon, side on and facing right: a bay cart-horse with feathered white
// socks, and an open cart stacked with fireworks (crates marked with his
// rune, a barrel of rockets) under a lantern on a pole.
const WAGON_SPR = {};
function wagonSprite(frame) {
  if (WAGON_SPR[frame]) return WAGON_SPR[frame];
  const [c, x] = makeCanvas(80, 40);
  const R = (col, X, Y, W, H) => { x.fillStyle = col; x.fillRect(X, Y, W, H); };
  const graze = frame === 'graze', step = frame === 1;
  // the load: crates with the G-rune, a barrel of rockets, a lashed tarpaulin
  for (const [cx0, cy0, w, h] of [[5, 9, 10, 8], [7, 3, 8, 6], [15, 10, 8, 7]]) { R('#b08850', cx0, cy0, w, h); R('#8a6436', cx0, cy0 + h - 1, w, 1); R('#8a6436', cx0 + w - 1, cy0, 1, h); R('#c8a468', cx0, cy0, w, 1); R('#c8342a', cx0 + 2, cy0 + 2, 1, 3); R('#c8342a', cx0 + 3, cy0 + 2, 2, 1); R('#c8342a', cx0 + 3, cy0 + 4, 2, 1); R('#c8342a', cx0 + 4, cy0 + 3, 1, 1); }
  R('#7a5030', 24, 8, 7, 9); R('#5a3a22', 24, 10, 7, 1); R('#5a3a22', 24, 14, 7, 1); R('#9a6a40', 24, 8, 7, 1);
  for (const [rx, col, ht] of [[24, '#d8342a', 7], [26, '#2a6ad8', 9], [28, '#e8c030', 6], [30, '#38a84a', 8]]) { R(col, rx, 8 - ht, 2, ht); R('#f4f0e0', rx, 8 - ht, 2, 1); R('#5a3a22', rx + 1, 8 - ht - 2, 1, 2); }
  R('#8a8274', 32, 10, 6, 7); R('#a89e8c', 32, 10, 6, 1); R('#6a6254', 34, 10, 1, 7);
  // the lantern on its pole at the back
  R('#4a321e', 2, 2, 1, 15); R('#4a321e', 2, 2, 3, 1); R('#2a1c12', 3, 3, 3, 4); R('#ffd060', 4, 4, 1, 2);
  // the cart bed and the driving bench
  R('#8a5a32', 2, 17, 40, 8); R('#a8743e', 2, 17, 40, 1); R('#6a4024', 2, 24, 40, 1);
  for (let i = 6; i < 42; i += 7) R('#6a4024', i, 18, 1, 6);
  R('#6a4428', 38, 13, 6, 2); R('#4a2e1a', 39, 15, 1, 3); R('#4a2e1a', 43, 15, 1, 3);
  // shafts and harness
  R('#5a3a22', 41, 21, 22, 1); R('#5a3a22', 42, 18, 18, 1);
  // the horse
  const hx = 50;
  R('#7a4a2a', hx, 12, 20, 10); R('#9a6238', hx + 1, 12, 18, 2); R('#5a341c', hx, 20, 20, 2);
  R('#2a1c14', hx - 3, 13, 3, 3); R('#2a1c14', hx - 4, 15, 2, 8); R('#2a1c14', hx - 3, 22, 2, 3);
  if (graze) {
    R('#7a4a2a', hx + 17, 13, 6, 10); R('#7a4a2a', hx + 20, 21, 7, 6); R('#5a341c', hx + 24, 25, 3, 2); R('#f0ece4', hx + 23, 22, 1, 4); R('#2a1c14', hx + 16, 11, 3, 9); R('#2a1c14', hx + 22, 22, 1, 1);
  } else {
    R('#7a4a2a', hx + 16, 5, 6, 10); R('#7a4a2a', hx + 19, 2, 9, 6); R('#5a341c', hx + 26, 5, 3, 3); R('#9a6238', hx + 19, 2, 8, 1);
    R('#f0ece4', hx + 22, 3, 5, 1); R('#2a1c14', hx + 23, 4, 1, 1); R('#2a1c14', hx + 20, 0, 2, 2);
    R('#2a1c14', hx + 15, 3, 4, 11); R('#2a1c14', hx + 28, 6, 1, 1);
  }
  // the collar, with its brasses
  R('#5a3a22', hx + 14, 10, 3, 10); R('#d8b04a', hx + 15, 12, 1, 1); R('#d8b04a', hx + 15, 16, 1, 1);
  // legs, feathered white at the hoof
  const legs = step ? [[hx + 1, 1], [hx + 5, 0], [hx + 14, 0], [hx + 18, 1]] : [[hx + 2, 0], [hx + 4, 1], [hx + 13, 1], [hx + 17, 0]];
  for (const [lx, up] of legs) { R(up ? '#5a341c' : '#6a3e22', lx, 22, 2, 8 - up); R('#e8e4dc', lx - 1, 29 - up, 3, 3); R('#2a2018', lx - 1, 32 - up, 3, 1); }
  // the wheel, its spokes turning as it rolls
  const wx = 20, wy = 28;
  x.fillStyle = '#3a2a1a'; x.beginPath(); x.arc(wx + 0.5, wy + 0.5, 9.5, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#9a7048'; x.beginPath(); x.arc(wx + 0.5, wy + 0.5, 7.5, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#8a5a32'; x.beginPath(); x.arc(wx + 0.5, wy + 0.5, 6.5, 0, Math.PI * 2); x.fill();
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + (step ? Math.PI / 6 : 0); for (let r = 1; r < 7; r++) R('#4a2e1a', Math.round(wx + Math.cos(a) * r), Math.round(wy + Math.sin(a) * r), 1, 1); }
  R('#2a1c12', wx - 1, wy - 1, 3, 3);
  const out = outlineCanvas(c, OUTLINE);
  return (WAGON_SPR[frame] = out);
}
function mirrorCanvas(src) {
  if (src._mirror) return src._mirror;
  const [c, x] = makeCanvas(src.width, src.height);
  x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
  return (src._mirror = c);
}
function drawWizardWagon(ctx, w) {
  const moving = w.phase !== 'here';
  const frame = moving ? Math.floor((w.dist || 0) / 6) % 2 : Math.floor(tReal * 0.25 + w.camp.x) % 4 === 0 ? 'graze' : 0;
  let spr = wagonSprite(frame);
  if (w.face < 0) spr = mirrorCanvas(spr);
  const x0 = Math.round(w.x) - 40, y0 = Math.round(w.y) - 37;
  ctx.fillStyle = 'rgba(20,30,10,0.25)'; ctx.fillRect(x0 + 6, Math.round(w.y) - 2, 66, 3);
  blit(ctx, spr, x0, y0);
  // the old man on the bench, reins in hand
  if (moving) {
    const s = wizSprite('side', 'sit'), W = s.width / s.res, H = s.height / s.res;
    const bx = w.face > 0 ? x0 + 41 : x0 + 80 - 41;
    blit(ctx, s, bx - W / 2, y0 + 16 - H + 1, w.face < 0);
  }
}

// --- The fireworks ----------------------------------------------------------------------
// The show runs in real seconds, like all the particles: a plan of rockets
// and set pieces, then the dragon, then the finale.
const WIZ_COLS = [['#ff5a4a', '#ffd0a0'], ['#ffd34a', '#fff6c0'], ['#6ad0ff', '#e0f6ff'], ['#9aff7a', '#e6ffd0'], ['#ff8ae0', '#ffe0f6'], ['#c89aff', '#f0e0ff'], ['#ffffff', '#ffe8a0']];
function wizardShow(x, y) {
  const w = wizard();
  if (w) w.showDay = Game.day;
  Game.fireworks = { x, y, until: Game.time + 110 };
  const plan = [];
  const add = (at, kind, dx = 0) => plan.push({ at, kind, x: x + dx + R.f(-12, 12) });
  add(0.4, 'giant');
  for (let t = 2; t < 11; t += R.f(1.1, 1.8)) { add(t, R.pick(['giant', 'willow', 'giant']), R.f(-110, 110)); if (R.chance(0.5)) add(t + 0.2, 'willow', R.f(-110, 110)); }
  add(11.5, 'heart', -60); add(12.5, 'rune', 50);
  for (let t = 13.5; t < 21; t += R.f(1, 1.5)) add(t, R.pick(['cascade', 'ring', 'palm', 'giant']), R.f(-120, 120));
  add(22, 'dragon');
  for (let i = 0; i < 9; i++) add(31.5 + i * 0.25, R.pick(['giant', 'willow', 'ring']), (i - 4) * 32);
  Wiz.show = { t: 0, x, y, plan: plan.sort((a, b) => a.at - b.at), dragon: null };
  chronicle('Gandalf\'s fireworks! Rockets that climb out of sight and burst like flowers the size of the party field, golden willows, a heart, his own rune written across the sky... and a dragon.', 'party');
  for (const v of Game.villagers) if (!v.inside && v.stage !== 'baby' && dist(v.x, v.y, x, y) < 50 * 16) feel(v, 'wizard_show');
  return true;
}
// His fireworks have particles of their own, bigger and brighter than the
// common sort: a glowing core in a soft square of its own colour.
const WP = {
  parts: [],
  add(p) { if (this.parts.length < 4500) this.parts.push({ vx: 0, vy: 0, t: 0, g: 0, drag: 1, size: 1, ...p }); },
};
function wizRocket(x, y, kind) {
  WP.add({ k: 'rocket', x, y, vx: R.f(-10, 10), vy: -R.f(165, 200) * (kind === 'cascade' ? 0.85 : 1), life: R.f(1.15, 1.35), drag: 0.978, g: 10, cols: R.pick(WIZ_COLS), kind });
  Sound.whoosh();
}
const wizSpark = (x, y, vx, vy, col, o = {}) => WP.add({ x, y, vx, vy, life: R.f(2.2, 3), col, g: 22, drag: 0.972, size: 1.5, ...o });
function wizBurst(x, y, cols, kind) {
  WP.add({ k: 'flash', x, y, life: 0.8, col: cols[0] });
  Sound.boom();
  const ring = (n, sp, col, o = {}, sy = 0.85) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + R.f(-0.03, 0.03), v = typeof sp === 'number' ? sp : R.f(sp[0], sp[1]); wizSpark(x, y, Math.cos(a) * v, Math.sin(a) * v * sy, typeof col === 'function' ? col(i) : col, o); } };
  switch (kind) {
    case 'giant':
      ring(130, [150, 215], (i) => (i % 3 ? cols[0] : cols[1]), { trail: true, col2: cols[1] });
      ring(40, [60, 90], cols[1], { size: 1 });
      // and a crackle of white glitter where it fades
      for (let i = 0; i < 46; i++) { const a = R.f(0, Math.PI * 2), r = R.f(50, 130); WP.add({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.85 + 25, t: -R.f(1.6, 2.6), life: R.f(0.25, 0.5), col: '#ffffff', size: 1.2, g: 4, twinkle: true }); }
      break;
    case 'willow':
      ring(100, [95, 140], (i) => (i % 4 ? '#ffd890' : '#fff4c8'), { life: R.f(3.8, 4.8), g: 34, drag: 0.962, trail: true, col2: '#ffb848' }, 0.7);
      break;
    case 'ring':
      ring(80, 190, cols[0], { size: 1.8 }, 0.62);
      ring(56, 120, cols[1], {}, 0.62);
      ring(30, 60, '#ffffff', { size: 1 }, 0.62);
      break;
    case 'palm':
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 - Math.PI / 2; for (let j = 0; j < 9; j++) { const v = 70 + j * 16; wizSpark(x, y, Math.cos(a) * v, Math.sin(a) * v * 0.8, j > 6 ? '#fff4c8' : '#ffb848', { trail: j === 8, g: 40, size: j === 8 ? 2 : 1.3 }); } }
      break;
    case 'cascade':
      for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; WP.add({ k: 'rocket', x, y, vx: Math.cos(a) * 130, vy: Math.sin(a) * 95 - 30, life: R.f(0.5, 0.7), drag: 0.97, g: 30, cols: R.pick(WIZ_COLS), kind: 'pop' }); }
      break;
    case 'pop':
      ring(36, [60, 85], (i) => (i % 2 ? cols[0] : cols[1]), { life: R.f(1.2, 1.7), size: 1.2 });
      break;
    case 'heart': case 'rune': {
      // a shape written in sparks that hangs a moment, then drifts down
      const pts = kind === 'heart' ? heartPoints() : runePoints(), col = kind === 'heart' ? ['#ff5a7a', '#ffd0dc'] : ['#e8f0ff', '#9ad0ff'];
      for (const [px, py] of pts) for (let k = 0; k < 2; k++) WP.add({ x: x + px * 4.5, y: y + py * 4.5, vx: px * 0.8 + R.f(-2, 2), vy: py * 0.8 + R.f(-2, 2), t: -k * 0.06, life: R.f(3, 3.8), col: col[k], g: 4, drag: 0.95, size: k ? 1.1 : 2, light: k === 0 && Math.random() < 0.12 });
      break;
    }
  }
}
function heartPoints() { const out = []; for (let i = 0; i < 48; i++) { const t = (i / 48) * Math.PI * 2; out.push([16 * Math.pow(Math.sin(t), 3) * 0.9, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.9]); } return out; }
// his rune: a G, as it is cut on the crates (a stroke with a crook at the top and a bar)
function runePoints() {
  const out = [], seg = (x0, y0, x1, y1, n) => { for (let i = 0; i <= n; i++) out.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]); };
  seg(-8, -14, -8, 14, 14); seg(-8, -14, 8, -14, 8); seg(8, -14, 8, -6, 4); seg(-8, 2, 6, 2, 7); seg(6, 2, 6, 14, 6); seg(-8, 14, 6, 14, 7);
  return out;
}
// The dragon: a red-gold beast of fire that rises from the field, flies
// over everyone's heads, wheels round and bursts above them.
function dragonTick(d, dt) {
  const S = Wiz.show;
  d.t += dt;
  const u = d.t / d.dur;
  if (u >= 1) {
    for (let i = 0; i < 3; i++) wizBurst(d.x + R.f(-40, 40), d.y + R.f(-25, 25), [R.pick(['#ff5a2a', '#ffd34a']), '#fff6c0'], i === 1 ? 'willow' : 'giant');
    Sound.boom(); Sound.boom();
    return false;
  }
  // up out of the field, a pass across the sky, a swoop low over the crowd, and round and up again
  const px = S.x + Math.sin(u * Math.PI * 2.2 - 0.3) * 170, py = S.y - 40 - Math.sin(Math.min(1, u * 3) * Math.PI / 2) * 90 + Math.sin(u * Math.PI * 2) * 45 - (u > 0.8 ? (u - 0.8) * 250 : 0);
  const vx = px - (d.x ?? px), vy = py - (d.y ?? py);
  d.x = px; d.y = py;
  if (Math.hypot(vx, vy) > 0.3) { const a = Math.atan2(vy, vx); d.ang = d.ang == null ? a : d.ang + Math.atan2(Math.sin(a - d.ang), Math.cos(a - d.ang)) * 0.25; }
  if (!d.roared && u > 0.45) { d.roared = true; Sound.boom(); Sound.whoosh(); }
  // sparks shed from the tail and the wing tips, and now and then a long breath of flame
  d.emit = (d.emit || 0) + dt;
  if (d.emit < 1 / 30) return true;
  d.emit = 0;
  const pts = dragonPoints(d);
  for (const i of [pts.tail, pts.wingL, pts.wingR]) if (i != null) { const [x, y, col] = pts.list[i]; WP.add({ x, y, vx: R.f(-8, 8), vy: R.f(0, 14), life: R.f(0.5, 0.9), col, size: 1, g: 14 }); }
  const ca = Math.cos(d.ang || 0), sa = Math.sin(d.ang || 0);
  if (Math.sin(d.t * 2) > 0.55) for (let i = 0; i < 5; i++) WP.add({ x: d.x + 18 * ca, y: d.y + 18 * sa, vx: ca * R.f(110, 160) + R.f(-15, 15), vy: sa * R.f(110, 160) + R.f(-15, 15), life: R.f(0.5, 0.8), col: R.pick(['#ffd060', '#ff8a2a', '#fff4c0']), g: -10, drag: 0.94, size: R.f(1.4, 2.2), light: i === 0 });
  return true;
}
// The dragon's shape where it is now: a list of [x, y, colour, size] in world
// pixels (a snaking body, a horned head, two ribbed wings beating).
function dragonPoints(d) {
  const K = 2.6, ang = d.ang || 0, ca = Math.cos(ang), sa = Math.sin(ang), flip = ca < 0 ? -1 : 1, flap = Math.sin(d.t * 6), fl = Math.floor(d.t * 20);
  const list = [];
  const put = (lx, ly, col, size) => { ly *= flip; list.push([d.x + (lx * ca - ly * sa) * K, d.y + (lx * sa + ly * ca) * K, col, size]); return list.length - 1; };
  const out = { list };
  // the wings first, so the body is drawn over them: four ribs and the skin between
  for (const side of [-1, 1]) {
    const tip = [-10 + flap * 2, (-19 * Math.abs(flap) - 7) * side * (side > 0 ? 0.7 : 1)], roots = [[-3, 0], [-8, 0], [-13, 0], [-18, 0]];
    const rib = (r, f) => [r[0] + (tip[0] - r[0]) * f, r[1] + (tip[1] - r[1]) * f];
    for (let j = 0; j + 1 < roots.length; j++) for (let i = 1; i < 12; i++) for (const m of [0.33, 0.66]) { const a = rib(roots[j], i / 12), b = rib(roots[j + 1], i / 12); put(a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m, (i + j + fl) % 6 ? '#a8301a' : '#e8501e', 1); }
    for (const r of roots) for (let i = 1; i <= 16; i++) { const [x, y] = rib(r, i / 16); const k = put(x, y, r === roots[0] ? '#ffb040' : (i + fl) % 5 ? '#ff6a24' : '#ffb040', r === roots[0] ? 1.6 : 1.2); if (i === 16) out[side < 0 ? 'wingL' : 'wingR'] = k; }
  }
  // the body and tail, snaking, thick at the shoulders
  for (let k = 0; k < 68; k++) { const lx = -k * 0.7, ly = Math.sin(k * 0.18 - d.t * 7) * 3.5 * (k / 68), c = k < 7 ? '#fff0a0' : (Math.floor(k / 2) + fl) % 4 ? '#ff5a2a' : '#ffc040'; put(lx, ly, c, k < 16 ? 2.8 : k < 44 ? 2.1 : 1.3); if (k > 4 && k < 40 && k % 6 === 0) put(lx, ly - 1.5, '#ffd060', 1.1); out.tail = list.length - 1; }
  for (const [lx, ly] of [[-48, -1.2], [-49, 0], [-48, 1.2]]) put(lx + Math.sin(d.t * 7) * 0.5, ly, '#ffc040', 1.2);
  // the head, horns and jaw, and an eye
  for (const [lx, ly] of [[1.5, -1.5], [3, -1.8], [4.5, -1.2], [6, -0.6], [7, 0.3], [5.5, 1.3], [3.5, 1.4], [1.5, 1], [0, -3], [-1, -4.4], [1.4, -3.8], [4.3, 0.1]]) put(lx, ly, '#fff4c0', 1.7);
  put(4.2, -0.7, '#3a0c04', 1.1);
  return out;
}
function drawDragon(ctx, d) {
  const hp = (v) => Math.round(v * RS) / RS;
  const { list } = dragonPoints(d);
  ctx.globalAlpha = 0.22;
  for (const [x, y, col, s] of list) { ctx.fillStyle = col; ctx.fillRect(hp(x - s * 1.6), hp(y - s * 1.6), hp(s * 3.2), hp(s * 3.2)); }
  ctx.globalAlpha = 1;
  for (const [x, y, col, s] of list) { ctx.fillStyle = col; ctx.fillRect(hp(x - s / 2), hp(y - s / 2), hp(s), hp(s)); }
}
function wizShowTick(dt) {
  const S = Wiz.show;
  if (S) {
    S.t += dt;
    while (S.plan.length && S.plan[0].at <= S.t) {
      const p = S.plan.shift();
      if (p.kind === 'dragon') { S.dragon = { t: 0, dur: 11 }; Sound.whoosh(); }
      else wizRocket(p.x, S.y, p.kind);
    }
    if (S.dragon && !dragonTick(S.dragon, dt)) S.dragon = null;
    if (!S.plan.length && !S.dragon) Wiz.show = null;
  }
  if (!WP.parts.length) return;
  const out = [];
  for (const p of WP.parts) {
    p.t += dt;
    if (p.t < 0) { out.push(p); continue; }
    if (p.t >= p.life) { if (p.k === 'rocket') wizBurst(p.x, p.y, p.cols, p.kind); continue; }
    const k = Math.pow(p.drag, dt * 60);
    p.vx *= k; p.vy *= k; p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.k === 'rocket' && Math.random() < 0.9) WP.add({ x: p.x, y: p.y + 2, vx: R.f(-6, 6), vy: R.f(8, 20), life: 0.5, col: '#ffd890', size: 0.6, g: 12 });
    if (p.trail && Math.random() < dt * 9) WP.add({ x: p.x, y: p.y, vy: 6, life: 0.7, col: p.col2 || '#ffcf80', size: 0.6, g: 10 });
    out.push(p);
  }
  WP.parts = out;
}
function drawWizParts(ctx) {
  const hp = (v) => Math.round(v * RS) / RS;
  if (Wiz.show && Wiz.show.dragon && Wiz.show.dragon.x != null) drawDragon(ctx, Wiz.show.dragon);
  for (const p of WP.parts) {
    if (p.t < 0) continue;
    const f = p.t / p.life, x = hp(p.x), y = hp(p.y);
    if (p.k === 'flash') { ctx.globalAlpha = (1 - f) * 0.35; disc(ctx, Math.round(x), Math.round(y), Math.round(10 + f * 26), p.col); continue; }
    if (p.k === 'rocket') { ctx.globalAlpha = 1; ctx.fillStyle = '#fff2c0'; ctx.fillRect(x, y, 1, 2.5); ctx.fillStyle = '#ffb040'; ctx.fillRect(x, y + 2.5, 1, 1.5); continue; }
    const a = (1 - f * f) * (p.twinkle && Math.sin(p.t * 40 + p.x) < 0 ? 0.25 : 1), sz = p.size * (f < 0.5 ? 1 : 1 - (f - 0.5) * 0.9), s = Math.max(0.5, hp(sz));
    if (sz >= 1) { ctx.globalAlpha = a * 0.28; ctx.fillStyle = p.col; ctx.fillRect(hp(x - s * 1.5), hp(y - s * 1.5), hp(s * 3), hp(s * 3)); }
    ctx.globalAlpha = a; ctx.fillStyle = p.col; ctx.fillRect(hp(x - s / 2), hp(y - s / 2), s, s);
    if (f < 0.35 && sz >= 1.2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 0.5, 0.5); }
  }
  ctx.globalAlpha = 1;
}
function wizLights(out) {
  for (const p of WP.parts) {
    if (p.t < 0) continue;
    const f = p.t / p.life;
    if (p.k === 'flash') out.push({ x: p.x, y: p.y, r: 320 * (1 - f) + 80, a: 0.95 * (1 - f), col: p.col });
    else if (p.light) out.push({ x: p.x, y: p.y, r: 40, a: 0.75 * (1 - f), col: p.col });
    else if (p.k === 'rocket') out.push({ x: p.x, y: p.y, r: 18, a: 0.6 });
  }
  const d = Wiz.show && Wiz.show.dragon;
  if (d && d.x != null) out.push({ x: d.x, y: d.y, r: 160, a: 0.8, col: '#ff8a3a' });
}

// --- Dev and hover ---------------------------------------------------------------------
function wizardStatus() {
  const w = wizard();
  if (!w) return `away (last came on day ${Game.wizardLast > 0 ? Game.wizardLast : 'never'}${Game.day - Game.wizardLast < WIZARD.gap ? `; can't come again before day ${Game.wizardLast + WIZARD.gap}` : ''})`;
  if (w.phase === 'coming') return 'driving into the valley';
  if (w.phase === 'going') return 'driving away';
  return `here till day ${w.leave}, ${{ tale: 'telling a tale', totale: 'on his way to tell a tale', show: 'at the fireworks', party: 'at the party', wander: 'wandering the village', sleep: 'in his wagon', leave: 'packing up', wagon: 'by his wagon' }[w.doing] || w.doing}${w.told.length ? `; told ${w.told.map((k) => 'the tale ' + WIZARD_TALES[k].x).join(', ')}` : ''}`;
}
function wizardDev(act) {
  const w = wizard();
  switch (act) {
    case 'wizard': if (!w) wizardArrive(); else if (w.phase === 'coming') { w.x = w.camp.x; w.y = w.camp.y; w.path = null; wizardParked(); } break;
    case 'wizardtale': if (!w) { wizardArrive(); wizard().x = wizard().camp.x; wizard().y = wizard().camp.y; wizard().path = null; wizardParked(); } wizardStartTale(true); summonListeners(wizard()); break;
    case 'wizardshow': { const s = wizardShowSpot(); wizardShow(s.x, s.y); break; }
    case 'playwizard': {
      Game.mode = playMode() ? 'steward' : 'wizard';
      document.body.classList.toggle('wizmode', playMode());
      const ww = wizard();
      if (playMode()) { if (!ww) wizardBegin(); else if (ww.phase === 'here') { ww.leave = 1e9; ww.doing = 'player'; ww.fpath = null; } Game.follow = true; selectVillager(null); }
      else if (ww && ww.phase === 'here') ww.leave = Game.day + 1;
      break;
    }
    case 'wizardgo': if (w && w.phase === 'here') wizardDepart(); else if (w) wizardGone(); break;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // (save.js comes later in the page, so the fields are declared once it has)
  registerField('wizard', null, { nullish: true });
  registerField('wizardLast', -99);
  // he walks and drives with the clock
  patch(window, 'updateRabbits', (ur) => function (dtMin, season, hour) { ur.apply(this, arguments); wizardTick(dtMin, hour); }, 'wizard');
  // the show and the dragon run with the particles
  patch(FX, 'update', (up) => function (dt, game) { wizShowTick(dt); return up.apply(this, arguments); }, 'wizard');
  patch(FX, 'draw', (draw) => function (ctx, emissive) { const r = draw.apply(this, arguments); if (emissive) drawWizParts(ctx); return r; }, 'wizard');
  patch(FX, 'lights', (lights) => function (out) { const r = lights.apply(this, arguments); wizLights(out); return r; }, 'wizard');
  // while he's here, the party's fireworks are his, once a night
  patch(window, 'fireworkShow', (fs) => function (x, y, n) { if (wizardHere() && wizard().showDay !== Game.day) return wizardShow(x, y); return fs.apply(this, arguments); }, 'wizard');
  // a wizard's tale is worth an hour off work
  SHIFT_OK.add('wizard_tale');
  // folk listening to him aren't to be called away for a natter
  patch(Villager.prototype, 'isBusyForChat', (busy) => function () { return (this.task && this.task.a.id === 'wizard_tale') || busy.apply(this, arguments); }, 'wizard');
  patch(window, 'placeAt', (pa) => function (wx, wy) {
    const w = wizard();
    if (w && !Wiz.speaker.hidden) {
      const fx = w.phase === 'here' ? w.fx : w.x, fy = w.phase === 'here' ? w.fy : w.y - 10;
      if (Math.abs(wx - fx) < 9 && wy < fy + 2 && wy > fy - 50) return [WIZARD.title, 'A wizard, visiting from far away', wizardStatus()];
      if (Math.abs(wx - w.x) < 38 && wy < w.y + 2 && wy > w.y - 34) return ['Gandalf\'s wagon', 'Stacked with crates of fireworks, each marked with his rune'];
    }
    return pa.apply(this, arguments);
  }, 'wizard');
  addHook('onHour', (h) => {
    // he comes when he pleases: never two visits too close together, and seldom in the wet or the snow
    if (h === 9 && !wizard() && !(typeof playMode === 'function' && playMode()) && Game.day >= 3 && Game.day - Game.wizardLast >= WIZARD.gap && !Game.raining && R.chance(WIZARD.chance * (World.season === 'winter' ? 0.5 : 1))) wizardArrive();
    // a party every night he's in town, unless one's planned anyway
    const w = wizard();
    if (h === 12 && w && w.phase === 'here' && w.day !== Game.day && w.leave > Game.day && w.leave < 1e9 && !Game.party.on) wizardPartyTonight();
    // and the night he arrives there's always one, rain or no rain: he sees to the rain
    if (h === 18 && w && w.day === Game.day && !Game.party.on) {
      if (Game.raining) { Game.weather = 'clear'; Game.raining = false; Game.rainUntil = Game.time; chronicle('The wizard rapped his staff on the ground, and the rain stopped as if a tap had been turned off. "There," he said. "Now we can have a party."', 'party'); }
      startParty(Game.party.planned || 'wizard');
    }
    // and his fireworks go up on his first night whatever the sky is doing
    if (h === 22 && w && w.phase === 'here' && Game.party.on && w.showDay !== Game.day) { const sp = wizardShowSpot(); wizardShow(sp.x, sp.y); }
  });
  addHook('newVillage', () => { Game.wizard = null; Game.wizardLast = -99; Wiz.seats = []; Wiz.show = null; });
});
