'use strict';
// ---------------------------------------------------------------------------
// Phrasing, part four: more ways to pass the time of day. A bet on the rain
// (a promise the weather settles), shapes in the clouds, the stars of an
// evening, what they had for breakfast, the wizard's hat, I spy with the
// children, peekaboo with the very small, telling fortunes, the signal for
// the rift-folk, and the weather, the oldest talk there is.
// ---------------------------------------------------------------------------

talkPack('phrasing_pass2', () => {
  const tm = (temper, ...text) => ({ if: { temper }, text });
  const kid = (...text) => ({ if: { stage: 'child' }, text });
  const rift = (...text) => ({ if: { rift: true }, text });
  const elder = (...text) => ({ if: { stage: 'elder' }, text });
  const at = (tier, cond, text) => ({ if: cond, pri: Math.round((tier - Object.keys(cond).length) * 100) / 100, text });
  const notTot = (F) => F.band !== 'toddler';

  const STARS = [
    'That bright one is the Wanderer\'s Lamp. A sailor lit it to find his way home, and never put it out.',
    'Those seven are the Sickle. Farmers say it reaps the summer and sows the frost.',
    'That red one is the Ember. It fell from a dragon\'s fire, they say, and stuck.',
    'See the little cluster? The Hen and Chicks. She counts them every night. One\'s always late.',
    'That one low over the hills is the Gatekeeper. It sets last, and locks up the sky behind it.',
    'That pale one is the Baker\'s Loaf. It rises a little later every night.',
  ];
  const SPY = [
    { l: 'B', a: 'beard', g: 'A bucket? A bird? A BEE?', h: 'It\'s on my chin. And it\'s gray.' },
    { l: 'H', a: 'hat', g: 'A hedge? A hen? A HOUSE?', h: 'Look up. Further up. Higher than that.' },
    { l: 'S', a: 'staff', g: 'A sock? A snail? The SKY?', h: 'I lean on it. I\'m leaning on it now.' },
    { l: 'C', a: 'cloud', g: 'A cat? A cart? A CAKE? Is it a cake?', h: 'It\'s up in the sky, and it\'s fluffy.' },
    { l: 'G', a: 'gate', g: 'Grass? A goose? Granddad?', h: 'You swing on it when nobody\'s looking.' },
    { l: 'N', a: 'nose', g: 'A nest? A nettle? NOTHING?', h: 'It\'s on your face. Right in the middle.' },
    { l: 'P', a: 'pipe', g: 'A pig? A pie? A PONY?', h: 'I smoke it of an evening. Puff, puff.' },
    { l: 'T', a: 'toes', g: 'A tree? A tart? A TROLL?', h: 'You\'ve got ten of them. Furry ones.' },
  ];
  addFacts((v, F, T) => {
    const roll = () => { const t = (bondFull(v).talks || 0), h = (s) => hash2(v.id * 89 + s + t * 17, Game.day); return { star: Math.floor(h(1) * STARS.length), spy: Math.floor(h(2) * SPY.length) }; };
    const D = T ? (T.phrPass2 || (T.phrPass2 = roll())) : roll();
    F.phrStarTale = STARS[D.star];
    const s = SPY[D.spy];
    F.phrSpyL = s.l; F.phrSpyA = s.a; F.phrSpyGuess = s.g; F.phrSpyHint = s.h;
    // the rain bet: won (it rained) or lost (it didn't) in the last few days
    const b = bondFull(v);
    const bet = (b.promises || []).find((p) => p.k === 'phr.rain' && p.state !== 'open' && Game.day - (p.settled || 0) <= 3);
    F.phrRainWon = !!(bet && bet.state === 'kept');
    F.phrRainLost = !!(bet && bet.state !== 'kept');
  });
  // a bet on the rain is won the moment it rains, and lapses if it doesn't by the day after
  addPromiseCheck('phr.rain', () => (Game.raining ? 'kept' : null));

  // greetings that remember the bet
  lines('greet', [
    at(6.9, { phrRainWon: true }, ['You were right about the rain, curse you. Here\'s your toffee.', 'It rained! You and your hat. I owe you a toffee.']),
    at(7.1, { phrRainWon: true, temper: 'ornery' }, ['Rained, didn\'t it. Don\'t say anything. Don\'t look smug.']),
    at(7.1, { phrRainWon: true, stage: 'child' }, ['It RAINED! You knew! How did you KNOW?']),
    at(6.9, { phrRainLost: true }, ['Not a drop! You owe me a toffee, weather-wizard.', 'Bone dry! So much for your hat.']),
    at(7.1, { phrRainLost: true, temper: 'witty' }, ['How\'s the hat? Still forecasting? Still wrong?']),
    at(7.1, { phrRainLost: true, stage: 'child' }, ['It DIDN\'T rain! I WON! Where\'s my toffee?']),
  ]);

  // =====================================================================================
  // A bet on the rain
  addThread({
    id: 'pass.rainbet', light: true, ap: 'jest', label: 'A bet on the rain', when: (F) => notTot(F) && F.weather !== 'rain' && F.weather !== 'snow' && !(F.promiseOpen && /rain/.test(F.promiseOpen)),
    open: { jest: 'pass.rainbet.open' },
    beats: {
      start: { line: 'pass.rainbet.start', go: [
        { ap: 'ask', say: 'And what do your knees say?', to: 'signs' },
        { ap: 'jest', say: 'A toffee says it rains before this time tomorrow.', to: 'shake' },
        { ap: 'share', say: 'pass.rainbet.lore', label: 'Share a weather sign', to: 'lore' },
      ] },
      signs: { line: 'pass.rainbet.signs', go: [
        { ap: 'jest', say: 'Then a toffee on it. Rain by this time tomorrow.', to: 'shake' },
        { ap: 'warm', say: 'Then I\'ll trust your knees over my hat.', to: 'trust' },
      ] },
      lore: { line: 'pass.rainbet.lored', go: [
        { ap: 'jest', say: 'So: a toffee says rain by this time tomorrow.', to: 'shake' },
        { ap: 'ask', say: 'And what do you go by?', to: 'signs' },
      ] },
      shake: { line: 'pass.rainbet.shake', fx: { promise: { k: 'phr.rain', t: 'You said it would rain by tomorrow', days: 1 } }, end: true },
      trust: { line: 'pass.rainbet.trust', fx: { respect: 0.01 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.rainbet.open', [{ text: ['Rain by tomorrow, I\'d say, {name}. Care to wager?', 'My hat says rain before this time tomorrow, {name}. Bet against it?', 'Smell that, {name}? Rain\'s coming. I\'d put a toffee on it.'] }]);
  lines('pass.rainbet.start', [
    { text: ['Rain? Look at that sky. Not a chance.', 'Rain. Hm. My knees haven\'t said anything.'] },
    { if: { weather: 'cloudy' }, text: ['Well, it\'s gray enough. But gray\'s not wet.'] },
    { if: { weather: 'clear' }, text: ['Rain? Out of that? You\'ve been at the Badger\'s cider.'] },
    { if: { weather: 'fog' }, text: ['Fog\'s not rain, wizard. Fog\'s just rain that can\'t be bothered.'] },
    { if: { job: 'farmer' }, text: ['I\'d like a drop for the barley. But I don\'t think so.'] },
    { if: { job: 'herder' }, text: ['The sheep are huddled by the wall. You might be right, curse you.'] },
    tm('ornery', 'Rain! Hmph. Everyone\'s a weather-wizard.'),
    tm('gloomy', 'It\'ll rain. It always rains. I won\'t bet against rain.'),
    tm('cheerful', 'Ooh, a bet! I say sunshine! Sunshine for ever!'),
    tm('curious', 'How do you know? Can you smell it? Teach me to smell it!'),
    tm('proud', 'I\'ve read the sky in this valley for years. No rain. I\'d stake my name on it.'),
    kid('RAIN! I hope it rains! Puddles! Wait, which side am I on?'),
    rift('Back home we had forecasts. Ninety-nine percent accurate. This is so much more fun.'),
    elder('My bad hip\'s been quiet all week. That means dry. Or that it\'s given up.'),
  ]);
  lines('pass.rainbet.signs', [
    { text: ['The cows are standing. When they lie down, it rains. Or they\'re tired.', 'Swallows are flying high. That\'s fair weather, that is.'] },
    { if: { stage: 'elder' }, text: ['My knees say dry. My knees have been right for sixty years. Mostly.'] },
    { if: { likes: 'rain' }, text: ['I can always smell it coming. And I can\'t smell it. Pity.'] },
    tm('dreamy', 'The spiders are spinning. They don\'t spin before rain. Or so my gran said.'),
    tm('witty', 'My corns are silent. My corns are never wrong. Unlike wizards.'),
    kid('The worms aren\'t up! When it rains the worms come UP. I check every day.'),
    rift('Pressure feels normal. I mean, I think. I miss my sensors.'),
  ]);
  lines('pass.rainbet.lore', [{ text: ['When the smoke from the chimneys hangs low, rain\'s on its way.', 'A ring round the moon means rain within a day. I saw one last night.', 'When the leaves show their pale backs, the rain\'s close behind.'] }]);
  lines('pass.rainbet.lored', [
    { text: ['Hm. Maybe. Doesn\'t mean I\'ll lose.', 'Huh. I\'ve heard that. Never believed it.'] },
    tm('curious', 'Really? Is that true? I\'m going to watch for it all evening.'),
    tm('ornery', 'Old wives\' tales. I\'m an old wife, and I don\'t believe it.'),
    kid('I\'m going to look out for it ALL NIGHT.'),
  ]);
  lines('pass.rainbet.shake', [
    { text: ['Done! A toffee it is. Shake.', 'You\'re on. And I want a good toffee. Not a furry one.'] },
    tm('ornery', 'Done. And when it doesn\'t rain, I\'ll want that toffee early.'),
    tm('gloomy', 'Done. I\'ll lose, mind. It\'ll rain on my toffee.'),
    tm('cheerful', 'Done! Ooh, I\'ll be watching the sky all night!'),
    tm('proud', 'Agreed. I look forward to the toffee.'),
    kid('DEAL! Spit-shake! No? Ordinary shake. Deal!'),
    rift('Bet logged. Timestamped. In my head.'),
  ]);
  lines('pass.rainbet.trust', [{ text: ['Ha! Good. Knees are never wrong.'] }, { if: { stage: 'elder' }, text: ['Wise. My knees are older than your hat.'] }, tm('proud', 'Very wise. Few people do.')]);

  // =====================================================================================
  // Shapes in the clouds
  addThread({
    id: 'pass.clouds', light: true, ap: 'share', label: 'Shapes in the clouds', when: (F) => notTot(F) && ['clear', 'cloudy'].includes(F.weather) && ['morning', 'afternoon'].includes(F.hour),
    open: { share: 'pass.clouds.open' },
    beats: {
      start: { line: 'pass.clouds.see', go: [
        { ap: 'jest', say: 'pass.clouds.silly', label: 'Spot something silly', to: 'silly' },
        { ap: 'ask', say: 'And that one there?', to: 'another' },
        { ap: 'share', say: 'I once saw a cloud shaped just like my hat. I took it personally.', to: 'memory' },
      ] },
      another: { line: 'pass.clouds.another', go: [
        { ap: 'warm', say: '*You lean back against the wall and watch them go.*', label: 'Lean back and watch', to: 'lie' },
        { ap: 'jest', say: 'pass.clouds.silly', label: 'Spot something silly', to: 'silly' },
      ] },
      silly: { line: 'pass.clouds.laugh', end: true },
      memory: { line: 'pass.clouds.memory', go: [
        { ap: 'warm', say: '*You watch them drift over the hill together.*', label: 'Watch them drift', to: 'lie' },
        { ap: 'ask', say: 'And what\'s the oddest cloud you\'ve seen?', to: 'odd' },
      ] },
      odd: { line: 'pass.clouds.odd', end: true },
      lie: { line: 'pass.clouds.lie', fx: { drive: { bored: -0.1 }, trust: 0.01 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.clouds.open', [{ text: ['*You look up.* That cloud looks like a dragon, {name}. Don\'t you think?', 'See that cloud, {name}? A ship in full sail, I\'d say.', 'Look at that one, {name}. It\'s a rabbit. A very worried rabbit.'] }]);
  lines('pass.clouds.see', [
    { text: ['That? That\'s a sheep. A sheep in a nightcap.', 'Hm. I see a teapot. A big one.'] },
    tm('cheerful', 'A dragon? It\'s a sheep! A sheep on a swing! Look at its little legs!'),
    tm('gloomy', 'Looks like rain to me.'),
    tm('dreamy', 'It\'s a ship. Sailing off west, to wherever ships go when they\'re done.'),
    tm('ornery', 'It\'s a cloud. It looks like a cloud. Because it\'s a cloud.'),
    tm('proud', 'That\'s clearly a teapot. Anyone can see that. A fine teapot.'),
    tm('curious', 'How do clouds stay up? Are they light? Are they steam? Can you stand on one?'),
    tm('witty', 'That\'s no dragon. That\'s my aunt in her Highday bonnet.'),
    tm('shy', '...I think it\'s a rabbit. A little one. With its ears down.'),
    kid('IT\'S A HORSE. No, a HORSE EATING A CAKE.', 'It\'s a dinosaur! No, it\'s a pie! A dinosaur pie!'),
    rift('Back home the clouds were mostly exhaust. These are... art. Free art.'),
    elder('That one\'s my old granddad. Same nose. He\'d be pleased.'),
  ]);
  lines('pass.clouds.silly', [{ text: ['And that one\'s a hobbit eating a smaller hobbit-shaped cake.', 'That one\'s a troll doing a jig. Look at his knees.', 'And that\'s the Badger\'s innkeeper, carrying nine pints at once.'] }]);
  lines('pass.clouds.laugh', [
    { text: ['Ha! It is! Look at its little feet!', 'Ha! Now I can\'t see anything else.'] },
    tm('ornery', 'Ha. ...Ha. All right, it does look a bit like that.'),
    tm('proud', 'Hm. I see it. Mine was better.'),
    kid('HAHAHA! Look! It\'s falling over!'),
    rift('Ha! I\'m screenshotting that in my brain.'),
  ]);
  lines('pass.clouds.another', [
    { text: ['That one\'s a castle. With a tower. And the tower\'s falling off.', 'That one\'s a fish. Swimming the wrong way.'] },
    tm('dreamy', 'That one\'s a door. Everything behind it is golden.'),
    tm('gloomy', 'That one\'s a grave. ...No, a bed. A cozy bed. Hm.'),
    tm('curious', 'That one\'s changing! It was a bear and now it\'s a boot!'),
    kid('That one\'s YOU! It\'s got a pointy hat! It\'s you!'),
  ]);
  lines('pass.clouds.memory', [{ text: ['Your hat? Ha! Did it look as good as yours?', 'Personally! Ha! Clouds can be very rude.'] }, tm('witty', 'Was it a better hat? Be honest.'), kid('Did you shout at it? I\'d shout at it.')]);
  lines('pass.clouds.odd', [{ text: ['Once, after the harvest, a cloud just like a loaf. Steaming and all.', 'A cloud like a fish, and that night we caught nothing. Make of that what you like.'] }, elder('The winter my mother passed there was a cloud just like her bonnet. I don\'t mind saying.')]);
  lines('pass.clouds.lie', [{ text: ['*watches the clouds with you for a while, quietly*', 'Mm. You don\'t make time for this. You should.'] }, tm('shy', '...This is nice.'), kid('*lies flat on the grass, arms out*')]);

  // =====================================================================================
  // The stars
  addThread({
    id: 'pass.stars', light: true, ap: 'tale', label: 'The stars', when: (F) => notTot(F) && ['evening', 'night'].includes(F.hour) && F.weather === 'clear',
    open: { tale: 'pass.stars.open' },
    beats: {
      start: { line: 'pass.stars.know', go: [
        { ap: 'tale', say: '{PhrStarTale}', label: 'Tell them about one', to: 'tale' },
        { ap: 'ask', say: 'What would you call that one?', to: 'name' },
        { ap: 'listen', say: '*You stand together and look up.*', label: 'Just look', to: 'quiet' },
      ] },
      tale: { line: 'pass.stars.taleback', go: [
        { ap: 'ask', say: 'And what would you call that one, there?', to: 'name' },
        { ap: 'warm', say: 'They\'re yours too, you know. Every one.', to: 'yours' },
      ] },
      name: { line: 'pass.stars.name', fx: { joke: { k: 'phr.star', t: 'There\'s a star only you two know the name of.' } }, end: true },
      yours: { line: 'pass.stars.yours', fx: { fond: 0.02 }, end: true },
      quiet: { line: 'pass.stars.quiet', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.stars.open', [{ text: ['*You point up with your staff.* See that bright one, {name}? It has a name.', 'The stars are out, {name}. Do you know any of them?', 'Look up, {name}. Clear as a bell tonight.'] }]);
  lines('pass.stars.know', [
    { text: ['That\'s the Sickle, isn\'t it? My granddad showed me.', 'I know that one. Well, I know it\'s a star.'] },
    tm('dreamy', 'I know them all. I\'ve given them names. Don\'t ask me to say them out loud.'),
    tm('curious', 'How far away are they? Further than Bree? Further than the Mountain?'),
    tm('gloomy', 'They\'ll be there when we\'re all gone. Comforting, in a way.'),
    tm('ornery', 'Stars. They come out every night. No need to make a fuss.'),
    tm('proud', 'That\'s the Sickle. And that\'s the Ember. I know a great many.'),
    tm('witty', 'That one\'s called "Look, a star". I named it myself.'),
    kid('That one\'s MINE. I named it Biscuit.', 'There\'s SO MANY. Did you put them there?'),
    rift('We never saw stars in Neverdark. Too much light. This is... a lot.', 'There are SO many. Nobody\'s even selling anything up there.'),
    elder('I\'ve looked at them eighty years and they still take my breath away.'),
  ]);
  lines('pass.stars.taleback', [
    { text: ['Really? I\'ll never look at it the same again.', 'Is that true? It\'s lovely if it isn\'t.'] },
    tm('dreamy', 'Oh. Oh, I\'ll think of that every night now.'),
    tm('curious', 'And the others? Do they all have stories? Tell me another!'),
    tm('ornery', 'Hm. Pretty story. Probably nonsense. ...Pretty, though.'),
    kid('Is that REALLY true? Can we go there?'),
    rift('Okay, that\'s better than any star-chart app.'),
  ]);
  lines('pass.stars.name', [
    { text: ['That one? That\'s... the Pie. Because it\'s round. Don\'t tell anyone.', 'The Lantern. Because it looks like someone\'s left one on.'] },
    tm('proud', 'The {Surname} Star. After my family. Naturally.'),
    tm('dreamy', 'The Last Boat. Because it\'s the one going furthest.'),
    tm('witty', 'Gerald. It looks like a Gerald.'),
    tm('gloomy', 'The Lonely One. It\'s off on its own, see?'),
    kid('Biscuit Two! Because Biscuit\'s already taken.', 'Wizard! The Wizard Star! Because it\'s tall. And it twinkles.'),
    rift('Signal. Because it\'s a little blinking light and I miss them.'),
  ]);
  lines('pass.stars.yours', [{ text: ['...Mine. Ha. I like that.', 'Every one? Even the little ones? I\'ll take them.'] }, tm('shy', '*looks up for a long time*'), kid('ALL of them? I\'m going to count them. One. Two...')]);
  lines('pass.stars.quiet', [{ text: ['*looks up with you, and says nothing for a good while*', '...Thank you. I needed that. I don\'t know why.'] }, tm('gloomy', '...It\'s easier, looking up.'), kid('*leans against your leg and nearly falls asleep*')]);

  // =====================================================================================
  // What did you have for breakfast?
  addThread({
    id: 'pass.breakfast', light: true, ap: 'ask', label: 'What did you have for breakfast?', when: notTot, open: { ask: 'pass.breakfast.open' },
    beats: {
      start: { line: 'pass.breakfast.menu', go: [
        { ap: 'jest', say: 'Only that? Are you poorly?', to: 'only' },
        { ap: 'ask', say: 'And second breakfast?', to: 'second' },
        { ap: 'share', say: 'I had a hard cookie on the road. It had a hard life too.', to: 'pity' },
      ] },
      only: { line: 'pass.breakfast.only', go: [
        { ap: 'ask', say: 'And second breakfast?', to: 'second' },
        { ap: 'warm', say: 'Forgive me. I\'m sure it was a feast.', to: 'end' },
      ] },
      second: { line: 'pass.breakfast.second', go: [
        { ap: 'warm', say: 'You\'ll never go hungry, {name}.', to: 'end' },
        { ap: 'jest', say: 'And elevenses? Don\'t tell me. I\'ll faint.', to: 'eleven' },
      ] },
      eleven: { line: 'pass.breakfast.eleven', end: true },
      pity: { line: 'pass.breakfast.pity', go: [
        { ap: 'warm', say: 'You\'re very kind. I\'d love that.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'jest', say: 'I\'ll take the pie now, for later.', to: 'later' },
      ] },
      later: { line: 'pass.breakfast.later', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.breakfast.open', [
    { text: ['What did you have for breakfast, {name}? And don\'t say "nothing".', 'Tell me about breakfast, {name}. I\'ve had a hard cookie and I want to suffer.'] },
  ]);
  lines('pass.breakfast.menu', [
    { text: ['Eggs, bacon, mushrooms, toast, the last of the plum jam, and a small pork pie for luck.', 'Porridge with honey, then bacon, then a bit more porridge to settle the bacon.'] },
    { if: { likes: 'mushrooms' }, text: ['Mushrooms. Then more mushrooms. Then a mushroom I found in my pocket.'] },
    { if: { job: 'baker' }, text: ['The end of yesterday\'s loaf, toasted, with dripping. The baker eats last.'] },
    { if: { job: 'herder' }, text: ['Fresh milk, still warm, and cheese. A lot of cheese. You get used to it.'] },
    { if: { job: 'orchardist' }, text: ['An apple. Two apples. An apple pie. I see apples when I close my eyes.'] },
    { if: { hungry: true }, pri: 1, text: ['Breakfast? I barely remember breakfast. It was hours ago. HOURS.'] },
    tm('ornery', 'Porridge. Same as yesterday. Same as tomorrow. Porridge.'),
    tm('gloomy', 'Half an egg. The other half looked at me funny.'),
    tm('proud', 'Deviled kidneys. My own sauce. Folk have asked for the recipe.'),
    tm('dreamy', 'I forget. I was looking out of the window. Something with jam, I think.'),
    tm('cheerful', 'Pancakes! With butter! And sugar! And then more pancakes!'),
    tm('shy', '...Toast. Just toast. Is that bad?'),
    kid('Jam. Just jam. On a spoon.', 'Three eggs and a sausage and Mom doesn\'t know about the sausage.'),
    rift('Toast. Real toast. Toast from actual bread. I could cry.'),
    elder('Porridge. At my age you have porridge. You don\'t argue with porridge.'),
  ]);
  lines('pass.breakfast.only', [
    { text: ['Only! That\'s a decent breakfast! For a Highday.', 'Poorly! I\'ll have you know I had a second slice of pie.'] },
    tm('ornery', 'Only that, he says. Wizards. Live on air, I expect.'),
    tm('proud', 'I\'ll have you know it was a very refined breakfast.'),
    kid('I had two jams, actually. TWO.'),
  ]);
  lines('pass.breakfast.second', [
    { text: ['Second breakfast? Oh, that was a proper meal. Sausages, eggs, a bit of fried bread.', 'Scones. Cream. Strawberry jam. And a slice of seed-cake to round it off.'] },
    tm('gloomy', 'I skipped it. ...I had elevenses early to make up.'),
    tm('dreamy', 'Second breakfast was out on the step, in the sun. Honey and bread. Bliss.'),
    tm('witty', 'Second breakfast was a triumph. First breakfast was just the rehearsal.'),
    kid('I had FOUR breakfasts. Don\'t tell Mom about three of them.'),
    rift('Second breakfast. You lot invented the perfect system and never told anyone.'),
  ]);
  lines('pass.breakfast.eleven', [{ text: ['Elevenses? A small cake. A modest cake. With a bigger cake behind it.', 'Ha! Only a crumpet. Two crumpets. Butter.'] }, kid('Elevenses is my FAVORITE. It\'s like breakfast\'s little brother.')]);
  lines('pass.breakfast.pity', [
    { text: ['A cookie? Oh, you poor thing. Come round, I\'ll do you a proper breakfast.', 'A hard cookie! That\'s not a breakfast, that\'s a punishment!'] },
    tm('cheerful', 'Oh, no! Come in, come in, I\'ll put the pan on!'),
    tm('ornery', 'Serves you right for wandering about. ...There\'s a pie. You can have the pie.'),
    tm('shy', '...I could give you some toast. If you like.'),
    tm('proud', 'You must come to mine. I do a breakfast that\'s spoken of.'),
    kid('You can have my jam! Some of it. A spoon of it.'),
    rift('Ration-bar life. I know it well. Come over. Bring nothing. We\'ll fix it.'),
  ]);
  lines('pass.breakfast.later', [{ text: ['Ha! Cheek! ...Here. Wrapped in a cloth.', 'For later! Ha! There\'s no later with a pie.'] }]);

  // =====================================================================================
  // The hat
  addThread({
    id: 'pass.hat', light: true, ap: 'jest', label: 'The hat', when: notTot, open: { jest: 'pass.hat.open' },
    beats: {
      start: { line: 'pass.hat.opinion', go: [
        { ap: 'jest', say: 'It has a name, you know.', to: 'name' },
        { ap: 'ask', say: 'Would you like to try it on?', to: 'try' },
        { ap: 'tale', say: 'pass.hat.tale', label: 'Tell them where it\'s been', to: 'history' },
      ] },
      name: { line: 'pass.hat.guess', go: [
        { ap: 'jest', say: 'Close. It\'s Gerald.', to: 'gerald' },
        { ap: 'warm', say: 'That\'s a good name. I\'ll tell it.', to: 'end' },
      ] },
      gerald: { line: 'pass.hat.gerald', fx: { joke: { k: 'phr.hat', t: 'The wizard\'s hat is called Gerald.' } }, end: true },
      try: { line: 'pass.hat.try', go: [
        { ap: 'warm', say: 'It suits you. Very distinguished.', to: 'suits' },
        { ap: 'jest', say: 'Where\'s {name} gone? I can only see a hat.', to: 'vanish' },
      ] },
      suits: { line: 'pass.hat.suits', fx: { fond: 0.02 }, end: true },
      vanish: { line: 'pass.hat.vanish', end: true },
      history: { line: 'pass.hat.history', go: [
        { ap: 'ask', say: 'Would you like to try it on?', to: 'try' },
        { ap: 'jest', say: 'It\'s due a wash. It\'s been due a wash for a century.', to: 'wash' },
      ] },
      wash: { line: 'pass.hat.wash', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.hat.open', [{ text: ['Be honest, {name}. What do you think of the hat?', 'I\'ve had this hat a very long time, {name}. Does it suit me?', 'My hat\'s feeling unappreciated, {name}. Say something nice about it.'] }]);
  lines('pass.hat.opinion', [
    { text: ['It\'s... very pointy. Very blue. Very you.', 'It\'s a good hat. A tall hat. A hat with ambitions.'] },
    tm('ornery', 'It\'s ridiculous. Pointy and ridiculous.'),
    tm('proud', 'It\'s... certainly tall. Mine\'s better made.'),
    tm('shy', 'I like it. I like the point. Sorry.'),
    tm('witty', 'It\'s lovely. Where do you keep the birds?'),
    tm('cheerful', 'It\'s magnificent! It\'s the best hat in the valley!'),
    tm('gloomy', 'It\'ll blow off one day. Hats do.'),
    tm('curious', 'Why\'s it pointy? Is it for the magic? Does the magic come out of the top?'),
    tm('dreamy', 'It looks like a mountain. A little blue mountain, walking about.'),
    kid('Can I wear it? Can I? CAN I?', 'Is there a rabbit in it? Wizards keep rabbits in hats.'),
    rift('It\'s very retro. Like, the most retro thing I\'ve ever seen. I love it.'),
    elder('I\'ve seen that hat come up this lane for longer than I\'ve had gray hairs.'),
  ]);
  lines('pass.hat.guess', [
    { text: ['A name! Is it Hatty? It\'s Hatty, isn\'t it.', 'Old Pointy? Sir Pointington? Lord Blue?'] },
    tm('witty', 'Let me guess. Something grand. Hatticus the Tall.'),
    tm('ornery', 'A name. For a hat. Of course it has.'),
    tm('dreamy', 'Something old. Something from the songs. Is it Twilight?'),
    kid('Is it BOB? It\'s Bob. It looks like a Bob.'),
    rift('Does it have a serial number? No? A name, then. Model Pointy-1.'),
  ]);
  lines('pass.hat.gerald', [
    { text: ['GERALD? *laughs till they wheeze* Gerald!', 'Gerald. Good day, Gerald. ...I can\'t. I can\'t.'] },
    tm('ornery', 'Gerald. Hmph. ...Ha. Gerald. Daft.'),
    tm('proud', 'Gerald. Well. It\'s a sturdy name. For a hat.'),
    kid('HELLO GERALD! Gerald waved! Did you see? Gerald waved!'),
  ]);
  lines('pass.hat.try', [
    { text: ['*it comes down to their chin* ...How do I look? Don\'t answer.', '*puts it on; only their nose shows* I feel very wise. And very dark.'] },
    tm('proud', '*wears it at a dignified angle* I think it improves it.'),
    tm('shy', '*puts it on very carefully, then hides under it*'),
    tm('cheerful', '*dances about in it* I\'m a wizard! Look at me! I\'m all wise!'),
    tm('ornery', 'I\'m not wearing that. ...*puts it on anyway* Hmph. It\'s warm.'),
    kid('I\'m a WIZARD! Abracadabra! ...Nothing happened.', '*the hat walks about on two small legs* I can\'t see! I\'m invisible!'),
    rift('Hat on. Hm. No HUD. No overlay. Just... hat. Weirdly calming.'),
  ]);
  lines('pass.hat.suits', [{ text: ['Does it? *preens* Perhaps I\'ll get one.', 'You\'re only saying that. Say it again.'] }, tm('shy', '*goes pink under the hat*'), kid('I\'m keeping it. No. Here. ...Can I have it on my birthday?')]);
  lines('pass.hat.vanish', [{ text: ['*from inside the hat* I\'m still here!', '*the hat giggles*'] }, kid('*from inside the hat* I\'M INVISIBLE! Tell everyone!')]);
  lines('pass.hat.tale', [{ text: ['This hat has been through three dragons, a goblin market and a laundry. The laundry was the worst.', 'This hat was blown off on the Misty Mountains and came back to me a week later. On an eagle.'] }]);
  lines('pass.hat.history', [
    { text: ['Ha! Poor hat. It\'s had a harder life than you.', 'Hats don\'t do that. Do they? Yours does.'] },
    tm('curious', 'What else has it seen? Did it get singed? Show me the singe!'),
    tm('ornery', 'And it\'s never been washed since, by the look of it.'),
    tm('dreamy', 'So it\'s seen more of the world than I ever will. Lucky hat.'),
    kid('Can it go on an adventure with ME? Without you? I\'ll bring it back.'),
  ]);
  lines('pass.hat.wash', [{ text: ['A century! I\'ll wash it. Give it here. ...No, I won\'t. It\'d dissolve.', 'Ha! Don\'t you dare. It\'d lose its magic.'] }]);

  // =====================================================================================
  // I spy, with the children
  addThread({
    id: 'pass.ispy', light: true, ap: 'jest', label: 'I spy', when: (F) => F.stage === 'child' && F.band !== 'toddler', open: { jest: 'pass.ispy.open' },
    beats: {
      start: { line: 'pass.ispy.guess', go: [
        { ap: 'jest', say: 'No! Guess again.', to: 'again' },
        { ap: 'warm', say: 'A clue: {phrSpyHint}', label: 'Give them a clue', to: 'got' },
        { ap: 'ask', say: 'Your turn. You spy something.', to: 'theirs' },
      ] },
      again: { line: 'pass.ispy.again', go: [
        { ap: 'warm', say: 'A clue: {phrSpyHint}', label: 'Give them a clue', to: 'got' },
        { ap: 'tale', say: 'It\'s my {phrSpyA}!', label: 'Tell them', to: 'groan' },
      ] },
      got: { line: 'pass.ispy.got', go: [
        { ap: 'ask', say: 'Your turn!', to: 'theirs' },
        { ap: 'warm', say: 'Clever {name}!', to: 'end' },
      ] },
      groan: { line: 'pass.ispy.groan', go: [{ ap: 'ask', say: 'Your turn, then.', to: 'theirs' }] },
      theirs: { line: 'pass.ispy.theirs', go: [
        { ap: 'ask', say: 'Wall? Water? Wheelbarrow?', to: 'notit' },
        { ap: 'warm', say: 'Is it... a wizard?', to: 'yesit' },
      ] },
      notit: { line: 'pass.ispy.notit', end: true },
      yesit: { line: 'pass.ispy.yesit', end: true },
    },
    end: { fond: 0.03, drive: { bored: -0.1 } },
  });
  lines('pass.ispy.open', [{ text: ['I spy with my little eye, something beginning with... {phrSpyL}.', 'Shall we play I spy, {name}? I spy something beginning with {phrSpyL}.'] }]);
  lines('pass.ispy.guess', [
    { text: ['{PhrSpyGuess}', 'Ooh! {PhrSpyGuess}'] },
    { if: { band: 'youth' }, text: ['I spy? I\'m not five. ...{PhrSpyGuess}'] },
    { if: { register: 'bright' }, text: ['Let me think logically. {PhrSpyGuess}'] },
    rift('Scanning environment... {phrSpyGuess}'),
  ]);
  lines('pass.ispy.again', [
    { text: ['Then it\'s... a BUTTERFLY. Is it? It\'s not. Is it a worm?', 'A... a... I don\'t KNOW. Give me a clue! A little one!'] },
    { if: { band: 'youth' }, text: ['I\'m not guessing again. ...Fine. A wheel? No. Ugh.'] },
    { if: { band: 'young' }, text: ['Is it Mommy? Is it a SPOON?'] },
  ]);
  lines('pass.ispy.got', [
    { text: ['Your {phrSpyA}! It\'s your {phrSpyA}! I GOT IT!', 'OH! {PhrSpyA}! That\'s so EASY!'] },
    { if: { band: 'youth' }, text: ['{PhrSpyA}. Obviously. Too easy. ...That was quite fun.'] },
    { if: { register: 'bright' }, text: ['{PhrSpyA}! I deduced it. That\'s like guessing, but cleverer.'] },
  ]);
  lines('pass.ispy.groan', [
    { text: ['Your {phrSpyA}? That\'s NOT FAIR. I can\'t see it properly!', 'Awww! I was going to say that next!'] },
    { if: { band: 'youth' }, text: ['Your {phrSpyA}. Right. I knew that. I was letting you win.'] },
  ]);
  lines('pass.ispy.theirs', [
    { text: ['I spy with my little eye, something beginning with... W!', 'My turn! I spy something beginning with W! You\'ll NEVER get it.'] },
    { if: { band: 'youth' }, text: ['Fine. I spy something beginning with W. It\'s really hard.'] },
    { if: { band: 'young' }, text: ['I spy... W! No, I spy... W! Yes. W.'] },
  ]);
  lines('pass.ispy.notit', [
    { text: ['NO! It\'s YOU! W for WIZARD! Ha!', 'Wrong wrong WRONG! It\'s you! You\'re a W!'] },
    { if: { band: 'youth' }, text: ['No. It\'s you. Wizard. I win.'] },
  ]);
  lines('pass.ispy.yesit', [
    { text: ['How did you KNOW? Are you magic? You\'re MAGIC.', 'Aww! You guessed! That\'s cheating! Wizards cheat!'] },
    { if: { band: 'youth' }, text: ['Yeah. Well. It was pretty obvious.'] },
  ]);

  // =====================================================================================
  // Peekaboo, with the very small
  addThread({
    id: 'pass.peekaboo', tot: true, light: true, ap: 'jest', label: 'Peekaboo', when: (F) => F.band === 'toddler', open: { jest: 'pass.peekaboo.open' },
    beats: {
      start: { line: 'pass.peekaboo.start', go: [
        { ap: 'jest', say: '*Peekaboo!*', label: 'Peekaboo!', to: 'boo' },
        { ap: 'warm', say: '*You wiggle your fingers at them.*', label: 'Wiggle your fingers', to: 'wiggle' },
      ] },
      boo: { line: 'pass.peekaboo.boo', go: [
        { ap: 'jest', say: '*Peekaboo! Again!*', label: 'Again!', to: 'again' },
        { ap: 'warm', say: '*You pat them on the head, very gently.*', label: 'A pat on the head', to: 'pat' },
      ] },
      wiggle: { line: 'pass.peekaboo.wiggle', go: [{ ap: 'jest', say: '*Peekaboo!*', label: 'Peekaboo!', to: 'boo' }] },
      again: { line: 'pass.peekaboo.again', end: true },
      pat: { line: 'pass.peekaboo.pat', end: true },
    },
    end: { fond: 0.04, drive: { bored: -0.15 } },
  });
  lines('pass.peekaboo.open', [{ text: ['*You hide your face behind your hat.*', '*You crouch down, very low, and cover your eyes.*'] }]);
  lines('pass.peekaboo.start', [{ text: ['*stares, very serious*', '*holds breath*', 'Wizzad gone?'] }]);
  lines('pass.peekaboo.boo', [{ text: ['*squeals*', '*shrieks with laughter*', 'Agen! Agen!'] }]);
  lines('pass.peekaboo.wiggle', [{ text: ['*wiggles fingers back*', '*grabs your finger and won\'t let go*'] }]);
  lines('pass.peekaboo.again', [{ text: ['*laughs so hard they sit down with a bump*', 'Boo! BOO! *runs in a circle*'] }]);
  lines('pass.peekaboo.pat', [{ text: ['*beams*', 'Nice wizzad.'] }]);

  // =====================================================================================
  // Telling fortunes
  addThread({
    id: 'pass.fortune', light: true, ap: 'tale', label: 'Telling fortunes', when: notTot, open: { tale: 'pass.fortune.open' },
    beats: {
      start: { line: 'pass.fortune.start', go: [
        { ap: 'tale', say: 'pass.fortune.grand', label: 'A grand prophecy', to: 'grand' },
        { ap: 'jest', say: 'pass.fortune.silly', label: 'A silly one', to: 'silly' },
        { ap: 'warm', say: 'pass.fortune.kind', label: 'A kind one', to: 'kind' },
      ] },
      grand: { line: 'pass.fortune.grandback', go: [
        { ap: 'ask', say: 'There\'s more, if you want it. Something you hope for.', to: 'more', need: { if: { dream: (d) => !!d } } },
        { ap: 'jest', say: 'Or it\'s a smudge of jam. Hard to tell.', to: 'jam' },
      ] },
      more: { line: 'pass.fortune.more', fx: { learn: ['dream', '{dreamText}'], trust: 0.02 }, end: true },
      jam: { line: 'pass.fortune.jam', end: true },
      silly: { line: 'pass.fortune.sillyback', fx: { joke: { k: 'phr.fortune', t: 'The wizard told a very silly fortune. It may yet come true.' } }, end: true },
      kind: { line: 'pass.fortune.kindback', fx: { trust: 0.02, fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.fortune.open', [{ text: ['Give me your hand, {name}. I\'ll tell your fortune.', 'Shall I read the leaves in your cup, {name}?', 'I see something in your future, {name}. Shall I say what?'] }]);
  lines('pass.fortune.start', [
    { text: ['Go on, then. Is it good? Make it good.', 'My fortune? All right. Nothing frightening.'] },
    tm('curious', 'Ooh! Yes! What does it say? Is it good? Is there a lot of it?'),
    tm('ornery', 'Fortune-telling. Pah. ...Go on, then.'),
    tm('dreamy', 'Oh yes. I\'ve always wanted to know. And not know.'),
    tm('gloomy', 'It\'ll be bad. It always is. Go on.'),
    tm('shy', '*holds out a hand, uncertainly*'),
    tm('witty', 'Will I be rich? Handsome? Rich will do.'),
    tm('proud', 'I expect it\'s a distinguished one.'),
    tm('cheerful', 'Ooh, yes! Tell me something wonderful!'),
    kid('Am I going to be RICH? Am I going to have a DRAGON?'),
    rift('We had apps for this. They were wrong a lot. Go on.'),
    elder('At my age the future\'s a short read. Go on, though.'),
  ]);
  lines('pass.fortune.grand', [{ text: ['I see... a long road, a great feast, and a very small dragon.', 'I see a door you\'ve never opened, and behind it, a friend.', 'I see the whole valley singing your name. Well, humming it.'] }]);
  lines('pass.fortune.silly', [{ text: ['You will eat a pie. Soon. Possibly today.', 'Beware of geese. One goose in particular. You\'ll know her.', 'You will lose a sock, and find it in the last place you look.'] }]);
  lines('pass.fortune.kind', [
    { text: ['I see friends around a table, and you at the head of it.', 'I see a long, warm life, and more good days than bad.'] },
    { if: { wish: (w) => !!w }, text: ['I see {wishText}, and sooner than you think.'] },
    { if: { kid: (k) => !!k }, text: ['I see {kid} grown and proud, and telling everyone about you.'] },
  ]);
  lines('pass.fortune.grandback', [
    { text: ['Ooh! Is that really in there? Say it again, slowly.', 'Oh, I like the sound of that. When?'] },
    tm('ornery', 'Hmph. Nonsense. ...When, exactly?'),
    tm('dreamy', 'Oh. Oh, I\'ve always felt something like that was coming.'),
    tm('gloomy', 'For me? You\'re sure it\'s my hand you\'re reading?'),
    tm('curious', 'When? Where? How? Can you see any more?'),
    kid('I KNEW it! I knew something good would happen to me!'),
    rift('Okay. That\'s a better forecast than the city ever gave me.'),
  ]);
  lines('pass.fortune.more', [
    { text: ['...How did you know? That I want to {dreamText}? I\'ve never said it.', 'That\'s... that\'s what I\'ve always wanted. To {dreamText}. Is it really there?'] },
    tm('shy', '*very quietly* ...To {dreamText}. Don\'t tell anyone.'),
    tm('proud', 'To {dreamText}. Yes. I mean to. I\'m glad the stars agree.'),
    kid('To {dreamText}! That\'s my BEST wish! How did you know?'),
  ]);
  lines('pass.fortune.jam', [{ text: ['Jam! You fraud! ...Lick it off and read it again.', 'A smudge of jam! Ha! I\'ll take a jam future.'] }]);
  lines('pass.fortune.sillyback', [
    { text: ['Ha! That\'s not a fortune, that\'s a Trewsday.', 'I KNEW it. I knew it would be something like that.'] },
    tm('ornery', 'That\'s not a fortune. That\'s a menu.'),
    tm('witty', 'And you, wizard, will lose your hat, and find it on your head.'),
    tm('gloomy', 'Even my fortune\'s a bit daft.'),
    kid('WHEN? Now? Is it now?'),
  ]);
  lines('pass.fortune.kindback', [
    { text: ['...Oh. That\'s a nice thing to see. Thank you.', 'I\'ll hold on to that. Even if you made it up.'] },
    tm('gloomy', '...You think so? ...I\'ll try to believe it.'),
    tm('ornery', 'Hm. Well. That\'s not a bad fortune. I\'ll take it.'),
    tm('shy', '*closes the hand, as if to keep it safe*'),
    kid('*hugs your arm*'),
  ]);

  // =====================================================================================
  // The signal, for the rift-folk
  addThread({
    id: 'pass.signal', light: true, ap: 'ask', label: 'How\'s the signal?', when: (F) => !!F.rift && F.band !== 'toddler', open: { ask: 'pass.signal.open' },
    beats: {
      start: { line: 'pass.signal.report', go: [
        { ap: 'jest', say: 'Have you tried standing on one leg by the well?', to: 'leg' },
        { ap: 'ask', say: 'And if you could send something, what would it be?', to: 'send' },
        { ap: 'share', say: 'I send letters by moth, now and then.', to: 'moth' },
      ] },
      leg: { line: 'pass.signal.leg', fx: { joke: { k: 'phr.signal', t: 'One bar of signal, by the well, on one leg.' } }, end: true },
      send: { line: 'pass.signal.send', fx: { trust: 0.02 }, go: [
        { ap: 'comfort', say: 'Then we\'ll keep saying it here, till it reaches.', to: 'kept', need: { if: { lost: (l) => !!l } } },
        { ap: 'warm', say: 'Then I\'ll take it, the long way round.', to: 'kept' },
      ] },
      kept: { line: 'pass.signal.kept', fx: { trust: 0.03, fond: 0.02 }, end: true },
      moth: { line: 'pass.signal.moth', go: [{ ap: 'jest', say: 'About a week, if the wind\'s kind.', to: 'end' }] },
    },
    end: { fond: 0.02 },
  });
  lines('pass.signal.open', [{ text: ['How\'s the signal today, {name}?', 'Found any bars in the valley yet, {name}?', 'Any word on the air today, {name}?'] }]);
  lines('pass.signal.report', [
    { text: ['Two bars by the party tree. None anywhere else. That tree\'s got secrets.', 'Nothing. Nothing, and then a flicker by the mill. Then nothing.'] },
    tm('cheerful', 'One whole bar on the bridge this morning! I nearly cried!'),
    tm('gloomy', 'Zero. Same as yesterday. Same as tomorrow.'),
    tm('curious', 'I\'ve been mapping it! The best spot moves. I think the Relay\'s tides do it.'),
    tm('witty', 'Excellent. If you\'re a moth. Terrible if you\'re me.'),
    tm('ornery', 'Don\'t ask. I\'ve stopped checking. I check every hour.'),
    { if: { job: 'tinker' }, text: ['The Relay\'s holding. Barely. I\'ve got it running on spit and a dynamo.'] },
    kid('There\'s a bar on top of the haystack! I climbed up! Don\'t tell!'),
  ]);
  lines('pass.signal.leg', [
    { text: ['...I tried it. One bar. ONE BAR, wizard. How did you know?', 'That\'s not how signal works. ...I\'m going to try it anyway.'] },
    tm('witty', 'Standing on one leg. By a well. Wizard tech support, everyone.'),
    tm('curious', 'Wait. Wait. Why would that work? Does it work? I\'m trying it.'),
    kid('I\'m doing it! *wobbles* Nothing! Try the other leg!'),
  ]);
  lines('pass.signal.send', [
    { text: ['A picture of a sunset here, to everyone back home. They\'d think it was fake.', 'A message saying I\'m fine. Better than fine. Most days.'] },
    { if: { lost: (l) => !!l }, text: ['A message to {lost}. Just "I\'m here. I\'m safe. Where are you?"', 'Just one ping to {lost}. One. So they\'d know I\'m alive.'] },
    tm('gloomy', 'Something to say sorry. For leaving. Even though I didn\'t choose to.'),
    kid('A picture of my cat! Everyone in Neverdark needs to see my cat.'),
  ]);
  lines('pass.signal.kept', [{ text: ['...Thanks. That\'s weirdly better than signal.', 'The long way round. Okay. I like that.'] }, { if: { lost: (l) => !!l }, text: ['...Okay. Keep saying {lost}\'s name. Maybe it\'ll get there.'] }]);
  lines('pass.signal.moth', [{ text: ['Moths. Okay. What\'s the latency on a moth?', 'By moth. That\'s... honestly, I respect it.'] }, tm('curious', 'Wait, really? How do you address a moth?')]);

  // =====================================================================================
  // The weather, the oldest talk there is
  addThread({
    id: 'pass.weather', light: true, ap: 'warm', label: 'The weather', when: notTot, open: { warm: 'pass.weather.open' },
    beats: {
      start: { line: 'pass.weather.talk', go: [
        { ap: 'ask', say: 'Will it hold, do you think?', to: 'forecast' },
        { ap: 'jest', say: 'Don\'t look at me. I only do fireworks.', to: 'blame' },
        { ap: 'share', say: 'pass.weather.road', label: 'Tell of worse weather on the road', to: 'road' },
      ] },
      forecast: { line: 'pass.weather.forecast', go: [
        { ap: 'warm', say: 'Then I\'ll keep my hat on.', to: 'end' },
        { ap: 'jest', say: 'Your knees are wasted on farming.', to: 'knees' },
      ] },
      knees: { line: 'pass.weather.knees', end: true },
      blame: { line: 'pass.weather.blame', end: true },
      road: { line: 'pass.weather.roadback', go: [
        { ap: 'ask', say: 'And what\'s the worst you\'ve known here?', to: 'worst' },
        { ap: 'warm', say: 'It\'s good to be in a kinder valley.', to: 'end' },
      ] },
      worst: { line: 'pass.weather.worst', end: true },
    },
    end: { fond: 0.015 },
  });
  lines('pass.weather.open', [
    { text: ['Fine day for it, {name}.', 'Weather\'s turning, {name}, I think.'] },
    { if: { weather: 'rain' }, text: ['Wet one today, {name}.', 'Raining on the just and the unjust alike, {name}.'] },
    { if: { weather: 'snow' }, text: ['Cold enough for you, {name}?'] },
    { if: { weather: 'cloudy' }, text: ['Gray old sky today, {name}.'] },
    { if: { weather: 'fog' }, text: ['Can\'t see the hills for the fog, {name}.'] },
    { if: { weather: 'clear' }, text: ['Not a cloud in the sky, {name}.'] },
  ]);
  lines('pass.weather.talk', [
    { text: ['It is. It\'s a day, all right.', 'Mm. Can\'t complain. Well, I can, but I won\'t.'] },
    { if: { weather: 'rain' }, text: ['Wet? It\'s drowning. The ducks are complaining.', 'Good for the gardens. Bad for the washing.'] },
    { if: { weather: 'rain', job: 'farmer' }, text: ['The barley\'s glad of it. I\'m not. But the barley is.'] },
    { if: { weather: 'snow' }, text: ['Cold? My nose has gone. I\'ve no idea where.', 'The well\'s froze over. Had to break it with a ladle.'] },
    { if: { weather: 'clear' }, text: ['Lovely. Hay weather. Bee weather.', 'Hot enough to fry an egg on a stone. The children have tried.'] },
    { if: { weather: 'clear', season: 'winter' }, text: ['Bright, but there\'s a bite to it. Frost on the cabbages.'] },
    { if: { weather: 'cloudy' }, text: ['Gray. Can\'t make its mind up, the sky.'] },
    { if: { weather: 'fog' }, text: ['Thick as porridge. I walked into the gatepost.'] },
    tm('ornery', 'Weather. Always weather. Never the right sort.'),
    tm('gloomy', 'It\'ll turn. It always turns.'),
    tm('cheerful', 'It\'s glorious! Even when it isn\'t, it\'s glorious!'),
    tm('dreamy', 'I like this kind of day. It feels like a beginning.'),
    kid('I LIKE weather. All of it. Except when it\'s cold. And wet. And hot.'),
    rift('Weather\'s still a novelty. Back home we had climate control and complaints.'),
  ]);
  lines('pass.weather.forecast', [
    { text: ['It\'ll hold till teatime, then we\'ll see.', 'My knees say it\'ll turn by Highday.'] },
    { if: { job: ['farmer', 'herder'] }, text: ['The cows are lying down. Rain by morning, mark me.'] },
    elder('My bad hip says change. It\'s never wrong, my hip. Except when it is.'),
    tm('gloomy', 'It won\'t hold. Nothing holds.'),
    tm('proud', 'It\'ll hold. I\'m never wrong about weather.'),
    kid('I asked a frog. It didn\'t say anything.'),
  ]);
  lines('pass.weather.knees', [{ text: ['Ha! My knees are wasted on everything.', 'They\'d have made a fine wizard, my knees.'] }]);
  lines('pass.weather.blame', [
    { text: ['Wizards and weather. I\'ve heard stories.', 'Ha! Fireworks. Then do something about it.'] },
    tm('ornery', 'Wizards. Never there when you want rain, never gone when you don\'t.'),
    tm('witty', 'A likely story. I\'ve seen you whispering to clouds.'),
    kid('Make it SNOW. Go on. Make it snow. Please?'),
  ]);
  lines('pass.weather.road', [{ text: ['It was worse in the mountains. Snow up to my hat.', 'Ah, this is nothing. In the south the rain comes sideways, and stays for tea.'] }]);
  lines('pass.weather.roadback', [
    { text: ['Worse than this? I\'ll not complain again. Well, not today.', 'You do get about. I\'ll stay here, thank you.'] },
    tm('curious', 'What else was it like? Were there wolves? Were you cold?'),
    kid('WHOA. Did you nearly die? Did you?'),
  ]);
  lines('pass.weather.worst', [
    { text: ['The great flood, when the Water came over the bridge. We rowed to the Badger.', 'The long winter. Snow till the spring. We ate the seed-potatoes.'] },
    elder('The year of the hailstones. Big as eggs. Bigger. My father wore a pan.'),
    kid('Last week it rained in my BOOTS. From the inside.'),
  ]);

  // =====================================================================================
  // A tongue-twister
  addThread({
    id: 'pass.twister', light: true, ap: 'jest', label: 'A tongue-twister', when: notTot, open: { jest: 'pass.twister.open' },
    beats: {
      start: { line: 'pass.twister.try', go: [
        { ap: 'jest', say: 'Faster! Three times!', to: 'faster' },
        { ap: 'warm', say: 'Not bad at all. Better than me.', to: 'wizturn' },
        { ap: 'ask', say: 'Do you know a harder one?', to: 'theirs' },
      ] },
      faster: { line: 'pass.twister.faster', go: [
        { ap: 'jest', say: '*You try it yourself, and make a dreadful mess of it.*', label: 'Try it yourself', to: 'mess' },
        { ap: 'ask', say: 'Go on, then. Give me one of yours.', to: 'theirs' },
      ] },
      wizturn: { line: 'pass.twister.dare', go: [
        { ap: 'jest', say: '*You try it yourself, and make a dreadful mess of it.*', label: 'Try it yourself', to: 'mess' },
        { ap: 'share', say: '*You say it perfectly, slowly, with great dignity.*', label: 'Say it slowly, with dignity', to: 'slow' },
      ] },
      theirs: { line: 'pass.twister.theirs', go: [
        { ap: 'jest', say: '*You try. Your tongue ties itself in a reef knot.*', label: 'Have a go', to: 'mess' },
        { ap: 'warm', say: 'I yield. Your tongue is mightier than mine.', to: 'yield' },
      ] },
      mess: { line: 'pass.twister.mess', fx: { joke: { k: 'phr.twister', t: 'The wizard tried a tongue-twister and his tongue lost.' } }, end: true },
      slow: { line: 'pass.twister.slow', end: true },
      yield: { line: 'pass.twister.yield', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.twister.open', [{ text: ['Say this three times fast, {name}: six slippery snails slid slowly seaward.', 'Try this, {name}. Six slippery snails slid slowly seaward. Fast as you can.', 'Here\'s one my old tutor gave me, {name}: six slippery snails slid slowly seaward.'] }]);
  lines('pass.twister.try', [
    { text: ['Six slippy... six sloppy... six snippy... oh, bother.', 'The bakers bread brunt... burnt... I\'ve bitten my tongue.'] },
    tm('cheerful', '*tries, gets it hopelessly wrong, and laughs so hard they snort*'),
    tm('ornery', 'I\'m not doing that. ...Six slippery snails. There. Once is plenty.'),
    tm('shy', '*mouths it silently first* ...Six slippery snails. Oh. I did it. Quietly.'),
    tm('curious', 'Why do tongues trip on those? Is it the S? It\'s the S, isn\'t it? Six slippery...'),
    tm('dreamy', 'Six slippery snails slid slowly seaward. Oh, that\'s lovely. Like a little poem.'),
    tm('witty', 'Six slippery snails slid slowly seaward. Six slippery snails... ha! Twice! Beat that.'),
    tm('proud', 'Six slippery snails slid slowly seaward. Six. Slippery... I have a very good tongue, usually.'),
    tm('gloomy', 'Six sloppy... no. See. I can\'t even talk properly.'),
    kid('SIX SLIPPY SNAILS SLID SLOWLY SEASIDE! Did I win?', 'Thix thlippery... I can\'t! My tooth\'s missing!'),
    rift('Six slippery snails... okay, my mouth is buffering.'),
    elder('Six slippery... my teeth aren\'t what they were. Nor my snails.'),
  ]);
  lines('pass.twister.faster', [
    { text: ['Sixslipperysnailsslid... sixslipp... SIX! There. Close enough.', 'Three times! Snails, snails, snails! ...That\'s not it, is it?'] },
    tm('witty', 'Faster? My tongue has a family to think of.'),
    tm('ornery', 'Faster. Hmph. *gets it right, all three times, scowling*'),
    tm('proud', '*rattles it off three times, flawlessly, then looks very pleased*'),
    kid('SIXSLIPPERY... *collapses giggling*'),
  ]);
  lines('pass.twister.dare', [
    { text: ['Better than you? Go on, then. You do it.', 'Your turn, wizard. All the way through. Fast.'] },
    tm('witty', 'Prove it. Three times. Go.'),
    kid('YOU do it! You do it! Go go go!'),
  ]);
  lines('pass.twister.theirs', [
    { text: ['Try this one. Red leather, yellow leather. Ten times.', 'Here\'s my gran\'s: she sells sea-shells by the sea-shore. Go on.'] },
    { if: { job: 'miller' }, text: ['A miller\'s one: which wheel would a wheelwright wheel if a wheelwright would wheel wheels?'] },
    { if: { job: 'baker' }, text: ['A baker\'s one: Betty baked a batch of better buns. Fast as you can.'] },
    tm('witty', 'Mine\'s a cruel one. The sixth sick sheikh\'s sixth sheep\'s sick.'),
    tm('proud', 'I\'ll give you a proper one. Peter Piper picked a peck of pickled peppers. In full.'),
    kid('Mine is: big black bug bit a big black bear. Say it! SAY IT!'),
    rift('Here\'s one from the city. Unique New York. Unique New York. Except, you know, Neverdark.'),
  ]);
  lines('pass.twister.mess', [
    { text: ['Ha! You sounded like a goose with hiccups!', 'Ha! That wasn\'t even words! That was soup!'] },
    tm('cheerful', '*laughs till they have to sit on the wall* AGAIN!'),
    tm('ornery', 'Ha. Ha! Hmph. All that wisdom and you can\'t say snails.'),
    tm('shy', '*hides a giggle behind both hands*'),
    tm('witty', 'Six slithery sausages. Well, that\'s the wizard sorted.'),
    tm('proud', 'Hm. I believe that\'s one to me.'),
    kid('HAHAHA! You said it WRONG! You said SNAILY!'),
    rift('Ha! Your speech module crashed.'),
  ]);
  lines('pass.twister.slow', [{ text: ['Slowly doesn\'t count! That\'s cheating!', 'Ha! With dignity! That\'s not how twisters work, wizard.'] }, kid('That\'s CHEATING. Fast! Do it FAST!'), tm('proud', 'Very dignified. Also cheating.')]);
  lines('pass.twister.yield', [{ text: ['Ha! I\'ve beaten a wizard with my tongue.', 'Mightier! I\'ll tell everyone.'] }, kid('I WIN! My tongue is the BEST tongue!')]);

  // =====================================================================================
  // A dandelion clock (spring and summer)
  addThread({
    id: 'pass.dandelion', light: true, ap: 'warm', label: 'A dandelion clock', when: (F) => notTot(F) && ['spring', 'summer'].includes(F.season) && F.weather !== 'rain',
    open: { warm: 'pass.dandelion.open' },
    beats: {
      start: { line: 'pass.dandelion.blow', go: [
        { ap: 'ask', say: 'And did you make a wish?', to: 'wish' },
        { ap: 'jest', say: 'Four o\'clock. Teatime, then.', to: 'tea' },
        { ap: 'listen', say: '*You watch the seeds drift away over the hedge.*', label: 'Watch the seeds go', to: 'drift' },
      ] },
      wish: { line: 'pass.dandelion.wish', go: [
        { ap: 'warm', say: 'Then I hope it lands somewhere good.', to: 'end' },
        { ap: 'ask', say: 'Can you tell me? Or is that bad luck?', to: 'tell' },
      ] },
      tell: { line: 'pass.dandelion.tell', fx: { learn: ['wish', '{wishText}'] }, end: true },
      tea: { line: 'pass.dandelion.tea', end: true },
      drift: { line: 'pass.dandelion.drift', fx: { trust: 0.01 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.dandelion.open', [{ text: ['*You pick a dandelion clock and hold it out.* Go on, {name}. Tell the time.', 'Here, {name}. A dandelion clock. Blow.'] }]);
  lines('pass.dandelion.blow', [
    { text: ['*puffs* One o\'clock, two o\'clock, three... four! Four o\'clock.', '*blows; the seeds scatter everywhere, mostly over you*'] },
    tm('shy', '*blows, very gently, so only a few seeds go*'),
    tm('ornery', 'I\'ll get seeds in my garden. ...*blows anyway, hard*'),
    tm('proud', '*one great puff, every seed gone at once* One o\'clock. Precisely.'),
    tm('dreamy', '*blows, and watches every seed as if it were a ship leaving*'),
    tm('curious', 'How many seeds are there? Shall I count? *blows before counting*'),
    tm('gloomy', '*puffs* Seven o\'clock. Late. It\'s always late.'),
    kid('*blows SO hard they nearly fall over* TWELVE O\'CLOCK!', '*blows, then tries to catch the seeds* Come back!'),
    rift('*blows* It\'s a clock? It\'s a plant clock? Okay. Twenty past whatever.'),
    elder('*puffs, and laughs* I could clear one in a breath, once. Now it takes three.'),
  ]);
  lines('pass.dandelion.wish', [
    { text: ['Of course I did. You always wish on the last puff.', 'I did. A small one. A sensible one.'] },
    tm('dreamy', 'Oh, I wished. I always wish. I\'ve wished on every dandelion in the valley.'),
    tm('ornery', 'Wishes. Pah. ...Yes. I did.'),
    kid('YES. A big one. The BIGGEST.'),
  ]);
  lines('pass.dandelion.tell', [
    { text: ['It\'s bad luck. ...Oh, all right. It was a small thing. Something to look forward to.'] },
    { if: { wish: (w) => !!w }, text: ['It\'s bad luck. ...{WishText}. There. Now it won\'t come true.', 'Only you, mind. {WishText}. Don\'t tell the dandelions.'] },
    { if: { wish: (w) => !!w, stage: 'child' }, text: ['{WishText}! Oh no! I SAID it! Does it still count?'] },
  ]);
  lines('pass.dandelion.tea', [{ text: ['Ha! Teatime by the dandelion. I\'ll tell the kettle.', 'Four o\'clock it is. The dandelions never lie. Only the hens.'] }, kid('Is it really teatime? Can I have cake? The dandelion SAID.')]);
  lines('pass.dandelion.drift', [{ text: ['*watches with you until the last seed is gone* ...They\'ll be dandelions somewhere else, next year.', 'Off they go. Further than I\'ll ever go.'] }, tm('gloomy', '...I hope they land somewhere kind.'), kid('Bye bye, seeds! Write to me!')]);

  // =====================================================================================
  // A knock-knock joke, with the children
  addThread({
    id: 'pass.knock', light: true, ap: 'jest', label: 'A knock-knock joke', when: (F) => F.stage === 'child' && F.band !== 'toddler', open: { jest: 'pass.knock.open' },
    beats: {
      start: { line: 'pass.knock.who', go: [
        { ap: 'jest', say: 'Lettuce.', to: 'lettuce' },
        { ap: 'jest', say: 'Wizard.', to: 'wizard' },
      ] },
      lettuce: { line: 'pass.knock.lettucewho', go: [{ ap: 'jest', say: 'Lettuce in, it\'s cold out here!', to: 'groan' }] },
      wizard: { line: 'pass.knock.wizardwho', go: [{ ap: 'jest', say: 'Wizard you been all my life?', to: 'groan' }] },
      groan: { line: 'pass.knock.groan', go: [
        { ap: 'ask', say: 'Your turn. Knock knock.', to: 'theirs' },
        { ap: 'warm', say: 'I\'ve a hundred more where that came from.', to: 'end' },
      ] },
      theirs: { line: 'pass.knock.theirs', go: [{ ap: 'ask', say: 'Who\'s there?', to: 'punch' }] },
      punch: { line: 'pass.knock.punch', go: [{ ap: 'ask', say: '...Who?', to: 'end' }, { ap: 'jest', say: '*You laugh, much louder than it deserves.*', label: 'Laugh, much too loudly', to: 'loud' }] },
      loud: { line: 'pass.knock.loud', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02, drive: { bored: -0.1 } },
  });
  lines('pass.knock.open', [{ text: ['Knock knock, {name}.', 'I\'ve a joke for you, {name}. Knock knock.'] }]);
  lines('pass.knock.who', [{ text: ['Who\'s there?', 'WHO\'S THERE?'] }, { if: { band: 'youth' }, text: ['Seriously? ...Fine. Who\'s there?'] }, { if: { band: 'young' }, text: ['Who\'s there? Is it a bear? Is it a BEAR?'] }]);
  lines('pass.knock.lettucewho', [{ text: ['Lettuce who?', 'Lettuce WHO?'] }, { if: { band: 'youth' }, text: ['Lettuce who. Go on.'] }]);
  lines('pass.knock.wizardwho', [{ text: ['Wizard who?', 'Wizard WHO?'] }, { if: { band: 'youth' }, text: ['Wizard who. I can see where this is going.'] }]);
  lines('pass.knock.groan', [
    { text: ['*groans* That\'s TERRIBLE. Do another one!', 'Ha! That\'s awful! I\'m telling everyone!'] },
    { if: { band: 'youth' }, text: ['That\'s the worst joke I\'ve ever heard. ...Ha.'] },
    { if: { band: 'young' }, text: ['*laughs, then asks* ...Why is it funny?'] },
    { if: { register: 'bright' }, text: ['Ha! It\'s a pun. Lettuce, let us. I see what you did.'] },
    rift('Ha! Okay, analog jokes hit different.'),
  ]);
  lines('pass.knock.theirs', [{ text: ['Knock knock!', 'My turn! Knock knock! KNOCK KNOCK!'] }, { if: { band: 'youth' }, text: ['Fine. Knock knock.'] }]);
  lines('pass.knock.punch', [
    { text: ['Boo!', 'Cow says.', 'Interrupting hen. BAWK!'] },
    { if: { band: 'young' }, text: ['Banana! ...I forget the rest. BANANA!'] },
    { if: { band: 'youth' }, text: ['Atch. ...Bless you. Ha. Got you.'] },
    rift('Signal. Signal who? Exactly. There isn\'t any. Ha!'),
  ]);
  lines('pass.knock.loud', [{ text: ['*beams with pride*', 'I KNEW you\'d like it! I made it up! Well, Granddad did.'] }, { if: { band: 'youth' }, text: ['It wasn\'t THAT funny. ...It was quite funny.'] }]);

  // --- More voices for the beats above ---------------------------------------------------
  lines('pass.stars.taleback', [
    tm('cheerful', 'Oh, I love that! I\'m going to tell it to everyone at the Badger!'),
    tm('shy', '...I\'ll look for it every night now. Thank you.'),
    tm('witty', 'Lovely story. I\'ll pretend I believe it. Out loud, anyway.'),
    tm('proud', 'I knew there was a story to it. Everything worth looking at has one.'),
    tm('gloomy', 'A star that never goes out. That\'s something, I suppose.'),
    elder('I\'ve looked at that star all my life and never knew. Fancy that, at my age.'),
  ]);
  lines('pass.stars.name', [
    tm('cheerful', 'The Jolly Pudding! Because it\'s round and it makes me happy.'),
    tm('ornery', 'It\'s a star. It\'s called a star. ...Fine. The Grumbler. It looks grumpy.'),
    tm('shy', '...Little One. It\'s small and it\'s a bit on its own.'),
    tm('curious', 'Wait, can you just name them? Who decides? I\'m calling it the Question.'),
    elder('Old Faithful. It was there when I was born and it\'ll be there after.'),
  ]);
  lines('pass.stars.quiet', [
    tm('dreamy', '*whispers* You can almost hear them, can\'t you?'),
    tm('curious', '...I\'ve a hundred questions. I\'ll ask them tomorrow. This is nice.'),
    tm('ornery', '...Hm. Not bad, a bit of quiet. Not bad at all.'),
    rift('...No notifications. Just this. I didn\'t know I needed this.'),
    elder('...I used to do this with someone, long ago. Just this. Thank you.'),
  ]);
  lines('pass.clouds.another', [
    tm('cheerful', 'That one\'s a dancing pig! Look at its trotters!'),
    tm('ornery', 'That one\'s a cloud as well. Shocking, I know.'),
    tm('shy', '...A teacup. With a little handle.'),
    tm('witty', 'That one\'s you, wizard. Look. It\'s mostly hat.'),
    tm('proud', 'That one\'s a crown. Very fitting for a day like today.'),
    rift('That one looks like a server farm. I miss nothing about server farms.'),
    elder('That one\'s the old mill, before they rebuilt it. Exactly.'),
  ]);
  lines('pass.clouds.laugh', [
    tm('cheerful', 'Ha! Oh, I see it! I see it! Look at its face!'),
    tm('witty', 'Ha! And next to it, a troll looking for his dinner. That\'s us, then.'),
    tm('shy', '*giggles, and looks to see if anyone saw*'),
    tm('gloomy', 'Ha. ...It\'s raining on the troll. Poor troll.'),
  ]);
  lines('pass.clouds.lie', [
    tm('dreamy', '*sighs* I could do this every day. I do, nearly.'),
    tm('ornery', 'Hm. Five minutes. Then I\'ve got things to do. ...Ten.'),
    rift('*lies back* This is the best screen I\'ve ever watched.'),
  ]);
  lines('pass.signal.report', [
    tm('shy', '...None. I stopped looking. I still look.'),
    tm('dreamy', 'Sometimes I think I hear it, in the wind. Probably not. Probably.'),
    tm('proud', 'I\'ve rigged a booster on my roof. Three bars. When it\'s not raining. Or cloudy.'),
    elder('Signal? At my age, I\'m lucky to get a signal from my own knees.'),
  ]);
  lines('pass.signal.send', [
    tm('cheerful', 'A message saying "it\'s great here, come and see!" To everyone!'),
    tm('witty', 'A complaint to the city council. About the lack of sky.'),
    tm('curious', 'A picture of a hedgehog. They\'d never believe it. Spikes! On an animal!'),
  ]);
  lines('pass.signal.moth', [
    tm('cheerful', 'Moths! That\'s brilliant! Can I send one?'),
    tm('gloomy', 'Moths. Slow, and they get eaten. Sounds like the city mail.'),
    kid('Can I send a moth to my friend? She lives three holes down.'),
  ]);
  lines('pass.weather.talk', [
    tm('shy', '...It\'s nice. The weather. Yes.'),
    tm('curious', 'Do you know where weather comes from? Over the hills? From the sea?'),
    tm('witty', 'It\'s weather, all right. Can\'t fault it for effort.'),
    tm('proud', 'I\'ve kept a record of the weather for twenty years. This is about average.'),
    elder('I\'ve seen worse. I\'ve seen better. Mostly I\'ve seen weather.'),
  ]);
  lines('pass.weather.forecast', [
    tm('cheerful', 'It\'ll be lovely! It\'s always lovely tomorrow!'),
    tm('ornery', 'It\'ll do whatever it likes. Weather always does.'),
    tm('dreamy', 'The clouds are moving east. Somewhere east is going to have a lovely sunset.'),
    tm('witty', 'Ask the hens. They\'re never wrong. Mostly because they never say anything.'),
    rift('No idea. I keep wanting to check a forecast. Then I remember.'),
  ]);
  lines('pass.weather.blame', [
    tm('cheerful', 'Ha! Then do some fireworks and chase the clouds off!'),
    tm('shy', '*laughs, very quietly*'),
    tm('gloomy', 'If you could do weather you\'d have done something by now.'),
    rift('A wizard who controls the weather. That\'s just a really old weather machine.'),
  ]);
  lines('pass.weather.worst', [
    tm('ornery', 'The year the Water froze and we lost three sheep through the ice. Not a joke.'),
    tm('cheerful', 'The year it snowed in June! We had snowball fights at Midsummer!'),
    tm('dreamy', 'The night of the great wind. The whole valley sang, like an organ.'),
    rift('The night I came through. The sky tore open. That was the worst weather. And the best.'),
  ]);
  lines('pass.hat.opinion', [
    { if: { register: 'fine' }, text: ['It\'s... a statement, certainly. A bold one.'] },
    { if: { register: 'plain' }, text: ['It\'s a hat and a half, that is.'] },
  ]);
  lines('pass.hat.guess', [
    tm('cheerful', 'Ooh! Is it Bluebell? It looks like a Bluebell!'),
    tm('proud', 'Something distinguished, I hope. It\'s a distinguished hat.'),
    tm('shy', '...Is it... Hat?'),
    tm('curious', 'What sort of name? A hat name or a person name? Does it answer to it?'),
    tm('gloomy', 'Something sad. It looks like it\'s seen things.'),
  ]);
  lines('pass.hat.try', [
    tm('witty', '*puts it on* Fetch me a dragon. I feel ready.'),
    tm('gloomy', '*puts it on* ...It\'s dark in here. Peaceful, actually.'),
    tm('curious', '*puts it on, and peers up inside it* Is there a pocket in here? There\'s a pocket!'),
    tm('dreamy', '*puts it on* I can feel the roads in it. All of them.'),
    elder('*puts it on* Ha! I look like my grandmother. She\'d have liked this hat.'),
  ]);
  lines('pass.breakfast.only', [
    tm('cheerful', 'Only that? You\'re right! I\'ll have more! Thank you!'),
    tm('witty', 'That was the list I tell people. The real one\'s longer.'),
    tm('gloomy', 'I know. I\'m wasting away. Nobody notices.'),
    rift('It\'s more than I ate in a week back home. Everything\'s relative.'),
  ]);
  lines('pass.breakfast.second', [
    tm('ornery', 'Second breakfast was porridge as well. Don\'t start.'),
    tm('proud', 'Kedgeree. My own recipe. The fish was caught this morning.'),
    tm('shy', '...More toast. With honey, this time.'),
    tm('cheerful', 'Fritters! Apple ones! I could have had a third breakfast!'),
    elder('Second breakfast was a nap. At my age that counts.'),
  ]);
  lines('pass.breakfast.pity', [
    tm('witty', 'A hard cookie. And you call yourself a wizard. Sit. I\'ll make you a real one.'),
    tm('gloomy', 'Poor thing. I know how that cookie feels.'),
    tm('dreamy', 'Oh, you should have a breakfast with a view. Come to mine. There\'s a view of the hill.'),
    elder('A cookie! At your age! You\'ll waste away. Come in, come in.'),
  ]);
  lines('pass.fortune.kindback', [
    tm('cheerful', 'Oh, I\'ll believe it! I always believe the nice ones!'),
    tm('proud', 'At the head of the table. Yes. That seems right.'),
    tm('curious', 'Can you really see it? How does it work? Can you teach me?'),
    tm('dreamy', 'I\'ll keep that one. In a little box. With the other good things.'),
    rift('That\'s a good forecast. I\'ll take it over the city\'s any day.'),
  ]);
  lines('pass.fortune.sillyback', [
    tm('cheerful', 'Ha! Oh, I hope it\'s true! I hope it\'s true today!'),
    tm('proud', 'I hardly think that\'s a proper fortune.'),
    tm('shy', '*laughs* ...Is that really what it says?'),
    rift('Ha! That\'s a better forecast than the city ever gave me.'),
  ]);
  lines('pass.rainbet.shake', [
    tm('witty', 'Done. And when I win, I want the toffee presented on a cushion.'),
    tm('shy', '...All right. Done. A small toffee, though.'),
    tm('dreamy', 'Done. I\'ll lie awake listening for it on the roof.'),
    tm('curious', 'Done! I\'m going to watch the sky all night and keep notes.'),
    elder('Done. I\'ve won more bets on the weather than you\'ve had hot dinners.'),
  ]);
  lines('pass.twister.try', [
    { if: { register: 'fine' }, text: ['Six slippery snails slid slowly seaward. Elocution, wizard. I had lessons.'] },
    { if: { register: 'plain' }, text: ['Six slippy snails... sloid... no. Can\'t be done, that.'] },
  ]);
  lines('pass.ispy.got', [
    { if: { band: 'young' }, text: ['*points* THAT! That one! The {phrSpyA}!'] },
    rift('{PhrSpyA}. Found it. Object recognized.'),
  ]);
  lines('pass.ispy.notit', [{ if: { band: 'young' }, text: ['NO! WIZARD! W is for WIZARD! I\'m so clever!'] }, rift('Nope! W for wizard. Obviously.')]);
});
