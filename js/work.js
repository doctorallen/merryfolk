'use strict';
// ---------------------------------------------------------------------------
// Work. A trade isn't one action done over and over: it's a round of small
// jobs. A farmer sows, hoes, waters, weeds, harvests, carries the sheaves to
// the barn, mends a fence and sits a minute on the field edge; the innkeeper
// lights the fire, sweeps, cooks, takes orders, brings plates and mugs,
// clears the tables and washes up. When someone sets out to work, a round of
// three to five such jobs is planned from what's needed and queued up, and
// they go from one to the next, so a stint reads as hours of work with small
// variety rather than one pose held for an hour. During their working hours
// the trade pulls hard, and leisure has to wait unless a need is pressing.
//
// Meals at the inn are served. A diner sits and waits; the innkeeper takes
// the order, fetches the plate or the mug from the kitchen and brings it;
// only then do they eat. With nobody serving, folk wait, grumble, and either
// help themselves or leave. Empty mugs and plates are left on the tables
// until the innkeeper clears them.
// ---------------------------------------------------------------------------

// The main action of each trade (the one the brain picks), and the trades' rounds.
const MAIN_WORK = { farmer: 'work_farm', herder: 'work_herd', innkeeper: 'work_inn', woodwright: 'work_wood', baker: 'work_bake', brewer: 'work_brew', miller: 'work_mill', herbalist: 'work_herb', mailcarrier: 'work_mail', fisher: 'work_fish', grower: 'work_leaf', orchardist: 'work_orchard' };
const ROUNDS = {};
// what's left of the trade's output when the day is a proper working day with several stints
const YIELD = { work_farm: 0.25, work_herd: 0.5, work_wood: 0.55, work_bake: 0.65, work_brew: 0.5, work_mill: 0.85, work_herb: 0.55, work_fish: 0.5, work_leaf: 0.5, work_orchard: 0.5, work_allot: 0.6 };
// things that are fine to do in working hours
const SHIFT_OK = new Set(['sleep', 'eat_home', 'eat_inn', 'well', 'tea', 'nurse', 'tend_baby', 'drop_off', 'collect_child', 'remedy_item', 'lodge', 'deliver', 'work_odd']);

// --- places to stand ------------------------------------------------------
const wellSpot = (v) => { const w = nearestWell(v); return w ? { x: w.x, y: w.y, facing: 'up' } : null; };
// the nearest bit of water bank within a short walk, to fill a bucket at; or the well if it's nearer
const waterSpot = (v, reach = 14) => {
  const tx0 = Math.floor(v.x / 16), ty0 = Math.floor(v.y / 16);
  let best = null, bd = reach * reach;
  for (let ty = ty0 - reach; ty <= ty0 + reach; ty++) for (let tx = tx0 - reach; tx <= tx0 + reach; tx++) {
    if (!inMap(tx, ty) || World.tiles[tIdx(tx, ty)] !== T.WATER || !walkable(tx, ty - 1)) continue;
    const d = (tx - tx0) * (tx - tx0) + (ty - ty0) * (ty - ty0);
    if (d < bd) { bd = d; best = { x: tx * 16 + 8, y: (ty - 1) * 16 + 12, facing: 'down' }; }
  }
  const w = nearestWell(v);
  if (w && dist(w.x, w.y, v.x, v.y) < Math.sqrt(bd) * 16) return { x: w.x, y: w.y, facing: 'up' };
  return best;
};
const nearestField = (v) => World.fields.slice().sort((a, b) => dist((a.x0 + a.x1) * 8, (a.y0 + a.y1) * 8, v.x, v.y) - dist((b.x0 + b.x1) * 8, (b.y0 + b.y1) * 8, v.x, v.y))[0];
const inside = (key) => () => (World.buildings[key] ? { building: World.buildings[key] } : null);
const doorstep = (key, facing = 'down') => () => { const b = World.buildings[key]; return b ? { x: b.stepX + 6, y: b.stepY + 2, facing } : null; };
const plotOf = (v, plots, ok) => {
  let best = null, bs = -1e9;
  for (const p of plots) { if (p.claimed || (ok && !ok(p))) continue; const s = -dist(v.x, v.y, p.x, p.y) + Math.random() * 90; if (s > bs) { bs = s; best = p; } }
  if (!best) return null;
  best.claimed = v.id;
  return { x: best.x, y: best.y + 3, facing: 'up', plot: best };
};
const unclaim = (v, task) => { const t = task.target; for (const k of ['plot', 'bed', 'wild', 'tree', 'hive', 'wood', 'weed']) if (t[k] && t[k].claimed === v.id) t[k].claimed = null; };
const fieldPlots = () => World.fields.flatMap((f) => f.plots);
const penFor = (v) => World.pens.slice().sort((a, b) => a.tend - b.tend + (dist(v.x, v.y, a.gate.x, a.gate.y) - dist(v.x, v.y, b.gate.x, b.gate.y)) * 0.0004)[0] || null;
const penTrough = (pen) => ({ x: (pen.x0 + 1.5) * 16, y: (pen.y0 + 2) * 16 + 10, facing: 'up', pen });
const penHay = (pen) => ({ x: (pen.x1 - 1) * 16, y: (pen.y0 + 2) * 16 + 10, facing: 'up', pen });
const penInside = (pen) => ({ x: R.i(pen.x0 + 1, pen.x1 - 1) * 16 + 8, y: R.i(pen.y0 + 2, pen.y1) * 16 + 8, facing: R.pick(['left', 'right']), pen });
const penAnimal = (v, pen) => { const an = World.animals.filter((a) => a.pen === pen).sort((a, b) => dist(a.x, a.y, v.x, v.y) - dist(b.x, b.y, v.x, v.y))[0]; return an ? { x: an.x + 10, y: an.y + 2, facing: 'left', pen, animal: an } : penInside(pen); };
const litter = () => World.items.filter((it) => it.kind === 'mug' || it.kind === 'plate');
const nearestLitter = (v) => litter().sort((a, b) => dist(a.x, a.y, v.x, v.y) - dist(b.x, b.y, v.x, v.y))[0];

