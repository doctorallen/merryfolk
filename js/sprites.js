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
// Riftfolk colours: neon accents, dyed hair and dark synth-weave jackets
const NEON_COLS = ['#3af0ff', '#ff3aa8', '#b45aff', '#7aff5a', '#ffd23a', '#ff6a3a'];
const RIFT_HAIR = ['#ff3aa8', '#3af0ff', '#b45aff', '#7aff5a', '#ff8a2a', '#e8e8f8', '#26262e', '#3a2a5a'];
const RIFT_JACKETS = ['#2a2a3a', '#1e2a3a', '#3a1e3a', '#22343a', '#3a2a24', '#2a2a2a'];

// ---------------------------------------------------------------------------
// Double resolution. Art drawn at world resolution is upscaled with Scale2x,
// which rounds off its staircases, and its outline is thinned back to a single
// half-pixel so it matches the art drawn at double resolution (the villagers).
// hd(img) is cached per image; native double-resolution canvases carry .hd.
// ---------------------------------------------------------------------------
const HD_CACHE = new WeakMap();
function hd(img) {
  if (!img || img.hd) return img;
  let out = HD_CACHE.get(img);
  if (!out) { out = scale2x(img); out.hd = true; HD_CACHE.set(img, out); }
  return out;
}
const OUTLINE_U32 = (() => { const [r, g, b] = hexToRgb(OUTLINE); return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; })();
function scale2x(src) {
  const w = src.width, h = src.height;
  let sctx = src.getContext ? src.getContext('2d') : null;
  if (!sctx) { const [c, x] = makeCanvas(w, h); x.drawImage(src, 0, 0); sctx = x; }
  const s = new Uint32Array(sctx.getImageData(0, 0, w, h).data.buffer);
  const W = w * 2, H = h * 2;
  const [c, x] = makeCanvas(W, H);
  const out = x.createImageData(W, H), o = new Uint32Array(out.data.buffer);
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    const k = y * w + i, P = s[k];
    const A = y > 0 ? s[k - w] : P, D = y < h - 1 ? s[k + w] : P, Cc = i > 0 ? s[k - 1] : P, B = i < w - 1 ? s[k + 1] : P;
    const q = (y * 2) * W + i * 2;
    o[q] = Cc === A && Cc !== D && A !== B ? A : P;
    o[q + 1] = A === B && A !== Cc && B !== D ? B : P;
    o[q + W] = D === Cc && D !== B && Cc !== A ? Cc : P;
    o[q + W + 1] = B === D && B !== A && D !== Cc ? D : P;
  }
  // thin the outline: the inner half of a two-pixel border takes the fill colour beside it
  const src2 = o.slice();
  const clear = (v) => (v >>> 24) === 0;
  const at = (i, y) => (i < 0 || y < 0 || i >= W || y >= H ? 0 : src2[y * W + i]);
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    const v = src2[y * W + i];
    if ((v >>> 0) !== OUTLINE_U32) continue;
    if (N4.some(([a, b]) => clear(at(i + a, y + b)))) continue;
    const edgeOutline = N4.some(([a, b]) => (at(i + a, y + b) >>> 0) === OUTLINE_U32 && N4.some(([c2, d2]) => clear(at(i + a + c2, y + b + d2))));
    if (!edgeOutline) continue;
    const fillN = N4.map(([a, b]) => at(i + a, y + b)).find((u) => !clear(u) && (u >>> 0) !== OUTLINE_U32);
    if (fillN !== undefined) o[y * W + i] = fillN;
  }
  x.putImageData(out, 0, 0);
  return c;
}
// Draws any sprite at its world size: native double-resolution art as it is,
// world-resolution art through the upscaler.
function blit(ctx, img, x, y, flip = false) {
  const lw = img.hd ? img.width / RS : img.width, lh = img.hd ? img.height / RS : img.height;
  const src = img.hd ? img : hd(img);
  if (flip) { ctx.save(); ctx.translate(x + lw, y); ctx.scale(-1, 1); ctx.drawImage(src, 0, 0, lw, lh); ctx.restore(); }
  else ctx.drawImage(src, x, y, lw, lh);
}

// ---------------------------------------------------------------------------
// Villagers, drawn at double resolution on a 20-wide grid of half-pixels:
// a round head about half their height with pointed ears, a waistcoat over a
// shirt, breeches (or a skirt) and big bare hairy feet. Every look comes from
// the genome (hair colour and style, eyes, freckles, skin, clothes, sex) and
// from rift ways (neon trim, synth-weave, a visor), plus age.
//
// Palette letters: h/H/j hair (and shade, highlight), d brows, s/S skin, N nose,
// r blush, k freckles, m mouth, e eyes, w shine, v/V/u waistcoat, p pocket,
// y watch chain, b buttons, c/C shirt, l belt, o buckle, t/T breeches,
// f/F feet (skin, hair), R ribbon, n neon, z/Z visor, g chrome eye, G spectacles.
// ---------------------------------------------------------------------------
function villagerPalette(genes, stage, look = {}) {
  const ex = expressed(genes);
  let hair = ex.hair;
  if (stage === 'elder') hair = mix(hair, '#d9d6cc', 0.8);
  const skin = ex.skin;
  const pal = {
    h: hair, H: shade(hair, -0.3), j: shade(hair, 0.26), d: shade(hair, -0.42),
    s: skin, S: shade(skin, -0.14), N: shade(skin, -0.2), r: mix(skin, '#e0705a', 0.42), k: mix(skin, '#7a3a1a', 0.5), m: mix(skin, '#8a3a2a', 0.6),
    e: ex.eyes, w: '#ffffff', v: ex.vest, V: shade(ex.vest, -0.28), u: shade(ex.vest, 0.2), p: shade(ex.vest, -0.42),
    c: ex.shirt, C: shade(ex.shirt, -0.14), b: '#e8c860', y: '#e8c860', l: '#4a2e1a', o: '#e8c860',
    t: ex.legs, T: shade(ex.legs, -0.25), f: shade(skin, -0.06), F: shade(ex.hair, -0.12), R: mix(ex.vest, '#ff5a7a', 0.6),
    n: ex.neon, z: mix(ex.neon, '#101018', 0.35), Z: '#e8ffff', g: '#6af8ff', G: '#8a7a5a',
  };
  const tier = look.tier || 0;
  // folk taking up rift ways wear neon trim; the thoroughly rift-minded go about in synth-weave
  if (tier >= 1) { pal.b = ex.neon; pal.R = ex.neon; }
  if (tier >= 2) {
    pal.v = mix(ex.vest, '#1e1e2a', 0.72); pal.V = shade(pal.v, -0.3); pal.u = shade(pal.v, 0.15);
    pal.c = mix(ex.shirt, '#4a4a5a', 0.8); pal.C = shade(pal.c, -0.15);
    pal.t = mix(ex.legs, '#24242e', 0.7); pal.T = shade(pal.t, -0.2);
  }
  return pal;
}

// A world-resolution sprite from a template, with the usual outline (critters use this).
function finishSprite(rows, pal) {
  const raw = spriteFrom(rows, pal);
  const [c, x] = makeCanvas(raw.width + 2, raw.height + 2);
  x.drawImage(raw, 1, 1);
  return outlineCanvas(c, OUTLINE);
}

const FOLK_W = 20;
// What a body looks like: the parts each view and pose draw from.
function folkBody(genes, stage, look) {
  const ex = expressed(genes);
  const child = stage === 'child';
  const style = ex.style === 0 && ex.sex === 'f' ? 1 : ex.style;
  return {
    ex, child, elder: stage === 'elder', female: ex.sex === 'f', style,
    skirt: ex.garment === 1, tier: look.tier || 0, visor: !!look.visor && (look.tier || 0) >= 2,
    spiky: (genes.rift || 0) >= 0.5,
    specs: stage === 'elder' && genes.wit > 0.45,
    H: child ? 25 : 30, top: 15, bot: child ? 19 : 22,
  };
}

function folkGrid(H) {
  const g = Array.from({ length: H }, () => Array(FOLK_W).fill('.'));
  const put = (x, y, k) => { if (y >= 0 && y < H && x >= 0 && x < FOLK_W) g[y][x] = k; };
  const rect = (x0, y0, x1, y1, k) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, k); };
  const get = (x, y) => (y >= 0 && y < H && x >= 0 && x < FOLK_W ? g[y][x] : '.');
  return { g, put, rect, get };
}

