'use strict';
// ---------------------------------------------------------------------------
// Minds: the rest of what goes on inside a hobbit's head, on top of the nine
// drives in villager.js. Three more needs (comfort, quiet, and an unease that
// hazards, rifts and sickness feed), a mood that steers what they choose,
// pastimes that pall with repetition, dreams that pull like wishes, memories
// that colour the mood and come up in talk, and breaks: binges, wanders,
// sharp spells and children's tantrums. Everything here patches the earlier
// code with wrappers, and every number lives in TUNE (tuning.js).
// ---------------------------------------------------------------------------

// --- three more needs ---------------------------------------------------------
const NEW_DRIVES = ['comfort', 'crowded', 'unease'];
for (const d of NEW_DRIVES) if (!DRIVES.includes(d)) DRIVES.push(d);
Object.assign(DRIVE_LABEL, { comfort: 'Want of comfort', crowded: 'Want of quiet', unease: 'Unease' });

MOODLETS.unsettled = ['Unsettled', -0.04, 240, ['Something in the air I don\'t like.', 'I keep looking over my shoulder.', 'Can\'t settle to anything today.']];
MOODLETS.cosy = ['Snug as anything', 0.05, 180, ['Nothing like your own chair.', 'Feet up. Bliss.']];
MOODLETS.tantrum = ['Had a tantrum', -0.05, 90, ['I don\'t WANT to!', '*sniff*']];
MOODLETS.binge = ['On a bit of a binge', -0.04, 300, ['Just the one more.']];
MOODLETS.heartened = ['The Steward sees it my way: {x}', 0.06, 720, ['Someone up there has sense.']];
MOODLETS.vexed = ['The Steward goes against {x}', -0.06, 720, ['Nobody asked me, of course.']];
MOODLETS.tradition_kept = ['Thistledown stands for {x}', 0.05, 2880, ['That\'s the village I know.']];

// What a pastime is, for the sake of variety: the same kind of pleasure
// satisfies less each time, until it has been let alone a while.
const LEISURE_KIND = {
  ale: 'drink', ale_item: 'drink', smoke: 'smoke', read: 'read', read_item: 'read', fish: 'fish', stroll: 'stroll', potter: 'potter', play: 'play', chase: 'play', swing: 'play',
  party: 'party', fiddle: 'music', watch: 'watch', chat: 'chat', gather: 'game', nap: 'nap', garden: 'garden', forage: 'forage', market: 'market', tea: 'tea', pet_pet: 'pet',
  hobby_carving: 'craft', hobby_basketry: 'craft', hobby_pottery: 'craft', hobby_knitting: 'craft', hobby_painting: 'craft', hobby_collecting: 'collect', hobby_birdwatching: 'collect',
};
const KIND_WORD = { drink: 'the ale', smoke: 'the pipe', read: 'books', fish: 'fishing', stroll: 'strolling', potter: 'pottering', play: 'games', party: 'parties', music: 'music', watch: 'watching', chat: 'nattering', game: 'get-togethers', nap: 'naps', garden: 'the garden', forage: 'foraging', market: 'the market', tea: 'tea', pet: 'the pet', craft: 'the workbench', collect: 'collecting' };

// Which actions comfort, which cheer, and which are work.
const COMFORT_ACTS = new Set(['eat_home', 'sleep', 'ale', 'smoke', 'read', 'nap', 'potter', 'tea', 'chat', 'pet_pet', 'eat_inn', 'bake_home']);
const MERRY_ACTS = new Set(['party', 'gift', 'give_present', 'play', 'chase', 'fiddle', 'gather', 'swing', 'market']);
const isHobbyAct = (id) => id.startsWith('hobby_');

