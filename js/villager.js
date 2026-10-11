'use strict';
// ---------------------------------------------------------------------------
// Villagers: drives, body chemistry, a learning brain, memories and speech.
//
// Nine drives (0 = content, 1 = desperate) rise over time at rates set by the
// genome. The brain scores every action by how much relief it promises right
// now, times the villager's learned habit weight and inborn instinct. After
// each action the weight drifts towards what actually happened (reward
// learning). Villagers also copy what they see contented folk doing nearby
// (imitation, strongest in children), and your pats and tut-tuts reinforce or
// discourage whatever they are doing, Creatures-style.
// ---------------------------------------------------------------------------

const DRIVES = ['hunger', 'thirst', 'tired', 'lonely', 'bored', 'craving', 'cold', 'ache', 'industry'];
const DRIVE_LABEL = { hunger: 'Hunger', thirst: 'Thirst', tired: 'Sleepiness', lonely: 'Loneliness', bored: 'Boredom', craving: 'Pipe craving', cold: 'Chill', ache: 'Aches', industry: 'Itch to work' };
const WALK_SPEED = 12; // pixels per game minute
const BABY_DAYS = 1, CHILD_DAYS = 5, ELDER_DAYS = 26, ADVENTURE_DAYS = 32;
const MAX_POP = 64;

let NEXT_ID = 1;

const SEASON_CHILL = { spring: 0.12, summer: 0, autumn: 0.28, winter: 0.62 };

class Villager {
  constructor(o = {}) {
    this.id = o.id ?? NEXT_ID++;
    NEXT_ID = Math.max(NEXT_ID, this.id + 1);
    this.genes = normalizeGenes(o.genes ?? randomGenes());
    if (o.sex) this.genes.sex = o.sex;
    this.first = o.first ?? randomFirstName(this.genes.sex);
    if (!this.genes.sex) this.genes.sex = sexFromName(this.first);
    this.surname = o.surname ?? R.pick(SURNAMES);
    this.age = o.age ?? R.f(6, 22);
    this.homeId = o.homeId ?? 0;
    this.parents = o.parents ?? [];
    this.spouse = o.spouse ?? null;
    this.sweetheart = o.sweetheart ?? null;
    this.x = o.x ?? 0; this.y = o.y ?? 0;
    this.drives = Object.assign(Object.fromEntries(DRIVES.map((d) => [d, R.f(0.05, 0.35)])), o.drives || {});
    this.drives.ache = o.drives ? (o.drives.ache || 0) : 0;
    this.drives.cold = o.drives ? (o.drives.cold || 0) : 0;
    this.chem = Object.assign({ ale: 0, germs: 0, toxin: 0, immune: 0, hangover: 0 }, o.chem || {});
    this.weights = o.weights ?? {};
    for (const a in ACTIONS) if (typeof this.weights[a] !== 'number') this.weights[a] = 1;
    this.foodLike = Object.assign(Object.fromEntries(PANTRY_KINDS.concat(['stew']).map((k) => [k, 1])), o.foodLike || {});
    this.rel = o.rel ?? {};
    this.love = o.love ?? {};
    this.skills = Object.assign(Object.fromEntries(SKILLS.map((s) => [s, 0])), o.skills || {});
    this.edu = typeof o.edu === 'number' ? o.edu : o.vocab ? educationFromOld(o, this.genes, this.age) : startingEducation(this.genes, this.age);
    this.eduFrom = o.eduFrom ?? {};
    // rift ways: 0 = hill-folk through and through, 1 = rift-born manners and gear
    this.tech = typeof o.tech === 'number' ? o.tech : (this.genes.rift || 0);
    this.visor = o.visor ?? false;
    this.lost = o.lost ?? 0;
    this.techTier = techTier(this.tech);
    this.memories = o.memories ?? [];
    this.moodlets = o.moodlets ?? [];
    this.wishes = o.wishes ?? []; this.dream = o.dream ?? null; this.dreamsDone = o.dreamsDone ?? []; this.heirlooms = o.heirlooms ?? [];
    this.job = o.job ?? null;
    this.playerJob = o.playerJob ?? false;
    this.wary = o.wary ?? 0;
    this.pouch = o.pouch ?? R.i(1, 4);
    this.stats = o.stats ?? {};
    this.born = o.born ?? 0;
    this.expecting = o.expecting ?? null;
    this.lastFood = o.lastFood ?? null;
    this.battery = o.battery ?? null;
    this.newcomer = o.newcomer ?? null; this.lodgeDay = o.lodgeDay ?? null; this.refusedDay = o.refusedDay ?? null;
    this.hobbies = o.hobbies ?? null; this.hobbySkill = o.hobbySkill ?? {}; this.hobbyMat = o.hobbyMat ?? {}; this.birds = o.birds ?? 0;
    this.inside = null; this.task = null; this.path = null; this.pathI = 0; this.queue = [];
    this.facing = 'down'; this.pose = 'stand'; this.walkDist = 0; this.animT = Math.random() * 10;
    this.bubble = null; this.iconT = 0; this.lastAction = null; this.cool = {};
    this.leaving = false; this.thinkDelay = Math.random() * 3; this.observeT = Math.random() * 10; this.speakT = R.f(5, 30);
    this.stage = this.lifeStage();
    if (this.stage === 'child' || this.stage === 'baby') { this.drives.craving = 0; this.drives.industry = 0; }
    this.sprites = buildVillagerSprites(this.genes, this.stage, this.look());
  }
  look() { return { tier: this.techTier, visor: this.visor }; }
  isRiftborn() { return (this.genes.rift || 0) >= 0.99; }

