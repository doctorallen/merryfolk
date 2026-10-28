'use strict';
// Interiors: click a hobbit-hole to look inside. A cutaway of the smial,
// seen from deep in the hill looking out toward the round front door, drawn
// live in the same half-pixels as the folk themselves. The rooms are built
// from the household: a bed for everyone who lives there (a double for the
// married, a cradle for the baby), chairs round the kitchen table, the
// larder's actual stock on the pantry shelves, tools of their trades, and
// the hearth, cold if the woodpile's run out. Whoever's home is in there
// too, asleep, at table, baking, or puttering from room to room.

const Interior = {
  home: null, L: null, key: '', scale: 2, folk: new Map(), boxes: [], hover: null,
  smoke: [], t: 0, acc: 0, cv: null, cx: null, stat: null, light: null, bubbles: [], portraits: new Map(),
};
const IH = 128, CEIL = 30, WALL_B = 98, FLOOR_B = 112, PAD = 34, WT = 10, RC = 10;
const IWOOD = { o: '#2a1c12', d: '#4a2e1a', m: '#6e4628', l: '#8e6038', h: '#ae7c4a' };
const WALLS = ['#ead6ac', '#e6cf9e', '#efdcb6', '#e2cca6', '#ead2b4'];
const STUDY_JOBS = { tinker: 'tinker', herbalist: 'herbs', storyteller: 'books', postie: 'books' };
const JOB_PROPS = {
  fisher: 'rod', woodwright: 'axe', farmer: 'fork', grower: 'can', orchardist: 'basket', herder: 'crook',
  brewer: 'tankard', baker: 'pin', miller: 'sack', innkeeper: 'keys', postie: 'satchel',
};

let IX = null; // the context being drawn into
const IR = (x, y, w, h, c) => { IX.fillStyle = c; IX.fillRect(Math.round(x), Math.round(y), w, h); };
const IP = (x, y, c) => IR(x, y, 1, 1, c);

// ---------------------------------------------------------------------------
// Layout: rooms from the household
// ---------------------------------------------------------------------------
function interiorKey(h) {
  const res = residentsOf(h);
  return [h.id, h.neon ? 1 : 0, h.chilly ? 1 : 0, World.season, PANTRY_KINDS.map((k) => Math.min(12, h.pantry[k] || 0)).join('.'),
    res.map((v) => `${v.id}${v.stage[0]}${v.spouse ?? ''}${v.job || ''}${v.isRiftborn() ? 'r' : ''}${hobbyAge(v) ? hobbiesOf(v).join('+') : ''}${v.birds ? Math.min(30, v.birds) : ''}`).join(','),
    JSON.stringify(homeCrafts(h)), JSON.stringify(homeCollection(h))].join('|');
}

function interiorLayout(h) {
  const res = residentsOf(h);
  const vr = mulberry32(h.id * 4241 + 7);
  const neon = !!h.neon;
  // beds: a double for each couple, a cradle for each baby
  const beds = [], done = new Set();
  for (const v of res.slice().sort((a, b) => b.age - a.age)) {
    if (done.has(v.id)) continue;
    done.add(v.id);
    if (v.stage === 'baby') { beds.push({ kind: 'cradle', who: [v.id], w: 26 }); continue; }
    const sp = v.isGrown() && v.spouse != null && res.find((o) => o.id === v.spouse && !done.has(o.id));
    if (sp) { done.add(sp.id); beds.push({ kind: 'double', who: [v.id, sp.id], w: 46 }); continue; }
    beds.push({ kind: v.isChild() ? 'small' : 'single', who: [v.id], w: v.isChild() ? 26 : 32 });
  }
  if (!beds.length) beds.push({ kind: 'double', who: [], w: 46 });
  const grown = beds.filter((b) => b.kind === 'double' || b.kind === 'single');
  const kids = beds.filter((b) => b.kind === 'small' || b.kind === 'cradle');
  const bedrooms = [];
  for (let i = 0; i < grown.length; i += 2) bedrooms.push({ kind: 'bed', beds: grown.slice(i, i + 2) });
  for (let i = 0; i < kids.length; i += 3) bedrooms.push({ kind: 'nursery', beds: kids.slice(i, i + 3) });
  // a study for the bookish, the tinkering and the lost
  let study = null;
  for (const v of res) if (STUDY_JOBS[v.job]) { study = STUDY_JOBS[v.job]; break; }
  if (!study && (neon || res.some((v) => v.isRiftborn()))) study = 'tinker';
  if (!study && h.grand) study = 'books';
  const lost = res.some((v) => v.lost > 0.05);
  // Every hole was dug its own way, and always the same way for the same
  // hole: which side of the hall the parlor is, whether the pantry is
  // tucked between the hall and the kitchen or beyond it, whether the
  // bedrooms run down one passage or sit at both ends, which end the study
  // and the workshop are at, where the hearth is, how roomy each room is,
  // and how the furniture stands.
  const plan = {
    parlorLeft: vr() < 0.5, pantryFirst: vr() < 0.3, bedsSplit: vr() < 0.6, bedsEnd: vr() < 0.5 ? -1 : 1, studyEnd: vr() < 0.5 ? -1 : 1,
    hearthKitchen: !h.grand && vr() < 0.3, hallW: 56 + Math.floor(vr() * 3) * 8, parlorPad: Math.floor(vr() * 4) * 12, kitchenPad: Math.floor(vr() * 3) * 10,
    bedPad: Math.floor(vr() * 3) * 12, pantryW: 50 + Math.floor(vr() * 3) * 8, winFirst: Math.floor(vr() * 3),
    arr: Math.floor(vr() * 3), arrK: Math.floor(vr() * 2), arrB: Math.floor(vr() * 2), arrS: Math.floor(vr() * 2), drops: [0, 1, 2, 3, 4, 5, 6, 7].map(() => Math.floor(vr() * 3) * 3),
  };
  const core = plan.pantryFirst ? [{ kind: 'parlor' }, { kind: 'hall' }, { kind: 'pantry' }, { kind: 'kitchen' }] : [{ kind: 'parlor' }, { kind: 'hall' }, { kind: 'kitchen' }, { kind: 'pantry' }];
  if (!plan.parlorLeft) core.reverse();
  const left = [], right = [];
  bedrooms.forEach((b, i) => ((plan.bedsSplit ? (i % 2 ? -plan.bedsEnd : plan.bedsEnd) : plan.bedsEnd) < 0 ? left : right).push(b));
  const extras = [];
  if (study) extras.push({ kind: 'study', variant: study, lost });
  // hobby rooms: a workshop for the makers, a curio room for the collectors
  const makes = (k) => res.some((v) => hasHobby(v, k)) || (homeCrafts(h)[k] || 0) > 0;
  const workshop = ['carving', 'basketry', 'pottery', 'painting'].filter(makes);
  if (workshop.length) extras.push({ kind: 'workshop', crafts: workshop });
  if (res.some((v) => hasHobby(v, 'collecting') || hasHobby(v, 'birdwatching')) || collectionTotal(h) >= 4) extras.push({ kind: 'curio', birds: Math.max(0, ...res.map((v) => v.birds || 0)) });
  extras.forEach((r, i) => ((i % 2 ? -plan.studyEnd : plan.studyEnd) < 0 ? left : right).push(r));
  const rooms = left.slice().reverse().concat(core, right);
  const kitchenSeats = (rs) => clamp(rs.filter((v) => v.stage !== 'baby').length, 2, 4);
  const hallI = rooms.findIndex((r) => r.kind === 'hall');
  let x = PAD;
  rooms.forEach((r, i) => {
    r.side = i < hallI ? -1 : i > hallI ? 1 : 0;
    r.w = r.kind === 'hall' ? plan.hallW : r.kind === 'parlor' ? (h.grand ? 176 : 136) + plan.parlorPad : r.kind === 'kitchen' ? 96 + kitchenSeats(res) * 20 + 6 + plan.kitchenPad + (plan.hearthKitchen ? 14 : 0)
      : r.kind === 'pantry' ? plan.pantryW : r.kind === 'study' ? 90 + plan.arrS * 12 : r.kind === 'workshop' ? 56 + r.crafts.length * 22 : r.kind === 'curio' ? 84
      : Math.max(96, 30 + r.beds.reduce((s, b) => s + b.w, 0) + 14 * (r.beds.length - 1) + 26) + plan.bedPad;
    // some rooms are dug lower than others (the ones at the ends are low anyway, under the slope)
    r.drop = (r.kind === 'hall' || r.kind === 'parlor') ? Math.min(3, plan.drops[i % 8]) : plan.drops[i % 8];
    r.x0 = x; r.x1 = x + r.w; x = r.x1 + WT;
  });
  const IW = x - WT + PAD;
  const L = {
    h, IW, rooms, beds, res, neon, lost, hallI, vr, plan, seats: [], spots: {}, items: [], hot: [], wins: [], cradles: [],
    wall: neon ? '#1f2338' : shade(WALLS[h.id % WALLS.length], (h.v ? h.v.tint : 0) * 0.5),
    pal: neon ? { o: '#0a0b14', d: '#1a1d30', m: '#2c3150', l: '#3e456c', h: '#55608e' } : IWOOD,
  };
  L.crust = (px) => {
    const u = clamp((px - IW / 2) / (IW / 2 + 2), -1, 1);
    return Math.round(FLOOR_B - (FLOOR_B - 3) * Math.pow(1 - Math.pow(Math.abs(u), 3.2), 1 / 3.2));
  };
  L.top = (r, px) => {
    let t = Math.max(CEIL, L.crust(px) + 10) + (r.drop || 0);
    const dx = Math.min(px - r.x0, r.x1 - 1 - px);
    if (dx < RC) t += Math.round(RC - Math.sqrt(RC * RC - (RC - dx) * (RC - dx)));
    return t;
  };
  // windows: as many as the hole has from outside, in the rooms that face front (which first varies by hole)
  const want = Math.max(1, h.windows.length);
  const front = [rooms.find((r) => r.kind === 'parlor'), rooms.find((r) => r.kind === 'kitchen')], backs = rooms.filter((r) => r.kind === 'bed' || r.kind === 'nursery' || r.kind === 'study' || r.kind === 'workshop');
  const order = plan.winFirst === 1 ? [front[1], front[0], ...backs] : plan.winFirst === 2 && backs.length ? [backs[0], ...front, ...backs.slice(1)] : [...front, ...backs];
  let nw = 0;
  for (const r of order) if (nw < want) { r.win = true; nw++; }
  if (h.grand) rooms.find((r) => r.kind === 'parlor').win2 = true;
  for (const r of rooms) placeRoom(L, r);
  for (const r of rooms) {
    // a lantern in each room, clear of the windows
    const cx = Math.round((r.x0 + r.x1) / 2);
    r.lampX = r.kind === 'hall' ? r.x0 + 12 : r.kind === 'curio' ? r.x0 + 44 : L.wins.some((w) => w.room === r && Math.abs(w.x - cx) < 18) ? cx + (r.side < 0 ? 24 : -24) : cx;
    r.path = new Path2D();
    r.path.moveTo(r.x0, FLOOR_B + 3);
    for (let x = r.x0; x < r.x1; x++) { const t = L.top(r, x); r.path.lineTo(x, t); r.path.lineTo(x + 1, t); }
    r.path.lineTo(r.x1, FLOOR_B + 3); r.path.closePath();
  }
  return L;
}

