'use strict';
// ---------------------------------------------------------------------------
// Pastimes, part two: collecting and birdwatching, masterpieces (js/hearts.js),
// teaching a craft (the wizard has a go, and is terrible), presents made for
// someone, a second hobby, and the things folk come to show the wizard of
// their own accord: a piece just finished, a find, a bird. Facts come from
// the pastimes pack.
// ---------------------------------------------------------------------------

talkPack('pastimes2', () => {
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
  const hob = (F, k) => (F.hobbies || []).includes(k);

  // ==================================================================================
  // --- Collecting --------------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.collecting', about: 'pastime', reveals: 'pastime.collecting', weight: 1, cool: 5,
    label: (F) => (F.stage === 'child' ? 'Found any treasures?' : 'Your collection'),
    when: (F) => hob(F, 'collecting'),
    rel: (F) => (F.pastime === 'collecting' ? 1.3 : 0.9),
    open: { ask: 'pastime.collecting.open' },
    beats: {
      start: { line: 'pastime.collecting.start', go: [
        { ap: 'ask', say: 'What do you collect, mostly?', to: 'what' },
        { ap: 'ask', say: 'What\'s the best thing you ever found?', to: 'best' },
        { ap: 'jest', say: 'Is there any room left in the house for you?', to: 'room' },
      ] },
      what: { line: 'pastime.collecting.what', fx: { learn: ['pastime.collecting', '{Name} collects things: {collectKind}, mostly'] }, go: [
        { ap: 'ask', say: 'How do you choose which to keep?', to: 'choose' },
        { ap: 'warm', say: 'Show me your favourite one, some day.', to: 'fav' },
        { ap: 'share', say: 'I keep a pocketful of acorns from every wood I walk through.', to: 'acorns' },
      ] },
      best: { line: 'pastime.collecting.best', go: [
        { ap: 'ask', say: 'Where did you find it?', to: 'where' },
        { ap: 'jest', say: 'And you\'ve not sold it to a dragon? Very wise.', to: 'dragon' },
      ] },
      room: { line: 'pastime.collecting.room', fx: { joke: { k: 'pastime.shelf', t: 'There\'s always room on the shelf. There\'s just no shelf.' } }, go: [
        { ap: 'jest', say: 'Collect shelves next. Two birds, one stone.', to: 'shelves' },
        { ap: 'ask', say: 'What does the household say about it?', to: 'household' },
      ] },
      choose: { line: 'pastime.collecting.choose', go: [
        { ap: 'ask', say: 'Have you ever let one go again?', to: 'letgo', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'That sounds like the right way to choose.', to: 'end' },
      ] },
      fav: { line: 'pastime.collecting.fav', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'I\'d be honoured.', to: 'end' },
        { ap: 'ask', say: 'Why that one?', to: 'why' },
      ] },
      acorns: { line: 'pastime.collecting.acorns', fx: { trust: 0.02 }, go: [
        { ap: 'share', say: 'Here. *You fish out an acorn from far away and give it to them.*', label: 'Give them a far-off acorn', to: 'gift' },
        { ap: 'jest', say: 'One day I\'ll plant them all and have the strangest wood in the world.', to: 'end' },
      ] },
      where: { line: 'pastime.collecting.where', go: [
        { ap: 'ask', say: 'Is there more where that came from?', to: 'more', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'A good eye, that. A finder\'s eye.', to: 'end' },
      ] },
      dragon: { line: 'pastime.collecting.dragon', end: true },
      shelves: { line: 'pastime.collecting.shelves', end: true },
      household: { line: 'pastime.collecting.household', go: [
        { ap: 'jest', say: 'Tell them it\'s an investment.', to: 'end' },
        { ap: 'warm', say: 'They\'ll treasure it all, one day.', to: 'end' },
      ] },
      letgo: { line: 'pastime.collecting.letgo', fx: { trust: 0.02 }, end: true },
      why: { line: 'pastime.collecting.why', fx: { trust: 0.02 }, end: true },
      gift: { line: 'pastime.collecting.gift', fx: { fond: 0.04, remember: 'The wizard gave me an acorn from a far-off wood.', rv: 2, joke: { k: 'pastime.acorn', t: 'The acorn from the far-off wood.' } }, end: true },
      more: { line: 'pastime.collecting.more', fx: { confide: { k: 'pastime.collecting.spot', t: '{Name} has a secret spot where the best finds turn up' } }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  L('pastime.collecting.open', ['Found anything good lately, {name}?', 'I hear you\'ve a cabinet of curiosities, {name}.', 'Your pockets are clinking, {name}. Treasures?'], {}, [
    { if: { stage: 'child' }, text: ['What\'s in your pockets today, {name}? Anything alive?', 'I hear you\'re a famous treasure-hunter, {name}.'] },
    { if: { collectKind: has }, text: ['How many {collectKind} is it now, {name}?'] },
  ]);
  L('pastime.collecting.start', ['Oh, a few bits. {CollectTally} so far. They add up.', 'It\'s getting on for a proper collection now.', 'I can\'t walk anywhere without looking at the ground.'], {
    cheerful: ['Oh, I love it! Every walk\'s a treasure hunt!', 'Lots! {CollectTally}! Shall I list them? I\'ll list them.'],
    ornery: ['It\'s a collection. Not clutter. There\'s a difference.', 'Folk call it junk. Folk are wrong.'],
    shy: ['...Just little things. Nobody else would want them.', '...I keep a few things. In a box.'],
    curious: ['Every stone in that river has come from somewhere. I want to know where.', 'I\'ve started labelling them. Where, when, what the weather was.'],
    dreamy: ['Every thing I find has a story. I just keep the stories, really.', 'Little pieces of the valley. I like having them near.'],
    witty: ['I collect things. Mostly dust, according to my family.', 'I\'ve a collection. My family has a different word for it.'],
    proud: ['{CollectTally}, every one labelled. It\'s the finest cabinet in the village.', 'A proper collection. Folk come to see it.'],
    gloomy: ['Things. Little things. They don\'t leave.', 'It\'s something to do on walks.'],
    child: ['I\'ve got LOADS! I\'ve got a stone with a hole in it!', 'I found a thing! Want to see? It\'s a bit sticky.'],
  }, [
    { if: { stage: 'elder' }, text: ['Sixty years of pockets. I\'ve a lot of pockets\' worth.'] },
    { if: { weather: 'rain' }, text: ['Sorting them, today. Rainy days are for sorting.'] },
    { if: { rift: true }, text: ['I collect the bits that come through the rift. Bits of home. Bits of somewhere.'] },
  ]);
  L('pastime.collecting.what', ['Whatever catches my eye. Stones, feathers, bits and bobs.', 'Whatever catches my eye. But {collectKind}, mostly.', 'Stones, feathers, that sort of thing. {CollectKind}, mostly.'], {
    cheerful: ['{CollectKind}! Hundreds! Well, dozens. Well, a good few.'],
    ornery: ['{CollectKind}. And don\'t ask why. Everyone asks why.'],
    shy: ['...{CollectKind}. Mostly. They\'re very nice ones.'],
    curious: ['{CollectKind}. No two the same. I\'ve checked. Twice.'],
    dreamy: ['{CollectKind}. Each one\'s a little day I can hold.'],
    witty: ['{CollectKind}. It\'s a very exclusive club. Very few members are alive.'],
    proud: ['{CollectKind}. The best collection of them in the Shire.'],
    gloomy: ['{CollectKind}. They don\'t mind being kept.'],
    child: ['{CollectKind}! And snails! The snails keep leaving.'],
  }, [
    { if: { collectKind: 'river stones' }, text: ['River stones. Smooth ones. The river polishes them for years and I just pick them up.'] },
    { if: { collectKind: 'feathers' }, text: ['Feathers. Jay feathers are the best. That blue! Like a little bit of sky fell out.'] },
    { if: { collectKind: 'pressed flowers' }, text: ['Pressed flowers. In the big books. Open any book in our house and a summer falls out.'] },
    { if: { collectKind: 'conkers' }, text: ['Conkers! I know they go dull. I don\'t care. When they\'re new they shine like boots.'] },
    { if: { collectKind: 'rift trinkets' }, text: ['Rift trinkets. Little bits of glass and wire from the scars. Some of them still hum.'] },
    { if: { collectKind: 'old coins' }, text: ['Old coins. Kings nobody remembers. I like to think about them, being forgotten.'] },
    { if: { collectKind: 'snail shells' }, text: ['Snail shells. Empty ones! I\'m not a monster.'] },
    { if: { collectKind: 'butterfly sketches' }, text: ['Butterflies. Drawn, not caught. I couldn\'t catch one. I\'d feel awful.'] },
  ]);
  L('pastime.collecting.best', ['An old coin. A king on it, worn almost smooth. Nobody knows which king.', 'A stone with a hole right through. Look through it and you see the fairies, they say.'], {
    cheerful: ['Oh! A jay feather, blue as a summer sky! I keep it in a book!'],
    ornery: ['A coin. Silver. And no, it\'s not for sale.'],
    shy: ['...A tiny blue egg shell. Empty. I keep it in wool.'],
    curious: ['A stone with a shell inside it. A shell, in a stone! How does a shell get inside a stone?'],
    dreamy: ['A bit of green glass, rubbed soft. It looks like the sea. I think. I\'ve never seen the sea.'],
    witty: ['A button. Off a very grand coat. I\'m still looking for the rest of the coat.'],
    proud: ['A silver coin, older than the Shire. Folk have offered good money.'],
    gloomy: ['My grandmother\'s thimble. Found it in the garden. Years after.'],
    child: ['A dragon tooth! Mum says it\'s a stone. It\'s a DRAGON TOOTH.'],
  }, [
    { if: { collectCoins: true }, text: ['A silver coin. In a molehill! A king on it nobody\'s heard of.'] },
    { if: { collectTrinkets: true }, text: ['A little glass bead from the rift scar. It glows when it\'s dark. Faintly. Like it remembers something.'] },
    { if: { rift: true }, text: ['A shard of a sign from home. A letter N, in neon. It doesn\'t light up here. I keep it anyway.'] },
  ]);
  L('pastime.collecting.room', ['Ha! Just. There\'s a path from the door to the bed.', 'There\'s always room on the shelf. There\'s just no shelf.'], {
    cheerful: ['Ha! I sleep on a pile of feathers! It\'s very comfortable!'],
    ornery: ['Plenty of room. Folk exaggerate.'],
    shy: ['...It\'s mostly under the bed. Nobody sees.'],
    curious: ['I\'ve calculated it. Two more years, then I\'ll need the loft.'],
    dreamy: ['The house is full of little bits of everywhere. I\'m the room.'],
    witty: ['I live in the bits between the collection. It\'s very cosy.'],
    proud: ['A collection like mine deserves the space.'],
    gloomy: ['Not much. It\'s like living in a drawer.'],
    child: ['I keep them in my bed! Mum found the snails.'],
  });
  L('pastime.collecting.choose', ['If I pick it up twice, it\'s mine.', 'It has to have a bit of a story. A stone that\'s just a stone goes back.'], {
    cheerful: ['If it makes me smile! Which is most things.'],
    ornery: ['I know. I just know. Don\'t ask me to explain.'],
    shy: ['...If it looks lonely.'],
    curious: ['It has to be different. A colour, a shape, a place. Something to learn from.'],
    dreamy: ['It chooses me, really. It sort of glints.'],
    witty: ['I hold a very strict interview. Most fail.'],
    proud: ['Only the best. A collection\'s only as good as what you leave out.'],
    gloomy: ['If nobody else would want it.'],
    child: ['If it\'s SHINY. Or if it\'s a frog.'],
  });
  L('pastime.collecting.fav', ['Would you? Oh, I\'d like that. Come for tea.', 'I will. It\'s in the top drawer. In a matchbox.'], {
    cheerful: ['Yes! Tomorrow! I\'ll get them all out!'],
    ornery: ['If you don\'t touch. Look, don\'t touch.'],
    shy: ['...You\'d really want to see? ...All right.'],
    proud: ['You\'ll be impressed. Everyone is.'],
    child: ['I\'ll show you NOW! ...It\'s at home. Tomorrow!'],
  });
  L('pastime.collecting.acorns', ['A pocket of acorns from every wood? Oh, that\'s lovely. Can I see one?', 'Ha! You\'re a collector! I knew it. I can always tell.'], {
    cheerful: ['You\'re one of us! A collector! Oh, I knew it!'],
    ornery: ['Acorns. Hm. ...From where? Where\'s the furthest one from?'],
    shy: ['...Really? A wizard collects things too?'],
    curious: ['Do they look different? The acorns? From different woods? Do you think they\'d grow?'],
    dreamy: ['Acorns from every wood... so you carry all those forests about with you. In your pocket.'],
    witty: ['A wizard with pockets full of acorns. The squirrels must follow you everywhere.'],
    proud: ['Acorns. Well. It\'s a start.'],
    gloomy: ['...That\'s nice. A bit of everywhere you\'ve been.'],
    child: ['Can I have one? Please? A magic one?'],
  });
  L('pastime.collecting.where', ['By the river, after the flood. The water turned everything over.', 'In a molehill, of all places. The mole had dug it up for me.'], {
    cheerful: ['Right in the lane! Everyone had walked past it! Everyone!'],
    ornery: ['Never you mind where.'],
    shy: ['...Somewhere quiet. I go there on my own.'],
    curious: ['Below the old mill race. The water drops whatever it\'s carrying there. I worked that out.'],
    dreamy: ['It was just there, waiting, in a patch of sunlight. Like it knew.'],
    witty: ['On the ground. That\'s where most things are, I find.'],
    proud: ['Where nobody else thought to look.'],
    gloomy: ['In the mud. Where I spend most of my time.'],
    child: ['In the pond! I had to go right in! Mum was cross.'],
  }, [
    { if: { collectTrinkets: true }, text: ['By the rift scar. The ground there\'s full of bits. Some of them are warm.'] },
  ]);
  L('pastime.collecting.dragon', ['Ha! No. A dragon would want the lot.', 'A dragon would never get it. I\'d hide it in a sock.'], {
    witty: ['Dragons collect gold. I collect mud with ideas above its station. We\'re not rivals.'],
    child: ['Do dragons collect things? What do they collect? Do they collect HOBBITS?'],
  });
  L('pastime.collecting.shelves', ['Ha! Don\'t give me ideas.', 'Shelves to put shelves on. It never ends.'], {
    witty: ['I tried that. Then I needed a shelf for the shelf collection.'],
    ornery: ['Very funny.'],
  });
  L('pastime.collecting.household', ['They roll their eyes. Then they bring me feathers.', 'They say it\'s clutter. Then they ask to borrow a stone for the door.'], {
    cheerful: ['They love it really! Well, they tolerate it. Lovingly.'],
    ornery: ['They say plenty. I don\'t listen.'],
    proud: ['They\'re proud of it, really. They show visitors.'],
    gloomy: ['They want it gone. One day it\'ll all go in the river again.'],
    child: ['Mum says no more snails. So I keep them in my boots.'],
  }, [
    { if: { spouse: has }, text: ['{Spouse} has given me one shelf. One. I\'m on my fourth.'] },
  ]);
  L('pastime.collecting.letgo', ['Once. A feather. I let the wind have it. It seemed to want to go.', '...I put a stone back in the river once. It felt like it was homesick.'], {
    dreamy: ['Every so often, one goes back. On a special day. So the valley doesn\'t feel robbed.'],
    ornery: ['Never. ...Once.'],
  });
  L('pastime.collecting.why', ['It was the first thing I ever found. It started everything.', 'Because I found it on a day when I needed something to go right.'], {
    shy: ['...Because I found it the day I came here. It made me feel welcome.'],
    gloomy: ['Because I found it the day after a bad day. It helped.'],
  });
  L('pastime.collecting.gift', ['*They hold it like a robin\'s egg.* ...From a far-off wood. In my collection. Oh, wizard.', '*They turn it over and over.* The best thing in the cabinet. I mean it.'], {
    cheerful: ['Oh! OH! It\'s going right in the middle! On a cushion!'],
    ornery: ['...Hm. Well. It\'ll do. ...Thank you.'],
    shy: ['*very quietly* ...Thank you. I\'ll keep it forever.'],
    curious: ['Where\'s it from? Exactly? I need to write the label!'],
    child: ['A MAGIC ACORN! I\'m going to plant it! No, keep it! Both!'],
  });
  L('pastime.collecting.more', ['...There\'s a spot. Below the mill race. I\'ve never told anyone. Don\'t you go there.', '...There\'s a place. I won\'t say where. It always gives me something.'], {
    child: ['...There\'s a secret place. Behind the big rock. Promise not to tell. PROMISE.'],
  });

  // ==================================================================================
  // --- Birdwatching ---------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.birds', about: 'pastime', reveals: 'pastime.birds', weight: 1, cool: 5,
    label: 'Seen any good birds?',
    when: (F) => hob(F, 'birdwatching'),
    rel: (F) => (F.pastime === 'birdwatching' ? 1.3 : 0.9) * (F.hour === 'morning' ? 1.2 : 1),
    open: { ask: 'pastime.birds.open' },
    beats: {
      start: { line: 'pastime.birds.start', go: [
        { ap: 'ask', say: 'What was the last one you saw?', to: 'last' },
        { ap: 'ask', say: 'Is there one you\'re still waiting for?', to: 'want' },
        { ap: 'jest', say: 'Do the birds watch you back, do you think?', to: 'back' },
      ] },
      last: { line: 'pastime.birds.last', fx: { learn: ['pastime.birds', '{Name} keeps a notebook of birds: {birdTally}'] }, go: [
        { ap: 'ask', say: 'May I see the notebook?', to: 'notebook' },
        { ap: 'share', say: 'The thrushes talk, you know. If you listen right.', to: 'thrush' },
        { ap: 'warm', say: 'You\'ve a patience I envy.', to: 'patience' },
      ] },
      want: { line: 'pastime.birds.want', go: [
        { ap: 'advise', say: 'Try the river at dawn. Sit very still.', to: 'advice' },
        { ap: 'warm', say: 'You\'ll see one. I\'m sure of it.', to: 'promise', need: { fond: 0.1 }, soft: true },
      ] },
      back: { line: 'pastime.birds.back', fx: { joke: { k: 'pastime.birdsback', t: 'The birds keep a notebook too. You\'re in it.' } }, go: [
        { ap: 'jest', say: 'Then you\'re in a robin\'s notebook somewhere.', to: 'end' },
        { ap: 'ask', say: 'Which bird would you be?', to: 'be' },
      ] },
      notebook: { line: 'pastime.birds.notebook', notice: 'pastime.birds.notice', go: [
        { ap: 'warm', say: 'It\'s a treasure, this.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'ask', say: 'What\'s this drawing here?', to: 'drawing' },
      ] },
      thrush: { line: 'pastime.birds.thrush', go: [
        { ap: 'tale', say: 'An old thrush once told me where a door was hidden. It was right.', to: 'tale', need: { open: 1 } },
        { ap: 'jest', say: 'Mostly they talk about worms.', to: 'worms' },
      ] },
      patience: { line: 'pastime.birds.patience', end: true },
      advice: { line: 'pastime.birds.advice', fx: { respect: 0.02 }, end: true },
      promise: { line: 'pastime.birds.promise', fx: { hook: 'pastime.birds', fond: 0.02 }, end: true },
      be: { line: 'pastime.birds.be', go: [
        { ap: 'warm', say: 'That suits you.', to: 'end' },
        { ap: 'ask', say: 'And me? What bird am I?', to: 'wizbird' },
      ] },
      drawing: { line: 'pastime.birds.drawing', end: true },
      tale: { line: 'pastime.birds.tale', fx: { trust: 0.03, feel: 'wizard_tale', feelX: 'the tale of the thrush' }, go: [
        { ap: 'warm', say: 'Listen to them. You never know.', to: 'end' },
        { ap: 'tale', say: 'And the eagles. But that\'s a tale for a long evening.', to: 'eagles' },
      ] },
      worms: { line: 'pastime.birds.worms', end: true },
      wizbird: { line: 'pastime.birds.wizbird', fx: { joke: { k: 'pastime.wizbird', t: 'The wizard is a heron. Grey, patient, and he turns up when you\'ve forgotten him.' } }, end: true },
      eagles: { line: 'pastime.birds.eagles', fx: { hook: 'pastime.birds' }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  L('pastime.birds.open', ['Seen anything good with that notebook, {name}?', 'I heard a blackbird singing fit to burst this {hour}, {name}. Did you?', 'What\'s about, {name}? Bird-wise?'], {}, [
    { if: { hour: 'morning' }, text: ['The dawn chorus was in fine voice today, {name}. Were you out for it?'] },
    { if: { season: 'winter' }, text: ['Hard winter for the birds, {name}. Are they coming to your crumbs?'] },
  ]);
  L('pastime.birds.start', ['Oh, plenty! {BirdTally} in the book so far.', 'Always something. You just have to look up.', 'Up at dawn most days. That\'s when they talk.'], {
    cheerful: ['Oh, loads! The swallows are back and they\'re SHOWING OFF.', '{BirdTally}! Each one a little celebration!'],
    ornery: ['I would, if folk stopped clattering about and scaring them off.', '{BirdTally}. No thanks to the children and their whistling.'],
    shy: ['...A few. They don\'t mind me. I\'m very quiet.', '...I just watch. They don\'t look back. It\'s nice.'],
    curious: ['Did you know the wren is the loudest bird for its size? Tiny thing. Shouts like a miller.', 'I\'ve been working out which ones sing first at dawn. The robin. Always the robin.'],
    dreamy: ['I like the moment they all go quiet at dusk. As if someone said hush.', 'I watch them go over and wonder where they\'re going. Everywhere, I think.'],
    witty: ['{BirdTally}. Plus several I\'m sure were the same pigeon.', 'Plenty. And a great many brown ones I\'ve decided are all called Dunnock.'],
    proud: ['{BirdTally}. More than anyone in the valley.', 'I can name any bird by its song. Try me.'],
    gloomy: ['The birds don\'t care about any of our troubles. I find that restful.', 'Crows. Mostly crows.'],
    child: ['I saw a BIRD. A big one! It was brown! Or black!', 'I\'ve got a book! I write them down! I can\'t spell them though.'],
  }, [
    { if: { stage: 'elder' }, text: ['My eyes aren\'t what they were. I go by ear now. The ear\'s better anyway.'] },
    { if: { hour: 'morning' }, text: ['I\'ve been out since before dawn. The chorus! You should have heard it.'] },
    { if: { season: 'spring' }, text: ['Spring! Everything\'s singing, everything\'s building nests. I can\'t keep up.'] },
    { if: { season: 'autumn' }, text: ['They\'re all leaving. The swallows went last week. I always miss them.'] },
    { if: { rift: true }, text: ['Back home the only birds were the drones. These ones sing. I can\'t get over it.'] },
  ]);
  L('pastime.birds.last', ['A little brown one. I\'m still deciding what it was.', 'A {birdLast}. By the river. Number {birdN} in the book.', 'A {birdLast}, this very week. I nearly dropped my tea.'], {
    cheerful: ['A {birdLast}! A {birdLast}! I did a little dance. It flew off. Worth it.'],
    ornery: ['A {birdLast}. Took me four mornings. Four.'],
    shy: ['...A {birdLast}. It sat right by me. I didn\'t breathe.'],
    curious: ['A {birdLast}. I watched it for an hour. It did the same thing forty times. I don\'t know why yet.'],
    dreamy: ['A {birdLast}, in the mist. Just for a moment. Then it was gone, like a thought.'],
    witty: ['A {birdLast}. Or a leaf having a very exciting day.'],
    proud: ['A {birdLast}. Nobody else in the valley has seen one this year.'],
    gloomy: ['A {birdLast}. It flew off the moment I saw it. They always do.'],
    child: ['A {birdLast}! I think! It was fast!'],
  }, [
    { if: { birdLast: 'kingfisher' }, text: ['A kingfisher. Blue as a gas-flame and gone. I sat down on the bank and laughed.'] },
    { if: { birdLast: 'barn owl' }, text: ['A barn owl, at dusk, quartering the meadow. White as a ghost. Not a sound.'] },
    { if: { birdLast: 'heron' }, text: ['The heron. He\'s always there. But I wrote him down properly at last.'] },
    { if: { birdLast: 'robin' }, text: ['A robin. Everyone has a robin. But you have to write it down. It\'s the rule.'] },
    { if: { birdLast: 'cuckoo' }, text: ['A cuckoo! Heard it a hundred times. Saw it at last. Smaller than you\'d think. Cheekier.'] },
  ]);
  L('pastime.birds.want', ['Oh, there\'s always one more. There\'s always one you haven\'t seen.', 'A {birdWant}. I\'ve never seen one. Folk say they\'re here.', 'Oh, a {birdWant}. I dream about it.'], {
    cheerful: ['A {birdWant}! One day! Maybe tomorrow!'],
    ornery: ['A {birdWant}. And when I do, the whole valley had better keep quiet.'],
    shy: ['...A {birdWant}. I\'d just like to see one. Once.'],
    curious: ['A {birdWant}. I\'ve read about them. I know where they\'d be. They\'re just not there.'],
    dreamy: ['A {birdWant}. My grandmother saw one, the year she married. I\'d like that luck.'],
    witty: ['A {birdWant}. I\'m beginning to think they\'re a rumour put about by the innkeeper.'],
    proud: ['A {birdWant}. When I see one, I\'ll be the first in years.'],
    gloomy: ['A {birdWant}. I won\'t, though. Not with my luck.'],
    child: ['A {birdWant}! What does it look like? Is it big?'],
  }, [
    { if: { birdWant: 'nightingale' }, text: ['A nightingale. I\'ve heard one, I think. At midnight. I\'ve never seen it. They don\'t like to be seen.'] },
    { if: { birdWant: 'hoopoe' }, text: ['A hoopoe. A bird with a crown! Folk say one came through when my grandad was a boy.'] },
    { if: { birdWant: 'waxwing' }, text: ['A waxwing. They come in hard winters, for the berries. Little punk crests. I want one so much.'] },
    { if: { birdWant: 'kingfisher' }, text: ['A kingfisher. Everyone\'s seen one but me. Everyone. The miller has.'] },
  ]);
  L('pastime.birds.back', ['Oh, they do. The robin certainly does. He knows what I\'m up to.', 'Ha! I\'m sure of it. There\'s a crow that writes me down every morning.'], {
    cheerful: ['Ha! I hope so! I hope I\'m an interesting one!'],
    ornery: ['They\'d better not be laughing at me.'],
    shy: ['...I hope not. I\'d hate to be watched.'],
    curious: ['The jays do, I\'m sure. They\'re clever. They hide acorns and remember where.'],
    dreamy: ['I hope so. I\'d like to be in a bird\'s book. A small note. \'Kind. Quiet. Brings crumbs.\''],
    witty: ['They do. Somewhere there\'s a blackbird with a notebook. \'Hobbit. Brown. Common.\''],
    proud: ['I\'m sure they think highly of me.'],
    gloomy: ['They\'ve seen me. They\'re not impressed.'],
    child: ['YES. The magpie looks at me. It wants my spoon.'],
  });
  L('pastime.birds.notebook', ['*They hand over a battered little book, every page full of tiny writing and sketches.*', '*A notebook, soft at the corners. Dates, places, little drawings of tails.*'], {
    cheerful: ['Here! *They flip it open to a page with a robin and a big smiling sun.* That was a good day!'],
    ornery: ['*They hold it out, but don\'t quite let go.* Careful. Don\'t bend it.'],
    shy: ['*They hesitate, then hand it over.* ...The drawings aren\'t very good.'],
    proud: ['*They open it to the first page.* Every one checked twice.'],
    child: ['*A notebook full of birds that look mostly like potatoes with legs.*'],
  });
  L('pastime.birds.notice', ['There\'s a pressed feather marking the page.', 'Their boots are wet with dew, as if they\'ve been out since dawn.'], {}, [
    { if: { hour: 'morning' }, text: ['There\'s grass seed on their knees. Lying in the meadow before breakfast, then.'] },
  ]);
  L('pastime.birds.thrush', ['Talk? ...Do they? What do they say?', 'You\'re having me on. ...Aren\'t you?'], {
    cheerful: ['Oh! Do they? Can you teach me?'],
    ornery: ['Talk. Hm. Next you\'ll tell me the hens do sums.'],
    shy: ['...I\'ve always thought they might.'],
    curious: ['Talk how? Words? Or more like... meaning? Like a dog means things?'],
    dreamy: ['I knew it. I always knew it.'],
    witty: ['Then the blackbird outside my window owes me an apology.'],
    proud: ['I\'ve always understood them better than most.'],
    gloomy: ['If they do, they\'re probably complaining.'],
    child: ['WHAT DO THEY SAY? Say a bird thing!'],
  });
  L('pastime.birds.patience', ['It\'s not patience. It\'s just liking where I am.', 'Ha! It\'s the only patience I\'ve got. Ask anyone.'], {
    shy: ['...It\'s easy, when nobody\'s looking at you.'],
    gloomy: ['There\'s nothing else to do.'],
  });
  L('pastime.birds.advice', ['Dawn. Stillness. I\'ll try. I\'ll try tomorrow.', 'The river at dawn. Yes. I\'ve been going to the wrong bend.'], {
    ornery: ['I know that. Everybody knows that. ...I\'ll try the other bank.'],
    proud: ['I\'ve done all that. ...I\'ll try again.'],
    curious: ['Which bend? Does it matter which bank? Should I take crumbs?'],
  });
  L('pastime.birds.promise', ['I hope so. When I do, you\'ll be the first to know.', 'If I do, I\'ll come and find you. Wherever you are.'], {
    cheerful: ['When I do, I\'m going to shout so loud it\'ll fly off!'],
    shy: ['...Thank you. I\'ll tell you. Only you.'],
  });
  L('pastime.birds.be', ['A wren. Small, loud, always busy.', 'A robin. Nosy and fond of a garden.'], {
    cheerful: ['A goldfinch! All colours! Always singing!'],
    ornery: ['A crow. Folk don\'t like them, and they don\'t care.'],
    shy: ['...A dunnock. Nobody notices them. They like it.'],
    curious: ['A jay. Clever, nosy, and they remember everything.'],
    dreamy: ['A swift. They never land, you know. They sleep on the wing.'],
    witty: ['A magpie. Chatty, and fond of shiny things. I\'ve been told.'],
    proud: ['A heron. Patient and grand.'],
    gloomy: ['A rook. In the rain.'],
    child: ['An EAGLE. A big one. That can carry a cow.'],
  });
  L('pastime.birds.drawing', ['That? A nuthatch. It goes down trees headfirst. Only bird that does.', 'That\'s a bird I couldn\'t name. I drew it so I\'d know it again.'], {
    witty: ['That\'s either a sparrow or a thumbprint. I\'ve been trying to decide for a week.'],
    child: ['That\'s a bird! ...Or a cloud. It\'s a cloud-bird.'],
  });
  L('pastime.birds.tale', ['...A thrush told you where a door was? And was it? Right?', '...I\'m going to listen differently now. You know that, don\'t you?'], {
    curious: ['A door? What door? Where? What did it say, exactly?'],
    dreamy: ['*They look up at the trees as if the trees had just spoken.*'],
    ornery: ['...Hm. That\'s a good story. I don\'t believe it. Tell it again.'],
    child: ['WHAT DOOR? Was there a dragon behind it? There was, wasn\'t there?'],
  });
  L('pastime.birds.worms', ['Ha! Worms and weather. Like my uncle.', 'Ha! I thought so. They\'ve that look.'], {
    witty: ['Worms and each other. Like the well on a Trewsday.'],
    child: ['Ew! Do they talk about eating them?'],
  });
  L('pastime.birds.wizbird', ['You? A heron. Grey, patient, and you turn up when everyone\'s forgotten you.', 'A heron. Definitely. All legs and hat.'], {
    cheerful: ['A heron! Tall and grey and you stand very still and then WHOOSH.'],
    ornery: ['A crow. Always where there\'s trouble.'],
    witty: ['A heron. Stands about looking wise and every so often eats a fish whole. I\'ve seen you at supper.'],
    child: ['An owl! A big grey owl! With a hat!'],
  });
  L('pastime.birds.eagles', ['Eagles? ...Real ones? Oh, you have to tell me. Not now. Promise you will.', 'Eagles. ...You\'re not joking, are you. A long evening, then. I\'ll hold you to it.'], {
    child: ['EAGLES! Did you ride one? You rode one! Tell me tell me tell me.'],
  });

  // ==================================================================================
  // --- Masterpieces -----------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.masterpiece', about: 'pastime', reveals: 'pastime.masterpiece', weight: 1.4, cool: 6,
    label: (F) => `Your masterpiece`,
    when: (F) => !!F.masterpiece,
    open: { warm: 'pastime.masterpiece.open' },
    beats: {
      start: { line: 'pastime.masterpiece.start', go: [
        { ap: 'ask', say: 'What came over you, that day?', to: 'fey' },
        { ap: 'warm', say: 'Folk are still talking about it.', to: 'folk' },
        { ap: 'ask', say: 'What does it show?', to: 'shows' },
      ] },
      fey: { line: 'pastime.masterpiece.fey', fx: { learn: ['pastime.masterpiece', '{Name} made {masterpiece}, a {masterThing}, in a fey mood'] }, go: [
        { ap: 'listen', say: '*You wait. This is not a thing to hurry.*', label: 'Don\'t hurry them', to: 'after' },
        { ap: 'share', say: 'I\'ve seen that mood on elves. They make things that outlast mountains.', to: 'elves' },
        { ap: 'jest', say: 'Did you at least stop for second breakfast?', to: 'breakfast' },
      ] },
      folk: { line: 'pastime.masterpiece.folk', go: [
        { ap: 'ask', say: 'Does it trouble you, all the fuss?', to: 'fuss' },
        { ap: 'warm', say: 'You\'ve earned every bit of it.', to: 'earned' },
      ] },
      shows: { line: 'pastime.masterpiece.shows', fx: { learn: ['pastime.masterpiece', '{Name} made {masterpiece}, a {masterThing}, in a fey mood'] }, go: [
        { ap: 'ask', say: 'Why that, of everything?', to: 'why' },
        { ap: 'warm', say: 'Then it\'ll keep that day safe for longer than any of us.', to: 'keep' },
      ] },
      after: { line: 'pastime.masterpiece.after', fx: { trust: 0.03 }, go: [
        { ap: 'comfort', say: 'You don\'t have to make another. One is plenty for a life.', to: 'enough' },
        { ap: 'advise', say: 'Go back to small things. They\'re where it came from.', to: 'small' },
      ] },
      elves: { line: 'pastime.masterpiece.elves', fx: { respect: 0.02 }, go: [
        { ap: 'tale', say: 'There\'s a cup in Rivendell that\'s held wine for three thousand years.', to: 'cup' },
        { ap: 'warm', say: 'Yours will last. I\'d bet my hat.', to: 'end' },
      ] },
      breakfast: { line: 'pastime.masterpiece.breakfast', go: [
        { ap: 'jest', say: 'Then it truly was a fey mood.', to: 'end' },
        { ap: 'ask', say: 'And when you came out?', to: 'after' },
      ] },
      fuss: { line: 'pastime.masterpiece.fuss', go: [
        { ap: 'comfort', say: 'They\'ll settle. And it\'ll still be there.', to: 'end' },
        { ap: 'advise', say: 'Let them look. Then shut the door and have your tea.', to: 'end', fx: { respect: 0.02 } },
      ] },
      earned: { line: 'pastime.masterpiece.earned', fx: { fond: 0.02 }, end: true },
      why: { line: 'pastime.masterpiece.why', fx: { trust: 0.03 }, end: true },
      keep: { line: 'pastime.masterpiece.keep', fx: { fond: 0.02 }, end: true },
      enough: { line: 'pastime.masterpiece.enough', fx: { trust: 0.03, feel: 'cheered', feelX: 'the wizard' }, end: true },
      small: { line: 'pastime.masterpiece.small', fx: { respect: 0.03 }, end: true },
      cup: { line: 'pastime.masterpiece.cup', fx: { feel: 'wizard_tale', feelX: 'the cup of Rivendell' }, end: true },
    },
    end: { fond: 0.03, trust: 0.02, respect: 0.01 },
  });
  L('pastime.masterpiece.open', ['I went to see your great work, {name}. I stood a long while.', 'I went to see {masterpiece}, {name}. I stood a long while.', 'They talk of {masterpiece} as far as the mill, {name}.', '{Masterpiece}, {name}. I\'ve seen great works in great halls. It holds its own.'], {}, []);
  L('pastime.masterpiece.start', ['Oh. You\'ve seen it. ...What did you think? No, don\'t tell me.', 'I still can\'t believe it was me.'], {
    cheerful: ['Isn\'t it something? I can\'t believe I made it! I go and look at it every morning!'],
    ornery: ['Everyone wants to talk about it. I\'d rather they didn\'t.', 'It\'s just a {masterThing}. ...It\'s not just a {masterThing}.'],
    shy: ['...Oh. You saw it. I wish people wouldn\'t stare at it. Or at me.'],
    curious: ['I\'ve been trying to work out how I did it. I can\'t. It\'s like reading someone else\'s writing.'],
    dreamy: ['It doesn\'t feel like mine. It feels like I was only holding the tools.'],
    witty: ['I\'ve made a masterpiece. Now nobody will let me make anything ordinary.'],
    proud: ['It is the finest {masterThing} in the Shire, and I\'ll not pretend otherwise.'],
    gloomy: ['I\'ll never make anything like it again. That\'s the trouble with a masterpiece.'],
  }, [
    { if: { stage: 'elder' }, text: ['All those years of making, and then that. At my age. Fancy.'] },
  ]);
  L('pastime.masterpiece.fey', ['I don\'t know. I woke up and I couldn\'t not. A day and a night, and I didn\'t stop.', 'Something. Like a tune you can\'t stop humming. In my hands.'], {
    cheerful: ['I woke up full of it! Like the day before your birthday but for ever!'],
    ornery: ['I don\'t know and I don\'t like not knowing.'],
    shy: ['...I don\'t know. I locked the door. I didn\'t want anyone to see me like that.'],
    curious: ['I\'ve tried to remember. It\'s blurry. Like a dream that goes when you try to hold it.'],
    dreamy: ['I think the valley wanted something said, and I was nearest.'],
    witty: ['A mood. A fey one. Very inconvenient. I missed two meals.'],
    proud: ['Twenty years of craft, all at once. That\'s what came over me.'],
    gloomy: ['I don\'t know. And it won\'t come back. I can feel it\'s gone.'],
  });
  L('pastime.masterpiece.folk', ['They come every day. They stand and look and go quiet. It\'s strange.', 'I know. I can\'t buy a loaf without someone saying \'{Masterpiece}\'.'], {
    cheerful: ['Isn\'t it lovely? Folk I hardly know, coming to see it!'],
    ornery: ['They do. They track mud in. Every one of them.'],
    shy: ['...I hide when they come. Is that silly?'],
    curious: ['They all see something different in it. I\'ve been asking. Nobody sees the same thing twice.'],
    dreamy: ['Some of them cry. I didn\'t make it to make anyone cry.'],
    witty: ['I\'ve thought of charging. A penny a look. I\'d be rich by Yule.'],
    proud: ['As well they should.'],
    gloomy: ['They\'ll forget. Everyone forgets.'],
  });
  L('pastime.masterpiece.shows', ['A day I\'ll never forget. It just came out of me.', 'It shows {masterShows}. I didn\'t mean it to. It just did.', '{MasterShows}. That\'s what came out of me.'], {
    cheerful: ['It shows {masterShows}! The happiest day! It\'s all there!'],
    ornery: ['{MasterShows}. Don\'t ask me why.'],
    shy: ['...{MasterShows}. It\'s very private. And now everyone\'s seen it.'],
    curious: ['{MasterShows}. Odd, isn\'t it, what the hands remember.'],
    dreamy: ['{MasterShows}. I didn\'t know that was the day that mattered, till I saw it there.'],
    proud: ['{MasterShows}. The best day of my life, made to last.'],
    gloomy: ['{MasterShows}. A day that won\'t come back.'],
  });
  L('pastime.masterpiece.after', ['...I came out and the sun was up and I was so tired. And so empty. Like after crying.', '...I slept for a day. And then I was frightened of my own workbench.'], {
    cheerful: ['I slept! For ages! And then I had three breakfasts and cried a bit. A good cry.'],
    ornery: ['...I couldn\'t make anything for a month. Didn\'t want to. That\'s never happened.'],
    shy: ['...I didn\'t want to show anyone. It felt like showing them my insides.'],
    dreamy: ['...Like waking from a dream you can\'t get back into. Lovely, and sad.'],
    proud: ['...I don\'t know if I\'ll ever be that good again. I\'ve not said that to anyone.'],
    gloomy: ['...Empty. I still am, a bit.'],
  });
  L('pastime.masterpiece.elves', ['Elves? ...You\'ve seen elves make things?', '...That\'s the kindest thing anyone\'s said about it.'], {
    curious: ['What do elves make? How do they do it? Do they get the mood too?'],
    proud: ['...Elves. Well. I\'ll remember you said that.'],
    witty: ['Elves and me. I\'ll put that on the sign.'],
  });
  L('pastime.masterpiece.breakfast', ['...No. I didn\'t. Not even second breakfast. That\'s how I knew it was serious.', 'Ha! No! A whole day and no second breakfast. My family thought I was ill.'], {
    cheerful: ['Ha! No! I didn\'t even notice! When I came out I ate everything in the house.'],
    ornery: ['No. And I\'ve not been right since.'],
  });
  L('pastime.masterpiece.fuss', ['A bit. I just wanted to make a thing. Not be a thing.', 'It does. I\'m the one who made {masterpiece} now. Not just me.'], {
    shy: ['...Yes. Very much.'],
    proud: ['No. It\'s only right.'],
    witty: ['Only when they want it in the kitchen.'],
  });
  L('pastime.masterpiece.earned', ['...Thank you. I don\'t know that I did. It sort of happened to me.', 'That means a lot. From you.'], {
    proud: ['I did, didn\'t I. Thank you for saying so.'],
    shy: ['*very quietly* ...Thank you.'],
  });
  L('pastime.masterpiece.why', ['...Because it\'s the day I\'d keep, if I could keep only one.', '...I didn\'t choose it. But I\'m glad it was that.'], {
    gloomy: ['...Because it\'s gone, and I wanted it back.'],
    dreamy: ['...Because some days ought to outlast the people in them.'],
  });
  L('pastime.masterpiece.keep', ['...Longer than any of us. Yes. I hadn\'t thought of it like that.', 'I like that. It\'ll keep the day safe.'], {
    gloomy: ['...That\'s a comfort, actually. Thank you.'],
  });
  L('pastime.masterpiece.enough', ['...One is enough. Yes. Oh, that\'s a weight off. Thank you.', '...Is it? One? ...Yes. All right. One.'], {
    proud: ['...I\'d been thinking I had to beat it. Maybe I don\'t.'],
    ornery: ['...Hm. That\'s sense. Don\'t expect me to say so twice.'],
  });
  L('pastime.masterpiece.small', ['Small things. Yes. A spoon, a little {madeOne}. You\'re right.', 'Back to small. I\'ll start with something nobody will look at twice.'], {
    proud: ['Small things. ...I suppose even the masters sweep their own floors.'],
    ornery: ['Small things. Hm. Yes. That\'s sense.'],
  });
  L('pastime.masterpiece.cup', ['...Three thousand years. Holding wine. And still somebody washes it up after.', '...I\'d like to think someone will wash mine up, in three thousand years.'], {
    witty: ['Three thousand years and still nobody\'s dropped it. Elves must be very careful at washing up.'],
  });

  // a neighbour's masterpiece: admiration, envy, and the wizard\'s word
  addThread({
    id: 'pastime.othermaster', about: 'pastime', weight: 0.7, cool: 6,
    label: (F) => `What do you make of ${F.otherMaster || 'the masterpiece'}?`,
    when: (F) => !!F.otherMaster && !F.masterpiece,
    open: { ask: 'What do you make of {otherMaster}, {name}? {OtherMasterBy}\'s great work.' },
    beats: {
      start: { line: 'pastime.othermaster.start', go: [
        { ap: 'ask', say: 'Could you make something like it, do you think?', to: 'could' },
        { ap: 'warm', say: 'It\'s good for the whole village, a thing like that.', to: 'village' },
        { ap: 'jest', say: '{OtherMasterBy}\'s head must barely fit through the door.', to: 'head' },
      ] },
      could: { line: 'pastime.othermaster.could', go: [
        { ap: 'warm', say: 'It might come to you yet. These things do.', to: 'yet' },
        { ap: 'advise', say: 'Make for love, not to beat anyone. That\'s where they come from.', to: 'love' },
      ] },
      village: { line: 'pastime.othermaster.village', end: true },
      head: { line: 'pastime.othermaster.head', go: [
        { ap: 'jest', say: 'Then we\'ll widen the door. A village project.', to: 'end' },
        { ap: 'warm', say: 'I expect they\'d say the same of you, in their place.', to: 'end' },
      ] },
      yet: { line: 'pastime.othermaster.yet', fx: { fond: 0.02 }, end: true },
      love: { line: 'pastime.othermaster.love', fx: { respect: 0.02 }, end: true },
    },
    end: { fond: 0.01 },
  });
  L('pastime.othermaster.start', ['It\'s a wonder. I went twice. I\'ll go again.', 'I didn\'t know {otherMasterBy} had it in them. None of us did.'], {
    cheerful: ['Oh, it\'s marvellous! I cried! In front of everybody!'],
    ornery: ['It\'s very fine. Everyone says so. Constantly.'],
    shy: ['...I went when nobody was there. It\'s beautiful.'],
    curious: ['I can\'t work out how {otherMasterBy} did it. I\'ve been back four times to look.'],
    dreamy: ['It made me feel like the whole valley was being remembered.'],
    witty: ['Very good. Very fine. Very much on everyone\'s lips. I\'ll be glad when they find a new thing.'],
    proud: ['It\'s good. I\'ll grant that. Very good.'],
    gloomy: ['It made me feel I\'ve never made anything worth keeping.'],
    child: ['It\'s SO good. I touched it. Don\'t tell.'],
  });
  L('pastime.othermaster.could', ['Me? Oh, no. Well. Maybe. If the mood came.', 'Something like it. Not as good. Maybe one day.'], {
    cheerful: ['Maybe! Oh, I\'d love to! I\'d make it of the whole party field!'],
    ornery: ['If I had the time. Which I don\'t.'],
    shy: ['...I\'ve thought about it. In secret.'],
    curious: ['I\'d have to know how. I don\'t think {otherMasterBy} knows how either.'],
    dreamy: ['If it came to me. You can\'t go looking for it.'],
    witty: ['I could make something like it. Smaller. Worse. With more jam on.'],
    proud: ['I could. Given the right day.'],
    gloomy: ['No. Not me.'],
  });
  L('pastime.othermaster.village', ['It is. Folk walk taller. Silly, but they do.', 'It is, isn\'t it. Our village made that. Well. {OtherMasterBy} did. But us.'], {
    ornery: ['Hm. More visitors. More mud.'],
  });
  L('pastime.othermaster.head', ['Ha! They\'ve been walking sideways through the market.', 'Ha! It\'s grown a size. The hat doesn\'t fit.'], {
    ornery: ['Exactly what I said! Nobody listened.'],
    shy: ['...That\'s unkind. ...It\'s a little true.'],
  });
  L('pastime.othermaster.yet', ['Do you think? ...I\'ll keep my tools sharp, then.', 'I hope so. I\'ll keep making small things till then.'], {
    gloomy: ['...Maybe. You\'re kind to say it.'],
  });
  L('pastime.othermaster.love', ['For love. Yes. That\'s where all the good ones come from.', 'You\'re right. I\'ve been making things to show off. That\'s not it.'], {
    proud: ['...That stings a little. It\'s true, though.'],
  });

  // ==================================================================================
  // --- Teaching a craft (and the wizard has a go) --------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.teach', about: 'pastime', weight: 0.9, cool: 6,
    label: (F) => `Would you teach me ${F.pastimeWord || 'your craft'}?`,
    when: (F) => !!F.pastime && F.pastimeLevel >= 6 && F.stage !== 'child' && ['carving', 'basketry', 'pottery', 'knitting', 'painting'].includes(F.pastime),
    rel: (F) => (F.pastimeLevel >= 45 ? 1.3 : 0.9),
    open: { ask: 'Would you teach me a little {pastimeWord}, {name}? I\'m a quick study. For a wizard.' },
    beats: {
      start: { line: 'pastime.teach.start', go: [
        { ap: 'warm', say: 'I\'ll do exactly as I\'m told.', to: 'lesson' },
        { ap: 'jest', say: 'How hard can it be? I\'ve moved mountains. Well. Small ones.', to: 'cocky' },
      ] },
      lesson: { line: 'pastime.teach.lesson', go: [
        { ap: 'listen', say: '*You watch their hands very carefully.*', label: 'Watch very carefully', to: 'try' },
        { ap: 'ask', say: 'And why that way, and not another?', to: 'why' },
      ] },
      cocky: { line: 'pastime.teach.cocky', go: [
        { ap: 'jest', say: '*You try, with a flourish.*', label: 'Have a go, with a flourish', to: 'disaster' },
        { ap: 'warm', say: 'All right. Humbly, then. Show me.', to: 'lesson' },
      ] },
      try: { line: 'pastime.teach.try', go: [
        { ap: 'ask', say: 'How\'s that?', to: 'verdict' },
        { ap: 'jest', say: 'I think it\'s a heron.', to: 'heron' },
      ] },
      why: { line: 'pastime.teach.why', fx: { trust: 0.02 }, go: [
        { ap: 'listen', say: '*You try it their way.*', label: 'Try it their way', to: 'try' },
        { ap: 'ask', say: 'Who taught you?', to: 'taught' },
      ] },
      disaster: { line: 'pastime.teach.disaster', fx: { joke: { k: 'pastime.wizlesson', t: 'The wizard\'s first lesson. We don\'t talk about it.' }, fond: 0.02 }, go: [
        { ap: 'jest', say: 'I meant to do that. It\'s a wizard thing.', to: 'meant' },
        { ap: 'warm', say: 'You\'d better show me again. Slowly.', to: 'lesson' },
      ] },
      verdict: { line: 'pastime.teach.verdict', go: [
        { ap: 'warm', say: 'I\'ll practise. On the road. By the fire.', to: 'practise' },
        { ap: 'jest', say: 'Shall I stick to fireworks?', to: 'fireworks' },
      ] },
      heron: { line: 'pastime.teach.heron', end: true },
      taught: { line: 'pastime.teach.taught', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'They\'d be proud of you.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'ask', say: 'And who will you teach?', to: 'next' },
      ] },
      meant: { line: 'pastime.teach.meant', end: true },
      practise: { line: 'pastime.teach.practise', fx: { respect: 0.02, feel: 'taught' }, end: true },
      fireworks: { line: 'pastime.teach.fireworks', end: true },
      next: { line: 'pastime.teach.next', end: true },
    },
    end: { fond: 0.02, respect: 0.01 },
  });
  L('pastime.teach.start', ['Teach you? A wizard? Well. Sit down. No, not there. There.', 'Ha! All right. But you\'ll do it properly.'], {
    cheerful: ['Oh, yes! Sit, sit! I\'ve been waiting for someone to ask for years!'],
    ornery: ['Teach you. Hm. You\'ll need to listen. Can wizards listen?'],
    shy: ['...Me? Teach you? I... all right. If you really want.'],
    curious: ['Oh! Nobody\'s asked. Let me think how to explain it. I\'ve never had to.'],
    dreamy: ['I\'d love to. It\'s more feeling than doing, really. I\'ll try.'],
    witty: ['A wizard for an apprentice! The lane will never let me hear the end of it.'],
    proud: ['Very well. But I teach it the right way, or not at all.'],
    gloomy: ['If you like. I\'m not much of a teacher.'],
  }, [
    { if: { pastime: 'knitting' }, text: ['Knitting! Here, hold these. No, the pointy ends go towards the wool.'] },
    { if: { pastime: 'pottery' }, text: ['Roll your sleeves up. Further. Further. Wizard sleeves are very long.'] },
    { if: { pastime: 'carving' }, text: ['Here\'s a block of lime. Here\'s a knife. Point it away from your beard.'] },
    { if: { pastime: 'basketry' }, text: ['Reeds first. Feel them. Soft, see? If they snap, they\'re too dry.'] },
    { if: { pastime: 'painting' }, text: ['Here\'s a brush. Look at the hill. No. Really look.'] },
  ]);
  L('pastime.teach.lesson', ['Gently. No, gentler. You\'re not fighting a troll.', 'Watch my hands. Slowly. See? Then you.'], {
    cheerful: ['Like this! See? Easy! Well. Easy once you\'ve done it a thousand times!'],
    ornery: ['Like this. No, like THIS. Watch.'],
    shy: ['...Like this. I\'ll go slow.'],
    curious: ['The trick is the angle. A little more. There. Do you feel it catch?'],
    dreamy: ['Don\'t think. Just let your hands listen.'],
    witty: ['Like this. And then like this. And then you swear quietly. That\'s the important bit.'],
    proud: ['Precisely so. Not roughly so. Precisely.'],
    gloomy: ['Like this. You\'ll get it wrong at first. Everyone does.'],
  }, [
    { if: { pastime: 'knitting' }, text: ['In, round, through, off. In, round, through, off. Say it with me.'] },
    { if: { pastime: 'pottery' }, text: ['Wet your hands. Press. Feel it find its middle. Don\'t lean on it! Ah.'] },
    { if: { pastime: 'carving' }, text: ['Short cuts. Away from you. Follow the grain like stroking a cat.'] },
    { if: { pastime: 'basketry' }, text: ['Over one, under one. Pull it snug. Not tight. Snug.'] },
    { if: { pastime: 'painting' }, text: ['Light first. Then dark. You can always go darker. You can never go back.'] },
  ]);
  L('pastime.teach.cocky', ['Ha! Mountains. Go on, then. Mountain away.', 'Small ones. I heard. Go on.'], {
    cheerful: ['Ha! Go on, then! Show me your mountain-moving!'],
    ornery: ['Pride before a fall, wizard. Go on.'],
    shy: ['...All right. ...Careful.'],
    witty: ['A mountain doesn\'t mind if you get it a bit wrong. This does.'],
    proud: ['We\'ll see how your mountains do against {pastimeWord}.'],
  });
  L('pastime.teach.try', ['*You try. It is not good. They are very kind about it.* ...That\'s a start.', '*You try. Something happens.* ...Well. Something happened.'], {
    cheerful: ['Ha! That\'s not bad! For a first go! For a wizard!'],
    ornery: ['...That\'s terrible. Do it again.'],
    shy: ['...That\'s... it\'s... you\'ll get better.'],
    curious: ['Interesting. You\'re left-handed in your wrist. Did you know? Try it the other way.'],
    dreamy: ['It\'s got feeling. It\'s mostly feeling, admittedly.'],
    witty: ['I\'ve seen worse. I\'ve seen worse from the hens, mind.'],
    proud: ['Hm. Again. Properly.'],
    gloomy: ['Mine was worse, my first time. Not much worse.'],
  });
  L('pastime.teach.why', ['Because that\'s how the wood wants it. Or the wool. Or whatever it is.', 'Because I tried every other way first. This one works.'], {
    curious: ['Good question! Because of the grain. Everything has a grain, if you look.'],
    proud: ['Because that\'s the right way. There\'s a right way.'],
    gloomy: ['Because I got it wrong for years, and this is what was left.'],
  });
  L('pastime.teach.disaster', ['*There is a sound. Then a silence.* ...Well. That\'s never happened before.', '*Something goes everywhere.* ...I\'ll fetch a cloth.'], {
    cheerful: ['*They laugh until they have to sit down.* Oh! Oh, my! I\'ll never forget that!'],
    ornery: ['*They look at the mess, then at you.* ...Mountains, was it?'],
    shy: ['*They try very hard not to laugh, and fail.*'],
    curious: ['How did you do that? I\'ve been doing this for years and I\'ve never managed THAT.'],
    dreamy: ['*They pick a bit out of your beard, very gently.* ...It\'s all right.'],
    witty: ['Well. That\'s a new technique. I\'ll call it the Gandalf.'],
    proud: ['...I\'ll just start again. From the beginning. Clearly.'],
    gloomy: ['*Despite everything, they laugh.* ...Oh, I needed that.'],
  });
  L('pastime.teach.verdict', ['Honestly? Terrible. But a good terrible. A learning terrible.', 'It\'s... a start. Every hobbit starts there.'], {
    cheerful: ['It\'s wonderful! Well. It\'s yours! That\'s what makes it wonderful!'],
    ornery: ['It\'s bad. Do it a hundred more times and it\'ll be less bad.'],
    shy: ['...I like it. Really.'],
    curious: ['Better than I expected. Worse than you think.'],
    witty: ['I\'ll keep it. I\'ll show it to people. \'The wizard did this.\' They\'ll never believe me.'],
    proud: ['It shows promise. A little. A very little.'],
    gloomy: ['Better than my first.'],
  });
  L('pastime.teach.heron', ['Ha! It IS a heron! Sort of! A heron that\'s been through something.', 'A heron. ...Yes. I can see it. If I squint.'], {
    witty: ['It\'s a badger. Everyone\'s first heron is a badger. It\'s tradition.'],
  });
  L('pastime.teach.taught', ['My {parent}. Never said much. Just did it, by the fire, till I copied.', 'An old neighbour. She\'s gone now. I still hear her when I get it wrong.'], {
    shy: ['...I taught myself. From watching. Nobody knew.'],
    proud: ['Nobody. I taught myself, and I taught myself well.'],
    gloomy: ['My grandmother. I wish she could see what I do now.'],
  });
  L('pastime.teach.meant', ['Of course you did. Of course.', 'Ha! A wizard thing. Everything\'s a wizard thing with you.'], {
    witty: ['A wizard thing. I\'ll tell the lane it was deliberate. They\'ll believe me. They\'ve met you.'],
  });
  L('pastime.teach.practise', ['Do. And show me next time. I want to see it.', 'Ha! Practise, then. I\'ll test you when you\'re back.'], {
    ornery: ['You\'d better. I\'ll know if you haven\'t.'],
    cheerful: ['Yes! Come back and we\'ll do it together!'],
  });
  L('pastime.teach.fireworks', ['Ha! Yes. Stick to fireworks. But come again.', 'Fireworks are safer. For the {madeMany}.'], {
    witty: ['You stick to fireworks and I\'ll stick to {pastimeWord}. Nobody gets hurt.'],
  });
  L('pastime.teach.next', ['Whoever asks. Like you did.', 'The young ones. Somebody has to.'], {
    proud: ['Only someone with the hands for it.'],
  }, [
    { if: { kid: has }, text: ['{Kid}. When {kid}\'s ready. {Kid}\'s nearly ready.'] },
  ]);

  // ==================================================================================
  // --- A present made for someone --------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.gift', about: 'pastime', weight: 0.9, cool: 5,
    label: 'Making something for someone?',
    when: (F) => (F.hobbies || []).some((k) => ['carving', 'basketry', 'pottery', 'knitting', 'painting'].includes(k)) && F.stage !== 'child',
    rel: (F) => (F.giftTo ? 1.3 : F.giftFrom ? 1.2 : 0.8),
    open: { ask: 'pastime.gift.open' },
    beats: {
      start: { line: 'pastime.gift.start', go: [
        { ap: 'ask', say: 'Who\'s it for?', to: 'who' },
        { ap: 'ask', say: 'Has anyone ever made something for you?', to: 'given' },
        { ap: 'jest', say: 'Is it for me? It\'s for me, isn\'t it.', to: 'me' },
      ] },
      who: { line: 'pastime.gift.who', go: [
        { ap: 'ask', say: 'Why them?', to: 'why', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'They\'ll be thrilled.', to: 'thrilled' },
      ] },
      given: { line: 'pastime.gift.given', go: [
        { ap: 'warm', say: 'Handmade things carry the hands that made them.', to: 'hands' },
        { ap: 'ask', say: 'Did you thank them?', to: 'thanked', need: { if: { giftFrom: has } } },
        { ap: 'comfort', say: 'Then somebody ought to. Makers deserve making for.', to: 'nobody', need: { if: { giftFrom: null } } },
      ] },
      me: { line: 'pastime.gift.me', go: [
        { ap: 'jest', say: 'I\'ll practise looking surprised.', to: 'surprised' },
        { ap: 'warm', say: 'I\'m only teasing. Whoever it\'s for is lucky.', to: 'who' },
      ] },
      why: { line: 'pastime.gift.why', fx: { trust: 0.03 }, go: [
        { ap: 'warm', say: 'Then it\'s the right present.', to: 'end' },
        { ap: 'advise', say: 'Give it soon. Don\'t wait for an occasion.', to: 'soon' },
      ] },
      thrilled: { line: 'pastime.gift.thrilled', end: true },
      nobody: { line: 'pastime.gift.nobody', fx: { fond: 0.02 }, end: true },
      hands: { line: 'pastime.gift.hands', fx: { fond: 0.02 }, end: true },
      thanked: { line: 'pastime.gift.thanked', go: [
        { ap: 'advise', say: 'Make them something back. That\'s the best thanks.', to: 'back' },
        { ap: 'warm', say: 'I\'m sure they know.', to: 'end' },
      ] },
      surprised: { line: 'pastime.gift.surprised', fx: { joke: { k: 'pastime.surprised', t: 'The wizard practising his surprised face.' } }, end: true },
      soon: { line: 'pastime.gift.soon', fx: { respect: 0.02 }, end: true },
      back: { line: 'pastime.gift.back', fx: { respect: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.gift.open', ['That looks like a present in the making, {name}.', 'Making something for someone, {name}? You\'ve that look.', 'I hear you give away more than you keep, {name}.'], {}, [
    { if: { giftTo: has }, text: ['I hear {giftTo} has a new {giftWhat}, {name}. Your work?'] },
  ]);
  L('pastime.gift.start', ['Oh, maybe. Maybe not. Who told you?', 'Might be. I\'m not saying. Yet.'], {
    cheerful: ['Yes! I always am! It\'s the best part!'],
    ornery: ['What if I am? It\'s nobody\'s business.'],
    shy: ['...Maybe. Don\'t say anything.'],
    curious: ['How did you know? Is it obvious? Is it the wool on my sleeve?'],
    dreamy: ['I\'m always making something for someone. Even when I don\'t know who yet.'],
    witty: ['I am. It\'s a secret. Which is why I\'m telling a wizard in the lane.'],
    proud: ['I am. A fine one.'],
    gloomy: ['Maybe. They probably won\'t like it.'],
  }, [
    { if: { giftTo: has }, text: ['I gave {giftTo} a {giftWhat}, not long since. Now I\'m on the next.'] },
    { if: { season: 'winter' }, text: ['It\'s nearly Yule. Everybody\'s making something for somebody.'] },
  ]);
  L('pastime.gift.who', ['A neighbour. They\'ve had a hard time.', 'Someone who wouldn\'t expect it. Those are the best ones to make for.'], {
    cheerful: ['Everyone, eventually! But this one\'s for someone special.'],
    ornery: ['Someone who\'ll appreciate it. For once.'],
    shy: ['...Someone. I can\'t say.'],
    curious: ['For the postie. She carries everything for everyone and nobody gives her anything.'],
    dreamy: ['For someone I haven\'t met yet. Isn\'t that strange?'],
    witty: ['For whoever stops me in the lane at the right moment. Could be you.'],
    proud: ['For the Steward. A proper gift, worthy of the hole.'],
    gloomy: ['For someone who won\'t notice.'],
  }, [
    { if: { spouse: has }, text: ['For {spouse}. Our anniversary. {Spouse} thinks I\'ve forgotten.'] },
    { if: { kid: has }, text: ['For {kid}. A birthday surprise. Don\'t say a word.'] },
    { if: { friend: has }, text: ['For {friend}. {Friend} has been good to me.'] },
    { if: { giftTo: has }, pri: 1, text: ['I made {giftTo} a {giftWhat}. {GiftTo} cried. I\'m making another for the other side of the lane.'] },
  ]);
  L('pastime.gift.given', ['Once. A {giftFromWhat}, from {giftFrom}. I keep it by the bed.', 'Not often. Makers don\'t get made for. We\'re supposed to have everything.'], {
    cheerful: ['Oh, yes! Folk are so kind! Look, this button!'],
    ornery: ['No. Nobody thinks makers want things.'],
    shy: ['...Once. I cried.'],
    gloomy: ['No. Never.'],
  }, [
    { if: { giftFrom: has }, pri: 1, text: ['{GiftFrom} made me a {giftFromWhat}. Out of nowhere. I\'ve not stopped smiling.', '{GiftFrom} gave me a {giftFromWhat}. I keep picking it up.'] },
    { if: { giftFrom: has, temper: 'shy' }, pri: 1, text: ['...{GiftFrom} made me a {giftFromWhat}. I don\'t know what to say to {giftFrom} about it.'] },
  ]);
  L('pastime.gift.me', ['Ha! You wish.', 'Might be. You\'ll find out. Or you won\'t.'], {
    cheerful: ['Ha! Maybe the next one! You\'re on the list!'],
    ornery: ['It is not.'],
    shy: ['...It might be. No. It isn\'t. ...It might be.'],
    witty: ['It\'s for you, if you\'re a small hedgehog with a cold.'],
    proud: ['You\'d need to earn one of mine.'],
  });
  L('pastime.gift.why', ['Because they did something kind and nobody saw.', 'Because I can\'t say it. So I make it.'], {
    shy: ['...Because I can\'t say things. But I can make things.'],
    gloomy: ['Because I\'ve not been fair to them. This is easier than saying so.'],
    proud: ['Because they deserve the best, and I\'m the best.'],
    witty: ['Because they once lent me a ladder. A very good ladder.'],
  });
  L('pastime.gift.nobody', ['...That\'s a nice thing to say. Nobody\'s ever said that.', 'Ha! Go on, then. Make me something. I dare you.'], {
    cheerful: ['Ha! I\'ll drop hints! Big ones!'],
    ornery: ['Hmph. I don\'t need anything. ...It would be nice, though.'],
    shy: ['...Oh. That\'s kind. I wouldn\'t know what to do.'],
    witty: ['I\'ll put up a sign. \'Makers welcome to be made for.\' Very subtle.'],
    proud: ['Most folk wouldn\'t dare. They know my standards.'],
    gloomy: ['...It\'d be nice. Once.'],
  });
  L('pastime.gift.thrilled', ['I hope so. I always worry they\'ll just be polite.', 'Do you think? I hope they will.'], {
    cheerful: ['I know! I can\'t wait! I\'ll probably give it to them early!'],
    gloomy: ['Maybe. Maybe they\'ll just put it in a drawer.'],
  });
  L('pastime.gift.hands', ['...They do, don\'t they. I hadn\'t thought of it like that.', 'That\'s it exactly. It\'s like holding hands, a bit.'], {
    ornery: ['...Hm. Yes. That\'s right, that is.'],
  });
  L('pastime.gift.thanked', ['...Not properly. I didn\'t know how.', 'I said thank you. It didn\'t feel like enough.'], {
    proud: ['Of course I did.'],
    shy: ['...I tried. It came out wrong.'],
  });
  L('pastime.gift.surprised', ['Ha! Go on, then. Do your surprised face.', '...That\'s your surprised face? You look like you\'ve sat on a hedgehog.'], {
    witty: ['Practise in a puddle. You\'ll want to get the eyebrows right.'],
    cheerful: ['Ha! Do it again! Oh, that\'s wonderful!'],
  });
  L('pastime.gift.soon', ['Soon. Yes. Why wait? Tomorrow.', 'You\'re right. An occasion is just an excuse to be late.'], {
    ornery: ['When it\'s ready. Not before.'],
  });
  L('pastime.gift.back', ['Something back. Yes. I know just the thing.', 'Ha! Of course. I\'ll make them something. That\'s how I say things.'], {
    proud: ['I\'ll make them something even finer.'],
  });

  // ==================================================================================
  // --- A second pastime -----------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.second', about: 'pastime', weight: 0.8, cool: 6,
    label: (F) => `And you do ${F.pastime2Word || 'something else'} as well?`,
    when: (F) => !!F.pastime2 && (F.known || []).some((k) => k === 'hobby' || k.startsWith('pastime.')),
    open: { ask: 'I hear you do {pastime2Word} as well as {pastimeWord}, {name}. Where do you find the evenings?' },
    beats: {
      start: { line: 'pastime.second.start', go: [
        { ap: 'ask', say: 'Which do you love more?', to: 'more' },
        { ap: 'jest', say: 'Do the two ever get muddled?', to: 'muddle' },
      ] },
      more: { line: 'pastime.second.more', fx: { learn: ['pastime.second', '{Name} also does {pastime2Word}'] }, go: [
        { ap: 'warm', say: 'A good life has room for two loves.', to: 'end' },
        { ap: 'ask', say: 'Would you ever give one up?', to: 'giveup' },
      ] },
      muddle: { line: 'pastime.second.muddle', fx: { joke: { k: 'pastime.muddle', t: 'The day the two pastimes got muddled.' } }, go: [
        { ap: 'jest', say: 'A new art form. You\'ll be famous.', to: 'end' },
        { ap: 'ask', say: 'Which came first?', to: 'first' },
      ] },
      giveup: { line: 'pastime.second.giveup', end: true },
      first: { line: 'pastime.second.first', end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.second.start', ['Oh, I steal them. From sleep, mostly.', 'One for fine days, one for wet ones. It works out.'], {
    cheerful: ['There\'s always time for things you love! I just eat supper faster!'],
    ornery: ['I find them. I don\'t waste them gossiping, that\'s how.'],
    shy: ['...I don\'t go out much. That helps.'],
    curious: ['One feeds the other, I find. You learn things in one that help the other.'],
    dreamy: ['The evenings are longer than people think. If you don\'t count them.'],
    witty: ['I don\'t sleep. I\'m told it shows.'],
    proud: ['Some of us are simply productive.'],
    gloomy: ['The evenings are long. They need filling.'],
    child: ['I do EVERYTHING. I want to do more things.'],
  });
  L('pastime.second.more', ['Don\'t make me choose. It\'s like choosing between puddings.', '{PastimeWord}. But don\'t tell the {pastime2Word}.', 'Depends on the day. {PastimeWord} when I\'m happy, {pastime2Word} when I\'m thinking.'], {
    cheerful: ['Both! Equally! Like two puddings!'],
    ornery: ['That\'s like asking which leg I like more.'],
    shy: ['...{Pastime2Word}. It\'s quieter.'],
    dreamy: ['{PastimeWord} is for the hands. {Pastime2Word} is for the heart. Or the other way round.'],
    witty: ['Whichever one I\'m not doing at the time.'],
    proud: ['I excel at both. I couldn\'t choose.'],
    gloomy: ['Neither, some days. Both, other days.'],
  });
  L('pastime.second.muddle', ['Ha! Once. I tried to knit a pot. It didn\'t take.', 'All the time. My notebooks have clay on them.'], {
    cheerful: ['Ha! All the time! I once brought a basket to a painting!'],
    witty: ['Once I painted a basket. Then I wove a painting. Then I had a lie down.'],
    curious: ['Actually, they help each other. Colour, shape, it\'s all the same thinking.'],
  });
  L('pastime.second.giveup', ['Never. You\'d have to cut off a hand.', 'If I had to. But I\'d miss it every evening.'], {
    gloomy: ['I might. I\'m not much good at either.'],
    proud: ['Never. Both are part of me.'],
  });
  L('pastime.second.first', ['{PastimeWord}. Then {pastime2Word} crept up on me.', 'I can\'t remember. They grew up together.'], {
    dreamy: ['They came together, I think. Like twins.'],
  });

  // ==================================================================================
  // --- Their turn: they want to show the wizard something they made ----------------------
  // ==================================================================================
  addThread({
    id: 'pastime.show', theirs: true, about: 'pastime', label: 'Something to show you', cool: 4,
    ask: '{Name} has something behind {their} back, and is fairly bursting to show you.',
    when: (F) => !!F.showPiece && F.met && F.talks >= 1 && F.fond >= 0,
    beats: {
      start: { line: 'pastime.show.start', go: [
        { ap: 'warm', say: 'Oh, now that is a fine thing.', to: 'fine' },
        { ap: 'ask', say: 'How long did it take you?', to: 'long' },
        { ap: 'jest', say: 'Is it for me? Say it\'s for me.', to: 'forme' },
      ] },
      fine: { line: 'pastime.show.fine', fx: { run: (T, v) => feel(v, 'made_piece', T.F.showPiece) }, go: [
        { ap: 'ask', say: 'Where will it go?', to: 'where' },
        { ap: 'warm', say: 'You\'ve a gift. Don\'t ever stop.', to: 'gift' },
      ] },
      long: { line: 'pastime.show.long', go: [
        { ap: 'warm', say: 'Every evening well spent.', to: 'fine' },
        { ap: 'ask', say: 'What was the hardest part?', to: 'hard' },
      ] },
      forme: { line: 'pastime.show.forme', go: [
        { ap: 'warm', say: 'I\'d treasure it. But keep it, if it\'s dear to you.', to: 'keep', need: { fond: 0.25 }, soft: true },
        { ap: 'jest', say: 'Ha! I\'ll settle for admiring it.', to: 'fine' },
      ] },
      where: { line: 'pastime.show.where', end: true },
      gift: { line: 'pastime.show.gift', fx: { fond: 0.03, respect: 0.01 }, end: true },
      hard: { line: 'pastime.show.hard', go: [
        { ap: 'warm', say: 'It doesn\'t show. It looks easy. That\'s the art.', to: 'gift' },
        { ap: 'jest', say: 'Ah, the {madeOne} fought back.', to: 'end' },
      ] },
      keep: { line: 'pastime.show.keep', fx: { fond: 0.05, trust: 0.03, owe: -1, note: '{Name} gave you a {showPiece} they made.', remember: 'Gave the wizard a {showPiece} I made.', rv: 2, run: (T, v) => { const k = T.F.showKind, h = v.homeId >= 0 ? v.home() : null; if (h && h.crafts && h.crafts[k] > 0) h.crafts[k]--; } }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.show.start', ['Look! I finished it! What do you think?', 'Look! I finished it. A {showPiece}. What do you think?', 'Here. A {showPiece}. Just finished. I wanted you to see it first.'], {
    cheerful: ['LOOK! A {showPiece}! Isn\'t it the best one yet?'],
    ornery: ['Here. A {showPiece}. Don\'t make a fuss. ...Well? What do you think?'],
    shy: ['...I made a {showPiece}. I... wanted to show you. If you want.'],
    curious: ['Look at this {showPiece}. I tried something new. Can you tell what?'],
    dreamy: ['A {showPiece}. It came out how it wanted. I think it\'s happy.'],
    witty: ['Behold! A {showPiece}. Gasps are welcome. Applause is mandatory.'],
    proud: ['A {showPiece}. My best. I thought a wizard ought to see it.'],
    gloomy: ['A {showPiece}. It\'s not very good. I wanted to show you anyway.'],
    child: ['LOOK WHAT I MADE! It\'s a {showPiece}!'],
  });
  L('pastime.show.fine', ['You think so? ...Really?', 'It is, isn\'t it. I\'m so pleased.'], {
    cheerful: ['Ha! I knew you\'d like it! I KNEW it!'],
    ornery: ['Hm. Well. Yes. It\'s not bad.'],
    shy: ['*glows* ...Thank you.'],
    proud: ['It is. Thank you for seeing it.'],
    gloomy: ['...You mean it? ...Thank you.'],
    child: ['YES! I\'m going to show EVERYONE!'],
  });
  L('pastime.show.long', ['Four evenings. Five, with the bit I undid.', 'All week. Every spare minute.'], {
    ornery: ['Longer than it should have. Folk kept interrupting.'],
    curious: ['Eleven hours. I counted. I count everything.'],
    witty: ['A week. A month, if you count the sulking.'],
    child: ['AGES. Like, a whole afternoon.'],
  });
  L('pastime.show.forme', ['Ha! ...It might be. If you\'re good.', 'For you? ...Would you want it?'], {
    cheerful: ['Ha! Would you like it? You can have it!'],
    ornery: ['It is not. Make your own.'],
    shy: ['...Would you want it? Really?'],
    proud: ['It\'s much too fine to give away. ...Well. To you, maybe.'],
    child: ['NO. ...Okay, yes. Do you want it?'],
  });
  L('pastime.show.where', ['On the mantel. Where I can see it from my chair.', 'By the door. So everyone sees it coming in.'], {
    ornery: ['Wherever I like.'],
    shy: ['...By my bed. Nobody else will see it there.'],
    witty: ['Pride of place. Next to the other pride of place. I\'ve a lot of places.'],
    child: ['In my room! Next to my best stone!'],
  });
  L('pastime.show.gift', ['*They go quiet, and very pleased.* ...Thank you, wizard.', 'I won\'t stop. Not now.'], {
    cheerful: ['I won\'t! Never ever! Oh, I\'m so happy!'],
    ornery: ['...Hmph. I wasn\'t going to.'],
    shy: ['*They tuck the {showPiece} away, smiling at nothing.*'],
    child: ['I\'m going to make a hundred more!'],
  });
  L('pastime.show.hard', ['Getting it to stop being difficult.', 'The last bit. It\'s always the last bit.'], {
    curious: ['Getting it even. Everything wants to lean, if you let it.'],
    witty: ['Not throwing it in the river halfway through.'],
    child: ['Not eating it! ...It\'s not food. I just wanted to.'],
  });
  L('pastime.show.keep', ['...No. It\'s for you. Take it. I\'ve decided. Take it before I change my mind.', '*They press it into your hands.* Keep it. Take it on the road. So you remember us.'], {
    cheerful: ['No! It\'s yours! I made it for you really! I just didn\'t know till now!'],
    ornery: ['Take the thing before I think better of it.'],
    shy: ['*They fold your fingers round it.* ...For you.'],
    proud: ['Take it. A wizard should have something fine.'],
    gloomy: ['...I\'d like you to have it. It\'ll be somewhere better.'],
    child: ['Take it! It\'s a present! You have to say thank you!'],
  });

  // --- Their turn: a find to show ---------------------------------------------------
  addThread({
    id: 'pastime.find', theirs: true, about: 'pastime', label: 'A find', cool: 4,
    ask: '{Name} holds out a closed fist, grinning.',
    when: (F) => (F.hobbies || []).includes('collecting') && F.met,
    beats: {
      start: { line: 'pastime.find.start', go: [
        { ap: 'warm', say: 'That\'s a beauty. A real find.', to: 'beauty' },
        { ap: 'ask', say: 'Where did you find it?', to: 'where' },
        { ap: 'tale', say: 'There\'s a story in that. I can feel it.', to: 'story' },
      ] },
      beauty: { line: 'pastime.find.beauty', fx: { fond: 0.02 }, end: true },
      where: { line: 'pastime.find.where', go: [
        { ap: 'jest', say: 'Then I\'ll go and look there and take all the good ones.', to: 'jest' },
        { ap: 'warm', say: 'A finder\'s eye. That\'s a rare thing.', to: 'beauty' },
      ] },
      story: { line: 'pastime.find.story', fx: { trust: 0.02 }, go: [
        { ap: 'tale', say: 'Perhaps it fell from the pocket of a king, running from goblins.', to: 'king' },
        { ap: 'warm', say: 'Whatever it is, it\'s yours now. That\'s its story.', to: 'end' },
      ] },
      jest: { line: 'pastime.find.jest', end: true },
      king: { line: 'pastime.find.king', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.find.start', ['Look! Look what I found!', 'Here. Look at this. Just look at it.'], {
    cheerful: ['LOOK! A {collectOne}! The best one ever!'],
    ornery: ['Found this. Thought you might know what it is. ...Well?'],
    shy: ['*They open their hand to show you a {collectOne}, without a word.*'],
    curious: ['What do you make of this? I think it\'s very old. Look at the marks.'],
    dreamy: ['Look. It was just lying there in the sun, waiting for me.'],
    witty: ['I\'ve found treasure. Don\'t tell the dwarves.'],
    proud: ['A {collectOne}. Finest I\'ve found. Look at it.'],
    gloomy: ['I found this. It\'s nothing much. I thought you\'d like it.'],
    child: ['LOOK! I found a {collectOne}! It\'s MINE!', 'Look! It\'s a treasure! Do you think it\'s magic?'],
  }, [
    { if: { collectTrinkets: true }, text: ['Look. From the rift scar. It\'s still warm. Why is it still warm?'] },
    { if: { collectCoins: true }, text: ['A coin! Look, there\'s a face on it! Who is it? Do you know?'] },
  ]);
  L('pastime.find.beauty', ['It is, isn\'t it! It\'s going in the cabinet!', 'I knew you\'d see it.'], {
    ornery: ['Hm. It\'s all right.'],
    child: ['It\'s going in my box! The SPECIAL box!'],
  });
  L('pastime.find.where', ['By the river. Right where the water drops.', 'In a molehill. Moles find the best things.'], {
    shy: ['...Somewhere secret.'],
    child: ['In the mud! I had to dig with a spoon!'],
  });
  L('pastime.find.story', ['Do you think? Tell me. Go on.', 'A story? What sort of story?'], {
    child: ['A STORY! Tell me tell me tell me!'],
    ornery: ['A story. It\'s a stone. ...What sort of story?'],
  });
  L('pastime.find.jest', ['You will not!', 'Ha! The good ones only show themselves to me.'], {
    child: ['NO! They\'re MINE!'],
  });
  L('pastime.find.king', ['A king! Running from goblins! Oh, I\'m going to tell everyone!', '*They look at it in a whole new way.* ...A king.'], {
    child: ['A KING! I knew it was magic! I KNEW it!'],
    ornery: ['...Hm. A king. ...It could be.'],
  });

  // --- Their turn: a bird -----------------------------------------------------------
  addThread({
    id: 'pastime.birdnow', theirs: true, about: 'pastime', label: 'A bird!', cool: 3,
    ask: '{Name} grabs your sleeve and points up into the trees.',
    when: (F) => (F.hobbies || []).includes('birdwatching') && F.weather !== 'rain' && F.hour !== 'night',
    beats: {
      start: { line: 'pastime.birdnow.start', go: [
        { ap: 'listen', say: '*You go very still and look.*', label: 'Go still and look', to: 'see' },
        { ap: 'ask', say: 'Where? I can\'t see it.', to: 'where' },
        { ap: 'share', say: '*You whistle softly, the way the thrushes taught you.*', label: 'Whistle to it', to: 'whistle' },
      ] },
      see: { line: 'pastime.birdnow.see', fx: { fond: 0.02, trust: 0.02 }, end: true },
      where: { line: 'pastime.birdnow.where', go: [
        { ap: 'listen', say: '*You look where they point.*', label: 'Look where they point', to: 'see' },
        { ap: 'jest', say: 'Ah. That\'s a leaf.', to: 'leaf' },
      ] },
      whistle: { line: 'pastime.birdnow.whistle', fx: { fond: 0.03, joke: { k: 'pastime.whistle', t: 'The wizard whistled and the bird whistled back.' } }, end: true },
      leaf: { line: 'pastime.birdnow.leaf', end: true },
    },
  });
  L('pastime.birdnow.start', ['Shh! Look! On the branch! Don\'t move!', 'There! THERE! Oh, don\'t look so fast, you\'ll scare it.'], {
    cheerful: ['Look look look! There! Isn\'t it lovely!'],
    ornery: ['Don\'t move. Don\'t breathe. Don\'t clank your staff.'],
    shy: ['*They don\'t say anything. They just point, very slowly.*'],
    curious: ['Look, it\'s doing it again! The little head-bob! Why does it do that?'],
    dreamy: ['*whispering* ...There. In the light. Do you see?'],
    witty: ['Don\'t look now, but a very important bird is in that tree.'],
    proud: ['There. I spotted it from the lane. Nobody else did.'],
    gloomy: ['There. It\'ll fly off in a second. They always do.'],
    child: ['A BIRD! A BIRD! LOOK!'],
  }, [
    { if: { birdLast: has }, text: ['A {birdLast}! Look! The same one as before, I swear!'] },
    { if: { birdWant: has }, text: ['Is that... is that a {birdWant}? No. ...No. Oh, I hoped.'] },
  ]);
  L('pastime.birdnow.see', ['*It sits a moment longer, then flicks away.* ...Did you see? You did. Oh, good.', '*You both watch until it goes.* ...That\'s my morning made.'], {
    cheerful: ['Did you SEE it? Oh, wasn\'t it grand?'],
    shy: ['*They let out a breath.* ...Thank you for being still.'],
    child: ['It FLEW! Did you see it fly?'],
  });
  L('pastime.birdnow.where', ['There! On the third branch! Look along my arm!', 'Follow my finger. No, my finger.'], {
    ornery: ['THERE. Wizards. Honestly.'],
    child: ['THERE! There there there!'],
  });
  L('pastime.birdnow.whistle', ['*The bird cocks its head, and whistles back.* ...It answered you. It ANSWERED you.', '*A pause, then a little trill in reply.* ...How did you do that?'], {
    ornery: ['...Show-off. ...Do it again.'],
    curious: ['It answered! What did you say? What did it say?'],
    child: ['DO IT AGAIN! Teach me! Teach me!'],
  });
  L('pastime.birdnow.leaf', ['...It IS a leaf. Oh. It was there a minute ago.', 'Ha! That\'s a leaf. The bird\'s gone. You frightened it with your eyebrows.'], {
    ornery: ['It was a bird. You were too slow.'],
  });
});