// --- the registry ---------------------------------------------------------
// A sub-task is a small action of its own: queued only (the brain never picks
// it on its own), with the trade's job and skill, a label for the Brain tab
// and the hover, its own pose and prop and place.
function subTask(main, k, def) {
  const job = Object.keys(MAIN_WORK).find((j) => MAIN_WORK[j] === main);
  const id = `${job}_${k}`;
  const a = {
    id, label: def.label, icon: def.icon || JOBS[job].icon, sat: { industry: -0.14, bored: -0.06, ...(def.sat || {}) }, dur: def.dur, pose: def.pose || 'work', prop: def.prop,
    outdoor: !def.inside, job, jobs: def.jobs, skill: JOBS[job].skill, skillRate: 0.5, queued: true,
    target: def.target, done: def.done, tick: def.tick, start: def.start, release: def.release || unclaim, label2: def.label2, say: def.say,
  };
  ACTIONS[id] = a; ACTION_NAMES[id] = def.label;
  (ROUNDS[main] || (ROUNDS[main] = [])).push({ ...def, id, a, main });
  return a;
}
// an existing action used as a step of a round, cut to a stint's length
function step(main, a, dur, need, opts = {}) { (ROUNDS[main] || (ROUNDS[main] = [])).push({ id: a.id, a, dur, need, main, ...opts }); }

// Hauling: fetch goods at one building and carry them (sack on the shoulder)
// to another. The stores are one pool, so nothing is made or used: it's the
// walk that shows the chain. `deliver` is the existing carrying action.
function haulStep(main, k, res, from, to, label, need, amt = 4) {
  subTask(main, k, {
    label, dur: 3, pose: 'inside', inside: true, icon: 'sack',
    target: () => (World.buildings[from] && World.buildings[to] ? { building: World.buildings[from] } : null),
    done: (v) => { v.queue.unshift({ a: ACTIONS.deliver, extra: { res, amt, dest: World.buildings[to], move: true } }); },
    need,
  });
}