  name() { return this.first + ' ' + this.surname; }
  home() { return World.homes[this.homeId]; }
  years() {
    // Hobbits come of age at 33; one in-game day is a few years of their life.
    const a = this.age;
    if (a < BABY_DAYS) return Math.floor(a * 2);
    if (a < CHILD_DAYS) return Math.floor(2 + ((a - BABY_DAYS) / (CHILD_DAYS - BABY_DAYS)) * 31);
    if (a < ELDER_DAYS) return Math.floor(33 + ((a - CHILD_DAYS) / (ELDER_DAYS - CHILD_DAYS)) * 60);
    return Math.floor(93 + (a - ELDER_DAYS) * 3.5);
  }
  lifeStage() { return this.age < BABY_DAYS ? 'baby' : this.age < CHILD_DAYS ? 'child' : this.age >= ELDER_DAYS * (0.9 + this.genes.longevity * 0.2) ? 'elder' : 'adult'; }
  isChild() { return this.stage === 'child'; }
  isGrown() { return this.stage === 'adult' || this.stage === 'elder'; }
  isSick() { return this.chem.germs > 0.35 || this.chem.toxin > 0.35; }
  isTipsy() { return this.chem.ale > 0.45; }
  education() { return this.edu; }
  get pron() { return PRON[this.genes.sex] || PRON.m; }
  skillMul(s) { return 0.6 + (this.skills[s] || 0) / 100 * 0.9; }
  favouriteFood() {
    let best = 'bread', bs = 0;
    for (const k of PANTRY_KINDS) { const s = (this.genes.food[k] || 1) * (this.foodLike[k] || 1); if (s > bs) { bs = s; best = k; } }
    return best;
  }
  mood() {
    let s = 0;
    for (const d of DRIVES) { const w = d === 'industry' ? 0.5 : 1; s += this.drives[d] * this.drives[d] * w; }
    return clamp(1 - Math.sqrt(s / (DRIVES.length - 0.5)) * 1.45, 0, 1);
  }
  moodWord() {
    const m = this.mood();
    if (this.isSick()) return 'Under the weather';
    if (this.isTipsy()) return 'Merrily tipsy';
    return m > 0.8 ? 'Merry' : m > 0.6 ? 'Content' : m > 0.4 ? 'Fair to middling' : m > 0.2 ? 'Grumbly' : 'Thoroughly put out';
  }
  isBusyForChat() {
    if (!this.task) return false;
    const id = this.task.a.id;
    // folk will happily down tools for a natter, but not mid-errand
    return ['sleep', 'potter', 'party', 'eat_inn', 'ale', 'chat', 'gift', 'watch', 'deliver', 'school', 'work_story', 'fiddle', 'cradle', 'tend_baby', 'nurse', 'build', 'bake_home'].includes(id) ||
      (this.task.a.job && this.task.a.pose === 'inside') || this.task.chatLock;
  }
  activity() {
    if (this.leaving) return this.leaving === 'trip' ? 'Off on an adventure. Back soon!' : this.leaving === 'home' ? 'Going home, through the golden rift' : 'Off on a last great adventure!';
    if (this.carried) return 'Being carried about by a giant hand!';
    if (!this.task) return 'Wondering what to do';
    const a = this.task.a;
    const label = a.label2 ? a.label2(this) : a.label;
    if (this.task.phase === 'go') {
      if ((a.id === 'chat' || a.id === 'gift') && this.task.target.other) return 'Off to see ' + this.task.target.other.first;
      if (a.id === 'tend_baby' && this.task.target.baby) return 'Off to see to little ' + this.task.target.baby.first;
      if (a.id === 'nurse' && this.task.target.patient) return 'Off to nurse ' + this.task.target.patient.first;
      if (a.id === 'deliver') return label;
      return 'On the way: ' + label.toLowerCase();
    }
    if (a.id === 'chat' && this.task.partner) return (this.task.data.quarrel ? 'Squabbling with ' : this.task.data.court ? 'Sweet-talking ' : 'Nattering with ') + this.task.partner.first;
    if (a.id === 'sleep' && this.isSick()) return 'Laid up in bed, feeling poorly';
    return label;
  }
  refreshSprites() { this.techTier = techTier(this.tech); this.sprites = buildVillagerSprites(this.genes, this.stage, this.look()); this._portraitKey = null; }

  // Longer sentences stay up a little longer.
  // Speech: `to` someone in a conversation, or `think` for musing aloud to
  // themselves (drawn as a thought cloud); otherwise an exclamation.
  say(text, dur = 3.2, opts = {}) { if (text) this.bubble = { text, t: Math.max(dur, 1.4 + text.length * 0.045), to: opts.to || null, think: !!opts.think }; }
  // Says whatever is on their mind, in their own manner of speaking.
  chatter() { this.say(remark(this), undefined, { think: true }); }

  remember(text, valence = 0) {
    this.memories.unshift({ d: Game.day, t: text, v: valence });
    if (this.memories.length > 16) this.memories.length = 16;
  }

  practice(skill, dt, mult = 1) {
    if (!skill) return;
    const edu = eduSkillMul(this);
    const cur = this.skills[skill] || 0;
    const gain = dt * 0.012 * (0.4 + this.genes.apt[skill] * 1.2) * edu * (1 - cur / 110) * mult;
    this.skills[skill] = Math.min(100, cur + gain);
    const before = Math.floor(cur / 25), after = Math.floor(this.skills[skill] / 25);
    if (after > before && after >= 2 && this.isGrown()) {
      const word = ['', '', 'skilled', 'expert', 'master'][after];
      this.remember(`Became ${word === 'expert' ? 'an' : 'a'} ${word} hand at ${SKILL_LABEL[skill].toLowerCase()}.`, 1);
      feel(this, 'skill_up', SKILL_LABEL[skill].toLowerCase());
      if (after >= 3) chronicle(`${this.name()} has become ${after === 4 ? 'a master' : 'an expert'} at ${SKILL_LABEL[skill].toLowerCase()}.`, 'learn');
    }
  }

  cure(by, nurse) {
    const wasSick = this.isSick();
    this.chem.germs = Math.max(0, this.chem.germs - 0.7);
    this.chem.toxin = Math.max(0, this.chem.toxin - 0.7);
    this.chem.immune = Math.max(this.chem.immune, 0.6);
    this.drives.ache = Math.max(0, this.drives.ache - 0.4);
    if (wasSick) {
      if (!this.inside) this.say(R.pick(['Ah, that\'s better!', 'Thank you kindly.', 'Bitter... but it works!']));
      this.remember(`Felt better after a remedy from ${by}.`, 1);
      if (nurse) { this.bond(nurse, 0.08); nurse.practice('herbalism', 15); }
    } else if (!this.inside) {
      this.say(R.pick(['Yuck! I wasn\'t even poorly.', 'Bleurgh!', 'What was that for?']));
      this.weights[this.task ? this.task.a.id : 'stroll'] = clamp((this.weights[this.task ? this.task.a.id : 'stroll'] || 1) - 0.05, 0.35, 2.2);
    }
  }

