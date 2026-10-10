'use strict';
// ---------------------------------------------------------------------------
// Procedural pixel art: villagers, trees, buildings, props, critters, icons.
// Everything is drawn once into offscreen canvases (seasonal variants are
// drawn the first time a season needs them, then cached).
// ---------------------------------------------------------------------------

const SKIN_TONES = ['#f4cfa8', '#e9b88f', '#d8a072', '#bd8558', '#94603e', '#6e4429'];
const HAIR_COLS = ['#3b2414', '#5a3a1e', '#7a4a22', '#a0622a', '#c58b3c', '#dcb563', '#2a1a10', '#8a3a1e', '#b8562a'];
const VEST_COLS = ['#4f7a3a', '#a0522d', '#c9a227', '#2f6f8f', '#8b2e2e', '#d98a3a', '#5e6b2a', '#7a5c3a', '#6a7f9a', '#9a4a6a'];
const SHIRT_COLS = ['#efe6cf', '#e8dcc0', '#f4efe2', '#dfe8d2', '#e9d8c8'];
const LEG_COLS = ['#6b4a2b', '#4d5a3a', '#5a4636', '#7a6a4a', '#3e4a5a', '#8a5a3a'];
const DOOR_COLS = ['#2f6b34', '#c9a227', '#a23b2a', '#2f5e9a', '#6b3f8a', '#2f7f7a', '#c86a2a', '#3a7a3a'];
const OUTLINE = '#2a1c12';

// ----- villager templates (10 px wide) -----
const FRONT_BODY = [
  '...hhhh...',
  '..hhhhhh..',
  '.hhhsshhh.',
  '.hsessesh.',
  '.hrssssrh.',
  '...ssss...',
  '..vvwwvv..',
  '.wvvwwvvw.',
  '.wvbwwbvw.',
  '.svvvvvvs.',
];
const BACK_BODY = [
  '...hhhh...',
  '..hhhhhh..',
  '.hhhHhhhh.',
  '.hhhhhHhh.',
  '.hhhhhhhh.',
  '...ssss...',
  '..vvvvvv..',
  '.wvvvvvvw.',
  '.wvvVVvvw.',
  '.svvvvvvs.',
];
const SIDE_BODY = [
  '...hhhh...',
  '..hhhhhh..',
  '..hhhhsss.',
  '..hhhsses.',
  '..hhhsssss',
  '...hssr...',
  '...vvwv...',
  '...vwwv...',
  '...vwsv...',
  '...vvvv...',
];
const LEGS = {
  front: {
    stand: ['..tttttt..', '..tt..tt..', '..ss..ss..', '.fFf..fFf.'],
    walk1: ['..tttttt..', '..tt..tt..', '..ss..fFf.', '.fFf......'],
    walk2: ['..tttttt..', '..tt..tt..', '.fFf..ss..', '......fFf.'],
    sit: ['.tttttttt.', '.fFf..fFf.'],
  },
  side: {
    stand: ['...tttt...', '...tttt...', '....ss....', '....fFff..'],
    walk1: ['...tttt...', '..tt..tt..', '..ss..ss..', '.ff....fFf'],
    walk2: ['...tttt...', '...tttt...', '....ss....', '....fFff..'],
    sit: ['...ttttt..', '....ssfFf.'],
  },
};
// Babies are a swaddled bundle with a round face.
const BABY_FRONT = ['..hhhh..', '.hssssh.', '.sesses.', '.srssrs.', '..ssss..', '.wwwwww.', 'wwwWwwww', '.wwwwww.', '..wwww..'];
const BABY_BACK = ['..hhhh..', '.hhhhhh.', '.hhhhhh.', '.hhhhhh.', '..ssss..', '.wwwwww.', 'wwwwWwww', '.wwwwww.', '..wwww..'];

function applyHairStyle(rows, view, style, freckles) {
  rows = rows.map((r) => r.split(''));
  const set = (j, i, ch) => { if (rows[j] && rows[j][i] !== undefined) rows[j][i] = ch; };
  if (style === 1) {
    if (view === 'front') for (let j = 4; j <= 7; j++) { set(j, 1, 'h'); set(j, 8, 'h'); }
    if (view === 'back') for (let j = 5; j <= 7; j++) for (let i = 2; i <= 7; i++) set(j, i, 'h');
    if (view === 'side') for (let j = 4; j <= 7; j++) set(j, 2, 'h');
  }
  if (style === 2) {
    for (let j = 0; j <= 2; j++) for (let i = 0; i < 10; i++) if (rows[j][i] === 'h' && (i + j) % 3 === 0) rows[j][i] = 'H';
  }
  if (style === 3) {
    // curls: a fuller, bumpy mop
    set(0, 2, 'h'); set(0, 7, 'h');
    if (view === 'front') { set(4, 0, 'h'); set(4, 9, 'h'); set(5, 1, 'h'); set(5, 8, 'h'); }
    if (view === 'side') { set(5, 2, 'h'); set(1, 1, 'h'); }
    if (view === 'back') for (let i = 1; i <= 8; i++) set(5, i, (i % 2) ? 'h' : 'H');
    for (let j = 0; j <= 4; j++) for (let i = 0; i < 10; i++) if (rows[j][i] === 'h' && (i + j) % 2 === 0) rows[j][i] = 'H';
  }
  if (freckles) {
    if (view === 'front') { set(4, 3, 'k'); set(4, 6, 'k'); }
    if (view === 'side') { set(4, 6, 'k'); }
  }
  return rows.map((r) => r.join(''));
}

// Lasses wear a ribbon in their hair; grown lads have sideburns.
function applySex(rows, view, sex, child) {
  rows = rows.map((r) => r.split(''));
  const set = (j, i, ch) => { if (rows[j] && rows[j][i] !== undefined) rows[j][i] = ch; };
  if (sex === 'f') {
    if (view === 'front') { set(1, 7, 'R'); set(1, 8, 'R'); set(0, 7, 'R'); }
    if (view === 'back') { set(1, 4, 'R'); set(1, 5, 'R'); set(2, 4, 'R'); set(2, 5, 'R'); }
    if (view === 'side') { set(1, 3, 'R'); set(1, 4, 'R'); set(0, 4, 'R'); }
  } else if (!child) {
    if (view === 'front') { set(4, 1, 'H'); set(4, 8, 'H'); }
    if (view === 'side') { set(4, 3, 'H'); }
  }
  return rows.map((r) => r.join(''));
}

function villagerPalette(genes, stage) {
  const ex = expressed(genes);
  let hair = ex.hair;
  if (stage === 'elder') hair = mix(hair, '#d9d6cc', 0.8);
  const skin = ex.skin;
  return {
    h: hair, H: shade(hair, -0.28), s: skin, S: shade(skin, -0.15), e: ex.eyes, r: mix(skin, '#e0705a', 0.35), k: mix(skin, '#7a3a1a', 0.45),
    v: ex.vest, V: shade(ex.vest, -0.25), w: ex.shirt, W: shade(ex.shirt, -0.12),
    t: ex.legs, T: shade(ex.legs, -0.2), f: shade(skin, -0.12), F: shade(hair, -0.05), b: '#e8c860', R: mix(ex.vest, '#ff5a7a', 0.6),
  };
}

function finishSprite(rows, pal) {
  const raw = spriteFrom(rows, pal);
  const [c, x] = makeCanvas(raw.width + 2, raw.height + 2);
  x.drawImage(raw, 1, 1);
  return outlineCanvas(c, OUTLINE);
}

function buildVillagerSprites(genes, stage) {
  const pal = villagerPalette(genes, stage);
  const ex = expressed(genes);
  const out = { down: {}, up: {}, side: {} };
  if (stage === 'baby') {
    pal.w = mix(ex.vest, '#fff8e8', 0.65); pal.W = mix(ex.vest, '#fff8e8', 0.3);
    const f = finishSprite(BABY_FRONT, pal), b = finishSprite(BABY_BACK, pal);
    for (const pose of ['stand', 'walk1', 'walk2', 'sit']) { out.down[pose] = f; out.up[pose] = b; out.side[pose] = f; }
    return out;
  }
  const child = stage === 'child';
  const views = [['down', FRONT_BODY, 'front'], ['up', BACK_BODY, 'front'], ['side', SIDE_BODY, 'side']];
  for (const [dir, body, legKind] of views) {
    const view = dir === 'down' ? 'front' : dir === 'up' ? 'back' : 'side';
    let b = applyHairStyle(body, view, ex.sex === 'f' && ex.style === 0 ? 1 : ex.style, ex.freckles);
    b = applySex(b, view, ex.sex, child);
    if (child) b = [0, 1, 2, 3, 4, 6, 8, 9].map((i) => b[i]);
    for (const pose of ['stand', 'walk1', 'walk2', 'sit']) {
      let legs = LEGS[legKind][pose].slice();
      if (ex.garment === 1 && pose !== 'sit') legs[1] = legKind === 'front' ? '.tttttttt.' : '..tttttt..';
      if (child && pose !== 'sit') legs = legs.slice(2);
      out[dir][pose] = finishSprite(b.concat(legs), pal);
    }
  }
  return out;
}

// Large portrait for the inspector panel.
function drawPortrait(canvas, genes, stage, sepia) {
  const sp = buildVillagerSprites(genes, stage).down.stand;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const s = Math.max(1, Math.floor(Math.min(canvas.width / sp.width, canvas.height / sp.height)));
  ctx.drawImage(sp, Math.floor((canvas.width - sp.width * s) / 2), canvas.height - sp.height * s, sp.width * s, sp.height * s);
  if (sepia) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      d[i] = l * 1.07 + 20; d[i + 1] = l * 0.95 + 8; d[i + 2] = l * 0.75;
    }
    ctx.putImageData(img, 0, 0);
  }
}

