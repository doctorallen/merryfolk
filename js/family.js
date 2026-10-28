'use strict';
// ---------------------------------------------------------------------------
// Family care. Little ones are never left on their own.
//
// A baby is always with a parent: in the cradle at home while a parent is in,
// or carried in their arms whenever they go out. A parent with a baby in their
// arms keeps to gentle things (a meal, a stroll, a natter, the Store) and
// leaves the work and the ale to someone else, so one parent stays home while
// the other works.
//
// Toddlers (two to four) and young children (five to seven) are always with a
// grown-up: at home with someone in, toddling along beside a parent, at the
// nanny's nursery or at the story circle. Parents drop them off on the way to
// work and collect them after. School-age children (eight to eleven) roam the
// village by day but are home by dark, and nobody under twelve eats at the
// inn on their own.
//
// If a little one is ever found alone, the nearest parent drops everything
// and comes for them.
// ---------------------------------------------------------------------------

// Where a child is in growing up, by their age in hobbit years.
function kidBand(v) {
  if (!v.isChild()) return null;
  const y = v.years();
  return y < 5 ? 'toddler' : y < 8 ? 'young' : y < 12 ? 'school' : 'youth';
}
// Little ones who must always have a grown-up with them.
function needsMinder(v) { const b = kidBand(v); return b === 'toddler' || b === 'young'; }
// How far a little one strays from whoever is minding them, outdoors.
function leashOf(v) { return kidBand(v) === 'toddler' ? 2.5 * 16 : 7 * 16; }

// Who's responsible for a little one: their parents, or if they have none
// here, the grown-ups they live with, or else their grown-up kin.
function carersOf(v) {
  const ok = (o) => o && o !== v && o.isGrown() && !o.leaving;
  const parents = v.parents.map((id) => Game.villagers.find((o) => o.id === id)).filter(ok);
  if (parents.length) return parents;
  const house = Game.villagers.filter((o) => ok(o) && o.homeId === v.homeId);
  if (house.length) return house;
  return Game.villagers.filter((o) => ok(o) && related(o, v));
}
// Who can keep an eye on a toddler or young child: their carers, any grown-up
// of the household or of the family, and big brothers and sisters of fourteen
// or more.
function mindersOf(v) {
  const out = carersOf(v);
  for (const o of Game.villagers) {
    if (o === v || o.leaving || out.includes(o) || o.stage === 'baby') continue;
    const big = o.isGrown() || (o.isChild() && o.years() >= 14);
    if (big && (o.homeId === v.homeId || (o.isGrown() && related(o, v)))) out.push(o);
  }
  return out;
}
function personById(id) { return id == null ? null : Game.villagers.find((o) => o.id === id) || null; }
// What a child calls a grown-up.
function kinWord(kid, o) {
  if (kid.parents.includes(o.id)) return o.genes.sex === 'f' ? 'Mom' : 'Dad';
  if (o.parents.some((p) => kid.parents.some((q) => { const pq = personById(q); return pq && pq.parents.includes(p); }))) return o.genes.sex === 'f' ? 'Auntie ' + o.first : 'Uncle ' + o.first;
  if (kid.parents.some((p) => { const pp = personById(p); return pp && pp.parents.includes(o.id); })) return o.genes.sex === 'f' ? 'Gran' : 'Granddad';
  return o.first;
}

// What a grown-up can do with a baby in their arms, or with little ones in tow.
const ARMS_OK = new Set(['sleep', 'eat_home', 'eat_inn', 'tea', 'well', 'chat', 'stroll', 'market', 'read', 'potter', 'tend_baby', 'watch', 'party',
  'read_item', 'eat_item', 'remedy_item', 'bake_home', 'fetch_child', 'collect_child', 'drop_off', 'work_story']);
const NOT_WITH_KIDS = new Set(['ale', 'smoke', 'ale_item', 'leaf_item', 'nap', 'nurse']);
// and with little ones in tow, home by their bedtime
function kidsOk(a, h) { return !NOT_WITH_KIDS.has(a.id) && (HOME_ACTS.has(a.id) || !(h >= 20.5 || h < 6)); }
const HOME_ACTS = new Set(['sleep', 'eat_home', 'tea', 'potter', 'bake_home', 'tend_baby']);