// --- the rounds -----------------------------------------------------------
const MORNING = (h) => (h < 11 ? 2 : 0.3), AFTERNOON = (h) => (h >= 13 ? 1.5 : 0.5);
{
  // the farmer: sow, hoe, water, weed, harvest, carry to the barn, mend the fence, eggs, a sit on the field edge
  const F = 'work_farm';
  subTask(F, 'sow', { label: 'Sowing barley', dur: 18, prop: 'sack', need: () => (World.season !== 'winter' && fieldPlots().some((p) => !p.claimed && p.stage === 0) ? 3 : 0),
    target: (v) => plotOf(v, fieldPlots(), (p) => p.stage === 0), done: (v, task) => { const p = task.target.plot; for (const q of fieldPlots()) if (q.ty === p.ty && Math.abs(q.tx - p.tx) <= 4 && q.stage === 0) { q.stage = 1; q.prog = 0; } }, say: ['Seed by seed.', 'In you go.'] });
  subTask(F, 'weed', { label: 'Weeding the barley', dur: 16, prop: 'hoe', need: () => (World.season !== 'winter' && fieldPlots().some((p) => !p.claimed && p.stage >= 1 && p.stage < 4) ? 1.5 : 0),
    target: (v) => plotOf(v, fieldPlots(), (p) => p.stage >= 1 && p.stage < 4), tick: (v, task, dt) => { const p = task.target.plot; for (const q of fieldPlots()) if (q.ty === p.ty && Math.abs(q.tx - p.tx) <= 3 && q.stage >= 1 && q.stage < 4) q.prog += dt / 200 * v.skillMul('farming'); }, say: ['Out, you thistles.', 'Docks everywhere this year.'] });
  subTask(F, 'fetchwater', { label: 'Filling a bucket', dur: 3, pose: 'stand', prop: 'bucket', need: (v, h) => (World.season !== 'winter' && !Game.raining ? (Game.hazard && Game.hazard.k === 'drought' ? 3 : 1) : 0), target: (v) => waterSpot(v), done: (v) => { v._bucket = true; } });
  subTask(F, 'water', { label: 'Watering the barley', dur: 12, prop: 'bucket', need: (v) => (v._bucket && World.season !== 'winter' ? 2 : 0),
    target: (v) => plotOf(v, fieldPlots(), (p) => p.stage >= 1 && p.stage < 4), tick: (v, task, dt) => { const p = task.target.plot; for (const q of fieldPlots()) if (q.ty === p.ty && Math.abs(q.tx - p.tx) <= 3 && q.stage >= 1 && q.stage < 4) q.prog += dt / 160; }, done: (v) => { v._bucket = false; } });
  step(F, ACTIONS.work_farm, 30, () => (World.season !== 'winter' && fieldPlots().some((p) => !p.claimed && (p.stage === 4 || p.stage === 0)) ? 3 : 0.4), { label: 'Hoeing and harvesting' });
  subTask(F, 'fence', { label: 'Mending the field fence', dur: 14, prop: 'spade', need: () => (World.fields.length ? 0.5 : 0),
    target: (v) => { const f = nearestField(v); if (!f) return null; const p = R.pick(f.plots.filter((q) => q.ty === f.y1 || q.ty === f.y1 - 1)) || f.plots[0]; return p ? { x: p.x, y: p.y + 3, facing: 'down' } : null; }, say: ['That post has had it.', 'Hold still, you.'] });
  subTask(F, 'eggs', { label: 'Collecting the eggs', dur: 6, prop: 'basket', pose: 'stand', need: () => (World.eggs >= 6 ? 0.6 : 0), target: () => ({ x: World.henhouse.x + 10, y: World.henhouse.y + 4, facing: 'left' }), done: (v) => { const n = World.eggs; World.eggs = 0; queueDelivery(v, 'egg', n); } });
  subTask(F, 'rest', { label: 'A sit on the field edge', dur: 7, pose: 'sit', sat: { industry: 0, bored: -0.15, tired: -0.05 }, need: () => 0,
    target: (v) => { const f = nearestField(v); const p = f && R.pick(f.plots.filter((q) => q.ty === f.y1 || q.ty === f.y1 - 1)); return p ? { x: p.x, y: p.y + 3, facing: 'down' } : wellSpot(v); }, say: ['Phew.', 'Good barley this year.', 'That\'s the back gone.'] });
}
{
  // the herder: feed, water, muck out, bedding, brush, and the milking, shearing and scraps the animals give
  const H = 'work_herd';
  subTask(H, 'feed', { label: 'Feeding the animals', dur: 10, prop: 'sack', need: (v, h) => (World.pens.length ? MORNING(h) * 1.5 : 0), target: (v) => { const p = penFor(v); return p && penTrough(p); }, done: (v, task) => { task.target.pen.tend = Math.min(1, task.target.pen.tend + 0.2); }, say: ['Breakfast, you lot!', 'Steady now.'] });
  subTask(H, 'fetchwater', { label: 'Fetching water for the trough', dur: 3, pose: 'stand', prop: 'bucket', need: () => (World.pens.length ? 1 : 0), target: (v) => waterSpot(v, 18), done: (v) => { v._bucket = true; } });
  subTask(H, 'water', { label: 'Filling the trough', dur: 6, prop: 'bucket', need: (v) => (v._bucket ? 2 : 0), target: (v) => { const p = penFor(v); return p && penTrough(p); }, done: (v, task) => { v._bucket = false; task.target.pen.tend = Math.min(1, task.target.pen.tend + 0.1); } });
  subTask(H, 'muck', { label: 'Mucking out', dur: 16, prop: 'spade', need: (v, h) => (World.pens.length ? AFTERNOON(h) : 0), target: (v) => { const p = penFor(v); return p && penInside(p); }, done: (v, task) => { task.target.pen.tend = Math.min(1, task.target.pen.tend + 0.15); }, say: ['Pooh.', 'Where does it all come from?'] });
  subTask(H, 'bedding', { label: 'Laying fresh bedding', dur: 10, prop: 'sack', need: (v, h) => (World.pens.length ? AFTERNOON(h) * 0.7 : 0), target: (v) => { const p = penFor(v); return p && (p.kind === 'pig' ? penInside(p) : penHay(p)); } });
  subTask(H, 'brush', { label: 'Looking the animals over', dur: 9, prop: 'brush', pose: 'stand', need: () => (World.animals.length ? 1 : 0), target: (v) => { const p = penFor(v); return p && penAnimal(v, p); }, tick: (v, task, dt) => { if (Math.random() < dt * 0.03) v.say(R.pick(HERD_SAY[task.target.pen.kind])); } });
  step(H, ACTIONS.work_herd, 22, () => (World.pens.length ? 1.5 : 0), { label: 'Milking, shearing and the rest' });
}
{
  // the innkeeper: the fire, the sweeping, the cooking, orders, plates and mugs, clearing, washing up, a keg
  const I = 'work_inn';
  const inn = () => World.inn;
  subTask(I, 'fire', { label: 'Lighting the inn fire', dur: 6, inside: true, pose: 'inside', need: (v, h) => (h < 12 ? 1.5 : 0), target: () => ({ building: inn() }) });
  subTask(I, 'sweep', { label: 'Sweeping the inn', dur: 9, prop: 'broom', need: (v, h) => (h < 12 || litter().length ? 1 : 0.4), target: () => { const s = R.pick(inn().serveSpots); return { x: s.x, y: s.y, facing: 'down' }; } });
  subTask(I, 'cook', { label: 'Cooking at the range', dur: 20, inside: true, pose: 'inside', need: () => (Village.stores.stew < 12 ? 2 : 0.8), target: () => ({ building: inn() }), done: (v) => { Village._yield = 0.6; try { ACTIONS.work_inn.done(v); } finally { Village._yield = 0; } } });
  subTask(I, 'serve', { label: 'Taking an order', dur: 2, pose: 'stand', need: () => diners('waiting').length * 6, label2: () => 'Taking an order',
    target: (v) => { const d = diners('waiting').sort((a, b) => a.task.data.waitT < b.task.data.waitT ? 1 : -1)[0]; return d ? beside(d, { diner: d }) : null; },
    done: (v, task) => {
      const d = task.target.diner;
      if (!d || !d.task || !d.task.data.waiting) return;
      d.task.data.ordered = v.id;
      const food = d.task.a.id === 'ale' ? 'ale' : FOODS[d.task.data.order] ? FOODS[d.task.data.order].label : 'stew';
      if (R.chance(0.6)) { v.say(R.pick(['What\'ll it be?', 'Evening! What can I get you?', 'The usual?']), 2.4, { to: d }); d.say(R.pick([`The ${food}, please.`, `${food.charAt(0).toUpperCase() + food.slice(1)}, and don't be long about it.`, `Just the ${food}, thanks.`]), 2.6, { to: v }); }
      d.task.data.orderedAt = d.task.data.waitT;
      const orders = (v._orders || (v._orders = [])); orders.push(d);
      // any other table still waiting is seen to first, then one trip to the kitchen and a plate for each
      if (orders.length < 4 && diners('waiting').some((o) => !orders.includes(o))) { v.queue.unshift({ a: ACTIONS.innkeeper_serve, extra: { round: true } }); return; }
      v.queue.unshift({ a: ACTIONS.innkeeper_fetch, extra: { round: true, diner: orders[0] } }, ...orders.map((o) => ({ a: ACTIONS.innkeeper_bring, extra: { round: true, diner: o } })));
      v._orders = [];
    } });
  subTask(I, 'fetch', { label: 'Fetching an order from the kitchen', dur: 3, inside: true, pose: 'inside', need: () => 0, target: () => ({ building: inn() }), start: (v, task, extra) => { task.data.diner = extra && extra.diner; return !!task.data.diner; } });
  subTask(I, 'bring', { label: 'Bringing the order', dur: 2, pose: 'stand', need: () => 0, label2: (v) => (v.task && v.task.data.diner && v.task.data.diner.task && v.task.data.diner.task.a.id === 'ale' ? 'Bringing a pint' : 'Bringing a plate'),
    start: (v, task, extra) => { task.data.diner = extra && extra.diner; task.target.prop = task.data.diner && task.data.diner.task && task.data.diner.task.a.id === 'ale' ? 'mug' : 'plate'; return !!task.data.diner; },
    target: (v, h, extra) => { const d = extra && extra.diner; return d && d.task && d.task.data.waiting ? beside(d, { diner: d }) : null; },
    done: (v, task) => { const d = task.data.diner; if (d && d.task && d.task.data.waiting) serveDiner(d, v); } });
  subTask(I, 'clear', { label: 'Clearing the tables', dur: 4, pose: 'stand', prop: 'mug', need: () => Math.min(3, litter().length * 0.8), target: (v) => { const it = nearestLitter(v); return it ? { x: it.x, y: it.y + 8, facing: 'up', litter: it } : null; }, done: (v, task) => { World.items = World.items.filter((it) => it !== task.target.litter); } });
  subTask(I, 'wash', { label: 'Washing up', dur: 8, inside: true, pose: 'inside', need: (v, h) => (h >= 14 ? 0.8 : 0.2), target: () => ({ building: inn() }) });
  subTask(I, 'keg', { label: 'Tapping a new keg', dur: 5, inside: true, pose: 'inside', need: () => ((Village.innServed || 0) >= 4 && Village.stores.ale > 0 ? 1.5 : 0), target: () => ({ building: inn() }), done: () => { Village.innServed = 0; } });
  subTask(I, 'regulars', { label: 'A word with the regulars', dur: 6, pose: 'stand', prop: 'mug', sat: { lonely: -0.2 }, need: () => (diners('any').length ? 0.8 : 0.2), target: () => { const s = R.pick(inn().serveSpots); return { x: s.x, y: s.y, facing: R.pick(['left', 'right', 'down']) }; }, say: ['Lovely day for it.', 'Heard the news?', 'Another? Go on.'] });
}
{
  // the woodwright: fell, lop, carry, saw, stack, sharpen, and build
  const W = 'work_wood';
  step(W, ACTIONS.work_wood, 28, () => (World.woodSpots.some((s) => s.stock > 0 && !s.claimed) ? 2 : 0), { label: 'Felling' });
  { const d = ACTIONS.work_wood.done; ACTIONS.work_wood.done = function (v, task) { v._lastWood = task.target.wood; return d.call(this, v, task); }; }
  subTask(W, 'lop', { label: 'Lopping the branches', dur: 10, prop: 'axe', need: (v) => (v._lastWood ? 1.5 : 0), target: (v) => { const s = v._lastWood; return s ? { x: s.x, y: s.y, facing: s.facing } : null; }, say: ['Mind your heads!', 'Timber!'] });
  subTask(W, 'saw', { label: 'Sawing planks', dur: 14, prop: 'axe', need: () => (Village.stores.wood > 4 ? 1 : 0.2), target: doorstep('workshop', 'up') });
  subTask(W, 'stack', { label: 'Stacking the woodpile', dur: 8, prop: 'sack', need: () => 0.8, target: doorstep('workshop', 'left') });
  subTask(W, 'sharpen', { label: 'Sharpening the axe', dur: 6, pose: 'sit', prop: 'whittle', sat: { bored: -0.1 }, need: () => 0, target: doorstep('workshop', 'down'), say: ['Keen as a razor.'] });
  step(W, ACTIONS.build, 40, (v) => (Village.projects.some((p) => canWorkProject(v, p)) ? 3 : 0), { label: 'Building' });
}
{
  // the baker: knead, bake, cool, carry bread to the Store, sweep
  const B = 'work_bake';
  haulStep(B, 'flour', 'flour', 'mill', 'bakery', 'Fetching flour from the mill', () => (World.buildings.mill && Village.stores.flour >= 2 ? 0.5 : 0), 10);
  subTask(B, 'knead', { label: 'Kneading the dough', dur: 12, inside: true, pose: 'inside', need: () => (Village.stores.flour >= 1 ? 1.5 : 0), target: inside('bakery') });
  step(B, ACTIONS.work_bake, 24, () => (Village.stores.flour >= 1 ? 2 : 0), { label: 'Baking' });
  subTask(B, 'cool', { label: 'Setting the loaves to cool', dur: 6, pose: 'stand', prop: 'plate', need: () => (Village.stores.bread > 0 ? 1 : 0), target: doorstep('bakery', 'down'), say: ['Smell that.', 'Crust like a drum.'] });
  haulStep(B, 'tostore', 'bread', 'bakery', 'store', 'Carrying bread to the Store', () => (Village.stores.bread > 6 ? 1 : 0), 6);
  subTask(B, 'sweep', { label: 'Sweeping out the Bakehouse', dur: 7, prop: 'broom', need: (v, h) => (h >= 12 ? 0.6 : 0.2), target: doorstep('bakery', 'down') });
}
{
  // the brewer: haul barley, malt, mash, stir the vats, tap, roll a barrel to the inn
  const R0 = 'work_brew';
  haulStep(R0, 'barley', 'grain', 'barn', 'brewhouse', 'Fetching barley from the barn', () => (Village.stores.grain >= 4 ? 0.8 : 0), 10);
  subTask(R0, 'malt', { label: 'Malting the barley', dur: 12, inside: true, pose: 'inside', need: () => (Village.stores.grain >= 2 ? 1 : 0), target: inside('brewhouse') });
  subTask(R0, 'mash', { label: 'Mashing', dur: 12, inside: true, pose: 'inside', need: () => (Village.stores.grain >= 2 ? 1 : 0), target: inside('brewhouse') });
  step(R0, ACTIONS.work_brew, 22, () => (Village.stores.grain >= 2 && Village.stores.ale < 70 ? 2 : 0), { label: 'Stirring the vats' });
  subTask(R0, 'tap', { label: 'Tapping the cask', dur: 5, inside: true, pose: 'inside', need: () => (Village.stores.ale >= 10 ? 0.8 : 0), target: inside('brewhouse') });
  haulStep(R0, 'barrel', 'ale', 'brewhouse', 'inn', 'Rolling a barrel to the inn', () => (Village.stores.ale >= 12 ? 1 : 0), 8);
}
{
  // the miller: haul sacks, grind, bag the flour, carry flour to the bakery
  const M = 'work_mill';
  haulStep(M, 'sacks', 'grain', 'barn', 'mill', 'Fetching sacks of barley from the barn', () => (Village.stores.grain >= 4 && World.buildings.mill ? 0.8 : 0), 12);
  step(M, ACTIONS.work_mill, 24, () => (Village.stores.grain >= 2 && Village.stores.flour < 50 ? 2 : 0), { label: 'Grinding' });
  subTask(M, 'bag', { label: 'Bagging the flour', dur: 9, inside: true, pose: 'inside', need: () => (Village.stores.flour >= 2 ? 1 : 0), target: (v) => ({ building: ['mill', 'mill2', 'windmill'].map((k) => World.buildings[k]).filter(Boolean).sort((a, b) => dist(a.stepX, a.stepY, v.x, v.y) - dist(b.stepX, b.stepY, v.x, v.y))[0] }) });
  haulStep(M, 'tobakery', 'flour', 'mill', 'bakery', 'Carrying flour to the Bakehouse', () => (Village.stores.flour >= 4 ? 0.6 : 0), 10);
}
{
  // the herbalist: gather, dry, grind and brew, tend the beds
  const Hb = 'work_herb';
  step(Hb, ACTIONS.work_herb, 24, () => (World.season !== 'winter' || Village.stores.herbs >= 2 ? 2 : 0), { label: 'Gathering and brewing' });
  subTask(Hb, 'dry', { label: 'Hanging herbs to dry', dur: 10, inside: true, pose: 'inside', need: () => (Village.stores.herbs >= 1 ? 1 : 0.2), target: inside('herbalist') });
  subTask(Hb, 'grind', { label: 'Grinding herbs', dur: 10, inside: true, pose: 'inside', need: () => (Village.stores.herbs >= 2 ? 1 : 0), target: inside('herbalist') });
  subTask(Hb, 'beds', { label: 'Tending the herb beds', dur: 12, prop: 'hoe', need: () => (World.season !== 'winter' && World.herbBeds.length ? 1 : 0), target: (v) => plotOf(v, World.herbBeds, (p) => p.stage < 4), tick: (v, task, dt) => { for (const q of World.herbBeds) if (q.stage >= 1 && q.stage < 4) q.prog += dt / 300; } });
}
{
  // the mail carrier: sort the letters, deliver, collect from the board
  const P = 'work_mail';
  // the round is walked whether or not there's mail: boxes checked, the board cleared
  { const av = ACTIONS.work_mail.avail; ACTIONS.work_mail.avail = (v, h) => (av && av(v, h)) || World.homes.some((hm) => hm.built && hm.mailbox); }
  subTask(P, 'sort', { label: 'Sorting the mail', dur: 8, inside: true, pose: 'inside', need: (v, h) => (h < 11 ? 1.5 : 0.3), target: inside('store') });
  step(P, ACTIONS.work_mail, 6, () => (typeof mailbag === 'function' && mailbag().length ? 3 : 0), { label: 'Delivering', repeat: 3 });
  subTask(P, 'round', { label: 'Walking the round', dur: 4, pose: 'stand', prop: 'letter', need: () => 1.2, repeat: 3, sat: { lonely: -0.1 },
    target: (v) => { const homes = World.homes.filter((h) => h.built && h.mailbox && h.id !== v._lastBox); const h = homes.length ? homes.sort((a, b) => dist(a.mailbox.x, a.mailbox.y, v.x, v.y) - dist(b.mailbox.x, b.mailbox.y, v.x, v.y))[Math.floor(Math.random() * Math.min(3, homes.length))] : null; if (!h) return null; v._lastBox = h.id; return { x: h.mailbox.x + 6, y: h.mailbox.y + 2, facing: 'left' }; }, say: ['Nothing today.', 'Morning!', 'Box is empty.'] });
  subTask(P, 'collect', { label: 'Collecting letters from the board', dur: 5, pose: 'stand', prop: 'letter', need: () => 1, target: () => (World.postSpot ? { x: World.postSpot.x, y: World.postSpot.y, facing: 'up' } : null) });
}
{
  // the fisher: bait, cast, gut, carry to the Store
  const Fs = 'work_fish';
  subTask(Fs, 'bait', { label: 'Baiting the hook', dur: 4, pose: 'sit', need: () => 1, target: (v) => freeSpot(v, World.fishing) });
  step(Fs, ACTIONS.work_fish, 35, () => 2, { label: 'Fishing' });
  subTask(Fs, 'gut', { label: 'Gutting the catch', dur: 6, pose: 'sit', prop: 'basket', need: (v) => (v.lastJob === 'work_fish' ? 1 : 0.2), target: (v) => freeSpot(v, World.fishing) });
}
{
  // the leaf-grower: hoe the rows, pick, hang the leaf to dry
  const G = 'work_leaf';
  subTask(G, 'hoe', { label: 'Hoeing the leaf rows', dur: 12, prop: 'hoe', need: () => (World.season !== 'winter' ? 1 : 0), target: (v) => plotOf(v, World.weed, (w) => w.stage < 4), release: unclaim });
  step(G, ACTIONS.work_leaf, 26, () => (World.season !== 'winter' ? 2 : 0), { label: 'Picking' });
  subTask(G, 'hang', { label: 'Hanging leaf to dry', dur: 9, inside: true, pose: 'inside', need: () => (Village.stores.leaf >= 2 ? 1 : 0.2), target: inside('barn') });
}
{
  // the orchard-keeper: prune, pick, see to the hives
  const O = 'work_orchard';
  subTask(O, 'prune', { label: 'Pruning the apple trees', dur: 10, prop: 'axe', need: () => (World.orchard.length ? 1 : 0), target: (v) => { const t = nearestOf(v, World.orchard, (x) => true); return t ? { x: t.x, y: t.y, facing: 'up' } : null; } });
  step(O, ACTIONS.work_orchard, 26, () => (World.orchard.some((t) => t.apples >= 2 && !t.claimed) || World.hives.some((h) => h.honey >= 2 && !h.claimed) ? 2 : 0.3), { label: 'Picking and the hives' });
  subTask(O, 'hives', { label: 'Seeing to the hives', dur: 8, pose: 'stand', need: () => (World.hives.length ? 0.8 : 0), target: (v) => { const h = R.pick(World.hives); return h ? { x: h.x, y: h.y, facing: 'up' } : null; }, say: ['Busy, busy.', 'Mind the bees.'] });
}

