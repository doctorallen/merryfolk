'use strict';
// ---------------------------------------------------------------------------
// Teaching and upbringing. The children of Thistledown are growing up
// between two peoples, and what they're taught, and by whom, makes them.
//
// - Lessons by talk: the wizard can stop a child for a lesson (letters,
//   sums, the knack of a trade, a tale of the wide world, and, once the
//   rift-folk have come, circuits, binary with acorns or the Relay's
//   call-signs). Each child takes to some better than others. Two a day.
// - The Leanings strip: what each hobbit is keen on and not, in plain words
//   with bars, and the last few things that moved them (a pat, a tut, a
//   lesson, a tale, someone they watched), on the Mind tab and, small, in
//   the talk sheet. The wizard can say "Well done" or "Now then" about what
//   they were just doing, which works like a pat or a tut.
// - Hill, rift or both: every child carries two tallies, moved by lessons,
//   tales and their morals, the festivals, time with the rift-folk and their
//   gadgets, pats and tuts, and what's held dear at home. At coming of age
//   they set the first thing the new grown-up holds dear, their leaning
//   among the trades and their looks. Both tallies high and close makes a
//   go-between: someone who speaks both ways, whose natters soften the
//   wariness of whoever they talk to, and whose word counts double at the
//   Long Dim (isGoBetween).
// - Tale morals: the wizard's tales end on courage, kindness, cleverness or
//   home, and the children who heard them carry it into their upbringing
//   and their dreams.
// - A report card for each child at the turn of every season, read on the
//   wizard's "The children" page.
// Everything is kept in Game.upb, keyed by villager id.
// ---------------------------------------------------------------------------

const MORALS = {
  courage: { label: 'Courage', side: 'rift', amt: 0.035, dream: 'master', line: 'And that is what I want you to remember: courage is found in the smallest of places. Even in a hobbit. Especially in a hobbit.' },
  kindness: { label: 'Kindness', side: 'hill', amt: 0.025, dream: 'friends', line: 'Remember, it was a kindness at the start of it all that made the difference. A kind word costs nothing, and it is never wasted.' },
  cleverness: { label: 'Cleverness', side: 'rift', amt: 0.03, dream: 'learned', line: 'Use your wits, little ones. A quick mind will get you out of more trouble than a strong arm ever will.' },
  home: { label: 'Home', side: 'hill', amt: 0.035, dream: 'family', line: 'And the best part of every adventure is coming home again, to a warm hearth and the people who love you.' },
};
const MORAL_KEYS = Object.keys(MORALS);
// What leans a child one way or the other while they're at it.
const HILL_ACTS = new Set(['school', 'work_story', 'visit_stone', 'garden', 'fiddle', 'tea']);
const RIFT_ACTS = new Set(['jack_in', 'gadget', 'rift_gawk', 'rift_watch']);
// not things to praise or scold anyone for
const NO_PRAISE = new Set(['sleep', 'held', 'cradle', 'eat_home', 'eat_inn', 'tag_along', 'drop_off', 'collect_child', 'fetch_child', 'nurse', 'deliver', 'wizard_chat', 'wizard_tale']);
const UPB_FESTIVALS = new Set(['mayday', 'midsummer', 'harvest', 'yule', 'founding', 'lantern']);
MOODLETS.lesson_took = ['Learned {x} from the wizard', 0.08, 720, ['The wizard taught me {x}! I can show you!']];
MOODLETS.go_between = ['Speaks both ways', 0.06, 2880, ['Hill or rift? Both. Obviously both.']];

