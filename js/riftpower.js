'use strict';
// ---------------------------------------------------------------------------
// Rift power. The rift-folk arrive with their gadgets, but the batteries run
// down and there's no socket in the Shire. So they go and watch how the
// hill-folk use the land's own power (water turning the mill wheel, wind in
// the windmill's sails, sunshine on the fields) and work out how to make
// their own. Each thing they master lets them build something: a dynamo in
// the river where they can charge up, a wind spinner on the high ground, then
// the Relay Mast, the Glowworm and the Sun-Glass Array; and once they know
// enough, they dig and wire homes of their own.
// ---------------------------------------------------------------------------

function riftPower() { return Village.riftPower || (Village.riftPower = { water: 0, wind: 0, sun: 0 }); }
const POWER_WORD = { water: 'the river', wind: 'the wind', sun: 'the sun' };
function powerKnown() { const p = riftPower(); return ['water', 'wind', 'sun'].filter((k) => p[k] >= 1).length; }
function builtCivic(key) { return World.lots.some((l) => l.key === key && l.state === 'done'); }
// Somewhere they can charge up.
function chargePoints() {
  return ['dynamo', 'turbine', 'relay', 'array', 'glowworm'].map((k) => World.buildings[k]).filter(Boolean);
}

// ----- buildings -----
function makeDynamo(lit) {
  const W = 46, H = 40;
  const [c, x] = makeCanvas(W, H);
  ellipseFill(x, W / 2, H - 3, W / 2 - 3, 3, 'rgba(20,40,10,0.25)');
  // a stone housing on the bank
  x.fillStyle = '#7a7468'; x.fillRect(4, 14, 26, 22);
  for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) { x.fillStyle = (r + k) % 2 ? '#8e887a' : '#6a6458'; x.fillRect(5 + k * 6 + (r % 2) * 3, 15 + r * 4, 5, 3); }
  x.fillStyle = '#4a4e56'; x.fillRect(2, 10, 30, 4); x.fillStyle = '#9aa0a8'; x.fillRect(2, 10, 30, 1);
  // a copper coil and a neon gauge
  x.fillStyle = '#b8743a'; for (let k = 0; k < 5; k++) x.fillRect(10 + k * 3, 6, 2, 4);
  x.fillStyle = '#26262e'; x.fillRect(8, 20, 8, 6); x.fillStyle = lit ? '#7aff5a' : '#2a5a2a'; x.fillRect(9, 21, 6, 4);
  x.fillStyle = '#2a2a32'; x.fillRect(20, 22, 7, 14); x.fillStyle = lit ? '#7af0ff' : '#3a4450'; x.fillRect(21, 23, 5, 13);
  // the little turbine wheel in the race
  disc(x, 37, 28, 8, '#4a4e56'); disc(x, 37, 28, 6, '#2a6a8a');
  x.fillStyle = '#c8ccd4'; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; x.fillRect(Math.round(37 + Math.cos(a) * 5), Math.round(28 + Math.sin(a) * 5), 2, 2); }
  disc(x, 37, 28, 2, '#9aa0a8');
  x.fillStyle = '#26262e'; x.fillRect(30, 27, 4, 2);
  x.fillStyle = lit ? '#3af0ff' : '#2a6a74'; x.fillRect(4, 14, 26, 1);
  return outlineCanvas(c, OUTLINE);
}
function makeTurbine(lit) {
  const W = 34, H = 84;
  const [c, x] = makeCanvas(W, H);
  ellipseFill(x, W / 2, H - 3, 12, 3, 'rgba(20,40,10,0.25)');
  // a slim mast on a stone footing, three blades and a neon tip
  x.fillStyle = '#7a7468'; x.fillRect(W / 2 - 6, H - 10, 12, 7);
  x.fillStyle = '#9aa0a8'; x.fillRect(W / 2 - 1, 16, 3, H - 26); x.fillStyle = '#6a7078'; x.fillRect(W / 2 + 1, 16, 1, H - 26);
  x.fillStyle = '#c8ccd4'; x.fillRect(W / 2 - 3, 12, 7, 5);
  const blade = (a) => { for (let k = 2; k < 15; k++) { x.fillStyle = k > 12 ? (lit ? '#ff3aa8' : '#8a2a5a') : '#e8ecf0'; x.fillRect(Math.round(W / 2 + Math.cos(a) * k), Math.round(14 + Math.sin(a) * k), 2, 2); } };
  blade(-Math.PI / 2); blade(Math.PI / 6); blade(Math.PI * 5 / 6);
  x.fillStyle = lit ? '#3af0ff' : '#2a6a74'; x.fillRect(W / 2 - 1, H - 12, 3, 2);
  return outlineCanvas(c, OUTLINE);
}

