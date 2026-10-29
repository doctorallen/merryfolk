'use strict';
// ---------------------------------------------------------------------------
// The body on Athelas. With the minds on Tyrell, a villager's body chemistry
// is Tyrell's too: ale, a cold, the flu, a bad toadstool and a sprained ankle
// are Athelas courses (vendor/tycho/tyrell/docs/modules/athelas.md), each
// running its phases on the minds' clock, changing how fast their needs rise
// and how their choices weigh while it lasts, and leaving a cold's immunity
// behind. The game reads them as it always read villager.js's chem (ale,
// germs, toxin, immune): `v.chem` is a view of the courses, each level worked
// out from where its course has got to, so everything that asked whether
// someone is tipsy or poorly asks the same way.
//
// The courses are villager.js's chemistry, phase by phase:
//   ale       a level that wears off at a twentieth an hour; its phases are
//             the bands that matter (well in drink past 0.6, tipsy past
//             0.45, mellow below), each as long as the level takes to fall
//             through it, and every pint drunk starts it again at the band
//             its new level says (a phase's `if`)
//   a cold    coming on, at its worst, the sniffles, mending: the germs'
//             rise and fall, slower for the delicate, and twice as fast
//             asleep (an hour asleep brings the phase's end an hour sooner)
//   the flu   laid up a day and a half to two and a half, then getting over
//             it and mending as a cold mends; soup from a friend hastens it
//   a bad toadstool  a level that passes at a twenty-fifth an hour: queasy
//             past 0.5 (no eating), a tummy-ache past 0.4 (no appetite),
//             poorly past 0.35, then settling
//   a sprain  a day's hobble
// What stays the game's: catching things (space: who sat beside whom, who
// natters with a sniffle, a chill in the rain), drinking (the pint in hand is
// counted as it's drunk and told once it's down), the remedies, the aches
// (a need the valley moves), the walk, and what's said and remembered.
// Without the minds, villager.js's chemistry runs as it always did.
// ---------------------------------------------------------------------------

// villager.js's pace, by the hour
const BODY = {
  aleFade: 0.05, tipsy: 0.45, merry: 0.6,
  // a minute's drinking: a pint at the inn over its fifty minutes, a sample of the keg over twenty-five, a sip at a party seat
  pint: 0.22 / 50, keg: 0.15 / 25, partySip: 0.002,
  germsAt: 0.12, germsSick: 0.35, germsPeak: 0.85, germsRise: 0.09, germsFall: 0.035,
  toxinFade: 0.04, toxinSick: 0.35, toxinGut: 0.4, toxinQueasy: 0.5,
  // a cold leaves them immune, the immunity fading a hundredth an hour and keeping a cold off above 0.3: seventy hours
  immuneFade: 0.01, immuneHours: 70,
  flu: { at: 0.6, floor: 0.5 },
  // how much of an hour asleep is told at once to hasten a cold's mending
  restMinutes: 30,
  // a remedy takes this off the germs (a cold past its worst mends on from what's left); one that ends it early keeps a cold off this many hours
  remedy: 0.7, remedyHours: 30,
};
// The bands of a level a course falls through: [bottom, top] by phase.
const ALE_BANDS = { merry: [BODY.merry, 1], tipsy: [BODY.tipsy, BODY.merry], mellow: [0, BODY.tipsy] };
const TOXIN_BANDS = { queasy: [BODY.toxinQueasy, 1], gut: [BODY.toxinGut, BODY.toxinQueasy], poorly: [BODY.toxinSick, BODY.toxinGut], settling: [0, BODY.toxinSick] };
// The germs through a cold's phases and the flu's last two: [from, to].
const GERM_PATH = {
  cold: { coming_on: [BODY.germsAt, BODY.germsSick], worst: [BODY.germsSick, BODY.germsPeak], sniffles: [BODY.germsPeak, BODY.germsSick], mending: [BODY.germsSick, 0] },
  flu: { getting_over: [BODY.flu.floor, BODY.germsSick], mending: [BODY.germsSick, 0] },
};
// The phases a night's sleep hastens (the germs falling, twice as fast asleep).
const BODY_REST = { cold: ['sniffles', 'mending'], flu: ['getting_over', 'mending'] };
// What being poorly does to a choice (villager.js's score: everything but sleep and a remedy at four tenths)
const POORLY = { sleep: 1, remedy_item: 1, '*': 0.4 };
// The flu on top of it (illness.js's: bed, a bite at home and a remedy, or hardly anything else)
const LAID_UP = { sleep: 2, remedy_item: 2, eat_home: 0.8, '*': 0.02 };