// ----- the nursery -----
// A nanny minds little ones in her own hole while their folk are at work.
function nurseries() {
  return Game.villagers.filter((n) => n.job === 'nanny' && !n.leaving && n.inside && n.inside === n.home() && n.task && n.task.a.id === 'work_nanny');
}
function atNursery(v) { return !!(v.inside && v.inside.kind === 'home' && v.inside.inside.some((id) => { const n = personById(id); return n && n.job === 'nanny' && n.home() === v.inside; })); }
function storyOn() { const s = anyStoryteller(); return s && Game.hour < 17.5 ? s : null; }

// Is this little one with someone who's looking after them?
function isMinded(v) {
  if (v.heldBy) return true;
  const baby = v.stage === 'baby';
  const ms = baby ? carersOf(v) : mindersOf(v);
  if (v.inside) {
    if (v.inside.inside.some((id) => ms.some((c) => c.id === id))) return true;
    return !baby && atNursery(v);
  }
  if (baby) return ms.some((c) => !c.inside && dist(c.x, c.y, v.x, v.y) < 3 * 16);
  // at the story circle while the storyteller's telling
  if (v.task && v.task.a.id === 'school' && v.task.phase === 'do' && storyOn()) return true;
  const leash = leashOf(v);
  if (ms.some((c) => !c.inside && dist(c.x, c.y, v.x, v.y) < leash + 16)) return true;
  // young ones may play in the garden while someone's in, watching from the window
  const home = v.home();
  return kidBand(v) === 'young' && dist(v.x, v.y, home.stepX, home.stepY) < 5 * 16 && home.inside.some((id) => ms.some((c) => c.id === id));
}

// Would a little one be looked after at this place? Used when choosing what to do.
function placeMinded(v, target) {
  const ms = mindersOf(v);
  if (target.building) {
    const b = target.building;
    return b.inside.some((id) => ms.some((c) => c.id === id)) || (b === v.inside && atNursery(v));
  }
  const x = target.x, y = target.y;
  if (x == null) return false;
  // they don't wander off far on their own
  const fx = v.inside ? v.inside.stepX : v.x, fy = v.inside ? v.inside.stepY : v.y;
  if (dist(fx, fy, x, y) > (kidBand(v) === 'toddler' ? 4 : 12) * 16) return false;
  const leash = leashOf(v);
  if (ms.some((c) => !c.inside && c.task && c.task.phase === 'do' && dist(c.x, c.y, x, y) < leash)) return true;
  const home = v.home();
  if (kidBand(v) === 'young' && dist(x, y, home.stepX, home.stepY) < 5 * 16 && home.inside.some((id) => ms.some((c) => c.id === id))) return true;
  const st = storyOn();
  return kidBand(v) === 'young' && !!st && target.spot && target.spot.kind === 'storyseat';
}

// ----- carrying babies -----
function holdBaby(g, b) {
  if (b.heldBy === g.id) return;
  if (b.heldBy) setDownBaby(b);
  b.abort();
  b.queue = [];
  b.heldBy = g.id;
  (g.holding || (g.holding = [])).push(b.id);
  b.task = { a: ACTIONS.held, phase: 'do', target: {}, t: 1e9, data: {}, before: { ...b.drives } };
  b.pose = 'inside';
  followCarrier(b, g);
}
function setDownBaby(b) {
  const g = personById(b.heldBy);
  if (g && g.holding) g.holding = g.holding.filter((id) => id !== b.id);
  b.heldBy = null;
  b.task = null; b.path = null; b.pose = 'stand';
  b.thinkDelay = R.f(0.5, 2);
}
// A carried baby goes wherever their carer goes, in and out of doors.
function followCarrier(b, g) {
  b.x = g.x; b.y = g.y; b.facing = g.facing;
  if (b.inside !== g.inside) {
    if (b.inside) b.inside.inside = b.inside.inside.filter((id) => id !== b.id);
    b.inside = g.inside;
    if (g.inside && !g.inside.inside.includes(b.id)) g.inside.inside.push(b.id);
  }
}
// Called each step for a baby in someone's arms.
function updateHeld(b) {
  const g = personById(b.heldBy);
  if (!g || g.leaving || g.gone) {
    // their carer is off: the baby goes back to the cradle at home
    if (g && g.holding) g.holding = g.holding.filter((id) => id !== b.id);
    b.heldBy = null; b.task = null;
    if (b.inside) b.exitBuilding();
    b.enterBuilding(b.home());
    return;
  }
  followCarrier(b, g);
  // home again: into the cradle
  if (g.inside && g.inside === b.home()) { setDownBaby(b); b.pose = 'inside'; }
}

