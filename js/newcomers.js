'use strict';
// ---------------------------------------------------------------------------
// Newcomers. Nobody walks into Thistledown with a home and a trade waiting.
// Whoever arrives (through a rift, or up the West Road) is a stranger: they
// don't know where anything is or who anybody is. They go up to folk and ask
// questions (the wary make their excuses, especially with the rift-folk),
// and find their way round the landmarks. At night they ask at the inn for a
// bed, and may be turned away and have to sleep rough under a tree, until
// someone kindly offers them a room. Once they know enough faces and places
// they find their feet: they take up a trade and, when a hole is free, a
// home of their own.
// ---------------------------------------------------------------------------

// Where the homeless "live": not a real place, so nothing is ever sent there.
const NOWHERE = {
  id: -1, kind: 'nowhere', name: 'no home yet', built: false, pantry: emptyPantry(), plots: [], inside: [], bench: null,
  crafts: {}, collection: {}, cropType: 'cabbage', stepX: 0, stepY: 0, doorX: 0, doorY: 0,
};
Villager.prototype.home = function () { return World.homes[this.homeId] || NOWHERE; };
function homeless(v) { return !World.homes[v.homeId]; }

const NEED_FACES = 5, NEED_PLACES = 5;
function startNewcomer(v) {
  v.homeId = -1;
  v.job = null;
  v.newcomer = { day: Game.day, met: [], places: [], refused: 0, rough: 0, lodged: 0 };
}

// The landmarks a newcomer gets to know.
function landmarks() {
  const B = World.buildings, out = [];
  const add = (key, name, x, y) => { if (x != null) out.push({ key, name, x, y }); };
  for (const [k, n] of [['inn', 'the inn'], ['store', 'the Common Store'], ['mill', 'the mill'], ['bakery', 'the Bakehouse'], ['brewhouse', 'the brewhouse'], ['barn', 'the granary'], ['herbalist', 'the herbalist\'s'], ['workshop', 'the workshop'], ['relay', 'the Relay Mast']]) {
    const b = k === 'inn' ? World.inn : B[k];
    if (b) add(k, n, b.stepX, b.stepY + 6);
  }
  if (World.wellSpot) add('well', 'the well', World.wellSpot.x, World.wellSpot.y + 6);
  if (World.storyteller) add('oak', 'the old oak', World.storyteller.x, World.storyteller.y + 14);
  add('party', 'the party field', PARTY.danceX * 16, (PARTY.danceY + 1) * 16);
  return out;
}

const ASK_RIFT = ['Excuse me, what is this place called?', 'Where do you charge things around here?', 'Is there anywhere I could sleep tonight?', 'What do people do for work here?', 'Who\'s in charge here?',
  'Is the water safe to drink?', 'What\'s that big wheel thing by the river?', 'Sorry, is this a simulation?', 'Where does everyone get their food?'];
const ASK_ROAD = ['Is there an inn hereabouts?', 'Who might want a hand with some work?', 'What\'s the name of this village?', 'Is there a spare hole going, do you know?', 'Where\'s the market?'];
const ANSWERS = [
  ['This is Thistledown, friend. Welcome!', null], ['The Tipsy Badger has beds, if the innkeeper likes the look of you.', 'inn'],
  ['Charge? Like a bull? No idea, sorry.', null], ['The mill\'s down by the river. Lovely spot.', 'mill'], ['Ask at the Common Store, they always want hands.', 'store'],
  ['Nobody\'s in charge, exactly. We muddle along.', null], ['Fresh bread at the Bakehouse every morning.', 'bakery'], ['Water? Try the well. Best water in the Shire.', 'well'],
  ['The old oak\'s where the little ones have their stories.', 'oak'], ['There\'s a do in the party field most weeks.', 'party'],
];

// One exchange of a newcomer's questions and the answer they get.
function askExchange(asker, other, task) {
  if (task.data.answer) {
    const [text, place] = task.data.answer;
    task.data.answer = null;
    other.say(text, 3.6);
    if (place && asker.newcomer && !asker.newcomer.places.includes(place)) asker.newcomer.places.push(place);
    return;
  }
  asker.say(R.pick(asker.isRiftborn() ? ASK_RIFT : ASK_ROAD), 3.6);
  // the wary give short answers
  task.data.answer = other.isRiftborn() || riftWary(other) < 0.4 || !asker.isRiftborn() ? R.pick(ANSWERS) : [R.pick(['Er. Couldn\'t say.', 'Hmm? Oh. Not sure.', 'Best ask someone else.']), null];
}
// After a proper talk: one more face they know.
function newcomerMet(v, o) {
  const n = v.newcomer;
  if (!n || !o || n.met.includes(o.id)) return;
  n.met.push(o.id);
  if (n.met.length === 1) v.remember(`${o.first} stopped and talked to me. The first friendly face here.`, 2);
  checkFound(v);
}
function checkFound(v) {
  const n = v.newcomer;
  if (!n || n.met.length < NEED_FACES || n.places.length < NEED_PLACES) return;
  v.newcomer = null;
  v.remember('I know my way around now, and a few faces. Thistledown is starting to feel less strange.', 2);
  chronicle(`${v.name()} has found ${v.pron.their} feet in Thistledown: ${v.pron.they} knows ${n.met.length} folk by name and the way to ${n.places.length} places, and is looking for work.`, v.isRiftborn() ? 'rift' : 'info');
  devLog('homes', `${v.first} is settled in (${n.met.length} faces, ${n.places.length} places, ${n.rough} nights rough, ${n.lodged} at the inn)`);
  assignJobs(true);
}

