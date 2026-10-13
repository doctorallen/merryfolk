'use strict';
// ---------------------------------------------------------------------------
// The Lamplighter's Children: the story behind the rifts.
//
// Centuries ago Mungo Fernsby, a tinker of Thistledown, walked into a flash of
// green lightning on the Long Meadow carrying a copper kettle, and was never
// seen again. He came out in a cold, dark world, and there he built a kettle-
// dynamo and a patient tending-engine he called the Lamplighter. Around it grew
// Neverdark, a city that never turned its lights off and so never learned to
// rest. Now Neverdark's power is failing (the Long Dim: "low battery" is
// meant quite literally), and the fading Lamplighter remembers Mungo's "place
// where the dark is soft" and is sending its children there. The rift-folk
// aren't invaders. They're children sent somewhere safe.
//
// The village learns this in fragments (a kettle sigil on their jackets, a
// city lullaby that's an old hill song, a coin stamped with a round door,
// whispers on the Relay, a name in an old ledger) and its story moves through
// stages, each with a Chronicle beat and a change in how things work. Twice
// the Steward must decide: how to treat the newcomers (a Moot), and at the
// end, what to do when the Long Dim comes.
//
// Each rift-born has a story of their own: a memory of home, someone they lost
// (who sometimes comes through a later rift), a hidden skill the village comes
// to value, and a turning point when a wary neighbour becomes a friend.
// Hill-folk invite rift-folk to supper. The two peoples teach each other
// their customs (mushroom ramen, the Low Battery Blues, second breakfast) and
// once enough folk know one, it's a Thistledown tradition.
// ---------------------------------------------------------------------------

