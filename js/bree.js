'use strict';
// ---------------------------------------------------------------------------
// Natters on Bree. With the minds on Tyrell, what passes between two folk is
// Tyrell's too: its Bree module runs every natter, squabble, sweet-talk and
// making-up, and the talk round a table, turn by turn, on the minds' clock.
// Bree draws what they strike up when one walks up to another (a natter, a
// squabble, sweet nothings between sweethearts, a natter with a little one,
// a newcomer asking their way, making it up after words),
// how long they've things to say, who raises which topic, how each answer
// lands with whoever hears it (a grump's answer curt, a friend's warm), when
// a curt word sends someone off, when talk turns into a squabble and whether
// someone there keeps their patience or steps in, how it came out for each of
// them, the grudges it leaves and the making up after; and what each outcome
// does is declared here, in the game's own terms (friendship grown the
// game's way, bond(); its moodlets; its memories and chronicle).
//
// What stays the game's: space (who walks up to whom, standing together, who
// is about to see a squabble, who's at the table), the words (converse.js's
// pools, made Cityspeak lines here, and filled in with names and dishes as
// they're said), the news and messages passed on (gossip.js, talk.js),
// gatherings (gatherings.js), and what a natter shows: the bubbles, the puff
// over a squabble, the hearts, the Talk tab. Without the minds, everything
// is converse.js's (and villager.js's old exchange), as before.
// ---------------------------------------------------------------------------

// Bree's settings for Merryfolk (Tyrell's tuning.md, Bree). The game gives
// its own feelings, memories and friendship from each outcome (the kinds'
// `on`, below), so Bree's own are off: no regard, attraction, feelings or
// memories of its own, and witnesses only see (the game says what they feel).
// Bree reads each villager's nature from their genes (the 'mf' term): their
// temper, merriness for warmth, wit for humor, sociability for talkativeness,
// wanderlust for courage, and patience and forgiveness from temper and
// merriness. A natter's pace (three to five minutes a turn, a table's quicker)
// and its length (converse.js's plannedTurns) are the game's as they were.
const MIND_BREE = {
  traits: { temper: 'mf.temper', warmth: 'mf.warmth', humor: 'mf.humor', patience: 'mf.patience', courage: 'mf.courage', forgiveness: 'mf.forgiveness', talkative: 'mf.talkative' },
  regard: { warm: 0, good: 0, fine: 0, awkward: 0, sour: 0, row: 0 },
  attraction: { warm: 0, good: 0, fine: 0, awkward: 0, sour: 0, row: 0 },
  feel: {}, memory: {}, leftRegard: 0,
  witnessFeeling: '', witnessMemory: 0, witnessRegard: 0,
  reconcileFeeling: '', reconcileMemory: 0,
  compatWeight: 0, roomWeight: 0, mannerWeight: 0, mannerJitter: 0,
  // a squabble in the lane is seen unless it ended well enough, and leaves
  // the two sore with each other a while (the kinds' `grudge` scales it)
  seenAt: 'awkward',
  grudge: { warm: 0, good: 0, fine: 0, awkward: 0.05, sour: 0.1, row: 0.25 },
  turnGap: [3, 5], longTurns: 7, groupMax: 6,
  // topics drawn by their weights alone, as converse.js drew them (Bree
  // would favor one to the speaker's taste, and keep two from raising the
  // same topic again for a day: the same family round the same table every
  // mealtime would talk of everything but the food in front of them)
  topicPull: 0, topicCooldown: 0,
  // a curt answer sends someone off about as readily as it always did (the
  // old natter asked again after every answer once one had been curt; Bree
  // asks once, as it lands, so it asks a little harder)
  leaveBase: 0.75, leaveTemper: 0.35, leaveRegard: 0.3, leaveSour: 0.2,
  // and a natter now and then turns into a squabble, when a curt word stings
  escalation: 0.5,
};
MIND_MODULES.bree = MIND_BREE;

// How much a natter grows a friendship, by how it came out (for the two of
// them together, through bond(): the old natter's warm start and its word at
// the end, now by degrees); a squabble's sours it; making it up mends it.
const NATTER_BOND = { warm: 0.12, good: 0.1, fine: 0.09, awkward: 0.06, sour: 0.03, row: -0.04 };
const SQUABBLE_BOND = { warm: 0, good: -0.04, fine: -0.08, awkward: -0.12, sour: -0.16, row: -0.22 };
const MAKEUP_BOND = { warm: 0.1, good: 0.08, fine: 0.05, awkward: 0, sour: -0.03, row: -0.06 };
// The chance a natter with a friend (fondness over 0.35) leaves each a good feeling, by how it came out.
const GOOD_CHAT = { warm: 0.6, good: 0.35, fine: 0.2, awkward: 0, sour: 0, row: 0 };
// How a curt answer lands (converse.js's rule: a grump by nature on the
// topics that sour them, or anyone low, no friend of the speaker, worn out, a
// rival), and how much less of it there is between sweethearts.
const CURT = { temper: -3.5, low: -1, dislike: -1.3, tired: -0.7, rival: -0.5, court: 0.4 };
// The sit-down with a sweetheart, a squabble and a natter, as the chat task relieves them.
const NATTER_SAT = { squabble: { lonely: -0.15, bored: -0.25 }, court: { lonely: -0.8, bored: -0.3 } };

MOODLETS.saw_row = ['Saw {x} squabbling', -0.04, 240, ['I don\'t like to see folk at odds.', 'There\'s no call for shouting in the lane.']];
MOODLETS.made_up = ['Made it up with {x}', 0.1, 1440, ['Glad that\'s mended with {x}.', 'Friends again, me and {x}.']];

