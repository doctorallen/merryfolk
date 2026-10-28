'use strict';
// ---------------------------------------------------------------------------
// Society: the Common Store, trades, courtship and weddings, little ones,
// new homes, adventures, letters, and the archive of everyone who has ever
// lived in Thistledown (for family trees).
// ---------------------------------------------------------------------------

const RES_INFO = {
  grain: { label: 'Barley', icon: 'grain' }, flour: { label: 'Flour', icon: 'flour' }, bread: { label: 'Bread', icon: 'bread' },
  pie: { label: 'Apple pies', icon: 'pie' }, cheese: { label: 'Cheese', icon: 'cheese' }, wool: { label: 'Wool', icon: 'wool' }, cake: { label: 'Seed-cakes', icon: 'bread' }, veg: { label: 'Vegetables', icon: 'veg' },
  fish: { label: 'Fish', icon: 'fish' }, mush: { label: 'Mushrooms', icon: 'shroom' }, apple: { label: 'Apples', icon: 'apple' },
  egg: { label: 'Eggs', icon: 'egg' }, honey: { label: 'Honey', icon: 'honey' }, stew: { label: 'Stew', icon: 'stew' },
  ale: { label: 'Ale', icon: 'mug' }, leaf: { label: 'Pipe-weed', icon: 'leaf' }, wood: { label: 'Timber', icon: 'wood' },
  herbs: { label: 'Herbs', icon: 'herb' }, remedy: { label: 'Remedies', icon: 'remedy' }, scrap: { label: 'Rift salvage', icon: 'chip' },
};
const STORE_KEYS = Object.keys(RES_INFO);
const FOOD_KEYS = ['bread', 'pie', 'cake', 'veg', 'fish', 'mush', 'apple', 'egg', 'stew'];
// daily spoilage (fraction lost) outside winter
const SPOIL = { cheese: 0.02, bread: 0.1, pie: 0.1, cake: 0.08, veg: 0.05, fish: 0.2, mush: 0.15, apple: 0.03, egg: 0.08, stew: 0.5 };
const SMOKED = ['fish', 'bread', 'mush'];
const STORE_CAP = { scrap: 80, cheese: 50, wool: 60, grain: 320, flour: 60, bread: 80, pie: 40, cake: 40, veg: 120, fish: 50, mush: 40, apple: 80, egg: 40, honey: 30, stew: 40, ale: 90, leaf: 60, wood: 120, herbs: 30, remedy: 15 };
const HOME_CAP = (h) => (h.grand ? 6 : 4);

/** @type {VillageState} */
const Village = {
  stores: {}, today: { made: {}, used: {} }, yesterday: { made: {}, used: {} }, projects: [], wantHomes: 0,

  reset() {
    this.stores = { grain: 24, flour: 8, bread: 24, pie: 6, cake: 4, veg: 24, fish: 8, mush: 4, apple: 8, egg: 6, honey: 3, stew: 0, ale: 30, leaf: 16, wood: 36, herbs: 4, remedy: 3, cheese: 6, wool: 10, scrap: 0 };
    this.riftsOn = true; this.wayHome = 0; this.wayHomeTries = 0;
    this.today = { made: {}, used: {} }; this.yesterday = { made: {}, used: {} };
    this.projects = []; this.wantHomes = 0;
  },
  produce(res, n, priv = false) {
    if (!n || n <= 0) return;
    if (!priv) this.stores[res] = Math.min(storeCap(res), (this.stores[res] || 0) + n);
    this.today.made[res] = (this.today.made[res] || 0) + n;
  },
  use(res, n, priv = false) {
    if (!n || n <= 0) return;
    if (!priv) this.stores[res] = Math.max(0, (this.stores[res] || 0) - n);
    this.today.used[res] = (this.today.used[res] || 0) + n;
  },
  foodTotal() { let s = 0; for (const k of PANTRY_KINDS) s += this.stores[k] || 0; return s; },
  innkeeperOn() { return Game.villagers.some((v) => v.task && v.task.a.id === 'work_inn' && v.task.phase === 'do'); },

  // The mail carrier drops a letter through a door.
  deliverLetter(postie, home) {
    const residents = Game.villagers.filter((o) => o.homeId === home.id);
    if (!residents.length) return;
    const r = R.pick(residents);
    const away = Game.away.filter((a) => a.data.parents && (a.data.parents.includes(r.id) || r.parents.includes(a.data.id)) || (r.rel[a.data.id] || 0) > 0.4 || a.data.spouse === r.id);
    let from;
    if (away.length && R.chance(0.6)) {
      const a = R.pick(away);
      from = a.data.first;
      const line = R.pick(['I\'ve seen mountains taller than ten party trees!', 'The sea is ever so big, and ever so wet.', 'Met an elf. Very tall. Very polite.', 'Missing second breakfast terribly.', 'Found a cave full of glittering things!', 'Do water my tomatoes.']);
      chronicle(`${postie.first} the mail carrier brought ${r.first} a letter from ${from}, away adventuring: "${line}"`, 'letter');
      r.remember(`Got a letter from ${from}, far away.`, 2);
    } else {
      const friends = Object.entries(r.rel).filter(([id, f]) => f > 0.35 && +id !== r.id).map(([id]) => Game.villagers.find((o) => o.id === +id && o.homeId !== r.homeId)).filter(Boolean);
      const f = friends.length ? R.pick(friends) : null;
      if (f) { from = f.first; r.bond(f, 0.04); if (R.chance(0.3)) r.remember(`A letter from ${f.first} came through the door.`, 1); }
    }
    r.drives.lonely = Math.max(0, r.drives.lonely - 0.2);
    postie.say(R.pick(PHRASES.work_post));
  },
};

