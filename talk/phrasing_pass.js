'use strict';
// ---------------------------------------------------------------------------
// Phrasing, part three: passing the time of day. Light threads the wizard
// opens from "Pass the time of day…", each a little game or a natter of a few
// beats that can go several ways: a riddle game (both ways round), a war of
// compliments, a silly wager, guess what's in my pocket, a song, a proverb,
// idle gossip, birdsong and the smell of baking.
//
// What's posed, staked or pulled from a pocket is rolled once a talk (kept on
// the talk, so it can't change between beats) and given as facts, so every
// line about it agrees: {phrRidQ} {phrRidA} {phrRidGuess} {phrRidThemQ}
// {phrRidThemA} {phrRidWrong} {phrBetQ} {phrBetStake} {phrPocketItem}
// {phrPocketWhere} {phrSongA} {phrSongB} {phrProverb}.
// ---------------------------------------------------------------------------

talkPack('phrasing_pass', () => {
  const tm = (temper, ...text) => ({ if: { temper }, text });
  const kid = (...text) => ({ if: { stage: 'child' }, text });
  const rift = (...text) => ({ if: { rift: true }, text });
  const elder = (...text) => ({ if: { stage: 'elder' }, text });
  const notTot = (F) => F.band !== 'toddler';

  // --- What the games are played with -------------------------------------------------
  const RID = [
    { q: 'What has a mouth but never eats, a bed but never sleeps, and runs but never walks?', a: 'a river', clue: 'You crossed it this morning, if you came by the bridge.', g: 'the postie' },
    { q: 'The more you take, the more you leave behind. What are they?', a: 'footsteps', clue: 'Look behind you on a muddy lane.', g: 'biscuits' },
    { q: 'What has a neck but no head, and wears a cork for a hat?', a: 'a bottle', clue: 'There\'s a row of them behind the bar at the Badger.', g: 'a very thin hobbit in a very small hat' },
    { q: 'I\'m full of holes, but I still hold water. What am I?', a: 'a sponge', clue: 'You\'ll find one by the washing-up.', g: 'the roof of my larder' },
    { q: 'What gets wetter the more it dries?', a: 'a towel', clue: 'You\'d want one after a bath.', g: 'my aunt\'s eyes at a wedding' },
    { q: 'What has a face and two hands, but no arms or legs?', a: 'a clock', clue: 'It sits on the mantel and ticks at you.', g: 'a very lazy cousin' },
    { q: 'What can you catch, but never throw?', a: 'a cold', clue: 'You\'ll know it by the sneezing.', g: 'a trout' },
    { q: 'What has to be broken before you can use it?', a: 'an egg', clue: 'Every hen-house has a few.', g: 'a promise' },
    { q: 'What goes up and up, and never comes down?', a: 'your age', clue: 'It goes up every birthday.', g: 'a kite that\'s got away' },
    { q: 'What has a great many teeth, and never bites?', a: 'a comb', clue: 'You\'d drag it through your hair. Or your beard.', g: 'a very polite dragon' },
    { q: 'What runs all the way round the garden without moving?', a: 'the fence', clue: 'It keeps the sheep out. Mostly.', g: 'a very tired dog' },
    { q: 'What belongs to you, but other folk use it more than you do?', a: 'your name', clue: 'I said it when I came up the lane.', g: 'my good spoon' },
    { q: 'What has roots like a tree, a crown like a king, and is buried till autumn?', a: 'a turnip', clue: 'You\'d find it in a stew, if you\'re lucky.', g: 'my grandfather' },
    { q: 'The more of me there is, the less you see. What am I?', a: 'the dark', clue: 'You light a lamp against me.', g: 'fog' },
  ];
  const THEM = [
    { q: 'What\'s got a head and a tail, and no body at all?', a: 'a penny', w: 'a very short snake' },
    { q: 'Round as an apple, deep as a cup, and all the horses in the Shire can\'t pull it up. What is it?', a: 'the well', w: 'a pudding' },
    { q: 'What\'s got an eye, but can\'t see a thing?', a: 'a needle', w: 'a potato' },
    { q: 'Little Nancy Etticoat, in a white petticoat. The longer she stands, the shorter she grows. Who is she?', a: 'a candle', w: 'your great-aunt' },
    { q: 'What\'s always coming, and never comes?', a: 'tomorrow', w: 'the postie' },
    { q: 'What\'s got four legs, and never goes for a walk?', a: 'a table', w: 'a very lazy dog' },
    { q: 'What\'s black when you get it, red when you use it, and grey when you throw it out?', a: 'charcoal', w: 'a dragon\'s breakfast' },
    { q: 'What do you fill with empty hands?', a: 'a pair of gloves', w: 'a larder' },
    { q: 'What follows you all day, and leaves you at nightfall?', a: 'your shadow', w: 'a goose' },
    { q: 'What\'s bought by the yard and worn by the foot?', a: 'a carpet', w: 'a very long sock' },
    { q: 'What has a bark, but no bite?', a: 'a tree', w: 'my uncle Bodo' },
    { q: 'What goes round and round the house, and peeps in at every window?', a: 'the sun', w: 'the neighbours' },
  ];
  const BETS = [
    { q: 'I\'ll wager you that snail reaches the gatepost before the bell goes.', watch: 'You both watch the snail. It takes its time. It considers the gatepost.' },
    { q: 'I\'ll bet you the rooster crows before I finish this sentence. Any. Moment. Now.', watch: 'Somewhere a rooster draws a long, thoughtful breath.' },
    { q: 'I\'ll wager I can balance my staff on one finger for a count of ten.', watch: 'You balance the staff. It sways. One, two, three...' },
    { q: 'I\'ll bet you the next hobbit up the lane is carrying something to eat.', watch: 'You both watch the lane. Footsteps. A hat. Something wrapped in a cloth...' },
    { q: 'I\'ll wager that cloud turns into a pig before it\'s over the hill.', watch: 'You both squint at the cloud. It goes snout-ish. Then less snout-ish.' },
    { q: 'I\'ll bet you I can skim a stone five times across the Water.', watch: 'You choose a flat stone, crouch, and let fly. Plip... plip...' },
    { q: 'I\'ll wager that cat\'s asleep before we\'ve finished talking.', watch: 'The cat on the wall blinks slowly. Very slowly.' },
    { q: 'I\'ll bet you I can name every hen in your yard. Well, I\'ll try.', watch: '"Henrietta. Mabel. Old Speckle..." The hens look unimpressed.' },
  ];
  const STAKES = ['a seed-cake', 'a toffee', 'a jam tart', 'a pipe of leaf', 'an apple', 'a penny', 'a song on the Badger\'s table', 'the last scone'];
  const POCKET = [
    { i: 'a conker, polished to a shine', w: 'a horse-chestnut by the Brandywine, a hundred years ago' },
    { i: 'a length of string, knotted in eleven places', w: 'a knot I tied to remember something. I\'ve forgotten what' },
    { i: 'a toffee, slightly furry', w: 'a sweet-shop in Bree. It\'s been in there a while' },
    { i: 'a smooth grey pebble with a hole right through it', w: 'the beach at the edge of the Sea, where the gulls cry' },
    { i: 'a very large brown feather', w: 'an eagle who owed me a favour' },
    { i: 'a pressed primrose between two leaves of paper', w: 'a spring I don\'t talk about' },
    { i: 'a crumpled paper ticket that glows faintly blue', w: 'a train in Neverdark. It\'s still warm, somehow' },
    { i: 'a brass button that isn\'t yours', w: 'a dwarf\'s waistcoat. He\'s still looking for it' },
    { i: 'a tiny brass key', w: 'nowhere I can remember. I don\'t know what it opens. That\'s why I keep it' },
    { i: 'an acorn', w: 'the great oak on the party field, when it was a much smaller oak' },
    { i: 'a folded map with a dragon drawn on one corner', w: 'a friend who went there and back again' },
    { i: 'a squib, wrapped in a twist of paper', w: 'my wagon. I keep a few about me. For emergencies' },
  ];
  const SONGS = [
    { a: 'Up the hill and down the lane, and round about and home again,', b: 'With a pie on the sill and the kettle on, and the rain all gone by the morning sun!' },
    { a: 'Oh, hot is the water and high is the steam, and a bath after work is a hobbit\'s dream,', b: 'So scrub off the mud from your knees and your toes, and sing till the soap is right up your nose!' },
    { a: 'Bring in the barley and bring in the hay, and dance on the barn floor at the end of the day,', b: 'With a jug for the farmer and cake for his wife, and a fiddle to play for the rest of your life!' },
    { a: 'Fill up the tankard and fill up the jar, the Badger is open, and here we are,', b: 'And if we can\'t stand, then we\'ll sit on the floor, and sing it again till they bolt the door!' },
    { a: 'Hush now, the owl\'s in the old oak tree, the moon\'s on the Water, and you\'re safe with me,', b: 'Hush now, the lantern is low and warm, and nothing can reach you through wind or storm.' },
    { a: 'Rain on the roof and rain on the hill, the kettle is singing, the cat is still,', b: 'So let it come down on the lane and the leas, we\'ll toast our toes and we\'ll toast our cheese!' },
  ];
  const PROVERBS = [
    'a wise head keeps a dry hat', 'never trust a bridge you haven\'t crossed twice', 'the longest road starts at your own front door', 'a full larder makes a quiet mind',
    'even a dragon was an egg once', 'don\'t count your mushrooms before the rain', 'a kind word is worth two pies. Nearly', 'the slow walker sees the most birds',
    'an open door lets in the cold and the company', 'every hill has two sides, and so does every quarrel',
  ];
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  addFacts((v, F, T) => {
    const roll = () => {
      const t = (bondFull(v).talks || 0), h = (salt) => hash2(v.id * 97 + salt + t * 13, Game.day);
      return { rid: Math.floor(h(1) * RID.length), them: Math.floor(h(2) * THEM.length), right: h(3), bet: Math.floor(h(4) * BETS.length), win: h(5) < 0.5, stake: Math.floor(h(6) * STAKES.length), pocket: Math.floor(h(7) * POCKET.length), song: Math.floor(h(8) * SONGS.length), prov: Math.floor(h(9) * PROVERBS.length) };
    };
    const D = T ? (T.phrPass || (T.phrPass = roll())) : roll();
    const r = RID[D.rid], th = THEM[D.them];
    F.phrRidQ = r.q; F.phrRidA = r.a; F.phrRidClue = r.clue; F.phrRidGuess = r.g;
    F.phrRight = D.right < (['curious', 'witty', 'proud'].includes(F.temper) ? 0.6 : 0.4);
    F.phrRidThemQ = th.q; F.phrRidThemA = th.a; F.phrRidWrong = th.w;
    F.phrBet = D.bet; F.phrBetQ = BETS[D.bet].q; F.phrBetWatch = BETS[D.bet].watch; F.phrBetWin = D.win; F.phrBetStake = STAKES[D.stake];
    F.phrPocket = D.pocket; F.phrPocketItem = POCKET[D.pocket].i; F.phrPocketWhere = POCKET[D.pocket].w;
    F.phrSong = D.song; F.phrSongA = SONGS[D.song].a; F.phrSongB = SONGS[D.song].b;
    F.phrProverb = PROVERBS[D.prov]; F.phrProverbCap = PROVERBS[D.prov].replace(/^./, (c) => c.toUpperCase());
    F.phrRidQl = lower(r.q);
  });

  // =====================================================================================
  // A riddle game
  addThread({
    id: 'pass.riddle', light: true, ap: 'ask', label: 'A riddle game', when: notTot, open: { ask: 'pass.riddle.open' },
    beats: {
      start: { line: 'pass.riddle.ready', go: [
        { ap: 'ask', say: 'pass.riddle.pose', label: 'Pose your riddle', to: [{ to: 'right', need: { if: { phrRight: true } } }, 'wrong'] },
        { ap: 'jest', say: 'Or you riddle me, if you dare.', to: 'theirs' },
        { ap: 'warm', say: 'pass.riddle.easy', label: 'Start them off with an easy one', to: 'warmup' },
      ] },
      warmup: { line: 'pass.riddle.warmup', go: [
        { ap: 'ask', say: 'pass.riddle.pose', label: 'Now a proper one', to: [{ to: 'right', need: { if: { phrRight: true } } }, 'wrong'] },
        { ap: 'jest', say: 'That\'s your lot. Your turn to riddle me.', to: 'theirs' },
      ] },
      right: { line: 'pass.riddle.right', go: [
        { ap: 'warm', say: 'Right first time! Well done, {name}.', to: 'won' },
        { ap: 'jest', say: 'Lucky guess. Suspiciously lucky.', to: 'lucky' },
        { ap: 'ask', say: 'Clever. Your turn, then. Stump me.', to: 'theirs' },
      ] },
      wrong: { line: 'pass.riddle.wrong', go: [
        { ap: 'ask', say: 'pass.riddle.clue', label: 'Give them a clue', to: 'late' },
        { ap: 'jest', say: 'pass.riddle.nope', to: 'again' },
        { ap: 'tale', say: 'pass.riddle.answer', label: 'Tell them the answer', to: 'told' },
      ] },
      again: { line: 'pass.riddle.again', go: [
        { ap: 'ask', say: 'pass.riddle.clue', label: 'Give them a clue', to: 'late' },
        { ap: 'tale', say: 'pass.riddle.answer', label: 'Put them out of their misery', to: 'told' },
      ] },
      late: { line: 'pass.riddle.late', go: [
        { ap: 'warm', say: 'There! I knew you had it in you.', to: 'won' },
        { ap: 'ask', say: 'Your turn. Stump me, if you can.', to: 'theirs' },
      ] },
      told: { line: 'pass.riddle.groan', go: [
        { ap: 'ask', say: 'Your turn. Stump me, if you can.', to: 'theirs' },
        { ap: 'jest', say: 'Don\'t feel bad. A king got that one wrong once. Twice, actually.', to: 'king' },
        { ap: 'comfort', say: 'It\'s a hard one. Nobody gets it first time.', to: 'end' },
      ] },
      king: { line: 'pass.riddle.king', end: true },
      won: { line: 'pass.riddle.won', go: [
        { ap: 'ask', say: 'Your turn, then. Do your worst.', to: 'theirs' },
        { ap: 'jest', say: 'Beginner\'s luck. I demand a rematch.', to: 'rematch' },
      ] },
      lucky: { line: 'pass.riddle.lucky', go: [
        { ap: 'ask', say: 'Prove it, then. Stump me.', to: 'theirs' },
        { ap: 'warm', say: 'I\'m only teasing. Well guessed.', to: 'end' },
      ] },
      rematch: { line: 'pass.riddle.rematch', end: true },
      theirs: { line: 'pass.riddle.theirs', go: [
        { ap: 'jest', say: 'pass.riddle.wizwrong', to: 'gloat' },
        { ap: 'ask', say: 'pass.riddle.wizright', to: 'stumped' },
        { ap: 'listen', say: '*You think about it for a very long time.*', label: 'Think about it. For a long time.', to: 'giveup' },
      ] },
      gloat: { line: 'pass.riddle.gloat', fx: { joke: { k: 'phr.riddle', t: 'The wizard guessed "{phrRidWrong}". It was {phrRidThemA}.' } }, go: [
        { ap: 'warm', say: 'You got me fair and square, {name}.', to: 'end' },
        { ap: 'jest', say: 'I was testing you. To see if you knew.', to: 'testing' },
      ] },
      testing: { line: 'pass.riddle.testing', end: true },
      stumped: { line: 'pass.riddle.stumped', fx: { respect: 0.01 }, end: true },
      giveup: { line: 'pass.riddle.giveup', fx: { fond: 0.01 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.riddle.open', [
    { text: ['Riddle me this, {name}. Or are you frightened?', 'Fancy a riddle, {name}? Winner gets the bragging.', 'I\'ve a riddle that\'s stumped kings, {name}. Care to try?'] },
    kid('Do you like riddles, {name}? I\'ve a good one.', 'I bet you can\'t guess my riddle, {name}.'),
    tm('proud', 'They say you\'re the sharpest on the lane, {name}. Shall we test it?'),
    tm('witty', 'A battle of wits, {name}? I\'ll go easy on you. A bit.'),
  ]);
  lines('pass.riddle.ready', [
    { text: ['Go on, then. I\'m good at riddles. I think.', 'Ooh. All right. Ask away.', 'A riddle? Go on.'] },
    tm('cheerful', 'Ooh, yes! I love a riddle! Give me a hard one!', 'A riddle! Go on, go on!'),
    tm('ornery', 'Riddles. Waste of a good afternoon. ...Go on, then.', 'If it\'s a daft one, I\'m not answering.'),
    tm('shy', 'Oh... I\'m not very good at them. But all right.', '*nods, a bit nervously*'),
    tm('curious', 'Yes! Yes. Wait, let me get comfortable. Right. Go.', 'Riddles are my favourite. Well, one of my favourites. Go!'),
    tm('dreamy', 'I like riddles. They\'re like little locked boxes.', 'Oh, a riddle. Like in the old stories. Go on.'),
    tm('witty', 'Frightened? Of a wizard\'s riddle? Do your worst.', 'Fire away. I\'ve been sharpening my wits all morning. On a whetstone.'),
    tm('proud', 'I\'ve never met a riddle I couldn\'t crack. Go on.', 'Kings, you say. I\'m better than a king at riddles.'),
    tm('gloomy', 'I\'ll get it wrong. I always do. Go on.', 'All right. Don\'t expect much.'),
    kid('YES! Riddles! I know LOADS of riddles!', 'Is it about a dragon? Go on!'),
    rift('A puzzle protocol. Nice. Input your query.', 'Riddles. Old-school. I\'m in.'),
    elder('I\'ve heard them all, you know. Try me.', 'At my age the old ones come back. Go on.'),
  ]);
  lines('pass.riddle.pose', [{ text: ['{PhrRidQ}', 'Here it is. {PhrRidQ}', 'Listen carefully. {PhrRidQ}', 'Riddle me this: {phrRidQl}'] }]);
  lines('pass.riddle.easy', [{ text: ['An easy one to warm up. What has a shell and lives in the garden, very slowly?', 'A gentle one first. What carries its house on its back and leaves a silver trail?'] }]);
  lines('pass.riddle.warmup', [
    { text: ['A snail. Oh, that\'s too easy. Give me a real one.', 'That\'s a snail! Too easy. I\'m insulted. A bit.'] },
    tm('proud', 'Please. Insulting. Give me a proper one.'),
    tm('ornery', 'Is that it? I\'m not a baby.'),
    tm('shy', '...Is it a snail? It\'s a snail. Oh good.'),
    kid('A SNAIL! I got it! I\'m the best at riddles!'),
  ]);
  lines('pass.riddle.right', [
    { text: ['Hmm... {PhrRidA}? It\'s {phrRidA}, isn\'t it?', 'Wait... wait... {phrRidA}!', '{PhrRidA}. It has to be {phrRidA}.'] },
    tm('cheerful', '{PhrRidA}! Is it? It is! Oh, I\'m clever today!'),
    tm('ornery', '{PhrRidA}. Obviously. Next.'),
    tm('shy', '...Is it {phrRidA}? Sorry. Is it?'),
    tm('curious', 'Ooh, wait, wait. {PhrRidA}! Is it? I think it is!'),
    tm('dreamy', '{PhrRidA}. It came to me like a bird landing.'),
    tm('witty', '{PhrRidA}. Next you\'ll ask me what\'s green and goes "moo".'),
    tm('proud', '{PhrRidA}. Give me a hard one next time.'),
    tm('gloomy', '{PhrRidA}? ...I\'m never right. Am I right?'),
    kid('{PhrRidA}! {PhrRidA}! I got it!', 'I KNOW! It\'s {phrRidA}!'),
    rift('Processing... {phrRidA}. Final answer.'),
    elder('{PhrRidA}. I had that one off my grandfather.'),
  ]);
  lines('pass.riddle.wrong', [
    { text: ['Is it... {phrRidGuess}?', 'Oh, I know! {PhrRidGuess}!', 'Hm. Hmm. {PhrRidGuess}. Is it?'] },
    tm('cheerful', 'Ooh! Ooh! {PhrRidGuess}! No? Is it?'),
    tm('ornery', 'It\'s {phrRidGuess}. Don\'t tell me it isn\'t.'),
    tm('shy', '...{PhrRidGuess}? Sorry. That\'s probably wrong.'),
    tm('curious', 'Is it {phrRidGuess}? No, wait. Yes. {PhrRidGuess}.'),
    tm('dreamy', 'Is it... {phrRidGuess}? That\'s what I see when I close my eyes.'),
    tm('witty', 'Easy. {PhrRidGuess}. I\'ll take my winnings in cake.'),
    tm('proud', 'It\'s {phrRidGuess}. I\'m never wrong about these.'),
    tm('gloomy', 'I don\'t know. {PhrRidGuess}. I told you I\'d be bad at it.'),
    kid('IS IT {phrRidGuess}? It is! Is it?', '{PhrRidGuess}! No, a potato! No, {phrRidGuess}!'),
    rift('Running the numbers... {phrRidGuess}?'),
  ]);
  lines('pass.riddle.nope', [{ text: ['Ha! No. Though I\'d like to see that.', 'Not even close. Delightful, but not close.', 'No! But I\'ll remember that one for later.'] }]);
  lines('pass.riddle.again', [
    { text: ['Then it\'s... no. Is it... no. I don\'t know! Tell me!', 'Bother. Is it a teapot? It\'s usually a teapot.'] },
    tm('ornery', 'Then it\'s a daft riddle and I\'m not playing.'),
    tm('proud', 'I... it\'s on the tip of my tongue. Don\'t say it. Don\'t you say it.'),
    tm('cheerful', 'A badger? A bucket? A badger in a bucket? I give up! No I don\'t!'),
    tm('shy', '...I don\'t know. Sorry. I\'m not very good at this.'),
    tm('curious', 'Wait, give me the riddle again. Slowly. No, a clue. A clue!'),
    tm('witty', 'My second guess is the same as my first, only louder.'),
    tm('gloomy', 'See? I said. Hopeless.'),
    kid('A DRAGON! Is it a dragon? It\'s a dragon. Is it?'),
  ]);
  lines('pass.riddle.clue', [{ text: ['A clue, then. {PhrRidClue}', 'Here\'s a clue. {PhrRidClue}', 'Think of this: {phrRidClue}'] }]);
  lines('pass.riddle.answer', [{ text: ['It\'s {phrRidA}, {name}.', 'The answer is {phrRidA}. Of course it is.', '{PhrRidA}! It\'s always the obvious thing.'] }]);
  lines('pass.riddle.late', [
    { text: ['Oh! OH! {PhrRidA}! It\'s {phrRidA}!', 'Of course! {PhrRidA}. I was nearly there.'] },
    tm('cheerful', '{PhrRidA}! Oh, that\'s lovely! Ask me another!'),
    tm('ornery', 'Hmph. {PhrRidA}. I\'d have got it without the clue.'),
    tm('shy', '...{PhrRidA}? Oh. Oh, it is. Thank you.'),
    tm('curious', '{PhrRidA}! Oh, that\'s clever. Who made that up?'),
    tm('proud', '{PhrRidA}. I had it already. I was being polite.'),
    tm('witty', '{PhrRidA}! I knew it was {phrRidA}. I was building suspense.'),
    tm('gloomy', '{PhrRidA}. Oh. It was easy, wasn\'t it. It\'s always easy, after.'),
    kid('{PhrRidA}! I GOT IT! Well, you helped. But I GOT it!'),
  ]);
  lines('pass.riddle.groan', [
    { text: ['{PhrRidA}! Oh, of course! I knew that.', 'Oh, bother. {PhrRidA}. It\'s so simple when you say it.'] },
    tm('ornery', 'That\'s a daft riddle. Whoever made that up wants a talking-to.'),
    tm('cheerful', 'Ha! {PhrRidA}! Oh, that\'s a good one. I\'m telling everyone.'),
    tm('shy', '...Oh. That\'s clever.'),
    tm('curious', '{PhrRidA}! Oh! Can I use that one on my friends?'),
    tm('proud', 'I\'d have got there. Given a moment.'),
    tm('witty', '{PhrRidA}. Of course. I was thinking too cleverly.'),
    tm('dreamy', 'Oh, that\'s lovely. I\'ll never look at {phrRidA} the same way.'),
    tm('gloomy', 'I\'d never have got that. Never.'),
    kid('AWW. That\'s not fair! ...Tell me another!'),
  ]);
  lines('pass.riddle.king', [
    { text: ['A king? Which king? You\'re making that up.', 'Ha! Then I\'m in good company.'] },
    tm('proud', 'Kings aren\'t all that clever, I find.'),
    kid('A REAL king? Did he have a crown? Did he cry?'),
  ]);
  lines('pass.riddle.won', [
    { text: ['Ha! I win! I love winning.', 'Another! I\'m on a streak.'] },
    tm('cheerful', 'I got it! I GOT it! Oh, wait till I tell everyone!'),
    tm('ornery', 'Hm. Well. I\'m not as daft as I look.'),
    tm('shy', '*grins and tries to hide it*'),
    tm('proud', 'Naturally. I\'ve a head for these things.'),
    tm('gloomy', 'I won? I never win. Huh.'),
    tm('witty', 'Thank you, thank you. I\'ll be here all week.'),
    kid('I WON! I\'m cleverer than a WIZARD!'),
    rift('Puzzle solved. Achievement unlocked.'),
  ]);
  lines('pass.riddle.lucky', [
    { text: ['Lucky? That was brains, that was.', 'Luck! I\'ll show you luck.'] },
    tm('proud', 'Luck has nothing to do with it, I assure you.'),
    tm('ornery', 'Lucky. Hmph. You\'d not say that to a dwarf.'),
    tm('witty', 'Luck is what clever folk call it when they\'re beaten.'),
    kid('Was NOT luck! Was brains! I\'ve got loads of brains!'),
  ]);
  lines('pass.riddle.rematch', [
    { text: ['Any time, wizard. Any time.', 'Next time. And I\'ll be ready.'] },
    tm('witty', 'A rematch! Bring your best. And a snack.'),
    kid('Tomorrow! Promise! I\'ll practise!'),
  ]);
  lines('pass.riddle.theirs', [
    { text: ['All right. Here\'s one my gran used to ask. {PhrRidThemQ}', 'My turn! {PhrRidThemQ}', 'Right. Try this. {PhrRidThemQ}'] },
    tm('witty', 'Ha! Brace yourself. {PhrRidThemQ}'),
    tm('proud', 'This one\'s stumped everyone on the lane. {PhrRidThemQ}'),
    tm('shy', '...I only know one. {PhrRidThemQ}'),
    tm('ornery', 'Fine. {PhrRidThemQ} Go on. Clever clogs.'),
    kid('My turn! My turn! {PhrRidThemQ}'),
    rift('Okay. Old one from the hill-folk. {PhrRidThemQ}'),
    elder('This one\'s older than your hat. {PhrRidThemQ}'),
  ]);
  lines('pass.riddle.wizwrong', [{ text: ['Easy. It\'s {phrRidWrong}.', 'Is it... {phrRidWrong}?', '{PhrRidWrong}! Final answer.'] }]);
  lines('pass.riddle.wizright', [{ text: ['Is it {phrRidThemA}?', '{PhrRidThemA}. I\'ve met that one before.', 'I think... {phrRidThemA}.'] }]);
  lines('pass.riddle.gloat', [
    { text: ['{PhrRidWrong}! Ha! It\'s {phrRidThemA}, you great tall thing.', 'Wrong! It\'s {phrRidThemA}. Oh, I\'m telling everyone about this.'] },
    tm('cheerful', 'HA! {PhrRidWrong}! Oh, I\'m going to cry. It\'s {phrRidThemA}!'),
    tm('ornery', 'Wrong. It\'s {phrRidThemA}. Some wizard.'),
    tm('shy', '*giggles* ...It\'s {phrRidThemA}. Sorry. {PhrRidWrong} was good, though.'),
    tm('proud', '{PhrRidThemA}. I did say it had stumped everyone. Now it\'s stumped a wizard.'),
    tm('witty', '{PhrRidWrong}! I\'ll have that carved over my door. It was {phrRidThemA}.'),
    tm('gloomy', 'It\'s {phrRidThemA}. ...Ha. I won something.'),
    kid('WRONG! It\'s {phrRidThemA}! I beat a WIZARD!'),
    rift('Wrong. It\'s {phrRidThemA}. Posting this on the Relay. Kidding. Mostly.'),
  ]);
  lines('pass.riddle.testing', [
    { text: ['Testing! Ha! You\'re a poor loser, wizard.', 'Of course you were. Of course.'] },
    tm('witty', 'And did I pass? Only you didn\'t.'),
    kid('You were NOT. You got it WRONG. Ha!'),
  ]);
  lines('pass.riddle.stumped', [
    { text: ['How did you... it took my uncle a week!', 'Oh, bother. I thought I had you.'] },
    tm('proud', 'Hm. Well. Nobody else got it.'),
    tm('ornery', 'Hmph. Wizards. Know-alls, the lot of you.'),
    tm('cheerful', 'Oh, you\'re good! You\'re very good!'),
    tm('shy', '...Oh. You\'re clever.'),
    kid('Aww! How did you KNOW? Are you magic? You\'re magic.'),
  ]);
  lines('pass.riddle.giveup', [
    { text: ['Give up? Ha! It\'s {phrRidThemA}! A wizard, stumped!', 'You\'ve gone quiet. It\'s {phrRidThemA}! I\'ve stumped a wizard!'] },
    tm('cheerful', 'You\'re thinking so hard your hat\'s wobbling! It\'s {phrRidThemA}!'),
    tm('ornery', 'Took you long enough to not know. It\'s {phrRidThemA}.'),
    tm('witty', 'I could hear the gears. It\'s {phrRidThemA}. Take your time getting over it.'),
    kid('Give up? GIVE UP? It\'s {phrRidThemA}! HA!'),
  ]);

  // =====================================================================================
  // A war of compliments
  addThread({
    id: 'pass.compliment', light: true, ap: 'warm', label: 'A compliment or two', when: notTot, open: { warm: 'pass.compliment.open' },
    beats: {
      start: { line: 'pass.compliment.back', go: [
        { ap: 'warm', say: 'pass.compliment.up', label: 'Pay a bigger compliment', to: 'escalate' },
        { ap: 'jest', say: 'pass.compliment.silly', to: 'silly' },
        { ap: 'share', say: 'I mean it, you know. The lane\'s kinder for you being on it.', to: 'true' },
      ] },
      escalate: { line: 'pass.compliment.escalate', go: [
        { ap: 'warm', say: 'pass.compliment.final', label: 'Your finest compliment', to: 'concede' },
        { ap: 'jest', say: 'I surrender. Your compliments have defeated me.', to: 'victory' },
        { ap: 'listen', say: '*You bow deeply.*', label: 'Bow deeply', to: 'victory' },
      ] },
      silly: { line: 'pass.compliment.sillyback', go: [
        { ap: 'jest', say: 'pass.compliment.sillier', to: 'giggles' },
        { ap: 'warm', say: 'Ha! All right. Shall we call it a draw?', to: 'draw' },
      ] },
      true: { line: 'pass.compliment.true', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'Every word.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'jest', say: 'Now you say something nice about me. I\'ll wait.', to: 'turn' },
      ] },
      turn: { line: 'pass.compliment.turn', end: true },
      concede: { line: 'pass.compliment.concede', end: true },
      victory: { line: 'pass.compliment.victory', end: true },
      giggles: { line: 'pass.compliment.giggles', fx: { joke: { k: 'phr.compliment', t: 'A war of silly compliments, and neither of you won.' } }, end: true },
      draw: { line: 'pass.compliment.draw', end: true },
    },
    end: { fond: 0.03 },
  });
  lines('pass.compliment.open', [
    { text: ['That\'s a fine waistcoat, {name}. The finest on the lane.', 'You\'ve the best laugh in the valley, {name}. Everyone says so.', 'Your door\'s the brightest green in Thistledown, {name}.'] },
    kid('You\'re the fastest runner I\'ve seen all week, {name}.', 'That\'s a very fine stick you\'ve got, {name}. A champion stick.'),
    rift('That visor\'s very smart, {name}. Very... luminous.'),
    elder('You\'ve kept your looks, {name}. Better than I have.'),
    { if: { job: 'baker' }, text: ['Your bread is the talk of the Shire, {name}.'] },
    { if: { pastime: (p) => !!p }, text: ['They say there\'s nobody in the valley better at {pastimeWord} than you, {name}.'] },
  ]);
  lines('pass.compliment.back', [
    { text: ['Oh, get away! Your hat\'s the finest in the Shire.', 'Me? Pfft. You\'ve the kindest eyes of anyone I know.'] },
    tm('cheerful', 'Me? Never! YOUR hat is the finest hat in all the Shire!', 'Oh, you! Your beard is the most magnificent beard I\'ve ever seen!'),
    tm('proud', 'I know. But your staff, wizard, is nearly as well kept as my step.', 'True. And your robes are very nearly as clean as mine.'),
    tm('shy', '*goes pink* Oh... your... your beard is very nice. Sorry.', '...Thank you. You\'re... very tall. In a nice way.'),
    tm('ornery', 'Hmph. Your boots are clean. For a wizard.', 'Flattery. ...Your hat\'s not bad. Don\'t let it go to your head. Ha. Head.'),
    tm('witty', 'Finest on the lane? You should see me on Highday. Your beard\'s not bad either.', 'And you\'ve the best eyebrows this side of the Misty Mountains.'),
    tm('gloomy', 'It\'s very old, really. ...Your hat\'s nice, though.', 'Nobody\'s said that in years. ...You\'ve a nice voice.'),
    tm('dreamy', 'Your eyes are like a lake with a lantern in it.', 'Oh. You\'ve a face like an old map. Full of roads.'),
    tm('curious', 'Do you mean it? What\'s the finest thing about me, then? No, I\'ll go first: your eyebrows.'),
    kid('YOU\'RE the best wizard! The BEST!', 'And you\'re the TALLEST person in the WHOLE WORLD!'),
    rift('Thanks. Your fireworks are better than anything in Neverdark. And that\'s saying a lot.'),
    elder('Ha! Your beard\'s whiter than mine. Wiser too, I dare say.'),
  ]);
  lines('pass.compliment.up', [{ text: ['Nonsense! Your scones are spoken of in Bree.', 'My hat is nothing beside your kindness, {name}. Nothing.', 'They talk of your garden as far as the Mountain, {name}.'] }]);
  lines('pass.compliment.escalate', [
    { text: ['Well! YOUR fireworks are spoken of in the Mountains!', 'Oh, stop. Your kindness is spoken of by the very birds, wizard!'] },
    tm('cheerful', 'Never! They SING of your fireworks in the Mountains! Sing!'),
    tm('proud', 'Quite so. And your wisdom, wizard, is very nearly a match for my pastry.'),
    tm('shy', '*very pink now* ...You\'re the nicest person I\'ve ever met. There. I said it.'),
    tm('ornery', 'Flannel. ...But your staff\'s very straight. I\'ll give you that.'),
    tm('witty', 'Then your hat, wizard, is spoken of by the hats of Bree. In envy.'),
    tm('gloomy', 'Folk say anything. ...You\'re the best thing that\'s happened here in years.'),
    tm('dreamy', 'And the stars come out early just to see you walk up the lane.'),
    tm('curious', 'Really? Who says so? Did they say anything else? You\'re the cleverest person I know. Who says so?'),
    kid('Well YOU\'RE the best at EVERYTHING! Times a hundred!'),
  ]);
  lines('pass.compliment.final', [{ text: ['When the sun comes up, {name}, I\'m told it checks you\'re up first.', 'If the Shire had a crown, {name}, it would want to wear you.'] }]);
  lines('pass.compliment.concede', [
    { text: ['I... I give up. You win. Nobody can top that.', 'Oh, stop! You win! My ears are burning.'] },
    tm('proud', 'Hm. Well. That\'s... I\'ll allow that one. A draw. No, you win. Just this once.'),
    tm('shy', '*hides face in hands* You win. You win.'),
    tm('ornery', 'Daft old wizard. ...You win. Don\'t tell anyone.'),
    kid('That\'s not FAIR. You\'re too good at it.'),
  ]);
  lines('pass.compliment.victory', [
    { text: ['Ha! I win! The compliment champion of Thistledown!', 'Victory! Bring me a cake. A victory cake.'] },
    tm('cheerful', 'I won! I won a compliment war! Is there a ribbon?'),
    tm('proud', 'As expected. Do try again some time.'),
    tm('witty', 'I accept your surrender. Terms: one seed-cake, delivered warm.'),
    kid('I WIN! I\'m the best at saying nice things!'),
  ]);
  lines('pass.compliment.silly', [{ text: ['Your ears could hear a mouse sneeze in the next valley, {name}.', 'Your feet are so fine and furry, {name}, sheep look at them in envy.', 'Your smile could ripen tomatoes at twenty paces, {name}.'] }]);
  lines('pass.compliment.sillyback', [
    { text: ['Ha! Well, your beard could stuff a mattress for a family of six!', 'Ha! And your nose could cut cheese!'] },
    tm('cheerful', 'Ha! And YOUR beard could keep a whole family of wrens in a cold snap!'),
    tm('witty', 'Ha! Then your hat is so tall, the moon has to duck.'),
    tm('ornery', 'My ears are perfectly normal. ...Your beard\'s got a bird\'s nest in it.'),
    tm('shy', '*laughs, despite trying not to*'),
    kid('Your BEARD could be a SHEEP!'),
    rift('Your staff could pick up signal from Neverdark. Probably. Actually, has anyone checked?'),
  ]);
  lines('pass.compliment.sillier', [{ text: ['And your laugh could curdle the cream. In a good way.', 'Your cooking could make a dragon give up gold for gravy.'] }]);
  lines('pass.compliment.giggles', [
    { text: ['*can\'t stop laughing* Stop! Stop it!', 'Ha! Oh, my sides. Truce. Truce!'] },
    tm('ornery', 'Hmph. ...Ha. Ha. All right, that was funny.'),
    kid('*rolls on the grass laughing*'),
  ]);
  lines('pass.compliment.draw', [{ text: ['A draw. For now.', 'A draw! But I\'m thinking up better ones for next time.'] }, tm('proud', 'A draw. I\'ll let it stand. Generously.')]);
  lines('pass.compliment.true', [
    { text: ['...Oh. That\'s... thank you. Really.', 'You do mean it, don\'t you. Oh.'] },
    tm('shy', '...Nobody\'s ever said that. Thank you.'),
    tm('gloomy', 'Kinder? Me? ...I\'ll think about that. Thank you.'),
    tm('ornery', '...Hm. Well. That\'s a nice thing to say. Hmph.'),
    tm('proud', 'I do try, you know. It\'s nice to be noticed.'),
    tm('cheerful', 'Oh, now you\'ve gone and made me tear up! You!'),
    tm('dreamy', 'I\'ll keep that. Like a pressed flower.'),
    kid('*goes quiet and very happy*'),
    rift('That\'s... yeah. That\'s a good signal to get. Thanks.'),
  ]);
  lines('pass.compliment.turn', [
    { text: ['You\'re... very good at fireworks. And listening. Mostly listening.', 'You\'re the kindest wizard I know. The only wizard I know. Still.'] },
    tm('ornery', 'You\'re tall. There. That\'s a fact, not a compliment.'),
    tm('witty', 'You have excellent taste in hobbits.'),
    kid('You\'re the BEST. And your hat\'s pointy.'),
  ]);

  // =====================================================================================
  // A silly wager
  addThread({
    id: 'pass.wager', light: true, ap: 'jest', label: 'A silly wager', when: (F) => F.band !== 'toddler', open: { jest: 'pass.wager.open' },
    beats: {
      start: { line: 'pass.wager.take', go: [
        { ap: 'ask', say: 'Done. What will you stake?', to: 'stakes' },
        { ap: 'jest', say: 'Double or nothing, before we\'ve even started.', to: 'double' },
        { ap: 'warm', say: 'For the fun of it, then. Shake on it.', to: 'watch' },
      ] },
      stakes: { line: 'pass.wager.stakes', go: [
        { ap: 'warm', say: 'Done. And {phrBetStake} from me if I lose.', to: 'watch' },
        { ap: 'jest', say: 'And loser sings on the Badger\'s table.', to: 'watch', fx: { flag: 'phr.song' } },
      ] },
      double: { line: 'pass.wager.double', go: [
        { ap: 'warm', say: 'Shake on it, then.', to: 'watch' },
        { ap: 'ask', say: 'Double of what, exactly?', to: 'stakes' },
      ] },
      watch: { line: 'pass.wager.watch', who: 'aside', go: [
        { ap: 'listen', say: '*{frag:fill}*', label: 'Wait and see', to: [{ to: 'won', need: { if: { phrBetWin: true } } }, 'lost'] },
        { ap: 'jest', say: 'pass.wager.cheer', label: 'Cheer it on', to: [{ to: 'won', need: { if: { phrBetWin: true } } }, 'lost'] },
        { ap: 'ask', say: 'Shall we call it off while we\'re friends?', to: 'off' },
      ] },
      won: { line: 'pass.wager.won', fx: { owe: 1 }, go: [
        { ap: 'warm', say: 'Keep your stake. The fun was the thing.', to: 'gracious' },
        { ap: 'jest', say: 'I\'ll take my winnings warm, please.', to: 'collect' },
        { ap: 'share', say: 'pass.wager.secret', label: 'Admit you had help', to: 'cheat' },
      ] },
      lost: { line: 'pass.wager.lost', fx: { owe: -1 }, go: [
        { ap: 'jest', say: '*You climb onto the nearest wall and sing, as promised.*', label: 'Sing on a wall, as promised', to: 'sing', need: { flag: 'phr.song' } },
        { ap: 'warm', say: 'Fair and square. I\'ll pay up.', to: 'pay' },
        { ap: 'jest', say: 'pass.wager.excuse', label: 'Make excuses', to: 'excuse' },
        { ap: 'ask', say: 'Best of three?', to: 'three' },
      ] },
      sing: { line: 'pass.wager.sing', fx: { fond: 0.03, joke: { k: 'phr.wallsong', t: 'The wizard lost a wager and sang on a wall.' } }, end: true },
      off: { line: 'pass.wager.off', end: true },
      gracious: { line: 'pass.wager.gracious', fx: { fond: 0.02 }, end: true },
      collect: { line: 'pass.wager.collect', end: true },
      cheat: { line: 'pass.wager.cheat', fx: { joke: { k: 'phr.wager', t: 'The wizard won a wager and swore it was fair. It wasn\'t.' } }, end: true },
      pay: { line: 'pass.wager.pay', fx: { trust: 0.01 }, end: true },
      excuse: { line: 'pass.wager.excused', end: true },
      three: { line: 'pass.wager.three', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.wager.open', [{ text: ['{PhrBetQ}', 'Fancy a flutter, {name}? {PhrBetQ}', 'Here\'s a wager for you, {name}. {PhrBetQ}'] }]);
  lines('pass.wager.take', [
    { text: ['Ha! You\'re on.', 'A wager? Go on, then. I could do with winning something.'] },
    tm('cheerful', 'Ooh, a bet! You\'re on! I love a bet!'),
    tm('ornery', 'Gambling. In broad daylight. ...You\'re on, and you\'ll lose.'),
    tm('shy', 'I don\'t usually bet. ...All right. A little one.'),
    tm('curious', 'Ooh. What are the odds, do you think? Never mind. You\'re on!'),
    tm('dreamy', 'I\'ll bet against you. Somebody has to believe in the underdog. Under-snail. Whatever it is.'),
    tm('witty', 'Taking money off a wizard? It\'d be rude not to.'),
    tm('proud', 'I never lose a wager. Ask anyone. You\'re on.'),
    tm('gloomy', 'I\'ll lose. I always lose. ...Go on, then.'),
    kid('YES! A bet! What do I win? Do I win sweets?', 'You\'re on! I\'m really lucky. I found a penny once.'),
    rift('Placing my bet. No algorithm, no odds. Just vibes. Love it.'),
    elder('I\'ve been betting against wizards since before you came. Mostly losing. Go on.'),
  ]);
  lines('pass.wager.stakes', [
    { text: ['A pie. A good one. Not my best one, mind.', 'A seed-cake. From the Store. Well, from my larder, via the Store.'] },
    { if: { job: 'baker' }, text: ['A loaf. My second-best loaf. My best one\'s spoken for.'] },
    { if: { job: 'brewer' }, text: ['A jug of the new brew. You\'ll want to sit down for it.'] },
    { if: { job: 'innkeeper' }, text: ['A pint at the Badger, on the house. Don\'t tell the house.'] },
    { if: { job: 'grower' }, text: ['A pouch of my best leaf. The stuff I keep for myself.'] },
    { if: { job: 'orchardist' }, text: ['A basket of apples. The good ones. Not the windfalls.'] },
    { if: { job: 'herder' }, text: ['A round of cheese. A small round. A wedge.'] },
    tm('proud', 'I\'ll stake my good name. And a tart. Mostly the tart.'),
    tm('ornery', 'Nothing. I don\'t need to stake anything. I\'m not going to lose.'),
    tm('shy', '...A biscuit? Is a biscuit enough?'),
    tm('witty', 'My dignity. Oh, wait, I spent that years ago. A tart, then.'),
    kid('My best marble! No. My SECOND best marble.', 'A worm! I\'ve got a really good worm.'),
    rift('A charge-cell. Fully charged. It\'s like money back home. Worth nothing here, though.'),
  ]);
  lines('pass.wager.double', [
    { text: ['Double? We haven\'t started! ...Done.', 'Ha! You\'re a wild one, wizard. Double it is.'] },
    tm('ornery', 'Double nothing is nothing. ...Fine.'),
    tm('witty', 'Double or nothing on a bet we haven\'t made. I like the way you think.'),
    kid('DOUBLE! Is that two? I want two!'),
  ]);
  lines('pass.wager.watch', [{ text: ['{PhrBetWatch}'] }]);
  lines('pass.wager.cheer', [{ text: ['Come on, come on!', 'Go on! Go on! You can do it!', 'Steady... steady...'] }]);
  lines('pass.wager.won', [
    { text: ['Well, I\'ll be! You won. I\'ll pay up, then.', 'You won! Bother. Bother and drat.'] },
    tm('cheerful', 'You won! Oh, well done! I\'m glad, really. A bit cross. Mostly glad.'),
    tm('ornery', 'That was rigged. That was wizardry. I\'ll pay up, but it was rigged.', 'You and that snail were in league. I saw the look it gave you.'),
    tm('shy', 'Oh. You won. ...Well done.'),
    tm('curious', 'You won! How did you know? Did you know? Can wizards see the future?'),
    tm('dreamy', 'You won. Funny. I was sure the world was on my side today.'),
    tm('witty', 'I\'ve been robbed. In broad daylight. By a hat.'),
    tm('proud', 'An anomaly. I never lose. I\'ll pay, of course. With dignity.'),
    tm('gloomy', 'See? I lose. I always lose. I\'ll pay up.'),
    kid('NOOO! That\'s not FAIR! ...Best of three?', 'You CHEATED. Did you cheat? You\'re a wizard, so you cheated.'),
    rift('Loss registered. Respect, wizard.'),
  ]);
  lines('pass.wager.lost', [
    { text: ['Ha! I win! Pay up, wizard. I\'ll take {phrBetStake}.', 'I won! You owe me, wizard. Don\'t you forget it.'] },
    tm('cheerful', 'I WON! I never win anything! Oh, this is the best day!'),
    tm('ornery', 'Ha. Told you. Pay up.'),
    tm('shy', 'I... I won? Oh! I won!'),
    tm('curious', 'I won! Wait, did you let me win? Did you? Tell me.'),
    tm('dreamy', 'I won. I knew I would. I had a feeling, like a warm wind.'),
    tm('witty', 'And the wizard falls! Mark the day. I\'m having it embroidered.'),
    tm('proud', 'Naturally. I never lose. You\'ll find I\'m rarely wrong.'),
    tm('gloomy', 'I won? Something\'s wrong. Nothing goes right. ...I won!'),
    kid('I WON! I beat the WIZARD! Pay me! In SWEETS!', 'YESSSS! I\'m the champion of betting!'),
    rift('Winner! I want that in writing. Or on the Relay.'),
  ]);
  lines('pass.wager.secret', [{ text: ['I should tell you. The snail and I go back a long way.', 'I may have had a word with it beforehand.'] }]);
  lines('pass.wager.excuse', [{ text: ['The wind was against me.', 'I wasn\'t ready. My hat was in my eyes.', 'That was a practice round. Everyone knows the first one\'s a practice.'] }]);
  lines('pass.wager.excused', [
    { text: ['Ha! Excuses! Pay up, wizard.', 'Oh, that\'s a feeble one. Even for a wizard.'] },
    tm('witty', 'A wizard making excuses. I\'ll have that painted.'),
    tm('ornery', 'Excuses. Pay up.'),
    kid('You LOST. You\'re just a LOSER. ...Sorry. But you are.'),
  ]);
  lines('pass.wager.three', [{ text: ['Best of three? Not on your life. I\'m quitting while I\'m ahead.', 'Another time. I\'m enjoying winning too much.'] }, tm('proud', 'No. I shall retire undefeated.'), kid('NO. I won. I\'m keeping it.')]);
  lines('pass.wager.sing', [
    { text: ['*laughs till they cry* Louder! LOUDER!', 'Ha! Folk are coming out of their holes to look! Keep going!'] },
    tm('ornery', 'Ha! Hmph. Ha! Get down before you fall, you daft old thing.'),
    tm('shy', '*hides behind their hands, peeking through the fingers*'),
    tm('proud', 'Very good. Bow. Now get down, people are staring. At me.'),
    kid('*dances on the spot* SING THE BIT ABOUT THE FROG!'),
  ]);
  lines('pass.wager.off', [{ text: ['Coward! ...Probably wise.', 'Called off! Ha. I\'d have won.'] }, tm('ornery', 'Hmph. Scared, were you?')]);
  lines('pass.wager.gracious', [{ text: ['Oh, you\'re a gentleman. Wizard. Gentle-wizard.', 'You\'re kind. I\'ll bring you one anyway.'] }, tm('proud', 'I\'ll pay my debts, thank you. But it\'s kind of you.'), kid('So I don\'t have to give you my marble? YAY!')]);
  lines('pass.wager.collect', [{ text: ['Warm! Cheek! ...I\'ll warm it.', 'Ha! I\'ll bring it round. Cold.'] }]);
  lines('pass.wager.cheat', [{ text: ['I KNEW it! I knew it was rigged!', 'You... you wizard!'] }, tm('cheerful', 'Ha! Oh, you scoundrel! I love it!'), tm('ornery', 'Cheat! I knew it. I\'m telling everyone.')]);
  lines('pass.wager.pay', [{ text: ['I\'ll hold you to that. With interest.', 'Good! I\'ll be expecting it.'] }, kid('Can I have it NOW? Now? Tomorrow, then?')]);

  // =====================================================================================
  // Guess what's in my pocket
  addThread({
    id: 'pass.pocket', light: true, ap: 'jest', label: 'Guess what\'s in my pocket', when: notTot, open: { jest: 'pass.pocket.open' },
    beats: {
      start: { line: 'pass.pocket.start', go: [
        { ap: 'jest', say: 'Three guesses. Go on.', to: 'guesses' },
        { ap: 'warm', say: 'pass.pocket.reveal', label: 'Show them', to: 'show' },
        { ap: 'tale', say: 'Ah, but where it came from is the real puzzle.', to: 'where' },
      ] },
      guesses: { line: 'pass.pocket.guesses', go: [
        { ap: 'warm', say: 'pass.pocket.reveal', label: 'Show them', to: 'show' },
        { ap: 'jest', say: 'Wrong, wrong, and very wrong.', to: 'more' },
      ] },
      more: { line: 'pass.pocket.more', go: [{ ap: 'warm', say: 'pass.pocket.reveal', label: 'Put them out of their misery', to: 'show' }] },
      where: { line: 'pass.pocket.where', go: [{ ap: 'warm', say: 'pass.pocket.reveal', label: 'Show them', to: 'show' }, { ap: 'jest', say: 'I\'m not saying. Guess.', to: 'guesses' }] },
      show: { line: 'pass.pocket.show', go: [
        { ap: 'tale', say: 'It came from {phrPocketWhere}.', to: 'story' },
        { ap: 'warm', say: 'For you, if you\'d like it.', to: 'gift', need: { if: { phrPocket: [0, 2, 3, 4, 9, 11] } } },
        { ap: 'jest', say: 'pass.pocket.nonsense', to: 'scoff' },
      ] },
      story: { line: 'pass.pocket.story', fx: { fond: 0.01 }, go: [{ ap: 'warm', say: 'For you, if you\'d like it.', to: 'gift', need: { if: { phrPocket: [0, 2, 3, 4, 9, 11] } } }, { ap: 'jest', say: 'Or I found it in a hedge. One of the two.', to: 'end' }] },
      gift: { line: 'pass.pocket.gift', fx: { fond: 0.03, drive: { bored: -0.1 } }, end: true },
      scoff: { line: 'pass.pocket.scoff', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.pocket.open', [{ text: ['Guess what I\'ve got in my pocket, {name}.', 'What have I got in my pocket, {name}? Three guesses.', 'I\'ve something in my pocket, {name}. Can you guess?'] }]);
  lines('pass.pocket.start', [
    { text: ['That\'s not a riddle! That\'s not fair!', 'Your pocket? How should I know what\'s in your pocket?'] },
    tm('cheerful', 'Ooh! Something nice? Is it something nice?'),
    tm('ornery', 'Not fair. That\'s not a proper question, that.'),
    tm('shy', 'Oh... I don\'t know. Something... small?'),
    tm('curious', 'Ooh. How big? Is it alive? Is it magic? Can I feel the outside?'),
    tm('dreamy', 'Something from far away, I bet. It\'s always something from far away.'),
    tm('witty', 'A wizard\'s pocket. Could be anything. Could be a small dragon. Could be lint.'),
    tm('proud', 'Hmph. I could guess, if I cared to. Which I might.'),
    tm('gloomy', 'Not a ring, I hope. Rings are always trouble in stories.'),
    kid('SWEETS! Is it sweets? Say it\'s sweets!', 'Is it a FROG? I\'d have a frog in my pocket.'),
    rift('Scanning... no. No scanner. Okay, I\'ll guess like a hill-hobbit.'),
  ]);
  lines('pass.pocket.guesses', [
    { text: ['String? A hanky? ...Nothing at all?', 'A pebble. A conker. A very small pie.', 'Pipe-weed, a button, and... crumbs?'] },
    tm('cheerful', 'A toffee! A ribbon! A baby rabbit!'),
    tm('ornery', 'Lint, more lint, and a hole.'),
    tm('curious', 'A map! A key! A letter from a king! Am I close? How close?'),
    tm('witty', 'Your other hat. Folded very small.'),
    tm('dreamy', 'A star. A bit of a star that fell. Is it?'),
    kid('A FROG. A SWEET. A FROG EATING A SWEET.'),
    rift('A battery. A cable. A cable for a battery. Old habits.'),
  ]);
  lines('pass.pocket.more', [{ text: ['Very wrong? How very wrong? Show me!', 'Oh, just show me, you dreadful old tease.'] }, kid('SHOW ME SHOW ME SHOW ME.')]);
  lines('pass.pocket.where', [{ text: ['Where it came from? Now I really want to know what it is.', 'Don\'t be mysterious. Show me. Then be mysterious.'] }, tm('curious', 'Oh, now you\'ve done it. I won\'t sleep. Show me!')]);
  lines('pass.pocket.reveal', [{ text: ['*You bring out {phrPocketItem}.*', '*From the depths of your pocket you bring out {phrPocketItem}.*'] }]);
  lines('pass.pocket.show', [
    { text: ['Oh! Well. I\'d never have guessed that.', 'Is that all? ...What is it for?', 'Fancy carrying that about!'] },
    { if: { phrPocket: 0 }, text: ['A conker! Oh, that\'s a beauty. Is it a champion?'] },
    { if: { phrPocket: 1 }, text: ['String! With knots in! What are the knots for?'] },
    { if: { phrPocket: 2 }, text: ['A toffee! A furry one. ...I\'d still eat it.'] },
    { if: { phrPocket: 3 }, text: ['Oh, that\'s lovely. A hole right through! Can you see through it?'] },
    { if: { phrPocket: 4 }, text: ['That\'s an enormous feather! What bird was that? Not a hen.'] },
    { if: { phrPocket: 5 }, text: ['A flower. Pressed. Oh, that\'s... that\'s someone\'s, isn\'t it?'] },
    { if: { phrPocket: 6 }, text: ['It\'s glowing! Why is it glowing? Is it meant to glow?'] },
    { if: { phrPocket: 7 }, text: ['A button. Not yours. Whose is it, then?'] },
    { if: { phrPocket: 8 }, text: ['A key! What does it open? It must open something.'] },
    { if: { phrPocket: 9 }, text: ['An acorn. You carry an acorn. Wizards are odd.'] },
    { if: { phrPocket: 10 }, text: ['A map! With a dragon on it! Is that a real dragon?'] },
    { if: { phrPocket: 11 }, text: ['A squib! Can I light it? Can I? Not now? Later?'] },
    { if: { phrPocket: 6, rift: true }, text: ['That\'s a transit ticket. From Neverdark. Where did you GET that?'] },
    { if: { stage: 'child', phrPocket: 11 }, text: ['A SQUIB! A real one! Can I hold it? I\'ll be SO careful.'] },
    tm('ornery', 'That\'s it? All that fuss for that?'),
    tm('curious', 'Oh! What is it? Where\'s it from? What\'s it for?'),
  ]);
  lines('pass.pocket.nonsense', [{ text: ['It\'s very rare. Practically priceless. Don\'t sneeze on it.', 'It\'s a lucky charm. It\'s not worked yet, but it\'s due.'] }]);
  lines('pass.pocket.scoff', [{ text: ['Ha! I\'ve three like it in my drawer.', 'You\'re a dreadful fibber, wizard.'] }, tm('dreamy', 'I believe you. Some things are lucky. They just wait.'), kid('Is it REALLY? Can I touch it for luck?')]);
  lines('pass.pocket.story', [
    { text: ['Really? All that way? In your pocket?', 'Oh! Then it\'s a precious thing. Put it away safe.'] },
    tm('dreamy', 'Oh. I can see it. I can see where it came from.'),
    tm('curious', 'And then what? What happened there? Tell me everything.'),
    tm('ornery', 'A likely story. ...Is it true?'),
    kid('WHOA. Is that TRUE? Is that really TRUE?'),
    rift('Okay, that\'s a better origin story than most tech.'),
  ]);
  lines('pass.pocket.gift', [
    { text: ['For me? Oh! Oh, I\'ll keep it on the mantel. For always.', 'You don\'t mean it. You do. Thank you!'] },
    tm('shy', '...For me? *holds it very carefully*'),
    tm('proud', 'I shall give it pride of place.'),
    tm('ornery', 'Well. Hm. Thank you. I\'ll find somewhere for it.'),
    kid('MINE? Forever? I\'m going to show EVERYONE.'),
    rift('A real object. From the wizard. That\'s... that\'s going in my kit. Thanks.'),
  ]);

  // =====================================================================================
  // A song
  addThread({
    id: 'pass.song', light: true, ap: 'warm', label: 'A song', when: notTot, open: { warm: 'pass.song.open' },
    beats: {
      start: { line: 'pass.song.start', go: [
        { ap: 'share', say: 'pass.song.verse', label: 'Sing them a line', to: 'join' },
        { ap: 'ask', say: 'Sing me one of yours.', to: 'theirs' },
        { ap: 'jest', say: '*You sing it very loudly, and very badly, on purpose.*', label: 'Sing it badly', to: 'awful' },
      ] },
      join: { line: 'pass.song.join', go: [
        { ap: 'warm', say: 'Lovely! You\'ve a voice for it.', to: 'praise' },
        { ap: 'jest', say: 'pass.song.badline', label: 'Add a verse of your own', to: 'giggle' },
        { ap: 'share', say: '*You sing the whole thing together, once more.*', label: 'Sing it together', to: 'duet' },
      ] },
      theirs: { line: 'pass.song.theirs', go: [
        { ap: 'warm', say: 'That\'s lovely. Who taught you that?', to: 'praise' },
        { ap: 'share', say: '*You hum along, finding a harmony.*', label: 'Hum along', to: 'duet' },
      ] },
      awful: { line: 'pass.song.awful', fx: { joke: { k: 'phr.tune', t: 'The wizard can\'t carry a tune in a bucket.' } }, go: [
        { ap: 'jest', say: 'That was my best singing.', to: 'giggle' },
        { ap: 'ask', say: 'Show me how it goes, then.', to: 'theirs' },
      ] },
      praise: { line: 'pass.song.praise', fx: { fond: 0.02 }, end: true },
      giggle: { line: 'pass.song.giggle', end: true },
      duet: { line: 'pass.song.duet', fx: { fond: 0.03, drive: { lonely: -0.1 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.song.open', [{ text: ['Do you know this one, {name}? *You hum a few bars.*', '*You hum an old walking song under your breath.*', 'I\'ve had a song in my head all morning, {name}. Do you know it?'] }]);
  lines('pass.song.start', [
    { text: ['Ooh, I know that one! I think.', 'That\'s an old one. My gran used to hum that.'] },
    tm('cheerful', 'Oh, I love that one! Go on, sing it properly!'),
    tm('ornery', 'Humming. In the lane. What next?'),
    tm('shy', '...I know that one. I don\'t sing, though. Not out loud.'),
    tm('curious', 'What\'s that? Where\'s it from? Is it a wizard song?'),
    tm('dreamy', 'Oh. That takes me back. To somewhere. I don\'t know where.'),
    tm('witty', 'Is that a song or are you unwell?'),
    tm('proud', 'I know it. I know all the verses. Most folk only know the first.'),
    tm('gloomy', 'That\'s a sad one. Or I make it sad. One of the two.'),
    kid('I know a song! It\'s about a frog! Do you want to hear it? It\'s long.'),
    rift('Analogue music. No synth, no beat. Huh. It\'s kind of nice.'),
    elder('Bless me, I\'ve not heard that since I was knee-high to a hen.'),
  ]);
  lines('pass.song.verse', [{ text: ['*You sing:* "{phrSongA}"', '*In a creaky old voice, you sing:* "{phrSongA}"'] }]);
  lines('pass.song.join', [
    { text: ['*joins in:* "{phrSongB}"', '*sings back:* "{phrSongB}" ...That\'s how it goes, isn\'t it?'] },
    tm('shy', '*very quietly:* "{phrSongB}"'),
    tm('proud', '*in a fine, carrying voice:* "{phrSongB}"'),
    tm('ornery', '*grudgingly:* "{phrSongB}" ...Don\'t look so pleased.'),
    tm('cheerful', '*at the top of their voice:* "{phrSongB}"'),
    kid('*bellows:* "{phrSongB}" I KNOW IT!'),
    rift('I don\'t know the words. *makes up a beat on the gatepost instead*'),
  ]);
  lines('pass.song.theirs', [
    { text: ['*sings:* "Knead it and roll it and leave it to rise, and the smell will bring tears to your eyes."', '*sings:* "Down by the Water the rushes grow, and where the fish go, nobody knows."'] },
    { if: { job: 'farmer' }, text: ['*sings:* "Furrow and seed and the rain on the field, and pray to the sun for a fine harvest yield."'] },
    { if: { job: 'fisher' }, text: ['*sings:* "Cast out the line and sit by the pool, and the fish will be clever and I\'ll be the fool."'] },
    { if: { job: 'herder' }, text: ['*sings:* "Come by, come by, my woolly ones, come by before the rain."'] },
    tm('shy', '*hums, very softly, without words*'),
    tm('ornery', 'I only know rude ones. *sings a rude one anyway, under their breath*'),
    tm('dreamy', '*sings:* "Over the hills where the grey ships go, sailing away on the evening glow."'),
    tm('witty', '*sings:* "Oh, the wizard came up with a hat on his head, and he talked and he talked till we all went to bed."'),
    kid('*sings:* "Frog in a puddle, frog in a pool, frog in my pocket, frog at school!"'),
    rift('*hums a tune that sounds like a machine dreaming*'),
    elder('*sings, wobbly but true:* "When I was young and the oak was small, we danced all night and we feared nothing at all."'),
  ]);
  lines('pass.song.badline', [{ text: ['*You sing:* "And the wizard ate twelve of the pies on the sill, and he\'s sorry, and also, he\'s ill."', '*You sing:* "And the hat on his head was so pointy and tall, it caught on the moon and it wouldn\'t come off at all."'] }]);
  lines('pass.song.awful', [
    { text: ['*covers ears* Stop! The hens\'ll stop laying!', 'Was that singing? I thought a goose had got in.'] },
    tm('cheerful', 'Ha! Oh, that\'s awful! Do it again!'),
    tm('ornery', 'That\'s the worst noise I\'ve heard since the bull got stuck in the gate.'),
    tm('shy', '*tries very hard not to laugh*'),
    tm('witty', 'Somewhere, a fiddle is weeping.'),
    tm('proud', 'I sing in the choir at Yule. That was... not that.'),
    kid('HAHA! You sound like a DONKEY!'),
    rift('That\'s... wow. That\'s a lot of frequencies at once.'),
  ]);
  lines('pass.song.praise', [{ text: ['Oh, go on. My gran taught me. She had a voice like a lark.', 'Thank you. I don\'t sing for many folk.'] }, tm('proud', 'I do have a fine voice. It\'s been said.'), tm('shy', '...You liked it? Really?'), kid('I\'m going to sing it ALL DAY now.')]);
  lines('pass.song.giggle', [{ text: ['*laughs so hard they have to lean on the wall*', 'Ha! That\'s not how it goes! ...It is now.'] }, tm('ornery', 'Hmph. ...Ha. Ha. Don\'t sing it at the Badger.')]);
  lines('pass.song.duet', [
    { text: ['*sings the last note with you, and laughs* That was nice.', 'Well! We should do that at the next party.'] },
    tm('shy', '*sings, at last, out loud* ...Oh. That was nice.'),
    tm('gloomy', '...I haven\'t sung in a long while. Thank you.'),
    tm('dreamy', 'That felt like something. Like the hills were listening.'),
    kid('AGAIN! Again again again!'),
    rift('Okay. That was better than any playlist.'),
  ]);

  // =====================================================================================
  // A proverb
  addThread({
    id: 'pass.proverb', light: true, ap: 'share', label: 'A proverb', when: notTot, open: { share: 'pass.proverb.open' },
    beats: {
      start: { line: 'pass.proverb.counter', go: [
        { ap: 'ask', say: 'What does that mean, exactly?', to: 'means' },
        { ap: 'jest', say: 'pass.proverb.mangle', to: 'correct' },
        { ap: 'share', say: 'pass.proverb.another', label: 'Another of yours', to: 'duel' },
      ] },
      means: { line: 'pass.proverb.means', go: [
        { ap: 'warm', say: 'Wise words.', to: 'end', fx: { respect: 0.01 } },
        { ap: 'jest', say: 'I think your grandmother made that up.', to: 'granny' },
      ] },
      correct: { line: 'pass.proverb.correct', go: [
        { ap: 'jest', say: 'pass.proverb.mangle2', to: 'giggle' },
        { ap: 'warm', say: 'You\'re quite right. I\'m out of practice.', to: 'end' },
      ] },
      duel: { line: 'pass.proverb.duel', go: [
        { ap: 'warm', say: 'You win. Your proverbs are older than mine.', to: 'end', fx: { fond: 0.01 } },
        { ap: 'jest', say: 'pass.proverb.mangle', label: 'Mangle one on purpose', to: 'correct' },
      ] },
      granny: { line: 'pass.proverb.granny', end: true },
      giggle: { line: 'pass.proverb.giggle', fx: { joke: { k: 'phr.proverb', t: 'Too many cooks gather no moss. The wizard says.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.proverb.open', [{ text: ['Where I come from they say: {phrProverb}.', 'There\'s an old saying, {name}: {phrProverb}.', 'You know what they say, {name}. {PhrProverbCap}.'] }]);
  lines('pass.proverb.counter', [
    { text: ['Ha! Well, round here we say: a full kettle never boils. Or is it a watched one?', 'My gran used to say: never trust a pie you didn\'t see go in the oven.'] },
    { if: { values: 'thrift' }, text: ['We say: waste not, want not, and lick the spoon.'] },
    { if: { values: 'merriment' }, text: ['We say: a merry heart dances best on a full stomach.'] },
    { if: { values: 'tradition' }, text: ['My gran said: what was good enough for your grandmother is good enough for the jam.'] },
    { if: { values: 'learning' }, text: ['We say: read the recipe before you eat the cake. Nobody listens.'] },
    { if: { values: 'kin' }, text: ['We say: a hole\'s only a hole until there\'s a family in it.'] },
    { if: { values: 'craft' }, text: ['We say: measure twice, cut once, and swear quietly.'] },
    { if: { values: 'nature' }, text: ['We say: rain before seven, mushrooms by eleven.'] },
    { if: { values: 'order' }, text: ['We say: a place for everything, and the cat in none of them.'] },
    tm('ornery', 'Never heard it. Round here we say: mind your own garden.'),
    tm('witty', 'Round here we say: never argue with a wizard. They\'ve had longer to think of a comeback.'),
    tm('gloomy', 'We say: it never rains but it pours. And it always rains.'),
    tm('dreamy', 'Oh, that\'s lovely. We say: the moon knows where you\'ve been.'),
    kid('My mum says: if you can\'t say anything nice, don\'t say anything at all. I always have something nice. And something not nice.'),
    rift('Back home we said: if it\'s free, you\'re the product. Doesn\'t really work for mushrooms.'),
    elder('My old dad used to say: an early bed and an early breakfast, and a second one later.'),
  ]);
  lines('pass.proverb.means', [
    { text: ['It means... well, it means what it says. Mostly.', 'It means don\'t be daft. Most proverbs do.'] },
    tm('proud', 'It means a great deal, if you\'ve the wit to see it. Which you have. Nearly.'),
    tm('curious', 'I\'ve thought about that a lot, actually. I think it means two things. Want to hear both?'),
    tm('ornery', 'It means what it means. Don\'t make me explain a proverb.'),
    tm('witty', 'It means my gran had a lot of time on her hands.'),
    tm('dreamy', 'It means... something you only understand when you\'re old. I\'m not old enough.'),
    kid('It means... I don\'t know. My mum says it when I\'m naughty.'),
  ]);
  lines('pass.proverb.granny', [{ text: ['She did not! ...She might have. She made up a lot of things.', 'How dare you. ...Yes, she did.'] }, tm('ornery', 'Don\'t you speak ill of my gran. She\'d have had your hat.')]);
  lines('pass.proverb.mangle', [{ text: ['Ah, but you know what they say: a bird in the hand gets the worm.', 'As they say: too many cooks gather no moss.', 'Don\'t count your chickens before they cross the bridge.'] }]);
  lines('pass.proverb.correct', [
    { text: ['That\'s not how it goes! That\'s two proverbs in a sack.', 'No it\'s not! You\'ve muddled it.'] },
    tm('witty', 'Ha! And a stitch in time is worth two in the bush.'),
    tm('proud', 'I believe you\'ll find it\'s "the early bird catches the worm".'),
    tm('ornery', 'That\'s not a proverb. That\'s a mess.'),
    kid('That\'s WRONG! ...What does it mean?'),
  ]);
  lines('pass.proverb.mangle2', [{ text: ['Ah, well. Every cloud gathers no moss.', 'Never mind. You can\'t make an omelette without crossing that bridge.'] }]);
  lines('pass.proverb.giggle', [{ text: ['*laughs* You\'re dreadful. Dreadful!', 'Stop it! I\'ll never get them straight again.'] }, tm('witty', 'Ha! And where there\'s a will, there\'s a pie.')]);
  lines('pass.proverb.another', [{ text: ['And another: the slow walker sees the most birds.', 'They also say: an open door lets in the cold and the company.'] }]);
  lines('pass.proverb.duel', [
    { text: ['Well, we say: you can\'t hurry a hen, a hedge, or a hobbit.', 'And we say: there\'s always room for pudding, if you sit up straight.'] },
    tm('proud', 'And we say: a hobbit\'s word is better than a wizard\'s firework.'),
    tm('witty', 'And we say: never trust a wizard who arrives early. Or late. Or at all.'),
    kid('And: finders keepers, losers weepers!'),
  ]);

  // =====================================================================================
  // Idle gossip
  addThread({
    id: 'pass.gossip', light: true, ap: 'listen', label: 'Idle gossip', when: notTot, open: { listen: 'pass.gossip.open' },
    beats: {
      start: { line: 'pass.gossip.tidbit', go: [
        { ap: 'ask', say: 'Who, though?', to: 'who' },
        { ap: 'jest', say: 'Scandal! Tell me more.', to: 'more' },
        { ap: 'warm', say: 'Now, now. Be kind.', to: 'kind' },
      ] },
      who: { line: 'pass.gossip.who', go: [{ ap: 'jest', say: 'And then what?', to: 'more' }, { ap: 'warm', say: 'I\'m sure there\'s a kind reason.', to: 'kind' }] },
      more: { line: 'pass.gossip.more', go: [
        { ap: 'jest', say: 'Shocking. Truly shocking.', to: 'swear' },
        { ap: 'warm', say: 'I\'ll say nothing. Not a word.', to: 'end', fx: { trust: 0.01 } },
      ] },
      kind: { line: 'pass.gossip.kind', fx: { respect: 0.01 }, end: true },
      swear: { line: 'pass.gossip.swear', fx: { joke: { k: 'phr.gossip', t: 'The great scandal of the lane, which nobody must ever hear about.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.gossip.open', [{ text: ['*You lean on the fence.* Well? What\'s the talk of the lane?', 'Go on, {name}. What\'s the gossip?', '*You settle in.* What have I missed, {name}?'] }]);
  lines('pass.gossip.tidbit', [
    { text: ['Somebody\'s been at the honey in the Common Store. Sticky fingerprints on the jar. Small ones.', 'Someone\'s been leaving flowers on a doorstep every morning. Nobody knows who. I know who.'] },
    { if: { rival: (r) => !!r }, text: ['{Rival}\'s got a new hat. Thinks nobody\'s noticed. Everybody\'s noticed.', '{Rival} says their marrows are bigger than mine. They\'re not.'] },
    { if: { friend: (f) => !!f }, text: ['{Friend}\'s been seen walking out after supper. Twice. With a basket.'] },
    tm('ornery', 'The miller\'s wheel squeaks and nobody does anything about it. That\'s the talk.'),
    tm('shy', '...I don\'t really hear things. Well. I heard someone sing in the bath. Very loudly.'),
    tm('cheerful', 'Oh, LOADS! Someone fell in the Water! Well, a goose did. But still!'),
    tm('gloomy', 'Nobody tells me anything. ...I did hear the Badger\'s run out of cider.'),
    tm('dreamy', 'Someone\'s in love. I can tell. The whole lane smells of roses.'),
    tm('witty', 'The talk of the lane is you, wizard. Mostly your hat.'),
    kid('Someone ate ALL the jam tarts at story time and it WASN\'T me. It was a bit me.'),
    rift('Relay chatter says someone\'s been trying to post with a pigeon. Bless them.'),
    elder('In my day we didn\'t gossip. We exchanged information. Anyway, did you hear about the well?'),
  ]);
  lines('pass.gossip.who', [
    { text: ['I couldn\'t possibly say. ...Starts with a B. Or a P.', 'Not saying. But they\'ve a pointy nose and a guilty face.'] },
    { if: { rival: (r) => !!r }, text: ['{Rival}, if you ask me. It\'s always {rival}.'] },
    tm('proud', 'I don\'t name names. I merely know them.'),
    kid('I\'m not ALLOWED to say. But it\'s a grown-up. A fat one.'),
  ]);
  lines('pass.gossip.more', [
    { text: ['And then, the very next morning, it happened again! Bold as brass!', 'And nobody\'s owned up. Nobody! In this lane!'] },
    tm('cheerful', 'And then the goose bit the postie! And the postie bit the goose! Well, nearly!'),
    tm('dreamy', 'And they say there was a ribbon tied to the gate. A blue one.'),
    tm('witty', 'And then the plot thickened, like a gravy. A gossip gravy.'),
    kid('And THEN they said it was a FOX. A fox with jam on its face. A FOX.'),
  ]);
  lines('pass.gossip.kind', [
    { text: ['...Oh, you\'re right. It\'s only a bit of honey.', 'Kind. Yes. Well. It was a very little bit of gossip.'] },
    tm('ornery', 'Kind. Hmph. I am kind. I\'m just also right.'),
    tm('shy', '*looks at their feet* ...Sorry.'),
    tm('proud', 'I was merely remarking. I\'m always kind. Mostly.'),
    kid('I\'m being kind! I\'m telling the TRUTH. That\'s kind.'),
  ]);
  lines('pass.gossip.swear', [{ text: ['*finger to lips* You didn\'t hear it from me.', 'Not a word! If anyone asks, we were talking about the weather.'] }, tm('cheerful', 'I KNOW. Isn\'t it marvellous?')]);

  // =====================================================================================
  // Birdsong
  addThread({
    id: 'pass.birds', light: true, ap: 'listen', label: 'Birdsong', when: (F) => F.band !== 'toddler' && F.weather !== 'snow', open: { listen: 'pass.birds.open' },
    beats: {
      start: { line: 'pass.birds.name', go: [
        { ap: 'ask', say: 'What\'s it saying, do you think?', to: 'saying' },
        { ap: 'share', say: 'pass.birds.lore', label: 'Share some bird-lore', to: 'lore' },
        { ap: 'jest', say: '*You whistle back at it. Badly.*', label: 'Whistle back', to: 'whistle' },
      ] },
      saying: { line: 'pass.birds.saying', go: [
        { ap: 'warm', say: 'I think you\'re right.', to: 'end' },
        { ap: 'listen', say: '*{frag:fill}*', label: 'Just listen a while', to: 'quiet' },
      ] },
      lore: { line: 'pass.birds.wonder', go: [
        { ap: 'tale', say: 'pass.birds.tale', label: 'Tell of the birds that talk', to: 'tale' },
        { ap: 'jest', say: 'Or I made that up. One of the two.', to: 'end' },
      ] },
      tale: { line: 'pass.birds.taleback', fx: { fond: 0.02 }, end: true },
      whistle: { line: 'pass.birds.whistle', fx: { joke: { k: 'phr.birds', t: 'The wizard whistled at a blackbird and it flew off in disgust.' } }, end: true },
      quiet: { line: 'pass.birds.quiet', fx: { trust: 0.02, drive: { lonely: -0.05 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.birds.open', [{ text: ['*You stop, and listen to the birds.*', '*A bird is singing in the hedge. You tilt your head to listen.*', 'Hark, {name}. Hear that?'] }]);
  lines('pass.birds.name', [
    { text: ['That\'s a blackbird. Sings like that every day. Showing off.', 'A wren, that. Tiny bird, enormous voice.'] },
    { if: { hour: 'morning' }, text: ['Dawn chorus. Every bird in the valley trying to be heard first.'] },
    { if: { hour: 'evening' }, text: ['Hear that? A thrush, saying goodnight to everyone. One at a time.'] },
    { if: { hour: 'night' }, text: ['That\'s the old owl in the oak. He\'s been there longer than me.'] },
    { if: { season: 'winter' }, text: ['A robin. They sing all winter. Brave little things.'] },
    { if: { season: 'spring' }, text: ['The cuckoo\'s back! That makes spring official.'] },
    { if: { weather: 'rain' }, text: ['The blackbird\'s calling for more rain. He\'s never satisfied.'] },
    { if: { pastime: 'birdwatching' }, text: ['Chiffchaff. Hear it? Chiff, chaff. Says its own name, the show-off.', 'Two notes, falling. Yellowhammer. They\'re back early this year. I\'ve written it down.'] },
    tm('ornery', 'Birds. Noisy things. Up at all hours.'),
    tm('dreamy', 'Isn\'t it lovely? Like water, but in the air.'),
    tm('shy', '*whispers* Shh. It\'s a goldfinch. Don\'t frighten it.'),
    tm('gloomy', 'A rook. They\'re clever, rooks. Too clever. They know things.'),
    kid('It\'s a BIRD! It\'s saying TWEET! Tweet tweet!', 'I know! It\'s a pigeon! It\'s always a pigeon.'),
    rift('Is that a bird? Real? I thought it was a broken alarm.'),
    elder('A curlew. My mother loved curlews. Mournful, she said. Like a good song.'),
  ]);
  lines('pass.birds.saying', [
    { text: ['It\'s saying "here I am, here I am, where are you?"', 'Something about worms, I expect. It\'s always about worms.'] },
    tm('dreamy', 'It\'s saying summer\'s nearly here, and nobody\'s to waste a minute of it.'),
    tm('ornery', 'It\'s saying "get off my hedge". I sympathise.'),
    tm('witty', 'It\'s saying "who\'s the tall fellow in the silly hat?"'),
    tm('gloomy', 'It\'s saying it\'s lonely. They all are, really.'),
    tm('curious', 'I wonder! Do you think they have words? Do wizards know?'),
    kid('It\'s saying PUDDING! PUDDING!'),
    rift('It\'s saying "ping, ping, ping". It\'s basically a notification.'),
  ]);
  lines('pass.birds.quiet', [{ text: ['...It\'s nice, this. Just listening.', '*sits on the wall beside you, and says nothing for a while*'] }, tm('shy', '...I like this. Not talking. With someone.'), kid('*manages to be quiet for nearly a whole minute*')]);
  lines('pass.birds.lore', [{ text: ['The thrush says rain by morning. I had it from a thrush.', 'When the swallows fly low, there\'s weather coming. They know before the clouds do.', 'Rooks keep a parliament, you know. With rules. Stricter than the Moot.'] }]);
  lines('pass.birds.wonder', [
    { text: ['Really? You know what birds know?', 'Is that true? You\'ll have me watching the sky all day now.'] },
    tm('curious', 'You can understand them? All of them? What does the blackbird say? What does the hen say?'),
    tm('ornery', 'Hmph. Bird talk. Next you\'ll tell me the cows vote.'),
    tm('dreamy', 'Oh, I knew it. I always knew they were saying something.'),
    kid('You can TALK to BIRDS? Talk to that one! Ask it if it likes me!'),
    rift('Wildlife comms. That\'s some serious tech. Organic tech.'),
  ]);
  lines('pass.birds.tale', [{ text: ['Once I asked a thrush the way, in the mountains. It gave very good directions. Then it asked for a crumb.', 'There are great eagles in the north who speak, and they are very proud. Prouder than a cat.'] }]);
  lines('pass.birds.taleback', [{ text: ['Birds that talk! Oh, I\'d love to hear one. From a distance.', 'I\'m going to ask a bird the way to the Badger. See what it says.'] }, kid('Can you get me a talking bird? A small one? I\'ll feed it!')]);
  lines('pass.birds.whistle', [
    { text: ['It\'s stopped. You\'ve offended it.', 'Ha! A crow\'s answering you. That\'s about your level.'] },
    tm('cheerful', 'Ha! It\'s flown off! You\'ve frightened it into the next valley!'),
    tm('shy', '*tries very hard not to laugh*'),
    tm('witty', 'Ah. That bird has just changed its tune. Permanently.'),
    kid('HAHA! That\'s not how birds go! This is how birds go: *whistles worse*'),
  ]);

  // =====================================================================================
  // The smell of baking
  addThread({
    id: 'pass.baking', light: true, ap: 'warm', label: 'The smell of baking', when: notTot, open: { warm: 'pass.baking.open' },
    beats: {
      start: { line: 'pass.baking.sniff', go: [
        { ap: 'ask', say: 'Whose kitchen, do you think?', to: 'whose' },
        { ap: 'jest', say: 'Shall we follow our noses?', to: 'follow' },
        { ap: 'share', say: 'I\'d walk ten miles for a good seed-cake.', to: 'fav' },
      ] },
      whose: { line: 'pass.baking.whose', go: [
        { ap: 'jest', say: 'Shall we pop round? By accident?', to: 'follow' },
        { ap: 'ask', say: 'And what\'s the best thing you bake?', to: 'fav' },
      ] },
      follow: { line: 'pass.baking.follow', fx: { drive: { hunger: 0.05 } }, end: true },
      fav: { line: 'pass.baking.fav', go: [
        { ap: 'warm', say: 'I\'ll hold you to that.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'jest', say: 'I\'ll bring the appetite. And a bigger hat, for crumbs.', to: 'crumbs' },
      ] },
      crumbs: { line: 'pass.baking.crumbs', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('pass.baking.open', [{ text: ['Can you smell that, {name}? Somebody\'s baking.', '*You sniff the air.* Is that... seed-cake?', 'Mm. Smell that, {name}? Somewhere, an oven\'s been busy.'] }]);
  lines('pass.baking.sniff', [
    { text: ['Ooh. Seed-cake. Somebody\'s having a proper tea.', 'Bread! Fresh bread. Is there anything better? There isn\'t.'] },
    { if: { hour: 'morning' }, text: ['That\'s the first batch of the morning. Crusty. Still singing.'] },
    { if: { season: 'autumn' }, text: ['Apple pie. With cinnamon. I\'d know it anywhere.'] },
    { if: { season: 'winter' }, text: ['Gingerbread! Must be getting near Yule.'] },
    { if: { season: 'summer' }, text: ['Strawberry tarts. Somebody\'s been to the beds early.'] },
    { if: { job: 'baker' }, text: ['That\'s mine! Oh no, that\'s mine! ...No, false alarm. Mine smells better.'] },
    { if: { hungry: true }, pri: 1, text: ['Don\'t. I\'m hungry enough as it is. Oh, that\'s cruel.'] },
    tm('ornery', 'Somebody\'s burning something. Ah, no. That\'s on purpose. Toffee.'),
    tm('dreamy', 'That smells like my gran\'s kitchen on a Highday. Oh.'),
    tm('gloomy', 'Somebody\'s baking. Not for me, I expect.'),
    kid('CAKE! I can smell CAKE! Where is it? WHERE IS IT?'),
    rift('Real bread. Back home bread came in a tube. A TUBE.'),
  ]);
  lines('pass.baking.whose', [
    { text: ['Hard to say. The wind\'s from the east. The bakery, I\'d guess.', 'Three holes down, by the smell. They always overdo the butter. Lovely.'] },
    { if: { spouse: (s) => !!s }, text: ['That\'ll be {spouse}. Every Trewsday. I married well.'] },
    { if: { job: 'baker' }, text: ['Somebody\'s doing it at home. Competition! I\'ll want the recipe.'] },
    tm('curious', 'Let\'s work it out. Butter, sugar, caraway... the east lane. Definitely the east lane.'),
    tm('proud', 'Not as good as mine, whoever they are.'),
    kid('It\'s my house! No it\'s not. It\'s somebody\'s house. Can we go?'),
  ]);
  lines('pass.baking.follow', [
    { text: ['Ha! Yes! By accident. Just happening to pass.', 'We couldn\'t. ...Could we? We could.'] },
    tm('proud', 'Certainly not! ...Well, perhaps if we happened to pass.'),
    tm('ornery', 'I don\'t go begging at doors. ...Lead on.'),
    tm('shy', 'Oh, I couldn\'t. ...You go. Bring me a crumb?'),
    kid('YES! Follow the CAKE!'),
  ]);
  lines('pass.baking.fav', [
    { text: ['Come round Highday. I\'ll make you my mother\'s seed-cake.', 'My apple turnovers. Folk come from three lanes over.'] },
    { if: { job: 'baker' }, text: ['A cottage loaf, with a cross on top. Come by early and I\'ll give you the first one.'] },
    { if: { likes: 'mushrooms' }, text: ['Mushroom pasties. Don\'t laugh. Come round and stop laughing.'] },
    tm('shy', '...I make a ginger biscuit. Only a small one. I could make you one.'),
    tm('proud', 'My lemon curd tart has won three ribbons. You may have a slice.'),
    tm('ornery', 'I don\'t bake for wizards. ...Well, maybe one. A small one.'),
    tm('gloomy', 'I burn everything. But the scones are all right. Usually.'),
    kid('I make mud pies! They\'re really good! Don\'t eat them.'),
    rift('I\'m learning. Yesterday I made bread. It was a rock. A tasty rock.'),
  ]);
  lines('pass.baking.crumbs', [{ text: ['Ha! A bigger hat! It\'s big enough already.', 'You\'ll be welcome. Your hat less so.'] }]);

  // --- More voices for the beats above: the tempers and ages they lacked ---------------
  lines('pass.baking.crumbs', [
    tm('ornery', 'Bring the appetite. Leave the hat. And the jokes.'),
    tm('cheerful', 'Ha! Bring two hats! Bring everyone!'),
    tm('proud', 'Crumbs are swept up in my house, wizard. Promptly.'),
    kid('Can I come too? I\'ve got a really big appetite. And no hat.'),
  ]);
  lines('pass.baking.whose', [
    tm('ornery', 'Somebody showing off. Baking in the middle of the week. Hmph.'),
    tm('dreamy', 'It smells like somebody happy. You can tell, with baking.'),
    tm('shy', '...I think it\'s the hole with the blue door. They always bake on this day.'),
    tm('witty', 'Whoever it is, they\'re about to get a great many visitors.'),
    rift('No idea. I\'d need an aroma sensor. I have a nose. It\'ll do.'),
  ]);
  lines('pass.baking.fav', [
    tm('cheerful', 'Jam tarts! Hundreds! Come round and I\'ll make hundreds!'),
    tm('curious', 'I\'m trying a new one. Carrot cake. Carrot! In a cake! Come and be brave with me.'),
    tm('dreamy', 'Rose-petal biscuits. My gran\'s. They taste like June.'),
    tm('witty', 'My speciality is burnt toast. People come from miles to avoid it.'),
    elder('Bread pudding. Nobody makes it now. I\'ll make you some. You\'ll see.'),
  ]);
  lines('pass.baking.follow', [
    tm('cheerful', 'Ooh, yes! Noses first! Follow the nose!'),
    tm('witty', 'Lead on. If anyone asks, we\'re inspecting chimneys.'),
    tm('gloomy', 'They\'ll have eaten it all by the time we get there.'),
    tm('curious', 'Yes! Let\'s see if I\'m right about whose it is!'),
    rift('Following a smell. This is the most hill-folk thing I\'ve ever done. I love it.'),
  ]);
  lines('pass.gossip.who', [
    tm('cheerful', 'Oh, I mustn\'t! ...It rhymes with "hobble". That\'s all I\'m saying.'),
    tm('ornery', 'Never you mind who. Somebody who ought to know better.'),
    tm('shy', '*whispers a name, so quietly you don\'t catch it*'),
    tm('witty', 'Who? Somebody tall, with a hat. ...No, not you. A different hat.'),
    tm('gloomy', 'Doesn\'t matter who. It\'s always somebody.'),
    tm('curious', 'I\'m still working that out! I\'ve got three suspects.'),
    rift('No names. I\'m not putting that on the Relay. Probably.'),
  ]);
  lines('pass.gossip.more', [
    tm('ornery', 'And nobody does a thing about it. Not a thing.'),
    tm('shy', '...And that\'s all I know. Truly. Mostly.'),
    tm('curious', 'And I went to look, and there were footprints! Small ones! Furry ones!'),
    tm('proud', 'And I said at the time, mark my words. And here we are.'),
    tm('gloomy', 'And it\'ll happen again. These things always do.'),
    elder('And in my day that would have been a matter for the Moot. Twice.'),
  ]);
  lines('pass.gossip.kind', [
    tm('cheerful', 'Oh, you\'re right! I love everyone really. Even them.'),
    tm('dreamy', 'You\'re right. Everyone\'s got their reasons. Even small sticky ones.'),
    tm('witty', 'Kind. Fine. I\'ll gossip about the weather instead. It\'s been very rude.'),
    tm('gloomy', 'You\'re right. I\'d hate folk talking about me. They probably do.'),
    tm('curious', 'Kind? Hm. You\'re right. I just like knowing things.'),
    rift('Fair. No doxxing the neighbours. Got it.'),
  ]);
  lines('pass.gossip.swear', [
    tm('ornery', 'If it gets out, I\'ll know it was you. Only you and the hens know.'),
    tm('shy', '*nods, very seriously, finger to lips*'),
    tm('witty', 'Shocking. I know. I was shocked twice, to be sure.'),
    kid('PINKIE PROMISE you won\'t tell. Pinkie. Promise.'),
  ]);
  lines('pass.birds.saying', [
    tm('cheerful', 'It\'s saying "what a day, what a day, what a day!" I agree with it.'),
    tm('shy', '...It\'s saying "here I am". Just quietly. Like me.'),
    tm('proud', 'It\'s saying my hedge is the finest in the lane. It nests there every year.'),
    elder('It\'s saying the same as it said when I was a lad. That\'s the comfort of birds.'),
  ]);
  lines('pass.birds.wonder', [
    tm('shy', '...That\'s lovely. I\'ll listen for it.'),
    tm('witty', 'And what do the hens say? Never mind. I know what the hens say.'),
    tm('proud', 'I knew that already, of course. My father taught me.'),
    tm('gloomy', 'I don\'t want to know what the crows say. Nothing good.'),
    elder('My grandmother said the same. I thought she\'d made it up.'),
  ]);
  lines('pass.birds.whistle', [
    tm('ornery', 'Ha. Even the birds don\'t want to talk to you.'),
    tm('dreamy', 'Oh, it answered! Did you hear? It answered you! Sort of.'),
    tm('proud', 'You\'ll want to purse your lips more. Like this. *whistles beautifully*'),
    rift('It\'s gone silent. You\'ve jammed its frequency.'),
    elder('Ha! I whistled like that at my age. I mean your age. Whatever age you are.'),
  ]);
  lines('pass.pocket.guesses', [
    tm('shy', '...A handkerchief? A clean one?'),
    tm('proud', 'A letter from somebody important. Obviously.'),
    tm('gloomy', 'Nothing. It\'ll be nothing. It\'s always nothing.'),
    elder('Your spectacles. You\'ve been looking for them all morning.'),
  ]);
  lines('pass.pocket.show', [
    tm('cheerful', 'Oh! Oh, how lovely! I love it! What is it?'),
    tm('dreamy', 'Oh. It\'s got a story. I can tell. Things with stories feel different.'),
    tm('witty', 'Well. It\'s not a dragon. It\'s not lint either. A good day for you.'),
    tm('shy', '*leans in to look, carefully* ...Oh.'),
    tm('gloomy', 'Hm. Better than nothing. A bit.'),
  ]);
  lines('pass.song.start', [
    tm('cheerful', 'Ooh, sing the whole thing! I\'ll do the clapping!'),
    { if: { temper: 'ornery', stage: 'elder' }, text: ['Humming. In my day we sang properly or not at all.'] },
    { if: { likes: 'music' }, text: ['Oh, I love that one! Wait, which one is it? Hum it again!'] },
  ]);
  lines('pass.song.theirs', [
    tm('cheerful', '*sings:* "Oh, the sun\'s on the hill and the bread\'s on the sill, and the world is as good as a world ever will!"'),
    tm('proud', '*sings, beautifully:* "Fair is the Shire and fair is the Water, and fairest of all is the miller\'s daughter."'),
    tm('gloomy', '*sings:* "The rain comes in and the rain goes out, and nobody knows what it\'s all about."'),
    tm('curious', '*sings:* "Why is the sky so blue, so blue, and who painted it, and with what glue?"'),
  ]);
  lines('pass.song.praise', [
    tm('cheerful', 'Oh, you\'re too kind! Shall I do another? I\'ll do another.'),
    tm('ornery', 'Hm. I can hold a tune. Don\'t spread it about. They\'ll want me at weddings.'),
    tm('gloomy', 'My gran sang it better. But thank you.'),
    tm('dreamy', 'It sings itself, really. I just let it out.'),
    rift('Thanks. Back home I\'d never have sung in the street. Cameras.'),
  ]);
  lines('pass.proverb.means', [
    tm('cheerful', 'It means be happy! Most of them do, if you squint.'),
    tm('shy', '...I think it means be careful. My gran was very careful.'),
    tm('gloomy', 'It means things go wrong. They all mean that, really.'),
    elder('It means what every proverb means: listen to your elders. Ha!'),
  ]);
  lines('pass.proverb.duel', [
    tm('cheerful', 'And: there\'s no such thing as too much butter. That\'s a proverb. I made it one.'),
    tm('ornery', 'And: the wizard who meddles gets his hat wet.'),
    tm('dreamy', 'And: the moon sees everything and says nothing. Wise moon.'),
    tm('gloomy', 'And: it\'ll end in tears. My gran said that about everything. She was right.'),
    rift('And: never trust a free update. That one\'s from home.'),
  ]);
  lines('pass.wager.stakes', [
    tm('cheerful', 'A whole pie! No, two! I\'m feeling lucky!'),
    tm('curious', 'What\'s the usual stake for a wizard? Gold? A spell? I\'ll stake a jar of honey.'),
    tm('dreamy', 'A daisy chain. A long one. It\'s worth more than it sounds.'),
    tm('gloomy', 'An egg. I\'ll lose it anyway.'),
    elder('My second-best walking stick. Don\'t look so pleased, I\'m not going to lose.'),
  ]);
  lines('pass.wager.gracious', [
    tm('ornery', 'Hmph. I\'ll pay anyway. I pay my debts. ...Thank you.'),
    tm('cheerful', 'Oh, you dear! I\'ll bake you something anyway, just because.'),
    tm('witty', 'Generous in victory. Infuriating. I\'ll pay you double out of spite.'),
  ]);
  lines('pass.riddle.ready', [
    { if: { register: 'fine' }, text: ['A riddle! How delightful. I do enjoy a little mental exercise.'] },
    { if: { register: 'plain' }, text: ['Riddles, is it? Go on. I\'m no scholar, mind.'] },
    { if: { register: 'bright' }, text: ['I\'ve read a whole book of riddles! Well, half. Go on!'] },
  ]);
  lines('pass.riddle.won', [
    tm('curious', 'I got it! Ooh, do another! Harder!'),
    tm('dreamy', 'I got it. It just floated up, like a bubble.'),
    elder('Ha! The old head still works. Mostly.'),
    { if: { register: 'fine' }, text: ['Elementary, my dear wizard.'] },
  ]);
  lines('pass.compliment.back', [
    { if: { register: 'fine' }, text: ['How gracious. And may I say, your bearing is positively regal.'] },
    { if: { register: 'plain' }, text: ['Get on with you! Your hat\'s a fine hat, it is.'] },
  ]);
  lines('pass.compliment.victory', [
    tm('ornery', 'Ha. Won. Don\'t tell anyone I enjoyed that.'),
    tm('shy', '*very pink, and very pleased*'),
    tm('gloomy', 'I won something. That never happens. Thank you.'),
    rift('Compliment battle: won. Ego: boosted.'),
  ]);
});