// New buildings the rift-folk raise once they know how to power them.
RIFT_CIVIC.push(
  {
    // on the north bank, right by the water
    key: 'dynamo', kind: 'building', rift: true, name: 'The River Dynamo', get anchor() { return [74, Math.round(RIVER_Y(74)) - 2]; }, w: 3, pw: 46, doorOff: 24,
    due: () => riftPower().water >= 1, when: 'once the rift-folk have learned power from the river',
    desc: 'A little turbine in a stone housing on the bank: the rift-folk charge their gadgets here',
    make: (lit) => makeDynamo(lit),
  },
  {
    key: 'turbine', kind: 'building', rift: true, name: 'The Wind Spinner', anchor: [48, 8], w: 2, pw: 34, doorOff: 17,
    due: () => riftPower().wind >= 1, when: 'once the rift-folk have learned power from the wind',
    desc: 'A slim mast with three white blades, humming on the high ground',
    make: (lit) => makeTurbine(lit),
  },
);
for (const d of RIFT_CIVIC) CIVIC_BY_KEY[d.key] = d;
// the older rift buildings now need power before they can be raised
{
  const gate = (key, need, when) => { const d = CIVIC_BY_KEY[key]; if (!d) return; const was = d.due; d.due = () => was() && need(); d.when = `${d.when}, ${when}`; };
  gate('relay', () => builtCivic('dynamo') || builtCivic('turbine'), 'with a dynamo or spinner to power it');
  gate('glowworm', () => powerKnown() >= 2, 'and power from two sources');
  gate('array', () => riftPower().sun >= 1, 'once they understand sunshine');
}

// ----- batteries -----
// Gadgets slowly run flat; charging needs one of their powered buildings.
function riftPowerTick(dt) {
  ensureRiftCamp(null);
  for (const v of Game.villagers) {
    if (!v.isRiftborn() || v.stage === 'baby') continue;
    if (v.battery == null) v.battery = 0.9;
    const using = v.task && v.task.phase === 'do' && ['gadget', 'seek_home', 'jack_in'].includes(v.task.a.id);
    v.battery = Math.max(0, v.battery - dt * (using ? 0.0016 : 0.00012));
  }
}
{
  const ga = ACTIONS.gadget.avail;
  ACTIONS.gadget.avail = (v, h) => (!v.isRiftborn() || (v.battery ?? 1) > 0.08) && (!ga || ga(v, h));
}

const STUDY_SAY = {
  water: ['Falling water, turning a wheel... that\'s a generator waiting to happen.', 'How many turns a minute? Count with me.', 'If I put a coil on that axle...'],
  wind: ['They catch the wind in cloth. Cloth! Brilliant.', 'The sails never stop. Free power, all day.', 'Measure the gusts. Write it down.'],
  sun: ['All this sunshine and nobody\'s using it.', 'Glass, angled just so... we could drink the light.', 'Warm stone, warm panels. Same idea.'],
};