// ---------------------------------------------------------------------------
// Trades: chosen from talent, practice, family trade and what the village needs.
// ---------------------------------------------------------------------------
const JOB_HABIT = { tinker: 'gadget', herder: 'stroll', farmer: 'garden', fisher: 'fish', herbalist: 'forage', innkeeper: 'eat_inn', brewer: 'ale', grower: 'smoke', storyteller: 'read', orchardist: 'garden', postie: 'chat', baker: 'eat_home', miller: 'eat_home', woodwright: 'stroll' };
function jobFit(v, j) {
  const J = JOBS[j];
  let s = (v.skills[J.skill] || 0) + v.genes.apt[J.skill] * 40;
  if (v.parents.some((p) => { const pp = person(p); return pp && pp.job === j; })) s += 10;
  if (v.apprenticedTo === j) s += 8;
  const habit = JOB_HABIT[j];
  if (habit) s += (v.weights[habit] - 1) * 15;
  // lettered trades want schooling; the unlettered lean to work of the hands
  const LETTERED = { storyteller: 40, herbalist: 25, postie: 20, brewer: 10 };
  if (LETTERED[j]) s += (v.edu - 0.35) * LETTERED[j] * 1.5 - (v.edu < 0.2 ? 20 : 0);
  else if (['farmer', 'woodwright', 'fisher', 'grower'].includes(j)) s += (0.4 - v.edu) * 8;
  if (j === 'storyteller') s += v.stage === 'elder' ? 25 : -20;
  // a warm, patient soul who loves little ones, often with some of their own
  if (j === 'nanny') s += (v.genes.sociability + v.genes.merriness) * 14 - v.genes.temper * 25 + (Game.villagers.some((k) => k.isChild() && k.parents.includes(v.id)) ? 8 : 0) + v.genes.fertility * 10;
  // only the rift-minded know how the gadgets work
  if (j === 'tinker') s += v.tech * 40 - 25;
  return s;
}
function jobTargets() {
  const adults = Game.villagers.filter((v) => v.isGrown() && !v.leaving).length;
  const kids = Game.villagers.some((v) => v.isChild());
  const techAdults = Game.villagers.filter((v) => v.isGrown() && v.tech >= 0.6 && !v.leaving).length;
  const t = (min, frac) => Math.max(min, Math.round(adults * frac));
  return {
    farmer: t(2, 0.2), herder: World.pens.length ? t(1, 0.05) : 0, baker: t(2, 0.11) + (World.buildings.bakery2 ? 1 : 0) + (Village.stores.flour > 40 ? 1 : 0), miller: t(1, 0.05) + (Village.stores.grain > 80 ? 1 : 0) + (Village.stores.grain > 240 ? 1 : 0), brewer: t(1, 0.06), innkeeper: 1, grower: t(1, 0.05), fisher: t(1, 0.1),
    woodwright: Math.min(Math.max(2, Math.round(adults * 0.22)), t(1, Village.projects.some((p) => p.kind !== 'retrofit') ? 0.12 : 0.08) + (Village.projects.filter((p) => p.kind !== 'retrofit').length > 1 ? 1 : 0) + (Village.stores.wood < 10 + firewoodReserve() ? 1 : 0)), herbalist: 1, orchardist: t(1, 0.05), postie: adults > 10 ? 1 : 0, storyteller: kids ? 1 : 0,
    nanny: (() => { const n = Game.villagers.filter((v) => needsMinder(v)).length; return n >= 8 ? 2 : n >= 2 ? 1 : 0; })(),
    tinker: techAdults ? clamp(Math.round(techAdults * 0.25), 1, 4) + (Village.projects.some((p) => p.kind === 'retrofit') ? 1 : 0) : 0,
  };
}
function jobCounts() {
  const c = Object.fromEntries(Object.keys(JOBS).map((j) => [j, 0]));
  for (const v of Game.villagers) if (v.job && !v.leaving) c[v.job]++;
  return c;
}
function assignJobs(announce = true) {
  const targets = jobTargets();
  const counts = jobCounts();
  const need = (j) => targets[j] - counts[j];
  // retirement
  for (const v of Game.villagers) {
    if (v.stage === 'elder' && v.job && v.job !== 'storyteller' && v.age > ELDER_DAYS * 1.2 && !v.playerJob) {
      counts[v.job]--; if (announce) chronicle(`${v.name()} has retired ${Object.entries(v.stats).filter(([k]) => ACTIONS[k] && ACTIONS[k].job === v.job).reduce((s, [, n]) => s + n, 0) > 25 ? 'after many years as the village ' + JOBS[v.job].label.toLowerCase() : 'from ' + JOBS[v.job].label.toLowerCase() + ' work after a short spell'}, and means to put ${v.pron.their} feet up.`, 'info');
      v.remember(`Retired after years as a ${JOBS[v.job].label.toLowerCase()}.`, 1);
      v.job = null;
    }
  }
  const pool = Game.villagers.filter((v) => v.isGrown() && !v.job && !v.leaving && !v.playerJob && !v.newcomer);
  pool.sort((a, b) => b.age - a.age);
  for (const v of pool) {
    let best = null, bs = -1e9;
    for (const j in JOBS) {
      if (j === 'storyteller' && v.stage !== 'elder' && v.genes.apt.lore < 0.6) continue;
      if (v.stage === 'elder' && j !== 'storyteller' && v.age > ELDER_DAYS * 1.2) continue;
      const n = need(j);
      // the trades that only want one or two never take on extra hands
      if (n <= 0 && ['storyteller', 'herbalist', 'postie', 'innkeeper', 'tinker', 'nanny', 'lamplighter'].includes(j)) continue;
      const s = jobFit(v, j) + (n > 0 ? 30 + n * 10 : -25 + n * 10);
      if (s > bs) { bs = s; best = j; }
    }
    if (!best || (v.stage === 'elder' && best !== 'storyteller' && need(best) <= 0)) continue;
    v.job = best; counts[best]++;
    devLog('jobs', `${v.first} took up ${best} (score ${Math.round(bs)}: fit ${Math.round(jobFit(v, best))}, ${counts[best]}/${targets[best]} now)`);
    if (announce) {
      const fam = v.parents.some((p) => { const pp = person(p); return pp && pp.job === best; });
      chronicle(`${v.name()} has taken up the ${JOBS[best].label.toLowerCase()}'s trade${fam ? `, just like ${v.pron.their} parent before ${v.pron.them}` : ''}.`, 'work');
      v.remember(`Became the village ${JOBS[best].label.toLowerCase()}.`, 1);
    }
  }
  // when the village needs a nanny and nobody's free, the warmest soul among
  // the grown-ups (often a parent of little ones themselves) takes it up
  if (need('nanny') > 0) {
    const short = (j) => need(j) > 0 || counts[j] <= 1;
    const cands = Game.villagers.filter((v) => v.isGrown() && !v.leaving && !v.playerJob && !v.newcomer && v.job !== 'nanny' && !(v.stage === 'elder' && v.age > ELDER_DAYS * 1.2) && (!v.job || !short(v.job)) && !(v.job && Game.jobPlan && typeof Game.jobPlan[v.job] === 'number' && counts[v.job] <= Game.jobPlan[v.job]));
    const v = cands.sort((a, b) => jobFit(b, 'nanny') - jobFit(a, 'nanny'))[0];
    if (v) {
      if (v.job) counts[v.job]--;
      if (announce) chronicle(`${v.name()} has opened a nursery at ${v.home().name}, minding the little ones while their folk are at work.`, 'work');
      v.remember('Became the village nanny.', 1);
      devLog('jobs', `${v.first} became the nanny${v.job ? ' (was ' + v.job + ')' : ''}`);
      v.job = 'nanny'; counts.nanny++;
    }
  }
  // experience reshapes careers: overstaffed trades lose a hand to an understaffed one they're suited to
  for (const v of Game.villagers) {
    if (!v.job || v.playerJob || !v.isGrown() || !announce) continue;
    // the Steward's numbers stand
    if (Game.jobPlan && typeof Game.jobPlan[v.job] === 'number' && counts[v.job] <= Game.jobPlan[v.job]) continue;
    const essentialGap = ['farmer', 'baker', 'miller', 'woodwright', 'grower', 'brewer', 'fisher'].some((j) => need(j) > 0 && counts[j] === 0);
    if (need(v.job) >= 0 && !(essentialGap && need(v.job) <= 0) && R.chance(0.85)) continue;
    let best = null, bs = jobFit(v, v.job) + 20;
    for (const j in JOBS) { if (j === v.job || need(j) <= 0 || j === 'storyteller' || (Game.jobPlan && typeof Game.jobPlan[j] === 'number' && counts[j] >= Game.jobPlan[j])) continue; const s = jobFit(v, j) + need(j) * 8; if (s > bs) { bs = s; best = j; } }
    if (best && R.chance(essentialGap ? 0.8 : 0.35)) {
      chronicle(`${v.first} has hung up the ${JOBS[v.job].label.toLowerCase()}'s apron to become ${aAn(JOBS[best].label.toLowerCase())}.`, 'work');
      v.remember(`Changed trade: ${JOBS[v.job].label} to ${JOBS[best].label}.`, 0);
      devLog('jobs', `${v.first} switched ${v.job} → ${best} (${v.job} over-staffed, fit for ${best} ${Math.round(bs)})`);
      counts[v.job]--; counts[best]++; v.job = best;
    }
  }
}

