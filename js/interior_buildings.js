'use strict';
// ---------------------------------------------------------------------------
// Inside every building, not just the homes. The same live cutaway, but of a
// timber-and-stone building standing on the ground under its roof, furnished
// for its trade: the taproom (bar, barrels, tables, a fire, beds for lodgers
// at the back), the Common Store and granary (their shelves show what's
// really in stock), the mills (millstones that turn while the miller works),
// the bakehouse (ovens glowing, racks of loaves), the brewhouse (a steaming
// copper and barrels of ale), the herbalist's stillroom, the woodwright's
// workshop, the smokehouse, and the rift-folk's humming machine rooms.
// ---------------------------------------------------------------------------

const BUILDING_KIND = {
  inn: 'tavern', inn2: 'tavern', glowworm: 'tavern', store: 'store', storehouse: 'store', barn: 'granary', mill: 'mill', mill2: 'mill', windmill: 'mill',
  bakery: 'bakery', bakery2: 'bakery', brewhouse: 'brewery', herbalist: 'stillroom', workshop: 'woodshop', smokehouse: 'smokery',
  relay: 'rift', array: 'rift', dynamo: 'rift', turbine: 'rift',
};
const BUILDING_ROOMS = {
  tavern: [['taproom', 210], ['innkitchen', 96], ['lodging', 112]],
  store: [['shopfloor', 170], ['storeroom', 120]],
  granary: [['granary', 230]],
  mill: [['millroom', 150], ['sackroom', 96]],
  bakery: [['bakeroom', 170], ['shopfront', 84]],
  brewery: [['brewroom', 160], ['cellar', 104]],
  stillroom: [['stillroom', 150]],
  woodshop: [['woodshop', 180]],
  smokery: [['smokeroom', 140]],
  rift: [['riftroom', 160]],
};
const ROOM_NAMES = {
  taproom: 'The taproom', innkitchen: 'The inn kitchen', lodging: 'The lodgers\' room', shopfloor: 'The shop floor', storeroom: 'The storeroom', granary: 'The granary floor',
  millroom: 'The millstones', sackroom: 'The sack loft', bakeroom: 'The bakehouse', shopfront: 'The bread shop', brewroom: 'The brew room', cellar: 'The cellar',
  stillroom: 'The stillroom', woodshop: 'The workshop', smokeroom: 'The smoking room', riftroom: 'The machine room',
};
const isRiftBuilding = (b) => !!(b.neon || ['relay', 'array', 'dynamo', 'turbine', 'glowworm'].includes(b.key));

// What's in stock, rounded, so the shelves are only repainted when it changes much.
function stockSig(keys) { return keys.map((k) => Math.min(20, Math.round((Village.stores[k] || 0) / 4))).join('.'); }
const STOCK_KEYS = ['grain', 'flour', 'bread', 'pie', 'cake', 'veg', 'fish', 'apple', 'egg', 'cheese', 'ale', 'wood', 'herbs', 'leaf', 'remedy', 'wool', 'scrap', 'honey', 'mush'];

function buildingLayout(b) {
  const kind = BUILDING_KIND[b.key] || 'store';
  const neon = isRiftBuilding(b);
  const rooms = BUILDING_ROOMS[kind].map(([k, w]) => ({ kind: k, w }));
  let x = PAD;
  rooms.forEach((r, i) => { r.side = i === 0 ? -1 : 1; r.x0 = x; r.x1 = x + r.w; x = r.x1 + WT; });
  const IW = x - WT + PAD;
  const vr = mulberry32(b.key.length * 977 + (b.x0 || 0) * 31);
  const L = {
    h: b, building: true, bkind: kind, IW, rooms, beds: [], res: [], neon, lost: false, hallI: 0, vr, seats: [], spots: {}, items: [], hot: [], wins: [], cradles: [],
    wall: neon ? '#1f2338' : { tavern: '#e8d4ae', bakery: '#efdcb6', mill: '#d8ccb4', granary: '#d4c4a0', store: '#e6d6b0', brewery: '#dccaa6', stillroom: '#e4e0c4', woodshop: '#dcc8a2', smokery: '#b8a890', rift: '#1f2338' }[kind] || '#e6d6b0',
    pal: neon ? { o: '#0a0b14', d: '#1a1d30', m: '#2c3150', l: '#3e456c', h: '#55608e' } : IWOOD,
  };
  // a pitched roof over flat ceilings
  L.crust = () => 4;
  L.top = (r, px) => {
    let t = CEIL;
    const dx = Math.min(px - r.x0, r.x1 - 1 - px);
    if (dx < 4) t += 4 - dx;
    return t;
  };
  for (const r of rooms) placeBuildingRoom(L, r);
  for (const r of rooms) {
    const cx = Math.round((r.x0 + r.x1) / 2);
    r.lampX = L.wins.some((w) => w.room === r && Math.abs(w.x - cx) < 18) ? cx + 26 : cx;
    if (r.lampX > r.x1 - 10) r.lampX = cx - 26;
    r.path = new Path2D();
    r.path.moveTo(r.x0, FLOOR_B + 3);
    for (let px = r.x0; px < r.x1; px++) { const t = L.top(r, px); r.path.lineTo(px, t); r.path.lineTo(px + 1, t); }
    r.path.lineTo(r.x1, FLOOR_B + 3); r.path.closePath();
  }
  return L;
}