Object.assign(ACTIONS, {
  // watching the land's own power at work, and working out how to use it
  study_power: {
    label: 'Studying how to make power', icon: 'chip', sat: { bored: -0.45, industry: -0.3 }, dur: 45, pose: 'stand', outdoor: true, prop: 'gadget', stages: ADULT,
    label2: (v) => { const k = v.task && v.task.target.source; return k ? `Studying how to draw power from ${POWER_WORD[k]}` : 'Studying how to make power'; },
    avail: (v) => v.isRiftborn() && (riftPower().water < 1 || riftPower().wind < 1 || riftPower().sun < 1),
    extra: (v) => 0.18 + ((v.battery ?? 1) < 0.3 ? 0.25 : 0) + v.genes.curiosity * 0.1,
    time: (h) => (isDay(h) ? 1 : 0.1),
    target: (v) => {
      const p = riftPower(), opts = [];
      if (p.water < 1 && World.millWheel) opts.push(['water', World.millWheel.x - 6, World.millWheel.y - 30]);
      if (p.wind < 1 && World.windmill) opts.push(['wind', World.windmill.x, World.windmill.sortY + 14]);
      if (p.sun < 1 && !Game.raining && Game.darkness < 0.2) { const t = strollTarget(v); if (t) opts.push(['sun', t.x, t.y]); }
      if (!opts.length) return null;
      // the one they understand least, mostly
      opts.sort((a, b) => p[a[0]] - p[b[0]]);
      const [k, x, y] = R.chance(0.7) ? opts[0] : R.pick(opts);
      const t = randomNearby(v, 1.5, x, y);
      return t ? { ...t, source: k, facing: 'up' } : null;
    },
    tick: (v, task, dt) => {
      const k = task.target.source, p = riftPower();
      // they learn faster together, and from the miller and the hill-folk who know these things
      const mates = Game.villagers.filter((o) => o !== v && o.task && o.task.a.id === 'study_power' && o.task.target.source === k).length;
      const local = k !== 'sun' && Game.villagers.some((o) => (o.job === 'miller' || o.job === 'woodwright') && !o.inside && dist(o.x, o.y, v.x, v.y) < 90);
      const before = p[k];
      p[k] = Math.min(1, p[k] + dt * 0.0018 * (0.6 + v.skills.tinkering / 80) * (1 + Math.min(3, mates) * 0.3) * (local ? 1.4 : 1));
      if (Math.random() < dt * 0.025) v.say(R.pick(STUDY_SAY[k]), 3);
      if (before < 1 && p[k] >= 1) powerLearned(k, v);
    },
  },
  charge_up: {
    label: 'Charging up', icon: 'chip', sat: { bored: -0.1 }, dur: 20, pose: 'inside', stages: ADULT,
    avail: (v) => v.isRiftborn() && (v.battery ?? 1) < 0.45 && chargePoints().length > 0,
    extra: (v) => (1 - (v.battery ?? 1)) * 0.7,
    target: (v) => { const b = chargePoints().sort((a, b2) => dist(a.stepX, a.stepY, v.x, v.y) - dist(b2.stepX, b2.stepY, v.x, v.y))[0]; return b ? { building: b } : null; },
    done: (v) => { v.battery = 1; v.drives.bored = Math.max(0, v.drives.bored - 0.1); if (R.chance(0.3)) v.remember('Charged up. Full bars. Bliss.', 1); },
  },
  // the rift-folk lend a hand on their own buildings, and on homes for themselves
  build_hab: {
    label: 'Building something of their own', icon: 'hammer', sat: { industry: -0.4, bored: -0.3 }, dur: 70, pose: 'work', prop: 'spade', outdoor: true, stages: ADULT,
    label2: (v) => { const p = v.task && v.task.target.project; return p ? `Building ${p.hab ? 'a home of their own' : projectLabel(p).replace(/^The /, 'the ')}` : 'Building something of their own'; },
    avail: (v) => v.isRiftborn() && v.job !== 'tinker' && v.job !== 'woodwright' && Village.projects.some((p) => riftProject(p) && projectReady(p)),
    extra: (v) => 0.25 + (homeless(v) ? 0.3 : 0),
    time: (h) => workHours(h, 8, 18),
    target: () => { const p = Village.projects.find((x) => riftProject(x) && projectReady(x)); return p ? { ...projectSpot(p), project: p } : null; },
    tick: (v, task, dt) => { if (Math.random() < dt * 0.2) FX.sparkle(v.x, v.y - 8, '#5af8ff'); },
    done: (v, task) => { const p = task.target.project; if (p && Village.projects.includes(p)) workProject(v, p); },
  },
});
// any of the rift-folk can pick over a rift scar for spare parts
ACTIONS.scavenge = {
  ...ACTIONS.work_salvage, label: 'Scavenging the rift scar for parts', job: null, stages: ADULT,
  avail: (v, h) => v.isRiftborn() && v.job !== 'tinker' && ACTIONS.work_salvage.avail(v, h),
  time: (h) => (isDay(h) ? 1 : 0.1),
  extra: () => 0.12 + ((Village.stores.scrap || 0) < 6 ? 0.18 : 0),
};
for (const k of ['study_power', 'charge_up', 'build_hab', 'scavenge']) ACTIONS[k].id = k;
Object.assign(ACTION_NAMES, { study_power: 'Studying power', charge_up: 'Charging up', build_hab: 'Building their own things', scavenge: 'Scavenging' });
function riftProject(p) { return p.hab || (p.lot != null && World.lots[p.lot].def && World.lots[p.lot].def.rift); }

