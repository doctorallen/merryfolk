'use strict';
// ---------------------------------------------------------------------------
// Conversation, played as the wizard. A talk is a run of threads: short
// conversations of a few beats about one kind of thing (their evenings, their
// work, a worry, a wish, the one they lost), written once and filled from the
// hobbit's real state. Each beat is something they say and two or three things
// you might say back, each with an approach (warm, jest, ask, listen, advise,
// share, comfort) that lands well or badly with their temper. Every answer
// opens a door; "Let it lie" drops the subject and "Good day" ends the talk.
//
// What they say is chosen Valve-style: of the lines written for a moment, the
// most specific that fits them wins, and one they haven't said to you lately
// is preferred, so lines are purely additive. Folk remember what you talked
// about (bond.js): the greetings call back to it, secrets and in-jokes are
// kept, and a subject that went badly is best left alone for a day or two.
// Some come to you with something of their own, and everyone's patience runs
// out in the end. When someone's cross, grieving, homesick or proud, the first
// thing you choose is how to come at it (the Arabian Nights layer: approach ×
// situation, shifted by their temper, what they think of you, what you know
// and a little luck, gives a better or worse outcome).
//
// The words live in packs (talk/<name>.js), plain data that call talkPack().
// Only a village played as the wizard loads them: the core straight away, the
// rest a pack at a time in idle moments afterwards. They're loaded by <script>
// tag, so the game still works opened straight from the folder.
//
// Authoring, in a pack:
//   addThread({ id, label, about, when(F), weight, cool, theirs, light, rel(F),
//               reveals, open: { warm: '...' }, beats: { start: {...}, ... }, end: { fx } })
//   a beat: { line: 'key' | text: '...', who: 'them'|'wiz'|'aside', fx, notice,
//             go: [ { ap, say, label, to, need, fx, soft } ], end: true }
//   lines('key', [ { if: { temper: 'witty' }, not: {...}, pri, text: ['...'] } ])
//   frags('key', ['...']), addSituation(key, {...}) — see the banner of talk/core.js
// ---------------------------------------------------------------------------

const THREADS = {};
const TALK_LINES = {};
const FRAGS = {};
const SITUATIONS = {};
// every pack, in the order it's worth having (the core first)
const TALK_MANIFEST = ['core', 'wizard', 'wizard2', 'wizard3', 'wizard4', 'ages', 'ages2', 'ages3', 'work', 'work2', 'work3', 'work4'];
const TalkPacks = { loaded: new Set(), waiting: {}, current: null, started: false };

function addThread(t) { THREADS[t.id] = { weight: 1, cool: 3, start: 'start', beats: {}, ...t, pack: TalkPacks.current }; }
function lines(key, rules) { const list = TALK_LINES[key] || (TALK_LINES[key] = []); for (const r of rules) list.push(typeof r === 'string' ? { text: [r] } : { ...r, text: Array.isArray(r.text) ? r.text : [r.text] }); }
function frags(key, list) { (FRAGS[key] || (FRAGS[key] = [])).push(...list); }
function addSituation(key, s) { SITUATIONS[key] = { pri: 1, ...s, key }; }
// A pack may compute facts of its own: fn(v, F, T) sets keys on F. Set every
// key you add (null when it doesn't apply), so the lint knows it's a fact.
const FACT_FNS = [];
function addFacts(fn) { FACT_FNS.push(fn); }

// A pack registers itself by calling this from its own file.
function talkPack(name, fn) {
  TalkPacks.current = name;
  try { fn(); } catch (e) { console.error(`talk pack ${name}:`, e); }
  TalkPacks.current = null;
  TalkPacks.loaded.add(name);
  for (const r of TalkPacks.waiting[name] || []) r();
  delete TalkPacks.waiting[name];
}
function loadTalkPack(name) {
  if (TalkPacks.loaded.has(name)) return Promise.resolve();
  return new Promise((resolve) => {
    if (TalkPacks.waiting[name]) { TalkPacks.waiting[name].push(resolve); return; }
    TalkPacks.waiting[name] = [resolve];
    const s = document.createElement('script');
    s.src = `talk/${name}.js`;
    s.onerror = () => { console.warn(`talk pack ${name} failed to load`); TalkPacks.loaded.add(name); for (const r of TalkPacks.waiting[name] || []) r(); delete TalkPacks.waiting[name]; };
    document.head.appendChild(s);
  });
}
// The core at once; the rest one at a time when the page is idle.
function startTalkLoading() {
  if (TalkPacks.started) return;
  TalkPacks.started = true;
  loadTalkPack('core').then(() => {
    const rest = TALK_MANIFEST.filter((n) => n !== 'core');
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
    const next = () => { const n = rest.shift(); if (n) loadTalkPack(n).then(() => idle(next)); };
    idle(next);
  });
}
function loadAllTalk() { return Promise.all(TALK_MANIFEST.map(loadTalkPack)); }

