'use strict';
// ---------------------------------------------------------------------------
// Merryfolk: game state, simulation clock, seasons and weather, rendering,
// camera and input, saving. The interface lives in ui.js.
// ---------------------------------------------------------------------------

const SEED = 1337;
const GAME_MIN_PER_SEC = 3; // at 1x speed: one day takes eight real minutes
const SPEEDS = [0, 1, 2, 4, 8, 16];

/** @type {GameState} */
const Game = {
  time: 8 * 60 + 20, day: 1, hour: 8.33, speedIdx: 1, minPerSec: GAME_MIN_PER_SEC,
  villagers: [], archive: {}, away: [], census: [], stats: {},
  party: { on: false, until: 0, planned: null, reason: '' }, fireworks: { x: 0, y: 0, until: -1 },
  raining: false, weather: 'clear', rainUntil: 0, darkness: 0, tool: 'hand', selected: null, hovered: null, follow: false,
  log: [], planted: [], cam: { x: 0, y: 0, w: 400, h: 240 }, zoom: 3, lastHour: -1, lastDay: 1, started: false, lastTraveler: -9,
  schedulePartyTonight(reason) {
    this.party.planned = reason;
    if (this.hour >= 17 && this.hour < 23 && !this.raining) startParty(reason);
  },
};

let view, vctx, overlay, octx, dpr = 1;
// Where there's WebGL2 the world is drawn on the GPU by Tycho's renderer
// (vendor/tycho/docs/renderer.md): vctx is then its stand-in for the view's
// 2D context, so the drawing code is the same either way, and every picture
// drawn goes up to the GPU once. Without WebGL2, or with ?nogl in the
// address, it's the view canvas's own 2D context as it always was.
let viewGpu = null;
// a canvas drawn before was painted again: the GPU reads it afresh
function gpuDirty(c) { if (viewGpu) viewGpu.dirty(c); }
let tReal = 0;

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
function newVillage() {
  runHooks('newVillage'); // every feature resets its own state first
  Game.villagers = []; Game.archive = {}; Game.away = []; Game.census = [];
  World.rifts = []; World.riftScars = [];
  // the first rift tears open on the second evening
  Game.riftNext = 1440 + 20.5 * 60;
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
  runHooks('afterNewVillage'); // and the features that want the founding families in place
}


// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
// An error caught in play: remembered on Game.lastError (the hourly autosave
// holds off for a game hour, so a broken state isn't written over a good
// save), logged to the dev drawer, and printed once per distinct message.
const errorsSeen = new Set();
function noteError(e, where) {
  const msg = `${where}: ${e && e.message ? e.message : e}`;
  Game.lastError = { msg, at: Game.time, stack: e && e.stack };
  if (typeof devLog === 'function') devLog('error', msg);
  if (!errorsSeen.has(msg)) { errorsSeen.add(msg); console.error(msg, e); }
}

function simulate(dt) {
  Game.time += dt;
  Game.day = Math.floor(Game.time / 1440) + 1;
  Game.hour = (Game.time % 1440) / 60;
  const hourAbs = Math.floor(Game.time / 60);
  if (hourAbs !== Game.lastHour) { if (Game.lastHour >= 0) onHour(Math.floor(Game.hour)); Game.lastHour = hourAbs; }
  if (Game.day !== Game.lastDay) { Game.lastDay = Game.day; dailySociety(); checkSeason(true); save(); }

  updateWorld(dt, Game.raining, World.season, Game.hour);
  updateRifts(dt);
  riftPowerTick(dt);
  // one villager's trouble is noted and their task dropped, rather than the whole step failing every frame
  for (const v of Game.villagers) {
    try { v.update(dt, Game.hour); }
    catch (e) { noteError(e, `${v.first}'s update`); try { v.abort(); } catch (e2) { /* nothing more to be done for them this step */ } }
  }
  const gone = Game.villagers.filter((v) => v.gone);
  if (gone.length) {
    Game.villagers = Game.villagers.filter((v) => !v.gone);
    for (const v of gone) {
      if (Game.selected === v) selectVillager(null);
      const forGood = v.leaving === 'final' || v.leaving === 'home';
      for (const o of Game.villagers) { if (o.spouse === v.id && forGood) { o.spouse = null; o.sweetheart = null; } if (o.sweetheart === v.id && forGood) o.sweetheart = null; }
    }
  }

  // homes and workshops: lights and chimney smoke
  const byId = new Map(Game.villagers.map((v) => [v.id, v]));
  for (const h of World.homes) {
    if (!h.built) continue;
    const awake = h.inside.some((id) => { const v = byId.get(id); return v && !(v.task && v.task.a.id === 'sleep'); });
    h.lit = (awake || (h.inside.length && Game.hour > 17 && Game.hour < 22.5)) && Game.darkness > 0.08;
    const cooking = h.inside.length > 0 || isMealTime(Game.hour) || (World.season === 'winter' && !h.chilly && residentsOf(h).length);
    // a lived-in hole nearly always has something on the stove
    h.smoking = cooking || (residentsOf(h).length > 0 && (World.season !== 'summer' || Game.hour < 9 || Game.hour > 18));
  }
  for (const k in World.buildings) {
    const b = World.buildings[k];
    b.lit = Game.darkness > 0.15 && (b.inside.length > 0 || (b.isInn && Game.hour > 16));
    if (b.static) b.static.useAlt = b.lit;
    const busy = b.inside.length > 0 || b.isInn;
    if (b.static && b.neon) b.static.useAlt = Game.darkness > 0.15;
    b.smoking = busy || ['bakery', 'bakery2', 'smokehouse', 'brewhouse', 'herbalist', 'workshop'].includes(k) && Game.hour > 5 && Game.hour < 20;
  }
  if (Game.party.on && Game.time > Game.party.until) {
    Game.party.on = false;
    const k = partyKind();
    if (Game.party.reason && !k.quiet) chronicle(k.lunch ? 'The long tables are cleared away from the party field. What a lunch!' : 'The last lanterns are blown out in the party field. What a night!', 'info');
    Game.party.feast = null; Game.party.host = null; Game.party.given = null;
    takeDownTables();
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
    // whatever else was planned for tonight is toasted at the festival
    if (Game.party.planned && Game.party.planned !== key) alsoToast(Game.party.planned);
    Game.party.planned = key;
    if (announce) chronicle(note, 'party');
  }
}

function onHour(h) {
  runHooks('beforeHour', h);
  const season = World.season;
  // weather, by season
  const w = Game.weather;
  const logWeather = () => { if (Game.weather !== w) devLog('weather', `${w} → ${Game.weather}${Game.raining ? ` until ${fmtTime(Game.rainUntil)}` : ''}`); };
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
      if (Game.rainNoteDay !== Game.day && (Game.weather !== 'rain' || R.chance(0.4))) {
        Game.rainNoteDay = Game.day;
        chronicle({ rain: 'It\'s coming on to rain. Good for the gardens, at least.', storm: 'Thunder rumbles over the hills. Everyone\'s dashing for cover!', snow: 'Snow is falling softly on Thistledown.' }[Game.weather], 'info');
      }
    } else if (r < 0.5) Game.weather = 'clear';
  } else {
    if (season === 'autumn' && h === 5 && Math.random() < 0.4) Game.weather = 'fog';
    else if (Math.random() < 0.09) Game.weather = 'cloudy';
  }
  logWeather();
  // evening hearths, parties and fireworks
  if (h === 19) lightHearths();
  // the parties themselves, what they're for and their fireworks, are in occasions.js
  // every feature's hourly turn, in the order the files were loaded, then the save
  runHooks('onHour', h);
  save();
}