// The new words: keeping one's patience, stepping in, making it up, and saying sorry.
const NATTER_WORDS = {
  calm: { grown: ['Now, now. No need for that, {name}.', 'Let\'s not fall out over it, {name}.', 'Steady on. I didn\'t mean anything by it.', 'I\'ll not quarrel with you, {name}. Not today.'], child: ['I didn\'t mean it!', 'Don\'t be cross, {name}.'] },
  step_in: { grown: ['Come now, you two. Not in the lane.', 'Enough, the pair of you. Shake hands.', 'Now then! What would your mothers say?', 'That\'ll do. Nobody\'s cross with anybody on a day like this.'], child: ['Stop it! Stop fighting!', 'Be friends! Please?'] },
  make_up: {
    open: { grown: ['About the other day, {name}. I was a proper fool.', 'I\'ve been thinking about that squabble, {name}. Let\'s not go on like this.', '{name}... I don\'t like us being at odds.', 'Life\'s too short to stay cross, {name}. Pax?'], child: ['Sorry I was mean, {name}. Friends again?', 'I don\'t want to be cross any more.'] },
    reply: { good: ['We both were, {name}. Daft, the pair of us.', 'Oh, I\'ve missed you. Come here.', 'Water under the bridge, {name}.', 'I\'m glad you said it first. I\'d not have had the nerve.'], bad: ['Hmph. It\'ll take more than that, {name}.', 'I\'m not ready to forget it. Not yet.', 'Words are cheap, {name}.'], child: ['Friends! Pinky promise?', 'Okay. But you have to share.'] },
    more: { grown: ['Friends, then?', 'Shake on it?', 'Come round for tea and we\'ll say no more about it.'], child: ['Pinky promise!'] },
    back: { good: ['Friends. Always were.', 'Go on, then. Tea it is.', 'Shake.'], bad: ['We\'ll see.', 'Give it time, {name}.'], child: ['Best friends!'] },
  },
  apologize: {
    open: { grown: ['I\'m sorry, {name}. I shouldn\'t have said what I said.', 'I owe you an apology, {name}, and here it is.', 'I was in the wrong, {name}. I know it.'], child: ['Sorry, {name}. Really sorry.', 'I didn\'t mean it. Sorry.'] },
    reply: { good: ['Apology taken, {name}. Mind you, I was cross.', 'That\'s handsome of you. Let\'s forget it.', 'Thank you, {name}. That means a lot.'], bad: ['Hmph. Sorry doesn\'t mend a fence.', 'I\'ll think about it.', 'Is that all you came to say?'], child: ['Okay. I forgive you.', 'Fine. But don\'t do it again!'] },
  },
};