// --- Facts: what's true about this hobbit, now, in one flat dictionary ---------------
const SEASON_WORD = { spring: 'spring', summer: 'summer', autumn: 'autumn', winter: 'winter' };
function hourWord(h) { return h < 6 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'; }
function factsOf(v, T) {
  const b = bondFull(v), r = regardOf(v);
  const hob = (typeof hobbiesOf === 'function' ? hobbiesOf(v) : [])[0] || null;
  const H = hob && HOBBIES[hob];
  const made = hob ? ((v.stats && v.stats['made_' + hob]) || 0) : 0;
  const sp = v.spouse != null ? personById(v.spouse) : null;
  const kids = Game.villagers.filter((o) => o.parents && o.parents.includes(v.id));
  const parents = (v.parents || []).map(personById).filter(Boolean);
  const riv = typeof rivalOf === 'function' ? rivalOf(v) : null;
  const friends = typeof goodFriends === 'function' ? goodFriends(v) : [];
  const mem = (v.memories || []).find((m) => Game.day - m.d <= 3 && Math.abs(m.v || 0) >= 1) || null;
  const feeling = (typeof feelingsOf === 'function' ? feelingsOf(v) : []).find((f) => f[3] && !f[3].k.startsWith('wizard'));
  const wish = (typeof wishesOf === 'function' ? wishesOf(v) : [])[0];
  const lk = typeof likesOf === 'function' ? likesOf(v) : [];
  const F = {
    name: v.first, surname: v.surname, full: v.name(), id: v.id,
    temper: v.isChild() ? 'child' : temperOf(v), register: typeof register === 'function' ? register(v) : 'common',
    stage: v.stage === 'elder' ? 'elder' : v.isChild() ? 'child' : 'grown', band: v.isChild() ? kidBand(v) : null,
    sex: v.genes.sex, they: v.pron.they, them: v.pron.them, their: v.pron.their,
    mood: v.mood() > 0.7 ? 'merry' : v.mood() > 0.45 ? 'fair' : v.mood() > 0.25 ? 'low' : 'miserable',
    sick: v.isSick(), hungry: v.drives.hunger > 0.65, tired: v.drives.tired > 0.65, tipsy: v.isTipsy && v.isTipsy(), lonely: v.drives.lonely > 0.6, bored: v.drives.bored > 0.6,
    job: v.job || null, jobWord: v.job ? JOBS[v.job].label.toLowerCase() : null,
    was: T && T.was ? T.was : null,
    pastime: hob, pastimeWord: H ? hobbyName(v, hob).toLowerCase() : null, made, madeOne: H ? H.made[0] : null, madeMany: H ? H.made[1] : null,
    skillWord: hob && v.hobbySkill ? hobbySkillWord(v.hobbySkill[hob] || 0) : null,
    spouse: sp ? sp.first : null, kids: kids.map((o) => o.first), kid: kids[0] ? kids[0].first : null, kidCount: kids.length,
    parent: parents[0] ? parents[0].first : null,
    rival: riv ? riv.first : null, friend: friends[0] ? friends[0].first : null,
    likes: lk, like: lk[0] ? (LIKES[lk[0]] || lk[0]) : null, dislike: v.dislikes && v.dislikes[0] ? (LIKES[v.dislikes[0]] || v.dislikes[0]) : null,
    values: typeof valuesOf === 'function' ? valuesOf(v) : [],
    wish: wish ? wish.k : null, wishText: wish && WISHES[wish.k] ? wishText(wish).replace(/^./, (c) => c.toLowerCase()) : null,
    dream: v.dream ? v.dream.k : null, dreamText: v.dream && DREAMS[v.dream.k] ? dreamText(v.dream).replace(/^./, (c) => c.toLowerCase()) : null,
    memory: mem ? mem.t : null, memoryGood: mem ? mem.v > 0 : null,
    feeling: feeling ? feeling[3].k : null, feelingText: feeling ? feeling[0] : null, feelingX: feeling && feeling[3].x ? feeling[3].x : null,
    home: v.homeId >= 0 ? v.home().name : null, homeless: v.homeId < 0,
    rift: v.isRiftborn && v.isRiftborn(), riftWays: v.tech > 0.35, lost: v.arc && v.arc.lost && !v.arc.lost.found ? v.arc.lost.name : null, lostRel: v.arc && v.arc.lost ? v.arc.lost.rel : null,
    goBetween: typeof isGoBetween === 'function' ? !!isGoBetween(v) : false,
    weather: Game.raining ? 'rain' : Game.weather === 'snow' ? 'snow' : Game.weather || 'fair', season: SEASON_WORD[World.season] || World.season, hour: hourWord(Game.hour),
    party: !!Game.party.on, holiday: typeof holidayToday === 'function' && holidayToday(),
    // the wizard's side
    fond: r, trust: b.trust || 0, respect: b.respect || 0, talks: b.talks || 0, familiar: familiarity(v),
    known: Object.keys(b.known || {}), seen: b.seen, met: !!(Game.wizMet || {})[v.id], metToday: (Game.wizMet || {})[v.id] === Game.day,
    joke: b.jokes[0] ? b.jokes[0].t : null, jokeKey: b.jokes[0] ? b.jokes[0].k : null,
    promiseKept: (b.promises || []).some((p) => p.state === 'kept' && Game.day - p.settled <= 3), promiseBroken: (b.promises || []).some((p) => p.state === 'broken' && Game.day - p.settled <= 5),
    promiseOpen: (b.promises || []).find((p) => p.state === 'open') ? b.promises.find((p) => p.state === 'open').t : null,
    respectWord: (b.respect || 0) > 0.4 ? 'hangs on your word' : (b.respect || 0) > 0.15 ? 'listens to you' : (b.respect || 0) < -0.2 ? 'thinks you a meddler' : null,
    told: b.told[0] ? b.told[0].t : null, toldKey: b.told[0] ? b.told[0].k : null,
    lastThread: b.lastThread || null, lastLabel: b.lastThread && THREADS[b.lastThread] ? threadLabel(THREADS[b.lastThread], null) : null,
    daysSince: b.last ? Game.day - b.last : null, hearth: typeof hearthFolk === 'function' && hearthFolk().includes(v),
    wiz: 'Gandalf', pet: petPhrase(v),
  };
  for (const fn of FACT_FNS) { try { fn(v, F, T); } catch (e) { console.warn('talk facts:', e); } }
  F.situation = situationOf(F);
  return F;
}
// --- Promises: kept or broken by what happens ---------------------------------------
// A pack can say how a kind of promise is settled: fn(v, p) → 'kept' | 'broken' | null (not yet).
const PROMISE_CHECKS = [];
function addPromiseCheck(prefix, fn) { PROMISE_CHECKS.push([prefix, fn]); }
// a wish you said you'd see to is kept when it comes true
addPromiseCheck('wish', (v, p) => (v.memories || []).some((m) => m.d >= p.d && /^Got my wish/.test(m.t)) ? 'kept' : null);
function settlePromises() {
  if (!playMode()) return;
  for (const v of Game.villagers) {
    const b = (Game.wizBond || {})[v.id];
    if (!b || !b.promises) continue;
    for (const p of b.promises) {
      if (p.state !== 'open') continue;
      const chk = PROMISE_CHECKS.find(([pre]) => p.k.startsWith(pre));
      let st = chk ? chk[1](v, p) : null;
      if (!st && Game.day > p.due) st = p.k.startsWith('secret') ? 'kept' : 'lapsed';
      if (!st) continue;
      p.state = st; p.settled = Game.day;
      if (st === 'kept') { addTrust(v, 0.06); addRegard(v, 0.03); bondNote(v, `You kept your word: ${p.t.replace(/^You (said|promised) /, '').replace(/^you'd /, '')}.`); }
      else if (st === 'broken') { addTrust(v, -0.1); bondNote(v, `You broke your word: ${p.t}.`); }
      else bondNote(v, `${p.t}, and nothing came of it.`);
    }
  }
}
function familiarity(v) { const b = bondFull(v); return (b.talks || 0) * 0.5 + Object.keys(b.known || {}).length + b.told.length * 1.5; }
// the bond, with every field the conversation keeps (older saves lack some)
function bondFull(v) {
  const b = bondOf(v);
  for (const [k, d] of [['respect', 0], ['seen', {}], ['stage', {}], ['told', []], ['jokes', []], ['sore', {}], ['promises', []], ['owe', 0], ['hooks', []]]) if (b[k] === undefined) b[k] = Array.isArray(d) ? [] : typeof d === 'object' ? {} : d;
  return b;
}
// A phrase of their own, picked once by their id.
function petPhrase(v) { const P = FRAGS[v.isRiftborn && v.isRiftborn() ? 'pet.rift' : v.isChild() ? 'pet.child' : 'pet'] || []; return P.length ? P[Math.floor(hash2(v.id, 77) * P.length)] : ''; }

// --- Choosing a line: the most specific rule that fits, least recently said -------------
function testCond(val, cond, F) {
  if (typeof cond === 'function') return !!cond(val, F);
  if (Array.isArray(cond)) return Array.isArray(val) ? val.some((x) => cond.includes(x)) : cond.includes(val);
  if (cond && typeof cond === 'object' && ('min' in cond || 'max' in cond)) return typeof val === 'number' && (cond.min === undefined || val >= cond.min) && (cond.max === undefined || val <= cond.max);
  if (typeof cond === 'boolean') return !!val === cond;
  if (Array.isArray(val)) return val.includes(cond);
  return val === cond;
}
function ruleFits(r, F) {
  if (r.if) for (const k in r.if) if (!testCond(F[k], r.if[k], F)) return false;
  if (r.not) for (const k in r.not) if (testCond(F[k], r.not[k], F)) return false;
  if (r.when && !r.when(F)) return false;
  return true;
}
const saidKey = (vid, text) => vid + ':' + strHash(text);
function strHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h.toString(36); }
function saidLately(v, text) { const d = (Game.wizSaid || {})[saidKey(v.id, text)]; return d != null && Game.day - d < 7; }
function noteSaid(v, text) { (Game.wizSaid || (Game.wizSaid = {}))[saidKey(v.id, text)] = Game.day; }
// Fills {placeholders} from the facts; null if one can't be filled.
function fillTalkLine(text, F) {
  let ok = true;
  const out = text.replace(/\{([a-zA-Z.:]+)\}/g, (m, k) => {
    if (k.startsWith('frag:')) { const P = FRAGS[k.slice(5)]; if (!P || !P.length) { ok = false; return ''; } return fillTalkLine(R.pick(P), F) ?? (ok = false, ''); }
    const cap = k[0] === k[0].toUpperCase() && k[0] !== k[0].toLowerCase();
    const key = cap ? k[0].toLowerCase() + k.slice(1) : k;
    let val = F[key];
    if (Array.isArray(val)) val = val.length ? (val.length === 1 ? val[0] : val.slice(0, -1).join(', ') + ' and ' + val[val.length - 1]) : null;
    if (val == null || val === '' || val === false) { ok = false; return ''; }
    val = String(val);
    return cap ? val.charAt(0).toUpperCase() + val.slice(1) : val;
  });
  return ok ? out.replace(/\s+([,!?]|\.(?!\.))/g, '$1').replace(/\s{2,}/g, ' ').trim() : null;
}
// Picks what's said for a key: the best-fitting rules, a line not said lately,
// filled. If every line at the most specific level has been said, a broader
// level's fresh line is preferred to a repeat; a reaction (fresh) is only said
// if it hasn't been.
function pickLine(key, F, T, v, fresh) {
  const rules = TALK_LINES[key];
  if (!rules || !rules.length) return null;
  const fit = [];
  for (const r of rules) if (ruleFits(r, F)) fit.push([(r.if ? Object.keys(r.if).length : 0) + (r.pri || 0), r]);
  if (!fit.length) return null;
  fit.sort((a, b) => b[0] - a[0]);
  const levels = [...new Set(fit.map((f) => f[0]))];
  const byLevel = levels.map((lv) => { const out = []; for (const [s, r] of fit) if (s === lv) for (const t of r.text) { const x = fillTalkLine(t, F); if (x) out.push(x); } return out; });
  const inTalk = (t) => !!(T && T.said && T.said.has(t));
  // fresh to them lately; else not yet said in this talk; else (not for a reaction) anything
  for (const ls of byLevel) { const ok = ls.filter((t) => !inTalk(t) && !(v && saidLately(v, t))); if (ok.length) return R.pick(ok); }
  for (const ls of byLevel) { const ok = ls.filter((t) => !inTalk(t)); if (ok.length) return R.pick(ok); }
  if (fresh) return null;
  for (const ls of byLevel) if (ls.length) return R.pick(ls);
  return null;
}
// a thread's or choice's words: a line key if there is one by that name, else the text itself
function sayOf(x, F, T, v) { if (!x) return null; if (TALK_LINES[x]) return pickLine(x, F, T, v); return fillTalkLine(x, F); }
function threadLabel(th, F) { return typeof th.label === 'function' ? th.label(F || {}) : th.label; }