// Every party has a reason (PARTY_KINDS, occasions.js), which says what it's
// like: when it ends, whether there's a dinner at the long tables first, and
// what the Chronicle says.
function startParty(reason) {
  if (Game.party.on) { Game.party.until = Math.max(Game.party.until, Game.time + 180); return; }
  const k = partyKind(reason);
  const dayStart = Math.floor(Game.time / 1440) * 1440;
  Game.party.on = true;
  Game.party.until = k.until ? Math.max(Game.time + 90, dayStart + k.until * 60) : Math.max(Game.time + 150, dayStart + 23.75 * 60);
  Game.party.reason = reason;
  Game.party.planned = null;
  Game.party.given = [];
  Game.party.feast = k.feast ? { start: Game.time, course: -1 } : null;
  Game.lastParty = Game.day;
  if (k.start) k.start(reason);
  const note = typeof k.note === 'function' ? k.note(reason) : k.note;
  if (note) chronicle(note, 'party');
  if (k.feast) feastBegin();
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

// What a villager has in hand for what they're doing (an elder's stick aside).
function propFor(v) {
  const task = v.task;
  let prop = null;
  if (task && task.phase === 'do') prop = task.target.prop || (task.spot && task.spot.kind === 'partyseat' ? (task.spot.prop || 'mug') : task.a.prop);
  if (task && task.phase === 'go' && (task.target.carry || task.a.id === 'deliver')) prop = 'sack';
  if (task && task.phase === 'go' && task.a.id === 'gift') prop = 'flowers';
  if (task && task.phase === 'go' && task.a.id === 'work_mail') prop = 'letter';
  return prop;
}

// After dark nobody goes out without a lantern. It swings in their hand while
// they walk or stand about, and is set down beside them while they sit, work
// or have their hands full. Dancers leave theirs on the tables.
function lanternFor(v, prop = propFor(v)) {
  if (Game.darkness < 0.35 || v.inside || v.carried || v.heldBy || v.stage === 'baby' || v.pose === 'inside' || v.pose === 'dance') return null;
  const free = !prop || prop === 'stick';
  if (v.pose === 'walk') return free ? 'hand' : null;
  return v.pose === 'stand' && free ? 'hand' : 'ground';
}
// Where its light comes from, in world pixels.
function lanternLight(v, where) {
  const side = facingLeft(v.facing) ? -1 : 1;
  return where === 'hand' ? { x: v.x + side * 3, y: v.y - 5 } : { x: v.x + side * 8, y: v.y - 2 };
}
// A little oil lantern, drawn in half-pixels from the ring at its top.
function drawLantern(ctx, x, y, t, id, rift = false) {
  const P = (dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x + dx / RS, y + dy / RS, w / RS, h / RS); };
  const flick = Math.sin(t * 9 + id * 1.7) > 0.6;
  P(0, 0, 1, 2, '#3a2a1a');
  P(-2, 2, 5, 1, '#2a1c12'); P(-1, 1, 3, 1, '#2a1c12');
  P(-2, 3, 5, 6, '#2a1c12');
  // rift-folk carry a violet rift-glass lantern
  P(-1, 3, 3, 5, rift ? (flick ? '#a060ff' : '#b878ff') : flick ? '#ffc850' : '#ffd860'); P(0, 4, 1, 3, rift ? '#e8d0ff' : '#fff6c8');
  P(-2, 9, 5, 1, '#2a1c12');
}