// The game's natters as the minds run them.
const Natter = {
  live: new Map(), lull: new Map(), queue: [], flushing: false, _tm: null, _msg: null, _joinT: 0, lineCount: 0,
  w: null,
  on() { return !!(Shell.on && Shell.w && Shell.w.bree && Shell.w.bree.kinds.size); },
  reset() { this.live.clear(); this.lull.clear(); this.queue = []; this._tm = null; this._msg = null; this.w = null; },
  // What the minds tell the game is done once they've finished their own work
  // (after the minds' clock moves, or after a call of the game's), so the
  // game's own rules run as they always do.
  later(fn) { this.queue.push(fn); },
  flush() {
    if (this.flushing) return;
    this.flushing = true;
    try {
      while (this.queue.length) {
        const fn = this.queue.shift();
        try { fn(); } catch (e) { if (typeof noteError === 'function') noteError(e, 'a natter'); else console.error(e); }
      }
    } finally { this.flushing = false; }
  },
  // a call of the game's to Bree (recorded like the game's other inputs), then what it set off
  input(name, args) { const out = Shell.input(name, args); this.flush(); return out; },
  v(pid) { return pid ? Shell.byPid.get(pid) || null : null; },

  // ---- declaring ------------------------------------------------------------
  declare(w) {
    this.reset();
    this.w = w;
    const b = w.bree;
    // their nature, from their genes, as Bree reads it
    w.term('mf', (c, a) => { const v = c.person && this.v(c.person.id); return v ? natterNature(v, a) : 0.5; });
    // their temper is their manner
    for (const t of TEMPERS) b.manner({ id: t, label: TEMPER_WORD[t], fits: (ctx) => (this.temper(ctx.person) === t ? 10 : 0) });
    natterTopics(b);
    natterKinds(b);
    // (how many of Cityspeak's lines are the natters', for the talk packs' lint: test/talk.js)
    const had = w.cityspeak.lines.length;
    w.cityspeak.addLines(natterLines());
    this.lineCount = w.cityspeak.lines.length - had;
    // the game owns space: who's still together, and who's about to see it
    b.together = (ex) => this.gone(ex);
    b.witnesses = (ex) => this.seers(ex);
    w.on('bree:turn', (t) => this.later(() => this.turn(t)));
    w.on('bree:end', (f) => this.later(() => this.end(f)));
    w.on('bree:escalated', (e) => this.later(() => this.escalated(e)));
    w.on('bree:witnessed', (e) => this.later(() => this.witnessed(e)));
    w.on('bree:mended', (e) => this.later(() => this.mended(e)));
    w.on('bree:parted', (e) => this.later(() => { const r = this.live.get(e.id), v = this.v(e.who); if (r && v && Game.selected === v) devLog('talk', `${v.first} gets up from the table`); }));
  },
  // someone's temper, once a moment (converse.js's temperOf)
  temper(p) {
    const now = this.w ? this.w.s.now : 0;
    if (!this._tm || this._tm.now !== now) this._tm = { now, m: new Map() };
    let t = this._tm.m.get(p.id);
    if (t === undefined) { const v = this.v(p.id); t = v ? temperOf(v) : 'cheerful'; this._tm.m.set(p.id, t); }
    return t;
  },

  // ---- space: who's together, who sees -------------------------------------
  gone(ex) {
    const rec = this.live.get(ex.id);
    for (const pid of ex.who) {
      const v = this.v(pid);
      if (!v || v.leaving) return pid;
      if (rec && rec.table) {
        if (v.inside !== rec.b || (v.task && ['sleep', 'lodge'].includes(v.task.a.id))) return pid;
        continue;
      }
      const t = v.task;
      // (two come to blows are still together while they're at it, the moment the minds have them fighting: scuffle.js)
      if (t && t.a.id === 'scuffle' && t.bree === ex.id) continue;
      if (this.w.morgul && this.w.morgul.fights(ex.kind)) { const d = this.w.s.people[pid] && this.w.s.people[pid].doing; if (d && d.action === 'scuffle' && !v.carried && !v.inside) continue; }
      if (!t || t.a.id !== 'chat' || !t.partner || !ex.who.includes(t.partner._pid)) return pid;
    }
    return null;
  },
  // indoors, everyone in the room; outdoors, whoever is within shouting distance
  seers(ex) {
    const v0 = this.v(ex.who[0]);
    if (!v0) return [];
    const out = [];
    for (const o of Game.villagers) {
      if (ex.who.includes(o._pid) || !minded(o) || o.stage === 'baby' || o.carried) continue;
      if (o.task && o.task.phase === 'do' && ['sleep', 'lodge', 'sleep_rough', 'nap'].includes(o.task.a.id)) continue;
      if (v0.inside ? o.inside === v0.inside : !o.inside && dist(o.x, o.y, v0.x, v0.y) < 80) out.push(o._pid);
    }
    return out.sort();
  },

  // ---- starting --------------------------------------------------------------
  // One walked up to the other (villager.js's updateApproach): they stop and
  // face each other, and Bree strikes up whatever the two of them have in
  // them (a newcomer asking around asks their way).
  begin(a, o, act) {
    if (!this.on() || !minded(a) || !minded(o)) return false;
    const dur = R.f(18, 32);
    const data = { leader: true, quarrel: false, court: false, ask: act.id === 'ask_around' };
    a.task = { a: ACTIONS.chat, phase: 'do', target: { x: a.x, y: a.y }, t: dur, data, partner: o, before: { ...a.drives }, chatLock: true };
    o.task = { a: ACTIONS.chat, phase: 'do', target: { x: o.x, y: o.y }, t: dur, data: { quarrel: false, court: false }, partner: a, before: { ...o.drives }, chatLock: true };
    a.pose = 'stand'; o.pose = 'stand';
    if (Math.abs(a.x - o.x) > Math.abs(a.y - o.y)) { a.facing = o.x > a.x ? 'right' : 'left'; o.facing = a.x > o.x ? 'right' : 'left'; }
    else { a.facing = o.y > a.y ? 'down' : 'up'; o.facing = a.y > o.y ? 'down' : 'up'; }
    const view = this.input('bree.strike', [a._pid, o._pid, {}]);
    if (!view) return false; // (nothing they'd strike up: the old way)
    for (const v of [a, o]) {
      const t = v.task;
      if (!t || t.partner !== (v === a ? o : a)) continue;
      t.bree = view.id;
      t.data.quarrel = view.kind === 'squabble'; t.data.court = view.kind === 'court';
      if (NATTER_SAT[view.kind]) t.sat = NATTER_SAT[view.kind];
      // (what they stopped for is the natter they planned: the old exchange
      // stretched it once under way, so a natter's relief is reckoned from
      // that, shell.js's t0, and a long one gives it all)
      if (t.t0 == null) t.t0 = t.t;
      t.t = Math.max(t.t, view.turns * 4.5 + 8);
    }
    if (view.kind === 'squabble') this.squabbled(a, o);
    else riftMeeting(a, o);
    FX.chatPuff(a.x, a.y - 22);
    if (Game.selected === a || Game.selected === o) devLog('talk', `${a.first} (${view.manners[a._pid]}) and ${o.first} (${view.manners[o._pid]}) settle in for ${view.turns} turns: ${view.kind}, ${relKind(a, o)}`);
    return true;
  },
  // A squabble breaks out: remembered, and if there's no love lost, the chronicle hears of it.
  squabbled(a, o) {
    if ((a.rel[o.id] ?? 0) < -0.2 && R.chance(0.3)) chronicle(`${a.first} and ${o.first} had words outside ${a.inside ? a.inside.name : 'in the lane'}. There's no love lost there.`, 'quarrel');
    a.remember(`Had a squabble with ${o.first}.`, -1); o.remember(`Had a squabble with ${a.first}.`, -1);
  },
  // the game put a natter down (a break, the giant hand, the wizard): it's over
  putDown(v, task) {
    if (!this.on() || task.bree == null || !this.w.bree.exchange(task.bree)) return;
    // (a squabble come to blows: the natter gives way to the scuffle, which goes on)
    if (task.a.id === 'chat' && this.w.morgul && this.w.morgul.fights(this.w.bree.exchange(task.bree).kind)) return;
    this.input('bree.end', [task.bree]);
  },
  // the wizard made the peace: no hard feelings either way
  peace(a, b) {
    if (!this.on() || !minded(a) || !minded(b)) return;
    this.input('bree.reconcile', [a._pid, b._pid, 'the wizard']);
    unfeel(a, 'quarrel'); unfeel(b, 'quarrel');
  },

  // ---- round a table ---------------------------------------------------------
  // At meal and taproom hours, wherever two or more share a table (converse.js's tableRounds).
  tables() {
    const rooms = new Map();
    for (const v of Game.villagers) {
      if (!tableSitter(v)) continue;
      if (!rooms.has(v.inside)) rooms.set(v.inside, []);
      rooms.get(v.inside).push(v);
    }
    for (const [b, folk] of rooms) {
      // (a lull after a round, as the old rounds paused between topics)
      if (folk.length < 2 || this.tableAt(b) || Game.time - (this.lull.get(b) ?? -1e9) < 3) continue;
      const atInn = b === World.inn || !!b.isInn;
      if (!R.chance(atInn ? 0.8 : 0.75)) continue;
      this.table(b, folk.slice(0, 5));
    }
  },
  tableAt(b) { for (const [id, r] of this.live) if (r.table && r.b === b && this.w.bree.exchange(id)) return id; return null; },
  table(b, folk) {
    const free = folk.filter((v) => !this.w.bree.exchange(v._pid));
    if (free.length < 2) return null;
    let order = free.filter((v) => !v.isChild()).concat(free.filter((v) => v.isChild()));
    const atInn = b === World.inn || !!b.isInn, h = Game.hour;
    // of an evening at the inn with a few in, an elder there starts it off (a tale is theirs to tell)
    const elder = atInn && h >= 19 && order.length >= 3 ? order.find((v) => v.stage === 'elder') : null;
    if (elder) order = [elder].concat(order.filter((v) => v !== elder));
    const meal = h < 9.5 ? 'over breakfast' : h < 11.5 ? 'at elevenses' : h < 14 ? 'over lunch' : h < 17 ? 'at tea' : h < 20.5 ? 'at supper' : 'at table';
    const rec = { table: true, b, where: atInn ? `at ${b.name}` : `${meal} in ${b.name}`, thread: null, dish: (order.map(dishFor).find(Boolean)) || null, atInn };
    // as many turns as a round of the old table talk: a topic each round the table, and another while they're at it
    let turns = order.length + 2;
    while (turns < 9 && R.chance(0.75)) turns += order.length + 2;
    this.live.set('pending', rec);
    const view = this.input('bree.start', ['table', order[0]._pid, order.slice(1).map((v) => v._pid), { turns }]);
    this.live.delete('pending');
    if (!view) return null;
    rec.seated = view.who.length;
    this.live.set(view.id, rec);
    this.flush();
    if (Game.selected && order.includes(Game.selected)) devLog('talk', `Table talk ${rec.where}: ${order.map((v) => v.first).join(', ')}`);
    return view.id;
  },
  // anyone who has since sat down at the table joins in
  tableTick(dt) {
    this._joinT += dt;
    if (this._joinT < 1) return;
    this._joinT = 0;
    for (const [id, r] of [...this.live]) {
      if (!r.table || id === 'pending') continue;
      const ex = this.w.bree.exchange(id);
      if (!ex) { this.live.delete(id); continue; }
      for (const v of Game.villagers) {
        // (six sit down to a round at most, counting those who've got up, as converse.js's rounds had it)
        if (r.seated >= 6 || v.inside !== r.b || ex.who.includes(v._pid) || !tableSitter(v) || this.w.bree.exchange(v._pid)) continue;
        if (this.input('bree.join', [id, v._pid])) { ex.who.push(v._pid); r.seated++; if (r.thread) logGroupLine(r.thread, v, null); }
      }
    }
  },

  // ---- each turn -----------------------------------------------------------------
  turn(t) {
    const s = this.v(t.who), l = this.v(t.to);
    if (!s || !l) return;
    if (t.kind === 'scuffle') {
      if (t.step === 'step_in' || t.step === 'leave') { const text = this.words(t, s, l, null); if (text) s.say(text, undefined, { to: l }); }
      return;
    }
    const rec = this.live.get(t.id) || (t.kind === 'table' ? this.live.get('pending') : null);
    const table = !!(rec && rec.table);
    let text = this.words(t, s, l, rec);
    // a table winds up without goodbyes
    if (table && t.step === 'bye') text = null;
    // (a natter's lines take the speaker's manner, as converse.js's did; a little one's natter and asking the way never did)
    if (text && !t.end && !table && t.kind !== 'babble' && t.kind !== 'ask') text = applyManner(text, s);
    if (text) s.say(text, undefined, { to: l });
    if (Game.selected === s || Game.selected === l) devLog('talk', `${s.first} → ${l.first} [${t.kind}${t.topic ? ' ' + t.topic : ''} ${t.step}${t.landed ? ', ' + t.landed : ''}${t.end ? ', end' : ''}]: "${text || ''}"`);
    if (table) {
      if (!text) return;
      const ex = this.w.bree.exchange(t.id);
      if (ex) rec.who = ex.who.slice();
      const folk = (rec.who || [t.who, t.to]).map((p) => this.v(p)).filter(Boolean);
      if (!rec.thread) rec.thread = talkGroupThread(folk, rec.where);
      logGroupLine(rec.thread, s, text);
      if (t.topic === 'table_song') rec.thread.kind = 'song';
      else if (t.topic === 'table_tale') rec.thread.kind = 'tale';
      // every third line, good company (or a sing-song), and they're all a little closer
      rec.lines = (rec.lines || 0) + 1;
      if (rec.lines >= 3 && rec.lines % 3 === 0) for (const v of folk) { feel(v, t.topic === 'table_song' ? 'singsong' : 'table_talk'); for (const o of folk) if (o !== v) v.bond(o, 0.004); }
      return;
    }
    // two in the lane: the one who walked up, and the other
    const lead = l.task && l.task.data && l.task.data.leader ? l : s, other = lead === s ? l : s;
    const bad = t.landed === 'sour' || t.landed === 'row', said = ['open', 'reply', 'more', 'back'].includes(t.step);
    // a friend happening by may make it three
    if (!t.end && t.kind === 'natter' && t.n >= 2 && !lead.inside && R.chance(0.12) && typeof tryJoin === 'function' && tryJoin(lead, other)) return;
    if (t.kind === 'babble' || t.kind === 'ask') {
      // (the old exchange: the ways rub off line by line, and the one speaking may pass on a cold)
      if (said) shareWays(s, l);
      if (s.chem.germs > 0.3 && Math.random() < 0.08 * (1.2 - l.genes.hardiness)) l.catchCold(s.first, s);
      return;
    }
    if (t.kind === 'squabble') FX.puff(s.x, s.y - 20);
    else if (t.kind === 'court' && R.chance(0.5)) FX.hearts((s.x + l.x) / 2, Math.min(s.y, l.y) - 18);
    else if (!bad && said) { lead.bond(other, 0.004); shareWays(lead, other); }
    // natters spread colds, too
    if (lead.chem.germs > 0.3 && Math.random() < 0.05 * (1.2 - other.genes.hardiness)) other.catchCold(lead.first, lead);
  },
  // What's said: the line Bree chose, filled in; the game's own words for its own topics.
  words(t, s, l, rec) {
    if (t.kind === 'squabble' && t.step !== 'leave') return lineFor(s, 'quarrel', { name: l.first });
    // with a little one: a line and its answer, in their own words (education.js's converse, and the reply it calls for)
    if (t.kind === 'babble' && t.step !== 'leave') {
      if (t.step === 'open' || t.step === 'more') { l.pendingReply = null; return converse(s, l, null); }
      const k = s.pendingReply || 'reply'; s.pendingReply = null;
      return lineFor(s, k, { name: l.first });
    }
    // asking the way (newcomers.js): a question, and an answer that may name a place
    if (t.kind === 'ask' && t.step !== 'leave') {
      const lead = s.task && s.task.data && s.task.data.ask ? s : l, d = lead.task && lead.task.data;
      if (!d) return null;
      if (t.step === 'open' || t.step === 'more') {
        d.answer = l.isRiftborn() || riftWary(l) < 0.4 || !s.isRiftborn() ? R.pick(ANSWERS) : [R.pick(['Er. Couldn\'t say.', 'Hmm? Oh. Not sure.', 'Best ask someone else.']), null];
        return R.pick(s.isRiftborn() ? ASK_RIFT : ASK_ROAD);
      }
      const [text, place] = d.answer || [R.pick(['Er. Couldn\'t say.', 'Best ask someone else.']), null];
      d.answer = null;
      if (place && lead.newcomer && !lead.newcomer.places.includes(place)) lead.newcomer.places.push(place);
      return text;
    }
    if (t.topic === 'news' || t.topic === 'message') {
      if (t.step === 'reply') { const k = s.pendingReply || 'reply'; s.pendingReply = null; return lineFor(s, k, { name: l.first }) || 'Is that so?'; }
      if (t.topic === 'news') { const n = newsToTell(s, l); if (!n) return null; l.pendingReply = 'surprise'; return tellNews(s, l, n); }
      const msg = this.message(s, l);
      if (!msg) return null;
      deliver(s, l, msg);
      return msg.text;
    }
    if (t.topic === 'doings' && t.step === 'more') { const m = s.memories.find((x) => x.d === Game.day) || s.memories.find((x) => x.d === Game.day - 1); return m ? m.t : null; }
    if (!t.text) return null;
    return fillTalk(t.text, s, l, rec && rec.table ? { dish: rec.dish && rec.dish !== 'ale' ? rec.dish : null } : talkCtx(s, l));
  },
  // a message to pass on (talk.js), kept from when the topic was weighed to when it's said
  message(s, l) {
    const k = s.id + '>' + l.id + '@' + Game.time;
    if (!this._msg || this._msg.k !== k) this._msg = { k, msg: composeMessage(s, l) };
    return this._msg.msg;
  },

  // ---- how it ended ---------------------------------------------------------------
  end(f) {
    const rec = this.live.get(f.id);
    this.live.delete(f.id);
    if (rec && rec.table) { this.lull.set(rec.b, Game.time); return; }
    if (f.kind === 'scuffle') return; // (how a scuffle ends is its beats': scuffle.js)
    const a = this.v(f.who[0]), b = this.v(f.who[1]);
    if (!a || !b) return;
    // a word or two to see them off, then both go about their day
    for (const v of [a, b]) if (v.task && v.task.a.id === 'chat' && v.task.bree === f.id) v.task.t = Math.min(v.task.t, f.why === 'left' ? 1 : 3);
    if (f.why === 'left') {
      const left = this.v(f.left), other = left === a ? b : a;
      if (left && other) {
        if (Game.selected === left || Game.selected === other) devLog('talk', `${left.first} walks off: ${other.first} was in a mood`);
        const shot = PARTING_SHOTS[temperOf(other)];
        if (shot && R.chance(0.6)) { const txt = fillTalk(R.pick(shot), other, left); setTimeout(() => { if (other.task && other.task.a.id === 'chat') other.say(txt, undefined, { to: left }); }, 1200); }
      }
    } else if (Game.selected === a || Game.selected === b) devLog('talk', `${a.first} and ${b.first}: ${f.kind}, ${f.outcome} (${f.n} turns, ${f.why})`);
  },
  // talk turned into a squabble
  escalated(e) {
    if (e.to !== 'squabble') return;
    const a = this.v(e.by), b = this.v(e.against);
    if (!a || !b) return;
    const ex = this.w.bree.exchange(e.id);
    for (const v of [a, b]) {
      const t = v.task;
      if (!t || t.bree !== e.id) continue;
      t.data.quarrel = true; t.data.court = false; t.sat = NATTER_SAT.squabble;
      if (ex) t.t = Math.max(t.t, (ex.turns - ex.turn) * 4.5 + 4);
    }
    FX.puff(a.x, a.y - 20);
    this.squabbled(a, b);
    if (Game.selected === a || Game.selected === b) devLog('talk', `${a.first} won't let it go: a squabble with ${b.first}`);
  },
  // someone about saw it: it upsets them, and they think a little less of whoever started it
  witnessed(e) {
    const v = this.v(e.id), by = this.v(e.actor);
    if (!v || !by) return;
    // (fists are worse than words)
    const blows = e.kind === 'scuffle';
    feel(v, blows ? 'saw_scuffle' : 'saw_row', by.first);
    v.rel[by.id] = clamp((v.rel[by.id] ?? 0.1) - (blows ? 0.04 : 0.015), -1, 1);
  },
  // a grudge made up
  mended(e) {
    const v = this.v(e.id), o = this.v(e.with);
    if (!v || !o) return;
    feel(v, 'made_up', o.first);
    unfeel(v, 'quarrel');
    v.remember(`Made it up with ${o.first}.`, 1);
    if (!this.w.bree.grudge(e.with, e.id) && R.chance(0.4)) chronicle(`${v.first} and ${o.first} have made it up. Friends again, by the look of them.`, 'love');
  },
};