// Furniture, seats and hotspots for one room.
function placeRoom(L, r) {
  const { h } = L;
  const cx = Math.round((r.x0 + r.x1) / 2);
  const add = (it) => { it.room = r; L.items.push(it); return it; };
  const seat = (s) => { s.room = r; L.seats.push(s); return s; };
  const hot = (x0, y0, x1, y1, text) => L.hot.push({ x0, y0, x1, y1, text });
  const win = (x, y = 54) => { if (L.top(r, x) < y - 16) { L.wins.push({ x, y, sq: !!(h.v && h.v.square), room: r }); return true; } return false; };
  const inner = (w) => (r.side < 0 ? r.x1 - w - 6 : r.x0 + 6); // tall things go on the side away from the hill's slope
  const outer = (w) => (r.side < 0 ? r.x0 + 6 : r.x1 - w - 6);
  if (r.kind === 'hall') {
    r.name = 'The front hall';
    L.door = { x: cx, y: 80, r: 16 };
    add({ t: 'pegs', x: r.x0 + 4 });
    add({ t: 'clock', x: r.x1 - 15 });
    add({ t: 'mat', x: cx });
    L.spots.hall = { x: cx + 12, y: 106 };
    hot(cx - 17, 62, cx + 17, 98, () => `The front door${h.doorAnim > 0 ? ', swinging open' : ''}. ${Game.darkness > 0.3 ? 'Bolted for the night, more or less.' : 'Round, green-painted inside, and never locked.'}`);
    hot(r.x1 - 16, 46, r.x1 - 3, 98, () => `The hall clock says ${hud2(Game.hour)}.`);
    hot(r.x0 + 2, 50, r.x0 + 22, 90, () => `Coats on the pegs: ${L.res.filter((v) => v.isGrown()).map((v) => v.first).join(', ') || 'none'}.`);
  } else if (r.kind === 'parlor') {
    r.name = 'The parlor';
    const { plan } = L, arr = plan.arr, hearth = !plan.hearthKitchen;
    const hx = cx + [0, -22, 22][arr], chairX = arr === 0 ? [hx - 36, hx + 36] : arr === 1 ? [hx + 34, hx + 58] : [hx - 58, hx - 34];
    if (hearth) { L.hearth = { x: hx, y: WALL_B }; add({ t: 'hearth', x: hx }); } else add({ t: 'lamp', x: hx });
    add({ t: 'rug', x: Math.round((chairX[0] + chairX[1]) / 2), w: arr ? 48 : 56 });
    chairX.forEach((x, k) => {
      const a = add({ t: 'arm', x, col: L.neon ? ['#ff3aa8', '#3af0ff'][k] : ['#8a3a2a', '#3a5a3a', '#4a4a7a', '#7a5a2a'][(h.id + k) % 4] });
      a.seat = seat({ kind: 'arm', x, y: 104, item: a });
    });
    const yarnX = arr === 2 ? chairX[0] - 16 : chairX[1] + 14;
    if (L.res.some((v) => hasHobby(v, 'knitting'))) { add({ t: 'yarn', x: yarnX }); hot(yarnX - 4, 92, yarnX + 10, 104, () => `A basket of wool and needles. ${homeCrafts(h).knitting || 0} knitted things so far.`); }
    if (h.grand) { add({ t: 'books', x: r.x0 + 6, w: 22 }); add({ t: 'books', x: r.x1 - 28, w: 22 }); }
    else if (plan.arrB) { add({ t: 'lamp', x: r.x0 + 10 }); add({ t: 'books', x: r.x1 - 20, w: 16 }); }
    else { add({ t: 'books', x: r.x0 + 6, w: 16 }); add({ t: 'lamp', x: r.x1 - 14 }); }
    const winX = arr === 1 ? hx - 30 : arr === 2 ? hx + 30 : hx - 36;
    if (r.win && !win(winX, 52)) r.win = false;
    if (r.win2) win(hx + 36, 52);
    // portraits: the family, and those gone before them
    const wallY = 40, slots = [hx - 36, hx + 36, hx].filter((x) => x > r.x0 + 14 && x < r.x1 - 14 && !L.wins.some((w) => Math.abs(w.x - x) < 14));
    const faces = portraitsFor(L);
    slots.forEach((x, i) => { if (faces[i]) add({ t: 'portrait', x, y: wallY + 6, who: faces[i] }); });
    hot(hx - 22, 50, hx + 22, 98, () => !hearth ? 'A lamp on a little table between the chairs; the fire\'s in the kitchen.' : h.chilly ? 'The hearth is cold. There\'s no timber in the Store for it.' : Interior.fire > 0.5 ? 'A good fire crackling in the grate.' : 'The fire is banked low, embers glowing.');
    for (const f of L.items.filter((i) => i.t === 'portrait' && i.room === r)) hot(f.x - 8, f.y - 9, f.x + 8, f.y + 10, () => f.who.archived ? `A faded likeness of ${f.who.first} ${f.who.surname || ''}, who ${f.who.reason === 'home' ? 'went home through a rift' : 'went off on a last adventure'}.` : `A portrait of ${f.who.first}.`);
  } else if (r.kind === 'kitchen') {
    r.name = 'The kitchen';
    const { plan } = L, mirrored = plan.arrK === 1;
    const n = clamp(L.res.filter((v) => v.stage !== 'baby').length, 2, 4);
    const tw = n * 20 + 6;
    const rangeX = mirrored ? r.x1 - 40 : r.x0 + 6, tx = mirrored ? r.x0 + (plan.hearthKitchen ? 54 : 44) : r.x0 + 50;
    add({ t: 'range', x: rangeX });
    L.spots.oven = { x: rangeX + 17, y: 104 };
    if (plan.hearthKitchen) {
      const hx = mirrored ? r.x0 + 24 : r.x1 - 26;
      L.hearth = { x: hx, y: WALL_B }; add({ t: 'hearth', x: hx });
      hot(hx - 22, 50, hx + 22, 98, () => h.chilly ? 'The hearth is cold. There\'s no timber in the Store for it.' : Interior.fire > 0.5 ? 'A good fire crackling in the kitchen grate.' : 'The kitchen fire is banked low, embers glowing.');
    } else add({ t: 'dresser', x: mirrored ? r.x0 + 6 : r.x1 - 36 });
    const tbl = add({ t: 'table', x: tx, w: tw, n });
    // diners sit up behind the table, facing out, with their plates in front of them
    for (let i = 0; i < n; i++) seat({ kind: 'chair', x: tx + 13 + i * 20, y: 90, item: tbl, i });
    if (r.win && !win(tx + tw / 2, 50)) r.win = false;
    if (!r.win) add({ t: 'rack', x: tx + tw / 2 });
    hot(rangeX, 70, rangeX + 34, 98, () => 'The kitchen range. ' + (Interior.baking ? 'Something is baking. It smells wonderful.' : 'Warm iron and a kettle.'));
    hot(tx, 84, tx + tw, 104, () => `Places laid for ${n}.`);
  } else if (r.kind === 'pantry') {
    r.name = 'The pantry';
    add({ t: 'pantry', x: r.x0 + 4, w: r.w - 8 });
    L.spots.pantry = { x: cx, y: 104 };
    hot(r.x0, 40, r.x1, 104, () => {
      const parts = PANTRY_KINDS.filter((k) => h.pantry[k]).map((k) => `${h.pantry[k]} ${FOOD_WORD[k] || k}`);
      return parts.length ? `The larder: ${parts.join(', ')} (${pantryTotal(h)} helpings).` : 'The larder is bare. Somebody had better fetch food from the market.';
    });
  } else if (r.kind === 'bed' || r.kind === 'nursery') {
    r.name = r.kind === 'nursery' ? 'The children\'s room' : r.beds.some((b) => b.kind === 'double') ? 'The bedroom' : 'A bedroom';
    const tallW = r.kind === 'nursery' ? 18 : 24;
    add({ t: r.kind === 'nursery' ? 'toys' : 'wardrobe', x: inner(tallW), w: tallW });
    let bx = r.side < 0 ? r.x0 + 10 : r.x0 + 12 + tallW + 6;
    if (r.side === 0) bx = r.x0 + 10;
    const bedList = L.plan.arrB && r.beds.length > 1 ? r.beds.slice().reverse() : r.beds;
    for (const b of bedList) {
      b.x = bx; b.room = r; bx += b.w + 14;
      add({ t: b.kind === 'cradle' ? 'cradle' : 'bed', x: b.x, bed: b });
      if (b.kind === 'cradle') L.cradles.push(b);
      const names = b.who.map((id) => (L.res.find((v) => v.id === id) || {}).first).filter(Boolean);
      hot(b.x, 70, b.x + b.w, 106, () => b.kind === 'cradle' ? `${names[0] || 'The'}'s cradle.` : names.length ? `${names.join(' and ')}'s bed.` : 'A bed, made up and waiting for someone to live here.');
    }
    if (r.beds.length && r.beds[0].kind !== 'cradle') add({ t: 'stand', x: r.beds[0].x + r.beds[0].w + 2 });
    add({ t: 'rug', x: cx, w: Math.min(60, r.w - 30) });
    if (r.win) { const wx = r.beds.length > 1 ? Math.round(r.beds[0].x + r.beds[0].w + 7) : cx; if (!win(wx, 48)) r.win = false; }
  } else if (r.kind === 'study') {
    r.name = r.variant === 'tinker' ? (L.neon ? 'The rig room' : 'The workroom') : r.variant === 'herbs' ? 'The stillroom' : 'The study';
    const flipS = L.plan.arrS === 1, dx = flipS ? r.x1 - 48 : r.x0 + 10;
    add({ t: r.variant === 'tinker' ? 'bench' : r.variant === 'herbs' ? 'herbtable' : 'desk', x: dx });
    L.spots.desk = seat({ kind: 'stool', x: dx + 20, y: 104 });
    add({ t: r.variant === 'herbs' ? 'jars' : 'books', x: flipS ? r.x0 + 6 : r.x1 - 30, w: 24 });
    if (r.lost) { add({ t: 'board', x: dx + 2 }); hot(dx, 38, dx + 38, 64, () => `Sketches of a city, a map of the rifts, red string everywhere. ${wayHomeWord()}`); }
    if (r.win && !win(flipS ? r.x0 + 50 : r.x1 - 50, 50)) r.win = false;
    hot(dx - 10, 66, dx + 40, 104, () => r.variant === 'tinker' ? (L.neon ? 'A humming bench of salvaged rift-tech, wired into the hill.' : 'A workbench of gears, springs and half-mended things.') : r.variant === 'herbs' ? 'Herbs drying, a mortar and pestle, jars of remedies.' : 'A writing desk heaped with letters and stories.');
  } else if (r.kind === 'workshop') {
    r.name = r.crafts.length === 1 && r.crafts[0] === 'painting' ? 'The studio' : 'The workshop';
    const C = homeCrafts(h);
    let x = r.x0 + 6;
    const makers = r.crafts.filter((k) => k !== 'painting');
    if (makers.length) {
      add({ t: 'workbench', x, carving: r.crafts.includes('carving') });
      L.spots.bench = { x: x + 22, y: 104 };
      hot(x, 50, x + 44, 104, () => `The workbench: chisels, knives and a vice${C.carving ? `. ${C.carving} carved animals so far` : ''}.`);
      add({ t: 'craftshelf', x: x + 2, w: 40, carvings: C.carving || 0, pots: C.pottery || 0 });
      x += 50;
    }
    if (r.crafts.includes('basketry')) { add({ t: 'baskets', x, n: Math.min(8, C.basketry || 0) }); hot(x, 80, x + 18, 104, () => `${C.basketry || 0} baskets, and a bundle of reeds soaking.`); x += 22; }
    if (r.crafts.includes('pottery')) { add({ t: 'wheel', x }); L.spots.wheel = { x: x + 10, y: 104 }; hot(x, 80, x + 20, 104, () => `The potter's wheel. ${C.pottery || 0} pots fired so far.`); x += 22; }
    if (r.crafts.includes('painting')) {
      add({ t: 'easel', x, n: Math.min(4, C.painting || 0), seed: h.id });
      L.spots.easel = { x: x + 8, y: 106 };
      hot(x, 50, x + 20, 104, () => `An easel, and ${C.painting || 0} finished paintings of the valley.`);
    }
    if (r.win && !win(r.x1 - 16, 46)) r.win = false;
  } else if (r.kind === 'curio') {
    r.name = 'The curio room';
    const Co = homeCollection(h);
    add({ t: 'cabinet', x: r.x0 + 6, col: Co });
    L.spots.cabinet = { x: r.x0 + 22, y: 106 };
    hot(r.x0 + 6, 46, r.x0 + 40, 104, () => {
      const parts = Object.keys(COLLECT_KINDS).filter((k) => Co[k]).map((k) => `${Co[k]} ${COLLECT_KINDS[k][Co[k] === 1 ? 0 : 1]}`);
      return parts.length ? `The cabinet of curiosities: ${parts.join(', ')}.` : 'An empty cabinet, waiting for treasures.';
    });
    add({ t: 'frames', x: r.x0 + 48, flowers: Co.flowers || 0, butterflies: Co.butterflies || 0, low: !r.birds });
    if (r.birds) { add({ t: 'birdchart', x: r.x0 + 46, n: r.birds }); hot(r.x0 + 44, 64, r.x0 + 78, 92, () => `A chart of the birds of the valley: ${r.birds} kinds spotted, each one sketched and named.`); }
  }
  // the trades of the household, hung on the wall
  if (r.kind === 'hall') {
    const props = [...new Set(L.res.map((v) => JOB_PROPS[v.job]).filter(Boolean))].slice(0, 3);
    props.forEach((p, i) => add({ t: 'prop', p, x: r.x0 + 28 + i * 10, y: 38 }));
  }
  for (const w of L.wins.filter((w) => w.room === r)) hot(w.x - 11, w.y - 11, w.x + 11, w.y + 11, () => windowWord());
  hot(r.x0, CEIL, r.x1, FLOOR_B, () => r.name + '.');
}
const FOOD_WORD = { bread: 'loaves', pie: 'pies', cake: 'cakes', veg: 'veg', fish: 'fish', mush: 'mushrooms', apple: 'apples', egg: 'eggs', cheese: 'cheeses' };
function hud2(hr) { const m = Math.floor((hr % 1) * 60); return `${Math.floor(hr)}:${String(m).padStart(2, '0')}`; }
function windowWord() {
  if (Game.darkness > 0.45) return Game.raining ? 'Rain on the glass, and the dark beyond.' : 'Stars over the garden.';
  if (Game.raining) return 'Rain running down the glass.';
  if (World.season === 'winter') return 'A snowy garden outside.';
  return 'Sunlight and the garden outside.';
}
function wayHomeWord() {
  const p = Village.wayHome || 0;
  return p >= 1 ? 'They found it.' : p > 0.5 ? 'They\'re close.' : p > 0.2 ? 'It\'s coming together.' : 'Early days.';
}
function portraitsFor(L) {
  const out = [], seen = new Set();
  for (const v of L.res) for (const pid of v.parents || []) {
    const a = Game.archive && Game.archive[pid];
    if (a && !seen.has(pid)) { seen.add(pid); out.push(a); }
  }
  for (const v of L.res.filter((v) => v.isGrown())) if (out.length < 4) out.push(v);
  return out;
}