function drawVillager(ctx, v, ox = 0, oy = 0) {
  const t = tReal;
  let [dir, flip] = facingView(v.facing);
  let pose = 'stand', yoff = 0, xoff = 0;
  switch (v.pose) {
    case 'walk': {
      // a four-step cycle: stride, pass (rising a half-pixel), stride, pass
      const ph = Math.floor(v.walkDist / 3.2) % 4;
      pose = ph === 0 ? 'walk1' : ph === 2 ? 'walk2' : 'stand';
      if (ph % 2) yoff = -0.5;
      if (v.stage === 'baby') yoff = Math.floor(v.walkDist / 3) % 2 ? -1 : 0;
      break;
    }
    case 'sit': pose = 'sit'; break;
    case 'work': pose = Math.floor(t * 2.2 + v.id) % 2 ? 'stand' : 'work'; break;
    // a scuffle: hopping and jostling, a lunge for a blow struck, a stagger for one taken (scuffle.js)
    case 'tussle': { const L = Scuffle.look(v, t); pose = L.pose; xoff = L.xoff; yoff = L.yoff; break; }
    // caught by a tripwire or a snare: down on the ground a moment (mischief.js)
    case 'stumble': pose = 'sit'; break;
    case 'dance': {
      pose = ['walk1', 'reach', 'walk2', 'reach'][Math.floor(t * 6 + v.id) % 4];
      yoff = -Math.round(Math.abs(Math.sin(t * 6 + v.id)) * 3);
      const f = ['down', 'right', 'up', 'left'][Math.floor(t * 1.1 + v.id * 0.7) % 4];
      dir = f === 'left' || f === 'right' ? 'side' : f; flip = f === 'left';
      break;
    }
  }
  if (v.carried) { pose = Math.floor(t * 8) % 2 ? 'walk1' : 'walk2'; dir = 'down'; flip = false; yoff = Math.round(Math.sin(t * 5) * 1.5); }
  if (v.isTipsy() && v.pose === 'walk') xoff = Math.round(Math.sin(t * 3 + v.id) * 1.5);
  const upish = dir === 'up', sideish = dir === 'side';
  // eyes shut for a blink every few seconds, or while dozing
  const dozing = v.task && v.task.phase === 'do' && v.task.a.zzz;
  const shut = !upish && (dozing || (tReal + v.id * 0.37) % 4.1 < 0.13);
  const task = v.task;
  const spotKind = task && task.spot ? task.spot.kind : null;
  const groundSit = pose === 'sit' && (!spotKind || spotKind === 'fish' || spotKind === 'shade' || spotKind === 'storyseat' || spotKind === 'story');
  // on the ground they sit cross-legged, or with their legs out, rather than as if on a chair
  const spr = (shut ? shutSprites(v) : v.sprites)[dir][groundSit ? 'sitg' : pose];
  // sprites are drawn finer than the world: their world size is a fraction of their canvas size
  const w = spr.width / (spr.res || RS), h = spr.height / (spr.res || RS);
  const vx = v.x + ox + xoff, vy = v.y + oy;
  const bottom = pose === 'sit' && !groundSit ? vy - 2 : vy;
  const half = (n) => Math.round(n * RS) / RS;
  const sx = half(vx - w / 2), sy = half(bottom - h + 1 + yoff);

  if (!v.carried) {
    ctx.fillStyle = 'rgba(20,30,10,0.25)'; ctx.fillRect(Math.round(vx) - 4, Math.round(vy) - 1, 9, 2); ctx.fillRect(Math.round(vx) - 3, Math.round(vy), 7, 1);
  } else {
    ctx.fillStyle = 'rgba(20,30,10,0.2)'; ctx.fillRect(Math.round(vx) - 3, Math.round(vy) + 14, 7, 2);
  }
  if (Game.selected === v) {
    ctx.fillStyle = '#ffe680';
    ctx.fillRect(Math.round(vx) - 6, Math.round(vy) + 1, 13, 0.5); ctx.fillRect(Math.round(vx) - 6.5, Math.round(vy) + 0.5, 0.5, 0.5); ctx.fillRect(Math.round(vx) + 7, Math.round(vy) + 0.5, 0.5, 0.5);
  }
  if (pose === 'sit' && (spotKind === 'inn' || spotKind === 'partyseat')) {
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(Math.round(vx) - 4, Math.round(vy) - 6, 9, 2);
    ctx.fillStyle = '#7a5030'; ctx.fillRect(Math.round(vx) - 4, Math.round(vy) - 6, 9, 0.5);
    ctx.fillStyle = '#3a2414'; ctx.fillRect(Math.round(vx) - 3, Math.round(vy) - 4, 1, 4); ctx.fillRect(Math.round(vx) + 3, Math.round(vy) - 4, 1, 4);
  }

  let prop = propFor(v);
  const lantern = lanternFor(v, prop);
  if (lantern === 'hand') prop = 'lantern';
  if (!prop && v.stage === 'elder' && !upish && pose !== 'sit') prop = 'stick';
  if (v.leaving && lantern !== 'hand') prop = 'stick';
  if (v.stage === 'baby' || v.carried) prop = null;
  // Props are drawn in half-pixels over the sprite, mirrored with it.
  const SW = spr.width / ((spr.res || RS) / RS), SH = spr.height / ((spr.res || RS) / RS);
  const Q = (rx, ry, pw, ph, col) => {
    ctx.fillStyle = col;
    const x = flip ? SW - rx - pw : rx;
    ctx.fillRect(sx + x / RS, sy + ry / RS, pw / RS, ph / RS);
  };
  const an = spr.anchors || { mouth: [10.5, 11], handR: [16, 22], chest: [9.5, 18] };
  const M = [Math.round(an.mouth[0]) + 1, an.mouth[1] + 1], HR = [Math.round(an.handR[0]) + 1, an.handR[1] + 1];
  const drawProp = () => {
    if (!prop) return;
    const lift = Math.sin(t * 1.3 + v.id) > 0.75;
    const swing = Math.floor(t * 2.2 + v.id) % 2;
    const W0 = PROP_COL.wood, side = sideish;
    switch (prop) {
      case 'pipe': {
        if (upish) break;
        const [mx, my] = M;
        Q(mx + 1, my, 2, 1, W0); Q(mx + 3, my + 1, 2, 1, W0);
        Q(mx + 4, my - 2, 4, 4, '#4a2a14'); Q(mx + 4, my - 2, 4, 1, '#6a4020');
        if (Math.sin(t * 3 + v.id) > 0) { Q(mx + 5, my - 3, 2, 1, PROP_COL.ember); Q(mx + 6, my - 4, 1, 1, '#ffd060'); }
        break;
      }
      case 'mug': {
        const [x, y] = lift && !upish ? [M[0] + 1, M[1] - 3] : [HR[0] - 3, HR[1] - 5];
        Q(x, y, 6, 7, PROP_COL.mug); Q(x, y, 6, 2, PROP_COL.foam); Q(x + 1, y + 3, 1, 3, '#e0c08a');
        Q(x + 6, y + 2, 2, 1, PROP_COL.mug); Q(x + 7, y + 3, 1, 2, PROP_COL.mug); Q(x + 6, y + 5, 2, 1, PROP_COL.mug);
        Q(x, y + 6, 6, 1, '#9a7a4a');
        break;
      }
      case 'cup': if (!upish) { const [x, y] = lift ? [M[0] + 1, M[1] - 1] : [HR[0] - 2, HR[1] - 3]; Q(x, y, 5, 4, '#9a9488'); Q(x + 1, y, 3, 1, '#7a5030'); Q(x + 5, y + 1, 1, 2, '#9a9488'); } break;
      case 'plate':
        if (dir === 'down') { Q(4, HR[1] + 1, 14, 2, PROP_COL.plate); Q(4, HR[1] + 2, 14, 1, '#c8c0b0'); Q(6, HR[1], 4, 1, '#c8945a'); Q(11, HR[1], 4, 1, '#7cc05a'); if (lift) Q(M[0] + 1, M[1] + 1, 2, 2, '#c8945a'); }
        else if (side) { Q(HR[0] + 1, HR[1] - 1, 9, 2, PROP_COL.plate); Q(HR[0] + 3, HR[1] - 2, 4, 1, '#c8945a'); }
        break;
      case 'book':
        if (dir === 'down') { Q(5, HR[1] - 7, 12, 8, '#8b2e2e'); Q(6, HR[1] - 7, 10, 6, '#f4f0e8'); Q(10, HR[1] - 7, 2, 7, '#8b2e2e'); Q(7, HR[1] - 5, 3, 1, '#9a9080'); Q(12, HR[1] - 5, 3, 1, '#9a9080'); Q(7, HR[1] - 3, 2, 1, '#9a9080'); }
        else if (side) { Q(HR[0] + 1, HR[1] - 7, 5, 8, '#8b2e2e'); Q(HR[0] + 2, HR[1] - 7, 3, 1, '#f4f0e8'); }
        break;
      case 'hoe': {
        const bob = pose === 'stand' ? 0 : 3, x = HR[0] + 1;
        Q(x, 4 + bob, 2, SH - 10, '#7a5a3a'); Q(x, 4 + bob, 1, SH - 10, '#9a7a52');
        Q(x - 2, SH - 7 + bob, 7, 3, '#9a9a9a'); Q(x - 2, SH - 7 + bob, 7, 1, '#c8c8d0');
        break;
      }
      case 'spade': {
        const bob = swing ? 0 : 4, x = HR[0] + 1;
        Q(x - 2, 2 + bob, 6, 2, '#5a3a22'); Q(x, 3 + bob, 2, SH - 14, '#7a5a3a');
        Q(x - 2, SH - 11 + bob, 6, 7, '#8a8a92'); Q(x - 2, SH - 11 + bob, 6, 1, '#b8b8c0'); Q(x - 1, SH - 4 + bob, 4, 1, '#8a8a92');
        break;
      }
      case 'axe': {
        const x = HR[0] + 1;
        if (swing) { Q(x, 0, 2, HR[1] + 4, '#7a5a3a'); Q(x + 2, 0, 5, 6, '#a8a8b0'); Q(x + 6, 1, 1, 4, '#d8d8e0'); }
        else { Q(x - 2, HR[1] - 4, 10, 2, '#7a5a3a'); Q(x + 6, HR[1] - 9, 4, 7, '#a8a8b0'); Q(x + 9, HR[1] - 8, 1, 5, '#d8d8e0'); }
        break;
      }
      case 'fiddle': {
        const [mx, my] = M;
        Q(mx - 2, my + 3, 8, 6, '#a0522d'); Q(mx - 1, my + 4, 6, 1, '#c8723d'); Q(mx, my + 6, 1, 2, '#3a1a0a'); Q(mx + 3, my + 6, 1, 2, '#3a1a0a');
        Q(mx + 6, my + 1, 7, 2, '#3a2414'); Q(mx + 12, my, 2, 2, '#5a3a22');
        const bow = Math.round(Math.sin(t * 8) * 3);
        Q(1 + bow, my + 8, 14, 1, '#e8dcc0'); Q(bow, my + 7, 2, 3, '#5a3a22');
        break;
      }
      case 'letter': if (!upish) { Q(HR[0] - 1, HR[1] - 4, 8, 6, '#f4efe2'); Q(HR[0] - 1, HR[1] - 4, 8, 1, '#d8d0bc'); Q(HR[0] + 2, HR[1] - 2, 2, 2, '#d83a2a'); } break;
      case 'flowers': if (!upish) {
        const [x, y] = [HR[0], HR[1]];
        Q(x + 1, y - 7, 1, 8, '#3f7a32'); Q(x + 3, y - 6, 1, 7, '#3f7a32'); Q(x - 1, y - 5, 1, 6, '#3f7a32');
        Q(x, y - 9, 2, 2, '#e85a6a'); Q(x + 2, y - 10, 2, 2, '#f2d24a'); Q(x - 2, y - 7, 2, 2, '#ffffff'); Q(x + 3, y - 8, 2, 2, '#8a6ad8');
        Q(x - 1, y - 1, 6, 2, '#e8dcc0');
        break;
      }
      case 'sack': { const x = upish ? 4 : 12; Q(x, HR[1] - 13, 10, 12, '#e8dcc0'); Q(x + 7, HR[1] - 12, 3, 11, '#c8bca0'); Q(x + 3, HR[1] - 15, 4, 2, '#a08a60'); Q(x + 4, HR[1] - 13, 2, 1, '#7a6a48'); break; }
      case 'bucket': if (!upish) { const [x, y] = [HR[0] - 2, HR[1] - 1]; Q(x, y, 6, 5, '#7a7a84'); Q(x, y, 6, 1, '#a0a0aa'); Q(x + 1, y + 1, 4, 3, '#4a6a8a'); Q(x + 1, y - 2, 1, 2, '#5a5a62'); Q(x + 4, y - 2, 1, 2, '#5a5a62'); Q(x + 1, y - 3, 4, 1, '#5a5a62'); } break;
      case 'broom': { const x = HR[0] + 1; Q(x, 2, 2, SH - 8, '#9a7a52'); Q(x, 2, 1, SH - 8, '#b89a66'); Q(x - 3, SH - 8, 8, 2, '#c8a858'); Q(x - 4, SH - 6, 10, 4, '#d8b860'); Q(x - 4, SH - 3, 10, 1, '#a8883a'); break; }
      case 'brush': if (!upish) { const [x, y] = [HR[0] - 1, HR[1] - 2]; Q(x, y, 6, 2, '#6a4a2a'); Q(x, y + 2, 6, 2, '#d8c8a0'); } break;
      case 'basket': if (!upish) { const [x, y] = [HR[0] - 3, HR[1] - 2]; Q(x, y, 9, 6, '#8a6440'); Q(x, y + 2, 9, 1, '#6a4a2a'); Q(x + 1, y - 4, 1, 4, '#6a4a2a'); Q(x + 7, y - 4, 1, 4, '#6a4a2a'); Q(x + 2, y - 5, 5, 1, '#6a4a2a'); Q(x + 1, y - 1, 2, 2, '#d83a2a'); Q(x + 4, y - 1, 2, 2, '#c8925a'); Q(x + 6, y - 1, 2, 2, '#7cc05a'); } break;
      case 'rod': {
        const bob = Math.round(Math.sin(t * 2 + v.id) * 2), [x, y] = HR;
        for (let k = 0; k < 11; k++) Q(x + 1 + k, y - 1 + Math.round(k * 0.6), 2, 1, k > 7 ? '#8a6a4a' : '#6a4a2a');
        ctx.fillStyle = 'rgba(230,230,230,0.7)';
        const lx = sx + (flip ? SW - x - 12 : x + 11) / RS;
        ctx.fillRect(lx, sy + (y + 6) / RS, 0.5, (14 + bob) / RS);
        ctx.fillStyle = '#e83a2a'; ctx.fillRect(lx - 0.5, sy + (y + 20 + bob) / RS, 1, 0.5); ctx.fillStyle = '#ffffff'; ctx.fillRect(lx - 0.5, sy + (y + 21 + bob) / RS, 1, 0.5);
        break;
      }
      case 'stick': { const x = HR[0] + 1; Q(x, HR[1] - 8, 2, SH - HR[1] + 7, '#7a5a3a'); Q(x, HR[1] - 8, 1, SH - HR[1] + 7, '#9a7a52'); Q(x - 1, HR[1] - 10, 4, 3, '#5a3a22'); break; }
      case 'whittle': if (!upish) { const [x, y] = HR; Q(x - 4, y - 4, 5, 3, '#c9a46a'); Q(x - 4, y - 4, 5, 1, '#e0c08a'); Q(x + 1, y - 6, 1, 4, '#c8c8d0'); Q(x + 1, y - 2, 1, 2, '#5a3a22'); if (Math.sin(t * 5 + v.id) > 0.6) Q(x - 6, y + 2, 1, 1, '#e0c08a'); } break;
      case 'knit': if (!upish) {
        const yarn = ['#c84a6a', '#5a8ac8', '#7ab04c', '#e8b84a'][v.id % 4], [x, y] = HR;
        Q(x - 12, y - 4, 11, 4, yarn); Q(x - 12, y - 4, 11, 1, shade(yarn, 0.25)); Q(x - 13, y - 8, 1, 7, '#d8d8e0'); Q(x, y - 8, 1, 7, '#d8d8e0');
        Q(x - 8, y + 6, 4, 4, yarn);
        break;
      }
      case 'easel': {
        // the easel set up in front of them, and a brush in hand
        const ex = SW + 1;
        Q(ex + 1, SH - 26, 1, 26, '#7a5030'); Q(ex + 11, SH - 26, 1, 26, '#7a5030'); Q(ex + 6, SH - 30, 1, 30, '#5a3a22');
        Q(ex, SH - 30, 13, 10, '#f4ead0'); Q(ex, SH - 30, 13, 1, '#7a5030'); Q(ex + 1, SH - 29, 11, 4, '#9fd4f2'); Q(ex + 1, SH - 25, 11, 3, '#5c8f3e');
        if (Math.sin(t * 2 + v.id) > 0) Q(ex + 4, SH - 26, 2, 1, '#c84a3a');
        Q(ex, SH - 20, 13, 2, '#8a6440');
        if (!upish) { const [x, y] = HR; Q(x, y - 6, 1, 6, '#7a5030'); Q(x, y - 7, 1, 1, '#c84a3a'); }
        break;
      }
      case 'lantern': {
        const ph = Math.floor(v.walkDist / 3.2) % 4, sw = v.pose !== 'walk' ? 0 : ph === 0 ? -1 : ph === 2 ? 1 : 0;
        drawLantern(ctx, sx + (flip ? SW - HR[0] - 1 - sw : HR[0] + sw) / RS, sy + HR[1] / RS, t, v.id, v.tech >= 0.5);
        break;
      }
      case 'gadget': { const [x, y] = [HR[0] - 3, HR[1] - 4]; Q(x, y, 7, 5, '#2a2a32'); Q(x + 1, y + 1, 5, 2, Math.sin(t * 4 + v.id) > -0.3 ? expressed(v.genes).neon : '#1a4a50'); Q(x + 2, y + 4, 3, 1, '#4a4a52'); break; }
    }
  };
  if (lantern === 'ground') drawLantern(ctx, Math.round(vx) + (facingLeft(v.facing) ? -8 : 8), Math.round(vy) - 4.5, t, v.id, v.tech >= 0.5);
  if (upish) drawProp();
  blit(ctx, spr, sx, sy, flip);
  if (!upish) drawProp();
  // a baby in their arms, swaddled, across the chest
  if (v.holding && v.holding.length && !upish) {
    v.holding.forEach((id, k) => {
      const b = personById(id), bs = b && b.sprites.held;
      if (!bs) return;
      const [cx0, cy0] = an.chest || [9.5, 18];
      const bw = bs.width / ((bs.res || RS) / RS);
      const bx = Math.round(cx0) + 1 - (bw >> 1) + (sideish ? 2 : k * 5 - (v.holding.length - 1) * 2), by = cy0 - 2 - k * 3;
      blit(ctx, bs, sx + (flip ? SW - bx - bw : bx) / RS, sy + by / RS, flip);
      b._top = sy; b._sx = sx;
    });
  }
  if (v.leaving) { Q(sideish ? 3 : 1, 15, 6, 9, '#6a4a2a'); Q(sideish ? 3 : 1, 15, 6, 2, '#8a6a42'); Q(sideish ? 4 : 2, 19, 4, 1, '#4a2e1a'); }
  // a red scarf in winter
  if (World.season === 'winter' && v.isGrown() && !v.inside && !upish && v.stage !== 'baby') {
    const sc = v.genes.vest === '#8b2e2e' ? '#2f6f8f' : '#a23b2a';
    if (dir === 'down') { Q(6, 15, 10, 2, sc); Q(12, 17, 2, 4, sc); Q(6, 15, 10, 1, shade(sc, 0.2)); }
    else { Q(9, 15, 6, 2, sc); Q(9, 17, 2, 4, sc); }
  }
  v._top = sy; v._h = h; v._sx = sx; v._flip = flip;
}