// Relief the new needs get from the old actions (sat is both the promise the
// brain weighs and the relief that comes, a little each minute of the task).
{
  const add = (id, sat) => { const a = ACTIONS[id]; if (a) a.sat = { ...a.sat, ...sat }; };
  for (const [id, c] of Object.entries({ eat_home: -0.15, potter: -0.12, tea: -0.2, read: -0.15, smoke: -0.12, nap: -0.25, ale: -0.12, pet_pet: -0.15, bake_home: -0.1, eat_inn: -0.1 })) add(id, { comfort: c });
  for (const [id, c] of Object.entries({ stroll: -0.25, fish: -0.3, read: -0.3, nap: -0.3, potter: -0.1, garden: -0.25, forage: -0.25, smoke: -0.15, hobby_carving: -0.2, hobby_basketry: -0.2, hobby_pottery: -0.2, hobby_knitting: -0.2, hobby_painting: -0.2, hobby_collecting: -0.2, hobby_birdwatching: -0.25 })) add(id, { crowded: c });
  for (const [id, c] of Object.entries({ eat_home: -0.2, chat: -0.15, ale: -0.15, tea: -0.15, party: -0.2, pet_pet: -0.15, eat_inn: -0.1 })) add(id, { unease: c });
}
// Purpose: for folk with no trade (and the retired), making and helping
// scratch the itch to be useful. Those with a trade still find it at work,
// so a hobby doesn't tempt them off the job.
const PURPOSE_ACTS = { hobby_carving: 'making', hobby_basketry: 'making', hobby_pottery: 'making', hobby_knitting: 'making', hobby_painting: 'making', bake_home: 'making', garden: 'making', lesson: 'helping', nurse: 'helping', bring_soup: 'helping', tend_baby: 'helping', gift: 'helping', write_letter: 'helping', put_by: 'helping' };
const purposeRelief = (v, a) => { const k = PURPOSE_ACTS[a.id]; if (!k || !v.isGrown() || (v.job && v.stage !== 'elder')) return 0; return k === 'making' ? TUNE.purpose.reliefMaking : TUNE.purpose.reliefHelping; };

// --- how the new needs rise and fall ----------------------------------------
function homeQuality(h) {
  if (!h) return 0;
  const crafts = Object.values(typeof homeCrafts === 'function' ? homeCrafts(h) : {}).reduce((s, n) => s + n, 0);
  const finds = typeof collectionTotal === 'function' ? collectionTotal(h) : 0;
  const V = h.v || {};
  return clamp(0.35 + Math.min(10, crafts) * 0.04 + Math.min(8, finds) * 0.03 + (h.grand ? 0.15 : 0) + (V.boxes ? 0.05 : 0) + (V.lantern ? 0.05 : 0) + (V.porch ? 0.05 : 0) - (h.chilly ? 0.3 : 0), 0, 1);
}
const nearbyFolk = (v, r) => { let n = 0; for (const o of Game.villagers) if (o !== v && !o.inside && !o.carried && Math.abs(o.x - v.x) < r && Math.abs(o.y - v.y) < r) n++; return n; };
const sickAbout = () => Game.villagers.filter((o) => o.isSick()).length;