// ---------------------------------------------------------------------------
// The static layer: hill, earth, rooms and the furniture behind folk
// ---------------------------------------------------------------------------
function paintStatic(L) {
  const [c, ctx] = makeCanvas(L.IW, IH);
  IX = ctx;
  const { IW, h } = L;
  const winter = World.season === 'winter';
  if (L.building) paintShell(L);
  else {
  // the hill: grass crust, earth, stones and roots
  for (let x = 0; x < IW; x++) {
    const y0 = L.crust(x);
    IR(x, y0, 1, IH - y0, '#6a4a30');
    for (let y = y0 + 4; y < IH; y += 3) { const n = hash2(x * 3 + h.id, y * 5); if (n < 0.12) IP(x, y, '#5a3c26'); else if (n > 0.95) IP(x, y, '#82603e'); }
    IR(x, y0, 1, 3, winter ? '#f4f8ff' : '#5c8f3e'); IP(x, y0 + 3, winter ? '#cad6e6' : '#3f6b2f');
    if (!winter && hash2(x, 7 + h.id) < 0.18) IP(x, y0 - 1, '#7ab04c');
    if (!winter && World.season !== 'autumn' && hash2(x, 91 + h.id) < 0.025) { IP(x, y0 - 2, ['#f2d24a', '#e04a5a', '#ffffff', '#c070e0'][Math.floor(hash2(x, 3) * 4)]); IP(x, y0 - 1, '#3f6b2f'); }
    if (World.season === 'autumn' && hash2(x, 13) < 0.08) IP(x, y0, ['#c8742a', '#a8481e', '#d8a03a'][Math.floor(hash2(x, 5) * 3)]);
  }
  for (let x = 0; x < IW; x++) { IR(x, FLOOR_B, 1, IH - FLOOR_B, '#5e4028'); if (L.crust(x) >= FLOOR_B - 1) { IR(x, FLOOR_B - 3, 1, 3, winter ? '#f4f8ff' : '#5c8f3e'); } }
  const sr = mulberry32(h.id * 31 + 5);
  for (let k = 0; k < IW / 14; k++) {
    const x = Math.floor(sr() * IW), y = FLOOR_B + 4 + Math.floor(sr() * 10);
    if (sr() < 0.6) { ellipseFill(IX, x, y, 3, 2, '#7a6a5a'); IP(x - 1, y - 1, '#9a8a78'); } else { for (let i = 0; i < 6; i++) IP(x + i, y + ((i * 7) % 3) - 1, '#4a3220'); }
  }
  for (let k = 0; k < IW / 30; k++) { const x = Math.floor(sr() * IW), y0 = L.crust(x) + 4; for (let i = 0; i < 5 + sr() * 7; i++) IP(x + ((i * 3) % 2), y0 + i, '#4a3220'); }
  if (L.neon) for (let x = 0; x < IW; x++) { IP(x, FLOOR_B + 6, x % 9 < 6 ? '#1a2a3a' : '#0d1a26'); if (x % 37 === 0) IP(x, FLOOR_B + 6, '#3af0ff'); }
  // the chimney rising through the hill
  if (L.hearth) {
    const x = L.hearth.x, top = L.crust(x) - 14;
    for (let y = top; y < CEIL + 8; y++) IR(x - 6, y, 13, 1, (y % 4 === 0) ? '#6a4a3c' : '#8a5e4a');
    for (let y = top; y < CEIL + 8; y += 4) for (let k = 0; k < 3; k++) IP(x - 5 + k * 4 + ((y >> 2) % 2) * 2, y + 1, '#9a6a54');
    IR(x - 8, top - 3, 17, 4, '#4a3a2a'); IR(x - 8, top - 3, 17, 1, '#6a5a4a');
    if (winter) IR(x - 8, top - 5, 17, 2, '#f4f8ff');
    L.chimTop = { x, y: top - 4 };
  }
  }
  for (const r of L.rooms) paintRoom(L, r);
  // the gaps between rooms: a passage arch in each dividing wall
  for (let i = 0; i < L.rooms.length - 1; i++) {
    const a = L.rooms[i], x0 = a.x1, x1 = a.x1 + WT;
    const archTop = 62;
    for (let x = x0; x < x1; x++) {
      const dx = Math.min(x - x0, x1 - 1 - x);
      IR(x, archTop + (dx < 2 ? 2 - dx : 0), 1, WALL_B - archTop, shade(L.wall, -0.32));
      IR(x, WALL_B, 1, FLOOR_B - WALL_B, floorCol(L, a, x, WALL_B + 4));
    }
    IR(x0, archTop, 1, WALL_B - archTop, L.pal.d); IR(x1 - 1, archTop, 1, WALL_B - archTop, L.pal.d);
    IR(x0, archTop - 1, WT, 1, L.pal.m);
  }
  // window frames, with the glass cut out so the sky shows through
  for (const w of L.wins) {
    const fc = L.neon ? '#3af0ff' : (h.v && h.v.frameCol) || '#4a2e1a';
    if (w.sq) { IR(w.x - 11, w.y - 11, 23, 23, fc); IR(w.x - 12, w.y + 12, 25, 3, L.pal.l); }
    else { disc(IX, w.x, w.y, 11, fc); IR(w.x - 12, w.y + 10, 25, 3, L.pal.l); }
    IR(w.x - 12, w.y + 13, 25, 1, L.pal.d);
    // a pot plant on the sill
    if (!(h.v && h.v.boxes === false)) { IR(w.x + 5, w.y + 6, 5, 4, '#a85a3a'); IP(w.x + 6, w.y + 3, '#3f6b2f'); IP(w.x + 7, w.y + 2, '#5c8f3e'); IP(w.x + 8, w.y + 4, '#3f6b2f'); IP(w.x + 7, w.y + 1, L.neon ? '#ff3aa8' : '#e04a5a'); }
    IX.globalCompositeOperation = 'destination-out';
    if (w.sq) IR(w.x - 9, w.y - 9, 19, 19, '#000'); else disc(IX, w.x, w.y, 9, '#000');
    IX.globalCompositeOperation = 'source-over';
    IR(w.x, w.y - 9, 1, 19, fc); IR(w.x - 9, w.y, 19, 1, fc);
  }
  // the front door's frame (the door itself swings, so it's drawn live)
  if (L.door) {
    const d = L.door;
    disc(IX, d.x, d.y, d.r + 3, L.pal.d); IR(d.x - d.r - 3, d.y, (d.r + 3) * 2 + 1, WALL_B - d.y, L.pal.d);
    disc(IX, d.x, d.y, d.r + 2, L.pal.l); IR(d.x - d.r - 2, d.y, (d.r + 2) * 2 + 1, WALL_B - d.y, L.pal.l);
    IX.globalCompositeOperation = 'destination-out';
    disc(IX, d.x, d.y, d.r, '#000'); IR(d.x - d.r, d.y, d.r * 2 + 1, WALL_B - d.y, '#000');
    IX.globalCompositeOperation = 'source-over';
  }
  for (const it of L.items) { IX.save(); IX.clip(it.room.path); drawItem(L, it, 'back'); IX.restore(); }
  // the cut edge of each room: a timber rib round the arch
  for (const r of L.rooms) for (let x = r.x0 - 2; x < r.x1 + 2; x++) {
    const xx = clamp(x, r.x0, r.x1 - 1), t = L.top(r, xx);
    IR(x, t - 2, 1, 2, x < r.x0 || x >= r.x1 ? L.pal.d : L.pal.m);
    if (x < r.x0 || x >= r.x1) IR(x, t, 1, FLOOR_B - t, L.pal.d);
  }
  for (const r of L.rooms) { IR(r.x0 - 2, FLOOR_B, r.w + 4, 3, L.pal.d); IR(r.x0 - 2, FLOOR_B, r.w + 4, 1, L.pal.l); }
  // the hill outline for the night shade, and the rooms' outline for lamps
  L.hillPath = new Path2D();
  L.hillPath.moveTo(0, IH);
  for (let x = 0; x <= IW; x++) L.hillPath.lineTo(x, Math.min(L.crust(x), FLOOR_B - 3));
  L.hillPath.lineTo(IW, IH); L.hillPath.closePath();
  return c;
}

function floorCol(L, r, x, y) {
  if (L.neon) return (x + y) % 8 < 1 ? '#2a2f4e' : y % 4 === 0 ? '#181b2b' : '#20243a';
  if (r.kind === 'kitchen' || r.kind === 'pantry') { const f = ((Math.floor(x / 8) + Math.floor((y - WALL_B) / 5)) % 2); return (x % 8 === 0 || (y - WALL_B) % 5 === 0) ? '#6a5a4a' : f ? '#a89480' : '#9a8672'; }
  if (r.kind === 'hall') { const f = ((Math.floor(x / 6) + Math.floor((y - WALL_B) / 4)) % 2); return f ? '#a8583a' : '#8a4a30'; }
  const row = Math.floor((y - WALL_B) / 3), joint = (x + row * 17) % 29 === 0;
  return joint ? '#4a2e1a' : (y - WALL_B) % 3 === 0 ? '#6e4628' : row % 2 ? '#8e6038' : '#845a34';
}

function paintRoom(L, r) {
  const wall = L.wall, wd = shade(wall, -0.1), wl = shade(wall, 0.06);
  for (let x = r.x0; x < r.x1; x++) {
    const t = L.top(r, x);
    IR(x, t, 1, WALL_B - t, wall);
    IR(x, t, 1, 3, shade(wall, -0.2)); IR(x, t + 3, 1, 2, wd);
    for (let y = t + 6; y < WALL_B - 22; y += 2) if (hash2(x * 7 + r.x0, y * 3) < 0.05) IP(x, y, hash2(x, y) < 0.5 ? wd : wl);
    // wainscot paneling
    const p = L.pal;
    IR(x, WALL_B - 22, 1, 22, (x - r.x0) % 14 === 0 ? p.d : (x - r.x0) % 14 === 1 ? p.l : p.m);
    IP(x, WALL_B - 22, p.h); IP(x, WALL_B - 21, p.d); IP(x, WALL_B - 1, p.d);
    for (let y = WALL_B; y < FLOOR_B; y++) IP(x, y, floorCol(L, r, x, y));
    if (L.neon) { IP(x, t + 5, (x >> 1) % 2 ? '#3af0ff' : '#2ad0e0'); IP(x, WALL_B - 23, '#ff3aa8'); }
  }
}

