'use strict';
// ---------------------------------------------------------------------------
// Farewells and remembering. Nobody in Thistledown dies: the old, when their
// time comes, pack a walking stick and set off on a last great adventure over
// the hills. But a going is still a going.
//
// An elder who makes up their mind in the night sets off mid-morning, not in
// the dark: family and friends gather at the door at nine to see them off,
// the elder hands a keepsake down to a child or grandchild, and at ten they
// walk off down the lane while everyone waves. Those left behind miss them for
// a couple of days. A carved stone goes up for them on the Remembrance Green,
// and the folk who loved them go and sit by it now and then, sometimes leaving
// flowers.
// ---------------------------------------------------------------------------

const KEEPSAKES = ['pocket-watch', 'walking stick', 'brass-bound pipe', 'recipe book', 'silver thimble', 'compass', 'favorite teapot', 'embroidered waistcoat', 'map of the Shire', 'carved chess set', 'button tin', 'old fiddle', 'gardening trowel', 'spectacles case'];
MOODLETS.remembered = ['Sat a while by {x}\'s stone', 0.06, 480, ['{x} would have liked today.', 'I told {x} all the news.']];
MOODLETS.keepsake = ['Given {x}\'s keepsake', 0.1, 1440, ['I\'ll keep it safe, I promise.']];

// --- The Remembrance Green -----------------------------------------------
function makeMemorialStone(seed) {
  const rng = mulberry32(seed);
  const w = 9 + Math.floor(rng() * 3), h = 11 + Math.floor(rng() * 3);
  const [c, x] = makeCanvas(w + 2, h + 2);
  const stone = ['#9a968e', '#a8a29a', '#8e8a84'][Math.floor(rng() * 3)];
  x.fillStyle = stone; x.fillRect(1, 3, w, h - 2); x.fillRect(2, 2, w - 2, 1); x.fillRect(3, 1, w - 4, 1);
  x.fillStyle = shade(stone, 0.18); x.fillRect(2, 3, 1, h - 3); x.fillRect(3, 2, 2, 1);
  x.fillStyle = shade(stone, -0.22); x.fillRect(w, 4, 1, h - 3);
  // carved lines for the name, and a little leaf
  x.fillStyle = shade(stone, -0.35); x.fillRect(3, 5, w - 4, 1); x.fillRect(4, 7, w - 6, 1); x.fillRect(3, 9, w - 4, 1);
  x.fillStyle = '#5a8a3a'; x.fillRect(Math.floor(w / 2), h - 2, 2, 1);
  // a little moss
  x.fillStyle = '#6a8a4a'; for (let i = 0; i < 3; i++) x.fillRect(1 + Math.floor(rng() * w), h - 1 - Math.floor(rng() * 2), 1, 1);
  return outlineCanvas(c, OUTLINE);
}
function makeYew() { return makeTree(4242, 'fir'); }

// Laid out with the village: a quiet patch of grass with a bench and a yew,
// a path to it, and room for stones in rows.
function planMemorialGreen() {
  World.memorial = null;
  const r = surveyRect(8, 5, ...anchorOf('memorial', [34, 22]), 22);
  if (!r) return;
  reserveRect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1); reserveTiles(r.spur);
  for (const [x, y] of r.spur) if (World.tiles[tIdx(x, y)] === T.GRASS) World.tiles[tIdx(x, y)] = T.PATH;
  for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) if (World.tiles[tIdx(x, y)] === T.GRASS) World.tiles[tIdx(x, y)] = T.LAWN;
  const add = World._addStatic, blk = World._blk;
  add(makeYew(), (r.x0 + 0.5) * 16, (r.y0 + 1) * 16 - 2, { gen: { type: 'tree', seed: 4242, kind: 'fir' } }); blk(r.x0, r.y0);
  add(makeBench(), (r.x1 - 0.5) * 16, r.y1 * 16 + 12, { sortBias: -1 }); blk(r.x1 - 1, r.y1); blk(r.x1, r.y1);
  World.memorialBench = makeSpot((r.x1 - 0.5) * 16, r.y1 * 16 + 12, 'up', 'sit', 'bench');
  // stone plots: two rows across the middle
  const slots = [];
  for (const y of [r.y0 + 1, r.y0 + 3]) for (let x = r.x0 + 2; x <= r.x1 - 1; x++) slots.push([x, y]);
  World.memorial = { x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, gx: r.gx, slots };
  World.memorialStatics = [];
}