function placeBuildingRoom(L, r) {
  const b = L.h, cx = Math.round((r.x0 + r.x1) / 2), B = WALL_B;
  const add = (it) => { it.room = r; L.items.push(it); return it; };
  const seat = (s) => { s.room = r; L.seats.push(s); return s; };
  const hot = (x0, y0, x1, y1, text) => L.hot.push({ x0, y0, x1, y1, text });
  const win = (x, y = 52) => { L.wins.push({ x, y, sq: true, room: r }); };
  r.name = ROOM_NAMES[r.kind] || 'A room';
  const S = Village.stores;
  switch (r.kind) {
    case 'taproom': {
      L.door = { x: r.x0 + 26, y: 80, r: 16 };
      L.hearth = { x: r.x0 + 74, y: B }; add({ t: 'hearth', x: r.x0 + 74 });
      // tables with chairs round them, the bar at the far end with barrels behind
      const tb = add({ t: 'table', x: r.x0 + 98, w: 46, n: 2 });
      for (let i = 0; i < 2; i++) seat({ kind: 'chair', x: r.x0 + 98 + 13 + i * 20, y: 90, item: tb, i });
      add({ t: 'bar', x: r.x1 - 62, w: 56, neon: L.neon });
      L.spots.bar = { x: r.x1 - 34, y: 104 };
      win(r.x0 + 126, 50);
      hot(r.x1 - 62, 60, r.x1 - 6, 104, () => `The bar: ${S.ale || 0} barrels' worth of ale in the Store${Village.innkeeperOn() ? ', and the innkeeper pulling pints' : ''}.`);
      hot(r.x0 + 58, 50, r.x0 + 90, 98, () => (Interior.fire > 0.5 ? 'A big fire roaring in the inglenook.' : 'The inglenook, the fire banked.'));
      break;
    }
    case 'innkitchen':
      add({ t: 'range', x: r.x0 + 6 }); L.spots.oven = { x: r.x0 + 23, y: 104 };
      add({ t: 'stock', x: r.x0 + 44, w: r.w - 50, keys: ['veg', 'fish', 'mush', 'bread'] });
      hot(r.x0, 60, r.x1, 104, () => `Stew on the go. The Store has ${S.veg || 0} veg, ${S.fish || 0} fish and ${S.stew || 0} pots of stew made.`);
      break;
    case 'lodging': {
      let bx = r.x0 + 8;
      for (let k = 0; k < 3; k++) { const bd = { kind: 'single', who: [], w: 30, x: bx, room: r }; L.beds.push(bd); add({ t: 'bed', x: bx, bed: bd }); bx += 36; }
      hot(r.x0, 60, r.x1, 104, () => { const n = Game.villagers.filter((v) => v.task && v.task.a.id === 'lodge' && v.inside === b).length; return n ? `${n} lodger${n > 1 ? 's' : ''} in for the night.` : 'Three narrow beds for travelers, if the innkeeper likes the look of you.'; });
      break;
    }
    case 'shopfloor':
      L.door = { x: r.x0 + 26, y: 80, r: 16 };
      add({ t: 'bar', x: r.x0 + 54, w: 60, counter: true }); L.spots.counter = { x: r.x0 + 84, y: 104 };
      add({ t: 'stock', x: r.x0 + 120, w: r.w - 126, keys: ['bread', 'pie', 'cake', 'cheese', 'egg', 'apple', 'veg', 'fish', 'leaf'] });
      win(r.x0 + 84, 48);
      hot(r.x0 + 120, 40, r.x1, 104, () => `On the shelves: ${['bread', 'cheese', 'veg', 'apple', 'fish', 'egg'].map((k) => `${S[k] || 0} ${k}`).join(', ')}.`);
      break;
    case 'storeroom': case 'granary': case 'sackroom': case 'cellar': {
      if (r.kind === 'granary') L.door = { x: r.x0 + 26, y: 80, r: 16 };
      const keys = { storeroom: ['grain', 'flour', 'wood', 'wool', 'herbs', 'scrap', 'honey', 'remedy'], granary: ['grain', 'flour', 'veg', 'apple', 'egg', 'cheese', 'wool'], sackroom: ['flour', 'grain'], cellar: ['ale'] }[r.kind];
      add({ t: 'stock', x: r.x0 + (r.kind === 'granary' ? 50 : 8), w: r.w - (r.kind === 'granary' ? 56 : 14), keys });
      hot(r.x0, 40, r.x1, 104, () => `Stored here: ${keys.map((k) => `${S[k] || 0} ${k}`).join(', ')}.`);
      break;
    }
    case 'millroom':
      L.door = { x: r.x0 + 26, y: 80, r: 16 };
      add({ t: 'millstone', x: r.x0 + 70 }); L.spots.mill = { x: r.x0 + 92, y: 104 };
      win(r.x1 - 30, 48);
      hot(r.x0 + 50, 50, r.x0 + 110, 104, () => (Interior.milling ? 'The millstones grinding, flour dust in the air.' : 'The millstones, still for now.'));
      break;
    case 'bakeroom':
      L.door = { x: r.x0 + 26, y: 80, r: 16 };
      add({ t: 'ovens', x: r.x0 + 54 }); L.spots.oven = { x: r.x0 + 76, y: 104 };
      add({ t: 'kneading', x: r.x0 + 108 }); L.spots.kneading = { x: r.x0 + 126, y: 104 };
      hot(r.x0 + 54, 40, r.x0 + 104, 104, () => (Interior.baking ? 'The ovens roaring. Something smells wonderful.' : 'Two big bread ovens, warm even now.'));
      break;
    case 'shopfront':
      add({ t: 'stock', x: r.x0 + 6, w: r.w - 12, keys: ['bread', 'pie', 'cake'] });
      hot(r.x0, 40, r.x1, 104, () => `Racks of ${S.bread || 0} loaves, ${S.pie || 0} pies and ${S.cake || 0} cakes.`);
      break;
    case 'brewroom':
      L.door = { x: r.x0 + 26, y: 80, r: 16 };
      add({ t: 'copper', x: r.x0 + 60 }); L.spots.copper = { x: r.x0 + 88, y: 104 };
      win(r.x1 - 28, 48);
      hot(r.x0 + 50, 40, r.x0 + 110, 104, () => (Interior.brewing ? 'The copper steaming, malt and hops in the air.' : 'The brewing copper, scrubbed and ready.'));
      break;
    case 'stillroom':
      L.door = { x: r.x0 + 26, y: 80, r: 16 };
      add({ t: 'herbtable', x: r.x0 + 54 }); L.spots.herbs = { x: r.x0 + 74, y: 104 };
      add({ t: 'jars', x: r.x1 - 34, w: 24 });
      win(r.x0 + 112, 48);
      hot(r.x0 + 54, 40, r.x1, 104, () => `Herbs drying, ${S.herbs || 0} bundles in store and ${S.remedy || 0} remedies made.`);
      break;
    case 'woodshop':
      L.door = { x: r.x0 + 26, y: 80, r: 16 };
      add({ t: 'workbench', x: r.x0 + 54, carving: true }); L.spots.bench = { x: r.x0 + 76, y: 104 };
      add({ t: 'stock', x: r.x0 + 110, w: r.w - 116, keys: ['wood'] });
      hot(r.x0 + 110, 40, r.x1, 104, () => `Timber stacked to season: ${S.wood || 0} loads.`);
      break;
    case 'smokeroom':
      L.door = { x: r.x0 + 26, y: 80, r: 16 };
      add({ t: 'smokerack', x: r.x0 + 54, w: r.w - 60 });
      hot(r.x0 + 54, 30, r.x1, 104, () => 'Fish and hams hanging in the oak smoke. Food keeps twice as long.');
      break;
    case 'riftroom':
      L.door = { x: r.x0 + 26, y: 80, r: 16 };
      add({ t: 'console', x: r.x0 + 56, w: r.w - 64 }); L.spots.console = { x: r.x0 + 84, y: 104 }; L.spots.charger = { x: r.x1 - 30, y: 104 };
      hot(r.x0 + 56, 40, r.x1, 104, () => `Screens, cables and a charging rack. ${Game.villagers.filter((v) => v.inside === b).length} in here now.`);
      break;
  }
  for (const w of L.wins.filter((w) => w.room === r)) hot(w.x - 11, w.y - 11, w.x + 11, w.y + 11, () => windowWord());
  hot(r.x0, CEIL, r.x1, FLOOR_B, () => r.name + '.');
}