// ----- leaving the house -----
// The little ones someone would leave on their own by walking out now, and
// whether they're minding other folk's children they can't simply take along.
function leftBehind(g) {
  const b = g.inside;
  const out = { babies: [], kids: [], stuck: false };
  if (!b) return out;
  const here = b.inside.map(personById).filter(Boolean);
  for (const o of here) {
    if (o === g || o.heldBy) continue;
    if (o.stage === 'baby') {
      const cs = carersOf(o);
      if (cs.includes(g) && !here.some((c) => c !== g && cs.includes(c))) out.babies.push(o);
    } else if (needsMinder(o) && !(o.task && o.task.a.follow)) {
      const ms = mindersOf(o);
      const others = here.some((c) => c !== g && ms.includes(c)) || (atNursery(o) && g.job !== 'nanny');
      if (others) continue;
      if (ms.includes(g)) out.kids.push(o);
      else if (g.job === 'nanny' && b === g.home()) out.stuck = true;
    }
  }
  return out;
}
function tagAlongs(g) { return Game.villagers.filter((o) => o.task && o.task.a.follow && o.task.data.minder === g); }
// How many babies a grown-up would have in their arms if they went out now.
function armsFull(g) { return (g.holding ? g.holding.length : 0) + leftBehind(g).babies.length; }

// Before someone sets off they gather up any little one who'd otherwise be
// left alone: babies into their arms, toddlers and young ones by the hand.
// Returns false if the errand is no place for them.
function takeLittleOnes(g, a, target, h) {
  const leaving = !!g.inside && target.building !== g.inside;
  const held = g.holding ? g.holding.length : 0;
  const tow = tagAlongs(g).length;
  if (!leaving) return (!held || ARMS_OK.has(a.id)) && (!tow || kidsOk(a, h));
  const lb = leftBehind(g);
  if (lb.stuck) return false;
  if ((lb.babies.length || held) && (!ARMS_OK.has(a.id) || lb.babies.length + held > 2)) return false;
  if ((lb.kids.length || tow) && !kidsOk(a, h)) return false;
  for (const b of lb.babies) holdBaby(g, b);
  for (const k of lb.kids) startTagAlong(k, g);
  if ((lb.babies.length || lb.kids.length) && R.chance(0.4)) {
    g.say(lb.babies.length ? R.pick(['Come on, little one, you\'re coming with me.', 'Up you come!', 'Let\'s get you wrapped up warm.'])
      : R.pick(['Shoes on, we\'re going out!', 'Hold my hand, now.', 'Come along, you lot!']), 2.6);
  }
  return true;
}

// Parents on their way to work drop the little ones at the nursery, or at the
// story circle if the storyteller's telling. Returns the drop-off errand to
// run first, or null.
function dropOffPlan(g, a) {
  if (!a.job || a.id === 'work_nanny' || Game.hour < 6.5 || Game.hour > 17) return null;
  const kids = [...new Set([...tagAlongs(g), ...leftBehind(g).kids])];
  if (!kids.length) return null;
  const st = storyOn();
  const young = kids.filter((k) => kidBand(k) === 'young');
  if (st && young.length === kids.length) return { dest: 'school', kids };
  const ns = nurseries().filter((n) => n !== g);
  if (!ns.length) return st && young.length ? { dest: 'school', kids: young } : null;
  const at = g.inside ? [g.inside.stepX, g.inside.stepY] : [g.x, g.y];
  const n = ns.sort((p, q) => dist(p.inside.stepX, p.inside.stepY, ...at) - dist(q.inside.stepX, q.inside.stepY, ...at))[0];
  return { dest: 'nursery', home: n.home(), nanny: n, kids };
}