  // ----- brain -----
  canDo(a) {
    const st = a.stages || (this.stage === 'baby' ? null : AWAKE);
    return st ? st.includes(this.stage) : false;
  }
  // How much this villager wants to do an action right now. Pass `ex` (an
  // object) to have the score explained: why it's ruled out, or the relief it
  // promises for each drive and every multiplier applied after (dev mode).
  score(a, h, ex) {
    const no = (why) => { if (ex) ex.blocked = why; return -1; };
    if (a.queued) return no('only runs when queued');
    if (!this.canDo(a)) return no(`not for a ${this.stage}`);
    if (a.job && a.job !== this.job && !(a.jobs && a.jobs.includes(this.job))) return no(`needs a ${JOBS[a.job] ? JOBS[a.job].label.toLowerCase() : a.job}`);
    if (a.avail && !a.avail(this, h)) return no('not possible now');
    if (this.cool[a.id] && this.cool[a.id] > Game.time) return no(`cooling down, ${Math.ceil(this.cool[a.id] - Game.time)} min`);
    if (this._arms && !ARMS_OK.has(a.id)) return no('has a baby to look after');
    if (this._kids && !kidsOk(a, h)) return no('has little ones in tow');
    if (this._stuck && !HOME_ACTS.has(a.id) && a.id !== 'work_nanny') return no('minding the nursery');
    if (this.homeId < 0 && HOMELESS_NO.has(a.id)) return no('has no home yet');
    if (this.isChild()) { const why = kidBlock(this, a); if (why) return no(why); }
    let s = 0;
    if (ex) { ex.relief = []; ex.mul = []; }
    for (const d in a.sat) {
      const red = -a.sat[d];
      if (red > 0) { const c = Math.pow(this.drives[d], 1.5) * red; s += c; if (ex && c > 0.001) ex.relief.push([d, c]); }
    }
    if (a.extra) { const e = a.extra(this, h); s += e; if (ex) ex.extra = e; }
    if (ex) ex.base = s;
    const mul = (name, f) => { if (f === 1) return; s *= f; if (ex) ex.mul.push([name, f]); };
    mul('habit', this.weights[a.id]);
    mul('instinct', this.genes.taste[a.id] || 1);
    if (a.time) mul('time of day', a.time(h, this));
    if (a.trait) mul('personality', a.trait(this));
    if (a.meal && isMealTime(h)) mul('mealtime', 1.8);
    if (a.outdoor && Game.raining) mul('rain', 0.3);
    if (a.outdoor && World.season === 'winter' && !a.job) mul('winter', 0.6);
    if (a.job && this.stage === 'elder' && a.job !== 'storyteller') mul('elderly', 0.5);
    if (this.isSick() && a.id !== 'sleep' && a.id !== 'remedy_item') mul('poorly', 0.4);
    if (this.stage === 'elder' && (a.id === 'party' || a.id === 'play')) mul('elderly', 0.7);
    if (this.lastAction === a.id && a.id !== 'sleep' && !a.job) mul('did it last', 0.75);
    // with a baby to mind, home is the easier place to be
    if (this._arms && !HOME_ACTS.has(a.id)) mul('baby in arms', 0.6);
    if (this._flagging) mul('little ones flagging', HOME_ACTS.has(a.id) ? 1.8 : 0.6);
    // children are home by dark
    if (this.isChild() && !HOME_ACTS.has(a.id) && (h >= 20.5 || h < 6.5)) mul('past bedtime', 0.1);
    // once out at work, they tend to stay on for another stint rather than trudge home
    if (a.job && this.lastJobAt && Game.time - this.lastJobAt < 40 && this.lastJob === a.id) mul('on a roll', 2);
    const noise = Math.random() * 0.03;
    if (ex) ex.noise = noise;
    return s + noise;
  }

  // Picks something to do: anything queued first, otherwise one of the three
  // best-scoring actions, weighted by score squared. Each choice is kept, with
  // its runners-up, for dev mode.
  think(h) {
    this.thinkDelay = 2;
    const care = careLoad(this);
    this._arms = care.arms; this._kids = care.kids; this._stuck = care.stuck; this._flagging = care.flagging;
    if (this.queue.length) {
      const q = this.queue.shift();
      if (this.begin(q.a, h, q.extra)) { this.noteDecision(q.a.id, 'queued', []); return; }
    }
    const scored = [];
    for (const k in ACTIONS) {
      const s = this.score(ACTIONS[k], h);
      if (s > 0) scored.push([s, ACTIONS[k]]);
    }
    scored.sort((a, b) => b[0] - a[0]);
    const top = scored.slice(0, 3);
    const options = scored.slice(0, 5).map(([sc, a]) => [a.id, sc]);
    for (let attempt = 0; attempt < 3 && top.length; attempt++) {
      const total = top.reduce((t, x) => t + x[0] * x[0], 0);
      let r = Math.random() * total, chosen = top[0];
      for (const x of top) { r -= x[0] * x[0]; if (r <= 0) { chosen = x; break; } }
      if (this.begin(chosen[1], h)) { this.noteDecision(chosen[1].id, attempt ? `picked (try ${attempt + 1}, the first had nowhere to go)` : 'picked', options); return; }
      top.splice(top.indexOf(chosen), 1);
    }
    const fallback = this.stage === 'baby' ? ACTIONS.cradle : needsMinder(this) ? ACTIONS.potter : ACTIONS.stroll;
    this.begin(fallback, h);
    this.noteDecision(fallback.id, 'fallback: nothing else worked out', options);
  }
  noteDecision(id, how, options) {
    const d = { t: Game.time, id, how, options };
    (this.decisions || (this.decisions = [])).unshift(d);
    if (this.decisions.length > 8) this.decisions.length = 8;
    if (typeof devLog === 'function' && Game.selected === this) devLog('decide', `${this.first} chose ${id} (${how})${options.length ? ' over ' + options.filter((o) => o[0] !== id).slice(0, 3).map((o) => `${o[0]} ${o[1].toFixed(2)}`).join(', ') : ''}`);
  }

