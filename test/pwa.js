'use strict';
// The installed game (sw.js, js/pwa.js, on Tycho's worker and installable
// app), served over http as the deploy is: the worker takes over and keeps
// the game and the talk packs; a new deploy is saved and loaded onto; a
// deploy of the build the page already runs doesn't reload it; and with the
// network gone the game still opens.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { ROOT, launch, finish, waitFor, READY } = require('./lib');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
// what the server deploys: the worker's stamp, the build version.json names
// (null: the page's own), and whether the network is there at all
const deploy = { sw: 'a1', build: null, offline: false };
// (what the page asked for and when, for a failure's report)
const asked = [], t0 = Date.now();
const PAGE_BUILD = fs.readFileSync(path.join(ROOT, 'js/version.js'), 'utf8').match(/BUILD_INFO = '([^']*)'/)[1];

function serve() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      if (deploy.offline) { req.socket.destroy(); return; }
      const url = decodeURIComponent(req.url.split('?')[0]);
      if (url === '/sw.js' || url === '/version.json') asked.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${url} ${url === '/sw.js' ? deploy.sw : deploy.build || 'page'}`);
      if (url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      if (url === '/version.json') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ build: deploy.build || PAGE_BUILD })); return; }
      const p = path.join(ROOT, url.replace(/\/$/, '/index.html'));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      let body = fs.readFileSync(p);
      if (url === '/sw.js') body = String(body).replace("'__BUILD__'", `'${deploy.sw}'`);
      res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      res.end(body);
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const server = await serve(), base = `http://127.0.0.1:${server.address().port}/`;
  const kit = await launch(), failures = [];
  const page = await kit.page({ width: 1280, height: 800 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const said = []; page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') said.push(m.text().slice(0, 160)); });
  const ready = () => waitFor(page, READY, { timeout: 60000 });
  const mark = () => page.evaluate(() => { window.__same = 1; });
  const same = () => page.evaluate(() => window.__same === 1).catch(() => false);
  const reloaded = async (ms) => {
    for (const t = Date.now(); Date.now() - t < ms; await wait(250)) if (!(await same())) { await ready(); return true; }
    return false;
  };
  const bump = async (sw, build) => { deploy.sw = sw; deploy.build = build; await wait(1500); await page.evaluate(() => Pwa.app.check()); };
  try {
    await page.goto(base + 'index.html');
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.reload();
    await ready();
    await waitFor(page, () => !!navigator.serviceWorker.controller, { timeout: 30000 });
    const cached = await page.evaluate(async () => { const c = await caches.open((await caches.keys())[0]); return (await c.keys()).map((r) => new URL(r.url).pathname); });
    for (const f of ['/index.html', '/js/main.js', '/js/pwa.js', '/css/style.css', '/manifest.webmanifest', '/icons/icon-512.png', '/vendor/tycho/dist/tycho.js', '/talk/core.js']) if (!cached.includes(f)) failures.push('the worker did not keep ' + f);

    // a deploy of the build already running: no reload
    await mark();
    await bump('a2', null);
    if (await reloaded(6000)) failures.push('a deploy of the build already running reloaded the page');

    // a new build: saved and loaded onto
    await mark();
    await bump('a3', 'v999.1 · test');
    if (!(await reloaded(15000))) {
      // what the worker and the page were doing (CI's logs can't be read from where this is fixed)
      const st = await page.evaluate(async () => {
        const a = Pwa.app, reg = await navigator.serviceWorker.getRegistration();
        const w = (x) => (x ? x.state + ' ' + new URL(x.scriptURL).pathname : null);
        return { newer: a.newer, reloading: a.reloading, live: a.live, reg: !!a.reg, active: w(reg && reg.active), waiting: w(reg && reg.waiting), installing: w(reg && reg.installing), controller: w(navigator.serviceWorker.controller), build: BUILD_INFO };
      }).catch((e) => ({ error: String(e) }));
      failures.push('a new deploy did not load: ' + JSON.stringify(st) + ' asked: ' + asked.slice(-12).join(', ') + (said.length ? ' console: ' + said.slice(-4).join(' | ') : ''));
    }

    // offline: the game still opens
    deploy.offline = true;
    await page.reload().catch(() => {});
    await ready().catch(() => failures.push('offline, the game did not open'));
    if (await page.evaluate(() => !navigator.serviceWorker.controller)) failures.push('offline, the worker did not serve the game');
    deploy.offline = false;
  } catch (e) {
    failures.push('crashed: ' + (e.stack || e));
  } finally {
    for (const e of errors) failures.push('page error: ' + e);
    await kit.close();
    server.close();
  }
  finish('pwa', failures);
})();