// Athelas's settings: someone who sees to another's bruises does it the better for knowing their herbs
MIND_MODULES.athelas = { tendSkill: 'herbalism' };

const Body = {
  w: null, adopt: false, queue: [], flushing: false,
  // is this villager's body Tyrell's just now?
  on(v) { return !!this.w && Shell.on && Shell.w === this.w && minded(v); },
  later(fn) { this.queue.push(fn); },
  flush() {
    if (this.flushing) return;
    this.flushing = true;
    try { while (this.queue.length) { const fn = this.queue.shift(); try { fn(); } catch (e) { if (typeof noteError === 'function') noteError(e, 'the body'); else console.error(e); } } }
    finally { this.flushing = false; }
  },

  // ---- declaring ------------------------------------------------------------
  declare(w) {
    this.w = w; this.queue = [];
    const A = w.athelas;
    const vOf = (ctx) => (ctx.person ? Shell.byPid.get(ctx.person.id) : null);
    const sevOf = (ctx, course) => A.severityOf(ctx.person.id, course) ?? 0;
    // a band's length: an hour for each twentieth (ale) or twenty-fifth (a toadstool) of the level it falls through
    const band = (course, [lo, hi], fade) => [{ name: 'how much is in them', input: (ctx) => Math.max(0, Math.min(sevOf(ctx, course), hi) - lo) / fade, range: [0, 1e4], out: [0, 1e4] }];
    // the delicate mend slower, the hardy faster (the germs falling at 0.035 × (0.5 + hardiness) an hour)
    const hardy = [{ name: 'hardiness', input: (ctx) => { const v = vOf(ctx); return 1 / (0.5 + (v ? v.genes.hardiness : 0.5)); }, range: [0, 100], out: [0, 100] }];
    const sick = { rates: { tired: 1.6 }, weigh: POORLY };
    const keep = { stretch: 1, depth: 0 }; // (a level, not a severity: it neither stretches nor deepens them)
    A.course({ id: 'ale', label: 'Ale', again: 'restart', severity: keep, phases: [
      { id: 'merry', label: 'well in drink', if: [`sev:ale>${BODY.merry}`], minutes: 60, scale: band('ale', ALE_BANDS.merry, BODY.aleFade), rates: { tired: 1.5 } },
      { id: 'tipsy', label: 'merrily tipsy', if: [`sev:ale>${BODY.tipsy}`], minutes: 60, scale: band('ale', ALE_BANDS.tipsy, BODY.aleFade) },
      { id: 'mellow', label: 'a pint or so in', minutes: 60, scale: band('ale', ALE_BANDS.mellow, BODY.aleFade) },
    ] });
    const hours = (from, to, per) => (Math.abs(from - to) / per) * 60;
    A.course({ id: 'cold', label: 'A cold', tags: ['illness'], immunity: BODY.immuneHours * 60, phases: [
      { id: 'coming_on', label: 'coming on', minutes: hours(BODY.germsAt, BODY.germsSick, BODY.germsRise) },
      { id: 'worst', label: 'at its worst', minutes: hours(BODY.germsSick, BODY.germsPeak, BODY.germsRise), ...sick },
      { id: 'sniffles', label: 'the sniffles', minutes: hours(BODY.germsPeak, BODY.germsSick, BODY.germsFall), scale: hardy, ...sick },
      { id: 'mending', label: 'on the mend', minutes: hours(BODY.germsSick, 0, BODY.germsFall), scale: hardy },
    ] });
    A.course({ id: 'flu', label: 'The flu', tags: ['illness'], immunity: BODY.immuneHours * 60, phases: [
      { id: 'laid_up', label: 'laid up', minutes: [1.6 * 1440, 2.6 * 1440], rates: { tired: 1.6 }, weigh: LAID_UP },
      { id: 'getting_over', label: 'getting over it', minutes: hours(BODY.flu.floor, BODY.germsSick, BODY.germsFall), scale: hardy, ...sick },
      { id: 'mending', label: 'on the mend', minutes: hours(BODY.germsSick, 0, BODY.germsFall), scale: hardy },
    ] });
    const gut = { rates: { hunger: 0.3, tired: 1.6 }, weigh: POORLY };
    A.course({ id: 'toxin', label: 'A bad toadstool', tags: ['illness'], again: 'restart', severity: keep, phases: [
      { id: 'queasy', label: 'queasy', if: [`sev:toxin>${BODY.toxinQueasy}`], minutes: 60, scale: band('toxin', TOXIN_BANDS.queasy, BODY.toxinFade), ...gut, blocks: ['eat_home', 'eat_inn'] },
      { id: 'gut', label: 'a tummy-ache', if: [`sev:toxin>${BODY.toxinGut}`], minutes: 60, scale: band('toxin', TOXIN_BANDS.gut, BODY.toxinFade), ...gut },
      { id: 'poorly', label: 'poorly', if: [`sev:toxin>${BODY.toxinSick}`], minutes: 60, scale: band('toxin', TOXIN_BANDS.poorly, BODY.toxinFade), ...sick },
      { id: 'settling', label: 'settling', minutes: 60, scale: band('toxin', TOXIN_BANDS.settling, BODY.toxinFade) },
    ] });
    A.course({ id: 'sprain', label: 'A sprained ankle', phases: [
      { id: 'hobbling', label: 'hobbling', minutes: 1440, weigh: { 'tag:work': 0.3, play: 0.3, chase: 0.3, party: 0.3, stroll: 0.3 } },
    ] });
    w.on('course', (e) => this.later(() => this.phased(e)));
    w.on('recovered', (e) => this.later(() => this.recovered(e)));
  },
  // after the minds start (or load): a village whose bodies weren't the minds' before has its folk's chemistry carried over as they join
  started() { this.adopt = !Game.bodyMinds; Game.bodyMinds = 1; },

  // ---- reading --------------------------------------------------------------
  st() { return this.w && this.w.s.mod.athelas; },
  // the courses running for someone, raw (Athelas's own record)
  running(v) { const st = this.st(); return (st && st.on[v._pid]) || null; },
  has(v, course) { const on = this.running(v); return !!(on && on[course]); },
  phase(v, course) { const on = this.running(v), r = on && on[course]; if (!r) return null; const def = this.w.athelas.courses.get(course); return def && def.phases[r.p] ? def.phases[r.p].id : null; },
  // (a cold ended early by a remedy keeps another off a day or so, as villager.js's remedy left them)
  immune(v) { return this.w.athelas.immune(v._pid, 'flu') || (this.w.athelas.immune(v._pid, 'cold') && !(v._remedied != null && this.w.s.now > v._remedied + BODY.remedyHours * 60)); },
  // The levels, worked out from where each course has got to (kept a moment).
  levels(v) {
    // (anything that changes a course queues a timer, so the queue's count says when to look again)
    const w = this.w, now = w.s.now, seq = w.s.seq;
    if (v._bl && v._blNow === now && v._blSeq === seq && v._blW === w) return v._bl;
    const out = { ale: 0, germs: 0, toxin: 0, immune: 0, hangover: 0 };
    const on = this.running(v), A = w.athelas;
    const done = (r) => (r.until > r.since ? clamp((now - r.since) / (r.until - r.since), 0, 1) : 1);
    const phaseOf = (course, r) => { const d = A.courses.get(course); return d && d.phases[r.p] ? d.phases[r.p].id : null; };
    // a level falling through a band from where it started (its severity) to the band's foot
    const inBand = (bands, course, r) => { const b = bands[phaseOf(course, r)]; if (!b) return 0; const top = Math.min(r.sev ?? 0, b[1]); return b[0] + Math.max(0, top - b[0]) * (1 - done(r)); };
    const along = (path, course, r) => { const p = path[phaseOf(course, r)]; return p ? p[0] + (p[1] - p[0]) * done(r) : 0; };
    if (on) {
      if (on.ale) out.ale = inBand(ALE_BANDS, 'ale', on.ale);
      if (on.cold) {
        out.germs = along(GERM_PATH.cold, 'cold', on.cold);
        // (on the mend from what a remedy left)
        if (v._mendTop != null) { if (phaseOf('cold', on.cold) === 'mending') out.germs = v._mendTop * (1 - done(on.cold)); else if (phaseOf('cold', on.cold) !== 'sniffles' && phaseOf('cold', on.cold) !== 'worst') v._mendTop = null; }
      } else v._mendTop = null;
      if (on.flu) {
        const r = on.flu;
        if (phaseOf('flu', r) === 'laid_up') {
          // as the flu held a cold's germs: rising to its worst, then down to the floor, and there while they're laid up
          const h = (now - r.since) / 60, up = (BODY.germsPeak - BODY.flu.at) / BODY.germsRise;
          out.germs = h < up ? BODY.flu.at + BODY.germsRise * h : Math.max(BODY.flu.floor, BODY.germsPeak - BODY.germsFall * (0.5 + v.genes.hardiness) * (h - up));
        } else out.germs = Math.max(out.germs, along(GERM_PATH.flu, 'flu', r));
      }
      if (on.toxin) out.toxin = inBand(TOXIN_BANDS, 'toxin', on.toxin);
      for (const id in on) {
        // a poison's harm (mischief.js): unnoticed while it works, then as a bad toadstool at its worst, settling after
        const def = A.courses.get(id);
        if (!def || !def.poison) continue;
        const ph = def.phases[on[id].p];
        if (ph && !ph.quiet) out.toxin = Math.max(out.toxin, ph.tells ? def.poison : def.poison * 0.6 * (1 - done(on[id])));
      }
    }
    // the immunity a cold or the flu left, fading from 1 to 0.3 as it runs out
    const imm = w.s.mod.athelas && w.s.mod.athelas.immune[v._pid];
    if (imm) for (const c of ['cold', 'flu']) if (imm[c] > now) out.immune = Math.max(out.immune, 1 - (now - (imm[c] - BODY.immuneHours * 60)) / 60 * BODY.immuneFade);
    // (after a remedy, villager.js left them at 0.6, fading as ever)
    if (v._remedied != null && imm && imm.cold > now) out.immune = Math.min(out.immune, Math.max(0, 0.6 - (now - v._remedied) / 60 * BODY.immuneFade));
    v._bl = out; v._blNow = now; v._blSeq = seq; v._blW = w;
    return out;
  },
  // the pint in hand, drunk so far (told once it's down)
  drinking(v) { const t = v.task; return t && t.data && t.data.ale > 0 ? t.data.ale : 0; },
  level(v, k) { const L = this.levels(v); return k === 'ale' ? Math.min(1, L.ale + this.drinking(v)) : L[k] || 0; },
  // illness.js's record of the flu or a sprain, as the courses have it (the same object while it lasts)
  illness(v) {
    const on = this.running(v);
    let kind = null, r = null;
    if (on && on.flu && this.phase(v, 'flu') === 'laid_up') { kind = 'flu'; r = on.flu; }
    else if (on && on.sprain) { kind = 'sprain'; r = on.sprain; }
    if (!kind) return null;
    // (the same record from the day it came on, its end brought nearer by a visit with soup)
    const key = kind + ':' + r.since;
    if (!v._ilv || v._ilv.key !== key) v._ilv = { key, o: { kind, until: r.until } };
    v._ilv.o.until = r.until;
    return v._ilv.o;
  },

  // ---- changing -------------------------------------------------------------
  afflict(v, course, from, sev) { return Shell.tell(v, 'afflict', sev === undefined ? [v._pid, course, from || null] : [v._pid, course, from || null, Math.round(clamp(sev, 0, 1) * 1e4) / 1e4]); },
  cure(v, course) { if (this.has(v, course)) Shell.tell(v, 'cure', [v._pid, course]); },
  hasten(v, course, minutes) { if (this.has(v, course) && minutes) Shell.tell(v, 'hasten', [v._pid, course, Math.round(minutes * 1e4) / 1e4]); },
  // a pint (or some of one) is down: the ale in them, from the band its level says
  drink(v, amount) {
    if (!(amount > 0)) return;
    this.afflict(v, 'ale', null, Math.min(1, this.levels(v).ale + amount));
  },
  // the game set a level outright (a toast at a feast, a toadstool nibbled, the dev drawer)
  set(v, k, x) {
    x = Number.isFinite(x) ? clamp(x, 0, 1) : 0;
    if (k === 'ale') { const sev = x - this.drinking(v); if (sev > 1e-6) this.afflict(v, 'ale', null, sev); else this.cure(v, 'ale'); }
    else if (k === 'toxin') { if (x > 1e-6) this.afflict(v, 'toxin', null, x); else this.cure(v, 'toxin'); }
    else if (k === 'germs') { if (x <= 0) { this.cure(v, 'cold'); if (this.phase(v, 'flu') !== 'laid_up') this.cure(v, 'flu'); } else if (!this.has(v, 'cold') && !this.has(v, 'flu')) this.afflict(v, 'cold'); }
    // (the immunity is the courses', and a sore head never came of the ale)
  },
  // illness.js set the flu or a sprain: the course, running until when it said
  setIllness(v, x) {
    if (!x) return;
    if (x.kind === 'flu') {
      // the flu takes over from the cold it was
      this.cure(v, 'cold');
      if (!this.afflict(v, 'flu', null)) return;
    } else if (x.kind === 'sprain') { if (!this.afflict(v, 'sprain', null)) return; }
    else return;
    const on = this.running(v), r = on && on[x.kind];
    if (r && Number.isFinite(x.until)) this.hasten(v, x.kind, r.until - x.until);
  },
  // A cold caught (villager.js's catchCold, from someone or something): false if they're not open to one.
  catchCold(v, fromV) {
    if (this.has(v, 'cold') || this.has(v, 'flu') || this.immune(v)) return false;
    return this.afflict(v, 'cold', fromV && fromV._pid !== v._pid ? fromV._pid : null) === true;
  },
  // A remedy: as villager.js's took 0.7 off the germs and the toxin. A cold
  // coming on, or on the mend, is gone (and they're kept from another a day
  // or so); one at its worst or past it mends on from what's left, no longer
  // sniffling. A toadstool or a bad mushroom is gone, and the flu once
  // they're up from it.
  remedy(v) {
    const ph = this.phase(v, 'cold'), left = this.levels(v).germs - BODY.remedy;
    if ((ph === 'worst' || ph === 'sniffles') && left > 0) {
      // past its worst at once, and on the mend from what's left (a phase at a time, as the clock moves: rest)
      v._mendAt = left;
      this.hasten(v, 'cold', 1e6);
    } else if (this.has(v, 'cold')) { this.cure(v, 'cold'); v._remedied = this.w.s.now; }
    this.cure(v, 'toxin');
    if (this.has(v, 'flu') && this.phase(v, 'flu') !== 'laid_up') this.cure(v, 'flu');
    const on = this.running(v);
    if (on) for (const id of Object.keys(on).sort()) { const d = this.w.athelas.courses.get(id); if (d && d.poison && !d.phases[on[id].p].quiet) this.cure(v, id); }
  },

  // ---- every step -----------------------------------------------------------
  // asleep, a cold mends twice as fast: each half hour asleep brings its phase's end half an hour sooner
  rest(v, dt) {
    // a remedy's cold, on the mend from what was left of it
    if (v._mendAt != null) {
      const ph = this.phase(v, 'cold'), on = this.running(v);
      if ((ph === 'worst' || ph === 'sniffles') && on.cold.until > this.w.s.now + 1e-6) this.hasten(v, 'cold', 1e6);
      else if (ph === 'mending') {
        const r = on.cold, len = r.until - r.since, want = (v._mendAt / BODY.germsSick) * len;
        v._mendAt = null;
        if (r.until - this.w.s.now > want) { v._mendTop = Math.min(BODY.germsSick, (want / len) * BODY.germsSick); this.hasten(v, 'cold', r.until - this.w.s.now - want); }
      } else if (ph !== 'worst' && ph !== 'sniffles') v._mendAt = null;
    }
    if (!(v.task && v.task.a.id === 'sleep' && v.task.phase === 'do')) return;
    for (const course in BODY_REST) {
      if (!BODY_REST[course].includes(this.phase(v, course))) continue;
      v._rest = (v._rest || 0) + dt;
      if (v._rest >= BODY.restMinutes) { v._rest -= BODY.restMinutes; this.hasten(v, course, BODY.restMinutes); }
      return;
    }
  },

  // ---- what the courses tell ------------------------------------------------
  phased(e) {
    const v = Shell.byPid.get(e.id);
    if (!v) return;
    // up from the flu at last (illness.js's word for it)
    if (e.course === 'flu' && e.phase === 'getting_over') {
      unfeel(v, 'laid_up'); v.remember('Got over the flu at last.', 1);
      if (R.chance(0.5)) chronicle(`${v.first} is up and about again after the flu.`, 'sick');
    }
  },
  recovered(e) {
    const v = Shell.byPid.get(e.id);
    if (!v) return;
    if (e.course === 'cold' && !e.cured) v.remember('Shook off a nasty cold.', 0);
    if (e.course === 'sprain') unfeel(v, 'sprained');
    if (e.course === 'flu') unfeel(v, 'laid_up');
  },

  // ---- into the minds and out ------------------------------------------------
  // A villager joining minds that never had their body: what villager.js's chemistry had of it, as courses.
  adoptBody(v) {
    const c = v._chem || {}, ill = v._illness && Game.time < v._illness.until ? v._illness : null;
    if (c.ale > 0.001) this.afflict(v, 'ale', null, c.ale);
    if (c.toxin > 0.001) this.afflict(v, 'toxin', null, c.toxin);
    if (ill && ill.kind === 'flu') this.setIllness(v, ill);
    else if (c.germs > 0) this.afflict(v, 'cold');
    else if (c.immune > 0.3 && this.afflict(v, 'cold')) this.cure(v, 'cold'); // (immune for a while yet)
    if (ill && ill.kind === 'sprain') this.setIllness(v, ill);
  },
  // A villager leaving the minds (off on a trip): their body as it is, for the road.
  unhook(v) {
    if (!this.on(v)) return;
    const L = this.levels(v);
    v._chem = { ale: this.level(v, 'ale'), germs: L.germs, toxin: L.toxin, immune: L.immune, hangover: 0, peaked: this.phase(v, 'cold') !== 'coming_on' && this.phase(v, 'cold') !== 'worst' };
    const ill = this.illness(v);
    v._illness = ill ? { kind: ill.kind, until: ill.until } : null;
  },
};

