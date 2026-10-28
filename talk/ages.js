'use strict';
// ---------------------------------------------------------------------------
// The ages of life, part one: the elders. The old days and how Thistledown
// was, aches and pains, the advice they'd give, grandchildren, regrets and
// pride, the one they still miss, the last great adventure over the hills
// and what they'd like to be remembered for, and the wizard as an old friend.
// Gentle, warm, a little melancholy, never morbid: nobody here dies, they
// set off. The facts every ages pack uses are computed here (ageYears,
// ageBand, ageMissed, ageGrandkid, ageRoad and the rest); ages2 is youth,
// young grown-ups and the middle-aged, and ages3 the big questions folk ask
// the wizard.
// ---------------------------------------------------------------------------

talkPack('ages', () => {
  // a rule set from { _: fallback, <temper>: [...], 'k:<temper>': [...] (a youngster's nature) } plus extra rules
  const L = (key, o, extra) => {
    const rules = [];
    for (const k in o) {
      if (k === '_') rules.push({ text: o[k] });
      else if (k.startsWith('k:')) rules.push({ if: { ageNature: k.slice(2) }, text: o[k] });
      else rules.push({ if: { temper: k }, text: o[k] });
    }
    lines(key, rules.concat(extra || []));
  };
  const has = (x) => x != null && x !== false && x !== '';
  // a number in words, the way folk say it ("a hundred and seven")
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const numWord = (n) => {
    n = Math.max(0, Math.floor(n));
    if (n >= 200) return String(n);
    if (n >= 100) return n === 100 ? 'a hundred' : 'a hundred and ' + numWord(n - 100);
    if (n < 20) return ONES[n];
    return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  };

  // --- Facts: how old, who's gone, who's coming up behind ---------------------------
  addFacts((v, F) => {
    const y = v.years();
    F.ageYears = y;
    F.ageBand = v.stage === 'elder' ? 'elder' : v.isChild() ? (kidBand(v) === 'youth' ? 'youth' : 'child') : y < 50 ? 'young' : 'middle';
    F.ageGrown = v.isGrown() ? Math.max(0, y - 33) : null;
    F.ageToGo = v.isChild() ? Math.max(1, 33 - y) : null;
    F.ageToGoWord = F.ageToGo != null ? numWord(F.ageToGo) : null;
    F.ageYearsWord = numWord(y);
    F.ageMadeWord = numWord(F.made || 0);
    F.ageGrownWord = F.ageGrown != null ? numWord(F.ageGrown) : null;
    F.ageJobA = v.job && JOBS[v.job] ? aAn(JOBS[v.job].label.toLowerCase()) : null;
    F.ageNature = v.isChild() ? temperOf(v) : null;
    F.ageTrade = v.job ? ({ farmer: 'farming', miller: 'milling', baker: 'baking', brewer: 'brewing', innkeeper: 'innkeeping', grower: 'leaf-growing', fisher: 'fishing', woodwright: 'woodwork', herbalist: 'herb-craft', orchardist: 'orchard work', herder: 'herding', postie: 'mail round', storyteller: 'storytelling', tinker: 'tinkering', nanny: 'minding the little ones', lamplighter: 'lamplighting' }[v.job] || 'work') : null;
    F.ageFounder = v.isGrown() && !v.born && !(v.isRiftborn && v.isRiftborn());
    // the eldest in the village, and the littlest
    const live = Game.villagers.filter((o) => !o.leaving);
    const others = live.filter((o) => o !== v);
    const eldest = others.filter((o) => o.isGrown()).sort((a, b) => b.age - a.age)[0];
    F.ageEldest = eldest ? eldest.first : null;
    F.ageIsEldest = v.isGrown() && !others.some((o) => o.age > v.age);
    const little = others.filter((o) => o.stage === 'baby' || o.isChild()).sort((a, b) => a.age - b.age)[0];
    F.ageLittlest = little ? little.first : null;
    // grandchildren, the nearest to their heart first (one who can talk, if there is one)
    const kidIds = new Set(Game.villagers.filter((o) => o.parents.includes(v.id)).map((o) => o.id));
    for (const a of Object.values(Game.archive || {})) if (a.parents && a.parents.includes(v.id)) kidIds.add(a.id);
    const gks = live.filter((o) => o.parents.some((p) => kidIds.has(p))).sort((a, b) => (a.stage === 'baby') - (b.stage === 'baby') || (v.rel[b.id] ?? 0) - (v.rel[a.id] ?? 0));
    F.ageGrandkid = gks[0] ? gks[0].first : null;
    F.ageGrandkidId = gks[0] ? gks[0].id : null;
    F.ageGrandkidBaby = gks[0] ? gks[0].stage === 'baby' : null;
    F.ageGrandkids = gks.length;
    F.ageGrandkidsWord = numWord(gks.length);
    // the one they miss most, of those gone over the hills
    let best = null, bestP = 0;
    for (const a of Object.values(Game.archive || {})) {
      if (a.reason !== 'adventure' || a.id === v.id) continue;
      const f = a.genes && a.genes.sex === 'f';
      let rel = null, p = 0;
      if (a.spouse === v.id || v.spouse === a.id) { rel = f ? 'wife' : 'husband'; p = 6; }
      else if (v.parents.includes(a.id)) { rel = f ? 'mother' : 'father'; p = 5; }
      else if (a.parents && a.parents.includes(v.id)) { rel = f ? 'daughter' : 'son'; p = 4; }
      else if (v.parents.length && a.parents && a.parents.some((x) => v.parents.includes(x))) { rel = f ? 'sister' : 'brother'; p = 3; }
      else if (v.parents.some((pid) => { const pp = personById(pid) || (Game.archive || {})[pid]; return pp && pp.parents && pp.parents.includes(a.id); })) { rel = f ? 'grandmother' : 'grandfather'; p = 2.5; }
      else if ((v.rel[a.id] ?? 0) > 0.5) { rel = 'friend'; p = 1 + v.rel[a.id]; }
      if (rel && (p > bestP || (p === bestP && best && a.left > best.a.left))) { best = { a, rel }; bestP = p; }
    }
    F.ageMissed = best ? best.a.first : null;
    F.ageMissedRel = best ? best.rel : null;
    F.ageMissedJob = best && best.a.job && JOBS[best.a.job] ? JOBS[best.a.job].label.toLowerCase() : null;
    F.ageMissedLately = best ? Game.day - (best.a.left || 0) <= 3 : null;
    F.ageMissedStone = best ? !!(typeof memorialFor === 'function' && memorialFor(best.a.id)) : null;
    F.ageDeparted = Object.values(Game.archive || {}).filter((a) => a.reason === 'adventure').length;
    F.ageDepartedWord = numWord(F.ageDeparted);
    // the last road: decided, near, or a long way off yet
    const planned = (Game.farewells || []).some((f) => f.id === v.id || f.comp === v.id);
    const leaveAge = ADVENTURE_DAYS * (0.85 + (v.genes.longevity || 0.5) * 0.35);
    F.ageRoad = v.stage !== 'elder' ? null : planned ? 'planned' : v.age >= leaveAge - 2.5 ? 'near' : 'far';
    // what was handed down to them, and the memory that's stayed
    const hl = v.heirlooms && v.heirlooms.length ? v.heirlooms[v.heirlooms.length - 1] : null;
    F.ageKeepsake = hl ? hl.name : null;
    const old = (v.memories || []).filter((m) => Game.day - m.d >= 2 && Math.abs(m.v || 0) >= 1.5 && !/pat|tutted/i.test(m.t)).sort((a, b) => Math.abs(b.v) - Math.abs(a.v) || a.d - b.d)[0];
    F.ageMemory = old ? old.t.replace(/\.$/, '') : null;
    F.ageMemoryGood = old ? old.v > 0 : null;
    // the road, for the young: trips made, and who's away on one now
    F.ageTrips = (v.stats && v.stats.trips) || 0;
    const away = (Game.away || []).find((a) => a.id !== v.id && a.data);
    F.ageAway = away ? away.data.first : null;
    const sw = v.sweetheart != null && v.sweetheart !== v.spouse ? personById(v.sweetheart) : null;
    F.ageSweetheart = sw ? sw.first : null;
    F.ageSweetheartId = sw ? sw.id : null;
    // a parent getting on, for the middle-aged
    const op = v.parents.map(personById).filter((o) => o && o.stage === 'elder' && !o.leaving)[0];
    F.ageOldParent = op ? op.first : null;
    F.ageOldParentWord = op ? (op.genes.sex === 'f' ? 'mother' : 'father') : null;
    F.ageOldParentId = op ? op.id : null;
    F.ageParentId = v.parents.map(personById).filter((o) => o && !o.leaving && o.homeId !== v.homeId)[0]?.id ?? null;
  });

  // Looking in on someone you promised you'd look in on: kept when you've talked with them since.
  addPromiseCheck('ages.lookin', (v, p) => {
    const [, , id, talks] = p.k.split('.');
    const o = personById(+id);
    if (!o) return null;
    const b = (Game.wizBond || {})[+id];
    return b && (b.talks || 0) > +talks ? 'kept' : null;
  });
  const promiseLookIn = (T, v, id, t) => {
    const o = personById(id);
    if (!o) return;
    const b = bondFull(v), ob = bondOf(o);
    const k = `ages.lookin.${id}.${ob.talks || 0}`;
    if (b.promises.some((x) => x.k.startsWith(`ages.lookin.${id}.`) && x.state === 'open')) return;
    b.promises.unshift({ k, t: t.replace('{who}', o.first), d: Game.day, due: Game.day + 4, state: 'open' });
    T.log.push({ who: 'note', text: `${v.first} will remember that.` });
  };

  // ==================================================================================
  // The old days: what Thistledown was like, back then
  // ==================================================================================
  addThread({
    id: 'ages.olddays', label: 'What was it like here, in the old days?', reveals: 'ages.olddays', weight: 1.2, cool: 4,
    when: (F) => F.stage === 'elder' || (F.stage === 'grown' && F.ageYears >= 72),
    rel: (F) => (F.ageFounder ? 1.6 : 1.2) * (F.stage === 'elder' ? 1.2 : 1),
    open: { ask: 'ages.olddays.open' },
    beats: {
      start: { line: 'ages.olddays.start', go: [
        { ap: 'ask', say: 'You were here at the very start, weren\'t you?', to: 'founding', need: { if: { ageFounder: true } } },
        { ap: 'ask', say: 'Who was here, in those days?', to: 'people' },
        { ap: 'jest', say: 'And you walked to the well uphill both ways, I suppose.', to: 'uphill' },
        { ap: 'listen', say: '*You lean on your staff and let them remember.*', label: 'Let them remember', to: 'whole' },
      ] },
      founding: { line: 'ages.olddays.founding', notice: 'ages.olddays.notice', go: [
        { ap: 'ask', say: 'And the first winter? How did you manage?', to: 'winter' },
        { ap: 'warm', say: 'You built something good here. It shows.', to: 'proud' },
        { ap: 'tale', say: 'I remember this valley before any of you. Thistles, mostly.', to: 'thistles' },
      ] },
      people: { line: 'ages.olddays.people', go: [
        { ap: 'ask', say: 'Tell me about {ageMissed}.', to: 'missed', need: { if: { ageMissed: has } } },
        { ap: 'jest', say: 'Were they all as stubborn as you?', to: 'stubborn' },
        { ap: 'warm', say: 'They\'d be proud of how it\'s turned out.', to: 'proud' },
      ] },
      uphill: { line: 'ages.olddays.uphill', go: [
        { ap: 'jest', say: 'In the snow? In summer?', to: 'snow' },
        { ap: 'ask', say: 'All right, all right. What was it really like?', to: 'whole' },
      ] },
      snow: { line: 'ages.olddays.snow', fx: { joke: { k: 'ages.uphill', t: 'Uphill to the well, both ways, in the snow, in summer.' } }, go: [
        { ap: 'ask', say: 'Go on, then. The truth, this time.', to: 'whole' },
        { ap: 'warm', say: 'You tell it better every time, I expect.', to: 'end' },
      ] },
      whole: { line: 'ages.olddays.whole', fx: { learn: ['ages.olddays', '{Name} remembers Thistledown when it was small'] }, go: [
        { ap: 'ask', say: 'And did I come by, in those days?', to: 'wizard', need: { open: 2 }, soft: true },
        { ap: 'ask', say: 'Do you miss it? The way it was?', to: 'miss' },
        { ap: 'share', say: 'I\'ve seen many villages grow. This one grew kindly.', to: 'kindly' },
      ] },
      winter: { line: 'ages.olddays.winter', go: [
        { ap: 'warm', say: 'And here you all are. Every one of you came through.', to: 'proud' },
        { ap: 'ask', say: 'Do you miss it? Those first days?', to: 'miss' },
      ] },
      thistles: { line: 'ages.olddays.thistles', fx: { joke: { k: 'ages.thistles', t: 'The wizard remembers when it was all thistles.' }, fond: 0.02 }, go: [
        { ap: 'jest', say: 'Thistledown. Somebody had a very literal mind.', to: 'end' },
        { ap: 'ask', say: 'And did I come by, after you\'d settled?', to: 'wizard' },
      ] },
      missed: { line: 'ages.olddays.missed', fx: { trust: 0.02 }, go: [
        { ap: 'comfort', say: 'They\'re still here, a bit. In you.', to: 'end' },
        { ap: 'ask', say: 'Do you miss the old days, or the old faces?', to: 'miss' },
      ] },
      stubborn: { line: 'ages.olddays.stubborn', go: [
        { ap: 'jest', say: 'Then the valley\'s never been short of mules.', to: 'end' },
        { ap: 'warm', say: 'It takes stubborn folk to start a village.', to: 'proud' },
      ] },
      miss: { line: 'ages.olddays.miss', go: [
        { ap: 'comfort', say: 'The old days were good because you were in them.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'jest', say: 'You miss the pig, don\'t you. Admit it.', to: 'pig' },
      ] },
      kindly: { line: 'ages.olddays.kindly', fx: { trust: 0.02 }, end: true },
      proud: { line: 'ages.olddays.proud', fx: { fond: 0.02 }, end: true },
      pig: { line: 'ages.olddays.pig', fx: { joke: { k: 'ages.pig', t: 'The pig called Duchess, who ran the village.' } }, end: true },
      wizard: { line: 'ages.olddays.wizard', fx: { trust: 0.03, remember: 'Told the wizard about the old days. He remembered too.', rv: 1 }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  lines('ages.olddays.open', [
    { text: ['What was it like here, {name}, in the old days?', 'Tell me how Thistledown was, {name}, when you were young.', 'You\'ve seen this place change, {name}. What was it like before?'] },
    { if: { ageFounder: true }, text: ['You were here before the lanes had names, {name}. What was it like?', 'Tell me about the beginning, {name}. The very first days.'] },
  ]);
  L('ages.olddays.start', {
    _: ['Smaller. Quieter. Three holes and a pig, near enough.', 'Oh, it was all fields then. You could see the river from anywhere.', 'Different. Not better, mind. Different.'],
    cheerful: ['Oh, lovely! Muddy, cold and lovely. We sang all the time. Nothing else to do.', 'Grand days! Everyone knew everyone, and everyone\'s business.'],
    ornery: ['Better. Quieter. Folk minded their own business and their own hedges.', 'Nobody asked me what it was like then either. Now everyone does.'],
    shy: ['...Quiet. I liked it quiet. You could hear the river from bed.', 'Smaller. I knew every face. I don\'t, now.'],
    curious: ['Do you know, I\'ve been trying to remember exactly. The well was further up, I\'m sure of it.', 'Ah! Where to begin. The mill was the other side, did you know?'],
    dreamy: ['Golden. Everything was golden. It probably wasn\'t, but that\'s how I see it.', 'The summers were longer. I\'m sure of it. Longer and slower.'],
    witty: ['Much the same, only with fewer people asking me what it was like.', 'Smaller. Like me, now. We\'re both shrinking.'],
    proud: ['We built it, you know. With our own hands. Every hole on this hill.', 'Hard. Hard and honest. We made something out of nothing.'],
    gloomy: ['Better. Everything was better. Even the rain.', 'You don\'t want to hear an old hobbit go on.'],
  }, [
    { if: { ageFounder: true }, text: ['There was nothing here. A hill, a river and an argument about where to dig.', 'When we came there wasn\'t a lane. We walked where the sheep walked.'] },
    { if: { ageFounder: true, temper: 'proud' }, text: ['I dug the first hole in this hill. Well. The second. The first one flooded.'] },
    { if: { ageIsEldest: true }, text: ['I\'m the last who remembers, you know. So I\'d better tell it right.', 'Nobody else left who saw it. That makes me the authority.'] },
    { if: { rift: true }, text: ['Old days? Mine were in the city. Signal everywhere, sky never dark. This is the new days.', 'Back home I\'d have called this "off-grid". Now I call it home.'] },
    { if: { season: 'winter' }, text: ['The winters were harder. We had one fire for three holes and nobody complained. Much.'] },
    { if: { season: 'summer' }, text: ['Summers like this one, but quieter. You could hear bees from the square.'] },
  ]);
  L('ages.olddays.founding', {
    _: ['We came over the ridge with a cart and a goat. The goat wanted to stay. So we stayed.', 'The first hole was dug in a week. It leaked for a year.'],
    cheerful: ['Oh, it was an adventure! We slept under the cart and laughed till our ribs hurt.', 'We had nothing and it was wonderful. Well. Mostly wonderful.'],
    ornery: ['Hard work, that\'s what. Nobody writes songs about digging. They should.', 'Everyone had an opinion about where to dig. I was right, as it happens.'],
    shy: ['...I carried stones. I didn\'t say much. I liked carrying stones.', 'I remember the first night under a roof. I cried a bit. Don\'t tell.'],
    curious: ['We tried three hills first. This one drained best. I tested it with a bucket.', 'I kept a book of it. Which way the wind blew, where the frost lay. Still have it.'],
    dreamy: ['I stood on that knoll and saw the whole village in my head. Then we built it.', 'The first morning, mist on the river, and I thought: here. It has to be here.'],
    witty: ['We argued for a week about the name. Then someone sat on a thistle.', 'First hole we dug, we dug into a badger. He had prior claim, he said.'],
    proud: ['I laid the first doorstep. You can still see my thumbprint if you look.', 'Every lane you walk on, somebody like me walked first. Remember that.'],
    gloomy: ['It rained for a month. We thought we\'d made a terrible mistake.', 'Half the first crop rotted. We nearly gave it up.'],
  }, [
    { if: { job: 'farmer' }, text: ['I turned the first furrow in that bottom field. Crooked as a dog\'s leg, and it still is.'] },
    { if: { job: 'woodwright' }, text: ['I framed the first door. Round, of course. Took me four goes to get it round.'] },
    { if: { job: 'baker' }, text: ['I baked the first loaf in a hole in the bank. It was terrible. We ate every crumb.'] },
  ]);
  lines('ages.olddays.notice', [
    { text: ['They\'re looking up at the hill as they talk, as if counting the doors.'] },
    { if: { temper: 'proud' }, text: ['Their chin has come up a little.'] },
    { if: { temper: 'dreamy' }, text: ['Their eyes have gone somewhere far off and long ago.'] },
  ]);
  L('ages.olddays.people', {
    _: ['Old Hal at the mill, the Proudfoot sisters, a mail carrier with one boot. Characters, all of them.', 'Fewer of us, and louder. We had to be, to fill the place.'],
    cheerful: ['Oh, such folk! There was a miller who sang to his flour. Said it rose better.', 'We had a cook who could feed twenty on one pig. And did, every Highday.'],
    ornery: ['Proper folk. Didn\'t need the wizard to tell them how to live.', 'Folk who\'d lend you a spade and expect it back clean. Not like now.'],
    shy: ['Kind ones. Nobody made you talk if you didn\'t want to.', 'There was an old aunt who let me sit in her kitchen and say nothing. I loved her for it.'],
    curious: ['A tinker who knew every road to Bree, and a herbalist who\'d eat anything once.', 'I used to follow the old storyteller about. He knew where every name came from.'],
    dreamy: ['They were giants, to me. Every one of them. Now I\'m the giant, and I don\'t feel it.', 'The faces come back at night, sometimes. All of them laughing at something.'],
    witty: ['A brewer who couldn\'t hold his own ale, and an innkeeper who couldn\'t count. Happy times.', 'Characters. We didn\'t call them that then. We called them the neighbors.'],
    proud: ['Good stock. Hard workers. The kind who built things that last.', 'My people. The best in the valley. We still are, mostly.'],
    gloomy: ['Most of them have gone over the hills now. I\'m the one who stayed.', 'Gone, mostly. I count the stones on the Green sometimes.'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['{AgeMissed} was here then. My {ageMissedRel}. You\'d have liked {ageMissed}.', 'My {ageMissedRel}, {ageMissed}, knew everyone. Knew all their secrets too.'] },
    { if: { ageMissed: has, ageMissedJob: has }, pri: 1, text: ['{AgeMissed} was the {ageMissedJob} then. Best there was. My {ageMissedRel}, you know.'] },
    { if: { ageDeparted: { min: 4 } }, text: ['There are {ageDepartedWord} stones on the Green now. I knew every one of them.'] },
  ]);
  L('ages.olddays.uphill', {
    _: ['Ha! You\'ve heard me before, then.', 'Both ways! And we were grateful for the hill.'],
    cheerful: ['Ha! Uphill both ways, and singing the whole time. We were happy, mind.', 'Uphill both ways! And we carried the bucket in our teeth!'],
    ornery: ['Laugh all you like. It was a steep well.', 'You weren\'t carrying the bucket, were you, wizard.'],
    shy: ['...It was a bit uphill. Only one way, though.', 'Oh. Ha. Well. It was quite a hill.'],
    curious: ['Strictly speaking it was uphill one way. I measured. Coming back you slid.', 'Uphill both ways? Is that possible? I\'ve often wondered.'],
    dreamy: ['We sang going up and sang coming down. I miss that hill.', 'It felt uphill both ways. Everything does, at that age.'],
    witty: ['Uphill both ways, in the dark, with a bucket full of holes. We were glad of the holes.', 'Uphill both ways. It was a very confused hill.'],
    proud: ['We did, as a matter of fact. It built character. Look at mine.', 'Yes. And we never complained. Unlike some.'],
    gloomy: ['It felt like it. Everything felt uphill.', 'Laugh. My knees remember that well.'],
  });
  L('ages.olddays.snow', {
    _: ['In the snow, in summer, with a goat on my back. And I was glad of it!', 'Snow in summer, hail at harvest. You young things have it easy.'],
    cheerful: ['In the snow! In summer! And we called it a vacation!', 'Ha! Snow up to the eyebrows and a smile on every face.'],
    ornery: ['Very funny. Now you\'re just making it up for me.', 'Snow every day of the year. You\'d have lasted a week.'],
    shy: ['...There was snow once in Afterlithe. I\'m not making that up.', 'Ha. You\'re teasing. That\'s all right.'],
    curious: ['There was one summer snow, actually. I wrote down the date. Somewhere.', 'Snow in summer! It happened once. The weather was very confused that year.'],
    dreamy: ['Summer snow. It sounds like a story. Maybe it was.', 'Snowflakes on the elderflowers. I\'m sure I saw it. I\'m nearly sure.'],
    witty: ['In summer, in the snow, and the snow was uphill too.', 'Snow, sleet, frogs. Frogs were the worst. Very slippery, frogs.'],
    proud: ['We walked through worse. And we were the better for it.', 'Snow never stopped us. Nothing did.'],
    gloomy: ['It was always snowing, in my memory. Funny, that.', 'Snow, rain. One long winter, the old days.'],
  });
  L('ages.olddays.whole', {
    _: ['Smaller. Every evening at the Badger, all of us at one table. One table!', 'You knew everyone\'s name, and their mother\'s, and what they had for tea.'],
    cheerful: ['Oh, the dances! One fiddle and a barrel, and we danced till the cockerel gave up.', 'Every birthday was everybody\'s birthday. There weren\'t enough of us to go round.'],
    ornery: ['Quiet. No rifts, no humming boxes, no wizards. Present company excepted.', 'Folk worked till dark and slept till light. Nobody needed telling.'],
    shy: ['...There was a field where the square is now. I used to lie in it and watch the clouds.', 'It was quiet. You could be alone without trying. I miss that, a little.'],
    curious: ['The river ran the other side of the alders then. It moves, you know. Slowly. I\'ve watched.', 'We had no Store. Everyone kept their own, and borrowed everybody else\'s.'],
    dreamy: ['The light. The evening light came all the way down the valley. It still does. I just see less of it.', 'Lanterns on sticks and a song going round. It felt like the whole world was here.'],
    witty: ['Smaller. Quieter. Fewer people asking me how it used to be.', 'We had one cart. It belonged to everyone, so nobody ever greased it.'],
    proud: ['Hard work, plain food, and a good word for your neighbor. That was the village.', 'We built every bit of it. The square, the mill, the lanes. Our hands.'],
    gloomy: ['Better, in most ways. I don\'t know what we\'ve gained, honestly.', 'Kinder. Quieter. I suppose everyone says that.'],
  }, [
    { if: { ageMemory: has, ageMemoryGood: true }, pri: 1, text: ['I wrote it down once: "{ageMemory}." I read it over sometimes.', 'Do you know what I think of most? "{AgeMemory}." Funny what sticks.'] },
    { if: { ageMemory: has, ageMemoryGood: false }, pri: 1, text: ['Not all good, mind. "{AgeMemory}." That one still smarts.'] },
    { if: { rift: true }, text: ['Back in Neverdark the old days were last week. Everything was new every week.', 'In the city nobody remembered anything. It all got overwritten. Here, the old folk remember.'] },
  ]);
  L('ages.olddays.winter', {
    _: ['We all slept in one hole, the four families, and told stories till the fire went out.', 'We ate turnips. All winter. I still can\'t look a turnip in the eye.'],
    cheerful: ['Oh, we laughed! Twelve of us round one fire. Someone was always on your feet.', 'Snowball fights every morning. It kept us warm, and kept us sane.'],
    ornery: ['We managed because nobody complained. Well. I complained. It helped.', 'Turnips and patience. Mostly turnips.'],
    shy: ['...I sat by the fire and mended everyone\'s socks. It was the best winter of my life.', 'Quietly. We were all very quiet that winter. Saving our breath.'],
    curious: ['We worked out the hill held its warmth if you dug deep enough. Took us till spring.', 'We tried smoking fish in the chimney. Learned a great deal about chimneys.'],
    dreamy: ['The river froze and the stars were so near you could hear them.', 'Snow over the door every morning. We dug out like rabbits, blinking.'],
    witty: ['Turnip soup, turnip bread, turnip pie. By spring we\'d gone a bit turnip ourselves.', 'We kept warm arguing. Very efficient. Hobbits can argue for hours.'],
    proud: ['We shared everything. Not one of us went without. Not one.', 'Nobody had to be told twice to bring wood. That\'s how it was done.'],
    gloomy: ['Barely. We barely managed. I don\'t talk about it much.', 'Cold. Hungry. We lost the goat. I still think about that goat.'],
  });
  L('ages.olddays.thistles', {
    _: ['You never! Thistles? So that\'s where the name came from.', 'Ha! Before us? How old ARE you?'],
    cheerful: ['Thistles! Ha! Well, we got most of them out. Most.', 'Oh, that\'s marvelous. I\'ll tell the grandchildren the wizard saw the thistles.'],
    ornery: ['Thistles. And whose job do you suppose it was to dig them up? Mine.', 'Don\'t tell me. You stood there and watched us dig them out.'],
    shy: ['...Really? You were here? Before?', 'Oh. I always wondered what was here before.'],
    curious: ['Truly? What else? Was the river where it is? Were there trees on the hill?', 'You must tell me everything. I\'ve a book. I\'ll need a new page.'],
    dreamy: ['A valley of thistles, waiting for us. That\'s rather lovely.', 'All that purple, and no one to see it. Except you.'],
    witty: ['And you didn\'t think to mention it before we\'d named the place?', 'Thistles! And here I thought we were being poetic.'],
    proud: ['And look at it now. We did that.', 'Thistles to this. Not bad, for a handful of hobbits and a goat.'],
    gloomy: ['And now there are more of us than thistles. I\'m not sure that\'s better.', 'Thistles. We still get them in the lower field. They\'re waiting to take it back.'],
  });
  L('ages.olddays.missed', {
    _: ['{AgeMissed}? Oh, the best of us. Laughed like a door banging.', '{AgeMissed} could make a feast out of a cabbage and a joke.'],
    cheerful: ['{AgeMissed} would dance on a table at the drop of a hat. Any hat.', 'Oh, {ageMissed}! Never once let me win at checkers. Not once!'],
    ornery: ['{AgeMissed} was the only one who ever told me I was wrong and lived.', 'Stubborn as a gatepost, {ageMissed}. I miss arguing with {ageMissed}.'],
    shy: ['...{AgeMissed} always saved me a seat. Always. I never had to ask.', '{AgeMissed} talked for both of us. I didn\'t mind.'],
    curious: ['{AgeMissed} knew the name of every bird in the valley. I\'m still learning them.', '{AgeMissed} taught me to read the weather off the river.'],
    dreamy: ['I still hear {ageMissed} singing, sometimes, when the wind\'s from the west.', '{AgeMissed} had a way of looking at a sunset as if it were a present.'],
    witty: ['{AgeMissed} was the funniest hobbit in Thistledown. Second funniest. I\'m here.', '{AgeMissed} once got the Badger to sing a song about its own beer.'],
    proud: ['{AgeMissed} taught me everything worth knowing. The rest I taught myself.', 'There\'s nobody now like {ageMissed}. They don\'t make them like that.'],
    gloomy: ['I don\'t talk about {ageMissed} much. It\'s... it\'s still too near.', 'The lane\'s been quieter since {ageMissed} went.'],
  }, [
    { if: { ageMissedLately: true }, pri: 1, text: ['{AgeMissed} only went the other day. I keep turning round to tell {ageMissed} things.'] },
  ]);
  L('ages.olddays.stubborn', {
    _: ['Worse! I\'m the soft one, if you can believe it.', 'Stubborn? We were mules with waistcoats.'],
    cheerful: ['Worse! Twice as stubborn and three times as loud. Lovely people.', 'Ha! I\'m a pussycat next to them.'],
    ornery: ['Stubborn? We were right. There\'s a difference.', 'Stubborn is what you call someone who won\'t do what you want.'],
    shy: ['...More. I was the least stubborn. Nobody noticed.', 'Oh, much more. I just went along. Mostly.'],
    curious: ['Interesting question. I think we had to be. Soft folk would have gone home.', 'Stubborn, yes. I wonder if it\'s in the water here.'],
    dreamy: ['Stubborn about the right things. Love, and land, and supper.', 'Stubborn as roots. That\'s how you hold a hill.'],
    witty: ['We once argued for three days about a gate. The gate won.', 'I was the reasonable one. Ask anyone. Anyone who\'s left.'],
    proud: ['Determined. The word is determined.', 'Stubborn is how you build a village. Soft is how you lose one.'],
    gloomy: ['Stubborn, yes. Stubborn and gone.', 'They were. I\'m all that\'s left of the stubbornness.'],
  });
  L('ages.olddays.miss', {
    _: ['Some of it. The faces more than the days.', 'I miss being young in it. That\'s the truth.'],
    cheerful: ['Miss it? No! Well, the dancing. And the pies. But this is grand too!', 'Not really. Every day\'s a good day, if you look at it right.'],
    ornery: ['I miss the quiet. And the respect. And the old ale.', 'I miss folk minding their own. Not that you\'d know.'],
    shy: ['...I miss knowing everyone. There are so many new faces.', 'I miss how small it was. Small felt safe.'],
    curious: ['I miss not knowing what came next. Now I mostly know.', 'I don\'t miss it so much as wonder about it.'],
    dreamy: ['I miss the light, and the people in it. Every evening.', 'Every day, a little. It\'s a nice sort of missing.'],
    witty: ['I miss my knees. My knees were fantastic.', 'I miss having hair. Otherwise it\'s much the same.'],
    proud: ['I don\'t miss it. I made it. There\'s a difference.', 'Miss it? It\'s all still here. Under the new paint.'],
    gloomy: ['Every day. Every single day.', 'I miss everyone I ever knew. That\'s the trouble with lasting.'],
  }, [
    { if: { ageMissed: has }, text: ['I miss {ageMissed}. That\'s what I miss. The rest is just weather.'] },
  ]);
  L('ages.olddays.kindly', {
    _: ['Kindly. I like that. I\'ll have that on my stone.', 'It did, didn\'t it? We were lucky.'],
    cheerful: ['Kindly! Oh, that\'s nice. That\'s very nice.', 'It did! It grew like a good loaf. Slow and warm.'],
    ornery: ['Kindly. Hmph. You didn\'t see the arguments about the drains.', 'Grew kindly. Grew loud, more like. But kindly, yes.'],
    shy: ['...Thank you. I think so too.', 'That\'s the nicest thing anyone\'s said about it.'],
    curious: ['What makes a village grow unkindly, I wonder? I\'d like to know.', 'Kindly. I\'ll have to think what that means. I think it\'s right.'],
    dreamy: ['Kindly. Like a garden left to itself, but loved.', 'Oh, I\'m going to remember you said that.'],
    witty: ['Kindly. Unlike my knees.', 'High praise from a wizard. You\'ve seen some nasty villages, I suppose.'],
    proud: ['Of course it did. We saw to that.', 'Kindly, and well. We did right by it.'],
    gloomy: ['Kindly. Yes. Mostly. I suppose it did.', 'I hope it stays that way. Things change.'],
  });
  L('ages.olddays.proud', {
    _: ['I hope so. I like to think they look down from somewhere with a pie.', 'They would. They\'d grumble first, then be proud.'],
    cheerful: ['They would! They\'d throw a party about it. Any excuse.', 'Oh, I hope so. I do hope so.'],
    ornery: ['Proud? They\'d have complaints. But they\'d be proud.', 'They\'d say the new lane\'s crooked. It is crooked.'],
    shy: ['...I hope so. That\'s nice to think.', 'I think so too. Quietly.'],
    curious: ['I wonder what they\'d make of the rift-folk. Wouldn\'t that be something to see.', 'Proud, and puzzled. Mostly puzzled.'],
    dreamy: ['I tell them about it. In my head. Every evening.', 'Somewhere over the hills, I think they know.'],
    witty: ['Proud, and jealous of the new privy.', 'They\'d be proud and claim all the credit.'],
    proud: ['They should be. It\'s the finest village this side of the Water.', 'Proud? It\'s their village. Of course they would be.'],
    gloomy: ['Maybe. If they could see it. Who knows.', 'I like to think so. It\'s all I can do.'],
  });
  L('ages.olddays.pig', {
    _: ['Duchess. She ran the village. We just lived in it.', 'I do miss that pig. Best judge of character I ever met.'],
    cheerful: ['Duchess! Ha! She ate a whole wedding cake once. Best wedding we ever had.', 'Oh, I miss Duchess. She used to come when you sang.'],
    ornery: ['I miss the pig more than most of the people. There, I said it.', 'Duchess had more sense than the whole Moot.'],
    shy: ['...She used to lean on my legs. I liked that.', 'I did love that pig.'],
    curious: ['Duchess could open any gate. Never worked out how. Still wondering.', 'She could smell rain a day off. I took notes.'],
    dreamy: ['Duchess, asleep in the sun by the well. That\'s the old days to me.'],
    witty: ['Duchess. She chaired the Moot for two years and nobody noticed.', 'The pig, the pig. Everyone remembers the pig. Nobody remembers my poems.'],
    proud: ['Our Duchess won Best in Show at Bywater. Three times.', 'Finest pig in the Shire. We were known for her.'],
    gloomy: ['Duchess. Yes. Even the pig\'s gone over the hills, in a manner of speaking.', 'The pig. Ha. Yes. I miss the pig.'],
  });
  L('ages.olddays.wizard', {
    _: ['You did! A cart of fireworks, and a dragon over the river. I was this high.', 'You came at midsummer, once. Lit the sky green. Nobody slept for a week.'],
    cheerful: ['You did! You set off a rocket that went down the chimney of the Badger! Best night ever!', 'I remember! You made the smoke rings into ships. I chased them to the river.'],
    ornery: ['You did. You set fire to my father\'s hedge. He never forgave you. I did.', 'You came. You made a mess. You left. Some things don\'t change.'],
    shy: ['...You gave me a sparkler once. I was too scared to hold it. You held it for me.', 'You came. I hid under the table. I watched your boots.'],
    curious: ['You did! I asked you how the colors worked. You said "practice". I\'ve never forgotten.', 'You came every few summers. I tried to work out which. I never could.'],
    dreamy: ['You came the summer I was nine. A butterfly made of light. I\'ve chased that ever since.', 'You did. And the sky was full of flowers. I thought it was the end of the world, in a good way.'],
    witty: ['You came and told us a wizard is never late. You were four days late.', 'You did. My granddad called you "that tall nuisance". With great affection.'],
    proud: ['You came for my coming of age. Gave me a rocket all of my own. I still have the stick.', 'You came to see us, specially. We were the envy of the Shire.'],
    gloomy: ['You came. Then you went. Folk do.', 'You did, once or twice. I thought you\'d forgotten us after.'],
  }, [
    { if: { ageFounder: true }, text: ['You came the first summer, and stood on the hill, and said "it\'ll do". We took that as a blessing.'] },
  ]);

  // ==================================================================================
  // Aches and pains: the old bones
  // ==================================================================================
  addThread({
    id: 'ages.aches', label: 'How are the old bones?', weight: 1.1, cool: 3,
    when: (F) => F.stage === 'elder' || (F.stage === 'grown' && F.ageYears >= 78),
    rel: (F) => (F.stage === 'elder' ? 1.3 : 0.8) * (F.weather === 'rain' || F.season === 'winter' ? 1.3 : 1),
    open: { warm: 'ages.aches.open' },
    beats: {
      start: { line: 'ages.aches.start', go: [
        { ap: 'comfort', say: 'Come and sit a while. The wall\'s warm.', to: 'sit' },
        { ap: 'jest', say: 'Knees that forecast weather. You\'ll put the almanac out of work.', to: 'forecast' },
        { ap: 'advise', say: 'Have you been to see the herbalist?', to: 'herbalist' },
        { ap: 'share', say: 'My knees were creaking before your grandmother was born.', to: 'wizknees' },
      ] },
      sit: { line: 'ages.aches.sit', fx: { drive: { tired: -0.08 } }, go: [
        { ap: 'ask', say: 'What\'s the worst of it, really?', to: 'worst', need: { open: 1 }, soft: true },
        { ap: 'listen', say: '*You sit beside them and say nothing at all.*', label: 'Sit with them', to: 'grumble' },
        { ap: 'jest', say: 'This wall and I go back a long way.', to: 'wall' },
      ] },
      forecast: { line: 'ages.aches.forecast', go: [
        { ap: 'jest', say: 'Rain by teatime, then?', to: 'rain' },
        { ap: 'ask', say: 'And truly? How bad is it?', to: 'worst' },
      ] },
      herbalist: { line: 'ages.aches.herbalist', go: [
        { ap: 'advise', say: 'Willow-bark tea, and a hot stone in the bed.', to: 'remedy' },
        { ap: 'jest', say: 'I could magic you new knees. Slightly used.', to: 'newknees' },
      ] },
      wizknees: { line: 'ages.aches.wizknees', fx: { open: 1 }, go: [
        { ap: 'jest', say: 'Old enough to know better. Young enough to do it anyway.', to: 'better' },
        { ap: 'share', say: 'Old enough that I stopped counting. Some mornings the stairs win.', to: 'stairs' },
      ] },
      grumble: { line: 'ages.aches.grumble', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'What\'s the worst of it, really?', to: 'worst' },
        { ap: 'warm', say: 'You\'re good company, creaks and all.', to: 'company' },
      ] },
      wall: { line: 'ages.aches.wall', go: [
        { ap: 'ask', say: 'Truly, though. What\'s the worst of it?', to: 'worst' },
        { ap: 'warm', say: 'We\'ll sit here till the sun goes. Wall permitting.', to: 'company' },
      ] },
      worst: { line: 'ages.aches.worst', fx: { learn: ['trouble', 'getting old and slow'] }, go: [
        { ap: 'comfort', say: 'Nobody here thinks less of you. Quite the reverse.', to: 'useful' },
        { ap: 'advise', say: 'Then teach it. Hands that can\'t, can still show.', to: 'teach' },
        { ap: 'share', say: 'I\'ve outlived three staffs. I lean on this one more than I let on.', to: 'staff', need: { open: 2 } },
      ] },
      rain: { line: 'ages.aches.rain', fx: { joke: { k: 'ages.knees', t: 'Their knees and the wizard\'s: the best weather-glass in the Shire.' } }, end: true },
      remedy: { line: 'ages.aches.remedy', fx: { respect: 0.02 }, end: true },
      newknees: { line: 'ages.aches.newknees', end: true },
      better: { line: 'ages.aches.better', fx: { fond: 0.02 }, end: true },
      stairs: { line: 'ages.aches.stairs', fx: { trust: 0.03 }, end: true },
      company: { line: 'ages.aches.company', fx: { fond: 0.02, drive: { lonely: -0.08 } }, end: true },
      useful: { line: 'ages.aches.useful', fx: { trust: 0.03, drive: { lonely: -0.06 } }, end: true },
      teach: { line: 'ages.aches.teach', fx: { respect: 0.03, feel: 'inspired' }, end: true },
      staff: { line: 'ages.aches.staff', fx: { trust: 0.04, confide: { k: 'ages.staff', t: '{Name} knows the wizard leans on his staff more than he lets on' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.aches.open', [
    { text: ['How are the old bones, {name}?', 'And how are you keeping, {name}? Knees behaving?', 'You\'re walking carefully today, {name}. The joints?'] },
    { if: { weather: 'rain' }, text: ['Wet day for old bones, {name}. How are yours?'] },
    { if: { season: 'winter' }, text: ['This cold gets into everything, {name}. How are the bones?'] },
  ]);
  L('ages.aches.start', {
    _: ['Creaking. My left knee\'s been talking to me all morning. Rude, it is.', 'Oh, the usual. Back, knees, the bit between.', 'Stiff. I got up in three stages this morning.'],
    cheerful: ['Oh, mustn\'t grumble! Well. A little grumble. My hip sounds like a gate.', 'Still working! Mostly! The bits that aren\'t, I talk to nicely.'],
    ornery: ['Terrible. Everything hurts and nobody listens. There. You asked.', 'Don\'t ask. If you ask I\'ll tell you, and then where will we be.'],
    shy: ['...Oh, fine. Fine. A bit stiff.', 'Better than they were. Worse than they\'ll be. No. The other way round.'],
    curious: ['Do you know, my right knee hurts before rain and my left before frost? I\'m keeping a record.', 'Interesting, actually. A new ache every week. I\'m mapping them.'],
    dreamy: ['My bones are older than my heart. My heart still thinks it\'s spring.', 'I ache like an old willow. Willows go on for ever, though.'],
    witty: ['My knees are older than I am. I don\'t know how they managed it.', 'I\'ve a back like a question mark and knees like an argument.'],
    proud: ['I\'m very well, thank you. Never better. *winces* Never better.', 'Fit as a fiddle. An old fiddle. A distinguished one.'],
    gloomy: ['Worse every day. That\'s what old is. Worse every day.', 'Everything hurts. Even my hair hurts.'],
  }, [
    { if: { weather: 'rain' }, text: ['It\'s the damp. Gets right in the knees and sits there like a lodger.', 'Rain! My hip knew yesterday. I should hire it out.'] },
    { if: { season: 'winter' }, text: ['The cold\'s in my fingers. Can hardly hold a cup. I manage, mind.', 'Winter. My bones hibernate. The rest of me has to carry them.'] },
    { if: { sick: true }, pri: 1, text: ['A cold on top of the creaks. It\'s not fair, is it.'] },
    { if: { tired: true }, pri: 1, text: ['Tired. Old and tired. Mostly tired.'] },
    { if: { job: (j) => !!j }, text: ['My hands don\'t do the {ageTrade} the way they did. They try.'] },
    { if: { pastime: (p) => !!p }, text: ['My fingers are stiff for {pastimeWord}. I still do it. Slowly.'] },
  ]);
  L('ages.aches.sit', {
    _: ['Ah. That\'s better. Warm stones are a gift.', 'Don\'t mind if I do. *settles, with a long sigh*'],
    cheerful: ['Ooh, lovely! The sun\'s been on that all morning.', 'Oh yes. Sit and watch the world. Best job in the village.'],
    ornery: ['I\'ll sit because I want to, not because you said.', 'Fine. *sits* Don\'t think this means anything.'],
    shy: ['...Thank you. *sits, carefully*', 'That\'s kind. I was hoping someone would say.'],
    curious: ['You know the stones hold the sun\'s heat till dusk? I tested it once with my hand.', 'Ah. Now. While we\'re sitting, I\'ve a question for you.'],
    dreamy: ['Oh, it is warm. Like sitting on a cat.', 'From here you can see the whole valley breathing.'],
    witty: ['Sitting is my best sport now. I\'m very good at it.', 'Ah, a wall. My oldest friend. It\'s older than me, and better kept.'],
    proud: ['A short rest. I\'ve been on my feet since dawn.', 'Just for a moment. I have things to do.'],
    gloomy: ['Sitting. That\'s all I\'m good for now.', 'If I sit down I may never get up. Worth the risk.'],
  });
  L('ages.aches.forecast', {
    _: ['Ha! They\'re better than the almanac. The almanac\'s never once been right.', 'My knees said rain on Mersday. Mersday it rained.'],
    cheerful: ['Ha! I\'ll charge a penny a forecast. I\'ll be rich!', 'They are good! Folk ask me before they hang the washing.'],
    ornery: ['They\'re right more than you are, wizard.', 'Laugh. Then wear your hat, because they say hail.'],
    shy: ['...They are quite good at it, actually.', 'Ha. Folk do ask me. I don\'t mind.'],
    curious: ['I\'ve wondered why. Something about the air pressing on the joints. Fascinating, really.', 'Both knees agree about frost. They argue about rain.'],
    dreamy: ['My knees know the sky better than I do. They\'re older than they look.', 'I feel the weather coming, like a song I half remember.'],
    witty: ['My left knee does rain and the right does gossip.', 'The almanac and I have an arrangement. It guesses, I ache.'],
    proud: ['I\'ve never once been caught in the rain without a coat. Never.', 'My knees are the most reliable thing in this village.'],
    gloomy: ['They only ever forecast bad weather. Never once sun.', 'Ha. At least they\'re good for something.'],
  });
  L('ages.aches.herbalist', {
    _: ['I have. Willow-bark and rest, she says. I\'ve no time for rest.', 'Herbalist says it\'s age. I said I knew that. I wanted the cure.'],
    cheerful: ['I have! She gave me a tea that tastes like a ditch. I drink it and smile.', 'Oh, the herbalist is a dear. Rub this, drink that. I do feel brighter.'],
    ornery: ['The herbalist is a child. I\'ve been aching longer than she\'s been alive.', 'I don\'t need potions. I need new knees.'],
    shy: ['...I didn\'t want to bother her. She\'s busy.', 'Not yet. I don\'t like to make a fuss.'],
    curious: ['I have. I asked what was in it. She wouldn\'t say. I\'m working it out by taste.', 'Yes! I made her explain the whole thing. Tendons are remarkable.'],
    dreamy: ['She gave me lavender for my pillow. I dream of meadows now. The knees still hurt.', 'I have. She hums while she mixes. That helps as much as the potion.'],
    witty: ['I have. She says I\'m old. I said "and?" She said "that\'s it."', 'She gave me a salve that smells of horse. Now the horses follow me.'],
    proud: ['I don\'t need the herbalist. I know my own body.', 'I make my own liniment. Better than hers. Don\'t tell her.'],
    gloomy: ['Nothing she has helps. Nothing helps.', 'She tries. There\'s no herb for being old.'],
  });
  L('ages.aches.wizknees', {
    _: ['Ha! Before my grandmother? How old ARE you?', 'You? Creaky? You stride about like a heron.'],
    cheerful: ['Ha! Then we\'re a pair! Two old gates in the wind!', 'Oh, that\'s cheered me up no end. Even wizards creak!'],
    ornery: ['Hmph. Wizards don\'t creak. You\'re just saying that.', 'Then you know. Don\'t tell me to rest.'],
    shy: ['...Really? You? I thought it was only me.', 'Oh. That\'s... that\'s nice to know, somehow.'],
    curious: ['Truly? Do wizard knees forecast weather too? Do they forecast magic?', 'How old are your knees, exactly? Older than the rest of you?'],
    dreamy: ['Then we\'re both old trees, you and I. Still standing.', 'I like that. Old knees, young hearts.'],
    witty: ['Before my grandmother? Then you\'re practically furniture.', 'Then I\'ll stop complaining. You\'ve a few centuries on me.'],
    proud: ['Well. I\'m in very good shape for my age. As are you, no doubt.', 'Then we\'re both doing very well, all things considered.'],
    gloomy: ['And they still work? Lucky you.', 'At least you don\'t complain. I complain.'],
  });
  L('ages.aches.grumble', {
    _: ['*after a long while* ...It\'s nice, not having to talk.', 'Hmm. You\'re restful company, for a wizard.'],
    cheerful: ['*hums a bit, then laughs* You\'re very quiet! I like it.', 'Oh, this is nice. Just sitting. We should do this more.'],
    ornery: ['...My knee hurts. My back hurts. The pump\'s gone stiff. There. I\'ve said it.', 'Hmph. At least you don\'t tell me to drink tea.'],
    shy: ['...Thank you. For not asking anything.', 'This is the best bit of my day, I think.'],
    curious: ['...You know, you can hear the mill from here if you listen. Can you hear it?', 'Do you think the bees mind getting old? Do bees get old?'],
    dreamy: ['*watches the clouds* That one looks like my old dog.', 'When I was young I never sat. Now I sit and see everything.'],
    witty: ['*after a while* This is the most productive I\'ve been all week.', 'We\'ll be like this when they come to dust us.'],
    proud: ['I don\'t usually sit about, you understand. Today\'s an exception.', 'A short rest. Well earned.'],
    gloomy: ['...It\'s the not being able that\'s hard. Not the pain. The not being able.', 'You\'re kind to sit. Most folk hurry past.'],
  });
  L('ages.aches.wall', {
    _: ['I\'d believe it. You both have moss on the north side.', 'Ha! Does it remember you?'],
    cheerful: ['Ha! I bet it\'s got stories, that wall!', 'Oh, I like that. Old friends, wall and wizard.'],
    ornery: ['The wall\'s in better repair.', 'And neither of you does any work.'],
    shy: ['...Ha. That\'s funny.', 'Oh. I\'d like to hear about that, sometime.'],
    curious: ['Truly? Who built it? I\'ve always wanted to know.', 'Did you sit here before there was a village? What did you see?'],
    dreamy: ['Walls hold the warmth of every summer. Maybe they hold the talk too.'],
    witty: ['I\'ll tell the wall you said so. It gets lonely.', 'The wall says the same about you.'],
    proud: ['My father built this wall. Did a fine job.'],
    gloomy: ['Everything round here goes back a long way. Except the young.'],
  });
  L('ages.aches.worst', {
    _: ['The worst? Not being quick. Watching the young ones do it, and me not.', 'Not the ache. The slowing. Everything takes a morning now.'],
    cheerful: ['Oh, the worst is I can\'t dance a whole jig. Half a jig, and then a sit.', 'Not being able to swing the grandchildren round. They don\'t mind. I mind.'],
    ornery: ['Being handled. Folk carrying things for me. I can carry my own basket!', 'Everyone treating me like a cracked teapot. That\'s the worst.'],
    shy: ['...Being in the way. I don\'t want to be in anyone\'s way.', 'Needing help. I hate asking.'],
    curious: ['Forgetting words. I had one this morning and it went. It was a good word too.', 'My eyes. I can\'t read small print. There\'s so much I haven\'t read.'],
    dreamy: ['That the hills look further away every year.', 'That I can\'t walk to the top of the knoll any more, to see the sunset.'],
    witty: ['Losing my glasses. On my head. Twice a day.', 'The young ones talking slowly at me. I\'m old, not daft.'],
    proud: ['Being useless. I\'ve never been useless a day in my life.', 'Being thanked for small things. As if small things were all I could do.'],
    gloomy: ['That it doesn\'t get better. Only worse, slowly.', 'Knowing it\'s the hills next. That\'s the worst.'],
  }, [
    { if: { job: (j) => !!j }, pri: 1, text: ['The {ageTrade}. I can\'t do a full day now. The young ones finish for me. Kindly. That\'s worse.'] },
    { if: { pastime: ['carving', 'basketry', 'pottery', 'knitting', 'painting'], made: { min: 2 } }, pri: 1, text: ['My hands won\'t do {pastimeWord} like they did. I made {ageMadeWord}, you know. I want to make more.'] },
    { if: { ageGrandkid: has, ageGrandkidBaby: false }, pri: 1, text: ['I can\'t keep up with {ageGrandkid}. Little legs, and mine are slower.'] },
  ]);
  L('ages.aches.rain', {
    _: ['Teatime, and heavy. Bring your hat in.', 'Before tea. Mark my words. And my knees.'],
    cheerful: ['Ha! Teatime! Want to bet a bun on it?', 'Rain by tea! And a rainbow after, if we\'re lucky.'],
    ornery: ['Laugh. You\'ll be wet and I\'ll be right.', 'It will. And I\'ll say I told you so.'],
    shy: ['...About four o\'clock, I think. Sorry.'],
    curious: ['I\'d say half past three. Let\'s see who\'s right, me or the sky.'],
    dreamy: ['Soft rain, about teatime. The good kind.'],
    witty: ['Teatime. My knees have never missed a teatime.', 'Rain at four, sun at five, hobbits annoyed at half past.'],
    proud: ['Rain at four. I\'m never wrong.'],
    gloomy: ['Rain. Always rain. Then more rain.'],
  });
  L('ages.aches.remedy', {
    _: ['A hot stone in the bed! My grandmother swore by that. I\'d forgotten.', 'Willow-bark and a hot stone. I\'ll try it. Can\'t hurt.'],
    cheerful: ['Oh, I\'ll try it tonight! A hot stone. Like sleeping with a little sun.', 'I will! And if it works I\'ll tell everyone it was my idea.'],
    ornery: ['Hmph. Willow-bark. Everyone says willow-bark. ...Fine. I\'ll try it.', 'I\'ll try the stone. The tea tastes of punishment.'],
    shy: ['...Thank you. I\'ll try that.', 'That\'s kind of you to think of.'],
    curious: ['How long do you heat the stone? In the fire, or by it? Which stone?', 'Willow-bark! Is that the same as the white willow by the pond?'],
    dreamy: ['A warm stone, like a hearth in the bed. That sounds like a story.'],
    witty: ['A hot stone in the bed. My spouse will think I\'ve gone strange.', 'Willow-bark tea. Wizards always prescribe something that tastes of trees.'],
    proud: ['I know about willow-bark. ...I hadn\'t thought of the stone.'],
    gloomy: ['I\'ll try. It won\'t work. I\'ll try.'],
  });
  L('ages.aches.newknees', {
    _: ['Ha! Whose? Not the miller\'s, he\'s worse than me.', 'Slightly used! I\'d take them. Have they been to Bree?'],
    cheerful: ['Ha! Yes please! Ones that can dance!', 'I\'ll take two! And a spare back!'],
    ornery: ['Don\'t joke about it. I\'d say yes.', 'Used knees. Knowing you, they\'d be a troll\'s.'],
    shy: ['...Ha. Could you, though? No. Ha.'],
    curious: ['Could you? Truly? What would they be made of?', 'Is there a spell for that? There\'s a spell for everything, I heard.'],
    dreamy: ['Knees that could walk to the sea. Imagine.'],
    witty: ['Slightly used. Previous owner careful, only walked to the inn on Highdays.', 'As long as they\'re not elf knees. Elves never sit down.'],
    proud: ['My knees are fine. They just need a rest.'],
    gloomy: ['If only. If only you could.'],
  });
  L('ages.aches.better', {
    _: ['Ha! I\'ll have that on a sampler.', 'That\'s the spirit. I\'ll do something daft today, then.'],
    cheerful: ['Ha! I like that! I\'m going to do something silly before supper!', 'That\'s me! That\'s exactly me!'],
    ornery: ['Hmph. Clever. ...I might use that.', 'You\'re very pleased with that one, aren\'t you.'],
    shy: ['...I like that. I\'ll remember it.'],
    curious: ['What would that look like? Doing it anyway? I\'ll think on it.'],
    dreamy: ['Young enough to do it anyway. Oh, I like that very much.'],
    witty: ['I\'ve been old enough to know better for years. Never stopped me.', 'Ha! That\'s mine now. I\'m saying it at the Badger.'],
    proud: ['Exactly. I\'ve always said so. In other words.'],
    gloomy: ['Do it anyway. Hm. Maybe I will.'],
  });
  L('ages.aches.stairs', {
    _: ['...I didn\'t think wizards got old. That\'s a comfort, and it isn\'t.', 'The stairs win. Ha. They win at mine too.'],
    cheerful: ['Oh, bless you. We\'ll race them together, the stairs.', 'The stairs! They\'ve got it in for all of us.'],
    ornery: ['Well. I\'m sorry to hear it. Hmph. I mean that.', 'At least you admit it. Most folk pretend.'],
    shy: ['...Thank you for telling me. I won\'t tell anyone.', 'Oh. I\'ll... I\'ll keep that to myself.'],
    curious: ['How many centuries does it take, to stop counting? I\'ve always wondered.'],
    dreamy: ['Then we\'re both getting old under the same sky. That\'s not so bad.'],
    witty: ['The stairs win at mine. I\'ve moved the bed to the parlor. Stairs nil.'],
    proud: ['You\'re in fine shape. Better than most. I mean it.'],
    gloomy: ['Then it never stops. Even for wizards.', 'Oh. I thought you at least would go on for ever.'],
  });
  L('ages.aches.company', {
    _: ['Ha! Creaks and all. You\'re not bad yourself.', 'Thank you. Come and creak with me any day.'],
    cheerful: ['Oh, you! Come by tomorrow. I\'ll put the kettle on.', 'Creaks and all! I\'ll put that on my door.'],
    ornery: ['Hmph. ...You\'re not bad company either. Don\'t let it go to your head.'],
    shy: ['...So are you.', 'That\'s kind. I don\'t get much company.'],
    curious: ['Do you know, I think I\'ll sit out here every afternoon now.'],
    dreamy: ['Creaks and all. I\'ll think of that when they wake me in the night.'],
    witty: ['Two creaky gates in a lane. Someone should paint us.'],
    proud: ['I am, yes. Always was.'],
    gloomy: ['...You\'ve cheered me, you know. I didn\'t expect that.'],
  });
  L('ages.aches.useful', {
    _: ['...You think so? I\'ll try to believe it.', 'The reverse? Ha. You\'re kind.'],
    cheerful: ['Oh! Well. That\'s put a bit of spring back in. Not in the knees. Elsewhere.'],
    ornery: ['Hmph. I suppose they do come and ask me things. Too often.', 'Well. If you say so. ...Thank you.'],
    shy: ['...Thank you. I needed to hear that.', 'Truly? Oh. Oh, that\'s nice.'],
    curious: ['I suppose folk do still ask me. About the weather. About the old drains.'],
    dreamy: ['Then I\'ll go slow, and be glad of it.'],
    witty: ['Quite the reverse. They think more of me. I\'ve become an antique.'],
    proud: ['I know that. I just like it said aloud now and then.'],
    gloomy: ['...Maybe. Maybe you\'re right. Thank you.'],
  });
  L('ages.aches.teach', {
    _: ['Teach it. Hm. There\'s a young one who keeps watching me. I might.', 'Show it, if I can\'t do it. Yes. I hadn\'t thought of that.'],
    cheerful: ['Oh, I\'d love that! I\'ll find a youngster this very afternoon!', 'Teach! Yes! And they can do the bending.'],
    ornery: ['Teach the young? They don\'t listen. ...Some of them listen.', 'Fine. But if they get it wrong I\'m saying so.'],
    shy: ['...I\'m not much of a teacher. But I could try. With one, maybe.'],
    curious: ['I\'d have to work out how I do it. I\'ve never thought about how.'],
    dreamy: ['My hands into theirs. Yes. That\'s how it should go.'],
    witty: ['Teach! So the young can ache in my place. I like it.'],
    proud: ['Somebody ought to learn it properly. It might as well be from me.'],
    gloomy: ['Nobody would want to learn from me. ...Would they?'],
  }, [
    { if: { ageGrandkid: has, ageGrandkidBaby: false }, pri: 1, text: ['{AgeGrandkid} keeps asking. I keep saying "when you\'re older". I\'m the one getting older.'] },
    { if: { pastime: (p) => !!p }, text: ['I could teach {pastimeWord}. My fingers know the way even if they\'re slow.'] },
  ]);
  L('ages.aches.staff', {
    _: ['...I won\'t tell a soul. Ha. A wizard\'s walking stick.', 'Oh. Then we\'re in the same boat. A leaky one.'],
    cheerful: ['Ha! I knew it! I always said it was a walking stick with ambitions!'],
    ornery: ['Hmph. I knew it. Your secret\'s safe. I don\'t talk to anyone anyway.'],
    shy: ['...I\'ll never tell. Thank you for telling me.'],
    curious: ['Three staffs! What happened to the other two?'],
    dreamy: ['Even wizards need something to lean on. That\'s a lovely thought, actually.'],
    witty: ['A walking stick in a wizard\'s hat. The best disguise there is.'],
    proud: ['Well, you lean on it very gracefully. Nobody would know.'],
    gloomy: ['...We all need something to lean on. I lean on the gate.'],
  });

  // ==================================================================================
  // Wisdom: what they'd tell a young hobbit
  // ==================================================================================
  addThread({
    id: 'ages.wisdom', label: 'What would you tell a young hobbit?', weight: 1.0, cool: 5, reveals: 'ages.advice',
    when: (F) => F.stage === 'elder' || (F.stage === 'grown' && F.ageYears >= 60),
    rel: (F) => (F.stage === 'elder' ? 1.3 : 0.9),
    open: { ask: 'ages.wisdom.open' },
    beats: {
      start: { line: 'ages.wisdom.start', go: [
        { ap: 'ask', say: 'And the real advice? Under the first one?', to: 'real' },
        { ap: 'jest', say: 'A lifetime, and that\'s what it comes down to?', to: 'defend' },
        { ap: 'listen', say: '*You wait. There\'s more coming.*', label: 'Wait for more', to: 'real' },
      ] },
      defend: { line: 'ages.wisdom.defend', go: [
        { ap: 'ask', say: 'All right. Now the deep one.', to: 'real' },
        { ap: 'jest', say: 'I\'ll have it carved over the Hall door.', to: 'carved' },
      ] },
      real: { line: 'ages.wisdom.real', fx: { learn: ['ages.advice', '{Name} has advice for the young'] }, go: [
        { ap: 'ask', say: 'How did you learn that?', to: 'learned' },
        { ap: 'share', say: 'Here\'s mine: never trust a dragon who says he\'s full.', to: 'dragon' },
        { ap: 'advise', say: 'You should tell the young ones that. They\'d listen to you.', to: 'tell' },
      ] },
      learned: { line: 'ages.wisdom.learned', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'Do you wish someone had told you sooner?', to: 'sooner', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'The best lessons cost the most.', to: 'cost' },
        { ap: 'jest', say: 'And you still haven\'t quite learned it, have you.', to: 'still' },
      ] },
      carved: { line: 'ages.wisdom.carved', fx: { joke: { k: 'ages.carved', t: 'The wizard will have their advice carved over the Hall door.' } }, go: [
        { ap: 'ask', say: 'Truly, though. What matters most?', to: 'real' },
        { ap: 'warm', say: 'I mean it. Folk would read it.', to: 'end' },
      ] },
      dragon: { line: 'ages.wisdom.dragon', fx: { fond: 0.02, joke: { k: 'ages.dragon', t: 'Never trust a dragon who says he\'s full.' } }, go: [
        { ap: 'share', say: 'And one more: the kettle\'s always worth putting on.', to: 'kettle' },
        { ap: 'warm', say: 'Yours is better. Yours is truer.', to: 'end' },
      ] },
      tell: { line: 'ages.wisdom.tell', go: [
        { ap: 'advise', say: 'Start with {ageLittlest}. Little ears hold on to things.', to: 'little', need: { if: { ageLittlest: has } } },
        { ap: 'advise', say: 'Tell {ageGrandkid}. Today. Before supper.', to: 'grand', need: { if: { ageGrandkid: has, ageGrandkidBaby: false } } },
        { ap: 'warm', say: 'They listen more than they let on.', to: 'listenmore' },
      ] },
      sooner: { line: 'ages.wisdom.sooner', fx: { trust: 0.03 }, end: true },
      cost: { line: 'ages.wisdom.cost', end: true },
      still: { line: 'ages.wisdom.still', end: true },
      kettle: { line: 'ages.wisdom.kettle', end: true },
      little: { line: 'ages.wisdom.little', fx: { respect: 0.03, feel: 'inspired' }, end: true },
      grand: { line: 'ages.wisdom.grand', fx: { respect: 0.03, queue: 'whisper_visit', queueExtra: (T) => ({ to: personById(T.F.ageGrandkidId), kind: 'kin' }) }, end: true },
      listenmore: { line: 'ages.wisdom.listenmore', fx: { respect: 0.02 }, end: true },
    },
    end: { fond: 0.02, respect: 0.01 },
  });
  lines('ages.wisdom.open', [
    { text: ['If you could tell a young hobbit one thing, {name}, what would it be?', 'You\'ve lived a good while, {name}. What\'s the thing worth knowing?', 'What have the years taught you, {name}? The useful bits.'] },
  ]);
  L('ages.wisdom.start', {
    _: ['Always carry a hanky. Two, if you can.', 'Never sit on a wet wall. You\'ll know about it all afternoon.', 'Put the kettle on before you need it.'],
    cheerful: ['Eat the pudding first! You never know who\'s coming to tea.', 'Dance when there\'s a fiddle. There won\'t always be a fiddle.'],
    ornery: ['Never lend your best spade. You won\'t see it again.', 'Don\'t listen to advice. Starting now.'],
    shy: ['...Oh. I don\'t know. Wear a warm vest?', 'Um. Don\'t trust a pond that looks shallow.'],
    curious: ['Ask. Always ask. The worst they can say is "go away".', 'Look under things. Stones, logs, people. There\'s always more.'],
    dreamy: ['Watch the sunset. Every one you can. They don\'t repeat.', 'Keep a window open at night. You hear the best things.'],
    witty: ['Never play cards with anyone called Took.', 'Laugh at your own jokes. Somebody has to.'],
    proud: ['Do it properly or don\'t do it at all.', 'Keep your doorstep clean. Folk judge a hobbit by the doorstep.'],
    gloomy: ['Expect rain. Then you\'re never disappointed.', 'Don\'t get old. ...I\'m joking. Mostly.'],
  }, [
    { if: { job: 'baker' }, text: ['Never open the oven to look. The loaf knows when you\'re watching.'] },
    { if: { job: 'farmer' }, text: ['Plant your beans when the oak leaves are the size of a mouse\'s ear. Not before.'] },
    { if: { job: 'brewer' }, text: ['Never taste your own brew before Highday. You\'ll be too kind to it.'] },
    { if: { job: 'innkeeper' }, text: ['Remember everyone\'s usual. It\'s worth more than the ale.'] },
    { if: { job: 'fisher' }, text: ['The fish don\'t care what you think. Sit still and be patient.'] },
    { if: { rift: true }, text: ['Back up everything. Twice. Even your feelings. Especially your feelings.'] },
  ]);
  L('ages.wisdom.defend', {
    _: ['It\'s a very good hanky rule! You\'ll thank me when you sneeze.', 'You laugh, but you\'ve never been caught at a funeral tea without one.'],
    cheerful: ['It\'s a good rule! A hanky\'s a flag, a bandage and a hat!', 'Ha! You\'ll see. Everything comes back to hankies.'],
    ornery: ['It\'s good advice. I don\'t see you with a hanky.', 'Mock all you like. My advice has kept three generations dry.'],
    shy: ['...It\'s quite good advice. I think.', 'Oh. Well. Yes. It\'s small. Small things matter.'],
    curious: ['Well, it sounds small. But it\'s about being ready, isn\'t it? Underneath?'],
    dreamy: ['Little things are the big things in disguise.'],
    witty: ['Of course not. That\'s just the free sample.', 'That\'s the first lesson. The second costs a pie.'],
    proud: ['It\'s served me well for many a year, thank you.'],
    gloomy: ['Well, nobody listens to the big advice anyway.'],
  });
  L('ages.wisdom.real', {
    _: ['Be kind before you\'re clever. Clever can wait. Kind can\'t.', 'Tell them you love them. Out loud. More than you think you should.'],
    cheerful: ['Say yes to things. Dances, walks, second helpings. You only regret the no\'s.', 'Laugh at yourself first. Then nobody else can do it better.'],
    ornery: ['Say sorry quick and mean it. I didn\'t, once. Cost me a friend for twenty years.', 'Don\'t hold grudges. They\'re heavy and they don\'t keep you warm.'],
    shy: ['...You don\'t have to talk to be liked. Just turn up. Turning up is most of it.', 'Find one person who understands you. One is plenty.'],
    curious: ['Never stop learning. The day you stop, you start getting old. Really old.', 'Ask the old ones questions while they\'re here. I didn\'t ask enough.'],
    dreamy: ['Don\'t wait for the right time. It\'s now. It was always now.', 'Love the ordinary days. They\'re the ones you\'ll miss.'],
    witty: ['Most things that worry you never happen. The rest happen anyway. So have a cookie.', 'Nobody\'s really grown up. We\'re all pretending, very well.'],
    proud: ['Do honest work and keep your word. Everything else follows.', 'Know what you\'re good at, and do it for others.'],
    gloomy: ['Don\'t waste time being sad about things you can\'t change. I wasted years.', 'Hold on to people. They go. Hold on while they\'re here.'],
  }, [
    { if: { spouse: has }, text: ['Marry your best friend. Then you never run out of things to say.'] },
    { if: { ageMissed: has }, pri: 1, text: ['Say what you mean to say, while they\'re here to hear it. I wish I\'d said more to {ageMissed}.'] },
    { if: { ageGrandkid: has }, text: ['Spend time on the little ones. They grow while you\'re putting the kettle on.'] },
    { if: { ageTrips: { min: 1 } }, text: ['Go and see the world once, then come home and love it properly.'] },
  ]);
  L('ages.wisdom.learned', {
    _: ['The hard way. Is there another?', 'From getting it wrong. Getting it wrong is a marvelous teacher. Terrible manners, though.'],
    cheerful: ['From a very old aunt who said yes to everything. She lived to a hundred and twelve!', 'By getting it wrong, then laughing, then getting it right.'],
    ornery: ['From years of being right and alone. Not a good trade, it turns out.', 'From a quarrel I should have mended. There. Don\'t ask more.'],
    shy: ['...From a friend who sat with me when I couldn\'t talk. She didn\'t say anything. She was just there.', 'By watching. I watch a lot.'],
    curious: ['From an old tinker who knew everything. I asked him how. He said "I asked".', 'I worked it out slowly. Over about sixty years.'],
    dreamy: ['One spring morning I realized I\'d missed a whole year looking at my feet.', 'From the river. It goes on, whatever happens. I try to.'],
    witty: ['From my mother. She said it every day. It took me forty years to hear it.', 'I read it on a tea towel. Tea towels are very wise.'],
    proud: ['From my father, who never once broke his word. Not once.', 'From doing it right for a very long time.'],
    gloomy: ['By losing people. That\'s how everyone learns it.', 'Too late. That\'s how I learned it. Too late.'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['From my {ageMissedRel}, {ageMissed}. I didn\'t listen at the time. I\'m listening now.'] },
  ]);
  L('ages.wisdom.carved', {
    _: ['Ha! "Carry a hanky." Over the Hall door! They\'d never forget it.', 'You\'d do it, too. I know you would.'],
    cheerful: ['Ha! In gold letters! With a little hanky carved underneath!', 'Oh, do! I\'d go and stand under it every day!'],
    ornery: ['Don\'t you dare. ...Unless it\'s spelled right.', 'They\'d carve it crooked. They carve everything crooked.'],
    shy: ['...Please don\'t. Ha. Please don\'t.'],
    curious: ['What would the Moot say? Can anybody carve things over the Hall?'],
    dreamy: ['Carved in stone. Somebody reading it after I\'ve gone over the hills. Hm.'],
    witty: ['Next to the Moot\'s motto. "Mind the step." Very wise, the Moot.', 'Over the door, where everyone bangs their head. Very fitting.'],
    proud: ['Well. There are worse things to have carved.'],
    gloomy: ['It\'d be the only thing anyone remembered of me.'],
  });
  L('ages.wisdom.dragon', {
    _: ['Ha! Is that from life, or a story?', 'A dragon who says he\'s full. Oh, that\'s good. I\'ll use that.'],
    cheerful: ['Ha! Oh, that\'s good! I\'m telling the grandchildren that!', 'Never trust a full dragon! Ha! I love it!'],
    ornery: ['That\'s not advice, that\'s a warning. Different thing.', 'Ha. Hmph. Useful, I suppose, if dragons come by.'],
    shy: ['...Was there a dragon? A real one?', 'Ha. That\'s a good one.'],
    curious: ['Is that a real thing that happened? It sounds like a real thing that happened.', 'What does a full dragon look like? How would you tell?'],
    dreamy: ['There\'s a story in that. You\'ll tell it under the great tree one day.'],
    witty: ['Or a hobbit who says he\'s full. Same thing, really.', 'Or a wizard who says he\'s on time.'],
    proud: ['Sound advice. I\'d never trust a dragon anyway.'],
    gloomy: ['Never trust anyone who says they\'re full. True enough.'],
  });
  L('ages.wisdom.tell', {
    _: ['Would they? The young don\'t listen to old folk. ...Do they?', 'Maybe. If I say it in a story. They like stories.'],
    cheerful: ['Oh, I\'d love to! I\'ll tell it with actions!', 'You think? I\'ll start a little school! Under the oak!'],
    ornery: ['They don\'t listen. I tell them to wipe their feet and they don\'t.', 'Hmph. Maybe one or two.'],
    shy: ['...I\'m not one for speeches. Maybe one young one. Quietly.'],
    curious: ['What would be the best way, do you think? A story? A game?'],
    dreamy: ['Pass it down. Like a song. Yes. Someone should.'],
    witty: ['I\'ll tell them. They\'ll ignore it. Then in sixty years they\'ll tell theirs.'],
    proud: ['They would listen to me, yes. I\'m well thought of.'],
    gloomy: ['Nobody wants to hear an old hobbit\'s advice.'],
  });
  L('ages.wisdom.sooner', {
    _: ['...Yes. Oh, yes. But I don\'t think I\'d have heard it.', 'Someone did tell me. I just wasn\'t ready.'],
    cheerful: ['Ha! Someone did. I laughed and did the opposite. Then I learned it anyway.'],
    ornery: ['I was told. I didn\'t listen. Nobody listens. That\'s the trouble.'],
    shy: ['...I wish someone had said I was allowed to be quiet. That would have helped.'],
    curious: ['I wonder if you can learn it from telling. I think you have to live it.'],
    dreamy: ['Maybe. But then it wouldn\'t be mine. I like that it\'s mine.'],
    witty: ['I wish someone had told me about knees.'],
    proud: ['I worked it out. That\'s worth more than being told.'],
    gloomy: ['Every day. I wish it every day.'],
  });
  L('ages.wisdom.cost', {
    _: ['They do. And they\'re the only ones that stick.', 'Cost the most, yes. Worth the most, too.'],
    cheerful: ['They do! And then you get to tell everyone, which is fun.'],
    ornery: ['Hmph. They do. I\'d like a refund on a few.'],
    shy: ['...Yes. That\'s true.'],
    curious: ['Do they? I suppose they do. Why is that, I wonder.'],
    dreamy: ['Like a pearl. The grit comes first.'],
    witty: ['I\'ve paid for a few that turned out to be wrong.'],
    proud: ['I\'ve paid for mine, and gladly.'],
    gloomy: ['They do. I\'m still paying.'],
  });
  L('ages.wisdom.still', {
    _: ['Ha! No. Not quite. It\'s a lifelong sort of lesson.', 'Cheek! ...No, I haven\'t.'],
    cheerful: ['Ha! Never! I learn it again every week!'],
    ornery: ['I have learned it. I just choose not to use it.', 'Mind your own business. ...No.'],
    shy: ['...No. Not quite. I\'m trying.'],
    curious: ['Do you ever finish learning something like that? I doubt it.'],
    dreamy: ['Nobody does, I think. That\'s why you have to keep saying it.'],
    witty: ['Of course not. I\'d have nothing to say then.'],
    proud: ['I\'ve learned it very thoroughly, thank you.'],
    gloomy: ['No. I\'ll be learning it till the hills.'],
  });
  L('ages.wisdom.kettle', {
    _: ['Ha! That\'s the best one yet.', 'Now that\'s wisdom. Shall we?'],
    cheerful: ['Oh, now you\'re talking! Come in, come in!'],
    ornery: ['Finally, some sense from a wizard.'],
    shy: ['...I\'ll put it on, if you like.'],
    curious: ['Is that the wizard\'s secret? It\'s all kettles?'],
    dreamy: ['The kettle\'s always worth putting on. I\'ll stitch that on a cushion.'],
    witty: ['Ha! You stole that from every hobbit who ever lived.'],
    proud: ['Of course it is. My kettle\'s never cold.'],
    gloomy: ['That\'s true. That\'s the truest thing anyone\'s said today.'],
  });
  L('ages.wisdom.little', {
    _: ['{AgeLittlest}. Yes. I\'ll tell {ageLittlest} with a cookie. Cookies help.', 'Little ears. You\'re right. They\'ll remember it when I\'m long gone.'],
    cheerful: ['Oh, {ageLittlest} will love it! I\'ll make it a game!'],
    ornery: ['{AgeLittlest}\'s a menace. ...A menace who listens, mind.'],
    shy: ['...{AgeLittlest} does sit with me sometimes. I\'ll try.'],
    curious: ['I wonder what {ageLittlest} will make of it. Little ones hear things differently.'],
    dreamy: ['And one day {ageLittlest} will tell it to someone little. That\'s a nice thought.'],
    witty: ['I\'ll tell {ageLittlest}. Then {ageLittlest} will tell me I\'m wrong.'],
    proud: ['{AgeLittlest} could do with some proper teaching.'],
    gloomy: ['If {ageLittlest} will listen. I\'ll try.'],
  });
  L('ages.wisdom.grand', {
    _: ['Today. Yes. Before I forget, or {ageGrandkid} grows another inch.', 'You\'re right. I\'ll go now, while I\'ve the words.'],
    cheerful: ['I will! I\'ll go right now! {AgeGrandkid} will roll their eyes and I\'ll love it!'],
    ornery: ['Fine. Fine! I\'m going. Don\'t look so pleased.'],
    shy: ['...All right. I\'ll go and find {ageGrandkid}. Wish me luck.'],
    curious: ['I wonder what {ageGrandkid} will say. I\'ll go and see.'],
    dreamy: ['Before supper. While the light\'s gold. I\'ll go.'],
    witty: ['I\'ll go. {AgeGrandkid} will listen for four seconds. That\'s a record.'],
    proud: ['Somebody in this family should hear it. I\'m going.'],
    gloomy: ['...You\'re right. There might not be a better time.'],
  });
  L('ages.wisdom.listenmore', {
    _: ['Do they? I suppose I did. I pretended not to.', 'Hmm. Maybe. I\'ll say it anyway, and let it land where it lands.'],
    cheerful: ['They do! You\'re right! They pretend not to, the scamps.'],
    ornery: ['They\'d better.'],
    shy: ['...I hope so.'],
    curious: ['I\'ve noticed that too. They repeat things back years later.'],
    dreamy: ['Words are seeds. They come up when they\'re ready.'],
    witty: ['They listen, all right. Especially when you don\'t want them to.'],
    proud: ['Of course they do. They\'ve a good example.'],
    gloomy: ['Maybe one of them. One\'s enough.'],
  });

  // ==================================================================================
  // Grandchildren
  // ==================================================================================
  addThread({
    id: 'ages.grandkids', label: (F) => (F.ageGrandkids > 1 ? 'And the grandchildren?' : F.ageGrandkid ? `And how's young ${F.ageGrandkid}?` : 'And the grandchildren?'), weight: 1.2, cool: 4,
    when: (F) => !!F.ageGrandkid && F.stage !== 'child',
    rel: (F) => 1.4 + Math.min(F.ageGrandkids, 4) * 0.1,
    open: { warm: 'ages.grandkids.open' },
    beats: {
      start: { line: 'ages.grandkids.start', go: [
        { ap: 'ask', say: 'How many is it now?', to: 'count', need: { if: { ageGrandkids: { min: 2 } } } },
        { ap: 'ask', say: 'Who do they take after?', to: 'takes' },
        { ap: 'jest', say: 'And how much candy have you slipped them this week?', to: 'sweets' },
        { ap: 'warm', say: 'You light up, talking about them.', to: 'lightup' },
      ] },
      count: { line: 'ages.grandkids.count', go: [
        { ap: 'ask', say: 'And which one takes after you?', to: 'takes' },
        { ap: 'jest', say: 'You\'ll need a bigger table.', to: 'table' },
      ] },
      takes: { line: 'ages.grandkids.takes', go: [
        { ap: 'warm', say: 'Then they\'re lucky.', to: 'lucky' },
        { ap: 'ask', say: 'What will you teach them, while you can?', to: 'teach' },
        { ap: 'jest', say: 'Heaven help the village.', to: 'heaven' },
      ] },
      sweets: { line: 'ages.grandkids.sweets', fx: { joke: { k: 'ages.sweets', t: 'Candy for the grandchildren, and the wizard knows the pocket.' } }, go: [
        { ap: 'jest', say: 'Your secret\'s safe. Which pocket?', to: 'pocket' },
        { ap: 'ask', say: 'What else do you give them? Besides candy?', to: 'teach' },
      ] },
      lightup: { line: 'ages.grandkids.lightup', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'What do you hope for them?', to: 'hope', need: { open: 1 }, soft: true },
        { ap: 'ask', say: 'Who do they take after?', to: 'takes' },
      ] },
      teach: { line: 'ages.grandkids.teach', go: [
        { ap: 'ask', say: 'And when the day comes? What would you leave them?', to: 'leave', need: { open: 2 }, soft: true },
        { ap: 'advise', say: 'Go and find {ageGrandkid} today. Teach them one thing.', to: 'visit', need: { if: { ageGrandkidBaby: false } } },
        { ap: 'warm', say: 'They\'ll remember it all their lives.', to: 'remember' },
      ] },
      table: { line: 'ages.grandkids.table', go: [
        { ap: 'ask', say: 'What do you hope for them all?', to: 'hope' },
        { ap: 'warm', say: 'A full table\'s the best kind.', to: 'end' },
      ] },
      heaven: { line: 'ages.grandkids.heaven', go: [
        { ap: 'ask', say: 'And what do you hope for them?', to: 'hope' },
        { ap: 'jest', say: 'I\'ll hide the fireworks.', to: 'end' },
      ] },
      pocket: { line: 'ages.grandkids.pocket', end: true },
      hope: { line: 'ages.grandkids.hope', fx: { trust: 0.03 }, go: [
        { ap: 'warm', say: 'With you behind them, they\'ll manage.', to: 'end' },
        { ap: 'ask', say: 'And when the day comes? What would you leave them?', to: 'leave', need: { open: 2 }, soft: true },
      ] },
      leave: { line: 'ages.grandkids.leave', fx: { trust: 0.04, confide: { k: 'ages.leave', t: 'what {Name} would leave the grandchildren' } }, go: [
        { ap: 'comfort', say: 'That\'s a fine thing to leave. The finest.', to: 'fine' },
        { ap: 'share', say: 'The best things I was ever left were stories.', to: 'stories' },
      ] },
      visit: { line: 'ages.grandkids.visit', fx: { respect: 0.03, queue: 'whisper_visit', queueExtra: (T) => ({ to: personById(T.F.ageGrandkidId), kind: 'kin' }) }, end: true },
      lucky: { line: 'ages.grandkids.lucky', fx: { fond: 0.02 }, end: true },
      remember: { line: 'ages.grandkids.remember', end: true },
      fine: { line: 'ages.grandkids.fine', fx: { fond: 0.02 }, end: true },
      stories: { line: 'ages.grandkids.stories', fx: { fond: 0.02, trust: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.grandkids.open', [
    { text: ['And the grandchildren, {name}? How are they?', 'Tell me about the little ones, {name}. The grandchildren.'] },
    { if: { ageGrandkid: has }, text: ['And how\'s young {ageGrandkid}, {name}?', 'I saw {ageGrandkid} the other day, {name}. Growing like a weed.'] },
  ]);
  L('ages.grandkids.start', {
    _: ['{AgeGrandkid}? Oh, a handful. A lovely handful.', 'Growing. Eating. Asking why. The usual.'],
    cheerful: ['Oh, {ageGrandkid}! The light of my life! Did you know {ageGrandkid} can whistle now?', 'Wonderful! Loud and muddy and wonderful!'],
    ornery: ['{AgeGrandkid} broke my good jug. Then gave me a daisy. I forgave the jug.', 'Noisy. Always in the cookie tin. ...Bright, mind. Very bright.'],
    shy: ['...{AgeGrandkid} holds my hand on the lane. Nobody\'s done that in years.', 'They\'re lovely. They chatter and I listen. It suits us.'],
    curious: ['{AgeGrandkid} asked me why the sky is blue. I didn\'t know! I\'ve been asking everyone.', 'Clever. Too clever. Asks questions I can\'t answer.'],
    dreamy: ['When {ageGrandkid} laughs I hear my own mother. Isn\'t that strange?', 'They\'re the best thing I\'ve ever had a hand in. A small hand.'],
    witty: ['{AgeGrandkid} is a genius, obviously. Takes after me. Skipped a generation.', 'They\'re eating me out of hole and home. I let them.'],
    proud: ['{AgeGrandkid} is the brightest in Thistledown. Everyone says so. Well, I say so.', 'A credit to the family. Naturally.'],
    gloomy: ['Growing too fast. Soon they won\'t want an old hobbit about.', 'Busy. They don\'t come round as much. I understand.'],
  }, [
    { if: { ageGrandkidBaby: true }, pri: 1, text: ['{AgeGrandkid}\'s still a babe in arms. Tiny fingers. Grips like a blacksmith.', 'Little {ageGrandkid}! Sleeps through anything except me singing.'] },
    { if: { ageGrandkids: { min: 3 } }, text: ['Which one? I\'ve {ageGrandkidsWord}! {AgeGrandkid}\'s my favorite. Don\'t tell the others.'] },
    { if: { stage: 'grown' }, text: ['A grandparent! Me! I still feel about thirty-four.'] },
  ]);
  L('ages.grandkids.count', {
    _: ['{AgeGrandkidsWord}! And every one of them knows where I keep the cookies.', '{AgeGrandkidsWord} now. I count them on my fingers. Some days twice.'],
    cheerful: ['{AgeGrandkidsWord}! Isn\'t it marvelous? Birthdays every other week!'],
    ornery: ['{AgeGrandkidsWord}. All of them in my garden at once, usually.'],
    shy: ['...{AgeGrandkidsWord}. I know all their favorite things.'],
    curious: ['{AgeGrandkidsWord}! I\'ve been writing down their first words. I\'ve a whole book.'],
    dreamy: ['{AgeGrandkidsWord} little lanterns. That\'s how I think of them.'],
    witty: ['{AgeGrandkidsWord}, last I counted. They move about too much to be sure.'],
    proud: ['{AgeGrandkidsWord}, and not a dud among them.'],
    gloomy: ['{AgeGrandkidsWord}. And they all grow up and away. That\'s how it goes.'],
  });
  L('ages.grandkids.takes', {
    _: ['Me, obviously. The good bits are me. The muddy bits are their father.', 'Their grandmother\'s nose and my temper. Poor thing.'],
    cheerful: ['Me! The laugh is all me. You\'ll hear it from three lanes off.', 'Everyone! They\'re a little patchwork of the whole family.'],
    ornery: ['Me. Stubborn as a gate. I\'m very proud.', 'They take after nobody. They\'re entirely their own trouble.'],
    shy: ['...They\'re shy, like me. I tell them it\'s all right. Nobody told me.', 'I see a bit of me. In how they watch things.'],
    curious: ['Me! They take everything apart to see how it works. I did that. I still do.', 'Hard to say. I\'ve been studying them. Their ears are mine.'],
    dreamy: ['They take after someone who isn\'t born yet, I think. Someone new.', 'They stare at clouds. That\'s me. That\'s all me.'],
    witty: ['The milkman. ...I\'m joking. Their cheek is all mine.', 'They have my wit and their mother\'s appetite. A dangerous mix.'],
    proud: ['Me. The family likeness is very strong. Very strong.', 'The best of all of us. As they should.'],
    gloomy: ['The other side of the family. Mostly.', 'I hope not me. I hope they\'re happier.'],
  }, [
    { if: { ageMissed: has, ageMissedRel: ['wife', 'husband'] }, pri: 1, text: ['They\'ve {ageMissed}\'s eyes. Every time they look at me, there {ageMissed} is.'] },
  ]);
  L('ages.grandkids.sweets', {
    _: ['Candy? Me? ...Four pieces. Five. They have very persuasive faces.', 'Only one a day. Each. Per pocket.'],
    cheerful: ['Oh, dozens! What are grandparents for?', 'Hundreds! Don\'t tell their mother!'],
    ornery: ['That\'s between me and them. Mind your own.', 'None. ...None that their mother knows about.'],
    shy: ['...Just a few. They\'re so pleased.'],
    curious: ['I\'ve been trying to find which sweet they like best. It requires a lot of research.'],
    dreamy: ['A sweet in a small hand. Best trade in the world.'],
    witty: ['Candy is a grandparent\'s right. It\'s in the Moot\'s rules. I wrote it in.', 'I\'m teaching them economics. They pay in hugs.'],
    proud: ['I give them a sweet for good manners. They have very good manners.'],
    gloomy: ['Candy is all I\'ve got to give, some days.'],
  });
  L('ages.grandkids.lightup', {
    _: ['Do I? Ha. I suppose I do.', 'They\'re the best part of getting old. The only good part, some days.'],
    cheerful: ['How could I not! They\'re marvelous!'],
    ornery: ['I don\'t light up. ...Do I? Hmph.'],
    shy: ['...Do I? Oh. I didn\'t know it showed.'],
    curious: ['Do I? I wonder what that looks like. A lantern, I hope.'],
    dreamy: ['They light me up. I just glow back.'],
    witty: ['I light up talking about pudding too. I\'m very flammable.'],
    proud: ['Well, they\'re worth lighting up about.'],
    gloomy: ['They\'re the only thing that does, these days.'],
  });
  L('ages.grandkids.teach', {
    _: ['How to whistle with an acorn cap. Important skills.', 'Which mushrooms not to eat. Which pudding to eat first. The basics.'],
    cheerful: ['Every song I know! We sing on the way to the river.', 'How to skip stones. Six bounces! Well. Four.'],
    ornery: ['How to tell a lazy hobbit from a tired one. Very useful.', 'How to mend a fence properly. Nobody mends fences properly.'],
    shy: ['...How to sit quietly and watch the herons. That\'s my favorite.'],
    curious: ['The names of the stars. Some of them I made up. They don\'t know that yet.', 'How to ask a good question. That\'s the whole of it.'],
    dreamy: ['How to listen to the rain. And the old songs.'],
    witty: ['Cards. They\'ll be fleecing the Tooks by spring.'],
    proud: ['Good manners. Hard work. The family recipes.'],
    gloomy: ['What I can, while I can.'],
  }, [
    { if: { pastime: (p) => !!p }, pri: 1, text: ['{PastimeWord}. I\'ve shown {ageGrandkid} the start of it. Little hands, big ideas.'] },
    { if: { job: (j) => !!j }, text: ['A bit of {ageTrade}. Somebody in the family should keep it on.'] },
  ]);
  L('ages.grandkids.table', {
    _: ['Ha! I\'ve had to borrow chairs from next door. And the door off its hinges.', 'We eat in shifts now. Like the mill.'],
    cheerful: ['I\'ve two tables pushed together! And a stool for the dog!'],
    ornery: ['I\'d need a bigger hole. And more patience.'],
    shy: ['...We sit on the floor, sometimes. They like that.'],
    curious: ['I\'ve been working out how to fit a leaf in the table. It\'s a puzzle.'],
    dreamy: ['A long table, and every face I love along it. That\'s my dream.'],
    witty: ['I\'ll eat standing. Gives me a better view of the pudding.'],
    proud: ['My table seats twelve. I had it made.'],
    gloomy: ['And some empty chairs, too. There are always empty chairs.'],
  });
  L('ages.grandkids.heaven', {
    _: ['Ha! Heaven help it, yes. It needs a bit of stirring.', 'Ha! The village survived me. It\'ll survive them.'],
    cheerful: ['Ha! Yes! Heaven help it!'],
    ornery: ['The village could do with a shake.'],
    shy: ['...They are a bit of a whirlwind.'],
    curious: ['I wonder what they\'ll change. Something. They\'ll change something.'],
    dreamy: ['Heaven help it, and bless it.'],
    witty: ['Heaven\'s been warned. It\'s laying in sandbags.'],
    proud: ['The village will be lucky to have them.'],
    gloomy: ['Somebody will have to.'],
  });
  L('ages.grandkids.pocket', {
    _: ['The left one. The right has a hole. ...Don\'t tell.', 'Inside the waistcoat. The one with the button that sticks.'],
    cheerful: ['Every pocket! I\'m a walking candy store!'],
    ornery: ['Never you mind which pocket.'],
    shy: ['...The little one inside. Shh.'],
    curious: ['A different one each day, to keep them guessing. It\'s a game.'],
    dreamy: ['The pocket by my heart. Where else.'],
    witty: ['The pocket with the hole. They find them in my boots.'],
    proud: ['A proper sweet pocket, lined. I had it sewn in.'],
    gloomy: ['The same one I used for my own children. It\'s worn thin.'],
  });
  L('ages.grandkids.hope', {
    _: ['That they\'re kind. And warm. And never short of a friend.', 'That they\'re happy here. Or happy wherever they go. But here, I hope.'],
    cheerful: ['That they laugh every day! And dance at their weddings!'],
    ornery: ['That they don\'t make my mistakes. They\'ll make their own. That\'s fine.'],
    shy: ['...That they\'re never lonely. That\'s all.'],
    curious: ['That they see more than I did. Over the hills, even. And come back to tell me.'],
    dreamy: ['That they find something they love, and someone to love it with.'],
    witty: ['That they inherit my looks and not my knees.'],
    proud: ['That they make the family proud. They will.'],
    gloomy: ['That the world\'s kinder to them than it was to some.'],
  }, [
    { if: { rift: true }, text: ['That they never have to cross a rift to find home. That they\'re home already.'] },
  ]);
  L('ages.grandkids.leave', {
    _: ['Not things. Stories. Every daft thing I ever did, told well.', 'My old teapot, and the knack of a good pot of tea. The knack matters more.'],
    cheerful: ['My songs! All of them! And my recipe for plum duff.'],
    ornery: ['My garden. And the instructions. Which they\'ll ignore.'],
    shy: ['...I\'ve written each of them a letter. For when. I haven\'t told anyone.'],
    curious: ['My book of the weather. Sixty years of it. Someone should keep it going.'],
    dreamy: ['A way of seeing. If that can be left. I think it can.'],
    witty: ['My debts. ...No. My jokes. Same thing, some would say.'],
    proud: ['The family name, kept clean. That\'s the best thing I can leave.'],
    gloomy: ['Whatever\'s left. I hope it\'s enough.'],
  }, [
    { if: { ageKeepsake: has }, pri: 1, text: ['I\'ve {ageKeepsake}. It was given to me to keep. Now I\'ll give it on.'] },
    { if: { pastime: ['carving', 'basketry', 'pottery', 'knitting', 'painting'], made: { min: 2 } }, text: ['My {madeMany}. One each. I\'ve set them aside already.'] },
  ]);
  L('ages.grandkids.visit', {
    _: ['Today. Yes. Off I go, then. Before I find a reason not to.', 'You\'re right. I\'ll go now.'],
    cheerful: ['Yes! I\'ll go right now! I\'ll take a cookie as a bribe!'],
    ornery: ['Fine. I was going anyway.'],
    shy: ['...All right. I\'ll go and find them.'],
    curious: ['I will. I\'ll see what they make of it.'],
    dreamy: ['I\'ll go. While it\'s a good day.'],
    witty: ['I\'m going. If I\'m not back, they\'ve tied me up.'],
    proud: ['Somebody has to teach them properly. I\'m off.'],
    gloomy: ['...Yes. I should. I will.'],
  });
  L('ages.grandkids.lucky', {
    _: ['Get away with you. ...Thank you.', 'I\'m the lucky one. Don\'t tell them.'],
    cheerful: ['Oh, you! We\'re all lucky. Every one of us.'],
    ornery: ['Hmph. Luck\'s got nothing to do with it.'],
    shy: ['...That\'s a nice thing to say.'],
    curious: ['Do you think so? I worry I\'m teaching them the wrong things.'],
    dreamy: ['Lucky. Yes. We all are, to have each other.'],
    witty: ['Lucky? They\'ve inherited my sense of direction. Poor dears.'],
    proud: ['Yes. They are.'],
    gloomy: ['I hope so. I do try.'],
  });
  L('ages.grandkids.remember', {
    _: ['I hope so. I remember what my grandmother taught me. Every word.', 'Maybe. Even if they don\'t know where it came from.'],
    cheerful: ['Oh, I hope so! I\'ll make it so silly they can\'t forget!'],
    ornery: ['They\'d better.'],
    shy: ['...I hope so.'],
    curious: ['I wonder which bits. Never the ones you expect.'],
    dreamy: ['Like a song you can\'t remember learning.'],
    witty: ['They\'ll remember the candy. The wisdom\'s a bonus.'],
    proud: ['They will. I make sure of it.'],
    gloomy: ['That\'s something, isn\'t it. Being remembered.'],
  });
  L('ages.grandkids.fine', {
    _: ['...Thank you. I think so too.', 'Finest. Yes. I\'ll go on believing that.'],
    cheerful: ['Oh, you\'ve made my day.'],
    ornery: ['Hmph. Yes. It is.'],
    shy: ['...Thank you.'],
    curious: ['Do you think they\'ll know what it means?'],
    dreamy: ['The finest. I like that.'],
    witty: ['Better than the teapot. Just.'],
    proud: ['It is, isn\'t it.'],
    gloomy: ['...I hope so.'],
  });
  L('ages.grandkids.stories', {
    _: ['Stories. Yes. They don\'t break and they don\'t get lost.', 'Then I\'ll leave them every story I\'ve got. And a few I\'ll make up.'],
    cheerful: ['Ha! Then they\'ll be rich! I\'ve hundreds!'],
    ornery: ['Stories. Hmph. Better than a teapot, I suppose.'],
    shy: ['...I\'ve a few. I\'ll tell them. Quietly.'],
    curious: ['What stories were you left? Who left them? Will you tell me some time?'],
    dreamy: ['Stories outlast all of us. That\'s how it should be.'],
    witty: ['Stories. And a list of who owes me money.'],
    proud: ['The family\'s stories. They should know where they come from.'],
    gloomy: ['Stories. Yes. That\'s something nobody can take.'],
  });

  // ==================================================================================
  // Regrets, and pride
  // ==================================================================================
  addThread({
    id: 'ages.regrets', label: 'Any regrets, looking back?', weight: 0.9, cool: 6,
    when: (F) => F.stage === 'elder' || (F.stage === 'grown' && F.ageYears >= 70),
    rel: (F) => (F.trust >= 0.15 ? 1.2 : 0.7),
    open: { ask: 'ages.regrets.open' },
    beats: {
      start: { line: 'ages.regrets.start', go: [
        { ap: 'ask', say: 'And truly?', to: 'truly', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'Only the puddings you didn\'t eat, I hope.', to: 'puddings' },
        { ap: 'listen', say: '*You let the question sit a while.*', label: 'Let it sit', to: 'truly' },
      ] },
      puddings: { line: 'ages.regrets.puddings', go: [
        { ap: 'ask', say: 'And the other kind? The real ones?', to: 'truly' },
        { ap: 'ask', say: 'Then what are you proudest of?', to: 'proud' },
      ] },
      truly: { line: 'ages.regrets.truly', fx: { trust: 0.02 }, go: [
        { ap: 'comfort', say: 'It\'s not too late for some of it.', to: 'late' },
        { ap: 'share', say: 'I\'ve a few of my own. More than a few.', to: 'wizregret', need: { open: 2 }, soft: true },
        { ap: 'ask', say: 'And what are you proudest of?', to: 'proud' },
      ] },
      late: { line: 'ages.regrets.late', go: [
        { ap: 'advise', say: 'Then do the small part of it this week.', to: 'small' },
        { ap: 'ask', say: 'And what are you proudest of?', to: 'proud' },
      ] },
      wizregret: { line: 'ages.regrets.wizask', go: [
        { ap: 'share', say: 'I once left a friend at a door and didn\'t go back for years.', to: 'door' },
        { ap: 'jest', say: 'I once set fire to a bishop. A chess one. Mostly.', to: 'bishop' },
      ] },
      door: { line: 'ages.regrets.door', fx: { trust: 0.05, fond: 0.03, confide: { k: 'ages.wizdoor', t: '{Name} knows the wizard once left a friend at a door too long' } }, end: true },
      bishop: { line: 'ages.regrets.bishop', fx: { fond: 0.02 }, go: [
        { ap: 'share', say: 'And truly: I once left a friend too long without a visit.', to: 'door' },
        { ap: 'warm', say: 'There. We\'ve both confessed.', to: 'end' },
      ] },
      proud: { line: 'ages.regrets.proud', fx: { learn: ['ages.proud', '{Name} is proudest of a life well spent'] }, go: [
        { ap: 'warm', say: 'So you should be.', to: 'should' },
        { ap: 'jest', say: 'More than your pumpkins?', to: 'marrows' },
      ] },
      small: { line: 'ages.regrets.small', fx: { respect: 0.03, feel: 'inspired' }, end: true },
      should: { line: 'ages.regrets.should', fx: { fond: 0.02 }, end: true },
      marrows: { line: 'ages.regrets.marrows', end: true },
    },
    end: { fond: 0.02, trust: 0.02 },
  });
  lines('ages.regrets.open', [
    { text: ['Any regrets, {name}, looking back?', 'If you had it all again, {name}, what would you do differently?', 'Is there anything you wish you\'d done, {name}?'] },
  ]);
  L('ages.regrets.start', {
    _: ['Regrets? A few. Mostly pudding-related.', 'Oh, now. That\'s a big question for a small lane.', 'Who hasn\'t? I don\'t dwell on them. Much.'],
    cheerful: ['Regrets? Ha! I\'ve had a lovely time! ...One or two. Small ones.', 'Not many! I said yes to most things. That helps.'],
    ornery: ['That\'s none of your business. ...One or two.', 'Regrets are for folk who did things wrong. I did most things right.'],
    shy: ['...Oh. Some. I don\'t usually say.', 'I suppose everyone has some. Don\'t they?'],
    curious: ['Interesting you should ask. I\'ve been making a list.', 'Regrets. Hm. I regret not asking more questions. Isn\'t that funny?'],
    dreamy: ['Roads I didn\'t take. I wonder about them sometimes. Where they went.', 'Some. They\'re like old letters. I take them out and read them.'],
    witty: ['Only that I didn\'t start regretting things sooner. I\'d have got through more.', 'I regret this conversation already. ...I\'m joking.'],
    proud: ['Very few. I\'ve lived as I meant to.', 'Regrets? I made my choices. I stand by them. Mostly.'],
    gloomy: ['How long have you got?', 'Plenty. More than I let on.'],
  });
  L('ages.regrets.puddings', {
    _: ['Ha! A few. There was a trifle at a wedding, once. I still think about it.', 'Only one. A plum duff I gave away to be polite. Never again.'],
    cheerful: ['Ha! Every one I said no to! Which was none!'],
    ornery: ['There was a pie I should have had. Someone else had it. I know who.'],
    shy: ['...There was a cake I was too shy to ask for. Ha.'],
    curious: ['I never tried the elves\' bread. Lembas, they call it. I wonder what it\'s like.'],
    dreamy: ['A strawberry tart, one midsummer. I still dream about it.'],
    witty: ['I regret every pudding I didn\'t eat, and some I did.'],
    proud: ['I ate my puddings dutifully. No regrets there.'],
    gloomy: ['Ha. If only it were the puddings.'],
  });
  L('ages.regrets.truly', {
    _: ['I never went over the hills. Not once. Always meant to.', 'I had a quarrel with someone dear and let it sit too long.', 'I never told someone something. They knew. But I never said.'],
    cheerful: ['Not dancing with someone at a party, once. I was too slow. They danced with someone else. Married them.', 'I wish I\'d learned the fiddle. I\'ve always wanted to make the music, not just dance to it.'],
    ornery: ['I let a quarrel go on twenty years. Over a hedge. A hedge! It\'s still there. So\'s the quarrel.', 'I was hard on my children. Harder than I needed to be. There. That\'s it.'],
    shy: ['...I never said what I felt. To anyone. I just hoped they\'d guess.', 'I wish I\'d been braver. About everything.'],
    curious: ['I never learned to read the old maps. There\'s a whole cupboard of them I\'ve never understood.', 'I never asked my grandmother where she came from. Now there\'s no one to ask.'],
    dreamy: ['I meant to see the Sea. Everyone talks about the Sea. I meant to, every spring.', 'I wanted to write a book of songs. I wrote two pages.'],
    witty: ['I spent forty years being clever when I could have been kind. Clever doesn\'t keep you warm.', 'I wish I\'d laughed less at people and more with them.'],
    proud: ['I was too proud to say sorry, once. It cost me a friend. I\'m saying it now, too late.', 'I never let anyone help me. I wish I had. It might have been nice.'],
    gloomy: ['All of it. Every day I could have been happier and wasn\'t.', 'Letting folk go without saying goodbye properly.'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['I never told {ageMissed} how much it all meant. Then {ageMissed} went over the hills.', 'There\'s a thing I meant to say to {ageMissed}. Now I say it to the stone.'] },
    { if: { ageTrips: { min: 1 } }, text: ['I went adventuring once and came home early. Homesick. I\'ve wondered ever since what was round the next bend.'] },
    { if: { rival: has }, text: ['{Rival} and me. All those years of sniping. Over nothing. I\'d take it back if I knew how.'] },
    { if: { homeless: true }, pri: 1, text: ['That I never made a home of my own. I always thought there\'d be time.'] },
  ]);
  L('ages.regrets.late', {
    _: ['Not too late? ...Maybe not. Maybe a little of it.', 'You\'re right, perhaps. I\'ve still got a bit of road left.'],
    cheerful: ['Ooh! You\'re right! I could start this week!'],
    ornery: ['Easy to say. ...But you might be right.'],
    shy: ['...Do you think so? Truly?'],
    curious: ['Which part, though? Which part could I still do? Let me think.'],
    dreamy: ['Maybe the road\'s still there, waiting. Roads are patient.'],
    witty: ['Not too late for the fiddle? The neighbors will disagree.'],
    proud: ['It\'s never too late. I\'ve always said so.'],
    gloomy: ['...Maybe. Maybe it isn\'t.'],
  }, [
    { if: { ageRoad: ['near', 'planned'] }, pri: 1, text: ['Maybe I\'ll see over the hills yet. I\'ve a feeling I will. Soon.'] },
  ]);
  L('ages.regrets.wizask', {
    _: ['You? What could a wizard regret?', 'Really? Tell me one. Fair\'s fair.'],
    cheerful: ['You? Oh, go on! Tell me! I\'ve told you mine!'],
    ornery: ['Fair\'s fair. Out with it, then.'],
    shy: ['...You don\'t have to tell me. But I\'d listen.'],
    curious: ['What\'s a wizard\'s regret like? Bigger than ours? I\'ve always wondered.'],
    dreamy: ['I never thought of you having roads not taken.'],
    witty: ['A wizard\'s regrets. This should be good.'],
    proud: ['Well. Let\'s hear it, then.'],
    gloomy: ['Even you? Then there\'s no escaping it.'],
  });
  L('ages.regrets.door', {
    _: ['...Oh. And did you? Go back?', 'Then you know. Thank you for telling me. Truly.'],
    cheerful: ['Oh, you poor thing. But you went back in the end? Say you did.'],
    ornery: ['Hmph. Well. Go and see them, if you can. Don\'t be like me.'],
    shy: ['...I won\'t tell anyone. Thank you for trusting me.'],
    curious: ['Who? No. Don\'t say. It doesn\'t matter who. It matters that you went back.'],
    dreamy: ['Doors stay open longer than we think. I believe that.'],
    witty: ['Wizards and their doors. You\'re as daft as the rest of us, then.'],
    proud: ['That takes courage, to say. I respect that.'],
    gloomy: ['...We\'re all the same, then. Even wizards.'],
  });
  L('ages.regrets.bishop', {
    _: ['Ha! Mostly? What happened to the rest of him?', 'A chess bishop! Ha! You\'re dreadful.'],
    cheerful: ['Ha! Oh, that\'s wonderful!'],
    ornery: ['That\'s not a regret, that\'s a confession.'],
    shy: ['...Ha. Was it an accident?'],
    curious: ['How do you mostly set fire to a bishop?'],
    dreamy: ['A burning bishop. There\'s a painting in that.'],
    witty: ['Mostly! I knew the hat was dangerous.'],
    proud: ['That\'s not a proper regret. You\'re dodging.'],
    gloomy: ['Ha. That\'s cheered me up, that has.'],
  });
  L('ages.regrets.proud', {
    _: ['That I was here. That I helped. That folk come to my door.', 'My children. Every one. They turned out kind.'],
    cheerful: ['Oh, the parties! I\'ve thrown the best parties in Thistledown! And the friends from them.'],
    ornery: ['That I never once took more than my share. Not once. Ask anyone.', 'My hedge. The finest hedge in the valley. And the quarrel was worth it.'],
    shy: ['...That I was kind. Quietly. I think I was kind.'],
    curious: ['That I never stopped asking. I know more now than I did at thirty. Much more.'],
    dreamy: ['That I noticed things. The light. The little things. I noticed.'],
    witty: ['That I made folk laugh. At the Badger, at weddings, once at a Moot. Especially at the Moot.'],
    proud: ['My work. My good name. My family. In that order, some days.'],
    gloomy: ['...That I kept going. When it was hard. I kept going.'],
  }, [
    { if: { kid: has }, pri: 1, text: ['{Kid}. All of them, but {kid} especially. Don\'t tell the others.'] },
    { if: { job: (j) => !!j }, text: ['My {ageTrade}. I did it well, and for everyone.'] },
    { if: { pastime: ['carving', 'basketry', 'pottery', 'knitting', 'painting'], made: { min: 5 } }, text: ['{AgeMadeWord} {madeMany}, and every one of them given away. That\'s what I\'m proudest of.'] },
    { if: { ageFounder: true }, text: ['That I was here at the start. This hill was grass, and we made it home.'] },
  ]);
  L('ages.regrets.small', {
    _: ['The small part. Yes. I could do that. I will.', 'This week. Hm. All right. I\'ll start Mersday.'],
    cheerful: ['Yes! A small part! I\'ll start today!'],
    ornery: ['Fine. A small part. Don\'t expect miracles.'],
    shy: ['...A small part. I can manage small.'],
    curious: ['Small parts. That\'s how everything gets done, isn\'t it?'],
    dreamy: ['A small step down an old road. I like that.'],
    witty: ['A small part. Very small. Microscopic. But a part.'],
    proud: ['I\'ll do the whole of it, thank you. But I\'ll start small.'],
    gloomy: ['...All right. I\'ll try.'],
  });
  L('ages.regrets.should', {
    _: ['...I am. Quietly. Don\'t tell anyone.', 'Thank you. It\'s nice to be told, now and then.'],
    cheerful: ['I am! I really am!'],
    ornery: ['Hmph. I know.'],
    shy: ['...Thank you.'],
    curious: ['I suppose I should. I\'ve never let myself.'],
    dreamy: ['I\'ll be proud, then. For an hour or two.'],
    witty: ['I am. Insufferably.'],
    proud: ['I am. Very.'],
    gloomy: ['...Maybe I should.'],
  });
  L('ages.regrets.marrows', {
    _: ['Ha! Nearly. The pumpkins were close.', 'Don\'t tell the pumpkins.'],
    cheerful: ['Ha! Almost! The pumpkins were a close second!'],
    ornery: ['The pumpkins are a separate matter. Entirely.'],
    shy: ['...Ha. Yes. More than the pumpkins.'],
    curious: ['I never grew pumpkins. Should I have?'],
    dreamy: ['Pumpkins come and go. Love stays.'],
    witty: ['The pumpkins know their place. Second.'],
    proud: ['My pumpkins are a matter of public record.'],
    gloomy: ['Ha. The pumpkins rotted. So, yes.'],
  });

  // ==================================================================================
  // The last great adventure
  // ==================================================================================
  addThread({
    id: 'ages.lastroad', label: (F) => (F.ageRoad === 'planned' ? 'You\'re setting off, I hear' : 'Thinking of the hills?'), weight: 1.0, cool: 4,
    when: (F) => F.stage === 'elder',
    rel: (F) => (F.ageRoad === 'planned' ? 3 : F.ageRoad === 'near' ? 1.8 : 0.6),
    open: { warm: 'ages.lastroad.open' },
    beats: {
      start: { line: 'ages.lastroad.start', go: [
        { ap: 'ask', say: 'Where do you suppose the road goes?', to: 'where' },
        { ap: 'warm', say: 'You\'ll be missed, you know.', to: 'missed' },
        { ap: 'jest', say: 'Pack more handkerchiefs than you think. Then double it.', to: 'pack' },
      ] },
      where: { line: 'ages.lastroad.where', go: [
        { ap: 'tale', say: 'I\'ve walked a long way west. The light there is very kind.', to: 'west' },
        { ap: 'ask', say: 'Are you afraid, at all?', to: 'afraid', need: { open: 1 }, soft: true },
        { ap: 'listen', say: '*You look at the hills with them a while.*', label: 'Look at the hills with them', to: 'hills' },
      ] },
      missed: { line: 'ages.lastroad.missed', go: [
        { ap: 'warm', say: 'I\'ll look in on {kid}. I promise.', to: 'lookin', need: { if: { kid: has } } },
        { ap: 'comfort', say: 'They\'ll carry you with them. That\'s how it works.', to: 'carry' },
        { ap: 'ask', say: 'What will you take with you?', to: 'take' },
      ] },
      pack: { line: 'ages.lastroad.pack', go: [
        { ap: 'jest', say: 'And a seed-cake. For emergencies.', to: 'cake' },
        { ap: 'ask', say: 'What will you take, truly?', to: 'take' },
      ] },
      west: { line: 'ages.lastroad.west', fx: { trust: 0.03 }, go: [
        { ap: 'ask', say: 'Are you afraid, at all?', to: 'afraid' },
        { ap: 'warm', say: 'You\'ll walk it well. You\'ve walked everything well.', to: 'well' },
      ] },
      hills: { line: 'ages.lastroad.hills', fx: { trust: 0.02, drive: { lonely: -0.06 } }, go: [
        { ap: 'ask', say: 'Are you afraid, at all?', to: 'afraid' },
        { ap: 'ask', say: 'Who\'ll you miss most?', to: 'missed' },
      ] },
      afraid: { line: 'ages.lastroad.afraid', fx: { trust: 0.02 }, go: [
        { ap: 'comfort', say: 'That\'s only love, looking for somewhere to go.', to: 'love' },
        { ap: 'share', say: 'Everyone\'s a little afraid at a door. Then you open it.', to: 'door' },
      ] },
      take: { line: 'ages.lastroad.take', fx: { learn: ['ages.take', '{Name} has thought about what to take over the hills'] }, go: [
        { ap: 'ask', say: 'And what will you leave behind?', to: 'leave' },
        { ap: 'jest', say: 'No room for a wizard, then?', to: 'room' },
      ] },
      cake: { line: 'ages.lastroad.cake', fx: { joke: { k: 'ages.cake', t: 'A seed-cake for emergencies, on the last road.' } }, go: [
        { ap: 'ask', say: 'What will you take, truly?', to: 'take' },
        { ap: 'warm', say: 'I\'ll bake you one myself. Badly.', to: 'end' },
      ] },
      leave: { line: 'ages.lastroad.leave', go: [
        { ap: 'warm', say: 'I\'ll look in on {kid}. I promise.', to: 'lookin', need: { if: { kid: has } } },
        { ap: 'comfort', say: 'You\'re leaving more than you know.', to: 'more' },
      ] },
      room: { line: 'ages.lastroad.room', fx: { fond: 0.02 }, end: true },
      lookin: { line: 'ages.lastroad.lookin', fx: { trust: 0.05, run: (T, v) => { const kid = Game.villagers.find((o) => o.parents.includes(v.id) && !o.leaving); if (kid) promiseLookIn(T, v, kid.id, 'You promised to look in on {who}'); } }, end: true },
      carry: { line: 'ages.lastroad.carry', fx: { fond: 0.03 }, end: true },
      well: { line: 'ages.lastroad.well', fx: { fond: 0.02 }, end: true },
      love: { line: 'ages.lastroad.love', fx: { trust: 0.04, fond: 0.03 }, end: true },
      door: { line: 'ages.lastroad.door', fx: { trust: 0.04, remember: 'The wizard said everyone\'s a little afraid at a door.', rv: 1 }, end: true },
      more: { line: 'ages.lastroad.more', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.03, trust: 0.02, remember: 'Talked with the wizard about the last road.', rv: 1 },
  });
  lines('ages.lastroad.open', [
    { text: ['You\'re looking at the hills a good deal, {name}.', 'I saw you watching the West Road this morning, {name}.'] },
    { if: { ageRoad: 'planned' }, text: ['I hear you\'re setting off, {name}.', 'So. The last great adventure, {name}. Word gets about.'] },
  ]);
  L('ages.lastroad.start', {
    _: ['I have been. They look nearer than they used to. Or I\'m further on.', 'The hills. Yes. They\'ve started calling, a bit. Like supper does.'],
    cheerful: ['I have! Isn\'t it exciting? A whole new road, at my age!', 'The hills look lovely, don\'t they. I\'ve been wondering what\'s on the other side. Soon I\'ll know!'],
    ornery: ['I\'m not going yet, if that\'s what you\'re hinting. I\'ve a hedge to finish.', 'Everyone\'s watching me to see if I\'ll go. I\'ll go when I please.'],
    shy: ['...I have. I haven\'t told anyone. It feels close.', 'Yes. I keep looking. I don\'t quite know why.'],
    curious: ['I want to know where the road goes. Nobody\'s ever come back to say. That\'s a mystery, that is.', 'Do you know, I think it might be the most interesting thing I ever do.'],
    dreamy: ['They\'re so blue in the evenings. Like a door left open.', 'I dreamed of the road last night. It was lined with lanterns.'],
    witty: ['I\'ve been eyeing them up. They\'ve been eyeing me back. We\'re negotiating.', 'Well. Everything else in the village I\'ve already seen.'],
    proud: ['When it\'s time I\'ll go with my head up, and my good waistcoat on.', 'I\'ve done what I came to do. The hills can wait a little. Not long.'],
    gloomy: ['They\'re waiting. I can feel them waiting.', 'Everyone goes, in the end. I\'d rather not think about it. I think about it.'],
  }, [
    { if: { ageRoad: 'planned' }, pri: 2, text: ['You\'ve heard, then. Yes. I\'ve decided. My boots are by the door.', 'I\'m off. Not yet, mind. But I\'m off. It feels right.'] },
    { if: { ageRoad: 'planned', temper: 'cheerful' }, pri: 2, text: ['I\'m going! I\'ve packed and unpacked four times. I\'m so excited I can\'t eat. Well. I can eat.'] },
    { if: { ageRoad: 'planned', temper: 'gloomy' }, pri: 2, text: ['I\'m going. It\'s time. Don\'t make a fuss. ...You can make a small fuss.'] },
    { if: { ageRoad: 'planned', spouse: has }, pri: 3, text: ['{Spouse} and I are going together, if {spouse} has a say. And {spouse} always has a say.'] },
    { if: { ageMissed: has, ageMissedRel: ['wife', 'husband'] }, pri: 1, text: ['{AgeMissed} went ahead of me. I\'ve a feeling {ageMissed} is keeping the kettle warm.'] },
  ]);
  L('ages.lastroad.where', {
    _: ['Somewhere with no stairs, I hope. And sunshine. And everyone who went before.', 'West, they say. Past the Sea, maybe. I\'ll know when I get there.'],
    cheerful: ['Somewhere lovely! With a party at the end and all my old friends at the table!', 'Over the hills and through the best orchard you ever saw. I\'ve decided.'],
    ornery: ['Somewhere quiet, if there\'s any justice. No neighbors. No Moot.', 'Wherever it goes, I\'ll walk it on my own feet. That\'s all I ask.'],
    shy: ['...Somewhere gentle. I hope it\'s gentle.', 'I think it goes somewhere nobody has to talk unless they want to.'],
    curious: ['I\'ve a theory. It goes round, and comes back from the other side, and everyone\'s there.', 'Nobody knows! That\'s the best bit. One last thing nobody knows.'],
    dreamy: ['To where the light goes in the evening. It has to go somewhere.', 'A green country under a swift sunrise. I heard that in a song once.'],
    witty: ['To an inn with no last orders, I hope.', 'Somewhere they\'ve heard of me. I\'ll have a reputation to keep up.'],
    proud: ['Somewhere fitting. I\'ve earned somewhere fitting.', 'Where all the good folk go. I mean to be welcome.'],
    gloomy: ['Away. That\'s all anyone knows. Away.', 'I don\'t know. That\'s what\'s hard. Not knowing.'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['Wherever {ageMissed} went. I mean to catch {ageMissed} up. I always was slower.'] },
    { if: { rift: true }, text: ['Maybe it\'s a rift of its own. A gold one. And everyone\'s on the other side, online.'] },
  ]);
  L('ages.lastroad.missed', {
    _: ['I know. That\'s the hard bit. Not the going. The missing.', 'Will I? I hope so. A little. Not too much.'],
    cheerful: ['Oh, I\'ll miss them too! But they\'ll have a party for me. I\'ve left instructions.', 'Missed! Good! I\'d hate to go and have nobody notice.'],
    ornery: ['They\'ll miss me nagging. They won\'t admit it.', 'Hmph. Somebody\'ll have to mend the fences properly. They\'ll miss that.'],
    shy: ['...I don\'t think many will notice. But thank you.', 'Do you think so? I always thought I was easy to forget.'],
    curious: ['I wonder who will. It\'s not always who you think, is it?'],
    dreamy: ['I\'ll leave a bit of myself in the lane. Like a coat on a peg.'],
    witty: ['They\'ll miss my seed-cake. They\'ll get over me in a week.'],
    proud: ['I should think so. I\'ve been here a very long time.'],
    gloomy: ['I worry who\'ll be lonely. That\'s what I worry about.'],
  }, [
    { if: { spouse: has }, pri: 1, text: ['{Spouse}\'s the one I worry about. Who\'ll make the tea too strong for {spouse}?'] },
    { if: { kid: has }, pri: 1, text: ['It\'s {kid} I think of. {Kid} pretends not to be soft. {Kid}\'s very soft.'] },
    { if: { ageGrandkid: has, ageGrandkidBaby: false }, pri: 1, text: ['{AgeGrandkid} won\'t understand. I\'ve tried to explain. Hills, I said. Big hills.'] },
  ]);
  L('ages.lastroad.pack', {
    _: ['Ha! Six already. And a spare in the boot.', 'Handkerchiefs! The first thing, always. My mother taught me.'],
    cheerful: ['Ha! A dozen! One for every goodbye!'],
    ornery: ['I\'ve packed my own bag for eighty years, thank you.'],
    shy: ['...I\'ve put in four. Is that enough?'],
    curious: ['How many does one need for a road of unknown length? I\'ve been calculating.'],
    dreamy: ['Handkerchiefs to wave from the top of the hill.'],
    witty: ['Doubled! I\'ll need a second pack just for the hankies.'],
    proud: ['Ironed, folded, embroidered. I\'ll go properly.'],
    gloomy: ['I\'ll need them. Folk will cry. I\'ll cry.'],
  });
  L('ages.lastroad.west', {
    _: ['Kind light. Yes. I\'d like that.', 'You\'ve been? Further than the hills? ...And it\'s kind?'],
    cheerful: ['Oh, that sounds lovely! I\'ll keep an eye out for it!'],
    ornery: ['Hmph. Kind light. Well. That\'ll make a change.'],
    shy: ['...Kind. Good. Kind is good.'],
    curious: ['You\'ve seen it? What else? What does it smell like? Are there birds?'],
    dreamy: ['I knew it. I always knew it would be kind.'],
    witty: ['Kind light, good. As long as it\'s not too bright. I\'ll forget my hat.'],
    proud: ['I\'ll walk into it properly, then.'],
    gloomy: ['...That helps, a bit. Kind light. Thank you.'],
  });
  L('ages.lastroad.hills', {
    _: ['*They look for a long while, and then laugh softly.* There\'s a sheep up there. Look.', '*After a time* ...They\'re not so big, are they. From here.'],
    cheerful: ['*Smiles all the way up at them.* Hello, hills.'],
    ornery: ['*Squints.* That top field\'s badly drained. Somebody should see to it.'],
    shy: ['*Slips a hand into yours, then takes it back.* ...Sorry.'],
    curious: ['*Points.* That path. I always wanted to know where that path went.'],
    dreamy: ['*Hums something old, very quietly.*'],
    witty: ['*After a while* They\'re not going anywhere. I\'ll give them that.'],
    proud: ['*Stands a little straighter.* There.'],
    gloomy: ['*Takes a long breath.* ...Thank you for standing here.'],
  });
  L('ages.lastroad.afraid', {
    _: ['A little. Not of the road. Of the leaving.', 'Of not saying goodbye properly to everyone. That\'s all.'],
    cheerful: ['Afraid? A bit! The good kind. Like before a dance.'],
    ornery: ['Afraid? Of a road? I\'ve faced the Moot. A road\'s nothing.', '...A bit. Don\'t you tell anyone.'],
    shy: ['...Yes. A little. Is that all right?'],
    curious: ['Not of the road. Of missing what happens here, after. I want to know how it all turns out.'],
    dreamy: ['Afraid of forgetting. Their faces. The color of the lane in autumn.'],
    witty: ['Only of going without my good boots.', 'Of the food. What if they don\'t do second breakfast?'],
    proud: ['No. ...Not much. A little. I\'ll go anyway.'],
    gloomy: ['Yes. I am. I think everyone is.'],
  });
  L('ages.lastroad.take', {
    _: ['My walking stick, my pipe, and a jar of the good honey.', 'A warm coat and a good pair of boots. And a letter from home to read on the way.'],
    cheerful: ['Cookies! Lots of cookies! And a song for every mile!'],
    ornery: ['As little as possible. I\'ve carried enough.'],
    shy: ['...A little stone from the river. I\'ve had it since I was small.'],
    curious: ['A notebook. Someone should write it down.'],
    dreamy: ['The smell of the hay in June. If you can pack a smell.'],
    witty: ['A spare everything. And a map, which I won\'t read.'],
    proud: ['My good waistcoat and my best pipe. I\'ll arrive looking the part.'],
    gloomy: ['Not much. It\'s the people I\'d want to take.'],
  }, [
    { if: { ageKeepsake: has }, pri: 1, text: ['I was going to take {ageKeepsake}. But it should stay. It belongs here.'] },
    { if: { pastime: ['carving', 'basketry', 'pottery', 'knitting', 'painting'], made: { min: 2 } }, text: ['One of my {madeMany}. The first one I made. It\'s terrible. I love it.'] },
  ]);
  L('ages.lastroad.cake', {
    _: ['Ha! A seed-cake for emergencies. That\'s wisdom.', 'Two. One for me and one for whoever I meet.'],
    cheerful: ['Ha! Of course! What\'s an adventure without cake?'],
    ornery: ['I was always going to take cake. Obviously.'],
    shy: ['...I\'d already packed one. Ha.'],
    curious: ['What counts as a cake emergency? I\'ll need to define it.'],
    dreamy: ['A seed-cake on a hilltop. That\'ll be a fine moment.'],
    witty: ['An emergency is any moment without cake.'],
    proud: ['My own recipe. The best in the valley.'],
    gloomy: ['Ha. Yes. Cake. That helps.'],
  });
  L('ages.lastroad.leave', {
    _: ['My garden. My chair by the fire. Everyone. That\'s the lot.', 'A good name, I hope. And a tidy larder.'],
    cheerful: ['Everything! And a note to say enjoy it!'],
    ornery: ['A list of instructions. Which they\'ll ignore.'],
    shy: ['...A letter for each of them. Under the clock.'],
    curious: ['All my questions. Someone else can answer them.'],
    dreamy: ['The view from my window. Someone else should love it now.'],
    witty: ['My debts and my opinions. Equally large.'],
    proud: ['A family that knows how to do things properly.'],
    gloomy: ['Too much. I\'m leaving too much.'],
  }, [
    { if: { kid: has }, pri: 1, text: ['{Kid}. That\'s the hard one. {Kid}\'s grown, I know. Still.'] },
  ]);
  L('ages.lastroad.room', {
    _: ['Ha! For you? I\'d make room. You\'d only take up the whole road.', 'You\'d come along and set the hills on fire.'],
    cheerful: ['Oh, come! Do! We\'d have such a time!'],
    ornery: ['Not on your life. You\'d talk the whole way.'],
    shy: ['...You could walk me to the bridge. That would be nice.'],
    curious: ['Would you? Could you? Do wizards go that way?'],
    dreamy: ['Walk me to the top of the hill. That\'s far enough for a friend.'],
    witty: ['There\'s no room for your hat. I\'ve measured.'],
    proud: ['I\'ll manage on my own, thank you. But I\'m touched.'],
    gloomy: ['...I\'d like that, actually. I\'d like company.'],
  });
  L('ages.lastroad.lookin', {
    _: ['You will? ...Oh, that\'s a weight off. Thank you.', 'Promise? Then I can go easy.'],
    cheerful: ['Oh, would you! {Kid} would love that! And so would I!'],
    ornery: ['Hmph. Make sure you do. {Kid} won\'t ask for help. Gets that from me.'],
    shy: ['...Thank you. I didn\'t like to ask.'],
    curious: ['Would you tell {kid} something from me? No. I\'ll tell {kid} myself. But look in.'],
    dreamy: ['Then I\'ll leave {kid} in good hands. Good, tall hands.'],
    witty: ['Look in. Eat {kid}\'s cookies. Report back.'],
    proud: ['{Kid} will manage. But it would mean a great deal.'],
    gloomy: ['...That helps. More than you know.'],
  });
  L('ages.lastroad.carry', {
    _: ['...I like that. I\'ll be in their pockets. Like a sweet.', 'Carry me. Yes. I carried them, once.'],
    cheerful: ['Oh, I hope they carry me somewhere fun!'],
    ornery: ['They\'d better not drop me.'],
    shy: ['...That\'s a nice thought. I\'ll hold on to it.'],
    curious: ['Is that how it works? I suppose it is. That\'s how I carry my mother.'],
    dreamy: ['Like a song you hum without knowing you\'re humming.'],
    witty: ['Carry me. Hope I\'m not too heavy.'],
    proud: ['As long as they carry me properly.'],
    gloomy: ['...Yes. I suppose they will.'],
  });
  L('ages.lastroad.well', {
    _: ['...Thank you. That\'s a kind thing to say to an old hobbit.', 'I\'ll try. One foot, then the other.'],
    cheerful: ['I will! I\'ll walk it singing!'],
    ornery: ['Hmph. I walked everything slowly. Well, but slowly.'],
    shy: ['...Thank you.'],
    curious: ['Well? I hope so. I\'ll take notes.'],
    dreamy: ['One foot, then the other, and the light ahead.'],
    witty: ['Not everything. There was the time with the pond.'],
    proud: ['I have, haven\'t I. I have.'],
    gloomy: ['...I\'ll try. For them.'],
  });
  L('ages.lastroad.love', {
    _: ['...Love, looking for somewhere to go. Oh. Yes. That\'s it exactly.', 'I\'ll remember that. On the road. I\'ll remember that.'],
    cheerful: ['Oh! Oh, that\'s lovely. I\'m going to cry now.'],
    ornery: ['Hmph. ...Hmph. Well. Thank you.'],
    shy: ['...Thank you. I needed that.'],
    curious: ['That\'s... yes. That\'s what fear is, isn\'t it. I\'d never thought.'],
    dreamy: ['Then I\'ll take it with me. All of it.'],
    witty: ['That\'s annoyingly wise. I\'ll steal it.'],
    proud: ['...Yes. That\'s it.'],
    gloomy: ['...Then I\'ve a great deal of love. That\'s something.'],
  });
  L('ages.lastroad.door', {
    _: ['Then you open it. Yes. Simple, put like that.', 'Even you? ...Then I\'ll be in good company.'],
    cheerful: ['Then I\'ll fling it open! Like a party!'],
    ornery: ['Then I\'ll open it. Firmly.'],
    shy: ['...Then I\'ll open it a little, and peek.'],
    curious: ['And you never know what\'s behind it. That\'s the best bit.'],
    dreamy: ['A round door, I hope. Green. With a brass knob.'],
    witty: ['As long as it\'s not a stuck one. I\'ve had enough stuck doors.'],
    proud: ['I\'ll open it properly.'],
    gloomy: ['...Then I\'ll open it. Thank you.'],
  });
  L('ages.lastroad.more', {
    _: ['Do you think so? ...I hope so.', 'More than I know. I like that. I\'ll think about it on the road.'],
    cheerful: ['Oh, that\'s lovely! I hope it\'s pies!'],
    ornery: ['Hmph. As long as they mend the fence.'],
    shy: ['...Thank you.'],
    curious: ['What, do you think? I\'d like to know. I\'ll never know.'],
    dreamy: ['Footprints in the lane. Laughter in the walls.'],
    witty: ['I\'m leaving a lot of crockery. Is that what you mean?'],
    proud: ['I\'ve left a great deal. I\'m sure of it.'],
    gloomy: ['...Maybe. Maybe so.'],
  });

  // ==================================================================================
  // What they'd like to be remembered for
  // ==================================================================================
  addThread({
    id: 'ages.legacy', label: 'What would you like folk to remember?', weight: 0.9, cool: 6,
    when: (F) => F.stage === 'elder' || (F.stage === 'grown' && F.ageYears >= 80),
    rel: (F) => (F.ageRoad === 'planned' || F.ageRoad === 'near' ? 1.5 : 1),
    open: { ask: 'ages.legacy.open' },
    beats: {
      start: { line: 'ages.legacy.start', go: [
        { ap: 'ask', say: 'And truly?', to: 'truly' },
        { ap: 'jest', say: 'I\'ll see it gets a mention on the stone.', to: 'stone' },
        { ap: 'warm', say: 'I can think of a few things already.', to: 'list' },
      ] },
      stone: { line: 'ages.legacy.stone', go: [
        { ap: 'ask', say: 'And under that? What\'s the real thing?', to: 'truly' },
        { ap: 'jest', say: 'In very small letters. Stone\'s dear.', to: 'small' },
      ] },
      list: { line: 'ages.legacy.list', go: [
        { ap: 'warm', say: 'Your kindness. Everyone says so.', to: 'kind' },
        { ap: 'jest', say: 'Your seed-cake. Legendary. Possibly dangerous.', to: 'cake' },
        { ap: 'warm', say: 'Your {ageTrade}. Nobody does it better.', to: 'work', need: { if: { job: has } } },
      ] },
      truly: { line: 'ages.legacy.truly', fx: { learn: ['ages.legacy', '{Name} hopes to be remembered kindly'] }, go: [
        { ap: 'tale', say: 'Then I\'ll tell it, under the great tree. When it\'s time.', to: 'tale', need: { open: 1 }, soft: true },
        { ap: 'ask', say: 'Who taught you that?', to: 'taught' },
        { ap: 'comfort', say: 'You already are. I\'ve heard folk say it.', to: 'already' },
      ] },
      small: { line: 'ages.legacy.small', go: [
        { ap: 'ask', say: 'Now. The real thing?', to: 'truly' },
        { ap: 'warm', say: 'I\'ll pay for the big letters.', to: 'end' },
      ] },
      kind: { line: 'ages.legacy.kind', fx: { fond: 0.03 }, go: [
        { ap: 'tale', say: 'I\'ll tell that, under the great tree. When it\'s time.', to: 'tale' },
        { ap: 'warm', say: 'They mean it. So do I.', to: 'end' },
      ] },
      cake: { line: 'ages.legacy.cake', fx: { joke: { k: 'ages.legacycake', t: 'Their seed-cake: legendary, possibly dangerous.' } }, go: [
        { ap: 'ask', say: 'And truly? Beyond the cake?', to: 'truly' },
        { ap: 'jest', say: 'I\'ll need the recipe. For the stone.', to: 'recipe' },
      ] },
      work: { line: 'ages.legacy.work', fx: { respect: 0.02 }, go: [
        { ap: 'ask', say: 'And truly? Beyond the work?', to: 'truly' },
        { ap: 'warm', say: 'It\'s in every loaf and lane. That\'s remembered.', to: 'end' },
      ] },
      tale: { line: 'ages.legacy.tale', fx: { trust: 0.05, confide: { k: 'ages.tale', t: 'you said you\'d tell {Name}\'s tale under the great tree, when it\'s time' } }, end: true },
      taught: { line: 'ages.legacy.taught', fx: { trust: 0.02 }, end: true },
      already: { line: 'ages.legacy.already', fx: { fond: 0.03 }, end: true },
      recipe: { line: 'ages.legacy.recipe', end: true },
    },
    end: { fond: 0.02, trust: 0.02 },
  });
  lines('ages.legacy.open', [
    { text: ['What would you like folk to remember of you, {name}?', 'When they talk about you at the Badger, {name}, years from now, what should they say?'] },
  ]);
  L('ages.legacy.start', {
    _: ['Remembered? Me? For my pumpkins, I expect.', 'Oh, I don\'t know. That I paid my debts and kept a tidy step.', 'For the time I fell in the river at the Midsummer fair. Everyone does.'],
    cheerful: ['For my parties! The year with the pig on the roof! Everyone remembers that!', 'For laughing. I\'d like them to remember me laughing.'],
    ornery: ['I\'d like them to remember I was right. About the drains. About everything.', 'Remembered? I\'d settle for being listened to while I\'m here.'],
    shy: ['...I don\'t think they will. Not really. That\'s all right.', 'Oh. I hadn\'t thought. I don\'t think I\'ve done anything to remember.'],
    curious: ['For asking the questions nobody else would. "Why is the mill on that side?" That sort of thing.', 'I\'d like them to remember I was curious. And then go and be curious.'],
    dreamy: ['For noticing the evening light. If anyone remembers that, I\'ll be content.', 'I\'d like to be remembered like a tune. Just there, in the background.'],
    witty: ['For my jokes. The good ones. Not the one about the badger.', 'Remembered? I\'d like to be quoted. Inaccurately, at weddings.'],
    proud: ['For doing things properly. Every day. For seventy years.', 'My work. My family. My good name.'],
    gloomy: ['They won\'t. Not for long. That\'s the way of it.', 'I don\'t suppose anyone will. Who remembers the ordinary ones?'],
  }, [
    { if: { job: (j) => !!j }, text: ['For my {ageTrade}, I suppose. That\'s what they know me for.'] },
    { if: { pastime: ['carving', 'basketry', 'pottery', 'knitting', 'painting'], made: { min: 3 } }, text: ['For my {madeMany}. {AgeMadeWord} of them about the village. They\'ll last longer than me.'] },
    { if: { ageFounder: true }, text: ['For being here at the start. Somebody should remember there was a start.'] },
  ]);
  L('ages.legacy.stone', {
    _: ['Ha! "Here\'s to the pumpkins." In big letters.', 'Ha! On the stone. Under my name. "And their pumpkins."'],
    cheerful: ['Ha! Oh, do! With a little pumpkin carved at the bottom!'],
    ornery: ['Don\'t you dare. ...Well. A small mention.'],
    shy: ['...Ha. Please don\'t. ...Maybe a small one.'],
    curious: ['What do they carve on the stones? I\'ve never looked closely. I should.'],
    dreamy: ['A stone with a pumpkin on it. Folk would smile, walking past. That\'s nice.'],
    witty: ['"Here lies, well, nobody. They went west. Mind the pumpkins."'],
    proud: ['A prize-winning pumpkin deserves a mention.'],
    gloomy: ['A stone. Yes. That\'s what we get. A stone.'],
  });
  L('ages.legacy.list', {
    _: ['You can? Like what?', 'Go on, then. I\'m listening.'],
    cheerful: ['Ooh! Go on, then! Flatter me!'],
    ornery: ['Hmph. Name one.'],
    shy: ['...You can? Really?'],
    curious: ['Can you? What? I genuinely want to know.'],
    dreamy: ['Oh, tell me. I\'d like to hear how I look from outside.'],
    witty: ['Careful. I\'m old. My heart can\'t take compliments.'],
    proud: ['I\'m sure you can. Go on.'],
    gloomy: ['...Like what?'],
  });
  L('ages.legacy.truly', {
    _: ['That I was kind. That the door was always open and the kettle always on.', 'That nobody went hungry if I knew about it.'],
    cheerful: ['That I made the place happier. Even a little. That would do me.'],
    ornery: ['That I was fair. Hard, maybe. But fair. I\'d like that said.'],
    shy: ['...That I was a good friend. To the few I had.'],
    curious: ['That I left folk wondering. In a good way.'],
    dreamy: ['That I loved this valley. Every stone and every hedge.'],
    witty: ['That I made them laugh on the bad days. That\'s when it counts.'],
    proud: ['That my word was good. Always. Ask anybody.'],
    gloomy: ['That I tried. That\'s all. That I tried.'],
  }, [
    { if: { kid: has }, pri: 1, text: ['That I was a good parent to {kid}. Not perfect. Good.'] },
    { if: { spouse: has }, pri: 1, text: ['That {spouse} and I were happy. Folk should know it can be done.'] },
  ]);
  L('ages.legacy.small', {
    _: ['Ha! Very small. The pumpkin can go on the back.', 'Stone\'s dear! Ha! Then just my initials and a pumpkin.'],
    cheerful: ['Ha! Tiny letters! And a tiny pumpkin!'],
    ornery: ['They\'ll charge by the letter. Thieves.'],
    shy: ['...Small is fine. Small suits me.'],
    curious: ['Is it charged by the letter? I\'ll have a short name, then.'],
    dreamy: ['Small letters, worn soft by the rain. That\'s rather beautiful.'],
    witty: ['I\'ll have them carve "see other side".'],
    proud: ['Large letters. I\'ve saved for it.'],
    gloomy: ['Small. Yes. That\'s about right.'],
  });
  L('ages.legacy.kind', {
    _: ['Do they? ...Do they really? Oh.', 'Kindness. Well. I\'d take that over the pumpkins.'],
    cheerful: ['Oh! Oh, that\'s lovely. I\'ll be smiling all week.'],
    ornery: ['Kind? Me? Hmph. ...Who said?'],
    shy: ['...I didn\'t know anyone noticed.'],
    curious: ['What did they say? Exactly? Who said it?'],
    dreamy: ['Kind. That\'s the word I\'d have chosen.'],
    witty: ['Kind! I\'ve been found out.'],
    proud: ['I\'ve always tried to be. It\'s good to hear.'],
    gloomy: ['...Really? Thank you. I needed that.'],
  });
  L('ages.legacy.cake', {
    _: ['Ha! It\'s only dangerous if you eat three.', 'Legendary! I\'ll have that on the stone, then.'],
    cheerful: ['Ha! The cake! Of course! I\'ll leave the recipe in my will!'],
    ornery: ['My seed-cake is not dangerous. It\'s robust.'],
    shy: ['...Ha. It does have a lot of seeds.'],
    curious: ['What makes it dangerous, do you think? The caraway?'],
    dreamy: ['A cake that outlives its baker. That\'s a kind of magic.'],
    witty: ['Possibly dangerous. That\'s my whole life, summed up.'],
    proud: ['My seed-cake has won prizes, I\'ll have you know.'],
    gloomy: ['Ha. At least the cake will be remembered.'],
  });
  L('ages.legacy.work', {
    _: ['Do you think so? I\'ve tried to do it well.', 'My {ageTrade}. Yes. I\'d be glad of that.'],
    cheerful: ['Oh, I do love my work! Being remembered for it would be grand.'],
    ornery: ['Better than the young ones, at least. They rush.'],
    shy: ['...Thank you. I didn\'t think anyone noticed.'],
    curious: ['I\'ve learned so much doing it. More than anyone knows.'],
    dreamy: ['The work goes on after. That\'s the beauty of it.'],
    witty: ['Nobody does it better. Nobody else will do it at all.'],
    proud: ['Nobody does. That\'s simply true.'],
    gloomy: ['Someone will do it after me. Probably better.'],
  });
  L('ages.legacy.tale', {
    _: ['You\'d do that? Under the great tree? ...Oh. Oh, my.', 'A tale. About me. Make me taller.'],
    cheerful: ['A tale! About me! Oh, put in the pig! Please put in the pig!'],
    ornery: ['You\'d better get it right. I\'ll know if you don\'t.'],
    shy: ['...You don\'t have to. ...But I\'d like it. Very much.'],
    curious: ['What would you say? Would you tell the true bits or the good bits?'],
    dreamy: ['A tale under the tree. That\'s the best thing anyone could give me.'],
    witty: ['Leave out the river. And the badger. And the Moot. Actually, keep the Moot.'],
    proud: ['I\'d be honored. Truly.'],
    gloomy: ['...Nobody\'s ever said anything like that to me.'],
  });
  L('ages.legacy.taught', {
    _: ['My mother. She fed half the lane and never once said so.', 'An old neighbor, when I was small. Always had a seat for you.'],
    cheerful: ['My granddad! He\'d give you his last apple and laugh about it.'],
    ornery: ['Nobody. I learned it the hard way. By being unkind first.'],
    shy: ['...A friend, long ago. She\'s gone over the hills.'],
    curious: ['I worked it out. Watching who folk went to, when things were bad.'],
    dreamy: ['The valley, I think. It\'s a kind place, when you let it be.'],
    witty: ['A goat, actually. Long story. Very wise goat.'],
    proud: ['My father. A good, plain, honest hobbit.'],
    gloomy: ['Someone I didn\'t thank enough.'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['{AgeMissed}. My {ageMissedRel}. Everything good I do, I learned from {ageMissed}.'] },
  ]);
  L('ages.legacy.already', {
    _: ['...Have you? What did they say?', 'Oh. Well. Oh.'],
    cheerful: ['Really? Oh, that\'s made my whole day!'],
    ornery: ['Hmph. Who? ...No, don\'t tell me. It\'s nice not knowing.'],
    shy: ['...Truly? Oh.'],
    curious: ['Have you? Who? When? I want details.'],
    dreamy: ['Then I can stop worrying about it. That\'s a gift.'],
    witty: ['Already? I\'m not even gone. How efficient.'],
    proud: ['I should hope so.'],
    gloomy: ['...Then maybe I did something right.'],
  });
  L('ages.legacy.recipe', {
    _: ['Never! The recipe goes to the grave. Well. Over the hills.', 'Ha! You\'ll get it when I\'m gone. In a sealed envelope.'],
    cheerful: ['Ha! I\'ll carve it myself! One letter a day!'],
    ornery: ['The recipe stays secret. Some things are sacred.'],
    shy: ['...I\'ll write it down for you. Just you.'],
    curious: ['Would you want the true one or the one I tell people?'],
    dreamy: ['A recipe on a stone. Folk would bake it every spring.'],
    witty: ['The recipe is: more butter. That\'s the whole secret.'],
    proud: ['A family secret. Not for stones.'],
    gloomy: ['Ha. Then at least it won\'t be lost.'],
  });

  // ==================================================================================
  // The one they miss: those gone over the hills
  // ==================================================================================
  addThread({
    id: 'ages.missing', label: (F) => (F.ageMissed ? `Remembering ${F.ageMissed}` : 'Those who went before'), weight: 1.1, cool: 4,
    when: (F) => !!F.ageMissed && F.stage !== 'child',
    rel: (F) => (F.ageMissedLately ? 2.2 : 1.2) * (F.ageMissedRel === 'friend' ? 0.8 : 1),
    open: { comfort: 'ages.missing.open' },
    beats: {
      start: { line: 'ages.missing.start', go: [
        { ap: 'ask', say: 'What were they like, when you were young?', to: 'young' },
        { ap: 'listen', say: '*You wait, and let them talk.*', label: 'Let them talk', to: 'stone' },
        { ap: 'jest', say: 'I heard {ageMissed} once out-ate a troll.', to: 'troll' },
      ] },
      young: { line: 'ages.missing.young', go: [
        { ap: 'ask', say: 'Tell me something funny about them.', to: 'funny' },
        { ap: 'warm', say: 'You carry a good deal of them, you know.', to: 'carry' },
      ] },
      stone: { line: 'ages.missing.stone', go: [
        { ap: 'advise', say: 'Go today. Take them the news of the {season}.', to: 'visit', need: { if: { ageMissedStone: true } } },
        { ap: 'ask', say: 'What do you tell them?', to: 'tell' },
        { ap: 'ask', say: 'Where do you think they are now?', to: 'where', need: { open: 1 }, soft: true },
      ] },
      troll: { line: 'ages.missing.troll', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'Tell me something they did that made you laugh.', to: 'funny' },
        { ap: 'warm', say: 'They sound like they were good company.', to: 'company' },
      ] },
      funny: { line: 'ages.missing.funny', fx: { drive: { lonely: -0.08 } }, go: [
        { ap: 'ask', say: 'Where do you think they are now?', to: 'where', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'I wish I\'d known them better.', to: 'wish' },
      ] },
      carry: { line: 'ages.missing.carry', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'Where do you think they are now?', to: 'where' },
        { ap: 'advise', say: 'Go and sit with their stone a while.', to: 'visit', need: { if: { ageMissedStone: true } } },
      ] },
      company: { line: 'ages.missing.company', go: [
        { ap: 'ask', say: 'Where do you think they are now?', to: 'where' },
        { ap: 'warm', say: 'Then I\'m glad you had them.', to: 'end' },
      ] },
      tell: { line: 'ages.missing.tell', fx: { trust: 0.03 }, go: [
        { ap: 'advise', say: 'Then go and tell them today\'s.', to: 'visit', need: { if: { ageMissedStone: true } } },
        { ap: 'warm', say: 'I\'m sure they\'re glad of it.', to: 'end' },
      ] },
      where: { line: 'ages.missing.where', go: [
        { ap: 'tale', say: 'I passed a hobbit on the West Road once, singing. I like to think...', to: 'road' },
        { ap: 'comfort', say: 'Somewhere with a kettle on, I\'d wager.', to: 'kettle' },
      ] },
      visit: { line: 'ages.missing.visit', fx: { queue: 'visit_stone', respect: 0.02 }, end: true },
      wish: { line: 'ages.missing.wish', fx: { fond: 0.02 }, end: true },
      road: { line: 'ages.missing.road', fx: { trust: 0.04, fond: 0.03, remember: 'The wizard thinks they saw someone like {ageMissed} on the West Road, singing.', rv: 1 }, end: true },
      kettle: { line: 'ages.missing.kettle', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.02, trust: 0.02, drive: { lonely: -0.05 } },
  });
  lines('ages.missing.open', [
    { text: ['You still think of {ageMissed}, don\'t you, {name}?', 'Tell me about {ageMissed}, {name}.'] },
    { if: { ageMissedLately: true }, text: ['I heard {ageMissed} set off, {name}. How are you bearing up?'] },
  ]);
  L('ages.missing.start', {
    _: ['Every day. Something happens and I turn to tell {ageMissed}, and there\'s nobody.', '{AgeMissed}. Yes. The house is quieter. Too quiet.'],
    cheerful: ['Oh, all the time! Happy things, mostly. {AgeMissed} would\'ve loved today.', 'I talk to {ageMissed} still. Out loud. Folk think I\'m daft. I don\'t mind.'],
    ornery: ['Of course I do. What sort of question is that.', 'Somebody has to remember {ageMissed} properly. Not all this soft talk.'],
    shy: ['...Yes. I don\'t say. But yes.', 'All the time. I keep {ageMissed}\'s cup on the shelf.'],
    curious: ['I keep finding things {ageMissed} would have had an opinion on. I collect them.', 'I wonder what {ageMissed} would make of the rift-folk. I really wonder.'],
    dreamy: ['{AgeMissed} is in the wind on the hill, I think. When it\'s from the west.', 'I dream of {ageMissed} sometimes. Always laughing. Always walking away, waving.'],
    witty: ['I miss {ageMissed}\'s cheek. Nobody insults me properly now.', 'Every time someone tells a bad joke I think, {ageMissed} would\'ve told it worse.'],
    proud: ['{AgeMissed} was the finest hobbit I knew. I make sure folk remember.', 'I keep {ageMissed}\'s things just so. As {ageMissed} liked.'],
    gloomy: ['Every hour. It doesn\'t get easier. Folk say it does. It doesn\'t.', 'There\'s a hole where {ageMissed} was. I walk round it all day.'],
  }, [
    { if: { ageMissedLately: true }, pri: 1, text: ['{AgeMissed} only went the other day. I keep setting two cups.', 'I waved till I couldn\'t see {ageMissed} any more. Then I waved a bit longer.'] },
    { if: { ageMissedRel: ['wife', 'husband'] }, pri: 1, text: ['My {ageMissedRel}. Forty years we shared a pillow. Now I sleep on the wrong side, to leave room.'] },
    { if: { ageMissedRel: ['mother', 'father'] }, pri: 1, text: ['My {ageMissedRel}. You never stop being someone\'s child. Even when they\'ve gone.'] },
  ]);
  L('ages.missing.young', {
    _: ['Quick. Always first to the top of the knoll. Always waiting for me to catch up.', 'Loud and kind. You heard {ageMissed} before you saw them.'],
    cheerful: ['Oh, a terror! In the best way! We stole apples from every orchard in the valley!'],
    ornery: ['Bossy. Told me what to do every day of my life. I\'d give anything to be bossed now.'],
    shy: ['...{AgeMissed} talked to me when nobody else did. That\'s how it started.'],
    curious: ['{AgeMissed} knew where every path went. Every one. I still find paths I never got to ask about.'],
    dreamy: ['Golden. Everything about {ageMissed} was golden, back then. Hair, laugh, all of it.'],
    witty: ['Dreadful. Absolutely dreadful. The best friend I ever had.'],
    proud: ['Strong, clever, honest. The pick of the village.'],
    gloomy: ['Bright. Brighter than me. It should have been me that went first.'],
  }, [
    { if: { ageMissedRel: 'mother' }, pri: 1, text: ['When I was small {ageMissed} carried me on her shoulders to see the fireworks. I can still feel it.'] },
    { if: { ageMissedRel: 'father' }, pri: 1, text: ['When I was small {ageMissed} carried me on his shoulders to see the fireworks. I can still feel it.'] },
  ]);
  L('ages.missing.stone', {
    _: ['I go to the Green, most days. Tell {ageMissed} the news. The stone\'s a good listener.', 'There\'s a stone for {ageMissed} on the Green. I put flowers. {AgeMissed} hated flowers. I put them anyway.'],
    cheerful: ['I go and sit by the stone and tell {ageMissed} all the gossip! The stone doesn\'t mind.'],
    ornery: ['I go. I tidy the moss off. Nobody else does it right.'],
    shy: ['...I sit on the bench by the yew. Nobody bothers you there.'],
    curious: ['The stones face west. Did you know? I asked who decided that. Nobody knows.'],
    dreamy: ['The light on the Green in the evening is soft. I think {ageMissed} would like it.'],
    witty: ['I go and tell {ageMissed}\'s stone my jokes. Best audience I\'ve ever had.'],
    proud: ['I keep the stone clean. It\'s the best kept on the Green.'],
    gloomy: ['I go. I sit. I come home. That\'s all.'],
  }, [
    { if: { ageMissedStone: false }, pri: 1, text: ['There\'s no stone. I keep {ageMissed}\'s pipe on the mantel instead. That\'s my stone.'] },
  ]);
  L('ages.missing.troll', {
    _: ['Ha! A troll! {AgeMissed} would\'ve tried. {AgeMissed} could eat for the Shire.', 'Ha! Who told you that? It was a dwarf. And it was a draw.'],
    cheerful: ['Ha! A troll! Oh, {ageMissed} would have loved that story! I\'m telling everyone!'],
    ornery: ['Ha. Hmph. It was two trolls, and they were small.'],
    shy: ['...Ha. {AgeMissed} did eat a lot.'],
    curious: ['Did you really hear that? Where? Who said it?'],
    dreamy: ['{AgeMissed} and a troll at one table. I can just see it.'],
    witty: ['Out-ate a troll? {AgeMissed} out-ate the whole Badger at Yule.'],
    proud: ['{AgeMissed} could out-eat anyone. Family talent.'],
    gloomy: ['Ha. ...Ha. That\'s the first time I\'ve laughed about {ageMissed}. Thank you.'],
  });
  L('ages.missing.funny', {
    _: ['{AgeMissed} once got a goat into the Moot. Nobody ever found out how. I know how.', '{AgeMissed} fell asleep at our own wedding party. Snored through the speeches.'],
    cheerful: ['Oh, the time {ageMissed} tried to row across the pond in a washtub! Sank in a foot of water!'],
    ornery: ['{AgeMissed} painted my door green while I was out. I painted it back. This went on a year.'],
    shy: ['...{AgeMissed} used to pull silly faces behind the storyteller\'s back. I had to leave once.'],
    curious: ['{AgeMissed} tried to teach a hen to count. Got it up to three. I\'m not sure it wasn\'t luck.'],
    dreamy: ['{AgeMissed} would sing to the moon. Badly. Every full moon, from the step.'],
    witty: ['{AgeMissed} told the Moot the river was moving. Got them to hold a vote on it.'],
    proud: ['{AgeMissed} once beat the champion of Bywater at pie-eating. In front of everyone.'],
    gloomy: ['...{AgeMissed} used to make me laugh when I didn\'t want to. Every time.'],
  });
  L('ages.missing.carry', {
    _: ['...Do I? I hope so. I\'ve got {ageMissed}\'s laugh, folk say.', 'I suppose I do. I catch myself saying {ageMissed}\'s sayings.'],
    cheerful: ['Oh, I hope so! I hope it\'s the good bits! Mostly the laugh!'],
    ornery: ['I\'ve {ageMissed}\'s stubbornness. That much is certain.'],
    shy: ['...That\'s a kind thing to say.'],
    curious: ['Which bits, do you think? I\'d like to know which bits.'],
    dreamy: ['Like a lantern carried in a pocket. Yes.'],
    witty: ['I carry {ageMissed}\'s debts, too. Mostly to the Badger.'],
    proud: ['I do. And I carry it well.'],
    gloomy: ['...That\'s something. I\'ll try to believe it.'],
  });
  L('ages.missing.company', {
    _: ['The best. Easy to be with. That\'s rarer than you\'d think.', 'They were. A whole evening would go by like a minute.'],
    cheerful: ['The very best! Every evening a party, even with just the two of us!'],
    ornery: ['Good company. Hard to argue with. I tried.'],
    shy: ['...They were. They made me easy.'],
    curious: ['Always had a question. Always. Even about things that didn\'t need questions.'],
    dreamy: ['Like sitting by a warm fire. You don\'t notice till it goes out.'],
    witty: ['Good company? The best audience I ever had.'],
    proud: ['The best company in the valley.'],
    gloomy: ['They were. That\'s what makes it hard.'],
  });
  L('ages.missing.tell', {
    _: ['The news. Who\'s wed, who\'s born, what the weather\'s doing. The things {ageMissed} would ask.', 'Everything. What\'s for supper. What I\'ve been worrying about.'],
    cheerful: ['Everything! Who\'s courting! Who fell in the pond! It takes an hour!'],
    ornery: ['What the young ones are getting wrong. {AgeMissed} would want to know.'],
    shy: ['...Things I don\'t tell anyone else.'],
    curious: ['What\'s changed. I describe the rift-folk in detail. It\'s quite a lot.'],
    dreamy: ['The color of the sky. Whether the swallows have come.'],
    witty: ['The gossip. All of it. The stone is very discreet.'],
    proud: ['How well the family\'s doing. {AgeMissed} would want to know.'],
    gloomy: ['That I miss them. Mostly that.'],
  });
  L('ages.missing.where', {
    _: ['Somewhere good. With a garden. {AgeMissed} always wanted a bigger garden.', 'Over the hills. Further. I think they\'re fine. I think they\'re happy.'],
    cheerful: ['At a party! The biggest party there is! Saving me a seat!'],
    ornery: ['Arguing with someone, wherever it is. And winning.'],
    shy: ['...Somewhere quiet. With a view. I hope.'],
    curious: ['I\'ve wondered and wondered. Nobody comes back to say. Don\'t you know?'],
    dreamy: ['Walking in a country of evening light. I see it, sometimes, when I close my eyes.'],
    witty: ['Somewhere with a better inn than the Badger. Don\'t tell the Badger.'],
    proud: ['Somewhere fine. Where the best folk go.'],
    gloomy: ['I don\'t know. That\'s the worst of it. Not knowing.'],
  });
  L('ages.missing.visit', {
    _: ['Today. Yes. I\'ll tell {ageMissed} about the wizard. That\'ll make {ageMissed} laugh.', 'I will. I\'ll pick some flowers on the way.'],
    cheerful: ['Yes! I\'ve so much to tell! I\'ll go right now!'],
    ornery: ['I was going anyway. But yes.'],
    shy: ['...All right. I\'ll go.'],
    curious: ['I will. I\'ll tell {ageMissed} what you said.'],
    dreamy: ['The {season} news. Yes. I\'ll go while the light\'s good.'],
    witty: ['I\'ll go. I\'ll tell {ageMissed} a wizard sent me. That\'ll impress.'],
    proud: ['I\'ll go. And tidy the moss.'],
    gloomy: ['...Yes. That might help.'],
  });
  L('ages.missing.wish', {
    _: ['You\'d have liked each other. {AgeMissed} liked anyone with a hat.', 'I wish you had too. I\'ll tell you more. Another day.'],
    cheerful: ['Oh, you\'d have got on like a house on fire! Literally, knowing you two!'],
    ornery: ['{AgeMissed} would have told you off. Lovingly.'],
    shy: ['...I\'ll tell you more. Some time.'],
    curious: ['I\'ll tell you everything. It\'ll take weeks.'],
    dreamy: ['Then I\'ll keep telling you about {ageMissed}. That\'s a sort of knowing.'],
    witty: ['{AgeMissed} would have asked you for a firework. Then set it off indoors.'],
    proud: ['You\'d have been the better for it.'],
    gloomy: ['...So do I.'],
  });
  L('ages.missing.road', {
    _: ['...You did? Singing? Oh. Oh, I\'ll keep that.', 'You like to think. ...So will I, then. So will I.'],
    cheerful: ['Singing! That\'s {ageMissed}! That has to be {ageMissed}!'],
    ornery: ['Hmph. Probably was. {AgeMissed} never could keep quiet.'],
    shy: ['...Thank you. I\'ll think of that tonight.'],
    curious: ['What were they singing? Do you remember? Was it the harvest one?'],
    dreamy: ['On the West Road, singing. Yes. That\'s exactly where I\'d want them.'],
    witty: ['Singing badly, I hope. That would settle it.'],
    proud: ['Walking proud, I\'m sure.'],
    gloomy: ['...That\'s the kindest thing anyone\'s said to me since {ageMissed} went.'],
  });
  L('ages.missing.kettle', {
    _: ['Ha. Yes. And complaining it\'s not strong enough.', 'A kettle on. Yes. I\'ll think of that.'],
    cheerful: ['Ha! And a seed-cake! And the good cups!'],
    ornery: ['A kettle. And the tea\'s stewed. {AgeMissed} always stewed it.'],
    shy: ['...I like that.'],
    curious: ['What kind of tea, I wonder.'],
    dreamy: ['A kettle on, and a chair kept warm.'],
    witty: ['A kettle on, and a hand of cards waiting. {AgeMissed} cheated.'],
    proud: ['The best china, I should think.'],
    gloomy: ['...That helps. Somehow that helps.'],
  });

  // ==================================================================================
  // An old friend: the elder remembers the wizard from long ago (they raise it)
  // ==================================================================================
  addThread({
    id: 'ages.oldfriend', theirs: true, label: 'They remember you from long ago', cool: 12, ask: '{Name} looks at you a long moment, and smiles.',
    when: (F) => F.stage === 'elder' && F.met,
    beats: {
      start: { line: 'ages.oldfriend.start', go: [
        { ap: 'jest', say: 'I remember a hat that caught fire. Was that yours?', to: 'hat' },
        { ap: 'ask', say: 'Remind me. My memory\'s older than your hill.', to: 'remind' },
        { ap: 'share', say: 'I remember everyone I ever lit a rocket for.', to: 'everyone', need: { open: 1 }, soft: true },
      ] },
      hat: { line: 'ages.oldfriend.hat', fx: { joke: { k: 'ages.hat', t: 'The hat that caught fire, long ago.' } }, go: [
        { ap: 'ask', say: 'And what else do you remember?', to: 'remind' },
        { ap: 'jest', say: 'I\'ve been more careful since. Slightly.', to: 'then' },
      ] },
      remind: { line: 'ages.oldfriend.remind', go: [
        { ap: 'warm', say: 'Of course. You were the one who wouldn\'t go to bed.', to: 'then' },
        { ap: 'ask', say: 'And did it go the way you hoped? After?', to: 'after' },
      ] },
      everyone: { line: 'ages.oldfriend.everyone', fx: { trust: 0.04 }, go: [
        { ap: 'warm', say: 'You were small and fierce and very loud.', to: 'then' },
        { ap: 'ask', say: 'And did your life go the way you hoped?', to: 'after' },
      ] },
      then: { line: 'ages.oldfriend.then', go: [
        { ap: 'warm', say: 'You\'ve the same laugh. That doesn\'t change.', to: 'laugh' },
        { ap: 'jest', say: 'I\'ve changed. I\'ve a new hat.', to: 'newhat' },
        { ap: 'comfort', say: 'You haven\'t changed where it counts.', to: 'counts' },
      ] },
      after: { line: 'ages.oldfriend.after', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'Then it went well. That\'s the best anyone gets.', to: 'counts' },
        { ap: 'jest', say: 'And you never did learn to hold a sparkler.', to: 'newhat' },
      ] },
      laugh: { line: 'ages.oldfriend.laugh', fx: { fond: 0.03 }, end: true },
      newhat: { line: 'ages.oldfriend.newhat', fx: { fond: 0.02 }, end: true },
      counts: { line: 'ages.oldfriend.counts', fx: { fond: 0.03, trust: 0.03 }, end: true },
    },
    end: { remember: 'The wizard and I talked about the old days, when I was young and he was the same.', rv: 2 },
  });
  L('ages.oldfriend.start', {
    _: ['You won\'t remember. But I was at the front, the night of the dragon rocket. I was so small.', 'Do you know, you haven\'t changed one bit since I was young. Not one bit.'],
    cheerful: ['I was the one shrieking loudest! At your fireworks! Sixty years ago, near enough!', 'Do you remember me? I chased your cart all the way to the bridge. You threw me a squib!'],
    ornery: ['You set fire to our hay-rick, you know. When I was a youngster. I\'ve been meaning to mention it.', 'You came once when I was small and promised to come back next summer. You were twenty years late.'],
    shy: ['...You won\'t remember. You gave me a sparkler and I cried. You held it for me.', 'I was the one hiding under the trestle. At the party. You winked at me.'],
    curious: ['I asked you a question once, when I was six. How do the colors get in the rockets. You said "patience". I\'ve wondered ever since.', 'I\'ve been trying to work out how many times you\'ve come to the valley. I make it nine.'],
    dreamy: ['You made a butterfly out of light when I was small. I\'ve looked for one like it all my life.', 'I remember your wagon coming over the hill the first time. The bells. I thought you were a story.'],
    witty: ['You told my granddad a wizard is never late. My granddad said "then where\'ve you been since Lithe".', 'You owe me a sweet. From about seventy years ago. I\'ve been keeping count.'],
    proud: ['You came to my coming of age. Gave me a rocket of my own. I\'ve still got the stick.', 'You shook my hand at my father\'s party. I didn\'t wash it for a week.'],
    gloomy: ['You came when I was young. Everybody was here then. Now look.', 'You always come back. Not everyone does.'],
  });
  L('ages.oldfriend.hat', {
    _: ['Ha! My uncle\'s! He blamed you for the rest of his life. He loved telling it.', 'It was mine! A paper crown! It went up like a hayrick!'],
    cheerful: ['Ha! It was my mom\'s best bonnet! She laughed till she cried!'],
    ornery: ['It was my father\'s. And it wasn\'t funny. ...It was a bit funny.'],
    shy: ['...It was mine. I was so proud of it. Then so proud you\'d set it alight.'],
    curious: ['You do remember! I\'ve wondered for years if you would!'],
    dreamy: ['A burning hat against the stars. I\'ve never forgotten.'],
    witty: ['It was the Moot chairman\'s. Best night the Moot ever had.'],
    proud: ['My grandfather\'s. A very good hat. He was very gracious about it.'],
    gloomy: ['Ha. Yes. Those were the days. Even the burning hats.'],
  });
  L('ages.oldfriend.remind', {
    _: ['A summer party. Lanterns. You did a ship of smoke that sailed across the moon. I was eight.', 'My father\'s birthday. You came over the hill at sunset, and every child in the valley ran.'],
    cheerful: ['A midsummer feast! And you made the rockets spell out "SECOND BREAKFAST"! We screamed!'],
    ornery: ['You came, you made a racket, you ate all the cake and went. My mother was furious. Then delighted.'],
    shy: ['...I sat at the back. You let off a little green star just for the back row. I thought it was for me.'],
    curious: ['You told us about the Mountain. I asked a hundred questions. You answered ninety.'],
    dreamy: ['A night like velvet. Golden rain coming down over the river. I can still smell the smoke.'],
    witty: ['You told a tale about trolls that frightened half the village and bored the other half. I loved it.'],
    proud: ['My coming of age. You stood right there by the oak. You said I\'d do well. I have.'],
    gloomy: ['My mother was there. My father. Everyone. You made the sky full of flowers.'],
  });
  L('ages.oldfriend.everyone', {
    _: ['...Do you? Truly? Then you remember me.', 'Everyone? ...That\'s a lot of rockets. And a lot of us.'],
    cheerful: ['Oh! Then you remember me! I knew it!'],
    ornery: ['Hmph. That\'s a lot of hobbits. ...But it\'s nice to hear.'],
    shy: ['...Then I\'m in there somewhere. That\'s nice.'],
    curious: ['How do you keep them all? Is it a wizard thing? A list?'],
    dreamy: ['A sky full of all the faces you\'ve lit up. That\'s lovely.'],
    witty: ['Everyone? Even the one who threw up after the cake? That was me.'],
    proud: ['I should hope so. I was memorable.'],
    gloomy: ['...Then you\'ll remember me, after. That\'s something.'],
  });
  L('ages.oldfriend.then', {
    _: ['You haven\'t changed. I have. Look at me. All creaks and grandchildren.', 'Funny. I got old and you just got... more you.'],
    cheerful: ['And here we both are! You\'re the same and I\'m a hundred! Isn\'t it wonderful!'],
    ornery: ['You haven\'t changed a bit. It\'s very annoying.'],
    shy: ['...You look just the same. I don\'t.'],
    curious: ['You don\'t age the way we do. Do you age at all? Slowly? Inside?'],
    dreamy: ['You\'re like the hills. Always there when I look up.'],
    witty: ['You\'ve the same beard. Surely it\'s not the same beard.'],
    proud: ['We\'ve both worn well, I\'d say.'],
    gloomy: ['You\'ll be the same when I\'m gone. That\'s strange to think.'],
  });
  L('ages.oldfriend.after', {
    _: ['Mostly. Better than I hoped, in places. Worse in others. That\'s a life, isn\'t it.', 'It went the way it went. I wouldn\'t swap it.'],
    cheerful: ['Better! So much better! I had no idea how good it would be!'],
    ornery: ['It went. I made sure it went right. Mostly.'],
    shy: ['...Quietly. It went quietly. I liked it that way.'],
    curious: ['Differently. I never expected half of it. That\'s the best bit.'],
    dreamy: ['Like a long summer evening. Slow, and golden, and over too soon.'],
    witty: ['Not to plan. I didn\'t have a plan. So, to plan.'],
    proud: ['Very well indeed. I did what I set out to do.'],
    gloomy: ['Some of it. Not all. Not everyone stayed.'],
  });
  L('ages.oldfriend.laugh', {
    _: ['Ha! Do I? ...I do, don\'t I. My mother\'s.', 'Same laugh. Ha. Yes. That\'s still mine.'],
    cheerful: ['Ha! I\'ll laugh for you right now!'],
    ornery: ['Hmph. I don\'t laugh much. ...Ha. Well. I did then.'],
    shy: ['...Thank you. That\'s nice.'],
    curious: ['Do I? I\'ve never heard my laugh from outside.'],
    dreamy: ['The laugh outlasts everything. I like that.'],
    witty: ['The laugh\'s the only bit with original parts.'],
    proud: ['A good laugh is a family treasure.'],
    gloomy: ['...I don\'t laugh as much. Maybe I should.'],
  });
  L('ages.oldfriend.newhat', {
    _: ['Ha! It\'s exactly the same hat! I\'d know it anywhere!', 'A new hat! That\'s the same hat! Same dent and all!'],
    cheerful: ['Ha! The same hat! You fibber!'],
    ornery: ['That\'s the same hat. I can see the scorch mark.'],
    shy: ['...Ha. It looks the same to me.'],
    curious: ['Is it? How many hats have you had? Do they wear out?'],
    dreamy: ['The hat\'s part of the story now. It can\'t change.'],
    witty: ['A new hat. And I\'ve a new knee. We\'re both lying.'],
    proud: ['It\'s a very distinguished hat.'],
    gloomy: ['Ha. At least something\'s the same.'],
  });
  L('ages.oldfriend.counts', {
    _: ['...Thank you. That\'s what I hoped you\'d say.', 'Where it counts. Yes. I like that.'],
    cheerful: ['Oh, you\'ve made me feel eight again!'],
    ornery: ['Hmph. ...Thank you.'],
    shy: ['...Thank you. Truly.'],
    curious: ['Where does it count, do you think? I\'d like to know.'],
    dreamy: ['Then the small one\'s still in here. I thought so.'],
    witty: ['Where it counts. You mean my appetite.'],
    proud: ['I\'ve always been myself. I\'m glad it shows.'],
    gloomy: ['...That\'s kind. Thank you, old friend.'],
  });

  // ==================================================================================
  // The eldest in Thistledown
  // ==================================================================================
  addThread({
    id: 'ages.eldest', label: 'The eldest in Thistledown', weight: 1.0, cool: 6,
    when: (F) => F.ageIsEldest && F.stage !== 'child' && F.ageYears >= 60,
    open: { ask: 'ages.eldest.open' },
    beats: {
      start: { line: 'ages.eldest.start', go: [
        { ap: 'jest', say: 'Do they ask you when the world began?', to: 'began' },
        { ap: 'ask', say: 'Does it weigh on you, being the eldest?', to: 'weigh' },
        { ap: 'warm', say: 'It\'s an honor, and you wear it well.', to: 'honour' },
      ] },
      began: { line: 'ages.eldest.began', go: [
        { ap: 'ask', say: 'What do they ask you, really?', to: 'ask' },
        { ap: 'jest', say: 'Tell them it began on a Trewsday. Market day.', to: 'trewsday' },
      ] },
      weigh: { line: 'ages.eldest.weigh', fx: { trust: 0.02 }, go: [
        { ap: 'comfort', say: 'You don\'t have to carry it all. They\'ll help.', to: 'help' },
        { ap: 'ask', say: 'Who was the eldest, when you were young?', to: 'before' },
      ] },
      honour: { line: 'ages.eldest.honour', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'Who was the eldest, when you were young?', to: 'before' },
        { ap: 'ask', say: 'What do folk come to you for?', to: 'ask' },
      ] },
      ask: { line: 'ages.eldest.ask', go: [
        { ap: 'warm', say: 'Then you\'re the village\'s memory. That matters.', to: 'memory' },
        { ap: 'jest', say: 'And do you ever make things up?', to: 'makeup' },
      ] },
      trewsday: { line: 'ages.eldest.trewsday', fx: { joke: { k: 'ages.trewsday', t: 'The world began on a Trewsday. Market day.' } }, end: true },
      before: { line: 'ages.eldest.before', fx: { trust: 0.02 }, end: true },
      help: { line: 'ages.eldest.help', fx: { trust: 0.02 }, end: true },
      memory: { line: 'ages.eldest.memory', fx: { respect: 0.02 }, end: true },
      makeup: { line: 'ages.eldest.makeup', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.eldest.open', [{ text: ['You\'re the eldest in Thistledown now, {name}. How does that sit?', 'They tell me nobody in the valley has more years than you, {name}.'] }]);
  L('ages.eldest.start', {
    _: ['The eldest. Yes. I don\'t know how it happened. I just kept on.', 'Everyone looks at me at the Moot now. As if I\'d know.'],
    cheerful: ['Ha! The eldest! I get the best chair at every party! It\'s marvelous!'],
    ornery: ['The eldest. Which means everyone shouts at me as if I\'m deaf. I\'m not deaf.'],
    shy: ['...I don\'t like it much. Folk look at me.'],
    curious: ['Strange, isn\'t it? I remember when I was the youngest. Same village. Different everything.'],
    dreamy: ['The last leaf on the old tree. That\'s how it feels, some mornings.'],
    witty: ['The eldest. I\'ve outlasted everyone who could contradict me. Very handy.'],
    proud: ['It\'s a responsibility. I take it seriously.'],
    gloomy: ['It means everyone I grew up with has gone. That\'s what it means.'],
  });
  L('ages.eldest.began', {
    _: ['Ha! Nearly. They ask if I remember the river being dug.', 'They ask me what the weather was like "in my day". It was weather.'],
    cheerful: ['Ha! A little one asked if I knew the first hobbit! I said we were very close!'],
    ornery: ['They ask me if I remember dragons. I do not remember dragons.'],
    shy: ['...A child asked if I was older than the hills. I didn\'t know what to say.'],
    curious: ['They do ask. And I don\'t know! I\'d like to know myself!'],
    dreamy: ['Sometimes I feel I do remember it. The first morning.'],
    witty: ['I tell them it began on my eleventh birthday. Nobody can disprove it.'],
    proud: ['They ask me many things. I answer what I can.'],
    gloomy: ['They ask when it\'ll end, more like. Looking at me.'],
  });
  L('ages.eldest.weigh', {
    _: ['A bit. Every name I remember is a name nobody else will.', 'It does, some days. I\'m the last who saw some things.'],
    cheerful: ['Not much! It\'s mostly an excuse to be given things!'],
    ornery: ['No. It\'s everyone else who\'s too young.'],
    shy: ['...Yes. I\'m not good at being looked to.'],
    curious: ['It makes me want to write it all down before I forget.'],
    dreamy: ['It\'s like holding a lantern for folk I can\'t see any more.'],
    witty: ['Only on my knees. The rest of me\'s fine.'],
    proud: ['It\'s heavy, yes. Someone has to carry it.'],
    gloomy: ['Yes. It does. Every day.'],
  });
  L('ages.eldest.honour', {
    _: ['Do I? Thank you. I wear it like an old coat. Comfortable, but I notice it.', 'I try to. Mostly I just try to stay upright.'],
    cheerful: ['Thank you! I polish it every morning!'],
    ornery: ['Hmph. It\'s not an honor, it\'s an accident of arithmetic.'],
    shy: ['...Thank you.'],
    curious: ['What does it mean to wear it well, I wonder?'],
    dreamy: ['An honor. Yes. Like being given the last of the sun.'],
    witty: ['I wear it well because I\'ve had it on so long.'],
    proud: ['Thank you. I do my best.'],
    gloomy: ['...Do I? Thank you.'],
  });
  L('ages.eldest.ask', {
    _: ['Whose field is whose. Where the old well was. Whether it\'ll be a hard winter.', 'Names, mostly. "Who was the one who...?" I usually know.'],
    cheerful: ['Recipes! Everyone wants grandmother\'s recipes, and I\'m the only one who had them!'],
    ornery: ['Where the boundaries are. They argue, then they come to me. I\'m always right.'],
    shy: ['...Little things. Old songs. I sing them quietly.'],
    curious: ['Everything! And I don\'t always know, so then I go and find out.'],
    dreamy: ['Stories. The old stories. I tell them slowly.'],
    witty: ['Whether I\'m feeling all right. Every five minutes.'],
    proud: ['Advice. Judgment. Who\'s in the right. That sort of thing.'],
    gloomy: ['How I\'m keeping. As if they\'re counting.'],
  });
  L('ages.eldest.trewsday', {
    _: ['Ha! A Trewsday! I\'m telling the little ones that tomorrow.', 'Market day! Of course it did. Somebody had to sell the first turnip.'],
    cheerful: ['Ha! Oh, that\'s perfect! Market day!'],
    ornery: ['A Trewsday. Typical. All that noise.'],
    shy: ['...Ha. I\'ll say that.'],
    curious: ['Market day. Do you know, that makes a strange sort of sense.'],
    dreamy: ['The world began on market day. With a bell and a basket.'],
    witty: ['A Trewsday. And it\'s been Trewsday-ish ever since.'],
    proud: ['A good day for it.'],
    gloomy: ['Ha. And it\'ll end on a Highday, I suppose.'],
  });
  L('ages.eldest.before', {
    _: ['Old Mother Burrows. Hundred and twelve. She smoked a pipe as long as your arm.', 'A grand old fellow who\'d been to Bree twice. We thought he was a hero.'],
    cheerful: ['Great-gran Tansy! She danced at a hundred and four! I mean to beat it!'],
    ornery: ['A cantankerous old hobbit who told everyone off. I swore I\'d never be like that.'],
    shy: ['...An old lady who let me sit with her. She hardly spoke. I thought she knew everything.'],
    curious: ['Old Bilbo Something. Knew every tale. I followed him about asking why.'],
    dreamy: ['An old woman who sang to her bees. I thought she was a witch. A good one.'],
    witty: ['A very old hobbit who claimed to be a hundred and fifty. He was ninety. Nobody checked.'],
    proud: ['My own great-grandfather. A fine man.'],
    gloomy: ['Someone who seemed so old. And now I\'m older.'],
  });
  L('ages.eldest.help', {
    _: ['...They do. I forget, sometimes, that they do.', 'Maybe. I\'ll let them, a bit more.'],
    cheerful: ['They do! They bring me soup! Too much soup!'],
    ornery: ['They can help when they learn to do it properly.'],
    shy: ['...I\'m not good at letting them. I\'ll try.'],
    curious: ['That\'s true. Perhaps the job is teaching them to carry it.'],
    dreamy: ['Then we\'ll carry the lantern together. That\'s nicer.'],
    witty: ['Help? Most of them can\'t carry a tune.'],
    proud: ['I\'ll let them. Some of it.'],
    gloomy: ['...Thank you. I needed to hear that.'],
  });
  L('ages.eldest.memory', {
    _: ['The village\'s memory. Yes. I suppose I am. I\'d better keep it tidy.', 'Then I should start writing it down.'],
    cheerful: ['Ooh, I like that! I\'m the village\'s memory! I\'ll get a hat!'],
    ornery: ['Somebody has to be. The rest of them can\'t remember last week.'],
    shy: ['...I hadn\'t thought of it like that.'],
    curious: ['And when I go? Someone should learn it. I\'ll find a curious one.'],
    dreamy: ['A memory with legs. Slow legs.'],
    witty: ['A memory with a terrible sense of direction.'],
    proud: ['It does matter. I\'m glad someone sees that.'],
    gloomy: ['And when I go, it goes too. Unless someone listens.'],
  });
  L('ages.eldest.makeup', {
    _: ['Ha! Only the dull bits. Nobody wants the dull bits.', 'Make things up? I improve them.'],
    cheerful: ['Ha! All the time! The old days are much more fun the way I tell them!'],
    ornery: ['Never. Well. The odd number.'],
    shy: ['...Only a little. When I forget.'],
    curious: ['Sometimes I wonder if I remember it or just remember telling it.'],
    dreamy: ['Memory\'s a kind of making up. The kindest kind.'],
    witty: ['Only when the truth is boring. Which is most of the time.'],
    proud: ['Certainly not. ...Rarely.'],
    gloomy: ['Ha. Who\'d know? Who\'s left to check?'],
  });
});