// ----- tagging along -----
function startTagAlong(k, m) {
  if (k.task && k.task.a.follow && k.task.data.minder === m) return;
  k.abort();
  k.queue = [];
  k.begin(ACTIONS.tag_along, Game.hour, { minder: m });
}
// A little one keeps beside whoever is minding them, in and out of doors.
function followMinder(v, task, dt) {
  const m = task.data.minder;
  if (!m || !Game.villagers.includes(m) || m.leaving || m.gone) { v.abort(); return; }
  const d = v.drives;
  const relief = () => {
    d.lonely = Math.max(0, d.lonely - dt * 0.006);
    d.bored = Math.max(0, d.bored - dt * (m.task && m.task.a.id === 'party' ? 0.01 : 0.0025));
    // they share the meal
    const mt = m.task;
    if (mt && mt.phase === 'do' && (mt.a.id === 'eat_inn' || mt.a.id === 'eat_home')) {
      d.hunger = Math.max(0, d.hunger - dt * 0.014); d.thirst = Math.max(0, d.thirst - dt * 0.01);
      task.target.prop = 'plate';
    } else task.target.prop = null;
    // and watch them at work
    if (mt && mt.phase === 'do' && mt.a.job && JOBS[m.job]) v.practice(JOBS[m.job].skill, dt, 0.25);
  };
  // past a little one's bedtime, whoever has them heads for home
  const late = Game.hour >= 20.75 || Game.hour < 6;
  if (late && m.task && !HOME_ACTS.has(m.task.a.id) && !m.task.a.queued && m.task.phase === 'do' && m.task.t > 1) {
    m.task.t = 1;
    if (R.chance(0.5)) m.say(R.pick(['Come on, past your bedtime.', 'Home time, sleepyhead.', 'Let\'s get you to bed.']), 2.4);
  }
  if (m.inside) {
    if (v.inside === m.inside) {
      v.path = null; v.pose = 'inside'; task.phase = 'do';
      // home together: free to putter about
      if (m.inside === v.home()) { v.finish(); return; }
      relief();
      return;
    }
    if (v.inside) v.exitBuilding();
    const b = m.inside;
    if (dist(v.x, v.y, b.stepX, b.stepY) < 10) { v.enterBuilding(b); v.pose = 'inside'; v.path = null; return; }
    task.repathT = (task.repathT || 0) - dt;
    if (!v.path || task.repathT <= 0) { task.repathT = 2; if (!v.repathTo(b.stepX, b.stepY)) { v.x = b.stepX; v.y = b.stepY; } }
    v.walk(dt, 1.2); task.phase = 'go';
    return;
  }
  if (v.inside) v.exitBuilding();
  const side = (v.id % 2 ? 1 : -1) * (kidBand(v) === 'toddler' ? 9 : 12);
  const tx = m.x + side, ty = m.y + 2;
  const gap = dist(v.x, v.y, tx, ty);
  if (gap > 6) {
    task.repathT = (task.repathT || 0) - dt;
    const end = v.path && v.path[v.path.length - 1];
    if (!v.path || task.repathT <= 0 || (end && dist(end[0], end[1], tx, ty) > 20)) {
      task.repathT = 1.5;
      if (!v.repathTo(tx, ty)) { v.x = m.x; v.y = m.y; v.path = null; }
    }
    v.walk(dt, gap > 50 ? 1.4 : 1.1);
    task.phase = 'go';
    if (gap > 30) return;
  } else {
    v.path = null;
    v.pose = m.pose === 'dance' ? 'dance' : m.pose === 'sit' ? 'sit' : 'stand';
    v.facing = m.pose === 'walk' ? m.facing : m.x < v.x ? 'left' : 'right';
  }
  task.phase = 'do';
  relief();
}

// The grown-up hands the little ones over at the nursery or the story circle.
function handOver(g, task) {
  const plan = task.data.plan;
  if (!plan) return;
  const kids = tagAlongs(g);
  for (const k of kids) {
    k.abort();
    k.queue = [];
    if (plan.dest === 'nursery' && plan.home) {
      if (k.inside !== plan.home) { if (k.inside) k.exitBuilding(); k.enterBuilding(plan.home); }
      k.begin(ACTIONS.nursery, Game.hour, { home: plan.home });
    } else {
      if (!k.begin(ACTIONS.school, Game.hour)) startTagAlong(k, g);
    }
    if (R.chance(0.5)) k.say(kidBand(k) === 'toddler' ? R.pick(['Bye-bye!', 'Mama stay!', '*waves*']) : R.pick([`Bye, ${kinWord(k, g)}!`, 'See you later!', 'Can I go now?']), 2.4);
  }
  if (kids.length) g.say(plan.dest === 'nursery' && plan.nanny ? R.pick([`Be good for ${plan.nanny.first}!`, 'I\'ll be back for you after work.', 'Thank you ever so much.']) : R.pick(['Listen to the story, now.', 'Off you go, and pay attention!']), 2.6);
}