// ----- facing the viewer -----
function folkFront(B, pose) {
  const sit = pose === 'sit';
  const H = sit ? B.bot + 6 : B.H;
  const { g, put, rect, get } = folkGrid(H);
  const hx = 9.5, hy = 7.6, rx = 6.6, ry = 6.6;
  const inHead = (x, y) => ((x - hx) / rx) ** 2 + ((y - hy) / ry) ** 2 < 1;
  for (let y = 0; y < 15; y++) for (let x = 0; x < FOLK_W; x++) if (inHead(x, y)) put(x, y, x >= 14 ? 'S' : 's');
  for (const [x, y] of [[2, 8], [2, 7], [1, 6]]) put(x, y, 's');
  for (const [x, y] of [[17, 8], [17, 7], [18, 6]]) put(x, y, 'S');
  // hair
  for (let y = 0; y < 15; y++) for (let x = 0; x < FOLK_W; x++) {
    if (!inHead(x, y)) continue;
    const fringe = y <= 4 || (y === 5 && ![6, 7, 12, 13].includes(x));
    const side = (x <= 4 || x >= 15) && y <= 8;
    if (fringe || side) put(x, y, x >= 14 ? 'H' : 'h');
  }
  for (const [x, y] of [[6, 1], [7, 1], [8, 1], [5, 2], [6, 2], [7, 3]]) put(x, y, 'j');
  if (B.style === 1) {
    // long hair falling past the shoulders
    for (let y = 5; y <= (B.child ? 13 : 16); y++) { put(2, y, 'h'); put(3, y, 'h'); put(16, y, 'H'); put(17, y, 'H'); }
    put(1, 9, 'h'); put(18, 9, 'H');
  }
  if (B.style === 2) {
    // tousled: tufts sticking up and out
    for (const [x, y] of [[5, 0], [9, 0], [13, 0], [3, 2], [16, 2]]) put(x, y, x >= 14 ? 'H' : 'h');
    for (const [x, y] of [[8, 5], [11, 5]]) put(x, y, 'h');
  }
  if (B.style === 3) {
    // curls: a bumpy edge with highlights through it
    for (let y = 0; y <= 5; y++) for (let x = 0; x < FOLK_W; x++) if ((get(x, y) === 'h' || get(x, y) === 'H') && (x + y * 2) % 4 === 0) put(x, y, get(x, y) === 'h' ? 'j' : 'h');
    for (let x = 4; x <= 15; x += 2) if (get(x, 1) !== '.' && get(x, 0) === '.') put(x, 0, x >= 14 ? 'H' : 'h');
    for (const [x, y] of [[2, 4], [17, 4], [2, 6], [17, 6]]) put(x, y, x > 9 ? 'H' : 'h');
  }
  if (B.spiky) {
    for (let x = 0; x < FOLK_W; x++) if ('hHj'.includes(get(x, 0))) put(x, 0, '.');
    for (const x of [4, 7, 10, 13, 16]) { put(x, 0, 'h'); put(x, 1, 'h'); }
  }
  // face
  rect(5, 6, 7, 6, 'd'); rect(12, 6, 14, 6, 'd');
  if (B.shut) {
    // eyes closed: a curved lid and lashes
    put(5, 8, 'd'); put(6, 9, 'd'); put(7, 9, 'd'); put(12, 9, 'd'); put(13, 9, 'd'); put(14, 8, 'd');
  } else {
    rect(6, 7, 7, 9, 'e'); rect(12, 7, 13, 9, 'e'); put(7, 7, 'w'); put(13, 7, 'w');
    if (B.female) { put(5, 7, 'e'); put(14, 7, 'e'); }
  }
  put(4, 10, 'r'); put(5, 10, 'r'); put(14, 10, 'r'); put(15, 10, 'r');
  if (B.ex.freckles) for (const [x, y] of [[4, 9], [6, 10], [13, 10], [15, 9]]) put(x, y, 'k');
  put(10, 9, 'N'); put(10, 10, 'N');
  rect(8, 11, 11, 11, 'm'); put(7, 10, 'm'); put(12, 10, 'm');
  rect(8, 14, 11, 14, 'S');
  if (B.female) { rect(13, 1, 15, 2, 'R'); put(16, 2, 'R'); }
  else if (!B.child) { rect(3, 9, 3, 11, 'H'); rect(16, 9, 16, 11, 'H'); }
  if (B.elder && !B.female) { rect(7, 12, 12, 13, 'h'); rect(8, 11, 11, 11, 'm'); }
  if (B.specs) {
    for (const ox of [5, 11]) { rect(ox, 6, ox + 3, 6, 'G'); rect(ox, 10, ox + 3, 10, 'G'); rect(ox, 6, ox, 10, 'G'); rect(ox + 3, 6, ox + 3, 10, 'G'); }
    rect(9, 8, 10, 8, 'G');
  }
  if (B.ex.chrome && !B.shut) { rect(12, 7, 13, 9, 'g'); put(13, 7, 'w'); }
  if (B.visor) { rect(3, 7, 16, 9, 'z'); rect(5, 7, 8, 7, 'Z'); put(17, 8, 'n'); }
  // body
  const top = B.top, bot = B.bot;
  const handR = frontTorso(B, rect, put, top, bot, 5, 14, pose);
  // legs
  const lt = bot + 1;
  if (sit) {
    rect(4, lt, 15, lt + 1, 't'); rect(13, lt, 15, lt + 1, 'T');
    if (B.skirt) { rect(3, lt, 16, lt + 1, 'v'); rect(14, lt, 16, lt + 1, 'V'); rect(3, lt + 2, 16, lt + 2, 'u'); }
    for (const fx of [4, 11]) { put(fx + 1, lt + 2 + (B.skirt ? 1 : 0), 's'); rect(fx, lt + 3, fx + 4, lt + 3, 'F'); rect(fx, lt + 4, fx + 4, lt + 4, 'f'); }
  } else {
    const lb = H - 4, ank = H - 3;
    rect(5, lt, 14, lb, 't'); rect(12, lt, 14, lb, 'T');
    rect(9, lt + 2, 10, lb, '.');
    const feet = { stand: [[4, 0], [11, 0]], walk1: [[4, 0], [12, -1]], walk2: [[3, -1], [11, 0]] }[pose] || [[4, 0], [11, 0]];
    for (const [fx, dy] of feet) {
      put(fx + 2, ank + dy, 's'); put(fx + 3, ank + dy, 'S');
      rect(fx, ank + 1 + dy, fx + 4, ank + 1 + dy, 'F'); rect(fx, ank + 2 + dy, fx + 4, ank + 2 + dy, 'f');
      put(fx, ank + 1 + dy, 'f'); put(fx + 4, ank + 2 + dy, 'F');
    }
    if (B.skirt) {
      for (let y = lt; y <= lb; y++) { const fl = Math.round((y - lt) * 0.9); rect(5 - fl, y, 14 + fl, y, 'v'); rect(13 + fl, y, 14 + fl, y, 'V'); }
      const fl = Math.round((lb - lt) * 0.9); rect(5 - fl, lb, 14 + fl, lb, 'u');
    }
  }
  return { g, anchors: { mouth: [10.5, 11], handR, handL: [3.5, bot], chest: [9.5, top + 3] } };
}

// Arms by pose, seen from the front or behind: they swing as folk walk (the
// hand going forward rises a little), one comes up to work, and both go up to
// dance. Returns where the right-hand side hand ends up.
function folkArms(rect, top, bot, lx, rx, pose, lk, rk) {
  const swing = { walk1: [-2, 1], walk2: [1, -2] }[pose] || [0, 0];
  const arm = (x, dy, k, working) => {
    const o = x > 9 ? 1 : -1; // which way is outward
    if (pose === 'reach') {
      // up and out, as in a jig
      for (let j = 0; j <= 6; j++) rect(x + o * (j >> 1), top - j, x + 1 + o * (j >> 1), top - j, k);
      rect(x + o * 4, top - 9, x + 1 + o * 4, top - 7, 's');
      return [x + 0.5 + o * 4, top - 8];
    }
    if (pose === 'work' && working) {
      // the working hand brought up in front
      const hx = o > 0 ? x - 1 : x + 1;
      rect(x, top, x + 1, top + 2, k); rect(hx, top + 3, hx + 1, top + 4, 's');
      return [hx + 0.5, top + 4];
    }
    rect(x, top, x + 1, bot - 2 + dy, k);
    rect(x, bot - 1 + dy, x + 1, bot + dy, 's');
    return [x + 1, bot + dy];
  };
  arm(lx, swing[0], lk, false);
  return arm(rx, swing[1], rk, true);
}