// ---------------------------------------------------------------------------
// Furniture. 'back' parts go in the static layer; 'front' parts are drawn
// live over whoever is sitting or lying in them.
// ---------------------------------------------------------------------------
function drawItem(L, it, part, t = 0) {
  const p = L.pal, b = WALL_B;
  const x = it.x;
  switch (it.t) {
    case 'hearth': {
      if (part !== 'back') return;
      const st = L.neon ? ['#2a2f4e', '#3a4068', '#1a1d30'] : ['#8a8078', '#a49a90', '#6a625a'];
      // chimney breast
      IR(x - 15, CEIL, 31, b - 44 - CEIL, st[2]); IR(x - 14, CEIL, 29, b - 44 - CEIL, st[0]);
      for (let y = CEIL + 2; y < b - 44; y += 5) for (let k = 0; k < 4; k++) { const bx = x - 14 + k * 8 + (Math.floor(y / 5) % 2) * 4; IR(bx, y, Math.max(0, Math.min(6, x + 15 - bx)), 1, st[2]); }
      // painting or screen over the mantel
      if (L.neon) { IR(x - 10, 38, 21, 13, '#07080e'); IR(x - 9, 39, 19, 11, '#0d2a3a'); for (let y = 40; y < 50; y += 2) IR(x - 8, y, 17, 1, '#155a6a'); }
      else { IR(x - 10, 38, 21, 13, '#b8902a'); IR(x - 9, 39, 19, 11, '#9fd4f2'); IR(x - 9, 45, 19, 5, '#5c8f3e'); ellipseFill(IX, x - 3, 46, 6, 3, '#7ab04c'); disc(IX, x + 4, 42, 1, '#fff2a0'); }
      // surround and mantel
      IR(x - 22, b - 44, 45, 44, st[2]); IR(x - 21, b - 43, 43, 43, st[0]);
      for (let y = b - 40; y < b; y += 6) for (let k = 0; k < 5; k++) { const bx = x - 21 + k * 10 + (Math.floor(y / 6) % 2) * 5; IR(bx, y, Math.max(0, Math.min(8, x + 22 - bx)), 1, st[1]); }
      IR(x - 25, b - 46, 51, 4, p.m); IR(x - 25, b - 46, 51, 1, p.h); IR(x - 25, b - 43, 51, 1, p.d);
      // mantel things: a clock, candlesticks, a pipe
      IR(x - 4, b - 54, 9, 8, p.d); disc(IX, x, b - 51, 3, '#f4f0e0'); IP(x, b - 52, '#2a1c12'); IP(x + 1, b - 51, '#2a1c12');
      IR(x - 19, b - 52, 2, 6, '#e8e0c8'); IR(x + 18, b - 52, 2, 6, '#e8e0c8'); IR(x - 20, b - 47, 4, 1, '#b8902a'); IR(x + 17, b - 47, 4, 1, '#b8902a');
      IR(x + 9, b - 48, 5, 2, '#5a3a22'); IP(x + 13, b - 49, '#5a3a22');
      // the firebox
      IR(x - 13, b - 26, 27, 26, '#1a120c'); IR(x - 13, b - 26, 27, 2, st[2]);
      for (let k = 0; k < 4; k++) IR(x - 12 + k * 7, b - 4, 5, 3, '#3a2a1e');
      return;
    }
    case 'arm': {
      const col = it.col, cd = shade(col, -0.3), cl = shade(col, 0.18);
      if (part === 'back') {
        IR(x - 11, b - 28, 23, 20, cd); IR(x - 10, b - 30, 21, 2, cd); IR(x - 10, b - 29, 21, 19, col);
        for (let k = -6; k <= 6; k += 6) { IP(x + k, b - 22, cd); IP(x + k, b - 15, cd); }
        IR(x - 9, b - 29, 19, 1, cl);
        IR(x - 10, b - 10, 21, 5, cl); IR(x - 10, b - 6, 21, 1, cd);
        IR(x - 10, b - 4, 2, 4, p.d); IR(x + 9, b - 4, 2, 4, p.d);
      } else {
        for (const s of [-1, 1]) { const ax = s < 0 ? x - 14 : x + 10; IR(ax, b - 16, 5, 12, cd); IR(ax, b - 17, 5, 2, col); IR(ax, b - 18, 5, 1, cl); IR(ax + (s < 0 ? 0 : 4), b - 16, 1, 12, shade(col, -0.45)); }
      }
      return;
    }
    case 'rug': {
      if (part !== 'back') return;
      const w = it.w, cols = L.neon ? ['#2a1f44', '#ff3aa8', '#3af0ff'] : ['#8a3a2a', '#c9a227', '#3f6b2f'];
      ellipseFill(IX, x, 106, w / 2, 4, cols[0]); ellipseFill(IX, x, 106, w / 2 - 3, 3, cols[1]); ellipseFill(IX, x, 106, w / 2 - 6, 2, cols[0]); IR(x - w / 4, 106, w / 2, 1, cols[2]);
      return;
    }
    case 'books': {
      if (part !== 'back') return;
      const w = it.w || 22, top = b - 50;
      IR(x, top, w, 50, p.d); IR(x + 1, top + 1, w - 2, 48, p.m);
      for (let s = 0; s < 4; s++) {
        const sy = top + 3 + s * 12;
        IR(x + 1, sy + 9, w - 2, 2, p.l);
        let bx = x + 2;
        const rr = mulberry32(x * 13 + s);
        while (bx < x + w - 3) {
          const bw = 2 + Math.floor(rr() * 2), bh = 6 + Math.floor(rr() * 3);
          const col = L.neon ? ['#3af0ff', '#ff3aa8', '#b45aff', '#2a2f4e'][Math.floor(rr() * 4)] : ['#8a3a2a', '#3a5a3a', '#4a4a7a', '#7a5a2a', '#a8742a', '#5a2a4a'][Math.floor(rr() * 6)];
          if (rr() < 0.12) { bx += 2; continue; }
          IR(bx, sy + 9 - bh, bw, bh, col); IP(bx, sy + 9 - bh + 1, shade(col, 0.3));
          bx += bw;
        }
      }
      return;
    }
    case 'lamp': {
      if (part !== 'back') return;
      IR(x - 5, b - 18, 11, 2, p.l); IR(x - 1, b - 16, 3, 16, p.d); IR(x - 4, b - 1, 9, 1, p.d);
      IR(x - 1, b - 26, 3, 8, '#b8902a');
      IR(x - 4, b - 31, 9, 6, L.neon ? '#3af0ff' : '#e8d4a0'); IR(x - 3, b - 32, 7, 1, L.neon ? '#3af0ff' : '#e8d4a0');
      IR(x + 3, b - 20, 3, 2, '#f4f0e8'); // a teacup
      return;
    }
    case 'portrait': {
      if (part !== 'back') return;
      const a = it.who, y = it.y;
      IR(x - 8, y - 9, 17, 19, '#b8902a'); IR(x - 7, y - 8, 15, 17, '#806020');
      IR(x - 6, y - 7, 13, 15, a.archived ? '#d8c8a0' : '#9fc4d8');
      const spr = portraitSprite(a);
      if (spr) {
        IX.save(); IX.beginPath(); IX.rect(x - 6, y - 7, 13, 15); IX.clip();
        IX.drawImage(spr, Math.round(x - spr.width / 2 + 0.5), y - 5);
        IX.restore();
      }
      IP(x, y - 11, '#5a3a22'); IP(x - 1, y - 10, '#5a3a22'); IP(x + 1, y - 10, '#5a3a22');
      return;
    }
    case 'range': {
      if (part !== 'back') return;
      const iron = '#2a2a30', il = '#4a4a54';
      IR(x + 13, CEIL, 7, b - 26 - CEIL, iron); IR(x + 14, CEIL, 2, b - 26 - CEIL, il);
      IR(x, b - 26, 34, 26, iron); IR(x + 1, b - 25, 32, 1, il);
      IR(x, b - 27, 34, 2, '#3a3a44');
      IR(x + 3, b - 20, 12, 12, '#1a1a1e'); IR(x + 4, b - 19, 10, 10, '#3a2a20'); IR(x + 16, b - 14, 2, 2, '#b8902a');
      IR(x + 20, b - 20, 11, 5, '#1a1a1e'); IR(x + 20, b - 12, 11, 8, '#1a1a1e'); IR(x + 21, b - 11, 9, 1, il);
      IR(x + 1, b - 3, 3, 3, iron); IR(x + 30, b - 3, 3, 3, iron);
      // a kettle and a pot on the stove
      IR(x + 3, b - 33, 9, 6, '#6a6a74'); IR(x + 4, b - 34, 7, 1, '#8a8a94'); IR(x + 11, b - 32, 3, 1, '#6a6a74'); IR(x + 6, b - 36, 3, 2, '#2a2a30');
      IR(x + 21, b - 32, 10, 5, '#5a3a2a'); IR(x + 20, b - 32, 12, 1, '#7a5a4a');
      return;
    }
    case 'dresser': {
      if (part !== 'back') return;
      const top = b - 48;
      IR(x, top, 30, 48, p.d); IR(x + 1, top + 1, 28, 24, shade(L.wall, -0.2));
      for (let s = 0; s < 2; s++) {
        const sy = top + 11 + s * 12;
        IR(x + 1, sy, 28, 2, p.l);
        for (let k = 0; k < 4; k++) { disc(IX, x + 5 + k * 7, sy - 4, 3, L.neon ? '#2a2f4e' : '#f4f0e8'); disc(IX, x + 5 + k * 7, sy - 4, 1, L.neon ? '#3af0ff' : ['#4a6aa8', '#a84a4a'][(k + s) % 2]); }
      }
      IR(x - 1, top + 25, 32, 3, p.l); IR(x - 1, top + 25, 32, 1, p.h);
      IR(x + 1, top + 28, 13, 19, p.m); IR(x + 16, top + 28, 13, 19, p.m); IP(x + 12, top + 37, '#b8902a'); IP(x + 17, top + 37, '#b8902a');
      for (let k = 0; k < 3; k++) { IR(x + 3 + k * 9, top - 4, 4, 4, '#c9a46a'); IP(x + 7 + k * 9, top - 3, '#c9a46a'); }
      return;
    }
    case 'table': {
      const w = it.w;
      if (part === 'back') {
        for (let i = 0; i < it.n; i++) { const cx = x + 13 + i * 20; IR(cx - 6, b - 28, 13, 3, p.m); IR(cx - 6, b - 28, 13, 1, p.h); for (let k = -5; k <= 5; k += 5) IR(cx + k, b - 25, 1, 10, p.d); }
        return;
      }
      const cloth = L.neon ? '#2a1f44' : '#f4ead0', check = L.neon ? '#ff3aa8' : '#c84a3a';
      IR(x - 2, b - 17, w + 4, 3, p.l); IR(x - 2, b - 17, w + 4, 1, p.h);
      IR(x, b - 15, w, 12, cloth);
      for (let k = 0; k < w; k += 4) { IR(x + k, b - 15, 2, 12, check); }
      for (let k = 0; k < 12; k += 3) IR(x, b - 15 + k, w, 1, shade(check, 0.25));
      for (let k = 1; k < w; k += 3) IP(x + k, b - 3, shade(cloth, -0.15));
      IR(x + 1, b - 3, 3, 3, p.d); IR(x + w - 4, b - 3, 3, 3, p.d);
      // plates, and a teapot in the middle
      for (let i = 0; i < it.n; i++) { const cx = x + 13 + i * 20; IR(cx - 3, b - 18, 7, 1, '#f4f0e8'); if (Interior.eating && Interior.eating.has(i)) { IR(cx - 2, b - 20, 5, 2, Interior.eating.get(i)); } }
      const tx = x + Math.round(w / 2);
      IR(tx - 3, b - 23, 7, 5, L.neon ? '#3af0ff' : '#4a6aa8'); IR(tx - 2, b - 24, 5, 1, L.neon ? '#3af0ff' : '#4a6aa8'); IP(tx, b - 25, '#2a1c12'); IR(tx + 4, b - 22, 2, 1, '#4a6aa8');
      return;
    }
    case 'rack': {
      if (part !== 'back') return;
      const y = CEIL + 10;
      IR(x - 18, y, 37, 2, p.d);
      IR(x - 14, CEIL, 1, 10, '#2a2a30'); IR(x + 14, CEIL, 1, 10, '#2a2a30');
      const pots = [['#8a5a3a', 5], ['#6a6a74', 4], ['#b87a3a', 6], ['#6a6a74', 3]];
      pots.forEach(([c, r], i) => { const px = x - 13 + i * 9; IR(px, y + 2, 1, 2, '#2a2a30'); disc(IX, px, y + 4 + r, r, c); IR(px - r, y + 4, r * 2 + 1, r, c); });
      for (let k = 0; k < 3; k++) { IR(x + 22 + k * 3, y - 2, 1, 8, '#5a7a3a'); IP(x + 22 + k * 3, y + 6, '#7a9a4a'); }
      return;
    }
    case 'pantry': {
      if (part !== 'back') return;
      drawPantry(L, it);
      return;
    }
    case 'pegs': {
      if (part !== 'back') return;
      IR(x, 56, 20, 3, p.m); IR(x, 56, 20, 1, p.h);
      const coats = L.res.filter((v) => v.isGrown()).slice(0, 3);
      coats.forEach((v, i) => {
        const cx = x + 4 + i * 6, ex = expressed(v.genes);
        IP(cx, 59, '#b8902a');
        const col = v.isRiftborn() ? '#1a1d30' : ex.vest;
        IR(cx - 2, 60, 5, 16, shade(col, -0.15)); IR(cx - 1, 60, 3, 18, col); IP(cx, 61, shade(col, 0.25));
      });
      // a walking stick and an umbrella
      IR(x + 22, 84, 4, 14, '#5a3a22'); IR(x + 22, 84, 4, 1, '#7a5030');
      IR(x + 23, 70, 1, 14, '#6e4628'); IP(x + 24, 70, '#6e4628');
      return;
    }
    case 'clock': {
      if (part !== 'back') return;
      IR(x, b - 52, 12, 52, p.d); IR(x + 1, b - 51, 10, 50, p.m);
      disc(IX, x + 6, b - 45, 4, '#f4f0e0'); IP(x + 6, b - 47, '#2a1c12'); IP(x + 6, b - 46, '#2a1c12'); IP(x + 7, b - 45, '#2a1c12');
      IR(x + 2, b - 38, 8, 26, '#2a1c12');
      IR(x - 1, b - 53, 14, 2, p.l);
      return;
    }
    case 'mat': {
      if (part !== 'back') return;
      // a coir doormat: a dark bound edge, a close weave in two tones, and a stripe along each end
      const [edge, w1, w2, st] = L.neon ? ['#1a1430', '#2a2048', '#342a58', '#ff3aa8'] : ['#6a4a22', '#b08a48', '#9c7838', '#7a5a2a'];
      IR(x - 13, 99, 27, 7, edge);
      for (let j = 0; j < 5; j++) for (let k = 0; k < 25; k++) IP(x - 12 + k, 100 + j, (k + j) % 2 ? w1 : w2);
      IR(x - 10, 100, 1, 5, st); IR(x + 9, 100, 1, 5, st);
      return;
    }
    case 'prop': {
      if (part !== 'back') return;
      drawProp(it.p, x, it.y);
      return;
    }
    case 'bed': {
      const bd = it.bed, w = bd.w, small = bd.kind === 'small';
      const hbH = small ? 22 : 28, top = b - hbH - 6;
      if (part === 'back') {
        IR(x, top, w, hbH, p.d); IR(x + 1, top + 1, w - 2, hbH - 1, p.m);
        IR(x + 1, top + 1, w - 2, 1, p.h);
        disc(IX, x + w / 2, top + 7, 4, p.l); disc(IX, x + w / 2, top + 7, 2, p.m);
        IR(x - 1, top - 2, 3, hbH + 8, p.d); IR(x + w - 2, top - 2, 3, hbH + 8, p.d); IP(x, top - 3, p.h); IP(x + w - 1, top - 3, p.h);
        // pillows
        const n = bd.kind === 'double' ? 2 : 1;
        for (let k = 0; k < n; k++) { const px = x + 3 + k * ((w - 6) / n); IR(px, b - 22, (w - 6) / n - 1, 6, '#f4f0e8'); IR(px, b - 17, (w - 6) / n - 1, 1, '#c8c0b0'); }
        return;
      }
      const res = bd.who.map((id) => L.res.find((v) => v.id === id)).filter(Boolean);
      const qc = res.length ? (L.neon ? '#2a1f44' : expressed(res[0].genes).vest) : (L.neon ? '#2a1f44' : '#8a5a7a');
      const q2 = L.neon ? '#3af0ff' : shade(qc, 0.3), q3 = L.neon ? '#ff3aa8' : mix(qc, '#f4ead0', 0.6);
      const qTop = b - 16;
      IR(x + 1, qTop - 1, w - 2, 2, '#f4f0e8');
      IR(x, qTop + 1, w, 11, qc);
      for (let yy = 0; yy < 11; yy += 4) for (let xx = (yy / 4) % 2 ? 0 : 4; xx < w; xx += 8) IR(x + xx, qTop + 1 + yy, 4, 4, (xx + yy) % 3 ? q2 : q3);
      if (Interior.sleepers && Interior.sleepers.has(bd)) for (const sx of Interior.sleepers.get(bd)) { IR(sx - 6, qTop + 1, 13, 2, shade(qc, 0.15)); }
      IR(x - 1, b - 6, w + 2, 6, p.d); IR(x, b - 5, w, 4, p.m); IR(x, b - 5, w, 1, p.h);
      IR(x - 1, b - 8, 3, 8, p.d); IR(x + w - 2, b - 8, 3, 8, p.d);
      return;
    }
    case 'cradle': {
      if (part === 'back') return;
      const bd = it.bed, w = bd.w;
      const rock = Interior.rocking && Interior.rocking.has(bd) ? Math.round(Math.sin(t * 2.5) * 1.5) : 0;
      const cx = x + w / 2 + rock;
      IR(cx - 12, b - 3, 25, 2, p.d); IP(cx - 12, b - 4, p.d); IP(cx + 12, b - 4, p.d);
      IR(cx - 10, b - 16, 21, 12, p.d); IR(cx - 9, b - 15, 19, 10, p.m);
      for (let k = -7; k <= 7; k += 3) IR(cx + k, b - 14, 1, 8, p.d);
      IR(cx - 10, b - 17, 21, 1, p.h);
      IR(cx - 11, b - 26, 6, 10, p.d); IR(cx - 10, b - 25, 4, 9, p.m);
      return;
    }
    case 'wardrobe': {
      if (part !== 'back') return;
      const w = it.w, top = b - 44;
      IR(x, top, w, 44, p.d); IR(x + 1, top + 1, w - 2, 42, p.m);
      IR(x + 2, top + 3, w / 2 - 3, 32, p.l); IR(x + w / 2 + 1, top + 3, w / 2 - 3, 32, p.l);
      IR(x + 3, top + 4, w / 2 - 5, 30, p.m); IR(x + w / 2 + 2, top + 4, w / 2 - 5, 30, p.m);
      IP(x + w / 2 - 2, top + 20, '#b8902a'); IP(x + w / 2 + 1, top + 20, '#b8902a');
      IR(x + 2, top + 37, w - 4, 4, p.l); IP(x + w / 2, top + 39, '#b8902a');
      IR(x - 1, top - 2, w + 2, 3, p.l);
      // a hatbox on top
      IR(x + 3, top - 7, 10, 5, '#8a4a5a'); IR(x + 3, top - 7, 10, 1, '#aa6a7a');
      return;
    }
    case 'toys': {
      if (part !== 'back') return;
      // a toy chest, a wooden horse and a ball
      IR(x, b - 12, 18, 12, p.d); IR(x + 1, b - 11, 16, 10, p.l); IR(x, b - 14, 18, 3, p.m); IP(x + 9, b - 9, '#b8902a');
      IR(x + 3, b - 22, 9, 4, '#c9a46a'); IR(x + 10, b - 26, 4, 6, '#c9a46a'); IP(x + 12, b - 25, '#2a1c12'); IR(x + 4, b - 18, 1, 4, '#8a6440'); IR(x + 10, b - 18, 1, 4, '#8a6440');
      disc(IX, x + 25, b + 4, 3, '#e04a5a'); IP(x + 24, b + 3, '#f8a0a0');
      return;
    }
    case 'stand': {
      if (part !== 'back') return;
      IR(x, b - 14, 10, 14, p.d); IR(x + 1, b - 13, 8, 5, p.m); IR(x + 1, b - 7, 8, 6, p.m); IP(x + 5, b - 10, '#b8902a');
      IR(x + 3, b - 18, 4, 4, '#f4f0e0'); IR(x + 2, b - 15, 6, 1, '#b8902a');
      return;
    }
    case 'desk': case 'bench': case 'herbtable': {
      if (part !== 'back') return;
      const w = 40;
      IR(x, b - 18, w, 3, p.l); IR(x, b - 18, w, 1, p.h); IR(x + 1, b - 15, 3, 15, p.d); IR(x + w - 4, b - 15, 3, 15, p.d);
      if (it.t === 'desk') {
        IR(x + 26, b - 15, 11, 12, p.m); IP(x + 31, b - 9, '#b8902a');
        IR(x + 4, b - 20, 12, 2, '#f4ead0'); IR(x + 6, b - 21, 9, 1, '#e8dcc0'); IR(x + 14, b - 25, 1, 5, '#e8e8f0');
        IR(x + 30, b - 22, 2, 4, '#e8e0c8'); IR(x + 29, b - 19, 4, 1, '#b8902a');
        for (let k = 0; k < 3; k++) IR(x + 19, b - 20 - k * 2, 7, 2, ['#8a3a2a', '#3a5a3a', '#4a4a7a'][k]);
      } else if (it.t === 'bench') {
        IR(x + 4, b - 22, 6, 4, '#4a4a54'); IR(x + 5, b - 24, 4, 2, '#6a6a74');
        disc(IX, x + 18, b - 21, 3, '#b8902a'); disc(IX, x + 18, b - 21, 1, '#6a5a20'); disc(IX, x + 25, b - 20, 2, '#a8a8b0');
        IR(x + 4, b - 46, 34, 20, p.d); IR(x + 5, b - 45, 32, 18, '#8a6a48');
        for (let yy = 0; yy < 18; yy += 3) for (let xx = 0; xx < 32; xx += 3) IP(x + 6 + xx, b - 44 + yy, '#5a4a30');
        IR(x + 8, b - 43, 1, 10, '#a8a8b0'); IR(x + 7, b - 43, 3, 2, '#6a6a74');
        IR(x + 14, b - 42, 2, 12, '#7a5030'); IR(x + 13, b - 42, 4, 3, '#6a6a74');
        IR(x + 21, b - 41, 6, 6, '#a8a8b0'); IR(x + 30, b - 43, 2, 11, '#c84a3a');
        if (L.neon) { IR(x + 24, b - 32, 14, 10, '#07080e'); IR(x + 25, b - 31, 12, 8, '#0d2a3a'); IR(x + 30, b - 22, 2, 4, '#2a2f4e'); }
      } else {
        IR(x + 4, b - 22, 7, 4, '#8a8078'); IR(x + 5, b - 23, 5, 1, '#a49a90'); IR(x + 9, b - 26, 1, 4, '#6a5a4a');
        for (let k = 0; k < 4; k++) { IR(x + 16 + k * 5, b - 23, 4, 5, ['#5a8a6a', '#8a5a7a', '#a88a3a', '#5a6a9a'][k]); IR(x + 16 + k * 5, b - 24, 4, 1, '#c8c0b0'); }
        IR(x, CEIL + 8, w, 1, '#5a3a22');
        for (let k = 0; k < 6; k++) { const hx = x + 3 + k * 7; IR(hx, CEIL + 9, 1, 3, '#5a3a22'); IR(hx - 1, CEIL + 12, 3, 7, ['#5a7a3a', '#7a8a4a', '#8a6a9a'][k % 3]); }
      }
      return;
    }
    case 'jars': {
      if (part !== 'back') return;
      IR(x, b - 44, 24, 44, p.d); IR(x + 1, b - 43, 22, 42, shade(L.wall, -0.2));
      for (let s = 0; s < 3; s++) { const sy = b - 32 + s * 12; IR(x + 1, sy, 22, 2, p.l); for (let k = 0; k < 4; k++) { IR(x + 2 + k * 5, sy - 6, 4, 6, ['#5a8a6a', '#8a5a7a', '#a88a3a', '#5a6a9a'][(k + s) % 4]); IR(x + 2 + k * 5, sy - 7, 4, 1, '#c8c0b0'); } }
      return;
    }
    case 'workbench': {
      if (part !== 'back') return;
      const w = 44;
      // a pegboard of tools
      IR(x + 2, b - 52, 40, 20, p.d); IR(x + 3, b - 51, 38, 18, '#a8865a');
      for (let yy = 0; yy < 18; yy += 4) for (let xx = 0; xx < 38; xx += 4) IP(x + 4 + xx, b - 50 + yy, '#7a5a3a');
      IR(x + 7, b - 49, 1, 12, '#7a5030'); IR(x + 6, b - 49, 3, 3, '#8a8a94');
      IR(x + 13, b - 48, 1, 10, '#7a5030'); IR(x + 13, b - 39, 2, 3, '#c8c8d0');
      IR(x + 19, b - 49, 7, 4, '#8a8a94'); IR(x + 22, b - 45, 1, 8, '#7a5030');
      IR(x + 30, b - 48, 8, 1, '#c8c8d0'); IR(x + 30, b - 47, 2, 6, '#7a5030');
      // the bench, a vice, and something half-made
      IR(x, b - 18, w, 3, p.l); IR(x, b - 18, w, 1, p.h); IR(x + 1, b - 15, 3, 15, p.d); IR(x + w - 4, b - 15, 3, 15, p.d); IR(x + 4, b - 6, w - 8, 2, p.m);
      IR(x + w - 10, b - 22, 6, 4, '#5a5a64'); IR(x + w - 9, b - 23, 4, 1, '#7a7a84');
      if (it.carving) { IR(x + 10, b - 23, 6, 5, '#c9a46a'); IR(x + 11, b - 25, 3, 2, '#c9a46a'); IP(x + 12, b - 24, '#2a1c12'); }
      for (let k = 0; k < 9; k++) IP(x + 6 + ((k * 13) % 32), b + 2 + (k % 3), '#d8b47a');
      return;
    }
    case 'craftshelf': {
      if (part !== 'back') return;
      const w = it.w;
      for (const sy of [b - 66, b - 58]) { IR(x, sy, w, 2, p.l); IR(x, sy + 2, w, 1, p.d); }
      // carvings on the upper shelf, pots on the lower
      const woods = ['#c9a46a', '#a8742a', '#8a5a3a', '#d8b47a'];
      for (let k = 0; k < Math.min(9, it.carvings); k++) { const cx2 = x + 2 + k * 4, c = woods[k % 4]; IR(cx2, b - 69, 3, 3, c); IP(cx2 + (k % 2 ? 2 : 0), b - 70, c); }
      const glaze = ['#5a7aa8', '#a85a3a', '#7a9a5a', '#c8b07a', '#8a5a8a'];
      for (let k = 0; k < Math.min(8, it.pots); k++) { const cx2 = x + 2 + k * 5, c = glaze[k % 5]; IR(cx2, b - 62, 4, 4, c); IR(cx2 + 1, b - 63, 2, 1, c); IP(cx2 + 1, b - 61, shade(c, 0.3)); }
      return;
    }
    case 'baskets': {
      if (part !== 'back') return;
      for (let k = 0; k < it.n; k++) {
        const bx = x + (k % 2) * 7 + (k >= 4 ? 3 : 0), by = b - 6 - Math.floor(k / 2) * 5;
        IR(bx, by, 10, 5, '#b88a4a'); for (let j = 0; j < 10; j += 2) IP(bx + j, by + 1 + (j % 4 ? 1 : 0), '#8a6230'); IR(bx, by, 10, 1, '#d8aa6a');
      }
      // a bundle of reeds
      for (let k = 0; k < 6; k++) IR(x + 14 + k, b - 26 + (k % 2) * 2, 1, 24, k % 2 ? '#a8a85a' : '#8a8a4a');
      return;
    }
    case 'wheel': {
      if (part !== 'back') return;
      IR(x + 3, b - 10, 14, 10, p.m); IR(x + 3, b - 10, 14, 1, p.h);
      IR(x, b - 12, 20, 2, '#6a6a74'); IR(x + 8, b - 16, 5, 4, '#a8684a'); IR(x + 9, b - 17, 3, 1, '#b8785a');
      IR(x + 15, b - 4, 7, 4, p.d); // the stool
      return;
    }
    case 'easel': {
      if (part !== 'back') return;
      IR(x + 2, b - 44, 1, 44, p.m); IR(x + 13, b - 44, 1, 44, p.m); IR(x + 7, b - 40, 1, 40, p.d);
      landscape(x, b - 42, 16, 12, it.seed);
      IR(x, b - 29, 16, 2, p.l);
      // finished canvases leaning on the wall, and one or two hung up
      for (let k = 0; k < it.n; k++) landscape(x + 18 + k * 2, b - 12 - k, 10, 12 - k, it.seed + k + 1);
      for (let k = 0; k < Math.min(2, it.n); k++) { IR(x - 1 + k * 16, b - 62, 16, 12, '#7a5030'); landscape(x + k * 16, b - 61, 14, 10, it.seed + 10 + k); }
      return;
    }
    case 'cabinet': {
      if (part !== 'back') return;
      const w = 34, C = it.col;
      IR(x, b - 54, w, 54, p.d); IR(x + 2, b - 52, w - 4, 46, shade(L.wall, -0.28));
      const rows = [['stones', '#8a8a84', '#b8b8b0'], ['shells', '#c8a878', '#e8d8b8'], ['feathers', '#5a7aa8', '#e8e8e0'], ['conkers', '#7a3a1a', '#a85a2a'], ['coins', '#c8a03a', '#f8e08a'], ['trinkets', '#3af0ff', '#ff3aa8']];
      rows.forEach(([k, c1, c2], i) => {
        const sy = b - 46 + i * 7;
        IR(x + 2, sy + 4, w - 4, 1, p.l);
        const n = Math.min(10, C[k] || 0);
        for (let j = 0; j < n; j++) { IR(x + 3 + j * 3, sy + 1, 2, 3, j % 2 ? c1 : c2); }
      });
      // the glass, catching the light
      IX.globalAlpha = 0.1; IR(x + 2, b - 52, w - 4, 46, '#e8f4ff'); IX.globalAlpha = 1;
      for (let k = 0; k < 10; k++) IP(x + 5 + k, b - 50 + k, 'rgba(255,255,255,0.5)');
      IR(x + w / 2 - 1, b - 52, 1, 46, p.d); IR(x, b - 6, w, 6, p.m); IP(x + w / 2 + 2, b - 30, '#b8902a');
      return;
    }
    case 'frames': {
      if (part !== 'back') return;
      const f = (fx, fy, kind, n) => {
        IR(fx, fy, 12, 12, '#6a4428'); IR(fx + 1, fy + 1, 10, 10, '#f4ead0');
        if (!n) return;
        if (kind === 'flowers') { IR(fx + 5, fy + 4, 1, 6, '#5c8f3e'); for (const [dx, dy, c] of [[4, 3, '#e04a5a'], [6, 3, '#e04a5a'], [5, 2, '#f2d24a'], [3, 6, '#5c8f3e']]) IP(fx + dx, fy + dy, c); }
        else { for (const [dx, dy] of [[3, 4], [4, 5], [7, 4], [6, 5], [3, 6], [7, 6]]) IP(fx + dx, fy + dy, '#e8742a'); IR(fx + 5, fy + 3, 1, 5, '#2a1c12'); }
      };
      const fy = it.low ? 64 : 54;
      f(x, fy, 'flowers', it.flowers); f(x + 15, fy, 'butterflies', it.butterflies);
      return;
    }
    case 'birdchart': {
      if (part !== 'back') return;
      IR(x - 2, 70, 34, 22, '#6a4428'); IR(x - 1, 71, 32, 20, '#f4ead0');
      for (let k = 0; k < Math.min(24, it.n); k++) { const bx = x + 1 + (k % 8) * 4, by = 73 + Math.floor(k / 8) * 6; IR(bx, by + 1, 3, 2, ['#8a5a3a', '#5a6a8a', '#c84a3a', '#6a6a5a'][k % 4]); IP(bx + 2, by, '#2a1c12'); }
      return;
    }
    case 'yarn': {
      if (part !== 'back') return;
      IR(x, b - 6, 10, 6, '#b88a4a'); IR(x, b - 6, 10, 1, '#d8aa6a');
      disc(IX, x + 3, b - 7, 2, '#c84a6a'); disc(IX, x + 7, b - 8, 2, '#5a8ac8'); IR(x + 5, b - 13, 1, 7, '#d8d8e0'); IR(x + 7, b - 12, 1, 6, '#d8d8e0');
      return;
    }
    case 'board': {
      if (part !== 'back') return;
      const y = 38;
      IR(x, y, 36, 24, '#8a6a48'); IR(x + 1, y + 1, 34, 22, '#b8925e');
      const notes = [[3, 3, '#f4ead0'], [14, 2, '#f4ead0'], [25, 4, '#9fd4f2'], [6, 13, '#f4ead0'], [19, 12, '#ffd23a'], [28, 14, '#f4ead0']];
      for (const [nx, ny, c] of notes) { IR(x + nx, y + ny, 7, 6, c); IP(x + nx + 3, y + ny, '#c84a3a'); IR(x + nx + 1, y + ny + 2, 4, 1, '#8a8a94'); }
      // a sketch of the city, and red string between everything
      IR(x + 26, y + 5, 1, 3, '#3a3a5a'); IR(x + 28, y + 4, 1, 4, '#3a3a5a'); IR(x + 30, y + 6, 1, 2, '#3a3a5a');
      IX.fillStyle = '#c84a3a';
      for (const [[ax, ay], [bx2, by]] of [[[6, 3], [17, 2]], [[17, 2], [28, 4]], [[17, 2], [22, 12]], [[9, 13], [22, 12]], [[22, 12], [31, 14]]]) {
        const n = Math.max(Math.abs(bx2 - ax), Math.abs(by - ay));
        for (let k = 0; k <= n; k++) IX.fillRect(Math.round(x + ax + (bx2 - ax) * k / n), Math.round(y + ay + (by - ay) * k / n), 1, 1);
      }
      return;
    }
  }
}