function drawThought(ctx, v) {
  if (v.inside || v.carried || v.heldBy) return;
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
      // glints on the water: a short pale dash, white in the middle
      ctx.fillStyle = a > 0.85 ? '#e8f6ff' : '#9cd2ec';
      ctx.fillRect(Math.floor(px), Math.floor(py), a > 0.85 ? 3 : 2, 1);
    }
  }
  for (const d of World.ducks) {
    if (d.x < cam.x - 20 || d.x > cam.x + cam.w + 20 || d.y < cam.y - 20 || d.y > cam.y + cam.h + 20) continue;
    const img = SPR.duck[Math.floor(tReal * 2 + d.x) % 2];
    const left = Math.cos(d.a) < 0;
    const x = Math.round(d.x) - 4, y = Math.round(d.y) - 5 + Math.round(Math.sin(tReal * 2 + d.x) * 0.6);
    blit(ctx, img, x, y, left);
  }
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

// How a flame is burning this instant, 0.7–1.1: a slow waver and a quick one,
// settled by a random throw a few times a second, and a brief gutter now and then.
function flicker(i) {
  const h = hash2(Math.floor(tReal * 6) + i * 31, i * 7 + 3), h2 = hash2(Math.floor(tReal * 1.5) + i * 17, i);
  const slow = Math.sin(tReal * 1.3 + i) * 0.03, quick = Math.sin(tReal * 11 + i * 2.1) * 0.02 * h;
  return 0.92 + slow + quick + (h - 0.5) * 0.08 - (h2 < 0.06 ? 0.15 : 0);
}

function collectLights() {
  const L = [];
  const dk = Game.darkness;
  if (dk <= 0.01) return L;
  for (const h of World.homes) {
    if (!h.built) continue;
    if (h.lit) for (const w of h.windows) L.push(h.neon ? { x: w.x, y: w.y + 3, r: 30, a: 0.85, col: '#7af0ff' } : { x: w.x, y: w.y + 3, r: 30, a: 0.9, warm: true });
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
    if (b.neon && dk > 0.15) { L.push({ x: b.left + b.w / 2, y: b.bottom - 20, r: 40, a: 0.7, col: k === 'glowworm' ? '#b45aff' : '#3af0ff' }); continue; }
    if (!b.lit || b === inn) continue;
    L.push({ x: b.left + b.w / 2, y: b.bottom - 24, r: 44, a: 0.8, warm: true });
  }
  riftLights(L);
  for (const o of Visitors) if (!o.hidden && o.lights) o.lights(L);
  // only the lamps the lamplighter has lit, brightening as the wick takes
  // a flame flickers at random: the pool keeps its size, and the glow in it wavers a little, with the odd gutter
  World.lamps.forEach((l, i) => { if (l.lit) L.push({ x: l.x, y: l.y + 6, r: 80 * Math.min(1, 0.4 + (Game.time - l.litAt) / 8), a: 0.97 * Math.min(1, 0.3 + (Game.time - l.litAt) / 6), warm: true, glow: 1.8 * flicker(i) }); });
  if (Game.party.on) {
    for (const p of World.partyPoles) L.push({ x: p.x, y: p.y + 8, r: 42, a: 0.85, col: '#ffcf70' });
    L.push({ x: PARTY.danceX * 16 + 8, y: PARTY.danceY * 16, r: 90, a: 0.9, col: '#ffcf70' });
    if (World.season === 'winter' || partyKind().bonfire) L.push({ x: World.bonfire.x, y: World.bonfire.y - 8, r: 110, a: 0.95, col: '#ff9a3a', glow: 1.2 * flicker(99) });
  }
  for (const v of Game.villagers) {
    const lan = lanternFor(v);
    if (lan) { const p = lanternLight(v, lan), rift = v.tech >= 0.5; L.push({ x: p.x, y: p.y, r: 32, a: 0.85 * (0.9 + 0.1 * flicker(v.id + 7)), warm: !rift, col: rift ? '#b070ff' : undefined, glow: rift ? 2 : 1, tint: rift ? 0.5 : 0 }); }
    if (v.inside || !v.task || v.task.phase !== 'do') continue;
    if (v.task.a.prop === 'pipe') L.push({ x: v.x + (facingLeft(v.facing) ? -4 : 4), y: v.y - 13, r: 10, a: 0.55, col: '#ff8a3a' });
  }
  if (Game.selected && !Game.selected.inside) L.push({ x: Game.selected.x, y: Game.selected.y - 8, r: 26, a: 0.5 });
  FX.lights(L);
  if (!Game.raining && World.season !== 'winter') for (const f of FX.fireflies) if (Math.sin(f.t * 3) > 0.2) L.push({ x: f.x, y: f.y, r: 9, a: 0.5 });
  return L;
}