// The torso from the front: an open waistcoat over a shirt, or a closed
// synth-weave jacket with a neon collar and zip for the thoroughly rift-minded.
function frontTorso(B, rect, put, top, bot, x0, x1, pose) {
  const mid = 9;
  rect(x0 + 1, top, x1 - 1, bot, 'c'); rect(mid, top + 1, mid + 1, bot, 'C');
  rect(x0, top, mid - 1, bot, 'v'); rect(mid + 2, top, x1, bot, 'v'); rect(x1, top, x1, bot, 'V');
  put(mid - 1, top, 'u'); put(mid - 1, top + 1, 'u'); put(mid + 2, top, 'u'); put(mid + 2, top + 1, 'u');
  for (let k = 3; k < bot - top; k += 2) put(mid - 2, top + k, 'b');
  if (!B.child && !B.female) { put(mid + 3, top + 3, 'p'); put(mid + 4, top + 3, 'p'); put(mid + 3, top + 2, 'y'); put(mid + 2, top + 3, 'y'); }
  // sleeves and hands
  const handR = folkArms(rect, top, bot, x0 - 2, x1 + 1, pose, 'c', 'C');
  rect(x0, bot, x1, bot, 'l'); put(mid, bot, 'o'); put(mid + 1, bot, 'o');
  if (B.tier >= 1) rect(x0, bot, x1, bot, 'n');
  if (B.tier >= 2) {
    for (let y = top; y < bot; y++) { rect(x0, y, x1, y, 'v'); put(x1, y, 'V'); }
    rect(mid - 2, top, mid + 3, top, 'n'); put(mid - 3, top + 1, 'n'); put(mid + 4, top + 1, 'n');
    for (let y = top + 1; y < bot; y++) put(mid + (y % 2), y, 'n');
  }
  return handR;
}

// ----- seen from behind -----
function folkBack(B, pose) {
  const sit = pose === 'sit';
  const H = sit ? B.bot + 6 : B.H;
  const { g, put, rect, get } = folkGrid(H);
  const hx = 9.5, hy = 7.6, rx = 6.6, ry = 6.6;
  const inHead = (x, y) => ((x - hx) / rx) ** 2 + ((y - hy) / ry) ** 2 < 1;
  for (let y = 0; y < 15; y++) for (let x = 0; x < FOLK_W; x++) if (inHead(x, y)) put(x, y, y >= 12 ? 'S' : x >= 13 ? 'H' : 'h');
  for (const [x, y] of [[2, 8], [2, 7], [1, 6]]) put(x, y, 's');
  for (const [x, y] of [[17, 8], [17, 7], [18, 6]]) put(x, y, 'S');
  for (const [x, y] of [[7, 1], [8, 1], [6, 2], [9, 3], [5, 5], [11, 7]]) put(x, y, 'j');
  for (let x = 6; x <= 13; x += 2) put(x, 11, 'H');
  if (B.style === 1) { for (let y = 10; y <= (B.child ? 15 : 18); y++) rect(4, y, 15, y, y % 3 ? 'h' : 'H'); rect(13, 10, 15, B.child ? 15 : 18, 'H'); }
  if (B.style === 3) for (let y = 0; y <= 11; y++) for (let x = 0; x < FOLK_W; x++) if ((get(x, y) === 'h' || get(x, y) === 'H') && (x + y * 2) % 4 === 0) put(x, y, get(x, y) === 'h' ? 'j' : 'h');
  if (B.spiky) { for (let x = 0; x < FOLK_W; x++) if ('hHj'.includes(get(x, 0))) put(x, 0, '.'); for (const x of [4, 7, 10, 13, 16]) { put(x, 0, 'h'); put(x, 1, 'h'); } }
  if (B.female) { rect(8, 2, 11, 3, 'R'); put(7, 2, 'R'); put(12, 2, 'R'); }
  if (B.visor) { rect(2, 8, 17, 8, 'Z'); }
  rect(8, 13, 11, 14, 'S');
  const top = B.top, bot = B.bot;
  rect(5, top, 14, bot, 'v'); rect(9, top + 1, 10, bot - 1, 'V'); rect(14, top, 14, bot, 'V');
  const handB = folkArms(rect, top, bot, 15, 3, pose, 'C', 'c');
  rect(5, bot, 14, bot, B.tier >= 1 ? 'n' : 'l');
  if (B.tier >= 2) { for (let y = top; y < bot; y++) put(9 + (y % 2), y, 'n'); rect(7, top, 12, top, 'n'); }
  if (B.style === 1 && !B.child) rect(5, top, 14, top + 2, 'h');
  const lt = bot + 1;
  if (sit) {
    rect(4, lt, 15, lt + 1, 't'); rect(13, lt, 15, lt + 1, 'T');
    if (B.skirt) rect(3, lt, 16, lt + 2, 'v');
    rect(5, lt + 2, 7, lt + 3, 'S'); rect(12, lt + 2, 14, lt + 3, 'S');
  } else {
    const lb = H - 4, ank = H - 3;
    rect(5, lt, 14, lb, 't'); rect(12, lt, 14, lb, 'T'); rect(9, lt + 2, 10, lb, '.');
    const feet = { stand: [[5, 0], [11, 0]], walk1: [[5, 0], [11, -1]], walk2: [[5, -1], [11, 0]] }[pose] || [[5, 0], [11, 0]];
    for (const [fx, dy] of feet) { rect(fx + 1, ank + dy, fx + 2, ank + dy, 'S'); rect(fx, ank + 1 + dy, fx + 3, ank + 2 + dy, 'f'); rect(fx, ank + 1 + dy, fx + 3, ank + 1 + dy, 'F'); }
    if (B.skirt) { for (let y = lt; y <= lb; y++) { const fl = Math.round((y - lt) * 0.9); rect(5 - fl, y, 14 + fl, y, 'v'); rect(13 + fl, y, 14 + fl, y, 'V'); } const fl = Math.round((lb - lt) * 0.9); rect(5 - fl, lb, 14 + fl, lb, 'u'); }
  }
  return { g, anchors: { mouth: [10.5, 11], handR: handB, handL: [16, bot], chest: [9.5, top + 3] } };
}