// --- Approaches, and how each temper takes them ------------------------------------------
const APPROACHES = {
  warm: { label: 'warm' }, jest: { label: 'jest' }, ask: { label: 'ask' }, listen: { label: 'listen' },
  advise: { label: 'advise' }, share: { label: 'share' }, comfort: { label: 'comfort' }, tale: { label: 'tale' },
};
// openness change, approach × temper
const TAKE = {
  warm: { cheerful: 1, ornery: 0, shy: 1, curious: 1, dreamy: 1, witty: 0, proud: 1, gloomy: 2, child: 1 },
  jest: { cheerful: 2, ornery: -2, shy: -1, curious: 1, dreamy: 0, witty: 2, proud: -1, gloomy: -1, child: 2 },
  ask: { cheerful: 1, ornery: 0, shy: 0, curious: 2, dreamy: 1, witty: 1, proud: 2, gloomy: 0, child: 1 },
  listen: { cheerful: 0, ornery: 2, shy: 2, curious: 0, dreamy: 1, witty: -1, proud: 1, gloomy: 2, child: -1 },
  advise: { cheerful: 0, ornery: -2, shy: -1, curious: 1, dreamy: 0, witty: 0, proud: -2, gloomy: -1, child: 0 },
  share: { cheerful: 1, ornery: 0, shy: 2, curious: 2, dreamy: 2, witty: 1, proud: -1, gloomy: 1, child: 1 },
  comfort: { cheerful: 0, ornery: -1, shy: 1, curious: 0, dreamy: 1, witty: -1, proud: -2, gloomy: 2, child: 2 },
  tale: { cheerful: 1, ornery: 0, shy: 1, curious: 2, dreamy: 2, witty: 0, proud: 0, gloomy: 1, child: 2 },
};

