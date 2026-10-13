'use strict';
// ---------------------------------------------------------------------------
// Work and the trades, the second pack: the food trades one by one. The
// baker's loaves, the farmer's barley, the miller's wheel, the herder's
// beasts, the brewer's malt, the innkeeper's regulars, the leaf-grower's
// curing shed and the orchard-keeper's bees. Each is a thread about the craft
// itself (work.day in the first pack is about the working day), with a trade
// secret at the bottom of it for those who listen long enough. The facts
// (workLevel, workShort, workHazard and the rest) come from talk/work.js; the
// W() helper is the same as there (see its banner).
// ---------------------------------------------------------------------------

talkPack('work2', () => {
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
  const bristly = { if: { temper: ['proud', 'ornery'] } };

  // --- Who else is in the food trades: the miller for the baker, and so on -----------
  addFacts((v, F) => {
    const other = (j) => { const o = Game.villagers.find((x) => x !== v && x.job === j && !x.leaving); return o ? o.first : null; };
    F.workFoodFarmer = other('farmer'); F.workFoodMiller = other('miller'); F.workFoodBaker = other('baker');
    F.workFoodBrewer = other('brewer'); F.workFoodInnkeeper = other('innkeeper'); F.workFoodHerbalist = other('herbalist');
    F.workFoodHives = World.hives ? World.hives.length : 0;
  });

  // --- The baker ---------------------------------------------------------------------
  addThread({
    id: 'work.baker', label: 'What\'s the secret of a good loaf?', about: 'work', weight: 1, cool: 4, reveals: 'work.baker',
    when: (F) => F.job === 'baker' && F.stage !== 'child', rel: () => 1.3,
    open: { ask: 'work.baker.open' },
    beats: {
      start: { line: 'work.baker.start', go: [
        { ap: 'ask', say: 'Is the Store running short of bread?', to: 'short', need: { if: { workShort: true } } },
        { ap: 'ask', say: 'How do you know when the dough\'s ready?', to: 'dough' },
        { ap: 'jest', say: 'work.baker.jest', label: 'Tease them about the dough', to: 'talk' },
        { ap: 'listen', say: '*You lean in the Bakehouse doorway and wait.*', label: 'Lean in the doorway and wait', to: 'early' },
      ] },
      dough: { line: 'work.baker.dough', go: [
        { ap: 'ask', say: 'Who taught you that?', to: 'taught' },
        { ap: 'share', say: 'I once hurried a loaf with a spell. It went off like a firework.', to: 'spell' },
        { ap: 'listen', say: '*You say nothing, and breathe in the smell of it.*', label: 'Just breathe in the smell of it', to: 'secret', need: { open: 2 }, soft: true },
      ] },
      talk: { line: 'work.baker.talk', go: [
        { ap: 'jest', say: 'And the oven? Do you talk to that too?', to: 'oven' },
        { ap: 'ask', say: 'Truly, though. How do you know when it\'s ready?', to: 'dough' },
      ] },
      oven: { line: 'work.baker.oven', fx: { joke: { k: 'work.baker.oven', t: '{Name} calls the Bakehouse oven Grandmother.' } }, go: [
        { ap: 'jest', say: 'Give Grandmother my regards.', to: 'regards' },
        { ap: 'ask', say: 'And who taught you to manage her?', to: 'taught' },
      ] },
      early: { line: 'work.baker.early', go: [
        { ap: 'advise', say: 'Have a nap after the second batch. You\'ve earned it.', to: [{ to: 'bristle', need: bristly }, 'nap'] },
        { ap: 'ask', say: 'What\'s the Bakehouse like before dawn?', to: 'dawn' },
        { ap: 'comfort', say: 'Nobody in the valley breakfasts without you. They know it.', to: 'thanked' },
      ] },
      dawn: { line: 'work.baker.dawn', go: [
        { ap: 'listen', say: '*You let the quiet go on a while.*', label: 'Let the quiet go on', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'I\'d like to see that, one morning.', to: 'visit' },
      ] },
      taught: { line: 'work.baker.taught', go: [
        { ap: 'ask', say: 'And is there a family secret?', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'And it shows, in every loaf.', to: 'still' },
      ] },
      short: { line: 'work.baker.short', go: [
        { ap: 'advise', say: 'Knead a double batch, and let it prove while you sweep.', to: [{ to: 'bristle', need: bristly }, 'double'] },
        { ap: 'ask', say: 'Is it the flour that\'s short?', to: 'flour' },
        { ap: 'comfort', say: 'You can only bake what the oven holds.', to: 'eased' },
      ] },
      flour: { line: 'work.baker.flour', go: [
        { ap: 'warm', say: 'Then you\'re doing all anyone could.', to: 'eased' },
        { ap: 'advise', say: 'Knead what you have now, and be ready when it comes.', to: 'double' },
      ] },
      secret: { line: 'work.baker.secret', fx: { confide: { k: 'work.baker.secret', t: '{Name} puts a spoon of honey in the dough and lets it rest overnight in the cold larder', secret: true }, trust: 0.02 }, go: [
        { ap: 'warm', say: 'Safe with me. Not a word.', to: 'safe' },
        { ap: 'jest', say: 'Honey! I\'ll tell the whole of Bree.', to: [{ to: 'hurt', need: { if: { temper: ['shy', 'gloomy', 'proud'] } } }, 'laughs'] },
      ] },
      spell: { line: 'work.baker.spell', fx: { fond: 0.02 }, end: true },
      regards: { line: 'work.baker.regards', fx: { fond: 0.02 }, end: true },
      nap: { line: 'work.baker.nap', fx: { respect: 0.02, queue: 'nap', drive: { tired: -0.03 } }, end: true },
      bristle: { line: 'work.baker.bristle', fx: { respect: -0.02 }, end: true },
      thanked: { line: 'work.baker.thanked', fx: { fond: 0.02, feel: 'cheered', feelX: 'the wizard' }, end: true },
      visit: { line: 'work.baker.visit', fx: { promise: { k: 'work.baker.dawn', t: 'You said you\'d come to the Bakehouse one morning before dawn', days: 5 } }, end: true },
      still: { line: 'work.baker.still', fx: { trust: 0.03 }, end: true },
      double: { line: 'work.baker.double', fx: { respect: 0.03, queue: 'baker_knead', feel: 'good_tip', feelX: 'the wizard' }, end: true },
      eased: { line: 'work.baker.eased', fx: { trust: 0.02 }, end: true },
      safe: { line: 'work.baker.safe', fx: { trust: 0.04, promise: { k: 'work.baker.honey', t: 'You promised to keep the honey in the bread a secret', days: 30 } }, end: true },
      laughs: { line: 'work.baker.laughs', fx: { fond: 0.02, joke: { k: 'work.baker.bree', t: 'The wizard threatened to tell Bree about the honey.' } }, end: true },
      hurt: { line: 'work.baker.hurt', fx: { trust: -0.03, sore: { days: 2 } }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  W('work.baker.open', {
    _: ['What\'s the secret of a good loaf, {name}?', 'Tell me about the bread, {name}. Properly.', 'How does a loaf come to be, {name}? From the start.'],
    'hour=morning': ['You\'ve been up since before the birds, {name}. How\'s the bread?'],
    'season=winter': ['Warmest place in the valley, your Bakehouse, {name}. What\'s baking?'],
  });
  W('work.baker.jest', {
    _: ['Is it true bakers sing to their dough?', 'I hear you give every loaf a name.', 'Do you tuck the loaves in at night?'],
  });
  W('work.baker.start', {
    _: ['Flour, water, salt, yeast and patience. Mostly patience.', 'Good bread\'s simple. That\'s what makes it hard.', 'It\'s all in the hands. And the waiting. Bread won\'t be hurried.'],
    cheerful: ['Oh, there\'s no secret! Love and butter. Mostly butter.', 'Bread\'s the happiest thing there is. It rises! Every single morning, it rises!'],
    ornery: ['The secret is not letting folk poke it while it proves.', 'Secret? Getting up at four and not complaining. Well. Not complaining much.'],
    shy: ['...I don\'t know if there\'s a secret. I just listen to it.', '...The dough tells you things. If you\'re quiet enough.'],
    curious: ['I\'ve been trying a wetter dough. Holes like caves! I\'m still working out why.', 'Warmth, mostly. I keep notes on the proving. Twenty pages so far.'],
    dreamy: ['Bread\'s like weather. You can\'t make it, only help it along.', 'It\'s the smell at dawn. The whole valley asleep but the loaves.'],
    witty: ['The secret is knowing which loaf to give the wizard. Not that one.', 'Knead it like you\'re cross with someone. I\'m never short of someone.'],
    proud: ['There is a secret, it\'s mine, and it\'s why my loaves are the best in the valley.', 'Years of practice. A baker\'s hands aren\'t made in a season.'],
    gloomy: ['There\'s no secret. Early mornings and burnt wrists, forever.', 'You do it all right and one day it sulks and stays flat anyway.'],
    'workLevel=new': ['I\'m still learning! Yesterday\'s batch was more brick than bread.', 'I\'m new to it. The oven and I are still getting to know each other.'],
    'workLevel=master': ['After all these years I can tell a good dough with my eyes shut. I sometimes do.', 'My hands know more about bread than my head ever will.'],
    'season=autumn': ['Apples everywhere, so it\'s pies as much as bread. Pastry wants cold hands.'],
    'season=winter': ['In winter the dough\'s slow to wake. Like everyone. I keep it by the oven.'],
    'season=summer': ['Summer dough proves fast. Turn your back and it\'s over the edge of the bowl.'],
    'workGlut ^1': ['Too much bread, if anything. The Store\'s shelves are bowing under it.'],
    'workMarket': ['Market day! Everyone wants a loaf and a pie and a word. I\'ve flour to the elbow.'],
    rift: ['Back in Neverdark bread came out of a slot. This is slower. And better. Much better.'],
    'register=fine': ['One must respect the dough. It knows when one is hurrying.'],
  });
  W('work.baker.dough', {
    _: ['Press it with a finger. If it springs back slow, like it\'s thinking, it\'s ready.', 'It goes smooth and soft as a baby\'s cheek. Then you leave it alone.'],
    cheerful: ['When it\'s plump and pleased with itself! You can tell. It looks smug.'],
    ornery: ['When it\'s ready. Not when somebody asks me if it\'s ready.'],
    shy: ['...It goes quiet under your hands. I know that sounds daft.'],
    curious: ['The finger test, mostly. But I\'ve a feeling it\'s the warmth of the bowl that matters.'],
    dreamy: ['It sighs. Very softly. You have to be listening.'],
    witty: ['When I\'ve run out of other things to do while I wait for it.'],
    proud: ['I know by looking. Others need the finger test. I don\'t.'],
    gloomy: ['You never truly know. You hope. Bread\'s mostly hope.'],
    'workFamilyTrade ^1': ['{WorkParentName} taught me the finger test. I still do it the same, crooked finger and all.'],
    'workLevel=new': ['I poke it and hope. Is that wrong? It feels wrong.'],
    'hour=morning': ['This batch? Another half hour. I can smell it nearly there.'],
    'season=winter': ['In the cold it takes twice as long. I wrap the bowl in my own scarf.'],
  });
  W('work.baker.talk', {
    _: ['Sing to it? ...Only on Mersdays.', 'I do not give them names. ...Only the good ones.'],
    cheerful: ['Of course I sing! Bread likes a jolly tune. It rises higher.'],
    ornery: ['I talk to it. Sternly. It\'s the only thing in this valley that listens.'],
    shy: ['...How did you know? Please don\'t tell anyone.'],
    curious: ['I\'ve tried singing and not singing. The singing ones are better. I can\'t say why.'],
    dreamy: ['I hum. It hums back, in its way.'],
    witty: ['Only the ones that answer back. Rye, mostly.'],
    proud: ['I don\'t need to talk to my bread. It knows what\'s expected of it.'],
    gloomy: ['I tell it my troubles. It\'s a good listener. Then folk eat it.'],
  });
  W('work.baker.oven', {
    _: ['The oven\'s another matter. I call her Grandmother. She\'s old and hot and you don\'t argue.', 'Grandmother? The oven. She burns the left side if you forget to say good morning.'],
    cheerful: ['Grandmother! That\'s the oven. I give her a pat every morning. She likes it.'],
    ornery: ['The oven\'s called Grandmother, and she\'s got a worse temper than mine.'],
    shy: ['...I call the oven Grandmother. Don\'t laugh. She\'s been kind to me.'],
    curious: ['I call her Grandmother. Her back corner runs hot. I\'ve mapped it, nearly.'],
    dreamy: ['Grandmother. She breathes, you know, when she\'s cooling. Like she\'s asleep.'],
    witty: ['Grandmother. Because she\'s warm, she\'s old, and she\'s always right.'],
    proud: ['Grandmother, I call her. She and I understand each other. Nobody else can manage her.'],
    gloomy: ['Grandmother. One day she\'ll crack and that\'ll be the end of us both.'],
  });
  W('work.baker.regards', {
    _: ['Ha! I\'ll tell her. She\'ll burn your loaf on purpose.', 'I\'ll pass it on. She won\'t care. She never does.'],
    cheerful: ['She\'ll be ever so pleased! I\'ll tell her first thing.'],
    witty: ['She\'ll want to know your intentions.'],
    ornery: ['She doesn\'t take regards. She takes wood.'],
    shy: ['...I will. She\'ll like that.'],
  });
  W('work.baker.early', {
    _: ['Four o\'clock. Every day. The birds aren\'t up and neither is the sense in it.', 'Up in the dark, fire in the oven, dough out to prove. By sunrise I\'m on my second batch.'],
    cheerful: ['I love the early hours! The whole Bakehouse to myself and a song in my head.'],
    ornery: ['Four in the morning, while the rest of you snore. And then they complain the crust\'s too hard.'],
    shy: ['...I like the early part. Nobody to talk to. Just me and the dough.'],
    curious: ['Before dawn. I\'ve tried later. The bread knows. It sulks.'],
    dreamy: ['Before the birds. I walk down the lane in the dark and every window\'s asleep.'],
    witty: ['Before the cock. He resents me for it. We don\'t speak.'],
    proud: ['Before anyone. That\'s why there\'s bread on every table by breakfast.'],
    gloomy: ['In the dark. Always in the dark. I\'ve not seen a sunrise I didn\'t work through.'],
    'tired ^1': ['Too early. I\'ve been up since three. I could sleep in the flour bin.'],
    'season=winter': ['In winter it\'s dark both ends of the day. I forget what my own lane looks like.'],
    'spouse': ['{Spouse} says I get up so early I meet myself coming to bed.'],
  });
  W('work.baker.dawn', {
    _: ['Quiet. Warm. The oven ticking. It\'s the best hour of the day, and nobody knows it.', 'Dark and warm and smelling of yeast. Like being inside a loaf.'],
    cheerful: ['Oh, it\'s lovely! The window goes grey, then gold, and the first loaves come out.'],
    ornery: ['It\'s the only time nobody\'s asking me for anything. Lovely, that.'],
    shy: ['...It\'s the only time I feel quite sure of myself.'],
    curious: ['You can hear the dough rising, if you listen. Little ticks. I wonder what it is.'],
    dreamy: ['Like the world\'s holding its breath, waiting for bread.'],
    witty: ['Peaceful. Then somebody knocks wanting a bun and the spell\'s broken.'],
    proud: ['Like a little kingdom. Mine.'],
    gloomy: ['Lonely, but a good lonely. Do you know what I mean?'],
  });
  W('work.baker.taught', {
    _: ['I learned at the old baker\'s elbow. Burnt my fingers a hundred times.', 'Nobody, really. A lot of bad bread taught me.'],
    'workFamilyTrade ^1': ['{WorkParentName}. Flour on everything, even the cat. The best baker this valley had.', '{WorkParentName} taught me, and still tells me I knead too hard.'],
    'workMaster ^2': ['{WorkMaster} is teaching me now. Patient. Mostly. Except about crusts.'],
    cheerful: ['Everybody! I asked every grandmother in the valley. They all had a trick.'],
    ornery: ['I taught myself, after somebody told me I\'d never manage it.'],
    shy: ['...I watched through the Bakehouse window for years before I dared go in.'],
    curious: ['I worked it out. Took a hundred loaves. I wrote them all down.'],
    dreamy: ['My grandmother. She baked by the moon. I still do, a bit.'],
    proud: ['Nobody taught me what I know now. I worked it out, past what I was shown.'],
    gloomy: ['Mistakes, mostly. Some of them are still in the bottom of the bin.'],
  });
  W('work.baker.short', {
    _: ['It is. Folk want more than I can bake. One oven, two hands, the whole valley hungry.', 'Bare shelves by noon. I bake and it\'s gone, bake and it\'s gone.'],
    cheerful: ['Oh, it\'s a good problem to have! Everyone wants my bread. But yes. Short.'],
    ornery: ['Short? I\'m baking as fast as the oven lets me. They can eat less.'],
    shy: ['...I\'m trying. I\'m sorry. I can\'t keep up.'],
    curious: ['I\'ve worked out it\'s about forty loaves short a day. I\'m not sure where they all go.'],
    dreamy: ['They eat it faster than it rises. I can\'t make the dough hurry.'],
    witty: ['Short of bread, long on complaints.'],
    proud: ['My bread\'s popular. Nobody makes it like I do, so nobody else can fill the gap.'],
    gloomy: ['Always short. It\'ll be short tomorrow. It\'ll be short at my funeral.'],
    'workRations=feast|generous ^1': ['Feast rations! Everyone\'s eating two loaves at a sitting. Of course we\'re short.'],
    'workAlone ^1': ['It\'s just me in the Bakehouse. One baker for a whole village. You see the trouble.'],
  });
  W('work.baker.flour', {
    _: ['Sometimes. When the mill\'s slow, I\'m slow. No flour, no loaf.', 'It\'s the flour as much as anything. I can\'t bake with air.'],
    'workFoodMiller': ['{WorkFoodMiller}\'s doing what the wheel allows. It\'s not the miller, it\'s the barley.', 'I\'ve been round to {workFoodMiller} twice today. The stones are going as fast as they can.'],
    ornery: ['Of course it\'s the flour. It\'s always the flour. Ask the miller.'],
    shy: ['...I don\'t like to say it\'s the mill. But.'],
    curious: ['I think it\'s the barley, before it\'s the flour. The fields are behind.'],
    gloomy: ['Flour, barley, rain, the lot. It\'s all running short together.'],
    proud: ['Give me the flour and I\'ll bake the village twice over.'],
  });
  W('work.baker.secret', {
    _: ['...All right. A spoon of honey in the dough, and it rests overnight in the cold larder. That\'s all. That\'s everything.', '...Honey. A spoon of it. And a night in the cold. Nobody waits that long but me.'],
    cheerful: ['Oh, go on then! A spoon of honey, and a whole night in the cold larder. Isn\'t that simple?'],
    ornery: ['...If this gets out, I\'ll know who. Honey in the dough. A night in the cold larder. There.'],
    shy: ['...I\'ve never told anyone. Honey. A spoonful. And it sleeps in the cold larder overnight.'],
    curious: ['Honey feeds the yeast, and the cold slows it. Slow bread tastes of more. I found it by accident.'],
    dreamy: ['It\'s a lullaby, really. Honey to sweeten its dreams, and a cold night to dream in.'],
    witty: ['Honey and a cold night. Which is also the secret of a happy marriage, I\'m told.'],
    proud: ['My grandmother\'s way. A spoon of honey, a night in the cold. Lesser bakers can\'t wait that long.'],
    gloomy: ['Honey, and a cold night. It\'ll die with me. Nobody else has the patience.'],
    'workFamilyTrade ^1': ['{WorkParentName}\'s secret. Honey in the dough, a night in the cold larder. Don\'t ever tell.'],
  });
  W('work.baker.spell', {
    _: ['A firework! Ha! What did it taste of?', 'Ha! That\'s what comes of hurrying bread. It takes revenge.'],
    cheerful: ['Oh, I wish I\'d seen it! Bread going bang!'],
    ornery: ['Serves you right. Bread\'s not for hurrying.'],
    shy: ['...Was anyone hurt? Was the loaf hurt?'],
    curious: ['A spell? What kind? Could it make the dough prove faster? ...Without the bang?'],
    dreamy: ['Bread raining down like snow. I\'d have liked to see that.'],
    witty: ['So that\'s why you\'re a wizard and not a baker.'],
    proud: ['Ha! Leave the bread to those who know it, wizard.'],
    gloomy: ['That\'s what happens. You hurry anything and it goes off in your face.'],
  });
  W('work.baker.nap', {
    _: ['A nap... Between batches... Do you know, I might.', 'You\'re a terrible influence. Yes. A nap.'],
    cheerful: ['Ooh, a nap! You\'re a wicked wizard. Yes please.'],
    shy: ['...I\'ve always wanted to. I thought folk would think me lazy.'],
    dreamy: ['On the flour sacks. They\'re ever so soft.'],
    witty: ['If the bread burns, I\'m blaming you.'],
    gloomy: ['I\'ll probably dream of dough. But all right.'],
    curious: ['I wonder if the bread will be any different. I\'ll try it and see.'],
  });
  W('work.baker.bristle', {
    _: ['A nap! In the middle of a bake? You know nothing about bread, wizard.', 'I don\'t nap. The oven doesn\'t nap. Nobody naps.'],
    proud: ['I\'ll rest when the bread\'s done, and not a minute before.'],
    ornery: ['A nap. And who\'ll mind Grandmother? You?'],
  });
  W('work.baker.thanked', {
    _: ['...Do they? Well. That\'s nice to think.', 'Silently! Ha. Yes, that sounds like this valley.'],
    cheerful: ['Oh, that\'s lovely! I\'ll think of it with every loaf.'],
    ornery: ['They could say it out loud once in a while.'],
    shy: ['*goes pink to the ears*'],
    gloomy: ['...I suppose they do. In their way. Thank you.'],
    proud: ['They\'d best. Have you tried breakfast without bread?'],
    dreamy: ['A whole valley of breakfasts. That\'s a nice picture.'],
  });
  W('work.baker.visit', {
    _: ['Would you? Come at four. Bring nothing. I\'ll give you the first loaf.', 'Do. Knock twice. Grandmother doesn\'t like a single knock.'],
    cheerful: ['Oh, please do! I\'ll make you a little loaf of your own.'],
    shy: ['...You\'d come? I\'d like that. I\'d not talk much, mind.'],
    ornery: ['Hm. Don\'t get under my feet.'],
    witty: ['Four o\'clock, wizard. Wizards are never on time, so come at three.'],
  });
  W('work.baker.still', {
    _: ['It does? ...I\'ll think of that tomorrow at four.', 'That\'s a kind thing to say. I\'ll think of it with every loaf.'],
    shy: ['...Thank you.'],
    gloomy: ['...That\'s the nicest thing anyone\'s said to me this year.'],
    proud: ['It does. I make sure of it.'],
    dreamy: ['Every loaf. I like to think so.'],
  });
  W('work.baker.double', {
    _: ['A double batch, while it proves... Yes. Why didn\'t I think of that?', 'Knead and sweep at once. You\'re a wizard of the Bakehouse, you are.'],
    cheerful: ['Oh, that\'s clever! I\'m off to knead straight away!'],
    curious: ['That would work. The proving time\'s idle anyway. Yes!'],
    shy: ['...I\'ll try. Thank you.'],
    gloomy: ['It\'ll still not be enough. But it\'ll be more.'],
    witty: ['Twice the dough, half the complaints. I like those sums.'],
  });
  W('work.baker.eased', {
    _: ['...True. One oven. I do what I can.', 'That\'s so. Thank you. I\'d been blaming myself.'],
    ornery: ['Exactly what I\'ve been telling them.'],
    shy: ['...That helps.'],
    gloomy: ['I suppose. It doesn\'t feel like it.'],
    cheerful: ['You\'re right! I\'ll stop fretting and just bake.'],
  });
  W('work.baker.safe', {
    _: ['I know. I wouldn\'t have told you otherwise.', 'Not a word. Not even to the miller.'],
    shy: ['...Thank you. I feel lighter, somehow.'],
    ornery: ['See it stays safe.'],
    witty: ['Good. Or Grandmother hears of it.'],
    cheerful: ['I knew I could trust you! Have a bun. Have two.'],
  });
  W('work.baker.laughs', {
    _: ['Ha! You wouldn\'t dare. ...Would you?', 'Ha! Bree can find its own honey.'],
    cheerful: ['Ha! Tell them! They\'ll never get it right anyway.'],
    witty: ['Go on. I\'ll tell them about the beard.'],
    curious: ['Ha! Would Bree bakers even know what to do with it?'],
    ornery: ['Hmph. ...Ha. You\'re a menace.'],
  });
  W('work.baker.hurt', {
    _: ['...I told you that in confidence, wizard.', 'That\'s not funny. Not that.'],
    shy: ['...Oh. I shouldn\'t have said.'],
    proud: ['I\'ll thank you not to joke about my family\'s bread.'],
    gloomy: ['...I knew I shouldn\'t have told anyone.'],
  });

  // --- The farmer ----------------------------------------------------------------------
  addThread({
    id: 'work.farmer', label: 'What\'s the barley telling you?', about: 'work', weight: 1, cool: 4, reveals: 'work.farmer',
    when: (F) => F.job === 'farmer' && F.stage !== 'child', rel: (F) => (F.workHazard || F.workHazardSoon ? 1.6 : 1.3),
    open: { ask: 'work.farmer.open' },
    beats: {
      start: { line: 'work.farmer.start', go: [
        { ap: 'ask', say: 'Is the weather turning against you?', to: 'trial', need: { when: (F) => !!(F.workHazard || F.workHazardSoon) } },
        { ap: 'ask', say: 'How do you know when to sow?', to: 'sow' },
        { ap: 'jest', say: 'Does the scarecrow pull his weight?', to: 'scarecrow' },
        { ap: 'listen', say: '*You walk the field edge beside them a while.*', label: 'Walk the field edge with them', to: 'edge' },
      ] },
      sow: { line: 'work.farmer.sow', go: [
        { ap: 'ask', say: 'Who taught you to read the land?', to: 'taught' },
        { ap: 'share', say: 'I read the sky. It lies more than soil does.', to: 'sky' },
        { ap: 'listen', say: '*You crouch and put a hand flat on the soil.*', label: 'Put your hand on the soil', to: 'secret', need: { open: 2 }, soft: true },
      ] },
      scarecrow: { line: 'work.farmer.scarecrow', fx: { joke: { k: 'work.farmer.scarecrow', t: 'The scarecrow wears {name}\'s grandfather\'s hat, and the crows respect it.' } }, go: [
        { ap: 'jest', say: 'Does he get a share of the harvest?', to: 'share' },
        { ap: 'ask', say: 'And the crows? Truly?', to: 'crows' },
      ] },
      crows: { line: 'work.farmer.crows', go: [
        { ap: 'advise', say: 'Mend the fence and pull the docks. Crows like an untidy field.', to: [{ to: 'bristle', need: bristly }, 'mend'] },
        { ap: 'comfort', say: 'The crows take a little. You keep the rest.', to: 'eased' },
        { ap: 'tale', say: 'I once argued with a crow for an hour. He won.', to: 'crowtale' },
      ] },
      edge: { line: 'work.farmer.edge', go: [
        { ap: 'ask', say: 'What do you think about, out here?', to: 'think' },
        { ap: 'listen', say: '*You let the wind in the barley do the talking.*', label: 'Let the barley do the talking', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'It\'s a good place to be quiet in.', to: 'quiet' },
      ] },
      think: { line: 'work.farmer.think', go: [
        { ap: 'warm', say: 'Those are good things to think about.', to: 'quiet' },
        { ap: 'advise', say: 'Then sit a while longer. The barley won\'t mind.', to: 'rest' },
      ] },
      taught: { line: 'work.farmer.taught', go: [
        { ap: 'ask', say: 'And did they pass on any old ways?', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'And it shows, row by row.', to: 'quiet' },
      ] },
      trial: { line: 'work.farmer.trial', go: [
        { ap: 'advise', say: 'work.farmer.trial.fix', label: 'Tell them what to do', to: [{ to: 'bristle', need: bristly }, 'plan'] },
        { ap: 'comfort', say: 'The valley\'s come through worse. So will the barley.', to: 'weather' },
        { ap: 'ask', say: 'And if it goes badly?', to: 'badly' },
      ] },
      badly: { line: 'work.farmer.badly', go: [
        { ap: 'comfort', say: 'Then the village shares what\'s left. That\'s what a Store\'s for.', to: 'weather' },
        { ap: 'advise', say: 'work.farmer.trial.fix', label: 'Tell them what to do', to: 'plan' },
      ] },
      secret: { line: 'work.farmer.secret', fx: { confide: { k: 'work.farmer.coin', t: '{Name} buries a penny in the corner of every field at sowing, for luck', secret: true }, trust: 0.02 }, go: [
        { ap: 'warm', say: 'I\'ll not tell a soul.', to: 'safe' },
        { ap: 'jest', say: 'I\'ll be out with a spade tonight, then.', to: 'spade' },
      ] },
      sky: { line: 'work.farmer.sky', fx: { fond: 0.01 }, end: true },
      share: { line: 'work.farmer.share', fx: { fond: 0.02 }, end: true },
      mend: { line: 'work.farmer.mend', fx: { respect: 0.03, queue: 'farmer_fence', feel: 'good_tip', feelX: 'the wizard' }, end: true },
      bristle: { line: 'work.farmer.bristle', fx: { respect: -0.02 }, end: true },
      eased: { line: 'work.farmer.eased', fx: { trust: 0.02 }, end: true },
      crowtale: { line: 'work.farmer.crowtale', fx: { fond: 0.02 }, end: true },
      quiet: { line: 'work.farmer.quiet', fx: { fond: 0.01, trust: 0.01 }, end: true },
      rest: { line: 'work.farmer.rest', fx: { queue: 'farmer_rest', drive: { tired: -0.03 } }, end: true },
      plan: { line: 'work.farmer.plan', fx: { respect: 0.04, run: (T, v) => { const k = T.F.workHazard === 'drought' || T.F.workHazardSoon === 'drought' ? 'farmer_fetchwater' : 'farmer_weed'; if (ACTIONS[k]) v.queue.push({ a: ACTIONS[k] }); } }, end: true },
      weather: { line: 'work.farmer.weather', fx: { trust: 0.02 }, end: true },
      safe: { line: 'work.farmer.safe', fx: { trust: 0.04 }, end: true },
      spade: { line: 'work.farmer.spade', fx: { fond: 0.02, joke: { k: 'work.farmer.spade', t: 'The wizard threatened to dig up {name}\'s lucky pennies.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  W('work.farmer.open', {
    _: ['What\'s the barley telling you this year, {name}?', 'How are the fields, really, {name}? Not the polite answer.', 'Tell me about the land, {name}. You know it better than anyone.'],
    'season=spring': ['Sowing time, {name}. Do you feel lucky?'],
    'season=autumn': ['Harvest, {name}! How\'s it coming in?'],
    'season=winter': ['What does a farmer do in winter, {name}, besides worry?'],
  });
  W('work.farmer.start', {
    _: ['It\'s saying it\'s thirsty, mostly. And that I\'m slow.', 'Barley talks, if you walk it every day. Today it\'s saying "rain, please".', 'It\'s coming on. Slow and steady. Barley doesn\'t hurry for anyone.'],
    cheerful: ['It\'s saying it\'s happy! Look at it nod. That\'s a happy field, that is.', 'Good things! Green and tall and not a weed in it. Well. Not many.'],
    ornery: ['It\'s saying the crows have been at it again, that\'s what.', 'It\'s saying nobody\'s helped me weed it in a week.'],
    shy: ['...It\'s saying it\'s all right. I think. I listen more than I talk to it.'],
    curious: ['The east corner\'s taller than the west. I\'ve been trying to work out why. Drainage, I think.', 'I\'ve been counting ears on a stalk. Twenty-two on the best. I\'m keeping a tally.'],
    dreamy: ['When the wind goes over it, it looks like the sea. I\'ve never seen the sea. I imagine it\'s like that.'],
    witty: ['It\'s saying "more water", "fewer crows" and "who\'s that tall fellow in the hat?"'],
    proud: ['It\'s saying it\'s the best barley in the valley, and it\'s right.', 'Straight rows, clean ground, heavy ears. It speaks for itself.'],
    gloomy: ['It\'s saying something\'s going to go wrong. Something always does, before harvest.'],
    'season=spring': ['Spring\'s the hopeful time. Sow it, and everything\'s still possible.', 'Seed going in, row by row. My fingers know the count better than my head.'],
    'season=summer': ['Summer\'s hoeing and watering, hoeing and watering. The barley drinks like a brewer.', 'It\'s green and growing, and so are the docks. We\'re racing.'],
    'season=autumn': ['It\'s saying "now", loud and clear. Every hand to the sheaves.', 'It\'s gone gold and heavy. Harvest. My favourite and my hardest.'],
    'season=winter': ['The fields are asleep. I mend fences and see to the hens and look at the sky.', 'Nothing much, in winter. It\'s resting. I\'m meant to be resting. I\'m not.'],
    'workHazard=drought ^2': ['It\'s saying it\'s parched. The ground\'s cracking. I carry water till my arms give out.'],
    'workHazard=blight ^2': ['It\'s saying it\'s sick. There\'s blight in one of the fields. It just stops growing.'],
    'workHazard=flood ^2': ['It\'s saying it\'s drowned, down by the river. I\'ve lost the low rows.'],
    'workGlut': ['Too much barley, if you can believe it. The Store can\'t hold it all.'],
    'workShort': ['The Store\'s short of barley and everyone looks at me as if I can grow it faster.'],
    'stage=elder': ['I\'ve walked these rows sixty years. They still surprise me.'],
    rift: ['It\'s quieter than any signal I ever caught. But it talks, you\'re right. I\'m learning the protocol.'],
    'register=plain': ['Says it wants rain, it do. And so do I.'],
  });
  W('work.farmer.sow', {
    _: ['When the blackthorn flowers and the soil\'s warm under your bare foot. Not before.', 'You take your shoes off and stand in it. If your toes don\'t complain, sow.'],
    cheerful: ['Bare feet! If the soil tickles, it\'s time. If it bites, wait a week.'],
    ornery: ['When I say so, and not when the almanac says so. The almanac\'s never farmed.'],
    shy: ['...I just know. It smells different. Sweeter.'],
    curious: ['Soil warmth, mostly. I push a stick in and feel the end. I\'m trying to be more exact.'],
    dreamy: ['When the larks come back. They tell you, if you\'re listening.'],
    witty: ['When the neighbours have sown and you can see if it worked.'],
    proud: ['When my grandfather would have. I\'ve not been wrong in years.'],
    gloomy: ['You guess, and you\'re wrong half the time, and then it frosts anyway.'],
    'workLevel=new': ['I ask the old farmers and do what they say. It mostly works.'],
    'workFamilyTrade ^1': ['{WorkParentName} said: when the blackthorn\'s white, and not a day before. I\'ve never gone against it.'],
  });
  W('work.farmer.scarecrow', {
    _: ['He wears my grandfather\'s hat. The crows respect the hat. Not him. The hat.', 'He does more than some I could name. Stands there all day, never complains.'],
    cheerful: ['He\'s my best worker! I call him Old Barley. I say good morning to him.'],
    ornery: ['He\'s useless. Stood there all week while the crows ate my sowing. Like some folk.'],
    shy: ['...I gave him my old scarf. He looked cold.'],
    curious: ['I\'ve moved him about to see where the crows avoid. He\'s best by the gate. I don\'t know why.'],
    dreamy: ['At dusk I half think he\'s waving.'],
    witty: ['He\'s the only one on the farm who never asks for second breakfast.'],
    proud: ['He\'s the best-dressed scarecrow in the valley. My grandfather\'s hat.'],
    gloomy: ['The crows sit on his head. On his head! That\'s respect for you.'],
  });
  W('work.farmer.share', {
    _: ['He gets the hat. That\'s his share.', 'Ha! He gets the view. Best view on the farm.'],
    cheerful: ['A straw a year! He\'s very happy with it.'],
    witty: ['He\'s asked for a raise. I said I\'d think about it.'],
    ornery: ['He gets nothing, same as me.'],
    shy: ['...I leave him a sheaf at harvest. Just one.'],
  });
  W('work.farmer.crows', {
    _: ['They come at dawn, in gangs. They watch me sow and then they follow me.', 'Crows are clever. Cleverer than me before breakfast.'],
    cheerful: ['Oh, they\'re rascals! I chase them and they laugh. I laugh too. Then I cry a bit.'],
    ornery: ['Thieves! Every one. If I had a sling I\'d not be responsible.'],
    shy: ['...I don\'t like to shoo them. They\'re only hungry. But the seed.'],
    curious: ['They remember faces, you know. They know mine. They don\'t care, but they know.'],
    dreamy: ['Black on the gold. They\'re beautiful, really. Expensive, but beautiful.'],
    witty: ['They\'ve formed a committee. I\'m on the menu.'],
    proud: ['My field gets fewer than most. I keep it clean.'],
    gloomy: ['They\'ll have the lot one year. You watch.'],
  });
  W('work.farmer.mend', {
    _: ['Untidy field, eh? There\'s a post been leaning since spring. I\'ll see to it.', 'Fence and docks. Yes. I\'ve let it go. I\'ll go now.'],
    cheerful: ['Right! Fence first, docks after! Off I go.'],
    curious: ['Do they? I\'ll mend the fence and watch. If it works I\'ll owe you.'],
    shy: ['...I\'ll do it this afternoon.'],
    gloomy: ['It won\'t help. ...I\'ll do it anyway.'],
    witty: ['A tidy field. My mother would be so proud. Of you.'],
  });
  W('work.farmer.bristle', {
    _: ['I\'ve farmed this ground for years, wizard. I know what it wants.', 'Thank you, I can manage my own field.'],
    proud: ['I\'ll not be told how to farm by someone who\'s never held a hoe.'],
    ornery: ['Oh, aye. Wizard knows best. About barley, now.'],
  });
  W('work.farmer.eased', {
    _: ['That\'s true. There\'s enough for us and the crows. Just.', 'I suppose. I keep the rest. Yes.'],
    gloomy: ['...That\'s one way to see it.'],
    shy: ['...Thank you. I needed to hear that.'],
    ornery: ['Hm. Generous of me, isn\'t it.'],
    cheerful: ['You\'re right! Share and share alike. Even with crows.'],
  });
  W('work.farmer.crowtale', {
    _: ['An hour! What did you argue about?', 'Ha! And what did he say?'],
    cheerful: ['Ha! I can just see it. Wizard and crow, nose to beak.'],
    witty: ['Only an hour? I\'ve been arguing with them for years.'],
    curious: ['What about? Do they understand? I\'ve always wondered.'],
    ornery: ['Of course he won. They always win.'],
    gloomy: ['That\'s crows for you. Never lose.'],
  });
  W('work.farmer.edge', {
    _: ['This is my favourite bit. A sit on the field edge. Nobody minds a farmer sitting here.', '*sits down on the bank* Listen. You can hear it grow, almost.'],
    cheerful: ['Isn\'t it lovely? Sun on your face and barley all round.'],
    ornery: ['Don\'t tread on that row. ...Yes, this is the good bit.'],
    shy: ['...I don\'t usually have company out here. It\'s nice.'],
    curious: ['From here you can see where the water sits. See the darker strip? That\'s the low ground.'],
    dreamy: ['The wind makes waves in it. I\'ve sat here hours and never seen the same wave twice.'],
    witty: ['This is where I do my best work. Sitting, mostly.'],
    proud: ['Look at it. Straight as a ruler, all the way to the hedge.'],
    gloomy: ['It\'s quiet now. It\'s always quiet before something goes wrong.'],
    'season=winter': ['Bare fields in winter. You can see the shape of the land. Like bones.'],
    'season=autumn': ['Stubble and sheaves. It smells of bread already.'],
  });
  W('work.farmer.think', {
    _: ['Rain, mostly. And supper. And whether the hens are laying.', 'Oh, the Harvest Fair. Whether this year\'s the year my marrow wins.'],
    cheerful: ['Everything! The barley, the bread it\'ll be, the faces at harvest supper.'],
    ornery: ['Who\'s been walking across my field. I can see the footprints.'],
    shy: ['...Nothing much. That\'s what I like about it.'],
    curious: ['Why some rows lodge in the wind and some don\'t. I\'ve a theory.'],
    dreamy: ['That every seed is a little loaf, sleeping. I think about that a lot.'],
    witty: ['How to look busy when the Steward walks past.'],
    proud: ['Next year\'s field. It\'ll be better. It\'s always better.'],
    gloomy: ['Weather. All the ways weather can go wrong.'],
    'spouse': ['{Spouse}, mostly. What we\'ll have for supper. Whether I\'ll be late for it.'],
    'kid': ['{Kid}. Whether they\'ll want the farm. Whether I\'d want them to.'],
    'workRivalWhat': ['{WorkRival}. And {workRivalWhat}. I\'ll beat {workRival} this year.'],
  });
  W('work.farmer.quiet', {
    _: ['It is. Come and sit any time. Just don\'t tread on the rows.', 'Isn\'t it. Best seat in the valley.'],
    cheerful: ['Come back tomorrow! Bring a pie!'],
    shy: ['...You can come again. If you like.'],
    ornery: ['Quiet till somebody comes and talks. ...Not you. You\'re all right.'],
    dreamy: ['Quiet\'s the best crop I grow.'],
    gloomy: ['Quiet. Yes. It\'s the one thing I don\'t worry about.'],
  });
  W('work.farmer.rest', {
    _: ['A while longer. Yes. The barley won\'t mind. It never does.', 'Another five minutes. Don\'t tell the Steward.'],
    cheerful: ['Oh, go on then! Five more minutes!'],
    curious: ['I wonder if I\'ll work faster after. I\'ll find out.'],
    witty: ['Doctor\'s orders. Well, wizard\'s orders. Close enough.'],
    gloomy: ['I may never get up again. ...That\'s fine.'],
  });
  W('work.farmer.taught', {
    _: ['The old farmers. I followed them about till they gave in and showed me.', 'The land taught me. It\'s a hard teacher and it doesn\'t repeat itself.'],
    'workFamilyTrade ^1': ['{WorkParentName}. Out at dawn with me on {workParentName}\'s shoulders. I learned to sow before I could spell.'],
    'workMaster ^2': ['{WorkMaster} is teaching me. Every row\'s a lesson. Some of them are long ones.'],
    cheerful: ['Everybody! Farmers love to tell you how. You just have to stand still.'],
    ornery: ['Nobody. I watched them all get it wrong and did the opposite.'],
    shy: ['...My grandmother. She never said much. She just showed me.'],
    curious: ['I asked everyone and tried everything. Some of it worked.'],
    dreamy: ['My grandfather. He used to sing to the seed. I still do.'],
    proud: ['My family\'s farmed here since before the Store was built.'],
    gloomy: ['Bad years. They teach you more than good ones.'],
  });
  W('work.farmer.sky', {
    _: ['Ha! The sky\'s a liar, I\'ll give you that.', 'True! The sky says rain and gives you sun.'],
    cheerful: ['Ha! Then we\'ll trade. You watch the sky, I\'ll watch the dirt.'],
    curious: ['What does the sky say, to a wizard? Can you tell what\'s coming?'],
    ornery: ['The soil lies too. Only slower.'],
    witty: ['The soil lies too, but it\'s honest about it.'],
    dreamy: ['I\'d like to read the sky. It\'s so big. The soil\'s so small.'],
    gloomy: ['Everything lies to a farmer.'],
  });
  W('work.farmer.trial', {
    _: ['It is. There\'s a bad spell coming, or here. You can\'t fight weather. You can only get ready.', 'Every year the weather tries something. This year it\'s trying harder.'],
    'workHazard=drought ^1': ['No rain for days. The barley\'s gasping. I\'m carrying buckets from the river till dusk.'],
    'workHazardSoon=drought ^1': ['Not a cloud. The wells are low. A dry spell\'s coming, I can smell it.'],
    'workHazard=blight ^1': ['Blight. It\'s in one of the fields. The barley just stops, like it\'s given up.'],
    'workHazardSoon=blight ^1': ['I don\'t like the look of the barley. There\'s blight going about, they say.'],
    'workHazard=flood ^1': ['The river\'s over the low meadows. Anything sown down there is gone.'],
    'workHazardSoon=flood ^1': ['The river\'s high and brown. If it rises any more, the low rows go under.'],
    'workHazard=frost ^1': ['Hard frost. Nothing grows, but the hens are cold and so am I.'],
    'workHazardSoon=frost ^1': ['The air bites. A hard frost\'s coming. I\'ve the hens to see to.'],
    gloomy: ['I knew it. I said so in spring. Nobody listened.'],
    ornery: ['Of course it is. And nobody\'ll help till it\'s too late.'],
    cheerful: ['A bit! But we\'ve had worse. We always come through.'],
    shy: ['...I\'m worried. I don\'t say so. But I am.'],
  });
  W('work.farmer.trial.fix', {
    _: ['Keep the ground clean and the rows weeded. A strong field takes a blow.', 'Weed it now, while you can. Weak plants go first.'],
    'workHazard=drought': ['Water from the river, not the well. A bucket to every row.'],
    'workHazardSoon=drought': ['Fetch water before it comes. Fill every trough and bucket.'],
    'workHazard=blight': ['Weed round the sick field and ask the herbalist for a wash.'],
  });
  W('work.farmer.badly', {
    _: ['Then it\'s a lean winter, and folk look at me like I did it.', 'Then we go short. The Store goes bare and we all tighten our belts.'],
    gloomy: ['Then it\'s the worst year in living memory and they\'ll write songs about it.'],
    ornery: ['Then the Steward puts us on lean rations and I get the blame.'],
    shy: ['...I don\'t like to think about it.'],
    proud: ['It won\'t. Not on my ground.'],
    curious: ['I\'ve been working that out. We\'d have enough till midwinter. Then less.'],
    'workFoodHerbalist workHazard=blight': ['Then I hope {workFoodHerbalist} has herbs enough for a wash. Blight\'s cured with herbs, they say.'],
  });
  W('work.farmer.plan', {
    _: ['Right. I\'ll start now. Thank you, wizard.', 'That\'s sense. I\'ll get to it straight away.'],
    cheerful: ['Yes! A plan! I feel better already. Off I go.'],
    curious: ['That\'s exactly what I was half thinking. Good. I\'ll do it.'],
    shy: ['...Thank you. I didn\'t know where to start.'],
    gloomy: ['It might be enough. ...It might.'],
    witty: ['A plan. I haven\'t had one of those since spring.'],
  });
  W('work.farmer.weather', {
    _: ['...True. We always do. Thank you.', 'The valley\'s stubborn. So\'s the barley. So am I.'],
    gloomy: ['Worse? ...Yes. I suppose we have.'],
    ornery: ['Hmph. Come through, aye. Not without a fuss.'],
    cheerful: ['We have! And we\'ll have a party after. We always do.'],
    shy: ['...I\'ll hold onto that.'],
  });
  W('work.farmer.secret', {
    _: ['...I\'ll tell you. Every sowing, I bury a penny in the corner of each field. For luck. My family always has.', '...A penny, in each corner, at sowing. Don\'t laugh. It\'s never failed.'],
    cheerful: ['Oh, I\'ll tell you! A penny in every corner of every field! The land likes a present.'],
    ornery: ['...If you laugh I\'ll set the crows on you. A penny, buried in each corner, at sowing. There.'],
    shy: ['...Pennies. I bury one in every corner. I\'ve never told anyone. It sounds daft out loud.'],
    curious: ['I bury a penny at each corner. I know it can\'t work. I\'ve never dared stop to find out.'],
    dreamy: ['A penny in every corner. Paying the land for what it gives. It seems only fair.'],
    witty: ['I pay the field rent. A penny a corner, buried at sowing. Cheapest landlord in the Shire.'],
    proud: ['It\'s an old way. A penny in each corner at sowing. My family\'s barley has never failed.'],
    gloomy: ['A penny in every corner. The one year I forgot was the year of the hail.'],
    'workFamilyTrade ^1': ['{WorkParentName} buried a penny in every field corner. So do I. So will whoever comes after.'],
  });
  W('work.farmer.safe', {
    _: ['I know you won\'t. That\'s why I told you.', 'Thank you. The land likes a secret kept.'],
    shy: ['...Thank you.'],
    ornery: ['See you don\'t.'],
    cheerful: ['I knew it! Here, have an egg. Fresh this morning.'],
    gloomy: ['...Good. It\'s all that holds the luck in.'],
  });
  W('work.farmer.spade', {
    _: ['Ha! You\'d dig for a week. I\'ve buried a lot of pennies.', 'Ha! The crows would get there first.'],
    witty: ['Go on. Then the luck\'s yours, and so\'s the blight.'],
    ornery: ['You\'d not dare. ...Ha. You might.'],
    cheerful: ['Ha! Bring a bag. There must be a fortune by now.'],
  });

  // --- The miller ----------------------------------------------------------------------
  addThread({
    id: 'work.miller', label: 'How does the old mill work?', about: 'work', weight: 1, cool: 4, reveals: 'work.miller',
    when: (F) => F.job === 'miller' && F.stage !== 'child', rel: () => 1.3,
    open: { ask: 'work.miller.open' },
    beats: {
      start: { line: 'work.miller.start', go: [
        { ap: 'ask', say: 'Is the river kind to the wheel?', to: 'river' },
        { ap: 'jest', say: 'Do you ever stop sneezing?', to: 'sneeze' },
        { ap: 'ask', say: 'Where does all the barley come from?', to: 'barley' },
      ] },
      river: { line: 'work.miller.river', go: [
        { ap: 'listen', say: '*You stand by the race and listen to the wheel.*', label: 'Listen to the wheel', to: 'song' },
        { ap: 'advise', say: 'Bag what\'s ground while the wheel\'s slow. Use the quiet.', to: [{ to: 'bristle', need: bristly }, 'bag'] },
        { ap: 'comfort', say: 'Rivers have moods. It\'s not your doing.', to: 'eased' },
      ] },
      song: { line: 'work.miller.song', go: [
        { ap: 'listen', say: '*You wait. There\'s a knock in the rhythm, now and then.*', label: 'Wait, and listen closer', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'ask', say: 'And the stones themselves? How do they work?', to: 'stones' },
        { ap: 'warm', say: 'It\'s a good sound to fall asleep to.', to: 'sleep' },
      ] },
      sneeze: { line: 'work.miller.sneeze', go: [
        { ap: 'jest', say: 'I took you for a ghost, the first time I saw you.', to: 'ghost' },
        { ap: 'ask', say: 'Is it the flour, then? Every bit of it?', to: 'stones' },
      ] },
      ghost: { line: 'work.miller.ghost', fx: { joke: { k: 'work.miller.ghost', t: 'The wizard took {name} for the ghost of the mill.' }, fond: 0.02 }, end: true },
      stones: { line: 'work.miller.stones', go: [
        { ap: 'ask', say: 'Who taught you to dress the stones?', to: 'taught' },
        { ap: 'share', say: 'Wizards have stones too. Mine mostly sit in my pocket.', to: 'pocket' },
        { ap: 'listen', say: '*You run a thumb along the furrows in the stone.*', label: 'Run a thumb along the stone', to: 'secret', need: { open: 2 }, soft: true },
      ] },
      barley: { line: 'work.miller.barley', go: [
        { ap: 'ask', say: 'And is there enough of it?', to: 'enough' },
        { ap: 'warm', say: 'Then you\'re the middle of everything. Field to loaf.', to: 'middle' },
      ] },
      enough: { line: 'work.miller.enough', go: [
        { ap: 'advise', say: 'Grind steady and bag as you go. Don\'t let it pile.', to: [{ to: 'bristle', need: bristly }, 'bag'] },
        { ap: 'comfort', say: 'You grind what comes. That\'s all a miller can.', to: 'eased' },
      ] },
      taught: { line: 'work.miller.taught', go: [
        { ap: 'warm', say: 'Then the old mill\'s in good hands.', to: 'middle' },
        { ap: 'ask', say: 'And has the mill any secrets of its own?', to: 'secret', need: { open: 2 }, soft: true },
      ] },
      secret: { line: 'work.miller.secret', fx: { confide: { k: 'work.miller.tom', t: '{Name} never mends the knock in the mill, which they call Old Tom, because it means the wheel is happy', secret: true }, trust: 0.02 }, go: [
        { ap: 'warm', say: 'Then Old Tom\'s safe with me.', to: 'safe' },
        { ap: 'jest', say: 'Does Old Tom take sugar in his tea?', to: 'tea' },
      ] },
      bag: { line: 'work.miller.bag', fx: { respect: 0.03, queue: 'miller_bag', feel: 'good_tip', feelX: 'the wizard' }, end: true },
      bristle: { line: 'work.miller.bristle', fx: { respect: -0.02 }, end: true },
      eased: { line: 'work.miller.eased', fx: { trust: 0.02 }, end: true },
      sleep: { line: 'work.miller.sleep', fx: { fond: 0.02 }, end: true },
      pocket: { line: 'work.miller.pocket', fx: { fond: 0.02 }, end: true },
      middle: { line: 'work.miller.middle', fx: { fond: 0.02, feel: 'cheered', feelX: 'the wizard' }, end: true },
      safe: { line: 'work.miller.safe', fx: { trust: 0.04 }, end: true },
      tea: { line: 'work.miller.tea', fx: { fond: 0.02, joke: { k: 'work.miller.tom', t: 'Old Tom, the knock in the mill, takes two sugars.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  W('work.miller.open', {
    _: ['How does the old mill work, {name}? I\'ve always wondered.', 'Tell me about the mill, {name}. The wheel and all.', 'What\'s it like inside the mill, {name}?'],
    'hour=night|evening': ['Is the wheel still turning at this hour, {name}?'],
  });
  W('work.miller.start', {
    _: ['River turns the wheel, wheel turns the stones, stones turn barley into flour. And I sneeze.', 'It\'s older than anyone. The wheel creaks, the stones rumble, and the flour comes.'],
    cheerful: ['It\'s wonderful! Water comes in, the wheel goes round, and out comes flour like snow!', 'Like a big old friend that hums all day. I love it.'],
    ornery: ['It works when it wants to. Today it doesn\'t want to.', 'Slowly, noisily, and with me running about after it.'],
    shy: ['...It mostly works on its own. I just listen to it. And bag the flour.'],
    curious: ['Gearing! A big wheel turning a little one, so the stones go fast. I\'ve drawn it out, if you like.', 'The water\'s the strength, the gears are the cleverness. I love the gears.'],
    dreamy: ['It\'s the river doing the work. I just catch what it gives. I like to think of it that way.'],
    witty: ['The river does the work, the mill takes the credit, and I take the flour up my nose.'],
    proud: ['It works because I keep it working. Stones dressed, wheel greased, gears true.'],
    gloomy: ['It grinds. Day in, day out. Like everything. Like me.'],
    'workLevel=new': ['I\'m still learning its noises. Every creak, I jump.'],
    'workLevel=master': ['I can hear if the flour\'s fine just by the sound the stones make.'],
    'season=summer': ['In summer the river\'s low and the wheel goes lazy. Like me after lunch.'],
    'season=autumn': ['Harvest barley by the cartload. The stones haven\'t rested in a week.'],
    'season=winter': ['Ice on the wheel some mornings. I go out with a kettle of hot water and a prayer.'],
    'season=spring': ['Spring water\'s strong. The wheel fair races. Hold on to your hat.'],
    'workGlut ^1': ['Flour everywhere! Sacks to the rafters. The Bakehouse can\'t keep up.'],
    'workShort ^1': ['Flour\'s short. The bakers come knocking and I\'ve nothing to give them.'],
    rift: ['Kinetic energy, all analogue. No chips, no code. It\'s the most honest machine I ever met.'],
  });
  W('work.miller.river', {
    _: ['Mostly. In spring it\'s too strong, in summer too weak, and in winter it freezes. Autumn\'s nice.', 'The river\'s a fickle partner. I do the courting.'],
    cheerful: ['Most days! We\'re old friends, the river and I. It sings to the wheel.'],
    ornery: ['Kind? It\'s never kind. It\'s low when I need it and high when I don\'t.'],
    shy: ['...I talk to it sometimes. It doesn\'t answer. It\'s polite like that.'],
    curious: ['I\'ve marked the race wall. The water\'s a hand lower than last summer.'],
    dreamy: ['It comes all the way from the hills just to turn my wheel. That seems kind to me.'],
    witty: ['It\'s like a lodger. Never pays rent, always makes a noise.'],
    proud: ['As kind as it\'s let be. I keep the race clear. Other millers let it silt.'],
    gloomy: ['One day it\'ll run dry, or flood, and that\'ll be the mill done.'],
    'workHazard=drought ^2': ['Dry spell. The wheel\'s barely turning. I grind by the handful.'],
    'workHazard=flood ^2': ['Kind? It\'s in the mill! Up to the second step. I\'ve moved the sacks up.'],
    'workHazard=frost ^2': ['Frozen at the edges. I break the ice every morning with a mallet.'],
  });
  W('work.miller.song', {
    _: ['Hear it? Creak, splash, rumble. Creak, splash, rumble. I hear it in my sleep.', 'That\'s the sound of bread being born. Slowly.'],
    cheerful: ['It\'s a happy sound, isn\'t it? I hum along.'],
    ornery: ['Hear that? That creak? That\'s been there a month. Nobody believes me.'],
    shy: ['...I like it. It means I don\'t have to talk.'],
    curious: ['Every turn, the same sounds. If one\'s different, something\'s wrong. I listen for that.'],
    dreamy: ['It\'s like a heartbeat. The mill\'s heart. I listen to it at night.'],
    witty: ['It\'s been singing the same song for a hundred years. It\'s not a very good song.'],
    proud: ['Hear how steady it is? That\'s a well-kept mill.'],
    gloomy: ['One day it\'ll stop. Like everything.'],
  });
  W('work.miller.sneeze', {
    _: ['Never. Flour gets in everything. I sneeze in my sleep. I sneeze at weddings.', 'I sneezed at my own wedding. Twice. During the vows.'],
    cheerful: ['Ha! Never! I\'m famous for it. Folk say bless you before I\'ve even started.'],
    ornery: ['No. And folk keep saying bless you. It\'s worse.'],
    shy: ['...I try to sneeze quietly. It doesn\'t work.'],
    curious: ['Barley flour\'s worse than wheat. I\'ve tested it. On myself.'],
    dreamy: ['The flour hangs in the light like snow. Then it goes up your nose.'],
    witty: ['I\'ve sneezed so much I\'ve got my own echo.'],
    proud: ['A miller who doesn\'t sneeze isn\'t milling.'],
    gloomy: ['No. I\'ll sneeze my last breath, I expect.'],
    'spouse': ['{Spouse} says I\'m the only hobbit who sneezes flour.'],
  });
  W('work.miller.ghost', {
    _: ['Ha! I get that a lot. White head to foot. Children run.', 'A ghost! Ha! The ghost of the mill. I like that.'],
    cheerful: ['Ha! I\'ll start wailing. Woooo. Bless you.'],
    witty: ['I am the ghost of the mill. I haunt the bread.'],
    ornery: ['Hmph. Better a floury ghost than a lazy one.'],
    shy: ['*laughs, and a little cloud of flour comes off their sleeve*'],
    gloomy: ['A ghost. That\'s how I feel, some days.'],
    proud: ['A very hard-working ghost, then.'],
  });
  W('work.miller.stones', {
    _: ['Two stones, one turning on the other. Furrows cut in them, so the flour runs out. I dress them every month.', 'The furrows wear down. You cut them again by hand, with a pick. Hours of it.'],
    cheerful: ['They\'re lovely! Big round fellows. I give them a pat.'],
    ornery: ['They wear down, and I recut them, and they wear down. Forever.'],
    shy: ['...Dressing the stones is my favourite job. Just me and a pick, and quiet.'],
    curious: ['The pattern of furrows matters. I\'ve tried three. The old one\'s best. I don\'t know why yet.'],
    dreamy: ['The furrows go out like the rays of the sun. Whoever cut the first one knew that.'],
    witty: ['They\'re the hardest-working couple in the valley. One on top, one underneath, forever.'],
    proud: ['My stones grind finer than any in the Shire. It\'s all in the dressing.'],
    gloomy: ['Stone grinding stone. That\'s a life.'],
  });
  W('work.miller.barley', {
    _: ['From the fields, cart by cart. I grind what the farmers bring.', 'From the Common Store. The farmers fill it, I empty it, the bakers fill it again.'],
    'workFoodFarmer': ['{WorkFoodFarmer} brings most of it. Muddy boots, good barley.', 'From {workFoodFarmer}\'s fields, mostly. Best barley in the valley, though I\'d not tell {workFoodFarmer}.'],
    ornery: ['From farmers who never bring it when they say they will.'],
    cheerful: ['From the fields! All gold and dusty. I love a full barley cart.'],
    curious: ['I can tell which field by the grain. The river fields are plumper.'],
    gloomy: ['From wherever it can be got. There\'s never quite enough.'],
  });
  W('work.miller.enough', {
    _: ['Some weeks yes, some weeks no. It comes in waves.', 'Enough to keep the stones busy. Not always enough to keep the bakers quiet.'],
    'workShort ^1': ['Not enough flour, no. The bakers have been round twice today.'],
    'workGlut ^1': ['Too much! Sacks to the rafters. I\'ve nowhere to sit.'],
    ornery: ['There\'s never enough. And then there\'s too much. Never just right.'],
    curious: ['Forty sacks in the Store. I count them every morning. Forty-one, yesterday.'],
    gloomy: ['Enough for now. Not for winter. Never for winter.'],
    proud: ['There\'s always flour when I\'m at the stones.'],
  });
  W('work.miller.taught', {
    _: ['The old miller. Deaf as a post from the noise, but he could read the stones like a book.', 'I learned by doing it wrong, mostly. Stones are patient.'],
    'workFamilyTrade ^1': ['{WorkParentName}. The mill\'s been in the family since the wheel was new.'],
    'workMaster ^2': ['{WorkMaster} is teaching me. Every stone, every gear. My hands ache.'],
    cheerful: ['The mill taught me! It squeaks when you get it wrong.'],
    ornery: ['Nobody. Everyone else was too busy talking.'],
    shy: ['...I watched the old miller for a whole summer before I dared ask.'],
    curious: ['I took a gear apart when I was small. I got a hiding. I also got a trade.'],
    proud: ['I taught myself, and then I taught the stones.'],
    gloomy: ['Hard knocks. Literally. The beam\'s very low.'],
  });
  W('work.miller.secret', {
    _: ['...Hear that knock? Every ninth turn. I call it Old Tom. I\'ve never mended it. When Old Tom knocks, the wheel\'s happy.', '...There\'s a knock. Old Tom. I could fix it. I never will. The day it stops, I\'ll worry.'],
    cheerful: ['That\'s Old Tom! The knock! He\'s been knocking since I was little. He means all\'s well.'],
    ornery: ['...If you tell anyone they\'ll want it mended. Old Tom stays. He knows more than they do.'],
    shy: ['...I talk to the knock. Old Tom. He\'s good company. Don\'t tell anyone.'],
    curious: ['There\'s a knock every ninth turn. A loose cog, probably. But when it stops, the flour comes coarse. Every time.'],
    dreamy: ['That knock is Old Tom. I think he\'s the mill\'s way of saying it\'s listening.'],
    witty: ['That\'s Old Tom. He knocks. He\'s been knocking for a hundred years. Nobody\'s ever let him in.'],
    proud: ['Old Tom, the knock. A lesser miller would mend it. I know better.'],
    gloomy: ['Old Tom. The knock. When he stops, that\'s the mill gone. I listen for it every hour.'],
  });
  W('work.miller.bag', {
    _: ['Use the quiet. Yes. I usually just sit and fret. I\'ll bag.', 'Good sense. I\'ll get the sacks out now.'],
    cheerful: ['Ooh, yes! Bag it up while the wheel dawdles. Clever wizard.'],
    curious: ['And then the stones run cleaner. Yes, that\'s right. I\'ll do it.'],
    shy: ['...I will. Thank you.'],
    gloomy: ['Might as well. It\'s that or fret.'],
    witty: ['The wheel can dawdle. I\'ll bustle. We\'ll average out.'],
  });
  W('work.miller.bristle', {
    _: ['I know how to run a mill, thank you, wizard.', 'Tell the river how to run, why don\'t you.'],
    proud: ['I was bagging flour while you were learning to light a pipe.'],
    ornery: ['Oh, and you\'ll carry the sacks, will you?'],
  });
  W('work.miller.eased', {
    _: ['Moods. Yes. Like anyone. I\'ll wait it out.', 'That\'s true. It\'s nobody\'s doing. Thank you.'],
    gloomy: ['...I suppose it isn\'t.'],
    shy: ['...Thank you.'],
    ornery: ['I know it\'s not. Tell the bakers.'],
    cheerful: ['Ha! You\'re right. Tomorrow it\'ll be roaring.'],
  });
  W('work.miller.sleep', {
    _: ['It is. I can\'t sleep anywhere else. It\'s too quiet.', 'I\'ve slept in the mill more nights than my own bed.'],
    cheerful: ['The best! I nod off on the sacks sometimes.'],
    dreamy: ['I dream of it turning, all night long.'],
    'witty spouse': ['The wheel snores worse than {spouse}, mind.'],
    witty: ['Better than a lullaby. Cheaper than a nursemaid.'],
    gloomy: ['When I sleep at all. Which isn\'t often.'],
  });
  W('work.miller.pocket', {
    _: ['Ha! Lazy stones. Mine work for a living.', 'Pocket stones! What do they grind?'],
    curious: ['What kind of stones? Magic ones? Can they grind?'],
    witty: ['Then your stones and mine should never meet. Mine would be jealous.'],
    ornery: ['Hmph. Typical wizard. Even the stones don\'t work.'],
    cheerful: ['Ha! Bring them by. They can watch mine work.'],
  });
  W('work.miller.middle', {
    _: ['The middle of everything. I never thought of it like that. Field to loaf.', '...Huh. The middle. I like that.'],
    cheerful: ['Oh! I am, aren\'t I! The middle of everything!'],
    ornery: ['The middle. Where everyone blames you from both ends.'],
    shy: ['...That\'s a nice thing to think.'],
    proud: ['Without the mill there\'s no bread. Folk forget that.'],
    gloomy: ['The middle. Squeezed from both sides. Yes.'],
  });
  W('work.miller.safe', {
    _: ['Good. Old Tom doesn\'t like a fuss.', 'Thank you. Some things are best not mended.'],
    shy: ['...Thank you.'],
    witty: ['Old Tom thanks you. Knock knock.'],
    dreamy: ['He\'ll knock a little louder for you, I think.'],
  });
  W('work.miller.tea', {
    _: ['Ha! Two sugars. And a biscuit, if he\'s been good.', 'Ha! He takes it how he likes. Loudly.'],
    witty: ['Two sugars and no milk. He\'s very particular.'],
    cheerful: ['Ha! I\'ll make him one. He\'d like that.'],
    ornery: ['Hmph. ...Two. Don\'t tell.'],
  });

  // --- The herder ----------------------------------------------------------------------
  addThread({
    id: 'work.herder', label: 'How are the beasts, truly?', about: 'work', weight: 1, cool: 4, reveals: 'work.herder',
    when: (F) => F.job === 'herder' && F.stage !== 'child', rel: () => 1.3,
    open: { ask: 'work.herder.open' },
    beats: {
      start: { line: 'work.herder.start', go: [
        { ap: 'ask', say: 'Do they each have a name?', to: 'names' },
        { ap: 'jest', say: 'Have you ever counted the sheep and got yourself?', to: 'count' },
        { ap: 'listen', say: '*You lean on the pen gate beside them.*', label: 'Lean on the gate beside them', to: 'gate' },
      ] },
      names: { line: 'work.herder.names', go: [
        { ap: 'ask', say: 'And have you a favourite?', to: 'fav' },
        { ap: 'jest', say: 'Do they know their names, or just yours?', to: 'know' },
      ] },
      count: { line: 'work.herder.count', go: [
        { ap: 'ask', say: 'What\'s the hardest part of it?', to: 'hard' },
        { ap: 'jest', say: 'I\'d give up and call them all Woolly.', to: 'woolly' },
      ] },
      gate: { line: 'work.herder.gate', go: [
        { ap: 'ask', say: 'Have you a favourite?', to: 'fav' },
        { ap: 'ask', say: 'What\'s the best of the work?', to: 'best' },
        { ap: 'warm', say: 'They\'re lucky in their keeper.', to: 'lucky' },
      ] },
      fav: { line: 'work.herder.fav', go: [
        { ap: 'listen', say: '*You wait. There\'s more to this one, you think.*', label: 'Wait for the rest', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'Every herd needs a favourite.', to: 'lucky' },
        { ap: 'jest', say: 'Does she know she\'s the favourite?', to: 'know' },
      ] },
      hard: { line: 'work.herder.hard', go: [
        { ap: 'advise', say: 'Lay fresh bedding before the rain, not after.', to: [{ to: 'bristle', need: bristly }, 'bedding'] },
        { ap: 'comfort', say: 'Hard work for gentle ends. That\'s the best kind.', to: 'eased' },
        { ap: 'ask', say: 'And the best part?', to: 'best' },
      ] },
      best: { line: 'work.herder.best', go: [
        { ap: 'ask', say: 'Have you a favourite among them?', to: 'fav' },
        { ap: 'warm', say: 'The whole valley\'s warmer for your wool.', to: 'lucky' },
      ] },
      secret: { line: 'work.herder.secret', fx: { confide: { k: 'work.herder.ewe', t: '{Name} brings an old ewe into the hole on cold winter nights, by the fire', secret: true }, trust: 0.02 }, go: [
        { ap: 'warm', say: 'That\'s the kindest thing I\'ve heard all week.', to: 'kind' },
        { ap: 'jest', say: 'Does she get a pillow?', to: 'pillow' },
      ] },
      know: { line: 'work.herder.know', fx: { fond: 0.02 }, end: true },
      woolly: { line: 'work.herder.woolly', fx: { fond: 0.02, joke: { k: 'work.herder.woolly', t: 'The wizard would call every sheep Woolly.' } }, end: true },
      bedding: { line: 'work.herder.bedding', fx: { respect: 0.03, queue: 'herder_bedding', feel: 'good_tip', feelX: 'the wizard' }, end: true },
      bristle: { line: 'work.herder.bristle', fx: { respect: -0.02 }, end: true },
      eased: { line: 'work.herder.eased', fx: { trust: 0.02 }, end: true },
      lucky: { line: 'work.herder.lucky', fx: { fond: 0.02, feel: 'cheered', feelX: 'the wizard' }, end: true },
      kind: { line: 'work.herder.kind', fx: { trust: 0.04 }, end: true },
      pillow: { line: 'work.herder.pillow', fx: { fond: 0.02, joke: { k: 'work.herder.pillow', t: 'The old ewe by the fire has her own cushion.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  W('work.herder.open', {
    _: ['How are the beasts, {name}? Truly?', 'Tell me about your animals, {name}.', 'How are the sheep and the cows and the rest, {name}?'],
    'season=spring': ['Lambing time, {name}? Have you slept at all?'],
    'season=summer': ['Shearing time, {name}? You\'ve wool on your collar.'],
  });
  W('work.herder.start', {
    _: ['The cows are content, the pigs are muddy, and the sheep are plotting something.', 'Milked, fed, watered. They\'re well. Better than me, some days.', 'They\'re grand. A bit of a cough in one ewe. I\'m watching her.'],
    cheerful: ['Oh, they\'re lovely! The calf\'s found her legs at last. She bounces.', 'Happy as anything! The pigs found a puddle. Joy unbounded.'],
    ornery: ['The ram\'s in a mood and the pigs got out again. Twice.', 'Same as ever. Hungry, muddy and ungrateful.'],
    shy: ['...They\'re well. I like them better than most folk. Sorry.'],
    curious: ['The cows give more milk when I sing. I\'ve tested it for a fortnight. It\'s true.', 'The sheep always go round the pen the same way. Sunwise. I\'ve no idea why.'],
    dreamy: ['They\'re peaceful. You stand among them and the day goes slow and warm.'],
    witty: ['The sheep are well, the cows are well, and the pigs have opinions.'],
    proud: ['Best-kept beasts in the Shire. Look at that fleece. Look at it.'],
    gloomy: ['One\'s off her food. One\'s always off her food. That\'s herding.'],
    'season=spring': ['Lambing! I\'ve not slept in my own bed in a week. Lambs everywhere. Bouncing.', 'Lambs, calves and piglets. Spring\'s a nursery and I\'m the nanny.'],
    'season=summer': ['Shearing! The sheep are furious and I\'m covered in fluff to the eyebrows.', 'Summer grass, full pails. The cheese is coming on beautifully.'],
    'season=autumn': ['Fattening for winter. They eat, I watch them eat. It\'s restful.'],
    'season=winter': ['Hay and water and more hay. And the trough freezing every morning.'],
    'weather=rain': ['Wet sheep smell like wet sheep. That\'s all I\'ll say.'],
    'workLevel=new': ['I\'m still learning which end bites. Both, mostly.'],
    'stage=elder': ['I\'ve known their great-great-grandmothers. Good stock, all of it.'],
    rift: ['They\'re analogue in every possible way. I love them. They don\'t need charging.'],
  });
  W('work.herder.names', {
    _: ['Every one. Buttercup, Daisy, Old Grizzle, Clover, and the ram is Mr Pudding.', 'Of course! You can\'t milk a cow you haven\'t been introduced to.'],
    cheerful: ['Yes! Buttercup and Bluebell and Biscuit and Mr Pudding the ram! He\'s a love. He\'s not.'],
    ornery: ['They\'ve names. They don\'t answer to them. Like some folk I know.'],
    shy: ['...I named them all. I say their names when I count them. Quietly.'],
    curious: ['Yes, and I keep a book of who\'s whose mother. Six generations, nearly.'],
    dreamy: ['Flower names for the cows, weather names for the sheep. The lamb this spring is Drizzle.'],
    witty: ['The cows have names. The sheep have numbers. The pigs have nicknames I won\'t repeat.'],
    proud: ['Every one, and their dams and grand-dams. Proper breeding, that.'],
    gloomy: ['I name them. Then I have to say goodbye. It\'s easier not to. I name them anyway.'],
  });
  W('work.herder.know', {
    _: ['Oh, they know. Buttercup pushes to the front of the queue.', 'Ha! They know mine. They shout it at milking time.'],
    cheerful: ['They know! The calf does a little dance at the gate when I call her.'],
    witty: ['They know their names when there\'s a bucket involved.'],
    ornery: ['They know when there\'s food. That\'s all they know.'],
    shy: ['...I think so. They come when I call.'],
    gloomy: ['They don\'t know anything. That\'s the blessing of it.'],
  });
  W('work.herder.count', {
    _: ['Twice! Once I got seven and a hobbit. That was me.', 'Ha! I count them twice a day and get a different answer every time.'],
    cheerful: ['Ha! Once! I counted myself and was ever so pleased there was an extra.'],
    ornery: ['They won\'t stand still to be counted. It\'s deliberate.'],
    shy: ['...Once. I didn\'t tell anyone.'],
    curious: ['I count them in pairs now. Fewer mistakes. I worked that out after the hobbit incident.'],
    dreamy: ['Counting sheep sends me to sleep. That\'s a problem in my trade.'],
    witty: ['I counted them once and got eleven. We have nine. I\'ve never solved it.'],
    proud: ['Never. I know my flock to the last ear.'],
    gloomy: ['I always come out one short. Then she turns up behind the hedge.'],
  });
  W('work.herder.woolly', {
    _: ['Ha! They\'d mutiny. Every one of them\'s an individual.', 'Woolly! They\'d never forgive you.'],
    witty: ['And all the cows Moo, I suppose. You\'d make a terrible herder.'],
    cheerful: ['Ha! Woolly One, Woolly Two! They\'d hate it!'],
    ornery: ['That\'s exactly the sort of thing a wizard would do.'],
    shy: ['*laughs* ...Poor things.'],
  });
  W('work.herder.gate', {
    _: ['*leans on the gate too* This is the best of it. Just watching them be.', 'They forget you\'re there, after a while. Then you see who they really are.'],
    cheerful: ['Look at the calf! Look at her! She thinks she\'s a lamb.'],
    ornery: ['That one\'s trouble. And that one. And that one\'s worse.'],
    shy: ['...I come here when I don\'t want to talk to anyone. I don\'t mind you, though.'],
    curious: ['See how they keep the youngsters in the middle? They do that every time a crow lands.'],
    dreamy: ['They chew so slowly. Like they\'re thinking about something very old.'],
    witty: ['The sheep are watching us watching them. It\'s a stand-off.'],
    proud: ['Look at the shine on them. That\'s good grazing and a good herder.'],
    gloomy: ['They don\'t worry about tomorrow. I envy them that.'],
  });
  W('work.herder.fav', {
    _: ['Old Grizzle. She\'s the oldest ewe. Half deaf, all wisdom. She leads them all.', 'Buttercup. Best cow in the valley. Gives cream like a fairy tale.'],
    cheerful: ['All of them! ...Clover. Clover\'s my favourite. Don\'t tell the others.'],
    ornery: ['The ram. Because he\'s as stubborn as me and we understand each other.'],
    shy: ['...Old Grizzle. She was the first lamb I ever helped deliver.'],
    curious: ['The cleverest pig. She opened the gate with her nose. Twice.'],
    dreamy: ['The little black lamb. She stands apart and looks at the hills. Like she\'s waiting for someone.'],
    witty: ['Whichever one\'s not chewing my coat at the time.'],
    proud: ['Buttercup. Won best in show at the fair. Twice. Well, I won it. She stood there.'],
    gloomy: ['Old Grizzle. She\'s very old. I don\'t like to think about it.'],
  });
  W('work.herder.hard', {
    _: ['Mucking out in the rain. There\'s no glory in it, just a shovel and a smell.', 'Lambing nights. Out in the cold at two in the morning, arm up a ewe. You\'d not believe it.'],
    cheerful: ['Mucking out! But you whistle and it\'s done. Mostly.'],
    ornery: ['The pigs. Escaping. Again. Always on a Highday.'],
    shy: ['...When one\'s poorly and there\'s nothing to do but sit with her.'],
    curious: ['Keeping the trough full. They drink twice as much as I\'d guess. I\'ve measured.'],
    dreamy: ['Saying goodbye. Every time.'],
    witty: ['The smell. Not theirs. Mine, after.'],
    proud: ['Nothing\'s hard if you\'re good at it.'],
    gloomy: ['All of it. Every bucket. Every day. Forever.'],
    'weather=rain ^1': ['Days like today. Wet bedding, wet sheep, wet me.'],
    'season=winter': ['The trough freezes and I break it with my heel every morning.'],
  });
  W('work.herder.best', {
    _: ['A full pail of milk on a cold morning. It steams. And then it\'s cheese.', 'Shearing day. The wool goes off for woollens and every scarf in the valley started on my sheep.'],
    cheerful: ['The lambs! Bouncing! Every spring, like the world\'s just been made.'],
    ornery: ['When they do as they\'re told. Once a week. I treasure it.'],
    shy: ['...They don\'t care what I say. They just like me.'],
    curious: ['Learning them. Every one\'s different. I\'ll never be done.'],
    dreamy: ['Dusk, bringing them in. The dust gold in the lane.'],
    witty: ['Cheese. The best of herding is cheese.'],
    proud: ['Knowing every fleece in the valley came off my sheep.'],
    gloomy: ['When they\'re all in and safe and I can stop worrying for a night.'],
  });
  W('work.herder.secret', {
    _: ['...On the cold nights I bring Old Grizzle in. By the fire. She\'s too old for frost. Don\'t tell anyone.', '...In winter, the old ewe sleeps in my hole. On the rug by the fire. Snores like a grandmother.'],
    cheerful: ['I\'ll tell you! On frosty nights Old Grizzle comes in by the fire! She loves it! The rug, less so.'],
    ornery: ['...If anyone finds out, I\'ll say she got in by herself. The old ewe sleeps by my fire in winter.'],
    shy: ['...She sleeps by my fire in winter. Old Grizzle. I couldn\'t leave her out. Please don\'t tell.'],
    curious: ['I bring the oldest ewe in on frost nights. She lives longer. I\'ve kept a note. Three winters now.'],
    dreamy: ['On cold nights Old Grizzle comes in by the fire. We sit. She watches the flames like she remembers something.'],
    witty: ['I have a lodger in winter. Four legs, wool, terrible manners. The old ewe. By the fire.'],
    proud: ['A good herder looks after the old ones. Mine sleeps by the fire in winter. Not that I tell folk.'],
    gloomy: ['She\'s old. Every winter might be her last. So she sleeps by my fire. It\'s the least I can do.'],
    'spouse': ['...The old ewe sleeps by the fire in winter. {Spouse} pretends not to know. {Spouse} gave her a blanket.'],
  });
  W('work.herder.bedding', {
    _: ['Before, not after. Yes. Dry straw, dry sheep. I\'ll do it now.', 'Fair. I always wait till they\'re wet. I\'ll lay it fresh.'],
    cheerful: ['Ooh, yes! A dry bed for everyone. Off I go!'],
    curious: ['That makes sense. Wet straw stays wet. I\'ll try it and see.'],
    shy: ['...I will. Thank you.'],
    gloomy: ['It\'ll rain the minute I\'ve done it. ...I\'ll do it.'],
    witty: ['A wizard who knows about straw. Will wonders never cease.'],
  });
  W('work.herder.bristle', {
    _: ['I\'ve been bedding beasts since before you came over the hill, wizard.', 'I know when to lay straw, thank you.'],
    proud: ['Tell the sheep how to grow wool, while you\'re at it.'],
    ornery: ['You lay it, then. There\'s a fork by the gate.'],
  });
  W('work.herder.eased', {
    _: ['Gentle ends. Cheese and wool. Yes. That\'s true.', 'I suppose it is. Thank you.'],
    gloomy: ['...I\'ll think of the cheese, then.'],
    shy: ['...Thank you.'],
    ornery: ['Hmph. Gentle. You\'ve not met the ram.'],
    cheerful: ['Oh, I like that! Hard work, gentle ends.'],
  });
  W('work.herder.lucky', {
    _: ['...Do you think so? Well. I try.', 'That\'s kind. They\'d say so, if they could. Well. They\'d say baa.'],
    cheerful: ['Oh, I\'m the lucky one! Look at them!'],
    ornery: ['They don\'t know it. But thank you.'],
    shy: ['*goes pink, and scratches a sheep behind the ear*'],
    proud: ['They are. I\'ll not argue.'],
    gloomy: ['...That\'s nice of you. They\'re lucky in that, at least.'],
  });
  W('work.herder.kind', {
    _: ['Is it? It\'s just what you do. She\'s old.', '...Thank you. I thought you might laugh.'],
    shy: ['...Thank you for not laughing.'],
    ornery: ['Kind. Hmph. Practical, that\'s all.'],
    gloomy: ['...She hasn\'t many winters left. It\'s the least I can do.'],
    proud: ['A herder looks after the herd. All of it.'],
  });
  W('work.herder.pillow', {
    _: ['Ha! She has a cushion. An embroidered one. It was my grandmother\'s.', 'Ha! She took mine. I sleep on the flat one now.'],
    witty: ['A pillow, a blanket, and her own cup. She\'s better kept than me.'],
    cheerful: ['Yes! A cushion! She looks so pleased on it!'],
    ornery: ['She has the good cushion. I have the lumpy one. That\'s herding.'],
  });

  // --- The brewer ----------------------------------------------------------------------
  addThread({
    id: 'work.brewer', label: 'What goes into a good ale?', about: 'work', weight: 1, cool: 4, reveals: 'work.brewer',
    when: (F) => F.job === 'brewer' && F.stage !== 'child', rel: (F) => (F.workAle === 'dry' ? 1.6 : 1.3),
    open: { ask: 'work.brewer.open' },
    beats: {
      start: { line: 'work.brewer.start', go: [
        { ap: 'ask', say: 'It must be quiet, with the taproom kept dry.', to: 'dry', need: { if: { workAle: 'dry' } } },
        { ap: 'ask', say: 'How do you malt the barley?', to: 'malt' },
        { ap: 'jest', say: 'Is the ale strong enough to strip paint?', to: 'strong' },
        { ap: 'ask', say: 'And who drinks the most of it?', to: 'drinkers' },
      ] },
      malt: { line: 'work.brewer.malt', go: [
        { ap: 'ask', say: 'And after the malt?', to: 'mash' },
        { ap: 'listen', say: '*You breathe in. The whole brewhouse smells of warm bread.*', label: 'Breathe in the smell of it', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'share', say: 'I had a potion once that smelled like that. It made me sing.', to: 'potion' },
      ] },
      mash: { line: 'work.brewer.mash', go: [
        { ap: 'advise', say: 'Mash a little cooler and longer. Patience in the paddle.', to: [{ to: 'bristle', need: bristly }, 'cooler'] },
        { ap: 'ask', say: 'What makes one batch better than another?', to: 'better' },
      ] },
      better: { line: 'work.brewer.better', go: [
        { ap: 'listen', say: '*You wait. There\'s something they\'re not saying.*', label: 'Wait for what they\'re not saying', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'A brewer who cares that much makes good ale.', to: 'cares' },
      ] },
      strong: { line: 'work.brewer.strong', go: [
        { ap: 'jest', say: 'Then I\'ll have a half. A very small half.', to: 'half' },
        { ap: 'ask', say: 'How do you make it, then? From the start.', to: 'malt' },
      ] },
      drinkers: { line: 'work.brewer.drinkers', go: [
        { ap: 'ask', say: 'Do you ever drink at the inn yourself?', to: 'own' },
        { ap: 'warm', say: 'Then half the singing in the valley\'s your doing.', to: 'cares' },
      ] },
      own: { line: 'work.brewer.own', go: [
        { ap: 'jest', say: 'I\'ll buy you one. You can tell me what\'s wrong with it.', to: 'buy' },
        { ap: 'ask', say: 'And what makes one batch better than another?', to: 'better' },
      ] },
      dry: { line: 'work.brewer.dry', go: [
        { ap: 'comfort', say: 'It won\'t last. The barrels will be wanted again.', to: 'eased' },
        { ap: 'advise', say: 'Brew anyway. Lay it down. It\'ll be better for the wait.', to: [{ to: 'bristle', need: bristly }, 'laydown'] },
        { ap: 'jest', say: 'A brewer with nothing to brew. Like a wizard with no hat.', to: 'nohat' },
      ] },
      secret: { line: 'work.brewer.secret', fx: { confide: { k: 'work.brewer.yeast', t: '{Name} has kept the same pot of yeast alive for sixty years, and feeds it every morning like a pet', secret: true }, trust: 0.02 }, go: [
        { ap: 'warm', say: 'Then give it my regards, every morning.', to: 'regards' },
        { ap: 'jest', say: 'Has it a name?', to: 'name' },
      ] },
      potion: { line: 'work.brewer.potion', fx: { fond: 0.02 }, end: true },
      cooler: { line: 'work.brewer.cooler', fx: { respect: 0.03, queue: 'brewer_mash', feel: 'good_tip', feelX: 'the wizard' }, end: true },
      bristle: { line: 'work.brewer.bristle', fx: { respect: -0.02 }, end: true },
      cares: { line: 'work.brewer.cares', fx: { fond: 0.02, feel: 'cheered', feelX: 'the wizard' }, end: true },
      half: { line: 'work.brewer.half', fx: { fond: 0.02, joke: { k: 'work.brewer.half', t: 'The wizard will only risk a very small half of {name}\'s ale.' } }, end: true },
      buy: { line: 'work.brewer.buy', fx: { fond: 0.02, owe: -1 }, end: true },
      eased: { line: 'work.brewer.eased', fx: { trust: 0.02 }, end: true },
      laydown: { line: 'work.brewer.laydown', fx: { respect: 0.03, queue: 'brewer_malt' }, end: true },
      nohat: { line: 'work.brewer.nohat', fx: { fond: 0.01 }, end: true },
      regards: { line: 'work.brewer.regards', fx: { trust: 0.03 }, end: true },
      name: { line: 'work.brewer.name', fx: { fond: 0.02, joke: { k: 'work.brewer.yeast', t: '{Name}\'s sixty-year-old yeast has a name, and it\'s Auntie.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  W('work.brewer.open', {
    _: ['What goes into a good ale, {name}?', 'Tell me about the brewing, {name}. From the barley up.', 'How does barley become ale, {name}? I\'ve always taken it on trust.'],
    'season=autumn': ['New barley in, {name}. Is it a malting week?'],
    'hour=evening|night': ['Is that one of your barrels they\'re singing over at the inn, {name}?'],
  });
  W('work.brewer.start', {
    _: ['Barley, water, time and a clean vat. And a nose. The nose matters most.', 'Malt it, mash it, boil it, cool it, and let the yeast do the rest. The yeast does most of it.'],
    cheerful: ['Oh, it\'s the happiest trade! You\'re making next week\'s singing.', 'Barley and patience and a jolly good stir!'],
    ornery: ['Clean vats. That\'s it. Everyone thinks it\'s magic. It\'s scrubbing.', 'Care, which nobody notices till it\'s not there and the ale\'s gone sour.'],
    shy: ['...Mostly waiting. I like the waiting. Nobody bothers you in a brewhouse.'],
    curious: ['Heat, mostly. A little warmer in the mash and it\'s sweeter. I\'m trying to pin down how much.', 'I\'ve been malting longer. Darker ale. Folk are suspicious, but they drink it.'],
    dreamy: ['It\'s barley remembering the summer. That\'s what ale is. A summer you can drink in winter.'],
    witty: ['Barley, water, yeast, and a great deal of tasting. For quality.'],
    proud: ['Skill. Any fool can make ale. Good ale takes a brewer.', 'My ale\'s the reason folk walk to {workInn} in the rain.'],
    gloomy: ['Hope, mostly. You do everything right and a third of it goes sour anyway.'],
    'workLevel=new': ['I\'m learning. The last batch was fizzy. Very fizzy. Ceiling-high fizzy.'],
    'workLevel=master': ['I can tell how a batch will turn out from the smell of the mash. Every time, now.'],
    'season=summer': ['Keeping the casks cool is half the battle in summer. I\'ve got them in the cellar under wet sacks.'],
    'season=winter': ['Winter ale. Darker, stronger, for long nights by the fire.'],
    'workGlut': ['There\'s barrels to the rafters. The Store\'s swimming.'],
    'workShort': ['There\'s barely a barrel spare. The inn\'s drinking faster than I can brew.'],
    'workAle=flowing': ['The Steward says let it flow, so it flows. I\'ve never brewed so much in my life.'],
    rift: ['It\'s chemistry, but slower and friendlier. Back home they synthesised it. Tasted like a battery.'],
  });
  W('work.brewer.malt', {
    _: ['You wet the barley till it sprouts, then dry it in the kiln before it gets ideas. That\'s malt.', 'Soak, sprout, kiln. The sprouting turns it sweet. The kiln stops it there.'],
    cheerful: ['You trick the barley into thinking it\'s spring! Then you toast it. Poor barley. Lovely ale.'],
    ornery: ['You wet it, you turn it, you turn it again, and it\'s still not right.'],
    shy: ['...You spread it on the floor and turn it with a wooden shovel. Very quietly. It\'s peaceful.'],
    curious: ['The sprouting turns starch to sugar. I don\'t know how. I\'d dearly love to know how.'],
    dreamy: ['The barley wakes up, thinking it\'s spring. And then I put it to sleep in the warm.'],
    witty: ['You let it sprout, then toast it before it can complain.'],
    proud: ['My malting floor\'s the best kept in the Shire. Not a mouldy grain.'],
    gloomy: ['You turn it every few hours for days. Night and day. You don\'t sleep much in malting week.'],
    'season=autumn': ['This week, in fact! New barley. The smell of the kiln\'s like the inside of a loaf.'],
  });
  W('work.brewer.mash', {
    _: ['Then the mash. Malt and hot water in the vat, and you stir with the paddle till your arms are rope.', 'Mashing. Hot water, malt, stirring. Too hot and it\'s thin. Too cool and it\'s stuck.'],
    cheerful: ['Mashing! Big wooden paddle, round and round! Like stirring the world\'s biggest porridge!'],
    ornery: ['Mashing, which takes hours, and everyone wants me at the same time.'],
    shy: ['...You stir and stir. I count, under my breath. Hundreds.'],
    curious: ['The mash is where it\'s decided. Heat and time. I\'ve kept notes on fifty batches.'],
    dreamy: ['Steam everywhere. Like being in a cloud that smells of bread.'],
    witty: ['The mash. Where barley goes in a vat and comes out a promise.'],
    proud: ['The mash is where a brewer shows what they are. Mine\'s always right.'],
    gloomy: ['The mash. Where it all goes wrong, mostly.'],
  });
  W('work.brewer.better', {
    _: ['Clean vats, the right heat, and a good yeast. The yeast\'s everything.', 'Care. Every step. Skip one and the ale knows.'],
    cheerful: ['Love! And a clean paddle. Mostly the paddle.'],
    ornery: ['Not being interrupted. That\'s what makes a better batch.'],
    shy: ['...The yeast, I think. It\'s very particular.'],
    curious: ['I think it\'s the yeast. Some batches I\'ve used yeast from the old pot, and they\'re always better.'],
    dreamy: ['The weather, a bit. Ale brewed in a thunderstorm is wild.'],
    witty: ['Whether I\'m in a good mood. The ale can tell.'],
    proud: ['Me. Next question.'],
    gloomy: ['Luck. Mostly luck.'],
  });
  W('work.brewer.strong', {
    _: ['The winter brew? It stripped the varnish off a table at the Badger. Folk still talk about it.', 'Ha! There was a batch once. Nobody remembers that Highday. Nobody.'],
    cheerful: ['Ha! Only the Yule ale! One mug and you\'re singing. Two and you\'re dancing. Three, you\'re asleep.'],
    ornery: ['It\'s as strong as it ought to be. Folk who can\'t take it can have water.'],
    shy: ['...Once. By accident. I\'m still sorry about the table.'],
    curious: ['I made one strong batch to see how strong it could go. It was too strong. Lesson learned.'],
    dreamy: ['The strong one tastes of autumn bonfires. It makes you see things.'],
    witty: ['Only on special occasions. Like Mersdays.'],
    proud: ['Strong and smooth. That\'s the trick. Anyone can make it strong.'],
    gloomy: ['Strong enough. Not strong enough to make you forget. I\'ve tried.'],
  });
  W('work.brewer.half', {
    _: ['Ha! A very small half. I\'ll pour you a thimble.', 'A wise wizard. A thimbleful for the wise wizard.'],
    cheerful: ['Ha! I\'ll find you a little mug! A wizard-sized one. Small.'],
    witty: ['A half? You\'d still need a lie-down.'],
    ornery: ['Hmph. Lightweight.'],
    shy: ['*laughs* I\'ll water it for you.'],
  });
  W('work.brewer.drinkers', {
    _: ['Everybody at the inn, of an evening. And the Harvest Fair takes about a third of the year\'s brew.', 'The regulars at {workInn}. Some of them have their own stool.'],
    'workFoodInnkeeper': ['{WorkFoodInnkeeper} takes it by the barrel. Says the regulars drink it faster than it settles.'],
    cheerful: ['Everyone! Sing-song night especially. I love to see them.'],
    ornery: ['Folk who never say thank you, and the ones who complain it\'s too cold. Or warm.'],
    shy: ['...I don\'t go to see. I\'d rather not know if they don\'t like it.'],
    curious: ['I\'ve counted. Sing-song nights, three times a usual evening.'],
    witty: ['The ones who say they\'re only stopping for one.'],
    proud: ['Everyone who knows good ale.'],
    gloomy: ['All of them. And then they want more.'],
  });
  W('work.brewer.own', {
    _: ['Now and then. I sit in the corner and watch faces as they drink. Then I know.', 'Not often. A brewer drinking at the inn is like a cook eating out.'],
    cheerful: ['Every sing-song night! I can\'t keep away!'],
    ornery: ['When I want a bit of peace. I never get it.'],
    shy: ['...At the back. I listen to what they say about it.'],
    curious: ['Yes. To compare batches. I keep notes on the backs of beer mats.'],
    witty: ['Only for professional reasons. Repeatedly.'],
    proud: ['I like to see my ale enjoyed. I have the corner seat.'],
    gloomy: ['Sometimes. Alone, mostly.'],
  });
  W('work.brewer.buy', {
    _: ['Ha! Done. I\'ll tell you everything wrong with it. It\'ll take a while.', 'You\'re on. Bring a notebook.'],
    witty: ['Then you\'ll be buying all night.'],
    cheerful: ['Ooh, yes! We\'ll make an evening of it.'],
    ornery: ['Hmph. I\'ll hold you to that.'],
    shy: ['...All right. A quiet one.'],
  });
  W('work.brewer.dry', {
    _: ['Quiet? It\'s a tomb. The Steward\'s kept the taproom dry and I\'m brewing for nobody.', 'The barrels are full and nobody\'s allowed them. Do you know what that does to a brewer?'],
    cheerful: ['It is a bit. But the barrels are resting! They\'ll be lovely when it\'s over.'],
    ornery: ['Dry! In this valley! I\'ve half a mind to drink it all myself.'],
    shy: ['...I don\'t mind the quiet. I mind that nobody\'s enjoying it.'],
    curious: ['It\'s interesting, actually. The ale\'s aging. I\'ll find out what a long cask does.'],
    dreamy: ['The brewhouse just smells of waiting now.'],
    witty: ['Dry taproom, wet brewer. I\'m crying into the mash.'],
    proud: ['A Steward\'s order. I\'ll obey it. But it\'s a waste of good ale.'],
    gloomy: ['Nobody needs me. The barrels sit. I sit.'],
  });
  W('work.brewer.eased', {
    _: ['It won\'t, will it? They\'ll come round. Folk can\'t do without a pint for long.', 'I suppose so. Thank you.'],
    gloomy: ['...I hope you\'re right.'],
    ornery: ['It had better not.'],
    cheerful: ['You\'re right! And when it ends, what a night that\'ll be.'],
    shy: ['...Thank you.'],
  });
  W('work.brewer.laydown', {
    _: ['Lay it down. Better for the wait. ...You know, I think it would be.', 'Brew for later. A dry spell\'s a good time to start a long ale. Right. I\'ll malt.'],
    cheerful: ['Ooh! A reserve! I\'ll start malting now!'],
    curious: ['A long-aged ale. I\'ve always wanted to try. Now\'s the chance.'],
    shy: ['...Yes. I\'ll do that.'],
    dreamy: ['An ale that remembers the dry spell. Yes.'],
  });
  W('work.brewer.nohat', {
    _: ['Ha! Exactly that. A wizard with no hat.', 'Ha! Then lend me yours.'],
    witty: ['A wizard with no hat is just a tall man with opinions.'],
    ornery: ['Hmph. Your hat\'s safe. My trade isn\'t.'],
    gloomy: ['Ha. ...Yes. Exactly like that.'],
    cheerful: ['Ha! I\'d look lovely in a pointy hat.'],
  });
  W('work.brewer.cooler', {
    _: ['Cooler and longer... It\'s worth a try. I\'ll start the next mash that way.', 'Patience in the paddle. I like that. I\'ll try it.'],
    cheerful: ['Oh, I\'ll try it now! Long and slow!'],
    curious: ['Cooler gives a thinner wort, but longer would make up for it. Yes. Yes, that could work.'],
    shy: ['...I will. Thank you.'],
    gloomy: ['It\'ll probably go sour. ...I\'ll try it.'],
    witty: ['Patience. My one weakness. Well, one of them.'],
  });
  W('work.brewer.bristle', {
    _: ['I know how to mash, thank you, wizard.', 'Brewing advice from a man who drinks tea.'],
    proud: ['My mash is as it should be. It always has been.'],
    ornery: ['Stir it yourself, then.'],
  });
  W('work.brewer.cares', {
    _: ['...Half the singing. Ha. I\'ll take that.', 'That\'s nice to hear. They don\'t say so, much.'],
    cheerful: ['Oh, I love that! I make the singing!'],
    shy: ['*smiles at their boots*'],
    ornery: ['And half the headaches. Don\'t forget those.'],
    proud: ['I do care. More than most.'],
    gloomy: ['...Thank you. It\'s easy to forget that.'],
  });
  W('work.brewer.potion', {
    _: ['Ha! Well, ale\'s a sort of potion. It makes everyone sing.', 'A singing potion! I\'ve been making one for years. It\'s called ale.'],
    curious: ['What was in it? Could I brew it?'],
    witty: ['Mine makes everyone sing. Badly.'],
    ornery: ['Typical wizard. Brewing without a licence.'],
    cheerful: ['Ha! What did you sing?'],
  });
  W('work.brewer.secret', {
    _: ['...The yeast. I\'ve kept the same pot alive sixty years. I feed it every morning, flour and water, like a pet.', '...There\'s a crock in my larder. The yeast in it is older than me. I feed it every morning.'],
    cheerful: ['The yeast! The same pot for sixty years! I feed it every morning. It bubbles when it\'s happy!'],
    ornery: ['...My yeast. Sixty years in the same crock. Anyone touches it, they answer to me.'],
    shy: ['...I\'ve a crock of yeast. Very old. I feed it every morning. It\'s sort of my friend.'],
    curious: ['The old crock. The yeast\'s been alive sixty years. It changes with the seasons. I\'m studying it.'],
    dreamy: ['There\'s a crock of yeast that\'s been alive sixty years. Every batch I\'ve made has a bit of every batch before.'],
    witty: ['I keep a pet. In a crock. Sixty years old, eats flour, never complains. It\'s the yeast.'],
    proud: ['The yeast. Sixty years in my family\'s crock. That\'s why my ale is what it is.'],
    gloomy: ['The yeast. If it ever dies, I\'ll never brew the same again. I check it at night.'],
    'workFamilyTrade ^1': ['{WorkParentName}\'s yeast. Same crock, sixty years. I feed it every morning like {workParentName} did.'],
  });
  W('work.brewer.regards', {
    _: ['I will. It bubbles at kind words, I swear it.', '...Thank you. It\'ll be pleased.'],
    shy: ['...I will. Every morning.'],
    witty: ['It\'ll bubble with pride.'],
    ornery: ['Hmph. It doesn\'t need regards. It needs flour.'],
    dreamy: ['It\'ll make a gentler batch for you, I think.'],
  });
  W('work.brewer.name', {
    _: ['...Auntie. It\'s called Auntie. Don\'t laugh.', 'Ha! Auntie. Because it\'s old and it\'s always bubbling about something.'],
    witty: ['Auntie. She\'s old, she\'s sour and she makes everything better.'],
    shy: ['...Auntie. I\'ve never said it out loud.'],
    ornery: ['Auntie. And she\'s got better manners than you.'],
    cheerful: ['Auntie! Isn\'t that lovely?'],
  });

  // --- The innkeeper -------------------------------------------------------------------
  addThread({
    id: 'work.innkeeper', label: 'Who are the regulars at the inn?', about: 'work', weight: 1, cool: 4, reveals: 'work.innkeeper',
    when: (F) => F.job === 'innkeeper' && F.stage !== 'child', rel: () => 1.3,
    open: { ask: 'work.innkeeper.open' },
    beats: {
      start: { line: 'work.innkeeper.start', go: [
        { ap: 'ask', say: 'How does the taproom take the dry spell?', to: 'dry', need: { if: { workAle: 'dry' } } },
        { ap: 'ask', say: 'Who\'s your best regular?', to: 'regulars' },
        { ap: 'jest', say: 'What\'s actually in the stew?', to: 'stew' },
        { ap: 'listen', say: '*You take a stool at the end of the bar.*', label: 'Take a stool at the end of the bar', to: 'stool' },
      ] },
      regulars: { line: 'work.innkeeper.regulars', go: [
        { ap: 'ask', say: 'And who\'s the worst?', to: 'worst' },
        { ap: 'warm', say: 'They\'re lucky to have you.', to: 'lucky' },
        { ap: 'listen', say: '*You nod. There\'s more, you can tell.*', label: 'Nod, and wait', to: 'secret', need: { open: 2 }, soft: true },
      ] },
      stew: { line: 'work.innkeeper.stew', fx: { joke: { k: 'work.innkeeper.stew', t: 'The stew at the inn has never been finished, only topped up.' } }, go: [
        { ap: 'jest', say: 'So I\'ve been eating a stew older than the Steward.', to: 'older' },
        { ap: 'ask', say: 'And how do you keep up, with every table wanting something?', to: 'busy' },
      ] },
      stool: { line: 'work.innkeeper.stool', go: [
        { ap: 'ask', say: 'You must hear everything, behind that bar.', to: 'hear' },
        { ap: 'warm', say: 'It\'s the warmest room in the valley.', to: 'lucky' },
        { ap: 'ask', say: 'Who\'s your best regular?', to: 'regulars' },
      ] },
      hear: { line: 'work.innkeeper.hear', go: [
        { ap: 'listen', say: '*You lean closer.*', label: 'Lean closer', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'jest', say: 'Then I\'ll mind what I say in here.', to: 'mind' },
      ] },
      busy: { line: 'work.innkeeper.busy', go: [
        { ap: 'advise', say: 'Light the fire and sweep before they come. Be ready first.', to: [{ to: 'bristle', need: bristly }, 'ready'] },
        { ap: 'comfort', say: 'Nobody leaves your inn unhappy. That\'s the measure.', to: 'measure' },
      ] },
      worst: { line: 'work.innkeeper.worst', go: [
        { ap: 'comfort', say: 'Every inn has one. Yours is bearable.', to: 'measure' },
        { ap: 'jest', say: 'Shall I turn him into a newt? Just for an evening.', to: 'newt' },
      ] },
      dry: { line: 'work.innkeeper.dry', go: [
        { ap: 'advise', say: 'Make the stew the star. Folk will come for supper.', to: [{ to: 'bristle', need: bristly }, 'ready'] },
        { ap: 'comfort', say: 'It\'ll pass. And the first night back will be one to remember.', to: 'measure' },
      ] },
      secret: { line: 'work.innkeeper.secret', fx: { confide: { k: 'work.innkeeper.water', t: '{Name} quietly waters the ale for anyone on their fifth, so everyone gets home', secret: true }, trust: 0.02 }, go: [
        { ap: 'warm', say: 'That\'s kindness, not cheating. Your secret\'s safe.', to: 'safe' },
        { ap: 'jest', say: 'Have you ever watered mine?', to: 'mine' },
      ] },
      lucky: { line: 'work.innkeeper.lucky', fx: { fond: 0.02, feel: 'cheered', feelX: 'the wizard' }, end: true },
      older: { line: 'work.innkeeper.older', fx: { fond: 0.02 }, end: true },
      mind: { line: 'work.innkeeper.mind', fx: { fond: 0.01 }, end: true },
      ready: { line: 'work.innkeeper.ready', fx: { respect: 0.03, queue: 'innkeeper_sweep', feel: 'good_tip', feelX: 'the wizard' }, end: true },
      bristle: { line: 'work.innkeeper.bristle', fx: { respect: -0.02 }, end: true },
      measure: { line: 'work.innkeeper.measure', fx: { trust: 0.02 }, end: true },
      newt: { line: 'work.innkeeper.newt', fx: { fond: 0.02, joke: { k: 'work.innkeeper.newt', t: 'The wizard offered to turn the worst regular into a newt for an evening.' } }, end: true },
      safe: { line: 'work.innkeeper.safe', fx: { trust: 0.04 }, end: true },
      mine: { line: 'work.innkeeper.mine', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  W('work.innkeeper.open', {
    _: ['Who are the regulars at the inn, {name}?', 'Tell me about the taproom, {name}. Who sits where?', 'What\'s it like, keeping the inn, {name}?'],
    'hour=morning': ['Sweeping up after last night, {name}? What did they leave behind?'],
    'hour=evening|night': ['A full house tonight, {name}? Who\'s singing?'],
  });
  W('work.innkeeper.start', {
    _: ['The regulars? I could tell you their drinks before I could tell you their names.', 'Oh, every inn has its regulars. Ours have their own stools and their own opinions.', 'The same faces every night, in the same seats, saying the same things. I love them.'],
    cheerful: ['Oh, they\'re a lovely lot! Mostly. Well. Lovely after the second pint.', 'The best folk in the valley come through that door. And some of the others.'],
    ornery: ['Regulars. They come in, sit in my way and tell me how to pour.', 'They\'d live here if I let them. Some of them have tried.'],
    shy: ['...I know them all, but they don\'t know me. I\'m just the one who brings the stew.'],
    curious: ['I\'ve a theory about which stool you choose says who you are. The window ones are dreamers.', 'I keep a little book of everyone\'s usual. Sixty-one entries now.'],
    dreamy: ['Every evening\'s a little play. Same players. Different ending every time.'],
    witty: ['The regulars are like the furniture. Comfortable, a bit worn, and they creak when they sit down.'],
    proud: ['Folk walk from the far end of the valley to drink here. That\'s not the ale. That\'s me.'],
    gloomy: ['The same ones every night. Telling the same stories. One day I\'ll scream. Quietly.'],
    'hour=morning ^1': ['Morning\'s for sweeping up after them. There\'s always something under a table. Today, a boot.'],
    'hour=evening|night ^1': ['Full house tonight! I\'ve not sat down since the fire was lit.'],
    'workRestDay ^1': ['Highday! Everyone\'s off but me. Rest days are my busiest days.'],
    'workMarket ^1': ['Market day! Folk in from every lane, all thirsty, all at once.'],
    'workAle=flowing ^1': ['The Steward says let the ale flow, and flow it does. I\'m pulling pints in my sleep.'],
    'workLevel=new': ['I\'m still learning who drinks what. I gave the miller a cider. The silence.'],
    'workLevel=master': ['I\'ve kept this inn so long I can tell who\'s coming in by their step on the path.'],
    'season=winter': ['In winter they come early and stay late. The fire\'s the best in the valley.'],
    rift: ['Back in Neverdark the bars had screens. Here they have each other. It\'s louder. It\'s better.'],
  });
  W('work.innkeeper.regulars', {
    _: ['There\'s the one who sings the same song every night, the one who argues about marrows, and the one who just nods.', 'The corner stool\'s been the same backside for twenty years. I\'d not dare give it away.'],
    cheerful: ['The singer! Every night, the same song, and we all join the chorus. It\'s lovely. It\'s also very long.'],
    ornery: ['The one who tells me my stew\'s too salty and then has seconds. Every night.'],
    shy: ['...The quiet one by the window. Never says a word. Leaves a penny on the table. I like him.'],
    curious: ['The marrow debaters. Same argument for three years. I\'ve heard both sides so often I\'m on a third.'],
    dreamy: ['The old fellow who comes in, has one half, and looks at the fire. I think he\'s remembering someone.'],
    witty: ['The ones who say they\'re only stopping for one. My best customers.'],
    proud: ['Every regular here\'s a regular because I remember their usual and their troubles.'],
    gloomy: ['The ones who come because there\'s nowhere else to go. I know how they feel.'],
    'workFoodBrewer': ['{WorkFoodBrewer} sits in the corner and watches faces as they drink. Like a hawk. A thirsty hawk.'],
  });
  W('work.innkeeper.worst', {
    _: ['The one who sings after midnight. With his boots on the table.', 'The fellow who orders stew, eats half, and asks for it to be warmer. Every night.'],
    cheerful: ['Oh, nobody\'s the worst! ...The singer. The singer is the worst. I love him.'],
    ornery: ['All of them. In turn. On a rota.'],
    shy: ['...The loud ones. I don\'t know how to make them stop.'],
    curious: ['The one who takes the salt cellars apart to see how they work. He\'s never put one back together.'],
    witty: ['The one who leaves the biggest tip and the biggest mess. I can\'t decide how I feel.'],
    proud: ['Nobody\'s bad under my roof. I don\'t allow it.'],
    gloomy: ['The ones who tell me their troubles. All night. I\'ve my own, you know.'],
  });
  W('work.innkeeper.stew', {
    _: ['The stew? It\'s never been finished. Only topped up. Some of it\'s older than I am.', 'Whatever came in from the Store, and whatever was in it yesterday. It\'s been going for years.'],
    cheerful: ['Everything! Carrots and taters and fish and love! And yesterday\'s stew. And last year\'s.'],
    ornery: ['Vegetables. Meat. Mind your business.'],
    shy: ['...It\'s been on the range for years. I just add to it. I\'m frightened to let it go out.'],
    curious: ['I\'ve worked out it\'s been simmering since before I took the inn. Nobody\'s ever emptied it.'],
    dreamy: ['A little of every supper anyone\'s ever had here. It remembers them all.'],
    witty: ['It\'s called the Everlasting Stew. It\'s outlasted three innkeepers and a roof.'],
    proud: ['A stew that\'s never stopped, and never once gone bad. That\'s care.'],
    gloomy: ['The same stew, forever. Like everything here.'],
  });
  W('work.innkeeper.older', {
    _: ['Older than the Steward, the Store and possibly the river.', 'Ha! It\'s matured. Like good cheese. And like the Steward.'],
    cheerful: ['Ha! And you came back for more!'],
    witty: ['You have. And it\'s done you no harm. Except the hat. Was the hat always like that?'],
    ornery: ['And you\'ve never complained. So.'],
    shy: ['*laughs* ...I suppose you have.'],
    gloomy: ['Older than all of us. It\'ll outlive us too.'],
  });
  W('work.innkeeper.busy', {
    _: ['I don\'t, really. I run. Fire, sweep, cook, take the order, fetch it, bring it, clear it, wash it. And again.', 'Every table wants something different at the same time. I\'ve learned to smile and walk fast.'],
    cheerful: ['I run! It\'s a dance, really. A very sweaty dance.'],
    ornery: ['I don\'t. They wait. They complain. They wait some more.'],
    shy: ['...I try. Folk leave when I\'m slow. I hate that.'],
    curious: ['I\'ve worked out a round. Fire first, then the tables near the door. It saves steps.'],
    dreamy: ['I lose myself in it, sometimes. Plates and mugs and voices, round and round.'],
    witty: ['I\'ve grown an extra pair of arms. You can\'t see them. They\'re very quick.'],
    proud: ['Nobody waits long in my inn. Not long.'],
    gloomy: ['I don\'t. Something\'s always waiting. The washing up\'s waiting right now.'],
    'workShortHanded ^1': ['It\'s me alone, and the inn wants two. Folk get up and go before I\'ve reached them.'],
  });
  W('work.innkeeper.stool', {
    _: ['*sets a mug in front of you without asking* The usual for a wizard. Whatever that is.', 'That\'s the stool the storyteller likes. Mind the wobble.'],
    cheerful: ['Ah, a new regular! What\'ll it be? First one\'s on the house. The second\'s on the house too.'],
    ornery: ['That stool\'s taken. ...Not tonight it isn\'t. Sit.'],
    shy: ['...You can sit there. Nobody does. It\'s by the draught.'],
    curious: ['End of the bar! Interesting. That\'s a watcher\'s stool.'],
    dreamy: ['That\'s the best stool. You can see the whole room and the fire too.'],
    witty: ['Ah, the wizard\'s stool. It\'s the one with the burn mark. Was that you?'],
    proud: ['Best seat in the house, that. I\'ll pour you something worth the stool.'],
    gloomy: ['That\'s where the last fellow sat before he moved to Bree.'],
  });
  W('work.innkeeper.hear', {
    _: ['Everything. Who\'s courting, who\'s cross, who\'s thinking of moving to Bree. Folk tell the bar things.', 'More than I\'d like. A pint loosens the tongue, and the bar\'s a good listener.'],
    cheerful: ['Oh, all of it! Every bit of news in the valley comes through that door first.'],
    ornery: ['More than I want to. I could tell tales. I won\'t.'],
    shy: ['...Everything. They forget I\'m there. I don\'t repeat it.'],
    curious: ['I could draw a map of who\'s sweet on who. I won\'t. But I could.'],
    dreamy: ['Secrets, worries, hopes. An inn\'s full of them, like steam.'],
    witty: ['Everything worth knowing and a good deal that isn\'t.'],
    proud: ['Everything. And I keep it. That\'s why they tell me.'],
    gloomy: ['All the troubles in the valley. They leave them here with the empties.'],
  });
  W('work.innkeeper.mind', {
    _: ['Ha! Too late. I\'ve heard about the fireworks.', 'Ha! You do that. I\'ll be listening.'],
    witty: ['Mind away. I\'ll still hear what you don\'t say.'],
    cheerful: ['Ha! Say what you like! It\'s all safe here.'],
    ornery: ['Good.'],
  });
  W('work.innkeeper.secret', {
    _: ['...When someone\'s on their fifth, I water it. Just a bit. They never notice, and they get home on their own feet.', '...After the fifth pint, it\'s half water. Every time. Nobody\'s ever fallen in the river on my watch.'],
    cheerful: ['I\'ll tell you! After the fifth pint I water it! Nobody\'s ever noticed! Everyone gets home!'],
    ornery: ['...If you tell, I\'ll deny it. After five, they get half water. Saves me carrying them.'],
    shy: ['...I water the ale. Only after five. I worry about them walking home in the dark.'],
    curious: ['After five pints nobody can taste the difference. I\'ve tested it. On the regulars. With water.'],
    dreamy: ['After five, I water it. I like to think of them all getting home safe, every one.'],
    witty: ['The sixth pint is always the best, they say. It\'s half water. They\'re right, though.'],
    proud: ['A good innkeeper looks after them. After the fifth, they get water in it. Nobody\'s ever fallen in the river.'],
    gloomy: ['I water it, after the fifth. Someone once didn\'t get home. Not here. But I remember.'],
  });
  W('work.innkeeper.safe', {
    _: ['Thank you. I\'d not want them knowing. It\'d spoil it.', 'Kindness. Yes. I think of it like that.'],
    shy: ['...Thank you.'],
    ornery: ['See it stays that way.'],
    witty: ['Good. Have a pint. A whole one. Undiluted.'],
    cheerful: ['I knew you\'d understand! Another pint? A proper one?'],
  });
  W('work.innkeeper.mine', {
    _: ['Yours? You\'ve never had five. Wizards sip.', 'Ha! Only the once. You don\'t remember. That\'s the point.'],
    witty: ['I water yours from the start. Wizards are dangerous enough sober.'],
    cheerful: ['Ha! Never! ...Once.'],
    ornery: ['Do you want me to?'],
  });
  W('work.innkeeper.newt', {
    _: ['Ha! Just one evening. Then turn him back. I\'d miss the singing. A bit.', 'A newt! He\'d still sing. Newts can\'t, but he\'d find a way.'],
    witty: ['A newt would leave a smaller tip but a smaller mess. I\'ll think about it.'],
    cheerful: ['Ha! A singing newt! I\'d charge folk to see it.'],
    ornery: ['Don\'t tempt me.'],
  });
  W('work.innkeeper.ready', {
    _: ['Be ready first. Yes. Fire, sweep, tables set. I\'ll start now.', 'Half of serving is being ready. I like that. I\'ll sweep.'],
    cheerful: ['Ooh, yes! A clean inn and a hot fire! Off I go!'],
    curious: ['That would save the rush. Yes. I\'ll try it tonight.'],
    shy: ['...I will. Thank you.'],
    gloomy: ['They\'ll still all come at once. ...I\'ll sweep.'],
    witty: ['A plan. An actual plan. In an inn. Revolutionary.'],
  });
  W('work.innkeeper.bristle', {
    _: ['I\'ve kept this inn for years, wizard. I know how to open it.', 'Thank you, I\'ll run my own taproom.'],
    proud: ['I know my trade. Drink your pint.'],
    ornery: ['You sweep, then. The broom\'s behind the door.'],
  });
  W('work.innkeeper.measure', {
    _: ['That\'s the measure. Yes. Thank you.', '...True. Nobody\'s ever left unhappy. Tipsy, but happy.'],
    gloomy: ['...I suppose nobody does. I hadn\'t thought of that.'],
    shy: ['...Thank you.'],
    ornery: ['Nobody leaves unfed, anyway.'],
    cheerful: ['Oh, that\'s lovely! I\'ll remember that when I\'m washing up.'],
  });
  W('work.innkeeper.lucky', {
    _: ['...Do you think so? Well. They\'re lucky in the fire, anyway.', 'That\'s kind. They don\'t say it. But they come back.'],
    cheerful: ['I\'m the lucky one! Every night\'s a party!'],
    ornery: ['They don\'t know it.'],
    shy: ['*goes pink and polishes a mug that\'s already clean*'],
    proud: ['They are. I\'ll not argue.'],
    gloomy: ['...That\'s nice of you to say.'],
  });
  W('work.innkeeper.dry', {
    _: ['Badly. The Steward\'s kept the ale dry and the taproom\'s full of long faces and tea.', 'Folk come, look at the taps, sigh, and go home. It\'s like a wake every night.'],
    cheerful: ['Oh, we\'re making the best of it! Lots of tea! Some singing. Less singing.'],
    ornery: ['A dry inn! In the Shire! The regulars look at me like it\'s my doing.'],
    shy: ['...It\'s very quiet. I don\'t mind quiet. They do.'],
    curious: ['Interesting, actually. They talk more. Less singing, more talking.'],
    dreamy: ['The fire\'s the same. The faces are longer.'],
    witty: ['They\'ve started singing sad songs about ale. It\'s a whole new repertoire.'],
    proud: ['I keep the inn open. Dry or not, it\'s open.'],
    gloomy: ['It\'s like a funeral. Every night. For ale.'],
  });

  // --- The leaf-grower -----------------------------------------------------------------
  addThread({
    id: 'work.grower', label: 'How do you cure the pipe-weed?', about: 'work', weight: 1, cool: 4, reveals: 'work.grower',
    when: (F) => F.job === 'grower' && F.stage !== 'child', rel: () => 1.3,
    open: { ask: 'work.grower.open' },
    beats: {
      start: { line: 'work.grower.start', go: [
        { ap: 'ask', say: 'How do you cure it, once it\'s picked?', to: 'cure' },
        { ap: 'jest', say: 'Can a leaf-grower tell a leaf by sniffing?', to: 'sniff' },
        { ap: 'ask', say: 'What makes a good leaf year?', to: 'year' },
      ] },
      cure: { line: 'work.grower.cure', go: [
        { ap: 'ask', say: 'How long does it hang?', to: 'long' },
        { ap: 'listen', say: '*You stand in the shed, in the brown dusk of the hanging leaf.*', label: 'Stand among the hanging leaf', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'share', say: 'I blow smoke-rings. That\'s the end of your work I know.', to: 'rings' },
      ] },
      sniff: { line: 'work.grower.sniff', go: [
        { ap: 'jest', say: 'Then I\'ll test you. Blindfold. Three pouches.', to: 'test' },
        { ap: 'ask', say: 'And how do you cure it, to smell like that?', to: 'cure' },
      ] },
      year: { line: 'work.grower.year', go: [
        { ap: 'advise', say: 'Hoe between the rows and let the air through.', to: [{ to: 'bristle', need: bristly }, 'hoe'] },
        { ap: 'comfort', say: 'Even a thin year makes a good pipe.', to: 'eased' },
        { ap: 'ask', say: 'And once it\'s picked?', to: 'cure' },
      ] },
      long: { line: 'work.grower.long', go: [
        { ap: 'ask', say: 'And is there a blend of your own?', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'Patience like that is rare.', to: 'patience' },
      ] },
      secret: { line: 'work.grower.secret', fx: { confide: { k: 'work.grower.blend', t: '{Name} cures a little of the best leaf with dried apple peel, and calls it Old Thistledown Gold', secret: true }, trust: 0.02 }, go: [
        { ap: 'warm', say: 'I\'ll not breathe a word. Or a smoke-ring.', to: 'safe' },
        { ap: 'jest', say: 'I\'ll need a pouch. For tasting. Strictly.', to: 'pouch' },
      ] },
      rings: { line: 'work.grower.rings', fx: { fond: 0.02 }, end: true },
      test: { line: 'work.grower.test', fx: { fond: 0.02, joke: { k: 'work.grower.blindfold', t: 'The wizard wants to test {name}\'s nose blindfold with three pouches.' } }, end: true },
      hoe: { line: 'work.grower.hoe', fx: { respect: 0.03, queue: 'grower_hoe', feel: 'good_tip', feelX: 'the wizard' }, end: true },
      bristle: { line: 'work.grower.bristle', fx: { respect: -0.02 }, end: true },
      eased: { line: 'work.grower.eased', fx: { trust: 0.02 }, end: true },
      patience: { line: 'work.grower.patience', fx: { fond: 0.02 }, end: true },
      safe: { line: 'work.grower.safe', fx: { trust: 0.04 }, end: true },
      pouch: { line: 'work.grower.pouch', fx: { fond: 0.02, owe: -1, promise: { k: 'work.grower.pouch', t: '{Name} promised you a pouch of the special blend', days: 7 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  W('work.grower.open', {
    _: ['How do you cure the pipe-weed, {name}? It\'s a mystery to me.', 'Tell me about the leaf, {name}. From seed to pipe.', 'How\'s the leaf this year, {name}? Truly?'],
    'season=autumn': ['The drying shed must be full, {name}. How\'s the curing?'],
  });
  W('work.grower.start', {
    _: ['Pipe-weed\'s a fussy plant. Too much sun and it\'s harsh, too little and it\'s weak.', 'You grow it tall, pick the lower leaves first, and hang them to dry. The rest is waiting.'],
    cheerful: ['Oh, it\'s a lovely plant! Big soft leaves, smells like summer. Then like a fireside.', 'The best leaf in the valley! Everyone says so. Well, they say "pass the pouch", which is the same.'],
    ornery: ['Slugs. That\'s the leaf this year. Slugs and folk asking when it\'ll be ready.', 'Slow and fussy. Like most things worth having.'],
    shy: ['...It\'s quiet work. Just me and the rows. I like it.'],
    curious: ['The lower leaves cure sweeter than the top. I\'ve kept them apart this year to be sure.', 'I\'ve been drying some in the shade and some in the barn. Different smoke entirely.'],
    dreamy: ['Every pipe in the valley of an evening started in my rows. I think of that at dusk.'],
    witty: ['I grow it, I dry it, everyone else smokes it. I\'m the most generous hobbit in the valley.'],
    proud: ['My leaf\'s the best this side of the Southfarthing. Ask any pipe.'],
    gloomy: ['Leaf-spot again. It comes every year. Like the rain.'],
    'season=spring': ['Planting out the seedlings. Tiny things. Hard to believe they\'ll be taller than me.'],
    'season=summer': ['Hoeing the rows and picking the lower leaves. Slow work. Fragrant work.'],
    'season=autumn': ['The shed\'s full and the whole place smells like a pipe by the fire. Best time of year.'],
    'season=winter': ['Nothing to pick. I sort the cured leaf and count the days till spring.'],
    'workShort ^1': ['The Store\'s low on leaf and folk are getting tetchy. A valley without pipe-weed is a cross valley.'],
    'workLevel=new': ['I\'m new to it. My first batch smoked like a bonfire in a boot.'],
    'stage=elder': ['I\'ve grown leaf since my grandfather\'s day. It\'s never the same twice.'],
    rift: ['We had vapes back home. Neon ones. This is better. Slower. It makes you sit down.'],
  });
  W('work.grower.cure', {
    _: ['You hang the leaves on lines in the shed, stem up, not too close. Then you let the air do it.', 'Hang it to dry, slow, in the dark. It goes from green to gold to brown, the colour of an old penny.'],
    cheerful: ['You hang them up like washing! Hundreds of them! And then you wait, and it goes golden!'],
    ornery: ['Hang it, turn it, check it, and keep folk\'s fingers off it.'],
    shy: ['...It\'s the hanging I like. Rows and rows of it, in the dusk of the shed.'],
    curious: ['The slower it dries, the sweeter. I\'ve tried fast. Fast is harsh. Nobody knows why.'],
    dreamy: ['It\'s like the leaves are sleeping off the summer. They wake up brown and wise.'],
    witty: ['You hang it up and let it think about what it\'s done.'],
    proud: ['Properly. Not like some. Every leaf turned by hand.'],
    gloomy: ['You hang it and pray the damp doesn\'t get in. It usually does.'],
    'weather=rain': ['Somewhere dry. Which today is nowhere.'],
  });
  W('work.grower.sniff', {
    _: ['Every one. I can tell you which row, which week, and whether it rained.', 'Course I can. Blindfolded. Upside down. With a cold.'],
    cheerful: ['Ha! Yes! It\'s my party trick! Folk bring me their pouches to guess!'],
    ornery: ['I can tell you\'re smoking somebody else\'s, that\'s for sure.'],
    shy: ['...I can. I don\'t show off about it.'],
    curious: ['I can tell the field. I\'m working on telling the week.'],
    dreamy: ['Each leaf smells of the day it was picked. Sun, or rain, or wind.'],
    witty: ['I can tell a leaf by sniffing and a liar by their leaf.'],
    proud: ['Blindfold. Any leaf in the valley. I\'ve never missed.'],
    gloomy: ['I can. It\'s not much use. Nobody asks.'],
  });
  W('work.grower.test', {
    _: ['Ha! You\'re on. Bring your three pouches. I\'ll name the fields.', 'Done! And if I win, you light my pipe with a spell.'],
    cheerful: ['Ooh yes! Let\'s do it at the Badger! Everyone can watch!'],
    witty: ['Three pouches. And if one\'s yours, I\'ll tell everyone where it came from.'],
    ornery: ['Hmph. I\'ll win. You\'ll see.'],
    shy: ['...All right. Not in front of anyone, though.'],
  });
  W('work.grower.year', {
    _: ['Warm, not hot. Rain in spring, dry in autumn. And no slugs. There\'s never no slugs.', 'Sun on the leaves and a dry week at picking. That\'s all I ask. I rarely get it.'],
    cheerful: ['Every year\'s a good leaf year, if you love it enough! ...And sun. Sun helps.'],
    ornery: ['One with fewer folk asking if it\'s a good leaf year.'],
    shy: ['...A quiet one. No storms. Just slow sun.'],
    curious: ['I\'ve been keeping a weather book against the crop. Dry autumns win, every time.'],
    dreamy: ['The years with the most larks. I don\'t know why. They seem to go together.'],
    witty: ['One where the slugs move to Bree.'],
    proud: ['Any year, with me growing it.'],
    gloomy: ['There\'s no such thing. Something always goes wrong.'],
    'workHazard=drought ^1': ['Not this one. The ground\'s cracking. The leaves are curling up like old letters.'],
    'workHazard=flood ^1': ['Not this one. The low rows are under water.'],
  });
  W('work.grower.long', {
    _: ['A month for the colour. Then a season for the sweetness. The best leaf is a year old.', 'Weeks to dry. Months to mellow. Folk want it next Trewsday.'],
    cheerful: ['Ages! But it\'s worth every day. You\'ll see!'],
    ornery: ['As long as it takes. Not as long as folk want.'],
    shy: ['...I check it every morning. I don\'t hurry it.'],
    curious: ['Forty days for the best of it. I\'ve counted. Forty-one makes no difference. Thirty-nine does.'],
    dreamy: ['Until it smells like autumn evening. You just know.'],
    witty: ['Longer than you\'d think, and longer than anyone wants.'],
    proud: ['As long as it needs. I don\'t sell green leaf.'],
    gloomy: ['Forever. And then someone smokes it in five minutes.'],
  });
  W('work.grower.patience', {
    _: ['It\'s not patience. It\'s just knowing the leaf won\'t be rushed.', 'Ha! Ask my family how patient I am. Only with leaf.'],
    cheerful: ['Oh, I\'m not patient! The leaf is! I just wait with it.'],
    shy: ['...Thank you.'],
    ornery: ['It\'s not rare. Folk just don\'t bother.'],
    gloomy: ['Patience. That\'s one word for it.'],
  });
  W('work.grower.rings', {
    _: ['Ha! The best end of my work. I\'ve seen your rings. Very good. Showing off, but very good.', 'Ha! Then you know the best of it.'],
    cheerful: ['Ooh! Show me! Do a ship! I\'ve heard you do ships!'],
    witty: ['Then we\'re partners. I grow it, you show it off.'],
    ornery: ['Rings. That\'s all anyone does with it. Rings.'],
    curious: ['How do you get them so round? Is it the leaf? Is it magic?'],
    proud: ['They\'d be rounder with my leaf.'],
    shy: ['...I\'ve watched you do them. They\'re lovely.'],
  });
  W('work.grower.hoe', {
    _: ['Air between the rows. Yes. Spots like a crowd. I\'ll get the hoe.', 'Fair enough. I\'ve let them grow too close. I\'ll thin them.'],
    cheerful: ['Ooh, yes! A good hoeing! Off I go!'],
    curious: ['That\'s what I half thought. Damp sits where they crowd. I\'ll hoe and see.'],
    shy: ['...I will. Thank you.'],
    gloomy: ['It\'ll still get spots. ...But fewer. All right.'],
  });
  W('work.grower.bristle', {
    _: ['I know my rows, thank you, wizard.', 'I\'ve grown leaf since before you smoked it.'],
    proud: ['Teach me to grow leaf? Teach a fish to swim.'],
    ornery: ['Hoe it yourself, then.'],
  });
  W('work.grower.eased', {
    _: ['Even a thin year. Yes. It\'s still leaf.', 'True. A thin year\'s pipe is still a pipe.'],
    gloomy: ['...It\'s a thin comfort. But it\'s a comfort.'],
    ornery: ['A good pipe. Hmph. A middling pipe.'],
    cheerful: ['That\'s right! Every pipe\'s a good pipe!'],
    shy: ['...Thank you.'],
  });
  W('work.grower.secret', {
    _: ['...A little of the best leaf, I cure with dried apple peel. Old Thistledown Gold, I call it. I give it at Yule.', '...Apple peel, dried, cured in with the top leaves. Only a few pouches a year. Only for friends.'],
    cheerful: ['I\'ll tell you! Apple peel! Cured in with the best leaf! Old Thistledown Gold! Isn\'t that a lovely name?'],
    ornery: ['...If you tell anyone they\'ll all want some. Apple peel, cured in. Old Thistledown Gold. A few pouches.'],
    shy: ['...I make a special one. With apple peel. I\'ve never told anyone how. It\'s for friends.'],
    curious: ['Dried apple peel, cured in with the leaf. The sweetness gets in. It took me three years to get right.'],
    dreamy: ['The best leaf cures with apple peel. It smokes like an orchard in autumn. Old Thistledown Gold.'],
    witty: ['Apple peel. In the curing. Folk think I\'m a genius. I\'m a hobbit with too many apples.'],
    proud: ['My own blend. Old Thistledown Gold. The best leaf, cured with apple peel. Nobody else has it.'],
    gloomy: ['Apple peel, in the curing. When I\'m gone, nobody will know how. ...Well. You will.'],
  });
  W('work.grower.safe', {
    _: ['Ha! Not even a smoke-ring. Thank you.', 'Good. There\'s a pouch for you at Yule. Maybe.'],
    shy: ['...Thank you.'],
    witty: ['A smoke-ring could give it away. Very wise.'],
    ornery: ['See you don\'t.'],
  });
  W('work.grower.pouch', {
    _: ['Ha! For tasting. Strictly. I\'ll have one for you by the end of the week.', 'A pouch. Strictly for tasting. I\'ve heard that one before.'],
    witty: ['Strictly. I\'ll put that on the label.'],
    cheerful: ['Of course! A pouch for the wizard!'],
    ornery: ['Hmph. One pouch. A small one.'],
    shy: ['...I\'ll save you one.'],
  });

  // --- The orchard-keeper --------------------------------------------------------------
  addThread({
    id: 'work.orchardist', label: 'How are the bees and the blossom?', about: 'work', weight: 1, cool: 4, reveals: 'work.orchardist',
    when: (F) => F.job === 'orchardist' && F.stage !== 'child', rel: () => 1.3,
    open: { ask: 'work.orchardist.open' },
    beats: {
      start: { line: 'work.orchardist.start', go: [
        { ap: 'ask', say: 'Do you really tell the bees the news?', to: 'bees' },
        { ap: 'jest', say: 'Do you ever eat the windfalls?', to: 'windfall' },
        { ap: 'ask', say: 'How do you prune a tree?', to: 'prune' },
      ] },
      bees: { line: 'work.orchardist.bees', go: [
        { ap: 'ask', say: 'What did you tell them last?', to: 'told', need: { open: 2 }, soft: true },
        { ap: 'jest', say: 'Do they gossip?', to: 'gossip' },
        { ap: 'warm', say: 'That\'s a lovely old custom.', to: 'custom' },
      ] },
      windfall: { line: 'work.orchardist.windfall', go: [
        { ap: 'jest', say: 'And the wasps get the rest, I suppose.', to: 'wasps' },
        { ap: 'ask', say: 'Where do all the apples go?', to: 'go' },
      ] },
      prune: { line: 'work.orchardist.prune', go: [
        { ap: 'advise', say: 'Prune the old wood now, before the sap rises.', to: [{ to: 'bristle', need: bristly }, 'pruning'] },
        { ap: 'ask', say: 'Who taught you to read a tree?', to: 'taught' },
      ] },
      go: { line: 'work.orchardist.go', go: [
        { ap: 'warm', say: 'Then every pie in the valley is half yours.', to: 'pie' },
        { ap: 'ask', say: 'And the bees? Do you tell them the news?', to: 'bees' },
      ] },
      taught: { line: 'work.orchardist.taught', go: [
        { ap: 'ask', say: 'And did they teach you to talk to the bees?', to: 'bees' },
        { ap: 'warm', say: 'Then the trees are in good hands.', to: 'hands' },
      ] },
      told: { line: 'work.orchardist.told', fx: { confide: { k: 'work.orchardist.bees', t: '{Name} tells the bees what they can\'t tell anyone else', secret: true }, trust: 0.03 }, go: [
        { ap: 'warm', say: 'Then you can tell me too, any time.', to: 'tellme' },
        { ap: 'listen', say: '*You say nothing, and listen to the hum.*', label: 'Listen to the hum with them', to: 'hum' },
      ] },
      gossip: { line: 'work.orchardist.gossip', fx: { fond: 0.02, joke: { k: 'work.orchardist.gossip', t: 'The bees know everything, and tell it to the blossom.' } }, end: true },
      custom: { line: 'work.orchardist.custom', fx: { fond: 0.02 }, end: true },
      wasps: { line: 'work.orchardist.wasps', fx: { fond: 0.01 }, end: true },
      pruning: { line: 'work.orchardist.pruning', fx: { respect: 0.03, queue: 'orchardist_prune', feel: 'good_tip', feelX: 'the wizard' }, end: true },
      bristle: { line: 'work.orchardist.bristle', fx: { respect: -0.02 }, end: true },
      hands: { line: 'work.orchardist.hands', fx: { fond: 0.02 }, end: true },
      pie: { line: 'work.orchardist.pie', fx: { fond: 0.02, feel: 'cheered', feelX: 'the wizard' }, end: true },
      tellme: { line: 'work.orchardist.tellme', fx: { trust: 0.04, feel: 'drawn_out' }, end: true },
      hum: { line: 'work.orchardist.hum', fx: { trust: 0.03, drive: { lonely: -0.08 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  W('work.orchardist.open', {
    _: ['How are the bees and the blossom, {name}?', 'Tell me about the orchard, {name}. The trees and all.', 'How are your trees this year, {name}?'],
    'season=spring': ['The orchard must be pink as a sunset, {name}. How\'s the blossom?'],
    'season=autumn': ['Apple time, {name}! How\'s the picking?'],
  });
  W('work.orchardist.start', {
    _: ['The trees are heavy and the bees are busy, and I\'m somewhere in the middle.', 'Pruning, picking, and talking to the hives. They like to hear the news.', 'The orchard\'s well. A few trees sulking. Trees sulk, you know.'],
    cheerful: ['Oh, lovely! The bees are humming and the apples are coming on and I\'ve only been stung twice!', 'Wonderful! I walked the rows this morning and every tree said hello.'],
    ornery: ['Wasps in the windfalls and a ladder with a loose rung. That\'s the orchard.', 'The bees are cross and the trees are slow. Same as me.'],
    shy: ['...It\'s peaceful. I go there when I want nobody. The bees don\'t count.'],
    curious: ['The trees by the hives bear heavier. I\'ve counted. Bees and blossom, there\'s something in it.', 'I grafted a branch from the old tree to a young one. It\'s taken! I\'m watching it like a hawk.'],
    dreamy: ['In the evening the orchard goes gold and the bees go home and it all smells of honey.'],
    witty: ['The trees are fine. The bees are fine. The apples are falling on me with great accuracy.'],
    proud: ['Best orchard in the valley. You\'ll have had a pie from it. You\'ll have wanted another.'],
    gloomy: ['The old tree in the corner\'s dying. Slowly. They all do in the end.'],
    'season=spring': ['Blossom! The whole orchard\'s pink. I pray every night for no frost.', 'The bees are mad for the blossom. You can hear the orchard from the lane.'],
    'season=summer': ['The apples are setting. Little hard green things. You\'d never guess they\'ll be pies.'],
    'season=autumn': ['Apples by the basket. My arms are longer than they were in summer.', 'Picking from dawn. Ladders and baskets and the smell of it. Best time.'],
    'season=winter': ['Bare trees and sleeping hives. I prune and listen to the hives hum through the wood.'],
    'workFoodHives>4': ['Bees in all {workFoodHives} hives, and I know every queen by her temper.', 'I keep {workFoodHives} hives now. Each one hums a different note, if you listen.'],
    'workGlut': ['More apples than the valley can eat. The bakers can\'t keep up.'],
    'workLevel=new': ['I\'m still learning which end of the bee to be careful of. Both, mostly.'],
    rift: ['The bees work like a network. Hive mind. Literally. I\'m a bit in love with them.'],
  });
  W('work.orchardist.bees', {
    _: ['Always. Births, weddings, deaths. If you don\'t tell the bees, they leave. My grandmother swore by it.', 'Every morning. I knock on the hive and tell them what\'s happened in the valley.'],
    cheerful: ['Yes! I tell them everything! They love a bit of news! They hum louder!'],
    ornery: ['I tell them. They don\'t listen. Like everyone else.'],
    shy: ['...I do. I find it easier than telling folk.'],
    curious: ['I do. I\'m not sure they understand. But the hives I tell do better. I\'ve kept a note.'],
    dreamy: ['Of course. They\'re part of the valley. They ought to know what goes on in it.'],
    witty: ['I do. They\'re the best-informed creatures in the valley. Better than the postie.'],
    proud: ['It\'s the old way. A proper orchard-keeper keeps the bees informed.'],
    gloomy: ['I told them about the last funeral. They went quiet for a week.'],
  });
  W('work.orchardist.told', {
    _: ['...Things I don\'t tell anyone else. That I\'m afraid of the ladders now, some days. That\'s what I told them.', '...I tell them what I can\'t say out loud. They keep it. Bees don\'t gossip. Whatever folk say.'],
    cheerful: ['...Oh. Well. That I\'m not always as cheerful as I look. They\'re the only ones who know.'],
    ornery: ['...That I\'m lonely, if you must know. There. The bees know. Now you do.'],
    shy: ['...Everything. Everything I can\'t say to folk. They don\'t mind. They just hum.'],
    curious: ['...That I wonder if I\'m any good. I tell them, and they hum, and I feel better. I can\'t explain it.'],
    dreamy: ['...Who I\'m sweet on. I told them first. Before I\'d told myself, nearly.'],
    witty: ['...The things I can\'t joke about. There aren\'t many. The bees have heard them all.'],
    proud: ['...That I\'m frightened of getting old and not managing the trees. I\'d not tell a soul. But the bees.'],
    gloomy: ['...That I miss someone. Every day. The bees are the only ones I say it to.'],
    'spouse': ['...That I worry about {spouse}. Silly things. The bees listen. They don\'t tell me not to worry.'],
  });
  W('work.orchardist.tellme', {
    _: ['...Thank you. I might. You\'re a bit like a bee, you know. In a good way.', '...That\'s kind. I\'ll remember it.'],
    shy: ['...Thank you. I don\'t know if I can. But thank you.'],
    ornery: ['Hmph. You hum less. ...Thank you.'],
    gloomy: ['...I might. That would be something.'],
    witty: ['You\'d need to hum. Can you hum?'],
  });
  W('work.orchardist.hum', {
    _: ['*stands with you, listening, and some of the weight goes out of their shoulders*', '...It\'s the best sound there is. Thank you for just listening.'],
    shy: ['*smiles, and doesn\'t say anything, and doesn\'t need to*'],
    dreamy: ['...Hear that? That\'s the whole summer, humming.'],
    gloomy: ['...That helps. More than talking does.'],
  });
  W('work.orchardist.gossip', {
    _: ['Ha! Terribly. They tell the blossom everything, and the blossom tells the wind.', 'Ha! They\'re worse than the regulars at the Badger.'],
    witty: ['They gossip, they sting, and they make honey. They\'d make wonderful aunts.'],
    cheerful: ['Ha! I\'m sure they do! The buzzing gets louder when I\'ve told them something juicy!'],
    ornery: ['They\'re discreet. Unlike some I could name.'],
    shy: ['*laughs* ...I hope not.'],
  });
  W('work.orchardist.custom', {
    _: ['It is. My grandmother\'s grandmother did it. The bees remember.', 'Old, and nobody does it but me now. I\'ll keep it going.'],
    shy: ['...I\'m glad you think so. Folk laugh, sometimes.'],
    proud: ['It\'s the proper way. I keep it.'],
    dreamy: ['The trees remember too. Everything in an orchard remembers.'],
    gloomy: ['When I\'m gone, nobody will tell them anything.'],
  });
  W('work.orchardist.windfall', {
    _: ['The good ones, yes. The rest go to the pigs and the wasps.', 'Ha! Every one with a bruise is mine. That\'s the orchard-keeper\'s due.'],
    cheerful: ['All the time! A windfall in the sun is the best apple there is!'],
    ornery: ['Somebody has to. The wasps can\'t eat them all, though they try.'],
    shy: ['...A few. I sit under the old tree and eat one. It\'s my lunch.'],
    curious: ['The windfalls tell you which trees are stressed. Then I eat them. Science.'],
    dreamy: ['Warm windfalls, under the trees, in the long grass. Yes.'],
    witty: ['I\'m very careful to eat the evidence.'],
    proud: ['My windfalls are better than most folk\'s picked apples.'],
    gloomy: ['The wasps get there first, mostly.'],
  });
  W('work.orchardist.wasps', {
    _: ['The wasps get drunk on them. Staggering about. Like the Badger at closing.', 'Ha! The wasps get the rest. And then they get me.'],
    witty: ['The wasps are a sort of tax.'],
    ornery: ['Wasps. Don\'t talk to me about wasps.'],
    cheerful: ['Ha! Poor drunk wasps. I feel for them.'],
  });
  W('work.orchardist.go', {
    _: ['To the Store, then the bakers. Pies, mostly. And jam, in autumn, when folk put by for winter.', 'Baskets to the Store. The bakers turn them into pies, and the rest go into jars for winter.'],
    'workFoodBaker': ['{WorkFoodBaker} takes most of them for pies. Comes round with a cart and a hungry look.'],
    cheerful: ['Into pies! And jam! And cider, if somebody\'s clever!'],
    ornery: ['Into folk who never say thank you for them.'],
    curious: ['I\'ve worked out about half go to pies. The rest I\'m still tracking.'],
    gloomy: ['Into the Store, and then they\'re gone. Like everything.'],
  });
  W('work.orchardist.pie', {
    _: ['Half mine! I like that. I\'ll tell the bakers.', 'Ha! The best half. The apple half.'],
    cheerful: ['Oh, that\'s lovely! I\'ll think of it every time I see a pie!'],
    ornery: ['Tell that to the bakers. They take all the credit.'],
    shy: ['*goes pink*'],
    proud: ['The best half, yes.'],
    gloomy: ['...That\'s a nice way to think of it.'],
  });
  W('work.orchardist.prune', {
    _: ['You take out the old wood and the crossing branches. Light and air. A tree wants to breathe.', 'Cut so a bird could fly through the middle. That\'s what my teacher said.'],
    cheerful: ['Snip snip! You give it a haircut! Trees love a haircut!'],
    ornery: ['Carefully. Not like the last orchard-keeper. Hacked them about like hedges.'],
    shy: ['...Slowly. I look at it for a long time first.'],
    curious: ['Old wood out, new wood in. I\'m trying different cuts on different trees. Notes.'],
    dreamy: ['You listen to it. The tree tells you where it wants the light.'],
    witty: ['With great care and a sharp pruning hook. In that order.'],
    proud: ['So a bird could fly through the middle. My trees are open as a cathedral.'],
    gloomy: ['You cut, and hope you didn\'t cut the wrong bit. You\'ll know in two years.'],
    'season=winter': ['In winter, while they sleep. They don\'t feel it then.'],
  });
  W('work.orchardist.taught', {
    _: ['The old orchard-keeper. Half deaf, wholly wise, and stung so often he didn\'t notice.', 'The trees did. They grow wrong when you cut wrong.'],
    'workFamilyTrade ^1': ['{WorkParentName}. Up a ladder before I could walk, nearly.'],
    'workMaster ^2': ['{WorkMaster}\'s teaching me now. Every tree\'s a lesson.'],
    cheerful: ['Everyone! And the bees! Mostly the bees!'],
    ornery: ['Nobody. I learned by watching others get it wrong.'],
    shy: ['...My grandmother. She talked to the trees. I thought it was daft. Now I do it.'],
    curious: ['Books, and trying. The trees forgave me, mostly.'],
    proud: ['I taught myself, better than I was taught.'],
    gloomy: ['Mistakes. There are a few trees that still haven\'t forgiven me.'],
  });
  W('work.orchardist.pruning', {
    _: ['Before the sap rises. Yes. I\'d left it. I\'ll get the hook.', 'Now, then. Thank you. The old wood\'s been bothering me.'],
    cheerful: ['Ooh, yes! A haircut for everyone!'],
    curious: ['Before the sap. That\'s what the old books say too. Right. I\'ll start.'],
    shy: ['...I will. Thank you.'],
    gloomy: ['It\'s late for it. ...But better late. I\'ll go.'],
  });
  W('work.orchardist.hands', {
    _: ['I hope so. They\'re older than me, most of them. I try to deserve them.', 'Good hands, scratched hands. Thank you.'],
    cheerful: ['The best hands! Well. Sticky hands. Honey, mostly.'],
    ornery: ['Better than the last pair, anyway.'],
    shy: ['*looks at their hands, scratched from the pruning, and smiles*'],
    proud: ['They are. I\'ll not pretend otherwise.'],
    gloomy: ['For now. Hands get old too.'],
    dreamy: ['The trees and I hold each other up, I think.'],
  });
  W('work.orchardist.bristle', {
    _: ['I know when to prune, thank you, wizard.', 'The trees and I have an understanding. You\'re not in it.'],
    proud: ['I\'ll prune when the trees tell me, not a wizard.'],
    ornery: ['Up the ladder yourself, then.'],
  });
});