// ---------------------------------------------------------------------------
// Snow: dusts the upward-facing edges of any sprite (roofs, branches, hats).
// ---------------------------------------------------------------------------
function addSnow(c, y0 = 0, y1 = c.height, depth = 3, seed = 1) {
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data, w = c.width;
  const op = (x, y) => y >= 0 && d[(y * w + x) * 4 + 3] > 100;
  const out = new Uint8Array(w * c.height);
  for (let x = 0; x < w; x++) {
    for (let y = Math.max(1, y0); y < Math.min(c.height, y1); y++) {
      if (op(x, y) && !op(x, y - 1)) {
        const dd = depth - (hash2(x + seed, y) < 0.4 ? 1 : 0);
        for (let k = 0; k < dd; k++) if (op(x, y + k)) out[(y + k) * w + x] = k === 0 ? 2 : 1;
      }
    }
  }
  for (let i = 0; i < out.length; i++) {
    if (!out[i]) continue;
    const j = i * 4;
    const white = out[i] === 1 && hash2(i, seed) < 0.3 ? [214, 226, 240] : [244, 248, 255];
    d[j] = white[0]; d[j + 1] = white[1]; d[j + 2] = white[2];
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// ---------------------------------------------------------------------------
// Trees and plants (with seasonal palettes)
// ---------------------------------------------------------------------------
const TREE_PAL = {
  summer: {
    oak: ['#24461f', '#336128', '#467f34', '#64a043', '#86bf55'],
    apple: ['#2b4e22', '#3a6c2c', '#4f8a38', '#6aa848', '#8cc65a'],
    birch: ['#3a5f26', '#4f7d32', '#66983e', '#82b24e', '#a4cc66'],
    pine: ['#1b3524', '#24452c', '#2f5a36', '#3f7244', '#56905a'],
    big: ['#22441d', '#305e26', '#427a31', '#5c9a40', '#80bb53'],
  },
  spring: {
    oak: ['#2c5a22', '#3f7a2c', '#5a9a3a', '#7cba4c', '#a2d468'],
    apple: ['#2f5a24', '#427a30', '#5c983c', '#7ab64c', '#a0d064'],
    birch: ['#46702c', '#5c8e36', '#76aa44', '#96c45a', '#bce07a'],
    pine: ['#1b3524', '#24452c', '#2f5a36', '#3f7244', '#56905a'],
    big: ['#2a5422', '#3c722c', '#56923a', '#76b24a', '#9ccc62'],
  },
  autumn: {
    oak: ['#4a2410', '#7a3812', '#a8561a', '#d0802a', '#eab04a'],
    apple: ['#4a3e14', '#6e5a1e', '#94782a', '#b8983a', '#d4b84e'],
    birch: ['#5e4a12', '#8e7018', '#be9a22', '#dcbc36', '#f2dc6a'],
    pine: ['#1d3424', '#26432c', '#305634', '#3e6c40', '#527e50'],
    big: ['#4e2010', '#7e3210', '#ae4c18', '#d47424', '#ee9e3e'],
  },
};

function makeBareTree(seed, kind, big) {
  const rng = mulberry32(seed + 77);
  const W = big ? 84 : 38, H = big ? 96 : 46;
  const [c, x] = makeCanvas(W, H);
  const cx = W / 2, base = H - 3;
  ellipseFill(x, cx, base, big ? 30 : 13, big ? 7 : 4, 'rgba(20,40,10,0.22)');
  const bark = kind === 'birch' ? '#d8d2c2' : '#5a3d24', dark = kind === 'birch' ? '#9a9484' : '#3e2816';
  const tw = big ? 10 : 4, th = big ? 38 : 18;
  x.fillStyle = bark; x.fillRect(Math.round(cx - tw / 2), base - th, tw, th);
  x.fillStyle = dark; x.fillRect(Math.round(cx + tw / 2 - 1), base - th, 1, th);
  const branch = (bx, by, ang, len, thick, depth) => {
    for (let s = 0; s < len; s++) {
      const px = Math.round(bx + Math.cos(ang) * s), py = Math.round(by + Math.sin(ang) * s);
      x.fillStyle = s < len * 0.5 ? bark : dark;
      x.fillRect(px, py, thick, 1);
    }
    if (depth <= 0) return;
    const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
    const n = depth > 1 ? 2 : 3;
    for (let k = 0; k < n; k++) branch(ex, ey, ang + (rng() - 0.5) * 1.3, len * (0.55 + rng() * 0.2), Math.max(1, thick - 1), depth - 1);
  };
  const top = base - th;
  const arms = big ? 7 : 4;
  for (let k = 0; k < arms; k++) {
    const a = -Math.PI / 2 + (k / (arms - 1) - 0.5) * 2.1 + (rng() - 0.5) * 0.3;
    branch(cx + (rng() - 0.5) * tw * 0.6, top + rng() * 4, a, big ? 16 + rng() * 8 : 7 + rng() * 4, big ? 3 : 2, big ? 3 : 2);
  }
  outlineCanvas(c, kind === 'birch' ? '#4a463c' : '#22160c', 160);
  return addSnow(c, 0, base - 4, 1, seed);
}

function makeTree(seed, kind, season = 'summer') {
  const big = kind === 'big';
  if (season === 'winter' && kind !== 'pine') return makeBareTree(seed, kind, big);
  const rng = mulberry32(seed);
  const W = big ? 84 : 38, H = big ? 96 : 46;
  const [c, x] = makeCanvas(W, H);
  const pal = TREE_PAL[season === 'winter' ? 'summer' : season][kind];
  const cx = W / 2, base = H - 3;
  // ground shadow
  ellipseFill(x, cx, base, big ? 30 : 13, big ? 7 : 4, 'rgba(20,40,10,0.22)');

  if (kind === 'pine') {
    const trunkH = 8;
    x.fillStyle = '#5a3a22'; x.fillRect(cx - 2, base - trunkH, 4, trunkH);
    x.fillStyle = '#3e2816'; x.fillRect(cx + 1, base - trunkH, 1, trunkH);
    for (let layer = 0; layer < 4; layer++) {
      const top = base - trunkH - 34 + layer * 8;
      const hh = 14;
      for (let j = 0; j < hh; j++) {
        const half = Math.round(3 + (j / hh) * (8 + layer * 2.5));
        for (let i = -half; i <= half; i++) {
          const t = (i + half) / (half * 2);
          let col = pal[2];
          if (t < 0.3) col = pal[3];
          if (t > 0.7) col = pal[1];
          if (j > hh - 3) col = pal[0];
          if (rng() < 0.08) col = pal[4];
          x.fillStyle = col; x.fillRect(cx + i, top + j, 1, 1);
        }
      }
    }
    outlineCanvas(c, '#14261a');
    return season === 'winter' ? addSnow(c, 0, base - 8, 2, seed) : c;
  }

  // trunk
  const tw = big ? 12 : 5, th = big ? 30 : 14;
  const trunkCol = kind === 'birch' ? '#e8e4d8' : '#6b4a2b';
  x.fillStyle = trunkCol; x.fillRect(Math.round(cx - tw / 2), base - th, tw, th);
  x.fillStyle = kind === 'birch' ? '#b8b2a2' : '#4a3220'; x.fillRect(Math.round(cx + tw / 2 - 2), base - th, 2, th);
  x.fillStyle = kind === 'birch' ? '#ffffff' : '#8a6440'; x.fillRect(Math.round(cx - tw / 2), base - th, 1, th);
  if (kind === 'birch') { x.fillStyle = '#3a3630'; for (let k = 0; k < 4; k++) x.fillRect(cx - 2 + (k % 2) * 2, base - 3 - k * 3, 2, 1); }
  x.fillStyle = kind === 'birch' ? '#cfc9b8' : '#5a3d24';
  x.fillRect(Math.round(cx - tw / 2) - 1, base - 2, 1, 2); x.fillRect(Math.round(cx + tw / 2), base - 2, 1, 2);
  if (big) { x.fillRect(cx - tw / 2 - 3, base - 1, 3, 1); x.fillRect(cx + tw / 2, base - 1, 4, 1); }

  // canopy blobs
  const R0 = big ? 34 : 15;
  const ccy = big ? 34 : 17;
  const blobs = [];
  const n = big ? 16 : 7;
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * R0 * 0.55;
    blobs.push({ x: cx + Math.cos(a) * d, y: ccy + Math.sin(a) * d * 0.75, r: Math.round(R0 * (0.38 + rng() * 0.22)) });
  }
  blobs.push({ x: cx, y: ccy, r: Math.round(R0 * 0.6) });
  blobs.sort((a, b) => a.y - b.y);
  for (const b of blobs) disc(x, b.x, b.y + 1, b.r, pal[0]);
  for (const b of blobs) disc(x, b.x - 1, b.y - 1, b.r - 1, pal[1]);
  for (const b of blobs) disc(x, b.x - 2, b.y - 2, Math.max(1, Math.round(b.r * 0.62)), pal[2]);
  for (const b of blobs) disc(x, b.x - 3, b.y - 4, Math.max(1, Math.round(b.r * 0.3)), pal[3]);
  const solidAt = (px, py) => px >= 0 && py >= 0 && px < W && py < H && x.getImageData(px, py, 1, 1).data[3] > 200;
  for (let k = 0; k < (big ? 260 : 50); k++) {
    const px = Math.round(cx + (rng() - 0.5) * R0 * 1.8), py = Math.round(ccy + (rng() - 0.6) * R0 * 1.3);
    if (solidAt(px, py)) { x.fillStyle = rng() < 0.5 ? pal[4] : pal[1]; x.fillRect(px, py, 1, 1); }
  }
  // spring blossom on fruit trees and some oaks
  if (season === 'spring' && (kind === 'apple' || (kind === 'oak' && rng() < 0.35) || big)) {
    const bcol = kind === 'apple' ? ['#ffd0e0', '#ffffff', '#ff9ec0'] : ['#fff6f0', '#ffe0ea'];
    for (let k = 0; k < (big ? 120 : 26); k++) {
      const px = Math.round(cx + (rng() - 0.5) * R0 * 1.7), py = Math.round(ccy + (rng() - 0.55) * R0 * 1.3);
      if (solidAt(px, py)) { x.fillStyle = bcol[k % bcol.length]; x.fillRect(px, py, 1, 1); if (rng() < 0.4) x.fillRect(px + 1, py, 1, 1); }
    }
  }
  if (kind === 'apple' && season !== 'spring') {
    const nApples = season === 'autumn' ? 14 : 7;
    for (let k = 0; k < nApples; k++) {
      const px = Math.round(cx + (rng() - 0.5) * R0 * 1.5), py = Math.round(ccy + (rng() - 0.3) * R0);
      if (solidAt(px, py)) { x.fillStyle = '#d23a2a'; x.fillRect(px, py, 2, 2); x.fillStyle = '#ff8a6a'; x.fillRect(px, py, 1, 1); }
    }
  }
  return outlineCanvas(c, season === 'autumn' ? '#3a1e0c' : '#18301a');
}

function makeBush(seed, season = 'summer') {
  const rng = mulberry32(seed);
  const [c, x] = makeCanvas(20, 16);
  ellipseFill(x, 10, 13, 8, 2, 'rgba(20,40,10,0.22)');
  const pal = season === 'autumn' ? ['#4a2a10', '#7a4a1a', '#a0682a', '#c08a3a'] : season === 'winter' ? ['#1e3a24', '#2e4a2e', '#3e5a3a', '#4e6a46'] : TREE_PAL[season === 'spring' ? 'spring' : 'summer'].oak;
  for (let i = 0; i < 4; i++) disc(x, 5 + i * 3.3, 9 - (i % 2) * 2, 4, pal[1]);
  for (let i = 0; i < 4; i++) disc(x, 4 + i * 3.3, 8 - (i % 2) * 2, 2, pal[2]);
  for (let k = 0; k < 10; k++) { x.fillStyle = pal[3]; x.fillRect(3 + rng() * 13 | 0, 4 + rng() * 6 | 0, 1, 1); }
  const r = rng();
  if (r < 0.5 && season !== 'winter') {
    const col = season === 'autumn' ? '#d83a2a' : r < 0.2 ? '#7a2a6a' : r < 0.35 ? '#f0e8f0' : '#e85a6a';
    for (let k = 0; k < 6; k++) { x.fillStyle = col; x.fillRect(3 + rng() * 14 | 0, 4 + rng() * 7 | 0, 1, 1); }
  }
  outlineCanvas(c, '#18301a');
  return season === 'winter' ? addSnow(c, 0, 12, 2, seed) : c;
}

function makeFlowerPatch(seed) {
  const rng = mulberry32(seed);
  const [c, x] = makeCanvas(18, 12);
  const cols = [['#f2d24a', '#fff2a0'], ['#e85a6a', '#ffb0b8'], ['#8a6ad8', '#c8b8ff'], ['#f4f0f4', '#ffffff'], ['#e8862a', '#ffc070'], ['#4a7ae8', '#a8c8ff']];
  const pick = [cols[Math.floor(rng() * cols.length)], cols[Math.floor(rng() * cols.length)]];
  for (let k = 0; k < 7; k++) {
    const px = 2 + Math.floor(rng() * 14), py = 3 + Math.floor(rng() * 6);
    x.fillStyle = '#3f7a32'; x.fillRect(px, py + 1, 1, 3);
    if (rng() < 0.5) x.fillRect(px + 1, py + 2, 1, 1);
    const [a, b] = pick[k % 2];
    x.fillStyle = a; x.fillRect(px - 1, py, 3, 1); x.fillRect(px, py - 1, 1, 3);
    x.fillStyle = b; x.fillRect(px, py, 1, 1);
  }
  return c;
}

// Crops: stage 0 bare, 1 sprout, 2 young, 3 growing, 4 ripe
const CROP_TYPES = ['cabbage', 'carrot', 'potato', 'tomato', 'pumpkin'];
function makeCrop(type, stage) {
  const [c, x] = makeCanvas(14, 14);
  const g1 = '#3f8a32', g2 = '#5aac44', g3 = '#2c6626';
  if (stage === 0) { x.fillStyle = '#5a3a22'; x.fillRect(4, 11, 6, 1); return c; }
  if (type === 'barley') {
    const h = [0, 3, 6, 9, 10][stage];
    const col = stage === 4 ? '#e2c05a' : stage === 3 ? '#a8b84a' : g2;
    for (let k = 0; k < 5; k++) {
      const px = 2 + k * 2 + (k % 2);
      x.fillStyle = stage === 4 ? '#c8a040' : g1; x.fillRect(px, 13 - h, 1, h);
      if (stage >= 3) { x.fillStyle = col; x.fillRect(px, 12 - h, 1, 3); x.fillRect(px + 1, 13 - h, 1, 1); }
    }
    return stage >= 3 ? outlineCanvas(c, '#4a3a14', 90) : c;
  }
  if (type === 'herb') {
    const s = [0, 2, 3, 4, 5][stage];
    disc(x, 7, 13 - s, s, '#3a7a4a'); disc(x, 6, 12 - s, Math.max(1, s - 2), '#6aaa6a');
    if (stage === 4) { x.fillStyle = '#b89ae8'; x.fillRect(5, 6, 1, 1); x.fillRect(8, 7, 1, 1); x.fillRect(7, 5, 1, 1); x.fillStyle = '#ffffff'; x.fillRect(9, 9, 1, 1); }
    return outlineCanvas(c, '#1e3a18', 120);
  }
  if (stage === 1) { x.fillStyle = g2; x.fillRect(6, 10, 1, 2); x.fillRect(7, 9, 1, 1); x.fillRect(5, 9, 1, 1); return c; }
  if (stage === 2) {
    x.fillStyle = g1; x.fillRect(5, 8, 1, 4); x.fillRect(8, 8, 1, 4); x.fillRect(6, 7, 2, 5);
    x.fillStyle = g2; x.fillRect(6, 7, 1, 2); return c;
  }
  const ripe = stage === 4;
  if (type === 'cabbage' || type === 'leaf') {
    const big = ripe ? 5 : 4;
    disc(x, 7, 13 - big, big, g3); disc(x, 7, 13 - big, big - 1, type === 'leaf' ? '#4f9a3a' : '#7cc05a');
    if (type === 'leaf') {
      x.fillStyle = '#2f6a26';
      for (let k = 0; k < 4; k++) x.fillRect(3 + k * 2, 7 + (k % 2), 1, 4);
      if (ripe) { x.fillStyle = '#d8c060'; x.fillRect(7, 3, 1, 1); x.fillRect(4, 5, 1, 1); x.fillRect(10, 5, 1, 1); }
    } else { x.fillStyle = '#a8e080'; x.fillRect(6, 13 - big - 1, 2, 2); }
  } else if (type === 'carrot') {
    x.fillStyle = g2; for (let k = 0; k < 3; k++) { x.fillRect(4 + k * 3, 5, 1, 6); x.fillRect(3 + k * 3, 5, 1, 1); x.fillRect(5 + k * 3, 6, 1, 1); }
    if (ripe) { x.fillStyle = '#e8762a'; for (let k = 0; k < 3; k++) x.fillRect(3 + k * 3, 11, 3, 2); }
  } else if (type === 'potato') {
    disc(x, 7, 8, ripe ? 4 : 3, g1); x.fillStyle = g2; x.fillRect(5, 6, 2, 2);
    if (ripe) { x.fillStyle = '#f0f0e0'; x.fillRect(5, 5, 1, 1); x.fillRect(9, 6, 1, 1); x.fillStyle = '#c8a060'; x.fillRect(3, 12, 3, 2); x.fillRect(9, 12, 3, 2); }
  } else if (type === 'tomato') {
    x.fillStyle = '#8a6a40'; x.fillRect(7, 1, 1, 12);
    x.fillStyle = g1; x.fillRect(4, 4, 7, 2); x.fillRect(5, 7, 5, 2); x.fillRect(4, 10, 6, 2);
    if (ripe) { x.fillStyle = '#d83a2a'; x.fillRect(4, 6, 2, 2); x.fillRect(9, 8, 2, 2); x.fillRect(5, 11, 2, 2); }
  } else if (type === 'pumpkin') {
    x.fillStyle = g1; x.fillRect(1, 9, 12, 2); x.fillStyle = g2; x.fillRect(2, 8, 3, 1); x.fillRect(9, 8, 3, 1);
    if (ripe) { disc(x, 7, 9, 4, '#d8782a'); x.fillStyle = '#f09a4a'; x.fillRect(5, 7, 2, 4); x.fillStyle = '#4a7a2a'; x.fillRect(7, 4, 1, 2); }
    else disc(x, 7, 10, 2, '#9ab83a');
  }
  return outlineCanvas(c, '#1e3a18', 140);
}

// ---------------------------------------------------------------------------
// Buildings and props
// ---------------------------------------------------------------------------
function makeInn(lit) {
  const W = 140, H = 116;
  const [c, x] = makeCanvas(W, H);
  const wallTop = 66, wallBot = 112, L = 10, Rr = 130;
  ellipseFill(x, 70, 113, 66, 4, 'rgba(20,40,10,0.25)');
  // walls
  x.fillStyle = '#ebe0c4'; x.fillRect(L, wallTop, Rr - L, wallBot - wallTop);
  x.fillStyle = '#d8ccae'; x.fillRect(L, wallTop, Rr - L, 3);
  x.fillStyle = '#8a8478'; x.fillRect(L, wallBot - 6, Rr - L, 6);
  for (let i = L; i < Rr; i += 6) { x.fillStyle = '#6e695f'; x.fillRect(i + ((i / 6) % 2) * 3, wallBot - 3, 1, 3); x.fillRect(i, wallBot - 6, 6, 1); }
  // timber frame
  x.fillStyle = '#5a3a22';
  for (const bx of [L, 34, 58, 82, 106, Rr - 3]) x.fillRect(bx, wallTop, 3, wallBot - wallTop - 6);
  x.fillRect(L, wallTop + 22, Rr - L, 3);
  for (const [a, b] of [[13, 34], [85, 106]]) for (let k = 0; k < 21; k++) { x.fillRect(a + Math.round(k * (b - a) / 21), wallTop + 22 - k, 2, 1); }
  for (const [a, b] of [[37, 58], [109, 130]]) for (let k = 0; k < 21; k++) { x.fillRect(b - Math.round(k * (b - a) / 21) - 2, wallTop + 22 - k, 2, 1); }
  // windows
  const glass = lit ? '#ffd77a' : '#41556a', glass2 = lit ? '#ffeeb0' : '#5a7088';
  for (const wx of [16, 40, 88, 112]) {
    x.fillStyle = '#4a2e1a'; x.fillRect(wx - 1, wallTop + 29, 14, 12);
    x.fillStyle = glass; x.fillRect(wx, wallTop + 30, 12, 10);
    x.fillStyle = glass2; x.fillRect(wx + 1, wallTop + 31, 3, 3);
    x.fillStyle = '#4a2e1a'; x.fillRect(wx + 5, wallTop + 30, 2, 10); x.fillRect(wx, wallTop + 34, 12, 1);
    x.fillStyle = '#7a5a3a'; x.fillRect(wx - 2, wallTop + 41, 16, 2);
    x.fillStyle = '#d8584a'; x.fillRect(wx, wallTop + 40, 2, 1); x.fillRect(wx + 6, wallTop + 40, 2, 1);
    x.fillStyle = '#f2d24a'; x.fillRect(wx + 3, wallTop + 40, 2, 1); x.fillRect(wx + 10, wallTop + 40, 2, 1);
  }
  // door
  x.fillStyle = '#3a2414'; x.fillRect(62, wallBot - 30, 16, 30);
  disc(x, 70, wallBot - 30, 8, '#3a2414');
  x.fillStyle = lit ? '#e8a84a' : '#6a4426'; x.fillRect(64, wallBot - 28, 12, 28);
  disc(x, 70, wallBot - 28, 6, lit ? '#e8a84a' : '#6a4426');
  if (!lit) { x.fillStyle = '#4e301a'; for (let k = 0; k < 4; k++) x.fillRect(65 + k * 3, wallBot - 30, 1, 30); x.fillStyle = '#e8c860'; x.fillRect(73, wallBot - 15, 2, 2); }
  // thatched roof
  const roofTop = 12, roofBot = 70;
  for (let y = roofTop; y < roofBot; y++) {
    const t = (y - roofTop) / (roofBot - roofTop);
    let half = 44 + t * 26;
    if (y < roofTop + 5) half -= (roofTop + 5 - y) * 1.6;
    const l = Math.round(70 - half), r = Math.round(70 + half);
    for (let i = l; i <= r; i++) {
      const band = Math.floor((y - roofTop) / 7);
      const inBand = (y - roofTop) % 7;
      let col = '#c9a04a';
      const h = hash2(i, band * 31);
      if (h < 0.3) col = '#b48a38';
      if (h > 0.85) col = '#e0be66';
      if (inBand === 6) col = '#94702a';
      if (i - l < 3 || y < roofTop + 2) col = '#e2c070';
      if (r - i < 3) col = '#8a6826';
      x.fillStyle = col; x.fillRect(i, y, 1, 1);
    }
  }
  x.fillStyle = '#7a5a20'; x.fillRect(0, roofBot - 1, 140, 2);
  // dormer
  disc(x, 70, 38, 8, '#a8822e'); disc(x, 70, 39, 5, '#4a2e1a'); disc(x, 70, 39, 4, glass);
  x.fillStyle = '#4a2e1a'; x.fillRect(70, 35, 1, 8); x.fillRect(66, 39, 9, 1);
  // chimneys
  for (const cxh of [30, 108]) {
    x.fillStyle = '#9a5a3a'; x.fillRect(cxh, 2, 9, 18);
    x.fillStyle = '#7a4028'; for (let k = 0; k < 6; k++) x.fillRect(cxh + (k % 2) * 4, 4 + k * 3, 5, 1);
    x.fillStyle = '#5a3a28'; x.fillRect(cxh - 1, 0, 11, 3);
  }
  // lanterns either side of the door
  for (const lx of [54, 82]) {
    x.fillStyle = '#2a1c12'; x.fillRect(lx, wallBot - 26, 4, 6);
    x.fillStyle = lit ? '#ffe08a' : '#8a7a5a'; x.fillRect(lx + 1, wallBot - 25, 2, 4);
  }
  return outlineCanvas(c, OUTLINE);
}

function makeInnSign() {
  const [c, x] = makeCanvas(22, 32);
  x.fillStyle = '#4a2e1a'; x.fillRect(2, 2, 2, 30); x.fillRect(2, 2, 18, 2);
  x.fillStyle = '#2a1c12'; x.fillRect(8, 4, 1, 3); x.fillRect(16, 4, 1, 3);
  x.fillStyle = '#7a4e2a'; x.fillRect(6, 7, 14, 12);
  x.fillStyle = '#e8d8b0'; x.fillRect(7, 8, 12, 10);
  // a little badger face
  x.fillStyle = '#2a2420'; x.fillRect(9, 10, 8, 6);
  x.fillStyle = '#f4f0e8'; x.fillRect(12, 9, 2, 7); x.fillRect(9, 13, 1, 1); x.fillRect(16, 13, 1, 1);
  x.fillStyle = '#1a1410'; x.fillRect(12, 15, 2, 1);
  return outlineCanvas(c, OUTLINE);
}

function makeMill() {
  const [c, x] = makeCanvas(70, 84);
  ellipseFill(x, 35, 80, 32, 4, 'rgba(20,40,10,0.25)');
  x.fillStyle = '#9a9488'; x.fillRect(6, 50, 58, 30);
  for (let j = 0; j < 6; j++) for (let i = 0; i < 10; i++) {
    x.fillStyle = hash2(i, j) < 0.5 ? '#88837a' : '#aaa498';
    x.fillRect(6 + i * 6 + (j % 2) * 3, 50 + j * 5, 5, 4);
  }
  x.fillStyle = '#b8936a'; x.fillRect(8, 30, 54, 20);
  x.fillStyle = '#6a4a2a'; for (let i = 8; i < 62; i += 5) x.fillRect(i, 30, 1, 20);
  // roof
  for (let y = 6; y < 34; y++) {
    const half = 12 + (y - 6) * 0.9;
    for (let i = Math.round(35 - half); i <= Math.round(35 + half); i++) {
      x.fillStyle = (y % 4 === 0) ? '#5a3a2a' : hash2(i, y) < 0.2 ? '#7a4a34' : '#8a5a3e';
      x.fillRect(i, y, 1, 1);
    }
  }
  x.fillStyle = '#3a2414'; x.fillRect(28, 62, 12, 18); x.fillStyle = '#6a4426'; x.fillRect(29, 63, 10, 17);
  x.fillStyle = '#41556a'; x.fillRect(14, 36, 8, 8); x.fillRect(48, 36, 8, 8);
  x.fillStyle = '#4a2e1a'; x.fillRect(17, 36, 2, 8); x.fillRect(51, 36, 2, 8);
  return outlineCanvas(c, OUTLINE);
}

// A tapering windmill tower with a timber cap; the sails are drawn turning.
function makeWindmill() {
  const [c, x] = makeCanvas(56, 96);
  ellipseFill(x, 28, 92, 24, 4, 'rgba(20,40,10,0.25)');
  for (let y = 24; y < 92; y++) {
    const half = 11 + (y - 24) * 0.17;
    for (let i = Math.round(28 - half); i <= Math.round(28 + half); i++) {
      const row = Math.floor((y - 24) / 5), h = hash2(Math.floor((i + (row % 2) * 3) / 6), row);
      let col = h < 0.5 ? '#c8c0b0' : '#d8d0c0';
      if ((y - 24) % 5 === 0) col = '#a09888';
      if (i - (28 - half) < 3) col = '#e8e2d4';
      if ((28 + half) - i < 3) col = '#a8a090';
      x.fillStyle = col; x.fillRect(i, y, 1, 1);
    }
  }
  // cap
  for (let y = 10; y < 26; y++) {
    const half = 4 + (y - 10) * 0.75;
    for (let i = Math.round(28 - half); i <= Math.round(28 + half); i++) { x.fillStyle = y % 3 === 0 ? '#5a3a2a' : '#7a4a34'; x.fillRect(i, y, 1, 1); }
  }
  x.fillStyle = '#3a2414'; x.fillRect(22, 74, 12, 18); disc(x, 28, 74, 6, '#3a2414');
  x.fillStyle = '#6a4426'; x.fillRect(23, 75, 10, 17); disc(x, 28, 75, 5, '#6a4426');
  x.fillStyle = '#41556a'; disc(x, 28, 50, 4, '#41556a'); x.fillStyle = '#4a2e1a'; x.fillRect(27, 46, 2, 9);
  x.fillStyle = '#41556a'; x.fillRect(20, 34, 5, 6); x.fillRect(31, 34, 5, 6);
  return outlineCanvas(c, OUTLINE);
}

function makeWell() {
  const [c, x] = makeCanvas(26, 32);
  ellipseFill(x, 13, 29, 11, 3, 'rgba(20,40,10,0.25)');
  x.fillStyle = '#5a3a22'; x.fillRect(3, 6, 2, 18); x.fillRect(21, 6, 2, 18);
  for (let y = 0; y < 8; y++) { x.fillStyle = y % 3 === 2 ? '#6a2a1a' : '#9a3a2a'; x.fillRect(1 + Math.max(0, 4 - y), y, 24 - Math.max(0, 4 - y) * 2, 1); }
  x.fillStyle = '#6a4a2a'; x.fillRect(5, 10, 16, 1); x.fillStyle = '#bba070'; x.fillRect(12, 11, 1, 6);
  x.fillStyle = '#7a5a3a'; x.fillRect(11, 16, 4, 3);
  ellipseFill(x, 13, 22, 10, 3, '#8a8478');
  ellipseFill(x, 13, 21, 7, 2, '#2a3a4a');
  x.fillStyle = '#8a8478'; x.fillRect(3, 22, 21, 6);
  for (let i = 0; i < 5; i++) { x.fillStyle = '#6e695f'; x.fillRect(4 + i * 4 + (i % 2), 23, 1, 4); x.fillRect(3, 25, 21, 1); }
  return outlineCanvas(c, OUTLINE);
}

function makeStall() {
  const [c, x] = makeCanvas(42, 34);
  ellipseFill(x, 21, 31, 18, 3, 'rgba(20,40,10,0.25)');
  x.fillStyle = '#5a3a22'; x.fillRect(3, 8, 2, 24); x.fillRect(37, 8, 2, 24);
  for (let i = 0; i < 40; i++) {
    x.fillStyle = Math.floor(i / 5) % 2 ? '#f0e6d0' : '#c84a3a';
    x.fillRect(1 + i, 4, 1, 7);
    if (i % 5 === 2) x.fillRect(1 + i, 11, 1, 1);
  }
  x.fillStyle = '#7a5a3a'; x.fillRect(4, 20, 34, 3); x.fillStyle = '#6a4a2a'; x.fillRect(5, 23, 32, 7);
  const goods = [['#d83a2a', 6], ['#e8862a', 13], ['#7cc05a', 20], ['#c8a060', 27], ['#f2d24a', 33]];
  for (const [col, gx] of goods) { x.fillStyle = col; x.fillRect(gx, 17, 4, 3); x.fillRect(gx + 1, 16, 2, 1); }
  return outlineCanvas(c, OUTLINE);
}

function makeBench() {
  const [c, x] = makeCanvas(20, 12);
  x.fillStyle = '#6a4426'; x.fillRect(2, 1, 16, 3); x.fillStyle = '#8a5e36'; x.fillRect(2, 1, 16, 1);
  x.fillStyle = '#4a2e1a'; x.fillRect(3, 4, 2, 7); x.fillRect(15, 4, 2, 7);
  x.fillStyle = '#7a5030'; x.fillRect(1, 6, 18, 2); x.fillStyle = '#9a6a40'; x.fillRect(1, 6, 18, 1);
  return outlineCanvas(c, OUTLINE);
}

function makeTable() {
  const [c, x] = makeCanvas(28, 16);
  ellipseFill(x, 14, 13, 12, 2, 'rgba(20,40,10,0.2)');
  x.fillStyle = '#4a2e1a'; x.fillRect(4, 6, 2, 8); x.fillRect(22, 6, 2, 8);
  x.fillStyle = '#7a5030'; x.fillRect(1, 3, 26, 4); x.fillStyle = '#9a6a40'; x.fillRect(1, 3, 26, 1);
  x.fillStyle = '#c9a46a'; x.fillRect(7, 0, 3, 3); x.fillRect(18, 0, 3, 3);
  x.fillStyle = '#f4f0e0'; x.fillRect(7, 0, 3, 1); x.fillRect(18, 0, 3, 1);
  return outlineCanvas(c, OUTLINE);
}

function makeLampPost() {
  const [c, x] = makeCanvas(8, 26);
  x.fillStyle = '#3a2a1a'; x.fillRect(3, 6, 2, 19); x.fillRect(1, 24, 6, 2);
  x.fillStyle = '#2a1c12'; x.fillRect(1, 0, 6, 7);
  x.fillStyle = '#e8c86a'; x.fillRect(2, 2, 4, 4);
  return c;
}

function makeSignpost() {
  const [c, x] = makeCanvas(24, 26);
  x.fillStyle = '#5a3a22'; x.fillRect(11, 2, 2, 24);
  x.fillStyle = '#8a6440'; x.fillRect(2, 4, 16, 5); x.fillRect(6, 11, 16, 5);
  x.fillStyle = '#8a6440'; x.fillRect(1, 5, 1, 3); x.fillRect(22, 12, 1, 3);
  x.fillStyle = '#3a2414'; x.fillRect(5, 6, 9, 1); x.fillRect(9, 13, 10, 1);
  return outlineCanvas(c, OUTLINE);
}

function makeMailbox(col) {
  const [c, x] = makeCanvas(8, 14);
  x.fillStyle = '#5a3a22'; x.fillRect(3, 5, 2, 9);
  x.fillStyle = col; x.fillRect(0, 0, 8, 6); x.fillStyle = shade(col, 0.3); x.fillRect(0, 0, 8, 1);
  x.fillStyle = shade(col, -0.4); x.fillRect(1, 2, 6, 1);
  return outlineCanvas(c, OUTLINE);
}

function makeBarrel() {
  const [c, x] = makeCanvas(10, 13);
  x.fillStyle = '#7a4e2a'; x.fillRect(1, 1, 8, 11); x.fillStyle = '#9a6a3a'; x.fillRect(2, 1, 2, 11);
  x.fillStyle = '#3a3a3a'; x.fillRect(1, 3, 8, 1); x.fillRect(1, 9, 8, 1);
  x.fillStyle = '#5a3a1e'; x.fillRect(1, 0, 8, 1);
  return outlineCanvas(c, OUTLINE);
}

function makeHay() {
  const [c, x] = makeCanvas(18, 12);
  x.fillStyle = '#d8b04a'; x.fillRect(1, 2, 16, 9);
  for (let i = 0; i < 16; i++) { x.fillStyle = hash2(i, 3) < 0.4 ? '#b8902a' : '#e8c86a'; x.fillRect(1 + i, 2 + (i % 3), 1, 6); }
  x.fillStyle = '#8a6a2a'; x.fillRect(5, 2, 1, 9); x.fillRect(12, 2, 1, 9);
  return outlineCanvas(c, OUTLINE);
}

function makeWoodpile() {
  const [c, x] = makeCanvas(18, 11);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4 - (j > 1 ? 1 : 0); i++) {
    const px = 1 + i * 4 + j * 2, py = 7 - j * 3;
    disc(x, px + 1.5, py + 1.5, 2, '#7a5030'); x.fillStyle = '#d8b07a'; x.fillRect(px + 1, py + 1, 2, 2);
  }
  return outlineCanvas(c, OUTLINE);
}

