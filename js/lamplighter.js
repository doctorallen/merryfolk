'use strict';
// ---------------------------------------------------------------------------
// The lamplighter. There's no electricity in the Shire (whatever the rift-folk
// say): the lamps along the lanes and round the square burn oil, and someone
// has to go round with a long pole and light them. The village lamplighter
// sets out a little before sunset and walks from lamp to lamp, nearest next,
// so the lamps come on one after another as the light goes, each glowing only
// once it has been lit. After sunrise they go round again and put them out.
// ---------------------------------------------------------------------------

JOBS.lamplighter = { label: 'Lamplighter', skill: 'lore', icon: 'sun', desc: 'Goes round with a long pole at dusk lighting the lamps along the lanes and round the square, and puts them out again after sunrise.' };

// When the rounds are: lighting from an hour and a quarter before sunset,
// putting out from half an hour after sunrise.
function lampRound(h) {
  const [rise, set] = DAYLIGHT[World.season] || DAYLIGHT.summer;
  if (h >= set - 1.25 || h < rise - 1) return 'light';
  if (h >= rise + 0.5 && h < rise + 4) return 'douse';
  return null;
}
function lampsToDo(round) { return World.lamps.filter((l) => (round === 'light' ? !l.lit : l.lit) && !l.claimed); }
// With two lamplighters, one takes the west of the village and one the east
// (helping the other once their own side is done).
function lampSide(v) {
  const team = Game.villagers.filter((o) => o.job === 'lamplighter' && !o.leaving).sort((a, b) => a.id - b.id);
  if (team.length < 2) return null;
  const xs = World.lamps.map((l) => l.x).sort((a, b) => a - b), mid = xs[Math.floor(xs.length / 2)];
  return team.indexOf(v) === 0 ? (l) => l.x < mid : (l) => l.x >= mid;
}
function nearestLamp(v, round) {
  const mine = lampSide(v), todo = lampsToDo(round);
  const pool = mine && todo.some(mine) ? todo.filter(mine) : todo;
  // the few nearest as the crow flies, then the shortest of those by the lanes
  const near = pool.map((l) => [l, dist(v.x, v.y, l.footX, l.footY)]).sort((a, b) => a[1] - b[1]).slice(0, 4);
  let best = null, bd = 1e9;
  for (const [l, d0] of near) {
    const p = findPath(Math.floor(v.x / 16), Math.floor((v.y - 2) / 16), Math.floor(l.footX / 16), Math.floor((l.footY - 2) / 16));
    const d = p ? p.length * 16 : d0 * 3;
    if (d < bd) { bd = d; best = l; }
  }
  return best;
}
function setLamp(l, on) {
  l.lit = on; l.litAt = Game.time; l.st.useAlt = on;
}

ACTIONS.work_lamps = {
  id: 'work_lamps', label: 'Lighting the lamps', icon: 'sun', sat: { industry: -0.25, bored: -0.1 }, dur: 2.5, pose: 'reach', outdoor: true, job: 'lamplighter', skill: 'lore', skillRate: 0.4,
  label2: (v) => (v.task && v.task.target && v.task.target.round === 'douse' ? 'Putting out the lamps' : 'Lighting the lamps'),
  avail: (v, h) => { const r = lampRound(h); return !!r && lampsToDo(r).length > 0; },
  // the lamps come first: nothing else much matters at lighting-up time
  time: (h) => (lampRound(h) ? 3 : 0),
  extra: () => 1.2,
  target: (v, h) => {
    const round = lampRound(h);
    const l = round && nearestLamp(v, round);
    if (!l) return null;
    l.claimed = v.id;
    return { x: l.footX, y: l.footY, facing: l.footX > l.x ? 'left' : 'right', lamp: l, round };
  },
  release: (v, task) => { const l = task.target.lamp; if (l && l.claimed === v.id) l.claimed = null; },
  done: (v, task) => {
    const { lamp: l, round } = task.target;
    setLamp(l, round === 'light');
    if (round === 'light') { FX.sparkle(l.x, l.y, '#ffd860'); if (R.chance(0.12)) v.say(R.pick(['There we are.', 'And another.', 'Light for the lanes.', 'Mind how you go, now!'])); }
    else FX.puff(l.x, l.y);
    // and straight on to the next one
    if (lampRound(Game.hour) === round && lampsToDo(round).length) v.queue.unshift({ a: ACTIONS.work_lamps });
    else if (round === 'light' && R.chance(0.5)) v.say('That\'s the lot. Evening, all!');
  },
};
ACTION_NAMES.work_lamps = 'Lighting the lamps';

// On their rounds they walk briskly, and when it's time for the round they
// put down whatever they were at.
{
  const walk = Villager.prototype.walk;
  Villager.prototype.walk = function (dt, boost = 1) { return walk.call(this, dt, this.task && this.task.a.id === 'work_lamps' ? boost * 1.8 : boost); };
  const update = Villager.prototype.update;
  Villager.prototype.update = function (dt, h) {
    if (this.job === 'lamplighter' && !this.leaving && !this.carried) {
      this._lampT = (this._lampT ?? 0) - dt;
      if (this._lampT <= 0) {
        this._lampT = 5;
        const r = lampRound(h), t = this.task;
        const busy = t && (t.a.id === 'work_lamps' || this.queue.some((q) => q.a.id === 'work_lamps') || t.a.id === 'drop_off' || t.a.id === 'collect_child' || t.a.follow);
        if (r && !busy && lampsToDo(r).length && !(t && t.a.id === 'sleep' && t.phase === 'do' && r === 'douse' && h < 7)) {
          this.abort();
          this.queue.unshift({ a: ACTIONS.work_lamps });
          this.thinkDelay = 0;
          devLog('jobs', `${this.first} sets out to ${r === 'light' ? 'light' : 'put out'} the lamps`);
        }
      }
    }
    // passing a lamp that still wants seeing to (whoever's side it's on), they stop for it first
    const t = this.task;
    if (t && t.a.id === 'work_lamps' && t.phase === 'go' && t.target.lamp) {
      t._passT = (t._passT ?? 0) - dt;
      if (t._passT <= 0) {
        t._passT = 0.5;
        const round = t.target.round, cur = t.target.lamp;
        const by = lampsToDo(round).filter((l) => l !== cur && dist(this.x, this.y, l.footX, l.footY) < 56)
          .sort((a, b) => dist(this.x, this.y, a.footX, a.footY) - dist(this.x, this.y, b.footX, b.footY))[0];
        if (by && this.repathTo(by.footX, by.footY)) {
          if (cur.claimed === this.id) cur.claimed = null;
          by.claimed = this.id;
          Object.assign(t.target, { x: by.footX, y: by.footY, facing: by.footX > by.x ? 'left' : 'right', lamp: by });
          devLog('jobs', `${this.first} stops at a lamp on the way`);
        }
      }
    }
    return update.call(this, dt, h);
  };
}

// Lamplighters for the village, as soon as there are lamps to light.
{
  const jt = jobTargets;
  jobTargets = function () { const t = jt(), n = Game.villagers.filter((v) => v.isGrown() && !v.leaving).length; t.lamplighter = !World.lamps.length || n < 6 ? 0 : n >= 14 ? 2 : 1; return t; };
  // a steady, early-rising sort who doesn't mind a walk in the dusk
  const jf = jobFit;
  jobFit = function (v, j) {
    let s = jf(v, j);
    if (j === 'lamplighter') s += (1 - v.genes.laziness) * 20 + v.genes.hardiness * 12 - v.genes.sociability * 6 + (v.stage === 'elder' ? 6 : 0);
    return s;
  };
}
