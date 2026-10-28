'use strict';
// Shared plumbing for the headless tests, on Tycho's test kit
// (vendor/tycho/dist/testkit.cjs): launching Chromium (Playwright, or
// puppeteer-core with the Chrome in $CHROME), opening the game from the repo,
// waiting for it to be ready, and gathering every page error and console
// error so a test can fail on them.
const path = require('path');
const tk = require('../vendor/tycho/dist/testkit.cjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');

const chromePath = tk.chromePath;
// gl: with WebGL2 in software, so the world is drawn on the GPU (Tycho's
// renderer); without, the 2D path draws it, as where there's no WebGL2
const launch = ({ gl = false } = {}) => tk.launch({ gl });
const waitFor = tk.waitFor;
const READY = () => typeof Game !== 'undefined' && Game.villagers.length > 0;

// Opens the game in a fresh page with an empty save, and resolves once the
// villagers exist. `errors` fills with page errors and console errors.
async function openGame(kit, { width = 1280, height = 800, mobile = false } = {}) {
  const { page, errors } = await tk.open(kit, {
    root: ROOT, viewport: { width, height, mobile, scale: mobile ? 2 : 1 }, storage: null, ready: READY, timeout: 30000,
  });
  return { page, errors };
}

function outDir() { require('fs').mkdirSync(OUT, { recursive: true }); return OUT; }

// The worlds the golden tests build: three classic seeds as the original
// valley was made, and a planned valley (expanded with defaultGen in the page).
const CLASSIC = { hills: 'hilly', river: 'winding', woods: 'fair', wet: 'fair', hedges: 'some', flowers: 'plenty', rocks: 'some' };
const WORLDS = [
  { name: 'classic-1337', cfg: { seed: 1337, ...CLASSIC } },
  { name: 'classic-42', cfg: { seed: 42, ...CLASSIC } },
  { name: 'classic-9001', cfg: { seed: 9001, ...CLASSIC } },
  { name: 'valley-42', cfg: { seed: 42, layout: 'valley' } },
];

const finish = tk.finish;

module.exports = { ROOT, OUT, chromePath, launch, openGame, outDir, finish, waitFor, READY, WORLDS };
