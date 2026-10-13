'use strict';
// ---------------------------------------------------------------------------
// The village, part three: the place itself. The Common Store and what's
// short in it, the Tipsy Badger, the mill and the well, market day and the
// traders, the notice board and its petitions, the Moot and Thistledown's
// rank, what's being built, the lamplighter, the weather's trials (flood,
// drought, blight and frost) and the newcomers who've no home yet. Each
// thread is filled from what's really so: the trader in the square today,
// the petition on the board, the hazard the Chronicle warned of.
// ---------------------------------------------------------------------------

talkPack('village3', () => {
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
      else throw new Error(`village3 pack: unknown spec "${k}" in ${key}`);
    }
    lines(key, rules.concat(more || []));
  };
  const first = (job, v) => { const o = Game.villagers.find((x) => x.job === job && x !== v && !x.leaving); return o ? o.first : null; };

  // --- Facts: the village as it stands today -------------------------------------
  const ESSENTIAL = ['bread', 'grain', 'flour', 'veg', 'ale', 'wood', 'leaf', 'cheese', 'apple'];
  const TRADER_SHORT = { bree: 'Barliman the Bree carter', dwarf: 'the dwarf pedlar', took: 'the Tookland cheesemonger', rift: 'Vex the rift scavenger' };
  const FACTION_OF = (v) => (typeof FACTIONS === 'undefined' ? null : ['farmers', 'crafts', 'rift', 'elders', 'young'].find((f) => FACTIONS[f] && FACTIONS[f].of(v)) || null);
  const KEYS = ['vInnkeeper', 'vInn2', 'vMiller', 'vMill', 'vLamplighter', 'vStoreShort', 'vStoreFull', 'vTrader', 'vTraderKey', 'vTraderWants', 'vMarketDay', 'vMarketTomorrow',
    'vEra', 'vEraNext', 'vEraReady', 'vPetitionTitle', 'vPetitionFrom', 'vPetitionMine', 'vFaction', 'vFactionMood', 'vProject', 'vProjectKind', 'vWright',
    'vHazard', 'vHazardOn', 'vNewcomer', 'vNewcomerId', 'vNewcomerRift', 'vNewcomerRough', 'vAmNew', 'vDance', 'vSwing', 'vNeon', 'vWell', 'vPop'];
  addFacts((v, F) => {
    for (const k of KEYS) F[k] = null;
    if (v.stage === 'baby') return;
    F.vInnkeeper = first('innkeeper', v);
    const inn2 = typeof inns === 'function' ? inns().find((b) => b !== World.inn && b.name) : null;
    F.vInn2 = inn2 ? inn2.name.replace(/^The /, 'the ') : null;
    F.vMiller = first('miller', v);
    F.vMill = !!(World.buildings && (World.buildings.mill || World.buildings.windmill));
    F.vLamplighter = first('lamplighter', v);
    F.vWell = !!World.wellSpot;
    F.vPop = Game.villagers.filter((o) => !o.leaving).length;
    // the Store: the scarcest and fullest of the everyday things
    if (typeof Village !== 'undefined' && Village.stores && typeof storeCap === 'function') {
      const r = ESSENTIAL.map((k) => [k, (Village.stores[k] || 0) / Math.max(1, storeCap(k))]).sort((a, b) => a[1] - b[1]);
      if (r[0] && r[0][1] < 0.12) F.vStoreShort = RES_WORD[r[0][0]] || r[0][0];
      const top = r[r.length - 1];
      if (top && top[1] > 0.6) F.vStoreFull = RES_WORD[top[0]] || top[0];
    }
    // market day and the trader
    if (typeof isMarketDay === 'function') { F.vMarketDay = isMarketDay(Game.day); F.vMarketTomorrow = isMarketDay(Game.day + 1); }
    const c = typeof caravan === 'function' ? caravan() : null;
    if (c && TRADER_SHORT[c.key]) Object.assign(F, { vTrader: TRADER_SHORT[c.key], vTraderKey: c.key, vTraderWants: (c.wants || []).map((k) => RES_WORD[k] || k).join(' and ') || null });
    // the village's rank
    if (typeof era === 'function' && typeof ERAS !== 'undefined') {
      const e = era();
      F.vEra = ERAS[e] ? ERAS[e].name : null;
      F.vEraNext = ERAS[e + 1] ? ERAS[e + 1].name : null;
      F.vEraReady = typeof eraReady === 'function' ? eraReady(e + 1) : false;
    }
    // the notice board
    const pt = Game.petition && typeof PETITIONS !== 'undefined' ? PETITIONS.find((p) => p.id === Game.petition.id) : null;
    const fac = FACTION_OF(v);
    if (pt) Object.assign(F, { vPetitionTitle: pt.title.charAt(0).toLowerCase() + pt.title.slice(1), vPetitionFrom: FACTIONS[pt.from] ? FACTIONS[pt.from].label.toLowerCase() : null, vPetitionMine: fac === pt.from });
    if (fac) Object.assign(F, { vFaction: fac, vFactionMood: typeof standingWord === 'function' ? standingWord(standing(fac)) : null });
    F.vDance = !!Game.highdayDance; F.vSwing = !!Game.swing; F.vNeon = !!Game.neonSquare;
    // what's going up
    const p = (Village.projects || []).find((x) => x.kind !== 'retrofit');
    if (p && typeof projectLabel === 'function') {
      let label = null; try { label = projectLabel(p); } catch (e) { label = null; }
      if (label) Object.assign(F, { vProject: label.replace(/^The /, 'the '), vProjectKind: p.kind });
    }
    F.vWright = first('woodwright', v);
    // the weather's trial
    const z = typeof hazard === 'function' ? hazard() : null;
    if (z && HAZARDS[z.k]) Object.assign(F, { vHazard: z.k, vHazardOn: z.state === 'on' });
    // newcomers: somebody still finding their feet, or sleeping rough
    const nc = Game.villagers.filter((o) => o !== v && !o.leaving && o.isGrown() && (o.newcomer || o.homeId < 0)).sort((a, b) => a.id - b.id)[0];
    if (nc) Object.assign(F, { vNewcomer: nc.first, vNewcomerId: nc.id, vNewcomerRift: nc.isRiftborn(), vNewcomerRough: nc.homeId < 0 });
    F.vAmNew = !!v.newcomer;
  });

  // =================================================================================
  // The Common Store
  // =================================================================================
  addThread({
    id: 'village.store', label: 'How\'s the Common Store looking?', weight: 0.8, cool: 4,
    when: (F) => F.stage !== 'child', rel: (F) => (has(F.vStoreShort) ? 1.4 : 0.8),
    open: { ask: 'village.store.open' },
    beats: {
      start: { line: 'village.store.start', go: [
        { ap: 'ask', say: 'Who takes the most out?', to: 'takers' },
        { ap: 'advise', say: 'Put a little by. Winter has long arms.', to: 'winter' },
        { ap: 'jest', say: 'I could magic up a few loaves. Small ones. Mostly crust.', to: 'magic' },
      ] },
      takers: { line: 'village.store.takers', go: [
        { ap: 'jest', say: 'And who takes the most when nobody\'s looking?', to: 'confess', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'A store\'s for sharing. That\'s the point of it.', to: 'sharing' },
      ] },
      winter: { line: 'village.store.winter', go: [
        { ap: 'ask', say: 'Is there enough for the winter, do you think?', to: 'enough' },
        { ap: 'warm', say: 'You\'ve a sensible head.', to: 'end' },
      ] },
      magic: { line: 'village.store.magic', go: [
        { ap: 'warm', say: 'I\'m teasing. The Store is the village\'s own work. Better than magic.', to: 'work' },
        { ap: 'jest', say: 'Very well. No magic loaves. Magic crumpets, perhaps.', to: 'crumpets' },
      ] },
      confess: { line: 'village.store.confess', fx: { joke: { k: 'village.storejar', t: '{Name} knows who takes from the Store when nobody\'s looking.' } }, end: true },
      sharing: { line: 'village.store.sharing', end: true },
      enough: { line: 'village.store.enough', go: [
        { ap: 'comfort', say: 'We\'ll not let anyone go hungry. Not while I\'m about.', to: 'end', fx: { trust: 0.02 } },
        { ap: 'advise', say: 'Then the time to gather is now, while the sun\'s out.', to: 'gather' },
      ] },
      work: { line: 'village.store.work', fx: { fond: 0.02 }, end: true },
      crumpets: { line: 'village.store.crumpets', end: true },
      gather: { line: 'village.store.gather', fx: { respect: 0.02 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('village.store.open', [{ text: ['How\'s the Common Store looking, {name}? Full shelves?', 'I passed the Store this morning, {name}. What\'s the state of things inside?', 'Will the Store see us through, {name}, do you think?'] }]);
  say('village.store.start', {
    _: ['The Store? Fair enough. Could be fuller. Could be emptier.', 'Middling. The shelves have gaps, but not the frightening kind.', 'Oh, it ticks along. Somebody always puts in, somebody always takes out.'],
    cheerful: ['Oh, lovely and full! Well, fullish! The smell of it, on a cold morning!'],
    ornery: ['Half the village takes and the other half complains. I put in. I complain as well.'],
    shy: ['I don\'t go in much. I don\'t like to take. I leave things on the step.'],
    curious: ['I keep a tally, you know. Unofficially. Barley\'s up, apples are down.'],
    dreamy: ['I love the Store at dusk. All those jars glowing in the lamplight like little suns.'],
    witty: ['The Store is like the Badger: everyone\'s an expert, and nobody\'s paying.'],
    proud: ['Well stocked, largely thanks to the hard workers. You know who you are. I do.'],
    gloomy: ['It\'ll run out. These things always run out in the end.'],
    elder: ['I remember when there was no Store. Every hole for itself. This is better.'],
    rift: ['Communal storage, no locks, no tracking. Back home that\'d be robbed in an hour. Here it works.'],
  }, [
    { if: { vStoreShort: (x) => has(x) }, pri: 1, text: ['Short of {vStoreShort}, if you must know. I\'ve noticed. Everyone\'s noticed.', 'We\'re low on {vStoreShort}. I don\'t like it. Not with winter thinking about coming.'] },
    { if: { vStoreShort: (x) => has(x), temper: 'gloomy' }, text: ['No {vStoreShort} to speak of. It starts with {vStoreShort}. Then it\'s everything.'] },
    { if: { vStoreFull: (x) => has(x) }, pri: 1, text: ['Plenty of {vStoreFull}. Shelves groaning with it. We\'ll be eating {vStoreFull} till Yule.'] },
    { if: { job: ['farmer', 'grower', 'orchardist', 'herder'] }, text: ['Half of what\'s in there came off my back. Not that I\'m counting. I am counting.'] },
    { if: { job: ['baker', 'miller', 'brewer'] }, text: ['I fill it every day and it empties every day. It\'s like baking into a well.'] },
    { if: { values: 'thrift' }, text: ['Not full enough. Never full enough. A wise village keeps a year in hand.'] },
  ]);
  say('village.store.takers', {
    _: ['The innkeeper. For the pies. Says it\'s for the village. It goes in the village, I\'ll grant.', 'The children, mostly. Apples. They think nobody counts. Somebody counts.'],
    cheerful: ['Oh, everybody! That\'s what it\'s for! Mostly me, on baking days.'],
    ornery: ['Certain people who shall be nameless. I could name them. I won\'t. Yet.'],
    shy: ['I don\'t like to say. ...Not me. I hardly take anything.'],
    curious: ['By my tally? The woodwrights. Building\'s hungry work.'],
    dreamy: ['Whoever needs it most. That\'s how it should be, anyway.'],
    witty: ['The mice, chiefly. Then the innkeeper. It\'s close.'],
    proud: ['I take only what I\'ve earned. Others are less particular.'],
    gloomy: ['Everyone but me. I\'m always too late for the good jars.'],
    rift: ['Whoever gets there first. It\'s a race and the hobbits are fast.'],
  }, [
    { if: { vInnkeeper: (x) => has(x) }, pri: 1, text: ['{VInnkeeper}. For the Badger\'s kitchen. Says it all comes back as pies. It does, to be fair.'] },
  ]);
  say('village.store.winter', {
    _: ['That\'s what I keep telling them. Nobody listens to me.', 'Long arms and cold fingers. Yes. I\'ve put by a little.'],
    cheerful: ['Oh, winter! I\'ll worry about winter in the autumn!'],
    ornery: ['Tell that to the young ones. They eat as if summer\'s for ever.'],
    shy: ['I\'ve a few jars hidden. In case. Don\'t tell.'],
    curious: ['How long are the arms, exactly? I\'ve been trying to work out how much is enough.'],
    dreamy: ['I don\'t like thinking about winter in summer. It feels like bad luck.'],
    witty: ['Winter has long arms and an enormous appetite. Like my uncle.'],
    proud: ['My larder\'s stocked to Yule and beyond. I\'m not the one you need to tell.'],
    gloomy: ['It\'ll be a hard one. I can feel it in my knees.'],
    rift: ['Back home winter was a setting on the climate dome. This is new.'],
  }, [
    { if: { values: 'thrift' }, pri: 1, text: ['At last, a wizard with sense! Waste not, want not. I\'ve said it at every Moot.'] },
    { if: { values: 'merriment' }, pri: 1, text: ['Oh, you sound like my aunt. A little merriment keeps you warm too, you know.'] },
  ]);
  say('village.store.magic', {
    _: ['Magic loaves! Ha! Would they taste of anything?', 'Mostly crust! I\'d still eat them.'],
    cheerful: ['Oh, do! Do! Can they be currant loaves?'],
    ornery: ['Magic bread. That\'s how trouble starts. Next it\'s magic cheese.'],
    shy: ['Oh! Could you really? Would it be... safe?'],
    curious: ['Could you really? What would happen to the flour? Where would it come from?'],
    witty: ['Magic loaves. Very nice. The baker will have a word with you.'],
    proud: ['We don\'t need magic, thank you. We have hard work.'],
    gloomy: ['They\'d go stale. Magic always does.'],
    child: ['YES. Magic bread. With jam inside!'],
    rift: ['Matter printing. We had that. It tasted like printer.'],
  });
  say('village.store.confess', {
    _: ['...Me. Seed-cake. On Highdays. One slice. Fine. Two.', 'Ha! Don\'t you look at me like that. A hobbit\'s entitled to a biscuit.'],
    ornery: ['Hmph. A jar of honey went missing. I didn\'t take it. I didn\'t NOT take it.'],
    shy: ['...I took a jar of plum jam once. I put a jar of damson back. Is that all right?'],
    witty: ['Nobody. Absolutely nobody. Certainly not someone with crumbs on their waistcoat.'],
    proud: ['I would never. ...A pickled egg. Once. In a crisis.'],
    rift: ['I may have borrowed some scrap. For science. Returned it improved.'],
  });
  say('village.store.sharing', {
    _: ['It is. You\'re right. I get mean when I\'m hungry.', 'Sharing. Yes. Even with the mice, I suppose.'],
    ornery: ['Sharing! Hmph. Fair\'s fair, I suppose.'],
    cheerful: ['Exactly! Share and share alike!'],
  });
  say('village.store.enough', {
    _: ['Enough if we\'re careful. Not if we\'re not.', 'Probably. If the frost holds off and nobody throws a feast.'],
    cheerful: ['Oh, there\'s always enough! Somehow! Isn\'t there?'],
    ornery: ['No. There\'s never enough. There\'s only less.'],
    curious: ['I\'ve done the sums. It\'s close. Do you want to see?'],
    proud: ['If everyone pulls their weight. Some do. Some pull mine.'],
    gloomy: ['No. But nobody wants to hear it.'],
  }, [
    { if: { vStoreShort: (x) => has(x) }, pri: 1, text: ['Not with {vStoreShort} so low. We\'ll feel it by midwinter.'] },
    { if: { vStoreFull: (x) => has(x), vStoreShort: null }, pri: 1, text: ['Plenty, by the look. Mind you, I said that the year the mice got in.'] },
  ]);
  say('village.store.work', {
    _: ['It is, isn\'t it? Every jar\'s somebody\'s afternoon.', 'Better than magic. I like that. I\'ll tell them at the Badger.'],
    proud: ['Exactly so. Honest work, honestly kept.'],
    dreamy: ['Every jar\'s somebody\'s afternoon. I\'ll think of that next time I go in.'],
  });
  say('village.store.crumpets', {
    _: ['Magic crumpets I\'ll allow.', 'Ha! Only if they come with butter.'],
    child: ['CRUMPETS!'],
  });
  say('village.store.gather', {
    _: ['While the sun\'s out. Yes. I\'ll go gathering this afternoon.', 'You\'re right. I\'ll take a basket out. Mushrooms, berries, anything.'],
    ornery: ['I was going to anyway. Don\'t take the credit.'],
  });

  // =================================================================================
  // The Tipsy Badger
  // =================================================================================
  addThread({
    id: 'village.inn', label: 'How\'s the Badger these days?', weight: 0.9, cool: 4,
    when: (F) => !!World.inn, rel: (F) => (F.hour === 'evening' || F.job === 'innkeeper' || F.job === 'brewer' ? 1.4 : 0.9),
    open: { ask: 'village.inn.open' },
    beats: {
      start: { line: 'village.inn.start', go: [
        { ap: 'ask', say: 'Who sits where, of an evening?', to: 'seats' },
        { ap: 'jest', say: 'Is the ale still watered on a Monday?', to: 'ale' },
        { ap: 'ask', say: 'Is the Mersday sing-song still going?', to: 'sing' },
      ] },
      seats: { line: 'village.inn.seats', go: [
        { ap: 'ask', say: 'And where do you sit?', to: 'mine' },
        { ap: 'jest', say: 'I\'ll take the best chair, then. The tall one.', to: 'chair' },
      ] },
      ale: { line: 'village.inn.ale', go: [
        { ap: 'ask', say: 'And the innkeeper? What\'s the innkeeper like?', to: 'keeper', need: { if: { vInnkeeper: (x) => has(x) } } },
        { ap: 'jest', say: 'I\'ll have a Tuesday pint, then.', to: 'tuesday' },
      ] },
      sing: { line: 'village.inn.sing', go: [
        { ap: 'ask', say: 'What do they sing?', to: 'song' },
        { ap: 'share', say: 'I might come and sing. I\'ve a terrible voice.', to: 'voice' },
      ] },
      mine: { line: 'village.inn.mine', go: [
        { ap: 'warm', say: 'Save me a stool beside you.', to: 'stool' },
        { ap: 'ask', say: 'And who sits with you?', to: 'company' },
      ] },
      keeper: { line: 'village.inn.keeper', end: true },
      chair: { line: 'village.inn.chair', end: true },
      tuesday: { line: 'village.inn.tuesday', end: true },
      song: { line: 'village.inn.song', go: [
        { ap: 'share', say: 'I know that one. The second verse is ruder.', to: 'verse' },
        { ap: 'warm', say: 'I\'ll come and listen.', to: 'end' },
      ] },
      voice: { line: 'village.inn.voice', fx: { joke: { k: 'village.voice', t: 'The wizard has a terrible voice. He\'ll be singing on Mersday.' } }, end: true },
      stool: { line: 'village.inn.stool', fx: { fond: 0.02 }, end: true },
      company: { line: 'village.inn.company', end: true },
      verse: { line: 'village.inn.verse', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('village.inn.open', [
    { text: ['How\'s the Badger these days, {name}?', 'Still a good pint at the Tipsy Badger, {name}?', 'What\'s the news from the Badger\'s taproom, {name}?'] },
    { if: { stage: 'child' }, text: ['Have you ever been inside the Badger, {name}? What\'s it like?'] },
  ]);
  say('village.inn.start', {
    _: ['The Badger? Same as ever. Warm, loud, smells of pipe-weed and gravy.', 'Busy. Every evening. Can\'t get near the fire for elbows.', 'Oh, the Badger. The heart of the village. Well. The stomach.'],
    cheerful: ['The Badger! Best place in the Shire on a wet night! I was there till they swept me out!'],
    ornery: ['Too full. Too loud. The stools wobble. I\'m there every night.'],
    shy: ['I like the corner by the window. Nobody notices me there. It\'s lovely.'],
    curious: ['Fascinating place. You learn more in an hour at the Badger than a year of books.'],
    dreamy: ['On a winter night the windows glow like a lantern in the hill. I love walking towards it.'],
    witty: ['The Badger is the only place in Thistledown where the ale and the conversation are equally watered.'],
    proud: ['A respectable house, mostly. I go for the company. The better company.'],
    gloomy: ['Everyone\'s happy at the Badger. I go and watch.'],
    child: ['I\'m not ALLOWED in. I looked through the window. There was singing and a dog.', 'They say there\'s a badger in the cellar. A real one. Is there?'],
    elder: ['I\'ve sat on the same stool for fifty years. It\'s got my shape now.'],
    rift: ['It\'s like a bar back home, except nobody\'s staring at a screen. They stare at each other. It\'s wild.'],
  }, [
    { if: { job: 'innkeeper' }, pri: 2, text: ['My Badger? Run off my feet, wizard. Forty pints a night and every one with an opinion.', 'Full every evening. Lovely. Exhausting. Lovely.'] },
    { if: { job: 'brewer' }, pri: 2, text: ['My ale\'s what fills it, wizard. The fire helps. Mostly the ale.'] },
    { if: { vInn2: (x) => has(x) }, text: ['The Badger\'s still the Badger. Some go to {vInn2} now. Traitors. Nice pies, mind.'] },
    { if: { values: 'merriment' }, text: ['The best room in the valley! Fiddles, ale, friends. What more?'] },
    { if: { values: 'thrift' }, text: ['A penny a pint adds up. I go Mersdays only. And Highdays. Some Trewsdays.'] },
  ]);
  say('village.inn.seats', {
    _: ['The old folk have the fire. The young ones have the floor. Everyone else has a corner.', 'There\'s a stool by the fire nobody sits on. Old Bungo\'s. He\'s been gone ten years.'],
    cheerful: ['Wherever there\'s room! I sit on the bar if I have to!'],
    ornery: ['The settle by the fire is mine. I\'ve sat there thirty years. Folk know.'],
    shy: ['I take the little table behind the post. You can see everyone and nobody sees you.'],
    curious: ['I\'ve drawn a plan. The farmers by the window, the crafts by the bar, and the gossips everywhere.'],
    dreamy: ['The window seat, for the moon. If the moon\'s out.'],
    witty: ['Seating is by order of loudness. The loudest get the fire.'],
    proud: ['There\'s a proper order to it. I have the good chair, near the fire, not too near.'],
    gloomy: ['By the draught. That\'s where they leave room for me.'],
    child: ['I don\'t know. I\'m not allowed in! Where do YOU sit?'],
    rift: ['The rift crowd sits by the window, where the signal\'s best. Old habits.'],
  }, [
    { if: { vInnkeeper: (x) => has(x) }, text: ['{VInnkeeper} behind the bar, of course, polishing the same mug all night and hearing everything.'] },
  ]);
  say('village.inn.ale', {
    _: ['Watered! Don\'t let them hear you say that. It\'s a sore point.', 'Ha! Only on a Monday. Monday ale is mostly hope.'],
    cheerful: ['Ha! It\'s wet and it\'s cheerful, that\'s all I ask!'],
    ornery: ['Watered every day of the week, if you ask me. Nobody does.'],
    shy: ['Oh! I don\'t know. I have the small beer. It\'s always watery.'],
    curious: ['I tested it once. With a feather. Inconclusive.'],
    witty: ['The ale is like the weather: worst on Mondays and much complained of.'],
    proud: ['I wouldn\'t know. I bring my own tankard and I watch them pour.'],
    gloomy: ['Mine always is. Even on the other days.'],
    child: ['What\'s watered? Like plants?'],
  }, [
    { if: { job: 'brewer' }, pri: 2, text: ['WATERED? My ale? I\'ll have you know it\'s brewed with water. That\'s different.'] },
    { if: { job: 'innkeeper' }, pri: 2, text: ['Wizard! In my own... well. Monday\'s a bit thin. I\'ll own that.'] },
  ]);
  say('village.inn.sing', {
    _: ['Every Mersday! You can hear it from the river.', 'Oh yes. The roof lifts a little by the fourth song.'],
    cheerful: ['Every week! I lead the chorus. Loudly. Correctly, sometimes.'],
    ornery: ['Every Mersday. I go to complain about the noise. Then I sing.'],
    shy: ['I go. I don\'t sing. I mouth the words. It\'s nice.'],
    curious: ['Do you know, nobody knows who wrote half those songs? I\'ve asked.'],
    dreamy: ['The slow ones at the end, when the fire\'s low. That\'s my favourite bit of the week.'],
    witty: ['Every Mersday the Badger is full of hobbits who can\'t sing, singing.'],
    proud: ['I have a fine baritone, I\'m told. I\'m told it frequently. By me.'],
    gloomy: ['I sit at the back. The songs are all about folk who\'ve gone.'],
    child: ['I can hear it from my bed! I sing along under the blankets!'],
    rift: ['The sing-song is the best thing here. No autotune. Everyone\'s flat. Beautiful.'],
  });
  say('village.inn.mine', {
    _: ['By the fire, if I\'m quick. By the door, if I\'m not.', 'My stool. Third from the end. It knows me.'],
    cheerful: ['Wherever the laughing is!'],
    ornery: ['My seat. Where else? Anyone in it gets a look.'],
    shy: ['In the corner. With my back to the wall.'],
    witty: ['Near the kitchen door. Strategically.'],
    proud: ['The good chair. Naturally.'],
    gloomy: ['Wherever\'s left.'],
    rift: ['By the window. Watching the rifts. Can\'t help it.'],
  });
  say('village.inn.keeper', {
    _: ['{VInnkeeper}? Hears everything, says half. The right half.', '{VInnkeeper} could run the Moot with one hand and pull a pint with the other.'],
    cheerful: ['{VInnkeeper}\'s a treasure! Knows your order before you\'re in the door.'],
    ornery: ['{VInnkeeper} waters the ale and charges for the fire. Lovely hobbit otherwise.'],
    shy: ['{VInnkeeper} always saves me the corner. Without my asking. I don\'t know how.'],
    curious: ['{VInnkeeper} knows every secret in the valley. I\'ve tried to get one out. Not a chance.'],
    witty: ['{VInnkeeper}: part innkeeper, part priest, part pickpocket. Only the first is paid.'],
  });
  say('village.inn.chair', {
    _: ['The tall one! Ha! You\'d look like a heron on a teacup.', 'There is no tall one. We\'d have to build you one. With a ladder.'],
    child: ['You\'d bump your head on the beams!'],
    witty: ['We\'d have to take the roof off. Worth it for the view.'],
  });
  say('village.inn.tuesday', {
    _: ['Trewsday. It\'s Trewsday here, wizard. You\'re very foreign sometimes.', 'Ha! The Trewsday ale\'s the best. Market day.'],
    witty: ['Tuesday! Where do you think you are? Bree?'],
  });
  say('village.inn.song', {
    _: ['The Drinking Song, the Bath Song, and the one about the cow on the moon. In that order.', 'The old ones. "Ho! Ho! Ho! To the bottle I go", mostly.'],
    dreamy: ['There\'s one about a lamp in a window waiting for someone. I always cry at that one.'],
    child: ['The one about the troll! "Troll sat alone on his seat of stone"! I know ALL of it!'],
    rift: ['There\'s one about the road going ever on. I didn\'t expect to cry in a pub.'],
    witty: ['Whatever gets the most stamping. It\'s really a stamping contest with words.'],
  });
  say('village.inn.voice', {
    _: ['Terrible? Perfect! You\'ll fit right in.', 'Ha! Come Mersday. Bring your terrible voice. We\'ll put you by the fire.'],
    cheerful: ['Oh, come! Terrible voices are the best ones! They\'re loudest!'],
    ornery: ['Can\'t be worse than the miller\'s. Nothing can.'],
    shy: ['...I\'d come, if you sang. I\'d feel braver.'],
    child: ['Sing now! Sing something! Please?'],
  });
  say('village.inn.stool', {
    _: ['I\'ll save you one. If you\'re late, it\'s gone.', 'Done. A stool and a pint. You\'re buying.'],
    shy: ['...I\'d like that. I\'ll keep it free.'],
    ornery: ['Hmph. If you\'re quiet. And you buy.'],
  });
  say('village.inn.company', {
    _: ['Whoever\'s lonely. That\'s how it works at the Badger.', 'My lot. You know. The usual faces. The usual arguments.'],
    shy: ['Nobody, usually. But nobody minds that.'],
    gloomy: ['Nobody. That\'s why I sit there.'],
  });
  say('village.inn.verse', {
    _: ['Ruder! Ha! Don\'t you dare. ...Teach me it.', 'The second verse! Oh, you\'re terrible. Mersday. You\'re singing it.'],
    proud: ['I know the second verse. I simply choose not to sing it.'],
  });

  // =================================================================================
  // Market day and the traders
  // =================================================================================
  addThread({
    id: 'village.market', label: (F) => (F.vTrader ? 'Have you seen the wagon in the square?' : 'What\'s worth buying on market day?'), weight: 0.9, cool: 3,
    when: (F) => F.stage !== 'child' || has(F.vTrader), rel: (F) => (has(F.vTrader) ? 1.7 : F.vMarketDay || F.vMarketTomorrow ? 1.2 : 0.6),
    open: { ask: 'village.market.open' },
    beats: {
      start: { line: 'village.market.start', go: [
        { ap: 'ask', say: 'What would you buy, with a full purse?', to: 'buy' },
        { ap: 'ask', say: 'What do you make of the traders?', to: 'traders' },
        { ap: 'jest', say: 'I hear the dwarf pedlar sells beard-wax. Asking for a friend.', to: 'beard' },
      ] },
      buy: { line: 'village.market.buy', go: [
        { ap: 'ask', say: 'And what would you sell?', to: 'sell' },
        { ap: 'warm', say: 'I hope you get it.', to: 'end' },
      ] },
      traders: { line: 'village.market.traders', go: [
        { ap: 'ask', say: 'Do you trust them?', to: 'trust' },
        { ap: 'jest', say: 'I once bought a "magic" bean from a trader. It was a pea.', to: 'pea' },
      ] },
      beard: { line: 'village.market.beard', go: [
        { ap: 'ask', say: 'Seriously, though. What\'s worth buying?', to: 'buy' },
        { ap: 'jest', say: 'Asking for my beard, then.', to: 'end' },
      ] },
      sell: { line: 'village.market.sell', end: true },
      trust: { line: 'village.market.trust', go: [
        { ap: 'advise', say: 'Count your change twice and smile once.', to: 'change' },
        { ap: 'warm', say: 'Most folk are honest, given half a chance.', to: 'end' },
      ] },
      pea: { line: 'village.market.pea', fx: { joke: { k: 'village.pea', t: 'The wizard once bought a magic bean. It was a pea.' } }, end: true },
      change: { line: 'village.market.change', fx: { respect: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('village.market.open', [
    { text: ['What\'s worth buying on market day, {name}?', 'Off to the market, {name}? What\'s good this week?', 'Trewsday tomorrow, {name}? Or is it today? I lose track.'] },
    { if: { vTrader: (x) => has(x) }, pri: 1, text: ['Have you seen the wagon in the square, {name}? {VTrader}, I think.', 'There\'s a trader in, {name}. Have you been to look?'] },
  ]);
  say('village.market.start', {
    _: ['Market day\'s Trewsday. The square fills up by eight and empties by five. Like a tide.', 'Oh, the market. Something for everyone and too much for some.', 'The wagons come up the West Road. You never know which.'],
    cheerful: ['I love market day! The noise! The cheese! The cheese!'],
    ornery: ['Market day. Crowds, carts and prices. Prices!'],
    shy: ['I go early, before the crowds. Then I go home.'],
    curious: ['Every trader has a story. I try to get one out of each. And a discount.'],
    dreamy: ['The wagons smell of far places. Spice, and road dust, and rain from somewhere else.'],
    witty: ['Market day: when Thistledown pays good money for things it already has, from further away.'],
    proud: ['I sell, mostly. Quality goods. They know my stall.'],
    gloomy: ['Everything costs more and is worth less. Every week.'],
    child: ['There\'s a WAGON! With a pony! Can we go and see?', 'The trader gave me a sweet once. A purple one!'],
    rift: ['Back home the market was a screen. Here it\'s a wagon and a lot of shouting. Better.'],
  }, [
    { if: { vTrader: (x) => has(x) }, pri: 1, text: ['{VTrader}\'s in! Paying well for {vTraderWants}, they say.', 'It\'s {vTrader} today. Everyone\'s rushing home for {vTraderWants}.'] },
    { if: { vTraderKey: 'bree' }, pri: 2, text: ['Barliman\'s in from Bree! Knows everyone, forgets everyone, back again next month.'] },
    { if: { vTraderKey: 'dwarf' }, pri: 2, text: ['A dwarf! In the square! Selling iron and buying every pie in sight.'] },
    { if: { vTraderKey: 'took' }, pri: 2, text: ['The cheesemonger from Tookland! You can smell the wagon from the bridge.'] },
    { if: { vTraderKey: 'rift' }, pri: 2, text: ['Vex is in with the salvage cart. Half the village is scandalised. The other half\'s queuing.'] },
    { if: { vMarketTomorrow: true, vTrader: null }, text: ['Market day tomorrow. I\'ve been saving up since last Trewsday.'] },
  ]);
  say('village.market.buy', {
    _: ['A new kettle. Mine whistles in a minor key. It\'s depressing.', 'Cheese. Proper Tookland cheese. The kind that walks.', 'Good thread. You can\'t get good thread round here for love nor money.'],
    cheerful: ['Ribbons! And a hat! And a pie for the walk home!'],
    ornery: ['Nothing. I\'d buy nothing and go home satisfied.'],
    shy: ['A little book. With a ribbon in it. I saw one once.'],
    curious: ['Something I\'ve never seen. Anything. Whatever it is.'],
    dreamy: ['A map. Of anywhere. I like knowing there\'s an anywhere.'],
    witty: ['A full purse, obviously. Then I\'d buy another.'],
    proud: ['A proper waistcoat. With brass buttons. I\'ve earned it.'],
    gloomy: ['I never have a full purse. So, nothing.'],
    rift: ['A battery. A real one. ...They don\'t sell those. Honey, then.'],
  }, [
    { if: { job: 'farmer' }, text: ['A new plough-share. The old one\'s more patch than iron.'] },
    { if: { job: 'woodwright' }, text: ['Dwarf iron. Nails that don\'t bend. You\'ve no idea what bad nails do to a hobbit.'] },
    { if: { job: 'baker' }, text: ['Spice! Proper spice from the south. For the Yule cakes.'] },
    { if: { job: 'tinker' }, text: ['Scrap. Good scrap. You\'d be amazed what you can make with the right scrap.'] },
  ]);
  say('village.market.sell', {
    _: ['Whatever I\'ve got spare. Which is never as much as I think.', 'Eggs. The hens have been showing off.'],
    cheerful: ['My jam! Everyone loves my jam! Well, I do.'],
    ornery: ['Nothing. They\'d only haggle.'],
    proud: ['My best work. At a fair price. A fair price for me.'],
    rift: ['Repairs. I fix things at the stall. It\'s a whole thing now.'],
  }, [
    { if: { job: ['farmer', 'grower'] }, text: ['Barley, if the trader wants it. They usually do.'] },
    { if: { job: 'brewer' }, text: ['Ale. Traders always want ale. It\'s the one thing that travels well inside them.'] },
    { if: { job: 'herder' }, text: ['Wool. The Tookland lot pay well for wool.'] },
  ]);
  say('village.market.traders', {
    _: ['Barliman\'s all right. Talks your ear off. The dwarf drives a hard bargain but keeps it.', 'Honest, mostly. They come back, so they must be.'],
    cheerful: ['Oh, I love them all! Even the one who sold me the umbrella that wasn\'t.'],
    ornery: ['Robbers on wheels. Charming robbers. Still robbers.'],
    shy: ['They talk so fast. I just point at things.'],
    curious: ['The dwarf told me about the mountains. I asked for an hour. She charged me for the hour.'],
    dreamy: ['They\'ve seen so much. I like to stand near the wagons and listen.'],
    witty: ['Traders are like weather: they come from the west and take your money.'],
    proud: ['I can hold my own with any of them. They know it.'],
    gloomy: ['They always know when I need something. Then the price goes up.'],
    rift: ['Vex is one of ours, sort of. Sells salvage. Knows the rifts better than anyone.'],
  }, [
    { if: { vTraderKey: 'rift', values: 'tradition' }, pri: 2, text: ['That Vex. Rift-junk on a cart. I don\'t hold with it. ...I bought a lamp.'] },
  ]);
  say('village.market.beard', {
    _: ['Beard-wax! Ha! For a friend! Of course.', 'The dwarf does sell it. I\'ve seen it. Smells of pine.'],
    child: ['You need wax? For your BEARD? Can I watch?'],
    witty: ['For a friend called Beard, I expect.'],
    ornery: ['Your beard could do with something. Wax is a start.'],
  });
  say('village.market.trust', {
    _: ['As far as I can throw a wagon.', 'Mostly. I count my change. Twice.'],
    cheerful: ['Oh, mostly! Everyone\'s honest on a sunny day.'],
    ornery: ['No. And they don\'t trust me either. It works.'],
    proud: ['I trust my own judgement. That\'s enough.'],
  });
  say('village.market.pea', {
    _: ['Ha! A pea! Did you plant it?', 'A magic pea is still a pea. Was it a good pea?'],
    child: ['Did it grow into a beanstalk? A peastalk?'],
    witty: ['And you a wizard. You should have known it by the shape.'],
  });
  say('village.market.change', {
    _: ['Count twice, smile once. I\'ll remember that.', 'Ha! That\'s what my grandmother said. Word for word.'],
    proud: ['I already do. I smile twice, too. It confuses them.'],
  });

  // =================================================================================
  // The notice board and its petitions
  // =================================================================================
  addThread({
    id: 'village.board', label: 'What\'s on the notice board?', weight: 0.8, cool: 3,
    when: (F) => F.stage !== 'child', rel: (F) => (has(F.vPetitionTitle) ? (F.vPetitionMine ? 2 : 1.5) : 0.6),
    open: { ask: 'village.board.open' },
    beats: {
      start: { line: 'village.board.start', go: [
        { ap: 'ask', say: 'And are you for it?', to: 'stance', need: { if: { vPetitionTitle: (x) => has(x) } } },
        { ap: 'ask', say: 'Does anyone listen to the petitions?', to: 'listen', need: { if: { vFactionMood: (x) => has(x) } } },
        { ap: 'jest', say: 'I shall pin up a notice of my own: "Wizard seeks second breakfast".', to: 'notice' },
        { ap: 'ask', say: 'What\'s the oddest thing ever pinned up there?', to: 'oddest' },
      ] },
      stance: { line: 'village.board.stance', go: [
        { ap: 'advise', say: 'Then speak up for it. Loudly.', to: 'speak' },
        { ap: 'ask', say: 'Who\'s against it?', to: 'against' },
      ] },
      listen: { line: 'village.board.listen', go: [
        { ap: 'comfort', say: 'You\'re heard more than you think.', to: 'heard' },
        { ap: 'advise', say: 'Then speak up at the Moot. Folk listen to a steady voice.', to: 'speak' },
      ] },
      notice: { line: 'village.board.notice', go: [
        { ap: 'jest', say: 'Reward offered: one firework.', to: 'reward' },
        { ap: 'ask', say: 'What else is up there?', to: 'oddest' },
      ] },
      oddest: { line: 'village.board.oddest', end: true },
      speak: { line: 'village.board.speak', fx: { respect: 0.02 }, end: true },
      against: { line: 'village.board.against', end: true },
      heard: { line: 'village.board.heard', fx: { fond: 0.02 }, end: true },
      reward: { line: 'village.board.reward', fx: { joke: { k: 'village.notice', t: 'Wanted: second breakfast. Reward: one firework.' } }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('village.board.open', [{ text: ['What\'s up on the notice board this week, {name}?', 'Anything new on the board, {name}? I can never read the small writing.', 'I passed the notice board, {name}. Somebody\'s lost a hen again.'] }]);
  say('village.board.start', {
    _: ['Lost hens, a recipe, and somebody selling a goat. The usual.', 'Nothing much. A note about the well rope. A very cross note.', 'Same as ever. Notices about notices.'],
    cheerful: ['Oh, there\'s a dance on! Probably. There usually is!'],
    ornery: ['Rubbish, mostly. Complaints. Half of them mine.'],
    shy: ['I read it every day. I never pin anything up.'],
    curious: ['I read every notice. Even the old ones underneath. Especially those.'],
    dreamy: ['Somebody pinned up a poem last week. No name on it. I copied it out.'],
    witty: ['A recipe for seed-cake and a complaint about seed-cake. Pinned side by side.'],
    proud: ['My notice about the hedges is still up. Nobody\'s taken it down. That says something.'],
    gloomy: ['Somebody\'s lost something. Somebody always has.'],
    rift: ['It\'s a feed you have to walk to. I love it. I check it hourly.'],
  }, [
    { if: { vPetitionTitle: (x) => has(x) }, pri: 1, text: ['There\'s a petition up: {vPetitionTitle}. The whole lane\'s arguing.', 'A petition. {VPetitionTitle}. Signed by half the village and argued over by the rest.'] },
    { if: { vPetitionTitle: (x) => has(x), vPetitionMine: true }, pri: 2, text: ['Ours is up! {VPetitionTitle}. We wrote it at the Badger. Took four pints.', 'Our petition. {VPetitionTitle}. I signed it twice. By accident. Mostly.'] },
  ]);
  say('village.board.stance', {
    _: ['For it, mostly. With reservations. Several reservations.', 'Against, I think. Though I can see the point.'],
    cheerful: ['Oh, for it! Anything that makes folk happy!'],
    ornery: ['Against. On principle. I\'ll work out the principle later.'],
    shy: ['I don\'t know. I\'ll go with whatever doesn\'t start an argument.'],
    curious: ['I\'m gathering opinions. I\'ve twenty-three so far. It\'s close.'],
    witty: ['I\'m for it on odd days and against it on even ones.'],
    proud: ['I have a considered view. I\'ll share it at the Moot.'],
    gloomy: ['Doesn\'t matter what I think. It\'ll be turned down.'],
  }, [
    { if: { vPetitionMine: true }, pri: 1, text: ['For it! It\'s ours. {VPetitionFrom} have been asking for years.', 'Of course I\'m for it. We wrote it. Well, we argued about it and then someone wrote it.'] },
  ]);
  say('village.board.listen', {
    _: ['Sometimes. When it suits.', 'Somebody reads them. Whether they listen is another matter.'],
    gloomy: ['No. Nobody listens to the likes of us.'],
    ornery: ['They listen to whoever shouts loudest. I\'ve been practising.'],
  }, [
    { if: { vFactionMood: ['devoted', 'pleased'] }, pri: 1, text: ['They do, lately! Our lot\'s been heard twice this season. I\'m almost suspicious.', 'Oh yes. We\'ve no complaints. Well, a few. Small ones.'] },
    { if: { vFactionMood: ['grumbling', 'fed up'] }, pri: 1, text: ['Listen? Every petition we put up comes down with a no. Every one.', 'No. And we\'ve noticed. Believe me, we\'ve noticed.'] },
    { if: { vFactionMood: 'neutral' }, pri: 1, text: ['Some. Some not. Swings and roundabouts.', 'Half and half. Which is fair, I suppose, if you\'re the other half.'] },
  ]);
  say('village.board.notice', {
    _: ['Ha! Do. You\'d get forty replies by teatime.', 'Second breakfast! Pin it up. I\'ll answer it.'],
    cheerful: ['Oh, do! I\'ll pin one under it: "Offering second breakfast. Must like jam."'],
    witty: ['You\'d need a bigger board. The replies alone.'],
    proud: ['Our board is for serious notices, wizard.'],
  });
  say('village.board.oddest', {
    _: ['"Lost: one sense of humour. Answers to Grumble." We all know whose.', 'A notice saying "Do not read this notice." Everyone read it.'],
    curious: ['A map with an X on it and no name. I\'ve dug in three places.'],
    dreamy: ['A pressed flower and the word "sorry". Nobody ever claimed it.'],
    witty: ['"Wanted: someone to want things." I put that one up.'],
    rift: ['A Relay call-sign with no message. I still wonder who.'],
    child: ['A picture of a dragon. I drew it.'],
  });
  say('village.board.speak', {
    _: ['Loudly. Yes. I\'ve a loud voice when I need it.', 'I will. At the Moot. If my knees hold out.'],
    shy: ['...I\'ll try. I\'ll write it down first.'],
    ornery: ['I always speak up. It\'s my one pleasure.'],
  });
  say('village.board.against', {
    _: ['The usual lot. You know who you are, they say, and they do.', 'The elders. Or the young ones. Depends which petition. Someone\'s always against.'],
    witty: ['Everyone who didn\'t think of it first.'],
  });
  say('village.board.heard', {
    _: ['Do you think so? Well. That\'s something.', 'Heard. Hm. I\'ll hold you to that.'],
    gloomy: ['That\'s kind. I don\'t believe it. But it\'s kind.'],
  });
  say('village.board.reward', {
    _: ['One firework! You\'d be mobbed.', 'Ha! The children would bring you forty breakfasts.'],
    child: ['I\'ll bring you breakfast! For a firework! Deal?'],
  });

  // =================================================================================
  // The Moot and the village's rank
  // =================================================================================
  addThread({
    id: 'village.moot', label: 'Is Thistledown coming up in the world?', weight: 0.7, cool: 6,
    when: (F) => F.stage !== 'child' && has(F.vEra), rel: (F) => (F.vEraReady ? 1.8 : 0.8),
    open: { ask: 'village.moot.open' },
    beats: {
      start: { line: 'village.moot.start', go: [
        { ap: 'ask', say: 'Would you like it to become a {vEraNext}?', to: 'next', need: { if: { vEraNext: (x) => has(x) } } },
        { ap: 'ask', say: 'What happens at a Moot, then?', to: 'moot' },
        { ap: 'jest', say: 'Next stop, a city. With a wall and a very grand mayor.', to: 'city' },
      ] },
      next: { line: 'village.moot.next', go: [
        { ap: 'ask', say: 'What would it take?', to: 'need' },
        { ap: 'warm', say: 'Whatever it\'s called, it\'s home.', to: 'home' },
      ] },
      moot: { line: 'village.moot.moot', go: [
        { ap: 'jest', say: 'And who talks the longest?', to: 'longest' },
        { ap: 'ask', say: 'Do you speak?', to: 'speak' },
      ] },
      city: { line: 'village.moot.city', go: [
        { ap: 'warm', say: 'I\'m teasing. Small is a fine size for a village.', to: 'home' },
        { ap: 'jest', say: 'You\'d make a fine mayor. The hat suits you.', to: 'mayor' },
      ] },
      need: { line: 'village.moot.need', end: true },
      home: { line: 'village.moot.home', fx: { fond: 0.02 }, end: true },
      longest: { line: 'village.moot.longest', end: true },
      speak: { line: 'village.moot.speak', end: true },
      mayor: { line: 'village.moot.mayor', fx: { joke: { k: 'village.mayor', t: 'Mayor {Name}, by the wizard\'s nomination. It\'s the hat.' } }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('village.moot.open', [{ text: ['Is Thistledown coming up in the world, {name}?', 'They tell me Thistledown\'s a {vEra} now, {name}. Do you feel grander?', 'What do you make of the village\'s prospects, {name}?'] }]);
  say('village.moot.start', {
    _: ['A {vEra}, they say. Feels the same from my step.', 'We\'re a {vEra}. On paper. In practice we\'re a lot of hobbits and some geese.', 'Coming up? Slowly. Like bread.'],
    cheerful: ['A {vEra}! Isn\'t it grand? We had a party for it. We have a party for everything.'],
    ornery: ['{VEra}, Village, Town. Names. Same mud.'],
    shy: ['It\'s getting bigger. I liked it when it was small. ...I like it now, too.'],
    curious: ['A {vEra}! I\'ve read what the next one needs. I have a list.'],
    dreamy: ['One day it\'ll be a town, and I\'ll be old, and I\'ll tell the young ones it was all fields.'],
    witty: ['A {vEra}. Next we\'ll be needing a coat of arms. A badger rampant on a pie.'],
    proud: ['Thistledown is a {vEra} of real standing. Folk in Bree talk about us.'],
    gloomy: ['Bigger means busier. Busier means worse. Probably.'],
    elder: ['I remember when it was three holes and a well. Now look. A {vEra}.'],
    rift: ['It\'s levelling up. Slowly. No cheat codes.'],
  }, [
    { if: { vEraReady: true }, pri: 2, text: ['Everything\'s in place for us to be a {vEraNext}! There\'s talk of a Moot. Real talk.', 'They say we\'re ready. A {vEraNext}! The Moot just has to say so.'] },
    { if: { vEra: 'Shire Town' }, pri: 1, text: ['A Shire Town! Fountains! A Great Fair every season! I never thought I\'d see it.'] },
  ]);
  say('village.moot.next', {
    _: ['A {vEraNext}? I\'d like it. I think. I\'d like to see it, anyway.', 'It\'d be grand. More folk, more fairs. More noise.'],
    cheerful: ['Oh, yes! A {vEraNext}! More parties!'],
    ornery: ['Not especially. But I\'ll vote for it, so they stop asking.'],
    shy: ['If it doesn\'t change too much. I like my corner.'],
    curious: ['Yes! A {vEraNext} gets new things. I want to see what.'],
    proud: ['It\'s only right. A village like ours deserves it.'],
    gloomy: ['If we must. It\'ll happen whether I like it or not.'],
  }, [
    { if: { values: ['tradition', 'nature'] }, pri: 1, text: ['A {vEraNext}? I don\'t know. Every step up takes a bit of the green with it.'] },
    { if: { values: ['merriment', 'learning'] }, pri: 1, text: ['A {vEraNext}! Yes! Think of the fairs. Think of the books.'] },
  ]);
  say('village.moot.moot', {
    _: ['Everyone meets on the party field. Somebody talks. Somebody else talks. Then hands go up.', 'It\'s a great show of hands. And a great deal of talk before the hands.'],
    cheerful: ['It\'s like a party, but with more speeches. Then a party!'],
    ornery: ['Talk. Hours of talk. Then they do what they were always going to do.'],
    shy: ['I put my hand up when everyone else does. Then I go home.'],
    curious: ['Fascinating. Every Moot has the same three arguments in a different order.'],
    witty: ['A Moot is where the village decides things it decided at the Badger the night before.'],
    proud: ['A proper old institution. I always speak. Somebody must.'],
    gloomy: ['They vote. The loudest side wins. It\'s never mine.'],
    rift: ['It\'s democracy with pies. I didn\'t know you could do it with pies.'],
  });
  say('village.moot.city', {
    _: ['A city! With a wall! Heaven forbid.', 'A mayor! We\'d argue for a year about the hat.'],
    cheerful: ['Ooh! Could the wall have flowers on it?'],
    ornery: ['Over my dead body. And it\'s a stubborn body.'],
    curious: ['What would a wall be for? Who would we keep out? The geese?'],
    witty: ['A wall, a mayor and a tax on pies. That\'s how it starts.'],
    proud: ['Thistledown is not meant to be a city. It\'s meant to be better than one.'],
    rift: ['Been there. Grew up there. Don\'t. Stay small.'],
  });
  say('village.moot.need', {
    _: ['More folk. More renown. A few more charters met. Everyone happier than they are now.', 'More of everything, mostly. And everyone in a good mood on the same day.'],
    curious: ['I\'ve written it all down. More folk, more renown, charters, contentment. It\'s doable.'],
    witty: ['A miracle, a wedding and a very good harvest. In any order.'],
    gloomy: ['More than we\'ve got.'],
  });
  say('village.moot.home', {
    _: ['It is. Whatever they call it.', 'Home. Yes. That\'s the only rank that matters.'],
    dreamy: ['Home. I like that you said that.'],
    ornery: ['Hmph. Sentimental. ...True.'],
  });
  say('village.moot.longest', {
    _: ['Oh, there\'s always one. You can see the others start counting the clouds.', 'Whoever has the least to say, always.'],
    witty: ['I do. It\'s a public service. Gives everyone time to nap.'],
    proud: ['I speak at the proper length. Others go on.'],
  });
  say('village.moot.speak', {
    _: ['Once. My knees knocked. I said "aye" and sat down.', 'When I\'ve something to say. Which is often. They\'d say too often.'],
    shy: ['No! Never! I\'d faint.'],
    proud: ['Every Moot. It\'s expected.'],
    ornery: ['Every time. Somebody has to talk sense.'],
  });
  say('village.moot.mayor', {
    _: ['Mayor! Ha! I\'d abolish Mondays.', 'Me! In a chain! I\'d never get anything done for the bowing.'],
    proud: ['I have often thought so myself.'],
    shy: ['Oh no. Oh, no, no. Please don\'t say that to anyone.'],
  });

  // =================================================================================
  // What's going up
  // =================================================================================
  addThread({
    id: 'village.building', label: (F) => (F.vProjectKind === 'home' ? 'A new hole being dug, I see' : 'What\'s that going up?'), weight: 0.9, cool: 3,
    when: (F) => has(F.vProject), rel: () => 1.3,
    open: { ask: 'village.building.open' },
    beats: {
      start: { line: 'village.building.start', go: [
        { ap: 'ask', say: 'Who\'ll live there?', to: 'whofor', need: { if: { vProjectKind: 'home' } } },
        { ap: 'ask', say: 'Will it be done soon?', to: 'soon' },
        { ap: 'jest', say: 'I could lend a hand. I\'m very good at pointing.', to: 'pointing' },
        { ap: 'ask', say: 'Is it wanted?', to: 'wanted' },
      ] },
      whofor: { line: 'village.building.whofor', go: [
        { ap: 'warm', say: 'A new hole is a hopeful thing.', to: 'hopeful' },
        { ap: 'jest', say: 'Perhaps I\'ll move in. I\'m very quiet. Apart from the fireworks.', to: 'movein' },
      ] },
      soon: { line: 'village.building.soon', go: [
        { ap: 'ask', say: 'And who\'s doing the work?', to: 'wrights' },
        { ap: 'warm', say: 'Good things take their time.', to: 'end' },
      ] },
      wanted: { line: 'village.building.wanted', go: [
        { ap: 'warm', say: 'A village that builds is a village that hopes.', to: 'hopeful' },
        { ap: 'ask', say: 'Where would you have put it?', to: 'where' },
      ] },
      pointing: { line: 'village.building.pointing', end: true },
      hopeful: { line: 'village.building.hopeful', fx: { fond: 0.02 }, end: true },
      movein: { line: 'village.building.movein', end: true },
      wrights: { line: 'village.building.wrights', end: true },
      where: { line: 'village.building.where', end: true },
    },
    end: { fond: 0.01 },
  });
  lines('village.building.open', [{ text: ['What\'s that going up, {name}? {VProject}, is it?', 'I see they\'re at work on {vProject}, {name}.', 'Hammering from dawn, {name}. How\'s {vProject} coming along?'] }]);
  say('village.building.start', {
    _: ['{VProject}. Slow going. Good going, though.', 'Oh, {vProject}. It\'s been the talk of the lane.', '{VProject}! You can hear the hammers from the river.'],
    cheerful: ['{VProject}! Isn\'t it exciting? I walk past twice a day to see.'],
    ornery: ['{VProject}. The noise! From dawn! I\'ve had to move my nap.'],
    shy: ['{VProject}. I watch from the hedge. It\'s nice, seeing it grow.'],
    curious: ['{VProject}! I\'ve been watching how they do the beams. Ingenious.'],
    dreamy: ['{VProject}. Every day a little more of it is there. Like a picture being drawn.'],
    witty: ['{VProject}. Or a very large pile of timber with ambitions.'],
    proud: ['{VProject}. I put a word in for the plans, actually.'],
    gloomy: ['{VProject}. It\'ll leak. New things always leak.'],
    child: ['They\'re building {vProject}! There\'s a big hole! I\'m not allowed near the hole!'],
    rift: ['{VProject}. No cranes, no drones. Just hobbits and hammers. Respect.'],
  }, [
    { if: { vProjectKind: 'home' }, pri: 1, text: ['A new hole! {VProject}. Round door, round windows, the lot.', 'They\'re digging {vProject}. A new hole means new neighbours. Or new babies.'] },
    { if: { vProjectKind: 'well' }, pri: 1, text: ['A new well! {VProject}. No more queueing at the old one. Less gossip, mind.'] },
    { if: { vProjectKind: 'field' }, pri: 1, text: ['{VProject}. Fresh furrows. More barley, more bread, more ale.'] },
    { if: { job: 'woodwright' }, pri: 2, text: ['{VProject}? That\'s mine. My back, my beams, my blisters.', 'I\'m on {vProject}. Ask me about joists. No, don\'t. I\'ll never stop.'] },
  ]);
  say('village.building.whofor', {
    _: ['Nobody knows yet. That\'s the fun. Everybody\'s guessing.', 'A young couple, they say. Or a family that\'s outgrown its hole.'],
    cheerful: ['Whoever it is, I\'ll bake them a welcome cake!'],
    ornery: ['Strangers, probably. Everyone\'s a stranger these days.'],
    shy: ['I hope it\'s someone kind. I\'d like a kind neighbour.'],
    curious: ['I have three theories and a bet with the postie.'],
    dreamy: ['Someone who doesn\'t know yet that they\'ll live there. Isn\'t that strange?'],
    witty: ['Whoever loses the argument about who gets it.'],
    gloomy: ['Someone luckier than me.'],
  }, [
    { if: { vNewcomer: (x) => has(x) }, pri: 1, text: ['{VNewcomer}, I hope. {VNewcomer}\'s been sleeping wherever there\'s room.'] },
  ]);
  say('village.building.soon', {
    _: ['When the timber holds out. Which is when the woodwrights say.', 'A few days. A week. Building goes at its own pace.'],
    cheerful: ['Soon! Any day! I keep saying that!'],
    ornery: ['Never, at this rate. They stop for second breakfast. And third.'],
    curious: ['I\'ve been measuring. A hand a day, roughly. So... a while.'],
    proud: ['When it\'s done right. Not before.'],
    gloomy: ['They always say soon.'],
  }, [
    { if: { vStoreShort: 'timber' }, pri: 2, text: ['Not with the Store so short of timber. They\'re waiting on wood.'] },
  ]);
  say('village.building.wanted', {
    _: ['Wanted? Oh, yes. We\'re bursting at the seams.', 'Most say yes. A few miss the meadow.'],
    ornery: ['Wanted by whom? Nobody asked me.'],
    curious: ['By the numbers, very much. We\'re short of room.'],
  }, [
    { if: { values: 'nature' }, pri: 1, text: ['Wanted by some. It took a good bit of meadow. The larks used to nest there.'] },
    { if: { values: ['craft', 'order'] }, pri: 1, text: ['Wanted? It\'s needed. A growing village has to grow somewhere.'] },
  ]);
  say('village.building.pointing', {
    _: ['Pointing! Ha! The woodwrights have plenty of those already.', 'Come and point, then. We\'ll put you on the roof.'],
    child: ['I\'m good at pointing too! Look!'],
    witty: ['The foreman points. You\'d be competition.'],
  });
  say('village.building.hopeful', {
    _: ['It is, isn\'t it? I hadn\'t thought of it like that.', 'Hopeful. Yes. Like a seed.'],
    dreamy: ['A village that hopes. I\'ll think of that every time I hear a hammer.'],
    gloomy: ['Hopeful. Hm. All right. A little hopeful.'],
  });
  say('village.building.movein', {
    _: ['Ha! You\'d never fit through the door.', 'You\'d have to dig it twice as deep. And twice as tall.'],
    child: ['Yes! Move in! Next to me!'],
  });
  say('village.building.wrights', {
    _: ['The woodwrights, bless their backs.', 'Whoever\'s handy. Half the village has carried a beam.'],
  }, [
    { if: { vWright: (x) => has(x) }, pri: 1, text: ['{VWright}, mostly. {VWright}\'s worked every hour there is.', '{VWright} and whoever {vWright} can talk into holding a ladder.'] },
  ]);
  say('village.building.where', {
    _: ['By the river. Everyone wants to be by the river.', 'Further from my window. Anywhere further from my window.'],
    curious: ['On the south slope. Better sun. I\'ve drawn it.'],
  });

  // =================================================================================
  // The lamplighter
  // =================================================================================
  addThread({
    id: 'village.lamps', label: 'Who lights the lamps of an evening?', weight: 0.7, cool: 6,
    when: (F) => (World.lamps || []).length > 0 && (has(F.vLamplighter) || F.job === 'lamplighter'), rel: (F) => (F.job === 'lamplighter' ? 1.6 : F.hour === 'evening' ? 1.3 : 0.7),
    open: { ask: 'village.lamps.open' },
    beats: {
      start: { line: 'village.lamps.start', go: [
        { ap: 'ask', say: 'Do you like the lanes lit?', to: 'lit' },
        { ap: 'jest', say: 'I could light them all at once. With one snap of my fingers.', to: 'snap' },
        { ap: 'ask', say: 'What was the dark like, before the lamps?', to: 'dark' },
      ] },
      lit: { line: 'village.lamps.lit', go: [
        { ap: 'ask', say: 'And the stars?', to: 'stars' },
        { ap: 'warm', say: 'A lit lane is a kindness to a stranger.', to: 'kind' },
      ] },
      snap: { line: 'village.lamps.snap', go: [
        { ap: 'warm', say: 'I wouldn\'t dream of it. It\'s a craft.', to: 'craft' },
        { ap: 'jest', say: 'Just the one, then. The awkward one by the bridge.', to: 'bridge' },
      ] },
      dark: { line: 'village.lamps.dark', go: [
        { ap: 'share', say: 'I\'ve walked a great deal of dark. A lamp at the end is the best thing in the world.', to: 'end', fx: { trust: 0.02 } },
        { ap: 'ask', say: 'And the stars?', to: 'stars' },
      ] },
      stars: { line: 'village.lamps.stars', end: true },
      kind: { line: 'village.lamps.kind', fx: { fond: 0.02 }, end: true },
      craft: { line: 'village.lamps.craft', fx: { respect: 0.02 }, end: true },
      bridge: { line: 'village.lamps.bridge', end: true },
    },
    end: { fond: 0.01 },
  });
  lines('village.lamps.open', [
    { text: ['Who lights the lamps of an evening, {name}? I always miss it.', 'The lanes look lovely lit, {name}. Who goes round?'] },
    { if: { job: 'lamplighter' }, pri: 2, text: ['How are the rounds, {name}? I watched you light the square last night.', 'You\'re the lamplighter, {name}. Do you ever tire of it?'] },
  ]);
  say('village.lamps.start', {
    _: ['{VLamplighter}, with a long pole, from lamp to lamp. You can watch the village come on, one light at a time.', '{VLamplighter} goes round before sunset. Never misses. Not once.'],
    cheerful: ['{VLamplighter}! Waves at every window. I wave back. It\'s our little thing.'],
    ornery: ['{VLamplighter}. Starts too early in summer and too late in winter. Every year.'],
    shy: ['{VLamplighter}. I like hearing the footsteps go past. Then the light comes on.'],
    curious: ['{VLamplighter}. Do you know there\'s an order to it? Nearest next. I\'ve watched.'],
    dreamy: ['{VLamplighter}. It\'s like watching someone sew stars along the lanes.'],
    witty: ['{VLamplighter}. The only hobbit in the village who gets paid to play with fire.'],
    proud: ['{VLamplighter}. A proper job, done properly.'],
    gloomy: ['{VLamplighter}. Out in all weathers. Thankless.'],
    child: ['{VLamplighter}! With a STICK! On fire! Can I have a go?'],
    rift: ['{VLamplighter}. Manually lighting every lamp. With fire. I\'ve never been so charmed.'],
  }, [
    { if: { job: 'lamplighter' }, pri: 3, text: ['Me! Every evening, before sunset, every lamp in the village. Then every morning, out again.', 'Tire of it? Never. The first lamp of the evening still makes me smile.'] },
  ]);
  say('village.lamps.lit', {
    _: ['I do. You don\'t turn your ankle on the way home from the Badger.', 'Lit lanes are a fine thing. A safe thing.'],
    cheerful: ['Oh, yes! The village looks like a party every night!'],
    ornery: ['They\'re all right. Glaring, some of them.'],
    shy: ['I walk home quicker when it\'s dark. I like the lamps.'],
    dreamy: ['Lit and unlit. Both have their charm.'],
    gloomy: ['They go out in the morning. Everything does.'],
  }, [
    { if: { values: 'order' }, pri: 1, text: ['Every lane should be lit. Order, safety, decency. Lamps are all three.'] },
    { if: { values: 'nature' }, pri: 1, text: ['I\'d rather the dark, if I\'m honest. The owls would too.'] },
  ]);
  say('village.lamps.snap', {
    _: ['And put {vLamplighter} out of a job? Don\'t you dare.', 'Ha! You\'d set the thatch going.'],
    ornery: ['Typical wizard. Showing off and taking work from honest folk.'],
    child: ['Do it! Do it NOW!'],
    witty: ['And then what would we watch of an evening? You?'],
  }, [
    { if: { job: 'lamplighter' }, pri: 2, text: ['Don\'t you dare! It\'s MY rounds. I\'ve a pole and everything.'] },
  ]);
  say('village.lamps.dark', {
    _: ['Dark. Proper dark. You found your way by the smell of supper.', 'You carried a candle and hoped. Mostly you got lost.'],
    elder: ['When I was young there were no lamps at all. We walked home by starlight and memory.'],
    dreamy: ['Deep and soft. Like a blanket with holes for the stars.'],
    gloomy: ['Frightening. It\'s still frightening. The lamps just hide it.'],
    rift: ['Before? I\'ve never seen real dark in my life till I came here.'],
  });
  say('village.lamps.stars', {
    _: ['The stars still come. You just have to walk past the last lamp.', 'You lose a few. You gain the walk home.'],
    dreamy: ['That\'s the only sadness. I go up the hill to find them.'],
    rift: ['Stars! Real ones! I still stand in the meadow with my mouth open.'],
  });
  say('village.lamps.kind', {
    _: ['A kindness to a stranger. Yes. I\'ll think of that, walking home.', 'Hm. You see it differently. I like that.'],
  });
  say('village.lamps.craft', {
    _: ['It is a craft. You\'d be surprised how hard the high ones are.', 'Good. Some things should be done by hand.'],
  }, [{ if: { job: 'lamplighter' }, pri: 1, text: ['Thank you. Nobody ever says that. It\'s a craft. It is.'] }]);
  say('village.lamps.bridge', {
    _: ['The one by the bridge! It never catches first time.', 'Ha! That one. Even {vLamplighter} swears at that one.'],
  }, [{ if: { job: 'lamplighter' }, pri: 1, text: ['That lamp! Fine. Light that one. Just that one. I won\'t tell.'] }]);

  // =================================================================================
  // The weather's trials
  // =================================================================================
  addThread({
    id: 'village.hazard', label: (F) => (F.vHazardOn ? 'How are you weathering it?' : 'Is the village ready for what\'s coming?'), weight: 1.2, cool: 1,
    when: (F) => has(F.vHazard), rel: (F) => (F.vHazardOn ? 1.8 : 1.5),
    open: { ask: 'village.hazard.open' },
    beats: {
      start: { line: 'village.hazard.start', go: [
        { ap: 'ask', say: 'What can be done?', to: 'done' },
        { ap: 'comfort', say: 'It\'ll pass. These things do.', to: 'pass' },
        { ap: 'jest', say: 'I\'ll have a word with the weather. It owes me a favour.', to: 'weather' },
      ] },
      done: { line: 'village.hazard.done', go: [
        { ap: 'advise', say: 'Then let\'s see it done, and quickly.', to: 'do' },
        { ap: 'warm', say: 'You\'ve thought it through. I\'m glad.', to: 'end', fx: { respect: 0.01 } },
      ] },
      pass: { line: 'village.hazard.pass', go: [
        { ap: 'share', say: 'I\'ve seen a great many floods and frosts. The valley always comes through.', to: 'through' },
        { ap: 'ask', say: 'Is there anything you need?', to: 'needs' },
      ] },
      weather: { line: 'village.hazard.weather', end: true },
      do: { line: 'village.hazard.do', fx: { respect: 0.03 }, end: true },
      through: { line: 'village.hazard.through', fx: { trust: 0.02 }, end: true },
      needs: { line: 'village.hazard.needs', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('village.hazard.open', [
    { text: ['Is the village ready for what\'s coming, {name}?', 'I read the warning in the Chronicle, {name}. Are you worried?'] },
    { if: { vHazardOn: true }, pri: 1, text: ['How are you weathering it, {name}?', 'Bearing up, {name}? It\'s a hard few days.'] },
  ]);
  const HZ = (k, on) => ({ if: { vHazard: k, vHazardOn: on } });
  say('village.hazard.start', {
    _: ['We\'ll manage. We always manage. That\'s what Thistledown does.', 'Worried? A bit. You\'d be daft not to be.'],
    cheerful: ['Oh, we\'ll be fine! We\'ll have a party afterwards!'],
    ornery: ['Nobody listens to me, so nobody\'s ready. That\'s how it goes.'],
    shy: ['I\'m frightened, a bit. Is that silly?'],
    curious: ['I\'ve been reading about it in the almanac. There\'s a pattern.'],
    proud: ['My hole is ready. I can\'t speak for anyone else\'s.'],
    gloomy: ['This is the one that finishes us. I\'ve said that before. This time I mean it.'],
    child: ['Is it going to be bad? Mum says it won\'t be bad.'],
    rift: ['A real weather event. No dome. No shield. Just us. Wild.'],
  }, [
    { ...HZ('flood', false), text: ['The river\'s up. High and brown. Anything on the low meadows is in for it.', 'The water\'s talking. You can hear it from the lane. A flood\'s coming.'] },
    { ...HZ('flood', true), text: ['The meadows are under. My boots are under. Everything smells of river.', 'Flooded. Half the low fields gone. We\'ll be bailing for a week.'] },
    { ...HZ('drought', false), text: ['Not a cloud. The wells are low. If the dry comes, the far fields will suffer.'] },
    { ...HZ('drought', true), text: ['Dust everywhere. The barley\'s thirsty. I\'m thirsty. The hens are thirsty.', 'Cracked ground and short tempers. We need rain.'] },
    { ...HZ('blight', false), text: ['The barley doesn\'t look right. Spots. The farmers are muttering.'] },
    { ...HZ('blight', true), text: ['Blight in the field. Whole rows stopped growing. It\'s a sorry sight.'] },
    { ...HZ('frost', false), text: ['Clear sky and a bite in the air. A hard frost is coming. Is the woodpile up to it?'] },
    { ...HZ('frost', true), text: ['Bitter. The hearth eats wood like a dragon. I\'ve two jumpers on. Three.', 'Every breath a cloud. The river\'s got ice at the edges.'] },
    { if: { job: 'farmer', vHazard: ['flood', 'drought', 'blight'] }, pri: 1, text: ['It\'s my fields, wizard. My barley. I\'ve not slept.'] },
    { if: { job: 'woodwright', vHazard: 'frost' }, pri: 1, text: ['Every hole wants timber at once. I\'ve chopped till my arms hum.'] },
    { if: { job: 'herbalist', vHazard: 'blight' }, pri: 1, text: ['Herbs. They need herbs on that field. I\'ve been at it since dawn.'] },
  ]);
  say('village.hazard.done', {
    _: ['Pull together. That\'s what can be done. Somebody has to start.', 'Not much, now. Before, a lot. Next time.'],
    ornery: ['What can be done? Should have been done last season. I said so.'],
    curious: ['Plenty, if folk would listen. I have a list.'],
  }, [
    { if: { vHazard: 'flood' }, pri: 1, text: ['Raise the banks along the river. Raised ground holds water back. Everybody knows. Nobody does it.'] },
    { if: { vHazard: 'drought' }, pri: 1, text: ['More wells. A pond by the fields. Water close to the barley, that\'s the trick.'] },
    { if: { vHazard: 'blight' }, pri: 1, text: ['The herbalist can treat it, with enough herbs. Or there\'s dwarf sulphur, if anyone has the coin.'] },
    { if: { vHazard: 'frost' }, pri: 1, text: ['Wood. Stack every stick. The hearths burn twice as much in a hard frost.'] },
  ]);
  say('village.hazard.pass', {
    _: ['It will. I know it will. It\'s getting through the middle that\'s hard.', 'They do. Then they come back. Then they pass again.'],
    gloomy: ['Pass. Yes. And leave a mess.'],
    shy: ['...Thank you. I needed somebody to say it.'],
    child: ['Promise?'],
  });
  say('village.hazard.weather', {
    _: ['Ha! Do. Tell it Thistledown sends its regards and would like its sun back.', 'A favour! Can you really? ...You can\'t, can you.'],
    child: ['Can you REALLY? Tell it to stop!'],
    ornery: ['If you could, you\'d have done it already.'],
    witty: ['Tell it to take it up with the Moot. Like everyone else.'],
  });
  say('village.hazard.do', {
    _: ['Right. I\'ll go and see who\'s about. Many hands.', 'You\'re right. Talking won\'t raise a bank.'],
    ornery: ['I\'ve been saying so all week. Fine. I\'ll start.'],
    proud: ['I\'ll organise it. Somebody must.'],
  });
  say('village.hazard.through', {
    _: ['Always comes through. Yes. I believe that, when you say it.', 'Coming from you, that means something.'],
    elder: ['It does. I\'ve seen the big flood and the long winter. We\'re still here.'],
  });
  say('village.hazard.needs', {
    _: ['Dry socks. And a bit of company. You\'ve helped with the second.', 'Nothing. Well. A cup of tea would be nice.'],
    gloomy: ['Rain. Or sun. Whichever it isn\'t.'],
  });

  // =================================================================================
  // Newcomers
  // =================================================================================
  addThread({
    id: 'village.newcomer', label: (F) => (F.vNewcomer ? `What do you make of ${F.vNewcomer}?` : 'The newcomer'), weight: 1, cool: 4,
    when: (F) => has(F.vNewcomer) && !F.vAmNew, rel: (F) => (F.vNewcomerRough ? 1.5 : 1.1),
    open: { ask: 'village.newcomer.open' },
    beats: {
      start: { line: 'village.newcomer.start', go: [
        { ap: 'advise', say: 'Go and say hello. Being new is hard.', to: 'hello' },
        { ap: 'ask', say: 'Where\'s {vNewcomer} sleeping?', to: 'sleeping', need: { if: { vNewcomerRough: true } } },
        { ap: 'ask', say: 'Have you spoken to {vNewcomer}?', to: 'spoken' },
        { ap: 'jest', say: 'We were all new once. Even me. Especially me.', to: 'new' },
      ] },
      hello: { line: 'village.newcomer.hello', fx: { respect: 0.02, run: (T, v) => { const o = personById(T.F.vNewcomerId); if (o && ACTIONS.whisper_visit) v.queue.push({ a: ACTIONS.whisper_visit, extra: { to: o, kind: 'welcome' } }); } }, end: true },
      sleeping: { line: 'village.newcomer.sleeping', go: [
        { ap: 'advise', say: 'Could you spare a corner?', to: 'corner' },
        { ap: 'comfort', say: 'Someone will take them in. Thistledown always does.', to: 'always' },
      ] },
      spoken: { line: 'village.newcomer.spoken', go: [
        { ap: 'advise', say: 'Go and say hello. Being new is hard.', to: 'hello' },
        { ap: 'warm', say: 'Give it time. Strangers become neighbours.', to: 'end' },
      ] },
      new: { line: 'village.newcomer.new', go: [
        { ap: 'tale', say: 'I came in a wagon full of fireworks and nobody would sell me a pie.', to: 'pie' },
        { ap: 'advise', say: 'So be the one who says hello.', to: 'hello' },
      ] },
      corner: { line: 'village.newcomer.corner', end: true },
      always: { line: 'village.newcomer.always', end: true },
      pie: { line: 'village.newcomer.pie', fx: { fond: 0.02 }, go: [
        { ap: 'advise', say: 'So take {vNewcomer} a pie.', to: 'hello' },
        { ap: 'warm', say: 'It all came right in the end.', to: 'end' },
      ] },
    },
    end: { fond: 0.01 },
  });
  lines('village.newcomer.open', [{ text: ['What do you make of {vNewcomer}, {name}? The new face?', 'Have you met {vNewcomer} yet, {name}? New to the village.', 'There\'s a stranger in the lanes, {name}. {VNewcomer}. What\'s the word?'] }]);
  say('village.newcomer.start', {
    _: ['{VNewcomer}? Seems pleasant. Asks a lot of directions. Gets lost anyway.', 'The new one. Keeps asking where the Store is. I\'ve told {vNewcomer} three times.', '{VNewcomer}. Nobody knows much. That\'s the trouble with new.'],
    cheerful: ['Oh, {vNewcomer}! Lovely! I gave {vNewcomer} directions to the Badger and a scone!'],
    ornery: ['Another one. Where do they all come from? Where do they all sleep?'],
    shy: ['I saw {vNewcomer} by the well, looking lost. I wanted to say something. I didn\'t.'],
    curious: ['{VNewcomer}! Where from? Why here? What did {vNewcomer} bring? I\'ve so many questions.'],
    dreamy: ['{VNewcomer} looks at everything like it\'s the first morning of the world.'],
    witty: ['{VNewcomer} asked me the way to the mill. I pointed at the mill. It was very awkward.'],
    proud: ['{VNewcomer} seems respectable enough. Time will tell.'],
    gloomy: ['{VNewcomer} looks how I feel most days. Lost.'],
    rift: ['{VNewcomer}? I remember being that lost. First week\'s the worst.'],
  }, [
    { if: { vNewcomerRift: true, rift: false }, pri: 1, text: ['{VNewcomer} came through the rift. Glowing bits on the sleeves. Very polite, though.', 'One of the rift-folk. {VNewcomer}. Talks oddly. Means well, I think.'] },
    { if: { vNewcomerRift: true, values: 'tradition' }, pri: 2, text: ['Another one from the sky. {VNewcomer}. I\'ve nothing against them. I\'d just like to know how many more.'] },
    { if: { vNewcomerRift: true, values: 'learning' }, pri: 2, text: ['{VNewcomer}, from through the rift! I want to know everything about where {vNewcomer} came from.'] },
    { if: { vNewcomerRift: true, rift: true }, pri: 2, text: ['{VNewcomer}\'s one of us. Came through last week. I\'m showing {vNewcomer} the ropes. Well, the hedges.'] },
  ]);
  say('village.newcomer.hello', {
    _: ['You\'re right. I\'ll go and say hello. Properly.', 'Being new is hard. I\'ll take {vNewcomer} something.'],
    cheerful: ['Yes! I\'ll go now! With cake!'],
    ornery: ['Hmph. Fine. A brief hello. With a scone. A small scone.'],
    shy: ['...All right. I\'ll try. If I go red, I go red.'],
    proud: ['Somebody ought to welcome them properly. It may as well be me.'],
    gloomy: ['They won\'t want to talk to me. ...I\'ll go.'],
    rift: ['On it. Someone did it for me. Paying it forward.'],
  });
  say('village.newcomer.sleeping', {
    _: ['Under the hedge by the mill, last I heard. The inn was full.', 'Rough, poor thing. Under a tree. In this weather.'],
    cheerful: ['Oh no! That won\'t do! Somebody must have a spare room!'],
    ornery: ['Under a hedge. It won\'t kill {vNewcomer}. ...It might. In this weather.'],
    shy: ['I saw {vNewcomer} curled up by the old oak. I left a blanket. I didn\'t knock.'],
    gloomy: ['Out in the cold. Like I\'d be, if I was new.'],
  });
  say('village.newcomer.corner', {
    _: ['A corner? Well... there\'s the box-room. It\'s full of jars. I could move the jars.', 'Me? I\'m not sure there\'s room. ...There might be room.'],
    cheerful: ['Oh, yes! The more the merrier! I\'ll air the spare bed!'],
    ornery: ['My hole\'s full of me. And my opinions. No room.'],
    shy: ['I... I\'d like to. I don\'t know how to ask.'],
    proud: ['My household has a long tradition of hospitality. I\'ll consider it.'],
  });
  say('village.newcomer.always', {
    _: ['It does. It always does. Somebody\'ll open a door.', 'I hope so. We were all somebody\'s stranger once.'],
    gloomy: ['Not always. But I hope so.'],
  });
  say('village.newcomer.spoken', {
    _: ['Only to say good morning. {VNewcomer} jumped.', 'Not yet. I keep meaning to.'],
    cheerful: ['Of course! Twice! {VNewcomer} laughed at my joke. Well. Smiled.'],
    shy: ['No. ...I waved. Does waving count?'],
    curious: ['Yes! For an hour! I\'ve learned a great deal.'],
    ornery: ['I nodded. That\'s plenty for a first week.'],
  });
  say('village.newcomer.new', {
    _: ['You? New? You\'ve been coming here for ever.', 'Especially you! Ha! What were you like, new?'],
    child: ['You were new? Were you scared?'],
    elder: ['I remember. You turned up with a cartful of noise and my mother hid the spoons.'],
  });
  say('village.newcomer.pie', {
    _: ['No pie! In Thistledown! A disgrace.', 'Ha! Nobody would sell a wizard a pie? That\'s shameful.'],
    elder: ['That was my mother. She thought you\'d set it on fire.'],
    cheerful: ['I\'d have given you three!'],
  });

  // ---------------------------------------------------------------------------------
  // The newcomer themselves: finding their feet
  addThread({
    id: 'village.newme', label: 'Finding your feet?', weight: 1.4, cool: 2,
    when: (F) => F.vAmNew, rel: () => 1.8,
    open: { warm: 'village.newme.open' },
    beats: {
      start: { line: 'village.newme.start', go: [
        { ap: 'ask', say: 'Who\'s been kind to you?', to: 'kind' },
        { ap: 'advise', say: 'Learn the way to the Badger first. Everything else follows.', to: 'badger' },
        { ap: 'warm', say: 'You\'ll belong before you know it.', to: 'belong' },
      ] },
      kind: { line: 'village.newme.kind', go: [
        { ap: 'warm', say: 'Then you\'ve a friend already.', to: 'end' },
        { ap: 'ask', say: 'And who hasn\'t?', to: 'unkind' },
      ] },
      badger: { line: 'village.newme.badger', fx: { respect: 0.02 }, end: true },
      belong: { line: 'village.newme.belong', fx: { trust: 0.03, drive: { lonely: -0.1 } }, end: true },
      unkind: { line: 'village.newme.unkind', go: [
        { ap: 'comfort', say: 'They\'re wary, not cruel. It wears off.', to: 'end', fx: { trust: 0.02 } },
        { ap: 'advise', say: 'Ask them for something small. Folk warm to being asked.', to: 'small' },
      ] },
      small: { line: 'village.newme.small', fx: { respect: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('village.newme.open', [{ text: ['Finding your feet in Thistledown, {name}?', 'How are you getting on, {name}? It\'s a lot of new faces.', 'Lost yet, {name}? Everyone gets lost the first week.'] }]);
  say('village.newme.start', {
    _: ['Slowly. I know where the well is. And the inn. That\'s two.', 'Everyone knows everyone. I know nobody. It\'s a lot.', 'I keep going round in circles. It\'s a very round village.'],
    cheerful: ['Oh, I love it! I\'ve been lost four times and found three!'],
    ornery: ['They all look at me like I\'ve come to steal the spoons.'],
    shy: ['...It\'s hard. I don\'t know who to ask things.'],
    curious: ['Every lane is a new question. I\'m mapping it in my head.'],
    dreamy: ['It feels like a story I\'ve walked into the middle of.'],
    witty: ['I\'ve found the Badger, which is the important thing. The rest is detail.'],
    proud: ['I\'m managing perfectly well, thank you. Mostly.'],
    gloomy: ['Nobody knows my name. I\'m not sure they want to.'],
    rift: ['No map, no signal, no idea. But the air smells incredible.', 'I\'ve been offline since I came through. Turns out you can just... walk.'],
  });
  say('village.newme.kind', {
    _: ['A woman at the well showed me the Store. Didn\'t even ask why.', 'The innkeeper gave me soup and didn\'t charge. I\'ll pay it back.'],
    shy: ['Someone left bread on the bench where I slept. I don\'t know who.'],
    rift: ['A kid asked if my visor could see through walls. That counted as kind, honestly.'],
    gloomy: ['One or two. More than I expected, really.'],
  });
  say('village.newme.badger', {
    _: ['The Badger first. Ha. I\'ve already done that bit.', 'Noted. Badger, then everything else.'],
    rift: ['Badger as home base. Got it. Pinning it.'],
  });
  say('village.newme.belong', {
    _: ['...I hope so. I\'d like to belong somewhere.', 'Belong. That\'s a big word. A nice one.'],
    rift: ['Belong. Back home nobody did. I\'ll take it.'],
    gloomy: ['That\'d be something. I\'m not holding my breath.'],
  });
  say('village.newme.unkind', {
    _: ['Some of the old ones. They don\'t say anything. That\'s worse.', 'A few shut the door. Polite about it. Still shut.'],
    rift: ['The wary ones. They see the glow and step back. I get it. Still stings.'],
  });
  say('village.newme.small', {
    _: ['Ask for something? Like... the way to the mill? I could do that.', 'Hm. Ask a favour. That\'s clever. That\'s very hobbit.'],
  });

  // =================================================================================
  // The mill, and the well
  // =================================================================================
  addThread({
    id: 'village.mill', label: 'How\'s the old mill turning?', weight: 0.6, cool: 6,
    when: (F) => F.vMill, rel: (F) => (F.job === 'miller' ? 1.6 : 0.6),
    open: { ask: 'village.mill.open' },
    beats: {
      start: { line: 'village.mill.start', go: [
        { ap: 'ask', say: 'And the miller? What\'s the miller like?', to: 'miller', need: { if: { vMiller: (x) => has(x) } } },
        { ap: 'jest', say: 'Does the wheel still squeak? I could hear it from the hill.', to: 'squeak' },
        { ap: 'ask', say: 'What\'s it like in the mill-pond?', to: 'pond' },
      ] },
      miller: { line: 'village.mill.miller', end: true },
      squeak: { line: 'village.mill.squeak', go: [
        { ap: 'jest', say: 'I could oil it. With a spell. A greasy one.', to: 'oil' },
        { ap: 'warm', say: 'It\'s a homely sound, a squeak.', to: 'homely' },
      ] },
      pond: { line: 'village.mill.pond', end: true },
      oil: { line: 'village.mill.oil', end: true },
      homely: { line: 'village.mill.homely', end: true },
    },
    end: { fond: 0.01 },
  });
  lines('village.mill.open', [
    { text: ['How\'s the old mill turning, {name}?', 'I passed the mill this morning, {name}. The wheel was singing.'] },
    { if: { job: 'miller' }, pri: 2, text: ['How\'s the mill, {name}? Grinding well?'] },
  ]);
  say('village.mill.start', {
    _: ['Turning. It always turns. That\'s the thing about a mill. It doesn\'t stop to think.', 'Grinding away. Flour on everything for half a mile.'],
    cheerful: ['Round and round! I love the sound of it. Like the village humming.'],
    ornery: ['It squeaks. All night. I\'ve complained. It squeaks louder.'],
    shy: ['I like to sit on the bridge and watch it. It doesn\'t mind me.'],
    curious: ['Do you know how many cogs are in there? Thirty-one. I asked.'],
    dreamy: ['The wheel is like a clock that measures water.'],
    witty: ['The mill is the only thing in Thistledown that works harder than the gossip.'],
    proud: ['A fine mill. One of the best this side of the Water.'],
    gloomy: ['It\'ll break one day. Then we\'ll know what we had.'],
    child: ['It goes round and round and the water goes SPLOOSH!'],
    rift: ['A water-powered machine with no electronics. It\'s beautiful. I\'ve sketched it nine times.'],
  }, [
    { if: { job: 'miller' }, pri: 2, text: ['Grinding well. The stones want dressing, mind. They always want something.', 'Busy! Barley in, flour out, and dust in my ears from dawn to dusk.'] },
  ]);
  say('village.mill.miller', {
    _: ['{VMiller}? Floury. Patient. Knows the river better than the fish do.', '{VMiller} hears the mill like you\'d hear a friend breathing. Knows when something\'s off.'],
    cheerful: ['{VMiller} sings to the stones! Honestly! I\'ve heard it!'],
    ornery: ['{VMiller}. Charges a fair toll. Too fair. Suspiciously fair.'],
    curious: ['{VMiller} once explained the gearing to me for two hours. Best afternoon of my life.'],
    witty: ['{VMiller} is the only hobbit who comes home whiter than they went out.'],
  });
  say('village.mill.squeak', {
    _: ['Squeak! It shrieks! Like a heron with a grievance.', 'Every night. You get used to it. Then it stops and you can\'t sleep.'],
    cheerful: ['It does! I think it\'s singing!'],
    ornery: ['Squeak! Don\'t talk to me about squeak!'],
    rift: ['Four degrees out of true. I could fix it in an hour if anyone would let me.'],
  }, [{ if: { job: 'miller' }, pri: 1, text: ['It does NOT squeak. It... expresses itself. ...I\'ll grease it.'] }]);
  say('village.mill.pond', {
    _: ['Deep, cold and full of eels. Don\'t swim in it. Everybody does.', 'Still as a plate on a calm day. The ducks own it.'],
    child: ['There\'s a fish in there as big as a DOG.'],
    dreamy: ['On a still evening you can see the whole sky in it, upside down.'],
  });
  say('village.mill.oil', {
    _: ['A greasy spell! Ha! Don\'t you dare. You\'ll flood the bakery.', 'Go on, then. If it starts singing opera, it\'s your fault.'],
  }, [{ if: { job: 'miller' }, pri: 1, text: ['Touch my wheel with a spell and you\'ll be wearing flour till Yule.'] }]);
  say('village.mill.homely', {
    _: ['Homely! It is, I suppose. I\'d miss it.', 'Hm. A homely squeak. I\'ll try to think of it that way at three in the morning.'],
  });

  addThread({
    id: 'village.well', label: 'Do you go to the well much?', weight: 0.6, cool: 6,
    when: (F) => F.vWell,
    open: { ask: 'village.well.open' },
    beats: {
      start: { line: 'village.well.start', go: [
        { ap: 'ask', say: 'Ever made a wish in it?', to: 'wish', need: { open: 1 }, soft: true },
        { ap: 'ask', say: 'Who do you meet there?', to: 'meet' },
        { ap: 'jest', say: 'I dropped a spoon down it once. Long ago. Has anyone found it?', to: 'spoon' },
      ] },
      wish: { line: 'village.well.wish', fx: { confide: { k: 'village.well.wish', t: '{Name} once made a wish in the village well, and won\'t say what.', secret: true } }, go: [
        { ap: 'warm', say: 'I hope it comes true.', to: 'hope' },
        { ap: 'jest', say: 'Did it come true?', to: 'came' },
      ] },
      meet: { line: 'village.well.meet', end: true },
      spoon: { line: 'village.well.spoon', fx: { joke: { k: 'village.spoon', t: 'The wizard\'s spoon is still down the well.' } }, end: true },
      hope: { line: 'village.well.hope', fx: { trust: 0.02 }, end: true },
      came: { line: 'village.well.came', end: true },
    },
    end: { fond: 0.01 },
  });
  lines('village.well.open', [{ text: ['Do you go to the well much, {name}?', 'I always find the village at the well, {name}. Do you?', 'The well\'s busy this morning, {name}. What do folk talk about there?'] }]);
  say('village.well.start', {
    _: ['Every morning. Water, and the news. Not in that order.', 'The well\'s where you find out everything. Before the Badger even.'],
    cheerful: ['Oh, every day! It\'s the best gossip in the village!'],
    ornery: ['Every day. Somebody\'s always in front of me. Talking.'],
    shy: ['Early. Before anyone\'s there. It\'s peaceful.'],
    curious: ['As often as I can. You hear things at the well you\'d never hear indoors.'],
    dreamy: ['I like looking down it. It\'s like looking into the dark under everything.'],
    witty: ['Every day. The water\'s an excuse. The gossip\'s the point.'],
    proud: ['I draw my water like everyone else. I don\'t linger. Much.'],
    gloomy: ['Every day. Up and down the hill with a bucket. It\'s my life.'],
    child: ['I\'m not allowed to lean over! I lean over anyway!'],
    rift: ['A well. A hole with water in. You pull it up yourself. I still find this amazing.'],
  });
  say('village.well.wish', {
    _: ['...Once. When I was small. I won\'t say what. It\'s bad luck.', 'Everybody has. Don\'t let them tell you otherwise. I wished... no. I won\'t say.'],
    shy: ['...Yes. A button, at midnight. I wished for a friend. Don\'t tell anyone.'],
    dreamy: ['Many times. I don\'t think wells grant them. I think the wishing does.'],
    ornery: ['A wish? In a well? ...Once. It didn\'t work. Don\'t ask.'],
    child: ['Yes! I wished for a pony! It hasn\'t come yet.'],
    rift: ['Yeah. First night here. Wished to go home. Then I stopped wishing that.'],
  });
  say('village.well.meet', {
    _: ['Everybody. Sooner or later, everybody comes to the well.', 'The early lot, mostly. The same faces. We\'ve a lot to say about the late lot.'],
    curious: ['Everyone, which is why I go. I learn more there than anywhere.'],
    shy: ['Nobody, if I time it right.'],
  });
  say('village.well.spoon', {
    _: ['Ha! A spoon! There\'s probably a whole set down there by now.', 'Your spoon! No. But somebody pulled up a boot last spring.'],
    child: ['Can I look for it? Can I go DOWN?'],
    witty: ['It\'s become a local legend. The wizard\'s spoon. Folk wish on it.'],
  });
  say('village.well.hope', {
    _: ['So do I. It\'s been a long time coming.', 'Thank you. I\'d almost forgotten I made it.'],
  });
  say('village.well.came', {
    _: ['...A bit. Not the way I meant. But a bit.', 'Not yet. I\'m patient.'],
    child: ['NO. Still no pony.'],
  });
});
