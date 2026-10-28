'use strict';
// ---------------------------------------------------------------------------
// Work and the trades, the third pack: the crafts that aren't about food.
// The fisher and the one that got away, the woodwright's round doors, the
// herbalist's remedies and the poorly, the mail carrier's round and the letters
// folk write, the storyteller's little scholars under the old oak, the nanny
// and her nursery, the tinker with rift scrap and the Relay, and the
// lamplighter's round at dusk. One thread each, about the craft itself (the
// working day is work.day, in the first pack). The facts come from talk/work.js;
// the W helper is the same as there (see its banner).
// ---------------------------------------------------------------------------

talkPack('work3', () => {
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
  const job = (j) => (F) => F.job === j && F.stage !== 'child';

  // A few facts of the crafts: whether the Relay's up, a rift's open, anyone's poorly.
  addFacts((v, F) => {
    F.workCraftRelay = !!(World.buildings && World.buildings.relay);
    F.workCraftRiftOpen = !!(World.rifts && World.rifts.some((r) => r.a > 0.5 && !r.closing));
    F.workCraftPoorly = Game.villagers.filter((o) => o !== v && !o.leaving && o.isSick && o.isSick()).length;
    const sick = Game.villagers.find((o) => o !== v && !o.leaving && o.isSick && o.isSick());
    F.workCraftPatient = v.job === 'herbalist' && sick ? sick.first : null;
    F.workCraftNeon = (World.homes || []).filter((h) => h.built && h.neon).length;
    F.workCraftRetrofit = !!(Village.projects && Village.projects.some((p) => p.kind === 'retrofit'));
    F.workCraftBuild = Village.projects ? Village.projects.filter((p) => p.kind !== 'retrofit').length : 0;
  });

  // --- The fisher: the river, the spot, and the one that got away -----------------------
  addThread({
    id: 'work.fisher', label: 'Tell me about the river', about: 'work', weight: 1, cool: 4,
    when: job('fisher'), rel: () => 1.3,
    open: { ask: 'work.fisher.open' },
    beats: {
      start: { line: 'work.fisher.start', go: [
        { ap: 'ask', say: 'Where\'s the best spot, then?', to: 'spot' },
        { ap: 'tale', say: 'And the one that got away?', to: 'gotaway' },
        { ap: 'listen', say: '*You sit down on the bank beside them.*', label: 'Sit on the bank with them', to: 'quiet' },
      ] },
      spot: { line: 'work.fisher.spot', go: [
        { ap: 'warm', say: 'I\'d never tell a soul. Wizard\'s honor.', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'jest', say: 'Then I\'ll just follow you, very quietly.', to: 'follow' },
        { ap: 'ask', say: 'Then what bait do you swear by?', to: 'bait' },
      ] },
      secret: { line: 'work.fisher.secret', fx: { confide: { k: 'work.fisher.spot', t: '{Name}\'s best fishing spot is under the old willow where the river bends back on itself', secret: true } }, go: [
        { ap: 'warm', say: 'It\'s safe with me.', to: 'kept' },
        { ap: 'jest', say: 'Your secret\'s safe. The fish\'s isn\'t.', to: 'kept' },
      ] },
      gotaway: { line: 'work.fisher.gotaway', fx: { learn: ['work.fisher.big', '{Name} has been after a great old pike that folk call Grandfather for years.'] }, go: [
        { ap: 'ask', say: 'How big was he?', to: 'howbig' },
        { ap: 'comfort', say: 'You\'ll have him yet. I can feel it.', to: 'yet' },
        { ap: 'advise', say: 'Change your bait. He\'s seen your worms before.', to: [{ to: 'huff', need: { if: { temper: ['proud', 'ornery'] } } }, 'bait'], fx: { queue: 'fisher_bait' } },
      ] },
      howbig: { line: 'work.fisher.howbig', go: [
        { ap: 'jest', say: 'Last time you told it, he was half that.', to: 'grows' },
        { ap: 'warm', say: 'Then he\'s worth the wait.', to: 'yet' },
      ] },
      bait: { line: 'work.fisher.bait', go: [
        { ap: 'share', say: 'I fished with a spell once. Caught a boot.', to: 'boot' },
        { ap: 'advise', say: 'Try the shallows at dusk. They come up to feed.', to: 'dusk' },
      ] },
      quiet: { line: 'work.fisher.quiet', fx: { drive: { lonely: -0.05 } }, go: [
        { ap: 'listen', say: '*You say nothing, and watch the float.*', label: 'Watch the float, and wait', to: 'deep', need: { open: 2 }, soft: true },
        { ap: 'ask', say: 'Is it the fish you come for, or the quiet?', to: 'why' },
        { ap: 'warm', say: 'I can see why you love it.', to: 'end' },
      ] },
      why: { line: 'work.fisher.why', go: [
        { ap: 'listen', say: '*You nod, and let the river talk for a while.*', label: 'Let the river talk', to: 'deep', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'And here I thought you just liked worms.', to: 'grows' },
      ] },
      deep: { line: 'work.fisher.deep', fx: { confide: { k: 'work.fisher.letgo', t: '{Name} lets the big old fish go when nobody\'s looking', secret: true }, feel: 'drawn_out' }, go: [
        { ap: 'warm', say: 'That\'s a kind thing. I\'ll not tell.', to: 'kept' },
        { ap: 'jest', say: 'So Grandfather owes you his life. Several times.', to: 'owes' },
      ] },
      follow: { line: 'work.fisher.follow', fx: { fond: 0.01 }, end: true },
      kept: { line: 'work.fisher.kept', fx: { trust: 0.04, promise: { k: 'work.fisher.spot', t: 'You promised to keep {name}\'s fishing secrets', days: 30 } }, end: true },
      yet: { line: 'work.fisher.yet', fx: { fond: 0.02 }, end: true },
      grows: { line: 'work.fisher.grows', fx: { fond: 0.02 }, end: true },
      huff: { line: 'work.fisher.huff', fx: { respect: -0.01 }, end: true },
      boot: { line: 'work.fisher.boot', fx: { joke: { k: 'work.boot', t: 'The wizard fished with a spell and caught a boot.' }, fond: 0.02 }, end: true },
      dusk: { line: 'work.fisher.dusk', fx: { respect: 0.03, queue: 'work_fish', feel: 'good_tip', feelX: 'the wizard' }, end: true },
      owes: { line: 'work.fisher.owes', fx: { joke: { k: 'work.grandfather', t: 'Grandfather the pike owes {name} his life, several times over.' } }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  W('work.fisher.open', {
    _: ['Tell me about the river, {name}. You know it better than anyone.', 'What\'s the river saying today, {name}?', 'Anything biting, {name}, besides the midges?'],
    'season=winter': ['Isn\'t the river too cold for fishing, {name}?'],
    'weather=rain': ['Do the fish mind the rain, {name}? You seem not to.'],
  });
  W('work.fisher.start', {
    _: ['It\'s running clear and steady today. That\'s when they\'re choosy.', 'The river\'s in a good mood. You can tell by the sound it makes on the stones.', 'Low and slow. They\'re down in the deep pools, sulking.'],
    cheerful: ['Oh, it\'s lovely! Kingfisher went by twice. I\'ve had three bites and caught one sneeze.', 'Beautiful. Sun on the water, a fish in the basket. What more is there?'],
    ornery: ['It\'d be better without folk tramping along the bank, frightening everything.', 'The river\'s fine. It\'s the fish that are being difficult.'],
    shy: ['...It\'s quiet. That\'s what I like about it. The river doesn\'t need talking to.', 'Oh. Hello. ...It\'s running well. I wasn\'t expecting company.'],
    curious: ['I\'ve been watching where the trout lie. They face upstream, every one. Waiting for supper to come to them.', 'Did you know the river runs faster in the middle? I timed a leaf.'],
    dreamy: ['Some mornings the mist sits on it like a blanket and you can\'t tell water from sky.', 'It\'s like the river\'s thinking about something. I sit and wait for it to finish.'],
    witty: ['The fish and I have an understanding. I pretend to be clever and they pretend to be fooled.', 'Wet, mostly. It\'s a river.'],
    proud: ['Nobody reads this river like I do. I could tell you where every trout sleeps.', 'I\'ve kept the Store in fish all season. Not many could say that.'],
    gloomy: ['Fewer fish than last year. There\'s always fewer than last year.', 'Cold feet and an empty basket. Same as most mornings.'],
    'season=spring': ['Spring flood\'s gone through. Everything\'s muddy and hungry. Good fishing.', 'The river\'s high and brown with snowmelt. The fish don\'t know which way is up.'],
    'season=summer': ['Warm water, lazy fish. They only rise at dawn and dusk.', 'Summer\'s all midges and patience. The trout lie in the shade like hobbits after lunch.'],
    'season=autumn': ['The leaves are coming down on the water. The fish think every one\'s a fly.', 'Autumn\'s the best of it. Fat fish, fattening for winter. Like the rest of us.'],
    'season=winter': ['You have to break the ice at the edges some mornings. The fish are slow and so am I.', 'A fish in winter is worth three in summer. That\'s what I tell my fingers.'],
    'weather=rain': ['Rain on the water brings them up. They think it\'s raining flies.', 'Wet through, but they\'re biting. The rain stirs everything.'],
    'hour=morning': ['Dawn\'s the time. I was here before the herons.'],
    'hour=evening': ['The evening rise is starting. Watch the rings on the water.'],
    'workShort': ['The Store wants fish and the river\'s not giving. I\'ve been here since first light.'],
    'workGlut': ['The Store\'s full of fish. I\'m only here because I can\'t stop.'],
    'workHazard=flood ^2': ['The river\'s over its banks. I can\'t even find my usual stone.'],
    'workHazard=drought ^2': ['Half the river\'s gone to stones. The fish are all crowded in the pools, gasping.'],
    'register=fine': ['The water is uncommonly clear this morning. One can see every pebble, and every trout can see one.'],
    'register=plain': ['River\'s right enough. Fish is fish. They\'ll come or they won\'t.'],
    'stage=elder': ['I\'ve fished this river seventy years. It\'s changed its mind about where to run three times.'],
    'rift': ['No signal down here. Just water. Turns out I like no signal.', 'Back in Neverdark the river was neon runoff. This one has actual fish in it. Still weird.'],
  });
  W('work.fisher.spot', {
    _: ['Ha! A fisher never tells. Not even a wizard.', 'The best spot? Everywhere you\'re not standing.', 'Oh, I couldn\'t say. I really couldn\'t. It\'s more than my life\'s worth.'],
    cheerful: ['Ooh, I shouldn\'t! ...I really shouldn\'t. Ask me again when you know me better.'],
    ornery: ['You and everyone else. They all want my spot. They can find their own.'],
    shy: ['...I don\'t really tell people. It\'s the only thing that\'s mine.'],
    curious: ['It moves! It depends on the light, the wind and the day. I\'m still working it out.'],
    dreamy: ['There\'s a place where the water goes quiet. You\'d walk past it a hundred times.'],
    witty: ['I could tell you, but then I\'d have to drown you. Gently.'],
    proud: ['I found it myself, after twenty years. I\'ll not give it away in an afternoon.'],
    gloomy: ['Doesn\'t matter. They\'ll have found it by next year and fished it empty.'],
    'workFamilyTrade': ['{WorkParentName} showed me, and made me swear on a trout. I\'ve not broken it yet.'],
    'workMate': ['Not even {workMate} knows. And {workMate} has tried.'],
  });
  W('work.fisher.secret', {
    _: ['...Under the old willow, where the river bends back on itself. There\'s a hole there deeper than a well.', '...All right. The willow at the bend. Go at dusk, when the light\'s on the water.'],
    cheerful: ['Oh, go on then! The old willow at the bend. They line up under the roots like folk at the Bakehouse.'],
    ornery: ['...The willow at the bend. And if I see anyone else there, I\'ll know who to blame.'],
    shy: ['...The willow. At the bend. Don\'t... don\'t bring anyone.'],
    curious: ['The willow at the bend! The roots make a sort of cave. The current drops everything right into it.'],
    dreamy: ['Under the willow, where the bend is. The water there is green as glass and slow as a song.'],
    witty: ['The willow at the bend. If you tell anyone, I\'ll say you made it up. Nobody trusts a wizard about fish.'],
    proud: ['The willow at the bend. Took me twenty years to find. Took you one afternoon. Count yourself lucky.'],
    gloomy: ['The willow. At the bend. It won\'t last. Nothing good does once folk know.'],
  });
  W('work.fisher.gotaway', {
    _: ['Grandfather. A pike, old as the mill. I\'ve had him on the line four times.', 'There\'s a pike in the deep pool. We call him Grandfather. He\'s laughed at me for years.'],
    cheerful: ['Oh, Grandfather! The great old pike! I nearly had him last spring. I fell in, but I nearly had him.'],
    ornery: ['Grandfather. An old pike with a face like a boot and the manners of a goat. He\'ll be mine.'],
    shy: ['...There\'s a big pike. Grandfather, we call him. He took my best hook. I think about him a lot.'],
    curious: ['Grandfather! A pike. I think he\'s learned to spit the hook out. I\'ve watched him do it.'],
    dreamy: ['Grandfather. An old pike in the deep pool. Some nights I think he\'s the river\'s own heart.'],
    witty: ['Grandfather. A pike. We\'ve been courting for years. He keeps saying no.'],
    proud: ['Grandfather. The biggest pike in the valley. When I land him, you\'ll hear about it in Bree.'],
    gloomy: ['Grandfather. Old pike. He\'ll outlive me, I expect. They usually do.'],
    'stage=elder': ['Grandfather. My own father was after him. I\'ve been after him sixty years. He\'s been after my bait the whole time.'],
    'rift': ['There\'s this huge fish called Grandfather. Everyone talks about him like he\'s a legend. He basically is.'],
  });
  W('work.fisher.howbig', {
    _: ['Big as a hearthrug. Well. A small hearthrug. A mat.', 'From here to that post. And teeth like a saw.', 'Bigger than me, near enough. He pulled me in up to the knees.'],
    cheerful: ['Huge! Enormous! As long as a bench, with a face like a disappointed uncle!'],
    ornery: ['Big enough. Bigger than anything you\'ve caught.'],
    shy: ['...As long as my arm. Longer. Both arms.'],
    curious: ['I measured his shadow once against the jetty post. Four feet, near as I can tell.'],
    dreamy: ['As long as a summer evening, and as hard to hold.'],
    witty: ['He gets a little bigger every time I tell it. By Yule he\'ll be a whale.'],
    proud: ['Five feet, nose to tail. I\'ve had my hand on him. Ask anyone.'],
    gloomy: ['Big enough to make every other fish look like a sprat. That\'s the trouble with Grandfather.'],
  });
  W('work.fisher.grows', {
    _: ['Ha! Well, he\'s been eating well since.', 'He\'s grown! Fish do.', 'Ha! You\'ve been listening at the Badger, haven\'t you.'],
    cheerful: ['Ha! He has! He\'s growing out of spite!'],
    ornery: ['Half? Who told you half? I\'ll have words.'],
    shy: ['*laughs, and goes pink*'],
    witty: ['Next time he\'ll be twice it. I\'m a fisher. It\'s in the rules.'],
    proud: ['I never said half. Somebody misheard.'],
    gloomy: ['Ha. ...He\'ll be the size of the mill by the time I\'m gone.'],
    curious: ['Ha! Do you know, I think he really has grown. Pike don\'t stop, you know.'],
    dreamy: ['Maybe he grows when nobody\'s looking. Like the best stories.'],
  });
  W('work.fisher.bait', {
    _: ['Worms for trout, bread paste for the roach, and a bit of bacon for Grandfather.', 'Depends on the day. The fish change their minds more than folk do.'],
    cheerful: ['Cheese! Nobody believes me. The trout love a bit of cheese. Who doesn\'t?'],
    ornery: ['Worms. Always worms. None of your fancy flies.'],
    shy: ['...Grubs from under the woodpile. I don\'t tell anyone that.'],
    curious: ['I\'ve tried everything. Worms, grubs, cheese, a bit of seed-cake. The seed-cake did best. Odd.'],
    dreamy: ['A fly I tie myself, from a jay\'s feather. It dances on the water like it\'s alive.'],
    witty: ['Whatever I didn\'t eat for lunch. Which isn\'t much.'],
    proud: ['A fly of my own making. Nobody else can tie it. I\'ve tried teaching them.'],
    gloomy: ['Worms. The worms are the only ones who suffer more than me.'],
    'season=summer': ['Summer, it\'s flies. They rise to anything with wings.'],
    'season=winter': ['Winter, a fat grub, fished deep and slow. Nothing hurries in winter.'],
  });
  W('work.fisher.quiet', {
    _: ['...Nice, isn\'t it? Most folk can\'t sit still long enough.', '*They nod at the water.* There. See the rings? Something\'s rising.'],
    cheerful: ['Oh, this is nice! Company and fishing! I\'ll tell you when to be quiet.'],
    ornery: ['...You\'re quieter than most. I\'ll give you that.'],
    shy: ['...You can stay. If you don\'t splash.'],
    curious: ['Watch the float. No, the other way. See how it trembles? That\'s a nibble thinking about it.'],
    dreamy: ['...Listen. The river sounds different from down here. Like it\'s telling you something long.'],
    witty: ['You\'re very good at this. Most wizards fidget. I assume. You\'re my first.'],
    proud: ['You\'ll scare nothing off sitting like that. You\'ve done this before, I think.'],
    gloomy: ['...It\'s the only place I don\'t worry. Daft, isn\'t it.'],
    'rift': ['...This is the quietest place I\'ve ever been. At first it scared me. Now I come here to think.'],
  });
  W('work.fisher.why', {
    _: ['The quiet, mostly. The fish are a good excuse.', 'Both. But if I\'m honest, the quiet. Fish don\'t ask questions.'],
    cheerful: ['The fish! And the quiet! And the kingfisher! And lunch on the bank! Everything!'],
    ornery: ['The quiet. Nobody follows me down here to tell me how to do it.'],
    shy: ['...The quiet. Down here nobody looks at me.'],
    curious: ['I like not knowing what\'s down there. Every bite\'s a surprise.'],
    dreamy: ['The way the light moves. You can watch it all day and never see it twice.'],
    witty: ['The fish. The fish, of course. I\'m a professional. ...The quiet.'],
    proud: ['The fish. Someone has to keep the Store in fish, and do it properly.'],
    gloomy: ['The quiet. Up there everyone\'s always wanting something.'],
    'spouse': ['The quiet. {Spouse} talks a great deal. Lovingly. A great deal.'],
    'kid': ['The quiet. Don\'t tell {kid}. I love them, but the river doesn\'t shout.'],
  });
  W('work.fisher.deep', {
    _: ['...Can I tell you something? I\'ve had Grandfather out of the water. Twice. I let him go.', '...I put the old ones back. The big ones, that have lived so long. It feels wrong to end them.'],
    cheerful: ['...I let him go! Grandfather! I had him on the bank and he looked at me and I let him go. Don\'t tell.'],
    ornery: ['...I had him. Grandfather. On the bank. And I let the old devil go. If you laugh I\'ll push you in.'],
    shy: ['...I had him once. I put him back. He looked so old. Don\'t tell anyone. Please.'],
    curious: ['...I caught him last spring. I measured him and put him back. I wanted to see if he\'d grow.'],
    dreamy: ['...I had him in my hands. He was so old and so tired. I let him go. The river needs him more than I do.'],
    witty: ['...Grandfather and I have a secret. I\'ve caught him twice and let him go. I like having something to aim at.'],
    proud: ['...I\'ve landed him. Twice. I let him go. A fish like that, you don\'t eat. You just know you could.'],
    gloomy: ['...I let him go. Grandfather. If I catch him, what\'s left to fish for?'],
  });
  W('work.fisher.follow', {
    _: ['Ha! Follow me and I\'ll fish in the pond.', 'Try it! I\'ll lead you round the meadow twice.'],
    cheerful: ['Ha! I\'ll take you on a lovely long walk to nowhere!'],
    ornery: ['You\'d be in the river in a minute. Those feet weren\'t made for sneaking.'],
    shy: ['...You\'d not be very quiet. You\'re very tall.'],
    witty: ['A wizard creeping through the reeds. That I\'d pay to see.'],
    proud: ['Many have tried. I lose them by the second stile.'],
  });
  W('work.fisher.kept', {
    _: ['Thank you. I knew I could tell you.', 'Not a word. Good. Now you\'re a fisher too, in a way.'],
    cheerful: ['Oh, good! Now we\'ve a secret! I love a secret.'],
    ornery: ['Hmph. See that you don\'t.'],
    shy: ['...Thank you.'],
    gloomy: ['...You\'re one of the few I\'d trust with it.'],
  });
  W('work.fisher.yet', {
    _: ['Do you think so? ...I\'ll be back at dawn, then.', 'From your mouth to the river\'s ear.'],
    cheerful: ['I will! I\'ll bring him to you on a plate! Well, a big plate.'],
    ornery: ['I\'ll have him. Don\'t you worry about that.'],
    gloomy: ['Maybe. One day. Probably not. But maybe.'],
    proud: ['Of course I will. It\'s only a matter of when.'],
  });
  W('work.fisher.huff', {
    _: ['I know my own bait, thank you, wizard.', 'He\'s seen better baits than you\'ve thought of.'],
    proud: ['My bait\'s caught more fish than you\'ve had breakfasts.'],
    ornery: ['Oh, aye. A wizard knows best about worms now, does he.'],
  });
  W('work.fisher.boot', {
    _: ['A boot! Ha! Was it a nice boot?', 'Ha! I\'ve caught three boots. Never a pair.'],
    cheerful: ['A BOOT! Oh, that\'s wonderful! Did you keep it?'],
    ornery: ['Hmph. Serves you right, using magic.'],
    shy: ['*laughs into a sleeve*'],
    witty: ['A boot. Well, they\'re easier to land than pike.'],
    gloomy: ['Ha. ...That\'s about my luck too.'],
    curious: ['A boot? Whose boot? Where did it come from? Did you find out?'],
    dreamy: ['I wonder who lost it, and where they were walking to.'],
    proud: ['Ha! I\'ve never caught a boot. That takes a special talent.'],
  });
  W('work.fisher.dusk', {
    _: ['The shallows at dusk... I\'ve not tried that. I\'ll go this evening.', 'Dusk, eh? Very well. I\'ll try it.'],
    cheerful: ['Ooh, yes! I\'ll take a lantern and a pie!'],
    ornery: ['Hm. Might be something in it. I\'ll see.'],
    curious: ['Of course! The midges come out over the shallows. Why didn\'t I think of that?'],
    proud: ['I\'d have thought of it myself. Eventually.'],
    gloomy: ['Worth a try. Not much else is working.'],
  });
  W('work.fisher.owes', {
    _: ['Ha! He does! The old devil owes me everything.', 'He\'ll never thank me. Pike haven\'t the manners.'],
    witty: ['I\'ll send him a bill. He can pay in sprats.'],
    shy: ['*smiles at the water*'],
  });

  // --- The woodwright: trees, the axe, and the round door ---------------------------------
  addThread({
    id: 'work.woodwright', label: 'Timber, trees and round doors', about: 'work', weight: 1, cool: 4,
    when: job('woodwright'), rel: (F) => (F.workCraftBuild ? 1.4 : 1.2),
    open: { ask: 'work.wood.open' },
    beats: {
      start: { line: 'work.wood.start', go: [
        { ap: 'ask', say: 'How do you choose which tree to fell?', to: 'choose' },
        { ap: 'ask', say: 'And how on earth do you make a door round?', to: 'door' },
        { ap: 'jest', say: 'Do the trees see you coming and hide?', to: 'trees' },
      ] },
      choose: { line: 'work.wood.choose', go: [
        { ap: 'listen', say: '*You wait. There\'s more, you think.*', label: 'Wait for more', to: 'oak', need: { open: 2 }, soft: true },
        { ap: 'ask', say: 'Do you plant as many as you fell?', to: 'plant' },
        { ap: 'ask', say: 'And the axe? How do you keep it?', to: 'axe' },
      ] },
      door: { line: 'work.wood.door', fx: { learn: ['work.wood.door', '{Name} bends oak for round doors by steaming it over a copper all morning.'] }, go: [
        { ap: 'ask', say: 'Which door are you proudest of?', to: 'proudest' },
        { ap: 'warm', say: 'I\'d love to watch you make one, some day.', to: 'watch' },
        { ap: 'jest', say: 'I\'d have just made it square and squinted.', to: 'square' },
      ] },
      trees: { line: 'work.wood.trees', go: [
        { ap: 'ask', say: 'Do you plant as many as you fell?', to: 'plant' },
        { ap: 'jest', say: 'I\'ve heard the beeches are forming a committee.', to: 'committee' },
      ] },
      axe: { line: 'work.wood.axe', go: [
        { ap: 'advise', say: 'Sharpen it before supper, not after. Tired hands slip.', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'sharpen'] },
        { ap: 'share', say: 'My staff was a branch once. It still sulks in the rain.', to: 'staff' },
      ] },
      oak: { line: 'work.wood.oak', fx: { confide: { k: 'work.wood.oak', t: '{Name} will never fell the old oak by the stream, and talks to it on the way home', secret: true }, feel: 'drawn_out' }, go: [
        { ap: 'warm', say: 'Some trees are worth more standing.', to: 'standing' },
        { ap: 'ask', say: 'What do you tell it?', to: 'tell', need: { trust: 0.15 }, soft: true },
      ] },
      tell: { line: 'work.wood.tell', fx: { trust: 0.04 }, go: [
        { ap: 'warm', say: 'I expect it\'s glad of the news.', to: 'standing' },
        { ap: 'jest', say: 'And does it ever answer back?', to: 'answer' },
      ] },
      proudest: { line: 'work.wood.proudest', fx: { feel: 'proud_work', feelX: 'round door' }, go: [
        { ap: 'warm', say: 'I\'ll knock on it next time I pass.', to: 'knock' },
        { ap: 'ask', say: 'And the one you\'d do again, if you could?', to: 'again' },
      ] },
      plant: { line: 'work.wood.plant', end: true },
      watch: { line: 'work.wood.watch', fx: { promise: { k: 'work.wood.watch', t: 'You said you\'d come and watch {name} bend a door', days: 6 }, fond: 0.02 }, end: true },
      square: { line: 'work.wood.square', fx: { fond: 0.01 }, end: true },
      committee: { line: 'work.wood.committee', fx: { joke: { k: 'work.beeches', t: 'The beeches are forming a committee against {name}.' }, fond: 0.02 }, end: true },
      sharpen: { line: 'work.wood.sharpen', fx: { respect: 0.03, queue: 'woodwright_sharpen' }, end: true },
      bristle: { line: 'work.wood.bristle', fx: { fond: -0.02, sore: { days: 1 } }, end: true },
      staff: { line: 'work.wood.staff', fx: { trust: 0.02 }, end: true },
      standing: { line: 'work.wood.standing', fx: { trust: 0.03 }, end: true },
      answer: { line: 'work.wood.answer', fx: { fond: 0.02 }, end: true },
      knock: { line: 'work.wood.knock', end: true },
      again: { line: 'work.wood.again', fx: { learn: ['work.wood.again', '{Name} would like one more go at a door they built years back.'] }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  W('work.wood.open', {
    _: ['Tell me about the timber, {name}. Trees and doors and all.', 'You build our homes, {name}. Tell me how.', 'How\'s the timber, {name}? Good wood this year?'],
    'workCraftBuild>1': ['There\'s building on, I see. How\'s it coming, {name}?'],
    'season=winter': ['Cold work, felling in winter, {name}?'],
  });
  W('work.wood.start', {
    _: ['Timber\'s good. Oak and ash, mostly, and a bit of beech for the fires.', 'Fell, lop, saw, stack. And then do it again. It\'s honest work.', 'There\'s always something wanting wood. A hearth, a beam, a door.'],
    cheerful: ['Lovely! I felled a beauty this morning. Straight as a candle, and not a knot in it.', 'Grand! Sawdust in my hair and a good stack by the barn. I\'m happy.'],
    ornery: ['Everyone wants timber and nobody wants to carry it.', 'The axe needs sharpening, the saw needs setting and I need a sit down.'],
    shy: ['...It\'s good. The woods are quiet. I like the woods.', 'Oh. Hello. ...I was just stacking. It\'s nearly a good stack.'],
    curious: ['Did you know you can tell a tree\'s age by its rings? This one was older than the mill.', 'I\'ve been splitting ash and beech side by side. Ash splits clean. Beech argues.'],
    dreamy: ['The woods smell like rain even when it\'s dry. I could stand there all day.', 'When a tree comes down there\'s a hush after, like the whole wood\'s listening.'],
    witty: ['Timber! That\'s the main word. The rest is mostly ow.', 'I\'ve made a great many logs out of a few trees. It\'s a gift.'],
    proud: ['Every round door in this lane is my work or my teacher\'s. Look how they swing.', 'My stack\'s the straightest in the valley. Folk come to look at it.'],
    gloomy: ['Every hearth burns it faster than I can cut it. It\'s a race I don\'t win.', 'My shoulders ache in a way I never knew shoulders could.'],
    'workCraftBuild>1 ^1': ['There\'s building on, so it\'s beams and planks and more beams. A new hole wants a forest.', 'We\'re digging a new smial. The hill\'s easy. The door\'s the hard part.'],
    'workCraftBuild>3 ^1': ['Three jobs on at once! The Steward thinks woodwrights grow on trees. Ha. Trees grow on trees.'],
    'season=spring': ['Spring\'s for planting saplings and mending what winter broke.', 'Sap\'s rising. You don\'t fell in spring if you can help it. The wood weeps.'],
    'season=summer': ['Summer\'s for building. Dry weather, long days, and the beams go up.'],
    'season=autumn': ['Autumn\'s for stacking. Every hole wants its woodpile full before the frost.'],
    'season=winter': ['Winter\'s the felling time. The sap\'s down and the wood\'s hard and my nose is blue.'],
    'workHazard=frost ^2': ['Hard frost! Every hearth\'s burning double. I\'ve not stopped since dawn.'],
    'workHazardSoon=frost ^2': ['A frost\'s coming, they say. I\'ve been stacking like a squirrel.'],
    'workShort': ['The woodpile\'s low and winter doesn\'t wait. I\'m cutting all the hours there are.'],
    'register=fine': ['The timber this season is excellent. Close-grained, and seasoned beautifully in the barn.'],
    'register=plain': ['Wood\'s wood. You cut it, it burns. You cut it careful, it stands.'],
    'stage=elder': ['I built half the doors in this valley, and mended the other half.'],
    'rift': ['Back home everything was plastic and alloy. Wood smells alive. I can\'t get over it.'],
  });
  W('work.wood.choose', {
    _: ['You look for one that\'s ready. Leaning, crowding its neighbors, or a bit tired at the top.', 'Never the best tree. Never the worst. The one the wood can spare.'],
    cheerful: ['I walk round and ask! Well. I look. But it feels like asking.'],
    ornery: ['The one that\'s in the way. There\'s always one in the way.'],
    shy: ['...I take my time. I don\'t like to rush it.'],
    curious: ['The lean, the bark, the crown. A tree tells you everything if you look.', 'I tap them and listen. A hollow one rings. You learn the sound.'],
    dreamy: ['You stand under it and wait. Some trees feel ready. Some don\'t.'],
    witty: ['The one that looks least like it\'s about to fall on me.'],
    proud: ['Forty years of looking. I can spot a good beam from across the valley.'],
    gloomy: ['Whichever one we\'ll need most and miss most. That\'s always the way.'],
    'workFamilyTrade': ['{WorkParentName} taught me: walk round it three times. If you still want it, it\'s yours.'],
    'workLevel=new ^1': ['I\'m still learning. I ask {workMate} mostly, and {workMate} sighs and points.'],
  });
  W('work.wood.door', {
    _: ['Steam. You steam the oak over a copper all morning till it bends like a willow wand.', 'You bend it round a frame while it\'s hot and soft, and you pray, and you leave it a week.'],
    cheerful: ['Steam and patience and a lot of singing! The singing\'s important. Probably.'],
    ornery: ['Steam, a frame and nobody standing over you asking questions. Like now.'],
    shy: ['...Steam. And a frame. And you don\'t hurry it. It knows if you hurry it.'],
    curious: ['The steam softens the wood from inside. You\'ve maybe an hour before it remembers it\'s a plank.'],
    dreamy: ['You coax it. You steam it soft and bend it slow, like talking a cat down off a roof.'],
    witty: ['Very carefully, and with a great deal of swearing at the corners. There aren\'t any corners. That\'s the trick.'],
    proud: ['Steamed oak, bent on a frame I made myself. Mine never spring back. Others\' do.'],
    gloomy: ['Steam. And two in five crack anyway. You don\'t see those. I burn them.'],
    'stage=elder': ['My master used ash. I use oak. My apprentice will use something else and tell me I was wrong.'],
  });
  W('work.wood.trees', {
    _: ['Ha! I\'d like to see them try.', 'They do rustle a bit when I walk past with the axe.'],
    cheerful: ['Ha! They do shuffle a bit! I say good morning so they know I\'m friendly.'],
    ornery: ['If they could hide, half of them would be in Bree by now.'],
    shy: ['...I say sorry. Before. Is that silly?'],
    curious: ['Do you know, the birds go quiet when I pick up the axe. Every time.'],
    dreamy: ['Sometimes I think they know. They go very still.'],
    witty: ['The willows tried. Too bendy to run.'],
    proud: ['They line up to be chosen. They know my work.'],
    gloomy: ['If they had any sense they would.'],
  });
  W('work.wood.axe', {
    _: ['Oil on the head, linseed on the handle, and never left out in the rain.', 'A whetstone every evening. A blunt axe is a dangerous axe.'],
    cheerful: ['I give it a name! She\'s called Bess. Bess gets oiled every Highday.'],
    ornery: ['Keep your hands off it, for a start. Everyone wants to borrow it.'],
    shy: ['...I keep it by the door. Wrapped. Like a cat in a blanket.'],
    curious: ['I\'ve been trying a finer stone. It takes an edge you could shave with.'],
    dreamy: ['It was my teacher\'s. The handle\'s worn to the shape of two hands. Mine and hers.'],
    witty: ['Lovingly. More lovingly than I keep myself, my family says.'],
    proud: ['Sharp enough to split a hair. I\'ve done it. Ask anyone.'],
    gloomy: ['It\'s seen better days. So have I. We understand each other.'],
    'workFamilyTrade': ['It was {workParentName}\'s axe. New head, new handle, same axe.'],
  });
  W('work.wood.oak', {
    _: ['...There\'s an old oak by the stream. I\'ll never take it. I talk to it, on the way home. Don\'t laugh.', '...The big oak by the stream. Older than the village. I couldn\'t. I just couldn\'t.'],
    cheerful: ['...There\'s one I\'ll never fell. The old oak by the stream. I wave at it! Every day!'],
    ornery: ['...The old oak by the stream. Anyone lays an axe on it, they deal with me.'],
    shy: ['...There\'s an oak. By the stream. I talk to it. It\'s the only one I tell things.'],
    curious: ['...The oak by the stream. I counted its rings on a fallen branch. It was a sapling before the Shire had a name.'],
    dreamy: ['...By the stream there\'s an oak so old it\'s more like weather than a tree. I sit under it.'],
    witty: ['...I\'ve a friend by the stream. Tall, quiet, very good listener. It\'s an oak. Keep that to yourself.'],
    proud: ['...There\'s one tree I\'ll never touch. Some things are older than pride.'],
    gloomy: ['...The oak by the stream. When it goes, I think I\'ll hang up the axe.'],
    'workFamilyTrade': ['...The oak by the stream. {WorkParentName} carved our names in it. Too high for anyone to see.'],
  });
  W('work.wood.tell', {
    _: ['Oh, the news. Who\'s married, who\'s poorly, how the barley\'s doing. It\'s seen it all before.', 'What I\'ve cut that day. I feel I owe it that.'],
    cheerful: ['Everything! It\'s a very good audience. Never interrupts.'],
    ornery: ['What I think of everyone. It\'s the only one who doesn\'t argue.'],
    shy: ['...Things I can\'t say to anyone else. You\'re the second to know that.'],
    curious: ['I ask it questions. What it was like before the village. It doesn\'t say. I keep asking.'],
    dreamy: ['I tell it what I dreamed. It seems to like that best.'],
    witty: ['I tell it jokes. It\'s very dry. Never laughs.'],
    proud: ['How the work went. Somebody should know.'],
    gloomy: ['My worries. It\'s seen worse. It says so, in its way.'],
  });
  W('work.wood.proudest', {
    _: ['The green door at the end of the lane. Thirty years and it still shuts soft as a sigh.', 'The door of the Bakehouse. Swings with one finger, even full of flour.'],
    cheerful: ['The door of my own hole! I made it the year I married. It still smiles at me.'],
    ornery: ['All of them. Not one of mine has stuck. Not one.'],
    shy: ['...There\'s a little one. A pantry door. Nobody sees it. It\'s perfect.'],
    curious: ['The one with the window in it. Nobody had done that. Round glass in a round door.'],
    dreamy: ['A door for a newborn\'s nursery. I carved little stars in the lintel. Nobody looks up.'],
    witty: ['The one that\'s still on its hinges. Ha! No. They all are. Mostly.'],
    proud: ['The door of the inn. Every hobbit in the valley has gone through it. Every one.'],
    gloomy: ['The one I made for a hole that\'s empty now. It still shuts perfectly.'],
    'workLevel=new ^1': ['I\'ve only done one on my own. The shed. It\'s not round. It\'s nearly round.'],
    'workMasterpiece ^2': ['{WorkMasterpiece}. You\'ve seen it? Folk come and touch the grain.'],
  });
  W('work.wood.plant', {
    _: ['Two for every one. A woodwright who doesn\'t plant is a woodwright out of work in forty years.', 'More. The saplings by the barn are mine. Every one.'],
    cheerful: ['More! I plant acorns everywhere. Folk find oaks in their gardens and blame the squirrels.'],
    ornery: ['Course I do. More than the Steward bothers to count.'],
    shy: ['...I plant one for every hole I build. For the family. They don\'t know.'],
    curious: ['I keep a tally. I\'m four hundred ahead. Well. Two hundred, if you count the ones the deer ate.'],
    dreamy: ['I plant for folk I\'ll never meet. That\'s the nicest thing about it.'],
    witty: ['I plant them, the squirrels move them, and we call it even.'],
    proud: ['Every tree I\'ve felled, I\'ve planted two. You\'ll walk through my woods when I\'m gone.'],
    gloomy: ['I plant them. I\'ll not see them grown. Somebody will.'],
  });
  W('work.wood.watch', {
    _: ['Would you? Come on a steaming day. Bring a towel. It\'s damp work.', 'Come by the barn some morning. I\'ll show you the frame.'],
    cheerful: ['Oh, yes! Come! I\'ll let you hold the end! Well. Near the end.'],
    ornery: ['If you stand where I tell you and don\'t touch anything.'],
    shy: ['...You can. If you like. I don\'t usually have people watch.'],
    proud: ['You\'ll not see it done better anywhere.'],
    gloomy: ['If it doesn\'t crack. It might crack. Come anyway.'],
  });
  W('work.wood.square', {
    _: ['Ha! A square door in a round hole! The whole lane would talk.', 'Squinting! Ha. That\'s how they do it in Bree, I hear.'],
    cheerful: ['Ha! You\'d have the whole hill laughing!'],
    ornery: ['Wizards. No respect for a curve.'],
    witty: ['I\'ve seen your hat. I believe you.'],
    proud: ['That\'s how the cheap ones do it. Not me.'],
    shy: ['*snorts, and covers it with a cough*'],
  });
  W('work.wood.committee', {
    _: ['Ha! The beeches! They\'re the worst gossips in the wood.', 'Ha! Let them. I\'ve an axe.'],
    witty: ['They\'ll take minutes. And then the minutes will take hours. Beeches are slow.'],
    ornery: ['Hmph. Let them try. I\'ll vote them firewood.'],
  });
  W('work.wood.sharpen', {
    _: ['Before supper. Hm. That\'s sense. I\'ll do it now.', 'Fair. My fingers have opinions about tired sharpening. I\'ll go and do it.'],
    cheerful: ['Good thinking! Bess will love you for it.'],
    curious: ['Tired hands slip... Yes. That\'s when I cut myself last time.'],
    shy: ['...Yes. All right. I\'ll do it now.'],
    gloomy: ['I suppose. Better a sharp axe than a sorry thumb.'],
  });
  W('work.wood.bristle', {
    _: ['I\'ve been sharpening axes since before you had that hat, wizard.', 'I know how to keep my own axe, thank you.'],
    proud: ['Teach a woodwright to sharpen? Next you\'ll teach the river to run.'],
    ornery: ['Oh, aye. And I suppose you\'ll tell the fish to swim.'],
  });
  W('work.wood.staff', {
    _: ['Ha! Ash, is it? Ash always sulks in the wet.', 'Let me look. ...That\'s a good bit of wood, that. Old, too.'],
    cheerful: ['A sulky staff! Oh, I\'d love to have a look at it!'],
    curious: ['What wood is it? Can I see the grain? Is that a knot or a rune?'],
    witty: ['A sulky stick. You and it must get on.'],
    proud: ['Bring it by. I\'ll oil it properly. It\'ll stop sulking.'],
    shy: ['...Can I hold it? Just for a moment?'],
  });
  W('work.wood.standing', {
    _: ['...Yes. That\'s it exactly. Thank you.', 'Worth more standing. I might carve that on something.'],
    ornery: ['Hmph. Well. Yes. Don\'t tell the Steward.'],
    shy: ['...You understand. Most don\'t.'],
    gloomy: ['...For now. While I\'m here to see to it.'],
  });
  W('work.wood.answer', {
    _: ['Ha! Only in the wind. And that\'s usually rude.', 'Sometimes it drops an acorn on my head. I take that as a no.'],
    witty: ['It\'s very wise. It never says anything at all.'],
    dreamy: ['...Sometimes I think it does. Very slowly. Over years.'],
  });
  W('work.wood.knock', {
    _: ['Do! And listen to it. A good door has a voice.', 'Knock soft. It\'s old.'],
    witty: ['If nobody answers, the door will.'],
  });
  W('work.wood.again', {
    _: ['The first one I ever made. It sticks in wet weather. It haunts me.', 'The one on the hill. I rushed it. I\'d not rush it now.'],
    proud: ['None. ...All right. One. I won\'t say which.'],
    gloomy: ['All of them, probably. You always see what you\'d do better.'],
  });

  // --- The herbalist: remedies, the poorly, and the old book ----------------------------
  addThread({
    id: 'work.herbalist', label: 'What\'s good for what ails us?', about: 'work', weight: 1, cool: 4,
    when: job('herbalist'), rel: (F) => (F.workCraftPoorly || F.workHazard === 'blight' ? 1.5 : 1.2),
    open: { ask: 'work.herb.open' },
    beats: {
      start: { line: 'work.herb.start', go: [
        { ap: 'ask', say: 'Can you save the barley?', to: 'blight', need: { if: { workHazard: 'blight' } } },
        { ap: 'ask', say: 'What goes into one of your remedies?', to: 'remedy' },
        { ap: 'jest', say: 'Have you anything for an old wizard\'s knees?', to: 'wizards' },
        { ap: 'listen', say: 'And who\'s poorly, this week?', to: 'rounds' },
      ] },
      remedy: { line: 'work.herb.remedy', fx: { learn: ['work.herb.remedy', '{Name} swears by feverfew for a fever and willow bark for an ache.'] }, go: [
        { ap: 'ask', say: 'Where did you learn it all?', to: 'learned' },
        { ap: 'advise', say: 'Write it all down, for whoever comes after you.', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'writedown'] },
        { ap: 'share', say: 'I know a few herbs myself. Mostly for smoking.', to: 'smoking' },
      ] },
      wizards: { line: 'work.herb.wizards', go: [
        { ap: 'jest', say: 'I\'d best warn you: I\'m a wizard. Walking is the job.', to: 'walking' },
        { ap: 'ask', say: 'And truly? What would you give me?', to: 'remedy' },
      ] },
      rounds: { line: 'work.herb.rounds', go: [
        { ap: 'comfort', say: 'You can\'t mend everything. Nobody can.', to: 'cant' },
        { ap: 'listen', say: '*You say nothing, and let the worry come out.*', label: 'Let the worry come out', to: 'deep', need: { open: 2 }, soft: true },
        { ap: 'advise', say: 'See to your own beds today. You\'ll want the herbs.', to: 'beds' },
      ] },
      learned: { line: 'work.herb.learned', go: [
        { ap: 'ask', say: 'Could I see the book, one day?', to: 'book', need: { trust: 0.2 }, soft: true },
        { ap: 'warm', say: 'Then the old knowledge is in good hands.', to: 'hands' },
      ] },
      book: { line: 'work.herb.book', fx: { confide: { k: 'work.herb.book', t: '{Name} keeps a book of remedies, and the last page is one that didn\'t work', secret: true }, trust: 0.03 }, go: [
        { ap: 'warm', say: 'That page is as wise as all the others.', to: 'wise' },
        { ap: 'comfort', say: 'Nobody could have done better.', to: 'cant' },
      ] },
      deep: { line: 'work.herb.deep', fx: { confide: { k: 'work.herb.fear', t: '{Name} lies awake fearing the one fever they can\'t break', secret: true }, feel: 'drawn_out' }, go: [
        { ap: 'warm', say: 'Then you\'re the right one for the work. The careless don\'t lie awake.', to: 'wise' },
        { ap: 'share', say: 'I fear the same things. In my way.', to: 'shared' },
      ] },
      blight: { line: 'work.herb.blight', go: [
        { ap: 'advise', say: 'Go now, while it\'s young. Every hour counts.', to: 'goblight', fx: { queue: 'treat_blight' } },
        { ap: 'ask', say: 'Have you herbs enough?', to: 'enough' },
      ] },
      enough: { line: 'work.herb.enough', go: [
        { ap: 'advise', say: 'Then go now, and take all you have.', to: 'goblight', fx: { queue: 'treat_blight' } },
        { ap: 'warm', say: 'You\'ll manage. You always do.', to: 'hands' },
      ] },
      writedown: { line: 'work.herb.writedown', fx: { respect: 0.03 }, end: true },
      bristle: { line: 'work.herb.bristle', fx: { fond: -0.02 }, end: true },
      smoking: { line: 'work.herb.smoking', fx: { fond: 0.02, joke: { k: 'work.herb.smoke', t: 'The wizard\'s only herbal knowledge is for smoking.' } }, end: true },
      walking: { line: 'work.herb.walking', fx: { fond: 0.02 }, end: true },
      cant: { line: 'work.herb.cant', fx: { trust: 0.03 }, end: true },
      beds: { line: 'work.herb.beds', fx: { respect: 0.02, queue: 'herbalist_beds' }, end: true },
      hands: { line: 'work.herb.hands', fx: { fond: 0.02 }, end: true },
      wise: { line: 'work.herb.wise', fx: { trust: 0.03, fond: 0.02 }, end: true },
      shared: { line: 'work.herb.shared', fx: { trust: 0.04 }, end: true },
      goblight: { line: 'work.herb.goblight', fx: { respect: 0.04, remember: 'The wizard sent me to the blighted barley.' }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  W('work.herb.open', {
    _: ['What\'s good for what ails us, {name}?', 'What\'s in the mortar today, {name}?', 'You smell of mint and something else, {name}. What is it?'],
    'workHazard=blight': ['The blight\'s in the barley, {name}. Can you do anything?'],
    'workCraftPatient': ['How\'s {workCraftPatient} doing, {name}?'],
    'season=winter': ['Busy season for you, {name}, with all the coughs about?'],
  });
  W('work.herb.start', {
    _: ['Feverfew\'s drying, the comfrey\'s up and I\'ve a pot of willow bark on the go.', 'Herbs to gather, herbs to dry, herbs to grind. And somebody always needs one of them now.', 'The beds are coming on. Mint everywhere. Mint is a bully.'],
    cheerful: ['Oh, everyone\'s well! Nearly everyone. I\'ve had time to tidy the jars!', 'Lovely! The camomile\'s flowering. The whole kitchen smells like a nap.'],
    ornery: ['Folk come for a tonic, won\'t take it, and come back worse. Same as every week.', 'Busy. Always busy. Nobody\'s ever poorly at a sensible hour.'],
    shy: ['...I\'ve been drying feverfew. It\'s quiet work. I like it.', 'Oh. Hello. ...Is somebody poorly? Oh. Good. I mean, good.'],
    curious: ['I\'ve been trying willow bark and honey together. The honey makes it go down. The willow does the rest.', 'There\'s a moss by the well I\'ve never seen before. I\'ve been watching it all week.'],
    dreamy: ['The herb beds are humming with bees. I stood in the lavender and forgot what I came for.', 'Every plant\'s for something. Even nettles. Especially nettles.'],
    witty: ['I\'ve cured three colds and one case of Mondays. The Mondays came back.', 'Business is brisk. Well. Sniffly.'],
    proud: ['Nobody\'s been laid up longer than two days all season. That\'s my doing.', 'My remedies are the best this side of the Water. Folk send from Bree.'],
    gloomy: ['There\'s always someone coughing. You mend one and two more start.', 'The beds want weeding, the jars want filling and nobody wants my tonic.'],
    'workCraftPatient ^1': ['{WorkCraftPatient}\'s poorly. I\'ve been in and out with broth and feverfew all day.', 'I\'m keeping an eye on {workCraftPatient}. It\'s a cold, I think. I hope.'],
    'workCraftPoorly>2 ^1': ['{WorkCraftPoorly} poorly at once! I\'m running out of hands and handkerchiefs.'],
    'workHazard=blight ^2': ['Blight in the barley. I\'ve been mixing a wash all morning. It wants a lot of herbs.', 'The blight\'s got into the field. The farmers look at me like I can fix it. I can. I think.'],
    'workHazardSoon=blight ^2': ['There\'s blight going about, they say. I\'ve been keeping herbs back for the barley.'],
    'season=spring': ['Spring\'s for gathering. Everything young and green and full of good.', 'Nettles! Young nettles for soup and tonic. Gloves on, mind.'],
    'season=summer': ['Summer\'s the drying time. My ceiling\'s all hung with bunches like a green rain.'],
    'season=autumn': ['Autumn\'s for roots and berries. Elderberry for winter coughs. You\'ll thank me in Foreyule.'],
    'season=winter': ['Winter\'s coughs and chilblains and the flu going round. I\'ve not sat down since Yule.', 'Nothing to gather, everything to give out. The jars go down and down.'],
    'workShort': ['The remedy jars are nearly empty. I can\'t make them fast enough.'],
    'register=fine': ['The physic garden is flourishing, I\'m pleased to say. The valerian especially.'],
    'register=plain': ['Herbs is herbs. You know which does what, or you don\'t.'],
    'stage=elder': ['Fifty years of remedies, and still the cold\'s the one I can\'t cure.'],
    'sick ^2': ['The herbalist, poorly. Don\'t look at me like that. I know.'],
    'rift': ['Back home we had pills. Little colored ones. These leaves work better, honestly. Don\'t tell Neverdark.'],
  });
  W('work.herb.remedy', {
    _: ['Feverfew for a fever, willow bark for an ache, mint for a belly and camomile for a bad night.', 'Elderflower, honey and a pinch of ginger, steeped till it\'s gold. And rest. Rest\'s half of it.'],
    cheerful: ['Honey! Honey in everything. It doesn\'t do much but it makes folk smile, and smiling does.'],
    ornery: ['The right herb, the right amount, and the patient doing as they\'re told. That last is rarest.'],
    shy: ['...Willow bark, mostly. And sitting with them. The sitting helps more than folk think.'],
    curious: ['That\'s feverfew, dried, ground and steeped. I\'m trying a drop of thyme in it too. For science.'],
    dreamy: ['A little of the meadow in a cup. That\'s all a remedy is, really. Summer for the poorly.'],
    witty: ['Two parts herb, one part honey and one part telling them it\'ll taste nice. It won\'t.'],
    proud: ['My own receipt. Feverfew, willow and something I don\'t tell. It\'s never failed me.'],
    gloomy: ['Ditchwater and hope, the old folk say. Mostly herbs. A little hope.'],
    'workFamilyTrade': ['{WorkParentName}\'s receipt. I\'ve not changed a leaf. I wouldn\'t dare.'],
  });
  W('work.herb.wizards', {
    _: ['For your knees? Comfrey poultice, a hot bath and a lot less walking.', 'Wizards? I\'d need to know what you\'re made of first.'],
    cheerful: ['Oh, for you, my best! A comfrey rub and a cushion. And cake. Cake\'s always in it.'],
    ornery: ['Less wandering about and more sitting down, by the look of you.'],
    shy: ['...Comfrey. On the knees. I could make you some. If you wanted.'],
    curious: ['Oh! Could I examine them? I\'ve never seen a wizard\'s knee. Do they bend the same?'],
    dreamy: ['For a wizard? Starlight and willow bark, I should think. I\'ve only got the willow.'],
    witty: ['A new pair. I\'ll ask the woodwright.'],
    proud: ['I\'ve cured worse knees than yours. The Proudfoot knees are legendary.'],
    gloomy: ['Nothing cures old knees. They just get older. Like the rest of us.'],
  });
  W('work.herb.walking', {
    _: ['Ha! Then sit down when you get there.', 'Ha! Then you\'re a hopeless case. I\'ll make you a poultice anyway.'],
    witty: ['Then you\'ll need a stronger poultice. And a pony.'],
    ornery: ['Then don\'t come grumbling to me about it.'],
    cheerful: ['Ha! Then I\'ll make a big pot and you can take it with you!'],
  });
  W('work.herb.rounds', {
    _: ['Old somebody up the lane with his chest. A little one with a tummy ache. And the usual sniffles.', 'Nobody too bad, touch wood. But I\'ve been up the lane twice already.'],
    cheerful: ['Hardly anyone! A sniffle here and there. I bring soup and they get better and I feel useful.'],
    ornery: ['Everyone who didn\'t take my tonic last week. Funny, that.'],
    shy: ['...A few. I go in quietly. Folk don\'t like a fuss when they\'re poorly.'],
    curious: ['Three coughs, all on the same side of the lane. I think it\'s the damp. I\'m looking into it.'],
    dreamy: ['A few. I sit with them and they tell me things they\'d never tell anyone well.'],
    witty: ['Half the lane, and the other half pretending, to get my honey drops.'],
    proud: ['A few, and none of them will be poorly long. Not on my watch.'],
    gloomy: ['Too many. It always feels like too many.'],
    'workCraftPatient ^1': ['{WorkCraftPatient}. I\'m keeping a close eye. Broth twice a day and no going out.'],
    'season=winter ^1': ['Half the valley. It\'s flu season. I\'ve a list as long as my arm.'],
  });
  W('work.herb.cant', {
    _: ['...No. I know. It\'s just hard to remember at three in the morning.', '...Thank you. I needed someone to say that.'],
    ornery: ['Hmph. Try telling that to my head at night.'],
    shy: ['...I know. Thank you.'],
    proud: ['I can mend most things. ...But not all. No.'],
    gloomy: ['...No. You\'re right. I don\'t like it, but you\'re right.'],
    cheerful: ['No! But I can mend a great deal, and that\'s something.'],
    witty: ['Ha. No. But I can mend the pretenders. With a very bitter tonic.'],
    curious: ['No. But every one I can\'t teaches me something for the next.'],
    dreamy: ['...No. Some things mend themselves, in their own time. I try to remember that.'],
  });
  W('work.herb.deep', {
    _: ['...Every winter I think: this is the year a fever comes I can\'t break. I lie awake with it.', '...I\'m frightened of getting it wrong. A pinch too much of something. Nobody knows that.'],
    cheerful: ['...Don\'t tell anyone, but I\'m frightened every time someone\'s really poorly. I just smile harder.'],
    ornery: ['...I snap at folk because I\'m frightened for them. There. Now you know.'],
    shy: ['...I check every jar three times. Every time. In case. I can\'t stop.'],
    curious: ['...There are things in these herbs I don\'t understand. Some days that frightens me more than it should.'],
    dreamy: ['...I dream about the ones I sit with. That they\'re walking ahead of me and I can\'t catch up.'],
    witty: ['...I make jokes at the bedside so they don\'t see me worry. It\'s a very good trick. Mostly.'],
    proud: ['...I\'ve never lost a patient. I\'m terrified of the day I do.'],
    gloomy: ['...One day there\'ll be a fever I can\'t break. I think about that day a great deal.'],
  });
  W('work.herb.learned', {
    _: ['From an old book of my grandmother\'s, and from getting it wrong on myself first.', 'From the old herbalist, years back. She made me taste everything. Everything.'],
    cheerful: ['From everyone! Grannies, mostly. Every granny has a cure and three of them work!'],
    ornery: ['From watching what didn\'t work, and not doing that.'],
    shy: ['...There\'s a book. I keep it in a drawer. I don\'t show anyone.'],
    curious: ['From trying. I\'ve tasted every leaf in this valley. Some twice, by mistake.'],
    dreamy: ['The plants teach you, if you sit with them long enough.'],
    witty: ['A book, a granny and a great many stomach aches.'],
    proud: ['From the best. And then I improved on her.'],
    gloomy: ['The hard way. There isn\'t another.'],
    'workFamilyTrade': ['From {workParentName}, at the kitchen table, every evening, whether I liked it or not.'],
    'workMaster ^1': ['{WorkMaster}\'s teaching me now. I\'ve a notebook full already.'],
  });
  W('work.herb.book', {
    _: ['...It\'s here. Every remedy, in three hands: my grandmother\'s, my mother\'s, mine. The last page is one that didn\'t work.', '...I\'ll show you. Look. The last page. I wrote down the one I couldn\'t mend. So I\'d never forget.'],
    shy: ['...Here. Don\'t read the last page. ...All right. It\'s the one that didn\'t work. I keep it there.'],
    proud: ['...Very well. Two hundred remedies. And one at the back that failed. I keep it to stay humble.'],
    gloomy: ['...The last page is the one that went wrong. I read it more than all the rest.'],
    cheerful: ['...Here! Look at all the drawings! And the last page... that one didn\'t work. I keep it anyway.'],
  });
  W('work.herb.writedown', {
    _: ['Write it down... I suppose I should. Before it\'s all in my head and nowhere else.', 'You\'re right. I\'ll start a fresh book. A tidy one.'],
    cheerful: ['Oh, yes! With pictures! I\'ll draw every leaf!'],
    curious: ['Yes! And what didn\'t work, too. That\'s just as useful.'],
    shy: ['...Yes. For whoever comes after. That\'s nice to think of.'],
    gloomy: ['I suppose somebody will need it when I\'m gone.'],
  });
  W('work.herb.bristle', {
    _: ['It\'s written in here, wizard. I don\'t need a book to know my trade.', 'Thank you. I\'m not quite in my grave yet.'],
    proud: ['Whoever comes after me can learn the way I did.'],
    ornery: ['Write it down! And have every fool in the valley dosing themselves.'],
  });
  W('work.herb.smoking', {
    _: ['Ha! Smoking! I\'m not putting that in the book.', 'Ha! Old Toby\'s not a herb, wizard. Well. It is. But not like that.'],
    witty: ['Pipe-weed. The one herb every hobbit already knows the dose of. Too much.'],
    ornery: ['Hmph. Leaf. It\'s half my coughs.'],
    cheerful: ['Ha! Well, it does settle the nerves! I\'ll allow it!'],
  });
  W('work.herb.beds', {
    _: ['You\'re right. If the beds go untended, I\'ve nothing to give. I\'ll go now.', 'The beds. Yes. The comfrey wants splitting anyway.'],
    curious: ['Yes, while the dew\'s off. That\'s when the leaves are best.'],
    shy: ['...Yes. That\'s sensible. Thank you.'],
  });
  W('work.herb.hands', {
    _: ['...I hope so. I try.', 'That\'s kind. My hands smell of mint, at least.'],
    proud: ['They are. But thank you for saying.'],
    shy: ['*looks down at stained fingers, and smiles*'],
  });
  W('work.herb.wise', {
    _: ['...I never thought of it like that. Thank you, wizard.', '...Maybe. Maybe you\'re right.'],
    gloomy: ['...That\'s a kinder way of seeing it than I manage.'],
    shy: ['...Thank you. Truly.'],
    proud: ['...Hm. Yes. I suppose it is.'],
  });
  W('work.herb.shared', {
    _: ['You? ...I suppose wizards must. That\'s a comfort, strangely.', '...Then we\'ll fear them together. That\'s better than alone.'],
    shy: ['...Thank you for telling me.'],
    curious: ['What do wizards fear? No. Don\'t tell me. I\'ve enough of my own.'],
  });
  W('work.herb.blight', {
    _: ['I can. A strong wash of herbs, on every stalk. But it wants doing soon, and it wants a lot of herbs.', 'If I\'m quick. Blight\'s like a cough: catch it early and it\'s nothing.'],
    ornery: ['I can, if folk stop asking me if I can and let me get on.'],
    shy: ['...I think so. I\'ve read how. I\'ve not done a whole field.'],
    proud: ['Of course I can. I\'ve seen off worse blight than this.'],
    gloomy: ['Maybe. If it hasn\'t spread. It\'s usually spread.'],
  });
  W('work.herb.enough', {
    _: ['Just about. If nobody else falls ill this week.', 'Enough for one go. Not two.'],
    gloomy: ['Never enough. But some.'],
    proud: ['I always keep some back. I\'m not a fool.'],
  });
  W('work.herb.goblight', {
    _: ['Right. Right! I\'m going now. Tell the farmers to keep their boots off it.', 'Now. Yes. Every hour counts. Thank you, wizard.'],
    shy: ['...All right. Now. I\'ll go now.'],
    ornery: ['I was going anyway. ...I\'ll go faster.'],
    cheerful: ['Off I go! Barley, here I come!'],
  });

  // --- The mail carrier: the round, the letters, and the dogs -------------------------------------
  addThread({
    id: 'work.mailcarrier', label: 'What\'s in the post bag today?', about: 'work', weight: 1, cool: 4,
    when: job('mailcarrier'), rel: (F) => (F.workLetters > 3 ? 1.4 : 1.2),
    open: { ask: 'work.post.open' },
    beats: {
      start: { line: 'work.post.start', go: [
        { ap: 'jest', say: 'Read any good ones lately?', to: 'read' },
        { ap: 'ask', say: 'Who writes the most letters?', to: 'writes' },
        { ap: 'ask', say: 'Any letters from far off?', to: 'far' },
      ] },
      read: { line: 'work.post.read', go: [
        { ap: 'listen', say: '*You raise an eyebrow, and wait.*', label: 'Raise an eyebrow, and wait', to: 'deep', need: { open: 2 }, soft: true },
        { ap: 'jest', say: 'Not even the ones that are open a little?', to: 'open' },
        { ap: 'warm', say: 'I knew you wouldn\'t. You\'re too honest.', to: 'honest' },
      ] },
      writes: { line: 'work.post.writes', go: [
        { ap: 'ask', say: 'And who writes to you?', to: 'toyou' },
        { ap: 'jest', say: 'Why do they write two doors down? Lazy legs?', to: 'twodoors' },
      ] },
      far: { line: 'work.post.far', go: [
        { ap: 'tale', say: 'I\'ve carried a letter or two myself, over the mountains.', to: 'tale' },
        { ap: 'ask', say: 'Do you ever wish you could follow them back?', to: 'follow' },
      ] },
      toyou: { line: 'work.post.toyou', go: [
        { ap: 'warm', say: 'Then I\'ll write you one. A proper one.', to: 'promise' },
        { ap: 'comfort', say: 'Every letter you carry is a little bit yours.', to: 'yours' },
      ] },
      deep: { line: 'work.post.deep', fx: { confide: { k: 'work.post.kept', t: '{Name} keeps a letter that could never be delivered, for someone who left the valley', secret: true }, feel: 'drawn_out' }, go: [
        { ap: 'warm', say: 'Keep it. One day it might find its way.', to: 'oneday' },
        { ap: 'advise', say: 'Give it to me. I go where letters can\'t.', to: 'giveme', need: { trust: 0.25 }, soft: true },
      ] },
      open: { line: 'work.post.open2', fx: { fond: 0.01 }, go: [
        { ap: 'jest', say: 'I won\'t tell if you won\'t.', to: 'honest' },
        { ap: 'ask', say: 'And the dogs? I hear there are dogs.', to: 'dogs' },
      ] },
      dogs: { line: 'work.post.dogs', go: [
        { ap: 'advise', say: 'Sort the bag by the lane, so you\'re in and out quick.', to: 'sort' },
        { ap: 'jest', say: 'Shall I have a word with them? In dog.', to: 'dog' },
      ] },
      tale: { line: 'work.post.tale', fx: { fond: 0.02 }, end: true },
      follow: { line: 'work.post.follow', fx: { learn: ['work.post.follow', '{Name} would love to see where the far-off letters come from.'] }, end: true },
      promise: { line: 'work.post.promise', fx: { promise: { k: 'work.post.letter', t: 'You promised to write {name} a letter', days: 7 }, fond: 0.03 }, end: true },
      yours: { line: 'work.post.yours', fx: { trust: 0.03 }, end: true },
      oneday: { line: 'work.post.oneday', fx: { trust: 0.04 }, end: true },
      giveme: { line: 'work.post.giveme', fx: { trust: 0.05, promise: { k: 'work.post.carry', t: 'You offered to carry {name}\'s undelivered letter', days: 30 } }, end: true },
      honest: { line: 'work.post.honest', end: true },
      twodoors: { line: 'work.post.twodoors', fx: { fond: 0.02 }, end: true },
      sort: { line: 'work.post.sort', fx: { respect: 0.02, queue: 'mailcarrier_sort' }, end: true },
      dog: { line: 'work.post.dog', fx: { joke: { k: 'work.post.dog', t: 'The wizard offered to have a word with the dogs. In dog.' }, fond: 0.02 }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  W('work.post.open', {
    _: ['What\'s in the bag today, {name}?', 'Anything for me, {name}? I live in hope.', 'Much in the bag today, {name}?'],
    'workLetters>5': ['That bag\'s bulging, {name}. What\'s everyone writing about?'],
    'weather=rain': ['Keeping the letters dry, {name}?'],
  });
  W('work.post.start', {
    _: ['Thank-yous, mostly, and an invitation to tea, and one that smells of lavender.', 'A few. Hobbits will write to anyone. They wrote to the mill once.', 'The usual. Who\'s coming to tea, whose gooseberries are in, and who said what at the Badger.'],
    cheerful: ['Oh, lovely ones today! A birthday thank-you, and one with a pressed flower in it!', 'A whole bagful! I love a full bag. Every one\'s somebody\'s nice surprise.'],
    ornery: ['Too many, and all for folk who are never in.', 'Letters to people who live two doors from the writer. Two doors!'],
    shy: ['...A few. I like taking them round. You get to see folk smile and you don\'t have to talk.'],
    curious: ['Eleven, and three of them in the same hand. Somebody\'s got a lot to say to somebody.', 'One\'s come all the way from Bree! The seal\'s a little bird. I\'ve never seen it.'],
    dreamy: ['Little paper birds, all of them, waiting to land somewhere.', 'Every letter\'s a door into somebody\'s day. I just carry the doors.'],
    witty: ['Gossip, mostly, wrapped and sealed. Very respectable gossip.', 'Tea invitations. The valley runs on tea invitations.'],
    proud: ['Every one sorted and in order of the lane. Not one goes to the wrong door. Not on my round.'],
    gloomy: ['Bills from the Store and a letter for someone who moved last spring. Same as ever.'],
    'workLetters>8 ^1': ['{WorkLetters} letters! It\'s like they all sat down at once. There must have been a party.'],
    'workLetters<0': ['Nothing! Not a single letter. I walked the round anyway. Habit.', 'Empty bag. Either everyone\'s cross or everyone\'s visiting.'],
    'season=winter': ['Yule cards! The bag weighs a ton. Every hole writes to every other hole.'],
    'season=spring': ['Spring\'s letters are full of seeds and plans. Folk write when they\'re hopeful.'],
    'weather=rain ^1': ['Wet! I\'ve the letters wrapped in oilcloth and myself in nothing useful.'],
    'weather=snow ^1': ['Snowed in up the hill, so I\'ve been posting through drifts. Nearly lost a parcel.'],
    'register=fine': ['A most interesting post today. One bears a wax seal I don\'t recognize.'],
    'register=plain': ['Letters. Folk write \'em, I carry \'em. Some of \'em I can even read the outside of.'],
    'rift': ['Paper letters! It\'s like messaging but slower, and you have to walk. I love it, weirdly.'],
  });
  W('work.post.read', {
    _: ['Read them! I never! ...Well, not the inside.', 'Certainly not. A mail carrier who reads the post is no mail carrier at all.'],
    cheerful: ['Never! ...Though you can tell a lot from the handwriting. Happy letters have big loops.'],
    ornery: ['I\'ll have you know I\'ve never read a single letter. Except my own. Which nobody sends.'],
    shy: ['...No. Never. ...I look at the drawings on the outside, sometimes.'],
    curious: ['Never the insides. But the outsides! Who\'s writing to who, how often, how thick. It\'s a map.'],
    dreamy: ['Never. I make up what\'s in them instead. Mine are probably nicer.'],
    witty: ['I don\'t need to. Folk tell me what\'s in them anyway. Before I\'ve even handed them over.'],
    proud: ['Not one. In all my years. The mail carrier\'s word is as good as a wax seal.'],
    gloomy: ['No. And if I did, I expect it\'d be more bills.'],
  });
  W('work.post.open2', {
    _: ['Ha! Well. If a corner\'s come unstuck in the rain, it\'s not my fault what\'s on show.', 'Not even those. ...Mostly not those.'],
    cheerful: ['Ha! Well, if a flower falls out, I have to put it back in, don\'t I?'],
    ornery: ['I glue them shut myself, if you must know. With paste. So nobody can say.'],
    witty: ['Only if they\'re very open. Hardly at all, then.'],
    proud: ['Not even those. I press them shut and hand them over without a glance.'],
  });
  W('work.post.deep', {
    _: ['...There\'s one I couldn\'t deliver. For someone who left the valley. I still carry it.', '...I keep a letter in the bottom of the bag. The one it\'s for went to Bree and never wrote back.'],
    cheerful: ['...There\'s one I\'ve never delivered. I carry it every day, just in case they come home.'],
    ornery: ['...There\'s one in the bag I\'ve carried two years. Don\'t ask who for. Don\'t.'],
    shy: ['...I\'ve a letter in my bag that I\'ll never be able to deliver. I can\'t throw it away.'],
    curious: ['...There\'s a letter that\'s been everywhere. Every door. Nobody will take it. No name, only "to the one who\'ll know".'],
    dreamy: ['...I carry a letter for someone who went over the hills. I like to think they\'ll come back for it.'],
    witty: ['...My one failure. A letter with nowhere to go. It\'s in the bottom of the bag. It\'s very well traveled.'],
    proud: ['...I\'ve delivered every letter given me, but one. It\'s for someone gone. It stays with me.'],
    gloomy: ['...There\'s a letter for someone who left. It\'ll never be read. I carry it anyway.'],
  });
  W('work.post.oneday', {
    _: ['...Yes. I think so too. I\'ll keep carrying it.', '...Thank you. I\'d hoped someone would say that.'],
    gloomy: ['...Maybe. It\'s a long way to Bree.'],
    shy: ['...Thank you.'],
  });
  W('work.post.giveme', {
    _: ['...Would you? You\'d take it where I can\'t? ...Let me think. Let me think about it.', '...You go everywhere, don\'t you. ...All right. Next time. I\'ll bring it next time.'],
    shy: ['...You\'d do that? ...I\'ll think. Thank you.'],
    proud: ['...It\'s my letter to carry. But. ...Perhaps. Perhaps you could.'],
  });
  W('work.post.honest', {
    _: ['Too honest by half, my old mom said.', 'Somebody has to be.'],
    witty: ['Honest, nosy and very well informed. A mail carrier.'],
    proud: ['I am. It\'s the whole job, really.'],
  });
  W('work.post.writes', {
    _: ['The old folk. They write to everyone, every week. Two pages on the weather.', 'Courting couples. Three letters a day, and they live a field apart.'],
    cheerful: ['Sweethearts! A letter every morning! It\'s the best part of the round!'],
    ornery: ['The ones with least to say. Every time.'],
    shy: ['...The quiet ones. Folk who don\'t talk much write the most. I understand.'],
    curious: ['I keep a tally. The baker writes more than anyone. Thank-you letters, for thank-you letters.'],
    dreamy: ['Grandmothers. To grandchildren. Their letters are always the heaviest.'],
    witty: ['Whoever had a row at the Badger the night before. Apologies by noon.'],
    proud: ['Everyone, since I\'ve been mail carrier. Folk write more when they trust it\'ll arrive.'],
    gloomy: ['The ones who\'ve fallen out. Long letters. Then nothing.'],
  });
  W('work.post.twodoors', {
    _: ['Ha! It\'s politer. You can\'t interrupt a letter.', 'Lazy legs! Ha. No, it\'s so you can keep it. You can\'t keep a chat.'],
    witty: ['Because if you say it in person they might answer.'],
    ornery: ['Lazy everything, if you ask me.'],
    cheerful: ['Because getting a letter\'s lovely, even from next door!'],
  });
  W('work.post.toyou', {
    _: ['...Me? Nobody, much. The mail carrier\'s the one person nobody thinks to write to.', '...Funnily enough, nobody. I post myself one at Yule, sometimes. Don\'t tell.'],
    cheerful: ['Oh, now and then! A thank-you for the round! ...Well. Once.'],
    ornery: ['Nobody. And I like it that way. ...Mostly.'],
    shy: ['...Nobody. It\'s all right.'],
    curious: ['Nobody! Isn\'t that strange? I\'ve wondered why.'],
    dreamy: ['...I sometimes imagine one comes. With my name on it. In a hand I don\'t know.'],
    witty: ['The Store, with a bill. We\'re very close.'],
    proud: ['Folk know where to find me. They don\'t need to write.'],
    gloomy: ['Nobody. Nobody writes to the mail carrier.'],
    'spouse': ['{Spouse}, once, when we were courting. I still have it. It\'s worn soft.'],
  });
  W('work.post.promise', {
    _: ['Would you? ...I\'d like that more than I can say.', 'A letter, to me? ...Put a proper stamp on it.'],
    cheerful: ['Oh! Oh, yes! I\'ll deliver it to myself and act surprised!'],
    ornery: ['Hmph. I\'ll believe it when it\'s in the bag.'],
    shy: ['...You would? ...Thank you.'],
    witty: ['I\'ll deliver it personally. Excellent service.'],
  });
  W('work.post.yours', {
    _: ['...I suppose they are. I never thought of it like that.', 'A bit mine. Yes. I like that.'],
    gloomy: ['...That\'s a nice way to see it. I\'ll try.'],
    ornery: ['Hmph. Well. Maybe a bit.'],
  });
  W('work.post.far', {
    _: ['Now and then one comes from away. From Bree, or somebody\'s cousin in the Eastfarthing. Smells of the road.', 'From the adventurers! "Do water my tomatoes," they write. Every one.'],
    cheerful: ['Oh, yes! One from the sea! It had sand in it! I gave it straight to the family and we all looked at the sand.'],
    ornery: ['From folk who went off and should have stayed home. They always say so, in the end.'],
    shy: ['...Sometimes. They feel different in your hand. Heavier.'],
    curious: ['One came with a strange seal last week, from past the hills. I\'d give a lot to know where.'],
    dreamy: ['They smell of somewhere else. Pine and salt and other folk\'s fires.'],
    witty: ['All the same: "the beds are too high, missing second breakfast, home soon."'],
    proud: ['Every one delivered the day it came. Nobody waits for a far-off letter on my round.'],
    gloomy: ['Now and then. Usually saying they\'re not coming home yet.'],
  });
  W('work.post.tale', {
    _: ['Over the mountains! You must tell me. Was it ever lost?', 'You\'re a mail carrier too, then! Of sorts. Did you ever get bitten?'],
    cheerful: ['Oh, tell me! Every bit! Did it get there?'],
    curious: ['Over the mountains? How long did it take? Was it sealed? What happened to it?'],
    witty: ['A wizard mail carrier. Do you charge extra for the fireworks?'],
  });
  W('work.post.follow', {
    _: ['...Sometimes. Just to see where they come from. Then come home and tell everyone.', '...Some days. Then I see the bag and I think: who\'d take these round?'],
    shy: ['...Only in my head. My feet like the round.'],
    dreamy: ['...Every day. I\'d follow one all the way to the sea.'],
    ornery: ['Not likely. Someone\'s got to stay and do the round properly.'],
  });
  W('work.post.dogs', {
    _: ['There\'s one up the lane who sits in the middle and won\'t move. Just looks at me. Every morning.', 'Dogs! I know every dog by name. They know me by smell.'],
    cheerful: ['Oh, they\'re lovely, mostly! I carry cookies. I\'m very popular.'],
    ornery: ['Dogs, geese and one cat that\'s worse than both.'],
    shy: ['...I go round the back way. It\'s longer, but the dog doesn\'t know about it.'],
    witty: ['The dogs and I have an arrangement. They bark, I run.'],
    gloomy: ['I\'ve been nipped twice this year. Same dog. Same ankle.'],
  });
  W('work.post.sort', {
    _: ['In order of the lane. In and out. Yes, that\'s sense. I\'ll sort it now.', 'Fair. I\'ll be past the dog before it\'s sat down.'],
    proud: ['I do already. Mostly. I\'ll do it properly.'],
    curious: ['By the lane! Then I\'d never double back. Why didn\'t I think of that?'],
  });
  W('work.post.dog', {
    _: ['Ha! In dog! I\'d pay good money to see that.', 'Ha! Go on, then. Woof at it. See what happens.'],
    witty: ['Mind your accent. They\'re very particular about accents.'],
    shy: ['*laughs into the post bag*'],
  });

  // --- The storyteller: the circle under the old oak, letters, sums and tales ---------------
  addThread({
    id: 'work.storyteller', label: 'How are your little scholars?', about: 'work', weight: 1, cool: 4,
    when: job('storyteller'), rel: (F) => (F.workPupils ? 1.4 : 1.1),
    open: { ask: 'work.story.open' },
    beats: {
      start: { line: 'work.story.start', go: [
        { ap: 'ask', say: 'What are you teaching them, this week?', to: 'teaching' },
        { ap: 'jest', say: 'Do they ever sit still?', to: 'still' },
        { ap: 'tale', say: 'I\'ve a tale you could borrow, if you like.', to: 'borrow' },
      ] },
      teaching: { line: 'work.story.teaching', go: [
        { ap: 'ask', say: 'And who\'s the brightest of them?', to: 'brightest' },
        { ap: 'advise', say: 'Teach them a map. Children love a map.', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'map'] },
        { ap: 'listen', say: '*You lean on your staff and listen.*', label: 'Lean on your staff, and listen', to: 'love' },
      ] },
      still: { line: 'work.story.still', go: [
        { ap: 'ask', say: 'Then what works?', to: 'works' },
        { ap: 'jest', say: 'Have you tried a very small dragon?', to: 'dragon' },
      ] },
      borrow: { line: 'work.story.borrow', go: [
        { ap: 'tale', say: 'A dragon who was frightened of mice. He lived in a teapot.', to: 'teapot' },
        { ap: 'tale', say: 'A hobbit who walked to the sea to see if it was really wet.', to: 'sea' },
      ] },
      love: { line: 'work.story.love', go: [
        { ap: 'listen', say: '*You wait. There\'s something else.*', label: 'Wait for the rest', to: 'deep', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'They\'re lucky to have you.', to: 'lucky' },
      ] },
      deep: { line: 'work.story.deep', fx: { confide: { k: 'work.story.fear', t: '{Name} is afraid of running out of stories before the little ones run out of listening', secret: true }, feel: 'drawn_out' }, go: [
        { ap: 'warm', say: 'They\'ll want the old ones again. That\'s what old ones are for.', to: 'again' },
        { ap: 'advise', say: 'Then let them tell you one. Every week.', to: 'theirturn' },
      ] },
      works: { line: 'work.story.works', fx: { learn: ['work.story.trick', '{Name} has a teacher\'s trick or two for keeping the little ones still.'] }, go: [
        { ap: 'warm', say: 'That\'s a teacher\'s trick if ever I heard one.', to: 'lucky' },
        { ap: 'jest', say: 'I do the same to grown-ups. It\'s called a wizard.', to: 'grownups' },
      ] },
      brightest: { line: 'work.story.brightest', end: true },
      map: { line: 'work.story.map', fx: { respect: 0.03, queue: 'work_story' }, end: true },
      bristle: { line: 'work.story.bristle', fx: { fond: -0.02 }, end: true },
      dragon: { line: 'work.story.dragon', fx: { fond: 0.02 }, end: true },
      teapot: { line: 'work.story.teapot', fx: { joke: { k: 'work.teapot', t: 'The dragon who was frightened of mice, and lived in a teapot.' }, fond: 0.03 }, end: true },
      sea: { line: 'work.story.sea', fx: { fond: 0.02, remember: 'The wizard gave me a tale for the little ones.' }, end: true },
      lucky: { line: 'work.story.lucky', fx: { fond: 0.02 }, end: true },
      again: { line: 'work.story.again', fx: { trust: 0.04 }, end: true },
      theirturn: { line: 'work.story.theirturn', fx: { respect: 0.03 }, end: true },
      grownups: { line: 'work.story.grownups', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  W('work.story.open', {
    _: ['How are your little scholars, {name}?', 'What tales are you telling under the oak these days, {name}?', 'How\'s the story circle, {name}?'],
    'workPupils>5': ['Quite a crowd under the oak, {name}. How do you manage them?'],
  });
  W('work.story.start', {
    _: ['Letters in the morning, sums after, and a tale when they\'ve earned it. They always think they\'ve earned it.', 'Under the old oak, every fine day. In the barn when it rains. They don\'t mind which.'],
    cheerful: ['Oh, they\'re wonderful! Noisy and sticky and wonderful! We did the four farthings today.', 'Splendid! One of them read a whole line aloud and the others cheered.'],
    ornery: ['Restless. It\'s the weather, or the pudding, or both. I\'ve told them twice about the acorns.', 'They\'d learn twice as fast if they talked half as much.'],
    shy: ['...They\'re good. I\'m better with them than with grown-ups. They don\'t mind if I stammer.'],
    curious: ['We\'ve been counting the oak\'s acorns. We got to four hundred and then somebody ate one.', 'One of them asked why the moon changes shape. I\'ve been thinking about it ever since.'],
    dreamy: ['When the tale\'s going well they go so quiet you can hear the leaves.', 'They lie on their backs and look up through the branches while I talk. I think they see it all.'],
    witty: ['They\'re learning their letters. Mostly the rude ones, but it\'s a start.', 'Sums are going well. Seven of them think two and two makes pudding.'],
    proud: ['Every child in this valley who can read learned it under my oak.', 'They\'re well ahead of where I was at their age. Well taught.'],
    gloomy: ['They forget it all by Highday. Then we start again. Like the tide.'],
    'workPupils>6 ^1': ['{WorkPupils} of them, all at once! I need a bigger oak.'],
    'workPupils<0 ^1': ['No little ones to teach just now. I sit under the oak and read to the squirrels.'],
    'season=winter': ['Winter we\'re in the barn with the lamps lit. They like the shadows. I make shadow-rabbits.'],
    'season=summer': ['Summer\'s for tales outdoors till the light goes. Nobody wants letters in summer.'],
    'weather=rain': ['Rain, so we\'re in the barn. Every story today has had a leak in it.'],
    'register=fine': ['The children are making admirable progress. Two of them are reading verse.'],
    'stage=elder': ['I taught their parents, and some of their grandparents. They ask the same questions. Word for word.'],
    'rift': ['I\'m teaching them to count in binary with acorns. Their parents came to complain and stayed to learn.'],
  });
  W('work.story.teaching', {
    _: ['The letters of their own names. Then the names of everyone they love. That\'s how you hook them.', 'Sums with acorns, and a tale about a troll who couldn\'t count.'],
    cheerful: ['Songs! Every lesson\'s a song. Sums are a song. The farthings are a song. I\'m hoarse.'],
    ornery: ['Their letters. Properly. Not the way their parents write, which is criminal.'],
    shy: ['...Reading. Slowly. We go at the slowest one\'s pace. Nobody gets left.'],
    curious: ['Why things are. Why the moon, why the rain, why the river doesn\'t run out. I don\'t know half of it either.'],
    dreamy: ['The old tales. Of the wandering days, before the Shire. They need to know where we came from.'],
    witty: ['How to sit still. It\'s the hardest lesson. I haven\'t mastered it either.'],
    proud: ['Letters, sums, the farthings and the old tales. A proper schooling. None of this play all day.'],
    gloomy: ['Their letters. They\'ll forget half of them and write to me in thirty years misspelled.'],
  });
  W('work.story.brightest', {
    _: ['Oh, I couldn\'t say. ...The quiet one at the back. Always the quiet one at the back.', 'Bright\'s not the thing. Kind is. And the kindest is the smallest.'],
    cheerful: ['All of them! ...All right, the one who asks about the moon. But all of them!'],
    ornery: ['The one who argues. Gives me no peace, and is always right.'],
    shy: ['...One who reminds me of me. Hides behind the others. Knows every answer.'],
    curious: ['The one who asks the questions I can\'t answer. That\'s the brightest. And the most tiring.'],
    witty: ['Brightest, or loudest? The loudest is very bright. So is the sun. Both give me a headache.'],
    proud: ['A teacher never says. But I\'ll say this: I\'ve a reader in that circle who\'ll go far.'],
    gloomy: ['The one who\'ll leave. The bright ones always go over the hills in the end.'],
    'kid': ['I mustn\'t say, because {kid}\'s in the circle and {kid} would never forgive me.'],
  });
  W('work.story.map', {
    _: ['A map! Of the valley, with all their homes on. Oh, they\'d love that. I\'ll start tomorrow.', 'A map. With dragons in the corners. Yes!'],
    cheerful: ['A map! With the Badger and the mill and everyone\'s house! Oh, yes!'],
    curious: ['And then a bigger one. With Bree on. And the sea. Where does the sea go?'],
    shy: ['...They could each draw their own house on it. Yes. I like that.'],
    gloomy: ['Then they\'ll know how far away everything is. ...But they\'d like it, I suppose.'],
    dreamy: ['A map with the edges left blank, for them to fill in one day.'],
  });
  W('work.story.bristle', {
    _: ['I\'ve been teaching since before you came over the hills, wizard.', 'I know what children love, thank you.'],
    proud: ['A map! I\'ve a curriculum. It doesn\'t want wizards in it.'],
    ornery: ['And who\'ll stop them drawing rude things on it? You?'],
  });
  W('work.story.still', {
    _: ['Never! Not for a moment. Except for the end of a story. Then you could hear a feather fall.', 'Still? They\'re hobbits, not stones. They wriggle. It\'s allowed.'],
    cheerful: ['Ha! Never! But they wriggle in the right direction, mostly.'],
    ornery: ['Not since the day I started. Not once.'],
    shy: ['...For stories. Not for sums.'],
    curious: ['I\'ve noticed they sit stillest when the story\'s scariest. I\'m saving the scary ones for sums.'],
    dreamy: ['When the tale\'s right, yes. They forget they have legs.'],
    witty: ['Once. Somebody had glued them to the bench. It wasn\'t me. It wasn\'t officially me.'],
    proud: ['For me, yes. For anyone else, no.'],
    gloomy: ['Only when they\'re asleep. Which some of them are.'],
  });
  W('work.story.works', {
    _: ['A story that stops at the exciting bit. "And the troll opened his mouth..." and then sums.', 'Stopping the tale halfway. They\'ll do any amount of letters to hear the end.'],
    cheerful: ['Bribery! Honey cakes for good sums! Works every time!'],
    ornery: ['A look. I\'ve a look. They know the look.'],
    shy: ['...Whispering. If I whisper, they go quiet to hear.'],
    curious: ['Letting them ask questions. They sit still for the answers. It\'s the waiting that wriggles.'],
    dreamy: ['A tale that has them in it. Their own names. They go still as mice.'],
    witty: ['Stopping at the exciting part. They\'ll do sums for a week to find out if the troll gets them.'],
    proud: ['Discipline. And a very good story.'],
    gloomy: ['Nothing works for long. A good story works for a bit.'],
  });
  W('work.story.dragon', {
    _: ['Ha! Bring one. I\'ll put it in the front row.', 'A small dragon! They\'d sit still then. Very still.'],
    witty: ['I tried that. It ate the acorns.'],
    ornery: ['A dragon. In my circle. Over my dead body. Which it would be.'],
    cheerful: ['Ha! A little one! With a bow on!'],
  });
  W('work.story.borrow', {
    _: ['Would you? Oh, yes. A wizard\'s tale! Go on, try one on me.', 'Please! I\'ve told them all mine. They know the endings before I start.'],
    cheerful: ['Oh, yes please! Tell me, tell me!'],
    ornery: ['Is it suitable? Some of yours aren\'t, I hear.'],
    shy: ['...I\'d like that. Very much.'],
    curious: ['A new one? Where\'s it from? Is it true?'],
    proud: ['I\'ll hear it. If it\'s good enough, I\'ll use it.'],
    gloomy: ['If it\'s not too long. They fall asleep in the long ones. So do I.'],
  });
  W('work.story.teapot', {
    _: ['A dragon in a teapot! Afraid of mice! Oh, they\'ll love it. I\'ll tell it tomorrow.', 'Ha! And does the mouse get a happy ending? It must.'],
    cheerful: ['Oh! Oh, that\'s perfect! I\'m stealing it. I\'m stealing it right now.'],
    curious: ['Why a teapot? Was it warm? Oh, of course it was. Dragons like warm.'],
    witty: ['A teapot. That\'s every grandmother in the valley\'s nightmare and dream in one.'],
    proud: ['Hm. Yes. That will do nicely. I\'ll improve the middle.'],
    shy: ['*laughs* ...They\'ll love that. Thank you.'],
  });
  W('work.story.sea', {
    _: ['And was it? Wet? ...Don\'t tell me. I\'ll let them guess.', 'To see if it was really wet! Oh, that\'s lovely. That\'s the sort of thing they\'d ask.'],
    curious: ['And was it wet? Really? Saltier than tears, they say. Is that true?'],
    dreamy: ['...To the sea. Oh, I\'ll tell it slowly. It\'s a slow sort of tale.'],
    gloomy: ['And did he come back? They always want to know if he comes back.'],
  });
  W('work.story.love', {
    _: ['...Do you know, I think I learn more from them than they from me.', '...The best moment is when one of them gets it. You can see it go in. Like a lamp being lit.'],
    shy: ['...I couldn\'t talk to anyone, when I was young. Now I talk to them all day. They taught me that.'],
    gloomy: ['...They grow up so fast. One day they\'re in the circle, the next they\'re nodding to me at the Badger.'],
    proud: ['...It\'s the best work there is. Don\'t tell the farmers.'],
    dreamy: ['...Every tale I tell, they carry. Into lives I\'ll never see.'],
  });
  W('work.story.deep', {
    _: ['...I\'m frightened I\'ll run out of stories. That I\'ll open my mouth and there\'ll be nothing left.', '...Some nights I lie awake trying to remember a tale I used to know. I can\'t always.'],
    shy: ['...I worry they\'ll find out I\'m making it up as I go. All of it.'],
    proud: ['...My memory\'s not what it was. I\'ve not told anyone. I write the tales on my cuffs.'],
    gloomy: ['...One day I\'ll forget the end of one. In front of them all. I dread it.'],
    cheerful: ['...I\'ve told every tale I know twice. I keep smiling and hoping a new one comes.'],
    'stage=elder ^1': ['...I\'m getting old, wizard. Some tales go out of my head like birds. I\'m frightened I\'ll lose the lot.'],
  });
  W('work.story.again', {
    _: ['...That\'s true. They do ask for the troll every week.', '...You\'re right. Children love the same tale. That\'s half the joy.'],
    shy: ['...Thank you. I think I knew that. I needed to hear it.'],
    gloomy: ['...Maybe. Maybe that\'s enough.'],
  });
  W('work.story.theirturn', {
    _: ['Let them tell me one! Ha! Yes. I\'d hear some marvelous nonsense.', 'Their turn... yes. Then I\'d always have new ones.'],
    cheerful: ['Oh, yes! A story day! Everyone tells one!'],
    proud: ['Hm. It would teach them to speak up. Very well.'],
  });
  W('work.story.lucky', {
    _: ['...I hope they think so, when they\'re grown.', 'That\'s kind. I\'m lucky to have them.'],
    shy: ['*smiles at the ground*'],
    proud: ['They are. But thank you for noticing.'],
  });
  W('work.story.grownups', {
    _: ['Ha! A wizard\'s a story that never gets to the end.', 'Ha! I\'ve noticed. You never finish a sentence about where you\'ve been.'],
    witty: ['A tale on legs with a hat on. Yes, that\'s a wizard.'],
  });

  // --- The nanny: the nursery, the songs, and the counting -------------------------------
  addThread({
    id: 'work.nanny', label: 'How do you manage them all?', about: 'work', weight: 1, cool: 4,
    when: job('nanny'), rel: (F) => (F.workLittle > 2 ? 1.5 : 1.2),
    open: { ask: 'work.nanny.open' },
    beats: {
      start: { line: 'work.nanny.start', go: [
        { ap: 'ask', say: 'What\'s the secret of it?', to: 'secret' },
        { ap: 'jest', say: 'How many have you lost today?', to: 'lost' },
        { ap: 'listen', say: '*You notice how tired they look, and wait.*', label: 'Notice how tired they look', to: 'tired' },
      ] },
      secret: { line: 'work.nanny.secret', go: [
        { ap: 'ask', say: 'Do you sing to them? Sing me a bit.', to: 'song' },
        { ap: 'share', say: 'I make a squib go pop. That quietens them. Then it doesn\'t.', to: 'squib' },
      ] },
      lost: { line: 'work.nanny.lost', go: [
        { ap: 'jest', say: 'Under a table is hardly lost. It\'s filed.', to: 'filed' },
        { ap: 'ask', say: 'And truly? What\'s the hardest of it?', to: 'tired' },
      ] },
      tired: { line: 'work.nanny.tired', go: [
        { ap: 'advise', say: 'Have a cup of tea while they nap. A whole cup.', to: 'tea' },
        { ap: 'comfort', say: 'You do the work of three. Everyone sees it.', to: 'sees' },
        { ap: 'listen', say: '*You stay a moment longer.*', label: 'Stay a moment longer', to: 'deep', need: { open: 2 }, soft: true },
      ] },
      song: { line: 'work.nanny.song', fx: { learn: ['work.nanny.song', '{Name} has a lullaby that never fails to send the little ones off.'] }, go: [
        { ap: 'warm', say: 'That would send me off, too.', to: 'sendoff' },
        { ap: 'jest', say: 'I\'ll sing it to the Steward at the next Moot.', to: 'moot' },
      ] },
      deep: { line: 'work.nanny.deep', fx: { confide: { k: 'work.nanny.heart', t: '{Name} gives every little one their whole heart, and it aches a little when they grow out of the nursery', secret: true }, feel: 'drawn_out' }, go: [
        { ap: 'warm', say: 'They\'ll remember you. Every one of them.', to: 'remember' },
        { ap: 'share', say: 'I\'ve watched a great many grow up. It never stops aching.', to: 'aching' },
      ] },
      squib: { line: 'work.nanny.squib', fx: { joke: { k: 'work.squib', t: 'The wizard\'s squibs quieten little ones, then don\'t.' }, fond: 0.02 }, end: true },
      filed: { line: 'work.nanny.filed', fx: { fond: 0.02 }, end: true },
      tea: { line: 'work.nanny.tea', fx: { respect: 0.02, queue: 'tea', drive: { tired: -0.03 } }, end: true },
      sees: { line: 'work.nanny.sees', fx: { trust: 0.03 }, end: true },
      sendoff: { line: 'work.nanny.sendoff', fx: { fond: 0.02 }, end: true },
      moot: { line: 'work.nanny.moot', fx: { fond: 0.02 }, end: true },
      remember: { line: 'work.nanny.remember', fx: { trust: 0.04 }, end: true },
      aching: { line: 'work.nanny.aching', fx: { trust: 0.05 }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  W('work.nanny.open', {
    _: ['How do you manage them all, {name}?', 'How are the little ones, {name}? All accounted for?', 'Is it nap time, {name}, or have I come in the noisy bit?'],
    'workLittle>4': ['That\'s a full nursery, {name}. How do you do it?'],
  });
  W('work.nanny.start', {
    _: ['Two naps, one tumble, a song, a lot of jam and a frog nobody will own up to.', 'Busy. They\'re all at the age where everything goes in the mouth. Everything.'],
    cheerful: ['Oh, they\'re darlings! Exhausting darlings. We built a castle out of cushions!', 'Lovely morning! Nobody cried for nearly an hour. That\'s a record.'],
    ornery: ['Somebody brought a drum. I\'d like a word with whoever gave a hobbit child a drum.', 'They\'re fine. I\'m deaf. Those are the facts.'],
    shy: ['...They\'re good. They\'re easier than grown-ups. They just want to be held and fed.'],
    curious: ['One of them has worked out how to open the pantry. I\'m quite impressed. And quite worried.', 'They each have their own way of falling asleep. I\'ve been noticing.'],
    dreamy: ['They\'re all asleep in a heap like puppies just now. I could watch them for hours.', 'Little ones see everything new. Spend a day with them and the world is new again.'],
    witty: ['I\'ve a nursery of tiny bandits. They\'ve taken the cookies and the cat.', 'All present. Some of them twice, by the noise.'],
    proud: ['Not a single tumble this week that didn\'t mend with a kiss. My nursery\'s the safest in the Shire.'],
    gloomy: ['Every one\'s got a cold. Every one\'s given it to me.'],
    'workLittle>5 ^1': ['{WorkLittle} of them today! I count heads every few minutes like a shepherd.'],
    'workLittle<1 ^1': ['Hardly any today. It\'s ever so quiet. I keep checking under the table.'],
    'season=winter': ['Snow! They all want to go out and none of them want their mittens.'],
    'season=summer': ['We\'ve been in the garden all day. They\'re brown as nuts and twice as wriggly.'],
    'weather=rain': ['Rain, so we\'re indoors. Everyone\'s climbed everything.'],
    'hour=evening': ['Nearly home time. I can hear the parents coming. I\'ll miss them. For about ten minutes.'],
    'kid': ['{Kid}\'s in with the rest. Doesn\'t get special treatment. Gets a special cookie.'],
    'register=fine': ['The children are thriving, thank you. One has learned to say "please" unprompted.'],
    'register=plain': ['Fed, washed, napped, fed again. That\'s the whole of it.'],
    'rift': ['Back home kids had screens. Here they\'ve got mud and me. Honestly? Better.'],
  });
  W('work.nanny.secret', {
    _: ['A song for sleep, a story for quiet and a cookie for everything else.', 'Same thing every day, at the same time. Little ones love knowing what\'s next.'],
    cheerful: ['Singing! I sing everything. "Now we put our boots on" has a tune. So does "don\'t eat that".'],
    ornery: ['Never let them see you blink.'],
    shy: ['...I talk very softly. They lean in to listen and forget to shout.'],
    curious: ['Watching. Each one\'s different. One wants holding, one wants leaving, one wants a job.'],
    dreamy: ['An old song about a sleepy badger. My grandmother sang it. It never fails.'],
    witty: ['Outnumbered, never out-thought. Mostly never out-thought.'],
    proud: ['Patience, order, and a very good lullaby. I\'ve trained half the mothers in the lane.'],
    gloomy: ['There isn\'t one. You just get through the day.'],
  });
  W('work.nanny.song', {
    _: ['*hums softly* "Badger, badger, down the hill, the moon is up and the wood is still..."', '"Hush now, the kettle\'s cooling, hush now, the hens are in..." There. That\'s enough. I\'ll nod off.'],
    cheerful: ['*sings* "Little feet and little hands, sleepy as the river sands..." Oh, I\'m off!'],
    ornery: ['I\'ll not sing for a wizard in the middle of the lane. ...Badger, badger, down the hill. There.'],
    shy: ['...*whispers a verse, very quietly, and goes pink*'],
    curious: ['It changes every time. They join in with the last word of every line. It\'s like a game.'],
    witty: ['"Go to sleep, go to sleep, or the nanny will weep." It\'s mostly a threat with a tune.'],
    proud: ['*sings a verse, beautifully, and stops* You\'d not hear a sweeter one in Bree.'],
    gloomy: ['"Night comes down and the day is done, and tomorrow\'s another one." ...It\'s not cheerful. It works.'],
  });
  W('work.nanny.sendoff', {
    _: ['Ha! I\'ve sent off grown hobbits with it. The mail carrier, once. In the doorway.', 'It does! I\'ve nodded off to it myself, mid-verse.'],
    shy: ['...Thank you.'],
    witty: ['That\'s the idea. Half the parents come to collect and stay for a nap.'],
  });
  W('work.nanny.moot', {
    _: ['Ha! Do! We\'d all get some peace.', 'Ha! He\'d be asleep before the second verse.'],
    ornery: ['Ha! ...Actually, do. He could do with a nap.'],
  });
  W('work.nanny.squib', {
    _: ['Ha! Don\'t you dare. It took me an hour to settle them.', 'Ha! You\'re not allowed in the nursery. That\'s the rule now.'],
    cheerful: ['Ha! Oh, they\'d love it! Then they\'d never sleep again!'],
    ornery: ['You come near my nursery with a squib and I\'ll turn you into a toad myself.'],
  });
  W('work.nanny.lost', {
    _: ['None! ...Mislaid two. One was in the bread box, asleep. One was in the coal scuttle, not asleep.', 'Lost? Never. Hidden from, frequently.'],
    cheerful: ['Ha! Only for a minute! He was under the table eating the cat\'s dinner!'],
    ornery: ['None. And it\'s not funny. Nearly once. It wasn\'t funny then either.'],
    shy: ['...None. I count them all the time. In my head. Even in my sleep.'],
    curious: ['None, but one\'s worked out how to climb out of the cradle. I\'m impressed and terrified.'],
    witty: ['None lost. A few misfiled. They turn up at teatime.'],
    proud: ['Not one, in all my years. I know where every one is with my eyes shut.'],
    gloomy: ['Not yet. There\'s always tomorrow.'],
  });
  W('work.nanny.filed', {
    _: ['Ha! Filed! Under T for table.', 'Ha! I\'ll tell the parents. "Filed, not lost."'],
    witty: ['Under J, for jam. They\'re usually near the jam.'],
    ornery: ['Hmph. ...Filed. That\'s good. I\'ll use that.'],
  });
  W('work.nanny.tired', {
    _: ['...It\'s the never sitting down. From the first one in to the last one out.', '...I\'m tired, if I\'m honest. Not cross-tired. Just tired in my bones.'],
    cheerful: ['...Oh, I\'m fine! I\'m fine. ...I could sleep standing up. But I\'m fine!'],
    ornery: ['Tired? You try minding a nursery of hobbit children. Tired\'s a vacation.'],
    shy: ['...I don\'t mind. It\'s just... a lot, some days.'],
    curious: ['I\'ve counted. I pick up a child two hundred times a day. My arms have noticed.'],
    dreamy: ['...The days are long but the years are short. That\'s what they say. They\'re right.'],
    witty: ['I\'m not tired. I\'m just resting my eyes, upright, with a child on each hip.'],
    proud: ['I manage. I always manage. But yes. It\'s a full day.'],
    gloomy: ['...Some days I think I\'ve nothing left for my own supper.'],
  });
  W('work.nanny.tea', {
    _: ['A whole cup... I can\'t remember the last time I drank one hot. I\'ll do it. Today.', 'Tea. While they nap. Yes. Doctor\'s orders. Wizard\'s orders.'],
    ornery: ['Hmph. And who\'ll watch them? ...They\'re asleep. Fine. Tea.'],
    cheerful: ['Ooh, yes! With a cookie! A grown-up cookie!'],
    proud: ['I don\'t need a sit-down. ...But I\'ll have one.'],
  });
  W('work.nanny.sees', {
    _: ['...Do they? I never hear it.', '...That\'s kind. It doesn\'t feel like anyone sees, most days.'],
    shy: ['...Thank you. I didn\'t think anyone noticed.'],
    gloomy: ['...They see the children. That\'s right enough. That\'s how it should be.'],
  });
  W('work.nanny.deep', {
    _: ['...I give each of them my whole heart. Then they grow up and go to school and wave at me in the lane. And that\'s right. It still aches.', '...I never had little ones of my own. These are mine, in a way. For a while.'],
    shy: ['...I cry a bit when one goes up to the story circle. Not where they can see.'],
    proud: ['...I\'ve loved every one. Every one. And not one of them will remember the nursery.'],
    gloomy: ['...They forget you. They\'re meant to. It\'s the job. It\'s just a sad job, sometimes.'],
    cheerful: ['...I keep a drawing from every one who\'s gone up. A whole drawer. Don\'t tell.'],
    'kid ^1': ['...Mine grew up in this nursery. Now I watch other folk\'s grow up in it. It never gets less dear.'],
  });
  W('work.nanny.remember', {
    _: ['...Maybe not my name. But maybe the song.', '...You think so? ...That\'s enough. That\'s more than enough.'],
    shy: ['...Thank you.'],
    gloomy: ['...The song, maybe. That\'d do.'],
  });
  W('work.nanny.aching', {
    _: ['...You too? I never thought. Of course. You\'ve seen generations.', '...Then we\'re a pair. Thank you for saying.'],
    curious: ['...How many? No. Don\'t say. I\'ll think about it all night.'],
  });

  // --- The tinker: the Relay, rift scrap, neon and sun-glass --------------------------------
  addThread({
    id: 'work.tinker', label: (F) => (F.workCraftRelay ? 'How\'s the Relay humming?' : 'What are you tinkering with?'), about: 'work', weight: 1, cool: 4,
    when: job('tinker'), rel: (F) => (F.workCraftRiftOpen ? 1.5 : 1.3),
    open: { ask: 'work.tinker.open' },
    beats: {
      start: { line: 'work.tinker.start', go: [
        { ap: 'ask', say: 'What is the Relay, truly? In plain words.', to: 'relay', need: { if: { workCraftRelay: true } } },
        { ap: 'ask', say: 'Where does all the scrap come from?', to: 'scrap' },
        { ap: 'jest', say: 'Is it meant to spark like that?', to: 'spark' },
        { ap: 'ask', say: 'And what do the hill-folk make of your neon?', to: 'neon' },
      ] },
      relay: { line: 'work.tinker.relay', go: [
        { ap: 'ask', say: 'And can it reach home? Your home?', to: 'home', need: { if: { rift: true }, open: 1 } },
        { ap: 'advise', say: 'Tune it at dusk, when it falters. See what changes.', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'tune'] },
        { ap: 'share', say: 'I\'ve heard voices in the air before. Elves, mostly.', to: 'elves' },
      ] },
      scrap: { line: 'work.tinker.scrap', go: [
        { ap: 'ask', say: 'Is it safe, so near the rifts?', to: 'safe' },
        { ap: 'warm', say: 'You make something out of what the sky throws away.', to: 'throwaway' },
      ] },
      spark: { line: 'work.tinker.spark', go: [
        { ap: 'jest', say: 'I\'ll stand a little further back, then.', to: 'back' },
        { ap: 'ask', say: 'What were you making?', to: 'scrap' },
      ] },
      neon: { line: 'work.tinker.neon', go: [
        { ap: 'ask', say: 'And do you mind, when they stare?', to: 'stare' },
        { ap: 'jest', say: 'The Proudfoots will want it on their gate next.', to: 'proudfoots' },
        { ap: 'listen', say: '*You wait for the rest.*', label: 'Wait for the rest', to: 'deep', need: { open: 2 }, soft: true },
      ] },
      home: { line: 'work.tinker.home', fx: { confide: { k: 'work.tinker.ping', t: '{Name} sends a ping toward home from the Relay every night, and nothing ever comes back', secret: true }, feel: 'drawn_out' }, go: [
        { ap: 'warm', say: 'Then keep sending. Somebody may be listening.', to: 'keep' },
        { ap: 'comfort', say: 'You\'re heard here. Every word.', to: 'heard' },
      ] },
      deep: { line: 'work.tinker.deep', fx: { confide: { k: 'work.tinker.half', t: '{Name} only understands half of what the rift-tech does, and fears the other half', secret: true }, feel: 'drawn_out' }, go: [
        { ap: 'warm', say: 'Half is more than anyone else understands.', to: 'heard' },
        { ap: 'advise', say: 'Then go up and sit with the Relay. Learn its moods.', to: 'tune' },
      ] },
      stare: { line: 'work.tinker.stare', go: [
        { ap: 'warm', say: 'They\'re staring because it\'s lovely.', to: 'lovely' },
        { ap: 'listen', say: '*You let them go on.*', label: 'Let them go on', to: 'deep', need: { open: 2 }, soft: true },
      ] },
      tune: { line: 'work.tinker.tune', fx: { respect: 0.03, queue: 'work_relay' }, end: true },
      bristle: { line: 'work.tinker.bristle', fx: { fond: -0.02 }, end: true },
      elves: { line: 'work.tinker.elves', fx: { fond: 0.02, joke: { k: 'work.elves', t: 'The wizard says the elves were on the Relay first.' } }, end: true },
      safe: { line: 'work.tinker.safe', fx: { learn: ['work.tinker.scars', '{Name} salvages rift scrap from the scars the rifts leave, and calls it treasure.'] }, end: true },
      throwaway: { line: 'work.tinker.throwaway', fx: { fond: 0.02, trust: 0.02 }, end: true },
      back: { line: 'work.tinker.back', fx: { fond: 0.02 }, end: true },
      proudfoots: { line: 'work.tinker.proudfoots', fx: { fond: 0.02 }, end: true },
      keep: { line: 'work.tinker.keep', fx: { trust: 0.04 }, end: true },
      heard: { line: 'work.tinker.heard', fx: { trust: 0.04, fond: 0.02 }, end: true },
      lovely: { line: 'work.tinker.lovely', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  W('work.tinker.open', {
    _: ['What are you tinkering with today, {name}?', 'How\'s the Relay humming, {name}?', 'Anything sparking that shouldn\'t be, {name}?'],
    'workCraftRiftOpen': ['There\'s a rift open, {name}. Good scrap, I suppose?'],
    'rift': ['Signal good today, {name}?'],
  });
  W('work.tinker.start', {
    _: ['Rewired a lamp, salvaged a sack of scrap and only singed one eyebrow. A good day.', 'The Relay\'s holding signal. I\'d like to see it hold all week.', 'Sun-glass panels. You lay them on the turf and they drink the daylight. Then the lamp glows at night.'],
    cheerful: ['Brilliant! I got a music box going with a bit of rift wire. It plays one note. Very happily.', 'Lovely! Everything\'s humming and nothing\'s on fire!'],
    ornery: ['Somebody unplugged the Relay to hang their washing on the mast. Again.', 'Hill-folk keep poking the wires. The wires poke back. Then they come to me.'],
    shy: ['...It\'s going all right. I like the quiet hum. It\'s like company.'],
    curious: ['I\'ve opened a rift-lamp up to see how it works. There\'s a tiny glass bead inside that glows. Why? I want to know why.', 'If you put two sun-glass panels side by side, the lamp burns twice as long. I\'m trying three.'],
    dreamy: ['At dusk the neon on the round doors comes on one by one. It looks like the hill\'s dreaming.'],
    witty: ['I\'ve fixed everything that was broken and broken two things that weren\'t. Balance.', 'The Relay\'s fine. I said a few words to it. Some of them were technical.'],
    proud: ['Nobody else in the valley could keep the Relay up. Nobody. It\'d be a very tall washing pole.'],
    gloomy: ['Rust. Damp gets into everything here. Back home it was acid rain. At least that was dry.'],
    'workCraftRiftOpen ^1': ['There\'s a rift open past the meadow. Good scrap falling through. Alloy, real alloy.', 'The sky\'s torn again. I\'ve a sack and a pair of gloves and a lot of hope.'],
    'workCraftNeon>2 ^1': ['{WorkCraftNeon} holes wired with neon now. The hill glows like a festival every night.'],
    'workCraftRetrofit': ['There\'s a retrofit on: neon trim, a sky-dish and a sun-glass panel. The family keeps bringing me tea.'],
    'season=winter': ['Cold makes the batteries sulk. I keep them in my pockets. I am very warm and slightly humming.'],
    'season=summer': ['Summer! The sun-glass is drinking like a brewer. Every lamp\'s full by noon.'],
    'weather=rain': ['Rain gets in the joints. I\'ve wrapped half the village in oilcloth.'],
    'hour=evening': ['Dusk\'s when the signal wobbles. I\'m about to go up the mast and sweet-talk it.'],
    'rift': ['Running hot but stable. Salvaged good scrap from the last rift. Real alloy.', 'Patched the Relay with hill-folk wire and hope. Signal\'s holding at three bars.'],
    'rift lost ^1': ['Busy. Good. If I\'m busy I don\'t check the signal for... Busy is good.'],
    '!rift': ['I don\'t understand the half of it, but the rift-folk taught me well. I can make a lamp glow without oil!'],
    'register=fine': ['The apparatus is performing admirably, though the mast requires constant attention.'],
    'register=plain': ['Wires and lamps and the tall thing. I keep \'em going. Don\'t ask me how.'],
  });
  W('work.tinker.relay', {
    _: ['It\'s like a mail carrier made of light. Words go up the mast and out through the air to anyone listening.', 'It catches voices from the air and passes them on. Like a well catches rain.'],
    cheerful: ['It\'s magic! Well. Not magic. But it might as well be! You talk into it and someone hears you, miles off!'],
    ornery: ['It\'s a mast that does a job, and it\'d do it better if folk stopped hanging bunting on it.'],
    shy: ['...It listens. And it passes on what it hears. Like I do, sort of.'],
    curious: ['It turns words into a kind of hum, and sends the hum into the sky. The how of it keeps me up at night.'],
    dreamy: ['It\'s a lantern for words. It sends them out into the dark to find someone.'],
    witty: ['A very tall ear with opinions about weather.'],
    proud: ['The cleverest thing in this valley. And I keep it running. Draw your own conclusions.'],
    gloomy: ['A tall thing that breaks. And I\'m the one who climbs it.'],
    'rift': ['It\'s a node. It meshes signal. Uh. A very tall mail carrier. Made of light. Yeah, that.'],
    '!rift': ['Honestly? I only know what the rift-folk told me. It talks to the sky. The sky talks back, sometimes.'],
  });
  W('work.tinker.home', {
    _: ['...Every night I send a ping. Toward Neverdark. Just my name and "still here". Nothing comes back. I send it anyway.', '...It can\'t. I\'ve tried. Every night. Static. But I keep the channel open.'],
    shy: ['...I send a little signal every night. Home. Nobody\'s answered. Don\'t tell anyone I do it.'],
    proud: ['...No. But I\'ve rigged it so it\'ll try forever, long after I stop climbing the mast.'],
    gloomy: ['...No. Static, every time. I don\'t know why I keep listening.'],
    cheerful: ['...No. Not yet! But one day I\'ll get a ping back. One day. I just know it.'],
    'lost ^1': ['...Every night I send {lost}\'s name into the static. If {lost}\'s out there, {lost} will know it\'s me.'],
  });
  W('work.tinker.tune', {
    _: ['At dusk. While it\'s failing. Huh. That\'s smart. I\'ll go up tonight.', 'Watch it while it breaks. Yes. I\'ll take a lamp up the mast.'],
    curious: ['Oh! Yes! Then I\'d see what changes when the light goes! Why didn\'t I think of that?'],
    cheerful: ['Ooh! A dusk climb! I\'ll take a pie!'],
    shy: ['...Yes. I\'ll go up and sit with it. Quietly.'],
    'rift': ['Debug it live. Yeah. Classic. I\'ll head up tonight.'],
  });
  W('work.tinker.bristle', {
    _: ['I know how to tune the Relay, wizard. You don\'t even know what it is.', 'With respect, it\'s not a spell. You can\'t just wave at it.'],
    proud: ['I built half of that mast. I\'ll tune it how I like.'],
    ornery: ['Oh, aye, and next you\'ll explain the sun-glass to me.'],
  });
  W('work.tinker.elves', {
    _: ['Elves! On the Relay? ...I\'ve heard singing in the static some nights. I thought I was tired.', 'Ha! The elves had it first! I knew there was something.'],
    curious: ['Elves? Truly? What frequency? No. Don\'t answer that. Do answer that.'],
    witty: ['So it\'s elves who keep singing over my signal. I\'ll send them a strongly worded ping.'],
    'rift': ['Wait. Elves. On the signal. ...That\'s the weirdest thing anyone\'s said to me and I\'m from Neverdark.'],
  });
  W('work.tinker.scrap', {
    _: ['The rifts drop it. Bits of the other side: wire, alloy, glass that glows. I go and pick it up when it\'s cooled.', 'From the scars the rifts leave. The grass grows back funny there, and there\'s treasure in the dirt.'],
    cheerful: ['From the sky! Isn\'t that marvelous? The sky just drops it! Like apples!'],
    ornery: ['From where nobody else will go. Which is why I go.'],
    shy: ['...From the scars. I go early, before anyone\'s about.'],
    curious: ['Rift scars. Every piece is a puzzle. I found a little cog last week that turns by itself. By itself!'],
    dreamy: ['From another world, falling into ours like leaves. I think about whose it was.'],
    witty: ['Mostly from the sky. The rest from other people\'s sheds. Kidding. Mostly.'],
    proud: ['I find what nobody else can see. Half that Relay is scrap I picked out of the mud.'],
    gloomy: ['From rifts. Torn sky and burnt grass. Lovely job.'],
    'rift': ['Rift scars. It\'s like scavenging the old blocks back home, only greener. And nobody shoots at you.'],
  });
  W('work.tinker.safe', {
    _: ['Safe enough if you wait for the glow to fade, and wear gloves, and don\'t lick anything.', 'Mostly! I lost an eyebrow once. It grew back. Differently.'],
    shy: ['...I wait till it\'s cooled. I\'m careful. I\'m always careful.'],
    proud: ['For me, yes. For anyone else, I\'d not let them near it.'],
    gloomy: ['Nothing\'s safe. But it\'s safer than not having lamps in winter.'],
    'rift': ['Way safer than Neverdark. Nobody here\'s ever tried to sell me the scrap I just found.'],
  });
  W('work.tinker.throwaway', {
    _: ['...Yes. I never thought of it like that. The sky\'s junk, made into lamps.', '...That\'s lovely. I might put that over the workshop door.'],
    shy: ['...Thank you. That\'s nice.'],
    'rift': ['...That\'s kind of my whole life, actually. Huh. Thanks, wizard.'],
  });
  W('work.tinker.spark', {
    _: ['No! ...Yes. Sort of. A little spark means it\'s working. A big spark means stand back.', 'That one, yes. That bigger one, no.'],
    cheerful: ['Ha! It\'s a happy spark! It\'s pleased to see you!'],
    ornery: ['It\'s meant to do what I tell it. It doesn\'t always listen. Like everyone.'],
    shy: ['...Mostly. Stand back a bit. Just in case.'],
    curious: ['That\'s what I\'m finding out! Watch. ...Ow. No. Not meant to do that.'],
    witty: ['If it sparks, it\'s working. If it doesn\'t, it\'s also working. Badly.'],
    proud: ['It sparks exactly as much as I want it to.'],
    gloomy: ['It\'s going to set fire to the hedge one day. I\'ve made my peace.'],
    'rift': ['Spark\'s fine. Spark means current. No spark, that\'s when you worry.'],
  });
  W('work.tinker.back', {
    _: ['Ha! Wise. Wizards are flammable. All that beard.', 'Ha! Mind the hat. It\'s mostly kindling.'],
    witty: ['A step back, and then another. Then you\'re a very safe wizard in the next field.'],
    shy: ['*laughs* ...Probably sensible.'],
  });
  W('work.tinker.neon', {
    _: ['Half of them stare and the other half want some. Usually the same half, a week apart.', 'They tutted at first. Now the Proudfoots want pink.'],
    cheerful: ['They love it! Well, they love it now! At first they hid their hens.'],
    ornery: ['They tut and say it\'s not proper. Then they ask me to do their porch. Hypocrites.'],
    shy: ['...They stare a bit. I don\'t mind. I\'d stare too.'],
    curious: ['The young ones love it. The old ones pretend not to look, and then look all evening.'],
    dreamy: ['They say it\'s like a festival every night. I think so too.'],
    witty: ['The old folk call it "that business". The young ones call it "signal". I call it Highday overtime.'],
    proud: ['They admire it. They\'d never admit it. I can tell.'],
    gloomy: ['Some love it. Some think we\'re ruining the hill. Maybe both are right.'],
    '!rift': ['They think I\'ve gone strange. Maybe I have. I like the glow.'],
    'rift': ['Mixed reviews. The kids love it. The grannies want it toned down. Classic.'],
  });
  W('work.tinker.stare', {
    _: ['...A bit. You want to belong. And then you light up their doorway and they stare.', '...Sometimes. It\'s all right. It\'s just a lot of eyes.'],
    proud: ['Let them stare. They\'ll be wanting it next year.'],
    gloomy: ['...Yes. Every time. You get used to it. You don\'t really.'],
    'rift': ['...Yeah. Back home nobody looked twice. Here I\'m the weird glowing one. It\'s fine. Mostly.'],
  });
  W('work.tinker.deep', {
    _: ['...Honestly? I only understand about half of it. The other half frightens me. I just keep it humming.', '...Some nights I lie awake wondering what happens if I get it wrong and the whole hill goes dark.'],
    shy: ['...I\'m not really a tinker. Not properly. I just copy what I\'ve seen work. Please don\'t tell.'],
    proud: ['...I tell folk I understand all of it. I understand half. Nobody else understands any. So.'],
    gloomy: ['...I think one day it\'ll all just stop. And they\'ll look at me.'],
    'rift': ['...Back home I was a tinker\'s kid, not a tinker. I\'m making it up. Twelve lamps and a Relay, and I\'m making it up.'],
    '!rift': ['...I\'m a hill-hobbit messing with lightning. My granny would have a fit. Some nights so do I.'],
  });
  W('work.tinker.keep', {
    _: ['...Yeah. I will. Every night.', '...Thank you. That\'s what I tell myself, mostly.'],
    gloomy: ['...Somebody may. Maybe. All right.'],
  });
  W('work.tinker.heard', {
    _: ['...Thanks, wizard. That actually helps.', '...Huh. Yeah. I suppose I am.'],
    shy: ['...Thank you.'],
    'rift': ['...Full signal. Thanks, wizard.'],
  });
  W('work.tinker.lovely', {
    _: ['...You think it\'s lovely? Ha. Thanks.', 'It is lovely, isn\'t it? At dusk especially.'],
    proud: ['It is. I\'m glad somebody sees it.'],
  });
  W('work.tinker.proudfoots', {
    _: ['Ha! They already asked. Pink, with a little star. I said I\'d think about it.', 'Ha! They want it on the privy. I\'m not joking.'],
    witty: ['Their gate, their porch and their cat, if I\'d let them.'],
    ornery: ['They can wait their turn like everyone else.'],
  });

  // --- The lamplighter: the round at dusk, and the lamp by the green ------------------------
  addThread({
    id: 'work.lamplighter', label: 'What\'s it like, the lamp round?', about: 'work', weight: 1, cool: 4,
    when: job('lamplighter'), rel: (F) => (F.hour === 'evening' ? 1.6 : 1.2),
    open: { ask: 'work.lamp.open' },
    beats: {
      start: { line: 'work.lamp.start', go: [
        { ap: 'ask', say: 'Which lamp\'s your favorite?', to: 'fav' },
        { ap: 'listen', say: '*You walk a little way with them.*', label: 'Walk a little way with them', to: 'walk' },
        { ap: 'jest', say: 'Why not ask the tinker for sun-glass and lie in?', to: 'sunglass' },
      ] },
      fav: { line: 'work.lamp.fav', fx: { learn: ['work.lamp.fav', '{Name} has a favorite lamp on the round, and saves it for last.'] }, go: [
        { ap: 'ask', say: 'Why that one?', to: 'why', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'I\'ll look for it tonight.', to: 'look' },
      ] },
      walk: { line: 'work.lamp.walk', go: [
        { ap: 'listen', say: '*You walk on in silence a while.*', label: 'Walk on in silence', to: 'why', need: { open: 2 }, soft: true },
        { ap: 'share', say: 'I love that hour too. The world\'s softest then.', to: 'softest' },
        { ap: 'ask', say: 'What do you see, going round?', to: 'see' },
      ] },
      sunglass: { line: 'work.lamp.sunglass', go: [
        { ap: 'jest', say: 'I take it back. Oil it is.', to: 'oil' },
        { ap: 'advise', say: 'Go round once more tonight, and see the lamps lit.', to: 'oncemore' },
      ] },
      see: { line: 'work.lamp.see', fx: { learn: ['work.lamp.see', '{Name} sees the whole village go to bed, one window at a time.'] }, go: [
        { ap: 'jest', say: 'You must know everyone\'s bedtime. Dangerous.', to: 'bedtime' },
        { ap: 'warm', say: 'You\'re the last thing they see of the day. And the first.', to: 'first' },
      ] },
      why: { line: 'work.lamp.why', fx: { confide: { k: 'work.lamp.why', t: '{Name} lights the lamp by the green last, for someone who used to wait under it', secret: true }, feel: 'drawn_out' }, go: [
        { ap: 'warm', say: 'Then it\'s lit for them still.', to: 'still' },
        { ap: 'comfort', say: 'Some lights don\'t need anyone under them.', to: 'still' },
      ] },
      look: { line: 'work.lamp.look', fx: { fond: 0.02 }, end: true },
      softest: { line: 'work.lamp.softest', fx: { trust: 0.03 }, end: true },
      oil: { line: 'work.lamp.oil', fx: { fond: 0.02 }, end: true },
      oncemore: { line: 'work.lamp.oncemore', fx: { respect: 0.02, queue: 'work_lamps' }, end: true },
      bedtime: { line: 'work.lamp.bedtime', fx: { joke: { k: 'work.lamp.bedtime', t: '{Name} knows everyone\'s bedtime. Dangerous knowledge.' }, fond: 0.02 }, end: true },
      first: { line: 'work.lamp.first', fx: { fond: 0.02, trust: 0.02 }, end: true },
      still: { line: 'work.lamp.still', fx: { trust: 0.05 }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  W('work.lamp.open', {
    _: ['What\'s it like, the lamp round, {name}?', 'All the lamps lit last night, {name}?', 'How many lamps is it now, {name}?'],
    'hour=evening': ['Off on the round, {name}? Mind if I walk a step?'],
    'hour=morning': ['Putting them out again, {name}? Back to bed after?'],
  });
  W('work.lamp.start', {
    _: ['Out at dusk to light them, out at dawn to put them out. In between I sleep like a dormouse.', 'Lane by lane, nearest next. The lamps come on behind me like footprints.'],
    cheerful: ['Oh, I love it! Every lamp\'s a little hello. Hello, lane! Hello, square!', 'Lovely! I whistle all the way round. Folk set their clocks by the tune.'],
    ornery: ['The wind blows them out behind me and somebody always complains to me, not the wind.', 'Too many lamps and not enough oil. Every season, one more lamp.'],
    shy: ['...I like it. Nobody\'s about. Just me and the pole and the lamps.'],
    curious: ['Each lamp burns a bit different. The one by the mill smokes. The one at the bridge flickers in a south wind.', 'I\'ve been timing it. Twenty-two minutes round, if nobody stops me to chat.'],
    dreamy: ['At dusk, when they come on one by one, the whole village looks like it\'s waking into a dream.', 'It\'s the hour between. The day\'s going and the night\'s not come. I live in it.'],
    witty: ['I go round lighting lamps so folk can see their way home from the Badger. A public service. Mostly to the Badger.', 'Bright work. Ha. I\'ve had that joke for years. It never gets less bright.'],
    proud: ['Not one lamp left dark in all my time. Not one.'],
    gloomy: ['Light them, put them out, light them again. Like the days.'],
    'workLamps>10': ['I\'ve {workLamps} lamps to see to now, and I know every one by its flicker.'],
    'workLamps<3 ^1': ['Only a few lamps yet. I go round slow so it feels like a proper round.'],
    'workMate': ['{WorkMate} takes the east of the village and I take the west. We meet at the square and race back.'],
    'season=winter': ['Winter\'s the long round. Dark by teatime. My fingers are always cold and the lamps always warm.', 'Snow on the lamp-caps. I knock it off with the pole and it goes down my neck.'],
    'season=summer': ['Summer\'s a lazy round. It\'s light till all hours. I nod off on the bench waiting for dusk.'],
    'weather=rain': ['Rain! The wicks spit at me. The lamps don\'t like being lit wet.'],
    'hour=evening': ['Can\'t stop long. The light\'s going and the lamps won\'t light themselves.'],
    'register=fine': ['The lamps are a great comfort to the village. I flatter myself I keep them well.'],
    'register=plain': ['Lamps want lighting. I light \'em. That\'s the long and short.'],
    'stage=elder': ['I\'ve lit these lanes since they were cart-tracks with a candle on a stick.'],
    'rift': ['Oil lamps. Fire on a stick. Back home the street-lights never went out. I like these better. They go out.'],
  });
  W('work.lamp.fav', {
    _: ['The one by the green. I light it last. It\'s always the last thing I do.', 'The one at the bridge. It throws two lights: one on the lane and one in the water.'],
    cheerful: ['The one outside the Badger! It hears all the singing!'],
    ornery: ['The one that stays lit. There aren\'t many.'],
    shy: ['...The little one by the well. Nobody notices it. I do.'],
    curious: ['The one by the mill. It burns blue at the edges. I don\'t know why. I\'m going to find out.'],
    dreamy: ['The one by the green. When it\'s lit, the moths come and dance. Like it\'s holding a party.'],
    witty: ['The one nobody\'s bumped into this week.'],
    proud: ['The big one in the square. It was there first, and I keep it brightest.'],
    gloomy: ['The one by the green. Don\'t ask why.'],
  });
  W('work.lamp.look', {
    _: ['Do! It\'s the one with the moths.', 'Look for it last thing. You\'ll know it.'],
    shy: ['...You will? That\'s nice.'],
    witty: ['It\'ll be the one with a lamplighter staring at it fondly.'],
  });
  W('work.lamp.walk', {
    _: ['*They walk on, reaching up with the pole, and the lamp catches.* There. That\'s the one.', '...This is the bit I like. Nobody about. The light going. The lamps coming on behind us.'],
    cheerful: ['Oh, it\'s nice to have company! Watch this one, it goes with a little pop!'],
    ornery: ['Mind the pole. Folk always walk into the pole.'],
    shy: ['...It\'s nice. Having someone. Usually I talk to the lamps.'],
    curious: ['Watch: if I tip the wick just so, it catches first time. Nobody taught me that.'],
    dreamy: ['...Listen. Every hole on the lane is clinking its supper plates. Like bells.'],
    witty: ['Stay close. Folk will think I\'ve been made a wizard\'s apprentice. My stock will rise.'],
    proud: ['See how evenly they\'re spaced, lit? That\'s timing. Thirty years of timing.'],
    gloomy: ['...Quiet, isn\'t it. I like the quiet. The lamps don\'t ask anything.'],
  });
  W('work.lamp.softest', {
    _: ['...Yes. Softest. That\'s exactly the word.', '...You feel it too? I thought it was just me.'],
    shy: ['...I\'m glad it\'s not just me.'],
    dreamy: ['...Softest. I\'ll be thinking that word all round.'],
    ornery: ['Hm. Soft. Well. Yes.'],
  });
  W('work.lamp.see', {
    _: ['The whole village going to bed. Window by window. I could tell you who\'s up late and who\'s up early.', 'Folk walking home from the Badger. Couples on the bridge. A cat or two. The same cat, mostly.'],
    cheerful: ['Everyone waving! Well, some. Everyone I wave at.'],
    ornery: ['Folk who should be in bed. Every night. Same ones.'],
    shy: ['...Everything. Nobody sees me. I see everyone.'],
    curious: ['Patterns. The miller goes to bed first. The innkeeper last. The tinker never.'],
    dreamy: ['Lit windows. Each one a little story I\'ll never hear.'],
    witty: ['Secrets. Not saying whose. I\'m the soul of discretion and a lamp-pole.'],
    proud: ['A village safe home. That\'s what I see. Because I lit the way.'],
    gloomy: ['The lights going out, one by one. Every night. Like a sad song.'],
  });
  W('work.lamp.bedtime', {
    _: ['Ha! I do. Don\'t tell, or I\'ll have to hand out curfews.', 'Ha! I know who sneaks out at midnight, too. Not telling.'],
    witty: ['Everyone\'s bedtime, and everyone\'s second supper. I\'m very dangerous.'],
    shy: ['*grins* ...I do.'],
  });
  W('work.lamp.first', {
    _: ['...I never thought of that. Last and first. Huh.', '...That\'s a nice thing to carry round. Thank you.'],
    proud: ['...Yes. I suppose I am. Hm.'],
    shy: ['...Thank you.'],
  });
  W('work.lamp.why', {
    _: ['...Somebody used to wait under it for me, at the end of the round. They\'re gone now. I still light it last.', '...My old sweetheart waited by the green every night. It\'s been years. I still save it for last.'],
    shy: ['...Someone used to wait there for me. I still light it for them. I\'ve never said.'],
    proud: ['...Someone I loved waited under that lamp every night of their life. It\'ll be lit as long as I am.'],
    gloomy: ['...Someone waited under it. Then one night they didn\'t. I still light it last.'],
    cheerful: ['...Somebody used to wait there. Gone now. But it\'s a happy lamp. I make sure.'],
    'spouse ^1': ['...{Spouse} used to wait under it for me when we were courting. Still does, some nights. I light it last for that.'],
  });
  W('work.lamp.still', {
    _: ['...Yes. Yes, I suppose it is.', '...Thank you, wizard. I\'ll think of that tonight.'],
    gloomy: ['...That\'s a kinder thought than mine. I\'ll borrow it.'],
    shy: ['...Thank you.'],
  });
  W('work.lamp.sunglass', {
    _: ['Sun-glass! And give up the round? Never. A lamp wants a person to light it.', 'The tinker\'s offered. I said no. Oil has a better smell.'],
    cheerful: ['Ha! And miss my walk? Never!'],
    ornery: ['Over my dead body. Glowing lumps of rift-glass. Nobody to light them. No.'],
    shy: ['...I\'d miss the round. Please don\'t tell the tinker.'],
    curious: ['I\'ve thought about it. The glass glows steady, but it doesn\'t flicker. I like a flicker.'],
    dreamy: ['A lamp that lights itself. Where\'s the kindness in that?'],
    witty: ['Then what would I be? A lamp-looker. Not much of a trade.'],
    proud: ['A lamp lit by hand burns truer. Everyone knows that.'],
    gloomy: ['It\'ll come to that. One day the lamps won\'t need me. Not yet.'],
    'rift': ['Ha! I\'m from Neverdark and I\'m on Team Oil. That\'s how much I like this job.'],
  });
  W('work.lamp.oil', {
    _: ['Ha! Oil it is. Wise wizard.', 'Ha! Good. I\'d have had to fight you.'],
    witty: ['Very sensible. Wizards and tinkers shouldn\'t be left alone together.'],
  });
  W('work.lamp.oncemore', {
    _: ['Once more round... aye, I\'ll check the green and the bridge. They\'re the windy ones.', 'Very well. One more look. A lamp left dark nags at me all night.'],
    proud: ['They\'ll all be lit. But I\'ll look. For you.'],
    curious: ['Yes! I\'ll see which went out first. Then I\'ll know where the draft is.'],
  });

  // --- The tinker again: wiring a hobbit-hole, and who taught them ------------------------
  addThread({
    id: 'work.tinker.wire', label: 'How do you wire up a hobbit-hole?', about: 'work', weight: 0.8, cool: 5,
    when: job('tinker'), rel: (F) => (F.workCraftNeon || F.workCraftRetrofit ? 1.3 : 0.9),
    open: { ask: 'work.wire.open' },
    beats: {
      start: { line: 'work.wire.start', go: [
        { ap: 'ask', say: 'And do the families mind the upheaval?', to: 'mess' },
        { ap: 'jest', say: 'Could you wire my hat? Just a little glow.', to: 'hat' },
        { ap: 'ask', say: 'Who taught you all this?', to: 'taught' },
      ] },
      mess: { line: 'work.wire.mess', go: [
        { ap: 'ask', say: 'And the ones who won\'t have it?', to: 'grannies' },
        { ap: 'warm', say: 'They\'re lucky to have a tinker who cares.', to: 'cares' },
      ] },
      grannies: { line: 'work.wire.grannies', go: [
        { ap: 'jest', say: 'I\'ve seen her reading by it. Every night.', to: 'reading' },
        { ap: 'advise', say: 'Leave her be. Let the lane do the persuading.', to: 'leave' },
      ] },
      taught: { line: 'work.wire.taught', go: [
        { ap: 'ask', say: 'Would you teach a youngster, if one asked?', to: 'teach' },
        { ap: 'share', say: 'My teacher was a very cross old wizard. I miss him.', to: 'cross' },
        { ap: 'listen', say: '*You wait. There\'s more to that, you think.*', label: 'Wait for more', to: 'more', need: { open: 2 }, soft: true },
      ] },
      more: { line: 'work.wire.more', fx: { confide: { k: 'work.wire.first', t: '{Name}\'s first neon lamp was made for somebody who was afraid of the dark', secret: true }, trust: 0.03 }, go: [
        { ap: 'warm', say: 'Then every lamp since has been a kindness.', to: 'cares' },
        { ap: 'ask', say: 'And were they still afraid, after?', to: 'after' },
      ] },
      hat: { line: 'work.wire.hat', fx: { joke: { k: 'work.hat', t: '{Name} offered to wire the wizard\'s hat with neon.' }, fond: 0.02 }, end: true },
      cares: { line: 'work.wire.cares', fx: { fond: 0.02, trust: 0.02 }, end: true },
      reading: { line: 'work.wire.reading', fx: { fond: 0.02 }, end: true },
      leave: { line: 'work.wire.leave', fx: { respect: 0.03 }, end: true },
      teach: { line: 'work.wire.teach', fx: { learn: ['work.wire.teach', '{Name} would teach the tinker\'s trade to any youngster who asked properly.'] }, end: true },
      cross: { line: 'work.wire.cross', fx: { trust: 0.03 }, end: true },
      after: { line: 'work.wire.after', fx: { trust: 0.03, fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  W('work.wire.open', {
    _: ['How do you wire up a hobbit-hole, {name}? It looks like magic from the lane.', 'What goes into one of your neon holes, {name}?'],
    'workCraftNeon>2': ['{WorkCraftNeon} holes glowing now, {name}. How do you do it?'],
  });
  W('work.wire.start', {
    _: ['Neon round the door, a sky-dish on the hill, a sun-glass panel on the south turf. And a great deal of crawling about in the dark.', 'You run the wire along the beams where nobody\'ll knock it, and you never, ever go through the pantry.'],
    cheerful: ['Oh, it\'s the best! Round the door goes the glow, the family all gasp, and somebody always cries!'],
    ornery: ['Carefully, and without three children and a dog helping.'],
    shy: ['...Mostly I crawl along the back of the beams. Nobody sees. Then they switch it on and I go home.'],
    curious: ['The hard part\'s the round door. Neon wants to go straight. I bend it in hot water, like the woodwrights bend oak.'],
    dreamy: ['You give a hole a little bit of starlight to keep. That\'s how I think of it.'],
    witty: ['Wire, glass, patience and an apology to whoever\'s dinner I\'ve just knelt in.'],
    proud: ['Properly. Every one of mine is tidy as a sampler. You can\'t see a single wire.'],
    gloomy: ['Badly, the first time. Then you go back and do it again. Then it works.'],
    'workCraftRetrofit ^1': ['There\'s one on now. The family\'s moved in with the grandparents while I crawl about. They bring me scones.'],
    'rift': ['Basically a home retrofit. Light strip, a dish, a panel. Back home we did whole towers. This is cozier.'],
    '!rift': ['I do what the rift-folk showed me. Bend the glass, tuck the wire, and never let it near the bath.'],
  });
  W('work.wire.mess', {
    _: ['They grumble at the mess and then stand in the lane all evening admiring it.', 'Some do. Most bring me tea. One family brought me a whole pie. I\'d wire their privy for that.'],
    cheerful: ['They love it! There\'s always a little party the night it first lights up.'],
    ornery: ['They mind the mess. They mind the noise. They don\'t mind the glow, I notice.'],
    shy: ['...They\'re very kind. They leave me alone, which is what I like.'],
    curious: ['The children follow me everywhere. They want to know where the wire goes. So do I, sometimes.'],
    dreamy: ['They\'re quiet the night it comes on. Like they\'re seeing their own home new.'],
    witty: ['They mind. Then they show it off to the neighbors. Then the neighbors ask me.'],
    proud: ['They\'re honored. I don\'t do just anyone\'s hole.'],
    gloomy: ['There\'s always someone who hates it. You do the work anyway.'],
  });
  W('work.wire.grannies', {
    _: ['There\'s one old lady up the lane won\'t have it. Says it\'ll curdle the milk.', 'Some won\'t. Wool and a candle, they say. And that\'s fair. It\'s their hole.'],
    cheerful: ['Oh, there\'s a granny who threatened me with a ladle! I love her. She\'ll come round.'],
    ornery: ['Then they can sit in the dark. And they do. And they complain about the dark.'],
    shy: ['...I don\'t push. If they say no, I go away.'],
    curious: ['One says the glow keeps her awake. I\'m working on a softer one, just for her.'],
    witty: ['There\'s a granny who calls me "that sparky young menace". It\'s practically a title.'],
    proud: ['They\'ll come round. Everyone comes round to good work.'],
    gloomy: ['They\'re probably right. Some days I think the old ways were better.'],
    'rift': ['There\'s a granny who thinks I\'m a sort of goblin. Honestly? Fair.'],
  });
  W('work.wire.reading', {
    _: ['Ha! Has she? Sitting under the neighbor\'s glow? I knew it!', 'Ha! I\'ll not say a word to her. Not a single word.'],
    cheerful: ['Ha! Oh, that\'s wonderful! I\'ll leave her a little lamp on the step!'],
    witty: ['Then she\'s a customer. She just doesn\'t know it yet.'],
    ornery: ['Hmph. Typical. Wants the light and not the wire.'],
  });
  W('work.wire.leave', {
    _: ['Let the lane persuade her. Yes. That\'s wise. I\'ll leave her be.', 'Fair. Nobody likes being talked into things. I\'ll wait.'],
    proud: ['I wasn\'t going to push. ...But yes. I\'ll wait.'],
    curious: ['Let her see it in her neighbors\' windows. Yes. That\'s cleverer than arguing.'],
  });
  W('work.wire.cares', {
    _: ['...I do care. Thanks for seeing it.', '...Ha. Don\'t tell anyone. I\'ve a reputation as a sparky menace.'],
    shy: ['...Thank you.'],
    'rift': ['...Thanks, wizard. That\'s a good ping.'],
  });
  W('work.wire.taught', {
    _: ['Back home everyone knew a bit. You learn wiring the way you learn to walk.', 'The rift-folk taught me. Patiently. Mostly patiently.'],
    cheerful: ['A lovely rift-girl with a visor! She laughed at me for a week and then taught me everything.'],
    ornery: ['Nobody. I took things apart till they stopped biting me.'],
    shy: ['...I watched. From the back. For ages. Then one day I fixed something and nobody noticed it was me.'],
    curious: ['I asked a thousand questions. The rift-folk answered nine hundred. The rest I\'m still on.'],
    dreamy: ['The light taught me, a bit. You learn what it wants.'],
    witty: ['A shock, mostly. Several shocks. They\'re very good teachers.'],
    proud: ['I taught myself, and then taught the rift-folk a thing or two.'],
    gloomy: ['Mistakes. Lots of singed mistakes.'],
    'rift': ['My dad, back in Neverdark. He fixed signal towers. I fix one tower now. Feels like keeping him close.'],
    '!rift': ['The rift-folk. I was the first hill-hobbit who asked. My mom still won\'t sit near the lamp.'],
  });
  W('work.wire.teach', {
    _: ['If they asked properly, and promised not to lick anything. Yes.', 'I would. I\'d like to. Somebody should know when I\'m up the mast.'],
    cheerful: ['Oh, yes! I\'d love an apprentice! We\'d wire the whole hill!'],
    ornery: ['If they\'re careful. Most aren\'t.'],
    shy: ['...I think I\'d like that. If they were quiet.'],
    proud: ['Only the best. It\'s not a trade for dabblers.'],
    gloomy: ['If any of them want it. Most think it\'s strange.'],
  });
  W('work.wire.cross', {
    _: ['...Cross teachers are the good ones. They care too much to be nice.', '...You miss him. I can tell. I\'m sorry, wizard.'],
    witty: ['Very cross and very old. So, a wizard. I see the family resemblance.'],
    shy: ['...Mine was kind. I\'d miss her too.'],
  });
  W('work.wire.more', {
    _: ['...My first lamp was for a little one who was frightened of the dark. Nobody asked me. I just made it.', '...The first glow I ever wired here was for an old fellow who couldn\'t see to read. He cried. So did I.'],
    shy: ['...My first one was for a child who cried every night. I left it on her step. She never knew it was me.'],
    proud: ['...My first lamp here wasn\'t for show. It was for someone who needed it. I don\'t tell folk that.'],
    gloomy: ['...My first one was for somebody who was afraid. Afraid of the dark, like I was, when we came through.'],
    'rift': ['...When I first came through, the dark here terrified me. Real dark. My first lamp was for me.'],
  });
  W('work.wire.after', {
    _: ['...Not after the first night. They still leave it on. Every night.', '...No. Now they\'re only afraid of the dentist. Ha.'],
    'rift': ['...Less. I still keep one on. Don\'t tell.'],
  });
  W('work.wire.hat', {
    _: ['Ha! Your hat? I could. It\'d be the brightest hat in the Shire.', 'Ha! A neon hat. Folk would see you coming from Bree.'],
    cheerful: ['Oh, YES. Pink. With little stars. Hold still.'],
    ornery: ['I\'m not wiring a hat. Hats catch fire.'],
    witty: ['I could, but then you\'d never sneak up on anyone again. And that\'s half of being a wizard.'],
    'rift': ['Ha! Full signal, on your head. I\'m into it.'],
  });
});
