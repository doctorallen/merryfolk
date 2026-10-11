'use strict';
// ---------------------------------------------------------------------------
// Pets. Now and then a household takes one in: a stray tabby that's been
// hanging round the inn yard, a puppy from a farm litter. The little ones
// usually get to name it. Dogs go everywhere with their favourite person,
// trotting at their heels down the lanes (and out to the pens with a herder);
// cats keep near home, sit in the sun on the doorstep and wander off on their
// own business. Both come in at night and out of the rain. Folk stop to
// stroke them, which does everybody good, and a pet by the fire makes a
// home cosier.
// ---------------------------------------------------------------------------

const PET_NAMES = { cat: ['Pudding', 'Mittens', 'Smudge', 'Biscuit', 'Tansy', 'Marmalade', 'Socks', 'Pip', 'Nutmeg', 'Thimble', 'Crumpet', 'Bramble'], dog: ['Grip', 'Fang', 'Wolf', 'Bounder', 'Rufus', 'Patch', 'Barley', 'Toby', 'Scamp', 'Bess', 'Nell', 'Biscuit'] };
const PET_COATS = { cat: [['#d8873a', '#b86a2a', 'ginger'], ['#3a3438', '#24202a', 'black'], ['#9a948e', '#6e6a66', 'grey'], ['#e8e0d0', '#3a3438', 'black-and-white'], ['#8a6a4a', '#5a4430', 'tabby']], dog: [['#8a5a32', '#5a3a1e', 'brown'], ['#2a2628', '#f0ece4', 'black-and-white'], ['#d8a85a', '#b8883a', 'golden'], ['#a89a8a', '#7a6e62', 'grey']] };
MOODLETS.new_pet = ['We\'ve a new {x}!', 0.14, 1440, ['Our very own pet!', 'I\'ve never been so happy.']];

// --- Sprites: side-on facing right (sit, walk ×2, sleep), and coming towards
// you or going away (walk ×2 each), so a pet crossing the screen up or down
// doesn't slide along sideways ---------------------------------------------------
const PET_SPR = {};
function petSprites(kind, coat) {
  const key = kind + coat;
  if (PET_SPR[key]) return PET_SPR[key];
  const [c, d] = PET_COATS[kind][coat];
  const pal = { c, d, e: '#2a1c12', p: '#e88a9a', w: '#f0ece4' };
  let frames;
  if (kind === 'cat') {
    frames = {
      sit: ['......d.d.', '......cdc.', '......ece.', 'd.....ccc.', 'd...ccccc.', '.d.ccccc..', '.dccccccc.', '..c.c.cc..'],
      walk1: ['........d.d', '........cdc', 'dd......ece', '..dcccccccc', '...ccccccc.', '...c.c..c.c', '...........'],
      walk2: ['........d.d', '........cdc', '.dd.....ece', '...dccccccc', '...ccccccc.', '....c.cc.c.', '...........'],
      sleep: ['...........', '...........', '...........', '...ccccc...', '.dcccccccd.', 'dcccccccce.', '.ccccccccc.'],
      down1: ['.d.....d.', '.dc...cd.', '.ccccccc.', '.cecwcec.', '.cccpccc.', '..ccccc..', '.ccccccc.', '.ccccccc.', '.c.c.c.c.'],
      down2: ['.d.....d.', '.dc...cd.', '.ccccccc.', '.cecwcec.', '.cccpccc.', '..ccccc..', '.ccccccc.', '.ccccccc.', '..cc.cc..'],
      up1: ['.d.....d.', '.dc...cd.', '.ccccccc.', '.ccccccc.', '.ccccccc.', '..ccdcc..', '.cccdccc.', '.cccdccc.', '.c.c.c.c.'],
      up2: ['.d.....d.', '.dc...cd.', '.ccccccc.', '.ccccccc.', '.ccccccc.', '..ccdcc..', '.ccdcccc.', '.cccdccc.', '..cc.cc..'],
    };
  } else {
    frames = {
      sit: ['.......dd...', '......dccce.', '......cccep.', '.......cc...', 'd....cccc...', '.d..ccccc...', '..dcccccc...', '...c.cc.c...'],
      walk1: ['.........dd..', '........dccce', 'dd......cccce', '..dcccccccc..', '...ccccccc...', '...c.c..c.c..', '...c.....c...'],
      walk2: ['.........dd..', '........dccce', '.dd.....cccce', '...dccccccc..', '...ccccccc...', '....c.c.c.c..', '....c...c....'],
      sleep: ['............', '............', '............', '....ccccdd..', '.dccccccccce', 'dccccccccccc', '.cccccccccc.'],
      down1: ['..d.....d..', '.dcccccccd.', '.dcecccecd.', '..ccccccc..', '...ccecc...', '..ccccccc..', '.ccccccccc.', '.ccccccccc.', '.cc.ccc.cc.'],
      down2: ['..d.....d..', '.dcccccccd.', '.dcecccecd.', '..ccccccc..', '...ccecc...', '..ccccccc..', '.ccccccccc.', '.ccccccccc.', '..cc.c.cc..'],
      up1: ['..d.....d..', '.dcccccccd.', '.dcccccccd.', '..ccccccc..', '..ccccccc..', '..cccdccc..', '.ccccdcccc.', '.ccccccccc.', '.cc.ccc.cc.'],
      up2: ['..d.....d..', '.dcccccccd.', '.dcccccccd.', '..ccccccc..', '..ccccccc..', '..cccdccc..', '.cccdccccc.', '.ccccccccc.', '..cc.c.cc..'],
    };
  }
  const out = {};
  for (const f in frames) out[f] = finishSprite(frames[f], pal);
  return (PET_SPR[key] = out);
}

