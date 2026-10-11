'use strict';
// ---------------------------------------------------------------------------
// Hobbies. Everyone past their little years has a pastime or two of their
// own, picked from their nature: wood-carving, basket-weaving, pottery,
// knitting, painting, collecting, birdwatching. Each has its own skill that
// grows with practice, some need gathering for (reeds and clay down by the
// river), and what they make stays in the house: carvings on the workshop
// shelves, baskets in a heap, pots, knitted throws, paintings on the walls, a
// curio cabinet of river stones, shells, pressed flowers and old coins. Now
// and then a piece goes to a friend as a present. Hobbies are a real choice
// against the inn and the pipe: they ease boredom well and give a quiet
// sense of having made something.
// ---------------------------------------------------------------------------

const HOBBIES = {
  carving: { label: 'Wood-carving', kid: 'Whittling', icon: 'axe', craft: true, made: ['carved animal', 'carved animals'],
    w: (v, g) => g.apt.woodcraft * 1.2 + (1 - g.laziness) * 0.4 },
  basketry: { label: 'Basket-weaving', icon: 'basket', craft: true, made: ['basket', 'baskets'], gather: 'reeds',
    w: (v, g) => g.apt.farming * 0.6 + g.apt.herbalism * 0.5 + (1 - g.temper) * 0.4 },
  pottery: { label: 'Pottery', icon: 'cup', craft: true, made: ['pot', 'pots'], gather: 'clay',
    w: (v, g) => g.wit * 0.4 + g.curiosity * 0.3 + g.apt.cooking * 0.5 },
  knitting: { label: 'Knitting', icon: 'heart', made: ['knitted thing', 'knitted things'],
    w: (v, g) => (1 - g.temper) * 0.6 + g.sociability * 0.3 + (v.stage === 'elder' ? 0.6 : 0) },
  painting: { label: 'Painting', kid: 'Drawing', icon: 'book', made: ['painting', 'paintings'],
    w: (v, g) => g.curiosity * 0.6 + g.wit * 0.4 + v.edu * 0.6 },
  collecting: { label: 'Collecting', icon: 'basket', made: ['find', 'finds'],
    w: (v, g) => g.curiosity * 0.9 + (v.isChild() ? 0.7 : 0) },
  birdwatching: { label: 'Birdwatching', icon: 'book', made: ['bird spotted', 'birds spotted'],
    w: (v, g) => g.curiosity * 0.5 + v.edu * 0.5 + (v.stage === 'elder' ? 0.4 : 0) + (1 - g.sociability) * 0.3 },
};
const KID_HOBBIES = ['collecting', 'painting', 'birdwatching', 'carving'];
const COLLECT_KINDS = {
  stones: ['river stone', 'river stones'], shells: ['snail shell', 'snail shells'], flowers: ['pressed flower', 'pressed flowers'],
  butterflies: ['butterfly sketch', 'butterfly sketches'], feathers: ['feather', 'feathers'], conkers: ['conker', 'conkers'],
  coins: ['old coin', 'old coins'], trinkets: ['rift trinket', 'rift trinkets'],
};
const BIRDS = ['robin', 'wren', 'blackbird', 'song thrush', 'goldfinch', 'chaffinch', 'blue tit', 'great tit', 'long-tailed tit', 'goldcrest', 'nuthatch',
  'treecreeper', 'jay', 'magpie', 'rook', 'jackdaw', 'barn owl', 'tawny owl', 'kestrel', 'buzzard', 'sparrowhawk', 'heron', 'kingfisher', 'moorhen', 'mallard',
  'swallow', 'house martin', 'swift', 'cuckoo', 'skylark', 'yellowhammer', 'bullfinch', 'greenfinch', 'linnet', 'dunnock', 'pied wagtail', 'grey wagtail',
  'dipper', 'woodpecker', 'green woodpecker', 'wood pigeon', 'collared dove', 'pheasant', 'partridge', 'lapwing', 'curlew', 'snipe', 'redwing', 'fieldfare',
  'waxwing', 'starling', 'house sparrow', 'tree sparrow', 'reed bunting', 'sedge warbler', 'chiffchaff', 'willow warbler', 'blackcap', 'nightingale', 'hoopoe'];