// --- Effects: what a beat or a choice changes ------------------------------------------
function applyFx(fx, T) {
  if (!fx) return;
  const v = T.v, b = bondFull(v), F = T.F;
  const note = (text) => T.log.push({ who: 'note', text });
  if (fx.open) T.open += fx.open;
  if (fx.fond) addRegard(v, fx.fond);
  if (fx.trust) addTrust(v, fx.trust);
  if (fx.respect) b.respect = clamp((b.respect || 0) + fx.respect, -1, 1);
  if (fx.owe) b.owe = (b.owe || 0) + fx.owe;
  if (fx.learn) {
    const [k, val] = Array.isArray(fx.learn) ? fx.learn : [fx.learn, true];
    const known = b.known && b.known[k];
    const text = typeof val === 'string' ? fillTalkLine(val, F) : val;
    if (text != null && text !== '') {
      learnAbout(v, k, text);
      if (!known && typeof text === 'string') note(`You'll remember: ${LEARN_SAY[k] ? LEARN_SAY[k].replace('{x}', text).replace('{name}', v.first) : text}`);
    }
  }
  if (fx.confide) {
    const t = fillTalkLine(fx.confide.t, F);
    if (t && !b.told.some((x) => x.k === fx.confide.k)) { b.told.unshift({ k: fx.confide.k, t, d: Game.day, secret: !!fx.confide.secret }); b.told.length = Math.min(b.told.length, 16); note(fx.confide.secret ? `${v.first} told you a secret: ${t}` : `You'll remember: ${t}`); addTrust(v, 0.04); }
  }
  if (fx.joke) { const t = fillTalkLine(fx.joke.t, F); if (t && !b.jokes.some((x) => x.k === fx.joke.k)) { b.jokes.unshift({ k: fx.joke.k, t, d: Game.day }); b.jokes.length = Math.min(b.jokes.length, 8); note(`A joke between you: ${t}`); } }
  if (fx.promise) { const t = fillTalkLine(fx.promise.t, F); if (t && !b.promises.some((x) => x.k === fx.promise.k && x.state === 'open')) { b.promises.unshift({ k: fx.promise.k, t, d: Game.day, due: Game.day + (fx.promise.days || 3), state: 'open' }); note(`${v.first} will remember that.`); } }
  if (fx.sore) { b.sore[fx.sore.k || T.th?.id] = Game.day + (fx.sore.days || 2); }
  if (fx.hook) b.hooks.unshift({ k: fx.hook.k || fx.hook, thread: T.th ? T.th.id : null, d: Game.day });
  if (fx.feel) feel(v, fx.feel, fx.feelX || '');
  if (fx.remember) { const t = fillTalkLine(fx.remember, F); if (t) v.remember(t, fx.rv || 1); }
  if (fx.note) { const t = fillTalkLine(fx.note, F); if (t) bondNote(v, t); }
  if (fx.news && typeof addNews === 'function') { const t = fillTalkLine(fx.news, F); if (t) addNews(t, 'love'); }
  if (fx.drive) for (const k in fx.drive) v.drives[k] = clamp(v.drives[k] + fx.drive[k], 0, 1);
  if (fx.lean && typeof nudgeUp === 'function' && v.isChild()) nudgeUp(v, fx.lean, 0.04, 'the wizard said so');
  if (fx.queue && ACTIONS[fx.queue]) v.queue.push({ a: ACTIONS[fx.queue], extra: fx.queueExtra ? fx.queueExtra(T) : undefined });
  if (fx.run) fx.run(T, v);
  if (fx.flag) (T.flags || (T.flags = {}))[fx.flag] = true;
}
// how a learned fact reads in the "you'll remember" note
const LEARN_SAY = { wish: '{name} wishes for {x}', dream: 'one day {name} would like to {x}', hobby: '{name} spends evenings on {x}', likes: '{name} loves {x}', dislikes: '{name} can\'t abide {x}', trouble: '{name}: {x}' };
function needMet(need, T) {
  if (!need) return true;
  const F = T.F, b = bondFull(T.v);
  if (need.open !== undefined && T.open < need.open) return false;
  if (need.trust !== undefined && (b.trust || 0) < need.trust) return false;
  if (need.fond !== undefined && regardOf(T.v) < need.fond) return false;
  if (need.respect !== undefined && (b.respect || 0) < need.respect) return false;
  if (need.knows && !(b.known && b.known[need.knows])) return false;
  if (need.not && b.known && b.known[need.not]) return false;
  if (need.flag && !(T.flags && T.flags[need.flag])) return false;
  if (need.if && !ruleFits({ if: need.if }, F)) return false;
  if (need.when && !need.when(F, T)) return false;
  return true;
}