function petsList() { return Game.pets || (Game.pets = []); }
function petOf(home) { return petsList().find((p) => p.homeId === home.id); }
function petWord(p) { return `${PET_COATS[p.kind][p.coat][2]} ${p.kind}`; }

// A name nobody in the village (two- or four-legged) is already using.
function freePetName(kind) {
  const taken = new Set(petsList().map((q) => q.name).concat(Game.villagers.map((v) => v.first)));
  const free = PET_NAMES[kind].filter((n) => !taken.has(n));
  return R.pick(free.length ? free : PET_NAMES[kind]);
}
function adoptPet(home, kind, namer) {
  const coat = Math.floor(Math.random() * PET_COATS[kind].length);
  const p = { id: (Game.petSeq = (Game.petSeq || 0) + 1), kind, coat, name: freePetName(kind), homeId: home.id, x: home.stepX, y: home.stepY + 6, tx: null, ty: null, face: 1, state: 'sit', t: 5, inside: false, since: Game.day, owner: namer ? namer.id : null };
  petsList().push(p);
  const res = residentsOf(home).filter((v) => v.stage !== 'baby');
  for (const v of res) { feel(v, 'new_pet', p.kind); v.remember(`We took in ${p.name}, a ${petWord(p)}.`, 2); }
  // the dog picks its person: the one who'll walk it most
  if (kind === 'dog') p.owner = (res.find((v) => v.job === 'herder') || res.filter((v) => v.isGrown()).sort((a, b) => b.genes.sociability - a.genes.sociability)[0] || res[0] || {}).id ?? null;
  const how = kind === 'cat' ? R.pick(['a stray that\'s been hanging round the inn yard', 'a half-wild kitten from the barn', 'a cat that simply walked in and sat by the fire']) : R.pick(['a puppy from a farm litter', 'a scruffy pup who followed them home from market', 'one of the herder\'s collie pups']);
  chronicle(`The household at ${home.name} has taken in ${how}: a ${petWord(p)}${namer && !namer.isGrown() ? `, and little ${namer.first} has named ${kind === 'cat' ? 'her' : 'him'} ${p.name}` : ` called ${p.name}`}.`, 'love');
  return p;
}
function petsDaily() {
  const homes = World.homes.filter((h) => h.built && residentsOf(h).length);
  if (petsList().length >= Math.ceil(homes.length * 0.6) || !R.chance(0.45)) return;
  const cands = homes.filter((h) => !petOf(h)).map((h) => {
    const res = residentsOf(h);
    const kids = res.filter((v) => v.isChild()).length, lonely = res.reduce((s, v) => s + v.drives.lonely, 0) / res.length;
    return [h, kids * 0.8 + lonely + (res.length === 1 ? 0.6 : 0) + (res.some((v) => v.job === 'herder') ? 0.8 : 0) + Math.random()];
  }).sort((a, b) => b[1] - a[1]);
  if (!cands.length) return;
  const h = cands[0][0], res = residentsOf(h);
  const kind = res.some((v) => v.job === 'herder' || v.job === 'farmer') || R.chance(0.4) ? 'dog' : 'cat';
  adoptPet(h, kind, res.find((v) => v.isChild()) || null);
}

