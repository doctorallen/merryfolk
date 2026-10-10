'use strict';
// ---------------------------------------------------------------------------
// Merryfolk: game state, simulation clock, seasons and weather, rendering,
// camera and input, saving. The interface lives in ui.js.
// ---------------------------------------------------------------------------

const SEED = 1337;
const SAVE_KEY = 'thistledown-save-v2';
const GAME_MIN_PER_SEC = 3; // at 1x speed: one day takes eight real minutes
const SPEEDS = [0, 1, 2, 4, 8, 16];

const Game = {
  time: 8 * 60 + 20, day: 1, hour: 8.33, speedIdx: 1, minPerSec: GAME_MIN_PER_SEC,
  villagers: [], archive: {}, away: [], census: [], stats: {},
  party: { on: false, until: 0, planned: null, reason: '' }, fireworks: { x: 0, y: 0, until: -1 },
  raining: false, weather: 'clear', rainUntil: 0, darkness: 0, tool: 'hand', selected: null, hovered: null, follow: false,
  log: [], planted: [], cam: { x: 0, y: 0, w: 400, h: 240 }, zoom: 3, lastHour: -1, lastDay: 1, started: false, lastTraveller: -9,
  schedulePartyTonight(reason) {
    this.party.planned = reason;
    if (this.hour >= 17 && this.hour < 23 && !this.raining) startParty(reason);
  },
};