// ----- found alone -----
// Every few minutes each little one checks there's someone with them. A
// young child who can see their parent runs after them; otherwise the
// nearest grown-up who looks after them is sent for, and the little one waits.
function careCheck(v) {
  if (v.heldBy || v.leaving || v.carried || v.gone) return;
  const band = kidBand(v);
  if (v.stage !== 'baby' && !needsMinder(v)) {
    // older children: home by dark
    const h = Game.hour;
    if ((band === 'school' && (h >= 21 || h < 6)) && !v.inside && !(v.task && (v.task.a.follow || v.task.a.id === 'sleep'))) {
      v.abort();
      v.begin(ACTIONS.sleep, h);
    }
    return;
  }
  if (isMinded(v)) { v.alone = 0; return; }
  if (v.task && v.task.a.follow) {
    const m = v.task.data.minder;
    if (m && Game.villagers.includes(m) && !m.leaving) return;
  }
  v.alone = (v.alone || 0) + 1;
  const baby = v.stage === 'baby';
  const pool = baby ? carersOf(v) : mindersOf(v);
  if (!pool.length) { if (!carersOf(v).length) fosterLittleOne(v); return; }
  if (pool.some((c) => c.task && c.task.a.id === 'fetch_child' && c.task.data.child === v)) return;
  const at = (o) => (o.inside ? [o.inside.stepX, o.inside.stepY] : [o.x, o.y]);
  const [vx, vy] = at(v);
  const near = (o) => dist(...at(o), vx, vy);
  // carers first, then anyone else who minds them
  const carers = carersOf(v);
  const g = pool.slice().sort((a, b) => (carers.includes(b) - carers.includes(a)) * 160 + near(a) - near(b))[0];
  // a young one who can see them runs after them
  if (!baby && !g.inside && near(g) < (band === 'toddler' ? 6 : 18) * 16 && !(g.task && g.task.a.id === 'sleep')) { startTagAlong(v, g); return; }
  devLog('family', `${v.first} was left alone ${v.inside ? 'in ' + v.inside.name : 'outdoors'}; ${g.first} is coming for them`);
  if (!baby && !(v.task && v.task.a.id === 'wait_kid')) { v.abort(); v.queue = []; v.begin(ACTIONS.wait_kid, Game.hour); }
  if (g.task && g.task.a.id === 'deliver') { g.queue.unshift({ a: ACTIONS.fetch_child, extra: { child: v } }); return; }
  if (g.task) g.abort();
  if (!g.begin(ACTIONS.fetch_child, Game.hour, { child: v })) {
    // can't get there: as a last resort the little one is simply taken home
    if (v.inside) v.exitBuilding();
    v.enterBuilding(v.home());
  }
}
function fetchArrive(g, task) {
  const c = task.data.child;
  if (!c || !Game.villagers.includes(c)) return;
  const kidsToo = [c];
  if (c.stage === 'baby') {
    // at home, being there is enough; anywhere else, they're scooped up
    if (c.inside && c.inside === c.home() && g.inside === c.inside) return;
    if (armsFull(g) < 2) holdBaby(g, c);
  } else {
    // brothers and sisters at the same place come along too
    if (c.inside) for (const id of c.inside.inside) { const o = personById(id); if (o && o !== c && needsMinder(o) && mindersOf(o).includes(g)) kidsToo.push(o); }
    for (const k of kidsToo) if (!(k.inside && k.inside === k.home() && g.inside === k.inside)) startTagAlong(k, g);
  }
  if (task.a.id === 'collect_child') g.say(R.pick(['Time to go home!', 'Did you have a lovely day?', 'Come on, supper\'s waiting.']), 2.6);
  else g.say(R.pick(['There you are!', 'Come here, poppet.', 'What are you doing out here on your own?']), 2.6);
  for (const k of kidsToo) k.bond(g, 0.02);
}
// Little ones of mine at the nursery or the story circle, to collect.
function awayKids(g) {
  return Game.villagers.filter((k) => needsMinder(k) && carersOf(k).includes(g) && k.task && (k.task.a.id === 'nursery' || k.task.a.id === 'school'));
}