// A little landscape in a frame: sky, the Hill, and a hobbit-hole door.
function landscape(x, y, w, hh, seed) {
  const r = mulberry32(seed * 977 + 13);
  const sky = ['#9fd4f2', '#f2c89a', '#c8d8e8', '#b8a8d8'][Math.floor(r() * 4)];
  IR(x, y, w, hh, '#7a5030'); IR(x + 1, y + 1, w - 2, hh - 2, sky);
  const hz = y + 1 + Math.floor((hh - 2) * (0.45 + r() * 0.2));
  for (let k = 1; k < w - 1; k++) { const top = hz - Math.round(Math.sin((k / w) * Math.PI) * (2 + r() * 1.5)); IR(x + k, top, 1, y + hh - 1 - top, k % 3 ? '#5c8f3e' : '#4a7a32'); }
  if (r() < 0.6) { const dx = x + 2 + Math.floor(r() * (w - 6)); IP(dx, hz, '#c84a3a'); }
  if (r() < 0.5) IP(x + w - 4, y + 2, '#fff2a0');
}

// The tools of the household's trades, hung up in the hall.
function drawProp(p, ox, oy) {
  switch (p) {
    case 'rod': IR(ox, oy, 1, 20, '#8a6440'); IP(ox + 1, oy, '#c8c8d0'); for (let k = 0; k < 5; k++) IP(ox + 2, oy + 3 + k * 3, '#e8e8f0'); break;
    case 'axe': IR(ox, oy + 2, 1, 16, '#8a6440'); IR(ox - 3, oy + 2, 4, 4, '#a8a8b0'); IP(ox - 3, oy + 2, '#d8d8e0'); break;
    case 'fork': IR(ox, oy + 5, 1, 16, '#8a6440'); IR(ox - 2, oy + 3, 5, 1, '#8a8a94'); for (let k = -2; k <= 2; k += 2) IR(ox + k, oy, 1, 3, '#8a8a94'); break;
    case 'can': IR(ox - 3, oy + 8, 7, 6, '#6a8a6a'); IR(ox + 4, oy + 9, 3, 1, '#6a8a6a'); IR(ox - 2, oy + 6, 5, 2, '#4a6a4a'); break;
    case 'basket': IR(ox - 4, oy + 9, 9, 6, '#a8742a'); IR(ox - 3, oy + 5, 1, 4, '#a8742a'); IR(ox + 3, oy + 5, 1, 4, '#a8742a'); IR(ox - 2, oy + 4, 5, 1, '#a8742a'); IP(ox - 2, oy + 8, '#c84a3a'); IP(ox + 1, oy + 8, '#c84a3a'); break;
    case 'crook': IR(ox, oy + 4, 1, 18, '#8a6440'); IR(ox, oy, 4, 1, '#8a6440'); IR(ox + 3, oy, 1, 4, '#8a6440'); break;
    case 'tankard': for (let k = 0; k < 2; k++) { IR(ox - 3 + k * 5, oy + 10, 4, 5, '#c9a46a'); IP(ox + 1 + k * 5, oy + 11, '#c9a46a'); } break;
    case 'pin': IR(ox - 5, oy + 10, 11, 2, '#c9a46a'); IR(ox - 7, oy + 10, 2, 2, '#8a6440'); IR(ox + 6, oy + 10, 2, 2, '#8a6440'); break;
    case 'sack': IR(ox - 3, oy + 8, 7, 9, '#e8dcc0'); IR(ox - 2, oy + 7, 5, 1, '#c8bca0'); IP(ox, oy + 12, '#a89a80'); break;
    case 'keys': IR(ox, oy + 6, 1, 3, '#b8902a'); disc(IX, ox, oy + 10, 1, '#b8902a'); IR(ox + 2, oy + 9, 1, 4, '#b8902a'); break;
    case 'satchel': IR(ox - 4, oy + 8, 9, 7, '#8a5a3a'); IR(ox - 4, oy + 8, 9, 2, '#6a4026'); IR(ox - 3, oy + 2, 1, 6, '#6a4026'); IR(ox + 3, oy + 2, 1, 6, '#6a4026'); IR(ox - 2, oy + 11, 5, 1, '#f4ead0'); break;
  }
}

