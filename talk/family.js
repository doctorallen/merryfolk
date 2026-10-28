'use strict';
// ---------------------------------------------------------------------------
// Family, home and love, the first part: the facts the family packs share
// (sweethearts, crushes, how long married, babies on the way, brothers and
// sisters, grandchildren, the household, the hole and its mathoms, kin who've
// gone or are away), and the threads about husbands and wives, newlyweds,
// bickering, sweethearts, crushes, the happily single, and a sweetheart who
// wants to know how one asks. family2.js has children and parents,
// family3.js the hole and the hearth, family4.js rows, loss and birthdays.
// ---------------------------------------------------------------------------

talkPack('family', () => {
  // --- Facts for every family pack ----------------------------------------------------
  addFacts((v, F) => {
    const alive = (o) => o && !o.leaving && Game.villagers.includes(o);
    const sexWord = (o, f, m) => (o.genes && o.genes.sex === 'f' ? f : m);
    const sp = v.spouse != null ? personById(v.spouse) : null;
    const sw = !sp && v.sweetheart != null ? personById(v.sweetheart) : null;
    F.sweetheart = alive(sw) ? sw.first : null;
    F.role = v.isGrown() ? sexWord(v, 'mom', 'dad') : null;
    // a crush: the one they're sweetest on, unspoken
    let crush = null, best = 0.15;
    if (!sp && !sw && v.stage === 'adult') for (const id in v.love || {}) { const o = personById(+id); if (alive(o) && v.love[id] > best && canCourt(v, o)) { best = v.love[id]; crush = o; } }
    F.crush = crush ? crush.first : null;
    F.single = v.isGrown() && !sp && !F.sweetheart;
    // pronouns for the beloved (husband or wife, sweetheart, or crush)
    const pr = (o, k) => (o ? (PRON[o.genes.sex] || PRON.m)[k] : null);
    const bel = sp || (F.sweetheart ? sw : null) || crush;
    F.sThey = pr(bel, 'they'); F.sThem = pr(bel, 'them'); F.sTheir = pr(bel, 'their');
    // married: newly, settled, or long since
    const wedMem = sp ? (v.memories || []).find((m) => m.t && m.t.startsWith('Married ')) : null;
    const wedAgo = sp ? (v.wedDay != null ? Game.day - v.wedDay : wedMem ? Game.day - wedMem.d : null) : null;
    const kidsAll = Game.villagers.filter((o) => o.parents && o.parents.includes(v.id) && !o.leaving);
    F.wed = !sp ? null : wedAgo != null && wedAgo <= 4 ? 'new' : v.stage === 'elder' || kidsAll.some((k) => k.isGrown()) ? 'long' : 'settled';
    F.spouseWord = sp ? sexWord(sp, 'wife', 'husband') : null;
    F.spouseTemper = alive(sp) ? temperOf(sp) : null;
    F.spouseJob = alive(sp) && sp.job ? JOBS[sp.job].label.toLowerCase() : null;
    // little ones, big ones and the one on the way
    F.expecting = !!(v.expecting || (alive(sp) && sp.expecting));
    F.carrying = !!v.expecting;
    const babies = kidsAll.filter((k) => k.stage === 'baby');
    const kids = kidsAll.filter((k) => k.isChild()).sort((a, b) => a.age - b.age);
    const grown = kidsAll.filter((k) => k.isGrown());
    const flown = grown.find((k) => k.homeId !== v.homeId), flownKid = flown;
    F.baby = babies[0] ? babies[0].first : null;
    F.babyWord = babies[0] ? sexWord(babies[0], 'girl', 'boy') : null;
    F.littleOne = kids[0] ? kids[0].first : null;
    F.littleBand = kids[0] ? kidBand(kids[0]) : null;
    F.littleWord = kids[0] ? sexWord(kids[0], 'daughter', 'son') : null;
    F.littleCount = kids.length;
    F.kThey = pr(kids[0], 'they'); F.kThem = pr(kids[0], 'them'); F.kTheir = pr(kids[0], 'their');
    const gk0 = flownKid || grown[0];
    F.gThey = pr(gk0, 'they'); F.gThem = pr(gk0, 'them'); F.gTheir = pr(gk0, 'their');
    F.grownKid = grown[0] ? grown[0].first : null;
    F.flown = flown ? flown.first : null;
    F.flownHome = flown && flown.homeId >= 0 ? flown.home().name : null;
    F.kidsHome = kidsAll.filter((k) => k.homeId === v.homeId).length;
    F.nest = grown.length > 0 && F.kidsHome === 0;
    // their own mom and dad
    const parents = (v.parents || []).map(personById).filter(alive);
    F.parentWord = parents[0] ? sexWord(parents[0], 'mom', 'dad') : null;
    F.parentOld = !!(parents[0] && parents[0].stage === 'elder');
    F.parentAway = !!(parents[0] && parents[0].homeId !== v.homeId);
    const mom = parents.find((p) => p.genes.sex === 'f'), dad = parents.find((p) => p.genes.sex !== 'f');
    F.mom = mom ? mom.first : null;
    F.dad = dad ? dad.first : null;
    // brothers and sisters
    const sibs = (v.parents || []).length ? Game.villagers.filter((o) => o !== v && alive(o) && o.parents && o.parents.some((p) => v.parents.includes(p))) : [];
    const bigSibs = sibs.filter((o) => o.stage !== 'baby');
    F.siblings = bigSibs.map((o) => o.first);
    F.sibling = bigSibs[0] ? bigSibs[0].first : null;
    F.siblingWord = bigSibs[0] ? sexWord(bigSibs[0], 'sister', 'brother') : null;
    F.siblingOlder = !!(bigSibs[0] && bigSibs[0].age > v.age);
    F.sibCount = bigSibs.length;
    const babySib = sibs.find((o) => o.stage === 'baby');
    F.babySib = babySib ? babySib.first : null;
    // grandchildren
    const gk = Game.villagers.filter((o) => alive(o) && o.parents && o.parents.some((p) => kidsAll.some((k) => k.id === p) || (Game.archive[p] && Game.archive[p].parents.includes(v.id))));
    F.grandkids = gk.map((o) => o.first);
    F.grandkid = gk[0] ? gk[0].first : null;
    F.grandCount = gk.length;
    // kin who've gone over the hills for good, and kin away on a trip
    let gone = null;
    for (const id in Game.archive || {}) {
      const a = Game.archive[id];
      if (!a || a.reason === 'rift') continue;
      const rel = (v.parents || []).includes(a.id) ? (a.genes.sex === 'f' ? 'mother' : 'father') : a.spouse === v.id || v.spouse === a.id ? (a.genes.sex === 'f' ? 'wife' : 'husband') : (a.parents || []).includes(v.id) ? (a.genes.sex === 'f' ? 'daughter' : 'son') : (a.parents || []).some((p) => (v.parents || []).includes(p)) ? (a.genes.sex === 'f' ? 'sister' : 'brother') : null;
      if (rel && (!gone || a.left > gone.left)) gone = { first: a.first, rel, left: a.left };
    }
    F.goneKin = gone ? gone.first : null;
    F.goneRel = gone ? gone.rel : null;
    F.goneDays = gone ? Game.day - gone.left : null;
    const away = (Game.away || []).map((e) => e.data).find((d) => d && ((v.parents || []).includes(d.id) || (d.parents || []).includes(v.id) || d.spouse === v.id || (d.parents || []).some((p) => (v.parents || []).includes(p))));
    F.awayKin = away ? away.first : null;
    F.awayRel = away ? (away.spouse === v.id ? (away.genes.sex === 'f' ? 'wife' : 'husband') : (away.parents || []).includes(v.id) ? (away.genes.sex === 'f' ? 'daughter' : 'son') : (v.parents || []).includes(away.id) ? (away.genes.sex === 'f' ? 'mother' : 'father') : (away.genes.sex === 'f' ? 'sister' : 'brother')) : null;
    // the household and the hole
    const h = v.homeId >= 0 ? World.homes[v.homeId] : null;
    const res = h ? residentsOf(h) : [];
    F.household = h ? res.length : 0;
    F.livesAlone = !!h && res.length === 1;
    F.fullHouse = !!h && res.length >= HOME_CAP(h);
    F.grandHole = !!(h && h.grand);
    const DOORS = { '#2f6b34': 'green', '#c9a227': 'yellow', '#a23b2a': 'red', '#2f5e9a': 'blue', '#6b3f8a': 'purple', '#2f7f7a': 'sea-green', '#c86a2a': 'orange', '#3a7a3a': 'green' };
    F.holeDoor = h && DOORS[h.doorColor] ? DOORS[h.doorColor] : null;
    const ms = h && typeof mathomsAt === 'function' ? mathomsAt(h) : [];
    const m = ms.sort((a, b) => b.passed - a.passed)[0];
    F.mathom = m ? m.name : null;
    F.mathomPassed = m ? m.passed : null;
    F.mathomTrip = !!(m && m.origin === 'trip');
    F.jars = h && typeof jarsTotal === 'function' ? jarsTotal(h) : 0;
    const food = h ? PANTRY_KINDS.reduce((s, k) => s + (h.pantry[k] || 0), 0) : 0;
    F.larder = !h ? null : food + F.jars >= 14 ? 'full' : food + F.jars >= 5 ? 'fair' : 'bare';
    F.crop = h ? h.cropType : null;
    const lodger = Game.hearth && Game.hearth.lodger != null && h && Game.hearth.home === h.id ? personById(Game.hearth.lodger) : null;
    F.lodger = alive(lodger) && lodger !== v ? lodger.first : null;
    F.movedIn = !!(v.memories || []).find((x) => x.t && x.t.startsWith('Moved into ') && Game.day - x.d <= 4);
    F.hearthDays = F.hearth && Game.hearth ? Game.day - Game.hearth.since : null;
    // newcomers without a roof
    F.roughNights = v.newcomer ? v.newcomer.rough || 0 : null;
    F.refused = v.newcomer ? v.newcomer.refused || 0 : null;
    // birthdays
    F.bdayToday = typeof birthdayToday === 'function' && birthdayToday(v);
    F.bdayWhen = typeof bdayWords === 'function' ? bdayWords(v) : null;
    const kin = Game.villagers.filter((o) => o !== v && alive(o) && o.stage !== 'baby' && (related(v, o) || o.id === v.spouse));
    const kb = typeof birthdayToday === 'function' ? kin.find((o) => birthdayToday(o)) : null;
    F.kinBday = kb ? kb.first : null;
    // a family row: kin they're sore with
    let row = null;
    for (const o of kin) { const hurt = (typeof sentimentsOf === 'function' && sentimentsOf(v, o).some((s) => SENT[s.tag][1] < 0)) || (v.rel[o.id] || 0) < -0.1; if (hurt) { row = o; break; } }
    // counts in words, for saying aloud
    const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    const words = (n) => (n == null ? null : NUM[n] || (n > 30 ? 'dozens of' : 'a score of'));
    F.householdWord = words(F.household); F.kidCountWord = words(F.kidCount); F.littleCountWord = words(F.littleCount);
    F.grandCountWord = words(F.grandCount); F.famJarsWord = words(F.jars); F.roughWord = words(F.roughNights); F.passedWord = words(F.mathomPassed);
    F.rowKin = row ? row.first : null;
    F.rowRel = row ? (row.id === v.spouse ? sexWord(row, 'wife', 'husband') : (v.parents || []).includes(row.id) ? sexWord(row, 'mother', 'father') : row.parents.includes(v.id) ? sexWord(row, 'daughter', 'son') : row.parents.some((p) => (v.parents || []).includes(p)) ? sexWord(row, 'sister', 'brother') : sexWord(row, 'cousin', 'cousin')) : null;
  });

  // --- Helpers: a rule's guard is added to every rule but the fallback -----------------
  const has = (x) => x != null && x !== false && x !== '' && !(Array.isArray(x) && !x.length);
  const FB = (...text) => ({ text });
  const G = (...text) => ({ g: true, text });
  const W = (cond, ...text) => ({ if: cond, text });
  const tm = (temper, ...text) => ({ if: { temper }, text });
  const L = (key, guard, rules) => lines(key, rules.map((r) => (r.if || r.g ? { if: { ...(guard || {}), ...(r.if || {}) }, pri: r.pri, text: r.text } : r)));
  const C = 'cheerful', O = 'ornery', S = 'shy', Q = 'curious', D = 'dreamy', Wt = 'witty', P = 'proud', Gl = 'gloomy';
  // the wizard's word in the right ear, as hearth.js does it
  const visit = (who, kind) => (T, v) => { const o = Game.villagers.find((x) => x.first === T.F[who] && x !== v && !x.leaving); if (o && ACTIONS.whisper_visit) v.queue.unshift({ a: ACTIONS.whisper_visit, extra: { to: o, kind } }); };
  const love = (who, d) => (T, v) => { const o = Game.villagers.find((x) => x.first === T.F[who] && x !== v); if (o) { v.love[o.id] = clamp((v.love[o.id] || 0) + d, 0, 1); o.love[v.id] = clamp((o.love[v.id] || 0) + d * 0.6, 0, 1); } };
  const SP = { spouse: has };

  // =====================================================================================
  // Husband or wife: how they are, how they met, what keeps it going
  // =====================================================================================
  addThread({
    id: 'family.spouse', label: (F) => `And how's ${F.spouse || 'the family'}?`, weight: 1.2, cool: 4,
    when: (F) => !!F.spouse, rel: (F) => (F.wed === 'long' ? 1.4 : 1.1),
    open: { warm: 'family.spouse.open' },
    beats: {
      start: { line: 'family.spouse.start', fx: { learn: ['family.spouse', '{Name} is married to {spouse}'] }, go: [
        { ap: 'ask', say: 'How did you two meet, if you don\'t mind me asking?', to: 'met' },
        { ap: 'jest', say: 'family.spouse.tease', label: 'Tease them about {spouse}', to: 'tease' },
        { ap: 'warm', say: 'You light up when you say the name. Did you know?', to: 'glow', need: { open: 1 }, soft: true },
      ] },
      met: { line: 'family.spouse.met', go: [
        { ap: 'ask', say: 'And when did you know? That it was {spouse}, I mean.', to: 'knew' },
        { ap: 'jest', say: 'And you\'ve been arguing about it ever since?', to: 'habits' },
        { ap: 'share', say: 'I knew someone like that, once. A long time ago.', to: 'wizlove', need: { open: 2 }, soft: true },
      ] },
      tease: { line: 'family.spouse.teased', go: [
        { ap: 'jest', say: 'And what does {spouse} do that drives you spare?', to: 'habits' },
        { ap: 'ask', say: 'Then what\'s the secret? Of a good match?', to: 'secret' },
        { ap: 'warm', say: 'I\'m only teasing. You\'re well matched, you two.', to: 'glow' },
      ] },
      glow: { line: 'family.spouse.glow', fx: { open: 1 }, go: [
        { ap: 'ask', say: 'What is it about {spouse}?', to: 'knew' },
        { ap: 'listen', say: '*You wait, and let them go on.*', label: 'Let them go on', to: 'listen' },
        { ap: 'ask', say: 'Then what\'s the secret? You must know it by now.', to: 'secret' },
      ] },
      habits: { line: 'family.spouse.habits', go: [
        { ap: 'jest', say: 'Shall I have a word? I\'m very persuasive. I have a staff.', to: 'staff' },
        { ap: 'warm', say: 'You\'d miss it, though. If it stopped.', to: 'miss' },
        { ap: 'ask', say: 'And what do you do that drives {spouse} spare?', to: 'turnabout' },
      ] },
      knew: { line: 'family.spouse.knew', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'That\'s a lovely thing to know about yourself.', to: 'secret' },
        { ap: 'share', say: 'I knew someone like that, once. A long time ago.', to: 'wizlove', need: { open: 2 }, soft: true },
        { ap: 'jest', say: 'And {spouse}? Did {spouse} know as quickly?', to: 'turnabout' },
      ] },
      listen: { line: 'family.spouse.listen', fx: { feel: 'drawn_out', trust: 0.02 }, go: [
        { ap: 'warm', say: 'Have you ever told {spouse} all that?', to: 'tell' },
        { ap: 'ask', say: 'Then what\'s the secret? You must know it by now.', to: 'secret' },
      ] },
      secret: { line: 'family.spouse.secret', fx: { respect: 0.01 }, go: [
        { ap: 'advise', say: 'Tell {spouse} that. Tonight, over supper.', to: 'tell' },
        { ap: 'jest', say: 'I\'ll write that down. In case I ever need it. Unlikely.', to: 'end' },
        { ap: 'warm', say: 'I\'ll remember that. Truly.', to: 'end', fx: { fond: 0.02 } },
      ] },
      miss: { line: 'family.spouse.miss', fx: { confide: { k: 'family.miss', t: '{Name} would be lost without {spouse}, and won\'t say so' } }, go: [
        { ap: 'warm', say: 'Your secret\'s safe. Though I suspect {spouse} knows.', to: 'end' },
        { ap: 'advise', say: 'Tell {spouse}. Not all of it. Just enough.', to: 'tell' },
      ] },
      turnabout: { line: 'family.spouse.turnabout', go: [
        { ap: 'jest', say: 'So you\'re a perfect match. Two thorns on one rose.', to: 'end', fx: { joke: { k: 'family.thorns', t: 'Two thorns on one rose: {name} and {spouse}.' } } },
        { ap: 'warm', say: 'That\'s how it should be. Each knowing the other\'s worst.', to: 'secret' },
      ] },
      staff: { line: 'family.spouse.staff', end: true },
      wizlove: { line: 'family.spouse.wizlove', fx: { trust: 0.04, open: 1 }, go: [
        { ap: 'share', say: 'She had a laugh like a kettle coming to the boil. That\'s all I\'ll say.', to: 'kettle' },
        { ap: 'jest', say: 'Oh, it was nothing. A wizard\'s heart is mostly pipe-smoke.', to: 'end' },
      ] },
      kettle: { line: 'family.spouse.kettle', fx: { trust: 0.03, joke: { k: 'family.kettle', t: 'The wizard once loved someone who laughed like a kettle.' } }, end: true },
      tell: { line: 'family.spouse.tell', fx: { respect: 0.02, run: visit('spouse', 'flowers') }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  L('family.spouse.open', SP, [
    FB('And how is your other half keeping?', 'How are things at home, {name}?'),
    G('And how\'s {spouse} keeping, {name}?', 'Tell me, {name}, how\'s {spouse}?', 'I haven\'t seen {spouse} about. All well?'),
    W({ wed: 'long' }, 'How long is it now, {name}, you and {spouse}?', 'You and {spouse}. Still the talk of the lane, after all these years?'),
    W({ wed: 'new' }, 'And how\'s married life treating {spouse}?'),
  ]);
  L('family.spouse.tease', SP, [
    FB('Still putting up with you, is it?', 'Still the one who burns the toast?'),
    G('Still putting up with you, is {spouse}?', 'Does {spouse} still laugh at your jokes? Brave hobbit.'),
    W({ wed: 'long' }, 'All these years and {spouse} hasn\'t run off with the tinker?'),
  ]);
  L('family.spouse.start', SP, [
    FB('Oh, the same as ever. Thank you for asking.', 'Well enough. Busy. We\'re always busy.', 'Fine, fine. The two of us rub along.'),
    G('{Spouse}? Oh, the same as ever. Snores like a bellows.', '{Spouse}\'s grand. Busy. Always busy.', '{Spouse} is well, thank you. Better than me, most days.'),
    W({ spouseJob: has }, '{Spouse}\'s run off their feet at the {spouseJob}\'s. Comes home smelling of it.', 'Busy with the {spouseJob}\'s work. I hardly see {spouse} before supper.'),
    W({ wed: 'long' }, '{Spouse}? Same as the day we wed. Only louder, and with fewer teeth.', 'Still here, still mine. We\'ve worn each other smooth, like river stones.'),
    W({ wed: 'new' }, '{Spouse}? Oh, wizard. I still can\'t believe it. Married!', 'We\'re still finding out who hogs the blankets. It\'s {spouse}.'),
    W({ expecting: true }, '{Spouse} and I are all of a flutter. There\'s a little one coming, you know.'),
    W({ spouseTemper: 'ornery' }, '{Spouse}\'s in a grump about the gutters. It\'s always the gutters.'),
    W({ spouseTemper: 'cheerful' }, '{Spouse}\'s been singing since breakfast. All the same verse. I may scream.'),
    W({ spouseTemper: 'dreamy' }, '{Spouse} put the teapot in the coal scuttle again. Head in the clouds.'),
    tm(C, 'Oh, {spouse}\'s wonderful! I\'m the luckiest hobbit in Thistledown.', 'Grand! We had pancakes this morning. {Spouse} flipped one onto the dresser.'),
    tm(O, '{Spouse}? Same as ever. Moves my pipe. Every day, moves my pipe.', 'Well enough. Not that {spouse} would tell me if not.'),
    tm(S, '...{Spouse}\'s well. Thank you. {Spouse} is... very good to me.', 'Oh. Um. Fine. We\'re fine. Thank you for asking.'),
    tm(Q, '{Spouse}? Well enough. Why, have you heard something? Have you?', 'Fine! Though {spouse}\'s taken up muttering. I want to know what about.'),
    tm(D, '{Spouse}... is still the best thing that ever happened to me. Don\'t tell.', 'Some mornings I wake and {spouse} is there and I think, how did that happen?'),
    tm(Wt, '{Spouse} is well. I\'ve trained {sThem} to bring tea at eight. Took years.', 'Married life is like a good stew, wizard. It needs stirring, and nobody likes the turnip.'),
    tm(P, '{Spouse}\'s the finest match in the village. I chose very well.', 'We\'re very well thought of, {spouse} and I. Everybody says so.'),
    tm(Gl, '{Spouse}\'s all right. One of us will go first, you know. I think about that.', 'Fine. For now. Things are always fine until they\'re not.'),
    W({ stage: 'elder' }, 'We\'ve been wed longer than you\'ve had that hat, I\'ll bet. {Spouse}\'s well.', '{Spouse}\'s knees are bad and mine are worse. We lean on each other. Literally.'),
  ]);
  L('family.spouse.met', SP, [
    FB('Oh, it was a long time ago. A party, I think. Isn\'t it always?', 'We grew up three holes apart. It was bound to happen.'),
    G('At a harvest dance. {Spouse} trod on my foot and said sorry so nicely I married {sThem}.', '{Spouse} came to borrow a cup of sugar. Never gave it back. Still owes me.', 'Under the party tree, at somebody\'s birthday. {Spouse} gave me a mathom. A frog vase.'),
    W({ wed: 'new' }, 'It feels like yesterday. It practically was! At the sing-song at the Badger.'),
    tm(C, 'At the spring fair! {Spouse} won the pie contest and I ate the prize. We laughed for an hour.', 'We fell in the river together. Separately. Then together. It\'s a long story!'),
    tm(O, 'We had a row about a fence. {Spouse} was wrong. We\'ve been arguing ever since.', 'Is that any business of yours? ...It was at a dance. I didn\'t want to go.'),
    tm(S, '...I used to leave apples on {spouse}\'s step. For a whole summer. Without a note.', 'I never said a word. {Spouse} did all the talking. Still does, mostly.'),
    tm(Q, 'I asked {spouse} what {sThey} was reading. Then what {sThey} thought of it. Then everything else.', 'I wanted to know why {spouse} hummed while walking. I\'m still finding out.'),
    tm(D, 'It was raining, and {spouse} shared a hedge with me. We watched the lightning. That was it.', 'I saw {spouse} across the field at harvest, with the sun behind. I forgot my own name.'),
    tm(Wt, '{Spouse} told a joke at the Badger. Worst joke I\'d ever heard. I had to marry {sThem} to stop {sThem}.', 'I lost a bet. Best bet I ever lost.'),
    tm(P, '{Spouse} pursued me for a whole season. I was quite the catch, you know.', 'I asked {spouse} to dance and {sThey} said yes. Of course {sThey} did.'),
    tm(Gl, 'At a funeral tea, of all places. Not a cheerful start. It worked out.', '{Spouse} was the only one who didn\'t laugh when I fell off the cart.'),
    W({ stage: 'elder' }, 'Oh, wizard, before your first gray hair. At the old mill, before it was rebuilt.'),
  ]);
  L('family.spouse.teased', SP, [
    FB('Cheek! ...Mostly, yes.', 'Ha! Only just.'),
    G('{Spouse} puts up with a great deal, I\'ll grant you.', 'Putting up with me is {spouse}\'s favorite pastime. {Spouse} says so.'),
    tm(C, 'Ha! Every day! And I put up with {spouse}\'s feet. Cold as frogs.', 'Ha! You\'re terrible. {Spouse} would laugh at that.'),
    tm(O, 'Putting up with ME? You should hear {spouse} chew.', 'I\'ll thank you not to take {spouse}\'s side. You don\'t even live with {sThem}.'),
    tm(S, 'Oh! Well... I hope so. I think so. Yes.', '...{Spouse} says I\'m no trouble at all. I think {sThey}\'s being kind.'),
    tm(Q, 'Do you think so? What have you heard? Who said?', 'Ha! I wonder, sometimes. What do you think {spouse} sees in me?'),
    tm(D, 'Putting up with... no. I think {spouse} quite likes me. Strange as that is.'),
    tm(Wt, 'Putting up with me? I\'m the prize. {Spouse} won me at the fair.', 'It\'s mutual endurance, wizard. Like a siege, with cookies.'),
    tm(P, '{Spouse} is very lucky to have me and knows it.', 'I am a great deal of hobbit to put up with. {Spouse} is equal to it.'),
    tm(Gl, 'For now. Ask me again in the winter.', 'Some days I wonder why. Then {spouse} brings tea and I stop wondering.'),
  ]);
  L('family.spouse.glow', SP, [
    FB('Do I? Oh. Well. I suppose I might.', 'Stop it. You\'ll make me go pink.'),
    G('Do I? Well... {spouse} has that effect. Even after all this time.', 'I didn\'t know it showed. {Spouse} would be insufferable if {sThey} knew.'),
    tm(C, 'Ha! I do, don\'t I? I can\'t help it. {Spouse}\'s just lovely.'),
    tm(O, 'I do not. ...Perhaps a little. Don\'t go spreading it.'),
    tm(S, '*goes very pink* ...Do I?', '...Oh. I didn\'t know anyone could tell.'),
    tm(Q, 'Really? Like a lamp? How odd. I wonder if {spouse} does it too.'),
    tm(D, 'Like a lamp in a window. Yes. That\'s how it feels, from the inside.'),
    tm(Wt, 'That\'s just indigestion, wizard. Very romantic indigestion.'),
    tm(P, 'Well, it\'s a very good marriage. Anyone would light up.'),
    tm(Gl, 'Do I? That\'s nice. I don\'t often light up. About anything.'),
    W({ wed: 'long' }, 'After all these years? Fancy that. Some lamps don\'t go out.'),
  ]);
  L('family.spouse.habits', SP, [
    FB('Oh, the usual. Leaves crumbs. Hums. Steals the warm side of the bed.', 'Drives me spare? Where do I start?'),
    G('{Spouse} hums. Constantly. The same four notes. I hear them in my sleep.', '{Spouse} leaves the teapot to stew. Black as a boot, by the time I get to it.', '{Spouse} puts the butter back in the wrong cupboard. Every single day.'),
    W({ spouseTemper: 'ornery' }, '{Spouse} grumbles at the weather. Out loud. As if it can hear.'),
    W({ spouseTemper: 'curious' }, '{Spouse} asks what I\'m thinking. All day. I\'m usually thinking about cheese.'),
    W({ spouseTemper: 'dreamy' }, '{Spouse} wanders off mid-sentence. I\'ve finished whole stories to an empty chair.'),
    W({ spouseTemper: 'witty' }, '{Spouse} has a pun for everything. Everything, wizard. Even the gravy.'),
    W({ spouseTemper: 'proud' }, '{Spouse} tells everyone about our pumpkins. They\'re my pumpkins.'),
    W({ spouseJob: has }, '{Spouse} brings the {spouseJob}\'s work home. On the boots. Through the parlor.'),
    tm(C, 'Ha! {Spouse} sings in the bath! Badly! I love it, really. Don\'t tell {sThem}.'),
    tm(O, 'Snores. Like a pig with a cold. And denies it! Denies it to my face!', 'Moves my things. Tidies them. I can\'t find a thing in my own hole.'),
    tm(S, '...{Spouse} talks to the neighbors. For ages. About me. I can hear through the door.'),
    tm(Q, '{Spouse} never finishes a book. Reads to the middle and starts another. Why? WHY?'),
    tm(D, '{Spouse} counts the stairs out loud. I\'ve stopped hearing it. It\'s like rain now.'),
    tm(Wt, '{Spouse} eats the crusts and leaves me the middles. ...No, that\'s the good bit. Never mind.'),
    tm(P, '{Spouse} corrects my pronunciation. In company. Of words I said perfectly well.'),
    tm(Gl, 'Leaves the door open. Every time. The draft\'ll be the death of us.'),
    W({ stage: 'elder' }, 'Fifty years {spouse}\'s put the spoons in handle-up. Fifty years.'),
  ]);
  L('family.spouse.knew', SP, [
    FB('Oh, I don\'t know. Somewhere between the soup and the pudding.', 'I just did. Like knowing it\'s going to rain.'),
    G('When {spouse} mended my coat without being asked. And sewed the button on wrong. That was it.', 'When I was ill and {spouse} sat up all night reading to me. Badly. I knew.'),
    tm(C, 'The very first day! I went home and told my mom. She said, about time.'),
    tm(O, 'When {spouse} argued me to a standstill. Nobody\'d ever done that. I had to marry {sThem}.'),
    tm(S, '...When {spouse} noticed I hadn\'t said anything, and asked. Nobody ever asked.'),
    tm(Q, 'I made a list. Pros and cons. The cons column had one thing in it. Snoring.'),
    tm(D, 'One evening, by the river. {Spouse} said the stars were like spilled salt. I knew then.'),
    tm(Wt, 'When I realized I\'d rather lose an argument to {spouse} than win one against anyone else.'),
    tm(P, 'I knew at once. I have excellent judgment in these matters.'),
    tm(Gl, 'When I thought {spouse} might leave the valley. I couldn\'t breathe for a day.'),
  ]);
  L('family.spouse.listen', SP, [
    FB('...It\'s the little things, you know. The cup of tea left by the chair.', 'Nobody asks about that. About us. It\'s nice to say it out loud.'),
    G('...{Spouse} warms my side of the bed before I come in. Never says. Just does it.', '{Spouse} remembers what I like. Every little thing. I forget my own boots.'),
    tm(C, 'And {spouse} makes me laugh every single day! Even the bad days. Especially those.'),
    tm(O, '...Hmph. {Spouse}\'s the only one who doesn\'t mind me. I know I\'m not easy.'),
    tm(S, '...{Spouse} lets me be quiet. Some folk can\'t bear quiet. {Spouse} hums along to it.'),
    tm(Q, 'I still don\'t know everything about {spouse}. I hope I never do. That\'s the fun.'),
    tm(D, 'When we\'re old, I want to sit on the bench by the door with {spouse}. That\'s all. That\'s the dream.'),
    tm(Wt, 'I\'ll tell you a secret. {Spouse} is funnier than me. Don\'t ever repeat that.'),
    tm(P, '...I\'m not easy to love. I know that. {Spouse} does it anyway. Every day.'),
    tm(Gl, 'I worry I don\'t deserve {spouse}. There. I\'ve never said that before.'),
  ]);
  L('family.spouse.secret', SP, [
    FB('Two kettles. Never share a kettle.', 'Never go to bed hungry. Everything else follows from that.'),
    G('Laugh at the same things. And let {spouse} have the last word on Highdays.', 'Separate blankets, one bed, and never mention the turnip incident.'),
    W({ wed: 'long' }, 'Forgive the small things at once and the big ones by teatime. That\'s forty years of it.'),
    tm(C, 'Laugh! At everything! Especially when the soup\'s burned.'),
    tm(O, 'Keep out of each other\'s way till after second breakfast.', 'Don\'t touch the other one\'s pipe. That\'s it. That\'s the whole secret.'),
    tm(S, '...Say sorry first. Even when it isn\'t your fault. Especially then.'),
    tm(Q, 'Keep asking questions. I still ask {spouse} a new one every week.'),
    tm(D, 'Go walking at dusk, together, at least once a week. You talk differently in the half-light.'),
    tm(Wt, 'Marry someone who thinks you\'re funny. Then never test it too hard.'),
    tm(P, 'Choose well. I did. That\'s really the whole of it.'),
    tm(Gl, 'There isn\'t one. You just keep going. Like a mill-wheel.'),
  ]);
  L('family.spouse.miss', SP, [
    FB('...I would. Don\'t tell anyone.', 'Miss it? I\'d be lost.'),
    G('...I would. If {spouse} stopped humming I\'d think the world had ended.', 'You\'re right, blast you. I\'d lie awake waiting for the snoring.'),
    tm(C, 'Oh, I\'d miss every bit! Even the crumbs! Don\'t tell {spouse} I said so.'),
    tm(O, 'I would not. ...I would. Keep that under your hat. Your enormous hat.'),
    tm(S, '...Yes. Very much. Please don\'t say.'),
    tm(Q, 'Would I? ...Yes. Funny how the annoying bits are the bits you\'d miss.'),
    tm(D, 'The house would be too quiet. I\'d hear the clock. I hate hearing the clock.'),
    tm(Wt, 'Miss it? I\'d have to start annoying myself. Exhausting.'),
    tm(P, 'Well, naturally. A marriage like ours is a fine thing. I\'d not deny it.'),
    tm(Gl, 'I think about that. One day I\'ll be listening for it and it won\'t come.'),
  ]);
  L('family.spouse.turnabout', SP, [
    FB('Me? Nothing! ...Well. The bread knife. I leave it in the butter.', 'I sing in the morning. Before anyone\'s awake. {Spouse} hates it.'),
    G('Oh, {spouse} has a list. I leave my boots by the fire. They steam. It smells, apparently.', 'I talk in my sleep. {Spouse} says I order pies. Whole menus.'),
    tm(C, 'I wake {spouse} up to tell {sThem} my dreams! Every morning! {SThey} loves it. Mostly.'),
    tm(O, 'Nothing. I am easy to live with. Ask anyone. Don\'t ask {spouse}.'),
    tm(S, '...I tidy. Too much. {Spouse} can\'t find {sTheir} own pipe.'),
    tm(Q, 'I take things apart to see how they work. The clock. The mangle. The door, once.'),
    tm(D, 'I forget things. Supper on the fire. {Spouse} on the doorstep, once. In the rain.'),
    tm(Wt, 'I correct {spouse}\'s jokes. Improve them. {SThey} calls it stealing. I call it editing.'),
    tm(P, 'I am never wrong, which {spouse} finds very difficult.'),
    tm(Gl, 'I sigh. Apparently. A lot. I hadn\'t noticed.'),
  ]);
  L('family.spouse.staff', SP, [
    FB('Ha! Don\'t you dare.', 'You leave us be. We like our quarrels.'),
    G('Have a word with {spouse}? {Spouse} would have six words back, and all of them about your beard.'),
    tm(C, 'Ha! Go on, then! I\'d love to see {spouse}\'s face!'),
    tm(O, 'Don\'t you meddle. If anyone\'s going to nag {spouse}, it\'s me.'),
    tm(S, 'Oh no, please don\'t. {Spouse} would know I\'d said.'),
    tm(Q, 'Would it work, though? Does the staff do that? What else does it do?'),
    tm(D, 'A staff wouldn\'t help. Nothing helps humming. It\'s like weather.'),
    tm(Wt, 'Your staff against {spouse}\'s rolling pin? I know where my money is.'),
    tm(P, 'I can manage my own household, thank you, wizard.'),
    tm(Gl, 'No use. You can\'t change a hobbit. Not after forty.'),
  ]);
  L('family.spouse.wizlove', SP, [
    FB('You? Really? I never think of wizards... like that.', '...Oh. I\'m sorry. Was it long ago?'),
    G('You did? I\'d never have guessed. You always seem so... wizardly.'),
    tm(C, 'You! Oh, tell me everything! Was she tall? Was she a wizard too?'),
    tm(O, 'Hmph. Well. I suppose even wizards are only folk underneath. Go on, then.'),
    tm(S, '...Oh. I\'m sorry. You don\'t have to say.'),
    tm(Q, 'You did? Who? Where? What happened? Sorry. Sorry. Only if you want to.'),
    tm(D, 'I thought so. You get a look, sometimes, by the fire. Like you\'re listening for someone.'),
    tm(Wt, 'A wizard in love! Did you turn her into a toad by accident? It happens.'),
    tm(P, 'Well. I\'m honored you\'d tell me. Not everyone gets told that, I expect.'),
    tm(Gl, 'And it ended. They always end. I\'m sorry, wizard.'),
  ]);
  L('family.spouse.kettle', SP, [
    FB('...That\'s lovely. I\'ll not tell a soul.', 'A kettle. Ha. I can hear it.'),
    G('A kettle! {Spouse} laughs like a door that wants oiling. Same thing, really.'),
    tm(C, 'Ha! A kettle! Oh, wizard, that\'s the loveliest thing I ever heard.'),
    tm(O, '...Hmph. Well. That\'s a good laugh, a kettle. Honest sort of noise.'),
    tm(S, '...Thank you for telling me. I\'ll keep it safe.'),
    tm(Q, 'Like a kettle! Whistling or bubbling? No, don\'t tell me. I\'ll imagine.'),
    tm(D, 'I\'ll think of her whenever the kettle boils now. So she won\'t be forgotten.'),
    tm(Wt, 'So every pot of tea in Thistledown is a love letter. I\'ll never drink tea the same.'),
    tm(P, 'Well, she was clearly a hobbit of taste. Choosing you, I mean.'),
    tm(Gl, '...We all have one we didn\'t keep, don\'t we.'),
  ]);
  L('family.spouse.tell', SP, [
    FB('...Perhaps I will. Perhaps over the pudding.', 'Tonight? Oh, all right. Don\'t look so smug.'),
    G('Tell {spouse}? {Spouse} would never let me forget it. ...All right. I\'ll pick some flowers first.'),
    tm(C, 'I will! I\'ll go and find {spouse} now! With flowers!'),
    tm(O, 'Hmph. Maybe. If {spouse} doesn\'t start on about the gutters first.'),
    tm(S, '...I\'ll try. I might write it down instead. On a little card.'),
    tm(Q, 'Do you think {spouse} knows already? I\'ll ask. That\'s a way of telling, isn\'t it?'),
    tm(D, 'I\'ll tell {spouse} at dusk. By the door. It\'s the right time for it.'),
    tm(Wt, 'I\'ll tell {spouse}. Then I\'ll tell {sThem} it was your idea, in case it goes badly.'),
    tm(P, 'I shall. I\'m not too proud to say a kind word. Well. Nearly not.'),
    tm(Gl, 'You\'re right. You never know how long you\'ve got to say things.'),
  ]);

  // =====================================================================================
  // Newlyweds
  // =====================================================================================
  const NW = { wed: 'new' };
  addThread({
    id: 'family.newlyweds', label: 'Married life suiting you?', weight: 1.6, cool: 3,
    when: (F) => F.wed === 'new',
    open: { warm: 'family.newly.open' },
    beats: {
      start: { line: 'family.newly.start', go: [
        { ap: 'ask', say: 'And the hole? Are you settling in?', to: 'nest' },
        { ap: 'jest', say: 'Has the shine worn off yet? It\'s been days.', to: 'shine' },
        { ap: 'warm', say: 'The whole valley\'s glad for you both.', to: 'glad' },
      ] },
      nest: { line: 'family.newly.nest', go: [
        { ap: 'ask', say: 'And the furniture? Whose chairs won?', to: 'chairs' },
        { ap: 'advise', say: 'Get a good kettle. Everything else follows from a good kettle.', to: 'kettle' },
        { ap: 'jest', say: 'Has anyone been put out to sleep with the coats yet?', to: 'coats' },
      ] },
      shine: { line: 'family.newly.shine', go: [
        { ap: 'ask', say: 'Any surprises? Living together?', to: 'surprise' },
        { ap: 'warm', say: 'I\'m only teasing. It suits you.', to: 'glad' },
      ] },
      glad: { line: 'family.newly.glad', go: [
        { ap: 'ask', say: 'What was the best bit of the day?', to: 'day' },
        { ap: 'share', say: 'I danced at a wedding once. Badly. The bride still writes.', to: 'dance' },
        { ap: 'listen', say: '*You let them talk.*', label: 'Let them talk', to: 'day' },
      ] },
      chairs: { line: 'family.newly.chairs', go: [
        { ap: 'jest', say: 'Then you\'ve learned the first law of marriage. Never fight about chairs.', to: 'end' },
        { ap: 'advise', say: 'Give a little. It\'s cheaper than a new chair.', to: 'kettle' },
      ] },
      kettle: { line: 'family.newly.kettle', fx: { respect: 0.02 }, end: true },
      coats: { line: 'family.newly.coats', fx: { fond: 0.01 }, go: [
        { ap: 'ask', say: 'Any surprises? Living together?', to: 'surprise' },
        { ap: 'warm', say: 'Well, I\'m glad it\'s going well.', to: 'end' },
      ] },
      surprise: { line: 'family.newly.surprise', go: [
        { ap: 'jest', say: 'You\'ll get used to it. In about sixty years.', to: 'end', fx: { joke: { k: 'family.sixty', t: 'You\'ll get used to it in about sixty years.' } } },
        { ap: 'warm', say: 'Those are the bits you\'ll treasure, later.', to: 'end' },
      ] },
      day: { line: 'family.newly.day', fx: { remember: 'Told the wizard all about our wedding day.', rv: 1 }, go: [
        { ap: 'ask', say: 'And did you cry? Be honest.', to: 'cry' },
        { ap: 'warm', say: 'It sounds perfect. Truly.', to: 'end' },
      ] },
      cry: { line: 'family.newly.cry', fx: { joke: { k: 'family.cried', t: '{Name} cried at their own wedding, and blamed the onions.' } }, end: true },
      dance: { line: 'family.newly.dance', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.newly.open', NW, [FB('Married life suiting you, {name}?', 'Well, well! How does it feel to be wed, {name}?'), G('And how are the newlyweds? You and {spouse}, I mean.', 'Mrs and Mr, or Mr and Mrs? How are you both, {name}?')]);
  L('family.newly.start', NW, [
    FB('It\'s wonderful. Strange, but wonderful.', 'I keep forgetting and then remembering. Married!'),
    G('{Spouse} made breakfast. Then I made breakfast. We had two breakfasts. Then two more.', 'I keep calling {spouse} by {sTheir} whole name, as if we\'d only just met.'),
    tm(C, 'Wonderful! Everything\'s wonderful! Even the washing up!', 'Oh, wizard, it\'s the best thing I ever did. Twice as many breakfasts.'),
    tm(O, 'It\'s all right. Takes some getting used to. Somebody else\'s boots in the hall.', 'Fine. Bit crowded. I\'m not used to sharing a pantry.'),
    tm(S, '...It\'s lovely. I\'m not used to being... looked at. Every morning.', 'Oh! Good. Very good. I still go pink at breakfast.'),
    tm(Q, 'Fascinating! Did you know {spouse} folds socks into little parcels? Why? I must find out.'),
    tm(D, 'It feels like the beginning of a long song. We\'ve only sung the first line.'),
    tm(Wt, 'Married life? So far it\'s mostly arguing about the blanket. Very romantic arguing.'),
    tm(P, 'It suits me very well. I always knew it would.', 'Everyone says we\'re the handsomest couple in years. They\'re right.'),
    tm(Gl, 'It\'s good. Too good. I keep waiting for something to go wrong.'),
  ]);
  L('family.newly.nest', NW, [
    FB('Slowly. There are boxes in the passage. I fell over one in the night.', 'We\'re getting there. We can\'t agree where the clock goes.'),
    G('{Spouse} wants the dresser by the window. I want it anywhere else. It\'s in the passage for now.', 'Half of everything is mine and half is {spouse}\'s. We have four teapots.'),
    W({ home: has }, '{Home}\'s lovely. It needs curtains. And a door that shuts first time.'),
    tm(C, 'Oh, it\'s a dream! We\'ve hung everything up. Some things twice.'),
    tm(O, 'There\'s nowhere to put my pipe-rack. Nowhere. It\'s on the floor.'),
    tm(S, '...{Spouse} did most of it. I just put the cups away. In the wrong place, apparently.'),
    tm(Q, 'We found a hidey-hole behind the pantry! With a very old cheese in it. Who left it?'),
    tm(D, 'I like the evenings best. The lamp, the window, {spouse} reading. I could stay forever.'),
    tm(Wt, 'Settling in? We\'ve settled. Into two separate sulks about the coat-hooks.'),
    tm(P, 'It\'s the best-kept hole on the lane already. Everyone\'s said so.'),
    tm(Gl, 'There\'s a damp patch. There\'s always a damp patch. It\'s shaped like a frown.'),
  ]);
  L('family.newly.shine', NW, [
    FB('Not a bit of it! Ask me again in a year.', 'Ha! Cheek. It\'s shinier every day.'),
    G('{Spouse} snored last night. I lay awake thinking it was the sweetest noise. Is that bad?'),
    tm(C, 'Never! It gets shinier! I didn\'t know you could be this happy and still eat.'),
    tm(O, 'What shine? We\'ve already had a row about the fender.'),
    tm(S, '...Not yet. I hope it doesn\'t. Does it?'),
    tm(Q, 'Does it wear off? When? Is there a day? I\'d like to be ready.'),
    tm(D, 'I don\'t think it\'s the kind of shine that wears. More like old brass. It gets warmer.'),
    tm(Wt, 'The shine\'s fine. It\'s the polish I\'m worried about. {Spouse} uses mine.'),
    tm(P, 'Our shine is of the very best quality, thank you.'),
    tm(Gl, 'Not yet. Give it time. Everything wears off in the end.'),
  ]);
  L('family.newly.glad', NW, [
    FB('Are they? That\'s kind. It was a lovely feast.', 'Everyone came! Even the ones we didn\'t ask.'),
    G('Everybody keeps stopping us in the lane. {Spouse} goes red every time.'),
    tm(C, 'Aren\'t they just! Somebody left a seed-cake on the step. And another one!'),
    tm(O, 'Glad for the free feast, more like. Ate us out of house and hole.'),
    tm(S, '...It\'s a lot of being looked at. But nice. Mostly nice.'),
    tm(Q, 'Are they? Who\'s said? What did they say? Did anyone say anything about the cake?'),
    tm(D, 'The lanterns were still up in the party tree this morning. I didn\'t want to take them down.'),
    tm(Wt, 'Glad? They\'re relieved. They\'d been betting on it for a season.'),
    tm(P, 'Well, it was the wedding of the year. I\'m not surprised.'),
    tm(Gl, 'That\'s nice. I hope they still are, when we\'re squabbling over the jam.'),
  ]);
  L('family.newly.chairs', NW, [
    FB('Mine! ...No. Half and half. Nobody\'s happy. That\'s marriage, they tell me.', 'We\'ve got seven chairs and two bottoms.'),
    G('{Spouse}\'s. {Spouse}\'s grandmother\'s, to be exact. They\'re very upright. Like her.'),
    tm(C, 'Both! We\'ve got so many chairs! We\'ll have to have a lot of guests!'),
    tm(O, '{Spouse}\'s. Wobbly old things. I said nothing. I\'m saying it now.'),
    tm(S, '...{Spouse}\'s. I didn\'t mind. I didn\'t really have chairs.'),
    tm(Q, 'We made a chart. Comfort, wobble, how much the cat likes it. Science won.'),
    tm(D, 'We put them in a circle. Like a little council. We sit in a different one each night.'),
    tm(Wt, 'The chairs are still in negotiation. Talks broke down over a footstool.'),
    tm(P, 'Mine, naturally. Mine are better.'),
    tm(Gl, 'Nobody\'s. The cat has them all.'),
  ]);
  L('family.newly.kettle', NW, [
    FB('A good kettle. I\'ll remember that.', 'Ha! We\'ve got three. Will that do?'),
    G('A kettle! {Spouse} will laugh. We\'ve been boiling water in a saucepan.'),
    tm(C, 'A kettle! Of course! Why didn\'t anyone tell us?'),
    tm(O, 'Hmph. We\'ve a kettle. It\'s the cups we fight over.'),
    tm(S, '...Thank you. I\'ll tell {spouse}. A good kettle.'),
    tm(Q, 'Why a kettle? Because of tea? Because of the noise? I want the whole theory.'),
    tm(D, 'A kettle singing on the stove. Yes. That\'s what home sounds like.'),
    tm(Wt, 'Wisdom of the ages: buy a kettle. I\'ll have it carved over the door.'),
    tm(P, 'We have the finest kettle in the village. Copper. Polished.'),
    tm(Gl, 'Kettles break. Then what?'),
  ]);
  L('family.newly.coats', NW, [
    FB('Not yet! Though there was a night with the blankets...', 'Ha! Not yet. Ask me after winter.'),
    G('{Spouse} slept in the armchair once. Said it was my feet. My feet are delightful.'),
    tm(C, 'Ha! No! But I did sleep in the bath once. On purpose. Long story.'),
    tm(O, 'Nearly. Over the window. Open or shut. It\'s shut.'),
    tm(S, '...No. Nobody\'s been cross. Should they be?'),
    tm(Q, 'Is that what happens? Does everyone do that? How many nights is normal?'),
    tm(D, 'We fell asleep by the fire, both of us, in the coats. It was lovely.'),
    tm(Wt, 'Only the cat. It started it.'),
    tm(P, 'We are far too civilized for that.'),
    tm(Gl, 'Not yet. I\'ve picked out a good coat, just in case.'),
  ]);
  L('family.newly.surprise', NW, [
    FB('Everything! I didn\'t know anyone could have so many socks.', '{Spouse} gets up so EARLY.'),
    G('{Spouse} talks to the plants. Asks them how they slept. They do look well on it.'),
    tm(C, 'Everything\'s a surprise! Good ones! Mostly! {Spouse} can whistle with two fingers!'),
    tm(O, '{Spouse} eats toast in bed. Crumbs everywhere. I married a mouse.'),
    tm(S, '...{Spouse} sings when {sThey} thinks nobody\'s listening. I pretend I\'m asleep.'),
    tm(Q, '{Spouse} has a box under the bed {sThey} won\'t let me open. I will find out.'),
    tm(D, '{Spouse} cries at sunsets. I thought only I did that.'),
    tm(Wt, 'That {spouse} is right about almost everything. Most unsettling. I\'m working on it.'),
    tm(P, 'How well I do it. Marriage, I mean. I\'m a natural.'),
    tm(Gl, 'How much there is to lose, now. I didn\'t think about that before.'),
  ]);
  L('family.newly.day', NW, [
    FB('Oh, all of it! The feast, the dancing, the speeches. Mostly the feast.', 'When the lanterns came on in the party tree. Everyone went quiet.'),
    G('When {spouse} saw me coming across the field. {Spouse}\'s face. I\'ll keep that forever.', '{Spouse} dropped the ring in the punch. We fished it out with a ladle. Best bit.'),
    tm(C, 'The dancing! I danced with everyone! Twice! I danced with a chair at one point.'),
    tm(O, 'The end. When they all went home. ...And the bit before that. When {spouse} took my hand.'),
    tm(S, '...When it was just us two, after. Sitting on the step. Quiet.'),
    tm(Q, 'The cake had six layers. I counted the currants. Four hundred and twelve.'),
    tm(D, 'The moment the music stopped and nobody moved. Just for a breath. Like the world held still.'),
    tm(Wt, 'The speeches. My uncle forgot whose wedding it was. Twice.'),
    tm(P, 'Everyone said it was the finest wedding in living memory. I agree.'),
    tm(Gl, 'It rained. Just a little. Then it stopped. Like the sky made up its mind.'),
  ]);
  L('family.newly.cry', NW, [
    FB('...A bit. It was the onions in the pie. Big onions.', 'Everybody cried. Even the cook. Especially the cook.'),
    G('Me? No. {Spouse} did. Buckets. ...I did a little. Don\'t tell.'),
    tm(C, 'Like a burst pipe! I laughed and cried at once! It was wonderful!'),
    tm(O, 'Certainly not. I had something in my eye. A whole wedding, in my eye.'),
    tm(S, '...Yes. All through the vows. I couldn\'t say mine properly.'),
    tm(Q, 'Yes. I wondered why. Happy tears are saltier, I think. I checked.'),
    tm(D, 'Yes. Happy, sad, all at once. Like the last day of summer.'),
    tm(Wt, 'Only when I saw the bill for the ale.'),
    tm(P, 'A single, dignified tear. Very becoming, I\'m told.'),
    tm(Gl, 'Of course. Weddings always make me think of everything ending.'),
  ]);
  L('family.newly.dance', NW, [
    FB('Ha! I can picture it. All elbows and hat.', 'You should have come to ours! We\'d have taught you.'),
    G('You should have danced at ours! {Spouse} would have loved it.'),
    tm(C, 'Ha! You must dance with me at the next party! Promise!'),
    tm(O, 'A wizard dancing. That\'d be worth the price of the ale.'),
    tm(S, '...I can\'t dance either. We could not-dance together.'),
    tm(Q, 'What dance was it? Was there a fiddle? Did you fall over?'),
    tm(D, 'I like to think of you dancing. A tall gray shape spinning under lanterns.'),
    tm(Wt, 'And the bride writes to say what? Please never dance again?'),
    tm(P, 'I\'m an excellent dancer myself. I could give you lessons.'),
    tm(Gl, 'At least you danced. Most folk just stand at the edge.'),
  ]);

  // =====================================================================================
  // Bickering: do you two ever quarrel?
  // =====================================================================================
  addThread({
    id: 'family.bicker', label: (F) => `Do you and ${F.spouse || 'yours'} ever quarrel?`, weight: 0.9, cool: 5,
    when: (F) => !!F.spouse && F.wed !== 'new', rel: (F) => (F.rowKin && F.rowKin === F.spouse ? 2 : F.temper === 'ornery' ? 1.3 : 1),
    open: { ask: 'family.bicker.open' },
    beats: {
      start: { line: 'family.bicker.start', go: [
        { ap: 'ask', say: 'And what about, mostly?', to: 'about' },
        { ap: 'jest', say: 'I only ask because I heard the shouting from the mill.', to: 'heard' },
        { ap: 'listen', say: '*You raise an eyebrow, and wait.*', label: 'Raise an eyebrow', to: 'about' },
      ] },
      about: { line: 'family.bicker.about', go: [
        { ap: 'ask', say: 'And who\'s usually right?', to: 'right' },
        { ap: 'advise', say: 'Never go to bed on a quarrel. Or hungry. Ideally neither.', to: 'bed' },
        { ap: 'jest', say: 'Shall I referee? I\'ve a good loud voice and a hat.', to: 'referee' },
      ] },
      heard: { line: 'family.bicker.heard', go: [
        { ap: 'ask', say: 'So what was it about?', to: 'about' },
        { ap: 'comfort', say: 'I\'m teasing. Every hole has its weather.', to: 'weather' },
      ] },
      right: { line: 'family.bicker.right', go: [
        { ap: 'ask', say: 'And how do you make it up, after?', to: 'makeup', need: { open: 1 }, soft: true },
        { ap: 'advise', say: 'Then say sorry first. It costs less than you\'d think.', to: 'sorry' },
        { ap: 'jest', say: 'So you\'re both right. That\'s a marriage, then.', to: 'end' },
      ] },
      bed: { line: 'family.bicker.bed', go: [
        { ap: 'ask', say: 'And how do you make it up, after?', to: 'makeup' },
        { ap: 'warm', say: 'You\'re a good pair. Even when you\'re a loud one.', to: 'end' },
      ] },
      referee: { line: 'family.bicker.referee', fx: { joke: { k: 'family.referee', t: 'The wizard offered to referee, with his hat.' } }, go: [
        { ap: 'ask', say: 'Seriously, though. How do you make it up?', to: 'makeup' },
        { ap: 'jest', say: 'I\'d award points for volume and style.', to: 'end' },
      ] },
      weather: { line: 'family.bicker.weather', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'And how do you make it up, after?', to: 'makeup' },
      ] },
      makeup: { line: 'family.bicker.makeup', fx: { confide: { k: 'family.makeup', t: 'How {name} and {spouse} make up after a row' }, trust: 0.02 }, go: [
        { ap: 'warm', say: 'That\'s the best thing I\'ve heard all week.', to: 'end' },
        { ap: 'jest', say: 'I\'ll try it on the next troll I quarrel with.', to: 'end' },
      ] },
      sorry: { line: 'family.bicker.sorry', fx: { respect: 0.02, run: visit('spouse', 'mend') }, end: true },
    },
    end: { fond: 0.015 },
  });
  L('family.bicker.open', SP, [FB('Do you two ever quarrel, {name}? Married folk, I mean.'), G('Do you and {spouse} ever quarrel, {name}?', 'Tell me honestly, {name}. You and {spouse}. Ever cross words?')]);
  L('family.bicker.start', SP, [
    FB('Quarrel? Us? ...Every day, about something.', 'Now and then. Show me a hole that doesn\'t.'),
    G('Me and {spouse}? Like cats in a sack. Then it passes. Like weather.', 'Only about things that matter. Like the right way to toast a crumpet.'),
    { if: { rowKin: (x, F) => !!x && x === F.spouse }, pri: 1, text: ['...We\'re not speaking, as it happens. Since breakfast. Over nothing. Over everything.'] },
    W({ wed: 'long' }, 'We used to. Now we just look at each other, and the quarrel happens on its own.'),
    tm(C, 'Oh, all the time! Then we laugh about it. Usually. Mostly.'),
    tm(O, 'Quarrel? We don\'t quarrel. We discuss. Loudly. With doors.', 'Is that any business of yours? ...Yes. We do. Often.'),
    tm(S, '...Not really. We go quiet, instead. Which is worse, I think.'),
    tm(Q, 'Of course! Doesn\'t everyone? How often is normal? Do you know?'),
    tm(D, 'Sometimes. Little storms. They blow over. The garden\'s greener after.'),
    tm(Wt, 'Quarrel? We prefer to call it competitive conversation.'),
    tm(P, 'Rarely. We are very well suited. When we do, I\'m usually right.'),
    tm(Gl, 'Yes. I always think it\'s the last one. That something will break.'),
  ]);
  L('family.bicker.about', SP, [
    FB('The washing up. The window. Whose turn it is to do the hens.', 'Oh, nothing. Nothing ever. It\'s always nothing.'),
    G('{Spouse}\'s mother. And the gutters. And whether the gutters are {spouse}\'s mother\'s fault.', 'The garden. {Spouse} wants beans. I want peas. We\'ve got beans. Again.'),
    W({ spouseJob: has }, 'Work. {Spouse} works too hard as a {spouseJob}, then is too tired to quarrel properly.'),
    W({ littleOne: has }, '{LittleOne}. Bedtimes. Puddings. Who\'s too soft. It\'s {spouse}. {Spouse}\'s too soft.'),
    W({ larder: 'bare' }, 'The larder. It\'s bare and we both think the other one ate it.'),
    tm(C, 'Silly things! Who loves who more. I win. I always win.'),
    tm(O, 'The way {spouse} breathes. Loudly. Through the nose. At me.', 'The fire. I like it banked. {Spouse} likes it roaring. We\'ll be burned in our beds.'),
    tm(S, '...Visitors. {Spouse} likes them. I hide in the pantry.'),
    tm(Q, 'Facts! Whether frogs sleep. Whether the moon is cheese-colored or cheese. That sort of thing.'),
    tm(D, 'Where to go one day. {Spouse} wants the sea. I want the mountains. We\'ll go nowhere, probably.'),
    tm(Wt, 'Grammar. {Spouse} says \'fewer\'. I say \'less\'. We\'ve had less peace ever since.'),
    tm(P, 'Whether my family or {spouse}\'s family is the older. Mine is. By a long chalk.'),
    tm(Gl, 'Money. The roof. What happens when we\'re old. Cheerful things.'),
  ]);
  L('family.bicker.heard', SP, [
    FB('You did NOT. ...Did you?', 'Oh, heavens. Was it that loud?'),
    G('From the MILL? ...That was {spouse}. I was being perfectly reasonable.'),
    tm(C, 'Ha! That was us laughing! Mostly. Some of it was shouting.'),
    tm(O, 'Then the miller should mind his own millstones.'),
    tm(S, 'Oh no. Oh no no no. Did everyone hear?'),
    tm(Q, 'Really? From the mill? How far is that? Sound carries over water, I suppose.'),
    tm(D, 'Funny. It felt so small, from inside.'),
    tm(Wt, 'That wasn\'t a quarrel. That was {spouse} singing.'),
    tm(P, 'I do not shout. I project.'),
    tm(Gl, 'Then the whole lane knows. Wonderful.'),
  ]);
  L('family.bicker.right', SP, [
    FB('Me. Obviously. ...Usually. About half the time. Fine, a third.', 'Whoever makes the tea afterwards.'),
    G('{Spouse} is usually right. I\'d never say so. {Spouse} knows.'),
    tm(C, 'Neither of us! That\'s the fun! Then we have cake.'),
    tm(O, 'Me. Always. {Spouse} just won\'t admit it.'),
    tm(S, '...{Spouse}, usually. I don\'t mind. I\'m used to it.'),
    tm(Q, 'I kept a tally once. Fifty-one to forty-nine. I won\'t say which way.'),
    tm(D, 'Right? It\'s not really about right. It\'s about being heard, isn\'t it?'),
    tm(Wt, 'We take turns. Highdays and holidays are mine.'),
    tm(P, 'I am. {Spouse} has occasionally been less wrong.'),
    tm(Gl, 'Nobody. We both lose. Every time.'),
  ]);
  L('family.bicker.bed', SP, [
    FB('Hungry? Never. Cross? Sometimes. Hungry, never.', 'We tried that. We were up till three.'),
    G('We have a rule. Whoever\'s angriest has to make the cocoa. It\'s very hard to stay angry making cocoa.'),
    tm(C, 'Never! We always make it up with a midnight snack.'),
    tm(O, 'I go to bed when I like, thank you. Quarrel or no.'),
    tm(S, '...We do try. Sometimes I just pretend to be asleep.'),
    tm(Q, 'Why not? Does it sour overnight, like milk? Is that the theory?'),
    tm(D, 'Lying awake beside a quarrel. It\'s the loneliest place in the world.'),
    tm(Wt, 'I did once. Woke up, forgot what it was about, and had to start again from scratch.'),
    tm(P, 'I never do. I win before bedtime.'),
    tm(Gl, 'Easy to say. Some nights it\'s that, or no sleep at all.'),
  ]);
  L('family.bicker.referee', SP, [
    FB('Ha! With your staff? You\'d need a bigger one.', 'You\'d be flattened. Between us. Like a pressed flower.'),
    G('{Spouse} would have you on {sTheir} side in a heartbeat. You\'re too soft.'),
    tm(C, 'Yes! We\'ll sell tickets! Wizard in the middle!'),
    tm(O, 'You\'d be the first thing we agreed on. Throwing you out.'),
    tm(S, 'Oh, please don\'t. I\'d die of shame.'),
    tm(Q, 'What would the rules be? Points for good points? Deductions for door-slamming?'),
    tm(D, 'A wizard keeping the peace between two hobbits. That\'s a tale, that is.'),
    tm(Wt, 'Do you award points for style? I\'ve a very good flounce.'),
    tm(P, 'There\'s no need. I\'d win on merit.'),
    tm(Gl, 'You\'d only make it worse. Everyone does.'),
  ]);
  L('family.bicker.weather', SP, [
    FB('...That\'s kind. It does. Ours just blows a bit loud.', 'Weather. Yes. That\'s it exactly.'),
    G('...It does, doesn\'t it. And {spouse} is my weather. Rain and all.'),
    tm(C, 'Ha! And we have lots of sunshine too! Honestly!'),
    tm(O, 'Hmph. Well. Better weather than no weather. Dull, no weather.'),
    tm(S, '...Thank you. I worry people think we\'re unhappy.'),
    tm(Q, 'Every hole? Even the quiet ones? What\'s theirs like, I wonder?'),
    tm(D, 'And the air\'s always clearer after. I like that.'),
    tm(Wt, 'Then ours is a stormy coast with occasional cake.'),
    tm(P, 'Ours is mostly fair, I\'ll have you know.'),
    tm(Gl, 'Some holes have floods.'),
  ]);
  L('family.bicker.makeup', SP, [
    FB('...Tea. Somebody makes tea. That\'s the sorry. The tea is the sorry.', 'We sit on the step. Not talking. Then someone nudges. That\'s it.'),
    G('{Spouse} leaves a cookie on my pillow. Just one. That means sorry. Two means very sorry.', 'I hum the song from our wedding. Badly. {Spouse} can\'t stay cross through it.'),
    W({ wed: 'long' }, 'After all these years? One of us says, "Well." And the other says, "Well." And that\'s done.'),
    tm(C, 'A kiss on the nose! Works every time. Try it on a troll, see what happens.'),
    tm(O, '...I fix something. The gate. The chair. {Spouse} knows what it means.'),
    tm(S, '...I write a little note. On a scrap. And leave it in {spouse}\'s boot.'),
    tm(Q, 'We each have to ask the other a question we don\'t know the answer to. It works. I don\'t know why.'),
    tm(D, 'We go walking. By the time we\'re at the river, we\'ve forgotten. The river takes it.'),
    tm(Wt, 'A formal treaty, signed in jam. Then we eat the treaty.'),
    tm(P, '{Spouse} apologizes and I graciously accept. ...Sometimes it\'s the other way. Rarely.'),
    tm(Gl, '...{Spouse} holds my hand in the dark. Doesn\'t say anything. Just holds it.'),
  ]);
  L('family.bicker.sorry', SP, [
    FB('...Hmph. Perhaps I will. Not because you said.', 'First? ...All right. Just this once.'),
    G('Fine. I\'ll go and find {spouse}. If {spouse} says sorry first, I\'m blaming you.'),
    tm(C, 'You\'re right! I\'ll go now! With a cake!'),
    tm(O, 'I\'m not saying sorry. I\'m saying... I\'ll put the kettle on. Same thing.'),
    tm(S, '...Yes. I think I\'d like to. Thank you.'),
    tm(Q, 'Does it cost less? Is that true? I\'ll try it and tell you.'),
    tm(D, 'You\'re right. What\'s the use of being right in an empty room?'),
    tm(Wt, 'Sorry is cheap, you say. I\'ll buy two.'),
    tm(P, 'I suppose a gracious hobbit can afford to go first. I\'m very gracious.'),
    tm(Gl, 'All right. Before it\'s too late. It\'s always nearly too late.'),
  ]);

  // =====================================================================================
  // Sweethearts
  // =====================================================================================
  const SW = { sweetheart: has };
  addThread({
    id: 'family.sweetheart', label: (F) => `Walking out with ${F.sweetheart || 'someone'}, I hear`, weight: 1.4, cool: 3,
    when: (F) => !!F.sweetheart,
    open: { jest: 'family.sweet.open' },
    beats: {
      start: { line: 'family.sweet.start', go: [
        { ap: 'ask', say: 'How did it start, you two?', to: 'began' },
        { ap: 'jest', say: 'The whole lane knows. The ducks know.', to: 'ducks' },
        { ap: 'warm', say: 'I\'m glad for you. Truly.', to: 'glad' },
      ] },
      began: { line: 'family.sweet.began', go: [
        { ap: 'ask', say: 'And is it serious?', to: 'serious' },
        { ap: 'jest', say: 'And did you trip over anything? Hobbits in love always trip.', to: 'trip' },
        { ap: 'warm', say: 'That\'s a lovely beginning.', to: 'glad' },
      ] },
      ducks: { line: 'family.sweet.ducks', go: [
        { ap: 'ask', say: 'Well, since everyone knows, how did it start?', to: 'began' },
        { ap: 'warm', say: 'They\'re only glad for you. As am I.', to: 'glad' },
      ] },
      glad: { line: 'family.sweet.glad', go: [
        { ap: 'ask', say: 'And do you ever think about the party tree? A wedding?', to: 'serious' },
        { ap: 'listen', say: '*You wait. There\'s more in their face.*', label: 'Wait for more', to: 'worry', need: { open: 1 }, soft: true },
      ] },
      trip: { line: 'family.sweet.trip', fx: { joke: { k: 'family.trip', t: 'Hobbits in love always trip over something.' } }, go: [
        { ap: 'ask', say: 'And is it serious?', to: 'serious' },
      ] },
      serious: { line: 'family.sweet.serious', go: [
        { ap: 'advise', say: 'Then ask. Life\'s short, even for hobbits.', to: 'ask' },
        { ap: 'ask', say: 'Then what\'s holding you back?', to: 'worry' },
        { ap: 'jest', say: 'I\'ll keep my best hat clean, then.', to: 'end' },
      ] },
      worry: { line: 'family.sweet.worry', fx: { confide: { k: 'family.sweetworry', t: '{Name} worries about walking out with {sweetheart}' } }, go: [
        { ap: 'comfort', say: 'Everyone feels that. It\'s how you know it matters.', to: 'comforted' },
        { ap: 'advise', say: 'Talk to {sweetheart}. Worries shrink when they\'re shared.', to: 'ask' },
        { ap: 'warm', say: 'Shall I put in a good word? I know a few.', to: 'word', need: { trust: 0.15 }, soft: true },
      ] },
      comforted: { line: 'family.sweet.comforted', fx: { trust: 0.03, drive: { lonely: -0.1 } }, end: true },
      ask: { line: 'family.sweet.ask', fx: { respect: 0.02, run: love('sweetheart', 0.05) }, end: true },
      word: { line: 'family.sweet.word', fx: { promise: { k: 'family.goodword', t: 'You said you\'d put in a good word with {sweetheart}', days: 4 }, run: love('sweetheart', 0.08) }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.sweet.open', SW, [FB('I hear you\'re walking out with someone, {name}.'), G('Walking out with {sweetheart}, I hear, {name}.', 'So. {Sweetheart}, is it, {name}?', 'A little bird tells me about you and {sweetheart}, {name}.')]);
  L('family.sweet.start', SW, [
    FB('Who told you? ...Everyone told you, didn\'t they.', 'Oh! Well. Yes. I suppose I am.'),
    G('{Sweetheart}? ...Yes. We go walking by the river. That\'s all. It\'s not anything. It\'s everything.', 'Is it that obvious? {Sweetheart} said nobody had noticed.'),
    tm(C, 'Yes! Isn\'t it marvelous? {Sweetheart} is the best hobbit in the valley!'),
    tm(O, 'And what if I am? Is it on a poster somewhere?', 'Who\'s been talking? It\'s the miller. It\'s always the miller.'),
    tm(S, '*goes the color of a radish* ...Yes.', '...Oh. People know? Oh dear. Oh no. ...Is it all right?'),
    tm(Q, 'Who told you? How do people find these things out? I want to know the route.'),
    tm(D, 'Walking out. Yes. That\'s what it feels like. Walking out into something bigger.'),
    tm(Wt, 'Walking out, walking in, walking round the duck pond. It\'s mostly walking, yes.'),
    tm(P, 'I am. {Sweetheart} is very lucky. I\'m very lucky too, I suppose.'),
    tm(Gl, 'For now. These things don\'t always last, do they.'),
  ]);
  L('family.sweet.began', SW, [
    FB('At a dance. I stepped on a toe. Then I stepped on it again, on purpose.', 'We just kept ending up at the same table. Then on the same bench.'),
    G('{Sweetheart} brought me a pie when I was ill. A whole pie. Who does that?', 'We were both reaching for the last seed-cake at the Badger. Neither of us let go.'),
    tm(C, 'At the sing-song! We sang the same wrong words! We laughed so much we fell off the bench!'),
    tm(O, '{Sweetheart} told me I was wrong about the weather. I was. Nobody\'d dared before.'),
    tm(S, '...{Sweetheart} sat next to me at story time. Every time. I thought it was an accident.'),
    tm(Q, '{Sweetheart} asked what I was reading. Nobody ever asks. We talked till the lamps went out.'),
    tm(D, 'We saw a heron at the same moment. Looked at each other. That was all. That was the start.'),
    tm(Wt, '{Sweetheart} laughed at my joke. The bad one. Only person who ever has.'),
    tm(P, '{Sweetheart} admired my garden. Rightly. And then we talked about it for a season.'),
    tm(Gl, 'I was sitting on my own in the rain. {Sweetheart} sat down too. Didn\'t say anything.'),
  ]);
  L('family.sweet.ducks', SW, [
    FB('The DUCKS? ...Fine. Let the ducks know. I don\'t care. I do care.', 'Oh, for goodness\' sake.'),
    G('Even the ducks? {Sweetheart} will be mortified. And secretly pleased.'),
    tm(C, 'Ha! Let them know! Let the whole valley know!'),
    tm(O, 'The ducks can mind their own business. As can you.'),
    tm(S, 'Oh no. ...The ducks? Really?'),
    tm(Q, 'How would ducks know? Have they been watching? I suppose we do walk by the pond a lot.'),
    tm(D, 'The ducks do look at us knowingly. I thought I was imagining it.'),
    tm(Wt, 'The ducks are terrible gossips. It\'s all quack quack quack.'),
    tm(P, 'Well, it\'s hardly a secret. We\'re a very handsome pair.'),
    tm(Gl, 'Then when it ends, the ducks will know that too.'),
  ]);
  L('family.sweet.glad', SW, [
    FB('Thank you. That means a lot, coming from you.', 'You are? Oh, that\'s nice.'),
    G('{Sweetheart} thinks you\'re a bit frightening. I\'ll tell {sweetheart} you\'re glad. That\'ll help.'),
    tm(C, 'Everybody\'s glad! I\'m glad! Even my mom\'s glad, and she\'s never glad!'),
    tm(O, 'Hmph. Well. Thank you. Don\'t make a fuss.'),
    tm(S, '...Thank you. I was worried people would laugh.'),
    tm(Q, 'Are you? Why? Do you think we suit? What do you see?'),
    tm(D, 'It\'s nice to have it seen. Like a lamp lit in a window.'),
    tm(Wt, 'Glad enough to give us a firework? A small one? Heart-shaped?'),
    tm(P, 'So you should be. It\'s a very good match.'),
    tm(Gl, 'I hope you still are later. If it all goes wrong.'),
  ]);
  L('family.sweet.trip', SW, [
    FB('...Over a hen. And a step. And my own feet.', 'How did you KNOW?'),
    G('I walked into the well the first time {sweetheart} smiled at me. The actual well.'),
    tm(C, 'Into the duck pond! Right in! {Sweetheart} laughed so much {sThey} fell in too!'),
    tm(O, 'I tripped over a perfectly good gate that someone left in the way.'),
    tm(S, '...Into a hedge. I pretended I meant to.'),
    tm(Q, 'Is that true? Do they always? Is it the looking up? I wonder if there\'s a study.'),
    tm(D, 'I trip over everything now. My mind\'s never where my feet are.'),
    tm(Wt, 'Only over my words. Constantly. I said \'goodnight\' at breakfast.'),
    tm(P, 'Certainly not. I glided. Mostly.'),
    tm(Gl, 'I tripped, and I\'ve been waiting for the fall ever since.'),
  ]);
  L('family.sweet.serious', SW, [
    FB('Serious? I... I think so. I think about it a lot.', 'The party tree? ...Maybe. One day. Not yet. Maybe.'),
    G('I\'ve thought about it. {Sweetheart} and me, under the party tree. With lanterns.', 'If {sweetheart} would have me. I don\'t know if {sweetheart} would.'),
    tm(C, 'Oh, yes! I\'ve already picked the cake! Don\'t tell {sweetheart}!'),
    tm(O, 'Serious? I\'m always serious. ...Yes. All right. Yes.'),
    tm(S, '...I\'d like it to be. I don\'t know how to say.'),
    tm(Q, 'How do you know when it\'s serious? Is there a sign? Should I be measuring something?'),
    tm(D, 'I dream about it. A little hole, a round door, two chairs by the fire.'),
    tm(Wt, 'Serious enough that I\'ve stopped making jokes about it. Mostly. That one doesn\'t count.'),
    tm(P, 'Naturally. I don\'t walk out with just anyone.'),
    tm(Gl, 'I want it to be. That\'s what scares me.'),
  ]);
  L('family.sweet.worry', SW, [
    FB('...What if I\'m not enough? What if {sweetheart} wakes up one day and wonders why?', 'We\'ve nowhere to live. Not a hole to call our own.'),
    G('{Sweetheart}\'s family don\'t think much of mine. Nobody\'s said. Nobody has to.', 'What if I ask and {sweetheart} laughs? Not unkindly. Just... laughs.'),
    W({ homeless: true }, 'I haven\'t even a roof. What sort of hobbit asks someone to share a hedge?'),
    W({ rift: true }, 'I\'m rift-born. {Sweetheart}\'s family are hill-folk back to the Old Took. They look at my visor.'),
    tm(C, 'I just want it to stay like this forever! But nothing does, does it?'),
    tm(O, 'I\'m not easy. I know I\'m not. {Sweetheart} will find out eventually.'),
    tm(S, '...I can\'t ever think what to say. {Sweetheart} talks and I just nod.'),
    tm(Q, 'I don\'t know how any of it works. Asking. Weddings. Where the chairs go.'),
    tm(D, 'What if it\'s only a summer thing? Summer things end with summer.'),
    tm(Wt, 'I make jokes so I don\'t have to say the real things. I\'m doing it now. See?'),
    tm(P, 'I\'m not used to needing anyone. It\'s very inconvenient.'),
    tm(Gl, 'Everything I\'ve ever cared about has gone away. Why not this?'),
  ]);
  L('family.sweet.comforted', SW, [
    FB('...Do you think so? That\'s good. That helps.', 'Thank you. I needed someone to say that.'),
    G('It matters. {Sweetheart} matters. ...I feel better. A bit.'),
    tm(C, 'You\'re right! Of course it matters! That\'s the good kind of fright!'),
    tm(O, 'Hmph. Well. Yes. That\'s sense, that is.'),
    tm(S, '...Thank you. I\'ll remember that.'),
    tm(Q, 'So the fear is a measuring stick? That\'s clever. I like that.'),
    tm(D, 'Like the wind before rain. It\'s the size of it that tells you.'),
    tm(Wt, 'So my terror is a compliment. I\'ll tell {sweetheart}. ...Maybe not.'),
    tm(P, 'Naturally it matters. I only care about things that matter.'),
    tm(Gl, '...Maybe. Maybe it\'s not a warning. Just a feeling.'),
  ]);
  L('family.sweet.ask', SW, [
    FB('...You\'re right. I will. Soon. Very soon. This week. Next week.', 'All right. I\'ll find the right moment.'),
    G('I\'ll talk to {sweetheart}. Tonight. By the river. Before I lose my nerve.'),
    tm(C, 'I will! I\'ll go now! No, after lunch! No, NOW!'),
    tm(O, 'Fine. I\'ll ask. And if it goes wrong I\'m coming to find you.'),
    tm(S, '...I\'ll try. I might write it on a card.'),
    tm(Q, 'How do I start? Never mind. I\'ll start with a question. I\'m good at those.'),
    tm(D, 'At dusk, then. When the bats come out. That\'s the time for it.'),
    tm(Wt, 'I\'ll ask. And I\'ll say it was your idea, so you can share the blame.'),
    tm(P, 'Quite right. Faint heart never won anything. I shall be magnificent.'),
    tm(Gl, 'Life\'s short. Yes. That\'s what frightens me into it.'),
  ]);
  L('family.sweet.word', SW, [
    FB('Would you? Oh, you\'re a dear.', 'A good word from the wizard! I\'ll hold you to that.'),
    G('With {sweetheart}? Oh, would you? Just a little one. Not too much.'),
    tm(C, 'Would you? Oh, thank you! Tell {sweetheart} I\'m wonderful! Tell {sThem} I can juggle!'),
    tm(O, 'Hmph. I suppose it can\'t hurt. Don\'t overdo it.'),
    tm(S, '...Would you? Just... tell {sweetheart} I mean it. That\'s all.'),
    tm(Q, 'What would you say? Can I hear it first? Practice on me.'),
    tm(D, 'A word from a wizard. Like a spell. I\'ll think of it like that.'),
    tm(Wt, 'A good word? Make it two. And make one of them \'dashing\'.'),
    tm(P, 'Tell {sweetheart} what you\'ve seen of me. That should be enough.'),
    tm(Gl, 'Would it help? ...Thank you. I\'ll take anything.'),
  ]);

  // =====================================================================================
  // A crush, unspoken
  // =====================================================================================
  const CR = { crush: has };
  addThread({
    id: 'family.crush', label: 'Anyone caught your eye?', weight: 1, cool: 4,
    when: (F) => !!F.crush || (F.single && F.stage === 'grown' && !F.sweetheart),
    rel: (F) => (F.crush ? 1.5 : 0.6),
    open: { jest: 'family.crush.open' },
    beats: {
      start: { line: 'family.crush.start', go: [
        { ap: 'jest', say: 'You\'ve gone very pink for someone with no one in mind.', to: 'pink', need: { if: CR } },
        { ap: 'ask', say: 'Anyone at all? Not even at the sing-song?', to: 'name', need: { open: 1, if: CR } },
        { ap: 'warm', say: 'No hurry. The heart keeps its own clock.', to: 'clock' },
      ] },
      pink: { line: 'family.crush.pink', go: [
        { ap: 'ask', say: 'So who is it?', to: 'name', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'I\'ll not pry. The heart keeps its own clock.', to: 'clock' },
      ] },
      name: { line: 'family.crush.name', fx: { confide: { k: 'family.crush', t: '{Name} is sweet on {crush}', secret: true } }, go: [
        { ap: 'ask', say: 'And what is it about {crush}?', to: 'what' },
        { ap: 'advise', say: 'Tell {crush}. Take a flower. The worst that happens is a flower.', to: 'bold' },
        { ap: 'warm', say: 'Shall I put in a word?', to: 'word', need: { trust: 0.2 }, soft: true },
      ] },
      what: { line: 'family.crush.what', go: [
        { ap: 'advise', say: 'Then tell {crush}. Take a flower.', to: 'bold' },
        { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'safe' },
      ] },
      clock: { line: 'family.crush.clock', go: [
        { ap: 'ask', say: 'But is there someone? Just a little bit?', to: 'name', need: { open: 1, if: CR }, soft: true },
        { ap: 'ask', say: 'And this someone, when they come. What would they be like?', to: 'ideal' },
        { ap: 'warm', say: 'And if the clock\'s slow, that\'s all right too.', to: 'end' },
      ] },
      ideal: { line: 'family.crush.ideal', go: [
        { ap: 'jest', say: 'I\'ll keep an eye out. I\'m a dreadful matchmaker, mind.', to: 'end', fx: { joke: { k: 'family.ideal', t: 'The wizard is keeping an eye out for someone. Heaven help us.' } } },
        { ap: 'warm', say: 'They\'d be lucky to find you.', to: 'end', fx: { fond: 0.02 } },
      ] },
      bold: { line: 'family.crush.bold', fx: { respect: 0.02, run: love('crush', 0.06) }, end: true },
      safe: { line: 'family.crush.safe', fx: { trust: 0.04, promise: { k: 'family.crushsecret', t: 'You promised not to tell about {crush}', days: 20 } }, end: true },
      word: { line: 'family.crush.word', fx: { promise: { k: 'family.crushword', t: 'You said you\'d put in a word with {crush}', days: 4 }, run: love('crush', 0.1) }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.crush.open', null, [FB('Anyone caught your eye lately, {name}?', 'Tell me, {name}. Is there anyone special?', 'You have a look about you, {name}. A spring sort of look.')]);
  L('family.crush.start', null, [
    FB('Me? No. Nobody. Why would you ask that?', 'Caught my eye? I\'ve too much to do for that.'),
    W(CR, 'No! ...Why? Has someone said something? Who said?', 'Nobody. Nobody at all. Especially not anybody in particular.'),
    tm(C, 'Oh, everyone catches my eye! It\'s a lovely village! ...Why are you looking at me like that?'),
    tm(O, 'Caught my eye? The only thing that\'s caught my eye is a splinter.'),
    tm(S, '...*looks at feet*'),
    tm(Q, 'Why do you ask? Do you know something? Is there a list?'),
    tm(D, 'Oh... maybe. Maybe someone. Like a song you can\'t quite remember.'),
    tm(Wt, 'My eye\'s been caught, released, caught again. It\'s a very busy eye.'),
    tm(P, 'Plenty of folk have their eye on me, I\'ll have you know.'),
    tm(Gl, 'Who\'d look at me?'),
    W({ stage: 'elder' }, 'At my age? Ha! My eye\'s caught by a good cheese, these days.'),
  ]);
  L('family.crush.pink', CR, [
    FB('I am NOT pink. It\'s the sun.', 'It\'s warm in here! It\'s warm out here!'),
    G('It\'s... it\'s the tea. Hot tea. Very hot.', 'Pink? No. That\'s my natural color. In the presence of wizards.'),
    tm(C, 'Ha! Am I? Oh dear! I can never hide anything!'),
    tm(O, 'I\'m pink because you\'re annoying.'),
    tm(S, '*goes pinker*'),
    tm(Q, 'Am I? How pink? Like a rose or like a radish? It matters.'),
    tm(D, 'Am I? I was thinking about... nothing. A nothing with lovely hands.'),
    tm(Wt, 'Pink is very fashionable this season. I\'m a trendsetter.'),
    tm(P, 'I am never pink. I am occasionally rosy, which is distinguished.'),
    tm(Gl, 'Wonderful. Now everyone will be able to tell.'),
  ]);
  L('family.crush.name', CR, [
    FB('...There might be someone. I\'m not saying who.', 'If I tell you, you\'ll tell. Wizards always tell.'),
    G('...{Crush}. There. I said it. Don\'t you DARE tell.', '...It\'s {crush}. Has been since the spring fair. Don\'t laugh.'),
    tm(C, '{Crush}! I can\'t stop thinking about {crush}! I said hello yesterday and nearly fainted!'),
    tm(O, '...{Crush}. Not a word. Not to anyone. I mean it.'),
    tm(S, '...{Crush}. *whispers* Please don\'t say.'),
    tm(Q, 'It\'s {crush}. I keep finding reasons to ask {crush} things. Anything. The time. The weather.'),
    tm(D, '{Crush}. I watch {crush} cross the green and the whole morning goes golden.'),
    tm(Wt, '{Crush}. I\'ve prepared eleven clever things to say to {crush}. I\'ve said none.'),
    tm(P, '{Crush}. A fine choice, I think you\'ll agree. I have excellent taste.'),
    tm(Gl, '{Crush}. Not that {crush} would ever look twice. Why would {sThey}?'),
  ]);
  L('family.crush.what', CR, [
    FB('Everything. The laugh. The way {crush} holds a cup.', 'I don\'t know. I just feel lighter when {crush}\'s about.'),
    G('{Crush} is kind to the little ones. And the hens. Even the mean hen.'),
    tm(C, '{Crush} laughs with the whole body! Like me! We\'d laugh all day!'),
    tm(O, '{Crush} doesn\'t talk nonsense. Rare, round here. Present company excepted. Not excepted.'),
    tm(S, '...{Crush} said hello to me once and remembered my name the next day.'),
    tm(Q, '{Crush} knows things. About stars. About beetles. I want to know them too.'),
    tm(D, '{Crush} hums when walking. The same tune as my grandmother. I can\'t explain it.'),
    tm(Wt, '{Crush} once beat me at riddles. Nobody beats me at riddles.'),
    tm(P, '{Crush} is the only one in the village who\'s my equal. Nearly.'),
    tm(Gl, '{Crush} makes things seem less gray. That\'s all. That\'s a lot.'),
  ]);
  L('family.crush.clock', null, [
    FB('...That\'s a nice way to put it.', 'Its own clock. Yes. Mine\'s a bit slow.'),
    W(CR, '...My clock might be running a bit fast, actually. Don\'t ask.'),
    tm(C, 'Ha! Mine\'s always striking something!'),
    tm(O, 'Hmph. Mine\'s stopped, I think. Suits me.'),
    tm(S, '...Thank you. Everyone keeps asking. You\'re the first to say that.'),
    tm(Q, 'Its own clock! Does it chime? How would you know when?'),
    tm(D, 'And when it chimes, I\'ll hear it. Like the bells at a wedding, far off.'),
    tm(Wt, 'Mine\'s a cuckoo clock. Very loud, mostly nonsense.'),
    tm(P, 'My clock is perfectly regulated, thank you.'),
    tm(Gl, 'And if it never chimes at all?'),
    W({ stage: 'elder' }, 'Mine chimed long ago, wizard. Just the once. That\'s enough for a life.'),
  ]);
  L('family.crush.ideal', null, [
    FB('Kind. Patient. Fond of cheese. Not too fond. I need some cheese.', 'Someone who laughs at the right bits. And the wrong ones.'),
    W({ stage: 'elder' }, 'Someone with warm feet and a good memory. Mine\'s going. One of us should have one.'),
    W({ pastime: has }, 'Someone who doesn\'t mind {pastimeWord} all over the kitchen table.'),
    W({ job: has }, 'Someone who doesn\'t mind a {jobWord} coming home tired and grubby.'),
    tm(C, 'Someone who sings! Loudly! Badly! With me!', 'Someone who likes picnics. Lots of picnics. In the rain, even.'),
    tm(O, 'Someone quiet. Who leaves my pipe alone. That\'s the whole list.', 'Someone who doesn\'t ask what I\'m thinking. I\'m thinking about my dinner.'),
    tm(S, '...Someone who doesn\'t mind if I don\'t talk much. Who talks enough for two.', '...Someone kind. Just kind. That\'s all.'),
    tm(Q, 'Someone who knows things I don\'t. And wants to know things I do.', 'Someone who\'d come and look at a beetle with me. Properly look.'),
    tm(D, 'Someone who\'d sit and watch the clouds and not say they\'re only clouds.', 'Someone who\'d dance in the kitchen with no music.'),
    tm(Wt, 'Someone who can keep up. And who\'ll pretend not to have heard my jokes before.', 'Someone with a good laugh and a bad memory for my mistakes.'),
    tm(P, 'Someone who appreciates quality. And a well-kept garden. And me.', 'Someone of good family. With excellent teeth.'),
    tm(Gl, 'Someone who\'d stay. That\'s all. Someone who\'d stay.', 'Someone who wouldn\'t mind the rain. I seem to bring the rain.'),
  ]);
  L('family.crush.bold', CR, [
    FB('A flower. ...Yes. I could manage a flower.', 'The worst is a flower. That\'s true. That\'s actually true.'),
    G('A flower for {crush}. ...All right. A small one. Then I\'ll run.'),
    tm(C, 'A flower! I\'ll take a whole armful! I\'ll go now!'),
    tm(O, 'Fine. One flower. If {crush} laughs I\'m blaming you.'),
    tm(S, '...I\'ll leave it on the step. Without a note. ...With a small note.'),
    tm(Q, 'Which flower? What do they mean? Is there a flower that means \'hello\'?'),
    tm(D, 'A primrose. Yes. Something that comes back every year.'),
    tm(Wt, 'I\'ll take a flower and a joke. If the joke fails, the flower can carry it.'),
    tm(P, 'I shall present a flower. A very good one. From my own garden.'),
    tm(Gl, 'The worst that happens is a flower. ...Unless {crush} says no. Then it\'s a flower and that.'),
  ]);
  L('family.crush.safe', CR, [
    FB('Thank you. I knew I could tell you.', 'Not a word. You promised.'),
    G('Not a word to {crush}. Promise me.'),
    tm(C, 'Thank you! You\'re the best! I feel so much lighter for saying it!'),
    tm(O, 'You\'d better. Wizards talk. Mind you don\'t.'),
    tm(S, '...Thank you. Really.'),
    tm(Q, 'Have you ever told a secret? Ever? By accident? ...I trust you anyway.'),
    tm(D, 'It\'s nice that someone else knows. It feels more real.'),
    tm(Wt, 'Safe as a dragon\'s hoard. Without the dragon. Hopefully.'),
    tm(P, 'I\'d expect nothing less.'),
    tm(Gl, 'I hope so. Things get out.'),
  ]);
  L('family.crush.word', CR, [
    FB('Would you? Oh... just a small one.', 'A word from the wizard. Oh my.'),
    G('With {crush}? Oh... just something small. That I\'m nice. That I\'m not odd.'),
    tm(C, 'Yes! Yes please! Tell {crush} I make wonderful pancakes!'),
    tm(O, 'Hmph. Subtly. If you know what subtle is. With that hat.'),
    tm(S, '...Would you? Don\'t say I asked.'),
    tm(Q, 'What would you say? Exactly? Word for word? I need to know.'),
    tm(D, 'Like a little spell. A word on the wind. Yes.'),
    tm(Wt, 'A word? I\'d prefer a paragraph. With pictures.'),
    tm(P, 'Mention my garden. And my good looks. In that order.'),
    tm(Gl, 'It won\'t do any good. ...But thank you. Try.'),
  ]);

  // =====================================================================================
  // Happily single, or not
  // =====================================================================================
  addThread({
    id: 'family.single', label: 'Never thought of settling down?', weight: 0.7, cool: 6,
    when: (F) => F.single && !F.crush && F.stage !== 'child' && (F.stage === 'elder' || F.livesAlone || F.temper === 'gloomy' || F.temper === 'dreamy'),
    open: { ask: 'family.single.open' },
    beats: {
      start: { line: 'family.single.start', go: [
        { ap: 'ask', say: 'Was there ever anyone?', to: 'once', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'Married to your work, I suppose.', to: 'work' },
        { ap: 'warm', say: 'Some of the happiest hobbits I know live alone.', to: 'alone' },
      ] },
      once: { line: 'family.single.once', fx: { confide: { k: 'family.once', t: 'There was someone, once, that {name} let go' } }, go: [
        { ap: 'comfort', say: 'Then you loved well, once. That stays with you.', to: 'stays' },
        { ap: 'ask', say: 'Do you ever wonder what might have been?', to: 'wonder' },
        { ap: 'listen', say: '*You say nothing. The pipe smoke curls.*', label: 'Say nothing', to: 'stays' },
      ] },
      work: { line: 'family.single.work', go: [
        { ap: 'ask', say: 'And do you mind? Truly?', to: 'mind' },
        { ap: 'warm', say: 'There\'s more than one kind of family.', to: 'alone' },
      ] },
      alone: { line: 'family.single.alone', go: [
        { ap: 'jest', say: 'Shall I find you someone? I\'m a dreadful matchmaker.', to: 'match' },
        { ap: 'ask', say: 'And do you ever get lonely?', to: 'mind' },
      ] },
      mind: { line: 'family.single.mind', go: [
        { ap: 'comfort', say: 'Then come to the Badger on sing-song night. I\'ll save you a seat.', to: 'seat' },
        { ap: 'jest', say: 'Shall I find you someone? I\'m a dreadful matchmaker.', to: 'match' },
      ] },
      wonder: { line: 'family.single.wonder', fx: { trust: 0.03 }, end: true },
      stays: { line: 'family.single.stays', fx: { trust: 0.03, feel: 'drawn_out' }, end: true },
      match: { line: 'family.single.match', fx: { joke: { k: 'family.match', t: 'The wizard offered to play matchmaker. Heaven help us.' } }, end: true },
      seat: { line: 'family.single.seat', fx: { fond: 0.02, drive: { lonely: -0.1 }, promise: { k: 'family.seat', t: 'You said you\'d save {name} a seat at the sing-song', days: 7 } }, end: true },
    },
    end: { fond: 0.015 },
  });
  L('family.single.open', null, [FB('Never thought of settling down, {name}?', 'You\'ve no one to fuss over you, {name}. Do you mind?'), W({ stage: 'elder' }, 'You never wed, {name}? I\'ve often wondered.')]);
  L('family.single.start', null, [
    FB('Settle down? I\'m very settled. Ask my armchair.', 'Oh, it never came up. Like a seed that didn\'t take.'),
    W({ stage: 'elder' }, 'At my age? I\'m settled as a stone. Married to my armchair.', 'I had my chances. I let them go by, like boats.'),
    W({ livesAlone: true }, 'I like my own company. And my own pantry. Mostly the pantry.'),
    tm(C, 'Never needed to! I\'ve got the whole village! They\'re all my family!'),
    tm(O, 'And share my pantry? Not likely.', 'Somebody else\'s boots in my hall? I\'d sooner have a goat.'),
    tm(S, '...Who\'d want me? I\'m no good at talking.'),
    tm(Q, 'I\'ve thought about it. A great deal. I\'ve never quite worked out how it starts.'),
    tm(D, 'I\'ve always been waiting for something. I\'m not sure it\'s a someone.'),
    tm(Wt, 'I settled down years ago. Right here. In this chair. Nobody noticed.'),
    tm(P, 'I\'ve never met anyone quite up to it.'),
    tm(Gl, 'Who\'d have me? I\'m dull as ditchwater. I\'ve been told.'),
  ]);
  L('family.single.once', null, [
    FB('...There was. A long time ago. I was too slow.', 'Once. We were young. One of us went away. Guess which.'),
    W({ stage: 'elder' }, 'Once. Before your beard was gray. Before mine was. She went to Bree and married a cooper.', 'There was. We were going to. Then we weren\'t. I can\'t even remember why.'),
    tm(C, 'Oh, there was a summer! Lovely summer. Then it was autumn. Ha. That\'s all.'),
    tm(O, '...None of your business. ...Yes. Once. Didn\'t work. Don\'t ask why.'),
    tm(S, '...There was. I never told them. I just... never did.'),
    tm(Q, 'Yes. I asked too many questions. I think that was it. I never stopped asking.'),
    tm(D, 'There was someone I used to walk the river with. We always meant to say something. We never did.'),
    tm(Wt, 'There was. I made a joke at the wrong moment. Best joke I ever told. Worst timing.'),
    tm(P, 'There was. I was too proud to ask. You may laugh. I\'d prefer you didn\'t.'),
    tm(Gl, 'There was. They left the valley. I didn\'t follow. I never follow.'),
  ]);
  L('family.single.work', null, [
    FB('Ha! Married to the work, divorced from the washing up.', 'Somebody has to keep this village going.'),
    W({ job: has }, 'Being a {jobWord} is a good spouse. Never complains. Doesn\'t snore.', 'I\'m wed to my work as a {jobWord}. Long marriage. Plenty of arguments.'),
    tm(C, 'Ha! Yes! And it\'s a very happy marriage!'),
    tm(O, 'Better than being married to someone who talks all day.'),
    tm(S, '...Work doesn\'t mind if I\'m quiet. That\'s nice.'),
    tm(Q, 'Work asks questions back. People mostly don\'t.'),
    tm(D, 'Work gives the days a shape. That\'s almost the same, isn\'t it?'),
    tm(Wt, 'Work and I have an understanding. I turn up, it doesn\'t leave.'),
    tm(P, 'The village would fall apart without me. I\'ve no time for courting.'),
    tm(Gl, 'Work\'s all there is, some days.'),
  ]);
  L('family.single.alone', null, [
    FB('They are, aren\'t they? A whole pie and nobody\'s feet.', 'That\'s what I say. Nobody believes me.'),
    W({ livesAlone: true, home: has }, '{Home} is all mine. The quiet, the fire, the last cookie. All mine.'),
    tm(C, 'Exactly! I sing as loud as I like! At three in the morning!'),
    tm(O, 'Thank you. Finally, someone with sense.'),
    tm(S, '...I like it quiet. I\'m glad someone understands.'),
    tm(Q, 'Are they? Who? How do they do it? I\'d like notes.'),
    tm(D, 'Alone isn\'t lonely. Not always. Sometimes it\'s just room to think.'),
    tm(Wt, 'I\'m never alone. I\'ve got me. I\'m excellent company.'),
    tm(P, 'I\'m very content. I want for nothing. Well. Hardly anything.'),
    tm(Gl, 'Happiest? I don\'t know about happiest.'),
  ]);
  L('family.single.mind', null, [
    FB('...Sometimes. Of an evening. When the fire\'s low.', 'Mind? Only on feast days, when everyone pairs off.'),
    W({ lonely: true }, 'Yes. Lately, yes. The evenings are long.'),
    tm(C, 'Hardly ever! Well. Sometimes on Highdays. Only a bit.'),
    tm(O, 'No. ...On sing-song nights. When I walk home on my own. That\'s all.'),
    tm(S, '...Sometimes. I don\'t know how to change it.'),
    tm(Q, 'I wonder what it would be like. That\'s not minding, is it? That\'s wondering.'),
    tm(D, 'In winter. When the snow comes and it\'s just me and the clock.'),
    tm(Wt, 'Only when I tell a good joke and nobody\'s there to hear it.'),
    tm(P, 'Mind? No. ...A little. Don\'t make me say it twice.'),
    tm(Gl, 'Yes. I mind. There. Happy?'),
  ]);
  L('family.single.wonder', null, [
    FB('Every day. And then I put the kettle on.', 'Sometimes. It\'s a nice place to visit. I couldn\'t live there.'),
    tm(C, 'Oh, sometimes! But then I\'d never have had all the fun I\'ve had!'),
    tm(O, 'What\'s the use of wondering? It\'s done. ...Yes. I do.'),
    tm(S, '...Every time I see them. Even now.'),
    tm(Q, 'All the time! Would we have had children? What would they be like? Endless.'),
    tm(D, 'In the other life we\'re by the sea, I think. I hope that one\'s happy.'),
    tm(Wt, 'I wonder what I\'d have done with the spare chair.'),
    tm(P, 'I do not dwell. ...Often.'),
    tm(Gl, 'Every night. That\'s the trouble.'),
  ]);
  L('family.single.stays', null, [
    FB('...It does. You\'re right. It stays.', 'Thank you. I don\'t talk about that. Ever.'),
    tm(C, 'It does! Like a good song. You hum it forever.'),
    tm(O, '...Hmph. Well. Yes. Don\'t tell anyone I went soft.'),
    tm(S, '...Thank you for not laughing.'),
    tm(Q, 'Does it? Even for wizards? It must. ...Thank you.'),
    tm(D, 'Like a pressed flower in a book. Yes. Exactly like that.'),
    tm(Wt, 'Loved well, once. I\'ll have that carved on my door.'),
    tm(P, 'I did love well. Very well. I\'m glad someone knows.'),
    tm(Gl, '...Maybe. Maybe that\'s enough.'),
  ]);
  L('family.single.match', null, [
    FB('Ha! Heaven help us. And whoever you picked.', 'Don\'t you dare. I know what you\'re like.'),
    tm(C, 'Ha! Yes! Do it! Pick someone tall!'),
    tm(O, 'If you so much as mention me to anyone I\'ll set the geese on you.'),
    tm(S, 'Oh no. Oh, please don\'t.'),
    tm(Q, 'How would you choose? What would you look for? Can I see the list?'),
    tm(D, 'A wizard\'s match. Like a fairy story. ...No. Don\'t.'),
    tm(Wt, 'You\'d pair me with a troll and say it was for my own good.'),
    tm(P, 'They\'d have to be very special. You\'d struggle.'),
    tm(Gl, 'Don\'t waste your magic on me.'),
  ]);
  L('family.single.seat', null, [
    FB('...All right. Save me one by the fire.', 'You will? Well. I might come, then.'),
    tm(C, 'Yes! I\'ll come! I\'ll sing the loud bit!'),
    tm(O, 'Hmph. By the fire, mind. Not by the door. Drafty.'),
    tm(S, '...By the wall. If it\'s quiet. Thank you.'),
    tm(Q, 'Will there be anyone new? I\'ll come and see.'),
    tm(D, 'I\'ll come. It\'s been a long time since I sang with anyone.'),
    tm(Wt, 'Save me a seat and a pint. I\'ll pay you back in harmony.'),
    tm(P, 'I\'ll come. I have quite a good voice, you know.'),
    tm(Gl, 'You\'ll forget. ...Don\'t forget.'),
  ]);

  // =====================================================================================
  // Their turn: how does one ask? (a sweetheart wants to propose)
  // =====================================================================================
  addThread({
    id: 'family.propose', theirs: true, label: 'How does one ask?', cool: 4, ask: 'family.propose.ask',
    when: (F) => !!F.sweetheart && F.met && F.fond > 0.05,
    beats: {
      start: { line: 'family.propose.q', go: [
        { ap: 'advise', say: 'Under the party tree, with flowers. The old ways are old for a reason.', to: 'tree' },
        { ap: 'jest', say: 'On one knee. Mind the mud.', to: 'knee' },
        { ap: 'ask', say: 'Do you think {sweetheart} will say yes?', to: 'yes' },
      ] },
      tree: { line: 'family.propose.tree', go: [
        { ap: 'ask', say: 'And do you think {sweetheart} will say yes?', to: 'yes' },
        { ap: 'advise', say: 'And say it plainly. Fancy words fall over.', to: 'plain' },
      ] },
      knee: { line: 'family.propose.knee', go: [
        { ap: 'advise', say: 'Seriously, though: the party tree, with flowers.', to: 'tree' },
        { ap: 'ask', say: 'Do you think {sweetheart} will say yes?', to: 'yes' },
      ] },
      yes: { line: 'family.propose.yes', go: [
        { ap: 'comfort', say: 'I\'ve seen how {sweetheart} looks at you. I\'d not worry.', to: 'calm' },
        { ap: 'warm', say: 'Shall I put in a good word first? Just to warm the ground.', to: 'word' },
        { ap: 'advise', say: 'Say it plainly. Fancy words fall over.', to: 'plain' },
      ] },
      plain: { line: 'family.propose.plain', fx: { respect: 0.03 }, go: [
        { ap: 'warm', say: 'There. That\'s all it needs.', to: 'end', fx: { run: love('sweetheart', 0.06) } },
        { ap: 'jest', say: 'Lovely. Now say it without looking at your feet.', to: 'end' },
      ] },
      calm: { line: 'family.propose.calm', fx: { trust: 0.03, run: love('sweetheart', 0.04) }, end: true },
      word: { line: 'family.propose.word', fx: { promise: { k: 'family.proposeword', t: 'You said you\'d warm the ground with {sweetheart}', days: 3 }, run: love('sweetheart', 0.08) }, end: true },
    },
    end: { fond: 0.03, trust: 0.02 },
  });
  L('family.propose.ask', SW, [FB('{Name} has something to ask you, and has gone pink.'), G('{Name} draws you aside, glancing about for {sweetheart}.', '{Name} clears {their} throat three times.')]);
  L('family.propose.q', SW, [
    FB('Wizard... how does one ask? To wed, I mean. Is there a way?', 'Can I ask you something? It\'s about... asking.'),
    G('I want to ask {sweetheart}. To wed. Under the party tree. How do I... how does one start?', 'You\'ve seen a lot of weddings. How do folk ask? I\'ve never asked anything that mattered.'),
    tm(C, 'I\'m going to ask {sweetheart} to marry me! I think! How do I do it? Help!'),
    tm(O, 'Right. You\'re wise, they say. How does one ask someone to marry? Plainly. No fuss.'),
    tm(S, '...Wizard, I... I want to ask {sweetheart} something. I don\'t know how. I can\'t even ask for salt.'),
    tm(Q, 'Is there a proper way to propose? A form of words? Has anyone written it down?'),
    tm(D, 'I want to ask {sweetheart} to marry me. I want it to be... like a song. How?'),
    tm(Wt, 'I\'ve got a joke for every occasion except this one. How does one propose without being funny?'),
    tm(P, 'I\'ve decided to propose to {sweetheart}. Naturally I\'ll do it well. But... how, exactly?'),
    tm(Gl, 'I want to ask {sweetheart}. But what if {sThey} says no? How do you even begin?'),
  ]);
  L('family.propose.tree', SW, [
    FB('The party tree. With flowers. ...Yes. That feels right.', 'Old ways. Yes. My granddad asked my gran there.'),
    G('Under the party tree, with flowers. {Sweetheart} loves cornflowers. I\'ll find cornflowers.'),
    tm(C, 'The party tree! Of course! With lanterns! And maybe a cake!'),
    tm(O, 'The party tree. Fine. Not too many flowers. I\'ll look a fool.'),
    tm(S, '...Under the tree. With nobody watching. Yes. I could do that.'),
    tm(Q, 'Why the party tree? Who started that? Was it the Old Took? It was, wasn\'t it.'),
    tm(D, 'At dusk, under the tree. With the leaves moving. Oh, yes.'),
    tm(Wt, 'The party tree. Good. If {sweetheart} says no I can climb it and hide.'),
    tm(P, 'The party tree. Very proper. Very fitting.'),
    tm(Gl, 'The tree\'s seen a lot of yeses. I hope it\'s not seen many noes.'),
  ]);
  L('family.propose.knee', SW, [
    FB('Ha! The mud! I\'d ruin my good trousers.', 'One knee. In the mud. Right. Noted.'),
    G('{Sweetheart} would laugh so hard {sThey}\'d forget to answer.'),
    tm(C, 'Ha! I\'d slip right over! That\'d be a story for the grandchildren!'),
    tm(O, 'Mud. Of course there\'d be mud. There\'s always mud.'),
    tm(S, '...What if I get stuck down there?'),
    tm(Q, 'Why one knee? Why not both? Is it a balance thing?'),
    tm(D, 'On one knee in the wet grass. Actually that sounds rather lovely.'),
    tm(Wt, 'On one knee, mind the mud. I\'ll have that embroidered on a cushion.'),
    tm(P, 'I shall kneel very elegantly. Mud or no mud.'),
    tm(Gl, 'And then I\'ll be muddy AND rejected.'),
  ]);
  L('family.propose.yes', SW, [
    FB('...I think so. I hope so. What if I\'ve got it wrong?', 'I don\'t know. That\'s the whole trouble.'),
    G('{Sweetheart} said once, \'when we\'re old\'. When WE\'RE old. I think about that all the time.'),
    tm(C, 'I think so! I\'m nearly sure! I\'m eighty percent sure! Seventy!'),
    tm(O, 'If {sweetheart} has any sense. ...Which I sometimes doubt, given {sThey} picked me.'),
    tm(S, '...I don\'t know. I hope. I\'m not good at knowing.'),
    tm(Q, 'How can anyone know? You\'d have to ask to find out, and then you\'ve asked!'),
    tm(D, 'In my head {sweetheart} always says yes. In my head it\'s raining petals.'),
    tm(Wt, 'I\'ve rehearsed both answers. The no is funnier. I\'d rather the yes.'),
    tm(P, 'Of course. ...Probably. I\'d be quite a catch.'),
    tm(Gl, 'No. I mean yes. I mean I don\'t know. Probably no.'),
  ]);
  L('family.propose.plain', SW, [
    FB('Plainly. Like... will you? Will you marry me? ...Like that?', 'No fancy words. Right. I\'ll say it like I mean it.'),
    G('"{Sweetheart}, will you have me?" ...Is that enough? That feels like enough.'),
    tm(C, 'Plainly! Will you marry me! Oh, that\'s easy! Why was I worried?'),
    tm(O, 'Good. I hate fancy talk. I\'ll just say it.'),
    tm(S, '...Will you... marry me. ...I said it! To you. That counts as practice.'),
    tm(Q, 'Plainly. Just the question. Of course. A question! I\'m good at questions!'),
    tm(D, 'Plain words. Like bread. Not cake. Bread is what you need every day.'),
    tm(Wt, 'No jokes. Just the question. ...Can I have one joke after?'),
    tm(P, 'Plainly and with great dignity. Yes. I\'ll manage that.'),
    tm(Gl, 'Plainly. So if it\'s no, at least it\'s a clean no.'),
  ]);
  L('family.propose.calm', SW, [
    FB('...Really? You\'ve seen? ...Oh. All right. Oh.', 'You think so? Then I\'ll ask. Before I think better of it.'),
    G('How {sweetheart} looks at me? Oh, wizard. I\'m going to go and find {sweetheart} right now.'),
    tm(C, 'Then I\'ll ask! Tonight! Under the tree! Will you come? Hide behind it?'),
    tm(O, 'Hmph. Well. If you\'ve seen. You\'ve got eyes, I\'ll grant you.'),
    tm(S, '...Thank you. I think I can do it now.'),
    tm(Q, 'How does {sweetheart} look at me? Describe it. Exactly. Please.'),
    tm(D, 'Then it\'s real. If someone else has seen it, it\'s real.'),
    tm(Wt, 'Looks at me like what? A pie? Pies are well loved. I\'ll take that.'),
    tm(P, 'Naturally {sweetheart} looks at me. I\'m very lookable.'),
    tm(Gl, '...All right. I\'ll believe you. Just this once.'),
  ]);
  L('family.propose.word', SW, [
    FB('Would you? Just to make sure? Oh, you\'re a treasure.', 'Warm the ground. Yes. Like planting.'),
    G('Just mention me to {sweetheart}. Kindly. Then I\'ll do the rest.'),
    tm(C, 'Yes please! Tell {sweetheart} how wonderful I am! Wait, don\'t overdo it!'),
    tm(O, 'Fine. Lightly. Don\'t go making speeches.'),
    tm(S, '...Please. Just a little.'),
    tm(Q, 'What will you say? Will you tell me after? Exactly what {sweetheart} said back?'),
    tm(D, 'Warm the ground. And then I\'ll plant the question. Yes.'),
    tm(Wt, 'Warm the ground, then I\'ll put my foot in it. Perfect plan.'),
    tm(P, 'I hardly need it. But it can\'t hurt.'),
    tm(Gl, 'Please. I\'ll need all the help I can get.'),
  ]);
});
