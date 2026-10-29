'use strict';
// ---------------------------------------------------------------------------
// Being poorly, properly (but nobody ever dies of it). A cold is a cold: the
// sniffles for a day. But in the cold months a cold can turn to the flu, and
// someone with the flu is laid up in bed for a couple of days, too weak for
// work or play. A tumble chasing rabbits or a slip at heavy work can mean a
// sprained ankle: a hobble and no heavy lifting for a day.
//
// Friends and family rally round: they come to the door with a pot of soup,
// sit with the patient a while and leave them feeling better (and grateful).
// The herbalist still does the rounds with remedies. You can drop a remedy
// too.
// ---------------------------------------------------------------------------

MOODLETS.laid_up = ['Laid up with the flu', -0.12, 2880, ['*cough* Is it spring yet?', 'Everything aches.']];
MOODLETS.sprained = ['A sprained ankle', -0.06, 1440, ['Ow. Ow. Ow.', 'I\'ll never chase another rabbit.']];
MOODLETS.soup = ['{x} brought me soup', 0.1, 1440, ['That soup of {x}\'s could raise the dead. Well, the poorly.']];
function hasFlu(v) { return !!(v.illness && v.illness.kind === 'flu' && Game.time < v.illness.until); }
function sprained(v) { return !!(v.illness && v.illness.kind === 'sprain' && Game.time < v.illness.until); }

{
  // a cold in the cold months may turn to flu
  patch(Villager.prototype, 'catchCold', (cc) => function (from) {
    const before = this.chem.germs;
    cc.apply(this, arguments);
    if (before > 0 || this.chem.germs <= 0) return;
    const p = { winter: 0.3, autumn: 0.15, spring: 0.06, summer: 0.02 }[World.season] * (1.3 - this.genes.hardiness) * (this.stage === 'elder' ? 1.5 : 1);
    if (R.chance(p)) {
      this.illness = { kind: 'flu', until: Game.time + R.f(1.6, 2.6) * 1440 };
      this.chem.germs = 0.6;
      feel(this, 'laid_up');
      chronicle(`${this.name()} is laid up in bed with the flu. A visit and a pot of soup would cheer ${this.pron.them} up.`, 'sick');
    }
  }, 'illness');
  // the flu keeps germs high and the patient abed; a sprain slows them down
  patch(Villager.prototype, 'update', (upd) => function (dt, h) {
    // (with the minds, the flu and a sprain run their courses and say when they're over: body.js)
    if (!Body.on(this) && this.illness && Game.time >= this.illness.until) {
      const k = this.illness.kind; this.illness = null;
      if (k === 'flu') { unfeel(this, 'laid_up'); this.remember('Got over the flu at last.', 1); if (R.chance(0.5)) chronicle(`${this.first} is up and about again after the flu.`, 'sick'); }
      else unfeel(this, 'sprained');
    }
    if (hasFlu(this)) { this.chem.germs = Math.max(this.chem.germs, 0.5); this.drives.tired = Math.max(this.drives.tired, 0.55); }
    return upd.call(this, dt, h);
  }, 'illness');
  patch(Villager.prototype, 'score', (score) => function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s <= 0 || Body.on(this)) return s; // (with the minds, the courses weigh it: body.js)
    const mul = (n, f) => { s *= f; if (ex) ex.mul.push([n, f]); };
    if (hasFlu(this)) mul('laid up with flu', a.id === 'sleep' || a.id === 'eat_home' || a.id === 'remedy_item' ? 2 : 0.05);
    else if (sprained(this) && (a.job || ['play', 'chase', 'party', 'stroll'].includes(a.id))) mul('a sprained ankle', 0.3);
    return s;
  }, 'illness');
  patch(Villager.prototype, 'walk', (walk) => function (dt, boost = 1) { return walk.call(this, dt, sprained(this) ? boost * 0.5 : boost); }, 'illness');
  // a tumble, now and then
  patch(Villager.prototype, 'finish', (fin) => function () {
    const t = this.task;
    if (t && !this.illness && this.stage !== 'baby' && (t.a.id === 'chase' || (t.a.job && t.a.pose === 'work')) && R.chance(t.a.id === 'chase' ? 0.04 : 0.006)) {
      this.illness = { kind: 'sprain', until: Game.time + 1440 };
      feel(this, 'sprained');
      if (!this.inside) this.say(R.pick(['Ow! My ankle!', 'Oof! Twisted it!']), 3);
      chronicle(`${this.first} has sprained an ankle ${t.a.id === 'chase' ? 'chasing a rabbit' : 'at work'} and is hobbling about.`, 'sick');
    }
    return fin.call(this);
  }, 'illness');
  // being laid up shows in the panel
  patch(Villager.prototype, 'activity', (act) => function () { return hasFlu(this) && this.task && this.task.a.id === 'sleep' ? 'Laid up in bed with the flu' : act.call(this); }, 'illness');
}

// Friends come round with soup.
ACTIONS.bring_soup = {
  id: 'bring_soup', label: 'Taking soup to someone poorly', icon: 'stew', sat: { lonely: -0.3, bored: -0.2 }, dur: 20, pose: 'inside', stages: ADULT, queued: true,
  label2: (v) => (v.task && v.task.target.patient ? `Taking soup to ${v.task.target.patient.first}` : 'Taking soup to someone poorly'),
  target: (v, h, extra) => { const p = extra && extra.patient; return p && Game.villagers.includes(p) && p.homeId >= 0 && hasFlu(p) ? { building: p.home(), patient: p } : null; },
  done: (v, task) => {
    const p = task.target.patient;
    if (!Game.villagers.includes(p)) return;
    feel(p, 'soup', v.first); addSentiment(p, v, 'grateful', 'soup when I had the flu', 8);
    p.drives.lonely = Math.max(0, p.drives.lonely - 0.4);
    // a good visit speeds the mend (if they're not up and about already)
    if (Body.on(p)) Body.hasten(p, 'flu', 240); else if (p.illness) p.illness.until -= 240;
    const home = v.homeId >= 0 ? v.home() : null;
    if (home && home.pantry.veg > 0) home.pantry.veg--; else if ((Village.stores.veg || 0) > 0) Village.use('veg', 1);
    v.remember(`Took soup round to ${p.first}, who has the flu.`, 1);
  },
};
ACTION_NAMES.bring_soup = 'Bringing soup to the sick';
function soupRounds() {
  for (const p of Game.villagers.filter(hasFlu)) {
    const friends = Game.villagers.filter((o) => o !== p && o.isGrown() && !o.leaving && !hasFlu(o) && o.homeId !== p.homeId && ((o.rel[p.id] || 0) > 0.3 || p.parents.includes(o.id) || o.parents.includes(p.id)) && !o.queue.some((q) => q.a.id === 'bring_soup'));
    for (const o of friends.sort(() => Math.random() - 0.5).slice(0, 2)) if (R.chance(0.5)) o.queue.push({ a: ACTIONS.bring_soup, extra: { patient: p } });
  }
}
window.addEventListener('DOMContentLoaded', () => {
  addHook('onHour', (h) => { if (h === 11 || h === 17) soupRounds(); });
  // the panel's health chips know about flu and sprains
  const hc = healthChips;
  healthChips = function (v) {
    let out = hc(v);
    if (hasFlu(v)) out = '<span class="chip bad">Laid up with flu</span>' + out.replace('<span class="chip good">Hale and hearty</span>', '');
    if (sprained(v)) out = '<span class="chip mid">Sprained ankle</span>' + out.replace('<span class="chip good">Hale and hearty</span>', '');
    return out;
  };
});