// A little one with nobody at all is taken in by kin, or by a kindly family.
function fosterLittleOne(v) {
  const homes = World.homes.filter((h) => h.built && h.id !== v.homeId);
  const grownIn = (h) => residentsOf(h).filter((o) => o.isGrown());
  const kin = homes.filter((h) => grownIn(h).some((o) => related(o, v)));
  const pool = (kin.length ? kin : homes.filter((h) => grownIn(h).length)).filter((h) => residentsOf(h).length < HOME_CAP(h) + 1);
  if (!pool.length) return;
  const h = pool.sort((a, b) => grownIn(b).length - grownIn(a).length || residentsOf(a).length - residentsOf(b).length)[0];
  moveHome(v, h);
  if (v.inside) v.exitBuilding();
  v.enterBuilding(h);
  const who = grownIn(h).map((o) => o.first);
  chronicle(`Little ${v.first} has gone to live with ${who.slice(0, 2).join(' and ')} at ${h.name}${kin.includes(h) ? ', who are family' : ''}.`, 'birth');
  devLog('family', `${v.first} had nobody to look after them: fostered at ${h.name}`);
}

// ----- choosing what to do -----
// Worked out once each time someone thinks: what they have in their care.
function careLoad(v) {
  if (v.stage === 'baby' || needsMinder(v)) return { arms: 0, kids: 0, stuck: false, flagging: false };
  const lb = v.inside ? leftBehind(v) : { babies: [], kids: [], stuck: false };
  const tow = tagAlongs(v);
  return {
    arms: (v.holding ? v.holding.length : 0) + lb.babies.length,
    kids: tow.length + lb.kids.length,
    stuck: lb.stuck,
    // tired or hungry little ones in tow want taking home
    flagging: tow.some((k) => k.drives.tired > 0.72 || k.drives.hunger > 0.72),
  };
}
// Why a little one can't do something on their own, or null if they can.
function kidBlock(v, a) {
  const band = kidBand(v);
  if (band === 'toddler' || band === 'young' || band === 'school') {
    if (a.id === 'eat_inn') return 'too young to eat out on their own';
  }
  if (!needsMinder(v)) return null;
  if (a.queued) return null;
  if (['market', 'well', 'stroll', 'read', 'fish', 'forage', 'gift', 'watch', 'party', 'nap', 'seek_home', 'rift_watch', 'rift_gawk', 'apprentice'].includes(a.id)) return 'needs a grown-up to go with them';
  if (a.id === 'school' && (band === 'toddler' || !storyOn())) return 'too little to go to the story circle alone';
  return null;
}

// ----- the actions involved -----
JOBS.nanny = { label: 'Nanny', skill: 'lore', icon: 'baby', desc: 'Minds the little ones in her hole while their folk are at work: songs, games, stories and naps.' };