// The outside of the building around the rooms: sky, a pitched roof with a
// chimney, timber framing at the ends, and the ground it stands on.
function paintShell(L) {
  const { IW } = L, b = L.h;
  const winter = World.season === 'winter';
  const roof = L.neon ? ['#2a2f4e', '#3a4068', '#1a1d30'] : b.key.startsWith('inn') || ['bakery', 'bakery2', 'brewhouse', 'herbalist'].includes(b.key) ? ['#b8923a', '#d4ac52', '#8a6a24'] : ['#6a6a74', '#8a8a94', '#4a4a54'];
  const x0 = PAD - 12, x1 = IW - PAD + 12, mid = IW / 2;
  // the roof: a long pitch from the eaves up to the ridge
  for (let x = x0; x < x1; x++) {
    const u = Math.abs(x - mid) / ((x1 - x0) / 2);
    const top = Math.round(4 + u * (CEIL - 10));
    IR(x, top, 1, CEIL - top + 2, roof[0]);
    if ((x - x0) % 6 === 0) IR(x, top, 1, CEIL - top + 2, roof[2]);
    if ((x + top) % 5 === 0) IP(x, top + 2, roof[1]);
    IP(x, top, winter ? '#f4f8ff' : roof[1]);
    if (winter) IP(x, top + 1, '#e4ecf6');
  }
  // a chimney over the hearth or the oven
  const chimX = L.hearth ? L.hearth.x : L.items.find((i) => ['ovens', 'range', 'copper'].includes(i.t)) ? L.items.find((i) => ['ovens', 'range', 'copper'].includes(i.t)).x + 14 : null;
  if (chimX != null) {
    const u = Math.abs(chimX - mid) / ((x1 - x0) / 2), top = Math.round(4 + u * (CEIL - 10)) - 10;
    IR(chimX - 6, top, 13, CEIL - top, '#7a5a4a'); for (let y = top; y < CEIL; y += 4) IR(chimX - 6 + ((y >> 2) % 2) * 3, y, 4, 1, '#9a6a54');
    IR(chimX - 8, top - 3, 17, 4, '#4a3a2a');
    L.chimTop = { x: chimX, y: top - 4 };
  }
  // the ground under the floor
  for (let x = 0; x < IW; x++) {
    IR(x, FLOOR_B, 1, IH - FLOOR_B, '#5e4028');
    for (let y = FLOOR_B + 3; y < IH; y += 3) if (hash2(x * 3, y * 5) < 0.1) IP(x, y, '#4a3220');
    if (x < x0 + 2 || x >= x1 - 2) { IR(x, FLOOR_B - 3, 1, 3, winter ? '#f4f8ff' : '#5c8f3e'); }
  }
  // the end walls, timber-framed
  for (const ex of [x0, x1 - 10]) { IR(ex, CEIL - 2, 10, FLOOR_B - CEIL + 2, L.pal.d); IR(ex + 2, CEIL, 6, FLOOR_B - CEIL, L.neon ? '#2c3150' : '#c8b48a'); IR(ex + 4, CEIL, 2, FLOOR_B - CEIL, L.pal.m); }
  L.hillPath = new Path2D();
  L.hillPath.moveTo(x0, IH);
  for (let x = x0; x <= x1; x++) { const u = Math.abs(x - mid) / ((x1 - x0) / 2); L.hillPath.lineTo(x, Math.round(4 + u * (CEIL - 10))); }
  L.hillPath.lineTo(x1, IH); L.hillPath.closePath();
}