const Upb = { pendingMoral: null, flash: null };
// What the wizard himself does (a lesson, a tale's moral, a word of praise)
// counts for half as much again when you're playing him.
const WIZ_SWAY = 1.5;
const wizSway = () => (typeof playMode === 'function' && playMode() ? WIZ_SWAY : 1);
function upbOf(v) { const all = Game.upb || (Game.upb = {}); return all[v.id] || (all[v.id] = { h: 0, r: 0, log: [], morals: {} }); }
function hasUpb(v) { return !!(Game.upb && Game.upb[v.id]); }
function isGoBetween(v) { return !!(v && Game.upb && Game.upb[v.id] && Game.upb[v.id].go); }
// a line in the record of what moved them (the newest first, a handful kept)
function leanLog(v, text, kind, act) {
  const u = upbOf(v);
  u.log.unshift({ d: Game.day, t: text, k: kind, a: act || null });
  if (u.log.length > 8) u.log.length = 8;
  Upb.flash = { id: v.id, a: act || kind, at: performance.now() };
}
// Only the young are still being brought up; each nudge counts for less as a tally fills.
function nudgeUp(v, side, amt, why, quiet) {
  if (!v.isChild() || !amt) return;
  const u = upbOf(v), k = side === 'hill' ? 'h' : 'r';
  u[k] = clamp(u[k] + amt * (1 - u[k] * 0.6), 0, 1);
  if (why && !quiet) leanLog(v, why, side);
}
// once per kind of thing per stretch of hours, so the record isn't all one line
function nudgeOnce(v, key, hours, side, amt, why) {
  const u = upbOf(v), at = (u.seen || (u.seen = {}))[key];
  const fresh = at == null || Game.time - at > hours * 60;
  if (fresh) u.seen[key] = Game.time;
  nudgeUp(v, side, amt, fresh ? why : null, !fresh);
}
function upbClass(v) {
  const u = Game.upb && Game.upb[v.id];
  if (!u) return null;
  const hi = Math.max(u.h, u.r), lo = Math.min(u.h, u.r);
  if (lo > 0.22 && hi - lo < hi * 0.35) return 'both';
  if (u.h > u.r + 0.08 && u.h > 0.12) return 'hill';
  if (u.r > u.h + 0.08 && u.r > 0.12) return 'rift';
  return null;
}
function upbWord(v) {
  if (isGoBetween(v)) return 'A go-between: speaks both ways';
  const u = Game.upb && Game.upb[v.id];
  if (!u || u.h + u.r < 0.06) return 'Not yet one way or the other';
  const c = upbClass(v);
  if (c === 'both') return 'Growing up both ways';
  if (c === 'hill') return u.h > 0.45 ? 'Hill-folk through and through' : 'Leaning to the hill ways';
  if (c === 'rift') return u.r > 0.45 ? 'Rift-minded' : 'Leaning to the rift ways';
  return 'Between the two';
}

// --- Leanings, made legible ----------------------------------------------------------
function upbBar(v) {
  const u = Game.upb && Game.upb[v.id] || { h: 0, r: 0 };
  return `<div class="upb"><span class="upb-k">Hill</span><span class="upb-bar"><i class="h" style="width:${Math.round(Math.min(1, u.h * 2) * 50)}%"></i><i class="r" style="width:${Math.round(Math.min(1, u.r * 2) * 50)}%"></i></span><span class="upb-k">Rift</span></div>`;
}
function rankedHabits(v) {
  const keys = HABIT_KEYS.filter((a) => ACTIONS[a] && v.canDo(ACTIONS[a]) && habitShown(v, a));
  return keys.map((a) => [a, v.weights[a] * (v.genes.taste[a] || 1)]).sort((a, b) => b[1] - a[1]);
}
// what they're keenest on, leaving out what everyone does (eating, sleeping)
function keenest(v) { const r = rankedHabits(v).find(([a]) => !NO_PRAISE.has(a)); return r ? r[0] : null; }
function leaningsHTML(v) {
  const ranked = rankedHabits(v), f = Upb.flash && Upb.flash.id === v.id && performance.now() - Upb.flash.at < 4000 ? Upb.flash.a : null;
  const row = (a, w, cls) => `<div class="habit${f === a ? ' flash' : ''}"><span>${ACTION_NAMES[a] || a}</span>${bar(w / 2.4, cls)}</div>`;
  let h = '<h3>Leanings</h3><div class="habits">';
  for (const [a, w] of ranked.slice(0, 4)) h += row(a, w, 'good');
  h += '<div class="sep">Not keen on</div>';
  for (const [a, w] of ranked.slice(-3)) h += row(a, w, 'low');
  h += '</div>';
  const u = Game.upb && Game.upb[v.id];
  if (v.isChild() || (u && (u.h || u.r || u.go))) {
    h += `<div class="upb-word${f === 'hill' || f === 'rift' ? ' flash' : ''}">${upbWord(v)}</div>${upbBar(v)}`;
  }
  if (u && Object.keys(u.morals).length) h += `<div class="likes"><div><b>Heard the wizard's tales of</b> ${MORAL_KEYS.filter((m) => u.morals[m]).map((m) => `${MORALS[m].label.toLowerCase()}${u.morals[m] > 1 ? ` (${u.morals[m]})` : ''}`).join(', ')}</div></div>`;
  if (u && u.log.length) h += `<ol class="lean-log">${u.log.slice(0, 5).map((l) => `<li data-k="${l.k}"><time>Day ${l.d}</time> ${escapeHtml(l.t)}</li>`).join('')}</ol>`;
  return h;
}
// the small version on the talk sheet, for children
function leanStrip(v) {
  const u = Game.upb && Game.upb[v.id], keen = keenest(v);
  const f = Upb.flash && Upb.flash.id === v.id && performance.now() - Upb.flash.at < 4000 ? Upb.flash : null;
  const last = u && u.log[0] && u.log[0].d === Game.day ? u.log[0].t : null;
  return `<div class="lean-strip${f ? ' flash' : ''}"><div class="ls-row"><span>Keen on <b>${(ACTION_NAMES[keen] || 'everything').toLowerCase()}</b></span><span>${eduLevel(v.edu)[1]}</span></div>${upbBar(v)}${last ? `<div class="ls-last">${escapeHtml(last)}</div>` : ''}</div>`;
}