// ---------------------------------------------------------------------------
// Homes: who lives where.
// ---------------------------------------------------------------------------
function residentsOf(h) { return Game.villagers.filter((v) => v.homeId === h.id && !v.leaving); }
function emptiestHome(exclude = -1) {
  const built = World.homes.filter((h) => h.built && h.id !== exclude);
  built.sort((a, b) => residentsOf(a).length / HOME_CAP(a) - residentsOf(b).length / HOME_CAP(b));
  return built[0];
}
function moveHome(v, h) {
  if (v.homeId === h.id) return;
  devLog('homes', `${v.first} moved from ${World.homes[v.homeId] ? World.homes[v.homeId].name : '?'} to ${h.name} (now ${residentsOf(h).length + 1} there)`);
  v.homeId = h.id;
  for (const b of Game.villagers) if (b.stage === 'baby' && b.parents.includes(v.id)) b.homeId = h.id;
}
// Spreads folk out of crowded holes; newlyweds and grown children move first.
// Every couple wants a hole of their own, and grown sons and daughters move out
// of a full family home when a spare one is going.
function settleHomes(newHome) {
  const emptyHome = () => World.homes.find((h) => h.built && residentsOf(h).length === 0);
  const moveIn = (mover, dest, why) => {
    const sp = mover.spouse ? Game.villagers.find((o) => o.id === mover.spouse && o.homeId === mover.homeId) : null;
    const from = mover.home();
    moveHome(mover, dest); if (sp) moveHome(sp, dest);
    if (why === 'own') chronicle(`${mover.first}${sp ? ' and ' + sp.first + ' have' : ' has'} moved into ${dest.name}, a home of their own at last.`, 'build');
    else if (why === 'nest') chronicle(`${mover.first} has left the family hole at ${from.name} and set up in ${dest.name}. Their folks have sent along three jars of jam.`, 'build');
    else chronicle(`${mover.first}${sp ? ' and ' + sp.first : ''} moved out of crowded ${from.name} into ${dest.name}.`, 'info');
    mover.remember(`Moved into ${dest.name}.`, 1);
    return sp;
  };
  // 1. too many under one roof
  for (const h of World.homes) {
    if (!h.built) continue;
    let res = residentsOf(h);
    let guard = 6;
    while (res.length > HOME_CAP(h) && guard-- > 0) {
      const mover = res.find((v) => v.isGrown() && !v.spouse && v.parents.some((p) => res.some((o) => o.id === p))) ||
        res.find((v) => v.isGrown() && v.spouse && v.parents.some((p) => res.some((o) => o.id === p))) ||
        res.find((v) => v.isGrown() && !v.spouse && v.parents.length) || res.find((v) => v.isGrown() && v.spouse && v.parents.length);
      if (!mover) break;
      const kids = Game.villagers.filter((k) => !k.isGrown() && k.homeId === h.id && k.parents.includes(mover.id));
      const dest = emptiestHome(h.id);
      const size = (mover.spouse ? 2 : 1) + kids.length;
      if (!dest || residentsOf(dest).length + size > HOME_CAP(dest)) { Village.wantHomes = Math.max(Village.wantHomes, 1); break; }
      moveIn(mover, dest, residentsOf(dest).length === 0 ? 'own' : 'crowd');
      for (const k of kids) moveHome(k, dest);
      res = residentsOf(h);
    }
  }
  // 2. a second married couple under the same roof gets the next empty hole
  for (const h of World.homes) {
    if (!h.built) continue;
    const res = residentsOf(h);
    const couples = res.filter((v) => v.spouse && v.id < v.spouse && res.some((o) => o.id === v.spouse));
    if (couples.length < 2) continue;
    const dest = emptyHome();
    if (!dest) break;
    // the younger couple moves, children and all
    const mover = couples.sort((a, b) => a.age - b.age)[0];
    const sp = moveIn(mover, dest, 'own');
    for (const k of Game.villagers) if (!k.isGrown() && k.homeId === h.id && (k.parents.includes(mover.id) || (sp && k.parents.includes(sp.id)))) moveHome(k, dest);
  }
  // 3. grown children fly the nest, one a day, when a spare hole is going
  const spare = World.homes.filter((h) => h.built && residentsOf(h).length === 0).length;
  if (spare > (newHome ? 0 : 1)) {
    for (const h of World.homes) {
      if (!h.built) continue;
      const res = residentsOf(h);
      const v = res.filter((o) => leavingNest(o, res)).sort((a, b) => b.age - a.age)[0];
      const dest = v && emptyHome();
      if (dest) { moveIn(v, dest, 'nest'); break; }
    }
  }
}

