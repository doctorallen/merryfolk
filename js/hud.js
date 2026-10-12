'use strict';
// ---------------------------------------------------------------------------
// The heads-up display, tidied (from the UX review): panels that never sit
// under the top bar or toolbar, toasts that queue below the bar instead of
// covering the controls, a gear menu for the rarely-used buttons, chips for
// coin, rank and contentment that look like the buttons they are, a small
// tracker of the open charters, a ledger of five sections (each with its
// own sub-tabs) that pauses the game while it's open, build tools that say
// why they're locked, a tool hint that fades, phone-friendly sizes, and the
// Steward's Errands: a short guide to the first few things to do.
// ---------------------------------------------------------------------------

// --- Where the bars are -------------------------------------------------------
function measureHud() {
  const top = $('topbar'), bottom = $('bottom'), root = document.documentElement;
  if (top) root.style.setProperty('--hud-top', Math.round(top.getBoundingClientRect().bottom + 8) + 'px');
  if (bottom) root.style.setProperty('--hud-bottom', Math.round(window.innerHeight - bottom.getBoundingClientRect().top + 8) + 'px');
}

// --- Dialogs take turns: a Moot, a petition and the Almanac never trample each other ---
const MootQ = [];
function queueMoot(fn, tag) { if ($('moot').hidden) { fn(); return; } if (tag) for (let i = MootQ.length - 1; i >= 0; i--) if (MootQ[i].tag === tag) MootQ.splice(i, 1); fn.tag = tag; MootQ.push(fn); }
window.addEventListener('DOMContentLoaded', () => {
  new MutationObserver(() => { if ($('moot').hidden && MootQ.length) setTimeout(() => { if ($('moot').hidden && MootQ.length) MootQ.shift()(); }, 400); }).observe($('moot'), { attributes: true, attributeFilter: ['hidden'] });
});

// --- Toasts: a queue below the top bar ----------------------------------------
const ToastQ = [];
function showToasts() {
  const box = $('toasts');
  if (!box) return;
  const now = performance.now();
  for (let i = ToastQ.length - 1; i >= 0; i--) if (ToastQ[i].until < now) { ToastQ[i].el.classList.remove('show'); const el = ToastQ[i].el; setTimeout(() => el.remove(), 350); ToastQ.splice(i, 1); }
}
setInterval(showToasts, 250);

// --- The ledger: five sections with sub-tabs ------------------------------------
const LEDGER = [
  { key: 'steward', label: 'Steward', subs: [['steward', 'Policies & workforce'], ['trades', 'Trades']] },
  { key: 'charter', label: 'Charter', subs: [['charter', 'Charter']] },
  { key: 'store', label: 'Store & Market', subs: [['market', 'Market'], ['stores', 'The Common Store']] },
  { key: 'folk', label: 'Folk', subs: [['census', 'Census & Almanac'], ['remembered', 'Remembered'], ['travellers', 'Travellers']] },
  { key: 'rifts', label: 'Rifts', subs: [['rifts', 'The rifts']] },
];
function ledgerGroup(tab) { return LEDGER.find((g) => g.subs.some((s) => s[0] === tab)) || LEDGER[0]; }

// --- The charter tracker -------------------------------------------------------------
function renderObjectives() {
  const el = $('objectives');
  if (!el) return;
  const cs = Game.charters || [];
  const show = Game.started && !Game.introOpen && cs.length && !Build.on && !Game.objHidden && $('village').hidden;
  el.hidden = !show;
  if (!show) return;
  const html = `<button class="obj-head" title="Open the Charter">Charters <span class="sub">${ERAS[era()].name}</span></button>${cs.map((c) => { const p = charterProgress(c); return `<div class="obj"><span>${escapeHtml(charterText(c))}</span><i style="width:${Math.round(p * 100)}%"></i></div>`; }).join('')}<button class="obj-x" title="Hide">–</button>`;
  if (el._html !== html) {
    el._html = html; el.innerHTML = html;
    el.querySelector('.obj-head').addEventListener('click', () => openLedger('charter'));
    el.querySelector('.obj-x').addEventListener('click', () => { Game.objHidden = true; renderObjectives(); toast('Charters are on the Charter tab of the ledger (or click the rank chip).', 'info'); });
  }
}
function openLedger(tab) { Game.villageTab = tab; $('village').hidden = false; renderVillage(); }