{
  const update = Villager.prototype.update;
  Villager.prototype.update = function (dt, h) {
    update.call(this, dt, h);
    if (this.stage === 'baby' || this.leaving || this.carried) return;
    const d = this.drives, g = this.genes, rate = dt / 60, T = TUNE;
    const sleeping = this.task && this.task.a.id === 'sleep' && this.task.phase === 'do';
    const atHome = this.inside && this.inside.kind === 'home' && this.homeId >= 0 && this.inside === this.home();
    // comfort: the want of a chair, a fire and dry feet, keener when cold or wet
    if (sleeping && this.inside) d.comfort -= rate * 0.3 * (atHome ? 0.75 + homeQuality(this.home()) * 0.5 : 0.6);
    else d.comfort += rate * T.comfort.rate * (1 + d.cold * T.comfort.coldBoost + (!this.inside && Game.raining ? T.comfort.wetBoost : 0));
    // quiet: a crowd wears on those who keep to themselves
    if (!this.inside) {
      this._crowdT = (this._crowdT ?? Math.random() * 2) - dt;
      if (this._crowdT <= 0) { this._crowdT = 2; this._crowd = nearbyFolk(this, T.crowded.reach); }
      if ((this._crowd || 0) >= T.crowded.many) d.crowded += rate * 2 * T.crowded.rate * (1 - g.sociability);
      else if ((this._crowd || 0) <= 1) d.crowded -= rate * 2 * T.crowded.ease;
    } else d.crowded -= rate * T.crowded.ease * (atHome ? 1.5 : 0.5);
    // unease: what's in the air, felt less by the brave and not at all by rift-folk about rifts
    this._uneaseT = (this._uneaseT ?? Math.random() * 5) - dt;
    if (this._uneaseT <= 0) {
      this._uneaseT = 5;
      const z = typeof hazard === 'function' ? hazard() : null;
      let up = 0;
      if (z && z.state === 'on') up += T.unease.hazardOn; else if (z && (z.state === 'warn' || z.state === 'warned')) up += T.unease.hazardWarn;
      if (World.rifts && World.rifts.length && this.tech < 0.5) up += T.unease.rifts * Math.min(3, World.rifts.length);
      if (sickAbout() >= 3 && !this.isSick()) up += T.unease.sickness;
      if (!this.inside && Game.darkness > 0.4) up += T.unease.nightOut;
      up *= Math.max(0.2, T.unease.braveryScale - g.bravery);
      const ease = T.unease.ease * (atHome ? 2 : 1) * (up ? 0.5 : 1);
      d.unease += (up - ease) * (5 / 60);
      if (d.unease > 0.6 && this.isGrown() && R.chance(0.15)) feel(this, 'unsettled');
      if (atHome && d.comfort < 0.15 && d.cold < 0.2 && R.chance(0.1) && (h >= 18 || Game.raining)) feel(this, 'cosy');
    }
    for (const k of NEW_DRIVES) d[k] = clamp(d[k] || 0, 0, 1);
    if (this.isChild()) d.unease = Math.min(d.unease, 0.6);
    // a child in a tantrum wails about it
    if (this.tantrum) {
      if (Game.time > this.tantrum.until) { this.tantrum = null; this.say(R.pick(['*sniff* ...Okay.', '...I\'m better now.', 'Can I have a biscuit?']), 2.5); }
      else if (!this.bubble && R.chance(dt * 0.2)) this.say(R.pick(['I don\'t WANT to!', 'Waaah!', '*stamps feet*', 'It\'s not FAIR!', 'NO!', '*sobs*']), 2.2);
    }
  };
}

// The hole they live in colours every day, and the memories they carry too.
{
  const sf = stateFeelings;
  stateFeelings = function (v) {
    const out = sf(v);
    if (v.homeId >= 0 && v.isGrown()) {
      const q = homeQuality(v.home()), at = v.inside === v.home() ? 1 : 0.5;
      if (q > 0.65) out.push(['A well-kept hole', TUNE.comfort.homeGood * at]);
      else if (q < 0.3) out.push(['A bare, draughty hole', TUNE.comfort.homeBare * at]);
    }
    const ml = memoryLift(v);
    if (ml > 0.01) out.push(['Fond memories', ml]);
    else if (ml < -0.01) out.push(['Bad memories', ml]);
    return out;
  };
}