// Who's old enough for a hobby: grown-ups, and children of eight and over.
function hobbyAge(v) { return v.isGrown() || (v.isChild() && v.years() >= 8); }
// A villager's hobbies, picked the first time they're old enough. Stable for
// each villager, and saved with them.
function hobbiesOf(v) {
  if (v.hobbies && v.hobbies.length) return v.hobbies;
  if (!hobbyAge(v)) return [];
  const rnd = mulberry32(v.id * 7919 + 3);
  const keys = v.isChild() ? KID_HOBBIES.filter((k) => k !== 'carving' || v.years() >= 12) : Object.keys(HOBBIES);
  const pick = (from) => {
    const opts = from.map((k) => [Math.max(0.05, HOBBIES[k].w(v, v.genes)) * (0.6 + rnd() * 0.8), k]);
    const tot = opts.reduce((s, o) => s + o[0], 0);
    let r = rnd() * tot;
    for (const [w, k] of opts) { r -= w; if (r <= 0) return k; }
    return opts[0][1];
  };
  const first = pick(keys);
  const out = [first];
  if (rnd() < (v.isChild() ? 0.25 : 0.55)) out.push(pick(keys.filter((k) => k !== first)));
  v.hobbies = out;
  v.hobbySkill = v.hobbySkill || {};
  return out;
}
function hasHobby(v, k) { return hobbyAge(v) && hobbiesOf(v).includes(k); }
function hobbyName(v, k) { return (v.isChild() && HOBBIES[k].kid) || HOBBIES[k].label; }
function hobbySkillWord(n) { return n >= 75 ? 'masterly' : n >= 45 ? 'skilled' : n >= 20 ? 'getting the knack' : 'just starting'; }

// What a household has made and gathered.
function homeCrafts(h) { return h.crafts || (h.crafts = {}); }
function homeCollection(h) { return h.collection || (h.collection = {}); }
function collectionTotal(h) { return Object.values(homeCollection(h)).reduce((s, n) => s + n, 0); }

// Finished a piece: into the house, with a milestone or a present now and then.
function madePiece(v, k, extra = '') {
  const home = v.home(), C = homeCrafts(home), H = HOBBIES[k];
  C[k] = Math.min(60, (C[k] || 0) + 1);
  v.stats['made_' + k] = (v.stats['made_' + k] || 0) + 1;
  const n = v.stats['made_' + k];
  if ([10, 25, 50].includes(n)) {
    v.remember(`Finished my ${n}th ${H.made[0]}.`, 2);
    chronicle(`${v.name()} has made ${n} ${H.made[1]} now. ${{ carving: 'A whole menagerie lines the shelves', basketry: 'There are baskets in every corner', pottery: `Every jar in the house is one of ${v.genes.sex === 'f' ? 'hers' : 'his'}`, knitting: 'Nobody in the family goes cold', painting: 'The walls are filling up with the valley in every season' }[k] || 'It\'s quite a collection'} at ${home.name}.`, 'learn');
  }
  // a present for a friend in another hole
  if (R.chance(0.22)) {
    const f = Object.entries(v.rel).filter(([, r]) => r > 0.45).map(([id]) => personById(+id)).filter((o) => o && o.homeId !== v.homeId && !o.leaving && o.stage !== 'baby');
    if (f.length) {
      const o = R.pick(f), what = extra || H.made[0];
      C[k] = Math.max(0, C[k] - 1);
      const OC = homeCrafts(o.home()); OC[k] = Math.min(60, (OC[k] || 0) + 1);
      o.remember(`${v.first} gave me a ${what} they made.`, 2);
      feel(o, 'present', v.first); feel(v, 'gave_gift', o.first);
      v.bond(o, 0.05);
      devLog('story', `${v.first} gave ${o.first} a ${what}`);
    }
  }
}