// --- Behaviour ---------------------------------------------------------------
function petWalkable(x, y) { const tx = Math.floor(x / 16), ty = Math.floor((y - 2) / 16); return inMap(tx, ty) && walkable(tx, ty); }
function petClear(x0, y0, x1, y1) {
  const n = Math.ceil(dist(x0, y0, x1, y1) / 6);
  for (let i = 1; i <= n; i++) if (!petWalkable(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n)) return false;
  return true;
}
// Straight there when nothing's in the way; otherwise round walls, lamp-posts
// and fences along a proper path, as folk do.
function stepPet(p, tx, ty, speed, dt) {
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
  if (d < 2) { p.route = null; p.stuck = 0; return true; }
  let gx = tx, gy = ty;
  if (petClear(p.x, p.y, tx, ty)) p.route = null;
  else {
    const key = Math.floor(tx / 16) + ',' + Math.floor((ty - 2) / 16);
    if (!p.route || p.routeKey !== key) {
      const r = findPath(Math.floor(p.x / 16), Math.floor((p.y - 2) / 16), Math.floor(tx / 16), Math.floor((ty - 2) / 16));
      if (!r) { p.route = null; p.tx = null; return true; }
      p.route = r.map(([x, y]) => [x * 16 + 8, y * 16 + 10]); p.routeKey = key;
    }
    while (p.route.length && (dist(p.x, p.y, p.route[0][0], p.route[0][1]) < 3 || (p.route[1] && petClear(p.x, p.y, p.route[1][0], p.route[1][1])))) p.route.shift();
    if (p.route.length) [gx, gy] = p.route[0];
  }
  const ex = gx - p.x, ey = gy - p.y, e = Math.hypot(ex, ey) || 1;
  const s = Math.min(e, speed * dt), nx = p.x + (ex / e) * s, ny = p.y + (ey / e) * s;
  const ox = p.x, oy = p.y;
  if (petWalkable(nx, ny)) { p.x = nx; p.y = ny; }
  else if (petWalkable(nx, p.y)) p.x = nx;
  else if (petWalkable(p.x, ny)) p.y = ny;
  else { p.tx = null; p.route = null; return true; }
  // sliding along something and getting nowhere: give up on it
  const moved = Math.hypot(p.x - ox, p.y - oy);
  p.stuck = moved < s * 0.3 ? (p.stuck || 0) + dt : 0;
  if (p.stuck > 4) { p.stuck = 0; p.route = null; p.tx = null; return true; }
  petFacing(p, ex, ey, dt);
  p.walk = (p.walk || 0) + moved;
  return false;
}
// Which way a pet shows as it moves: side-on, towards you or away, keeping
// the view it has until the other axis clearly wins; and it only turns round
// once it has been heading the other way for a moment, so a dog dithering
// about a spot doesn't flick left and right.
function petFacing(p, ex, ey, dt) {
  const ax = Math.abs(ex), ay = Math.abs(ey);
  if (p.dir === 'down' || p.dir === 'up') { if (ax > ay * 1.6) p.dir = 'side'; }
  else if (ay > ax * 1.6) p.dir = ey > 0 ? 'down' : 'up';
  if ((p.dir === 'down' && ey < 0 && ay > ax) || (p.dir === 'up' && ey > 0 && ay > ax)) p.dir = ey > 0 ? 'down' : 'up';
  const want = ex > 3 ? 1 : ex < -3 ? -1 : 0;
  if (want && want !== p.face) { p.faceT = (p.faceT || 0) + dt; if (p.faceT >= 1) { p.face = want; p.faceT = 0; } }
  else p.faceT = 0;
}
function updatePets(dtMin, hour) {
  for (const p of petsList()) {
    let home = World.homes[p.homeId];
    const res = home && home.built ? residentsOf(home) : [];
    // every pet has its person (cats too), so it knows whom to go with if the family moves
    if (res.length && (p.owner == null || !Game.villagers.some((v) => v.id === p.owner && !v.leaving))) p.owner = (res.find((v) => v.isGrown()) || res[0]).id;
    if (!res.length) {
      // the family has moved out: the pet goes along with its person, or waits indoors for whoever comes next
      const o = p.owner != null && Game.villagers.find((v) => v.id === p.owner && !v.leaving);
      const to = o && o.homeId >= 0 && World.homes[o.homeId];
      if (!to || !to.built || petOf(to)) { p.inside = true; continue; }
      p.homeId = to.id; home = to;
      if (!p.inside) p.route = null;
    }
    const night = hour >= 21 || hour < 6.5;
    const wantIn = night || Game.raining || (World.season === 'winter' && Game.weather === 'snow');
    if (p.say) { p.say.t -= dtMin / 3; if (p.say.t <= 0) p.say = null; }
    if (p.inside) {
      if (!wantIn && Math.random() < dtMin * 0.02) { p.inside = false; p.x = home.stepX; p.y = home.stepY + 6; p.state = 'sit'; p.t = 5; }
      continue;
    }
    if (wantIn) {
      p.state = 'walk';
      if (stepPet(p, home.stepX, home.stepY + 2, 22, dtMin) || dist(p.x, p.y, home.stepX, home.stepY) < 10) { p.inside = true; home.doorAnim = 6; }
      continue;
    }
    if (p.petted > 0) { p.petted -= dtMin; p.state = 'sit'; continue; }
    // dogs go with their person
    const owner = p.kind === 'dog' && p.owner != null ? Game.villagers.find((v) => v.id === p.owner) : null;
    if (owner && !owner.inside && !owner.leaving && dist(owner.x, owner.y, home.stepX, home.stepY) < 900) {
      const d = dist(p.x, p.y, owner.x, owner.y);
      if (d > 360) { p.x = owner.x - 14 * (owner.facing === 'left' ? -1 : 1); p.y = owner.y + 2; }
      // sets off once its person has got a fair way ahead, and keeps trotting
      // until it's right at heel, rather than stopping and starting at the edge
      if (d > 28) p.heeling = true;
      else if (d < 14) p.heeling = false;
      if (p.heeling) {
        // at heel (the side it was on, unless its person turns round), or the other side if that's walled off
        if (owner.facing === 'left' || owner.facing === 'right') p.heelSide = owner.facing === 'left' ? -1 : 1;
        const side = p.heelSide || 1, hx = petWalkable(owner.x - 12 * side, owner.y + 3) ? owner.x - 12 * side : petWalkable(owner.x + 12 * side, owner.y + 3) ? owner.x + 12 * side : owner.x;
        p.state = 'walk';
        // slowing as it comes up, so it never overshoots and has to turn back
        const speed = clamp((d - 8) * 1.1, 7, owner.path ? 22 : 18);
        if (stepPet(p, hx, owner.y + 3, speed, dtMin)) { p.state = 'sit'; p.heeling = false; }
      }
      else {
        p.state = owner.task && owner.task.phase === 'do' && owner.pose === 'sit' ? 'sleep' : 'sit';
        // sat at heel it looks the way its person does
        if (owner.facing === 'left' || owner.facing === 'right') { p.face = owner.facing === 'left' ? -1 : 1; p.dir = 'side'; }
        if (Math.random() < dtMin * 0.004) p.say = { text: R.pick(['Woof!', 'Wuff.', '*pant pant*']), t: 2 };
      }
      continue;
    }
    // otherwise pottering about near home: sit a while, wander a bit
    p.t -= dtMin;
    if (p.state === 'walk' && p.tx == null) p.state = 'sit'; // left behind by its person
    if (p.state === 'walk' && p.tx != null) { if (stepPet(p, p.tx, p.ty, p.kind === 'cat' ? 9 : 14, dtMin)) { p.state = Math.random() < (p.kind === 'cat' ? 0.4 : 0.15) ? 'sleep' : 'sit'; p.t = R.f(8, p.kind === 'cat' ? 60 : 25); p.tx = null; } continue; }
    if (p.t <= 0) {
      const r = p.kind === 'cat' ? 90 : 60;
      for (let k = 0; k < 6; k++) { const x = home.stepX + R.f(-r, r), y = home.stepY + R.f(-10, r * 0.7); if (petWalkable(x, y)) { p.tx = x; p.ty = y; break; } }
      p.state = p.tx != null ? 'walk' : 'sit'; p.t = 10;
      if (p.kind === 'cat' && Math.random() < 0.08) p.say = { text: R.pick(['Mrrp.', 'Meow.', '*purr*']), t: 2 };
    }
  }
}
function petFrame(p) {
  const S = petSprites(p.kind, p.coat);
  if (p.state === 'walk') { const k = Math.floor((p.walk || 0) / 5) % 2 ? 2 : 1; return S[(p.dir === 'down' || p.dir === 'up' ? p.dir : 'walk') + k]; }
  return p.state === 'sleep' ? S.sleep : S.sit;
}