// --- Lessons by talk -----------------------------------------------------------------
const LESSONS = {
  rhyme: { label: 'a counting rhyme', side: 'hill', little: true, fit: (v) => 0.5 + v.genes.merriness * 0.3, edu: 0.02, say: 'One for the badger, two for the hare...' },
  letters: { label: 'letters', side: 'hill', fit: (v) => 0.25 + v.genes.wit * 0.4 + v.genes.curiosity * 0.25 - (v.edu > 0.6 ? 0.2 : 0), edu: 0.05, say: 'Now: the letter that looks like a hobbit-hole door. Who knows it?' },
  sums: { label: 'sums', fit: (v) => 0.2 + v.genes.wit * 0.65, edu: 0.05, say: 'If you have seven apples and I eat three... yes, I would eat three.' },
  knack: { label: 'the knack of a trade', fit: (v) => 0.3 + v.genes.apt[topTalents(v.genes, 1)[0]] * 0.65, edu: 0.015, skill: true, say: 'Watch my hands, not my face. Like this.' },
  world: { label: 'a tale of the wide world', side: 'rift', amt: 0.02, fit: (v) => 0.25 + v.genes.curiosity * 0.55 + v.genes.bravery * 0.2, edu: 0.025, say: 'Beyond the hills there are mountains, and beyond those, more mountains, and then the Sea.' },
  circuits: { label: 'circuits', side: 'rift', rift: true, fit: (v) => 0.2 + v.genes.curiosity * 0.4 + v.tech * 0.3 + v.genes.apt.tinkering * 0.3, edu: 0.03, ways: 0.03, say: 'The spark goes round and round, like a dog chasing its tail. Break the circle and it stops.' },
  binary: { label: 'binary with acorns', side: 'rift', rift: true, fit: (v) => 0.2 + v.genes.wit * 0.5 + v.tech * 0.3, edu: 0.035, ways: 0.025, say: 'One acorn, no acorn, one acorn: that is five, if you are a rift-born.' },
  callsigns: { label: 'the Relay\'s call-signs', side: 'rift', rift: true, fit: (v) => 0.25 + v.genes.sociability * 0.35 + v.tech * 0.35, edu: 0.02, ways: 0.035, say: 'Dot, dot, dash. That one means "is anybody there?"' },
};
const LESSON_TOOK = { yes: ['Oh! I get it! I really get it!', 'Again! Teach me another!', 'That\'s easy! ...Is it meant to be easy?'], no: ['I don\'t get it.', 'My head hurts.', 'Can we do a different one?'], youth: { yes: ['Huh. That\'s actually quite good.', 'Right. Yes. I see.'], no: ['If you say so.', 'Mm. Maybe.'] } };
function lessonsFor(v) {
  const little = kidBand(v) === 'toddler';
  if (little) return ['rhyme'];
  const riftFolk = Game.villagers.some((o) => o.isRiftborn() && !o.leaving);
  const keys = ['letters', 'sums', 'knack', 'world'];
  if (riftFolk) keys.push(R.pick(['circuits', 'binary', 'callsigns']));
  return keys;
}
function lessonLeft(v) { const u = upbOf(v); if (u.ld !== Game.day) { u.ld = Game.day; u.ln = 0; } return 2 - u.ln; }
function giveLesson(v, T, key) {
  const L = LESSONS[key], u = upbOf(v);
  lessonLeft(v); u.ln++;
  const skill = L.skill ? topTalents(v.genes, 1)[0] : null;
  const label = skill ? `the knack of ${SKILL_LABEL[skill].toLowerCase()}` : L.label;
  T.wiz(skill ? `Here. The knack of ${SKILL_LABEL[skill].toLowerCase()}. Watch my hands, not my face.` : L.say);
  const fit = clamp(L.fit(v) + R.f(-0.15, 0.15), 0, 1.2), took = fit > 0.55;
  const k = took ? 1 : 0.4;
  learn(v, L.edu * k * (0.6 + fit), 'you');
  if (skill) v.skills[skill] = Math.min(100, (v.skills[skill] || 0) + 4 * k * (0.5 + fit));
  if (L.ways) shiftWays(v, L.ways * k * wizSway());
  if (L.side) nudgeUp(v, L.side, (L.amt || 0.03) * k * wizSway(), null, true);
  v.drives.bored = Math.max(0, v.drives.bored - 0.15);
  const pool = kidBand(v) === 'youth' ? LESSON_TOOK.youth : LESSON_TOOK;
  T.reply(R.pick(took ? pool.yes : pool.no));
  leanLog(v, `A lesson in ${label} from the wizard: ${took ? 'took to it' : 'it didn\'t stick'}`, L.side || 'edu', L.side || 'edu');
  if (took) { feel(v, 'lesson_took', label); addRegard(v, 0.03); }
}