function makeFence(horizontal) {
  if (horizontal) {
    const [c, x] = makeCanvas(16, 10);
    x.fillStyle = '#7a5a3a'; x.fillRect(0, 3, 16, 2); x.fillRect(0, 6, 16, 1);
    x.fillStyle = '#5a3a22'; x.fillRect(1, 1, 2, 9);
    x.fillStyle = '#9a7a52'; x.fillRect(1, 1, 2, 1);
    return c;
  }
  const [c, x] = makeCanvas(4, 18);
  x.fillStyle = '#7a5a3a'; x.fillRect(1, 0, 2, 18);
  x.fillStyle = '#5a3a22'; x.fillRect(0, 0, 4, 3);
  return c;
}

function makeMushrooms() {
  const [c, x] = makeCanvas(12, 8);
  const put = (px, py, cap) => {
    x.fillStyle = '#f0e6d0'; x.fillRect(px + 1, py + 2, 1, 2);
    x.fillStyle = cap; x.fillRect(px, py, 3, 2); x.fillRect(px + 1, py - 1, 1, 1);
    if (cap === '#c83a2a') { x.fillStyle = '#ffffff'; x.fillRect(px + 1, py, 1, 1); }
  };
  put(1, 3, '#c8925a'); put(5, 4, '#c83a2a'); put(8, 2, '#a87a4a');
  return c;
}