function stoneSpot(m) {
  const M = World.memorial;
  const [tx, ty] = M.slots[m.slot % M.slots.length];
  return { x: tx * 16 + 8, y: ty * 16 + 13, tx, ty };
}
function placeStone(m) {
  if (!World.memorial || !World._addStatic) return;
  const s = stoneSpot(m);
  const st = World._addStatic(makeMemorialStone(m.id * 31 + 7), s.x, s.y, { snow: true });
  st.memorial = m;
  World._blk(s.tx, s.ty);
  World.memorialStatics.push(st);
}
// After loading: the stones that were raised.
function placeMemorialStones() {
  if (!World.memorial) return;
  for (const m of Game.memorials || []) placeStone(m);
}
function raiseStone(a) {
  if (!World.memorial) return;
  Game.memorials = Game.memorials || [];
  if (Game.memorials.some((m) => m.id === a.id)) return;
  const m = { id: a.id, name: `${a.first} ${a.surname}`, first: a.first, day: Game.day, slot: Game.memorials.length };
  Game.memorials.push(m);
  placeStone(m);
}
function memorialFor(id) { return (Game.memorials || []).find((m) => m.id === id); }

// --- Missing someone, and visiting their stone --------------------------
function missedBy(v, a) {
  // family and dear friends
  return v.parents.includes(a.id) || a.parents.includes(v.id) || v.spouse === a.id || (v.parents.length && v.parents.some((p) => a.parents.includes(p))) || (v.rel[a.id] ?? 0) > 0.55;
}
function lovedStones(v) {
  return (Game.memorials || []).filter((m) => { const a = Game.archive[m.id]; return a && (v.parents.includes(m.id) || a.parents.includes(v.id) || v.spouse === m.id || (v.rel[m.id] ?? 0) > 0.5); });
}

ACTIONS.visit_stone = {
  id: 'visit_stone', label: 'Sitting by a memorial stone', icon: 'heart', sat: { lonely: -0.2, bored: -0.15 }, dur: 25, pose: 'stand', outdoor: true, stages: AWAKE,
  label2: (v) => (v.task && v.task.target.m ? `Sitting a while by ${v.task.target.m.first}'s stone` : 'Sitting by a memorial stone'),
  avail: (v) => !!World.memorial && lovedStones(v).length > 0,
  extra: (v) => (v.moodlets || []).some((m) => m.k === 'missed') ? 0.35 : 0.04,
  time: (h) => (h >= 9 && h < 18 ? 1 : 0.02),
  target: (v) => {
    const m = R.pick(lovedStones(v));
    if (!m) return null;
    const s = stoneSpot(m);
    return { x: s.x + R.i(-4, 4), y: s.y + 13, facing: 'up', m };
  },
  done: (v, task) => {
    const m = task.target.m;
    feel(v, 'remembered', m.first);
    if (v.moodlets) v.moodlets = v.moodlets.filter((x) => !(x.k === 'missed' && x.x === m.first) || R.chance(0.5));
    // flowers left at the stone now and then, in season
    if (World.season !== 'winter' && R.chance(0.35)) { const s = stoneSpot(m); World.flowers.push({ x: s.x + R.i(-5, 5), y: s.y + 4, seed: R.i(0, 255), ground: true }); }
    if (R.chance(0.3)) v.remember(`Visited ${m.first}'s stone on the Remembrance Green.`, 0);
  },
};
ACTION_NAMES.visit_stone = 'Visiting the Remembrance Green';
ACTIONS.visit_stone.tick = (v, task, dt) => { if (Math.random() < dt * 0.02) v.say(R.pick([`I miss you, ${task.target.m.first}.`, `The roses are out, ${task.target.m.first}.`, 'Wherever you are, I hope there\'s cake.', `${task.target.m.first} would have laughed at that.`]), undefined, { think: true }); };

// --- Seeing them off ----------------------------------------------------
ACTIONS.see_off = {
  id: 'see_off', label: 'Seeing someone off', icon: 'heart', sat: { lonely: -0.3 }, dur: 90, pose: 'stand', stages: AWAKE, queued: true,
  label2: (v) => (v.task && v.task.target.who ? `Seeing ${v.task.target.who.first} off` : 'Seeing someone off'),
  target: (v, h, extra) => {
    const who = extra && extra.who;
    if (!who || !Game.villagers.includes(who)) return null;
    const home = who.home();
    return { x: home.stepX + R.i(-26, 26), y: home.stepY + R.i(10, 22), facing: 'up', who };
  },
  tick: (v, task) => { const w = task.target.who; if (!Game.villagers.includes(w) || (w.leaving && w.path && dist(w.x, w.y, v.x, v.y) > 140)) task.t = Math.min(task.t, 1); },
};
ACTIONS.farewell_wait = {
  id: 'farewell_wait', label: 'Saying goodbyes on the doorstep', icon: 'pack', sat: { lonely: -0.3 }, dur: 70, pose: 'stand', stages: AWAKE, queued: true,
  target: (v) => (v.homeId >= 0 ? { x: v.home().stepX, y: v.home().stepY + 4, facing: 'down' } : null),
  tick: (v) => { if (Math.random() < 0.02) v.say(R.pick(['Now don\'t fuss, all of you.', 'I\'ll send word if I find anything good.', 'Water my tomatoes, mind.', 'What a send-off!']), 3); },
};
ACTION_NAMES.see_off = 'Seeing folk off'; ACTION_NAMES.farewell_wait = 'Saying goodbye';

