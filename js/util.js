'use strict';
// ---------------------------------------------------------------------------
// Small helpers shared by every module.
// ---------------------------------------------------------------------------

const TILE = 16;
// The game draws everything at double resolution: two canvas pixels to every
// world pixel. Game logic, positions and the map all stay in world pixels.
const RS = 2;
const GS = 2; // the painted ground, likewise
// The map's size in tiles; the classic valley is 128×96. Changed only before
// a world is built, through setMapSize (world.js).
let MAP_W = 128;
let MAP_H = 96;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const R = {
  f: (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a)),
  i: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  chance: (p) => Math.random() < p,
  // weighted pick from [[weight, value], ...]
  weighted: (list) => {
    let total = 0;
    for (const [w] of list) total += Math.max(0, w);
    let r = Math.random() * total;
    for (const [w, v] of list) { r -= Math.max(0, w); if (r <= 0) return v; }
    return list.length ? list[list.length - 1][1] : null;
  },
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

function hexToRgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  if (amt < 0) return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}
function mix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}

function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function makeNoise(seed) {
  const rng = mulberry32(seed);
  const P = new Float32Array(256 * 256);
  for (let i = 0; i < P.length; i++) P[i] = rng();
  const g = (i, j) => P[((j & 255) << 8) | (i & 255)];
  const sm = (t) => t * t * (3 - 2 * t);
  function v(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const u = sm(x - xi), w = sm(y - yi);
    return lerp(lerp(g(xi, yi), g(xi + 1, yi), u), lerp(g(xi, yi + 1), g(xi + 1, yi + 1), u), w);
  }
  return (x, y) => v(x, y) * 0.6 + v(x * 2.1 + 17, y * 2.1 + 9) * 0.3 + v(x * 4.3 + 3, y * 4.3 + 41) * 0.1;
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingEnabled = false;
  return [c, x];
}

// Pixel-perfect filled circle / ellipse.
function disc(ctx, cx, cy, r, col) {
  ctx.fillStyle = col;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r + r * 0.6 - y * y));
    if (w >= 0) ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}
function ellipseFill(ctx, cx, cy, rx, ry, col) {
  ctx.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const t = 1 - (y * y) / (ry * ry + 0.5);
    if (t < 0) continue;
    const w = Math.round(rx * Math.sqrt(t));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}

// Adds a 1px outline around every opaque pixel of a canvas, in a darkened
// shade of whatever it borders rather than one ink colour, so a sheep is ringed
// in grey and a pine in deep green. (`col` is kept for callers; the outline
// takes the art's own colours.)
// If anything is drawn right up to the canvas edge, the canvas grows by a
// pixel all round first so the outline isn't cut off there (callers use the
// canvas returned).
const OUTLINE_DARK = 0.42;
function outlineCanvas(c, col = '#2a1c12', alpha = 255) {
  {
    const w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data;
    let edge = false;
    for (let x = 0; x < w && !edge; x++) edge = d[x * 4 + 3] > 100 || d[((h - 1) * w + x) * 4 + 3] > 100;
    for (let y = 0; y < h && !edge; y++) edge = d[y * w * 4 + 3] > 100 || d[(y * w + w - 1) * 4 + 3] > 100;
    if (edge) { const [p, px] = makeCanvas(w + 2, h + 2); px.drawImage(c, 1, 1); c = p; }
  }
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data, w = c.width, h = c.height;
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 100;
  const mark = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 100) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (const [i, j] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (solid(i, j)) { const k = (j * w + i) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; }
      if (n) mark.push(y * w + x, r / n, g / n, b / n);
    }
  for (let m = 0; m < mark.length; m += 4) { const i = mark[m] * 4; d[i] = mark[m + 1] * OUTLINE_DARK; d[i + 1] = mark[m + 2] * OUTLINE_DARK; d[i + 2] = mark[m + 3] * OUTLINE_DARK; d[i + 3] = alpha; }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Renders a list of strings into a canvas using a palette map. '.' is transparent.