function makeDuck(frame) {
  const [c, x] = makeCanvas(9, 7);
  x.fillStyle = '#f4f0e0'; x.fillRect(1, 3, 6, 3); x.fillRect(5, 1, 3, 3);
  x.fillStyle = '#e8a03a'; x.fillRect(8, 2, 1, 1);
  x.fillStyle = '#2a1c12'; x.fillRect(6, 2, 1, 1);
  x.fillStyle = '#d8d0b8'; x.fillRect(2, 3, 3, 1);
  if (frame) { x.fillStyle = '#9ac0e0'; x.fillRect(0, 6, 3, 1); }
  return c;
}

// ---------------------------------------------------------------------------
// Workshops: a thatched (or slate) cottage with a trade sign.
// opts: { w, wall, roof: 'thatch'|'slate'|'barn', sign, lit, windows: [x], door: x, chimneys: [x], extra }
// The returned canvas has the door centred at opts.door, bottom of the walls at h-4.
// ---------------------------------------------------------------------------
function makeCottage(opts) {
  const W = opts.w, H = opts.h || 92;
  const [c, x] = makeCanvas(W, H);
  const lit = !!opts.lit;
  const L = 6, Rr = W - 6, wallBot = H - 4, wallTop = Math.round(H * 0.56);
  ellipseFill(x, W / 2, H - 3, W / 2 - 4, 3, 'rgba(20,40,10,0.25)');
  const barn = opts.roof === 'barn';
  // walls
  if (barn) {
    x.fillStyle = '#9a3a2a'; x.fillRect(L, wallTop, Rr - L, wallBot - wallTop);
    x.fillStyle = '#7a2a1e'; for (let i = L; i < Rr; i += 4) x.fillRect(i, wallTop, 1, wallBot - wallTop);
    x.fillStyle = '#efe6cf'; x.fillRect(L, wallTop, Rr - L, 2); x.fillRect(L, wallBot - 2, Rr - L, 2);
  } else {
    x.fillStyle = opts.wall || '#ebe0c4'; x.fillRect(L, wallTop, Rr - L, wallBot - wallTop);
    x.fillStyle = shade(opts.wall || '#ebe0c4', -0.08); x.fillRect(L, wallTop, Rr - L, 3);
    x.fillStyle = '#8a8478'; x.fillRect(L, wallBot - 5, Rr - L, 5);
    for (let i = L; i < Rr; i += 6) { x.fillStyle = '#6e695f'; x.fillRect(i + ((i / 6) % 2) * 3, wallBot - 3, 1, 3); x.fillRect(i, wallBot - 5, 6, 1); }
    x.fillStyle = '#5a3a22';
    for (let bx = L; bx < Rr; bx += 22) x.fillRect(bx, wallTop, 3, wallBot - wallTop - 5);
    x.fillRect(Rr - 3, wallTop, 3, wallBot - wallTop - 5);
    x.fillRect(L, wallTop + 14, Rr - L, 2);
  }
  // windows
  const glass = lit ? '#ffd77a' : '#41556a', glass2 = lit ? '#ffeeb0' : '#5a7088';
  for (const wx of opts.windows || []) {
    const wy = wallTop + (barn ? 6 : 18);
    x.fillStyle = '#4a2e1a'; x.fillRect(wx - 1, wy - 1, 12, 11);
    x.fillStyle = glass; x.fillRect(wx, wy, 10, 9);
    x.fillStyle = glass2; x.fillRect(wx + 1, wy + 1, 2, 2);
    x.fillStyle = '#4a2e1a'; x.fillRect(wx + 4, wy, 2, 9); x.fillRect(wx, wy + 4, 10, 1);
    if (!barn) { x.fillStyle = '#7a5a3a'; x.fillRect(wx - 2, wy + 9, 14, 2); x.fillStyle = '#d8584a'; x.fillRect(wx, wy + 8, 2, 1); x.fillStyle = '#f2d24a'; x.fillRect(wx + 5, wy + 8, 2, 1); }
  }
  // door
  const dx = opts.door;
  if (barn) {
    x.fillStyle = '#3a2414'; x.fillRect(dx - 13, wallBot - 26, 26, 26);
    x.fillStyle = lit ? '#e8a84a' : '#7a3424'; x.fillRect(dx - 12, wallBot - 25, 11, 25); x.fillRect(dx + 1, wallBot - 25, 11, 25);
    x.fillStyle = '#efe6cf';
    for (const sx of [dx - 12, dx + 1]) { for (let k = 0; k < 11; k++) { x.fillRect(sx + k, wallBot - 25 + Math.round(k * 25 / 11), 1, 1); x.fillRect(sx + 10 - k, wallBot - 25 + Math.round(k * 25 / 11), 1, 1); } }
  } else {
    x.fillStyle = '#3a2414'; x.fillRect(dx - 7, wallBot - 22, 14, 22); disc(x, dx, wallBot - 22, 7, '#3a2414');
    x.fillStyle = lit ? '#e8a84a' : (opts.doorCol || '#6a4426'); x.fillRect(dx - 5, wallBot - 20, 10, 20); disc(x, dx, wallBot - 20, 5, lit ? '#e8a84a' : (opts.doorCol || '#6a4426'));
    if (!lit) { x.fillStyle = '#e8c860'; x.fillRect(dx + 2, wallBot - 10, 2, 2); }
  }
  // roof
  const roofTop = 10, roofBot = wallTop + 4, mid = W / 2;
  for (let y = roofTop; y < roofBot; y++) {
    const t = (y - roofTop) / (roofBot - roofTop);
    let half = (W / 2 - 18) + t * 18;
    if (y < roofTop + 4) half -= (roofTop + 4 - y) * 1.6;
    const l = Math.round(mid - half), r = Math.round(mid + half);
    for (let i = l; i <= r; i++) {
      let col;
      if (opts.roof === 'thatch') {
        const band = Math.floor((y - roofTop) / 6), h = hash2(i, band * 31 + W);
        col = h < 0.3 ? '#b48a38' : h > 0.85 ? '#e0be66' : '#c9a04a';
        if ((y - roofTop) % 6 === 5) col = '#94702a';
        if (i - l < 3 || y < roofTop + 2) col = '#e2c070';
        if (r - i < 3) col = '#8a6826';
      } else {
        const row = Math.floor((y - roofTop) / 4), h = hash2(Math.floor((i + (row % 2) * 3) / 6), row + W);
        col = barn ? (h < 0.5 ? '#6a6a72' : '#7a7a84') : (h < 0.5 ? '#5a6a7a' : '#6a7a8a');
        if ((y - roofTop) % 4 === 3) col = barn ? '#4a4a52' : '#3e4a58';
        if (i - l < 2) col = '#8a9aa8';
        if (r - i < 2) col = '#3a4450';
      }
      x.fillStyle = col; x.fillRect(i, y, 1, 1);
    }
  }
  if (barn) { x.fillStyle = '#efe6cf'; disc(x, mid, roofTop + 14, 5, '#efe6cf'); disc(x, mid, roofTop + 14, 4, lit ? '#ffd77a' : '#3a2414'); }
  // chimneys
  for (const cxh of opts.chimneys || []) {
    x.fillStyle = '#9a5a3a'; x.fillRect(cxh, 2, 7, 16);
    x.fillStyle = '#7a4028'; for (let k = 0; k < 5; k++) x.fillRect(cxh + (k % 2) * 3, 4 + k * 3, 4, 1);
    x.fillStyle = '#5a3a28'; x.fillRect(cxh - 1, 0, 9, 3);
  }
  // hanging trade sign
  if (opts.sign) {
    const sx = dx - (barn ? 26 : 22), sy = wallBot - 30;
    x.fillStyle = '#4a2e1a'; x.fillRect(sx, sy, 12, 1); x.fillRect(sx + 1, sy, 1, 3); x.fillRect(sx + 10, sy, 1, 3);
    x.fillStyle = '#7a4e2a'; x.fillRect(sx - 1, sy + 3, 14, 12);
    x.fillStyle = '#e8d8b0'; x.fillRect(sx, sy + 4, 12, 10);
    const ic = ICONS[opts.sign];
    if (ic) x.drawImage(ic, sx + 1, sy + 4);
  }
  if (opts.extra) opts.extra(x, { L, Rr, wallTop, wallBot, W, H, lit });
  outlineCanvas(c, OUTLINE);
  return c;
}