// Stroking a pet, theirs or anyone's they pass.
ACTIONS.pet_pet = {
  id: 'pet_pet', label: 'Stroking a pet', icon: 'heart', sat: { lonely: -0.3, bored: -0.25 }, dur: 6, pose: 'stand', outdoor: true, stages: AWAKE,
  label2: (v) => (v.task && v.task.target.pet ? `Making a fuss of ${v.task.target.pet.name}` : 'Stroking a pet'),
  avail: (v) => petsList().some((p) => !p.inside && dist(p.x, p.y, v.x, v.y) < 140),
  extra: (v) => (v.isChild() ? 0.3 : 0.1) + v.genes.sociability * 0.05,
  target: (v) => {
    const p = petsList().filter((q) => !q.inside && dist(q.x, q.y, v.x, v.y) < 140).sort((a, b) => dist(a.x, a.y, v.x, v.y) - dist(b.x, b.y, v.x, v.y))[0];
    if (!p) return null;
    const side = p.x > v.x ? -10 : 10;
    return { x: p.x + side, y: p.y + 1, faceTo: p, pet: p };
  },
  start: (v, task) => { task.target.pet.petted = 20; return true; },
  done: (v, task) => {
    const p = task.target.pet;
    feel(v, 'pet', p.name);
    FX.hearts(p.x, p.y - 10);
    p.say = { text: p.kind === 'cat' ? R.pick(['*purr*', 'Prrrrp.', 'Mrrow.']) : R.pick(['Woof!', '*wag wag*', 'Arf!']), t: 2.4 };
    if (R.chance(0.3)) v.say(R.pick([`Who's a good ${p.kind === 'cat' ? 'puss' : 'dog'}?`, `Hello, ${p.name}!`, `There's my ${p.name}.`]), 2.4);
    p.petted = 3;
  },
};
ACTION_NAMES.pet_pet = 'Fussing over pets';
HABIT_KEYS.push('pet_pet');

