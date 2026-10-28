'use strict';
// ---------------------------------------------------------------------------
// The action catalog. Each action promises to relieve some drives (`sat`);
// the brain scores them all and picks one. Jobs are actions too, driven by
// an "itch to work" (industry) drive, and they move goods through the
// village stores: barley -> flour -> bread, barley -> ale, timber -> new
// homes, herbs -> remedies.
// ---------------------------------------------------------------------------

const FOODS = {
  bread: { label: 'bread', hunger: 0.7, joy: 0.04, icon: 'bread' },
  pie: { label: 'pie', hunger: 0.8, joy: 0.22, icon: 'pie' },
  cake: { label: 'seed-cake', hunger: 0.55, joy: 0.25, icon: 'bread' },
  veg: { label: 'vegetables', hunger: 0.66, joy: 0, icon: 'veg' },
  fish: { label: 'fish', hunger: 0.7, joy: 0.08, icon: 'fish' },
  mush: { label: 'mushrooms', hunger: 0.58, joy: 0.2, icon: 'shroom' },
  apple: { label: 'apples', hunger: 0.35, joy: 0.12, icon: 'apple' },
  egg: { label: 'eggs', hunger: 0.5, joy: 0.05, icon: 'egg' },
  stew: { label: 'stew', hunger: 0.85, joy: 0.15, icon: 'stew' },
  cheese: { label: 'cheese', hunger: 0.6, joy: 0.18, icon: 'cheese' },
};
const PANTRY_KINDS = ['bread', 'pie', 'cake', 'veg', 'fish', 'mush', 'apple', 'egg', 'cheese'];
const PANTRY_MAX = 30;
function emptyPantry() { return Object.fromEntries(PANTRY_KINDS.map((k) => [k, 0])); }
function pantryTotal(home) { let s = 0; for (const k of PANTRY_KINDS) s += home.pantry[k] || 0; return s; }
function addPantry(home, kind, n) {
  const room = PANTRY_MAX - pantryTotal(home);
  const add = Math.max(0, Math.min(room, Math.round(n)));
  home.pantry[kind] = (home.pantry[kind] || 0) + add;
  return add;
}

const JOBS = {
  farmer: { label: 'Farmer', skill: 'farming', icon: 'grain', desc: 'Sows and reaps the barley, and gathers eggs from the hens.' },
  miller: { label: 'Miller', skill: 'cooking', icon: 'flour', desc: 'Grinds barley into flour at the old mill.' },
  baker: { label: 'Baker', skill: 'cooking', icon: 'bread', desc: 'Bakes bread, apple pies and seed-cakes for the village.' },
  brewer: { label: 'Brewer', skill: 'brewing', icon: 'mug', desc: 'Brews ale from barley for the inn.' },
  innkeeper: { label: 'Innkeeper', skill: 'cooking', icon: 'stew', desc: 'Keeps the Tipsy Badger: pulls pints, cooks stew, keeps everyone merry.' },
  grower: { label: 'Leaf-grower', skill: 'farming', icon: 'leaf', desc: 'Tends the pipe-weed field.' },
  fisher: { label: 'Fisher', skill: 'fishing', icon: 'fish', desc: 'Catches fish for the Common Store.' },
  woodwright: { label: 'Woodwright', skill: 'woodcraft', icon: 'axe', desc: 'Fells timber for hearths, and digs and builds new homes.' },
  herbalist: { label: 'Herbalist', skill: 'herbalism', icon: 'herb', desc: 'Gathers herbs, brews remedies and nurses the poorly.' },
  orchardist: { label: 'Orchard-keeper', skill: 'farming', icon: 'apple', desc: 'Picks apples and gathers honey from the hives.' },
  herder: { label: 'Herder', skill: 'farming', icon: 'sheep', desc: 'Tends the sheep, cows and pigs: milk for cheese, wool for winter woolens.' },
  postie: { label: 'Mail carrier', skill: 'lore', icon: 'letter', desc: 'Carries letters from hole to hole (and from far-off adventurers).' },
  storyteller: { label: 'Storyteller', skill: 'lore', icon: 'book', desc: 'Gathers the little ones beneath the old oak and teaches them letters, sums and tales.' },
  tinker: { label: 'Tinker', skill: 'tinkering', icon: 'chip', desc: 'Rift know-how: salvages scrap from rifts, wires hobbit-holes with neon and sun-glass, keeps the Relay humming, and lends a hand building.' },
};

const isDay = (h) => h >= 6.5 && h < 19.5;
const isNight = (h) => h >= 22 || h < 6;
const workHours = (h, a = 8, b = 18) => (h >= a && h < b ? 1 : h >= a - 1 && h < b + 1 ? 0.35 : 0.01);
const CROP_PLURAL = { cabbage: 'cabbages', carrot: 'carrots', potato: 'potatoes', tomato: 'tomatoes', pumpkin: 'pumpkins' };

const HERD_SAY = {
  sheep: ['Come by, come by!', 'Easy now, lambkins.', 'That\'s a fine fleece.'],
  cow: ['Steady, Buttercup.', 'Good girl. Lovely creamy milk.', 'There\'s cheese in this pail, mark me.'],
  pig: ['Here, piggies! Scraps!', 'Who\'s a muddy one?', 'Don\'t eat the bucket!'],
};
const STORY_PLAIN = ['Once upon a time, there was a hobbit who lived in a hole...', 'And then the dragon said, "Who goes there?"', 'Now, who can tell me what three and four make?', 'Long ago, beyond the hills, there lived a troll...', 'Say your letters with me: A, B, C...'];
const STORY_FINE = ['Long ago, before the Shire had a name, our folk wandered over the misty mountains...', 'Now, who can name the four farthings? Very good!', 'And so the travelers learned that courage is found in the smallest of places.', 'Let us read this verse together, slowly, and think about what it means.', 'Who can tell me why the moon changes shape? Splendid!'];
const PHRASES = {
  eat_home: ['Mmm, lovely!', 'Pass the butter!', 'Is that bacon I smell?', 'Just a small plate. Or two.', 'Seconds, I think.'],
  eat_inn: ['Bring the pie!', 'Best stew this side of the river', 'More gravy, please!', 'Another helping!'],
  ale: ['Cheers!', 'A fine brew, this.', 'Another round!', 'To good company!', 'Nothing like a cold pint.'],
  well: ['Ahh, fresh water.', 'Cool and clear.'],
  smoke: ['Fine leaf, this.', '*puff*', 'Watch this ring...', 'Ahh, that hits the spot.'],
  read: ['What a tale!', 'Dragons, imagine that.', 'Just one more chapter.'],
  nap: ['*yawn*', 'Just resting my eyes...'],
  garden: ['Grow, little taters!', 'Coming along nicely.', 'Weeds, begone!', 'Lovely soil today.'],
  forage: ['Mushrooms! Hee hee.', 'Don\'t tell the farmer...', 'A basketful!'],
  fish: ['Bite, you rascal!', 'Nothing yet...', 'Patience...', 'Shh, they\'re listening.'],
  chat: ['Lovely weather!', 'Did you hear about...?', 'You don\'t say!', 'Mind you, in my day...', 'How are the taters?', 'Ha! Splendid.', 'Well I never!'],
  quarrel: ['Hmph! Nonsense!', 'Well, I never!', 'How dare you!', 'Mind your own taters!', 'Oh, go boil your head!'],
  court: ['You look lovely today.', '*blushes*', 'Walk with me?', 'Hee hee...', 'Fancy a picnic?'],
  party: ['Wheee!', 'Play another!', 'Hey diddle diddle!', 'What a party!', 'Faster, fiddler!'],
  stroll: ['Hmm-hm-hmm...', 'What a lovely day.', '*whistles*', 'Just stretching my legs.'],
  market: ['Fill the larder!', 'A few things for the pantry.', 'Fresh from the Store!'],
  watch: ['Ooooh!', 'Aaaah!', 'Lovely colors!', 'Do another!'],
  eat_item: ['Cake! For me?', 'Don\'t mind if I do!', 'Free cake!'],
  ale_item: ['A whole keg!', 'Who left this here?', 'Cheers to whoever!'],
  leaf_item: ['Ooh, a pouch of leaf!', 'Finders keepers!'],
  rain: ['Bother, rain!', 'Wet feet again...', 'Indoors, I think.'],
  work_farm: ['Lovely barley this year.', 'Mind the crows!', 'Sow, sow, sow...'],
  work_fish: ['One for the Store!', 'Come on, little fishies.'],
  work_wood: ['Timber!', 'Mind your toes!', 'Good oak, this.'],
  build: ['Dig, dig, dig!', 'A fine smial this\'ll be.', 'Round door, round door...'],
  work_herb: ['Feverfew... and a bit of mint.', 'Smells like healing.'],
  work_orchard: ['Rosy ones!', 'Easy, bees, easy.'],
  work_post: ['Mail!', 'A letter for you!', 'Mind the dog.'],
  work_inn: ['What\'ll it be?', 'Mind the step!', 'Fresh stew on!'],
  sick: ['Achoo!', '*sniffle*', 'Ooh, my head...', '*cough cough*'],
  tipsy: ['Hic!', 'Lalala...', 'I love you all!', 'Who moved the road?'],
  fiddle: ['*fiddle-dee-dee*', 'Here\'s a merry one!'],
  gift: ['For you!', 'I picked these myself.'],
};

// ---------------------------------------------------------------------------
// Target helpers
// ---------------------------------------------------------------------------
function plotNeed(p) { return p.stage === 4 ? 3 : p.stage === 0 ? 2 : 1 - p.stage * 0.2 + Math.random() * 0.1; }