// The elder hands something down.
function handDownKeepsake(v) {
  const kin = Game.villagers.filter((o) => o !== v && !o.leaving && o.stage !== 'baby' && (o.parents.includes(v.id) || o.parents.some((p) => { const pp = personById(p); return pp && pp.parents.includes(v.id); })));
  const to = kin.sort((a, b) => (v.rel[b.id] ?? 0) - (v.rel[a.id] ?? 0))[0];
  if (!to) return null;
  const what = `${v.first}'s ${R.pick(KEEPSAKES)}`;
  (to.heirlooms || (to.heirlooms = [])).push({ name: what, from: v.id, day: Game.day });
  to.remember(`${v.first} gave me ${what.replace(v.first + '\'s', v.pron.their)} to keep before setting off.`, 2);
  feel(to, 'keepsake', v.first);
  return { to, what };
}

// Decided in the night: set off at ten, with a send-off at nine.
{
  const sa = startAdventure;
  startAdventure = function (v, kind = 'final', companion = null, now = false) {
    if (kind !== 'final' || now || (Game.hour >= 8.5 && Game.hour < 16)) {
      const r = sa(v, kind, companion);
      if (kind === 'final') afterDeparture(v);
      return r;
    }
    Game.farewells = Game.farewells || [];
    if (!Game.farewells.some((f) => f.id === v.id || f.comp === v.id)) Game.farewells.push({ id: v.id, comp: companion ? companion.id : null, day: Game.day + (Game.hour >= 16 ? 1 : 0) });
    devLog('story', `${v.first} will set off on a last adventure at ten, after a send-off`);
  };
}
function afterDeparture(v) {
  const a = Game.archive[v.id] || v;
  for (const o of Game.villagers) if (o !== v && !o.leaving && o.stage !== 'baby' && missedBy(o, a)) feel(o, 'missed', v.first);
  raiseStone(a);
}
function farewellGathering(f) {
  const v = personById(f.id);
  if (!v || v.leaving) return;
  const comp = f.comp != null ? personById(f.comp) : null;
  const goers = [v, comp].filter(Boolean);
  for (const g of goers) { g.abort(); g.queue = [{ a: ACTIONS.farewell_wait }]; g.thinkDelay = 0; }
  const keeps = goers.map(handDownKeepsake).filter(Boolean);
  const seers = Game.villagers.filter((o) => !goers.includes(o) && !o.leaving && o.stage !== 'baby' && !o.carried && goers.some((g) => missedBy(o, g)) && !needsMinder(o));
  for (const o of seers) { o.abort(); o.queue = [{ a: ACTIONS.see_off, extra: { who: v } }]; o.thinkDelay = 0; }
  chronicle(`${goers.map((g) => g.name()).join(' and ')} ${goers.length > 1 ? 'are' : 'is'} setting off on a last great adventure this morning. ${seers.length ? `${seers.length === 1 ? 'A dear friend has' : `${seers.length} of ${goers.length > 1 ? 'their' : v.pron.their} family and friends have`} gathered at the door of ${v.home().name} to see ${goers.length > 1 ? 'them' : v.pron.them} off.` : ''}${keeps.length ? ` ${keeps.map((k) => `${k.to.first} has been given ${k.what} to keep`).join('; ')}.` : ''}`, 'adventure');
}
function farewellDeparture(f) {
  const v = personById(f.id);
  Game.farewells = Game.farewells.filter((x) => x !== f);
  if (!v || v.leaving) return;
  const comp = f.comp != null ? personById(f.comp) : null;
  for (const o of Game.villagers) {
    if (o.task && o.task.a.id === 'see_off' && o.task.target.who === v) {
      o.say(R.pick(['Safe travels!', 'Goodbye! Goodbye!', 'Send us a letter!', 'We\'ll miss you!', 'Don\'t forget your hanky!']), 3);
      FX.hearts(o.x, o.y - 18); o.task.t = Math.min(o.task.t, R.f(6, 14));
    }
  }
  startAdventure(v, 'final', comp && !comp.leaving ? comp : null, true);
  if (comp && !comp.leaving) startAdventure(comp, 'final', v, true);
}

window.addEventListener('DOMContentLoaded', () => {
  addHook('onHour', (h) => {
    for (const f of (Game.farewells || []).slice()) {
      if (f.day > Game.day) continue;
      if (h === 9) farewellGathering(f);
      else if (h >= 10) farewellDeparture(f);
    }
  });
  addHook('newVillage', () => { Game.memorials = []; Game.farewells = []; });
});