// ----- furniture of the trades -----
function drawBuildingItem(L, it, part, t) {
  const p = L.pal, b = WALL_B, x = it.x, S = Village.stores;
  switch (it.t) {
    case 'bar': {
      if (part === 'back' && !it.counter) {
        // barrels and bottles behind the bar
        for (let k = 0; k < 3; k++) { const bx = x + 6 + k * 16; IR(bx, b - 46, 13, 12, '#7a4e2a'); IR(bx, b - 42, 13, 1, '#3a3a3a'); IR(bx + 5, b - 40, 3, 3, '#3a2414'); }
        IR(x, b - 50, it.w, 2, p.l);
        for (let k = 0; k < 8; k++) IR(x + 4 + k * 6, b - 58, 3, 8, it.neon ? ['#ff3aa8', '#3af0ff', '#7aff5a'][k % 3] : ['#3a6a3a', '#8a3a2a', '#c8a03a'][k % 3]);
        return;
      }
      if (part === 'back') { IR(x, b - 50, it.w, 2, p.l); for (let k = 0; k < 6; k++) IR(x + 4 + k * 9, b - 58, 6, 8, ['#c8a03a', '#8a5a3a', '#e8dcc0'][k % 3]); return; }
      // the counter itself, in front of whoever's serving
      IR(x, b - 22, it.w, 4, p.l); IR(x, b - 22, it.w, 1, p.h);
      IR(x + 2, b - 18, it.w - 4, 18, p.m);
      for (let k = 6; k < it.w - 4; k += 10) IR(x + k, b - 16, 1, 14, p.d);
      if (!it.counter) { IR(x + 10, b - 30, 2, 8, '#b8902a'); IR(x + 16, b - 30, 2, 8, '#b8902a'); IR(x + 9, b - 31, 10, 2, '#d8b040'); IR(x + 30, b - 26, 5, 4, '#c9a46a'); }
      else { IR(x + 8, b - 28, 10, 6, '#8a8a94'); IR(x + 12, b - 31, 2, 3, '#6a6a74'); IR(x + 30, b - 26, 8, 4, '#c8945a'); }
      return;
    }
    case 'stock': {
      if (part !== 'back') return;
      // shelves along the wall, then sacks, crates and barrels on the floor,
      // as many as the Store really holds
      const w = it.w;
      for (const sy of [b - 56, b - 38]) { IR(x, sy, w, 2, p.l); IR(x, sy + 2, w, 1, p.d); }
      let fx = x + 2, sx = x + 2, row = 0;
      for (const k of it.keys) {
        const n = Math.min(8, Math.ceil((S[k] || 0) / 6));
        for (let j = 0; j < n; j++) {
          const st = stockSprite(k);
          if (st.floor) { if (fx + st.w > x + w) continue; drawStockThing(k, fx, b - st.h); fx += st.w + 1; }
          else { if (sx + st.w > x + w) { sx = x + 2; row++; } if (row > 1) continue; drawStockThing(k, sx, (row ? b - 38 : b - 56) - st.h); sx += st.w + 1; }
        }
      }
      return;
    }
    case 'millstone': {
      if (part !== 'back') {
        // the runner stone, turning while the miller works
        const turn = Interior.milling ? Math.floor(t * 6) % 4 : 0;
        IR(x - 22, b - 26, 46, 8, '#8a8478'); IR(x - 22, b - 26, 46, 1, '#a8a294');
        for (let k = 0; k < 6; k++) IR(x - 20 + ((k * 8 + turn * 2) % 44), b - 25, 1, 6, '#6a6458');
        IR(x - 24, b - 18, 50, 18, p.m); IR(x - 24, b - 18, 50, 1, p.h);
        if (Interior.milling) for (let k = 0; k < 4; k++) IP(x - 26 + ((t * 17 + k * 13) % 54), b - 30 - ((t * 9 + k * 5) % 10), 'rgba(255,255,255,0.7)');
        return;
      }
      // the hopper and its frame
      IR(x - 4, CEIL, 2, b - 26 - CEIL, p.d); IR(x + 4, CEIL, 2, b - 26 - CEIL, p.d);
      for (let k = 0; k < 10; k++) IR(x - 10 + k, b - 50 + k, 22 - k * 2, 1, p.l);
      return;
    }
    case 'ovens': {
      if (part !== 'back') return;
      for (let k = 0; k < 2; k++) {
        const ox = x + k * 26;
        IR(ox, b - 40, 24, 40, '#9a5a3a'); for (let y = b - 40; y < b; y += 4) IR(ox + ((y >> 2) % 2) * 3, y, 24, 1, '#7a4a2e');
        disc(IX, ox + 12, b - 20, 8, '#3a2014'); IR(ox + 4, b - 20, 17, 10, '#3a2014');
      }
      return;
    }
    case 'kneading': {
      if (part !== 'back') return;
      IR(x, b - 18, 38, 3, p.l); IR(x + 1, b - 15, 3, 15, p.d); IR(x + 34, b - 15, 3, 15, p.d);
      IR(x + 6, b - 22, 12, 4, '#e8d8b0'); IR(x + 22, b - 21, 10, 3, '#c8945a'); IR(x + 24, b - 23, 2, 1, '#e8e0c8');
      return;
    }
    case 'copper': {
      if (part !== 'back') return;
      disc(IX, x, b - 30, 16, '#b8743a'); disc(IX, x - 4, b - 34, 6, '#d8945a'); IR(x - 16, b - 30, 33, 30, '#b8743a'); IR(x - 16, b - 30, 2, 30, '#d8945a');
      IR(x - 18, b - 8, 37, 8, '#5a3a22'); IR(x - 2, CEIL, 4, b - 46 - CEIL, '#8a5a30');
      for (let k = 0; k < 3; k++) { IR(x + 24 + k * 14, b - 14, 12, 14, '#7a4e2a'); IR(x + 24 + k * 14, b - 10, 12, 1, '#3a3a3a'); }
      return;
    }
    case 'smokerack': {
      if (part !== 'back') return;
      IR(x, CEIL + 8, it.w, 2, p.d);
      for (let k = 0; k < it.w / 9; k++) { const hx = x + 4 + k * 9; IR(hx, CEIL + 10, 1, 6, '#5a3a22'); if (k % 3 === 2) { IR(hx - 3, CEIL + 16, 7, 12, '#8a3a2a'); IR(hx - 2, CEIL + 17, 5, 2, '#b85a3a'); } else { IR(hx - 2, CEIL + 16, 5, 14, '#a8946a'); IR(hx - 1, CEIL + 28, 3, 3, '#8a7a52'); } }
      IR(x + it.w / 2 - 12, b - 8, 24, 8, '#4a3a2a'); for (let k = 0; k < 6; k++) IP(x + it.w / 2 - 10 + k * 4, b - 9, '#ff8a3a');
      return;
    }
    case 'console': {
      if (part !== 'back') {
        // the screens flicker
        for (let k = 0; k < Math.floor(it.w / 22); k++) { const sx = x + 4 + k * 22; IR(sx + 2, b - 46, 14, 9, Math.sin(t * 3 + k) > -0.6 ? ['#3af0ff', '#7aff5a', '#ff3aa8'][k % 3] : '#0d2a3a'); for (let j = 0; j < 3; j++) IR(sx + 4, b - 44 + j * 3, 4 + ((Math.floor(t * 4) + j + k) % 7), 1, '#07080e'); }
        return;
      }
      for (let k = 0; k < Math.floor(it.w / 22); k++) { const sx = x + 4 + k * 22; IR(sx, b - 48, 18, 13, '#26262e'); IR(sx + 7, b - 35, 4, 7, '#3a3a44'); }
      IR(x, b - 28, it.w, 4, '#3a3a44'); IR(x, b - 28, it.w, 1, '#5a5e66'); IR(x + 2, b - 24, it.w - 4, 24, '#26262e');
      for (let k = 0; k < it.w; k += 5) IP(x + k, b - 22, k % 3 ? '#3af0ff' : '#ff3aa8');
      // cables to the ceiling and a charging rack
      for (let k = 0; k < 4; k++) { IR(x + 10 + k * 18, CEIL, 1, b - 48 - CEIL, '#1a1a22'); }
      IR(x + it.w - 22, b - 60, 18, 26, '#3a3a44'); for (let k = 0; k < 4; k++) IR(x + it.w - 19, b - 57 + k * 6, 12, 3, Math.sin(t * 2 + k) > 0 ? '#7aff5a' : '#2a5a2a');
      return;
    }
  }
}
function stockSprite(k) {
  return { grain: { w: 9, h: 11, floor: true }, flour: { w: 9, h: 11, floor: true }, wool: { w: 9, h: 8, floor: true }, wood: { w: 12, h: 9, floor: true }, ale: { w: 11, h: 12, floor: true },
    scrap: { w: 10, h: 7, floor: true }, veg: { w: 10, h: 7, floor: true }, apple: { w: 10, h: 7, floor: true } }[k] || { w: 7, h: 6 };
}
function drawStockThing(k, x, y) {
  switch (k) {
    case 'grain': case 'flour': IR(x, y + 2, 9, 9, k === 'flour' ? '#f4ead0' : '#d8c08a'); IR(x + 2, y, 5, 2, '#a89060'); IR(x + 1, y + 5, 7, 1, '#b8a070'); return;
    case 'wool': IR(x, y, 9, 8, '#f4f0e8'); IP(x + 2, y + 2, '#d8d0c0'); IP(x + 6, y + 4, '#d8d0c0'); return;
    case 'wood': for (let j = 0; j < 3; j++) { disc(IX, x + 2 + j * 4, y + 6, 2, '#7a5030'); IP(x + 2 + j * 4, y + 6, '#d8b07a'); } disc(IX, x + 4, y + 2, 2, '#7a5030'); disc(IX, x + 8, y + 2, 2, '#7a5030'); return;
    case 'ale': IR(x, y, 11, 12, '#7a4e2a'); IR(x, y + 3, 11, 1, '#3a3a3a'); IR(x, y + 8, 11, 1, '#3a3a3a'); IR(x + 1, y, 2, 12, '#9a6a3a'); return;
    case 'scrap': IR(x, y + 2, 10, 5, '#6a7078'); IR(x + 2, y, 3, 2, '#9aa0a8'); IP(x + 7, y + 1, '#3af0ff'); return;
    case 'veg': case 'apple': IR(x, y + 2, 10, 5, '#8a6440'); for (let j = 0; j < 3; j++) disc(IX, x + 2 + j * 3, y + 2, 1, k === 'apple' ? '#c83a2a' : j % 2 ? '#7ab04c' : '#e8742a'); return;
    case 'remedy': case 'honey': IR(x + 1, y, 5, 6, k === 'honey' ? '#e8a82a' : '#5a8a6a'); IR(x + 1, y, 5, 1, '#c8c0b0'); return;
    case 'herbs': case 'leaf': IR(x + 2, y, 2, 6, '#3f6b2f'); IR(x, y + 1, 6, 3, k === 'leaf' ? '#7a8a3a' : '#5a8a4a'); return;
    case 'cheese': IR(x, y + 2, 7, 4, '#f2c84a'); IR(x, y + 2, 7, 1, '#f8dc7a'); return;
    case 'egg': IR(x, y + 3, 7, 3, '#8a6440'); IP(x + 1, y + 2, '#f4f0e0'); IP(x + 3, y + 2, '#f4f0e0'); IP(x + 5, y + 2, '#f4f0e0'); return;
    case 'fish': IR(x, y + 2, 7, 3, '#8aa8c0'); IP(x + 6, y + 1, '#6a88a0'); return;
    case 'mush': IR(x + 1, y + 2, 5, 2, '#a8682a'); IR(x + 2, y + 4, 3, 2, '#f4ead0'); return;
    default: drawFood(k, x, y + 6, 0); // bread, pies, cakes
  }
}

