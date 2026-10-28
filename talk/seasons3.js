'use strict';
// ---------------------------------------------------------------------------
// The good things of the year, as folk talk of them to the wizard: putting
// food by for winter and the state of the top shelf, the harvest coming in,
// their own gardens (and their neighbors' pumpkins), the food of each season
// and the dishes somebody they loved used to make, the long tables at a
// feast, Trewsday market, and their turn to make the wizard taste something.
// The facts of the year (jars, the next festival, the occasion) come from
// talk/seasons.js.
// ---------------------------------------------------------------------------

talkPack('seasons3', () => {
  const FEAST_KINDS = ['harvest', 'founding', 'wedding', 'feast', 'twohearths'];
  addFacts((v, F) => {
    F.tablesToday = !!(F.occasion && FEAST_KINDS.includes(F.occasion));
    F.tablesSoon = !!(F.nextFest && ['harvest', 'founding'].includes(F.nextFest) && F.nextFestIn != null && F.nextFestIn <= 2);
  });

  // --- The top shelf: putting by for winter ---------------------------------------------
  addThread({
    id: 'season.larder', cool: 3, weight: 1,
    label: (F) => (F.season === 'winter' ? 'How are the shelves holding up?' : 'Putting by for winter'),
    when: (F) => F.jars != null && (F.stage !== 'child' || F.band === 'youth'),
    rel: (F) => (F.season === 'autumn' || F.puttingBy ? 1.7 : F.season === 'winter' ? (F.jarsWord === 'bare' ? 1.8 : 1.3) : 0.4),
    open: { ask: 'season.larder.open' },
    beats: {
      start: { line: 'season.larder.start', go: [
        { ap: 'ask', say: 'And what goes on the top shelf, then?', to: 'what' },
        { ap: 'jest', say: 'I\'m told jam counts as a vegetable, if you squint.', to: 'jamveg' },
        { ap: 'comfort', say: 'Bare shelves fill. There\'s time yet.', to: 'worry', need: { if: { jarsWord: 'bare' } } },
        { ap: 'warm', say: 'Now that\'s a larder to be proud of.', to: 'proud', need: { if: { jarsWord: 'full' } } },
        { ap: 'advise', say: 'A few jars a day and you\'ll be snug by Yule.', to: 'advised', need: { if: { jarsWord: 'some' } } },
      ] },
      what: { line: 'season.larder.what', go: [
        { ap: 'ask', say: 'And whose recipe is the jam?', to: 'recipe' },
        { ap: 'share', say: 'I keep one jar of honey in my pack. For emergencies. Most days are emergencies.', to: 'honey' },
        { ap: 'jest', say: 'And how many have you eaten already? Be honest.', to: 'eaten' },
      ] },
      recipe: { line: 'season.larder.recipe', go: [
        { ap: 'ask', say: 'Is there a secret to it?', to: 'secret', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'Then every jar\'s a little bit of them.', to: 'memory' },
        { ap: 'jest', say: 'Written on the back of a bill, I expect. All the best recipes are.', to: 'bill' },
      ] },
      secret: { line: 'season.larder.secret', fx: { confide: { k: 'season.recipe', t: 'The secret in {name}\'s family jam', secret: true }, open: 1 }, go: [
        { ap: 'warm', say: 'Not a word. It goes no further than my beard.', to: 'safe' },
        { ap: 'jest', say: 'A pinch of what? I didn\'t quite catch it.', to: 'pinch' },
      ] },
      safe: { line: 'season.larder.safe', fx: { trust: 0.04, promise: { k: 'secret.season.recipe', t: 'You promised to keep {name}\'s jam secret', days: 30 } }, end: true },
      pinch: { line: 'season.larder.pinch', fx: { fond: 0.02, joke: { k: 'season.pinch', t: 'A pinch of what? The wizard never caught it.' } }, end: true },
      memory: { line: 'season.larder.memory', fx: { trust: 0.02, remember: 'Told the wizard whose recipe our jam is.', rv: 1 }, end: true },
      bill: { line: 'season.larder.bill', end: true },
      jamveg: { line: 'season.larder.jamveg', go: [
        { ap: 'jest', say: 'And pickles are practically a salad.', to: 'pickles' },
        { ap: 'ask', say: 'If the hole caught fire, which jar would you save?', to: 'fire' },
      ] },
      pickles: { line: 'season.larder.pickles', fx: { fond: 0.01 }, end: true },
      fire: { line: 'season.larder.fire', fx: { learn: ['season.jar', '{Name} would save one jar above all the rest'] }, end: true },
      worry: { line: 'season.larder.worry', go: [
        { ap: 'advise', say: 'Ask at the Common Store. That\'s what it\'s there for.', to: 'store' },
        { ap: 'warm', say: 'Nobody goes hungry in Thistledown while I\'ve a pack to carry.', to: 'promise' },
        { ap: 'listen', say: '*You lean on your staff and wait.*', label: 'Wait for the rest', to: 'fear', need: { open: 1 }, soft: true },
      ] },
      fear: { line: 'season.larder.fear', fx: { confide: { k: 'season.hungry', t: '{Name} is afraid of a hungry winter' }, open: 1 }, go: [
        { ap: 'comfort', say: 'Then we\'ll see it doesn\'t come to that. Together.', to: 'promise' },
        { ap: 'advise', say: 'Put by a little every day, even one jar. It adds up quicker than you\'d think.', to: 'begun' },
      ] },
      begun: { line: 'season.larder.started', fx: { queue: 'put_by', respect: 0.02 }, end: true },
      store: { line: 'season.larder.store', fx: { respect: 0.02 }, end: true },
      promise: { line: 'season.larder.promise', fx: { trust: 0.03, fond: 0.02, hook: 'season.larder' }, end: true },
      proud: { line: 'season.larder.proud', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'And which jar would you save in a fire?', to: 'fire' },
        { ap: 'jest', say: 'I may need to inspect it. Thoroughly. With a spoon.', to: 'spoon' },
      ] },
      spoon: { line: 'season.larder.spoon', fx: { joke: { k: 'season.spoon', t: 'The wizard offered to inspect the larder with a spoon.' } }, end: true },
      advised: { line: 'season.larder.advised', fx: { respect: 0.02 }, end: true },
      honey: { line: 'season.larder.honey', fx: { trust: 0.02 }, end: true },
      eaten: { line: 'season.larder.eaten', go: [
        { ap: 'jest', say: 'Your secret\'s safe. Mine is four jars of honey a week.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'warm', say: 'What\'s a larder for, if not for eating?', to: 'end' },
      ] },
    },
    end: { fond: 0.015 },
  });
  lines('season.larder.open', [
    { text: ['How are the shelves looking, {name}? Ready for winter?', 'Putting anything by this year, {name}?', 'Is the top shelf filling up, {name}?'] },
    { if: { season: 'winter' }, text: ['Holding out, are they, {name}? The jars?', 'How\'s the larder bearing up, {name}, this deep in the winter?'] },
    { if: { stage: 'child' }, text: ['Are you helping with the jam, {name}? Or just the tasting?'] },
  ]);
  lines('season.larder.start', [
    { text: ['Getting there. Getting there slowly.', 'Oh, it\'s a start. Every jar\'s a start.'] },
    { if: { jarsWord: 'full' }, text: ['Full! {Jars} jars. I go and look at them sometimes. Just look.', 'Not a gap on the shelf. I had to put the last two on the floor.', 'Full to the rafters. Let the snow come. Let it come twice.'] },
    { if: { jarsWord: 'some' }, text: ['{Jars} jars. A start. Not a winter\'s worth, but a start.', 'Half a shelf. Enough to feel smug, not enough to feel safe.'] },
    { if: { jarsWord: 'bare' }, text: ['Bare, if I\'m honest. A jar of pickles and a lot of hope.', 'Hardly anything. I keep meaning to. Then it\'s supper.', 'The shelf\'s bare as a shaved sheep. I don\'t like to look at it.'] },
    { if: { season: 'autumn' }, text: ['Every pot\'s on the boil. The whole hole smells of vinegar and brambles.'] },
    { if: { season: 'winter', jarsWord: 'full' }, text: ['Still plenty. I bring one down a day and the shelf hardly notices.'] },
    { if: { season: 'winter', jarsWord: 'bare' }, text: ['Down to the last few. I eat them slow, like they\'re made of gold.'] },
    { if: { season: ['spring', 'summer'] }, text: ['Winter\'s a long way off yet. The shelf\'s having a rest.', 'Empty jars, washed and waiting. They know their time\'s coming.'] },
    { if: { temper: 'ornery' }, text: ['Better than most. I don\'t leave it to the last minute like some.', 'Mind your own shelves, wizard. ...Mine\'s fine, since you ask.'] },
    { if: { temper: 'ornery', jarsWord: 'bare' }, text: ['Bare. And don\'t you look at me like that. Nobody gave me any apples.'] },
    { if: { temper: 'cheerful' }, text: ['Coming on lovely! I put a ribbon round every lid.', 'Oh, I love putting by. It\'s like writing letters to winter.'] },
    { if: { temper: 'cheerful', jarsWord: 'full' }, text: ['Full! I could throw a party out of my larder. I might.'] },
    { if: { temper: 'shy' }, text: ['...Not bad. I count them at night. Is that odd?', '...A few. I\'m slow at it. I like to do it properly.'] },
    { if: { temper: 'dreamy' }, text: ['I love the jars in the window. The light comes through the jam like a church.', 'Every jar\'s a bit of summer you can open in the snow.'] },
    { if: { temper: 'witty' }, text: ['My shelf is a monument to vinegar. Visitors weep. Mostly from the fumes.', 'Full enough that I\'ve started naming them. That one\'s Gerald.'] },
    { if: { temper: 'proud' }, text: ['Best-stocked larder on the lane. I\'ve checked. Discreetly.', 'Every jar labeled, dated and in order. My mother would weep.'] },
    { if: { temper: 'proud', jarsWord: 'bare' }, text: ['Bare, for now. I\'m doing it properly or not at all. Mostly not at all, so far.'] },
    { if: { temper: 'gloomy' }, text: ['It\'s never enough. Winter eats everything. It\'ll eat this.', 'A few jars. They won\'t last. They never do.'] },
    { if: { temper: 'curious' }, text: ['Did you know smoked fish keeps longer if you pack it in salt? I\'m testing how long.', 'Why doesn\'t jam spoil? I\'ve been wondering. Is it the sugar?'] },
    { if: { stage: 'child' }, text: ['I\'m not allowed to touch the jars. I touched one. It was jam.', 'I helped! I stirred. I stirred my sleeve in a bit.'] },
    { if: { stage: 'elder' }, text: ['I\'ve put by for sixty winters. My hands do it without me now.', 'Full enough. At my age you learn what a winter wants.'] },
    { if: { rift: true }, text: ['Putting by? You mean storing food in glass for months? On purpose? In Neverdark the vending machines did that.', 'I\'ve made eleven jars of pickles. I don\'t know what pickles are for yet. But I\'ve made them.'] },
    { if: { job: 'fisher' }, text: ['Smoked fish, mostly. The whole hole smells like a kipper. I\'ve stopped noticing.'] },
    { if: { job: 'orchardist' }, text: ['Apple jam, apple butter, dried apple rings. If it\'s apple, it\'s on my shelf.'] },
    { if: { job: 'baker' }, text: ['A baker doesn\'t put by much. I just bake more. Though I do a lovely jam.'] },
    { if: { job: 'farmer' }, text: ['Pickled everything that stood still. Beans, onions, a pumpkin the size of a dog.'] },
    { if: { job: 'innkeeper' }, text: ['The Badger\'s cellar is full. My own shelf? Bare. The cobbler\'s children, and all that.'] },
    { if: { job: 'herbalist' }, text: ['Jars of herbs, mostly. Mint, sage, feverfew. You can\'t eat them, but you\'ll be well.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse} does the jam, I do the pickles, and we argue about the shelf.'] },
    { if: { kidCount: { min: 2 } }, text: ['With {kidCount} little ones? I put by, they take down. It\'s a race and I\'m losing.'] },
    { if: { pantryBare: true }, pri: 1, text: ['The pantry\'s bare and the shelf\'s not much better. It\'s been a lean week.'] },
  ]);
  lines('season.larder.what', [
    { text: ['Bramble-apple jam, pickles, smoked fish. The holy three.', 'Jam on the left, pickles on the right, fish in the cool corner.'] },
    { if: { temper: 'ornery' }, text: ['What goes on everyone\'s. Jam, pickles, fish. I don\'t do fancy.'] },
    { if: { temper: 'cheerful' }, text: ['Jam! Mostly jam. Some pickles, to be sensible. Then more jam.'] },
    { if: { temper: 'dreamy' }, text: ['Bramble-apple, for the color. I like to hold it up to the candle.'] },
    { if: { temper: 'witty' }, text: ['Jam, for joy. Pickles, for character. Fish, for the neighbors to complain about.'] },
    { if: { temper: 'proud' }, text: ['My bramble-apple took a ribbon at the Harvest Feast. Three years running.'] },
    { if: { temper: 'shy' }, text: ['...Just jam. Bramble-apple. It\'s the only one I\'m good at.'] },
    { if: { temper: 'gloomy' }, text: ['Pickles. Pickles keep. Pickles don\'t let you down.'] },
    { if: { temper: 'curious' }, text: ['I\'m trying pickled mushrooms. Nobody\'s died yet. It\'s been four days.'] },
    { if: { likes: 'mushrooms' }, pri: 1, text: ['Dried mushrooms, strung on threads by the chimney. Better than jam. Don\'t tell the jam.'] },
    { if: { stage: 'elder' }, text: ['What my mother put by, and hers before. Bramble-apple, onions, a ham if we\'d a pig.'] },
    { if: { stage: 'child' }, text: ['Jam. The rest is boring. Pickles bite you.'] },
    { if: { rift: true }, text: ['Pickles. I like the jars. They look like the tanks in the Relay labs.'] },
    { if: { job: 'fisher' }, text: ['Fish, smoked and salted. Then a jar of jam so I don\'t forget other food exists.'] },
    { if: { job: 'brewer' }, text: ['Cider. Is cider putting by? It\'s in a jar. It counts.'] },
  ]);
  lines('season.larder.recipe', [
    { text: ['My grandmother\'s. Everybody\'s jam is somebody\'s grandmother\'s.', 'Mine. I made it up. Badly the first year, and then better.'] },
    { if: { parent: (p) => !!p }, text: ['{Parent}\'s. I watched from the stool every autumn till I could reach the pot.'] },
    { if: { temper: 'proud' }, text: ['Mine, and nobody else\'s. Folk have asked. Folk have been refused.'] },
    { if: { temper: 'shy' }, text: ['...My grandma\'s. She wrote it down for me in her best hand. I keep it in a tin.'] },
    { if: { temper: 'dreamy' }, text: ['My grandmother\'s. When I stir it I can hear her humming. Same tune every time.'] },
    { if: { temper: 'witty' }, text: ['Great-aunt Petunia\'s. She took it to the grave. I dug it back up. Out of her diary, I mean.'] },
    { if: { temper: 'ornery' }, text: ['My own. I don\'t hold with other people\'s recipes. They always leave something out.'] },
    { if: { temper: 'gloomy' }, text: ['My mother\'s. I never get it quite right. Close, but never quite.'] },
    { if: { stage: 'elder' }, text: ['Mine, now. It was my mother\'s, and her mother\'s. I\'ve been the grandmother for years.'] },
    { if: { stage: 'child' }, text: ['Mom\'s. She won\'t tell me. She says I have to be OLDER.'] },
    { if: { rift: true }, text: ['A hill-hobbit\'s, next door. She stood over me the whole time. I think I passed.'] },
  ]);
  lines('season.larder.secret', [
    { text: ['...A pinch of nutmeg and a spoon of honey, right at the end. Don\'t tell a soul.', '...A bay leaf in the pot. Just one. Take it out before the jar. That\'s all. That\'s everything.'] },
    { if: { temper: 'shy' }, text: ['...A drop of elderflower. Nobody guesses. I like that nobody guesses.'] },
    { if: { temper: 'proud' }, text: ['Very well. You\'re a wizard, you\'ll keep it. Crab apples. Two to every ten. That\'s the set.'] },
    { if: { temper: 'witty' }, text: ['You stir it widdershins and insult it gently. I\'m only half joking. Black pepper. Shh.'] },
    { if: { temper: 'dreamy' }, text: ['You pick the brambles at dusk, when they\'re warm from the whole day. You can taste the sun.'] },
    { if: { temper: 'ornery' }, text: ['...Fine. Less sugar than they say. Everyone uses too much. That\'s the whole secret, and it\'s yours now.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, it\'s silly! I sing to it while it sets. The same song. It works, I swear it does.'] },
    { if: { temper: 'gloomy' }, text: ['...Burn it a little. Just at the bottom. She always did, by accident, and it\'s not right without.'] },
    { if: { temper: 'curious' }, text: ['A lemon rind from the Bree carter. Nobody here has lemons. That\'s why nobody can copy it.'] },
    { if: { stage: 'elder' }, text: ['Patience. That\'s the secret. ...And a glug of cider. Mostly the cider.'] },
  ]);
  lines('season.larder.safe', [
    { text: ['I knew I could tell you. Not even {spouse} knows the bay leaf.', 'Thank you. If it gets out, I\'ll know who.'] },
    { if: { spouse: (s) => !s }, text: ['I knew I could tell you. You\'re the only other soul who knows.'] },
    { if: { temper: 'ornery' }, text: ['It had better. Beards have been shaved for less.'] },
    { if: { temper: 'witty' }, text: ['Your beard has seen a lot of secrets go in. I\'m trusting none come out.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. It felt nice to tell someone.'] },
  ]);
  lines('season.larder.pinch', [
    { text: ['Ha! Nice try. You\'ll not catch me twice.', 'A pinch of mind-your-own, wizard.'] },
    { if: { temper: 'witty' }, text: ['A pinch of "that\'s all you\'re getting". It\'s very rare.'] },
    { if: { temper: 'ornery' }, text: ['You heard me fine. Don\'t push your luck.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! You rogue. A pinch of love, then. That\'s my final answer.'] },
  ]);
  lines('season.larder.memory', [
    { text: ['...It is, isn\'t it? I never thought of it like that. Every jar.', 'That\'s a nice thing to say. I\'ll think it every time I open one.'] },
    { if: { temper: 'gloomy' }, text: ['...Yes. Every jar a bit less of them left, though.'] },
    { if: { temper: 'dreamy' }, text: ['Oh. Yes. That\'s why it tastes like that. It\'s them.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Soft old wizard. ...It is, though.'] },
    { if: { stage: 'elder' }, text: ['And one day it\'ll be a bit of me, in someone else\'s. That\'s how it goes.'] },
  ]);
  lines('season.larder.bill', [
    { text: ['How did you know? Back of a coal bill, and half of it\'s a shopping list.', 'Ha! The inside of a hymn book, actually. Don\'t tell the singers.'] },
    { if: { temper: 'witty' }, text: ['On a napkin from a wedding. The jam\'s outlasted the marriage.'] },
    { if: { stage: 'child' }, text: ['It\'s on the WALL. In crayon. That was me.'] },
  ]);
  lines('season.larder.jamveg', [
    { text: ['Ha! Then I\'m the healthiest hobbit in the Shire.', 'If you squint hard enough, everything\'s a vegetable. Except fish.'] },
    { if: { temper: 'witty' }, text: ['Brambles are a fruit, apples are a fruit, so jam is a salad. I\'ve always said so.'] },
    { if: { temper: 'ornery' }, text: ['Jam is jam. Don\'t you go muddling the categories.'] },
    { if: { temper: 'cheerful' }, text: ['I\'m telling everyone! Jam is a vegetable, by order of the wizard!'] },
    { if: { temper: 'curious' }, text: ['Is it, though? Where do you draw the line? Is chutney a vegetable?'] },
    { if: { stage: 'child' }, text: ['So I can have jam INSTEAD of greens? I\'m telling Mom you said.'] },
    { if: { temper: 'proud' }, text: ['My jam\'s a sight better than any vegetable, squinting or not.'] },
  ]);
  lines('season.larder.pickles', [
    { text: ['A salad that bites back. I\'ll take it.', 'Ha! I\'ll have mine with a pickled egg on the side. For balance.'] },
    { if: { temper: 'witty' }, text: ['And smoked fish is basically a walk by the river. I\'m very outdoorsy.'] },
    { if: { stage: 'child' }, text: ['Pickles are NOT salad. Pickles are revenge.'] },
    { if: { temper: 'gloomy' }, text: ['...Ha. All right. That was funny.'] },
  ]);
  lines('season.larder.fire', [
    { text: ['The last jar of my mother\'s jam. Never opened. Never will be.', 'The bramble-apple with the wonky label. First jar I ever made.'] },
    { if: { spouse: (s) => !!s }, text: ['The jam {spouse} and I made the first autumn we were wed. We never opened it.'] },
    { if: { kid: (k) => !!k }, text: ['The jar {kid} decorated. Wonky lid, more paint than glass. I\'d run back in for it.'] },
    { if: { temper: 'witty' }, text: ['Whichever\'s nearest the door. I\'m sentimental, not stupid.'] },
    { if: { temper: 'ornery' }, text: ['None of them. I\'d save myself and buy more. ...The damson. Fine. The damson.'] },
    { if: { temper: 'dreamy' }, text: ['The one with the bramble flower pressed in the wax. You can see it in the light.'] },
    { if: { temper: 'proud' }, text: ['The one with the ribbon from the Harvest Feast. Obviously.'] },
    { if: { stage: 'child' }, text: ['The biggest! So I\'d have the most jam!'] },
    { if: { rift: true }, text: ['The first jar I made here. It\'s terrible. It\'s proof I stayed.'] },
  ]);
  lines('season.larder.worry', [
    { text: ['I hope so. Winter doesn\'t wait for anyone.', 'Time. Yes. I keep saying that. Then it\'s Yule.'] },
    { if: { season: 'winter' }, text: ['Fill with what? Nothing grows in the snow. That\'s rather the trouble.'] },
    { if: { temper: 'gloomy' }, text: ['They never fill as fast as they empty. That\'s the law of shelves.'] },
    { if: { temper: 'ornery' }, text: ['Time I\'ve got. Apples I haven\'t. Tell that to the orchard.'] },
    { if: { temper: 'shy' }, text: ['...I\'m a bit scared about it, honestly. I haven\'t told anyone.'] },
    { if: { temper: 'proud' }, text: ['I don\'t need telling. I know my business. ...I\'m just behind.'] },
    { if: { temper: 'cheerful' }, text: ['You\'re right! And if not, there\'s always the Badger.'] },
    { if: { kid: (k) => !!k }, text: ['It\'s not me I worry about. {Kid} eats like a wolf in winter.'] },
  ]);
  lines('season.larder.fear', [
    { text: ['...I remember a hungry winter. When I was small. Porridge with water. I never want that again.', 'If the snow comes early and the shelf\'s bare... I lie awake on it.'] },
    { if: { kid: (k) => !!k }, pri: 1, text: ['...If {kid} goes hungry because I didn\'t put by. I couldn\'t bear it.'] },
    { if: { stage: 'elder' }, text: ['I\'ve seen a hungry winter. Folk don\'t forget. They just stop talking about it.'] },
    { if: { rift: true }, text: ['In the city when the food ran out, you queued. Here there\'s no queue. Just the snow.'] },
    { if: { temper: 'gloomy' }, text: ['Everybody says it\'ll be all right. It\'s never all right. It\'s just over.'] },
  ]);
  lines('season.larder.started', [
    { text: ['One jar a day. I can do one jar a day. I\'ll start now.', 'Right. Pan on. Apples in. You\'re a bully, wizard. A kind one.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I was going to anyway. ...I\'ll go and do it now.'] },
    { if: { temper: 'shy' }, text: ['...All right. I will. Thank you.'] },
  ]);
  lines('season.larder.store', [
    { text: ['The Store. I don\'t like to ask. But I will.', 'It is what it\'s for. You\'re right. I\'ll go and see the Steward.'] },
    { if: { temper: 'proud' }, text: ['I\'ve never taken from the Store in my life. ...Perhaps a little. Just this once.'] },
    { if: { temper: 'ornery' }, text: ['And have the whole lane know my business? ...Fine. At dusk.'] },
    { if: { temper: 'cheerful' }, text: ['Ooh, the Store! I always forget it\'s there for us. Thank you!'] },
  ]);
  lines('season.larder.promise', [
    { text: ['...You mean that, don\'t you. Thank you.', 'I\'ll hold you to that. And I\'ll put by anyway.'] },
    { if: { temper: 'ornery' }, text: ['Your pack\'s mostly fireworks. ...Still. Thank you.'] },
    { if: { temper: 'shy' }, text: ['...Oh. That\'s... thank you.'] },
    { if: { temper: 'gloomy' }, text: ['...That\'s the first time this autumn I\'ve felt it might be all right.'] },
    { if: { temper: 'witty' }, text: ['A wizard\'s pack. I\'ve seen what\'s in it. I\'ll be eating squibs.'] },
  ]);
  lines('season.larder.proud', [
    { text: ['It is, isn\'t it? I go and stand in front of it sometimes.', 'Thank you! I\'ve worked every evening on it.'] },
    { if: { temper: 'proud' }, text: ['It is. I\'m glad somebody\'s noticed. Most folk just eat.'] },
    { if: { temper: 'shy' }, text: ['...Oh. Thank you. I\'ll tell the jars.'] },
    { if: { temper: 'ornery' }, text: ['It\'s a larder. ...It is a good one, mind.'] },
    { if: { temper: 'witty' }, text: ['It\'s my finest work. I may put it on the door.'] },
  ]);
  lines('season.larder.spoon', [
    { text: ['A spoon! Ha! You\'d have half the shelf gone before supper.', 'Inspect it! I\'ve seen how wizards inspect cake.'] },
    { if: { temper: 'cheerful' }, text: ['Come round! Bring a big spoon! I\'ll put the kettle on!'] },
    { if: { temper: 'ornery' }, text: ['Touch my jam and I\'ll inspect your hat. With scissors.'] },
    { if: { stage: 'child' }, text: ['Can I inspect it too? I have my own spoon. It\'s got a duck on.'] },
  ]);
  lines('season.larder.advised', [
    { text: ['A few a day. Yes. That\'s not so many, put like that.', 'Snug by Yule. I like the sound of that.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I know how to fill a shelf, thank you. ...But yes.'] },
    { if: { temper: 'curious' }, text: ['How many, exactly? I\'ll do the sums tonight.'] },
  ]);
  lines('season.larder.honey', [
    { text: ['Honey in your pack! No wonder you\'re always so sweet-tempered.', 'Every day an emergency. Ha! You\'re a hobbit at heart.'] },
    { if: { temper: 'witty' }, text: ['Most days are emergencies. That\'s the truest thing a wizard\'s ever said.'] },
    { if: { temper: 'shy' }, text: ['...I keep a cookie in my pocket. For the same reason.'] },
    { if: { stage: 'child' }, text: ['Can I have some? It\'s an emergency. I\'m very hungry.'] },
    { if: { rift: true }, text: ['I kept a battery in my pocket, back home. Same thing, really.'] },
  ]);
  lines('season.larder.eaten', [
    { text: ['Two. ...Three. The third was an accident.', 'None! ...One. It looked lonely on the shelf.'] },
    { if: { temper: 'witty' }, text: ['I eat them in order of how much they\'d be missed. So far, none have been.'] },
    { if: { temper: 'ornery' }, text: ['That\'s my business. And my jam.'] },
    { if: { temper: 'proud' }, text: ['Not a one. I have discipline. ...The pickles don\'t count.'] },
    { if: { stage: 'child' }, text: ['I licked one. Just the lid. Just the outside of the lid.'] },
  ]);

  // --- The harvest ------------------------------------------------------------------------
  addThread({
    id: 'season.harvest', cool: 3, weight: 1.1, label: 'The harvest',
    when: (F) => F.season === 'autumn' || (F.season === 'summer' && F.seasonDay >= 2),
    rel: (F) => (F.season === 'autumn' ? 1.6 : 1.1) * (['farmer', 'orchardist', 'miller', 'brewer', 'baker', 'herder'].includes(F.job) ? 1.4 : 1),
    open: { ask: 'season.harvest.open' },
    beats: {
      start: { line: 'season.harvest.start', go: [
        { ap: 'ask', say: 'How\'s it looking, this year?', to: 'yield' },
        { ap: 'jest', say: 'I can lift a sheaf, you know. With a spell. Probably.', to: 'lift' },
        { ap: 'share', say: 'I helped bring in a harvest once, in the far south. Grapes. Very sticky.', to: 'grapes' },
      ] },
      yield: { line: 'season.harvest.yield', go: [
        { ap: 'ask', say: 'And the last sheaf? Who gets to cut it?', to: 'sheaf' },
        { ap: 'warm', say: 'Every hand helps. Yours more than most.', to: 'hands' },
        { ap: 'ask', say: 'Is it hard on you, the harvest?', to: 'hard', need: { open: 1 }, soft: true },
      ] },
      sheaf: { line: 'season.harvest.sheaf', go: [
        { ap: 'ask', say: 'And who braided the dolly last year?', to: 'dolly' },
        { ap: 'jest', say: 'I\'d make a terrible corn dolly. All beard and no waist.', to: 'beard' },
      ] },
      dolly: { line: 'season.harvest.dolly', fx: { remember: 'Told the wizard about the harvest dolly.', rv: 1, fond: 0.02 }, end: true },
      beard: { line: 'season.harvest.beard', fx: { joke: { k: 'season.dolly', t: 'The wizard would make a corn dolly all beard and no waist.' } }, end: true },
      hard: { line: 'season.harvest.hard', fx: { open: 1 }, go: [
        { ap: 'comfort', say: 'Then let the valley carry you a little, for once.', to: 'eased' },
        { ap: 'advise', say: 'Rest at noon. The barley won\'t run off while you sleep.', to: 'rest' },
      ] },
      eased: { line: 'season.harvest.eased', fx: { trust: 0.03, drive: { tired: -0.05 } }, end: true },
      rest: { line: 'season.harvest.rest', fx: { respect: 0.02 }, end: true },
      hands: { line: 'season.harvest.hands', fx: { fond: 0.02 }, end: true },
      lift: { line: 'season.harvest.lift', go: [
        { ap: 'jest', say: 'Then I\'ll lift it with my back, like everyone else, and complain louder.', to: 'complain' },
        { ap: 'warm', say: 'Point me at a field and I\'ll do my best.', to: 'help' },
      ] },
      complain: { line: 'season.harvest.complain', fx: { fond: 0.02 }, end: true },
      help: { line: 'season.harvest.help', fx: { fond: 0.02, respect: 0.01 }, end: true },
      grapes: { line: 'season.harvest.grapes', go: [
        { ap: 'tale', say: 'You tread them barefoot in a great tub, and sing so you don\'t think about it.', to: 'tread' },
        { ap: 'ask', say: 'Would you ever want to see it? The south?', to: 'south' },
      ] },
      tread: { line: 'season.harvest.tread', fx: { fond: 0.02 }, end: true },
      south: { line: 'season.harvest.south', end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.harvest.open', [
    { text: ['The harvest\'s coming, {name}. How goes it?', 'Is it all coming in, {name}? The harvest?'] },
    { if: { job: ['farmer', 'orchardist', 'miller'] }, text: ['You\'ll be run off your feet with the harvest, {name}.', 'How are the fields treating you, {name}?'] },
    { if: { stage: 'child' }, text: ['Are you helping with the harvest, {name}? Or hiding from it?'] },
  ]);
  lines('season.harvest.start', [
    { text: ['Everyone\'s in the fields. Even the ones who say they\'re not.', 'It\'s all hands. You can hear the scythes from the lane.'] },
    { if: { season: 'summer' }, text: ['The hay\'s in, and the barley\'s going gold. Not long now.', 'It\'s nearly time. You can smell it, the barley, warm in the evening.'] },
    { if: { season: 'autumn' }, text: ['Stooks in every field like little huts. The barley\'s nearly all in.', 'Apples, barley, hay. Carts up and down the lane from dawn.'] },
    { if: { job: 'farmer' }, text: ['My back says it\'s harvest. My hands say it\'s harvest. My bed says "what bed?"', 'Up at four, cutting by five, still cutting at dusk. Then the stooks.'] },
    { if: { job: 'orchardist' }, text: ['Ladders against every tree, baskets on every arm. The orchard\'s humming.', 'Apples coming down faster than we can carry. And the wasps want them too.'] },
    { if: { job: 'miller' }, text: ['The wheel\'s not stopped in days. Flour in my ears, in my beard, in my dreams.', 'The new barley\'s coming to the mill in carts. I grind till the stars are out.'] },
    { if: { job: 'brewer' }, text: ['New barley for malting and the cider apples coming in. I don\'t sleep, I just ferment.'] },
    { if: { job: 'baker' }, text: ['New flour! Nothing like the first loaf off the new flour. You can taste the field.'] },
    { if: { job: 'herder' }, text: ['The beasts go onto the stubble when it\'s cut. They think it\'s a feast. It is, for them.'] },
    { if: { job: 'innkeeper' }, text: ['Harvest means thirsty folk. I\'ve rolled out three barrels since lunch.'] },
    { if: { job: 'grower' }, text: ['The leaf\'s cut and hanging. The shed smells like next year\'s pipe.'] },
    { if: { temper: 'ornery' }, text: ['Hard work and no thanks. Same as every year.', 'Folk who never lift a finger all year suddenly want to help. For the feast, mind.'] },
    { if: { temper: 'cheerful' }, text: ['I love the harvest! Singing in the fields, cider at noon, everybody together!'] },
    { if: { temper: 'shy' }, text: ['...I glean. After the cutting. It\'s quiet, and you find things.'] },
    { if: { temper: 'dreamy' }, text: ['The light on the stubble at dusk. Like the whole field\'s been dipped in honey.'] },
    { if: { temper: 'witty' }, text: ['It\'s the one time of year everyone admits barley is interesting.'] },
    { if: { temper: 'proud' }, text: ['My rows are always straightest. You can see them from the hill. Go and look.'] },
    { if: { temper: 'gloomy' }, text: ['It\'ll rain before it\'s in. It always rains before it\'s in.'] },
    { if: { temper: 'curious' }, text: ['Why does barley turn gold and grass doesn\'t? I\'ve asked three farmers. They shrugged.'] },
    { if: { stage: 'child' }, text: ['I ride on the cart! On TOP! And we have cider. Well, apple juice. Same thing.', 'I made a stook. It fell over. I made another one. It fell on me.'] },
    { if: { stage: 'elder' }, text: ['I can\'t swing a scythe now. I sit at the field edge and tell them they\'re doing it wrong.'] },
    { if: { rift: true }, text: ['Back home the food came out of a machine that never stopped. Here you watch it grow, then cut it. I cried a bit.'] },
    { if: { hazard: 'blight' }, pri: 2, text: ['The blight\'s in the barley. We\'re cutting what we can and burning the rest.'] },
    { if: { weather: 'rain' }, pri: 1, text: ['Rain! On the stooks! Everyone\'s out with sacking, running about like hens.'] },
  ]);
  lines('season.harvest.yield', [
    { text: ['Fair. Better than last year, worse than the year before.', 'Good, if the weather holds. Everything\'s "if the weather holds".'] },
    { if: { hazard: 'blight' }, pri: 1, text: ['Poor. The blight\'s taken a field. We\'ll manage on the others.'] },
    { if: { hazard: 'drought' }, pri: 1, text: ['Thin. The dry spell stunted it. Short stalks, small ears.'] },
    { if: { job: 'farmer' }, text: ['Heavy ears, straight stalks. If I said any more I\'d jinx it.', 'Good. Too good. Something\'ll go wrong. It always does when it\'s good.'] },
    { if: { job: 'orchardist' }, text: ['Branches bent to the ground. I\'ve propped them up with forks.'] },
    { if: { job: 'miller' }, text: ['By the weight of the sacks, a good year. My shoulders agree.'] },
    { if: { temper: 'cheerful' }, text: ['Wonderful! The best in years! I say that every year. It\'s true every year!'] },
    { if: { temper: 'gloomy' }, text: ['It\'ll do. It won\'t be enough. It never is, come spring.'] },
    { if: { temper: 'ornery' }, text: ['Good, no thanks to the crows. Or the rabbits. Or the young ones.'] },
    { if: { temper: 'proud' }, text: ['My field\'s the best in the valley. The rest are... coming along.'] },
    { if: { temper: 'witty' }, text: ['Plenty. Enough for every hobbit to have seconds. Thirds is where it gets tight.'] },
    { if: { stage: 'child' }, text: ['BIG. There\'s a pumpkin bigger than me. I sat on it.'] },
    { if: { stage: 'elder' }, text: ['I\'ve seen better and I\'ve seen worse. This one\'s a kind one.'] },
  ]);
  lines('season.harvest.sheaf', [
    { text: ['The last sheaf\'s braided into a dolly, and she hangs over the Badger\'s fire till spring.', 'Nobody wants to cut the last sheaf. They throw their sickles at it from a distance. Old custom.'] },
    { if: { stage: 'elder' }, text: ['The eldest at the field cuts it. That\'s been me, a few times. Makes your hand shake.'] },
    { if: { stage: 'child' }, text: ['The youngest gets to hold it! I held it last year! It was itchy!'] },
    { if: { temper: 'dreamy' }, text: ['The last sheaf\'s where the field\'s spirit hides. You cut it gently, and say sorry.'] },
    { if: { temper: 'witty' }, text: ['Whoever loses the sickle-throwing. Which is always the one with the worst aim. So me.'] },
    { if: { temper: 'ornery' }, text: ['A lot of nonsense about the last sheaf. It\'s barley. Cut it.'] },
    { if: { rift: true }, text: ['There\'s a ceremony for cutting the last bit? I love this place. I love it so much.'] },
  ]);
  lines('season.harvest.dolly', [
    { text: ['Old Mother Whoever, at the end of the lane. Her hands are like lightning.', 'I did! I did it badly. She has one arm longer than the other. We love her anyway.'] },
    { if: { pastime: 'basketry' }, pri: 1, text: ['Me. I weave baskets, so I got roped in. She\'s my best work, if I say so.'] },
    { if: { stage: 'child' }, text: ['Me and Gran! I did the head. It\'s a bit square.'] },
    { if: { temper: 'proud' }, text: ['I did. And the one before. Folk ask for me now.'] },
    { if: { temper: 'shy' }, text: ['...I did. Nobody knows. I left it on the step at night.'] },
  ]);
  lines('season.harvest.beard', [
    { text: ['Ha! A wizard dolly! We\'d hang you over the fire with a little hat.', 'All beard! I\'d braid it for you. Long winter, nothing better to do.'] },
    { if: { temper: 'witty' }, text: ['All beard and no waist. That\'s most of the elders I know.'] },
    { if: { stage: 'child' }, text: ['Can we make one of you? Can we? With a STICK for a staff?'] },
  ]);
  lines('season.harvest.hard', [
    { text: ['...Harder every year. Don\'t tell anyone I said.', 'It\'s the weeks of it. One day\'s fine. Thirty is a different thing.'] },
    { if: { stage: 'elder' }, text: ['My hands won\'t close in the mornings. I hide it. They\'d send me home.'] },
    { if: { temper: 'proud' }, text: ['Hard? ...My back\'s been bad. I\'ll not stop. But it\'s been bad.'] },
    { if: { temper: 'gloomy' }, text: ['Everything\'s hard. The harvest\'s just hard where people can see.'] },
    { if: { tired: true }, pri: 1, text: ['I could sleep standing up. I nearly did, by the hedge.'] },
  ]);
  lines('season.harvest.eased', [
    { text: ['...Maybe I will. Just a bit.', 'That\'s a kind thought. I might let the young ones do the last field.'] },
    { if: { temper: 'proud' }, text: ['Hmph. ...Perhaps a little. Just the carrying.'] },
    { if: { temper: 'ornery' }, text: ['Carry me? They can barely carry a tune. ...Thank you, though.'] },
  ]);
  lines('season.harvest.rest', [
    { text: ['At noon. Under the oak. You\'ve a point.', 'The barley won\'t run off. Ha! No. It won\'t.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I\'ll rest when it\'s in. ...A short one, maybe.'] },
    { if: { temper: 'cheerful' }, text: ['A nap in the stooks! I\'ve always wanted to!'] },
  ]);
  lines('season.harvest.hands', [
    { text: ['Get away with you. I do my bit, that\'s all.', 'That\'s kind. Tell the crows. They think it\'s all theirs.'] },
    { if: { temper: 'proud' }, text: ['It is, rather. Nice of you to notice.'] },
    { if: { temper: 'shy' }, text: ['...Mine? Oh. I just glean, mostly.'] },
  ]);
  lines('season.harvest.lift', [
    { text: ['Probably! I\'d like to see it. From a distance.', 'With a spell! Go on, then. Field\'s just there.'] },
    { if: { temper: 'witty' }, text: ['Probably. The most reassuring word a wizard knows.'] },
    { if: { temper: 'ornery' }, text: ['Spells. Pick up a fork like an honest hobbit.'] },
    { if: { stage: 'child' }, text: ['Lift the WHOLE FIELD! Go on! Lift the cart! Lift ME!'] },
    { if: { job: 'farmer' }, pri: 1, text: ['I\'ll believe that when I see a sheaf float. Do it near the cart, mind.'] },
  ]);
  lines('season.harvest.complain', [
    { text: ['Now you\'re a proper harvester. The complaining\'s half the job.', 'Ha! Louder than the miller at a wet harvest? That\'s going some.'] },
    { if: { temper: 'ornery' }, text: ['Complain louder than me? You\'ve not heard me yet.'] },
  ]);
  lines('season.harvest.help', [
    { text: ['Really? Then the north field. Bring your hat, the sun\'s fierce.', 'Ha! I\'ll find you a fork. A tall fork.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, would you? Everyone will want to work next to the wizard!'] },
    { if: { temper: 'ornery' }, text: ['Hmph. We\'ll see how long your back lasts.'] },
  ]);
  lines('season.harvest.grapes', [
    { text: ['Grapes! Sticky how? Go on.', 'A harvest of grapes. What do you do with grapes, apart from eat them?'] },
    { if: { temper: 'curious' }, text: ['Grapes! How do they grow? On trees? On bushes? Do they need a ladder?'] },
    { if: { stage: 'child' }, text: ['GRAPES? Did you eat them all? Did you get sick?'] },
    { if: { temper: 'ornery' }, text: ['Foreign fruit. Can\'t make a decent jam with it, I\'ll wager.'] },
  ]);
  lines('season.harvest.tread', [
    { text: ['Barefoot! In the fruit! And they drink it after? Foreigners.', 'Ha! We\'d sing too. I\'d want something very loud.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, that sounds like the best fun! Can we do it with apples?'] },
    { if: { stage: 'child' }, text: ['I want to stamp in fruit! Can we stamp in the jam?'] },
  ]);
  lines('season.harvest.south', [
    { text: ['Me? No. I\'ve barley to cut. But tell me about it again sometime.', 'Maybe. One day. With a hat like yours.'] },
    { if: { temper: 'dreamy' }, text: ['I\'d love to. Just once. Then home, for the Harvest Feast.'] },
    { if: { rift: true }, text: ['I\'ve been far enough for one life. I\'ll take your word for the south.'] },
  ]);

  // --- Their garden -----------------------------------------------------------------------
  addThread({
    id: 'season.garden', cool: 3, weight: 1,
    label: (F) => (F.season === 'winter' ? 'The garden under snow' : 'How does your garden grow?'),
    when: (F) => F.band !== 'toddler',
    rel: (F) => ({ spring: 1.5, summer: 1.4, autumn: 1, winter: 0.6 }[F.season] || 1) * ((F.likes || []).includes('gardens') ? 1.5 : 1),
    open: { ask: 'season.garden.open' },
    beats: {
      start: { line: 'season.garden.start', go: [
        { ap: 'ask', say: 'And what\'s doing best?', to: 'best' },
        { ap: 'jest', say: 'Do you talk to them? I talk to mine. They never answer.', to: 'talk' },
        { ap: 'ask', say: 'Any trouble? Slugs? Rabbits?', to: 'pests' },
      ] },
      best: { line: 'season.garden.best', go: [
        { ap: 'ask', say: 'And what\'s the secret?', to: 'secret', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'I\'d love to see it, one evening.', to: 'show' },
        { ap: 'ask', say: 'I hear {rival} grows a fair pumpkin too.', to: 'rival', need: { if: { rival: (r) => !!r } } },
      ] },
      secret: { line: 'season.garden.secret', fx: { confide: { k: 'season.soil', t: 'The secret of {name}\'s garden', secret: true }, open: 1 }, go: [
        { ap: 'warm', say: 'Safe with me. I don\'t even tell my staff.', to: 'safe' },
        { ap: 'jest', say: 'I\'ll tell the slugs. They\'ll be thrilled.', to: 'slugs' },
      ] },
      safe: { line: 'season.garden.safe', fx: { trust: 0.04 }, end: true },
      slugs: { line: 'season.garden.slugs', end: true },
      show: { line: 'season.garden.show', fx: { fond: 0.02 }, end: true },
      rival: { line: 'season.garden.rival', go: [
        { ap: 'jest', say: 'Shall I put a curse on their pumpkins? A small one. Just a wilt.', to: 'curse' },
        { ap: 'advise', say: 'Grow beans this year. Nobody judges beans.', to: 'beans' },
        { ap: 'warm', say: 'Yours are better. Anyone with eyes can see it.', to: 'better' },
      ] },
      curse: { line: 'season.garden.curse', fx: { joke: { k: 'season.curse', t: 'The wizard offered to put a small wilt on {rival}\'s pumpkins.' }, fond: 0.02 }, end: true },
      beans: { line: 'season.garden.beans', fx: { respect: 0.01 }, end: true },
      better: { line: 'season.garden.better', fx: { fond: 0.03 }, end: true },
      pests: { line: 'season.garden.pests', go: [
        { ap: 'advise', say: 'season.garden.tip', label: 'Give them a gardener\'s tip', to: 'tipped' },
        { ap: 'jest', say: 'Have you tried reasoning with the rabbits?', to: 'rabbits' },
        { ap: 'comfort', say: 'There\'s enough for all of us. Even the slugs.', to: 'share' },
      ] },
      tipped: { line: 'season.garden.tipped', fx: { respect: 0.03 }, end: true },
      rabbits: { line: 'season.garden.rabbits', fx: { fond: 0.01 }, end: true },
      share: { line: 'season.garden.share', end: true },
      talk: { line: 'season.garden.talk', go: [
        { ap: 'ask', say: 'What do you say to them?', to: 'say' },
        { ap: 'share', say: 'I sing to my staff, some nights. Once, it put out a leaf.', to: 'staff' },
      ] },
      say: { line: 'season.garden.say', fx: { learn: ['season.plants', '{Name} talks to the plants in the garden'] }, end: true },
      staff: { line: 'season.garden.staff', fx: { trust: 0.02, joke: { k: 'season.staffleaf', t: 'The wizard sings to his staff, and once it put out a leaf.' } }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.garden.open', [
    { text: ['How does your garden grow, {name}?', 'And how\'s the garden, {name}? Behaving?'] },
    { if: { season: 'winter' }, text: ['What\'s the garden doing under all this, {name}?', 'Do you miss the garden in winter, {name}?'] },
    { if: { season: 'spring' }, text: ['Got everything in, {name}? The ground\'s warm enough now.'] },
    { if: { stage: 'child' }, text: ['Have you got a bit of garden of your own, {name}?'] },
  ]);
  lines('season.garden.start', [
    { text: ['Oh, coming along. Slowly. Like me.', 'Bits of it are lovely. Other bits are mostly weeds with ambition.'] },
    { if: { season: 'spring' }, text: ['Seeds in, fingers crossed. The peas are up and the lettuces are thinking about it.', 'Everything\'s sown and I\'m out at dawn to see what\'s poked through.'] },
    { if: { season: 'summer' }, text: ['Beans up the canes, pumpkins sprawling, and weeds everywhere I didn\'t plant them.', 'It\'s gone wild. I go out to weed and come back with a basket of strawberries instead.'] },
    { if: { season: 'autumn' }, text: ['Digging the last potatoes, and the pumpkins are the size of piglets.', 'Going over, mostly. The last beans and a forest of leeks.'] },
    { if: { season: 'winter' }, text: ['Asleep under the snow. A few leeks standing up like soldiers.', 'Nothing much. Planning. I draw next year\'s beds on the back of the coal bill.'] },
    { if: { weather: 'rain' }, text: ['Drinking it up! It\'s the one thing the garden thanks me for.'] },
    { if: { hazard: 'drought' }, pri: 1, text: ['Parched. I carry every drop from the well and it\'s still crackling.'] },
    { if: { hazard: 'frost' }, pri: 1, text: ['Black with frost. The cabbages look like they\'ve had a shock.'] },
    { if: { likes: 'gardens' }, pri: 1, text: ['Oh, don\'t get me started. ...Well, since you ask. It\'s the best it\'s ever been.'] },
    { if: { temper: 'ornery' }, text: ['Overrun. Slugs, snails, and a neighbor\'s hen that thinks she owns it.'] },
    { if: { temper: 'cheerful' }, text: ['Lovely! Everything I touch grows. Even the things I don\'t want.'] },
    { if: { temper: 'shy' }, text: ['...It\'s small. But it\'s mine. I like it.'] },
    { if: { temper: 'dreamy' }, text: ['I sit in it more than I work in it. Is that allowed?'] },
    { if: { temper: 'witty' }, text: ['My garden is a battlefield and I am losing with dignity.'] },
    { if: { temper: 'proud' }, text: ['Finest beans on the lane. Folk slow down to look. I see them.'] },
    { if: { temper: 'gloomy' }, text: ['Things grow and then they die. That\'s a garden for you.'] },
    { if: { temper: 'curious' }, text: ['I\'m trying beans in the shade and beans in the sun to see which wins. Science.'] },
    { if: { stage: 'child' }, text: ['I\'ve got a sunflower! It\'s taller than Dad! Nearly!', 'I grew a radish. Just one. I ate it. It was horrible. I was so proud.'] },
    { if: { stage: 'elder' }, text: ['Smaller every year. I keep the bits I can reach. The rest I let go to flowers.'] },
    { if: { rift: true }, text: ['I put a seed in the ground and a plant came out. Nobody had to code it. I check it every hour.'] },
    { if: { job: 'farmer' }, text: ['A farmer\'s garden is always last. My fields get the love, my cabbages get the leftovers.'] },
    { if: { job: 'herbalist' }, text: ['All herbs. Mint\'s eaten the path. Feverfew\'s eaten the mint.'] },
    { if: { homeless: true }, pri: 2, text: ['I\'ve no garden. Nowhere to put one. I look at other folk\'s over the hedge.'] },
  ]);
  lines('season.garden.best', [
    { text: ['The beans. Up the canes and over the top, like they\'re trying to escape.', 'Lettuces. Crisp as you like. I eat them standing in the bed.'] },
    { if: { season: 'summer' }, text: ['Pumpkins. I swear they grow while you watch. I named one. It\'s bigger than the cat.'] },
    { if: { season: 'spring' }, text: ['The peas. Little curly bits, climbing everything. And the rhubarb, which is pink and furious.'] },
    { if: { season: 'autumn' }, text: ['The pumpkins. Fat and orange, sat in the beds like sleeping pigs.'] },
    { if: { season: 'winter' }, text: ['The leeks. They don\'t care about snow. Brave things, leeks.'] },
    { if: { temper: 'proud' }, text: ['Everything, frankly. But the pumpkins are winning prizes. Twice now.'] },
    { if: { temper: 'dreamy' }, text: ['The sweet peas. I grow them for the smell, not to eat. The evening smell.'] },
    { if: { temper: 'gloomy' }, text: ['The weeds. The weeds always do best.'] },
    { if: { temper: 'witty' }, text: ['The slugs. Fattest slugs in Thistledown. I should charge them rent.'] },
    { if: { stage: 'child' }, text: ['My sunflower! It looks at the sun all day. It\'s like me and pudding.'] },
    { if: { pastime: 'painting' }, text: ['The poppies. I grow them to paint them. They never sit still.'] },
  ]);
  lines('season.garden.secret', [
    { text: ['...Tea leaves. Every pot, straight on the beds. And the ash from the fire.', '...I water at night. By moonlight. The plants like it better. Don\'t laugh.'] },
    { if: { temper: 'proud' }, text: ['Very well. Pony muck from the Bree carter. Three years rotted. That\'s the whole of it.'] },
    { if: { temper: 'shy' }, text: ['...I sing to them. Quietly. When nobody\'s about.'] },
    { if: { temper: 'witty' }, text: ['Eggshells for the slugs, coffee grounds for the beans, and threats for the cabbages.'] },
    { if: { temper: 'dreamy' }, text: ['I bury a wish under every row. Written on a scrap. The beans come up stronger.'] },
    { if: { temper: 'ornery' }, text: ['Hard work. That\'s the secret. ...And seaweed. A sack, every spring. Don\'t ask where from.'] },
    { if: { temper: 'cheerful' }, text: ['Nettle tea! For the plants, not me. It smells like a swamp. They love it.'] },
    { if: { stage: 'elder' }, text: ['My father\'s spade. Seventy years old. It knows where to dig. I just hold it.'] },
    { if: { rift: true }, text: ['I bring a bit of rift-glow back on my boots. The tomatoes go purple and huge. Shh.'] },
  ]);
  lines('season.garden.safe', [
    { text: ['Ha! Your staff. I trust you, then.', 'Thank you. It\'s silly, but it\'s mine.'] },
    { if: { temper: 'ornery' }, text: ['It had better stay safe. My beans have a reputation.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. I\'ve never told anyone.'] },
  ]);
  lines('season.garden.slugs', [
    { text: ['Don\'t you dare. They\'d form a committee.', 'Ha! They\'ll be round with their own tea leaves.'] },
    { if: { temper: 'witty' }, text: ['The slugs already know. They\'re the ones who told me.'] },
    { if: { temper: 'ornery' }, text: ['You tell a single slug and we\'re done, wizard.'] },
  ]);
  lines('season.garden.show', [
    { text: ['Come by at dusk. That\'s when it looks its best. Like most of us.', 'Any evening. Bring a basket. You\'ll leave with beans whether you want them or not.'] },
    { if: { temper: 'shy' }, text: ['...You\'d want to? It\'s only small. But yes.'] },
    { if: { temper: 'proud' }, text: ['Of course. I\'ll give you the tour. It takes an hour.'] },
    { if: { stage: 'child' }, text: ['Come NOW! I\'ll show you my radish hole!'] },
  ]);
  lines('season.garden.rival', [
    { text: ['{Rival}. Don\'t. Just don\'t. Every year it\'s a hand\'s width bigger than mine.', '{Rival} grows them for spite. I grow them for love. Love loses, usually.'] },
    { if: { temper: 'ornery' }, text: ['{Rival} waters at night when nobody\'s looking. I know. I\'ve been looking.'] },
    { if: { temper: 'proud' }, text: ['{Rival}\'s are watery. Big and watery. Like the rest of that family.'] },
    { if: { temper: 'witty' }, text: ['{Rival} talks to them. Lectures them, really. I think they grow to get away.'] },
    { if: { temper: 'gloomy' }, text: ['{Rival} wins every year. I\'ve stopped hoping. I haven\'t stopped growing them, mind.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, {rival}\'s are lovely! Mine are lovelier, mind. We have a little bet.'] },
    { if: { temper: 'shy' }, text: ['...{Rival}\'s are bigger. I don\'t mind. I mind a bit.'] },
    { if: { stage: 'elder' }, text: ['{Rival} and I have been at it forty years. I\'d miss it, if one of us stopped.'] },
  ]);
  lines('season.garden.curse', [
    { text: ['Ha! ...A small one. Just till the Harvest Feast.', 'Don\'t you dare. ...How small?'] },
    { if: { temper: 'ornery' }, text: ['Now you\'re talking. A wilt and a blight. ...No. No. I\'ll win fair.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! No! That\'s cheating! ...It\'s very kind of you, though.'] },
    { if: { temper: 'witty' }, text: ['A small curse. On a pumpkin. The most hobbit thing a wizard\'s ever said.'] },
    { if: { temper: 'proud' }, text: ['I need no curses. My pumpkins speak for themselves.'] },
  ]);
  lines('season.garden.beans', [
    { text: ['Beans. Hm. Nobody does judge beans. You might have something.', 'Beans! Then {rival} can keep the pumpkin crown and I\'ll be the bean king.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['Give up the pumpkins? Never. ...But some beans as well.'] },
  ]);
  lines('season.garden.better', [
    { text: ['You think so? Say it at the Harvest Feast. Loudly.', 'Oh, that\'s done me good. Say it again.'] },
    { if: { temper: 'proud' }, text: ['I know. But it\'s nice to hear from a wizard.'] },
    { if: { temper: 'gloomy' }, text: ['...You\'re just being kind. ...Thank you for being kind.'] },
    { if: { temper: 'ornery' }, text: ['Course they are. Tell {rival}. Tell everyone.'] },
  ]);
  lines('season.garden.pests', [
    { text: ['Slugs. A slug army. They come at night with tiny banners.', 'Rabbits in the lettuces, crows in the peas, and a pigeon that just sits and judges.'] },
    { if: { season: 'spring' }, text: ['Pigeons on the seedlings. They wait till I\'ve gone in, then down they come.'] },
    { if: { season: 'summer' }, text: ['Greenfly on everything. And wasps on the plums. And me, on my knees, swatting.'] },
    { if: { season: 'autumn' }, text: ['Mice in the potatoes. They take one bite of each, the rascals.'] },
    { if: { season: 'winter' }, text: ['Deer, once, in the snow. Ate every sprout. I wasn\'t even cross. They were so hungry.'] },
    { if: { temper: 'ornery' }, text: ['Rabbits. I\'ve a list of rabbits. I know their faces.'] },
    { if: { temper: 'cheerful' }, text: ['A few slugs! But they\'ve got to eat too, bless them.'] },
    { if: { temper: 'witty' }, text: ['My cabbages have more holes than a fisher\'s net. And catch about as much.'] },
    { if: { temper: 'gloomy' }, text: ['Everything wants to eat it before I do. Sometimes I let them.'] },
    { if: { stage: 'child' }, text: ['A rabbit ate my carrot! I saw him! He had a WHITE bottom!'] },
    { if: { likes: 'animals' }, pri: 1, text: ['A hedgehog. But I like the hedgehog. He eats the slugs. We\'re partners.'] },
  ]);
  lines('season.garden.tip', [
    { text: ['Marigolds between the rows. The greenfly hate them, and they look cheerful.', 'A saucer of ale by the lettuces. The slugs go in happy and don\'t come out.'] },
    { if: { season: 'spring' }, text: ['Strings with bits of tin on them over the seedlings. The pigeons hate the jingle.'] },
    { if: { season: 'autumn' }, text: ['Lift the potatoes now and store them in sand. The mice can\'t smell them in sand.'] },
  ]);
  lines('season.garden.tipped', [
    { text: ['Huh. I\'ll try it. You know more than you let on.', 'Well, I never heard that one. I\'ll give it a go, and blame you if it fails.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I\'ve been gardening since before your hat was gray. ...I\'ll try it.'] },
    { if: { temper: 'curious' }, text: ['Why does that work? Have you tested it? I\'ll try half the bed with and half without.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, clever! I\'ll try it this very afternoon!'] },
  ]);
  lines('season.garden.rabbits', [
    { text: ['Reasoning? They\'ve no reason. They\'ve got lettuces.', 'I tried. They just looked at me. With their noses going.'] },
    { if: { temper: 'witty' }, text: ['I\'ve offered terms. They\'re negotiating for the carrots now.'] },
    { if: { stage: 'child' }, text: ['I told one to go home. It went into the hedge. Is that its home?'] },
  ]);
  lines('season.garden.share', [
    { text: ['Even the slugs. Hmph. You\'re a soft one.', 'There is, isn\'t there. I\'ll stop fretting about the holes.'] },
    { if: { temper: 'ornery' }, text: ['Not the slugs. Never the slugs.'] },
    { if: { temper: 'dreamy' }, text: ['That\'s true. The garden\'s for everyone. I just get to sit in it.'] },
  ]);
  lines('season.garden.talk', [
    { text: ['Talk to them? ...Yes. Doesn\'t everyone?', 'Course I do. They never interrupt. Unlike some.'] },
    { if: { temper: 'ornery' }, text: ['I tell them off. Doesn\'t do any good, but it makes me feel better.'] },
    { if: { temper: 'shy' }, text: ['...Yes. They\'re easier than people.'] },
    { if: { temper: 'witty' }, text: ['They answer me. Just very slowly. A cabbage takes all summer to say "thank you".'] },
    { if: { temper: 'proud' }, text: ['I give them a talk every morning. Encouragement. It shows.'] },
    { if: { stage: 'child' }, text: ['I talk to my sunflower! I tell it about my day! It says nothing!'] },
  ]);
  lines('season.garden.say', [
    { text: ['"Come on, then." Mostly that. And "not you" to the weeds.', 'I tell them the news. They like to know who\'s courting.'] },
    { if: { temper: 'dreamy' }, text: ['I tell them what the weather\'s going to do, so they\'re not surprised.'] },
    { if: { temper: 'ornery' }, text: ['"Grow, or it\'s the compost." They know I mean it.'] },
    { if: { temper: 'witty' }, text: ['I read them the Chronicle. The peas love a scandal.'] },
    { if: { temper: 'gloomy' }, text: ['I tell them my troubles. They don\'t mind. They\'ve got slugs.'] },
  ]);
  lines('season.garden.staff', [
    { text: ['A leaf! On your staff! What did you sing?', 'Now that is a thing. I\'ll sing to my bean canes. Maybe they\'ll put out beans.'] },
    { if: { temper: 'curious' }, text: ['What song? Was it the tune or the words? Does it work on beans?'] },
    { if: { stage: 'child' }, text: ['Sing to it NOW. I want to see the leaf!'] },
    { if: { temper: 'ornery' }, text: ['A leaf. On a stick. Wizards. ...What song?'] },
  ]);

  // --- Food of the season -------------------------------------------------------------------
  addThread({
    id: 'season.food', cool: 2, weight: 1,
    label: 'What\'s good to eat just now?',
    rel: (F) => (F.hungry ? 1.6 : F.hour === 'morning' ? 1.2 : 1),
    open: { ask: 'season.food.open' },
    beats: {
      start: { line: 'season.food.start', go: [
        { ap: 'ask', say: 'And your favorite, any time of year?', to: 'fav' },
        { ap: 'jest', say: 'And how many breakfasts does {season} get, in your hole?', to: 'breakfasts' },
        { ap: 'ask', say: 'What\'s the best thing you ever ate?', to: 'best' },
      ] },
      fav: { line: 'season.food.fav', fx: { learn: ['season.favfood', '{Name}\'s favorite is {seasonFavFood}'] }, go: [
        { ap: 'ask', say: 'And who made it best?', to: 'who', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'I\'ll remember that, next time I need a favor.', to: 'favour' },
        { ap: 'share', say: 'Mine\'s mushrooms on toast, by a fire, after a long wet road.', to: 'wizfav' },
      ] },
      best: { line: 'season.food.best', go: [
        { ap: 'ask', say: 'And who made it?', to: 'who' },
        { ap: 'warm', say: 'Then I hope you have it again soon.', to: 'again' },
        { ap: 'jest', say: 'Better than my campfire porridge? Surely not.', to: 'porridge' },
      ] },
      who: { line: 'season.food.who', fx: { open: 1 }, go: [
        { ap: 'comfort', say: 'Then make it yourself, and think of them while you stir.', to: 'make' },
        { ap: 'listen', say: '*You say nothing, and let them remember.*', label: 'Let them remember', to: 'gone', need: { open: 2 }, soft: true },
        { ap: 'ask', say: 'Did they ever teach you how?', to: 'taught' },
      ] },
      gone: { line: 'season.food.gone', fx: { confide: { k: 'season.dish', t: 'How {name} misses the dish someone used to make for them' }, trust: 0.03 }, go: [
        { ap: 'comfort', say: 'Food remembers people. That\'s why it matters so much.', to: 'remembers' },
        { ap: 'warm', say: 'If you ever make it, I\'d be honored to taste it.', to: 'honoured' },
      ] },
      remembers: { line: 'season.food.remembers', fx: { trust: 0.03, fond: 0.02 }, end: true },
      honoured: { line: 'season.food.honoured', fx: { fond: 0.03, hook: 'season.dish' }, end: true },
      make: { line: 'season.food.make', fx: { remember: 'The wizard said I should make the old dish myself.', rv: 1 }, end: true },
      taught: { line: 'season.food.taught', end: true },
      favour: { line: 'season.food.favour', fx: { joke: { k: 'season.favour', t: 'The wizard knows the way to a favor is through {seasonFavFood}.' } }, end: true },
      wizfav: { line: 'season.food.wizfav', fx: { trust: 0.02 }, end: true },
      again: { line: 'season.food.again', end: true },
      porridge: { line: 'season.food.porridge', fx: { fond: 0.01 }, end: true },
      breakfasts: { line: 'season.food.breakfasts', go: [
        { ap: 'jest', say: 'Only that many? I\'d have thought a hobbit of your standing could manage more.', to: 'standing' },
        { ap: 'ask', say: 'And which is the best of them?', to: 'which' },
      ] },
      standing: { line: 'season.food.standing', fx: { fond: 0.02 }, end: true },
      which: { line: 'season.food.which', end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.food.open', [
    { text: ['What\'s good to eat just now, {name}?', 'Tell me, {name}: what does {season} taste of?'] },
    { if: { hungry: true }, text: ['You look like a hobbit thinking about food, {name}. What is it?'] },
    { if: { stage: 'child' }, text: ['What\'s the best thing to eat in {season}, {name}?'] },
  ]);
  lines('season.food.start', [
    { text: ['Whatever\'s in the pot. And whatever\'s in the next pot.', 'Oh, this time of year? Everything. Mostly at once.'] },
    { if: { season: 'spring' }, text: ['New lettuce, new eggs, the first radishes. Everything tastes green.', 'Rhubarb! Pink and sour and wonderful, with custard.', 'Nettle soup. Don\'t pull a face. It\'s the taste of spring, nettle soup.'] },
    { if: { season: 'summer' }, text: ['Strawberries and cream. Strawberries without cream. Strawberries in my pocket.', 'New potatoes with butter and mint. I could weep.', 'Peas straight from the pod. Half of them never make it to the kitchen.'] },
    { if: { season: 'autumn' }, text: ['Mushrooms! Fried, in butter, on toast. Then more mushrooms.', 'Blackberries off the hedge and apple pie with all of them in.', 'Roast chestnuts. And the first stew of the year, when the evenings turn.'] },
    { if: { season: 'winter' }, text: ['Stew. A great pot of it, all day on the stove.', 'Yule pudding with a silver penny in it. I found it once. I chipped a tooth.', 'Toast and dripping by the fire. Simple. Perfect.'] },
    { if: { temper: 'ornery' }, text: ['Same as always. Bread and cheese. I don\'t hold with fads.', 'Whatever I didn\'t burn. Which is most things, today.'] },
    { if: { temper: 'cheerful' }, text: ['Everything! I\'ve never met a season I couldn\'t eat.'] },
    { if: { temper: 'shy' }, text: ['...I like the plain things. A boiled egg. Bread. Is that dull?'] },
    { if: { temper: 'dreamy' }, text: ['Food you eat outside. It tastes of wherever you are.'] },
    { if: { temper: 'witty' }, text: ['{Season} tastes of whatever you didn\'t get round to in the last season.'] },
    { if: { temper: 'proud' }, text: ['My own cooking, naturally. I\'ve been told it\'s the best on the lane. By me, mostly.'] },
    { if: { temper: 'gloomy' }, text: ['Porridge. It\'s always porridge, in the end.'] },
    { if: { temper: 'curious' }, text: ['I\'m trying everything that grows this season, once. Some of it I shan\'t try twice.'] },
    { if: { stage: 'child' }, text: ['PUDDING. In every season. Especially now.', 'I ate a worm once. By accident. It tasted of mud.'] },
    { if: { stage: 'elder' }, text: ['Soft things, at my age. But I still want the crackling.'] },
    { if: { rift: true }, text: ['Back home it was noodles from a machine, every season. Here the food changes! On its own!', 'Strawberries. I\'d never had a real one. I thought the color was made up.'] },
    { if: { job: 'baker' }, text: ['Bread, bread, and the bit of bread I keep back for myself.'] },
    { if: { job: 'fisher' }, text: ['Fish, fried on the bank with the skin crisp. The rest of the world can keep its pies.'] },
    { if: { job: 'innkeeper' }, text: ['Whatever the Badger kitchen\'s doing. Today it\'s pie. Tomorrow it\'s pie.'] },
    { if: { job: 'herbalist' }, text: ['Anything with herbs. Sage in the stuffing, thyme on the mushrooms.'] },
    { if: { job: 'orchardist' }, text: ['Apples. Baked, stewed, raw, in a pie, in a cake, in my sleep.'] },
    { if: { likes: 'mushrooms' }, pri: 1, text: ['Mushrooms. Any season. I\'d eat them for pudding if folk wouldn\'t talk.'] },
    { if: { hungry: true }, pri: 1, text: ['Don\'t talk about food. I\'m starving. ...No, do. Talk about food.'] },
  ]);
  lines('season.food.fav', [
    { text: ['{SeasonFavFood}. Always has been. Always will be.', 'Give me {seasonFavFood} and I\'m anybody\'s.'] },
    { if: { seasonFavFood: 'seed-cake' }, text: ['Seed-cake. With a cup of tea. At four o\'clock. Exactly four.'] },
    { if: { seasonFavFood: 'mushrooms' }, text: ['Mushrooms. I\'d trespass for them. I have trespassed for them.'] },
    { if: { seasonFavFood: 'pie' }, text: ['Pie. Any pie. The crust is the point. The filling\'s just there to hold it up.'] },
    { if: { seasonFavFood: 'cheese' }, text: ['Cheese. A great crumbly lump of it, and an apple to make it respectable.'] },
    { if: { seasonFavFood: 'fish' }, text: ['Fish, fresh that morning. If it\'s been out of the river an hour it\'s old.'] },
    { if: { seasonFavFood: 'bread' }, text: ['Bread. Warm, with butter going in. You can keep your cakes.'] },
    { if: { seasonFavFood: 'apples' }, text: ['Apples. The first crisp one of autumn, straight off the tree.'] },
    { if: { seasonFavFood: 'eggs' }, text: ['Eggs. Boiled, with soldiers. I never grew out of it and I never will.'] },
    { if: { seasonFavFood: 'vegetables' }, text: ['Vegetables. Don\'t laugh. A good roast parsnip is better than any cake.'] },
    { if: { temper: 'shy' }, text: ['...{SeasonFavFood}. Don\'t tell anyone. They\'ll bring it to me and I\'ll have to say thank you.'] },
    { if: { temper: 'witty' }, text: ['{SeasonFavFood}, closely followed by more {seasonFavFood}.'] },
    { if: { temper: 'proud' }, text: ['{SeasonFavFood}, and mine is better than anyone\'s.'] },
    { if: { stage: 'child' }, text: ['{SeasonFavFood}! And candy. And {seasonFavFood} with candy on.'] },
  ]);
  lines('season.food.best', [
    { text: ['A pie at a wedding, years ago. Rabbit and something. I never found out what.', 'A slice of bread and dripping on a cold morning, after a long walk. Nothing ever beat it.'] },
    { if: { stage: 'elder' }, text: ['My mother\'s Yule pudding. Sixty years and I can still taste it.', 'A plate of mushrooms after the Long Winter. First fresh thing in months.'] },
    { if: { stage: 'child' }, text: ['A whole honey cake. On my own. On my birthday. Then I was sick. Best day ever.'] },
    { if: { temper: 'dreamy' }, text: ['Strawberries eaten in the rain, under the hedge, with someone I loved.'] },
    { if: { temper: 'ornery' }, text: ['My own cooking. Nobody else gets the salt right.'] },
    { if: { temper: 'witty' }, text: ['The cookie I found in an old coat. Three years old. Glorious.'] },
    { if: { temper: 'gloomy' }, text: ['Something I can\'t have again. That\'s always the best one, isn\'t it?'] },
    { if: { temper: 'proud' }, text: ['The pie that took first at the Harvest Feast. Mine. Obviously.'] },
    { if: { rift: true }, text: ['A boiled egg. Here. The first morning. I didn\'t know an egg could taste of anything.'] },
    { if: { spouse: (s) => !!s }, text: ['The supper {spouse} burned the night we were courting. I ate every bit and said it was lovely.'] },
  ]);
  lines('season.food.who', [
    { text: ['My grandmother. She\'d stand on a stool to reach the stove, and slap any hand near the pot.', 'An old neighbor. She\'s gone now. Nobody does it like her.'] },
    { if: { parent: (p) => !!p }, text: ['{Parent}. Every Highday. The smell of it came down the passage and woke me up.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse}, if I\'m honest. Don\'t tell my mother.'] },
    { if: { stage: 'child' }, text: ['Gran. She puts extra honey in when Mom\'s not looking.'] },
    { if: { stage: 'elder' }, text: ['My mother. I was small when I last had it. A lifetime ago. Less, it feels.'] },
    { if: { temper: 'proud' }, text: ['Me. ...Well. My father first. Then me. Better, if I\'m honest.'] },
    { if: { temper: 'gloomy' }, text: ['Someone who isn\'t here any more.'] },
    { if: { rift: true }, text: ['A noodle-seller in Neverdark. He\'d give me the burnt bits free. I never knew his name.'] },
  ]);
  lines('season.food.gone', [
    { text: ['...She\'d hum. The whole time. I can make the food but I can\'t make the humming.', '...I tried, once. It wasn\'t right. It\'s never right. Something\'s missing, and it\'s her.'] },
    { if: { stage: 'elder' }, text: ['...They\'re all gone, the ones who made things for me. I make them for others now.'] },
    { if: { temper: 'gloomy' }, text: ['...Sometimes I set out two plates. Still. After all this time.'] },
    { if: { temper: 'ornery' }, text: ['...She\'d have hated all this fuss. "Eat it while it\'s hot," she\'d say. And I didn\'t, always.'] },
    { if: { temper: 'dreamy' }, text: ['...When it\'s cooking, just for a minute, it\'s like she\'s in the next room.'] },
    { if: { temper: 'shy' }, text: ['...I miss being cooked for. That\'s all. That\'s silly.'] },
    { if: { rift: true }, text: ['...His stall\'s probably still there. Someone else on it. I hope they burn the noodles right.'] },
    { if: { lost: (l) => !!l }, pri: 1, text: ['...{Lost} used to make it. Every time I smell it I look round. Like they\'ll be there.'] },
  ]);
  lines('season.food.remembers', [
    { text: ['...It does, doesn\'t it. That\'s it exactly.', 'I\'d never thought of it like that. Thank you.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. ...Yes. All right. It does.'] },
    { if: { temper: 'gloomy' }, text: ['...Then I\'ll keep making it. So it remembers.'] },
    { if: { temper: 'dreamy' }, text: ['Food remembers people. I\'ll write that in the front of my recipe book.'] },
  ]);
  lines('season.food.honoured', [
    { text: ['...Then I will. Soon. And you\'ll tell me if it\'s right.', 'I\'d like that. I\'ll make it for you, and maybe it\'ll come right.'] },
    { if: { temper: 'shy' }, text: ['...Really? All right. I\'ll try. For you.'] },
    { if: { temper: 'proud' }, text: ['It will be right. I\'ll see to it.'] },
  ]);
  lines('season.food.make', [
    { text: ['Myself. Yes. I could try.', 'And think of them. ...I think I will. Highday.'] },
    { if: { temper: 'gloomy' }, text: ['...It won\'t be the same. But maybe that\'s all right.'] },
    { if: { temper: 'cheerful' }, text: ['I will! And I\'ll invite everyone and tell them all about her!'] },
    { if: { temper: 'ornery' }, text: ['Hmph. I\'d get it wrong. ...I\'ll try anyway.'] },
  ]);
  lines('season.food.taught', [
    { text: ['She tried. I was too busy eating to watch.', 'Bits of it. The rest I\'ve been guessing at for years.'] },
    { if: { temper: 'proud' }, text: ['Every step. I could do it blindfold. I very nearly have.'] },
    { if: { stage: 'child' }, text: ['I\'m too little. I\'m allowed to crack the eggs. Not all of them land in the bowl.'] },
  ]);
  lines('season.food.favour', [
    { text: ['Ha! You\'ve found my weak spot. Use it wisely.', 'Oh, you\'re a cunning one. It would work, mind.'] },
    { if: { temper: 'ornery' }, text: ['It\'ll take more than {seasonFavFood}. ...A lot of {seasonFavFood}, maybe.'] },
    { if: { stage: 'child' }, text: ['Bring me {seasonFavFood} and I\'ll do ANYTHING. Except bath.'] },
  ]);
  lines('season.food.wizfav', [
    { text: ['Mushrooms on toast! You\'re a hobbit in a wizard\'s hat.', 'After a long wet road. Yes. That\'s when food\'s best.'] },
    { if: { temper: 'cheerful' }, text: ['Then come round and I\'ll do you some! Wet road optional!'] },
    { if: { temper: 'curious' }, text: ['What do you cook on, on the road? Do you carry a pan? Where?'] },
    { if: { likes: 'mushrooms' }, pri: 1, text: ['Mushrooms! A wizard of taste. I knew there was something about you.'] },
  ]);
  lines('season.food.again', [
    { text: ['So do I. Every day, so do I.', 'It\'d never be as good. That\'s the trouble with the best things.'] },
    { if: { temper: 'cheerful' }, text: ['Me too! I\'ll put it on the list. The list is very long.'] },
  ]);
  lines('season.food.porridge', [
    { text: ['Your porridge? I\'ve heard about your porridge. The whole Shire\'s heard.', 'Ha! I\'ll not insult you by comparing.'] },
    { if: { temper: 'witty' }, text: ['Your porridge is a legend. So are trolls. Neither is a compliment.'] },
  ]);
  lines('season.food.breakfasts', [
    { text: ['Two. Proper ones. Then elevenses, which doesn\'t count.', 'Breakfast, second breakfast, and a small thing standing up, which isn\'t a breakfast.'] },
    { if: { season: 'winter' }, text: ['In winter? Three. You need it. It\'s cold.'] },
    { if: { season: 'summer' }, text: ['In summer, one, outside, very long. It goes on till elevenses.'] },
    { if: { temper: 'witty' }, text: ['As many as it takes to stop it being morning.'] },
    { if: { stage: 'child' }, text: ['I have breakfast at home and then I have breakfast at Gran\'s. Shh.'] },
    { if: { temper: 'proud' }, text: ['Two. Taken properly, at the table. I\'m not an animal.'] },
  ]);
  lines('season.food.standing', [
    { text: ['Ha! My standing\'s mostly sitting. At breakfast.', 'You\'re right. I\'ve been letting the family name down.'] },
    { if: { temper: 'proud' }, text: ['I could. I choose restraint. ...Mostly.'] },
  ]);
  lines('season.food.which', [
    { text: ['Second. The first is duty. The second is pleasure.', 'The first. Hot tea, everything quiet, nobody up yet.'] },
    { if: { temper: 'witty' }, text: ['The one I\'m having when someone asks me that.'] },
    { if: { stage: 'child' }, text: ['Gran\'s one! Because honey.'] },
  ]);

  // --- Their turn: taste this ---------------------------------------------------------------
  addThread({
    id: 'season.taste', theirs: true, cool: 4,
    label: 'They want you to taste something',
    ask: '{Name} is holding something out to you, wrapped in a cloth.',
    when: (F) => F.met && F.band !== 'toddler' && !F.pantryBare,
    beats: {
      start: { line: 'season.taste.q', go: [
        { ap: 'warm', say: '*You taste it.* Delicious. Truly.', label: 'Taste it, and say it\'s delicious', to: 'praise' },
        { ap: 'jest', say: '*You chew for a long time.* ...It\'s very... brave.', label: 'Taste it, and call it brave', to: 'brave' },
        { ap: 'tale', say: 'It reminds me of elvish waybread. One bite and you could walk all day.', to: 'waybread' },
      ] },
      praise: { line: 'season.taste.praise', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'What\'s in it?', to: 'whatin' },
        { ap: 'warm', say: 'I\'d carry a jar of it on the road, if you could spare one.', to: 'jar' },
      ] },
      whatin: { line: 'season.taste.whatin', end: true },
      jar: { line: 'season.taste.jar', fx: { fond: 0.02, remember: 'Gave the wizard something of mine for the road.', rv: 1 }, end: true },
      brave: { line: 'season.taste.brave', go: [
        { ap: 'warm', say: 'I jest. It\'s lovely. Truly.', to: 'mended' },
        { ap: 'share', say: 'Honestly? A touch less salt, and it\'d be the best in the valley.', to: 'honest' },
      ] },
      mended: { line: 'season.taste.mended', fx: { joke: { k: 'season.brave', t: 'The wizard called their cooking "brave".' } }, end: true },
      honest: { line: 'season.taste.honest', fx: { respect: 0.03 }, end: true },
      waybread: { line: 'season.taste.waybread', go: [
        { ap: 'tale', say: 'Lembas, they call it. Wrapped in leaves. The elves never give out the recipe.', to: 'lembas' },
        { ap: 'warm', say: 'Though yours has more butter. Much more. That\'s an improvement.', to: 'butter' },
      ] },
      lembas: { line: 'season.taste.lembas', fx: { fond: 0.02 }, end: true },
      butter: { line: 'season.taste.butter', fx: { fond: 0.02 }, end: true },
    },
  });
  lines('season.taste.q', [
    { text: ['Here. Taste this. Go on. Tell me honestly.', 'I\'ve been trying something. You\'re the first to taste it. Don\'t make a face.'] },
    { if: { season: 'autumn' }, text: ['First jar of this year\'s bramble-apple. Taste it. Is it set? Is it too sweet?'] },
    { if: { season: 'winter' }, text: ['A bit of my Yule cake. It\'s been soaking in cider since autumn. Mind, it\'s strong.'] },
    { if: { season: 'summer' }, text: ['Strawberry tart. Fresh this morning. Try it before the wasps find it.'] },
    { if: { season: 'spring' }, text: ['Rhubarb and honey. My own idea. Be kind. Be honest. Be kind.'] },
    { if: { temper: 'shy' }, text: ['...I made this. You don\'t have to. Only if you want. It\'s probably not good.'] },
    { if: { temper: 'proud' }, text: ['My pork pie. Prize-winning. Taste it and tell me it isn\'t the best you\'ve had.'] },
    { if: { temper: 'ornery' }, text: ['Eat this and tell me it\'s worse than the stuff at the Badger. Go on. I dare you.'] },
    { if: { temper: 'curious' }, text: ['Pickled mushrooms with a bit of mint. Is that clever or terrible? I genuinely can\'t tell.'] },
    { if: { temper: 'witty' }, text: ['An experiment. If you live, I\'ll serve it at the Harvest Feast.'] },
    { if: { stage: 'child' }, text: ['I made you a cake! It\'s mud. It\'s a mud cake. You don\'t have to eat it. Pretend!'] },
    { if: { rift: true }, text: ['I tried to make noodles from your flour. They\'re lumpy. Are noodles meant to be lumpy?'] },
    { if: { job: 'baker' }, pri: 1, text: ['New loaf. New flour from this year\'s barley. Taste it. Tell me it\'s not the best yet.'] },
    { if: { job: 'fisher' }, pri: 1, text: ['Smoked trout. Two days over oak. Taste it and tell me the elves do better.'] },
    { if: { job: 'brewer' }, pri: 1, text: ['A drop of the new ale. Not ready yet. Just tell me if it\'s going the right way.'] },
  ]);
  lines('season.taste.praise', [
    { text: ['Really? You\'re not just saying that? You are. You\'re not. Oh, I don\'t know!', 'Oh, thank goodness. I\'ve been worrying all morning.'] },
    { if: { temper: 'proud' }, text: ['Of course it is. But it\'s nice to have a wizard say it.'] },
    { if: { temper: 'shy' }, text: ['...Truly? Oh. Oh, that\'s... thank you.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. I knew it. Better than the Badger, you see.'] },
    { if: { temper: 'cheerful' }, text: ['Hooray! I\'m making a hundred more! Everyone\'s getting one!'] },
    { if: { temper: 'witty' }, text: ['Truly. Well. Wizards don\'t lie. Except about the weather.'] },
    { if: { stage: 'child' }, text: ['You ATE the mud? ...You pretended! You\'re good at pretending.'] },
  ]);
  lines('season.taste.whatin', [
    { text: ['Ah. That\'s between me and the pot.', 'Bits of everything, and a bit of love. That\'s the soppy answer.'] },
    { if: { temper: 'curious' }, text: ['Mint, honey, a pinch of salt and a thing I found in a hedge. I think it was a herb.'] },
    { if: { temper: 'proud' }, text: ['A family recipe. You\'d need to marry into the family.'] },
    { if: { stage: 'child' }, text: ['Mud. And a daisy. For flavor.'] },
  ]);
  lines('season.taste.jar', [
    { text: ['Spare one? Take two. Here. I\'ll wrap them.', 'For the road! A bit of Thistledown on the road. I like that.'] },
    { if: { temper: 'ornery' }, text: ['One. And bring the jar back. I count my jars.'] },
    { if: { temper: 'shy' }, text: ['...You\'d want it? On your travels? Oh. Yes. Please. Take it.'] },
  ]);
  lines('season.taste.brave', [
    { text: ['Brave? BRAVE? What\'s that supposed to mean?', 'Brave. Hmm. I\'ll take brave. I think.'] },
    { if: { temper: 'ornery' }, text: ['Brave. Brave! Give it back. You don\'t deserve it.'] },
    { if: { temper: 'witty' }, text: ['Brave! Ha! That\'s what the whole Badger said about my hat.'] },
    { if: { temper: 'shy' }, text: ['...Oh. Is it bad? It\'s bad. I knew it was bad.'] },
    { if: { temper: 'proud' }, text: ['I\'ll have you know that recipe is very well thought of.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! Is that a no? That\'s a no. Ha! Never mind.'] },
    { if: { stage: 'child' }, text: ['It IS brave. It\'s a mud cake. It\'s the bravest.'] },
  ]);
  lines('season.taste.mended', [
    { text: ['Hmph. You\'re forgiven. Barely.', 'Too late. I\'m calling it Brave now. Brave Pie.'] },
    { if: { temper: 'witty' }, text: ['I\'m naming it after you. Brave Wizard Tart.'] },
    { if: { temper: 'shy' }, text: ['...Oh, good. You gave me a fright.'] },
  ]);
  lines('season.taste.honest', [
    { text: ['...Less salt. You\'re right. I knew it. My hand slipped.', 'Hmph. ...Thank you. Nobody ever tells you the truth about food.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['Less salt. ...Fine. Fine! You\'re right. Don\'t look so pleased.'] },
    { if: { temper: 'curious' }, text: ['Less salt! I\'ll do another with half and another with none and see.'] },
  ]);
  lines('season.taste.waybread', [
    { text: ['Elvish? Mine? Ha! You flatterer. What\'s waybread?', 'Walk all day on one bite? Then I\'ve been eating too many bites.'] },
    { if: { temper: 'curious' }, text: ['Elves make bread? What\'s in it? Do they grow barley? Where?'] },
    { if: { stage: 'child' }, text: ['ELVES? Real elves? Is it magic bread? Is MINE magic?'] },
  ]);
  lines('season.taste.lembas', [
    { text: ['Never give it out! Just like the Badger\'s pie.', 'In leaves! I\'ll try wrapping mine in leaves. See if it helps.'] },
    { if: { temper: 'dreamy' }, text: ['Bread wrapped in leaves, walking all day. I\'d love to try it, just once.'] },
    { if: { temper: 'witty' }, text: ['Elves keep their recipes and we keep our pantries. Fair trade.'] },
  ]);
  lines('season.taste.butter', [
    { text: ['More butter! Of course more butter. We\'re not elves.', 'Ha! That\'s the hobbit improvement. Everything, plus butter.'] },
    { if: { temper: 'proud' }, text: ['Better than the elves. I\'ll take that. I\'ll take that all day.'] },
  ]);

  // --- The long tables -----------------------------------------------------------------------
  addThread({
    id: 'season.tables', cool: 1, weight: 1.2, label: 'The long tables',
    when: (F) => !!(F.feastOn || F.tablesToday || F.tablesSoon),
    rel: (F) => (F.feastOn ? 2 : F.tablesToday ? 1.7 : 1.2),
    open: { ask: 'season.tables.open' },
    beats: {
      start: { line: 'season.tables.start', go: [
        { ap: 'ask', say: 'And who will you sit by?', to: 'seat' },
        { ap: 'ask', say: 'And who\'s to give the toast?', to: 'toast' },
        { ap: 'jest', say: 'I\'m told the trick is to wear trousers a size too big.', to: 'trousers' },
      ] },
      seat: { line: 'season.tables.seat', go: [
        { ap: 'jest', say: 'Shall I swap the place-cards? I\'m very sly.', to: 'cards' },
        { ap: 'ask', say: 'And who would you rather not?', to: 'notby', need: { open: 1 }, soft: true },
      ] },
      cards: { line: 'season.tables.cards', fx: { joke: { k: 'season.cards', t: 'The wizard offered to swap the place-cards at the long tables.' }, fond: 0.02 }, end: true },
      notby: { line: 'season.tables.notby', fx: { trust: 0.03 }, go: [
        { ap: 'warm', say: 'I\'ll sit between you, if it comes to it. I\'m very wide in this robe.', to: 'between' },
        { ap: 'advise', say: 'Pass them the gravy first. It\'s hard to stay cross over gravy.', to: 'gravy' },
      ] },
      between: { line: 'season.tables.between', fx: { fond: 0.03 }, end: true },
      gravy: { line: 'season.tables.gravy', fx: { respect: 0.03 }, end: true },
      toast: { line: 'season.tables.toast', go: [
        { ap: 'ask', say: 'And if it were you? What would your toast be?', to: 'theirtoast' },
        { ap: 'share', say: 'I\'ve a toast of my own in me, if they\'ll let a wizard stand.', to: 'wiztoast' },
      ] },
      theirtoast: { line: 'season.tables.theirtoast', fx: { remember: 'Told the wizard the toast I\'d give at the long tables.', rv: 1 }, end: true },
      wiztoast: { line: 'season.tables.wiztoast', go: [
        { ap: 'tale', say: 'To the hobbits of Thistledown: may your pantries never be bare, and your doors never shut.', to: 'raise' },
        { ap: 'jest', say: 'To pudding. That\'s all. Sit down.', to: 'pudding' },
      ] },
      raise: { line: 'season.tables.raise', fx: { fond: 0.03, respect: 0.02 }, end: true },
      pudding: { line: 'season.tables.pudding', fx: { fond: 0.02, joke: { k: 'season.toast', t: 'The wizard\'s toast: "To pudding. That\'s all. Sit down."' } }, end: true },
      trousers: { line: 'season.tables.trousers', go: [
        { ap: 'ask', say: 'Which course are you saving room for?', to: 'course' },
        { ap: 'jest', say: 'Or a belt with a great many holes.', to: 'belt' },
      ] },
      belt: { line: 'season.tables.belt', end: true },
      course: { line: 'season.tables.course', go: [
        { ap: 'warm', say: 'A wise plan. I\'ll do the same.', to: 'end' },
        { ap: 'ask', say: 'And what\'s the pudding, do you think?', to: 'puddingkind' },
      ] },
      puddingkind: { line: 'season.tables.puddingkind', end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.tables.open', [
    { text: ['The long tables, {name}! Are you ready for them?', 'There\'s a dinner at the long tables, {name}. Hungry?'] },
    { if: { tablesSoon: true }, text: ['The tables go out for {nextFestWord} soon, {name}. Saving yourself?'] },
    { if: { feastOn: true }, text: ['Are you eating, {name}? You\'ve stopped. Is something wrong?', 'How\'s the dinner, {name}? Room for more?'] },
  ]);
  lines('season.tables.start', [
    { text: ['White cloths all down the field, and every dish in the valley on them. I\'ve been dreaming of it.', 'Soup, then the main course, then pudding, then the toast. I\'ve been in training since breakfast.'] },
    { if: { feastOn: true }, text: ['Isn\'t it wonderful? I\'ve undone a button. Two. Don\'t look.', 'Pass the gravy! No, not you. Him. Oh, you have, thank you.'] },
    { if: { occasion: 'harvest' }, text: ['The Harvest Feast! Pies, stews, cider, and everyone who brought it in, all at one table.'] },
    { if: { occasion: 'founding' }, text: ['Founders\' Day! A long lunch and a toast to the first holes. My kind of history.'] },
    { if: { occasion: 'wedding' }, text: ['A wedding feast! I cried in the soup already. It\'s very good soup.'] },
    { if: { occasion: 'twohearths' }, text: ['Two Hearths. Hill-folk and rift-folk at one table. Mind, the rift-folk put sauce on everything.'] },
    { if: { occasion: 'feast' }, text: ['The Steward\'s feast! Free food and somebody else washing up. Heaven.'] },
    { if: { temper: 'ornery' }, text: ['Long tables. Long speeches. Long line for the pie. I\'ll be there, mind.'] },
    { if: { temper: 'cheerful' }, text: ['I love the long tables! Everyone, all together, all eating! What\'s better?'] },
    { if: { temper: 'shy' }, text: ['...I sit at the very end. You can see everyone from there. Nobody looks at you.'] },
    { if: { temper: 'dreamy' }, text: ['I love when the lanterns come on over the tables. All the faces go gold.'] },
    { if: { temper: 'witty' }, text: ['A long table is just a short table that\'s been fed well.'] },
    { if: { temper: 'proud' }, text: ['My pie\'s on the third table. Third from the head. That\'s a good spot, you know.'] },
    { if: { temper: 'gloomy' }, text: ['Somebody always sits in the gravy. Somebody always cries. It\'s lovely, really.'] },
    { if: { temper: 'curious' }, text: ['How many plates is it? I tried to count last time. I got to ninety and then the pudding came.'] },
    { if: { stage: 'child' }, text: ['I\'m allowed to sit at the BIG table this year! Not the little one with the babies!'] },
    { if: { stage: 'elder' }, text: ['I\'ve sat at the long tables since they were short tables. There were eleven of us, once.'] },
    { if: { rift: true }, text: ['Everyone eats together? The same food? At once? In Neverdark you ate standing at a counter, alone.'] },
    { if: { job: 'innkeeper' }, text: ['Half the ale on those tables came out of my cellar. I\'ll be counting the empties.'] },
    { if: { job: 'baker' }, text: ['Forty loaves and twelve pies. I\'ve been up since three. Don\'t let me sit down or I\'ll sleep.'] },
  ]);
  lines('season.tables.seat', [
    { text: ['Wherever I land. That\'s half the fun of it.', 'By the pie, ideally. Folk move, but pies stay put.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse}, of course. Though {spouse} steals my crackling. Every year.'] },
    { if: { friend: (f) => !!f }, text: ['{Friend}. We sit together every year and talk through every toast.'] },
    { if: { kid: (k) => !!k }, text: ['Next to {kid}, to stop the pudding going on the floor. Or on {kid}.'] },
    { if: { temper: 'shy' }, text: ['...The end, by the hedge. Next to whoever\'s quietest.'] },
    { if: { temper: 'proud' }, text: ['Near the head, naturally. Somebody has to set the tone.'] },
    { if: { temper: 'ornery' }, text: ['As far from the fiddler as I can get.'] },
    { if: { stage: 'child' }, text: ['Next to YOU! Can I? Please? I\'ll be good. Mostly.'] },
  ]);
  lines('season.tables.cards', [
    { text: ['Would you? Ha! The Steward would have kittens.', 'Don\'t you dare. ...Can you put me by the pie?'] },
    { if: { temper: 'witty' }, text: ['Sly! Put {rival} next to the fiddler. Let them suffer.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! Mix everyone up! Make new friends! I love it!'] },
    { if: { temper: 'ornery' }, text: ['Touch the cards and I\'ll sit on your hat.'] },
  ]);
  lines('season.tables.notby', [
    { text: ['...Somebody who always tells the story about my wedding. The bad version.', '...There\'s a hobbit who talks with his mouth full. Full of my pie.'] },
    { if: { rival: (r) => !!r }, pri: 1, text: ['{Rival}. Every year they\'re put opposite me. Every year we talk about pumpkins. It\'s war.'] },
    { if: { temper: 'shy' }, text: ['...Anyone loud. They put me next to a loud one last time. I didn\'t say a word all night.'] },
    { if: { temper: 'gloomy' }, text: ['Anyone who wants me to be cheerful. Which is everyone, at a feast.'] },
    { if: { stage: 'child' }, text: ['My cousin. He spits the peas. On purpose.'] },
  ]);
  lines('season.tables.between', [
    { text: ['Ha! A wizard wall. Would you? I\'d feel safer.', 'You would, too. You\'re the widest thing at any table.'] },
    { if: { temper: 'witty' }, text: ['Between us! They\'d have to shout over your hat. Lovely.'] },
    { if: { temper: 'shy' }, text: ['...Would you really? Thank you.'] },
  ]);
  lines('season.tables.gravy', [
    { text: ['Gravy first. Ha. That\'s wisdom, that is.', 'Hard to stay cross over gravy. True. I\'ve tried.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['Pass the gravy? To them? ...Fine. But not the good jug.'] },
  ]);
  lines('season.tables.toast', [
    { text: ['The eldest at the table, as is proper. And they always go on too long.', 'Whoever the Steward points at. Usually the one who\'s had the most cider.'] },
    { if: { occasion: 'harvest' }, text: ['Somebody stands and raises a mug: to the harvest, and every hand that brought it in.'] },
    { if: { occasion: 'founding' }, text: ['The eldest, to the folk who dug the first holes. Everyone cries. Even the founders\' grandchildren.'] },
    { if: { occasion: 'wedding' }, text: ['The eldest of the family. There\'s always a bit about the pantry never being bare.'] },
    { if: { stage: 'elder' }, text: ['It might be me. I\'m the eldest at our end. I\'ve been practicing in the mirror.'] },
    { if: { temper: 'ornery' }, text: ['Whoever it is, they\'ll take too long and the pudding will go cold.'] },
    { if: { temper: 'witty' }, text: ['The one who\'s hardest to stop. It\'s a sort of contest.'] },
  ]);
  lines('season.tables.theirtoast', [
    { text: ['To full bellies and short speeches. Then I\'d sit down. Quick.', 'To the ones who aren\'t at the table this year. Then something cheerful, quick.'] },
    { if: { temper: 'cheerful' }, text: ['To all of us! Every one! And to pudding! And to you!'] },
    { if: { temper: 'dreamy' }, text: ['To the valley, that feeds us, and the river, that minds us.'] },
    { if: { temper: 'proud' }, text: ['To Thistledown: the finest village in the Shire, and I\'ll fight anyone who says not.'] },
    { if: { temper: 'shy' }, text: ['...I\'d just say thank you. And sit down. Very fast.'] },
    { if: { temper: 'witty' }, text: ['To the cooks, who did everything, and the rest of us, who\'ll take the credit.'] },
    { if: { temper: 'gloomy' }, text: ['To next year. May it be no worse.'] },
    { if: { temper: 'ornery' }, text: ['To sitting down. That\'s my whole toast. Sit down, everybody.'] },
    { if: { stage: 'child' }, text: ['To PUDDING. And to my dog. And to pudding again.'] },
    { if: { rift: true }, text: ['To the people who made room. For all of us. At the table.'] },
  ]);
  lines('season.tables.wiztoast', [
    { text: ['A wizard\'s toast! Go on, then. Let\'s hear it.', 'You? Stand up at the long tables? Oh, they\'d love that.'] },
    { if: { temper: 'ornery' }, text: ['Keep it short. The pudding\'s waiting.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, do! Practice on me! I\'ll clap!'] },
    { if: { stage: 'child' }, text: ['Will there be a firework in it? Toasts are better with fireworks.'] },
  ]);
  lines('season.tables.raise', [
    { text: ['...Doors never shut. Oh. That\'s lovely. Say that one. Say it exactly like that.', '*raises an imaginary mug* Hear, hear!'] },
    { if: { temper: 'ornery' }, text: ['Hmph. ...That\'s a good toast. Don\'t make it longer.'] },
    { if: { temper: 'gloomy' }, text: ['...That\'s made me a bit misty. Don\'t say it at the table or I\'ll go.'] },
    { if: { rift: true }, text: ['Doors never shut. ...Yeah. Say that. Some of us need to hear it.'] },
  ]);
  lines('season.tables.pudding', [
    { text: ['Ha! The best toast ever given. They\'d carry you round the field.', 'To pudding! I\'d stand for that. Then sit, quick.'] },
    { if: { temper: 'witty' }, text: ['Short, sweet and about dessert. You\'re wasted on wizardry.'] },
    { if: { stage: 'child' }, text: ['TO PUDDING! *bangs the table*'] },
  ]);
  lines('season.tables.trousers', [
    { text: ['Ha! I\'ve a pair for just that. Feast trousers. Very roomy.', 'Too big? Mine are already too small. That\'s the opposite of the trick.'] },
    { if: { temper: 'witty' }, text: ['I wear my second-best waistcoat. It\'s built for expansion.'] },
    { if: { temper: 'ornery' }, text: ['My trousers are none of your business, wizard.'] },
    { if: { stage: 'child' }, text: ['I\'m wearing Dad\'s old ones! They\'re HUGE. I could fit a pie down them.'] },
  ]);
  lines('season.tables.belt', [
    { text: ['I add a hole every year. The belt\'s more hole than belt now.', 'Ha! My belt gives up before I do.'] },
    { if: { temper: 'witty' }, text: ['A belt\'s just a promise you make before dinner and break after.'] },
  ]);
  lines('season.tables.course', [
    { text: ['Pudding. You go light on the main course and heavy on the pudding. Every hobbit knows.', 'All of them. That\'s the challenge. That\'s the glory.'] },
    { if: { seasonFavFood: 'pie' }, pri: 1, text: ['The main course. The pie. I don\'t care what comes after the pie.'] },
    { if: { temper: 'shy' }, text: ['...The soup. I always fill up on soup. Then I sit and watch.'] },
    { if: { stage: 'child' }, text: ['I\'m going to skip the soup and the main course and go STRAIGHT to pudding.'] },
  ]);
  lines('season.tables.puddingkind', [
    { text: ['Seed-cake and cream, if there\'s any justice.', 'Honey cake. There\'s always somebody makes a honey cake.'] },
    { if: { season: 'autumn' }, text: ['Apple pie with cream. Twelve of them, all down the table.'] },
    { if: { season: 'winter' }, text: ['Yule pudding, with a silver penny in it somewhere. Chew carefully.'] },
    { if: { season: 'summer' }, text: ['Strawberries and cream. Bowls of them. The wasps come too.'] },
    { if: { stage: 'child' }, text: ['ALL of them. One of each. Then another one of each.'] },
  ]);

  // --- Trewsday market ------------------------------------------------------------------------
  addThread({
    id: 'season.market', cool: 3, weight: 1, label: 'Market day',
    when: (F) => !!F.marketDay && F.band !== 'toddler',
    rel: (F) => (F.hour === 'morning' ? 1.5 : 1.1),
    open: { ask: 'season.market.open' },
    beats: {
      start: { line: 'season.market.start', go: [
        { ap: 'ask', say: 'And what did you come away with?', to: 'bought' },
        { ap: 'jest', say: 'Did you haggle? You have the look of a haggler.', to: 'haggle' },
        { ap: 'ask', say: 'And what\'s the talk at the stalls?', to: 'gossip' },
      ] },
      bought: { line: 'season.market.bought', go: [
        { ap: 'ask', say: 'And what\'s it for?', to: 'forwhat' },
        { ap: 'warm', say: 'A good morning\'s work.', to: 'end' },
      ] },
      forwhat: { line: 'season.market.forwhat', fx: { fond: 0.01 }, end: true },
      haggle: { line: 'season.market.haggle', go: [
        { ap: 'jest', say: 'Teach me. I paid three pennies for a turnip once. In Bree.', to: 'turnip' },
        { ap: 'warm', say: 'Then the stallholders had better watch out.', to: 'end' },
      ] },
      turnip: { line: 'season.market.turnip', fx: { joke: { k: 'season.turnip', t: 'The wizard once paid three pennies for a turnip in Bree.' } }, end: true },
      gossip: { line: 'season.market.gossip', go: [
        { ap: 'jest', say: 'Scandalous. Tell me more.', to: 'more' },
        { ap: 'warm', say: 'Market talk\'s half the reason to go.', to: 'end' },
      ] },
      more: { line: 'season.market.more', end: true },
    },
    end: { fond: 0.01 },
  });
  lines('season.market.open', [
    { text: ['Trewsday, {name}! Been to the market yet?', 'Market day, {name}. What\'s good at the stalls?'] },
    { if: { stage: 'child' }, text: ['Did you go to the market, {name}? Did anyone buy you anything?'] },
  ]);
  lines('season.market.start', [
    { text: ['Heaving! You can\'t move for baskets.', 'Oh, the usual. Too many people and not enough cheese.'] },
    { if: { season: 'spring' }, text: ['New eggs, early greens and seedlings in pots. And the lamb pies.'] },
    { if: { season: 'summer' }, text: ['Strawberries everywhere, and honey, and the first new potatoes.'] },
    { if: { season: 'autumn' }, text: ['Apples by the cartload, mushrooms by the basket, and somebody selling conkers to children.'] },
    { if: { season: 'winter' }, text: ['Thin pickings, but there\'s hot chestnuts and mulled cider by the well.'] },
    { if: { temper: 'ornery' }, text: ['Prices! I nearly fainted. Half a penny for an egg. Half a penny!'] },
    { if: { temper: 'cheerful' }, text: ['I love Trewsday! Everybody\'s out! I said hello to fifty people!'] },
    { if: { temper: 'shy' }, text: ['...Busy. I went early, before the crowds. Got my bread and fled.'] },
    { if: { temper: 'dreamy' }, text: ['I like the noise of it. Everyone calling out. Like birds in a hedge.'] },
    { if: { temper: 'witty' }, text: ['Market day: where everybody buys what everybody grew and pretends it\'s exciting.'] },
    { if: { temper: 'proud' }, text: ['My stall sold out by ten. Again. Not that I\'m counting.'] },
    { if: { temper: 'gloomy' }, text: ['Crowds. Elbows. Someone trod on my foot. Twice.'] },
    { if: { temper: 'curious' }, text: ['The Bree carter had something called a lemon. It\'s yellow and it hates you.'] },
    { if: { stage: 'child' }, text: ['There\'s a man with CANDY. On a STICK. I didn\'t have a penny.'] },
    { if: { stage: 'elder' }, text: ['Same stalls as fifty years ago. Different faces behind them. Same cheese, I swear.'] },
    { if: { rift: true }, text: ['No screens, no prices on lights. You just ask. And they tell you. And then you argue. I love it.'] },
  ]);
  lines('season.market.bought', [
    { text: ['A cheese, a bit of ribbon and a thing I don\'t need. Same as always.', 'Eggs. And a pie for the walk home. The pie didn\'t make it home.'] },
    { if: { pantryBare: true }, pri: 1, text: ['Everything I could carry. The pantry was down to crumbs.'] },
    { if: { temper: 'proud' }, text: ['The best cheese on the market. I got there before anyone.'] },
    { if: { temper: 'witty' }, text: ['A turnip. I don\'t like turnips. It looked lonely.'] },
    { if: { stage: 'child' }, text: ['Nothing. Mom bought me a turnip to carry. A TURNIP.'] },
    { if: { pastime: 'knitting' }, pri: 1, text: ['Wool! Three skeins. Somebody\'s getting a scarf. Possibly everybody.'] },
  ]);
  lines('season.market.forwhat', [
    { text: ['For supper. And the supper after. And a bit for the step, for the hedgehog.', 'I don\'t know yet. It\'ll come to me.'] },
    { if: { spouse: (s) => !!s }, text: ['For {spouse}. It\'s a surprise. Don\'t you dare tell.'] },
    { if: { temper: 'witty' }, text: ['For having. Not everything needs a use.'] },
  ]);
  lines('season.market.haggle', [
    { text: ['Haggle? I\'m a hobbit. I haggled for my own name.', 'I got a penny off the cheese. A whole penny! I\'m still glowing.'] },
    { if: { temper: 'shy' }, text: ['...No. I paid what they said. I always do.'] },
    { if: { temper: 'proud' }, text: ['I never haggle. I simply look at them until the price comes down.'] },
    { if: { temper: 'ornery' }, text: ['I don\'t haggle. I tell them the right price and wait.'] },
    { if: { temper: 'cheerful' }, text: ['I try! But they\'re so nice and I end up paying extra.'] },
  ]);
  lines('season.market.turnip', [
    { text: ['THREE PENNIES? For one turnip? Oh, wizard. Oh, no.', 'Ha! They saw you coming. They saw your hat from the next hill.'] },
    { if: { temper: 'ornery' }, text: ['Three pennies. I\'ve a mind to send you to market with a minder.'] },
    { if: { stage: 'child' }, text: ['Was it a MAGIC turnip? It must have been a magic turnip.'] },
  ]);
  lines('season.market.gossip', [
    { text: ['Who\'s courting who, whose pig got out, and whose cheese is a disgrace.', 'Prices, weather, and somebody\'s cousin. The usual.'] },
    { if: { nextFestWord: (x) => !!x }, text: ['Everyone\'s talking about {nextFestWord}. Who\'s cooking what, and who\'s sitting where.'] },
    { if: { hazard: (h) => !!h }, text: ['The {hazardWord}. Nothing else. Everyone\'s an expert.'] },
    { if: { temper: 'witty' }, text: ['That I\'m a terrible gossip. Which is gossip. So it\'s all true.'] },
  ]);
  lines('season.market.more', [
    { text: ['That\'s all I heard! Go yourself next Trewsday. Stand by the cheese.', 'More? I\'d have to make it up. ...Shall I?'] },
    { if: { temper: 'witty' }, text: ['The rest is in confidence. Which means I\'ll tell you at the Badger.'] },
  ]);

  // --- Passing the time: food ---------------------------------------------------------------
  addThread({
    id: 'season.food.pass', light: true, ap: 'jest', label: 'Pass the time about food', open: { jest: 'season.food.pass.open' },
    beats: {
      start: { line: 'season.food.pass.reply', go: [
        { ap: 'ask', say: 'And what\'s for supper, then?', to: 'supper' },
        { ap: 'jest', say: 'I\'ll take that as an invitation.', to: 'invite' },
      ] },
      supper: { line: 'season.food.pass.supper', end: true },
      invite: { line: 'season.food.pass.invite', fx: { fond: 0.01 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('season.food.pass.open', [
    { text: ['Something smells good round here, {name}. Is it you?', 'You\'ve flour on your nose, {name}. Or is that a new fashion?', 'I followed my nose down the lane, {name}, and it stopped at you.'] },
    { if: { season: 'autumn' }, text: ['Your fingers are purple, {name}. Brambles, or a crime?'] },
    { if: { stage: 'child' }, text: ['Is that jam on your chin, {name}, or are you blushing?'] },
  ]);
  lines('season.food.pass.reply', [
    { text: ['Ha! It\'s the oven. Something\'s in. I forget what.', 'Busted. I\'ve been baking. Or eating. Both.'] },
    { if: { temper: 'ornery' }, text: ['Mind your nose and I\'ll mind my oven.'] },
    { if: { temper: 'shy' }, text: ['...Oh! *wipes face* Is it gone?'] },
    { if: { temper: 'witty' }, text: ['A new fashion. All the best hobbits are wearing flour this year.'] },
    { if: { stage: 'child' }, text: ['It\'s jam. I wasn\'t eating it. I was guarding it.'] },
  ]);
  lines('season.food.pass.supper', [
    { text: ['Whatever\'s left after second supper. Ha.', 'Stew. Same as yesterday. Better than yesterday, stew always is.'] },
    { if: { seasonFavFood: (f) => !!f }, text: ['{SeasonFavFood}, if I\'ve any say. And I have.'] },
    { if: { stage: 'child' }, text: ['Greens. I\'m going to hide them in my pocket.'] },
  ]);
  lines('season.food.pass.invite', [
    { text: ['Ha! Bring your own spoon. Wizards have long arms.', 'Cheek! ...Come at seven. Don\'t be late. Don\'t be early.'] },
    { if: { temper: 'ornery' }, text: ['It wasn\'t one. ...Seven o\'clock. Wipe your boots.'] },
    { if: { temper: 'cheerful' }, text: ['It is! Come! I\'ll do extra!'] },
  ]);
  // --- More ways of saying it (each rule adds to the key above) ------------------------------
  lines('season.larder.what', [
    { if: { season: 'winter' }, text: ['Whatever\'s left. Today it\'s pickled onions and a heroic amount of hope.'] },
    { if: { temper: 'cheerful', season: 'autumn' }, text: ['Jam with ribbons, pickles with bows, and fish in a nice clean cloth. It\'s a party up there.'] },
    { if: { job: 'herder' }, text: ['A ham, a cheese and a crock of dripping. Herders put by from the beasts, not the hedges.'] },
    { if: { job: 'farmer' }, text: ['Onions in strings, beans in salt, and a sack of potatoes I\'m not allowed to count.'] },
    { if: { pastime: 'pottery' }, text: ['All in pots I threw myself. Wonky pots, but they hold jam.'] },
  ]);
  lines('season.larder.proud', [
    { if: { temper: 'cheerful' }, text: ['Isn\'t it? I want to throw a party for it. A larder-warming.'] },
    { if: { temper: 'dreamy' }, text: ['When the sun comes in the window it lights up every jar. Like a row of lanterns.'] },
    { if: { temper: 'gloomy' }, text: ['It is. Now I worry someone will knock it over.'] },
    { if: { stage: 'elder' }, text: ['Sixty years of practice. It ought to be by now.'] },
  ]);
  lines('season.larder.worry', [
    { if: { temper: 'dreamy' }, text: ['I keep thinking the jars will just appear, like dew. They never do.'] },
    { if: { temper: 'witty' }, text: ['Time I have plenty of. It\'s jam I\'m short of. Can you magic jam?'] },
    { if: { temper: 'curious' }, text: ['How much does a winter actually need? Has anyone ever worked it out? Per hobbit?'] },
    { if: { stage: 'elder' }, text: ['At my age you know what a bare shelf means. I\'ve seen it before.'] },
    { if: { rift: true }, text: ['I didn\'t know you had to do this. Nobody told me winter was a thing you prepare for.'] },
  ]);
  lines('season.larder.honey', [
    { if: { temper: 'ornery' }, text: ['Honey in a pack. It\'ll be all over your maps.'] },
    { if: { temper: 'proud' }, text: ['Only one jar? I keep three in my coat, and I\'m not even a wizard.'] },
    { if: { temper: 'dreamy' }, text: ['A jar of honey on a long road. Like carrying a bit of summer in your pocket.'] },
    { if: { temper: 'curious' }, text: ['Does honey ever go off? I\'ve heard it lasts a thousand years. Is that true?'] },
  ]);
  lines('season.larder.store', [
    { if: { temper: 'shy' }, text: ['...I\'ll go. When nobody\'s looking. Thank you.'] },
    { if: { temper: 'gloomy' }, text: ['If there\'s anything in it. There\'s never as much as you\'d hope.'] },
    { if: { temper: 'witty' }, text: ['The Common Store. Where the jam goes to be shared, and argued over.'] },
  ]);
  lines('season.larder.advised', [
    { if: { temper: 'cheerful' }, text: ['Snug by Yule! I\'ll put that on the larder door!'] },
    { if: { temper: 'gloomy' }, text: ['If the apples hold out. If the jars don\'t crack. If.'] },
    { if: { temper: 'witty' }, text: ['A few a day. That\'s what I said about cookies, and look how that went.'] },
  ]);
  lines('season.harvest.dolly', [
    { if: { temper: 'witty' }, text: ['Whoever lost the bet. It\'s always the one who said "how hard can it be".'] },
    { if: { temper: 'dreamy' }, text: ['Nobody knows. She\'s always just there, the morning after. I like to think the field makes her.'] },
    { if: { stage: 'elder' }, text: ['I did, for thirty years. Now my granddaughter does. Badly. I don\'t say so.'] },
  ]);
  lines('season.harvest.hands', [
    { if: { temper: 'cheerful' }, text: ['Aw! Everybody\'s hands. Mine are just the ones with the most blisters.'] },
    { if: { temper: 'gloomy' }, text: ['...It\'s good to hear. Some days you wonder if anyone notices.'] },
    { if: { temper: 'ornery' }, text: ['Tell that to the ones who sat under the hedge all afternoon.'] },
    { if: { stage: 'child' }, text: ['My hands helped! Look, I\'ve got a blister! It\'s a harvest blister!'] },
  ]);
  lines('season.harvest.rest', [
    { if: { temper: 'shy' }, text: ['...A nap at noon. I\'d like that. If nobody sees.'] },
    { if: { temper: 'witty' }, text: ['Rest at noon. Wizards really do know everything.'] },
    { if: { stage: 'elder' }, text: ['I\'ll rest. The young ones can manage an hour without me shouting.'] },
  ]);
  lines('season.harvest.south', [
    { if: { temper: 'curious' }, text: ['Would I! What do they eat? How do they talk? Is the barley different?'] },
    { if: { temper: 'ornery' }, text: ['What for? Grapes and heat and foreigners. I\'ve got apples.'] },
    { if: { stage: 'child' }, text: ['YES. Take me in the wagon. I\'ll be quiet. I won\'t be quiet.'] },
  ]);
  lines('season.garden.show', [
    { if: { temper: 'ornery' }, text: ['Mind where you put your feet. And your staff. And your hat.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, do come! I\'ll make tea and we\'ll sit on the bench and admire it!'] },
    { if: { temper: 'dreamy' }, text: ['Come when the moths are out. The night-scented stock is the best of it.'] },
  ]);
  lines('season.garden.beans', [
    { if: { temper: 'witty' }, text: ['Beans are the vegetable equivalent of minding your own business. I like it.'] },
    { if: { temper: 'cheerful' }, text: ['Beans! Up the canes and over the gate! I love it!'] },
  ]);
  lines('season.garden.tip', [
    { if: { season: 'summer' }, text: ['Water at dusk, not noon. The sun drinks it before the roots do.'] },
    { if: { season: 'winter' }, text: ['Straw over the beds and a board on the straw. The worms keep working underneath.'] },
  ]);
  lines('season.garden.share', [
    { if: { temper: 'cheerful' }, text: ['You\'re right! I\'ll leave the slugs a lettuce. Just one. Their own.'] },
    { if: { temper: 'witty' }, text: ['The slugs thank you. They\'ve asked if you\'ll put it in writing.'] },
    { if: { stage: 'child' }, text: ['Even the rabbits? Then can I keep one?'] },
  ]);
  lines('season.food.again', [
    { if: { temper: 'ornery' }, text: ['Soon. Hmph. Nobody makes it now. That\'s the trouble.'] },
    { if: { temper: 'dreamy' }, text: ['Maybe it\'s better as a memory. Some things are.'] },
    { if: { stage: 'child' }, text: ['Me too! Tomorrow! Can it be tomorrow?'] },
  ]);
  lines('season.food.taught', [
    { if: { temper: 'gloomy' }, text: ['She meant to. Then she didn\'t have time. There\'s never time.'] },
    { if: { temper: 'dreamy' }, text: ['She taught me by letting me watch. I think I learned more about her than the dish.'] },
    { if: { rift: true }, text: ['Teach me? He\'d just shout the order at the machine. I never saw the recipe. Maybe there wasn\'t one.'] },
  ]);
  lines('season.food.which', [
    { if: { temper: 'ornery' }, text: ['The one nobody interrupts. So the first, at five, before the world wakes.'] },
    { if: { temper: 'dreamy' }, text: ['Second breakfast, on the step, watching the mist come off the river.'] },
    { if: { temper: 'cheerful' }, text: ['Whichever has the most people at it!'] },
  ]);
  lines('season.food.favour', [
    { if: { temper: 'witty' }, text: ['Use it sparingly. I\'m cheap, but I\'m not that cheap. Actually, I am.'] },
    { if: { temper: 'shy' }, text: ['...You\'d not need {seasonFavFood}. You could just ask.'] },
  ]);
  lines('season.taste.whatin', [
    { if: { temper: 'witty' }, text: ['If I told you, you\'d have to marry me. Or at least do the washing up.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, everything! Honey, butter, a bit of this, a bit of that, and a song!'] },
    { if: { temper: 'shy' }, text: ['...Just apples. And a bit of cinnamon. Is that all right?'] },
  ]);
  lines('season.taste.jar', [
    { if: { temper: 'cheerful' }, text: ['A jar? Take a basket! Take the whole shelf! You\'ll be the best-fed wizard on the road!'] },
    { if: { temper: 'proud' }, text: ['Show it to the elves. See what they make of real cooking.'] },
    { if: { stage: 'child' }, text: ['Take the mud cake! For the ROAD!'] },
  ]);
  lines('season.taste.honest', [
    { if: { temper: 'cheerful' }, text: ['Less salt! Right! Thank you! You\'re the only one who\'d say!'] },
    { if: { temper: 'shy' }, text: ['...Thank you for telling me. Truly. Everyone else just says "lovely".'] },
    { if: { stage: 'child' }, text: ['Less MUD. Got it.'] },
  ]);
  lines('season.taste.lembas', [
    { if: { stage: 'child' }, text: ['I\'m going to wrap my sandwich in a leaf. Then I can walk all day!'] },
    { if: { temper: 'ornery' }, text: ['Bread in leaves. Typical elves. What\'s wrong with a tin?'] },
    { if: { temper: 'curious' }, text: ['Which leaves? Do they matter? I\'ll try dock. No, not dock. Something nicer.'] },
  ]);
  lines('season.tables.seat', [
    { if: { temper: 'witty' }, text: ['Next to whoever brings the best pudding. I do my research.'] },
    { if: { temper: 'cheerful' }, text: ['Somewhere new! I like to meet folk at the tables. I made three friends last time.'] },
    { if: { temper: 'dreamy' }, text: ['Where I can see the lanterns come on. The far end, by the willow.'] },
    { if: { rift: true }, text: ['With the other rift-folk, at first. Then someone always waves us down the table. I like that.'] },
  ]);
  lines('season.tables.toast', [
    { if: { temper: 'cheerful' }, text: ['Somebody lovely, and they\'ll cry, and then we\'ll all cry, and it\'ll be wonderful.'] },
    { if: { temper: 'dreamy' }, text: ['Whoever it is, it\'s the moment everyone\'s quiet at once. I love that moment.'] },
    { if: { occasion: 'twohearths' }, text: ['Somebody says "to Two Hearths: one village, however we got here". Gets me every time.'] },
  ]);
  lines('season.tables.course', [
    { if: { temper: 'ornery' }, text: ['The soup. It\'s the only course they can\'t get wrong.'] },
    { if: { temper: 'witty' }, text: ['I eat the courses in the order they\'re in danger. Pudding first, obviously.'] },
    { if: { stage: 'elder' }, text: ['The soup and the pudding. The main course is for the young.'] },
  ]);
  lines('season.market.bought', [
    { if: { season: 'autumn' }, text: ['Apples for the jam and a stone jar to put it in. That\'s my afternoon spoken for.'] },
    { if: { season: 'spring' }, text: ['Seedlings in little pots. I\'ll have them in by teatime and dead by Highday.'] },
    { if: { rift: true }, text: ['A hat. A hill-folk hat. I look ridiculous. I\'ve never been happier.'] },
  ]);
  lines('season.market.gossip', [
    { if: { temper: 'ornery' }, text: ['That the cheese-seller\'s gone up again. Thieves, the lot of them.'] },
    { if: { temper: 'shy' }, text: ['...I don\'t hear much. I just listen near the bread stall.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, everybody\'s so excited about everything! I can\'t remember any of it!'] },
  ]);
  lines('season.food.pass.reply', [
    { if: { temper: 'cheerful' }, text: ['Ha! It\'s seed-cake! There\'s a slice with your name on it!'] },
    { if: { temper: 'proud' }, text: ['That\'s my bread. You can smell it from the bridge, they tell me.'] },
    { if: { temper: 'gloomy' }, text: ['Burnt pie. Don\'t ask.'] },
    { if: { season: 'autumn' }, text: ['Brambles. I went out for a few and came back purple to the elbow.'] },
  ]);
  lines('season.tables.cards', [
    { if: { temper: 'shy' }, text: ['...Could you put me next to someone quiet? Please?'] },
    { if: { stage: 'child' }, text: ['Put me next to the pudding table! The PUDDING table!'] },
  ]);
  lines('season.tables.theirtoast', [
    { if: { stage: 'elder' }, text: ['To the ones who sat here before us, and the ones who\'ll sit here after. Then pudding.'] },
    { if: { spouse: (s) => !!s }, text: ['To {spouse}, who puts up with me. That\'s the whole toast. Everyone would understand.'] },
  ]);
  lines('season.garden.say', [
    { if: { temper: 'cheerful' }, text: ['"Good morning, darlings!" Every day. The beans love it.'] },
    { if: { temper: 'shy' }, text: ['...Just their names. I gave them names. Don\'t tell.'] },
    { if: { stage: 'child' }, text: ['I tell my sunflower jokes. It doesn\'t laugh. It\'s a very serious flower.'] },
  ]);
  lines('season.harvest.yield', [
    { if: { job: 'brewer' }, text: ['Good barley, plump grain. It\'ll make an ale you could stand a spoon in.'] },
    { if: { job: 'baker' }, text: ['Fine flour this year. I can tell by the way the dough springs back.'] },
    { if: { job: 'herder' }, text: ['Hay\'s good. The beasts will eat well, so we will.'] },
    { if: { temper: 'dreamy' }, text: ['Gold to the hedges. It looks like the sun fell down and stayed.'] },
  ]);
  lines('season.food.breakfasts', [
    { if: { temper: 'ornery' }, text: ['Two. And I don\'t want to hear a word about it.'] },
    { if: { temper: 'shy' }, text: ['...Three. But the third is very small.'] },
    { if: { rift: true }, text: ['Two! I didn\'t know you could have two. I\'ve never been so happy.'] },
  ]);
});
