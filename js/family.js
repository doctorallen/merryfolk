'use strict';
// ---------------------------------------------------------------------------
// Family care. Little ones are never left on their own. A baby is always with
// a parent: in the cradle at home while a parent is in, or carried in their
// arms whenever they go out. A parent with a baby in their arms keeps to
// gentle things (a meal, a stroll, a natter, the Store) and leaves the work and
// the ale to someone else, so one parent stays home while the other works.
// If a little one is ever found alone, the nearest parent drops everything
// and comes for them.
// ---------------------------------------------------------------------------

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
function personById(id) { return id == null ? null : Game.villagers.find((o) => o.id === id) || null; }

// What a grown-up can do with a baby in their arms.
const ARMS_OK = new Set(['sleep', 'eat_home', 'eat_inn', 'tea', 'well', 'chat', 'stroll', 'market', 'read', 'potter', 'tend_baby', 'watch', 'party',
  'read_item', 'eat_item', 'remedy_item', 'bake_home', 'fetch_child', 'work_story']);

const HOME_ACTS = new Set(['sleep', 'eat_home', 'tea', 'potter', 'bake_home', 'tend_baby']);

// Is this little one with someone who's looking after them?
function isMinded(v) {
  if (v.heldBy) return true;
  const carers = carersOf(v);
  if (v.inside) return v.inside.inside.some((id) => carers.some((c) => c.id === id));
  // out of doors, a carer must be right there
  return carers.some((c) => !c.inside && dist(c.x, c.y, v.x, v.y) < 3 * 16);
}

// ----- carrying -----
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

// The little ones a grown-up would leave on their own by walking out now.
function leftBehind(g) {
  const b = g.inside;
  if (!b) return [];
  const here = b.inside.map(personById).filter(Boolean);
  return here.filter((o) => o.stage === 'baby' && !o.heldBy && carersOf(o).includes(g) && !here.some((c) => c !== g && carersOf(o).includes(c)));
}

// Before a grown-up sets off, they gather up any baby who'd otherwise be left
// alone. Returns false if the errand is no place for a baby, or there are
// more babies than arms.
function takeLittleOnes(g, a, target) {
  const leaving = !!g.inside && target.building !== g.inside;
  const held = g.holding ? g.holding.length : 0;
  if (!leaving) return !held || ARMS_OK.has(a.id);
  const babies = leftBehind(g);
  if (!babies.length && !held) return true;
  if (!ARMS_OK.has(a.id) || babies.length + held > 2) return false;
  for (const b of babies) holdBaby(g, b);
  if (babies.length && R.chance(0.4)) g.say(R.pick(['Come on, little one, you\'re coming with me.', 'Up you come!', 'Let\'s get you wrapped up warm.']), 2.6);
  return true;
}
// How many babies a grown-up would have in their arms if they went out now.
function armsFull(g) { return (g.holding ? g.holding.length : 0) + leftBehind(g).length; }

// ----- found alone -----
// Every few minutes each little one checks they're with someone. If not, the
// nearest carer is sent for.
function careCheck(v) {
  if (v.stage !== 'baby' || v.heldBy || v.leaving || v.carried || v.gone) return;
  if (isMinded(v)) { v.alone = 0; return; }
  v.alone = (v.alone || 0) + 1;
  const carers = carersOf(v);
  if (!carers.length) { fosterLittleOne(v); return; }
  if (carers.some((c) => c.task && c.task.a.id === 'fetch_child' && c.task.data.child === v)) return;
  const at = (o) => (o.inside ? [o.inside.stepX, o.inside.stepY] : [o.x, o.y]);
  const [vx, vy] = at(v);
  const g = carers.slice().sort((a, b) => dist(...at(a), vx, vy) - dist(...at(b), vx, vy))[0];
  devLog('family', `${v.first} was left alone ${v.inside ? 'in ' + v.inside.name : 'outdoors'}; ${g.first} is coming for them`);
  if (g.task && g.task.a.id !== 'deliver') g.abort();
  else if (g.task) { g.queue.unshift({ a: ACTIONS.fetch_child, extra: { child: v } }); return; }
  if (!g.begin(ACTIONS.fetch_child, Game.hour, { child: v })) {
    // can't get there: as a last resort the little one is simply taken home
    if (v.inside) v.exitBuilding();
    v.enterBuilding(v.home());
  }
}
function fetchArrive(g, task) {
  const c = task.data.child;
  if (!c || !Game.villagers.includes(c)) return;
  if (c.stage === 'baby') {
    // at home, being there is enough; anywhere else, they're scooped up
    if (c.inside && c.inside === c.home() && g.inside === c.inside) return;
    if (armsFull(g) < 2) holdBaby(g, c);
  }
  g.say(R.pick(['There you are!', 'Come here, poppet.', 'What are you doing out here on your own?']), 2.6);
  c.bond(g, 0.02);
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

// ----- the actions involved -----
Object.assign(ACTIONS, {
  // a baby in someone's arms
  held: {
    label: 'Snug in someone\'s arms', icon: null, sat: {}, dur: 1e9, pose: 'inside', manual: true, queued: true, stages: ['baby'],
    label2: (v) => { const g = personById(v.heldBy); return g ? `Snug in ${g.first}'s arms` : 'Being carried'; },
    target: () => ({}),
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
});
for (const k of ['held', 'fetch_child']) ACTIONS[k].id = k;
Object.assign(ACTION_NAMES, { held: 'Being carried', fetch_child: 'Fetching little ones' });