// --- planning a round -----------------------------------------------------
// Three to five jobs, drawn by how much each is wanted, no two the same, the
// one done last time left till later, a rest on the end for the outdoor trades.
function planRound(v, main, h) {
  const defs = ROUNDS[main];
  if (!defs) return [];
  const pool = defs.map((d) => [d, d.need ? d.need(v, h) : 1]).filter(([d, w]) => w > 0 && !(d.a.avail && !d.a.avail(v, h)));
  const out = [];
  const n = 4 + Math.floor(Math.random() * 3);
  while (out.length < n && pool.length) {
    let total = 0; for (const [d, w] of pool) total += w * (d.id === v._lastSub ? 0.3 : 1);
    let r = Math.random() * total, pick = pool[0];
    for (const p of pool) { r -= p[1] * (p[0].id === v._lastSub ? 0.3 : 1); if (r <= 0) { pick = p; break; } }
    pool.splice(pool.indexOf(pick), 1);
    out.push(pick[0]);
    if (pick[0].repeat) for (let k = 1; k < pick[0].repeat; k++) out.push(pick[0]);
  }
  // water follows the well, lopping follows felling, bagging follows grinding
  out.sort((a, b) => (ORDER[a.id] || 5) - (ORDER[b.id] || 5));
  const rest = defs.find((d) => d.id.endsWith('_rest'));
  if (rest && out.length >= 3) out.push(rest);
  return out;
}
const ORDER = { farmer_fetchwater: 1, farmer_water: 2, herder_fetchwater: 1, herder_water: 2, herder_feed: 0, innkeeper_fire: 0, innkeeper_serve: 0, work_wood: 1, woodwright_lop: 2, woodwright_stack: 3, baker_flour: 0, baker_knead: 1, work_bake: 2, baker_cool: 3, baker_tostore: 4, brewer_barley: 0, brewer_malt: 1, brewer_mash: 2, work_brew: 3, brewer_tap: 4, brewer_barrel: 5, miller_sacks: 0, work_mill: 1, miller_bag: 2, miller_tobakery: 3, fisher_bait: 0, work_fish: 1, fisher_gut: 2, mailcarrier_sort: 0, work_mail: 1, mailcarrier_collect: 2, grower_hoe: 0, work_leaf: 1, grower_hang: 2 };