// A pet by the fire makes home cosier.
{
  const sf = stateFeelings;
  stateFeelings = function (v) {
    const out = sf(v);
    const home = v.homeId >= 0 ? v.home() : null, p = home && petOf(home);
    if (p && p.inside && v.inside === home) out.push([`${p.name} curled up by the fire`, 0.04]);
    return out;
  };
}
{
  const ur = updateRabbits;
  updateRabbits = function (dtMin, season, hour) { ur(dtMin, season, hour); updatePets(dtMin, hour); };
}
window.addEventListener('DOMContentLoaded', () => {
  const oh = onHour;
  onHour = function (h) { const r = oh(h); if (h === 10) petsDaily(); return r; };
  const nv = newVillage;
  newVillage = function () {
    Game.pets = []; Game.petSeq = 0;
    const r = nv();
    // a couple of the founding households already have one
    const homes = World.homes.filter((h) => h.built && residentsOf(h).length);
    for (const h of homes.sort(() => Math.random() - 0.5).slice(0, 3)) {
      const kind = Math.random() < 0.5 ? 'cat' : 'dog', coat = Math.floor(Math.random() * PET_COATS[kind].length);
      const res = residentsOf(h);
      petsList().push({ id: ++Game.petSeq, kind, coat, name: freePetName(kind), homeId: h.id, x: h.stepX + R.f(-20, 20), y: h.stepY + 10, face: 1, state: 'sit', t: 5, inside: false, since: 1, owner: kind === 'dog' ? (res.find((v) => v.isGrown()) || {}).id ?? null : null });
    }
    return r;
  };
});
