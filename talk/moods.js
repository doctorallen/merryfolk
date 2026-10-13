'use strict';
// ---------------------------------------------------------------------------
// Reading the mood, part one: the facts every mood pack reads (who they're
// missing, what they fear or fret about, who they're sweet on, what they're
// proud of, what's eating them), more ways into someone cross, and grief:
// someone gone over the hills on a last adventure. When a hobbit is in one
// of these states the wizard first chooses how to come at it, and the
// approach, their temper, what he knows and a little luck give a better or
// worse outcome, each of which goes on for a beat or three.
// ---------------------------------------------------------------------------

talkPack('moods', () => {
  // --- the kit (each mood pack has its own copy, as they load in any order) ---
  const COND = { elder: { stage: 'elder' }, child: { stage: 'child' }, rift: { rift: true }, plain: { register: 'plain' }, fine: { register: 'fine' } };
  const L = (key, base, by, more) => lines(key, [{ text: base }].concat(Object.keys(by || {}).map((k) => ({ if: COND[k] || { temper: k }, text: by[k] })), more || []));
  const fresh = (F, id) => { const b = (Game.wizBond || {})[F.id]; return !(b && ((b.seen && b.seen[id] === Game.day) || (b.sore && b.sore[id] > Game.day))); };
  const ladder = (ap, cell) => { const sit = { aps: { [ap]: cell } }; const r = (T) => rungFor(sit, ap, T); return [{ to: cell.out[2], need: { when: (F, T) => r(T) >= 2 } }, { to: cell.out[1], need: { when: (F, T) => r(T) === 1 } }, cell.out[0]]; };
  const has = (x) => !!x;

  // --- facts ------------------------------------------------------------------
  const sexed = (a, f, m, n) => (!a || !a.genes ? n : a.genes.sex === 'f' ? f : m);
  const kinWord = (v, a) => {
    if (v.parents.includes(a.id)) return sexed(a, 'mum', 'dad', 'mum');
    if (v.spouse === a.id || a.spouse === v.id) return sexed(a, 'wife', 'husband', 'wife');
    if (a.parents && a.parents.includes(v.id)) return sexed(a, 'daughter', 'son', 'son');
    if (v.parents.some((p) => { const pp = person(p); return pp && pp.parents && pp.parents.includes(a.id); })) return sexed(a, 'gran', 'grandad', 'gran');
    if (v.parents.length && a.parents && a.parents.some((p) => v.parents.includes(p))) return sexed(a, 'sister', 'brother', 'brother');
    return 'friend';
  };
  const near = (v, o) => o && Game.villagers.includes(o) && !o.leaving && o !== v;
  addFacts((v, F, T) => {
    const now = Game.time, ms = (v.moodlets || []).filter((m) => m.until > now);
    const mood = (k) => ms.find((m) => m.k === k) || null;
    const d = v.drives || {}, un = d.unease || 0, brave = v.genes.bravery ?? 0.5, rift = !!(v.isRiftborn && v.isRiftborn());
    // grief: someone gone over the hills
    const miss = mood('missed'), rem = mood('remembered'), gname = miss ? miss.x : rem ? rem.x : null;
    const gone = gname ? Object.values(Game.archive || {}).filter((a) => a.first === gname && a.id !== v.id).sort((a, b) => (b.left || 0) - (a.left || 0))[0] || null : null;
    F.moodGrief = gname || null;
    F.moodGriefFresh = !!miss;
    F.moodGriefRel = gname ? (gone ? kinWord(v, gone) : 'friend') : null;
    F.moodGriefJob = gone && gone.job && JOBS[gone.job] ? JOBS[gone.job].label.toLowerCase() : null;
    F.moodGriefKnew = !!(gone && Game.wizBond && Game.wizBond[gone.id] && Game.wizBond[gone.id].talks > 0);
    const hl = gone ? (v.heirlooms || []).find((h) => h.from === gone.id) : null;
    F.moodKeepsake = hl ? hl.name.replace(/^[^']*'s /, '') : null;
    F.moodGoneThey = gname ? sexed(gone, 'she', 'he', 'they') : null;
    F.moodGoneThem = gname ? sexed(gone, 'her', 'him', 'them') : null;
    F.moodGoneTheir = gname ? sexed(gone, 'her', 'his', 'their') : null;
    // worry and fright
    const kids = Game.villagers.filter((o) => o.parents && o.parents.includes(v.id));
    const sickKid = kids.find((o) => o.isSick() || (o.illness && now < o.illness.until)) || null;
    const z = typeof hazard === 'function' ? hazard() : null;
    const rifts = !!(World.rifts && World.rifts.length) && !rift && (v.tech || 0) < 0.5;
    const riftNear = rifts && World.rifts.some((r) => Math.abs(r.x - v.x) < 240 && Math.abs(r.y - v.y) < 240);
    F.moodWorryKid = sickKid ? sickKid.first : null;
    F.moodHazard = z && HAZARDS[z.k] ? z.k : null;
    F.moodHazardOn = !!(z && z.state === 'on');
    F.moodRifts = rifts;
    F.moodWorry = sickKid ? 'kid' : z && z.state !== 'on' && (un > 0.12 || brave < 0.4) ? 'hazard' : mood('larder_bare') ? 'larder' : mood('hard_times') ? 'hard'
      : rifts && un > 0.4 ? 'rifts' : (typeof sickAbout === 'function' && sickAbout() >= 3 && un > 0.3) ? 'sickness' : un > 0.5 || mood('unsettled') ? 'unsettled' : null;
    F.moodWorryWord = { kid: `${F.moodWorryKid} being poorly`, hazard: z && HAZARDS[z.k] ? `the ${HAZARDS[z.k].word.toLowerCase()} coming` : 'the weather', larder: 'the bare shelves', hard: 'hard times', rifts: 'the tears in the sky', sickness: 'the sickness going round', unsettled: 'something in the air' }[F.moodWorry] || null;
    F.moodFright = z && z.state === 'on' && (un > 0.25 || brave < 0.35) ? z.k : riftNear && (un > 0.3 || brave < 0.35) ? 'rift'
      : !v.inside && Game.darkness > 0.45 && (v.isChild() || brave < 0.3) ? 'dark' : null;
    // homesick: the rift-born, a stranger with no kin here, or someone dreaming of Bree
    const kinHere = Game.villagers.some((o) => o !== v && (v.parents.includes(o.id) || (o.parents && o.parents.includes(v.id)) || o.id === v.spouse || (v.parents.length && o.parents && o.parents.some((p) => v.parents.includes(p)))));
    F.moodHomesick = rift && (v.lost || 0) > 0.35 ? 'rift' : v.newcomer && !rift && !kinHere ? 'road' : mood('leaving_thoughts') ? 'bree' : null;
    F.moodHomeThing = v.arc && v.arc.home ? v.arc.home : null;
    F.moodOldHome = F.moodHomesick === 'road' || F.moodHomesick === 'bree' ? ['Bywater', 'Tuckborough', 'the Marish', 'Michel Delving', 'Frogmorton', 'Little Delving', 'Stock', 'Whitfurrows'][Math.floor(hash2(v.id, 41) * 8)] : null;
    F.moodHomesickWhat = F.moodHomesick === 'rift' ? `${v.first} misses the city more than ${v.pron.they} lets on` : F.moodHomesick === 'road' ? `${v.first} misses ${F.moodOldHome}, and the folk back there` : F.moodHomesick === 'bree' ? `${v.first} keeps thinking of moving to Bree` : null;
    F.moodArcKnown = Game.riftPlay && Game.riftPlay.known && Game.riftPlay.known[v.id] ? Object.keys(Game.riftPlay.known[v.id]) : [];
    // smitten
    const sw = v.sweetheart != null && v.spouse == null ? personById(v.sweetheart) : null;
    let crush = null, cl = 0.45;
    if (!sw && v.spouse == null && v.isGrown()) for (const id in v.love || {}) { const o = personById(+id); if (near(v, o) && v.love[id] > cl && o.spouse == null) { cl = v.love[id]; crush = o; } }
    const wed = mood('wedding'), spo = v.spouse != null ? personById(v.spouse) : null;
    F.moodSmit = sw ? sw.first : crush ? crush.first : wed && spo ? spo.first : null;
    const smo = sw || crush || (wed && spo) || null;
    F.moodSmitThey = smo ? smo.pron.they : null;
    F.moodSmitThem = smo ? smo.pron.them : null;
    F.moodSmitTheir = smo ? smo.pron.their : null;
    F.moodSmitId = smo ? smo.id : null;
    F.moodSmitHow = sw ? 'sweet' : crush ? 'crush' : wed && spo ? 'wed' : null;
    // proud
    const mp = v.masterpiece ? (Game.masterpieces || []).find((m) => m.by === v.id && Game.day - m.day <= 3) : null;
    const won = mood('won'), crown = mood('crowned'), built = mood('proud_work'), grad = mood('graduated'), appr = mood('apprenticed'), skill = mood('skill_up'), piece = mood('made_piece');
    F.moodProud = mp ? 'master' : crown ? 'crowned' : won ? 'won' : grad ? 'graduated' : built ? 'built' : appr ? 'apprenticed' : skill ? 'skill' : piece && (v.mood() > 0.5) ? 'piece' : null;
    F.moodProudWhat = mp ? mp.name : crown ? crown.x : won ? won.x : built ? built.x : appr ? appr.x : skill ? skill.x : piece ? piece.x : null;
    F.moodProudThing = mp ? mp.thing : won ? ((Object.values(CONTESTS).find((c) => c[0] === won.x) || [])[1] || null) : null;
    // merry
    F.moodMerry = v.isTipsy() ? 'tipsy' : Game.party && Game.party.on && F.mood === 'merry' ? 'party' : (mood('feast_dined') || mood('feasted')) && F.mood === 'merry' ? 'feast'
      : (mood('holiday') || mood('festival') || mood('birthday')) && F.mood === 'merry' ? (mood('birthday') ? 'birthday' : 'holiday') : null;
    // at work (what they were doing when he stopped them)
    const was = (T && T.was) || (T && T.v === v && typeof Upb !== 'undefined' ? Upb.was : null);
    const wa = was && ACTIONS[was];
    F.moodWork = wa && wa.job && v.job && Game.hour >= 7 && Game.hour < 19 ? v.job : null;
    F.moodWorkDoing = F.moodWork && wa.label ? wa.label.charAt(0).toLowerCase() + wa.label.slice(1) : null;
    // newcomers, sulks, illness
    F.moodNewcomer = v.newcomer ? Math.max(0, Game.day - (v.newcomer.day || Game.day)) : null;
    F.moodRough = !!(v.newcomer && (v.newcomer.rough || 0) > 0);
    F.moodSulk = v.tantrum && now < v.tantrum.until ? 'tantrum' : v.sulk && now < v.sulk.until ? v.sulk.k : null;
    F.moodIll = typeof hasFlu === 'function' && hasFlu(v) ? 'flu' : typeof sprained === 'function' && sprained(v) ? 'sprain' : v.isSick() ? (v.chem.toxin > 0.35 ? 'queasy' : 'cold') : null;
    // envy: a prickly feeling about someone, or a rival who's just won
    let env = null;
    if (v.sent) for (const id in v.sent) { for (const s of v.sent[id]) if (s.until > now && (s.tag === 'jealous' || s.tag === 'prickly')) { const o = personById(+id); if (near(v, o)) { env = { o, why: s.why }; break; } } if (env) break; }
    const riv = typeof rivalOf === 'function' ? rivalOf(v) : null;
    if (!env && near(v, riv)) { const w = (riv.moodlets || []).find((m) => m.k === 'won' && m.until > now); if (w) env = { o: riv, why: `winning ${w.x}` }; }
    F.moodEnvy = env ? env.o.first : null;
    F.moodEnvyWhy = env ? env.why : null;
    // hunger, loneliness, and the friend they'd do well to see
    F.moodStarving = (d.hunger || 0) > 0.8;
    F.moodLonely = (d.lonely || 0) > 0.7;
    let pal = null, pr = 0.35;
    for (const id in v.rel) { const o = personById(+id); if (near(v, o) && o.stage !== 'baby' && o.id !== v.spouse && v.rel[id] > pr) { pr = v.rel[id]; pal = o; } }
    F.moodPal = pal ? pal.first : null;
    // someone friendly to be introduced to: the most sociable grown-up about, changing day by day
    let greet = null, gs = -1;
    for (const o of Game.villagers) { if (!near(v, o) || !o.isGrown() || o.newcomer || o.id === (pal && pal.id)) continue; const s = o.genes.sociability + hash2(o.id + Game.day * 7, 3) * 0.4; if (s > gs) { gs = s; greet = o; } }
    F.moodGreeter = greet ? greet.first : null;
    F.moodGreeterId = greet ? greet.id : null;
    F.moodPalId = pal ? pal.id : null;
  });

  // a whisper_visit to whoever's named, of the given kind
  const visit = (key, kind) => (T) => { const o = personById(T.F[key]); return o ? { to: o, kind } : null; };

  // --- Someone cross: more ways in, and every outcome goes on -----------------
  const extendCross = () => {
    const cs = SITUATIONS.cross, th = THREADS['sit.cross'];
    if (!cs || !th || cs.moodExtended) return;
    cs.moodExtended = true;
    const read = cs.read;
    cs.read = (F) => read(F) && fresh(F, 'sit.cross');
    cs.aps.warm = { base: 1, out: ['mc.cold', 'pat', 'mc.warmed'] };
    cs.aps.share = { base: 0, out: ['mc.notyou', 'mc.swapped', 'mc.kindred'], know: (F) => !!F.rival };
    const B = th.beats, on = (k, go) => { if (B[k]) { B[k].go = go; delete B[k].end; } };
    on('stony', [{ ap: 'listen', say: '*You keep waiting. Wizards are good at waiting.*', label: 'Keep waiting', to: 'vents' }, { ap: 'warm', say: 'mood.cross.w.leave', to: 'mc.leave' }]);
    on('softens', [{ ap: 'ask', say: 'And what did they say, exactly?', to: 'doubt' }, { ap: 'advise', say: 'Then go and tell them so. Today.', to: 'goes' }, { ap: 'warm', say: 'mood.cross.w.leave', to: 'mc.leave' }]);
    on('business', [{ ap: 'warm', say: 'Fair enough. I\'ll not pry.', to: 'mc.leave' }, { ap: 'jest', say: 'Then I\'ll mind it for you. I\'m very good at minding.', to: 'grudging' }]);
    on('bristles', [{ ap: 'warm', say: 'I\'m sorry. That was clumsy of me.', to: 'mc.sorry' }, { ap: 'listen', say: '*You say nothing more, and wait.*', label: 'Say nothing more', to: 'stony' }]);
    on('grudging', [{ ap: 'jest', say: 'mood.cross.w.again', label: 'Push your luck', to: 'laughs' }, { ap: 'ask', say: 'Want to tell me about it?', to: 'vents' }]);
    on('laughs', [{ ap: 'advise', say: 'Now go and laugh about it with them.', to: 'goes' }, { ap: 'warm', say: 'mood.cross.w.leave', to: 'mc.leave' }]);
    on('think', [{ ap: 'warm', say: 'That\'s all I ask.', to: 'mc.leave' }, { ap: 'ask', say: 'What\'s stopping you?', to: 'mc.stopping' }]);
    on('fuss', [{ ap: 'listen', say: '*You fold your hands and say nothing.*', label: 'Fold your hands and wait', to: 'stony' }, { ap: 'jest', say: 'I wouldn\'t dream of fussing. I\'m a wizard. We loom.', to: 'grudging' }]);
    on('pat', [{ ap: 'ask', say: 'What happened?', to: 'vents' }, { ap: 'warm', say: 'mood.cross.w.leave', to: 'mc.leave' }]);
    on('thanks', [{ ap: 'advise', say: 'Go and settle it, then, while you\'re soft.', to: 'goes' }, { ap: 'ask', say: 'What started it?', to: 'vents' }]);
    Object.assign(B, {
      'mc.leave': { line: 'mood.cross.leave', fx: { fond: 0.02, respect: 0.01 }, end: true },
      'mc.sorry': { line: 'mood.cross.sorry', fx: { fond: 0.02 }, go: [{ ap: 'ask', say: 'Will you tell me what\'s wrong?', to: 'vents' }, { ap: 'warm', say: 'mood.cross.w.leave', to: 'mc.leave' }] },
      'mc.stopping': { line: 'mood.cross.stopping', fx: { learn: ['trouble', 'too proud to say sorry first'] }, go: [{ ap: 'advise', say: 'Then don\'t say sorry. Just take them a pie.', to: 'goes' }, { ap: 'warm', say: 'Pride\'s a cold supper, {name}.', to: 'mc.leave' }] },
      'mc.cold': { line: 'mood.cross.cold', fx: { fond: -0.01 }, go: [{ ap: 'listen', say: '*You let the silence sit.*', label: 'Let the silence sit', to: 'stony' }, { ap: 'jest', say: 'mood.cross.w.again', label: 'Try a joke', to: 'grudging' }] },
      'mc.warmed': { line: 'mood.cross.warmed', fx: { fond: 0.03, open: 1 }, go: [{ ap: 'ask', say: 'What\'s happened, then?', to: 'vents' }, { ap: 'advise', say: 'Whatever it is, sleep on it before you say any more.', to: 'think' }] },
      'mc.notyou': { line: 'mood.cross.notyou', fx: { fond: -0.02 }, go: [{ ap: 'listen', say: '*You close your mouth, and listen.*', label: 'Close your mouth and listen', to: 'vents' }, { ap: 'warm', say: 'You\'re right. Go on.', to: 'vents' }] },
      'mc.swapped': { line: 'mood.cross.swapped', fx: { trust: 0.02 }, go: [{ ap: 'ask', say: 'So who\'s your dwarf, then?', to: 'vents' }, { ap: 'jest', say: 'I won, in the end. I outlived his beard.', to: 'laughs' }] },
      'mc.kindred': { line: 'mood.cross.kindred', fx: { trust: 0.04, open: 1 }, go: [{ ap: 'advise', say: 'Go and make it up. It took me forty years. Don\'t do that.', to: 'goes' }, { ap: 'ask', say: 'Were they right? Even a little?', to: 'doubt' }] },
    });
  };
  if (TalkPacks.loaded.has('core')) extendCross(); else loadTalkPack('core').then(extendCross);

  lines('sit.cross.warm', [{ text: ['I\'m on your side, {name}, whatever it is.', 'Whoever it is, they\'re a fool. Sit with me.'] }, { if: { fond: { min: 0.3 } }, text: ['Come on, old friend. Out with it, or don\'t. I\'m here.'] }]);
  lines('sit.cross.share', [{ text: ['I fell out with a dwarf once. It lasted a hundred years.', 'I lost my temper at a bridge-troll once. He deserved it.'] }]);
  lines('sit.cross.listen', [{ if: { stage: 'elder' }, text: ['*You lean on the gate beside them, and wait.*'] }, { if: { weather: 'rain' }, text: ['*You stand with them in the drizzle, and wait.*'] }]);
  lines('sit.cross.ask', [{ if: { feeling: 'quarrel', feelingX: has }, pri: 1, text: ['What\'s {feelingX} done now?', 'Is it {feelingX}?'] }, { if: { rival: has }, text: ['Is this about {rival}?'] }]);
  lines('sit.cross.jest', [{ text: ['Who stole your second breakfast?', 'You\'ve a face like a slapped haddock, {name}.'] }, { if: { stage: 'child' }, text: ['Who put a frog in your boot?'] }]);
  lines('sit.cross.advise', [{ text: ['Never go to bed on a quarrel, {name}.', 'Whatever it is, it\'ll look smaller after tea.'] }]);
  lines('sit.cross.comfort', [{ text: ['Oh, {name}. What\'s happened?'] }, { if: { stage: 'child' }, text: ['Come here. Who\'s upset you?'] }]);
  L('mood.cross.w.leave', ['I\'ll leave you be. I\'m about, if you want me.', 'I\'ll not keep you. Come and find me when you\'re ready.', 'Go gently, {name}. It\'ll keep.'], { child: ['Go on, then. And no kicking the hens.'] });
  L('mood.cross.w.again', ['A very wet cat. In a very good bonnet.', 'I\'ve seen happier faces on a gargoyle. I\'ve met gargoyles.', 'If you frown any harder your eyebrows will meet in the middle.'], { child: ['If the wind changes, you\'ll stay like that.'] });

  // more ways the core's cross beats can go
  L('cross.stony', ['*stares at the hedge as if it owes them money*', '*folds both arms, very tight*', 'Hmph.'], {
    ornery: ['*grinds their teeth, and says nothing*', 'I\'ve nothing to say. Nothing at all.'], shy: ['*looks at their feet*', '*opens their mouth, then shuts it again*'], proud: ['*lifts their chin and looks straight past you*'],
    gloomy: ['*sighs, a long sigh, and nothing else*'], child: ['*kicks a stone, hard*', 'Not TALKING.'], elder: ['*sucks on an empty pipe, very hard*'],
  });
  L('cross.vents', ['They said I don\'t pull my weight. ME. I\'ve pulled my weight since before they could lift a spoon.'], {
    ornery: ['Do you know what was said to me? In my own lane? I\'ll tell you what was said to me.', 'Forty years I\'ve put up with it. Forty. Today I said so.'],
    proud: ['I was spoken to as if I were a child. In front of people. I will not be spoken to so.', 'They questioned my work. Mine! Nobody questions my work.'],
    cheerful: ['Oh, it\'s daft really. But it got under my skin and now it won\'t come out.', 'I\'m never cross. I\'m cross now. That\'s how bad it is.'],
    shy: ['...Someone shouted at me. I didn\'t know what to say. I still don\'t.', 'I said something back. I\'ve never said something back before.'],
    gloomy: ['Nobody listens. Nobody ever listens. So I stopped being nice about it.', 'Same as always. Somebody had a go, and I was in the way.'],
    witty: ['I had a clever answer. I thought of it on the way home. That\'s the trouble.', 'Words were had. Mine were better, but theirs were louder.'],
    child: ['They said I CHEATED. I didn\'t cheat. Not much.', 'Nobody let me have a turn. Not ONE turn.'], elder: ['When I was young we respected our elders. I\'m the elder now. Where\'s my respect?'],
  }, [{ if: { spouse: has }, text: ['{Spouse} and I had words. About the washing. It\'s never about the washing.'] }]);
  L('cross.softens', ['...It\'s just been a long week. That\'s all it is.'], {
    ornery: ['...Well. Maybe I was a bit sharp. A bit. Don\'t write it down.'], shy: ['...Thank you for waiting. People don\'t, usually.'],
    proud: ['I may have been somewhat hasty. Somewhat.'], cheerful: ['Oh, look at me, in a state over nothing. Thank you, wizard.'], child: ['...I\'m not cross any more. Mostly.'],
  });
  L('cross.business', ['I\'d rather not say, thank you.'], { ornery: ['Mind your own beeswax, wizard.', 'Not your concern. Not your village.'], proud: ['That is a private matter.'], child: ['NOTHING happened.'], shy: ['...It\'s nothing. Please.'] });
  L('cross.doubt', ['...They might have had half a point. Half.'], { ornery: ['Right? Oh, I don\'t know. Maybe a corner of right. A small corner.'], proud: ['I concede nothing. ...Very well. A little.'], gloomy: ['They\'re usually right. That\'s what makes it worse.'], child: ['...Maybe I did cheat. A tiny bit.'] });
  L('cross.bristles', ['Don\'t you laugh at me.'], { ornery: ['Oh, that\'s funny, is it? Go and be funny somewhere else.', 'I\'ll thank you to keep your jokes in your hat.'], proud: ['I do not care to be made fun of.'], gloomy: ['Course. Everyone thinks it\'s funny.'], shy: ['...Oh.'], child: ['That\'s NOT funny!'] });
  L('cross.grudging', ['...Hm. It is a bit, isn\'t it.'], { ornery: ['Hmph. ...Bonnet. Hmph.'], witty: ['That\'s nearly funny. Don\'t let it go to your head.'], child: ['...A bit funny.'] });
  L('cross.laughs', ['Ha! ...Oh, don\'t. I\'m meant to be cross.'], { ornery: ['Ha! Stop it. I\'m cross. I\'m very... ha.'], witty: ['Ha! Fine. You win this one.'], gloomy: ['Ha. ...Ha. I\'d forgotten I could do that.'], child: ['AHAHA! Do it again!'] });
  L('cross.think', ['Maybe. Let me sleep on it.'], { ornery: ['I said I\'ll think about it. Thinking is not agreeing.'], proud: ['I shall give it due consideration.'] });
  L('cross.goes', ['All right. All right! I\'ll go. Stop looking at me like that.'], { ornery: ['Fine. I\'ll go. But I\'m not saying sorry. I\'m saying... something else.'], shy: ['...Will you watch? From a distance? ...All right.'], proud: ['I shall go, and be gracious about it. Very gracious.'], child: ['FINE. I\'ll go and say sorry. Then can I have a biscuit?'] });
  L('cross.fuss', ['I don\'t need fussing.'], { ornery: ['Hands off. I\'m not a lost lamb.'], proud: ['I\'m quite capable of being cross on my own, thank you.'] });
  L('cross.pat', ['...Hm. That\'s... all right, then.'], { shy: ['...Oh. Thank you.'], gloomy: ['...That helps, a bit. Don\'t tell anyone.'] });
  L('cross.thanks', ['I\'ll be all right. It was just... a lot.'], { cheerful: ['There. Cross over. Thank you, wizard.'], gloomy: ['You\'re kind. I\'d not been expecting kind.'] });
  L('mood.cross.leave', ['...Thank you. For not making a fuss.', 'Aye. Later, perhaps.', 'I\'ll be better tomorrow. Probably.'], {
    ornery: ['Good. Off you go. ...Thanks.', 'Hmph. You\'re less annoying than most.'], shy: ['...Thank you. Really.'], proud: ['I appreciate your discretion, wizard.'], child: ['Okay. Bye. ...Sorry I was grumpy.'], cheerful: ['Bless you. I\'ll be my old self by supper.'],
  });
  L('mood.cross.sorry', ['...Apology accepted. Mostly.', 'Well. That\'s handsome of you.'], { ornery: ['Hmph. A wizard saying sorry. I\'ll tell my grandchildren.'], proud: ['Accepted. Graciously.'], child: ['S\'okay.'] });
  L('mood.cross.stopping', ['Saying sorry first. I can\'t. It sticks in my throat like a fishbone.'], { ornery: ['Me, go crawling? After what was said? I\'d sooner eat my hat.'], proud: ['One does not apologise first. One has standards.'], shy: ['...I wouldn\'t know what to say. I\'d go red. I\'m going red now.'] });
  L('mood.cross.cold', ['Don\'t be nice at me. I\'m not in the mood for nice.'], { ornery: ['Save it. Sweet words won\'t mend this.'], proud: ['I don\'t need cheering, thank you.'], gloomy: ['Easy to say.'] });
  L('mood.cross.warmed', ['...You\'re a good sort, wizard. All right. Since you\'re on my side.', 'Oh, don\'t be kind, I\'ll cry, and then I\'ll be cross AND soggy.'], { ornery: ['Hmph. Well. At least someone is.'], cheerful: ['Oh, that\'s nice to hear. Today of all days.'], child: ['You\'re on MY side? Really?'] });
  L('mood.cross.notyou', ['This isn\'t about you, wizard. For once.', 'I don\'t want your stories. I want to be cross.'], { ornery: ['I don\'t care about your dwarf.'], proud: ['How fascinating. Now, about MY day.'] });
  L('mood.cross.swapped', ['A hundred years? ...I suppose I can manage a week.', 'Ha. A troll. Well. Mine\'s not a troll. Nearly.'], { witty: ['A dwarf! At least mine shaves.'], curious: ['What did the dwarf do? ...No, tell me later. I\'m cross.'] });
  L('mood.cross.kindred', ['Same as me and {rival}. Forty years of it.', '...Did you ever make it up with him? Your dwarf?'], { ornery: ['Hmph. So even wizards are stubborn old goats. That\'s a comfort.'] }, [{ if: { rival: has }, text: ['That\'s me and {rival}. Exactly that. Every market day.'] }]);

  // --- Grief: someone gone on a last adventure ----------------------------------
  addSituation('grief', {
    pri: 6, thread: 'mood.grief', read: (F) => !!F.moodGrief && F.stage !== 'baby' && fresh(F, 'mood.grief'),
    aps: {
      listen: { base: 1, out: ['quiet', 'remembers', 'story'] },
      ask: { base: 1, out: ['toosoon', 'remembers', 'story'], know: (F) => F.moodGriefKnew },
      comfort: { base: 1, out: ['stiff', 'leans', 'weeps'] },
      warm: { base: 1, out: ['stiff', 'leans', 'remembers'] },
      share: { base: 0, out: ['notyou', 'shared', 'kindred'], know: (F) => F.moodGriefKnew },
      jest: { base: 0, out: ['aghast', 'smile', 'laughcry'], know: (F) => F.moodGriefKnew },
    },
  });
  const stone = ladder('advise', { base: 0, after: 'told', out: ['notready', 'maybe', 'stone'] });
  addThread({
    id: 'mood.grief', situation: true, label: (F) => (F.moodGrief ? `Missing ${F.moodGrief}` : 'Missing someone'),
    beats: {
      quiet: { line: 'mood.grief.quiet', notice: 'mood.grief.see', fx: { open: 1 }, go: [
        { ap: 'listen', say: '*You sit on in silence.*', label: 'Sit on in silence', to: 'remembers' },
        { ap: 'ask', say: 'mood.grief.w.like', to: 'story' },
        { ap: 'warm', say: 'I\'m here, {name}. As long as you like.', to: 'here' },
      ] },
      remembers: { line: 'mood.grief.remembers', fx: { flag: 'told', drive: { lonely: -0.1 } }, go: [
        { ap: 'ask', say: 'mood.grief.w.would', to: 'wouldsay' },
        { ap: 'listen', say: '*You notice what they\'re holding.*', label: 'Notice what they\'re holding', to: 'keepsake', need: { if: { moodKeepsake: has } } },
        { ap: 'advise', say: 'mood.grief.w.stone', to: stone },
      ] },
      story: { line: 'mood.grief.story', fx: { flag: 'told', feel: 'drawn_out' }, go: [
        { ap: 'jest', say: 'mood.grief.w.trouble', to: 'laughcry' },
        { ap: 'warm', say: 'I wish I\'d known {moodGoneThem} better.', to: 'wishknown' },
        { ap: 'ask', say: 'mood.grief.w.would', to: 'wouldsay' },
      ] },
      laughcry: { line: 'mood.grief.laughcry', fx: { fond: 0.03, feel: 'cheered', feelX: 'the wizard' }, go: [
        { ap: 'comfort', say: 'There. Both at once is allowed.', to: 'weeps' },
        { ap: 'warm', say: 'That\'s the way to remember {moodGoneThem}.', to: 'here' },
      ] },
      smile: { line: 'mood.grief.smile', fx: { fond: 0.01 }, go: [
        { ap: 'ask', say: 'Was {moodGoneThey} a laugher?', to: 'story' },
        { ap: 'warm', say: 'That\'s better. Just a little.', to: 'here' },
      ] },
      aghast: { line: 'mood.grief.aghast', fx: { fond: -0.04, respect: -0.02, sore: { days: 1 } }, go: [
        { ap: 'comfort', say: 'Forgive me, {name}. That was clumsy.', to: 'forgiven' },
        { ap: 'listen', say: '*You take off your hat, and hold your tongue.*', label: 'Hold your tongue', to: 'quiet' },
      ] },
      forgiven: { line: 'mood.grief.forgiven', go: [
        { ap: 'ask', say: 'mood.grief.w.like', to: 'remembers' },
        { ap: 'warm', say: 'I\'ll walk with you a while, if you\'ll have me.', to: 'here' },
      ] },
      toosoon: { line: 'mood.grief.toosoon', fx: { sore: { days: 1 } }, go: [
        { ap: 'warm', say: 'Then we\'ll not speak of it. Shall we just sit?', to: 'quiet' },
        { ap: 'comfort', say: 'Of course. Forgive me.', to: 'stiff' },
      ] },
      stiff: { line: 'mood.grief.stiff', go: [
        { ap: 'listen', say: '*You stay, and say nothing.*', label: 'Stay, and say nothing', to: 'quiet' },
        { ap: 'ask', say: 'Are you, though?', to: 'leans' },
      ] },
      leans: { line: 'mood.grief.leans', fx: { trust: 0.03, feel: 'cheered', feelX: 'the wizard' }, go: [
        { ap: 'listen', say: '*You let them lean, and listen.*', label: 'Let them lean', to: 'remembers' },
        { ap: 'advise', say: 'mood.grief.w.supper', to: 'supper', need: { if: { moodPal: has } } },
        { ap: 'warm', say: 'You\'re not on your own, {name}. Not while I\'m about.', to: 'here' },
      ] },
      weeps: { line: 'mood.grief.weeps', fx: { trust: 0.05, feel: 'drawn_out' }, go: [
        { ap: 'comfort', say: 'Let it come. My hat\'s big enough to hide us both.', to: 'here' },
        { ap: 'ask', say: 'Tell me about {moodGoneThem}, when you\'re ready.', to: 'story' },
      ] },
      notyou: { line: 'mood.grief.notyou', fx: { fond: -0.02 }, go: [
        { ap: 'listen', say: '*You nod, and say no more.*', label: 'Nod, and say no more', to: 'quiet' },
        { ap: 'warm', say: 'You\'re right. Tell me about {moodGrief}.', to: 'remembers' },
      ] },
      shared: { line: 'mood.grief.shared', fx: { trust: 0.04 }, go: [
        { ap: 'ask', say: 'What do you miss most?', to: 'missmost' },
        { ap: 'listen', say: '*You wait for them to go on.*', label: 'Wait for them', to: 'remembers' },
      ] },
      kindred: { line: 'mood.grief.kindred', fx: { trust: 0.06, fond: 0.03, confide: { k: 'mood.grief', t: '{Name} still talks to {moodGrief} when nobody\'s about' } }, go: [
        { ap: 'warm', say: 'Then keep talking to {moodGoneThem}. I\'ve a feeling it\'s heard.', to: 'here' },
        { ap: 'ask', say: 'What do you miss most?', to: 'missmost' },
      ] },
      missmost: { line: 'mood.grief.missmost', fx: { learn: ['trouble', 'misses {moodGrief}, {their} {moodGriefRel}'] }, go: [
        { ap: 'warm', say: 'Then do it anyway, for {moodGoneThem}. Now and then.', to: 'here' },
        { ap: 'advise', say: 'mood.grief.w.stone', to: stone },
      ] },
      wouldsay: { line: 'mood.grief.wouldsay', fx: { feel: 'drawn_out', remember: 'The wizard asked me what {moodGrief} would say. I knew straight off.', rv: 1 }, go: [
        { ap: 'warm', say: 'Then {moodGoneThey}\'s still about, in a way.', to: 'here' },
        { ap: 'jest', say: 'I\'d do as {moodGoneThey} says, if I were you.', to: 'end' },
      ] },
      keepsake: { line: 'mood.grief.keepsake', fx: { trust: 0.03, learn: ['keepsake', '{Name} keeps {moodGrief}\'s {moodKeepsake} close'] }, go: [
        { ap: 'warm', say: 'Keep it well. {MoodGoneThey}\'d like that.', to: 'here' },
        { ap: 'ask', say: 'Do you use it?', to: 'keepuse' },
      ] },
      keepuse: { line: 'mood.grief.keepuse', fx: { fond: 0.02 }, end: true },
      wishknown: { line: 'mood.grief.wishknown', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'Tell me one more thing about {moodGoneThem}.', to: 'missmost' },
        { ap: 'warm', say: 'Thank you for telling me.', to: 'end' },
      ] },
      here: { line: 'mood.grief.here', fx: { drive: { lonely: -0.15 }, remember: 'The wizard stayed with me a while, when I was missing {moodGrief}.', rv: 1 }, end: true },
      stone: { line: 'mood.grief.stone', fx: { respect: 0.03, queue: 'visit_stone' }, end: true },
      maybe: { line: 'mood.grief.maybe', fx: { respect: 0.01 }, end: true },
      notready: { line: 'mood.grief.notready', go: [
        { ap: 'warm', say: 'Then not yet. The stone will wait.', to: 'here' },
        { ap: 'comfort', say: 'I\'ll walk up with you, one day, if you like.', to: 'here' },
      ] },
      supper: { line: 'mood.grief.supper', fx: { respect: 0.02, queue: 'whisper_visit', queueExtra: visit('moodPalId', 'kin') }, end: true },
    },
    end: { fond: 0.02 },
  });

  lines('sit.grief.listen', [
    { text: ['*You sit down beside them, and say nothing.*', '*You take off your hat, and wait.*', '*You lean on your staff beside them, and wait.*'] },
    { if: { moodGriefFresh: false }, text: ['*You stand with them a while, looking at the hills.*'] },
    { if: { stage: 'child' }, text: ['*You crouch down, creakily, to their height, and wait.*'] },
  ]);
  lines('sit.grief.ask', [
    { text: ['Tell me about {moodGrief}.', 'What was {moodGrief} like, {name}?'] },
    { if: { moodGriefRel: ['mum', 'dad', 'gran', 'grandad', 'wife', 'husband', 'brother', 'sister'] }, text: ['Your {moodGriefRel}. Tell me about {moodGoneThem}.'] },
    { if: { moodGriefKnew: true }, text: ['I knew {moodGrief} a little. Will you tell me the rest?'] },
  ]);
  lines('sit.grief.comfort', [
    { text: ['Oh, {name}. Come here.', 'I\'m so sorry, {name}. About {moodGrief}.'] },
    { if: { stage: 'child' }, text: ['Come here, little one. Wizards give very good hugs.'] },
  ]);
  lines('sit.grief.warm', [
    { text: ['{MoodGrief} was lucky to have you, {name}.', 'You\'re not on your own, {name}. You know that.'] },
    { if: { moodGriefRel: ['wife', 'husband'] }, text: ['{MoodGrief} was lucky in you, {name}. Every day of it.'] },
  ]);
  lines('sit.grief.share', [
    { text: ['I\'ve watched a good many go over the hills, {name}. It never gets easier.', 'I lost a friend once. I still talk to him, when nobody\'s about.'] },
    { if: { moodGriefKnew: true }, text: ['I\'ll miss {moodGrief} too, you know. {MoodGoneThey} gave me a talking-to once.'] },
  ]);
  lines('sit.grief.jest', [
    { text: ['{MoodGrief} would hate all these long faces, you know.', 'I hear {moodGrief} left without paying for the last round. Typical.'] },
    { if: { moodGriefKnew: true }, text: ['{MoodGrief} still owes me a game of conkers. I shall expect it in the next world.'] },
  ]);

  L('mood.grief.w.like', ['What was {moodGrief} like?', 'Tell me about {moodGrief}. The ordinary things.'], {}, [{ if: { moodGriefRel: ['mum', 'dad', 'gran', 'grandad'] }, text: ['What was {moodGoneThey} like, your {moodGriefRel}?'] }]);
  L('mood.grief.w.would', ['What would {moodGrief} say, if {moodGoneThey} saw you now?', 'If {moodGrief} were here, what would {moodGoneThey} tell you?']);
  L('mood.grief.w.stone', ['Go up to the Green. Sit by {moodGoneTheir} stone. Tell {moodGoneThem} the news.', 'Have you been up to the stone yet? It helps, they say.']);
  L('mood.grief.w.trouble', ['{MoodGoneThey} sounds like trouble.', 'I like the sound of {moodGoneThem}. A rascal.']);
  L('mood.grief.w.supper', ['Don\'t sit alone tonight. Go and see {moodPal}.', 'Go to {moodPal}\'s for supper. Don\'t argue.']);
  L('mood.grief.see', ['Their eyes keep going to the hills, where the West Road goes over.', 'There\'s a crumpled handkerchief in one fist.'], {}, [{ if: { moodKeepsake: has }, text: ['They\'re turning {moodGrief}\'s {moodKeepsake} over and over in their hands.'] }]);

  L('mood.grief.quiet', ['*They look at the hills for a long while.* ...Thank you. For not saying anything.', '...Everyone keeps talking. You\'re the first one who hasn\'t.', '*A long breath out.* ...That\'s better. I don\'t know why, but it is.'], {
    ornery: ['...Good. I\'ve had enough talking to last me. Everyone has a saying.', '*grunts* You\'re the only one with any sense today.'],
    shy: ['*they lean, just slightly, against your arm*', '...Thank you. I didn\'t want to talk. I didn\'t want to be alone either.'],
    gloomy: ['...The quiet\'s worse at home. Here it\'s just quiet.', '*they sigh, and the sigh goes on a long time*'],
    cheerful: ['...Sorry. I keep thinking I\'ll be fine and then I\'m not.', 'I\'m usually the one who talks. Funny, that.'],
    dreamy: ['...Do you think {moodGrief} can see the same clouds?', '...I keep watching the road. Silly. {MoodGoneThey}\'s not coming back down it.'],
    proud: ['...I am perfectly all right. I just wanted some air.'], witty: ['...I\'ve nothing clever to say. First time for everything.'],
    child: ['...Is {moodGrief} coming back? Mum says no. You\'re a wizard. Is {moodGoneThey}?', '*sniffs, very hard, and wipes their nose on a sleeve*'],
    elder: ['...We came up the lane together, {moodGrief} and me. Now there\'s only me to walk it.', '*taps their pipe out on the wall, slowly*'],
  }, [{ if: { moodGriefFresh: false }, text: ['...It gets easier. That\'s what\'s hard, in a way. Easier means further away.'] }]);

  L('mood.grief.remembers', ['{MoodGrief} always sat just there, in the sun. I keep looking. Daft, isn\'t it?', 'Everything in the house is {moodGrief}\'s. The cups. The chair. The smell of the pipe.', 'I keep saving things to tell {moodGoneThem}. Then I remember.'], {
    ornery: ['{MoodGrief} was the only one who could tell me I was wrong. I never thanked {moodGoneThem} for it.', 'Stubborn old thing. Went off without so much as a by-your-leave. Like {moodGoneThey} always did.'],
    shy: ['{MoodGrief} always knew when I didn\'t want to talk. {MoodGoneThey}\'d just pass the jam.', '...{MoodGoneThey} used to hum. All day. I never told {moodGoneThem} I liked it.'],
    cheerful: ['Oh, {moodGrief} was a scream. Laughed at everything. Even the bad things. Especially those.', '{MoodGrief} made the best of every day. I\'m trying. It\'s harder without {moodGoneThem}.'],
    gloomy: ['{MoodGrief} was the cheerful one. Now there\'s no cheerful one.', 'I\'ll never hear {moodGoneThem} say my name again. That\'s the bit I can\'t get past.'],
    dreamy: ['{MoodGrief} used to say the hills went on for ever. Now {moodGoneThey}\'ll find out.', 'I dreamt of {moodGoneThem} last night. {MoodGoneThey} was laughing at something I couldn\'t see.'],
    proud: ['{MoodGrief} was the finest hobbit in this valley, and I will hear no argument.', 'I learned everything worth knowing from {moodGrief}. Everything.'],
    witty: ['{MoodGrief} had a saying for everything. Most of them rude. All of them right.', '{MoodGoneThey} once told the Steward his hat looked like a tea cosy. To his face. I miss that.'],
    curious: ['{MoodGrief} knew the name of every bird. I\'m trying to learn them, now. I keep getting the finches wrong.', 'Do you think {moodGoneThey} took the long road or the short one? {MoodGoneThey} always took the long one.'],
    child: ['{MoodGrief} let me have the crust. Nobody else lets me have the crust.', '{MoodGoneThey} told the best stories. With voices. Nobody does the voices now.'],
    elder: ['We were children together, {moodGrief} and me. Stole apples from the same tree.', 'I\'ll be going that way myself, one of these days. I hope {moodGoneThey} keeps the kettle on.'],
  }, [
    { if: { moodGriefRel: ['mum', 'dad'] }, text: ['My {moodGriefRel} used to wake me with a song. The house is so quiet in the mornings now.', 'I keep turning to ask my {moodGriefRel} things. How long to boil an egg. Silly things.'] },
    { if: { moodGriefRel: ['gran', 'grandad'] }, text: ['My {moodGriefRel} always had a toffee in one pocket. Always. I checked.', '{MoodGrief} taught me to whistle. I can\'t, very well. But {moodGoneThey} taught me.'] },
    { if: { moodGriefRel: ['wife', 'husband'] }, pri: 1, text: ['Forty years I made two cups of tea in the morning. I still do. Then I drink them both.', 'The bed\'s too big. Isn\'t that a silly thing to say? It\'s too big.'] },
    { if: { moodGriefRel: ['brother', 'sister'] }, text: ['We fought like cats, {moodGrief} and me. Every day. I\'d give anything for one more fight.'] },
    { if: { moodGriefJob: has }, text: ['Nobody\'s been a {moodGriefJob} like {moodGrief}. I walk past and expect to see {moodGoneThem} at it.'] },
    { if: { season: 'winter' }, text: ['{MoodGrief} loved the snow. Went out in it like a child. I couldn\'t look at it this morning.'] },
    { if: { season: 'spring' }, text: ['The blossom\'s out. {MoodGrief} always said the blossom was showing off. I said so to it this morning.'] },
  ]);

  L('mood.grief.story', ['Once, {moodGrief} put the Steward\'s hat on the scarecrow. For a whole week nobody noticed.', 'One midsummer {moodGrief} fell in the millpond and came up with a fish in each hand. Swore {moodGoneThey} meant it.'], {
    ornery: ['{MoodGrief} once argued with a goose for an hour. The goose gave up first. That was {moodGrief}.'],
    shy: ['...The first time I went to a party, {moodGrief} danced with me so I wouldn\'t be on my own. Badly. On purpose.'],
    cheerful: ['Oh! The time {moodGrief} made a cake so big it wouldn\'t go out of the door! We ate it in the kitchen for a week!'],
    gloomy: ['{MoodGrief} found me crying in the barn once, when I was small. Didn\'t say a word. Just sat. Like you.'],
    dreamy: ['{MoodGrief} took me up on the hill one night to count shooting stars. We got to forty. Or {moodGoneThey} said we did.'],
    proud: ['When I won my first prize, {moodGrief} told everybody. Everybody. Even the hens.'],
    witty: ['{MoodGrief} once convinced the whole Badger the cellar was haunted. It was {moodGoneThem}, with a sheet and a cold.'],
    curious: ['{MoodGrief} took every clock in the house apart once, to see. Put them back too. Mostly. One still runs backwards.'],
    child: ['{MoodGrief} let me ride on {moodGoneTheir} shoulders to see the fireworks. I could see EVERYTHING.'],
    elder: ['The year of the long winter, {moodGrief} walked to Bree and back for medicine. Never once mentioned it after.'],
  }, [{ if: { moodGriefRel: ['wife', 'husband'] }, pri: 1, text: ['On our wedding day {moodGrief} trod on my foot in the first dance and said, there, now you\'ll never forget it. I haven\'t.'] }]);

  L('mood.grief.laughcry', ['Ha! ...Ha. Oh, {moodGoneThey} would have... *the laugh breaks in the middle*', 'Ha! Yes. Yes, {moodGoneThey} was. ...Oh dear. Now look at me.'], {
    ornery: ['Ha! Trouble, {moodGoneThey} was. Pure trouble. ...Oh, blast it. Blast it.'], witty: ['Ha! You should have seen {moodGoneThem} at the Yule party. ...I\'m laughing and crying. That\'s allowed, is it?'],
    cheerful: ['Ahaha! Oh, {moodGoneThey}\'d have loved that! ...Oh. Oh, I\'m sorry. I didn\'t think I\'d...'], child: ['Hee! ...I\'m not crying. My eyes are just leaking.'],
  });
  L('mood.grief.smile', ['...Hm. {MoodGoneThey} would, wouldn\'t {moodGoneThey}.', '*the corner of their mouth twitches*'], { ornery: ['Hmph. ...Yes. {MoodGoneThey} would.'], child: ['...That\'s a bit funny.'] });
  L('mood.grief.aghast', ['How can you joke? Today?', '...That\'s not funny, wizard. Not today.'], {
    ornery: ['Is that meant to be a joke? You can keep it.', 'Have some respect, you great lanky beanpole.'], proud: ['I will not have {moodGrief} made light of. Not by anyone.'],
    shy: ['*their face crumples, and they look away*'], gloomy: ['Course. Everything\'s a joke to someone.'], child: ['That\'s MEAN.'],
  });
  L('mood.grief.forgiven', ['...It\'s all right. Everyone says the wrong thing. You\'re only the fourth today.', '...I know you meant well. Most do.'], { ornery: ['Hmph. Well. You\'re not the worst. The worst brought me a cabbage.'], child: ['...S\'okay.'] });
  L('mood.grief.toosoon', ['Not yet. Please. I can\'t, yet.', 'I don\'t want to talk about {moodGoneThem}. Not today.'], { ornery: ['I\'ll talk when I\'m ready. I\'m not ready.'], proud: ['That is not something I discuss, wizard.'], shy: ['*shakes their head, very small*'], child: ['NO. I don\'t want to.'] });
  L('mood.grief.stiff', ['I\'m fine. Really. I\'m fine.', 'I\'m all right. Folk keep asking. I\'m all right.'], {
    ornery: ['Don\'t. I don\'t need patting. I\'m not a pony.'], proud: ['There is no need. I am quite composed.'], cheerful: ['Oh, I\'m fine! Fine. Absolutely fine. ...Fine.'], gloomy: ['Kind words don\'t bring anybody back.'], child: ['I\'m not sad. I\'m BORED.'],
  });
  L('mood.grief.leans', ['*they lean into you, and stay there a while*', '...Thank you. I\'ve been holding myself up all day. I\'m tired of it.'], {
    ornery: ['...Just for a minute, mind. Then I\'ve the hens to see to.'], shy: ['*they rest their head against your sleeve, and say nothing*'], proud: ['...Perhaps for a moment. Only a moment.'],
    cheerful: ['Oh, wizard. You\'re like a big woolly tree.'], child: ['*a small hot face buries itself in your robe*'], elder: ['...Thank you, lad. Lad! You\'re older than the hills. Thank you anyway.'],
  });
  L('mood.grief.weeps', ['*and then they cry, properly, the way you can only cry once*', '...Oh. Oh, I didn\'t think I would. I haven\'t, all this time.'], {
    ornery: ['Look what you\'ve done. Look what you\'ve... *and the rest is lost in your sleeve*'], proud: ['I never cry. I never... *they do*'], shy: ['*they cry without a sound, which is somehow worse*'],
    gloomy: ['...I\'ve been waiting to do that. I didn\'t know I was waiting.'], child: ['*howls, the way small ones do, and then hiccups*'],
  });
  L('mood.grief.notyou', ['This isn\'t about you, wizard.', 'I don\'t want to hear about your friend. I want mine back.'], { ornery: ['Oh, so it\'s your grief now, is it?'], proud: ['I\'m sure that was very sad. This is about {moodGrief}.'], child: ['But I want to talk about MINE.'] });
  L('mood.grief.shared', ['...Did you? I didn\'t think wizards lost anybody. I thought you just went on.', '...Does it go away? Tell me the truth.'], {
    curious: ['What was his name? Your friend. Did he go over the hills too?'], shy: ['...Thank you for telling me. I thought it was only me.'], ornery: ['Hmph. So you\'re not made of stone after all.'], child: ['Was your friend a wizard too?'],
  });
  L('mood.grief.kindred', ['...I talk to {moodGoneThem} too. Out loud. I thought I was going daft.', '...So it\'s not daft. Talking to them. Good. Because I do. Every night.'], {
    shy: ['...I\'ve never told anyone. I tell {moodGoneThem} about my day. Every evening.'], ornery: ['...I give {moodGoneThem} a piece of my mind, most nights. Some habits don\'t stop.'],
    child: ['I tell {moodGrief} things in bed. Mum thinks I\'m saying prayers.'], elder: ['At my age half your friends are on the other side of the hills. You learn to talk to them.'],
  });
  L('mood.grief.missmost', ['The little things. The way {moodGoneThey} said good morning. Like it was news.', 'Being told off. Isn\'t that daft? I miss being told off.'], {
    cheerful: ['The laughing. The whole house used to rattle with it.'], gloomy: ['Being somebody\'s favourite. I was {moodGoneTheir} favourite. Now I\'m nobody\'s.'], dreamy: ['The way {moodGoneThey} looked at the evening. As if it were a present.'],
    child: ['The stories. And the crusts. And being picked up.'], proud: ['Being argued with by someone who knew what they were talking about.'], ornery: ['Someone to grumble at who grumbled back.'],
  });
  L('mood.grief.wouldsay', ['{MoodGoneThey}\'d say: stop moping and put the kettle on. ...So I suppose I will.', '{MoodGoneThey}\'d tell me to eat something. {MoodGoneThey} always said that. Eat something.'], {
    ornery: ['{MoodGoneThey}\'d say, what are you sat there for, you great lump? There\'s work to do.'], cheerful: ['{MoodGoneThey}\'d say, chin up, and there\'s cake in the tin. There usually was.'],
    gloomy: ['{MoodGoneThey}\'d say I was being dramatic. {MoodGoneThey}\'d be right.'], child: ['{MoodGoneThey}\'d say, wash your face, you look like a badger. ...I\'ll wash my face.'],
    proud: ['{MoodGoneThey}\'d say, hold your head up, you\'re a {surname}. So I shall.'], elder: ['{MoodGoneThey}\'d say, I\'ll see you soon enough, so don\'t you fuss. Cheek.'],
  });
  L('mood.grief.keepsake', ['{MoodGoneThey} gave me {moodGoneTheir} {moodKeepsake}, the morning {moodGoneThey} left. I carry it everywhere.', 'It\'s {moodGrief}\'s {moodKeepsake}. {MoodGoneThey} pressed it into my hand at the gate.'], {
    shy: ['...It\'s {moodGoneTheir} {moodKeepsake}. I hold it when I\'m frightened.'], child: ['It\'s {moodGrief}\'s {moodKeepsake}. It\'s MINE now. I\'m minding it.'], proud: ['{MoodGrief}\'s {moodKeepsake}. Entrusted to me. To me, of everyone.'],
  });
  L('mood.grief.keepuse', ['Every day. And every day I hear {moodGoneThem} saying, careful with that.', 'No. I just like knowing it\'s there. In my pocket. Like {moodGoneThem}.'], { child: ['I\'m not allowed. It\'s for when I\'m big. I look at it, though.'] });
  L('mood.grief.wishknown', ['You\'d have liked {moodGoneThem}. And {moodGoneThey}\'d have made you eat three helpings.', 'Everyone should have known {moodGrief}. It\'s a poorer world without.'], { ornery: ['{MoodGoneThey}\'d have called you a long streak of nothing. And then fed you.'], child: ['{MoodGoneThey}\'d have liked your hat.'] });
  L('mood.grief.here', ['...Thank you, {wiz}. I\'ll be all right. Not today. But I will.', '...That helped. I don\'t know how, but it did.'], {
    ornery: ['...Hm. Well. You\'re not the worst company.'], shy: ['...Will you come by again? Not to talk. Just to sit.'], cheerful: ['Thank you. I feel almost like myself. Almost.'], gloomy: ['...It\'s a bit lighter. A bit.'],
    proud: ['Thank you. I shan\'t forget it.'], child: ['Will you come back tomorrow? And bring a firework? A small one?'], elder: ['Bless you. You\'re a good lad, for a wizard.'],
  });
  L('mood.grief.stone', ['...All right. I\'ll go up this afternoon. I\'ll tell {moodGoneThem} about the hens.', 'Yes. Yes, I will. There\'s a lot {moodGoneThey}\'s missed.'], { ornery: ['Hmph. I was going anyway. Don\'t think it was your idea.'], child: ['Can I take flowers? I\'ll take the yellow ones. {MoodGoneThey} liked yellow.'], shy: ['...I\'ll go when there\'s nobody there. I\'ll go.'] });
  L('mood.grief.maybe', ['Maybe. Tomorrow. Or the day after.', 'Perhaps. When it doesn\'t feel so new.'], { ornery: ['I\'ll go when I\'m good and ready.'] });
  L('mood.grief.notready', ['I can\'t go up there. Not yet. Seeing {moodGoneTheir} name cut in stone...', 'Not yet. If I go, it\'s true.'], { proud: ['I shall go when I am ready, and not before.'], child: ['It\'s just a stone. {MoodGrief} isn\'t a stone.'] });
  L('mood.grief.supper', ['...You\'re right. {MoodPal} won\'t mind. {MoodPal} never minds.', 'All right. I\'ll go to {moodPal}\'s. I\'ll take the last of the pie.'], { ornery: ['Hmph. {MoodPal} will only fuss. ...I\'ll go.'], shy: ['...Will {moodPal} want me? ...Yes. All right.'] });

  // --- More ways of saying it (additive: rules only, no new fallbacks) ---------------------
  const A = (key, by, more) => lines(key, Object.keys(by || {}).map((k) => ({ if: COND[k] || { temper: k }, text: by[k] })).concat(more || []));
  const G = (rel, text, pri) => ({ if: { moodGriefRel: rel }, pri: pri || 1, text });
  const PARENT = ['mum', 'dad'], GRAND = ['gran', 'grandad'], WED = ['wife', 'husband'], SIB = ['brother', 'sister'];

  // the wizard's side of grief
  A('mood.grief.w.like', { child: ['What was {moodGrief} like? Was {moodGoneThey} fun?'], elder: ['You knew {moodGrief} longer than anyone. What was {moodGoneThey} like, young?'] }, [G(WED, ['How did you two meet, you and {moodGrief}?']), G('friend', ['How did you and {moodGrief} come to be friends?'])]);
  A('mood.grief.w.would', { child: ['If {moodGrief} could see you now, what would {moodGoneThey} say?'], elder: ['What would {moodGrief} make of all this fuss, do you think?'] }, [G(PARENT, ['What would your {moodGriefRel} tell you to do, just now?'])]);
  A('mood.grief.w.stone', { child: ['Shall we take some flowers up to {moodGrief}\'s stone? You choose them.'], elder: ['Go and sit on the bench by the yew. Tell {moodGrief} who\'s courting. {MoodGoneThey}\'ll want to know.'], rift: ['Up on the Green there\'s a stone with {moodGoneTheir} name. Go and ping {moodGoneThem}, as you\'d say.'] }, [{ if: { season: ['spring', 'summer'] }, text: ['The Green\'s full of daisies just now. Take {moodGrief} the news, and a few of those.'] }]);
  A('mood.grief.w.trouble', { child: ['{MoodGoneThey} sounds like a rascal. Were you a rascal together?'] }, [G(GRAND, ['Your {moodGriefRel} sounds like a hobbit after my own heart.'])]);
  A('mood.grief.w.supper', { child: ['Go and sit with {moodPal} at supper tonight. Grown-ups like company too, you know.'] }, [{ if: { hour: ['evening', 'night'] }, text: ['It\'s getting dark. Go and sit by {moodPal}\'s fire tonight, not your own.'] }]);
  A('mood.grief.see', { elder: ['Their hands, spotted and slow, are folded tight on top of their stick.'], child: ['There are tear-tracks through the dirt on their cheeks.'], rift: ['The little light on their sleeve has gone a dim, steady blue.'] }, [{ if: { moodGriefFresh: false }, text: ['There are daisy stems in their fist, wilting, as if they meant to go to the Green and didn\'t.'] }, { if: { weather: 'rain' }, text: ['They haven\'t noticed the rain. It\'s dripping off their nose.'] }]);
  lines('sit.grief.listen', [{ if: { weather: 'rain' }, text: ['*You stand with them in the rain, and say nothing at all.*'] }, { if: { hour: ['evening', 'night'] }, text: ['*You sit by them while the evening comes in, and say nothing.*'] }]);
  lines('sit.grief.ask', [{ if: { stage: 'child' }, text: ['Do you want to tell me about {moodGrief}?'] }, { if: { moodGriefFresh: false }, text: ['You\'ve been up to the Green. Tell me about {moodGrief}.'] }]);
  lines('sit.grief.comfort', [{ if: { stage: 'elder' }, text: ['Oh, my old friend. I heard. I\'m sorry.'] }, { if: { moodGriefRel: ['wife', 'husband'] }, text: ['I heard, {name}. All those years. I\'m so sorry.'] }]);
  lines('sit.grief.warm', [{ if: { stage: 'child' }, text: ['{MoodGrief} loved you to bits, you know. Everyone could see.'] }, { if: { moodGriefRel: ['mum', 'dad'] }, text: ['Your {moodGriefRel} was so proud of you, {name}. Everyone knew it.'] }]);
  lines('sit.grief.jest', [{ if: { moodGriefRel: ['gran', 'grandad'] }, text: ['I hear your {moodGriefRel} took the last of the good biscuits on the road. Sensible.'] }]);

  // what they say
  A('mood.grief.quiet', { curious: ['...I keep wondering what\'s over the hills. Where {moodGoneThey} is walking now. Isn\'t that odd?'], plain: ['...Ta. For just standing. Folk talk too much at a time like this.'], fine: ['...One is grateful for silence. People do insist on saying things.'] }, [G(WED, ['...Forty years of company and then the house goes quiet. You\'re the first noise I\'ve wanted.'], 2), G(SIB, ['...{MoodGrief} always said I couldn\'t keep quiet for five minutes. Look at me now.'])]);
  A('mood.grief.remembers', { plain: ['{MoodGrief} were a good sort. Never said much. Didn\'t need to.'], fine: ['{MoodGrief} had a way of making every room a little more civilised.'], rift: ['{MoodGrief} was the first hill-folk who didn\'t stare at me. Gave me an apple. Just like that.'] }, [{ if: { hour: 'morning' }, text: ['Mornings are the worst. {MoodGrief} always had the kettle on before I was up.'] }, { if: { hour: ['evening', 'night'] }, text: ['Evenings we\'d sit out and watch the bats. I sat out last night. Too many bats. Not enough {moodGrief}.'] }, { if: { season: 'autumn' }, text: ['{MoodGrief} loved the apple harvest. Ate more than {moodGoneThey} picked. Every year.'] }, { if: { season: 'summer' }, text: ['{MoodGrief} would be in the river by now, paddling, with {moodGoneTheir} trousers rolled up.'] }]);
  A('mood.grief.story', { plain: ['One harvest {moodGrief} carried a whole sack up the hill on a bet. Won a pint. Couldn\'t lift the pint.'], fine: ['{MoodGrief} once recited the whole of the Lay of Leithian at a wedding. Nobody had asked.'], rift: ['When I first came through, {moodGrief} tried to plug my visor in to the mill. To charge it. Sweetest thing.'] }, [G(PARENT, ['When I was small my {moodGriefRel} made me a kite out of a tablecloth. It flew. The tablecloth was never the same.'], 2), G(GRAND, ['My {moodGriefRel} kept a toad in the garden called Sir Humphrey. Talked to it every morning. It never answered.'], 2), G(SIB, ['When we were little, {moodGrief} hid my boots in the hen house for a whole summer. I went barefoot. I loved it.'], 2)]);
  A('mood.grief.laughcry', { shy: ['*a laugh comes out, surprised, and then a sob right behind it*'], gloomy: ['Ha... oh. I didn\'t think I\'d laugh again. Not this week.'], proud: ['Ha! ...Excuse me. I am not crying. I am... laughing damply.'], elder: ['Ha! Rascal is right. Seventy years a rascal. Oh, dear. Oh, dear.'] });
  A('mood.grief.smile', { shy: ['*a very small smile, quickly hidden*'], gloomy: ['...Yes. {MoodGoneThey} would have.'], cheerful: ['Ha. ...Yes. Yes, {moodGoneThey} would. Thank you.'], elder: ['Heh. You\'ve the measure of {moodGoneThem}, wizard.'] });
  A('mood.grief.aghast', { cheerful: ['...I can\'t laugh today, wizard. Not even for you.'], witty: ['That\'s not funny. And I\'d know.'], elder: ['I\'ve buried my sense of humour along with the rest, wizard. Leave it be.'] });
  A('mood.grief.forgiven', { shy: ['...It\'s all right. Really.'], proud: ['Apology accepted. You meant no harm.'], gloomy: ['...Never mind. Nothing comes out right this week.'], elder: ['Bless you. At my age you learn folk mean well.'] });
  A('mood.grief.toosoon', { cheerful: ['Oh, I... can we not? Not yet. I\'ll cry, and I\'ve only just stopped.'], gloomy: ['What\'s the use of talking? {MoodGoneThey}\'s gone.'], elder: ['Let it rest a while, lad. Some things want a week before words.'] });
  A('mood.grief.stiff', { shy: ['...I\'m fine. Thank you. I\'m fine.'], witty: ['Me? I\'m right as rain. Rain\'s been very upset lately.'], elder: ['I\'m old, wizard. I\'ve seen plenty go. I\'m all right.'] }, [{ if: { job: has }, text: ['I\'m fine. I\'ve the {jobWord}ing to see to. Keeps a body busy.'] }]);
  A('mood.grief.leans', { gloomy: ['...I\'m so tired, wizard. Missing someone is tiring.'], witty: ['...Don\'t move. You\'re the only thing in this valley standing still.'], curious: ['...You smell of pipe smoke and rain. Like {moodGrief} did. Don\'t move.'] });
  A('mood.grief.weeps', { cheerful: ['Oh! Oh, there it is. I knew it was in there somewhere. Sorry. Sorry.'], dreamy: ['*cries quietly, looking at the hills, as if they might give something back*'], elder: ['*the tears run down an old face, into old creases, and stop there*'], witty: ['...Well. That\'s my dignity gone over the hills too.'] });
  A('mood.grief.notyou', { shy: ['...Please. Not your stories. Not today.'], gloomy: ['Everyone\'s lost somebody. That doesn\'t make it smaller.'], elder: ['I\'m sure you\'ve lost many, wizard. I\'ve only lost one. Let me have it.'] });
  A('mood.grief.shared', { gloomy: ['...So you carry them too. All of them. How do you stand it?'], dreamy: ['...Do you think they\'re all together, somewhere? Your friend and {moodGrief}?'], proud: ['...I\'m sorry for your loss. And thank you for telling me.'], elder: ['Aye. You live long enough, the other side of the hills gets crowded.'] });
  A('mood.grief.kindred', { cheerful: ['Ha! I tell {moodGoneThem} all the gossip. {MoodGoneThey} always loved the gossip.'], proud: ['...I give {moodGoneThem} a report. Every evening. As one does.'], gloomy: ['...Sometimes I think {moodGoneThey} answers. Then I know it\'s the wind.'] });
  A('mood.grief.missmost', { shy: ['...Being looked for. When I came in, {moodGoneThey} always looked up.'], witty: ['Losing at cards. {MoodGoneThey} cheated. Beautifully.'], curious: ['The questions. {MoodGoneThey} asked me things nobody else bothers to ask.'], elder: ['Somebody who remembered the same things I do. Now there\'s only me remembering them.'] }, [G(WED, ['Cold feet in bed. Isn\'t that daft? I miss being kicked by cold feet.'], 2), G(PARENT, ['Being somebody\'s child. You\'re never anybody\'s child again, after.'], 2)]);
  A('mood.grief.wouldsay', { shy: ['{MoodGoneThey}\'d say, you\'re braver than you think. {MoodGoneThey} always said that.'], dreamy: ['{MoodGoneThey}\'d say, look at the sky, love. It\'s still there. So are you.'], witty: ['{MoodGoneThey}\'d say, who\'s that long-faced lump talking to a wizard? Then {moodGoneThey}\'d laugh.'], curious: ['{MoodGoneThey}\'d ask what I\'d had for breakfast. And then tell me it wasn\'t enough.'] });
  A('mood.grief.keepsake', { cheerful: ['Look! {MoodGrief}\'s {moodKeepsake}! Isn\'t it lovely? I polish it every night.'], ornery: ['{MoodGrief}\'s {moodKeepsake}. Don\'t touch it. ...You can look.'], elder: ['{MoodGrief}\'s {moodKeepsake}. I\'ll hand it on myself one day, when it\'s my turn for the road.'] });
  A('mood.grief.keepuse', { ornery: ['Use it? It\'s not for using. It\'s for having.'], cheerful: ['All the time! It\'s not a keepsake if it sits in a drawer, {moodGoneThey} used to say.'], elder: ['When I\'m sure nobody\'s looking. It still smells of {moodGoneThem}.'] });
  A('mood.grief.wishknown', { shy: ['...{MoodGoneThey} would have liked you. {MoodGoneThey} liked the quiet ones.'], proud: ['You\'d have found {moodGoneThem} excellent company. Everybody did.'], gloomy: ['Too late now. That\'s the trouble with everything.'], elder: ['You\'d have argued about pipe-weed till the small hours, you two.'] });
  A('mood.grief.here', { curious: ['...Thank you. I\'ve a hundred more questions about where {moodGoneThey}\'s gone. Another day.'], dreamy: ['...I think I\'ll go and watch the hills for a bit. Thank you. For the company.'], witty: ['...You\'re good at this. For someone who\'s mostly hat.'], rift: ['...Thanks, wizard. Signal\'s weak, but it\'s there.'] });
  A('mood.grief.stone', { proud: ['I shall go up and make sure the stone is properly kept. And tell {moodGoneThem} everything.'], gloomy: ['...All right. Sitting there can\'t be worse than sitting here.'], elder: ['I\'ll go up and sit. I\'ll be needing to learn the way, at my age.'] });
  A('mood.grief.maybe', { shy: ['...Maybe. When there\'s nobody about.'], gloomy: ['Maybe. Not that it\'ll change anything.'], child: ['Maybe. Will you come too?'] });
  A('mood.grief.notready', { shy: ['...I can\'t. I tried. I got as far as the gate.'], gloomy: ['A stone. That\'s all {moodGoneThey} is now, to the rest of them. A stone.'], elder: ['I\'ll go when my legs agree. They don\'t, yet.'] });
  A('mood.grief.supper', { cheerful: ['Yes! {MoodPal}\'s stew. {MoodGrief} always said it was the best in the lane. We\'ll eat it for {moodGoneThem}.'], child: ['Can I? Will {moodPal} have pudding?'], elder: ['Aye. Two old things by a fire. That\'ll do us both good.'] });

  // the cross additions
  A('mood.cross.w.leave', { child: ['Go and run it off, then. Round the party tree three times.'], elder: ['I\'ll leave you to your pipe. It\'s better company than me, today.'] });
  A('mood.cross.w.again', { child: ['If you stick your lip out any further, a bird will sit on it.'], elder: ['I\'ve seen friendlier faces on a toad that\'s been sat on.'] });
  A('mood.cross.sorry', { shy: ['...That\'s all right. I\'m sorry I was cross.'], gloomy: ['...It\'s all right. Everybody gets it wrong with me today.'], cheerful: ['Oh, never mind it. I\'m not cross at YOU.'] });
  A('mood.cross.stopping', { gloomy: ['What if I say sorry and they don\'t? Then I\'ve said sorry for nothing.'], cheerful: ['I would, only... what if they\'re still cross? I don\'t like being cross at.'], child: ['They started it. The one who started it says sorry. That\'s the RULE.'] });
  A('mood.cross.cold', { shy: ['...Not just now. Please.'], cheerful: ['Oh, don\'t. I\'m enjoying being cross for once.'], child: ['Go AWAY. I\'m being cross.'] });
  A('mood.cross.warmed', { shy: ['...You\'re on my side? Oh. Thank you.'], proud: ['At last, somebody with a grain of sense.'], gloomy: ['...Nobody\'s ever on my side. Thank you.'] });
  A('mood.cross.notyou', { shy: ['...I don\'t want a story. Sorry.'], gloomy: ['Of course. A wizard\'s quarrel is grander than mine.'], child: ['That\'s not the same. That\'s a DWARF.'] });
  A('mood.cross.swapped', { ornery: ['A hundred years. Hmph. I could manage a hundred. Easily.'], child: ['A DWARF? Did you fight? With axes?'], proud: ['A troll, at least, would have had the decency to stay angry.'] });
  A('mood.cross.kindred', { proud: ['Hmph. So the great wizard is stubborn too. Somehow I\'m not surprised.'], cheerful: ['Ha! I knew it! Nobody gets that cross without practice!'], shy: ['...So even wizards fall out. That\'s a comfort, somehow.'] });
  A('cross.stony', { cheerful: ['*tries to smile, and can\'t, and stops trying*'], witty: ['I\'m not speaking. Not even to you. Especially not to you.'] });
  A('cross.softens', { gloomy: ['...I just needed someone not to argue. That\'s all.'], witty: ['...You win. Silence beats wit. Don\'t tell anyone I said so.'], elder: ['...At my age you\'d think I\'d know better. I don\'t.'] });
  A('cross.business', { cheerful: ['Oh, I\'d rather not. It\'ll spoil my day twice.'], gloomy: ['What does it matter? Nothing changes.'] });
  A('cross.doubt', { shy: ['...They might be right. They usually are. That\'s why it hurts.'], cheerful: ['Oh, I suppose there\'s two sides. There always are, aren\'t there? Bother.'], elder: ['When you\'re old you\'re usually right. Usually.'] });
  A('cross.bristles', { cheerful: ['Not now, wizard. Even I\'m not laughing.'], witty: ['Is that the best you\'ve got? I\'ve heard funnier from the miller\'s donkey.'] });
  A('cross.grudging', { cheerful: ['Ha... oh, curse you. I was enjoying being cross.'], gloomy: ['...Hm. Bonnet. All right.'], proud: ['I concede the bonnet.'] });
  A('cross.laughs', { proud: ['Ha! ...You are a ridiculous man, wizard.'], shy: ['*giggles, and hides it behind a hand*'], elder: ['Ha! A toad! I\'ve wished it a hundred times.'] });
  A('cross.goes', { cheerful: ['Right! I\'ll go and make friends again. Life\'s too short, isn\'t it?'], gloomy: ['...All right. It can\'t go worse than not going.'], elder: ['I\'ll go. At my age you can\'t waste quarrels. There\'s not time.'] });
  A('cross.thanks', { shy: ['...Thank you. I didn\'t know what to do with it all.'], proud: ['Most kind. I shall recover my composure presently.'], child: ['...Thank you. I\'m not cross with YOU.'] });

  // the tempers the first pass left out
  A('cross.stony', { curious: ['*opens their mouth to ask you something, remembers they\'re cross, shuts it*'], dreamy: ['*stares off at the far hills, as if the quarrel might be over there*'] });
  A('cross.vents', { curious: ['What I want to know is WHY. Why would anyone say that? I\'ve thought of nine reasons and they\'re all rude.'], dreamy: ['I had such a lovely morning planned. And then somebody had to open their mouth.'] });
  A('cross.softens', { curious: ['...Do you know, I can\'t even remember how it started now. Isn\'t that odd?'], dreamy: ['...It\'s a nice evening, really. Too nice to waste on being cross.'] });
  A('cross.business', { curious: ['Why does everyone want to know? Is it all over the lane already?'], dreamy: ['...I\'d rather think about something else. Anything else.'], witty: ['It\'s private. Like your hat. Nobody asks what\'s under that.'], elder: ['I\'m too old to explain myself, wizard.'] });
  A('cross.doubt', { curious: ['...I suppose if I look at it from their side... no. Well. A little.'], dreamy: ['...Maybe we were both right. That\'s the worst sort of quarrel.'], witty: ['Right? They were wrong in a very convincing way. Which is nearly right.'] });
  A('cross.bristles', { curious: ['Why is that funny? No, don\'t explain. I don\'t want to know.'], dreamy: ['...I don\'t think that\'s funny. Not today.'], elder: ['I was laughed at by better wizards than you, sonny. Well. By the miller.'] });
  A('cross.grudging', { shy: ['*a tiny snort, quickly smothered*'], curious: ['...A wet cat. Hm. Which cat?'], dreamy: ['...A bonnet. I suppose I am being a bit of a bonnet.'], elder: ['Heh. My old mother used to say that. The cat, not the bonnet.'] });
  A('cross.laughs', { cheerful: ['Ha! Oh, there I am. I knew I\'d come back.'], curious: ['Ha! Could you, though? Turn someone into a toad? No. Don\'t answer.'], dreamy: ['Ha! A toad on a lily pad, croaking about the washing. Oh, that\'s them exactly.'] });
  A('cross.think', { cheerful: ['I will! After a bun. Everything\'s easier after a bun.'], shy: ['...I\'ll think about it. Quietly.'], curious: ['Hm. I\'ll work out what to say first. Then I\'ll think about it.'], dreamy: ['Maybe it\'ll come to me in the night. Things do.'], witty: ['I\'ll think about it. I\'m a very slow thinker when I\'m in the wrong.'], gloomy: ['Thinking\'s what I do. That\'s half the trouble.'], child: ['...Maybe. After my tea.'], elder: ['I\'ll sleep on it. At my age I sleep on most things.'] });
  A('cross.fuss', { cheerful: ['Oh, don\'t fuss! I\'m fine! I\'m... no, I\'m cross. But don\'t fuss.'], shy: ['...Please don\'t. People will look.'], curious: ['Why does everyone pat you when you\'re cross? It never helps. Has it ever helped?'], dreamy: ['...Not now. I just want to be cross a little longer.'], witty: ['I\'m not a cushion, wizard. Stop plumping me.'], gloomy: ['It\'ll pass. It always passes. Then it comes back.'], child: ['I\'m not a BABY.'], elder: ['I was cross before you were... well. Before most people were born.'] });
  A('cross.pat', { cheerful: ['...Oh, that\'s nice. Silly, but nice.'], ornery: ['Hmph. ...That\'ll do. That\'s enough.'], curious: ['...Huh. That does help. Why does that help?'], dreamy: ['...Thank you. The world\'s a bit softer now.'], witty: ['...All right. You can stop now. ...Not yet.'], proud: ['...Thank you. That was not unwelcome.'], child: ['*leans in for a hug, and gets one*'], elder: ['...You\'ve kind hands for a wizard.'] });
  A('cross.thanks', { ornery: ['Hmph. Thank you. Now go away before I\'m nice again.'], curious: ['...Thank you. I don\'t know why I let it get to me so.'], dreamy: ['...Thank you. It\'s all floating off now. Like a cloud.'], witty: ['Thank you. That\'s the first sensible thing anyone\'s said today. Including me.'], elder: ['Thank you, lad. Getting worked up at my age. Daft.'] });
  A('mood.cross.w.leave', { cheerful: ['Back to your sunshine, {name}. It\'ll find you again.'], ornery: ['I\'ll take myself off before you take my head off.'], shy: ['I\'ll go. Come and find me, if you want to talk.'], witty: ['I\'ll retreat. Strategically. With dignity. And my hat.'], gloomy: ['I\'ll leave you be. It\'ll look better in the morning. Most things do.'] });
  A('mood.cross.w.again', { cheerful: ['Is that a frown? On YOU? Somebody fetch the herbalist.'], ornery: ['You\'d curdle milk at twenty paces today, {name}.'], witty: ['That scowl could take the varnish off a door.'], proud: ['Even cross, you\'re the most distinguished frown in the village.'], gloomy: ['Look at that face. Even the rain\'s cheering up next to it.'] });
  A('mood.cross.leave', { curious: ['...Thank you. I\'ll work it out. I always do, in the end.'], dreamy: ['...Yes. Later. It\'ll look different after the sun goes down.'], witty: ['Good. I need to go and think of a better answer. A crushing one.'], gloomy: ['...Thank you. Not that it\'ll help.'], elder: ['Off you go, then. I\'ll be here. I\'m always here.'] });
  A('mood.cross.sorry', { curious: ['...Accepted. You couldn\'t have known.'], dreamy: ['...It\'s all right. Words just come out wrong some days.'], witty: ['Accepted. I\'ll put it on your account.'], elder: ['Bless you. I\'ve been said worse to.'] });
  A('mood.cross.stopping', { curious: ['I don\'t know what I\'d say. I\'ve tried it out loud. It sounds wrong every way.'], dreamy: ['...I keep picturing it going badly. Over and over.'], witty: ['Pride. Pure pride. I\'ve a great deal of it. It\'s very heavy.'], elder: ['I\'ve never said sorry first in seventy years. I don\'t know the words.'] });
  A('mood.cross.cold', { curious: ['Why is everyone being NICE? I\'m trying to be cross here.'], dreamy: ['...Please. Just let me sit with it.'], witty: ['Don\'t be lovely at me. I\'ve no defence against lovely.'], elder: ['I\'m too old to be jollied along.'] });
  A('mood.cross.warmed', { curious: ['You don\'t even know what happened. ...But you\'re on my side? Huh.'], dreamy: ['...That\'s the nicest thing anyone\'s said all day.'], witty: ['On my side? A wizard? I\'ll have that in writing.'], elder: ['Bless you. At my age you forget anyone takes your side.'] });
  A('mood.cross.notyou', { cheerful: ['Oh, wizard. Not now. Your stories are lovely but not now.'], curious: ['A dwarf? ...No. No, I\'m not going to ask. I\'m cross.'], dreamy: ['...I don\'t want somebody else\'s quarrel. I\'ve got my own.'], witty: ['Is this a quarrel or a competition?'], elder: ['I\'ve heard all the old tales, wizard. Mine\'s new.'] });
  A('mood.cross.swapped', { cheerful: ['Ha! A hundred years! Well, mine\'s only been since Tuesday.'], shy: ['...Oh. I didn\'t think anyone else got this cross.'], dreamy: ['...A hundred years. Imagine. I\'d hate to be cross that long.'], gloomy: ['A hundred years. That\'s about how long mine will last.'], elder: ['A hundred years? I\'ve one going on fifty. Same goat, same fence.'] });
  A('mood.cross.kindred', { curious: ['What was it about? Your quarrel? ...Was it anything sensible?'], dreamy: ['...So it goes on, for everyone. Even wizards. Even for ever.'], witty: ['Forty years! You\'re a stubborn old thing. Like me. We should start a club.'], gloomy: ['...So it never stops. That\'s cheering.'], child: ['Did you have a fight? A REAL one?'], elder: ['Ah. You learn, at my age. Most quarrels outlive the reason.'] });

  A('mood.grief.w.like', { cheerful: ['Tell me something {moodGrief} did that made you laugh.'], ornery: ['Was {moodGrief} as stubborn as you? Go on. You can tell me.'], shy: ['Would you tell me about {moodGrief}? Only if you want.'], curious: ['What did {moodGrief} love best, in all the world?'], dreamy: ['If {moodGrief} walked down the lane now, what would {moodGoneThey} be doing?'], gloomy: ['What would you want folk to remember about {moodGrief}?'] });
  A('mood.grief.w.would', { cheerful: ['If {moodGrief} popped round now, what would {moodGoneThey} say first?'], ornery: ['What would {moodGrief} make of you sitting out here moping?'], dreamy: ['What do you think {moodGrief} is saying, wherever the road\'s got to?'], gloomy: ['If {moodGrief} could see you now, what would {moodGoneThey} want for you?'] });
  A('mood.grief.w.stone', { cheerful: ['Take {moodGrief} the news. All of it. The good bits first.'], shy: ['There\'s a bench by the stones. Nobody minds if you sit there a while.'], ornery: ['Go and tell {moodGrief}\'s stone what you\'ve been telling me. It\'ll argue less.'], dreamy: ['Go up to the Green at dusk. It\'s quiet there. Things get said that won\'t get said here.'] });
  A('mood.grief.w.trouble', { cheerful: ['Oh, {moodGoneThey} sounds wonderful. And terrible. Both.'], ornery: ['No wonder you two got on. Two of a kind.'], witty: ['{MoodGoneThey} sounds like the sort who\'d argue with the weather and win.'], elder: ['{MoodGoneThey} sounds like the hobbits I knew when I was young. They don\'t make them like that.'] });
  A('mood.grief.w.supper', { cheerful: ['Go and see {moodPal}, and let {moodPal} feed you. You\'ve gone thin.'], ornery: ['Go and sit at {moodPal}\'s table. Don\'t argue. Eat what\'s put in front of you.'], shy: ['{MoodPal} would be glad of you tonight. Truly.'], elder: ['Go to {moodPal}\'s and have your supper by someone else\'s fire.'] });
  A('mood.grief.see', { cheerful: ['Even now there\'s a flower stuck in their buttonhole. Somebody\'s habit, kept up.'], ornery: ['They\'re scowling at the hills, as if the hills had done it.'], shy: ['They\'ve pulled their collar right up, to their nose.'], dreamy: ['They\'re following a cloud with their eyes, all the way over the ridge.'] });
  A('mood.grief.laughcry', { curious: ['Ha! ...Do you think {moodGoneThey}\'s laughing too? Somewhere? I hope so.'], dreamy: ['Ha... oh. I can hear {moodGoneThem} laughing. Just for a second. Then I can\'t.'] });
  A('mood.grief.smile', { curious: ['...{MoodGoneThey} would. You did know {moodGoneThem} a bit, didn\'t you.'], dreamy: ['...I can almost hear {moodGoneThem} saying it.'], witty: ['...Ha. Yes. {MoodGoneThey} would have said it better.'], proud: ['...Quite so. {MoodGoneThey} had standards in mischief.'] });
  A('mood.grief.aghast', { curious: ['How can anyone make jokes? Doesn\'t it hurt you?'], dreamy: ['...Please don\'t. It\'s too new.'] });
  A('mood.grief.forgiven', { cheerful: ['Oh, never mind. {MoodGrief} would have laughed, anyway.'], curious: ['...I know you didn\'t mean it. Nobody knows what to say. Nor do I.'], dreamy: ['...It\'s all right. Nothing sounds right this week.'], witty: ['All right. You\'re forgiven. {MoodGoneThey} always said I was too touchy.'] });
  A('mood.grief.toosoon', { curious: ['...I don\'t know how to talk about {moodGoneThem} yet. I keep trying.'], dreamy: ['...Not yet. If I say it, it\'s real.'], witty: ['For once I haven\'t got anything to say. Remarkable, isn\'t it?'] });
  A('mood.grief.stiff', { curious: ['Fine! I\'m fine. I\'m keeping busy. Busy is good. Isn\'t it?'], dreamy: ['...I\'m all right. Mostly I\'m somewhere else.'] });
  A('mood.grief.leans', { dreamy: ['*rests against you, the way you\'d lean on a tree, and shuts their eyes*'] });
  A('mood.grief.weeps', { curious: ['...Why does it come all at once like this? I was fine at breakfast.'] });
  A('mood.grief.notyou', { cheerful: ['Oh, wizard. Another time. Today I can only hold my own.'], curious: ['...Was it like this for you? No. Don\'t tell me. Not today.'], dreamy: ['...I can\'t think about anyone else\'s. Mine\'s taking all the room.'], witty: ['Let me have my own grief, wizard. It\'s about all I\'ve got.'] });
  A('mood.grief.shared', { cheerful: ['...Oh, wizard. Thank you. I didn\'t think about wizards being sad.'], witty: ['...So that\'s why you wear the big hat. To hide it.'] });
  A('mood.grief.kindred', { curious: ['...Do you think they can hear? Yours? Mine? Do you think about that?'], dreamy: ['...I tell {moodGoneThem} about the sunsets. {MoodGoneThey} loved sunsets.'], witty: ['...I even do {moodGoneTheir} half of the argument. I always win now. It\'s no fun.'] });
  A('mood.grief.keepsake', { curious: ['{MoodGrief}\'s {moodKeepsake}. I keep finding new scratches on it. Every one\'s a story I\'ll never hear.'], dreamy: ['{MoodGrief}\'s {moodKeepsake}. If I hold it tight enough I can nearly feel {moodGoneTheir} hand.'], witty: ['{MoodGrief}\'s {moodKeepsake}. {MoodGoneThey} said it was the most valuable thing {moodGoneThey} owned. It\'s worth about a penny.'], gloomy: ['{MoodGrief}\'s {moodKeepsake}. It\'s all there is of {moodGoneThem} now, in my hand.'] });
  A('mood.grief.keepuse', { shy: ['...Only at night. When nobody\'s looking.'], curious: ['Every day. I\'m learning how {moodGoneThey} used it. There\'s a knack.'], dreamy: ['Sometimes I just hold it and look out of the window.'], witty: ['Every day. Badly. {MoodGoneThey} always said I would.'], proud: ['Daily. It deserves to be used, not hidden.'], gloomy: ['I can\'t. If I use it, it\'ll wear out. Then there\'ll be nothing.'] });
  A('mood.grief.wishknown', { cheerful: ['Oh, you\'d have got on like a house on fire! Literally, probably. With your fireworks.'], curious: ['You\'d have had so much to ask each other. {MoodGoneThey} always wanted to meet a proper wizard.'], dreamy: ['{MoodGoneThey} used to watch for your cart, you know. Every summer.'], witty: ['{MoodGoneThey}\'d have made fun of your hat. Lovingly. Mostly.'] });
  A('mood.grief.stone', { cheerful: ['Yes! I\'ll take a picnic. {MoodGrief} never said no to a picnic.'], curious: ['I\'ll go and look at the carving. I want to see if they spelt it right.'], dreamy: ['I\'ll go at sunset. {MoodGoneThey} liked sunsets.'], witty: ['I\'ll go and give {moodGoneThem} a piece of my mind. It\'ll be like old times.'] });
  A('mood.grief.maybe', { cheerful: ['Maybe! When I\'m less soggy.'], curious: ['Maybe. I don\'t know what you do there. Do you talk? Out loud?'], dreamy: ['Perhaps. When it feels right. It doesn\'t yet.'], witty: ['Maybe. If I can think of something worth saying.'], proud: ['In due course.'], elder: ['Soon. There\'s no hurry. {MoodGoneThey}\'s not going anywhere. Well. Not any more.'] });
  A('mood.grief.notready', { cheerful: ['...I can\'t. I\'m sorry. I\'d just cry all over the daisies.'], ornery: ['I\'m not going up there to stare at a lump of rock.'], curious: ['...What do you even say, to a stone?'], dreamy: ['...If I go, {moodGoneThey}\'s up there. If I don\'t, {moodGoneThey}\'s still on the road. I like the road better.'], witty: ['Not yet. I\'m not ready to see {moodGoneThem} so quiet.'] });
  A('mood.grief.supper', { curious: ['Yes. I\'ve not been to {moodPal}\'s in an age. I wonder what\'s new.'], dreamy: ['...Supper by somebody else\'s fire. Yes. I\'d like that.'], witty: ['{MoodPal}\'s cooking. Well. Grief can\'t make it any worse.'], proud: ['I\'ll accept {moodPal}\'s hospitality. Graciously.'], gloomy: ['...All right. Better than sitting in the dark.'] });
  // --- No going round in circles ---------------------------------------------------------
  // A beat once visited isn't offered again in the same talk (nor a ladder that would land
  // on one); if that leaves a beat with nothing to say, a warm way out to the close appears.
  const tidy = (id, close, say) => {
    const th = THREADS[id];
    if (!th) return;
    const mark = (b) => '@' + b;
    const target = (g, T) => { if (typeof g.to === 'string') return g.to; if (!Array.isArray(g.to)) return null; const x = g.to.find((y) => typeof y === 'string' || needMet(y.need, T)); return typeof x === 'string' ? x : x && x.to; };
    for (const name in th.beats) {
      const b = th.beats[name], fx = b.fx || {}, run = fx.run;
      b.fx = { ...fx, run: (T, v) => { if (run) run(T, v); (T.flags || (T.flags = {}))[mark(name)] = true; } };
      if (!b.go) continue;
      const opts = b.go.slice();
      for (const g of opts) { const need = g.need || {}, when = need.when; g.need = { ...need, when: (F, T) => (!when || when(F, T)) && !(T.flags && T.flags[mark(target(g, T))]) }; }
      if (name !== close && th.beats[close]) b.go.push({ ap: 'warm', say, to: close, need: { when: (F, T) => !opts.some((g) => needMet(g.need, T)) } });
    }
  };
  lines('mood.grief.w.close', [{ text: ['I\'m here, {name}. For as long as you like.', 'Come here. Let\'s just sit a while, you and I.', '{MoodGrief} would be glad you\'re not on your own today.'] }]);
  tidy('mood.grief', 'here', 'mood.grief.w.close');
});
