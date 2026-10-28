'use strict';
// ---------------------------------------------------------------------------
// Work and the trades, the first of four packs (work, work2, work3, work4):
// the facts every work thread draws on (how good they are at their trade,
// how long they've been at it, what the trade made today, who they work
// with, what's short in the Store, the Steward's week, the season's trial),
// and the threads any working hobbit can have: how the work's going, how
// they came to the trade, and a problem of the trade they bring to the wizard.
// The trades one by one are in work2 (the food trades) and work3 (the rest);
// apprentices, rivals, the retired, children, the Steward's week, the Store
// and a bad year are in work4.
//
// Lines here are written with a small helper, W(key, spec): each key of spec
// is a condition and its value the texts. '_' is the fallback; a temper name
// (cheerful, ornery, shy, curious, dreamy, witty, proud, gloomy, child) tests
// the temper; 'fact=a|b' tests a value, 'fact>n' and 'fact<n' a number (at
// least, at most), 'fact' that it's there, '!fact' that it isn't, and '^n'
// adds n to the rule's priority. Several are joined with spaces.
// ---------------------------------------------------------------------------

talkPack('work', () => {
  const TEMPERS = ['cheerful', 'ornery', 'shy', 'curious', 'dreamy', 'witty', 'proud', 'gloomy', 'child'];
  const has = (x) => !!(Array.isArray(x) ? x.length : x);
  const cond = (s) => {
    const c = {}; let pri = 0;
    for (const p of s.split(' ')) {
      if (!p) continue;
      let m;
      if (p[0] === '^') pri += +p.slice(1);
      else if (TEMPERS.includes(p)) c.temper = p;
      else if ((m = p.match(/^(\w+)>(-?[\d.]+)$/))) c[m[1]] = { min: +m[2] };
      else if ((m = p.match(/^(\w+)<(-?[\d.]+)$/))) c[m[1]] = { max: +m[2] };
      else if ((m = p.match(/^!(\w+)$/))) c[m[1]] = false;
      else if ((m = p.match(/^(\w+)=(.+)$/))) { const vs = m[2].split('|').map((x) => (x === 'true' ? true : x === 'false' ? false : x)); c[m[1]] = vs.length > 1 ? vs : vs[0]; }
      else c[p] = has;
    }
    return [c, pri];
  };
  const W = (key, spec) => {
    const rules = [];
    for (const k in spec) {
      const text = Array.isArray(spec[k]) ? spec[k] : [spec[k]];
      if (k === '_') { rules.push({ text }); continue; }
      const [c, pri] = cond(k);
      rules.push(pri ? { if: c, pri, text } : { if: c, text });
    }
    lines(key, rules);
  };

  // --- What each trade is, in a hobbit's words --------------------------------------
  const INFO = {
    farmer: { perk: 'eggs', one: 'sack of barley', good: 'grain', goods: 'sacks of barley', tool: 'hoe', pride: 'a field of barley all one height, nodding the same way', grumble: 'crows, and docks, and more crows', place: 'the barley fields', fix: 'farmer_weed' },
    herder: { perk: 'cheese', one: 'cheese', good: 'cheese', goods: 'cheeses', tool: 'crook', pride: 'a ewe that comes when she\'s called', grumble: 'mucking out in the rain', place: 'the pens', fix: 'herder_brush' },
    miller: { perk: 'flour', one: 'sack of flour', good: 'flour', goods: 'sacks of flour', tool: 'mill-pick', pride: 'flour as fine as a morning mist', grumble: 'the wheel sticking when the river\'s low', place: 'the mill', fix: 'miller_bag' },
    baker: { perk: 'bread', one: 'loaf', good: 'bread', goods: 'loaves', tool: 'peel', pride: 'a crust that sings when you tap it', grumble: 'getting up before the birds', place: 'the Bakehouse', fix: 'baker_knead' },
    brewer: { perk: 'ale', one: 'pint', good: 'ale', goods: 'barrels of ale', tool: 'mash paddle', pride: 'a pint with a head you could stand a spoon in', grumble: 'a batch gone sour for no reason at all', place: 'the brewhouse', fix: 'brewer_mash' },
    innkeeper: { perk: 'stew', one: 'bowl of stew', good: 'stew', goods: 'pots of stew', tool: 'ladle', pride: 'a full taproom all singing the same song', grumble: 'the washing up, which never ends', place: 'the inn', fix: 'innkeeper_sweep' },
    grower: { perk: 'leaf', one: 'pouch of leaf', good: 'leaf', goods: 'bundles of leaf', tool: 'leaf-knife', pride: 'leaf cured the color of an old penny', grumble: 'leaf-spot, and slugs, and slugs with leaf-spot', place: 'the leaf field', fix: 'grower_hoe' },
    fisher: { perk: 'fish', one: 'fish', good: 'fish', goods: 'fish', tool: 'rod', pride: 'a trout that fought me for the best part of an hour', grumble: 'days when nothing bites', place: 'the river', fix: 'fisher_bait' },
    woodwright: { perk: 'firewood', one: 'load of timber', good: 'wood', goods: 'loads of timber', tool: 'axe', pride: 'a round door that swings true and shuts soft', grumble: 'a blunt axe and a knotty log', place: 'the woods', fix: 'woodwright_sharpen' },
    herbalist: { perk: 'peppermint tea', one: 'remedy', good: 'remedy', goods: 'remedies', tool: 'pestle', pride: 'a fever broken by morning', grumble: 'folk who won\'t take their tonic', place: 'the herb beds', fix: 'herbalist_beds' },
    orchardist: { perk: 'honey', one: 'basket of apples', good: 'apple', goods: 'apples', tool: 'pruning hook', pride: 'a tree so heavy it needs propping', grumble: 'wasps in the windfalls', place: 'the orchard', fix: 'orchardist_prune' },
    postie: { perk: 'gossip', one: 'letter', good: null, goods: 'letters', tool: 'satchel', pride: 'every letter through the right door, first time', grumble: 'dogs, and folk who move house without telling me', place: 'the round', fix: 'postie_sort' },
    storyteller: { perk: 'biscuits', one: 'tale', good: null, goods: 'tales', tool: 'the old storybook', pride: 'a little one reading a whole page alone', grumble: 'fidgeting in the third row', place: 'the old oak', fix: 'read' },
    nanny: { perk: 'biscuits', one: 'lullaby', good: null, goods: 'naps', tool: 'a lullaby', pride: 'six little ones asleep at once', grumble: 'jam in places jam should never be', place: 'the nursery', fix: 'tea' },
    tinker: { perk: 'scrap', one: 'gadget', good: 'scrap', goods: 'bits of scrap', tool: 'soldering iron', pride: 'a lamp that runs on nothing but sunshine', grumble: 'rust, and hill-folk who poke the wires', place: 'the Relay', fix: 'work_relay' },
    lamplighter: { perk: 'lamp oil', one: 'lamp', good: null, goods: 'lamps', tool: 'pole', pride: 'the whole lane coming on one lamp at a time', grumble: 'wind that blows them out behind me', place: 'the lanes', fix: 'work_lamps' },
  };
  const label = (j) => (j && JOBS[j] ? JOBS[j].label.toLowerCase() : null);
  const jobOfLabel = (l) => Object.keys(JOBS).find((j) => label(j) === String(l).toLowerCase()) || null;
  const stintsOf = (v, j) => { let n = 0; for (const k in v.stats || {}) if (ACTIONS[k] && ACTIONS[k].job === j) n += v.stats[k] || 0; return n; };
  const memMatch = (v, re) => { for (const m of v.memories || []) { const x = m.t && m.t.match(re); if (x) return x; } return null; };

  addFacts((v, F) => {
    const j = v.job && JOBS[v.job] ? v.job : null, I = j ? INFO[j] : null;
    const sk = j ? JOBS[j].skill : null, lvl = sk ? (v.skills[sk] || 0) : 0;
    F.workSkill = sk ? hobbySkillWord(lvl) : null;
    F.workLevel = sk ? (lvl >= 75 ? 'master' : lvl >= 45 ? 'skilled' : lvl >= 20 ? 'handy' : 'new') : null;
    const n = j ? stintsOf(v, j) : 0;
    F.workStints = j ? n : null;
    // the founders have years behind them already; the young and the newly turned are new to it
    const yrs = typeof v.years === 'function' ? v.years() : 40;
    F.workYears = j ? (n >= 80 || v.stage === 'elder' ? 'long' : n >= 20 || (yrs >= 45 && !memMatch(v, /^(Became the village|Changed trade)/)) ? 'some' : 'new') : null;
    F.workTool = I ? I.tool : null; F.workPride = I ? I.pride : null; F.workGrumble = I ? I.grumble : null; F.workPlace = I ? I.place : null;
    const good = I ? I.good : null;
    F.workGood = good; F.workGoodWord = I ? I.goods : null; F.workGoodOne = I ? I.one : null; F.workPerk = I ? I.perk : null;
    // a dream of something other than mastering the trade they're in
    const dTrade = !!(j && v.dream && v.dream.k === 'master' && v.dream.s === sk);
    F.workDreamTrade = j ? dTrade : null;
    F.workDreamElse = v.dream && !dTrade && typeof dreamText === 'function' && DREAMS[v.dream.k] ? dreamText(v.dream).replace(/^./, (c) => c.toLowerCase()) : null;
    // which of two troubles of the trade they'd bring to the wizard, steady for a few days
    F.workTrouble = j ? `${j}.${Math.floor(hash2(v.id * 7 + Math.floor(Game.day / 5), 31) * 2)}` : null;
    const today = (Village.today && Village.today.made) || {}, yest = (Village.yesterday && Village.yesterday.used) || {};
    F.workMade = good ? Math.round(today[good] || 0) : null;
    const stock = good ? Math.floor(Village.stores[good] || 0) : null;
    F.workStock = stock;
    F.workShort = good ? stock < Math.max(4, (yest[good] || 0)) : null;
    F.workGlut = good && typeof storeCap === 'function' ? stock >= storeCap(good) * 0.85 : null;
    const mates = j ? Game.villagers.filter((o) => o !== v && o.job === j && !o.leaving) : [];
    F.workMates = mates.map((o) => o.first); F.workMate = mates[0] ? mates[0].first : null;
    F.workAlone = j ? !mates.length : null;
    F.workMateCount = mates.length;
    let short = null;
    try { if (j && typeof jobTargets === 'function') short = jobCounts()[j] < (jobTargets()[j] || 0); } catch (e) { short = null; }
    F.workShortHanded = short;
    const m = typeof masterOf === 'function' ? masterOf(v) : null;
    const mc = v.master && v.master.craft && String(v.master.craft).startsWith('skill:');
    F.workMaster = m && mc ? m.first : null;
    F.workMasterTrade = m && mc && m.job ? label(m.job) : null;
    const ap = typeof apprenticesOf === 'function' ? apprenticesOf(v).filter((o) => o.master && String(o.master.craft).startsWith('skill:'))[0] : null;
    F.workApprentice = ap ? ap.first : null;
    const riv = v.rival != null ? personById(v.rival) : null;
    const C = riv && typeof CONTESTS !== 'undefined' ? CONTESTS[v.rivalSkill || 'farming'] : null;
    F.workRival = riv && C ? riv.first : null;
    F.workRivalWhat = C ? C[0] : null; F.workRivalThing = C ? C[1] : null;
    F.workRivalLead = riv && C ? ((v.rivalScore || 0) > (riv.rivalScore || 0) ? 'ahead' : (v.rivalScore || 0) < (riv.rivalScore || 0) ? 'behind' : 'level') : null;
    const par = (v.parents || []).map(personById).filter((p) => p && p.job && JOBS[p.job]);
    F.workParentTrade = par[0] ? label(par[0].job) : null; F.workParentName = par[0] ? par[0].first : null;
    F.workFamilyTrade = j ? par.some((p) => p.job === j) : null;
    F.workWants = v.apprenticedTo && JOBS[v.apprenticedTo] ? label(v.apprenticedTo) : null;
    const ret = !j ? memMatch(v, /^Retired after years as an? (.+)\.$/) : null;
    F.workRetired = ret ? ret[1] : null;
    F.workRetiredJob = ret ? jobOfLabel(ret[1]) : null;
    const ch = memMatch(v, /^Changed trade: (.+) to (.+)\.$/);
    F.workFormer = ch && j && jobOfLabel(ch[2]) === j ? ch[1].toLowerCase() : null;
    const asked = memMatch(v, /^Was asked to leave the (.+)'s work/);
    F.workAsked = asked ? asked[1] : null;
    F.workPlayer = !!v.playerJob;
    F.workWeek = typeof policy === 'function' ? policy('week') : 'usual';
    F.workRations = typeof policy === 'function' ? policy('rations') : 'fair';
    F.workAle = typeof policy === 'function' ? policy('ale') : 'some';
    F.workDayName = typeof weekday === 'function' ? weekday(Game.day) : null;
    F.workRestDay = typeof isRestDay === 'function' ? isRestDay(Game.day) : false;
    F.workMarket = typeof isMarketDay === 'function' ? isMarketDay(Game.day) : false;
    const hz = typeof hazard === 'function' ? hazard() : null;
    F.workHazard = hz && hz.state === 'on' ? hz.k : null;
    F.workHazardSoon = hz && hz.state !== 'on' ? hz.k : null;
    F.workMasterpiece = v.masterpiece || null;
    F.workInn = typeof innName === 'function' ? innName() : 'the inn';
    F.workLittle = Game.villagers.filter((o) => typeof needsMinder === 'function' && needsMinder(o)).length;
    F.workPupils = Game.villagers.filter((o) => typeof kidBand === 'function' && ['young', 'school'].includes(kidBand(o))).length;
    F.workLetters = typeof mailbag === 'function' ? mailbag().length : 0;
    F.workLamps = World.lamps ? World.lamps.length : 0;
    F.workBuilds = Village.projects ? Village.projects.length : 0;
    F.workFix = I && ACTIONS[I.fix] ? I.fix : null;
  });

  // --- How's the work going? ----------------------------------------------------------
  addThread({
    id: 'work.day', label: (F) => ({ farmer: 'How are the fields?', herder: 'How are the animals?', miller: 'How\'s the mill turning?', baker: 'How\'s the Bakehouse?', brewer: 'How\'s the brewing?', innkeeper: 'How\'s the taproom?', fisher: 'How\'s the fishing?', postie: 'How\'s the round?', nanny: 'How are the little ones?', tinker: 'How\'s the tinkering?' }[F.job] || 'How\'s the work going?'),
    about: 'work', weight: 1.1, cool: 2,
    when: (F) => !!F.job && F.stage !== 'child',
    rel: (F) => (F.workShort || F.workShortHanded || F.workHazard ? 1.4 : 1.1),
    open: { ask: 'work.day.open' },
    beats: {
      start: { line: 'work.day.start', go: [
        { ap: 'ask', say: 'Who do you work alongside?', to: 'mates', need: { if: { workMate: has } } },
        { ap: 'ask', say: 'work.day.ask.pride', to: 'pride' },
        { ap: 'listen', say: 'Go on. Have a good grumble. I won\'t tell.', label: 'Let them grumble', to: 'grumble' },
        { ap: 'jest', say: 'work.day.jest', label: 'Tease them about the trade', to: 'tease' },
      ] },
      pride: { line: 'work.day.pride', fx: { learn: ['work.pride', '{Name} is proudest of {workPride}.'] }, go: [
        { ap: 'warm', say: 'You\'ve every right to be proud.', to: 'glow' },
        { ap: 'ask', say: 'Who taught you all that?', to: 'taught' },
        { ap: 'share', say: 'work.day.share', label: 'Tell them what you\'re proudest of', to: 'swap', need: { open: 1 }, soft: true },
      ] },
      grumble: { line: 'work.day.grumble', fx: { learn: ['work.grumble', '{Name} could do without {workGrumble}.'] }, go: [
        { ap: 'advise', say: 'Ask the Steward for another pair of hands.', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'hands'], need: { if: { workShortHanded: true } } },
        { ap: 'comfort', say: 'Every trade has its thorns. You bear yours well.', to: 'eased' },
        { ap: 'ask', say: 'Then why keep at it?', to: 'why' },
        { ap: 'jest', say: 'Shall I put a curse on it? I\'ve a nice one for crows.', to: 'laugh' },
      ] },
      tease: { line: 'work.day.tease', go: [
        { ap: 'jest', say: 'work.day.jest2', label: 'Keep it going', to: 'laugh' },
        { ap: 'warm', say: 'I\'m teasing. The valley would come to a stop without you.', to: 'glow' },
        { ap: 'ask', say: 'No, but truly. What\'s the best of it?', to: 'pride' },
      ] },
      mates: { line: 'work.day.mates', go: [
        { ap: 'ask', say: 'Do you two get on?', to: 'geton' },
        { ap: 'jest', say: 'And which of you does the actual work?', to: 'hardest' },
        { ap: 'ask', say: 'And the best of the work, for you?', to: 'pride' },
      ] },
      taught: { line: 'work.day.taught', go: [
        { ap: 'ask', say: 'And what would you tell a youngster starting out?', to: 'advice' },
        { ap: 'warm', say: 'They\'d be proud of you, I think.', to: 'glow' },
      ] },
      why: { line: 'work.day.why', go: [
        { ap: 'listen', say: '*You let that sit a moment, and say nothing.*', label: 'Say nothing, and wait', to: 'deep', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'That\'s as good a reason as any I\'ve heard.', to: 'glow' },
        { ap: 'jest', say: 'And here I thought it was the free {workPerk}.', to: 'laugh' },
      ] },
      deep: { line: 'work.day.deep', fx: { confide: { k: 'work.unseen', t: '{Name} sometimes wonders whether anyone would notice if the work stopped' }, open: 1 }, go: [
        { ap: 'warm', say: 'I would. The whole valley would, by teatime.', to: 'noticed' },
        { ap: 'advise', say: 'Then let them notice. Take an afternoon. See who comes asking.', to: 'dayoff' },
        { ap: 'share', say: 'A wizard wonders the same. Most of what I do, nobody sees.', to: 'sharedunseen' },
      ] },
      advice: { line: 'work.day.advice', fx: { note: 'Heard {name}\'s advice for anyone starting out as a {jobWord}.', respect: 0.01 }, go: [
        { ap: 'warm', say: 'I\'ll pass that on. Word for word.', to: 'end' },
        { ap: 'jest', say: 'I\'ll have it stitched on a cushion.', to: 'cushion' },
      ] },
      glow: { line: 'work.day.glow', fx: { fond: 0.02 }, end: true },
      eased: { line: 'work.day.eased', fx: { trust: 0.02, drive: { bored: -0.05 } }, end: true },
      laugh: { line: 'work.day.laugh', fx: { fond: 0.02 }, end: true },
      swap: { line: 'work.day.swap', fx: { trust: 0.03 }, go: [
        { ap: 'jest', say: 'It was a very good smoke-ring.', to: 'end' },
        { ap: 'warm', say: 'Yours is the finer thing, mind.', to: 'glow' },
      ] },
      hands: { line: 'work.day.hands', fx: { respect: 0.03 }, end: true },
      bristle: { line: 'work.day.bristle', fx: { fond: -0.02, sore: { days: 1 } }, end: true },
      geton: { line: 'work.day.geton', end: true },
      hardest: { line: 'work.day.hardest', fx: { fond: 0.01 }, end: true },
      noticed: { line: 'work.day.noticed', fx: { trust: 0.04, fond: 0.02, feel: 'drawn_out' }, end: true },
      dayoff: { line: 'work.day.dayoff', fx: { respect: 0.02, drive: { tired: -0.05 }, queue: 'smoke' }, end: true },
      sharedunseen: { line: 'work.day.sharedunseen', fx: { trust: 0.05, joke: { k: 'work.unseen', t: 'Nobody sees what a wizard does. Or a {jobWord}.' } }, end: true },
      cushion: { line: 'work.day.cushion', fx: { joke: { k: 'work.cushion', t: 'The wizard wants {name}\'s advice stitched on a cushion.' } }, end: true },
    },
    end: { fond: 0.01, trust: 0.01 },
  });

  W('work.day.open', {
    _: ['How\'s the work going, {name}?', 'Busy day, {name}?', 'And how\'s the trade treating you, {name}?'],
    'job=farmer': ['How are the fields, {name}? Growing?', 'Barley behaving itself, {name}?'],
    'job=herder': ['How are the beasts today, {name}?', 'All the sheep present and correct, {name}?'],
    'job=miller': ['Is the old wheel turning, {name}?', 'Grinding away, {name}?'],
    'job=baker': ['Something smells wonderful, {name}. Is that you?', 'Busy in the Bakehouse, {name}?'],
    'job=brewer': ['How\'s the brewing, {name}? Anything bubbling?', 'Is there a good batch on, {name}?'],
    'job=innkeeper': ['How\'s life behind the bar, {name}?', 'Run off your feet, {name}?'],
    'job=grower': ['How\'s the leaf coming on, {name}?', 'A good year for the leaf, {name}?'],
    'job=fisher': ['Anything biting, {name}?', 'How\'s the river treating you, {name}?'],
    'job=woodwright': ['Felled anything large today, {name}?', 'How\'s the timber, {name}?'],
    'job=herbalist': ['Anyone poorly, {name}? Or are we all well?', 'What\'s in the mortar today, {name}?'],
    'job=orchardist': ['How are the trees, {name}?', 'Bees in a good mood, {name}?'],
    'job=postie': ['Much in the bag today, {name}?', 'How\'s the round, {name}? Any dogs?'],
    'job=storyteller': ['How are your little scholars, {name}?', 'Any good tales this week, {name}?'],
    'job=nanny': ['How are the little ones, {name}? All in one piece?', 'Have you had a moment\'s peace today, {name}?'],
    'job=tinker': ['How\'s the tinkering, {name}? Anything sparking?', 'Is the Relay humming, {name}?'],
    'job=lamplighter': ['How are the lamps, {name}?', 'All lit last night, {name}?'],
  });
  W('work.day.ask.pride', {
    _: ['And what\'s the best of it?', 'What do you like best about it?'],
    'job=baker': ['And what\'s the best loaf you ever made?'],
    'job=farmer': ['And what\'s the best of farming, for you?'],
    'job=innkeeper': ['And the best of keeping the inn?'],
    'job=fisher': ['And the best catch you ever had?'],
    'job=woodwright': ['And the best thing you ever built?'],
  });
  W('work.day.jest', {
    _: ['Do you ever do any work, or just look busy when I pass?', 'I hear the {jobWord}\'s work is mostly sitting down.'],
    'job=baker': ['Do you ever eat the evidence?', 'I suppose you test every loaf. Thoroughly.'],
    'job=brewer': ['I suppose you have to taste every barrel. For safety.', 'A hard life, tasting ale for a living.'],
    'job=innkeeper': ['Do you charge extra for the singing?', 'I hear the stew has its own opinions.'],
    'job=fisher': ['I hear the fish have started a petition against you.', 'Is it fishing, or sitting by a river with a stick?'],
    'job=farmer': ['Do you talk to the barley? It looks like it\'s listening.', 'Does the scarecrow get paid?'],
    'job=miller': ['Is it true millers just watch a wheel go round all day?'],
    'job=postie': ['Read any good letters lately?', 'I hear you know everyone\'s business by the weight of the envelope.'],
    'job=herder': ['Do the sheep know your name yet? Mine never learn.', 'Have you ever lost one and counted yourself instead?'],
    'job=nanny': ['How many have you lost today? Only joking. Mostly.', 'Do you get paid by the nap?'],
    'job=tinker': ['Have you set fire to anything this week?', 'Is it meant to spark like that?'],
    'job=lamplighter': ['A whole trade for lighting lamps? I do it with a word.', 'Do you ever light one just to see it go?'],
    'job=woodwright': ['How many trees have you apologized to today?'],
    'job=herbalist': ['Do you ever just give folk a cup of tea and call it a cure?'],
    'job=storyteller': ['Do you make them up as you go? I always do.'],
    'job=grower': ['Do you smoke the profits?', 'I suppose you have to try every bundle. To be sure.'],
    'job=orchardist': ['Do the bees pay rent?', 'How many apples fall on your head in a day?'],
  });
  W('work.day.jest2', {
    _: ['And I suppose the {workTool} does most of it.', 'Next you\'ll tell me it\'s a calling.'],
    'job=baker': ['Every loaf? Even the burnt ones?'],
    'job=brewer': ['And the barrels you test twice?'],
    'job=fisher': ['The fish say you cheat. Worms, they say. Every time.'],
  });

  W('work.day.start', {
    _: ['Oh, it goes along. Some days better than others.', 'Busy! But the good kind of busy.', 'It\'s work. It gets done. Mostly by me.'],
    cheerful: ['Lovely, thank you! I do like a day with something to show for it.', 'Grand! Everything\'s gone right so far. Touch wood.'],
    ornery: ['It\'d go a deal better without folk stopping me to ask how it\'s going.', 'Work\'s work. Same as yesterday. Same as tomorrow.'],
    shy: ['...It\'s going all right, thank you. Nobody\'s complained.', 'Oh. It\'s fine. Quiet. I like it quiet.'],
    curious: ['Interesting, actually! I tried something new this morning. It nearly worked.', 'Better than yesterday. I\'ve worked out why things kept going wrong.'],
    dreamy: ['I lost an hour this morning just watching the light. Then I worked twice as fast.', 'Oh, it hums along. My hands do the work and my head goes walking.'],
    witty: ['Splendidly, if you don\'t look too closely.', 'Very well. I\'ve made at least two fewer mistakes than yesterday.'],
    proud: ['Very well indeed. Nobody in the valley does it better, though I say it myself.', 'As well as ever. Which is to say, properly.'],
    gloomy: ['It\'ll all need doing again tomorrow. That\'s the trouble with work.', 'Oh, it goes. It always goes. That\'s all you can say for it.'],
    'workMade>3 workGoodWord ^-1': ['{WorkMade} {workGoodWord} into the Store today, between us. Not bad, eh?', 'We\'ve got {workMade} {workGoodWord} in already today. Somebody\'s been busy.'],
    'workShort': ['Behind, if I\'m honest. The Store\'s low on what I make and I can\'t keep up.', 'Running to stand still. Everyone wants what I haven\'t got yet.'],
    'workGlut ^1': ['Too well, if anything! The Store\'s bursting with it. Nobody can eat that much.', 'We\'ve more than we know what to do with. The shelves are groaning.'],
    'workShortHanded workAlone ^1': ['It\'s just me, and it wants three. You do the sum.', 'On my own, still. The work doesn\'t care how many hands there are.'],
    'workRestDay ^1': ['It\'s Highday! I\'m not meant to be working at all. Don\'t tell anyone.', 'A day of rest, they say. The work never heard of it.'],
    'workWeek=busy ^1': ['No day off this week, by the Steward\'s order. I\'m running on porridge and spite.', 'A busy week, they call it. I call it a long one.'],
    'tired ^1': ['Tired. I\'ve been at it since before the cock was up.', 'Dead on my feet, but it\'s getting done.'],
    'weather=rain job=farmer|herder|fisher|woodwright|orchardist|grower|mail carrier|lamplighter': ['Wet! Everything\'s wet. My boots are wet inside my boots.', 'Rain down the back of my neck since breakfast. It\'s a living.'],
    'weather=snow job=farmer|herder|fisher|woodwright|orchardist|grower|mail carrier|lamplighter': ['Cold enough to freeze the words in your mouth. But it\'s done.', 'Snow. Everything takes twice as long and half as well.'],
    'job=farmer': ['The barley\'s coming on. Slowly. Barley does everything slowly.', 'Up and down the rows all morning. My back thinks it\'s ninety.'],
    'job=farmer season=spring': ['Sowing! Seed by seed. My fingers know the count better than my head.', 'Spring\'s the hopeful time. Everything\'s green and nothing\'s gone wrong yet.'],
    'job=farmer season=summer': ['Hoeing and watering. Watering and hoeing. The barley drinks like a brewer.', 'Weeding, mostly. The docks grow faster than I can pull them.'],
    'job=farmer season=autumn': ['Harvest! Every hand to the sheaves. I\'ll sleep in winter.', 'Bringing it in. Good barley this year, heavy in the ear.'],
    'job=farmer season=winter': ['Winter\'s for mending. Fences, tools, my temper.', 'Not much grows. I see to the hens and look at the fields and worry.'],
    'job=herder': ['The cows are content, the pigs are muddy and the sheep are plotting.', 'Milked, fed, mucked out. And it\'s only morning, as far as the cows know.'],
    'job=herder season=spring': ['Lambing! I\'ve not slept in my own bed for a week.', 'Lambs everywhere. Bouncing. I\'ve never been so tired or so happy.'],
    'job=herder season=summer': ['Shearing time. The sheep are furious and I\'m covered in fluff.'],
    'job=herder season=winter': ['Hay and water and more hay. The beasts eat like hobbits in winter.'],
    'job=miller': ['The wheel turns, the stones grind, and I sneeze. Same as ever.', 'Flour in my hair, flour in my ears. It\'s going well, then.'],
    'job=miller season=autumn': ['Harvest barley coming in by the cartload. The stones haven\'t stopped.'],
    'job=miller season=summer': ['The river\'s low and the wheel\'s lazy. I know how it feels.'],
    'job=baker': ['The first batch was out before sunrise. The second\'s proving now.', 'Kneading, shaping, baking, and burning my wrist on the oven door.'],
    'job=baker season=winter': ['The Bakehouse is the warmest place in the valley. Folk find excuses to visit.'],
    'job=baker season=autumn': ['Apple pies! Apples everywhere. I dream of pastry.'],
    'job=brewer': ['There\'s a batch in the mash and one in the cask, and I\'m somewhere in between.', 'The vats are bubbling nicely. Smells like a good one.'],
    'job=brewer season=autumn': ['New barley for malting. This is the best smell in the world. Don\'t argue.'],
    'job=brewer season=summer': ['Keeping the casks cool is half the battle in summer.'],
    'job=innkeeper': ['Fire lit, floor swept, stew on. Now I wait for the thirsty.', 'Busy! Every table wants something and none of them want the same.'],
    'job=innkeeper hour=evening|night': ['Full house tonight. Somebody\'s going to start singing any minute.'],
    'job=innkeeper hour=morning': ['Mornings are for sweeping up last night. There\'s always a surprise under a table.'],
    'job=grower': ['The leaf\'s growing tall and green. Too green, yet. It wants the sun.', 'Hoeing the rows and picking the lower leaves. Slow work. Fragrant work.'],
    'job=grower season=autumn': ['The drying shed\'s full. The whole place smells like a pipe by the fire.'],
    'job=grower season=winter': ['Nothing to pick. I sort the cured leaf and count the days till spring.'],
    'job=fisher': ['They\'re biting today. Not at me, at the worms. Better that way.', 'The river\'s generous today. I\'ve learned not to say so too loud.'],
    'job=fisher season=winter': ['Cold fingers, slow fish. But a fish in winter is worth three in summer.'],
    'job=fisher weather=rain': ['Rain\'s good for fishing. Bad for fishers. Good for fishing.'],
    'job=woodwright': ['Felled one, lopped it, sawed it. My arms are mostly sawdust now.', 'The woodpile\'s growing and so are my shoulders.'],
    'job=woodwright workBuilds>1': ['There\'s building on, so it\'s timber, timber, timber. And then more timber.'],
    'job=woodwright season=winter': ['Every hearth wants feeding in winter. I can\'t cut it fast enough.'],
    'job=herbalist': ['The feverfew\'s up and the comfrey\'s spreading. A good week for the beds.', 'I\'ve been grinding all morning. My kitchen smells like a hedgerow.'],
    'job=herbalist season=winter': ['Coughs and sniffles. Every door I knock on, someone sneezes at me.'],
    'job=herbalist sick': ['The herbalist, poorly! Don\'t say it. I know.'],
    'job=orchardist': ['The trees are heavy and the bees are busy. I\'m somewhere in the middle.', 'Pruning, picking, and talking to the hives. They like to be told the news.'],
    'job=orchardist season=spring': ['Blossom! The whole orchard\'s pink. Pray for no frost.'],
    'job=orchardist season=autumn': ['Apples by the basket. My arms are longer than they were in summer.'],
    'job=postie': ['Bag\'s heavy, feet are sore, and nobody\'s dog has bitten me today. A good day.', 'Up the lane, down the lane, and a word at every door.'],
    'job=mail carrier workLetters>5': ['{WorkLetters} letters still in the bag! Hobbits will write to anyone.'],
    'job=mail carrier workLetters<0': ['Empty bag! Nobody\'s written a word all day. Are they cross with each other?'],
    'job=storyteller': ['The little ones did their letters beautifully this morning. Well. Most of them.', 'We did sums with acorns. Half the acorns were eaten.'],
    'job=nanny': ['Nobody\'s cried for nearly an hour. I\'m almost suspicious.', 'Two naps, one tumble, a song, and a lot of jam.'],
    'job=nanny workLittle>5': ['{WorkLittle} little ones under my feet today. I count them twice an hour.'],
    'job=tinker': ['Rewired the lamp at the end of the lane. Only two sparks. Three.', 'The Relay\'s holding signal. I\'d like to see it hold all week.'],
    'job=tinker rift': ['Running hot, but stable. Salvaged good scrap from the last rift. Real alloy.', 'Patched the Relay with hill-folk wire and hope. It\'s holding.'],
    'job=lamplighter': ['I\'ll be off round the lamps before long. I like that hour.', 'Out at dawn to douse, out at dusk to light. In between I sleep.'],
    'job=lamplighter hour=evening': ['Can\'t stop long. The light\'s going and the lamps won\'t light themselves.'],
    'job=lamplighter workLamps>12': ['{WorkLamps} lamps, and I know every one by its flicker.'],
  });
  W('work.day.pride', {
    _: ['{WorkPride}. There\'s nothing to touch it.', 'Honestly? {WorkPride}. Every time.', 'When it comes right. {WorkPride}. That\'s the best of it.'],
    cheerful: ['Oh, {workPride}! It makes me laugh out loud every time.'],
    ornery: ['{WorkPride}. And nobody ever says thank you, mind.'],
    shy: ['...{WorkPride}. I don\'t tell anyone. I just stand and look at it.'],
    curious: ['{WorkPride}. And working out why it came right, so it comes right again.'],
    dreamy: ['{WorkPride}. Like the world agreed with me for a moment.'],
    witty: ['{WorkPride}. Rarer than you\'d think, so I make a fuss of it.'],
    proud: ['{WorkPride}, and mine are the best in the valley. You can ask anyone.', 'Doing it properly. {WorkPride}. Others manage it now and then.'],
    gloomy: ['{WorkPride}. It doesn\'t last, of course. Nothing does. But for a moment.'],
    'workLevel=master ^1': ['After all these years? {WorkPride}, still. I\'ve never tired of it.'],
    'workLevel=new ^1': ['I\'m new to it, but when I manage {workPride}, I could sing.'],
    'job=baker': ['Folk lining up at the Bakehouse door before it\'s light. That\'s the best of it.'],
    'job=farmer': ['Bringing the last sheaf in, and the whole village there to see it.'],
    'job=innkeeper': ['When a stranger walks in cold and walks out singing. That\'s mine, that.'],
    'job=nanny': ['When a little one I minded comes back grown and says hello. Every time.'],
    'job=postie': ['A letter from far off for someone who\'d given up waiting. Their face.'],
    'job=storyteller': ['A little one who couldn\'t read in spring reading to me by autumn.'],
    'workMasterpiece ^2': ['{WorkMasterpiece}. You\'ve seen it? Folk still come to look.'],
  });
  W('work.day.share', {
    _: ['I once blew a smoke-ring shaped like a ship. It took me ninety years.', 'The best thing I ever made was a firework that spelled a name. Nobody\'s name. I got it wrong.'],
    'job=baker|miller|innkeeper': ['I once baked a cake. It\'s still in a cupboard in Bree. Nobody dares open it.'],
    'job=fisher': ['I caught a fish once. A very small one. I let it go and it never thanked me.'],
  });
  W('work.day.swap', {
    _: ['A ship! Out of smoke! Now you\'re showing off.', 'Ha! And I thought my work was hard.', 'Ninety years? You\'d have been quicker at the {jobWord}\'s trade.'],
    cheerful: ['Oh, I\'d have loved to see that! You must do it again.'],
    ornery: ['Smoke. You\'re proud of smoke. Well, we all have our trades.'],
    shy: ['...That\'s lovely. I didn\'t think wizards made things.'],
    witty: ['A ship of smoke. Sails away the minute you finish it. Very wizardly.'],
    proud: ['Hm. Impressive, I suppose. For smoke.'],
    gloomy: ['And then it blew away. They always do.'],
    'job=baker|miller|innkeeper': ['A cake in a cupboard in Bree? I\'d like to see that. From a distance.'],
  });
  W('work.day.grumble', {
    _: ['{WorkGrumble}. Don\'t get me started on {workGrumble}.', 'Oh, {workGrumble}. Every blessed day.', 'If I never saw {workGrumble} again I\'d be a happier hobbit.'],
    cheerful: ['Well. {WorkGrumble}, I suppose. But I mustn\'t grumble. Oh, you said I could. Then: {workGrumble}!'],
    ornery: ['Where do I start? {WorkGrumble}. And folk asking how the work\'s going.', '{WorkGrumble}! And nobody listens when I say so.'],
    shy: ['...{WorkGrumble}, I suppose. I don\'t like to complain.'],
    curious: ['{WorkGrumble}. I keep thinking there\'s a cleverer way round it. I haven\'t found it.'],
    dreamy: ['{WorkGrumble}. It spoils the quiet of the thing.'],
    witty: ['{WorkGrumble}. I\'m drafting a strongly worded letter to it.'],
    proud: ['{WorkGrumble}. Not that it gets the better of me. It doesn\'t.'],
    gloomy: ['{WorkGrumble}. And then more of it. And then it\'s winter.'],
    'workShortHanded': ['Too few hands. There should be more of us and there aren\'t. That\'s the grumble.'],
    'workWeek=busy': ['No day of rest! The Steward wants a busy week. My knees want a word with the Steward.'],
    'workRations=lean': ['Lean rations and a full day\'s work. You can\'t knead on half a breakfast.'],
    'tired': ['I\'m that tired I\'d grumble at a feather bed.'],
  });
  W('work.day.tease', {
    _: ['Cheek! I\'ll have you know it\'s skilled work.', 'Ha! Come and try it, wizard. Bring your own hat.'],
    cheerful: ['Ha! Well, maybe now and then. Only the good ones.'],
    ornery: ['Oh, very droll. Wizards. Never done a day\'s work in their lives.', 'You try it. See how funny it is at dawn.'],
    shy: ['Oh. Ha. ...No, I don\'t. Well. Sometimes.'],
    curious: ['Do I? Hm. I should keep count, now you mention it.'],
    dreamy: ['Only when nobody\'s looking. The best things happen then.'],
    witty: ['Only when it\'s my turn to be the evidence.', 'Ha! I\'ll get you back for that. When you least expect it.'],
    proud: ['I\'ll have you know I\'m very well thought of in my trade.'],
    gloomy: ['Mm. I\'ve heard that one before. Several times. From you, mostly.'],
    'job=baker': ['Only the burnt ones. For the good of the village.', 'Every hundredth loaf. It\'s a tax.'],
    'job=brewer': ['Every barrel. Twice. A brewer who doesn\'t taste is a brewer who poisons people.'],
    'job=fisher': ['The fish have a petition, have they? Well, I\'ve a net.'],
    'job=innkeeper': ['Singing\'s free. Stopping them singing costs extra.'],
    'job=nanny': ['Lost one? I\'ll have you know I\'ve only mislaid a child twice. Under a table, both times.'],
    'job=tinker': ['Fire? Only small ones. Controlled. Mostly controlled.'],
  });
  W('work.day.laugh', {
    _: ['Ha! You\'re a rogue, wizard.', 'Ha! Away with you. Some of us have work to do.', '*laughs despite themselves*'],
    ornery: ['Hmph. ...All right, that one was funny.'],
    shy: ['*giggles, and goes pink*'],
    witty: ['Ha! I\'m stealing that. I\'ll say it at the Badger as if it were mine.'],
    gloomy: ['Ha. ...Ha. Don\'t tell anyone I laughed.'],
    proud: ['Ha! Well. Very good. But I meant what I said.'],
  });
  W('work.day.mates', {
    _: ['{WorkMate}, mostly. We\'ve got a way of working, now.', 'There\'s {workMates}. We muddle along.'],
    cheerful: ['{WorkMate}! Best workmate in the valley. We sing.'],
    ornery: ['{WorkMate}. Who does things the wrong way, but gets there.'],
    shy: ['{WorkMate}. We don\'t talk much. We don\'t need to.'],
    witty: ['{WorkMate}. I do the work and {workMate} does the talking about it.'],
    proud: ['{WorkMate}. I\'ve taught {workMate} a good deal, I\'ll say that.'],
    gloomy: ['{WorkMate}. We moan together. It\'s companionable.'],
    'workMateCount>2': ['A whole crew. {WorkMates}. Like a family, with the arguments.'],
    'workRival': ['There\'s {workMate}. And then there\'s {workRival}, who I don\'t talk about.'],
  });
  W('work.day.geton', {
    _: ['Mostly. You can\'t work shoulder to shoulder and not get on. Or you can, but it\'s a long day.', 'We do. Some days better than others.'],
    cheerful: ['Like peas and gravy!'],
    ornery: ['When {workMate} does it my way. Which is the right way.'],
    shy: ['...I think so. I hope so.'],
    witty: ['We\'ve agreed to disagree about everything. It works beautifully.'],
    gloomy: ['We get by. Everyone gets by.'],
  });
  W('work.day.hardest', {
    _: ['Me! Obviously. ...Don\'t ask {workMate}.', 'Ha! Depends who you ask. Ask me.'],
    witty: ['Whoever\'s being watched at the time.'],
    proud: ['Me. Next question.'],
    shy: ['{WorkMate}, really. I just help.'],
  });
  W('work.day.taught', {
    _: ['I picked it up. Watched, got it wrong, got it less wrong.', 'Nobody, really. The work taught me. It\'s a strict teacher.'],
    'workFamilyTrade ^1': ['{WorkParentName} taught me. Same trade, same hands. I still hear the telling-off.', '{WorkParentName} did. I\'ve got the old {workTool} still.'],
    'workMaster ^2': ['{WorkMaster}\'s teaching me now. Patient as a stone, mostly.', 'I\'m still learning. {WorkMaster} has me as an apprentice.'],
    'workFormer ^1': ['I was a {workFormer} first, so I came to it sideways. Taught myself.'],
    'workPlayer ^1': ['The Steward put me to it, and I learned on the job. Fast.'],
    proud: ['I taught myself, and I taught myself properly.'],
    shy: ['...I watched. From the back. For years, nearly.'],
    curious: ['Everyone! I asked questions till they gave in.'],
    dreamy: ['I think I always knew how. I just had to remember.'],
    gloomy: ['Mistakes. Lots of mistakes. They\'re very good teachers.'],
  });
  W('work.day.advice', {
    _: ['Get up early, keep your {workTool} clean, and don\'t argue with the weather.', 'Go slow till you\'re good. Then go slow anyway.'],
    cheerful: ['Whistle while you work. It frightens off bad luck.'],
    ornery: ['Listen more than you talk. Most of them don\'t.'],
    shy: ['...Don\'t be afraid to get it wrong. I was. It didn\'t help.'],
    curious: ['Ask why. Every time. Even when they sigh at you.'],
    dreamy: ['Love the thing a little. It knows.'],
    witty: ['Find out who does it best and stand very close to them.'],
    proud: ['Do it properly or don\'t do it. There\'s no half a loaf.'],
    gloomy: ['Expect the worst. Then you\'re pleasantly surprised twice a year.'],
    'job=baker': ['Never open the oven to look. The bread can hear you worrying.'],
    'job=farmer': ['Watch the sky before you watch the soil.'],
    'job=fisher': ['Be patient. Then be more patient. Then go home and try tomorrow.'],
    'job=innkeeper': ['Remember everyone\'s usual. It costs nothing and they never forget it.'],
    'job=woodwright': ['Measure twice. Cut once. Apologize to the tree.'],
    'job=herbalist': ['Taste nothing you can\'t name.'],
    'job=brewer': ['Clean the vats like your life depends on it. Your ale does.'],
    'job=postie': ['Learn the dogs\' names first. Then the folk.'],
    'job=nanny': ['Count them. Then count them again.'],
  });
  W('work.day.why', {
    _: ['Because it needs doing, and I\'m the one who does it.', 'Because I\'d miss it. Daft, isn\'t it?'],
    cheerful: ['Because I love it, mostly! Even the grumbly parts.'],
    ornery: ['Because if I didn\'t, who would? Exactly.'],
    shy: ['...Because it\'s mine. I don\'t have much that\'s mine.'],
    curious: ['Because I haven\'t got to the bottom of it yet.'],
    dreamy: ['Because some mornings it\'s beautiful, and I\'d hate to miss one.'],
    witty: ['Habit, stubbornness and a weakness for {workPerk}.'],
    proud: ['Because nobody else would do it as well.'],
    gloomy: ['What else would I do? Sit and fret? I can fret while I work.'],
    'workFamilyTrade': ['It\'s the family trade. {WorkParentName} did it. It\'s in the hands.'],
    'workYears=long ^1': ['I\'ve done it so long I\'d not know who I was without it.'],
  });
  W('work.day.deep', {
    _: ['...Some mornings I wonder if anyone would notice if I stopped. Isn\'t that silly?', 'You know, I sometimes think the work would go on without me and nobody\'d blink.'],
    ornery: ['...Nobody says thank you. Not once. You\'d think it grew on trees.'],
    shy: ['...Nobody ever sees it done. They just see it there. Like it made itself.'],
    proud: ['...I do it well. I know I do. I\'d just like someone else to say so, once.'],
    gloomy: ['...I sometimes think I could vanish and the {workGoodWord} would still turn up somehow.'],
    dreamy: ['...I wonder if it matters. Not the work. Me, doing it.'],
    'workAlone': ['...It\'s just me at it. If I stopped, it\'d stop. And I don\'t know if anyone would mind.'],
  });
  W('work.day.noticed', {
    _: ['...Would they? Well. Thank you. That\'s nice to hear.', 'By teatime! Ha. ...Thank you, wizard.'],
    ornery: ['Hmph. ...Well. That\'s something, I suppose. Thank you.'],
    shy: ['*looks at their feet, smiling*'],
    proud: ['Of course they would. ...But it\'s good to hear it said.'],
    gloomy: ['...You might be right. I\'ll try to believe it till Mersday.'],
  });
  W('work.day.dayoff', {
    _: ['An afternoon off? ...Do you know, I might. A pipe on the step.', 'Ha! You\'re a bad influence. ...I\'ll think about it. I\'m thinking about it now.'],
    ornery: ['And let it all pile up? ...Oh, all right. One pipe.'],
    proud: ['I don\'t need to be missed to know my worth. ...But a pipe wouldn\'t hurt.'],
    cheerful: ['Ooh! Wicked wizard. Yes. Yes, I will.'],
  });
  W('work.day.sharedunseen', {
    _: ['You too? ...Huh. Then we\'re a pair of us.', 'I never thought of that. The wizard and the {jobWord}, unseen together.'],
    witty: ['Then let\'s form a club. We\'ll meet in secret. Nobody will notice.'],
    shy: ['...That makes me feel less alone, somehow.'],
  });
  W('work.day.glow', {
    _: ['Ah, get on with you. ...Thank you.', 'That\'s kind. I\'ll tell the {workTool}.'],
    cheerful: ['Oh, you\'ve made my day! I\'ll be smiling at it all afternoon.'],
    ornery: ['Hm. Well. Somebody has to say it, I suppose.'],
    shy: ['*goes pink* ...Thank you.'],
    proud: ['I know. But thank you for noticing.'],
    gloomy: ['...That\'s cheered me more than I\'ll say.'],
    witty: ['Flattery will get you a discount. Nothing more. A small discount.'],
  });
  W('work.day.eased', {
    _: ['I suppose they do. Thank you.', 'Thorns. Ha. Yes. And roses, sometimes.'],
    ornery: ['Hmph. Thorns. That\'s about the size of it.'],
    shy: ['...That helps. Thank you.'],
    gloomy: ['Thorns. Yes. That\'s exactly it.'],
  });
  W('work.day.hands', {
    _: ['Hm. Maybe I will. A word at the Steward\'s Desk.', 'You think they\'d listen? ...All right. I\'ll ask.'],
    shy: ['...Could you ask for me? No. I\'ll ask. I will.'],
    cheerful: ['Yes! Why didn\'t I think of that? Two pairs of hands, four pies.'],
  });
  W('work.day.bristle', {
    _: ['I can manage my own trade, thank you, wizard.', 'More hands? I don\'t need help. I need fewer questions.'],
    proud: ['I\'ll not go begging the Steward for help. I can manage.'],
    ornery: ['Oh, aye. And who asked you?'],
  });
  W('work.day.cushion', {
    _: ['Ha! A cushion. Put a {workTool} on it.', 'You do that. I\'ll sit on it.'],
    witty: ['Embroidered in gold, please. And my name in large letters.'],
  });

  // --- How did you come to the trade? -------------------------------------------------
  addThread({
    id: 'work.how', label: (F) => (F.jobWord ? `How did you come to be ${/^[aeiou]/.test(F.jobWord) ? 'an' : 'a'} ${F.jobWord}?` : 'How they came to their trade'), about: 'work', weight: 0.9, cool: 6, reveals: 'work.how',
    when: (F) => !!F.job && F.stage !== 'child',
    rel: (F) => (F.workFamilyTrade || F.workFormer || F.workPlayer || F.workMaster ? 1.3 : 0.9),
    open: { ask: 'work.how.open' },
    beats: {
      start: { line: 'work.how.start', fx: { learn: ['work.how', '{Name} came to the {jobWord}\'s trade {workHowText}.'] }, go: [
        { ap: 'ask', say: 'Did you ever want to do anything else?', to: 'else' },
        { ap: 'warm', say: 'And are you glad of it, now?', to: 'glad' },
        { ap: 'jest', say: 'work.how.jest', label: 'Tease them about it', to: 'free' },
      ] },
      else: { line: 'work.how.else', go: [
        { ap: 'ask', say: 'Is it too late for that?', to: 'late', need: { open: 1 }, soft: true },
        { ap: 'comfort', say: 'The road not taken always looks greener.', to: 'greener' },
        { ap: 'ask', say: 'And the first day at the trade? What was that like?', to: 'first' },
      ] },
      glad: { line: 'work.how.glad', go: [
        { ap: 'ask', say: 'What\'s the day you remember best?', to: 'first' },
        { ap: 'listen', say: '*You nod, and let them go on.*', label: 'Let them go on', to: 'more' },
      ] },
      free: { line: 'work.how.free', go: [
        { ap: 'jest', say: 'I knew it. It\'s always the perks.', to: 'end' },
        { ap: 'ask', say: 'No, truly. How did it start?', to: 'first' },
      ] },
      first: { line: 'work.how.first', go: [
        { ap: 'jest', say: 'And did it survive?', to: 'survive' },
        { ap: 'warm', say: 'We all start somewhere. Look at you now.', to: 'now' },
        { ap: 'tale', say: 'My first spell set fire to my teacher\'s beard. He grew it back.', to: 'beard', need: { open: 1 } },
      ] },
      more: { line: 'work.how.more', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'Thank you for telling me.', to: 'end' },
        { ap: 'ask', say: 'Would you want a child of yours to do it?', to: 'kids' },
      ] },
      late: { line: 'work.how.late', fx: { confide: { k: 'work.else', t: '{Name} once meant to be something other than a {jobWord}' } }, go: [
        { ap: 'advise', say: 'Then do a little of it. An evening a week. Nobody need know.', to: 'evening' },
        { ap: 'warm', say: 'There\'s still time. There\'s always a little time.', to: 'time' },
      ] },
      greener: { line: 'work.how.greener', end: true },
      survive: { line: 'work.how.survive', fx: { fond: 0.02 }, end: true },
      now: { line: 'work.how.now', fx: { fond: 0.02 }, end: true },
      beard: { line: 'work.how.beard', fx: { joke: { k: 'work.beard', t: 'The wizard\'s first spell set fire to his teacher\'s beard.' }, fond: 0.02 }, end: true },
      kids: { line: 'work.how.kids', end: true },
      evening: { line: 'work.how.evening', fx: { respect: 0.03, promise: { k: 'work.else', t: 'You said {name} should keep a little of the old dream going', days: 7 } }, end: true },
      time: { line: 'work.how.time', fx: { trust: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  addFacts((v, F) => {
    F.workHowText = !F.job ? null : F.workMaster ? `as ${F.workMaster}'s apprentice` : F.workFamilyTrade ? `from ${F.workParentName}, as the family trade` : F.workPlayer ? 'because the Steward asked' : F.workFormer ? `after starting out as a ${F.workFormer}` : F.workAsked ? 'when the Steward moved folk about' : 'when the village needed one';
  });
  W('work.how.open', {
    _: ['How did you come to be a {jobWord}, {name}?', 'Was it always the {jobWord}\'s trade for you, {name}?'],
    'job=innkeeper|orchardist': ['How does a hobbit come to be the {jobWord}, {name}?'],
  });
  W('work.how.jest', {
    _: ['I expect it was the free {workPerk}.', 'Lost a bet, did you?', 'Somebody had to, and you blinked first?'],
  });
  W('work.how.start', {
    _: ['The village needed one, and I didn\'t say no fast enough.', 'Oh, it just happened. One day I was helping, the next it was mine.'],
    cheerful: ['I fell into it! Best fall I ever had.'],
    ornery: ['Somebody had to do it properly. Nobody else was.'],
    shy: ['...They asked, and I didn\'t know how to say no. I\'m glad I didn\'t.'],
    curious: ['I kept asking how it was done until they handed me the {workTool}.'],
    dreamy: ['It felt like it was waiting for me. Isn\'t that odd?'],
    witty: ['I was standing nearest when the last one retired.'],
    proud: ['I was the obvious choice. Everyone said so. Eventually.'],
    gloomy: ['Nobody else wanted it. That\'s how most things go.'],
    'workFamilyTrade ^1': ['{WorkParentName} was a {jobWord}, so I was always going to be. I had a {workTool} before I had shoes.', 'Family trade. {WorkParentName} taught me, and grumbled the whole time.'],
    'workMaster ^2': ['I\'m learning it from {workMaster}. Apprenticed! Can you believe it?'],
    'workFormer ^1': ['I was a {workFormer} first. Then the village wanted a {jobWord} more. So here I am.', 'I hung up the {workFormer}\'s apron for this. Some days I miss it.'],
    'workPlayer ^1': ['The Steward put my name down. I\'d never held a {workTool} in my life.', 'By the Steward\'s say-so. I learned fast, I had to.'],
    'workAsked ^1': ['I was a {workAsked}, till the Steward said there were too many of us. So now I\'m this.'],
    'stage=elder': ['Oh, so long ago. I was barely out of short trousers.'],
    'rift': ['Back in Neverdark I did something like it, with more wires. It translates. Mostly.'],
  });
  W('work.how.else', {
    _: ['When I was small I wanted to be a wizard. Don\'t laugh.', 'Oh, everything. A sailor. A bard. A dragon, for a week.'],
    'workDreamElse': ['I wanted to {workDreamElse}. Still do, a bit.', 'Truly? I\'ve always wanted to {workDreamElse}. The {jobWord}\'s work just came first.'],
    'workDreamTrade ^1': ['Nothing else. I mean to be the best {jobWord} this valley\'s ever seen.', 'Never. I want to be a master at it, one day. A real one.'],
    'workFormer': ['I was a {workFormer}! I liked it. I\'d go back, if they\'d let me.'],
    shy: ['...I wanted to sing. Not where anyone could hear.'],
    proud: ['No. I\'d not be half so good at anything else.'],
    gloomy: ['Something with less mud in it.'],
    'workFamilyTrade': ['There was never any choosing. {WorkParentName} had a {workTool} in my hand by the time I could stand.'],
  });
  W('work.how.glad', {
    _: ['Mostly. It\'s a good trade. It\'s mine.', 'Glad? I suppose I am. I don\'t think about it, which is a good sign.'],
    cheerful: ['Every day! Well, most days. Well, today.'],
    ornery: ['Glad\'s a strong word. I\'m not sorry.'],
    shy: ['...Yes. I didn\'t know I could be good at something.'],
    dreamy: ['Glad of the mornings. The mornings are lovely.'],
    proud: ['Glad? The trade\'s lucky to have me.'],
    gloomy: ['It could be worse. It could be the washing up. Oh. That\'s part of it.'],
    'workLevel=master ^1': ['Glad? It\'s my whole life. I\'d not change a day.'],
    'workLevel=new ^1': ['Ask me in a year! I\'m still finding out.'],
  });
  W('work.how.free', {
    _: ['The free {workPerk}! Ha. Well, it didn\'t hurt.', 'Ha! You\'ve found me out.'],
    'job=nanny|storyteller': ['The cookies are very good. I won\'t pretend otherwise.'],
    'job=postie': ['The gossip! Ha. I hear everything first. It\'s a terrible temptation.'],
    ornery: ['Free? Nothing\'s free. I pay for it in sore feet.'],
    witty: ['The perks are excellent. The hours are criminal.'],
    'stage=elder': ['I lost a bet! To my grandmother. She cheated. I\'ve been at it ever since.'],
  });
  W('work.how.first', {
    _: ['My first day? I dropped everything I picked up, and then picked it up and dropped it again.', 'I was so nervous I forgot my own name. They called me "you there" for a week.'],
    'job=baker': ['First loaf I baked could have stopped a door. Did, in fact. It\'s still there.'],
    'job=farmer': ['I sowed a whole row upside down. Don\'t ask how. It came up anyway.'],
    'job=fisher': ['I fell in. First cast, straight in. The fish laughed.'],
    'job=innkeeper': ['I poured my first pint into a hat. The hat\'s owner was not amused.'],
    'job=woodwright': ['My first tree fell the wrong way and flattened a hen-house. No hens in it. Mostly.'],
    'job=herbalist': ['I gave somebody a tonic for their cough. It was for warts. They stopped coughing, mind.'],
    'job=postie': ['I delivered every letter to the wrong door. Folk were very nice about it.'],
    'job=brewer': ['My first ale was so strong it took the varnish off the table.'],
    'job=miller': ['I let the stones run dry and the whole mill smelled of toast.'],
    'job=herder': ['A ram knocked me into the trough. I\'ve not trusted a ram since.'],
    'job=orchardist': ['I tipped a whole hive over. I could not sit down for a week.'],
    'job=nanny': ['I minded four little ones and lost one. She was in the bread box. Asleep.'],
    'job=storyteller': ['I forgot the end of the story. The little ones made one up. It was better.'],
    'job=tinker': ['I wired a lamp backwards. It got darker. Neverdark science, eh?'],
    'job=lamplighter': ['I lit every lamp and forgot to put them out. Burned a week of oil in a night.'],
    'job=grower': ['I hung the leaf to dry in the rain. Then I hung it to dry again.'],
  });
  W('work.how.survive', {
    _: ['Barely! But I did, and so did it. Mostly.', 'Ha! Survive? It thrived. Out of spite.'],
    'job=woodwright': ['The hens forgave me. Eventually.'],
    'job=baker': ['The loaf? It\'s holding the door open as we speak.'],
  });
  W('work.how.now', {
    _: ['Look at me now. Still dropping things, but with more style.', 'Ha! I suppose so. I suppose I\'ve come a way.'],
    proud: ['I\'ve come a long way. Further than most.'],
    shy: ['...I suppose I have. I hadn\'t thought of it like that.'],
  });
  W('work.how.beard', {
    _: ['You never! What did he say?', 'Ha! Oh, that\'s wonderful. Did he forgive you?'],
    child: ['A BEARD ON FIRE? Do it again!'],
    ornery: ['Hm. Sounds about right for a wizard.'],
    witty: ['Well, it\'s a start. Mine only set fire to a loaf.'],
  });
  W('work.how.more', {
    _: ['...It\'s nice to be asked. Nobody asks how you came to things.', 'You don\'t think of it, day to day. Then somebody asks and it all comes back.'],
    shy: ['...I\'ve not told anyone that.'],
    gloomy: ['...Sometimes I think it chose me rather than the other way.'],
  });
  W('work.how.kids', {
    _: ['If they want it. I\'d not push them. Well, maybe a little.', 'I\'d be proud. And I\'d tell them to get up earlier than I do.'],
    'kid': ['{Kid} watches me at it sometimes. Asks a hundred questions. I think so, yes.'],
    gloomy: ['I\'d want better for them. But I\'d not mind.'],
    proud: ['They could do a lot worse. They couldn\'t do much better.'],
  });
  W('work.how.late', {
    _: ['...Too late? I don\'t know. Maybe not. It\'s still there, somewhere.', 'I\'ve not thought about it in years. ...I still think about it.'],
    'workDreamElse': ['...I still want to {workDreamElse}. I never stopped. I just stopped saying.'],
    shy: ['...Don\'t tell anyone. I still practice. When nobody\'s about.'],
    gloomy: ['Probably. Everything is, in the end.'],
  });
  W('work.how.greener', {
    _: ['Greener and further off. Yes. You\'re right.', 'Ha. That it does. This side\'s not so bad.'],
    ornery: ['Hm. The road I took is muddy, I\'ll say that.'],
  });
  W('work.how.evening', {
    _: ['An evening a week... Do you know, I might. I\'ll hold you to it.', 'Nobody need know. I like that. All right.'],
    shy: ['...Just for me. Yes. I think I\'d like that.'],
    proud: ['If I do, I\'ll do it properly.'],
  });
  W('work.how.time', {
    _: ['There\'s always a little time. I\'ll remember you said that.', '...Thank you. I needed someone to say it.'],
    gloomy: ['Is there? ...Well. If you say so.'],
  });

  // --- Their turn: a problem of the trade, and the wizard's advice ---------------------
  addThread({
    id: 'work.trouble', theirs: true, label: 'A problem with the work', cool: 4, ask: '{Name} has a problem with the work, and wants your advice.',
    when: (F) => !!F.job && F.stage !== 'child' && F.met && F.talks >= 1,
    beats: {
      start: { line: 'work.trouble.start', go: [
        { ap: 'advise', say: 'work.trouble.fix', label: 'Tell them how to fix it', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] }, when: (F, T) => !(T.flags && T.flags.heard) } }, 'tried'] },
        { ap: 'ask', say: 'When did it start?', to: 'when' },
        { ap: 'tale', say: 'work.trouble.tale', label: 'Tell them a tale about it', to: 'tale' },
        { ap: 'jest', say: 'work.trouble.jest', label: 'Make light of it', to: 'jest' },
      ] },
      when: { line: 'work.trouble.when', fx: { flag: 'heard', open: 1 }, go: [
        { ap: 'advise', say: 'work.trouble.fix', label: 'Now tell them how to fix it', to: 'tried' },
        { ap: 'listen', say: '*You let them get it all out.*', label: 'Let them get it all out', to: 'vent' },
        { ap: 'ask', say: 'Have you asked anyone else?', to: 'others' },
      ] },
      vent: { line: 'work.trouble.vent', fx: { flag: 'heard', trust: 0.02 }, go: [
        { ap: 'advise', say: 'work.trouble.fix', label: 'Tell them how to fix it', to: 'tried' },
        { ap: 'comfort', say: 'It\'s not your fault. It isn\'t, you know.', to: 'notfault' },
      ] },
      others: { line: 'work.trouble.others', go: [
        { ap: 'advise', say: 'work.trouble.fix', label: 'Tell them how to fix it', to: 'tried' },
        { ap: 'warm', say: 'Then ask {workMate}. Two heads.', to: 'askmate', need: { if: { workMate: has } } },
        { ap: 'jest', say: 'Well, you\'ve asked a wizard. That\'s the top of the list.', to: 'jest' },
      ] },
      tale: { line: 'work.trouble.taleheard', go: [
        { ap: 'advise', say: 'work.trouble.fix', label: 'Tell them how she fixed it', to: 'tried' },
        { ap: 'jest', say: 'And then she married a troll. But that\'s another tale.', to: 'troll' },
      ] },
      jest: { line: 'work.trouble.jested', go: [
        { ap: 'advise', say: 'work.trouble.fix', label: 'All right: tell them how to fix it', to: 'tried' },
        { ap: 'warm', say: 'I\'m sorry. Tell me properly.', to: 'when' },
      ] },
      tried: { line: 'work.trouble.tried', fx: { respect: 0.04, run: (T, v) => { const k = T.F.workFix; if (k && ACTIONS[k]) v.queue.push({ a: ACTIONS[k] }); feel(v, 'good_tip', 'the wizard'); }, remember: 'The wizard told me how to set the {jobWord}\'s work right.', rv: 1 }, go: [
        { ap: 'warm', say: 'Let me know how it goes.', to: 'letknow' },
        { ap: 'jest', say: 'No charge. This time.', to: 'nocharge' },
      ] },
      bristle: { line: 'work.trouble.bristle', fx: { respect: -0.02, flag: 'heard' }, go: [
        { ap: 'listen', say: '*You hold up a hand, and wait.*', label: 'Back off, and listen', to: 'vent' },
        { ap: 'warm', say: 'Forgive me. You know the trade far better than I.', to: 'mollified' },
      ] },
      mollified: { line: 'work.trouble.mollified', fx: { respect: 0.02 }, go: [
        { ap: 'advise', say: 'work.trouble.fix', label: 'Now offer the advice gently', to: 'tried' },
        { ap: 'listen', say: '*You let them go on.*', label: 'Let them go on', to: 'vent' },
      ] },
      notfault: { line: 'work.trouble.notfault', fx: { trust: 0.03, fond: 0.02 }, end: true },
      askmate: { line: 'work.trouble.askmate', fx: { fond: 0.01 }, end: true },
      troll: { line: 'work.trouble.troll', fx: { fond: 0.02, joke: { k: 'work.troll', t: 'She fixed it, then married a troll. Another tale.' } }, end: true },
      letknow: { line: 'work.trouble.letknow', fx: { promise: { k: 'work.trouble', t: 'You asked {name} to tell you how the {jobWord}\'s trouble turns out', days: 4 }, trust: 0.02 }, end: true },
      nocharge: { line: 'work.trouble.nocharge', fx: { fond: 0.02, owe: 1 }, end: true },
    },
    end: { fond: 0.01 },
  });
  W('work.trouble.start', {
    _: ['Can I ask you something? It\'s the work. It\'s not going right and I can\'t see why.', 'You\'re wise, they say. Well. Something\'s wrong with the work and I\'m at my wits\' end.'],
    'workTrouble=baker.0': ['The loaves won\'t rise. Three mornings running. Is it the flour, the yeast, or me?', 'Flat as a doorstep, my bread. Every batch this week. I\'ve not changed a thing.'],
    'workTrouble=baker.1': ['My crusts have gone soft. Soft! I\'ve not had a soft crust in years.', 'The loaves come out pale and sad and soft as a pillow. A baker\'s shame.'],
    'workTrouble=farmer.0': ['There\'s a patch of the barley coming up thin and yellow. The rest is fine. Just that patch.', 'One corner of the field\'s sulking. Thin, yellow, sorry for itself.'],
    'workTrouble=farmer.1': ['The crows have found the new sowing. They\'re laughing at my scarecrow. I can hear them.', 'Crows. A whole parliament of them, and they\'ve voted to eat my barley.'],
    'workTrouble=herder.0': ['One of the ewes has gone off her food. Stands by the fence and sighs at me.', 'Old Clover won\'t eat. She just stands there looking at the hills.'],
    'workTrouble=herder.1': ['The cows have stopped giving. Half a pail. They look at me like it\'s my fault.', 'The milk\'s fallen off. The cows aren\'t ill. They\'re just not in the mood.'],
    'workTrouble=miller.0': ['The wheel\'s grinding uneven. The flour comes out gritty one sack and fine the next.', 'There\'s grit in my flour. Grit! The bakers are giving me looks.'],
    'workTrouble=miller.1': ['There\'s a knocking in the mill. Not a nice knocking. A worrying one.', 'The old mill\'s started groaning at night. Like it\'s got something to say.'],
    'workTrouble=brewer.0': ['The last batch went sour. Clean vats, good barley, same as ever. Sour.', 'Sour again. Two batches. The Badger\'s sending them back.'],
    'workTrouble=brewer.1': ['My ale\'s gone cloudy. It tastes fine. Folk won\'t drink cloudy ale.', 'Cloudy as a wet Highday, my last barrel. Nobody trusts a cloudy pint.'],
    'workTrouble=innkeeper.0': ['Folk leave before their supper\'s come. I can\'t be in two places at once.', 'I\'ve had three walk out this week, hungry. Hungry! From an inn!'],
    'workTrouble=innkeeper.1': ['There\'s a regular who sings the same song every night. All night. The others are mutinous.', 'One verse, forty times a night. I\'ll not say who. The whole taproom knows who.'],
    'workTrouble=grower.0': ['There\'s spots on the leaf. Little brown ones. Spreading, I think.', 'Leaf-spot. I know it when I see it, and I\'m seeing it.'],
    'workTrouble=grower.1': ['The leaf\'s drying bitter. All of this batch. I\'ve done nothing different.', 'Bitter leaf! Folk will think I\'ve gone over to the Bree stuff.'],
    'workTrouble=fisher.0': ['Nothing\'s biting. Four days. It\'s like the river\'s gone empty.', 'Not a nibble. The river\'s still there. The fish have gone somewhere better.'],
    'workTrouble=fisher.1': ['Something keeps taking my bait and not the hook. Something clever.', 'There\'s a fish in that pool cleverer than me. It eats the worm and waves.'],
    'workTrouble=woodwright.0': ['My axe keeps catching. Bounces off the grain like it\'s afraid of it.', 'The axe skips. Off the bark, near my toes. Twice today.'],
    'workTrouble=woodwright.1': ['The timber\'s splitting as it dries. Good oak, split from end to end.', 'Every plank I saw cracks on the stack. A whole week\'s work, split.'],
    'workTrouble=herbalist.0': ['I can\'t find any feverfew. Not a sprig. And it\'s coughing season.', 'The hedges have gone bare of everything I need. And folk keep sneezing.'],
    'workTrouble=herbalist.1': ['There\'s an old fellow on the lane won\'t take his tonic. Says it tastes of ditch. It does. It works, though.', 'My remedies are going stale on the shelf before anyone takes them.'],
    'workTrouble=orchardist.0': ['The bees are cross. All of them. They\'ve never been cross with me.', 'The hives have turned against me. I went to say good morning and they said otherwise.'],
    'workTrouble=orchardist.1': ['Half the apples are dropping before they\'re ripe.', 'Windfalls everywhere and none of them ready. Green as grass.'],
    'workTrouble=postie.0': ['There\'s a dog on the round that won\'t let me past. Sits in the lane. Looks at me.', 'A dog. A small dog. It has decided the lane is its lane.'],
    'workTrouble=postie.1': ['A letter\'s come with no name on it. Just "to the one who\'ll know". Who\'ll know?', 'Letters go missing from the bag. Not lost. Missing. I count them.'],
    'workTrouble=storyteller.0': ['The little ones have heard all my tales. Every one. They say the endings before I do.', 'They know every story by heart. They correct me. Little ones correcting me!'],
    'workTrouble=storyteller.1': ['One of them won\'t sit still. Not for anything. I don\'t want to be cross.', 'There\'s one who fidgets so much the others can\'t hear. I\'ve tried everything.'],
    'workTrouble=nanny.0': ['They won\'t nap. None of them. They\'ve formed a sort of union.', 'Not one nap all week. They take it in turns to keep each other awake.'],
    'workTrouble=nanny.1': ['One of them bites. Only me. Only on Trewsdays.', 'I\'ve a little one who cries the whole day through. Nothing\'s wrong. Nothing I can find.'],
    'workTrouble=tinker.0': ['The Relay keeps dropping signal at dusk. Every dusk. Like clockwork, if clockwork was broken.', 'Signal drops at sundown. Every time. Full bars, then static.'],
    'workTrouble=tinker.1': ['My sun-glass lamps are fading. They hold a charge till midnight, then nothing.', 'The neon on the lane\'s flickering. I\'ve swapped every wire. Still flickers.'],
    'workTrouble=lamplighter.0': ['There\'s a lamp by the green that won\'t stay lit. I light it, I turn round, it\'s out.', 'One lamp. Always the same one. Out before I\'m three lamps on.'],
    'workTrouble=lamplighter.1': ['I\'m running short of oil. The lamps drink more every week.', 'The oil\'s going faster than it should. Either the lamps are thirsty or somebody is.'],
  });
  W('work.trouble.fix', {
    _: ['Start again from the beginning, slowly, and watch for what\'s changed.', 'Do it the old way for a day. Then you\'ll see the difference.'],
    'workTrouble=baker.0': ['Warm the bowl first. Yeast likes a warm welcome, same as anyone.', 'Knead it longer. Ten minutes more. Then leave it by the oven, covered.'],
    'workTrouble=baker.1': ['Hotter oven, and a dish of water on the bottom shelf. Steam makes a crust.'],
    'workTrouble=farmer.0': ['Weed that patch, and water it from the river, not the well. It\'s thirsty for something.'],
    'workTrouble=farmer.1': ['Pull the weeds the crows hide in, and walk the rows at dawn. Crows hate company.'],
    'workTrouble=herder.0': ['Look her over properly. Feet first. It\'s nearly always the feet.'],
    'workTrouble=herder.1': ['Brush them down and talk to them. A cow that\'s fussed over gives more.'],
    'workTrouble=miller.0': ['Bag what\'s ground and dress the stones. They\'ve worn uneven.'],
    'workTrouble=miller.1': ['Empty the hoppers and bag the lot, then listen. It knocks when it\'s overfull.'],
    'workTrouble=brewer.0': ['Mash a little cooler, and scald the paddles. Sourness hides in wood.'],
    'workTrouble=brewer.1': ['Mash slower, and let it settle a day longer before you tap it.'],
    'workTrouble=innkeeper.0': ['Sweep and set the tables before they come. Half of serving is being ready.'],
    'workTrouble=innkeeper.1': ['Sweep out early and start a different song yourself, louder. They\'ll follow you.'],
    'workTrouble=grower.0': ['Hoe between the rows and thin them. Spots like crowding, and damp.'],
    'workTrouble=grower.1': ['Hoe the rows and pick earlier. Bitter leaf is leaf left too long.'],
    'workTrouble=fisher.0': ['Change your bait. The fish talk to each other, you know.'],
    'workTrouble=fisher.1': ['Bait smaller, with the hook hidden deeper. Clever fish want a clever worm.'],
    'workTrouble=woodwright.0': ['Sharpen the axe. Properly. Not a lick and a promise.'],
    'workTrouble=woodwright.1': ['Sharpen up and cut thinner, and stack it out of the sun. Oak hates to hurry.'],
    'workTrouble=herbalist.0': ['Look to your own beds first. Tend them and they\'ll give you more than you think.'],
    'workTrouble=herbalist.1': ['Tend the beds and grow something sweeter. Mint hides a ditch nicely.'],
    'workTrouble=orchardist.0': ['See to the hives slowly, with smoke, and tell them the village news. They hate being left out.'],
    'workTrouble=orchardist.1': ['Prune the old wood. Light and air, and the trees will hold their fruit.'],
    'workTrouble=postie.0': ['Sort the bag before you set out, and go round the other way. Dogs hate surprises more than mail carriers.'],
    'workTrouble=postie.1': ['Sort the bag twice, in the order of the lane. Then you\'ll know where they go.'],
    'workTrouble=storyteller.0': ['Read something new. The old book has a chapter at the back nobody\'s opened.'],
    'workTrouble=storyteller.1': ['Read up something with marching in it, and let the fidget do the marching.'],
    'workTrouble=nanny.0': ['Have a cup of tea. Sit down. When you\'re calm, they\'ll be calm. Mostly.'],
    'workTrouble=nanny.1': ['Sit down with a cup of tea and let them see you rest. Little ones copy.'],
    'workTrouble=tinker.0': ['Go up and tune the Relay at dusk itself, while it\'s failing. Watch what changes.'],
    'workTrouble=tinker.1': ['Tune the Relay first. If the mast\'s off, every lamp downstream sulks.'],
    'workTrouble=lamplighter.0': ['Go round the lamps once more tonight, and watch the one by the green. It\'ll tell you.'],
    'workTrouble=lamplighter.1': ['Go round with a lower wick tonight. A lamp burns as greedy as it\'s let.'],
  });
  W('work.trouble.tale', {
    _: ['I knew a dwarf with the very same trouble. In the Blue Mountains, it was.', 'There\'s an old tale about that. A hobbit in the Eastfarthing had the same.'],
    'job=baker': ['There was a baker in Bree whose bread wouldn\'t rise for a year. Shall I tell you why?'],
    'job=fisher': ['There\'s a fish in the Brandywine that\'s been outwitting fishers for a hundred years.'],
    'job=tinker': ['I once met a smith whose forge went out at the same hour every night. A tale for you.'],
  });
  W('work.trouble.jest', {
    _: ['Have you tried shouting at it?', 'Perhaps it\'s on vacation.'],
    'job=baker': ['Perhaps the loaves are just tired. Let them lie in.'],
    'job=fisher': ['Perhaps the fish have heard about you.'],
    'job=nanny': ['A union? Then you must negotiate. Offer cookies.'],
    'job=herder': ['Perhaps she\'s in love. Sighing by fences is a sure sign.'],
  });
  W('work.trouble.when', {
    _: ['Three days back. Maybe four. I thought it\'d mend itself. It didn\'t.', 'It came on slow. I didn\'t notice till it was a proper problem.'],
    ornery: ['Since somebody moved my things, if you must know.'],
    shy: ['...A while. I didn\'t want to bother anyone.'],
    curious: ['Tuesday. No, Trewsday. I wrote it down. I\'ve been watching it.'],
    gloomy: ['Since always, it feels like. It was bound to go wrong eventually.'],
    'season=winter': ['Since the cold set in. Everything\'s harder in the cold.'],
    'weather=rain': ['Since the wet came. It\'s got into everything.'],
    'workWeek=busy': ['Since the busy week started. I\'ve not had time to look at it properly.'],
  });
  W('work.trouble.vent', {
    _: ['And it\'s not like I\'ve time to fuss over it! There\'s all the rest of the work as well!', 'I\'ve done everything right. Everything! And still.'],
    ornery: ['And everyone\'s got an opinion and none of them\'s worth a turnip!'],
    shy: ['...I keep thinking someone will notice and think I\'m no good at it.'],
    proud: ['I\'ve never had this happen. Never. It\'s an insult.'],
    gloomy: ['It\'ll be the end of me. Or the end of the trade. One or the other.'],
    cheerful: ['Oh, I\'m sure it\'s nothing! It\'s just... it\'s a lot of nothing.'],
  });
  W('work.trouble.others', {
    _: ['I don\'t like to. They\'ll think I\'ve lost the knack.', 'Who\'d I ask? Nobody knows the trade like I do. That\'s the trouble.'],
    'workMate': ['{WorkMate} says it\'s the weather. {WorkMate} says everything\'s the weather.'],
    'workMaster': ['{WorkMaster} says I\'ll work it out. That\'s not advice, that\'s a shrug.'],
    proud: ['Ask? I\'m the one they ask.'],
  });
  W('work.trouble.taleheard', {
    _: ['Go on, then. What did she do?', 'And? Don\'t stop there!'],
    shy: ['...Did it come right for them?'],
    curious: ['Oh, tell me! Every detail.'],
    ornery: ['A tale. I asked for help and I get a tale. ...Well, go on.'],
  });
  W('work.trouble.jested', {
    _: ['Ha. Very helpful. Truly, wizard.', 'I\'m being serious!'],
    cheerful: ['Ha! I might, at that. ...No, but really.'],
    ornery: ['I come to you with a proper problem and you make jokes.'],
    witty: ['I\'ve tried. It shouted back.'],
  });
  W('work.trouble.tried', {
    _: ['Is that all? ...I\'ll try it. I\'ll try it this afternoon.', 'Huh. That\'s so simple I\'d never have thought of it. I\'ll go and do it now.'],
    cheerful: ['Oh, that\'s clever! Thank you! I\'ll do it straight away.'],
    ornery: ['Hm. Might work. Might not. ...I\'ll try it.'],
    shy: ['...Thank you. I\'ll try. I\'ll let you know.'],
    curious: ['Oh! Yes, that would explain it. Why didn\'t I see it?'],
    dreamy: ['Of course. It\'s always the simple thing, isn\'t it.'],
    witty: ['If it works, I\'ll say I thought of it.'],
    proud: ['I\'d have got there. But thank you.'],
    gloomy: ['It won\'t work. ...I\'ll try it anyway.'],
  });
  W('work.trouble.bristle', {
    _: ['I\'ve been doing this for years, wizard. I didn\'t ask to be told.', 'I know my own trade, thank you.'],
    proud: ['Teach your grandmother to suck eggs, would you?'],
    ornery: ['Oh, aye. A wizard knows best. About everything.'],
  });
  W('work.trouble.mollified', {
    _: ['Hm. Well. You might know something. Go on.', '...That\'s better. All right. What would you do?'],
    proud: ['I do. But I\'ll hear you out.'],
  });
  W('work.trouble.notfault', {
    _: ['...You think so? Thank you. I needed to hear that.', 'It isn\'t, is it. It\'s just a thing that happened.'],
    shy: ['...Thank you.'],
    gloomy: ['...Maybe not. Maybe it isn\'t.'],
  });
  W('work.trouble.askmate', {
    _: ['{WorkMate}... Yes, all right. Two heads.', 'I suppose I could ask. Without saying it\'s a problem.'],
    proud: ['Ask {workMate}? ...Well. Just this once.'],
  });
  W('work.trouble.troll', {
    _: ['A troll! Ha! You can\'t stop there!', 'Ha! You\'ll have to tell me that one some other time.'],
    ornery: ['A troll. Of course she did.'],
  });
  W('work.trouble.letknow', {
    _: ['I will. You\'ll be the first to hear.', 'I\'ll come and find you. Or you find me.'],
    shy: ['...I\'ll tell you. If it works.'],
  });
  W('work.trouble.nocharge', {
    _: ['Ha! I\'ll owe you a {workGoodOne}, then.', 'This time! What do wizards charge?'],
    'job=baker': ['I\'ll owe you a loaf. A good one.'],
    'job=brewer|innkeeper': ['I\'ll owe you a pint. A proper one.'],
    'job=fisher': ['I\'ll owe you a fish. A big one.'],
  });

  // --- The tools of the trade ----------------------------------------------------------
  addThread({
    id: 'work.tools', label: 'The tools of the trade', about: 'work', weight: 0.8, cool: 6,
    when: (F) => !!F.job && F.stage !== 'child' && !['nanny', 'storyteller'].includes(F.job),
    rel: (F) => (F.workFamilyTrade || F.workYears === 'long' ? 1.3 : 0.9),
    open: { ask: 'work.tools.open' },
    beats: {
      start: { line: 'work.tools.start', notice: 'work.tools.notice', go: [
        { ap: 'ask', say: 'Where did it come from?', to: 'origin' },
        { ap: 'jest', say: 'work.tools.jest', label: 'Tease them about it', to: 'old' },
        { ap: 'ask', say: 'Does it have a name? The good ones do.', to: 'name', need: { open: 1 }, soft: true },
      ] },
      origin: { line: 'work.tools.origin', go: [
        { ap: 'ask', say: 'And who\'ll have it after you?', to: 'heir', need: { open: 1 }, soft: true },
        { ap: 'listen', say: '*You turn it over in your hands, and wait.*', label: 'Hold it a moment, and wait', to: 'story' },
        { ap: 'warm', say: 'Then it\'s in good hands.', to: 'good' },
      ] },
      old: { line: 'work.tools.old', go: [
        { ap: 'ask', say: 'Where did it come from, then?', to: 'origin' },
        { ap: 'advise', say: 'work.tools.mend', label: 'Offer to see to it', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'mend'] },
      ] },
      name: { line: 'work.tools.name', fx: { joke: { k: 'work.toolname', t: '{Name}\'s {workTool} has a name. You\'ve been told it.' } }, go: [
        { ap: 'jest', say: 'Does it answer to it?', to: 'answer' },
        { ap: 'warm', say: 'A good name for an old friend.', to: 'good' },
      ] },
      story: { line: 'work.tools.story', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'Then it\'s more than a tool. It\'s kin.', to: 'kin' },
        { ap: 'ask', say: 'And who\'ll have it after you?', to: 'heir', need: { open: 1 }, soft: true },
      ] },
      heir: { line: 'work.tools.heir', go: [
        { ap: 'comfort', say: 'Somebody will. Good tools find good hands.', to: 'comforted', need: { if: { kid: false, workApprentice: false } } },
        { ap: 'advise', say: 'Then teach someone. A tool wants a pair of hands to go to.', to: 'teach', need: { if: { workApprentice: false } } },
        { ap: 'warm', say: 'They\'ll treasure it.', to: 'good' },
      ] },
      mend: { line: 'work.tools.mended', fx: { respect: 0.02, run: (T, v) => { const k = T.F.workFix; if (k && ACTIONS[k]) v.queue.push({ a: ACTIONS[k] }); } }, end: true },
      bristle: { line: 'work.tools.bristle', fx: { fond: -0.01 }, go: [
        { ap: 'warm', say: 'Of course. It\'s yours. I only meant to admire it.', to: 'good' },
        { ap: 'ask', say: 'Then tell me where it came from.', to: 'origin' },
      ] },
      answer: { line: 'work.tools.answer', fx: { fond: 0.02 }, end: true },
      kin: { line: 'work.tools.kin', fx: { fond: 0.02, trust: 0.01 }, end: true },
      good: { line: 'work.tools.good', fx: { fond: 0.01 }, end: true },
      comforted: { line: 'work.tools.comforted', fx: { trust: 0.03 }, end: true },
      teach: { line: 'work.tools.teach', fx: { respect: 0.02, note: 'Told {name} to pass on the {jobWord}\'s trade, and the {workTool} with it.' }, end: true },
    },
    end: { fond: 0.01 },
  });
  W('work.tools.open', {
    _: ['Is that your {workTool}, {name}? May I see?', 'That\'s a well-used {workTool}, {name}.'],
    'job=postie': ['That satchel\'s seen some miles, {name}.'],
    'job=lamplighter': ['That\'s a fine long pole, {name}. May I see?'],
    'job=tinker': ['What is that, {name}? It\'s humming.'],
  });
  W('work.tools.notice', {
    _: ['The handle\'s worn pale where their hand goes.', 'There are old initials scratched near the grip. Not theirs.'],
    'job=woodwright': ['The axe-head\'s been ground so often it\'s half the size it was.'],
    'job=baker': ['The peel\'s blade is scorched black at the tip, smooth as a pebble.'],
    'job=tinker': ['It\'s wrapped in hill-folk twine and something glowing faintly blue.'],
    'job=postie': ['The satchel strap has been mended three different ways.'],
  });
  W('work.tools.start', {
    _: ['This? My {workTool}. Best friend I\'ve got, after the kettle.', 'Ah, the old {workTool}. Mind it, it bites the careless.'],
    cheerful: ['Isn\'t it lovely? I polish it on Highdays. Don\'t tell anyone.'],
    ornery: ['It\'s a {workTool}. It does what it\'s told. Unlike some.'],
    shy: ['...It\'s only my {workTool}. Nothing special. Well. It\'s special to me.'],
    curious: ['I\'ve taken it apart and put it back three times. It works better each time. Mostly.'],
    dreamy: ['It knows the work better than I do, some mornings. I just go along.'],
    witty: ['My {workTool}. We\'ve been through a great deal together. Mostly mud.'],
    proud: ['The finest {workTool} in the valley. Look at the balance on that.'],
    gloomy: ['It\'s worn out. Like me. We\'ll go together, I expect.'],
    'workFamilyTrade ^1': ['It was {workParentName}\'s. I use it every day and it still feels like borrowing.'],
    'workYears=new ^1': ['It\'s new. Stiff, still. It doesn\'t know me yet.'],
    'job=tinker rift': ['Soldering iron. Neverdark make, hill-folk handle. Runs off a sun-glass cell, mostly.'],
  });
  W('work.tools.origin', {
    _: ['Bought it off a dwarf at the Bree market. He swore it would outlast me. He may be right.', 'It came with the trade. It was hanging on the wall the day I started.'],
    'workFamilyTrade ^1': ['{WorkParentName}\'s, and {workParentName} had it from the one before. Three of us, now.'],
    'workMaster ^1': ['{WorkMaster} gave it me the day I was taken on. Said it had more sense than me.'],
    'workFormer ^1': ['I swapped my old {workFormer}\'s things for it. Fair trade, I thought.'],
    'rift': ['I made it. From salvage and a hill-folk spoon. Don\'t tell the spoon\'s owner.'],
    'stage=elder': ['I\'ve had it longer than I\'ve had my own teeth. These teeth, anyway.'],
    proud: ['Made to my own measure. You don\'t get a tool like this off a shelf.'],
    shy: ['...Someone left it on my step, the week I started. I never found out who.'],
  });
  W('work.tools.old', {
    _: ['Older! It\'s got years on both of us, I\'d say.', 'Old and honest. Like a good hobbit.'],
    'workYears=new ^1': ['Old? It\'s nearly new! It\'s just had a hard few weeks. Like me.', 'It\'s new! It only looks tired. It takes after its owner.'],
    cheerful: ['Ha! And still prettier than you, wizard.'],
    ornery: ['It\'s older than your manners, I\'ll grant you.'],
    witty: ['It is. It\'s also wiser. It never talks to wizards.'],
    proud: ['Old means proven. A new one\'s just a promise.'],
    gloomy: ['It\'ll see me out, I expect.'],
  });
  W('work.tools.mend', {
    _: ['Let me see to it. Wizards are handy with a whetstone.', 'It wants a little care. Shall I show you how?'],
    'job=tinker': ['That wire\'s fraying. Let me look.'],
  });
  W('work.tools.mended', {
    _: ['There! Good as new. Well. Good as old, which is better.', 'Huh. That\'s a trick worth knowing. I\'ll go and do the rest myself.'],
    cheerful: ['Ooh, look at that! Thank you, wizard!'],
    curious: ['How did you do that? No, don\'t tell me. Yes, tell me.'],
    shy: ['...Thank you. I\'d never have dared.'],
  });
  W('work.tools.bristle', {
    _: ['Nobody touches it but me.', 'I\'ll see to my own {workTool}, thank you.'],
    proud: ['I\'ve kept it sharp for years without a wizard\'s help.'],
    ornery: ['Hands off. It\'s mine.'],
  });
  W('work.tools.name', {
    _: ['...Old Faithful. Don\'t laugh.', '...It\'s called Marigold. After my aunt. She was sharp too.'],
    cheerful: ['Bessie! Say hello to the wizard, Bessie.'],
    ornery: ['It\'s called the {workTool}. ...Fine. It\'s Gerald.'],
    shy: ['...I call it Friend. Only when nobody\'s listening.'],
    witty: ['Its name is Sir Reginald, and it outranks you.'],
    proud: ['Truehand. It\'s earned the name.'],
    gloomy: ['Patience. Because it needs a great deal of it, with me.'],
    dreamy: ['Starling. It sings, a little, when the work goes right.'],
    curious: ['Number Four. There were three before. We don\'t talk about them.'],
  });
  W('work.tools.answer', {
    _: ['Only when it\'s in the mood. Like everyone.', 'Ha! It doesn\'t need to. It knows.'],
    witty: ['It answers to "please" and nothing else. Try it.'],
    ornery: ['More often than you\'d think. More often than some hobbits.'],
  });
  W('work.tools.story', {
    _: ['...It held when I slipped, once. On the riverbank. I\'d not be here without it, maybe.', 'It\'s been mended so often there\'s hardly any of the first one left. Still the same tool, though.'],
    'workFamilyTrade ^1': ['{WorkParentName} worked with it the last day before taking to bed. I don\'t like to clean the grip.'],
    shy: ['...I talk to it. While I work. Is that strange?'],
    gloomy: ['It\'s outlasted two of the hobbits who used it. It\'ll outlast me.'],
    dreamy: ['Sometimes I think it remembers every day it\'s worked. All of them.'],
  });
  W('work.tools.heir', {
    _: ['I don\'t know. I\'ve been meaning to think about it.', 'Whoever wants it. If anyone does. It\'s not much to look at.'],
    'kid': ['{Kid}, if {kid} wants it. I\'ve not asked. I\'m afraid to.', '{Kid}\'s already eyeing it. I\'ve said "when you\'re bigger" for years.'],
    'workApprentice ^1': ['{WorkApprentice}. That\'s what an apprentice is for. That and making tea.'],
    gloomy: ['Nobody, probably. It\'ll sit in a shed.'],
    proud: ['Someone who\'s earned it. I\'ve not met them yet.'],
  });
  W('work.tools.comforted', {
    _: ['...I hope so. I\'d hate it to go to waste.', 'Good hands. Yes. I\'ll keep an eye out.'],
    gloomy: ['Maybe. ...Maybe you\'re right.'],
  });
  W('work.tools.teach', {
    _: ['Teach someone... I\'ve thought of it. I might.', 'Hm. A pair of hands for it. That\'s a good way of putting it.'],
    proud: ['If they\'re worth teaching. I\'ll look about.'],
    shy: ['...I\'d be a terrible teacher. ...Would I?'],
  });
  W('work.tools.good', {
    _: ['I like to think so.', 'The best hands it could have, I\'d say. Though I would.'],
    cheerful: ['Oh, that\'s lovely. It\'s blushing. Look.'],
    ornery: ['Hm. Well. It does its job.'],
    shy: ['...I hope so. I try to look after it.'],
    proud: ['It is. It knows it is.'],
    witty: ['Good hands, yes. Clumsy feet, but good hands.'],
  });
  W('work.tools.kin', {
    _: ['Kin. Yes. I\'ll tell it you said so.', 'Ha! Kin. It eats less than my cousins, I\'ll say that.'],
    shy: ['...That\'s just how it feels. I didn\'t know anyone else would see it.'],
    gloomy: ['Kin. And like kin, it\'ll go to someone who won\'t look after it.'],
    dreamy: ['Kin. Yes. That\'s the word I never found.'],
  });
  W('work.tools.jest', {
    _: ['Is it as old as it looks?', 'Did it come with the valley?'],
    'workYears=long': ['It looks older than I am. Nearly.'],
  });

  // --- Passing the time, the working way ------------------------------------------------
  addThread({
    id: 'work.pass', light: true, ap: 'warm', label: 'A word about the day\'s work', open: { warm: 'work.pass.open' },
    when: (F) => !!F.job && F.stage !== 'child',
    beats: {
      start: { line: 'work.pass.reply', go: [
        { ap: 'ask', say: 'And what did you get done?', to: 'done' },
        { ap: 'jest', say: 'Or a good day\'s looking busy?', to: 'busy' },
        { ap: 'warm', say: 'Sit a minute. The work will wait.', to: 'sit' },
      ] },
      done: { line: 'work.pass.done', go: [{ ap: 'warm', say: 'That\'s a day well spent.', to: 'end' }, { ap: 'jest', say: 'And did any of it go right?', to: 'right' }] },
      busy: { line: 'work.pass.busy', end: true },
      right: { line: 'work.pass.right', end: true },
      sit: { line: 'work.pass.sit', fx: { drive: { tired: -0.03 } }, end: true },
    },
    end: { fond: 0.015 },
  });
  W('work.pass.open', {
    _: ['You\'ve the look of someone who\'s done a good day\'s work, {name}.', 'The valley runs on folk like you, {name}.', 'Hard at it again, {name}? I don\'t know how you do it.'],
    'hour=morning': ['Up and at it already, {name}? I\'ve barely had my tea.'],
    'hour=evening|night': ['Done for the day, {name}? You\'ve earned your supper.'],
  });
  W('work.pass.reply', {
    _: ['I have, at that. My feet are telling me all about it.', 'Ha! Kind of you. It\'s been a long one.'],
    cheerful: ['Thank you! It has been a good one, now you say it.'],
    ornery: ['Somebody has to do it. Not you, clearly.'],
    shy: ['...Oh. Thank you. It\'s just work.'],
    proud: ['A good day\'s work is the only kind I do.'],
    gloomy: ['And tomorrow I get to do it all again.'],
    witty: ['A good day\'s work, or a good day\'s looking like it. Hard to tell from outside.'],
  });
  W('work.pass.done', {
    _: ['All of it! Well, most of it. Well, the important bits.', 'More than yesterday and less than tomorrow, as ever.'],
    'workMade>3 workGoodWord': ['{WorkMade} {workGoodWord} in the Store between us today. That\'s what.'],
    'job=baker': ['Three batches and a cake for somebody\'s birthday.'],
    'job=farmer': ['A row sown, a row weeded, and a fence that\'s nearly a fence again.'],
    'job=postie': ['Every letter delivered and only one dog.'],
    'job=woodwright': ['A tree down and sawn, and a stack you could build a hole with.'],
  });
  W('work.pass.busy', {
    _: ['Cheek! ...A bit of both. Don\'t tell.', 'Ha! The trick is to look busy and be busy. Exhausting.'],
    ornery: ['I\'ll have you know I never look busy. I am busy.'],
    witty: ['Looking busy is a skill in its own right, wizard. I\'m a master.'],
  });
  W('work.pass.right', {
    _: ['One thing went right. I\'m holding on to it.', 'Ha! Enough of it. Enough of it.'],
    gloomy: ['One thing. Eventually.'],
  });
  W('work.pass.sit', {
    _: ['...You know, I will. Just a minute. Ahh.', 'A minute. Only a minute. ...That\'s nice.'],
    ornery: ['A minute. Then I\'m off.'],
    shy: ['...Thank you. I don\'t often stop.'],
  });

  // --- More of the same moments, for more kinds of hobbit ---------------------------------
  W('work.pass.sit', {
    cheerful: ['Oh, go on then! Budge up.'], proud: ['A minute. The work\'s well ahead of itself, anyway.'], gloomy: ['If I sit down I may never get up. ...Ahh. Worth it.'],
    witty: ['If the work comes looking, tell it I\'ve emigrated.'], dreamy: ['Look at the light on the hill. I never see it, working.'], curious: ['Do wizards ever sit? I\'ve never seen you sit.'],
    'tired ^1': ['Oh, thank you. My legs were about to make the decision for me.'],
  });
  W('work.pass.busy', {
    cheerful: ['Ha! Both, and I enjoyed every minute.'], shy: ['...Mostly the real kind. I think.'], proud: ['I don\'t look busy. I am busy. There\'s a difference.'],
    gloomy: ['Looking busy\'s harder work than the work, some days.'], curious: ['Is there a difference? I\'ve wondered.'],
  });
  W('work.pass.right', {
    cheerful: ['Most of it! Isn\'t that a wonder?'], ornery: ['All of it, no thanks to anyone.'], witty: ['The bits nobody saw.'], proud: ['All of it. As usual.'],
  });
  W('work.pass.open', {
    'weather=rain': ['Still at it in this rain, {name}? You\'re made of sterner stuff than I am.'],
    'season=winter': ['Working in this cold, {name}? Your hands must be ice.'],
    'workRestDay': ['Working on a Highday, {name}? Shame on you. Sit down.'],
  });
  W('work.day.cushion', {
    cheerful: ['Ooh, yes! In red. With flowers round.'], ornery: ['On a cushion. Typical. Advice is for doing, not sitting on.'], proud: ['In my own words, mind. Word for word.'],
    gloomy: ['Somebody\'ll sit on it and never read it. That\'s about right.'], shy: ['...Please don\'t. Everyone would know it was me.'],
  });
  W('work.day.share', {
    'stage=elder': ['I once mended a bridge with a word. It still creaks in that voice.'],
    'job=woodwright|tinker': ['I made a door once. A magic one. It only opened for people it liked. Nobody, as it turned out.'],
    'job=farmer|grower|orchardist': ['I grew a turnip once. Enormous. It won a prize. I still have the ribbon somewhere in my hat.'],
  });
  W('work.day.sharedunseen', {
    ornery: ['Hm. At least nobody tells you how to do yours.'], proud: ['Well. You and I both know what we do. That\'s enough.'],
    gloomy: ['Unseen together. That\'s a sort of company.'], cheerful: ['Ha! Then I\'ll notice yours, and you notice mine. A bargain!'], dreamy: ['The unseen work holds the world up. Somebody said that. Maybe it was you.'],
  });
  W('work.day.hands', {
    ornery: ['Hmph. They\'ll say no. ...I\'ll ask anyway.'], proud: ['I\'ll put it to the Steward as a matter of good sense, not need.'],
    gloomy: ['They\'ll not listen. But I\'ll ask, and then I\'ll have asked.'], witty: ['I\'ll ask for six. Then I\'ll get two. That\'s how it works.'], curious: ['How many do you think? I\'ll work out what the trade really needs.'],
  });
  W('work.day.bristle', {
    witty: ['Kind of you. Next you\'ll tell the river to try flowing.'], gloomy: ['Begging. That\'s what it would be. No.'], shy: ['...I don\'t like to ask. Please don\'t make me.'],
  });
  W('work.day.hardest', {
    cheerful: ['Both! We race. I usually lose, and then I win the next one.'], ornery: ['Me. {WorkMate} does the talking about it.'], gloomy: ['Neither, the way the Steward tells it.'],
    curious: ['I\'ve been keeping a tally, actually. It\'s close.'], dreamy: ['The work sort of does itself, between us. Like a dance.'],
  });
  W('work.day.geton', {
    curious: ['We argue about the best way to do everything. It\'s the best part of the day.'], proud: ['{WorkMate} knows to listen to me, so yes.'], dreamy: ['We hum the same tune without meaning to. Is that getting on?'],
    'workRival': ['With {workMate}, yes. Not everyone in the trade, mind. Not {workRival}.'],
  });
  W('work.day.eased', {
    cheerful: ['Ha! You\'re right. And I\'d not swap them for the world.'], proud: ['I do bear them well. Thank you for noticing.'], witty: ['Thorns. I shall have that on my cushion.'],
    curious: ['Do they? What are a wizard\'s, then? No, I\'ll ask another day.'], dreamy: ['Thorns and roses. That\'s nicely put.'],
  });
  W('work.day.dayoff', {
    shy: ['...Could I? Nobody would mind? ...Maybe just an hour.'], gloomy: ['And find out nobody came. ...No. You\'re right. I\'ll try.'],
    witty: ['A pipe and a step and a wizard\'s permission. I\'d be a fool to refuse.'], dreamy: ['An afternoon with nothing in it. I\'d forgotten they existed.'], curious: ['An experiment! Who comes asking first. I\'ll keep notes.'],
  });
  W('work.day.noticed', {
    cheerful: ['Oh! Well. Now I feel daft for wondering. Thank you.'], witty: ['By teatime! Then I\'ll stop at elevenses and see what happens.'], dreamy: ['...That\'s a nice thing to carry about. I\'ll carry it.'],
    curious: ['Would they? Truly? How do you know?'],
  });
  W('work.how.open', {
    'stage=elder': ['How long have you been at the {jobWord}\'s work, {name}? Since the dawn of time?'],
    'workFamilyTrade': ['Is the {jobWord}\'s trade in the family, {name}?'],
  });
  W('work.how.jest', {
    'job=postie': ['I expect you wanted to read everyone\'s letters.'], 'job=storyteller': ['I expect you just liked the sound of your own voice.'],
  });
  W('work.how.greener', {
    cheerful: ['Ha! And the grass on this side is quite green enough.'], shy: ['...I suppose it does. Thank you.'], dreamy: ['Greener in the mist. Yes.'], proud: ['My side\'s green enough, thank you.'], gloomy: ['Both sides are muddy if you stand on them long enough.'],
  });
  W('work.how.time', {
    cheerful: ['A little time! I\'ll find it. Behind the flour bins, probably.'], ornery: ['Hmph. A little. Don\'t go telling anyone.'], shy: ['...Thank you. I\'ll remember.'], dreamy: ['A little time. That sounds like a song.'],
  });
  W('work.how.survive', { gloomy: ['Mostly. It\'s got a scar.'], shy: ['...We both did. Just about.'], witty: ['It survived. My dignity didn\'t.'] });
  W('work.how.now', { cheerful: ['I have! Haven\'t I! Ha!'], gloomy: ['Further than I thought. Not as far as I meant.'], witty: ['Now I drop things on purpose. It\'s called experience.'] });
  W('work.how.more', { cheerful: ['Ha! I could go on all day. Don\'t let me.'], proud: ['It\'s a good story, my coming to it. I tell it well.'], ornery: ['That\'s enough remembering for one day.'] });
  W('work.how.evening', { cheerful: ['An evening a week! Oh, I\'m going to love this.'], gloomy: ['I\'ll try. I don\'t expect much. I\'ll try.'], witty: ['A secret life. Every hobbit should have one.'], ornery: ['If anyone asks, I\'m doing the accounts.'] });
  W('work.how.beard', { cheerful: ['Ha! Oh, I wish I\'d seen it!'], shy: ['...Was he cross? I\'d have hidden for a year.'], proud: ['I never set fire to anything on my first day. Not one thing.'], gloomy: ['That\'s the trouble with beginnings. Somebody gets singed.'], curious: ['What spell was it meant to be?'] });
  W('work.how.kids', { cheerful: ['I\'d love it! We\'d sing the same work songs.'], shy: ['...I\'d not want them to feel they had to.'], curious: ['I\'d want them to try everything first. Then choose.'], dreamy: ['I\'d like to think of it going on, after me.'] });
  W('work.how.late', { cheerful: ['Too late? Ha! Never! ...Is it?'], proud: ['It\'s never too late for me.'], curious: ['I wonder. I\'d have to find out what it takes, now.'] });
  W('work.trouble.mollified', { cheerful: ['Ha! All right, I was a bit short. Go on.'], shy: ['...Sorry. Go on. Please.'], gloomy: ['Go on, then. Nothing else has worked.'] });
  W('work.trouble.askmate', { cheerful: ['Two heads! Three, with yours. Thank you.'], shy: ['...I\'ll try. {WorkMate} is kind. I\'ll try.'], gloomy: ['{WorkMate}\'ll say it\'s the weather. But I\'ll ask.'] });
  W('work.trouble.troll', { cheerful: ['Ha! A troll! I need the rest of that one.'], witty: ['They always marry a troll in your tales. It\'s suspicious.'], shy: ['...Was he a nice troll?'] });
  W('work.trouble.letknow', { cheerful: ['I will! Oh, I hope it works.'], ornery: ['If it doesn\'t, you\'ll hear about it.'], proud: ['When it works, I\'ll tell you.'], gloomy: ['I\'ll tell you when it doesn\'t.'] });
  W('work.trouble.notfault', { cheerful: ['Thank you! I\'d got myself in a proper state.'], ornery: ['No. It isn\'t. I said so.'], proud: ['Of course it isn\'t. ...Thank you.'], dreamy: ['Things just happen. I forget that.'] });
  W('work.trouble.bristle', { witty: ['Oh, splendid. Advice. Exactly what I was short of.'], gloomy: ['Everyone knows better. Everyone.'] });
  W('work.trouble.others', { shy: ['...I didn\'t want to bother anyone. You\'re the first.'], cheerful: ['Everyone! They all said something different. It was lovely, but no help.'], curious: ['I\'ve asked three people and got four answers.'] });
  W('work.trouble.taleheard', { witty: ['A tale! Good. I like my advice with a plot.'], dreamy: ['Oh, a tale. Yes, please.'], proud: ['Go on. Though I doubt she had it worse.'] });
  W('work.trouble.jested', { shy: ['...Oh. Yes. Ha.'], proud: ['It\'s not a laughing matter, wizard.'], gloomy: ['Very funny. It\'s still broken.'] });
  W('work.trouble.nocharge', { cheerful: ['Ha! You\'re a treasure, wizard.'], ornery: ['This time. I know your sort.'], 'job=orchardist': ['I\'ll owe you a pot of honey. A big one.'], 'job=herder': ['I\'ll owe you a cheese. A ripe one.'] });
  W('work.tools.mend', { 'job=woodwright': ['That edge wants a whetstone. Shall I show you a trick?'], 'job=postie': ['That strap\'s going. A stitch in time?'] });
  W('work.tools.comforted', { cheerful: ['They do, don\'t they! Oh, that\'s cheered me.'], shy: ['...Thank you.'], proud: ['They\'d better be good ones.'] });
  W('work.tools.jest', { 'job=tinker': ['Is it supposed to hum like that?'], 'job=lamplighter': ['Do you ever knock hats off with that?'] });
  W('work.tools.answer', { cheerful: ['Ha! It wags, nearly.'], shy: ['...Sometimes it seems to.'], gloomy: ['It never argues. That\'s more than I can say for folk.'] });
  W('work.tools.teach', { cheerful: ['Ooh! Yes. I\'d like that.'], gloomy: ['Who\'d want to learn from me? ...Somebody might.'], curious: ['I\'d have to work out how I do it first. Interesting.'] });
  W('work.tools.bristle', { shy: ['...I\'d rather you didn\'t. Sorry.'], gloomy: ['It\'s all I\'ve got that\'s really mine.'] });
  W('work.tools.kin', { cheerful: ['Kin! Ha! It\'s more reliable than my cousins.'], proud: ['Kin. Yes. It\'s earned that.'], ornery: ['Hmph. Kin don\'t usually do as they\'re told.'] });
});