let view, vctx, overlay, octx, dpr = 1;
let tReal = 0;

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
function newVillage() {
  Game.villagers = []; Game.archive = {}; Game.away = []; Game.census = [];
  NEXT_ID = 1;
  Village.reset();
  // Founding families: 'a' adult, 'e' elder, 'c' child, 'b' baby
  const plan = [[0, 'aacc'], [1, 'aac'], [2, 'a'], [3, 'aa'], [4, 'ac'], [5, 'aacb'], [6, 'e'], [7, 'aa'], [8, 'aac'], [9, 'ae'], [3, 'c'], [2, 'e']];
  for (const [homeId, members] of plan) {
    const home = World.homes[homeId];
    const surname = home.surname === 'Bag-and-Barrel' ? R.pick(SURNAMES) : home.surname;
    const adults = [];
    for (const m of members) {
      const opts = { homeId, surname, x: home.stepX + R.i(-30, 30), y: home.stepY + R.i(4, 30) };
      if (m === 'a') { opts.age = R.f(7, 21); if (adults.length === 1) opts.sex = adults[0].genes.sex === 'f' ? 'm' : 'f'; }
      if (m === 'e') opts.age = R.f(26.5, 29);
      if (m === 'c' || m === 'b') {
        const ps = adults.length ? adults : Game.villagers.filter((v) => v.homeId === homeId && v.isGrown());
        if (ps.length >= 2) { opts.genes = inheritGenes(ps[0].genes, ps[1].genes); opts.parents = [ps[0].id, ps[1].id]; }
        else if (ps.length === 1) { opts.genes = inheritGenes(ps[0].genes, randomGenes()); opts.parents = [ps[0].id]; }
        opts.age = m === 'b' ? 0.3 : R.f(1.5, 4.4); opts.pouch = 0;
        if (ps.length) opts.surname = ps[0].surname;
      }
      const v = new Villager(opts);
      if (m === 'a' || m === 'e') {
        adults.push(v);
        for (const s of SKILLS) v.skills[s] = Math.round(R.f(0, 30) * v.genes.apt[s] + (m === 'e' ? 15 : 0));
      }
      Game.villagers.push(v);
    }
    if (adults.length === 2 && !adults[0].spouse) { adults[0].spouse = adults[1].id; adults[1].spouse = adults[0].id; adults[0].sweetheart = adults[1].id; adults[1].sweetheart = adults[0].id; }
  }
  // the old storyteller of the village is well-read
  const elder = Game.villagers.filter((v) => v.stage === 'elder').sort((a, b) => b.genes.apt.lore - a.genes.apt.lore)[0];
  if (elder) elder.skills.lore = Math.max(elder.skills.lore, 45);
  for (const v of Game.villagers) {
    const t = nearestWalkable(Math.floor(v.x / 16), Math.floor(v.y / 16));
    if (t) { v.x = t[0] * 16 + 8; v.y = t[1] * 16 + 12; }
    if (v.stage === 'baby') v.enterBuilding(v.home());
  }
  const vs = Game.villagers;
  for (const a of vs) for (const b of vs) {
    if (a.id >= b.id) continue;
    let r = R.f(-0.1, 0.45);
    if (a.spouse === b.id) { r = 0.9; a.love[b.id] = b.love[a.id] = 0.9; }
    else if (a.parents.includes(b.id) || b.parents.includes(a.id)) r = 0.85;
    else if (a.homeId === b.homeId) r = 0.6;
    a.rel[b.id] = r; b.rel[a.id] = r;
  }
  assignJobs(false);
  Game.time = 8 * 60 + 20; Game.log = []; Game.planted = [];
  Game.party = { on: false, until: 0, planned: null, reason: '' };
  Game.weather = 'clear'; Game.raining = false;
  World.items = [];
  Game.census.push({ day: 0, pop: vs.length, mood: 0.7, food: Village.foodTotal(), kids: vs.filter((v) => !v.isGrown()).length });
  chronicle('A fine spring morning in Thistledown. The kettles are on and the second breakfast is nearly ready.', 'info');
}

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------
function save() {
  try {
    const data = {
      v: 2, time: Game.time, nextId: NEXT_ID, weather: Game.weather, rainUntil: Game.rainUntil, party: Game.party,
      villagers: Game.villagers.filter((v) => !v.leaving).map((v) => ({ ...v.serialize(), inside: v.inside ? (v.inside.kind === 'home' ? 'h' + v.inside.id : 'b' + v.inside.key) : null })),
      archive: Game.archive, away: Game.away, census: Game.census, lastTraveller: Game.lastTraveller, stats: Game.stats,
      stores: Village.stores, town: saveTown(), wantHomes: Village.wantHomes,
      homes: World.homes.map((h) => ({ built: h.built, buildProg: h.buildProg, pantry: h.pantry, chilly: h.chilly, plots: h.plots.map((p) => [p.stage, p.prog]) })),
      allot: World.allotments.map((a) => a.plots.map((p) => p.stage)), pens: World.pens.map((p) => p.tend),
      weed: World.weed.map((w) => w.stage), fields: World.fields.map((f) => f.plots.map((p) => p.stage)), herbs: World.herbBeds.map((p) => p.stage),
      orchard: World.orchard.map((t) => t.apples), hives: World.hives.map((h) => h.honey), eggs: World.eggs,
      woods: World.woodSpots.map((s) => s.stock), mush: World.mushrooms.map((m) => m.amount),
      planted: Game.planted, log: Game.log.slice(0, 40),
      items: World.items.map((i) => ({ kind: i.kind, x: i.x, y: i.y, uses: i.uses })),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { /* storage unavailable: the village simply won't persist */ }
}

function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }

function load() {
  let data;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
  if (!data || data.v !== 2 || !data.villagers || !data.villagers.length) return false;
  Game.time = data.time; NEXT_ID = data.nextId || 1;
  Game.weather = data.weather || 'clear'; Game.raining = Game.weather === 'rain' || Game.weather === 'storm'; Game.rainUntil = data.rainUntil || 0;
  Game.party = Object.assign({ on: false, until: 0, planned: null, reason: '' }, data.party || {});
  Game.archive = data.archive || {}; Game.away = data.away || []; Game.stats = data.stats || {}; Game.census = data.census || []; Game.lastTraveller = data.lastTraveller ?? -9;
  Village.reset();
  Object.assign(Village.stores, data.stores || {});
  Village.wantHomes = data.wantHomes || 0;
  loadTown(data.town);
  // older saves kept a single building project
  if (data.project && !data.town) Village.projects = [{ kind: 'home', homeId: data.project.homeId, prog: data.project.prog || 0 }];
  Game.day = Math.floor(Game.time / 1440) + 1;
  const season = seasonKey(Game.day);
  (data.homes || []).forEach((h, i) => {
    const home = World.homes[i]; if (!home) return;
    if (h.built && !home.built) { home.built = true; furnishHome(home); addHomeFlowers(home); }
    home.buildProg = h.buildProg || 0;
    home.pantry = Object.assign(emptyPantry(), h.pantry || {}); home.chilly = !!h.chilly;
    (h.plots || []).forEach(([s, p], j) => { if (home.plots[j]) { home.plots[j].stage = s; home.plots[j].prog = p; } });
  });
  Village.projects = Village.projects.filter((p) => p.kind !== 'home' || (World.homes[p.homeId] && !World.homes[p.homeId].built));
  for (const p of Village.projects) if (p.kind === 'home') { const sh = World.homes[p.homeId]; if (sh.siteStatic) sh.siteStatic.hidden = false; }
  (data.weed || []).forEach((s, i) => { if (World.weed[i]) World.weed[i].stage = s; });
  (data.allot || []).forEach((a, i) => a.forEach((s, j) => { if (World.allotments[i] && World.allotments[i].plots[j]) World.allotments[i].plots[j].stage = s; }));
  (data.pens || []).forEach((t, i) => { if (World.pens[i]) World.pens[i].tend = t; });
  Village.woollens = (season === 'autumn' || season === 'winter') && (Village.stores.wool || 0) > 0;
  (data.fields || []).forEach((f, i) => f.forEach((s, j) => { if (World.fields[i] && World.fields[i].plots[j]) World.fields[i].plots[j].stage = s; }));
  (data.herbs || []).forEach((s, i) => { if (World.herbBeds[i]) World.herbBeds[i].stage = s; });
  (data.orchard || []).forEach((n, i) => { if (World.orchard[i]) World.orchard[i].apples = n; });
  (data.hives || []).forEach((n, i) => { if (World.hives[i]) World.hives[i].honey = n; });
  (data.woods || []).forEach((n, i) => { if (World.woodSpots[i]) World.woodSpots[i].stock = n; });
  (data.mush || []).forEach((n, i) => { if (World.mushrooms[i]) World.mushrooms[i].amount = n; });
  World.eggs = data.eggs || 0;
  Game.villagers = data.villagers.map((o) => new Villager(o));
  // villagers from before they had a sex: make sure couples can still start a family
  for (const v of Game.villagers) {
    const sp = v.spouse != null && Game.villagers.find((o) => o.id === v.spouse);
    if (sp && sp.genes.sex === v.genes.sex && v.id < sp.id && !(data.villagers.find((o) => o.id === sp.id).genes || {}).sex) { sp.genes.sex = v.genes.sex === 'f' ? 'm' : 'f'; sp.refreshSprites(); }
  }
  data.villagers.forEach((o, i) => {
    const v = Game.villagers[i];
    if (o.inside) {
      const b = o.inside[0] === 'h' ? World.homes[+o.inside.slice(1)] : World.buildings[o.inside.slice(1)];
      if (b) v.enterBuilding(b);
    }
    const t = nearestWalkable(Math.floor(v.x / 16), Math.floor((v.y - 2) / 16));
    if (t && !walkable(Math.floor(v.x / 16), Math.floor((v.y - 2) / 16))) { v.x = t[0] * 16 + 8; v.y = t[1] * 16 + 12; }
  });
  Game.planted = data.planted || [];
  for (const f of Game.planted) World.flowers.push({ x: f.x, y: f.y, seed: f.seed });
  Game.log = data.log || [];
  World.items = (data.items || []).map((i) => ({ ...i, claims: 0 }));
  World.season = season;
  return true;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
function simulate(dt) {
  Game.time += dt;
  Game.day = Math.floor(Game.time / 1440) + 1;
  Game.hour = (Game.time % 1440) / 60;
  const hourAbs = Math.floor(Game.time / 60);
  if (hourAbs !== Game.lastHour) { if (Game.lastHour >= 0) onHour(Math.floor(Game.hour)); Game.lastHour = hourAbs; }
  if (Game.day !== Game.lastDay) { Game.lastDay = Game.day; dailySociety(); checkSeason(true); save(); }

  updateWorld(dt, Game.raining, World.season, Game.hour);
  for (const v of Game.villagers) v.update(dt, Game.hour);
  const gone = Game.villagers.filter((v) => v.gone);
  if (gone.length) {
    Game.villagers = Game.villagers.filter((v) => !v.gone);
    for (const v of gone) {
      if (Game.selected === v) selectVillager(null);
      for (const o of Game.villagers) { if (o.spouse === v.id && v.leaving === 'final') { o.spouse = null; o.sweetheart = null; } if (o.sweetheart === v.id && v.leaving === 'final') o.sweetheart = null; }
    }
  }

  // homes and workshops: lights and chimney smoke
  const byId = new Map(Game.villagers.map((v) => [v.id, v]));
  for (const h of World.homes) {
    if (!h.built) continue;
    const awake = h.inside.some((id) => { const v = byId.get(id); return v && !(v.task && v.task.a.id === 'sleep'); });
    h.lit = (awake || (h.inside.length && Game.hour > 17 && Game.hour < 22.5)) && Game.darkness > 0.08;
    const cooking = h.inside.length > 0 || isMealTime(Game.hour) || (World.season === 'winter' && !h.chilly && residentsOf(h).length);
    // a lived-in hole nearly always has something on the hob
    h.smoking = cooking || (residentsOf(h).length > 0 && (World.season !== 'summer' || Game.hour < 9 || Game.hour > 18));
  }
  for (const k in World.buildings) {
    const b = World.buildings[k];
    b.lit = Game.darkness > 0.15 && (b.inside.length > 0 || (b.isInn && Game.hour > 16));
    if (b.static) b.static.useAlt = b.lit;
    const busy = b.inside.length > 0 || b.isInn;
    b.smoking = busy || ['bakery', 'bakery2', 'smokehouse', 'brewhouse', 'herbalist', 'workshop'].includes(k) && Game.hour > 5 && Game.hour < 20;
  }
  if (Game.party.on && Game.time > Game.party.until) {
    Game.party.on = false;
    chronicle('The last lanterns are blown out in the party field. What a night!', 'info');
  }
}

const FESTIVALS = {
  spring: ['mayday', 'It\'s the Mayday dance! Ribbons round the maypole in the party field tonight.'],
  summer: ['midsummer', 'Midsummer\'s Eve! The longest day ends with the biggest fireworks of the year.'],
  autumn: ['harvest', 'The Harvest Feast is tonight: long tables, pies and the year\'s best ale in the party field.'],
  winter: ['yule', 'Yule! A great bonfire is lit in the party field, and there\'ll be carols and mulled ale.'],
};
const SEASON_NOTES = {
  spring: 'Spring has come to Thistledown. Blossom on the apple trees, and the fields want sowing.',
  summer: 'Summer is here: long golden days, ripening barley, and bees busy in the clover.',
  autumn: 'Autumn turns the woods to copper and gold. Harvest time, and mushrooms galore!',
  winter: 'Winter has come. Snow on the hills, smoke from every chimney. Mind the woodpile!',
};
function checkSeason(announce) {
  const s = seasonKey(Game.day);
  if (s !== World.season) {
    World.season = s;
    seasonTurn(s);
    applySeasonToStatics(s);
    startSeasonPaint(s);
    if (announce) chronicle(SEASON_NOTES[s], 'season');
    if (s === 'winter') { Game.weather = R.chance(0.5) ? 'snow' : 'cloudy'; Game.raining = false; }
  }
  if (dayOfSeason(Game.day) === 2 && Game.festivalDay !== Game.day) {
    Game.festivalDay = Game.day;
    const [key, note] = FESTIVALS[s];
    Game.party.planned = key;
    if (announce) chronicle(note, 'party');
  }
}

function onHour(h) {
  const season = World.season;
  // weather, by season
  const w = Game.weather;
  if (w === 'rain' || w === 'storm' || w === 'snow') {
    if (Game.time >= Game.rainUntil) { Game.weather = 'cloudy'; Game.raining = false; }
  } else if (w === 'fog') {
    if (h >= 10 || Math.random() < 0.3) Game.weather = 'clear';
  } else if (w === 'cloudy') {
    const r = Math.random();
    const wet = { spring: 0.25, summer: 0.16, autumn: 0.3, winter: 0.3 }[season];
    if (r < wet) {
      Game.weather = season === 'winter' ? 'snow' : season === 'summer' && Math.random() < 0.4 ? 'storm' : 'rain';
      Game.raining = Game.weather !== 'snow';
      Game.rainUntil = Game.time + R.f(60, 200);
      if (Game.rainNoteDay !== Game.day) {
        Game.rainNoteDay = Game.day;
        chronicle({ rain: 'It\'s coming on to rain. Good for the gardens, at least.', storm: 'Thunder rumbles over the hills. Everyone\'s dashing for cover!', snow: 'Snow is falling softly on Thistledown.' }[Game.weather], 'info');
      }
    } else if (r < 0.5) Game.weather = 'clear';
  } else {
    if (season === 'autumn' && h === 5 && Math.random() < 0.4) Game.weather = 'fog';
    else if (Math.random() < 0.09) Game.weather = 'cloudy';
  }
  // evening hearths, parties and fireworks
  if (h === 19) lightHearths();
  if (h === 18 && !Game.party.on && !Game.raining) {
    if (Game.party.planned || Game.day % 3 === 0 || Math.random() < 0.25) startParty(Game.party.planned || 'evening');
  }
  if (h === 22 && Game.party.on && !Game.raining) fireworkShow(PARTY.danceX * 16 + 8, (PARTY.danceY - 3) * 16, Game.party.reason === 'midsummer' ? 18 : 9);
  if (h === 23 && Game.party.on && Game.party.reason === 'midsummer') fireworkShow(PARTY.danceX * 16 + 8, (PARTY.danceY - 3) * 16, 14);
  if (h === 0) Game.party.planned = null;
  save();
}

function startParty(reason) {
  if (Game.party.on) { Game.party.until = Math.max(Game.party.until, Game.time + 180); return; }
  const dayStart = Math.floor(Game.time / 1440) * 1440;
  Game.party.on = true;
  Game.party.until = Math.max(Game.time + 150, dayStart + 23.75 * 60);
  Game.party.reason = reason;
  Game.party.planned = null;
  if (['mayday', 'midsummer', 'harvest', 'yule'].includes(reason)) {
    chronicle({ mayday: 'The maypole is up and the fiddles are tuned. Round and round they go!', midsummer: 'Midsummer revels have begun in the party field!', harvest: 'The Harvest Feast is laid! Pies, stews and cider for everyone.', yule: 'The Yule bonfire is roaring. Mulled ale and carols in the snow!' }[reason], 'party');
    if (reason === 'harvest') { Village.produce('pie', 10); Village.produce('stew', 12); }
    return;
  }
  const why = { wedding: 'for the happy couple', 'coming-of-age': 'to celebrate a coming of age', fireworks: 'and it\'s an impromptu one!', 'house-warming': 'to warm the new hole' }[reason] || 'and everyone\'s invited';
  chronicle(`The lanterns are lit in the party field: there's a do tonight, ${why}.`, 'party');
}

function fireworkShow(x, y, n) {
  for (let i = 0; i < n; i++) FX.firework(x + R.f(-40, 40), y + R.f(-6, 6), i * R.f(0.6, 1.6) + R.f(0, 0.4));
  Game.fireworks = { x, y, until: Game.time + 50 };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function skyState(h) {
  const [rise, set] = DAYLIGHT[World.season] || DAYLIGHT.summer;
  let dark;
  if (h < rise - 1) dark = 0.7;
  else if (h < rise + 1) dark = 0.7 * (1 - (h - (rise - 1)) / 2);
  else if (h < set - 1.5) dark = 0;
  else if (h < set + 2) dark = 0.7 * ((h - (set - 1.5)) / 3.5);
  else dark = 0.7;
  let dusk = 0;
  if (h >= set - 2.5 && h < set + 1.5) dusk = Math.sin(((h - (set - 2.5)) / 4) * Math.PI);
  else if (h >= rise - 1 && h < rise + 1.5) dusk = Math.sin(((h - (rise - 1)) / 2.5) * Math.PI) * 0.6;
  if (Game.raining) dark = Math.max(dark, Game.weather === 'storm' ? 0.32 : 0.2);
  else if (Game.weather === 'cloudy' || Game.weather === 'snow') dark = Math.max(dark, 0.08);
  return { dark, dusk };
}

const PROP_COL = { wood: '#5a3a22', ember: '#ff8a3a', mug: '#c9a46a', foam: '#f4f0e0', plate: '#f4f0e8' };

function drawVillager(ctx, v, ox = 0, oy = 0) {
  const t = tReal;
  let dir = v.facing === 'left' || v.facing === 'right' ? 'side' : v.facing === 'up' ? 'up' : 'down';
  let flip = v.facing === 'left';
  let pose = 'stand', yoff = 0, xoff = 0;
  switch (v.pose) {
    case 'walk': pose = Math.floor(v.walkDist / 5) % 2 ? 'walk1' : 'walk2'; if (v.stage === 'baby') yoff = Math.floor(v.walkDist / 3) % 2 ? -1 : 0; break;
    case 'sit': pose = 'sit'; break;
    case 'work': pose = Math.floor(t * 2.2 + v.id) % 2 ? 'stand' : 'walk1'; break;
    case 'dance': {
      pose = Math.floor(t * 6 + v.id) % 2 ? 'walk1' : 'walk2';
      yoff = -Math.round(Math.abs(Math.sin(t * 6 + v.id)) * 3);
      const f = ['down', 'right', 'up', 'left'][Math.floor(t * 1.1 + v.id * 0.7) % 4];
      dir = f === 'left' || f === 'right' ? 'side' : f; flip = f === 'left';
      break;
    }
  }
  if (v.carried) { pose = Math.floor(t * 8) % 2 ? 'walk1' : 'walk2'; dir = 'down'; flip = false; yoff = Math.round(Math.sin(t * 5) * 1.5); }
  if (v.isTipsy() && v.pose === 'walk') xoff = Math.round(Math.sin(t * 3 + v.id) * 1.5);
  const spr = v.sprites[dir][pose];
  const w = spr.width, h = spr.height;
  const task = v.task;
  const spotKind = task && task.spot ? task.spot.kind : null;
  const groundSit = pose === 'sit' && (!spotKind || spotKind === 'fish' || spotKind === 'shade' || spotKind === 'storyseat' || spotKind === 'story');
  const vx = v.x + ox + xoff, vy = v.y + oy;
  const bottom = pose === 'sit' && !groundSit ? vy - 2 : vy;
  const sx = Math.round(vx) - Math.floor(w / 2), sy = Math.round(bottom) - h + 1 + yoff;

  if (!v.carried) {
    ctx.fillStyle = 'rgba(20,30,10,0.25)'; ctx.fillRect(Math.round(vx) - 4, Math.round(vy) - 1, 9, 2); ctx.fillRect(Math.round(vx) - 3, Math.round(vy), 7, 1);
  } else {
    ctx.fillStyle = 'rgba(20,30,10,0.2)'; ctx.fillRect(Math.round(vx) - 3, Math.round(vy) + 14, 7, 2);
  }
  if (Game.selected === v) {
    ctx.fillStyle = '#ffe680';
    ctx.fillRect(Math.round(vx) - 6, Math.round(vy) + 1, 13, 1); ctx.fillRect(Math.round(vx) - 7, Math.round(vy), 1, 1); ctx.fillRect(Math.round(vx) + 7, Math.round(vy), 1, 1);
  }
  if (pose === 'sit' && (spotKind === 'inn' || spotKind === 'partyseat')) {
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(Math.round(vx) - 4, Math.round(vy) - 6, 9, 2);
    ctx.fillStyle = '#3a2414'; ctx.fillRect(Math.round(vx) - 3, Math.round(vy) - 4, 1, 4); ctx.fillRect(Math.round(vx) + 3, Math.round(vy) - 4, 1, 4);
  }

  const child = v.isChild();
  const mY = child ? 5 : 6, hY = child ? 8 : 10;
  let prop = null;
  if (task && task.phase === 'do') prop = task.target.prop || (task.spot && task.spot.kind === 'partyseat' ? (task.spot.prop || 'mug') : task.a.prop);
  if (task && task.phase === 'go' && (task.target.carry || task.a.id === 'deliver')) prop = 'sack';
  if (task && task.phase === 'go' && task.a.id === 'gift') prop = 'flowers';
  if (task && task.phase === 'go' && task.a.id === 'work_post') prop = 'letter';
  if (!prop && v.stage === 'elder' && dir !== 'up' && pose !== 'sit') prop = 'stick';
  if (v.leaving) prop = 'stick';
  if (v.stage === 'baby' || v.carried) prop = null;
  const P = (rx, ry, pw, ph, col) => {
    ctx.fillStyle = col;
    const x = flip ? sx + w - rx - pw : sx + rx;
    ctx.fillRect(x, sy + ry, pw, ph);
  };
  const drawProp = () => {
    if (!prop) return;
    const lift = Math.sin(t * 1.3 + v.id) > 0.75;
    const swing = Math.floor(t * 2.2 + v.id) % 2;
    switch (prop) {
      case 'pipe':
        if (dir === 'down') { P(6, mY + 1, 1, 1, PROP_COL.wood); P(7, mY + 2, 1, 1, PROP_COL.wood); P(8, mY + 1, 2, 2, PROP_COL.wood); if (Math.sin(t * 3 + v.id) > 0) P(8, mY, 2, 1, PROP_COL.ember); }
        else if (dir === 'side') { P(9, mY, 1, 1, PROP_COL.wood); P(10, mY + 1, 1, 1, PROP_COL.wood); P(11, mY - 1, 2, 2, PROP_COL.wood); if (Math.sin(t * 3 + v.id) > 0) P(11, mY - 2, 2, 1, PROP_COL.ember); }
        break;
      case 'mug': {
        const y = lift ? mY : hY - 3;
        if (dir === 'down') { P(8, y, 3, 3, PROP_COL.mug); P(8, y, 3, 1, PROP_COL.foam); P(11, y + 1, 1, 1, PROP_COL.mug); }
        else if (dir === 'side') { P(8, y, 3, 3, PROP_COL.mug); P(8, y, 3, 1, PROP_COL.foam); }
        break;
      }
      case 'cup': if (dir !== 'up') P(8, lift ? mY : hY - 2, 2, 2, '#9a9488'); break;
      case 'plate':
        if (dir === 'down') { P(2, hY + 1, 7, 1, PROP_COL.plate); P(3, hY, 2, 1, '#c8945a'); P(6, hY, 2, 1, '#7cc05a'); if (lift) P(7, mY + 1, 1, 1, '#c8945a'); }
        else if (dir === 'side') { P(7, hY, 5, 1, PROP_COL.plate); P(8, hY - 1, 2, 1, '#c8945a'); }
        break;
      case 'book':
        if (dir === 'down') { P(3, hY - 3, 6, 4, '#8b2e2e'); P(4, hY - 3, 4, 3, '#f4f0e8'); P(5, hY - 3, 1, 3, '#8b2e2e'); }
        else if (dir === 'side') P(8, hY - 3, 3, 4, '#8b2e2e');
        break;
      case 'hoe': {
        const bob = pose === 'stand' ? 0 : 2;
        P(10, 2 + bob, 1, h - 4, '#7a5a3a'); P(9, h - 3 + bob - 1, 3, 2, '#9a9a9a');
        break;
      }
      case 'spade': {
        const bob = swing ? 0 : 2;
        P(10, 1 + bob, 1, h - 5, '#7a5a3a'); P(9, h - 5 + bob, 3, 3, '#8a8a92'); P(9, 1 + bob, 3, 1, '#7a5a3a');
        break;
      }
      case 'axe': {
        if (swing) { P(10, 0, 1, hY + 2, '#7a5a3a'); P(11, 0, 3, 3, '#a8a8b0'); }
        else { P(10, hY - 2, 4, 1, '#7a5a3a'); P(13, hY - 4, 2, 3, '#a8a8b0'); }
        break;
      }
      case 'fiddle': {
        P(7, mY + 2, 4, 3, '#a0522d'); P(8, mY + 3, 2, 1, '#5a2a12'); P(10, mY + 1, 3, 1, '#3a2414');
        const bow = Math.round(Math.sin(t * 8) * 2);
        P(4 + bow, mY + 4, 6, 1, '#e8dcc0');
        break;
      }
      case 'letter': if (dir !== 'up') { P(8, hY - 1, 4, 3, '#f4efe2'); P(9, hY, 2, 1, '#d83a2a'); } break;
      case 'flowers': if (dir !== 'up') { P(9, hY - 3, 1, 4, '#3f7a32'); P(8, hY - 4, 1, 1, '#e85a6a'); P(10, hY - 5, 1, 1, '#f2d24a'); P(9, hY - 5, 1, 1, '#ffffff'); P(11, hY - 4, 1, 1, '#8a6ad8'); } break;
      case 'sack': P(dir === 'up' ? 2 : 7, hY - 6, 5, 6, '#e8dcc0'); P(dir === 'up' ? 3 : 8, hY - 7, 3, 1, '#a08a60'); break;
      case 'basket': if (dir !== 'up') { P(8, hY - 1, 4, 3, '#8a6440'); P(8, hY - 2, 1, 1, '#d83a2a'); P(10, hY - 2, 1, 1, '#c8925a'); P(9, hY - 3, 2, 1, '#6a4a2a'); } break;
      case 'rod': {
        const bob = Math.round(Math.sin(t * 2 + v.id) * 1);
        P(9, hY - 1, 1, 1, '#6a4a2a'); P(10, hY, 1, 1, '#6a4a2a'); P(11, hY + 1, 1, 1, '#6a4a2a'); P(12, hY + 2, 1, 1, '#6a4a2a'); P(13, hY + 3, 1, 1, '#6a4a2a');
        ctx.fillStyle = 'rgba(230,230,230,0.7)';
        const lx = flip ? sx + w - 14 : sx + 13;
        ctx.fillRect(lx, sy + hY + 4, 1, 8 + bob);
        ctx.fillStyle = '#e83a2a'; ctx.fillRect(lx, sy + hY + 12 + bob, 1, 1); ctx.fillStyle = '#ffffff'; ctx.fillRect(lx, sy + hY + 13 + bob, 1, 1);
        break;
      }
      case 'stick': P(10, hY - 4, 1, h - hY + 3, '#7a5a3a'); P(10, hY - 5, 2, 1, '#5a3a22'); break;
    }
  };
  if (dir === 'up') drawProp();
  if (flip) {
    ctx.save(); ctx.translate(sx + w, sy); ctx.scale(-1, 1); ctx.drawImage(spr, 0, 0); ctx.restore();
  } else ctx.drawImage(spr, sx, sy);
  if (dir !== 'up') drawProp();
  if (v.leaving) { P(-1, hY - 6, 3, 5, '#6a4a2a'); }
  if (World.season === 'winter' && v.isGrown() && !v.inside && dir !== 'up' && v.stage !== 'baby') { P(2, mY + 1, 6, 1, v.genes.vest === '#8b2e2e' ? '#2f6f8f' : '#a23b2a'); }
  v._top = sy; v._h = h;
}

function drawThought(ctx, v) {
  if (v.inside || v.carried) return;
  const show = v.iconT > 0 || Game.selected === v;
  let iconKey = v.task && v.task.a.icon;
  if (v.isSick() && (!iconKey || Game.selected !== v)) iconKey = 'sick';
  if (v.stage === 'baby' && (v.drives.hunger > 0.7 || v.drives.lonely > 0.75)) iconKey = 'baby';
  if ((!show && iconKey !== 'sick') || !iconKey) return;
  const icon = ICONS[iconKey];
  if (!icon) return;
  const x = Math.round(v.x) - 6, y = (v._top ?? v.y - 16) - 14;
  ctx.globalAlpha = v.iconT > 0 && v.iconT < 0.5 && Game.selected !== v ? v.iconT * 2 : 1;
  ctx.fillStyle = '#2a1c12'; ctx.fillRect(x - 1, y, 13, 11); ctx.fillRect(x, y - 1, 11, 13);
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(x, y, 11, 11);
  ctx.fillStyle = '#2a1c12'; ctx.fillRect(x + 5, y + 12, 1, 1);
  ctx.drawImage(icon, x + 1, y + 1);
  ctx.globalAlpha = 1;
}

function drawWater(ctx, cam) {
  const x0 = Math.max(0, Math.floor(cam.x / 16)), x1 = Math.min(MAP_W - 1, Math.ceil((cam.x + cam.w) / 16));
  const y0 = Math.max(0, Math.floor(cam.y / 16)), y1 = Math.min(MAP_H - 1, Math.ceil((cam.y + cam.h) / 16));
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (World.tiles[ty * MAP_W + tx] !== T.WATER) continue;
    for (let k = 0; k < 2; k++) {
      const hsh = hash2(tx * 3 + k, ty * 7);
      const ph = tReal * (0.6 + hsh) + hsh * 10;
      const a = Math.sin(ph * 1.7);
      if (a < 0.3) continue;
      const px = tx * 16 + ((hsh * 160 + tReal * 5) % 16), py = ty * 16 + ((hsh * 977) % 14);
      ctx.fillStyle = `rgba(220,240,255,${(a - 0.3) * 0.7})`;
      ctx.fillRect(Math.floor(px), Math.floor(py), 3, 1);
    }
  }
  for (const d of World.ducks) {
    if (d.x < cam.x - 20 || d.x > cam.x + cam.w + 20 || d.y < cam.y - 20 || d.y > cam.y + cam.h + 20) continue;
    const img = SPR.duck[Math.floor(tReal * 2 + d.x) % 2];
    const left = Math.cos(d.a) < 0;
    const x = Math.round(d.x) - 4, y = Math.round(d.y) - 5 + Math.round(Math.sin(tReal * 2 + d.x) * 0.6);
    if (left) { ctx.save(); ctx.translate(x + 9, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); } else ctx.drawImage(img, x, y);
  }
}

function drawFlipped(ctx, img, x, y, flip) {
  if (flip) { ctx.save(); ctx.translate(x + img.width, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
  else ctx.drawImage(img, x, y);
}

// Chimney smoke, emitted in real time for the chimneys on screen.
function emitSmoke(dt) {
  const cam = Game.cam;
  const seen = (x, y) => x > cam.x - 40 && x < cam.x + cam.w + 40 && y > cam.y - 20 && y < cam.y + cam.h + 120;
  const puff = (x, y, rate, heavy) => { if (seen(x, y) && Math.random() < dt * rate) FX.chimney(x, y, heavy); };
  for (const h of World.homes) {
    if (!h.built || !h.smoking) continue;
    puff(h.chimney.x, h.chimney.y - 10, 2.2);
    if (h.chimney2) puff(h.chimney2.x, h.chimney2.y - 10, 1.2);
  }
  for (const k in World.buildings) {
    const b = World.buildings[k];
    if (!b.smoking) continue;
    for (const c of b.chimneys) puff(c.x + 2, c.y + 2, k === 'bakery' || k === 'bakery2' || k === 'smokehouse' ? 4 : 2.4, k === 'smokehouse' || k === 'bakery' || k === 'bakery2');
  }
}

function collectLights() {
  const L = [];
  const dk = Game.darkness;
  if (dk <= 0.01) return L;
  for (const h of World.homes) {
    if (!h.built) continue;
    if (h.lit) for (const w of h.windows) L.push({ x: w.x, y: w.y + 3, r: 30, a: 0.9, warm: true });
    if (h.doorAnim > 0 && h.lit) L.push({ x: h.doorX, y: h.doorY, r: 26, a: 0.8, warm: true });
    if (h.v && h.v.lantern) L.push({ x: h.doorX + h.doorR + (h.v.porch ? 7 : 4), y: h.doorY - h.doorR - 1, r: 22, a: 0.85, warm: true });
    if (h.lit && h.roofWin) L.push({ x: h.roofWin.x, y: h.roofWin.y, r: 14, a: 0.6, warm: true });
  }
  const inn = World.inn;
  if (dk > 0.15) {
    for (const wx of [22, 46, 94, 118]) L.push({ x: inn.left + wx, y: inn.bottom - 113 + 101, r: 36, a: 0.9, warm: true });
    L.push({ x: inn.left + 70, y: inn.bottom - 113 + 100, r: 34, a: 0.9, warm: true });
  }
  for (const k in World.buildings) {
    const b = World.buildings[k];
    if (!b.lit || b === inn) continue;
    L.push({ x: b.left + b.w / 2, y: b.bottom - 24, r: 44, a: 0.8, warm: true });
  }
  World.lamps.forEach((l, i) => L.push({ x: l.x, y: l.y + 2, r: 46 * (0.96 + Math.sin(tReal * 7 + i) * 0.04), a: 0.95, warm: true }));
  if (Game.party.on) {
    for (const p of World.partyPoles) L.push({ x: p.x, y: p.y + 8, r: 42, a: 0.85, col: '#ffcf70' });
    L.push({ x: PARTY.danceX * 16 + 8, y: PARTY.danceY * 16, r: 90, a: 0.9, col: '#ffcf70' });
    if (World.season === 'winter') L.push({ x: World.bonfire.x, y: World.bonfire.y - 8, r: 110 * (0.95 + Math.sin(tReal * 9) * 0.05), a: 0.95, col: '#ff9a3a' });
  }
  for (const v of Game.villagers) {
    if (v.inside || !v.task || v.task.phase !== 'do') continue;
    if (v.task.a.prop === 'pipe') L.push({ x: v.x + (v.facing === 'left' ? -4 : 4), y: v.y - 13, r: 10, a: 0.55, col: '#ff8a3a' });
  }
  if (Game.selected && !Game.selected.inside) L.push({ x: Game.selected.x, y: Game.selected.y - 8, r: 26, a: 0.5 });
  FX.lights(L);
  if (!Game.raining && World.season !== 'winter') for (const f of FX.fireflies) if (Math.sin(f.t * 3) > 0.2) L.push({ x: f.x, y: f.y, r: 9, a: 0.5 });
  return L;
}

function render(dtReal) {
  const cam = Game.cam;
  const ctx = vctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1d2a17'; ctx.fillRect(0, 0, cam.w, cam.h);
  const cx = Math.round(cam.x), cy = Math.round(cam.y);
  const cr = { x: cx, y: cy, w: cam.w, h: cam.h };
  ctx.setTransform(1, 0, 0, 1, -cx, -cy);

  const gx = clamp(cx, 0, World.ground.width), gy = clamp(cy, 0, World.ground.height);
  const gw = Math.min(World.ground.width - gx, cam.w), gh = Math.min(World.ground.height - gy, cam.h);
  if (gw > 0 && gh > 0) {
    ctx.drawImage(World.ground, gx, gy, gw, gh, gx, gy, gw, gh);
    if (World.prevGround && World.groundFade > 0) {
      ctx.globalAlpha = World.groundFade; ctx.drawImage(World.prevGround, gx, gy, gw, gh, gx, gy, gw, gh); ctx.globalAlpha = 1;
      World.groundFade -= dtReal * 0.5;
      if (World.groundFade <= 0) World.prevGround = null;
    }
  }
  drawWater(ctx, cr);
  for (const h of World.homes) {
    if (h.doorX < cx - 120 || h.doorX > cx + cam.w + 120 || h.doorY < cy - 40 || h.doorY > cy + cam.h + 120) continue;
    if (h.built) drawDoor(ctx, h);
    else if (Village.projects.some((p) => p.homeId === h.id)) drawSite(ctx, h);
  }
  for (const p of Village.projects) if (p.kind === 'field') drawFieldSite(ctx, World.lots[p.lot], p.prog);

  // y-sorted drawables
  const list = [];
  const inView = (x, y, mx = 100, my = 140) => x > cx - mx && x < cx + cam.w + mx && y > cy - 20 && y < cy + cam.h + my;
  for (const s of World.statics) if (!s.hidden && inView(s.x, s.y)) list.push({ y: s.sortY, s });
  for (const h of World.homes) if (h.built) for (const p of h.plots) if (inView(p.x, p.y)) list.push({ y: p.y, img: SPR.crops[h.cropType][p.stage], x: p.x - 7, iy: p.y - 12 });
  const winter = World.season === 'winter';
  if (!winter) {
    for (const w of World.weed) if (inView(w.x, w.y)) list.push({ y: w.y, img: SPR.crops.leaf[w.stage], x: w.x - 7, iy: w.y - 12 });
    for (const f of World.fields) for (const p of f.plots) if (inView(p.x, p.y)) list.push({ y: p.y, img: SPR.crops.barley[p.stage], x: p.x - 7, iy: p.y - 12 });
    for (const p of World.herbBeds) if (inView(p.x, p.y)) list.push({ y: p.y, img: SPR.crops.herb[p.stage], x: p.x - 7, iy: p.y - 12 });
    for (const m of World.mushrooms) if (m.amount > 0 && inView(m.x, m.y)) list.push({ y: m.y - 2, img: SPR.mush, x: m.x - 6, iy: m.y - 7 });
    for (const m of World.wildHerbs) if (m.amount > 0 && inView(m.x, m.y)) list.push({ y: m.y - 2, img: SPR.herbWild, x: m.x - 7, iy: m.y - 12 });
  }
  for (const it of World.items) if (inView(it.x, it.y)) list.push({ y: it.y, img: SPR.items[it.kind], x: it.x - Math.floor(SPR.items[it.kind].width / 2), iy: it.y - SPR.items[it.kind].height + 2 });
  for (const v of Game.villagers) if (!v.inside && !v.carried && inView(v.x, v.y)) list.push({ y: v.y, v });
  for (const r of World.rabbits) if (inView(r.x, r.y)) list.push({ y: r.y, img: SPR.rabbit[r.moving && Math.floor(r.hop * 2) % 2 ? 1 : 0], x: Math.round(r.x) - 5, iy: Math.round(r.y) - 9, flip: r.face < 0 });
  for (const an of World.animals) if (inView(an.x, an.y)) {
    const spr = SPR[an.kind][an.coat][an.graze > 0 ? (Math.floor(tReal * 1.5 + an.x) % 3 === 0 ? 1 : 0) : Math.floor(tReal * 4 + an.x) % 2];
    list.push({ y: an.y, img: spr, x: Math.round(an.x) - (spr.width >> 1), iy: Math.round(an.y) - spr.height + 2, flip: Math.cos(an.a) < 0 });
  }
  for (const al of World.allotments) for (const p of al.plots) if (inView(p.x, p.y)) list.push({ y: p.y, img: SPR.crops[p.crop][p.stage], x: p.x - 7, iy: p.y - 12 });
  for (const hn of World.hens) if (inView(hn.x, hn.y)) list.push({ y: hn.y, img: SPR.hen[hn.peck > 0 ? Math.floor(tReal * 4) % 2 : 0], x: Math.round(hn.x) - 4, iy: Math.round(hn.y) - 8, flip: Math.cos(hn.a) < 0 });
  for (const c of World.crows) if (c.state === 'peck' && inView(c.x, c.y)) list.push({ y: c.y, img: SPR.crow[1], x: Math.round(c.x) - 3, iy: Math.round(c.y) - 5 });
  for (const mw of World.millWheels) if (inView(mw.x, mw.y)) list.push({ y: mw.y + 12, wheel: mw });
  if (World.windmill && inView(World.windmill.x, World.windmill.sortY)) list.push({ y: World.windmill.sortY + 1, sails: true });
  for (const p of Village.projects) {
    if (p.kind !== 'building' && p.kind !== 'well') continue;
    const lot = World.lots[p.lot];
    const by = lot.kind === 'well' ? (lot.ty + 1) * 16 + 2 : (lot.y1 + 1) * 16 + 1;
    if (inView((lot.kind === 'well' ? lot.tx : lot.x0) * 16, by)) list.push({ y: by, lot, prog: p.prog });
  }
  list.sort((a, b) => a.y - b.y);
  for (const d of list) {
    if (d.v) drawVillager(ctx, d.v);
    else if (d.s) ctx.drawImage(d.s.useAlt && d.s.alt ? d.s.alt : d.s.img, d.s.x - d.s.ox, d.s.y - d.s.oy);
    else if (d.wheel) drawMillWheel(ctx, d.wheel);
    else if (d.sails) drawWindmillSails(ctx);
    else if (d.lot) drawLotSite(ctx, d.lot, d.prog);
    else if (d.flip) drawFlipped(ctx, d.img, d.x, d.iy, true);
    else ctx.drawImage(d.img, d.x, d.iy);
  }
  if (winter) drawBonfire(ctx, tReal, Game.party.on);
  for (const c of World.crows) if (c.state === 'fly') ctx.drawImage(SPR.crow[Math.floor(c.flap * 2) % 2], Math.round(c.x) - 3, Math.round(c.y) - 3);
  drawPartyLanterns(ctx, tReal, Game.party.on);
  FX.drawAmbientDay(ctx, Game, cr);
  FX.drawClouds(ctx, Game);
  FX.draw(ctx);

  // sky
  const sky = skyState(Game.hour);
  Game.darkness = sky.dark;
  if (sky.dusk > 0.01) { ctx.fillStyle = `rgba(255,136,60,${sky.dusk * 0.13})`; ctx.fillRect(cx, cy, cam.w, cam.h); }
  if (Game.raining) { ctx.fillStyle = 'rgba(70,90,110,0.12)'; ctx.fillRect(cx, cy, cam.w, cam.h); }
  if (winter) { ctx.fillStyle = 'rgba(160,190,230,0.06)'; ctx.fillRect(cx, cy, cam.w, cam.h); }
  Light.render(ctx, cr, sky.dark, winter ? '14,22,54' : '12,18,46', collectLights());
  FX.draw(ctx, true);
  FX.drawFireflies(ctx, Game, cr, []);
  FX.drawFog(ctx, Game, cr);
  FX.drawFalling(ctx, Game, cr, dtReal);
  FX.drawRain(ctx, Game, cr, dtReal);
  FX.drawLightning(ctx, Game, cr, dtReal);

  // carried villager floats above everything
  if (Game.carrying) drawVillager(ctx, Game.carrying);
  // world-space UI: thought bubbles, selection arrow
  for (const v of Game.villagers) if (inView(v.x, v.y)) drawThought(ctx, v);
  const sel = Game.selected;
  if (sel && !sel.inside && !sel.carried) {
    const bob = Math.round(Math.sin(tReal * 5) * 1.5);
    const ax = Math.round(sel.x), ay = (sel._top ?? sel.y - 16) - (sel.task && sel.task.a.icon ? 19 : 6) + bob;
    ctx.fillStyle = '#2a1c12'; ctx.fillRect(ax - 3, ay - 1, 7, 1); ctx.fillRect(ax - 3, ay - 1, 1, 2); ctx.fillRect(ax + 3, ay - 1, 1, 2);
    ctx.fillStyle = '#ffe14a'; ctx.fillRect(ax - 2, ay, 5, 1); ctx.fillRect(ax - 1, ay + 1, 3, 1); ctx.fillRect(ax, ay + 2, 1, 1);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const vg = ctx.createRadialGradient(cam.w / 2, cam.h / 2, Math.min(cam.w, cam.h) * 0.45, cam.w / 2, cam.h / 2, Math.max(cam.w, cam.h) * 0.75);
  vg.addColorStop(0, 'rgba(20,12,4,0)'); vg.addColorStop(1, 'rgba(20,12,4,0.28)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, cam.w, cam.h);
}

function wrapText(ctx, text, maxW) {
  const out = [];
  let line = '';
  for (const w of text.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (line && ctx.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

// Crisp text layer: speech bubbles and name tags
function renderOverlay() {
  const z = Game.zoom, cam = Game.cam;
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  octx.clearRect(0, 0, overlay.width, overlay.height);
  octx.textBaseline = 'middle';
  const cx = Math.round(cam.x), cy = Math.round(cam.y);
  const W = overlay.width / dpr, H = overlay.height / dpr;
  for (const v of Game.villagers) {
    if (v.inside || !v.bubble) continue;
    const sx = (v.x - cx) * z, sy = ((v._top ?? v.y - 16) - cy) * z - (Game.selected === v || v.iconT > 0 || v.isSick() ? 14 * z : 4);
    if (sx < -100 || sx > W + 100 || sy < -40 || sy > H + 40) continue;
    const alpha = Math.min(1, v.bubble.t * 2.5);
    octx.globalAlpha = alpha;
    octx.font = '600 14px "Pixelify Sans", ui-monospace, monospace';
    // whole sentences wrap onto a few lines
    if (!v.bubble.lines) v.bubble.lines = wrapText(octx, v.bubble.text, 210);
    const lines = v.bubble.lines;
    const tw = Math.max(...lines.map((l) => octx.measureText(l).width));
    const bw = tw + 16, bh = 8 + lines.length * 17, bx = Math.round(sx - bw / 2), by = Math.round(sy - bh - 8);
    octx.fillStyle = 'rgba(42,28,18,0.35)'; octx.fillRect(bx + 3, by + 3, bw, bh);
    octx.fillStyle = '#2a1c12'; octx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    octx.fillStyle = v.isGrown() ? '#fffaf0' : '#f0f8ff'; octx.fillRect(bx, by, bw, bh);
    octx.fillStyle = '#2a1c12'; octx.beginPath(); octx.moveTo(sx - 6, by + bh + 2); octx.lineTo(sx + 2, by + bh + 2); octx.lineTo(sx - 4, by + bh + 9); octx.fill();
    octx.fillStyle = v.isGrown() ? '#fffaf0' : '#f0f8ff'; octx.beginPath(); octx.moveTo(sx - 4, by + bh - 1); octx.lineTo(sx, by + bh - 1); octx.lineTo(sx - 3.5, by + bh + 4); octx.fill();
    octx.fillStyle = '#2a1c12'; lines.forEach((l, i) => octx.fillText(l, bx + 8, by + 13 + i * 17));
  }
  // the odd baa and moo
  octx.font = '600 12px "Pixelify Sans", ui-monospace, monospace';
  for (const an of World.animals) {
    if (!an.say) continue;
    const sx = (an.x - cx) * z, sy = (an.y - cy - 16) * z;
    if (sx < -60 || sx > W + 60 || sy < -30 || sy > H + 30) continue;
    const tw = octx.measureText(an.say.text).width;
    octx.globalAlpha = Math.min(1, an.say.t * 2);
    octx.fillStyle = 'rgba(255,250,240,0.92)'; octx.fillRect(Math.round(sx - tw / 2 - 5), Math.round(sy - 18), tw + 10, 18);
    octx.fillStyle = '#2a1c12'; octx.fillText(an.say.text, Math.round(sx - tw / 2), Math.round(sy - 8));
  }
  octx.globalAlpha = 1;
  const tags = new Set();
  if (Game.hovered) tags.add(Game.hovered);
  if (Game.selected) tags.add(Game.selected);
  for (const v of tags) {
    if (v.inside) continue;
    const sx = (v.x - cx) * z, sy = (v.y - cy) * z + 10;
    octx.font = '600 13px "Pixelify Sans", ui-monospace, monospace';
    const label = v.first + (v.stage === 'baby' ? ' (baby)' : v.isChild() ? ' (little one)' : v.job ? ' · ' + JOBS[v.job].label : '');
    const tw = octx.measureText(label).width;
    octx.fillStyle = 'rgba(30,20,10,0.75)'; octx.fillRect(Math.round(sx - tw / 2 - 6), Math.round(sy), tw + 12, 20);
    octx.fillStyle = Game.selected === v ? '#ffe680' : '#fff6e0'; octx.fillText(label, Math.round(sx - tw / 2), Math.round(sy + 11));
  }
  if (Game.hoverPlace && !Game.hovered && !Game.carrying) {
    const p = Game.hoverPlace;
    octx.font = '600 13px "Pixelify Sans", ui-monospace, monospace';
    const lines = p.lines;
    const tw = Math.max(...lines.map((l) => octx.measureText(l).width));
    let x = Math.round(p.sx + 14), y = Math.round(p.sy + 14);
    if (x + tw + 14 > W) x = Math.round(p.sx - tw - 24);
    if (y + lines.length * 18 + 8 > H) y = Math.round(p.sy - lines.length * 18 - 14);
    octx.fillStyle = 'rgba(30,20,10,0.85)'; octx.fillRect(x, y, tw + 14, lines.length * 18 + 8);
    lines.forEach((l, i) => { octx.fillStyle = i === 0 ? '#ffe680' : '#fff6e0'; octx.fillText(l, x + 7, y + 13 + i * 18); });
  }
}

// ---------------------------------------------------------------------------
// Camera and input
// ---------------------------------------------------------------------------
const keys = new Set();
const pointer = { down: false, sx: 0, sy: 0, camX: 0, camY: 0, moved: false, x: 0, y: 0, cand: null };

function resize() {
  dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth, H = window.innerHeight;
  Game.cam.w = Math.ceil(W / Game.zoom); Game.cam.h = Math.ceil(H / Game.zoom);
  view.width = Game.cam.w; view.height = Game.cam.h;
  view.style.width = Game.cam.w * Game.zoom + 'px'; view.style.height = Game.cam.h * Game.zoom + 'px';
  overlay.width = Math.round(W * dpr); overlay.height = Math.round(H * dpr);
  overlay.style.width = W + 'px'; overlay.style.height = H + 'px';
  vctx.imageSmoothingEnabled = false;
  clampCam();
}

function clampCam() {
  const c = Game.cam, mw = MAP_W * 16, mh = MAP_H * 16;
  c.x = c.w >= mw ? (mw - c.w) / 2 : clamp(c.x, 0, mw - c.w);
  c.y = c.h >= mh ? (mh - c.h) / 2 : clamp(c.y, 0, mh - c.h);
}

function setZoom(z, anchorX, anchorY) {
  z = clamp(z, 1, 7);
  if (z === Game.zoom) return;
  const ax = anchorX ?? window.innerWidth / 2, ay = anchorY ?? window.innerHeight / 2;
  const wx = Game.cam.x + ax / Game.zoom, wy = Game.cam.y + ay / Game.zoom;
  Game.zoom = z;
  resize();
  Game.cam.x = wx - ax / z; Game.cam.y = wy - ay / z;
  clampCam();
}

function centerOn(x, y) { Game.cam.x = x - Game.cam.w / 2; Game.cam.y = y - Game.cam.h / 2; clampCam(); }
function screenToWorld(sx, sy) { return [Game.cam.x + sx / Game.zoom, Game.cam.y + sy / Game.zoom]; }

function villagerAt(wx, wy) {
  let best = null, bd = 1e9;
  for (const v of Game.villagers) {
    if (v.inside || v.carried) continue;
    const top = v._top ?? v.y - 16;
    if (wx >= v.x - 7 && wx <= v.x + 7 && wy >= top - 2 && wy <= v.y + 3) {
      const d = Math.abs(wy - (v.y - 7)) + Math.abs(wx - v.x);
      if (d < bd) { bd = d; best = v; }
    }
  }
  return best;
}

// Two-finger pinch: zooms in whole steps (keeping the pixels crisp) around the
// point between the fingers, and pans as the fingers move together.
const touches = new Map();
let pinch = null;
function pinchMid() { const [a, b] = [...touches.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }; }
function startPinch() {
  const m = pinchMid();
  pinch = { d0: Math.max(20, m.d), z0: Game.zoom, wx: Game.cam.x + m.x / Game.zoom, wy: Game.cam.y + m.y / Game.zoom };
  pointer.down = false; pointer.cand = null; pointer.pinched = true;
  Game.follow = false; updateFollowBtn();
}
function movePinch() {
  const m = pinchMid();
  const z = clamp(Math.round(pinch.z0 * (m.d / pinch.d0)), 1, 7);
  if (z !== Game.zoom) { Game.zoom = z; resize(); }
  // keep the spot that was under the fingers under them
  Game.cam.x = pinch.wx - m.x / Game.zoom; Game.cam.y = pinch.wy - m.y / Game.zoom;
  clampCam();
}

function setupInput() {
  view.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      view.setPointerCapture(e.pointerId);
      if (touches.size === 2 && !Game.carrying) { startPinch(); return; }
      if (touches.size > 1) return;
      pointer.pinched = false;
    }
    pointer.down = true; pointer.moved = false; pointer.sx = e.clientX; pointer.sy = e.clientY;
    pointer.camX = Game.cam.x; pointer.camY = Game.cam.y;
    const [wx, wy] = screenToWorld(e.clientX, e.clientY);
    pointer.cand = Game.tool === 'hand' ? villagerAt(wx, wy) : null;
    view.setPointerCapture(e.pointerId);
  });
  view.addEventListener('pointermove', (e) => {
    if (touches.has(e.pointerId)) {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch) { if (touches.size >= 2) movePinch(); return; }
      if (pointer.pinched) return;
    }
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
    if (pointer.down) {
      const dx = e.clientX - pointer.sx, dy = e.clientY - pointer.sy;
      if (!pointer.moved && Math.hypot(dx, dy) > 6) {
        pointer.moved = true;
        if (pointer.cand && pointer.cand.stage !== 'baby' && !pointer.cand.leaving) pickUp(pointer.cand);
        else { Game.follow = false; updateFollowBtn(); }
      }
      if (Game.carrying) {
        const [wx, wy] = screenToWorld(e.clientX, e.clientY);
        Game.carrying.x = wx; Game.carrying.y = wy + 8;
      } else if (pointer.moved) { Game.cam.x = pointer.camX - dx / Game.zoom; Game.cam.y = pointer.camY - dy / Game.zoom; clampCam(); }
    }
    updateHover();
  });
  const up = (e) => {
    if (touches.has(e.pointerId)) {
      touches.delete(e.pointerId);
      if (pinch) { if (touches.size < 2) pinch = null; return; }
      if (pointer.pinched) { if (!touches.size) pointer.pinched = false; return; }
    }
    if (Game.carrying) putDown();
    else if (pointer.down && !pointer.moved) handleClick(e.clientX, e.clientY);
    pointer.down = false; pointer.cand = null;
  };
  view.addEventListener('pointerup', up);
  view.addEventListener('pointercancel', (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; if (Game.carrying) putDown(); pointer.down = false; });
  view.addEventListener('pointerleave', () => { if (!pointer.down) { Game.hovered = null; Game.hoverPlace = null; pointer.seen = false; } });
  // mouse wheels click one zoom step at a time; trackpad pinches (ctrl+wheel)
  // send lots of small deltas, so those are added up first
  let wheelAcc = 0;
  view.addEventListener('wheel', (e) => {
    e.preventDefault();
    wheelAcc += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
    const step = e.ctrlKey ? 30 : 60;
    if (Math.abs(wheelAcc) < step && Math.abs(e.deltaY) < 50) return;
    setZoom(Game.zoom + (wheelAcc < 0 ? 1 : -1), e.clientX, e.clientY);
    wheelAcc = 0;
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
    const k = e.key.toLowerCase();
    keys.add(k);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (k >= '1' && k <= String(TOOLS.length)) setTool(TOOLS[+k - 1].id);
    if (k === ' ') setSpeed(Game.speedIdx === 0 ? (Game.prevSpeed || 1) : 0);
    if (k === 'p' && Game.selected) doPat();
    if (k === 't' && Game.selected) doTut();
    if (k === 'e' && Game.selected) doTeach();
    if (k === 'f' && Game.selected) toggleFollow();
    if (k === 'v') toggleVillage();
    if (k === 'escape') { selectVillager(null); closeModals(); }
    if (k === '+' || k === '=') setZoom(Game.zoom + 1);
    if (k === '-' || k === '_') setZoom(Game.zoom - 1);
    if (k === 'tab') { e.preventDefault(); cycleVillager(e.shiftKey ? -1 : 1); }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
  window.addEventListener('resize', resize);
  // stop Safari zooming the whole page when a pinch lands on the panels
  document.addEventListener('gesturestart', (e) => e.preventDefault());
}

// The giant hand of Creatures: pick folk up and set them down elsewhere.
function pickUp(v) {
  v.abort(); v.queue = [];
  v.carried = true; Game.carrying = v;
  v.carryFrom = [v.x, v.y];
  if (v.isGrown()) v.say(R.pick(['Whoa! Put me down!', 'Oi! Where are we going?', 'Goodness me!']), 3);
  else v.say(R.pick(['Wheee! I\'m flying!', 'Higher! Higher!', 'Look at me, I\'m a bird!']), 3);
  selectVillager(v);
}
function putDown() {
  const v = Game.carrying;
  Game.carrying = null;
  if (!v) return;
  v.carried = false;
  let tx = Math.floor(v.x / 16), ty = Math.floor((v.y - 2) / 16);
  const splash = tileAt(tx, ty) === T.WATER;
  const t = nearestWalkable(tx, ty) || [Math.floor(v.carryFrom[0] / 16), Math.floor(v.carryFrom[1] / 16)];
  v.x = t[0] * 16 + 8; v.y = t[1] * 16 + 12;
  v.thinkDelay = 1.5; v.pose = 'stand'; v.facing = 'down';
  if (splash) { FX.splash(v.x, v.y); v.say('Splosh! I\'m soaked!', 3); v.drives.cold = Math.min(1, v.drives.cold + 0.4); v.remember('Was dropped in the river by a giant hand!', -1); }
  else if (v.isGrown()) { v.say(R.pick(['Well! That was undignified.', 'Oof. Thank you, I suppose.', 'Much obliged...']), 3); if (R.chance(0.3)) v.remember('Was carried off by a giant hand.', 0); }
  else { v.say(R.pick(['Again! Do it again!', 'That was the best!', 'More! More!']), 3); v.drives.bored = Math.max(0, v.drives.bored - 0.3); v.drives.lonely = Math.max(0, v.drives.lonely - 0.15); FX.hearts(v.x, v.y - 14); }
  Sound.drop();
}

function updateHover() {
  if (!pointer.seen) return;
  const [wx, wy] = screenToWorld(pointer.x, pointer.y);
  Game.hovered = villagerAt(wx, wy);
  const p = Game.hovered ? null : placeAt(wx, wy);
  Game.hoverPlace = p ? { lines: p, sx: pointer.x, sy: pointer.y } : null;
  view.style.cursor = Game.carrying ? 'grabbing' : Game.tool !== 'hand' ? 'copy' : Game.hovered ? 'pointer' : pointer.down ? 'grabbing' : 'grab';
}

function cycleVillager(dir) {
  const vs = Game.villagers;
  if (!vs.length) return;
  const i = Game.selected ? vs.indexOf(Game.selected) : -1;
  const v = vs[(i + dir + vs.length) % vs.length];
  selectVillager(v); focusVillager(v);
}
function focusVillager(v) {
  if (v.inside) centerOn(v.inside.stepX, v.inside.stepY); else centerOn(v.x, v.y);
}

function handleClick(sx, sy) {
  const [wx, wy] = screenToWorld(sx, sy);
  const tool = Game.tool;
  if (tool === 'hand') {
    const v = villagerAt(wx, wy);
    if (v && v === Game.selected) doPat();
    else selectVillager(v);
    if (v) Sound.click();
    else {
      // shoo rabbits and crows with a click
      for (const r of World.rabbits) if (dist(r.x, r.y, wx, wy) < 14) { r.flee = 40; r.fx = wx; r.fy = wy; FX.puff(r.x, r.y - 4); }
      for (const c of World.crows) if (c.state === 'peck' && dist(c.x, c.y, wx, wy) < 40) { c.state = 'fly'; c.leaving = true; c.tx = c.x + R.f(-300, 300); c.ty = -60; }
    }
    return;
  }
  const tx = Math.floor(wx / 16), ty = Math.floor(wy / 16);
  if (tool === 'firework') {
    fireworkShow(wx, wy, R.i(3, 5));
    if (Math.hypot(tx - PARTY.cx, (ty - PARTY.cy) * 1.4) < 10 && !Game.party.on && !Game.raining) startParty('fireworks');
    return;
  }
  if (tool === 'remedy') {
    const v = villagerAt(wx, wy);
    if (v) { v.cure('a kindly giant'); Sound.pat(); FX.sparkle(v.x, v.y - 10, '#b0ffd0'); if (Game.selected !== v) selectVillager(v); return; }
  }
  if (!walkable(tx, ty) && tileAt(tx, ty) !== T.SOIL) { toast('Pick a clear spot on the ground for that.', 'info'); return; }
  if (tool === 'flowers') {
    if (World.season === 'winter') { toast('Nothing will grow in the frozen ground until spring.', 'info'); return; }
    const seed = R.i(0, 99999);
    plantFlowers(Math.round(wx), Math.round(wy) + 4, seed);
    Game.planted.push({ x: Math.round(wx), y: Math.round(wy) + 4, seed });
    Sound.drop(); FX.sparkle(wx, wy, '#ffe6f0');
    return;
  }
  const uses = { cake: 4, ale: 6, leaf: 3, remedy: 2, book: 6 }[tool];
  World.items.push({ kind: tool, x: Math.round(wx), y: Math.round(wy) + 4, uses, claims: 0 });
  Sound.drop(); FX.sparkle(wx, wy);
  for (const v of Game.villagers) if (!v.inside && dist(v.x, v.y, wx, wy) < 20 * 16 && v.task && ['stroll', 'read', 'potter', 'fish', 'nap', 'play'].includes(v.task.a.id)) v.task.t = Math.min(v.task.t, 1);
}

function plantFlowers(x, y, seed) {
  const g = World.ground.getContext('2d');
  g.drawImage(makeFlowerPatch(seed), x - 9, y - 10);
  World.flowers.push({ x, y, seed });
}

function updateCamera(dt) {
  const sp = 260 * dt / Math.max(1, Game.zoom / 2);
  let mx = 0, my = 0;
  if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
  if (keys.has('d') || keys.has('arrowright')) mx += 1;
  if (keys.has('w') || keys.has('arrowup')) my -= 1;
  if (keys.has('s') || keys.has('arrowdown')) my += 1;
  if (mx || my) { Game.cam.x += mx * sp; Game.cam.y += my * sp; Game.follow = false; updateFollowBtn(); }
  if (Game.follow && Game.selected) {
    const v = Game.selected;
    const px = v.inside ? v.inside.stepX : v.x, py = v.inside ? v.inside.stepY : v.y;
    const tx = px - Game.cam.w / 2, ty = py - Game.cam.h / 2;
    Game.cam.x += (tx - Game.cam.x) * Math.min(1, dt * 4);
    Game.cam.y += (ty - Game.cam.y) * Math.min(1, dt * 4);
  }
  clampCam();
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let last = performance.now(), hudT = 0;
function frame(now) {
  const dtReal = Math.min(0.1, (now - last) / 1000);
  last = now;
  tReal += dtReal;
  try {
    const speed = SPEEDS[Game.speedIdx];
    Game.minPerSec = GAME_MIN_PER_SEC * Math.max(speed, 0.0001);
    if (speed > 0 && Game.started && !Game.introOpen) {
      let dt = dtReal * GAME_MIN_PER_SEC * speed;
      while (dt > 0) { const s = Math.min(dt, 0.5); simulate(s); dt -= s; }
    }
    stepPaint(6);
    const fxDt = speed > 0 ? dtReal : 0;
    emitSmoke(speed > 0 ? dtReal : 0);
    FX.update(fxDt, Game);
    updateCamera(dtReal);
    render(fxDt);
    renderOverlay();
    hudT -= dtReal;
    if (hudT <= 0) { hudT = 0.25; updateHUD(); }
  } catch (e) {
    console.error(e);
  }
  requestAnimationFrame(frame);
}

function boot() {
  view = $('view'); vctx = view.getContext('2d');
  overlay = $('overlay'); octx = overlay.getContext('2d');
  buildIcons();
  buildWorldSprites();
  buildWorld(SEED);
  FX.initAmbient();
  Game.zoom = clamp(Math.round(Math.min(window.innerWidth / 240, window.innerHeight / 280)), 2, 5);
  resize();
  const loaded = load();
  if (!loaded) { World.season = 'spring'; newVillage(); }
  else if (World.homes.some((h) => h.built && h.def.site) || World.lots.some((l) => l.state !== 'planned')) computePixelTypes(World.seed);
  Game.day = Math.floor(Game.time / 1440) + 1;
  Game.hour = (Game.time % 1440) / 60;
  Game.lastHour = Math.floor(Game.time / 60); Game.lastDay = Game.day;
  World.season = seasonKey(Game.day);
  Game.festivalDay = dayOfSeason(Game.day) === 2 ? Game.day : -1;
  seasonTurnIfNeeded();
  applySeasonToStatics(World.season);
  paintGround(World.season);
  Game.darkness = skyState(Game.hour).dark;
  centerOn(PLAZA.cx * 16, (PLAZA.cy - 2) * 16);
  buildUI();
  setupInput();
  renderLog();
  updateSoundBtn();
  openIntro(true);
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  requestAnimationFrame(frame);
}
// A loaded winter village should look wintry straight away.
function seasonTurnIfNeeded() { if (World.season === 'winter') for (const w of World.weed) w.stage = Math.min(w.stage, 0); }

window.addEventListener('DOMContentLoaded', boot);