// --- Well done / Now then: the wizard's pat and tut --------------------------------------
function praise(v, T, good) {
  const a = T.was, name = (ACTION_NAMES[a] || 'that').toLowerCase();
  if (good) {
    v.weights[a] = clamp(v.weights[a] + 0.22, 0.35, 2.2);
    v.drives.lonely = Math.max(0, v.drives.lonely - 0.1);
    T.wiz(R.pick([`Well done, ${v.first}. I saw you at it. ${ACTION_NAMES[a] ? 'Keep it up.' : ''}`, `That's the way, ${v.first}. Very good indeed.`]));
    T.reply(v.isChild() ? R.pick(['Really? You saw?', 'Hee! Thank you!']) : R.pick(['Why, thank you.', 'Oh, it\'s nothing.']));
    leanLog(v, `The wizard praised ${v.pron.them} for ${name}`, 'pat', a);
    if (RIFT_ACTS.has(a)) nudgeUp(v, 'rift', 0.025 * wizSway(), null, true); else if (HILL_ACTS.has(a)) nudgeUp(v, 'hill', 0.025 * wizSway(), null, true);
    addRegard(v, 0.02);
  } else {
    v.weights[a] = clamp(v.weights[a] - 0.25, 0.35, 2.2);
    T.wiz(R.pick([`Now then, ${v.first}. Not so much of that, I think.`, `${v.first}. A word about ${name}.`]));
    T.reply(v.isChild() ? R.pick(['Sorry... I won\'t do it again.', 'But everyone does it!']) : R.pick(['Hmph. Well. If you say so.', 'Fair enough, I suppose.']));
    leanLog(v, `The wizard had a word about ${name}`, 'tut', a);
    if (RIFT_ACTS.has(a)) nudgeUp(v, 'hill', 0.012 * wizSway(), null, true); else if (HILL_ACTS.has(a)) nudgeUp(v, 'rift', 0.012 * wizSway(), null, true);
    addRegard(v, v.isChild() ? -0.005 : -0.02);
  }
}

if (typeof addTalkOption === 'function') {
  addTalkOption({
    id: 'lesson', order: 25, label: 'A lesson?',
    when: (v) => v.isChild() && lessonLeft(v) > 0,
    run: (v, T) => {
      T.wiz(R.pick([`How about a lesson, ${v.first}?`, 'Shall I teach you something?']));
      T.reply(kidBand(v) === 'youth' ? R.pick(['Go on, then.', 'What kind of lesson?']) : R.pick(['Yes! Yes please!', 'A real wizard lesson?']));
      T.choices(lessonsFor(v).map((k) => ({ label: `${LESSONS[k].label}${LESSONS[k].side ? ` <span class="tone ${LESSONS[k].side}">${LESSONS[k].side}</span>` : ''}`, run: () => giveLesson(v, T, k) })));
    },
  });
  addTalkOption({ id: 'welldone', order: 45, label: (v, T) => `Well done, ${v.first} <small>(${(ACTION_NAMES[T.was] || 'that').toLowerCase()})</small>`, when: (v, T) => !!T.was && !NO_PRAISE.has(T.was) && !!ACTION_NAMES[T.was] && v.weights[T.was] != null, run: (v, T) => praise(v, T, true) });
  addTalkOption({ id: 'nowthen', order: 46, label: (v, T) => `Now then, ${v.first}… <small>(${(ACTION_NAMES[T.was] || 'that').toLowerCase()})</small>`, when: (v, T) => !!T.was && !NO_PRAISE.has(T.was) && !!ACTION_NAMES[T.was] && v.weights[T.was] != null && !T.used.has('welldone'), run: (v, T) => praise(v, T, false) });
}