// The scenery and the grass are kept in buckets of 8×8 tiles, so a frame
// looks only at the buckets under the camera rather than every piece on the
// map. A bucket index is made again when its list has been changed (added
// to, cut or replaced), and once a second regardless, in case a piece moved.
const Scene = {
  cell: 128, by: new Map(),
  index(list) {
    let e = this.by.get(list);
    const now = performance.now();
    if (e && e.n === list.length && now - e.at < 1000) return e.map;
    const map = new Map();
    for (const it of list) {
      const k = ((it.y / this.cell) | 0) * 4096 + ((it.x / this.cell) | 0);
      let a = map.get(k); if (!a) map.set(k, a = []);
      a.push(it);
    }
    // only the live lists are kept, so a list that was replaced is let go
    if (this.by.size > 8) for (const key of this.by.keys()) if (key !== World.statics && key !== World.grass) this.by.delete(key);
    this.by.set(list, { map, n: list.length, at: now });
    return map;
  },
  // calls fn for every item of the list inside the rectangle (world pixels)
  gather(list, x0, y0, x1, y1, fn) {
    const map = this.index(list), c = this.cell;
    const cx0 = Math.max(0, Math.floor(x0 / c)), cx1 = Math.floor(x1 / c), cy0 = Math.max(0, Math.floor(y0 / c)), cy1 = Math.floor(y1 / c);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const a = map.get(cy * 4096 + cx);
      if (!a) continue;
      for (const it of a) if (it.x > x0 && it.x < x1 && it.y > y0 && it.y < y1) fn(it);
    }
  },
};