// ---------------------------------------------------------------------------
// The archive and departures
// ---------------------------------------------------------------------------
function archivePerson(v, reason) {
  Game.archive[v.id] = {
    id: v.id, first: v.first, surname: v.surname, genes: v.genes, parents: v.parents.slice(), spouse: v.spouse, born: v.born, stage: v.stage,
    job: v.job, left: Game.day, reason, years: v.years(), archived: true, look: v.look(),
  };
}

function startAdventure(v, kind = 'final', companion = null) {
  v.abort();
  if (v.inside) v.exitBuilding();
  v.queue = [];
  v.leaving = kind === 'trip' ? 'trip' : 'final';
  v.say(kind === 'trip' ? 'Back before the harvest!' : 'Off I go! Don\'t wait up.', 5);
  const a = { id: 'adventure', label: 'Off on an adventure', icon: 'pack', sat: {}, dur: 1, pose: 'stand' };
  v.repathTo(WEST_EXIT.x, WEST_EXIT.y);
  v.task = { a, phase: 'go', target: { x: WEST_EXIT.x, y: WEST_EXIT.y }, t: 1, data: {}, before: { ...v.drives } };
  v.iconT = 6;
  if (kind === 'trip') {
    Game.away.push({ data: v.serialize(), back: Game.day + R.i(1, 2), id: v.id });
    chronicle(`${v.name()} has shouldered a pack and set off to see the world. Back soon, they say!`, 'adventure');
  } else {
    archivePerson(v, 'adventure');
    const sp = Game.villagers.find((x) => x.id === v.spouse);
    if (companion && companion.leaving === 'final') { /* already announced with their companion */ }
    else if (companion) chronicle(`${v.first} and ${companion.first}, hand in hand, have set off on one last great adventure together, over the hills and far away.`, 'adventure');
    else if (!sp || sp.leaving !== 'final') chronicle(`${v.name()} has packed a walking stick and set off on a last great adventure, over the hills and far away.`, 'adventure');
    for (const o of Game.villagers) {
      if (o === v || o.leaving) continue;
      if (o.parents.includes(v.id)) o.remember(`Waved goodbye to ${v.first}, off on a last adventure.`, -1);
      else if (o.id === v.spouse && !companion) o.remember(`${v.first} set off on a last adventure.`, -2);
      else if ((o.rel[v.id] || 0) > 0.6) o.remember(`Said farewell to dear ${v.first}.`, -1);
    }
  }
}