// Where folk go inside a building, by what they're doing.
const BUILDING_SPOTS = {
  work_inn: 'bar', deliver: 'counter', work_odd: 'counter', work_mill: 'mill', work_bake: 'oven', work_brew: 'copper', work_herb: 'herbs', nurse: 'herbs',
  work_relay: 'console', jack_in: 'console', charge_up: 'charger', build: 'bench', work_wood: 'bench',
};
function buildingSpotFor(v, L, taken) {
  const id = v.task ? v.task.a.id : null;
  const free = (list) => list.find((s) => !taken.has(s));
  if (id === 'eat_inn' || id === 'ale' || id === 'eat_home') { const s = free(L.seats.filter((s) => s.kind === 'chair')); if (s) { taken.add(s); return { x: s.x, y: s.y, pose: 'sit', seat: s }; } }
  if (id === 'lodge' || id === 'sleep') { const bd = L.beds.find((x) => !taken.has(x)); if (bd) { taken.add(bd); return { x: bd.x + bd.w / 2, y: WALL_B, pose: 'bed', bed: bd }; } }
  const key = BUILDING_SPOTS[id] || (L.spots.counter && (id === 'market') ? 'counter' : null);
  const sp = key && (L.spots[key] || L.spots.counter || L.spots.bar);
  if (sp && !taken.has(sp)) { taken.add(sp); const face = key === 'bar' ? 'down' : 'up'; return { x: sp.x, y: sp.y, pose: key === 'bar' || key === 'counter' ? 'stand' : 'work', face }; }
  return { pose: 'wander' };
}

