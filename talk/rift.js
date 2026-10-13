'use strict';
// ---------------------------------------------------------------------------
// The rift-born, in their own words: Neverdark and what they miss of it (the
// night market, rain on neon, the Lamplighter's glow on the clouds), the one
// they lost in the crossing, the knack they brought, batteries running flat
// with no socket in the Shire, the quiet and the stars, and whether this is
// home now. Also the facts every rift pack reads (riftHome, riftKnack,
// riftLost, riftWary, riftHillFriend, riftStage...) and the homesick mood.
// The rift-born talk clipped and slangy (signal, lag, copy that, battery),
// but always warm. Threads here set the same state as riftplay.js: what you
// learn ticks their thread on the Rift-folk page, and a name you promise to
// keep in mind is likelier to come through a later rift.
// ---------------------------------------------------------------------------

talkPack('rift', () => {
  // --- Facts the rift packs share ------------------------------------------------------
  const BATTERY = (b) => (b < 0.1 ? 'flat' : b < 0.35 ? 'low' : b < 0.75 ? 'fair' : 'full');
  const HOMESICK = (l) => (l > 0.7 ? 'lost' : l > 0.4 ? 'homesick' : l > 0.15 ? 'settling' : 'home');
  addFacts((v, F) => {
    const S = typeof story === 'function' ? story() : null;
    const P = typeof rp === 'function' ? rp() : null;
    const isRb = v.isRiftborn && v.isRiftborn();
    const a = isRb ? v.arc || null : null;
    const rb = typeof riftBorn === 'function' ? riftBorn() : [];
    const sk = a && typeof ARC_SKILLS !== 'undefined' ? ARC_SKILLS[a.skill] : null;
    F.riftCount = rb.length;
    F.riftHome = a ? a.home : null;
    F.riftKnack = a ? a.skill : null;
    F.riftKnackWord = sk ? sk.label : null;
    F.riftJobWord = sk && JOBS[sk.job] ? JOBS[sk.job].label.toLowerCase() : null;
    const mate = sk ? Game.villagers.find((o) => o !== v && o.job === sk.job && !o.isRiftborn() && o.isGrown() && !o.leaving) : null;
    F.riftJobMate = mate ? mate.first : null;
    F.riftLost = a && a.lost ? a.lost.name : null;
    F.riftLostRel = a && a.lost ? a.lost.rel : null;
    F.riftLostThey = a && a.lost ? (a.lost.sex === 'f' ? 'she' : 'he') : null;
    F.riftLostThem = a && a.lost ? (a.lost.sex === 'f' ? 'her' : 'him') : null;
    F.riftFound = a && a.lost && a.lost.found ? a.lost.name : null;
    F.riftTurned = a && a.turned ? ((personById(a.turned) || {}).first || null) : null;
    F.riftTier = v.stage === 'baby' ? 0 : techTier(v.tech || 0);
    const w = !isRb && typeof riftWary === 'function' && v.stage !== 'baby' ? riftWary(v) : 0;
    F.riftWary = isRb ? null : w > 0.35 ? 'much' : w > 0.12 ? 'some' : 'none';
    const best = (pred) => Game.villagers.filter((o) => o !== v && !o.leaving && o.stage !== 'baby' && pred(o) && (v.rel[o.id] || 0) > 0.4).sort((x, y) => (v.rel[y.id] || 0) - (v.rel[x.id] || 0))[0];
    const hf = isRb ? best((o) => !o.isRiftborn()) : null;
    F.riftHillFriend = hf ? hf.first : null;
    const rf = !isRb ? best((o) => o.isRiftborn()) : null;
    F.riftFriend = rf ? rf.first : null;
    let nb = rf;
    if (!nb && !isRb && v.homeId >= 0) nb = rb.find((o) => o.homeId === v.homeId) || null;
    if (!nb && !isRb) nb = rb.filter((o) => o.isGrown()).sort((x, y) => (v.rel[y.id] || 0) - (v.rel[x.id] || 0))[0] || null;
    F.riftNeighbour = nb ? nb.first : null;
    F.riftStage = S ? S.stage : 0;
    F.riftDim = typeof voteOpen === 'function' ? !!voteOpen() : false;
    F.riftSide = S && S.stage >= 6 && !S.finale && typeof riftLean === 'function' && v.isGrown() ? leanSide(riftLean(v)) : null;
    F.riftBattery = isRb && v.stage !== 'baby' ? BATTERY(v.battery ?? 0.9) : null;
    F.riftHomesick = isRb ? HOMESICK(v.lost || 0) : null;
    F.riftFinale = S && S.finale ? S.finale : null;
    F.riftRelay = typeof builtCivic === 'function' ? builtCivic('relay') : false;
    F.riftDynamo = typeof builtCivic === 'function' ? builtCivic('dynamo') || builtCivic('turbine') : false;
    F.riftCamp = !!Game.stats.riftCamp;
    F.riftCustoms = S ? Object.keys(S.customs).filter((k) => S.customs[k].knowers.includes(v.id)) : [];
    F.riftTraditions = S ? Object.keys(S.customs).filter((k) => S.customs[k].tradition) : [];
    const r = (v.genes && v.genes.rift) || 0;
    F.riftBlood = r >= 0.99 ? 'full' : r >= 0.4 ? 'half' : r > 0.05 ? 'little' : null;
    F.riftClues = S ? S.frags.length : 0;
    F.riftFrags = S ? S.frags.slice() : [];
    F.riftArc = P && P.known[v.id] ? Object.keys(P.known[v.id]) : [];
    F.riftKept = !!(P && a && a.lost && P.names.includes(a.lost.name));
    F.riftPolicy = S ? S.policy || null : null;
    F.riftSupper = typeof moodletsOf === 'function' && moodletsOf(v).some((m) => m.k === 'supper');
    F.riftMixed = v.homeId >= 0 && typeof residentsOf === 'function' && residentsOf(v.home()).some((o) => o !== v && o.isRiftborn() !== isRb && o.stage !== 'baby');
    F.riftSeeking = isRb && (v.lost || 0) > 0.25 && (Village.wayHome || 0) > 0.15;
    const el = typeof wariestElder === 'function' ? wariestElder() : null;
    F.riftElder = el && el !== v ? el.first : null;
    F.riftOpen = !!(World.rifts && World.rifts.some((x) => x.a > 0.5 && !x.closing && !x.home));
  });

  // --- Helpers for effects ---------------------------------------------------------------
  const arcKnow = (beat) => (T, v) => { if (typeof knowArc === 'function') knowArc(v, beat); };
  const keepName = (T, v) => { const P = typeof rp === 'function' ? rp() : null; if (P && v.arc && v.arc.lost && !v.arc.lost.found && !P.names.includes(v.arc.lost.name)) P.names.push(v.arc.lost.name); };
  const ease = (d) => (T, v) => { v.lost = Math.max(0, (v.lost || 0) - d); };
  const hookTo = (id) => (T, v) => { const b = bondFull(v); if (!b.hooks.some((h) => h.thread === id && h.d === Game.day)) b.hooks.unshift({ k: id, thread: id, d: Game.day }); b.hooks.length = Math.min(b.hooks.length, 12); };
  const all = (...fns) => (T, v) => { for (const f of fns) f(T, v); };
  // a natter queued with someone by first name, for after the talk
  const natterWith = (key) => (T, v) => { const n = T.F[key]; const o = n && Game.villagers.find((x) => x.first === n && x !== v && !x.leaving); if (o && ACTIONS.chat) v.queue.push({ a: { ...ACTIONS.chat, target: () => ({ other: o }) } }); };
  const isRiftKid = (F) => F.rift && F.stage === 'child';

  // --- The homesick: reading the mood --------------------------------------------------
  addSituation('rift.homesick', {
    pri: 2, read: (F) => F.rift && (F.riftHomesick === 'lost' || F.riftHomesick === 'homesick') && (F.mood === 'low' || F.mood === 'miserable'), thread: 'rift.sit.homesick',
    aps: {
      listen: { base: 1, out: ['quiet', 'talks', 'eases'] },
      warm: { base: 1, out: ['polite', 'talks', 'eases'] },
      share: { base: 1, out: ['polite', 'talks', 'opens'], know: (F) => F.riftArc.includes('home') },
      jest: { base: 0, out: ['stung', 'smile', 'laughs'] },
      advise: { base: 0, out: ['stung', 'think', 'plan'], know: (F) => !!F.riftHillFriend },
    },
  });
  lines('sit.rift.homesick.listen', [{ text: ['*You sit down beside them, and say nothing for a while.*'] }]);
  lines('sit.rift.homesick.warm', [{ text: ['You look a long way from home, {name}.'] }, { if: { hour: ['evening', 'night'] }, text: ['Long evening, {name}? They can be, the first few.'] }]);
  lines('sit.rift.homesick.share', [{ text: ['I know that look. I wore it for a hundred years, on and off.'] }]);
  lines('sit.rift.homesick.jest', [{ text: ['Cheer up, {name}. It might never happen. Mind you, it already has.'] }]);
  lines('sit.rift.homesick.advise', [{ text: ['Sitting alone won\'t mend it, {name}. Company might.'] }]);
  addThread({
    id: 'rift.sit.homesick', situation: true, label: 'A long way from home',
    beats: {
      quiet: { line: 'rift.sh.quiet', fx: { trust: 0.01 }, go: [
        { ap: 'warm', say: 'I\'ll sit a bit longer, if you don\'t mind.', to: 'talks' },
        { ap: 'ask', say: 'What were you thinking of, just then?', to: 'talks', need: { open: 1 } },
      ] },
      polite: { line: 'rift.sh.polite', go: [
        { ap: 'listen', say: '*You wait, in case there\'s more.*', label: 'Wait, in case there\'s more', to: 'talks' },
        { ap: 'ask', say: 'Is it the city you\'re missing, or someone in it?', to: 'someone', need: { open: 1 }, soft: true },
      ] },
      talks: { line: 'rift.sh.talks', fx: { open: 1, flag: 'vented' }, go: [
        { ap: 'comfort', say: 'It\'s allowed, missing it. It\'s a kind of keeping.', to: 'eases' },
        { ap: 'ask', say: 'Is it the city you\'re missing, or someone in it?', to: 'someone' },
        { ap: 'advise', say: 'Come and sit with folk at the Badger tonight. Just sit.', to: 'plan', need: { flag: 'vented' } },
      ] },
      eases: { line: 'rift.sh.eases', fx: { trust: 0.04, fond: 0.02, run: ease(0.06) }, go: [
        { ap: 'ask', say: 'And what\'s the best thing here, so far?', to: 'best' },
        { ap: 'warm', say: 'You\'re not on your own here. Not ever.', to: 'notalone' },
      ] },
      opens: { line: 'rift.sh.opens', fx: { trust: 0.05, open: 2, run: ease(0.05) }, go: [
        { ap: 'listen', say: '*You nod, and let them go on.*', label: 'Let them go on', to: 'someone' },
        { ap: 'ask', say: 'And what\'s the best thing here, so far?', to: 'best' },
      ] },
      someone: { line: 'rift.sh.someone', fx: { run: hookTo('rift.lost') }, go: [
        { ap: 'comfort', say: 'Then we\'ll keep them in mind together.', to: 'notalone' },
        { ap: 'warm', say: 'Tell me about them another day. When you\'re ready.', to: 'notalone' },
      ] },
      stung: { line: 'rift.sh.stung', fx: { fond: -0.02, sore: { days: 1 } }, end: true },
      smile: { line: 'rift.sh.smile', go: [
        { ap: 'warm', say: 'There. That\'s better. Signal coming back?', to: 'best' },
        { ap: 'ask', say: 'What\'s weighing on you, then?', to: 'talks' },
      ] },
      laughs: { line: 'rift.sh.laughs', fx: { fond: 0.03, run: ease(0.04) }, go: [
        { ap: 'jest', say: 'I\'m here all week. Longer, if the wagon wheel holds.', to: 'best' },
        { ap: 'ask', say: 'Go on. What\'s really wrong?', to: 'talks' },
      ] },
      think: { line: 'rift.sh.think', fx: { respect: 0.01 }, end: true },
      plan: { line: 'rift.sh.plan', fx: { respect: 0.04, run: all(ease(0.05), natterWith('riftHillFriend')) }, end: true },
      best: { line: 'rift.sh.best', fx: { fond: 0.02 }, end: true },
      notalone: { line: 'rift.sh.notalone', fx: { trust: 0.03, drive: { lonely: -0.15 } }, end: true },
    },
  });
  lines('rift.sh.quiet', [
    { text: ['...', '*They don\'t look up, but they shift over to make room.*', 'Thanks. For not asking.'] },
    { if: { temper: 'shy' }, text: ['*a small, grateful nod*', '...You can stay. If you want.'] },
    { if: { temper: 'ornery' }, text: ['If you\'re going to sit there, sit quiet. ...Okay. You are. Good.'] },
    { if: { hour: 'night' }, text: ['*They\'re watching the sky where the rift was, as if it might open again.*'] },
    { if: { stage: 'child' }, text: ['*sniffs, and leans on your sleeve a little*'] },
  ]);
  lines('rift.sh.polite', [
    { text: ['I\'m fine. Really. Just low signal today.', 'Bit far from home. It passes.', 'Oh, I\'m okay. Battery\'s low, that\'s all.'] },
    { if: { temper: 'proud' }, text: ['I\'m managing. I always manage.'] },
    { if: { temper: 'witty' }, text: ['A long way? Wizard, I\'m a whole universe from home. Give or take.'] },
    { if: { temper: 'cheerful' }, text: ['Ha, is it that obvious? I\'m usually the sunny one.'] },
    { if: { stage: 'child' }, text: ['I\'m not crying. It\'s the wind. There\'s a lot of wind here.'] },
  ]);
  lines('rift.sh.talks', [
    { text: ['It\'s just... everything here is so slow. Lovely. Slow. And I keep reaching for things that aren\'t there.', 'I woke up and forgot where I was. For a second I was home. Then I heard a cow.'] },
    { if: { riftHome: 'rain on neon' }, text: ['It rained last night and I went out in it, waiting for the colours. Pink, blue, green on the puddles. Nothing. Just wet.'] },
    { if: { riftHome: 'the night market' }, text: ['It\'s market night, back home. I can smell it. Chilli oil and hot solder. Then I breathe in and it\'s sheep.'] },
    { if: { riftHome: 'the hum of the city at night' }, text: ['It\'s too quiet to sleep. The city hummed. All night. Here there\'s just... me, breathing.'] },
    { if: { riftHome: 'trains that never stopped' }, text: ['I lie awake listening for the night train. Twelve past, forty past. It never comes. Of course it doesn\'t.'] },
    { if: { riftHome: 'the noodle stall under the overpass' }, text: ['I keep thinking of the noodle stall under the overpass. Steam, rain, the old man shouting orders. Gone.'] },
    { if: { riftHome: 'the rooftop gardens' }, text: ['I miss the rooftop gardens. Forty floors up, lettuces glowing. Here it\'s all ground. So much ground.'] },
    { if: { riftHome: 'a window full of screens' }, text: ['My window back home was full of screens. Faces, adverts, weather. Here the window\'s just... a field.'] },
    { if: { riftHome: 'the Lamplighter\'s glow on the clouds' }, text: ['Back home the clouds glowed. The Lamplighter lit them from underneath. Here the night\'s so black it hurts.'] },
    { if: { lost: (x) => !!x }, pri: 1, text: ['It\'s {lost}. I keep thinking {lost} will walk round a corner. There aren\'t even proper corners here.'] },
    { if: { stage: 'child' }, text: ['I want my own bed. The one by the window. With the blinky lights outside.'] },
    { if: { temper: 'gloomy' }, text: ['It\'s like being a song stuck halfway. No start. No end. Just here.'] },
  ]);
  lines('rift.sh.eases', [
    { text: ['...Yeah. Okay. Thanks, wizard. Signal\'s a bit better.', 'Huh. I feel lighter. Like I put a bag down.'] },
    { if: { temper: 'shy' }, text: ['...Nobody\'s ever just sat with me before. Thank you.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. That helped. Don\'t let it go to your hat.'] },
    { if: { temper: 'cheerful' }, text: ['Right! Okay! Battery back to sixty. Seventy, maybe.'] },
    { if: { temper: 'dreamy' }, text: ['Missing as keeping. I like that. I\'ll keep it.'] },
    { if: { stage: 'child' }, text: ['...Okay. I feel better. Can I have a biscuit?'] },
  ]);
  lines('rift.sh.opens', [
    { text: ['A hundred years? ...Then you know. You actually know. Nobody here knows.', 'You too? Huh. I thought wizards were born at home and stayed there.'] },
    { if: { temper: 'shy' }, text: ['...You do know. I can tell. Okay. Okay. I\'ll tell you.'] },
    { if: { temper: 'witty' }, text: ['A hundred years of homesick. That\'s a long buffer. How\'d you get through it?'] },
    { if: { riftHome: (x) => !!x }, text: ['It\'s {riftHome}. That\'s what I miss. Stupid thing to miss. I miss it every day.'] },
  ]);
  lines('rift.sh.someone', [
    { text: ['Someone. ...Yeah. Someone.', 'Both. Mostly someone.'] },
    { if: { lost: (x) => !!x }, text: ['{Lost}. My {lostRel}. That\'s all I can say today.', 'Someone called {lost}. I can\'t, not today. Sorry.'] },
    { if: { riftFound: (x) => !!x }, text: ['Not someone. {RiftFound}\'s here, thank the Lamp. It\'s everyone else. The whole street.'] },
    { if: { temper: 'gloomy' }, text: ['There\'s always someone, isn\'t there. That\'s the trouble with people.'] },
  ]);
  lines('rift.sh.stung', [
    { text: ['Wow. Okay. Thanks for that.', 'Not today, wizard. Not the jokes.'] },
    { if: { temper: 'ornery' }, text: ['Was that meant to help? Log off.'] },
    { if: { temper: 'proud' }, text: ['I don\'t need managing, thank you.'] },
    { if: { temper: 'shy' }, text: ['...Oh. Right. Okay.'] },
  ]);
  lines('rift.sh.smile', [
    { text: ['Ha. ...Okay, that\'s a bit funny.', '*a reluctant half-smile*'] },
    { if: { temper: 'witty' }, text: ['Low bar for a joke. Cleared it, though. Barely.'] },
  ]);
  lines('rift.sh.laughs', [
    { text: ['Ha! Oh, that\'s terrible. Thank you.', '*laughs despite everything* You\'re ridiculous.'] },
    { if: { temper: 'witty' }, text: ['Ha! Okay. You win this round, beardy.'] },
    { if: { stage: 'child' }, text: ['Hee! Say it again!'] },
  ]);
  lines('rift.sh.think', [
    { text: ['Maybe. I\'ll think about it.', 'Company. Yeah. Maybe tomorrow.'] },
    { if: { temper: 'ornery' }, text: ['I\'ll think about it. Don\'t push.'] },
  ]);
  lines('rift.sh.plan', [
    { text: ['The Badger. Okay. I\'ll go. I\'ll sit. I won\'t talk.', 'Copy that. Sit with folk. I can do sitting.'] },
    { if: { riftHillFriend: (x) => !!x }, pri: 1, text: ['Maybe I\'ll find {riftHillFriend}. {RiftHillFriend} always makes me laugh.'] },
    { if: { temper: 'shy' }, text: ['...If I go, will you be there? ...Okay. Okay, I\'ll go.'] },
  ]);
  lines('rift.sh.best', [
    { text: ['Best thing? Bread. Real bread. Warm. I could cry. I nearly did.', 'The rain tastes of clover. Nobody believes me. Try it.'] },
    { if: { riftHillFriend: (x) => !!x }, pri: 1, text: ['{RiftHillFriend}. Honestly? {RiftHillFriend}. Don\'t tell {riftHillFriend} I said.'] },
    { if: { season: 'spring' }, text: ['The way everything grows back. Nobody had to patch it. It just... does.'] },
    { if: { season: 'winter' }, text: ['Snow. Frozen static, falling slow. I stood in it for an hour.'] },
    { if: { stage: 'child' }, text: ['The frogs! You can just pick them UP.'] },
  ]);
  lines('rift.sh.notalone', [
    { text: ['...Copy that. Thanks, wizard.', 'Not ever. Okay. I\'ll hold you to that.'] },
    { if: { temper: 'gloomy' }, text: ['Not ever. ...I want to believe that. I\'m going to try.'] },
    { if: { temper: 'proud' }, text: ['I don\'t need... okay. Thank you. I mean it.'] },
  ]);

  // --- Tell me about Neverdark ----------------------------------------------------------
  addThread({
    id: 'rift.home', label: (F) => (F.riftHome ? 'Tell me about Neverdark' : 'Tell me about the city'), reveals: 'rift.home', weight: 1.3, cool: 4,
    when: (F) => F.rift && !!F.riftHome,
    rel: (F) => ({ lost: 1.8, homesick: 1.6, settling: 1.2, home: 0.8 }[F.riftHomesick] || 1),
    open: { warm: 'rift.home.open' },
    beats: {
      start: { line: 'rift.home.start', fx: { learn: ['rift.home', '{Name} misses {riftHome}, back in Neverdark.'], run: arcKnow('home') }, go: [
        { ap: 'ask', say: 'rift.home.ask', label: 'Ask what it was like', to: 'picture' },
        { ap: 'share', say: 'I\'ve seen great cities. None that never slept.', to: 'wizcity' },
        { ap: 'jest', say: 'rift.home.jest', label: 'Tease them about it', to: 'jested' },
      ] },
      picture: { line: 'rift.home.picture', notice: 'rift.home.notice', go: [
        { ap: 'listen', say: '*You let them talk.*', label: 'Let them go on', to: 'deeper' },
        { ap: 'ask', say: 'And do you miss it? Truly?', to: 'miss' },
        { ap: 'warm', say: 'It sounds beautiful, in its way.', to: 'beautiful' },
      ] },
      wizcity: { line: 'rift.home.wizcity', go: [
        { ap: 'tale', say: 'There was a city of lamps once, far in the south. They never slept either.', to: 'tale' },
        { ap: 'ask', say: 'Tell me about yours, then.', to: 'picture' },
      ] },
      jested: { line: 'rift.home.jested', go: [
        { ap: 'ask', say: 'Go on. Tell me properly.', to: 'picture' },
        { ap: 'jest', say: 'rift.home.jest2', label: 'Keep teasing', to: 'banter' },
      ] },
      banter: { line: 'rift.home.banter', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'All right, all right. I\'m listening. Really.', to: 'picture' },
        { ap: 'ask', say: 'And here? What would you miss of here?', to: 'here' },
      ] },
      deeper: { line: 'rift.home.deeper', fx: { trust: 0.02, open: 1 }, go: [
        { ap: 'ask', say: 'And here? What have you found here you\'d miss?', to: 'here' },
        { ap: 'comfort', say: 'It\'s still there, in you. Places are like that.', to: 'comforted' },
        { ap: 'ask', say: 'Who did you leave behind?', to: 'leftbehind', need: { open: 2 }, soft: true },
      ] },
      miss: { line: 'rift.home.miss', go: [
        { ap: 'comfort', say: 'It\'s no shame, missing a place.', to: 'comforted' },
        { ap: 'ask', say: 'And if you went back? Would you miss anything here?', to: 'here' },
      ] },
      beautiful: { line: 'rift.home.beautiful', go: [
        { ap: 'listen', say: '*You wait for the rest.*', label: 'Wait for the rest', to: 'deeper' },
        { ap: 'ask', say: 'And this valley? How does it look to you?', to: 'here' },
      ] },
      tale: { line: 'rift.home.tale', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'Maybe all lamp-cities are cousins.', to: 'deeper' },
        { ap: 'ask', say: 'And here? It\'s very dark here, by comparison.', to: 'here' },
      ] },
      here: { line: 'rift.home.here', go: [
        { ap: 'warm', say: 'Then you\'ve two homes. That\'s not nothing.', to: 'twohomes' },
        { ap: 'jest', say: 'Careful. Another month and you\'ll be smoking a pipe.', to: 'pipe' },
        { ap: 'ask', say: 'What\'s the strangest thing about us?', to: 'strange' },
      ] },
      strange: { line: 'rift.home.strange', fx: { fond: 0.01 }, go: [
        { ap: 'jest', say: 'We think the same about you. The hair, mostly.', to: 'pipe' },
        { ap: 'warm', say: 'You\'ll be one of the strange ones yourself soon.', to: 'twohomes' },
      ] },
      twohomes: { line: 'rift.home.twohomes', fx: { trust: 0.03, fond: 0.02, run: ease(0.03) }, end: true },
      pipe: { line: 'rift.home.pipe', fx: { fond: 0.02, joke: { k: 'rift.pipe', t: 'One more month and {name}\'ll be smoking a pipe.' } }, end: true },
      comforted: { line: 'rift.home.comforted', fx: { trust: 0.03, drive: { lonely: -0.08 }, run: ease(0.04) }, end: true },
      leftbehind: { line: 'rift.home.leftbehind', fx: { run: hookTo('rift.lost') }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('rift.home.open', [
    { text: ['Tell me about home, {name}. The city.', 'What was it like, Neverdark?', 'You must carry the city about with you. Tell me some of it.'] },
    { if: { hour: ['evening', 'night'] }, text: ['Nights must have been very different, back in your city.'] },
    { if: { weather: 'rain' }, text: ['Did it rain like this, in your city?'] },
    { if: { stage: 'child' }, text: ['What was your city like, {name}? Was it very big?'] },
  ]);
  lines('rift.home.start', [
    { text: ['Neverdark? Big. Loud. Bright. Never off. Not once. I miss {riftHome} most.', 'Home? It\'s {riftHome} I think of first. Always that.', 'You want the whole city or the bit I miss? The bit I miss is {riftHome}.'] },
    { if: { riftHome: 'rain on neon' }, text: ['Rain on neon. That\'s home. Every puddle a sign, every sign a puddle. Pink and blue all the way down.', 'When it rained the whole street lit up twice. Once in the air, once on the ground. I miss that.'] },
    { if: { riftHome: 'the night market' }, text: ['The night market. Under the flyover, every night, forever. Noodles, chips, fixers, fortune-tellers.', 'You could buy anything at the night market. A new eye, a hot pie, a song. Not all at the same stall.'] },
    { if: { riftHome: 'the hum of the city at night' }, text: ['The hum. The whole city hummed at night, low, like a cat. You slept on it like a mattress.', 'There was always a hum. Cables, fans, a million fridges. Here the silence is so loud I hear my own ears.'] },
    { if: { riftHome: 'trains that never stopped' }, text: ['The trains. They never stopped. Every four minutes, up on the rails, a river of windows.', 'I grew up by the line. The trains were my clock. Here the clock\'s a cockerel. He\'s less reliable.'] },
    { if: { riftHome: 'the noodle stall under the overpass' }, text: ['There was a noodle stall under the overpass. Old man, steam, rain. Best broth in Neverdark.', 'The noodle stall. Under the overpass. You queued in the rain and it was worth it every time.'] },
    { if: { riftHome: 'the rooftop gardens' }, text: ['The rooftop gardens. Forty floors up, lettuces under lamps, the whole city glittering below.', 'We grew things on the roofs. Rows and rows, all lit purple. Only green I ever saw, before here.'] },
    { if: { riftHome: 'a window full of screens' }, text: ['My window. Full of screens across the street. Adverts, faces, weather, news. Never dark.', 'I had a window full of screens. I could watch a hundred lives without leaving my bed.'] },
    { if: { riftHome: 'the Lamplighter\'s glow on the clouds' }, text: ['The Lamplighter\'s glow. It lit the clouds from underneath, all night, gold and pink. Like a ceiling.', 'At home the sky was a lid, lit up from below. The Lamplighter kept it glowing. Always.'] },
    { if: { temper: 'shy' }, text: ['Oh. Um. It was bright. Very bright. I miss {riftHome}, mostly.'] },
    { if: { temper: 'proud' }, text: ['Neverdark is the greatest city there ever was. And {riftHome}? The best of it.'] },
    { if: { temper: 'gloomy' }, text: ['Home. ...It\'s {riftHome} I miss. The rest was mostly noise. I miss the noise too.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, you\'ll love this! Neverdark! It never stops! And {riftHome}, wizard. {RiftHome}!'] },
    { if: { temper: 'witty' }, text: ['Neverdark. The name\'s not a metaphor. The power bill, though, is a tragedy.'] },
    { if: { temper: 'dreamy' }, text: ['Neverdark... I still see it when I close my eyes. {RiftHome}, mostly. Like a dream I keep having.'] },
    { if: { temper: 'ornery' }, text: ['Why does everyone ask that? ...Fine. {RiftHome}. That\'s what I miss. Happy?'] },
    { if: { temper: 'curious' }, text: ['Where do I start? The scale of it? The noise? {RiftHome}? I\'ll start with {riftHome}.'] },
    { if: { stage: 'child' }, text: ['It was SO big. And it was always lit up! And there was {riftHome}!'] },
    { if: { riftHomesick: 'home' }, pri: 1, text: ['Neverdark? Funny. I have to think, now. It\'s {riftHome} I remember. It\'s getting fuzzy round the edges.'] },
  ]);
  lines('rift.home.ask', [
    { text: ['What was it like, {riftHome}?', 'Paint it for me. {RiftHome}.'] },
    { if: { riftHome: 'the night market' }, text: ['What did they sell, at the night market?'] },
    { if: { riftHome: 'rain on neon' }, text: ['Rain on neon. What colours?'] },
  ]);
  lines('rift.home.jest', [
    { text: ['A city that never sleeps? No wonder you all look so tired.', 'Never dark? How did anyone ever have a decent nap?'] },
    { if: { riftHome: 'the noodle stall under the overpass' }, text: ['Noodles under a bridge? We have trolls for that sort of thing.'] },
    { if: { riftHome: 'trains that never stopped' }, text: ['Trains that never stop? Sounds like a very long way to miss your station.'] },
  ]);
  lines('rift.home.jest2', [{ text: ['And you all glowed, I suppose? Like glow-worms in a jar?', 'I bet even the cats had lamps on.'] }]);
  lines('rift.home.picture', [
    { text: ['Bright. Every colour at once. You never needed a candle. You needed sunglasses at midnight.', 'Everyone always going somewhere. Nobody ever arriving. You had to shout to think.'] },
    { if: { riftHome: 'rain on neon' }, text: ['Pink. Blue. That acid green. The rain came down and every drop carried a bit of sign with it.', 'You\'d walk home through it and your coat would be striped with light. I had a coat like that. Lost it in the crossing.'] },
    { if: { riftHome: 'the night market' }, text: ['Dumplings. Fixed eyes. Bootleg songs. A woman who\'d mend your heart-monitor and tell your fortune for one price.', 'Steam, solder, chilli oil, ozone. Someone always singing. You\'d meet everyone you knew and pretend you hadn\'t.'] },
    { if: { riftHome: 'the hum of the city at night' }, text: ['It was in the walls, the hum. In your teeth. You only noticed when it stopped, and it never stopped.', 'A low note. B flat, a friend said. The whole city in B flat. I hum it sometimes. Without meaning to.'] },
    { if: { riftHome: 'trains that never stopped' }, text: ['Up on the rails, all night, lit windows sliding past. You\'d see a stranger reading, then gone. Thousands of them.', 'The rattle came up through the floor. I counted them to sleep. Forty-one was usually enough.'] },
    { if: { riftHome: 'the noodle stall under the overpass' }, text: ['Old Pak\'s stall. Six stools, one pot, the rain dripping off the flyover in a curtain. Broth so hot it fixed your soul.', 'You sat elbow to elbow with couriers and medics and kids. Pak never wrote anything down. Never got an order wrong.'] },
    { if: { riftHome: 'the rooftop gardens' }, text: ['Rows of beds under purple lamps. Bees in little boxes, imported. Wind so strong up there you tied the lettuces down.', 'Forty floors up, nothing but sky and light. I\'d eat my lunch on the edge and watch the trains below like toys.'] },
    { if: { riftHome: 'a window full of screens' }, text: ['A wall of faces across the street. One sold soap, one sold sleep. One just smiled. I used to say goodnight to her.', 'Flicker, flicker, all night. The light came through the curtains in squares. I slept in a little chessboard.'] },
    { if: { riftHome: 'the Lamplighter\'s glow on the clouds' }, text: ['The clouds were lit gold from underneath. On good nights pink. On bad nights it flickered, and everyone went quiet.', 'You\'d look up and the sky was warm, like a lampshade. We said the Lamplighter was tucking us in.'] },
    { if: { temper: 'dreamy' }, text: ['Like living inside a firework that never finished going off. Beautiful and tiring. Mostly beautiful.'] },
    { if: { temper: 'gloomy' }, text: ['Crowded. Loud. Never dark. I hated it half the time. Now I\'d give anything for one more night of it.'] },
    { if: { temper: 'witty' }, text: ['Imagine your inn on a Highday. Now make it a hundred storeys tall and on fire with light. That\'s a quiet Tuesday.'] },
    { if: { stage: 'child' }, text: ['There were lights that moved! And talking walls! And a dog made of metal on our floor!'] },
  ]);
  lines('rift.home.notice', [
    { text: ['Their hand has drifted to the little copper kettle stitched on their sleeve.'] },
    { if: { riftTier: 2 }, text: ['The glow at their collar has dimmed while they talk, as if listening too.'] },
    { if: { riftBattery: ['low', 'flat'] }, text: ['Their visor flickers, low on charge, and they don\'t seem to notice.'] },
  ]);
  lines('rift.home.wizcity', [
    { text: ['Cities here? With what, candles? ...Sorry. Go on. Did they?', 'You\'ve been to cities? I thought this was all fields and pies.'] },
    { if: { temper: 'curious' }, text: ['Wait, there are cities here? Big ones? Lit? Tell me everything. Then I\'ll tell you mine.'] },
    { if: { temper: 'proud' }, text: ['None that never slept? Then you\'ve not seen a city. Not a real one.'] },
    { if: { temper: 'witty' }, text: ['None that never slept. Course not. Your cities have a curfew and a cup of cocoa.'] },
    { if: { stage: 'child' }, text: ['Did the cities have flying lights? Ours did!'] },
  ]);
  lines('rift.home.jested', [
    { text: ['Ha. We were tired. Tired and bright. Like a lamp that forgets to turn off.', 'Naps? We had naps. In lifts. Standing up.'] },
    { if: { temper: 'ornery' }, text: ['Oh, very funny. Nobody here\'s ever been anywhere and it shows.'] },
    { if: { temper: 'witty' }, text: ['Napping was illegal. Nearly. You needed a permit and a dark cupboard. Waiting list was years.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! We were exhausted! Brilliant, exhausted, all of us. Then I came here and slept twelve hours.'] },
    { if: { temper: 'shy' }, text: ['Oh. Ha. Yes. We were a bit tired.'] },
    { if: { stage: 'child' }, text: ['I never had a nap! Mum said naps were for robots on charge!'] },
  ]);
  lines('rift.home.banter', [
    { text: ['The cats had subscriptions. Don\'t ask.', 'Glow-worms in a jar! That\'s actually not far off. Ask anyone about the Glowworm Line.'] },
    { if: { temper: 'witty' }, text: ['Our cats had better lamps than your inn. And better manners than your cockerel.'] },
    { if: { temper: 'ornery' }, text: ['Keep it up and I\'ll fit your hat with a blinking light.'] },
  ]);
  lines('rift.home.deeper', [
    { text: ['And under all the noise, the people. Strangers, but your strangers. Same faces every night. I miss them more than the lights.', 'It wasn\'t the lights, really. It was knowing someone was always awake. You were never the only one up.'] },
    { if: { riftHome: 'the Lamplighter\'s glow on the clouds' }, pri: 1, text: ['We had a saying: the Lamplighter\'s awake, so you can sleep. Lately it\'s been flickering. Before I came. I didn\'t like that.'] },
    { if: { riftHome: 'the noodle stall under the overpass' }, pri: 1, text: ['Pak used to save me the last bowl. Never charged me. I never said thank you properly. I keep thinking about that.'] },
    { if: { riftHome: 'the night market' }, pri: 1, text: ['The market was where you found out who was okay. Who\'d had a bad week. Who needed a hand. Like your inn, I suppose.'] },
    { if: { riftStage: { min: 6 } }, text: ['Thing is, the lights were going out, at the end. One street a week. We pretended not to notice. Everyone noticed.'] },
    { if: { temper: 'shy' }, text: ['...There was a window across the way. Someone always waved at me. I never knew their name. I hope they\'re okay.'] },
    { if: { temper: 'gloomy' }, text: ['You don\'t miss places. You miss who you were in them. I was someone else there. Faster. Brighter. Tireder.'] },
    { if: { temper: 'dreamy' }, text: ['Sometimes I think the city was dreaming us, and we were dreaming it back. Now one of us has woken up.'] },
    { if: { temper: 'proud' }, text: ['I knew every street. Every shortcut. People asked me the way. Here I get lost between the mill and the pond.'] },
  ]);
  lines('rift.home.miss', [
    { text: ['Truly? Every day. Less than I did, though. Is that bad?', 'Like a tooth. You keep touching the gap.'] },
    { if: { riftHomesick: 'lost' }, text: ['Miss it? I can\'t breathe for missing it. Some mornings I can\'t get up.'] },
    { if: { riftHomesick: 'homesick' }, text: ['Most days, yeah. Then something here makes me laugh and I forget for a whole hour.'] },
    { if: { riftHomesick: 'settling' }, text: ['Less than I thought. Some days I don\'t think of it at all. Then I feel guilty about that.'] },
    { if: { riftHomesick: 'home' }, text: ['Truly? Not much, these days. Is that terrible? I think it might be terrible. It doesn\'t feel terrible.'] },
    { if: { temper: 'ornery' }, text: ['What do you think? Course I miss it. Next question.'] },
    { if: { stage: 'child' }, text: ['Sometimes. When it\'s dark. Not when there\'s pudding.'] },
  ]);
  lines('rift.home.beautiful', [
    { text: ['Beautiful? It was loud. ...Yeah. It was beautiful. Nobody ever said so out loud.', 'Huh. Nobody\'s called it beautiful before. Neon\'s not meant to be beautiful. It\'s meant to sell soap.'] },
    { if: { temper: 'dreamy' }, text: ['It was. Wasn\'t it? Like a jewellery box someone left open in the rain.'] },
    { if: { temper: 'proud' }, text: ['It was magnificent. Finally, someone who sees it.'] },
    { if: { temper: 'gloomy' }, text: ['Beautiful like a fever. You don\'t want to stay in it. You miss it when it breaks.'] },
  ]);
  lines('rift.home.tale', [
    { text: ['A city of lamps? Here? Really? So we weren\'t the only ones. Huh.', 'They never slept either? Were they happy? ...You don\'t have to answer that.'] },
    { if: { temper: 'curious' }, text: ['Where? How far south? Could I walk there? Did they have power? How did they make it?'] },
    { if: { temper: 'witty' }, text: ['Lamp cities. We should start a club. Badges. Very bright badges.'] },
    { if: { stage: 'child' }, text: ['Can we go there? Can we go TOMORROW?'] },
  ]);
  lines('rift.home.here', [
    { text: ['Here? Second breakfast. I\'d miss second breakfast so badly. Nobody in Neverdark ate twice before noon.', 'The bread. The quiet. People saying good morning and meaning it. That\'s new.'] },
    { if: { hour: 'night' }, text: ['The stars. I\'d never seen a star until I fell out of the sky. Now I can\'t stop looking.'] },
    { if: { weather: 'rain' }, text: ['This. The rain. It tastes of clover. Back home it stung. I stand in it on purpose now.'] },
    { if: { riftHillFriend: (x) => !!x }, pri: 1, text: ['{RiftHillFriend}. I\'d miss {riftHillFriend} so much it\'d short me out.'] },
    { if: { riftTraditions: 'breakfast' }, text: ['Second breakfast. It\'s a tradition now and I\'m proud I helped. Well. I ate a lot of them.'] },
    { if: { season: 'autumn' }, text: ['The trees changing colour on their own. No software. They just decide. I\'d miss that.'] },
    { if: { temper: 'gloomy' }, text: ['The quiet. I hated it. Now I think I\'d miss it. Don\'t tell anyone, it ruins my whole thing.'] },
    { if: { temper: 'witty' }, text: ['Your scones. Weapon-grade. Back home they\'d have to register them.'] },
    { if: { temper: 'cheerful' }, text: ['Everything! Hedgehogs! Puddles! Tea! Did you know tea is FREE here? If you know a hobbit, anyway.'] },
    { if: { stage: 'child' }, text: ['Frogs. And mud. And nobody tells you off for mud, much.'] },
  ]);
  lines('rift.home.strange', [
    { text: ['You eat seven times a day and nobody\'s ever been hacked. And you give presents away on your own birthday!', 'You have one word for "evening" and forty for "pie". Priorities, I suppose.'] },
    { if: { temper: 'witty' }, text: ['Your news travels at the speed of a postie with a limp, and it\'s still somehow faster than ours.'] },
    { if: { temper: 'curious' }, text: ['Mathoms. Things nobody wants, kept forever, given to people who don\'t want them either. I\'m studying it.'] },
    { if: { temper: 'ornery' }, text: ['The staring. You lot stare like it\'s a sport. I\'ll start charging.'] },
    { if: { stage: 'child' }, text: ['Your hole doors are ROUND! Why are they round? Ours were square! Square is boring!'] },
  ]);
  lines('rift.home.twohomes', [
    { text: ['Two homes. Huh. One in my head, one under my feet. Okay. I like that.', 'Not nothing. ...No. It\'s not nothing, is it?'] },
    { if: { temper: 'gloomy' }, text: ['Two homes, or two halves of none. ...Okay. I\'ll try it your way. Two.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. I\'m keeping that.'] },
    { if: { temper: 'proud' }, text: ['Two homes. Twice as much to be proud of. I like your arithmetic.'] },
    { if: { stage: 'child' }, text: ['Two homes! Then I get two beds! ...Do I get two puddings?'] },
  ]);
  lines('rift.home.pipe', [
    { text: ['A pipe! Ha. Never. ...I did try one. I coughed till the hens left.', 'Ha! Don\'t. I\'ve already got a waistcoat. It\'s a slippery slope.'] },
    { if: { riftTier: { max: 1 } }, pri: 1, text: ['Too late. Look. Wool waistcoat. I\'m halfway to a pipe already. Send help.'] },
    { if: { temper: 'ornery' }, text: ['Over my dead battery.'] },
    { if: { temper: 'witty' }, text: ['A pipe? Smoke you inhale on purpose? We spent a century filtering that out.'] },
  ]);
  lines('rift.home.comforted', [
    { text: ['...Yeah. Okay. Still in me. Copy that.', 'Thanks, wizard. Signal\'s better.'] },
    { if: { temper: 'ornery' }, text: ['Hm. Right. Thank you. Don\'t make a thing of it.'] },
    { if: { temper: 'dreamy' }, text: ['Like a song you can\'t unlearn. Yes. I\'d rather keep it than lose it.'] },
  ]);
  lines('rift.home.leftbehind', [
    { text: ['That\'s... another story. Ask me another day.', 'Not today. But I\'ll tell you. I think I will.'] },
    { if: { temper: 'shy' }, text: ['...Can I tell you that one later? It\'s a big one.'] },
    { if: { temper: 'ornery' }, text: ['Ask me tomorrow. If you ask nicely. And bring cake.'] },
  ]);

  // --- The one they lost ----------------------------------------------------------------
  const lostLabel = (F) => (F.riftArc && F.riftArc.includes('lost') && F.riftLost ? `About ${F.riftLost}` : 'Who did you leave behind?');
  addThread({
    id: 'rift.lost', label: lostLabel, reveals: 'rift.lost', weight: 1.2, cool: 5,
    when: (F) => F.rift && !!F.riftLost,
    rel: (F) => (F.riftFound ? 1.4 : F.trust > 0.15 || F.fond > 0.3 ? 1.5 : 0.8),
    open: { warm: 'rift.lost.open' },
    beats: {
      start: { line: 'rift.lost.start', go: [
        { ap: 'warm', say: 'Only if you want to tell me.', to: [{ to: 'found', need: { if: { riftFound: (x) => !!x } } }, { to: 'name', need: { open: 1 } }, 'notyet'] },
        { ap: 'share', say: 'I\'ve left people behind too. On roads. In years.', to: [{ to: 'found', need: { if: { riftFound: (x) => !!x } } }, 'name'] },
        { ap: 'ask', say: 'Family? Friends?', to: [{ to: 'found', need: { if: { riftFound: (x) => !!x } } }, { to: 'name', need: { open: 2 } }, 'notyet'] },
      ] },
      notyet: { line: 'rift.lost.notyet', go: [
        { ap: 'comfort', say: 'Another time, then. I\'m not going anywhere.', to: 'later' },
        { ap: 'listen', say: '*You wait. Quietly.*', label: 'Wait, quietly', to: [{ to: 'name', need: { open: 0 } }, 'closed'] },
      ] },
      later: { line: 'rift.lost.later', fx: { trust: 0.02, run: hookTo('rift.lost') }, end: true },
      closed: { line: 'rift.lost.closed', fx: { sore: { days: 1 } }, end: true },
      name: { line: 'rift.lost.name', fx: { learn: ['rift.lost', 'Lost {their} {riftLostRel}, {riftLost}, in the crossing.'], run: arcKnow('lost'), trust: 0.02 }, go: [
        { ap: 'ask', say: 'What happened, in the crossing?', to: 'crossing' },
        { ap: 'ask', say: 'Tell me about {riftLost}.', to: 'who' },
        { ap: 'comfort', say: 'I\'m so sorry, {name}.', to: 'sorry' },
      ] },
      crossing: { line: 'rift.lost.crossing', go: [
        { ap: 'comfort', say: 'I\'m sorry. Nobody could have held on through that.', to: 'sorry' },
        { ap: 'ask', say: 'Do you think {riftLostThey} got out?', to: 'hope' },
      ] },
      who: { line: 'rift.lost.who', notice: 'rift.lost.notice', go: [
        { ap: 'warm', say: 'Someone like that finds a way through. Don\'t you think?', to: 'hope' },
        { ap: 'jest', say: 'Sounds like trouble. I like {riftLostThem} already.', to: 'laugh' },
      ] },
      sorry: { line: 'rift.lost.sorry', go: [
        { ap: 'warm', say: 'I\'ll keep {riftLost}\'s name in mind. If ever the sky brings it, you\'ll know.', to: 'promise', need: { when: (F) => !F.riftKept } },
        { ap: 'listen', say: '*You let the quiet sit.*', label: 'Let the quiet sit', to: 'hope' },
      ] },
      hope: { line: 'rift.lost.hope', go: [
        { ap: 'warm', say: 'I\'ll keep {riftLost}\'s name in mind. If ever the sky brings it, you\'ll know.', to: 'promise', need: { when: (F) => !F.riftKept } },
        { ap: 'share', say: 'I\'ve waited for people. Some came. That\'s worth remembering.', to: 'wizhope' },
        { ap: 'ask', say: 'What would you say to {riftLostThem}, if you could?', to: 'say', need: { open: 2 }, soft: true },
      ] },
      laugh: { line: 'rift.lost.laugh', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'I\'ll keep {riftLost}\'s name in mind. If ever the sky brings it, you\'ll know.', to: 'promise', need: { when: (F) => !F.riftKept } },
        { ap: 'ask', say: 'Do you think {riftLostThey} got out?', to: 'hope' },
      ] },
      say: { line: 'rift.lost.say', fx: { trust: 0.04, confide: { k: 'rift.lost.say', t: '{Name} would tell {riftLost} sorry, and that the bread here is real', secret: false } }, go: [
        { ap: 'warm', say: 'I\'ll keep {riftLost}\'s name in mind. If ever the sky brings it, you\'ll know.', to: 'promise', need: { when: (F) => !F.riftKept } },
        { ap: 'comfort', say: 'Then you\'ll say it. One day. I believe that.', to: 'wizhope' },
      ] },
      promise: { line: 'rift.lost.promise', fx: { run: all(keepName, ease(0.05)), trust: 0.05, fond: 0.03, promise: { k: 'rift.lost', t: 'You said you\'d keep {riftLost} in mind', days: 60 } }, end: true },
      wizhope: { line: 'rift.lost.wizhope', fx: { trust: 0.03, run: ease(0.03) }, end: true },
      found: { line: 'rift.lost.found', fx: { learn: ['rift.lost', 'Found {their} {riftLostRel}, {riftFound}, again: the sky gave them back.'], run: arcKnow('lost') }, go: [
        { ap: 'warm', say: 'I was so glad to hear it.', to: 'foundnow' },
        { ap: 'ask', say: 'How is {riftFound} settling in?', to: 'foundnow' },
        { ap: 'jest', say: 'And are you sick of each other yet?', to: 'foundjest' },
      ] },
      foundnow: { line: 'rift.lost.foundnow', fx: { fond: 0.03 }, end: true },
      foundjest: { line: 'rift.lost.foundjest', fx: { fond: 0.02, joke: { k: 'rift.found', t: 'Are you and {riftFound} sick of each other yet?' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('rift.lost.open', [
    { text: ['Did you come through alone, {name}?', 'Is there someone you left behind, {name}?', 'You came through the sky. Did anyone come with you?'] },
    { if: { riftArc: 'lost', riftLost: (x) => !!x }, text: ['Any word of {riftLost}, {name}?', 'I\'ve been thinking about {riftLost}.'] },
  ]);
  lines('rift.lost.start', [
    { text: ['Behind? ...Lots. Everyone, really.', 'Alone. Wasn\'t meant to be.', 'Hm. That\'s a big question for a lane.'] },
    { if: { temper: 'shy' }, text: ['...Oh. Um. Yes. Someone.'] },
    { if: { temper: 'ornery' }, text: ['Why d\'you want to know?'] },
    { if: { temper: 'proud' }, text: ['I came through on my own two feet. ...Not on my own, though. Not by choice.'] },
    { if: { temper: 'cheerful' }, text: ['Oh. That one. I\'m usually better at smiling than this.'] },
    { if: { temper: 'gloomy' }, text: ['Everyone leaves someone. I left the wrong one.'] },
    { if: { temper: 'witty' }, text: ['Left behind is a strong word. Misplaced. Across a universe. Ongoing.'] },
    { if: { temper: 'dreamy' }, text: ['I still feel them. Like a hand you\'ve just let go of.'] },
    { if: { temper: 'curious' }, text: ['You know, nobody here has asked me that. They ask about the eye. Never about who.'] },
    { if: { stage: 'child' }, text: ['I\'m not allowed to be sad about it. I am though.'] },
    { if: { riftFound: (x) => !!x }, pri: 2, text: ['I did, once. Then the sky gave {riftFound} back. Can you believe it? I still can\'t.'] },
    { if: { riftArc: 'lost' }, pri: 1, text: ['You remembered. About {riftLost}. Most folk forget the name.'] },
  ]);
  lines('rift.lost.notyet', [
    { text: ['Not yet. Sorry. Not yet.', 'I... can\'t. Not today.'] },
    { if: { temper: 'ornery' }, text: ['That\'s mine. I don\'t hand it out.'] },
    { if: { temper: 'shy' }, text: ['*shakes their head, very small*'] },
    { if: { temper: 'proud' }, text: ['I don\'t talk about that. It\'s nobody\'s business.'] },
    { if: { stage: 'child' }, text: ['I\'m not telling. You\'ll make me cry and then I\'ll be cross.'] },
  ]);
  lines('rift.lost.later', [
    { text: ['...Thanks. Really. I\'ll tell you. I think I will.', 'Okay. Another time. Copy that.'] },
    { if: { temper: 'ornery' }, text: ['Hm. Good. You\'re less nosy than you look.'] },
  ]);
  lines('rift.lost.closed', [{ text: ['Leave it. Please.', 'No. Not today, wizard.'] }, { if: { temper: 'ornery' }, text: ['I said no. Waiting won\'t change it.'] }]);
  lines('rift.lost.name', [
    { text: ['My {riftLostRel}. {RiftLost}. We were meant to come through together.', '{RiftLost}. My {riftLostRel}. We held on. And then we didn\'t.'] },
    { if: { riftLostRel: 'brother' }, text: ['My little brother. {RiftLost}. He was holding my sleeve. He\'s always holding my sleeve.'] },
    { if: { riftLostRel: 'sister' }, text: ['My sister. {RiftLost}. She went first, to show me it was safe. That\'s her all over.'] },
    { if: { riftLostRel: 'mother' }, text: ['My mum. {RiftLost}. She pushed me through. Said she\'d be right behind. She always says that.'] },
    { if: { riftLostRel: 'father' }, text: ['My dad. {RiftLost}. He packed us sandwiches for the crossing. Sandwiches. For a rift.'] },
    { if: { riftLostRel: 'partner' }, text: ['{RiftLost}. My partner. We\'d been together nine years. Nine years and one bad door.'] },
    { if: { riftLostRel: 'best friend' }, text: ['My best friend. {RiftLost}. We grew up on the same landing. Did everything together. Nearly everything.'] },
    { if: { riftLostRel: 'daughter' }, text: ['My daughter. {RiftLost}. She\'s clever. Cleverer than me. If anyone got out, she did.'] },
    { if: { riftLostRel: 'son' }, text: ['My son. {RiftLost}. He wanted to go first. I said no. Then the light took us both, different ways.'] },
    { if: { temper: 'shy' }, text: ['...{RiftLost}. My {riftLostRel}. I haven\'t said the name out loud in weeks.'] },
    { if: { temper: 'gloomy' }, text: ['{RiftLost}. My {riftLostRel}. I say it to myself so I don\'t forget the sound.'] },
  ]);
  lines('rift.lost.crossing', [
    { text: ['Light. Noise. Like falling up. I had a hand in mine and then the rift spat me onto your meadow and the hand was gone.', 'Everything went white and loud. Then I was in long grass with a sheep looking at me. Alone.'] },
    { if: { riftLostRel: ['brother', 'sister', 'son', 'daughter'] }, text: ['I was holding on. I swear I was. Something pulled. I came out here. {RiftLost} came out... somewhere.'] },
    { if: { riftLostRel: ['mother', 'father'] }, text: ['{RiftLost} pushed me in first. I heard a shout behind me. Then static. That\'s the last I have.'] },
    { if: { temper: 'witty' }, text: ['You know when you miss a step in the dark? That, for a minute, and then a sheep.'] },
    { if: { temper: 'curious' }, text: ['I\'ve gone over it a thousand times. The frequency jumped. Two doors, maybe. One here. One... I don\'t know.'] },
    { if: { stage: 'child' }, text: ['It went BANG and sparkly and then I was in a field. I shouted and shouted.'] },
  ]);
  lines('rift.lost.who', [
    { text: ['{RiftLost}? Stubborn. Funny. Hums when {riftLostThey} thinks. Terrible at mornings.', 'Clever hands. Bad jokes. The kind of laugh that makes strangers laugh too.'] },
    { if: { riftLostRel: 'brother' }, text: ['He fixes things that aren\'t broken. Drove our neighbours mad. He\'d love your mill. He\'d take it apart.'] },
    { if: { riftLostRel: 'sister' }, text: ['She\'s bossy. Brave. She\'d have this whole village organised in a week and you\'d thank her.'] },
    { if: { riftLostRel: 'mother' }, text: ['She sang. All the time, badly. Old songs nobody else knew. I didn\'t know I\'d miss the singing.'] },
    { if: { riftLostRel: 'father' }, text: ['He told the worst jokes in Neverdark. On purpose. He\'d have loved your hobbits. They\'d have hated his jokes.'] },
    { if: { riftLostRel: 'partner' }, text: ['{RiftLost} makes tea wrong. Too strong. I\'d drink it wrong every day for the rest of my life.'] },
    { if: { riftLostRel: 'best friend' }, text: ['We had a code. Three pings meant trouble. Two meant noodles. I still send two, some nights. Into nothing.'] },
    { if: { riftLostRel: ['son', 'daughter'] }, text: ['Small. Fierce. Asks why about everything. Your children would love {riftLostThem}. {RiftLostThey} would love the frogs.'] },
    { if: { temper: 'dreamy' }, text: ['{RiftLost} sees things. Colours in the static. Faces in clouds. I used to tease. I\'d give anything to be told one now.'] },
  ]);
  lines('rift.lost.notice', [{ text: ['They\'re turning a little bent ring round and round on one finger.'] }, { if: { riftTier: 2 }, text: ['A message light blinks on their wrist. Unsent. It\'s been blinking the whole time.'] }]);
  lines('rift.lost.sorry', [
    { text: ['Thanks. Everyone says sorry and then changes the subject. You didn\'t.', '...Yeah. Me too.'] },
    { if: { temper: 'ornery' }, text: ['Sorry doesn\'t open rifts. ...But thanks. I mean it.'] },
    { if: { temper: 'proud' }, text: ['I don\'t need pity. ...I\'ll take a bit of company, though.'] },
    { if: { stage: 'child' }, text: ['...Can I hold your sleeve? Just for a bit?'] },
  ]);
  lines('rift.lost.hope', [
    { text: ['Somewhere with no signal, I hope. Not nowhere. Somewhere.', 'I have to think so. If I stop thinking so, I stop.'] },
    { if: { temper: 'cheerful' }, text: ['Yes! I think so. I\'ve decided to think so. Every morning, I decide again.'] },
    { if: { temper: 'gloomy' }, text: ['I don\'t know. Some nights I think yes. Some nights I don\'t think at all.'] },
    { if: { temper: 'curious' }, text: ['Rifts keep opening. Same frequency. If I came through, anyone could. Statistically. I\'ve done the sums.'] },
    { if: { riftOpen: true }, pri: 1, text: ['There\'s a rift open right now. Every time, I go and watch. Every face that steps out, I look.'] },
    { if: { riftSeeking: true }, pri: 1, text: ['We\'re working on the frequency, at the scar. If we can open a door home, maybe I can find {riftLostThem}.'] },
  ]);
  lines('rift.lost.laugh', [
    { text: ['Ha! Trouble. Yeah. You would. Everyone does.', '*laughs, and wipes an eye* Trouble. Exactly.'] },
    { if: { temper: 'witty' }, text: ['You\'d lose an argument to {riftLostThem} in four seconds. I\'d pay to watch.'] },
  ]);
  lines('rift.lost.say', [
    { text: ['Sorry I let go. And the bread here is real. You\'d cry. I did.', 'That I\'m okay. That there\'s a place with soft dark. That I kept a bed for {riftLostThem}.'] },
    { if: { riftLostRel: 'partner' }, text: ['That I\'m still wearing the ring. That I learned to make tea properly. Hobbit-properly. You\'d hate it.'] },
    { if: { riftLostRel: ['mother', 'father'] }, text: ['That I ate my greens. Real greens. Out of the ground. You\'d be so smug.'] },
    { if: { temper: 'shy' }, text: ['...I\'d just say the name. And then I wouldn\'t need to say anything else.'] },
    { if: { temper: 'witty' }, text: ['"You\'re late." Then I\'d hug {riftLostThem} till something cracked.'] },
  ]);
  lines('rift.lost.promise', [
    { text: ['You\'d do that? Keep the name? ...Thank you. Thank you.', 'If anyone can catch a name out of the sky, it\'s a wizard. Copy that. Thank you.'] },
    { if: { temper: 'ornery' }, text: ['Hm. You\'d better. I\'ll know if you forget.'] },
    { if: { temper: 'shy' }, text: ['...Nobody else is keeping it. Just me. Now you. That\'s... two. Two is better.'] },
    { if: { temper: 'cheerful' }, text: ['Full signal! You\'re the best wizard. The only wizard. Still the best.'] },
    { if: { stage: 'child' }, text: ['Pinkie promise? Wizards have to keep pinkie promises. It\'s the law.'] },
  ]);
  lines('rift.lost.wizhope', [
    { text: ['Some came. Okay. I\'ll hold onto that one.', '...That helps more than you\'d think.'] },
    { if: { temper: 'gloomy' }, text: ['Some came. Some. ...It\'s a better number than none.'] },
  ]);
  lines('rift.lost.found', [
    { text: ['{RiftFound} came through! Through! I saw the face and I ran so fast I lost a boot.', 'The sky gave {riftFound} back. Here, of all places. I still wake up and check.'] },
    { if: { temper: 'cheerful' }, text: ['{RiftFound}\'s HERE! Have you met? You must meet! Full signal, wizard, full signal forever!'] },
    { if: { temper: 'gloomy' }, text: ['{RiftFound} came. I\'m waiting for it to go wrong. It hasn\'t. Every day it hasn\'t.'] },
    { if: { temper: 'shy' }, text: ['...{RiftFound}\'s here. I don\'t have words. I just keep looking at {riftLostThem}.'] },
  ]);
  lines('rift.lost.foundnow', [
    { text: ['Settling? {RiftFound} has opinions on every hedge in the valley. Already.', 'Better than me. {RiftFound} ate three breakfasts on day one. Took me a month.'] },
    { if: { riftLostRel: ['brother', 'son'] }, text: ['He\'s taken the mill-wheel apart twice. The miller\'s furious. The wheel\'s never run better.'] },
    { if: { riftLostRel: ['sister', 'daughter'] }, text: ['She\'s already organised the hens. The hens are thriving. The hobbits are scared of her. Good.'] },
  ]);
  lines('rift.lost.foundjest', [{ text: ['Ha! Already? Day two. But I\'d go through the rift again to be sick of {riftLostThem}.', 'Sick of each other? We had a row about a spoon. It was the best row of my life.'] }]);

  // --- What they did, in the city -------------------------------------------------------
  addThread({
    id: 'rift.knack', label: 'What did you do, in the city?', reveals: 'rift.knack', weight: 1.1, cool: 4,
    when: (F) => F.rift && !!F.riftKnack && F.stage !== 'child',
    rel: (F) => (F.riftArc.includes('skill') ? 0.8 : 1.3),
    open: { ask: 'rift.knack.open' },
    beats: {
      start: { line: 'rift.knack.start', fx: { learn: ['rift.knack', 'Was {riftKnackWord} in Neverdark.'], run: arcKnow('skill') }, go: [
        { ap: 'ask', say: 'And were you good at it?', to: 'good' },
        { ap: 'jest', say: 'rift.knack.jest', label: 'Tease them about it', to: 'teased' },
        { ap: 'ask', say: 'Is there anything like it here?', to: 'here' },
      ] },
      good: { line: 'rift.knack.good', go: [
        { ap: 'ask', say: 'What was the best day of it?', to: 'bestday' },
        { ap: 'warm', say: 'It shows. You\'ve that look about you.', to: 'here' },
      ] },
      teased: { line: 'rift.knack.teased', go: [
        { ap: 'ask', say: 'Go on, what was the best day of it?', to: 'bestday' },
        { ap: 'warm', say: 'I mean it kindly. It\'s a real gift.', to: 'here' },
      ] },
      bestday: { line: 'rift.knack.bestday', fx: { trust: 0.02 }, go: [
        { ap: 'listen', say: '*You wait. There\'s a worse day behind that one.*', label: 'Wait for the rest', to: 'worstday', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'And now you\'re here, doing it among us.', to: 'here' },
      ] },
      worstday: { line: 'rift.knack.worstday', fx: { trust: 0.03 }, go: [
        { ap: 'comfort', say: 'You did what you could. That\'s all anyone does.', to: 'here' },
        { ap: 'ask', say: 'Was that the start of the dark?', to: 'dark', need: { if: { riftStage: { min: 4 } } } },
      ] },
      dark: { line: 'rift.knack.dark', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'Then it\'s a mercy you brought the knack with you.', to: 'here' },
      ] },
      here: { line: 'rift.knack.here', go: [
        { ap: 'advise', say: 'You should talk to {riftJobMate} the {riftJobWord}.', to: 'advised', need: { if: { riftJobMate: (x) => !!x } } },
        { ap: 'warm', say: 'The valley\'s lucky to have you.', to: 'thanks' },
        { ap: 'jest', say: 'Just don\'t fit the sheep with lights.', to: 'sheep' },
      ] },
      advised: { line: 'rift.knack.advised', fx: { respect: 0.03, run: natterWith('riftJobMate') }, end: true },
      thanks: { line: 'rift.knack.thanks', fx: { fond: 0.02 }, end: true },
      sheep: { line: 'rift.knack.sheep', fx: { fond: 0.02, joke: { k: 'rift.sheep', t: 'Glow-in-the-dark sheep. The wizard said no.' } }, end: true },
    },
    end: { fond: 0.02, respect: 0.01 },
  });
  lines('rift.knack.open', [
    { text: ['What did you do, back in the city, {name}?', 'What was your work, over there?', 'You\'ve clever hands, {name}. What did they do, in Neverdark?'] },
    { if: { job: (j) => !!j }, text: ['Was it {jobWord}ing, back home too?'] },
  ]);
  lines('rift.knack.start', [
    { text: ['I kept busy. City keeps you busy.'] },
    { if: { riftKnack: 'courier' }, text: ['Courier. I ran parcels across the rooftops. Fastest feet in the eastern stack.', 'Courier. Rooftop to rooftop, packages, medicine, love letters. Mostly love letters, at the end.'] },
    { if: { riftKnack: 'gridtech' }, text: ['Grid-tech. I kept the lights on. Junctions, cables, the whole hum of it.', 'I kept the grid up. Forty districts. Your mill-wheel makes me homesick, honestly.'] },
    { if: { riftKnack: 'medic' }, text: ['Street medic. Patched folk up under the overpass. No questions, no charge.', 'Medic. Not a proper one. The sort you went to when the proper ones wouldn\'t see you.'] },
    { if: { riftKnack: 'cook' }, text: ['I had a noodle stall. Under the overpass. Best broth in Neverdark, ask anyone.', 'Cook. Six stools, one pot, open till dawn. Every dawn.'] },
    { if: { riftKnack: 'teacher' }, text: ['Teacher. The little ones. Numbers, binary first, then the rest.', 'I taught. A room of thirty kids and one flickering screen. I loved it.'] },
    { if: { riftKnack: 'grower' }, text: ['Rooftop grower. Lettuces under lamps, forty storeys up.', 'I grew food on roofs. Under purple light. I\'d never seen soil that wasn\'t in a box.'] },
    { if: { riftKnack: 'courier', temper: 'proud' }, text: ['Courier. Best in the stack. Nobody beat my times. Nobody came close.'] },
    { if: { riftKnack: 'gridtech', temper: 'shy' }, text: ['Oh, I... fixed wires. Lots of wires. It was a big grid.'] },
    { if: { riftKnack: 'medic', temper: 'gloomy' }, text: ['Medic. Busy, at the end. Too busy. I patched folk who just came back worse.'] },
    { if: { riftKnack: 'cook', temper: 'cheerful' }, text: ['I COOKED! Noodles! Under a bridge! I\'ll make you some. You\'ll weep. Everybody weeps.'] },
    { if: { riftKnack: 'teacher', temper: 'curious' }, text: ['Taught! Kids, mostly. The trick\'s to let them ask the questions. Like you\'re doing. Sneaky.'] },
    { if: { riftKnack: 'grower', temper: 'dreamy' }, text: ['I grew things in the sky. Little green rooms above the noise. It was the quietest place in the city.'] },
    { if: { riftKnack: 'gridtech', temper: 'witty' }, text: ['I kept a city of ten million people lit. Your inn has four candles and they\'re all out.'] },
    { if: { riftKnack: 'courier', temper: 'ornery' }, text: ['Courier. Carried what people couldn\'t be bothered to carry themselves. Same as here, really.'] },
  ]);
  lines('rift.knack.jest', [
    { text: ['And was there much call for that?'] },
    { if: { riftKnack: 'courier' }, text: ['Rooftop running? Our postie can barely manage a stile.'] },
    { if: { riftKnack: 'gridtech' }, text: ['Keeping lights on? I\'ve done that. With a staff. In one go.'] },
    { if: { riftKnack: 'medic' }, text: ['A medic? Can you fix a wizard\'s back after a night in a wagon?'] },
    { if: { riftKnack: 'cook' }, text: ['Noodles? Long, thin and slippery. Sounds like a lawyer.'] },
    { if: { riftKnack: 'teacher' }, text: ['Teaching numbers in ones and noughts? Our children can barely manage the ones.'] },
    { if: { riftKnack: 'grower' }, text: ['Lettuces in the sky? I\'d have thought they\'d blow away.'] },
  ]);
  lines('rift.knack.good', [
    { text: ['Good enough to be busy. Too busy, at the end.', 'Yeah. I was. It\'s nice to say that.'] },
    { if: { temper: 'proud' }, text: ['The best. Not one of. The best.', 'Ask anyone in the eastern stack. They\'ll say my name before you finish asking.'] },
    { if: { temper: 'shy' }, text: ['...I think so? People came back. That means good, right?'] },
    { if: { temper: 'gloomy' }, text: ['Good at it, yes. Didn\'t stop the city going dark.'] },
    { if: { temper: 'witty' }, text: ['Modesty forbids me. Fortunately I\'ve no modesty. Yes. Very.'] },
    { if: { temper: 'cheerful' }, text: ['I was! I really was! I miss being good at something.'] },
    { if: { temper: 'ornery' }, text: ['Better than anyone here, that\'s for sure.'] },
  ]);
  lines('rift.knack.teased', [
    { text: ['Ha! Fair. You\'d be surprised, though.', 'Laugh away. Then watch.'] },
    { if: { riftKnack: 'courier' }, text: ['A stile! I once jumped between two towers with a wedding cake. Didn\'t drop a crumb.'] },
    { if: { riftKnack: 'gridtech' }, text: ['With a staff? Your staff has no off switch. I checked. That\'s a design flaw.'] },
    { if: { riftKnack: 'medic' }, text: ['Your back? Lie down on the grass and stop sleeping in a wagon. There. No charge.'] },
    { if: { riftKnack: 'cook' }, text: ['A lawyer! Ha! Don\'t tell Pak. He\'d chase you with a ladle.'] },
    { if: { riftKnack: 'teacher' }, text: ['Your children can count to 1010 in acorns now. That\'s ten. You\'re welcome.'] },
    { if: { riftKnack: 'grower' }, text: ['We tied them down. With string. Lettuce string. It\'s a whole trade.'] },
    { if: { temper: 'ornery' }, text: ['Keep laughing, wizard. Some of us worked for a living.'] },
  ]);
  lines('rift.knack.bestday', [
    { text: ['Best day? The day everything worked. Once. Just once.'] },
    { if: { riftKnack: 'courier' }, text: ['A girl ordered a ring across the city. I ran it twelve rooftops in the rain. She said yes. I watched from the gutter.'] },
    { if: { riftKnack: 'gridtech' }, text: ['Blackout in the old quarter. Fourteen hours on a pole. When it came back on, the whole street cheered. For me.'] },
    { if: { riftKnack: 'medic' }, text: ['A baby. Born under the flyover, in a storm. Me and a torch and a lot of shouting. She\'d be walking now.'] },
    { if: { riftKnack: 'cook' }, text: ['Market festival. Four hundred bowls. One pot. Never stopped. Someone wrote a song about it. Badly.'] },
    { if: { riftKnack: 'teacher' }, text: ['The day the quietest kid in the room got it. Binary. Whole face lit up. Better than any neon.'] },
    { if: { riftKnack: 'grower' }, text: ['First tomato. Red, real, on a roof forty floors up. We passed it round and everyone had a bite.'] },
  ]);
  lines('rift.knack.worstday', [
    { text: ['And the worst was the day it didn\'t matter how good you were.'] },
    { if: { riftKnack: 'courier' }, text: ['The last run. Medicine, east stack. Lift was dead. Power was dead. I ran forty flights. Too late.'] },
    { if: { riftKnack: 'gridtech' }, text: ['The night I couldn\'t fix it. Not a fault. Just not enough power. Anywhere. I stood under a dead lamp and cried.'] },
    { if: { riftKnack: 'medic' }, text: ['When the hospital lights failed. We worked by gadget-glow. Some nights the gadgets failed too.'] },
    { if: { riftKnack: 'cook' }, text: ['The stall went dark. Pak lit candles. Folk queued anyway, in the dark. That\'s when I knew it was bad.'] },
    { if: { riftKnack: 'teacher' }, text: ['The screen went out mid-lesson. Thirty kids in the dark. I told them a story till their parents came. Some came late.'] },
    { if: { riftKnack: 'grower' }, text: ['The lamps went out on the roof. Everything went yellow, then brown. Rows of it. I couldn\'t look.'] },
  ]);
  lines('rift.knack.dark', [
    { text: ['The start of it. The Long Dim, they call it now. The lights going out, one street a week.', 'Yes. Everyone pretended it was a fault. It wasn\'t a fault. It was the battery.'] },
    { if: { riftClues: { min: 4 } }, text: ['The Lamplighter was tired. That\'s what the old folk said. Tired. Like it was a person.'] },
  ]);
  lines('rift.knack.here', [
    { text: ['Here? I\'m still working it out. Everything\'s slower. That\'s not bad.'] },
    { if: { riftKnack: 'courier' }, text: ['Here the post goes by foot, at a stroll, and everyone stops for tea on the way. It\'s criminal. I love it.'] },
    { if: { riftKnack: 'gridtech' }, text: ['Your mill-wheel! It does what our whole grid did, and it never sends an invoice. I watch it for hours.'] },
    { if: { riftKnack: 'medic' }, text: ['Your herbalist does with willow bark what I did with a kit. I\'m learning. She\'s teaching. She\'s strict.'] },
    { if: { riftKnack: 'cook' }, text: ['Your inn! Your pies! Seven meals a day! I\'ve died and gone to the good kitchen.'] },
    { if: { riftKnack: 'teacher' }, text: ['Under your great oak, kids learn stories. No screen. Better than a screen. I\'ve been sitting in.'] },
    { if: { riftKnack: 'grower' }, text: ['Soil! It\'s just... there. On the ground. For free. You don\'t even need a lamp. I keep touching it.'] },
    { if: { riftKnack: 'gridtech', riftDynamo: true }, text: ['We built a dynamo on your river. Your river! It hums now. My hum. A little bit of home.'] },
    { if: { job: 'tinker' }, text: ['I tinker now. Same hands, different world. Your kettles are very simple. I respect that.'] },
  ]);
  lines('rift.knack.advised', [
    { text: ['{RiftJobMate}? Okay. I\'ll go and say hello. Worst they can do is stare.', 'Copy that. I\'ll find {riftJobMate}. Bring a gift, yes? Hobbits like gifts.'] },
    { if: { riftKnack: 'gridtech' }, text: ['{RiftJobMate}? The miller? I could fix that squeak. Forty years, it\'s been squeaking. I hear it in my sleep.'] },
    { if: { temper: 'shy' }, text: ['...What if {riftJobMate} doesn\'t like me? ...Okay. I\'ll try. For you.'] },
  ]);
  lines('rift.knack.thanks', [
    { text: ['Lucky? Huh. Nobody\'s said that.', 'Thanks, wizard. Full signal.'] },
    { if: { temper: 'proud' }, text: ['They are. But it\'s nice to hear it.'] },
    { if: { temper: 'gloomy' }, text: ['Lucky. ...I\'ll try to believe you.'] },
  ]);
  lines('rift.knack.sheep', [
    { text: ['Too late. There\'s one with a blinking ear tag. Don\'t tell the herder.', 'Glowing sheep. You\'ve given me ideas, wizard.'] },
    { if: { temper: 'witty' }, text: ['Night-grazing sheep with headlamps. Productivity up forty per cent. Your loss.'] },
  ]);

  // --- Batteries running flat ----------------------------------------------------------
  addThread({
    id: 'rift.battery', label: 'How\'s your battery?', weight: 0.9, cool: 3,
    when: (F) => F.rift && !!F.riftBattery,
    rel: (F) => ({ flat: 2, low: 1.6, fair: 0.8, full: 0.5 }[F.riftBattery] || 1),
    open: { ask: 'rift.battery.open' },
    beats: {
      start: { line: 'rift.battery.start', go: [
        { ap: 'ask', say: 'Where do you charge it, here?', to: [{ to: 'dynamo', need: { if: { riftDynamo: true } } }, 'nosocket'] },
        { ap: 'jest', say: 'Have you tried a cup of tea? It works on me.', to: 'tea' },
        { ap: 'ask', say: 'What happens when it runs flat?', to: 'flat' },
      ] },
      nosocket: { line: 'rift.battery.nosocket', go: [
        { ap: 'ask', say: 'Can you make your own power?', to: 'study' },
        { ap: 'comfort', say: 'Then you\'ll have to be your own lamp for a while.', to: 'flat' },
      ] },
      dynamo: { line: 'rift.battery.dynamo', go: [
        { ap: 'warm', say: 'So the river\'s looking after you now.', to: 'river' },
        { ap: 'ask', say: 'And do the hill-folk mind it?', to: 'mind' },
      ] },
      tea: { line: 'rift.battery.tea', fx: { joke: { k: 'rift.tea', t: 'Tea is a battery. The wizard says so.' } }, go: [
        { ap: 'jest', say: 'Two sugars for a full charge.', to: 'teajest' },
        { ap: 'ask', say: 'Seriously, though. What happens when it\'s flat?', to: 'flat' },
      ] },
      flat: { line: 'rift.battery.flat', go: [
        { ap: 'listen', say: '*You let them think about it.*', label: 'Let them think', to: 'quietself' },
        { ap: 'ask', say: 'Is that so bad?', to: 'quietself' },
      ] },
      study: { line: 'rift.battery.study', go: [
        { ap: 'advise', say: 'Ask the miller. Millers love explaining.', to: 'miller' },
        { ap: 'warm', say: 'Then the river will be glad of the company.', to: 'river' },
      ] },
      quietself: { line: 'rift.battery.quietself', go: [
        { ap: 'ask', say: 'Low battery. You said that like it means more.', to: 'citylow', need: { open: 1 }, soft: true },
        { ap: 'comfort', say: 'You\'re plenty bright without it.', to: 'bright' },
      ] },
      citylow: { line: 'rift.battery.citylow', fx: { trust: 0.03 }, end: true },
      bright: { line: 'rift.battery.bright', fx: { fond: 0.03 }, end: true },
      river: { line: 'rift.battery.river', fx: { fond: 0.01 }, end: true },
      mind: { line: 'rift.battery.mind', end: true },
      teajest: { line: 'rift.battery.teajest', fx: { fond: 0.02 }, end: true },
      miller: { line: 'rift.battery.miller', fx: { respect: 0.02 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('rift.battery.open', [
    { text: ['How\'s your battery, {name}?', 'And how are your gadgets holding up?', 'Is that little light of yours still lit, {name}?'] },
    { if: { riftBattery: ['low', 'flat'] }, text: ['Your visor\'s looking a bit dim, {name}.', 'You look like you need a good charge, {name}. Whatever that means.'] },
  ]);
  lines('rift.battery.start', [
    { text: ['Battery? Holding. Mostly.', 'Sixty per cent. Seventy if I don\'t look at anything.'] },
    { if: { riftBattery: 'full' }, text: ['Full bars! Charged up this morning. I\'m practically humming.', 'Hundred per cent. Look. Everything blinks. Bliss.'] },
    { if: { riftBattery: 'fair' }, text: ['Half and a bit. Rationing the visor. Doing a lot of looking with my actual eyes.', 'Fair. I\'m only using the torch for emergencies. And the dark. And sometimes for fun.'] },
    { if: { riftBattery: 'low' }, text: ['Low. Blinking red. I keep turning it off and on again. That doesn\'t help, but it feels like it might.', 'Red bar. One red bar. We call that "being on vibes".'] },
    { if: { riftBattery: 'flat' }, text: ['Flat. Dead. Nothing. It\'s just a very expensive bit of glass on my face now.', 'Gone. My gadget is a paperweight. Your paper isn\'t even that heavy.'] },
    { if: { riftBattery: 'flat', temper: 'gloomy' }, text: ['Flat. Like everything I brought. Like me, some days.'] },
    { if: { riftBattery: 'flat', temper: 'witty' }, text: ['Flat. I\'m running entirely on charm. As you can see, also nearly flat.'] },
    { if: { riftBattery: 'low', temper: 'cheerful' }, text: ['Low! But I\'m not! Funny how that works.'] },
    { if: { riftBattery: 'full', temper: 'proud' }, text: ['Full. I keep my kit right. Always have.'] },
    { if: { temper: 'ornery' }, text: ['Why, d\'you want to borrow it? Get your own.'] },
    { if: { stage: 'child' }, text: ['My blinky\'s gone slow. Can you magic it? Please?'] },
  ]);
  lines('rift.battery.nosocket', [
    { text: ['That\'s the thing. There\'s no socket in the Shire. I looked. I checked the walls of the inn. They thought I was mad.', 'Nowhere. Not one plug in the whole valley. You run everything on pies and elbow grease.'] },
    { if: { temper: 'witty' }, text: ['I asked the innkeeper where the socket was. She showed me a hole for a candle. Close. Not close.'] },
    { if: { temper: 'curious' }, text: ['Nowhere yet. But your mill turns. Your windmill turns. Something that turns can make power. I\'m nearly sure.'] },
    { if: { riftCamp: true }, text: ['There\'s a lamp at the camp that runs off a crank. We take turns. It\'s like a very boring dance.'] },
  ]);
  lines('rift.battery.dynamo', [
    { text: ['The dynamo, by the river! Plug in, sit on the bank, watch the water do the work. Best seat in the valley.', 'Down at the River Dynamo. I go every couple of days. There\'s always someone there. It\'s like a well, but for light.'] },
    { if: { temper: 'dreamy' }, text: ['At the river. I like to think the water knows. It goes past a little brighter after.'] },
    { if: { temper: 'proud' }, text: ['At the dynamo. We built it. Our hands, your river. Best thing I\'ve ever helped make.'] },
  ]);
  lines('rift.battery.tea', [
    { text: ['Tea? Ha! ...Actually. Hm. Hot water, leaves, a sit-down. It does recharge something.', 'Tea\'s a battery! I\'m writing that down. Tea is a battery.'] },
    { if: { temper: 'witty' }, text: ['Tea. The hobbits\' great power source. Fuelled entirely by gossip and scones.'] },
    { if: { temper: 'ornery' }, text: ['Tea doesn\'t charge a visor. ...It does make me less cross that it\'s flat, though.'] },
    { if: { stage: 'child' }, text: ['Tea is yucky. But cake is a battery. Cake is a BIG battery.'] },
  ]);
  lines('rift.battery.flat', [
    { text: ['When it\'s flat? Everything goes quiet. No feed. No map. Just me and a field. At first it scared me.', 'The visor goes dark. Then it\'s just eyes. Ordinary eyes. You notice the eyes are quite good.'] },
    { if: { temper: 'gloomy' }, text: ['Flat means alone. That\'s how it felt, first time. Just me and the dark and a cow.'] },
    { if: { temper: 'dreamy' }, text: ['When it\'s flat the world gets bigger. No screen in front. It just goes on and on.'] },
    { if: { temper: 'curious' }, text: ['Flat means I have to ask people things. Out loud. Turns out that\'s how you meet them.'] },
  ]);
  lines('rift.battery.study', [
    { text: ['We\'re learning. Watching your mill, counting turns. A coil on an axle, that\'s all it takes.', 'Yeah! That\'s what we do all day, when we\'re not lost. Watch your wheels go round.'] },
    { if: { riftDynamo: true }, text: ['We did! Water and wind. The dynamo was the first. My hands still smell of river.'] },
    { if: { temper: 'ornery' }, text: ['We\'re trying. Your miller keeps shooing us off the bank.'] },
  ]);
  lines('rift.battery.quietself', [
    { text: ['...No. It\'s not. I think I talk to more people here than I did in ten years there.', 'Bad? I thought so. Now I go a whole day without noticing it\'s flat. That\'s new.'] },
    { if: { temper: 'gloomy' }, text: ['Low battery. ...That\'s what we say about the whole city, now. Back home.'] },
    { if: { temper: 'witty' }, text: ['Not bad. Different. Like being unplugged from a very loud party and finding the garden.'] },
    { if: { riftHomesick: 'home' }, text: ['Honestly? I leave it flat some days. On purpose. Don\'t tell the others.'] },
  ]);
  lines('rift.battery.citylow', [
    { text: ['It does. Low battery\'s what we call the whole city now. The lights are going. Street by street.', 'Back home, "low battery" isn\'t a joke any more. The whole city\'s running down.'] },
    { if: { riftStage: { min: 6 } }, pri: 1, text: ['The Long Dim. That\'s the city\'s battery. It\'s been low for years. Now it\'s flat, nearly. You\'ve seen the rifts.'] },
    { if: { temper: 'shy' }, text: ['...It does. The whole city. I don\'t like saying it out loud.'] },
  ]);
  lines('rift.battery.bright', [
    { text: ['Ha. Okay. You charm like a power line, wizard.', 'Plenty bright. Copy that. I\'ll put it on a sticker.'] },
    { if: { temper: 'shy' }, text: ['*goes a bit pink, which glows, slightly, in the visor*'] },
  ]);
  lines('rift.battery.river', [{ text: ['The river\'s looking after all of us. That\'s a weird thing to say about water. True, though.', 'Yeah. Strange. Good strange.'] }]);
  lines('rift.battery.mind', [
    { text: ['Some do. One old hobbit calls it the Humming Nuisance. To its face.', 'The fishers say it scares the trout. The trout seem fine. Better than fine.'] },
    { if: { riftElder: (x) => !!x }, pri: 1, text: ['{RiftElder} does. Stands on the bank and tuts. I wave. {RiftElder} tuts harder.'] },
  ]);
  lines('rift.battery.teajest', [{ text: ['Three, for a fast charge. Four if you\'re me.', 'Two sugars! Logged. I\'ll start a chart.'] }]);
  lines('rift.battery.miller', [
    { text: ['The miller! Yes! Millers do love explaining. I\'ll bring cake. I\'m learning.', 'Copy that. I\'ll ask. Slowly. Hobbits like slowly.'] },
    { if: { riftJobMate: (x) => !!x, riftKnack: 'gridtech' }, pri: 1, text: ['{RiftJobMate}? I\'ve been meaning to. That wheel\'s been calling me for weeks.'] },
  ]);

  // --- The quiet, and the stars ------------------------------------------------------
  addThread({
    id: 'rift.quiet', label: 'The quiet, and the stars', weight: 0.9, cool: 4,
    when: (F) => F.rift,
    rel: (F) => (F.hour === 'evening' || F.hour === 'night' ? 1.7 : 0.7),
    open: { ask: 'rift.quiet.open' },
    beats: {
      start: { line: 'rift.quiet.start', go: [
        { ap: 'ask', say: 'And now?', to: 'now' },
        { ap: 'listen', say: '*You listen to the valley with them a moment.*', label: 'Listen to the quiet with them', to: 'listening' },
        { ap: 'jest', say: 'Quiet? You\'ve not heard the Badger on a Highday.', to: 'badger' },
      ] },
      now: { line: 'rift.quiet.now', go: [
        { ap: 'ask', say: 'What do you hear, these days?', to: 'sounds' },
        { ap: 'ask', say: 'And the stars?', to: 'stars' },
      ] },
      listening: { line: 'rift.quiet.listening', fx: { drive: { lonely: -0.05 }, trust: 0.01 }, go: [
        { ap: 'warm', say: 'Look up, then. The stars are out.', to: 'stars' },
        { ap: 'ask', say: 'What else do you hear?', to: 'sounds' },
      ] },
      badger: { line: 'rift.quiet.badger', go: [
        { ap: 'warm', say: 'But you\'ve grown used to it, the quiet?', to: 'now' },
        { ap: 'jest', say: 'Highday at the Badger is the closest we have to a city.', to: 'city' },
      ] },
      city: { line: 'rift.quiet.city', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'And when the Badger shuts? What then?', to: 'sounds' },
      ] },
      sounds: { line: 'rift.quiet.sounds', go: [
        { ap: 'ask', say: 'And the stars? Do you like them?', to: 'stars' },
        { ap: 'share', say: 'I\'ve slept under more skies than I can count.', to: 'skies' },
      ] },
      skies: { line: 'rift.quiet.skies', go: [
        { ap: 'ask', say: 'Did you never see stars, at home?', to: 'nostars' },
        { ap: 'warm', say: 'They\'re yours now too. No charge.', to: 'free' },
      ] },
      stars: { line: 'rift.quiet.stars', go: [
        { ap: 'tale', say: 'Shall I tell you their names?', to: 'names' },
        { ap: 'ask', say: 'Did you never see them, at home?', to: 'nostars' },
      ] },
      nostars: { line: 'rift.quiet.nostars', go: [
        { ap: 'warm', say: 'Then they\'re yours now. Free.', to: 'free' },
        { ap: 'ask', say: 'Is it the stars you like, or the dark?', to: 'softdark', need: { open: 1 }, soft: true },
      ] },
      names: { line: 'rift.quiet.names', fx: { fond: 0.02, joke: { k: 'rift.stars', t: 'The Plough is "the Shopping Trolley" now.' } }, go: [
        { ap: 'jest', say: 'The Shopping Trolley. Elbereth would weep.', to: 'free' },
        { ap: 'ask', say: 'Did you never see them, at home?', to: 'nostars' },
      ] },
      softdark: { line: 'rift.quiet.softdark', fx: { trust: 0.03, run: ease(0.03) }, end: true },
      free: { line: 'rift.quiet.free', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('rift.quiet.open', [
    { text: ['How are you finding the quiet, {name}?', 'Does the valley sound strange to you, {name}?', 'Do you sleep well, out here, {name}?'] },
    { if: { hour: 'night' }, text: ['A clear night, {name}. Have you looked up?', 'Can\'t sleep, {name}?'] },
    { if: { hour: 'evening' }, text: ['The light\'s going, {name}. Does that still feel strange?'] },
  ]);
  lines('rift.quiet.start', [
    { text: ['The quiet? First week, I couldn\'t sleep for it. I thought I\'d gone deaf.', 'So quiet. I used to hum to fill it. I still do, a bit.'] },
    { if: { temper: 'shy' }, text: ['I like it. I think. It doesn\'t ask anything of you.'] },
    { if: { temper: 'ornery' }, text: ['Too quiet. Then a cockerel goes off like an alarm. Make up your mind, valley.'] },
    { if: { temper: 'dreamy' }, text: ['It\'s like the whole valley\'s holding its breath. Kindly. Like it\'s letting you sleep.'] },
    { if: { temper: 'witty' }, text: ['Quiet. Eerily. I keep waiting for the advert.'] },
    { if: { temper: 'gloomy' }, text: ['Quiet like after something\'s ended. I\'m getting used to it. Slowly.'] },
    { if: { temper: 'cheerful' }, text: ['I love it! Except the owls. The owls scared me witless. Now we\'re friends.'] },
    { if: { temper: 'curious' }, text: ['It\'s not quiet, actually. It\'s just a different frequency. Lower. Took a month to tune in.'] },
    { if: { temper: 'proud' }, text: ['I sleep like a stone. Took a while. Now I\'m better at it than any hobbit.'] },
    { if: { stage: 'child' }, text: ['It\'s SO quiet. I can hear my own tummy. It\'s very loud.'] },
    { if: { riftHome: 'the hum of the city at night' }, pri: 1, text: ['No hum. Nothing. First nights I lay there humming the city to myself. B flat. All night.'] },
    { if: { riftHome: 'trains that never stopped' }, pri: 1, text: ['No trains. Every four minutes I\'d listen for one. Weeks of it. Then one night I forgot to.'] },
  ]);
  lines('rift.quiet.now', [
    { text: ['Now? I hear things. Little things. The quiet\'s full, once your ears grow up.', 'Now I can\'t sleep without it. Went to the inn on a loud night and missed the owls.'] },
    { if: { riftHomesick: ['lost', 'homesick'] }, text: ['Now? Better. Not good. Better.'] },
    { if: { temper: 'gloomy' }, text: ['Now it\'s just... the sound of being here. I don\'t mind it. Most nights.'] },
    { if: { temper: 'witty' }, text: ['Now I complain when the miller\'s wheel squeaks. I\'ve gone full hobbit. Send help.'] },
  ]);
  lines('rift.quiet.listening', [
    { text: ['...The river. A dog, far off. Somebody\'s kettle. That\'s it. That\'s the whole broadcast.', '...Hear that? An owl. And the reeds. And your beard, rustling.'] },
    { if: { hour: 'night' }, text: ['...Crickets. Hundreds. Like a server room, but alive.'] },
    { if: { weather: 'rain' }, text: ['...Rain on the leaves. It\'s like static, but kind.'] },
    { if: { season: 'winter' }, text: ['...Nothing. Snow eats the sound. It\'s like the whole world muted itself.'] },
    { if: { temper: 'shy' }, text: ['...Thanks. For listening with me. It\'s better with two.'] },
  ]);
  lines('rift.quiet.badger', [
    { text: ['Ha! I have. That\'s not noise. That\'s singing. Badly. Lovingly.', 'The Badger\'s different. That\'s people noise. I missed people noise.'] },
    { if: { temper: 'witty' }, text: ['Highday at the Badger is a riot with a fiddle. I\'ve seen riots. That\'s the fiddle\'s fault.'] },
  ]);
  lines('rift.quiet.city', [
    { text: ['A city of nineteen hobbits and a fiddle. It\'s got a better soundtrack than mine did.', 'Ha! It is. Smaller. Louder per head, honestly.'] },
  ]);
  lines('rift.quiet.sounds', [
    { text: ['Bees. Bees! Like a tiny grid working. And sheep, which sound like they\'re complaining about me.', 'The mill wheel. Doors. A hundred kettles at four o\'clock, all at once. That\'s my favourite.'] },
    { if: { season: 'spring' }, text: ['Birds. In the morning. All of them, at once, like an alarm somebody set to joy.'] },
    { if: { season: 'summer' }, text: ['Bees and children and somebody always mowing. It sounds like a holiday nobody booked.'] },
    { if: { season: 'autumn' }, text: ['Leaves. Crunch, crunch. I walk through them on purpose. Don\'t judge.'] },
    { if: { season: 'winter' }, text: ['Crackling fires. Through the doors as you pass. Every hole has its own crackle.'] },
    { if: { riftRelay: true }, text: ['The Relay, at dusk. Static and a lullaby. I go and listen. So do the old folk, I notice.'] },
  ]);
  lines('rift.quiet.skies', [
    { text: ['More skies than... you\'ve seen other skies? Other worlds? ...Course you have. Wizard.', 'Under them? Outside? On purpose? You\'re braver than you look.'] },
    { if: { temper: 'curious' }, text: ['How many? Are they different? Do the stars move the same way? I need to know.'] },
  ]);
  lines('rift.quiet.stars', [
    { text: ['The stars. I\'d never seen one before I fell out of the sky. I thought they were a fault.', 'Have you seen how many? Every night! And nobody charges you!'] },
    { if: { hour: 'night', weather: 'fair' }, text: ['Look at them. Look. I\'ve been out here an hour. My neck hurts. I don\'t care.'] },
    { if: { temper: 'dreamy' }, text: ['I lie on the hill and pretend I\'m falling up into them. It\'s the best thing in the world.'] },
    { if: { temper: 'gloomy' }, text: ['The stars make me feel small. Small\'s fine, here. Small is safer.'] },
    { if: { temper: 'curious' }, text: ['Do they move? They move! The whole sky turns! I timed it! Nobody here thinks this is strange!'] },
    { if: { temper: 'ornery' }, text: ['The stars are all right. Bit showy. Nobody asked them.'] },
    { if: { stage: 'child' }, text: ['I counted them. I got to a thousand and eleven. Then I fell asleep.'] },
  ]);
  lines('rift.quiet.nostars', [
    { text: ['Never. The sky was a lid. Lit from underneath. You\'d no idea there was anything above it.', 'Not once. The Lamplighter lit the clouds and that was the sky. I didn\'t know it had a back.'] },
    { if: { riftHome: 'the Lamplighter\'s glow on the clouds' }, pri: 1, text: ['That\'s what I miss, and that\'s why I never saw them. The glow hid them. Funny. I didn\'t know what it cost.'] },
    { if: { temper: 'witty' }, text: ['Stars were a rumour. Like clean water and good manners.'] },
  ]);
  lines('rift.quiet.names', [
    { text: ['Names? They have names? ...That one I call the Shopping Trolley. What\'s it really called?', 'Go on. Though I\'ve named a few already. That\'s the Pylon. That\'s the Noodle.'] },
    { if: { temper: 'witty' }, text: ['I\'ve already named them. That cluster\'s the Server Farm. The bright one\'s Gerald.'] },
    { if: { stage: 'child' }, text: ['That one\'s the Dragon and that one\'s the Biscuit. I named them. You can\'t change them.'] },
  ]);
  lines('rift.quiet.softdark', [
    { text: ['The dark. It\'s soft here. Like a blanket, not a hole. Someone said that once. A place where the dark is soft.', 'The dark, I think. Back home dark meant something had gone wrong. Here it just means bedtime.'] },
    { if: { riftFrags: 'voice' }, pri: 1, text: ['"A place where the dark is soft." The Lamplighter said that. It meant here. I know it did. I feel it.'] },
    { if: { temper: 'shy' }, text: ['...The dark. Nobody can see you in it. That used to be the scary part. Now it\'s the nice part.'] },
  ]);
  lines('rift.quiet.free', [
    { text: ['Free. Huh. Best thing I\'ve been given, and nobody even wrapped it.', 'Free stars. Free rain. Free bread, if you smile at a baker. This place.'] },
    { if: { temper: 'cheerful' }, text: ['FREE! Full signal, wizard. Full signal forever.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Free. ...Fine. They\'re nice. Don\'t tell anyone I said.'] },
  ]);

  // --- Is this home, now? --------------------------------------------------------------
  addThread({
    id: 'rift.belong', label: 'Is this home now?', weight: 1, cool: 5,
    when: (F) => F.rift && F.stage !== 'child' && F.talks >= 1,
    rel: (F) => ({ settling: 1.6, home: 1.3, homesick: 1, lost: 0.6 }[F.riftHomesick] || 1),
    open: { warm: 'rift.belong.open' },
    beats: {
      start: { line: 'rift.belong.start', go: [
        { ap: 'ask', say: 'What would make it home?', to: 'make' },
        { ap: 'warm', say: 'It can be both, you know. Home and not.', to: 'both' },
        { ap: 'ask', say: 'If the door home opened tomorrow, would you go?', to: 'door', need: { open: 2 }, soft: true },
      ] },
      make: { line: 'rift.belong.make', go: [
        { ap: 'advise', say: 'rift.belong.advice', label: 'Give them some advice', to: 'advised' },
        { ap: 'warm', say: 'It can be both, you know. Home and not.', to: 'both' },
      ] },
      both: { line: 'rift.belong.both', go: [
        { ap: 'ask', say: 'If the door home opened tomorrow, would you go?', to: 'door', need: { open: 1 }, soft: true },
        { ap: 'ask', say: 'What tips it, on a bad day?', to: 'badday' },
      ] },
      badday: { line: 'rift.belong.badday', go: [
        { ap: 'comfort', say: 'Bad days end. Even here. Especially here.', to: 'welcome' },
        { ap: 'ask', say: 'And if the door opened, on a bad day?', to: 'door' },
      ] },
      door: { line: 'rift.belong.door', fx: { trust: 0.03 }, go: [
        { ap: 'listen', say: '*You wait. It\'s not an easy question.*', label: 'Wait', to: 'torn' },
        { ap: 'warm', say: 'Whatever you choose, you\'ll be welcome back.', to: 'welcome' },
      ] },
      torn: { line: 'rift.belong.torn', go: [
        { ap: 'comfort', say: 'You don\'t have to know yet.', to: 'welcome' },
        { ap: 'share', say: 'I\'ve never stayed anywhere long enough to know.', to: 'wizroot' },
      ] },
      advised: { line: 'rift.belong.advised', fx: { respect: 0.02 }, end: true },
      welcome: { line: 'rift.belong.welcome', fx: { trust: 0.03, run: ease(0.06) }, end: true },
      wizroot: { line: 'rift.belong.wizroot', fx: { trust: 0.04, fond: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('rift.belong.open', [
    { text: ['Is this home now, {name}? Or still somewhere you\'re stopping?', 'Do you feel at home yet, {name}?'] },
    { if: { riftFinale: 'softclose' }, text: ['The rifts are closed, {name}. How does that sit with you?'] },
    { if: { riftFinale: 'hearthlink' }, text: ['Now the doors are open, {name}, where\'s home?'] },
  ]);
  lines('rift.belong.start', [
    { text: ['Home? ...Some days. Most days. Not Mondays.', 'It\'s where my stuff is. Is that home? I think it\'s a start.'] },
    { if: { riftHomesick: 'lost' }, text: ['No. Not yet. Sorry. Everyone\'s kind and it\'s still not home.', 'Home is on the other side of the sky. This is where I\'m waiting.'] },
    { if: { riftHomesick: 'homesick' }, text: ['Getting there. Like a signal with one bar. It comes and goes.', 'Half. I\'m half here. The other half is still falling.'] },
    { if: { riftHomesick: 'settling' }, text: ['More than I expected. I said "going home" yesterday and meant the hole. Shocked myself.', 'Nearly. I know where everything is. I know whose dog barks. That\'s nearly.'] },
    { if: { riftHomesick: 'home' }, text: ['Yeah. It is. I don\'t know when it happened. Somewhere between the third pie and the tenth.', 'Home. Yes. I worried I\'d feel bad about that. I don\'t.'] },
    { if: { homeless: true }, pri: 1, text: ['Hard to say home when you sleep under a tarp. The camp\'s cosy. It\'s not a hole.'] },
    { if: { spouse: (s) => !!s }, pri: 1, text: ['Home is wherever {spouse} is. That\'s here. So, yeah. Here.'] },
    { if: { riftFinale: 'softclose' }, pri: 2, text: ['It has to be now, doesn\'t it? The door\'s shut. ...I\'m all right with that. Mostly. Ask me in a year.'] },
    { if: { riftFinale: 'hearthlink' }, pri: 2, text: ['Both! That\'s the thing. I can go back and visit. And I always come back here. Turns out that\'s the answer.'] },
    { if: { temper: 'gloomy' }, text: ['Home\'s a big word. I\'ll say "the place I\'m least lost in". It\'s here.'] },
    { if: { temper: 'witty' }, text: ['I\'ve got a round door and a pantry. Legally that makes me a hobbit, I think.'] },
  ]);
  lines('rift.belong.make', [
    { text: ['A hole of my own. With a round door. And a kettle I didn\'t have to fix first.', 'A friend. A real one. Someone who\'d notice if I wasn\'t there.'] },
    { if: { homeless: true }, text: ['A roof. Any roof. One that doesn\'t flap.'] },
    { if: { riftHillFriend: (x) => !!x }, text: ['I\'ve got {riftHillFriend}. I think that\'s most of it, actually. The rest is furniture.'] },
    { if: { lost: (x) => !!x }, pri: 1, text: ['{Lost}. If {lost} walked through that rift, this\'d be home tomorrow.'] },
    { if: { spouse: (s) => !!s }, text: ['It is home. I just need to stop waiting for the floor to drop. {Spouse} says I flinch at doors.'] },
    { if: { temper: 'ornery' }, text: ['People to stop staring would help. Start there.'] },
  ]);
  lines('rift.belong.advice', [
    { text: ['Plant something. You can\'t leave a thing you\'ve planted.', 'Learn one hill song by heart. Then you\'ll always have somewhere to sing it.'] },
    { if: { homeless: true }, text: ['Ask at the Badger. Somebody always has a room, if they\'re asked properly.'] },
  ]);
  lines('rift.belong.advised', [
    { text: ['Plant something. Huh. Okay. I\'ll try the lettuces. Old habits.', 'That\'s good advice. Annoyingly good.'] },
    { if: { temper: 'ornery' }, text: ['I\'ll think about it. Don\'t check on me.'] },
    { if: { temper: 'proud' }, text: ['I was going to anyway.'] },
  ]);
  lines('rift.belong.both', [
    { text: ['Home and not. Yeah. That\'s exactly it. Thanks for having a word for it.', 'Both. Okay. I can do both. I\'m from a city of both.'] },
    { if: { temper: 'dreamy' }, text: ['Like standing in a doorway with the sun on one side and the rain on the other.'] },
    { if: { temper: 'gloomy' }, text: ['Both, or neither. Depends on the hour.'] },
  ]);
  lines('rift.belong.badday', [
    { text: ['A smell. Hot metal, rain. Something reminds me and I\'m gone for an hour.', 'Someone stares too long. Or a child hides. Little things.'] },
    { if: { riftElder: (x) => !!x }, text: ['When {riftElder} crosses the lane to avoid me. That tips it. Every time.'] },
    { if: { riftBattery: ['low', 'flat'] }, text: ['When the gadget dies and I can\'t even look at the old pictures. Then it\'s a bad day.'] },
  ]);
  lines('rift.belong.door', [
    { text: ['If it opened tomorrow? ...I don\'t know. That\'s new. A month ago I\'d have run.', 'I\'d go and look. Look a long time. Then... I don\'t know.'] },
    { if: { riftHomesick: 'lost' }, text: ['I\'d run. I\'d run so fast. ...Then I\'d look back. I think I\'d look back.'] },
    { if: { riftHomesick: 'home' }, text: ['I\'d wave through it. Shout hello. Then I\'d come back for supper.'] },
    { if: { spouse: (s) => !!s }, pri: 1, text: ['Without {spouse}? Never. With {spouse}? ...Maybe a visit. A short one.'] },
    { if: { kid: (k) => !!k }, pri: 1, text: ['{Kid} was born here. {Kid}\'s never seen a neon sign. I couldn\'t take that away.'] },
    { if: { riftHillFriend: (x) => !!x }, text: ['I\'d think of {riftHillFriend}. And I\'d stay a bit longer. And a bit longer.'] },
    { if: { riftSeeking: true }, text: ['We\'re close, at the scar. Closer every night. I don\'t know any more if I\'m hoping or dreading.'] },
  ]);
  lines('rift.belong.torn', [
    { text: ['Torn. That\'s the word. One half each side.', 'Honestly? I want both. Is that allowed?'] },
    { if: { temper: 'gloomy' }, text: ['Torn, like the sky. Funny that.'] },
    { if: { temper: 'witty' }, text: ['I want a door with a cat flap. In and out, as I please.'] },
  ]);
  lines('rift.belong.welcome', [
    { text: ['...Thanks. That helps.', 'Welcome back. I\'ll keep that.'] },
    { if: { temper: 'shy' }, text: ['...Okay. Thank you, wizard.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Good. Better be.'] },
  ]);
  lines('rift.belong.wizroot', [
    { text: ['You? Never stayed? ...Huh. So you\'re worse at this than me. That\'s weirdly comforting.', 'Never? Not anywhere? Then stay here a bit. We\'ll practise together.'] },
    { if: { temper: 'witty' }, text: ['A wizard with no fixed address. You\'d never get a library card in Neverdark.'] },
  ]);

  // --- Every temper, every beat: more ways of saying it ------------------------------------
  const byTemper = (key, o) => lines(key, Object.keys(o).map((temper) => ({ if: { temper }, text: o[temper] })));
  byTemper('rift.sh.quiet', {
    cheerful: ["*They manage a smile, a small one.* Hey. Company. That's nice.", "Oh, hi. Sorry. I'm usually the one cheering people up."],
    curious: ["...You just sit? No questions? Huh. That's a new protocol.", "*They glance at you, curious despite themselves, then back at the sky.*"],
    dreamy: ["*They're humming something under their breath, a city song, and don't stop.*", "...I was somewhere else. Somewhere bright. I'm back now."],
    witty: ["Silent treatment from a wizard. I must look really bad.", "...You're very good at sitting. Is that a wizard thing?"],
    proud: ["I'm fine. You don't have to... okay. You can stay. If you like.", "*They straighten up, as if caught, then let their shoulders go.*"],
    gloomy: ["*They sigh, a long one, and lean back against the wall beside you.*", "...Nobody usually sits. They say something cheerful and go."],
  });
  byTemper('rift.sh.polite', {
    ornery: ["I'm fine. Go and bother someone happier.", "Nothing's wrong. Everything's wrong. Same as usual."],
    shy: ["Oh! Um. No. I'm fine. Really. Mostly.", "*They wipe their eyes quickly.* Dust. It's very dusty here."],
    curious: ["Is it that visible? Huh. Your face-reading's better than my old visor's.", "Long way from home, yes. Literally. I've been working out how far. It's a lot."],
    dreamy: ["I was thinking about the lights. How they'd look, right now, from my old window.", "Far? Further than the stars, I think. I don't know which way to face to miss it."],
    gloomy: ["About as far as it gets. Thanks for noticing.", "Fine. Low. Same thing, these days."],
  });
  byTemper('rift.sh.talks', {
    cheerful: ["I'm meant to be the cheerful one. I am, mostly! Just not tonight. Tonight I miss the noise.", "Everything's lovely here and I keep crying at the loveliness. That's normal, right?"],
    ornery: ["Everyone's so NICE. Nobody shouts. Nobody pushes. I don't know where to put my elbows.", "I'm cross with the sky. It took me and it didn't ask. I can't shout at the sky. I've tried."],
    shy: ["...I don't know anyone. Not really. I say good morning and then I run out of words.", "...Everyone's kind. I'm just... I'm a long way from my own kind of quiet."],
    curious: ["I keep trying to work out how the rift works so I can work out how to undo it. Then I feel guilty for wanting to.", "I used to know how everything worked. Here I don't even know how the bread rises. It's... a lot."],
    dreamy: ["I dream of the city every night. Then I wake up and it's birdsong. I can't tell which is the dream any more.", "It's like being a letter that got posted to the wrong house. A nice house. The wrong one."],
    witty: ["I miss being somewhere nobody stares at my eye. I miss being boring. Never thought I'd say that.", "Homesick for a place that was never quiet, in a place that never isn't. The universe has a sense of humour."],
    proud: ["I was somebody, there. Knew every street. Here I'm the stranger from the sky. It's... humbling. I hate humbling.", "I was managing fine. I'm still managing. It's just heavy, some days."],
  });
  byTemper('rift.sh.eases', {
    curious: ["Huh. Missing as a kind of keeping. I'll have to think about that. It's a good thought.", "...That actually worked. I want to know why that worked."],
    witty: ["Okay. That was annoyingly helpful. Don't tell anyone a wizard cheered me up.", "Signal's back. Two bars. Three if you keep standing there."],
    proud: ["...Thank you. I don't say that easily. So you know.", "Right. Good. I'm all right now. I'm always all right in the end."],
    gloomy: ["It's lighter. Not light. Lighter. That's something.", "...Thank you. I'll still be sad tomorrow. But less, maybe."],
  });
  byTemper('rift.sh.opens', {
    cheerful: ["You too? Oh, wizard. Okay. Then I'll tell you. Two homesick people are a party.", "A hundred years! And you still smile at everyone? Then there's hope for me yet!"],
    ornery: ["A hundred years? And you didn't go mad? ...Fine. You win. I'll talk.", "Hm. Didn't know wizards got homesick. Makes you more bearable."],
    curious: ["How did you stand it? Does it fade? How long does it take? Sorry. I'll listen first.", "A hundred years of it. Does it get easier, or do you just get better at carrying it?"],
    dreamy: ["Then we're both a bit lost. I like that. It's less lonely, being lost together.", "I think you carry home in your hat. I carry mine in my eye. We're the same, sort of."],
    proud: ["...You're not just saying that. I can tell. All right. I'll tell you. Only you.", "If a wizard can admit it, so can I. Fine. I miss it. There."],
    gloomy: ["Then you know it doesn't go. It just gets quieter. ...That's actually comforting.", "A hundred years. ...Okay. Then this is survivable. Good to know."],
  });
  byTemper('rift.sh.someone', {
    cheerful: ["Someone. Always someone, isn't it? I'll be all right. I always am.", "Someone. I'll tell you about them when I can say it with a smile. Soon."],
    ornery: ["Someone. Don't push.", "Both. And neither of them is here. So."],
    shy: ["...Someone. I can't. Not yet.", "*They nod, once, and look away.*"],
    curious: ["Someone. I keep doing the sums on whether they made it. The sums don't help.", "Someone. And everyone. It's hard to separate them."],
    dreamy: ["Someone. They're in every dream. Always just turning a corner.", "Someone who'd love it here. That's the worst part."],
    witty: ["Someone. Sorry. That's the whole story, for now. Short story. Long sequel.", "The city's got ten million people. I only miss about four."],
    proud: ["Someone I should have kept hold of. That's all.", "Someone. I'll find them. One way or another."],
  });
  byTemper('rift.sh.stung', {
    cheerful: ["Ha. ...Yeah. No. Not funny today. Sorry.", "I usually love a joke. Not today, wizard."],
    curious: ["Was that supposed to help? I'm genuinely asking.", "Interesting choice. Wrong. But interesting."],
    dreamy: ["*They just look at you, a long, disappointed look.*", "Oh. I thought you were going to be kind."],
    witty: ["Ha. Ha. Good one. Read the room, beardy.", "Comedy's about timing, wizard. Yours is off by about a universe."],
    gloomy: ["Right. Course. Laugh it off. That's what everyone does.", "Thanks. That's helped exactly as much as you'd think."],
  });
  byTemper('rift.sh.smile', {
    cheerful: ["Ha! Okay, okay. You got one out of me.", "That's terrible. I love it. Signal's twitching."],
    ornery: ["Hmph. ...Fine. That was a bit funny.", "Don't. I'm trying to be miserable. ...Ha. Stop it."],
    shy: ["*a small laugh, surprised out of them*", "Oh. Ha. That's silly. ...Thanks."],
    curious: ["Huh. Didn't think that would work. It sort of worked.", "Ha. How did you know that would help?"],
    dreamy: ["*smiles faintly, still half somewhere else*", "Ha. You're strange. Strange is nice."],
    proud: ["I'm not laughing. ...I'm smiling. It's different.", "Hm. All right. You're funnier than you look."],
    gloomy: ["...Ha. Once. That's all you get.", "Hm. That's almost funny."],
  });
  byTemper('rift.sh.laughs', {
    cheerful: ["HA! Oh, I needed that. You've no idea.", "Ha! That's the worst thing I've heard all week. Again!"],
    ornery: ["Ha! Curse you. I was enjoying being cross.", "*snorts* All right. All right. You win."],
    shy: ["*laughs, then covers their mouth, then laughs anyway*", "Ha! Oh, that's... ha. Sorry."],
    curious: ["Ha! Wait, is that a real thing? It's not, is it? Ha!", "Ha! Where do you get these? Is there a book?"],
    dreamy: ["*laughs, properly, like they'd forgotten how*", "Ha! Oh, that's lovely. Silly and lovely."],
    proud: ["*laughs despite themselves* That's beneath you, wizard. It's beneath both of us.", "Ha. Fine. You're good. Don't let it go to your hat."],
    gloomy: ["*a surprised bark of a laugh* ...I didn't think I still could.", "Ha. Oh. That's... huh. I laughed."],
  });
  byTemper('rift.sh.think', {
    cheerful: ["Company. Yeah! I'll find someone. I always find someone.", "You're right. I'll pop down to the Badger later. Maybe."],
    shy: ["...Maybe. Company's hard. I'll try.", "I'll think about it. Thank you for not making me."],
    curious: ["Company. Hm. I've been avoiding it. I should work out why.", "I'll think about it. Properly. I'm good at thinking."],
    dreamy: ["Company... maybe. Or a long walk. Same thing, almost.", "I'll think on it. Under the stars, probably."],
    witty: ["Company. Noted. Filed under 'later'.", "Your advice has been received and placed in the queue."],
    proud: ["I don't need company. ...I'll consider it.", "I'll think about it. On my own terms."],
    gloomy: ["Maybe. Not tonight. Tomorrow's possible.", "Company's tiring. But so is this. I'll think."],
  });
  byTemper('rift.sh.plan', {
    cheerful: ["The Badger! Yes! I'll sing, if they let me. They never let me.", "Copy that! Badger, tonight, full volume. Thank you!"],
    ornery: ["Fine. The Badger. If anyone stares I'm leaving.", "I'll go. I'll sit. If it's awful it's your fault."],
    curious: ["The Badger. Okay. I'll study it. A field trip.", "Sit with folk. Observe. Report back. I can do that."],
    dreamy: ["The Badger, where the lamps are. Okay. I'll take the long way, past the river.", "Sit with folk. Like sitting by a fire. Okay."],
    witty: ["The Badger. Where hope goes to get a pint. I'll go.", "Sit, don't talk. My two great skills. Copy that."],
    proud: ["I'll go. Not because you said. Because I was going to.", "Fine. I'll show my face. I've nothing to hide."],
    gloomy: ["I'll go. I'll probably leave early. But I'll go.", "The Badger. Okay. Better than this wall, I suppose."],
  });
  byTemper('rift.sh.best', {
    cheerful: ["The best thing? Everything! But mostly the cake. And the people. Mostly the cake.", "Second breakfast. Is that a silly answer? It's the true one."],
    ornery: ["The best thing? Nobody here's ever tried to sell me anything. Not once.", "The quiet. Don't tell anyone I said."],
    shy: ["...The way people leave a light on. For whoever's late. I noticed.", "...A lady gave me a scarf. She didn't even know me."],
    curious: ["The way everything here grows on its own. No code. I still can't get over it.", "Rivers! Real rivers! Water just going somewhere, on its own, forever!"],
    dreamy: ["The mornings. All mist and gold. Like the city's dawn, but without the city.", "The stars. I didn't know the sky had a back to it."],
    witty: ["The best thing? Nobody here's ever heard of a deadline. It's paradise with chickens.", "Your inn. The only place in two worlds where the ale's better than the gossip."],
    proud: ["I built a fence last week. My own fence. It's straight. Mostly.", "That folk come to me now. For fixing things. I'm useful here."],
    gloomy: ["...The rain. It doesn't sting. Small thing. It's the best thing.", "Being let alone, when I want to be. Nobody minds."],
  });
  byTemper('rift.sh.notalone', {
    cheerful: ["Not ever! I'll hold you to that! Every day!", "Copy that! Full signal. Well, three bars."],
    ornery: ["Hm. Not ever's a long time. ...But okay.", "Fine. Good. Thanks. Don't make it weird."],
    shy: ["...Okay. Not alone. Thank you.", "*a small nod, a long breath out*"],
    curious: ["Not ever. That's a big promise. Wizards are allowed big promises, I suppose.", "Huh. Okay. I'll test that. Politely."],
    dreamy: ["Not alone. Like a lamp in a window. I'll look for it.", "Not ever... that's a lovely thing to be told."],
    witty: ["Not ever. Is that in writing? I'll want it in writing.", "Noted. A wizard's on call. Very reassuring."],
  });
  byTemper('rift.home.picture', {
    cheerful: ["Oh, it was glorious! Lights everywhere! Music out of every window! You'd have hated it and then loved it!", "Colours you don't even have names for! Pink so bright it hummed! I miss the pink."],
    ornery: ["Loud. Crowded. Everyone selling something. Nobody saying sorry. I loved it, and don't tell anyone.", "You'd hate it. Ten people per square yard and all of them in your way."],
    shy: ["Bright. I liked being one face in a million. Nobody looked twice.", "...I had a corner I'd sit in, by a vent. Warm. Nobody bothered me. I miss my corner."],
    curious: ["Every surface did something. Walls talked, floors lit up, signs knew your name. I took half of it apart, once.", "Layers on layers. Old city under new city under newer city. I mapped six levels down. There were more."],
    proud: ["The greatest city ever built. Towers to the clouds. And I knew every one of them by name.", "Magnificent. I won't apologise for missing it. You'd miss it too."],
  });
  byTemper('rift.home.wizcity', {
    cheerful: ["Cities! Real ones! Oh, tell me about them! Then I'll tell you about mine!", "None that never slept? Then you'd have loved ours! Or found it exhausting. Both!"],
    ornery: ["Cities here are villages with ambitions. ...Sorry. Go on. Tell me.", "Hm. I bet they slept at nine with a hot water bottle."],
    shy: ["You've seen cities? ...Were they kind? To strangers?", "Oh. I didn't know. Were they nice?"],
    dreamy: ["Every city dreams of never sleeping, I think. Ours just did it.", "Cities that slept... that sounds peaceful. Like a city with its eyes closed."],
    gloomy: ["Lucky them. Sleeping. Ours forgot how. Maybe that's why it's tired now.", "None that never slept. And now ours is falling asleep for good."],
  });
  byTemper('rift.home.jested', {
    curious: ["Ha! Actually, we had studies on that. Nobody slept. Productivity was terrible.", "Naps! We had nap pods. You paid by the minute. I'm not joking."],
    dreamy: ["We dreamed awake. That was the trick. Everyone in the city, dreaming with their eyes open.", "Tired? We were glowing. You don't feel tired when you're glowing. Until you stop."],
    proud: ["We were tired because we were busy. Busy building the greatest city there was.", "Naps are for people with time. We had a city to run."],
    gloomy: ["We were always tired. Now I sleep ten hours and I'm still tired. It catches up with you.", "Ha. Yeah. We were. I think the whole city still is."],
  });
  byTemper('rift.home.banter', {
    cheerful: ["The cats did have lamps! Little collar lights! You'd adore them!", "Ha! Glow-worms in a jar. I'm going to tell everyone that's what we were."],
    shy: ["*giggles* The cats did have lights, actually. Tiny ones.", "...You're funny. I didn't expect that."],
    curious: ["Glow-worms in a jar! Actually, that's how the Glowworm Line got its name. Bioluminescent trains. I'm serious.", "The cats had tracking tags. You could see where every cat was. It was mostly fridges."],
    dreamy: ["We were glow-worms. All of us, in a big jar, glowing at the sky. That's lovely, actually.", "Cats with lamps. Floating down the dark lanes like little lanterns. I miss the cats."],
    proud: ["Laugh, but our cats were better lit than your whole inn.", "Glow-worms! At least we glowed. Your lot just sit in the dark and eat."],
    gloomy: ["Glow-worms in a jar. ...That's not wrong, actually. And the jar's running out of air.", "Ha. Yes. Lit up and trapped. That's the city."],
  });
  byTemper('rift.home.deeper', {
    cheerful: ["It was the people! Always someone to wave to. I waved at strangers on trains. They waved back. Sometimes.", "What I miss is the bustle. Everyone together, all at once. Here everyone's together too. Just slower."],
    ornery: ["What I miss? Being invisible. Here everyone knows my business. There, nobody cared. Bliss.", "I miss nobody asking how I am. ...That came out wrong. I miss some people asking."],
    curious: ["What I miss is not knowing. You turned a corner and anything could be there. Here I know every corner by now.", "There was always something new. A new stall, a new song. Here new happens slowly. I'm learning to like slow."],
    witty: ["What I really miss is takeaway. At three in the morning. Here at three in the morning there's an owl.", "It's not the lights, it's the options. Here the options are pie or other pie."],
  });
  byTemper('rift.home.miss', {
    cheerful: ["Truly? A bit! But less every day! Is that disloyal? It feels disloyal and also nice.", "Some days a lot, some days I forget! Then I feel bad and miss it extra."],
    shy: ["...Yes. Mostly at night. I don't tell anyone.", "...Every day. A little. Like a quiet song."],
    curious: ["Truly? I've tracked it. Less each week. I made a chart. Don't laugh.", "Interesting question. I miss the city less than I miss who I was in it."],
    dreamy: ["Like you miss a dream when you wake. You can't hold it. You keep trying.", "Every time it rains I miss it. Every time the sun comes out I don't."],
    witty: ["Truly? Like a tooth you had pulled. Glad it's gone. Keep poking the gap.", "Miss it? Only on days ending in 'day'."],
    proud: ["I don't dwell. ...I think about it. That's different.", "I miss what was good. I don't miss what wasn't. I'm not a fool."],
    gloomy: ["Truly? It's always there. Like weather. You just get used to it raining.", "Every day. I don't think that stops. I think you just get quieter about it."],
  });
  byTemper('rift.home.beautiful', {
    cheerful: ["It was! It really was! Nobody here believes me!", "Beautiful! Yes! Thank you! Finally someone gets it!"],
    ornery: ["Beautiful. Hm. I'll allow it. It was a bit beautiful.", "Don't get soppy about it. ...It was beautiful."],
    shy: ["...It was. I didn't know anyone else would think so.", "*nods, very quietly* It was."],
    curious: ["Beautiful in the way a machine is beautiful. Everything doing exactly what it's for.", "Huh. I never thought of it as beautiful. I thought of it as complicated. Maybe that's the same."],
    witty: ["Beautiful like a peacock that shouts. Gorgeous. Exhausting. Shouting.", "Beautiful, if you like your scenery to sell you soap."],
  });
  byTemper('rift.home.tale', {
    cheerful: ["Lamp cities! There are more of us! That's brilliant!", "Oh, I love that! I hope they're still lit!"],
    ornery: ["South. Hm. Probably all candles and pretensions.", "Never slept, did they? Bet they weren't as loud as us."],
    shy: ["...Do you think they'd have liked us? If they'd met us?", "That's a nice story. Is it true? You don't have to say."],
    dreamy: ["A city of lamps, far south... I'll dream of it tonight. I'll go there in my sleep.", "Maybe all lamp-cities are connected. Under the world. Like roots."],
    proud: ["A city of lamps. I'd like to see if it's as grand as ours.", "Then they knew what we knew. That light's worth the effort."],
    gloomy: ["Did they go dark in the end? ...You don't have to answer.", "They never slept either. I wonder if they're tired now too."],
  });
  byTemper('rift.home.here', {
    ornery: ["Here? The fact that nobody's rushing. It drove me mad. Now I'd fight anyone who tried to rush me.", "Your bread. Don't tell the baker I said. I've a reputation."],
    shy: ["...The lady at the well who says hello every single day. Even when I don't say it back.", "...The quiet mornings. Nobody needs anything. I just sit."],
    curious: ["How things grow! I planted a bean and it just came up. Nobody programmed it. I check it every morning.", "The way you lot know which mushroom's which. It's like code, but in the woods."],
    dreamy: ["Fog on the meadow in the morning. Like the city's glow, but cool and grey and soft.", "The way the light goes gold before supper. Every day. For free. I'd miss that so much."],
    proud: ["My hole. I dug half of it myself. I'd miss what I've built here.", "The respect, honestly. Folk ask me to fix things now. I'd miss being needed."],
  });
  byTemper('rift.home.strange', {
    cheerful: ["Everything's strange and I love all of it! You sing at weddings for six hours! SIX!", "You say good morning to sheep! Everyone does! I do it now!"],
    shy: ["...You all knock and walk straight in. I'm still not used to that.", "...Everyone knows everyone's name. Even mine. That's strange. Nice strange."],
    dreamy: ["You leave out milk for creatures nobody's ever seen. I asked who drinks it. 'The hedge,' they said.", "You name your houses. Bag End, Bramble Hollow. Our flats had numbers. I like names better."],
    proud: ["You let anyone tell you what to do. A Moot! A whole village arguing! We had a Council, and that was that.", "You don't keep score. Nobody's in charge of anything. And somehow it works."],
    gloomy: ["You all look so certain. About everything. Where you belong. I've never been certain.", "You plan for next year. Next year! We planned for next week, if we were lucky."],
  });
  byTemper('rift.home.twohomes', {
    cheerful: ["Two homes! That's twice the breakfasts! I love maths!", "Not nothing! It's something! It's loads!"],
    ornery: ["Two homes. Hm. One's on fire and the other's full of hens. ...Still better than none.", "Fine. Two. Don't get sentimental."],
    curious: ["Two homes. Can a person really hold two? I'll test it. I'll report back.", "Interesting. Like two signals at once. Hard to tune. Possible."],
    dreamy: ["Two homes, like two moons. One I can see and one I remember.", "Not nothing... I'll keep that one. Like a stone in a pocket."],
    witty: ["Two homes. And no rent on either. I'm winning, honestly.", "Twice the homes, twice the homesick. Or half. I'll do the sums later."],
  });
  byTemper('rift.home.pipe', {
    cheerful: ["Ha! I tried one! I coughed so hard I saw the city again!", "A pipe! Maybe! If it comes with a little hat!"],
    shy: ["...I have a waistcoat already. Please don't tell anyone.", "Oh no. I'd cough. Everyone would look."],
    curious: ["I've been studying the pipe. The ritual's interesting. The smoke's not.", "Actually, I asked how pipe-weed's grown. The leaf-grower talked for an hour. I'm half converted."],
    dreamy: ["A pipe on the step, watching the stars. ...That doesn't sound so bad, actually.", "Maybe. The smoke rings look like little rifts. I'd like that."],
    proud: ["I'll smoke a pipe when I'm good and ready. And I'll do it better than any of you.", "A pipe? Never. I have standards. ...Wool, yes. Pipes, no."],
    gloomy: ["Maybe I should. It might help. Everyone looks so content with one.", "A month. ...Yeah. I can see it. That's the scary part."],
  });
  byTemper('rift.home.comforted', {
    cheerful: ["Thanks, wizard! Still in me. I like that. I'll carry it about!", "That's a nice way to think of it. You're full of those."],
    shy: ["...Thank you. That helps. Really.", "*They nod, and their shoulders drop a little.*"],
    curious: ["Places stay in you. Is that true? I suppose it must be. Huh.", "Like a memory with a map in it. Okay. I like that."],
    witty: ["Still in me. Great. Ten million people in my chest. No wonder I'm tired.", "Places are like that. So are wizards, apparently. Thanks."],
    proud: ["I know it is. I won't let it go. Thank you for saying so.", "Right. Good. It is. I'll keep it."],
    gloomy: ["Still there. ...That's both the good part and the bad part.", "Yeah. In me. Like a splinter. A beautiful splinter."],
  });
  byTemper('rift.home.leftbehind', {
    cheerful: ["Oh. That one. I'll tell you. Just not with a smile, so not today.", "Another day! I promise! It's a sad one and I'm having a good day."],
    curious: ["That's... a different question. A bigger one. Let me work up to it.", "Ask me tomorrow. I want to think about how to say it."],
    dreamy: ["Someone. In the light. Ask me when it's dark. It's easier in the dark.", "That's a story for another evening. A long one."],
    witty: ["That's a whole other episode. Tune in tomorrow.", "Ah. The sequel. Not ready for the sequel."],
    proud: ["That's private. ...For now. Ask me again when you've earned it.", "Not today. I'll tell you when I'm ready. I will be."],
    gloomy: ["Too many. ...Another day.", "That's the part I don't say out loud. Not yet."],
  });
  byTemper('rift.lost.notyet', {
    cheerful: ["Oh, I'll tell you! Just... not today. Today I'm keeping it light.", "Not yet! Ask me on a sunny day. Not this one."],
    curious: ["I'm not ready. I know that's strange. I don't fully understand it myself.", "There's someone. But saying it makes it real, and I'm not ready for real."],
    dreamy: ["Not yet. It's still too close. Like a dream you'll lose if you say it.", "...Someday. When it's not so loud in my head."],
    witty: ["Not yet. I've got a strict policy. One heartbreak per conversation.", "Ask me after the third pie. Not before."],
    gloomy: ["No. I can't. It's too heavy for a lane.", "Not today. Maybe not ever. Sorry."],
  });
  byTemper('rift.lost.later', {
    cheerful: ["Thank you! Truly! I'll tell you, one day soon!", "Copy that. You're very patient for a wizard."],
    shy: ["...Thank you. For waiting.", "*a grateful, wordless nod*"],
    curious: ["You're not going anywhere? Good. I'll need time to find the words.", "Thank you. I'll think about how to tell it."],
    dreamy: ["Another time. When the stars are out. That'll be easier.", "Thank you. It'll keep. Things keep here."],
    witty: ["Not going anywhere? A wizard? That's the most suspicious thing you've said.", "I'll hold you to that. Wizards wander."],
    proud: ["Good. I'll tell you when I choose. Not before.", "Thank you for not pushing. Most do."],
    gloomy: ["Okay. Another time. If there is one.", "...Thanks. That means something."],
  });
  byTemper('rift.lost.closed', {
    cheerful: ["Sorry, wizard. I can't today. I'm sorry.", "Not today. I'm out of brave."],
    shy: ["*shakes head and looks at the ground*", "...Please don't."],
    curious: ["I can't. I can see you're trying. I just can't.", "No. Not even for science."],
    dreamy: ["*They're somewhere else entirely, and don't come back.*", "...No. Let it lie."],
    witty: ["Nice try with the silence. No.", "I can outwait a wizard. Watch me."],
    proud: ["No. And waiting won't change it.", "I said not yet. I meant not yet."],
    gloomy: ["No. Sorry. It's too much.", "Leave it, wizard. Please."],
  });
  byTemper('rift.lost.name', {
    cheerful: ["{RiftLost}. My {riftLostRel}. Oh, you'd love {riftLostThem}. Everyone does.", "My {riftLostRel}, {riftLost}! Funny, bright, impossible. I miss {riftLostThem} like mad."],
    ornery: ["{RiftLost}. My {riftLostRel}. Stubborn as a rusted bolt. We argued about the crossing. I won. I wish I hadn't.", "My {riftLostRel}. {RiftLost}. Don't say anything soppy."],
    curious: ["{RiftLost}. My {riftLostRel}. We were side by side and then we weren't. I keep trying to work out where the split was.", "My {riftLostRel}, {riftLost}. Same rift. Different doors. I'm sure of it."],
    dreamy: ["{RiftLost}. My {riftLostRel}. I see {riftLostThem} in every rift. Just behind the light.", "My {riftLostRel}. {RiftLost}. I still hear {riftLostThem} humming, some nights."],
    witty: ["{RiftLost}. My {riftLostRel}. The one with the good jokes. I got the good looks. Clearly.", "My {riftLostRel}, {riftLost}. Somewhere out there, being insufferable without me."],
    proud: ["{RiftLost}. My {riftLostRel}. The bravest person I know. I'll find {riftLostThem}. Mark that.", "My {riftLostRel}. {RiftLost}. We were the best team in the stack."],
  });
  byTemper('rift.lost.crossing', {
    cheerful: ["It was like a firework going off inside you! And then quiet. And then a sheep. And no {riftLost}.", "A big flash! A big noise! Then grass! I laughed, at first. Then I looked round."],
    ornery: ["The rift chewed us up and spat me out alone. I'd like a word with whoever runs it.", "One second holding on, next second a field. Nobody warns you."],
    shy: ["...I don't remember much. The light. Letting go. I don't know if I let go.", "...It was loud. Then very quiet. I was on my own."],
    dreamy: ["Like falling through a song. All the notes at once. And then one note missing.", "Everything turned to light. And somewhere in the light I lost a hand."],
    proud: ["I held on. I swear I held on. The rift was stronger. That's the only reason.", "I'd have fought it if I could. You can't fight light."],
    gloomy: ["I let go. Or I was let go of. It doesn't matter. Same field either way.", "It was quick. That's the worst part. No time to hold on harder."],
  });
  byTemper('rift.lost.who', {
    cheerful: ["{RiftLost}'s the best! Funny, loud, always first to dance! The party wouldn't start till {riftLostThey} arrived.", "Oh, {riftLost} is wonderful! Kind to everyone. Even pigeons. Especially pigeons."],
    ornery: ["{RiftLost}? Infuriating. Always right. Never lets you forget it. I'd give anything for one more row.", "Stubborn. Loud. Borrows things. Never brings them back. My favourite person."],
    shy: ["...{RiftLost} always talked for me. When I couldn't. I've had to learn to do it myself.", "...{RiftLost} was brave when I wasn't. That's all you need to know."],
    curious: ["{RiftLost} asks why about everything. Drove teachers mad. I'm the one asking why now.", "Clever. Restless. Always taking things apart. We'd have this whole valley mapped by now."],
    witty: ["{RiftLost}'s funnier than me. Don't tell {riftLostThem} I said. I'll deny it.", "Think of me, but taller and smugger. That's {riftLost}."],
    proud: ["{RiftLost} is the best of us. The best of the whole stack. Ask anyone.", "Strong. Smart. Never gave up on anything. That's why I won't give up either."],
    gloomy: ["{RiftLost} was the light in the house. The house is darker now. Every house.", "The kind of person you don't know you lean on till they're gone."],
  });
  byTemper('rift.lost.sorry', {
    cheerful: ["Thanks, wizard. I'm trying to stay hopeful. I'm good at hopeful.", "Don't be sorry! ...Okay, be a bit sorry. Thanks."],
    shy: ["...Thank you. Most people don't know what to say.", "*They nod and swallow hard.*"],
    curious: ["Sorry's a funny word. It's not your fault. But it helps. Why does it help?", "Thanks. It's strange how much a word can do."],
    dreamy: ["Thank you. Sorry is like a blanket. It doesn't fix the cold. It helps.", "*They close their eyes a moment.* Thank you."],
    witty: ["Thanks. You do sorry very well. Practised, have you?", "Sorry accepted. Not your rift. But accepted."],
    gloomy: ["Everyone's sorry. Sorry doesn't bring anyone back. ...Thanks, though.", "Yeah. Sorry. It's the right word. It's not enough. Nothing is."],
  });
  byTemper('rift.lost.hope', {
    ornery: ["Course {riftLostThey} got out. {RiftLost}'s too stubborn not to.", "If anyone could argue their way out of a rift, it's {riftLost}."],
    shy: ["...I hope so. I hope so every night.", "...I think so. I have to."],
    dreamy: ["I feel it. Somewhere. Like a light left on in another room.", "Yes. In some other valley, eating some other bread. Missing me."],
    witty: ["{RiftLost}'s probably running a city somewhere by now. And complaining about it.", "If {riftLostThey} didn't, {riftLostThey}'ll never let me hear the end of it."],
    proud: ["Yes. {RiftLost}'s as strong as I am. Stronger.", "I know {riftLostThey} did. I'd know if not. I'd feel it."],
  });
  byTemper('rift.lost.laugh', {
    cheerful: ["Ha! You would! You'd get on like a house on fire!", "Trouble! Exactly! The best kind!"],
    ornery: ["Ha. You'd lose every argument. Every single one.", "Trouble. Yes. And you'd deserve it."],
    shy: ["*laughs, then sniffs* You would. You'd like {riftLostThem}.", "Ha. Yes. Trouble. ...Thanks."],
    curious: ["Ha! You'd have so many questions for each other. You'd never stop.", "Trouble's the right word. Scientifically speaking."],
    dreamy: ["Ha. Yes. Trouble and sunshine. That's {riftLost}.", "*laughs softly* You'd have been friends. I can see it."],
    proud: ["Trouble, and proud of it. Runs in the family.", "Ha! Takes one to know one, wizard."],
    gloomy: ["*a short, wet laugh* Yeah. Trouble. I miss the trouble.", "Ha. ...Yeah. I'd give a lot for some trouble."],
  });
  byTemper('rift.lost.say', {
    cheerful: ["That I'm happy! Mostly! And that there's cake here and {riftLostThey}'d better hurry up!", "Hello! That's all! Just hello, as loud as I can!"],
    ornery: ["Where've you been? That's what I'd say. Then the rest.", "That I'm cross {riftLostThey} let go. Then I'd hug {riftLostThem}. Then I'd be cross again."],
    curious: ["I'd ask where {riftLostThey} came out. What it was like. Whether {riftLostThey} ever looked for me.", "I'd ask a hundred questions. Then I'd stop and just look."],
    dreamy: ["That I've found the soft place. The one the stories were about. And I kept a window lit.", "I'd say: look, stars. Look at all of them."],
    proud: ["That I held on as long as I could. That I've made something here. That I'm not lost.", "That I didn't fall apart. That I built something."],
    gloomy: ["Sorry. Just sorry. Over and over, probably.", "I don't know. I've practised for months and I still don't know."],
  });
  byTemper('rift.lost.promise', {
    curious: ["You can do that? Keep a name in mind and it helps? How? ...Never mind how. Thank you.", "A name kept in mind. That's... that's like holding a frequency. That might actually work."],
    dreamy: ["Keep the name in your mind like a lamp. Yes. Please.", "Two of us holding the name. The sky has to hear that."],
    witty: ["A wizard's memory. Is it reliable? You forget where you put your hat. ...Thank you, though.", "Keep {riftLost} in mind. Write it on your hat. Please."],
    proud: ["Thank you. I won't forget this. Ever.", "I'll hold you to that. And I'll hold it too."],
    gloomy: ["...You'd do that? Even though it might not work? ...Thank you.", "Okay. Two of us hoping. That's better odds than one."],
  });
  byTemper('rift.lost.wizhope', {
    cheerful: ["Some came! Okay! Then mine will! I've decided!", "That's the best thing anyone's said to me all week!"],
    ornery: ["Some came. Some. ...Fine. I'll take some.", "Hm. That's actually helpful. Don't get used to it."],
    shy: ["...Some came. Okay. I'll hold onto that.", "*a small, brave nod*"],
    curious: ["Who came? ...You don't have to say. But some did. That's data.", "Some came. That changes the odds."],
    dreamy: ["Some came. Like birds at spring. I'll watch the sky.", "...That's a lovely thing to keep."],
    witty: ["Some came. Better than the odds at the Badger's darts board.", "Noted. Hope, with evidence. Rare."],
    proud: ["Then mine will too. I won't accept less.", "Good. That's what I needed to hear."],
  });
  byTemper('rift.lost.found', {
    ornery: ["{RiftFound} came through. And the first thing {riftLostThey} said was 'you look terrible'. Perfect.", "{RiftFound} turned up. Took long enough. I'm not crying, it's the rain."],
    curious: ["{RiftFound} came through! The odds were tiny! I did the sums after! Tiny!", "The sky gave {riftFound} back! I keep trying to work out how. I don't care how."],
    dreamy: ["{RiftFound} came. Out of the light. Like a dream that walked into the morning.", "I dreamed it so often I didn't believe it. {RiftFound}. Here."],
    witty: ["{RiftFound} came through. Arrived late, as always. Fashionably. Across a universe.", "The universe returned {riftFound}. No receipt. I'm keeping {riftLostThem}."],
    proud: ["{RiftFound} found me. Or I found {riftLostThem}. We'll argue about that forever.", "I never doubted {riftFound} would come. Not once. ...Once."],
  });
  byTemper('rift.lost.foundnow', {
    cheerful: ["{RiftFound}'s loving it! Already has a favourite pie! It's the same as mine!", "Settling in brilliantly! Better than me! I'm so proud!"],
    ornery: ["{RiftFound} complains about everything. So, normal. Settling in fine.", "{RiftFound} already has a feud with a goose. It's going well."],
    shy: ["...{RiftFound}'s better at it than me. Talks to everyone. I hide behind {riftLostThem}.", "Good. Really good. I'm so glad."],
    curious: ["{RiftFound}'s been mapping the valley. We compare notes every night. Like old times.", "Fast! {RiftFound} learned second breakfast in a day. I'm studying how."],
    dreamy: ["{RiftFound} sits on the hill at dusk. Same as me. We don't talk. We don't need to.", "Softly. Like snow settling. It's lovely to watch."],
    witty: ["{RiftFound}'s been here a week and already knows more gossip than I do. Humiliating.", "Settling in? {RiftFound}'s practically the mayor."],
    proud: ["{RiftFound}'s already useful. Fixed the inn's pump. We make a good team.", "Well. Of course. {RiftFound}'s family."],
    gloomy: ["Better than I did. I'm glad. It's still strange, having someone again.", "{RiftFound}'s fine. I keep checking. Every hour. I can't stop."],
  });
  byTemper('rift.lost.foundjest', {
    cheerful: ["Never! ...Well. Once. Over the last scone. We made up over the next scone.", "Sick of each other! Ha! Not yet! Give it a month!"],
    ornery: ["Yes. Constantly. Wouldn't change it.", "Sick of {riftLostThem}? Since the first hour. It's glorious."],
    shy: ["*giggles* A little. Don't tell.", "...Never. Not even a bit."],
    curious: ["We timed it. Four hours until the first argument. A personal best.", "Interesting question. I'll survey us both."],
    dreamy: ["Never. Not after all that sky between us.", "Sick of each other? We've got years to catch up on first."],
    witty: ["Sick of each other? We've been sick of each other since birth. It's our love language.", "Yes. Now go away so we can be sick of each other in peace."],
    proud: ["We never tire of each other. We're family.", "Sick of each other? We're too busy being brilliant."],
    gloomy: ["Not yet. I'm too scared to be. What if it goes again?", "Never. I'll never be sick of having someone back."],
  });
  byTemper('rift.knack.good', {
    curious: ["Good? I kept trying to get better. That's what good means, I think.", "Good enough to know how much I didn't know. That's the best kind."],
    dreamy: ["I think so. It felt like a song I knew the words to.", "When it went right it felt like flying. That's good, I think."],
  });
  byTemper('rift.knack.teased', {
    cheerful: ["Ha! You'd be surprised! I'm a marvel! Ask anyone!", "Laugh all you like! I'll show you one day!"],
    shy: ["...It was a real job. I was good at it.", "Oh. Yes. Ha. It's... it was important, though."],
    curious: ["More than you'd think! The demand was huge. I could show you the numbers.", "Ha! Fair question. Let me explain it properly."],
    dreamy: ["Ha. It sounds small out loud. It wasn't small. Not to me.", "It was more than it sounds. Everything is, back home."],
    witty: ["Says the man whose job is 'wandering about in a hat'.", "Ha! At least my job had a title. What's yours? 'Bearded'?"],
    proud: ["I'll have you know I was the best. Laugh at that.", "Mock all you like. My work kept people alive."],
    gloomy: ["Ha. Yeah. Not much use now, is it.", "There was call for it. Not any more."],
  });
  byTemper('rift.knack.bestday', {
    cheerful: ["Oh, there were so many good days! But one I'll never forget. Ready?", "Best day? Every day was a good day, nearly! But one stands out."],
    ornery: ["Best day? There was one. Just one. Don't make me get soppy.", "Fine. One good day. Here it is."],
    shy: ["...There was one day I felt really useful. I'll tell you.", "...I don't usually tell people this one."],
    curious: ["The best day was the one I learned the most. Let me tell you.", "Best day? I have it ranked. Here's number one."],
    dreamy: ["I still dream about it. The best day. It was like this...", "There was one day that shone. I'll tell you."],
    witty: ["Best day? The one where nothing exploded. Well. One thing exploded. On purpose.", "Ah. The legendary day. Let me set the scene."],
    proud: ["The day I proved what I could do. Listen.", "The best day of my career. I'll tell it properly."],
    gloomy: ["There was one good one. It's hard to remember it without the bad ones after.", "Best day? It feels so long ago now."],
  });
  byTemper('rift.knack.worstday', {
    cheerful: ["I don't like to dwell. But there was one. It still makes me quiet.", "Even I couldn't smile through that one."],
    ornery: ["The worst day? Don't. ...Fine. It was this.", "The day nothing I did mattered. That's the worst there is."],
    shy: ["...I've never told anyone this.", "...I still see it, sometimes, when I close my eyes."],
    curious: ["The worst day was when I understood what was happening. That the dark was spreading.", "I worked out the pattern that day. I wish I hadn't."],
    dreamy: ["The worst day felt like a dream going wrong. I couldn't wake up from it.", "It was like the city sighed and stopped."],
    witty: ["No joke for this one. There isn't one.", "The worst day. Even I can't make it funny."],
    proud: ["The day I failed. I don't fail. I did that day.", "Even the best can't fix everything. I learned that."],
    gloomy: ["There was a day. There were lots of days. This was the one.", "The worst day was just the first of many."],
  });
  byTemper('rift.knack.dark', {
    cheerful: ["The Long Dim. Even the name's sad. I hate it. I try not to say it.", "It started small. We joked about it. Then we stopped joking."],
    ornery: ["The start of the dark. Everyone pretended it was a fault. Cowards.", "Yes. And nobody in charge said a thing. Typical."],
    shy: ["...Yes. The dark. I don't like talking about it.", "...It crept. Street by street."],
    curious: ["Yes. I traced it. The outer districts first, then inwards. Like something draining.", "The pattern was clear once you looked. Nobody wanted to look."],
    dreamy: ["Yes. The city closing its eyes, one window at a time.", "The dark came like a tide. Slow. Then not slow."],
    witty: ["The start of the dark. Turns out you can't patch a whole city with tape.", "Yes. The power cut that never ended."],
    proud: ["Yes. And I kept my district lit longer than anyone. That's something.", "The dark. We fought it. We were losing."],
    gloomy: ["The start of the end. Yes.", "That's when I knew. Everyone knew. Nobody said."],
  });
  byTemper('rift.knack.here', {
    cheerful: ["Here's lovely for it! Slow, but lovely! I'm learning so much!", "There's always something! Your village needs fixing in a hundred tiny ways! Bliss!"],
    ornery: ["Here? Everyone does it the slow way and won't be told. ...They're right half the time.", "Here they do it with their hands and a lot of tea breaks. I've stopped arguing."],
    shy: ["...There's a bit. I help quietly. Nobody needs to know it's me.", "I do what I can. I don't make a fuss."],
    curious: ["Here's fascinating. Everything you lot do has an old reason. I'm collecting them.", "Different tools, same problems. I love comparing them."],
    dreamy: ["Here it's gentler. The work doesn't hurry you. I like that.", "It's the same work, but under a sky. That changes everything."],
    witty: ["Here, the tools are older than my city. And somehow better maintained.", "Here, a hard day's work ends with pie. Unthinkable, back home."],
    proud: ["I've already made myself useful. Ask around.", "They're starting to come to me. I'm good at this, here too."],
    gloomy: ["There's work. It's not the same. But it's work. It helps.", "I keep my hands busy. Then I don't think so much."],
  });
  byTemper('rift.knack.advised', {
    cheerful: ["Yes! I'll go now! Thank you! I love meeting people!", "Copy that! Off I go! I'll bring biscuits!"],
    ornery: ["Fine. I'll go. If {riftJobMate}'s rude, I'm coming back to complain to you.", "Hm. All right. One visit."],
    curious: ["Oh, I'd love to see how {riftJobMate} works! I'll take notes!", "Yes! Comparing methods! I'll go today."],
    dreamy: ["{RiftJobMate}... okay. Maybe we'll find something in common.", "I'll wander over. Slowly. See what happens."],
    witty: ["Two experts in one place. The valley may not survive it.", "I'll go. Professional courtesy. And to judge."],
    proud: ["I'll go and introduce myself. Properly. As an equal.", "Good idea. {RiftJobMate} should know there's a professional in the valley."],
    gloomy: ["Maybe. {RiftJobMate} might not want me there. ...I'll try.", "Okay. If you think so."],
  });
  byTemper('rift.knack.thanks', {
    cheerful: ["Aw! Thank you! Full signal!", "Lucky! I'll take it! Thank you, wizard!"],
    ornery: ["Hm. They'd better be. ...Thanks.", "Lucky. Tell that to the miller."],
    shy: ["...Oh. Thank you. That's kind.", "*goes a bit pink*"],
    curious: ["Lucky? I'd like to measure that. ...Thank you.", "Interesting. I never thought of it like that."],
    dreamy: ["Lucky... I'll keep that word. Thank you.", "That's a lovely thing to hear."],
    witty: ["Lucky. Tell them to pay me in scones.", "I'll put that on a sign. 'Lucky to have me'. Very modest."],
  });
  byTemper('rift.knack.sheep', {
    cheerful: ["Ha! But they'd be so cute! Glowing sheep!", "Too late! Just one! A small light!"],
    ornery: ["The sheep would thank me. It's dark out there.", "Fine. No lights. Their loss."],
    shy: ["*giggles* I wasn't going to. ...Much.", "Ha. Okay. No sheep lights."],
    curious: ["Actually, a reflective strip would cut losses at night. Just saying.", "Noted. But think about the data we'd get."],
    dreamy: ["Glowing sheep on the hill at night. Like stars that baa. That'd be beautiful.", "Ha. A field of little lights. I'd like that."],
    proud: ["I'd make a very good sheep light. The best.", "Fine. But they'd be well made."],
    gloomy: ["Ha. The sheep would be the only thing still lit back home.", "Okay. No sheep. Pity."],
  });
  byTemper('rift.battery.start', {
    shy: ["Oh. It's... okay. A bit low. I don't use it much.", "Um. Fine? I keep it off, mostly. Saves it."],
    curious: ["Let me check. ...Forty-two per cent. Losing about two a day if I'm careful. I log it.", "Interesting question. It drains faster here. I think it's the damp."],
    dreamy: ["I don't look at it much. I like not knowing. The not knowing is restful.", "Low, I think. I've been watching the sky instead of the screen."],
  });
  byTemper('rift.battery.nosocket', {
    cheerful: ["Nowhere! It's an adventure! I'm going to build one!", "No sockets! Not one! Isn't that brilliant? Everything just... works without!"],
    ornery: ["Nowhere. A whole village without a single socket. Barbaric. Lovely, but barbaric.", "Nowhere. I asked. They laughed."],
    shy: ["...Nowhere. I just let it run down. It's fine.", "...I don't. I haven't asked anyone."],
    dreamy: ["Nowhere. Maybe that's the point. Maybe here you're meant to run down.", "No sockets. Just sunshine. I lie in it sometimes like a plant."],
    proud: ["Nowhere yet. I'm working on it. I'll have it sorted soon.", "Nowhere. But I won't be beaten by a lack of sockets."],
    gloomy: ["Nowhere. It's dying. Like everything I brought.", "There's nowhere. I've stopped looking."],
  });
  byTemper('rift.battery.dynamo', {
    cheerful: ["At the dynamo! It's my favourite place! I go even when I don't need to!", "The River Dynamo! It hums! I hum back!"],
    ornery: ["The dynamo. If the fishers stop complaining long enough to let me through.", "At the dynamo. Queue's terrible. Worth it."],
    shy: ["The dynamo. Early, when nobody's there. I like it quiet.", "At the river. I sit on the bank while it charges. It's peaceful."],
    curious: ["The dynamo! I've been improving the coil. Fourteen per cent better. Don't tell anyone, they'll want it.", "At the dynamo. I'm studying the output curve. It changes with the weather."],
    witty: ["The dynamo. Best seat in the valley. River view. No cover charge.", "The dynamo. Where rift-folk go to plug in and gossip."],
    gloomy: ["The dynamo. It's the one place here that feels like home. A little.", "At the river. It's quiet. I like that it's quiet."],
  });
  byTemper('rift.battery.tea', {
    cheerful: ["Tea! Yes! It works on me too! Four cups and I'm at a hundred per cent!", "Ha! A tea battery! I'm inventing that!"],
    shy: ["*smiles* Tea does help. A bit.", "...It does, actually. Tea helps."],
    curious: ["Tea! Actually, I've been studying that. Caffeine plus ritual equals recharge. The ritual matters more.", "Interesting. Tea doesn't charge a visor. But it charges something."],
    dreamy: ["Tea... the warmth goes all the way down. It's a kind of light, isn't it.", "Maybe tea's the battery here. Hobbits run on it."],
    proud: ["I've already worked that out. Tea is essential. I drink it properly now.", "Tea. Of course. I'm a quick study."],
    gloomy: ["Tea helps. It doesn't fix. But it helps.", "Tea. Yes. The one thing that's always warm."],
  });
  byTemper('rift.battery.flat', {
    cheerful: ["When it's flat? I just talk to people instead! It's actually more fun!", "Flat means I look up! Turns out up is pretty!"],
    ornery: ["When it's flat I have to actually talk to people. It's the worst. ...It's not the worst.", "Flat means no maps. I got lost going to the mill. The miller laughed for a week."],
    shy: ["...When it's flat I feel very... seen. Like I've lost a curtain.", "Flat. I don't have anything to hide behind."],
    witty: ["When it's flat, I'm just a person with a fancy eye-patch.", "Flat means I'm running on charm. You see the problem."],
    proud: ["When it's flat I manage. I always manage.", "I don't need it. I just like it. When it's flat I'm still me."],
  });
  byTemper('rift.battery.study', {
    cheerful: ["We're learning! It's brilliant! Your miller's very patient with us!", "Yes! We're so close! It's the best puzzle!"],
    shy: ["We're trying. I mostly watch. And take notes.", "...Some of us are learning. I help."],
    curious: ["We're learning everything! Wheels, sails, the angle of the sun! I've filled two notebooks!", "Make our own? Yes! A coil on an axle! It's so simple! Why didn't we think of it back home?"],
    dreamy: ["We're learning to drink the river. That sounds strange. It feels right.", "We watch the wheels and the wind. Like listening to a story."],
    witty: ["Make our own? We're trying. The river's cooperating. The miller isn't.", "We're learning. Slowly. The river's a patient teacher."],
    proud: ["We will. Give us a season. We'll have this valley humming.", "We're nearly there. I've figured out most of it."],
    gloomy: ["Maybe. It's slow. Everything's slow here.", "Trying. It won't bring the city back. But it helps."],
  });
  byTemper('rift.battery.quietself', {
    cheerful: ["No! It's lovely, actually! I've met so many people since it died!", "Not bad at all! I'm less plugged in and more plugged into people!"],
    ornery: ["Bad? It's... fine. Quieter. I'm getting used to quiet. Don't spread it around.", "It's not bad. It's different. I hate different. I'm getting used to it."],
    shy: ["...It's scary at first. Then it's not. Now I like it, a bit.", "...It's quieter in my head. That's nice."],
    curious: ["Not bad. Interesting! My brain's doing things it never did. Remembering. Noticing.", "Bad? I'm thinking more slowly and more deeply. I'm not sure that's bad at all."],
    dreamy: ["Not bad. It's like taking off a pair of glasses you forgot you wore.", "It's peaceful. Like the world got wider."],
    proud: ["It's not bad. I'm more than my gadgets. I always knew that.", "I manage fine. Better, maybe."],
  });
  byTemper('rift.battery.citylow', {
    cheerful: ["It does mean more. I don't like saying it. The city's running down.", "Back home everyone says it. 'Low battery.' Then they laugh. Then they don't."],
    ornery: ["It does. The whole city's on low. And nobody in charge would admit it.", "Low battery. The whole stack. Twenty years of pretending it wasn't."],
    curious: ["It's not a metaphor. The city's real battery. The Lamplighter. Running down. I measured it.", "I've done the numbers. The city loses about a district a season now."],
    dreamy: ["The whole city's like a candle near the bottom. Still bright. Getting smaller.", "Low battery. Like the city's breathing slower."],
    witty: ["Low battery. Our whole civilisation's at three per cent. Should've charged it.", "It's a joke that stopped being funny."],
    proud: ["It does. And we fought it as long as we could.", "It means the city's dying. I won't pretend otherwise."],
    gloomy: ["It means the city's going out. That's all it means now.", "Low battery. Then no battery. Then dark."],
  });
  byTemper('rift.battery.bright', {
    cheerful: ["Aw! You're plenty bright too! For a wizard!", "Ha! Thanks! Full signal!"],
    ornery: ["Hm. Flattery. ...It worked a bit.", "Don't. ...Thanks."],
    curious: ["Bright without it? I'll test that theory. Thank you.", "Huh. Never thought of myself as bright without it."],
    dreamy: ["Bright without it... like a star without a lamp. I like that.", "That's a lovely thing to say."],
    witty: ["Plenty bright. Well, I am now that I'm blushing.", "Bright enough to see through flattery. Keep going."],
    proud: ["I know. But it's nice to hear.", "I am. Thank you for noticing."],
    gloomy: ["...Thanks. I don't feel it. But thanks.", "Bright. Hm. Maybe once."],
  });
  byTemper('rift.battery.river', {
    cheerful: ["The river's the best! I wave at it!", "It is! Good river! Good water!"],
    ornery: ["The river doesn't care. That's why I like it.", "The river's reliable. I respect that."],
    shy: ["...I like the river. It doesn't ask anything.", "...The river's nice. Quiet."],
    curious: ["Water's remarkable. I'm still working out its moods.", "It is! And I'm studying how it does it."],
    dreamy: ["The river looks after us. I believe that.", "Yes. The river's kind. Like a lullaby."],
    witty: ["The river's our landlord now. Very reasonable rent.", "The river. Best employer I ever had."],
    proud: ["The river and us. We've made a good team.", "We've earned the river's help. We built it right."],
    gloomy: ["The river's the only thing that never stops. That's comforting.", "Yes. Water just keeps going. I'm trying to learn that."],
  });
  byTemper('rift.battery.mind', {
    cheerful: ["Some do! But most bring us tea! It's a hum-and-tea arrangement!", "Mostly no! A few grumble! We wave!"],
    ornery: ["Some mind. Let them. The fish don't.", "The old ones complain. They complain about everything."],
    shy: ["...Some look at it funny. I try not to be there when they do.", "...A bit. I don't blame them."],
    curious: ["Some do. I've been asking why. It's mostly the noise. I'm working on a quieter coil.", "Interesting split. Young folk love it. Old folk fear it."],
    dreamy: ["Some do. But the children sit by it at night and watch it glow.", "A few. I think they'll grow to like the hum."],
    witty: ["Mind it? They've named it. That's practically adoption.", "They mind it the way they mind the weather. Loudly and daily."],
    proud: ["Let them mind. It's useful. They'll come round.", "Some do. They'll thank us one day."],
    gloomy: ["Some do. I understand. It's not theirs.", "Yes. It's another thing that changed their valley."],
  });
  byTemper('rift.battery.teajest', {
    cheerful: ["Two sugars! Full charge! I'm trying it right now!", "Ha! Perfect!"],
    ornery: ["One sugar. I'm not made of sugar.", "None. I take my charge bitter."],
    shy: ["*smiles* One. One's enough.", "Ha. Two sugars."],
    curious: ["I'll test it. Two versus three. For science.", "Two. Noted. I'll compare results."],
    dreamy: ["Two sugars and a sunset. That's a full charge.", "Two... and a biscuit. Definitely a biscuit."],
    witty: ["Two sugars. And a scone for backup power.", "Two for a top-up, five for a reboot."],
    proud: ["I take it properly. Milk first. Two sugars.", "I have my own system. It's better."],
    gloomy: ["Two sugars. Might help.", "Whatever works."],
  });
  byTemper('rift.battery.miller', {
    cheerful: ["The miller! Yes! I'll go now! I love millers!", "Brilliant! Off I go!"],
    ornery: ["The miller. Fine. He'd better explain slowly.", "Hm. If I must."],
    shy: ["...The miller. Okay. I'll try.", "...Will you come with me? No? Okay."],
    curious: ["Millers love explaining! I love being explained to! Perfect!", "Yes! I've so many questions about the gearing!"],
    dreamy: ["The miller. The man who talks to the river. Yes.", "I'll go and sit by the wheel and listen."],
    witty: ["Millers love explaining. Rift-folk love asking. It's a match.", "The miller. My new favourite lecturer."],
    proud: ["The miller. One expert to another.", "I'll show the miller a thing or two as well."],
    gloomy: ["The miller. All right. If you think it helps.", "Maybe. I'll try."],
  });
  byTemper('rift.quiet.now', {
    cheerful: ["Now I love it! The quiet's full of little sounds! Birds! Bees! Bliss!", "Now it's lovely! I sleep like a baby! A baby who's had second breakfast!"],
    ornery: ["Now? I complain when it's not quiet. Look what you lot did to me.", "Now I can't stand the noise at the Badger. You've ruined me."],
    shy: ["...Now I like it. It's a safe kind of quiet.", "...Now it's mine. My quiet."],
    curious: ["Now I can hear frequencies I never noticed. The grass makes a sound. Did you know?", "Now my ears have adjusted. Turns out they were damaged. They're healing."],
    dreamy: ["Now it's like a blanket. I wrap myself in it.", "Now the quiet sings. You just have to listen low."],
    proud: ["Now I'm better at quiet than anyone in the valley.", "Now I've mastered it. Took discipline."],
  });
  byTemper('rift.quiet.listening', {
    cheerful: ["...Oh! A blackbird! And a kettle! And someone laughing! I love this!", "...Hear that? Bees! Happy bees!"],
    ornery: ["...A dog. That dog never shuts up. Otherwise... fine. It's nice.", "...Someone's chopping wood. Badly. Otherwise nice."],
    curious: ["...River, wind, three birds, one hen. I'm counting.", "...Fascinating. Every sound has a place it comes from. Here you can hear the places."],
    dreamy: ["...The wind in the grass sounds like the city breathing. Far away.", "...If I close my eyes it's like the hum. Just softer."],
    witty: ["...The sound of a wizard trying very hard not to talk. Impressive.", "...An owl. And your stomach. Is that your stomach?"],
    proud: ["...I can name every sound. I've learned them all.", "...I know this valley's noises by heart now."],
    gloomy: ["...Just the wind. It sounds lonely.", "...Quiet. It still feels empty, sometimes."],
  });
  byTemper('rift.quiet.badger', {
    cheerful: ["Ha! I've been! It's the best! They sang till three!", "The Badger! I love the Badger! It's the city in a pint!"],
    ornery: ["The Badger's not noise. It's a disgrace. A lovely disgrace.", "I've been. Some fool sang for four hours. It was me."],
    shy: ["...I've only been once. It was a lot.", "...The Badger is very loud. I sat in the corner."],
    curious: ["The Badger's fascinating. Same people, same songs, every week. A ritual.", "I've studied the Badger. There's a seating order. Unwritten. Strict."],
    dreamy: ["The Badger's warm noise. Like a fire with voices.", "That's a different noise. A happy one."],
    proud: ["I've been. I won the darts. Twice.", "The Badger. I'm a regular now."],
    gloomy: ["The Badger's nice. Then you walk home in the dark, and it's quiet again.", "Highday's loud. Then Trewsday's empty."],
  });
  byTemper('rift.quiet.city', {
    cheerful: ["Ha! It is! The friendliest city ever!", "A city of nineteen! I love it!"],
    ornery: ["A city with no rent and too much singing. Fine.", "Hm. Better than mine. Don't quote me."],
    shy: ["...A small city. Small's nice.", "*laughs quietly* Yes."],
    curious: ["Interesting. Population density of the Badger at peak is higher than the eastern stack.", "A city in miniature. I've been mapping it."],
    dreamy: ["The Badger's a city in a jar. A warm one.", "A small bright place in the dark. Like home."],
    proud: ["A city where I'm known. That's better than mine.", "And I'm one of its regulars."],
    gloomy: ["A city that closes at midnight. I like that more than I thought.", "A small one. With a door you can close."],
  });
  byTemper('rift.quiet.sounds', {
    cheerful: ["Everything! Birds! Kettles! Children shrieking! Heaven!", "Bees! I love the bees! They sound busy and happy at once!"],
    ornery: ["Cockerels. Constantly. At all hours. Somebody should have a word.", "The miller's squeaking wheel. Every day. Driving me mad. I'll fix it."],
    shy: ["...Mostly the wind. And people talking, far off. I like hearing them without being in it.", "...Footsteps on the lane. I know whose, now."],
    curious: ["Twelve kinds of bird. I've been learning which is which. The wren's my favourite.", "Wood creaking, water dripping, hens arguing. Everything has its own frequency."],
    dreamy: ["The wind through the barley. Like the sea, someone said. I've never seen a sea.", "Rain on the round door. Tap tap tap. Like someone gently asking to come in."],
    witty: ["Mainly my neighbour snoring. You could power the Relay off it.", "The hens. They gossip worse than the Relay."],
    proud: ["I know every sound in this valley now. I can tell you who's chopping wood by the rhythm.", "My own door. Opening. Mine."],
    gloomy: ["The wind. It sounds like it's looking for something.", "Nothing, at night. Absolutely nothing. Still getting used to it."],
  });
  byTemper('rift.quiet.skies', {
    cheerful: ["More skies than you can count! Tell me about all of them!", "Ooh! You're a sky collector!"],
    ornery: ["Lucky you. I've had one sky and it fell in.", "Show-off."],
    shy: ["...Were they all this pretty?", "...I've only had two. This one's nicer."],
    dreamy: ["Other skies... I'd love to sleep under all of them. One by one.", "Do they all have stars? Different stars?"],
    witty: ["More skies than you can count. You're terrible at counting, though.", "A sky tourist. With a staff."],
    proud: ["Then you'll know this one's special. I've only seen two and I know it.", "I'll catch up. Give me time."],
    gloomy: ["And did any feel like home? ...Sorry. That's a big question.", "Different skies. Same loneliness, I bet."],
  });
  byTemper('rift.quiet.stars', {
    cheerful: ["The stars! Oh, wizard! Every night it's like a party in the sky!", "I love them! I've named one after my mum! It's the twinkly one!"],
    shy: ["...I go out alone to look at them. Nobody knows.", "...They make me feel like the sky's looking back. Kindly."],
    witty: ["The stars. Free. No adverts. Nobody's sponsoring Orion. Remarkable.", "Stars. Your sky's got better graphics than ours."],
    proud: ["I know half the constellations already. Learned them from the old folk.", "The stars are magnificent. Even Neverdark at its brightest wasn't this."],
  });
  byTemper('rift.quiet.nostars', {
    cheerful: ["Never! Can you imagine? I never knew what I was missing!", "No stars! Not one! I've made up for it, though!"],
    ornery: ["Never. The sky was ads. Somebody sold the sky. I'm still angry about it.", "No. All that light and not one star."],
    shy: ["...No. The sky was always lit. I didn't know it could be dark and kind.", "...Not once."],
    curious: ["Never. The light pollution was total. We knew stars existed. In theory.", "Our astronomers worked from old records. Nobody had seen one in centuries."],
    dreamy: ["Never. We had stories about them. I thought they were made up.", "No. The clouds were our stars. Lit gold."],
    proud: ["We had our own lights. Better, we thought. We were wrong.", "Never. We didn't need them, we said. Pride."],
    gloomy: ["Never. And now the city's going dark, they might finally see them. That's... something.", "No. And when they do, it'll be because everything's off."],
  });
  byTemper('rift.quiet.names', {
    cheerful: ["Tell me all of them! And I'll tell you mine! Mine are funnier!", "Yes! Names! I'll write them down!"],
    ornery: ["Names. Fine. But I'm keeping mine. That one's the Kettle. Final.", "If I must. Mine are better."],
    shy: ["...Yes please. I'd like to know.", "...I've been calling them by little names. Secretly."],
    curious: ["Yes! Every one! How old are the names? Who named them?", "Please! I've been dying to know!"],
    dreamy: ["Names... yes. Each one a story. Tell me the stories too.", "Their names. Then I can say goodnight to them properly."],
    proud: ["I've learned some already. But tell me the rest.", "I know a few. The Plough. I'm learning."],
    gloomy: ["Names. Yes. It's nice that someone named them. Someone cared.", "Go on. I'll listen."],
  });
  byTemper('rift.quiet.softdark', {
    cheerful: ["The dark! It's so cosy! I never knew dark could be cosy!", "Both! But the dark more. It's friendly here."],
    ornery: ["The dark. Because nobody's selling anything in it.", "The dark. It's honest."],
    curious: ["The dark, I think. It lets my eyes rest. They've never rested before.", "The dark. It's full of things you can only see when the lights are off."],
    dreamy: ["The dark. It's soft, like the inside of a hat. A place where the dark is soft. Someone said that.", "The dark. Back home it was something to fear. Here it holds you."],
    witty: ["The dark. It's the one thing here that doesn't ask if I've eaten.", "The dark. It's very well behaved here."],
    proud: ["The dark. I'm not afraid of it now. I was.", "Both. But I've made peace with the dark."],
    gloomy: ["The dark. It matches me. In a good way.", "The dark. It doesn't pretend."],
  });
  byTemper('rift.quiet.free', {
    shy: ["...Free. Thank you.", "*smiles up at the sky*"],
    curious: ["Free! An entire sky, unmetered! The economics are staggering.", "Free. I keep looking for the catch."],
    dreamy: ["Free stars. I'll take them all. One each night.", "Mine now. All of them. I'll keep them safe."],
    witty: ["Free. Finally, a deal I can afford.", "No charge. You lot really need to learn about pricing."],
    proud: ["Free. And I'll treasure them better than anyone.", "Thank you. I'll look after them."],
    gloomy: ["Free. The best things here are. That's almost too much.", "Mine. ...Okay. Thanks."],
  });
  byTemper('rift.belong.start', {
    cheerful: ["Home! Yes! Mostly! I'm working on the rest!", "It's getting there! Some days it's completely home and I sing about it!"],
    ornery: ["Home? It's where I sleep. Don't make it a big thing.", "It's home if nobody stares. So, half home."],
    shy: ["...I think so? I hope so. I'm afraid to say it out loud.", "...It's starting to feel like it. Quietly."],
    curious: ["Interesting question. Define home. ...Okay, I think it's starting to meet the definition.", "I've been tracking it. More home every week. I'll let you know when it crosses over."],
    dreamy: ["Home's a feeling. I get it more here at dusk than anywhere.", "Sometimes I wake up and it's home. Sometimes it's a dream I'm visiting."],
    proud: ["It's home because I've made it home. Nobody gave it to me.", "Home. I built it. I'll keep it."],
  });
  byTemper('rift.belong.make', {
    cheerful: ["A big party! With everyone! Then it'd be home for sure!", "Friends! More friends! I have some! I want all of them!"],
    shy: ["...One person who'd notice if I wasn't there.", "...A little garden. Just mine."],
    curious: ["More time. Home's a habit, I think. Habits take time.", "Knowing why things are the way they are. I'm halfway."],
    dreamy: ["A song I could sing that everyone knew. Then I'd belong to the song.", "A window that's mine, with a light in it, and someone looking for it."],
    witty: ["A pantry I'm allowed to raid. That's the hobbit test, isn't it.", "A neighbour who complains about me. Then I'd know I'm local."],
    proud: ["A place I've built. Something with my name on it.", "Respect. Earned, not given. I'm earning it."],
    gloomy: ["I don't know. Maybe nothing. Maybe it just happens one day.", "Not missing the other place. I don't know if that ever stops."],
  });
  byTemper('rift.belong.advised', {
    cheerful: ["Yes! I'll plant something! A whole row of something!", "That's brilliant advice! Thank you!"],
    shy: ["...Okay. I'll try.", "...I'll start small."],
    curious: ["Huh. That's good. I'll try it and see what happens.", "Practical. I like practical."],
    dreamy: ["Plant something. Grow roots. Yes. Like a tree. I like that.", "I'll sing it. Under my breath, for now."],
    witty: ["Advice from a wizard who's never stayed anywhere. Bold. ...Good, though.", "Noted. Filed. Possibly even acted on."],
    gloomy: ["Maybe. It's worth a try.", "I'll try. I don't know if it'll work."],
  });
  byTemper('rift.belong.both', {
    cheerful: ["Both! That's brilliant! I'll have both!", "Home and not! Yes! Both at once!"],
    ornery: ["Both. Hm. Doesn't sound restful.", "Fine. Both. If I must."],
    shy: ["...Both. Okay. That's allowed?", "*nods slowly* Both."],
    curious: ["Both. Like a superposition. I can work with that.", "Home and not. Two states at once. Interesting."],
    witty: ["Both. The best of two worlds. And the worst plumbing of both.", "Home and not. I've always been good at contradictions."],
    proud: ["Both. And I'll do both properly.", "Then I'll be a credit to both."],
  });
  byTemper('rift.belong.badday', {
    cheerful: ["Not many bad days! But when there's rain at night, I miss the colours.", "When I'm tired! Everything's harder tired!"],
    ornery: ["When someone tells me how things are done here. I know how they're done.", "Being treated like a guest. I live here."],
    shy: ["...When I'm the only one who doesn't know the words to a song.", "...When everyone's laughing at a joke I don't get."],
    curious: ["When I can't explain something. I hate not knowing.", "When I realise how much I still don't understand."],
    dreamy: ["When I dream of home and wake up here. Those mornings are heavy.", "Dusk. Just dusk. Something about the light going."],
    witty: ["Mondays. Universal constant.", "When the pie runs out. Very bad day."],
    proud: ["When someone treats me as less. I'm not less.", "When I make a mistake in front of everyone."],
    gloomy: ["Most days have a bad bit. Usually evening.", "When I see families together. I miss mine."],
  });
  byTemper('rift.belong.door', {
    cheerful: ["I'd go and visit! And come back! Both! Can I do both?", "I'd go! Then I'd miss the cake and come straight back!"],
    ornery: ["Would I go? ...I'd go and shout at whoever let the city get so bad. Then come back.", "Don't ask me that. I hate that question."],
    shy: ["...I don't know. I don't want to know.", "...I'd stand at the door a very long time."],
    curious: ["I'd want to see what's changed. Then decide. Data first.", "That depends on what's on the other side now. I'd look first."],
    dreamy: ["I'd step halfway through and stand in the doorway, one foot each side.", "I think I'd wave through it. And stay."],
    witty: ["Would I go? I'd want a return ticket first.", "I'd go, look, complain about the lighting, and come back for supper."],
    proud: ["I'd decide when I saw it. On my terms.", "I'd go if I was needed. I'd stay if I wasn't."],
    gloomy: ["I'd want to. And I'd stay anyway. That's what scares me.", "I don't know. Either way, I'd lose something."],
  });
  byTemper('rift.belong.torn', {
    cheerful: ["Torn! But in a happy way! Two lovely halves!", "Both! I want both! Can't I have both?"],
    ornery: ["Torn. Don't make me say it twice.", "Yes. Torn. It's horrible. Moving on."],
    shy: ["...Yes. Torn.", "*nods, eyes down*"],
    curious: ["Torn. It's like two signals at equal strength. You can't tune either.", "Torn. I can't calculate my way out of it."],
    dreamy: ["Torn like a page. Half a story each side.", "Like a bridge with both banks pulling."],
    proud: ["Torn. But I'll decide. I always decide.", "It's hard. I won't pretend it isn't."],
  });
  byTemper('rift.belong.welcome', {
    cheerful: ["Welcome back! Yes! That's lovely!", "Thank you! I'll always come back!"],
    curious: ["Welcome back. That's a promise from the whole valley? Or just you?", "Thank you. That changes the calculation."],
    dreamy: ["Welcome back... like a lamp in a window. Thank you.", "I'll keep that. Like a key."],
    witty: ["Welcome back. I'll hold you to that. With a pie.", "Noted. A standing invitation. In wizard writing."],
    proud: ["Thank you. I'd have come back anyway. But thank you.", "Good. I'll remember that."],
    gloomy: ["Welcome back. ...That's more than I expected.", "Thank you. I needed that."],
  });
  byTemper('rift.belong.wizroot', {
    cheerful: ["Never stayed anywhere? Then stay here! With us! Please!", "You need a home too! We'll find you one!"],
    ornery: ["Never stayed anywhere? No wonder you're like this.", "Hm. And you're giving me advice."],
    shy: ["...You don't have a home either? ...Oh.", "...That's sad. You should stay. Here."],
    curious: ["Never? Not once? How do you decide where to go next?", "That's fascinating. And a bit sad."],
    dreamy: ["Never stayed... like a cloud. Always going. That's lovely and lonely.", "Then everywhere's a little bit home. Or nowhere is."],
    proud: ["Then I'm ahead of you. I've made a home.", "Then I'll show you how. It's not so hard."],
    gloomy: ["Never stayed. ...Maybe that's easier. You never have to leave.", "Then you know. You really do know."],
  });

});
