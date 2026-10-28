'use strict';
// ---------------------------------------------------------------------------
// Petitions to the Steward (Stronghold's popularity, Frostpunk's laws, Crusader
// Kings' councils, all cozy). Every couple of days one of the village's
// interests brings a petition: the farmers, the craftsfolk, the elders, the
// young folk, the rift-folk, the little ones. Each is a real choice with a
// cost and a benefit, and each pleases some and disappoints others. A
// "Petition" chip pulses in the top bar until you answer; leave it a day and
// it's taken as a no.
//
// How each interest feels about the Steward is kept on the Steward's Desk.
// Folk whose interest is well listened to are cheerful about it; those who
// feel ignored grumble.
// ---------------------------------------------------------------------------

const FACTIONS = {
  farmers: { label: 'The farmers', of: (v) => ['farmer', 'herder', 'grower', 'orchardist'].includes(v.job) },
  crafts: { label: 'The craftsfolk', of: (v) => ['woodwright', 'miller', 'baker', 'brewer', 'tinker', 'innkeeper'].includes(v.job) },
  elders: { label: 'The elders', of: (v) => v.stage === 'elder' },
  young: { label: 'The young folk', of: (v) => v.stage === 'adult' && v.years() < 50 },
  rift: { label: 'The rift-folk', of: (v) => v.isRiftborn() },
  kids: { label: 'The little ones', of: (v) => v.isChild() },
};
function standing(f) { return (Game.factions && Game.factions[f]) || 0; }
function shiftStanding(f, n) { (Game.factions || (Game.factions = {}))[f] = clamp(standing(f) + n, -100, 100); }
function members(f) { return Game.villagers.filter((v) => !v.leaving && FACTIONS[f].of(v)); }
function fieldSiteNear() {
  for (let r = 0; r < 60; r += 2) for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, x = Math.round(TOWN_CENTRE.x + Math.cos(a) * r), y = Math.round(TOWN_CENTRE.y + Math.sin(a) * r * 0.7); const s = siteFor('field', x, y); if (s && !s.why) return [x, y]; }
  return null;
}
const PETITIONS = [
  {
    id: 'field', from: 'farmers', when: () => fieldSiteNear(), title: 'The farmers ask for a new field',
    text: 'The farmers say the village is outgrowing its barley. They\'d like the Steward\'s leave to clear and plow a new field near the village.',
    opts: [
      { label: 'Plow it', desc: 'A new barley field (cleared scrub gives timber). Farmers +, elders a little put out at losing a pretty meadow.', fn: () => { const s = fieldSiteNear(); if (s) placeSite('field', s[0], s[1]); }, fx: { farmers: 15, elders: -5 } },
      { label: 'Not now', desc: 'Keep the meadow as it is.', fx: { farmers: -10, elders: 4 } },
    ],
  },
  {
    id: 'fell', from: 'crafts', when: () => buildWood() < 30, title: 'The woodwrights want to fell the old copse',
    text: 'Timber is short and the woodwrights have their eye on the old copse at the edge of the village. "It\'d see us through the winter," they say.',
    opts: [
      { label: 'Fell it', desc: '+25 timber at once. The village is a little less lovely; the elders and little ones loved those trees.', fn: () => { Village.produce('wood', 25); for (const s of World.statics.filter((x) => x.gen && x.gen.type === 'tree' && x.gen.kind !== 'apple').sort(() => Math.random() - 0.5).slice(0, 6)) { World.statics.splice(World.statics.indexOf(s), 1); World.block[tIdx(Math.floor(s.x / 16), Math.floor((s.y - 2) / 16))] = 0; } World.appeal = null; }, fx: { crafts: 15, elders: -10, kids: -8 } },
      { label: 'Spare the copse', desc: 'Find timber elsewhere.', fx: { crafts: -10, elders: 6, kids: 4 } },
    ],
  },
  {
    id: 'dance', from: 'young', title: 'The young folk want a dance every Highday',
    text: 'The young folk have put their names to a letter asking for a dance in the party field every Highday evening, with fiddlers and lanterns.',
    opts: [
      { label: 'Dance every Highday', desc: 'A party each Highday (it costs ale and food). Young folk ++; the elders grumble about the noise.', fn: () => { Game.highdayDance = true; }, fx: { young: 20, elders: -8 } },
      { label: 'Now and then', desc: 'Parties as usual.', fx: { young: -8, elders: 4 } },
    ],
  },
  {
    id: 'quiet', from: 'elders', when: () => Village.projects.length > 0, title: 'The elders ask for a quiet hour',
    text: '"All this hammering!" The elders ask that no building be done between noon and two, so a body can have a nap in peace.',
    opts: [
      { label: 'Grant the quiet hour', desc: 'Building slows a little for a few days. Elders ++; craftsfolk mutter.', fn: () => { Game.quietUntil = Game.time + 3 * 1440; }, fx: { elders: 18, crafts: -6 } },
      { label: 'Work must go on', desc: 'The hammering continues.', fx: { elders: -12, crafts: 4 } },
    ],
  },
  {
    id: 'lights', from: 'rift', when: () => Game.villagers.some((v) => v.isRiftborn()) && (Village.stores.scrap || 0) >= 5, title: 'The rift-folk want to string lights in the square',
    text: 'The rift-folk would like to string neon lights round the square, from salvage. "To make it feel a bit like home," they say.',
    opts: [
      { label: 'Light up the square', desc: 'Uses 5 scrap. Rift-folk ++, and the village warms to them a little; the wariest hill-folk don\'t like it.', fn: () => { Village.use('scrap', 5); Game.neonSquare = true; if (typeof story === 'function') story().wary = (story().wary || 1) * 0.95; }, fx: { rift: 20, elders: -6 } },
      { label: 'Keep the square as it is', desc: 'Lanterns only.', fx: { rift: -12, elders: 4 } },
    ],
  },
  {
    id: 'swing', from: 'kids', when: () => Game.villagers.some((v) => v.isChild()) && buildWood() >= 4, title: 'The little ones want a swing',
    text: 'A petition in crayon, signed with handprints: a swing on the party tree, please, pretty please.',
    opts: [
      { label: 'Build the swing', desc: '4 timber. Little ones ++ (and their parents are pleased).', fn: () => { Village.use('wood', 4); Game.swing = true; }, fx: { kids: 25, young: 5 } },
      { label: 'Maybe next year', desc: 'Save the timber.', fx: { kids: -15 } },
    ],
  },
  {
    id: 'contest', from: 'crafts', when: () => (Village.stores.grain || 0) >= 30, title: 'The brewer proposes a brewing contest',
    text: 'The brewers want 20 barley from the Store for a brewing contest at the Badger. "The winning ale goes in the cellar, and everyone gets a taste."',
    opts: [
      { label: 'Let them brew', desc: '−20 barley, +30 ale tomorrow, a merry evening. Craftsfolk +; the farmers wanted that barley for bread.', fn: () => { Village.use('grain', 20); Game.brewContest = Game.day + 1; }, fx: { crafts: 12, young: 6, farmers: -6 } },
      { label: 'Barley is for bread', desc: 'Keep the barley.', fx: { crafts: -8, farmers: 4 } },
    ],
  },
  {
    id: 'pact', from: 'crafts', when: () => (Game.coin || 0) >= 30, title: 'A trade pact with Bree',
    text: 'The Bree carter has offered a pact: for 30 pennies, a wagon will come on Sunday too, every week, and pay a little better.',
    opts: [
      { label: 'Sign the pact', desc: '−30 pennies; a caravan every Sunday as well. Craftsfolk +.', fn: () => { Game.coin -= 30; Game.breePact = true; }, fx: { crafts: 10 } },
      { label: 'No, thank you', desc: 'Keep the pennies.', fx: { crafts: -4 } },
    ],
  },
  {
    id: 'harvest', from: 'farmers', when: () => World.season === 'autumn' || World.season === 'summer', title: 'All hands to the harvest?',
    text: 'The farmers ask that every grown-up lend a hand at the harvest for a day, trades and all.',
    opts: [
      { label: 'All hands', desc: 'For a day, everyone helps on the farms: the fields come in fast, other trades pause. Farmers ++, craftsfolk −.', fn: () => { Game.harvestDay = Game.day + (Game.hour > 14 ? 1 : 0); }, fx: { farmers: 18, crafts: -8 } },
      { label: 'Every trade to its own', desc: 'Things go on as they are.', fx: { farmers: -8, crafts: 4 } },
    ],
  },
  {
    id: 'school', from: 'elders', when: () => Game.villagers.filter((v) => v.isChild()).length >= 4, title: 'Longer school hours',
    text: 'The elders think the little ones run wild. They\'d like the story circle to run longer every day.',
    opts: [
      { label: 'More lessons', desc: 'Children learn faster for a week; the little ones aren\'t keen.', fn: () => { Game.schoolUntil = Game.day + 7; }, fx: { elders: 12, kids: -12 } },
      { label: 'Let them play', desc: 'Childhood is short.', fx: { elders: -8, kids: 10 } },
    ],
  },
];
// the effects that need a hook
{
  patch(Villager.prototype, 'score', (score) => function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s <= 0) return s;
    const mul = (n, f) => { s *= f; if (ex) ex.mul.push([n, f]); };
    if (Game.harvestDay === Game.day && this.isGrown() && h >= 7 && h < 18) {
      if (['work_farm', 'work_allot', 'work_orchard', 'work_leaf'].includes(a.id)) mul('all hands to the harvest', 4);
      else if (a.job) mul('all hands to the harvest', 0.2);
    }
    if (Game.schoolUntil >= Game.day && a.id === 'school') mul('longer lessons', 1.8);
    return s;
  }, 'petitions');
  // harvest helpers: everyone may work the fields that day
  for (const k of ['work_farm', 'work_allot']) if (ACTIONS[k]) { const av = ACTIONS[k].avail; ACTIONS[k].jobs = (ACTIONS[k].jobs || []).concat(Object.keys(JOBS)); ACTIONS[k].avail = function (v, h) { if (v.job !== 'farmer' && Game.harvestDay !== Game.day) return false; return av ? av(v, h) : true; }; }
  const wp = workProject;
  workProject = function (v, p) { if (Game.quietUntil > Game.time && Game.hour >= 12 && Game.hour < 14) return; return wp(v, p); };
  const sf = stateFeelings;
  stateFeelings = function (v) {
    const out = sf(v);
    if (v.stage === 'baby') return out;
    for (const f in FACTIONS) {
      if (!FACTIONS[f].of(v)) continue;
      const st = standing(f);
      if (st >= 40) out.push([`The Steward listens to ${FACTIONS[f].label.replace('The ', 'the ')}`, 0.04]);
      else if (st <= -40) out.push([`The Steward ignores ${FACTIONS[f].label.replace('The ', 'the ')}`, -0.05]);
    }
    if (Game.swing && v.isChild()) out.push(['The swing on the party tree!', 0.04]);
    if (Game.neonSquare && v.isRiftborn()) out.push(['Neon lights in the square', 0.03]);
    return out;
  };
}