function returnFromTrip(entry) {
  const v = new Villager(entry.data);
  v.x = WEST_EXIT.x + 16; v.y = WEST_EXIT.y;
  if (!World.homes[v.homeId] || !World.homes[v.homeId].built) v.homeId = emptiestHome().id;
  const TALES = ['a troll who turned to stone at dawn', 'a river of silver fish', 'a mountain with snow on top in summer', 'a market with forty kinds of cheese', 'the edge of the map', 'a very rude goblin', 'a lake as clear as glass', 'a bridge older than the Shire', 'an inn where the beds were made for Big Folk', 'a field of sunflowers taller than a hobbit', 'a wizard who asked the way', 'a sea that went on for ever', 'a forest where the trees whispered', 'elves singing in the night', 'a dwarf who sold maps of nowhere'];
  Game.talesUsed = (Game.talesUsed || []).slice(-8);
  const tale = R.pick(TALES.filter((t) => !Game.talesUsed.includes(t)));
  Game.talesUsed.push(tale);
  const trinket = R.pick(['a shiny brass button', 'a smooth blue stone', 'a pressed foreign flower', 'a tiny silver bell', 'a map with a hole in it', 'a jar of strange honey']);
  v.remember(`Came home from adventuring with ${trinket}.`, 2);
  v.skills.lore = Math.min(100, v.skills.lore + 8);
  v.drives.bored = 0;
  v.stats.trips = (v.stats.trips || 0) + 1;
  learn(v, 0.05, 'travel');
  Game.villagers.push(v);
  v.say('I\'m home! Put the kettle on!', 5);
  if (v.stage === 'adult' && !v.spouse && Game.villagers.length < MAX_POP - 1 && R.chance(0.4)) {
    const r = welcomeTraveller(null, true, v.genes.sex === 'f' ? 'm' : 'f');
    if (r.ok) {
      const p = r.v;
      p.x = v.x + 12; p.y = v.y; p.age = clamp(v.age + R.f(-3, 3), CHILD_DAYS + 0.5, ELDER_DAYS - 2);
      wed(v, p);
      chronicle(`${v.name()} is back from adventuring, full of tales of ${tale}, and has brought home a new spouse, ${p.first}, met far away!`, 'love');
      return;
    }
  }
  chronicle(`${v.name()} is back from adventuring, full of tales of ${tale}, and has brought home ${trinket}.`, 'adventure');
  for (const o of Game.villagers) if (o !== v && ((o.rel[v.id] || 0) > 0.5 || o.parents.includes(v.id) || v.parents.includes(o.id))) o.drives.lonely = Math.max(0, o.drives.lonely - 0.3);
}

// A newcomer walks in along the West Road (from a code or from nowhere at all).
function welcomeTraveller(data, quiet = false, sex = null) {
  if (Game.villagers.length >= MAX_POP) return { ok: false, msg: 'Thistledown is full to the rafters. Every hole is spoken for.' };
  const home = emptiestHome();
  let v;
  if (data) {
    v = new Villager({ first: data.f, surname: data.s, genes: data.g, age: clamp(data.a || 10, CHILD_DAYS, ELDER_DAYS - 1), skills: data.k, weights: data.w, homeId: home.id, x: WEST_EXIT.x, y: WEST_EXIT.y, born: Game.day, pouch: 2 });
    v.edu = typeof data.e === 'number' ? clamp(data.e, 0, 1) : startingEducation(v.genes, v.age);
  } else {
    v = new Villager({ sex, age: R.f(CHILD_DAYS + 0.5, 14), homeId: home.id, x: WEST_EXIT.x, y: WEST_EXIT.y, born: Game.day, pouch: 2 });
    for (const s of SKILLS) v.skills[s] = R.f(0, 25) * v.genes.apt[s];
  }
  v.remember('Arrived in Thistledown along the West Road.', 1);
  // a stranger finds their feet before they find a home and a trade
  if (!quiet) startNewcomer(v);
  Game.villagers.push(v);
  v.begin({ ...ACTIONS.stroll, target: () => ({ x: PLAZA.cx * 16, y: (PLAZA.cy + 1) * 16, facing: 'down' }) }, Game.hour);
  v.say('Hello! Is this Thistledown?', 5);
  for (const o of Game.villagers) if (o !== v) { o.rel[v.id] = 0.1; v.rel[o.id] = 0.1; }
  assignJobs(!quiet);
  if (!quiet) { chronicle(`A traveler, ${v.name()}, has come walking up the West Road, looking for somewhere to stay.`, 'birth'); Game.lastTraveller = Game.day; }
  return { ok: true, v };
}