function spriteFrom(rows, pal) {
  const h = rows.length, w = rows[0].length;
  const [c, x] = makeCanvas(w, h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const ch = rows[j][i];
      if (ch === '.' || ch === ' ' || !pal[ch]) continue;
      x.fillStyle = pal[ch];
      x.fillRect(i, j, 1, 1);
    }
  return c;
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------
const NAME_A = ['Bun', 'Tum', 'Pip', 'Hob', 'Wil', 'Fen', 'Dod', 'Mer', 'Lob', 'Pod', 'Mil', 'Tob', 'Bram', 'Hal', 'Ned',
  'Cob', 'Gil', 'Pel', 'Ros', 'Lil', 'Dai', 'Mar', 'Bel', 'Pan', 'Hol', 'Tan', 'Wim', 'Bod', 'Rud', 'Mos', 'Nib', 'Pom', 'Ott', 'Fos', 'Jem'];
// name endings that sound like a lass's name, and a lad's
const NAME_B_F = ['a', 'ie', 'ola', 'isa', 'bell', 'ly', 'sy', 'ett', 'wyn', 'etta', 'ina', 'elle'];
const NAME_B_M = ['o', 'bo', 'wick', 'mer', 'do', 'kin', 'well', 'by', 'mund', 'ric', 'ard', 'ble', 'ry', 'fast'];
const NAME_B = NAME_B_F.concat(NAME_B_M);
const FLOWER_NAMES_F = ['Daisy', 'Poppy', 'Marigold', 'Clover', 'Hazel', 'Myrtle', 'Tansy', 'Heather', 'Saffron', 'Juniper', 'Bluebell', 'Sorrel', 'Wren', 'Primrose', 'Rosie', 'Lily'];
const FLOWER_NAMES_M = ['Linden', 'Bramble', 'Thyme', 'Basil', 'Barley', 'Rowan', 'Alder', 'Fennel', 'Sage', 'Hawthorn', 'Oakley', 'Burdock'];
const FLOWER_NAMES = FLOWER_NAMES_F.concat(FLOWER_NAMES_M);
const SURNAMES = ['Underbough', 'Puddlefoot', 'Thistlewick', 'Mossbottom', 'Applegate', 'Honeyfoot', 'Burrowell', 'Tuffle',
  'Barleycorn', 'Fernbank', 'Hedgely', 'Mugwort', 'Pickthorn', 'Copperkettle', 'Dimbleby', 'Oakbottle', 'Larkspur',
  'Sweetwater', 'Butterbun', 'Puddingfield', 'Greenhollow', 'Nettlebed', 'Crumblebank', 'Wheatley'];

function randomFirstName(sex) {
  const f = sex ? sex === 'f' : R.chance(0.5);
  if (R.chance(0.3)) return R.pick(f ? FLOWER_NAMES_F : FLOWER_NAMES_M);
  return R.pick(NAME_A) + R.pick(f ? NAME_B_F : NAME_B_M);
}
// For villagers from before they had a sex: guess from the name.
function sexFromName(name) {
  if (FLOWER_NAMES_F.includes(name)) return 'f';
  if (FLOWER_NAMES_M.includes(name)) return 'm';
  if (NAME_B_F.some((e) => e.length > 1 && name.endsWith(e)) || /a$/.test(name)) return 'f';
  if (NAME_B_M.some((e) => name.endsWith(e))) return 'm';
  return R.chance(0.5) ? 'f' : 'm';
}
// He / she, him / her, his / her.
const PRON = { f: { they: 'she', them: 'her', their: 'her', They: 'She', lad: 'lass' }, m: { they: 'he', them: 'him', their: 'his', They: 'He', lad: 'lad' } };

const MEALS = [
  [5.0, 'Before Breakfast'], [7.0, 'Breakfast'], [9.0, 'Second Breakfast'], [11.0, 'Elevenses'], [13.0, 'Luncheon'],
  [15.5, 'Afternoon Tea'], [18.0, 'Dinner'], [20.5, 'Supper'], [22.5, 'Bedtime'],
];
function mealFor(hour) {
  let name = 'Bedtime';
  for (const [h, n] of MEALS) if (hour >= h) name = n;
  if (hour < 5) name = 'Small Hours';
  return name;
}
function isMealTime(hour) {
  for (const [h] of MEALS.slice(1, 8)) if (hour >= h - 0.25 && hour <= h + 1) return true;
  return false;
}

function fmtTime(min) {
  const m = Math.floor(min % 1440);
  const h = Math.floor(m / 60), mm = m % 60;
  return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Calendar: four seasons of a few days each.
// ---------------------------------------------------------------------------
const SEASON_DAYS = 3;
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const SEASON_KEYS = ['spring', 'summer', 'autumn', 'winter'];
// sunrise / sunset hour for each season
const DAYLIGHT = { spring: [6, 19.5], summer: [5, 21], autumn: [6.5, 18.5], winter: [7.5, 17] };

const seasonIdx = (day) => Math.floor((day - 1) / SEASON_DAYS) % 4;
const seasonKey = (day) => SEASON_KEYS[seasonIdx(day)];
const dayOfSeason = (day) => ((day - 1) % SEASON_DAYS) + 1;
const yearOf = (day) => Math.floor((day - 1) / (SEASON_DAYS * 4)) + 1;