Object.assign(ACTIONS, {
  // a baby in someone's arms
  held: {
    label: 'Snug in someone\'s arms', icon: null, sat: {}, dur: 1e9, pose: 'inside', manual: true, queued: true, stages: ['baby'],
    label2: (v) => { const g = personById(v.heldBy); return g ? `Snug in ${g.first}'s arms` : 'Being carried'; },
    target: () => ({}),
  },
  // a toddler or young child beside whoever is minding them
  tag_along: {
    label: 'Tagging along', icon: null, sat: {}, dur: 1e9, pose: 'stand', manual: true, queued: true, follow: true, stages: ['child'],
    label2: (v) => {
      const m = v.task && v.task.data.minder;
      if (!m) return 'Tagging along';
      const w = kinWord(v, m);
      const mt = m.task;
      if (mt && mt.phase === 'do' && (mt.a.id === 'eat_inn' || mt.a.id === 'eat_home')) return `Having a bite with ${w}`;
      if (mt && mt.phase === 'do' && mt.a.job) return `Watching ${w} at work`;
      return kidBand(v) === 'toddler' ? `Toddling along, holding ${w}'s hand` : `Tagging along with ${w}`;
    },
    target: (v, h, extra) => (extra && extra.minder ? { x: v.x, y: v.y } : null),
    start: (v, task, extra) => { task.data.minder = extra.minder; return true; },
  },
  wait_kid: {
    label: 'Waiting for a grown-up', icon: 'baby', sat: {}, dur: 45, pose: 'stand', manual: true, queued: true, stages: ['child'],
    target: (v) => (v.inside ? { building: v.inside } : { x: v.x, y: v.y }),
    tick: (v, task, dt) => {
      if (Math.random() < dt * 0.03) v.say(kidBand(v) === 'toddler' ? R.pick(['Mama?', 'Dada?', 'Waaah!', '*sniff*']) : R.pick(['Mom? Where are you?', 'Hello? Is anybody there?', 'I want to go home...']), 2.4);
    },
  },
  nursery: {
    label: 'At the nursery', icon: 'heart', sat: {}, dur: 600, pose: 'inside', manual: true, queued: true, stages: ['child'],
    label2: (v) => { const n = v.inside && v.inside.inside.map(personById).find((o) => o && o.job === 'nanny'); return n ? `At ${n.first}'s nursery` : 'At the nursery'; },
    target: (v, h, extra) => (extra && extra.home ? { building: extra.home } : null),
    tick: (v, task, dt) => {
      if (!atNursery(v)) { task.t = 0; return; }
      const d = v.drives;
      d.lonely = Math.max(0, d.lonely - dt * 0.008); d.bored = Math.max(0, d.bored - dt * 0.008);
      // a little lunch and an afternoon nap
      if (d.hunger > 0.5) d.hunger = Math.max(0, d.hunger - dt * 0.01);
      if (d.thirst > 0.4) d.thirst = Math.max(0, d.thirst - dt * 0.01);
      if (kidBand(v) === 'toddler' && Game.hour > 12.5 && Game.hour < 15) d.tired = Math.max(0, d.tired - dt * 0.004);
      learn(v, dt * 0.00015, 'school');
    },
  },
  fetch_child: {
    label: 'Fetching a little one', icon: 'baby', sat: {}, dur: 2, pose: 'stand', queued: true,
    label2: (v) => (v.task && v.task.data.child ? `Fetching little ${v.task.data.child.first}` : 'Fetching a little one'),
    target: (v, h, extra) => {
      const c = extra && extra.child;
      if (!c || !Game.villagers.includes(c)) return null;
      return c.inside ? { building: c.inside } : { other: c };
    },
    start: (v, task, extra) => { task.data.child = extra.child; return true; },
    tick: (v, task) => { if (!task.data.done) { task.data.done = true; fetchArrive(v, task); } },
  },
  // collecting the little ones from the nursery or story circle after work
  collect_child: {
    label: 'Collecting the little ones', icon: 'baby', sat: { lonely: -0.2 }, dur: 2, pose: 'stand', stages: ADULT,
    label2: (v) => (v.task && v.task.data.child ? `Collecting little ${v.task.data.child.first}` : 'Collecting the little ones'),
    avail: (v) => awayKids(v).length > 0,
    extra: (v, h) => (h >= 16.5 ? 0.9 : h >= 15 ? 0.35 : 0.02) + (v.task && v.task.a.job ? 0 : 0.1) + (h >= 19 ? 1.5 : 0),
    target: (v) => {
      const k = awayKids(v)[0];
      if (!k) return null;
      return k.inside ? { building: k.inside } : { other: k };
    },
    start: (v, task) => { task.data.child = awayKids(v)[0]; return !!task.data.child; },
    tick: (v, task) => { if (!task.data.done) { task.data.done = true; fetchArrive(v, task); } },
  },
  drop_off: {
    label: 'Dropping off the little ones', icon: 'baby', sat: {}, dur: 2, pose: 'stand', queued: true, stages: ADULT,
    label2: (v) => (v.task && v.task.data.plan && v.task.data.plan.dest === 'school' ? 'Walking the little ones to the story circle' : 'Dropping the little ones at the nursery'),
    target: (v, h, plan) => {
      if (!plan) return null;
      if (plan.dest === 'nursery') return { x: plan.home.stepX + R.i(-8, 8), y: plan.home.stepY + R.i(4, 10), facing: 'up' };
      const st = World.storyteller;
      return { x: st.x + R.i(-14, 14), y: st.y + R.i(10, 18), facing: 'up' };
    },
    start: (v, task, plan) => { task.data.plan = plan; return true; },
    done: (v, task) => handOver(v, task),
  },
  work_nanny: {
    label: 'Minding the little ones', icon: 'baby', sat: { industry: -0.45, lonely: -0.35, bored: -0.25 }, dur: 120, pose: 'inside', job: 'nanny', skill: 'lore',
    time: (h) => workHours(h, 7, 18),
    extra: () => 0.1 + Math.min(4, Game.villagers.filter((k) => needsMinder(k)).length) * 0.04,
    target: (v) => ({ building: v.home() }),
    tick: (v, task, dt) => {
      // songs, games, letters and naps for whoever's in
      for (const id of v.inside ? v.inside.inside : []) { const k = personById(id); if (k && k.isChild()) learn(k, dt * 0.00008 * (0.5 + v.edu), 'school'); }
    },
  },
});
for (const k of ['held', 'tag_along', 'wait_kid', 'nursery', 'fetch_child', 'collect_child', 'drop_off', 'work_nanny']) ACTIONS[k].id = k;
Object.assign(ACTION_NAMES, {
  held: 'Being carried', tag_along: 'Tagging along', wait_kid: 'Waiting for a grown-up', nursery: 'The nursery', fetch_child: 'Fetching little ones',
  collect_child: 'Collecting little ones', drop_off: 'Dropping off little ones', work_nanny: 'Nannying',
});