  begin(a, h, extra) {
    // on the way to work, the little ones are dropped at the nursery first
    if (a.job && this.isGrown() && !(extra && extra.dropped)) {
      const plan = dropOffPlan(this, a);
      if (plan) { this.queue.unshift({ a, extra: { ...(extra || {}), dropped: true } }); return this.begin(ACTIONS.drop_off, h, plan); }
    }
    const target = a.target(this, h, extra);
    if (!target || (target.building && target.building.kind === 'nowhere')) { this.cool[a.id] = Game.time + 30; return false; }
    const task = { a, phase: 'go', target, t: a.dur * R.f(0.8, 1.2), data: {}, before: { ...this.drives } };
    if (target.spot) { target.spot.occ = this.id; task.spot = target.spot; target.x = target.spot.x; target.y = target.spot.y; target.facing = target.spot.facing; }
    if (target.building) { target.x = target.building.stepX; target.y = target.building.stepY; }
    // nobody walks out and leaves a baby on their own
    if (this.stage !== 'baby' && !needsMinder(this) && !takeLittleOnes(this, a, target, h)) { this.releaseTask(task); this.cool[a.id] = Game.time + 20; return false; }
    // and little ones only go where someone will be keeping an eye on them
    if (needsMinder(this) && !a.queued && !placeMinded(this, target.other ? { x: target.other.x, y: target.other.y } : target)) { this.releaseTask(task); this.cool[a.id] = Game.time + 10; return false; }
    if (a.start && !a.start(this, task, extra)) { this.releaseTask(task); return false; }
    if (this.inside && target.building === this.inside) { this.task = task; this.arrive(); return true; }
    if (this.inside) this.exitBuilding();
    if (target.other) {
      this.task = task;
      this.repathTo(target.other.x, target.other.y);
      task.repathT = 0;
      this.showIcon(a);
      return true;
    }
    if (!this.repathTo(target.x, target.y)) { this.releaseTask(task); this.cool[a.id] = Game.time + 45; return false; }
    this.task = task;
    this.showIcon(a);
    if (this.isGrown() && R.chance(0.12) && PHRASES[a.id] && a.id !== 'chat') this.say(R.pick(PHRASES[a.id]));
    if (Game.raining && a.id === 'potter' && R.chance(0.4)) this.say(R.pick(PHRASES.rain));
    return true;
  }

  showIcon(a) { if (a.icon) this.iconT = 3; }

  repathTo(px, py) {
    const p = findPath(Math.floor(this.x / 16), Math.floor((this.y - 2) / 16), Math.floor(px / 16), Math.floor((py - 2) / 16));
    if (!p) return false;
    this.path = p.map(([tx, ty]) => [tx * 16 + 8, ty * 16 + 12]);
    if (this.path.length) this.path[this.path.length - 1] = [px, py];
    else this.path = [[px, py]];
    this.pathI = 0;
    return true;
  }

  releaseTask(task) {
    if (!task) return;
    if (task.spot && task.spot.occ === this.id) task.spot.occ = null;
    if (task.target && task.target.item) task.target.item.claims = Math.max(0, task.target.item.claims - (task.consumed ? 0 : 1));
    if (task.a.release) task.a.release(this, task);
    if (task.partner && task.partner.task && task.partner.task.partner === this) task.partner.task.t = Math.min(task.partner.task.t, 1);
  }

  abort() {
    if (this.task) this.releaseTask(this.task);
    this.task = null; this.path = null; this.pose = 'stand';
  }

  enterBuilding(b) {
    this.inside = b;
    if (!b.inside.includes(this.id)) b.inside.push(this.id);
    b.doorAnim = 6;
    this.x = b.stepX; this.y = b.stepY;
  }
  exitBuilding() {
    const b = this.inside;
    if (!b) return;
    b.inside = b.inside.filter((i) => i !== this.id);
    b.doorAnim = 6;
    this.inside = null;
    this.x = b.stepX; this.y = b.stepY;
    this.facing = 'down';
  }

  arrive() {
    const task = this.task, tg = task.target;
    task.phase = 'do';
    this.path = null;
    if (tg.building) { if (this.inside !== tg.building) this.enterBuilding(tg.building); this.pose = 'inside'; }
    else {
      this.pose = tg.poseOverride || (task.spot && task.spot.pose) || task.a.pose;
      if (tg.facing) this.facing = tg.facing;
      if (tg.faceTo) this.facing = tg.faceTo.x < this.x ? 'left' : 'right';
      if (task.spot) { this.x = task.spot.x; this.y = task.spot.y; }
    }
    if (tg.item) {
      const it = tg.item;
      if (it.uses <= 0) { this.abort(); return; }
      it.uses--; it.claims = Math.max(0, it.claims - 1); task.consumed = true;
      if (it.uses <= 0) World.items = World.items.filter((x) => x !== it);
      if (PHRASES[task.a.id]) this.say(R.pick(PHRASES[task.a.id]));
    }
    task.before = { ...this.drives };
    if (this.isGrown() && !['chat', 'stroll'].includes(task.a.id) && R.chance(0.3) && PHRASES[task.a.id] && !tg.building) this.say(R.pick(PHRASES[task.a.id]));
  }

  finish() {
    const task = this.task;
    if (!task) return;
    const a = task.a;
    if (a.done) a.done(this, task);
    // reward learning: how much did that actually help?
    let r = 0;
    for (const d of DRIVES) r += Math.max(0, task.before[d] - this.drives[d]) * (d === 'industry' ? 0.6 : 1);
    if (task.data.quarrel) r -= 0.3;
    const w = this.weights[a.id] + 0.08 * (r * (this.genes.taste[a.id] || 1) - 0.25);
    if (!a.queued) this.weights[a.id] = clamp(w, 0.35, 2.2);
    this.stats[a.id] = (this.stats[a.id] || 0) + 1;
    if (a.id === 'chat' && task.partner) this.bond(task.partner, task.data.quarrel ? -0.04 : 0.03);
    if (a.id === 'chat' && task.partner && task.data.ask) newcomerMet(this, task.partner);
    if (!a.queued) this.lastAction = a.id;
    if (a.job) { this.lastJobAt = Game.time; this.lastJob = a.id; }
    this.releaseTask(task);
    this.task = null;
    this.pose = 'stand';
    this.thinkDelay = R.f(0.5, 3);
  }