// ----- side on, facing right (flipped for left) -----
function folkSide(B, pose) {
  const sit = pose === 'sit';
  const H = sit ? B.bot + 6 : B.H;
  const { g, put, rect, get } = folkGrid(H);
  const hx = 10.5, hy = 7.6, rx = 6.2, ry = 6.6;
  const inHead = (x, y) => ((x - hx) / rx) ** 2 + ((y - hy) / ry) ** 2 < 1;
  for (let y = 0; y < 15; y++) for (let x = 0; x < FOLK_W; x++) if (inHead(x, y)) put(x, y, 's');
  // hair over the crown and the back of the head
  for (let y = 0; y < 15; y++) for (let x = 0; x < FOLK_W; x++) {
    if (!inHead(x, y)) continue;
    if (y <= 4 || (y === 5 && x >= 11 && x !== 13) || (x <= 9 && y <= 10) || (x <= 7 && y <= 12)) put(x, y, x <= 6 ? 'H' : 'h');
  }
  for (const [x, y] of [[9, 1], [10, 1], [11, 1], [8, 2], [9, 2]]) put(x, y, 'j');
  if (B.style === 1) for (let y = 6; y <= (B.child ? 13 : 16); y++) rect(4, y, 7, y, y > 12 ? 'H' : 'h');
  if (B.style === 2) for (const [x, y] of [[7, 0], [11, 0], [15, 1], [5, 2]]) put(x, y, 'h');
  if (B.style === 3) for (let y = 0; y <= 12; y++) for (let x = 0; x < FOLK_W; x++) if ((get(x, y) === 'h' || get(x, y) === 'H') && (x + y * 2) % 4 === 0) put(x, y, get(x, y) === 'h' ? 'j' : 'h');
  if (B.spiky) { for (let x = 0; x < FOLK_W; x++) if ('hHj'.includes(get(x, 0))) put(x, 0, '.'); for (const x of [6, 9, 12, 15]) { put(x, 0, 'h'); put(x, 1, 'h'); } put(4, 2, 'h'); }
  // ear, eye, nose and mouth
  put(9, 8, 's'); put(9, 9, 's'); put(8, 7, 's'); put(9, 7, 'r');
  rect(13, 6, 15, 6, 'd');
  if (B.shut) { put(14, 9, 'd'); put(15, 9, 'd'); if (B.female) put(16, 8, 'd'); }
  else {
    rect(14, 7, 14, 9, 'e'); put(15, 7, 'w'); put(15, 8, 'e');
    if (B.female) put(15, 6, 'e');
  }
  put(14, 10, 'r'); put(13, 10, 'r');
  if (B.ex.freckles) { put(13, 9, 'k'); put(15, 10, 'k'); }
  put(17, 9, 's'); put(17, 10, 'N'); put(16, 10, 'N');
  put(15, 11, 'm'); put(16, 11, 'm'); put(14, 11, 'm');
  rect(9, 14, 12, 14, 'S');
  if (B.female) { rect(7, 1, 8, 2, 'R'); put(6, 2, 'R'); }
  else if (!B.child) rect(10, 9, 10, 11, 'H');
  if (B.elder && !B.female) rect(12, 12, 16, 13, 'h');
  if (B.specs) { rect(13, 6, 16, 6, 'G'); rect(13, 10, 16, 10, 'G'); rect(13, 6, 13, 10, 'G'); rect(16, 6, 16, 10, 'G'); rect(10, 8, 12, 8, 'G'); }
  if (B.ex.chrome && !B.shut) { rect(14, 7, 14, 9, 'g'); put(15, 7, 'w'); put(15, 8, 'g'); }
  if (B.visor) { rect(11, 7, 17, 9, 'z'); rect(13, 7, 15, 7, 'Z'); put(10, 8, 'n'); }
  // body: the waistcoat front faces right; one arm swings
  const top = B.top, bot = B.bot;
  rect(7, top, 13, bot, 'v'); rect(7, top, 8, bot, 'V');
  rect(13, top, 13, top + 3, 'c'); put(12, top, 'u');
  put(12, top + 3, 'b'); put(12, top + 5, 'b');
  rect(7, bot, 13, bot, B.tier >= 1 ? 'n' : 'l'); put(12, bot, B.tier >= 1 ? 'n' : 'o');
  if (B.tier >= 2) { rect(7, top, 13, bot - 1, 'v'); rect(7, top, 8, bot - 1, 'V'); rect(11, top, 13, top, 'n'); for (let y = top + 1; y < bot; y++) put(13, y, 'n'); }
  if (B.style === 1 && !B.child) rect(5, top, 7, top + 2, 'H');
  const swing = sit ? 0 : { stand: 0, walk1: 2, walk2: -2 }[pose] || 0;
  const ax = 9 + swing;
  let hand = [ax + 1, bot];
  if (pose === 'work') {
    // forearm out in front, as if digging or reaching
    rect(ax, top + 1, ax + 2, top + 3, 'c'); rect(ax, top + 1, ax, top + 3, 'C');
    rect(ax + 2, top + 4, ax + 5, top + 5, 'c'); rect(ax + 6, top + 4, ax + 7, top + 5, 's');
    hand = [ax + 7, top + 5];
  } else if (pose === 'reach') {
    // arm flung out in front, waving
    rect(ax, top + 1, ax + 2, top + 2, 'c'); rect(ax + 2, top, ax + 6, top + 1, 'c'); rect(ax + 2, top + 1, ax + 6, top + 1, 'C');
    rect(ax + 7, top - 2, ax + 8, top + 1, 's');
    hand = [ax + 8, top - 1];
  } else {
    rect(ax, top + 1, ax + 2, bot - 2, 'c'); rect(ax, top + 1, ax, bot - 2, 'C');
    rect(ax, bot - 1, ax + 2, bot, 's');
  }
  const lt = bot + 1;
  if (sit) {
    rect(8, lt, 16, lt + 1, 't'); rect(8, lt + 1, 16, lt + 1, 'T');
    if (B.skirt) rect(7, lt, 17, lt + 1, 'v');
    rect(15, lt + 2, 16, lt + 3, 's');
    rect(14, lt + 4, 18, lt + 4, 'F'); rect(14, lt + 5, 18, lt + 5, 'f');
    return { g, anchors: { mouth: [16, 11], handR: hand, handL: hand, chest: [11, top + 3] } };
  }
  const lb = H - 4, ank = H - 3;
  const leg = (x0, dx, k) => { for (let y = lt; y <= lb; y++) { const o = Math.round(((y - lt) / Math.max(1, lb - lt)) * dx); rect(x0 + o, y, x0 + o + 2, y, k); } return x0 + dx; };
  let feet;
  if (pose === 'walk1') { const b2 = leg(8, -3, 'T'), f2 = leg(10, 3, 't'); feet = [[b2 - 1, -1, 'T'], [f2, 0, 't']]; }
  else if (pose === 'walk2') { leg(9, 0, 'T'); const f2 = leg(10, 1, 't'); feet = [[9, -1, 'T'], [f2, 0, 't']]; }
  else { rect(8, lt, 12, lb, 't'); rect(8, lt, 9, lb, 'T'); feet = [[8, 0, 't']]; }
  for (const [fx, dy] of feet) {
    put(fx + 1, ank + dy, 's'); put(fx + 2, ank + dy, 'S');
    rect(fx, ank + 1 + dy, fx + 5, ank + 1 + dy, 'F'); rect(fx, ank + 2 + dy, fx + 5, ank + 2 + dy, 'f');
  }
  if (B.skirt) { for (let y = lt; y <= lb; y++) { const fl = Math.round((y - lt) * 0.7); rect(7 - fl, y, 13 + fl, y, 'v'); put(7 - fl, y, 'V'); } rect(7 - Math.round((lb - lt) * 0.7), lb, 13 + Math.round((lb - lt) * 0.7), lb, 'u'); }
  return { g, anchors: { mouth: [16, 11], handR: hand, handL: hand, chest: [11, top + 3] } };
}

// ----- a swaddled baby: a round face peeking out of a blanket -----
function folkBaby(B, view) {
  const H = 18, W = 16;
  const g = Array.from({ length: H }, () => Array(FOLK_W).fill('.'));
  const put = (x, y, k) => { if (y >= 0 && y < H && x >= 0 && x < FOLK_W) g[y][x] = k; };
  const rect = (x0, y0, x1, y1, k) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, k); };
  const ox = 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const head = ((x - 7.5) / 5.4) ** 2 + ((y - 5.5) / 5) ** 2 < 1;
    const wrap = ((x - 7.5) / 6.6) ** 2 + ((y - 11.5) / 6.2) ** 2 < 1 && y >= 7;
    if (wrap) put(x + ox, y, (x + y) % 5 === 0 ? 'C' : x >= 11 ? 'C' : 'c');
    else if (head) put(x + ox, y, view === 'up' ? (y < 8 ? 'h' : 'S') : x >= 11 ? 'S' : 's');
  }
  if (view !== 'up') {
    rect(ox + 5, 0, ox + 10, 1, 'h'); put(ox + 7, 2, 'h'); put(ox + 8, 2, 'j');
    if (B.shut) { put(ox + 4, 6, 'd'); put(ox + 5, 6, 'd'); put(ox + 10, 6, 'd'); put(ox + 11, 6, 'd'); }
    else { rect(ox + 5, 5, ox + 5, 6, 'e'); rect(ox + 10, 5, ox + 10, 6, 'e'); put(ox + 5, 5, 'w'); }
    put(ox + 3, 7, 'r'); put(ox + 12, 7, 'r'); put(ox + 7, 8, 'm'); put(ox + 8, 8, 'm');
    rect(ox + 3, 10, ox + 12, 10, 'C');
  } else rect(ox + 3, 1, ox + 12, 6, 'h');
  return { g, anchors: { mouth: [10, 8], handR: [14, 12], handL: [5, 12], chest: [10, 12] } };
}

// ----- a baby in someone's arms: a swaddled bundle, a face peeking out -----
function folkBundle() {
  const W = 13, H = 10;
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const head = ((x - 3.6) / 3.2) ** 2 + ((y - 3.5) / 3.1) ** 2 < 1;
    const wrap = ((x - 6.5) / 6.6) ** 2 + ((y - 6) / 4.1) ** 2 < 1 && y >= 2;
    if (head && x <= 5) g[y][x] = x >= 5 ? 'S' : 's';
    else if (wrap) g[y][x] = y >= 8 || x >= 11 || (x + y) % 6 === 0 ? 'C' : 'c';
    else if (head) g[y][x] = 'S';
  }
  // a wisp of hair, sleepy eyes and rosy cheeks, and the blanket tucked round
  for (const [x, y] of [[2, 0], [3, 0], [4, 0], [1, 1], [5, 1]]) g[y][x] = 'h';
  g[3][2] = 'd'; g[3][5] = 'd'; g[4][1] = 'r'; g[4][6] = 'r'; g[5][3] = 'm';
  for (let x = 6; x <= 11; x++) g[3][x] = x % 2 ? 'C' : 'c';
  return g;
}