// A villager's chem and illness, as the game reads and writes them: with the
// minds, views of the courses; before they join them (or without them), their own.
{
  const view = (v) => {
    if (v._bv) return v._bv;
    const o = {};
    for (const k of ['ale', 'germs', 'toxin', 'immune', 'hangover']) Object.defineProperty(o, k, { get: () => Body.level(v, k), set: (x) => Body.set(v, k, x), enumerable: true });
    Object.defineProperty(o, 'peaked', { get: () => !['coming_on', 'worst'].includes(Body.phase(v, 'cold')), set: () => {}, enumerable: false });
    return (v._bv = o);
  };
  Object.defineProperty(Villager.prototype, 'chem', {
    configurable: true,
    get() { return Body.on(this) ? view(this) : this._chem; },
    set(x) { this._chem = Object.assign({ ale: 0, germs: 0, toxin: 0, immune: 0, hangover: 0 }, x || {}); },
  });
  // (asked of every option in every choice: straight from the levels)
  const sick = Villager.prototype.isSick, tipsy = Villager.prototype.isTipsy;
  Villager.prototype.isSick = function () { if (!Body.on(this)) return sick.call(this); const L = Body.levels(this); return L.germs > 0.35 || L.toxin > 0.35; };
  Villager.prototype.isTipsy = function () { return Body.on(this) ? Body.level(this, 'ale') > BODY.tipsy : tipsy.call(this); };
  Object.defineProperty(Villager.prototype, 'illness', {
    configurable: true,
    get() { return Body.on(this) ? Body.illness(this) : this._illness; },
    set(x) { if (Body.on(this)) Body.setIllness(this, x); else this._illness = x || null; },
  });
}