// ----- hooking the buildings into the cutaway -----
{
  const homeLayout = interiorLayout, homeKey = interiorKey, homePaint = paintStatic, homeSpot = spotFor, homeItem = drawItem, homeHead = updateInteriorHead, homeCaption = updateCaption, homeLive = drawLiveBits, homeOpen = openInterior;
  interiorLayout = (h) => (h.kind === 'home' ? homeLayout(h) : buildingLayout(h));
  interiorKey = (h) => (h.kind === 'home' ? homeKey(h) : [h.key, isRiftBuilding(h) ? 1 : 0, World.season, stockSig(STOCK_KEYS)].join('|'));
  spotFor = (v, L, taken) => (L.building ? buildingSpotFor(v, L, taken) : homeSpot(v, L, taken));
  drawItem = (L, it, part, t) => { if (L.building && ['bar', 'stock', 'millstone', 'ovens', 'kneading', 'copper', 'smokerack', 'console'].includes(it.t)) drawBuildingItem(L, it, part, t); else homeItem(L, it, part, t); };
  drawLiveBits = (L, t, dt) => {
    if (L.building) {
      const inside = L.h.inside.map((id) => Game.villagers.find((o) => o.id === id)).filter(Boolean);
      const doing = (k) => inside.some((o) => o.task && o.task.a.id === k && o.task.phase === 'do');
      Interior.milling = doing('work_mill'); Interior.baking = doing('work_bake') || doing('work_inn'); Interior.brewing = doing('work_brew');
      const ov = L.items.find((i) => i.t === 'ovens');
      if (ov && Interior.baking) for (let k = 0; k < 2; k++) { IR(ov.x + k * 26 + 6, WALL_B - 24, 13, 8, Math.sin(t * 6 + k) > 0 ? '#e8742a' : '#ffb04a'); }
      const cu = L.items.find((i) => i.t === 'copper');
      if (cu && Interior.brewing) for (let k = 0; k < 4; k++) { const ph = (t * 0.7 + k / 4) % 1; IX.globalAlpha = 0.6 * (1 - ph); IR(cu.x - 6 + k * 4 + Math.round(Math.sin(ph * 6 + k) * 2), WALL_B - 48 - Math.round(ph * 16), 2, 2, '#ffffff'); }
      IX.globalAlpha = 1;
    }
    homeLive(L, t, dt);
  };
  updateInteriorHead = () => {
    const h = Interior.home, L = Interior.L;
    if (!h || !L) return;
    if (!L.building) { homeHead(); return; }
    $('int-title').textContent = h.name;
    const inside = h.inside.map((id) => Game.villagers.find((o) => o.id === id)).filter(Boolean);
    $('int-sub').textContent = `${inside.length ? inside.length + ' inside' : 'Nobody in just now'} · ${ROOM_NAMES[L.rooms[0].kind]}${L.rooms.length > 1 ? ' and ' + L.rooms.slice(1).map((r) => ROOM_NAMES[r.kind].toLowerCase()).join(', ') : ''}`;
    const f = $('int-folk');
    const sig = 'b' + inside.map((v) => v.id + (Game.selected === v ? 's' : '')).join(',');
    if (f.dataset.sig === sig) return;
    f.dataset.sig = sig; f.innerHTML = '';
    for (const v of inside) {
      const b2 = document.createElement('button');
      b2.className = 'int-chip home' + (Game.selected === v ? ' sel' : '');
      b2.textContent = v.first; b2.title = v.activity();
      b2.addEventListener('click', () => { selectVillager(v); scrollToFolk(v); });
      f.appendChild(b2);
    }
  };
  updateCaption = () => {
    const L = Interior.L;
    if (!L || !L.building || (Interior.hover && (Interior.hover.v || Interior.hover.hs))) { homeCaption(); return; }
    const cap = $('int-cap'), text = 'Hover over things to look closer. Click someone to see what they\'re doing.';
    if (cap.textContent !== text) cap.textContent = text;
  };
  openInterior = (h) => { if (h && h.kind === 'building') { h.built = true; h.doorColor = h.doorColor || (isRiftBuilding(h) ? '#2a2f4e' : '#6a4426'); } homeOpen(h); };
}
// The building under a point on the map, if any.
function buildingAt(wx, wy) {
  for (const b of Object.values(World.buildings)) {
    if (!BUILDING_KIND[b.key] || !b.w) continue;
    if (wx >= b.left + 2 && wx <= b.left + b.w - 2 && wy >= b.bottom - b.h + 6 && wy <= b.bottom) return b;
  }
  return null;
}