// Turns a grid into a double-resolution canvas with a single half-pixel outline.
function folkCanvas(grid, pal) {
  const H = grid.length, W = grid[0].length;
  const [c, x] = makeCanvas(W + 2, H + 2);
  const solid = (i, j) => j >= 0 && j < H && i >= 0 && i < W && grid[j][i] !== '.' && pal[grid[j][i]];
  for (let j = -1; j <= H; j++) for (let i = -1; i <= W; i++) {
    if (solid(i, j)) { x.fillStyle = pal[grid[j][i]]; x.fillRect(i + 1, j + 1, 1, 1); }
    else if (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)) { x.fillStyle = OUTLINE; x.fillRect(i + 1, j + 1, 1, 1); }
  }
  c.hd = true;
  return c;
}

function buildVillagerSprites(genes, stage, look = {}, shut = false) {
  const pal = villagerPalette(genes, stage, look);
  const B = folkBody(genes, stage, look);
  B.shut = shut;
  const out = { down: {}, up: {}, side: {} };
  const make = (r) => { const c = folkCanvas(r.g, pal); c.anchors = r.anchors; return c; };
  if (stage === 'baby') {
    const ex = expressed(genes);
    pal.c = mix(ex.vest, '#fff8e8', 0.65); pal.C = mix(ex.vest, '#fff8e8', 0.3);
    const f = make(folkBaby(B, 'down')), b = make(folkBaby(B, 'up'));
    for (const pose of ['stand', 'walk1', 'walk2', 'sit', 'work', 'reach']) { out.down[pose] = f; out.up[pose] = b; out.side[pose] = f; }
    out.held = folkCanvas(folkBundle(), pal);
    return out;
  }
  for (const pose of ['stand', 'walk1', 'walk2', 'sit', 'work', 'reach']) {
    out.down[pose] = make(folkFront(B, pose));
    out.up[pose] = make(folkBack(B, pose));
    out.side[pose] = make(folkSide(B, pose));
  }
  return out;
}

// The same villager with their eyes shut, made the first time it's needed
// (blinking, dozing and asleep in bed).
function shutSprites(v) { return v.sprites.shut || (v.sprites.shut = buildVillagerSprites(v.genes, v.stage, v.look(), true)); }

// Large portrait for the inspector panel.
function drawPortrait(canvas, genes, stage, sepia, look) {
  const sp = buildVillagerSprites(genes, stage, look).down.stand;
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
    willow: ['#2e4a22', '#3e6a2c', '#5a8a3a', '#7aaa4c', '#9cc868'],
    poplar: ['#22401c', '#2f5a26', '#447a32', '#5e9a40', '#7cb852'],
    fir: ['#152c1e', '#1e3a26', '#284c30', '#36603c', '#4a7a4c'],
    sapling: ['#2c5a22', '#3f7a2c', '#5a9a3a', '#7cba4c', '#a2d468'],
  },
  spring: {
    oak: ['#2c5a22', '#3f7a2c', '#5a9a3a', '#7cba4c', '#a2d468'],
    apple: ['#2f5a24', '#427a30', '#5c983c', '#7ab64c', '#a0d064'],
    birch: ['#46702c', '#5c8e36', '#76aa44', '#96c45a', '#bce07a'],
    pine: ['#1b3524', '#24452c', '#2f5a36', '#3f7244', '#56905a'],
    big: ['#2a5422', '#3c722c', '#56923a', '#76b24a', '#9ccc62'],
    willow: ['#3a5a22', '#4e7a2c', '#6c9a3a', '#8eba4e', '#b4d870'],
    poplar: ['#2a5022', '#3a6c2c', '#56903a', '#76b04c', '#9ad06a'],
    fir: ['#152c1e', '#1e3a26', '#284c30', '#36603c', '#4a7a4c'],
    sapling: ['#36662a', '#4a8634', '#68a842', '#8ac85a', '#b2e07a'],
  },
  autumn: {
    oak: ['#4a2410', '#7a3812', '#a8561a', '#d0802a', '#eab04a'],
    apple: ['#4a3e14', '#6e5a1e', '#94782a', '#b8983a', '#d4b84e'],
    birch: ['#5e4a12', '#8e7018', '#be9a22', '#dcbc36', '#f2dc6a'],
    pine: ['#1d3424', '#26432c', '#305634', '#3e6c40', '#527e50'],
    big: ['#4e2010', '#7e3210', '#ae4c18', '#d47424', '#ee9e3e'],
    willow: ['#4a4a14', '#6e6a1e', '#948e2a', '#b8b03a', '#d8d058'],
    poplar: ['#5a4612', '#8a6c18', '#b8921e', '#dab634', '#f2d460'],
    fir: ['#172e20', '#203c28', '#2a4e32', '#38623e', '#4c7a4e'],
    sapling: ['#6a2a10', '#9a4a18', '#c8702a', '#e89a3a', '#f8c45a'],
  },
};

// Each tree's size and shape come from its seed, so a wood is full of
// different trees: broad old oaks and spindly young ones, tall slim poplars,
// weeping willows by the water, firs and pines of every height.
const EVERGREEN = ['pine', 'fir'];
const TREE_SEEDS = { oak: [100, 36], birch: [200, 16], pine: [400, 12], fir: [800, 10], poplar: [700, 8], sapling: [900, 8] };
function treeShape(seed, kind) {
  const r = mulberry32(seed * 31 + 9);
  const f = (a, b) => a + r() * (b - a);
  switch (kind) {
    case 'big': return { s: 1, wide: 1 };
    case 'oak': return { s: f(0.72, 1.32), wide: f(0.85, 1.4) };
    case 'birch': return { s: f(0.78, 1.25), wide: f(0.62, 0.95) };
    case 'apple': return { s: f(0.85, 1.05), wide: f(1, 1.2) };
    case 'willow': return { s: f(0.95, 1.25), wide: f(1.2, 1.45) };
    case 'poplar': return { s: f(1.0, 1.35), wide: f(0.36, 0.48) };
    case 'sapling': return { s: f(0.45, 0.62), wide: f(0.8, 1.1) };
    case 'fir': return { s: f(0.85, 1.45), wide: f(0.62, 0.8) };
    default: return { s: f(0.8, 1.35), wide: f(0.85, 1.1) }; // pine
  }
}

function makeBareTree(seed, kind, big, sh = treeShape(seed, kind)) {
  const rng = mulberry32(seed + 77);
  const s = big ? 1 : sh.s;
  const W = big ? 84 : Math.max(22, Math.round(38 * s * Math.max(0.7, sh.wide))), H = big ? 96 : Math.round(46 * s * (kind === 'poplar' ? 1.5 : 1)) + 4;
  const [c, x] = makeCanvas(W, H);
  const cx = W / 2, base = H - 3;
  ellipseFill(x, cx, base, big ? 30 : Math.round(13 * s), big ? 7 : 4, 'rgba(20,40,10,0.22)');
  const bark = kind === 'birch' ? '#d8d2c2' : kind === 'willow' ? '#6a5a32' : '#5a3d24', dark = kind === 'birch' ? '#9a9484' : '#3e2816';
  const tw = big ? 10 : Math.max(2, Math.round(4 * s)), th = big ? 38 : Math.round(18 * s * (kind === 'poplar' ? 1.4 : 1));
  x.fillStyle = bark; x.fillRect(Math.round(cx - tw / 2), base - th, tw, th);
  x.fillStyle = dark; x.fillRect(Math.round(cx + tw / 2 - 1), base - th, 1, th);
  const branch = (bx, by, ang, len, thick, depth) => {
    for (let k = 0; k < len; k++) {
      const px = Math.round(bx + Math.cos(ang) * k), py = Math.round(by + Math.sin(ang) * k);
      x.fillStyle = k < len * 0.5 ? bark : dark;
      x.fillRect(px, py, thick, 1);
    }
    if (depth <= 0) return;
    const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
    const n = depth > 1 ? 2 : 3;
    const spread = kind === 'poplar' ? 0.5 : 1.3;
    for (let k = 0; k < n; k++) branch(ex, ey, ang + (rng() - 0.5) * spread, len * (0.55 + rng() * 0.2), Math.max(1, thick - 1), depth - 1);
  };
  const top = base - th;
  const arms = big ? 7 : kind === 'sapling' ? 3 : 4;
  const fan = kind === 'poplar' ? 0.7 : 2.1;
  for (let k = 0; k < arms; k++) {
    const a = -Math.PI / 2 + (k / (arms - 1) - 0.5) * fan + (rng() - 0.5) * 0.3;
    branch(cx + (rng() - 0.5) * tw * 0.6, top + rng() * 4, a, big ? 16 + rng() * 8 : (7 + rng() * 4) * s * (kind === 'poplar' ? 1.6 : 1), big ? 3 : 2, big ? 3 : 2);
  }
  // a willow's bare whips hang down
  if (kind === 'willow') for (let k = 0; k < 16; k++) { const wx = Math.round(cx + (rng() - 0.5) * W * 0.7), wy = top - Math.round(rng() * 6); x.fillStyle = k % 2 ? '#a89a4a' : '#8a7a3a'; x.fillRect(wx, wy, 1, Math.round((base - wy) * (0.5 + rng() * 0.35))); }
  return addSnow(outlineCanvas(c, kind === 'birch' ? '#4a463c' : '#22160c', 160), 0, base - 4, 1, seed);
}