// A villager eating or drinking at a table, as converse.js's table talk finds them.
function tableSitter(v) {
  return !!v.inside && minded(v) && v.stage !== 'baby' && !v.leaving && register(v) !== 'toddler' && !!v.task && v.task.phase === 'do' && ['eat_home', 'eat_inn', 'ale'].includes(v.task.a.id);
}

// Their nature, by Bree's roles, from their genes.
function natterNature(v, role) {
  const g = v.genes;
  switch (role) {
    case 'temper': return g.temper;
    case 'warmth': return g.merriness;
    case 'humor': return g.wit;
    case 'patience': return 1 - g.temper;
    case 'courage': return g.bravery;
    case 'forgiveness': return clamp(0.5 + (g.merriness - g.temper) * 0.5, 0, 1);
    case 'talkative': return g.sociability;
  }
  return 0.5;
}

// What the two of them are, both villagers (the starter as the person, the other as the target).
function natterPair(ctx) { return [Natter.v(ctx.person && ctx.person.id), Natter.v(ctx.target)]; }

// ---- the kinds ---------------------------------------------------------------------
// What one strikes up on walking up to the other: converse.js's own odds.
// Sweethearts sweet-talk (a married couple now and then); anyone else may
// squabble, more the hotter-tempered and less the merrier, and readily with
// someone they don't care for; with a toddler or a baby it's a little one's
// natter, and a newcomer asking around asks their way; and two who are both
// still sore after words may make it up, or say sorry.
const natterLittle = (v) => ['baby', 'toddler'].includes(register(v));
function natterOdds(ctx, kind) {
  const [a, b] = natterPair(ctx);
  if (!a || !b) return kind === 'natter' ? 1 : 0;
  const spouse = a.spouse === b.id, sweet = spouse || a.sweetheart === b.id, court = sweet && a.isGrown();
  const f = a.rel[b.id] ?? 0.1;
  const quarrel = sweet ? 0 : clamp((a.genes.temper + b.genes.temper) * 0.06 + (f < 0 ? 0.35 : 0) - (a.genes.merriness + b.genes.merriness) * 0.03, 0, 1);
  const asking = !!(a.task && a.task.data && a.task.data.ask), little = natterLittle(a) || natterLittle(b);
  if (kind === 'squabble') return quarrel;
  if (kind === 'ask') return asking ? 1 - quarrel : 0;
  if (kind === 'babble') return !asking && little ? 1 - quarrel : 0;
  if (asking || little) return 0;
  if (kind === 'court') return court ? (spouse ? 0.35 : 1) : 0;
  return court ? (spouse ? 0.65 : 0) : 1 - quarrel;
}
// How long they've things to say (converse.js's plannedTurns; two more when sweet-talking).
function natterTurns(ctx, more = 0) {
  const [a, b] = natterPair(ctx);
  return a && b ? plannedTurns(a, b) + more : 2;
}
// How an answer lands with whoever hears it (the opener), from the one who answers.
function natterCurt(ctx) {
  const d = ctx.data || {};
  if (d.step !== 'reply') return 0;
  const s = Natter.v(ctx.person && ctx.person.id), l = Natter.v(ctx.target);
  if (!s || !l || l.isChild()) return 0;
  const T = TOPICS[d.topic] || (String(d.topic).startsWith('court_') ? TOPICS.court : null);
  if (!T) return 0;
  const sourOn = T.sour || SOUR_DEFAULT;
  const temper = ctx.world.bree.mannerOf(l._pid);
  let x = (sourOn.includes(temper) ? CURT.temper : 0) + (l.mood() < 0.4 ? CURT.low : 0) + ((l.rel[s.id] ?? 0.1) < 0 ? CURT.dislike : 0) + (l.drives.tired > 0.7 ? CURT.tired : 0) + (relKind(l, s) === 'rival' ? CURT.rival : 0);
  if (d.kind === 'court') x *= CURT.court;
  return x;
}
// What an outcome does, for each of them in turn (the person, with the other
// as target): run as the game's own, once the minds have finished.
function natterDo(fn) {
  return (ctx) => {
    const v = Natter.v(ctx.person && ctx.person.id), o = Natter.v(ctx.target), d = ctx.data || {};
    if (v && o) Natter.later(() => fn(v, o, d));
  };
}
function natterKinds(b) {
  const end = natterDo((v, o, d) => {
    v.bond(o, (NATTER_BOND[d.outcome] || 0) / 2);
    if ((v.rel[o.id] ?? 0) > 0.35 && R.chance(GOOD_CHAT[d.outcome] || 0)) feel(v, 'good_chat', o.first);
  });
  const long = natterDo((v, o, d) => {
    if ((v.rel[o.id] ?? 0) > 0.2) feel(v, 'long_chat', o.first);
    v.bond(o, 0.015);
    if (d.turns >= 10 && d.who && d.who[0] === v._pid && R.chance(0.25)) v.remember(`A proper long natter with ${o.first}.`, 1);
  });
  const left = natterDo((v, o) => {
    feel(v, 'snubbed', o.first); v.bond(o, -0.03);
    v.remember(`${o.first} was short with me. I left them to it.`, -1);
    if (WARM[relKind(v, o)] >= 0.6 && R.chance(0.2)) chronicle(`${v.first} left ${o.first} to it in the lane: ${o.first} was in no mood for company.`, 'quarrel');
  });
  const talk = { tags: ['talk', 'friendly'], gap: [3, 5], escalates: 'squabble', lands: natterCurt, on: { end: { then: [end] }, long: { then: [long] }, left: { then: [left] } } };
  b.kind({ id: 'natter', label: 'a natter', ...talk, topics: ['tag:natter'], weight: (ctx) => natterOdds(ctx, 'natter'), turns: (ctx) => natterTurns(ctx) });
  b.kind({ id: 'court', label: 'sweet nothings', ...talk, tags: ['talk', 'friendly', 'romantic'], escalates: undefined, topics: ['tag:court', 'tag:natter'], weight: (ctx) => natterOdds(ctx, 'court'), turns: (ctx) => natterTurns(ctx, 2) });
  b.kind({
    id: 'squabble', label: 'a squabble', tags: ['hostile'], base: -2, grudge: 2, gap: [3, 5], weight: (ctx) => natterOdds(ctx, 'squabble'),
    // now and then, rarely, a squabble comes to blows (scuffle.js)
    escalates: 'scuffle', escalation: (ctx) => (typeof Scuffle !== 'undefined' ? Scuffle.escalation(ctx) : 0),
    turns: (ctx) => { const [a, b] = natterPair(ctx); return a && b && (natterLittle(a) || natterLittle(b)) ? 3 + Math.floor(Math.random() * 3) : natterTurns(ctx); },
    on: { end: { then: [natterDo((v, o, d) => { v.bond(o, (SQUABBLE_BOND[d.outcome] || 0) / 2); feel(v, 'quarrel', o.first); })] } },
  });
  // a scuffle: a fight by numbers on Morgul, blow by blow (scuffle.js); only ever a squabble come to blows
  // (a blow every five to eight minutes: slow enough to watch)
  b.kind({ id: 'scuffle', label: 'a scuffle', tags: ['hostile'], base: -4, grudge: 1, gap: [5, 8], weight: 0,
    on: { end: { then: [natterDo((v, o) => { if (typeof Scuffle !== 'undefined') Scuffle.over(v, o); })] } } });
  // a natter with a toddler or a baby, and a newcomer asking their way: the
  // old exchange's own words and pace (a line and its answer every five to
  // nine minutes), and its warmth at the end (whoever asked has met one more
  // face once it's done: villager.js's finish)
  const little = { tags: ['talk', 'friendly'], gap: [5, 9], turns: [3, 5], base: 1 };
  const ended = natterDo((v, o, d) => {
    v.bond(o, (NATTER_BOND[d.outcome] || 0) / 2);
    if ((v.rel[o.id] ?? 0) > 0.35 && R.chance(GOOD_CHAT[d.outcome] || 0)) feel(v, 'good_chat', o.first);
  });
  b.kind({ id: 'babble', label: 'a natter with a little one', ...little, weight: (ctx) => natterOdds(ctx, 'babble'), on: { end: { then: [ended] } } });
  b.kind({ id: 'ask', label: 'asking the way', ...little, base: 0.5, weight: (ctx) => natterOdds(ctx, 'ask'), on: { end: { then: [ended] } } });
  const mend = { end: { then: [natterDo((v, o, d) => v.bond(o, (MAKEUP_BOND[d.outcome] || 0) / 2))] } };
  b.kind({ id: 'make_up', label: 'making it up', tags: ['friendly'], to: ['grudge>0.05', 'grudged>0.05'], turns: 4, gap: [3, 5], base: 0.5, traits: { forgiveness: 1.5 }, mends: 0.6, mutual: true, on: mend,
    weight: [{ name: 'forgiveness', input: 'nature.forgiveness', out: [0.6, 2] }] });
  b.kind({ id: 'apologize', label: 'an apology', tags: ['friendly'], to: ['grudged>0.05', 'grudge<0.05'], turns: 2, gap: [3, 5], base: 0.5, traits: { forgiveness: 1.5, temper: -0.5 }, skill: { warmth: 0.5 }, mends: 0.5, on: mend,
    weight: [{ name: 'their grudge', input: 'grudged', out: [0.6, 2] }, { name: 'warmth', input: 'nature.warmth', out: [0.5, 1.5] }] });
  b.kind({
    id: 'table', label: 'table talk', tags: ['talk', 'friendly'], topics: ['tag:table'], group: true, stays: true, gap: [2, 3], base: 0.5, weight: 0,
    on: { end: { then: [natterDo((v, o, d) => { if (d.turns >= 3) feel(v, 'table_talk'); })] } },
  });
}