function render(dtReal, dtWall = dtReal) {
  const cam = Game.cam;
  const ctx = vctx;
  if (viewGpu) viewGpu.frameBegin([ctx]);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1d2a17'; ctx.fillRect(0, 0, view.width, view.height);
  // the camera snaps to half-pixels, the finest step the art has
  const cx = Math.round(cam.x * RS) / RS, cy = Math.round(cam.y * RS) / RS;
  const cr = { x: cx, y: cy, w: cam.w, h: cam.h };
  ctx.setTransform(RS, 0, 0, RS, -cx * RS, -cy * RS);

  const mw = MAP_W * TILE, mh = MAP_H * TILE;
  const gx = clamp(cx, 0, mw), gy = clamp(cy, 0, mh);
  const gw = Math.min(mw - gx, cam.w), gh = Math.min(mh - gy, cam.h);
  if (gw > 0 && gh > 0) {
    // the ground, chunk by chunk, each fading from its old painting when it has one
    for (const ch of Ground.over(gx, gy, gx + gw, gy + gh)) {
      const r = ch.r, sx0 = Math.max(gx, r.x0), sy0 = Math.max(gy, r.y0), sx1 = Math.min(gx + gw, r.x1), sy1 = Math.min(gy + gh, r.y1);
      if (sx1 <= sx0 || sy1 <= sy0) continue;
      ctx.drawImage(ch.c, (sx0 - r.x0) * GS, (sy0 - r.y0) * GS, (sx1 - sx0) * GS, (sy1 - sy0) * GS, sx0, sy0, sx1 - sx0, sy1 - sy0);
      if (ch.prev && ch.fade > 0) {
        ctx.globalAlpha = ch.fade; ctx.drawImage(ch.prev, (sx0 - r.x0) * GS, (sy0 - r.y0) * GS, (sx1 - sx0) * GS, (sy1 - sy0) * GS, sx0, sy0, sx1 - sx0, sy1 - sy0); ctx.globalAlpha = 1;
        // fades run on the clock on the wall, so they finish even while the game is paused
        ch.fade -= dtWall * ch.fadeRate;
        if (ch.fade <= 0) ch.prev = null;
      }
    }
    Ground.trim();
  }
  drawWater(ctx, cr);
  // the river runs round the rocks that stand in it: foam piling up on the
  // upstream side, a wake of ripples trailing away downstream
  for (const rk of World.riverRocks || []) {
    if (rk.x < cx - 40 || rk.x > cx + cam.w + 40 || rk.y < cy - 20 || rk.y > cy + cam.h + 20) continue;
    // the water line is where the rock is cut off: the sunk part of its height up from its base
    const hw = rk.w / 2, wy = rk.y - rk.h * rk.st.sink + 1, ph = tReal * 4 + rk.x * 0.3;
    ctx.fillStyle = 'rgba(230,242,250,0.85)';
    for (let k = 0; k < 4; k++) { const t = (ph + k * 1.6) % 6.4; ctx.fillRect(Math.round(rk.x - hw - 1 - t * 0.6), Math.round(wy - 2 + Math.sin(ph * 1.7 + k) * 1.5), 2, 1); }
    ctx.fillStyle = 'rgba(214,232,244,0.7)';
    for (let k = 0; k < 3; k++) { const t = (ph * 1.3 + k * 2.1) % 6.4; ctx.fillRect(Math.round(rk.x + hw - 2 + t * 2.2), Math.round(wy - 1 + (k - 1) * 2 + Math.sin(ph + k * 2) * 1), 3, 1); }
    ctx.fillStyle = 'rgba(240,248,255,0.9)'; ctx.fillRect(Math.round(rk.x - hw), Math.round(wy - 1), rk.w, 1);
  }
  for (const h of World.homes) {
    if (h.doorX < cx - 120 || h.doorX > cx + cam.w + 120 || h.doorY < cy - 40 || h.doorY > cy + cam.h + 120) continue;
    if (h.built) drawDoor(ctx, h);
    else if (Village.projects.some((p) => p.homeId === h.id)) drawSite(ctx, h);
  }
  for (const p of Village.projects) if (p.kind === 'field') drawFieldSite(ctx, World.lots[p.lot], p.prog);
  for (const s of World.riftScars) if (s.x > cx - 40 && s.x < cx + cam.w + 40 && s.y > cy - 20 && s.y < cy + cam.h + 20) drawRiftScar(ctx, s);
  // the pranks lying in wait: a cord across a path, a snare by the hedge (mischief.js)
  if (typeof Mischief !== 'undefined') Mischief.draw(ctx, { x: cx, y: cy, w: cam.w, h: cam.h });

  // y-sorted drawables
  const list = [];
  // the margins allow for the tallest sprite, the great oak at 212 px
  const inView = (x, y, mx = 110, my = 220) => x > cx - mx && x < cx + cam.w + mx && y > cy - 20 && y < cy + cam.h + my;
  // the scenery and grass near the camera, from their buckets, rather than every piece on the map
  Scene.gather(World.statics, cx - 110, cy - 20, cx + cam.w + 110, cy + cam.h + 220, (s) => { if (!s.hidden) list.push({ y: s.sortY, s }); });
  // at the widest zoom the short grass and weeds are too small to see, so only the tall stands are drawn
  Scene.gather(World.grass || [], cx - 20, cy - 20, cx + cam.w + 20, cy + cam.h + 30, (g) => { if (Game.zoom > 1 || g.v >= TALL_V) list.push({ y: g.y, g }); });
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
  for (const v of Game.villagers) if (!v.inside && !v.carried && !v.heldBy && inView(v.x, v.y)) list.push({ y: v.y, v });
  for (const o of Visitors) if (!o.hidden && inView(o.x, o.y)) list.push({ y: o.y, o });
  for (const pt of Game.pets || []) if (!pt.inside && inView(pt.x, pt.y)) { const im = petFrame(pt); list.push({ y: pt.y, img: im, x: Math.round(pt.x) - (im.width >> 1), iy: Math.round(pt.y) - im.height + 2, flip: pt.face < 0 }); }
  for (const r of World.rabbits) if (inView(r.x, r.y)) list.push({ y: r.y, img: SPR.rabbit[r.moving && Math.floor(r.hop * 2) % 2 ? 1 : 0], x: Math.round(r.x) - 5, iy: Math.round(r.y) - 9, flip: r.face < 0 });
  for (const an of World.animals) if (inView(an.x, an.y)) {
    const spr = SPR[an.kind][an.coat][an.graze > 0 ? (Math.floor(tReal * 1.5 + an.x) % 3 === 0 ? 1 : 0) : Math.floor(tReal * 4 + an.x) % 2];
    list.push({ y: an.y, img: spr, x: Math.round(an.x) - (spr.width >> 1), iy: Math.round(an.y) - spr.height + 2, flip: Math.cos(an.a) < 0 });
  }
  for (const al of World.allotments) for (const p of al.plots) if (inView(p.x, p.y)) list.push({ y: p.y, img: SPR.crops[p.crop][p.stage], x: p.x - 7, iy: p.y - 12 });
  for (const hn of World.hens) if (!hn.in && inView(hn.x, hn.y)) list.push({ y: hn.y, img: SPR.hen[hn.peck > 0 ? Math.floor(tReal * 4) % 2 : 0], x: Math.round(hn.x) - 4, iy: Math.round(hn.y) - 8, flip: Math.cos(hn.a) < 0 });
  for (const c of World.crows) if (c.state === 'peck' && inView(c.x, c.y)) list.push({ y: c.y, img: SPR.crow[1], x: Math.round(c.x) - 3, iy: Math.round(c.y) - 5 });
  for (const mw of World.millWheels) if (inView(mw.x, mw.y)) list.push({ y: mw.y + 12, wheel: mw });
  if (World.windmill && inView(World.windmill.x, World.windmill.sortY)) list.push({ y: World.windmill.sortY + 1, sails: true });
  for (const r of World.rifts) if (inView(r.x, r.y)) list.push({ y: r.y, rift: r });
  for (const p of Village.projects) {
    if (p.kind !== 'building' && p.kind !== 'well') continue;
    const lot = World.lots[p.lot];
    const by = lot.kind === 'well' ? (lot.ty + 1) * 16 + 2 : (lot.y1 + 1) * 16 + 1;
    if (inView((lot.kind === 'well' ? lot.tx : lot.x0) * 16, by)) list.push({ y: by, lot, prog: p.prog });
  }
  list.sort((a, b) => a.y - b.y);
  for (const d of list) {
    if (d.v) drawVillager(ctx, d.v);
    else if (d.s) {
      const im = d.s.useAlt && d.s.alt ? d.s.alt : d.s.img;
      if (d.s.sway) blitSway(ctx, im, d.s.x - d.s.ox, d.s.y - d.s.oy, swayAmp(d.s));
      else if (d.s.sink) {
        // a rock in the river shows only its top above the water
        const h = im.height / (im.hd ? RS : 1), top = d.s.y - d.s.oy;
        ctx.save(); ctx.beginPath(); ctx.rect(d.s.x - d.s.ox - 1, top - 1, d.s.w + 2, h * (1 - d.s.sink) + 1); ctx.clip();
        blit(ctx, im, d.s.x - d.s.ox, d.s.y - d.s.oy); ctx.restore();
      } else blit(ctx, im, d.s.x - d.s.ox, d.s.y - d.s.oy);
    }
    else if (d.g) { if (!Dev.hide.grass) drawTuft(ctx, d.g); }
    else if (d.wheel) drawMillWheel(ctx, d.wheel);
    else if (d.sails) drawWindmillSails(ctx);
    else if (d.rift) drawRift(ctx, d.rift, tReal);
    else if (d.lot) drawLotSite(ctx, d.lot, d.prog);
    else if (d.o) d.o.draw(ctx);
    else blit(ctx, d.img, d.x, d.iy, !!d.flip);
  }
  if (winter || (Game.party.on && partyKind().bonfire)) drawBonfire(ctx, tReal, Game.party.on);
  for (const c of World.crows) if (c.state === 'fly') blit(ctx, SPR.crow[Math.floor(c.flap * 2) % 2], Math.round(c.x) - 3, Math.round(c.y) - 3);
  drawPartyLanterns(ctx, tReal, Game.party.on);
  FX.drawAmbientDay(ctx, Game, cr);
  FX.drawClouds(ctx, Game);
  FX.draw(ctx);

  // sky
  const sky = skyState(Game.hour);
  Game.darkness = sky.dark;
  // dusk warms the whole valley
  if (sky.dusk > 0.01) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgb(255,${Math.round(255 - 50 * sky.dusk)},${Math.round(255 - 95 * sky.dusk)})`; ctx.fillRect(cx, cy, cam.w, cam.h); ctx.globalCompositeOperation = 'source-over'; }
  if (Game.raining) { ctx.fillStyle = 'rgba(70,90,110,0.12)'; ctx.fillRect(cx, cy, cam.w, cam.h); }
  if (winter) { ctx.fillStyle = 'rgba(160,190,230,0.06)'; ctx.fillRect(cx, cy, cam.w, cam.h); }
  if (!Dev.hide.light) Light.render(ctx, cr, sky.dark, winter ? '14,22,54' : '12,18,46', collectLights());
  FX.draw(ctx, true);
  drawRiftEmissive(ctx, cr);
  FX.drawFireflies(ctx, Game, cr, []);
  FX.drawFog(ctx, Game, cr);
  if (!Dev.hide.weather) { FX.drawFalling(ctx, Game, cr, dtReal); FX.drawRain(ctx, Game, cr, dtReal); }
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
  ctx.setTransform(RS, 0, 0, RS, 0, 0);
  // the vignette is made once per view size, since a gradient is rasterized afresh every fill
  if (!render.vg || render.vgW !== cam.w || render.vgH !== cam.h) {
    const [c, x] = makeCanvas(cam.w, cam.h, true);
    const vg = x.createRadialGradient(cam.w / 2, cam.h / 2, Math.min(cam.w, cam.h) * 0.45, cam.w / 2, cam.h / 2, Math.max(cam.w, cam.h) * 0.75);
    vg.addColorStop(0, 'rgba(20,12,4,0)'); vg.addColorStop(1, 'rgba(20,12,4,0.28)');
    x.fillStyle = vg; x.fillRect(0, 0, cam.w, cam.h);
    render.vg = c; render.vgW = cam.w; render.vgH = cam.h;
  }
  ctx.drawImage(render.vg, 0, 0);
  // (on the GPU: the frame is lit already, so it goes onto the canvas as it is)
  if (viewGpu) { viewGpu.plain(); viewGpu.frameEnd(); }
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
let BUBBLE_SEQ = 0;
// How far down the screen the top bar (and, on phones, the charter card under it) reaches.
let bubbleCeilAt = -1e9, bubbleCeilY = 0;
function bubbleCeiling() {
  const now = performance.now();
  if (now - bubbleCeilAt < 500) return bubbleCeilY;
  bubbleCeilAt = now;
  const top = overlay.getBoundingClientRect().top, wide = overlay.clientWidth * 0.6;
  let y = 0;
  for (const id of ['topbar', 'objectives']) {
    const el = document.getElementById(id);
    if (!el || el.hidden || el.offsetParent === null) continue;
    const r = el.getBoundingClientRect();
    if (r.width >= wide || id === 'topbar') y = Math.max(y, r.bottom - top);
  }
  return (bubbleCeilY = y);
}
function renderOverlay() {
  const z = Game.zoom, cam = Game.cam;
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  octx.clearRect(0, 0, overlay.width, overlay.height);
  octx.textBaseline = 'middle';
  // the same half-pixel camera the world is drawn with, so text sits exactly on it
  const cx = Math.round(cam.x * RS) / RS, cy = Math.round(cam.y * RS) / RS;
  const W = overlay.width / dpr, H = overlay.height / dpr;
  // measure every bubble first, then lay them out so none sits on another:
  // older ones keep their place and newer ones stack above whatever they'd cover
  const items = [];
  for (const v of Game.villagers.concat(Visitors)) {
    if (v.inside || !v.bubble || v.hidden || v.muteBubble) continue;
    const sx = (v.x - cx) * z;
    const sy = ((v._top ?? v.y - 16) - cy) * z - (Game.selected === v || v.iconT > 0 || v.isSick() ? 14 * z : 4);
    if (sx < -100 || sx > W + 100 || sy < -40 || sy > H + 40) continue;
    const think = v.bubble.think, to = v.bubble.to;
    octx.font = think ? 'italic 600 15px "Alegreya Sans", system-ui, sans-serif' : '600 14px "Pixelify Sans", ui-monospace, monospace';
    // whole sentences wrap onto a few lines
    if (!v.bubble.lines) v.bubble.lines = wrapText(octx, v.bubble.text, 210);
    if (v.bubble.seq == null) v.bubble.seq = ++BUBBLE_SEQ;
    const lines = v.bubble.lines;
    const tw = Math.max(...lines.map((l) => octx.measureText(l).width));
    const bw = tw + 16, bh = 8 + lines.length * 17, bx = Math.round(clamp(sx - bw / 2, 4, W - bw - 4)), by = Math.round(sy - bh - (think ? 14 : 8));
    items.push({ v, sx, think, to, lines, bw, bh, bx, by, by0: by, top: to && !think ? 15 : 2 });
  }
  items.sort((p, q) => p.v.bubble.seq - q.v.bubble.seq);
  // each newer bubble takes the nearest free spot: where it would be, above or
  // beside one already there, never up behind the top bar or off the sides
  const ceil = bubbleCeiling() + 4;
  const hits = (it, x, y, o) => x - 2 < o.bx + o.bw + 5 && x + it.bw + 5 > o.bx - 2 && y - it.top < o.by + o.bh + 4 && y + it.bh + 4 > o.by - o.top;
  const placed = [];
  for (const it of items) {
    // a speaker right under the top bar has their bubble pinned just below it
    const x0 = it.bx, y0 = Math.max(it.by, ceil + it.top);
    const xs = [x0], ys = [y0];
    for (const o of placed) { xs.push(o.bx - it.bw - 9, o.bx + o.bw + 9); ys.push(o.by - o.top - it.bh - 6, o.by + o.bh + it.top + 6); }
    let best = null, bestCost = Infinity;
    for (const x of xs) {
      if (x < 4 || x > W - it.bw - 4) continue;
      for (const y of ys) {
        if (y - it.top < ceil || y + it.bh > H - 4) continue;
        const cost = (y <= y0 ? y0 - y : (y - y0) * 1.6) + Math.abs(x - x0) * 0.8;
        if (cost < bestCost && !placed.some((o) => hits(it, x, y, o))) { best = [x, y]; bestCost = cost; }
      }
    }
    if (best) [it.bx, it.by] = best;
    else {
      // nowhere free in view: stack upwards as before
      for (let moved = true, n = 0; moved && n < 12; n++) {
        moved = false;
        for (const o of placed) if (hits(it, it.bx, it.by, o)) { it.by = o.by - o.top - it.bh - 6; moved = true; }
      }
    }
    placed.push(it);
  }
  // lifted bubbles keep a thin stem down to whoever's speaking
  for (const it of items) {
    if (Math.abs(it.by0 - it.by) < 3) continue;
    const ax = clamp(it.sx - 3, it.bx + 6, it.bx + it.bw - 6);
    octx.globalAlpha = Math.min(1, it.v.bubble.t * 2.5) * 0.8;
    octx.strokeStyle = it.think ? '#5a5e70' : '#2a1c12'; octx.lineWidth = 2;
    octx.beginPath(); octx.moveTo(ax, it.by + it.bh + 4); octx.lineTo(it.sx - 3, it.by0 + it.bh + (it.think ? 12 : 8)); octx.stroke();
  }
  for (const { v, sx, think, to, lines, bw, bh, bx, by } of items) {
    // a thought is half seen, so it doesn't shout like speech does
    octx.globalAlpha = Math.min(1, v.bubble.t * 2.5) * (think ? 0.62 : 1);
    octx.font = think ? 'italic 600 15px "Alegreya Sans", system-ui, sans-serif' : '600 14px "Pixelify Sans", ui-monospace, monospace';
    if (think) {
      // musing to themselves: a soft thought cloud, trailing little bubbles
      const fill = '#f7f4ee', edge = '#5a5e70';
      const rr = (x, y, w, h, r) => { octx.beginPath(); octx.moveTo(x + r, y); octx.arcTo(x + w, y, x + w, y + h, r); octx.arcTo(x + w, y + h, x, y + h, r); octx.arcTo(x, y + h, x, y, r); octx.arcTo(x, y, x + w, y, r); octx.closePath(); };
      octx.fillStyle = edge; rr(bx - 2, by - 2, bw + 4, bh + 4, 10); octx.fill();
      octx.fillStyle = fill; rr(bx, by, bw, bh, 9); octx.fill();
      for (const [ox, oy, r] of [[-2, bh + 5, 3.5], [-5, bh + 11, 2.2]]) { octx.fillStyle = edge; octx.beginPath(); octx.arc(sx + ox, by + oy, r + 1, 0, Math.PI * 2); octx.fill(); octx.fillStyle = fill; octx.beginPath(); octx.arc(sx + ox, by + oy, r, 0, Math.PI * 2); octx.fill(); }
      octx.fillStyle = '#1e2130'; lines.forEach((l, i) => octx.fillText(l, bx + 8, by + 13 + i * 17));
      continue;
    }
    octx.fillStyle = 'rgba(42,28,18,0.35)'; octx.fillRect(bx + 3, by + 3, bw, bh);
    octx.fillStyle = '#2a1c12'; octx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    octx.fillStyle = v.isGrown() ? '#fffaf0' : '#f0f8ff'; octx.fillRect(bx, by, bw, bh);
    // the tail leans toward whoever they're talking to
    const lean = to && !to.inside ? clamp((to.x - v.x) * z * 0.05, -6, 6) : 0;
    octx.fillStyle = '#2a1c12'; octx.beginPath(); octx.moveTo(sx - 6, by + bh + 2); octx.lineTo(sx + 2, by + bh + 2); octx.lineTo(sx - 4 + lean, by + bh + 9); octx.fill();
    octx.fillStyle = v.isGrown() ? '#fffaf0' : '#f0f8ff'; octx.beginPath(); octx.moveTo(sx - 4, by + bh - 1); octx.lineTo(sx, by + bh - 1); octx.lineTo(sx - 3.5 + lean * 0.7, by + bh + 4); octx.fill();
    octx.fillStyle = '#2a1c12'; lines.forEach((l, i) => octx.fillText(l, bx + 8, by + 13 + i * 17));
    // and says who to, in a little tab on top
    if (to) {
      octx.font = '600 11px "Pixelify Sans", ui-monospace, monospace';
      const tag = 'to ' + to.first, tgw = octx.measureText(tag).width + 10;
      octx.fillStyle = '#2a1c12'; octx.fillRect(bx - 2, by - 15, tgw + 2, 14);
      octx.fillStyle = '#ffe680'; octx.fillText(tag, bx + 3, by - 5);
    }
  }
  // the odd baa and moo
  octx.font = '600 12px "Pixelify Sans", ui-monospace, monospace';
  for (const an of World.animals.concat((Game.pets || []).filter((pt) => !pt.inside))) {
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
  devOverlay(octx, z, cx, cy, W, H);
}

// ---------------------------------------------------------------------------
// Camera and input
// ---------------------------------------------------------------------------
// The keys that move the camera (WASD and the arrows) are held as actions on
// Tycho's controls (play.md), fed the keys' names (e.key, lowercased) by the
// game's own listener below, which keeps the shortcuts and leaves typing in
// a field alone. The drag, the pinch and the taps stay the game's: past the
// first few pixels a drag either picks a villager up or pans by the whole
// offset from where it landed, and a pinch zooms in whole steps from its
// start, for touches only and never while carrying.
const CamKeys = new Tycho.input.Controls({
  keys: { a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down' },
  axes: { left: 'left', right: 'right', up: 'up', down: 'down' },
});
const pointer = { down: false, sx: 0, sy: 0, camX: 0, camY: 0, moved: false, x: 0, y: 0, cand: null };

// A phone (or any small or short window) gets the compact interface: the
// body carries `phone` (and `landscape` when it's wider than it is tall).
const isPhone = () => window.innerWidth < 760 || window.innerHeight < 500;
function markScreen() {
  const W = window.innerWidth, H = window.innerHeight;
  document.body.classList.toggle('phone', isPhone());
  document.body.classList.toggle('landscape', H < 500 && W > H);
  // at the widest zoom the view is drawn at half size, smoothed, since there's no whole pixel for each half-pixel of art
  document.body.classList.toggle('zoom-1', Game.zoom === 1);
}
function resize() {
  dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth, H = window.innerHeight;
  markScreen();
  Game.cam.w = Math.ceil(W / Game.zoom); Game.cam.h = Math.ceil(H / Game.zoom);
  // two canvas pixels to every world pixel; the zoom steps keep them whole on screen
  view.width = Game.cam.w * RS; view.height = Game.cam.h * RS;
  if (viewGpu) viewGpu.resize(view.width, view.height, []);
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

// Zoom levels, in screen pixels per world pixel. They're even, so every
// half-pixel of art lands on whole screen pixels; the widest, 1, shows a
// whole stretch of the valley on a phone, smoothed down to half size.
const ZOOMS = [1, 2, 4, 6, 8];
const snapZoom = (z) => ZOOMS.reduce((best, k) => (Math.abs(k - z) < Math.abs(best - z) ? k : best), ZOOMS[0]);
function zoomStep(dir, anchorX, anchorY) { const i = ZOOMS.indexOf(snapZoom(Game.zoom)); setZoom(ZOOMS[clamp(i + dir, 0, ZOOMS.length - 1)], anchorX, anchorY); }
function setZoom(z, anchorX, anchorY) {
  z = snapZoom(z);
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

// The villager under a point. A fingertip is much bigger than a mouse pointer,
// so touches reach about 22 screen pixels around each villager.
function villagerAt(wx, wy, touch = pointer.touch) {
  const pad = touch ? Math.max(0, 22 / Game.zoom - 4) : 0;
  let best = null, bd = 1e9;
  for (const v of Game.villagers) {
    if (v.inside || v.carried || v.heldBy) continue;
    const top = v._top ?? v.y - 16;
    if (wx >= v.x - 7 - pad && wx <= v.x + 7 + pad && wy >= top - 2 - pad && wy <= v.y + 3 + pad) {
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
  const z = snapZoom(pinch.z0 * (m.d / pinch.d0));
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
    pointer.touch = e.pointerType === 'touch';
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
    zoomStep(wheelAcc < 0 ? 1 : -1, e.clientX, e.clientY);
    wheelAcc = 0;
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
    const k = e.key.toLowerCase();
    CamKeys.keyDown(k);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    // the tools, the hand and the ledger are the Steward's, not the wizard's
    const steward = !(typeof playMode === 'function' && playMode());
    if (steward && k >= '1' && k <= String(TOOLS.length)) setTool(TOOLS[+k - 1].id);
    if (k === ' ') setSpeed(Game.speedIdx === 0 ? (Game.prevSpeed || 1) : 0);
    if (steward && k === 'p' && Game.selected) doPat();
    if (steward && k === 't' && Game.selected) doTut();
    if (steward && k === 'e' && Game.selected) doTeach();
    if (k === 'f' && Game.selected) toggleFollow();
    if (steward && k === 'v') toggleVillage();
    if (k === 'escape') { selectVillager(null); closeModals(); }
    if (k === '+' || k === '=') zoomStep(1);
    if (k === '-' || k === '_') zoomStep(-1);
    if (k === 'tab') { e.preventDefault(); cycleVillager(e.shiftKey ? -1 : 1); }
    if (k === '`' || k === '~') devToggle();
  });
  window.addEventListener('keyup', (e) => CamKeys.keyUp(e.key.toLowerCase()));
  window.addEventListener('blur', () => CamKeys.keysOff());
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
  view.style.cursor = Game.carrying ? 'grabbing' : Game.tool !== 'hand' ? 'copy' : Game.hovered || (p && (homeAt(wx, wy)?.built || buildingAt(wx, wy))) ? 'pointer' : pointer.down ? 'grabbing' : 'grab';
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
      const h = homeAt(wx, wy);
      if (h && h.built) { openInterior(h); return; }
      const bd = buildingAt(wx, wy);
      if (bd) { openInterior(bd); return; }
      // a finger can't hover: a tap on a place names it for a moment
      if (pointer.touch) { const p = placeAt(wx, wy); if (p) toast(p[1] ? `${p[0]}: ${p[1]}` : p[0], 'info'); }
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
  for (const v of Game.villagers) if (!v.inside && dist(v.x, v.y, wx, wy) < 20 * 16 && v.task && ['stroll', 'read', 'putter', 'fish', 'nap', 'play'].includes(v.task.a.id)) v.task.t = Math.min(v.task.t, 1);
}