// --- Situations: reading the mood ------------------------------------------------------
function situationOf(F) {
  let best = null;
  for (const k in SITUATIONS) { const s = SITUATIONS[k]; try { if (s.read(F) && (!best || s.pri > best.pri)) best = s; } catch (e) { /* a bad reader just doesn't fire */ } }
  return best ? best.key : null;
}
// approach × situation: base rung, shifted by temper, what they think of you, what you know, this talk and a little luck
const SHIFT = {
  listen: { ornery: 1, shy: 1, gloomy: 1, witty: -1 }, jest: { ornery: -1, witty: 1, cheerful: 1, gloomy: -1, child: 1 },
  advise: { proud: -1, ornery: -1, curious: 1 }, comfort: { gloomy: 1, shy: 1, proud: -1, child: 1 }, ask: { curious: 1, proud: 1 }, warm: { gloomy: 1, cheerful: 1 }, share: { shy: 1, dreamy: 1 },
};
function rungFor(sit, ap, T) {
  const cell = sit.aps[ap];
  let r = cell.base ?? 1;
  const F = T.F, b = bondFull(T.v);
  r += (SHIFT[ap] && SHIFT[ap][F.temper]) || 0;
  if (ap === 'advise' && (b.respect || 0) > 0.3) r++;
  if ((ap === 'comfort' || ap === 'jest') && F.fond > 0.4) r++;
  if (cell.know && cell.know(F, T)) r++;
  if (T.flags && T.flags.misjudged) r--;
  if (cell.after && T.flags && T.flags[cell.after]) r++;
  // the die: −1, 0, 0, +1, the same for this hobbit all day
  r += [-1, 0, 0, 1][Math.floor(hash2(T.v.id * 31 + Game.day, ap.length) * 4)];
  return clamp(r, 0, (cell.out || []).length - 1);
}