// ---- the topics -----------------------------------------------------------------------
// converse.js's topics, each with its own `when` and weight; the food in
// front of them is what they're doing; the news and a message to pass on are
// the game's own (gossip.js, talk.js), never first and never between
// sweethearts; the sweet nothings are the courting strands; and round a
// table, the food, the day, the ale, a song and a tale.
function natterTopics(b) {
  // (the game's own conditions, read inside the minds' turn: one that throws just doesn't hold)
  const both = (fn) => (ctx) => { const [s, l] = natterPair(ctx); try { return !!s && !!l && !!fn(s, l, ctx); } catch (e) { return false; } };
  const MEALS = new Set(['eat_home', 'eat_inn', 'ale']);
  for (const k in TOPICS) {
    const T = TOPICS[k];
    if (!T.w) continue;
    const def = { id: k, label: k.replace(/_/g, ' '), tags: ['natter'], weight: T.w, if: [both((s, l) => T.when(s, l, talkCtx(s, l)) && openerPool(T, s))] };
    if (k === 'food_here') { def.from = 'doing'; def.if.push((ctx) => MEALS.has(ctx.data && ctx.data.subject)); def.weight = T.w * 2; }
    b.topic(def);
  }
  const opening = (ctx) => { const ex = ctx.world.bree.exchange(ctx.person.id); return !!ex && ex.kind === 'natter' && ex.turn > 0; };
  b.topic({ id: 'news', label: 'the news', tags: ['natter'], steps: 2, weight: 4, if: [opening, both((s, l) => !s.isChild() && newsToTell(s, l))] });
  b.topic({ id: 'message', label: 'a word to pass on', tags: ['natter'], steps: 2, weight: 2, if: [opening, both((s, l) => !s.isChild() && Natter.message(s, l))] });
  for (const n in TOPICS.court.strands) b.topic({ id: 'court_' + n, label: 'sweet nothings', tags: ['court'], kinds: ['court'], weight: 12 });
  // round a table, as converse.js's rounds went: first what's in front of
  // them (the food, the ale, or without either how the day went), though of
  // an evening at the inn, with a few in, three times in ten a song goes up
  // and, with an elder there, one time in seven a tale; after that, any topic
  // that fits, each as likely (a song wherever a few are in at the inn,
  // though a little less: with every table on Bree a song took a sixth of
  // the lines where it had taken a seventh, and the sing-songs doubled)
  const round = (ctx) => { const ex = ctx.world.bree.exchange(ctx.person.id); return ex ? ex.who.map((p) => Natter.v(p)).filter(Boolean) : []; };
  const dish = (ctx) => round(ctx).map(dishFor).find(Boolean) || null;
  const rec = (ctx) => { const ex = ctx.world.bree.exchange(ctx.person.id); return ex ? Natter.live.get(ex.id) || Natter.live.get('pending') : null; };
  const first = (ctx) => !(ctx.world.bree.exchange(ctx.person.id) || {}).turn;
  // (an evening's first song at any inn with a few in; later ones in the old taproom, as converse.js had it)
  const evening = (ctx) => { const r = rec(ctx); return !!r && r.atInn && round(ctx).length >= 3 && Game.hour >= 19; };
  const taproom = (ctx) => { const r = rec(ctx); return !!r && r.b === World.inn && round(ctx).length >= 3; };
  const elders = (ctx) => round(ctx).some((v) => v.stage === 'elder');
  const t = { tags: ['table'], kinds: ['table'] };
  b.topic({ id: 'table_food', ...t, weight: (ctx) => (first(ctx) ? 6 : 1), if: [(ctx) => { const d = dish(ctx); return !!d && d !== 'ale'; }] });
  b.topic({ id: 'table_ale', ...t, weight: 6, if: [(ctx) => dish(ctx) === 'ale' && first(ctx)] });
  b.topic({ id: 'table_day', ...t, weight: (ctx) => (!first(ctx) ? 1 : dish(ctx) ? 0 : 6) });
  b.topic({ id: 'table_song', ...t, weight: (ctx) => (!first(ctx) ? 0.6 : (6 * 0.3) / (elders(ctx) ? 0.55 : 0.7)), if: [(ctx) => (first(ctx) ? evening(ctx) : taproom(ctx))] });
  b.topic({ id: 'table_tale', ...t, weight: (ctx) => (!first(ctx) ? 1 : (6 * 0.15) / 0.55), if: [(ctx) => { const v = Natter.v(ctx.person.id); return !!v && v.stage === 'elder' && (!first(ctx) || evening(ctx)); }] });
}

