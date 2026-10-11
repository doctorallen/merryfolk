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

// --- Sprites: side-on, facing right; sit, walk ×2, sleep ----------------------
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
    };
  } else {
    frames = {
      sit: ['.......dd...', '......dccce.', '......cccep.', '.......cc...', 'd....cccc...', '.d..ccccc...', '..dcccccc...', '...c.cc.c...'],
      walk1: ['.........dd..', '........dccce', 'dd......cccce', '..dcccccccc..', '...ccccccc...', '...c.c..c.c..', '...c.....c...'],
      walk2: ['.........dd..', '........dccce', '.dd.....cccce', '...dccccccc..', '...ccccccc...', '....c.c.c.c..', '....c...c....'],
      sleep: ['............', '............', '............', '....ccccdd..', '.dccccccccce', 'dccccccccccc', '.cccccccccc.'],
    };
  }
  const out = {};
  for (const f in frames) out[f] = finishSprite(frames[f], pal);
  return (PET_SPR[key] = out);
}

function petsList() { return Game.pets || (Game.pets = []); }
function petOf(home) { return petsList().find((p) => p.homeId === home.id); }
function petWord(p) { return `${PET_COATS[p.kind][p.coat][2]} ${p.kind}`; }

function adoptPet(home, kind, namer) {
  const coat = Math.floor(Math.random() * PET_COATS[kind].length);
  const p = { id: (Game.petSeq = (Game.petSeq || 0) + 1), kind, coat, name: R.pick(PET_NAMES[kind]), homeId: home.id, x: home.stepX, y: home.stepY + 6, tx: null, ty: null, face: 1, state: 'sit', t: 5, inside: false, since: Game.day, owner: namer ? namer.id : null };
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
function stepPet(p, tx, ty, speed, dt) {
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const s = Math.min(d, speed * dt), nx = p.x + (dx / d) * s, ny = p.y + (dy / d) * s;
  if (petWalkable(nx, ny)) { p.x = nx; p.y = ny; }
  else if (petWalkable(nx, p.y)) p.x = nx;
  else if (petWalkable(p.x, ny)) p.y = ny;
  else { p.tx = null; return true; }
  if (Math.abs(dx) > 0.5) p.face = dx > 0 ? 1 : -1;
  p.walk = (p.walk || 0) + s;
  return false;
}
function updatePets(dtMin, hour) {
  for (const p of petsList()) {
    const home = World.homes[p.homeId];
    if (!home || !home.built || !residentsOf(home).length) continue;
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
      if (d > 22) { p.state = 'walk'; stepPet(p, owner.x - 12 * (owner.facing === 'left' ? -1 : 1), owner.y + 3, owner.path ? 20 : 16, dtMin); }
      else { p.state = owner.task && owner.task.phase === 'do' && owner.pose === 'sit' ? 'sleep' : 'sit'; if (Math.random() < dtMin * 0.004) p.say = { text: R.pick(['Woof!', 'Wuff.', '*pant pant*']), t: 2 }; }
      continue;
    }
    // otherwise pottering about near home: sit a while, wander a bit
    p.t -= dtMin;
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
  if (p.state === 'walk') return Math.floor((p.walk || 0) / 5) % 2 ? S.walk2 : S.walk1;
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
      petsList().push({ id: ++Game.petSeq, kind, coat, name: R.pick(PET_NAMES[kind]), homeId: h.id, x: h.stepX + R.f(-20, 20), y: h.stepY + 10, face: 1, state: 'sit', t: 5, inside: false, since: 1, owner: kind === 'dog' ? (res.find((v) => v.isGrown()) || {}).id ?? null : null });
    }
    return r;
  };
});