// --- Bringing and answering petitions ------------------------------------------
function petitionDue() {
  if (Game.petition || Game.day < 3) return;
  if (Game.day - (Game.lastPetitionDay ?? 0) < 2 || !R.chance(0.7)) return;
  const done = Game.petitionsSeen || [];
  const opts = PETITIONS.filter((p) => (!p.when || p.when()) && members(p.from).length && !done.slice(-4).includes(p.id));
  if (!opts.length) return;
  const p = R.pick(opts);
  Game.petition = { id: p.id, day: Game.day, until: Game.time + 1440 };
  Game.lastPetitionDay = Game.day;
  (Game.petitionsSeen || (Game.petitionsSeen = [])).push(p.id);
  chronicle(`📜 A petition for the Steward: ${p.title.charAt(0).toLowerCase() + p.title.slice(1)}. (Click the Petition chip at the top.)`, 'info');
}
function answerPetition(i) {
  const pt = Game.petition && PETITIONS.find((p) => p.id === Game.petition.id);
  if (!pt) return;
  const o = pt.opts[i];
  if (o.fn) o.fn();
  for (const [f, n] of Object.entries(o.fx || {})) shiftStanding(f, n);
  Game.petition = null;
  chronicle(`${pt.title}: the Steward said "${o.label}".`, 'info');
  for (const [f, n] of Object.entries(o.fx || {})) for (const v of members(f)) if (!v.inside && R.chance(0.25)) v.say(n > 0 ? R.pick(['Hurrah for the Steward!', 'That\'s more like it.', 'Well said!']) : R.pick(['Hmph.', 'Typical.', 'Nobody listens to us.']), 2.4);
}
function openPetition() {
  const pt = Game.petition && PETITIONS.find((p) => p.id === Game.petition.id);
  if (!pt) return;
  const el = $('moot');
  el.querySelector('h2').textContent = pt.title;
  el.querySelector('.moot-text').innerHTML = `${escapeHtml(pt.text)}<div class="sub" style="margin-top:6px">From ${escapeHtml(FACTIONS[pt.from].label.toLowerCase())} (${members(pt.from).length} folk). Their feeling about the Steward: ${standingWord(standing(pt.from))}.</div>`;
  const box = el.querySelector('.moot-opts');
  box.innerHTML = '';
  pt.opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'moot-opt';
    b.innerHTML = `<b>${escapeHtml(o.label)}</b><span>${escapeHtml(o.desc)}</span>`;
    b.addEventListener('click', () => { el.hidden = true; Game.introOpen = false; answerPetition(i); });
    box.appendChild(b);
  });
  const later = document.createElement('button');
  later.className = 'moot-opt later'; later.innerHTML = '<b>Think it over</b><span>Decide later (by tomorrow, or it\'s a no).</span>';
  later.addEventListener('click', () => { el.hidden = true; Game.introOpen = false; });
  box.appendChild(later);
  el.hidden = false; Game.introOpen = true;
}
function standingWord(s) { return s >= 60 ? 'devoted' : s >= 25 ? 'pleased' : s > -25 ? 'neutral' : s > -60 ? 'grumbling' : 'fed up'; }
function petitionTick() {
  const pe = Game.petition;
  if (pe && Game.time > pe.until) { const pt = PETITIONS.find((p) => p.id === pe.id); if (pt) answerPetition(pt.opts.length - 1); }
  // Highday dances, a brewing contest's ale, the Bree pact's Sunday wagon
  if (Game.highdayDance && isRestDay(Game.day) && Game.hour >= 18 && !Game.party.on && !Game.raining) startParty('highday');
  if (Game.brewContest === Game.day && Game.hour >= 12) { Village.produce('ale', 30); Game.brewContest = null; chronicle('The brewing contest at the Badger is decided! The winning ale is in the cellar, and everyone had a taste.', 'party'); }
  if (Game.breePact && weekday(Game.day) === 'Sunday' && Game.hour >= 8 && Game.hour < 9 && !caravan()) arriveCaravan();
}

