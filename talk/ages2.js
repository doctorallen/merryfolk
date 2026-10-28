'use strict';
// ---------------------------------------------------------------------------
// The ages of life, part two: growing up and getting on. Youngsters nearly
// come of age, choosing a trade, a first love, wanting the road; young
// grown-ups in a home of their own, with a dream to chase; the middle-aged,
// busy, worried, settled, and wondering if it's how they thought it would
// be. Youngsters' lines turn on their nature (ageNature, set in ages.js),
// since every child's temper reads as 'child'.
// ---------------------------------------------------------------------------

talkPack('ages2', () => {
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
  const young = (F) => F.ageBand === 'youth' || F.ageBand === 'young';

  addFacts((v, F) => {
    F.ageRiftFolk = Game.villagers.some((o) => o.isRiftborn && o.isRiftborn() && !o.leaving);
    F.ageBrave = v.genes.bravery > 0.6;
  });

  // ==================================================================================
  // Coming of age
  // ==================================================================================
  addThread({
    id: 'ages.comingofage', label: 'Nearly grown, then?', weight: 1.3, cool: 4,
    when: (F) => F.ageBand === 'youth',
    rel: (F) => (F.ageToGo <= 5 ? 1.8 : 1.1),
    open: { ask: 'ages.coming.open' },
    beats: {
      start: { line: 'ages.coming.start', go: [
        { ap: 'ask', say: 'What will you do first, when you\'re grown?', to: 'first' },
        { ap: 'jest', say: 'Thirty-three. A great age. Nearly as old as my second-best hat.', to: 'hat' },
        { ap: 'ask', say: 'Are you looking forward to it?', to: 'nerves' },
      ] },
      first: { line: 'ages.coming.first', go: [
        { ap: 'ask', say: 'And the party? What would make it perfect?', to: 'party' },
        { ap: 'advise', say: 'Take your time. Grown lasts a long while.', to: 'time' },
      ] },
      hat: { line: 'ages.coming.hat', go: [
        { ap: 'ask', say: 'Seriously, though. What will you do first?', to: 'first' },
        { ap: 'ask', say: 'And the party? What would make it perfect?', to: 'party' },
      ] },
      nerves: { line: 'ages.coming.nerves', go: [
        { ap: 'ask', say: 'What frightens you about it?', to: 'fear', need: { open: 1 }, soft: true },
        { ap: 'comfort', say: 'Nobody feels grown on the day. Not even me.', to: 'nobody' },
        { ap: 'ask', say: 'And the party? What would make it perfect?', to: 'party' },
      ] },
      party: { line: 'ages.coming.party', go: [
        { ap: 'jest', say: 'I might find a rocket or two. Small ones. Medium.', to: 'rocket' },
        { ap: 'ask', say: 'And after the party? Who will you be?', to: 'dear' },
      ] },
      time: { line: 'ages.coming.time', go: [
        { ap: 'ask', say: 'What will you hold dear, do you think?', to: 'dear' },
        { ap: 'warm', say: 'You\'ll make a fine grown-up. I can tell.', to: 'fine' },
      ] },
      fear: { line: 'ages.coming.fear', fx: { trust: 0.03, confide: { k: 'ages.comingfear', t: '{Name} is nervous about growing up' } }, go: [
        { ap: 'comfort', say: 'Nobody feels grown on the day. Not even me.', to: 'nobody' },
        { ap: 'share', say: 'I was young once. I made a terrible mess of it. It came right.', to: 'mess' },
      ] },
      nobody: { line: 'ages.coming.nobody', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'What will you hold dear, do you think?', to: 'dear' },
        { ap: 'warm', say: 'You\'ll make a fine grown-up. I can tell.', to: 'fine' },
      ] },
      dear: { line: 'ages.coming.dear', go: [
        { ap: 'advise', say: 'Hold on to home. It holds on back.', to: 'home' },
        { ap: 'advise', say: 'Keep an eye on the wide world. And the rift-folk.', to: 'wide', need: { if: { ageRiftFolk: true } } },
        { ap: 'advise', say: 'Keep an eye on the wide world. It\'s bigger than the hills.', to: 'wide', need: { if: { ageRiftFolk: false } } },
      ] },
      rocket: { line: 'ages.coming.rocket', fx: { fond: 0.03, joke: { k: 'ages.rocket', t: 'A rocket or two for the coming of age. Small ones. Medium.' } }, end: true },
      fine: { line: 'ages.coming.fine', fx: { fond: 0.02 }, end: true },
      mess: { line: 'ages.coming.mess', fx: { trust: 0.03, fond: 0.02 }, end: true },
      home: { line: 'ages.coming.home', fx: { lean: 'hill', respect: 0.02 }, end: true },
      wide: { line: 'ages.coming.wide', fx: { lean: 'rift', respect: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.coming.open', [
    { text: ['Nearly grown now, {name}. How does it feel?', 'Not long till you come of age, {name}.', 'You\'ve shot up, {name}. When do you come of age?'] },
  ]);
  L('ages.coming.start', {
    _: ['{AgeToGoWord} years to go. I\'m counting. Everyone\'s counting.', 'Not long now. {AgeToGoWord} years. That\'s practically tomorrow.'],
    'k:cheerful': ['{AgeToGoWord} years! And then I\'m grown and I can have pudding whenever I want!', 'Only {ageToGoWord} years! I\'ve already planned my party. Twice.'],
    'k:ornery': ['{AgeToGoWord} years. And then nobody can tell me what to do. Ever.', 'Everyone keeps asking. {AgeToGoWord} years. Stop asking.'],
    'k:shy': ['...{AgeToGoWord} years. I try not to think about it.', 'Oh. Um. {AgeToGoWord} years, I think. It\'s a lot of people looking at you, coming of age.'],
    'k:curious': ['{AgeToGoWord} years. I\'ve been asking everyone what it felt like. Nobody remembers properly.', 'Thirty-three\'s an odd number to pick. Who picked it? Do you know?'],
    'k:gloomy': ['{AgeToGoWord} years. Then I have to be sensible for ever.', 'It feels a long way off and too close at the same time.'],
  }, [
    { if: { ageToGo: { max: 3 } }, pri: 1, text: ['{AgeToGoWord} years! It\'s nearly here! I can\'t sleep for thinking about it!', 'Hardly any time! I keep looking in the glass for a grown-up. It\'s still just me.'] },
    { if: { register: 'bright' }, text: ['{AgeToGoWord} years. I\'ve read that hobbits come of age later than Big Folk. I think we\'re right.'] },
    { if: { rift: true }, text: ['{AgeToGoWord} years. Back home you came of age when your implant updated. Here there\'s cake.'] },
  ]);
  L('ages.coming.first', {
    _: ['Stay up as late as I like. Then go to bed early anyway, because I can.', 'Get my own pipe. A long one. Like yours.'],
    'k:cheerful': ['Throw the biggest party Thistledown\'s ever seen! With presents for everyone!', 'Dance at the Badger! All night! Grown-ups are allowed!'],
    'k:ornery': ['Eat what I want, when I want. Starting with dessert.', 'Move my bed. Mom says it stays where it is. It won\'t.'],
    'k:shy': ['...Have a room to myself, maybe. With a door that shuts.', 'Choose my own seat at the Moot. At the back.'],
    'k:curious': ['Go to Bree. Just to see. I\'ve heard there are Big Folk there taller than doors.', 'Read every book in the Hall. Even the dull ones. Especially the dull ones.'],
    'k:gloomy': ['Work, probably. That\'s what grown-ups do. Work and worry.', 'I don\'t know. Nothing feels like it\'ll change.'],
  }, [
    { if: { pastime: (p) => !!p }, text: ['Do {pastimeWord} all day without anyone calling me in for supper.'] },
    { if: { rift: true }, text: ['Get my own deck. A real one. With full access.'] },
    { if: { ageBrave: true }, text: ['Go over the hills. Just for a day. Just to see what\'s there.'] },
  ]);
  L('ages.coming.hat', {
    _: ['Ha! Your second-best hat is older than the village!', 'Ha! What\'s your best hat like, then?'],
    'k:cheerful': ['Ha! Can I have your second-best hat for my party?', 'Ahaha! How old\'s your first-best hat?'],
    'k:ornery': ['That\'s not funny. ...It\'s a bit funny.', 'Thirty-three isn\'t old. Your hat\'s old.'],
    'k:shy': ['...Ha. That\'s silly.', 'Hee. Your hat.'],
    'k:curious': ['How old IS your hat? Exactly? Do hats count years?', 'Is it the same hat? Has it ever been washed?'],
    'k:gloomy': ['Then I\'ll be as old as a hat. Wonderful.', 'Ha. Great. Old as a hat.'],
  });
  L('ages.coming.nerves', {
    _: ['Yes. No. Both. Is that allowed?', 'I am. I think. Some days I\'m not.'],
    'k:cheerful': ['YES! I\'ve wanted to be grown since I was six!', 'Oh, so much! Everything will be new!'],
    'k:ornery': ['Course I am. Then nobody can tell me off.', 'Why wouldn\'t I be? Being young is the worst.'],
    'k:shy': ['...I\'m a bit scared, actually. Everyone looks at you.', 'Not really. I like being young. Nobody expects much.'],
    'k:curious': ['I want to know what it feels like. Do you feel different the next morning?', 'I\'m curious more than looking forward. Is that strange?'],
    'k:gloomy': ['No. Grown-ups are always tired.', 'Not really. It means the fun bit\'s over.'],
  });
  L('ages.coming.party', {
    _: ['Fireworks. Obviously. Real ones. The kind you do.', 'Everyone I like, a long table, and a cake the size of a cartwheel.'],
    'k:cheerful': ['FIREWORKS! And a band! And a whole roast pig and a cake shaped like a dragon!', 'Everyone in the village! Even the grumpy ones! Especially them!'],
    'k:ornery': ['Nobody making speeches. Just food and fireworks.', 'A party where I choose the music. For once.'],
    'k:shy': ['...A small one. Just family. And maybe one firework.', 'Somewhere quiet. With the people who matter. Not everyone.'],
    'k:curious': ['Something nobody\'s done before. A party on the river? Can you do a party on the river?', 'Fireworks that do something new. Do yours do anything new?'],
    'k:gloomy': ['It\'ll rain. It always rains on parties.', 'Something nobody makes a fuss about.'],
  }, [
    { if: { ageRiftFolk: true }, text: ['A party with neon AND fireworks. Hill and rift. Everyone.'] },
  ]);
  L('ages.coming.time', {
    _: ['Grown lasts a long while. Hm. I hadn\'t thought of it like that.', 'A long while. Is it long? It goes fast, folk say.'],
    'k:cheerful': ['Ooh. Then I\'ll enjoy every bit of the in-between!'],
    'k:ornery': ['Everyone tells me to wait. I\'m tired of waiting.'],
    'k:shy': ['...Good. I\'m not in a hurry.'],
    'k:curious': ['How long does it last, for a wizard? Does grown ever end?'],
    'k:gloomy': ['A long while of being tired. Lovely.'],
  });
  L('ages.coming.fear', {
    _: ['Choosing wrong. A trade, a hole, a... someone. And being stuck with it.', 'That I\'ll be grown and still not know anything.'],
    'k:cheerful': ['Nothing! Well. That I won\'t get to play any more. Do grown-ups play?'],
    'k:ornery': ['That I\'ll turn into my dad. Don\'t tell him I said that.'],
    'k:shy': ['...Having to talk to everyone. At the party. And after. All the time.'],
    'k:curious': ['That I\'ll stop wondering about things. Grown-ups don\'t wonder. Have you noticed?'],
    'k:gloomy': ['That it won\'t feel any different, and I\'ll still be me.'],
  }, [
    { if: { parent: has }, text: ['That {parent} won\'t need me any more. Or that I won\'t need {parent}. I don\'t know which.'] },
  ]);
  L('ages.coming.nobody', {
    _: ['Not even you? ...Huh. That helps, actually.', 'Truly? Then everyone\'s pretending? All of them?'],
    'k:cheerful': ['Ha! Everyone\'s pretending! That\'s brilliant!'],
    'k:ornery': ['I knew it. The grown-ups are making it up.'],
    'k:shy': ['...Oh. That makes me feel better.'],
    'k:curious': ['When DID you feel grown? Or haven\'t you, yet?'],
    'k:gloomy': ['...Oh. Good. I mean. That\'s a relief.'],
  });
  L('ages.coming.dear', {
    _: ['I don\'t know. Home. The valley. What else is there?', 'My family. My friends. Something of my own, maybe.'],
    'k:cheerful': ['Everyone! I\'ll hold everyone dear! Is that allowed?'],
    'k:ornery': ['Being left alone. And good bread.'],
    'k:shy': ['...Quiet places. The river. One or two people.'],
    'k:curious': ['New things. Learning. I want to hold learning dear.'],
    'k:gloomy': ['I don\'t know. Maybe nothing. Maybe I won\'t know till it\'s gone.'],
  }, [
    { if: { ageRiftFolk: true }, text: ['I keep thinking about the rift-folk. Their gadgets. Their stories. And home too. Both?'] },
  ]);
  L('ages.coming.rocket', {
    _: ['Medium?! You promise? Medium ones?', 'Small ones. Medium. LARGE. I heard you say large.'],
    'k:cheerful': ['REALLY?! I\'m telling everyone! The wizard\'s doing my party!'],
    'k:ornery': ['You\'d better. I\'ll remember.'],
    'k:shy': ['...Truly? Just a small one would be perfect.'],
    'k:curious': ['What color? Can I choose? Can it spell my name?'],
    'k:gloomy': ['...Really? For me? Oh.'],
  });
  L('ages.coming.fine', {
    _: ['You think so? Truly?', 'A fine grown-up. I\'ll try.'],
    'k:cheerful': ['I will! I\'ll be the finest!'],
    'k:ornery': ['I\'ll be the sort I want to be. But thanks.'],
    'k:shy': ['...Thank you.'],
    'k:curious': ['How can you tell? What do you look for?'],
    'k:gloomy': ['...You really think so? That\'s nice.'],
  });
  L('ages.coming.mess', {
    _: ['You? A mess? What did you do?', 'Ha! A wizard making a mess! What happened?'],
    'k:cheerful': ['Ahaha! Tell me! Tell me everything!'],
    'k:ornery': ['Ha. Good. I mean. Not good. But good.'],
    'k:shy': ['...That makes me feel better. A lot better.'],
    'k:curious': ['What kind of mess? A magic one? Did something explode?'],
    'k:gloomy': ['...And it came right? Really?'],
  });
  L('ages.coming.home', {
    _: ['It holds on back. I like that. I\'ll remember it.', 'Home. Yes. I think I\'ll always come back here.'],
    'k:cheerful': ['I will! Home\'s the best!'],
    'k:ornery': ['Home\'s all right. I suppose.'],
    'k:shy': ['...I\'d like that. To be held on to.'],
    'k:curious': ['How does it hold on? I\'ll find out, I suppose.'],
    'k:gloomy': ['...That\'s nice. That\'s really nice.'],
  });
  L('ages.coming.wide', {
    _: ['The wide world. Yes. I\'m going to see it. Some of it.', 'Bigger than the hills. I knew it was.'],
    'k:cheerful': ['I will! I\'ll see everything!'],
    'k:ornery': ['Finally someone who doesn\'t tell me to stay put.'],
    'k:shy': ['...Bit by bit. I\'ll look at it bit by bit.'],
    'k:curious': ['Everything! I want to see everything! Where should I start?'],
    'k:gloomy': ['...Maybe. Maybe it\'s better out there.'],
  }, [
    { if: { ageRiftFolk: true }, text: ['The rift-folk say their city never sleeps. I want to see it. Just once.'] },
  ]);

  // ==================================================================================
  // Choosing a trade (or how they came to theirs)
  // ==================================================================================
  addThread({
    id: 'ages.trade', label: (F) => (F.ageBand === 'youth' ? 'What will you do, when you\'re grown?' : F.job ? `How did you come to be ${F.ageJobA || 'a ' + F.jobWord}?` : 'Still finding your trade?'), weight: 1.0, cool: 5,
    when: (F) => F.ageBand === 'youth' || F.ageBand === 'young',
    rel: (F) => (F.ageBand === 'youth' ? 1.3 : F.job ? 0.9 : 1.3),
    open: { ask: 'ages.trade.open' },
    beats: {
      start: { line: 'ages.trade.start', go: [
        { ap: 'ask', say: 'What did your folks want for you?', to: 'folks' },
        { ap: 'ask', say: 'What do you love doing, when nobody\'s making you?', to: 'love' },
        { ap: 'jest', say: 'There\'s always wizarding. The hours are terrible.', to: 'wizarding' },
      ] },
      folks: { line: 'ages.trade.folks', go: [
        { ap: 'advise', say: 'Their wishes matter. Yours matter more.', to: 'yours' },
        { ap: 'ask', say: 'And what do you want?', to: 'love' },
      ] },
      love: { line: 'ages.trade.love', go: [
        { ap: 'advise', say: 'Then find who does it best and sit at their elbow.', to: 'elbow' },
        { ap: 'ask', say: 'Could you make a living of it?', to: 'living' },
        { ap: 'share', say: 'I never chose mine. It chose me, and it was rude about it.', to: 'chose' },
      ] },
      wizarding: { line: 'ages.trade.wizarding', go: [
        { ap: 'ask', say: 'Truly, though. What do you love doing?', to: 'love' },
        { ap: 'jest', say: 'The hat comes with the job. That\'s the main draw.', to: 'hat' },
      ] },
      hat: { line: 'ages.trade.hat', fx: { joke: { k: 'ages.wizjob', t: 'Wizarding: terrible hours, but the hat comes with the job.' } }, go: [
        { ap: 'ask', say: 'Now. What do you really love doing?', to: 'love' },
      ] },
      yours: { line: 'ages.trade.yours', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'Could you make a living of it?', to: 'living' },
        { ap: 'warm', say: 'They\'ll be proud whatever you choose.', to: 'proud' },
      ] },
      living: { line: 'ages.trade.living', go: [
        { ap: 'comfort', say: 'Most good trades started as someone\'s daft idea.', to: 'daft' },
        { ap: 'advise', say: 'Then do both a while. The one that pays, and the one that sings.', to: 'both' },
      ] },
      chose: { line: 'ages.trade.chose', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'Could you make a living of yours?', to: 'living' },
        { ap: 'warm', say: 'Yours might find you too. Keep your door open.', to: 'door' },
      ] },
      elbow: { line: 'ages.trade.elbow', fx: { respect: 0.03, feel: 'inspired' }, end: true },
      proud: { line: 'ages.trade.proud', fx: { fond: 0.02 }, end: true },
      daft: { line: 'ages.trade.daft', fx: { trust: 0.02 }, end: true },
      both: { line: 'ages.trade.both', fx: { respect: 0.02 }, end: true },
      door: { line: 'ages.trade.door', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.trade.open', [
    { text: ['What will you be, {name}, when you\'re grown?', 'Thought about a trade yet, {name}?'] },
    { if: { stage: 'grown', job: has }, text: ['How did you come to be {ageJobA}, {name}?', 'Was it always going to be the {ageTrade} for you, {name}?'] },
    { if: { stage: 'grown', job: null }, text: ['Still finding your trade, {name}?', 'No trade yet, {name}? What\'s calling you?'] },
  ]);
  L('ages.trade.start', {
    _: ['I don\'t know. Everyone asks. I don\'t know.', 'Something with my hands, maybe. Or my head. Or my feet.'],
    cheerful: ['Oh, I fell into it! Best fall I ever had.', 'Funny story. I went to fetch a sack and stayed eight years.'],
    ornery: ['Somebody had to do it. Nobody else would.', 'I didn\'t come to it. It came to me and wouldn\'t leave.'],
    shy: ['...I was apprenticed. I didn\'t say no. I never say no.', 'It was quiet work. I liked that it was quiet.'],
    curious: ['I wanted to know how it was done. Then I knew, and then I couldn\'t stop.', 'I asked one question too many and someone handed me an apron.'],
    dreamy: ['It felt right. Like a coat that fits.', 'I didn\'t choose. I just woke up one day and it was mine.'],
    witty: ['I lost a bet. It\'s worked out.', 'I was the only one who turned up on the day they were choosing.'],
    proud: ['I chose it. I\'m good at it. That\'s the whole story.', 'I was the best at it. They had no choice.'],
    gloomy: ['It\'s what was going. That\'s all.', 'I didn\'t really choose. Most of us don\'t.'],
    'k:cheerful': ['Everything! A baker AND a brewer AND a storyteller! Can you do three?', 'Something fun! Is any of it fun?'],
    'k:ornery': ['Something where nobody tells me what to do.', 'Not farming. Anything but farming. Everyone farms.'],
    'k:shy': ['...Something quiet. Fishing, maybe. The fish don\'t talk.', 'I don\'t know. Something nobody watches me do.'],
    'k:curious': ['A tinker! Or a herbalist! Or the storyteller! I can\'t decide. I want to know everything.', 'Something where you find things out. Is there a trade for that?'],
    'k:gloomy': ['Whatever I\'m told, probably.', 'I\'m not good at anything. So, something easy.'],
  }, [
    { if: { stage: 'grown', job: 'baker' }, text: ['I burned a loaf so badly the baker took me on out of pity. Best day of my life.'] },
    { if: { stage: 'grown', job: 'fisher' }, text: ['I sat by the river so often they gave me a rod to make it official.'] },
    { if: { stage: 'grown', job: 'mailcarrier' }, text: ['I knew everyone\'s door and everyone\'s business. It seemed a waste not to.'] },
    { if: { stage: 'grown', job: 'storyteller' }, text: ['I told my first tale at six. It went on for three days. They\'ve been paying me to stop since.'] },
    { if: { stage: 'grown', job: 'tinker' }, text: ['I took apart a clock. Then a lamp. Then the rift-folk turned up and I had real things to take apart.'] },
    { if: { stage: 'grown', job: 'farmer' }, text: ['My family\'s farmed this valley since before the lanes. I was born with soil in my ears.'] },
    { if: { stage: 'grown', job: 'brewer' }, text: ['I tasted the brewer\'s ale and told him what was wrong with it. He made me fix it.'] },
    { if: { stage: 'grown', job: null }, pri: 1, text: ['I haven\'t found it yet. Everything I try fits like someone else\'s boots.', 'I\'ve tried three. None of them took. I\'m starting to worry.'] },
    { if: { pastime: (p) => !!p, stage: 'child' }, text: ['I\'m good at {pastimeWord}. Is that a trade? Can it be?'] },
  ]);
  L('ages.trade.folks', {
    _: ['Something steady. A trade with bread at the end of it.', 'The family trade. What else?'],
    cheerful: ['Whatever made me happy! They\'re lovely like that.'],
    ornery: ['Something respectable. I\'ve been disappointing them for years.'],
    shy: ['...They didn\'t say. They hoped. I could tell.'],
    curious: ['They wanted me to stop asking questions and pick one. I picked asking.'],
    dreamy: ['Something sensible. I tried. My head kept wandering off.'],
    witty: ['They wanted a lawyer. We don\'t have lawyers. So, anything.'],
    proud: ['The best. And they got it.'],
    gloomy: ['Something better than they had. I don\'t think I managed.'],
    'k:cheerful': ['Mom says anything, as long as I\'m home for supper!'],
    'k:ornery': ['Dad wants me to do what he does. I don\'t want to.'],
    'k:shy': ['...They want me to be happy. I don\'t know what that looks like yet.'],
    'k:curious': ['They keep suggesting things. I keep asking why. They keep sighing.'],
    'k:gloomy': ['They want me to be like my brother. Everyone does.'],
  }, [
    { if: { parent: has }, pri: 1, text: ['{Parent} wants me to take up the family work. {Parent} hasn\'t asked what I want.', '{Parent} says "a steady trade". {Parent} says it a lot.'] },
  ]);
  L('ages.trade.love', {
    _: ['Making things. Mending things. Seeing a thing come right.', 'Being outdoors. Mud and weather. I like weather.'],
    cheerful: ['Talking to people! Feeding them! Watching them laugh!'],
    ornery: ['Being left alone with a job to do and nobody watching.'],
    shy: ['...The early mornings. Before anyone\'s up. Just me and the work.'],
    curious: ['Working out how things go together. Anything. Clocks, crops, people.'],
    dreamy: ['Watching things grow. Plants. Loaves. Ideas.'],
    witty: ['Lying in the orchard thinking up remarks. Not much call for it.'],
    proud: ['Doing a thing better than it\'s been done before.'],
    gloomy: ['Nothing much. Sitting by the water.'],
    'k:cheerful': ['Playing! Is there a trade for playing?', 'Baking! I made a cake. It fell in. It was still nice.'],
    'k:ornery': ['Climbing things I\'m told not to climb.'],
    'k:shy': ['...Drawing. In the margins. Nobody\'s seen them.'],
    'k:curious': ['Taking things apart! Putting them back! Mostly the first one.'],
    'k:gloomy': ['Reading. Somewhere quiet.'],
  }, [
    { if: { pastime: ['carving', 'basketry', 'pottery', 'knitting', 'painting'], made: { min: 2 } }, pri: 1, text: ['{PastimeWord}. I\'ve made {ageMadeWord} {madeMany}. I could do it all day.'] },
    { if: { pastime: (p) => !!p }, text: ['{PastimeWord}. I could do it all day. Is that a living? It doesn\'t feel like one.'] },
    { if: { like: has }, text: ['{Like}. Anything to do with {like}.'] },
  ]);
  L('ages.trade.wizarding', {
    _: ['Ha! Could I? Is there an apprenticeship?', 'Wizarding! Do you have to be tall?'],
    cheerful: ['Ha! Sign me up! I\'ll bring my own hat!'],
    ornery: ['Terrible hours and you wander about. I\'d be good at that.'],
    shy: ['...Could hobbits be wizards? No. Ha.'],
    curious: ['Truly? How does one become a wizard? Is there a test?'],
    dreamy: ['Wizarding. Fireworks and long roads and stories. Oh.'],
    witty: ['The pay\'s in fireworks, I suppose. I\'d take that.'],
    proud: ['I\'d make a fine wizard, I think.'],
    gloomy: ['They\'d never take me. They\'d say I\'m too short.'],
    'k:cheerful': ['YES! Can I? Can I be your apprentice?'],
    'k:ornery': ['Ha. I\'d set things on fire on purpose.'],
    'k:shy': ['...I\'d like a staff. Just the staff.'],
    'k:curious': ['How do you get the magic? Is it in the hat? Can I hold the hat?'],
    'k:gloomy': ['You\'re joking. You\'re always joking.'],
  });
  L('ages.trade.hat', {
    _: ['Ha! Then I\'m in. For the hat alone.', 'The hat! Of course it\'s the hat.'],
    cheerful: ['Ha! Best perk in the valley!'],
    ornery: ['A hat isn\'t a pension.'],
    shy: ['...It is a good hat.'],
    curious: ['Is it issued? Who makes them?'],
    dreamy: ['A hat full of stars. Yes.'],
    witty: ['And the beard? Is the beard extra?'],
    proud: ['A hat of office. Very proper.'],
    gloomy: ['Ha. At least it\'s waterproof.'],
    'k:cheerful': ['I WANT THE HAT.'],
    'k:ornery': ['I\'d wear it better than you.'],
    'k:shy': ['...Hee.'],
    'k:curious': ['Can it hold things? What\'s in it now?'],
    'k:gloomy': ['Ha. Fine. It\'s a good hat.'],
  });
  L('ages.trade.yours', {
    _: ['Mine matter more? Nobody\'s ever said that.', 'Hm. You\'d better not tell my folks you said so.'],
    cheerful: ['Oh! Well then! I want to do everything!'],
    ornery: ['Exactly. I\'ve been saying that for years.'],
    shy: ['...Do they? I never thought mine counted.'],
    curious: ['But how do you know what you want? Is there a way to tell?'],
    dreamy: ['Then I\'ll follow the thing that sings. That\'s what I\'ll do.'],
    witty: ['I\'ll quote you at supper. They\'ll love that.'],
    proud: ['Quite right.'],
    gloomy: ['...That\'s kind. I don\'t know if it\'s true.'],
    'k:cheerful': ['Yay! I\'m telling Mom the wizard said!'],
    'k:ornery': ['Ha! Finally!'],
    'k:shy': ['...Thank you.'],
    'k:curious': ['How do I know what I want, though? Truly?'],
    'k:gloomy': ['...Really? Mine?'],
  });
  L('ages.trade.living', {
    _: ['That\'s the trouble. Nobody pays for the things you love.', 'Maybe. If I\'m good enough. I\'m not sure I am.'],
    cheerful: ['Ooh, maybe! If folk like it as much as I do!'],
    ornery: ['Probably not. That\'s how it always goes.'],
    shy: ['...I don\'t know. I\'d be too scared to try.'],
    curious: ['I\'ve been working it out. It\'s possible. It\'s just not likely.'],
    dreamy: ['If the world were kinder. Maybe it is.'],
    witty: ['Only if folk start paying in compliments.'],
    proud: ['Of course I could. If I chose to.'],
    gloomy: ['No. Nobody can.'],
    'k:cheerful': ['Course I could! Couldn\'t I?'],
    'k:ornery': ['Grown-ups say no. Grown-ups always say no.'],
    'k:shy': ['...I don\'t know. Maybe not.'],
    'k:curious': ['How do grown-ups decide what\'s worth paying for?'],
    'k:gloomy': ['No. That\'s not how it works.'],
  });
  L('ages.trade.chose', {
    _: ['Rude about it! Ha! How?', 'It chose you? What was it like?'],
    cheerful: ['Ha! I love that! Rude about it!'],
    ornery: ['Typical. Even wizarding\'s bossy.'],
    shy: ['...So you didn\'t know either? Truly?'],
    curious: ['How does a trade choose someone? What did it say?'],
    dreamy: ['Maybe mine\'s out there choosing me now. Slowly.'],
    witty: ['Rude about it. That\'s every trade I\'ve tried.'],
    proud: ['Well, it chose well.'],
    gloomy: ['...Maybe mine will find me. Or maybe not.'],
    'k:cheerful': ['Ahaha! Mine had better be polite!'],
    'k:ornery': ['Mine\'d better ask nicely.'],
    'k:shy': ['...That\'s nice to think about.'],
    'k:curious': ['How? HOW? Tell me how!'],
    'k:gloomy': ['...Maybe one\'ll choose me.'],
  });
  L('ages.trade.elbow', {
    _: ['At their elbow. Yes. I know just who. I\'ll go and ask.', 'Sit at their elbow. I\'ll ask tomorrow. Before I lose my nerve.'],
    cheerful: ['Oh, brilliant! I\'ll go and pester them right away!'],
    ornery: ['They\'ll say no. ...I\'ll ask anyway.'],
    shy: ['...I\'ll try. I\'ll just watch at first. Quietly.'],
    curious: ['Yes! And ask everything! Why didn\'t I think of that?'],
    dreamy: ['An apprentice. To someone wonderful. Yes.'],
    witty: ['At their elbow. Until they hit me with it.'],
    proud: ['They\'ll be lucky to have me.'],
    gloomy: ['...All right. I\'ll try.'],
    'k:cheerful': ['I\'m going right now!'],
    'k:ornery': ['Fine. But if they\'re mean I\'m leaving.'],
    'k:shy': ['...Will you come with me? No. I\'ll go. Tomorrow.'],
    'k:curious': ['Who\'s the best? Who\'s the very best? I\'ll find out.'],
    'k:gloomy': ['They won\'t want me. ...I\'ll ask anyway.'],
  });
  L('ages.trade.proud', {
    _: ['You think so? I hope so.', 'Whatever I choose. I\'ll tell them you said so.'],
    cheerful: ['They will! They\'re the best!'],
    ornery: ['We\'ll see.'],
    shy: ['...Thank you.'],
    curious: ['How do you know? Do you know them well?'],
    dreamy: ['That\'s a nice thought to carry.'],
    witty: ['They\'ll be proud. Then they\'ll be surprised.'],
    proud: ['Of course they will.'],
    gloomy: ['...I hope so.'],
    'k:cheerful': ['Yay!'],
    'k:ornery': ['They\'d better be.'],
    'k:shy': ['...Do you think?'],
    'k:curious': ['How do you know?'],
    'k:gloomy': ['...Maybe.'],
  });
  L('ages.trade.daft', {
    _: ['Someone\'s daft idea. Ha. I\'ve plenty of those.', 'Daft ideas. I\'m full of them. Maybe one\'s a trade.'],
    cheerful: ['Then I\'ll have the daftest idea ever! And make it work!'],
    ornery: ['My daft ideas are better than their sensible ones.'],
    shy: ['...I\'ve got one. Maybe I\'ll say it out loud one day.'],
    curious: ['Whose daft idea was baking, I wonder? Somebody had to try first.'],
    dreamy: ['Daft ideas are just early ones.'],
    witty: ['Brewing was a daft idea. Look how that turned out. Wonderfully.'],
    proud: ['Then mine will be the daft idea that changes everything.'],
    gloomy: ['...That\'s cheering, actually.'],
    'k:cheerful': ['I have SO many daft ideas!'],
    'k:ornery': ['Ha. Everyone calls my ideas daft.'],
    'k:shy': ['...I\'ve got a daft idea. Shh.'],
    'k:curious': ['Whose daft idea was the first hobbit-hole?'],
    'k:gloomy': ['...Oh. Good.'],
  });
  L('ages.trade.both', {
    _: ['The one that pays and the one that sings. I\'ll write that down.', 'Both. Hm. Busy, but maybe.'],
    cheerful: ['Both! Of course! Why choose?'],
    ornery: ['Twice the work. ...Twice the fun, maybe.'],
    shy: ['...One by day. One by lamplight. Yes.'],
    curious: ['And see which one grows. Like an experiment.'],
    dreamy: ['The one that sings. I\'ll keep it for evenings.'],
    witty: ['I\'ll be tired, but musical.'],
    proud: ['I can manage both. Easily.'],
    gloomy: ['...I could try that.'],
    'k:cheerful': ['Both! Both! Both!'],
    'k:ornery': ['Fine. Both.'],
    'k:shy': ['...That might work.'],
    'k:curious': ['Can you do three?'],
    'k:gloomy': ['...Maybe.'],
  });
  L('ages.trade.door', {
    _: ['Keep my door open. I will. Maybe it\'s on its way.', 'I\'ll leave the door open, then. And the kettle on.'],
    cheerful: ['I\'ll leave it wide open! And put a sign up!'],
    ornery: ['It had better knock.'],
    shy: ['...I\'ll leave it a little open.'],
    curious: ['I\'ll keep watch. I\'ll notice when it comes.'],
    dreamy: ['A trade knocking at the door. I like that.'],
    witty: ['If it\'s rude, I\'ll know it\'s mine.'],
    proud: ['It\'ll find the right door.'],
    gloomy: ['...All right.'],
    'k:cheerful': ['I\'ll leave it open ALL the time!'],
    'k:ornery': ['Mom\'ll say shut the door.'],
    'k:shy': ['...Just a crack.'],
    'k:curious': ['How will I know when it\'s knocking?'],
    'k:gloomy': ['...Maybe.'],
  });

  // ==================================================================================
  // First love
  // ==================================================================================
  addThread({
    id: 'ages.firstlove', label: 'Anyone caught your eye?', weight: 1.0, cool: 5,
    when: (F) => (F.ageBand === 'youth' && F.ageToGo <= 12) || (F.ageBand === 'young' && !F.spouse),
    rel: (F) => (F.ageSweetheart ? 1.8 : 1),
    open: { jest: 'ages.love.open' },
    beats: {
      start: { line: 'ages.love.start', go: [
        { ap: 'ask', say: 'Who is it, then?', to: 'who', need: { if: { ageSweetheart: has } } },
        { ap: 'jest', say: 'You\'ve gone the color of a radish.', to: 'radish' },
        { ap: 'warm', say: 'You don\'t have to tell me.', to: 'admit' },
      ] },
      radish: { line: 'ages.love.radish', go: [
        { ap: 'ask', say: 'Who is it, then?', to: 'who', need: { if: { ageSweetheart: has } } },
        { ap: 'warm', say: 'All right, all right. You don\'t have to say.', to: 'admit' },
      ] },
      admit: { line: 'ages.love.admit', fx: { confide: { k: 'ages.crush', t: '{Name} is sweet on someone', secret: true } }, go: [
        { ap: 'ask', say: 'How will you tell them?', to: 'how' },
        { ap: 'comfort', say: 'The right one finds you. Usually at a dance.', to: 'dance' },
        { ap: 'share', say: 'I was in love once. With a lighthouse. Long story.', to: 'lighthouse', need: { open: 1 }, soft: true },
      ] },
      who: { line: 'ages.love.who', fx: { confide: { k: 'ages.sweetheart', t: '{Name} is sweet on {ageSweetheart}', secret: true } }, go: [
        { ap: 'advise', say: 'Take {ageSweetheart} some flowers. Today.', to: 'flowers' },
        { ap: 'ask', say: 'Does {ageSweetheart} know?', to: 'know' },
        { ap: 'jest', say: 'Shall I write {ageSweetheart} a sonnet? I rhyme "love" with "glove".', to: 'sonnet' },
      ] },
      how: { line: 'ages.love.how', go: [
        { ap: 'advise', say: 'Just say it. Plainly. It\'s never as hard as the waiting.', to: 'plainly' },
        { ap: 'jest', say: 'Skywriting. I know a man with rockets.', to: 'sky' },
      ] },
      know: { line: 'ages.love.know', go: [
        { ap: 'advise', say: 'Take {ageSweetheart} some flowers. Today.', to: 'flowers' },
        { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'safe' },
      ] },
      sonnet: { line: 'ages.love.sonnet', fx: { joke: { k: 'ages.sonnet', t: 'The wizard rhymes "love" with "glove".' } }, go: [
        { ap: 'advise', say: 'Flowers, then. Much safer than my poetry.', to: 'flowers' },
        { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'safe' },
      ] },
      dance: { line: 'ages.love.dance', go: [
        { ap: 'advise', say: 'Then go to the next one. And ask first.', to: 'plainly' },
        { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'safe' },
      ] },
      lighthouse: { line: 'ages.love.lighthouse', fx: { fond: 0.03, trust: 0.02 }, end: true },
      flowers: { line: 'ages.love.flowers', fx: { respect: 0.02, queue: 'whisper_visit', queueExtra: (T) => ({ to: personById(T.F.ageSweetheartId), kind: 'flowers' }) }, end: true },
      plainly: { line: 'ages.love.plainly', fx: { respect: 0.02, feel: 'inspired' }, end: true },
      sky: { line: 'ages.love.sky', fx: { fond: 0.02 }, end: true },
      safe: { line: 'ages.love.safe', fx: { trust: 0.04, promise: { k: 'secret.ages.love', t: 'You promised to keep {Name}\'s secret', days: 20 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.love.open', [
    { text: ['So, {name}. Anyone caught your eye?', 'You\'ve a look about you, {name}. Someone special?', 'I saw you at the last dance, {name}. Looking at someone.'] },
  ]);
  L('ages.love.start', {
    _: ['What? No! Who said? Nobody. No.', 'Me? Ha. No. ...Why, what have you heard?'],
    cheerful: ['Ha! Maybe! Ooh, I can\'t keep anything in!', 'Everyone catches my eye! It\'s a problem!'],
    ornery: ['Mind your own business, wizard.', 'No. And if I had, I wouldn\'t tell a wizard.'],
    shy: ['*goes very red* ...No.', '...I don\'t know what you mean.'],
    curious: ['Why do you ask? Is it obvious? How is it obvious?', 'Hm. What does "caught your eye" feel like, exactly? I\'m checking.'],
    dreamy: ['*sighs* ...Maybe. Somebody. Sometimes.', 'Oh, wizard. Don\'t. I\'ll start and never stop.'],
    witty: ['Several. Mostly pies.', 'Nobody I\'d admit to. In daylight.'],
    proud: ['Plenty have had their eye on me, I\'ll have you know.', 'I\'m particular. Very particular.'],
    gloomy: ['No. Nobody looks at me like that.', 'There was someone. They didn\'t notice. They never do.'],
    'k:cheerful': ['EW. ...Maybe. Don\'t tell anyone!', 'Ha! Maybe! There\'s someone with really nice curls!'],
    'k:ornery': ['That\'s disgusting. ...Who told you?'],
    'k:shy': ['*hides behind hands* ...No.'],
    'k:curious': ['How do you know when it\'s that? Is there a sign?'],
    'k:gloomy': ['Nobody likes me like that.'],
  }, [
    { if: { ageSweetheart: has }, pri: 1, text: ['*looks across the lane, then quickly away* ...No. Why?', 'Is it that obvious? Oh, it\'s that obvious.'] },
  ]);
  L('ages.love.radish', {
    _: ['I have not! It\'s the sun! It\'s... hot.', 'A radish! Stop it!'],
    cheerful: ['Ha! I have, haven\'t I! Oh no!'],
    ornery: ['I\'m not a radish. YOU\'re a radish.'],
    shy: ['*goes even redder*'],
    curious: ['Do people really go red? Why do we do that? It\'s so unhelpful.'],
    dreamy: ['*covers face* A beetroot, more like.'],
    witty: ['A radish is a very handsome vegetable, I\'ll have you know.'],
    proud: ['I do not blush. It\'s the weather.'],
    gloomy: ['Great. Now everyone will know.'],
    'k:cheerful': ['STOP IT! Hee!'],
    'k:ornery': ['I am NOT.'],
    'k:shy': ['*hides*'],
    'k:curious': ['Why do faces go red? Is it the blood?'],
    'k:gloomy': ['Ugh.'],
  });
  L('ages.love.admit', {
    _: ['...There might be someone. I\'m not saying who.', 'All right. There\'s someone. I don\'t think they know I exist.'],
    cheerful: ['There is someone! And they laugh at my jokes! Even the bad ones!'],
    ornery: ['Fine. There\'s someone. They\'re very annoying. I can\'t stop thinking about them.'],
    shy: ['...There\'s someone. I\'ve never said. To anyone.'],
    curious: ['There\'s someone. I keep finding reasons to walk past their door. Is that normal?'],
    dreamy: ['There\'s someone. The world goes all soft when they\'re near. Like evening.'],
    witty: ['There\'s someone. I say clever things near them. They don\'t notice. Cleverness is overrated.'],
    proud: ['There\'s someone worthy. I\'m considering it.'],
    gloomy: ['There\'s someone. It\'s hopeless. It\'s always hopeless.'],
    'k:cheerful': ['Okay okay okay there\'s someone! Don\'t tell!'],
    'k:ornery': ['Fine. There\'s someone. It\'s stupid.'],
    'k:shy': ['...Someone. Shh.'],
    'k:curious': ['There\'s someone I like being near. Is that it? Is that the thing?'],
    'k:gloomy': ['...There\'s someone. They don\'t know.'],
  });
  L('ages.love.who', {
    _: ['{AgeSweetheart}. There. I said it. Oh, I said it.', '{AgeSweetheart}. Don\'t look over there. DON\'T look.'],
    cheerful: ['{AgeSweetheart}! Isn\'t {ageSweetheart} wonderful? Don\'t answer that. Yes.'],
    ornery: ['{AgeSweetheart}. And if you laugh I\'ll set your hat on fire myself.'],
    shy: ['...{AgeSweetheart}. *whispers it*'],
    curious: ['{AgeSweetheart}. I\'ve been trying to work out why. I can\'t. It\'s just {ageSweetheart}.'],
    dreamy: ['{AgeSweetheart}. Even the name sounds like a song, doesn\'t it?'],
    witty: ['{AgeSweetheart}. Yes. I know. Out of my league. I\'m playing anyway.'],
    proud: ['{AgeSweetheart}. A very fine choice, if I say so myself.'],
    gloomy: ['{AgeSweetheart}. Who\'ll never look twice at me.'],
    'k:cheerful': ['{AgeSweetheart}! Hee! I said it!'],
    'k:ornery': ['{AgeSweetheart}. Happy now?'],
    'k:shy': ['...{AgeSweetheart}.'],
    'k:curious': ['{AgeSweetheart}. Is that strange? Is it allowed?'],
    'k:gloomy': ['{AgeSweetheart}. It\'s hopeless.'],
  });
  L('ages.love.how', {
    _: ['Tell them? I can\'t even say good morning without dropping something.', 'I thought maybe a note. Under the door. Unsigned.'],
    cheerful: ['A song! At the Badger! In front of everyone! ...Maybe not.'],
    ornery: ['I won\'t. They should work it out.'],
    shy: ['...I can\'t. I\'ll just look. That\'s enough.'],
    curious: ['I\'ve been researching. Everyone does it differently. Some just say it.'],
    dreamy: ['On a summer evening, by the river, with the light just so.'],
    witty: ['I was going to have it carved on a pumpkin.'],
    proud: ['They\'ll come to me. They always do.'],
    gloomy: ['I won\'t. They\'ll say no.'],
    'k:cheerful': ['I\'ll give them my best conker!'],
    'k:ornery': ['I\'m not telling them. Ever.'],
    'k:shy': ['...I\'m not. I couldn\'t.'],
    'k:curious': ['How do grown-ups do it? Do they just say it?'],
    'k:gloomy': ['They\'d laugh.'],
  });
  L('ages.love.know', {
    _: ['I don\'t know! That\'s the worst bit! I don\'t know if they know!', 'Maybe. I think. Everyone else does.'],
    cheerful: ['Probably! I\'m not subtle! I waved at them for ten minutes yesterday!'],
    ornery: ['If they don\'t, they\'re thicker than I thought.'],
    shy: ['...I hope not. I hope so. Both.'],
    curious: ['That\'s what I\'ve been trying to work out. The signs are unclear.'],
    dreamy: ['Somewhere inside, I think they do.'],
    witty: ['I\'ve been very cunning. Nobody knows. Everybody knows.'],
    proud: ['They will, when I decide.'],
    gloomy: ['No. And they never will.'],
    'k:cheerful': ['I gave them a frog! They should know!'],
    'k:ornery': ['They\'d better not.'],
    'k:shy': ['...No. I don\'t think so.'],
    'k:curious': ['How would I tell if they knew?'],
    'k:gloomy': ['No.'],
  });
  L('ages.love.sonnet', {
    _: ['NO. No sonnets. Ha! "Love" and "glove"!', 'Please don\'t. Ha. Please.'],
    cheerful: ['Ha! "Glove"! Oh, do it! No! Don\'t!'],
    ornery: ['If you write a sonnet I\'ll never speak to you again.'],
    shy: ['...Please don\'t. Ha. No.'],
    curious: ['What else rhymes with love? Dove. Shove. Above. Hm.'],
    dreamy: ['A sonnet... no. Ha. But maybe.'],
    witty: ['"Love" and "glove". And "shove", for the last line.'],
    proud: ['I\'ll write my own sonnets, thank you.'],
    gloomy: ['Ha. It would be better than anything I\'d write.'],
    'k:cheerful': ['Ahaha! GLOVE!'],
    'k:ornery': ['That\'s the worst poem ever.'],
    'k:shy': ['...Hee. No.'],
    'k:curious': ['What\'s a sonnet?'],
    'k:gloomy': ['Ha.'],
  });
  L('ages.love.dance', {
    _: ['At a dance. Hm. I always stand at the side.', 'A dance. There\'s one coming. I might. Maybe.'],
    cheerful: ['Oh, I love a dance! I\'ll dance with everyone and see who stays!'],
    ornery: ['I don\'t dance.'],
    shy: ['...I stand by the wall at dances.'],
    curious: ['Is that where most hobbits find each other? I should look into it.'],
    dreamy: ['A dance under lanterns. Oh, yes.'],
    witty: ['At a dance? I\'ll tread on their feet. Memorable.'],
    proud: ['I\'m a very good dancer, as it happens.'],
    gloomy: ['Nobody asks me to dance.'],
    'k:cheerful': ['I LOVE dancing!'],
    'k:ornery': ['Dancing\'s stupid.'],
    'k:shy': ['...I don\'t dance.'],
    'k:curious': ['Why at a dance, though?'],
    'k:gloomy': ['Nobody dances with me.'],
  });
  L('ages.love.lighthouse', {
    _: ['A LIGHTHOUSE? You can\'t leave it there!', 'With a lighthouse? Ha! How did that end?'],
    cheerful: ['Ahaha! A lighthouse! Was it a good lighthouse? Did it love you back?'],
    ornery: ['That\'s ridiculous. ...Go on, then.'],
    shy: ['...Ha. That makes me feel less daft.'],
    curious: ['What\'s a lighthouse? A house made of light? Tell me EVERYTHING.'],
    dreamy: ['A light, alone by the sea, every night. Oh, I understand that.'],
    witty: ['Was it a long-distance thing? Lighthouses are terrible at visiting.'],
    proud: ['Well. At least it was tall.'],
    gloomy: ['Did it end badly? It did, didn\'t it.'],
    'k:cheerful': ['A LIGHTHOUSE! Ahaha!'],
    'k:ornery': ['That\'s not real.'],
    'k:shy': ['...Hee.'],
    'k:curious': ['What\'s a lighthouse?'],
    'k:gloomy': ['...Did it love you back?'],
  });
  L('ages.love.flowers', {
    _: ['Flowers. Today. ...Today? All right. Before I think better of it.', 'Right. Flowers. Which flowers? Never mind. Any flowers.'],
    cheerful: ['Yes! The biggest bunch in the valley! I\'m off!'],
    ornery: ['Fine. But if it goes wrong it\'s your fault.'],
    shy: ['...I\'ll leave them on the step. And run.'],
    curious: ['What do flowers say, exactly? I\'ll pick ones that say the right thing.'],
    dreamy: ['Wild ones. From the bank by the river. Yes.'],
    witty: ['Flowers. Low risk. They can\'t rhyme.'],
    proud: ['I\'ll bring the finest. Naturally.'],
    gloomy: ['They\'ll think it\'s silly. ...I\'ll go.'],
    'k:cheerful': ['I\'m going NOW!'],
    'k:ornery': ['Ugh. Fine.'],
    'k:shy': ['...On the step. And run.'],
    'k:curious': ['Which ones? Daisies?'],
    'k:gloomy': ['...Okay.'],
  });
  L('ages.love.plainly', {
    _: ['Plainly. Never as hard as the waiting. I\'ll try.', 'You\'re right. The waiting is awful.'],
    cheerful: ['Plainly! Yes! I\'ll just say it! Tomorrow! Today!'],
    ornery: ['Plain speaking. I\'m good at that. Usually.'],
    shy: ['...Plainly. One sentence. I can do one sentence.'],
    curious: ['What\'s the plainest way, do you think? I\'ll draft it.'],
    dreamy: ['Just say it, under the stars. Yes.'],
    witty: ['Plainly. My weakest subject.'],
    proud: ['Plainly and with dignity.'],
    gloomy: ['...The waiting is the worst. You\'re right.'],
    'k:cheerful': ['I\'ll just SAY it!'],
    'k:ornery': ['Fine.'],
    'k:shy': ['...Maybe.'],
    'k:curious': ['What words, though?'],
    'k:gloomy': ['...Okay.'],
  });
  L('ages.love.sky', {
    _: ['Ha! Don\'t you dare! Everyone would see!', 'Skywriting! Ha! In green?'],
    cheerful: ['Ha! Do it! No! DON\'T!'],
    ornery: ['If my name appears in the sky I\'m moving to Bree.'],
    shy: ['...Please never do that.'],
    curious: ['Can you actually do that? With rockets?'],
    dreamy: ['Their name in stars... no. Ha. But oh.'],
    witty: ['Spelled wrong, knowing you.'],
    proud: ['If anyone deserves skywriting, it\'s them.'],
    gloomy: ['Ha. They\'d still say no.'],
    'k:cheerful': ['YES! No! YES!'],
    'k:ornery': ['Don\'t.'],
    'k:shy': ['...No!'],
    'k:curious': ['Can you really?'],
    'k:gloomy': ['Ha.'],
  });
  L('ages.love.safe', {
    _: ['Promise? Not a word? Not even a hint?', 'Thank you. I knew I could tell you.'],
    cheerful: ['Thank you! Oh, I\'m so glad I told someone!'],
    ornery: ['It had better be.'],
    shy: ['...Thank you.'],
    curious: ['Do wizards keep many secrets? Where do you keep them?'],
    dreamy: ['A secret with a wizard. That\'s almost magic.'],
    witty: ['If it gets out I\'ll know who to blame.'],
    proud: ['I trust your discretion.'],
    gloomy: ['...Thank you. I needed someone to know.'],
    'k:cheerful': ['PINKIE PROMISE!'],
    'k:ornery': ['You better.'],
    'k:shy': ['...Thanks. Don\'t tell. Please.'],
    'k:curious': ['Where do you keep secrets?'],
    'k:gloomy': ['...Okay.'],
  });

  // ==================================================================================
  // A home of their own: young grown-ups
  // ==================================================================================
  addThread({
    id: 'ages.ownplace', label: 'How\'s grown-up life treating you?', weight: 1.0, cool: 5,
    when: (F) => F.ageBand === 'young',
    rel: (F) => (F.ageGrown <= 6 ? 1.5 : 1),
    open: { ask: 'ages.own.open' },
    beats: {
      start: { line: 'ages.own.start', go: [
        { ap: 'jest', say: 'And how\'s the cooking?', to: 'cooking' },
        { ap: 'ask', say: 'Do you miss home? Your folks?', to: 'miss' },
        { ap: 'ask', say: 'What\'s the best of being grown?', to: 'best' },
      ] },
      cooking: { line: 'ages.own.cooking', go: [
        { ap: 'ask', say: 'Do you miss your folks\' cooking?', to: 'miss' },
        { ap: 'jest', say: 'Burnt toast is a sort of seasoning.', to: 'toast' },
      ] },
      miss: { line: 'ages.own.miss', go: [
        { ap: 'advise', say: 'Go and see them. Take a cake. Even a bad one.', to: 'visit', need: { if: { ageParentId: has } } },
        { ap: 'comfort', say: 'They miss you more, I\'d wager.', to: 'more' },
      ] },
      best: { line: 'ages.own.best', go: [
        { ap: 'ask', say: 'And the worst?', to: 'worst' },
        { ap: 'warm', say: 'You\'ve taken to it well.', to: 'well' },
      ] },
      toast: { line: 'ages.own.toast', fx: { joke: { k: 'ages.toast', t: 'Burnt toast is a sort of seasoning.' } }, go: [
        { ap: 'ask', say: 'Do you miss your folks\' table?', to: 'miss' },
        { ap: 'ask', say: 'What\'s the best of being grown?', to: 'best' },
      ] },
      worst: { line: 'ages.own.worst', go: [
        { ap: 'comfort', say: 'Nobody else has it worked out either.', to: 'nobody' },
        { ap: 'jest', say: 'Bills, mostly. And nobody to blame.', to: 'blame' },
      ] },
      visit: { line: 'ages.own.visit', fx: { respect: 0.02, queue: 'whisper_visit', queueExtra: (T) => ({ to: personById(T.F.ageParentId), kind: 'kin' }) }, end: true },
      more: { line: 'ages.own.more', fx: { fond: 0.02 }, end: true },
      well: { line: 'ages.own.well', fx: { fond: 0.02 }, end: true },
      nobody: { line: 'ages.own.nobody', fx: { trust: 0.02 }, end: true },
      blame: { line: 'ages.own.blame', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.own.open', [{ text: ['How\'s grown-up life treating you, {name}?', 'You\'ve not been grown long, {name}. How\'s it suiting you?'] }]);
  L('ages.own.start', {
    _: ['It\'s strange. Nobody tells you when to go to bed. So I don\'t. Then I\'m tired.', 'I keep waiting for someone to tell me what to do. Nobody does.'],
    cheerful: ['Oh, I love it! I had cake for breakfast! Twice!', 'It\'s grand! Mostly! Everything\'s an adventure, even the washing.'],
    ornery: ['Everyone still treats me like a youngster. I\'m grown. Look at me.', 'Fine. Lot more washing up than I was told.'],
    shy: ['...It\'s quiet. I like it. I think. It\'s very quiet.', 'I\'m still getting used to it. I talk to the kettle.'],
    curious: ['Do you know how many things a house needs? I didn\'t. I\'m making a list.', 'Fascinating. I\'ve learned more about drains this year than in my whole life.'],
    dreamy: ['I sit on my own step in the evening. My own step. It feels like a story.', 'It\'s like the start of a long book. I keep turning pages.'],
    witty: ['Being grown is just being a child with more chores and fewer excuses.', 'Splendid. I\'ve had three dinners and none of them were cooked.'],
    proud: ['Very well, thank you. I keep a tidy hole.', 'I\'ve settled in perfectly. As expected.'],
    gloomy: ['Harder than it looks. Everything costs something.', 'Lonely, some nights. Nobody tells you that.'],
  }, [
    { if: { homeless: true }, pri: 2, text: ['I haven\'t a place yet. I\'m between holes. And hedges.'] },
    { if: { job: has }, text: ['Work all day, then the house all evening. When do grown-ups sit down?'] },
    { if: { rift: true }, text: ['My own hole. With a round door. Back home I had a pod. This has a garden. It\'s wild.'] },
  ]);
  L('ages.own.cooking', {
    _: ['Don\'t ask. I set fire to a pan of water. Water!', 'I\'ve learned to make one thing. I make it every day.'],
    cheerful: ['Ha! Terrible! I eat it anyway and sing to cover the taste!'],
    ornery: ['My cooking\'s fine. My oven\'s the problem.'],
    shy: ['...I mostly have bread and cheese. It\'s safe.'],
    curious: ['I\'ve been experimenting. Some experiments have gone better than others.'],
    dreamy: ['I made a pie once that tasted of summer. I\'ve never managed it again.'],
    witty: ['I can boil an egg. Not on purpose, but I can.'],
    proud: ['I\'m a very good cook. When I try.'],
    gloomy: ['Burned, mostly. Everything comes out burned.'],
  }, [
    { if: { job: ['baker', 'innkeeper'] }, pri: 1, text: ['All day I cook for the village. At home I have a cookie and go to bed.'] },
  ]);
  L('ages.own.miss', {
    _: ['Sometimes. Mostly the cooking. And being told to wear a coat.', 'More than I thought. The noise. I miss the noise.'],
    cheerful: ['All the time! I go round for tea every other day! They pretend to mind!'],
    ornery: ['No. ...The pies. I miss the pies.'],
    shy: ['...Yes. I go home sometimes and just sit in the kitchen.'],
    curious: ['I miss asking. There\'s nobody to ask now. I have to work things out.'],
    dreamy: ['The smell of the kitchen on a Highday morning. That\'s home, still.'],
    witty: ['I miss having somebody to blame for the dishes.'],
    proud: ['I\'m perfectly fine on my own. ...I do pop round.'],
    gloomy: ['Yes. More than I say.'],
  }, [
    { if: { parent: has }, pri: 1, text: ['I miss {parent}. Don\'t tell {parent}. I\'ll never hear the end of it.', '{Parent} still comes round with soup. I pretend I don\'t need it. I need it.'] },
  ]);
  L('ages.own.best', {
    _: ['Choosing. Everything. What\'s for supper, when to sleep, which chair.', 'Nobody tells me off for my boots.'],
    cheerful: ['Pudding first! Whenever I want! It\'s glorious!'],
    ornery: ['Nobody telling me what to do. Bliss.'],
    shy: ['...Quiet evenings. My own quiet.'],
    curious: ['I can stay up reading. All night if I like.'],
    dreamy: ['Planting my own garden. Seeing what comes up.'],
    witty: ['I can eat cake standing at the window. It\'s my window.'],
    proud: ['Making my own way. Owing nobody.'],
    gloomy: ['...It\'s mine. That\'s something.'],
  });
  L('ages.own.toast', {
    _: ['Ha! Seasoning! I\'m going to tell everyone that!', 'Then I\'m a very well-seasoned cook.'],
    cheerful: ['Ha! Charcoal seasoning! A delicacy!'],
    ornery: ['That\'s what I\'ve been saying.'],
    shy: ['...Ha. That\'s nice of you.'],
    curious: ['Is it, though? Does it count as a flavor?'],
    dreamy: ['Smoke-kissed. That sounds better.'],
    witty: ['I serve it with a side of excuses.'],
    proud: ['It\'s a style. It\'s my style.'],
    gloomy: ['Ha. Thanks.'],
  });
  L('ages.own.worst', {
    _: ['Nobody to blame. When the roof leaks, it\'s me.', 'The quiet, sometimes. And the leaks.'],
    cheerful: ['The washing! It never ends! But I sing through it!'],
    ornery: ['Folk thinking they can still tell me what to do.'],
    shy: ['...Having to go to things. On my own. Nobody to hide behind.'],
    curious: ['Not knowing. Nobody tells you how to be grown. You just are.'],
    dreamy: ['Coming home to a dark house. That\'s the worst.'],
    witty: ['Being responsible. I\'m terribly bad at it.'],
    proud: ['Nothing. I\'m managing perfectly.'],
    gloomy: ['The loneliness. There. I said it.'],
  });
  L('ages.own.visit', {
    _: ['A bad cake. I can manage a bad cake. I\'ll go.', 'You\'re right. I\'ll go round. Today.'],
    cheerful: ['Yes! I\'ll bake the worst cake ever and they\'ll love it!'],
    ornery: ['Fine. But I\'m not staying for the lecture.'],
    shy: ['...I\'ll go. I\'ll just sit in the kitchen.'],
    curious: ['I\'ll go. I\'ve questions for them anyway.'],
    dreamy: ['I\'ll go before supper. While the light\'s warm.'],
    witty: ['A bad cake. My specialty. I\'m going.'],
    proud: ['I\'ll take a good cake. Obviously.'],
    gloomy: ['...Yes. I\'ve been meaning to.'],
  });
  L('ages.own.more', {
    _: ['Do they? ...I suppose they do.', 'More? You think? They never say.'],
    cheerful: ['Oh! I bet they do! I\'ll go and see them soon!'],
    ornery: ['They\'ve a funny way of showing it.'],
    shy: ['...I hope so.'],
    curious: ['How can you tell? Have they said something?'],
    dreamy: ['They keep my old room. I\'ve noticed.'],
    witty: ['They miss my laundry. That\'s all.'],
    proud: ['Well, naturally.'],
    gloomy: ['...That\'s nice to think.'],
  });
  L('ages.own.well', {
    _: ['Have I? Thank you. Most days I\'m faking it.', 'I\'m trying. That\'s most of it, I think.'],
    cheerful: ['I have, haven\'t I! Ha!'],
    ornery: ['Course I have.'],
    shy: ['...Thank you.'],
    curious: ['What does taking to it well look like? Am I doing it?'],
    dreamy: ['Like a duck to water. A slightly lost duck.'],
    witty: ['Like a cat takes to a bath.'],
    proud: ['I have. Thank you for noticing.'],
    gloomy: ['...Some days.'],
  });
  L('ages.own.nobody', {
    _: ['Nobody? Not even the old ones?', 'That\'s a comfort. And a worry.'],
    cheerful: ['Ha! Then we\'re all in it together!'],
    ornery: ['I knew it. They\'re all pretending.'],
    shy: ['...Oh. That helps.'],
    curious: ['Not even wizards? Really?'],
    dreamy: ['Then we\'re all making it up as we go. Like a song.'],
    witty: ['Then I\'m perfectly normal. Wonderful. Disappointing.'],
    proud: ['Well, I\'ve got it more worked out than most.'],
    gloomy: ['...That\'s actually cheering.'],
  });
  L('ages.own.blame', {
    _: ['Ha! Nobody to blame! That\'s exactly it!', 'Bills and nobody to blame. You\'ve been grown too, then.'],
    cheerful: ['Ha! I blame the cat! I don\'t have a cat!'],
    ornery: ['I blame the Moot. For everything.'],
    shy: ['...Ha. Yes.'],
    curious: ['Who do wizards blame?'],
    dreamy: ['I blame the moon. It\'s always the moon.'],
    witty: ['I blame you. You\'re here.'],
    proud: ['I don\'t need anyone to blame.'],
    gloomy: ['I blame myself. Every time.'],
  });

  // ==================================================================================
  // Wanderlust: over the hills
  // ==================================================================================
  addThread({
    id: 'ages.wanderlust', label: 'Ever wanted to see over the hills?', weight: 1.0, cool: 5,
    when: (F) => F.ageBand === 'youth' || F.ageBand === 'young' || (F.ageBand === 'middle' && (F.ageBrave || F.ageTrips > 0)),
    rel: (F) => (F.ageBrave ? 1.5 : 1) * (F.ageAway ? 1.3 : 1),
    open: { tale: 'ages.wander.open' },
    beats: {
      start: { line: 'ages.wander.start', go: [
        { ap: 'ask', say: 'Where would you go?', to: 'where' },
        { ap: 'jest', say: 'Trolls, mostly. And bad inns.', to: 'trolls' },
        { ap: 'tale', say: 'I\'ve seen the Sea. It goes further than anyone tells you.', to: 'sea' },
      ] },
      where: { line: 'ages.wander.where', go: [
        { ap: 'ask', say: 'What\'s stopping you?', to: 'stopping' },
        { ap: 'share', say: 'Every road I took started one step past a gate.', to: 'gate' },
      ] },
      trolls: { line: 'ages.wander.trolls', go: [
        { ap: 'ask', say: 'So where would you go?', to: 'where' },
        { ap: 'tale', say: 'Trolls turn to stone at dawn. The trick is keeping them talking.', to: 'stone' },
      ] },
      sea: { line: 'ages.wander.sea', go: [
        { ap: 'ask', say: 'Where would you go, if you could?', to: 'where' },
        { ap: 'ask', say: 'What\'s stopping you?', to: 'stopping' },
      ] },
      stone: { line: 'ages.wander.stone', fx: { joke: { k: 'ages.trolls', t: 'Keep the trolls talking till dawn.' } }, go: [
        { ap: 'ask', say: 'What\'s stopping you going?', to: 'stopping' },
      ] },
      stopping: { line: 'ages.wander.stopping', go: [
        { ap: 'advise', say: 'Start small. Over the hills for a day, and back by supper.', to: 'small' },
        { ap: 'warm', say: 'The road keeps. It\'ll be there when you\'re ready.', to: 'keeps' },
        { ap: 'jest', say: 'Take a wizard. They\'re handy with trolls.', to: 'with' },
      ] },
      gate: { line: 'ages.wander.gate', fx: { feel: 'inspired' }, go: [
        { ap: 'ask', say: 'So what\'s stopping you?', to: 'stopping' },
        { ap: 'warm', say: 'Your gate\'s still there. It\'s not going anywhere.', to: 'keeps' },
      ] },
      small: { line: 'ages.wander.small', fx: { respect: 0.03, drive: { bored: -0.1 } }, end: true },
      keeps: { line: 'ages.wander.keeps', fx: { fond: 0.02 }, end: true },
      with: { line: 'ages.wander.with', fx: { fond: 0.03, hook: 'ages.road' }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.wander.open', [
    { text: ['Ever wanted to see what\'s over the hills, {name}?', 'You\'ve a look of the road about you, {name}.', 'Do you ever look at the West Road, {name}, and wonder?'] },
    { if: { ageAway: has }, text: ['{AgeAway}\'s off adventuring, I hear, {name}. Tempted?'] },
  ]);
  L('ages.wander.start', {
    _: ['Every day. Then I have my tea and stay put.', 'Sometimes. Mostly when it\'s sunny. Never when it rains.'],
    cheerful: ['Oh, always! I want to see everything! Then come home and tell everyone!'],
    ornery: ['What for? Everything I need is here. ...I might like to see the Mountain.'],
    shy: ['...I\'ve thought about it. In bed. In the dark. It\'s easier in the dark.'],
    curious: ['Yes! What\'s there? Who\'s there? What do they eat? I need to know.'],
    dreamy: ['Every evening the hills go blue and I want to walk into them.'],
    witty: ['I\'ve been to the end of the lane. Twice. I\'m practically a legend.'],
    proud: ['I\'d be good at adventuring. Brave. Resourceful.'],
    gloomy: ['What\'s the point? It\'ll just be more hills.'],
    'k:cheerful': ['YES! Can we go now? Is there a dragon?'],
    'k:ornery': ['Yes. And nobody\'s allowed to stop me.'],
    'k:shy': ['...Maybe. If someone came with me.'],
    'k:curious': ['What IS over the hills? Nobody will tell me properly!'],
    'k:gloomy': ['Mom won\'t let me.'],
  }, [
    { if: { ageTrips: { min: 1 } }, pri: 1, text: ['I\'ve been! Once. I came back with blisters and a story. I\'d go again tomorrow.'] },
    { if: { ageAway: has }, text: ['{AgeAway}\'s off on the road right now. I\'m so jealous I could spit.'] },
    { if: { rift: true }, text: ['I came through a rift. I\'ve done the biggest journey there is. Now I want a small one. With a picnic.'] },
  ]);
  L('ages.wander.where', {
    _: ['The Mountain. I want to see snow on a mountain in summer.', 'Bree. The big inn. Folk from everywhere.'],
    cheerful: ['Everywhere! The Sea! The Mountain! A forest full of elves singing!'],
    ornery: ['Somewhere nobody\'s been. So I can say I was first.'],
    shy: ['...A quiet lake. Clear as glass. I heard about one.'],
    curious: ['The edge of the map. I want to see where the map stops and what\'s there.'],
    dreamy: ['The Sea. To sit on a beach and listen.'],
    witty: ['An inn where the beds are made for Big Folk. I\'d sleep sideways.'],
    proud: ['The Mountain. To the top. And plant a flag.'],
    gloomy: ['I don\'t know. Somewhere different from here.'],
    'k:cheerful': ['Where the dragons are!'],
    'k:ornery': ['Away from my sister.'],
    'k:shy': ['...Somewhere with no people. And lots of birds.'],
    'k:curious': ['Where the river goes! It has to go somewhere!'],
    'k:gloomy': ['Somewhere nobody tells me what to do.'],
  }, [
    { if: { ageRiftFolk: true, rift: false }, text: ['Neverdark. The rift-folk\'s city. Lights that never go out! Imagine!'] },
    { if: { rift: true }, text: ['A real forest. Back home trees were on screens. I want to get lost in a real one.'] },
  ]);
  L('ages.wander.trolls', {
    _: ['Trolls! Have you really met trolls?', 'Ha! I\'d take a troll over a bad inn.'],
    cheerful: ['Trolls! Oh, I\'d love to see a troll! From a distance!'],
    ornery: ['I\'d give a troll a piece of my mind.'],
    shy: ['...Trolls? Real ones? Oh.'],
    curious: ['How big? What do they eat? Is it true they turn to stone?'],
    dreamy: ['A troll in the moonlight. Like an old story.'],
    witty: ['Bad inns are worse. Trolls at least have manners. Some.'],
    proud: ['I\'m not afraid of trolls.'],
    gloomy: ['See? That\'s why I stay home.'],
    'k:cheerful': ['TROLLS! Did you fight them?'],
    'k:ornery': ['I\'d kick a troll.'],
    'k:shy': ['*steps a little closer to you*'],
    'k:curious': ['How big are trolls? Bigger than the mill?'],
    'k:gloomy': ['I knew it. Trolls.'],
  });
  L('ages.wander.sea', {
    _: ['The Sea? You\'ve really seen it? What\'s it like?', 'Further than anyone tells you. ...How far is that?'],
    cheerful: ['The SEA! Oh, tell me! Is it blue? Is it loud?'],
    ornery: ['Big puddle, I expect. ...Go on, what\'s it like?'],
    shy: ['...I\'d like to see that. Just once.'],
    curious: ['Is it salty? Really salty? How do the fish manage?'],
    dreamy: ['The Sea. I hear it in shells. I want to hear the real thing.'],
    witty: ['Further than anyone tells you. Like my walks to the inn.'],
    proud: ['I\'ll see it one day. I\'m sure of it.'],
    gloomy: ['And I\'ll never see it.'],
    'k:cheerful': ['Is it bigger than the pond? Is it?'],
    'k:ornery': ['I bet it\'s cold.'],
    'k:shy': ['...Is it scary?'],
    'k:curious': ['What\'s on the other side of it?'],
    'k:gloomy': ['I\'ll never see it.'],
  });
  L('ages.wander.stone', {
    _: ['Keep them talking! Ha! I could do that. I talk a lot.', 'Till dawn. I\'ll remember that, if I meet one.'],
    cheerful: ['Ha! I could talk a troll into stone easily!'],
    ornery: ['I\'d argue with it. That\'d keep it.'],
    shy: ['...I\'d be no good. I\'d go quiet.'],
    curious: ['Why does dawn do that? Is it the light? Is it magic?'],
    dreamy: ['A troll turned to stone, frozen mid-word. There\'s a story.'],
    witty: ['Talk till dawn? I\'ve done that at the Badger.'],
    proud: ['I\'d keep it talking. I\'m very good company.'],
    gloomy: ['Knowing my luck it would be a cloudy morning.'],
    'k:cheerful': ['I can talk FOREVER!'],
    'k:ornery': ['I\'d tell it it was ugly.'],
    'k:shy': ['...I\'d hide.'],
    'k:curious': ['Why dawn? Why?'],
    'k:gloomy': ['It\'d eat me first.'],
  });
  L('ages.wander.stopping', {
    _: ['The work. The family. The fear, a bit. Mostly the fear.', 'I don\'t know. There\'s always a reason to go tomorrow.'],
    cheerful: ['Nothing! Well. Everything I love is here. That\'s the trouble.'],
    ornery: ['Nobody to mind the garden. That\'s all. ...And a bit of nerves.'],
    shy: ['...Me. I\'m stopping me.'],
    curious: ['I don\'t know enough yet. I want to know where I\'m going first.'],
    dreamy: ['I\'m afraid it won\'t be as good as I imagine.'],
    witty: ['My boots. They\'re very comfortable here.'],
    proud: ['Duties. Someone has to keep things running.'],
    gloomy: ['I\'d get lost. Or worse.'],
    'k:cheerful': ['I\'m not allowed! Yet!'],
    'k:ornery': ['Grown-ups.'],
    'k:shy': ['...I\'m scared.'],
    'k:curious': ['Nobody will take me.'],
    'k:gloomy': ['Everyone says no.'],
  }, [
    { if: { kid: has }, pri: 1, text: ['{Kid}. I can\'t go and leave {kid}. Not yet.'] },
    { if: { spouse: has }, text: ['{Spouse} thinks I\'d never come back. {Spouse} might be right.'] },
    { if: { job: has }, text: ['Who\'d do the {ageTrade} while I\'m off seeing the world?'] },
  ]);
  L('ages.wander.gate', {
    _: ['One step past a gate. That\'s all? That\'s all it takes?', 'One step past a gate. I\'ve stood at mine a hundred times.'],
    cheerful: ['Oh, I like that! One step! I\'ll take it tomorrow!'],
    ornery: ['Hmph. Easy for you. You haven\'t got a garden.'],
    shy: ['...One step. Maybe I can do one step.'],
    curious: ['And then what? The second step? Is it easier?'],
    dreamy: ['One step past a gate. That\'s how the songs start.'],
    witty: ['My gate sticks. It\'s a sign.'],
    proud: ['I\'ll take more than one step.'],
    gloomy: ['...One step. Hm.'],
    'k:cheerful': ['I\'m going to step past EVERY gate!'],
    'k:ornery': ['Our gate\'s locked.'],
    'k:shy': ['...Just one?'],
    'k:curious': ['Which gate? Any gate?'],
    'k:gloomy': ['...Maybe.'],
  });
  L('ages.wander.small', {
    _: ['Over the hills and back by supper. I could do that. I will.', 'A day. Just a day. That\'s not frightening.'],
    cheerful: ['Yes! A day trip! With a picnic! Next Highday!'],
    ornery: ['A day. Fine. But I\'m not missing supper.'],
    shy: ['...A day. I could manage a day.'],
    curious: ['I\'ll map it! Just the first hill. Then the next.'],
    dreamy: ['To the top of the first hill, to see the next one. Yes.'],
    witty: ['Back by supper. The most important part of any adventure.'],
    proud: ['A day. To start. Then we\'ll see.'],
    gloomy: ['...A day. All right.'],
    'k:cheerful': ['A WHOLE DAY!'],
    'k:ornery': ['A day\'s not long enough.'],
    'k:shy': ['...With someone?'],
    'k:curious': ['Which hill first?'],
    'k:gloomy': ['...Okay.'],
  });
  L('ages.wander.keeps', {
    _: ['It keeps. Yes. That\'s comforting.', 'There when I\'m ready. I like that.'],
    cheerful: ['Then I\'ll go when the time\'s perfect!'],
    ornery: ['It had better.'],
    shy: ['...Good. I\'m not ready yet.'],
    curious: ['How will I know when I\'m ready?'],
    dreamy: ['Roads are patient. I like that.'],
    witty: ['The road keeps. Unlike my bread.'],
    proud: ['I\'ll be ready before it is.'],
    gloomy: ['...Maybe I\'ll be ready one day.'],
  });
  L('ages.wander.with', {
    _: ['Would you? Take me? On the road? ...You\'re joking. Are you joking?', 'Ha! A wizard bodyguard! I\'d be the envy of the valley.'],
    cheerful: ['YES! When? Tomorrow? I\'ll pack now!'],
    ornery: ['Hmph. You\'d only set things on fire.'],
    shy: ['...With you I might be brave.'],
    curious: ['Truly? Where would we go first?'],
    dreamy: ['On the road with a wizard. Like the old tales.'],
    witty: ['A wizard handy with trolls. And a hobbit handy with sandwiches. A fair team.'],
    proud: ['I\'d be a great asset to you.'],
    gloomy: ['...You\'d want me along?'],
    'k:cheerful': ['TAKE ME! TAKE ME!'],
    'k:ornery': ['Mom wouldn\'t let me. ...Would she?'],
    'k:shy': ['...Really?'],
    'k:curious': ['Where? When? HOW FAR?'],
    'k:gloomy': ['...You\'d take me? Me?'],
  });

  // ==================================================================================
  // Big dreams: the young and their dream
  // ==================================================================================
  addThread({
    id: 'ages.bigdreams', label: 'Big plans for your life?', weight: 1.0, cool: 5, reveals: 'dream',
    when: (F) => !!F.dream && (F.ageBand === 'youth' || F.ageBand === 'young'),
    open: { ask: 'ages.dreams.open' },
    beats: {
      start: { line: 'ages.dreams.start', fx: { learn: ['dream', '{dreamText}'] }, go: [
        { ap: 'ask', say: 'Why that, of all things?', to: 'why' },
        { ap: 'jest', say: 'Ambitious. I\'ll want a seat at the front.', to: 'front' },
        { ap: 'ask', say: 'What\'s in the way?', to: 'way' },
      ] },
      why: { line: 'ages.dreams.why', go: [
        { ap: 'ask', say: 'And what\'s in the way?', to: 'way' },
        { ap: 'share', say: 'When I was young I wanted to tame a thunderstorm.', to: 'storm' },
      ] },
      front: { line: 'ages.dreams.front', go: [
        { ap: 'ask', say: 'Seriously. What\'s in the way?', to: 'way' },
        { ap: 'warm', say: 'I mean it. I\'d come.', to: 'come' },
      ] },
      way: { line: 'ages.dreams.way', go: [
        { ap: 'advise', say: 'Then the first step is the small one. What is it?', to: 'step' },
        { ap: 'comfort', say: 'You\'ve time. More than you think.', to: 'time' },
      ] },
      storm: { line: 'ages.dreams.storm', fx: { joke: { k: 'ages.storm', t: 'The wizard wanted to tame a thunderstorm. He settled for fireworks.' }, fond: 0.02 }, go: [
        { ap: 'ask', say: 'So. What\'s in your way?', to: 'way' },
        { ap: 'warm', say: 'Dreams change shape. They don\'t go away.', to: 'shape' },
      ] },
      step: { line: 'ages.dreams.step', fx: { respect: 0.03, feel: 'inspired', hook: 'ages.dream' }, end: true },
      time: { line: 'ages.dreams.time', fx: { trust: 0.02 }, end: true },
      come: { line: 'ages.dreams.come', fx: { fond: 0.03 }, end: true },
      shape: { line: 'ages.dreams.shape', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.dreams.open', [{ text: ['Big plans for your life, {name}?', 'What do you want from it all, {name}? Not today. Your whole life.'] }]);
  L('ages.dreams.start', {
    _: ['I\'d like to {dreamText}. One day. Don\'t laugh.', 'One day I\'m going to {dreamText}. I\'ve decided.'],
    cheerful: ['Oh, I\'m going to {dreamText}! Isn\'t it exciting?'],
    ornery: ['I\'m going to {dreamText}. And nobody\'s going to stop me.'],
    shy: ['...I\'d like to {dreamText}. I\'ve never said it out loud.'],
    curious: ['I want to {dreamText}. And find out everything on the way.'],
    dreamy: ['To {dreamText}. I can see it, when I close my eyes.'],
    witty: ['To {dreamText}. And to be insufferable about it after.'],
    proud: ['I will {dreamText}. It\'s only a matter of time.'],
    gloomy: ['I\'d like to {dreamText}. I don\'t suppose I will.'],
    'k:cheerful': ['I\'m going to {dreamText}! When I\'m big!'],
    'k:ornery': ['I\'m going to {dreamText}. So there.'],
    'k:shy': ['...I want to {dreamText}. Shh.'],
    'k:curious': ['I want to {dreamText}. How do you do it? Do you know?'],
    'k:gloomy': ['I want to {dreamText}. Everyone says I can\'t.'],
  }, [
    { if: { dream: null }, text: ['I don\'t know yet. Something big.'] },
  ]);
  L('ages.dreams.why', {
    _: ['Because it\'s mine. Not my folks\'. Not anyone\'s. Mine.', 'I don\'t know. It just feels like the shape of me.'],
    cheerful: ['Because it would make me so happy! And everyone else too!'],
    ornery: ['Because everyone said I couldn\'t.'],
    shy: ['...Because it would mean I mattered. A bit.'],
    curious: ['Because I want to know if I can.'],
    dreamy: ['Because I dreamed it, once, and woke up smiling.'],
    witty: ['Because the alternative is doing what I\'m told.'],
    proud: ['Because I\'d be the best at it.'],
    gloomy: ['Because it\'d prove something. To someone.'],
    'k:cheerful': ['Because it\'s the BEST!'],
    'k:ornery': ['Because.'],
    'k:shy': ['...It feels right.'],
    'k:curious': ['Why not?'],
    'k:gloomy': ['...I don\'t know.'],
  });
  L('ages.dreams.front', {
    _: ['Ha! Front row. I\'ll save it. With your name on.', 'You\'d come? Truly? Ha!'],
    cheerful: ['Ha! I\'ll save you the best seat!'],
    ornery: ['You\'ll have to pay like everyone else.'],
    shy: ['...You\'d come?'],
    curious: ['What would you want to see? Tell me, I\'ll plan for it.'],
    dreamy: ['A wizard in the front row. Oh.'],
    witty: ['Front row. Behind a tall wizard. Oh, wait.'],
    proud: ['Of course. Only the best seats for you.'],
    gloomy: ['...If it ever happens.'],
  });
  L('ages.dreams.way', {
    _: ['Everything. Time. Money. Me. Mostly me.', 'I don\'t know how to start. That\'s the truth.'],
    cheerful: ['Oh, nothing much! A few things! Lots of things!'],
    ornery: ['Folk telling me to be sensible.'],
    shy: ['...I\'d have to ask people for things. I\'m bad at that.'],
    curious: ['I don\'t know enough yet. I\'m learning. Slowly.'],
    dreamy: ['Real life. It keeps getting in the way of the dream.'],
    witty: ['My own good sense. I\'m trying to get rid of it.'],
    proud: ['Nothing I can\'t handle.'],
    gloomy: ['Everything. Always everything.'],
    'k:cheerful': ['Being little!'],
    'k:ornery': ['Grown-ups.'],
    'k:shy': ['...Being scared.'],
    'k:curious': ['Not knowing how!'],
    'k:gloomy': ['Everyone.'],
  }, [
    { if: { dream: 'master' }, pri: 1, text: ['The work. Getting good takes years. I\'m impatient.'] },
    { if: { dream: 'family' }, pri: 1, text: ['Finding the right one first. That bit\'s not up to me.'] },
    { if: { dream: 'wed' }, pri: 1, text: ['Finding someone. Then being brave enough to ask.'] },
    { if: { dream: 'friends' }, pri: 1, text: ['Me. I\'m not good at making friends. I want to be.'] },
  ]);
  L('ages.dreams.storm', {
    _: ['A thunderstorm! Did you? Could you?', 'Tame one? How? With a rope?'],
    cheerful: ['Ha! That\'s the best dream I\'ve ever heard!'],
    ornery: ['And did you? No. Fireworks. Ha.'],
    shy: ['...That\'s a big dream. Bigger than mine.'],
    curious: ['How far did you get? Did you try?'],
    dreamy: ['A thunderstorm on a lead. Oh, I can see it.'],
    witty: ['And now you tame small explosions. A natural step down.'],
    proud: ['A worthy ambition.'],
    gloomy: ['And you didn\'t. So nobody gets their dream.'],
    'k:cheerful': ['A THUNDERSTORM! Wow!'],
    'k:ornery': ['That\'s not real.'],
    'k:shy': ['...Wow.'],
    'k:curious': ['Can storms be tamed?'],
    'k:gloomy': ['...Did you?'],
  });
  L('ages.dreams.step', {
    _: ['The small one. Hm. I could... ask someone. Tomorrow.', 'The first step. I know what it is. I\'ve known for ages.'],
    cheerful: ['Oh! I know! I\'ll do it this afternoon!'],
    ornery: ['Fine. The first step. I\'ll do it. Watch me.'],
    shy: ['...I\'ll write it down. Then I\'ll do it.'],
    curious: ['Let me think. Yes. Yes, there\'s a first step.'],
    dreamy: ['The first step. Like the first note of a song.'],
    witty: ['The first step is getting up. I\'ll start there.'],
    proud: ['I\'ll take it. Today.'],
    gloomy: ['...All right. One step.'],
    'k:cheerful': ['I\'m doing it NOW!'],
    'k:ornery': ['Fine.'],
    'k:shy': ['...Tomorrow.'],
    'k:curious': ['What IS the first step?'],
    'k:gloomy': ['...Okay.'],
  });
  L('ages.dreams.time', {
    _: ['More than I think? You\'d know, I suppose.', 'Time. Yes. I\'m always in a hurry.'],
    cheerful: ['Oh, good! More time for everything!'],
    ornery: ['Everyone says that.'],
    shy: ['...That\'s a relief.'],
    curious: ['How much? Roughly?'],
    dreamy: ['Time to dream it properly, first.'],
    witty: ['Says the wizard with centuries.'],
    proud: ['I won\'t need it all.'],
    gloomy: ['...Do I?'],
  });
  L('ages.dreams.come', {
    _: ['You\'d come. Truly. Oh.', 'Then I\'d better make it worth coming to.'],
    cheerful: ['Oh! Then I have to do it now!'],
    ornery: ['Hm. Then I\'ll have to do it, won\'t I.'],
    shy: ['...Thank you.'],
    curious: ['Do you go to many people\'s dreams?'],
    dreamy: ['A wizard at my dream. That makes it realer.'],
    witty: ['No pressure, then.'],
    proud: ['You\'ll be impressed.'],
    gloomy: ['...That means a lot.'],
  });
  L('ages.dreams.shape', {
    _: ['They change shape. I like that. Mine might.', 'Then I\'ll keep it, whatever shape it ends up.'],
    cheerful: ['Ha! Then mine will be a different dream every week!'],
    ornery: ['Mine won\'t change. I won\'t let it.'],
    shy: ['...That\'s comforting.'],
    curious: ['What shape will mine end up, I wonder?'],
    dreamy: ['Like a cloud. Yes.'],
    witty: ['Mine will end up shaped like a pie. They always do.'],
    proud: ['Mine will stay true.'],
    gloomy: ['...So it\'s never quite what you wanted.'],
  });

  // ==================================================================================
  // The middle years: busy
  // ==================================================================================
  addThread({
    id: 'ages.busy', label: 'Run off your feet?', weight: 1.1, cool: 3,
    when: (F) => F.ageBand === 'middle',
    rel: (F) => (F.tired ? 1.5 : 1) * (F.kidCount ? 1.2 : 1),
    open: { warm: 'ages.busy.open' },
    beats: {
      start: { line: 'ages.busy.start', go: [
        { ap: 'comfort', say: 'Sit down a moment. The world will wait.', to: 'sit' },
        { ap: 'jest', say: 'You need a wizard. Or a second you.', to: 'second' },
        { ap: 'ask', say: 'And what\'s it all for, at the end of the day?', to: 'for' },
      ] },
      sit: { line: 'ages.busy.sit', fx: { drive: { tired: -0.08 } }, go: [
        { ap: 'ask', say: 'What\'s it all for, at the end of the day?', to: 'for' },
        { ap: 'ask', say: 'When did you last do nothing?', to: 'nothing' },
      ] },
      second: { line: 'ages.busy.second', go: [
        { ap: 'ask', say: 'Truly, though. What\'s it all for?', to: 'for' },
        { ap: 'ask', say: 'When did you last do nothing?', to: 'nothing' },
      ] },
      for: { line: 'ages.busy.for', go: [
        { ap: 'warm', say: 'It shows. The village runs on folk like you.', to: 'shows' },
        { ap: 'ask', say: 'And when do you get a turn?', to: 'turn' },
      ] },
      nothing: { line: 'ages.busy.nothing', go: [
        { ap: 'advise', say: 'Take Highday. Actually take it.', to: 'highday' },
        { ap: 'ask', say: 'What would you do with a whole day off?', to: 'turn' },
      ] },
      turn: { line: 'ages.busy.turn', go: [
        { ap: 'advise', say: 'Take Highday. Actually take it.', to: 'highday' },
        { ap: 'warm', say: 'Then I hope you get it. Soon.', to: 'soon' },
      ] },
      shows: { line: 'ages.busy.shows', fx: { fond: 0.03, respect: 0.01 }, end: true },
      highday: { line: 'ages.busy.highday', fx: { respect: 0.02, drive: { tired: -0.05 } }, end: true },
      soon: { line: 'ages.busy.soon', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.busy.open', [
    { text: ['You look run off your feet, {name}.', 'Busy as ever, {name}?', 'Do you ever stop, {name}?'] },
    { if: { tired: true }, text: ['You look done in, {name}.'] },
  ]);
  L('ages.busy.start', {
    _: ['Run off them, and then some. There\'s the work, the house, the garden, the lot.', 'Busy? I\'ve forgotten what the other thing\'s called.'],
    cheerful: ['Oh, rushing about! But happily! Mostly happily!', 'Busy busy! There\'s always something, and I love it. Mostly.'],
    ornery: ['Somebody has to do everything round here. Guess who.', 'Everyone wants something. Nobody brings anything.'],
    shy: ['...A bit. I don\'t mind. Busy means I don\'t have to talk.', 'Yes. There\'s a lot. I just get on with it.'],
    curious: ['I made a list of everything I do in a day. It\'s got a list on it.', 'I\'ve been timing things. I spend an hour a day looking for my spectacles.'],
    dreamy: ['The days go by like leaves on the river. I watch them go.', 'Some days I look up and it\'s dark and I wonder where it went.'],
    witty: ['I\'m so busy I\'ve started having second breakfast at first breakfast.', 'I do the work of three hobbits. Badly, but three.'],
    proud: ['I keep everything running. Somebody has to.', 'Busy, yes. Never behind, though.'],
    gloomy: ['Always. It never stops. Never.', 'Tired. Just tired.'],
  }, [
    { if: { kidCount: { min: 2 } }, pri: 1, text: ['Children, a job and a garden. I sleep standing up, like a horse.'] },
    { if: { kid: has }, text: ['Between {kid} and the work I don\'t sit down from dawn to dusk.'] },
    { if: { ageOldParent: has }, pri: 1, text: ['The work, the children, and my old {ageOldParentWord} needs looking in on. I\'m the middle of a very long sandwich.'] },
    { if: { job: has }, text: ['The {ageTrade} all day, then everything else all evening.'] },
    { if: { season: 'autumn' }, text: ['Harvest. Pickling. Jars everywhere. I dream in jars.'] },
  ]);
  L('ages.busy.sit', {
    _: ['*sits* Oh. Oh, that\'s nice. I\'d forgotten sitting.', 'Just for a moment. *sighs, very long*'],
    cheerful: ['Ooh, yes. Five minutes. Ten. Oh, this is lovely.'],
    ornery: ['I\'ll sit, but the world won\'t wait. It never does.'],
    shy: ['...Thank you. *sits*'],
    curious: ['*sits* Do you know, I\'ve never sat on this wall. All these years.'],
    dreamy: ['*sits, and looks at the sky* When did the clouds get so lovely?'],
    witty: ['*sits* The world will wait. The washing won\'t.'],
    proud: ['A brief rest. Very brief.'],
    gloomy: ['*sits* If I sit, I won\'t get up.'],
  });
  L('ages.busy.second', {
    _: ['A second me! I\'d send her to do the washing.', 'Ha! A wizard would be handy. Can you peel potatoes by magic?'],
    cheerful: ['Ha! Two of me! We\'d have such fun!'],
    ornery: ['Another me? The village couldn\'t take it.'],
    shy: ['...A second me could go to the parties.'],
    curious: ['A second me. Would we agree? I suspect not.'],
    dreamy: ['A second me could dream while I work.'],
    witty: ['Another me? We\'d only argue about who does the dishes.'],
    proud: ['There\'s only one of me. That\'s rather the point.'],
    gloomy: ['A second me would be just as tired.'],
  });
  L('ages.busy.for', {
    _: ['The little ones. The house. Keeping it all going. That\'s what it\'s for.', 'So the next lot have it a bit easier. That\'s the idea.'],
    cheerful: ['For everyone! A full table and a warm hole and everyone in it!'],
    ornery: ['So nobody can say I didn\'t pull my weight.'],
    shy: ['...So the people I love are all right.'],
    curious: ['Good question. I\'ve been wondering that myself. I think it\'s for later.'],
    dreamy: ['For the evenings. For the moment when everyone\'s home and the fire\'s lit.'],
    witty: ['For supper. Everything is for supper.'],
    proud: ['To build something that lasts.'],
    gloomy: ['I used to know. I\'m not sure, these days.'],
  }, [
    { if: { kid: has }, pri: 1, text: ['For {kid}. All of it. So {kid} has a start I never had.'] },
    { if: { spouse: has }, text: ['For {spouse} and me, when we\'re old and sitting on the step.'] },
  ]);
  L('ages.busy.nothing', {
    _: ['Nothing? Hm. Midsummer, maybe. Three years ago.', 'I can\'t remember. Is that bad? That\'s bad.'],
    cheerful: ['Oh! Last Highday! I lay in the orchard for an hour! Bliss!'],
    ornery: ['Doing nothing is for idlers.'],
    shy: ['...I sit by the river sometimes. Is that nothing?'],
    curious: ['I\'m not sure I know how. Is there a method?'],
    dreamy: ['Every evening I watch the light go. That\'s my nothing.'],
    witty: ['I did nothing for a whole afternoon once. I felt terrible.'],
    proud: ['I don\'t do nothing.'],
    gloomy: ['I don\'t remember. Years.'],
  });
  L('ages.busy.turn', {
    _: ['A turn? Ha. When I\'m old, I suppose.', 'A whole day? I\'d sleep. Then eat. Then sleep.'],
    cheerful: ['A day off! I\'d walk to the top of the knoll with a picnic and never come down!'],
    ornery: ['I\'d lock the door and not answer it.'],
    shy: ['...I\'d read. All day. Nobody asking me anything.'],
    curious: ['I\'d finally finish that book. And start another.'],
    dreamy: ['I\'d lie in the long grass and listen to the bees.'],
    witty: ['I\'d have a lie-in so long they\'d send for the herbalist.'],
    proud: ['I\'d probably work. I don\'t know how to stop.'],
    gloomy: ['I wouldn\'t know what to do with myself.'],
  }, [
    { if: { pastime: ['carving', 'basketry', 'pottery', 'knitting', 'painting'] }, pri: 1, text: ['{PastimeWord}. All day. No interruptions. I\'d finish a {madeOne}.'] },
    { if: { pastime: ['birdwatching', 'collecting'] }, pri: 1, text: ['{PastimeWord}. From dawn till dusk, with a flask and a heel of bread.'] },
  ]);
  L('ages.busy.shows', {
    _: ['Does it? ...Thank you. Nobody says.', 'The village runs on folk like me. I\'ll remind them.'],
    cheerful: ['Oh, you\'re a dear! I\'ll keep going, then!'],
    ornery: ['Hmph. Tell the Moot.'],
    shy: ['...Thank you. I didn\'t think anyone noticed.'],
    curious: ['Does it really? How can you tell?'],
    dreamy: ['That\'s a nice thought to go back to work with.'],
    witty: ['Then the village is running on fumes.'],
    proud: ['I know. But thank you.'],
    gloomy: ['...That helps. A bit.'],
  });
  L('ages.busy.highday', {
    _: ['Highday. Actually take it. All right. This Highday.', 'Really take it. Hm. I might. I might just.'],
    cheerful: ['Yes! A real Highday! I\'ll lie in till noon!'],
    ornery: ['If anyone knocks I\'m sending them to you.'],
    shy: ['...I\'ll try. A quiet one.'],
    curious: ['What do you do on a day off? I\'ll have to find out.'],
    dreamy: ['A whole Highday of doing nothing. Like being young.'],
    witty: ['I\'ll take it. And I\'ll take Mersday too, while I\'m at it.'],
    proud: ['Well. One day won\'t hurt.'],
    gloomy: ['...I\'ll try.'],
  });
  L('ages.busy.soon', {
    _: ['Soon. Yes. Soon. Don\'t hold your breath.', 'Thank you. I\'ll hope for it too.'],
    cheerful: ['Oh, me too! Soon!'],
    ornery: ['Hmph. We\'ll see.'],
    shy: ['...Thank you.'],
    curious: ['How soon? I\'ll mark it.'],
    dreamy: ['Soon. Like spring. It always comes.'],
    witty: ['Soon. Possibly in about forty years.'],
    proud: ['When I\'ve earned it.'],
    gloomy: ['...Maybe.'],
  });

  // ==================================================================================
  // The middle years: what keeps them up at night
  // ==================================================================================
  addThread({
    id: 'ages.worries', label: 'What keeps you up at night?', weight: 1.0, cool: 4,
    when: (F) => F.ageBand === 'middle' || (F.ageBand === 'young' && F.kidCount > 0),
    rel: (F) => (F.mood === 'low' || F.mood === 'miserable' ? 1.6 : 1) * (F.ageOldParent ? 1.3 : 1),
    open: { ask: 'ages.worry.open' },
    beats: {
      start: { line: 'ages.worry.start', go: [
        { ap: 'ask', say: 'Your {ageOldParentWord}?', to: 'parent', need: { if: { ageOldParent: has } } },
        { ap: 'ask', say: 'The children?', to: 'kids', need: { if: { kid: has } } },
        { ap: 'listen', say: '*You let them say it all.*', label: 'Let them say it all', to: 'all' },
        { ap: 'jest', say: 'Owls, I expect. Very inconsiderate birds.', to: 'owls' },
      ] },
      parent: { line: 'ages.worry.parent', fx: { trust: 0.02 }, go: [
        { ap: 'advise', say: 'Go and sit with {ageOldParent}. Ask about the old days. Write it down.', to: 'sitwith' },
        { ap: 'comfort', say: 'You can\'t carry the hills for them. Only walk beside.', to: 'beside' },
      ] },
      kids: { line: 'ages.worry.kids', go: [
        { ap: 'comfort', say: 'They\'re sturdier than you think. They\'re yours.', to: 'sturdy' },
        { ap: 'advise', say: 'Tell them you worry. Then let them go anyway.', to: 'letgo' },
      ] },
      all: { line: 'ages.worry.all', fx: { trust: 0.02, drive: { lonely: -0.05 } }, go: [
        { ap: 'comfort', say: 'Most worries never come to pass.', to: 'pass' },
        { ap: 'share', say: 'I worry too, you know. About fireworks, mostly.', to: 'wizworry' },
      ] },
      owls: { line: 'ages.worry.owls', go: [
        { ap: 'ask', say: 'And the other things? The real ones?', to: 'all' },
        { ap: 'jest', say: 'I could have a word with the owls.', to: 'word' },
      ] },
      sitwith: { line: 'ages.worry.sitwith', fx: { respect: 0.03, queue: 'whisper_visit', queueExtra: (T) => ({ to: personById(T.F.ageOldParentId), kind: 'kin' }) }, end: true },
      beside: { line: 'ages.worry.beside', fx: { trust: 0.03 }, end: true },
      sturdy: { line: 'ages.worry.sturdy', fx: { fond: 0.02 }, end: true },
      letgo: { line: 'ages.worry.letgo', fx: { respect: 0.02 }, end: true },
      pass: { line: 'ages.worry.pass', fx: { fond: 0.02 }, end: true },
      wizworry: { line: 'ages.worry.wizworry', fx: { trust: 0.03, fond: 0.02 }, end: true },
      word: { line: 'ages.worry.word', fx: { joke: { k: 'ages.owls', t: 'The wizard will have a word with the owls.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.worry.open', [{ text: ['What keeps you up at night, {name}?', 'You\'ve a worried look, {name}. What is it?'] }]);
  L('ages.worry.start', {
    _: ['Oh, the usual. Will the stores last. Will the roof hold. Will it all be all right.', 'Everything, a bit. Nothing, really. It\'s the middle of the night that does it.'],
    cheerful: ['Nothing keeps me up! Well. Sometimes. The odd thing.', 'Oh, I sleep like a log! ...Mostly. There are nights.'],
    ornery: ['The neighbors. And their hens. And the state of the lane.', 'What doesn\'t? Nobody else worries, so I have to do it for them.'],
    shy: ['...Little things. That get big in the dark.', 'I go over things I said. Over and over.'],
    curious: ['I lie awake wondering how things work. Then whether they\'ll stop working.', 'Questions. Mostly ones without answers.'],
    dreamy: ['Time. How fast it goes. I lie awake listening to it go.', 'Whether I\'m living the right life, or just a life.'],
    witty: ['My own snoring, mostly. It\'s very loud.', 'The thought that I\'ve left the kettle on. In my sleep.'],
    proud: ['I don\'t worry. I plan.', 'Making sure everything\'s as it should be.'],
    gloomy: ['Everything. Everything keeps me up.', 'That it\'s all going to go wrong. Eventually.'],
  }, [
    { if: { ageOldParent: has }, pri: 1, text: ['My old {ageOldParentWord}. {AgeOldParent}\'s been looking at the hills.', '{AgeOldParent}. My {ageOldParentWord}\'s getting on. Every morning I go round to check.'] },
    { if: { kid: has }, text: ['{Kid}. Always {kid}. Growing up so fast, and I can\'t keep the world soft for ever.'] },
    { if: { season: 'winter' }, text: ['Whether we\'ve enough laid by. Every winter I count the jars twice.'] },
    { if: { sick: true }, pri: 1, text: ['This cough. And whether I\'ll be fit for work.'] },
  ]);
  L('ages.worry.parent', {
    _: ['{AgeOldParent}\'s slowing. Talks about the old days more. And the hills.', 'My {ageOldParentWord}. I keep thinking I\'ll go round and the chair will be empty.'],
    cheerful: ['{AgeOldParent}\'s grand! Mostly! But I see the hills in those eyes sometimes.'],
    ornery: ['{AgeOldParent} won\'t let me help. Stubborn. ...I know where I get it.'],
    shy: ['...I don\'t know how to talk to {ageOldParent} about it.'],
    curious: ['I\'ve so many questions for {ageOldParent}. I keep meaning to ask. Time\'s short.'],
    dreamy: ['I remember {ageOldParent} young and strong, carrying me on the lane.'],
    witty: ['{AgeOldParent} says {ageOldParent}\'s fine. That\'s how I know {ageOldParent} isn\'t.'],
    proud: ['{AgeOldParent} has had a fine life. I want the end of it to be fine too.'],
    gloomy: ['{AgeOldParent} will go over the hills soon. I know it. I can\'t stop it.'],
  });
  L('ages.worry.kids', {
    _: ['That they\'ll be all right. That the world\'s kind to them. That I\'ve done it right.', 'Growing up. Going off. Getting hurt. All of it.'],
    cheerful: ['Oh, they\'re lovely! But I worry they\'ll fall out of a tree. They fall out of trees.'],
    ornery: ['They don\'t listen. They\'ll find out the hard way. I hate that.'],
    shy: ['...That they\'ll be lonely, like I was.'],
    curious: ['What they\'ll become. I can\'t tell yet. It keeps me up.'],
    dreamy: ['That they\'ll grow up and forget the magic. Everyone does.'],
    witty: ['That they\'ll turn out like me. Heaven help them.'],
    proud: ['That they\'ll make the most of themselves. They will.'],
    gloomy: ['Everything that could happen to them.'],
  }, [
    { if: { kid: has }, pri: 1, text: ['{Kid}. {Kid}\'s at that age. Wants to go everywhere, and I want to hold on.'] },
    { if: { ageRiftFolk: true }, text: ['The rifts. And all the new ways. Will they still be hill-folk, my lot?'] },
  ]);
  L('ages.worry.all', {
    _: ['*it all comes out* The roof. The stores. The young ones. My back. Whether I left the gate open.', 'The winter. The harvest. Whether anyone would notice if I stopped.'],
    cheerful: ['Well, if you\'re asking. The cake didn\'t rise, the hens aren\'t laying, and I miss my old mom.'],
    ornery: ['The lane\'s a disgrace, the Moot\'s useless, the weather\'s wrong and nobody listens.'],
    shy: ['...That I\'m not good enough. At anything. That\'s it, really.'],
    curious: ['Whether we\'re ready for what comes. Nobody ever is.'],
    dreamy: ['That life\'s rushing past and I\'m not looking.'],
    witty: ['Everything. In alphabetical order. I get to "turnips" about three in the morning.'],
    proud: ['That things won\'t be kept up properly, when I\'m not here to see to them.'],
    gloomy: ['That nothing gets better. That this is it.'],
  });
  L('ages.worry.owls', {
    _: ['Ha! The owls. Yes. And the hens. Mostly the hens.', 'Owls! They hoot right under my window.'],
    cheerful: ['Ha! The owls are my friends! It\'s the worries that hoot.'],
    ornery: ['Owls. And the miller\'s dog. And folk singing home from the Badger.'],
    shy: ['...Ha. The owls are all right. It\'s my head that\'s noisy.'],
    curious: ['Actually, I\'ve been counting the owls. Three. One has a cough.'],
    dreamy: ['I like the owls. They keep me company when I can\'t sleep.'],
    witty: ['The owls are very inconsiderate. They never bring cookies.'],
    proud: ['Owls don\'t bother me.'],
    gloomy: ['Ha. If only it were owls.'],
  });
  L('ages.worry.sitwith', {
    _: ['Write it down. Yes. Before it\'s gone. I\'ll go this evening.', 'You\'re right. I\'ll go and ask. I\'ve so many questions.'],
    cheerful: ['Oh, yes! I\'ll take a cake and a notebook!'],
    ornery: ['{AgeOldParent} will only complain. ...I\'ll go.'],
    shy: ['...I\'ll go. I\'ll just listen.'],
    curious: ['A notebook! Of course! Why didn\'t I think of that?'],
    dreamy: ['I\'ll go now. While the stories are still there.'],
    witty: ['I\'ll go. {AgeOldParent} will tell the same three stories. I\'ll write them down.'],
    proud: ['Someone should record the family history. I\'ll do it.'],
    gloomy: ['...Yes. While there\'s time.'],
  });
  L('ages.worry.beside', {
    _: ['Walk beside. Yes. I can do that.', 'I can\'t carry the hills. ...No. I suppose I can\'t.'],
    cheerful: ['Walk beside! I\'ll hold {ageOldParent}\'s arm every step!'],
    ornery: ['Hmph. I\'d carry them if I could.'],
    shy: ['...That\'s what I\'ll do. Walk beside.'],
    curious: ['That\'s wise. I\'ve been trying to fix it. It can\'t be fixed.'],
    dreamy: ['Walk beside, all the way to the top of the hill.'],
    witty: ['Walk beside. Slowly. {AgeOldParent} is very slow.'],
    proud: ['I\'ll walk beside, then. Proudly.'],
    gloomy: ['...That\'s all any of us can do, isn\'t it.'],
  });
  L('ages.worry.sturdy', {
    _: ['Sturdier than I think. They\'re mine. Ha. Maybe that\'s the worry.', 'You\'re right. They\'re tough. They get it from somewhere.'],
    cheerful: ['They are, aren\'t they! Little oaks!'],
    ornery: ['They\'re mine. That means stubborn. Stubborn lasts.'],
    shy: ['...I hope so.'],
    curious: ['Do you think so? What makes you say that?'],
    dreamy: ['Like seeds. You can\'t see how strong they are till they come up.'],
    witty: ['Sturdy. Yes. They\'ve survived my cooking.'],
    proud: ['They are. They\'re mine.'],
    gloomy: ['...I hope you\'re right.'],
  });
  L('ages.worry.letgo', {
    _: ['Tell them, then let them go. That\'s the hardest thing there is.', 'I\'ll try. My mother did it. I never knew how hard.'],
    cheerful: ['I\'ll try! And then cry in the pantry!'],
    ornery: ['Let them go? They won\'t go anywhere if I have a say.'],
    shy: ['...I\'ll try.'],
    curious: ['How does anyone do that? Truly?'],
    dreamy: ['Like letting a kite go. Oh.'],
    witty: ['Let them go. And then follow them at a discreet distance.'],
    proud: ['I\'ll let them go. They\'re ready.'],
    gloomy: ['...That\'s the hard part.'],
  });
  L('ages.worry.pass', {
    _: ['Most never do. I know. My head doesn\'t.', 'You\'re right. It\'s the night that makes them big.'],
    cheerful: ['You\'re right! Ninety-nine in a hundred! I\'ll count them tonight!'],
    ornery: ['Most. Not all.'],
    shy: ['...I\'ll try to remember that at three in the morning.'],
    curious: ['I should keep a tally. See how many come true.'],
    dreamy: ['Like clouds. They pass.'],
    witty: ['Most never come to pass. The rest come to stay.'],
    proud: ['I know that. I just like to be ready.'],
    gloomy: ['...Maybe. Maybe not this one.'],
  });
  L('ages.worry.wizworry', {
    _: ['You? Worry? About fireworks? Ha!', 'A wizard who worries. That\'s comforting, somehow.'],
    cheerful: ['Ha! The fireworks! Do they ever go wrong?'],
    ornery: ['You should worry about fireworks. They\'re dangerous.'],
    shy: ['...Really? You worry too?'],
    curious: ['What do wizards worry about? Truly? Not just fireworks?'],
    dreamy: ['Even you lie awake. That\'s nice, somehow.'],
    witty: ['You should. I\'ve seen your fireworks.'],
    proud: ['Well. If you worry, it\'s no shame that I do.'],
    gloomy: ['...So it never stops. Even for wizards.'],
  });
  L('ages.worry.word', {
    _: ['Ha! Do. Tell them to hoot in the afternoon.', 'A word with the owls. I\'d pay to see that.'],
    cheerful: ['Ha! Yes! Tell them to sing a lullaby instead!'],
    ornery: ['They won\'t listen. Nobody listens.'],
    shy: ['...Ha. That\'s nice.'],
    curious: ['Can you talk to owls? Can you really?'],
    dreamy: ['A wizard and an owl, talking at midnight. Like a story.'],
    witty: ['Tell them I\'ve complained to the Moot.'],
    proud: ['Do. And mention my name.'],
    gloomy: ['Ha. Thank you.'],
  });

  // ==================================================================================
  // The middle years: is it how you thought it'd be?
  // ==================================================================================
  addThread({
    id: 'ages.halfway', label: 'Is life how you thought it\'d be?', weight: 0.9, cool: 6,
    when: (F) => F.ageBand === 'middle',
    open: { ask: 'ages.half.open' },
    beats: {
      start: { line: 'ages.half.start', go: [
        { ap: 'ask', say: 'What did you think it\'d be, when you were young?', to: 'young' },
        { ap: 'jest', say: 'You were going to be a dragon-tamer, I expect.', to: 'dragon' },
        { ap: 'ask', say: 'Any of it still to come?', to: 'still' },
      ] },
      young: { line: 'ages.half.young', go: [
        { ap: 'ask', say: 'And what changed?', to: 'changed' },
        { ap: 'ask', say: 'Any of it still to come?', to: 'still' },
      ] },
      dragon: { line: 'ages.half.dragon', go: [
        { ap: 'ask', say: 'Truly, though. What did you want?', to: 'young' },
      ] },
      changed: { line: 'ages.half.changed', go: [
        { ap: 'warm', say: 'The life you got sounds better than the one you planned.', to: 'better' },
        { ap: 'ask', say: 'Do you miss who you were?', to: 'miss', need: { open: 1 }, soft: true },
      ] },
      still: { line: 'ages.half.still', go: [
        { ap: 'advise', say: 'Then start. Halfway is a fine place to start from.', to: 'start2' },
        { ap: 'warm', say: 'You\'ve done more than you give yourself credit for.', to: 'credit' },
      ] },
      better: { line: 'ages.half.better', fx: { fond: 0.02, trust: 0.02 }, end: true },
      miss: { line: 'ages.half.miss', fx: { trust: 0.03 }, go: [
        { ap: 'comfort', say: 'They\'re still in there. I can see them.', to: 'inthere' },
        { ap: 'advise', say: 'Then do one thing they\'d have done. This week.', to: 'start2' },
      ] },
      start2: { line: 'ages.half.start2', fx: { respect: 0.03, feel: 'inspired' }, end: true },
      credit: { line: 'ages.half.credit', fx: { fond: 0.02 }, end: true },
      inthere: { line: 'ages.half.inthere', fx: { fond: 0.03, trust: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('ages.half.open', [{ text: ['Is life how you thought it\'d be, {name}?', 'When you were young, {name}, is this what you pictured?'] }]);
  L('ages.half.start', {
    _: ['Not at all. And somehow exactly.', 'Ha! Nothing\'s how you think it\'ll be. That\'s the joke.'],
    cheerful: ['Better! Messier, but better!', 'Oh, it\'s nothing like I thought! I love it!'],
    ornery: ['No. I thought folk would listen to me by now.', 'I thought I\'d have more say. And a bigger garden.'],
    shy: ['...I didn\'t think much about it. I just hoped it\'d be quiet.', 'It\'s quieter. Which is what I wanted. I think.'],
    curious: ['Not remotely. I didn\'t even know half these things existed.', 'Interesting question. I\'ve been comparing notes with my younger self.'],
    dreamy: ['I thought I\'d be somewhere else. Somewhere further. But here is lovely.', 'The colors are different from what I pictured. Softer.'],
    witty: ['I pictured more adventure and fewer drains.', 'I thought I\'d be taller. That\'s about the extent of the disappointment.'],
    proud: ['Very much as I planned. I planned carefully.', 'Better than I expected. I worked for it.'],
    gloomy: ['No. Nothing ever is.', 'I thought I\'d be happier. I don\'t know why I\'m not.'],
  }, [
    { if: { kidCount: { min: 1 } }, text: ['I never pictured children. Now I can\'t picture without them.'] },
    { if: { spouse: has }, text: ['I never pictured {spouse}. Now I can\'t picture anything else.'] },
    { if: { rift: true }, text: ['I thought I\'d be in a tower in Neverdark. I\'m in a hill with a garden. Weird. Good weird.'] },
  ]);
  L('ages.half.young', {
    _: ['I was going to see the Mountain. And marry a Took. And be famous for something.', 'I wanted my own inn. With a big fire and a cat.'],
    cheerful: ['I was going to be a fiddler! Play every party in the Shire!'],
    ornery: ['I was going to run the Moot. Properly.'],
    shy: ['...I wanted a little cottage on its own by a stream. Just me and the stream.'],
    curious: ['I wanted to know everything. Literally everything. I\'m about a tenth of the way.'],
    dreamy: ['I was going to write songs. Hundreds of them.'],
    witty: ['I was going to be the funniest hobbit in Bree. I never went to Bree.'],
    proud: ['The best in my trade. And I am, so.'],
    gloomy: ['Something different. Something more.'],
  }, [
    { if: { pastime: (p) => !!p }, text: ['I wanted to be known for my {pastimeWord}. I still might.'] },
  ]);
  L('ages.half.dragon', {
    _: ['Ha! Close. A dragon-spotter. From a safe distance.', 'Ha! A dragon-tamer! I wanted to be a mail carrier. Same thing, really.'],
    cheerful: ['Ha! Yes! Isn\'t everyone?'],
    ornery: ['Don\'t be daft.'],
    shy: ['...Ha. No. Something quieter.'],
    curious: ['Actually I did want to see a dragon. Just once. To check.'],
    dreamy: ['A dragon-tamer... no. But I\'d have liked to fly.'],
    witty: ['I tamed my mother-in-law. Close enough.'],
    proud: ['Something more dignified.'],
    gloomy: ['Ha. No.'],
  });
  L('ages.half.changed', {
    _: ['Life. It happens. You say yes to one thing and the rest shuffles along.', 'Love, mostly. And then the little ones. And then the years.'],
    cheerful: ['Everything! And I wouldn\'t change any of it!'],
    ornery: ['Responsibilities. Somebody has to do them.'],
    shy: ['...I didn\'t dare. That\'s what changed. I didn\'t dare.'],
    curious: ['I found other things to wonder about. Better ones.'],
    dreamy: ['The dream got quieter. It\'s still there, humming.'],
    witty: ['Reality. Very bossy.'],
    proud: ['Nothing changed. I just got better at it.'],
    gloomy: ['I don\'t know. It just slipped away.'],
  }, [
    { if: { spouse: has }, pri: 1, text: ['{Spouse} happened. And I\'d choose {spouse} over the Mountain every time.'] },
    { if: { kid: has }, text: ['{Kid} came along. You don\'t mind giving up a dream for a better one.'] },
  ]);
  L('ages.half.still', {
    _: ['Maybe. There\'s one thing. I\'ve not given up on it.', 'Still to come? I hope so. I\'d hate to think it\'s all been.'],
    cheerful: ['Oh, loads! The best is yet to come! I\'m sure of it!'],
    ornery: ['I\'ve still got time. More than folk think.'],
    shy: ['...Maybe. I\'ve one little hope left. I keep it in a drawer.'],
    curious: ['There\'s so much I haven\'t done yet. I\'m keeping a list.'],
    dreamy: ['Maybe the dream\'s just waiting for me to catch up.'],
    witty: ['The rest of it. That\'s still to come.'],
    proud: ['Certainly. I\'m not finished.'],
    gloomy: ['I don\'t know. Maybe the good bit\'s been.'],
  }, [
    { if: { dream: has }, pri: 1, text: ['I still mean to {dreamText}. I tell myself every spring.'] },
  ]);
  L('ages.half.better', {
    _: ['...It does, doesn\'t it. I hadn\'t thought of it that way.', 'Better than planned. Ha. Yes. I think so.'],
    cheerful: ['It is! Oh, it is!'],
    ornery: ['Hmph. It has its moments.'],
    shy: ['...I think so too.'],
    curious: ['Do you think plans are ever better than what happens?'],
    dreamy: ['The unplanned life. Like a wild garden.'],
    witty: ['Better than planned. A low bar. Still.'],
    proud: ['It is. I made it so.'],
    gloomy: ['...Maybe it is.'],
  });
  L('ages.half.miss', {
    _: ['Sometimes. The one who thought anything could happen.', 'I miss being reckless. A bit.'],
    cheerful: ['Oh, I miss the cartwheels! I can still do one! Probably!'],
    ornery: ['I miss my knees. That\'s about it.'],
    shy: ['...I miss being brave. I was braver then.'],
    curious: ['I miss not knowing what I\'d be.'],
    dreamy: ['I miss the dreams. They were so big.'],
    witty: ['I miss my hair.'],
    proud: ['I don\'t miss them. I became something better.'],
    gloomy: ['Every day. I miss being hopeful.'],
  });
  L('ages.half.start2', {
    _: ['Halfway\'s a fine place to start. I like that. All right.', 'One thing this week. I can manage one thing.'],
    cheerful: ['Yes! I\'ll start tomorrow! Today!'],
    ornery: ['Fine. Halfway. And I\'ll finish it.'],
    shy: ['...One small thing. Yes.'],
    curious: ['Halfway. Then I know where I\'m starting from. That helps.'],
    dreamy: ['Halfway down the road, I\'ll turn and look up the hill again.'],
    witty: ['Starting halfway. Saves time.'],
    proud: ['I\'ll start. And do it properly.'],
    gloomy: ['...All right. I\'ll try.'],
  });
  L('ages.half.credit', {
    _: ['Have I? ...Maybe I have.', 'Thank you. I don\'t look back much.'],
    cheerful: ['Oh! That\'s kind!'],
    ornery: ['Hmph. I give myself plenty of credit.'],
    shy: ['...Thank you.'],
    curious: ['What have I done, do you think? I\'d like to hear it.'],
    dreamy: ['Maybe the doing was the point.'],
    witty: ['I give myself credit. The Badger won\'t.'],
    proud: ['I have, haven\'t I.'],
    gloomy: ['...Maybe.'],
  });
  L('ages.half.inthere', {
    _: ['...Can you? Truly?', 'Still in there. Ha. Under all the sensible.'],
    cheerful: ['They are! Watch! *does a little jig*'],
    ornery: ['Hmph. Well. Maybe a bit.'],
    shy: ['...I hope so.'],
    curious: ['What do you see? Exactly?'],
    dreamy: ['Then I\'ll go looking for them. Tonight.'],
    witty: ['They\'re in there. Hiding from the washing.'],
    proud: ['Of course they are.'],
    gloomy: ['...Thank you. I needed that.'],
  });
});