// How urgently the trade calls right now: 1 on shift, less at the edges, 0 off.
function onShift(v, h) {
  const main = MAIN_WORK[v.job];
  if (!main || !ACTIONS[main].time || !v.isGrown()) return 0;
  if (typeof isRestDay === 'function' && isRestDay(Game.day) && !NEVER_REST.has(main)) return 0;
  return ACTIONS[main].time(h, v);
}

// --- the inn: diners and service -------------------------------------------
const DINER_ACTS = new Set(['eat_inn', 'ale']);
// diners at the inn: all of them, or those still waiting for someone to take their order
const diners = (what) => Game.villagers.filter((d) => d.task && DINER_ACTS.has(d.task.a.id) && d.task.phase === 'do' && (what === 'any' || (d.task.data.waiting && typeof d.task.data.ordered !== 'number')));
// a place to stand beside a diner: the nearest walkable tile round their seat
const beside = (d, more) => {
  if (d.inside) return { building: d.inside, ...more };
  const tx = Math.floor(d.x / 16), ty = Math.floor((d.y - 2) / 16);
  const order = d.facing === 'left' ? [[-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1], [0, -1]] : d.facing === 'right' ? [[1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1], [0, -1]] : [[0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1], [0, -1]];
  for (const [dx, dy] of order) if (walkable(tx + dx, ty + dy)) return { x: (tx + dx) * 16 + 8, y: (ty + dy) * 16 + 12, faceTo: d, ...more };
  return null;
};
const SERVING = new Set(['innkeeper_serve', 'innkeeper_fetch', 'innkeeper_bring']);
const INN_WORK = new Set(['work_inn', 'innkeeper_fire', 'innkeeper_sweep', 'innkeeper_serve', 'innkeeper_fetch', 'innkeeper_bring', 'innkeeper_clear', 'innkeeper_wash', 'innkeeper_keg', 'innkeeper_regulars']);
// an innkeeper awake and on shift, whether or not they've a job in hand just now
function serversOn(h = Game.hour) { return Game.villagers.filter((v) => v.job === 'innkeeper' && !v.leaving && (!v.task || v.task.a.id !== 'sleep') && ACTIONS.work_inn.time(h, v) >= 0.7); }
function serveDiner(d, keeper) {
  const t = d.task;
  if (!t || !t.data.waiting) return;
  const kind = t.data.order;
  const gone = () => { d.say(R.pick(['Out of it? Well, I never.', 'Nothing left? Hmph.'])); t.data.waiting = false; t.data.left = true; t.t = 0; };
  if (t.a.id === 'ale') { if (Village.stores.ale < 1) return gone(); Village.use('ale', 1); t.sat = { thirst: -0.65, bored: -0.45, lonely: -0.4, cold: -0.2 }; }
  else { if (!(Village.stores[kind] > 0)) return gone(); Village.use(kind, 1); t.sat = foodSat(d, kind, { thirst: -0.3, lonely: -0.45, bored: -0.25, cold: -0.3 }); }
  t.data.waiting = false; t.data.served = keeper ? keeper.id : true;
  Village.innServed = (Village.innServed || 0) + 1;
  if (keeper && R.chance(0.5)) d.say(R.pick(['Ta very much.', 'Lovely.', 'That\'s the stuff.', 'Cheers!']), 2.2, { to: keeper });
}
// a diner's helping is only taken from the Store when it's served, and the
// waiting is held against nobody but an empty taproom
function waitForService(a) {
  const start = a.start, tick = a.tick, done = a.done;
  a.start = function (v, task) {
    const h = Game.hour;
    if (a.id === 'ale') { if (Village.stores.ale < 1) return false; task.data.order = 'ale'; }
    else { const k = pickFood(v, Village.stores, ['stew', 'pie', 'fish', 'bread', 'cake', 'veg']); if (!k) return false; task.data.order = k; }
    if (!serversOn(h).filter((o) => o !== v).length) { const ok = start.call(this, v, task); if (ok && R.chance(0.3)) v.say(R.pick(['Help yourself, I suppose.', 'Nobody about. Typical.'])); return ok; }
    task.data.waiting = true; task.data.waitT = 0; task.sat = {};
    return true;
  };
  a.tick = function (v, task, dt, h) {
    if (task.data.waiting) {
      task.t += dt; task.data.waitT += dt;
      // a keeper busy with something that can wait is called over; a call that came to nothing is made again
      if (task.data.ordered === 'called' && task.data.waitT - (task.data.calledAt || 0) > 10) task.data.ordered = null;
      if (!task.data.ordered && task.data.waitT > 2) {
        const ks = serversOn(h).filter((o) => o !== v);
        const k = ks.find((o) => !o.queue.some((q) => q.a.id === 'innkeeper_serve') && (!o.task || (o.task.round === 'work_inn' && !SERVING.has(o.task.a.id)) || (!o.task.a.job && !o.task.a.meal && o.task.a.id !== 'sleep' && !o.task.a.queued && !o.task.partner)));
        if (k) {
          if (k.task && k.task.round !== 'work_inn') k.abort(); else if (k.task) k.task.t = Math.min(k.task.t, 0.5);
          k.queue.unshift({ a: ACTIONS.innkeeper_serve, extra: { round: true } }); k.thinkDelay = 0;
          task.data.ordered = 'called'; task.data.calledAt = task.data.waitT;
        } else if (task.data.waitT > 4 && !ks.length) task.data.ordered = 'nobody';
      }
      // an order taken but never brought is called for again
      if (typeof task.data.ordered === 'number' && task.data.waitT - (task.data.orderedAt || 0) > 30) task.data.ordered = null;
      const patience = typeof task.data.ordered === 'number' ? 90 : serversOn(h).some((o) => o !== v) ? 60 : 18;
      if (task.data.waitT > patience) {
        // enough: help yourself, or leave in a huff
        if (R.chance(0.5)) { v.say(R.pick(['I\'ll get it myself, then.', 'Service!', 'Is anyone keeping this inn?'])); serveDiner(v, null); }
        else { v.say(R.pick(['I\'ve waited long enough.', 'Hmph. I\'ll eat at home.'])); v.drives.bored = Math.min(1, v.drives.bored + 0.1); v.remember('Sat at the inn and nobody came to serve.', -1); task.t = 0; task.data.waiting = false; task.data.left = true; }
      }
      return;
    }
    if (tick) tick.call(this, v, task, dt, h);
  };
  a.done = function (v, task) {
    if (task.data.left || task.data.waiting) return;
    if (done) done.call(this, v, task);
    // the empty mug or plate left on the table for the innkeeper to clear
    if (task.spot && task.spot.kind === 'inn' && litter().length < 14) World.items.push({ kind: a.id === 'ale' ? 'mug' : 'plate', x: task.spot.x + (task.spot.facing === 'left' ? -9 : task.spot.facing === 'right' ? 9 : 0), y: task.spot.y - (task.spot.facing === 'down' ? 7 : task.spot.facing === 'up' ? -7 : 2), uses: 0, claims: 0 });
  };
}
waitForService(ACTIONS.eat_inn);
waitForService(ACTIONS.ale);
Village.innkeeperOn = function () { return Game.villagers.some((v) => v.task && INN_WORK.has(v.task.a.id) && v.task.phase === 'do'); };

