'use strict';
// Two game days of a new village, headless: no errors, sane numbers, nobody
// stuck, and a save that survives a reload unchanged (and, on the desktop, a
// save with the names from before they were American, which loads the same).
// Runs once on a desktop window and once as a phone, where it also takes a
// screenshot.
const fs = require('fs');
const path = require('path');
const { launch, openGame, outDir, finish, waitFor, READY } = require('./lib');

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
  // the minds (Tyrell's world, in the save as it was) come back exactly as they were saved
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
  load();
  const minds = !saved.minds || (Shell.on && JSON.stringify(Shell.w.s) === JSON.stringify(saved.minds.s));
  save();
  const again = localStorage.getItem(SAVE_KEY);
  for (let i = 0; i < 400; i++) simulate(0.5);
  render(0.016);
  return { again, minds, day: Game.day, folk: Game.villagers.length };
}

// A save from before the names were American (save.js, RENAMED) loads as if
// it had been written today. The village's own save, with the wizard's bond,
// a moodlet and the workforce plan given every renamed name, is written back
// with the old names; loading each (the same draws of chance both times) and
// saving again must give the same blob, with no old name left in it. The
// planned valley's middle is read back from an old save's settings, and an
// old villager's code is received with its names put right.
function oldNamesRoundTrip() {
  const NEW = Object.fromEntries(Object.entries(RENAMED).map(([a, b]) => [b, a]));
  const back = (s) => (Object.hasOwn(NEW, s) ? NEW[s] : s);
  const old = (o) => (Array.isArray(o) ? o.map(old) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [back(k), old(v)])) : typeof o === 'string' ? back(o) : o);
  const names = (o, set = new Set()) => { if (Array.isArray(o)) o.forEach((x) => names(x, set)); else if (o && typeof o === 'object') for (const k of Object.keys(o)) { set.add(k); names(o[k], set); } else if (typeof o === 'string') set.add(o); return set; };
  const data = JSON.parse(localStorage.getItem(SAVE_KEY));
  // every renamed name somewhere it can be saved
  const v0 = data.villagers[0];
  v0.moodlets = (v0.moodlets || []).concat([{ k: 'cozy', x: '', until: data.time + 600 }]);
  data.jobPlan = Object.assign(data.jobPlan || {}, { mailcarrier: 1 });
  const threads = ['village.rumor', 'village.ask.wizrumor', 'wiz.favor', 'work.mailcarrier'];
  const beats = ['aging', 'cookie', 'cookies', 'burned', 'color', 'colors', 'favor', 'gray', 'honor', 'honored', 'pumpkins', 'mom', 'neighbor', 'neighbors', 'practice', 'candy'];
  data.wizBond = Object.assign(data.wizBond || {}, {
    [v0.id]: { talks: 2, last: 1, trust: 0.1, gifts: [], notes: [], known: {}, respect: 0, owe: 0, told: [], sore: { 'wiz.favor': 1 }, hooks: [{ k: 'x', thread: 'village.rumor', d: 1 }],
      seen: Object.fromEntries(threads.map((t) => [t, 1])), stage: Object.fromEntries(beats.map((b, i) => [threads[i % threads.length] + (i < threads.length ? '' : '.' + i), b])), lastThread: 'wiz.favor',
      jokes: ['ages.candy', 'child.tale.cookie', 'pastime.burned', 'season.favor', 'village.wizrumor'].map((k) => ({ k, t: 'a joke', d: 1 })),
      promises: ['secret.village.neighbor', 'wiz.visit.favor'].map((k) => ({ k, t: 'a promise', d: 1, due: 4, state: 'open' })) },
  });
  const now = JSON.stringify(data), was = JSON.stringify(old(data));
  const out = { bad: [] };
  // the old blob really does have the old names in it, all of them
  const oldNames = names(JSON.parse(was));
  const missing = Object.keys(RENAMED).filter((k) => k !== 'townCentre' && !oldNames.has(k));
  if (missing.length) out.bad.push(`the old save lacked ${missing.join(', ')}, so the check proves less than it should`);
  const roundTrip = (blob) => { localStorage.setItem(SAVE_KEY, blob); Math.random = mulberry32(77); load(); save(true); return localStorage.getItem(SAVE_KEY); };
  const a = roundTrip(now), b = roundTrip(was);
  if (a !== b) out.bad.push('a save with the old names loaded differently from the same save with the new ones');
  const left = Object.keys(RENAMED).filter((k) => names(JSON.parse(b)).has(k));
  if (left.length) out.bad.push(`old names still in the save after loading: ${left.join(', ')}`);
  // the planned valley's middle, read by savedGen before the world is built
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...JSON.parse(was), world: { ...data.world, plan: { townCentre: { x: 7, y: 9 } } } }));
  const gen = savedGen();
  if (!gen || !gen.plan || !gen.plan.townCenter || gen.plan.townCenter.x !== 7 || 'townCentre' in gen.plan) out.bad.push('an old planned valley lost its middle');
  // a villager's code from an older game
  const code = exportVillager(Game.villagers.find((v) => v.isGrown()));
  const json = JSON.parse(decodeURIComponent(escape(atob(code.slice(4)))));
  const got = importVillagerCode('TD2:' + btoa(unescape(encodeURIComponent(JSON.stringify(old(json))))));
  if (JSON.stringify(got) !== JSON.stringify(json)) out.bad.push('a villager\'s code from an older game came in changed');
  localStorage.setItem(SAVE_KEY, a);
  return out;
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
    // a top-level list (folk, homes, talks…) may not shrink; lists inside a record (a villager's
    // wishes, say) are pruned legitimately as they're loaded, so only their items' shapes count
    if (b.length < a.length && !at.includes('.') && !at.includes('[')) return `${at}: ${a.length} items before the reload, ${b.length} after`;
    if (b.length < a.length) a = a.slice(0, b.length);
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
  // (a busy machine can take a while to load the page again)
  await page.reload({ timeout: 120000 });
  await waitFor(page, READY, { timeout: 120000 });
  const r2 = await page.evaluate(reloadAndCompare);
  // (the minds are Tyrell's own state, with a heap of events and a rolling log whose shapes shift as
  // they run: they're held to coming back exactly as they were saved instead)
  const noMinds = (blob) => { const o = JSON.parse(blob); delete o.minds; return o; };
  const diff = shapeDifference(noMinds(r.saved), noMinds(r2.again));
  if (diff) failures.push(`${label}: save changed by a reload: ${diff}`);
  if (!r2.minds) failures.push(`${label}: the minds came back from the save changed`);
  if (r2.folk <= 0) failures.push(`${label}: no villagers after reload`);
  if (!opts.mobile) for (const b of (await page.evaluate(oldNamesRoundTrip)).bad) failures.push(`${label}: ${b}`);
  for (const e of errors) failures.push(`${label}: page error: ${e}`);
  await page.close();
  return r;
}

(async () => {
  const browser = await launch({ gl: true }); // (the world on the GPU, as most browsers draw it)
  const failures = [];
  const d = await run(browser, 'desktop', { width: 1280, height: 800 }, failures);
  const m = await run(browser, 'phone', { width: 390, height: 844, mobile: true }, failures);
  await browser.close();
  console.log(`smoke: desktop day ${d.day0}→${d.day} with ${d.folk} folk; phone day ${m.day0}→${m.day} with ${m.folk} folk`);
  finish('smoke', failures);
})().catch((e) => { console.error(e); process.exit(1); });