function makeBeehive() {
  const [c, x] = makeCanvas(12, 14);
  ellipseFill(x, 6, 12, 5, 1, 'rgba(20,40,10,0.25)');
  x.fillStyle = '#5a3a22'; x.fillRect(1, 11, 10, 2);
  for (let j = 0; j < 9; j++) {
    const half = Math.round(Math.sqrt(1 - Math.pow((9 - j) / 10, 2)) * 5);
    for (let i = 6 - half; i <= 5 + half; i++) { x.fillStyle = j % 3 === 2 ? '#a07a2a' : '#d8b04a'; x.fillRect(i, 2 + j, 1, 1); }
  }
  x.fillStyle = '#2a1c12'; x.fillRect(5, 9, 2, 2);
  return outlineCanvas(c, OUTLINE);
}

function makeScarecrow() {
  const [c, x] = makeCanvas(16, 24);
  x.fillStyle = '#6a4a2a'; x.fillRect(7, 6, 2, 18); x.fillRect(1, 9, 14, 2);
  x.fillStyle = '#a0522d'; x.fillRect(4, 8, 8, 8);
  x.fillStyle = '#d8b04a'; x.fillRect(2, 11, 2, 2); x.fillRect(12, 11, 2, 2); x.fillRect(6, 16, 4, 2);
  x.fillStyle = '#e8d8b0'; x.fillRect(5, 2, 6, 6);
  x.fillStyle = '#2a1c12'; x.fillRect(6, 4, 1, 1); x.fillRect(9, 4, 1, 1); x.fillRect(7, 6, 2, 1);
  x.fillStyle = '#4a3a2a'; x.fillRect(3, 1, 10, 2); x.fillRect(5, 0, 6, 1);
  return outlineCanvas(c, OUTLINE);
}

