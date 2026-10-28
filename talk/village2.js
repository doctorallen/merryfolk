'use strict';
// ---------------------------------------------------------------------------
// The village, part two: talk and opinions. What they make of the latest
// gossip (and whether the wizard helps it on its way or hushes it), the wild
// rumors that go round the Badger, what they hold dear (thrift, merrymaking,
// the old ways, learning, family, craft, the green valley, tidiness) and how
// they take it when the wizard agrees or doesn't, how Thistledown has changed,
// and their turn: asking the wizard's view on a village matter.
// ---------------------------------------------------------------------------

talkPack('village2', () => {
  const has = (x) => x != null && x !== false && x !== '';
  const TEMPERS = ['cheerful', 'ornery', 'shy', 'curious', 'dreamy', 'witty', 'proud', 'gloomy', 'child'];
  const say = (key, spec, more) => {
    const rules = [];
    for (const k in spec) {
      const text = spec[k];
      if (k === '_') rules.push({ text });
      else if (TEMPERS.includes(k)) rules.push({ if: { temper: k }, text });
      else if (k === 'elder' || k === 'grown') rules.push({ if: { stage: k }, text });
      else if (k === 'rift') rules.push({ if: { rift: true }, text });
      else if (['plain', 'fine', 'bright'].includes(k)) rules.push({ if: { register: k }, text });
      else throw new Error(`village2 pack: unknown spec "${k}" in ${key}`);
    }
    lines(key, rules.concat(more || []));
  };
  const VK = (k) => ({ if: { vValueKey: k } });

  // --- Facts: the news they know, a rumor, what they hold dear, a matter of the day ----
  const RUMORS = {
    dragon: 'there\'s a dragon asleep under the far wood', ghost: 'the old mill is haunted by a miller who won\'t stop grinding', treasure: 'there\'s gold buried under the party tree',
    wishing: 'the well grants a wish if you drop in a button at midnight', giant: 'a giant walked past the North Farthing in the fog', wedding: 'there\'s to be a secret wedding before the harvest',
    bree: 'the Bree carter is really a prince in disguise', eel: 'there\'s an eel in the mill-pond as long as a cart', rift: 'the rifts are doors, and someone\'s knocking from the other side',
  };
  const MATTERS = {
    dance: { what: 'a dance on the party field every Highday', pro: ['merriment', 'kin'], con: ['thrift', 'order', 'tradition'] },
    copse: { what: 'felling the old copse for timber', pro: ['craft', 'thrift'], con: ['nature', 'tradition'] },
    relay: { what: 'the rift-folk\'s Relay mast', pro: ['learning'], con: ['tradition', 'nature'], rift: true },
    school: { what: 'longer school hours for the little ones', pro: ['learning', 'kin'], con: ['tradition', 'merriment'] },
    feast: { what: 'a great feast out of the Common Store', pro: ['merriment', 'kin'], con: ['thrift', 'order'] },
    lamps: { what: 'more lamps along the lanes', pro: ['order', 'kin'], con: ['nature', 'thrift'] },
    field: { what: 'plowing the long meadow for barley', pro: ['thrift', 'craft', 'order'], con: ['nature'] },
    statue: { what: 'a statue on the green', pro: ['craft', 'tradition'], con: ['thrift', 'nature'] },
    paths: { what: 'paving the lanes with good stone', pro: ['order', 'craft'], con: ['nature', 'tradition'] },
    quiet: { what: 'a quiet hour every afternoon, with no hammering', pro: ['tradition', 'order'], con: ['craft', 'merriment'] },
    neon: { what: 'stringing rift-lights round the square', pro: ['learning', 'merriment'], con: ['tradition', 'nature'], rift: true },
    swing: { what: 'a swing for the little ones on the party tree', pro: ['kin', 'merriment'], con: ['thrift', 'order'] },
    pact: { what: 'a trade pact with Bree', pro: ['thrift', 'learning'], con: ['tradition'] },
  };
  const PET_MATTER = { field: 'field', fell: 'copse', dance: 'dance', quiet: 'quiet', lights: 'neon', swing: 'swing', school: 'school', pact: 'pact' };
  const KEYS = ['vNews', 'vNewsId', 'vNewsKind', 'vNewsKnown', 'vNewsWide', 'vRumor', 'vRumorKey', 'vValue', 'vValueKey', 'vValue2', 'vValue2Key', 'vValueSay', 'vClash', 'vClashId', 'vClashValue',
    'vMatter', 'vMatterWhat', 'vMatterSide', 'vMatterPetition', 'vRiftNow', 'vRiftName', 'vRiftId'];
  addFacts((v, F, T) => {
    for (const k of KEYS) F[k] = null;
    if (v.stage === 'baby') return;
    let P = T && T.vxTalk && T.vxTalk.vid === v.id ? T.vxTalk : null;
    if (!P) {
      P = { vid: v.id };
      const n = (typeof newsList === 'function' ? newsList() : []).find((x) => knowsNews(v, x) && Game.day - x.day <= 5 && !x.text.includes(v.first + ' '));
      P.news = n ? n.id : null;
      const rk = Object.keys(RUMORS).filter((k) => k !== 'rift' || Game.villagers.some((o) => o.isRiftborn()));
      P.rumor = rk[Math.floor(hash2(v.id * 3 + 1, Math.floor(Game.day / 2)) * rk.length)];
      const vals = typeof valuesOf === 'function' ? valuesOf(v) : [];
      const riftOK = Game.villagers.some((o) => o.isRiftborn());
      let mk = null, pet = false;
      if (Game.petition && PET_MATTER[Game.petition.id]) { mk = PET_MATTER[Game.petition.id]; pet = true; }
      if (!mk) {
        const ok = Object.keys(MATTERS).filter((k) => (!MATTERS[k].rift || riftOK) && vals.some((x) => MATTERS[k].pro.includes(x) || MATTERS[k].con.includes(x)));
        if (ok.length) mk = ok[Math.floor(hash2(v.id * 5 + 2, Math.floor(Game.day / 2)) * ok.length)];
      }
      P.matter = mk; P.pet = pet;
      const clashK = vals[0] && VALUES[vals[0]] ? VALUES[vals[0]].clash : null;
      P.clash = clashK ? (Game.villagers.filter((o) => o !== v && o.isGrown() && !o.leaving && (o.values || []).includes(clashK)).sort((a, b) => (v.rel[b.id] ?? 0) - (v.rel[a.id] ?? 0))[0] || null) : null;
      P.riftPerson = Game.villagers.filter((o) => o !== v && o.isRiftborn() && o.isGrown() && !o.leaving).sort((a, b) => (v.rel[b.id] ?? 0) - (v.rel[a.id] ?? 0))[0] || null;
      if (T && T.v) T.vxTalk = P;
    }
    const n = P.news != null ? newsList().find((x) => x.id === P.news) : null;
    if (n) {
      const pop = Game.villagers.filter((o) => o.stage !== 'baby').length || 1;
      Object.assign(F, { vNews: n.text.replace(/[.!]$/, ''), vNewsId: n.id, vNewsKind: n.kind, vNewsKnown: (Game.wizKnows || []).includes(n.id), vNewsWide: n.knowers.length / pop > 0.6 });
    }
    if (P.rumor) Object.assign(F, { vRumor: RUMORS[P.rumor], vRumorKey: P.rumor });
    const vals = typeof valuesOf === 'function' ? valuesOf(v) : [];
    if (vals[0] && VALUES[vals[0]]) {
      Object.assign(F, { vValue: VALUES[vals[0]].label.toLowerCase(), vValueKey: vals[0], vValueSay: VALUES[vals[0]].say });
      const c = VALUES[vals[0]].clash;
      if (c && VALUES[c]) F.vClashValue = VALUES[c].label.toLowerCase();
    }
    if (vals[1] && VALUES[vals[1]]) Object.assign(F, { vValue2: VALUES[vals[1]].label.toLowerCase(), vValue2Key: vals[1] });
    if (P.clash && Game.villagers.includes(P.clash)) Object.assign(F, { vClash: P.clash.first, vClashId: P.clash.id });
    if (P.matter && MATTERS[P.matter]) {
      const M = MATTERS[P.matter];
      Object.assign(F, { vMatter: P.matter, vMatterWhat: M.what, vMatterPetition: !!P.pet, vMatterSide: vals.some((x) => M.pro.includes(x)) ? 'pro' : vals.some((x) => M.con.includes(x)) ? 'con' : 'none' });
    }
    F.vRiftNow = Game.villagers.some((o) => o.isRiftborn() && !o.leaving);
    if (P.riftPerson && Game.villagers.includes(P.riftPerson)) Object.assign(F, { vRiftName: P.riftPerson.first, vRiftId: P.riftPerson.id });
  });
  const spread = (T, k) => {
    const n = T.F.vNewsId != null ? newsList().find((x) => x.id === T.F.vNewsId) : null;
    if (!n) return;
    const pool = Game.villagers.filter((o) => o.stage !== 'baby' && !n.knowers.includes(o.id));
    for (let i = 0; i < k && pool.length; i++) n.knowers.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
  };

  // =================================================================================
  // The talk of the village: what they make of the news
  // =================================================================================
  addThread({
    id: 'village.gossip', label: 'What\'s the talk of the village?', weight: 1, cool: 2,
    when: (F) => has(F.vNews), rel: (F) => (F.vNewsKnown ? 0.9 : 1.5),
    open: { ask: 'village.gossip.open' },
    beats: {
      start: { line: 'village.gossip.start', fx: { run: (T) => { const k = Game.wizKnows || (Game.wizKnows = []); if (T.F.vNewsId != null && !k.includes(T.F.vNewsId)) k.push(T.F.vNewsId); } }, go: [
        { ap: 'ask', say: 'And what do you make of it?', to: 'opinion' },
        { ap: 'jest', say: 'I heard it with three more dragons in it.', to: 'embroider' },
        { ap: 'advise', say: 'Careful. A tale grows legs on its way round.', to: 'careful' },
      ] },
      opinion: { line: 'village.gossip.opinion', go: [
        { ap: 'ask', say: 'Who told you?', to: 'source' },
        { ap: 'warm', say: 'Good news ought to go round. Tell it far and wide.', to: 'tellall', need: { if: { vNewsKind: ['love', 'birth', 'party', 'learn', 'build', 'letter', 'adventure', 'work'] } } },
        { ap: 'advise', say: 'Then let it rest there. It\'s their business, not ours.', to: 'hush' },
      ] },
      embroider: { line: 'village.gossip.embroider', go: [
        { ap: 'jest', say: 'Tell it my way. See how far the dragons get.', to: 'spread' },
        { ap: 'warm', say: 'No, no. The plain tale\'s good enough.', to: 'opinion' },
      ] },
      careful: { line: 'village.gossip.careful', go: [
        { ap: 'advise', say: 'Tell it kindly, or not at all.', to: 'hush' },
        { ap: 'ask', say: 'Who else knows?', to: 'source' },
      ] },
      source: { line: 'village.gossip.source', go: [
        { ap: 'jest', say: 'Then the whole valley will know by teatime.', to: 'teatime' },
        { ap: 'warm', say: 'Well, I\'m glad I heard it from you.', to: 'end', fx: { fond: 0.02 } },
      ] },
      tellall: { line: 'village.gossip.tellall', fx: { run: (T) => spread(T, 3) }, end: true },
      hush: { line: 'village.gossip.hush', fx: { respect: 0.02 }, end: true },
      spread: { line: 'village.gossip.spread', fx: { joke: { k: 'village.dragons', t: 'The news, as the wizard tells it, has three dragons in it.' }, news: '{Name} says the wizard heard the latest news told with dragons in. There weren\'t any.' }, end: true },
      teatime: { line: 'village.gossip.teatime', end: true },
    },
    end: { fond: 0.015 },
  });
  lines('village.gossip.open', [
    { text: ['What\'s the talk of the village, {name}? I\'m all ears. And hat.', 'Go on, {name}. What are they saying at the Badger?', 'I\'ve been away from the gossip a whole day, {name}. Catch me up.'] },
    { if: { stage: 'child' }, text: ['Heard any secrets, {name}? Grown-up ones?'] },
  ]);
  say('village.gossip.start', {
    _: ['Well! {VNews}. Can you credit it?', 'Have you not heard? {VNews}. It\'s all anyone\'s talking about.', 'Oh, the latest. {VNews}. I had it from three people.'],
    cheerful: ['Oh, you\'ll love this! {VNews}! Isn\'t it wonderful?', 'Ha! {VNews}! I\'ve told everyone. Twice.'],
    ornery: ['They\'re all going on about it. {VNews}. As if nothing else ever happens.', '{VNews}. There. Now you know. Now everybody knows.'],
    shy: ['...I heard something. {VNews}. I wasn\'t listening on purpose.', 'Um. {VNews}. I think. That\'s what they said.'],
    curious: ['Oh, I\'ve been piecing it together. {VNews}. But that\'s not the half of it, I suspect.', '{VNews}! And I\'ve some questions about it, I can tell you.'],
    dreamy: ['{VNews}. It\'s like something out of an old song, isn\'t it?', 'Did you hear? {VNews}. I\'ve been thinking about it all morning.'],
    witty: ['Hold on to your hat. Well, you always do. {VNews}.', 'Big news, small village. {VNews}.'],
    proud: ['I was one of the first to know, actually. {VNews}.', 'I have it on good authority. {VNews}.'],
    gloomy: ['{VNews}. Some folk have all the luck. Or all the trouble.', '{VNews}. I suppose it\'ll all go wrong somehow.'],
    child: ['GUESS WHAT. {VNews}! I heard it first! Well, second.', '{VNews}! Is that good? Everyone keeps saying it like it\'s good.'],
    rift: ['Breaking: {VNews}. Spread like a Relay post, that one.', 'The feed\'s full of it. Well, the Badger is. {VNews}.'],
  }, [
    { if: { vNewsKnown: true }, pri: 1, text: ['You\'ve heard, I expect. {VNews}. But have you heard what they\'re saying ABOUT it?', 'Oh, you\'ll know already. {VNews}. You always know first.'] },
    { if: { vNewsWide: true }, text: ['Everyone knows by now, surely. {VNews}. The hens know.'] },
  ]);
  say('village.gossip.opinion', {
    _: ['Make of it? Good luck to them, I say. And about time.', 'I\'ve opinions. I\'ll keep most of them to myself. Some of them.', 'It\'ll be the talk of the Badger for a week, and then something else will.'],
    cheerful: ['Oh, I think it\'s lovely! Every bit of it!'],
    ornery: ['Fuss and nonsense. Folk should mind their own gardens.', 'Make of it? I make that nobody\'s done a day\'s work since.'],
    shy: ['I don\'t like to say. ...I think it\'s nice. Mostly.'],
    curious: ['I want to know how it came about. Nobody seems to know the beginning.'],
    dreamy: ['I think things happen when they\'re meant to.'],
    witty: ['I think it proves that anything can happen in Thistledown, given enough tea.'],
    proud: ['I could have told them it would come to this. I did, in fact.'],
    gloomy: ['It won\'t last. Nothing does.'],
    child: ['I think it\'s exciting! Is there going to be cake?'],
    rift: ['Honestly? Best plotline this valley\'s had all week.'],
  }, [
    { if: { vNewsKind: 'love' }, text: ['A wedding, or near enough. It does the whole village good, that sort of thing.', 'Love! In Thistledown! Well, I\'m glad. I cried a bit, actually.'] },
    { if: { vNewsKind: 'love', temper: 'ornery' }, text: ['Love. Hmph. Give it a winter.'] },
    { if: { vNewsKind: 'birth' }, text: ['A new baby! The village needs more babies. And fewer of the noise.', 'Another little one. Bless them. Bless their poor tired folk.'] },
    { if: { vNewsKind: 'quarrel' }, text: ['A quarrel. Well, it takes two. And it\'ll take two to mend.', 'I\'m keeping out of it. I have my own feelings, mind.'] },
    { if: { vNewsKind: 'rift' }, text: ['The sky again. I don\'t like it. I don\'t mind the folk. I mind the sky.', 'More rifts. More strangers. I suppose they were strangers to somebody once.'] },
    { if: { vNewsKind: 'rift', rift: true }, text: ['Another rift. Every time, I wonder who\'s coming through. Every time.'] },
    { if: { vNewsKind: 'party' }, text: ['A party! Well, I\'ll be there. Where else would I be?'] },
    { if: { vNewsKind: 'adventure' }, text: ['An adventure! Rather them than me. ...I\'m a bit jealous.', 'Off into the wide world. Brave, or daft. Usually both.'] },
    { if: { vNewsKind: 'build' }, text: ['Something new going up. The village is growing, wizard. I can feel it under my feet.'] },
    { if: { vNewsKind: 'letter' }, text: ['A letter from far off! I do love it when mail comes from somewhere with mountains.'] },
  ]);
  say('village.gossip.embroider', {
    _: ['Three dragons! Ha! It\'ll be four by the time it gets to the mill.', 'Dragons! Don\'t you start. The Badger\'s bad enough.'],
    cheerful: ['Ha! Oh, I wish there were dragons in it. It\'d be even better.'],
    ornery: ['Dragons. That\'s how nonsense starts. With wizards.'],
    shy: ['Oh! There weren\'t really dragons? ...Were there?'],
    curious: ['What kind of dragons? Big? Small? Green? This matters.'],
    dreamy: ['I like the dragon version better. Can it be true instead?'],
    witty: ['I\'ll add a troll for balance. And a goose.'],
    proud: ['The plain facts are dramatic enough, thank you.'],
    gloomy: ['Of course there were dragons. That\'s my luck.'],
    child: ['DRAGONS? Real ones? I\'m telling EVERYONE.'],
    rift: ['Dragons. Nice. That\'ll go viral. Or whatever the hobbit word is.'],
  });
  say('village.gossip.careful', {
    _: ['Legs! It\'s grown wings, this one. I only tell it as I heard it.', 'You\'re right. By the time it\'s round twice it\'s a different tale.'],
    cheerful: ['Oh, I only tell the nice bits! Mostly.'],
    ornery: ['I don\'t gossip. I inform.'],
    shy: ['I won\'t say anything. I never do. I just listen.'],
    curious: ['That\'s why I try to get it from the source. Mostly.'],
    witty: ['A tale with legs. Better than a tale with no legs. Those just lie there.'],
    proud: ['I am known for my discretion, wizard.'],
    gloomy: ['And it always grows the bad way, never the good way.'],
    child: ['Legs? Stories don\'t have legs. ...Do they?'],
  }, [
    { if: { values: ['tradition', 'order'] }, text: ['Quite right. In my grandmother\'s day you kept a thing quiet till it was certain.'] },
    { if: { values: 'merriment' }, text: ['Oh, where\'s the fun in that? A tale\'s for telling!'] },
  ]);
  say('village.gossip.source', {
    _: ['The innkeeper. The innkeeper hears everything. Everything.', 'Had it from the mail carrier, who had it from the back of an envelope.', 'Somebody at the well. You don\'t ask at the well. You just listen.'],
    cheerful: ['Oh, everybody! It came from all sides at once!'],
    ornery: ['Half the lane. Shouting it. Over my hedge.'],
    shy: ['I overheard it. At the Badger. From behind a pillar.'],
    curious: ['I\'ve traced it back three people. The trail goes cold at the miller.'],
    witty: ['A little bird. Well, a large hobbit. Who sings like a little bird.'],
    proud: ['I had it directly. I don\'t deal in second-hand news.'],
    gloomy: ['I\'m always the last to hear. Somebody told me yesterday. Late, as usual.'],
    child: ['I listened at the door! Don\'t tell!'],
    rift: ['Overheard at the Relay. Hobbits gossip louder than any feed.'],
  });
  say('village.gossip.tellall', {
    _: ['Far and wide! You heard the wizard. I\'m off to the well.', 'Right you are. A good tale wants telling.'],
    cheerful: ['Oh, I will! I\'ll tell the hens if nobody else is about!'],
    ornery: ['Hmph. If I must. Everyone knows anyway.'],
    shy: ['I\'ll tell... one person. That\'s far and wide for me.'],
    witty: ['I shall be the town crier. Without the bell. With a scone.'],
    proud: ['I\'ll see it\'s told properly. Not mangled.'],
    child: ['I\'m going to tell everyone! EVERYONE!'],
    rift: ['Broadcasting. Range: the whole lane.'],
  });
  say('village.gossip.hush', {
    _: ['You\'re right. It\'s not mine to tell. I\'ll keep it close.', 'Hm. Their business. Yes. I\'ll stop.'],
    cheerful: ['Oh, you\'re right. I do get carried away.'],
    ornery: ['I wasn\'t going to say anything anyway.'],
    shy: ['Good. I didn\'t want to.'],
    curious: ['...I\'ll still wonder about it. Quietly.'],
    witty: ['My lips are sealed. With jam.'],
    proud: ['Of course. I am the soul of discretion.'],
    child: ['Okay. I\'ll only tell my best friend. That\'s allowed.'],
    gloomy: ['No one listens to me anyway.'],
  }, [
    { if: { values: ['tradition', 'order', 'kin'] }, text: ['Yes. Least said, soonest mended. My father always said that.'] },
  ]);
  say('village.gossip.spread', {
    _: ['Ha! I\'ll tell it with dragons. Just to see.', 'Oh, you\'re wicked. I\'ll do it.'],
    cheerful: ['Ha! Three dragons! Oh, this is going to be fun!'],
    ornery: ['Well, if the wizard says there were dragons, I\'ll not argue.'],
    witty: ['I\'ll say you saw them yourself. With your own hat.'],
    child: ['I\'ll say there were FOUR dragons!'],
    rift: ['Seeding misinformation. Dragon edition. I\'m in.'],
    shy: ['I... might tell it with one dragon. A small one.'],
  });
  say('village.gossip.teatime', {
    _: ['Teatime? Elevenses, more like.', 'Ha! It\'ll be in Bree by supper.'],
    witty: ['Teatime\'s generous. I\'d say second breakfast.'],
    gloomy: ['And they\'ll all have it wrong.'],
  });

  // =================================================================================
  // Wild rumors
  // =================================================================================
  addThread({
    id: 'village.rumour', label: 'Any wild rumors going round?', weight: 0.8, cool: 4,
    when: (F) => has(F.vRumor),
    open: { jest: 'village.rumor.open' },
    beats: {
      start: { line: 'village.rumor.start', go: [
        { ap: 'tale', say: 'There was, once. It moved on to somewhere quieter.', to: 'tale' },
        { ap: 'advise', say: 'Nonsense, I\'m afraid. I\'d know.', to: 'deny' },
        { ap: 'ask', say: 'And who told you that?', to: 'who' },
      ] },
      tale: { line: 'village.rumor.tale', fx: { news: 'The wizard says there\'s a grain of truth in what they say at the Badger: {vRumor}.' }, go: [
        { ap: 'jest', say: 'It left a forwarding address. In Bree.', to: 'address' },
        { ap: 'comfort', say: 'Nothing to fear. It was all very polite.', to: 'polite' },
      ] },
      deny: { line: 'village.rumor.deny', fx: { run: (T, v) => { const vals = T.F.values || []; if (vals.includes('learning')) bondFull(v).respect = clamp((bondFull(v).respect || 0) + 0.03, -1, 1); if (['dreamy', 'child'].includes(T.F.temper)) addRegard(v, -0.01); } }, go: [
        { ap: 'comfort', say: 'There\'s wonder enough in this valley without it.', to: 'wonder' },
        { ap: 'jest', say: 'Though I\'d keep an eye on the badgers.', to: 'badgers' },
      ] },
      who: { line: 'village.rumor.who', go: [
        { ap: 'ask', say: 'And do you believe it?', to: 'believe' },
        { ap: 'advise', say: 'I\'d take it with a pinch of salt. A large pinch.', to: 'deny' },
      ] },
      believe: { line: 'village.rumor.believe', go: [
        { ap: 'tale', say: 'You\'re not wrong to wonder. Listen...', to: 'tale' },
        { ap: 'advise', say: 'Believe your own eyes. They\'re good ones.', to: 'deny' },
      ] },
      address: { line: 'village.rumor.address', fx: { joke: { k: 'village.address', t: 'It left a forwarding address. In Bree.' } }, end: true },
      polite: { line: 'village.rumor.polite', end: true },
      wonder: { line: 'village.rumor.wonder', fx: { respect: 0.02 }, end: true },
      badgers: { line: 'village.rumor.badgers', end: true },
    },
    end: { fond: 0.015 },
  });
  lines('village.rumor.open', [{ text: ['Any wild rumors going round, {name}? The wilder the better.', 'Tell me the most ridiculous thing you\'ve heard this week, {name}.', 'What nonsense is the Badger talking now, {name}?'] }]);
  say('village.rumor.start', {
    _: ['Well, they\'re saying {vRumor}. Is it true? You\'d know.', 'You\'ll laugh. They say {vRumor}.', 'The old-timers at the Badger swear {vRumor}. Swear on their pipes.'],
    cheerful: ['Ooh! They say {vRumor}! Isn\'t it marvelous? Is it true?'],
    ornery: ['Nonsense, all of it. They say {vRumor}. I ask you.'],
    shy: ['...Is it true {vRumor}? I didn\'t sleep.'],
    curious: ['I\'ve been investigating. They say {vRumor}. I\'ve three theories.'],
    dreamy: ['They say {vRumor}. I want it to be true so badly.'],
    witty: ['The latest from the Badger\'s finest minds: {vRumor}.'],
    proud: ['I don\'t hold with rumors. But they do say {vRumor}.'],
    gloomy: ['They say {vRumor}. It\'ll be bad news, whatever it is.'],
    child: ['Is it TRUE that {vRumor}? Somebody\'s big brother said so!', 'Someone said {vRumor}! Is it true? Is it?'],
    rift: ['Unverified report: {vRumor}. Can you confirm?'],
  }, [
    { if: { vRumorKey: 'dragon' }, pri: 1, text: ['There\'s a dragon under the far wood. Folk have heard it snore. Is it true?', 'They say a dragon sleeps under the far wood and the mushrooms grow warm. True?'] },
    { if: { vRumorKey: 'ghost' }, pri: 1, text: ['The old miller\'s ghost, still grinding at midnight. I\'ve HEARD it. Is it true?'] },
    { if: { vRumorKey: 'treasure' }, pri: 1, text: ['Gold under the party tree! Old Took\'s, they say. Should we be digging?'] },
    { if: { vRumorKey: 'wishing' }, pri: 1, text: ['They say if you drop a button in the well at midnight, you get a wish. I\'m out of buttons.'] },
    { if: { vRumorKey: 'eel' }, pri: 1, text: ['There\'s an eel in the mill-pond as long as a cart. It took a whole loaf off a line.'] },
    { if: { vRumorKey: 'bree' }, pri: 1, text: ['The Bree carter. A prince in disguise! It\'s the way he holds his cheese.'] },
    { if: { vRumorKey: 'giant' }, pri: 1, text: ['A giant! In the fog, by the North Farthing. Taller than the mill. Is it true?'] },
    { if: { vRumorKey: 'wedding' }, pri: 1, text: ['A secret wedding before harvest. Nobody knows whose. Do you know whose?'] },
    { if: { vRumorKey: 'rift' }, pri: 1, text: ['They say the rifts are doors, and somebody\'s knocking. Is that true, wizard? Is it?'] },
  ]);
  say('village.rumor.tale', {
    _: ['There WAS? Oh, my word. Oh, my word!', 'Moved on? Where? When? Why did nobody tell me?', 'I knew it. I KNEW it. My grandmother always said.'],
    cheerful: ['Oh, how exciting! Wait till I tell the Badger!'],
    ornery: ['Hmph. Wizards. You\'ll say anything for a gasp.'],
    shy: ['Oh! Oh dear. Is it coming back?'],
    curious: ['Moved on! Did it leave anything behind? Tracks? A note?'],
    dreamy: ['I knew it. I could feel it in the air, some evenings.'],
    witty: ['Somewhere quieter? It clearly hasn\'t met the Badger on a Mersday.'],
    proud: ['I always suspected as much. I said so. Nobody listened.'],
    gloomy: ['And it\'ll come back. These things always come back.'],
    child: ['REALLY? Did you SEE it? Was it big? Did it eat anyone?'],
    rift: ['Huh. So it\'s canon. Respect.'],
  });
  say('village.rumor.deny', {
    _: ['Oh. Well. I suppose you would know.', 'Nonsense? Shame. It was a good one.', 'Ha. I thought as much. Still, I\'ll miss it.'],
    cheerful: ['Oh, bother! Never mind. There\'ll be another by Trewsday.'],
    ornery: ['Told you. Told them all. Nobody listens to sense.'],
    shy: ['Oh, good. I can sleep tonight.'],
    curious: ['Are you sure? Have you checked? Properly?'],
    dreamy: ['Oh. I\'d rather it were true. Things are nicer when they\'re true.'],
    witty: ['A wizard debunking rumors. That\'s a rumor in itself.'],
    proud: ['As I suspected. I never believed a word.'],
    gloomy: ['Of course not. Nothing exciting ever happens here.'],
    child: ['Awww. Are you SURE? Not even a little bit?'],
    rift: ['Fact-checked. Disappointing. Accurate, but disappointing.'],
  }, [
    { if: { values: 'learning' }, text: ['Good. I like a straight answer. Too much nonsense goes round this village.'] },
  ]);
  say('village.rumor.who', {
    _: ['The innkeeper\'s cousin, who had it from a dwarf.', 'Somebody\'s uncle. It\'s always somebody\'s uncle.', 'The children. They had it from the old folk, who had it from the children.'],
    cheerful: ['Oh, everyone! It\'s the best kind of rumor, the kind with no beginning.'],
    ornery: ['Some fool at the Badger. There\'s always one. There\'s usually six.'],
    shy: ['I heard it through the window. I wasn\'t listening. I was a bit.'],
    curious: ['I\'ve traced it to the Bree carter. After that, the trail\'s all cheese.'],
    witty: ['A reliable source. By which I mean somebody who\'d had four pints.'],
    child: ['My friend\'s brother\'s friend! He KNOWS things.'],
    rift: ['Source unverified. Origin: probably a pub at closing time.'],
  });
  say('village.rumor.believe', {
    _: ['Half of me does. The other half\'s too sensible.', 'I don\'t. ...I do a bit.'],
    cheerful: ['I believe everything! It\'s more fun that way!'],
    ornery: ['Not a word. Not one word.'],
    shy: ['I... I try not to. It doesn\'t work.'],
    curious: ['I don\'t believe or disbelieve. I want evidence.'],
    dreamy: ['I believe in the feeling of it. Does that count?'],
    witty: ['I believe it the way I believe in second breakfast. Devoutly, without proof.'],
    proud: ['I make up my own mind, thank you. And my mind says probably not.'],
    gloomy: ['If it\'s bad, I believe it.'],
    child: ['YES. Totally. Completely.'],
  });
  say('village.rumor.address', {
    _: ['In Bree! Ha! Of course it did.', 'A forwarding address! Ha! I\'m telling that one at the Badger.'],
    child: ['Can we write to it?'],
    witty: ['Bree. Where all the interesting things go to be ordinary.'],
  });
  say('village.rumor.polite', {
    _: ['Polite! Well, that\'s a relief. I don\'t like a rude rumor.', 'All very polite. Like a vicar. With scales.'],
    shy: ['...Polite is good. I like polite.'],
  });
  say('village.rumor.wonder', {
    _: ['There is, isn\'t there. You only have to look.', 'Hm. You\'re right. The heron\'s wonder enough some mornings.'],
    dreamy: ['The mist on the river at dawn. That\'s my dragon.'],
    ornery: ['Wonder. Hmph. ...The sunsets are good, I\'ll give you that.'],
  });
  say('village.rumor.badgers', {
    _: ['The badgers! Ha! I always said they were up to something.', 'I\'ll watch them. Closely. From indoors.'],
    child: ['I KNEW the badgers were bad! I mean, I didn\'t. But now I do.'],
  });

  // =================================================================================
  // What they hold dear
  // =================================================================================
  addThread({
    id: 'village.values', label: 'What do you hold dear?', reveals: 'village.values', weight: 1, cool: 6,
    when: (F) => F.stage !== 'child' && has(F.vValue),
    open: { ask: 'village.values.open' },
    beats: {
      start: { line: 'village.values.start', fx: { learn: ['village.values', '{Name} holds {vValue} dear.'] }, go: [
        { ap: 'warm', say: 'I couldn\'t agree more.', to: 'agree' },
        { ap: 'ask', say: 'Why that, above all?', to: 'why' },
        { ap: 'advise', say: 'And yet {vClashValue} has its place too, surely?', to: [{ need: { if: { temper: ['curious', 'witty', 'dreamy', 'cheerful'] } }, to: 'debate' }, { need: { respect: 0.25 }, to: 'debate' }, 'bristle'], need: { if: { vClashValue: (x) => has(x) } } },
        { ap: 'share', say: 'I hold a thing or two dear myself.', to: 'wizshare' },
      ] },
      why: { line: 'village.values.why', go: [
        { ap: 'ask', say: 'And what else do you hold to?', to: 'second', need: { if: { vValue2: (x) => has(x) } } },
        { ap: 'warm', say: 'A good thing to have learned.', to: 'agree' },
        { ap: 'share', say: 'I hold a thing or two dear myself.', to: 'wizshare' },
      ] },
      second: { line: 'village.values.second', fx: { learn: ['village.values2', '{Name} also holds {vValue2} dear.'] }, go: [
        { ap: 'warm', say: 'Two good things to steer by.', to: 'end' },
        { ap: 'jest', say: 'And second breakfast, I trust.', to: 'breakfast' },
      ] },
      agree: { line: 'village.values.agree', fx: { fond: 0.02, respect: 0.01 }, go: [
        { ap: 'ask', say: 'Does the whole village feel the same?', to: 'village' },
        { ap: 'warm', say: 'Thistledown\'s lucky to have you.', to: 'end' },
      ] },
      debate: { line: 'village.values.debate', fx: { respect: 0.04 }, go: [
        { ap: 'warm', say: 'You argue well. I\'ll think on it.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'ask', say: 'Does the whole village feel the same?', to: 'village' },
      ] },
      bristle: { line: 'village.values.bristle', fx: { respect: -0.02, fond: -0.01 }, go: [
        { ap: 'warm', say: 'I meant no offense. You\'re right to hold to it.', to: 'smooth' },
        { ap: 'listen', say: '*You let them have their say.*', label: 'Let them have their say', to: 'smooth' },
      ] },
      village: { line: 'village.values.village', go: [
        { ap: 'advise', say: 'Perhaps you and {vClash} should talk it over. Over a pie.', to: 'talkover', need: { if: { vClash: (x) => has(x) } } },
        { ap: 'jest', say: 'A good village needs both. Like a pie needs a lid.', to: 'pie' },
        { ap: 'warm', say: 'Then they\'ve you to remind them.', to: 'end' },
      ] },
      wizshare: { line: 'village.values.wizshare', go: [
        { ap: 'share', say: 'Kindness. And fireworks. In that order.', to: 'kindness' },
        { ap: 'tale', say: 'Small things. A hobbit\'s courage. A pipe at dusk.', to: 'small' },
      ] },
      smooth: { line: 'village.values.smooth', end: true },
      talkover: { line: 'village.values.talkover', fx: { respect: 0.02, run: (T, v) => { const o = personById(T.F.vClashId); if (o) { v.bond(o, 0.02); if (ACTIONS.whisper_visit) v.queue.push({ a: ACTIONS.whisper_visit, extra: { to: o, kind: 'kin' } }); } } }, end: true },
      pie: { line: 'village.values.pie', fx: { joke: { k: 'village.pielid', t: 'A good village needs both, like a pie needs a lid.' } }, end: true },
      kindness: { line: 'village.values.kindness', fx: { fond: 0.02, trust: 0.02 }, end: true },
      small: { line: 'village.values.small', fx: { trust: 0.03 }, end: true },
      breakfast: { line: 'village.values.breakfast', end: true },
    },
    end: { fond: 0.01 },
  });
  lines('village.values.open', [{ text: ['What do you hold dear, {name}? Above everything?', 'Tell me, {name}: what\'s the one thing you\'d never give up?', 'If you had to carve one word over your door, {name}, what would it be?'] }]);
  say('village.values.start', {
    _: ['{VValue}. {VValueSay}, as they say. I hold to it.', 'Me? {VValue}. It\'s how I was raised.', 'I\'ve always said: {vValueSay}. That\'s me, all through.'],
    cheerful: ['Ooh. {VValue}! It makes everything better, doesn\'t it?'],
    ornery: ['{VValue}. And I\'ll not hear a word against it.'],
    shy: ['...{VValue}, I think. I don\'t say it out loud much.'],
    curious: ['Interesting question. {VValue}, I think. I\'ve given it thought.'],
    dreamy: ['{VValue}. It\'s like a lamp I carry about.'],
    witty: ['{VValue}. Also pudding, but pudding is more of a lifestyle.'],
    proud: ['{VValue}. My family has always stood for it.'],
    gloomy: ['{VValue}. Not that anyone else seems to, any more.'],
    rift: ['{VValue}, weirdly. Back home nobody held anything dear. Here it rubbed off.'],
  }, [
    { ...VK('thrift'), text: ['Thrift. Waste not, want not. A full larder at Yule is worth any feast in summer.', 'Thrift. I darn my socks till they\'re more darn than sock. Proudly.'] },
    { ...VK('merriment'), text: ['Merrymaking! A village that sings together sticks together.', 'A good party. Music, dancing, too much cake. What else is there?'] },
    { ...VK('tradition'), text: ['The old ways. What was good enough for my grandmother is good enough for me.', 'The old ways. Somebody has to remember how things were done.'] },
    { ...VK('learning'), text: ['Learning. A mind is for filling. Mine has room yet.', 'Knowing things. Books, stars, how a mill works. All of it.'] },
    { ...VK('kin'), text: ['Family. Blood and the hearth. Everything else is weather.', 'My folk. Whatever happens, there\'s the hearth and the folk round it.'] },
    { ...VK('craft'), text: ['Craft. A thing well made. You can feel it in your hands when it\'s right.', 'Doing a job properly. Square, true, and no corners cut.'] },
    { ...VK('nature'), text: ['The green valley. The trees and the river. We\'re only borrowing it.', 'The river, the woods, the birds in the hedge. Look after those and they\'ll look after you.'] },
    { ...VK('order'), text: ['Tidiness. A place for everything and everything in its place.', 'A swept step. You can tell everything about a hobbit by their step.'] },
    { if: { vValueKey: 'merriment', temper: 'ornery' }, text: ['Merrymaking, believe it or not. I grumble all the way to the party. Then I dance.'] },
    { if: { vValueKey: 'tradition', temper: 'cheerful' }, text: ['The old ways! The old songs, the old games. They\'re the best ones!'] },
    { if: { vValueKey: 'learning', rift: true }, text: ['Learning. Everything here is new data. I\'m downloading the whole valley.'] },
    { if: { vValueKey: 'nature', rift: true }, text: ['The green. Back home there wasn\'t any. Here it\'s everywhere. I never want to lose it.'] },
    { if: { vValueKey: 'thrift', temper: 'witty' }, text: ['Thrift. I\'d tell you more, but words cost breath.'] },
    { if: { vValueKey: 'order', temper: 'gloomy' }, text: ['Tidiness. If the world won\'t make sense, at least my shelves can.'] },
  ]);
  say('village.values.why', {
    _: ['My {parent} always said "{vValueSay}". It stuck.', 'I\'ve seen what happens without it. That\'s why.', 'Because it\'s right. Some things you just know.'],
    cheerful: ['Because it makes folk happy! What better reason is there?'],
    ornery: ['Because the alternative is worse. Look around.'],
    shy: ['It makes me feel safe. Like a wall at my back.'],
    curious: ['I tried the other way once. It didn\'t answer.'],
    dreamy: ['Because one day I\'ll be gone, and I\'d like to leave something good behind.'],
    witty: ['Because somebody in this village has to have principles, and it\'s my turn.'],
    proud: ['Because a Hobbit should stand for something. I stand for this.'],
    gloomy: ['It\'s all I\'ve got that\'s certain.'],
    elder: ['I\'ve lived a long time, wizard. It\'s the one thing that never let me down.'],
    rift: ['Back home I had nothing to hold on to. This is the first thing that held back.'],
  }, [
    { if: { parent: (p) => has(p) }, text: ['My {parent} held to it, and theirs before. It runs in the family like big feet.'] },
    { ...VK('thrift'), text: ['I remember a long winter when I was small. Never again, I said.'] },
    { ...VK('merriment'), text: ['Life\'s short and the evenings are long. Fill them with music.'] },
    { ...VK('tradition'), text: ['Every new thing is an old thing someone forgot. I don\'t like to forget.'] },
    { ...VK('learning'), text: ['Because the more you know, the more there is to wonder at.'] },
    { ...VK('kin'), text: ['When everything else goes, your folk are still there. Mostly in the kitchen.'] },
    { ...VK('craft'), text: ['A well-made chair outlives its maker. I like that.'] },
    { ...VK('nature'), text: ['The river was here before us and it\'ll be here after. We ought to be good guests.'] },
    { ...VK('order'), text: ['A tidy hole is a calm mind. That\'s all.'] },
  ]);
  say('village.values.second', {
    _: ['And {vValue2}. The two go together, for me.', '{VValue2}, too. Though not as loudly.'],
    cheerful: ['Oh, and {vValue2}! I nearly forgot!'],
    ornery: ['{VValue2}. That\'s your lot. Two\'s plenty.'],
    shy: ['...And {vValue2}. Quietly.'],
    witty: ['{VValue2}, on weekdays.'],
    proud: ['{VValue2}. Naturally.'],
  });
  say('village.values.agree', {
    _: ['Do you? Well! I knew you were a sensible sort.', 'You see? Even a wizard agrees. I\'ll tell them that.', 'Ha! Good. We understand each other.'],
    cheerful: ['Oh, I knew you would! We\'re of a mind, you and me!'],
    ornery: ['Hmph. At last. Someone with sense.'],
    shy: ['...You do? Oh. That\'s nice to hear.'],
    curious: ['Do you? I\'d like to hear why, some time.'],
    dreamy: ['That makes me glad. Really glad.'],
    witty: ['A wizard of taste. Who knew?'],
    proud: ['Naturally. Any wise person would.'],
    gloomy: ['That\'s two of us, then. Out of the whole valley.'],
    rift: ['Consensus achieved. Nice.'],
  });
  say('village.values.debate', {
    _: ['Ha! Well, maybe it has. A little place. A small corner.', 'Hm. You\'ve a point. I don\'t like it, but you\'ve a point.'],
    cheerful: ['Oh, fair! There\'s room for both, I suppose. Like jam and cream.'],
    curious: ['That\'s an interesting thought. I\'ll have to turn it over.'],
    dreamy: ['Maybe they\'re two halves of one thing. I\'d never thought.'],
    witty: ['A wizard who argues back. How refreshing. You\'re still wrong.'],
    proud: ['You argue like a lawyer from Michel Delving. I respect that.'],
    ornery: ['Hmph. You\'re cleverer than you look. And you look very clever.'],
  });
  say('village.values.bristle', {
    _: ['Its place? Its place is next door, not in my house.', 'With respect, wizard, you don\'t live here.'],
    ornery: ['Is that what you think? Then think it somewhere else.', 'I didn\'t ask for a lecture.'],
    proud: ['I know my own mind, thank you. It\'s been in my family a long time.'],
    shy: ['Oh. Um. I suppose. ...I don\'t think so, though.'],
    gloomy: ['Everyone says that. It\'s why things are as they are.'],
    rift: ['Yeah, no. Hard disagree.'],
  });
  say('village.values.village', {
    _: ['Half of it. The other half needs reminding.', 'Some do. Some don\'t. That\'s what the Moot\'s for.'],
    cheerful: ['Most of us! And the rest come round, given a party.'],
    ornery: ['The village? The village has gone soft, wizard.'],
    shy: ['I don\'t know. I don\'t ask.'],
    curious: ['I\'ve been counting, actually. It\'s about even.'],
    witty: ['The village agrees on one thing only: the Badger\'s ale.'],
    gloomy: ['Not many. Fewer every year.'],
  }, [
    { if: { vClash: (x) => has(x) }, pri: 1, text: ['Not {vClash}. {VClash} thinks {vClashValue} is everything. We have words about it.', '{VClash} would say otherwise. {VClash} lives for {vClashValue}. Wrong, but sincere.'] },
  ]);
  say('village.values.wizshare', {
    _: ['You? What does a wizard hold dear? I\'ve always wondered.', 'Go on, then. What?'],
    curious: ['Oh, I\'d love to know. Tell me.'],
    shy: ['...Would you tell me? I\'d like to know.'],
    ornery: ['Your hat, I expect.'],
    child: ['Is it magic? It\'s magic, isn\'t it.'],
  });
  say('village.values.smooth', {
    _: ['...Well. No harm done. I get worked up.', 'Hm. All right. We\'ll say no more.'],
    ornery: ['Hmph. Fine. You\'re forgiven. Barely.'],
    proud: ['Apology accepted.'],
  });
  say('village.values.talkover', {
    _: ['Talk it over with {vClash}? ...Might be interesting. We might both learn something. Unlikely.', 'Over a pie. Hm. A pie does make arguing nicer.'],
    ornery: ['With {vClash}? It\'ll end in tears. Probably {vClash}\'s.'],
    curious: ['Ooh. I\'d like to know how {vClash} thinks. I\'ll go.'],
  });
  say('village.values.pie', {
    _: ['Ha! Like a pie needs a lid. I\'ll be using that.', 'A pie and a lid! Ha. You and your pies.'],
    ornery: ['Hmph. I\'m the filling, then.'],
    witty: ['And who\'s the gravy? Don\'t answer that.'],
  });
  say('village.values.kindness', {
    _: ['Kindness and fireworks. That\'s you exactly.', 'Ha! In that order. I believe it.'],
    child: ['Fireworks should be first!'],
    gloomy: ['Kindness. That\'s a good one to hold. It\'s rarer than fireworks.'],
  });
  say('village.values.small', {
    _: ['A hobbit\'s courage. You say that like you\'ve seen it.', 'Small things. Yes. That\'s what I meant, really.'],
    dreamy: ['A pipe at dusk. Oh, I like that. I\'ll hold that dear too.'],
  });
  say('village.values.breakfast', {
    _: ['Second breakfast is not a value, wizard. It\'s a necessity.', 'Ha! That goes without saying.'],
    proud: ['Second breakfast is a sacred institution.'],
  });

  // =================================================================================
  // Has Thistledown changed?
  // =================================================================================
  addThread({
    id: 'village.changes', label: 'Has Thistledown changed much?', weight: 0.9, cool: 6,
    when: (F) => F.stage !== 'child', rel: (F) => (F.stage === 'elder' ? 1.5 : F.rift ? 1.2 : 0.9),
    open: { ask: 'village.changes.open' },
    beats: {
      start: { line: 'village.changes.start', go: [
        { ap: 'ask', say: 'For the better?', to: 'better' },
        { ap: 'ask', say: 'What do you miss?', to: 'miss' },
        { ap: 'jest', say: 'It\'s the same as ever. Only louder.', to: 'louder' },
      ] },
      better: { line: 'village.changes.better', go: [
        { ap: 'ask', say: 'And the rift-folk? What do you make of them?', to: 'riftfolk', need: { if: { vRiftNow: true, rift: false } } },
        { ap: 'advise', say: 'Change is a river, not a flood. It carries what you put in it.', to: 'river' },
        { ap: 'warm', say: 'It\'s still Thistledown. It still has you.', to: 'end', fx: { fond: 0.02 } },
      ] },
      miss: { line: 'village.changes.miss', fx: { trust: 0.02 }, go: [
        { ap: 'tale', say: 'I remember it too. I was here, you know. Younger, and so were you.', to: 'remember' },
        { ap: 'comfort', say: 'Some things stay, if we keep them.', to: 'keep' },
      ] },
      louder: { line: 'village.changes.louder', go: [
        { ap: 'ask', say: 'For the better, though?', to: 'better' },
        { ap: 'jest', say: 'I blame the fiddles.', to: 'fiddles' },
      ] },
      riftfolk: { line: 'village.changes.riftfolk', go: [
        { ap: 'advise', say: 'Have {vRiftName} to tea. They don\'t bite. Mostly.', to: 'tea', need: { if: { vRiftName: (x) => has(x) } } },
        { ap: 'warm', say: 'They\'re far from home. I know how that feels.', to: 'far' },
      ] },
      river: { line: 'village.changes.river', fx: { respect: 0.02 }, end: true },
      remember: { line: 'village.changes.remember', fx: { fond: 0.03, confide: { k: 'village.changes.old', t: '{Name} remembers how Thistledown used to be, and misses it.' } }, end: true },
      keep: { line: 'village.changes.keep', end: true },
      fiddles: { line: 'village.changes.fiddles', end: true },
      tea: { line: 'village.changes.tea', fx: { respect: 0.02, run: (T, v) => { const o = personById(T.F.vRiftId); if (o && ACTIONS.whisper_visit) v.queue.push({ a: ACTIONS.whisper_visit, extra: { to: o, kind: 'welcome' } }); } }, end: true },
      far: { line: 'village.changes.far', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('village.changes.open', [
    { text: ['Has Thistledown changed much, {name}, since you were young?', 'You\'ve seen this village grow, {name}. Has it changed?', 'Is it the same Thistledown it was, {name}?'] },
    { if: { rift: true }, text: ['You\'ve seen Thistledown with fresh eyes, {name}. Has it changed since you came?'] },
  ]);
  say('village.changes.start', {
    _: ['Changed? Oh, it\'s grown. New holes, new faces. Some days I hardly know it.', 'It has and it hasn\'t. The river\'s the same. Everything else wobbles.', 'Changed! There used to be four holes and a cow.'],
    cheerful: ['Oh, it\'s grown so! More parties, more folk, more everything!'],
    ornery: ['Changed? Ruined, more like. ...No. Changed.', 'Everything\'s changed and nobody asked me.'],
    shy: ['...A bit. There are more people I don\'t know. That\'s hard.'],
    curious: ['Tremendously! I keep a list. It\'s three pages.'],
    dreamy: ['It\'s like a song that keeps adding verses. Same tune, though.'],
    witty: ['Thistledown changes about as fast as the innkeeper\'s apron. Slowly, and with stains.'],
    proud: ['It\'s grown into a proper village. I like to think I helped.'],
    gloomy: ['Everything changes. Mostly for the worse.'],
    elder: ['Changed? Wizard, I remember when the party tree was a sapling. I watered it.', 'When I was a lass there was no mill. You walked to Bywater with your sack.'],
    rift: ['I\'m one of the changes, aren\'t I? Ha. Since I came? It\'s got more lights.'],
  });
  say('village.changes.better', {
    _: ['Better and worse. More fun, less quiet.', 'Better, I think. Mostly. Ask me on a rainy day and I\'ll say worse.'],
    cheerful: ['Better! Everything\'s better! More folk to dance with!'],
    ornery: ['Better? Hmph. Busier. Not the same thing.'],
    shy: ['Better, I suppose. I just need longer to get used to things.'],
    curious: ['On balance? Better. More to find out about.'],
    dreamy: ['Different. Better is a hard word.'],
    witty: ['Better for the innkeeper. The jury\'s out for the rest of us.'],
    proud: ['Better, certainly. A village should grow.'],
    gloomy: ['Worse. But I would say that.'],
    rift: ['Better. Well, I\'m here, so I\'m biased.'],
  }, [
    { if: { values: 'tradition' }, pri: 1, text: ['Worse, if I\'m honest. Nobody sings the old songs. They hum them.', 'The old ways are slipping. I hold on to what I can.'] },
    { if: { values: 'learning' }, pri: 1, text: ['Better! There\'s a school now, and books, and the rift-folk know such things.'] },
    { if: { values: 'merriment' }, pri: 1, text: ['Better! More parties than ever. You can\'t argue with more parties.'] },
    { if: { values: 'nature' }, pri: 1, text: ['Every new hole takes a bit of meadow. I notice. I always notice.'] },
  ]);
  say('village.changes.miss', {
    _: ['The quiet. You could hear the river from the well, once.', 'The old bridge. The new one\'s better. I miss the old one.', 'Knowing everyone. Every face, every name.'],
    cheerful: ['Not much! Well. The old dances. The ones with the hopping.'],
    ornery: ['Folk who knew their place. And mine.'],
    shy: ['When it was small. When everyone knew me and I didn\'t have to explain.'],
    curious: ['The mystery of it. There was a lot more nobody knew.'],
    dreamy: ['The dark. Real dark, full of stars. Before all the lamps.'],
    witty: ['My youth, mostly. And a hat I had.'],
    proud: ['When my family\'s name was the first one folk thought of.'],
    gloomy: ['Everyone who\'s gone.'],
    elder: ['The folk. So many of the folk. There\'s a lot of names on the stones now.'],
    rift: ['Back home? The noise. Here? The first week, when everything was a surprise.'],
  });
  say('village.changes.louder', {
    _: ['Ha! Louder. That\'s about it.', 'Louder and muddier. The two always go together.'],
    ornery: ['Louder! There\'s a fiddle at every corner now.'],
    witty: ['Louder, yes. We\'re competing with the rifts.'],
    rift: ['Louder? This is SILENT compared to Neverdark.'],
  });
  say('village.changes.riftfolk', {
    _: ['The rift-folk? Odd. Kind, mostly. Very odd.', 'They\'re all right, once you get past the glowing.'],
    cheerful: ['Oh, I like them! They know such peculiar songs!'],
    ornery: ['Strangers. With lights. In my day strangers had the decency to be from Bree.'],
    shy: ['They scare me a bit. They talk so fast. But they smile.'],
    curious: ['Fascinating! I\'ve learned three new words and a sort of dance.'],
    dreamy: ['They look at the sky like they\'re listening. I like that.'],
    witty: ['They\'re like us, but with more buttons.'],
    proud: ['They\'re welcome, as long as they mind our ways.'],
    gloomy: ['More mouths. More change. ...They seem lonely, though.'],
  }, [
    { if: { values: 'tradition' }, pri: 1, text: ['I don\'t hold with all their gadgets. But they work hard. I\'ll give them that.'] },
    { if: { values: 'learning' }, pri: 1, text: ['The best thing that ever came to Thistledown. You should hear them talk about stars.'] },
    { if: { vRiftName: (x) => has(x) }, text: ['{VRiftName}\'s all right. Fixed my clock. Now it tells me the weather.'] },
  ]);
  say('village.changes.river', {
    _: ['A river, not a flood. Hm. I like that.', 'It carries what you put in it. Then I\'d best put good things in.'],
    ornery: ['Pretty words. ...Not wrong, mind.'],
    dreamy: ['I\'ll be thinking about that by the water tonight.'],
  });
  say('village.changes.remember', {
    _: ['You were! I forget you\'re older than all of us put together.', 'Younger! Ha. We were all younger. Even you.'],
    elder: ['You do remember. You came the summer the hay caught fire. I was a slip of a thing.'],
    child: ['You were here before? Were you a baby wizard?'],
  });
  say('village.changes.keep', {
    _: ['If we keep them. Yes. I\'ll keep what I can.', 'Hm. Then I\'d best keep the old songs going. Somebody must.'],
    gloomy: ['If we keep them. Hard work, keeping.'],
  });
  say('village.changes.fiddles', {
    _: ['Ha! The fiddles. Yes. Blame the fiddles.', 'The fiddles have a lot to answer for.'],
    witty: ['And the drums. Never forget the drums.'],
  });
  say('village.changes.tea', {
    _: ['Tea with {vRiftName}? ...Why not. I\'ll do the scones my way.', 'All right. I\'ll ask {vRiftName} round. If it glows, I\'m leaving.'],
    ornery: ['Tea? With {vRiftName}? Hmph. ...A short tea.'],
    curious: ['Ooh, yes! I\'ve questions. So many questions.'],
    shy: ['...I\'ll try. I\'ll say hello first. Then tea.'],
  });
  say('village.changes.far', {
    _: ['Far from home. Yes. I suppose they are. I hadn\'t thought.', 'Like you. Hm. That puts it differently.'],
    gloomy: ['Far from home. Poor things. We\'ve all lost a home, one way or another.'],
  });

  // =================================================================================
  // Their turn: what's the wizard's view?
  // =================================================================================
  addThread({
    id: 'village.ask.opinion', theirs: true, label: 'They want your opinion', cool: 4, ask: '{Name} wants your opinion on something.',
    when: (F) => F.met && F.talks >= 1 && F.stage !== 'child' && has(F.vMatter),
    beats: {
      start: { line: 'village.ask.opinion.q', go: [
        { ap: 'advise', say: 'I\'m for it.', to: [{ need: { if: { vMatterSide: 'pro' } }, to: 'agreed' }, { need: { if: { vMatterSide: 'con' } }, to: 'crossed' }, 'mulled'] },
        { ap: 'advise', say: 'I\'m against it.', to: [{ need: { if: { vMatterSide: 'con' } }, to: 'agreed' }, { need: { if: { vMatterSide: 'pro' } }, to: 'crossed' }, 'mulled'] },
        { ap: 'ask', say: 'What do you think?', to: 'theirview' },
      ] },
      theirview: { line: 'village.ask.opinion.theirview', fx: { open: 1 }, go: [
        { ap: 'warm', say: 'Then I\'m with you.', to: 'agreed' },
        { ap: 'advise', say: 'I see it the other way, I\'m afraid.', to: 'crossed' },
        { ap: 'ask', say: 'And what would the other side say?', to: 'fair' },
      ] },
      agreed: { line: 'village.ask.opinion.agreed', fx: { fond: 0.03, respect: 0.02 }, end: true },
      crossed: { line: 'village.ask.opinion.crossed', fx: { respect: -0.02, fond: -0.01 }, go: [
        { ap: 'ask', say: 'Tell me why I\'m wrong.', to: 'debate' },
        { ap: 'warm', say: 'We can differ and stay friends.', to: 'differ' },
      ] },
      mulled: { line: 'village.ask.opinion.mulled', fx: { respect: 0.01 }, end: true },
      fair: { line: 'village.ask.opinion.fair', fx: { respect: 0.02 }, go: [
        { ap: 'warm', say: 'That\'s fair-minded of you.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'advise', say: 'Then say so at the Moot. Both halves.', to: 'moot' },
      ] },
      debate: { line: 'village.ask.opinion.debate', fx: { respect: 0.05 }, end: true },
      differ: { line: 'village.ask.opinion.differ', fx: { fond: 0.02 }, end: true },
      moot: { line: 'village.ask.opinion.moot', fx: { respect: 0.03 }, end: true },
    },
  });
  const M = (k) => ({ if: { vMatter: k } });
  const MS = (k, side) => ({ if: { vMatter: k, vMatterSide: side } });
  say('village.ask.opinion.q', {
    _: ['What do you make of {vMatterWhat}, wizard? Folk are divided.', 'You\'re wise. {VMatterWhat}: yes or no?', 'Everyone\'s arguing about {vMatterWhat}. What\'s your view?'],
    cheerful: ['Ooh, settle a debate! {VMatterWhat}. Good idea? Say yes. No, say what you think!'],
    ornery: ['Right. {VMatterWhat}. Tell me what you think, and I\'ll tell you why you\'re wrong.'],
    shy: ['...Can I ask you something? About {vMatterWhat}? I can\'t decide.'],
    curious: ['I\'ve been weighing up {vMatterWhat}. I want another mind on it. A wizardly one.'],
    dreamy: ['I keep turning over {vMatterWhat} in my head. What would you do?'],
    witty: ['Quick poll. {VMatterWhat}. The wizard\'s vote counts double. Or half. We\'ll see.'],
    proud: ['I\'d value your opinion on {vMatterWhat}. Though my mind\'s mostly made up.'],
    gloomy: ['{VMatterWhat}. It\'ll go wrong whichever way. But what do you think?'],
    rift: ['Requesting a take on {vMatterWhat}. Hot or cold?'],
  }, [
    { if: { vMatterPetition: true }, pri: 1, text: ['There\'s a petition up on the board. {VMatterWhat}. What do you say, wizard?', 'Have you read the board? {VMatterWhat}. The whole lane\'s arguing.'] },
    { ...M('dance'), text: ['A dance every Highday. Some say it\'s just the thing. Some say it\'s a waste of good boots. You?'] },
    { ...M('copse'), text: ['They want to fell the old copse for timber. The old copse! What do you say?'] },
    { ...M('relay'), text: ['That humming mast of the rift-folk. Good thing or bad? I can\'t make my mind up.'] },
    { ...M('school'), text: ['Longer school hours for the little ones. More letters, less mud. Is that right?'] },
    { ...M('feast'), text: ['A great feast from the Common Store. Some say celebrate. Some say winter\'s coming. Which?'] },
    { ...M('lamps'), text: ['More lamps on the lanes. Safer, they say. But you\'d lose the stars. What do you think?'] },
    { ...M('field'), text: ['Plowing the long meadow for barley. More bread. Fewer buttercups. Your view?'] },
    { ...M('statue'), text: ['A statue on the green! Of whom, nobody can agree. Should we at all?'] },
    { ...M('paths'), text: ['Paving the lanes. No more mud. No more daisies in the ruts either. Well?'] },
    { ...M('quiet'), text: ['The elders want a quiet hour every afternoon. No hammering. Sensible, or stuffy?'] },
    { ...M('neon'), text: ['Rift-lights round the square. Pink and blue, all night. Lovely, or a fright?'] },
    { ...M('swing'), text: ['A swing on the party tree for the children. It\'s a fine old tree. Should it bear a swing?'] },
    { ...M('pact'), text: ['A trade pact with Bree. Wagons every Sunday. Good business, or Bree in our pockets?'] },
  ]);
  say('village.ask.opinion.theirview', {
    _: ['I don\'t know. That\'s why I asked you.', 'I can\'t make my mind up. One day yes, the next day no.', 'Honestly? I change my mind with the weather.'],
  }, [
    { if: { vMatterSide: 'pro' }, text: ['I\'m for it. Wholeheartedly. Well, mostly-heartedly.', 'For it! It\'s what Thistledown needs.'] },
    { if: { vMatterSide: 'con' }, text: ['Against. Firmly. Somebody has to be.', 'I think it\'s a mistake, and I\'ll say so at the Moot.'] },
    { ...MS('dance', 'pro'), text: ['For it! Every Highday! Feet were made for it.'] },
    { ...MS('dance', 'con'), text: ['Against. Every Highday? We\'ll be worn out and the jam won\'t make itself.'] },
    { ...MS('copse', 'pro'), text: ['For it. Good timber, sitting there. Think what we could build.'] },
    { ...MS('copse', 'con'), text: ['Against! Those oaks were old when my grandmother was young. You don\'t fell that.'] },
    { ...MS('relay', 'pro'), text: ['For it. The things they hear on that mast! Voices from beyond the sky.'] },
    { ...MS('relay', 'con'), text: ['Against. It hums. All night. The cows don\'t like it and neither do I.'] },
    { ...MS('school', 'pro'), text: ['For it. A child who reads is a child who goes places.'] },
    { ...MS('school', 'con'), text: ['Against. Children need mud and trees as much as letters.'] },
    { ...MS('feast', 'pro'), text: ['For it! Share the bounty. It\'s what a Store is for.'] },
    { ...MS('feast', 'con'), text: ['Against. A feast in autumn is a famine at Yule.'] },
    { ...MS('lamps', 'pro'), text: ['For. Nobody should trip in the dark. My knee agrees.'] },
    { ...MS('lamps', 'con'), text: ['Against. I like my stars. The lamps wash them out.'] },
    { ...MS('field', 'pro'), text: ['For. More barley, more bread, more ale. Simple.'] },
    { ...MS('field', 'con'), text: ['Against. The larks nest in that meadow. Where will they go?'] },
    { ...MS('statue', 'pro'), text: ['For! A good statue says who we are. In stone. For ever.'] },
    { ...MS('statue', 'con'), text: ['Against. Spend the coin on seed. Nobody ever ate a statue.'] },
    { ...MS('paths', 'pro'), text: ['For. Mud on the step every day of spring. Never again.'] },
    { ...MS('paths', 'con'), text: ['Against. A lane should feel the feet that walk it. Stone feels nothing.'] },
    { ...MS('quiet', 'pro'), text: ['For. An hour\'s peace. Is that so much to ask?'] },
    { ...MS('quiet', 'con'), text: ['Against. Work\'s work. Houses don\'t build in silence.'] },
    { ...MS('neon', 'pro'), text: ['For! The square would look like a party every night.'] },
    { ...MS('neon', 'con'), text: ['Against. A square should be lit by lamps and the moon, not pink tubes.'] },
    { ...MS('swing', 'pro'), text: ['For! What\'s a party tree for, if not for children?'] },
    { ...MS('swing', 'con'), text: ['Against. That tree\'s older than the village. It shouldn\'t carry a plank.'] },
    { ...MS('pact', 'pro'), text: ['For. Coin is coin, and Bree pays well.'] },
    { ...MS('pact', 'con'), text: ['Against. Next it\'ll be Bree folk telling us what to grow.'] },
  ]);
  say('village.ask.opinion.agreed', {
    _: ['Ha! I knew it. You see things straight.', 'There. Even the wizard agrees. I\'ll tell them that.', 'Good. Good! That settles my mind.'],
    cheerful: ['Oh, splendid! We\'re of one mind, you and I!'],
    ornery: ['Well, at least somebody round here talks sense.'],
    shy: ['Oh! I\'m glad. I thought I was the only one.'],
    curious: ['Same conclusion, different reasons, I expect. I\'d like to hear yours.'],
    dreamy: ['I hoped you\'d say that.'],
    witty: ['A wizard of excellent judgment. I\'ll put that about.'],
    proud: ['Naturally. Wise minds think alike.'],
    gloomy: ['Well. That\'s one thing that\'s gone right today.'],
    rift: ['Aligned. Good. I\'ll quote you.'],
  });
  say('village.ask.opinion.crossed', {
    _: ['Oh. Well. I didn\'t expect that from you.', 'You think so? I can\'t agree, wizard. I can\'t.', 'Hm. Then we\'ll have to differ.'],
    cheerful: ['Oh! Really? Well, I suppose you would know. Bother.'],
    ornery: ['Then you\'re wrong, and I\'ll say so to your hat.', 'I see. Hmph. Wizards. All sky and no soil.'],
    shy: ['...Oh. I see. I thought... never mind.'],
    curious: ['Really? Why? I genuinely want to know.'],
    dreamy: ['How strange. I was so sure.'],
    witty: ['A bold position. Wrong, but bold.'],
    proud: ['I\'ll respect your view. I\'ll not share it.'],
    gloomy: ['Of course. Nobody ever agrees with me.'],
    rift: ['Disagree. Respectfully. Mostly.'],
  });
  say('village.ask.opinion.mulled', {
    _: ['Is that so? Hm. I hadn\'t a side. I\'ll think on yours.', 'Well, that\'s one vote. I\'ll weigh it.'],
    ornery: ['Hmph. I\'ll make my own mind up.'],
    curious: ['Interesting. You\'ve given me something to chew on.'],
    shy: ['Oh. Then maybe I\'ll think that too.'],
  });
  say('village.ask.opinion.fair', {
    _: ['The other side? ...They\'d say it\'s not all bad. They might have a point. A small one.', 'They\'d say I\'m stuck in my ways. They\'d be half right.'],
    ornery: ['The other side would talk nonsense. Very sincerely.'],
    curious: ['That\'s what I keep coming back to. They\'re not fools, the other lot.'],
    proud: ['I can see their reasoning. It\'s flawed, but I can see it.'],
  });
  say('village.ask.opinion.debate', {
    _: ['Why you\'re wrong? Gladly! Sit down. This may take a while.', 'Ha! All right. Firstly...', 'You want to hear it? Well. That\'s more than most do.'],
    ornery: ['Ha! Now you\'re talking. I\'ll set you straight.'],
    curious: ['Oh, gladly. And then you tell me why I\'m wrong. Fair?'],
    proud: ['Willingly. You may take notes.'],
    shy: ['...You really want to know? All right. I\'ll try.'],
  });
  say('village.ask.opinion.differ', {
    _: ['We can. We will. You\'re still wrong.', 'Ha. Yes. Friends who differ. The best kind.'],
    ornery: ['Hmph. Friends. Yes. Wrong friends, but friends.'],
    gloomy: ['That\'s kind. Most folk just stop talking to you.'],
  });
  say('village.ask.opinion.moot', {
    _: ['At the Moot. Both halves. ...They\'ll think I\'ve gone soft.', 'Hm. Say both sides. That\'s braver than shouting one.'],
    proud: ['A balanced speech. I\'m rather good at those.'],
  });

  // =================================================================================
  // Passing the time: the village itself
  // =================================================================================
  addThread({
    id: 'village.pass.lane', light: true, ap: 'warm', label: 'Pass the time about the village', open: { warm: 'village.pass.lane.open' },
    beats: {
      start: { line: 'village.pass.lane.reply', go: [
        { ap: 'ask', say: 'What\'s the best spot in the village, would you say?', to: 'spot' },
        { ap: 'jest', say: 'Apart from the mud. And the geese.', to: 'geese' },
      ] },
      spot: { line: 'village.pass.lane.spot', go: [
        { ap: 'warm', say: 'I\'ll go and sit there, one evening.', to: 'end' },
        { ap: 'ask', say: 'And the worst?', to: 'worst' },
      ] },
      geese: { line: 'village.pass.lane.geese', end: true },
      worst: { line: 'village.pass.lane.worst', end: true },
    },
    end: { fond: 0.015 },
  });
  lines('village.pass.lane.open', [{ text: ['Thistledown\'s looking well today, {name}.', 'I never tire of this valley, {name}. Look at that light on the hill.', 'The lanes are full of good smells today, {name}. Somebody\'s baking.'] }]);
  say('village.pass.lane.reply', {
    _: ['It is, isn\'t it? Best village in the Shire. Don\'t tell Hobbiton.', 'Ah, you\'ve a good eye. It\'s at its best about now.'],
    cheerful: ['Isn\'t it just! I said that to the hens this morning.'],
    ornery: ['Looking well? It\'s looking muddy. ...It\'s looking well.'],
    shy: ['...I think so too. I walk the long way round, just to see it.'],
    curious: ['Do you know, there are more chimneys than last year? I counted.'],
    dreamy: ['Some mornings it looks painted. As if someone loved it into being.'],
    witty: ['It\'s been practicing. Mostly in the rain.'],
    proud: ['We keep it well. The whole village takes pride.'],
    gloomy: ['For now. Give it a week of rain.'],
    child: ['It\'s the best place in the WORLD. I\'ve never been anywhere else but I know.'],
    rift: ['Coming from Neverdark? This is a screensaver. A living one.'],
  });
  say('village.pass.lane.spot', {
    _: ['The bench by the well, of an evening. You hear everything and nobody minds.', 'The top of the party field. You can see the whole valley and half the sky.'],
    cheerful: ['The Badger on a Mersday! The singing! Oh!'],
    ornery: ['My own step. With the door shut behind me.'],
    shy: ['There\'s a willow by the river with a gap underneath. Nobody knows. Well. Now you do.'],
    curious: ['The mill-race. Watch the wheel long enough and you understand everything. Almost.'],
    dreamy: ['The old oak at dusk. The light comes through sideways and everything goes gold.'],
    witty: ['The kitchen of whoever\'s baking. It moves about.'],
    proud: ['The green, on a fair day. That\'s Thistledown at its best.'],
    gloomy: ['The graveyard, honestly. It\'s quiet. Folk don\'t bother you.'],
    child: ['The top of the party tree! I\'m not allowed. I go anyway.'],
    rift: ['The Relay at night. The hum feels like home. Sorry.'],
  });
  say('village.pass.lane.geese', {
    _: ['The geese! Don\'t. They had my hat on Highday.', 'Ha! The geese run this village, wizard. We just live in it.'],
    child: ['The geese chase me! I chase them back!'],
    ornery: ['Those geese are a public menace. I\'ve said so at the Moot.'],
  });
  say('village.pass.lane.worst', {
    _: ['The bottom of the lane after rain. You lose a boot. Some folk have lost two.', 'Behind the Badger, by the barrels. Don\'t ask.'],
    witty: ['The Badger\'s back step on a Sterday morning. Don\'t ask why.'],
    child: ['Bath time. That\'s not a place. It still counts.'],
    ornery: ['Wherever the geese are. Which is everywhere.'],
    gloomy: ['The ford in winter. Cold to the knees and no way round.'],
    dreamy: ['The dark bit of the lane by the old oak. I always walk faster there. I like it, though.'],
  });

  // =================================================================================
  // More to say: variety for every moment above
  // =================================================================================
  lines('village.gossip.open', [
    { if: { hour: 'evening' }, text: ['What\'s the Badger saying tonight, {name}?'] },
    { if: { hour: 'morning' }, text: ['What did the well have to say this morning, {name}?'] },
  ]);
  say('village.gossip.start', {
    _: ['Have you heard? {VNews}. I nearly dropped my basket.'],
    cheerful: ['Ooh, you\'ll never guess! {VNews}! I\'ve been grinning all day!'],
    ornery: ['{VNews}. And now everyone\'s an expert.'],
    shy: ['...You won\'t say I told you? {VNews}.'],
    dreamy: ['{VNews}. It feels like the start of something.'],
    proud: ['{VNews}. I heard it before the innkeeper did, which is a first.'],
  });
  say('village.gossip.opinion', {
    _: ['I think it\'ll do the village good. Something to talk about besides the weather.'],
    curious: ['I want to know what happens next. That\'s my opinion. I\'m an opinion of questions.'],
    shy: ['I\'m glad, I think. I hope everyone\'s kind about it.'],
    elder: ['I\'ve seen a lot of news come and go. This one\'s better than most.'],
  }, [
    { if: { vNewsKind: 'birth', temper: 'ornery' }, text: ['A baby. More crying at night. ...Bless it, though.'] },
    { if: { vNewsKind: 'quarrel', temper: 'curious' }, text: ['A quarrel! I\'d like to know who said what first. Purely for the record.'] },
    { if: { vNewsKind: 'learn' }, text: ['Learning something new! Good. More of that, I say.'] },
    { if: { vNewsKind: 'work' }, text: ['Hard work rewarded. That\'s the sort of news I like.'] },
  ]);
  say('village.gossip.embroider', {
    _: ['With dragons! Don\'t let the children hear that version.', 'Three more! There weren\'t any to start with!'],
    curious: ['Three more than what? Were there dragons in the first version? I\'ve missed something.'],
  });
  say('village.gossip.careful', {
    _: ['It has grown a leg or two already, I\'ll admit.'],
    dreamy: ['Tales are like rivers. They pick up everything on the way.'],
  });
  say('village.gossip.source', {
    _: ['I heard it over the hedge. Hedges are very good for news.'],
    dreamy: ['I don\'t remember. It was just in the air, like blossom.'],
    elder: ['My grandson. He hears everything at the Badger and tells me half of it.'],
  });
  say('village.gossip.tellall', {
    curious: ['I\'ll tell it, and I\'ll find out the bits I don\'t know as I go.'],
    gloomy: ['I\'ll tell it. They\'ll have heard already.'],
    dreamy: ['I\'ll tell it gently. Good news should be told gently.'],
  });
  say('village.gossip.hush', {
    dreamy: ['Some things are prettier kept quiet.'],
    rift: ['Message muted. Respect.'],
  });
  say('village.gossip.spread', {
    curious: ['I\'ll tell it with dragons and see who believes it. For science.'],
    proud: ['I don\'t embroider. ...Just this once.'],
  });
  say('village.gossip.teatime', {
    cheerful: ['Ha! Teatime! It\'ll be at the Badger before the kettle\'s boiled!'],
    ornery: ['By teatime? By elevenses. This village.'],
  });

  lines('village.rumor.open', [{ if: { hour: 'evening' }, text: ['Heard anything wild at the Badger tonight, {name}?'] }, { if: { stage: 'child' }, text: ['Heard any scary stories lately, {name}?'] }]);
  say('village.rumor.start', {
    _: ['They\'re saying {vRumor}. My aunt saw it. My aunt sees a lot of things.'],
    elder: ['When I was young they said {vRumor}. Now they\'re saying it again.'],
  });
  say('village.rumor.tale', {
    _: ['I\'m telling everyone. You can\'t stop me. You started it.'],
    elder: ['My grandmother always said so. I owe her an apology.'],
  });
  say('village.rumor.deny', {
    _: ['Ah well. There\'ll be another rumor along by Trewsday.'],
    elder: ['Nonsense, eh? Well. It was nonsense when I was young, too.'],
  });
  say('village.rumor.who', {
    dreamy: ['It came on the wind. Rumors do.'],
    proud: ['I don\'t name my sources. I have standards.'],
    gloomy: ['Somebody who wanted to frighten folk. It worked.'],
  });
  say('village.rumor.believe', {
    rift: ['I\'ve seen the sky open. I\'ll believe almost anything now.'],
    elder: ['At my age you stop believing and start remembering.'],
  });
  say('village.rumor.address', {
    cheerful: ['Ha! I\'ll send it a card!'],
    ornery: ['Bree. Of course. Everything odd ends up in Bree.'],
  });
  say('village.rumor.polite', {
    child: ['Polite like saying please? Did it say please?'],
    witty: ['A polite one. Better manners than the geese.'],
  });
  say('village.rumor.wonder', {
    cheerful: ['Oh, there is! The swallows came back this week. That\'s wonder.'],
    rift: ['There is. Rain is wonder enough, honestly. We didn\'t have rain.'],
  });
  say('village.rumor.badgers', {
    ornery: ['The badgers know what they did.'],
    witty: ['The badgers have been suspiciously quiet. That\'s what they want you to think.'],
  });

  lines('village.values.open', [{ if: { stage: 'elder' }, text: ['After all these years, {name}, what do you hold to most?'] }]);
  say('village.values.agree', {
    _: ['Well, there you are. Great minds.'],
    elder: ['It\'s good to hear a younger voice say so. Even if you\'re older than me.'],
  });
  say('village.values.second', {
    curious: ['And {vValue2}. I\'m still working out how the two fit together.'],
    dreamy: ['And {vValue2}. They hold hands, the two of them.'],
    gloomy: ['{VValue2}, too. Not that it\'s done me much good.'],
  });
  say('village.values.bristle', {
    curious: ['Has it? Hmph. I\'d need convincing. You haven\'t convinced me.'],
    witty: ['A place for {vClashValue}? Yes. Far away. With a door.'],
    cheerful: ['Oh! Well. I don\'t agree. But I like you anyway.'],
  });
  say('village.values.debate', {
    _: ['Fair point. Annoyingly fair.'],
    shy: ['...You might be right. I hadn\'t thought of it like that.'],
    gloomy: ['You\'re right. I\'m usually wrong. ...Not about everything, though.'],
  });
  say('village.values.smooth', {
    cheerful: ['Oh, no harm! I get carried away. Everyone does.'],
    shy: ['It\'s all right. I was too sharp.'],
    curious: ['It\'s fine. I like a disagreement, really. It keeps me thinking.'],
  });
  say('village.values.talkover', {
    proud: ['A conversation with {vClash}. I shall be magnanimous.'],
    cheerful: ['Over a pie! With {vClash}! Why not? We might laugh.'],
  });
  say('village.values.pie', {
    cheerful: ['Ha! A pie and a lid! I love it!'],
    curious: ['Which of us is the lid, though? That\'s the question.'],
  });
  say('village.values.kindness', {
    cheerful: ['Kindness and fireworks! That\'s the best creed I ever heard!'],
    proud: ['A fine pairing. I approve.'],
  });
  say('village.values.small', {
    shy: ['...A hobbit\'s courage. I\'d like to think I have some.'],
    proud: ['A hobbit\'s courage. Yes. We\'ve more than folk think.'],
  });
  say('village.values.breakfast', {
    cheerful: ['Ha! And third breakfast, on a good day!'],
    witty: ['Second breakfast is the foundation on which all other values rest.'],
  });

  lines('village.changes.open', [{ if: { stage: 'elder' }, text: ['You\'ve seen a great deal come and go, {name}. Is Thistledown still Thistledown?'] }]);
  say('village.changes.louder', {
    cheerful: ['Louder and merrier! I don\'t mind louder.'],
    gloomy: ['Louder. And I can\'t hear the river any more.'],
  });
  say('village.changes.river', {
    curious: ['What would I put in it, I wonder? I\'ll have to think.'],
    proud: ['Then I shall put in only good things. Naturally.'],
  });
  say('village.changes.remember', {
    _: ['Younger and less gray, both of us. Well. You were already gray.'],
    rift: ['You were here before the rifts? What was it like, all quiet?'],
  });
  say('village.changes.keep', {
    cheerful: ['Then I\'ll keep the old dances going! Hopping and all!'],
    elder: ['I\'ll keep what I can. And tell the young ones the rest.'],
  });
  say('village.changes.fiddles', {
    cheerful: ['The fiddles! Ha! Never blame a fiddle.'],
    ornery: ['Yes. Blame the fiddles. And the fiddlers.'],
  });
  say('village.changes.far', {
    shy: ['...I hadn\'t thought of them being lonely. I might say hello.'],
    proud: ['Then they shall be made welcome. Properly.'],
  });
  say('village.changes.tea', {
    gloomy: ['Tea. I\'ll try. They probably won\'t like my tea.'],
    dreamy: ['I\'ll ask {vRiftName} about their home. I\'d like to hear.'],
  });

  say('village.ask.opinion.agreed', {
    _: ['Good. I\'ll tell them at the Badger. "The wizard agrees with me."'],
    elder: ['Good. It\'s nice to be agreed with at my age. It\'s rarer than you\'d think.'],
  });
  say('village.ask.opinion.crossed', {
    _: ['Well, I asked. I suppose I must listen.'],
    elder: ['When you\'re my age you\'ll know better. Oh. You are my age. Older.'],
  });
  say('village.ask.opinion.mulled', {
    cheerful: ['Oh! Well then, maybe I\'m for it too! Or against! I\'ll decide by teatime!'],
    proud: ['A considered view. I\'ll give it due weight.'],
  });
  say('village.ask.opinion.fair', {
    shy: ['...They\'d say I\'m too timid. They\'d be right.'],
    gloomy: ['They\'d say I\'m a misery. They do say that.'],
    cheerful: ['They\'d say it\'s all lovely either way! And it is, really.'],
  });
  say('village.ask.opinion.differ', {
    cheerful: ['Of course we can! Come to tea and disagree with me properly!'],
    proud: ['We can. Respectfully. You\'re mistaken, but respectfully.'],
    shy: ['...I\'m glad. I don\'t like falling out.'],
  });
  say('village.ask.opinion.moot', {
    shy: ['Both halves? At the Moot? In front of everyone? ...I\'ll write it down first.'],
    ornery: ['Both halves. Hmph. I\'ll say my half twice as loud.'],
  });
  say('village.ask.opinion.debate', {
    witty: ['Gladly. I\'ve been rehearsing this argument in the bath for a week.'],
    gloomy: ['You really want to hear? Nobody ever does.'],
  });
  lines('village.pass.lane.open', [{ if: { season: 'autumn' }, text: ['The valley\'s gold this week, {name}. Every hedge.'] }, { if: { season: 'spring' }, text: ['Blossom on every tree in the lane, {name}. It\'s showing off.'] }]);
  say('village.pass.lane.geese', {
    curious: ['Do you know, they march in order of age? I\'ve watched.'],
    witty: ['The geese are the real Moot. We just vote.'],
  });
});
