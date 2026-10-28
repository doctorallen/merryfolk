'use strict';
// ---------------------------------------------------------------------------
// Pastimes, part four: the small pleasures. A book under a tree, a stroll, a
// nap in the shade, a proper pot of tea, favorite dishes and the six meals of
// a hobbit's day (FOODS in js/actions.js), baking at home, and games on the
// green (js/gatherings.js): skittles and skimming stones, where the wizard is
// challenged and does not always win. Some come from them: a warm parcel to
// taste, a bet on the stones. Facts come from the pastimes pack.
// ---------------------------------------------------------------------------

talkPack('pastimes4', () => {
  const has = (x) => x != null && x !== false && x !== '' && x !== 0;
  const ALWAYS = new Set(['name', 'surname', 'full', 'they', 'them', 'their', 'wiz', 'season', 'weather', 'hour', 'temper', 'stage', 'mood', 'register']);
  const guard = (rules) => {
    const out = [];
    for (const r of rules) {
      const groups = new Map();
      for (const t of r.text) {
        const need = [...new Set([...t.matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1][0].toLowerCase() + m[1].slice(1)))].filter((k) => !ALWAYS.has(k) && !(r.if && k in r.if)).sort();
        const g = need.join(',');
        if (!groups.has(g)) groups.set(g, { need, text: [] });
        groups.get(g).text.push(t);
      }
      for (const { need, text } of groups.values()) {
        if (!need.length) { out.push({ ...r, text }); continue; }
        const cond = { ...(r.if || {}) }; for (const k of need) cond[k] = has;
        out.push({ ...r, if: cond, pri: (r.pri || 0) - need.length, text });
      }
    }
    return out;
  };
  const L = (key, base, by, more) => lines(key, guard([{ text: base }, ...Object.keys(by || {}).map((t) => ({ if: { temper: t }, text: by[t] })), ...(more || [])]));
  const habit = (F, k) => (F.habits || []).includes(k) || F.leisure === k;
  const queueIf = (id) => (T, v) => {
    const a = ACTIONS[id];
    if (!a || (a.stages && !a.stages.includes(v.stage))) return;
    try { if (a.avail && !a.avail(v, Game.hour)) return; } catch (e) { return; }
    v.queue.push({ a });
  };
  const playsOnGreen = (F) => F.stage !== 'child' || F.band === 'school' || F.band === 'youth';

  // ==================================================================================
  // --- Reading -------------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.reading', about: 'habit', reveals: 'pastime.reading', weight: 1, cool: 4,
    label: 'Reading anything good?',
    when: (F) => F.reader && (habit(F, 'reading') || F.temper === 'curious' || F.register === 'fine' || F.register === 'bright'),
    rel: (F) => (habit(F, 'reading') ? 1.3 : 0.8),
    open: { ask: 'pastime.reading.open' },
    beats: {
      start: { line: 'pastime.reading.start', go: [
        { ap: 'ask', say: 'What sort of thing do you like?', to: 'kind' },
        { ap: 'ask', say: 'What\'s the best book you ever read?', to: 'best' },
        { ap: 'jest', say: 'Any dragons in it? A book\'s not a book without a dragon.', to: 'dragons' },
      ] },
      kind: { line: 'pastime.reading.kind', fx: { learn: ['pastime.reading', '{Name} reads whenever there\'s a bench and an hour'] }, go: [
        { ap: 'ask', say: 'Where do you like to read?', to: 'where' },
        { ap: 'share', say: 'I\'ve read in libraries where the shelves go up into the dark.', to: 'library' },
      ] },
      best: { line: 'pastime.reading.best', go: [
        { ap: 'ask', say: 'Why that one?', to: 'why' },
        { ap: 'tale', say: 'I knew the one who wrote that down. Long beard. Terrible handwriting.', to: 'knew' },
      ] },
      dragons: { line: 'pastime.reading.dragons', go: [
        { ap: 'tale', say: 'The real ones are worse. And they don\'t stay on the page.', to: 'real' },
        { ap: 'jest', say: 'I\'ll write you one. With a wizard in it. A handsome one.', to: 'write' },
      ] },
      where: { line: 'pastime.reading.where', go: [
        { ap: 'warm', say: 'That sounds like the best seat in the valley.', to: 'end' },
        { ap: 'ask', say: 'And does anyone ever interrupt you?', to: 'interrupt' },
      ] },
      library: { line: 'pastime.reading.library', fx: { trust: 0.02 }, go: [
        { ap: 'tale', say: 'In Rivendell they read aloud, and the books sing back.', to: 'rivendell' },
        { ap: 'warm', say: 'You\'d love it. I\'ll tell you about it some long evening.', to: 'end', fx: { hook: 'pastime.reading' } },
      ] },
      why: { line: 'pastime.reading.why', fx: { trust: 0.02 }, end: true },
      knew: { line: 'pastime.reading.knew', fx: { fond: 0.02 }, end: true },
      real: { line: 'pastime.reading.real', fx: { feel: 'wizard_tale', feelX: 'real dragons' }, end: true },
      write: { line: 'pastime.reading.write', fx: { joke: { k: 'pastime.handsome', t: 'A book with a wizard in it. A handsome one.' } }, end: true },
      interrupt: { line: 'pastime.reading.interrupt', end: true },
      rivendell: { line: 'pastime.reading.rivendell', fx: { fond: 0.02, feel: 'wizard_tale', feelX: 'the singing books of Rivendell' }, end: true },
    },
    end: { fond: 0.02, respect: 0.01 },
  });
  L('pastime.reading.open', ['I saw you under the oak with a book, {name}. A good one?', 'Reading anything good, {name}?', 'You\'ve ink on your thumb and a book in your pocket, {name}. I\'m a wizard. I notice things.'], {}, [
    { if: { stage: 'child' }, text: ['I hear you\'re a great reader, {name}. What\'s the latest?'] },
  ]);
  L('pastime.reading.start', ['Oh, always something. I read the almanac when there\'s nothing else.', 'A bit, of an evening. Or on the bench at noon, if nobody\'s looking.'], {
    cheerful: ['Oh, yes! I\'ve just finished one! I cried twice and laughed four times!'],
    ornery: ['When folk leave me alone long enough. Which is never.'],
    shy: ['...A lot, actually. Books don\'t mind if you\'re quiet.'],
    curious: ['Everything! Maps, almanacs, recipes, old letters. I read the labels on jars.'],
    dreamy: ['Old tales. I read them till I\'m half in them.'],
    witty: ['I\'m reading three at once. I\'m losing track of who\'s married to whom.'],
    proud: ['I\'ve read every book in the valley. Some twice.'],
    gloomy: ['Sad ones. They\'re the only ones that feel true.'],
    child: ['I can read! Nearly all of it! The long words are hard.'],
  }, [
    { if: { stage: 'elder' }, text: ['My eyes tire now. But the old tales are worth it.'] },
    { if: { weather: 'rain' }, text: ['On a day like this? By the window, with tea. Bliss.'] },
    { if: { rift: true }, text: ['Paper books! Back home everything was on a screen. I love the smell of these.'] },
    { if: { job: 'storyteller' }, pri: 1, text: ['All the time. It\'s my work and my pleasure. Lucky me.'] },
  ]);
  L('pastime.reading.kind', ['Tales. Old ones. Elves and kings and roads.', 'Anything with a map at the front.'], {
    cheerful: ['Happy endings! I read the end first to check!'],
    ornery: ['True things. Not this elvish nonsense.'],
    shy: ['...Poems. Short ones.'],
    curious: ['How things work. Mills, stars, bees. There\'s a book on bees I\'ve read eleven times.'],
    dreamy: ['Journeys. People going far away and coming back changed.'],
    witty: ['Anything with a good villain. The heroes are always so dull.'],
    proud: ['Histories. The great houses of the Shire. My family\'s in one.'],
    gloomy: ['Ones where it rains. I like to feel at home.'],
    child: ['Dragon ones! And ones with pigs in!'],
  });
  L('pastime.reading.best', ['\'There and Back Again\'. A copy of a copy. Half the pages are tea-stained.', 'An old book of tales with no name on it. My grandmother\'s.'], {
    cheerful: ['The one about the hobbit who goes on an adventure and comes home with treasure!'],
    ornery: ['The almanac. Useful. Unlike most books.'],
    shy: ['...A little book of poems someone left on the bench. I never found who.'],
    curious: ['\'A Herbal of the Westfarthing\'. Every plant, drawn by hand. I\'ve learned half by heart.'],
    dreamy: ['The one about the ship that sailed into the West. I read it every winter.'],
    witty: ['\'Etiquette for Young Hobbits\'. Hilarious. Unintentionally.'],
    proud: ['\'The Long Lineage of the Shire\'. I\'m on page two hundred and six.'],
    gloomy: ['One where everybody dies at the end. It was very honest.'],
    child: ['The one with the dragon! It\'s got pictures!'],
  });
  L('pastime.reading.dragons', ['Ha! There\'s one in chapter nine. I\'m saving it.', 'No dragons. But a very angry goose.'], {
    cheerful: ['YES! A big one! Asleep on gold! Oh, it\'s wonderful!'],
    ornery: ['Dragons. Pah. Nobody\'s seen one in an age.'],
    shy: ['...A small one. A kind one. I like that.'],
    curious: ['There\'s one, but it\'s all wrong. The wings couldn\'t lift it. I\'ve worked it out.'],
    witty: ['No, but the aunt in it breathes fire. Close enough.'],
    child: ['THERE IS! It eats a pony! ...It gives it back.'],
  });
  L('pastime.reading.where', ['Under the oak by the green. The roots are shaped like a chair.', 'By the window, with my feet on the fender.'], {
    cheerful: ['Anywhere! The bench, the bath, the line at the Store!'],
    ornery: ['Somewhere nobody can find me.'],
    shy: ['...Up in the hayloft. Nobody looks up.'],
    curious: ['By the river. If it gets dull, there\'s always the river.'],
    dreamy: ['In the long grass. You disappear. It\'s just you and the clouds and the page.'],
    witty: ['In the bath. Until it goes cold. Then the book goes soggy.'],
    proud: ['In my study. I\'ve a study.'],
    gloomy: ['In bed. Where else.'],
    child: ['Under the table! It\'s a cave!'],
  });
  L('pastime.reading.library', ['Shelves into the dark? ...Oh. Oh, I\'d give my teeth.', 'Where? WHERE? How many books? Did you read them all?'], {
    curious: ['How many books? Are they in order? How do you find anything? Is there a list?'],
    dreamy: ['*They close their eyes.* ...I can see it. Candles, and dust, and quiet.'],
    ornery: ['...Hm. That\'s a lot of dusting.'],
  });
  L('pastime.reading.why', ['Because it told me the world was bigger than the valley. And then let me come home.', 'Because I read it the winter I was ill. It kept me company.'], {
    shy: ['...Because the hero was shy too. And it didn\'t matter.'],
    gloomy: ['Because it was the only thing that helped, once.'],
  });
  L('pastime.reading.knew', ['You KNEW them? ...Bad handwriting? Ha! That explains chapter four.', 'No! You did not! ...Did you?'], {
    curious: ['What were they like? Did they write it all at once? Was any of it true?'],
    ornery: ['...You\'re having me on. ...Tell me more.'],
  });
  L('pastime.reading.real', ['...Worse? Don\'t stay on the page? Oh, don\'t. I\'ll never sleep.', 'Worse. Right. I\'ll stick to the book version, thank you.'], {
    child: ['WORSE? How worse? Bigger? Have you SEEN one?'],
    curious: ['Worse how? Bigger? Cleverer? I need details.'],
  });
  L('pastime.reading.write', ['Ha! A handsome wizard. That\'ll be a work of fiction.', 'I\'ll read it. Even if the wizard\'s handsome.'], {
    witty: ['A handsome wizard. I\'ll file it under fantasy.'],
    child: ['Put ME in it! I want to fight the dragon!'],
  });
  L('pastime.reading.interrupt', ['Always. Just at the good bit. Every single time.', 'Everyone. It\'s like they can smell a good chapter.'], {
    witty: ['Wizards, mostly. Just now, for instance.'],
  });
  L('pastime.reading.rivendell', ['...Books that sing back. *They look at the book in their lap as if it might.*', 'Sing back? What do they sing? No. Don\'t tell me. I want to imagine it.'], {
    dreamy: ['*They hold the book to their ear, and laugh at themselves.*'],
  });

  // --- Letters: for those who never learned to read ----------------------------------
  addThread({
    id: 'pastime.letters', about: 'habit', weight: 0.6, cool: 8,
    label: 'Do you read much?',
    when: (F) => !F.reader && F.stage !== 'child' && F.talks >= 1,
    open: { ask: 'Do you read much, {name}?' },
    beats: {
      start: { line: 'pastime.letters.start', go: [
        { ap: 'comfort', say: 'There\'s no shame in it. Many of the wisest folk I know can\'t.', to: 'shame' },
        { ap: 'advise', say: 'It\'s never too late. The storyteller teaches grown-ups too.', to: 'learn' },
        { ap: 'tale', say: 'Then let me tell you one. A book with no pages.', to: 'tale' },
      ] },
      shame: { line: 'pastime.letters.shame', fx: { trust: 0.03 }, end: true },
      learn: { line: 'pastime.letters.learn', fx: { respect: 0.02 }, end: true },
      tale: { line: 'pastime.letters.tale', fx: { fond: 0.03, feel: 'wizard_tale', feelX: 'a tale with no pages' }, end: true },
    },
    end: { fond: 0.01 },
  });
  L('pastime.letters.start', ['...Not much. Not really. I never learned my letters properly.', 'Read? ...I can do my name. And \'ale\'.'], {
    cheerful: ['Ha! Not a word! But I know every tale off by heart. Ask me!'],
    ornery: ['Never needed to. Hands are for working.'],
    shy: ['*They look at their feet.* ...No.'],
    proud: ['I\'ve no time for books. I\'ve real work.'],
    gloomy: ['No. Never got the chance.'],
  });
  L('pastime.letters.shame', ['...Do you mean that? ...Thank you. I\'ve always felt a bit of a fool.', '...Wise folk who can\'t read. Well. Maybe I\'m one of them.'], {
    ornery: ['...Hm. Well. Good.'],
  });
  L('pastime.letters.learn', ['At my age? ...Maybe. Don\'t tell anyone I said maybe.', 'Never too late. Hm. I might. If nobody watches.'], {
    proud: ['I\'ll think about it. Privately.'],
    ornery: ['...I\'ll think on it. Don\'t push.'],
  });
  L('pastime.letters.tale', ['*They listen, rapt, to the whole thing.* ...That\'s better than a book.', '*At the end:* ...Tell me another one. Some day.'], {
    cheerful: ['Oh, that was lovely! Who needs pages!'],
  });

  // ==================================================================================
  // --- A stroll ---------------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.stroll', about: 'habit', reveals: 'pastime.stroll', weight: 0.9, cool: 4,
    label: 'Out for a stroll?',
    when: (F) => habit(F, 'strolling') || (F.temper === 'dreamy' && F.weather !== 'rain'),
    open: { ask: 'pastime.stroll.open' },
    beats: {
      start: { line: 'pastime.stroll.start', go: [
        { ap: 'ask', say: 'Where\'s your favorite walk?', to: 'walk' },
        { ap: 'share', say: 'I\'ve walked most of the West, I think. Your lanes are the kindest.', to: 'west' },
        { ap: 'jest', say: 'Walking for its own sake? Very un-hobbit-like.', to: 'unhobbit' },
      ] },
      walk: { line: 'pastime.stroll.walk', fx: { learn: ['pastime.stroll', '{Name} likes a stroll for its own sake'] }, go: [
        { ap: 'ask', say: 'What do you think about as you go?', to: 'think' },
        { ap: 'warm', say: 'Show me, some time. I\'d like that.', to: 'show' },
      ] },
      west: { line: 'pastime.stroll.west', go: [
        { ap: 'tale', say: 'The road goes ever on. But it always comes back here, for me.', to: 'road' },
        { ap: 'ask', say: 'Have you ever wanted to walk further?', to: 'further', need: { open: 1 }, soft: true },
      ] },
      unhobbit: { line: 'pastime.stroll.unhobbit', end: true },
      think: { line: 'pastime.stroll.think', fx: { trust: 0.02 }, end: true },
      show: { line: 'pastime.stroll.show', fx: { fond: 0.02 }, end: true },
      road: { line: 'pastime.stroll.road', fx: { fond: 0.02 }, end: true },
      further: { line: 'pastime.stroll.further', fx: { trust: 0.03 }, go: [
        { ap: 'advise', say: 'Then one day, walk to the next valley and back. Just to see.', to: 'advised' },
        { ap: 'warm', say: 'The road will wait for you.', to: 'end' },
      ] },
      advised: { line: 'pastime.stroll.advised', fx: { respect: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.stroll.open', ['Out for a stroll, {name}? Where to?', 'I keep seeing you on the lanes, {name}. Going nowhere in particular.', 'A fine {hour} for a walk, {name}.'], {}, [
    { if: { weather: 'rain' }, text: ['Walking in this, {name}? You\'re braver than I am.'] },
  ]);
  L('pastime.stroll.start', ['Oh, just round. Round the pond, round the mill, round home.', 'Nowhere. That\'s the best place to walk to.'], {
    cheerful: ['Everywhere! It\'s too lovely to sit indoors!'],
    ornery: ['Away from the noise, mostly.'],
    shy: ['...Just walking. It\'s easier than talking.'],
    curious: ['I go a different way every day. I\'m trying to walk every path in the valley.'],
    dreamy: ['Wherever my feet go. I find out when I get there.'],
    witty: ['I\'m walking off second breakfast to make room for elevenses.'],
    proud: ['My constitutional. Every day, same time.'],
    gloomy: ['Round and round. It gets me out.'],
    child: ['I\'m EXPLORING! I found a hole! A big one!'],
  }, [
    { if: { stage: 'elder' }, text: ['Slowly. With the stick. But every day, still.'] },
    { if: { season: 'autumn' }, text: ['Kicking leaves. A grown hobbit kicking leaves. Don\'t tell anyone.'] },
    { if: { season: 'spring' }, text: ['Looking at everything coming up. It\'s like the valley\'s waking.'] },
    { if: { rift: true }, text: ['Walking. No traffic. No signal. Just walking. I keep forgetting I\'m allowed.'] },
  ]);
  L('pastime.stroll.walk', ['Up past the mill, along the top, down by the orchard. An hour, at a dawdle.', 'Round the pond. Three times. The ducks know me now.'], {
    cheerful: ['Down to the river and back by the party field! You see everybody!'],
    ornery: ['The back lane. Nobody uses it. That\'s the point.'],
    shy: ['...The path by the woods. It\'s quiet.'],
    curious: ['Up the hill to where you can see the whole valley. Like a map, but real.'],
    dreamy: ['Along the river at dusk, when the mist comes up. It\'s like walking in a song.'],
    witty: ['Any walk that ends at the Badger.'],
    proud: ['The long way round the Hill. Four miles. I do it in an hour.'],
    gloomy: ['Out to the old stones and back. It\'s lonely. I like that.'],
    child: ['To the big tree and back! Running!'],
  });
  L('pastime.stroll.west', ['The kindest? Do you think so? Oh, that\'s nice.', 'Most of the West! ...And you came back to ours.'], {
    dreamy: ['Most of the West... *They look out past the hills.* What\'s it like? All of it?'],
    proud: ['Of course they are. We keep them nicely.'],
  });
  L('pastime.stroll.unhobbit', ['Ha! It\'s for the appetite. Very hobbit-like.', 'It\'s not for its own sake. It\'s for the sake of the next meal.'], {
    witty: ['I\'m walking to somewhere. Supper. By a very long route.'],
    ornery: ['I\'ll walk where I like.'],
  });
  L('pastime.stroll.think', ['Nothing much. That\'s the joy of it. Feet go, head stops.', 'Whatever comes. Sometimes a tune. Sometimes nothing for a mile.'], {
    shy: ['...Things I should have said. They come out easier on a walk.'],
    gloomy: ['The ones who used to walk with me.'],
    curious: ['Why the path goes where it goes. Somebody walked it first. Who?'],
  });
  L('pastime.stroll.show', ['Would you? I\'d like that. We\'ll go slow.', 'Tomorrow, then. Wear sensible boots. Oh. You do.'], {
    shy: ['...You\'d want to walk with me?'],
  });
  L('pastime.stroll.road', ['...It comes back here. That\'s nice. That\'s really nice.', '*They smile.* The road comes home. I like that.'], {});
  L('pastime.stroll.further', ['...Sometimes. To the top of the far hill. To see what\'s on the other side.', '...Once I walked to the edge of the valley. Stood there. Came home.'], {
    shy: ['...Once. I got as far as the bridge and turned back.'],
    proud: ['I\'ve walked further than most. To Bywater, once.'],
  });
  L('pastime.stroll.advised', ['The next valley and back. ...I might. In spring.', 'Just to see. Yes. I\'ll take a pie.'], {
    ornery: ['Hm. Maybe. If the weather\'s right.'],
  });

  // ==================================================================================
  // --- Forty winks ----------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.nap', about: 'habit', reveals: 'pastime.nap', weight: 0.9, cool: 4,
    label: 'Forty winks',
    when: (F) => habit(F, 'napping') || F.tired,
    rel: (F) => (F.tired ? 1.4 : 1) * (F.hour === 'afternoon' ? 1.3 : 1),
    open: { jest: 'pastime.nap.open' },
    beats: {
      start: { line: 'pastime.nap.start', go: [
        { ap: 'ask', say: 'Where\'s the best place for a nap?', to: 'where' },
        { ap: 'ask', say: 'Do you dream, when you doze?', to: 'dream' },
        { ap: 'jest', say: 'Wizards never sleep. We just rest our eyes for a century.', to: 'century' },
      ] },
      where: { line: 'pastime.nap.where', fx: { learn: ['pastime.nap', '{Name} has a favorite tree for a nap'] }, go: [
        { ap: 'warm', say: 'I may borrow it some afternoon.', to: 'borrow' },
        { ap: 'advise', say: 'Go now. You\'ve that look about you.', to: 'go', need: { if: { tired: true } } },
      ] },
      dream: { line: 'pastime.nap.dream', go: [
        { ap: 'ask', say: 'And what does it mean, do you think?', to: 'mean' },
        { ap: 'warm', say: 'A good dream for a summer afternoon.', to: 'end' },
      ] },
      century: { line: 'pastime.nap.century', fx: { joke: { k: 'pastime.century', t: 'Wizards don\'t sleep. They rest their eyes for a century.' } }, end: true },
      borrow: { line: 'pastime.nap.borrow', end: true },
      go: { line: 'pastime.nap.go', fx: { run: queueIf('nap') }, end: true },
      mean: { line: 'pastime.nap.mean', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.01 },
  });
  L('pastime.nap.open', ['You look like a hobbit who\'s been asleep under a tree, {name}. There\'s a leaf in your hair.', 'Caught you yawning, {name}. Forty winks, was it?', 'Is it nap o\'clock already, {name}?'], {}, []);
  L('pastime.nap.start', ['Guilty. A doze in the shade after luncheon. It\'s good for the digestion.', 'Forty winks. Fifty. I lost count. That\'s the point.'], {
    cheerful: ['Ha! Guilty! Best part of the day, the nap!'],
    ornery: ['I was resting my eyes. It\'s different.'],
    shy: ['...Oh. Yes. I fell asleep. Did anyone see?'],
    curious: ['I\'ve found that twenty minutes is perfect. Any longer and you wake up stupid.'],
    dreamy: ['I wasn\'t asleep. I was listening to the bees with my eyes shut.'],
    witty: ['I wasn\'t napping. I was conducting a thorough inspection of the inside of my eyelids.'],
    proud: ['A brief rest. Even the great need rest.'],
    gloomy: ['Sleep\'s the only time nothing goes wrong.'],
    child: ['I wasn\'t asleep! ...I was a bit asleep.'],
  }, [
    { if: { tired: true }, pri: 1, text: ['Not yet, and I\'m dead on my feet. I could sleep standing up.'] },
    { if: { stage: 'elder' }, text: ['At my age, a nap\'s not a pleasure, it\'s a duty.'] },
  ]);
  L('pastime.nap.where', ['The big beech by the pond. The roots fit me like a chair.', 'Under the apple trees. You wake up with blossom on you.'], {
    cheerful: ['Anywhere sunny! I\'m like a cat!'],
    ornery: ['Somewhere nobody\'ll wake me. I\'ll not say where.'],
    shy: ['...Behind the woodpile. It\'s warm and nobody comes.'],
    curious: ['The north side of the oak. Shade till four, then sun on your feet. I\'ve tested them all.'],
    dreamy: ['In the long grass, where the clouds go over.'],
    witty: ['The bench outside the Badger. Strategic. Close to the next meal.'],
    proud: ['My own chair, in my own garden.'],
    gloomy: ['Anywhere. I\'m always tired.'],
    child: ['In the hay! It\'s itchy but nice!'],
  });
  L('pastime.nap.dream', ['Oh, daft things. Flying. Cheese. Flying cheese.', 'Sometimes I dream I\'m back as a child, and it\'s summer, and nobody\'s gone.'], {
    cheerful: ['Puddings! I dream about puddings!'],
    ornery: ['I don\'t dream. Waste of a good sleep.'],
    shy: ['...I dream I\'m talking and everyone listens.'],
    curious: ['I dream about the mill. All the cogs. Sometimes I work out how to mend it.'],
    dreamy: ['The sea. I\'ve never seen it, but I dream it every time.'],
    witty: ['I dream I\'m awake and napping. Very restful.'],
    proud: ['I dream of great things.'],
    gloomy: ['I dream about losing things. Keys. People.'],
    child: ['I dreamed I was a DRAGON!'],
  });
  L('pastime.nap.century', ['A century! I\'d settle for an afternoon.', 'Ha! Then you\'re due one, I\'d say. You look it.'], {
    witty: ['A century. That\'s what I call a nap. I\'m only an amateur.'],
    child: ['A HUNDRED YEARS? Do you snore?'],
  });
  L('pastime.nap.borrow', ['You may. Wake me if I\'m in it.', 'Ha! There\'s room for two. Just about.'], {
    ornery: ['Not on Tuesdays. Tuesdays are mine.'],
  });
  L('pastime.nap.go', ['...You\'re right. I\'ll go. Wake me for supper.', 'I will. Don\'t tell anyone.'], {
    ornery: ['I was going anyway.'],
  });
  L('pastime.nap.mean', ['Mean? ...That I miss them, I suppose.', 'That I\'m hungry, mostly.'], {
    dreamy: ['That somewhere there\'s a sea waiting for me. I\'m sure of it.'],
  });

  // ==================================================================================
  // --- A proper pot of tea ----------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.tea', about: 'habit', reveals: 'pastime.tea', weight: 0.9, cool: 4,
    label: 'How do you take your tea?',
    when: (F) => habit(F, 'tea') || F.register === 'fine',
    rel: (F) => (F.hour === 'afternoon' ? 1.4 : 1),
    open: { warm: 'pastime.tea.open' },
    beats: {
      start: { line: 'pastime.tea.start', go: [
        { ap: 'ask', say: 'How do you take it?', to: 'take' },
        { ap: 'ask', say: 'And what goes with it?', to: 'biscuits' },
        { ap: 'jest', say: 'I hear some folk read the leaves. Is my future very tall?', to: 'leaves' },
      ] },
      take: { line: 'pastime.tea.take', fx: { learn: ['pastime.tea', '{Name} has strong views on tea'] }, go: [
        { ap: 'jest', say: 'Milk in first, I always say. *You wait for the explosion.*', label: 'Milk in first, I always say', to: 'milk' },
        { ap: 'warm', say: 'Then that\'s how I\'ll have it, next time.', to: 'next' },
      ] },
      biscuits: { line: 'pastime.tea.cookies', go: [
        { ap: 'ask', say: 'Do you dunk?', to: 'dunk' },
        { ap: 'warm', say: 'There\'s no better hour in the day.', to: 'hour' },
      ] },
      leaves: { line: 'pastime.tea.leaves', fx: { joke: { k: 'pastime.leaves', t: 'The tea leaves said the wizard would be very tall, and late.' } }, go: [
        { ap: 'jest', say: 'Late? I\'m never late.', to: 'never' },
        { ap: 'ask', say: 'And what do yours say?', to: 'yours' },
      ] },
      milk: { line: 'pastime.tea.milk', end: true },
      next: { line: 'pastime.tea.next', fx: { fond: 0.02 }, end: true },
      dunk: { line: 'pastime.tea.dunk', end: true },
      hour: { line: 'pastime.tea.hour', fx: { run: queueIf('tea') }, end: true },
      never: { line: 'pastime.tea.never', end: true },
      yours: { line: 'pastime.tea.yours', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.tea.open', ['Is that the kettle I hear, {name}?', 'Nothing like a pot of tea at this hour, {name}.', 'I could murder a cup of tea, {name}. Don\'t tell anyone I said murder.'], {}, [
    { if: { hour: 'afternoon' }, text: ['Four o\'clock, {name}. Tea o\'clock.'] },
  ]);
  L('pastime.tea.start', ['Oh, tea. There\'s always tea. Tea is the answer to most things.', 'A pot in the morning, a pot at eleven, a pot at four. And one before bed.'], {
    cheerful: ['Tea! Oh, yes! Sit! I\'ll put the kettle on!'],
    ornery: ['Tea\'s tea. Folk make such a fuss.'],
    shy: ['...I like tea. It gives your hands something to do.'],
    curious: ['I\'ve been drying my own. Mint, chamomile, a bit of blackcurrant leaf. Some work. Some don\'t.'],
    dreamy: ['The steam. I like watching the steam curl up. And the first sip, when it\'s too hot.'],
    witty: ['I\'ve had nine cups today. I can see through time.'],
    proud: ['Proper tea, from a proper pot. None of this stewed nonsense.'],
    gloomy: ['Tea helps. A bit. Sometimes.'],
    child: ['I\'m allowed tea now! With LOTS of milk!'],
  }, [
    { if: { weather: 'rain' }, text: ['On a day like this? The kettle\'s not been off since breakfast.'] },
    { if: { season: 'winter' }, text: ['In winter it\'s tea or death. Tea, every time.'] },
    { if: { register: 'fine' }, text: ['One does like a proper afternoon tea. With a cloth on the table.'] },
  ]);
  L('pastime.tea.take', ['Strong. Strong enough to stand a spoon in. Then a drop of milk.', 'Weak, with honey. Don\'t judge me.'], {
    cheerful: ['Milky and sweet! Three sugars! Four on Highdays!'],
    ornery: ['Black. Like it should be.'],
    shy: ['...However it comes. I don\'t like to make a fuss.'],
    curious: ['Brewed four minutes exactly. I\'ve timed it every way. Four.'],
    dreamy: ['With a sprig of mint from the garden. It tastes like summer.'],
    witty: ['In a cup, ideally. I\'ve had it in a bowl. It was a dark time.'],
    proud: ['Warmed pot, loose leaf, milk after. Properly.'],
    gloomy: ['Stewed. I always forget it.'],
    child: ['With milk and sugar and a cookie IN it.'],
  });
  L('pastime.tea.cookies', ['A cookie. Two. Seed-cake if there\'s seed-cake.', 'Toast, if it\'s morning. Cake if it\'s four.'], {
    cheerful: ['Everything! Scones, jam, cream, cake, more cake!'],
    ornery: ['A plain cookie. Fancy ones crumble.'],
    shy: ['...A cookie. Just one.'],
    curious: ['Shortbread. It\'s the butter ratio. I\'ve tried five recipes.'],
    dreamy: ['Something warm from the oven, with the window open.'],
    witty: ['Whatever\'s in the tin. And then whatever\'s in the other tin.'],
    proud: ['Home-baked. Never bought.'],
    gloomy: ['Whatever\'s left. Usually nothing.'],
    child: ['COOKIES. All of them.'],
  }, [
    { if: { favFood: 'cake' }, pri: 1, text: ['Seed-cake. Always seed-cake. Tea without seed-cake is just hot water.'] },
  ]);
  L('pastime.tea.leaves', ['*They peer into an empty cup.* ...Tall. Very tall. And late.', 'Your leaves say a long road and a short temper. And cookies.'], {
    cheerful: ['Oh! I see a big hat! And a party! And... cake!'],
    ornery: ['They say you ask silly questions.'],
    shy: ['...I can\'t really read them. I just pretend.'],
    curious: ['My gran read them. I never worked out how. I think she just knew people.'],
    dreamy: ['I see a road. And a door. And someone waiting.'],
    witty: ['They say you\'ll meet a tall stranger. Have you got a mirror?'],
    proud: ['A great destiny. Naturally.'],
    gloomy: ['Rain. They always say rain.'],
    child: ['I see a DRAGON. In the cup! Look!'],
  });
  L('pastime.tea.milk', ['Milk in FIRST? Out. Out of my lane.', '*They stare at you in horror.* ...You\'re joking. Tell me you\'re joking.'], {
    cheerful: ['Ha! Oh, you monster! Ha!'],
    ornery: ['I knew there was something wrong with you.'],
    shy: ['*A tiny gasp.* ...Oh no.'],
    curious: ['Actually, there\'s a reason: milk first stops the cup cracking. But it\'s still wrong.'],
    witty: ['Milk in first. I\'ve met trolls with better manners.'],
    proud: ['I shall pretend I didn\'t hear that.'],
    child: ['What\'s wrong with milk first?'],
  });
  L('pastime.tea.next', ['Come by, then. I\'ll have the pot warm.', 'Next time. I\'ll make it properly. You\'ll see.'], {});
  L('pastime.tea.dunk', ['Of course. A cookie that\'s not dunked hasn\'t lived.', 'Never! Soggy cookie? In the cup? Never.'], {
    cheerful: ['Always! And I lose half of it! And fish it out!'],
    ornery: ['Certainly not.'],
    witty: ['Dunking is a skill. Three seconds. Four is a tragedy.'],
    child: ['Yes and it falls in and you drink it at the end!'],
  });
  L('pastime.tea.hour', ['No better hour. Right. I\'m putting the kettle on.', 'There isn\'t. Excuse me. The kettle\'s calling.'], {});
  L('pastime.tea.never', ['Ha! Nor early, I hear. You arrive precisely when you mean to.', 'Never late. Just very precisely on time for something else.'], {
    witty: ['The leaves say otherwise. The leaves are never wrong. Except about the weather.'],
  });
  L('pastime.tea.yours', ['*They look in their own cup a long while.* ...They say somebody\'s coming back. I hope it\'s true.', '*They swirl it.* ...A ring. A ring means company. Or a stain.'], {
    gloomy: ['*They don\'t look.* ...I\'d rather not know.'],
  });

  // ==================================================================================
  // --- Food: favorite dishes, and the six meals of the day ----------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.food', about: 'food', reveals: 'pastime.food', weight: 1, cool: 4,
    label: 'What\'s your favorite dish?',
    when: (F) => !!F.favFood,
    rel: (F) => (F.hungry ? 1.6 : 1),
    open: { ask: 'pastime.food.open' },
    beats: {
      start: { line: 'pastime.food.start', fx: { learn: ['pastime.food', '{Name}\'s favorite food is {favFoodWord}'] }, go: [
        { ap: 'ask', say: 'And how do you like it done?', to: 'how' },
        { ap: 'ask', say: 'And what can\'t you abide?', to: 'hate', need: { if: { hateFood: has } } },
        { ap: 'jest', say: 'How many meals is it today? I make it four so far.', to: 'meals' },
      ] },
      how: { line: 'pastime.food.how', go: [
        { ap: 'ask', say: 'Is there a family recipe?', to: 'recipe', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'Now I\'m hungry. Thank you very much.', to: 'hungry' },
      ] },
      hate: { line: 'pastime.food.hate', go: [
        { ap: 'jest', say: 'I once ate a troll\'s stew. You\'ve nothing to complain about.', to: 'troll' },
        { ap: 'ask', say: 'What happened? Something must have happened.', to: 'why' },
      ] },
      meals: { line: 'pastime.food.meals', fx: { joke: { k: 'pastime.meals', t: 'Breakfast, second breakfast, elevenses, luncheon, afternoon tea, dinner, supper. And a little something.' } }, go: [
        { ap: 'ask', say: 'Which is the best of them?', to: 'best' },
        { ap: 'jest', say: 'Wizards manage on one. With a great deal of pipe-weed.', to: 'onemeal' },
      ] },
      recipe: { line: 'pastime.food.recipe', fx: { confide: { k: 'pastime.food.recipe', t: '{Name} has a secret family recipe for {favFoodWord}' } }, go: [
        { ap: 'warm', say: 'Your secret\'s safe. Unless you feed me.', to: 'feed' },
        { ap: 'jest', say: 'I\'ll take it to the elves. They\'ll make a song of it.', to: 'elves' },
      ] },
      hungry: { line: 'pastime.food.hungry', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'I\'d never say no.', to: 'invite', need: { fond: 0.15 }, soft: true },
        { ap: 'jest', say: 'Don\'t tempt me. I\'ve a wagon to fill.', to: 'end' },
      ] },
      troll: { line: 'pastime.food.troll', fx: { feel: 'wizard_tale', feelX: 'the trolls\' stew' }, end: true },
      why: { line: 'pastime.food.why', fx: { trust: 0.02 }, end: true },
      best: { line: 'pastime.food.best', end: true },
      onemeal: { line: 'pastime.food.onemeal', end: true },
      feed: { line: 'pastime.food.feed', fx: { fond: 0.03 }, end: true },
      elves: { line: 'pastime.food.elves', end: true },
      invite: { line: 'pastime.food.invite', fx: { fond: 0.03, promise: { k: 'pastime.supper', t: '{Name} has asked you to supper, with {favFoodWord}', days: 7 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.food.open', ['Tell me, {name}: if you could eat one thing for the rest of your days?', 'What\'s your favorite dish, {name}? I collect them.', 'What would you have at a feast in your honor, {name}?'], {}, [
    { if: { hungry: true }, text: ['I can hear your stomach from here, {name}. What\'s it asking for?'] },
  ]);
  L('pastime.food.start', ['Oh, everything. Ask me what I don\'t like. It\'s quicker.', '{FavFoodWord}. No question. Every time.', 'Oh, {favFoodWord}. I dream about {favFoodWord}.'], {
    cheerful: ['{FavFoodWord}! I could eat it every day! I do eat it every day!'],
    ornery: ['{FavFoodWord}. Done properly. Which it never is, these days.'],
    shy: ['...{FavFoodWord}. Is that boring?'],
    curious: ['{FavFoodWord}. I\'ve tried it forty ways. I\'m working on forty-one.'],
    dreamy: ['{FavFoodWord}. It tastes like being small and safe at home.'],
    witty: ['{FavFoodWord}. We\'ve been seeing each other for years. It\'s serious.'],
    proud: ['{FavFoodWord}. Mine\'s the best in the valley.'],
    gloomy: ['{FavFoodWord}. When there is any. There never is.'],
    child: ['{FavFoodWord}! And pudding! And {favFoodWord} for pudding!'],
  }, [
    { if: { favFood: 'cake' }, text: ['Seed-cake. A slice of seed-cake and a cup of tea, and the world can do as it likes.'] },
    { if: { favFood: 'pie' }, text: ['Pie. Any pie. A pie is a meal with a lid on, and the lid is also a meal.'] },
    { if: { favFood: 'mush' }, text: ['Mushrooms. In butter. I\'d walk ten miles for a good mushroom.'] },
    { if: { favFood: 'cheese' }, text: ['Cheese. A good crumbly one, with an apple. I\'m a simple hobbit.'] },
    { if: { favFood: 'fish' }, text: ['Fish. Fresh from the river, in the pan before it knows what\'s happened.'] },
    { if: { favFood: 'bread' }, text: ['Bread. Just bread. Warm, with butter. People laugh. People are wrong.'] },
    { if: { favFood: 'apple' }, text: ['Apples. Straight off the tree. The ones with a bit of frost on are best.'] },
    { if: { favFood: 'egg' }, text: ['Eggs. Boiled, soft, with soldiers. Every morning of my life.'] },
    { if: { favFood: 'veg' }, text: ['Vegetables. I know. I KNOW. But a good roast carrot is a thing of glory.'] },
    { if: { hungry: true }, pri: 1, text: ['Anything. Right now, anything. But {favFoodWord}, if you\'re asking.'] },
  ]);
  L('pastime.food.how', ['Plain. Done right, plain\'s best.', 'Hot, and plenty of it.'], {
    cheerful: ['With everything! And then a bit more of everything!'],
    ornery: ['The old way. Not this new way with herbs on.'],
    shy: ['...How my mom did it.'],
    curious: ['That depends on the season. And the weather. And the moon, my gran said. I\'ve been checking.'],
    dreamy: ['Slowly. On a winter evening, with the fire going.'],
    witty: ['On a plate, ideally. In a hurry, if necessary.'],
    proud: ['My way. Which is the right way.'],
    gloomy: ['However I can get it.'],
    child: ['With KETCHUP. What\'s ketchup? I made it up.'],
  }, [
    { if: { favFood: 'egg' }, text: ['Four minutes. Not three. Not five. Four.'] },
    { if: { favFood: 'pie' }, text: ['Hot, with the gravy coming through the top. And a crust you can stand on.'] },
    { if: { favFood: 'bread' }, text: ['Torn, not cut. And the heel. Always the heel.'] },
    { if: { favFood: 'cheese' }, text: ['Old. The older the better. Until it walks off.'] },
  ]);
  L('pastime.food.hate', ['Oh, I\'ll eat most things. Most things.', '{HateFoodWord}. Can\'t abide {hateFoodWord}. Never could.', '{HateFoodWord}. Don\'t even say it.'], {
    cheerful: ['Oh, I like nearly everything! Except {hateFoodWord}. Bleugh!'],
    ornery: ['{HateFoodWord}. Slimy. Or dry. Either way, no.'],
    shy: ['...{HateFoodWord}. But I eat it if it\'s offered. To be polite.'],
    curious: ['{HateFoodWord}. I\'ve tried to like it. I\'ve given it every chance.'],
    witty: ['{HateFoodWord}. We had a falling-out years ago. We don\'t speak.'],
    proud: ['{HateFoodWord}. It\'s beneath me.'],
    gloomy: ['{HateFoodWord}. And we always seem to have it.'],
    child: ['{HateFoodWord}! YUCK! Mom makes me!'],
  });
  L('pastime.food.meals', ['Four? Five. Second breakfast was small. It doesn\'t count. It counts.', 'Breakfast, second breakfast, elevenses, luncheon, tea, dinner, supper. Room for a snack.'], {
    cheerful: ['Ha! Five! And I\'m eyeing up six!'],
    ornery: ['As many as I need. Mind your own plate.'],
    shy: ['...Only three. Four. Small ones.'],
    curious: ['I\'ve counted. Average of six and a half. The half is cheese.'],
    dreamy: ['I don\'t count. It\'s more like one long meal with naps in.'],
    witty: ['Four so far. But the day is young and so is my appetite.'],
    proud: ['A hobbit of my standing keeps a proper table. Seven meals.'],
    gloomy: ['Two. I\'ve been off my food.'],
    child: ['A HUNDRED.'],
  });
  L('pastime.food.recipe', ['...My grandmother\'s. There\'s a pinch of something in it. I\'ll not say what.', '...There is. Written on the back of a hymn book. Nobody else has seen it.'], {
    cheerful: ['Yes! And I\'ll tell you! ...No, I won\'t. Ha! It\'s a secret!'],
    ornery: ['There is. And it stays in the family.'],
    shy: ['*whispering* ...Nutmeg. Just a little. Don\'t tell.'],
    proud: ['Three generations. Folk have offered money.'],
  });
  L('pastime.food.hungry', ['Ha! Then come to supper. I\'ll make it properly.', 'Sorry. Talking about food makes everyone hungry. It\'s the law.'], {
    shy: ['...You could come for supper. If you wanted. It\'s nothing special.'],
    ornery: ['Well, don\'t look at me. ...Oh, all right. Supper\'s at seven.'],
  });
  L('pastime.food.troll', ['A TROLL\'S stew? What was in it? No, don\'t tell me.', 'You never! ...Was it any good?'], {
    curious: ['What was in it? Honestly? I need to know.'],
    witty: ['And did you complain to the cook? Brave.'],
    child: ['Was there a HOBBIT in it?'],
  });
  L('pastime.food.why', ['Ate too much of it the winter I was ill. Never again.', 'My aunt made it every Highday for twenty years. Twenty years.'], {
    witty: ['It looked at me. Food shouldn\'t look at you.'],
  });
  L('pastime.food.best', ['Second breakfast. You\'re awake, the day\'s started, and there\'s no rush.', 'Supper. The day\'s done and nobody wants anything.'], {
    cheerful: ['All of them! But elevenses has cake.'],
    ornery: ['Dinner. A proper sit-down. None of this nibbling.'],
    shy: ['...Afternoon tea. It\'s quiet.'],
    curious: ['Elevenses. It\'s the most argued about. Is it a meal? It\'s a meal.'],
    dreamy: ['Supper by the fire, when it\'s dark outside.'],
    witty: ['The next one.'],
    proud: ['Dinner. With the good plates.'],
    gloomy: ['Breakfast. Before anything\'s gone wrong.'],
    child: ['Pudding! Pudding\'s a meal!'],
  });
  L('pastime.food.onemeal', ['One? ONE? How are you still standing?', 'One meal. No wonder you\'re so tall. You\'re stretching to reach the next.'], {
    witty: ['One meal and a pipe. That\'s not a diet, that\'s a cry for help.'],
    child: ['ONE? Are you ill?'],
  });
  L('pastime.food.feed', ['Ha! Then come to supper and keep it.', 'I\'ll feed you. And watch you every moment.'], {});
  L('pastime.food.elves', ['A song about my {favFoodWord}! Ha! Make it a long one.', 'Elves can keep their songs. They can have a slice, though.'], {});
  L('pastime.food.invite', ['Then come. Thursday. I\'ll do {favFoodWord}. My way.', 'Supper, then. Bring nothing. Just an appetite.'], {
    cheerful: ['Yes! Come! I\'ll make enough for twelve!'],
    shy: ['...Really? ...Thursday?'],
  });

  // ==================================================================================
  // --- Baking at home --------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.baking', about: 'habit', reveals: 'pastime.baking', weight: 1, cool: 4,
    label: 'Something in the oven?',
    when: (F) => F.stage !== 'child' && (habit(F, 'baking') || F.job === 'baker' || F.favFood === 'cake' || F.favFood === 'pie'),
    open: { ask: 'pastime.baking.open' },
    beats: {
      start: { line: 'pastime.baking.start', go: [
        { ap: 'ask', say: 'What do you bake best?', to: 'best' },
        { ap: 'jest', say: 'I heard about the loaf that set off the alarm bell.', to: 'burnt' },
        { ap: 'share', say: 'I baked once. The bread came out hard enough to stop a door. It did, for years.', to: 'wizbread' },
      ] },
      best: { line: 'pastime.baking.best', fx: { learn: ['pastime.baking', '{Name} bakes at home, and is proud of it'] }, go: [
        { ap: 'ask', say: 'What\'s the trick of it?', to: 'trick' },
        { ap: 'warm', say: 'I can smell it from here. Or I\'m imagining it.', to: 'smell' },
      ] },
      burnt: { line: 'pastime.baking.burned', fx: { joke: { k: 'pastime.burnt', t: 'The loaf that was mistaken for a lump of coal.' } }, go: [
        { ap: 'comfort', say: 'Every baker has a black loaf in their past.', to: 'every' },
        { ap: 'jest', say: 'Did anyone eat it?', to: 'ate' },
      ] },
      wizbread: { line: 'pastime.baking.wizbread', go: [
        { ap: 'ask', say: 'Would you show me how it\'s done?', to: 'show', need: { fond: 0.1 }, soft: true },
        { ap: 'jest', say: 'It\'s propping up a gate in Bree to this day.', to: 'end' },
      ] },
      trick: { line: 'pastime.baking.trick', go: [
        { ap: 'warm', say: 'Patience and butter. That\'s most of life.', to: 'end' },
        { ap: 'ask', say: 'Who taught you?', to: 'taught' },
      ] },
      smell: { line: 'pastime.baking.smell', go: [
        { ap: 'warm', say: 'I\'d never refuse.', to: 'loaf' },
        { ap: 'jest', say: 'I\'ll follow my nose to your door.', to: 'end' },
      ] },
      every: { line: 'pastime.baking.every', fx: { fond: 0.02 }, end: true },
      ate: { line: 'pastime.baking.ate', end: true },
      show: { line: 'pastime.baking.show', fx: { promise: { k: 'pastime.bakelesson', t: '{Name} will show you how to bake a proper loaf', days: 10 } }, end: true },
      taught: { line: 'pastime.baking.taught', fx: { trust: 0.02 }, end: true },
      loaf: { line: 'pastime.baking.loaf', fx: { fond: 0.03, owe: -1, note: '{Name} promised you a loaf, warm from the oven.' }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.baking.open', ['Something smells wonderful, {name}. Is that you?', 'Flour on your nose, {name}. Baking?', 'What\'s in the oven, {name}?'], {}, [
    { if: { job: 'baker' }, text: ['Do you bake at home too, {name}, after baking all day?'] },
  ]);
  L('pastime.baking.start', ['Oh, a loaf or two. And something sweet, if there\'s flour.', 'Always something. An oven\'s a sad thing, cold.'], {
    cheerful: ['Yes! Buns! Come back in an hour and there\'ll be buns!'],
    ornery: ['Somebody has to. The Store bread\'s like a brick.'],
    shy: ['...Just a little. For the house.'],
    curious: ['I\'m trying something. Honey instead of sugar. It browns faster. Interesting.'],
    dreamy: ['I love the waiting. The kitchen goes warm and smells like a hug.'],
    witty: ['I bake. Then I eat what I bake. It\'s a closed system.'],
    proud: ['The finest bread on the lane comes out of my oven.'],
    gloomy: ['It keeps the house warm. That\'s something.'],
  }, [
    { if: { job: 'baker' }, pri: 1, text: ['A baker\'s vacation is more baking. Don\'t ask me why. I just love it.'] },
    { if: { season: 'winter' }, text: ['In winter I\'d live in the oven if I could fit.'] },
    { if: { kid: has }, text: ['{Kid} helps. {Kid} helps by eating the dough.'] },
  ]);
  L('pastime.baking.best', ['Seed-cake. My seed-cake has won things.', 'Bread. Plain bread. It\'s the hardest thing to get right.'], {
    cheerful: ['Apple pie! With a lattice! And a pastry mouse on top!'],
    ornery: ['Bread. Not fancy. Proper.'],
    shy: ['...Scones. Folk say they\'re nice.'],
    curious: ['A braided loaf. I\'ve worked out a six-strand braid. It took a week.'],
    dreamy: ['Honey cake. It tastes like a summer afternoon.'],
    witty: ['Anything, the first time. Never the same thing twice. I can\'t remember what I did.'],
    proud: ['My pies. Ask the Harvest Fair.'],
    gloomy: ['Nothing. It\'s all a bit flat.'],
  }, [
    { if: { won: 'the best pie' }, pri: 1, text: ['Pie! I won the best pie at the fair! I\'ve the ribbon on the mantel!'] },
    { if: { favFood: 'cake' }, text: ['Seed-cake. I bake what I love. It\'s only sensible.'] },
  ]);
  L('pastime.baking.burned', ['Ha! Who told you? The smoke came out of the chimney black as a crow.', 'One loaf! One! I was reading. It was a very good book.'], {
    cheerful: ['Ha! It was SO black! We used it as a doorstop!'],
    ornery: ['The oven was too hot. It wasn\'t me.'],
    shy: ['...Oh no. Everyone knows?'],
    curious: ['I\'ve worked out what happened. The oven has a hot corner. I\'ve marked it.'],
    witty: ['It wasn\'t burned. It was very thoroughly baked. There\'s a difference.'],
    proud: ['A single error in a long career.'],
    gloomy: ['That\'s what I\'m known for now. The burnt loaf.'],
  });
  L('pastime.baking.wizbread', ['Ha! A door-stop! What did you do to it?', 'You baked? You? With those hands?'], {
    cheerful: ['Ha! Oh, I\'d have loved to see that!'],
    ornery: ['Typical. Wizards. All fireworks and no flour.'],
    curious: ['Too much flour? Not enough water? Did you knead it? You didn\'t knead it, did you.'],
    witty: ['A bread you can stop doors with. That\'s not a failure. That\'s an invention.'],
    proud: ['Some of us have the gift.'],
  });
  L('pastime.baking.trick', ['Patience. And butter. Mostly butter.', 'Warm hands, cool kitchen, and never open the oven to look.'], {
    curious: ['Temperature. Everything is temperature. And timing. And luck.'],
    proud: ['Experience. There\'s no trick. Just years.'],
    witty: ['Don\'t tell the dough you\'re in a hurry. It knows.'],
  });
  L('pastime.baking.smell', ['Ha! You\'re imagining it. But there\'ll be a loaf for you on your way out.', 'Come back at four. You\'ll not be imagining it then.'], {
    shy: ['...I could save you some.'],
  });
  L('pastime.baking.every', ['Do they? ...That\'s a comfort.', 'Ha! Even the baker? Even the baker. I feel better.'], {});
  L('pastime.baking.ate', ['The dog. He was never the same.', 'The ducks. Very slowly. Over a week.'], {
    witty: ['The pig. He gave it four stars.'],
  });
  L('pastime.baking.show', ['Come by on Trewsday. Bring an apron. Bring humility.', 'I will. And you\'ll do it right this time.'], {});
  L('pastime.baking.taught', ['My mom. Flour to the elbows, singing.', 'My gran. She never measured anything. Neither do I.'], {
    proud: ['I taught myself. Then I taught the miller\'s wife.'],
  });
  L('pastime.baking.loaf', ['Then you\'ll have one. Warm. Don\'t eat it all on the road.', 'A loaf for the wizard. I\'ll make it a big one.'], {
    cheerful: ['Two loaves! And a bun for the horse!'],
  });

  // --- Their turn: try this -----------------------------------------------------------
  addThread({
    id: 'pastime.taste', theirs: true, about: 'food', label: 'Try this!', cool: 4,
    ask: '{Name} pushes a warm parcel wrapped in a cloth into your hands.',
    when: (F) => F.stage !== 'child' && (habit(F, 'baking') || F.job === 'baker') && F.met,
    beats: {
      start: { line: 'pastime.taste.start', go: [
        { ap: 'warm', say: '*You taste it.* Oh. Oh, that\'s wonderful.', label: 'Taste it, and say it\'s wonderful', to: 'wonderful' },
        { ap: 'ask', say: '*You taste it.* What\'s that flavor? I can\'t place it.', label: 'Taste it, and ask what\'s in it', to: 'whatsin' },
        { ap: 'jest', say: '*You taste it, then a second piece, then a third.* I\'m checking.', label: 'Taste it. Then more of it', to: 'checking' },
      ] },
      wonderful: { line: 'pastime.taste.wonderful', fx: { fond: 0.03 }, end: true },
      whatsin: { line: 'pastime.taste.whatsin', fx: { trust: 0.02 }, end: true },
      checking: { line: 'pastime.taste.checking', fx: { fond: 0.03, joke: { k: 'pastime.checking', t: 'The wizard checking the cake. Three times.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.taste.start', ['Go on. Try it. I want an honest opinion. Well. Honest-ish.', 'Fresh from the oven. Taste it. Then tell me it\'s good.'], {
    cheerful: ['Try it! It\'s new! It\'s got raisins! And joy!'],
    ornery: ['Eat that. And don\'t tell me it needs salt.'],
    shy: ['...I made it. You don\'t have to eat it.'],
    curious: ['New recipe. I want to know if you can taste the secret.'],
    dreamy: ['It\'s honey cake. From the hives by the orchard. Try it in the sun.'],
    witty: ['Eat it before the children smell it. They can smell a cake through a hill.'],
    proud: ['My best. Taste that, and then tell me about elvish bread.'],
    gloomy: ['It\'s probably gone wrong. Try it anyway.'],
  });
  L('pastime.taste.wonderful', ['Really? Wonderful? I\'ll make you another!', '*They beam.* I knew it! I KNEW it!'], {
    ornery: ['...Hm. Good. That\'s good.'],
    shy: ['*They go pink and look very pleased.*'],
    gloomy: ['...Really? ...Oh, that\'s nice.'],
  });
  L('pastime.taste.whatsin', ['Cardamom. A traveler left some at the Badger. I\'ve been rationing it.', 'A bit of orange peel. Dried. Don\'t tell.'], {
    curious: ['You CAN taste it! It\'s lemon thyme! I knew it would come through!'],
    proud: ['That would be telling.'],
  });
  L('pastime.taste.checking', ['Ha! You\'ll check it all away! Give that back!', '*They snatch back the cloth, laughing.* That\'s quite enough checking!'], {
    ornery: ['Oi! That was for the house!'],
    witty: ['Very thorough. I\'ll send you the bill.'],
  });

  // ==================================================================================
  // --- Games on the green: skittles and skimming stones -------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.games', about: 'games', reveals: 'pastime.games', weight: 0.9, cool: 4,
    label: (F) => (F.stage === 'child' ? 'Fancy skimming stones?' : 'A game of skittles?'),
    when: (F) => playsOnGreen(F) && F.season !== 'winter' && F.weather !== 'rain',
    open: { jest: 'pastime.games.open' },
    beats: {
      start: { line: 'pastime.games.start', go: [
        { ap: 'jest', say: 'I challenge you. Best of three.', to: 'challenge' },
        { ap: 'ask', say: 'Who\'s the best on the green?', to: 'best' },
        { ap: 'ask', say: 'What\'s the furthest you\'ve ever skimmed a stone?', to: 'skim' },
      ] },
      challenge: { line: 'pastime.games.challenge', go: [
        { ap: 'jest', say: '*You throw with a great flourish.*', label: 'Throw with a great flourish', to: 'flourish' },
        { ap: 'warm', say: '*You throw carefully, and well.*', label: 'Throw carefully', to: 'careful' },
        { ap: 'listen', say: '*You let them go first, and watch how it\'s done.*', label: 'Let them go first', to: 'theirgo' },
      ] },
      best: { line: 'pastime.games.best', fx: { learn: ['pastime.games', '{Name} likes a game on the green'] }, go: [
        { ap: 'ask', say: 'And is there a rule nobody can agree on?', to: 'rule' },
        { ap: 'jest', say: 'I\'ll come and beat them all.', to: 'beatall' },
      ] },
      skim: { line: 'pastime.games.skim', go: [
        { ap: 'tale', say: 'I once skimmed a stone across the Brandywine. It\'s still going.', to: 'brandywine' },
        { ap: 'ask', say: 'What\'s the trick of it?', to: 'trick' },
      ] },
      flourish: { line: 'pastime.games.flourish', fx: { joke: { k: 'pastime.hens', t: 'The wizard\'s throw that went into the hens.' } }, go: [
        { ap: 'jest', say: 'I was aiming for the hens. Practice.', to: 'hens' },
        { ap: 'warm', say: 'Your go. Show me how it\'s done.', to: 'theirgo' },
      ] },
      careful: { line: 'pastime.games.careful', go: [
        { ap: 'jest', say: 'Beginner\'s luck. Three hundred years of it.', to: 'luck' },
        { ap: 'warm', say: 'Your throw. Beat that.', to: 'theirgo' },
      ] },
      theirgo: { line: 'pastime.games.theirgo', go: [
        { ap: 'warm', say: 'You win. Fair and square.', to: 'win' },
        { ap: 'jest', say: 'Was that a foot over the line?', to: 'foot' },
      ] },
      rule: { line: 'pastime.games.rule', end: true },
      beatall: { line: 'pastime.games.beatall', fx: { promise: { k: 'pastime.green', t: '{Name} expects you on the green for a game', days: 5 } }, end: true },
      brandywine: { line: 'pastime.games.brandywine', fx: { fond: 0.02 }, end: true },
      trick: { line: 'pastime.games.trick', end: true },
      hens: { line: 'pastime.games.hens', end: true },
      luck: { line: 'pastime.games.luck', end: true },
      win: { line: 'pastime.games.win', fx: { fond: 0.03, feel: 'won', feelX: 'against the wizard' }, end: true },
      foot: { line: 'pastime.games.foot', fx: { fond: 0.01 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.games.open', ['I hear you\'re a terror at skittles, {name}.', 'Fancy a game on the green, {name}? I\'m very good. I\'m told.', 'They say nobody skims a stone like you, {name}. I doubt it.'], {}, [
    { if: { stage: 'child' }, text: ['Bet I can skim a stone further than you, {name}.'] },
  ]);
  L('pastime.games.start', ['A game? Oh, go on. Just the one.', 'Skittles! Now you\'re talking.'], {
    cheerful: ['YES! A game! Oh, I love a game!'],
    ornery: ['I\'m the best on the green. Ask anyone. They\'ll grumble, but ask.'],
    shy: ['...I\'m not very good. But all right.'],
    curious: ['I\'ve been working out the angles. If you hit the front pin just left of center...'],
    dreamy: ['I like the sound. The clatter. Like a roof in the rain.'],
    witty: ['A game against a wizard? I\'ll want it in writing that magic\'s not allowed.'],
    proud: ['You\'ve chosen your opponent poorly, wizard.'],
    gloomy: ['I\'ll lose. But all right.'],
    child: ['YES! Skimming! I can do FIVE!', 'Me first! Me first!'],
  }, [
    { if: { stage: 'elder' }, text: ['My arm\'s not what it was. My aim is better than ever.'] },
  ]);
  L('pastime.games.challenge', ['Best of three! Ha! You\'re on. Mind the hens.', 'Done. Loser buys the first round at the Badger.'], {
    cheerful: ['You\'re on! Ha! This\'ll be good!'],
    ornery: ['Best of three. No magic. No standing on the line.'],
    shy: ['...All right. Go easy.'],
    curious: ['Best of three. I\'ll be watching your technique.'],
    witty: ['Best of three. Then best of five when I lose the first two.'],
    proud: ['Prepare to be humbled.'],
    gloomy: ['Best of three. I\'ll lose all three.'],
    child: ['BEST OF A HUNDRED!'],
  });
  L('pastime.games.best', ['The old miller. Seventy and throws like a youngster.', 'Me, on a good day. Somebody else on a bad one.'], {
    cheerful: ['Everyone\'s best at something! I\'m best at cheering!'],
    ornery: ['Me. And anyone who says otherwise is cheating.'],
    shy: ['...Not me.'],
    curious: ['The herder. Big hands. Low throw. It\'s all in the follow-through.'],
    witty: ['The hens. They knock everything over.'],
    proud: ['Me. Without question.'],
    child: ['ME. ...Or my friend. Mostly my friend.'],
  }, [
    { if: { rival: has }, pri: 1, text: ['{Rival} thinks it\'s {rival}. {Rival} is wrong.'] },
  ]);
  L('pastime.games.skim', ['Seven skips. On a still day. Nobody believed me.', 'Five, and a plop. The plop doesn\'t count.'], {
    cheerful: ['Nine! Nine skips! The ducks all cheered! Well, quacked.'],
    ornery: ['Eight. And I had witnesses. Who\'ve since moved away.'],
    shy: ['...Four. Once.'],
    curious: ['Six. But I\'ve worked out it\'s all in the spin. And the angle. Twenty degrees.'],
    dreamy: ['I don\'t count. I just watch the rings.'],
    witty: ['Eleven. It might have been a frog jumping. I\'m counting it.'],
    proud: ['Ten. Nobody\'s matched it.'],
    gloomy: ['Mine sink.'],
    child: ['A HUNDRED! ...Three!'],
  });
  L('pastime.games.flourish', ['*Your ball sails gloriously over the pins and into the hen-run.* ...The hens are not pleased.', '*It goes left. Very left. A hen rises up in protest.*'], {
    cheerful: ['Ha! Oh! The hens! HA!'],
    ornery: ['That\'s a hen down. That counts against you.'],
    shy: ['*They cover their mouth, shoulders shaking.*'],
    witty: ['A strike! On the hens. Six hens. A personal best.'],
    proud: ['Hm. A flourish isn\'t a technique.'],
    child: ['YOU HIT A HEN! Do it again!'],
  });
  L('pastime.games.careful', ['*Seven pins go down.* ...Hm. Not bad. For a wizard.', '*A clean throw. Six down.* ...Beginner\'s luck.'], {
    ornery: ['Seven. Lucky. Very lucky.'],
    proud: ['Hm. Respectable.'],
    child: ['SEVEN! How did you do that?'],
  });
  L('pastime.games.theirgo', ['*They take a breath, throw, and the pins go down like wheat.* HA! Nine!', '*A wobbly throw that somehow takes out eight.* ...I meant that.'], {
    cheerful: ['*All nine go down and they leap in the air.* NINE! Did you see? NINE!'],
    ornery: ['*A low, mean throw. Eight down.* There.'],
    shy: ['*A small throw that clips one pin, which knocks all the others down.* ...Oh!'],
    curious: ['*They throw with a strange spin. The ball curls in from the left.* Nine. The angle works!'],
    proud: ['*A perfect throw. Nine.* As I said.'],
    gloomy: ['*Three pins.* ...Told you.'],
    child: ['*A stone goes skip, skip, skip, skip, plop.* FOUR! I did FOUR!'],
  });
  L('pastime.games.rule', ['Whether you can stand on the line. Folk have stopped speaking over it.', 'Whether a hen counts. It\'s been argued since my granddad\'s day.'], {
    witty: ['Whether the pins can be moved by the wind. I say yes. Everyone else says I\'m cheating.'],
  });
  L('pastime.games.beatall', ['Ha! Come on Highday. Bring your own ball.', 'You\'re on. Highday afternoon. The green. Don\'t be late.'], {
    ornery: ['You\'ll try.'],
  });
  L('pastime.games.brandywine', ['Still going! Ha! Across the Brandywine!', 'The Brandywine? That\'s a whole river! ...Is it really still going?'], {
    child: ['Is it REALLY still going? Where is it now?'],
    witty: ['Then it\'s the best skim in history. Or the worst lie. Both, I expect.'],
  });
  L('pastime.games.trick', ['Flat stone. Low throw. Flick of the wrist.', 'A good flat one, side-arm, and you have to mean it.'], {
    curious: ['The spin keeps it level. The angle, about twenty degrees. And the stone. It\'s mostly the stone.'],
    child: ['You throw it FLAT. Like a pancake.'],
  });
  L('pastime.games.hens', ['Practice for what? Hen-skittles?', 'Ha! The hens are not your opponents!'], {});
  L('pastime.games.luck', ['Three hundred years of beginner\'s luck. Ha!', 'Luck. Is that what you call it.'], {});
  L('pastime.games.win', ['I BEAT THE WIZARD! Oh, I\'m telling everyone!', 'Fair and square? ...You let me win. Didn\'t you. ...I don\'t care. I WON.'], {
    ornery: ['Course I did.'],
    shy: ['...Really? I won?'],
    proud: ['Naturally.'],
    child: ['I WON! I WON AGAINST A WIZARD!'],
  });
  L('pastime.games.foot', ['It was NOT. ...It might have been. A toe.', 'My foot is my business.'], {
    ornery: ['How dare you.'],
    witty: ['That was a different foot. I have two.'],
    child: ['NO it WASN\'T. ...Maybe a bit.'],
  });

  // --- Their turn: a bet on the stones --------------------------------------------------
  addThread({
    id: 'pastime.bet', theirs: true, about: 'games', label: 'A bet on the stones', cool: 4,
    ask: '{Name} picks up a flat stone and weighs it in {their} hand, grinning at you.',
    when: (F) => (F.stage === 'child' ? F.band === 'school' || F.band === 'youth' : F.temper === 'cheerful' || F.temper === 'witty' || F.temper === 'proud') && F.weather !== 'rain' && F.season !== 'winter' && F.met,
    beats: {
      start: { line: 'pastime.bet.start', go: [
        { ap: 'jest', say: 'A bet? What are the stakes?', to: 'stakes' },
        { ap: 'warm', say: 'Go on, then. You first.', to: 'throw' },
      ] },
      stakes: { line: 'pastime.bet.stakes', go: [
        { ap: 'jest', say: 'Done. *You throw.*', label: 'Done. Throw', to: 'throw' },
        { ap: 'warm', say: 'Make it a squib, if I lose. A small one.', to: 'squib' },
      ] },
      throw: { line: 'pastime.bet.throw', fx: { fond: 0.02 }, end: true },
      squib: { line: 'pastime.bet.squib', fx: { fond: 0.02 }, end: true },
    },
  });
  L('pastime.bet.start', ['Bet I can skim this further than you.', 'A bet, wizard. One stone each. Most skips wins.'], {
    cheerful: ['Bet you a bun I can beat you!'],
    witty: ['A wager, wizard. Stone against stone. No magic, or I\'ll know.'],
    proud: ['I\'ll wager you can\'t match my best.'],
    child: ['Bet I can skim further than you! BET!'],
  });
  L('pastime.bet.stakes', ['A bun. If I win, you buy me a bun. If you win, I\'ll... say you\'re good.', 'Loser carries the winner\'s basket home.'], {
    witty: ['If I win, you tell everyone I won. If you win, you tell nobody.'],
    child: ['If I win you do a firework! If you win... I\'ll do a firework. I can\'t.'],
  });
  L('pastime.bet.throw', ['*Their stone skips six times. Yours skips five, then sinks with a sulky plop.* HA!', '*Yours skips seven. Theirs skips seven. You look at each other.* ...A draw. A DRAW.'], {
    cheerful: ['*Theirs goes four. Yours goes nine.* ...Oh, that\'s not fair! Again!'],
    proud: ['*Theirs goes eight. Yours goes eight.* ...Hm. Rematch.'],
    child: ['*Theirs goes three. Yours goes three, on purpose.* A DRAW! We\'re the SAME!'],
  });
  L('pastime.bet.squib', ['A squib! Ha! Deal! ...I hope you lose.', 'Done! Now throw badly. Please.'], {
    child: ['YES! A SQUIB! Throw it into the pond! Lose! LOSE!'],
  });

  // ==================================================================================
  // --- Passing the time: a light word about doing nothing ------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.idle', light: true, ap: 'share', label: 'Pass the time idly', open: { share: 'pastime.idle.open' },
    beats: {
      start: { line: 'pastime.idle.reply', go: [
        { ap: 'ask', say: 'And what would you do with a whole free day?', to: 'freeday' },
        { ap: 'jest', say: 'I\'m considering doing even less this afternoon.', to: 'less' },
      ] },
      freeday: { line: 'pastime.idle.freeday', end: true },
      less: { line: 'pastime.idle.less', end: true },
    },
    end: { fond: 0.015 },
  });
  L('pastime.idle.open', ['I\'ve done nothing at all this morning, {name}. Very satisfying.', 'I\'ve been watching the clouds, {name}. One looked like a pie.', 'I sat on a wall for an hour, {name}. Splendid wall.'], {}, []);
  L('pastime.idle.reply', ['Nothing\'s the best thing to do. Folk don\'t do enough of it.', 'Ha! I\'m an expert at nothing. Ask anyone.'], {
    cheerful: ['Oh, I love doing nothing! I\'m very good at it!'],
    ornery: ['Some of us have work to do.'],
    shy: ['...That sounds nice.'],
    curious: ['A pie? What kind of pie? Which cloud?'],
    dreamy: ['I saw one like a ship this morning. Sailing west.'],
    witty: ['Nothing\'s harder than it looks. You have to really commit.'],
    proud: ['I don\'t have time for nothing. I make time for something.'],
    gloomy: ['I do a lot of nothing. It\'s not as fun as it sounds.'],
    child: ['I did nothing too! I did it all day! Mom said stop doing nothing!'],
  });
  L('pastime.idle.freeday', ['Sleep late, eat early, and sit in the sun with my feet up.', 'Fish, nap, eat, nap, fish. In that order.'], {
    cheerful: ['Everything! A picnic! A swim! A dance! Two picnics!'],
    ornery: ['Nothing. With nobody. In peace.'],
    shy: ['...Read. All day. Under a tree.'],
    curious: ['Walk to the end of the river, to see where it goes.'],
    dreamy: ['Lie in the meadow and watch the whole sky go by.'],
    witty: ['I\'d waste it beautifully. I\'d frame it.'],
    proud: ['I\'d finish something grand.'],
    gloomy: ['I\'d probably just sit. Like always.'],
    child: ['Eat cake for breakfast! And dinner! And breakfast again!'],
  }, [
    { if: { pastime: has }, text: ['{PastimeWord}. All day. From dawn. Nobody calling me in.'] },
    { if: { favFood: has }, text: ['Eat {favFoodWord}. At every one of the meals. All seven.'] },
  ]);
  L('pastime.idle.less', ['Less than nothing? That\'s ambitious.', 'Ha! I\'ll try to keep up.'], {
    witty: ['Less than nothing. You\'ll go backwards. You\'ll wake up yesterday.'],
    ornery: ['Must be nice.'],
    child: ['You can\'t do LESS than nothing! ...Can you?'],
  });

  // --- More ways of saying it: registers, moods, weather and the rift-born ---------------
  const M = (key, rules) => lines(key, guard(rules));
  M('pastime.reading.start', [
    { if: { register: 'fine' }, text: ['I\'m re-reading the Annals of the Westfarthing. Volume three. It improves on acquaintance.'] },
    { if: { register: 'bright' }, text: ['I\'m reading EVERYTHING. I read the back of the flour sack this morning. It was quite good.'] },
    { if: { mood: 'merry' }, text: ['I\'ve just got to the bit where they find the treasure! I\'m so happy I could burst!'] },
    { if: { mood: ['low', 'miserable'] }, text: ['I\'ve been hiding in books lately. They\'re kinder than days.'] },
    { if: { season: 'winter' }, text: ['Winter\'s for reading. Long nights, a candle, and somebody else\'s adventure.'] },
  ]);
  M('pastime.reading.kind', [
    { if: { register: 'fine' }, text: ['Histories. Genealogies. One can trace half the Shire back to three families.'] },
    { if: { register: 'bright' }, text: ['Facts! Did you know a snail can sleep for three years? I read that!'] },
  ]);
  M('pastime.stroll.start', [
    { if: { register: 'fine' }, text: ['A constitutional. Round the pond and back by the mill. It aids the digestion.'] },
    { if: { register: 'plain' }, text: ['Just walkin\'. Stretchin\' me legs.'] },
    { if: { mood: 'merry' }, text: ['Isn\'t it a day for it! I\'ve been round twice already!'] },
    { if: { mood: ['low', 'miserable'] }, text: ['Walking helps. A bit. You can\'t think so hard when your feet are moving.'] },
    { if: { weather: 'snow' }, text: ['In the snow! Look, my footprints are the only ones. I\'m the first person in the world.'] },
  ]);
  M('pastime.nap.start', [
    { if: { register: 'fine' }, text: ['A brief repose after luncheon. The physicians recommend it. Well. I recommend it.'] },
    { if: { register: 'plain' }, text: ['Forty winks. Fifty. Who\'s countin\'.'] },
    { if: { mood: 'merry' }, text: ['Best nap of my life! I dreamed of pies and woke up to bees!'] },
    { if: { season: 'summer' }, text: ['In this heat? A nap is the only sensible thing a hobbit can do.'] },
  ]);
  M('pastime.tea.start', [
    { if: { register: 'plain' }, text: ['Tea. Strong. Brown. Hot. That\'s all it needs to be.'] },
    { if: { mood: 'merry' }, text: ['Tea! The kettle\'s singing and so am I!'] },
    { if: { mood: ['low', 'miserable'] }, text: ['I\'ve had six cups. They help. A little. Each one a little.'] },
    { if: { rift: true }, text: ['Back home it was synth-caff in a tube. This is leaves in hot water and it\'s better. How?'] },
    { if: { stage: 'elder' }, text: ['Seventy years of four o\'clock tea. I\'ve not missed one. Not even the year of the flood.'] },
  ]);
  M('pastime.food.start', [
    { if: { register: 'fine' }, text: ['{FavFoodWord}, I confess. Properly prepared, it\'s a dish fit for the Thain.'] },
    { if: { register: 'plain' }, text: ['{FavFoodWord}. Every day if I could. Twice.'] },
    { if: { mood: ['low', 'miserable'] }, text: ['{FavFoodWord}. It\'s the only thing that\'s cheered me this week.'] },
    { if: { rift: true }, text: ['{FavFoodWord}! Real food! Back home it was protein bars and noodles from a machine.'] },
    { if: { stage: 'elder' }, text: ['{FavFoodWord}. My mother\'s way. I\'ve never had it right since she went.'] },
  ]);
  M('pastime.food.meals', [
    { if: { register: 'fine' }, text: ['Breakfast, a second breakfast, elevenses, luncheon, afternoon tea, dinner and supper. One keeps a proper table.'] },
    { if: { register: 'plain' }, text: ['Four? I\'ve had six. Don\'t tell nobody.'] },
    { if: { rift: true }, text: ['SEVEN meals? Back home we had one, standing up. I\'ve gained a stone. I\'m so happy.'] },
  ]);
  M('pastime.baking.start', [
    { if: { register: 'fine' }, text: ['A little light baking. Shortbread, a braided loaf. One finds it restful.'] },
    { if: { register: 'plain' }, text: ['Bread. Always bread. And a pie Highdays.'] },
    { if: { mood: 'merry' }, text: ['I\'ve made buns! Twelve! There are nine left! There were twelve!'] },
    { if: { weather: 'rain' }, text: ['A rainy day is a baking day. The kitchen windows steam up and the world goes away.'] },
  ]);
  M('pastime.games.start', [
    { if: { register: 'fine' }, text: ['Skittles? I\'m considered something of a player. In a small way.'] },
    { if: { register: 'plain' }, text: ['Skittles! Now yer talkin\'. Loser buys.'] },
    { if: { mood: 'merry' }, text: ['A game! Yes! I feel lucky today! I feel VERY lucky!'] },
    { if: { mood: ['low', 'miserable'] }, text: ['A game? ...All right. It might help.'] },
    { if: { rift: true }, text: ['We had games back home but they were all on screens. You throw a real ball here. With your arm.'] },
  ]);
});
