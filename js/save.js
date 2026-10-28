'use strict';
// ---------------------------------------------------------------------------
// Saving. Everything in Game that is simply kept between sessions is
// listed in GAME_FIELDS (a feature can add its own with registerField) and
// written and read from that table; the rest, which needs a transform on the
// way (villagers, homes, the lamps, the town), is handled by hand below.
// ---------------------------------------------------------------------------
const SAVE_KEY = 'thistledown-save-v2';

// Each plain field of Game that a save keeps: its key in the save, the
// default when a save lacks it (`or` fills in for any falsy value, `nullish`
// only for null or undefined, `bool` stores !!value), and `load`, a default
// used on loading when it differs from the one used on saving.
const GAME_FIELDS = {
  farewells: { def: [], or: true },
  memorials: { def: [], or: true },
  mathoms: { def: [], or: true },
  mathomSeq: { def: 0, or: true },
  mailbag: { def: [], or: true },
  petSeq: { def: 0, or: true },
  planDone: { def: [], or: true },
  terra: { def: [], or: true },
  playerLots: { def: [], or: true },
  voidLots: { def: [], or: true },
  lotMoves: { def: {}, or: true },
  planSeq: { def: 0, or: true },
  policy: { def: {}, or: true },
  jobPlan: { def: {}, or: true },
  contentLog: { def: [], or: true },
  era: { def: 0, or: true },
  renown: { def: 0, or: true },
  coin: { def: 20, nullish: true },
  charters: { def: [], or: true },
  chartersDone: { def: 0, or: true },
  contentStreak: { def: 0, or: true },
  swapDay: { def: -1, nullish: true },
  mootNote: { def: -1, nullish: true },
  statues: { def: {}, or: true },
  caravan: { def: null, or: true },
  lastTrader: { def: null, or: true },
  masonsUntil: { def: 0, or: true },
  requests: { def: [], or: true },
  reqSeq: { def: 0, or: true },
  riftStory: { def: null, or: true },
  masterpieces: { def: [], or: true },
  lastInspired: { def: -9, nullish: true },
  almanac: { def: null, or: true },
  lastAlmanac: { def: null, or: true },
  hazard: { def: null, or: true },
  hazardSeasonDone: { def: -1, nullish: true },
  tut: { def: { step: 3, saw: {}, off: false }, or: true, load: { step: 2, saw: {}, off: false } },
  objHidden: { def: false, bool: true },
  lore: { def: null, or: true },
  scenesSeen: { def: [], or: true },
  scenarioDone: { def: false, or: true },
  exped: { def: null, or: true },
  innSpecial: { def: null, or: true },
  traditions: { def: [], or: true },
  news: { def: [], or: true },
  newsSeq: { def: 0, or: true },
  talks: { def: [], or: true },
  talkSeq: { def: 0, or: true },
};
// The petitions' fields nest under one key in the save, as they always have.
const PET_FIELDS = {
  factions: { game: 'factions', def: {}, or: true },
  petition: { game: 'petition', def: null, or: true },
  seen: { game: 'petitionsSeen', def: [], or: true },
  last: { game: 'lastPetitionDay', def: 0, or: true },
  highdayDance: { game: 'highdayDance', def: false, bool: true },
  swing: { game: 'swing', def: false, bool: true },
  neonSquare: { game: 'neonSquare', def: false, bool: true },
  breePact: { game: 'breePact', def: false, bool: true },
  quietUntil: { game: 'quietUntil', def: 0, or: true },
  harvestDay: { game: 'harvestDay', def: null, nullish: true },
  schoolUntil: { game: 'schoolUntil', def: null, nullish: true },
  brewContest: { game: 'brewContest', def: null, nullish: true },
};
// A feature file can declare a field of its own to be saved and loaded the
// same way: registerField('mailbag', []). The default is cloned each time.
function registerField(key, def, opts = {}) { GAME_FIELDS[key] = { def, or: !opts.nullish && !opts.bool, ...opts }; }
const cloneDefault = (d) => (d !== null && typeof d === 'object' ? JSON.parse(JSON.stringify(d)) : d);
function fieldValue(f, v) { return f.bool ? !!v : f.nullish ? v ?? cloneDefault(f.def) : v || cloneDefault(f.def); }
function gameFieldsForSave() {
  const out = {};
  for (const k in GAME_FIELDS) out[k] = fieldValue(GAME_FIELDS[k], Game[k]);
  const pet = {};
  for (const k in PET_FIELDS) pet[k] = fieldValue(PET_FIELDS[k], Game[PET_FIELDS[k].game]);
  out.pet = pet;
  return out;
}
function loadGameFields(data) {
  for (const k in GAME_FIELDS) { const f = GAME_FIELDS[k]; Game[k] = fieldValue(f.load !== undefined ? { ...f, def: f.load } : f, data[k]); }
  const P = data.pet || {};
  for (const k in PET_FIELDS) Game[PET_FIELDS[k].game] = fieldValue(PET_FIELDS[k], P[k]);
}