// --- Salience: what the hub offers --------------------------------------------------
function threadScore(th, T) {
  const F = T.F, b = bondFull(T.v);
  if (th.light || th.theirs || th.situation) return 0;
  try { if (th.when && !th.when(F, T)) return 0; } catch (e) { return 0; }
  if (T.done.has(th.id)) return 0;
  const seen = b.seen[th.id];
  let fresh = seen == null ? 1 : 1 - Math.exp(-(Game.day - seen + 0.2) / (th.cool || 3));
  if (b.hooks.some((h) => h.thread === th.id && Game.day > h.d)) fresh = Math.max(fresh, 1) * 2;
  let rel = 1; try { if (th.rel) rel = th.rel(F, T); } catch (e) { rel = 1; }
  let fit = 1;
  const first = th.beats[th.start];
  if (first && first.need && !needMet(first.need, T)) fit = 0.3;
  if (b.sore[th.id] && b.sore[th.id] > Game.day) fit *= 0.1;
  const wanted = th.reveals && !(b.known && b.known[th.reveals]) ? 1.5 : 1;
  return (th.weight || 1) * fresh * rel * fit * wanted + hash2(T.v.id * 13 + Game.day, strHash(th.id).length) * 0.2;
}
function salientThreads(T, n) {
  return Object.values(THREADS).map((th) => [threadScore(th, T), th]).filter(([s]) => s > 0.05).sort((a, b) => b[0] - a[0]).slice(0, n).map(([, th]) => th);
}

// --- Running a talk -----------------------------------------------------------------
// Called when a talk opens (play.js startTalk), once the greeting's been said.
function talkBegin(T) {
  const v = T.v;
  T.F = factsOf(v, T); T.said = T.said || new Set(); T.done = new Set(); T.depth = 0; T.flags = {};
  const b = bondFull(v);
  T.open = Math.round(clamp(regardOf(v) * 3 + (b.trust || 0) * 2, -1, 3));
  // patience: a few beats, more for the chatty and those fond of you, fewer for the hungry, tired or busy
  const tm = T.F.temper;
  let p = 6 + ({ cheerful: 2, curious: 2, witty: 1, dreamy: 1, shy: -2, ornery: -1, gloomy: 0, proud: 0, child: 1 }[tm] || 0) + Math.round(regardOf(v) * 4);
  if (T.F.hungry || T.F.tired) p -= 2;
  if (T.was && ACTIONS[T.was] && ACTIONS[T.was].job) p -= 2;
  if (Game.raining) p -= 1;
  T.pat = Math.max(3, p);
  b.lastThread = b.lastThread || null;
  // something of their own to raise, now and then, before you start
  if (T.F.situation) T.mode = 'situation';
  else maybeTheirTurn(T, 0.3);
}
// They come to you with something: a thread flagged theirs whose moment it is.
function maybeTheirTurn(T, chance) {
  if (T.th || T.ended) return false;
  const cands = Object.values(THREADS).filter((th) => th.theirs && !T.done.has(th.id) && !(bondFull(T.v).seen[th.id] >= Game.day - (th.cool || 3) + 1) && (!th.when || safeWhen(th, T)));
  if (!cands.length || !R.chance(chance)) return false;
  const th = R.pick(cands);
  T.log.push({ who: 'aside', text: fillTalkLine(th.ask || `${T.v.first} has something to say.`, T.F) || `${T.v.first} has something to say.` });
  enterThread(T, th, null, true);
  return true;
}
function safeWhen(th, T) { try { return th.when(T.F, T); } catch (e) { return false; } }
// The wizard brings up a thread (with the approach he chose, if any).
function enterThread(T, th, ap, theirs) {
  T.th = { id: th.id, beat: th.start, label: threadLabel(th, T.F) };
  T.done.add(th.id);
  if (!theirs) {
    const opener = th.open && ((ap && th.open[ap]) || th.open.say || th.open[Object.keys(th.open)[0]]);
    const said = opener ? sayOf(opener, T.F, T, T.v) : threadLabel(th, T.F);
    if (said) T.wiz(said);
    if (ap) takeApproach(T, ap);
  }
  runBeat(T, th.start);
}
function takeApproach(T, ap) {
  const d = (TAKE[ap] && TAKE[ap][T.F.temper]) || 0;
  T.open += d;
  if (d <= -2) { (T.flags || (T.flags = {})).misjudged = true; addRegard(T.v, -0.02); }
  if (d >= 2) addRegard(T.v, 0.015);
  // a word of how it landed, when it landed strongly
  if (Math.abs(d) >= 2) {
    const mix = pickLine(`mix.${ap}.${d > 0 ? 'good' : 'bad'}`, T.F, T, T.v, true) || pickLine(`mix.${d > 0 ? 'good' : 'bad'}`, T.F, T, T.v, true);
    if (mix) T.mixin = mix;
  }
  T.feel = d > 0 ? 'opening' : d < 0 ? 'cooling' : null;
}
function runBeat(T, name) {
  const th = THREADS[T.th.id];
  const beat = th.beats[name];
  if (!beat || name === 'end') { finishThread(T, true); return; }
  T.th.beat = name; T.depth++; T.pat--;
  applyFx(beat.fx, T);
  // how your last remark landed, then what they say
  if (T.mixin) { T.reply(T.mixin); T.mixin = null; }
  const who = beat.who || 'them';
  const text = beat.line ? sayOf(beat.line, T.F, T, T.v) : beat.text ? sayOf(beat.text, T.F, T, T.v) : null;
  if (text) { if (who === 'wiz') T.wiz(text); else if (who === 'aside') T.log.push({ who: 'aside', text }); else if (who === 'third' && T.third) T.reply2(text); else T.reply(text); }
  // the wizard notices things, once he knows them a little
  if (beat.notice && T.F.familiar >= 2) { const n = sayOf(beat.notice, T.F, T, T.v); if (n) T.log.push({ who: 'aside', text: n }); }
  if (T.feel) { T.log.push({ who: 'feel', text: T.feel === 'opening' ? R.pick([`${T.F.they.replace(/^./, (c) => c.toUpperCase())}'s warming to this.`, 'That went down well.', 'Opening up.']) : R.pick(['That didn\'t land.', 'A little stiffly.', 'Cooler, now.']) }); T.feel = null; }
  // refresh the facts: something may have been learned
  T.F = factsOf(T.v, T);
  if (beat.end || !(beat.go && beat.go.length)) finishThread(T, true);
}
function finishThread(T, reached) {
  if (!T.th) return;
  const th = THREADS[T.th.id], b = bondFull(T.v);
  b.seen[th.id] = Game.day; b.stage[th.id] = T.th.beat; b.lastThread = th.id;
  if (reached && th.end) applyFx(th.end, T);
  T.th = null;
  if (T.pat <= 0) { closeKindly(T); return; }
  if (T.pat === 2) { const s = pickLine('close.soon', T.F, T, T.v); if (s) T.reply(s); }
  T.mode = null;
  maybeTheirTurn(T, 0.25);
}
function closeKindly(T) {
  const s = pickLine('close.patience', T.F, T, T.v) || 'Well, I\'d best be getting on.';
  T.reply(s);
  T.ended = true;
}

