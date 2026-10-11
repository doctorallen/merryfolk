'use strict';
// ---------------------------------------------------------------------------
// Shaping the valley. When a village is first started (or started afresh) you
// choose how the land is to be made (a seed, how hilly, how the river runs,
// how much woodland, how wet, hedgerows, wildflowers, rocks) and then watch
// it being made, stage by stage, on a map: the river finding its way, knolls
// rising, lanes winding along the contours, rain running off the hills, the
// buildings going up, hedges, woods, willows, grass and flowers.
// ---------------------------------------------------------------------------

const GenUI = { cfg: null, busy: false };
const PREVIEW_S = 4; // canvas pixels per tile
const GEN_STAGES = 13; // how many lines buildWorldSteps yields

// The world settings saved with the village, if there is one.
function savedGen() {
  try { const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return d && d.world ? d.world : null; } catch (e) { return null; }
}

function openWorldSetup() {
  closeModals();
  $('intro').hidden = true;
  const el = $('worldgen');
  el.hidden = false;
  Game.introOpen = true;
  GenUI.cfg = { ...defaultGen(Math.floor(Math.random() * 99999)), layout: 'valley' };
  $('wg-setup').hidden = false; $('wg-watch').hidden = true;
  renderWorldSetup();
}

function renderWorldSetup() {
  const c = GenUI.cfg;
  $('wg-seed').value = c.seed;
  const box = $('wg-opts');
  box.innerHTML = '';
  for (const key in GEN_OPTIONS) {
    const o = GEN_OPTIONS[key];
    const row = document.createElement('div'); row.className = 'wg-row';
    row.innerHTML = `<span class="wg-label">${o.label}</span>`;
    const seg = document.createElement('div'); seg.className = 'wg-seg';
    for (const [val, label] of o.opts) {
      const b = document.createElement('button');
      b.textContent = label; b.className = c[key] === val ? 'on' : '';
      b.setAttribute('aria-pressed', c[key] === val ? 'true' : 'false');
      b.addEventListener('click', () => { c[key] = val; renderWorldSetup(); });
      seg.appendChild(b);
    }
    row.appendChild(seg); box.appendChild(row);
  }
}

// Builds the world a stage at a time, drawing the map as it goes.
async function runWorldGen() {
  if (GenUI.busy) return;
  GenUI.busy = true;
  const c = GenUI.cfg;
  c.seed = Math.abs(parseInt($('wg-seed').value, 10)) || 1;
  $('wg-setup').hidden = true; $('wg-watch').hidden = false; $('wg-enter').hidden = true;
  Game.generating = true;
  const cv = $('wg-map');
  cv.width = MAP_W * PREVIEW_S; cv.height = MAP_H * PREVIEW_S;
  const ctx = cv.getContext('2d');
  const steps = buildWorldSteps(c);
  const stages = [];
  let shown = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (;;) {
    const r = steps.next();
    if (r.done) break;
    // the first stage may have set the map's size
    if (cv.width !== MAP_W * PREVIEW_S || cv.height !== MAP_H * PREVIEW_S) { cv.width = MAP_W * PREVIEW_S; cv.height = MAP_H * PREVIEW_S; GenUI.ground = null; }
    stages.push(r.value);
    $('wg-stage').textContent = r.value;
    $('wg-bar').style.width = Math.round((stages.length / GEN_STAGES) * 100) + '%';
    $('wg-log').innerHTML = stages.map((s, i) => `<li${i === stages.length - 1 ? ' class="wg-now"' : ''}>${s}</li>`).join('');
    // grow the new things in over a moment
    GenUI.stage = stages.length;
    const target = World.statics.length;
    const t0 = performance.now(), dur = r.value === 'Ready' ? 150 : 650;
    while (performance.now() - t0 < dur) {
      drawGenMap(ctx, target, { from: shown, t: (performance.now() - t0) / dur });
      await new Promise((res) => requestAnimationFrame(res));
    }
    shown = target;
    drawGenMap(ctx, shown);
    await wait(100);
  }
  // then settle the founding families in
  finishFreshVillage();
  Game.generating = false;
  GenUI.busy = false;
  $('wg-stage').textContent = `Thistledown is ready: ${Game.villagers.length} folk in ${World.homes.filter((h) => h.built).length} hobbit-holes, waiting for you.`;
  $('wg-bar').style.width = '100%';
  $('wg-enter').hidden = false;
}