// --- Tale morals -----------------------------------------------------------------------
function chooseMoral(then) {
  Sheet.open({
    kind: 'pick', title: 'What should they take from it?', sub: 'The children carry a tale\'s ending with them as they grow up.',
    choices: MORAL_KEYS.map((m) => ({ label: `<b>${MORALS[m].label}</b> <small>${MORALS[m].side === 'hill' ? 'leans hill' : 'leans rift'}</small>`, run: () => { Sheet.close(true); Upb.pendingMoral = m; then(); } }))
      .concat([{ label: 'Let them make of it what they will', back: true, run: () => { Sheet.close(true); Upb.pendingMoral = R.pick(MORAL_KEYS); then(); } }]),
  });
}
// the moral lands on the children listening at its last line
function moralLands(w) {
  const m = MORALS[w.moral], tale = WIZARD_TALES[w.tale];
  if (!m || !tale) return;
  wizSay(m.line);
  for (const v of Game.villagers) {
    if (!v.isChild() || !v.task || v.task.a.id !== 'wizard_tale' || v.task.phase !== 'do') continue;
    const u = upbOf(v);
    u.morals[w.moral] = (u.morals[w.moral] || 0) + 1;
    nudgeUp(v, m.side, m.amt * wizSway(), null, true);
    leanLog(v, `Heard the wizard's tale ${tale.x}: ${m.label.toLowerCase()}`, m.side, m.side);
    if (R.chance(0.5)) v.remember(`Heard the wizard tell ${tale.x}. It was about ${m.label.toLowerCase()}.`, 1);
  }
}

// --- Coming of age: the tallies decide ----------------------------------------------------
function setFirstValue(v, k) {
  const cur = valuesOf(v).slice();
  const out = [k];
  for (const x of cur) if (!out.includes(x) && VALUES[k].clash !== x && VALUES[x].clash !== k && out.length < 2) out.push(x);
  if (out.length < 2) {
    const lean = valueLeanings(v);
    const rest = VALUE_KEYS.filter((x) => !out.includes(x) && VALUES[k].clash !== x && VALUES[x].clash !== k).sort((a, b) => lean[b] - lean[a]);
    if (rest.length) out.push(rest[0]);
  }
  v.values = out;
}
function comingOfAge(v) {
  const u = Game.upb && Game.upb[v.id];
  if (!u) return;
  const c = upbClass(v), lean = valueLeanings(v);
  u.cls = c;
  if (c === 'hill') {
    setFirstValue(v, ['tradition', 'nature', 'kin'].sort((a, b) => lean[b] - lean[a])[0]);
    v.remember('Grew up on the old songs and the maypole. Hill-folk, me.', 1);
  } else if (c === 'rift') {
    setFirstValue(v, ['learning', 'craft'].sort((a, b) => lean[b] - lean[a])[0]);
    if (v.tech < RIFT_TIERS[0] + 0.02) shiftWays(v, (RIFT_TIERS[0] + 0.02 - v.tech) * 0.8);
    v.remember('Grew up with one ear on the Relay. Rift-minded, they call me.', 1);
  } else if (c === 'both') {
    u.go = true;
    feel(v, 'go_between');
    v.remember('Hill or rift? Both. I speak both ways.', 2);
    chronicle(`${v.name()} has come of age a go-between: brought up on the Willow Lamp song and the Relay's call-signs alike, and at home with hill-folk and rift-folk both. Folk on either side listen when ${v.pron.they} speak${v.pron.they === 'they' ? '' : 's'}.`, 'rift');
  }
  // the morals they heard most lean what they dream of
  const top = MORAL_KEYS.filter((m) => u.morals[m]).sort((a, b) => u.morals[b] - u.morals[a])[0];
  if (top && R.chance(0.45 + Math.min(0.4, u.morals[top] * 0.15))) {
    const k = MORALS[top].dream;
    if (DREAMS[k] && DREAMS[k].w(v) > 0 && !(v.dreamsDone || []).some((d) => d.k === k)) v.dream = { k, ...(DREAMS[k].make ? DREAMS[k].make(v) : {}), since: Game.day };
  }
  devLog('jobs', `${v.first} came of age ${c || 'neither way'} (hill ${u.h.toFixed(2)}, rift ${u.r.toFixed(2)})`);
}

