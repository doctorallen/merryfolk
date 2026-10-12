'use strict';
// Two game days of a new village, headless: no errors, sane numbers, nobody
// stuck, and a save that survives a reload unchanged. Runs once on a desktop
// window and once as a phone, where it also takes a screenshot.
const fs = require('fs');
const path = require('path');
const { launch, openGame, outDir, finish } = require('./lib');

// Runs in the page: a seeded two days with checks as it goes.
function runDays(days) {
  Math.random = mulberry32(1); // every R.* draw goes through Math.random
  startGame(true); // a fresh village in the original valley, whatever the storage held
  const out = { bad: [], folk0: Game.villagers.length, t0: Game.time, day0: Game.day };
  const stuck = new Map();
  const finite = (x) => typeof x === 'number' && Number.isFinite(x);
  for (let i = 0; i < days * 2880; i++) {
    simulate(0.5);
    if (i % 120 === 0) { Game.darkness = skyState(Game.hour).dark; render(0.016); }
    if (i % 60 === 0) {
      for (const v of Game.villagers) {
        const num = (o, what) => { for (const k in o) if (typeof o[k] === 'number' && !finite(o[k])) out.bad.push(`${v.first}: ${what} ${k} = ${o[k]}`); };
        num(v.drives, 'drive'); num(v.chem, 'chem'); num(v.skills, 'skill');
        // waiting to go somewhere with no way there, hour after hour
        const key = v.task && v.task.phase === 'go' && v.path === null && !v.inside ? v.task.a.id : null;
        const prev = stuck.get(v.id);
        stuck.set(v.id, key && prev && prev.key === key ? { key, n: prev.n + 1 } : { key, n: 0 });
        if (key && stuck.get(v.id).n >= 2) out.bad.push(`${v.first} has waited over an hour to go to ${key}`);
      }
      for (const k in Village.stores) { const s = Village.stores[k]; if (!finite(s)) out.bad.push(`store ${k} = ${s}`); else if (s < 0) out.bad.push(`store ${k} negative: ${s}`); }
      if (!finite(Game.coin)) out.bad.push(`coin = ${Game.coin}`);
      if (out.bad.length > 20) break;
    }
  }
  out.day = Game.day; out.folk = Game.villagers.length;
  save();
  out.saved = localStorage.getItem(SAVE_KEY);
  return out;
}

// After a reload: load the save, save again at once, and run on a little.
function reloadAndCompare() {
  load();
  save();
  const again = localStorage.getItem(SAVE_KEY);
  for (let i = 0; i < 400; i++) simulate(0.5);
  render(0.016);
  return { again, day: Game.day, folk: Game.villagers.length };
}

// Two save blobs must have the same shape: every key that was saved is still
// there after a reload, with a value of the same kind, and no list has
// shrunk. A field written by save() but forgotten by load() shows up here.
function shapeDifference(a, b, at = 'save') {
  // a scalar may be settled by the load (a pet's facing, a position at a door, whoever
  // was indoors sent out), and a field left empty may be filled in: only a record or
  // list that turns into something else counts
  if (a === null || typeof a !== 'object') return null;
  if (b === null || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return `${at}: ${JSON.stringify(a)?.slice(0, 80)} vs ${JSON.stringify(b)?.slice(0, 80)}`;
  // what matters is loss: a list that shrinks or a key that vanishes across
  // the reload; a default filled in by load(), or a line logged by it, is fine
  if (Array.isArray(a)) {
    if (b.length < a.length) return `${at}: ${a.length} items before the reload, ${b.length} after`;
    // a list the load added to (a thread logged as folk are put outside) may have grown at either end
    const off = b.length - a.length;
    let d = null;
    for (let i = 0; i < a.length && !d; i++) d = shapeDifference(a[i], b[i], `${at}[${i}]`);
    if (d && off) { d = null; for (let i = 0; i < a.length && !d; i++) d = shapeDifference(a[i], b[i + off], `${at}[${i}]`); }
    return d;
  }
  for (const k of Object.keys(a)) {
    if (!(k in b)) return `${at}.${k}: missing after the reload`;
    const d = shapeDifference(a[k], b[k], `${at}.${k}`); if (d) return d;
  }
  return null;
}

async function run(browser, label, opts, failures) {
  const { page, errors } = await openGame(browser, opts);
  const r = await page.evaluate(runDays, 2);
  if (r.folk0 <= 0 || r.folk <= 0) failures.push(`${label}: no villagers (${r.folk0} → ${r.folk})`);
  if (r.day < 3) failures.push(`${label}: only reached day ${r.day}`);
  for (const b of new Set(r.bad)) failures.push(`${label}: ${b}`);
  if (opts.mobile) await page.screenshot({ path: path.join(outDir(), 'phone.png') });
  await page.reload();
  await page.waitForFunction(() => typeof Game !== 'undefined' && Game.villagers.length > 0, { timeout: 30000 });
  const r2 = await page.evaluate(reloadAndCompare);
  const diff = shapeDifference(JSON.parse(r.saved), JSON.parse(r2.again));
  if (diff) failures.push(`${label}: save changed by a reload: ${diff}`);
  if (r2.folk <= 0) failures.push(`${label}: no villagers after reload`);
  for (const e of errors) failures.push(`${label}: page error: ${e}`);
  await page.close();
  return r;
}

(async () => {
  const browser = await launch();
  const failures = [];
  const d = await run(browser, 'desktop', { width: 1280, height: 800 }, failures);
  const m = await run(browser, 'phone', { width: 390, height: 844, mobile: true }, failures);
  await browser.close();
  console.log(`smoke: desktop day ${d.day0}→${d.day} with ${d.folk} folk; phone day ${m.day0}→${m.day} with ${m.folk} folk`);
  finish('smoke', failures);
})().catch((e) => { console.error(e); process.exit(1); });
