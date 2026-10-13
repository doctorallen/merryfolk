'use strict';
// ---------------------------------------------------------------------------
// The weather and the turning year, as folk talk of it to the wizard: today's
// sky, what each season asks of them and gives them, the season's trial
// (flood, drought, blight or frost), the season on its last day, and their
// own turn to ask him what tomorrow will bring. This pack also works out the
// facts the other seasons packs use: the next festival and the last, today's
// occasion, birthdays, the wizard's fireworks, the larder and the moon.
// ---------------------------------------------------------------------------

talkPack('seasons', () => {
  // --- Facts of the year ------------------------------------------------------------
  const FEST_NAME = { mayday: 'Mayday', midsummer: 'Midsummer', harvest: 'the Harvest Feast', yule: 'Yule', founding: 'Founders\' Day', lantern: 'Lantern Night' };
  const occName = (k) => {
    if (FEST_NAME[k]) return FEST_NAME[k];
    if (k === 'holiday') return (Game.holiday && Game.holiday.name) || 'the holiday';
    if (k === 'birthday') return 'the birthday party';
    if (k === 'wizard') return 'your party';
    const kind = typeof partyKind === 'function' ? partyKind(k) : null;
    return kind ? kind.label.replace(/^(The|A|An) /, (m) => m.toLowerCase()) : null;
  };
  const occOn = (d) => (typeof occasionOn === 'function' && d >= 1 ? occasionOn(d) : null);
  const HAZ_WORD = { flood: 'flood', drought: 'dry spell', blight: 'blight', frost: 'hard frost' };
  const MOONS = ['new', 'waxing', 'waxing', 'full', 'full', 'waning', 'waning', 'new'];
  addFacts((v, F) => {
    const day = Game.day, w = Game.weather || 'clear';
    F.sky = w; F.storm = w === 'storm';
    const dl = (typeof DAYLIGHT !== 'undefined' && DAYLIGHT[World.season]) || [6, 20];
    F.dark = Game.hour < dl[0] || Game.hour >= dl[1] + 0.5;
    F.moon = MOONS[day % 8];
    const z = Game.hazard || null;
    F.hazard = z ? z.k : null; F.hazardOn = !!(z && z.state === 'on'); F.hazardSoon = !!(z && z.state === 'warned');
    F.hazardWord = z ? HAZ_WORD[z.k] || z.k : null;
    F.seasonDay = dayOfSeason(day); F.seasonEnds = F.seasonDay === SEASON_DAYS;
    F.seasonNext = SEASON_KEYS[(seasonIdx(day) + 1) % 4]; F.seasonLast = SEASON_KEYS[(seasonIdx(day) + 3) % 4];
    F.favSeason = SEASON_KEYS[Math.floor(hash2(v.id, 41) * 4)];
    F.year = yearOf(day); F.firstYear = F.year === 1;
    const p = Game.party || {};
    const occ = p.on ? p.reason : p.planned;
    F.occasion = occ || null; F.occasionWord = occ ? occName(occ) : null;
    F.festToday = occ && FEST_NAME[occ] ? occ : null; F.festTodayWord = F.festToday ? FEST_NAME[F.festToday] : null;
    let nf = null, nd = null;
    for (let d = day + 1; d <= day + YEAR_DAYS; d++) { const k = occOn(d); if (k) { nf = k; nd = d - day; break; } }
    F.nextFest = nf; F.nextFestWord = nf ? FEST_NAME[nf] || occName(nf) : null; F.nextFestIn = nd; F.festTomorrow = nd === 1;
    let lf = null;
    for (let d = day - 1; d >= day - 3; d--) { const k = occOn(d); if (k) { lf = k; break; } }
    F.lastFest = lf; F.lastFestWord = lf ? FEST_NAME[lf] || occName(lf) : null;
    F.holidayName = (typeof holidayToday === 'function' && holidayToday() && Game.holiday.name) || null;
    // birthdays
    const bIn = v.stage === 'baby' ? null : (bdayOf(v) - dayOfYear(day) + YEAR_DAYS) % YEAR_DAYS;
    F.bdayToday = birthdayToday(v); F.bdayIn = bIn; F.bdaySoon = bIn != null && bIn >= 1 && bIn <= 2; F.bdayWhen = bdayWords(v);
    const other = Game.villagers.find((o) => o !== v && !o.leaving && birthdayToday(o));
    F.bdayFolk = other ? other.first : null;
    const host = (p.on ? p.reason : p.planned) === 'birthday' && typeof partyHost === 'function' ? partyHost() : null;
    F.bdayHost = host && host !== v ? host.first : null;
    // the wizard's fireworks
    const sd = Game.wizard ? Game.wizard.showDay : null;
    F.fwAgo = sd != null ? day - sd : null; F.fwLately = F.fwAgo != null && F.fwAgo <= 2; F.fwTonight = !!(occ && sd !== day);
    // the May
    const cm = (v.memories || []).find((m) => /^Was crowned (Queen|King) of the May/.test(m.t));
    F.mayCrowned = cm ? cm.t.match(/(Queen|King)/)[1] : null;
    const y0 = (F.year - 1) * YEAR_DAYS + 1;
    const q = Game.villagers.find((o) => o !== v && (o.memories || []).some((m) => m.d >= y0 && /^Was crowned/.test(m.t)));
    F.mayQueen = q ? q.first : null; F.mayTitle = q ? (q.pron.they === 'she' ? 'Queen' : 'King') : null;
    // the larder and the table
    const home = v.homeId >= 0 ? v.home() : null;
    const jars = home && typeof jarsTotal === 'function' ? jarsTotal(home) : null;
    F.jars = jars; F.jarsWord = jars == null ? null : jars >= 12 ? 'full' : jars >= 4 ? 'some' : 'bare';
    F.puttingBy = typeof puttingBySeason === 'function' && puttingBySeason();
    F.pantryBare = home ? pantryTotal(home) < 4 : null;
    F.seasonFavFood = v.favouriteFood && FOODS[v.favouriteFood()] ? FOODS[v.favouriteFood()].label : null;
    F.feastOn = typeof feastOn === 'function' && feastOn();
    F.tomorrowDay = weekday(day + 1);
    F.restDay = isRestDay(day); F.marketDay = isMarketDay(day);
    F.pens = (World.pens || []).map((x) => x.kind);
  });

  // Promises about the year: fireworks at a festival, fine weather for one.
  addPromiseCheck('season.fireworks', (v, p) => {
    const sd = Game.wizard ? Game.wizard.showDay : null;
    if (sd != null && sd >= p.d && sd <= p.due) return 'kept';
    return Game.day > p.due ? 'broken' : null;
  });
  addPromiseCheck('season.dry', (v, p) => {
    if ((Game.lastParty ?? -9) >= p.due && (Game.lastParty ?? -9) <= p.due + 1) return 'kept';
    return Game.day > p.due ? 'broken' : null;
  });
  // A promise whose day is the next festival's, set from a choice.
  const festPromise = (k, t) => (T, v) => {
    const F = T.F;
    if (!F.nextFest || !F.nextFestIn) return;
    const b = bondFull(v);
    const text = fillTalkLine(t, F);
    if (!text || b.promises.some((x) => x.k.startsWith(k) && x.state === 'open')) return;
    b.promises.unshift({ k: `${k}.${F.nextFest}`, t: text, d: Game.day, due: Game.day + F.nextFestIn, state: 'open' });
    T.log.push({ who: 'note', text: `${v.first} will remember that.` });
  };
  // the other seasons packs use these
  window.seasonFestPromise = festPromise;

  frags('season.sky', ['the sky', 'the weather', 'the clouds', 'whatever\'s up there']);

  // --- Today's weather ----------------------------------------------------------------
  const WX_LABEL = { rain: 'Wet enough for you?', snow: 'Snow on the lanes', fog: 'This fog', clear: 'A fine day for it', cloudy: 'A grey old sky' };
  addThread({
    id: 'season.weather', cool: 1, weight: 1,
    label: (F) => (F.storm ? 'This storm' : WX_LABEL[F.weather] || 'The weather'),
    rel: (F) => (F.storm || F.weather === 'snow' || F.weather === 'fog' ? 1.8 : F.weather === 'rain' ? 1.5 : F.hazardOn ? 1.3 : 0.8),
    open: { warm: 'season.weather.open' },
    beats: {
      start: { line: 'season.weather.start', go: [
        { ap: 'jest', say: 'season.weather.jest', to: 'blame' },
        { ap: 'ask', say: 'Do you mind it? Weather like this?', to: 'mind' },
        { ap: 'share', say: 'season.weather.far', label: 'Tell them of weather on the road', to: 'far' },
      ] },
      blame: { line: 'season.weather.blame', go: [
        { ap: 'jest', say: 'Very well. A fine Highday, for one seed-cake. Paid in advance.', to: 'bargain' },
        { ap: 'ask', say: 'And if you could choose? What would you have?', to: 'choose' },
        { ap: 'warm', say: 'If I could mend the sky for you, {name}, I would.', to: 'cosy' },
      ] },
      mind: { line: 'season.weather.mind', go: [
        { ap: 'ask', say: 'And what does a day like this make you want to do?', to: 'cosy' },
        { ap: 'ask', say: 'Does it make the work harder?', to: 'work', need: { if: { job: (j) => !!j } } },
        { ap: 'listen', say: '*You lean on your staff and wait.*', label: 'Wait for more', to: 'memory', need: { open: 1 }, soft: true },
      ] },
      far: { line: 'season.weather.farback', go: [
        { ap: 'tale', say: 'In the far north it snowed so hard the wolves wore hats. Small ones.', to: 'tale' },
        { ap: 'warm', say: 'Nothing beats a Thistledown sky, though. Not even a dry one.', to: 'proud' },
        { ap: 'ask', say: 'Have you ever been caught out in the worst of it?', to: 'memory' },
      ] },
      bargain: { line: 'season.weather.bargain', fx: { joke: { k: 'season.deal', t: 'The wizard sells fine weather for seed-cake, paid in advance.' } }, go: [
        { ap: 'jest', say: 'Two seed-cakes and I\'ll throw in a rainbow.', to: 'rainbow' },
        { ap: 'warm', say: 'Keep your cake. You can owe me a cup of tea.', to: 'end', fx: { fond: 0.02 } },
      ] },
      rainbow: { line: 'season.weather.rainbow', fx: { fond: 0.02 }, end: true },
      choose: { line: 'season.weather.choose', go: [
        { ap: 'warm', say: 'Then I hope you get it tomorrow.', to: 'end' },
        { ap: 'jest', say: 'I\'ll put in a word. Upstairs.', to: 'end' },
        { ap: 'ask', say: 'Is there a day like that you remember?', to: 'memory', need: { open: 1 }, soft: true },
      ] },
      cosy: { line: 'season.weather.cosy', go: [
        { ap: 'warm', say: 'That sounds the very thing.', to: 'end', fx: { feel: 'cosy' } },
        { ap: 'jest', say: 'And a second supper, to be safe.', to: 'supper' },
        { ap: 'share', say: 'I\'d join you, if my hat would go through your door.', to: 'invite', need: { fond: 0.15 }, soft: true },
      ] },
      supper: { line: 'season.weather.supper', end: true },
      invite: { line: 'season.weather.invite', fx: { fond: 0.03, remember: 'The wizard and I talked of what to do on a day like this.', rv: 1 }, end: true },
      work: { line: 'season.weather.work', go: [
        { ap: 'advise', say: 'season.weather.tip', label: 'Give them a tip for it', to: 'advised' },
        { ap: 'comfort', say: 'Then the rest of us owe you a pint for it.', to: 'thanked' },
        { ap: 'jest', say: 'Have you tried asking it nicely?', to: 'nicely' },
      ] },
      advised: { line: 'season.weather.advised', fx: { respect: 0.02 }, end: true },
      thanked: { line: 'season.weather.thanked', fx: { fond: 0.02 }, end: true },
      nicely: { line: 'season.weather.nicely', end: true },
      memory: { line: 'season.weather.memory', fx: { open: 1 }, go: [
        { ap: 'ask', say: 'And what did you do?', to: 'memory2' },
        { ap: 'share', say: 'I was out in that one too. Stuck in a drift halfway to Bree.', to: 'shared' },
        { ap: 'comfort', say: 'You came through it. That\'s what matters.', to: 'end', fx: { trust: 0.02 } },
      ] },
      memory2: { line: 'season.weather.memory2', fx: { trust: 0.03, remember: 'Told the wizard about the worst weather I ever saw.', rv: 1 }, end: true },
      shared: { line: 'season.weather.shared', fx: { trust: 0.03, joke: { k: 'season.drift', t: 'The wizard got stuck in a snowdrift halfway to Bree.' } }, end: true },
      tale: { line: 'season.weather.tale', fx: { fond: 0.02 }, go: [
        { ap: 'tale', say: 'Grey ones, knitted by a very patient witch. Earflaps and all.', to: 'hats' },
        { ap: 'jest', say: 'I may have made up the hats. The wolves were real.', to: 'end' },
      ] },
      hats: { line: 'season.weather.hats', fx: { joke: { k: 'season.wolfhats', t: 'The wolves of the north wear knitted hats with earflaps.' } }, end: true },
      proud: { line: 'season.weather.proud', end: true },
    },
    end: { fond: 0.01 },
  });

  lines('season.weather.open', [
    { text: ['Some weather we\'re having, {name}.', 'What do you make of the sky today, {name}?', 'Well, {name}. What\'s the weather done to you today?'] },
    { if: { weather: 'rain' }, text: ['Wet enough for you, {name}?', 'You look like a hobbit who\'s been rained on, {name}.', 'Mind the drips off my hat, {name}. There are a great many.'] },
    { if: { storm: true }, text: ['Hear that thunder, {name}? The hills are arguing again.', 'Quite a storm, {name}. Are your hens indoors?'] },
    { if: { weather: 'snow' }, text: ['Snow at last, {name}! Are your toes still with you?', 'There\'s snow on your eyebrows, {name}. It suits you.'] },
    { if: { weather: 'fog' }, text: ['Is that you, {name}? In all this fog I can\'t be sure.', 'Thick fog this morning, {name}. I nearly greeted a haystack.'] },
    { if: { weather: 'clear' }, text: ['A fine day, {name}. Not a cloud from here to the hills.', 'What a sky, {name}! Somebody\'s polished it.'] },
    { if: { weather: 'cloudy' }, text: ['Grey old sky today, {name}. Can\'t make up its mind.', 'Clouds sitting on the hill, {name}. Rain later, do you think?'] },
    { if: { stage: 'child' }, text: ['What do you make of the sky today, young {name}?', 'Have you been out in it yet, {name}? The weather, I mean.'] },
  ]);
  lines('season.weather.start', [
    { text: ['Weather\'s doing what it likes, as usual.', 'Can\'t complain about the weather. Well, I can. I shan\'t.', 'Funny old sky today.'] },
    { if: { weather: 'rain' }, text: ['Wet enough for ducks. Wet enough for fish, nearly.', 'It\'s been coming down since breakfast. First breakfast.', 'The rain\'s found the one gap in my collar. It always does.'] },
    { if: { storm: true }, pri: 1, text: ['Did you hear that thunder? I dropped a whole teacake.', 'Thunder over the hills! The hens have gone under the cart.', 'A proper storm. The chimney\'s howling like a lost dog.'] },
    { if: { weather: 'snow' }, text: ['Snow! Proper snow, the squeaky kind.', 'The lane\'s a foot deep and the children are a foot deeper.', 'Snow on the hill and snow in my boots.'] },
    { if: { weather: 'fog' }, text: ['Can\'t see the end of my own garden. I counted the cabbages to be sure.', 'Fog like porridge this morning. I said good morning to a gatepost.', 'Thick as wool, this fog. The geese keep walking into each other.'] },
    { if: { weather: 'clear' }, text: ['Not a cloud. I keep looking for the catch.', 'A blue sky like this wants a picnic in it.', 'Lovely day. Lovely. The sort you remember in winter.'] },
    { if: { weather: 'cloudy' }, text: ['Grey and grumpy, the sky is. Like somebody\'s uncle.', 'Can\'t make up its mind, this sky.', 'Clouds sitting on the hill like a hen on eggs.'] },
    { if: { temper: 'ornery', weather: 'rain' }, text: ['Rain. Again. I\'ve stopped speaking to it.', 'If it rains on my washing once more I\'m moving to Bree.'] },
    { if: { temper: 'ornery', weather: 'clear' }, text: ['Too hot. Mark my words, we\'ll pay for this later.', 'Sunshine. Everyone grinning like fools. Hmph.'] },
    { if: { temper: 'ornery', weather: 'snow' }, text: ['Snow. Pretty for an hour, then a nuisance till spring.', 'Who\'s going to sweep all this? Not the sky, I\'ll tell you that.'] },
    { if: { temper: 'ornery' }, text: ['Weather? There\'s always weather. That\'s the trouble with it.', 'It\'ll do whatever it likes, and I\'ll get the blame.'] },
    { if: { temper: 'cheerful', weather: 'rain' }, text: ['Rain! Good for the gardens and good for the puddles!', 'Lovely soft rain. The roses are drinking it up.'] },
    { if: { temper: 'cheerful', weather: 'clear' }, text: ['What a day! The sun\'s come out especially to see us.', 'Isn\'t it glorious? I\'ve been grinning since I opened the door.'] },
    { if: { temper: 'cheerful', weather: 'snow' }, text: ['Snow! I\'ve already made a snow-hobbit. He\'s wearing my scarf.', 'Isn\'t it lovely? Everything gone soft and white and quiet.'] },
    { if: { temper: 'cheerful' }, text: ['Every sky\'s a good sky, if you\'ve a kettle to come home to.', 'Oh, I like a bit of weather. Gives you something to talk about.'] },
    { if: { temper: 'shy' }, text: ['...It\'s nice. The weather. Isn\'t it?', '...Oh. Um. Yes. Weather.'] },
    { if: { temper: 'shy', weather: 'rain' }, text: ['...I don\'t mind the rain. Nobody looks at you in the rain.', '...Wet. Sorry. I\'m dripping on you.'] },
    { if: { temper: 'dreamy', weather: 'rain' }, text: ['I like the rain. The whole valley sounds like it\'s whispering.', 'Listen. Every leaf\'s got its own note in the rain.'] },
    { if: { temper: 'dreamy', weather: 'fog' }, text: ['The fog makes everything a secret. Even the pig sty.', 'In fog the valley could be anywhere. I like that. Anywhere at all.'] },
    { if: { temper: 'dreamy', weather: 'clear' }, text: ['You can see right to the far hills. I wonder who\'s looking back.', 'A sky like this makes me want to walk until it ends.'] },
    { if: { temper: 'dreamy', weather: 'snow' }, text: ['Snow\'s like the world starting over. Nobody\'s footprints yet.', 'Every flake different, they say. I tried to check. I got cold.'] },
    { if: { temper: 'witty', weather: 'rain' }, text: ['The sky\'s having a good cry. I\'d ask what\'s wrong but it won\'t say.', 'Rain. Nature\'s way of making you sit down with a pie.'] },
    { if: { temper: 'witty', weather: 'clear' }, text: ['Sun\'s out. Everyone\'s pretending they won\'t sit down at the first chance.', 'Not a cloud. The sky\'s clearly up to something.'] },
    { if: { temper: 'witty', weather: 'snow' }, text: ['Snow: the sky\'s way of making you sweep twice.', 'It\'s snowing. My doorstep has vanished. I\'ve never liked it anyway.'] },
    { if: { temper: 'witty', weather: 'fog' }, text: ['Fog. Lovely. Now I can\'t see the people I\'m avoiding either.'] },
    { if: { temper: 'proud' }, text: ['Thistledown weather. Better than anyone else\'s, even when it isn\'t.', 'We get a better class of weather here. Everyone says so.'] },
    { if: { temper: 'proud', weather: 'rain' }, text: ['My hole hasn\'t let in a drop. Not one. I did the drains myself.'] },
    { if: { temper: 'gloomy' }, text: ['It\'ll rain. If it isn\'t raining, it\'s about to.', 'Grey again. Suits me, I suppose.'] },
    { if: { temper: 'gloomy', weather: 'clear' }, text: ['Sunny. It won\'t last. Nothing does.', 'Bright today. That only means tomorrow will be worse.'] },
    { if: { temper: 'gloomy', weather: 'rain' }, text: ['Rain. Well. At least it\'s honest about it.'] },
    { if: { temper: 'curious' }, text: ['Do you know why clouds go that way and not the other? I\'ve been wondering all morning.', 'Where does weather come from? Is there a place? Have you been?'] },
    { if: { temper: 'curious', weather: 'fog' }, text: ['Where does fog go when it lifts? Does it just go up? Into what?'] },
    { if: { temper: 'curious', weather: 'snow' }, text: ['I caught a snowflake on my sleeve. Six points. Always six. Why six?'] },
    { if: { stage: 'child' }, text: ['Is weather magic? Is it YOUR magic?', 'I don\'t care what the weather does as long as there\'s pudding.'] },
    { if: { stage: 'child', weather: 'rain' }, text: ['I jumped in EVERY puddle. Mum says that\'s too many.', 'It\'s raining! Can you make it rain lemonade?'] },
    { if: { stage: 'child', weather: 'snow' }, text: ['SNOW! Can you make more? A LOT more?', 'I ate some snow. It tasted of nothing. Brilliant.'] },
    { if: { stage: 'child', weather: 'clear' }, text: ['It\'s sunny so we\'re not allowed indoors. Brilliant.', 'The sun\'s out! I\'m going to be out ALL day.'] },
    { if: { stage: 'child', weather: 'fog' }, text: ['I got lost in the fog and found a frog. A FOG frog.', 'I can\'t see my house! I can\'t see YOUR house! Wizard, where are we?'] },
    { if: { stage: 'child', storm: true }, pri: 1, text: ['The thunder\'s a giant moving furniture. Dad says. Is it?', 'I\'m not scared of thunder. I\'m just standing near you.'] },
    { if: { stage: 'elder' }, text: ['My knee told me this was coming. My knee is never wrong.', 'Seen worse. Seen better. Seen it all, near enough.'] },
    { if: { stage: 'elder', weather: 'rain' }, text: ['My knees said rain by breakfast. They\'re cleverer than I am.'] },
    { if: { stage: 'elder', weather: 'snow' }, text: ['Snow. When I was young it came up to the door-knobs. The round ones.'] },
    { if: { rift: true }, text: ['Real weather. Water just falling out of the sky, for free. Still not used to it.', 'In Neverdark the rain was warm and tasted of battery. This is better.'] },
    { if: { rift: true, weather: 'snow' }, text: ['Snow is frozen rain that falls slow on purpose. Nobody told me. It\'s amazing.'] },
    { if: { rift: true, weather: 'fog' }, text: ['Fog here is just fog. No neon in it. Feels undressed.'] },
    { if: { rift: true, weather: 'clear' }, text: ['Blue. The whole sky, blue. Back home it was ad-coloured. Mostly pink.'] },
    { if: { job: 'farmer', weather: 'rain' }, text: ['Rain\'s good for the barley. Bad for my back. Can\'t have both.'] },
    { if: { job: 'farmer', weather: 'clear' }, text: ['Good drying weather. If it holds, we\'ll have the hay in by Highday.'] },
    { if: { job: 'fisher', weather: 'rain' }, text: ['Fish bite better in the rain. So do midges.'] },
    { if: { job: 'fisher', weather: 'fog' }, text: ['Fog on the river. Can\'t see the float, can\'t see the fish. Peaceful, though.'] },
    { if: { job: 'postie', weather: 'rain' }, text: ['Every letter in my bag is soggy. Somebody\'s getting a love letter in blots.'] },
    { if: { job: 'postie', weather: 'snow' }, text: ['Snow\'s up to the letterboxes. I\'ve posted three letters into drifts.'] },
    { if: { job: 'miller', weather: 'rain' }, text: ['River\'s up, so the wheel\'s fairly singing. Good milling weather.'] },
    { if: { job: 'herder', weather: 'rain' }, text: ['Wet sheep. There\'s no smell like it. Thank goodness.'] },
    { if: { job: 'brewer' }, text: ['Any weather\'s brewing weather. Hot, they want it cold. Cold, they want it mulled.'] },
    { if: { job: 'innkeeper', weather: 'rain' }, text: ['Rain\'s good for trade. Everyone comes in to dry their socks at my fire.'] },
    { if: { job: 'grower', weather: 'clear' }, text: ['Good drying weather for the leaf. Best pipe-weed in years, if it holds.'] },
    { if: { job: 'orchardist', weather: 'clear' }, text: ['The apples like a bit of sun. So do I. We\'re very alike, the apples and me.'] },
    { if: { job: 'baker', weather: 'snow' }, text: ['Snow means everyone wants their bread warm. My oven\'s never been so popular.'] },
    { if: { job: 'woodwright', weather: 'rain' }, text: ['Wet timber, wet sawdust, wet woodwright. Nothing glues in this.'] },
    { if: { job: 'herbalist', weather: 'rain' }, text: ['The rain brings the herbs up. And the sniffles. Busy either way.'] },
    { if: { likes: 'rain', weather: 'rain' }, pri: 1, text: ['Isn\'t it gorgeous? Everyone hates the rain but me. I could listen to it all day.'] },
    { if: { likes: 'sunshine', weather: 'clear' }, pri: 1, text: ['Sun on my face. Give me this and you can keep the rest.'] },
    { if: { likes: 'sunshine', weather: 'rain' }, pri: 1, text: ['I miss the sun. It\'s been gone a whole morning and I miss it already.'] },
    { if: { sick: true }, pri: 2, text: ['This weather\'s got into my chest. *cough* Sorry.'] },
    { if: { hazard: 'drought', hazardOn: true }, pri: 2, text: ['Still no rain. The garden\'s crackling like a fire.', 'Dry as a biscuit. The well bucket comes up half empty.'] },
    { if: { hazard: 'frost', hazardOn: true }, pri: 2, text: ['Hard frost. My breath froze on the door-knob.', 'Cold enough to freeze the words in your mouth. Listen: they\'re clinking.'] },
    { if: { hazard: 'flood', hazardOn: true }, pri: 2, text: ['The river\'s in the meadow. Right in it! Like it owns the place.'] },
    { if: { season: 'winter', weather: 'clear' }, text: ['Bright and bitter. The kind of cold that stings your nose.'] },
    { if: { season: 'summer', weather: 'clear' }, text: ['Hot as an oven. The bees are too lazy to buzz.'] },
    { if: { season: 'autumn', weather: 'rain' }, text: ['Autumn rain. It brings the leaves down and the mushrooms up.'] },
    { if: { season: 'spring', weather: 'rain' }, text: ['Spring rain. You can nearly hear things growing.'] },
    { if: { season: 'spring', weather: 'clear' }, text: ['Blossom and blue sky. Spring\'s showing off, isn\'t it?'] },
    { if: { season: 'autumn', weather: 'fog' }, text: ['Autumn fog. The spiders\' webs are all strung with pearls.'] },
    { if: { party: true, weather: 'rain' }, pri: 1, text: ['Rain on a party night! The fiddler\'s in a sulk.'] },
    { if: { hour: 'night', weather: 'clear' }, text: ['Clear night. Look at that sky. Full to the brim with stars.'] },
  ]);
  lines('season.weather.jest', [
    { text: ['I\'d take the credit for it, but I only do fireworks.', 'Don\'t look at me. I\'m off duty today.'] },
    { if: { weather: 'rain' }, text: ['Not my doing, I swear. I asked for a light drizzle.', 'I\'ve had a word with the clouds. They said no.'] },
    { if: { weather: 'clear' }, text: ['You\'re welcome. It took all morning.', 'I polished it myself. Mind the corners.'] },
    { if: { weather: 'snow' }, text: ['I sneezed. Sorry. It happens with wizards.', 'I may have shaken out my hat a bit hard.'] },
    { if: { weather: 'fog' }, text: ['My pipe got a bit out of hand. I do apologise.', 'That\'s my pipe-smoke. I had a very long think.'] },
    { if: { weather: 'cloudy' }, text: ['The sky\'s in a sulk. I said something about its blue.', 'I\'ve folded the sun away for cleaning.'] },
  ]);
  lines('season.weather.far', [
    { text: ['On the road last month it rained frogs. Small ones, and very surprised.', 'Out east the wind blows so hard the crows fly backwards to save face.'] },
    { if: { season: 'winter' }, text: ['Up in the north the snow\'s blue, and so are the dwarves.'] },
    { if: { season: 'summer' }, text: ['In the south it\'s so hot the eggs fry themselves on the road.'] },
  ]);
  lines('season.weather.blame', [
    { text: ['Ha! If you could fix it, you would have.', 'Then who do we complain to? There must be somebody.', 'A wizard who can\'t do weather. Whatever next?'] },
    { if: { temper: 'ornery' }, text: ['Off duty. Wizards. It\'s all fireworks and no drains.', 'Well, somebody\'s responsible, and you\'re the one with the hat.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! Then I\'ll thank the sky myself. Thank you, sky!', 'You\'re a tease. A lovely tease.'] },
    { if: { temper: 'witty' }, text: ['Off duty? You\'re a wizard. You\'ve never been on duty in your life.', 'Fireworks only? Then make the clouds explode. Problem solved.'] },
    { if: { temper: 'shy' }, text: ['...Ha. Oh. You were joking. Ha.', '...I did wonder if it was you. A bit.'] },
    { if: { temper: 'curious' }, text: ['But could you? If you really tried? How would it even work?', 'Is weather a sort of firework, only slower? Wetter?'] },
    { if: { temper: 'proud' }, text: ['I\'d not want it fixed. I\'ve managed weather all my life.'] },
    { if: { temper: 'gloomy' }, text: ['No. Nobody can fix it. That\'s rather the point of weather.'] },
    { if: { temper: 'dreamy' }, text: ['I think the weather fixes itself, in the end. We\'re just here for it.'] },
    { if: { stage: 'child' }, text: ['You CAN do weather. I know you can. Do snow! Do snow now!', 'Make it rain sweets. Go on. I won\'t tell.'] },
    { if: { stage: 'elder' }, text: ['Your sort said that eighty years ago, and it\'s rained ever since.'] },
    { if: { rift: true }, text: ['Back home they sold weather. You paid extra for sun. Here it just... happens.'] },
    { if: { weather: 'snow' }, text: ['Well, whatever you did, stop doing it, or we\'ll never see the road again.'] },
    { if: { weather: 'fog' }, text: ['Your pipe! I knew it smelled of something. I thought it was the pigs.'] },
  ]);
  lines('season.weather.bargain', [
    { text: ['Done! Seed-cake on your doorstep. Or your wagon. Have you a doorstep?', 'Paid in advance? You drive a hard bargain, wizard. Done.'] },
    { if: { temper: 'ornery' }, text: ['In advance? And if it rains anyway? Hmph. ...Half now.'] },
    { if: { temper: 'witty' }, text: ['A whole seed-cake for one day? I\'ll want a receipt. In fireworks.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! I\'ll bake you two, and you can throw in a sunset.'] },
    { if: { temper: 'proud' }, text: ['My seed-cake is worth a week of sun, I\'ll have you know.'] },
    { if: { temper: 'shy' }, text: ['...I could bake one. If you really wanted.'] },
    { if: { stage: 'child' }, text: ['I haven\'t got a seed-cake. I\'ve got half a biscuit. Is that a Highday?'] },
    { if: { job: 'baker' }, pri: 1, text: ['A baker\'s seed-cake for a fine Highday? You\'re robbing me. Done.'] },
  ]);
  lines('season.weather.rainbow', [
    { text: ['A rainbow! Now you\'re talking. With the gold at the end?', 'Ha! I\'ll hold you to the rainbow, mind.'] },
    { if: { temper: 'witty' }, text: ['A rainbow. You can\'t even get the rain right and now it\'s rainbows.'] },
    { if: { stage: 'child' }, text: ['A RAINBOW? A real one? Can I climb it?'] },
    { if: { temper: 'dreamy' }, text: ['A rainbow\'s worth more than seed-cake. I\'d give three.'] },
  ]);
  lines('season.weather.choose', [
    { text: ['A soft grey morning, then sun after second breakfast. Then rain at night, on the window.', 'Warm, with a breeze. The kind that brings the smell of the bakery.'] },
    { if: { likes: 'rain' }, text: ['Rain. Soft, all day, and nowhere to be. That\'s my perfect day.'] },
    { if: { likes: 'sunshine' }, text: ['Sun. Hot sun. Me on the bank with my boots off.'] },
    { if: { temper: 'ornery' }, text: ['I\'d have it do as it\'s told, for once.'] },
    { if: { temper: 'dreamy' }, text: ['Snow at night and sun in the morning, so you wake up to a new world.'] },
    { if: { temper: 'gloomy' }, text: ['Overcast. Nothing expected of anybody. That\'s my sort of day.'] },
    { if: { temper: 'witty' }, text: ['Rain on my neighbours\' washing and sun on mine.'] },
    { if: { stage: 'child' }, text: ['Snow in summer! Then we could have snowballs AND strawberries.'] },
    { if: { job: 'farmer' }, text: ['Rain at night, sun by day. Then the barley grows and I sleep. Perfect.'] },
    { if: { job: 'fisher' }, text: ['Overcast and still, with a bit of drizzle on the water. Fish love it.'] },
    { if: { rift: true }, text: ['A thunderstorm. Real lightning, the free kind. I could watch it for hours.'] },
  ]);
  lines('season.weather.mind', [
    { text: ['Mind it? No. It\'s weather. You put a coat on.', 'I don\'t mind it. I mind what it does to the washing.'] },
    { if: { likes: 'rain' }, text: ['Mind it? I love it. Everyone thinks I\'m mad.', 'I like a wet day. Tea tastes better with rain on the window.'] },
    { if: { likes: 'sunshine' }, text: ['I\'m a sun hobbit. Give me a warm wall to lean on and I\'ll purr.'] },
    { if: { dislike: 'the rain' }, pri: 1, text: ['I can\'t abide the rain. It gets in everything. My pockets. My pie.'] },
    { if: { temper: 'ornery' }, text: ['Mind it? Course I mind it. I mind most things.'] },
    { if: { temper: 'cheerful' }, text: ['Not a bit! There\'s no bad weather, only the wrong socks.'] },
    { if: { temper: 'shy' }, text: ['...I don\'t mind. I stay in mostly.'] },
    { if: { temper: 'gloomy' }, text: ['I mind it. Then I mind that I mind it. It\'s a long day.'] },
    { if: { temper: 'dreamy' }, text: ['Every kind of day has a kind of thinking that goes with it. I don\'t mind.'] },
    { if: { temper: 'witty' }, text: ['Only when it\'s weather. Otherwise I\'m fine.'] },
    { if: { temper: 'proud' }, text: ['Hobbits of my family don\'t mind weather. We\'ve better things to do.'] },
    { if: { temper: 'curious' }, text: ['I like knowing what it\'ll do next. I keep a little book of skies.'] },
    { if: { stage: 'child' }, text: ['I only mind when they make me wear the big coat.', 'Rain means puddles. Snow means snowballs. Sun means outside. All good!'] },
    { if: { stage: 'elder' }, text: ['At my age you mind the cold and you\'re thankful for the rest.'] },
    { if: { weather: 'snow' }, text: ['Snow I don\'t mind. It\'s the melting after. Slush in your boots till spring.'] },
    { if: { weather: 'fog' }, text: ['Fog I don\'t like. You hear things you can\'t see. Gives me the shivers.'] },
    { if: { rift: true }, text: ['Mind it? I still go out and stand in it. Just to feel it.'] },
  ]);
  lines('season.weather.cosy', [
    { text: ['Stay in. Put the kettle on. Find a biscuit I\'d forgotten about.', 'Sit by the window and watch everyone else get wet.'] },
    { if: { weather: 'rain' }, text: ['Fire lit, feet up, and the rain on the round window. Bliss.', 'Bake something. The smell\'s better on a wet day.'] },
    { if: { weather: 'snow' }, text: ['Snowballs, then hot cocoa, then more snowballs.', 'Stay in by the fire with my toes in a basin of hot water.'] },
    { if: { weather: 'clear' }, text: ['Picnic. Down by the river with the good basket.', 'Lie in the long grass and do nothing at all, very slowly.'] },
    { if: { weather: 'fog' }, text: ['Stay in and toast crumpets. Fog\'s crumpet weather.'] },
    { if: { pastime: 'knitting' }, pri: 1, text: ['Knit. A day like this is all wool and the clack of needles.'] },
    { if: { pastime: 'painting' }, pri: 1, text: ['Paint it. Weather\'s the hardest thing to paint. I keep trying.'] },
    { if: { pastime: 'birdwatching' }, pri: 1, text: ['Watch the birds. They\'re cleverer than us in weather. They know where to sit.'] },
    { if: { pastime: 'carving' }, pri: 1, text: ['Whittle by the fire. Shavings everywhere, and nobody minds.'] },
    { if: { temper: 'ornery' }, text: ['Shut the door and not answer it. To anyone. Present company excepted.'] },
    { if: { temper: 'shy' }, text: ['...Read. Under a blanket. Nobody knocks on a day like this.'] },
    { if: { temper: 'cheerful' }, text: ['Have everyone round! A wet day wants a full kitchen.'] },
    { if: { temper: 'dreamy' }, text: ['Sit at the window and watch the drops race. I always back the slow one.'] },
    { if: { temper: 'witty' }, text: ['Nap. Then a nap to recover from the nap.'] },
    { if: { temper: 'gloomy' }, text: ['Sit. Think about things. Not good things, mostly.'] },
    { if: { stage: 'child' }, text: ['Build a den out of all the chairs. Mum hates it.', 'Go OUT in it! Obviously!'] },
    { if: { spouse: (s) => !!s }, text: ['Me and {spouse} by the fire, and the door shut on the world.'] },
    { if: { hour: 'evening' }, text: ['Supper early, bed early, and the rain to sing me off.'] },
  ]);
  lines('season.weather.supper', [
    { text: ['Two second suppers. I\'ve been training for years.', 'Ha! Second supper\'s not optional on a day like this.'] },
    { if: { temper: 'witty' }, text: ['Second supper is the safe amount. Third is when it gets exciting.'] },
    { if: { stage: 'child' }, text: ['Second SUPPER? Is that allowed? Don\'t tell Mum.'] },
    { if: { temper: 'proud' }, text: ['My second supper is better than most folk\'s first.'] },
  ]);
  lines('season.weather.invite', [
    { text: ['Then come in through the kitchen. The kitchen door\'s bigger. Mind the hams.', 'We\'d make room. Hat and all. Come for tea one wet day.'] },
    { if: { temper: 'shy' }, text: ['...You could. If you like. I\'d put the good cups out.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. You\'d drip on my rug. ...Wipe your feet, then.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, do! Bring your pipe and your stories and I\'ll bring the pie.'] },
    { if: { stage: 'child' }, text: ['You can sit in Dad\'s chair! He won\'t mind. He\'ll mind a bit.'] },
    { if: { homeless: true }, pri: 2, text: ['I\'ve no door at the moment. But when I do, you\'re the first through it.'] },
  ]);
  lines('season.weather.work', [
    { text: ['Everything takes twice as long and comes out half as well.', 'You learn the weather, in a trade. It\'s the first thing you learn.'] },
    { if: { job: 'farmer' }, text: ['The rain and I have an arrangement. It comes when I don\'t want it.', 'Sow in the wet, reap in the dry, and pray the two don\'t swap.'] },
    { if: { job: 'fisher' }, text: ['The fish don\'t care about the weather. I do. My feet do.'] },
    { if: { job: 'postie' }, text: ['Rain, snow, fog. The post goes through. Soggy, but through.'] },
    { if: { job: 'miller' }, text: ['Too much rain and the wheel races. Too little and it sulks. Like a pony.'] },
    { if: { job: 'baker' }, text: ['Damp gets in the flour. Then the bread won\'t rise, and nor will I.'] },
    { if: { job: 'brewer' }, text: ['Hot days spoil a brew. Cold days slow it. I mostly worry.'] },
    { if: { job: 'innkeeper' }, text: ['Weather sends them in or keeps them out. Either way, mud on my floor.'] },
    { if: { job: 'woodwright' }, text: ['Timber moves with the weather. Swells in the wet, splits in the dry. Like a cat.'] },
    { if: { job: 'herder' }, text: ['Sheep hate rain. Cows ignore it. Pigs love it. I\'m with the sheep.'] },
    { if: { job: 'orchardist' }, text: ['A late frost and the blossom\'s gone. One night, and no apples all year.'] },
    { if: { job: 'grower' }, text: ['Leaf wants sun to cure. Rain at the wrong time and it\'s mould.'] },
    { if: { job: 'herbalist' }, text: ['Each herb wants picking in its weather. Mint in the wet, thyme in the sun.'] },
    { if: { job: 'tinker' }, text: ['Rust. Weather means rust. I spend half my life oiling things.'] },
    { if: { job: 'storyteller' }, text: ['Bad weather fills my benches. Nobody wants a story in the sunshine.'] },
    { if: { temper: 'ornery' }, text: ['Harder? Everything\'s harder. The weather\'s just the latest thing.'] },
    { if: { temper: 'proud' }, text: ['Nothing\'s harder for me. I simply work harder than the weather.'] },
  ]);
  lines('season.weather.tip', [
    { text: ['Do the dry work first, and save the wet work for when you\'re wet anyway.', 'Goose grease on your boots. Old trick. Smells, but works.'] },
    { if: { job: 'farmer' }, text: ['Plough across the slope, not down it. The rain stays where you want it.'] },
    { if: { job: 'fisher' }, text: ['Try the deep pool under the willow in the rain. Trout hide there.'] },
    { if: { job: 'baker' }, text: ['Keep the flour by the oven wall. Warm and dry, like a cat.'] },
    { if: { job: 'postie' }, text: ['Oilcloth round the letters, and run on the downhill bits.'] },
  ]);
  lines('season.weather.advised', [
    { text: ['Huh. I might try that.', 'Now why did nobody tell me that before?'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I know my own trade, thank you. ...I might try it, mind.', 'Hmph. My father did it that way. ...I\'ll think about it.'] },
    { if: { temper: 'curious' }, text: ['Really? Why does it work? No, I\'ll find out. I\'ll try it tomorrow.'] },
    { if: { temper: 'witty' }, text: ['Goose grease. Every wizard\'s answer to everything.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. I\'ll try. Quietly.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, clever! I\'ll tell everyone it was my idea.'] },
  ]);
  lines('season.weather.thanked', [
    { text: ['A pint! Now that\'s the sort of thanks I understand.', 'Ha! I\'ll remind them at the Badger.'] },
    { if: { temper: 'shy' }, text: ['...Oh. Nobody ever thanks you for the weather bits.'] },
    { if: { temper: 'ornery' }, text: ['A pint. They\'ll forget by the time they\'re at the bar.'] },
    { if: { temper: 'gloomy' }, text: ['...Thank you. It\'s nice when somebody notices.'] },
  ]);
  lines('season.weather.nicely', [
    { text: ['I\'ve tried everything else. Asking nicely\'s next.', 'Ha! I\'ve asked it all sorts. Nicely isn\'t one of them.'] },
    { if: { temper: 'ornery' }, text: ['Nicely? I\'ve been shouting at it for forty years.'] },
    { if: { temper: 'dreamy' }, text: ['I do, sometimes. Out loud. It doesn\'t listen, but it\'s nice to be polite.'] },
    { if: { stage: 'child' }, text: ['PLEASE STOP RAINING. ...It didn\'t work.'] },
  ]);
  lines('season.weather.memory', [
    { text: ['The winter the river froze. We walked to the far bank on the ice, all of us, holding hands.', 'The great hail. Stones the size of plums. It flattened every cabbage in the valley.'] },
    { if: { stage: 'elder' }, text: ['The Long Winter, when I was a child. Snow over the round doors. We dug tunnels between the holes.', 'The summer it didn\'t rain from Mayday to the Harvest. The river was a ditch.'] },
    { if: { stage: 'child' }, text: ['The big thunder! I hid under the table with the dog. The dog hid under me.'] },
    { if: { temper: 'dreamy' }, text: ['The night of the white mist. The whole valley was a lake of cloud and the hilltops were islands.'] },
    { if: { temper: 'gloomy' }, text: ['The flood that took my mother\'s garden. Forty years of roses, in one night.'] },
    { if: { temper: 'cheerful' }, text: ['The wedding it hailed on! We all danced anyway. Best wedding I ever went to.'] },
    { if: { temper: 'ornery' }, text: ['The wind that took my roof-turf clean off. Found it in the next field. Upside down.'] },
    { if: { temper: 'witty' }, text: ['The storm that blew the miller\'s trousers off the line. They were found at Bree.'] },
    { if: { temper: 'proud' }, text: ['The big snow. I dug out half the lane myself. Nobody asked. Nobody had to.'] },
    { if: { temper: 'shy' }, text: ['...A thunderstorm, when I was small. I hid in the pantry. Everybody looked for me for hours.'] },
    { if: { temper: 'curious' }, text: ['The day of the red sky. Red as a forge, all afternoon. Nobody knows why. I still wonder.'] },
    { if: { rift: true }, text: ['The night I came through. There was a storm in the rift and a storm in the sky, and I couldn\'t tell which was which.'] },
    { if: { job: 'farmer' }, text: ['The wet harvest, years back. The barley sprouted in the stooks. We ate porridge all winter.'] },
    { if: { job: 'fisher' }, text: ['The flood that brought a pike into the duck pond. It ate four ducks before we caught it.'] },
  ]);
  lines('season.weather.memory2', [
    { text: ['What anyone does. Put the kettle on and waited it out, all together.', 'We crowded into the biggest hole and sang till it stopped. Took two days.'] },
    { if: { stage: 'elder' }, text: ['We shared everything. Every jar, every log. Nobody went short. That was the old way.'] },
    { if: { stage: 'child' }, text: ['I cried a bit. Then Mum made toast. Then it was fine.'] },
    { if: { temper: 'gloomy' }, text: ['Nothing. There was nothing to be done. You just watch, and then you dig.'] },
    { if: { temper: 'cheerful' }, text: ['Laughed! What else? And there was cake, which helped.'] },
    { if: { temper: 'proud' }, text: ['I organised the lot. Who went where, who carried what. Somebody had to.'] },
    { if: { temper: 'dreamy' }, text: ['I stood at the window all night. I\'ve never seen anything so beautiful, or so frightening.'] },
    { if: { temper: 'witty' }, text: ['Complained, mostly. It didn\'t help, but it passed the time.'] },
    { if: { stage: 'child' }, text: ['Hid in the pantry. With the jam. It was fine in the end.'] },
    { if: { rift: true }, text: ['Ran. Then somebody here gave me a blanket and a mug of something hot. I still think of that.'] },
  ]);
  lines('season.weather.shared', [
    { text: ['You? Stuck in a snowdrift? A wizard?', 'Ha! I\'d have paid to see that. Hat sticking out of the top.'] },
    { if: { temper: 'witty' }, text: ['How did they find you? Follow the smoke from your pipe?'] },
    { if: { stage: 'child' }, text: ['Did you have to be dug OUT? With SPADES?'] },
    { if: { temper: 'cheerful' }, text: ['Oh, that\'s wonderful. I\'m sorry. That\'s wonderful.'] },
    { if: { temper: 'shy' }, text: ['...That makes me feel better. That it happens to wizards too.'] },
  ]);
  lines('season.weather.farback', [
    { text: ['You\'re having me on. ...Aren\'t you?', 'Now I know you\'re making it up. Go on, though.', 'Get away! The things you see, out there.'] },
    { if: { temper: 'curious' }, text: ['Really? How? Where exactly? Tell it me properly, from the start.'] },
    { if: { temper: 'witty' }, text: ['And I suppose it was all uphill both ways, too.'] },
    { if: { temper: 'shy' }, text: ['...Is that true? It sounds frightening.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! I love it. Bring some home for us next time.'] },
    { if: { temper: 'proud' }, text: ['We\'d not put up with that sort of thing here.'] },
    { if: { temper: 'ornery' }, text: ['Foreign weather. Typical. Always showing off.'] },
    { if: { temper: 'dreamy' }, text: ['I\'d love to see weather like that. Just once. Then come home.'] },
    { if: { temper: 'gloomy' }, text: ['And we think we have it bad. ...We do have it bad, mind.'] },
    { if: { stage: 'child' }, text: ['Is that TRUE? Did you see it? With your own eyes?', 'Can you take me? When I\'m bigger?'] },
    { if: { stage: 'elder' }, text: ['My grandfather saw it rain fish once. Or said he did. He was a fisher.'] },
    { if: { rift: true }, text: ['Back home it rained neon once. A sign broke. Everyone glowed for a week.'] },
  ]);
  lines('season.weather.tale', [
    { text: ['Wolves in hats? What sort of hats?', 'You\'ll be telling me they knitted them.'] },
    { if: { stage: 'child' }, text: ['WHAT kind of hats? Pointy ones? Like yours?'] },
    { if: { temper: 'witty' }, text: ['Hats. On wolves. Next you\'ll say they tipped them.'] },
    { if: { temper: 'ornery' }, text: ['Wolves don\'t wear hats. ...Do they?'] },
  ]);
  lines('season.weather.hats', [
    { text: ['Earflaps! Ha! I\'ll never look at a wolf the same way.', 'A patient witch. She\'d have to be.'] },
    { if: { stage: 'child' }, text: ['I\'m going to knit a hat for the dog. With EARFLAPS.'] },
    { if: { pastime: 'knitting' }, pri: 1, text: ['Earflaps on a wolf! I\'d want to see the pattern for that.'] },
  ]);
  lines('season.weather.proud', [
    { text: ['That\'s right. Best sky in the world, and it\'s ours.', 'Ha! You\'re a Thistledown wizard now, whether you like it or not.'] },
    { if: { temper: 'proud' }, text: ['Quite right. I\'ve always said so.'] },
    { if: { temper: 'ornery' }, text: ['It\'s a sky. It\'ll do. Don\'t tell it I said that.'] },
    { if: { rift: true }, text: ['It is, isn\'t it? I didn\'t know skies could be this good.'] },
  ]);

  // --- The season itself -----------------------------------------------------------------
  addThread({
    id: 'season.season', cool: 3, weight: 1,
    label: (F) => `What's the best of ${F.season || 'the season'}?`,
    rel: (F) => (F.seasonDay === 1 ? 1.4 : 1),
    open: { ask: 'season.season.open' },
    beats: {
      start: { line: 'season.season.start', go: [
        { ap: 'ask', say: 'And the work? What does {season} ask of you?', to: 'work' },
        { ap: 'share', say: 'season.season.road', label: 'Tell them how {season} is on the road', to: 'road' },
        { ap: 'ask', say: 'Is it your favourite time of year?', to: 'fav' },
      ] },
      work: { line: 'season.season.work', go: [
        { ap: 'warm', say: 'Hard work, that. The valley\'s lucky to have you.', to: 'hard' },
        { ap: 'jest', say: 'And how much of it do you get out of?', to: 'shirk' },
        { ap: 'ask', say: 'Who taught you the knack of it?', to: 'taught', need: { open: 1 }, soft: true },
      ] },
      road: { line: 'season.season.roadback', go: [
        { ap: 'warm', say: 'It\'s nothing to {season} here, though.', to: 'home' },
        { ap: 'ask', say: 'Have you ever been away from the valley at this time of year?', to: 'away' },
      ] },
      fav: { line: 'season.season.fav', go: [
        { ap: 'ask', say: 'Why {favSeason}?', to: 'why', need: { if: { favSeason: (s, F) => s !== F.season } } },
        { ap: 'ask', say: 'What is it about {season}, then?', to: 'why', need: { if: { favSeason: (s, F) => s === F.season } } },
        { ap: 'jest', say: 'Wrong answer. The right answer is "whichever has the most meals".', to: 'meals' },
        { ap: 'listen', say: '*You puff your pipe, and let them think.*', label: 'Let them think', to: 'miss', need: { open: 1 }, soft: true },
      ] },
      why: { line: 'season.season.why', fx: { learn: ['season.fav', '{Name} loves {favSeason} best of all the seasons'] }, go: [
        { ap: 'warm', say: 'Then I hope it comes round quickly.', to: 'end' },
        { ap: 'share', say: 'Mine\'s the first day of any season. Everything still to come.', to: 'shared' },
        { ap: 'ask', say: 'And what do you miss most, the rest of the year?', to: 'miss' },
      ] },
      meals: { line: 'season.season.meals', go: [
        { ap: 'jest', say: 'Then {season} it is. Five meals and a picnic.', to: 'end' },
        { ap: 'ask', say: 'And the best meal of the whole year?', to: 'feast' },
      ] },
      feast: { line: 'season.season.feast', fx: { learn: ['season.food', '{Name} would call a plate of {seasonFavFood} a feast'] }, end: true },
      miss: { line: 'season.season.miss', fx: { open: 1 }, go: [
        { ap: 'warm', say: 'It\'ll come round again. It always does.', to: 'end' },
        { ap: 'ask', say: 'Was it always so? When you were young?', to: 'old', need: { open: 2 }, soft: true },
        { ap: 'comfort', say: 'Some things only come once. That\'s why we remember them.', to: 'once', need: { if: { stage: ['grown', 'elder'] } } },
      ] },
      old: { line: 'season.season.old', fx: { trust: 0.03, remember: 'Told the wizard how the seasons were when I was young.', rv: 1 }, go: [
        { ap: 'listen', say: '*You nod slowly, and say nothing.*', label: 'Nod, and say nothing', to: 'end', fx: { trust: 0.02 } },
        { ap: 'warm', say: 'I\'d have liked to see that.', to: 'end', fx: { fond: 0.02 } },
      ] },
      once: { line: 'season.season.once', fx: { trust: 0.03 }, end: true },
      hard: { line: 'season.season.hard', fx: { fond: 0.02 }, end: true },
      shirk: { line: 'season.season.shirk', go: [
        { ap: 'jest', say: 'Your secret\'s safe. Mostly.', to: 'end', fx: { joke: { k: 'season.shirk', t: 'The wizard knows how much work they really get out of.' } } },
        { ap: 'warm', say: 'I only tease. I\'ve seen you at it.', to: 'end' },
      ] },
      taught: { line: 'season.season.taught', fx: { trust: 0.02 }, end: true },
      home: { line: 'season.season.home', end: true },
      away: { line: 'season.season.away', end: true },
      shared: { line: 'season.season.shared', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.season.open', [
    { text: ['What\'s the best of {season} for you, {name}?', 'Tell me, {name}: what does {season} mean, in Thistledown?'] },
    { if: { seasonDay: 1 }, text: ['{Season} again, {name}! What are you looking forward to?', 'The first day of {season}, {name}. What\'s it to be?'] },
    { if: { stage: 'child' }, text: ['What\'s the best thing about {season}, {name}?', 'What do children do in {season}, {name}? I forget.'] },
  ]);
  lines('season.season.start', [
    { text: ['Oh, everything. The smell of it, mostly.', 'The light. It\'s different every season, the light.'] },
    { if: { season: 'spring' }, text: ['The blossom on the apple trees. And lambs. And not being cold.', 'Everything coming up green. The first lettuce. The first sit in the sun.', 'Spring cleaning. Don\'t laugh. Throwing open every round window at once.'] },
    { if: { season: 'summer' }, text: ['Long evenings. Supper outside and nobody wanting to go in.', 'Strawberries, swimming, and sleeping with the window open.', 'The hay! The smell of it. And sitting on top of the cart on the way home.'] },
    { if: { season: 'autumn' }, text: ['Mushrooms! And apples. And mushrooms.', 'The woods going copper. Conkers. Fires lit again in the evenings.', 'The harvest coming in, and every larder filling up.'] },
    { if: { season: 'winter' }, text: ['The fire. Feet up. Nobody expecting anything of you.', 'Yule! And snow, and mulled ale, and the long evenings.', 'Toast. Winter is mostly toast, if you do it right.'] },
    { if: { temper: 'ornery', season: 'spring' }, text: ['Best of spring? Mud. Lambs bleating all night. You can keep it.'] },
    { if: { temper: 'ornery', season: 'summer' }, text: ['Summer? Flies. Wasps in the jam. Children everywhere.'] },
    { if: { temper: 'ornery', season: 'autumn' }, text: ['Autumn\'s all right. Leaves on the path, mind. Every year. Every leaf.'] },
    { if: { temper: 'ornery', season: 'winter' }, text: ['Winter. Cold feet and other people\'s coughs.'] },
    { if: { temper: 'cheerful', season: 'spring' }, text: ['Everything! The birds are back, the lambs are out, and so am I!'] },
    { if: { temper: 'cheerful', season: 'summer' }, text: ['Summer\'s one long party, isn\'t it? I love every day of it.'] },
    { if: { temper: 'cheerful', season: 'autumn' }, text: ['Harvest! Full larders and full bellies. What\'s not to love?'] },
    { if: { temper: 'cheerful', season: 'winter' }, text: ['Snowball fights and hot pies. Winter\'s a treat, really.'] },
    { if: { temper: 'dreamy', season: 'spring' }, text: ['Spring feels like a promise, doesn\'t it? Like the year\'s saying "this time".'] },
    { if: { temper: 'dreamy', season: 'summer' }, text: ['The nights that hardly get dark. You can hear the river all the way up the hill.'] },
    { if: { temper: 'dreamy', season: 'autumn' }, text: ['Autumn\'s the year remembering. Everything golden and a bit sad.'] },
    { if: { temper: 'dreamy', season: 'winter' }, text: ['The quiet. Snow eats every sound. You can hear yourself think.'] },
    { if: { temper: 'gloomy', season: 'spring' }, text: ['Spring. Everyone so cheerful. It\'s exhausting.'] },
    { if: { temper: 'gloomy', season: 'winter' }, text: ['Winter suits me. Nobody expects you to smile in winter.'] },
    { if: { temper: 'gloomy' }, text: ['Best? It\'ll be over soon. That\'s the best and the worst of it.'] },
    { if: { temper: 'witty', season: 'summer' }, text: ['Summer\'s when everyone remembers they own legs.'] },
    { if: { temper: 'witty', season: 'winter' }, text: ['Winter\'s the one season with an excuse for everything. "It\'s cold."'] },
    { if: { temper: 'witty', season: 'autumn' }, text: ['Autumn\'s when the trees take their clothes off and we all put ours on.'] },
    { if: { temper: 'witty', season: 'spring' }, text: ['Spring is the year\'s second breakfast. Not essential, but who\'d skip it?'] },
    { if: { temper: 'proud' }, text: ['{Season} in Thistledown? Finest in the Shire. Ask anyone. Ask me.'] },
    { if: { temper: 'shy' }, text: ['...I like {season}. It\'s quiet. Well, quieter.'] },
    { if: { temper: 'curious' }, text: ['Everything changes, that\'s the best of it. I keep a list of what turns up first.'] },
    { if: { stage: 'child', season: 'summer' }, text: ['NO SCHOOL. And swimming. And staying up late!'] },
    { if: { stage: 'child', season: 'winter' }, text: ['SNOW. And presents. And the bonfire. And SNOW.'] },
    { if: { stage: 'child', season: 'autumn' }, text: ['Conkers! I\'ve got a fourteener. It\'s beaten everyone.'] },
    { if: { stage: 'child', season: 'spring' }, text: ['Baby lambs! And frogspawn! I\'ve got a jar of it under my bed.'] },
    { if: { stage: 'elder' }, text: ['At my age? That I\'m here to see another one. Everything else is gravy.'] },
    { if: { rift: true }, text: ['Seasons! Back home it was the same every day. Same heat, same rain, same neon.', 'The way the whole world changes colour. Nobody had to program it.'] },
    { if: { job: 'farmer', season: 'spring' }, text: ['Sowing. The first furrow of the year. Nothing like it.'] },
    { if: { job: 'orchardist', season: 'spring' }, text: ['Blossom. A whole orchard of it. I walk through it slow, like a bride.'] },
    { if: { job: 'fisher', season: 'summer' }, text: ['The evening rise. Fish jumping all down the river, gold in the sun.'] },
    { if: { job: 'brewer', season: 'autumn' }, text: ['New barley. New ale. The first taste of the year\'s brew.'] },
    { if: { job: 'baker', season: 'winter' }, text: ['Yule baking. The whole lane smells of my oven.'] },
    { if: { job: 'herder', season: 'spring' }, text: ['Lambing. No sleep for a week, and then a field full of bouncing.'] },
  ]);
  lines('season.season.road', [
    { text: ['On the road, {season} just means a different sort of puddle.', 'Out there, {season}\'s mostly about where you sleep.'] },
    { if: { season: 'winter' }, text: ['On the road, winter means a barn if you\'re lucky and a hedge if you\'re not.'] },
    { if: { season: 'summer' }, text: ['On the road in summer you sleep under the stars and wake up covered in dew and beetles.'] },
    { if: { season: 'spring' }, text: ['On the road in spring every river\'s too full to ford. I\'ve swum a few.'] },
    { if: { season: 'autumn' }, text: ['On the road in autumn I live on blackberries and whatever falls on my hat.'] },
  ]);
  lines('season.season.roadback', [
    { text: ['And you choose that? Over a hole with a fire?', 'Well, I never. The life you lead.'] },
    { if: { season: 'winter' }, text: ['A wizard in a hedge. Well, I never. In winter!'] },
    { if: { season: 'spring' }, text: ['Swum them! In your robes? No wonder you look so weathered.'] },
    { if: { season: 'autumn' }, text: ['Blackberries and whatever falls on your hat. That explains a lot about the hat.'] },
    { if: { temper: 'cheerful' }, text: ['Then you\'d best stay here a while and be comfortable!'] },
    { if: { temper: 'curious' }, text: ['What\'s the strangest place you\'ve ever slept? Go on.'] },
    { if: { temper: 'ornery' }, text: ['Your own fault. Nobody makes you wander.'] },
    { if: { temper: 'dreamy' }, text: ['I\'d like that, once. Waking somewhere I\'d never been.'] },
    { if: { temper: 'witty', season: 'summer' }, text: ['Beetles. That explains the hat.'] },
    { if: { temper: 'witty' }, text: ['You make it sound like a holiday. It sounds like a cold.'] },
    { if: { temper: 'gloomy' }, text: ['Sounds cold. Most things are, in the end.'] },
    { if: { stage: 'child', season: 'summer' }, text: ['Beetles? On your FACE? Can I come next time?'] },
    { if: { stage: 'child' }, text: ['Can I come next time? I\'ll carry the kettle.'] },
    { if: { rift: true }, text: ['I slept in an alley under a noodle sign for a year. Hedges sound nice.'] },
  ]);
  lines('season.season.home', [
    { text: ['Course it\'s not. Nowhere\'s like here.', 'There\'s no {season} like a Thistledown {season}.'] },
    { if: { temper: 'proud' }, text: ['Quite right. The rest of the world has a lot to learn.'] },
    { if: { temper: 'ornery' }, text: ['Flattery. Still. You\'re not wrong.'] },
  ]);
  lines('season.season.away', [
    { text: ['Me? Never past the bridge, hardly. Never wanted to.', 'Once. I went to Bree for a funeral. It rained. I came home.'] },
    { if: { temper: 'dreamy' }, text: ['Not yet. One day. I\'d like to see a {season} somewhere else, just to know.'] },
    { if: { rift: true }, text: ['Away? I\'m nothing but away. This is the first {season} I\'ve ever had.'] },
    { if: { stage: 'child' }, text: ['I went to the other side of the river once! On my own!'] },
  ]);
  lines('season.season.work', [
    { text: ['{Season} asks for everything. It always does.', 'Same as always. More of it.'] },
    { if: { season: 'spring' }, text: ['Sowing, mending fences, and cleaning everything winter left behind.'] },
    { if: { season: 'summer' }, text: ['Weeding. Watering. Weeding again. The weeds love summer more than I do.'] },
    { if: { season: 'autumn' }, text: ['Bringing it all in, before the weather turns. And putting it all by.'] },
    { if: { season: 'winter' }, text: ['Keeping warm. Keeping fed. Chopping wood and mending what broke.'] },
    { if: { job: 'farmer', season: 'spring' }, text: ['Plough, harrow, sow. Then watch the sky like a hawk for frost.'] },
    { if: { job: 'farmer', season: 'summer' }, text: ['Hay. Then hoeing. Then more hay. Then it\'s harvest and you wonder where summer went.'] },
    { if: { job: 'farmer', season: 'autumn' }, text: ['Harvest. Every hand in the valley in the fields, and the barley in before the rain.'] },
    { if: { job: 'farmer', season: 'winter' }, text: ['Mending tools. Planning. Looking at the fields under snow and thinking about spring.'] },
    { if: { job: 'orchardist', season: 'spring' }, text: ['Watching for frost on the blossom. One cold night can take the lot.'] },
    { if: { job: 'orchardist', season: 'autumn' }, text: ['Picking. Ladders and baskets from dawn to dusk. My arms are an inch longer.'] },
    { if: { job: 'orchardist', season: 'winter' }, text: ['Pruning. Wassailing the trees at Yule, so they\'ll bear. Don\'t laugh. It works.'] },
    { if: { job: 'fisher', season: 'winter' }, text: ['Breaking the ice at the edges. The fish go deep and slow, and so do I.'] },
    { if: { job: 'fisher', season: 'spring' }, text: ['The river\'s high and brown. Mending nets till it clears.'] },
    { if: { job: 'herder', season: 'spring' }, text: ['Lambing, calving, and no sleep. Then shearing, if I live.'] },
    { if: { job: 'herder', season: 'winter' }, text: ['Hay out twice a day, and breaking the ice on the troughs.'] },
    { if: { job: 'baker', season: 'autumn' }, text: ['Apple pies. Hundreds of apple pies. I dream in apple pie.'] },
    { if: { job: 'baker', season: 'winter' }, text: ['Yule cakes, mince pies, and the ovens on from four in the morning.'] },
    { if: { job: 'brewer', season: 'autumn' }, text: ['The new barley wants malting, and the cider apples are coming in. Busiest time of year.'] },
    { if: { job: 'brewer', season: 'winter' }, text: ['Mulled ale for Yule, and the dark winter beer. It needs watching.'] },
    { if: { job: 'woodwright', season: 'winter' }, text: ['Woodpiles. Everyone wants logs at once. My axe hasn\'t cooled since the frost.'] },
    { if: { job: 'woodwright', season: 'spring' }, text: ['Mending everything winter cracked. Gates, fences, a pig sty.'] },
    { if: { job: 'herbalist', season: 'summer' }, text: ['Gathering and drying. Every rafter hung with bunches. The house smells like a meadow.'] },
    { if: { job: 'herbalist', season: 'winter' }, text: ['Coughs and chilblains. Everybody\'s, all at once.'] },
    { if: { job: 'grower', season: 'summer' }, text: ['Topping the leaf, pinching out the flowers. It\'s fiddly. It\'s lovely.'] },
    { if: { job: 'grower', season: 'autumn' }, text: ['Hanging the leaf to cure. Rows and rows of it in the shed, going gold.'] },
    { if: { job: 'miller', season: 'autumn' }, text: ['Grinding the new barley. The mill never stops in autumn. Nor does the dust.'] },
    { if: { job: 'innkeeper', season: 'winter' }, text: ['Keeping the fire in and the ale warm. Everybody wants to be at the Badger in winter.'] },
    { if: { job: 'postie', season: 'winter' }, text: ['Yule cards. Hundreds. Every hobbit writes to every other hobbit to say "happy Yule".'] },
    { if: { job: 'storyteller', season: 'winter' }, text: ['Winter\'s my season. Long nights want long tales.'] },
    { if: { stage: 'child' }, text: ['Children don\'t work! ...Well, I fed the hens. Twice.', 'I help! I carry the little basket.'] },
    { if: { stage: 'elder' }, text: ['Not much, now. I tell the young ones they\'re doing it wrong. That\'s work.'] },
    { if: { temper: 'ornery' }, text: ['More than it asks of anyone else, I\'ll tell you that.'] },
    { if: { temper: 'proud' }, text: ['Everything. And I give it, every year, without a word of complaint.'] },
    { if: { rift: true }, text: ['I\'m still learning what work goes with which season. I keep doing autumn things in spring.'] },
  ]);
  lines('season.season.hard', [
    { text: ['Lucky? Ha. Tell that to my back.', 'That\'s kind. It doesn\'t feel like luck at the end of the day.'] },
    { if: { temper: 'proud' }, text: ['They are, aren\'t they. Somebody had to say it.'] },
    { if: { temper: 'shy' }, text: ['...Oh. Nobody says that. Thank you.'] },
    { if: { temper: 'gloomy' }, text: ['...That\'s nice of you. It\'s been a long {season}.'] },
    { if: { temper: 'ornery' }, text: ['Tell the Steward. Maybe I\'ll get an extra loaf.'] },
  ]);
  lines('season.season.shirk', [
    { text: ['How DARE you. ...About an hour a day. Don\'t tell.', 'Ha! Less than you\'d think and more than I\'d like.'] },
    { if: { temper: 'ornery' }, text: ['I never shirk. I rest strategically.'] },
    { if: { temper: 'witty' }, text: ['I don\'t get out of it. I get round it. There\'s a difference.'] },
    { if: { temper: 'proud' }, text: ['I\'ll have you know I\'ve never missed a day. ...Except Highdays. And birthdays.'] },
    { if: { stage: 'child' }, text: ['ALL of it, if I hide in the hay loft.'] },
  ]);
  lines('season.season.taught', [
    { text: ['My father. He\'d stand at the gate and sniff the air and know. I still can\'t do it.', 'Nobody, really. You get it wrong for ten years and then you get it right.'] },
    { if: { parent: (p) => !!p }, text: ['{Parent}. Patient as a stone, and twice as stubborn about doing it the right way.'] },
    { if: { stage: 'elder' }, text: ['An old hobbit, long gone. I tell the young ones what she told me. Word for word.'] },
    { if: { rift: true }, text: ['The hill-folk, a bit at a time. They laugh when I get it wrong. Kindly, mostly.'] },
  ]);
  lines('season.season.fav', [
    { text: ['My favourite\'s {favSeason}. Always has been.', 'Honestly? {FavSeason}. Don\'t tell {season}.'] },
    { if: { favSeason: (s, F) => s === F.season }, text: ['This one! {Season}. I\'ve been waiting all year.', 'It is. {Season}\'s mine. I\'d keep it all year if I could.'] },
    { if: { temper: 'ornery' }, text: ['{FavSeason}. The least bad of them.'] },
    { if: { temper: 'dreamy' }, text: ['{FavSeason}. I think I was born a {favSeason} sort of hobbit.'] },
    { if: { temper: 'shy' }, text: ['...{FavSeason}. Is that silly?'] },
    { if: { stage: 'child' }, text: ['{FavSeason}! No, all of them! No, {favSeason}!'] },
  ]);
  lines('season.season.why', [
    { text: ['I don\'t know. It just feels like mine.', 'It\'s the smell of it. You can\'t explain a smell.'] },
    { if: { favSeason: 'spring' }, text: ['Because everything starts again. Even me.', 'Blossom and lambs and the first warm stone to sit on.'] },
    { if: { favSeason: 'summer' }, text: ['Because the days don\'t end. You can do everything and still have evening left.', 'Bare feet on warm grass. That\'s all. That\'s enough.'] },
    { if: { favSeason: 'autumn' }, text: ['Full larders and woodsmoke. The year at its richest.', 'Because it\'s a little bit sad and a lot beautiful. Like a good song.'] },
    { if: { favSeason: 'winter' }, text: ['Because it\'s the season for being at home. And I love home.', 'The fire, the snow, the long evenings, and Yule at the end of it all.'] },
    { if: { temper: 'witty', favSeason: 'winter' }, text: ['It\'s the only season where staying in bed is common sense.'] },
    { if: { temper: 'witty', favSeason: 'summer' }, text: ['Summer\'s the only time the river\'s warm enough to fall in properly.'] },
    { if: { temper: 'dreamy', favSeason: 'autumn' }, text: ['Autumn smells like stories. Every leaf\'s got one.'] },
    { if: { temper: 'cheerful', favSeason: 'spring' }, text: ['It\'s the cheerfullest season! Everything\'s just so glad to be here!'] },
    { if: { temper: 'gloomy', favSeason: 'winter' }, text: ['Everyone\'s as grey as me in winter. It\'s restful.'] },
    { if: { stage: 'child', favSeason: 'winter' }, text: ['Because PRESENTS. And snow. Mostly presents.'] },
    { if: { stage: 'child', favSeason: 'summer' }, text: ['Because swimming! And no bedtime till it\'s dark, and it\'s never dark!'] },
    { if: { rift: true }, text: ['I\'ve only had a few of them. But that one felt like the city, a bit. In a good way.'] },
  ]);
  lines('season.season.meals', [
    { text: ['Ha! Then they\'re all the same. Six a day, every season.', 'Most meals? That\'s Yule. No, the Harvest. No, Yule.'] },
    { if: { temper: 'witty' }, text: ['Every season\'s got the same number of meals. The trick is making them bigger.'] },
    { if: { temper: 'ornery' }, text: ['Don\'t be daft. ...Autumn. Obviously autumn.'] },
    { if: { stage: 'child' }, text: ['Yule! There\'s a pudding with a COIN in it!'] },
  ]);
  lines('season.season.feast', [
    { text: ['The Harvest Feast. Long tables, and pie till you can\'t stand.', 'Yule supper. Everybody you love round one table.'] },
    { if: { seasonFavFood: (f) => !!f }, text: ['Anything with {seasonFavFood}. Any season. Any meal.', 'Give me a plate of {seasonFavFood} and I\'ll call it a feast.'] },
    { if: { stage: 'child' }, text: ['Pudding. Any pudding. The biggest pudding.'] },
    { if: { temper: 'dreamy' }, text: ['A picnic on Midsummer evening, with the sun not wanting to go down.'] },
  ]);
  lines('season.season.miss', [
    { text: ['The other seasons. Whichever one it isn\'t. I\'m contrary.', 'I miss the light in the evenings, when it\'s gone.'] },
    { if: { season: 'winter' }, text: ['I miss green. Just green. Anything green.', 'The smell of cut grass. I\'d give a ham for it, in winter.'] },
    { if: { season: 'summer' }, text: ['I miss the fire. Isn\'t that silly? Sweltering, and I miss the fire.'] },
    { if: { season: 'spring' }, text: ['I miss the snow, a little. Everything was so clean.'] },
    { if: { season: 'autumn' }, text: ['I miss the long evenings already. They go so fast.'] },
    { if: { temper: 'dreamy' }, text: ['I miss how things were before I knew they\'d change.'] },
    { if: { temper: 'gloomy' }, text: ['I miss everything. Even things I\'ve got.'] },
    { if: { stage: 'elder' }, text: ['I miss the ones who used to share it with me. Every season, a few more gone.'] },
    { if: { rift: true }, text: ['I miss... I miss nothing changing. Isn\'t that strange? It was simpler.'] },
    { if: { stage: 'child' }, text: ['I miss my birthday. It was ages ago. Days ago!'] },
  ]);
  lines('season.season.old', [
    { text: ['Winters were longer. Summers were hotter. Everything was more, and I was less.', 'The snow came up to the windows. We walked to school on the hedge tops.'] },
    { if: { stage: 'elder' }, text: ['The old Harvest Feast went on three days. My grandmother danced on the table at ninety.', 'We had no Founders\' Day then. There was nothing founded. Just a few of us and the river.'] },
    { if: { stage: 'child' }, text: ['When I was young? I AM young. ...When I was littler, I was scared of the snow.'] },
    { if: { temper: 'dreamy' }, text: ['Everything was brighter. Or I was. I can\'t tell anymore.'] },
    { if: { temper: 'ornery' }, text: ['Better. Everything was better. And we didn\'t complain about it, either.'] },
    { if: { rift: true }, text: ['When I was young there were no seasons. Just the power cuts. We\'d count those instead.'] },
  ]);
  lines('season.season.once', [
    { text: ['...Yes. That\'s it exactly. Thank you.', 'I\'d not thought of it that way. That helps.'] },
    { if: { temper: 'gloomy' }, text: ['...That\'s the kindest sad thing anyone\'s said to me.'] },
    { if: { temper: 'proud' }, text: ['Hmph. Yes. Well. Wise, for a wizard.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Don\'t go making me misty-eyed in the lane.'] },
  ]);
  lines('season.season.shared', [
    { text: ['The first day! I like that. Everything still to come.', 'Ha! A wizard who likes beginnings. That figures.'] },
    { if: { temper: 'dreamy' }, text: ['Oh, that\'s lovely. I\'ll think of that tomorrow morning.'] },
    { if: { temper: 'witty' }, text: ['The first day of a season. Clever. That\'s four favourites.'] },
  ]);

  // --- The season's trial: flood, drought, blight, frost -------------------------------
  addThread({
    id: 'season.hazard', cool: 1, weight: 1.6,
    label: (F) => (F.hazardWord ? `This ${F.hazardWord}` : 'The trouble with the weather'),
    when: (F) => !!F.hazard && F.stage !== 'child' || (!!F.hazard && F.band === 'youth'),
    rel: (F) => (F.hazardOn ? 1.8 : 1.4),
    open: { ask: 'season.hazard.open' },
    beats: {
      start: { line: 'season.hazard.start', go: [
        { ap: 'comfort', say: 'Whatever comes, the village will see it through together.', to: 'comfort' },
        { ap: 'advise', say: 'season.hazard.tip', label: 'Tell them what would help', to: 'advise' },
        { ap: 'ask', say: 'Have you seen one like this before?', to: 'past' },
      ] },
      comfort: { line: 'season.hazard.comforted', go: [
        { ap: 'listen', say: '*You say nothing, and let them go on.*', label: 'Let them go on', to: 'fear' },
        { ap: 'warm', say: 'And you\'ll not be on your own. I\'ll see to that.', to: 'promise' },
      ] },
      advise: { line: 'season.hazard.advised', go: [
        { ap: 'ask', say: 'And what will you do, yourself?', to: 'plan' },
        { ap: 'jest', say: 'Or we could all move into the Badger till it\'s over.', to: 'badger' },
        { ap: 'warm', say: 'You\'ll manage. You always do.', to: 'end' },
      ] },
      past: { line: 'season.hazard.past', go: [
        { ap: 'ask', say: 'And how did the valley get through it?', to: 'through' },
        { ap: 'listen', say: '*You wait for the rest.*', label: 'Wait for the rest', to: 'fear', need: { open: 1 }, soft: true },
      ] },
      through: { line: 'season.hazard.through', go: [
        { ap: 'warm', say: 'Then you\'ll do it again. The valley\'s the same valley.', to: 'end', fx: { feel: 'weathered' } },
        { ap: 'ask', say: 'And what will you do this time?', to: 'plan' },
      ] },
      fear: { line: 'season.hazard.fear', fx: { confide: { k: 'season.fear', t: '{Name} is afraid of what the {hazardWord} will take' }, open: 1 }, go: [
        { ap: 'comfort', say: 'Then we\'ll make sure it doesn\'t come to that.', to: 'promise' },
        { ap: 'share', say: 'I\'ve lost things to weather too. You do go on.', to: 'shared' },
      ] },
      promise: { line: 'season.hazard.promise', fx: { trust: 0.03, fond: 0.02, hook: 'season.hazard' }, end: true },
      shared: { line: 'season.hazard.shared', fx: { trust: 0.04 }, end: true },
      plan: { line: 'season.hazard.plan', fx: { respect: 0.02 }, go: [
        { ap: 'warm', say: 'Good. That\'s just the thing.', to: 'end' },
        { ap: 'advise', say: 'And look in on your neighbours, while you\'re at it.', to: 'neighbours' },
      ] },
      neighbours: { line: 'season.hazard.neighbours', fx: { respect: 0.02, drive: { lonely: -0.05 } }, end: true },
      badger: { line: 'season.hazard.badger', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('season.hazard.open', [
    { text: ['How are you faring with this {hazardWord}, {name}?', 'This {hazardWord}, {name}. Is it troubling you?'] },
    { if: { hazardSoon: true }, text: ['They say there\'s a {hazardWord} coming, {name}. Are you ready for it?', 'You\'ll have heard about the {hazardWord}, {name}?'] },
  ]);
  lines('season.hazard.start', [
    { text: ['It\'s a worry. I won\'t pretend it isn\'t.', 'We\'ll manage. We always manage. But I don\'t like it.'] },
    { if: { hazard: 'flood', hazardSoon: true }, text: ['The river\'s brown and fat and grumbling. I\'ve moved the hens up the hill.', 'Did you see the water? It\'s up past the old willow\'s knees.'] },
    { if: { hazard: 'flood', hazardOn: true }, text: ['The meadows are a lake. There\'s a duck swimming where my beans were.', 'The water came up in the night. You could row a boat to the mill.'] },
    { if: { hazard: 'drought', hazardSoon: true }, text: ['Not a cloud for days, and the well\'s rope is getting longer.', 'The ground\'s going hard. You can hear it crack if you listen.'] },
    { if: { hazard: 'drought', hazardOn: true }, text: ['Dust everywhere. In the bread, in the bed, in my teeth.', 'The barley\'s wilting. I carry water till my arms give out, and it drinks it like nothing.'] },
    { if: { hazard: 'blight', hazardSoon: true }, text: ['The farmers are muttering about the barley. Spots on the leaves.', 'Blight, they say. It goes through a field like gossip through a wedding.'] },
    { if: { hazard: 'blight', hazardOn: true }, text: ['The blight\'s in the barley. You can smell it. Sour, like old dishcloths.', 'A whole field gone grey. Poor barley. Poor us, come winter.'] },
    { if: { hazard: 'frost', hazardSoon: true }, text: ['The air\'s got teeth in it. There\'s a hard frost coming, sure as eggs.', 'Clear sky and a bite in the wind. Frost tonight, and a hard one.'] },
    { if: { hazard: 'frost', hazardOn: true }, text: ['Everything\'s white and stiff. The washing froze on the line like boards.', 'The woodpile\'s going down like ale at a wedding. Two fires a day just to stay warm.'] },
    { if: { temper: 'ornery' }, text: ['Every year something. If it\'s not one thing it\'s the weather.', 'Nobody listens till it\'s at the door. I said this would happen.'] },
    { if: { temper: 'gloomy' }, text: ['It\'ll be bad. It always is. And then it\'ll be worse.'] },
    { if: { temper: 'cheerful' }, text: ['We\'ve had worse! ...Have we? We must have.'] },
    { if: { temper: 'shy' }, text: ['...I\'m a bit frightened, to be honest.'] },
    { if: { temper: 'proud' }, text: ['My family\'s seen off a dozen of these. I\'m not worried. Much.'] },
    { if: { temper: 'curious' }, text: ['Why does it come now, do you think? Is there a pattern to it?'] },
    { if: { temper: 'dreamy' }, text: ['The land has moods, like we do. This is one of its bad days.'] },
    { if: { temper: 'witty' }, text: ['Ah, the season\'s little surprise. It never forgets to bring one.'] },
    { if: { stage: 'elder' }, text: ['I\'ve seen a good few of these. Doesn\'t make the next one easier.'] },
    { if: { stage: 'child' }, text: ['Mum keeps looking at the sky and not saying anything. Is it bad?', 'Is it going to be a big one? Will our house be all right?'] },
    { if: { rift: true }, text: ['Back home the weather was all inside the domes. Out here it\'s... real. It can hurt you.'] },
    { if: { job: 'farmer', hazard: ['flood', 'drought', 'blight'] }, pri: 1, text: ['It\'s my fields. My barley. A whole year\'s work and the sky can take it in a night.'] },
    { if: { job: 'woodwright', hazard: 'frost' }, pri: 1, text: ['Everyone wants logs and I\'ve only two arms. The woodpile won\'t last at this rate.'] },
    { if: { job: 'herbalist', hazard: 'blight' }, pri: 1, text: ['They\'ll be wanting my herbs for the barley. I\'ve been drying for days.'] },
    { if: { job: 'fisher', hazard: 'flood' }, pri: 1, text: ['The river\'s too wild to fish. And my boat\'s somewhere in a field.'] },
  ]);
  lines('season.hazard.tip', [
    { text: ['Stick together, and share what you\'ve got. That\'s always the answer.'] },
    { if: { hazard: 'flood' }, text: ['Raise the banks along the river. Earth holds back water better than worry does.'] },
    { if: { hazard: 'drought' }, text: ['Dig a pond near the fields, or a well. Water close to the crops is what saves them.'] },
    { if: { hazard: 'blight' }, text: ['Get the herbalist to the barley quick. Herbs will clear it, or dwarf sulphur.'] },
    { if: { hazard: 'frost' }, text: ['Fill the woodpile now, while you can. Every hearth will burn twice as much.'] },
  ]);
  lines('season.hazard.comforted', [
    { text: ['Together. Yes. You\'re right. It\'s easier together.', 'That\'s true. Nobody\'s ever left on their own here.'] },
    { if: { temper: 'gloomy' }, text: ['...Maybe. Maybe it won\'t be as bad. Maybe.'] },
    { if: { temper: 'ornery' }, text: ['Together. Hmph. Some of them are no use at all. ...Most are all right.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. That helps. A bit.'] },
    { if: { temper: 'proud' }, text: ['I don\'t need comforting. ...But it\'s kind of you.'] },
    { if: { stage: 'child' }, text: ['Together. Like when everyone helped with the hay. Yes.'] },
    { if: { temper: 'cheerful' }, text: ['Course we will! There\'ll be a party after. There always is.'] },
  ]);
  lines('season.hazard.advised', [
    { text: ['That\'s sense. I\'ll say so at the Badger.', 'Right. Yes. Somebody should tell the Steward.'] },
    { if: { hazard: 'flood' }, text: ['Banks. Of course. My grandfather built one, once. It\'s still there, under the brambles.'] },
    { if: { hazard: 'drought' }, text: ['A pond by the fields. Why didn\'t we think of that years ago?'] },
    { if: { hazard: 'blight' }, text: ['Herbs on the barley. I\'ll go and bang on the herbalist\'s door.'] },
    { if: { hazard: 'frost' }, text: ['The woodpile. Yes. Everyone always leaves it till it\'s too late.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I know what\'s needed, thank you. ...But yes. That.'] },
    { if: { temper: 'curious' }, text: ['Why does that work? No, tell me later. I\'ll go and do it.'] },
    { if: { temper: 'gloomy' }, text: ['If it\'s not too late. It\'s usually too late.'] },
    { if: { stage: 'child' }, text: ['I\'ll tell Dad! He\'ll know what to do with it. I\'ll help!'] },
  ]);
  lines('season.hazard.past', [
    { text: ['Once or twice. You don\'t forget them.', 'Every few years. The land\'s got a long memory and a short temper.'] },
    { if: { hazard: 'flood' }, text: ['The great flood when I was a youngster. The mill wheel came off and floated to the bridge.'] },
    { if: { hazard: 'drought' }, text: ['The dry summer. We carried water from the river in every pot and kettle in the valley.'] },
    { if: { hazard: 'blight' }, text: ['The black barley year. We ate turnips till we were sick of the sight of them.'] },
    { if: { hazard: 'frost' }, text: ['The winter the ink froze in the pot. Nobody wrote a letter for a month.'] },
    { if: { stage: 'elder' }, pri: 1, text: ['More than I can count. They blur together now. But I remember the first.'] },
    { if: { rift: true }, pri: 1, text: ['Never. Not like this. I\'m learning as I go.'] },
    { if: { firstYear: true }, text: ['Not here. The valley\'s new to us. We\'re learning its tempers.'] },
  ]);
  lines('season.hazard.through', [
    { text: ['Everyone mucked in. That\'s how. Nobody asked, they just came.', 'We shared out the jars, and the young ones carried for the old ones.'] },
    { if: { stage: 'elder' }, text: ['Same as always. The strong carried the weak and nobody kept count.'] },
    { if: { temper: 'cheerful' }, text: ['With a party at the end! There\'s always a party at the end.'] },
    { if: { temper: 'gloomy' }, text: ['Barely. We got through it barely.'] },
    { if: { temper: 'witty' }, text: ['Complaining, mostly. Then working. Then complaining about the work.'] },
  ]);
  lines('season.hazard.fear', [
    { text: ['...If it takes the garden, I don\'t know what I\'ll do. It\'s all I\'ve got that\'s mine.', 'It\'s not me. It\'s the little ones. What if there\'s not enough, come winter?'] },
    { if: { hazard: 'flood' }, text: ['My hole\'s low. By the water. If it comes in, everything I own goes soggy. Everything.'] },
    { if: { hazard: 'frost' }, text: ['I\'m frightened of the cold. Since I was small. Silly, at my age.'] },
    { if: { hazard: 'drought' }, text: ['If the well runs dry, what then? Where does water come from, when it doesn\'t?'] },
    { if: { kid: (k) => !!k }, pri: 1, text: ['It\'s {kid}. {Kid} needs feeding whatever the sky does. What if I can\'t?'] },
    { if: { stage: 'child' }, text: ['...What if the hens get washed away? I love the hens. Even the cross one.'] },
    { if: { stage: 'elder' }, text: ['I\'m not as quick as I was. If it comes in the night, I might not be quick enough.'] },
    { if: { rift: true }, text: ['I lost everything once already. I don\'t think I could do it twice.'] },
    { if: { jarsWord: 'bare' }, pri: 1, text: ['Our shelves are bare. If the crops go, we\'ve nothing put by. Nothing.'] },
  ]);
  lines('season.hazard.promise', [
    { text: ['...You will? Then I\'ll stop worrying. Well. Worry less.', 'That\'s a weight off. Thank you, wizard.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. A wizard\'s word. I\'ll hold you to it.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. Really.'] },
    { if: { temper: 'gloomy' }, text: ['...I\'ll try to believe that.'] },
    { if: { temper: 'proud' }, text: ['I can see to myself. But. Thank you.'] },
  ]);
  lines('season.hazard.shared', [
    { text: ['You? What did you lose?', '...I never think of wizards losing things.'] },
    { if: { temper: 'curious' }, text: ['What was it? No. You don\'t have to say. But thank you.'] },
    { if: { temper: 'gloomy' }, text: ['You go on. Yes. I suppose you do. Somehow.'] },
  ]);
  lines('season.hazard.plan', [
    { text: ['Help where I can. Carry what needs carrying.', 'Do what the Steward says, mostly, and grumble while I do it.'] },
    { if: { hazard: 'flood' }, text: ['Move everything up off the floor. Hens up the hill. Then wait.'] },
    { if: { hazard: 'drought' }, text: ['Carry water. Morning and evening. Every can I own.'] },
    { if: { hazard: 'blight' }, text: ['Pull the worst stalks and burn them, so it doesn\'t spread.'] },
    { if: { hazard: 'frost' }, text: ['Stack logs, stuff the draughts with socks, and wear three jumpers.'] },
    { if: { temper: 'proud' }, text: ['Lead from the front. Somebody has to show them how.'] },
    { if: { temper: 'cheerful' }, text: ['Bake! Everyone works better with a bun in them.'] },
    { if: { temper: 'ornery' }, text: ['My own business, and make sure everyone else minds theirs.'] },
    { if: { job: 'herbalist', hazard: 'blight' }, pri: 1, text: ['Get every herb I have onto that barley, and pray it\'s enough.'] },
    { if: { job: 'woodwright', hazard: 'frost' }, pri: 1, text: ['Chop till I drop. Then get up and chop some more.'] },
  ]);
  lines('season.hazard.neighbours', [
    { text: ['I will. Old {friend} lives on their own. I\'ll take soup.', 'Yes. You\'re right. I\'ll knock on a few doors.'] },
    { if: { friend: (f) => !f }, text: ['I will. I don\'t know them all that well. Maybe this is the time.'] },
    { if: { temper: 'ornery' }, text: ['Neighbours. Hmph. Fine. Even that lot.'] },
    { if: { temper: 'shy' }, text: ['...I\'ll try. Knocking\'s the hard part.'] },
  ]);
  lines('season.hazard.badger', [
    { text: ['Ha! The innkeeper\'d never get us out again.', 'Don\'t tempt me. I\'d bring my pillow.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. ...Not the worst idea I\'ve heard this week.'] },
    { if: { job: 'innkeeper' }, pri: 1, text: ['You can all come. Pay first, mind.'] },
  ]);

  // --- The season's last day ------------------------------------------------------------
  addThread({
    id: 'season.turning', cool: 4, weight: 1.1,
    label: (F) => `${F.seasonNext ? F.seasonNext.charAt(0).toUpperCase() + F.seasonNext.slice(1) : 'The new season'} tomorrow`,
    when: (F) => !!F.seasonEnds,
    open: { warm: 'season.turning.open' },
    beats: {
      start: { line: 'season.turning.start', go: [
        { ap: 'ask', say: 'And what will you miss of {season}?', to: 'miss' },
        { ap: 'ask', say: 'What are you looking forward to, in {seasonNext}?', to: 'next' },
        { ap: 'jest', say: 'I could ask the year to wait a day. It owes me one.', to: 'wait' },
      ] },
      miss: { line: 'season.turning.miss', go: [
        { ap: 'warm', say: 'Then keep a bit of it. A leaf in a book. A jar on the shelf.', to: 'keep' },
        { ap: 'ask', say: 'What was the best day of it?', to: 'best' },
      ] },
      next: { line: 'season.turning.next', go: [
        { ap: 'ask', say: 'And is there anything you mean to do, this {seasonNext}?', to: 'resolve', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'It\'ll be a good one. I can feel it in my hat.', to: 'hat' },
      ] },
      wait: { line: 'season.turning.wait', go: [
        { ap: 'jest', say: 'Very well. I\'ll ask it for two.', to: 'end' },
        { ap: 'ask', say: 'What would you do with the extra day?', to: 'extra' },
      ] },
      extra: { line: 'season.turning.extra', fx: { learn: ['wish', '{wishText}'] }, end: true },
      keep: { line: 'season.turning.keep', fx: { fond: 0.02 }, end: true },
      best: { line: 'season.turning.best', fx: { remember: 'Told the wizard about the best day of the season.', rv: 1 }, go: [
        { ap: 'warm', say: 'Then it was a good {season}.', to: 'end' },
        { ap: 'share', say: 'Mine was this one. Talking with you.', to: 'blush', need: { fond: 0.2 }, soft: true },
      ] },
      blush: { line: 'season.turning.blush', fx: { fond: 0.03 }, end: true },
      resolve: { line: 'season.turning.resolve', fx: { confide: { k: 'season.resolve', t: '{Name} means to do something new this {seasonNext}' }, trust: 0.02 }, go: [
        { ap: 'advise', say: 'Then start on the first morning. Before you can talk yourself out of it.', to: 'advised' },
        { ap: 'warm', say: 'I\'ll ask you how it went, at the end of it.', to: 'asked' },
      ] },
      advised: { line: 'season.turning.advised', fx: { respect: 0.03 }, end: true },
      asked: { line: 'season.turning.asked', fx: { hook: 'season.resolve', fond: 0.02 }, end: true },
      hat: { line: 'season.turning.hat', end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.turning.open', [
    { text: ['The last day of {season}, {name}. Can you feel it turning?', '{SeasonNext} tomorrow, {name}. Where did {season} go?'] },
    { if: { stage: 'child' }, text: ['Tomorrow it\'ll be {seasonNext}, {name}. Did you know?'] },
  ]);
  lines('season.turning.start', [
    { text: ['Already? It only just started!', 'I know. I always feel it a day before. Something in the air.'] },
    { if: { seasonNext: 'winter' }, text: ['Winter tomorrow. I\'ve been counting logs in my sleep.', 'You can smell winter coming. Woodsmoke and cold iron.'] },
    { if: { seasonNext: 'spring' }, text: ['Spring tomorrow! I could kiss the calendar.', 'Spring. The year\'s waking up. Not a moment too soon.'] },
    { if: { seasonNext: 'summer' }, text: ['Summer tomorrow. Out with the sun-hats and the good picnic blanket.', 'Summer! Long evenings. I\'ve been looking forward to it since Yule.'] },
    { if: { seasonNext: 'autumn' }, text: ['Autumn tomorrow. I\'ll miss the long days. I won\'t miss the wasps.', 'Autumn. The year goes golden, then it goes to bed.'] },
    { if: { temper: 'gloomy' }, text: ['Another one gone. They go faster every year.'] },
    { if: { temper: 'ornery' }, text: ['Good riddance. This one was a dud.'] },
    { if: { temper: 'dreamy' }, text: ['I love the turning. The year takes a breath, just for a night.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, I love a new season! Everything new again!'] },
    { if: { temper: 'witty' }, text: ['Already? I hadn\'t finished complaining about this one.'] },
    { if: { stage: 'child' }, text: ['How do they know it\'s tomorrow? Who decides? Is it you?'] },
    { if: { stage: 'elder' }, text: ['Another turning. I\'ve seen a lot of them. I still like to sit up for it.'] },
    { if: { rift: true }, text: ['It changes overnight? Just like that? Nobody flips a switch?'] },
  ]);
  lines('season.turning.miss', [
    { text: ['The smell of it. Every season smells different at the end.', 'The light in the evenings, just as it is now.'] },
    { if: { season: 'spring' }, text: ['The blossom, falling like snow. And the lambs being small.'] },
    { if: { season: 'summer' }, text: ['Swimming. Supper on the step. The bats at dusk.'] },
    { if: { season: 'autumn' }, text: ['The mushrooms. The colours in the woods. Conkers in my pockets.'] },
    { if: { season: 'winter' }, text: ['The snow. The quiet. I know, I know. I\'ll miss it, though.'] },
    { if: { temper: 'ornery' }, text: ['Nothing. I\'ll miss nothing. ...The blackberries. Fine.'] },
    { if: { temper: 'gloomy' }, text: ['All of it. Even the bad bits. Especially the bad bits.'] },
    { if: { stage: 'child' }, text: ['My den! It\'s a summer den. It doesn\'t work in other seasons.'] },
  ]);
  lines('season.turning.keep', [
    { text: ['A leaf in a book. I might. I\'ve a book that\'s more leaves than words.', 'A jar on the shelf. That\'s what I do anyway. I just never said it out loud.'] },
    { if: { pastime: 'collecting' }, pri: 1, text: ['Ha! I keep everything. I\'ve a box for every season since I was ten.'] },
    { if: { pastime: 'painting' }, pri: 1, text: ['I\'ll paint it. That\'s how I keep things.'] },
    { if: { temper: 'dreamy' }, text: ['That\'s lovely. I\'ll do that. I\'ll do it tonight.'] },
    { if: { temper: 'witty' }, text: ['A jar of {season}. I\'ll label it. "Do not open till next year."'] },
  ]);
  lines('season.turning.best', [
    { text: ['A lazy afternoon. Nothing happened at all. It was perfect.', 'The festival. Course it was. Wouldn\'t you say?'] },
    { if: { memory: (m) => !!m, memoryGood: true }, pri: 1, text: ['That one: "{memory}" I\'ll keep that one.'] },
    { if: { spouse: (s) => !!s }, text: ['A walk with {spouse}. Just a walk. We didn\'t say much. We didn\'t need to.'] },
    { if: { stage: 'child' }, text: ['The day I found the frog with the yellow belly. I called him Wizard. After you.'] },
    { if: { fwLately: true }, pri: 1, text: ['The fireworks! The dragon! What else could it be?'] },
  ]);
  lines('season.turning.blush', [
    { text: ['Oh, go on. ...Really?', 'Get away with you. ...Mine too, maybe.'] },
    { if: { temper: 'shy' }, text: ['*goes pink to the ears*'] },
    { if: { temper: 'ornery' }, text: ['Soft old wizard. ...Hmph. It wasn\'t bad, I suppose.'] },
    { if: { temper: 'witty' }, text: ['Flatterer. Keep going.'] },
  ]);
  lines('season.turning.next', [
    { text: ['Whatever it brings. You never know, and that\'s the fun.', 'The first morning of it. The first morning of anything\'s the best.'] },
    { if: { seasonNext: 'spring' }, text: ['Mayday! The dancing round the maypole. And not being cold.'] },
    { if: { seasonNext: 'summer' }, text: ['Midsummer. The bonfire and the fireworks. You\'ll be doing those, won\'t you?'] },
    { if: { seasonNext: 'autumn' }, text: ['The Harvest Feast. And mushrooms. Mostly the feast.'] },
    { if: { seasonNext: 'winter' }, text: ['Yule. The bonfire, the carols, the presents. And a long lie-in.'] },
    { if: { temper: 'gloomy' }, text: ['Looking forward? I try not to. It only disappoints.'] },
    { if: { temper: 'dreamy' }, text: ['Something I can\'t name yet. That\'s the best thing to look forward to.'] },
    { if: { stage: 'child' }, text: ['Being BIGGER. I\'ll be bigger by {seasonNext}. Mum says.'] },
    { if: { rift: true }, text: ['Seeing what it does. I haven\'t had a {seasonNext} here before. Or ever, really.'] },
  ]);
  lines('season.turning.resolve', [
    { text: ['...I mean to learn something new. I won\'t say what. You\'ll laugh.', 'I\'m going to say yes more. To things. Don\'t ask what things.'] },
    { if: { dream: (d) => !!d }, pri: 1, text: ['I\'m going to make a start. On... you know. I\'d like to {dreamText}.'] },
    { if: { lonely: true }, text: ['I\'m going to have folk round. I never do. I\'m going to.'] },
    { if: { temper: 'shy' }, text: ['...Speak up at the Badger. Just once. Before {seasonNext}\'s out.'] },
    { if: { temper: 'ornery' }, text: ['Be nicer. Don\'t look like that. I can be nicer.'] },
    { if: { stage: 'elder' }, text: ['Write down the old songs before they go with me.'] },
  ]);
  lines('season.turning.advised', [
    { text: ['First morning. Before breakfast. ...After breakfast.', 'You\'re right. If I wait I\'ll find a reason not to.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I\'ll start when I start, thank you. ...First morning, then.'] },
  ]);
  lines('season.turning.asked', [
    { text: ['You will? Then I\'d better actually do it.', 'Now I\'ve told a wizard, I can\'t back out. Clever.'] },
    { if: { temper: 'shy' }, text: ['...All right. I\'ll try. For you to ask about.'] },
  ]);
  lines('season.turning.wait', [
    { text: ['Ha! Ask it for a week, while you\'re at it.', 'Could you? Really? No. You\'re teasing.'] },
    { if: { temper: 'witty' }, text: ['The year owes you? What did you do, lend it an hour?'] },
    { if: { stage: 'child' }, text: ['Make it wait FOREVER. Then it\'s always now.'] },
    { if: { temper: 'ornery' }, text: ['Don\'t. This one can go. I\'ll hold the door.'] },
  ]);
  lines('season.turning.extra', [
    { text: ['Nothing! A whole day of nothing. Bliss.', 'Finish all the things I meant to do. Then nap.'] },
    { if: { wish: (w) => !!w }, pri: 1, text: ['Honestly? {WishText}. I\'ve not found the day for it yet.'] },
    { if: { stage: 'child' }, text: ['Eat a whole pie. On my own. In a tree.'] },
  ]);
  lines('season.turning.hat', [
    { text: ['Your hat feels things? What else does it feel?', 'Ha! Then I\'ll trust your hat. It\'s seen more than I have.'] },
    { if: { stage: 'child' }, text: ['Can I feel your hat? Does it feel ME?'] },
  ]);

  // --- Their turn: what will the weather do? ---------------------------------------------
  addThread({
    id: 'season.forecast', theirs: true, cool: 3,
    label: 'They want to know what the weather will do',
    ask: '{Name} squints up at the sky, then at you.',
    when: (F) => F.met && (F.nextFestIn != null && F.nextFestIn <= 2 || !!F.hazard || F.weather === 'rain' || F.weather === 'cloudy'),
    beats: {
      start: { line: 'season.forecast.q', go: [
        { ap: 'tale', say: 'season.forecast.lore', label: 'Give them a bit of weather lore', to: 'lore' },
        { ap: 'jest', say: 'It will either rain or it won\'t. I\'m never wrong.', to: 'cheek' },
        { ap: 'advise', say: 'season.forecast.true', label: 'Tell them truly', to: 'truly' },
      ] },
      lore: { line: 'season.forecast.lore2', go: [
        { ap: 'jest', say: 'And if the cat sits with its back to the fire, hide the cat.', to: 'cat' },
        { ap: 'warm', say: 'Old wisdom. It\'s right more often than wizards.', to: 'end' },
      ] },
      cheek: { line: 'season.forecast.cheek', go: [
        { ap: 'warm', say: 'Very well. Fine for {nextFestWord}. On my word as a wizard.', to: 'promised', need: { if: { nextFestIn: { max: 2 }, nextFest: (k) => !!k && k !== 'founding' } } },
        { ap: 'share', say: 'Truthfully? Wizards can\'t see weather. We just say it with confidence.', to: 'honest' },
        { ap: 'jest', say: 'Fine, then. Tomorrow will be {tomorrowDay}. That much I\'ll swear to.', to: 'end' },
      ] },
      truly: { line: 'season.forecast.truly', fx: { respect: 0.03 }, go: [
        { ap: 'ask', say: 'Will you be ready for it?', to: 'ready', need: { if: { hazardSoon: true } } },
        { ap: 'warm', say: 'And if I\'m wrong, you can have my hat.', to: 'hatbet' },
      ] },
      ready: { line: 'season.forecast.ready', fx: { respect: 0.02 }, end: true },
      hatbet: { line: 'season.forecast.hatbet', fx: { joke: { k: 'season.hatbet', t: 'If the wizard\'s forecast is wrong, they get his hat.' } }, end: true },
      promised: { line: 'season.forecast.promised', fx: { run: festPromise('season.dry', 'You promised fine weather for {nextFestWord}'), fond: 0.02 }, end: true },
      honest: { line: 'season.forecast.honest', fx: { trust: 0.03 }, end: true },
      cat: { line: 'season.forecast.cat', fx: { fond: 0.02 }, end: true },
    },
  });
  lines('season.forecast.q', [
    { text: ['Will it rain tomorrow? You\'d know. You must know.', 'Go on, wizard. What\'s the sky going to do? You can tell me.'] },
    { if: { nextFestIn: { max: 2 }, nextFest: (k) => !!k }, pri: 1, text: ['Will it be fine for {nextFestWord}? It mustn\'t rain. It simply mustn\'t.', 'Is it going to rain on {nextFestWord}? Be honest. I\'ve made a whole new hat.'] },
    { if: { hazardSoon: true }, pri: 1, text: ['Is it true about the {hazardWord}? Will it really come? You\'d know.'] },
    { if: { stage: 'child' }, text: ['Will it snow tomorrow? Will it? Say yes!', 'Is it going to rain on my birthday? It\'s not my birthday. But will it?'] },
    { if: { job: 'farmer' }, text: ['I need two dry days for the hay. Two. Can you see two dry days?'] },
    { if: { temper: 'ornery' }, text: ['Well? You\'re a wizard. Earn your keep. Rain or not?'] },
    { if: { temper: 'shy' }, text: ['...Um. Do you know if it\'ll rain? Sorry. Only I\'ve washing out.'] },
    { if: { temper: 'curious' }, text: ['Can wizards really see the weather coming? How? Do you smell it?'] },
    { if: { rift: true }, text: ['Back home there was an app for this. Here there\'s you. So. Rain?'] },
  ]);
  lines('season.forecast.lore', [
    { text: ['Red sky at night, hobbit\'s delight. Red sky at morning, mind the washing.', 'When the swallows fly low, there\'s rain on the go.'] },
    { if: { season: 'winter' }, text: ['When the stars all twinkle sharp, there\'s frost before the lark.'] },
    { if: { season: 'summer' }, text: ['When the cows lie down in the field, the rain is near. Or they\'re tired.'] },
  ]);
  lines('season.forecast.lore2', [
    { text: ['My gran used to say that! The very same.', 'I\'ll look out for that tonight. I\'ll be watching the sky all evening.'] },
    { if: { temper: 'curious' }, text: ['Does it work, though? Why would it? There must be a reason under it.'] },
    { if: { temper: 'ornery' }, text: ['Old wives\' rubbish. ...I\'ll check, mind. Just in case.'] },
    { if: { stage: 'child' }, text: ['I\'ll stay up and check! Can I stay up and check?'] },
    { if: { job: 'herder', season: 'summer' }, pri: 1, text: ['The cows lie down when they please, I\'ll tell you that for nothing.'] },
  ]);
  lines('season.forecast.cat', [
    { text: ['Ha! Hide the cat. I\'ll tell that one at the Badger.', 'Our cat sits with its back to everything. We\'re doomed.'] },
    { if: { stage: 'child' }, text: ['I\'m going to hide our cat! Just in case!'] },
    { if: { temper: 'witty' }, text: ['And if the cat sits on the wizard?'] },
  ]);
  lines('season.forecast.cheek', [
    { text: ['That\'s not a forecast, that\'s a shrug with a hat on.', 'Never wrong! You\'ve never been right either.'] },
    { if: { temper: 'ornery' }, text: ['Useless. Utterly useless. Wizards.'] },
    { if: { temper: 'witty' }, text: ['Rain or not rain. Bold. I\'ll put a penny on "or".'] },
    { if: { temper: 'cheerful' }, text: ['Ha! Well, that\'s a comfort, I suppose.'] },
    { if: { stage: 'child' }, text: ['That\'s CHEATING.'] },
  ]);
  lines('season.forecast.true', [
    { text: ['Rain by evening, I think. The swallows are low and my knee agrees.'] },
    { if: { weather: 'clear' }, text: ['Fair tomorrow, I\'d say. The dew\'s heavy and the smoke goes straight up.'] },
    { if: { hazard: 'flood', hazardSoon: true }, pri: 1, text: ['The river will come over the low meadows tomorrow. Get the banks up if you can.'] },
    { if: { hazard: 'drought', hazardSoon: true }, pri: 1, text: ['No rain for days. Water the beds tonight and save what you can.'] },
    { if: { hazard: 'frost', hazardSoon: true }, pri: 1, text: ['A hard frost, and soon. Get your logs in before it bites.'] },
    { if: { hazard: 'blight', hazardSoon: true }, pri: 1, text: ['It\'s not the weather you should worry about. Watch the barley.'] },
  ]);
  lines('season.forecast.truly', [
    { text: ['...You sound sure. All right. I\'ll take the washing in.', 'Right. Well. Thank you for not making a joke of it.'] },
    { if: { hazardSoon: true }, pri: 1, text: ['...Then it\'s true. Right. Right. I\'ll tell the others.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. A straight answer from a wizard. Mark the day.'] },
    { if: { temper: 'gloomy' }, text: ['I knew it. I could feel it. I always can.'] },
    { if: { temper: 'curious' }, text: ['How do you know? The swallows? The smoke? Teach me!'] },
  ]);
  lines('season.forecast.ready', [
    { text: ['I will be now. I\'ll start tonight.', 'Readier than I was a minute ago. Thank you.'] },
    { if: { temper: 'proud' }, text: ['I\'m always ready. ...I\'ll check again, mind.'] },
  ]);
  lines('season.forecast.hatbet', [
    { text: ['Your hat! Done. I\'ve always wanted it.', 'I\'ll hold you to that. I\'ll wear it to the Badger.'] },
    { if: { stage: 'child' }, text: ['YOUR HAT? I hope you\'re wrong! Sorry. A bit.'] },
    { if: { temper: 'witty' }, text: ['Your hat. I\'ll need a ladder to wear it.'] },
  ]);
  lines('season.forecast.promised', [
    { text: ['On your word! Right. I\'ll hold you to it, mind.', 'Fine for {nextFestWord}! I\'ll tell everyone the wizard said so.'] },
    { if: { temper: 'ornery' }, text: ['On your word. And if it rains, I\'ll be round.'] },
    { if: { stage: 'child' }, text: ['PROMISE? Pinkie promise? You can\'t un-pinkie.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. I\'ll wear the new hat, then.'] },
  ]);
  lines('season.forecast.honest', [
    { text: ['Ha! I knew it. I\'ve always known it. Thank you for saying.', 'Confidence! That\'s all it is? I could be a wizard.'] },
    { if: { temper: 'witty' }, text: ['That\'s the most honest thing a wizard\'s ever said. I\'m shaken.'] },
    { if: { temper: 'ornery' }, text: ['Well, at least you\'re honest about being useless.'] },
    { if: { stage: 'child' }, text: ['But you CAN do magic. Can\'t you? A bit?'] },
  ]);

  // --- Passing the time: the sky ------------------------------------------------------------
  addThread({
    id: 'season.pass', light: true, ap: 'warm', label: 'Pass the time about the sky', open: { warm: 'season.pass.open' },
    beats: {
      start: { line: 'season.pass.reply', go: [
        { ap: 'ask', say: 'And what\'s it going to do tomorrow, do you think?', to: 'tomorrow' },
        { ap: 'jest', say: 'I\'ve been asked to complain about it officially. Will you sign?', to: 'sign' },
        { ap: 'warm', say: 'Weather\'s better with company, I find.', to: 'company' },
      ] },
      tomorrow: { line: 'season.pass.tomorrow', end: true },
      sign: { line: 'season.pass.sign', fx: { fond: 0.01 }, end: true },
      company: { line: 'season.pass.company', fx: { fond: 0.01 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('season.pass.open', [
    { text: ['Lovely day for it, {name}. Whatever it is.', 'The sky\'s been busy today, {name}.'] },
    { if: { weather: 'rain' }, text: ['Good weather for ducks, {name}. And for wizards with big hats.'] },
    { if: { weather: 'clear' }, text: ['What a sky, {name}. Not a cloud from here to Bree.'] },
    { if: { weather: 'snow' }, text: ['Snow suits the valley, {name}. It suits you too.'] },
    { if: { weather: 'fog' }, text: ['Funny thing, fog, {name}. Everyone becomes a mystery.'] },
  ]);
  lines('season.pass.reply', [
    { text: ['Isn\'t it? I was just saying so to myself.', 'It\'s been a day for it, right enough.'] },
    { if: { temper: 'ornery' }, text: ['If you say so. I\'ve seen better.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, every day\'s lovely when you\'re in a good mood!'] },
    { if: { temper: 'shy' }, text: ['...Yes. It is. Thank you.'] },
    { if: { temper: 'witty' }, text: ['The sky\'s always busy. It never does anything useful, mind.'] },
    { if: { temper: 'gloomy' }, text: ['For now. Give it an hour.'] },
    { if: { stage: 'child' }, text: ['I\'ve been out in it ALL DAY. Look at my knees.'] },
  ]);
  lines('season.pass.tomorrow', [
    { text: ['Same as today, if it\'s got any sense.', 'Rain, I expect. It\'s been threatening.'] },
    { if: { stage: 'elder' }, text: ['Ask my knees. They\'ll tell you by bedtime.'] },
    { if: { temper: 'gloomy' }, text: ['Worse. Tomorrow\'s always worse.'] },
    { if: { temper: 'cheerful' }, text: ['Better! It\'s always better tomorrow. That\'s what tomorrow\'s for.'] },
    { if: { stage: 'child' }, text: ['SNOW. I\'ve decided.'] },
  ]);
  lines('season.pass.sign', [
    { text: ['Ha! Where do I sign? I\'ve got complaints going back years.', 'Give it here. I\'ll write "too much of it".'] },
    { if: { temper: 'ornery' }, text: ['Sign? I\'ll write the thing. Three pages. Both sides.'] },
    { if: { stage: 'child' }, text: ['I can write my name! Nearly. It\'s got a backwards bit.'] },
  ]);
  lines('season.pass.company', [
    { text: ['It is, isn\'t it? Even the rain\'s nicer with somebody to moan to.', 'Ha! Then stand here and be weathered with me a while.'] },
    { if: { temper: 'shy' }, text: ['...It is. Thank you for stopping.'] },
    { if: { lonely: true }, pri: 1, text: ['...It is. I\'ve not had company all day. Stay a minute?'] },
  ]);
});
