'use strict';
// Shared plumbing for the headless tests: launching the installed Chrome,
// opening the game from the repo, waiting for it to be ready, and gathering
// every page error and console error so a test can fail on them.
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');

function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(mac)) return mac;
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium']) if (fs.existsSync(p)) return p;
  throw new Error('No Chrome found: set CHROME to the browser executable');
}

async function launch() {
  return puppeteer.launch({ executablePath: chromePath(), headless: 'new', args: ['--allow-file-access-from-files', '--no-sandbox', '--disable-gpu'] });
}

// Opens the game in a fresh page with an empty save, and resolves once the
// villagers exist. `errors` fills with page errors and console errors.
async function openGame(browser, { width = 1280, height = 800, mobile = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport(mobile ? { width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { width, height });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.waitForFunction(() => typeof Game !== 'undefined' && Game.villagers.length > 0, { timeout: 30000 });
  return { page, errors };
}

function outDir() { fs.mkdirSync(OUT, { recursive: true }); return OUT; }

// A test's verdict: prints the line and exits non-zero on failure.
function finish(name, failures) {
  if (failures.length) { console.error(`${name}: FAIL\n  ` + failures.join('\n  ')); process.exit(1); }
  console.log(`${name}: ok`);
}

module.exports = { ROOT, OUT, chromePath, launch, openGame, outDir, finish };