// --- The Steward's Errands -------------------------------------------------------------------
const ERRANDS = [
  { text: 'Tap a hobbit to meet them.', target: null, done: () => !!Game.selected },
  { text: 'Like what they\'re doing? Tap them again (or press P) to pat them.', target: '#b-pat', done: () => (Game.tut.pats || 0) > 0 },
  { text: 'Open Build and drag a footpath across the grass.', target: '#btn-build', done: () => (Game.plans || []).length > 0 || (Game.planDone || []).length > 0 },
  { text: 'Press Done, then speed up time (2× or 4×) and watch your folk lay it.', target: '[data-speed="3"]', done: () => (Game.planDone || []).length > 0 },
  { text: 'How is the village feeling? Click the ☺ contentment chip.', target: '#hud-content', done: () => Game.tut.saw.steward },
  { text: 'Charters are goals that earn pennies and renown. Click the rank chip.', target: '#hud-era', done: () => Game.tut.saw.charter },
  { text: 'Pick something for the village to study: Charter, then Lore.', target: '#hud-era', done: () => !!(Game.lore && (Game.lore.study || Game.lore.known.length)) },
  { text: 'When a 📜 Petition chip appears at the top, read it and decide.', target: '#hud-petition', done: () => (Game.petitionsSeen || []).length > 0 && !Game.petition },
  { text: 'On Trewsday a trader comes. Sell what you can spare in Store & Market.', target: '#btn-village', done: () => (Game.stats.sold || 0) > 0 || Game.tut.saw.market },
];
function tut() { return Game.tut || (Game.tut = { step: 0, saw: {}, off: false }); }
function renderErrand() {
  const el = $('errand');
  if (!el) return;
  const T = tut();
  document.querySelectorAll('.tut-glow').forEach((x) => x.classList.remove('tut-glow'));
  if (!Game.started || Game.introOpen || T.off || T.step >= ERRANDS.length) { el.hidden = true; document.body.classList.remove('errand-on'); return; }
  document.body.classList.add('errand-on');
  const E = ERRANDS[T.step];
  if (E.done()) { T.step++; if (T.step >= ERRANDS.length) { toast('That\'s the Steward\'s errands done. Thistledown is yours to shape!', 'party'); Game.renown = (Game.renown || 0) + 5; } el._t = null; return renderErrand(); }
  el.hidden = false;
  if (el._t !== T.step) {
    el._t = T.step;
    const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    const text = touch ? E.text.replace(/ \(or press P\)/, '').replace(/^Click /, 'Tap ').replace(/ click /g, ' tap ') : E.text;
    el.innerHTML = `<b>Steward's errand ${T.step + 1} of ${ERRANDS.length}</b><span>${escapeHtml(text)}</span><button class="err-skip">Skip guide</button>`;
    el.querySelector('.err-skip').addEventListener('click', () => { T.off = true; renderErrand(); });
  }
  if (E.target) { const t = document.querySelector(E.target); if (t) t.classList.add('tut-glow'); }
}