// --- memories: weighted, fading, and worth telling ---------------------------
function memoryStrength(m) { return (m.w ?? Math.abs(m.v)) * Math.pow(0.5, Math.max(0, Game.day - m.d) / TUNE.memory.halfLifeDays); }
function memoryLift(v) {
  if (v._memAt === Game.day && v._memLift != null) return v._memLift;
  let s = 0;
  for (const m of v.memories || []) if (m.v) s += Math.sign(m.v) * memoryStrength(m) * TUNE.memory.weight;
  v._memAt = Game.day; v._memLift = clamp(s, -TUNE.memory.cap, TUNE.memory.cap);
  return v._memLift;
}
{
  const remember = Villager.prototype.remember;
  Villager.prototype.remember = function (text, valence = 0, weight) {
    remember.call(this, text, valence);
    const m = this.memories[0];
    if (m && m.t === text) m.w = weight ?? Math.abs(valence);
    this._memAt = null;
  };
}
// A strong memory from a while back, fit for "Do you remember…"
function reminiscence(v) {
  const T = TUNE.memory;
  const old = (v.memories || []).filter((m) => Math.abs(m.v) >= T.strong && Game.day - m.d >= T.reminisceAfterDays && m.told !== Game.day && !/pat|tutted/i.test(m.t));
  return old.length ? R.pick(old) : null;
}
// A memory told in the first person: "Became a skilled hand…" becomes "I became…"; one that names someone else is told as it stands.
const MEMORY_VERB = /^(Became|Felt|Got|Was|Were|Shook|Caught|Had|Lived|Danced|Made|Saw|Went|Found|Won|Learned|Learnt|Married|Moved|Took|Gave|Helped|Finished|Met|Lost|Ate|Drank|Sang|Played|Built|Planted|Harvested|Spent|Walked|Came|Stood|Sat|Heard|Told|Wrote|Read|Fell|Kept|Put|Slept|Woke|Brought|Bought|Sold|Sent|Laughed|Cried|Watched|Fished|Baked|Brewed|Dug|Carried|Taught|Nursed|Visited|Stayed)\b/;
function memoryPhrase(m) { const t = m.t.replace(/\.$/, ''); return (MEMORY_VERB.test(t) ? 'I ' + t.charAt(0).toLowerCase() + t.slice(1) : t) + '.'; }
// A squabble is remembered: for a while the two are sour with each other
{
  const rk = relKind;
  relKind = function (a, b) {
    const k = rk(a, b);
    if ((a.rel[b.id] ?? 0.1) < TUNE.memory.grudgeBelow && k !== 'spouse' && k !== 'kin') {
      const grudge = (a.memories || []).some((m) => m.v < 0 && Game.day - m.d <= TUNE.memory.grudgeDays && m.t.includes(b.first));
      if (grudge) return 'sour';
    }
    return k;
  };
}
window.addEventListener('DOMContentLoaded', () => {
  if (typeof TOPICS === 'undefined') return;
  TOPICS.reminisce = {
    w: 1.3, when: (s, l) => !s.isChild() && !!reminiscence(s) && (l.rel[s.id] ?? 0) >= 0.3,
    open: { grown: ['Do you remember, {name}? {memory}', 'I was thinking the other day: {memory} Seems a lifetime ago.', 'Funny what sticks in the mind. {memory}'] },
    reply: { any: ['I remember it well.', 'As if it were yesterday.', 'How could I forget?'], cheerful: ['Ha! I remember. Happy days.'], ornery: ['I remember. You told me at the time.'], shy: ['...Yes. I remember.'], dreamy: ['Days like that don\'t come twice.'], witty: ['I remember the bit where you fell in.'], gloomy: ['I remember. Things were better then.'], curious: ['Tell it again, the way it happened.'], child: ['Was I there? Was I?'] },
    more: { grown: ['The village was smaller then. Or I was bigger.', 'You don\'t think about it, and then it comes back whole.', 'We should mark the day, somehow.'] },
    back: { any: ['Aye.', 'Those were the days.', 'We\'ll have more like it yet.'], ornery: ['Mm. Pass the salt, in a manner of speaking.'], child: ['Can we do it again?'] },
    sour: ['ornery', 'gloomy'],
  };
  const ft = fillTalk;
  fillTalk = function (text, s, l, ctx) {
    if (typeof text !== 'string') return text == null ? '' : ft(text, s, l, ctx);
    if (text.includes('{memory}')) { const m = reminiscence(s); if (m) { m.told = Game.day; text = text.replace(/\{memory\}/g, memoryPhrase(m)); } else text = text.replace(/\{memory\}/g, 'those were the days.'); }
    return ft(text, s, l, ctx);
  };
});