window.addEventListener('DOMContentLoaded', () => {
  addHook('onHour', (h) => { if (h === 10 || h === 15) petitionDue(); petitionTick(); });
  $('hud-petition').addEventListener('click', () => queueMoot(openPetition));
  const hud = updateHUD;
  updateHUD = function () { hud(); const el = $('hud-petition'); el.hidden = !Game.petition; };
  // the interests, on the Steward's Desk
  const sh = stewardHTML;
  stewardHTML = function () {
    const h = sh();
    const rows = Object.keys(FACTIONS).filter((f) => members(f).length).map((f) => { const s = standing(f); return `<div class="fac"><span>${FACTIONS[f].label} <small class="sub">(${members(f).length})</small></span>${bar((s + 100) / 200, s >= 25 ? 'good' : s > -25 ? 'mid' : 'low')}<span class="sub">${standingWord(s)}</span></div>`; }).join('');
    const pet = Game.petition ? '<div class="note">A petition is waiting for your answer. <button id="st-petition">Read it</button></div>' : '';
    const block = `<h3>The village's interests</h3>${pet}<div class="facs">${rows}</div><div class="sub">How each interest feels about the Steward, from how you've answered their petitions. Pleased folk are cheerful about it; fed-up folk grumble.</div>`;
    const i = h.indexOf('<h3>Economy</h3>');
    return i >= 0 ? h.slice(0, i) + block + h.slice(i) : h + block;
  };
  const hook = hookStewardUI;
  hookStewardUI = function (body) { const b = body.querySelector('#st-petition'); if (b) b.addEventListener('click', () => { $('village').hidden = true; openPetition(); }); return hook(body); };
  addHook('newVillage', () => { Game.factions = {}; Game.petition = null; Game.petitionsSeen = []; Game.lastPetitionDay = 0; Game.highdayDance = false; Game.swing = false; Game.neonSquare = false; Game.breePact = false; });
});