// ---- the words ------------------------------------------------------------------------
// converse.js's pools as Cityspeak lines, a line each, on `<topic>.<step>`:
// the opener's by who they are (grown or a child, with little ones or a
// spouse to speak of), the answers by temper (a child's own first, then the
// temper's, then anyone's), the follow-up and the last word the same; a curt
// word when an answer lands badly from someone who isn't a grump about it;
// the goodbyes by what the two are to each other; walking off by register.
// The game fills them in as they're said (fillTalk). Bree passes over a line
// already said in the same natter, as the pools did.
const NATTER_LC = {
  child: (ctx) => { const v = Natter.v(ctx.person && ctx.person.id); return !!v && v.isChild(); },
  grown: (ctx) => !NATTER_LC.child(ctx),
  kids: (ctx) => { const v = Natter.v(ctx.person && ctx.person.id); return !!v && kidsOf(v).length > 0; },
  spouse: (ctx) => { const v = Natter.v(ctx.person && ctx.person.id); return !!v && v.spouse != null; },
  fine: (ctx) => { const v = Natter.v(ctx.person && ctx.person.id); return !!v && register(v) === 'fine'; },
  bad: (ctx) => { const o = ctx.world.lang.value('turn', ctx); return o === 'sour' || o === 'row'; },
  good: (ctx) => !NATTER_LC.bad(ctx),
};
function natterLines() {
  const out = [];
  let n = 0;
  const add = (topic, texts, when, opts = {}) => { for (const text of texts || []) out.push({ key: `mf.${topic}.${n++}`, topic, text, ...(when && when.length ? { when } : {}), ...opts }); };
  const C = NATTER_LC;
  // a pool by who's speaking: grown or a child (and a grown-up's little ones and spouse, as likely as the rest)
  // (an opener is a grown-up's or a child's; any other pool a child takes the grown-ups' words from when it has none of its own)
  const byWho = (topic, tbl, opener) => {
    if (!tbl) return;
    if (Array.isArray(tbl)) { add(topic, tbl); return; }
    const two = opener || (tbl.grown && tbl.child);
    add(topic, tbl.grown, two ? [C.grown] : []);
    add(topic, tbl.child, two ? [C.child] : []);
    if (opener) { add(topic, tbl.kid, [C.grown, C.kids], { pri: -1 }); add(topic, tbl.spouse, [C.grown, C.spouse], { pri: -1 }); }
  };
  // a pool by temper: a child's own first, then their temper's, then anyone's (or a cheerful word)
  const byTemper = (topic, tbl, curt) => {
    if (!tbl) return;
    add(topic, tbl.child, [C.child]);
    for (const t of TEMPERS) add(topic, tbl[t], tbl.child ? [`manner:${t}`, C.grown] : [`manner:${t}`]);
    add(topic, tbl.any || tbl.cheerful, []);
    if (curt) add(topic, CURT_LINES, [C.bad, C.grown, (ctx) => !curt.includes(ctx.world.bree.mannerOf(ctx.person.id))], { pri: 1 });
  };
  for (const k in TOPICS) {
    const T = TOPICS[k];
    if (k === 'court') {
      for (const s in T.strands) {
        const S = T.strands[s], id = 'court_' + s;
        add(id + '.open', S.open); byTemper(id + '.reply', S.reply, SOUR_DEFAULT); add(id + '.more', S.more); byTemper(id + '.back', S.back);
      }
      continue;
    }
    byWho(k + '.open', T.open, true);
    byTemper(k + '.reply', T.reply, T.sour || SOUR_DEFAULT);
    if (!T.memory) byWho(k + '.more', T.more);
    byTemper(k + '.back', T.back);
  }
  for (const k of ['food', 'day', 'ale', 'song', 'tale']) {
    byWho(`table_${k}.open`, TABLE_OPEN[k]);
    byTemper(`table_${k}.reply`, TABLE_REPLY[k]);
    byWho(`table_${k}.more`, TABLE_MORE[k]);
    byTemper(`table_${k}.back`, k === 'song' ? TABLE_LAST_SONG : k === 'tale' ? TABLE_LAST_TALE : TABLE_LAST);
  }
  for (const k in GOODBYES) {
    if (k === 'child') add('bree.bye', GOODBYES.child, [C.child], { pri: 1 });
    else add('bree.bye', GOODBYES[k], [], { to: [(ctx) => { const [a, b] = natterPair(ctx); return !!a && !!b && relKind(a, b) === k; }] });
  }
  add('bree.leave', LEAVE_LINES.grown); add('bree.leave', LEAVE_LINES.fine, [C.fine]); add('bree.leave', LEAVE_LINES.child, [C.child]);
  for (const k of ['calm', 'step_in']) { add('bree.' + k, NATTER_WORDS[k].grown, [C.grown]); add('bree.' + k, NATTER_WORDS[k].child, [C.child]); }
  for (const kind of ['make_up', 'apologize']) {
    const W = NATTER_WORDS[kind];
    for (const step in W) {
      const P = W[step];
      add(`${kind}.${step}`, P.grown, P.child ? [C.grown] : []);
      add(`${kind}.${step}`, P.good, P.child ? [C.grown, C.good] : [C.good]);
      add(`${kind}.${step}`, P.bad, P.child ? [C.grown, C.bad] : [C.bad]);
      add(`${kind}.${step}`, P.child, [C.child]);
    }
  }
  return out;
}