// ----- the rift camp -----
// The first night any of them sleeps rough, the rift-folk rig up a camp
// beside the scar they came through: a neon-edged tarp, crates of salvage
// and a lamp. It's where the homeless among them sleep, and it stays.
function makeRiftCamp(lit) {
  const W = 50, H = 34;
  const [c, x] = makeCanvas(W, H);
  ellipseFill(x, W / 2, H - 3, W / 2 - 3, 3, 'rgba(20,40,10,0.25)');
  // a lean-to tarp on two poles
  x.fillStyle = '#4a4e56'; x.fillRect(6, 8, 2, H - 10); x.fillRect(30, 4, 2, H - 6);
  for (let y = 0; y < 20; y++) { const x0 = 7 + Math.round(y * 0.3), x1 = 31 - Math.round(y * 0.1); x.fillStyle = y % 5 === 0 ? '#2a3a5a' : '#34466a'; x.fillRect(x0, 6 + y, x1 - x0, 1); }
  x.fillStyle = lit ? '#ff3aa8' : '#7a2a5a'; x.fillRect(7, 6, 25, 1); x.fillStyle = lit ? '#3af0ff' : '#2a6a74'; x.fillRect(13, 25, 18, 1);
  // bedrolls, crates of salvage and a glowing lamp
  x.fillStyle = '#5a6a7a'; x.fillRect(12, 24, 16, 4); x.fillStyle = '#7a8a9a'; x.fillRect(12, 24, 16, 1);
  x.fillStyle = '#6a5a3a'; x.fillRect(34, 20, 10, 9); x.fillRect(36, 14, 8, 6); x.fillStyle = '#8a7a52'; x.fillRect(34, 20, 10, 1); x.fillRect(36, 14, 8, 1);
  x.fillStyle = '#c8ccd4'; x.fillRect(37, 17, 2, 2); x.fillStyle = '#3af0ff'; x.fillRect(41, 23, 2, 2);
  x.fillStyle = '#26262e'; x.fillRect(3, 22, 4, 7); x.fillStyle = lit ? '#7af0ff' : '#3a5a6a'; x.fillRect(4, 23, 2, 4);
  x.fillStyle = '#5a5e66'; x.fillRect(31, 0, 1, 5); x.fillStyle = lit ? '#ff4a4a' : '#7a2a2a'; x.fillRect(30, 0, 3, 1);
  return outlineCanvas(c, OUTLINE);
}
let RIFT_CAMP_STATIC = null;
function riftCampSpot() { return Game.stats.riftCamp || null; }
function ensureRiftCamp(near) {
  if (!Game.stats.riftCamp && near) {
    const s = World.riftScars.length ? World.riftScars[0] : near;
    // open grass near the scar, not on a lane or in someone's garden
    const sx = Math.floor(s.x / 16), sy = Math.floor(s.y / 16);
    let t = null;
    const clear = (x, y) => {
      for (let j = -1; j <= 1; j++) for (let i = -2; i <= 2; i++) { const xx = x + i, yy = y + j; if (tileAt(xx, yy) !== T.GRASS || World.reserved[tIdx(xx, yy)] || World.block[tIdx(xx, yy)]) return false; }
      return walkable(x, y + 1) && !World.statics.some((st) => Math.abs(st.x - (x * 16 + 8)) < 40 && Math.abs(st.y - (y * 16 + 14)) < 28);
    };
    for (let r = 2; r <= 12 && !t; r++) for (let j = -r; j <= r && !t; j++) for (let i = -r; i <= r && !t; i++) {
      if (Math.max(Math.abs(i), Math.abs(j)) === r && clear(sx + i, sy + j)) t = [sx + i, sy + j];
    }
    if (!t) t = nearestWalkable(sx + 2, sy);
    if (!t) return;
    Game.stats.riftCamp = { x: t[0] * 16 + 8, y: t[1] * 16 + 14, tx: t[0], ty: t[1] };
    chronicle('With nowhere else to go, the rift-folk have rigged up a camp beside the rift scar: a neon-edged tarp, crates of salvage and a lamp that glows all night.', 'rift');
  }
  const cp = Game.stats.riftCamp;
  if (cp && !RIFT_CAMP_STATIC && World._addStatic) {
    RIFT_CAMP_STATIC = World._addStatic(makeRiftCamp(false), cp.x, cp.y, { snow: true });
    RIFT_CAMP_STATIC.alt = RIFT_CAMP_STATIC.baseAlt = makeRiftCamp(true);
    World._blk(cp.tx, cp.ty);
  }
  if (RIFT_CAMP_STATIC) RIFT_CAMP_STATIC.useAlt = Game.darkness > 0.15;
}