  pat() {
    const key = this.task ? this.task.a.id : this.lastAction;
    if (key) this.weights[key] = clamp(this.weights[key] + 0.22, 0.35, 2.2);
    this.drives.lonely = Math.max(0, this.drives.lonely - 0.25);
    this.drives.bored = Math.max(0, this.drives.bored - 0.1);
    if (this.isGrown()) this.say(R.pick(['Hee hee!', 'Why, thank you!', 'Oh, that tickles!', 'Splendid!', 'Aww.']), 2.5);
    else this.say(this.stage === 'baby' ? R.pick(['Hee!', 'Goo!', '*giggles*']) : R.pick(['Yay! That tickles!', 'Hee hee! Again!', 'Thank you!']), 2.5);
    FX.hearts(this.x, this.y - 18);
    if (key && R.chance(0.5)) this.remember(`Got a kindly pat while ${(ACTION_NAMES[key] || 'busy').toLowerCase()}.`, 1);
    return key;
  }
  tut() {
    const key = this.task ? this.task.a.id : this.lastAction;
    if (key) this.weights[key] = clamp(this.weights[key] - 0.25, 0.35, 2.2);
    if (this.isGrown()) this.say(R.pick(['Hmph!', 'Well, I never!', 'Alright, alright...', 'Sorry!']), 2.5);
    else this.say(this.stage === 'baby' ? R.pick(['Waah!', 'Mwaa...']) : R.pick(['Sorry... I won\'t do it again.', 'But I wasn\'t doing anything!', 'Aww...']), 2.5);
    FX.puff(this.x, this.y - 20);
    if (key && R.chance(0.5)) this.remember(`Was tutted at for ${(ACTION_NAMES[key] || 'something').toLowerCase()}.`, -1);
    if (this.task && this.task.a.id !== 'sleep' && this.task.a.id !== 'deliver') this.abort();
    return key;
  }
  // A lesson from you: little ones learn a great deal, grown-ups a little.
  teach() {
    const gain = learn(this, this.isChild() ? 0.05 : 0.02, 'you');
    this.drives.lonely = Math.max(0, this.drives.lonely - 0.1);
    this.drives.bored = Math.max(0, this.drives.bored - 0.15);
    this.say(lessonLine(this), 2.6);
    return gain;
  }