// `force` is for leaving the page; the routine saves hold off for a game hour
// after an error, so a village that has just gone wrong isn't written over the
// last good save.
function save(force = false) {
  if (!force && Game.lastError && Game.time - Game.lastError.at < 60) return;
  try {
    const data = {
      v: 2, world: JSON.parse(JSON.stringify(World.gen, (k, v) => (k[0] === '_' ? undefined : v))),
      ...gameFieldsForSave(),
      pets:(Game.pets || []).map((pt) => ({ ...pt, say: null, tx: null, route: null })), plans: (Game.plans || []).map((pl) => ({ ...pl, workers: 0 })), lamps: World.lamps.map((l) => (l.lit ? 1 : 0)), time: Game.time, nextId: NEXT_ID, weather: Game.weather, rainUntil: Game.rainUntil, party: Game.party,
      villagers: Game.villagers.filter((v) => !v.leaving).map((v) => ({ ...v.serialize(), inside: v.inside ? (v.inside.kind === 'home' ? 'h' + v.inside.id : 'b' + v.inside.key) : null })),
      archive: Game.archive, away: Game.away, census: Game.census, lastTraveller: Game.lastTraveller, stats: Game.stats,
      stores: Village.stores, town: saveTown(), wantHomes: Village.wantHomes,
      homes: World.homes.map((h) => ({ built: h.built, buildProg: h.buildProg, pantry: h.pantry, chilly: h.chilly, neon: !!h.neon, plots: h.plots.map((p) => [p.stage, p.prog]), crafts: h.crafts, collection: h.collection, jars: h.jars || {} })),
      rifts: World.rifts, scars: World.riftScars, riftNext: Game.riftNext, riftsOn: Village.riftsOn, wayHome: Village.wayHome || 0, wayHomeTries: Village.wayHomeTries || 0, riftPower: Village.riftPower || null,
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
  (data.lamps || []).forEach((on, i) => { const l = World.lamps[i]; if (l) { l.lit = !!on; l.litAt = Game.time - 60; l.st.useAlt = l.lit; } });
  Game.weather = data.weather || 'clear'; Game.raining = Game.weather === 'rain' || Game.weather === 'storm'; Game.rainUntil = data.rainUntil || 0;
  Game.party = Object.assign({ on: false, until: 0, planned: null, reason: '' }, data.party || {});
  loadGameFields(data);
  // the two lists saved through a transform
  Game.pets = data.pets || []; Game.plans = data.plans || [];
  placeMemorialStones();
  Game.archive = data.archive || {}; Game.away = data.away || []; Game.stats = data.stats || {}; Game.census = data.census || []; Game.lastTraveller = data.lastTraveller ?? -9;
  Village.reset();
  Object.assign(Village.stores, data.stores || {});
  Village.wantHomes = data.wantHomes || 0;
  restoreFinds(); applyLore(); restoreHazard(); World.wagonStatic = null; showCaravan(!!Game.caravan);
  replayBuilds();
  loadTown(data.town);
  // older saves kept a single building project
  if (data.project && !data.town) Village.projects = [{ kind: 'home', homeId: data.project.homeId, prog: data.project.prog || 0 }];
  Game.day = Math.floor(Game.time / 1440) + 1;
  const season = seasonKey(Game.day);
  (data.homes || []).forEach((h, i) => {
    const home = World.homes[i]; if (!home) return;
    if (h.built && !home.built) { home.built = true; furnishHome(home, mulberry32(home.id * 977 + 5)); addHomeFlowers(home); }
    home.buildProg = h.buildProg || 0;
    home.pantry = Object.assign(emptyPantry(), h.pantry || {}); home.chilly = !!h.chilly; home.neon = !!h.neon;
    home.crafts = h.crafts || {}; home.collection = h.collection || {}; home.jars = h.jars || {};
    (h.plots || []).forEach(([s, p], j) => { if (home.plots[j]) { home.plots[j].stage = s; home.plots[j].prog = p; } });
  });
  Village.projects = Village.projects.filter((p) => p.kind !== 'home' || (World.homes[p.homeId] && !World.homes[p.homeId].built));
  for (const p of Village.projects) if (p.kind === 'home') { const sh = World.homes[p.homeId]; if (sh.siteStatic) sh.siteStatic.hidden = false; }
  (data.weed || []).forEach((s, i) => { if (World.weed[i]) World.weed[i].stage = s; });
  (data.allot || []).forEach((a, i) => a.forEach((s, j) => { if (World.allotments[i] && World.allotments[i].plots[j]) World.allotments[i].plots[j].stage = s; }));
  (data.pens || []).forEach((t, i) => { if (World.pens[i]) World.pens[i].tend = t; });
  Village.woolens = (season === 'autumn' || season === 'winter') && (Village.stores.wool || 0) > 0;
  (data.fields || []).forEach((f, i) => f.forEach((s, j) => { if (World.fields[i] && World.fields[i].plots[j]) World.fields[i].plots[j].stage = s; }));
  (data.herbs || []).forEach((s, i) => { if (World.herbBeds[i]) World.herbBeds[i].stage = s; });
  (data.orchard || []).forEach((n, i) => { if (World.orchard[i]) World.orchard[i].apples = n; });
  (data.hives || []).forEach((n, i) => { if (World.hives[i]) World.hives[i].honey = n; });
  (data.woods || []).forEach((n, i) => { if (World.woodSpots[i]) World.woodSpots[i].stock = n; });
  (data.mush || []).forEach((n, i) => { if (World.mushrooms[i]) World.mushrooms[i].amount = n; });
  World.eggs = data.eggs || 0;
  World.rifts = data.rifts || []; World.riftScars = data.scars || [];
  Game.riftNext = data.riftNext || Game.time + R.f(400, 1200);
  Village.riftsOn = data.riftsOn ?? true;
  Village.wayHome = data.wayHome || 0; Village.wayHomeTries = data.wayHomeTries || 0;
  Village.riftPower = data.riftPower || { water: 0, wind: 0, sun: 0 };
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
    // a baby who was out in someone's arms is back in the cradle
    if (v.stage === 'baby' && !v.inside) v.enterBuilding(v.home());
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