// --- The season's report cards -------------------------------------------------------------
function snapOf(v, u) { return { edu: v.edu, sk: SKILLS.reduce((s, k) => s + (v.skills[k] || 0), 0), h: u.h, r: u.r, day: Game.day }; }
function reportFor(v) {
  const u = upbOf(v), s = u.snap || { edu: v.edu, sk: 0, h: 0, r: 0 };
  const de = v.edu - s.edu, best = topTalents(v.genes, 1)[0];
  const lvl = eduLevel(v.edu)[1].toLowerCase();
  const parts = [];
  parts.push(de > 0.06 ? `${v.first} has come on splendidly with letters and sums (${lvl} now).` : de > 0.015 ? `${v.first} has learned a little more this season (${lvl}).` : `${v.first} hasn't learned much this season (${lvl}), and would be the better for a lesson or two.`);
  if ((v.skills[best] || 0) > 5) parts.push(`Shows a gift for ${SKILL_LABEL[best].toLowerCase()}.`);
  const dh = u.h - s.h, dr = u.r - s.r;
  parts.push(Math.max(dh, dr) < 0.02 ? 'Hasn\'t leaned either way.' : dh > dr * 1.4 ? 'Leaning more to the hill ways.' : dr > dh * 1.4 ? 'Taking to the rift ways.' : 'Picking up both the hill ways and the rift ways.');
  const top = keenest(v);
  if (top && ACTION_NAMES[top]) parts.push(`Keenest on ${ACTION_NAMES[top].toLowerCase()}.`);
  return parts.join(' ');
}
function writeReports(season) {
  let n = 0;
  for (const v of Game.villagers) {
    if (!v.isChild() || v.leaving) continue;
    const u = upbOf(v);
    if (u.snap) { u.report = { season, day: Game.day, text: reportFor(v) }; n++; }
    u.snap = snapOf(v, u);
  }
  if (n && typeof playMode === 'function' && playMode()) chronicle(`The ${season} report cards are written: ${n} of them. Tap The children to read them.`, 'learn');
}
function childrenSheet() {
  const kids = Game.villagers.filter((v) => v.isChild() && !v.leaving).sort((a, b) => b.age - a.age);
  Sheet.open({
    kind: 'pick', title: 'The children', sub: kids.length ? `${kids.length} growing up in Thistledown. Tap one to go and see them.` : 'No children in the village just now.',
    choices: kids.map((v) => {
      const u = Game.upb && Game.upb[v.id];
      const rep = u && u.report ? `<span class="kid-rep"><b>${u.report.season.charAt(0).toUpperCase() + u.report.season.slice(1)}:</b> ${escapeHtml(u.report.text)}</span>` : `<span class="kid-rep"><b>So far:</b> ${escapeHtml(reportFor(v))}</span>`;
      const left = daysToComeOfAge(v), due = left === 1 ? 'comes of age tomorrow' : `of age in ${left} days`;
      return { label: `<span class="kid-row"><b>${escapeHtml(v.first)}</b> <small>${kidBand(v)} · ${due} · ${eduLevel(v.edu)[1].toLowerCase()} · ${upbWord(v).toLowerCase()}</small></span>${upbBar(v)}${rep}`, run: () => { Sheet.close(true); if (typeof wizApproach === 'function' && playMode()) wizApproach(v); else { selectVillager(v); focusVillager(v); } } };
    }).concat([{ label: 'Close', back: true, run: () => Sheet.close(true) }]),
  });
}
if (typeof addWizardAction === 'function') addWizardAction({ id: 'children', order: 70, icon: 'baby', label: () => 'The children', when: () => Game.villagers.some((v) => v.isChild()), run: childrenSheet });