  // ----- per-step update -----
  update(dt, h) {
    const sleeping = this.task && this.task.a.id === 'sleep' && this.task.phase === 'do';
    const mul = sleeping ? 0.35 : 1;
    const g = this.genes, d = this.drives, c = this.chem;
    const rate = dt / 60;
    const baby = this.stage === 'baby', grown = this.isGrown();
    d.hunger += rate * (baby ? 0.13 : 0.085) * (0.6 + g.appetite * 0.8) * mul * (c.toxin > 0.4 ? 0.3 : 1) * (World.season === 'winter' ? 0.85 : 1);
    d.thirst += rate * 0.08 * mul;
    if (!sleeping) d.tired += rate * (baby ? 0.09 : this.isChild() ? 0.06 : 0.045) * (0.8 + g.laziness * 0.4) * (this.task && this.task.a.id === 'party' ? 0.6 : 1) * (this.isSick() ? 1.6 : 1) * (c.ale > 0.6 ? 1.5 : 1);
    d.lonely += rate * (baby ? 0.09 : 0.05) * (0.4 + g.sociability) * mul;
    d.bored += rate * 0.06 * (0.5 + g.curiosity) * mul;
    if (grown) d.craving += rate * 0.04 * g.pipeLove * mul;
    if (grown && this.job && h > 6.5 && h < 19) d.industry += rate * 0.12 * (1.25 - g.laziness) * (this.stage === 'elder' ? 0.6 : 1);
    else if (grown && !this.job && h > 7 && h < 18) d.industry += rate * 0.02 * (1.1 - g.laziness);
    // warmth: drifts towards how chilly it is where they are
    let chill;
    if (this.inside) chill = this.inside.kind === 'home' && this.inside.chilly ? 0.35 : 0;
    else {
      chill = SEASON_CHILL[World.season] + (Game.raining ? 0.3 : 0) + (Game.darkness > 0.4 ? 0.15 : 0) - (this.task && this.task.a.id === 'party' && World.season === 'winter' ? 0.4 : 0);
      chill *= 1.2 - g.hardiness * 0.5;
      // a warm woollen jumper helps
      if (Village.woollens && this.isGrown()) chill *= 0.7;
      // or something a knitter in the family made
      else if ((homeCrafts(this.home()).knitting || 0) >= 2) chill *= 0.8;
    }
    d.cold += (chill - d.cold) * rate * (chill > d.cold ? 0.35 : 0.6);
    // body chemistry: ale wears off, germs run their course, toxins pass
    c.ale = Math.max(0, c.ale - rate * 0.05);
    if (c.germs > 0) {
      if (!c.peaked) { c.germs += rate * 0.09; if (c.germs >= 0.85) c.peaked = true; }
      else c.germs -= rate * 0.035 * (0.5 + g.hardiness) * (sleeping ? 2 : 1);
      if (c.germs <= 0) { c.germs = 0; c.peaked = false; c.immune = 1; this.remember('Shook off a nasty cold.', 0); }
    }
    c.immune = Math.max(0, c.immune - rate * 0.01);
    c.toxin = Math.max(0, c.toxin - rate * 0.04);
    c.hangover = Math.max(0, c.hangover - rate * 0.12);
    // getting chilled to the bone can bring on a cold
    if (d.cold > 0.75 && c.germs === 0 && c.immune < 0.2 && Math.random() < rate * 0.04 * (1.2 - g.hardiness)) this.catchCold('the chill');
    const achTarget = Math.max(c.germs * 0.75, c.toxin * 0.9, c.hangover * 0.7);
    d.ache += (achTarget - d.ache) * rate * 0.6;
    // a baby in someone's arms, or indoors with a grown-up of the house, gets fed and cuddled
    if (baby && (this.heldBy || (this.inside && this.inside.kind === 'home' && this.inside.inside.some((id) => { const o = Game.villagers.find((x) => x.id === id); return o && o.isGrown(); })))) {
      d.hunger -= rate * 0.16; d.thirst -= rate * 0.16; d.lonely -= rate * 0.2;
    }
    for (const k of DRIVES) d[k] = clamp(d[k], 0, 1);
    moodTick(this, dt);
    if (this.stage === 'baby' || this.isChild()) { d.craving = 0; d.industry = 0; }

    if (this.bubble) { this.bubble.t -= dt / Game.minPerSec; if (this.bubble.t <= 0) this.bubble = null; }
    if (this.iconT > 0) this.iconT -= dt / Game.minPerSec;
    if (this.carried) return;
    if (this.heldBy) { updateHeld(this); if (this.heldBy) return; }
    if (baby || this.isChild()) {
      // every few minutes a little one checks there's someone with them
      this.careT = (this.careT ?? R.f(0, 3)) - dt;
      if (this.careT <= 0) { this.careT = 3; careCheck(this); }
    }

    // speech and listening
    this.speakT -= dt;
    if (this.speakT <= 0) {
      this.speakT = R.f(40, 110);
      if (!this.inside && !sleeping) {
        // grown-ups, the better-read especially, tell little ones things
        const kid = this.isGrown() && R.chance(0.3 + this.edu * 0.5) && Game.villagers.find((o) => o.isChild() && !o.inside && dist(o.x, o.y, this.x, this.y) < 70);
        if (kid) { this.say(instructChild(this, kid), undefined, { to: kid }); this.speakT = R.f(15, 35); }
        else if (this.task && this.task.a.id === 'chat') { /* the conversation does the talking */ }
        else this.chatter();
      }
    }
    // imitation: notice what contented folk nearby are doing
    this.observeT -= dt;
    if (this.observeT <= 0) { this.observeT = R.f(8, 16); if (!this.inside && !sleeping) this.observe(); }

    if (this.leaving) {
      this.walk(dt);
      if (!this.path) {
        this.gone = true;
        if (this.leaving === 'home') for (const col of ['#ffc840', '#5af8ff']) FX.sparkle(this.x, this.y - 10, col);
      }
      return;
    }

    if (!this.task) {
      this.thinkDelay -= dt;
      if (this.thinkDelay <= 0) this.think(h);
      return;
    }
    const task = this.task;
    if (task.a.follow) { followMinder(this, task, dt); return; }
    if (task.phase === 'go') {
      if (task.target.other) return this.updateApproach(dt);
      if (task.target.rabbit) {
        const r = task.target.rabbit;
        if (!World.rabbits.includes(r) || dist(r.x, r.y, this.x, this.y) < 20) { this.finish(); return; }
        task.t -= dt * 0.5; if (task.t < -20) { this.finish(); return; }
        task.repathT = (task.repathT || 0) - dt;
        if (task.repathT <= 0) { task.repathT = 3; if (!this.repathTo(r.x, r.y)) { this.abort(); return; } }
        this.walk(dt, 1.4);
        return;
      }
      this.walk(dt);
      if (!this.path) this.arrive();
      return;
    }
    // doing
    const a = task.a;
    const sat = task.sat || a.sat;
    if (!a.manual) {
      for (const k in sat) {
        const per = sat[k] / a.dur;
        d[k] = clamp(d[k] + per * dt, 0, 1);
      }
    }
    if (a.tick) a.tick(this, task, dt, h);
    if (a.skill) this.practice(a.skill, dt, a.skillRate || 1);
    if (a.social) this.socialTick(dt);
    if (a.zzz && Math.random() < dt * 0.05) FX.zzz(this.x + 3, this.y - 16);
    if (a.id === 'sleep' && this.inside && this.inside.kind === 'home' && Math.random() < dt * 0.02) FX.zzz(this.inside.doorX + 8, this.inside.doorY - 30);
    if (a.prop === 'pipe' && Math.random() < dt * 0.12) FX.smokeRing(this.x + (this.facing === 'left' ? -6 : 6), this.y - 17);
    if (a.id === 'chat' && task.partner) this.chatTick(task, dt);
    if ((a.id === 'party' || a.id === 'fiddle') && Math.random() < dt * (a.id === 'fiddle' ? 0.2 : 0.05)) FX.note(this.x, this.y - 18);
    if (this.pose === 'dance' && R.chance(dt * 0.01) && PHRASES[a.id] && this.isGrown()) this.say(R.pick(PHRASES[a.id]), 2);
    if (a.id === 'watch') this.facing = 'up';
    task.t -= dt;
    if (a.id === 'party' && !Game.party.on) task.t = 0;
    if (task.t <= 0) this.finish();
  }

  observe() {
    for (const o of Game.villagers) {
      if (o === this || o.inside || !o.task || o.task.phase !== 'do' || o.task.a.queued) continue;
      const dd = dist(o.x, o.y, this.x, this.y);
      if (dd > 90) continue;
      const a = o.task.a;
      if (!this.canDo(a) || a.job) continue;
      if (o.mood() < 0.55) continue;
      const trust = (this.rel[o.id] ?? 0) > 0.5 || this.parents.includes(o.id) ? 2 : 1;
      const k = (this.isChild() ? 0.03 : this.stage === 'baby' ? 0.02 : 0.008) * trust;
      this.weights[a.id] = clamp(this.weights[a.id] + k * (1.2 - this.weights[a.id] * 0.5), 0.35, 2.2);
      break;
    }
  }

  catchCold(from) {
    if (this.chem.germs > 0 || this.chem.immune > 0.3) return;
    this.chem.germs = 0.12; this.chem.peaked = false;
    this.remember(`Caught a cold from ${from}.`, -1);
    if (R.chance(0.5)) chronicle(`${this.first} has come down with the sniffles.`, 'sick');
  }