// --- What the sheet shows ---------------------------------------------------------------
// Returns { html, choices } for play.js's renderTalk.
function talkView(T) {
  const v = T.v, F = T.F;
  const crumb = T.th ? `<div class="tk-crumb">${escapeHtml(T.th.label || '')}</div>` : '';
  const log = T.log.slice(-5).map((l) => {
    if (l.who === 'note') return `<p class="tk-note">✎ ${escapeHtml(l.text)}</p>`;
    if (l.who === 'aside') return `<p class="tk-aside">${escapeHtml(l.text)}</p>`;
    if (l.who === 'feel') return `<p class="tk-feel">${escapeHtml(l.text)}</p>`;
    return `<p class="tk-line ${l.who}"><b>${l.who === 'wiz' ? 'You' : escapeHtml(l.who === 'third' && T.third ? T.third.first : v.first)}</b> ${escapeHtml(l.text)}</p>`;
  }).join('');
  const html = `${crumb}<div class="tk-log">${log}</div>`;
  const chip = (ap) => (ap ? `<span class="tone ${ap}">${APPROACHES[ap] ? APPROACHES[ap].label : ap}</span> ` : '');
  const choices = [];
  const go = (fn) => () => { fn(); if (Play.talk === T) renderTalk(); };
  if (T.ended) { choices.push({ label: 'Good day', foot: true, run: () => endTalk() }); return { html, choices }; }
  if (T.th) {
    const th = THREADS[T.th.id], beat = th.beats[T.th.beat];
    const opts = (beat.go || []).filter((g) => needMet(g.need, T) || g.soft).slice(0, 3);
    for (const g of opts) {
      const met = needMet(g.need, T);
      const text = sayOf(g.say, F, T, v) || '…';
      const label = g.label ? (sayOf(g.label, F, T, v) || text) : text;
      choices.push({ label: `${chip(g.ap)}${escapeHtml(label)}${met ? '' : ' <small>(not yet)</small>'}`, disabled: !met, run: go(() => {
        T.wiz(text);
        if (g.ap) takeApproach(T, g.ap);
        applyFx(g.fx, T);
        const to = typeof g.to === 'function' ? g.to(T.F, T) : Array.isArray(g.to) ? (g.to.find((x) => typeof x === 'string' || needMet(x.need, T)) || {}).to || g.to[g.to.length - 1] : g.to;
        runBeat(T, to || 'end');
      }) });
    }
    choices.push({ label: 'Let it lie', foot: true, run: go(() => { finishThread(T, false); }) });
    choices.push({ label: 'Good day', foot: true, run: () => byeTalk(T) });
    return { html, choices };
  }
  if (T.mode === 'situation' && F.situation && SITUATIONS[F.situation]) {
    const sit = SITUATIONS[F.situation];
    for (const ap of Object.keys(sit.aps)) {
      const say = sayOf(`sit.${sit.key}.${ap}`, F, T, v) || sayOf(sit.aps[ap].say, F, T, v);
      if (!say) continue;
      choices.push({ label: `${chip(ap)}${escapeHtml(say)}`, run: go(() => {
        T.wiz(say);
        const rung = rungFor(sit, ap, T);
        const th = THREADS[sit.thread];
        T.mode = null;
        if (!th) return;
        T.th = { id: th.id, beat: sit.aps[ap].out[rung], label: threadLabel(th, F) };
        T.done.add(th.id);
        takeApproach(T, ap);
        runBeat(T, sit.aps[ap].out[rung]);
      }) });
    }
    choices.push({ label: 'Talk of something else', foot: true, run: go(() => { T.mode = null; }) });
    choices.push({ label: 'Good day', foot: true, run: () => byeTalk(T) });
    return { html, choices };
  }
  // the hub: three things worth talking about, passing the time, something else, good day
  for (const th of salientThreads(T, 3)) choices.push({ label: escapeHtml(threadLabel(th, F)), run: go(() => enterThread(T, th, th.ap || null)) });
  const light = Object.values(THREADS).filter((th) => th.light && !T.done.has(th.id) && (!th.when || safeWhen(th, T)));
  if (light.length) choices.push({ label: 'Pass the time of day…', run: go(() => { T.sub = shuffleArr(light).slice(0, 3).map((th) => { const ap = th.ap || Object.keys(th.open || {})[0]; const said = sayOf(th.open[ap], F, T, v) || threadLabel(th, F); return { label: `${chip(ap)}${escapeHtml(said)}`, run: () => { T.sub = null; enterThreadSaying(T, th, ap, said); } }; }); }) });
  choices.push({ label: 'Something else…', run: go(() => { T.sub = somethingElse(T); }) });
  choices.push({ label: 'Good day', foot: true, run: () => byeTalk(T) });
  return { html, choices };
}
function shuffleArr(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function enterThreadSaying(T, th, ap, said) {
  T.th = { id: th.id, beat: th.start, label: threadLabel(th, T.F) };
  T.done.add(th.id);
  T.wiz(said);
  if (ap) takeApproach(T, ap);
  runBeat(T, th.start);
}
// everything else there is to say: the rest of the topics, and what other files add
function somethingElse(T) {
  const F = T.F, out = [];
  const top = new Set(salientThreads(T, 3).map((th) => th.id));
  const rest = Object.values(THREADS).map((th) => [threadScore(th, T), th]).filter(([s, th]) => s > 0.05 && !top.has(th.id)).sort((a, b) => b[0] - a[0]).slice(0, 6);
  for (const [, th] of rest) out.push({ label: escapeHtml(threadLabel(th, F)), run: () => { T.sub = null; enterThread(T, th, th.ap || null); } });
  for (const o of TalkOptions) {
    if (['how', 'mind', 'news', 'chat', 'bye'].includes(o.id) || T.used.has(o.id)) continue;
    try { if (o.when && !o.when(T.v, T)) continue; } catch (e) { continue; }
    out.push({ label: typeof o.label === 'function' ? o.label(T.v, T) : o.label, run: () => { T.sub = null; T.used.add(o.id); o.run(T.v, T); } });
  }
  return out;
}
function byeTalk(T) {
  const s = pickLine('bye.wiz', T.F, T, T.v) || 'Good day to you.';
  T.wiz(s);
  const r = pickLine('bye.them', T.F, T, T.v);
  if (r) T.reply(r);
  endTalk();
}

// The greeting, from the lines: a callback to last time, their doings, their mood.
function talkGreeting(v) {
  const T = Play.talk || { said: new Set() };
  const F = factsOf(v, T);
  return pickLine('greet', F, T, v);
}

window.addEventListener('DOMContentLoaded', () => {
  registerField('wizSaid', {});
  addHook('newVillage', () => { Game.wizSaid = {}; });
  // only a wizard's village needs the words
  patch(window, 'startGame', (sg) => function () { const r = sg.apply(this, arguments); if (playMode()) startTalkLoading(); return r; }, 'threads');
  patch(window, 'load', (ld) => function () { const r = ld.apply(this, arguments); if (playMode()) startTalkLoading(); return r; }, 'threads');
  patch(window, 'greeting', (g) => function (v) { const s = TalkPacks.loaded.has('core') ? talkGreeting(v) : null; return s || g.apply(this, arguments); }, 'threads');
  // what's said in a talk is noted, so it isn't said again too soon
  patch(Villager.prototype, 'say', (say) => function (text) { if (Play.talk && (Play.talk.v === this || Play.talk.third === this) && text) { Play.talk.said && Play.talk.said.add(text); noteSaid(this, text); } return say.apply(this, arguments); }, 'threads');
  // a day's turn: old "said lately" marks are let go
  addHook('onHour', (h) => { if (h === 8 || h === 20) settlePromises(); });
  addHook('onHour', (h) => { if (h !== 4 || !Game.wizSaid) return; for (const k in Game.wizSaid) if (Game.day - Game.wizSaid[k] > 14) delete Game.wizSaid[k]; });
});