// Who'll take a stranger in for the night?
function innLodgers(inn) { return Game.villagers.filter((o) => o.task && o.task.a.id === 'lodge' && o.task.target.building === inn).length; }
function lodgingAnswer(v, inn) {
  if (v.lodgeDay === Game.day) return true;
  if (v.refusedDay === Game.day) return false;
  if (innLodgers(inn) >= 3) return false;
  const keeper = Game.villagers.find((o) => o.job === 'innkeeper' && o.inside === inn);
  const warm = keeper ? (1 - riftWary(keeper)) * 0.45 + (keeper.rel[v.id] || 0) * 0.6 + keeper.genes.sociability * 0.15 : 0.3;
  const p = v.isRiftborn() ? 0.12 + warm + (v.newcomer ? v.newcomer.met.length * 0.04 : 0.3) : 0.75;
  const yes = R.chance(clamp(p, 0.05, 0.95));
  if (yes) v.lodgeDay = Game.day; else v.refusedDay = Game.day;
  if (keeper) keeper.say(yes ? R.pick(['There\'s a room at the back. Mind the low beam.', 'Bed\'s made up. Breakfast\'s at seven.']) : R.pick(['Sorry, we\'re full up tonight.', 'No room, I\'m afraid. Try tomorrow.', 'Not tonight. Not for your sort.']), 3);
  devLog('homes', `${v.first} asked for a bed at the inn → ${yes ? 'given one' : 'turned away'} (chance ${Math.round(clamp(p, 0.05, 0.95) * 100)}%)`);
  return yes;
}
function roughSpot(v) {
  const s = World.riftScars.length && v.isRiftborn() && R.chance(0.4) ? R.pick(World.riftScars) : null;
  if (s) return randomNearby(v, 1.5, s.x, s.y + 8);
  const shade = World.shade.length ? World.shade.slice().sort((a, b) => dist(a.x, a.y, v.x, v.y) - dist(b.x, b.y, v.x, v.y))[Math.floor(Math.random() * 3)] : null;
  return shade ? { x: shade.x, y: shade.y, facing: 'down' } : randomNearby(v, 6);
}

// Each morning: anyone without a home may be offered a bed by a friendly
// household, and those who've found their feet move into a free hole.
function newcomersDaily() {
  for (const v of Game.villagers) {
    if (v.leaving || !homeless(v) || v.stage === 'baby') continue;
    const found = !v.newcomer;
    const empty = World.homes.filter((h) => h.built && residentsOf(h).length === 0);
    if (found && empty.length) {
      const h = empty[0];
      moveHome(v, h);
      chronicle(`${v.name()} has been given ${h.name}, standing empty, to call ${v.pron.their} own.`, v.isRiftborn() ? 'rift' : 'build');
      v.remember(`Moved into ${h.name}. A home of my own at last.`, 3);
      continue;
    }
    // a kindly household with room to spare offers a bed
    const offers = World.homes.filter((h) => h.built && residentsOf(h).length > 0 && residentsOf(h).length < HOME_CAP(h)).map((h) => {
      const host = residentsOf(h).filter((o) => o.isGrown()).sort((a, b) => (b.rel[v.id] || 0) - (a.rel[v.id] || 0))[0];
      return host ? [h, host, (host.rel[v.id] || 0) + host.genes.sociability * 0.3 - riftWary(host) * (v.isRiftborn() ? 0.6 : 0)] : null;
    }).filter((x) => x && x[2] > 0.42).sort((a, b) => b[2] - a[2]);
    if (offers.length && R.chance(found ? 0.8 : 0.4)) {
      const [h, host] = offers[0];
      moveHome(v, h);
      chronicle(`${host.first} has taken ${v.first} in as a lodger at ${h.name}${v.isRiftborn() ? ', the first hill-folk household to give one of the rift-folk a roof' : ''}.`, v.isRiftborn() ? 'rift' : 'info');
      v.remember(`${host.first} offered me a bed at ${h.name}. I could have cried.`, 3);
      host.remember(`Took ${v.first} in as a lodger.`, 1);
      v.bond(host, 0.12);
    } else if (found) Village.wantHomes = Math.max(Village.wantHomes || 0, 1);
  }
}