  socialTick(dt) {
    for (const o of Game.villagers) {
      if (o === this || !o.task || o.task.phase !== 'do' || !o.task.a.social) continue;
      if (o.inside !== this.inside) continue;
      if (!this.inside && dist(this.x, this.y, o.x, o.y) > 56) continue;
      this.bond(o, dt * 0.0006);
      // dancing and dining together is how many a romance starts
      if (canCourt(this, o) && (this.task.a.id === 'party' || this.task.a.id === 'eat_inn' || this.task.a.id === 'ale')) {
        const l = clamp((this.love[o.id] || 0) + dt * 0.0012 * chemistry(this, o) * (0.5 + this.genes.romance), 0, 1);
        this.love[o.id] = l; o.love[this.id] = l;
      }
      // a pint beside someone in neon trim rubs off, a little
      if (o.tech > this.tech + 0.1 && this.stage !== 'baby') shiftWays(this, dt * 0.00008 * (o.tech - this.tech) * (0.4 + this.genes.curiosity * 0.8));
      if (this.isSick() && o.chem.germs === 0 && Math.random() < dt * 0.0015 * (1.2 - o.genes.hardiness)) o.catchCold(this.first);
    }
  }
  bond(o, amt) {
    // like-minded folk get on best, schooling included
    const compat = 1 - Math.abs(this.genes.merriness - o.genes.merriness) * 0.5 - Math.abs(this.genes.sociability - o.genes.sociability) * 0.3 - (this.isGrown() && o.isGrown() ? Math.abs(this.edu - o.edu) * 0.35 : 0);
    const v = clamp((this.rel[o.id] ?? 0.1) + (amt > 0 ? amt * compat * 1.2 : amt), -1, 1);
    this.rel[o.id] = v; o.rel[this.id] = v;
    if (amt > 0 && canCourt(this, o)) {
      const chem = chemistry(this, o);
      const inc = amt * 1.4 * chem * (0.5 + (this.genes.romance + o.genes.romance) / 2) * compat;
      const l = clamp((this.love[o.id] || 0) + inc, 0, 1);
      this.love[o.id] = l; o.love[this.id] = l;
    }
  }

  chatTick(task, dt) {
    const p = task.partner;
    task.data.talkT = (task.data.talkT || 0) - dt;
    if (task.data.talkT > 0 || !task.data.leader) return;
    task.data.talkT = R.f(5, 9);
    // the listener answers what was just said, then someone starts a new thread
    // a newcomer asking their questions
    if (task.data.ask) { askExchange(this, p, task); return; }
    const reply = task.data.reply;
    if (reply && Game.villagers.includes(reply.who)) {
      task.data.reply = null;
      reply.who.say(reply.text || lineFor(reply.who, reply.kind, { name: reply.to.first }), undefined, { to: reply.to });
      return;
    }
    const speaker = R.chance(0.5) ? this : p, other = speaker === this ? p : this;
    const mode = task.data.quarrel ? 'quarrel' : task.data.court ? 'court' : null;
    other.pendingReply = null;
    const said = converse(speaker, other, mode);
    speaker.say(said, undefined, { to: other });
    if (Game.selected === speaker || Game.selected === other) devLog('talk', `${speaker.first} to ${other.first}${mode ? ' (' + mode + ')' : ''}: "${said}"`);
    if (mode === 'quarrel') { FX.puff(speaker.x, speaker.y - 20); task.data.reply = { who: other, to: speaker, kind: 'quarrel' }; return; }
    if (mode === 'court' && R.chance(0.6)) FX.hearts((this.x + p.x) / 2, Math.min(this.y, p.y) - 18);
    if (other.pendingReply) task.data.reply = { who: other, to: speaker, kind: other.pendingReply };
    shareWays(speaker, other);
    // gossip spreads colds, too
    if (speaker.chem.germs > 0.3 && Math.random() < 0.08 * (1.2 - other.genes.hardiness)) other.catchCold(speaker.first);
  }