// --- what sways a choice: mood, variety, dreams -------------------------------
const DREAM_NUDGE = {
  master: (v, a) => (a.job && a.job === v.job) || a.id === 'apprentice',
  family: (v, a) => ['chat', 'gift', 'party', 'eat_inn', 'tend_baby', 'eat_home'].includes(a.id),
  friends: (v, a) => ['chat', 'gather', 'eat_inn', 'ale', 'party', 'gift'].includes(a.id),
  wed: (v, a) => ['chat', 'gift', 'party', 'eat_inn', 'ale'].includes(a.id),
  treasures: (v, a) => isHobbyAct(a.id),
  learned: (v, a) => ['school', 'read', 'read_item', 'lesson'].includes(a.id),
  belong: (v, a) => ['chat', 'eat_inn', 'gather', 'party', 'ale'].includes(a.id),
};
{
  const score = Villager.prototype.score;
  Villager.prototype.score = function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s <= 0) return s;
    const mul = (n, f) => { if (f === 1) return; s *= f; if (ex) ex.mul.push([n, f]); };
    const T = TUNE;
    // the same pleasure palls
    const kind = LEISURE_KIND[a.id];
    if (kind && this.tol && this.tol[kind] > 0.05) mul('had enough of ' + (KIND_WORD[kind] || kind), 1 - T.variety.penalty * this.tol[kind]);
    // mood steers: low folk want comforting, merry folk want to make merry
    const m = this.mood();
    if (m < T.mood.steerLow) { if (COMFORT_ACTS.has(a.id)) mul('in need of comfort', T.mood.comfortPull); else if (a.job) mul('not in the mood for work', T.mood.workShy); }
    else if (m > T.mood.steerHigh && (MERRY_ACTS.has(a.id) || isHobbyAct(a.id)) && this.drives.industry < 0.4) mul('in high spirits', T.mood.highPull);
    // a dream pulls
    if (this.dream && DREAM_NUDGE[this.dream.k] && DREAM_NUDGE[this.dream.k](this, a)) mul('a dream', T.dream.pull);
    // being useful, for those with no trade to be useful at
    const pr = purposeRelief(this, a);
    if (pr) { const e = Math.pow(this.drives.industry, 1.5) * pr; s += e; if (ex) ex.relief.push(['industry', e]); }
    // a tantrum: nothing much appeals but going home
    if (this.tantrum) mul('in a tantrum', HOME_ACTS.has(a.id) ? 1.5 : 0.4);
    return s;
  };
  // tolerance grows with each go at a pastime, and wears off hour by hour
  const finish = Villager.prototype.finish;
  Villager.prototype.finish = function () {
    const a = this.task && this.task.a;
    finish.call(this);
    if (!a) return;
    const kind = LEISURE_KIND[a.id];
    if (kind) { this.tol = this.tol || {}; this.tol[kind] = Math.min(1, (this.tol[kind] || 0) + TUNE.variety.gain); }
    const pr = purposeRelief(this, a);
    if (pr) this.drives.industry = Math.max(0, this.drives.industry - pr);
  };
}
window.addEventListener('DOMContentLoaded', () => {
  const oh = onHour;
  onHour = function (h) {
    const r = oh(h);
    for (const v of Game.villagers) {
      if (v.tol) for (const k in v.tol) { v.tol[k] = Math.max(0, v.tol[k] - TUNE.variety.decayPerHour); if (v.tol[k] <= 0) delete v.tol[k]; }
      tantrumHourly(v);
    }
    traditionsHourly();
    return r;
  };
});