// Places for the out-of-doors ones.
function riverSpot(v) {
  const s = World.fishing.length ? R.pick(World.fishing) : null;
  if (!s) return randomNearby(v, 10);
  return randomNearby(v, 1.5, s.x, s.y - 4) || { x: s.x, y: s.y };
}
function meadowSpot(v) { return strollTarget(v); }
function treeSpot(v) { const s = World.shade.length ? R.pick(World.shade) : null; return s ? randomNearby(v, 1.5, s.x, s.y) : strollTarget(v); }
const fair = () => !Game.raining && World.season !== 'winter';

function hobbyAction(k, def) {
  const H = HOBBIES[k];
  return {
    label: H.label, icon: H.icon, sat: { bored: -0.6, industry: -0.15, ...(def.sat || {}) }, dur: def.dur || 50, pose: def.pose || 'inside', stages: AWAKE, hobby: k,
    label2: (v) => {
      const tg = v.task && v.task.target;
      if (def.label2) { const l = def.label2(v, tg); if (l) return l; }
      return hobbyName(v, k);
    },
    // without a home of their own, only what can be done out of doors right now
    avail: (v, h) => hasHobby(v, k) && (!def.avail || def.avail(v, h)) && (!!World.homes[v.homeId] || !def.homeless || def.homeless(v, h)),
    extra: (v) => 0.13 + ((v.hobbySkill && v.hobbySkill[k]) || 0) / 400,
    trait: (v) => 0.55 + Math.min(1.2, H.w(v, v.genes)) * 0.5,
    time: def.time || ((h) => (h >= 7 && h < 22 ? 1 : 0.1)),
    target: (v, h) => def.target(v, h),
    tick: (v, task, dt) => {
      v.hobbySkill = v.hobbySkill || {};
      const cur = v.hobbySkill[k] || 0;
      v.hobbySkill[k] = Math.min(100, cur + dt * 0.04 * (0.5 + H.w(v, v.genes) * 0.5) * (1 - cur / 110));
      if (def.tick) def.tick(v, task, dt);
    },
    done: (v, task) => def.done(v, task, 0.6 + ((v.hobbySkill && v.hobbySkill[k]) || 0) / 100),
    outdoor: def.outdoor,
  };
}
// At home, in the workshop; or, on a fine day, on the bench outside.
const benchWeather = () => fair() && Game.hour > 9 && Game.hour < 19;
const homeOrBench = (prop) => (v) => (benchWeather() && (!World.homes[v.homeId] || R.chance(0.4)) ? { poseOverride: 'sit', ...benchTarget(v, true), prop } : { building: v.home() });