  updateApproach(dt) {
    const task = this.task, other = task.target.other;
    if (!Game.villagers.includes(other) || other.inside || other.leaving || other.carried || (other.task && other.task.a.id === 'sleep')) { this.abort(); return; }
    task.t -= dt * 0.2;
    if (task.t <= -30) { this.abort(); return; }
    const d = dist(this.x, this.y, other.x, other.y);
    if (d < 15) {
      const a = task.a;
      this.path = null;
      if (a.id === 'tend_baby' || a.id === 'nurse' || a.id === 'fetch_child') {
        task.phase = 'do'; this.pose = 'stand'; this.facing = other.x < this.x ? 'left' : 'right'; task.before = { ...this.drives };
        return;
      }
      // a visit with something to hand over (a birthday present, a letter...)
      if (a.meet) {
        task.phase = 'do'; this.pose = 'stand'; task.before = { ...this.drives };
        this.facing = other.x < this.x ? 'left' : 'right';
        a.meet(this, other, task);
        return;
      }
      if (a.id === 'gift') {
        task.phase = 'do'; this.pose = 'stand'; task.before = { ...this.drives };
        this.facing = other.x < this.x ? 'left' : 'right';
        this.say(R.pick(PHRASES.gift), 2.6);
        other.say(R.pick(['For me? Oh!', 'They\'re lovely!', '*blushes*']), 2.6);
        FX.hearts((this.x + other.x) / 2, Math.min(this.y, other.y) - 16);
        const l = clamp((this.love[other.id] || 0) + 0.12 * (0.6 + other.genes.romance), 0, 1);
        this.love[other.id] = l; other.love[this.id] = l;
        this.bond(other, 0.05);
        other.remember(`${this.first} brought me flowers.`, 2);
        feel(other, 'flowers', this.first); feel(this, 'gave_gift', other.first);
        return;
      }
      if (other.isBusyForChat()) { this.abort(); this.cool.chat = Game.time + 20; return; }
      if (riftShy(this, other)) { this.abort(); return; }
      // Start a conversation: both stop and face each other
      if (other.task) other.abort();
      const dur = R.f(18, 32);
      const sweet = this.sweetheart === other.id || this.spouse === other.id;
      const f = this.rel[other.id] ?? 0.1;
      const quarrel = !sweet && Math.random() < (this.genes.temper + other.genes.temper) * 0.06 + (f < 0 ? 0.35 : 0) - (this.genes.merriness + other.genes.merriness) * 0.03;
      const data = { leader: true, talkT: 0, quarrel, court: sweet && this.isGrown(), ask: a.id === 'ask_around' };
      this.task = { a: ACTIONS.chat, phase: 'do', target: { x: this.x, y: this.y }, t: dur, data, partner: other, before: { ...this.drives }, chatLock: true };
      other.task = { a: ACTIONS.chat, phase: 'do', target: { x: other.x, y: other.y }, t: dur, data: { quarrel, court: data.court }, partner: this, before: { ...other.drives }, chatLock: true };
      if (quarrel) {
        this.task.sat = other.task.sat = { lonely: -0.15, bored: -0.25 };
        this.bond(other, -0.1);
        if ((this.rel[other.id] ?? 0) < -0.3 && R.chance(0.3)) chronicle(`${this.first} and ${other.first} had words outside ${this.inside ? this.inside.name : 'in the lane'}. There's no love lost there.`, 'quarrel');
        this.remember(`Had a squabble with ${other.first}.`, -1); other.remember(`Had a squabble with ${this.first}.`, -1);
      } else if (data.court) this.task.sat = other.task.sat = { lonely: -0.8, bored: -0.3 };
      this.pose = 'stand'; other.pose = 'stand';
      if (Math.abs(this.x - other.x) > Math.abs(this.y - other.y)) {
        this.facing = other.x > this.x ? 'right' : 'left'; other.facing = this.x > other.x ? 'right' : 'left';
      } else { this.facing = other.y > this.y ? 'down' : 'up'; other.facing = this.y > other.y ? 'down' : 'up'; }
      if (!quarrel) { this.bond(other, 0.06); riftMeeting(this, other); }
      FX.chatPuff(this.x, this.y - 22);
      return;
    }
    task.repathT -= dt;
    const end = this.path && this.path[this.path.length - 1];
    if (!this.path || task.repathT <= 0 || (end && dist(end[0], end[1], other.x, other.y) > 30)) {
      task.repathT = 4;
      if (!this.repathTo(other.x, other.y)) { this.abort(); return; }
    }
    this.walk(dt);
  }

  walk(dt, boost = 1) {
    if (!this.path) return;
    const speed = WALK_SPEED * boost * (this.stage === 'elder' ? 0.75 : this.isChild() ? 1.15 : this.stage === 'baby' ? 0.3 : 1) * (this.isSick() ? 0.7 : 1) * (World.season === 'winter' && !this.inside ? 0.9 : 1);
    let step = speed * dt;
    this.pose = 'walk';
    while (step > 0 && this.path) {
      const [tx, ty] = this.path[this.pathI];
      const dx = tx - this.x, dy = ty - this.y;
      const d = Math.hypot(dx, dy);
      if (d <= step) {
        this.x = tx; this.y = ty; step -= d; this.walkDist += d;
        this.pathI++;
        if (this.pathI >= this.path.length) { this.path = null; }
      } else {
        this.x += (dx / d) * step; this.y += (dy / d) * step; this.walkDist += step;
        if (Math.abs(dx) > Math.abs(dy) * 1.2) this.facing = dx > 0 ? 'right' : 'left';
        else this.facing = dy > 0 ? 'down' : 'up';
        step = 0;
      }
    }
  }

  serialize() {
    return {
      id: this.id, first: this.first, surname: this.surname, genes: this.genes, age: this.age, homeId: this.homeId, parents: this.parents,
      spouse: this.spouse, sweetheart: this.sweetheart, x: this.x, y: this.y, drives: this.drives, chem: this.chem, weights: this.weights,
      foodLike: this.foodLike, rel: this.rel, love: this.love, skills: this.skills, edu: Math.round(this.edu * 1000) / 1000, eduFrom: this.eduFrom,
      tech: Math.round(this.tech * 1000) / 1000, visor: this.visor, lost: Math.round(this.lost * 1000) / 1000, memories: this.memories, job: this.job,
      playerJob: this.playerJob, wary: this.wary, pouch: this.pouch, stats: this.stats, born: this.born, expecting: this.expecting, lastFood: this.lastFood,
      battery: this.battery, newcomer: this.newcomer, lodgeDay: this.lodgeDay, refusedDay: this.refusedDay,
      hobbies: this.hobbies, hobbySkill: this.hobbySkill, hobbyMat: this.hobbyMat, birds: this.birds,
      moodlets: (this.moodlets || []).filter((m) => m.until > Game.time), wishes: this.wishes, dream: this.dream, dreamsDone: this.dreamsDone, heirlooms: this.heirlooms,
    };
  }
}

// ---------------------------------------------------------------------------
// Kinship and romance helpers
// ---------------------------------------------------------------------------
function related(a, b) {
  if (a.parents.includes(b.id) || b.parents.includes(a.id)) return true;
  if (a.parents.some((p) => b.parents.includes(p))) return true;
  // grandparents too close; cousins may court, as hobbits often do
  const gp = (v) => v.parents.flatMap((p) => { const pp = person(p); return pp ? pp.parents : []; });
  return gp(a).includes(b.id) || gp(b).includes(a.id);
}
function chemistry(a, b) { const lo = Math.min(a.id, b.id), hi = Math.max(a.id, b.id); return hash2(lo * 7 + 3, hi * 13 + 5); }
function canCourt(a, b) {
  return a.stage === 'adult' && b.stage === 'adult' && a.genes.sex !== b.genes.sex && !a.spouse && !b.spouse && !related(a, b) && Math.abs(a.age - b.age) < 12 && chemistry(a, b) > 0.3;
}
// A living villager or someone remembered in the archive.
function person(id) {
  if (id == null) return null;
  return Game.villagers.find((v) => v.id === id) || Game.archive[id] || null;
}
