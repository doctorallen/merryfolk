'use strict';
// ---------------------------------------------------------------------------
// Props, crops and animals for the isometric view (iso.js). Each pixel-art
// maker gets its canvas tagged with a kind, so a bench, a lamp-post or a hay
// bale can be recognised wherever it was put down; here each kind is drawn
// again as a small lit object on the angled ground. Crops are drawn for every
// growth stage, and farm animals, pets, rabbits, hens, crows and ducks are
// drawn fresh each frame.
// ---------------------------------------------------------------------------

(() => {
  // --- recognising props ----------------------------------------------------------
  const TAGS = {
    makeBench: 'bench', makeTable: 'table', makeLampPost: 'lamp', makeWell: 'well', makeStall: 'stall', makeNoticeBoard: 'notice', makeSignpost: 'signpost',
    makeMailbox: 'mailbox', makeWoodpile: 'woodpile', makeHay: 'hay', makeTrough: 'trough', makeShelter: 'shelter', makeBarrow: 'barrow', makeScarecrow: 'scarecrow',
    makeHenhouse: 'henhouse', makeBeehive: 'hive', makeHive: 'hive', makeMemorialStone: 'memorial', makeWagon: 'wagon', makeSwing: 'swing', makeMaypole: 'maypole',
    makeInnSign: 'innsign', makeLogSeat: 'log', makeBarrel: 'barrel',
  };
  for (const [name, kind] of Object.entries(TAGS)) {
    const f = window[name]; if (typeof f !== 'function') continue;
    window[name] = function (...a) { const c = f.apply(this, a); if (c) { c.isoKind = kind; if (name === 'makeMailbox') c.isoCol = a[0]; } return c; };
  }
  { const f = window.makeFence; if (typeof f === 'function') window.makeFence = function (horizontal) { const c = f(horizontal); if (c) c.isoKind = horizontal ? 'fenceH' : 'fenceV'; return c; }; }

  const BK = Iso.BK, rng = Iso.rng, pick = Iso.pick, tint = Iso.tint, pathPoly = Iso.pathPoly;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  // A sprite canvas with its foot point; L() places a point given in tiles from
  // the foot (x east, y south) and a height in iso units.
  function sheet(w, h, ax, ay) {
    const c = mk(w * BK, h * BK), g = c.getContext('2d');
    const A = { c, g, ax: ax * BK, ay: ay * BK };
    A.L = (dx, dy, z = 0) => [A.ax + (dx - dy) * 32 * BK, A.ay + ((dx + dy) * 16 - z) * BK];
    return A;
  }
  function box(A, x0, y0, x1, y1, z0, h, top, south, east) {
    const g = A.g, L = A.L;
    g.fillStyle = south; pathPoly(g, [L(x0, y1, z0), L(x1, y1, z0), L(x1, y1, z0 + h), L(x0, y1, z0 + h)]); g.fill();
    g.fillStyle = east; pathPoly(g, [L(x1, y1, z0), L(x1, y0, z0), L(x1, y0, z0 + h), L(x1, y1, z0 + h)]); g.fill();
    g.fillStyle = top; pathPoly(g, [L(x0, y0, z0 + h), L(x1, y0, z0 + h), L(x1, y1, z0 + h), L(x0, y1, z0 + h)]); g.fill();
  }
  function post(A, x, y, z0, h, w, col) { const [px, py] = A.L(x, y, z0), g = A.g; g.fillStyle = col; g.fillRect(px - (w / 2) * BK, py - h * BK, w * BK, h * BK); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(px, py - h * BK, (w / 2) * BK, h * BK); }
  function shadow(A, rx, ry, dx = 0.15, dy = 0.1) { const [x, y] = A.L(dx, dy, 0), g = A.g, gr = g.createRadialGradient(x, y, 1, x, y, rx * BK); gr.addColorStop(0, 'rgba(20,24,8,0.32)'); gr.addColorStop(1, 'rgba(20,24,8,0)'); g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx * BK, 0, Math.PI * 2); g.fill(); g.restore(); }
  const WOOD = ['#9a7448', '#6a4a2a', '#4a3018'], DARK = ['#7a5634', '#4a3220', '#2a1c12'];
  const snowCap = (A, pts, season) => { if (season !== 'winter') return; A.g.fillStyle = 'rgba(244,247,250,0.85)'; pathPoly(A.g, pts); A.g.fill(); };
  function stone(A, x, y, r, z = 0, cols = ['#c8bca4', '#8e8472', '#5e5446']) {
    const [px, py] = A.L(x, y, z), g = A.g, gr = g.createRadialGradient(px - r * 0.4 * BK, py - r * 0.9 * BK, 1, px, py - r * 0.4 * BK, r * 1.2 * BK);
    gr.addColorStop(0, cols[0]); gr.addColorStop(0.6, cols[1]); gr.addColorStop(1, cols[2]); g.fillStyle = gr; g.beginPath(); g.ellipse(px, py - r * 0.45 * BK, r * BK, r * 0.72 * BK, 0, 0, Math.PI * 2); g.fill();
  }

  const P = {};
  // simple wooden furniture
  P.bench = { bake(s, lit, season) { const A = sheet(80, 50, 40, 36); shadow(A, 26, 9); box(A, -0.45, -0.12, 0.45, 0.12, 9, 3, WOOD[0], WOOD[1], WOOD[2]); box(A, -0.45, -0.2, 0.45, -0.12, 12, 9, WOOD[0], WOOD[1], WOOD[2]); for (const x of [-0.38, 0.38]) post(A, x, 0.1, 0, 9, 2.4, DARK[1]); snowCap(A, [A.L(-0.45, -0.12, 12.5), A.L(0.45, -0.12, 12.5), A.L(0.45, 0.12, 12.5), A.L(-0.45, 0.12, 12.5)], season); return A; } };
  P.table = { bake(s, lit, season) { const A = sheet(80, 56, 40, 38); shadow(A, 24, 10); box(A, -0.4, -0.3, 0.4, 0.3, 14, 3, '#a8804e', '#7a5634', '#5a3e22'); for (const [x, y] of [[-0.33, 0.25], [0.33, 0.25], [0.33, -0.25]]) post(A, x, y, 0, 14, 2.4, DARK[1]); A.g.fillStyle = '#e8d8b0'; const [mx, my] = A.L(-0.1, 0, 17); A.g.beginPath(); A.g.ellipse(mx, my, 4 * BK, 2 * BK, 0, 0, Math.PI * 2); A.g.fill(); return A; } };
  P.log = { bake(s, lit, season) { const A = sheet(70, 40, 35, 28); shadow(A, 22, 7); const g = A.g, a = A.L(-0.45, 0, 5), b = A.L(0.45, 0, 5); g.strokeStyle = '#6a4a2a'; g.lineWidth = 10 * BK; g.lineCap = 'round'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); g.strokeStyle = 'rgba(255,230,190,0.22)'; g.lineWidth = 2.5 * BK; g.beginPath(); g.moveTo(a[0], a[1] - 3 * BK); g.lineTo(b[0], b[1] - 3 * BK); g.stroke(); g.fillStyle = '#d8b680'; g.beginPath(); g.ellipse(b[0], b[1], 4 * BK, 5 * BK, 0, 0, Math.PI * 2); g.fill(); return A; } };
  P.barrel = { bake() { const A = sheet(30, 40, 15, 34); shadow(A, 10, 4); barrelAt(A.g, A.ax, A.ay, BK * 0.9); return A; } };
  function barrelAt(g, x, y, s) {
    const w = 11 * s, h = 17 * s, bg = g.createLinearGradient(x - w, 0, x + w, 0); bg.addColorStop(0, '#a87a4a'); bg.addColorStop(0.45, '#8a5e34'); bg.addColorStop(1, '#4a3018');
    g.fillStyle = bg; g.beginPath(); g.moveTo(x - w * 0.9, y - h); g.quadraticCurveTo(x - w * 1.15, y - h / 2, x - w * 0.9, y); g.lineTo(x + w * 0.9, y); g.quadraticCurveTo(x + w * 1.15, y - h / 2, x + w * 0.9, y - h); g.closePath(); g.fill();
    g.fillStyle = '#3a3634'; for (const f of [0.2, 0.75]) g.fillRect(x - w * 1.02, y - h * f - 1.1 * s, w * 2.04, 2.2 * s);
    g.fillStyle = '#b88a5a'; g.beginPath(); g.ellipse(x, y - h, w * 0.9, w * 0.4, 0, 0, Math.PI * 2); g.fill();
  }
  P.lamp = { key: (s, lit) => (lit ? 1 : 0), bake(s, lit, season) {
    const A = sheet(60, 90, 30, 82), g = A.g, [x, y] = A.L(0, 0, 0); shadow(A, 10, 4);
    g.fillStyle = '#2a2420'; g.fillRect(x - 1.6 * BK, y - 46 * BK, 3.2 * BK, 46 * BK); g.fillStyle = '#4a4440'; g.fillRect(x - 1.6 * BK, y - 46 * BK, 1.2 * BK, 46 * BK); g.fillRect(x - 6 * BK, y - 48 * BK, 12 * BK, 2.4 * BK);
    if (lit) { const lg = g.createRadialGradient(x, y - 54 * BK, 1, x, y - 54 * BK, 26 * BK); lg.addColorStop(0, 'rgba(255,214,120,0.55)'); lg.addColorStop(1, 'rgba(255,214,120,0)'); g.fillStyle = lg; g.fillRect(x - 26 * BK, y - 80 * BK, 52 * BK, 52 * BK); }
    g.fillStyle = lit ? '#ffd77a' : '#b8b0a0'; g.fillRect(x - 4.5 * BK, y - 59 * BK, 9 * BK, 11 * BK); g.strokeStyle = '#2a2420'; g.lineWidth = 1.4 * BK; g.strokeRect(x - 4.5 * BK, y - 59 * BK, 9 * BK, 11 * BK);
    g.fillStyle = season === 'winter' ? '#eef2f4' : '#2a2420'; g.beginPath(); g.moveTo(x - 6.5 * BK, y - 59 * BK); g.lineTo(x, y - 65 * BK); g.lineTo(x + 6.5 * BK, y - 59 * BK); g.fill();
    return A;
  } };
  P.well = { bake(s, lit, season) {
    const A = sheet(80, 110, 40, 92), g = A.g, [x, y] = A.L(0, 0, 0); shadow(A, 26, 10, 0.25, 0.1);
    const sg = g.createLinearGradient(x - 18 * BK, 0, x + 18 * BK, 0); sg.addColorStop(0, '#c4b8a0'); sg.addColorStop(1, '#7a705e');
    g.fillStyle = sg; g.beginPath(); g.ellipse(x, y, 18 * BK, 9 * BK, 0, 0, Math.PI); g.lineTo(x - 18 * BK, y - 16 * BK); g.ellipse(x, y - 16 * BK, 18 * BK, 9 * BK, 0, Math.PI, 0, true); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,50,40,0.4)'; g.lineWidth = 1; for (let k = 1; k < 3; k++) { g.beginPath(); g.ellipse(x, y - k * 6 * BK, 18 * BK, 9 * BK, 0, 0, Math.PI); g.stroke(); }
    g.fillStyle = '#d2c6aa'; g.beginPath(); g.ellipse(x, y - 16 * BK, 18 * BK, 9 * BK, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1a2a34'; g.beginPath(); g.ellipse(x, y - 16 * BK, 13 * BK, 6 * BK, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5a3e26'; g.fillRect(x - 16 * BK, y - 52 * BK, 3 * BK, 38 * BK); g.fillRect(x + 13 * BK, y - 52 * BK, 3 * BK, 38 * BK);
    g.fillStyle = season === 'winter' ? '#eef2f4' : '#8a4a32'; g.beginPath(); g.moveTo(x - 23 * BK, y - 48 * BK); g.lineTo(x, y - 68 * BK); g.lineTo(x + 23 * BK, y - 48 * BK); g.lineTo(x + 20 * BK, y - 45 * BK); g.lineTo(x, y - 62 * BK); g.lineTo(x - 20 * BK, y - 45 * BK); g.closePath(); g.fill();
    g.strokeStyle = '#3a2614'; g.lineWidth = 1.6 * BK; g.beginPath(); g.moveTo(x - 13 * BK, y - 42 * BK); g.lineTo(x + 13 * BK, y - 42 * BK); g.moveTo(x + 2 * BK, y - 42 * BK); g.lineTo(x + 2 * BK, y - 28 * BK); g.stroke(); g.fillStyle = '#7a5634'; g.fillRect(x - 1 * BK, y - 28 * BK, 6 * BK, 6 * BK);
    return A;
  } };
  P.stall = { bake(s, lit, season) {
    const A = sheet(120, 110, 60, 80), g = A.g, L = A.L; shadow(A, 40, 14, 0.3, 0.2);
    box(A, -0.75, -0.35, 0.75, 0.35, 0, 18, '#9a7448', '#6a4a2a', '#4a3018');
    const R = rng(5); for (let k = 0; k < 9; k++) { const [px, py] = L(-0.6 + (k % 5) * 0.28, -0.15 + Math.floor(k / 5) * 0.25, 18); const col = pick(R, ['#d8782a', '#c4302a', '#8ab030', '#e8c040']), pg = g.createRadialGradient(px - 1.5 * BK, py - 4 * BK, 0.5, px, py - 3 * BK, 5 * BK); pg.addColorStop(0, tint(col, 0.3)); pg.addColorStop(1, tint(col, -0.3)); g.fillStyle = pg; g.beginPath(); g.ellipse(px, py - 3 * BK, 4.5 * BK, 3.6 * BK, 0, 0, Math.PI * 2); g.fill(); }
    for (const [x, y] of [[-0.75, -0.35], [0.75, -0.35], [0.75, 0.35], [-0.75, 0.35]]) post(A, x, y, 0, 56, 2.4, '#4a3018');
    const a0 = L(-0.85, -0.45, 60), a1 = L(0.85, -0.45, 60), a2 = L(0.85, 0.6, 46), a3 = L(-0.85, 0.6, 46);
    for (let k = 0; k < 8; k++) { const t0 = k / 8, t1 = (k + 1) / 8, lp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; g.fillStyle = k % 2 ? '#f2e8d0' : '#b8443a'; pathPoly(g, [lp(a0, a1, t0), lp(a0, a1, t1), lp(a3, a2, t1), lp(a3, a2, t0)]); g.fill(); const [px, py] = lp(a3, a2, (k + 0.5) / 8); g.beginPath(); g.arc(px, py, 4.5 * BK, 0, Math.PI); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.1)'; pathPoly(g, [a0, a1, a2, a3]); g.fill(); snowCap(A, [a0, a1, a2, a3], season);
    return A;
  } };
  P.notice = { bake(s, lit, season) {
    const A = sheet(70, 80, 35, 70), g = A.g, L = A.L; shadow(A, 18, 6);
    for (const x of [-0.32, 0.32]) post(A, x, 0, 0, 40, 3, '#5a3e26');
    const q = [L(-0.42, 0, 20), L(0.42, 0, 20), L(0.42, 0, 42), L(-0.42, 0, 42)]; g.fillStyle = '#7a5634'; pathPoly(g, q); g.fill();
    const R = rng(9); for (let k = 0; k < 5; k++) { const [px, py] = L(-0.3 + k * 0.14, 0, 36 - (k % 2) * 8); g.fillStyle = pick(R, ['#f2ead0', '#e8dcc0', '#f8f0e0']); g.save(); g.translate(px, py); g.transform(1, 0.5, 0, 1, 0, 0); g.fillRect(-3 * BK, -4 * BK, 6 * BK, 7 * BK); g.restore(); }
    g.fillStyle = season === 'winter' ? '#eef2f4' : '#5a3a22'; pathPoly(g, [L(-0.5, -0.05, 42), L(0.5, -0.05, 42), L(0.5, 0.1, 46), L(-0.5, 0.1, 46)]); g.fill();
    return A;
  } };
  P.signpost = { bake() {
    const A = sheet(80, 80, 40, 70), g = A.g, L = A.L; shadow(A, 10, 4); post(A, 0, 0, 0, 48, 3.2, '#5a3e26');
    const board = (z, dir, txt) => { const [x, y] = L(0, 0, z); g.save(); g.translate(x, y); g.transform(1, dir * 0.5, 0, 1, 0, 0); g.fillStyle = '#9a7448'; g.beginPath(); g.moveTo(0, -4 * BK); g.lineTo(dir * 24 * BK, -4 * BK); g.lineTo(dir * 28 * BK, 0); g.lineTo(dir * 24 * BK, 4 * BK); g.lineTo(0, 4 * BK); g.closePath(); g.fill(); g.fillStyle = '#3a2614'; g.fillRect(dir > 0 ? 4 * BK : -22 * BK, -1 * BK, 16 * BK, 1.4 * BK); g.restore(); };
    board(44, -1); board(34, 1);
    return A;
  } };
  P.mailbox = { key: (s) => s.img && s.img.isoCol, bake(s) {
    const A = sheet(40, 60, 20, 52), col = (s.img && s.img.isoCol) || '#c4433a'; shadow(A, 8, 3); post(A, 0, 0, 0, 24, 2.4, '#5a3e26');
    box(A, -0.16, -0.1, 0.16, 0.1, 24, 9, tint(col, 0.15), col, tint(col, -0.35)); A.g.fillStyle = '#e8c060'; const [x, y] = A.L(0.16, 0.05, 29); A.g.fillRect(x, y - 2 * BK, 1.4 * BK, 4 * BK); return A;
  } };
  P.woodpile = { bake(s, lit, season) {
    const A = sheet(70, 50, 35, 40), g = A.g; shadow(A, 22, 7);
    [5, 4, 3].forEach((n, r) => { for (let k = 0; k < n; k++) { const [x, y] = A.L(-0.3 + k * 0.14 + r * 0.07, 0, 4 + r * 7); g.fillStyle = '#8a6440'; g.beginPath(); g.moveTo(x, y - 4 * BK); g.lineTo(x + 14 * BK, y + 3 * BK); g.lineTo(x + 14 * BK, y + 9 * BK); g.lineTo(x, y + 4 * BK); g.fill(); const eg = g.createRadialGradient(x - 1, y, 1, x, y, 5 * BK); eg.addColorStop(0, '#f0d4a0'); eg.addColorStop(1, '#a87e4a'); g.fillStyle = eg; g.beginPath(); g.ellipse(x, y, 4 * BK, 4.4 * BK, 0, 0, Math.PI * 2); g.fill(); } });
    snowCap(A, [A.L(-0.3, 0, 26), A.L(0.4, 0, 26), A.L(0.4, 0.1, 24), A.L(-0.3, 0.1, 24)], season);
    return A;
  } };
  P.hay = { bake(s, lit, season) {
    const A = sheet(50, 50, 25, 42), g = A.g, [x, y] = A.L(0, 0, 0); shadow(A, 16, 6);
    const hg = g.createLinearGradient(x - 14 * BK, 0, x + 14 * BK, 0); hg.addColorStop(0, '#e8cc7a'); hg.addColorStop(1, '#9a7a32'); g.fillStyle = hg; g.beginPath(); g.ellipse(x, y - 11 * BK, 14 * BK, 12 * BK, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(120,90,30,0.55)'; g.lineWidth = 1; for (const r of [3, 7, 11]) { g.beginPath(); g.ellipse(x - 3 * BK, y - 11 * BK, r * 0.6 * BK, r * BK, 0, 0, Math.PI * 2); g.stroke(); }
    if (season === 'winter') { g.fillStyle = 'rgba(244,247,250,0.85)'; g.beginPath(); g.ellipse(x, y - 19 * BK, 11 * BK, 4 * BK, 0, 0, Math.PI * 2); g.fill(); }
    return A;
  } };
  P.trough = { bake() { const A = sheet(60, 40, 30, 30); shadow(A, 18, 6); box(A, -0.5, -0.15, 0.5, 0.15, 0, 8, '#5a3a22', '#6a4a2a', '#4a3018'); A.g.fillStyle = '#5d9fcf'; pathPoly(A.g, [A.L(-0.44, -0.1, 8), A.L(0.44, -0.1, 8), A.L(0.44, 0.1, 8), A.L(-0.44, 0.1, 8)]); A.g.fill(); return A; } };
  P.shelter = { bake(s, lit, season) {
    const A = sheet(100, 90, 50, 64), g = A.g, L = A.L; shadow(A, 32, 12, 0.3, 0.2);
    for (const [x, y] of [[-0.8, -0.4], [0.8, -0.4], [0.8, 0.4], [-0.8, 0.4]]) post(A, x, y, 0, 30, 3, '#5a3a22');
    box(A, -0.75, -0.38, 0.75, -0.3, 0, 22, '#3a2414', '#3a2414', '#2a1a0c');
    const t = [L(-0.95, -0.55, 40), L(0.95, -0.55, 40), L(0.95, 0.6, 28), L(-0.95, 0.6, 28)]; g.fillStyle = season === 'winter' ? '#eef2f4' : '#c9a04a'; pathPoly(g, t); g.fill();
    g.strokeStyle = 'rgba(120,80,30,0.5)'; g.lineWidth = 1; for (let k = 1; k < 8; k++) { const f = k / 8, p = [t[0][0] + (t[1][0] - t[0][0]) * f, t[0][1] + (t[1][1] - t[0][1]) * f], q = [t[3][0] + (t[2][0] - t[3][0]) * f, t[3][1] + (t[2][1] - t[3][1]) * f]; g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); }
    return A;
  } };
  P.barrow = { bake() { const A = sheet(60, 40, 30, 30), g = A.g; shadow(A, 16, 6); box(A, -0.3, -0.15, 0.2, 0.15, 6, 8, '#9a6a40', '#7a5030', '#5a3a22'); const [wx, wy] = A.L(0.25, 0.1, 5); g.strokeStyle = '#3a2414'; g.lineWidth = 2 * BK; g.beginPath(); g.ellipse(wx, wy, 3 * BK, 5 * BK, 0, 0, Math.PI * 2); g.stroke(); g.strokeStyle = '#5a3a22'; g.beginPath(); g.moveTo(...A.L(-0.3, -0.1, 12)); g.lineTo(...A.L(-0.6, -0.1, 8)); g.stroke(); g.fillStyle = '#e8762a'; const [cx, cy] = A.L(-0.05, 0, 15); g.beginPath(); g.arc(cx, cy, 2.4 * BK, 0, Math.PI * 2); g.fill(); g.fillStyle = '#4a8a3a'; g.beginPath(); g.arc(cx - 4 * BK, cy + 1 * BK, 2.4 * BK, 0, Math.PI * 2); g.fill(); return A; } };
  P.scarecrow = { bake(s, lit, season) {
    const A = sheet(50, 80, 25, 70), g = A.g, [x, y] = A.L(0, 0, 0); shadow(A, 10, 4);
    g.fillStyle = '#6a4a2a'; g.fillRect(x - 1.4 * BK, y - 46 * BK, 2.8 * BK, 46 * BK); g.fillRect(x - 14 * BK, y - 34 * BK, 28 * BK, 2.4 * BK);
    g.fillStyle = '#5a7a9a'; g.beginPath(); g.moveTo(x - 9 * BK, y - 35 * BK); g.lineTo(x + 9 * BK, y - 35 * BK); g.lineTo(x + 7 * BK, y - 18 * BK); g.lineTo(x - 7 * BK, y - 18 * BK); g.closePath(); g.fill();
    g.fillStyle = '#e8d8a0'; g.beginPath(); g.arc(x, y - 41 * BK, 5 * BK, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c9a04a'; for (const d of [-1, 1]) { g.fillRect(x + d * 13 * BK - 1, y - 34 * BK, 3 * BK, 4 * BK); }
    g.fillStyle = season === 'winter' ? '#eef2f4' : '#4a3a2a'; g.beginPath(); g.ellipse(x, y - 45 * BK, 9 * BK, 2.4 * BK, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(x - 5 * BK, y - 45 * BK); g.lineTo(x, y - 54 * BK); g.lineTo(x + 5 * BK, y - 45 * BK); g.fill();
    return A;
  } };
  P.henhouse = { bake(s, lit, season) {
    const A = sheet(90, 80, 45, 58), g = A.g, L = A.L; shadow(A, 28, 10, 0.3, 0.2);
    for (const [x, y] of [[-0.6, 0.3], [0.6, 0.3], [0.6, -0.3]]) post(A, x, y, 0, 8, 2.4, '#4a3018');
    box(A, -0.65, -0.35, 0.65, 0.35, 8, 20, '#8a5634', '#a0603a', '#7a4a2a');
    const t = [L(-0.8, -0.5, 26), L(0.8, -0.5, 26), L(0.8, 0.5, 34), L(-0.8, 0.5, 34)]; const ridge = [L(-0.8, 0, 40), L(0.8, 0, 40)];
    g.fillStyle = season === 'winter' ? '#eef2f4' : '#8a3a2a'; pathPoly(g, [L(-0.8, 0.5, 26), L(0.8, 0.5, 26), ridge[1], ridge[0]]); g.fill();
    g.fillStyle = '#2a1a0c'; const [dx, dy] = L(0.1, 0.35, 8); g.fillRect(dx - 3 * BK, dy - 10 * BK, 6 * BK, 10 * BK);
    g.strokeStyle = '#7a5634'; g.lineWidth = 2 * BK; g.beginPath(); g.moveTo(dx, dy); g.lineTo(...L(0.2, 0.75, 0)); g.stroke();
    void t; return A;
  } };
  P.hive = { bake(s, lit, season) {
    const A = sheet(40, 50, 20, 42), g = A.g, [x, y] = A.L(0, 0, 0); shadow(A, 10, 4); g.fillStyle = '#5a3a22'; g.fillRect(x - 9 * BK, y - 4 * BK, 18 * BK, 4 * BK);
    const hg = g.createRadialGradient(x - 4 * BK, y - 18 * BK, 1, x, y - 12 * BK, 14 * BK); hg.addColorStop(0, '#f0d48a'); hg.addColorStop(1, '#a87a32'); g.fillStyle = hg; g.beginPath(); g.moveTo(x - 10 * BK, y - 4 * BK); g.quadraticCurveTo(x - 11 * BK, y - 24 * BK, x, y - 25 * BK); g.quadraticCurveTo(x + 11 * BK, y - 24 * BK, x + 10 * BK, y - 4 * BK); g.fill();
    g.strokeStyle = 'rgba(120,80,20,0.5)'; g.lineWidth = 1; for (let k = 1; k < 5; k++) { g.beginPath(); g.ellipse(x, y - 4 * BK - k * 4.4 * BK, 10 * BK * (1 - k * 0.15), 2.4 * BK, 0, 0, Math.PI); g.stroke(); }
    g.fillStyle = '#2a1a0c'; g.beginPath(); g.arc(x, y - 6 * BK, 1.6 * BK, 0, Math.PI * 2); g.fill();
    if (season === 'winter') { g.fillStyle = 'rgba(244,247,250,0.85)'; g.beginPath(); g.ellipse(x, y - 23 * BK, 7 * BK, 3 * BK, 0, 0, Math.PI * 2); g.fill(); }
    return A;
  } };
  P.memorial = { key: (s) => (s.img && s.img.width) || 0, bake(s, lit, season) {
    const A = sheet(40, 50, 20, 44), g = A.g, [x, y] = A.L(0, 0, 0); shadow(A, 10, 4);
    const sg = g.createLinearGradient(x - 8 * BK, 0, x + 8 * BK, 0); sg.addColorStop(0, '#c8c0b0'); sg.addColorStop(1, '#7a7468'); g.fillStyle = sg;
    g.beginPath(); g.moveTo(x - 7 * BK, y); g.lineTo(x - 7 * BK, y - 18 * BK); g.arc(x, y - 18 * BK, 7 * BK, Math.PI, 0); g.lineTo(x + 7 * BK, y); g.closePath(); g.fill();
    g.fillStyle = 'rgba(60,54,46,0.6)'; g.fillRect(x - 4 * BK, y - 18 * BK, 8 * BK, 1.2 * BK); g.fillRect(x - 3 * BK, y - 14 * BK, 6 * BK, 1.2 * BK);
    g.fillStyle = 'rgba(90,130,50,0.5)'; g.beginPath(); g.ellipse(x, y - 1 * BK, 9 * BK, 2.4 * BK, 0, 0, Math.PI * 2); g.fill();
    return A;
  } };
  P.wagon = { bake(s, lit, season) {
    const A = sheet(120, 100, 60, 76), g = A.g, L = A.L; shadow(A, 38, 13, 0.3, 0.2);
    box(A, -0.8, -0.35, 0.8, 0.35, 10, 14, '#9a6a40', '#7a5030', '#5a3a22');
    for (const [x, y] of [[-0.55, 0.35], [0.55, 0.35]]) { const [wx, wy] = L(x, y, 9); g.strokeStyle = '#3a2614'; g.lineWidth = 2.4 * BK; g.beginPath(); g.ellipse(wx, wy, 6 * BK, 9 * BK, 0, 0, Math.PI * 2); g.stroke(); }
    const t0 = L(-0.8, -0.35, 24), t1 = L(0.8, -0.35, 24), t2 = L(0.8, 0.35, 24), t3 = L(-0.8, 0.35, 24), r0 = L(-0.8, 0, 48), r1 = L(0.8, 0, 48);
    g.fillStyle = season === 'winter' ? '#e8eef0' : '#efe6cf'; pathPoly(g, [t3, t2, r1, r0]); g.fill(); g.fillStyle = '#c8bca0'; pathPoly(g, [t2, t1, r1]); g.fill();
    g.strokeStyle = 'rgba(120,100,70,0.5)'; g.lineWidth = 1; for (let k = 1; k < 5; k++) { const f = k / 5, p = [t3[0] + (t2[0] - t3[0]) * f, t3[1] + (t2[1] - t3[1]) * f], q = [r0[0] + (r1[0] - r0[0]) * f, r0[1] + (r1[1] - r0[1]) * f]; g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); }
    void t0; return A;
  } };
  P.swing = { bake() { const A = sheet(80, 90, 40, 80), g = A.g, L = A.L; shadow(A, 22, 8); for (const x of [-0.5, 0.5]) { g.strokeStyle = '#6a4a2a'; g.lineWidth = 2.6 * BK; g.beginPath(); g.moveTo(...L(x, -0.25, 0)); g.lineTo(...L(x, 0, 46)); g.lineTo(...L(x, 0.25, 0)); g.stroke(); } g.beginPath(); g.moveTo(...L(-0.5, 0, 46)); g.lineTo(...L(0.5, 0, 46)); g.stroke(); g.lineWidth = 1; g.strokeStyle = '#8a7a5a'; for (const x of [-0.1, 0.1]) { g.beginPath(); g.moveTo(...L(x, 0, 46)); g.lineTo(...L(x, 0, 12)); g.stroke(); } box(A, -0.14, -0.05, 0.14, 0.05, 11, 2, '#9a7448', '#6a4a2a', '#4a3018'); return A; } };
  P.maypole = { bake() { const A = sheet(80, 120, 40, 110), g = A.g, [x, y] = A.L(0, 0, 0); shadow(A, 18, 7); g.fillStyle = '#f2ead8'; g.fillRect(x - 1.6 * BK, y - 90 * BK, 3.2 * BK, 90 * BK); const cols = ['#e44a6a', '#f2d75a', '#5fd3c6', '#b49ae0', '#6aa340']; cols.forEach((c, k) => { const a = (k / cols.length) * Math.PI * 2; g.strokeStyle = c; g.lineWidth = 1.4 * BK; g.beginPath(); g.moveTo(x, y - 88 * BK); g.quadraticCurveTo(x + Math.cos(a) * 14 * BK, y - 50 * BK, x + Math.cos(a) * 26 * BK, y - 2 * BK + Math.sin(a) * 8 * BK); g.stroke(); }); g.fillStyle = '#6aa340'; g.beginPath(); g.arc(x, y - 90 * BK, 5 * BK, 0, Math.PI * 2); g.fill(); return A; } };
  P.innsign = { bake() { const A = sheet(60, 80, 30, 72), g = A.g, [x, y] = A.L(0, 0, 0); shadow(A, 10, 4); g.fillStyle = '#4a3018'; g.fillRect(x - 1.6 * BK, y - 52 * BK, 3.2 * BK, 52 * BK); g.fillRect(x, y - 50 * BK, 18 * BK, 2.4 * BK); g.fillStyle = '#6a3a1e'; g.fillRect(x + 4 * BK, y - 46 * BK, 15 * BK, 16 * BK); g.strokeStyle = '#d6a24a'; g.lineWidth = 1.2 * BK; g.strokeRect(x + 4 * BK, y - 46 * BK, 15 * BK, 16 * BK); g.fillStyle = '#f0e6d0'; g.beginPath(); g.ellipse(x + 11.5 * BK, y - 38 * BK, 5 * BK, 3 * BK, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1a1410'; g.fillRect(x + 7 * BK, y - 39 * BK, 9 * BK, 1.6 * BK); return A; } };
  const fence = (along) => ({ bake(s, lit, season) {
    const A = sheet(60, 40, 30, 30), g = A.g, L = A.L, ax = along ? [-0.5, 0] : [0, -0.5], bx = along ? [0.5, 0] : [0, 0.5];
    for (const p of [ax, bx]) post(A, p[0], p[1], 0, 16, 2.6, '#5a4028');
    for (const z of [6, 12]) { g.strokeStyle = '#7a5634'; g.lineWidth = 2.2 * BK; g.beginPath(); g.moveTo(...L(ax[0], ax[1], z)); g.lineTo(...L(bx[0], bx[1], z)); g.stroke(); }
    if (season === 'winter') { g.strokeStyle = 'rgba(244,247,250,0.85)'; g.lineWidth = 1.4 * BK; g.beginPath(); g.moveTo(...L(ax[0], ax[1], 13.5)); g.lineTo(...L(bx[0], bx[1], 13.5)); g.stroke(); }
    return A;
  } });
  P.fenceH = fence(true); P.fenceV = fence(false);
  P.rock = { key: (s) => `${s.rock}:${Math.round(s.x) % 3}`, bake(s, lit, season) {
    const r = [5, 8, 12][Math.min(2, (s.rock || 1) - 1)], A = sheet(r * 3 + 10, r * 2.4 + 10, r * 1.5 + 5, r * 1.6 + 6); shadow(A, r * 1.3, r * 0.5, 0.1, 0.05);
    stone(A, 0, 0, r); if (r > 6) stone(A, 0.18, 0.08, r * 0.55, 0, ['#bcb098', '#857a68', '#5a5042']);
    A.g.fillStyle = season === 'winter' ? 'rgba(244,247,250,0.85)' : 'rgba(90,130,50,0.45)'; const [x, y] = A.L(0, 0, 0); A.g.beginPath(); A.g.ellipse(x - r * 0.3 * BK, y - r * 0.95 * BK, r * 0.5 * BK, r * 0.2 * BK, 0, 0, Math.PI * 2); A.g.fill();
    return A;
  } };
  P.hedge = { key: (s) => `${s.gen.len}:${s.gen.dir}:${(s.gen.seed || 0) % 3}`, bias: 0, bake(s, lit, season) {
    const len = s.gen.len || 1, h = s.gen.dir === 'h', W = (len * 40 + 60), A = sheet(W, len * 22 + 60, W / 2, len * 11 + 40), g = A.g, R = rng((s.gen.seed || 1) * 7);
    // the static sits at the middle of a horizontal hedge, or the south end of a vertical one
    const x0 = h ? -len / 2 : -0.35, x1 = h ? len / 2 : 0.35, y0 = h ? -0.35 : -len + 0.5, y1 = h ? 0.35 : 0.5;
    shadow(A, len * 18, 8, h ? 0.3 : 0.2, h ? 0.3 : -len / 2 + 0.6);
    const top = season === 'winter' ? '#c8d2d8' : season === 'autumn' ? '#7a8a3a' : '#4e8a34', south = season === 'winter' ? '#9aa8b0' : season === 'autumn' ? '#5a6a2a' : '#3a6e28', east = season === 'winter' ? '#7a8890' : season === 'autumn' ? '#44521e' : '#2a5420';
    box(A, x0, y0, x1, y1, 0, 16, top, south, east);
    for (let n = 0; n < len * 40; n++) { const fx = x0 + R() * (x1 - x0), fy = y0 + R() * (y1 - y0), [px, py] = A.L(fx, fy, 14 + R() * 4); g.fillStyle = R() < 0.5 ? (season === 'winter' ? 'rgba(250,252,255,0.8)' : 'rgba(170,210,100,0.6)') : 'rgba(10,30,8,0.35)'; g.beginPath(); g.arc(px, py, (1.5 + R() * 2.5) * BK, 0, Math.PI * 2); g.fill(); }
    return A;
  } };

  // --- crops ---------------------------------------------------------------------------
  function cropBake(type, stage, season) {
    const A = sheet(30, 34, 15, 28), g = A.g, [x, y] = A.L(0, 0, 0), R = rng(type.length * 31 + stage);
    if (stage === 0) { g.fillStyle = '#5a3a22'; g.beginPath(); g.ellipse(x, y, 6 * BK, 2.2 * BK, 0, 0, Math.PI * 2); g.fill(); return A; }
    const leaf = (cx, cy, rx, ry, a, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, rx * BK, ry * BK, a, 0, Math.PI * 2); g.fill(); };
    const ripe = stage === 4, sz = [0, 0.4, 0.65, 0.85, 1][stage];
    g.fillStyle = 'rgba(20,24,8,0.28)'; g.beginPath(); g.ellipse(x + 2 * BK, y + 1 * BK, 7 * BK * sz + 2, 2.4 * BK, 0, 0, Math.PI * 2); g.fill();
    if (type === 'barley') {
      const col = ripe ? '#e2c05a' : stage === 3 ? '#b8c04a' : '#6aa040';
      g.lineWidth = 1 * BK; for (let k = 0; k < 7; k++) { const bx = x + (k - 3) * 2 * BK, h = (6 + stage * 4 + R() * 3) * BK; g.strokeStyle = ripe ? '#c8a040' : '#4f8a32'; g.beginPath(); g.moveTo(bx, y); g.lineTo(bx + (R() - 0.5) * 2, y - h); g.stroke(); if (stage >= 3) { g.fillStyle = col; g.beginPath(); g.ellipse(bx, y - h, 1.2 * BK, 3 * BK, 0.2, 0, Math.PI * 2); g.fill(); } }
      return A;
    }
    if (type === 'herb') { for (let k = 0; k < 7; k++) leaf(x + (R() - 0.5) * 10 * sz * BK, y - (3 + R() * 7) * sz * BK, 3 * sz, 2 * sz, R() * 3, k % 2 ? '#3a7a4a' : '#6aaa6a'); if (ripe) for (let k = 0; k < 5; k++) { g.fillStyle = '#b89ae8'; g.beginPath(); g.arc(x + (R() - 0.5) * 10 * BK, y - (6 + R() * 5) * BK, 1.1 * BK, 0, Math.PI * 2); g.fill(); } return A; }
    if (stage <= 2) { for (let k = 0; k < 3 + stage * 2; k++) leaf(x + (R() - 0.5) * 8 * sz * BK, y - (2 + R() * 5) * sz * BK, 2.6 * sz + 0.6, 1.5 * sz + 0.4, R() * 3, k % 2 ? '#5aac44' : '#3f8a32'); return A; }
    if (type === 'cabbage' || type === 'leaf') {
      const r = (ripe ? 7 : 5.5), base = type === 'leaf' ? '#4f9a3a' : '#7cc05a';
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; leaf(x + Math.cos(a) * r * 0.7 * BK, y - r * 0.6 * BK + Math.sin(a) * r * 0.35 * BK, r * 0.6, r * 0.42, a, k % 2 ? tint(base, -0.2) : base); }
      const cg = g.createRadialGradient(x - 1.5 * BK, y - r * 0.9 * BK, 1, x, y - r * 0.6 * BK, r * 0.7 * BK); cg.addColorStop(0, type === 'leaf' ? '#8ac86a' : '#c8f0a0'); cg.addColorStop(1, base); g.fillStyle = cg; g.beginPath(); g.arc(x, y - r * 0.65 * BK, r * 0.55 * BK, 0, Math.PI * 2); g.fill();
      if (type === 'leaf' && ripe) for (let k = 0; k < 3; k++) { g.fillStyle = '#d8c060'; g.beginPath(); g.arc(x + (k - 1) * 4 * BK, y - 10 * BK, 1.1 * BK, 0, Math.PI * 2); g.fill(); }
    } else if (type === 'carrot') {
      for (let k = 0; k < 3; k++) { const bx = x + (k - 1) * 4 * BK; g.strokeStyle = '#5aac44'; g.lineWidth = 1.2 * BK; for (const d of [-1, 0, 1]) { g.beginPath(); g.moveTo(bx, y - 1 * BK); g.quadraticCurveTo(bx + d * 2 * BK, y - 6 * BK, bx + d * 3 * BK, y - 11 * BK); g.stroke(); } if (ripe) { g.fillStyle = '#e8762a'; g.beginPath(); g.ellipse(bx, y, 1.6 * BK, 1.2 * BK, 0, 0, Math.PI * 2); g.fill(); } }
    } else if (type === 'potato') {
      for (let k = 0; k < 9; k++) leaf(x + (R() - 0.5) * 12 * BK, y - (2 + R() * 7) * BK, 3, 2, R() * 3, k % 2 ? '#3f8a32' : '#5aac44');
      if (ripe) for (let k = 0; k < 4; k++) { g.fillStyle = '#f0f0e0'; g.beginPath(); g.arc(x + (R() - 0.5) * 10 * BK, y - (6 + R() * 4) * BK, 1.1 * BK, 0, Math.PI * 2); g.fill(); }
    } else if (type === 'tomato') {
      g.fillStyle = '#8a6a40'; g.fillRect(x - 0.6 * BK, y - 18 * BK, 1.2 * BK, 18 * BK);
      for (let k = 0; k < 8; k++) leaf(x + (R() - 0.5) * 9 * BK, y - (3 + R() * 13) * BK, 3, 1.6, R() * 3, k % 2 ? '#3f8a32' : '#5aac44');
      if (ripe) for (let k = 0; k < 5; k++) { g.fillStyle = '#d83a2a'; g.beginPath(); g.arc(x + (R() - 0.5) * 9 * BK, y - (4 + R() * 11) * BK, 1.8 * BK, 0, Math.PI * 2); g.fill(); }
    } else if (type === 'pumpkin') {
      for (let k = 0; k < 6; k++) leaf(x + (R() - 0.5) * 14 * BK, y - (1 + R() * 4) * BK, 3.4, 2, R() * 3, k % 2 ? '#3f8a32' : '#5aac44');
      if (ripe) { for (const [dx, sc] of [[-3, 0.8], [3, 0.8], [0, 1]]) { const pg = g.createRadialGradient(x + dx * BK - 2 * BK, y - 6 * BK, 1, x + dx * BK, y - 4 * BK, 6 * BK * sc); pg.addColorStop(0, '#ffb04a'); pg.addColorStop(1, '#b8501a'); g.fillStyle = pg; g.beginPath(); g.ellipse(x + dx * BK, y - 4 * BK, 5.5 * BK * sc, 4.4 * BK, 0, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#4a6a2a'; g.fillRect(x - 0.8 * BK, y - 10 * BK, 1.6 * BK, 2.4 * BK); }
      else { g.fillStyle = '#9ab83a'; g.beginPath(); g.arc(x, y - 3 * BK, 2.6 * BK, 0, Math.PI * 2); g.fill(); }
    }
    return A;
  }

  // --- animals, drawn each frame ------------------------------------------------------------
  const COATS = { sheep: ['#f2eee4', '#e8e0cc', '#4a4440'], cow: [['#f4f0e8', '#3a3230'], ['#f4f0e8', '#8a5a3a'], ['#c8945a', '#6a4a2a']], pig: ['#f0b0a8'] };
  function quad(g, x, y, s, o) {
    // a four-legged beast side-on: o.body, o.patch, o.head, o.legs, o.len, o.h, o.face, o.step, o.graze
    g.save(); g.translate(x, y); g.scale(s * o.face, s);
    g.fillStyle = 'rgba(20,18,8,0.28)'; g.beginPath(); g.ellipse(2, 1, o.len * 0.75, 3.6, 0, 0, Math.PI * 2); g.fill();
    const L = o.len, H = o.h, st = o.step;
    g.fillStyle = o.legs; for (const [lx, ph] of [[-L * 0.38, 0], [-L * 0.2, 1], [L * 0.22, 1], [L * 0.38, 0]]) g.fillRect(lx - 1.2, -H * 0.42 + (ph ? st : -st) * 0.6, 2.4, H * 0.42);
    const bg = g.createLinearGradient(0, -H, 0, -H * 0.3); bg.addColorStop(0, tint(o.body, 0.12)); bg.addColorStop(1, tint(o.body, -0.18));
    g.fillStyle = bg; g.beginPath(); g.ellipse(0, -H * 0.66, L * 0.55, H * 0.34, 0, 0, Math.PI * 2); g.fill();
    if (o.wool) { g.fillStyle = tint(o.body, 0.1); for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(-L * 0.4 + k * L * 0.13, -H * 0.9 + (k % 2) * 1.5, H * 0.17, 0, Math.PI * 2); g.fill(); } }
    if (o.patch) { g.fillStyle = o.patch; g.beginPath(); g.ellipse(-L * 0.15, -H * 0.72, L * 0.14, H * 0.16, 0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(L * 0.2, -H * 0.6, L * 0.1, H * 0.12, -0.2, 0, Math.PI * 2); g.fill(); }
    const hy = o.graze ? -H * 0.32 : -H * 0.78, hx = L * 0.55;
    g.fillStyle = o.head; g.beginPath(); g.ellipse(hx, hy, H * 0.22, H * 0.17, o.graze ? 0.6 : 0.2, 0, Math.PI * 2); g.fill();
    if (o.snout) { g.fillStyle = o.snout; g.beginPath(); g.ellipse(hx + H * 0.18, hy + H * 0.04, H * 0.08, H * 0.07, 0, 0, Math.PI * 2); g.fill(); }
    if (o.horns) { g.strokeStyle = '#e8dcc0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hx - 1, hy - H * 0.15); g.lineTo(hx - 3, hy - H * 0.3); g.moveTo(hx + 2, hy - H * 0.15); g.lineTo(hx + 3, hy - H * 0.3); g.stroke(); }
    g.fillStyle = '#1a1410'; g.beginPath(); g.arc(hx + H * 0.08, hy - H * 0.04, 0.8, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function drawAnimal(g, kind, a, x, y, zm) {
    const s = zm * 0.9, t = tReal;
    if (kind === 'sheep' || kind === 'cow' || kind === 'pig') {
      const moving = a.graze <= 0, step = moving ? Math.sin(t * 8 + a.x) * 1.4 : 0, face = Math.cos(a.a) - Math.sin(a.a) < 0 ? -1 : 1;
      if (kind === 'sheep') quad(g, x, y, s, { body: COATS.sheep[a.coat || 0], head: a.coat === 2 ? '#1a1614' : '#3a3230', legs: '#3a3230', len: 24, h: 20, face, step, graze: a.graze > 0, wool: true });
      else if (kind === 'cow') { const c = COATS.cow[a.coat || 0]; quad(g, x, y, s * 1.25, { body: c[0], patch: c[1], head: c[0], legs: '#2a2420', len: 28, h: 22, face, step, graze: a.graze > 0, snout: '#e8a0a0', horns: true }); }
      else quad(g, x, y, s, { body: '#f0b0a8', head: '#f0b0a8', legs: '#d88a84', len: 22, h: 15, face, step, graze: a.graze > 0, snout: '#d87a78' });
      return;
    }
    if (kind === 'pet') {
      const [c, d] = PET_COATS[a.kind][a.coat || 0], face = a.face < 0 ? -1 : 1, dog = a.kind === 'dog';
      g.save(); g.translate(x, y); g.scale(s * face * (dog ? 1 : 0.85), s * (dog ? 1 : 0.85));
      g.fillStyle = 'rgba(20,18,8,0.28)'; g.beginPath(); g.ellipse(1, 1, 10, 3, 0, 0, Math.PI * 2); g.fill();
      if (a.state === 'sleep') { g.fillStyle = c; g.beginPath(); g.ellipse(0, -4, 9, 4.5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = d; g.beginPath(); g.arc(7, -5, 3.6, 0, Math.PI * 2); g.fill(); g.restore(); return; }
      if (a.state === 'walk') { const st = Math.sin((a.walk || 0) * 0.6) * 1.5; g.fillStyle = d; for (const [lx, ph] of [[-6, 1], [-3, -1], [4, -1], [7, 1]]) g.fillRect(lx - 1, -6 + ph * st * 0.5, 2, 6); g.fillStyle = c; g.beginPath(); g.ellipse(0, -9, 9, 4.5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(9, -13, 4, 0, Math.PI * 2); g.fill(); }
      else { g.fillStyle = c; g.beginPath(); g.ellipse(-1, -7, 6, 6.5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(3, -15, 4.4, 0, Math.PI * 2); g.fill(); g.fillStyle = d; g.fillRect(-1, -2, 2, 2); g.fillRect(3, -2, 2, 2); }
      g.fillStyle = d; g.beginPath(); if (dog) { g.ellipse(a.state === 'walk' ? 12 : 6, a.state === 'walk' ? -14 : -16, 1.8, 3.4, 0.4, 0, Math.PI * 2); } else { const hx = a.state === 'walk' ? 9 : 3, hy = a.state === 'walk' ? -13 : -15; g.moveTo(hx - 3, hy - 3); g.lineTo(hx - 2, hy - 7); g.lineTo(hx, hy - 3.5); g.moveTo(hx + 1, hy - 3.5); g.lineTo(hx + 3, hy - 7); g.lineTo(hx + 3.5, hy - 2.5); } g.fill();
      g.strokeStyle = d; g.lineWidth = 2; g.beginPath(); g.moveTo(-8, -8); g.quadraticCurveTo(-13, -12, -12, dog ? -16 : -19); g.stroke();
      g.fillStyle = '#1a1410'; g.beginPath(); g.arc(a.state === 'walk' ? 10.5 : 4.5, a.state === 'walk' ? -13.5 : -15.5, 0.8, 0, Math.PI * 2); g.fill();
      g.restore(); return;
    }
    if (kind === 'rabbit') { const hop = a.moving ? Math.abs(Math.sin(a.hop * 6)) * 4 : 0; g.save(); g.translate(x, y); g.scale(s * (a.face < 0 ? -1 : 1), s); g.fillStyle = 'rgba(20,18,8,0.25)'; g.beginPath(); g.ellipse(0, 1, 5, 1.8, 0, 0, Math.PI * 2); g.fill(); g.translate(0, -hop); g.fillStyle = '#9a7a5a'; g.beginPath(); g.ellipse(0, -4, 5, 3.6, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(4, -7, 2.6, 0, Math.PI * 2); g.fill(); g.fillRect(3, -13, 1.2, 5); g.fillRect(5, -13, 1.2, 5); g.fillStyle = '#f4f0e8'; g.beginPath(); g.arc(-5, -4, 1.6, 0, Math.PI * 2); g.fill(); g.restore(); return; }
    if (kind === 'hen') { const peck = a.peck > 0 && Math.floor(t * 4) % 2; g.save(); g.translate(x, y); g.scale(s * 0.8 * (Math.cos(a.a) - Math.sin(a.a) < 0 ? -1 : 1), s * 0.8); g.fillStyle = 'rgba(20,18,8,0.25)'; g.beginPath(); g.ellipse(0, 1, 5, 1.8, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#e8a03a'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1, 0); g.lineTo(-1, -3); g.moveTo(1.5, 0); g.lineTo(1.5, -3); g.stroke(); g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(0, -6, 5, 3.6, -0.2, 0, Math.PI * 2); g.fill(); const hx = peck ? 5 : 4, hy = peck ? -3 : -10; g.beginPath(); g.arc(hx, hy, 2.4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#d83a2a'; g.fillRect(hx - 1, hy - 3.6, 2, 1.6); g.fillStyle = '#e8a03a'; g.beginPath(); g.moveTo(hx + 2, hy); g.lineTo(hx + 4, hy + 0.5); g.lineTo(hx + 2, hy + 1); g.fill(); g.restore(); return; }
    if (kind === 'crow') { g.save(); g.translate(x, y); g.scale(s * 0.8, s * 0.8); g.fillStyle = '#1e1a22'; if (a.fly) { const f = Math.sin(a.flap * 12) * 5; g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(-1, 0); g.lineTo(-8, -f); g.lineTo(-3, 1); g.moveTo(1, 0); g.lineTo(8, -f); g.lineTo(3, 1); g.fill(); } else { g.beginPath(); g.ellipse(0, -4, 4, 2.6, -0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(3.5, -6.5, 1.8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#5a5050'; g.fillRect(5, -6.8, 2, 0.8); } g.restore(); return; }
    if (kind === 'duck') { g.save(); g.translate(x, y); g.scale(s * 0.9 * (Math.cos(a.a) - Math.sin(a.a) < 0 ? -1 : 1), s * 0.9); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(1, 1, 9, 2.2, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f2efe4'; g.beginPath(); g.ellipse(0, -3, 6.5, 3.4, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2f6a3a'; g.beginPath(); g.arc(5, -7, 2.6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e8a64a'; g.fillRect(7, -7.4, 3, 1.4); g.restore(); }
  }

  // water glints, in screen space over the painted water
  function water(g, w2s, zm) {
    const cam = Game.cam, x0 = Math.max(0, Math.floor(cam.x / 16)), x1 = Math.min(MAP_W - 1, Math.ceil((cam.x + cam.w) / 16)), y0 = Math.max(0, Math.floor(cam.y / 16)), y1 = Math.min(MAP_H - 1, Math.ceil((cam.y + cam.h) / 16));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (World.tiles[ty * MAP_W + tx] !== T.WATER) continue;
      for (let k = 0; k < 2; k++) {
        const hsh = hash2(tx * 3 + k, ty * 7), a = Math.sin((tReal * (0.6 + hsh) + hsh * 10) * 1.7); if (a < 0.3) continue;
        const [sx, sy] = w2s(tx * 16 + ((hsh * 160 + tReal * 5) % 16), ty * 16 + ((hsh * 977) % 14));
        g.fillStyle = `rgba(235,248,255,${(a - 0.3) * 0.7})`; g.fillRect(sx - 3 * zm, sy, 6 * zm, Math.max(1, zm * 0.9));
      }
    }
  }

  Object.assign(Iso, { props: P, cropBake, drawAnimal, water });
})();