window.addEventListener('DOMContentLoaded', () => {
  registerField('upb', {}); registerField('upbSoft', {}); registerField('upbSeason', null, { nullish: true });

  // the Mind tab: the Leanings strip in place of the plain habits
  patch(window, 'panelMind', (pm) => function (v) {
    let h = pm.apply(this, arguments);
    const i = h.indexOf('<h3>Habits (learned)</h3>');
    if (i >= 0) {
      const after = h.slice(i + 1);
      const j = Math.min(...['<div class="likes">', '<h3>'].map((m) => { const k = after.indexOf(m); return k < 0 ? Infinity : k + i + 1; }));
      if (j < Infinity) h = h.slice(0, i) + leaningsHTML(v) + h.slice(j);
    }
    return h;
  }, 'upbringing');
  // the talk sheet: a little strip for children
  patch(window, 'renderTalk', (rt) => function () {
    const r = rt.apply(this, arguments);
    const T = Play.talk, body = $('sheet-body');
    if (T && body && T.v.isChild()) { body.insertAdjacentHTML('afterbegin', leanStrip(T.v)); hydrateIcons(body); }
    return r;
  }, 'upbringing');
  // what they were doing before the wizard stopped them, for "well done" and "now then"
  patch(window, 'startTalk', (st) => function (v) {
    const was = v && v.task && v.task.a.id !== 'wizard_chat' ? v.task.a.id : v ? v.lastAction : null;
    Upb.was = was;
    return st.apply(this, arguments);
  }, 'upbringing');
  patch(window, 'renderTalk', (rt) => function () { if (Play.talk && Play.talk.was === undefined) Play.talk.was = Upb.was || null; return rt.apply(this, arguments); }, 'upbringing');

  // the wizard picks the moral after the tale (when you're him), or makes one up
  patch(window, 'beginTale', (bt) => function (key) { const self = this; chooseMoral(() => bt.call(self, key)); }, 'upbringing');
  patch(window, 'wizardStartTale', (ws) => function () {
    const r = ws.apply(this, arguments);
    const w = wizard();
    if (w && w.tale) { w.moral = Upb.pendingMoral || R.pick(MORAL_KEYS); w.moralSaid = false; Upb.pendingMoral = null; }
    return r;
  }, 'upbringing');
  patch(window, 'taleTick', (tt) => function (w, dt) {
    const tale = WIZARD_TALES[w.tale];
    if (w.moral && !w.moralSaid && tale && w.line >= tale.lines.length && (w.lineAt || 0) - dt <= 0 && Game.time < (w.taleUntil || 0)) {
      w.moralSaid = true; w.lineAt = 14; w.taleUntil = Math.max(w.taleUntil, Game.time + 20);
      moralLands(w);
      return;
    }
    return tt.apply(this, arguments);
  }, 'upbringing');

  // pats and tuts go in the record, and lean a child
  patch(Villager.prototype, 'pat', (pat) => function () {
    const key = pat.apply(this, arguments);
    if (key && this.stage !== 'baby') { leanLog(this, `Patted while ${(ACTION_NAMES[key] || 'busy').toLowerCase()}`, 'pat', key); if (RIFT_ACTS.has(key)) nudgeUp(this, 'rift', 0.025, null, true); else if (HILL_ACTS.has(key)) nudgeUp(this, 'hill', 0.025, null, true); }
    return key;
  }, 'upbringing');
  patch(Villager.prototype, 'tut', (tut) => function () {
    const key = tut.apply(this, arguments);
    if (key && this.stage !== 'baby') { leanLog(this, `Tutted at for ${(ACTION_NAMES[key] || 'something').toLowerCase()}`, 'tut', key); if (RIFT_ACTS.has(key)) nudgeUp(this, 'hill', 0.012, null, true); else if (HILL_ACTS.has(key)) nudgeUp(this, 'rift', 0.012, null, true); }
    return key;
  }, 'upbringing');
  patch(Villager.prototype, 'teach', (teach) => function () {
    const g = teach.apply(this, arguments);
    if (this.stage !== 'baby') leanLog(this, 'A lesson from you', 'edu', 'edu');
    return g;
  }, 'upbringing');
  // children pick up likings from watching the grown-ups
  patch(Villager.prototype, 'observe', (obs) => function () {
    if (!this.isChild()) return obs.apply(this, arguments);
    const before = { ...this.weights };
    const r = obs.apply(this, arguments);
    for (const k in this.weights) {
      if (this.weights[k] <= before[k] + 1e-9) continue;
      const o = Game.villagers.find((x) => x !== this && !x.inside && x.task && x.task.a.id === k && dist(x.x, x.y, this.x, this.y) < 90);
      const u = upbOf(this), key = 'watch:' + k;
      if (o && (!u.seen || !u.seen[key] || Game.time - u.seen[key] > 720)) { (u.seen || (u.seen = {}))[key] = Game.time; leanLog(this, `Picked up a liking for ${(ACTION_NAMES[k] || k).toLowerCase()} from watching ${o.first}`, 'watch', k); }
      if (o && o.isRiftborn()) nudgeUp(this, 'rift', 0.004, null, true); else if (o && o.stage === 'elder') nudgeUp(this, 'hill', 0.003, null, true);
      break;
    }
    return r;
  }, 'upbringing');
  // a custom taught to a child leans them its way
  if (typeof teachCustom === 'function') patch(window, 'teachCustom', (tc) => function (a, b) {
    const S = typeof story === 'function' ? story() : null;
    const had = S ? Object.keys(S.customs).filter((k) => S.customs[k].knowers.includes(b.id)) : [];
    const r = tc.apply(this, arguments);
    if (S && b && b.isChild()) for (const k of Object.keys(S.customs)) if (!had.includes(k) && S.customs[k].knowers.includes(b.id) && CUSTOMS[k]) nudgeUp(b, CUSTOMS[k].from === 'rift' ? 'rift' : 'hill', 0.03, `Learned ${CUSTOMS[k].name} from ${a.first}`);
    return r;
  }, 'upbringing');
  // a go-between's natter softens the wariness of whoever they talk to
  patch(Villager.prototype, 'finish', (fin) => function () {
    const t = this.task;
    if (t && t.a.id === 'chat' && t.partner) {
      const p = t.partner, soft = Game.upbSoft || (Game.upbSoft = {});
      if (isGoBetween(this) && !isGoBetween(p)) soft[p.id] = Math.min(0.8, (soft[p.id] || 0) + 0.12);
    }
    return fin.apply(this, arguments);
  }, 'upbringing');
  patch(window, 'riftWary', (rw) => function (v) { const w = rw.apply(this, arguments); const s = Game.upbSoft && Game.upbSoft[v.id]; return s ? w * (1 - s) : w; }, 'upbringing');
  // the trades lean with the upbringing
  patch(window, 'jobFit', (jf) => function (v, j) {
    let s = jf.apply(this, arguments);
    const c = Game.upb && Game.upb[v.id] && Game.upb[v.id].cls;
    if (c === 'hill' && ['farmer', 'herder', 'brewer', 'miller', 'baker', 'orchardist', 'fisher', 'grower', 'storyteller'].includes(j)) s += 6;
    if (c === 'rift' && ['tinker', 'herbalist', 'mailcarrier'].includes(j)) s += 8;
    if (c === 'both' && ['mailcarrier', 'innkeeper', 'storyteller', 'tinker'].includes(j)) s += 5;
    return s;
  }, 'upbringing');

  // coming of age, and the turn of the season
  patch(window, 'dailySociety', (ds) => function () {
    const kids = Game.villagers.filter((v) => v.isChild()).map((v) => v.id);
    const r = ds.apply(this, arguments);
    // the records of those gone for good are let go (those off on a trip are kept)
    const here = new Set(Game.villagers.map((v) => v.id).concat((Game.away || []).map((a) => a.id)));
    for (const k of ['upb', 'upbSoft']) for (const id in Game[k] || {}) if (!here.has(+id)) delete Game[k][id];
    for (const v of Game.villagers) if (kids.includes(v.id) && v.stage === 'adult') comingOfAge(v);
    // home life, a day at a time
    for (const v of Game.villagers) {
      if (!v.isChild() || v.leaving) continue;
      for (const p of v.parents.map((id) => personById(id)).filter((p) => p && Game.villagers.includes(p))) {
        for (const k of valuesOf(p)) {
          if (k === 'tradition' || k === 'nature' || k === 'kin') nudgeOnce(v, 'home:' + k, 47, 'hill', 0.014, `At home, ${p.first} holds ${VALUES[k].label.toLowerCase()} dear`);
          if (k === 'learning') nudgeOnce(v, 'home:' + k, 47, 'rift', 0.01, `At home, ${p.first} holds learning dear`);
        }
        if (p.tech >= RIFT_TIERS[0]) nudgeOnce(v, 'home:tech:' + p.id, 47, 'rift', 0.012, `${p.first} has taken up rift ways`);
      }
      const lodger = v.homeId >= 0 && Game.villagers.find((o) => o.isRiftborn() && o.homeId === v.homeId && !v.parents.includes(o.id));
      if (lodger) nudgeOnce(v, 'lodger', 47, 'rift', 0.015, `${lodger.first}, rift-born, lives under the same roof`);
    }
    // (by the day's own season: the clock's season turns over just after this)
    const season = seasonKey(Game.day);
    if (Game.upbSeason !== season) { if (Game.upbSeason) writeReports(Game.upbSeason); else for (const v of Game.villagers) if (v.isChild()) upbOf(v).snap = snapOf(v, upbOf(v)); Game.upbSeason = season; }
    return r;
  }, 'upbringing');
  // the hour's doings: festivals, the story circle, gadgets and the rift-folk
  addHook('onHour', () => {
    const fest = Game.party.on && UPB_FESTIVALS.has(Game.party.reason);
    for (const v of Game.villagers) {
      if (!v.isChild() || !v.task || v.leaving) continue;
      const id = v.task.a.id;
      if (fest && (id === 'party' || id === 'watch')) nudgeOnce(v, 'fest:' + Game.party.reason, 20, 'hill', 0.025, `Danced at ${(partyKind(Game.party.reason).label || Game.party.reason).replace(/^The /, 'the ')}`);
      else if (HILL_ACTS.has(id)) nudgeOnce(v, 'act:' + id, 24, 'hill', 0.01, id === 'school' ? 'An hour at the story circle' : null);
      else if (RIFT_ACTS.has(id)) nudgeOnce(v, 'act:' + id, 24, 'rift', 0.015, `${ACTION_NAMES[id] || 'Rift-tech'} with the rift-folk`);
      else if (id === 'chat' && v.task.partner && v.task.partner.isRiftborn()) nudgeOnce(v, 'chat:' + v.task.partner.id, 24, 'rift', 0.008, `A natter with ${v.task.partner.first}, rift-born`);
      else if (id === 'chat' && v.task.partner && v.task.partner.stage === 'elder') nudgeOnce(v, 'chat:' + v.task.partner.id, 24, 'hill', 0.005, null);
    }
  });
  addHook('newVillage', () => { Game.upb = {}; Game.upbSoft = {}; Game.upbSeason = null; });
});