function freeSpot(v, list) {
  let best = null, bd = 1e9;
  for (const s of list) {
    if (s.occ) continue;
    const d = dist(v.x, v.y, s.x, s.y) + Math.random() * 40;
    if (d < bd) { bd = d; best = s; }
  }
  return best ? { spot: best } : null;
}

function benchTarget(v, preferHome) {
  const hb = v.home().bench;
  if (preferHome && hb && !hb.occ) return { spot: hb };
  const near = World.benches.filter((b) => !b.occ && dist(b.x, b.y, v.x, v.y) < 40 * 16);
  const t = freeSpot(v, near.length ? near : World.benches);
  if (t) return t;
  return { x: v.home().stepX + R.i(-20, 20), y: v.home().stepY + R.i(4, 14), facing: 'down', poseOverride: 'stand' };
}

// A tree to sit against, back to the trunk, on a fair day out of winter: not
// too far off, and nobody else's.
function treeSeat(v, h) {
  if (Game.raining || World.season === 'winter' || !isDay(h)) return null;
  const near = World.shade.filter((s) => !s.occ && dist(s.x, s.y, v.x, v.y) < 30 * 16);
  return near.length ? freeSpot(v, near) : null;
}

function nearestInn(v) {
  const list = inns();
  return list.length > 1 ? list.sort((a, b) => dist(a.stepX, a.stepY, v.x, v.y) - dist(b.stepX, b.stepY, v.x, v.y))[0] : World.inn;
}
function innTarget(v, h) {
  const late = h >= 22.5 || h < 9;
  const inn = nearestInn(v);
  if (!Game.raining && !late && World.season !== 'winter') {
    const t = freeSpot(v, inn.seats);
    if (t) return t;
  }
  return { building: inn };
}
function nearestWell(v) {
  let best = World.wellSpot, bd = 1e9;
  for (const w of World.wells) { const d = dist(w.x, w.y, v.x, v.y); if (d < bd) { bd = d; best = w; } }
  return best;
}