// ----- the newcomer's actions -----
Object.assign(ACTIONS, {
  ask_around: {
    label: 'Asking around', icon: 'chat', sat: { lonely: -0.4, bored: -0.3 }, dur: 25, pose: 'stand', social: true, pair: true, stages: AWAKE,
    label2: (v) => (v.task && v.task.target.other ? `Asking ${v.task.target.other.first} the way` : 'Asking around'),
    avail: (v) => !!v.newcomer,
    extra: (v) => 0.55 - v.newcomer.met.length * 0.07,
    time: (h) => (h >= 7 && h < 21 ? 1 : 0.05),
    target: (v) => {
      let best = null, bd = 32 * 16;
      for (const o of Game.villagers) {
        if (o === v || o.inside || o.leaving || o.newcomer || o.stage === 'baby' || o.isBusyForChat() || v.newcomer.met.includes(o.id)) continue;
        const d = dist(v.x, v.y, o.x, o.y) + Math.random() * 60;
        if (d < bd) { bd = d; best = o; }
      }
      return best ? { other: best } : null;
    },
  },
  explore: {
    label: 'Finding their way around', icon: null, sat: { bored: -0.35 }, dur: 8, pose: 'stand', outdoor: true, stages: AWAKE,
    label2: (v) => (v.task && v.task.target.place ? `Looking for ${v.task.target.place.name}` : 'Finding their way around'),
    avail: (v) => !!v.newcomer && landmarks().some((l) => !v.newcomer.places.includes(l.key)),
    extra: () => 0.3,
    time: (h) => (isDay(h) ? 1 : 0.1),
    target: (v) => {
      const ls = landmarks().filter((l) => !v.newcomer.places.includes(l.key)).sort((a, b) => dist(a.x, a.y, v.x, v.y) - dist(b.x, b.y, v.x, v.y));
      const l = ls[Math.floor(Math.random() * Math.min(2, ls.length))];
      return l ? { x: l.x + R.i(-8, 8), y: l.y, facing: 'up', place: l } : null;
    },
    done: (v, task) => {
      const l = task.target.place;
      if (!l || !v.newcomer) return;
      if (!v.newcomer.places.includes(l.key)) v.newcomer.places.push(l.key);
      v.say(v.isRiftborn() ? R.pick([`So this is ${l.name}. Noted.`, `Mapping ${l.name}... done.`, `${l.name[0].toUpperCase() + l.name.slice(1)}. Got it.`]) : `Ah, ${l.name}.`, 2.8);
      checkFound(v);
    },
  },
  // a bed at the inn for the night, if they'll have you
  lodge: {
    ...ACTIONS.sleep, label: 'Lodging at the inn', icon: 'zzz',
    avail: (v) => homeless(v) && v.refusedDay !== Game.day,
    target: (v) => ({ building: nearestInn(v) }),
    start: (v, task) => {
      if (lodgingAnswer(v, task.target.building)) { if (v.newcomer) v.newcomer.lodged++; return true; }
      v.say(R.pick(['Right. Fine. I\'ll find somewhere.', 'Not even a corner by the fire?', 'Low battery. Low everything.']), 3);
      v.remember('Turned away from the inn. Nowhere to sleep.', -2);
      if (v.newcomer) v.newcomer.refused++;
      return false;
    },
  },
  // under a tree, or by the rift scar where they came through
  sleep_rough: {
    ...ACTIONS.sleep, label: 'Sleeping rough', icon: 'zzz', pose: 'sit', outdoor: true, zzz: true,
    avail: (v) => homeless(v),
    target: (v) => roughSpot(v),
    tick: (v, task, dt, h) => {
      // a cold, broken sleep
      v.drives.tired = Math.max(0, v.drives.tired - dt * (0.1 / 60));
      v.drives.cold = Math.min(1, v.drives.cold + dt * 0.0015);
      if (v.drives.tired < 0.08 && h >= 6 && h < 20) task.t = 0;
      if (h >= 6.5 && h < 20) task.t = Math.min(task.t, 1);
    },
    done: (v) => { if (v.newcomer) v.newcomer.rough++; if (R.chance(0.4)) v.remember(R.pick(['Slept under a hedge. Cold, and the dew got everywhere.', 'Another night out of doors.']), -1); },
  },
});
ACTIONS.sleep_rough.time = (h, v) => (isNight(h) || h >= 21 ? 4 : v.drives.tired > 0.85 ? 1 : 0.02);
ACTIONS.lodge.time = (h, v) => (isNight(h) || h >= 20.5 ? 4.5 : v.drives.tired > 0.85 ? 1 : 0.02);
for (const k of ['ask_around', 'explore', 'lodge', 'sleep_rough']) ACTIONS[k].id = k;
Object.assign(ACTION_NAMES, { ask_around: 'Asking around', explore: 'Exploring', lodge: 'Lodging at the inn', sleep_rough: 'Sleeping rough' });
// what someone without a home of their own can't do
const HOMELESS_NO = new Set(['sleep', 'eat_home', 'tea', 'potter', 'market', 'garden', 'bake_home', 'tend_baby', 'bedtime_story', 'work_nanny']);