Object.assign(ACTIONS, {
  hobby_carving: hobbyAction('carving', {
    target: homeOrBench('whittle'), homeless: benchWeather,
    label2: (v, tg) => (tg && tg.building ? 'Carving at the workbench' : v.isChild() ? 'Whittling a stick' : 'Whittling on the bench'),
    done: (v, task, q) => {
      task.data.p = (v.carvePart || 0) + 0.65 * q;
      v.carvePart = task.data.p;
      if (v.carvePart >= 1) { v.carvePart = 0; const what = R.pick(['badger', 'owl', 'rabbit', 'hedgehog', 'pig', 'fox', 'dragon', 'pony', 'frog']); madePiece(v, 'carving', `carved ${what}`); if (!v.inside) v.say(`Look, a little wooden ${what}!`); }
    },
  }),
  hobby_basketry: hobbyAction('basketry', {
    homeless: (v) => ((v.hobbyMat && v.hobbyMat.reeds) >= 3 ? benchWeather() : fair()),
    target: (v) => ((v.hobbyMat && v.hobbyMat.reeds) >= 3 ? homeOrBench('basket')(v) : fair() ? { ...riverSpot(v), gather: 'reeds', prop: 'basket', poseOverride: 'work', facing: 'up' } : null),
    label2: (v, tg) => (tg && tg.gather ? 'Cutting reeds by the river' : 'Weaving a basket'),
    done: (v, task, q) => {
      const m = v.hobbyMat || (v.hobbyMat = {});
      if (task.target.gather) { m.reeds = (m.reeds || 0) + R.i(4, 7); return; }
      m.reeds = Math.max(0, (m.reeds || 0) - 3);
      madePiece(v, 'basketry', q > 1.2 ? 'fine willow basket' : 'basket');
    },
  }),
  hobby_pottery: hobbyAction('pottery', {
    homeless: (v) => !((v.hobbyMat && v.hobbyMat.clay) >= 2) && fair(),
    target: (v) => ((v.hobbyMat && v.hobbyMat.clay) >= 2 ? { building: v.home() } : fair() ? { ...riverSpot(v), gather: 'clay', prop: 'basket', poseOverride: 'work', facing: 'up' } : null),
    label2: (v, tg) => (tg && tg.gather ? 'Digging clay from the riverbank' : 'At the potter\'s wheel'),
    done: (v, task, q) => {
      const m = v.hobbyMat || (v.hobbyMat = {});
      if (task.target.gather) { m.clay = (m.clay || 0) + R.i(3, 5); return; }
      m.clay = Math.max(0, (m.clay || 0) - 2);
      madePiece(v, 'pottery', R.pick(['jug', 'honey pot', 'bowl', 'jar']));
    },
  }),
  hobby_knitting: hobbyAction('knitting', {
    sat: { lonely: -0.05 },
    target: homeOrBench('knit'), homeless: benchWeather,
    label2: (v) => (World.season === 'autumn' || World.season === 'winter' ? 'Knitting something warm' : 'Knitting'),
    done: (v, task, q) => {
      // wool from the Store if there is any; otherwise, an old jumper unpicked
      task.data.p = (v.knitPart || 0) + (Village.stores.wool >= 1 ? 0.7 : 0.4) * q;
      v.knitPart = task.data.p;
      if (v.knitPart >= 1) {
        v.knitPart = 0;
        if (Village.stores.wool >= 1) Village.use('wool', 1);
        madePiece(v, 'knitting', R.pick(['scarf', 'pair of mittens', 'tea cosy', 'woolly hat', 'pair of socks', 'blanket']));
      }
    },
  }),
  hobby_painting: hobbyAction('painting', {
    pose: 'stand',
    homeless: (v, h) => fair() && h > 7 && h < 19.5,
    target: (v, h) => (fair() && h > 7 && h < 19.5 ? { ...(R.chance(0.5) ? riverSpot(v) : meadowSpot(v)), prop: 'easel', poseOverride: 'stand', facing: R.pick(['left', 'right']) } : { building: v.home() }),
    label2: (v, tg) => (tg && !tg.building ? (v.isChild() ? 'Drawing the view' : 'Painting the view') : v.isChild() ? 'Drawing at home' : 'Painting at the easel'),
    done: (v, task, q) => {
      v.paintPart = (v.paintPart || 0) + 0.6 * q;
      if (v.paintPart >= 1) { v.paintPart = 0; madePiece(v, 'painting', R.pick(['painting of the river', 'painting of the Hill', 'painting of the mill', 'painting of the orchard'])); }
    },
  }),
  hobby_collecting: hobbyAction('collecting', {
    homeless: () => fair() || World.season === 'winter',
    target: (v) => {
      if (!fair() && World.season !== 'winter') return collectionTotal(v.home()) > 3 ? { building: v.home(), sorting: true } : null;
      const scar = World.riftScars.length && (v.tech > 0.2 || R.chance(0.15)) ? R.pick(World.riftScars) : null;
      if (scar && R.chance(0.3)) return { ...(randomNearby(v, 1.5, scar.x, scar.y) || {}), find: 'trinkets', prop: 'basket', poseOverride: 'work', facing: 'up' };
      if (R.chance(0.45)) return { ...riverSpot(v), find: 'river', prop: 'basket', poseOverride: 'work', facing: 'up' };
      return { ...meadowSpot(v), find: 'meadow', prop: 'basket', poseOverride: 'work', facing: 'up' };
    },
    label2: (v, tg) => (tg && tg.sorting ? 'Sorting the collection' : tg && tg.find === 'river' ? 'Hunting for stones and shells' : tg && tg.find === 'trinkets' ? 'Sifting the rift scar for trinkets' : 'Hunting for treasures'),
    done: (v, task) => {
      const tg = task.target;
      if (tg.sorting || !tg.find) return;
      const s = World.season;
      const kinds = tg.find === 'trinkets' ? ['trinkets'] : tg.find === 'river' ? ['stones', 'stones', 'shells', 'feathers'] : [s === 'spring' || s === 'summer' ? 'flowers' : 'feathers', s === 'summer' ? 'butterflies' : 'feathers', s === 'autumn' ? 'conkers' : 'flowers', 'feathers'];
      if (R.chance(0.06)) kinds.push('coins');
      const kind = R.pick(kinds), C = homeCollection(v.home());
      C[kind] = Math.min(80, (C[kind] || 0) + R.i(1, 2));
      v.stats.finds = (v.stats.finds || 0) + 1;
      if (kind === 'coins') { v.say(R.pick(['An old coin! Look at the king on it!', 'Treasure! Real treasure!']), 3); v.remember('Found an old coin, worn smooth.', 2); if (R.chance(0.5)) chronicle(`${v.first} turned up an old silver coin ${tg.find === 'river' ? 'in the river shallows' : 'in a molehill'}. Nobody knows how old it is.`, 'info'); }
      else if (R.chance(0.3) && !v.inside) v.say(v.isChild() ? R.pick(['Look what I found!', 'This one\'s the best one!', 'Another one for my collection!']) : R.pick([`A fine ${COLLECT_KINDS[kind][0]} for the cabinet.`, 'Ooh, that\'s a good one.']), 2.6);
    },
  }),
  hobby_birdwatching: hobbyAction('birdwatching', {
    pose: 'stand', outdoor: true, dur: 45,
    avail: () => !Game.raining,
    time: (h) => (h >= 5 && h < 9 ? 1.8 : h >= 9 && h < 19.5 ? 1 : 0.05),
    target: (v) => ({ ...(R.chance(0.5) ? treeSpot(v) : riverSpot(v)), prop: 'book', poseOverride: 'stand', facing: 'up' }),
    label2: () => 'Birdwatching with a notebook',
    done: (v, task, q) => {
      const n = v.birds || 0;
      if (n < BIRDS.length && R.chance(0.35 * q * (1 - n / (BIRDS.length + 10)))) {
        v.birds = n + 1;
        const b = BIRDS[(v.id * 7 + n * 13) % BIRDS.length];
        v.say(v.isChild() ? `A ${b}! I saw a ${b}!` : `A ${b}! That makes ${n + 1}.`, 3);
        if ([20, 40].includes(v.birds)) { chronicle(`${v.name()} has now spotted ${v.birds} kinds of bird in the valley, all written up in a little notebook.`, 'learn'); v.remember(`Spotted my ${v.birds}th kind of bird: a ${b}.`, 2); }
      }
    },
  }),
});
for (const k of Object.keys(HOBBIES)) { ACTIONS['hobby_' + k].id = 'hobby_' + k; ACTION_NAMES['hobby_' + k] = HOBBIES[k].label; }

// Hobbies in a sentence, for the inspector.
function hobbyLines(v) {
  return hobbiesOf(v).map((k) => {
    const sk = (v.hobbySkill && v.hobbySkill[k]) || 0, n = v.stats['made_' + k] || 0;
    const tally = k === 'birdwatching' ? `${v.birds || 0} kinds spotted` : k === 'collecting' ? `${v.stats.finds || 0} finds` : n ? `${n} ${HOBBIES[k].made[n === 1 ? 0 : 1]} made` : 'nothing finished yet';
    return `${hobbyName(v, k)}: ${hobbySkillWord(sk)}, ${tally}`;
  });
}
HABIT_KEYS.push(...Object.keys(HOBBIES).map((k) => 'hobby_' + k));