// The pint in hand is counted as it's drunk (the view adds it in), and told
// to the minds once it's down, or as far as they got with it; a party seat's
// sips every so often. (Ale wears off at its pace whatever's in them, so the
// pint in hand wears off as it's drunk only while there's none in them before
// it: villager.js's one level, falling a twentieth an hour, drink or no.)
const bodySip = (v, task, dt, per) => {
  const fade = Body.levels(v).ale > 0 ? 0 : (BODY.aleFade / 60) * dt;
  task.data.ale = Math.max(0, (task.data.ale || 0) + dt * per - fade);
};
{
  const sip = (id, per) => {
    const tick = ACTIONS[id].tick;
    ACTIONS[id].tick = function (v, task, dt) {
      if (!Body.on(v)) return tick.apply(this, arguments);
      bodySip(v, task, dt, per);
    };
  };
  sip('ale', BODY.pint);
  sip('ale_item', BODY.keg);
  const party = ACTIONS.party.tick;
  ACTIONS.party.tick = function (v, task, dt) {
    if (!Body.on(v)) return party.apply(this, arguments);
    if (World.season === 'winter') v.drives.cold = Math.max(0, v.drives.cold - dt * 0.008);
    if (task.spot && task.spot.kind === 'partyseat' && Village.stores.ale > 0 && !v.isChild()) {
      bodySip(v, task, dt, BODY.partySip);
      if (task.data.ale >= 0.06) { const x = task.data.ale; task.data.ale = 0; Body.drink(v, x); }
    }
  };
}