// ---------------------------------------------------------------------------
// The daily round, at midnight.
// ---------------------------------------------------------------------------
// How much older someone is each midnight. Played as the wizard, childhood
// runs at half pace (eight days, not four), so there's time to know the
// children and have a hand in how they turn out.
function ageStep(v) { return v.isChild() && Game.mode === 'wizard' ? 0.5 : 1; }
// midnights until a child comes of age (1: tomorrow)
function daysToComeOfAge(v) { return v.isChild() ? Math.max(1, Math.ceil((CHILD_DAYS - v.age) / ageStep(v) - 1e-6)) : 0; }
function dailySociety() {
  const vs = Game.villagers;
  Village.yesterday = Village.today; Village.today = { made: {}, used: {} };

  // aging and coming of age
  for (const v of vs) {
    if (v.leaving) continue;
    v.age += ageStep(v);
    const st = v.lifeStage();
    if (st !== v.stage) {
      const was = v.stage;
      // out of someone's arms and onto their own two feet
      if (v.heldBy) { const g = personById(v.heldBy); setDownBaby(v); if (g && !v.inside) { v.x = g.x + 8; v.y = g.y; } }
      v.stage = st; v.refreshSprites();
      if (st === 'child') { chronicle(`Little ${v.first} is toddling about now, and getting into everything.`, 'birth'); v.remember('Took my first wobbly steps.', 2); }
      if (was === 'child' && st === 'adult') {
        chronicle(`${v.name()} has come of age! There'll be a party tonight.`, 'party');
        v.remember('Came of age at thirty-three!', 2);
        v.drives.industry = 0.3;
        Game.schedulePartyTonight('coming-of-age');
        if (v.edu < 0.15) chronicle(`(${v.first} never did learn to read. Story time might have helped.)`, 'info');
      }
      if (st === 'elder') { chronicle(`${v.name()} is getting on a bit, and has gone a little gray.`, 'info'); v.remember('Found my first gray hairs.', 0); }
    }
  }

  // births of expected little ones
  for (const v of vs.slice()) {
    if (!v.expecting || v.expecting.due > Game.day) continue;
    const other = vs.find((o) => o.id === v.expecting.with) || person(v.expecting.with) || ((Game.away || []).find((a) => a.id === v.expecting.with) || {}).data;
    v.expecting = null;
    if (!other) continue;
    const n = R.chance(0.05 + v.genes.fertility * 0.05) ? 2 : 1;
    const babies = [];
    for (let i = 0; i < n && Game.villagers.length < MAX_POP; i++) babies.push(birth(v, other));
    if (!babies.length) continue;
    const names = babies.map((b) => b.first).join(' and ');
    const look = describeLikeness(babies[0], v, other);
    const kind = babies.length === 2 ? (babies[0].genes.sex === babies[1].genes.sex ? (babies[0].genes.sex === 'f' ? 'Twin girls' : 'Twin boys') : 'Twins, a girl and a boy') : babies[0].genes.sex === 'f' ? 'A baby girl' : 'A baby boy';
    chronicle(`${kind}, ${names}, ${babies.length === 2 ? 'have' : 'has'} arrived at ${v.home().name}! Proud parents: ${v.first} & ${other.first}.${look ? ' ' + look : ''}`, 'birth');
    for (const b of babies) if (b.genes.mutations.length) chronicle(`${b.first} seems to have been born with ${b.genes.mutations[0]}. A curious thing.`, 'learn');
  }

  // sweethearts and weddings
  for (const a of vs) {
    if (a.stage !== 'adult' || a.spouse || a.leaving) continue;
    for (const id in a.love) {
      a.love[id] = Math.max(0, a.love[id] - 0.008);
    }
    if (!a.sweetheart) {
      let best = null, bv = 0.25;
      for (const b of vs) {
        if (b === a || b.sweetheart || b.spouse || !canCourt(a, b)) continue;
        const l = a.love[b.id] || 0;
        if (l > bv && (a.rel[b.id] || 0) > 0.2) { bv = l; best = b; }
      }
      if (best) {
        a.sweetheart = best.id; best.sweetheart = a.id; a.sweetDay = best.sweetDay = Game.day;
        chronicle(`${a.first} and ${best.first} have been seen walking out together. Sweethearts, by the look of it!`, 'love');
        a.remember(`Started walking out with ${best.first}.`, 2); best.remember(`Started walking out with ${a.first}.`, 2);
      }
    }
  }
  for (const a of vs) {
    if (!a.sweetheart || a.spouse) continue;
    const b = vs.find((o) => o.id === a.sweetheart);
    if (!b || b.leaving || b.spouse) { a.sweetheart = null; continue; }
    if (b.id < a.id) continue;
    const l = a.love[b.id] || 0;
    if (l < 0.1) {
      a.sweetheart = null; b.sweetheart = null;
      chronicle(`${a.first} and ${b.first} have parted ways. Plenty of fish in the river, as they say.`, 'info');
      a.remember(`Parted ways with ${b.first}.`, -1); b.remember(`Parted ways with ${a.first}.`, -1);
      continue;
    }
    if (l >= 0.6 && a.sweetDay !== Game.day) { const yes = R.chance(0.6); devLog('family', `${a.first} & ${b.first}: love ${l.toFixed(2)}, wedding roll (60%) → ${yes ? 'wed!' : 'not yet'}`); if (yes) wed(a, b); }
  }

  // expecting
  for (const a of vs) {
    if (!a.spouse || a.stage !== 'adult' || a.expecting || a.leaving) continue;
    const b = vs.find((x) => x.id === a.spouse);
    if (!b || b.id < a.id || b.stage !== 'adult' || b.expecting || a.wedDay === Game.day) continue;
    const kids = vs.filter((x) => x.parents.includes(a.id)).length + Object.values(Game.archive).filter((x) => x.parents.includes(a.id)).length;
    const want = 2 + Math.round(((a.genes.fertility + b.genes.fertility) / 2) * 3);
    if (kids >= want || vs.length + 1 >= MAX_POP) continue;
    if (vs.some((x) => (x.stage === 'baby' || x.born > Game.day - 4) && x.parents.includes(a.id))) continue;
    // with every knoll dug and folk still waiting for room, families hold off
    const crowded = !World.lots.some((l) => l.kind === 'home' && l.state === 'planned') && housingNeed() > 1 ? 0.4 : 1;
    const mother = a.genes.sex === 'f' ? a : b, father = mother === a ? b : a;
    if (mother.genes.sex !== 'f' || father.genes.sex !== 'm') continue;
    const pBaby = (0.35 * (a.mood() + b.mood()) / 2 + 0.12) * crowded, baby = R.chance(pBaby);
    devLog('family', `${mother.first} & ${father.first}: chance of a baby ${Math.round(pBaby * 100)}%${crowded < 1 ? ' (village crowded)' : ''}, ${kids}/${want} children → ${baby ? 'expecting!' : 'not this time'}`);
    if (baby) {
      mother.expecting = { due: Game.day + 1, with: father.id };
      chronicle(`${mother.first} and ${father.first} are expecting a little one! The knitting needles are out.`, 'birth');
    }
  }

  householdLessons();
  dailyRifts();
  // jobs, homes, building
  assignJobs(true);
  settleHomes(false);
  newcomersDaily();
  riftHabsDaily();
  planTown();

  // departures: last adventures for the old, short trips for the bold
  for (const v of vs) {
    if (v.leaving || v.stage !== 'elder') continue;
    const leaveAge = ADVENTURE_DAYS * (0.85 + v.genes.longevity * 0.35);
    if (v.age >= leaveAge && R.chance(0.4)) {
      const sp = vs.find((x) => x.id === v.spouse && x.stage === 'elder' && !x.leaving);
      const together = sp && sp.age > leaveAge * 0.85 && R.chance(0.7);
      startAdventure(v, 'final', together ? sp : null);
      if (together) startAdventure(sp, 'final', v);
      else if (sp) { sp.spouse = null; sp.sweetheart = null; }
      break;
    }
  }
  for (const v of vs) {
    if (v.leaving || v.stage !== 'adult' || v.genes.bravery < 0.65 || v.expecting || (v.spouse && (personById(v.spouse) || {}).expecting)) continue;
    if (vs.some((b) => b.stage === 'baby' && b.parents.includes(v.id))) continue;
    if (R.chance(0.05 * v.genes.bravery)) { startAdventure(v, 'trip'); break; }
  }
  for (const entry of Game.away.slice()) {
    if (entry.back <= Game.day && Game.villagers.length < MAX_POP) { Game.away = Game.away.filter((e) => e !== entry); returnFromTrip(entry); }
  }

  // the cold months bring sniffles
  const chillChance = { spring: 0.02, summer: 0.005, autumn: 0.04, winter: 0.07 }[World.season];
  for (const v of vs) if (!v.leaving && R.chance(chillChance * (1.3 - v.genes.hardiness))) v.catchCold(R.pick(['the damp', 'a drafty window', 'wet feet', 'the chill']));
  // new blood: a very small village always draws a settler or two; beyond that,
  // folk only come if word of a contented village gets about (steward.js)
  const live = Game.villagers.filter((v) => !v.leaving).length;
  if (live < 20 && R.chance(0.5)) {
    const r = welcomeTraveller(null, true);
    if (r.ok) chronicle(`${r.v.name()}, a traveler from over the hills, has come up the West Road looking for a quiet place to settle, and found one in ${r.v.home().name}.`, 'birth');
  }
  // friendships drift gently without tending; rivalries cool
  for (const v of vs) for (const id in v.rel) { const f = v.rel[id]; v.rel[id] = f > 0.1 ? f - 0.008 : f < 0 ? f + 0.02 : f; }

  for (const h of World.homes) if (h.built && !residentsOf(h).length) for (const k of PANTRY_KINDS) if (h.pantry[k]) { Village.stores[k] = (Village.stores[k] || 0) + h.pantry[k]; h.pantry[k] = 0; }
  // spoilage (the cold keeps things in winter) and store caps
  // woolens for the cold months
  const cold = World.season === 'autumn' || World.season === 'winter';
  const need = Math.ceil(Game.villagers.length / 15);
  Village.woollens = cold && (Village.stores.wool || 0) >= need;
  if (Village.woollens) Village.use('wool', need);
  const smoked = civicBuilt('smokehouse') ? 0.5 : 1;
  if (World.season !== 'winter') for (const k in SPOIL) Village.stores[k] = Math.floor((Village.stores[k] || 0) * (1 - SPOIL[k] * (SMOKED.includes(k) ? smoked : 1)));
  for (const h of World.homes) if (h.built && World.season !== 'winter') for (const k of SMOKED) if (k in h.pantry) h.pantry[k] = Math.floor(h.pantry[k] * (1 - 0.15 * smoked));

  // census
  const pop = Game.villagers.filter((v) => !v.leaving);
  Game.census.push({
    day: Game.day, pop: pop.length, mood: pop.reduce((s, v) => s + v.mood(), 0) / Math.max(1, pop.length),
    food: Village.foodTotal(), kids: pop.filter((v) => !v.isGrown()).length,
  });
  if (Game.census.length > 120) Game.census.shift();
}