// The larder, stocked with what's really in it.
function drawPantry(L, it) {
  const { h, pal: p } = L;
  const x0 = it.x, w = it.w, b = WALL_B;
  const shelves = [b - 46, b - 32, b - 18];
  for (const sy of shelves) { IR(x0, sy, w, 2, p.l); IR(x0, sy, w, 1, p.h); IR(x0 + 2, sy + 2, 1, 2, p.d); IR(x0 + w - 3, sy + 2, 1, 2, p.d); }
  const stock = [];
  for (const k of PANTRY_KINDS) for (let i = 0; i < Math.min(h.pantry[k] || 0, 10); i++) stock.push(k);
  const DW = { bread: 8, pie: 8, cake: 7, veg: 5, fish: 9, mush: 4, apple: 4, egg: 3, cheese: 7 };
  let si = 0, cx = x0 + 3;
  for (const k of stock) {
    if (cx + DW[k] > x0 + w - 2) { si++; cx = x0 + 3; }
    if (si >= shelves.length) break;
    drawFood(k, cx, shelves[si], cx * 7 + si);
    cx += DW[k] + 1;
  }
  // a barrel and a sack on the floor, and jars that are always there
  IR(x0 + 2, b - 12, 11, 12, '#6e4628'); IR(x0 + 2, b - 10, 11, 1, '#3a3a40'); IR(x0 + 2, b - 4, 11, 1, '#3a3a40'); IR(x0 + 3, b - 12, 1, 12, '#8e6038');
  IR(x0 + w - 12, b - 10, 10, 10, '#d8c8a0'); IR(x0 + w - 11, b - 12, 8, 2, '#c8b890'); IP(x0 + w - 7, b - 6, '#a89a80');
  if (!stock.length) {
    // a bare larder: a cobweb and a hopeful mouse
    for (let k = 0; k < 6; k++) { IP(x0 + w - 2 - k, shelves[0] - 10 + k, '#e8e8f0'); IP(x0 + w - 2, shelves[0] - 10 + k, '#e8e8f0'); }
    IR(x0 + 18, b - 3, 4, 3, '#8a8a94'); IP(x0 + 22, b - 3, '#8a8a94'); IP(x0 + 17, b - 1, '#8a8a94'); IP(x0 + 21, b - 3, '#2a1c12');
  }
}
function drawFood(k, x, sy, s) {
  switch (k) {
    case 'bread': ellipseFill(IX, x + 4, sy - 3, 4, 2, '#b87a3a'); IR(x + 1, sy - 2, 7, 2, '#a8682a'); IP(x + 3, sy - 4, '#d8a060'); IP(x + 5, sy - 4, '#d8a060'); break;
    case 'pie': IR(x, sy - 3, 8, 3, '#d8a050'); IR(x + 1, sy - 4, 6, 1, '#e8b860'); IP(x + 2, sy - 3, '#a84a3a'); IP(x + 5, sy - 3, '#a84a3a'); IR(x - 1, sy - 1, 10, 1, '#c8c0b0'); break;
    case 'cake': IR(x, sy - 6, 7, 6, '#f4e0c0'); IR(x, sy - 4, 7, 1, '#e88aa0'); IR(x, sy - 6, 7, 1, '#ffffff'); IP(x + 3, sy - 7, '#e04a5a'); break;
    case 'veg': if (s % 2) { IR(x + 1, sy - 4, 3, 4, '#5c8f3e'); disc(IX, x + 2, sy - 2, 2, '#7ab04c'); } else { IR(x + 1, sy - 4, 3, 1, '#e8742a'); IR(x + 2, sy - 3, 2, 2, '#e8742a'); IP(x + 2, sy - 1, '#e8742a'); IP(x + 1, sy - 5, '#5c8f3e'); IP(x + 3, sy - 5, '#5c8f3e'); } break;
    case 'fish': IR(x, sy - 2, 7, 2, '#8aa8c0'); IR(x + 1, sy - 3, 5, 1, '#a8c8e0'); IP(x + 7, sy - 3, '#6a88a0'); IP(x + 7, sy - 1, '#6a88a0'); IP(x + 1, sy - 2, '#2a1c12'); break;
    case 'mush': IR(x, sy - 3, 4, 1, '#a8682a'); IR(x + 1, sy - 4, 2, 1, '#c8884a'); IR(x + 1, sy - 2, 2, 2, '#f4ead0'); break;
    case 'apple': IR(x, sy - 3, 4, 3, '#c83a2a'); IP(x + 1, sy - 3, '#f87a6a'); IP(x + 2, sy - 4, '#5a3a22'); break;
    case 'egg': IR(x, sy - 3, 3, 3, '#f4f0e0'); IP(x + 1, sy - 4, '#f4f0e0'); IP(x, sy - 3, '#ffffff'); break;
    case 'cheese': IR(x, sy - 4, 7, 4, '#f2c84a'); IR(x, sy - 4, 7, 1, '#f8dc7a'); IP(x + 2, sy - 2, '#d8a83a'); IP(x + 5, sy - 3, '#d8a83a'); break;
  }
}