function makeNoticeBoard() {
  const [c, x] = makeCanvas(22, 24);
  x.fillStyle = '#5a3a22'; x.fillRect(2, 6, 2, 18); x.fillRect(18, 6, 2, 18);
  x.fillStyle = '#7a5030'; x.fillRect(0, 2, 22, 14); x.fillStyle = '#9a6a40'; x.fillRect(0, 2, 22, 1);
  x.fillStyle = '#3a2414'; x.fillRect(0, 0, 22, 3);
  x.fillStyle = '#f4efe2'; x.fillRect(3, 5, 6, 7); x.fillRect(11, 6, 7, 5);
  x.fillStyle = '#8a6a48'; x.fillRect(4, 7, 4, 1); x.fillRect(4, 9, 3, 1); x.fillRect(12, 8, 5, 1);
  x.fillStyle = '#d83a2a'; x.fillRect(6, 5, 1, 1); x.fillRect(14, 6, 1, 1);
  return outlineCanvas(c, OUTLINE);
}

function makeLogSeat() {
  const [c, x] = makeCanvas(18, 9);
  ellipseFill(x, 9, 7, 8, 1, 'rgba(20,40,10,0.25)');
  x.fillStyle = '#6a4426'; x.fillRect(1, 2, 16, 5); x.fillStyle = '#8a5e36'; x.fillRect(1, 2, 16, 1);
  disc(x, 2, 4, 2, '#c8a070'); x.fillStyle = '#9a7048'; x.fillRect(2, 4, 1, 1);
  return outlineCanvas(c, OUTLINE);
}

function makeMaypole() {
  const [c, x] = makeCanvas(26, 56);
  x.fillStyle = '#e8e0d0'; x.fillRect(12, 4, 2, 52);
  x.fillStyle = '#d83a2a'; for (let y = 6; y < 54; y += 6) x.fillRect(12, y, 2, 2);
  const cols = ['#ff6a5a', '#ffd34a', '#6ad0ff', '#9aff7a', '#ff9ae0'];
  cols.forEach((col, i) => {
    x.fillStyle = col;
    const ex = 2 + i * 5.5;
    for (let k = 0; k < 20; k++) x.fillRect(Math.round(lerp(13, ex, k / 20)), Math.round(4 + k * 1.6 + Math.sin(k * 0.6 + i) * 1.2), 1, 1);
  });
  disc(x, 13, 4, 3, '#f2d24a'); x.fillStyle = '#4f9a3a'; x.fillRect(10, 1, 7, 2);
  return c;
}