function wed(a, b) {
  Game.stats.weddings = (Game.stats.weddings || 0) + 1;
  a.spouse = b.id; b.spouse = a.id; a.sweetheart = b.id; b.sweetheart = a.id;
  // newlyweds want a place of their own if one can be found
  const empty = World.homes.find((h) => h.built && residentsOf(h).length === 0);
  let home;
  if (empty) home = empty;
  else {
    const ha = a.home(), hb = b.home();
    home = residentsOf(ha).length <= residentsOf(hb).length ? ha : hb;
    Village.wantHomes++;
  }
  moveHome(a, home); moveHome(b, home);
  chronicle(`${a.first} and ${b.first} were wed beneath the party tree, and ${empty ? 'have set up home in ' : 'now share '}${home.name}.`, 'love');
  a.remember(`Married ${b.first} beneath the party tree.`, 3); b.remember(`Married ${a.first} beneath the party tree.`, 3);
  for (const o of Game.villagers) if (a.parents.includes(o.id) || b.parents.includes(o.id)) o.remember(`Saw ${a.parents.includes(o.id) ? a.first : b.first} wed.`, 2);
  Game.schedulePartyTonight('wedding');
}

function birth(a, b) {
  const genes = inheritGenes(a.genes, b.genes);
  const baby = new Villager({
    genes, age: 0, first: babyName(genes) || undefined, tech: ((a.tech || 0) + (b.tech || 0)) / 2 * 0.6, homeId: a.homeId, parents: [a.id, b.id], surname: R.chance(0.5) ? a.surname : b.surname,
    x: a.home().stepX, y: a.home().stepY, born: Game.day, drives: { hunger: 0.2, thirst: 0.1, tired: 0.3, lonely: 0.2, bored: 0.1, craving: 0, cold: 0, ache: 0, industry: 0 }, pouch: 0,
  });
  baby.rel[a.id] = 0.9; baby.rel[b.id] = 0.9; a.rel[baby.id] = 0.9; if (b.rel) b.rel[baby.id] = 0.9;
  for (const o of Game.villagers) if (o.parents.includes(a.id) || o.parents.includes(b.id)) { o.rel[baby.id] = 0.6; baby.rel[o.id] = 0.6; }
  baby.enterBuilding(a.home());
  baby.task = null;
  Game.villagers.push(baby);
  Game.stats.births = (Game.stats.births || 0) + 1;
  if (genes.rift > 0 && genes.rift < 0.99 && !Game.stats.firstHybrid) {
    Game.stats.firstHybrid = baby.id;
    chronicle(`${baby.first} is the first child of hill and rift! ${expressed(genes).chrome ? 'One of those little eyes glints chrome.' : 'A proper hill-folk button nose, mind.'}`, 'rift');
  }
  if (a.remember) a.remember(`Welcomed little ${baby.first} into the world.`, 3);
  if (b.remember) b.remember(`Welcomed little ${baby.first} into the world.`, 3);
  return baby;
}