function makeTree(seed, kind, season = 'summer') {
  const big = kind === 'big';
  const sh = treeShape(seed, kind);
  if (season === 'winter' && !EVERGREEN.includes(kind)) return makeBareTree(seed, kind, big, sh);
  const rng = mulberry32(seed);
  const pal = TREE_PAL[season === 'winter' ? 'summer' : season][kind] || TREE_PAL[season === 'winter' ? 'summer' : season].oak;

  if (EVERGREEN.includes(kind)) {
    // conifers: tiers of boughs, slimmer and taller for firs
    const s = sh.s, fir = kind === 'fir';
    const layers = fir ? 6 : 4, step = Math.round((fir ? 7 : 8) * s), hh = Math.round((fir ? 11 : 14) * s);
    const trunkH = Math.round(8 * s), spread = (fir ? 1.8 : 2.5) * sh.wide;
    const W = Math.round(2 * (3 + (hh / hh) * (8 * sh.wide + layers * spread)) + 6), H = trunkH + step * (layers - 1) + hh + 8;
    const [c, x] = makeCanvas(W, H);
    const cx = Math.floor(W / 2), base = H - 3;
    ellipseFill(x, cx, base, Math.round(W * 0.36), 4, 'rgba(20,40,10,0.22)');
    x.fillStyle = '#5a3a22'; x.fillRect(cx - 2, base - trunkH, 4, trunkH);
    x.fillStyle = '#3e2816'; x.fillRect(cx + 1, base - trunkH, 1, trunkH);
    for (let layer = 0; layer < layers; layer++) {
      const top = base - trunkH - hh - step * (layers - 1) + layer * step;
      for (let j = 0; j < hh; j++) {
        const half = Math.round(2 + (j / hh) * (6 * sh.wide + layer * spread));
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
    const o = outlineCanvas(c, '#14261a');
    return season === 'winter' ? addSnow(o, 0, base - 8, 2, seed) : o;
  }

  const s = big ? 1 : sh.s, hx = big ? 1 : sh.wide;
  const vy = kind === 'poplar' ? 2.6 : kind === 'birch' ? 1.15 : kind === 'willow' ? 0.85 : 1;
  const R0 = big ? 34 : Math.round((kind === 'poplar' ? 11 : kind === 'willow' ? 16 : 15) * s);
  const th = big ? 30 : Math.round((kind === 'poplar' ? 9 : kind === 'willow' ? 12 : 14) * s);
  const tw = big ? 12 : Math.max(3, Math.round(5 * s * (kind === 'sapling' ? 0.6 : kind === 'poplar' ? 0.8 : 1)));
  const W = big ? 84 : Math.max(16, Math.round(R0 * 2 * hx * 1.18) + 8);
  const H = big ? 96 : Math.round(th + R0 * vy * 1.75) + 8;
  const [c, x] = makeCanvas(W, H);
  const cx = W / 2, base = H - 3;
  // ground shadow
  ellipseFill(x, cx, base, big ? 30 : Math.max(5, Math.round(R0 * hx * 0.85)), big ? 7 : 4, 'rgba(20,40,10,0.22)');

  // trunk: it runs right up into the canopy, so there's never a gap between
  // the two (and none opens when the tree leans in the wind)
  const ccy = big ? 34 : Math.round(base - th - R0 * vy * 0.72);
  const tTop = Math.min(base - th, ccy), tH = base - tTop;
  const trunkCol = kind === 'birch' ? '#e8e4d8' : kind === 'willow' ? '#7a6a3e' : '#6b4a2b';
  x.fillStyle = trunkCol; x.fillRect(Math.round(cx - tw / 2), tTop, tw, tH);
  x.fillStyle = kind === 'birch' ? '#b8b2a2' : '#4a3220'; x.fillRect(Math.round(cx + tw / 2 - 2), tTop, 2, tH);
  x.fillStyle = kind === 'birch' ? '#ffffff' : '#8a6440'; x.fillRect(Math.round(cx - tw / 2), tTop, 1, tH);
  if (kind === 'birch') { x.fillStyle = '#3a3630'; for (let k = 0; k < Math.round(4 * s); k++) x.fillRect(cx - 2 + (k % 2) * 2, base - 3 - k * 3, 2, 1); }
  x.fillStyle = kind === 'birch' ? '#cfc9b8' : '#5a3d24';
  x.fillRect(Math.round(cx - tw / 2) - 1, base - 2, 1, 2); x.fillRect(Math.round(cx + tw / 2), base - 2, 1, 2);
  if (big || s > 1.15) { x.fillRect(Math.round(cx - tw / 2) - 3, base - 1, 3, 1); x.fillRect(Math.round(cx + tw / 2), base - 1, 4, 1); }

  // canopy blobs
  const blobs = [];
  const n = big ? 16 : Math.round(7 * Math.max(0.8, s) * (kind === 'poplar' ? 1.6 : 1));
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * R0 * 0.55;
    blobs.push({ x: cx + Math.cos(a) * d * hx, y: ccy + Math.sin(a) * d * 0.75 * vy, r: Math.round(R0 * (0.38 + rng() * 0.22) * Math.min(1, hx + 0.25)) });
  }
  blobs.push({ x: cx, y: ccy, r: Math.round(R0 * 0.6 * Math.min(1, hx + 0.25)) });
  blobs.sort((a, b) => a.y - b.y);
  for (const b of blobs) disc(x, b.x, b.y + 1, b.r, pal[0]);
  for (const b of blobs) disc(x, b.x - 1, b.y - 1, b.r - 1, pal[1]);
  for (const b of blobs) disc(x, b.x - 2, b.y - 2, Math.max(1, Math.round(b.r * 0.62)), pal[2]);
  for (const b of blobs) disc(x, b.x - 3, b.y - 4, Math.max(1, Math.round(b.r * 0.3)), pal[3]);
  const id = x.getImageData(0, 0, W, H).data;
  const solidAt = (px, py) => px >= 0 && py >= 0 && px < W && py < H && id[(py * W + px) * 4 + 3] > 200;
  for (let k = 0; k < (big ? 260 : Math.round(50 * s * s)); k++) {
    const px = Math.round(cx + (rng() - 0.5) * R0 * 1.8 * hx), py = Math.round(ccy + (rng() - 0.6) * R0 * 1.3 * vy);
    if (solidAt(px, py)) { x.fillStyle = rng() < 0.5 ? pal[4] : pal[1]; x.fillRect(px, py, 1, 1); }
  }
  // a willow's long hanging fronds
  if (kind === 'willow') {
    for (let k = 0; k < Math.round(W * 0.9); k++) {
      const fx = Math.round(cx + (rng() - 0.5) * R0 * 2 * hx * 0.95);
      let fy = ccy + Math.round((rng() - 0.3) * R0 * 0.6);
      if (!solidAt(fx, fy)) continue;
      const len = Math.round((base - 5 - fy) * (0.45 + rng() * 0.45));
      for (let j = 0; j < len; j++) { x.fillStyle = j > len - 3 ? pal[3] : (j + k) % 4 ? pal[2] : pal[1]; x.fillRect(fx + (j > len * 0.6 && k % 3 === 0 ? 1 : 0), fy + j, 1, 1); }
    }
  }
  // spring blossom on fruit trees and some oaks
  if (season === 'spring' && (kind === 'apple' || (kind === 'oak' && rng() < 0.35) || big)) {
    const bcol = kind === 'apple' ? ['#ffd0e0', '#ffffff', '#ff9ec0'] : ['#fff6f0', '#ffe0ea'];
    for (let k = 0; k < (big ? 120 : 26); k++) {
      const px = Math.round(cx + (rng() - 0.5) * R0 * 1.7 * hx), py = Math.round(ccy + (rng() - 0.55) * R0 * 1.3);
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

// Bushes of seven kinds (the kind comes from the seed), each through the year:
// leafy round bushes, brambles with blackberries, hawthorn and wild rose,
// gorse in yellow bloom, fern clumps, holly with red winter berries, heather.
const BUSH_KINDS = ['round', 'bramble', 'thorn', 'gorse', 'fern', 'holly', 'heather'];
function makeBush(seed, season = 'summer') {
  const rng = mulberry32(seed);
  const kind = BUSH_KINDS[seed % BUSH_KINDS.length];
  const sz = 0.75 + mulberry32(seed * 7 + 1)() * 0.6;
  const W = Math.round((kind === 'heather' ? 26 : kind === 'fern' ? 22 : 20) * sz) + 4, H = Math.round((kind === 'heather' ? 11 : kind === 'gorse' ? 18 : 16) * sz) + 3;
  const [c, x] = makeCanvas(W, H);
  const base = H - 3, cx = W / 2;
  ellipseFill(x, cx, base, Math.round(W * 0.4), 2, 'rgba(20,40,10,0.22)');
  const winter = season === 'winter', autumn = season === 'autumn', spring = season === 'spring';
  const dots = (n, cols, y0 = 2, y1 = base - 2) => {
    const id = x.getImageData(0, 0, W, H).data;
    for (let k = 0; k < n; k++) { const px = 2 + Math.floor(rng() * (W - 4)), py = y0 + Math.floor(rng() * Math.max(1, y1 - y0)); if (id[(py * W + px) * 4 + 3] > 200) { x.fillStyle = cols[k % cols.length]; x.fillRect(px, py, 1, 1); } }
  };
  // a domed mound of leafy lumps: biggest in the middle, smaller to the sides
  const mound = (pal, lumps, rx, ry) => {
    const L = [];
    for (let i = 0; i < lumps; i++) {
      const t = i / (lumps - 1) - 0.5, r = Math.max(2, Math.round(ry * (1 - t * t * 1.3) * (0.9 + rng() * 0.2)));
      L.push({ x: cx + t * W * 0.55, y: base - r - Math.round((0.5 - Math.abs(t)) * ry * 0.5), r });
    }
    for (const l of L) disc(x, l.x, l.y + 1, l.r, pal[0]);
    for (const l of L) disc(x, l.x - 1, l.y, l.r - 1, pal[1]);
    for (const l of L) disc(x, l.x - 1, l.y - 1, Math.max(1, Math.round(l.r * 0.5)), pal[2]);
  };
  const ry = Math.max(3, Math.round((H - 5) / 2));
  if (winter && (kind === 'round' || kind === 'bramble' || kind === 'thorn')) {
    // bare twigs in winter
    x.fillStyle = '#5a4030';
    for (let k = 0; k < 14; k++) { let px = cx + (rng() - 0.5) * W * 0.5, py = base; const a = -Math.PI / 2 + (rng() - 0.5) * 1.8; for (let j = 0; j < ry * 1.6; j++) { px += Math.cos(a) * 0.9; py += Math.sin(a) * 0.9; x.fillRect(Math.round(px), Math.round(py), 1, 1); } }
    if (kind === 'thorn') dots(6, ['#b82a2a']);
  } else if (kind === 'fern') {
    const col = winter ? ['#6a4a2a', '#8a6a3a'] : autumn ? ['#8a4a1a', '#c0782a'] : ['#3a7a2a', '#5aa83a'];
    const fronds = winter ? 5 : 8;
    for (let k = 0; k < fronds; k++) {
      const a = -Math.PI / 2 + (k / (fronds - 1) - 0.5) * 2.6, len = (winter ? 0.5 : 1) * ry * 2.2 * (0.8 + rng() * 0.3);
      for (let j = 0; j < len; j++) {
        const px = cx + Math.cos(a) * j, py = base - 1 + Math.sin(a) * j + (j * j) / (len * 3);
        x.fillStyle = col[0]; x.fillRect(Math.round(px), Math.round(py), 1, 1);
        if (j % 2 && j < len - 1) { x.fillStyle = col[1]; x.fillRect(Math.round(px) - 1, Math.round(py) + 1, 1, 1); x.fillRect(Math.round(px) + 1, Math.round(py) + 1, 1, 1); }
      }
    }
  } else {
    const pals = {
      round: autumn ? ['#4a2a10', '#7a4a1a', '#a0682a'] : TREE_PAL[spring ? 'spring' : 'summer'].oak.slice(0, 3),
      bramble: autumn ? ['#3a2a1a', '#5a3a22', '#7a5a2a'] : ['#1e3a1e', '#2e522a', '#466e36'],
      thorn: autumn ? ['#4a2410', '#7a3a18', '#9a5a28'] : ['#2a4a20', '#3a6a2a', '#5a8a3a'],
      gorse: ['#1e3a20', '#2a4e28', '#3a6432'],
      holly: ['#0e2a1a', '#1a3e26', '#2a5a36'],
      heather: autumn || season === 'summer' ? ['#4a2a4a', '#7a3a7a', '#a05aa8'] : ['#2e4024', '#46582e', '#5e7040'],
    };
    mound(pals[kind], kind === 'heather' ? 5 : kind === 'gorse' ? 3 : 4, W * 0.2, ry);
    dots(Math.round(W * 0.6), [pals[kind][2], shade(pals[kind][2], 0.25)]);
    if (kind === 'bramble' && !winter) dots(autumn ? 16 : 6, autumn ? ['#2a1030', '#4a1a4a', '#7a2a3a'] : ['#c84a3a', '#e8e0d0']);
    if (kind === 'thorn') dots(spring ? 22 : 10, spring ? ['#ffffff', '#f8eef0'] : season === 'summer' ? ['#f0a0c0', '#ffffff', '#e86a90'] : ['#c82a2a', '#a81a1a']);
    if (kind === 'gorse' && !autumn) dots(winter ? 4 : 22, ['#f2d24a', '#ffe878', '#e8b830']);
    if (kind === 'gorse') { x.fillStyle = pals.gorse[0]; for (let k = 0; k < 10; k++) x.fillRect(2 + Math.floor(rng() * (W - 4)), 2 + Math.floor(rng() * (base - 4)), 1, 2); }
    if (kind === 'holly') dots(autumn || winter ? 12 : 3, ['#d82a2a', '#ff5a4a']);
    if (kind === 'heather' && (autumn || season === 'summer')) dots(20, ['#c87ad8', '#e0a0e8']);
    if (kind === 'round' && !autumn && rng() < 0.5) dots(6, [rng() < 0.3 ? '#7a2a6a' : rng() < 0.5 ? '#f0e8f0' : '#e85a6a']);
  }
  const o = outlineCanvas(c, '#18301a');
  return winter ? addSnow(o, 0, base, 2, seed) : o;
}

function makeFlowerPatch(seed, kind) {
  const rng = mulberry32(seed);
  const K = kind && FLOWER_KINDS[kind];
  const tall = K && K.tall;
  const [c, x] = makeCanvas(18, tall ? 16 : 12);
  const top = tall ? 4 : 0;
  const cols = [['#f2d24a', '#fff2a0'], ['#e85a6a', '#ffb0b8'], ['#8a6ad8', '#c8b8ff'], ['#f4f0f4', '#ffffff'], ['#e8862a', '#ffc070'], ['#4a7ae8', '#a8c8ff']];
  const pick = K ? [K.cols[0], K.cols[0]] : [cols[Math.floor(rng() * cols.length)], cols[Math.floor(rng() * cols.length)]];
  for (let k = 0; k < 7; k++) {
    const px = 2 + Math.floor(rng() * 14), py = 3 + top + Math.floor(rng() * 6);
    const [a, b] = pick[k % 2];
    if (tall) {
      // a spike of bells (foxglove) or a tall flag (iris)
      x.fillStyle = '#3f7a32'; x.fillRect(px, py - 4, 1, 8);
      if (K.bell) { for (let j = 0; j < 4; j++) { x.fillStyle = j % 2 ? b : a; x.fillRect(px + (j % 2 ? 1 : -1), py - 4 + j * 2, 1, 2); } }
      else { x.fillStyle = a; x.fillRect(px - 1, py - 5, 3, 2); x.fillStyle = b; x.fillRect(px, py - 6, 1, 1); x.fillStyle = '#4a8a3a'; x.fillRect(px + 1, py - 2, 1, 5); }
      continue;
    }
    x.fillStyle = '#3f7a32'; x.fillRect(px, py + 1, 1, 3);
    if (rng() < 0.5) x.fillRect(px + 1, py + 2, 1, 1);
    if (K && K.bell) { x.fillStyle = a; x.fillRect(px + 1, py, 1, 2); x.fillRect(px - 1, py + 1, 1, 2); x.fillStyle = b; x.fillRect(px + 1, py, 1, 1); continue; }
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
  // a stack of split logs, ends out: four along the bottom, then three, then two
  const [c, x] = makeCanvas(20, 14);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4 - j; i++) {
    const px = 2 + i * 4 + j * 2, py = 9 - j * 3.5;
    disc(x, px + 1.5, py + 1.5, 2, '#7a5030'); x.fillStyle = '#d8b07a'; x.fillRect(px + 1, Math.round(py) + 1, 2, 2);
    x.fillStyle = '#a07a50'; x.fillRect(px + 1, Math.round(py) + 1, 1, 1);
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
  return outlineCanvas(c, OUTLINE);
}

// ---------------------------------------------------------------------------
// Rift-built: a lattice relay mast over a tin shack, a neon tavern, and a
// field of sun-glass panels. Same conventions as makeCottage.
// ---------------------------------------------------------------------------
function makeRelay(lit) {
  const W = 52, H = 120;
  const [c, x] = makeCanvas(W, H);
  ellipseFill(x, W / 2, H - 3, W / 2 - 4, 3, 'rgba(20,40,10,0.25)');
  const wallTop = H - 34, wallBot = H - 4;
  // corrugated tin shack
  x.fillStyle = '#7a8088'; x.fillRect(6, wallTop, W - 12, wallBot - wallTop);
  x.fillStyle = '#5e646c'; for (let i = 7; i < W - 6; i += 3) x.fillRect(i, wallTop, 1, wallBot - wallTop);
  x.fillStyle = '#4a4e56'; x.fillRect(4, wallTop - 4, W - 8, 4);
  x.fillStyle = '#9aa0a8'; x.fillRect(4, wallTop - 5, W - 8, 1);
  // door and a round porthole
  x.fillStyle = '#2a2a32'; x.fillRect(W / 2 - 6, wallBot - 20, 12, 20);
  x.fillStyle = lit ? '#7af0ff' : '#3a4450'; x.fillRect(W / 2 - 4, wallBot - 18, 8, 18);
  x.fillStyle = '#ff3aa8'; x.fillRect(W / 2 - 7, wallBot - 22, 14, 1);
  disc(x, 13, wallTop + 10, 4, '#2a2a32'); disc(x, 13, wallTop + 10, 3, lit ? '#7af0ff' : '#41556a');
  // the mast: a lattice tower
  const mx = W / 2 + 10, top = 6, base = wallTop - 4;
  for (let y = top; y < base; y++) {
    const half = 1 + Math.round((y - top) / (base - top) * 5);
    x.fillStyle = '#5a5e66'; x.fillRect(mx - half, y, 1, 1); x.fillRect(mx + half, y, 1, 1);
    if ((y - top) % 6 === 0) { x.fillStyle = '#7a7e86'; x.fillRect(mx - half, y, half * 2 + 1, 1); }
    if ((y - top) % 6 === 3) { x.fillStyle = '#4a4e56'; x.fillRect(mx - Math.round(half / 2), y, 1, 1); x.fillRect(mx + Math.round(half / 2), y, 1, 1); }
  }
  // dishes and the beacon
  x.fillStyle = '#c8ccd4'; x.fillRect(mx - 9, top + 22, 5, 7); x.fillStyle = '#8a9098'; x.fillRect(mx - 5, top + 25, 3, 1);
  x.fillStyle = '#c8ccd4'; x.fillRect(mx + 4, top + 38, 6, 6); x.fillStyle = '#8a9098'; x.fillRect(mx + 2, top + 41, 3, 1);
  x.fillStyle = '#5a5e66'; x.fillRect(mx, 0, 1, top);
  x.fillStyle = lit ? '#ff4a4a' : '#8a2a2a'; x.fillRect(mx - 1, top - 2, 3, 3);
  // cables to the shack
  x.fillStyle = '#26262e'; for (let k = 0; k < 10; k++) x.fillRect(mx - 3 - k, base - 2 + Math.round(Math.sin(k / 3) * 2), 1, 1);
  // a neon strip under the eaves
  x.fillStyle = lit ? '#3af0ff' : '#2a6a74'; x.fillRect(6, wallTop, W - 12, 1);
  return outlineCanvas(c, OUTLINE);
}

function makeNeonBar(lit) {
  return makeCottage({
    w: 80, wall: '#3e3850', roof: 'slate', windows: [10, 60], door: 40, chimneys: [56], lit,
    extra: (x, g) => {
      // a neon sign: a little glowing worm, curled up, over the door
      const sx = 26, sy = g.wallTop - 2;
      x.fillStyle = '#1a1a22'; x.fillRect(sx, sy, 28, 10);
      const glow = lit ? '#7aff5a' : '#3a7a2a', pink = lit ? '#ff3aa8' : '#7a2a5a';
      for (let i = 0; i < 20; i++) { x.fillStyle = i % 5 === 4 ? pink : glow; x.fillRect(sx + 4 + i, sy + 4 + Math.round(Math.sin(i * 0.8) * 2), 1, 1); }
      x.fillStyle = pink; x.fillRect(sx + 24, sy + 3, 2, 2);
      // neon strips along the walls
      x.fillStyle = lit ? '#b45aff' : '#4a2a6a'; x.fillRect(g.L, g.wallTop + 4, g.Rr - g.L, 1);
      x.fillStyle = lit ? '#3af0ff' : '#2a5a64'; x.fillRect(g.L, g.wallBot - 6, g.Rr - g.L, 1);
    },
  });
}

function makeSolarArray(lit) {
  const W = 84, H = 46;
  const [c, x] = makeCanvas(W, H);
  ellipseFill(x, W / 2, H - 3, W / 2 - 4, 3, 'rgba(20,40,10,0.25)');
  // three tilted panels on legs
  for (let p = 0; p < 3; p++) {
    const px = 4 + p * 26, py = 8 + (p % 2) * 3;
    x.fillStyle = '#5a5e66'; x.fillRect(px + 4, py + 14, 2, H - py - 18); x.fillRect(px + 16, py + 12, 2, H - py - 16);
    for (let j = 0; j < 14; j++) {
      const sh = Math.round(j * 0.4);
      x.fillStyle = j === 0 ? '#9ab0d0' : '#1e3a6a'; x.fillRect(px + sh, py + j, 22, 1);
    }
    x.fillStyle = '#5a7ab0';
    for (let k = 1; k < 4; k++) for (let j = 1; j < 14; j++) x.fillRect(px + Math.round(j * 0.4) + k * 6, py + j, 1, 1);
    x.fillRect(px + 1, py + 7, 22, 1);
    x.fillStyle = '#c8e0ff'; x.fillRect(px + 3, py + 2, 4, 1);
  }
  // a small control box with a door
  const bx = W / 2 - 7, by = H - 22;
  x.fillStyle = '#6a7078'; x.fillRect(bx, by, 14, 18);
  x.fillStyle = '#2a2a32'; x.fillRect(bx + 4, by + 6, 6, 12);
  x.fillStyle = lit ? '#7aff5a' : '#2a5a2a'; x.fillRect(bx + 2, by + 2, 2, 2);
  x.fillStyle = lit ? '#ffd23a' : '#5a4a1a'; x.fillRect(bx + 10, by + 2, 2, 2);
  return outlineCanvas(c, OUTLINE);
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
  chip: ['.........', '.k.k.k.k.', 'kkkkkkkkk', '.kzzzzzk.', 'kkzcczkkk', '.kzcczzk.', 'kkzzzzzkk', '.kkkkkkk.', '.k.k.k.k.'],
  rift: ['....m....', '...mcm...', '...mkm...', '..mckcm..', '..mkkkm..', '..mckcm..', '...mkm...', '...mcm...', '....m....'],
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
    if (k === 'chip') pal.z = '#2a5a4a', pal.c = '#5af8ff', pal.k = '#3a3a44';
    if (k === 'rift') pal.m = '#c050ff', pal.c = '#5af8ff', pal.k = '#14081e';
    ICONS[k] = spriteFrom(ICON_ROWS[k], pal);
  }
}
