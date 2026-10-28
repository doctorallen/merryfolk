'use strict';
// Draws the app's icons (icons/) from the game's own art: an apple tree of
// the valley in summer, enlarged by whole pixels on the evening green the
// world is drawn over, its foot on a strip of grass, cropped square. The
// tree sits well inside the middle 80%, so a launcher's mask can round it.
// Run it again if the trees' art changes: node test/icons.js
const path = require('path');
const fs = require('fs');
const { ROOT, launch, openGame } = require('./lib');

const SIZES = [
  { file: 'icon-512.png', n: 512 },
  { file: 'icon-192.png', n: 192 },
  { file: 'apple-touch-icon.png', n: 180 },
];

(async () => {
  const kit = await launch();
  try {
    const { page } = await openGame(kit);
    const out = await page.evaluate((sizes) => {
      // (the same tree every time: a fixed seed and kind)
      const tree = makeTree(4242, 'apple', 'summer');
      // (cropped to what's painted: the sprite has room around it for its shadow and sway)
      const tw = tree.width, th = tree.height, d = tree.getContext('2d').getImageData(0, 0, tw, th).data;
      let x0 = tw, y0 = th, x1 = 0, y1 = 0;
      for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) if (d[(y * tw + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1); }
      const bw = x1 - x0, bh = y1 - y0;
      return sizes.map(({ n }) => {
        const c = document.createElement('canvas');
        c.width = c.height = n;
        const x = c.getContext('2d');
        x.imageSmoothingEnabled = false;
        x.fillStyle = '#1d2a17'; x.fillRect(0, 0, n, n);
        // a whole-pixel scale that keeps the tree inside the middle 70%
        const k = Math.max(1, Math.floor((n * 0.66) / Math.max(bw, bh)));
        const w = bw * k, h = bh * k, tx = Math.round((n - w) / 2), ty = Math.round((n - h) / 2);
        x.fillStyle = '#4f7a34'; x.fillRect(Math.round(n * 0.12), ty + h - k * 3, Math.round(n * 0.76), k * 4);
        x.fillStyle = '#3d6328'; x.fillRect(Math.round(n * 0.12), ty + h + k, Math.round(n * 0.76), k * 2);
        x.drawImage(tree, x0, y0, bw, bh, tx, ty, w, h);
        return c.toDataURL('image/png').split(',')[1];
      });
    }, SIZES);
    fs.mkdirSync(path.join(ROOT, 'icons'), { recursive: true });
    SIZES.forEach((s, i) => fs.writeFileSync(path.join(ROOT, 'icons', s.file), Buffer.from(out[i], 'base64')));
    console.log('icons: ' + SIZES.map((s) => s.file).join(', '));
  } finally {
    await kit.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