const RIFT_STAGES = [
  { name: 'Clear skies' },
  { name: 'Strange weather', beat: 'The sky tore open at teatime. Nobody was hurt, though the scones never recovered.' },
  { name: 'Folk out of the sky', beat: 'Three strangers from the sky and not a roof among them. There\'s talk of nothing else at the Badger. The Steward has called a Moot.' },
  { name: 'The first kettle', beat: 'Someone brought the rift-folk a pot of tea. It\'s a small thing, but the village noticed.' },
  { name: 'Lights in the hollow', beat: 'The rift-folk\'s machines are turning on river and wind. The lane by their camp is bright enough to read by, and three people did.' },
  { name: 'The Relay sings', beat: 'The Relay hums at dusk, half static and half lullaby. The old folk stop to listen without knowing why.' },
  { name: 'Mungo\'s name', beat: 'Someone opened the old mathom-chest at Bag-and-Barrel Hall and found a ledger with a name in it. Thistledown sent the first stranger into the world long before the world sent any back.' },
  { name: 'Two hearths', beat: 'Two hearths, one village: half the rift-folk are under a roof of their own, and a child has been born to both peoples. There was a feast, with neon bunting.' },
  { name: 'The Long Dim', beat: 'Every night now the rifts gutter like candles near the end of the wick. Something old is remembering the way home. The Steward has called a Moot.' },
];
const FRAGMENTS = {
  sigil: { title: 'The kettle sigil', text: 'Every one of the rift-folk wears the same mark sewn on a sleeve or etched on a gadget: a little copper kettle. "It\'s the city\'s mark," they say. "It\'s always been the kettle."' },
  lullaby: { title: 'A lullaby', text: 'At the Mersday sing-song one of the rift-folk hummed a Neverdark lullaby, and old folk in the corner sang the words. It\'s "Down by the Willow Lamp". Their grannies sang it.' },
  coin: { title: 'A coin with a round door', text: 'Scavenged from a rift scar: a city coin. On one side, circuitry; on the other, unmistakably, a round green door.' },
  relay: { title: 'Whispers on the Relay', text: 'At dusk the Relay picks up a voice under the static: "...lamp...lighter... is anyone... the kettle\'s gone cold..."' },
  saint: { title: 'Saint Mungo', text: '"Saint Mungo of the First Lamp," said one of the rift-folk, pointing at a portrait in a hill-family parlour. "He\'s on our coins." "He\'s on our debt ledger," said the hill-folk.' },
  gold: { title: 'Golden edges', text: 'On nights when the dynamos and turbines run strong, the rifts flicker gold at the edges instead of magenta. Something on the other side steadies when Thistledown\'s power reaches it.' },
  ledger: { title: 'The ledger', text: 'Mungo Fernsby, tinker. Walked into green lightning on the Long Meadow carrying a copper kettle. Not returned. Owes the Crooked Kettle threepence.' },
  voice: { title: 'The Lamplighter\'s voice', text: '"Mungo told me of a place where the dark was soft. I sent my children to find it. Thank you for keeping the lamps low."' },
};
const ARC_SKILLS = {
  courier: { label: 'a courier', job: 'postie', skill: 'lore', turn: (v, o) => `${v.first} carried a letter through the rain to ${o.first}${o.memories.some((m) => /made my excuses/.test(m.t)) ? `, who'd once crossed the lane to avoid ${v.pron.them}` : ''}. ${o.first} made ${v.pron.them} a pot of tea, and they sat till the kettle went cold.` },
  gridtech: { label: 'a grid-tech', job: 'miller', skill: 'tinkering', turn: (v, o) => `${v.first} fixed the squeak in ${o.first}'s mill-wheel that nobody had fixed in forty years. "Your river does what our whole grid did," ${v.pron.they} said, "and it never sends an invoice."` },
  medic: { label: 'a street medic', job: 'herbalist', skill: 'herbalism', turn: (v, o) => (Game.villagers.some((k) => !k.isGrown() && k.parents.includes(o.id)) ? `${v.first} sat up all night with ${o.first}'s poorly little one, by gadget-light and willow-bark tea. ${o.first} hasn't a word to say against the rift-folk now.` : `${v.first} set ${o.first}'s sprained wrist with a gadget and a splint, gentler than any herbalist. ${o.first} hasn't a word to say against the rift-folk now.`) },
  cook: { label: 'a noodle-stall cook', job: 'innkeeper', skill: 'cooking', turn: (v, o) => `${v.first} cooked ${o.first} a bowl of mushroom noodles. ${o.first} had seconds, then thirds, then asked for the recipe.` },
  teacher: { label: 'a schoolteacher', job: 'storyteller', skill: 'lore', turn: (v, o) => `${v.first} taught ${Game.villagers.some((k) => !k.isGrown() && k.parents.includes(o.id)) ? o.first + "'s children" : 'the little ones'} to count in binary with acorns. ${o.first} came to complain and stayed to learn.` },
  grower: { label: 'a rooftop grower', job: 'farmer', skill: 'farming', turn: (v, o) => `${v.first} showed ${o.first} how the city grew lettuces on rooftops under lamps. ${o.first} showed ${v.pron.them} real rain. They both said "well I never" at the same time.` },
};
const HOME_MEMORIES = ['rain on neon', 'the noodle stall under the overpass', 'the hum of the city at night', 'the rooftop gardens', 'trains that never stopped', 'the Lamplighter\'s glow on the clouds', 'a window full of screens', 'the night market'];
const LOST_REL = ['brother', 'sister', 'mother', 'father', 'partner', 'best friend', 'daughter', 'son'];
const CUSTOMS = {
  ramen: { from: 'rift', name: 'mushroom ramen', line: 'Mushroom ramen at the Badger! Who knew?', mood: ['Slurped a bowl of mushroom ramen', 0.05] },
  blues: { from: 'rift', name: 'the Low Battery Blues', line: '♪ Battery\'s low and the night is long... ♪', mood: ['Sang the Low Battery Blues', 0.05] },
  signal: { from: 'rift', name: 'saying "full signal" for "happy"', line: 'Full signal, this weather!', mood: null },
  bunting: { from: 'rift', name: 'neon bunting at parties', line: 'Look at the bunting glow!', mood: ['Danced under neon bunting', 0.04] },
  breakfast: { from: 'hill', name: 'second breakfast', line: 'Second breakfast! I\'ve run on one boot-up meal my whole life, like a fool.', mood: ['Discovered second breakfast', 0.06] },
  willow: { from: 'hill', name: 'the Willow Lamp song', line: '♪ Down by the willow lamp, where the river runs slow... ♪', mood: null },
  mayday: { from: 'hill', name: 'the maypole dance', line: 'Left over right, under and round!', mood: null },
};
MOODLETS.reunion = ['Reunited with {x}!', 0.35, 4320, ['I thought I\'d never see {x} again.', '{x} is here. {x} is really here.']];
MOODLETS.turned = ['Made a true friend in {x}', 0.15, 2880, ['I think {x} likes me now. Really likes me.']];
MOODLETS.supper = ['Had supper with {x}', 0.08, 600, ['What a supper that was at {x}\'s.']];
MOODLETS.uneasy = ['Uneasy skies', -0.05, 1440, ['I don\'t like the look of that sky.']];
MOODLETS.welcomed = ['The village voted to welcome us', 0.1, 2880, ['They voted for us. For us!']];
MOODLETS.grumble = ['Strangers housed before our own', -0.06, 1440, ['Our Tom\'s been waiting two years for a hole.']];

function story() { return Game.riftStory || (Game.riftStory = { stage: 0, frags: [], customs: {}, policy: null, finale: null, suppers: 0 }); }
function riftBorn() { return Game.villagers.filter((v) => v.isRiftborn() && !v.leaving); }

// --- Fragments --------------------------------------------------------------------
function findFragment(k, by) {
  const S = story();
  if (S.frags.includes(k)) return;
  S.frags.push(k);
  const F = FRAGMENTS[k];
  chronicle(`A clue to the rifts: ${F.title}. ${F.text}`, 'rift');
  if (by && !by.inside) by.say(R.pick(['Now that\'s curious...', 'Well I never.', 'Hold on. Hold ON.']), 3);
  if (typeof addNews === 'function') addNews(`They're saying ${F.title.toLowerCase()} has something to do with the rifts.`, 'rift');
}

// --- Character arcs ------------------------------------------------------------------
function giveArc(v) {
  if (v.arc || !v.isRiftborn() || v.parents.length) return;
  const sk = R.pick(Object.keys(ARC_SKILLS));
  const rel = R.pick(LOST_REL);
  const sex = /mother|sister|daughter/.test(rel) ? 'f' : /father|brother|son/.test(rel) ? 'm' : (R.chance(0.5) ? 'f' : 'm');
  const used = new Set(Game.villagers.map((o) => o.first).concat(Game.villagers.filter((o) => o.arc).map((o) => o.arc.lost.name)));
  const pool = (sex === 'f' ? RIFT_NAMES_F : RIFT_NAMES_M).filter((n) => !used.has(n));
  v.arc = { home: R.pick(HOME_MEMORIES), lost: { name: R.pick(pool.length ? pool : (sex === 'f' ? RIFT_NAMES_F : RIFT_NAMES_M)), rel, sex, found: false }, skill: sk, turned: false };
  v.skills[ARC_SKILLS[sk].skill] = Math.max(v.skills[ARC_SKILLS[sk].skill] || 0, 25 + Math.random() * 15);
  v.remember(`I keep thinking of ${v.arc.home}, and of my ${v.arc.lost.rel}, ${v.arc.lost.name}. I hope they're safe.`, -1);
}
{
  const jf = jobFit;
  jobFit = function (v, j) { let s = jf(v, j); if (v.arc && ARC_SKILLS[v.arc.skill].job === j) s += 25; return s; };
  const af = arriveFromRift;
  arriveFromRift = function (r) {
    const v = af(r);
    if (!v) return v;
    // sometimes it's the very person someone's been missing (of the right sex, and age)
    const waiting = riftBorn().filter((o) => o !== v && o.arc && !o.arc.lost.found && (o.arc.lost.sex || v.genes.sex) === v.genes.sex && v.isGrown() && o.isGrown() && !Game.villagers.some((x) => x !== v && x.first === o.arc.lost.name));
    // (a name the wizard keeps in mind is likelier to come through: riftplay.js; a trip to Neverdark sets r.reunite: journey.js)
    if (waiting.length && R.chance((r.reunite ?? 0.35) + (typeof reunionBoost === 'function' ? reunionBoost() : 0))) {
      const kept = typeof keptNames === 'function' ? waiting.filter((x) => keptNames().includes(x.arc.lost.name)) : [];
      const o = R.pick(kept.length ? kept : waiting), rel = o.arc.lost.rel, oldName = v.first;
      v.first = o.arc.lost.name; o.arc.lost.found = true;
      // parents are older, children younger
      if (/mother|father/.test(rel)) v.age = Math.max(v.age, o.age + R.f(6, 10));
      if (/son|daughter/.test(rel)) v.age = Math.min(v.age, Math.max(CHILD_DAYS + 0.5, o.age - R.f(6, 10)));
      v.stage = v.lifeStage(); v.refreshSprites();
      if (/mother|father/.test(rel)) o.parents.push(v.id);
      if (/son|daughter/.test(rel)) v.parents.push(o.id);
      if (rel === 'partner' && !o.spouse && !v.spouse) { o.spouse = v.id; v.spouse = o.id; o.sweetheart = v.id; v.sweetheart = o.id; }
      // the arrival line already went out under the old name
      for (const l of Game.log.slice(0, 3)) if (l.text.includes(oldName)) l.text = l.text.split(oldName).join(v.first);
      if (typeof renderLog === 'function') renderLog();
      giveArc(v);
      const back = { mother: o.genes.sex === 'f' ? 'daughter' : 'son', father: o.genes.sex === 'f' ? 'daughter' : 'son', son: v.genes.sex === 'f' ? 'mother' : 'father', daughter: v.genes.sex === 'f' ? 'mother' : 'father', sister: o.genes.sex === 'f' ? 'sister' : 'brother', brother: o.genes.sex === 'f' ? 'sister' : 'brother', partner: 'partner', 'best friend': 'best friend' }[rel] || 'family';
      if (v.arc) v.arc.lost = { name: o.first, rel: back, sex: o.genes.sex, found: true };
      v.memories = v.memories.filter((m) => !/I hope they're safe/.test(m.t));
      o.memories = o.memories.filter((m) => !/I hope they're safe/.test(m.t));
      o.rel[v.id] = 0.95; v.rel[o.id] = 0.95;
      feel(o, 'reunion', v.first); feel(v, 'reunion', o.first);
      o.remember(`${v.first} came through the rift. My ${rel}, safe and sound!`, 3); v.remember(`Found ${o.first} again, here of all places.`, 3);
      o.lost = Math.max(0, (o.lost || 0) - 0.4);
      // they live together from now on
      if (o.homeId >= 0 && residentsOf(o.home()).length < HOME_CAP(o.home())) moveHome(v, o.home());
      else if (v.homeId >= 0 && o.homeId < 0) moveHome(o, v.home());
      chronicle(`${o.first} saw who stepped out of the rift and ran across the meadow: it was ${v.first}, ${o.pron.their} ${rel}, safe and sound. Half the village cried, and the other half pretended not to.`, 'rift');
    } else giveArc(v);
    if (story().frags.length === 0 || (R.chance(0.15) && !story().frags.includes('sigil'))) findFragment('sigil', v);
    return v;
  };
}
// Turning points: a once-wary neighbour becomes a real friend.
function arcsDaily() {
  for (const v of riftBorn()) {
    giveArc(v);
    if (!v.arc || v.arc.turned || !v.isGrown()) continue;
    const f = Object.entries(v.rel).map(([id, r]) => [Game.villagers.find((o) => o.id === +id), r]).filter(([o, r]) => o && !o.isRiftborn() && o.isGrown() && r >= (typeof turnThreshold === 'function' ? turnThreshold(v, o) : 0.6) && o.spouse !== v.id && v.spouse !== o.id && o.sweetheart !== v.id && (o.love[v.id] || 0) < 0.3 && !related(o, v)).sort((a, b) => b[1] - a[1])[0];
    if (!f) continue;
    const o = f[0];
    v.arc.turned = o.id;
    chronicle(ARC_SKILLS[v.arc.skill].turn(v, o), 'rift');
    feel(v, 'turned', o.first); feel(o, 'turned', v.first);
    v.lost = Math.max(0, (v.lost || 0) - 0.3);
    story().wary = (story().wary || 1) * 0.95;
  }
}

// --- Supper invitations -----------------------------------------------------------------
ACTIONS.supper_guest = {
  id: 'supper_guest', label: 'Invited to supper', icon: 'plate', sat: { hunger: -0.7, lonely: -0.6, bored: -0.3 }, dur: 55, pose: 'inside', stages: AWAKE, queued: true,
  label2: (v) => (v.task && v.task.target.host ? `At supper with the ${v.task.target.host.surname}s` : 'Invited to supper'),
  target: (v, h, extra) => (extra && extra.home && extra.home.built ? { building: extra.home, host: extra.host } : null),
  done: (v, task) => {
    const host = task.target.host, home = task.target.building;
    feel(v, 'supper', host.first); feel(host, 'supper', v.first);
    for (const o of residentsOf(home)) if (o !== v && o.stage !== 'baby') { o.bond(v, 0.07); }
    const k = pickFood(v, home.pantry, PANTRY_KINDS); if (k) home.pantry[k]--;
    const S = story(); S.suppers = (S.suppers || 0) + 1;
    if (S.suppers === 1) chronicle(`The ${host.surname}s asked ${v.name()} round for supper, the first hill-folk table to set a place for one of the rift-folk. "Is tea a stimulant or a ritual?" ${v.first} asked. "Yes," said ${host.first}.`, 'rift');
    // swapping customs over the table
    if (R.chance(0.4)) teachCustom(R.chance(0.5) ? v : host, R.chance(0.5) ? host : v);
  },
};
ACTION_NAMES.supper_guest = 'Supper invitations';
function suppersDaily() {
  if (story().stage < 2) return;
  const guests = riftBorn().filter((v) => v.isGrown() && !v.queue.length);
  for (const g of guests) {
    if (!R.chance(0.35)) continue;
    const host = Game.villagers.filter((o) => !o.isRiftborn() && o.isGrown() && o.homeId >= 0 && o.homeId !== g.homeId && ((o.rel[g.id] || 0) > 0.3 || (story().policy === 'sponsor' && o.genes.sociability > 0.55)))
      .sort((a, b) => (b.rel[g.id] || 0) - (a.rel[g.id] || 0))[0];
    if (!host) continue;
    g.queue.push({ a: ACTIONS.supper_guest, extra: { home: host.home(), host } });
  }
}

// --- Customs and traditions -----------------------------------------------------------------
function teachCustom(a, b) {
  const S = story();
  const opts = Object.keys(CUSTOMS).filter((k) => (CUSTOMS[k].from === 'rift' ? a.isRiftborn() || a.tech > 0.5 : !a.isRiftborn() || a.tech < 0.5) && !(S.customs[k] && S.customs[k].knowers.includes(b.id)));
  if (!opts.length) return;
  const k = R.pick(opts);
  const c = S.customs[k] || (S.customs[k] = { knowers: [a.id], tradition: false });
  if (!c.knowers.includes(a.id)) c.knowers.push(a.id);
  if (!c.knowers.includes(b.id)) c.knowers.push(b.id);
  if (!a.inside) a.say(CUSTOMS[k].line, 3, { to: b });
  if (!c.tradition && c.knowers.filter((id) => Game.villagers.some((v) => v.id === id)).length >= 8) {
    c.tradition = true;
    chronicle(`${CUSTOMS[k].name.charAt(0).toUpperCase() + CUSTOMS[k].name.slice(1)} is a Thistledown tradition now, ${CUSTOMS[k].from === 'rift' ? 'brought through the rifts' : 'and the rift-folk have taken to it like ducks to water'}.`, 'rift');
    story().wary = (story().wary || 1) * 0.92;
  }
}
// customs spread between friends who spend time together
function customsTick() {
  const S = story();
  for (const k in S.customs) {
    const c = S.customs[k];
    for (const id of c.knowers.slice()) {
      const a = Game.villagers.find((v) => v.id === id);
      if (!a) continue;
      const b = Game.villagers.find((o) => o !== a && o.stage !== 'baby' && !c.knowers.includes(o.id) && (a.inside ? o.inside === a.inside : !o.inside && dist(o.x, o.y, a.x, a.y) < 50));
      if (b && R.chance(0.04)) { c.knowers.push(b.id); if (c.tradition && CUSTOMS[k].mood && R.chance(0.3)) feel(b, 'gossip', CUSTOMS[k].name); }
    }
    if (!c.tradition && c.knowers.filter((id) => Game.villagers.some((v) => v.id === id)).length >= 8) { c.tradition = true; chronicle(`${CUSTOMS[k].name.charAt(0).toUpperCase() + CUSTOMS[k].name.slice(1)} is a Thistledown tradition now.`, 'rift'); story().wary = (story().wary || 1) * 0.92; }
  }
}
function tradition(k) { const c = story().customs[k]; return !!(c && c.tradition); }

// --- Wariness eases as the story goes on -----------------------------------------------------
{
  const rw = riftWary;
  riftWary = function (v) { return rw(v) * (story().wary || 1); };
  // a rift-hill friendship chat sometimes swaps a custom, or turns up a clue
  patch(Villager.prototype, 'finish', (fin) => function () {
    const t = this.task;
    if (t && t.a.id === 'chat' && t.partner && !t.data.quarrel && this.isRiftborn() !== t.partner.isRiftborn() && (this.rel[t.partner.id] || 0) > 0.35) {
      if (R.chance(0.25)) teachCustom(this, t.partner);
      const elder = [this, t.partner].find((o) => o.stage === 'elder');
      if (elder && R.chance(0.3) && story().stage >= 3) findFragment('saint', elder);
    }
    if (t && (t.a.id === 'scavenge' || t.a.id === 'work_salvage') && R.chance(0.12)) findFragment('coin', this);
    return fin.call(this);
  }, 'riftstory');
  // the tradition of second breakfast etc. in what folk say
  patch(Villager.prototype, 'chatter', (ch) => function () {
    const ts = Object.keys(CUSTOMS).filter((k) => tradition(k) && story().customs[k].knowers.includes(this.id));
    if (ts.length && this.stage !== 'baby' && R.chance(0.12)) { this.say(CUSTOMS[R.pick(ts)].line, undefined, { think: true }); return; }
    return ch.call(this);
  }, 'riftstory');
}

// --- The First Moot, and the Long Dim: the Steward decides -------------------------------------
function askMoot(title, text, options) {
  const el = $('moot');
  el.querySelector('h2').textContent = title;
  el.querySelector('.moot-text').textContent = text;
  const box = el.querySelector('.moot-opts');
  box.innerHTML = '';
  for (const o of options) {
    const b = document.createElement('button');
    b.className = 'moot-opt';
    b.innerHTML = `<b>${escapeHtml(o.label)}</b><span>${escapeHtml(o.desc)}</span>`;
    if (o.disabled) { b.disabled = true; b.classList.add('disabled'); }
    else b.addEventListener('click', () => { el.hidden = true; Game.introOpen = false; o.fn(); if (!$('village').hidden) renderVillage(); });
    box.appendChild(b);
  }
  el.hidden = false; Game.introOpen = true;
}
function firstMoot() {
  askMoot('The First Moot: the folk from the sky', 'The whole village has crammed into the Tipsy Badger. There are strangers sleeping under hedges, and every opinion in Thistledown is being aired at once. The Steward must decide how Thistledown will treat the rift-folk.', [
    { label: 'Open doors', desc: 'Any empty hole goes to a homeless rift-born at once. Fast, kind, and some old folk will grumble about strangers housed before their own.', fn: () => setRiftPolicy('open') },
    { label: 'Sponsor a stranger', desc: 'Each rift-born is matched with a willing household to lodge with and be invited to supper. Slower, but friendships form quickly.', fn: () => setRiftPolicy('sponsor') },
    { label: 'Wait and see', desc: 'Leave it to folk to make up their own minds. Rough sleeping goes on longer; nobody is pushed.', fn: () => setRiftPolicy('wait') },
  ]);
}
function setRiftPolicy(p) {
  const S = story(); S.policy = p;
  const word = { open: 'open their doors to the rift-folk', sponsor: 'sponsor the rift-folk, a household for each', wait: 'wait and see' }[p];
  chronicle(`The Moot has spoken: Thistledown will ${word}.`, 'rift');
  for (const v of riftBorn()) if (p !== 'wait') feel(v, 'welcomed');
  if (p === 'open') for (const o of Game.villagers) if (!o.isRiftborn() && o.stage === 'elder' && riftWary(o) > 0.3) feel(o, 'grumble');
  if (p === 'sponsor') S.wary = (S.wary || 1) * 0.9;
}
function longDimMoot() {
  const power = builtCivic('dynamo') && builtCivic('turbine');
  askMoot('The Long Dim', 'The rifts gutter every night. Through them, faintly, the rift-folk can see their city going dark, light by light. On the Relay, the old voice says: "Mungo told me of a place where the dark was soft." What will Thistledown do?', [
    { label: 'Hearthlink', desc: power ? 'Lend the village\'s river and wind power through the Relay. The rifts become steady golden doors: visits both ways, letters from Neverdark, and the rift-folk can go home and come back. Hearths burn a little more timber in winter.' : 'Needs the River Dynamo and the Wind Turbine built first.', disabled: !power, fn: () => finale('hearthlink') },
    { label: 'Soft close', desc: 'Sing the rifts shut on Midsummer\'s Eve. No more arrivals, and no way back: the rift-folk become Thistledowners for good, and the longing for home fades.', fn: () => finale('softclose') },
    ...(power ? [] : [{ label: 'Not yet', desc: 'Ask the Moot again once the River Dynamo and Wind Turbine are built (or in a few days).', fn: () => { const S = story(); S.stage = 7; S.stageDay = Game.day; chronicle('The Moot broke up without deciding. "Build the dynamo and the turbine first," said the tinkers, "then we\'ll talk."', 'rift'); } }]),
    { label: 'Let it drift', desc: 'Do nothing. The rifts come and go as they will, and the Lamplighter fades slowly on the other side.', fn: () => finale('drift') },
  ]);
}
function finale(k) {
  const S = story(); S.finale = k;
  if (k === 'hearthlink') {
    chronicle('Thistledown lent its sunshine, river and wind to a city that had forgotten them. It was the largest loan the village ever made, and nobody asked for it back. The rifts glow gold now, steady as doorways, and Neverdark has seen its first stars.', 'rift');
    for (const v of riftBorn()) { v.lost = 0; feel(v, 'era', 'bridge between two worlds'); }
  } else if (k === 'softclose') {
    Village.riftsOn = false;
    chronicle('On Midsummer\'s Eve the whole village sang the Willow Lamp song on the Long Meadow, and the rifts closed softly, one by one, like eyes going to sleep. The rift-folk are Thistledowners now, for good.', 'rift');
    for (const v of riftBorn()) { v.lost = 0; v.remember('The rifts closed. This is home now, for always.', 1); }
  } else chronicle('The Moot decided to let things be. The rifts come and go; on the other side, something old goes on fading.', 'rift');
}
// Hearthlink: visitors through the golden doors now and then, and letters from Neverdark.
function hearthlinkDaily() {
  if (story().finale !== 'hearthlink') return;
  const rb = riftBorn().filter((v) => v.isGrown());
  if (rb.length && R.chance(0.5)) postLetter({ id: null, first: 'Neverdark' }, R.pick(rb), 'away');
}

// --- Stages ---------------------------------------------------------------------------------------
function storyTick() {
  const S = story(), rb = riftBorn();
  const housed = rb.filter((v) => v.homeId >= 0).length;
  const next = S.stage + 1;
  const ok = {
    1: () => (Game.stats.rifts || 0) > 0 || rb.length > 0,
    2: () => rb.length >= 3,
    3: () => rb.some((v) => Game.villagers.some((o) => !o.isRiftborn() && (o.rel[v.id] || 0) > 0.45)) || S.suppers > 0,
    4: () => builtCivic('dynamo') || builtCivic('turbine') || (World.rifts.length === 0 && Game.stats.riftCamp),
    5: () => builtCivic('relay') || (Game.day - (S.stageDay || 0) >= 4 && riftPower().water + riftPower().wind + riftPower().sun >= 2),
    6: () => S.frags.length >= 4 && Game.villagers.some((v) => !v.isRiftborn() && v.tech >= RIFT_TIERS[0]),
    7: () => rb.length && housed / rb.length >= 0.5 && !!Game.stats.firstHybrid,
    8: () => (S.stage >= 7 && ((builtCivic('dynamo') && builtCivic('turbine')) || Game.day - (S.stageDay || 0) >= 4)) || (yearOf(Game.day) >= 3 && S.stage >= 5),
  }[next];
  // the wizard's game moves some stages on friendships rather than machines (riftplay.js)
  const gate = typeof riftGate === 'function' ? riftGate(next, S) : null;
  if (gate === false || (gate === null && (!ok || !ok()))) return;
  if (S.stageDay != null && Game.day - S.stageDay < 1 && next > 2) return;
  S.stage = next; S.stageDay = Game.day;
  const when = Game.hour >= 15 && Game.hour < 18 ? 'at teatime' : Game.hour < 6 || Game.hour >= 21 ? 'in the dead of night' : Game.hour < 12 ? 'in the middle of second breakfast' : 'over luncheon';
  // (a village played as the wizard has no Steward to call it)
  const beat = RIFT_STAGES[next].beat.replace('at teatime', when);
  chronicle(typeof playMode === 'function' && playMode() ? beat.replace('The Steward has called a Moot.', 'There\'s to be a Moot.') : beat, 'rift');
  if (next === 1) for (const o of Game.villagers) if (!o.isRiftborn() && o.isGrown() && R.chance(0.6)) feel(o, 'uneasy');
  if (next === 2 && !S.policy) setTimeout(() => queueMoot(firstMoot), 50);
  if (next === 6) { findFragment('ledger', null); S.wary = (S.wary || 1) * 0.5; }
  if (next === 7) { for (const v of Game.villagers) if (v.stage !== 'baby') feel(v, 'festival'); Game.party.planned = 'twohearths'; for (const v of rb) if (v.newcomer) v.newcomer = null; }
  if (next === 8) { findFragment('voice', null); setTimeout(() => queueMoot(longDimMoot), 50); }
}
// Clues that only turn up at certain times.
function cluesHourly(h) {
  const S = story();
  if (S.stage < 2) return;
  if (h === 21 && builtCivic('relay') && R.chance(0.35)) findFragment('relay', null);
  if (h >= 19 && h <= 22 && isSingNight(Game.day) && World.inn && Game.villagers.some((v) => v.isRiftborn() && v.inside === World.inn) && R.chance(0.6)) findFragment('lullaby', Game.villagers.find((v) => v.isRiftborn() && v.inside === World.inn));
  if (h === 23 && builtCivic('dynamo') && builtCivic('turbine') && World.rifts.length && R.chance(0.4)) findFragment('gold', null);
}
// The newcomer policy at work, each morning.
{
  const nd = newcomersDaily;
  newcomersDaily = function () {
    const p = story().policy;
    if (p === 'open') {
      for (const v of riftBorn()) {
        if (v.homeId >= 0 || !v.isGrown()) continue;
        const h = World.homes.find((x) => x.built && residentsOf(x).length === 0);
        if (!h) break;
        moveHome(v, h);
        chronicle(`By the Moot's open-doors rule, ${v.name()} has been given ${h.name}.`, 'rift');
        v.remember(`They gave me a home, just like that: ${h.name}.`, 3);
        for (const o of Game.villagers) if (!o.isRiftborn() && o.stage === 'elder' && riftWary(o) > 0.25 && R.chance(0.5)) feel(o, 'grumble');
      }
    }
    if (p === 'sponsor') {
      for (const v of riftBorn()) {
        if (v.homeId >= 0 || !v.isGrown()) continue;
        const h = World.homes.filter((x) => x.built && residentsOf(x).length > 0 && residentsOf(x).length < HOME_CAP(x) && residentsOf(x).every((o) => !o.isRiftborn()))
          .map((x) => [x, residentsOf(x).filter((o) => o.isGrown()).reduce((s, o) => s + o.genes.sociability - riftWary(o) * 0.5, 0)]).sort((a, b) => b[1] - a[1])[0];
        if (!h || h[1] <= 0.2) continue;
        moveHome(v, h[0]);
        const host = residentsOf(h[0]).find((o) => o.isGrown());
        chronicle(`Sponsored by the Moot, ${host ? host.first + "'s household" : 'a household'} at ${h[0].name} has taken in ${v.first}.`, 'rift');
        if (host) { v.bond(host, 0.15); host.remember(`We sponsored ${v.first}, one of the rift-folk.`, 1); }
      }
    }
    return nd();
  };
}

// --- The ledger tab ---------------------------------------------------------------------------
function riftsHTML() {
  const S = story(), rb = riftBorn();
  let h = `<p class="lede-s">The story of the rifts so far: <b>${RIFT_STAGES[S.stage].name}</b>${S.policy ? ` · the Moot chose to ${{ open: 'open their doors', sponsor: 'sponsor a stranger', wait: 'wait and see' }[S.policy]}` : ''}${S.finale ? ` · ${{ hearthlink: 'Hearthlink: the golden doors stand open', softclose: 'the rifts are closed for good', drift: 'the rifts drift' }[S.finale]}` : ''}.</p>`;
  h += `<h3>Clues (${S.frags.length} of ${Object.keys(FRAGMENTS).length})</h3><div class="likes">`;
  for (const k of Object.keys(FRAGMENTS)) h += S.frags.includes(k) ? `<div><b>${escapeHtml(FRAGMENTS[k].title)}.</b> ${escapeHtml(FRAGMENTS[k].text)}</div>` : '<div class="sub">◌ Not yet found</div>';
  h += '</div>';
  if (rb.length) {
    h += '<h3>The rift-folk</h3><div class="likes">';
    for (const v of rb.filter((x) => x.isGrown())) {
      giveArc(v);
      if (!v.arc) continue;
      h += `<div><a data-v="${v.id}">${escapeHtml(v.name())}</a>: ${ARC_SKILLS[v.arc.skill].label}; misses ${escapeHtml(v.arc.home)}; ${v.arc.lost.found ? `found ${escapeHtml(v.arc.lost.name)} again` : `lost ${v.pron.their} ${v.arc.lost.rel}, ${escapeHtml(v.arc.lost.name)}`}${v.arc.turned ? `; a true friend in ${escapeHtml((personById(v.arc.turned) || {}).first || 'a neighbour')}` : ''}. ${v.homeId >= 0 ? `Lives at ${escapeHtml(v.home().name)}.` : 'Still sleeping rough.'}</div>`;
    }
    h += '</div>';
  }
  const cs = Object.entries(S.customs);
  if (cs.length) h += `<h3>Customs shared</h3><div class="likes">${cs.map(([k, c]) => `<div>${c.tradition ? '★' : '·'} ${escapeHtml(CUSTOMS[k].name)} <span class="sub">(${c.knowers.filter((id) => Game.villagers.some((v) => v.id === id)).length} know it${c.tradition ? '; a tradition' : ''})</span></div>`).join('')}</div>`;
  return h;
}

window.addEventListener('DOMContentLoaded', () => {
  const rv = renderVillage;
  renderVillage = function () {
    if (Game.villageTab === 'rifts') {
      document.querySelectorAll('#village .tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'rifts'));
      const body = $('village-body');
      body.innerHTML = riftsHTML();
      body.querySelectorAll('a[data-v]').forEach((a) => a.addEventListener('click', () => { const o = Game.villagers.find((x) => x.id === +a.dataset.v); if (o) { $('village').hidden = true; selectVillager(o); focusVillager(o); } }));
      return;
    }
    return rv();
  };
  addHook('onHour', (h) => {
    storyTick(); cluesHourly(h); customsTick();
    if (h === 7) { arcsDaily(); hearthlinkDaily(); }
    if (h === 17) suppersDaily();
  });
  addHook('newVillage', () => { Game.riftStory = null; });
});