function plantFlowers(x, y, seed) {
  Ground.draw(hd(makeFlowerPatch(seed)), x - 9, y - 10);
  World.flowers.push({ x, y, seed });
}

function updateCamera(dt) {
  const sp = 260 * dt / Math.max(1, Game.zoom / 2);
  CamKeys.update();
  const mx = CamKeys.move.x, my = CamKeys.move.y;
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
let lastFrameAt = performance.now(), hudT = 0;
function frame(now) {
  const dtReal = Math.min(0.1, (now - lastFrameAt) / 1000);
  lastFrameAt = now;
  // the valley is being made afresh on the setup screen: nothing to run or draw yet
  if (Game.generating) { requestAnimationFrame(frame); return; }
  tReal += dtReal;
  try {
    const speed = SPEEDS[Game.speedIdx];
    Game.minPerSec = GAME_MIN_PER_SEC * Math.max(speed, 0.0001);
    const t0 = performance.now();
    if (speed > 0 && Game.started && !Game.introOpen) {
      let dt = dtReal * GAME_MIN_PER_SEC * speed;
      while (dt > 0) { const s = Math.min(dt, 0.5); simulate(s); dt -= s; }
    }
    const t1 = performance.now();
    // paint faster while the intro card is up and nobody's looking at the ground
    // bare ground in sight gets most of a frame's worth of painting; otherwise a little goes to the chunks just off screen
    const bare = World.paintJob && Game.cam && Ground.over(Game.cam.x, Game.cam.y, Game.cam.x + Game.cam.w, Game.cam.y + Game.cam.h, false).some((ch) => !ch.painted);
    // and when the camera hasn't moved for a while, only a sliver goes to the chunks off screen
    if (Game.cam && (Game.cam.x !== Game._pcx || Game.cam.y !== Game._pcy)) { Game._pcx = Game.cam.x; Game._pcy = Game.cam.y; Game._camMoved = tReal; }
    stepPaint(Game.introOpen || (World.paintJob && World.paintJob.urgent) ? 28 : bare ? 16 : tReal - (Game._camMoved || 0) < 1 ? 6 : 2);
    const t2 = performance.now();
    const fxDt = speed > 0 ? dtReal : 0;
    emitSmoke(speed > 0 ? dtReal : 0);
    emitRiftFx(dtReal);
    FX.update(fxDt, Game);
    updateCamera(dtReal);
    updateWind(dtReal);
    render(fxDt, dtReal);
    renderOverlay();
    // how the frame's time was spent, smoothed, for the dev drawer
    const t3 = performance.now(), T = Dev.timing;
    T.sim += (t1 - t0 - T.sim) * 0.1; T.paint += (t2 - t1 - T.paint) * 0.1; T.render += (t3 - t2 - T.render) * 0.1;
    devFrame(dtReal);
    interiorFrame(dtReal);
    hudT -= dtReal;
    if (hudT <= 0) { hudT = 0.25; updateHUD(); }
  } catch (e) {
    noteError(e, 'the frame');
  }
  requestAnimationFrame(frame);
}

function boot() {
  view = $('view');
  if (!Tycho.dev.query('nogl')) viewGpu = Tycho.gpu.Gpu.create(view, { onError: (e) => noteError(e, 'the GPU') });
  vctx = viewGpu ? viewGpu.ctx(Tycho.gpu.F.COL) : view.getContext('2d');
  overlay = $('overlay'); octx = overlay.getContext('2d');
  buildIcons();
  buildWorldSprites();
  // the valley the saved village lives in (older saves: the original one)
  buildWorld(savedGen() || SEED);
  FX.initAmbient();
  // a comfortable first zoom: about 15 tiles across, never the widest (that one's for looking about)
  Game.zoom = Math.max(2, snapZoom(Math.min(window.innerWidth / 240, window.innerHeight / 280)));
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
  paintGroundSoon(World.season);
  Game.darkness = skyState(Game.hour).dark;
  centerOn(PLAZA.cx * 16, (PLAZA.cy - 2) * 16);
  buildUI();
  setupInput();
  setupInterior();
  devLoad();
  // fetch the rift interface's fonts while idle, so the first switch to it
  // doesn't stall waiting for them
  if (document.fonts) setTimeout(() => { for (const f of ['16px "Share Tech Mono"', '500 16px Rajdhani', '600 16px Rajdhani', '700 16px Rajdhani']) document.fonts.load(f).catch(() => {}); }, 1200);
  renderLog();
  updateSoundBtn();
  openIntro(true);
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); Sound.setHidden(document.hidden); });
  Pwa.init(); // installable and kept current, when served over the web (pwa.js)
  requestAnimationFrame(frame);
}
// A loaded winter village should look wintry straight away.
function seasonTurnIfNeeded() { if (World.season === 'winter') for (const w of World.weed) w.stage = Math.min(w.stage, 0); }

window.addEventListener('DOMContentLoaded', boot);