function makeConstruction() {
  const [c, x] = makeCanvas(40, 28);
  ellipseFill(x, 20, 25, 18, 2, 'rgba(20,40,10,0.2)');
  x.fillStyle = '#c9a46a'; for (const sx of [3, 14, 25, 36]) x.fillRect(sx, 4, 2, 22);
  x.fillStyle = '#a07a50'; x.fillRect(2, 8, 37, 2); x.fillRect(2, 16, 37, 2);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4 - j; i++) { disc(x, 8 + i * 5 + j * 2.5, 23 - j * 4, 2, '#7a5030'); x.fillStyle = '#d8b07a'; x.fillRect(7 + i * 5 + j * 2.5, 22 - j * 4, 2, 2); }
  return outlineCanvas(c, OUTLINE);
}

function makeHenhouse() {
  const [c, x] = makeCanvas(26, 24);
  ellipseFill(x, 13, 22, 11, 2, 'rgba(20,40,10,0.25)');
  x.fillStyle = '#8a5a3a'; x.fillRect(3, 10, 20, 11);
  x.fillStyle = '#6a4426'; for (let i = 3; i < 23; i += 3) x.fillRect(i, 10, 1, 11);
  x.fillStyle = '#3a2414'; x.fillRect(11, 15, 5, 6);
  x.fillStyle = '#c84a3a'; for (let y = 2; y < 11; y++) { const h = (y - 2) * 1.5 + 3; x.fillRect(Math.round(13 - h), y, Math.round(h * 2), 1); }
  x.fillStyle = '#5a3a22'; x.fillRect(4, 21, 2, 3); x.fillRect(20, 21, 2, 3);
  return outlineCanvas(c, OUTLINE);
}

// ---------------------------------------------------------------------------
// Critters
// ---------------------------------------------------------------------------
function makeRabbit(frame) {
  const rows = frame ? ['.....ww.', '.....ww.', '..bbbbbe', '.bbbbbbb', 'wbbbbbb.', '.bb..bb.', '........']
    : ['......w.', '.....ww.', '..bbbbbe', 'wbbbbbbb', '.bbbbbb.', '..bb.b..', '.b.....b'];
  return finishSprite(rows, { b: '#a08060', w: '#d8c8b0', e: '#2a1c12' });
}
function makeCrow(frame) {
  const rows = frame ? ['k.....k', 'kk...kk', '.kkkkk.', '..kkky.', '.......'] : ['.......', '...kk..', '.kkkkky', 'kkkkk..', '..k.k..'];
  return spriteFrom(rows, { k: '#24242c', y: '#e8a03a' });
}
// Farm animals, side-on and facing right; two frames each for a little bob.
function makeSheep(frame, coat = 0) {
  const legs = frame ? ['..k..k.k..k.', '..k..k.k..k.'] : ['..k.k..k.k..', '..k.k..k.k..'];
  const rows = ['...wwwww....', '.wwWwwwwwkk.', 'wwwwwwwWwkkk', 'wWwwwwwwwkek', 'wwwwwWwwwkk.', '.wwwwwwww...'].concat(legs);
  const wool = ['#f2eee4', '#e8e0cc', '#4a4440'][coat];
  return finishSprite(rows, { w: wool, W: shade(wool, -0.12), k: coat === 2 ? '#1a1614' : '#3a3230', e: '#ffffff' });
}
function makeCow(frame, coat = 0) {
  const legs = frame ? ['.w.ww....ww.w..', '.k.kk....kk.k..'] : ['.ww.w....w.ww..', '.kk.k....k.kk..'];
  const rows = ['............h.h', '.wwbbbwwwbbwwww', 'wwwbbbwwwbbwwew', 'wwwwwwwwwwwwwnn', 'wwbbwwwwbbwwwnn', '.wwwwwwwwwwww..'].concat(legs);
  const patch = ['#3a3230', '#8a5a3a', '#6a4a2a'][coat];
  return finishSprite(rows, { w: coat === 2 ? '#c8945a' : '#f4f0e8', b: patch, e: '#1a1410', n: '#e8a0a0', h: '#e8dcc0', k: '#2a2420' });
}
function makePig(frame) {
  const legs = frame ? ['..p.p..p.p.'] : ['.p.p..p.p..'];
  const rows = ['.......PP..', '.pppppppp..', 'pppppppppPp', 'ppppppppepn', 'pppppppppnn', '.pppppppp..'].concat(legs);
  return finishSprite(rows, { p: '#f0b0a8', P: '#d88a84', e: '#2a1c12', n: '#d87a78' });
}
function makeTrough() {
  const [c, x] = makeCanvas(18, 9);
  x.fillStyle = '#5a3a22'; x.fillRect(1, 2, 16, 6); x.fillStyle = '#7a5030'; x.fillRect(1, 2, 16, 2);
  x.fillStyle = '#5d9fcf'; x.fillRect(3, 3, 12, 1);
  x.fillStyle = '#3a2414'; x.fillRect(2, 8, 2, 1); x.fillRect(14, 8, 2, 1);
  return outlineCanvas(c, OUTLINE);
}
function makeShelter() {
  const [c, x] = makeCanvas(30, 24);
  x.fillStyle = '#5a3a22'; x.fillRect(3, 10, 2, 13); x.fillRect(25, 10, 2, 13);
  x.fillStyle = '#3a2414'; x.fillRect(5, 12, 20, 11);
  for (let y = 4; y < 12; y++) for (let i = 1; i < 29; i++) { x.fillStyle = (y + i) % 5 === 0 ? '#94702a' : '#c9a04a'; x.fillRect(i, y - Math.floor(Math.abs(i - 15) / 5), 1, 1); }
  return outlineCanvas(c, OUTLINE);
}
function makeBarrow() {
  const [c, x] = makeCanvas(20, 12);
  x.fillStyle = '#7a5030'; x.fillRect(3, 3, 11, 5); x.fillStyle = '#5a3a22'; x.fillRect(3, 3, 11, 1);
  x.fillStyle = '#4a8a3a'; x.fillRect(5, 2, 2, 2); x.fillStyle = '#e8762a'; x.fillRect(9, 2, 2, 2);
  x.fillStyle = '#5a3a22'; x.fillRect(13, 5, 6, 1); x.fillRect(5, 8, 1, 3); disc(x, 11, 9, 2, '#3a2414');
  return outlineCanvas(c, OUTLINE);
}

function makeHen(frame) {
  const rows = frame ? ['...rr..', '..www..', '..wewy.', 'wwwww..', '.wwww..', '..y.y..'] : ['..rr...', '.www...', '.weyy..', 'wwwww..', '.wwww..', '.y..y..'];
  return finishSprite(rows, { w: '#f4f0e0', r: '#d83a2a', e: '#2a1c12', y: '#e8a03a' });
}

// ---------------------------------------------------------------------------
// Items the player can drop + small icons
// ---------------------------------------------------------------------------
function makeItem(kind) {
  if (kind === 'cake') {
    const [c, x] = makeCanvas(14, 10);
    ellipseFill(x, 7, 8, 6, 1, '#f4f0e8');
    x.fillStyle = '#c8945a'; x.fillRect(2, 3, 10, 5); x.fillStyle = '#e8c48a'; x.fillRect(2, 2, 10, 2);
    x.fillStyle = '#7a4a2a'; for (let k = 0; k < 5; k++) x.fillRect(3 + k * 2, 5, 1, 1);
    x.fillStyle = '#ffffff'; x.fillRect(4, 2, 6, 1);
    x.fillStyle = '#d83a2a'; x.fillRect(6, 1, 2, 1);
    return outlineCanvas(c, OUTLINE);
  }
  if (kind === 'ale') {
    const [c, x] = makeCanvas(14, 14);
    x.fillStyle = '#7a4e2a'; x.fillRect(2, 3, 10, 10); x.fillStyle = '#9a6a3a'; x.fillRect(3, 3, 2, 10);
    x.fillStyle = '#3a3a3a'; x.fillRect(2, 5, 10, 1); x.fillRect(2, 10, 10, 1);
    x.fillStyle = '#c9a46a'; x.fillRect(5, 0, 4, 3); x.fillStyle = '#ffffff'; x.fillRect(5, 0, 4, 1);
    x.fillStyle = '#b0b0b0'; x.fillRect(12, 8, 2, 1);
    return outlineCanvas(c, OUTLINE);
  }
  if (kind === 'leaf') {
    const [c, x] = makeCanvas(10, 10);
    x.fillStyle = '#8a6440'; x.fillRect(2, 3, 6, 6); x.fillStyle = '#a87a4a'; x.fillRect(2, 3, 2, 6);
    x.fillStyle = '#5a3a22'; x.fillRect(2, 3, 6, 1);
    x.fillStyle = '#5aa040'; x.fillRect(4, 0, 1, 3); x.fillRect(5, 1, 2, 1); x.fillRect(3, 1, 1, 1);
    return outlineCanvas(c, OUTLINE);
  }
  if (kind === 'remedy') {
    const [c, x] = makeCanvas(9, 12);
    x.fillStyle = '#8a6440'; x.fillRect(3, 0, 3, 2);
    x.fillStyle = '#3a9a6a'; x.fillRect(3, 2, 3, 2); x.fillRect(1, 4, 7, 7);
    x.fillStyle = '#7ad8a0'; x.fillRect(2, 5, 2, 3);
    x.fillStyle = '#f4efe2'; x.fillRect(2, 8, 5, 2);
    return outlineCanvas(c, OUTLINE);
  }
  if (kind === 'book') {
    const [c, x] = makeCanvas(14, 10);
    x.fillStyle = '#8b2e2e'; x.fillRect(1, 1, 12, 8);
    x.fillStyle = '#f4f0e8'; x.fillRect(2, 2, 4, 6); x.fillRect(8, 2, 4, 6);
    x.fillStyle = '#8a6a48'; for (let k = 0; k < 3; k++) { x.fillRect(3, 3 + k * 2, 2, 1); x.fillRect(9, 3 + k * 2, 2, 1); }
    x.fillStyle = '#5a1e1e'; x.fillRect(6, 1, 2, 8);
    return outlineCanvas(c, OUTLINE);
  }
  return null;
}