function describeLikeness(baby, a, b) {
  const be = expressEyes(baby.genes.eyes), ae = expressEyes(a.genes.eyes), bee = expressEyes(b.genes.eyes);
  const bits = [];
  const freck = baby.genes.freckles[0] && baby.genes.freckles[1];
  const pf = (p) => p.genes.freckles[0] && p.genes.freckles[1];
  if (be !== ae && be !== bee) bits.push(`${EYE_INFO[be][0]} eyes, though neither parent has them (some grandparent must have)`);
  else if (be === ae && be !== bee) bits.push(`${a.first}'s ${EYE_INFO[be][0]} eyes`);
  else if (be === bee && be !== ae) bits.push(`${b.first}'s ${EYE_INFO[be][0]} eyes`);
  if (freck && !pf(a) && !pf(b)) bits.push('a surprise sprinkling of freckles');
  if (baby.genes.hair === a.genes.hair && baby.genes.hair !== b.genes.hair) bits.push(`${a.first}'s hair`);
  else if (baby.genes.hair === b.genes.hair && baby.genes.hair !== a.genes.hair) bits.push(`${b.first}'s hair`);
  return bits.length ? `${baby.first} has ${bits.slice(0, 2).join(' and ')}.` : '';
}

// Evening hearths burn timber in the colder months.
function lightHearths() {
  const need = { spring: 0.3, summer: 0, autumn: 0.7, winter: 1 }[World.season];
  let cold = 0;
  for (const h of World.homes) {
    if (!h.built || !residentsOf(h).length) { h.chilly = false; continue; }
    // sun-glass panels keep many hearths warm without timber
    if (Math.random() > need * (civicBuilt('array') ? 0.5 : 1) * (h.neon ? 0.7 : 1)) { h.chilly = false; continue; }
    if (Village.stores.wood >= 1) { Village.use('wood', 1); h.chilly = false; }
    else { h.chilly = true; cold++; }
  }
  if (cold && World.season === 'winter' && Game.chillNote !== Game.day) {
    Game.chillNote = Game.day;
    chronicle(`There's no timber in the Store, and ${cold} hearth${cold > 1 ? 's are' : ' is'} cold tonight. Brr!`, 'sick');
  }
}