function portraitSprite(a) {
  let s = Interior.portraits.get(a.id);
  if (s === undefined) {
    try {
      const hi = buildVillagerSprites(a.genes, a.stage === 'baby' ? 'child' : a.stage, a.look || {}).down.stand, sp = hi.lo || hi;
      if (a.archived) {
        const [c, cx] = makeCanvas(sp.width, sp.height);
        cx.drawImage(sp, 0, 0);
        const img = cx.getImageData(0, 0, c.width, c.height), d = img.data;
        for (let i = 0; i < d.length; i += 4) { const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; d[i] = l * 1.07 + 20; d[i + 1] = l * 0.95 + 8; d[i + 2] = l * 0.75; }
        cx.putImageData(img, 0, 0);
        s = c;
      } else s = sp;
    } catch (e) { s = null; }
    Interior.portraits.set(a.id, s);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Where each person inside is, and what they're doing
// ---------------------------------------------------------------------------
const SIT_TASKS = new Set(['eat_home', 'eat_item', 'ale_item']);
const ARM_TASKS = new Set(['tea', 'read', 'read_item', 'smoke', 'leaf_item', 'nap', 'remedy_item', 'hobby_knitting']);
function spotFor(v, L, taken) {
  const id = v.task ? v.task.a.id : null;
  const free = (list) => list.find((s) => !taken.has(s));
  const sitAt = (s) => { taken.add(s); return { x: s.x, y: s.y, pose: 'sit', seat: s }; };
  if (v.stage === 'baby') {
    const cr = L.cradles.find((b) => b.who.includes(v.id));
    if (cr && (id === 'cradle' || id === 'sleep' || !id)) return { x: cr.x + cr.w / 2, y: WALL_B, pose: 'cradle', bed: cr };
    return { x: (L.rooms.find((r) => r.kind === 'parlor').x0 + 30), y: 108, pose: 'crawl' };
  }
  if (id === 'sleep' || (v.isSick() && id === 'nap')) {
    const bed = L.beds.find((b) => b.kind !== 'cradle' && b.who.includes(v.id));
    if (bed) { const slot = bed.kind === 'double' ? bed.who.indexOf(v.id) : 0; return { x: bed.x + (bed.kind === 'double' ? 12 + slot * 22 : bed.w / 2), y: WALL_B, pose: 'bed', bed }; }
    const s = free(L.seats.filter((s) => s.kind === 'arm'));
    if (s) return { ...sitAt(s), asleep: true };
  }
  if (SIT_TASKS.has(id)) { const s = free(L.seats.filter((s) => s.kind === 'chair')); if (s) return sitAt(s); }
  if (ARM_TASKS.has(id)) { const s = free(L.seats.filter((s) => s.kind === 'arm')) || free(L.seats.filter((s) => s.kind === 'chair')); if (s) return sitAt(s); }
  if ((id === 'seek_home' || id === 'rift_lost' || id === 'school') && L.spots.desk && !taken.has(L.spots.desk)) return sitAt(L.spots.desk);
  if (id === 'bake_home' && L.spots.oven) return { x: L.spots.oven.x, y: 104, pose: 'work', face: 'up' };
  // hobbies at home: at the bench, the wheel, the easel or the cabinet
  if ((id === 'hobby_carving' || id === 'hobby_basketry') && L.spots.bench) return { x: L.spots.bench.x, y: 104, pose: 'work', face: 'up' };
  if (id === 'hobby_pottery' && (L.spots.wheel || L.spots.bench)) { const s = L.spots.wheel || L.spots.bench; return { x: s.x, y: 104, pose: 'work', face: 'up' }; }
  if (id === 'hobby_painting' && L.spots.easel) return { x: L.spots.easel.x, y: 106, pose: 'work', face: 'up' };
  if (id === 'hobby_collecting' && L.spots.cabinet) return { x: L.spots.cabinet.x, y: 106, pose: 'stand', face: 'up' };
  if (id === 'bedtime_story') { const k = L.res.find((o) => o.isChild()); const bed = k && L.beds.find((b) => b.who.includes(k.id)); if (bed) return { x: bed.x + bed.w + 6, y: 106, pose: 'stand', face: 'left' }; }
  if (id === 'tend_baby' && L.cradles.length) { const c = L.cradles[0]; return { x: c.x + c.w + 6, y: 106, pose: 'stand', face: 'left' }; }
  if (id === 'nurse') { const pt = v.task.target && v.task.target.patient; const bed = pt && L.beds.find((b) => b.who.includes(pt.id)); if (bed) return { x: bed.x + bed.w + 6, y: 106, pose: 'stand', face: 'left' }; }
  if (id === 'deliver' && L.spots.hall) return { x: L.spots.hall.x, y: 106, pose: 'stand', face: 'up' };
  return { pose: 'wander' };
}

function updateFolk(L, dt) {
  const h = L.h, byId = new Map(Game.villagers.map((v) => [v.id, v]));
  const inside = h.inside.map((id) => byId.get(id)).filter((v) => v && !v.carried && !v.heldBy);
  const taken = new Set();
  const seen = new Set();
  const sp = SPEEDS[Game.speedIdx];
  const step = sp > 0 ? dt * 18 * Math.min(sp, 3) : 0;
  Interior.sleepers = new Map(); Interior.rocking = new Set(); Interior.eating = new Map(); Interior.baking = false;
  for (const v of inside) {
    seen.add(v.id);
    let st = Interior.folk.get(v.id);
    const target = spotFor(v, L, taken);
    if (!st) {
      // newcomers walk in from the front door; those already home when you look are where they belong
      const atDoor = h.doorAnim > 0 && L.door && !Interior.justOpened && sp > 0;
      st = { x: atDoor ? L.door.x : target.x ?? randFloor(L), y: atDoor ? 107 : target.y || 107, dist: 0, wait: 0, wx: null, face: 'down', flip: false };
      Interior.folk.set(v.id, st);
    }
    st.target = target;
    if (target.pose === 'wander') {
      if (st.wx == null || (Math.abs(st.x - st.wx) < 1 && (st.wait -= dt * Math.max(sp, 0)) <= 0)) { st.wx = randFloor(L); st.wait = R.f(1.5, 5); st.browse = Math.random() < 0.35; }
      target.x = st.wx; target.y = 107;
    }
    if (sp === 0 && target.pose !== 'wander') st.x = target.x;
    const dx = target.x - st.x;
    if (Math.abs(dx) > 0.6) {
      const m = Math.sign(dx) * Math.min(Math.abs(dx), step);
      st.x += m; st.dist += Math.abs(m); st.walking = step > 0; st.flip = dx < 0;
    } else { st.x = target.x; st.walking = false; }
    st.y += ((st.walking ? 107 : (target.y || 107)) - st.y) * Math.min(1, dt * 6);
    // furniture reacts to who is in it
    if (!st.walking) {
      if (target.pose === 'bed') { const a = Interior.sleepers.get(target.bed) || []; a.push(target.x); Interior.sleepers.set(target.bed, a); }
      if (target.pose === 'cradle') Interior.rocking.add(target.bed);
      if (target.seat && target.seat.kind === 'chair' && target.seat.i != null) Interior.eating.set(target.seat.i, ['#b87a3a', '#d8a050', '#e8742a', '#8aa8c0'][v.id % 4]);
      if (target.pose === 'work' && v.task && v.task.a.id === 'bake_home') Interior.baking = true;
    }
  }
  // whoever has just gone out walks across to the front door and out of it,
  // rather than vanishing from where they stood
  const leavers = [];
  for (const id of [...Interior.folk.keys()]) {
    if (seen.has(id)) continue;
    const st = Interior.folk.get(id), v = byId.get(id);
    if (!v || v.heldBy || v.carried || !L.door || Interior.justOpened) { Interior.folk.delete(id); continue; }
    if (!st.leaving) { st.leaving = true; st.target = { x: L.door.x, y: 107, pose: 'leave' }; }
    const dx = L.door.x - st.x;
    if (Math.abs(dx) < 1.5) { Interior.folk.delete(id); continue; }
    const m = Math.sign(dx) * Math.min(Math.abs(dx), dt * 30 * clamp(sp, 1, 3));
    st.x += m; st.dist += Math.abs(m); st.walking = true; st.flip = dx < 0;
    st.y += (107 - st.y) * Math.min(1, dt * 6);
    leavers.push(v);
  }
  Interior.justOpened = false;
  return inside.concat(leavers);
}
function randFloor(L) {
  const r = L.rooms[Math.floor(Math.random() * L.rooms.length)];
  return Math.round(r.x0 + 8 + Math.random() * (r.w - 16));
}

// ---------------------------------------------------------------------------
// Drawing each frame
// ---------------------------------------------------------------------------
function drawSkyAndViews(L, t) {
  const { dark, dusk } = skyState(Game.hour);
  const dk = clamp(dark / 0.7, 0, 1);
  const sky = mix(mix('#9fd4f2', '#f2a86a', dusk * 0.55), '#141a36', dk);
  const skyTop = mix(mix('#6ab4e8', '#c87a6a', dusk * 0.4), '#0a0e22', dk);
  const g = IX.createLinearGradient(0, 0, 0, 60);
  g.addColorStop(0, skyTop); g.addColorStop(1, sky);
  IX.fillStyle = g; IX.fillRect(0, 0, L.IW, IH);
  if (dk > 0.5) for (let k = 0; k < L.IW / 9; k++) { const sx = (k * 53) % L.IW, sy = (k * 29) % 40; if (Math.sin(t * 2 + k) > -0.6) IP(sx, sy, `rgba(255,255,240,${(dk - 0.5) * 1.6})`); }
  else if (!Game.raining) for (let k = 0; k < 3; k++) { const cx = ((k * 211 + t * 3) % (L.IW + 80)) - 40, cy = 8 + k * 9; ellipseFill(IX, cx, cy, 14, 3, 'rgba(255,255,255,0.75)'); ellipseFill(IX, cx + 6, cy - 2, 8, 3, 'rgba(255,255,255,0.85)'); }
  const ground = World.season === 'winter' ? mix('#e8eef8', '#3a4058', dk) : mix(World.season === 'autumn' ? '#9a9a4a' : '#6aa84a', '#16241a', dk);
  const view = (x0, y0, w, hh) => {
    IX.fillStyle = sky; IX.fillRect(x0, y0, w, hh);
    const hz = Math.round(y0 + hh * 0.62);
    IX.fillStyle = ground; IX.fillRect(x0, hz, w, y0 + hh - hz);
    for (let k = 0; k < w; k += 5) IP(x0 + k, hz - 1 - ((k * 7 + x0) % 3 === 0 ? 1 : 0), shade(ground, -0.1));
    if (Game.raining) { IX.fillStyle = 'rgba(200,220,255,0.55)'; for (let k = 0; k < w; k += 3) IX.fillRect(x0 + k, y0 + ((k * 13 + t * 60) % hh), 1, 3); }
    else if (Game.weather === 'snow') { IX.fillStyle = '#ffffff'; for (let k = 0; k < w; k += 4) IX.fillRect(x0 + ((k + Math.sin(t + k) * 2) | 0), y0 + ((k * 11 + t * 14) % hh), 1, 1); }
  };
  for (const w of L.wins) view(w.x - 10, w.y - 10, 21, 21);
  if (L.door) {
    const d = L.door;
    view(d.x - d.r, d.y - d.r, d.r * 2 + 1, WALL_B - d.y + d.r);
    drawDoorLeaf(L, d);
  }
}
function drawDoorLeaf(L, d) {
  const h = L.h, dc = h.doorColor, dd = shade(dc, -0.25), dl = shade(dc, 0.22);
  if (h.doorAnim > 0) {
    IR(d.x - d.r, d.y - d.r + 4, 6, WALL_B - d.y + d.r - 4, dc); IR(d.x - d.r, d.y - d.r + 4, 1, WALL_B - d.y + d.r - 4, dd);
    return;
  }
  disc(IX, d.x, d.y, d.r, dc); IR(d.x - d.r, d.y, d.r * 2 + 1, WALL_B - d.y, dc);
  for (let k = -d.r + 3; k < d.r - 1; k += 4) IR(d.x + k, d.y - d.r + 3, 1, WALL_B - d.y + d.r - 3, dd);
  for (let a = 0; a < 10; a++) { const ang = Math.PI * 1.15 + (a / 9) * Math.PI * 0.5; IP(Math.round(d.x + Math.cos(ang) * (d.r - 3)), Math.round(d.y + Math.sin(ang) * (d.r - 3)), dl); }
  disc(IX, d.x, d.y + 1, 2, '#b8902a'); IP(d.x - 1, d.y, '#fff2a0');
  // the bolt's drawn at night
  if (Game.darkness > 0.3) { IR(d.x + 5, d.y - 1, 7, 2, '#3a3a40'); IP(d.x + 5, d.y - 2, '#3a3a40'); }
}

function drawFire(L, t) {
  if (!L.hearth) return;
  const x = L.hearth.x, b = WALL_B;
  const h = L.h;
  const awake = h.inside.some((id) => { const v = Game.villagers.find((o) => o.id === id); return v && v.stage !== 'baby' && !(v.task && v.task.a.id === 'sleep'); });
  const lit = !h.chilly && (awake || (isMealTime(Game.hour) && h.inside.length > 0));
  Interior.fire = h.chilly ? 0 : lit ? 1 : 0.35;
  if (h.chilly) { IR(x - 9, b - 4, 19, 2, '#5a5a5a'); for (let k = 0; k < 6; k++) IP(x - 8 + k * 3, b - 5, '#7a7a7a'); return; }
  // logs
  IR(x - 9, b - 5, 18, 3, '#5a3a22'); IR(x - 6, b - 7, 13, 2, '#6e4628'); IP(x - 9, b - 5, '#8e6038');
  if (!lit) { for (let k = 0; k < 7; k++) if (Math.sin(t * 3 + k * 2.1) > 0) IP(x - 8 + k * 3, b - 6, k % 2 ? '#ff6a2a' : '#c83a1a'); return; }
  for (let k = 0; k < 9; k++) {
    const fx = x - 8 + k * 2;
    const ht = 6 + Math.round(Math.sin(t * 9 + k * 1.7) * 2.5 + Math.sin(t * 5.3 + k) * 1.5) + (k > 2 && k < 7 ? 4 : 0);
    IR(fx, b - 6 - ht, 2, ht, '#e8501a'); IR(fx, b - 6 - ht * 0.7, 2, ht * 0.7, '#ff9a2a'); IR(fx, b - 6 - ht * 0.35, 2, ht * 0.35, '#ffe07a');
  }
  if (L.neon) for (let k = 0; k < 3; k++) IP(x - 4 + k * 4, b - 12 - (Math.floor(t * 6 + k) % 6), '#3af0ff');
}

function drawLiveBits(L, t, dt) {
  const b = WALL_B;
  // the hall clock's pendulum
  const ck = L.items.find((i) => i.t === 'clock');
  if (ck) { const sw = Math.round(Math.sin(t * 3) * 2.5); IR(ck.x + 5 + sw, b - 36, 1, 16, '#b8902a'); disc(IX, ck.x + 5 + sw, b - 19, 2, '#d8b040'); }
  // the oven glowing when someone's baking
  const rg = L.items.find((i) => i.t === 'range');
  if (rg && Interior.baking) { IR(rg.x + 4, b - 19, 10, 10, Math.sin(t * 6) > 0 ? '#e8742a' : '#d8601a'); IR(rg.x + 6, b - 15, 6, 4, '#ffb04a'); }
  // smoke from the chimney, steam from the kettle
  if (L.chimTop && Interior.fire > 0.3 && SPEEDS[Game.speedIdx] > 0 && Math.random() < dt * (Interior.fire > 0.5 ? 3 : 1)) Interior.smoke.push({ x: L.chimTop.x, y: L.chimTop.y, r: 2, a: 0.7, vx: R.f(2, 5) });
  for (const s of Interior.smoke) { s.y -= dt * 7; s.x += dt * s.vx; s.r += dt * 1.6; s.a -= dt * 0.18; }
  Interior.smoke = Interior.smoke.filter((s) => s.a > 0 && s.y > -10);
  for (const s of Interior.smoke) { IX.globalAlpha = Math.max(0, s.a); disc(IX, Math.round(s.x), Math.round(s.y), Math.round(s.r), L.neon ? '#8a7aa8' : '#d8d4cc'); }
  IX.globalAlpha = 1;
  if (rg && (Interior.baking || isMealTime(Game.hour))) for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1; IX.globalAlpha = 0.6 * (1 - ph); IP(rg.x + 13 + Math.round(Math.sin(ph * 6 + k) * 2), b - 37 - Math.round(ph * 12), '#ffffff'); }
  IX.globalAlpha = 1;
}

function drawFolk(L, folk, t) {
  Interior.boxes = [];
  const list = folk.map((v) => [v, Interior.folk.get(v.id)]).filter(([, st]) => st);
  // seated and bedded folk first (furniture fronts go over them), then those on their feet
  const fixed = list.filter(([, st]) => !st.walking && ['sit', 'bed', 'cradle'].includes(st.target.pose));
  const free = list.filter((e) => !fixed.includes(e)).sort((a, b) => a[1].y - b[1].y);
  for (const [v, st] of fixed) drawPerson(L, v, st, t);
  for (const it of L.items) drawItem(L, it, 'front', t);
  for (const [v, st] of free) drawPerson(L, v, st, t);
}

function drawPerson(L, v, st, t) {
  const tg = st.target;
  // eyes shut asleep and dozing, and for a blink every few seconds
  const asleep = tg.pose === 'bed' || tg.asleep || (tg.pose === 'cradle' && v.task && v.task.a.id === 'sleep');
  const spr = asleep || (t + v.id * 0.37) % 4.1 < 0.13 ? shutSprites(v) : v.sprites;
  let img, x, y, flip = false, bob = 0;
  // indoors is drawn in half-pixels, so the half-resolution copies are used
  const shiver = L.h.chilly && !(tg.pose === 'bed') ? Math.round(Math.sin(t * 40 + v.id)) * 0.5 : 0;
  if (st.walking) {
    // stride, pass, stride, pass, rising a little as the feet pass
    const ph = Math.floor(st.dist / 3.2) % 4;
    img = spr.side[ph === 0 ? 'walk1' : ph === 2 ? 'walk2' : 'stand']; flip = st.flip;
    if (ph % 2) bob = -1;
  } else if (tg.pose === 'bed' || tg.pose === 'cradle') {
    // just a head on the pillow (or over the cradle's side)
    const full = spr.down.stand.lo || spr.down.stand, a = full.anchors || {};
    const ch = Math.round((a.mouth ? a.mouth[1] : 10) + 4);
    const hx = Math.round(st.x - full.width / 2), hy = tg.pose === 'bed' ? WALL_B - 18 - ch + 3 : WALL_B - 16 - ch + 4 + (Interior.rocking.has(tg.bed) ? 0 : 0);
    const rock = tg.pose === 'cradle' ? Math.round(Math.sin(t * 2.5) * 1.5) : 0;
    IX.drawImage(full, 0, 0, full.width, ch, hx + rock, hy, full.width, ch);
    if (tg.pose === 'bed') {
      // eyes shut
      zzz(st.x + 6, hy - 2, t, v.id);
      if (L.h.chilly) IP(st.x + 3, hy + ch - 3, 'rgba(255,255,255,0.6)');
    } else if (v.task && v.task.a.id === 'sleep') zzz(st.x + 5, hy - 2, t, v.id);
    Interior.boxes.push({ v, x0: hx, y0: hy, x1: hx + full.width, y1: hy + ch + 8 });
    return;
  } else if (tg.pose === 'sit') {
    img = spr.down.sit;
  } else if (tg.pose === 'crawl') {
    img = spr.down.stand;
  } else if (tg.pose === 'work') {
    img = spr.up[Math.floor(t * 2.2 + v.id) % 2 ? 'stand' : 'work'];
  } else {
    const face = tg.face || (st.browse ? 'up' : 'down');
    img = face === 'up' ? spr.up.stand : face === 'left' || face === 'right' ? spr.side.stand : spr.down.stand;
    flip = face === 'left';
  }
  img = img.lo || img;
  x = Math.round(st.x - img.width / 2 + shiver);
  y = Math.round((tg.pose === 'sit' && !st.walking ? tg.y - 2 : st.y) - img.height + 1) + bob;
  if (tg.pose === 'sit' && !st.walking && tg.seat && tg.seat.kind === 'arm') y -= 3;
  if (flip) { IX.save(); IX.translate(x + img.width, y); IX.scale(-1, 1); IX.drawImage(img, 0, 0); IX.restore(); }
  else IX.drawImage(img, x, y);
  if (tg.asleep) zzz(st.x + 6, y - 2, t, v.id);
  if (Game.selected === v) { const ax = Math.round(st.x), ay = y - 7 + Math.round(Math.sin(t * 4)); IR(ax - 2, ay, 5, 1, '#ffd23a'); IR(ax - 1, ay + 1, 3, 1, '#ffd23a'); IP(ax, ay + 2, '#ffd23a'); }
  Interior.boxes.push({ v, x0: x, y0: y, x1: x + img.width, y1: y + img.height });
}
function zzz(x, y, t, seed) {
  for (let k = 0; k < 2; k++) {
    const ph = (t * 0.5 + k * 0.5 + seed * 0.13) % 1;
    const zx = Math.round(x + ph * 6), zy = Math.round(y - ph * 10);
    IX.globalAlpha = 1 - ph;
    IR(zx, zy, 3, 1, '#ffffff'); IP(zx + 1, zy + 1, '#ffffff'); IR(zx, zy + 2, 3, 1, '#ffffff');
  }
  IX.globalAlpha = 1;
}

// Darkness inside, with pools of light from windows, hearth and lamps.
function drawLight(L, folk, t) {
  const h = L.h;
  if (!Interior.light || Interior.light[0].width !== L.IW) Interior.light = makeCanvas(L.IW, IH);
  const [lc, lx] = Interior.light;
  const dk = Game.darkness;
  const amb = clamp(0.1 + dk * 1.05, 0, 0.8);
  lx.globalCompositeOperation = 'source-over';
  lx.clearRect(0, 0, L.IW, IH);
  lx.fillStyle = L.neon ? `rgba(10,6,30,${amb})` : `rgba(14,8,24,${amb})`;
  lx.fill(L.hillPath);
  lx.globalCompositeOperation = 'destination-out';
  // pools of light in four crisp steps, as outdoors
  const glow = (x, y, r, s) => {
    const step = 1 - Math.pow(1 - clamp(s, 0, 0.98), 0.25);
    for (let k = 4; k >= 1; k--) disc(lx, Math.round(x), Math.round(y), Math.round((r * k) / 4), `rgba(0,0,0,${step})`);
  };
  const day = clamp(1 - dk / 0.6, 0, 1);
  for (const w of L.wins) glow(w.x, w.y + 18, 46, 0.8 * day);
  if (L.door && h.doorAnim > 0) glow(L.door.x, 88, 40, 0.8 * day);
  const fl = 0.9 + Math.sin(t * 11) * 0.04 + Math.sin(t * 7.3) * 0.04;
  if (L.hearth && Interior.fire > 0) glow(L.hearth.x, WALL_B - 12, Interior.fire > 0.5 ? 78 * fl : 22, Interior.fire > 0.5 ? 0.95 : 0.5);
  const awake = folk.some((v) => !(v.task && v.task.a.id === 'sleep') && v.stage !== 'baby');
  Interior.lamps = awake && dk > 0.12;
  if (Interior.lamps) for (const r of L.rooms) glow(r.lampX, L.top(r, r.lampX) + 24, Math.max(52, r.w * 0.6), 0.85);
  if (Interior.baking) { const rg = L.items.find((i) => i.t === 'range'); if (rg) glow(rg.x + 9, WALL_B - 14, 26, 0.6); }
  if (L.neon) for (const r of L.rooms) glow((r.x0 + r.x1) / 2, L.top(r, Math.round((r.x0 + r.x1) / 2)) + 6, 30, 0.35);
  IX.drawImage(lc, 0, 0);
  // warm color from the fire and lamps
  IX.save(); IX.globalCompositeOperation = 'lighter';
  const warm = (x, y, r, a, col) => { for (let k = 3; k >= 1; k--) disc(IX, Math.round(x), Math.round(y), Math.round((r * k) / 3), col.replace('A', a * 0.4)); };
  if (L.hearth && Interior.fire > 0.5) warm(L.hearth.x, WALL_B - 12, 60, 0.18 * fl * (0.4 + dk), 'rgba(255,130,40,A)');
  if (Interior.lamps) for (const r of L.rooms) warm(r.lampX, L.top(r, r.lampX) + 22, 40, 0.1, L.neon ? 'rgba(60,220,255,A)' : 'rgba(255,190,90,A)');
  IX.restore();
  // hanging lanterns
  for (const r of L.rooms) {
    const lx0 = r.lampX, ly = L.top(r, lx0);
    if (r.kind === 'kitchen') continue; // the pot rack hangs there
    if (L.items.some((i) => i.room === r && i.t === 'hearth')) continue;
    IR(lx0, ly, 1, 12, '#2a2a30');
    if (L.neon) { IR(lx0 - 6, ly + 12, 13, 2, Interior.lamps ? '#3af0ff' : '#1a4a5a'); }
    else { IR(lx0 - 3, ly + 12, 7, 8, '#2a2a30'); IR(lx0 - 2, ly + 13, 5, 6, Interior.lamps ? '#ffd77a' : '#6a5a3a'); if (Interior.lamps) IR(lx0 - 1, ly + 14, 2, 3, '#fff4c0'); }
  }
}

// ---------------------------------------------------------------------------
// The window onto it all
// ---------------------------------------------------------------------------
function openInterior(h) {
  if (!h || !h.built) return;
  const el = $('interior');
  const fresh = Interior.home !== h;
  Interior.home = h; Interior.key = ''; Interior.hover = null;
  if (fresh) { Interior.folk.clear(); Interior.smoke = []; Interior.justOpened = true; Interior.manual = false; }
  el.hidden = false;
  el.classList.toggle('rift-skin', !!h.neon);
  layoutInterior();
  renderInterior(0);
  if (fresh) requestAnimationFrame(() => {
    const wrap = $('int-wrap'), L = Interior.L;
    if (L && L.door) wrap.scrollLeft = Math.max(0, L.door.x * Interior.scale - wrap.clientWidth / 2);
  });
  Sound.click();
  devLog('homes', `Peeked inside ${h.name}`);
}
function closeInterior() {
  $('interior').hidden = true;
  Interior.home = null; Interior.L = null; Interior.folk.clear();
  for (const b of Interior.bubbles) b.hidden = true;
}
function layoutInterior() {
  const h = Interior.home;
  const key = interiorKey(h);
  if (key === Interior.key && Interior.L) return;
  Interior.key = key;
  Interior.L = interiorLayout(h);
  Interior.stat = paintStatic(Interior.L);
  const cv = $('int-cv');
  cv.width = Interior.L.IW; cv.height = IH;
  Interior.cx = cv.getContext('2d'); Interior.cx.imageSmoothingEnabled = false;
  fitInterior();
  updateInteriorHead();
}
function fitInterior(force) {
  const L = Interior.L, wrap = $('int-wrap');
  if (!L) return;
  if (force == null && !Interior.manual) {
    // phones with the villager panel up get a smaller cutaway so both fit
    const squeezed = window.innerWidth <= 760 && !$('panel').hidden;
    const fitW = Math.floor((wrap.clientWidth || 600) / L.IW);
    const fitH = Math.floor((window.innerHeight * (squeezed ? 0.2 : 0.55)) / IH);
    Interior.scale = clamp(Math.min(Math.max(fitW, 2), fitH), 1, 5);
  }
  Interior.fitSig = fitSig();
  const cv = $('int-cv');
  cv.style.width = L.IW * Interior.scale + 'px'; cv.style.height = IH * Interior.scale + 'px';
}
function fitSig() { return window.innerWidth + 'x' + window.innerHeight + ($('panel').hidden ? '' : 'p'); }
function zoomInterior(d) {
  Interior.manual = true;
  const wrap = $('int-wrap'), mid = (wrap.scrollLeft + wrap.clientWidth / 2) / Interior.scale;
  Interior.scale = clamp(Interior.scale + d, 1, 6);
  fitInterior(true);
  wrap.scrollLeft = mid * Interior.scale - wrap.clientWidth / 2;
}
function updateInteriorHead() {
  const h = Interior.home, L = Interior.L;
  if (!h || !L) return;
  $('int-title').textContent = h.name;
  const res = L.res;
  const home = res.filter((v) => v.inside === h).length;
  const fire = h.chilly ? 'hearth cold' : Interior.fire > 0.5 ? 'fire lit' : 'fire banked';
  $('int-sub').textContent = `${res.length ? res.length + ' living here' : 'Empty'} · ${home} at home · larder ${pantryTotal(h)} · ${fire}${h.neon ? ' · wired' : ''}`;
  const f = $('int-folk');
  const sig = res.map((v) => v.id + (v.inside === h ? 'i' : 'o') + (Game.selected === v ? 's' : '')).join(',');
  if (f.dataset.sig === sig) return;
  f.dataset.sig = sig;
  f.innerHTML = '';
  for (const v of res) {
    const b = document.createElement('button');
    b.className = 'int-chip' + (v.inside === h ? ' home' : '') + (Game.selected === v ? ' sel' : '');
    b.textContent = v.first;
    b.title = v.inside === h ? `${v.first} is home` : `${v.first} is out: ${v.activity()}`;
    b.addEventListener('click', () => { selectVillager(v); if (v.inside !== h) focusVillager(v); else scrollToFolk(v); });
    f.appendChild(b);
  }
}
function scrollToFolk(v, now) {
  const st = Interior.folk.get(v.id), wrap = $('int-wrap');
  if (st) wrap.scrollTo({ left: st.x * Interior.scale - wrap.clientWidth / 2, behavior: now ? 'auto' : 'smooth' });
}

function interiorFrame(dt) {
  if (!Interior.home) return;
  Interior.acc += dt;
  if (Interior.acc < 1 / 30) return;
  renderInterior(Interior.acc);
  Interior.acc = 0;
}
function renderInterior(dt) {
  layoutInterior();
  const L = Interior.L;
  if (!L) return;
  Interior.t += dt;
  const t = Interior.t;
  IX = Interior.cx;
  const folk = updateFolk(L, dt);
  drawSkyAndViews(L, t);
  IX.drawImage(Interior.stat, 0, 0);
  drawFire(L, t);
  drawLiveBits(L, t, dt);
  drawFolk(L, folk, t);
  drawLight(L, folk, t);
  updateBubbles(L, folk);
  Interior.headT = (Interior.headT || 0) - dt;
  if (Interior.headT <= 0) {
    Interior.headT = 0.5; updateInteriorHead(); updateCaption();
    if (Interior.fitSig !== fitSig()) { const old = Interior.scale; fitInterior(); if (old !== Interior.scale && Game.selected) scrollToFolk(Game.selected, true); }
  }
}

// Speech, drawn as crisp text over the canvas.
function updateBubbles(L, folk) {
  const layer = $('int-bubbles'), S = Interior.scale;
  let n = 0;
  for (const v of folk) {
    if (!v.bubble || v.bubble.t <= 0) continue;
    const box = Interior.boxes.find((b) => b.v === v);
    if (!box) continue;
    let b = Interior.bubbles[n];
    if (!b) { b = document.createElement('div'); b.className = 'int-bubble'; layer.appendChild(b); Interior.bubbles.push(b); }
    b.hidden = false;
    // a thought cloud for musing, "to Name" for talking to someone
    const txt = (v.bubble.to ? `to ${v.bubble.to.first}: ` : '') + v.bubble.text;
    b.classList.toggle('think', !!v.bubble.think);
    if (b.textContent !== txt) b.textContent = txt;
    b.style.left = ((box.x0 + box.x1) / 2) * S + 'px';
    b.style.top = (box.y0 - 3) * S + 'px';
    n++;
  }
  for (let i = n; i < Interior.bubbles.length; i++) Interior.bubbles[i].hidden = true;
}

function interiorPoint(e) {
  const cv = $('int-cv'), r = cv.getBoundingClientRect();
  return [(e.clientX - r.left) / Interior.scale, (e.clientY - r.top) / Interior.scale];
}
function interiorHit(x, y) {
  for (let i = Interior.boxes.length - 1; i >= 0; i--) { const b = Interior.boxes[i]; if (x >= b.x0 - 2 && x <= b.x1 + 2 && y >= b.y0 - 2 && y <= b.y1 + 2) return { v: b.v }; }
  const L = Interior.L;
  if (!L) return null;
  for (const hs of L.hot) if (x >= hs.x0 && x <= hs.x1 && y >= hs.y0 && y <= hs.y1) return { hs };
  return null;
}
function updateCaption() {
  const cap = $('int-cap');
  const hv = Interior.hover;
  let text = '';
  if (hv && hv.v) text = `${hv.v.name()}: ${hv.v.task ? (hv.v.task.a.label2 ? hv.v.task.a.label2(hv.v) : hv.v.task.a.label) : 'at home'}. Click to see more.`;
  else if (hv && hv.hs) text = hv.hs.text();
  else text = Interior.L && !Interior.L.res.length ? 'Nobody lives here yet. The beds are made up for whoever comes.' : 'Hover over things to look closer. Click someone to see what they\'re thinking.';
  if (cap.textContent !== text) cap.textContent = text;
}

function setupInterior() {
  const cv = $('int-cv');
  cv.addEventListener('pointermove', (e) => {
    const [x, y] = interiorPoint(e);
    Interior.hover = interiorHit(x, y);
    cv.style.cursor = Interior.hover && Interior.hover.v ? 'pointer' : 'default';
    updateCaption();
  });
  cv.addEventListener('pointerleave', () => { Interior.hover = null; updateCaption(); });
  cv.addEventListener('click', (e) => {
    const [x, y] = interiorPoint(e);
    const hit = interiorHit(x, y);
    Interior.hover = hit; updateCaption();
    if (hit && hit.v) { selectVillager(hit.v); Sound.click(); updateInteriorHead(); }
  });
  $('int-close').addEventListener('click', closeInterior);
  $('int-zin').addEventListener('click', () => zoomInterior(1));
  $('int-zout').addEventListener('click', () => zoomInterior(-1));
  window.addEventListener('resize', () => { if (Interior.home) fitInterior(); });
}