// A map of the valley as it stands: the ground a block per tile, coloured by
// what it is and how high it lies, with the real trees, hedges, buildings and
// stones drawn small on top, the newest growing in.
function drawGenMap(ctx, nStatics, grow) {
  const S = PREVIEW_S, W = MAP_W, H = MAP_H, tiles = World.tiles, L = World.land;
  if (!GenUI.ground || GenUI.groundFor !== GenUI.stage) {
    const g = GenUI.ground || document.createElement('canvas');
    if (g.width !== W * S || g.height !== H * S) { g.width = W * S; g.height = H * S; }
    const gx = g.getContext('2d'), nh = makeNoise(World.seed + 9);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, t = tiles[i];
      const h = L ? L.h[i] : landHeight(nh, x + 0.5, y + 0.5);
      let col;
      if (t === T.WATER) col = '#3f7fbf';
      else if (t === T.BRIDGE) col = '#8a6440';
      else if (t === T.PATH) col = '#c8a46a';
      else if (t === T.COBBLE) col = '#a8a49a';
      else if (t === T.FIELD || t === T.SOIL) col = '#8a6a3a';
      else if (t === T.WEED) col = '#6a8a3a';
      else if (t === T.LAWN) col = '#8cc65a';
      else {
        // higher ground lighter, each terrace a step brighter
        const lv = Math.floor(h * TERRACES), k = 0.72 + h * 0.35 + lv * 0.04;
        col = `rgb(${Math.round(78 * k)},${Math.round(138 * k)},${Math.round(52 * k)})`;
        if (t === T.HILL) col = mix(col, '#9ac85a', 0.35);
        if (World.cliff && World.cliff[i] === 1) col = '#8a7050';
        // once the rain has been worked out, wet runnels show bluer
        if (L && L.flow[i] > 30) col = mix(col, '#4a8ac8', clamp(Math.log(L.flow[i] / 30) * 0.12, 0, 0.35));
      }
      gx.fillStyle = col; gx.fillRect(x * S, y * S, S, S);
    }
    // the hobbit-holes' round doors
    for (const hm of World.homes) {
      const dx = hm.doorX / 16 * S, dy = hm.doorY / 16 * S;
      gx.fillStyle = '#2a1c12'; gx.beginPath(); gx.arc(dx, dy - 2, 3, 0, Math.PI * 2); gx.fill();
      gx.fillStyle = hm.built ? hm.doorColor : '#8a6440'; gx.beginPath(); gx.arc(dx, dy - 2, 2, 0, Math.PI * 2); gx.fill();
    }
    GenUI.ground = g; GenUI.groundFor = GenUI.stage;
  }
  ctx.drawImage(GenUI.ground, 0, 0);
  // wildflowers
  for (const f of World.flowers) {
    if (!f.kind) continue;
    ctx.fillStyle = (FLOWER_KINDS[f.kind] || { cols: [['#fff']] }).cols[0][0];
    ctx.fillRect(Math.round(f.x / 16 * S), Math.round(f.y / 16 * S), 1, 1);
  }
  // everything standing, drawn at a quarter size, back to front
  const k = S / 16, n = Math.min(nStatics, World.statics.length);
  const list = World.statics.slice(0, n).map((st, idx) => [st, idx]).sort((a, b) => a[0].sortY - b[0].sortY);
  for (const [st, idx] of list) {
    if (st.hidden || !st.img) continue;
    // the newest things spring up rather than pop in
    const age = grow && idx >= grow.from ? clamp((grow.t - (idx - grow.from) / Math.max(1, n - grow.from) * 0.6) / 0.4, 0, 1) : 1;
    if (age <= 0) continue;
    const w = st.img.width * k, h = st.img.height * k * age;
    ctx.drawImage(st.img, (st.x - st.ox) * k, st.y * k - h, w, h);
  }
}

// The founding families move in (what starting afresh always did after the land was built).
function finishFreshVillage() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  World.season = 'spring';
  Game.time = 8 * 60 + 20;
  Game.stats = {};
  newVillage();
  applySeasonToStatics('spring');
  World.prevGround = null; World.paintJob = null;
  paintGroundSoon('spring');
  FX.initAmbient();
  Game.lastHour = Math.floor(Game.time / 60); Game.lastDay = Game.day = 1; Game.festivalDay = -1;
  selectVillager(null);
  renderLog();
  centerOn(PLAZA.cx * 16, (PLAZA.cy - 2) * 16);
  save();
}

function setupWorldGenUI() {
  $('wg-dice').addEventListener('click', () => { GenUI.cfg.seed = Math.floor(Math.random() * 99999); renderWorldSetup(); });
  $('wg-seed').addEventListener('change', () => { GenUI.cfg.seed = Math.abs(parseInt($('wg-seed').value, 10)) || 1; });
  $('wg-begin').addEventListener('click', runWorldGen);
  $('wg-back').addEventListener('click', () => { $('worldgen').hidden = true; openIntro(!Game.started); });
  $('wg-enter').addEventListener('click', () => { $('worldgen').hidden = true; startGame(false); });
}