// --- What the petitions leave on the map ---------------------------------------
// neon strung round the square, glowing after dark
window.addEventListener('DOMContentLoaded', () => {
  const cl = collectLights;
  collectLights = function () {
    const L = cl();
    if (Game.neonSquare && Game.darkness > 0.15) {
      const cols = ['#ff3aa8', '#3af0ff', '#ffe04a', '#7aff5a'];
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; L.push({ x: (PLAZA.cx + Math.cos(a) * 5) * 16, y: (PLAZA.cy + Math.sin(a) * 4.2) * 16 - 10, r: 16 * (0.9 + Math.sin(tReal * 3 + i) * 0.1), a: 0.75, col: cols[i % 4] }); }
    }
    return L;
  };
});
// the swing on the party tree
function makeSwing() {
  const rows = Array(30).fill('k........k').concat(['wwwwwwwwww', 'WWWWWWWWWW']);
  return finishSprite(rows, { k: '#c8b890', w: '#9a6a40', W: '#6e4628' });
}
function placeSwing() {
  if (!World._addStatic || World.swingSpot) return;
  const x = (PARTY.treeX + 1.6) * 16, y = (PARTY.treeY + 1) * 16 + 10;
  World._addStatic(makeSwing(), x, y, { sortBias: 2 });
  World.swingSpot = makeSpot(x, y + 1, 'down', 'sit', 'swing');
}
ACTIONS.swing = {
  id: 'swing', label: 'On the swing', icon: 'heart', sat: { bored: -0.6, lonely: -0.1 }, dur: 20, pose: 'sit', outdoor: true, stages: ['child'],
  avail: () => !!World.swingSpot && !World.swingSpot.occ,
  extra: () => 0.25,
  time: (h) => (h >= 8 && h < 19 ? 1 : 0.02),
  target: () => (World.swingSpot && !World.swingSpot.occ ? { spot: World.swingSpot } : null),
  tick: (v) => { if (Math.random() < 0.02) v.say(R.pick(['Wheee!', 'Higher!', 'Look, no hands!']), 2); },
};
ACTION_NAMES.swing = 'Swinging';
window.addEventListener('DOMContentLoaded', () => {
  addHook('onHour', (h) => { if (Game.swing && !World.swingSpot) placeSwing(); });
  addHook('newVillage', () => { World.swingSpot = null; });
});
