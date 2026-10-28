'use strict';
// The valley drawn on the GPU (Tycho's renderer) against the same frame drawn
// on a 2D canvas: by day and by night, in summer and in winter, at two zooms,
// the pictures must agree within a few tones. Both are drawn in the same page
// from the same moment, the GPU's read back. Pictures of any that don't
// agree go to test/out.
const path = require('path'), fs = require('fs');
const tk = require('../vendor/tycho/dist/testkit.cjs');
const { ROOT, OUT, READY } = require('./lib');
const VIEWS = [
  { hour: 13, zoom: 2, x: 600, y: 500 }, { hour: 22, zoom: 2, x: 600, y: 500 },
  { hour: 19.5, zoom: 4, x: 900, y: 640 }, { hour: 23, zoom: 4, x: 420, y: 300, winter: true },
];
// within this many tones in any channel, for all but a sliver of pixels
const TONE = 6, SHARE = 0.003;

async function main() {
  const kit = await tk.launch({ gl: true }), failures = [];
  try {
    const { page, errors } = await tk.open(kit, { root: ROOT, viewport: { width: 1280, height: 800 }, storage: null, ready: READY, timeout: 60000 });
    // (the falling snow and rain move as they're drawn, so they're left out)
    await page.evaluate(() => { startGame(false); Game.speedIdx = 0; Dev.hide.weather = true; });
    await tk.waitFor(page, () => !World.paintJob, { timeout: 180000 });
    if (!(await page.evaluate(() => !!viewGpu))) failures.push('no WebGL2 here: the GPU path did not start');
    for (const v of VIEWS) {
      const r = await page.evaluate((v) => {
        if (v.winter && World.season !== 'winter') { World.season = 'winter'; paintGround('winter'); applySeasonToStatics && applySeasonToStatics('winter'); }
        Game.hour = Math.floor(v.hour); Game.minute = Math.round((v.hour % 1) * 60); Game.zoom = v.zoom; resize(); Game.cam.x = v.x; Game.cam.y = v.y; clampCam();
        const G = viewGpu, keep = vctx;
        // (a frame first, so what a frame sets for the next, the sky's
        // darkness, the lanterns it lights, is the same for both)
        render(0, 0); render(0, 0);
        const lit = G.read('lit');
        // the same frame on a 2D canvas the view's size
        const c = document.createElement('canvas'); c.width = view.width; c.height = view.height;
        const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
        viewGpu = null; vctx = g;
        try { render(0, 0); } finally { viewGpu = G; vctx = keep; }
        const d2 = g.getImageData(0, 0, c.width, c.height).data, a = lit.data;
        let max = 0, over = 0, sum = 0;
        for (let i = 0; i < a.length; i += 4) {
          const d = Math.max(Math.abs(a[i] - d2[i]), Math.abs(a[i + 1] - d2[i + 1]), Math.abs(a[i + 2] - d2[i + 2]));
          if (d > max) max = d; if (d > v.tone) over++; sum += d;
        }
        const n = a.length / 4;
        const pic = (d) => { const [cc, x] = makeCanvas(c.width, c.height); const im = x.createImageData(c.width, c.height); for (let i = 0; i < d.length; i += 4) { im.data[i] = d[i]; im.data[i + 1] = d[i + 1]; im.data[i + 2] = d[i + 2]; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return cc.toDataURL('image/png').split(',')[1]; };
        return { max, share: over / n, mean: +(sum / n).toFixed(2), pics: over / n > v.share ? [pic(a), pic(d2)] : null };
      }, Object.assign({ tone: TONE, share: SHARE }, v));
      const name = `${v.hour}h zoom ${v.zoom}${v.winter ? ' winter' : ''}`;
      const line = `${name}: worst ${r.max}, over ${TONE}: ${(r.share * 100).toFixed(2)}%, mean ${r.mean}`;
      console.log('  ' + line);
      if (r.pics) {
        failures.push(line);
        fs.mkdirSync(OUT, { recursive: true });
        const f = name.replace(/[^a-z0-9]+/gi, '-');
        fs.writeFileSync(path.join(OUT, `gpu-${f}-gpu.png`), Buffer.from(r.pics[0], 'base64'));
        fs.writeFileSync(path.join(OUT, `gpu-${f}-2d.png`), Buffer.from(r.pics[1], 'base64'));
      }
    }
    for (const e of errors) failures.push('page error: ' + e);
  } finally { await kit.close(); }
  tk.finish('gpu', failures);
}
main().catch((e) => { console.error(e); process.exit(1); });
