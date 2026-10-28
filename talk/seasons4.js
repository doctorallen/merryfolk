'use strict';
// ---------------------------------------------------------------------------
// The natural world and the night sky, as folk talk of them to the wizard:
// the river and the pond, the birds and beasts (wild and penned), what's in
// flower and what's in the woods, the stars and the moon (and the questions
// the young ask about them), and the year as a whole when the season turns.
// The seasonal facts come from talk/seasons.js; this pack adds the bird and
// the flower of the moment, and the season's births and weddings.
// ---------------------------------------------------------------------------

talkPack('seasons4', () => {
  // --- Facts: the bird and the flower of the moment, and the season's tally --------------
  const BIRDS = { spring: ['swallow', 'cuckoo', 'skylark', 'blackbird'], summer: ['swift', 'house martin', 'kingfisher', 'yellowhammer'], autumn: ['rook', 'jay', 'thrush', 'buzzard'], winter: ['robin', 'wren', 'bullfinch', 'tawny owl'] };
  const FLOWERS = { spring: ['primroses', 'bluebells', 'cowslips', 'campion'], summer: ['foxgloves', 'poppies', 'harebells', 'dog-roses'], autumn: ['asters', 'heather', 'michaelmas daisies', 'the last of the clover'], winter: ['snowdrops', 'holly berries', 'winter aconite', 'hellebores'] };
  addFacts((v, F) => {
    const s = World.season in BIRDS ? World.season : 'spring';
    F.birdNow = BIRDS[s][Math.floor(hash2(Game.day, 17) * 4)];
    F.flowerNow = FLOWERS[s][Math.floor(hash2(Game.day, 23) * 4)];
    const a = Game.almanac, st = Game.stats || {};
    F.seasonBabies = a ? Math.max(0, (st.births || 0) - (a.births || 0)) : null;
    F.seasonWeddings = a ? Math.max(0, (st.weddings || 0) - (a.weddings || 0)) : null;
    F.riverFrozen = World.season === 'winter' && (Game.weather === 'snow' || Game.hazard?.k === 'frost');
  });

  // --- The river and the pond --------------------------------------------------------------
  addThread({
    id: 'season.river', cool: 3, weight: 1,
    label: (F) => (F.riverFrozen ? 'The river under ice' : F.hazard === 'flood' ? 'The river in spate' : 'Down by the river'),
    rel: (F) => (F.job === 'fisher' || F.job === 'miller' ? 1.6 : F.hazard === 'flood' ? 1.5 : F.season === 'summer' ? 1.3 : (F.likes || []).includes('quiet') ? 1.2 : 0.9),
    open: { ask: 'season.river.open' },
    beats: {
      start: { line: 'season.river.start', go: [
        { ap: 'ask', say: 'Do you fish, {name}?', to: 'fish' },
        { ap: 'ask', say: 'And do you ever go in it?', to: 'swim' },
        { ap: 'share', say: 'season.river.share', label: 'Tell them of rivers you\'ve known', to: 'rivers' },
      ] },
      fish: { line: 'season.river.fish', go: [
        { ap: 'jest', say: 'And the one that got away was how big, exactly?', to: 'away' },
        { ap: 'ask', say: 'Where\'s the best spot? I shan\'t tell.', to: 'spot', need: { open: 1 }, soft: true },
        { ap: 'ask', say: 'Do you ever see the heron at it?', to: 'heron' },
      ] },
      away: { line: 'season.river.away', go: [
        { ap: 'jest', say: 'He grows every time you tell it, doesn\'t he?', to: 'grows' },
        { ap: 'warm', say: 'One day you\'ll have him. And then you\'ll let him go.', to: 'oneday' },
      ] },
      grows: { line: 'season.river.grows', fx: { joke: { k: 'season.bigfish', t: 'The one that got away grows a hand\'s length every time it\'s told.' }, fond: 0.02 }, end: true },
      oneday: { line: 'season.river.oneday', fx: { fond: 0.02 }, end: true },
      spot: { line: 'season.river.spot', fx: { confide: { k: 'season.spot', t: '{Name}\'s secret fishing spot is the deep pool under the leaning willow, past the mill', secret: true } }, go: [
        { ap: 'warm', say: 'Your secret\'s safe with me. Not a word.', to: 'safe' },
        { ap: 'jest', say: 'I shall be there at dawn with a very big net.', to: 'net' },
      ] },
      safe: { line: 'season.river.safe', fx: { trust: 0.04, promise: { k: 'secret.season.spot', t: 'You promised to keep the fishing spot secret', days: 30 } }, end: true },
      net: { line: 'season.river.net', fx: { fond: 0.02 }, end: true },
      heron: { line: 'season.river.heron', go: [
        { ap: 'jest', say: 'He\'s a better fisher than any of us, and he never buys bait.', to: 'better' },
        { ap: 'ask', say: 'And the kingfisher? Have you seen it?', to: 'kingfisher' },
        { ap: 'advise', say: 'season.river.tip', label: 'Give them a fishing tip', to: 'bait' },
      ] },
      better: { line: 'season.river.better', end: true },
      kingfisher: { line: 'season.river.kingfisher', fx: { feel: 'liked', feelX: 'thinking of the kingfisher' }, end: true },
      bait: { line: 'season.river.bait', fx: { respect: 0.02 }, go: [
        { ap: 'warm', say: 'Go and try it. The evening rise is the time.', to: 'goes', need: { if: { stage: ['grown', 'elder'], hour: ['afternoon', 'evening'] } } },
        { ap: 'jest', say: 'Or just ask the fish nicely. It works for the heron.', to: 'end' },
      ] },
      goes: { line: 'season.river.goes', fx: { queue: 'fish', respect: 0.01 }, end: true },
      swim: { line: 'season.river.swim', go: [
        { ap: 'ask', say: 'Who taught you?', to: 'taught' },
        { ap: 'share', say: 'I fell in the Brandywine once. Hat and all. The hat floated better.', to: 'fell' },
        { ap: 'listen', say: '*You lean on the rail and wait.*', label: 'Lean on the rail and wait', to: 'deep', need: { open: 1 }, soft: true },
      ] },
      taught: { line: 'season.river.taught', fx: { trust: 0.02 }, end: true },
      fell: { line: 'season.river.fell', fx: { joke: { k: 'season.hatfloat', t: 'The wizard\'s hat floats better than the wizard.' }, fond: 0.02 }, end: true },
      deep: { line: 'season.river.deep', fx: { trust: 0.03, remember: 'Told the wizard what the river means to me.', rv: 1 }, go: [
        { ap: 'warm', say: 'Then I\'m glad it runs past your door.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'share', say: 'Every river I\'ve loved, I\'ve loved for someone who sat by it.', to: 'loved' },
      ] },
      loved: { line: 'season.river.loved', fx: { trust: 0.03 }, end: true },
      rivers: { line: 'season.river.rivers', go: [
        { ap: 'tale', say: 'Far off there\'s a river with a daughter, they say. She sings on the stones at dusk.', to: 'tale' },
        { ap: 'warm', say: 'But none of them as friendly as this one.', to: 'friendly' },
      ] },
      tale: { line: 'season.river.tale', fx: { fond: 0.02 }, end: true },
      friendly: { line: 'season.river.friendly', end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.river.open', [
    { text: ['How\'s the river treating you, {name}?', 'Do you get down to the water much, {name}?', 'I came by the river this morning, {name}. It had a lot to say.'] },
    { if: { season: 'summer' }, text: ['Hot enough for a dip, {name}? The river looked tempting.', 'The river\'s low and lazy today, {name}. Like most of us.'] },
    { if: { riverFrozen: true }, pri: 1, text: ['Have you seen the river, {name}? Ice at the edges, and the reeds all frozen stiff.'] },
    { if: { hazard: 'flood' }, pri: 1, text: ['The river\'s in a temper, {name}. Have you seen it?', 'That river\'s up to no good, {name}. Brown as gravy.'] },
    { if: { job: 'fisher' }, pri: 1, text: ['Anything biting, {name}?', 'How\'s the river been to you, {name}? Generous or stingy?'] },
    { if: { job: 'miller' }, pri: 1, text: ['How\'s the mill-race running, {name}?', 'I could hear your wheel from the bridge, {name}.'] },
    { if: { stage: 'child' }, text: ['Have you been down to the river, {name}? Seen any frogs?', 'What\'s the best thing in the river, {name}?'] },
  ]);
  lines('season.river.start', [
    { if: { register: 'fine' }, text: ['The river is the oldest resident of the valley, and by far the most eloquent.', 'I find the river a great aid to reflection. It never interrupts.'] },
    { if: { register: 'plain' }, text: ['River\'s a river. Wet, mostly. I like it, mind.', 'Goes past. Comes back next day. Good river.'] },
    { if: { weather: 'fog' }, text: ['In fog the river\'s just a sound. You follow it home like a friend calling.'] },
    { if: { kid: (k) => !!k }, text: ['I\'m forever fishing {kid} out of it. Wet to the ears, and grinning.'] },
    { text: ['Oh, the river. It\'s always there, isn\'t it? Like an old aunt humming.', 'I go down most days. Just to look at it. Is that odd?', 'The river\'s the best neighbor in the valley. Never borrows anything.'] },
    { if: { season: 'spring' }, text: ['It\'s high and fast and full of snow from somewhere. You can hear it from bed.', 'Spring river. All froth and hurry, like a youngster late for a dance.'] },
    { if: { season: 'summer' }, text: ['Low and warm and lazy. Dragonflies everywhere. Perfect.', 'In summer it goes so slow you could have a conversation with it.'] },
    { if: { season: 'autumn' }, text: ['Leaves all over it like a quilt. Red and gold, going round and round.', 'The autumn river smells of leaves and mud and something sweet.'] },
    { if: { season: 'winter' }, text: ['Cold and black and quiet. Ice in the shallows. I don\'t go near the edge.', 'In winter the river talks under the ice. A sort of grumble.'] },
    { if: { riverFrozen: true }, pri: 1, text: ['Frozen at the edges! The ducks are walking on it, very offended.', 'The pond\'s frozen solid. The young ones have been sliding on it since breakfast.'] },
    { if: { hazard: 'flood' }, pri: 2, text: ['It\'s over the low meadows, bold as you like. There\'s a carp in the cabbage patch.', 'Brown and fat and pushing at the banks. I don\'t trust it this week.'] },
    { if: { temper: 'ornery' }, text: ['The river? Floods in spring, stinks in summer, freezes in winter. Lovely.', 'I\'ve nothing against the river. It\'s the people by it. Splashing.'] },
    { if: { temper: 'cheerful' }, text: ['I love the river! I wave at it. It never waves back but I live in hope.', 'Best thing in the valley, the river. Free, and always moving.'] },
    { if: { temper: 'shy' }, text: ['...I go there when it\'s too loud everywhere else. The river\'s loud too, but kindly.', '...I sit on the bank sometimes. Nobody minds you on a bank.'] },
    { if: { temper: 'dreamy' }, text: ['Where does it all go, do you think? Past Bree, past everything, to the sea?', 'I put a leaf on it every morning and wonder how far it gets.'] },
    { if: { temper: 'witty' }, text: ['The river\'s like a good guest. Always leaving, never quite gone.', 'It\'s the only thing in Thistledown that never stops for second breakfast.'] },
    { if: { temper: 'proud' }, text: ['Cleanest river in the Shire, ours. I\'d drink from it. I have, in fact.', 'Our river\'s got the best trout this side of the Water. Ask anyone.'] },
    { if: { temper: 'gloomy' }, text: ['The river just goes. Doesn\'t it. Everything goes, and the river shows you how.', 'I watch it go by. Things float past and never come back.'] },
    { if: { temper: 'curious' }, text: ['Did you know there\'s a pool past the willow nobody\'s found the bottom of? I tried. I got wet.', 'Why\'s it brown after rain and green after sun? I\'ve been trying to work it out.'] },
    { if: { stage: 'child' }, text: ['I found a frog at the river! He was SO cross.', 'The river\'s got fish AND frogs AND a boot. I\'m saving the boot.', 'We\'re not allowed to go in past our knees. I went past my knees.'] },
    { if: { stage: 'elder' }, text: ['I\'ve watched that river all my life. It\'s never once been the same twice.', 'My father fished it, and his. The river doesn\'t know any of us.'] },
    { if: { rift: true }, text: ['A river you can just walk up to. Nobody owns it. Nobody charges. It blows my mind.', 'Back in Neverdark the river was a pipe. A big one. With a lid. This one has fish.'] },
    { if: { job: 'fisher' }, pri: 1, text: ['The river\'s my living. I know every stone of it. Well. Most.', 'Up at dawn, down to the water. The mist on it then. You should see it.'] },
    { if: { job: 'miller' }, pri: 1, text: ['The river turns my wheel and I grind your bread. We\'re partners, the river and me.', 'I listen to the race all day. I\'d know if it changed its mind before it did.'] },
    { if: { likes: 'quiet' }, text: ['It\'s the quiet I go for. Running water\'s the quietest noise there is.'] },
    { if: { weather: 'rain' }, text: ['Rain on the river. A thousand little rings. I could watch it all day.'] },
    { if: { hour: 'morning' }, text: ['Morning\'s the time. The mist sits on the water like a cat on a cushion.'] },
    { if: { hour: 'evening' }, text: ['Evening\'s the time. Fish rising, bats skimming, the light going gold.'] },
  ]);
  lines('season.river.share', [
    { text: ['I\'ve crossed a great many rivers. One of them tried to keep me.', 'Rivers are old friends of mine. Some are kinder than others.'] },
    { if: { season: 'winter' }, text: ['I once crossed a river on the ice in the north, and heard it laughing underneath.'] },
    { if: { season: 'summer' }, text: ['There\'s a river in the south so warm the fish sunbathe on the stones.'] },
  ]);
  lines('season.river.fish', [
    { if: { register: 'fine' }, text: ['I angle, now and then. The fish and I have a very civil understanding: I wait, they decline.'] },
    { if: { weather: 'rain' }, text: ['Rain\'s the time. Fish rise to the drops. So do I, mostly to go home.'] },
    { text: ['Now and then. Mostly I sit and the fish laugh at me.', 'I do! Not well. But I do.', 'When I can. A rod, a bit of bread and a long afternoon.'] },
    { if: { job: 'fisher' }, pri: 1, text: ['Fish? Wizard, it\'s my trade. Trout, perch, the odd eel. The eels fight back.', 'Every day God sends. Nets in the morning, rod in the evening.', 'I fish. My father fished. I\'ll die with a worm in my hand.'] },
    { if: { values: 'nature' }, text: ['It\'s what I do of an evening. I\'d rather the river than the Badger.'] },
    { if: { temper: 'ornery' }, text: ['I would, if the young ones didn\'t splash about scaring everything off.', 'I used to. Then the river and I had a disagreement.'] },
    { if: { temper: 'cheerful' }, text: ['Love it! I never catch a thing. That\'s not the point.', 'I fish for the company. The fish are poor company, mind.'] },
    { if: { temper: 'shy' }, text: ['...Sometimes. It\'s a good thing to do on your own.', '...A bit. Fish don\'t mind if you don\'t talk.'] },
    { if: { temper: 'dreamy' }, text: ['I hold the rod and forget it. I\'ve lost three rods that way.', 'I go to watch the float. The catching\'s by the by.'] },
    { if: { temper: 'witty' }, text: ['I fish. The fish don\'t. It\'s a very one-sided hobby.', 'I\'m a fisher of great patience and no results.'] },
    { if: { temper: 'proud' }, text: ['Biggest trout ever landed in this valley. Me. Ask anyone. Well, ask me.', 'I don\'t like to boast, but the fish know my name.'] },
    { if: { temper: 'gloomy' }, text: ['I sit there. It\'s quiet. Sometimes something bites. Mostly not.'] },
    { if: { temper: 'curious' }, text: ['I\'m trying every bait in turn. Bread, worms, cheese. Cheese is promising.'] },
    { if: { stage: 'child' }, text: ['I\'ve got a stick with string on! I caught a weed. A BIG weed.', 'Dad lets me hold the rod. I caught a fish once. It was very small. I let it go.'] },
    { if: { stage: 'elder' }, text: ['Used to. My hands are too stiff for the knots now. I watch the young ones get it wrong.'] },
    { if: { rift: true }, text: ['I tried. I kept waiting for a notification. Fish don\'t notify you.'] },
    { if: { season: 'winter' }, text: ['Not in this cold. The fish go deep and so do I. Under the blankets.'] },
  ]);
  lines('season.river.away', [
    { text: ['As long as my arm! Longer! He broke the line and looked back at me.', 'A trout like a loaf of bread. He winked. I swear he winked.'] },
    { if: { job: 'fisher' }, pri: 1, text: ['Old Gaffer, I call him. A pike as long as a door. Twelve years I\'ve been after him.'] },
    { if: { temper: 'ornery' }, text: ['Big enough. Bigger than anything you\'ve caught. Don\'t smirk.'] },
    { if: { temper: 'witty' }, text: ['About as big as he gets, every time I tell it.', 'Size of a pony. A small pony. A pony that\'s been ill.'] },
    { if: { temper: 'proud' }, text: ['Biggest fish in the river, and I had him on the line. That\'s nearly as good.'] },
    { if: { temper: 'gloomy' }, text: ['Big. And gone. They\'re always the big ones that go.'] },
    { if: { temper: 'dreamy' }, text: ['Silver, like a moon in the water. I don\'t mind he got away. He was too beautiful.'] },
    { if: { temper: 'shy' }, text: ['...This big. Well. This big. Honestly.'] },
    { if: { temper: 'cheerful' }, text: ['Huge! I fell in trying to grab him. Best day of the summer.'] },
    { if: { temper: 'curious' }, text: ['Big enough that I\'ve been wondering how old he is. Fish can live for ages, you know.'] },
    { if: { stage: 'child' }, text: ['THIS BIG. *spreads arms as far as they go* Bigger. My arms aren\'t long enough.'] },
    { if: { stage: 'elder' }, text: ['I lost him sixty years ago, and I\'ll still tell you he was a monster.'] },
  ]);
  lines('season.river.grows', [
    { text: ['He does not! ...He might. A bit. It\'s a good story.', 'Ha! By Yule he\'ll be a whale. Let him grow.'] },
    { if: { temper: 'ornery' }, text: ['He\'s exactly as big as I say. Today.'] },
    { if: { temper: 'witty' }, text: ['Every fish grows in the telling. That\'s how you know it\'s a fishing story.'] },
    { if: { stage: 'child' }, text: ['He\'s growing in the RIVER too! So it\'s true!'] },
    { if: { temper: 'proud' }, text: ['Some fish are worth growing. Mine is.'] },
  ]);
  lines('season.river.oneday', [
    { text: ['Let him go? After all that? ...Yes. Yes, I would.', 'That\'s the right way round, isn\'t it. Catch him and let him go.'] },
    { if: { temper: 'dreamy' }, text: ['I think I\'d just like to look at him. Then let him go. That\'s enough.'] },
    { if: { temper: 'ornery' }, text: ['Let him go! He\'d have that coming. ...Fine. Maybe.'] },
    { if: { stage: 'child' }, text: ['I\'d keep him in the bath! ...No. He\'d be sad. I\'d let him go.'] },
  ]);
  lines('season.river.spot', [
    { text: ['...Past the mill, there\'s a willow that leans right over. Under it there\'s a pool. Don\'t tell.', '...All right. The deep pool under the leaning willow. Best trout in the valley. Not a word.'] },
    { if: { temper: 'shy' }, text: ['...I\'ve never told anyone. The willow past the mill. The one that leans. There.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. If I find you there... The leaning willow. Past the mill. Swear you won\'t.'] },
    { if: { job: 'fisher' }, pri: 1, text: ['A fisher never tells. ...The leaning willow past the mill. The pool under its roots. Sacred ground.'] },
    { if: { stage: 'child' }, text: ['There\'s a secret pool under the bendy tree! Grown-ups don\'t know! Except you now.'] },
  ]);
  lines('season.river.safe', [
    { text: ['Thank you. I knew you were the sort.', 'Not a word. Not even to the heron.'] },
    { if: { temper: 'ornery' }, text: ['You\'d better. I\'ve a long memory and a short rod.'] },
    { if: { stage: 'child' }, text: ['Swear on your hat! ...Okay. I believe you.'] },
  ]);
  lines('season.river.net', [
    { text: ['You wouldn\'t dare! ...You would, wouldn\'t you.', 'Ha! The fish would see your hat coming a mile off.'] },
    { if: { temper: 'ornery' }, text: ['Try it. I\'ll be there first. I\'m always there first.'] },
    { if: { temper: 'witty' }, text: ['Bring a big net. The trout there have ambitions.'] },
  ]);
  lines('season.river.heron', [
    { text: ['The heron! Stands like a stick for an hour, then STAB. Never misses.', 'Every morning, same stone. He looks at me like I\'m in his way.'] },
    { if: { pastime: 'birdwatching' }, pri: 1, text: ['The heron\'s my favorite. Gray and patient and a bit grumpy. Like my grandfather.'] },
    { if: { job: 'fisher' }, pri: 1, text: ['That heron takes more trout than I do and never pays a penny of tithe.'] },
    { if: { temper: 'ornery' }, text: ['That bird\'s a thief in a gray coat. I\'ve told him so.'] },
    { if: { temper: 'dreamy' }, text: ['When he flies he looks like something out of an old story. Slow and ancient.'] },
    { if: { temper: 'witty' }, text: ['He\'s the only one in the valley who\'s patient. It\'s a bit shaming.'] },
    { if: { temper: 'shy' }, text: ['...He lets me sit near him if I\'m very still. We\'re both very still.'] },
    { if: { temper: 'cheerful' }, text: ['I said good morning to him once. He flew off. I think he was shy.'] },
    { if: { stage: 'child' }, text: ['The heron is SO tall. Taller than me! He has a dagger for a nose.'] },
    { if: { rift: true }, text: ['A bird that stands still and fishes. Like a security drone, but alive. And grumpier.'] },
  ]);
  lines('season.river.tip', [
    { text: ['Fish the shade in the heat. Trout sulk where it\'s cool.', 'Cast upstream and let it drift down to them. Fish face the current.'] },
    { if: { season: 'summer' }, text: ['Evening, when the flies come down. That\'s when they\'re hungry.'] },
    { if: { season: 'winter' }, text: ['In the cold, go slow and deep. A fish in winter wants its dinner brought to its door.'] },
  ]);
  lines('season.river.bait', [
    { text: ['Huh. Upstream. I\'ve been doing it backwards for years.', 'I\'ll try that. If it works I\'ll bring you a trout.'] },
    { if: { job: 'fisher' }, pri: 1, text: ['Teaching a fisher to fish! ...It\'s a good tip, mind. Don\'t tell anyone I said so.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I know where the fish are, thank you. ...I\'ll try it, though.'] },
    { if: { temper: 'curious' }, text: ['Why upstream? Because they see it coming natural? Oh, that\'s clever.'] },
    { if: { temper: 'cheerful' }, text: ['Ooh! If I catch one I\'m naming it after you.'] },
    { if: { stage: 'child' }, text: ['Upstream! I\'m going to tell Dad. He does it wrong.'] },
  ]);
  lines('season.river.goes', [
    { text: ['You know, I think I will. Right now. Before supper.', 'The evening rise. Yes. Where\'s my rod?'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Since you\'re so sure. If I catch nothing, I\'m blaming you.'] },
    { if: { temper: 'shy' }, text: ['...I will. Thank you. I\'ll go now, while it\'s quiet.'] },
  ]);
  lines('season.river.better', [
    { text: ['Ha! He\'s got the beak for it. I\'ve only got a bent pin.', 'Never buys bait, never pays tithe, never says thank you. Typical.'] },
    { if: { temper: 'witty' }, text: ['He\'s a better fisher, a better stander, and a better dresser.'] },
    { if: { temper: 'proud' }, text: ['Better than me? I\'ll have you know I\'ve outfished that bird twice.'] },
  ]);
  lines('season.river.kingfisher', [
    { text: ['Once! A flash of blue like a spark off a forge. Gone before I could blink.', 'Twice this year. I hold my breath every time I pass the bank where he sits.'] },
    { if: { pastime: 'birdwatching' }, pri: 1, text: ['Seen him eleven times this year. Twelve. Every one of them like the first.'] },
    { if: { temper: 'dreamy' }, text: ['I saw him once and I\'ve been looking for him ever since. It\'s like being in love.'] },
    { if: { temper: 'gloomy' }, text: ['Never. Everybody else has. Not me. Never.'] },
    { if: { temper: 'cheerful' }, text: ['Yes! I shouted, and scared him off. I\'m still glad I shouted.'] },
    { if: { stage: 'child' }, text: ['YES! He was BLUE! Bluer than blue! Bluer than your scarf!'] },
    { if: { rift: true }, text: ['That blue! It\'s the only thing here that\'s as bright as the city. And it\'s alive.'] },
    { if: { season: 'winter' }, text: ['Not lately. He goes somewhere warmer, I think. Sensible bird.'] },
  ]);
  lines('season.river.swim', [
    { text: ['On a hot day, from the big flat rock. Everyone does.', 'Paddle, mostly. My grandmother said hobbits aren\'t made for deep water.'] },
    { if: { season: 'summer' }, text: ['Every evening! From the flat rock by the mill, with a great big splash.', 'In this heat? Twice a day. The fish have stopped complaining.'] },
    { if: { season: 'winter' }, text: ['In WINTER? Not on your hat. But the young ones slide on the pond.', 'Skating, when the pond freezes. I go round and round very slowly, like a dignified duck.'] },
    { if: { season: 'spring' }, text: ['Too cold! The river\'s snow-water in spring. One toe and you\'re done.'] },
    { if: { season: 'autumn' }, text: ['Not with the leaves in. Too slippy. I paddle and pretend.'] },
    { if: { riverFrozen: true }, pri: 1, text: ['The pond\'s frozen! I\'ve been sliding on my boots all morning. And my bottom.'] },
    { if: { temper: 'ornery' }, text: ['Swim? Hobbits don\'t swim. We drown carefully.', 'I don\'t go in rivers. Rivers come in my hole often enough.'] },
    { if: { temper: 'shy' }, text: ['...Only when nobody\'s about. Early. It feels like the whole river\'s mine then.'] },
    { if: { temper: 'cheerful' }, text: ['Every chance I get! Cannonball off the rock! The splash is the best part.'] },
    { if: { temper: 'dreamy' }, text: ['I float on my back and look at the sky. You stop knowing which way\'s up.'] },
    { if: { temper: 'witty' }, text: ['I swim like a teapot. Straight down, with dignity.'] },
    { if: { temper: 'proud' }, text: ['I swam across and back once, at the widest part. They still talk about it.'] },
    { if: { temper: 'gloomy' }, text: ['Not anymore. It\'s cold and it\'s deep and things touch your feet.'] },
    { if: { temper: 'curious' }, text: ['I put my head under once to see what fish see. Green. Fish see green.'] },
    { if: { stage: 'child' }, text: ['I can swim! Nearly! I can do the doggy one!', 'We\'re ONLY allowed in the shallow bit. The shallow bit\'s boring.'] },
    { if: { stage: 'elder' }, text: ['Not at my age. My knees float off on their own.'] },
    { if: { rift: true }, text: ['Swim? In OPEN water? With no lifeguard drone? ...I\'ve tried it. It\'s terrifying. It\'s amazing.'] },
  ]);
  lines('season.river.taught', [
    { text: ['Nobody. I fell in and had to learn on the way out.', 'My father. He threw me off the rock and said "kick". I kicked.'] },
    { if: { parent: (p) => !!p }, text: ['{Parent}. Held me up under my tummy and then, very quietly, let go.'] },
    { if: { stage: 'child' }, text: ['Nobody\'s teaching me! I\'m teaching myself! I\'m good at the splashing part.'] },
    { if: { rift: true }, text: ['A hill-hobbit youngster. Laughed the whole time. Then fished me out. We\'re friends now.'] },
  ]);
  lines('season.river.fell', [
    { text: ['Ha! I\'d have given a week\'s bread to see that.', 'The hat floated better! Did you fish it out?'] },
    { if: { temper: 'witty' }, text: ['A wizard who sinks and a hat that swims. You\'re in the wrong job.'] },
    { if: { temper: 'cheerful' }, text: ['Oh no! Oh, that\'s wonderful. Sorry. That\'s wonderful.'] },
    { if: { temper: 'shy' }, text: ['...I fell in once too. Nobody saw. I thought nobody did.'] },
    { if: { stage: 'child' }, text: ['Did your beard get wet? Did it go all floaty?'] },
    { if: { temper: 'ornery' }, text: ['Serves you right. Wandering about by rivers in a hat like that.'] },
  ]);
  lines('season.river.deep', [
    { text: ['...When everything\'s too much, I go and sit by it. It doesn\'t want anything from me.', '...The river was there before any of us and it\'ll be there after. I find that comforting.'] },
    { if: { spouse: (s) => !!s }, pri: 1, text: ['...It\'s where {spouse} and I first walked out together. I still go to the same stone.'] },
    { if: { stage: 'elder' }, text: ['...I scattered someone\'s ashes on it, long ago. I say good morning to them.'] },
    { if: { temper: 'gloomy' }, text: ['...On bad days I sit and watch it. It goes on, so I go on. That\'s all.'] },
    { if: { temper: 'dreamy' }, text: ['...I talk to it. Out loud. I tell it things I can\'t tell anyone.'] },
    { if: { rift: true }, pri: 1, text: ['...The first night here, I slept by the river. The sound of it was the only thing that didn\'t frighten me.'] },
    { if: { stage: 'child' }, text: ['...I go there when I\'m in trouble. The river never tells on me.'] },
  ]);
  lines('season.river.loved', [
    { text: ['...Who sat by yours?', 'That\'s... that\'s exactly it. Thank you.'] },
    { if: { temper: 'curious' }, text: ['Who? No. You don\'t have to say. But I wonder.'] },
    { if: { temper: 'dreamy' }, text: ['Then this one\'s yours now too. You can sit by it with me.'] },
  ]);
  lines('season.river.rivers', [
    { text: ['Tried to keep you! What happened?', 'Kinder than others? Rivers aren\'t kind or unkind. Are they?'] },
    { if: { temper: 'curious' }, text: ['Which rivers? How many? Which was the widest? The coldest?'] },
    { if: { temper: 'ornery' }, text: ['Foreign rivers. Hmph. Ours does the job.'] },
    { if: { temper: 'dreamy' }, text: ['I\'d love to see a river that\'s never been seen by anyone I know.'] },
    { if: { stage: 'child' }, text: ['Did a river try to EAT you?'] },
    { if: { rift: true }, text: ['I\'ve seen one river. This one. Well, and the pipe.'] },
  ]);
  lines('season.river.tale', [
    { text: ['A river with a daughter. Oh, that\'s lovely. Is she kind?', 'Singing on the stones. I\'ll listen tonight. You never know.'] },
    { if: { stage: 'child' }, text: ['Does OUR river have a daughter? Can I meet her?'] },
    { if: { temper: 'ornery' }, text: ['Rivers with daughters. Wizards. Honestly. ...What did she sing?'] },
    { if: { temper: 'dreamy' }, text: ['I knew it. I always knew there was someone singing down there.'] },
  ]);
  lines('season.river.friendly', [
    { text: ['That\'s true. It\'s only tried to drown me the once.', 'Our river\'s a good sort. Floods a bit. Means well.'] },
    { if: { hazard: 'flood' }, pri: 1, text: ['Friendly! Look at it! It\'s in the cabbages!'] },
    { if: { temper: 'proud' }, text: ['Course not. Ours is the best. I\'ve always said so.'] },
  ]);

  // --- Birds and beasts ---------------------------------------------------------------------
  addThread({
    id: 'season.wild', cool: 3, weight: 1,
    label: (F) => (F.season === 'spring' ? 'The swallows are back' : F.season === 'winter' ? 'The birds in the snow' : 'Birds and beasts'),
    rel: (F) => (F.pastime === 'birdwatching' || F.job === 'herder' || (F.likes || []).includes('animals') ? 1.6 : F.stage === 'child' ? 1.3 : 1),
    open: { ask: 'season.wild.open' },
    beats: {
      start: { line: 'season.wild.start', go: [
        { ap: 'ask', say: 'Which birds have you seen lately?', to: 'birds' },
        { ap: 'jest', say: 'And what\'s been at your lettuces, then?', to: 'pests' },
        { ap: 'ask', say: 'And how are the beasts in the pens?', to: 'pens', need: { if: { pens: (p) => !!p && p.length > 0 } } },
      ] },
      birds: { line: 'season.wild.birds', go: [
        { ap: 'ask', say: 'Which is your favorite?', to: 'fav' },
        { ap: 'share', say: 'I can whistle a blackbird, you know. Badly.', to: 'whistle' },
        { ap: 'listen', say: '*You wait, head on one side, like a robin.*', label: 'Wait, head on one side', to: 'list', need: { open: 1 }, soft: true },
      ] },
      fav: { line: 'season.wild.fav', fx: { learn: ['season.bird', '{Name} has a favorite bird, and will tell you about it at length'] }, go: [
        { ap: 'warm', say: 'A good choice. It suits you.', to: 'suits' },
        { ap: 'tale', say: 'There\'s a thrush in a story I know who carried a message to a king.', to: 'thrush' },
      ] },
      suits: { line: 'season.wild.suits', fx: { fond: 0.02 }, end: true },
      thrush: { line: 'season.wild.thrush', fx: { fond: 0.02 }, end: true },
      whistle: { line: 'season.wild.whistle', go: [
        { ap: 'jest', say: '*You whistle. A blackbird somewhere answers, sounding offended.*', label: 'Whistle anyway', to: 'answered' },
        { ap: 'warm', say: 'Perhaps you\'d teach me a better one.', to: 'teach' },
      ] },
      answered: { line: 'season.wild.answered', fx: { joke: { k: 'season.blackbird', t: 'The wizard whistled a blackbird and a real one answered, offended.' }, fond: 0.02 }, end: true },
      teach: { line: 'season.wild.teach', fx: { trust: 0.02 }, end: true },
      list: { line: 'season.wild.list', fx: { open: 1 }, go: [
        { ap: 'ask', say: 'And which one are you still waiting for?', to: 'waiting' },
        { ap: 'warm', say: 'That\'s a fine list. Keep it always.', to: 'end' },
      ] },
      waiting: { line: 'season.wild.waiting', fx: { confide: { k: 'season.waitbird', t: '{Name} is still waiting to see one bird before they die' } }, go: [
        { ap: 'warm', say: 'Then I\'ll keep my eyes open for it, on the road.', to: 'watch' },
        { ap: 'advise', say: 'Go out at dawn, and sit where nobody else does.', to: 'dawn' },
      ] },
      watch: { line: 'season.wild.watch', fx: { hook: 'season.waitbird', fond: 0.03 }, end: true },
      dawn: { line: 'season.wild.dawn', fx: { respect: 0.02 }, end: true },
      pests: { line: 'season.wild.pests', go: [
        { ap: 'advise', say: 'season.wild.tip', label: 'Tell them how to keep them off', to: 'advised' },
        { ap: 'jest', say: 'Send them to me. I\'ll have a word. Wizard to rabbit.', to: 'word' },
        { ap: 'comfort', say: 'They have to eat too, poor things. Just not your lettuces.', to: 'eat' },
      ] },
      advised: { line: 'season.wild.advised', fx: { respect: 0.02 }, end: true },
      word: { line: 'season.wild.word', fx: { fond: 0.02 }, end: true },
      eat: { line: 'season.wild.eat', go: [
        { ap: 'ask', say: 'Is there one you\'re fond of, all the same?', to: 'fond' },
        { ap: 'warm', say: 'You\'ve a soft heart under all that grumbling.', to: 'soft', need: { if: { temper: ['ornery', 'gloomy', 'proud'] } } },
      ] },
      fond: { line: 'season.wild.fond', fx: { trust: 0.02 }, end: true },
      soft: { line: 'season.wild.soft', fx: { fond: 0.03 }, end: true },
      pens: { line: 'season.wild.pens', go: [
        { ap: 'ask', say: 'Do they have names?', to: 'names' },
        { ap: 'jest', say: 'Which one\'s the cleverest? And is it cleverer than the herder?', to: 'clever' },
      ] },
      names: { line: 'season.wild.names', fx: { joke: { k: 'season.pigname', t: 'There\'s a pig in the sty named after somebody in the village. Nobody says who.' } }, end: true },
      clever: { line: 'season.wild.clever', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.wild.open', [
    { text: ['Seen anything interesting in the hedges, {name}?', 'What creatures have you had for company lately, {name}?'] },
    { if: { season: 'spring' }, text: ['The swallows are back, {name}! Have you seen them?', 'Everything\'s nesting, {name}. Have you got anything in your eaves?'] },
    { if: { season: 'winter' }, text: ['Have you been feeding the birds, {name}? They look hungry in this cold.', 'There was a robin on my staff this morning, {name}. Bold as brass.'] },
    { if: { pastime: 'birdwatching' }, pri: 1, text: ['How\'s the list coming along, {name}? Anything new?', 'Seen any good birds lately, {name}? I know you\'ll have counted.'] },
    { if: { job: 'herder' }, pri: 1, text: ['How are your charges, {name}? All present and correct?', 'How are the beasts keeping, {name}?'] },
    { if: { stage: 'child' }, text: ['Found any good creatures, {name}? Frogs? Beetles? Dragons?', 'What\'s the best animal you\'ve seen this week, {name}?'] },
  ]);
  lines('season.wild.start', [
    { if: { register: 'fine' }, text: ['The hedgerows are a whole society, you know. With rather better manners than ours.'] },
    { if: { register: 'plain' }, text: ['Birds. Rabbits. A fox. Same as ever.', 'Hedge is full of something. Rustles all night.'] },
    { if: { weather: 'rain' }, text: ['The blackbirds love the rain. Worms come up to see what the fuss is, and that\'s that.'] },
    { if: { kid: (k) => !!k }, text: ['{Kid} brought home a frog in a teacup. It\'s living in the sink now. We all wash in the river.'] },
    { text: ['Oh, the usual. Birds in the hedge, something in the trash cans, a cat that isn\'t mine.', 'Plenty! You can\'t move for creatures in this valley.', 'There\'s always something rustling. I\'ve stopped looking.'] },
    { if: { season: 'spring' }, text: ['The swallows are back under the eaves! Same nest as last year, I\'m sure of it.', 'Lambs in the field, frogspawn in the pond and a blackbird who won\'t stop singing at four in the morning.'] },
    { if: { season: 'summer' }, text: ['Bees in the clover, swifts screaming round the hill at dusk. Lovely racket.', 'There\'s a hedgehog who comes to the step of an evening. I leave him a saucer.'] },
    { if: { season: 'autumn' }, text: ['Rooks in the barley stubble, squirrels burying everything. Busy, busy.', 'The swallows are gathering on the fence. Lined up like they\'re waiting for a coach.'] },
    { if: { season: 'winter' }, text: ['A robin follows me round the garden like a little red foreman.', 'Fox tracks in the snow, right up to the hen house. He\'s cheeky, that one.'] },
    { if: { temper: 'ornery' }, text: ['Pigeons. On my roof. All day. Cooing. Don\'t talk to me about creatures.', 'Something\'s been in my peas. I\'ll find out what. And then.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, everything! I said good morning to a wren today and I\'m sure she nodded.', 'I love the creatures! I\'ve named all the sparrows. They don\'t know.'] },
    { if: { temper: 'shy' }, text: ['...There\'s a wren in the woodpile. I don\'t tell anyone. She\'s shy too.', '...Animals are easier than people. They don\'t expect you to say things.'] },
    { if: { temper: 'dreamy' }, text: ['An owl came and sat on the gate last night and looked at me for a long time. I think it knew something.'] },
    { if: { temper: 'witty' }, text: ['A magpie stole my spoon. A good spoon. He\'s got taste, I\'ll give him that.', 'The cat brought me a mouse. I said thank you. You have to, or they bring two.'] },
    { if: { temper: 'proud' }, text: ['Swallows nest in MY eaves, every year. They know a good hole when they see one.'] },
    { if: { temper: 'gloomy' }, text: ['A crow sits on my chimney and looks down at me. I think he\'s waiting for something.'] },
    { if: { temper: 'curious' }, text: ['I\'ve been counting how many times the blackbird sings the same song. Forty-one, then he changed it.', 'Where do hedgehogs go in winter? I want to know. I\'ve been looking under everything.'] },
    { if: { stage: 'child' }, text: ['I\'ve got a beetle in a box! His name\'s Sir Crunch.', 'I saw a FOX! He looked at me and I looked at him and then he went.', 'There\'s a toad under our step. I\'m not allowed to bring him in. I brought him in.'] },
    { if: { stage: 'elder' }, text: ['The birds are the same birds my mother pointed out to me. Their great-grandchildren, I suppose.'] },
    { if: { rift: true }, text: ['There are animals EVERYWHERE here. Back home it was rats and pigeons and the odd glitching drone-hound.', 'A bird sat on my visor. A real one. I didn\'t move for an hour.'] },
    { if: { job: 'farmer' }, pri: 1, text: ['Crows in the barley, rabbits in the turnips, and a mole making mountains in the top field. War, it is.'] },
    { if: { job: 'herder' }, pri: 1, text: ['The beasts are grand. Fed, watered, counted twice. One sheep keeps trying to escape. Every day.'] },
    { if: { job: 'orchardist' }, pri: 1, text: ['Blackbirds in the apples. They take one bite out of each, the vandals. Never the whole thing.'] },
    { if: { job: 'fisher' }, pri: 1, text: ['The otters are back on the river. Good fishers, otters. I tip my hat to them. Through gritted teeth.'] },
    { if: { pastime: 'birdwatching' }, pri: 1, text: ['A {birdNow} this morning! By the bridge! I nearly dropped my book.', 'I\'ve had a {birdNow}, two jays and something I think was a linnet. Think.'] },
    { if: { likes: 'animals' }, pri: 1, text: ['I could watch creatures all day. I do, some days. Don\'t tell the Steward.'] },
    { if: { hour: 'night' }, text: ['Hear that? The tawny owl. Ke-wick, and then the other one answers hoo.'] },
  ]);
  lines('season.wild.birds', [
    { text: ['A {birdNow}, right on the gate. Bold as you like.', 'Sparrows, mostly. Sparrows are the hobbits of birds. Always eating.'] },
    { if: { season: 'spring' }, text: ['Swallows, a cuckoo somewhere I can never find, and skylarks going straight up over the Long Meadow.'] },
    { if: { season: 'summer' }, text: ['Swifts. They never land, you know. They sleep in the air. Imagine.', 'House martins under the inn eaves. The innkeeper pretends not to like them.'] },
    { if: { season: 'autumn' }, text: ['Jays burying acorns. They forget half. That\'s how you get oak trees, Gran said.', 'Rooks. Hundreds, going home to the wood at dusk. Like smoke.'] },
    { if: { season: 'winter' }, text: ['A robin, a wren and a pair of bullfinches on the holly. Like a Yule card.', 'Fieldfares in the hawthorn. They come from the north for our berries.'] },
    { if: { pastime: 'birdwatching' }, pri: 1, text: ['Forty-three kinds this year. Forty-four if the linnet counts. It counts.', 'Let me see. *opens a little book* Treecreeper, kestrel, two moorhens and a {birdNow}.'] },
    { if: { temper: 'ornery' }, text: ['The magpie. Always the magpie. He\'s got my thimble, I know he has.'] },
    { if: { temper: 'cheerful' }, text: ['All of them! I put crumbs out and they all come and we have a lovely time.'] },
    { if: { temper: 'shy' }, text: ['...The wren. She\'s so small and so loud. I wish I was like that.'] },
    { if: { temper: 'dreamy' }, text: ['A skylark, so high up I couldn\'t see it. Just the song, coming down.'] },
    { if: { temper: 'witty' }, text: ['A pigeon. Fascinating creature. Nothing in its head but more pigeon.'] },
    { if: { temper: 'proud' }, text: ['I saw the kingfisher before anyone else this year. First. As usual.'] },
    { if: { temper: 'gloomy' }, text: ['Crows. Three of them. That\'s an omen, three. Or it\'s just three crows.'] },
    { if: { temper: 'curious' }, text: ['A treecreeper! It goes up trees like a mouse. Never down. Why never down?'] },
    { if: { stage: 'child' }, text: ['A big black one and a little brown one and a robin! Robins are my best.'] },
    { if: { stage: 'elder' }, text: ['Fewer than there were. Or my eyes are worse. One of the two.'] },
    { if: { rift: true }, text: ['I\'m learning their names. That one\'s a robin. I think. Or a very small fire.'] },
  ]);
  lines('season.wild.fav', [
    { text: ['The blackbird. For the evening song. Nothing sings like a blackbird at dusk.', 'The robin. Cheeky, red, and always around when you\'re digging.'] },
    { if: { temper: 'ornery' }, text: ['The heron. Keeps itself to itself. I respect that.'] },
    { if: { temper: 'cheerful' }, text: ['The swallow! Every spring they come back, and every spring it\'s like Yule.'] },
    { if: { temper: 'shy' }, text: ['...The wren. Small and brown and you\'d never notice. Until she sings.'] },
    { if: { temper: 'dreamy' }, text: ['The barn owl. White and silent, like a ghost who\'s kind.'] },
    { if: { temper: 'witty' }, text: ['The jackdaw. Steals, gossips, mocks everyone. My sort of bird.'] },
    { if: { temper: 'proud' }, text: ['The kestrel. Hangs in the air like it owns it. Which it does.'] },
    { if: { temper: 'gloomy' }, text: ['The rook. Black and noisy and nobody likes them. I like them.'] },
    { if: { temper: 'curious' }, text: ['The cuckoo. Lays eggs in other birds\' nests. Why? How do they know? I\'ve so many questions.'] },
    { if: { stage: 'child' }, text: ['A dragon. ...Not a bird? A robin, then. Robins look a bit like tiny dragons.'] },
    { if: { pastime: 'birdwatching' }, pri: 1, text: ['Don\'t make me choose! ...The kingfisher. No, the treecreeper. No. Kingfisher.'] },
    { if: { rift: true }, text: ['The magpie. Black and white and shiny-mad. Like the city\'s mascot.'] },
  ]);
  lines('season.wild.suits', [
    { text: ['Does it? I\'ll take that as a kindness.', 'Ha! I\'d not thought of it, but maybe.'] },
    { if: { temper: 'witty' }, text: ['Suits me? You\'re saying I\'m a thief and a gossip. Fair.'] },
    { if: { temper: 'shy' }, text: ['...That\'s nice. Thank you.'] },
  ]);
  lines('season.wild.thrush', [
    { text: ['A thrush carried a message to a king? Oh, tell me it all one day.', 'I\'ll look at the thrushes differently now. They might be carrying anything.'] },
    { if: { stage: 'child' }, text: ['Can a thrush carry a message for me? To my friend? About pudding?'] },
    { if: { temper: 'curious' }, text: ['How did it know where the king was? Do birds know things we don\'t?'] },
  ]);
  lines('season.wild.whistle', [
    { text: ['Go on, then! Let\'s hear it.', 'You, whistle? With all that beard in the way?'] },
    { if: { temper: 'witty' }, text: ['Badly? I\'ve heard you whistle. Badly\'s generous.'] },
    { if: { stage: 'child' }, text: ['DO IT! Do the blackbird! Do the owl too!'] },
    { if: { temper: 'ornery' }, text: ['Don\'t. You\'ll set the dog off.'] },
  ]);
  lines('season.wild.answered', [
    { text: ['Ha! He\'s telling you off! He\'s saying "that\'s not how it goes".', 'He answered! He sounds very cross with you.'] },
    { if: { stage: 'child' }, text: ['He ANSWERED! Do it again! Make him come over!'] },
    { if: { temper: 'witty' }, text: ['He\'s asking you to stop. Politely. For a blackbird.'] },
    { if: { temper: 'dreamy' }, text: ['Oh! You\'re talking to him. What did you say?'] },
  ]);
  lines('season.wild.teach', [
    { text: ['Purse your lips and think of dusk. That\'s the trick. Think of dusk.', 'Come by at dusk. The blackbird will teach us both.'] },
    { if: { temper: 'shy' }, text: ['...I could. If you didn\'t laugh.'] },
    { if: { temper: 'proud' }, text: ['I\'m the best whistler in the valley. You\'ll have to practice.'] },
  ]);
  lines('season.wild.list', [
    { text: ['...I keep a list, you know. Every bird I\'ve ever seen. Since I was small.', '...I write them down. The date and where. My grandfather started it, in the same book.'] },
    { if: { pastime: 'birdwatching' }, pri: 1, text: ['...Ninety-one kinds, in my whole life. I can tell you the day I saw each one.'] },
    { if: { stage: 'child' }, text: ['...I\'ve got a list! It\'s got eleven on. One\'s a bat. Bats count.'] },
    { if: { rift: true }, text: ['...I keep a list on my wrist-screen. It\'s the only thing I still use it for.'] },
  ]);
  lines('season.wild.waiting', [
    { text: ['...A golden oriole. Gran saw one, once. I\'ve looked every summer since.', '...The barn owl. In the daylight. They say it means luck. I need some luck.'] },
    { if: { stage: 'elder' }, text: ['...The waxwing. Fifty years I\'ve looked. I\'d like to see it once before I go.'] },
    { if: { stage: 'child' }, text: ['...A phoenix! ...Dad says they\'re not real. Are they real?'] },
    { if: { rift: true }, text: ['...A bird that I\'ve only seen in old pictures back home. A swallow. Real ones. ...I did. Here. I cried.'] },
  ]);
  lines('season.wild.watch', [
    { text: ['Would you? And tell me where? Oh, that would be something.', 'You\'ll write if you see one? Even just a line?'] },
    { if: { temper: 'shy' }, text: ['...Thank you. That\'s... thank you.'] },
    { if: { temper: 'ornery' }, text: ['You\'ll forget. ...You won\'t, will you. Thank you.'] },
  ]);
  lines('season.wild.dawn', [
    { text: ['Dawn. Where nobody sits. Yes. I always go where everyone goes, that\'s my trouble.', 'Huh. I\'ll try the far side of the mill pond. Nobody goes there.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I know about dawn, thank you. ...Nobody sits by the old stile. I\'ll try that.'] },
  ]);
  lines('season.wild.pests', [
    { if: { register: 'fine' }, text: ['A rabbit of considerable appetite and no conscience whatever has taken up residence among my lettuces.'] },
    { if: { pastime: 'birdwatching' }, pri: 1, text: ['I can\'t bring myself to mind the birds at my peas. I write them in the book first, then I shoo them.'] },
    { text: ['Slugs. Hundreds of them. They have parties in the lettuces at night.', 'Rabbits! Nibble, nibble, nibble, and then sit there looking innocent.'] },
    { if: { season: 'spring' }, text: ['Pigeons on the peas, rabbits on the carrots and a blackbird pulling up every seedling to check.'] },
    { if: { season: 'summer' }, text: ['Caterpillars on the cabbages. Lace, they\'ve made of them. Very fine lace.'] },
    { if: { season: 'autumn' }, text: ['Squirrels in the hazel. Not one nut left for us. Not one.', 'Wasps in the plums. You pick one up and it buzzes at you.'] },
    { if: { season: 'winter' }, text: ['Mice in the larder. They\'ve found the jam. I\'ve heard them singing.', 'A fox after the hens. Bold as a bailiff. Comes right up to the door.'] },
    { if: { temper: 'ornery' }, text: ['Everything! It\'s a conspiracy. The rabbits and the slugs are working together.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, the rabbits! I don\'t mind. I grow a row for them. They don\'t keep to it.'] },
    { if: { temper: 'witty' }, text: ['A rabbit with very good taste. He only eats the best lettuce. He\'s a gourmet.'] },
    { if: { temper: 'gloomy' }, text: ['Slugs. They always win. You can\'t beat a slug. They\'ve got time.'] },
    { if: { temper: 'proud' }, text: ['Nothing gets at my garden. Nothing would dare.'] },
    { if: { temper: 'shy' }, text: ['...A rabbit. I haven\'t the heart to shoo him. He\'s very small.'] },
    { if: { temper: 'curious' }, text: ['I put out a dish of beer to catch the slugs. They drank it and went home. Clever slugs.'] },
    { if: { stage: 'child' }, text: ['A RABBIT! Dad was SO cross. I gave the rabbit a name. It\'s Dad.'] },
    { if: { job: 'farmer' }, pri: 1, text: ['Crows. A whole parliament of them in the barley, voting on which bit to eat next.'] },
    { if: { job: 'orchardist' }, pri: 1, text: ['Wasps and blackbirds in the apples. Between them they\'d have the whole orchard.'] },
    { if: { rift: true }, text: ['Something ate my seedlings. All of them. In one night. Back home we had firewalls for that.'] },
  ]);
  lines('season.wild.tip', [
    { text: ['A scarecrow in a good hat. Crows fear a good hat.', 'Plant marigolds round the edge. The slugs go for those and leave the rest.'] },
    { if: { season: 'winter' }, text: ['Shut the hens in at dusk and put a bell on the door. Foxes hate a bell.'] },
    { if: { season: 'spring' }, text: ['Net the peas, and hang shiny things. Pigeons are vain and easily startled.'] },
  ]);
  lines('season.wild.advised', [
    { text: ['A good hat. I\'ve an old one of my uncle\'s that\'d frighten anything.', 'Marigolds! Gran said that. I\'d forgotten.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I\'ve tried everything. ...Not that, though. Fine.'] },
    { if: { temper: 'curious' }, text: ['Why marigolds? Do slugs like orange? Do they SEE orange?'] },
    { if: { temper: 'witty' }, text: ['A scarecrow in a hat. I\'ll borrow yours.'] },
    { if: { stage: 'child' }, text: ['Can I make the scarecrow? Can he be called Gandalf?'] },
  ]);
  lines('season.wild.word', [
    { text: ['Wizard to rabbit! Ha! I\'d like to see that.', 'Tell them from me they\'re very rude.'] },
    { if: { temper: 'witty' }, text: ['Speak slowly. Rabbits only understand lettuce.'] },
    { if: { stage: 'child' }, text: ['Can you REALLY talk to rabbits? What do they say?'] },
    { if: { temper: 'ornery' }, text: ['A word? Turn them into something. Something slow.'] },
  ]);
  lines('season.wild.eat', [
    { text: ['That\'s true. They don\'t mean anything by it. It\'s just dinner.', 'I suppose. I\'d eat my lettuces too, if I were a rabbit.'] },
    { if: { temper: 'ornery' }, text: ['Let them eat somebody else\'s.'] },
    { if: { temper: 'cheerful' }, text: ['You\'re right. I\'ll plant extra. Everyone\'s welcome!'] },
    { if: { temper: 'gloomy' }, text: ['Everything has to eat. Everything eats something. It\'s a bit sad, really.'] },
  ]);
  lines('season.wild.fond', [
    { text: ['...There\'s a hedgehog. I call him Old Prickles. He comes for his saucer at nine sharp.', '...A toad lives under my step. I\'ve never told anyone I talk to him.'] },
    { if: { stage: 'child' }, text: ['...The rabbit. The one that ate the lettuces. I give him bits from my plate.'] },
    { if: { likes: 'animals' }, text: ['...All of them, if I\'m honest. Don\'t tell, but I like the creatures better than the neighbors.'] },
  ]);
  lines('season.wild.soft', [
    { text: ['Soft heart! I\'ll have you know... well. Maybe a bit. Don\'t tell.', 'Hmph. A grumble\'s just a heart with its coat on.'] },
    { if: { temper: 'ornery' }, text: ['Shh! Keep your voice down. I\'ve a name to keep up.'] },
    { if: { temper: 'proud' }, text: ['Hmph. Strength and softness aren\'t opposites, wizard.'] },
  ]);
  lines('season.wild.pens', [
    { text: ['Fat and happy, from what I see. Happier than me.', 'The pigs are the cleverest beasts in the valley, and the laziest.'] },
    { if: { pens: (p) => p.includes('sheep') }, text: ['The sheep are the same as ever. One of them always faces the wrong way.'] },
    { if: { pens: (p) => p.includes('cow') }, text: ['The cows look at you like you owe them money.'] },
    { if: { pens: (p) => p.includes('pig') }, text: ['The pigs! Have you heard them at feeding time? Like a choir of trumpets.'] },
    { if: { job: 'herder' }, pri: 2, text: ['All well. Fed, watered, counted. Counted again. One sheep had a cough. Better now.', 'Grand. The cows are calm, the pigs are greedy, and the sheep are thinking about escaping.'] },
    { if: { job: 'herder', season: 'spring' }, pri: 2, text: ['Lambing! Three last night. I\'ve not slept, but look at them bounce.'] },
    { if: { job: 'herder', season: 'winter' }, pri: 2, text: ['Cold, but snug. Hay twice a day, and I break the ice on the troughs every morning.'] },
    { if: { temper: 'ornery' }, text: ['The pigs smell. The sheep are stupid. The cows stare. Otherwise lovely.'] },
    { if: { temper: 'dreamy' }, text: ['I like to lean on the fence and watch the cows think. They think slowly, like clouds.'] },
    { if: { stage: 'child' }, text: ['I\'m allowed to feed the pigs on Highday! One of them ate my sleeve.'] },
    { if: { rift: true }, text: ['Real meat walking around. Still not used to it. I said sorry to a pig yesterday.'] },
  ]);
  lines('season.wild.names', [
    { text: ['Course they do. There\'s a sheep called Dumpling, a cow called Duchess, and a pig called... I shan\'t say. You\'d know who.', 'The pig\'s called after somebody in this village. Nobody admits who named it. Everyone knows.'] },
    { if: { job: 'herder' }, pri: 1, text: ['Every one. Daisy, Bramble, Old Ruth, the Bishop. And a pig I named after the Steward. Shh.'] },
    { if: { stage: 'child' }, text: ['I named a sheep Wizard! He\'s got a beard! Well. He\'s got a lot of wool.'] },
  ]);
  lines('season.wild.clever', [
    { text: ['The pig. Easily. Cleverer than the herder? Don\'t ask the herder.', 'One of the cows can open the gate. Nobody\'s taught her. She just looks at it till it gives up.'] },
    { if: { job: 'herder' }, pri: 1, text: ['Cleverer than me? Some days. The black pig has me trained to scratch his back on the hour.'] },
    { if: { temper: 'witty' }, text: ['The sheep that faces the wrong way. She\'s seen something we haven\'t.'] },
  ]);
  // --- What's in flower, and what's in the woods ----------------------------------------------
  addThread({
    id: 'season.flowers', cool: 3, weight: 1,
    label: (F) => (F.season === 'autumn' ? 'The woods turning' : F.season === 'winter' ? 'Anything in flower?' : 'What\'s in flower'),
    rel: (F) => ((F.likes || []).includes('gardens') || (F.values || []).includes('nature') || F.job === 'herbalist' ? 1.5 : F.season === 'spring' ? 1.3 : 1),
    open: { ask: 'season.flowers.open' },
    beats: {
      start: { line: 'season.flowers.start', go: [
        { ap: 'ask', say: 'Do you pick them?', to: 'pick' },
        { ap: 'ask', say: 'And in the woods? What\'s there this time of year?', to: 'woods' },
        { ap: 'share', say: 'I keep a pressed flower in my hat-band. Don\'t tell anyone.', to: 'pressed' },
      ] },
      pick: { line: 'season.flowers.pick', go: [
        { ap: 'ask', say: 'And who are they for?', to: 'for', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'For the table, or for knocking over the vase?', to: 'vase' },
        { ap: 'advise', say: 'Leave a few for the bees. They\'ve the prior claim.', to: 'bees' },
      ] },
      for: { line: 'season.flowers.for', go: [
        { ap: 'warm', say: 'Then they\'re lucky. Whoever they are.', to: 'lucky' },
        { ap: 'advise', say: 'Give them in person next time. Flowers on a doorstep never say who.', to: 'person', need: { if: { spouse: (s) => !s, stage: ['grown', 'elder'] } } },
        { ap: 'jest', say: 'And do they know they\'re being courted with buttercups?', to: 'courted', need: { if: { spouse: (s) => !s, stage: ['grown', 'elder'] } } },
        { ap: 'share', say: 'I gave someone flowers once. They put them in the teapot. With the tea.', to: 'teapotvase' },
      ] },
      teapotvase: { line: 'season.flowers.teapotvase', fx: { fond: 0.02 }, end: true },
      lucky: { line: 'season.flowers.lucky', fx: { fond: 0.02 }, end: true },
      person: { line: 'season.flowers.person', fx: { confide: { k: 'season.flowersfor', t: '{Name} leaves flowers on somebody\'s doorstep and won\'t say whose', secret: true }, respect: 0.02 }, go: [
        { ap: 'warm', say: 'Your secret\'s safe. But do think about it.', to: 'think' },
        { ap: 'ask', say: 'Will you tell me who?', to: 'who', need: { trust: 0.3 }, soft: true },
      ] },
      think: { line: 'season.flowers.think', fx: { trust: 0.03 }, end: true },
      who: { line: 'season.flowers.who', fx: { trust: 0.04, fond: 0.02 }, end: true },
      courted: { line: 'season.flowers.courted', fx: { joke: { k: 'season.buttercups', t: 'Courting with buttercups. The wizard knows.' } }, end: true },
      vase: { line: 'season.flowers.vase', end: true },
      bees: { line: 'season.flowers.bees', fx: { respect: 0.01 }, end: true },
      woods: { line: 'season.flowers.woods', go: [
        { ap: 'ask', say: 'And the great party tree? How\'s the old fellow?', to: 'tree' },
        { ap: 'tale', say: 'There\'s a forest far off where the trees walk, very slowly, when nobody\'s looking.', to: 'tale' },
        { ap: 'warm', say: 'Shall we go and look, one of these days? You can show me the best of it.', to: 'walk', need: { fond: 0.1 }, soft: true },
      ] },
      tree: { line: 'season.flowers.tree', go: [
        { ap: 'ask', say: 'Did you ever carve your name in it?', to: 'carved', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'May it see a hundred more parties.', to: 'end' },
      ] },
      carved: { line: 'season.flowers.carved', fx: { confide: { k: 'season.carved', t: 'Somewhere on the great party tree, {name} once carved two sets of letters', secret: true } }, go: [
        { ap: 'warm', say: 'Trees keep secrets better than anyone. So do I.', to: 'keep' },
        { ap: 'ask', say: 'And whose were the other letters?', to: 'letters', need: { trust: 0.3 }, soft: true },
      ] },
      keep: { line: 'season.flowers.keep', fx: { trust: 0.03 }, end: true },
      letters: { line: 'season.flowers.letters', fx: { trust: 0.04 }, end: true },
      tale: { line: 'season.flowers.tale', fx: { fond: 0.02 }, end: true },
      walk: { line: 'season.flowers.walk', fx: { fond: 0.03, feel: 'liked', feelX: 'the idea of a walk in the woods with the wizard' }, end: true },
      pressed: { line: 'season.flowers.pressedback', go: [
        { ap: 'ask', say: 'Do you keep any? Pressed, in a book?', to: 'book' },
        { ap: 'tale', say: 'It\'s from a garden a long way off, given me by someone long ago.', to: 'given' },
      ] },
      book: { line: 'season.flowers.book', fx: { learn: ['season.pressed', '{Name} keeps pressed flowers in a book'] }, end: true },
      given: { line: 'season.flowers.given', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.flowers.open', [
    { text: ['What\'s in flower, {name}? My eyes are older than my nose.', 'I passed {flowerNow} on the way here, {name}. Is it the season for them?'] },
    { if: { season: 'spring' }, text: ['The banks are full of {flowerNow}, {name}. Have you seen?', 'Spring\'s put on its best, {name}. Every hedge in bloom.'] },
    { if: { season: 'autumn' }, text: ['The woods have gone copper, {name}. Have you been up there?', 'Mushrooms everywhere this morning, {name}. Is it a good year for them?'] },
    { if: { season: 'winter' }, text: ['Is anything in flower in this cold, {name}?', 'I found {flowerNow} in the snow, {name}. Brave little things.'] },
    { if: { stage: 'child' }, text: ['Have you picked any flowers, {name}? What color were they?', 'What\'s the best flower, {name}? I need to know for a wizard reason.'] },
  ]);
  lines('season.flowers.start', [
    { if: { register: 'fine' }, text: ['The verges are a perfect riot of color. One feels one ought to send a note of thanks.'] },
    { if: { register: 'plain' }, text: ['Flowers. Lots. Yellow ones mostly. Pretty.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse} brought me a fistful of {flowerNow} this morning. Roots and all. Still lovely.'] },
    { if: { hour: 'evening' }, text: ['The honeysuckle comes out strongest in the evening. Smell that. That\'s the lane at dusk.'] },
    { text: ['{FlowerNow}, mostly. And whatever the bees are after.', 'Oh, all sorts. I can\'t name half of them. I just like them.', 'The hedges are full. Go and look, you\'ll see.'] },
    { if: { season: 'spring' }, text: ['Primroses on the banks, bluebells in the wood, and cowslips in the Long Meadow. It\'s like a party.', 'Blossom on everything. The apple trees look like brides.'] },
    { if: { season: 'summer' }, text: ['Foxgloves by the woods, poppies in the barley, dog-roses in every hedge.', 'Clover. The whole field\'s clover, and the bees are drunk on it.'] },
    { if: { season: 'autumn' }, text: ['Not much flowering now. Michaelmas daisies, a bit of heather. It\'s all berries and mushrooms.', 'The flowers are going over. But the woods! Copper and gold. Better than flowers.'] },
    { if: { season: 'winter' }, text: ['Snowdrops, if you look. Under the hedge by the mill. Little white lanterns.', 'Holly berries and not much else. The garden\'s asleep. I tiptoe.'] },
    { if: { temper: 'ornery' }, text: ['Thistles. In my garden. Again. That\'s what\'s in flower.', 'Dandelions. Everywhere. I pull one and two come back.'] },
    { if: { temper: 'cheerful' }, text: ['Everything! I put a flower behind my ear every morning. Today\'s is a daisy.'] },
    { if: { temper: 'shy' }, text: ['...Harebells. Up on the dry bank. Nobody looks at them. I do.'] },
    { if: { temper: 'dreamy' }, text: ['Have you ever lain down in the bluebells and looked up? It\'s like being under the sea.'] },
    { if: { temper: 'witty' }, text: ['Whatever the goats haven\'t eaten. Which is very little, and mostly nettles.'] },
    { if: { temper: 'proud' }, text: ['My roses. Best in the lane. Twelve years I\'ve been at them.'] },
    { if: { temper: 'gloomy' }, text: ['Everything\'s flowering. It\'ll all be dead in a month. Lovely while it lasts.'] },
    { if: { temper: 'curious' }, text: ['I\'ve been pulling flowers apart to see how they\'re made. Don\'t tell the gardeners.'] },
    { if: { stage: 'child' }, text: ['I made a daisy chain! It\'s THIS long. I put it on the cat.', 'Buttercups! If you hold one under your chin and it goes yellow, you like butter. I like butter.'] },
    { if: { stage: 'elder' }, text: ['Same flowers in the same places. They don\'t change. I like that, at my age.'] },
    { if: { rift: true }, text: ['Flowers that grow out of the ground on their own. Nobody planted them. I can\'t get over it.', 'Back home flowers were printed. This one smells. They SMELL.'] },
    { if: { job: 'herbalist' }, pri: 1, text: ['Feverfew, mint, yarrow, self-heal. Everything I need for the winter coughs, if I get it in now.'] },
    { if: { job: 'orchardist', season: 'spring' }, pri: 1, text: ['Apple blossom. The whole orchard. If the frost keeps off, it\'s a good year.'] },
    { if: { job: 'farmer' }, pri: 1, text: ['Poppies in the barley, which means weeds in the barley. Pretty, though. I\'ll grant them that.'] },
    { if: { likes: 'gardens' }, pri: 1, text: ['Let me tell you about my sweet peas. No, let me show you. No, let me tell you.'] },
    { if: { weather: 'rain' }, text: ['Everything\'s drinking. You can smell the flowers twice as strong in the rain.'] },
  ]);
  lines('season.flowers.pick', [
    { text: ['A few. A jar on the table. It cheers the place up.', 'Now and then. You can\'t walk past a bank of {flowerNow} and not take some.'] },
    { if: { temper: 'ornery' }, text: ['Pick them? They grow, they die. I leave them be. ...I picked one. Once.'] },
    { if: { temper: 'cheerful' }, text: ['Armfuls! The whole hole looks like a flower show.'] },
    { if: { temper: 'shy' }, text: ['...Sometimes. Little ones. Where nobody can see I\'ve picked them.'] },
    { if: { temper: 'dreamy' }, text: ['I pick one each day and press it. A whole year in a book. Every day.'] },
    { if: { temper: 'witty' }, text: ['I pick them, the cat eats them, I pick more. It\'s a cycle.'] },
    { if: { temper: 'proud' }, text: ['I arrange them. There\'s an art to it. Most people just jam them in a jug.'] },
    { if: { temper: 'gloomy' }, text: ['Sometimes. They don\'t last. I keep doing it anyway.'] },
    { if: { temper: 'curious' }, text: ['I pick one of every kind I find. I\'m on forty. Forty-one with that weed. It\'s a weed, but it counts.'] },
    { if: { stage: 'child' }, text: ['I pick them for Mom! She puts them in a cup. Even the dandelions.', 'I picked ALL the buttercups in the field. Well. Nearly. There were a lot.'] },
    { if: { stage: 'elder' }, text: ['My hands are too stiff for the stems now. The little ones pick them for me.'] },
    { if: { spouse: (s) => !!s }, text: ['Every Highday, for {spouse}. Thirty years. Never missed one.'] },
    { if: { rift: true }, text: ['I picked one and felt guilty. Like I\'d stolen something from the ground.'] },
  ]);
  lines('season.flowers.for', [
    { text: ['For the house. For me. For whoever comes in the door.', '...For somebody. That\'s all I\'m saying.'] },
    { if: { spouse: (s) => !!s }, pri: 1, text: ['For {spouse}. Who else? Even when we\'ve quarreled. Especially then.', '{Spouse} pretends not to notice. Then puts them in the best jug.'] },
    { if: { spouse: (s) => !s, stage: ['grown', 'elder'] }, text: ['...For nobody. ...For somebody. I leave them on a doorstep. They don\'t know it\'s me.', '...There\'s someone. I leave them on the step and run. Like a child. Don\'t laugh.'] },
    { if: { kid: (k) => !!k }, text: ['For {kid}. {Kid} puts them in the bath and calls it a pond.'] },
    { if: { stage: 'child' }, text: ['For my best friend! And for Mom. And one for you. Here. It\'s a bit squashed.'] },
    { if: { stage: 'elder', spouse: (s) => !s }, pri: 1, text: ['...For the stone up the hill. Someone I used to pick them for. I still do.'] },
    { if: { temper: 'ornery' }, text: ['None of your business. ...The neighbor\'s old aunt. She\'s nobody else.'] },
  ]);
  lines('season.flowers.lucky', [
    { text: ['...I hope they think so.', 'That\'s nice of you. I\'ll tell them a wizard said so. No I won\'t.'] },
    { if: { temper: 'shy' }, text: ['...*goes pink*'] },
    { if: { temper: 'ornery' }, text: ['Lucky? They\'re getting flowers. Not a pony.'] },
    { if: { stage: 'child' }, text: ['YOU\'RE lucky. I gave you one!'] },
  ]);
  lines('season.flowers.person', [
    { text: ['...In person? I\'d go red as a poppy and drop them.', '...Maybe. One day. When I\'ve the nerve.'] },
    { if: { temper: 'shy' }, pri: 1, text: ['...I couldn\'t. I couldn\'t. ...Could I?'] },
    { if: { temper: 'proud' }, text: ['I don\'t hide. ...I\'ve been hiding. You\'re right. Hmph.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! You\'re right. What\'s the worst that happens? They say no and I\'ve still got flowers.'] },
    { if: { temper: 'gloomy' }, text: ['...They\'d only laugh. ...Wouldn\'t they?'] },
  ]);
  lines('season.flowers.think', [
    { text: ['I will. I\'ll think about it all night now. Thank you very much.', '...I\'ll think about it. Don\'t look at me like that.'] },
    { if: { temper: 'shy' }, text: ['...Thank you for not asking who.'] },
  ]);
  lines('season.flowers.who', [
    { text: ['...No. Not yet. But you\'ll be the first to know, if it comes to anything.', '...Somebody who sings at the Badger on Mersdays. That\'s all you\'re getting.'] },
    { if: { friend: (f) => !!f }, pri: 1, text: ['...Promise you won\'t tell {friend}? {Friend} would never let me hear the end of it.'] },
    { if: { temper: 'witty' }, text: ['A clue: they\'re not a wizard. Sorry.'] },
  ]);
  lines('season.flowers.courted', [
    { text: ['Courted! It\'s not courting! ...What would you call it, then?', 'Buttercups are a perfectly good flower to court with, thank you.'] },
    { if: { temper: 'witty' }, text: ['Buttercups say "I like you". Roses say "I\'ve got money". I haven\'t.'] },
    { if: { temper: 'ornery' }, text: ['Courting! Hmph! ...Keep your voice down.'] },
    { if: { temper: 'shy' }, text: ['...Is it that obvious?'] },
  ]);
  lines('season.flowers.vase', [
    { text: ['Ha! Both, usually. I\'m not a careful arranger.', 'I\'ve broken three jugs this year. The flowers were fine.'] },
    { if: { temper: 'proud' }, text: ['I\'ll have you know I\'ve never knocked over a vase. The cat has.'] },
    { if: { stage: 'child' }, text: ['I knocked it over and the water went on Dad\'s book. It was an accident. Mostly.'] },
  ]);
  lines('season.flowers.bees', [
    { text: ['Quite right. I always leave the best clump. They work harder than I do.', 'Ha! The bees and I have an understanding. They get first pick.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['The bees can manage. ...I leave them plenty anyway. Hmph.'] },
    { if: { temper: 'curious' }, text: ['Do bees mind? Do they notice when a flower\'s gone?'] },
    { if: { stage: 'child' }, text: ['I got stung once. It was my fault. I sat on him.'] },
  ]);
  lines('season.flowers.woods', [
    { text: ['Oh, the woods are always full of something. Moss and mushrooms and quiet.', 'Every season the woods are a different place. Same trees, different place.'] },
    { if: { season: 'spring' }, text: ['Bluebells, from one end to the other, like a lake. And wild garlic. You can smell it from the lane.'] },
    { if: { season: 'summer' }, text: ['Foxgloves in the clearings, and it\'s cool under the trees. Best place on a hot day.'] },
    { if: { season: 'autumn' }, text: ['Mushrooms! Chanterelles and hedgehogs and the fat brown ones. And conkers everywhere.', 'Copper and gold and red. You walk through it like walking through a fire that isn\'t hot.'] },
    { if: { season: 'winter' }, text: ['Bare and quiet. You can see right through to the far side. The woods are honest in winter.', 'Holly and ivy, and the robins in the brambles. And deer tracks, if you\'re lucky.'] },
    { if: { temper: 'ornery' }, text: ['Brambles. They grab your sleeve like they want a word.'] },
    { if: { temper: 'dreamy' }, text: ['The woods feel older than the village. Like they\'re waiting for us to leave so they can talk.'] },
    { if: { temper: 'gloomy' }, text: ['It\'s dark in the woods. I like that. You can be sad without anyone asking why.'] },
    { if: { temper: 'curious' }, text: ['There\'s a ring of mushrooms in the clearing. A perfect ring. Who made it? I need to know.'] },
    { if: { temper: 'witty' }, text: ['Trees. Lots of them. Standing about, not doing anything. Like the Moot.'] },
    { if: { temper: 'shy' }, text: ['...It\'s quiet there. The trees don\'t look at you.'] },
    { if: { stage: 'child' }, text: ['We made a den! You\'re not allowed to know where. It\'s by the fallen tree. Oh no.', 'CONKERS. Hundreds. I\'ve got a whole sock full.'] },
    { if: { stage: 'elder' }, text: ['I knew those trees when they were saplings. Some of them. They\'ve done better than me.'] },
    { if: { rift: true }, text: ['So many trees nobody\'s counting. It\'s the biggest server farm I\'ve ever seen, only green.'] },
    { if: { job: 'woodwright' }, pri: 1, text: ['Good timber in the east wood. I mark the ones to fell and leave the old giants be.'] },
    { if: { job: 'herbalist' }, pri: 1, text: ['Woodruff, wood sorrel, and a patch of something I\'m not telling anyone about. For the coughs.'] },
  ]);
  lines('season.flowers.tree', [
    { text: ['The party tree! Oldest thing in the valley. It\'s seen more dancing than the fiddler.', 'Still standing, still spreading. It holds the lanterns like it was born to.'] },
    { if: { season: 'spring' }, text: ['Coming into leaf. A green haze on it, like it\'s thinking about it.'] },
    { if: { season: 'autumn' }, text: ['Dropping its leaves on everyone at the Harvest Feast. Gravy and leaves.'] },
    { if: { season: 'winter' }, text: ['Bare, with snow on every branch. Still the best tree. We\'ll hang the Yule lanterns soon.'] },
    { if: { temper: 'dreamy' }, text: ['I think it remembers every party. Every dance. Every promise made under it.'] },
    { if: { temper: 'proud' }, text: ['Finest tree in the Shire. I\'ve been to Bree. They\'ve nothing like it.'] },
    { if: { temper: 'ornery' }, text: ['Drops twigs on my hat every time I sit under it. It knows.'] },
    { if: { stage: 'child' }, text: ['I climbed it! Up to the first bit! Then I had to be got down.'] },
    { if: { stage: 'elder' }, text: ['I was married under that tree. And my mother before me. It\'s taller now. So\'s everyone.'] },
    { if: { party: true }, pri: 1, text: ['Look at it tonight! All lanterns. Like it\'s wearing its jewels.'] },
  ]);
  lines('season.flowers.carved', [
    { text: ['...Once. When I was young and daft. On the far side, low down. Two sets of letters.', '...There might be some letters. Low on the north side. I was very young.'] },
    { if: { spouse: (s) => !!s }, pri: 1, text: ['...Mine and {spouse}\'s. On the back, by the root. Before we\'d ever said a word to each other.'] },
    { if: { stage: 'child' }, text: ['...I did a W! For Wizard. ...No, for me. Don\'t tell.'] },
    { if: { temper: 'shy' }, text: ['...Small ones. Very small. You\'d have to know where to look.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Yes. And I\'ve regretted it for forty years. ...Not really.'] },
  ]);
  lines('season.flowers.keep', [
    { text: ['That\'s true. The tree\'s never said a word.', 'Thank you. It was a long time ago.'] },
    { if: { temper: 'dreamy' }, text: ['I like to think the tree remembers them for me.'] },
  ]);
  lines('season.flowers.letters', [
    { text: ['...Someone who left for Bree, long ago. I don\'t know if they\'re still alive.', '...Someone who\'s still here. Who walks past that tree every day and doesn\'t know.'] },
    { if: { spouse: (s) => !!s }, pri: 1, text: ['{Spouse}\'s, of course. Who else would it be? ...Well. There was one other, before.'] },
    { if: { stage: 'elder' }, text: ['...Someone from long ago. They\'ve a stone on the hill now. The letters are still sharp.'] },
  ]);
  lines('season.flowers.tale', [
    { text: ['Walking trees! I\'ll never sleep near the wood again.', 'Slowly, when nobody\'s looking. That would explain my path. It moves.'] },
    { if: { stage: 'child' }, text: ['Do OUR trees walk? Is that why the den moved?'] },
    { if: { temper: 'ornery' }, text: ['Nonsense. ...Which way do they walk?'] },
    { if: { temper: 'dreamy' }, text: ['I knew it. I always knew it. You can feel them thinking.'] },
    { if: { temper: 'curious' }, text: ['Where do they go? Do they ever come back? Have you seen one?'] },
  ]);
  lines('season.flowers.walk', [
    { text: ['Would you? I know a path nobody uses. We\'ll go when the weather\'s kind.', 'Yes! I\'ll show you the mushroom ring. And the badger sett.'] },
    { if: { temper: 'shy' }, text: ['...I\'d like that. Just us? Not a crowd?'] },
    { if: { temper: 'ornery' }, text: ['If you keep up. And don\'t talk the whole way.'] },
    { if: { stage: 'child' }, text: ['YES! I\'ll show you the den! You have to swear first.'] },
  ]);
  lines('season.flowers.pressedback', [
    { text: ['You? A flower in your hat? You soft old thing.', 'Ha! I\'d never have guessed. What sort of flower?'] },
    { if: { temper: 'witty' }, text: ['I always wondered what kept that hat up. Sentiment.'] },
    { if: { temper: 'dreamy' }, text: ['Oh, that\'s lovely. Who gave it you?'] },
    { if: { stage: 'child' }, text: ['Can I SEE it? Is it a magic flower?'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Sentimental wizards. ...What color?'] },
  ]);
  lines('season.flowers.book', [
    { text: ['A whole book of them. Every one\'s a day I remember.', 'In my mother\'s old recipe book. Between the pies. Primroses on the apple tart page.'] },
    { if: { temper: 'dreamy' }, pri: 1, text: ['Three books. I open them in winter and it\'s spring for a minute.'] },
    { if: { temper: 'ornery' }, text: ['One. A cowslip. Don\'t ask why.'] },
    { if: { stage: 'child' }, text: ['I tried! I squashed it in Dad\'s big book. It went brown. And so did the page.'] },
    { if: { pastime: 'collecting' }, pri: 1, text: ['Pressed flowers are a whole drawer of my collection. Labeled. In ink.'] },
  ]);
  lines('season.flowers.given', [
    { text: ['...Oh. That\'s a lovely thing to carry. And a sad one.', 'Long ago. They must have been special. I won\'t pry.'] },
    { if: { temper: 'curious' }, text: ['Who? No. Don\'t say. But I\'ll wonder.'] },
    { if: { temper: 'witty' }, text: ['A wizard with a love story. The village will be insufferable.'] },
  ]);

  // --- The stars and the moon -------------------------------------------------------------------
  const MOON_LABEL = { full: 'The full moon', new: 'A moonless night', waxing: 'The moon coming on', waning: 'The old moon' };
  addThread({
    id: 'season.stars', cool: 2, weight: 1,
    label: (F) => (F.weather === 'clear' && F.moon ? MOON_LABEL[F.moon] : 'The night sky'),
    when: (F) => !!F.dark || F.hour === 'night' || F.hour === 'evening',
    rel: (F) => (F.weather === 'clear' ? (F.dark ? 1.8 : 1.2) : 0.5),
    open: { warm: 'season.stars.open' },
    beats: {
      start: { line: 'season.stars.start', go: [
        { ap: 'ask', say: 'Do you know their names?', to: 'names' },
        { ap: 'share', say: 'season.stars.share', label: 'Tell them of the stars over the far mountains', to: 'mountains' },
        { ap: 'ask', say: 'Have you ever wished on a falling one?', to: 'wish', need: { open: 1 }, soft: true },
      ] },
      names: { line: 'season.stars.names', go: [
        { ap: 'ask', say: 'Who taught you those?', to: 'taught' },
        { ap: 'jest', say: 'That one there is clearly a teapot.', to: 'teapot' },
        { ap: 'ask', say: 'And the moon? What\'s she up to tonight?', to: 'moon' },
      ] },
      taught: { line: 'season.stars.taught', fx: { trust: 0.02 }, end: true },
      teapot: { line: 'season.stars.teapot', fx: { joke: { k: 'season.teapot', t: 'There\'s a teapot in the stars, if you squint. The wizard found it.' }, fond: 0.02 }, end: true },
      moon: { line: 'season.stars.moon', go: [
        { ap: 'warm', say: 'She looks kindly on the valley, I think.', to: 'kindly' },
        { ap: 'jest', say: 'Made of cheese, I\'m told. A good crumbly one.', to: 'cheese' },
      ] },
      kindly: { line: 'season.stars.kindly', end: true },
      cheese: { line: 'season.stars.cheese', end: true },
      mountains: { line: 'season.stars.mountains', go: [
        { ap: 'tale', say: 'The elves named every one, long before there were hobbits to look up.', to: 'elves' },
        { ap: 'warm', say: 'But they\'re friendliest here, over the round doors.', to: 'here' },
      ] },
      elves: { line: 'season.stars.elves', fx: { fond: 0.02 }, go: [
        { ap: 'tale', say: 'The brightest they call the Star of Evening. A sailor carries it, they say.', to: 'sailor' },
        { ap: 'ask', say: 'What would you name one, if it were yours?', to: 'nameone' },
      ] },
      sailor: { line: 'season.stars.sailor', fx: { feel: 'liked', feelX: 'the wizard\'s story of the stars' }, end: true },
      nameone: { line: 'season.stars.nameone', fx: { learn: ['season.star', '{Name} would name a star after someone dear'] }, end: true },
      here: { line: 'season.stars.here', end: true },
      wish: { line: 'season.stars.wish', go: [
        { ap: 'ask', say: 'And what did you wish?', to: 'what', need: { trust: 0.2 }, soft: true },
        { ap: 'warm', say: 'Then I hope it comes true. Stars are honest, mostly.', to: 'hope' },
        { ap: 'share', say: 'I wished on one, once. A long time ago. It took its time.', to: 'wizwish' },
      ] },
      what: { line: 'season.stars.what', fx: { confide: { k: 'season.starwish', t: 'the wish {name} made on a falling star', secret: true } }, go: [
        { ap: 'warm', say: 'Then I\'ll keep it, and say nothing, and hope.', to: 'kept' },
        { ap: 'comfort', say: 'Wishes that are said aloud to a friend come true more often.', to: 'aloud' },
      ] },
      kept: { line: 'season.stars.kept', fx: { trust: 0.04 }, end: true },
      aloud: { line: 'season.stars.aloud', fx: { trust: 0.03, fond: 0.02 }, end: true },
      hope: { line: 'season.stars.hope', end: true },
      wizwish: { line: 'season.stars.wizwish', fx: { trust: 0.03 }, go: [
        { ap: 'jest', say: 'I wished for a better hat. Look how that turned out.', to: 'hat' },
        { ap: 'share', say: 'I wished to find somewhere that felt like home. I think it came true. Slowly.', to: 'home', need: { fond: 0.2 }, soft: true },
      ] },
      hat: { line: 'season.stars.hat', fx: { joke: { k: 'season.hatwish', t: 'The wizard wished on a star for a better hat. The star said no.' } }, end: true },
      home: { line: 'season.stars.home', fx: { fond: 0.04, trust: 0.03 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.stars.open', [
    { text: ['Look up, {name}. Have you ever seen so many?', 'A fine sky tonight, {name}.', 'The stars are out, {name}. Every last one of them.'] },
    { if: { moon: 'full' }, text: ['Look at that moon, {name}. You could read by it.', 'Full moon tonight, {name}. The whole valley\'s silver.'] },
    { if: { moon: 'new' }, text: ['No moon tonight, {name}. Just the stars, and more of them than you\'d think.'] },
    { if: { weather: ['cloudy', 'rain', 'fog', 'snow'] }, text: ['No stars tonight, {name}. The sky\'s got its blanket on.', 'Clouds over the stars, {name}. They\'re still up there, behind it.'] },
    { if: { stage: 'child' }, text: ['Shouldn\'t you be in bed, {name}? Look up first, though.', 'Have you counted the stars yet, {name}? I lose count at nine.'] },
  ]);
  lines('season.stars.start', [
    { if: { register: 'fine' }, text: ['On a night like this one feels the whole firmament is leaning down to listen.'] },
    { if: { register: 'plain' }, text: ['Lot of stars. Can\'t count them. Tried.', 'Clear night. Cold one coming.'] },
    { if: { kid: (k) => !!k }, text: ['{Kid} won\'t go to bed till we\'ve said goodnight to the bright one. Every night. I don\'t mind.'] },
    { text: ['Isn\'t it something? I come out every night, just to look.', 'Makes you feel small. In a nice way. Like a pudding in a big dish.', 'Every one of them\'s been there since before the first hobbit. Imagine.'] },
    { if: { moon: 'full' }, text: ['The moon\'s so bright the owls are wearing hats. Well, they should be.', 'Full moon. The dogs are howling and the hens won\'t settle. I love it.'] },
    { if: { moon: 'new' }, text: ['No moon. It\'s dark as a pocket on the lanes. I walked into the gate.', 'Moonless nights are the best for stars. They don\'t have to share.'] },
    { if: { moon: 'waxing' }, text: ['The moon\'s growing. Gran said you plant beans when the moon\'s growing.'] },
    { if: { moon: 'waning' }, text: ['An old moon, getting thinner. Comes up late, like a hobbit after a party.'] },
    { if: { weather: ['cloudy', 'rain', 'fog', 'snow'] }, pri: 1, text: ['Can\'t see a thing. I know they\'re there, though. I say goodnight anyway.', 'Clouds. No stars tonight. The sky\'s keeping them to itself.'] },
    { if: { temper: 'ornery' }, text: ['Stars. Yes. Very pretty. I\'m only out because the cat won\'t come in.'] },
    { if: { temper: 'cheerful' }, text: ['Aren\'t they lovely? Like someone\'s spilled a whole jar of sugar.'] },
    { if: { temper: 'shy' }, text: ['...I like the night. Nobody\'s about. It\'s just me and them.'] },
    { if: { temper: 'dreamy' }, text: ['Do you think anyone\'s looking back? From up there? I wave, sometimes. Just in case.', 'I could lie on the grass all night and fall up into them.'] },
    { if: { temper: 'witty' }, text: ['The stars are out. Somebody should tell them it\'s past their bedtime.'] },
    { if: { temper: 'proud' }, text: ['Best stars in the Shire, ours. No smoke, no Bree lamps. Clear as glass.'] },
    { if: { temper: 'gloomy' }, text: ['They\'re so far away. Everything is, at night.', 'They\'ll be there long after we\'re gone. That\'s either a comfort or it isn\'t.'] },
    { if: { temper: 'curious' }, text: ['Why do some twinkle and some don\'t? I\'ve been watching. The red one doesn\'t.'] },
    { if: { stage: 'child' }, text: ['I\'m counting them! I\'m on two hundred and... I lost it. ONE. Two.', 'I\'m not supposed to be up. Don\'t tell. Look! A really bright one!'] },
    { if: { stage: 'elder' }, text: ['I\'ve looked at these same stars for ninety years. They\'re the only things that haven\'t got older.'] },
    { if: { rift: true }, pri: 1, text: ['In Neverdark there were no stars. Only the signs. I didn\'t know the sky did this.', 'Stars. Real ones. The city\'s getting a few now, they say on the Relay. We had to come here to see them first.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse} and I sit out on the step on nights like this. Not saying anything.'] },
    { if: { season: 'winter' }, text: ['Winter stars are the sharpest. Cold makes them ring like little bells.'] },
    { if: { season: 'summer' }, text: ['Summer nights never get properly dark. The stars come out pale, like they\'ve just woken.'] },
    { if: { fwLately: true }, text: ['After your fireworks, the real stars look a bit shy, don\'t they?'] },
  ]);
  lines('season.stars.share', [
    { text: ['Over the far mountains the stars are so close you could knock one down with a staff.', 'In the high passes the stars are thick as frost. I\'ve slept under them more nights than I\'ve slept indoors.'] },
    { if: { moon: 'full' }, text: ['I once crossed a whole mountain by the light of a moon like this one.'] },
  ]);
  lines('season.stars.names', [
    { if: { register: 'fine' }, text: ['A few of the better-known figures. The Sickle, the Plow, and that rather dashing fellow, the Lantern-bearer.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse} named one after me once. That faint one there. I chose to take it kindly.'] },
    { text: ['A few. That\'s the Sickle, there, for cutting barley. And the Plow, pointing north.', 'The Lantern-bearer. See? The bright one, and the three in a line for his arm.'] },
    { if: { stage: 'elder' }, text: ['All of them, once. The Sickle, the Plow, the Hen and Chicks, the Lantern-bearer. I\'m losing a few now.'] },
    { if: { temper: 'ornery' }, text: ['Names? They\'re stars. That one\'s "star", that one\'s "another star".'] },
    { if: { temper: 'cheerful' }, text: ['I make my own up! That\'s the Dancing Pig. That\'s Uncle Bob\'s Nose.'] },
    { if: { temper: 'shy' }, text: ['...Only one. The little cluster. The Hen and Chicks. She\'s my favorite.'] },
    { if: { temper: 'dreamy' }, text: ['I know them by the stories, not the names. That one\'s the lady who waits.'] },
    { if: { temper: 'witty' }, text: ['That one\'s the Sickle. That one\'s the Plow. Farmers named the sky. Can you tell?'] },
    { if: { temper: 'proud' }, text: ['Every one worth knowing. My grandfather was a great one for stars. He taught me the lot.'] },
    { if: { temper: 'gloomy' }, text: ['A few. Not that it matters. They don\'t know mine.'] },
    { if: { temper: 'curious' }, text: ['I\'ve been making a chart! Every clear night. The Sickle moves round, you know. Slowly.'] },
    { if: { stage: 'child' }, text: ['That\'s the Big Spoon! And that one\'s a DRAGON. Mom says it\'s a plow. It\'s a dragon.'] },
    { if: { rift: true }, text: ['Not yet. The hill-folk are teaching me. I keep calling the Plow "the Shopping Cart".'] },
    { if: { job: 'farmer' }, pri: 1, text: ['The Sickle, the Plow and the Seed-bag. When the Sickle stands up, it\'s harvest. Never fails.'] },
  ]);
  lines('season.stars.taught', [
    { text: ['My grandmother, on the step, with a cup of cocoa and a very long finger.', 'Nobody. I looked till they started to look like things.'] },
    { if: { parent: (p) => !!p }, text: ['{Parent}. We\'d go out on the hill on clear nights. I was always cold and always happy.'] },
    { if: { stage: 'child' }, text: ['The storyteller! At school. And Dad, but Dad gets them wrong.'] },
    { if: { rift: true }, text: ['A hill-hobbit child. She was very stern about it. I had a test.'] },
    { if: { stage: 'elder' }, text: ['My father, more than eighty years gone. I hear his voice every time I find the Plow.'] },
  ]);
  lines('season.stars.teapot', [
    { text: ['A teapot! Ha! Oh, it is, though. There\'s the spout.', 'You\'re right! How did nobody see that before?'] },
    { if: { temper: 'witty' }, text: ['A teapot. Of course a hobbit\'s wizard would find a teapot.'] },
    { if: { temper: 'ornery' }, text: ['That\'s the Lantern-bearer. ...It does look like a teapot. Hmph.'] },
    { if: { stage: 'child' }, text: ['A TEAPOT! I\'m telling everyone! It\'s called the Wizard\'s Teapot now!'] },
    { if: { temper: 'proud' }, text: ['Nonsense. My grandfather named that. ...Though there is a spout.'] },
  ]);
  lines('season.stars.moon', [
    { text: ['Doing what she does. Watching us. Lighting the lane.', 'She\'s pulling the river about, they say. And my moods.'] },
    { if: { moon: 'full' }, text: ['Full as a pie. Bright enough to see the colors of the flowers. Nearly.', 'She\'s round and showing off. Every owl in the valley\'s out hunting.'] },
    { if: { moon: 'new' }, text: ['Hiding. She does that. Comes back thin and shy in a day or two.'] },
    { if: { moon: 'waxing' }, text: ['Getting fatter. Like the rest of us before Yule.'] },
    { if: { moon: 'waning' }, text: ['Getting thinner, coming up late. She looks tired. I know the feeling.'] },
    { if: { weather: ['cloudy', 'rain', 'fog', 'snow'] }, pri: 1, text: ['Behind the clouds, sulking. You can see a pale patch where she is.'] },
    { if: { temper: 'dreamy' }, text: ['She\'s the same moon everyone sees. Even the ones far away. I find that a comfort.'] },
    { if: { stage: 'child' }, text: ['She\'s following me! Every time I walk, she walks! Look!'] },
    { if: { rift: true }, text: ['The moon\'s the only thing that looks the same as in the old pictures. I like her.'] },
  ]);
  lines('season.stars.kindly', [
    { text: ['She does, doesn\'t she? Like a lamp left on for us.', 'I think so too. She keeps an eye.'] },
    { if: { temper: 'gloomy' }, text: ['...Kindly. Maybe. I\'ll try to see it that way.'] },
    { if: { stage: 'child' }, text: ['Is she looking at ME? Hello, moon!'] },
  ]);
  lines('season.stars.cheese', [
    { text: ['A crumbly one! Ha! I\'d want a bit with an apple.', 'If it\'s cheese I\'m going to need a very long ladder and a bigger plate.'] },
    { if: { temper: 'witty' }, text: ['Cheese. And the stars are crumbs. That explains everything.'] },
    { if: { stage: 'child' }, text: ['CHEESE? Can we get some? Can you fly us there?'] },
    { if: { temper: 'ornery' }, text: ['Cheese. Wizards. I\'ve heard it all now.'] },
  ]);
  lines('season.stars.mountains', [
    { text: ['Knock one down! What would you do with it?', 'Close enough to touch. I\'d be frightened. I\'d be amazed.'] },
    { if: { temper: 'curious' }, text: ['How close? Do they look different close up? Bigger? Warmer?'] },
    { if: { temper: 'dreamy' }, text: ['I\'d give a great deal to see that. Once. Then come home and tell everyone.'] },
    { if: { temper: 'ornery' }, text: ['Mountains. Cold and high and nowhere to sit. You can keep them.'] },
    { if: { stage: 'child' }, text: ['Did you knock one down? Did you? Have you got it in your pocket?'] },
    { if: { rift: true }, text: ['Stars close enough to touch. That\'s what the city sold, in the old days. Fake ones. This is real?'] },
  ]);
  lines('season.stars.elves', [
    { text: ['Elves! Named every one? They must have had a lot of time.', 'Long before hobbits. And they\'re still the same stars. That\'s something.'] },
    { if: { temper: 'dreamy' }, text: ['I\'d love to hear their names. Elf names. They\'d sound like water.'] },
    { if: { temper: 'witty' }, text: ['Elves had time to name stars. We\'re busy naming pigs.'] },
    { if: { stage: 'child' }, text: ['Are elves real? Have you MET one?'] },
    { if: { temper: 'ornery' }, text: ['Elves. Always elves. Couldn\'t leave a thing unnamed.'] },
  ]);
  lines('season.stars.sailor', [
    { text: ['A sailor carrying a star. Oh, that\'s the most beautiful thing I\'ve heard all year.', 'I\'ll look for him every evening now. The Star of Evening.'] },
    { if: { stage: 'child' }, text: ['A SAILOR? In the SKY? Does he have a boat?'] },
    { if: { temper: 'gloomy' }, text: ['...That\'s lovely. I don\'t know why it makes me want to cry.'] },
    { if: { temper: 'ornery' }, text: ['A sailor in the sky. ...Which one is he? Point.'] },
  ]);
  lines('season.stars.nameone', [
    { text: ['I\'d name it after my mother. She\'d like that. She\'d pretend not to.', 'The Little Kettle. Because it would be warm and you could always find it.'] },
    { if: { spouse: (s) => !!s }, pri: 1, text: ['After {spouse}. Then I\'d never be without {spouse}, even on the road.'] },
    { if: { kid: (k) => !!k }, pri: 1, text: ['{Kid}\'s Star. So {kid} would always have something of their own.'] },
    { if: { stage: 'child' }, text: ['Biscuit. I\'d call it Biscuit.'] },
    { if: { temper: 'witty' }, text: ['After myself, obviously. It\'s the only way I\'ll be up there.'] },
    { if: { rift: true }, text: ['Home. I\'d call it Home. Then I\'d know where it was.'] },
  ]);
  lines('season.stars.here', [
    { text: ['They are, aren\'t they. They hang lower over Thistledown. I\'m sure of it.', 'Ha! The stars come for the second breakfast.'] },
    { if: { temper: 'proud' }, text: ['Quite right. They know a good village when they see one.'] },
    { if: { temper: 'dreamy' }, text: ['I think so too. Like they\'re leaning in to listen.'] },
  ]);
  lines('season.stars.wish', [
    { text: ['...Once or twice. You have to be quick. Wish before it\'s gone, or it doesn\'t count.', 'I saw one fall over the mill last summer. I wished so hard I forgot to breathe.'] },
    { if: { temper: 'ornery' }, text: ['Wishing\'s for children. ...Once. Don\'t ask what.'] },
    { if: { temper: 'cheerful' }, text: ['Every time! I wish for the same thing every time and it keeps nearly coming true.'] },
    { if: { temper: 'shy' }, text: ['...Yes. Not out loud. You mustn\'t say it out loud.'] },
    { if: { temper: 'gloomy' }, text: ['I wished once. It didn\'t come true. I stopped looking up for a while.'] },
    { if: { temper: 'witty' }, text: ['I wished for a falling star that falls slower. So far, nothing.'] },
    { if: { temper: 'curious' }, text: ['I\'ve seen eleven! I wrote down where and when. They come more in late summer. Why?'] },
    { if: { stage: 'child' }, text: ['Yes! I wished for a pony. Then a dragon. Then a pony again. Which one counts?'] },
    { if: { rift: true }, text: ['I saw one my first week here. I thought it was a drone crashing. Then I wished. Just in case.'] },
  ]);
  lines('season.stars.what', [
    { text: ['...That everyone I love would still be here next Yule. All of them. Every one.', '...To be brave. Just once, when it matters. That\'s all.'] },
    { if: { spouse: (s) => !s, stage: ['grown', 'elder'] }, pri: 1, text: ['...That somebody would look at me the way old couples look at each other. That\'s all.'] },
    { if: { kid: (k) => !!k }, pri: 1, text: ['...That {kid} would grow up happier than I did. That\'s the wish. Every time.'] },
    { if: { lost: (l) => !!l }, pri: 2, text: ['...That {lost} is looking at the same stars, wherever {lost} is.'] },
    { if: { stage: 'child' }, text: ['...That Mom and Dad would stop being cross. They\'re not cross now. So it worked?'] },
    { if: { rift: true }, text: ['...That I\'d find a place I belong. ...Don\'t say anything. I\'m still deciding.'] },
    { if: { dream: (d) => !!d }, text: ['...That one day I\'d {dreamText}. Silly, isn\'t it, telling a star.'] },
  ]);
  lines('season.stars.kept', [
    { text: ['...Thank you. I\'ve never told anyone that.', 'I knew you would. That\'s why I told you.'] },
    { if: { temper: 'shy' }, text: ['...Thank you.'] },
    { if: { temper: 'ornery' }, text: ['You\'d better. ...Thank you.'] },
  ]);
  lines('season.stars.aloud', [
    { text: ['...Do they? Then I\'m glad I said it.', 'That\'s a nice thing to believe. I\'ll believe it.'] },
    { if: { temper: 'gloomy' }, text: ['...I\'ll try to believe that. For tonight, anyway.'] },
    { if: { stage: 'child' }, text: ['So now it\'ll come TRUE? Promise?'] },
  ]);
  lines('season.stars.hope', [
    { text: ['Mostly? Ha. I\'ll take mostly.', 'I hope so too. I check every morning.'] },
    { if: { temper: 'ornery' }, text: ['Honest stars. Hmph. They\'ve not been very honest with me.'] },
    { if: { stage: 'child' }, text: ['Will it be TOMORROW? Or next week?'] },
  ]);
  lines('season.stars.wizwish', [
    { text: ['You? Wished on a star? What for?', 'A wizard wishing. I thought you just... did things.'] },
    { if: { temper: 'curious' }, text: ['What did you wish? Did it come true? How long did it take?'] },
    { if: { stage: 'child' }, text: ['Wizards don\'t need to wish! ...Do they?'] },
  ]);
  lines('season.stars.hat', [
    { text: ['Ha! The star had a sense of humor.', 'A better hat! And the star said "no". Wise star.'] },
    { if: { temper: 'witty' }, text: ['It came true. That IS the better hat. The first one must have been dreadful.'] },
    { if: { stage: 'child' }, text: ['I LIKE your hat!'] },
  ]);
  lines('season.stars.home', [
    { text: ['...Here? You mean here? Well. You\'re very welcome, wizard.', '...Oh. Then it came true for both of us, a bit.'] },
    { if: { temper: 'shy' }, text: ['...*looks at the stars for a long time, smiling*'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Soft old wizard. ...Stay as long as you like.'] },
    { if: { rift: true }, pri: 1, text: ['...Same. That\'s my wish too. I think it\'s coming true for me as well.'] },
  ]);

  // --- Their turn: what are the stars? ----------------------------------------------------------
  addThread({
    id: 'season.stars.ask', theirs: true, cool: 4,
    label: 'They ask you about the sky',
    ask: '{Name} is looking up at the sky, then at you, with a question.',
    when: (F) => F.met && (!!F.dark || F.hour === 'evening' || F.hour === 'night') && (F.stage === 'child' || F.temper === 'curious' || F.temper === 'dreamy'),
    beats: {
      start: { line: 'season.starsask.q', go: [
        { ap: 'tale', say: 'season.starsask.lamps', label: 'Tell them the old tale', to: 'lamps', fx: { lean: 'hill' } },
        { ap: 'share', say: 'Nobody truly knows. Fires, some say, very far off. Further than anything.', to: 'fires', fx: { lean: 'rift' } },
        { ap: 'jest', say: 'They\'re holes in the sky\'s hat. The light gets through.', to: 'holes' },
      ] },
      lamps: { line: 'season.starsask.lamps2', go: [
        { ap: 'ask', say: 'And if you could light one, which would it be?', to: 'yours' },
        { ap: 'warm', say: 'And they\'ve been lit ever since. For all of us.', to: 'ever' },
      ] },
      fires: { line: 'season.starsask.fires', go: [
        { ap: 'ask', say: 'What do you think they are?', to: 'think' },
        { ap: 'tale', say: 'Though there\'s an old tale that says otherwise...', to: 'lamps', fx: { lean: 'hill' } },
      ] },
      holes: { line: 'season.starsask.holes', go: [
        { ap: 'share', say: 'Honestly? Nobody quite knows. That\'s the best part.', to: 'fires', fx: { lean: 'rift' } },
        { ap: 'jest', say: 'And the moon\'s the hat-pin, keeping it on.', to: 'pin' },
      ] },
      yours: { line: 'season.starsask.yours', fx: { fond: 0.03 }, end: true },
      ever: { line: 'season.starsask.ever', fx: { fond: 0.02 }, end: true },
      think: { line: 'season.starsask.think', fx: { respect: 0.02, fond: 0.02 }, end: true },
      pin: { line: 'season.starsask.pin', fx: { joke: { k: 'season.hatpin', t: 'The stars are holes in the sky\'s hat, and the moon\'s the hat-pin.' }, fond: 0.02 }, end: true },
    },
  });
  lines('season.starsask.q', [
    { text: ['What are the stars, really? You\'d know.', 'Wizard. Why does the moon change shape? Where does the rest of it go?'] },
    { if: { stage: 'child' }, text: ['What ARE stars? Are they hot? Are they far? Can I have one?', 'Why does the moon get thin? Is she poorly?', 'Who put the stars there? Was it you? It was you, wasn\'t it.'] },
    { if: { temper: 'curious' }, text: ['I\'ve been wondering for years. What are the stars? Truly? Not a story. Well. A story too.'] },
    { if: { temper: 'dreamy' }, text: ['Do you know what the stars are? I\'ve always thought they were somebody\'s windows.'] },
    { if: { rift: true }, text: ['Back home they said the stars were just old light. Is that true here too?'] },
  ]);
  lines('season.starsask.lamps', [
    { text: ['Long ago, before the sun, the great ones of the world hung lamps in the dark for those who\'d wake. Those are the stars.'] },
    { if: { stage: 'child' }, text: ['Long ago, before the sun, the oldest of all folk hung lamps in the dark so the first children wouldn\'t be scared.'] },
  ]);
  lines('season.starsask.lamps2', [
    { text: ['Lamps! Hung up for us. That\'s... that\'s the nicest answer there could be.', 'Before the sun? Then they\'re older than everything. I\'ll be careful with them.'] },
    { if: { stage: 'child' }, text: ['So nobody would be scared! I\'m not scared. ...I\'m less scared now.', 'LAMPS! Who changes the candles?'] },
    { if: { temper: 'curious' }, text: ['Who were the great ones? Are they still about? Do they check on the lamps?'] },
    { if: { temper: 'dreamy' }, text: ['I knew it was something like that. I knew it was something kind.'] },
  ]);
  lines('season.starsask.fires', [
    { text: ['Fires! Further than anything? Further than Bree?', 'Nobody knows? Not even you? ...That\'s quite exciting, actually.'] },
    { if: { stage: 'child' }, text: ['FIRES? Who lit them? Can they go out? What if they go out?', 'Further than ANYTHING? Further than the far hills?'] },
    { if: { temper: 'curious' }, text: ['Then somebody should find out. Somebody could. Couldn\'t they?'] },
    { if: { rift: true }, text: ['That\'s what we were told too. Big fires, far away. It\'s nice the two worlds agree on something.'] },
  ]);
  lines('season.starsask.holes', [
    { text: ['Ha! The sky\'s hat! Then it\'s a very old hat, with a lot of holes.', 'Holes in a hat! You\'re teasing. ...Are you teasing?'] },
    { if: { stage: 'child' }, text: ['A HAT? Like YOUR hat? Have you got holes in your hat?', 'Then who\'s wearing it? Is the sky a person?'] },
    { if: { temper: 'curious' }, text: ['That\'s not an answer, that\'s a joke. ...A good one. But what are they really?'] },
  ]);
  lines('season.starsask.yours', [
    { text: ['That one. The little one by the bright one. So it\'s not lonely.', 'A new one! Right there, where there\'s a gap. So the gap had something.'] },
    { if: { stage: 'child' }, text: ['A BIG one. Over my house. So I could find home from anywhere.', 'A green one! There aren\'t any green ones. There should be.'] },
    { if: { temper: 'dreamy' }, text: ['One over the river, so the river had something to look at too.'] },
  ]);
  lines('season.starsask.ever', [
    { text: ['For all of us. Even me. ...Thank you, wizard.', 'Then I\'ll say thank you to them tonight.'] },
    { if: { stage: 'child' }, text: ['Night night, stars! Thank you for the lamps!'] },
  ]);
  lines('season.starsask.think', [
    { text: ['...I think they\'re where the people we\'ve lost go to keep an eye on us.', '...I think they\'re windows. And somebody\'s sitting in each one with a cup of tea.'] },
    { if: { stage: 'child' }, text: ['...I think they\'re sparks from the biggest bonfire in the world. A Yule one.', '...I think they\'re fireflies that went too high and liked it.'] },
    { if: { temper: 'curious' }, text: ['...I think they\'re suns. Other suns. Just far. Is that silly?'] },
    { if: { rift: true }, text: ['...I think they\'re other cities. Other Neverdarks. With other people looking back.'] },
  ]);
  lines('season.starsask.pin', [
    { text: ['Ha! A hat-pin! I\'ll never look at the moon the same way.', 'And when it\'s new, the pin\'s fallen out? ...That\'s why it gets windy!'] },
    { if: { stage: 'child' }, text: ['HAT-PIN! I\'m going to tell everybody! The moon\'s a PIN!'] },
    { if: { temper: 'witty' }, text: ['The sky\'s hat-pin. You\'ve thought about this far too much.'] },
  ]);
  lines('season.flowers.teapotvase', [
    { text: ['In the teapot! Ha! And did you drink it?', 'With the tea! Was it nice? Flower tea?'] },
    { if: { temper: 'witty' }, text: ['Practical. Flowers and tea in one go. I like them already.'] },
    { if: { stage: 'child' }, text: ['I did that once! With a dandelion! It was horrible!'] },
    { if: { temper: 'dreamy' }, text: ['That\'s lovely, somehow. They wanted to keep them close.'] },
    { if: { temper: 'ornery' }, text: ['Waste of a good teapot.'] },
  ]);
  // --- How the year has treated them ------------------------------------------------------------
  addThread({
    id: 'season.year', cool: 5, weight: 1,
    label: (F) => (F.seasonEnds && F.seasonNext === 'spring' ? 'The year\'s end' : 'How\'s the year treated you?'),
    rel: (F) => (F.seasonEnds && F.seasonNext === 'spring' ? 2 : F.seasonEnds ? 1.4 : F.stage === 'elder' ? 1.1 : 0.6),
    when: (F) => F.stage !== 'child' || F.band === 'youth',
    open: { ask: 'season.year.open' },
    beats: {
      start: { line: 'season.year.start', go: [
        { ap: 'ask', say: 'And the best of it?', to: 'best' },
        { ap: 'ask', say: 'And the worst?', to: 'worst', need: { open: 1 }, soft: true },
        { ap: 'ask', say: 'What do you hope for, in the year to come?', to: 'hope' },
      ] },
      best: { line: 'season.year.best', go: [
        { ap: 'warm', say: 'Then it was a good year. Whatever else it was.', to: 'glad' },
        { ap: 'ask', say: 'And who did you share it with?', to: 'who' },
        { ap: 'jest', say: 'You\'ve left out the part where you met me.', to: 'met', need: { fond: 0.15 }, soft: true },
      ] },
      glad: { line: 'season.year.glad', fx: { fond: 0.02 }, end: true },
      who: { line: 'season.year.who', fx: { trust: 0.02 }, end: true },
      met: { line: 'season.year.met', fx: { fond: 0.03, joke: { k: 'season.yearbest', t: 'Meeting the wizard was the best of the year. Second best. After the pie.' } }, end: true },
      worst: { line: 'season.year.worst', fx: { open: 1 }, go: [
        { ap: 'comfort', say: 'You came through it. That counts for a great deal.', to: 'comforted' },
        { ap: 'listen', say: '*You say nothing, and wait.*', label: 'Say nothing, and wait', to: 'gone', need: { open: 2 }, soft: true },
        { ap: 'advise', say: 'Then leave it in this year. Don\'t carry it into the next.', to: 'leave' },
      ] },
      comforted: { line: 'season.year.comforted', fx: { trust: 0.03, fond: 0.02 }, end: true },
      leave: { line: 'season.year.leave', fx: { respect: 0.03 }, end: true },
      gone: { line: 'season.year.gone', fx: { confide: { k: 'season.yeargone', t: 'who {name} misses most, at the turn of the year', secret: true }, trust: 0.03 }, go: [
        { ap: 'comfort', say: 'They\'d be glad you still think of them.', to: 'glad2' },
        { ap: 'share', say: 'I\'ve outlived more friends than I can count. You never stop missing them. You just carry them better.', to: 'carry' },
      ] },
      glad2: { line: 'season.year.glad2', fx: { trust: 0.03, remember: 'Told the wizard who I miss. It helped.', rv: 1 }, end: true },
      carry: { line: 'season.year.carry', fx: { trust: 0.04, fond: 0.02 }, end: true },
      hope: { line: 'season.year.hope', go: [
        { ap: 'warm', say: 'I\'ll come back and see it, I promise you that.', to: 'promise' },
        { ap: 'jest', say: 'And more pie, presumably.', to: 'pie' },
        { ap: 'advise', say: 'Then don\'t wait for the year to bring it. Go and fetch it.', to: 'fetch' },
      ] },
      promise: { line: 'season.year.promise', fx: { fond: 0.03, hook: 'season.yearhope' }, end: true },
      pie: { line: 'season.year.pie', end: true },
      fetch: { line: 'season.year.fetch', fx: { respect: 0.03 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.year.open', [
    { text: ['How has the year treated you, {name}?', 'Another year nearly turned, {name}. Was it a good one?'] },
    { if: { firstYear: true }, text: ['Your first year in Thistledown, {name}. How has it been?', 'A whole year since the valley was dug, {name}, nearly. What do you make of it?'] },
    { if: { seasonEnds: true }, text: ['The season\'s turning, {name}. A good time to look back.', 'Tomorrow\'s {seasonNext}, {name}. How was it, all told?'] },
    { if: { stage: 'elder' }, text: ['Another year to add to the pile, {name}. Was it a kind one?'] },
  ]);
  lines('season.year.start', [
    { if: { register: 'fine' }, text: ['On the whole, a creditable year. One would not wish to repeat all of it, but one would repeat most.'] },
    { if: { register: 'plain' }, text: ['All right. Fed. Warm. Still here.', 'Not bad. Not bad at all.'] },
    { if: { season: 'winter' }, text: ['Winter\'s the time to look back. Long nights for it. I\'ve been going over it all by the fire.'] },
    { text: ['Oh, a year\'s a year. Some of it was lovely, some of it rained.', 'Better than some, worse than others. I\'m still here, so that\'s a start.', 'It went quick. They all go quick now.'] },
    { if: { firstYear: true }, text: ['Our first year! New holes, new fields, new everything. I\'ve hardly sat down.', 'Hard, and good. You don\'t know a valley till you\'ve had a year of it.'] },
    { if: { seasonBabies: { min: 1 } }, text: ['There\'s been a baby this season! New faces always make it a good one.'] },
    { if: { seasonWeddings: { min: 1 } }, text: ['A wedding this season! I cried through the whole feast. Happily.'] },
    { if: { temper: 'ornery' }, text: ['Treated me? Like a doormat, mostly. ...It was all right. Don\'t spread it about.'] },
    { if: { temper: 'cheerful' }, text: ['Wonderfully! I say that every year, and every year it\'s true.'] },
    { if: { temper: 'shy' }, text: ['...Quietly. Which is how I like it. Mostly.'] },
    { if: { temper: 'dreamy' }, text: ['Like a song you only half remember. Lovely bits, and gaps.'] },
    { if: { temper: 'witty' }, text: ['Like an uncle at a wedding. Too long, a bit loud, and gone before you knew it.'] },
    { if: { temper: 'proud' }, text: ['Well. I\'ve made good use of it. I always do.'] },
    { if: { temper: 'gloomy' }, text: ['It happened. That\'s about all you can say for it.', 'I\'m a year older and none the wiser. Same as every year.'] },
    { if: { temper: 'curious' }, text: ['I learned more this year than any other. I\'ve a list. Shall I read you the list?'] },
    { if: { stage: 'elder' }, text: ['At my age every year\'s a gift. Some of them come in odd wrapping.', 'I\'ve had a lot of years. This one was one of them.'] },
    { if: { rift: true }, pri: 1, text: ['It\'s the first year I\'ve ever counted in seasons. Back home it was all the same. This had shape.', 'A year ago I didn\'t know what a hen was. Now I\'ve four. That\'s my year.'] },
    { if: { mood: 'merry' }, text: ['Kindly! Very kindly. I\'ve no complaints at all, which worries me.'] },
    { if: { mood: 'miserable' }, pri: 1, text: ['Not well. I won\'t lie to you. Not well.'] },
    { if: { spouse: (s) => !!s }, text: ['Me and {spouse} are still here and still speaking. That\'s a good year.'] },
  ]);
  lines('season.year.best', [
    { text: ['A quiet evening, nothing special. I can\'t tell you why it was the best. It just was.', 'The festivals. All of them. You don\'t know how much you need a party till you\'re at one.'] },
    { if: { memory: (m) => !!m, memoryGood: true }, pri: 1, text: ['This, lately: "{memory}" I\'ll remember that one when I\'m old. Older.'] },
    { if: { fwLately: true }, pri: 1, text: ['Your fireworks! The dragon! I\'ve been telling everyone for days.'] },
    { if: { spouse: (s) => !!s }, text: ['A walk with {spouse} along the river, the evening of the Harvest Feast. Nothing happened. Perfect.'] },
    { if: { kid: (k) => !!k }, text: ['{Kid} saying something so clever I had to sit down. I won\'t repeat it. You had to be there.'] },
    { if: { temper: 'ornery' }, text: ['The day nobody bothered me. Bliss. One day.'] },
    { if: { temper: 'cheerful' }, text: ['All of it! Well. Mayday. No, Midsummer. No! Yule! I can\'t choose.'] },
    { if: { temper: 'shy' }, text: ['...Someone asked me to dance. At Mayday. I said no. But they asked.'] },
    { if: { temper: 'proud' }, text: ['My best work. I won\'t say what. Everyone knows what.'] },
    { if: { temper: 'gloomy' }, text: ['A sunny afternoon. It didn\'t last. But it was there.'] },
    { if: { temper: 'dreamy' }, text: ['The night the whole sky was lanterns. I\'ve never seen anything so beautiful.'] },
    { if: { temper: 'witty' }, text: ['Second breakfast on the third Highday of summer. Peak of my career.'] },
    { if: { temper: 'curious' }, text: ['The day I worked out why the mill-wheel creaks. Nobody else cared. I cared.'] },
    { if: { rift: true }, text: ['Somebody here called me "neighbor". Just like that. I went home and sat down.'] },
    { if: { stage: 'elder' }, text: ['A grandchild\'s laugh. Doesn\'t matter whose. They\'re all mine, at my age.'] },
    { if: { pastime: (p) => !!p }, text: ['Finishing a {madeOne} I was proud of. Really proud. That doesn\'t happen often.'] },
  ]);
  lines('season.year.glad', [
    { text: ['It was, wasn\'t it? I\'ll say it to myself at Yule. "It was a good year."', 'You\'re right. I\'ll take it.'] },
    { if: { temper: 'gloomy' }, text: ['...Maybe it was. I\'ll try to think so.'] },
    { if: { temper: 'ornery' }, text: ['Don\'t go telling everyone I said so.'] },
  ]);
  lines('season.year.who', [
    { text: ['The whole village, really. You can\'t have a good year on your own here.', 'With whoever was nearest. That\'s the trick of it.'] },
    { if: { spouse: (s) => !!s }, pri: 1, text: ['{Spouse}. It\'s always {spouse}. Even when I\'m cross, it\'s {spouse}.'] },
    { if: { friend: (f) => !!f }, text: ['{Friend}. We sat up talking till the candle went out. Twice.'] },
    { if: { lonely: true }, pri: 1, text: ['...Nobody, really. That\'s the trouble. Maybe next year.'] },
  ]);
  lines('season.year.met', [
    { text: ['Ha! Second best. After the pie.', 'Meeting you? Oh, all right. Top three. After pie and the fireworks.'] },
    { if: { temper: 'shy' }, text: ['...It was. Actually. Don\'t make me say it twice.'] },
    { if: { temper: 'witty' }, text: ['I left it out on purpose. I didn\'t want it going to your hat.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Conceited wizard. ...Top five.'] },
  ]);
  lines('season.year.worst', [
    { text: ['The bad weeks. Everyone has them. I had a few.', 'Losing things. Not big things. Lots of little ones. They add up.'] },
    { if: { hazard: (h) => !!h }, text: ['The {hazardWord}. Still going. I lie awake about it.'] },
    { if: { memory: (m) => !!m, memoryGood: false }, pri: 1, text: ['"{Memory}" That. That was the worst of it.'] },
    { if: { lost: (l) => !!l }, pri: 2, text: ['Not knowing where {lost} is. Every day of the year, that.'] },
    { if: { stage: 'elder' }, text: ['The friends who didn\'t see it out. There\'s a few more stones on the hill.'] },
    { if: { homeless: true }, pri: 2, text: ['Nights with nowhere to go. You don\'t forget a night in a hedge.'] },
    { if: { temper: 'ornery' }, text: ['The rain. The neighbors. The rain on the neighbors. Mostly the neighbors.'] },
    { if: { temper: 'gloomy' }, text: ['Do you want a list? It\'s a long list.'] },
    { if: { temper: 'shy' }, text: ['...Being lonely, some days. Nobody noticed. That\'s fine.'] },
    { if: { temper: 'proud' }, text: ['I don\'t dwell on the worst. ...There was a quarrel. I was right. It still hurt.'] },
    { if: { rift: true }, text: ['Missing the noise. Some nights it was so quiet I couldn\'t breathe.'] },
    { if: { sick: true }, text: ['Being ill. Like now. Everything takes three times as long and none of it\'s fun.'] },
  ]);
  lines('season.year.comforted', [
    { text: ['...I did, didn\'t I. I came through.', 'Thank you. You\'re right. I\'m still standing.'] },
    { if: { temper: 'proud' }, text: ['I always do. ...It\'s nice to have it noticed.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Yes. Course I did. ...Thank you.'] },
    { if: { temper: 'gloomy' }, text: ['...Through it. Yes. I suppose that counts.'] },
  ]);
  lines('season.year.leave', [
    { text: ['Leave it in this year. I like that. I\'ll try.', 'You make it sound easy. ...Maybe it is, if you decide to.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I don\'t carry things. ...I\'ll put it down, then. Since you mention it.'] },
    { if: { temper: 'gloomy' }, text: ['I\'ll try. It\'s heavy, but I\'ll try.'] },
  ]);
  lines('season.year.gone', [
    { text: ['...There was somebody I used to sit with on the bench by the Badger. The bench is still there.', '...My mother. Every year at the turning I set out an extra cup. Silly.'] },
    { if: { lost: (l) => !!l }, pri: 2, text: ['...{Lost}. Every single day. I talk to {lost} at night, and it\'s like shouting into the rift.'] },
    { if: { stage: 'elder' }, pri: 1, text: ['...The one I married. Gone now. Every turning of the year I walk up the hill and tell them the news.'] },
    { if: { rift: true }, text: ['...Everyone I left on the other side. Some days I can\'t remember their faces. That\'s the worst.'] },
    { if: { temper: 'shy' }, text: ['...A friend who moved to Bree. They never wrote. I still look for the mail.'] },
  ]);
  lines('season.year.glad2', [
    { text: ['...Do you think? I hope so.', '...That\'s a kind thing to say. I\'ll tell them you said it.'] },
    { if: { temper: 'gloomy' }, text: ['...Maybe. That\'s something to hold on to.'] },
  ]);
  lines('season.year.carry', [
    { text: ['...Carry them better. Yes. That\'s it exactly.', '...More friends than you can count. How do you bear it?'] },
    { if: { temper: 'curious' }, text: ['...How old ARE you? No. That\'s not the point. Thank you.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. For telling me that.'] },
  ]);
  lines('season.year.hope', [
    { text: ['A good harvest, a quiet winter, and nobody I love on the hill.', 'More of the same. That\'s all. More of the good same.'] },
    { if: { wish: (w) => !!w }, pri: 1, text: ['Honestly? {WishText}. Small thing. It\'d mean a lot.'] },
    { if: { dream: (d) => !!d }, pri: 1, text: ['That I\'ll finally {dreamText}. Next year. This time I mean it.'] },
    { if: { spouse: (s) => !s, stage: ['grown', 'elder'] }, text: ['...Somebody to walk home with. After the parties. That\'d be nice.'] },
    { if: { kid: (k) => !!k }, text: ['That {kid} has a better year than I did. That\'s all I ever hope.'] },
    { if: { temper: 'ornery' }, text: ['Less nonsense. That\'s all. Less nonsense from everyone.'] },
    { if: { temper: 'cheerful' }, text: ['Everything! More parties, more pie, more friends!'] },
    { if: { temper: 'dreamy' }, text: ['Something I can\'t imagine yet. That\'s the best kind.'] },
    { if: { temper: 'gloomy' }, text: ['That it\'s not worse. I aim low. I\'m rarely disappointed.'] },
    { if: { temper: 'witty' }, text: ['A year with more Highdays in it. I\'ll take it to the Moot.'] },
    { if: { rift: true }, text: ['That the rifts settle. That the two places get on. That I get to stay.'] },
    { if: { stage: 'elder' }, text: ['To see the next one. And the one after. Let\'s not be greedy.'] },
  ]);
  lines('season.year.promise', [
    { text: ['You will? Then I\'ll make sure there\'s something worth seeing.', 'A wizard\'s promise. I\'ll keep a chair for you.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. You\'d better. I\'ll know if you don\'t.'] },
    { if: { temper: 'shy' }, text: ['...I\'d like that. Very much.'] },
  ]);
  lines('season.year.pie', [
    { text: ['More pie goes without saying. It\'s implied in every hope.', 'Ha! Pie\'s not a hope. Pie\'s a certainty.'] },
    { if: { temper: 'witty' }, text: ['Pie is the foundation on which all other hopes are built.'] },
  ]);
  lines('season.year.fetch', [
    { text: ['Go and fetch it. Hm. Easy for a wizard to say.', '...You\'re right. I\'ve been waiting for years. I\'ll go and fetch it.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I don\'t need telling. ...But I hear you.'] },
    { if: { temper: 'shy' }, text: ['...Fetch it. Yes. Scary. But yes.'] },
  ]);

  // --- Passing the time: the birds, the woods, the river ---------------------------------------
  addThread({
    id: 'season.wildpass', light: true, ap: 'ask', label: 'Pass the time about the birds', open: { ask: 'season.wildpass.open' },
    beats: {
      start: { line: 'season.wildpass.reply', go: [
        { ap: 'ask', say: 'And what do you suppose it\'s saying?', to: 'saying' },
        { ap: 'share', say: 'In Bree they say the wren is the king of all birds. He rode on an eagle\'s back.', to: 'wren' },
        { ap: 'warm', say: 'The valley\'s singing for you today, I think.', to: 'singing' },
      ] },
      saying: { line: 'season.wildpass.saying', end: true },
      wren: { line: 'season.wildpass.wren', fx: { fond: 0.01 }, end: true },
      singing: { line: 'season.wildpass.singing', fx: { fond: 0.01 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('season.wildpass.open', [
    { text: ['Hear that, {name}? Which bird is that?', 'There\'s a {birdNow} somewhere about, {name}. Can you hear it?'] },
    { if: { hour: 'night' }, text: ['Hear the owl, {name}? Is that one of yours?'] },
    { if: { hour: 'morning' }, text: ['What a racket this morning, {name}! Every bird in the valley\'s got something to say.'] },
    { if: { season: 'winter' }, text: ['Just the robin singing today, {name}. Brave little thing.'] },
  ]);
  lines('season.wildpass.reply', [
    { text: ['That? A blackbird, I think. Or a thrush. They argue.', 'Oh, that\'s the {birdNow}. Been at it since dawn.'] },
    { if: { pastime: 'birdwatching' }, pri: 1, text: ['That\'s a {birdNow}. Male. Young, by the sound of him. Showing off.'] },
    { if: { temper: 'ornery' }, text: ['A bird. Making a noise. Like birds do. Every morning. At four.'] },
    { if: { temper: 'shy' }, text: ['...A wren, I think. They\'re very loud for something so small.'] },
    { if: { temper: 'dreamy' }, text: ['I don\'t know its name. I don\'t want to. It\'s nicer not knowing.'] },
    { if: { stage: 'child' }, text: ['It\'s a BIRD. ...I don\'t know which. A singing one!'] },
    { if: { rift: true }, text: ['No idea. It sounds like an old phone notification. A nice one.'] },
  ]);
  lines('season.wildpass.saying', [
    { text: ['"This is my hedge, and that is my hedge, and keep off." Mostly that.', 'Something about worms, I expect. It\'s always worms with them.'] },
    { if: { temper: 'witty' }, text: ['"Look at me." Same as everyone at the Badger.'] },
    { if: { temper: 'dreamy' }, text: ['Good morning. To everybody. Every morning. Imagine saying that every morning.'] },
    { if: { stage: 'child' }, text: ['It\'s saying "PUDDING". Listen! Pud-ding! Pud-ding!'] },
  ]);
  lines('season.wildpass.wren', [
    { text: ['On an eagle\'s back! Cheeky little thing. That\'s a wren all over.', 'Ha! So the smallest won by cheating. That\'s a hobbit story if ever I heard one.'] },
    { if: { stage: 'child' }, text: ['Can I ride on an eagle? Small ones first. To practice.'] },
    { if: { temper: 'proud' }, text: ['Small but clever. I like that. Very like us.'] },
  ]);
  lines('season.wildpass.singing', [
    { text: ['Do you think? Then I\'ll stand here a minute and listen.', 'Ha! It\'s the first time anybody\'s sung for me.'] },
    { if: { temper: 'shy' }, text: ['...That\'s a nice thing to think.'] },
    { if: { temper: 'ornery' }, text: ['It could sing a bit later in the day, then.'] },
  ]);
});