window.addEventListener('DOMContentLoaded', () => {
  // the ledger's sections
  const nav = document.querySelector('#village .tabs');
  nav.innerHTML = LEDGER.map((g) => `<button data-tab="${g.subs[0][0]}" data-group="${g.key}">${g.label}</button>`).join('');
  const rv = renderVillage;
  renderVillage = function () {
    rv();
    const g = ledgerGroup(Game.villageTab);
    document.querySelectorAll('#village .tabs button').forEach((b) => b.classList.toggle('active', b.dataset.group === g.key));
    const body = $('village-body');
    if (g.subs.length > 1 && body) {
      const bar = document.createElement('div');
      bar.className = 'subtabs';
      bar.innerHTML = g.subs.map(([k, l]) => `<button data-sub="${k}" class="${k === Game.villageTab ? 'on' : ''}">${l}</button>`).join('');
      body.prepend(bar);
      bar.querySelectorAll('[data-sub]').forEach((b) => b.addEventListener('click', () => { Game.villageTab = b.dataset.sub; renderVillage(); }));
    }
    const T = tut(); if (Game.villageTab === 'steward') T.saw.steward = true; if (Game.villageTab === 'charter') T.saw.charter = true; if (Game.villageTab === 'market') T.saw.market = true;
  };
  // the game pauses while the ledger is open
  new MutationObserver(() => {
    const open = !$('village').hidden;
    if (open && Game.ledgerSpeed == null) { Game.ledgerSpeed = Game.speedIdx; if (Game.speedIdx) setSpeed(0); }
    else if (!open && Game.ledgerSpeed != null) { if (Game.ledgerSpeed) setSpeed(Game.ledgerSpeed); Game.ledgerSpeed = null; }
    renderObjectives();
  }).observe($('village'), { attributes: true, attributeFilter: ['hidden'] });
  // toasts queue below the bar
  toast = function (text, kind) {
    const box = $('toasts'); if (!box) return;
    if (ToastQ.some((t) => t.text === text)) return;
    const el = document.createElement('div');
    el.className = 'toast'; el.dataset.kind = kind || 'info'; el.textContent = text;
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    ToastQ.push({ el, text, until: performance.now() + 3800 });
    const most = window.innerWidth < 760 ? 1 : 3;
    while (ToastQ.length > most) { const t = ToastQ.shift(); t.el.remove(); }
  };
  // the gear menu
  $('btn-gear').addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = $('gear-menu');
    menu.hidden = !menu.hidden;
    // on phones the menu is position: fixed (the controls row scrolls and would clip it), so put it under the button
    if (!menu.hidden && getComputedStyle(menu).position === 'fixed') {
      const r = $('btn-gear').getBoundingClientRect();
      menu.style.top = Math.round(r.bottom + 6) + 'px';
      menu.style.left = Math.round(Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8))) + 'px';
    } else { menu.style.top = ''; menu.style.left = ''; }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.gear-wrap')) $('gear-menu').hidden = true; });
  // picking something from it closes it too (the music toggle stays open, to show it's changed)
  $('gear-menu').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.id !== 'btn-sound') $('gear-menu').hidden = true; });
  $('btn-guide').addEventListener('click', () => { Game.tut = { step: 0, saw: {}, off: false }; Game.objHidden = false; $('gear-menu').hidden = true; renderErrand(); });
  // chips
  $('hud-era').addEventListener('click', () => openLedger('charter'));
  const hud = updateHUD;
  updateHUD = function () {
    hud();
    $('hud-coin').textContent = `● ${Game.coin || 0}p`;
    $('hud-coin').title = `${Game.coin || 0} pennies in the village chest: open the Market`;
    const next = ERAS[era() + 1];
    const prog = next ? Math.round(eraNeeds(era() + 1).reduce((s, [, have, want]) => s + Math.min(1, have / want), 0) / eraNeeds(era() + 1).length * 100) : 100;
    $('hud-era').textContent = `${ERAS[era()].name}${next ? ` · ${prog}%` : ''}`;
    $('hud-era').title = next ? `On the way to ${next.name}: ${prog}% of the way. Open the Charter.` : 'Thistledown is a Shire Town.';
    renderObjectives(); renderErrand();
    // keep the build bar's counts and requests fresh
    if (Build.on && (Game._bbAt == null || Math.abs(Game.time - Game._bbAt) > 20) && !Build.drag) { Game._bbAt = Game.time; const hint = $('bb-hint'); if (!hint || !hint.querySelector('#bb-charter')) renderBuildBar(); }
  };
  // the coin chip opens the market, not the charter
  const coin = $('hud-coin'), fresh = coin.cloneNode(true); coin.replaceWith(fresh);
  fresh.addEventListener('click', () => openLedger('market'));
  // pats count for the guide
  const dp = doPat;
  doPat = function () { const r = dp(); tut().pats = (tut().pats || 0) + 1; return r; };
  // a tool's hint shows for a few seconds after picking it, never for the hand
  const st = setTool;
  setTool = function (id) {
    st(id);
    const el = $('tool-hint');
    el.classList.toggle('show', id !== 'hand');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 4500);
  };
  // selection hides the toolbar on phones (the panel becomes a bottom sheet)
  const sv = selectVillager;
  selectVillager = function (v) { const prev = Game.selected; const r = sv(v); document.body.classList.toggle('has-sel', !!v); if (v !== prev && $('lesson')) $('lesson').textContent = ''; return r; };
  // locked build tools say why, with their era on the button
  const rb = renderBuildBar;
  renderBuildBar = function () {
    rb();
    document.querySelectorAll('#buildbar .tool.locked').forEach((b) => {
      const lab = b.querySelector('span');
      if (lab && !b.querySelector('.lock')) { const t = document.createElement('small'); t.className = 'lock'; t.textContent = '🔒 ' + eraFor(b.dataset.btool); b.appendChild(t); }
      const n = b.cloneNode(true); b.replaceWith(n);
      n.addEventListener('click', () => {
        const i = ERAS.findIndex((e) => e.name === eraFor(n.dataset.btool));
        const need = i > 0 ? eraNeeds(i).map(([t, have, want]) => `${have >= want ? '✓' : '○'} ${t}`).join(' · ') : '';
        const hint = $('bb-hint');
        if (hint) hint.innerHTML = `<b>${escapeHtml(BTOOL[n.dataset.btool].label)}</b> unlocks when Thistledown becomes a <b>${escapeHtml(eraFor(n.dataset.btool))}</b>: ${escapeHtml(need)}. <button id="bb-charter">See the Charter</button>`;
        const c = $('bb-charter'); if (c) c.addEventListener('click', () => openLedger('charter'));
      });
    });
  };
  // the chronicle starts folded on small screens
  if (window.innerWidth < 760 || window.innerHeight < 500) $('chronicle').classList.add('collapsed');
  // --- phones: one speed button that cycles, a folded toolbar, folded charters, short labels ---
  const phone = () => document.body.classList.contains('phone');
  const SPEED_CYCLE = [1, 2, 3, 0], speedLabel = { 0: '❚❚', 1: '1×', 2: '2×', 3: '4×', 4: '8×', 5: '16×' };
  const sc = $('btn-speed');
  if (sc) {
    sc.hidden = false;
    sc.addEventListener('click', () => { const i = SPEED_CYCLE.indexOf(Game.speedIdx); setSpeed(SPEED_CYCLE[(i + 1) % SPEED_CYCLE.length]); });
    const ss = setSpeed;
    setSpeed = function (i) { const r = ss(i); sc.textContent = speedLabel[i] || '1×'; sc.classList.toggle('paused', i === 0); return r; };
    sc.textContent = speedLabel[Game.speedIdx] || '1×';
  }
  // the toolbar shows only the tool in hand; a tap opens it out, picking a tool folds it again
  const bar = $('toolbar');
  bar.classList.add('folded');
  // a tap on the folded bar opens it (and goes no further); a tap on a tool in the open bar picks it, then the bar folds
  bar.addEventListener('pointerdown', (e) => { if (phone() && bar.classList.contains('folded')) { bar.classList.remove('folded'); bar._opening = true; } });
  bar.addEventListener('click', (e) => {
    if (!phone()) return;
    if (bar._opening) { bar._opening = false; e.stopPropagation(); e.preventDefault(); return; }
    if (e.target.closest('.tool')) setTimeout(() => bar.classList.add('folded'), 0);
  }, true);
  document.addEventListener('click', (e) => { if (phone() && !e.target.closest('#toolbar')) bar.classList.add('folded'); });
  // the charters card is a chip until it's tapped
  const obj = $('objectives');
  obj.classList.add('folded');
  obj.addEventListener('click', (e) => {
    if (!phone() || !e.target.closest('.obj-head')) return;
    if (obj.classList.contains('folded')) { obj.classList.remove('folded'); e.stopPropagation(); }
  }, true);
  document.addEventListener('click', (e) => { if (phone() && !e.target.closest('#objectives')) obj.classList.add('folded'); });
  // the date reads "Day 3" on a phone, with the rest in its tooltip
  const hud2 = updateHUD;
  updateHUD = function () { hud2(); if (phone()) $('hud-day').textContent = `Day ${Game.day}`; };
  // the body class is set by resize(); make sure it's there before the first frame is laid out
  markScreen();
  window.addEventListener('resize', measureHud);
  if (window.ResizeObserver) { const ro = new ResizeObserver(measureHud); ro.observe($('topbar')); ro.observe($('bottom')); }
  setTimeout(measureHud, 50);
  const nv = newVillage;
  newVillage = function () { Game.tut = { step: 0, saw: {}, off: false }; Game.objHidden = false; return nv(); };
});