window.addEventListener('DOMContentLoaded', () => {
  registerField('bodyMinds', 0);
  // whatever was in hand is down when the task is put down (finished or not)
  patch(Shell, 'taskSet', (ts) => function (v, old, t) {
    if (old && old !== t && old.data && old.data.ale > 0 && Body.on(v)) { const x = old.data.ale; old.data.ale = 0; Body.drink(v, x); }
    return ts.apply(this, arguments);
  }, 'body');
  patch(Shell, 'join', (jn) => function (v) {
    const r = jn.apply(this, arguments);
    if (Body.adopt && Body.on(v)) Body.adoptBody(v);
    return r;
  }, 'body');
  patch(Shell, 'unhook', (uh) => function (v) { Body.unhook(v); return uh.apply(this, arguments); }, 'body');
  // what the courses set off is run once the minds' clock has moved, and the first look at a loaded village adopts its folk's bodies
  patch(Shell, 'advance', (adv) => function () { const r = adv.apply(this, arguments); Body.flush(); return r; }, 'body');
  patch(Shell, 'sync', (sy) => function () { const r = sy.apply(this, arguments); Body.adopt = false; return r; }, 'body');
  // asleep, a cold mends faster
  patch(Villager.prototype, 'update', (upd) => function (dt, h) { const r = upd.call(this, dt, h); if (Body.on(this)) Body.rest(this, dt); return r; }, 'body');
  // a new cold forgets the last remedy
  patch(Body, 'catchCold', (cc) => function (v) { const r = cc.apply(this, arguments); if (r) v._remedied = null; return r; }, 'body');
});