// ----- family routines -----
// Dinner is eaten together at home, round the kitchen table: whoever's about
// at dinnertime makes for home if the family's there, and eating together
// draws them closer. At bedtime a parent tells the little ones a story and
// tucks them in.
const DINNER = [17.75, 19.5];
function isDinner(h) { return h >= DINNER[0] && h < DINNER[1]; }
function householdOf(v) { return Game.villagers.filter((o) => o !== v && o.homeId === v.homeId && !o.leaving && o.stage !== 'baby'); }
// Somebody of the house is home (or on the way) for dinner.
function familyDinnerOn(v) {
  const home = v.home();
  return householdOf(v).some((o) => o.inside === home || (o.task && o.task.a.id === 'eat_home' && o.task.target.building === home));
}
function familyDinnerTick(v, task) {
  if (task.data.together || !isDinner(Game.hour) || v.inside !== v.home()) return;
  const at = householdOf(v).filter((o) => o.inside === v.home() && o.task && o.task.a.id === 'eat_home' && o.task.phase === 'do');
  if (!at.length) return;
  task.data.together = true;
  for (const o of at) v.bond(o, 0.02);
  v.drives.lonely = Math.max(0, v.drives.lonely - 0.25);
  if (v.stats.dinnerDay !== Game.day) {
    v.stats.dinnerDay = Game.day;
    const all = residentsOf(v.home()).filter((o) => o.stage !== 'baby');
    if (all.length >= 3 && all.every((o) => o.inside === v.home()) && Game.stats.familyDinnerNote !== Game.day && R.chance(0.35)) {
      Game.stats.familyDinnerNote = Game.day;
      chronicle(`The whole household at ${v.home().name} sat down to dinner together tonight: ${all.map((o) => o.first).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`, 'info');
    }
    if (R.chance(0.3)) v.remember(`Dinner with the family at ${v.home().name}.`, 1);
  }
}
// The little ones a grown-up might tell a bedtime story to.
function storyKids(v) {
  if (!v.isGrown() || v.inside !== v.home()) return [];
  return Game.villagers.filter((k) => k.isChild() && k.years() < 12 && k.homeId === v.homeId && k.inside === v.home() && k.storyDay !== Game.day && !(k.task && k.task.a.id === 'sleep'));
}
const BEDTIME = ['Once upon a time, in a hole in the ground...', 'And the dragon curled up and went to sleep. Just like you.', 'Night night. Sleep tight.', 'One more page, then lights out.', 'And they all lived happily ever after. The end.'];

Object.assign(ACTIONS, {
  bedtime_story: {
    label: 'Telling a bedtime story', icon: 'book', sat: { lonely: -0.3, bored: -0.2 }, dur: 20, pose: 'inside', stages: ADULT,
    label2: (v) => { const ks = storyKids(v); return ks.length ? `Telling ${ks.map((k) => k.first).join(' and ')} a bedtime story` : 'Telling a bedtime story'; },
    avail: (v) => storyKids(v).length > 0,
    time: (h) => (h >= 19 && h < 21.5 ? 1 : 0),
    extra: (v) => 1.4 + v.genes.fertility * 0.4 + v.edu * 0.3,
    target: (v) => ({ building: v.home() }),
    tick: (v, task, dt) => {
      if (Math.random() < dt * 0.03) v.say(R.pick(BEDTIME), 3);
      for (const k of storyKids(v)) learn(k, dt * 0.0002 * (0.5 + v.edu), 'home');
    },
    done: (v) => {
      // and then it's bed
      for (const k of storyKids(v)) {
        k.storyDay = Game.day;
        k.bond(v, 0.03);
        k.drives.lonely = Math.max(0, k.drives.lonely - 0.4);
        k.abort(); k.queue = [];
        k.begin(ACTIONS.sleep, Game.hour);
      }
    },
  },
});
ACTIONS.bedtime_story.id = 'bedtime_story';
ACTION_NAMES.bedtime_story = 'Bedtime stories';
HOME_ACTS.add('bedtime_story');