// --- breaks ---------------------------------------------------------------------
// Grown-ups' sulks live in hearts.js; three more kinds join them, and the
// whole village has only so many in a day. Children have tantrums instead.
SULKS.binge = { text: (v) => `${v.first} has taken to the taproom and won't be talked out of it.`, line: 'Another, and keep them coming.' };
SULKS.wander = { text: (v) => `${v.first} has wandered off up the valley with no word of where to.`, line: 'Don\'t wait up.' };
SULKS.sharp = { text: (v) => `${v.first} is in a sharp mood and has snapped at everyone who's spoken.`, line: 'What do you want?' };
function breaksToday() { return Game.breaksToday && Game.breaksToday.day === Game.day ? Game.breaksToday.n : 0; }
function noteBreak() { Game.breaksToday = Game.breaksToday && Game.breaksToday.day === Game.day ? { day: Game.day, n: Game.breaksToday.n + 1 } : { day: Game.day, n: 1 }; }
window.addEventListener('DOMContentLoaded', () => {
  const msh = moodSwingsHourly;
  moodSwingsHourly = function () {
    const before = new Map(Game.villagers.map((v) => [v.id, v.sulk]));
    msh();
    for (const v of Game.villagers) {
      if (!v.sulk || before.get(v.id) === v.sulk) continue;
      // one break a day each, and so many for the whole village
      if (v.breakDay === Game.day || breaksToday() >= TUNE.breaks.villagePerDay) { v.sulk = null; continue; }
      v.breakDay = Game.day; noteBreak();
      if (v.sulk.k === 'binge') feel(v, 'binge');
    }
  };
});
{
  const score = Villager.prototype.score;
  Villager.prototype.score = function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s <= 0 || !this.sulk) return s;
    const k = this.sulk.k, mul = (n, f) => { s *= f; if (ex) ex.mul.push([n, f]); };
    if (k === 'binge') mul('on a binge', a.id === 'ale' || a.id === 'ale_item' ? 3 : a.job ? 0.5 : 1);
    if (k === 'wander') mul('wandering', a.id === 'stroll' ? 3 : HOME_ACTS.has(a.id) ? 0.5 : 0.8);
    if (k === 'sharp') mul('a sharp mood', a.id === 'chat' ? 0.5 : 1);
    return s;
  };
}
function tantrumHourly(v) {
  if (!v.isChild() || v.leaving) return;
  const T = TUNE.breaks, m = v.mood();
  v.lowKidT = m < T.tantrumMood ? (v.lowKidT || 0) + 1 : 0;
  if (v.tantrum || v.breakDay === Game.day || v.lowKidT < T.tantrumHours || !R.chance(T.tantrumChance) || breaksToday() >= T.villagePerDay) return;
  v.tantrum = { until: Game.time + T.tantrumMinutes };
  v.breakDay = Game.day; noteBreak();
  if (v.task && v.task.a.id !== 'sleep' && v.task.a.id !== 'deliver' && !v.inside) v.abort();
  feel(v, 'tantrum');
  v.say(R.pick(['I don\'t WANT to!', 'NO! NO! NO!', '*flings self on the grass*']), 3);
  if (!v.inside) FX.puff(v.x, v.y - 20);
  if (R.chance(0.5)) chronicle(`${v.first} has had a tantrum ${v.inside ? 'indoors' : 'in the lane'}, and the whole village heard it.`, 'sick');
}
// a pat or a kind word ends a tantrum early
{
  const pat = Villager.prototype.pat;
  Villager.prototype.pat = function () { if (this.tantrum) { this.tantrum = null; this.say(R.pick(['*hic* ...okay.', 'Sorry.']), 2.5); } return pat.call(this); };
}

// --- the Steward's choices and the village's traditions touch what folk hold dear ---
function traditionsHourly() {
  const have = Game.traditions || [];
  if (!Game._tradSeen) Game._tradSeen = have.length;
  if (have.length <= Game._tradSeen) return;
  const k = have[have.length - 1]; Game._tradSeen = have.length;
  if (typeof TRAD_VALUE === 'undefined' || !TRAD_VALUE[k]) return;
  for (const v of Game.villagers) if (v.isGrown() && valuesOf(v).includes(TRAD_VALUE[k])) feel(v, 'tradition_kept', VALUES[TRAD_VALUE[k]].label.toLowerCase());
}