const ICON_ROWS = {
  plate: ['.........', '.........', '..wwwww..', '.wwyyyww.', '.wyyyyyw.', '.wwyyyww.', '..wwwww..', '.........', '.........'],
  mug: ['.........', '..ffff...', '.bbbbbb..', '.bccccbbb', '.bccccb.b', '.bccccbbb', '.bccccb..', '.bbbbbb..', '.........'],
  pipe: ['.........', '.........', '.....bb..', '....bkkb.', 'bbbbbkkb.', '.....bb..', '.........', '.........', '.........'],
  zzz: ['.........', '.zzzz....', '...z.....', '..z......', '.zzzz.zz.', '.......z.', '......zz.', '.........', '.........'],
  hoe: ['.........', '.......g.', '......ggg', '.....bg..', '....b....', '...b.....', '..b......', '.b.......', '.........'],
  fish: ['.........', '.........', '..ccc..c.', '.ccccc.c.', 'cckcccccc', '.ccccc.c.', '..ccc..c.', '.........', '.........'],
  heart: ['.........', '.rr...rr.', 'rrrr.rrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....', '.........'],
  note: ['.........', '....kkkk.', '....k..k.', '....k..k.', '....k..k.', '..kkk.kk.', '.kkkk.kk.', '..kk.....', '.........'],
  chat: ['.........', '.........', '.........', '.k..k..k.', '.........', '.........', '.........', '.........', '.........'],
  leaf: ['.........', '.....gg..', '...ggggg.', '..gggGgg.', '.ggGgggg.', '.gGgggg..', '.Ggggg...', 'G........', '.........'],
  book: ['.........', '.........', '.rrr.rrr.', 'rwwwrwwwr', 'rwwwrwwwr', 'rwwwrwwwr', 'rrrrrrrrr', '.........', '.........'],
  spark: ['....y....', '....y....', '.y..y..y.', '..y.y.y..', 'yyyyoyyyy', '..y.y.y..', '.y..y..y.', '....y....', '....y....'],
  cup: ['.........', '.........', '..ccccc..', '..cbbbc..', '..cbbbc..', '..ccccc..', '...ccc...', '.........', '.........'],
  shroom: ['.........', '...rrr...', '..rwrrr..', '.rrrrwrr.', '...ww....', '...ww....', '...ww....', '.........', '.........'],
  basket: ['.........', '...bbb...', '..b...b..', '.yrygyry.', '.bbbbbbb.', '.bBbBbBb.', '..bbbbb..', '.........', '.........'],
  dance: ['.........', '....k....', '...kkk...', '..k.k.k..', '....k....', '...k.k...', '..k...k..', '.........', '.........'],
  pack: ['.........', '...bbb...', '..bBBBb..', '..bBBBb..', '..bbbbb..', '..bBBBb..', '..bbbbb..', '.........', '.........'],
  house: ['....k....', '...kkk...', '..kkkkk..', '.kkkkkkk.', '..kgggk..', '..kgkgk..', '..kgkgk..', '.........', '.........'],
  hmph: ['.........', '..kk.kk..', '.k..k..k.', '.........', '..kkkkk..', '.k.....k.', '.........', '.........', '.........'],
  axe: ['.........', '..ggg....', '.gggg....', '.ggbb....', '..g.b....', '....b....', '.....b...', '......b..', '.........'],
  bread: ['.........', '.........', '..yyyyy..', '.yYyYyYy.', 'yyyyyyyyy', 'yyyyyyyyy', '.yyyyyyy.', '.........', '.........'],
  sack: ['.........', '...bbb...', '....b....', '..wwwww..', '.wwwwwww.', '.wwWwwww.', '.wwwwwww.', '..wwwww..', '.........'],
  herb: ['.........', '..g...g..', '.ggg.ggg.', '..gg.gg..', '...ggg...', '....g....', '....g....', '....G....', '.........'],
  letter: ['.........', '.........', '.wwwwwww.', '.kwwwwwk.', '.wkwwwkw.', '.wwkkkww.', '.wwwwwww.', '.........', '.........'],
  baby: ['.........', '...sss...', '..sssss..', '..sesse..', '...sss...', '..wwwww..', '.wwwwwww.', '..wwwww..', '.........'],
  sick: ['.........', '..ggggg..', '.gggggg g', '.gkgggkg.', '.ggggggg.', '.gg.k.gg.', '..ggggg..', '.........', '.........'],
  grain: ['....y....', '...yyy...', '..yy.yy..', '...yyy...', '..yy.yy..', '...yyy...', '....g....', '....g....', '....g....'],
  flour: ['.........', '...www...', '..wwwww..', '.wwwwwww.', '.wwwwwww.', '.wwWWWww.', '.wwwwwww.', '..wwwww..', '.........'],
  wood: ['.........', '.........', '.byyb....', '.byyb.byy', '.bbbbbbyy', 'byybbbbbb', 'byybbyyb.', '.bb..yyb.', '.........'],
  apple: ['.........', '....g....', '...gr....', '..rrrrr..', '.rrrrrrr.', '.rwrrrrr.', '.rrrrrrr.', '..rrrrr..', '.........'],
  egg: ['.........', '....w....', '...www...', '..wwwww..', '..wwwww..', '..wwwWw..', '...www...', '.........', '.........'],
  honey: ['.........', '..kkkkk..', '..yyyyy..', '.yyyyyyy.', '.yyYyyyy.', '.yyyyyyy.', '..yyyyy..', '.........', '.........'],
  remedy: ['....b....', '...bbb...', '...ggg...', '..ggggg..', '..gGggg..', '..gwwwg..', '..ggggg..', '.........', '.........'],
  veg: ['....g.g..', '...g.g...', '...ooo...', '..ooooo..', '...ooo...', '...oo....', '...o.....', '.........', '.........'],
  pie: ['.........', '.........', '...yyy...', '.yyYyYyy.', 'yyyyyyyyy', 'bbbbbbbbb', '.bbbbbbb.', '.........', '.........'],
  stew: ['.........', '..w.w.w..', '...w.w...', '.kkkkkkk.', '.kooggok.', '..kkkkk..', '...kkk...', '.........', '.........'],
  snow: ['....w....', '.w..w..w.', '..w.w.w..', '...www...', 'wwwwwwwww', '...www...', '..w.w.w..', '.w..w..w.', '....w....'],
  saw: ['.........', '.........', 'bb.......', 'bbggggggg', 'bbgGgGgGg', '.........', '.........', '.........', '.........'],
  bunny: ['.........', '..w..w...', '..w..w...', '..bbbb...', '.bkbbkb..', '.bbbbbb..', '..bbbb...', '.........', '.........'],
  hammer: ['.........', '.kkkk....', '.kkkk....', '...b.....', '...b.....', '...b.....', '...b.....', '...b.....', '.........'],
  sun: ['....y....', '.y.....y.', '...yyy...', '..yyyyy..', 'y.yyyyy.y', '..yyyyy..', '...yyy...', '.y.....y.', '....y....'],
  ring: ['.........', '...yyy...', '..y...y..', '.y.....y.', '.y.....y.', '.y.....y.', '..y...y..', '...yyy...', '.........'],
  cheese: ['.........', '.........', '.....yy..', '...yyyyy.', '.yyyYyyy.', 'yyyyyyyy.', 'yYyyyyYy.', 'yyyyyyyy.', '.........'],
  wool: ['.........', '..www....', '.wwWww.ww', 'wwwwWwwww', 'wWwwwwWww', '.wwwwwww.', '..wwWw...', '....bbb..', '.........'],
  sheep: ['.........', '..wwww...', '.wwwwwwk.', 'wwwwwwwkk', 'wwwwwwwke', '.wwwwww..', '.k.k.k.k.', '.k.k.k.k.', '.........'],
};
const ICON_PAL = {
  w: '#f4f0e8', W: '#d8d0bc', y: '#e8a84a', Y: '#b87a2a', b: '#7a4e2a', B: '#5a3a1e', c: '#c9a46a', f: '#ffffff', k: '#2a1c12', z: '#3a4a8a',
  g: '#4f9a3a', G: '#2f6a26', r: '#d83a4a', o: '#e8762a', s: '#f4cfa8', e: '#2a1c12',
};
const ICONS = {};
function buildIcons() {
  for (const k in ICON_ROWS) {
    const pal = Object.assign({}, ICON_PAL);
    if (k === 'fish') pal.c = '#7aa8c8';
    if (k === 'cup') pal.c = '#9a9488', pal.b = '#5a8ac8';
    if (k === 'spark') pal.y = '#f2d24a';
    if (k === 'grain' || k === 'honey' || k === 'sun' || k === 'ring') pal.y = '#e2b83a';
    if (k === 'bread') pal.y = '#c8945a', pal.Y = '#e8c48a';
    if (k === 'cheese') pal.y = '#f2d24a', pal.Y = '#d8a830';
    if (k === 'pie') pal.y = '#d8a45a', pal.Y = '#8a3a2a', pal.b = '#b07a3a';
    if (k === 'wood') pal.y = '#d8b07a';
    if (k === 'sick') pal.g = '#8ac86a';
    if (k === 'snow') pal.w = '#9ac8f0';
    if (k === 'saw') pal.g = '#a8a8b0', pal.G = '#6a6a72';
    if (k === 'bunny') pal.b = '#a08060';
    if (k === 'stew') pal.k = '#4a4a52', pal.g = '#6aaa4a';
    if (k === 'remedy') pal.g = '#3a9a6a', pal.G = '#7ad8a0';
    ICONS[k] = spriteFrom(ICON_ROWS[k], pal);
  }
}