function nearestItem(v, kind) {
  let best = null, bd = 45 * 16;
  for (const it of World.items) {
    if (it.kind !== kind || it.uses - it.claims <= 0) continue;
    const d = dist(v.x, v.y, it.x, it.y);
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}
function itemTarget(v, kind) {
  const it = nearestItem(v, kind);
  if (!it) return null;
  it.claims++;
  const a = Math.random() * Math.PI * 2;
  return { x: it.x + Math.round(Math.cos(a) * 12), y: it.y + Math.round(Math.sin(a) * 6) + 2, item: it, faceTo: it };
}

function randomNearby(v, r, cx = v.x, cy = v.y) {
  for (let k = 0; k < 20; k++) {
    const tx = Math.floor(cx / 16 + R.f(-r, r)), ty = Math.floor(cy / 16 + R.f(-r, r));
    if (walkable(tx, ty)) return { x: tx * 16 + 8, y: ty * 16 + 12, facing: R.pick(['down', 'left', 'right']) };
  }
  return null;
}

const STROLL_POINTS = [[64, 28], [64, 40], [48, 24], [80, 27], [96, 40], [30, 31], [14, 28], [64, 62], [46, 73], [82, 74], [100, 70], [96, 26],
  [40, 50], [72, 50], [20, 16], [56, 80], [94, 60], [26, 60], [110, 50], [74, 88]];
function strollTarget(v) {
  if (R.chance(0.3)) return randomNearby(v, 12);
  const [px, py] = R.pick((World.L && World.L.stroll) || STROLL_POINTS);
  for (let k = 0; k < 10; k++) {
    const tx = px + R.i(-3, 3), ty = py + R.i(-2, 2);
    if (walkable(tx, ty)) return { x: tx * 16 + 8, y: ty * 16 + 12, facing: R.pick(['down', 'left', 'right']) };
  }
  return randomNearby(v, 12);
}

function nearestOf(v, list, ok) {
  let best = null, bd = 1e9;
  for (const s of list) {
    if (s.claimed || (ok && !ok(s))) continue;
    const d = dist(v.x, v.y, s.x, s.y) + Math.random() * 60;
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

// The nearest place goods can be dropped off.
function dropOffFor(v, res) {
  const B = World.buildings;
  const pref = { grain: ['barn', 'store'], wood: ['workshop', 'store'], scrap: ['relay', 'workshop', 'store'], herbs: ['herbalist'], flour: ['bakery', 'store'], fish: ['store', 'barn'], egg: ['store', 'barn'] }[res] || ['store', 'barn'];
  let best = null, bd = 1e9;
  for (const k of pref) { const b = B[k]; if (!b) continue; const d = dist(v.x, v.y, b.stepX, b.stepY) * (k === pref[0] ? 0.7 : 1); if (d < bd) { bd = d; best = b; } }
  return best;
}
function queueDelivery(v, res, amt, label) {
  if (amt <= 0) return;
  v.queue.push({ a: ACTIONS.deliver, extra: { res, amt, dest: dropOffFor(v, res), label } });
}

function sweetheartOf(v) { return v.sweetheart ? Game.villagers.find((o) => o.id === v.sweetheart) : null; }
function babiesOf(v) { return Game.villagers.filter((b) => b.stage === 'baby' && b.parents.includes(v.id)); }
function babiesInHome(v) { return Game.villagers.filter((b) => b.stage === 'baby' && b.homeId === v.homeId); }
function crawlMinder(v) { return carersOf(v).find((c) => !c.inside && c.task && c.task.phase === 'do' && dist(c.x, c.y, v.x, v.y) < 8 * 16); }
function sickFolk() { return Game.villagers.filter((o) => o.isSick() && !o.leaving); }
function anyStoryteller() {
  return Game.villagers.find((o) => o.task && o.task.a.id === 'work_story' && o.task.phase === 'do');
}

// Picks the food a villager would most like from a set of counts.
function pickFood(v, counts, kinds) {
  let best = null, bs = -1;
  for (const k of kinds) {
    if (!(counts[k] > 0)) continue;
    const s = (v.genes.food[k] || 1) * (v.foodLike[k] || 1) * (0.6 + FOODS[k].hunger) * (v.lastFood === k ? 0.7 : 1) * R.f(0.9, 1.1);
    if (s > bs) { bs = s; best = k; }
  }
  return best;
}
function foodSat(v, kind, extra = {}) {
  const f = FOODS[kind];
  const taste = (v.genes.food[kind] || 1) * (v.foodLike[kind] || 1);
  return { hunger: -f.hunger, thirst: -0.1, bored: -Math.max(0, (f.joy + (taste - 1) * 0.3)), ...extra };
}
function afterMeal(v, kind) {
  if (!kind) return;
  const taste = v.genes.food[kind] || 1;
  // learned taste: what's enjoyed is sought out again, what's disliked less so
  v.foodLike[kind] = clamp((v.foodLike[kind] || 1) + 0.05 * (taste - 1 + FOODS[kind].joy), 0.5, 1.8);
  v.lastFood = kind;
  if (taste < 0.8 && R.chance(0.3)) v.say(R.pick([`Not ${FOODS[kind].label} again...`, `I never did like ${FOODS[kind].label}.`]));
  else if (taste > 1.2 && R.chance(0.3)) v.say(R.pick([`I do love ${FOODS[kind].label}!`, `Mmm, ${FOODS[kind].label}!`]));
}

// ---------------------------------------------------------------------------
// Action catalog
// ---------------------------------------------------------------------------
// Everyone keeps their own hours. A body clock from their nature (the merry
// and the lazy stay up and lie in; others are early birds), shifted by their
// trade (bakers are up before dawn, the innkeeper keeps late hours), and a
// little different from one day to the next.
const TRADE_HOURS = { baker: -1.7, farmer: -0.8, herder: -1.1, miller: -0.5, fisher: -0.9, orchardist: -0.4, innkeeper: 1.7, brewer: 0.3, storyteller: 0.4, postie: -0.3 };
function bodyClock(v) {
  const g = v.genes;
  return (g.merriness - 0.5) * 1.2 + (g.laziness - 0.5) * 1.5 + (hash2(v.id, 3) - 0.5) * 1.3 + (v.stage === 'elder' ? -0.7 : 0);
}
function wakeOf(v) {
  const day = (hash2(Game.day, v.id * 7) - 0.5) * 0.8;
  if (v.stage === 'baby') return 7 + day;
  if (v.isChild()) return 7 + bodyClock(v) * 0.25 + day;
  return clamp(6.2 + bodyClock(v) * 0.7 + (TRADE_HOURS[v.job] || 0) + day, 4, 9.5);
}
// about eight hours' sleep before they wake
function bedOf(v) {
  if (v.stage === 'baby') return 19.5;
  if (v.isChild()) return kidBand(v) === 'toddler' ? 19.5 : v.years() < 12 ? 20.5 : 21.5 + bodyClock(v) * 0.3;
  return wakeOf(v) + 15.8;
}
// is it within their sleeping hours?
function sleepHours(v, h) {
  const b = bedOf(v) % 24, w = wakeOf(v);
  return b < w ? h >= b && h < w : h >= b || h < w;
}

const ADULT = ['adult', 'elder'];
const AWAKE = ['child', 'adult', 'elder'];

const ACTIONS = {
  sleep: {
    label: 'Sleeping', icon: 'zzz', sat: { tired: -1 }, dur: 720, pose: 'inside', manual: true, stages: ['baby', 'child', 'adult', 'elder'],
    time: (h, v) => {
      if (v.isSick() && !isNight(h)) return 2.5;
      const bed = v.stage === 'baby' ? (isNight(h) || h >= 19.5 ? 4 : v.drives.tired > 0.6 ? 2 : 0.3) : sleepHours(v, h) ? 4 : v.drives.tired > 0.85 ? 1 : 0.04;
      return bed * (Game.party.on && !v.isChild() && h < 23.5 && v.stage !== 'baby' ? 0.35 : 1);
    },
    trait: (v) => 0.8 + v.genes.laziness * 0.4,
    target: (v) => ({ building: v.home() }),
    tick: (v, task, dt, h) => {
      v.drives.tired = Math.max(0, v.drives.tired - dt * (0.16 / 60));
      v.drives.ache = Math.max(0, v.drives.ache - dt * (0.05 / 60));
      if (v.drives.tired < 0.04 && !sleepHours(v, h) && !v.isSick()) task.t = 0;
      if (v.drives.hunger > 0.95 && h >= 5) task.t = 0;
      if (v.isSick() && !isNight(h) && v.drives.tired < 0.1 && R.chance(dt * 0.004)) task.t = 0;
    },
  },
  eat_home: {
    label: 'Having a bite at home', icon: 'plate', sat: { hunger: -0.7, thirst: -0.1, bored: -0.05 }, dur: 40, pose: 'sit', prop: 'plate', meal: true,
    avail: (v) => pantryTotal(v.home()) > 0 && v.chem.toxin < 0.5 && v.drives.hunger > 0.2,
    trait: (v) => 0.7 + v.genes.appetite * 0.6,
    // dinner is a family affair, eaten indoors round the table
    time: (h, v) => (isDinner(h) && familyDinnerOn(v) ? 2 : 1),
    target: (v, h) => {
      const home = v.home();
      if (Game.raining || h >= 20.5 || h < 7 || World.season === 'winter' || !home.bench || home.bench.occ || isDinner(h)) return { building: home };
      return { spot: home.bench };
    },
    start: (v, task) => {
      const home = v.home();
      const k = pickFood(v, home.pantry, PANTRY_KINDS);
      if (!k) return false;
      home.pantry[k]--; task.data.food = k; task.sat = foodSat(v, k);
      Village.use(k, 1, true);
      return true;
    },
    tick: (v, task) => familyDinnerTick(v, task),
    done: (v, task) => afterMeal(v, task.data.food),
  },
  eat_inn: {
    label: 'Dining at the inn', icon: 'plate', sat: { hunger: -0.75, thirst: -0.3, lonely: -0.3, bored: -0.2, cold: -0.3 }, dur: 55, pose: 'sit', prop: 'plate', meal: true, social: true,
    avail: (v) => !!pickFood(v, Village.stores, ['stew', 'pie', 'fish', 'bread', 'cake', 'veg']) && v.chem.toxin < 0.5 && v.drives.hunger > 0.2,
    // a treat now and then, not every meal: family folk eat at home at dinnertime
    time: (h, v) => (h >= 11 && h < 23 ? (h >= 17 ? 1.1 : 0.9) : 0.15) * (isDinner(h) && householdOf(v).length ? 0.4 : 1),
    trait: (v) => 0.42 + v.genes.sociability * 0.45,
    target: (v, h) => innTarget(v, h),
    start: (v, task) => {
      const k = pickFood(v, Village.stores, ['stew', 'pie', 'fish', 'bread', 'cake', 'veg']);
      if (!k) return false;
      Village.use(k, 1); task.data.food = k;
      const keeper = Village.innkeeperOn();
      task.sat = foodSat(v, k, { thirst: -0.3, lonely: keeper ? -0.45 : -0.3, bored: -0.25, cold: -0.3 });
      return true;
    },
    done: (v, task) => afterMeal(v, task.data.food),
  },
  ale: {
    label: 'Enjoying an ale', icon: 'mug', sat: { thirst: -0.65, bored: -0.35, lonely: -0.25, cold: -0.2 }, dur: 50, pose: 'sit', prop: 'mug', social: true, stages: ADULT,
    avail: (v) => Village.stores.ale >= 1,
    time: (h) => (h >= 12 && h < 24 ? (h >= 18 ? 1.5 : 1) : 0.1),
    trait: (v) => (0.6 + v.genes.merriness * 0.6 - (v.chem.ale > 0.6 ? 0.4 : 0)) * (1.15 - v.edu * 0.35),
    target: (v, h) => innTarget(v, h),
    start: (v, task) => {
      if (Village.stores.ale < 1) return false;
      Village.use('ale', 1);
      if (Village.innkeeperOn()) task.sat = { thirst: -0.65, bored: -0.45, lonely: -0.4, cold: -0.2 };
      return true;
    },
    tick: (v, task, dt) => { v.chem.ale = clamp(v.chem.ale + dt * (0.22 / 50), 0, 1); },
  },
  tea: {
    label: 'Having a cup of tea', icon: 'cup', sat: { thirst: -0.65, bored: -0.1, cold: -0.3 }, dur: 20, pose: 'inside',
    time: (h) => (h >= 15 && h < 17.5 ? 1.6 : isNight(h) ? 0.6 : 1),
    trait: (v) => 0.8 + v.edu * 0.5,
    target: (v) => ({ building: v.home() }),
  },
  well: {
    label: 'Drinking at the well', icon: 'cup', sat: { thirst: -0.7 }, dur: 8, pose: 'stand', prop: 'cup', outdoor: true,
    time: (h) => (isNight(h) ? 0.3 : 1),
    target: (v) => { const w = nearestWell(v); return { x: w.x + R.i(-6, 6), y: w.y + R.i(0, 4), facing: 'up' }; },
  },
  smoke: {
    label: 'Smoking a pipe', icon: 'pipe', sat: { craving: -0.85, bored: -0.15, tired: -0.04 }, dur: 35, pose: 'sit', prop: 'pipe', outdoor: true, stages: ADULT,
    avail: (v) => v.pouch > 0,
    time: (h) => (h >= 18 && h < 23 ? 1.3 : isNight(h) ? 0.3 : 1),
    trait: (v) => 0.5 + v.genes.pipeLove * 0.7,
    // by day, now and then, under a tree instead
    target: (v, h) => (R.chance(0.35) && treeSeat(v, h)) || benchTarget(v, true),
    start: (v) => { if (v.pouch <= 0) return false; v.pouch--; return true; },
  },
  read: {
    label: 'Reading on a bench', icon: 'book',
    label2: (v) => (v.task && v.task.spot && v.task.spot.kind === 'shade' ? 'Reading under a tree' : 'Reading on a bench'), sat: { bored: -0.35, tired: -0.05 }, dur: 45, pose: 'sit', prop: 'book', outdoor: true,
    // only those who can read sit down with a book, and the well-read do it most
    avail: (v) => v.edu >= 0.15,
    extra: (v) => 0.02 + v.edu * 0.04,
    time: (h) => (isDay(h) ? 1 : 0.2),
    trait: (v) => (0.5 + v.genes.curiosity * 0.6 + v.genes.laziness * 0.2) * (0.3 + v.edu * 1.5),
    target: (v, h) => (R.chance(0.4) && treeSeat(v, h)) || benchTarget(v, false),
    skill: 'lore', skillRate: 0.4,
    tick: (v, task, dt) => learn(v, dt * 0.0003, 'books'),
  },
  nap: {
    label: 'Napping in the shade', icon: 'zzz', sat: { tired: -0.35 }, dur: 60, pose: 'sit', outdoor: true, zzz: true,
    // dozing off against a tree is for warm, dry days
    avail: () => !Game.raining && World.season !== 'winter',
    time: (h) => (h >= 11 && h < 18 ? 1 : 0.05),
    trait: (v) => 0.4 + v.genes.laziness * 0.9,
    target: (v) => freeSpot(v, World.shade),
  },
  garden: {
    label: 'Tending the garden', icon: 'hoe', sat: { bored: -0.35, industry: -0.2 }, dur: 50, pose: 'work', prop: 'hoe', outdoor: true, stages: ADULT,
    avail: (v) => v.home().plots.length > 0 && World.season !== 'winter',
    extra: (v) => {
      const plots = v.home().plots;
      const ripe = plots.filter((p) => p.stage === 4 || p.stage === 0).length;
      return 0.05 + ripe * 0.04 + (pantryTotal(v.home()) < 4 ? 0.08 : 0);
    },
    time: (h) => (isDay(h) ? 1 : 0.02),
    trait: (v) => 0.4 + v.genes.apt.farming * 0.8 - v.genes.laziness * 0.2,
    target: (v) => {
      const plots = v.home().plots.slice().sort((a, b) => plotNeed(b) - plotNeed(a));
      const p = plots[0];
      return { x: p.x, y: p.y + 3, facing: 'up', plot: p };
    },
    skill: 'farming',
    tick: (v, task, dt) => { for (const p of v.home().plots) if (p.stage >= 1 && p.stage < 4) p.prog += dt / 80 * v.skillMul('farming'); },
    done: (v) => {
      let harvested = 0;
      for (const p of v.home().plots) {
        if (p.stage === 4) { harvested++; p.stage = 1; p.prog = 0; }
        else if (p.stage === 0) { p.stage = 1; p.prog = 0; }
      }
      if (harvested) {
        const got = addPantry(v.home(), 'veg', harvested * 2 * v.skillMul('farming'));
        Village.produce('veg', got, true);
        v.say(R.pick(['What a crop!', 'Lovely ' + CROP_PLURAL[v.home().cropType] + '!', 'Into the larder you go.']));
        if (harvested >= 3 && R.chance(0.3)) chronicle(`${v.name()} brought in a fine harvest of ${CROP_PLURAL[v.home().cropType]}.`, 'harvest');
      }
    },
  },
  forage: {
    label: 'Gathering mushrooms', icon: 'shroom', sat: { bored: -0.3, hunger: -0.05 }, dur: 30, pose: 'work', prop: 'basket', outdoor: true,
    avail: () => World.season !== 'winter',
    extra: (v) => 0.02 + (pantryTotal(v.home()) < 4 ? 0.12 : 0),
    time: (h) => (isDay(h) ? 1 : 0.02),
    trait: (v) => 0.5 + v.genes.curiosity * 0.4 + v.genes.appetite * 0.3,
    target: (v) => {
      const m = nearestOf(v, World.mushrooms, (s) => s.amount > 0 && dist(v.x, v.y, s.x, s.y) < 60 * 16);
      if (!m) return null;
      m.claimed = v.id;
      return { x: m.x, y: m.y + 4, facing: 'up', mush: m };
    },
    skill: 'herbalism', skillRate: 0.4,
    done: (v, task) => {
      const m = task.target.mush;
      const got = addPantry(v.home(), 'mush', m.amount + 1);
      Village.produce('mush', got, true);
      m.amount = 0;
      // a toadstool among the mushrooms? Herb-lore and bitter experience both help.
      if (m.toad) {
        const risk = 0.55 * (1 - v.skills.herbalism / 110) * (1 - v.wary) * (1 - v.edu * 0.6);
        if (R.chance(risk)) {
          v.chem.toxin = clamp(v.chem.toxin + 0.6, 0, 1);
          v.wary = clamp(v.wary + 0.3, 0, 0.95);
          v.weights.forage = clamp(v.weights.forage - 0.25, 0.35, 2.2);
          v.say(R.pick(['Ooh... that one tasted funny.', 'Urgh. My tummy...']));
          v.remember('Nibbled a toadstool by mistake. Never again!', -2);
          if (R.chance(0.6)) chronicle(`${v.first} nibbled a toadstool while mushrooming and has a dreadful tummy-ache.`, 'sick');
        } else if (v.wary > 0.2 || v.skills.herbalism > 30 || v.edu > 0.5) {
          if (R.chance(0.4)) v.say('Not that one. That\'s a toadstool!');
        }
      }
    },
    release: (v, task) => { if (task.target.mush) task.target.mush.claimed = null; },
  },
  fish: {
    label: 'Fishing', icon: 'fish', sat: { bored: -0.5, tired: -0.05 }, dur: 75, pose: 'sit', prop: 'rod', outdoor: true,
    extra: () => 0.02,
    time: (h) => (World.season === 'winter' ? 0.25 : 1) * (isDay(h) ? 1 : h >= 19.5 && h < 21 ? 0.6 : 0.03),
    trait: (v) => 0.4 + v.genes.laziness * 0.3 + v.genes.apt.fishing * 0.4,
    target: (v) => freeSpot(v, World.fishing),
    skill: 'fishing',
    tick: (v, task, dt) => {
      task.data.fishT = (task.data.fishT || 0) + dt;
      if (task.data.fishT > 18) {
        task.data.fishT = 0;
        if (R.chance(0.18 + v.skills.fishing / 300)) {
          const got = addPantry(v.home(), 'fish', 1);
          Village.produce('fish', got, true);
          v.say(R.pick(['A beauty!', 'Got one!', 'Supper!']));
          FX.splash(v.x + 4, v.y + 18);
          v.stats.fish = (v.stats.fish || 0) + 1;
        }
      }
    },
  },
  bake_home: {
    label: 'Baking bread at home', icon: 'bread', sat: { bored: -0.2, industry: -0.2, cold: -0.3 }, dur: 45, pose: 'inside', stages: ADULT, skill: 'cooking',
    avail: (v) => (Village.stores.flour >= 1 || (Village.stores.grain >= 2 && Village.foodTotal() < 10)) && pantryTotal(v.home()) < 6,
    extra: (v) => (pantryTotal(v.home()) < 3 ? 0.3 : 0.06) + v.drives.hunger * 0.2,
    time: (h) => (h >= 6 && h < 20 ? 1 : 0.05),
    trait: (v) => 0.5 + v.genes.apt.cooking * 0.6,
    target: (v) => ({ building: v.home() }),
    // proper flour if there is any; otherwise grind a little barley by hand
    start: (v, task) => {
      if (Village.stores.flour >= 1) { const n = Math.min(2, Village.stores.flour); Village.use('flour', n); task.data.loaves = n * 3; return true; }
      if (Village.stores.grain >= 2) { Village.use('grain', 2); task.data.loaves = 4; return true; }
      return false;
    },
    done: (v, task) => { const got = addPantry(v.home(), 'bread', task.data.loaves * v.skillMul('cooking')); Village.produce('bread', got, true); },
  },
  market: {
    label: 'Fetching from the Common Store', icon: 'basket', sat: { bored: -0.15, lonely: -0.1 }, dur: 15, pose: 'stand', prop: 'basket', outdoor: true,
    avail: (v) => v.stage !== 'child' && (Village.foodTotal() > 0 || Village.stores.leaf > 0),
    extra: (v) => (pantryTotal(v.home()) < 4 ? 0.35 : pantryTotal(v.home()) < 8 ? 0.08 : 0) + (v.pouch === 0 && v.genes.pipeLove > 0.3 && Village.stores.leaf > 0 ? 0.05 + v.drives.craving * 0.5 : 0),
    time: (h) => (h >= 8 && h < 18 ? 1 : 0.01),
    target: () => ({ x: World.marketSpot.x + R.i(-10, 10), y: World.marketSpot.y + R.i(0, 6), facing: 'up' }),
    done: (v) => {
      const home = v.home();
      const household = Game.villagers.filter((o) => o.homeId === home.id).length;
      let want = Math.min(PANTRY_MAX - pantryTotal(home), 3 + household * 2);
      // share fairly: never take more than a slice of what's left
      want = Math.min(want, Math.ceil(Village.foodTotal() * 0.12) + 1);
      while (want > 0) {
        const k = pickFood(v, Village.stores, PANTRY_KINDS);
        if (!k) break;
        Village.stores[k]--; addPantry(home, k, 1); want--;
      }
      if (v.genes.pipeLove > 0.25 && Village.stores.leaf > 0 && v.pouch < 2) { Village.use('leaf', 1); v.pouch += 3; }
    },
  },
  chat: {
    label: 'Having a natter', icon: 'chat', sat: { lonely: -0.6, bored: -0.2 }, dur: 25, pose: 'stand', social: true, pair: true,
    extra: () => 0.035,
    time: (h) => (isNight(h) ? 0.2 : 1),
    trait: (v) => 0.4 + v.genes.sociability * 0.9,
    target: (v) => {
      let best = null, bs = -1e9;
      for (const o of Game.villagers) {
        if (o === v || o.inside || o.leaving || o.stage === 'baby' || o.isBusyForChat()) continue;
        const d = dist(v.x, v.y, o.x, o.y) / 16;
        if (d > 35) continue;
        const f = v.rel[o.id] ?? 0.1;
        let s = f - d * 0.015 + Math.random() * 0.2 + (o.id === v.sweetheart ? 0.4 : 0) + (v.love[o.id] || 0) * 0.3;
        if (f < -0.2) s -= 1; // avoid rivals
        s += riftChatBias(v, o);
        if (s > bs) { bs = s; best = o; }
      }
      return best ? { other: best } : null;
    },
  },
  gift: {
    label: 'Bringing flowers to a sweetheart', icon: 'heart', sat: { lonely: -0.5, bored: -0.2 }, dur: 12, pose: 'stand', social: true, pair: true, prop: 'flowers', stages: ADULT,
    avail: (v) => { const s = sweetheartOf(v); return !!s && !s.inside && !s.leaving && v.spouse !== s.id && World.season !== 'winter'; },
    extra: (v) => 0.12 + v.genes.romance * 0.25,
    time: (h) => (isDay(h) ? 1 : 0.05),
    target: (v) => { const s = sweetheartOf(v); return s && !s.isBusyForChat() ? { other: s, gift: true } : null; },
  },
  tend_baby: {
    label: 'Seeing to the baby', icon: 'baby', sat: { lonely: -0.3, industry: -0.2 }, dur: 18, pose: 'stand', stages: ADULT,
    avail: (v) => babiesInHome(v).some((b) => b.drives.hunger > 0.4 || b.drives.lonely > 0.5),
    extra: (v) => {
      const bs = babiesInHome(v);
      let need = 0;
      for (const b of bs) need = Math.max(need, b.drives.hunger, b.drives.lonely);
      return need * need * (babiesOf(v).length ? 1.6 : 0.6) * (0.6 + v.genes.fertility * 0.6);
    },
    target: (v) => {
      const bs = babiesInHome(v).sort((a, b) => (b.drives.hunger + b.drives.lonely) - (a.drives.hunger + a.drives.lonely));
      const b = bs[0];
      if (!b) return null;
      if (b.inside) return { building: b.inside, baby: b };
      return { other: b, baby: b };
    },
    done: (v, task) => {
      const b = task.target.baby;
      if (!b || !Game.villagers.includes(b)) return;
      if (b.inside !== v.inside && dist(b.x, b.y, v.x, v.y) > 30) return;
      b.drives.hunger = Math.max(0, b.drives.hunger - 0.75); b.drives.lonely = Math.max(0, b.drives.lonely - 0.7); b.drives.thirst = Math.max(0, b.drives.thirst - 0.6);
      b.bond(v, 0.04);
      if (!v.inside) { FX.hearts(b.x, b.y - 10); v.say(R.pick(['There, there.', 'Who\'s a hungry one?', 'Shh, little one.', 'Coochie-coo!'])); }
    },
  },
  party: {
    label: 'Dancing at the party', icon: 'dance', sat: { bored: -0.85, lonely: -0.6, thirst: -0.1 }, dur: 70, pose: 'dance', social: true,
    avail: () => Game.party.on,
    extra: (v) => 0.4 + v.genes.merriness * 0.2,
    trait: (v) => 0.5 + v.genes.merriness * 0.9,
    target: (v) => {
      if ((v.drives.tired > 0.45 || R.chance(0.3)) && !v.isChild()) {
        const s = freeSpot(v, World.partySeats);
        if (s) { s.prop = Village.stores.ale > 0 ? 'mug' : 'cup'; return s; }
      }
      return freeSpot(v, World.partySpots);
    },
    skill: 'music', skillRate: 0.15,
    tick: (v, task, dt) => {
      if (World.season === 'winter') v.drives.cold = Math.max(0, v.drives.cold - dt * 0.008);
      if (task.spot && task.spot.kind === 'partyseat' && Village.stores.ale > 0 && !v.isChild()) v.chem.ale = clamp(v.chem.ale + dt * 0.002, 0, 1);
    },
  },
  fiddle: {
    label: 'Playing the fiddle', icon: 'note', sat: { bored: -0.7, lonely: -0.4, industry: -0.3 }, dur: 60, pose: 'stand', prop: 'fiddle', social: true, stages: ADULT,
    avail: (v) => Game.party.on && (v.skills.music > 20 || v.genes.apt.music > 0.75) && !Game.villagers.some((o) => o !== v && o.task && o.task.a.id === 'fiddle'),
    extra: (v) => 0.5 + v.skills.music / 100,
    target: () => ({ x: (PARTY.danceX - 4.4) * 16 + 8, y: (PARTY.danceY + 0.2) * 16, facing: 'right' }),
    skill: 'music',
  },
  watch: {
    label: 'Watching the fireworks', icon: 'spark', sat: { bored: -0.6, lonely: -0.2 }, dur: 30, pose: 'stand', outdoor: true,
    avail: (v) => Game.fireworks.until > Game.time && dist(v.x, v.y, Game.fireworks.x, Game.fireworks.y) < 50 * 16,
    extra: () => 0.6,
    target: () => {
      for (let k = 0; k < 20; k++) {
        const a = Math.random() * Math.PI * 2, r = R.f(3, 6);
        const tx = Math.floor(Game.fireworks.x / 16 + Math.cos(a) * r), ty = Math.floor(Game.fireworks.y / 16 + Math.sin(a) * r * 0.7 + 2);
        if (walkable(tx, ty)) return { x: tx * 16 + 8, y: ty * 16 + 12, facing: 'up' };
      }
      return null;
    },
  },
  play: {
    label: 'Playing', icon: 'heart', sat: { bored: -0.55, lonely: -0.2 }, dur: 20, pose: 'dance', outdoor: true, stages: ['child'],
    extra: () => 0.08,
    time: (h) => (isDay(h) ? 1 : 0.05),
    target: (v) => {
      // play near friends if any are out playing
      const pal = Game.villagers.find((o) => o !== v && o.isChild() && o.task && o.task.a.id === 'play' && o.task.phase === 'do' && (v.rel[o.id] ?? 0) > 0);
      return pal ? randomNearby(v, 2, pal.x, pal.y) : randomNearby(v, 10);
    },
    tick: (v, task, dt) => {
      if (World.season === 'winter' && Math.random() < dt * 0.06) {
        const pal = Game.villagers.find((o) => o !== v && !o.inside && o.isChild() && dist(o.x, o.y, v.x, v.y) < 90);
        if (pal) FX.snowball(v.x, v.y - 8, pal.x, pal.y - 8);
      }
    },
    label2: (v) => (World.season === 'winter' ? 'Having a snowball fight' : 'Playing'),
  },
  chase: {
    label: 'Chasing a rabbit', icon: 'bunny', sat: { bored: -0.5 }, dur: 10, pose: 'walk', outdoor: true, stages: AWAKE,
    avail: (v) => World.rabbits.some((r) => dist(r.x, r.y, v.x, v.y) < 14 * 16),
    extra: (v) => (v.isChild() ? 0.35 : v.job === 'farmer' || v.home().plots.length ? 0.2 : 0.02),
    target: (v) => {
      let best = null, bd = 14 * 16;
      for (const r of World.rabbits) { const d = dist(r.x, r.y, v.x, v.y); if (d < bd) { bd = d; best = r; } }
      return best ? { x: best.x, y: best.y, rabbit: best } : null;
    },
    done: (v) => { v.say(v.isChild() ? R.pick(['Shoo, bunny! Not the cabbages!', 'Got away again! Next time, bunny!', 'Go home to your burrow!']) : R.pick(['Shoo! Off my cabbages!', 'Go on, git!', 'And stay out!'])); },
  },
  school: {
    label: 'Listening to stories under the old oak', icon: 'book', sat: { bored: -0.6, lonely: -0.3 }, dur: 60, pose: 'sit', stages: ['child'],
    avail: () => !!anyStoryteller(),
    extra: (v) => 0.35 + v.genes.curiosity * 0.2,
    target: (v) => freeSpot(v, World.storySeats),
    skill: 'lore', skillRate: 0.5,
    tick: (v, task, dt) => {
      const st = anyStoryteller();
      if (!st) { task.t = Math.min(task.t, 2); return; }
      // a well-read storyteller teaches more
      learn(v, dt * 0.0004 * (0.5 + st.edu), 'school');
    },
  },
  apprentice: {
    label: 'Watching a grown-up at work', icon: 'heart', sat: { bored: -0.45, lonely: -0.3 }, dur: 45, pose: 'stand', stages: ['child'],
    avail: (v) => v.age > BABY_DAYS + 1.5 && Game.villagers.some((o) => v.parents.includes(o.id) && o.task && o.task.a.job && o.task.phase === 'do' && !o.inside),
    extra: (v) => 0.15 + v.genes.curiosity * 0.15,
    time: (h) => (isDay(h) ? 1 : 0),
    target: (v) => {
      const p = Game.villagers.find((o) => v.parents.includes(o.id) && o.task && o.task.a.job && o.task.phase === 'do' && !o.inside);
      if (!p) return null;
      const t = randomNearby(v, 1.5, p.x, p.y);
      if (t) { t.mentor = p; t.faceTo = p; }
      return t;
    },
    tick: (v, task, dt) => {
      const m = task.target.mentor;
      if (!m || !m.task || !m.task.a.job) { task.t = Math.min(task.t, 1); return; }
      v.practice(JOBS[m.job] ? JOBS[m.job].skill : 'farming', dt, 0.6);
      learn(v, dt * 0.0001 * (0.5 + m.edu), 'work');
    },
    done: (v, task) => { const m = task.target.mentor; if (m) { v.bond(m, 0.03); v.apprenticedTo = m.job; } },
  },
  read_item: {
    label: 'Reading a storybook', icon: 'book', sat: { bored: -0.5 }, dur: 35, pose: 'sit', prop: 'book',
    avail: (v) => !!nearestItem(v, 'book'),
    extra: (v) => (v.isChild() ? 0.35 : 0.08) + v.genes.curiosity * 0.15,
    target: (v) => itemTarget(v, 'book'),
    skill: 'lore', skillRate: 0.8,
    // those who can't read yet still learn a little from the pictures
    tick: (v, task, dt) => learn(v, dt * (v.edu < 0.15 ? 0.0003 : 0.0005), 'books'),
  },
  stroll: {
    label: 'Out for a stroll', icon: null, sat: { bored: -0.2 }, dur: 6, pose: 'stand', outdoor: true,
    extra: () => 0.035,
    time: (h) => (isNight(h) ? 0.15 : 1),
    trait: (v) => 0.6 + v.genes.curiosity * 0.6,
    target: (v) => strollTarget(v),
  },
  potter: {
    label: 'Puttering about at home', icon: 'house', sat: { bored: -0.12, tired: -0.1, cold: -0.4 }, dur: 45, pose: 'inside',
    extra: (v, h) => (Game.raining ? 0.22 : 0.012) + (h >= 20 ? 0.05 : 0) + (World.season === 'winter' ? 0.06 : 0),
    target: (v) => ({ building: v.home() }),
  },
  crawl: {
    label: 'Crawling about', icon: 'baby', sat: { bored: -0.5 }, dur: 25, pose: 'walk', stages: ['baby'],
    // only out on the grass right beside a parent who's sitting or working outdoors
    avail: (v) => !Game.raining && World.season !== 'winter' && !!crawlMinder(v),
    time: (h) => (isDay(h) ? 1 : 0),
    extra: () => 0.15,
    target: (v) => { const c = crawlMinder(v); return c ? randomNearby(v, 1, c.x, c.y + 6) : null; },
  },
  cradle: {
    label: 'Gurgling in the cradle', icon: 'baby', sat: { bored: -0.4, cold: -0.4 }, dur: 40, pose: 'inside', stages: ['baby'],
    extra: () => 0.1,
    target: (v) => ({ building: v.home() }),
  },
  eat_item: {
    label: 'Eating some cake', icon: 'plate', sat: { hunger: -0.6, bored: -0.15 }, dur: 20, pose: 'stand', prop: 'plate',
    avail: (v) => !!nearestItem(v, 'cake'),
    extra: (v) => 0.15 + v.genes.appetite * 0.15,
    target: (v) => itemTarget(v, 'cake'),
  },
  ale_item: {
    label: 'Sampling the keg', icon: 'mug', sat: { thirst: -0.6, bored: -0.3, lonely: -0.1 }, dur: 25, pose: 'stand', prop: 'mug', stages: ADULT,
    avail: (v) => !!nearestItem(v, 'ale'),
    extra: (v) => 0.12 + v.genes.merriness * 0.15,
    target: (v) => itemTarget(v, 'ale'),
    tick: (v, task, dt) => { v.chem.ale = clamp(v.chem.ale + dt * (0.15 / 25), 0, 1); },
  },
  leaf_item: {
    label: 'Picking up a pouch of leaf', icon: 'leaf', sat: { bored: -0.05 }, dur: 4, pose: 'stand', stages: ADULT,
    avail: (v) => v.pouch < 4 && !!nearestItem(v, 'leaf'),
    extra: (v) => 0.1 + v.genes.pipeLove * 0.25 + v.drives.craving * 0.4,
    target: (v) => itemTarget(v, 'leaf'),
    done: (v) => { v.pouch += 4; },
  },
  remedy_item: {
    label: 'Taking a herbal remedy', icon: 'remedy', sat: { ache: -0.5 }, dur: 6, pose: 'stand',
    avail: (v) => v.isSick() && !!nearestItem(v, 'remedy'),
    extra: () => 0.5,
    target: (v) => itemTarget(v, 'remedy'),
    done: (v) => v.cure('a remedy someone left out'),
  },
  deliver: {
    label: 'Carrying goods', icon: 'sack', sat: {}, dur: 4, pose: 'inside', queued: true,
    target: (v, h, extra) => (extra && extra.dest ? { building: extra.dest, carry: true } : null),
    start: (v, task, extra) => { task.data.cargo = extra; return true; },
    label2: (v) => (v.task && v.task.data.cargo ? `Carrying ${RES_INFO[v.task.data.cargo.res] ? RES_INFO[v.task.data.cargo.res].label.toLowerCase() : 'goods'} to ${v.task.data.cargo.dest.name}` : 'Carrying goods'),
    done: (v, task) => {
      const c = task.data.cargo;
      if (!c) return;
      Village.produce(c.res, c.amt);
    },
  },

  // ----- jobs -----
  work_farm: {
    label: 'Working the barley fields', icon: 'grain', sat: { industry: -0.45, bored: -0.25 }, dur: 90, pose: 'work', prop: 'hoe', outdoor: true, job: 'farmer', skill: 'farming',
    avail: () => World.season !== 'winter' && World.fields.some((f) => f.plots.some((p) => !p.claimed && (p.stage === 0 || p.stage === 4 || p.stage < 4))),
    time: (h) => workHours(h, 7, 18),
    extra: () => 0.06,
    target: (v) => {
      // collect eggs now and then
      if (World.eggs >= 4 && R.chance(0.35)) return { x: World.henhouse.x + 10, y: World.henhouse.y + 4, facing: 'left', eggs: true };
      let best = null, bs = -1e9;
      for (const f of World.fields) for (const p of f.plots) {
        if (p.claimed) continue;
        const need = p.stage === 4 ? 3 : p.stage === 0 ? 2 : 0.4;
        const s = need * 100 - dist(v.x, v.y, p.x, p.y) * 0.05 + Math.random() * 30;
        if (s > bs) { bs = s; best = p; }
      }
      if (!best) return null;
      best.claimed = v.id;
      return { x: best.x, y: best.y + 3, facing: 'up', plot: best };
    },
    tick: (v, task, dt) => {
      const p = task.target.plot;
      if (!p) return;
      for (const f of World.fields) for (const q of f.plots) if (q.ty === p.ty && Math.abs(q.tx - p.tx) <= 3 && q.stage >= 1 && q.stage < 4) q.prog += dt / 120 * v.skillMul('farming');
    },
    done: (v, task) => {
      if (task.target.eggs) {
        const n = World.eggs; World.eggs = 0;
        queueDelivery(v, 'egg', n);
        return;
      }
      const p = task.target.plot;
      let grain = 0;
      for (const f of World.fields) for (const q of f.plots) {
        if (Math.abs(q.ty - p.ty) > 1 || Math.abs(q.tx - p.tx) > 4) continue;
        if (q.stage === 4) { grain += 4; q.stage = 1; q.prog = 0; }
        else if (q.stage === 0) { q.stage = 1; q.prog = 0; }
      }
      grain = Math.round(grain * 1.3 * v.skillMul('farming'));
      if (grain) { queueDelivery(v, 'grain', grain); if (R.chance(0.3)) v.say('A fine sheaf!'); }
    },
    release: (v, task) => { if (task.target.plot) task.target.plot.claimed = null; },
  },
  work_mill: {
    label: 'Grinding flour at the mill', icon: 'flour', sat: { industry: -0.45, bored: -0.15 }, dur: 60, pose: 'inside', job: 'miller', skill: 'cooking',
    avail: () => Village.stores.grain >= 2 && Village.stores.flour < 50,
    time: (h) => workHours(h, 7, 17),
    extra: () => 0.06 + (Village.stores.flour < 6 ? 0.1 : 0),
    // whichever mill is nearest: the Old Mill, the West Mill or the windmill
    target: (v) => ({ building: ['mill', 'mill2', 'windmill'].map((k) => World.buildings[k]).filter(Boolean).sort((a, b) => dist(a.stepX, a.stepY, v.x, v.y) - dist(b.stepX, b.stepY, v.x, v.y))[0] }),
    done: (v) => {
      const g = Math.min(12, Village.stores.grain);
      Village.use('grain', g);
      Village.produce('flour', Math.round(g * (0.8 + v.skillMul('cooking') * 0.4)));
    },
  },
  work_bake: {
    label: 'Baking at the Bakehouse', icon: 'bread', sat: { industry: -0.45, bored: -0.2 }, dur: 70, pose: 'inside', job: 'baker', skill: 'cooking',
    avail: () => Village.stores.flour >= 1 && Village.stores.bread + Village.stores.pie + Village.stores.cake < 50 + Game.villagers.length,
    time: (h) => workHours(h, 5, 15),
    extra: () => 0.06 + (Village.foodTotal() < 30 ? 0.25 : 0),
    target: (v) => {
      const b2 = World.buildings.bakery2;
      return { building: b2 && dist(b2.stepX, b2.stepY, v.x, v.y) < dist(World.buildings.bakery.stepX, World.buildings.bakery.stepY, v.x, v.y) ? b2 : World.buildings.bakery };
    },
    done: (v) => {
      const s = Village.stores, m = v.skillMul('cooking');
      if (s.apple >= 2 && s.flour >= 1 && R.chance(0.5)) { Village.use('apple', 2); Village.use('flour', 1); Village.produce('pie', Math.round(3 * m)); }
      else if (s.honey >= 1 && s.flour >= 1 && R.chance(0.4)) { Village.use('honey', 1); Village.use('flour', 1); Village.produce('cake', Math.round(3 * m)); }
      else { const f = Math.min(s.flour > 30 ? 6 : 4, s.flour); Village.use('flour', f); Village.produce('bread', Math.round(f * 4 * m)); }
    },
  },
  work_brew: {
    label: 'Brewing ale', icon: 'mug', sat: { industry: -0.45, bored: -0.2 }, dur: 70, pose: 'inside', job: 'brewer', skill: 'brewing',
    avail: () => Village.stores.grain >= 2 && Village.stores.ale < 70,
    time: (h) => workHours(h, 8, 18),
    extra: () => 0.06 + (Village.stores.ale < 10 ? 0.15 : 0),
    target: () => ({ building: World.buildings.brewhouse }),
    done: (v) => { Village.use('grain', 2); Village.produce('ale', Math.round(11 * v.skillMul('brewing'))); },
  },
  work_inn: {
    label: 'Keeping the inn', icon: 'mug', sat: { industry: -0.45, lonely: -0.4, bored: -0.3 }, dur: 60, pose: 'stand', prop: 'mug', job: 'innkeeper', skill: 'cooking',
    time: (h) => (h >= 11 && h < 23.5 ? (h >= 17 ? 1.4 : 0.7) : 0.01),
    extra: () => 0.08,
    target: (v, h) => {
      const list = inns();
      const inn = list.length > 1 && R.chance(0.5) ? list.find((b) => b !== World.inn) : World.inn;
      if (Game.raining || World.season === 'winter' || h >= 22.5 || R.chance(0.35)) return { building: inn, cooking: true };
      const s = R.pick(inn.serveSpots);
      return { x: s.x, y: s.y, facing: R.pick(['left', 'right', 'down']) };
    },
    done: (v) => {
      const s = Village.stores;
      if (s.veg >= 1 && (s.fish >= 1 || s.mush >= 1)) {
        Village.use('veg', 1); Village.use(s.fish >= 1 ? 'fish' : 'mush', 1);
        Village.produce('stew', Math.round(4 * v.skillMul('cooking')));
      } else if (s.veg >= 2) { Village.use('veg', 2); Village.produce('stew', Math.round(3 * v.skillMul('cooking'))); }
    },
  },
  work_leaf: {
    label: 'Picking pipe-weed', icon: 'leaf', sat: { industry: -0.45, bored: -0.2 }, dur: 50, pose: 'work', outdoor: true, job: 'grower', skill: 'farming',
    avail: () => World.season !== 'winter',
    time: (h) => workHours(h, 8, 18),
    extra: () => 0.06,
    target: (v) => {
      let best = null, bd = 1e9;
      for (const w of World.weed) {
        if (w.claimed) continue;
        const d = dist(v.x, v.y, w.x, w.y) - (w.stage === 4 ? 400 : w.stage === 0 ? 200 : 0) + Math.random() * 40;
        if (d < bd) { bd = d; best = w; }
      }
      if (!best) return null;
      best.claimed = v.id;
      return { x: best.x, y: best.y + 3, facing: 'up', weed: best };
    },
    tick: (v, task, dt) => {
      const w = task.target.weed;
      for (const q of World.weed) if (Math.abs(q.tx - w.tx) <= 2 && q.ty === w.ty && q.stage >= 1 && q.stage < 4) q.prog += dt / 100 * v.skillMul('farming');
    },
    done: (v, task) => {
      let got = 0;
      const w0 = task.target.weed;
      for (const w of World.weed) {
        if (Math.abs(w.tx - w0.tx) > 2 || w.ty !== w0.ty) continue;
        if (w.stage === 4) { w.stage = 1; w.prog = 0; got += 3; } else if (w.stage === 0) { w.stage = 1; w.prog = 0; }
      }
      got = Math.round(got * v.skillMul('farming'));
      if (got) { v.pouch = Math.min(12, v.pouch + 1); queueDelivery(v, 'leaf', got); }
    },
    release: (v, task) => { if (task.target.weed) task.target.weed.claimed = null; },
  },
  work_fish: {
    label: 'Fishing for the Store', icon: 'fish', sat: { industry: -0.45, bored: -0.3 }, dur: 90, pose: 'sit', prop: 'rod', outdoor: true, job: 'fisher', skill: 'fishing',
    time: (h) => workHours(h, 6, 19) * (World.season === 'winter' ? 0.5 : 1),
    extra: () => 0.06,
    target: (v) => freeSpot(v, World.fishing),
    tick: (v, task, dt) => {
      task.data.fishT = (task.data.fishT || 0) + dt;
      if (task.data.fishT > 15) {
        task.data.fishT = 0;
        const p = (World.season === 'winter' ? 0.12 : 0.28) + v.skills.fishing / 250;
        if (R.chance(p)) { task.data.catch = (task.data.catch || 0) + 1; FX.splash(v.x + 4, v.y + 18); if (R.chance(0.3)) v.say(R.pick(PHRASES.work_fish)); }
      }
    },
    done: (v, task) => queueDelivery(v, 'fish', task.data.catch || 0),
  },
  work_wood: {
    label: 'Felling timber', icon: 'axe', sat: { industry: -0.45, bored: -0.2 }, dur: 60, pose: 'work', prop: 'axe', outdoor: true, job: 'woodwright', skill: 'woodcraft',
    avail: () => World.woodSpots.some((s) => s.stock > 0 && !s.claimed),
    time: (h) => workHours(h, 8, 17),
    extra: () => 0.06 + (Village.stores.wood < 15 + firewoodReserve() + Village.projects.length * 6 ? 0.12 : 0) - (Village.projects.length && buildWood() >= 8 ? 0.06 : 0),
    target: (v) => {
      const s = nearestOf(v, World.woodSpots, (x) => x.stock > 0);
      if (!s) return null;
      s.claimed = v.id;
      return { x: s.x, y: s.y, facing: s.facing, wood: s };
    },
    tick: (v, task, dt) => { if (Math.random() < dt * 0.15) FX.chips(v.x + (facingLeft(v.facing) ? -8 : 8), v.y - 6); },
    done: (v, task) => {
      const s = task.target.wood;
      s.stock--;
      queueDelivery(v, 'wood', Math.round(6 * v.skillMul('woodcraft')));
    },
    release: (v, task) => { if (task.target.wood) task.target.wood.claimed = null; },
  },
  build: {
    label: 'Building', icon: 'hammer', sat: { industry: -0.5, bored: -0.3 }, dur: 80, pose: 'work', prop: 'spade', outdoor: true, job: 'woodwright', jobs: ['tinker'], skill: 'woodcraft',
    avail: (v) => Village.projects.some((p) => canWorkProject(v, p)),
    time: (h) => workHours(h, 8, 18),
    extra: (v) => 0.18 + (Village.projects.length > 1 ? 0.08 : 0) + (v.job === 'tinker' && Village.projects.some((p) => p.kind === 'retrofit') ? 0.1 : 0),
    target: (v) => {
      const open = Village.projects.filter((p) => canWorkProject(v, p));
      if (!open.length) return null;
      // spread the hands: go where fewest are working, nearest first
      const crew = (p) => Game.villagers.filter((o) => o.task && o.task.target && o.task.target.project === p).length;
      const p = open.sort((a, b) => crew(a) - crew(b) || b.prog - a.prog)[0];
      return { ...projectSpot(p), project: p };
    },
    tick: (v, task, dt) => {
      if (Math.random() > dt * 0.2) return;
      const k = task.target.project && task.target.project.kind;
      if (k === 'retrofit' || v.job === 'tinker') FX.sparkle(v.x, v.y - 8, '#5af8ff'); else if (k === 'building') FX.chips(v.x, v.y - 6); else FX.dirt(v.x, v.y - 2);
    },
    done: (v, task) => { const p = task.target.project; if (p && Village.projects.includes(p)) workProject(v, p); },
  },
  plough: {
    label: 'Plowing a new field', icon: 'hoe', sat: { industry: -0.5, bored: -0.25 }, dur: 70, pose: 'work', prop: 'hoe', outdoor: true, job: 'farmer', skill: 'farming',
    avail: () => Village.projects.some((p) => p.kind === 'field') && World.season !== 'winter',
    time: (h) => workHours(h, 7, 18),
    extra: () => 0.12,
    target: () => {
      const p = Village.projects.find((x) => x.kind === 'field');
      return p ? { ...projectSpot(p), project: p } : null;
    },
    tick: (v, task, dt) => { if (Math.random() < dt * 0.2) FX.dirt(v.x, v.y - 2); },
    done: (v, task) => { const p = task.target.project; if (p && Village.projects.includes(p)) workProject(v, p); },
  },
  work_herb: {
    label: 'Herb-gathering', icon: 'herb', sat: { industry: -0.45, bored: -0.25 }, dur: 45, pose: 'work', prop: 'basket', outdoor: true, job: 'herbalist', skill: 'herbalism',
    avail: () => World.season !== 'winter' || Village.stores.herbs >= 2,
    time: (h) => workHours(h, 8, 18),
    extra: () => 0.06,
    target: (v) => {
      if (Village.stores.herbs >= 2 && Village.stores.remedy < 8 && (R.chance(0.5) || World.season === 'winter')) return { building: World.buildings.herbalist, brew: true };
      const bed = nearestOf(v, World.herbBeds, (p) => p.stage === 4 || p.stage === 0);
      if (bed && R.chance(0.6)) { bed.claimed = v.id; return { x: bed.x, y: bed.y + 3, facing: 'up', bed }; }
      const w = nearestOf(v, World.wildHerbs, (s) => s.amount > 0);
      if (w) { w.claimed = v.id; return { x: w.x, y: w.y + 4, facing: 'up', wild: w }; }
      return null;
    },
    done: (v, task) => {
      const tg = task.target, m = v.skillMul('herbalism');
      if (tg.brew) { Village.use('herbs', 2); Village.produce('remedy', Math.max(1, Math.round(1.5 * m * (0.7 + v.edu * 0.6)))); return; }
      let got = 0;
      if (tg.bed) for (const p of World.herbBeds) { if (p.ty !== tg.bed.ty || Math.abs(p.tx - tg.bed.tx) > 2) continue; if (p.stage === 4) { got += 2; p.stage = 1; p.prog = 0; } else if (p.stage === 0) { p.stage = 1; p.prog = 0; } }
      if (tg.wild) { got += tg.wild.amount; tg.wild.amount = 0; }
      queueDelivery(v, 'herbs', Math.round(got * m));
    },
    release: (v, task) => { const tg = task.target; if (tg.bed) tg.bed.claimed = null; if (tg.wild) tg.wild.claimed = null; },
  },
  nurse: {
    label: 'Nursing the poorly', icon: 'remedy', sat: { industry: -0.4, lonely: -0.2 }, dur: 15, pose: 'stand', job: 'herbalist', skill: 'herbalism', pair: true,
    avail: (v) => Village.stores.remedy >= 1 && sickFolk().some((o) => o !== v && !o.nursedBy),
    extra: () => 0.6,
    time: (h) => (isNight(h) ? 0.2 : 1),
    target: (v) => {
      const s = sickFolk().filter((o) => o !== v && !o.nursedBy).sort((a, b) => dist(a.x, a.y, v.x, v.y) - dist(b.x, b.y, v.x, v.y))[0];
      if (!s) return null;
      s.nursedBy = v.id;
      if (s.inside) return { building: s.inside, patient: s };
      return { other: s, patient: s };
    },
    done: (v, task) => {
      const p = task.target.patient;
      if (!p || !Game.villagers.includes(p)) return;
      p.nursedBy = null;
      if (Village.stores.remedy < 1) return;
      Village.use('remedy', 1);
      p.cure(v.first, v);
      v.bond(p, 0.05);
    },
    release: (v, task) => { const p = task.target && task.target.patient; if (p && p.nursedBy === v.id) p.nursedBy = null; },
  },
  work_orchard: {
    label: 'Seeing to the orchard', icon: 'apple', sat: { industry: -0.45, bored: -0.25 }, dur: 45, pose: 'work', prop: 'basket', outdoor: true, job: 'orchardist', skill: 'farming',
    avail: () => World.orchard.some((t) => t.apples >= 2 && !t.claimed) || World.hives.some((h) => h.honey >= 2 && !h.claimed) || World.eggs >= 3,
    time: (h) => workHours(h, 8, 18),
    extra: () => 0.06,
    target: (v) => {
      const opts = [];
      const t = nearestOf(v, World.orchard, (x) => x.apples >= 2);
      if (t) opts.push([2, { x: t.x, y: t.y, facing: 'up', tree: t }]);
      const hv = nearestOf(v, World.hives, (x) => x.honey >= 2);
      if (hv) opts.push([1, { x: hv.x, y: hv.y, facing: 'up', hive: hv }]);
      if (World.eggs >= 3) opts.push([0.8, { x: World.henhouse.x + 10, y: World.henhouse.y + 4, facing: 'left', eggs: true }]);
      const pick = R.weighted(opts);
      if (pick && pick.tree) pick.tree.claimed = v.id;
      if (pick && pick.hive) pick.hive.claimed = v.id;
      return pick;
    },
    done: (v, task) => {
      const tg = task.target, m = v.skillMul('farming');
      if (tg.tree) { const n = tg.tree.apples; tg.tree.apples = 0; queueDelivery(v, 'apple', Math.round(n * 1.3 * m)); }
      if (tg.hive) { const n = tg.hive.honey; tg.hive.honey = 0; queueDelivery(v, 'honey', Math.round(n * m)); }
      if (tg.eggs) { const n = World.eggs; World.eggs = 0; queueDelivery(v, 'egg', n); }
    },
    release: (v, task) => { const tg = task.target; if (tg.tree) tg.tree.claimed = null; if (tg.hive) tg.hive.claimed = null; },
  },
  work_herd: {
    label: 'Tending the animals', icon: 'sheep', sat: { industry: -0.45, bored: -0.25, lonely: -0.1 }, dur: 50, pose: 'work', prop: 'basket', outdoor: true, job: 'herder', skill: 'farming',
    avail: () => World.pens.length > 0,
    time: (h) => workHours(h, 6, 18),
    extra: () => 0.08,
    target: (v) => {
      // the pen most in want of attention, nearest first
      const pen = World.pens.slice().sort((a, b) => a.tend - b.tend + (dist(v.x, v.y, a.gate.x, a.gate.y) - dist(v.x, v.y, b.gate.x, b.gate.y)) * 0.0004)[0];
      if (!pen) return null;
      const tx = R.i(pen.x0 + 1, pen.x1 - 1), ty = R.i(pen.y0 + 2, pen.y1);
      return { x: tx * 16 + 8, y: ty * 16 + 8, facing: R.pick(['left', 'right']), pen };
    },
    tick: (v, task, dt) => { if (Math.random() < dt * 0.02) v.say(R.pick(HERD_SAY[task.target.pen.kind])); },
    done: (v, task) => {
      const pen = task.target.pen, m = v.skillMul('farming');
      pen.tend = Math.min(1, pen.tend + 0.45);
      if (pen.kind === 'cow') queueDelivery(v, 'cheese', Math.round((World.season === 'winter' ? 2 : 4) * m));
      else if (pen.kind === 'sheep') queueDelivery(v, 'wool', Math.round((World.season === 'spring' ? 5 : 2) * m));
      else queueDelivery(v, 'veg', Math.round(1 * m)); // the pigs turn over the vegetable scraps and dig up a few taters
    },
  },
  work_allot: {
    label: 'Working the allotments', icon: 'hoe', sat: { industry: -0.45, bored: -0.25 }, dur: 60, pose: 'work', prop: 'hoe', outdoor: true, job: 'farmer', skill: 'farming',
    avail: () => World.season !== 'winter' && World.allotments.some((a) => a.plots.some((p) => !p.claimed && (p.stage === 4 || p.stage === 0))),
    time: (h) => workHours(h, 7, 18),
    extra: () => 0.07,
    target: (v) => {
      const plots = World.allotments.flatMap((a) => a.plots).filter((p) => !p.claimed && (p.stage === 4 || p.stage === 0));
      const p = plots.sort((a, b) => dist(v.x, v.y, a.x, a.y) - dist(v.x, v.y, b.x, b.y))[0];
      if (!p) return null;
      p.claimed = v.id;
      return { x: p.x, y: p.y + 3, facing: 'up', plot: p };
    },
    done: (v, task) => {
      const p = task.target.plot;
      let veg = 0;
      // the whole stretch of row near them gets seen to
      for (const a of World.allotments) for (const q of a.plots) {
        if (q.ty !== p.ty || Math.abs(q.tx - p.tx) > 2) continue;
        if (q.stage === 4) { veg += 2; q.stage = 1; q.prog = 0; } else if (q.stage === 0) { q.stage = 1; q.prog = 0; }
      }
      veg = Math.round(veg * v.skillMul('farming'));
      if (veg) { queueDelivery(v, 'veg', veg); if (R.chance(0.3)) v.say(R.pick(['Look at the size of this pumpkin!', 'Lovely taters.', 'A fine crop of cabbages.'])); }
    },
    release: (v, task) => { if (task.target.plot) task.target.plot.claimed = null; },
  },
  work_post: {
    label: 'Delivering the mail', icon: 'letter', sat: { industry: -0.45, lonely: -0.3, bored: -0.2 }, dur: 6, pose: 'stand', prop: 'letter', outdoor: true, job: 'postie', skill: 'lore',
    time: (h) => workHours(h, 8, 17),
    extra: () => 0.06,
    target: (v) => {
      const homes = World.homes.filter((h) => h.built && h.mailbox && h.id !== v.homeId && Game.villagers.some((o) => o.homeId === h.id));
      if (!homes.length) return null;
      const h = R.pick(homes);
      return { x: h.mailbox.x + 6, y: h.mailbox.y + 2, facing: 'left', mail: h };
    },
    done: (v, task) => Village.deliverLetter(v, task.target.mail),
  },
  work_story: {
    label: 'Telling stories beneath the old oak', icon: 'book', sat: { industry: -0.45, lonely: -0.5, bored: -0.4 }, dur: 100, pose: 'sit', prop: 'book', job: 'storyteller', skill: 'lore',
    // only worth it with little ones old enough to come to the oak
    avail: () => Game.villagers.some((o) => o.isChild() && kidBand(o) !== 'toddler' && !o.leaving),
    time: (h) => (h >= 13 && h < 18 ? 2 : h >= 9.5 && h < 12 ? 1.2 : 0.01) * (Game.raining ? 0.3 : 1),
    extra: () => 0.35,
    target: () => (World.storyteller.occ ? null : { spot: World.storyteller }),
    label2: (v) => (v.task && v.task.phase === 'do' && !v.task.data.heard ? 'Waiting beneath the old oak for the little ones' : 'Telling stories beneath the old oak'),
    tick: (v, task, dt) => {
      // tales are told to listeners: with none sat in the circle the storyteller
      // reads to themself, and if nobody has come within the half hour gives it up
      const heard = Game.villagers.some((o) => o.task && o.task.a.id === 'school' && o.task.phase === 'do' && !o.inside && dist(o.x, o.y, v.x, v.y) < 80);
      const coming = heard || Game.villagers.some((o) => o.task && (o.task.a.id === 'school' || (o.task.a.id === 'drop_off' && o.task.data.plan && o.task.data.plan.dest === 'school')));
      task.data.idle = coming ? 0 : (task.data.idle || 0) + dt;
      task.data.heard = heard;
      if (task.data.idle > 30) { task.t = Math.min(task.t, 1); return; }
      if (!heard) {
        if (!task.data.called) { task.data.called = true; v.say(R.pick(['Story time! Gather round, little ones!', 'Who wants a tale? Come and sit!', 'Under the oak, everyone! Story time!'])); }
        return;
      }
      if (Math.random() < dt * 0.04) v.say(R.pick(v.edu >= 0.6 ? STORY_FINE : STORY_PLAIN));
      // passers-by pick up a little of the tale too
      if (Math.random() < dt * 0.1) for (const o of Game.villagers) if (o !== v && !o.inside && o.task && o.task.a.id !== 'school' && dist(o.x, o.y, v.x, v.y) < 80) learn(o, 0.004, 'school');
    },
  },
  work_odd: {
    label: 'Lending a hand at the Common Store', icon: 'sack', sat: { industry: -0.35, bored: -0.1 }, dur: 40, pose: 'inside', stages: ADULT,
    avail: (v) => !!v.job || v.stage === 'adult',
    time: (h) => workHours(h, 8, 17),
    extra: () => 0.01,
    trait: () => 0.55,
    target: () => ({ building: R.chance(0.5) ? World.buildings.store : World.buildings.barn }),
  },
};
for (const k in ACTIONS) ACTIONS[k].id = k;

const ACTION_NAMES = {
  sleep: 'Sleeping in', tea: 'Tea', eat_home: 'Meals at home', eat_inn: 'Dining at the inn', ale: 'Ale', well: 'The well', smoke: 'Pipe-smoking',
  read: 'Reading', nap: 'Napping', garden: 'Gardening', forage: 'Mushrooming', fish: 'Fishing', market: 'Trips to the Store', chat: 'Gossip',
  gift: 'Courting', tend_baby: 'Baby-minding', party: 'Parties', fiddle: 'Fiddling', watch: 'Fireworks', play: 'Playing', chase: 'Chasing rabbits',
  school: 'Story time', apprentice: 'Watching grown-ups work', read_item: 'Storybooks', stroll: 'Strolling', potter: 'Puttering', crawl: 'Crawling',
  cradle: 'The cradle', eat_item: 'Cake', ale_item: 'Kegs', leaf_item: 'Free leaf', remedy_item: 'Remedies', deliver: 'Carrying', work_farm: 'Farm work',
  work_mill: 'Milling', work_bake: 'Baking', work_brew: 'Brewing', work_inn: 'Inn-keeping', work_leaf: 'Leaf-growing', work_fish: 'Fishing for the Store',
  work_wood: 'Timber-felling', build: 'Building', plough: 'Plowing', work_herb: 'Herb-gathering', nurse: 'Nursing', work_orchard: 'Orchard work', work_herd: 'Herding', work_allot: 'Allotments', work_post: 'Mail rounds',
  work_story: 'Storytelling', work_odd: 'Odd jobs', bake_home: 'Home baking',
};
// habits worth showing in the Mind tab
const HABIT_KEYS = ['eat_home', 'eat_inn', 'ale', 'tea', 'smoke', 'read', 'nap', 'garden', 'forage', 'fish', 'chat', 'party', 'stroll', 'potter', 'play', 'chase', 'school', 'gift'];