function powerLearned(k, v) {
  const n = powerKnown();
  const what = { water: 'how to make power from the river: a coil on a turning axle, just like the mill', wind: 'how to catch the wind the way the windmill does, and turn it into power', sun: 'how to drink the sunshine with angled glass' }[k];
  chronicle(`The rift-folk have worked out ${what}. ${v.first} is very pleased with ${v.pron.them}self.${n === 1 ? ' They mean to build something with it.' : ''}`, 'rift');
  for (const o of Game.villagers) if (o.isRiftborn() && !o.leaving) o.remember(`We learned to make power from ${POWER_WORD[k]}. Like home, but greener.`, 2);
  devLog('rift', `power from ${k} learned (${n}/3 sources)`);
  if (typeof planTown === 'function') planTown();
}

// Each day: once they understand two kinds of power, the rift-folk dig and
// wire a home of their own when any of them are still without one.
function riftHabsDaily() {
  if (powerKnown() < 2 || Village.projects.some((p) => p.hab)) return;
  const need = Game.villagers.filter((v) => v.isRiftborn() && v.isGrown() && !v.leaving && (homeless(v) || residentsOf(v.home()).some((o) => !o.isRiftborn() && o.isGrown()))).length;
  if (!need) return;
  const site = World.homes.find((h) => !h.built && !Village.projects.some((p) => p.homeId === h.id));
  let p = null;
  if (site) { p = { kind: 'home', homeId: site.id, prog: site.buildProg || 0, hab: true }; Village.projects.push(p); if (site.siteStatic) site.siteStatic.hidden = false; }
  else { const lot = World.lots.find((l) => l.kind === 'home' && l.state === 'planned'); if (lot) { p = startProject(lot); p.hab = true; } }
  if (!p) return;
  const h = World.homes[p.homeId];
  chronicle(`The rift-folk have started on a home of their own at ${h.name}: dug into the hill like any hobbit-hole, but wired, lit and humming.`, 'rift');
}