// --- hooking it all in ------------------------------------------------------
{
  // a stint at a trade is a round of its jobs, begun one after the other
  patch(Villager.prototype, 'begin', (begin) => function (a, h, extra) {
    // (with a mind of Tyrell's, the round is a Mentat plan: shell.js)
    if (ROUNDS[a.id] && !(extra && extra.round) && minded(this) && !(Shell.picking && Shell.picking.v === this)) return Shell.round(this, a.id, h);
    if (ROUNDS[a.id] && !(extra && extra.round) && this.isGrown() && !this._arms) {
      const round = planRound(this, a.id, h);
      if (round.length) {
        const items = round.map((d) => ({ a: d.a, extra: { round: true, dur: d.dur, main: a.id } }));
        // the first job that can be started begins the round; the rest wait their turn
        for (let k = 0; k < items.length; k++) {
          if (!begin.call(this, items[k].a, h, items[k].extra)) continue;
          this.task.round = a.id; this.task.began = Game.time;
          this.queue.unshift(...items.slice(k + 1));
          return true;
        }
      }
    }
    const ok = begin.call(this, a, h, extra);
    if (ok && this.task) this.task.began = Game.time;
    if (ok && extra && extra.round && this.task) { this.task.round = extra.main || this.task.round || MAIN_WORK[this.job]; if (extra.dur) this.task.t = extra.dur * R.f(0.85, 1.15); }
    return ok;
  }, 'work');
  // during their hours the trade pulls, and the rest has to wait unless a need presses
  patch(Villager.prototype, 'score', (score) => function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s <= 0 || !this.job) return s;
    const shift = onShift(this, h);
    if (shift < 0.6) return s;
    const mul = (name, f) => { s *= f; if (ex) ex.mul.push([name, f]); };
    if (a.job === this.job || (a.jobs && a.jobs.includes(this.job))) mul('working hours', 2.4);
    else if (this.job === 'innkeeper' && a.id === 'eat_home') mul('eats at the inn', 0.25);
    else if (this.job === 'innkeeper' && a.id === 'eat_inn') mul('eats at the inn', 2);
    else if (!(a.meal || SHIFT_OK.has(a.id))) {
      const pressing = this.drives.hunger > 0.6 || this.drives.thirst > 0.65 || this.drives.tired > 0.75;
      mul('working hours', pressing ? 0.8 : a.id === 'chat' ? 0.55 : 0.35);
    }
    return s;
  }, 'work');
  // what's made in a stint is scaled, so a full working day gives about what the old odd hours did
  const produce = Village.produce;
  Village.produce = function (res, n, priv) { return produce.call(this, res, Village._yield ? Math.max(1, Math.round(n * Village._yield)) : n, priv); };
  for (const id of Object.keys(YIELD)) {
    const a = ACTIONS[id]; if (!a || !a.done) continue;
    const done = a.done;
    a.done = function (v, task) { Village._yield = YIELD[id]; try { return done.call(this, v, task); } finally { Village._yield = 0; } };
  }
  // carrying goods is done straight away, not after the rest of the round
  // what a round gathers is carried in one load when the round is over (or the sack is full), not a trip for every sheaf
  const flushStash = (v) => { const st = v._stash; if (!st) return; v._stash = null; for (const res in st) if (st[res] > 0) v.queue.unshift({ a: ACTIONS.deliver, extra: { res, amt: st[res], dest: dropOffFor(v, res) } }); };
  queueDelivery = function (v, res, amt, label) {
    if (amt <= 0) return;
    if (v.task && v.task.round && !label) {
      const st = v._stash || (v._stash = {}); st[res] = (st[res] || 0) + amt;
      let total = 0; for (const k in st) total += st[k];
      if (total >= 12) flushStash(v);
      return;
    }
    v.queue.unshift({ a: ACTIONS.deliver, extra: { res, amt, dest: dropOffFor(v, res), label } });
  };
  const dd = ACTIONS.deliver.done;
  ACTIONS.deliver.done = function (v, task) { const c = task.data.cargo; if (c && c.move) return; return dd.call(this, v, task); };
  // when the working day starts, whatever leisure is in hand is put down (after a decent interval) and the trade taken up
  patch(Villager.prototype, 'update', (update) => function (dt, h) {
    if (this.job && this.task && !this.carried && !this.leaving) {
      this._shiftT = (this._shiftT ?? 0) - dt;
      if (this._shiftT <= 0) {
        this._shiftT = 5;
        const t = this.task, a = t.a;
        const leisure = !a.job && !a.queued && !a.meal && !SHIFT_OK.has(a.id) && !t.partner && a.id !== 'chat';
        if (leisure && onShift(this, h) >= 0.6 && (t.before ? true : false) && (this._arms == null || !this._arms) && Game.time - (t.began || 0) > 15) {
          const main = ACTIONS[MAIN_WORK[this.job]];
          if (main && (!main.avail || main.avail(this, h)) && this.score(main, h) > 0.05) { devLog && devLog('jobs', `${this.first} puts down ${a.id} to get to work`); this.abort(); this.queue.unshift({ a: main }); this.thinkDelay = 0; }
        }
      }
    }
    return update.call(this, dt, h);
  }, 'work');
  patch(Villager.prototype, 'walk', (walk) => function (dt, boost = 1) { return walk.call(this, dt, this.task && SERVING.has(this.task.a.id) ? boost * 1.6 : boost); }, 'work');
  patch(Villager.prototype, 'finish', (finish) => function () {
    const t = this.task;
    if (t && t.round) { this._lastSub = t.a.id; if (t.a.say && R.chance(0.25)) this.say(R.pick(t.a.say), 2.2); this.lastJobAt = Game.time; this.lastJob = t.round; }
    const r = finish.call(this);
    // the round is over: carry what it gathered
    if (t && t.round && !(minded(this) ? Shell.inRound(this) : this.queue.some((q) => q.extra && q.extra.round))) flushStash(this);
    return r;
  }, 'work');
  // the Steward wants a second pair of hands at the inn once the village is big
  const jt = jobTargets;
  jobTargets = function () { const t = jt(); const adults = Game.villagers.filter((v) => v.isGrown() && !v.leaving).length; if (adults >= 18 && !(Game.jobPlan && typeof Game.jobPlan.innkeeper === 'number')) t.innkeeper = 2; return t; };
  // the empty mugs and plates on the tables
  Object.assign(BUILDING_SPOTS, { innkeeper_fire: 'oven', innkeeper_cook: 'oven', innkeeper_fetch: 'bar', innkeeper_wash: 'bar', innkeeper_keg: 'bar', baker_knead: 'kneading', baker_flour: 'counter', baker_tostore: 'counter', brewer_malt: 'copper', brewer_mash: 'copper', brewer_tap: 'copper', brewer_barley: 'counter', brewer_barrel: 'counter', miller_bag: 'mill', miller_sacks: 'counter', miller_tobakery: 'counter', herbalist_dry: 'herbs', herbalist_grind: 'herbs', mailcarrier_sort: 'counter', grower_hang: 'counter' });
  const bws = buildWorldSprites;
  buildWorldSprites = function () {
    bws();
    SPR.items.mug = finishSprite(['.cccc.', 'cbbbcc', 'cbbbcc', 'cbbbc.', '.ccc..'], { c: '#9a7a4a', b: '#c9a46a' });
    SPR.items.plate = finishSprite(['.pppppp.', 'ppddddpp', 'ppddddpp', '.pppppp.'], { p: '#e8e2d4', d: '#c8945a' });
  };
}
