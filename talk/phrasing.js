'use strict';
// ---------------------------------------------------------------------------
// Phrasing, part one: the texture every talk passes through. Each hobbit's
// phrase of their own, the little fragments said at the joints, and the
// greetings: first meetings by temper and age, callbacks to jokes, secrets,
// promises and the last thing you talked about, what they were doing when you
// stopped them, the weather, the hour, the season, the meal, a party, being
// tipsy or poorly, and how fond of you they are.
//
// The greetings are tiered with `at(tier, if, text)`, which sets `pri` so a
// rule's score is the tier however many facts it tests. Higher tiers win:
//   9 toddlers · 8 first meeting · 7 a broken promise · 6.8 a kept one ·
//   6.4 by a grave · 6 tipsy · 5.6 poorly · 5.4 their own party · 5 a party ·
//   4.9 a long absence · 4.8 a callback (some talks) · 4.4 back the same day ·
//   4.2 at work · 4 hungry · 3.9 tired · 3.6 what they were doing · 3.5 lonely ·
//   2.5 the talk's flavour (weather, hour, season, meal, fondness, temper,
//   register, what they like), one flavour a talk.
// Within a tier, +0.2 or +0.3 for a temper or stage of its own.
// ---------------------------------------------------------------------------

talkPack('phrasing', () => {
  const at = (tier, cond, text, more) => ({ if: cond, pri: Math.round((tier - Object.keys(cond).length) * 100) / 100, text, ...(more || {}) });
  const FLAV = ['weather', 'hour', 'season', 'meal', 'fond', 'temper', 'temper', 'register', 'likes', 'family', 'mood'];
  const DOING = {
    eat_home: 'meal', eat_inn: 'meal', eat_item: 'meal', feast: 'meal', supper_guest: 'meal', bake_home: 'baking', ale: 'ale', ale_item: 'ale', tea: 'tea',
    smoke: 'pipe', leaf_item: 'pipe', garden: 'garden', fish: 'fish', forage: 'forage', read: 'read', read_item: 'read', write_letter: 'letter',
    nap: 'nap', sleep: 'nap', stroll: 'stroll', potter: 'stroll', well: 'stroll', play: 'play', chase: 'play', swing: 'play', party: 'party', fiddle: 'party', watch: 'party',
    chat: 'chat', gift: 'court', give_present: 'court', market: 'market', tend_baby: 'baby', cradle: 'baby', school: 'lesson', lesson: 'lesson', apprentice: 'lesson',
    pet_pet: 'pet', visit_stone: 'grave', bring_soup: 'soup',
  };
  const doingOf = (a) => {
    if (!a) return null;
    if (DOING[a]) return DOING[a];
    if (a.startsWith('hobby_')) return 'hobby';
    if (typeof ACTIONS !== 'undefined' && ACTIONS[a] && ACTIONS[a].job) return 'work';
    return null;
  };
  // facts of this pack's own: what they were at, the party, the meal, and the talk's dice
  addFacts((v, F, T) => {
    const was = T && T.was !== undefined ? T.was : (typeof Upb !== 'undefined' && typeof Play !== 'undefined' && Play.talk && Play.talk.v === v ? Upb.was : null);
    F.phrDoing = doingOf(was);
    F.phrStorm = Game.weather === 'storm';
    const on = !!(Game.party && Game.party.on);
    F.phrParty = on ? (typeof partyKind === 'function' ? partyKind(Game.party.reason).key : 'evening') : null;
    const host = on && typeof partyHost === 'function' ? partyHost() : null;
    F.phrHost = host && host !== v ? host.first : null;
    F.phrOwnParty = !!(host && host === v && Game.party.reason === 'birthday');
    F.phrMeal = typeof mealFor === 'function' ? mealFor(Game.hour).toLowerCase() : null;
    // the talk's dice, rolled once a talk so the greeting and the parting agree
    const dice = () => { const t = bondFull(v).talks || 0; return { roll: hash2(v.id * 31 + t * 7 + 1, Game.day), flav: FLAV[Math.floor(hash2(v.id * 53 + t * 11 + 2, Game.day) * FLAV.length)] }; };
    const D = T ? (T.phrDice || (T.phrDice = dice())) : dice();
    F.phrRoll = D.roll;
    F.phrFlavour = D.flav;
    F.phrOpen = T && typeof T.open === 'number' ? T.open : null;
    F.phrMisjudged = !!(T && T.flags && T.flags.misjudged);
    F.phrDepth = T && T.depth ? T.depth : 0;
  });
  const MEAL = ['breakfast', 'second breakfast', 'elevenses', 'luncheon', 'afternoon tea', 'dinner', 'supper'];
  const askedLast = (x) => typeof x === 'string' && /\?$/.test(x);
  // an open promise they can say back to you: one of yours, not about themselves by name, and no secret
  const sayPromise = (p, F) => typeof p === 'string' && /^You (said|promised) /.test(p) && !p.includes(F.name) && !/secret|never to tell|not to tell|say nothing|keep quiet/.test(p);

  // --- A phrase of their own: one each, picked by id. Said trailing, after a comma ----
  frags('pet', [
    'and that\'s a fact', 'mark me', 'and no two ways about it', 'and that\'s flat', 'bless your boots', 'by my buttons', 'by the great oak', 'by the party tree',
    'by all the mushrooms in the Marish', 'sure as sunrise', 'sure as rain on Highday', 'as true as turnips', 'and I\'ll stand by it', 'and you may quote me',
    'and I don\'t mind who hears it', 'or I\'m a toad', 'or I\'ll eat my hat', 'or I\'ll eat my waistcoat', 'and pass the pickles', 'and there\'s an end to it',
    'saving your presence', 'if I\'m any judge', 'if I say so myself', 'and I should know', 'and that\'s the honest truth', 'mind you', 'I\'ll be bound',
    'I shouldn\'t wonder', 'I dare say', 'and I\'ll thank you to remember it', 'as plain as a pikestaff', 'as right as rain', 'as snug as a bug', 'as sure as taters',
    'by my mother\'s mangle', 'by my aunt\'s best bonnet', 'by my uncle\'s whiskers', 'by the seven sausages', 'by thunder and turnips', 'by gum', 'by the Badger\'s barrels',
    'crumbs and custard', 'fair and square', 'give or take a pie', 'goodness me', 'gracious me', 'great green gooseberries', 'hand on heart', 'heaven knows', 'more or less',
    'my word', 'not to put too fine a point on it', 'say what you like', 'strike me pink', 'that I do', 'that\'s what I say', 'to be sure', 'upon my soul', 'well and truly',
    'when all\'s said and done', 'with knobs on', 'you mark me', 'you may depend on it', 'all things considered', 'and that\'s saying something', 'and I\'m not one to gossip',
    'and I\'ve seen a few', 'bless the hens', 'beans and bacon', 'buttons and bows', 'by my pipe', 'by the shine on my kettle', 'come rain or shine', 'every word of it',
    'for my sins', 'for what it\'s worth', 'good as gold', 'I\'ll be blowed', 'in all my born days', 'it stands to reason', 'make no mistake', 'mercy me', 'no word of a lie',
    'on my honour', 'plain as pudding', 'right enough', 'stone the crows', 'tea and toast', 'there\'s a thing', 'touch wood', 'what ho', 'with a cherry on top',
    'you\'ll see', 'and so say all of us', 'and long may it last', 'take it or leave it', 'so to speak', 'my sainted aunt', 'by my second-best spoon', 'that\'s the ticket',
    'and Bob\'s your uncle', 'hot buttered scones', 'up the lane and down again',
  ]);
  frags('pet.child', [
    'swear on my conkers', 'pinkie promise', 'no backsies', 'and that\'s that', 'so there', 'times a hundred', 'times infinity', 'double promise', 'for actual',
    'I\'m not even fibbing', 'ask anyone', 'on my best marble', 'cross my heart and hope to fly', 'no fibs', 'and I\'m telling', 'easy-peasy', 'super-duper',
    'whoopee', 'hee hee', 'jinx', 'on my frog\'s life', 'by my wobbly tooth', 'hand on my pudding', 'and it\'s not fair', 'like a hundred times', 'for ever and ever',
    'and I\'m not sorry', 'bags not', 'teehee', 'on my best stick', 'and that\'s the rule', 'and I mean it',
  ]);
  frags('pet.rift', [
    'zero lag', 'no static', 'five bars', 'full charge', 'signal\'s clean', 'straight off the Relay', 'neon-bright', 'on the grid', 'end of transmission', 'logged and saved',
    'hard-wired', 'max brightness', 'by every billboard in Neverdark', 'no glitch', 'verified', 'firmware fresh', 'clean boot', 'all green', 'locked in', 'over and out',
    'running hot', 'bandwidth willing', 'cache cleared', 'on the frequency', 'zero buffer', 'signal boosted', 'mint condition', 'checksum clean', 'flagged and filed',
    'neon or nothing', 'by the Relay', 'high voltage', 'grid\'s honour',
  ]);
  // the wizard's business while he waits
  frags('fill', [
    'You knock the ash from your pipe.', 'You lean on the gate.', 'You blow a smoke ring, which drifts off towards the hills.', 'You scratch your nose with the end of your staff.',
    'You tip your hat to a more thoughtful angle.', 'You brush a moth off your sleeve.', 'You count the buttons on your waistcoat. All present.', 'You straighten your hat.',
    'You settle your back against the wall.', 'You find half a biscuit in your pocket, and eat it.', 'You watch a bee go about its business.', 'You draw a little star in the dust with your staff.',
    'You hum a bar of something old.', 'You prop your chin on your staff.', 'You blow a smoke ring shaped like a ship.', 'You nod slowly, like a wise old owl.',
    'You look at the sky, as if it might have an opinion.', 'You pick a burr off your robe.',
  ]);
  // little joints: exclamations, nods, likenesses, things to eat
  frags('oath', ['Bless me!', 'Goodness!', 'Gracious!', 'Mercy!', 'Well I never!', 'Crumbs!', 'Drat!', 'Bother!', 'Great green gooseberries!', 'Fiddlesticks!', 'Stone the crows!', 'Sakes alive!', 'My stars!', 'Heavens!', 'Bless my soul!', 'Jumping jam-pots!', 'Rattle my teacups!']);
  frags('ack', ['Go on.', 'Is that so?', 'Well, I never.', 'You don\'t say.', 'Fancy that.', 'Get away!', 'Never!', 'Is it, now?', 'Well, there you are.', 'Right you are.', 'Just so.', 'Quite right.']);
  frags('simile', [
    'like a badger in a bonnet', 'like a hen in a hailstorm', 'like a kettle on the boil', 'like a pig in clover', 'like a cat at the cream jug', 'like a toad in a teacup',
    'like a mole at a dance', 'like a goose at a wedding', 'like jam on a hot day', 'like a dropped pie', 'like a stuck gate', 'like butter in July', 'like a pudding in a puddle',
    'like a lost sheep', 'like a hedgehog in a hat shop', 'like the Water in spring', 'like a sparrow in a bath', 'like Grandad after pudding',
  ]);
  frags('snack', ['a seed-cake', 'a jam tart', 'a slice of pork pie', 'a buttered crumpet', 'a mushroom pasty', 'a toasted teacake', 'a bit of cheese', 'an apple turnover', 'a honey biscuit', 'a sausage roll', 'a scone with cream', 'a wedge of fruit loaf', 'a bowl of blackberries', 'a gingerbread hobbit']);
  frags('opener', ['Well now,', 'Now then,', 'Ha!', 'Oh,', 'Well,', 'Here,', 'Look here,', 'I say,', 'Ooh,', 'Right,']);

  // --- Greetings ----------------------------------------------------------------------
  lines('greet', [
    { text: ['Hello, wizard. Fine day for it, whatever it is.', 'Ah, good day to you.', 'Oh, hello there.', 'Wizard! Good day.'] },

    // toddlers: a word or two at a time
    at(9, { band: 'toddler' }, ['Wizzad!', 'Hat! Big hat!', 'Hiya!', 'Beard! Pull beard?', 'Up! Up!', '*hides behind a leg, then peeks out*']),
    at(9.3, { band: 'toddler', met: false }, ['*stares, thumb in mouth*', 'Who dat?', '*points at the hat and gasps*']),
    at(9.2, { band: 'toddler', sick: true }, ['*sniff* Tummy hurt.', 'Achoo! Wizzad, achoo!']),
    at(9.2, { band: 'toddler', hungry: true }, ['Bickit? Wizzad got bickit?', 'Num-num? Pease?']),
    at(9.2, { band: 'toddler', tired: true }, ['*yawns enormously*', 'No sleepy. *yawn*']),
    at(9.1, { band: 'toddler', weather: 'rain' }, ['Wet! Wizzad wet!', 'Puddle! Splash?']),
    at(9.1, { band: 'toddler', weather: 'snow' }, ['Snow! Snow on hat!', 'Cold! Brrr!']),
    at(9.1, { band: 'toddler', fond: { min: 0.3 } }, ['Wizzad! *runs and hugs your knees*', 'My wizzad!']),
    at(9.1, { band: 'toddler', phrParty: (p) => !!p }, ['Party! Dance! Wizzad dance!', 'Cake! Cake cake cake!']),
    at(9.1, { band: 'toddler', hour: 'night' }, ['*rubs eyes* Moon out.', 'Dark! Wizzad, dark!']),

    // first meeting
    at(8, { met: false }, [
      'Well! You\'ll be the wizard everyone\'s on about. How do you do?', 'Oh! A wizard. On my doorstep. And me in my second-best waistcoat.',
      'Good day to you, sir. You\'ll forgive me staring. We don\'t get many wizards.', 'So you\'re him. The fireworks one. How do you do?',
    ]),
    at(8.3, { met: false, temper: 'cheerful' }, ['Hello, hello! The wizard! Oh, this is a day. Come and meet everyone. Well, me first.', 'A wizard! Bless you for coming. You\'ll stay for tea? You\'ll stay for tea.', 'Welcome, welcome! Mind the step, everybody trips on it. That\'s tradition.']),
    at(8.3, { met: false, temper: 'ornery' }, ['If you\'re selling something, I\'ve already got one.', 'Wizard, are you? Well, keep your bangs and flashes away from my hens.', 'I suppose you\'ll want feeding. Everyone wants feeding.']),
    at(8.3, { met: false, temper: 'shy' }, ['Oh! Um. Hello. Sorry. Hello.', '*looks at your boots, then your hat, then your boots again* ...Good day.', 'I didn\'t think you\'d talk to me. Hello.']),
    at(8.3, { met: false, temper: 'curious' }, ['You\'re the wizard! Is the hat for anything? Does it do things? Can I see inside it?', 'A real wizard! How old are you? Sorry. How do you do? How old are you?', 'Where have you come from? What\'s in the wagon? Is the beard real? Sorry. Hello.']),
    at(8.3, { met: false, temper: 'dreamy' }, ['I dreamt a tall grey stranger would come up the lane. And here you are.', 'Oh. You look like you\'ve come from somewhere a long way off. Hello.', 'A wizard. I always hoped one would just... walk up. And one has.']),
    at(8.3, { met: false, temper: 'witty' }, ['A wizard! I\'d bow, but I\'d never get up again. How do you do?', 'So you\'re the wizard. I pictured you shorter. And with less hat.', 'Good morning! I hear that\'s what you say. Thought I\'d get in first.']),
    at(8.3, { met: false, temper: 'proud' }, ['Good day. {Full}. I keep the best-swept step in Thistledown. You may have noticed it.', 'A wizard. Well. I met a dwarf once, you know. You\'re not the first marvel round here.']),
    at(8.4, { met: false, temper: 'proud', home: (h) => !!h }, ['{Full}, of {home}. You\'ll have heard of us, I expect.']),
    at(8.3, { met: false, temper: 'gloomy' }, ['Oh. A wizard. I suppose that means trouble. It usually does, in stories.', 'Hello. You\'ll be wanting someone more interesting. Most folk do.', 'A wizard. Well. I hope you brought an umbrella. It\'ll rain now, you\'ll see.']),
    at(8.3, { met: false, stage: 'child' }, ['A WIZARD! Are you the real one? Is that a real staff? Can I hold it?', 'Mum! MUM! There\'s a wizard! ...She\'s not coming. Hello.', 'Have you got any fireworks? I\'m only asking. I\'m very good.']),
    at(8.5, { met: false, band: 'youth' }, ['Oh. Hi. You\'re the wizard? Brilliant. I mean, good. Good day.', 'Don\'t tell my mum I talked to you. Actually, do. She\'ll be amazed.', 'Everyone said you\'d come. I said I didn\'t care. ...Hello.']),
    at(8.5, { met: false, band: 'young' }, ['*hides behind the fence post* Are you a giant?', 'Are you a grandad? You look like a grandad. A tall one.', 'Is your beard warm? It looks warm.']),
    at(8.4, { met: false, register: 'fine' }, ['Good day to you, sir. Allow me: {full}. An honour, I\'m sure.', 'A wizard! How very distinguished. We are not, as a rule, visited.']),
    at(8.4, { met: false, register: 'plain' }, ['Well, I\'ll be. A wizard, large as life. How do.', 'Ah. Wizard. Right you are, then. Wipe your boots.']),
    at(8.4, { met: false, register: 'bright' }, ['Are you a wizard or a sorcerer? There\'s a difference. I read about it.', 'Good day! I\'ve read three books about wizards. You\'re not like any of them.']),
    at(8.4, { met: false, stage: 'elder' }, ['I\'ve heard of you since I was in short trousers. You\'ve not changed a bit. Have you?', 'A wizard, at my age. My old dad would\'ve been tickled. Good day to you.', 'Come closer, my eyes aren\'t what they were. Ah. Yes. Wizard. Thought so.']),
    at(8.5, { met: false, rift: true }, ['Oh, so you\'re the local legend. Hi. I\'m from... further than here.', 'A wizard. Huh. Back home that was a job title for people who fixed signal boxes.', 'Hey. You\'re the one with the light-shows. Respect. Proper analogue pyrotechnics.']),
    at(8.6, { met: false, rift: true, stage: 'child' }, ['Are you an app? You look like a help-screen. A tall one.', 'Whoa. Are you real? Real-real? Not a projection?']),
    at(8.7, { met: false, tipsy: true }, ['A wizard! Ha! Have a drink! Have you met me? I\'m lovely.', 'Is it a wizard or is it the ale? Both! Hello, both!']),
    at(8.7, { met: false, sick: true }, ['*sniff* A wizard, and me with a nose like a turnip. How do you do.', 'Don\'t come close. Pleased to meet you. Don\'t come close.']),
    at(8.7, { met: false, phrDoing: 'work' }, ['A wizard! Don\'t mind me, I\'ll keep working. I\'ll just stare a bit.', 'Oh! A wizard, and me up to my elbows in it. How do you do?']),
    at(8.7, { met: false, weather: 'rain' }, ['A wizard, in this rain! Come under the eaves, you\'re dripping on your beard.', 'Well! A wizard, and wet through. Come in out of it, do.']),
    at(8.7, { met: false, phrParty: (p) => !!p }, ['You\'re the wizard! It\'s your fireworks, isn\'t it? Oh, isn\'t this a night!', 'A wizard at the party! Now it\'s a proper party.']),

    // a promise broken
    at(7, { promiseBroken: true }, ['Oh. You. I\'m not cross. I\'m just... no, I\'m cross.', 'You said. You did say. I remember you saying.', 'Well. If it isn\'t the wizard who promises things.']),
    at(7.3, { promiseBroken: true, temper: 'ornery' }, ['Hmph. Some wizard. Words are cheap, I\'ll grant you that.', 'Back, are you? I\'d not have bothered, in your boots.']),
    at(7.3, { promiseBroken: true, temper: 'shy' }, ['...Oh. Hello. I thought... never mind what I thought.', 'It\'s all right. Folk forget. ...It\'s mostly all right.']),
    at(7.3, { promiseBroken: true, temper: 'cheerful' }, ['Oh, it\'s you! I was a bit cross with you, but I\'ve forgotten why. No, I remember. Hmph.']),
    at(7.3, { promiseBroken: true, temper: 'gloomy' }, ['I knew it wouldn\'t happen. I\'m not even surprised. I\'m a bit surprised.', 'Never mind. Nothing ever comes to anything. Hello.']),
    at(7.3, { promiseBroken: true, temper: 'proud' }, ['I don\'t make promises I can\'t keep, wizard. I\'d thought the same of you.']),
    at(7.3, { promiseBroken: true, temper: 'witty' }, ['Ah, the wizard of his word. Which word was it? Oh yes: "oops".']),
    at(7.3, { promiseBroken: true, temper: 'dreamy' }, ['I waited, you know. I sat by the window like someone in a song.']),
    at(7.3, { promiseBroken: true, temper: 'curious' }, ['What happened? I\'d really like to know. I\'m not cross. Much.']),
    at(7.3, { promiseBroken: true, stage: 'child' }, ['You PROMISED. You did. I was there.', 'I\'m not talking to you. ...Except to say I\'m not talking to you.']),
    at(7.4, { promiseBroken: true, rift: true }, ['You dropped the connection, wizard. Not cool.']),

    // a promise kept
    at(6.8, { promiseKept: true }, ['You did it! I didn\'t think you would. I mean, I did. Mostly.', 'A wizard who does what he says. Write it down, somebody.', 'There he is! As good as his word.']),
    at(7.1, { promiseKept: true, temper: 'cheerful' }, ['You! You absolute dear! Come here.']),
    at(7.1, { promiseKept: true, temper: 'ornery' }, ['Hm. You did what you said. I\'ll not make a fuss of it. ...Thank you.']),
    at(7.1, { promiseKept: true, temper: 'shy' }, ['...You remembered. Thank you. Really.']),
    at(7.1, { promiseKept: true, temper: 'proud' }, ['I told them you were as good as your word. I said it first, mind.']),
    at(7.1, { promiseKept: true, temper: 'gloomy' }, ['Well. Something went right. Don\'t get used to it. ...Thank you.']),
    at(7.1, { promiseKept: true, temper: 'witty' }, ['A wizard who keeps promises. Next you\'ll tell me the rooster\'s learned manners.']),
    at(7.1, { promiseKept: true, temper: 'dreamy' }, ['It came true. Like in a story. You did that.']),
    at(7.1, { promiseKept: true, temper: 'curious' }, ['How did you manage it? Go on. Wizard secrets?']),
    at(7.1, { promiseKept: true, stage: 'child' }, ['YOU DID IT! I knew you would! I told everyone you would!']),
    at(7.2, { promiseKept: true, rift: true }, ['Promise delivered. Five stars, wizard.']),

    // by a grave
    at(6.4, { phrDoing: 'grave' }, ['Oh. Wizard. I was just... sitting with them a while.', 'It\'s quiet here. I come and tell them the news.']),
    at(6.6, { phrDoing: 'grave', temper: 'gloomy' }, ['I don\'t mind you being here. It\'s nice to have someone living to talk to.']),
    at(6.6, { phrDoing: 'grave', stage: 'child' }, ['I was telling them about the frog I found. They\'d have liked the frog.']),
    at(6.6, { phrDoing: 'grave', temper: 'ornery' }, ['Can\'t a body sit in peace? ...Oh, it\'s you. Sit, then.']),

    // tipsy
    at(6, { tipsy: true }, ['Wizard! You came! Everyone, the wizard came! Where\'s everyone?', 'Is it you? There\'s two of you. Both lovely.', 'Have a sit. Have a drink. Have my drink. No, that one\'s mine.']),
    at(6.3, { tipsy: true, temper: 'cheerful' }, ['WIZARD! I love you. I love everyone. I love this fence.']),
    at(6.3, { tipsy: true, temper: 'ornery' }, ['You. You\'re all right, you are. Don\'t tell anyone I said.']),
    at(6.3, { tipsy: true, temper: 'shy' }, ['Hello! Hello! I\'m not shy at all today. Isn\'t it marvellous?']),
    at(6.3, { tipsy: true, temper: 'gloomy' }, ['Wizard. Sit. Let me tell you about my sorrows. All of them. In order.']),
    at(6.3, { tipsy: true, temper: 'proud' }, ['Have I ever told you I was the finest dancer in the Southfarthing? I was. Watch.']),
    at(6.3, { tipsy: true, temper: 'witty' }, ['Wizard! I\'ve thought of something terribly clever. Gone. It\'ll come back.']),
    at(6.3, { tipsy: true, temper: 'dreamy' }, ['Have you ever looked at the moon? Really looked? It\'s looking back.']),
    at(6.3, { tipsy: true, temper: 'curious' }, ['Wizard! Why are hats? I mean, why ARE they?']),
    at(6.4, { tipsy: true, rift: true }, ['Wizard! The ale here beats anything synthetic. Don\'t tell Neverdark.']),
    at(6.3, { tipsy: true, stage: 'elder' }, ['In my day we could drink a barrel and still walk a straight line. ...That\'s a straight line, isn\'t it?']),

    // poorly
    at(5.6, { sick: true }, ['*sniff* Don\'t come close. I\'ve a cold you could stand a spoon in.', 'Hello, wizard. I\'d shake your hand, but you\'d regret it.', '*cough* Oh, it\'s you. Pardon my nose.']),
    at(5.9, { sick: true, temper: 'cheerful' }, ['*sneeze* Bless me! Oh, I\'m fine. Mostly fine. Very sneezy.']),
    at(5.9, { sick: true, temper: 'ornery' }, ['Don\'t say I look poorly. I know I look poorly.']),
    at(5.9, { sick: true, temper: 'gloomy' }, ['This is it, wizard. This is the cold that finishes me.']),
    at(5.9, { sick: true, temper: 'proud' }, ['A slight chill. Nothing. I\'ve worked through worse. *coughs for some time*']),
    at(5.9, { sick: true, temper: 'witty' }, ['My nose has gone on strike. It demands better handkerchiefs.']),
    at(5.9, { sick: true, temper: 'shy' }, ['*muffled, behind a scarf* Hello. Don\'t look at my nose.']),
    at(5.9, { sick: true, stage: 'child' }, ['I\'m POORLY. I\'m allowed honey. Lots of honey.', 'I\'ve got a temperature. Feel. No, don\'t, you\'ll catch it.']),
    at(5.9, { sick: true, stage: 'elder' }, ['My old bones are complaining again. They\'ve a lot to say.']),
    at(6, { sick: true, rift: true }, ['System\'s down. Running on minimum. Hi.']),

    // a party: their own, then any
    at(5.4, { phrOwnParty: true }, ['It\'s my party! Mine! Did you bring me something? You don\'t have to. Did you?', 'Wizard! It\'s my birthday! Well, my party. Same thing.']),
    at(5.6, { phrOwnParty: true, temper: 'shy' }, ['It\'s my party and everyone\'s looking at me. Stand here. You\'re tall.']),
    at(5.6, { phrOwnParty: true, stage: 'child' }, ['IT\'S MY BIRTHDAY. I\'m a whole year older. Look. Taller.']),
    at(5, { phrParty: (p) => !!p }, ['Isn\'t it a night! Have you danced? You have to dance.', 'Wizard! There\'s a party! Well, you know. You\'re at it.', 'Lanterns, fiddles, and pie. What more could anyone want?']),
    at(5.2, { phrParty: 'highday' }, ['Highday! No work tomorrow. Well, some work. Less work.']),
    at(5.2, { phrParty: 'wedding' }, ['Isn\'t it lovely? A wedding! I cried at the vows. And at the pie.']),
    at(5.2, { phrParty: 'birthday', phrHost: (h) => !!h }, ['Have you wished {phrHost} many happy returns? You should. Loudly.']),
    at(5.2, { phrParty: 'yule' }, ['Happy Yule, wizard! Have a mince pie. Have four.']),
    at(5.2, { phrParty: 'harvest' }, ['Harvest home! The barns are full and so am I.']),
    at(5.2, { phrParty: 'midsummer' }, ['Midsummer! The shortest night. We\'d best not waste it.']),
    at(5.2, { phrParty: 'mayday' }, ['The maypole\'s up! Have you seen it? Ribbons everywhere.']),
    at(5.2, { phrParty: 'lantern' }, ['Lantern Night! Have you made your wish? Don\'t tell me.']),
    at(5.2, { phrParty: 'founding' }, ['Founders\' Day! To the first hole in Thistledown, and whoever dug it.']),
    at(5.2, { phrParty: 'feast' }, ['The long tables are out! Have you sat down? Sit by me.']),
    at(5.2, { phrParty: 'moot' }, ['The Moot\'s done and dusted. Now we dance, and forget what we voted for.']),
    at(5.2, { phrParty: 'wizard' }, ['It\'s your night, wizard! When\'s the dragon? Is there a dragon?']),
    at(5.2, { phrParty: 'fireworks' }, ['Are there fireworks? Say there are fireworks.']),
    at(5.2, { phrParty: 'coming-of-age' }, ['Someone\'s come of age! I remember when they were this high.']),
    at(5.2, { phrParty: 'house-warming' }, ['A new hole and a party in it. That\'s the proper order of things.']),
    at(5.2, { phrParty: 'opening' }, ['Something\'s been opened! I forget what. There\'s cake.']),
    at(5.2, { phrParty: 'holiday' }, ['A holiday! No work! I hardly know what to do with my hands.']),
    at(5.3, { phrParty: (p) => !!p, temper: 'shy' }, ['I don\'t really dance. I watch. Stand with me?']),
    at(5.3, { phrParty: (p) => !!p, temper: 'ornery' }, ['Too loud. Too many people. ...The pie\'s good, mind.']),
    at(5.3, { phrParty: (p) => !!p, temper: 'gloomy' }, ['Everyone\'s dancing. I\'m guarding the pie.']),
    at(5.3, { phrParty: (p) => !!p, temper: 'proud' }, ['Did you see me dance? Everyone saw me dance.']),
    at(5.3, { phrParty: (p) => !!p, stage: 'child' }, ['I\'ve had THREE cakes and I danced with a dog!', 'Are you doing the fireworks? Now? Now? How about now?']),
    at(5.3, { phrParty: (p) => !!p, rift: true }, ['Lanterns and fiddles. No screens. And it works. How does it work?']),

    // a long time away
    at(4.9, { met: true, daysSince: { min: 7 } }, ['Wizard! I\'d given you up for lost. Or eaten.', 'Well, look who\'s found his way back up the lane.', 'There you are! The weeks have gone by like cart-wheels.']),
    at(5, { met: true, daysSince: { min: 7 }, temper: 'ornery' }, ['Oh, it\'s you. Remembered where we live, did you?']),
    at(5, { met: true, daysSince: { min: 7 }, temper: 'shy' }, ['Oh! You came back. ...I mean, hello.']),
    at(5, { met: true, daysSince: { min: 7 }, temper: 'cheerful' }, ['WIZARD! Where have you BEEN? Never mind, you\'re here!']),
    at(5, { met: true, daysSince: { min: 7 }, temper: 'gloomy' }, ['I thought you\'d gone for good. People do.']),
    at(5, { met: true, daysSince: { min: 7 }, temper: 'proud' }, ['Ah, wizard. {DaysSince} days. Not that I was counting.']),
    at(5, { met: true, daysSince: { min: 7 }, stage: 'child' }, ['You were GONE for AGES. I grew. Look.']),
    at(5.05, { met: true, daysSince: { min: 20 } }, ['Is that... it is! I\'d half forgotten your face. Only half.', 'You\'ve been gone so long the hens have stopped talking about you.']),

    // callbacks, a share of talks each: an in-joke, a secret, a promise, the last thing you asked
    at(4.8, { joke: (j) => !!j, phrRoll: { max: 0.14 } }, ['Ha! I can\'t look at you without thinking: "{joke}"', 'Here he comes. I keep remembering: "{joke}" It gets me every time.', 'You! I told the whole lane: "{joke}" They didn\'t get it. We get it.']),
    at(4.9, { joke: (j) => !!j, phrRoll: { max: 0.14 }, temper: 'witty' }, ['I\'ve been polishing our joke. "{joke}" Better every time.']),
    at(4.9, { joke: (j) => !!j, phrRoll: { max: 0.14 }, temper: 'ornery' }, ['Don\'t you start. I know you\'re thinking it. "{joke}" Hmph. Ha.']),
    at(4.9, { joke: (j) => !!j, phrRoll: { max: 0.14 }, temper: 'shy' }, ['*giggles* Sorry. I just remembered: "{joke}"']),
    at(4.9, { joke: (j) => !!j, phrRoll: { max: 0.14 }, stage: 'child' }, ['Wizard! Remember? "{joke}" HAHAHA.']),
    at(4.95, { jokeKey: 'bishop', phrRoll: { max: 0.14 } }, ['Ah, the bishop! Come to inspect yourself?', 'Bishop to wizard\'s lane. Ha! Good day, your bishopness.']),
    at(4.95, { jokeKey: 'toad', phrRoll: { max: 0.14 } }, ['Turned anyone into a toad yet? I\'ve a list.']),
    at(4.95, { jokeKey: 'wizdream', phrRoll: { max: 0.14 } }, ['Here\'s our baker! Brought any bread? Ha!']),
    at(4.95, { jokeKey: 'touche', phrRoll: { max: 0.14 } }, ['En garde, wizard! Ha! Touché!']),
    at(4.8, { told: (t) => !!t, trust: { min: 0.2 }, phrRoll: { min: 0.14, max: 0.28 } }, ['*lowers voice* You\'ve not said anything? About what I told you?', 'Hello. You remember what I told you. Good. Don\'t. I mean, do. But don\'t.', '*glances round* Still between us, isn\'t it? Good.']),
    at(4.9, { told: (t) => !!t, trust: { min: 0.2 }, phrRoll: { min: 0.14, max: 0.28 }, temper: 'shy' }, ['*whispers* Hello. ...Our secret\'s still a secret?']),
    at(4.9, { told: (t) => !!t, trust: { min: 0.2 }, phrRoll: { min: 0.14, max: 0.28 }, stage: 'child' }, ['*whispering* Wizard. You know the thing. Did you tell? You didn\'t tell.']),
    at(4.95, { toldKey: 'evenings.project', phrRoll: { min: 0.14, max: 0.28 } }, ['Another one done. Don\'t ask what. You know what.']),
    at(4.8, { promiseOpen: sayPromise, phrRoll: { min: 0.28, max: 0.42 } }, ['Hello! I\'ve not forgotten. {PromiseOpen}.', 'Any news? {PromiseOpen}, and I\'m holding you to it.']),
    at(4.9, { promiseOpen: sayPromise, phrRoll: { min: 0.28, max: 0.42 }, temper: 'ornery' }, ['{PromiseOpen}. I\'m waiting, wizard. Patiently. Ish.']),
    at(4.9, { promiseOpen: sayPromise, phrRoll: { min: 0.28, max: 0.42 }, temper: 'gloomy' }, ['{PromiseOpen}. I expect it\'s too much bother. It\'s all right.']),
    at(4.9, { promiseOpen: sayPromise, phrRoll: { min: 0.28, max: 0.42 }, temper: 'cheerful' }, ['{PromiseOpen}! I\'ve been looking forward to it all week.']),
    at(4.9, { promiseOpen: sayPromise, phrRoll: { min: 0.28, max: 0.42 }, temper: 'shy' }, ['...Hello. I was only wondering. About the thing. {PromiseOpen}.']),
    at(4.9, { promiseOpen: sayPromise, phrRoll: { min: 0.28, max: 0.42 }, stage: 'child' }, ['{PromiseOpen}! Have you done it yet? Have you?']),
    at(4.8, { lastLabel: askedLast, daysSince: { min: 1, max: 6 }, phrRoll: { min: 0.42, max: 0.56 } }, ['You again! I\'ve been chewing on what you asked. "{lastLabel}" I\'ve a better answer now.', 'Last time it was "{lastLabel}" What\'ll it be today?']),
    at(4.9, { lastLabel: askedLast, daysSince: { min: 1, max: 6 }, phrRoll: { min: 0.42, max: 0.56 }, temper: 'ornery' }, ['If it\'s "{lastLabel}" again, I\'ve said all I\'m saying.']),
    at(4.9, { lastLabel: askedLast, daysSince: { min: 1, max: 6 }, phrRoll: { min: 0.42, max: 0.56 }, temper: 'witty' }, ['"{lastLabel}" you asked. I\'ve been composing my reply ever since.']),
    at(4.9, { lastLabel: askedLast, daysSince: { min: 1, max: 6 }, phrRoll: { min: 0.42, max: 0.56 }, temper: 'dreamy' }, ['I dreamt about what you asked me. "{lastLabel}" I dreamt a different answer.']),
    at(4.95, { lastThread: 'evenings', pastime: (p) => !!p, phrRoll: { min: 0.42, max: 0.56 } }, ['Come about the {madeMany} again? I\'ve done another since.']),
    at(4.95, { lastThread: 'how', phrRoll: { min: 0.42, max: 0.56 } }, ['I\'m better than last time, since you\'re going to ask. You were going to ask.']),
    at(4.95, { lastThread: 'mind', wish: (w) => !!w, phrRoll: { min: 0.42, max: 0.56 } }, ['Still thinking about {wishText}. Still wanting it, too.']),
    at(4.95, { lastThread: 'pass.riddle', phrRoll: { min: 0.42, max: 0.56 } }, ['I\'ve a riddle saved up to stump you. Brace yourself.']),
    at(4.95, { lastThread: 'pass.hat', phrRoll: { min: 0.42, max: 0.56 } }, ['I\'ve been thinking about your hat. More than I should, honestly.']),
    at(4.95, { lastThread: 'pass.wager', phrRoll: { min: 0.42, max: 0.56 } }, ['Ready to lose another wager, wizard?']),
    at(4.95, { lastThread: 'pass.song', phrRoll: { min: 0.42, max: 0.56 } }, ['I\'ve had that song in my head since you came. Thanks very much.']),
    at(4.95, { lastThread: 'pass.fortune', phrRoll: { min: 0.42, max: 0.56 } }, ['Your fortune\'s not come true yet. I\'m keeping an eye out.']),
    at(4.8, { respect: { min: 0.4 }, phrRoll: { min: 0.56, max: 0.64 } }, ['Wizard. I did what you said, you know. It worked, mostly.', 'Ah, the wise one. I\'ve a question saved up for you.']),
    at(4.8, { respect: { max: -0.2 }, phrRoll: { min: 0.56, max: 0.64 } }, ['Come to tell me how to live, have you?', 'Oh. The meddler. What is it now?']),
    at(4.8, { hearth: true, phrRoll: { min: 0.64, max: 0.78 } }, ['Oh, it\'s only you. I mean that nicely. You\'re family now.', 'You left your hat on the hook again. It frightened the cat.', 'There\'s a plate kept warm for you. There\'s always a plate.']),
    at(4.9, { hearth: true, phrRoll: { min: 0.64, max: 0.78 }, hour: 'morning' }, ['Morning, lodger! There\'s porridge if you\'re quick.', 'Did you sleep? You snore, you know. The whole hole knows.']),
    at(4.9, { hearth: true, phrRoll: { min: 0.64, max: 0.78 }, stage: 'child' }, ['Our wizard! You\'re OUR wizard. I told everyone at story time.']),

    // back the same day
    at(4.4, { met: true, daysSince: 0, talks: { min: 1 }, phrRoll: { max: 0.6 } }, ['Back again? You\'ll wear a groove in my path.', 'Twice in a day! Folk will talk.', 'Forgotten something? Your hat\'s still on, I checked.']),
    at(4.6, { met: true, daysSince: 0, talks: { min: 1 }, phrRoll: { max: 0.6 }, temper: 'ornery' }, ['You again. Already.']),
    at(4.6, { met: true, daysSince: 0, talks: { min: 1 }, phrRoll: { max: 0.6 }, stage: 'child' }, ['AGAIN! Yay! Again again!']),
    at(4.6, { met: true, daysSince: 0, talks: { min: 1 }, phrRoll: { max: 0.6 }, temper: 'shy' }, ['Oh! Hello again. ...Hello.']),

    // at work
    at(4.2, { phrDoing: 'work' }, ['Don\'t mind if I keep at it. Work won\'t wait, even for wizards.', 'Oh! Wizard. You\'ve caught me mid-job. Mind your robes.', 'Can\'t stop long. Well, I can stop a bit.']),
    at(4.4, { phrDoing: 'work', job: 'farmer' }, ['Can\'t stop. The barley won\'t reap itself. I\'ve asked.', 'Mind the furrow, wizard. I\'ve only just got it straight.']),
    at(4.4, { phrDoing: 'work', job: 'miller' }, ['Shout up, wizard, the wheel\'s going. WHAT? Oh, hello.', 'You\'ll go home floury. Everyone does.']),
    at(4.4, { phrDoing: 'work', job: 'baker' }, ['Mind the oven door. Flour on your hat already, look.', 'Can\'t stop, the bread\'s proving. It\'s very proud of itself.']),
    at(4.4, { phrDoing: 'work', job: 'brewer' }, ['Careful, wizard, the mash is at a delicate stage. Speak softly.', 'Brewing. Don\'t breathe on it.']),
    at(4.4, { phrDoing: 'work', job: 'innkeeper' }, ['What\'ll it be? Oh, a talk you\'re after. No charge for that. Usually.', 'Wipe your feet, the floor\'s just been swept. In theory.']),
    at(4.4, { phrDoing: 'work', job: 'grower' }, ['Leaf\'s coming on lovely. Smell that? That\'s next year\'s pipe.', 'Mind the rows. Every leaf\'s spoken for.']),
    at(4.4, { phrDoing: 'work', job: 'fisher' }, ['Shh! You\'ll frighten the fish. They know about wizards.', 'Not a bite all morning. Perhaps you\'re lucky. Stand there.']),
    at(4.4, { phrDoing: 'work', job: 'woodwright' }, ['Stand clear, wizard! Tree coming down! ...Not yet. Soon.', 'Sawdust in your beard already. Suits you.']),
    at(4.4, { phrDoing: 'work', job: 'herbalist' }, ['Mind the feverfew! You\'re standing in it. Lovely, thank you.', 'Hold out your hand. No, just smell this. Good, isn\'t it?']),
    at(4.4, { phrDoing: 'work', job: 'orchardist' }, ['Mind the bees! They\'re friendly. Mostly.', 'Apple? Go on. Windfalls. Nobody\'ll miss one.']),
    at(4.4, { phrDoing: 'work', job: 'herder' }, ['Mind where you step, wizard. The sheep have been busy.', 'Don\'t let Buttercup see your hat. She eats hats.']),
    at(4.4, { phrDoing: 'work', job: 'postie' }, ['Nothing for you today. Nothing for anyone, from the weight of this bag.', 'Can\'t stop! Letters to take. One\'s a love letter. I can tell by the smudges.']),
    at(4.4, { phrDoing: 'work', job: 'storyteller' }, ['Shh! The little ones are doing their letters. Whisper.', 'You can stay if you sit on the floor. Everyone sits on the floor.']),
    at(4.4, { phrDoing: 'work', job: 'tinker' }, ['Hold this. No, the other end. Thanks. Hi, wizard.', 'Don\'t touch the blue wire. Or the red one. Hi.']),
    at(4.5, { phrDoing: 'work', temper: 'ornery' }, ['Some of us have work to do, wizard. Some of us aren\'t wizards.', 'If you\'re not here to help, you\'re in the way. Hello.']),
    at(4.5, { phrDoing: 'work', temper: 'shy' }, ['Oh! You startled me. I\'ll just... keep at it. Hello.']),
    at(4.5, { phrDoing: 'work', temper: 'witty' }, ['If you\'ve come to help, the broom\'s there. If not, the broom\'s still there.']),
    at(4.5, { phrDoing: 'work', temper: 'proud' }, ['Watch and learn, wizard. This is how it\'s done.']),
    at(4.5, { phrDoing: 'work', temper: 'cheerful' }, ['Wizard! Come and see! Work\'s more fun with someone to show.']),
    at(4.5, { phrDoing: 'work', temper: 'gloomy' }, ['Work, work, work. It never ends. Hello.']),
    at(4.5, { phrDoing: 'work', stage: 'elder' }, ['At my age I should be sitting down. Don\'t tell anyone I like it.']),
    at(4.6, { phrDoing: 'work', job: 'baker', temper: 'proud' }, ['Best loaves in the Shire. Don\'t argue, just sniff.']),
    at(4.6, { phrDoing: 'work', job: 'farmer', temper: 'ornery' }, ['If you\'ve come to tell me it\'ll rain, I know. My knees told me.']),
    at(4.6, { phrDoing: 'work', job: 'tinker', rift: true }, ['Wizard. I\'m mid-solder. Talk, but don\'t make me laugh.']),

    // hungry, tired
    at(4, { hungry: true }, ['Is it time for something yet? It feels like it\'s time for something.', 'Wizard! You haven\'t got a scone about you, have you?', 'My stomach\'s been talking louder than me all morning.']),
    at(4.2, { hungry: true, phrMeal: MEAL }, ['It\'s {phrMeal} and I\'ve had nothing. Nothing!', 'Is it {phrMeal} yet? Tell me it\'s {phrMeal}.']),
    at(4.2, { hungry: true, stage: 'child' }, ['I\'m STARVING. I\'m going to die. Have you got cake?']),
    at(4.2, { hungry: true, temper: 'ornery' }, ['Don\'t talk to me before I\'ve eaten. Well, go on, quickly.']),
    at(4.2, { hungry: true, temper: 'gloomy' }, ['Hungry. The larder\'s a desert. Hello.']),
    at(3.9, { tired: true }, ['*yawns* Sorry. Hello. *yawns again*', 'I\'m that tired I could sleep standing. Like a horse.']),
    at(4.1, { tired: true, hour: 'night' }, ['Is it bedtime? It feels like bedtime. It\'s been bedtime for hours.']),
    at(4.1, { tired: true, stage: 'child' }, ['I\'m not tired. *yawns* I\'m NOT.']),
    at(4.1, { tired: true, temper: 'ornery' }, ['I\'ve been up since before the rooster. Say it quick.']),

    // what they were doing when you stopped them
    at(3.6, { phrDoing: 'meal' }, ['Join me? There\'s plenty. There\'s always plenty.', 'You\'ve caught me with my mouth full. Hello! Sorry. Crumbs.']),
    at(3.6, { phrDoing: 'baking' }, ['Mind your hat on the shelf, the scones are cooling.', 'I\'ve a batch in the oven. Don\'t let me forget it.']),
    at(3.6, { phrDoing: 'ale' }, ['Pull up a stool! The ale\'s good today. It\'s always good. That\'s the trouble.', 'Just the one, wizard. I\'m only having the one. Or this one.']),
    at(3.6, { phrDoing: 'tea' }, ['There\'s tea in the pot. There\'s always tea in the pot.', 'Sit, sit. Milk? Sugar? Both, like a sensible hobbit?']),
    at(3.6, { phrDoing: 'pipe' }, ['*puffs* Afternoon, wizard. Or whatever it is. Have a fill?', 'Smoke ring? Watch. ...That was meant to be a ship.']),
    at(3.6, { phrDoing: 'garden' }, ['Mind the lettuces! Hello. Mind them.', 'Weeding. It\'s like arguing with slugs, but they listen.']),
    at(3.6, { phrDoing: 'fish' }, ['Shh. They\'re biting. Well, one was. Once.', 'Nothing yet. The fish are having a lie-in.']),
    at(3.6, { phrDoing: 'forage' }, ['Mushrooms! Look! Don\'t tell anyone where. Especially not the neighbours.', 'I know a patch. I\'m not saying where. I\'m saying it\'s good.']),
    at(3.6, { phrDoing: 'read' }, ['Oh! I was miles away. In a book. A good one, with a dragon.', 'Just one more page. ...Hello. Sorry. One more page.']),
    at(3.6, { phrDoing: 'letter' }, ['I\'m writing a letter. Don\'t read over my shoulder. Hello.']),
    at(3.6, { phrDoing: 'nap' }, ['*wakes with a snort* I wasn\'t asleep. I was resting my eyes.', 'Mm? Oh. I was just thinking. Very hard. With my eyes closed.']),
    at(3.6, { phrDoing: 'stroll' }, ['Just taking the air. It\'s very good air today. Help yourself.', 'Out for a potter. Pottering\'s underrated.']),
    at(3.6, { phrDoing: 'play' }, ['We\'re playing hide and seek! You can\'t hide. You\'re too big.', 'Tag! You\'re it! ...You\'re not playing. Fine.']),
    at(3.6, { phrDoing: 'party' }, ['Did you hear me play? Was it good? Lie if you must.', 'Fireworks! Did you see the green one? Do the green one again.']),
    at(3.6, { phrDoing: 'chat' }, ['We were only talking about you a little bit. Nicely. Mostly.', 'Oh, you\'ve missed the best bit. I\'ll tell you later.']),
    at(3.6, { phrDoing: 'court' }, ['Oh! Wizard! I was just... these flowers aren\'t for anyone. Hello.', 'Don\'t look at me like that. I\'m allowed to pick flowers.']),
    at(3.6, { phrDoing: 'market' }, ['Been to the Store. Look at these turnips. Beauties.', 'They\'d run out of honey. Run out! What\'s the world coming to?']),
    at(3.6, { phrDoing: 'baby' }, ['Shh! Baby\'s nearly off. Whisper. Whisper smaller.', 'Don\'t make any sudden noises. Or any noises.']),
    at(3.6, { phrDoing: 'lesson' }, ['It\'s story time! You can come. You have to sit on the floor.', 'I\'m learning! Ask me something. Not sums.']),
    at(3.6, { phrDoing: 'pet' }, ['This is my cat. She\'s better than people. No offence.', 'Say hello to the cat. She won\'t say hello back. She\'s like that.']),
    at(3.6, { phrDoing: 'soup' }, ['Can\'t stop, I\'m taking soup to someone poorly. Mind, it\'s hot.']),
    at(3.7, { phrDoing: 'hobby', pastime: (p) => !!p }, ['{PastimeWord}! I was just at it. Look at my hands.']),
    at(3.8, { phrDoing: 'hobby', pastime: 'carving' }, ['Mind the shavings. I\'m doing a hedgehog. It\'s going well. It\'s going badly.']),
    at(3.8, { phrDoing: 'hobby', pastime: 'knitting' }, ['Hold this wool. No, both hands. There. Hello.']),
    at(3.8, { phrDoing: 'hobby', pastime: 'painting' }, ['Don\'t look! It\'s not finished. It\'s never finished.']),
    at(3.8, { phrDoing: 'hobby', pastime: 'pottery' }, ['Clay hands, sorry. I\'d wave, but I\'d hit you.']),
    at(3.8, { phrDoing: 'hobby', pastime: 'basketry' }, ['Another basket! You can never have too many. My family disagrees.']),
    at(3.8, { phrDoing: 'hobby', pastime: 'collecting' }, ['Look at this stone. Look at it! It\'s got a face.']),
    at(3.8, { phrDoing: 'hobby', pastime: 'birdwatching' }, ['Shh. Wren. There. No, there. ...Gone.']),
    at(3.8, { phrDoing: 'meal', temper: 'proud' }, ['Mushrooms in butter. My own recipe. You may have a mushroom.']),
    at(3.8, { phrDoing: 'ale', temper: 'gloomy' }, ['Sit down. The ale\'s the only thing that\'s gone right today.']),
    at(3.8, { phrDoing: 'pipe', temper: 'dreamy' }, ['*watches a smoke ring drift off* Where do they go, do you think?']),
    at(3.8, { phrDoing: 'read', temper: 'curious' }, ['Did you know there are fish that climb trees? It says so here. Do you believe it?']),
    at(3.8, { phrDoing: 'nap', temper: 'ornery' }, ['Can\'t a hobbit nap in peace? Oh. You. What?']),
    at(3.8, { phrDoing: 'play', band: 'youth' }, ['We weren\'t playing. We\'re too old to play. We were... organising.']),

    // lonely
    at(3.5, { lonely: true }, ['Oh! Company! I\'ve not had a word with anyone all day.', 'Wizard! Stay a bit. Say anything. I\'ve been talking to the hens.']),
    at(3.7, { lonely: true, temper: 'shy' }, ['...I\'m glad it\'s you. I\'m glad it\'s anyone, actually.']),
    at(3.7, { lonely: true, stage: 'child' }, ['Will you play with me? Nobody will play with me.']),
    at(3.7, { lonely: true, temper: 'ornery' }, ['Oh, it\'s you. Well. Don\'t go just yet.']),
    at(3.7, { lonely: true, rift: true }, ['Hey. Signal\'s quiet today. Glad you\'re here.']),

    // the talk's flavour: the weather
    at(2.5, { phrFlavour: 'weather', weather: 'rain' }, ['Wet enough for you? It\'s wet enough for me.', 'In you come, under the eaves. You\'re dripping like a teapot.', 'Rain again! Good for the turnips. Bad for my temper.', 'Your hat\'s holding about a pint of rain, wizard.']),
    at(2.6, { phrFlavour: 'weather', phrStorm: true }, ['Did you hear that thunder? I\'ve lost a hen. She\'ll be under the bed.', 'What a storm! Don\'t stand under the oak. Or near me. You\'re very tall.']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', temper: 'cheerful' }, ['Isn\'t it a lovely rain? Puddles everywhere! I\'ve jumped in four.']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', temper: 'ornery' }, ['Rain. Of course it\'s rain. When\'s it ever not rain?']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', temper: 'gloomy' }, ['It\'ll rain all week, you\'ll see. All year, maybe.']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', temper: 'dreamy' }, ['I love the rain. Everything goes soft, like a drawing.']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', temper: 'witty' }, ['Did you bring this rain? It looks like your sort of weather.']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', temper: 'shy' }, ['Oh. You\'re wet. Do you want... a towel? I\'ve got one. Somewhere.']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', stage: 'child' }, ['I\'ve been in EVERY puddle. Mum\'s going to be so cross.']),
    at(2.8, { phrFlavour: 'weather', weather: 'rain', rift: true }, ['Water just falls out of the sky here. For free. Still weird.']),
    at(2.5, { phrFlavour: 'weather', weather: 'snow' }, ['Snow! Mind the drifts by the gate, they\'re deeper than they look.', 'Your beard\'s gone white. Well, whiter.']),
    at(2.7, { phrFlavour: 'weather', weather: 'snow', temper: 'cheerful' }, ['Snow! Have you made a snow-hobbit? I\'ve made three.']),
    at(2.7, { phrFlavour: 'weather', weather: 'snow', temper: 'ornery' }, ['Snow. Lovely to look at, murder to shovel.']),
    at(2.7, { phrFlavour: 'weather', weather: 'snow', stage: 'child' }, ['SNOW! Snowball fight! You\'re on my side. No, you\'re the target.']),
    at(2.7, { phrFlavour: 'weather', weather: 'snow', stage: 'elder' }, ['Snow gets into the knees at my age. Still pretty, mind.']),
    at(2.8, { phrFlavour: 'weather', weather: 'snow', rift: true }, ['Frozen rain! Back home it was just grey slush. With adverts in the slush.']),
    at(2.5, { phrFlavour: 'weather', weather: 'clear' }, ['Lovely day! The sort you could bottle.', 'Not a cloud. Somebody up there\'s in a good mood.']),
    at(2.6, { phrFlavour: 'weather', weather: 'clear', season: 'summer' }, ['Hot enough to bake bread on the doorstep. I\'ve tried.']),
    at(2.6, { phrFlavour: 'weather', weather: 'clear', season: 'winter' }, ['Bright and cold. My breath\'s making little clouds. Look.']),
    at(2.7, { phrFlavour: 'weather', weather: 'clear', temper: 'ornery' }, ['Too bright. Hurts the eyes. Mustn\'t grumble. I will, though.']),
    at(2.7, { phrFlavour: 'weather', weather: 'clear', temper: 'gloomy' }, ['Sunny. It won\'t last.']),
    at(2.7, { phrFlavour: 'weather', weather: 'clear', temper: 'dreamy' }, ['Have you ever seen the sky so blue? It\'s like it\'s been washed.']),
    at(2.7, { phrFlavour: 'weather', weather: 'clear', stage: 'child' }, ['It\'s sunny so I\'m allowed out ALL day!']),
    at(2.8, { phrFlavour: 'weather', weather: 'clear', rift: true }, ['Real sun. No filters. It\'s kind of a lot, honestly.']),
    at(2.5, { phrFlavour: 'weather', weather: 'cloudy' }, ['Grey old day. Might rain, might not. Might do both.', 'Cloudy. Good drying weather, if it holds.']),
    at(2.7, { phrFlavour: 'weather', weather: 'cloudy', temper: 'gloomy' }, ['Grey. Suits me.']),
    at(2.7, { phrFlavour: 'weather', weather: 'cloudy', temper: 'witty' }, ['Clouds like a fleece. Somebody up there\'s keeping sheep.']),
    at(2.5, { phrFlavour: 'weather', weather: 'fog' }, ['Fog\'s thick as porridge. I heard you before I saw you.', 'Mist on the Water. Can\'t see my own feet. Hello, I think.']),
    at(2.7, { phrFlavour: 'weather', weather: 'fog', temper: 'dreamy' }, ['Fog. The whole valley\'s gone secret.']),
    at(2.7, { phrFlavour: 'weather', weather: 'fog', stage: 'child' }, ['I can\'t see ANYTHING. Are you a ghost? You\'re a ghost.']),
    at(2.8, { phrFlavour: 'weather', weather: 'fog', rift: true }, ['Fog. Feels like home. Smog, but kinder.']),

    // the hour
    at(2.5, { phrFlavour: 'hour', hour: 'morning' }, ['Morning! The kettle\'s not cold yet. Fancy a cup?', 'Up with the larks, are we? Larks and wizards.', 'Morning, wizard. Have you breakfasted? Twice?']),
    at(2.7, { phrFlavour: 'hour', hour: 'morning', temper: 'ornery' }, ['Too early for talking. Talk quietly.']),
    at(2.7, { phrFlavour: 'hour', hour: 'morning', temper: 'gloomy' }, ['Morning. Another one.']),
    at(2.7, { phrFlavour: 'hour', hour: 'morning', temper: 'cheerful' }, ['Morning! Isn\'t it a morning? It\'s the best one yet.']),
    at(2.7, { phrFlavour: 'hour', hour: 'morning', temper: 'proud' }, ['Morning. I\'ve been up since five. Swept, baked, mended. You?']),
    at(2.7, { phrFlavour: 'hour', hour: 'morning', stage: 'child' }, ['I\'ve been up for HOURS. Since it was dark. Nearly.']),
    at(2.7, { phrFlavour: 'hour', hour: 'morning', stage: 'elder' }, ['Morning. I wake earlier every year. Soon I\'ll be up before I\'ve gone to bed.']),
    at(2.8, { phrFlavour: 'hour', hour: 'morning', rift: true }, ['Morning. Still not used to the sun being the alarm.']),
    at(2.5, { phrFlavour: 'hour', hour: 'afternoon' }, ['Afternoon, wizard. That sleepy time after luncheon.', 'Good afternoon. Have you had luncheon? You look like you\'ve had luncheon.']),
    at(2.7, { phrFlavour: 'hour', hour: 'afternoon', temper: 'witty' }, ['Afternoon! The finest part of the day. Lunch behind, tea ahead.']),
    at(2.7, { phrFlavour: 'hour', hour: 'afternoon', temper: 'dreamy' }, ['Afternoons go on for ever, don\'t they? I like that.']),
    at(2.5, { phrFlavour: 'hour', hour: 'evening' }, ['Evening, wizard. Lamps are going on all down the lane.', 'Evening! The bats are out. Mind your hat.']),
    at(2.7, { phrFlavour: 'hour', hour: 'evening', temper: 'cheerful' }, ['Evening! Supper\'s on, and it\'s mushrooms.']),
    at(2.7, { phrFlavour: 'hour', hour: 'evening', temper: 'gloomy' }, ['Getting dark early. It always does.']),
    at(2.7, { phrFlavour: 'hour', hour: 'evening', temper: 'dreamy' }, ['Look at that sky. Pink as a piglet.']),
    at(2.7, { phrFlavour: 'hour', hour: 'evening', stage: 'child' }, ['It\'s nearly bedtime and I\'m NOT tired.']),
    at(2.8, { phrFlavour: 'hour', hour: 'evening', rift: true }, ['Sunset. Every day, free of charge. You lot don\'t know how lucky you are.']),
    at(2.5, { phrFlavour: 'hour', hour: 'night' }, ['Out late, wizard! Owls and wizards, that\'s all that\'s about.', 'Bit late for calling, isn\'t it? I\'m in my nightshirt, near enough.']),
    at(2.7, { phrFlavour: 'hour', hour: 'night', temper: 'ornery' }, ['Do you know what time it is? I do. It\'s bedtime.']),
    at(2.7, { phrFlavour: 'hour', hour: 'night', temper: 'dreamy' }, ['Look at the stars. All of them, just there.']),
    at(2.7, { phrFlavour: 'hour', hour: 'night', stage: 'child' }, ['I\'m supposed to be in bed. Don\'t tell.']),
    at(2.8, { phrFlavour: 'hour', hour: 'night', rift: true }, ['Night. Actually dark. I keep looking for the switch for the sky.']),

    // the season
    at(2.5, { phrFlavour: 'season', season: 'spring' }, ['Spring at last! The lambs are out, and so am I.', 'Smell that? Blossom. And something muddier.']),
    at(2.5, { phrFlavour: 'season', season: 'summer' }, ['Lovely and warm. I could lie in the hay all day. I might.', 'Summer! Strawberries, long evenings and warm toes.']),
    at(2.5, { phrFlavour: 'season', season: 'autumn' }, ['Leaves coming down. I\'ve swept the path three times today.', 'Autumn! Apples, mushrooms, the fire lit. Best time of year.', 'Smell the woodsmoke? Autumn\'s here proper.']),
    at(2.5, { phrFlavour: 'season', season: 'winter' }, ['Cold enough to freeze the ale. Nearly. Not quite. We checked.', 'Winter. I\'ve three jumpers on and I can feel every one.', 'Come by the fire. Your nose has gone the colour of a radish.']),
    at(2.7, { phrFlavour: 'season', season: 'spring', temper: 'proud' }, ['My daffodils came up first in the lane. Again.']),
    at(2.7, { phrFlavour: 'season', season: 'spring', stage: 'child' }, ['There\'s a nest in the hedge with EGGS in it! Don\'t tell the cat.']),
    at(2.7, { phrFlavour: 'season', season: 'summer', temper: 'ornery' }, ['Too hot. Flies everywhere. Hmph.']),
    at(2.7, { phrFlavour: 'season', season: 'summer', temper: 'dreamy' }, ['Summer evenings. I could stay up all night and still not finish one.']),
    at(2.7, { phrFlavour: 'season', season: 'autumn', temper: 'gloomy' }, ['The leaves are falling. Everything ends, wizard.']),
    at(2.7, { phrFlavour: 'season', season: 'autumn', stage: 'child' }, ['I found a conker THIS big. It\'s a champion. It\'s undefeated.']),
    at(2.7, { phrFlavour: 'season', season: 'winter', temper: 'cheerful' }, ['Snowdrops by the gate! Winter\'s not all bad.']),
    at(2.7, { phrFlavour: 'season', season: 'winter', temper: 'dreamy' }, ['Winter nights are for stories. Have you got one?']),
    at(2.8, { phrFlavour: 'season', rift: true }, ['Seasons. You lot just have them. Ours were set by the city council.']),
    at(2.8, { phrFlavour: 'season', season: 'winter', rift: true }, ['Cold\'s different here. Cleaner. Still cold.']),

    // the meal it is
    at(2.5, { phrFlavour: 'meal', phrMeal: 'before breakfast' }, ['You\'re up before breakfast! That\'s nearly indecent.']),
    at(2.5, { phrFlavour: 'meal', phrMeal: 'breakfast' }, ['Breakfast time! Eggs, bacon, mushrooms. Are you stopping?']),
    at(2.5, { phrFlavour: 'meal', phrMeal: 'second breakfast' }, ['Second breakfast! The best breakfast. Don\'t tell the first one.']),
    at(2.5, { phrFlavour: 'meal', phrMeal: 'elevenses' }, ['Elevenses already? Where does the morning go?', 'You\'re just in time for elevenses. Funny, that. You always are.']),
    at(2.5, { phrFlavour: 'meal', phrMeal: 'luncheon' }, ['Luncheon soon. I can feel it coming, like weather.']),
    at(2.5, { phrFlavour: 'meal', phrMeal: 'afternoon tea' }, ['Is it teatime? It\'s always teatime somewhere. Usually here.']),
    at(2.5, { phrFlavour: 'meal', phrMeal: 'dinner' }, ['Dinner\'s on. Can you smell it? That\'s mine. The good one.']),
    at(2.5, { phrFlavour: 'meal', phrMeal: 'supper' }, ['Supper soon. Something hot and something sweet, I think.']),
    at(2.5, { phrFlavour: 'meal', phrMeal: 'bedtime' }, ['Last cup of cocoa and then bed. Join me for the cocoa?']),
    at(2.5, { phrFlavour: 'meal', phrMeal: 'small hours' }, ['What are you doing up at this hour? What am I?']),
    at(2.7, { phrFlavour: 'meal', stage: 'child' }, ['Is it pudding time? It feels like pudding time.']),
    at(2.7, { phrFlavour: 'meal', temper: 'gloomy', phrMeal: MEAL }, ['{PhrMeal}. I\'m not hungry. I\'ll have some anyway.']),
    at(2.8, { phrFlavour: 'meal', rift: true, phrMeal: MEAL }, ['{PhrMeal}. You lot have a meal for every hour. I love it here.']),

    // how fond of you they are
    at(2.5, { phrFlavour: 'fond', fond: { min: 0.6 } }, ['Oh, it\'s you! Come here. Let me look at you.', 'My favourite wizard. My only wizard, but still.', 'I was just thinking of you! That\'s twice today.', 'There you are. The day\'s better already.']),
    at(2.5, { phrFlavour: 'fond', fond: { min: 0.3, max: 0.6 } }, ['Ah, hello! Good to see you.', 'Hello again. You\'re looking well. For a wizard.']),
    at(2.5, { phrFlavour: 'fond', fond: { min: 0.05, max: 0.3 } }, ['Hello, wizard. Passing through?', 'Good day. What brings you this way?']),
    at(2.5, { phrFlavour: 'fond', fond: { min: -0.15, max: 0.05 } }, ['Oh. Hello.', 'Wizard. Good day, I suppose.']),
    at(2.5, { phrFlavour: 'fond', fond: { max: -0.15 } }, ['Oh, it\'s you. I\'d hoped it was the postie.', 'You again. Well, say your piece.']),
    at(2.6, { phrFlavour: 'fond', fond: { max: -0.4 } }, ['I\'ve nothing to say to you. ...Well, what is it?']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.6 }, temper: 'shy' }, ['*smiles at the ground* Hello. I\'m glad it\'s you.']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.6 }, temper: 'ornery' }, ['Oh, it\'s you. Good. I mean, hmph. Good.']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.6 }, temper: 'proud' }, ['Wizard. I\'ve told everyone we\'re friends. Don\'t make a liar of me.']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.6 }, temper: 'gloomy' }, ['You\'re the only good thing about today. Don\'t let it go to your head.']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.6 }, stage: 'child' }, ['WIZARD! *hugs your leg and won\'t let go*']),
    at(2.8, { phrFlavour: 'fond', fond: { min: 0.6 }, rift: true }, ['Hey, you. Best thing the rift ever dropped me next to.']),

    // their temper
    at(2.5, { phrFlavour: 'temper', temper: 'cheerful' }, ['Hello, hello! What a day for it!', 'Wizard! Isn\'t everything lovely?', 'Oh, good! I was hoping for someone to tell. Hello!']),
    at(2.5, { phrFlavour: 'temper', temper: 'ornery' }, ['What is it?', 'Make it quick, I\'ve things to do.', 'If it\'s about the fence, it wasn\'t me.']),
    at(2.5, { phrFlavour: 'temper', temper: 'shy' }, ['Oh! H-hello.', '*waves, very small*', 'Hello. Sorry. Hello.']),
    at(2.5, { phrFlavour: 'temper', temper: 'curious' }, ['Wizard! I\'ve got questions. Loads. Have you a minute? An hour?', 'What\'ve you got there? Is that a new pocket?', 'Oh good, you. Tell me something I don\'t know.']),
    at(2.5, { phrFlavour: 'temper', temper: 'dreamy' }, ['Hm? Oh! Hello. I was somewhere else.', 'I was just watching the clouds. One looked like you.']),
    at(2.5, { phrFlavour: 'temper', temper: 'witty' }, ['Ah, the wizard! Still tall, I see.', 'Good day! If it isn\'t, I\'ll take it back.', 'Wizard! I was just thinking about you. Something funny. Can\'t remember.']),
    at(2.5, { phrFlavour: 'temper', temper: 'proud' }, ['Good day. You\'ll have noticed the step. Swept it myself.', 'Ah. Wizard. Glad you came to see me first. You did, didn\'t you?']),
    at(2.5, { phrFlavour: 'temper', temper: 'gloomy' }, ['Oh. Hello. Don\'t mind me.', 'Hello. Nothing\'s wrong. Everything\'s wrong. Hello.']),
    at(2.5, { phrFlavour: 'temper', stage: 'child' }, ['Wizard! Wizard wizard wizard!', 'Have you got sweets? Hello. Have you got sweets?', 'Look! I lost a tooth! Well, it fell out.']),
    at(2.7, { phrFlavour: 'temper', band: 'youth' }, ['Oh. Hi. Don\'t make a fuss, everyone\'s looking.', 'Wizard. Hello. You\'re not going to do magic, are you? In public?']),
    at(2.6, { phrFlavour: 'temper', rift: true }, ['Hey, wizard. Your signal\'s strong today.', 'Oh hey. Was hoping you\'d swing by.']),
    at(2.6, { phrFlavour: 'temper', stage: 'elder' }, ['At my age every visitor\'s a treat. Even wizards.', 'Ah, there you are. Sit down before you fall down. Not you. Me.']),
    at(2.5, { phrFlavour: 'temper' }, ['Well, here\'s the wizard, {pet}.', 'Good to see you, wizard, {pet}.']),

    // their register
    at(2.5, { phrFlavour: 'register', register: 'fine' }, ['Good day to you, sir. A pleasure, as always.', 'Ah, wizard! Do come in. Well, not in. You\'re far too tall.', 'Salutations! I\'ve been reading. One does.']),
    at(2.5, { phrFlavour: 'register', register: 'plain' }, ['Ah. Wizard. How do.', '\'Day, wizard. Wet one. Or dry. Whichever it is.', 'Now then, wizard. All right?']),
    at(2.5, { phrFlavour: 'register', register: 'common' }, ['Hello there, wizard!', 'Afternoon! Or morning. Whatever it is, hello.']),
    at(2.5, { phrFlavour: 'register', register: 'bright' }, ['Wizard! Did you know a hedgehog has five thousand spines? I counted. Some.', 'Good day! I can spell "wizard". W-I-Z-A-R-D. Ask me another.']),
    at(2.5, { phrFlavour: 'register', register: 'child' }, ['Wizzard! I mean wizard. Hello!', 'Hello wizard! Hello hat! Hello staff!']),
    at(2.7, { phrFlavour: 'register', register: 'fine', temper: 'proud' }, ['Ah, wizard. We were just discussing the finer points of pastry. Do join us.']),
    at(2.7, { phrFlavour: 'register', register: 'plain', temper: 'ornery' }, ['What d\'you want, then? Go on.']),

    // what they like
    at(2.5, { phrFlavour: 'likes', likes: 'rain' }, ['I like the rain, me. Listen to it on the leaves.']),
    at(2.5, { phrFlavour: 'likes', likes: 'mushrooms' }, ['Found any mushrooms on your walk? No? Shame.']),
    at(2.5, { phrFlavour: 'likes', likes: 'music' }, ['Did you hear the fiddle last night? I\'ve been humming it since.']),
    at(2.5, { phrFlavour: 'likes', likes: 'gardens' }, ['Have you seen my beans? Come and look at my beans.']),
    at(2.5, { phrFlavour: 'likes', likes: 'rifttech' }, ['Did you see the Relay last night? Lit up like a festival.']),
    at(2.5, { phrFlavour: 'likes', likes: 'quiet' }, ['Nice and quiet today. Let\'s keep it that way. Whisper.']),
    at(2.5, { phrFlavour: 'likes', likes: 'crowds' }, ['Busy lane today! I love it when everyone\'s out.']),
    at(2.5, { phrFlavour: 'likes', likes: 'poetry' }, ['I\'ve been composing a verse. About you. It doesn\'t rhyme yet.']),
    at(2.5, { phrFlavour: 'likes', likes: 'sunshine' }, ['Come and stand in the sun with me. There\'s room.']),
    at(2.5, { phrFlavour: 'likes', likes: 'animals' }, ['Have you met the new kittens? Five! Five little kittens!']),
  ]);

  // --- Greetings, more of them: every temper in every weather, hour and season -------
  const has = (x) => !!x;
  lines('greet', [
    // bored, homeless, a go-between
    at(3.4, { bored: true }, ['Wizard! Thank goodness. Do something interesting. Anything.', 'I\'m so bored I\'ve counted the stones in the wall. Twice.']),
    at(3.6, { bored: true, stage: 'child' }, ['I\'m SO BORED. Do magic. Do any magic.', 'There\'s NOTHING to do. Everyone says go and play. Play WHAT?']),
    at(3.6, { bored: true, rift: true }, ['Bored. No feed, no signal. Just... hedges.']),
    at(3.6, { bored: true, temper: 'witty' }, ['Save me, wizard. I\'ve started talking to the turnips and they\'re winning.']),
    at(3.8, { homeless: true, stage: ['grown', 'elder'] }, ['Don\'t look at the hedge. That\'s not where I sleep. It is.', 'I\'ve no hole of my own just now. Mustn\'t grumble. I\'ll grumble a bit.']),
    at(2.6, { phrFlavour: 'temper', goBetween: true }, ['Wizard! I\'ve been telling the rift-folk about the Badger, and the hill-folk about the Relay. Busy day.']),

    // their mood
    at(2.5, { phrFlavour: 'mood', mood: 'merry' }, ['What a day! Everything\'s going right. Even the hens are laying.', 'Hello! I\'m in such a good mood I could hug a goose.']),
    at(2.7, { phrFlavour: 'mood', mood: 'merry', temper: 'cheerful' }, ['Wizard! Isn\'t life grand? It is. I\'ve decided.']),
    at(2.7, { phrFlavour: 'mood', mood: 'merry', temper: 'ornery' }, ['I\'m in a good mood. Don\'t spoil it.']),
    at(2.7, { phrFlavour: 'mood', mood: 'merry', temper: 'gloomy' }, ['I feel... good? Is this what good feels like? Odd.']),
    at(2.7, { phrFlavour: 'mood', mood: 'merry', temper: 'shy' }, ['*smiles, properly, for once* Hello.']),
    at(2.7, { phrFlavour: 'mood', mood: 'merry', temper: 'proud' }, ['Good day! I\'ve had a most successful morning.']),
    at(2.7, { phrFlavour: 'mood', mood: 'merry', temper: 'witty' }, ['Hello! I\'m in such a good mood I might laugh at one of your jokes.']),
    at(2.7, { phrFlavour: 'mood', mood: 'merry', temper: 'dreamy' }, ['Everything\'s glowing today. Have you noticed? Even you.']),
    at(2.7, { phrFlavour: 'mood', mood: 'merry', temper: 'curious' }, ['Wizard! I\'ve learned three things today and it\'s not even luncheon!']),
    at(2.7, { phrFlavour: 'mood', mood: 'merry', stage: 'child' }, ['I\'m SO HAPPY. I don\'t know why. I just AM.']),
    at(2.8, { phrFlavour: 'mood', mood: 'merry', rift: true }, ['Hey! Running at full charge today. Feels amazing.']),
    at(2.5, { phrFlavour: 'mood', mood: 'fair' }, ['Oh, middling to fair. Hello.', 'Not bad, wizard. Not bad at all. Hello.']),
    at(2.7, { phrFlavour: 'mood', mood: 'fair', temper: 'ornery' }, ['Can\'t complain. Won\'t stop me. Hello.']),
    at(2.7, { phrFlavour: 'mood', mood: 'fair', temper: 'witty' }, ['Fair to middling, and middling\'s looking up.']),
    at(2.5, { phrFlavour: 'mood', mood: 'low' }, ['Hello. Don\'t mind me, I\'m a bit flat today.', 'Oh. Wizard. I\'m not much company today.']),
    at(2.7, { phrFlavour: 'mood', mood: 'low', temper: 'ornery' }, ['Not today, wizard. Well, quickly.']),
    at(2.7, { phrFlavour: 'mood', mood: 'low', temper: 'shy' }, ['...Hello. Sorry. I\'m a bit quiet today. Quieter.']),
    at(2.7, { phrFlavour: 'mood', mood: 'low', temper: 'cheerful' }, ['Hello! I\'m... well, I\'m trying to be cheerful. Give me a minute.']),
    at(2.7, { phrFlavour: 'mood', mood: 'low', temper: 'proud' }, ['Good day. I\'m perfectly well. Perfectly.']),
    at(2.7, { phrFlavour: 'mood', mood: 'low', temper: 'dreamy' }, ['Hello. Everything\'s gone a bit grey. Not you. Everything else.']),
    at(2.7, { phrFlavour: 'mood', mood: 'low', stage: 'child' }, ['Hello. *kicks a stone*']),
    at(2.8, { phrFlavour: 'mood', mood: 'low', rift: true }, ['Hey. Running on low today.']),
    at(2.5, { phrFlavour: 'mood', mood: 'miserable' }, ['Oh. It\'s you. I\'m not... I\'m not good today.', '*wipes eyes quickly* Wizard! Hello. Didn\'t see you.']),
    at(2.7, { phrFlavour: 'mood', mood: 'miserable', temper: 'gloomy' }, ['Go away. ...No, don\'t. Stay. Just don\'t be cheerful.']),
    at(2.7, { phrFlavour: 'mood', mood: 'miserable', temper: 'ornery' }, ['What? What now? ...Sorry. It\'s been a day.']),
    at(2.7, { phrFlavour: 'mood', mood: 'miserable', stage: 'child' }, ['*sniffs* I\'m not crying. Hello.']),

    // their family
    at(2.4, { phrFlavour: 'family' }, ['It\'s just me and the kettle today. Hello.', 'Hello, wizard. Quiet in the hole today, {pet}.']),
    at(2.5, { phrFlavour: 'family', spouse: has }, ['{Spouse}\'s off somewhere. I\'ve the hole to myself. Bliss. Hello.', '{Spouse} was asking after you only yesterday.', 'If you see {spouse}, tell them I\'ve not forgotten the shopping. I have.']),
    at(2.6, { phrFlavour: 'family', kid: has }, ['{Kid}\'s been asking when the wizard\'s coming back. Every day.', 'Have you seen {kid}? If you have, tell them their tea\'s ready.', '{Kid} drew you. You\'ve eight legs. It\'s very good.']),
    at(2.7, { phrFlavour: 'family', kidCount: { min: 3 } }, ['Wizard! Take one of mine. Just for an afternoon. Any one.']),
    at(2.7, { phrFlavour: 'family', kid: has, stage: 'elder' }, ['My {kid}\'s grown, you know. Little ones of their own. Makes a body feel old.']),
    at(2.6, { phrFlavour: 'family', parent: has, stage: 'child' }, ['{Parent} says I\'m to be polite to wizards. HELLO. That was polite.', 'Does {parent} know you\'re here? Shall I fetch them? I\'ll fetch them. No, stay.']),
    at(2.7, { phrFlavour: 'family', rift: true, lost: has }, ['Just me. {Lost}\'s out there somewhere. Hi, wizard.']),
    at(2.7, { phrFlavour: 'family', spouse: has, temper: 'dreamy' }, ['{Spouse} sang this morning. Out of tune. I could listen for ever.']),
    at(2.7, { phrFlavour: 'family', spouse: has, temper: 'ornery' }, ['{Spouse} has moved my chair again. A whole inch. Hello.']),

    // every temper in the rain, snow, sun, cloud and fog
    at(2.7, { phrFlavour: 'weather', weather: 'rain', temper: 'proud' }, ['My step\'s dry. Look. Not a drop. The secret\'s a good mat.']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', temper: 'curious' }, ['Where does it all come from? The rain. All of it. Every day.']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', stage: 'elder' }, ['Rain in my bones before it\'s in the sky. Told you it was coming.']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', register: 'fine' }, ['Inclement, isn\'t it? Do step under the porch.']),
    at(2.7, { phrFlavour: 'weather', weather: 'rain', register: 'plain' }, ['Wet \'un, this. Come in out of it.']),
    at(2.8, { phrFlavour: 'weather', phrStorm: true, stage: 'child' }, ['THUNDER! Did you hear it? Was it you?']),
    at(2.8, { phrFlavour: 'weather', phrStorm: true, temper: 'ornery' }, ['This storm\'s your doing, isn\'t it? Wizards.']),
    at(2.8, { phrFlavour: 'weather', phrStorm: true, temper: 'shy' }, ['*flinches at the thunder* Oh! Hello. I don\'t like storms.']),
    at(2.7, { phrFlavour: 'weather', weather: 'snow', temper: 'shy' }, ['*draws in the snow with a toe* ...Hello.']),
    at(2.7, { phrFlavour: 'weather', weather: 'snow', temper: 'witty' }, ['Snow! Your beard\'s gone and camouflaged itself.']),
    at(2.7, { phrFlavour: 'weather', weather: 'snow', temper: 'gloomy' }, ['Snow. Everything\'s buried. Fitting.']),
    at(2.7, { phrFlavour: 'weather', weather: 'snow', temper: 'dreamy' }, ['Every flake\'s different, they say. Like folk.']),
    at(2.7, { phrFlavour: 'weather', weather: 'snow', temper: 'proud' }, ['My path\'s cleared. First on the lane. As usual.']),
    at(2.7, { phrFlavour: 'weather', weather: 'snow', temper: 'curious' }, ['Why\'s snow white? Rain isn\'t. Is it the cold?']),
    at(2.7, { phrFlavour: 'weather', weather: 'clear', temper: 'cheerful' }, ['What a day! The sun\'s out and so is everyone!']),
    at(2.7, { phrFlavour: 'weather', weather: 'clear', temper: 'shy' }, ['It\'s nice out. ...That\'s all. Hello.']),
    at(2.7, { phrFlavour: 'weather', weather: 'clear', temper: 'curious' }, ['Where does the sun go at night? Somebody must know. You must know.']),
    at(2.7, { phrFlavour: 'weather', weather: 'clear', temper: 'witty' }, ['Sun\'s out! Hide your pale bits.']),
    at(2.7, { phrFlavour: 'weather', weather: 'clear', temper: 'proud' }, ['Fine day. My washing\'s been out since dawn.']),
    at(2.7, { phrFlavour: 'weather', weather: 'clear', stage: 'elder' }, ['Sun on my old bones. That\'s all I ask these days.']),
    at(2.7, { phrFlavour: 'weather', weather: 'cloudy', temper: 'cheerful' }, ['Grey\'s just a colour, wizard. A cosy one!']),
    at(2.7, { phrFlavour: 'weather', weather: 'cloudy', temper: 'ornery' }, ['Can\'t make its mind up, the sky. Like some people.']),
    at(2.7, { phrFlavour: 'weather', weather: 'cloudy', temper: 'dreamy' }, ['Grey skies are the softest.']),
    at(2.7, { phrFlavour: 'weather', weather: 'cloudy', stage: 'child' }, ['It\'s all grey. Is the sun asleep?']),
    at(2.8, { phrFlavour: 'weather', weather: 'cloudy', rift: true }, ['Grey sky. Practically home. Minus the drones.']),
    at(2.7, { phrFlavour: 'weather', weather: 'fog', temper: 'ornery' }, ['Fog. Walked into the gatepost. The gatepost started it.']),
    at(2.7, { phrFlavour: 'weather', weather: 'fog', temper: 'gloomy' }, ['Can\'t see a thing. Not that there\'s much worth seeing.']),
    at(2.7, { phrFlavour: 'weather', weather: 'fog', temper: 'witty' }, ['In this fog you could be anyone. You\'re tall enough to be two people.']),

    // every temper at every hour
    at(2.7, { phrFlavour: 'hour', hour: 'morning', temper: 'shy' }, ['Morning. *yawns behind a hand*']),
    at(2.7, { phrFlavour: 'hour', hour: 'morning', temper: 'curious' }, ['Morning! Have you been anywhere yet? Seen anything?']),
    at(2.7, { phrFlavour: 'hour', hour: 'morning', temper: 'dreamy' }, ['Morning. I was still half in a dream. You were in it.']),
    at(2.7, { phrFlavour: 'hour', hour: 'morning', temper: 'witty' }, ['Morning! Is it? I\'ll check. Yes, it\'s morning.']),
    at(2.7, { phrFlavour: 'hour', hour: 'afternoon', temper: 'cheerful' }, ['Afternoon! Lovely, isn\'t it? Everything\'s lovely in the afternoon.']),
    at(2.7, { phrFlavour: 'hour', hour: 'afternoon', temper: 'ornery' }, ['Afternoon. Half the day gone and nothing to show.']),
    at(2.7, { phrFlavour: 'hour', hour: 'afternoon', temper: 'shy' }, ['...Good afternoon.']),
    at(2.7, { phrFlavour: 'hour', hour: 'afternoon', temper: 'proud' }, ['Good afternoon. I\'ve done a day\'s work already.']),
    at(2.7, { phrFlavour: 'hour', hour: 'afternoon', temper: 'gloomy' }, ['Afternoon. The long bit.']),
    at(2.7, { phrFlavour: 'hour', hour: 'afternoon', temper: 'curious' }, ['Afternoon! What have you been doing? Where? Who with?']),
    at(2.7, { phrFlavour: 'hour', hour: 'afternoon', stage: 'child' }, ['Is it afternoon? Is it nearly tea?']),
    at(2.7, { phrFlavour: 'hour', hour: 'afternoon', stage: 'elder' }, ['Afternoon. You\'ve caught me between naps.']),
    at(2.8, { phrFlavour: 'hour', hour: 'afternoon', rift: true }, ['Afternoon. The sun\'s doing that slanty thing. I like it.']),
    at(2.7, { phrFlavour: 'hour', hour: 'evening', temper: 'ornery' }, ['Evening. Supper\'s waiting. Be quick.']),
    at(2.7, { phrFlavour: 'hour', hour: 'evening', temper: 'shy' }, ['Evening... nice evening.']),
    at(2.7, { phrFlavour: 'hour', hour: 'evening', temper: 'proud' }, ['Evening. I\'ve just lit the lamps. Best-lit hole on the lane.']),
    at(2.7, { phrFlavour: 'hour', hour: 'evening', temper: 'curious' }, ['Evening! Where are you off to? Where do wizards go at night?']),
    at(2.7, { phrFlavour: 'hour', hour: 'evening', temper: 'witty' }, ['Evening! Come for supper? You always seem to come at supper.']),
    at(2.7, { phrFlavour: 'hour', hour: 'evening', stage: 'elder' }, ['Evening. The light goes early for me now. Sit.']),
    at(2.7, { phrFlavour: 'hour', hour: 'night', temper: 'cheerful' }, ['Wizard! Out under the stars! Isn\'t it lovely?']),
    at(2.7, { phrFlavour: 'hour', hour: 'night', temper: 'shy' }, ['*jumps* Oh! It\'s you. You frightened me.']),
    at(2.7, { phrFlavour: 'hour', hour: 'night', temper: 'curious' }, ['Do wizards sleep? You always seem to be up.']),
    at(2.7, { phrFlavour: 'hour', hour: 'night', temper: 'witty' }, ['Up late, wizard? Up to no good, I hope.']),
    at(2.7, { phrFlavour: 'hour', hour: 'night', temper: 'gloomy' }, ['Can\'t sleep. Never can.']),
    at(2.7, { phrFlavour: 'hour', hour: 'night', temper: 'proud' }, ['I don\'t keep late hours as a rule. These are exceptional circumstances.']),

    // every temper in every season
    at(2.7, { phrFlavour: 'season', season: 'spring', temper: 'cheerful' }, ['Spring! Lambs! Blossom! Mud! I love all of it!']),
    at(2.7, { phrFlavour: 'season', season: 'spring', temper: 'ornery' }, ['Spring. Everything growing. Mostly weeds.']),
    at(2.7, { phrFlavour: 'season', season: 'spring', temper: 'shy' }, ['The primroses are out... I picked one. For nobody.']),
    at(2.7, { phrFlavour: 'season', season: 'spring', temper: 'curious' }, ['Did you know the frogspawn\'s back? I counted. Lots.']),
    at(2.7, { phrFlavour: 'season', season: 'spring', temper: 'dreamy' }, ['Spring makes me want to go somewhere. Anywhere.']),
    at(2.7, { phrFlavour: 'season', season: 'spring', temper: 'witty' }, ['Spring! The season the hens get ideas.']),
    at(2.7, { phrFlavour: 'season', season: 'spring', temper: 'gloomy' }, ['Spring. More rain, only warmer.']),
    at(2.8, { phrFlavour: 'season', season: 'spring', rift: true }, ['Things just grow here. On their own. Nobody prints them.']),
    at(2.7, { phrFlavour: 'season', season: 'summer', temper: 'cheerful' }, ['Summer! Barefoot weather! Well, it\'s always barefoot weather.']),
    at(2.7, { phrFlavour: 'season', season: 'summer', temper: 'shy' }, ['It\'s warm... I like the shade.']),
    at(2.7, { phrFlavour: 'season', season: 'summer', temper: 'curious' }, ['Why are summer days longer? Is the sun lazy in winter?']),
    at(2.7, { phrFlavour: 'season', season: 'summer', temper: 'witty' }, ['Summer! The flies have come for their holidays.']),
    at(2.7, { phrFlavour: 'season', season: 'summer', temper: 'proud' }, ['My roses are the finest in the lane this summer.']),
    at(2.7, { phrFlavour: 'season', season: 'summer', temper: 'gloomy' }, ['Hot. It\'ll end in thunder.']),
    at(2.7, { phrFlavour: 'season', season: 'summer', stage: 'child' }, ['SUMMER! Paddling! Can you paddle? Wizards don\'t paddle.']),
    at(2.8, { phrFlavour: 'season', season: 'summer', rift: true }, ['Summer here is just... nice. No heat warnings. Just nice.']),
    at(2.7, { phrFlavour: 'season', season: 'autumn', temper: 'cheerful' }, ['Autumn! Conkers and pies and crunchy leaves!']),
    at(2.7, { phrFlavour: 'season', season: 'autumn', temper: 'ornery' }, ['Leaves everywhere. Who ordered all these leaves?']),
    at(2.7, { phrFlavour: 'season', season: 'autumn', temper: 'shy' }, ['I like the leaves. The red ones.']),
    at(2.7, { phrFlavour: 'season', season: 'autumn', temper: 'curious' }, ['Why do leaves go red? Is it shyness? Do trees blush?']),
    at(2.7, { phrFlavour: 'season', season: 'autumn', temper: 'dreamy' }, ['Autumn smells like something ending. Nicely.']),
    at(2.7, { phrFlavour: 'season', season: 'autumn', temper: 'witty' }, ['Autumn. When the trees undress and nobody minds.']),
    at(2.7, { phrFlavour: 'season', season: 'autumn', temper: 'proud' }, ['My larder\'s full for winter. Fullest on the lane, I\'ll wager.']),
    at(2.8, { phrFlavour: 'season', season: 'autumn', rift: true }, ['Everything\'s turning orange. Like the city at sunset, only real.']),
    at(2.7, { phrFlavour: 'season', season: 'winter', temper: 'ornery' }, ['Winter. Cold feet, cold hands, cold everything.']),
    at(2.7, { phrFlavour: 'season', season: 'winter', temper: 'shy' }, ['Cold... I\'ve got a scarf. Do you want a scarf?']),
    at(2.7, { phrFlavour: 'season', season: 'winter', temper: 'curious' }, ['Does the Water freeze all the way down? Do the fish mind?']),
    at(2.7, { phrFlavour: 'season', season: 'winter', temper: 'witty' }, ['Winter! When you find out who loves you: whoever lets you near their fire.']),
    at(2.7, { phrFlavour: 'season', season: 'winter', temper: 'proud' }, ['My woodpile\'s the biggest on the lane. I counted.']),
    at(2.7, { phrFlavour: 'season', season: 'winter', temper: 'gloomy' }, ['Winter. Long nights. Longer days, somehow.']),
    at(2.7, { phrFlavour: 'season', season: 'winter', stage: 'child' }, ['Is it nearly Yule? Is it? How many sleeps?']),
    at(2.7, { phrFlavour: 'season', season: 'winter', stage: 'elder' }, ['Winters get longer when you get older. Funny, that.']),

    // fondness, every temper
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.3, max: 0.6 }, temper: 'cheerful' }, ['Wizard! Come here, you!']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.3, max: 0.6 }, temper: 'shy' }, ['Oh! Hello. I\'m glad it\'s you.']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.3, max: 0.6 }, temper: 'witty' }, ['Back again? You must like us.']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.3, max: 0.6 }, temper: 'gloomy' }, ['Oh. You. That\'s... actually nice.']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.3, max: 0.6 }, temper: 'ornery' }, ['Oh, it\'s you. You\'re all right. I suppose.']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.3, max: 0.6 }, stage: 'child' }, ['It\'s MY wizard! Hello!']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.05, max: 0.3 }, temper: 'curious' }, ['The wizard! I\'ve been meaning to ask you things.']),
    at(2.7, { phrFlavour: 'fond', fond: { min: 0.05, max: 0.3 }, temper: 'proud' }, ['Wizard. Good day. You\'ll have heard of my pickles, I expect.']),
    at(2.7, { phrFlavour: 'fond', fond: { max: 0.05 }, temper: 'proud' }, ['Wizard. I suppose you want something.']),
    at(2.7, { phrFlavour: 'fond', fond: { max: 0.05 }, temper: 'gloomy' }, ['Oh, it\'s you. Fine.']),
    at(2.7, { phrFlavour: 'fond', fond: { max: -0.15 }, stage: 'child' }, ['You\'re the one who made me sad. Hmph.']),
    at(2.7, { phrFlavour: 'fond', fond: { max: -0.15 }, temper: 'witty' }, ['Ah, the wizard. My least favourite tall person.']),

    // registers, more of them
    at(2.6, { phrFlavour: 'register', register: 'fine', stage: 'elder' }, ['Good day to you, sir. In my day one left a card first. But do come in.']),
    at(2.6, { phrFlavour: 'register', register: 'plain', stage: 'elder' }, ['Ah, \'tis the wizard. Mind the step, it\'s older than me.']),
    at(2.6, { phrFlavour: 'register', register: 'fine', temper: 'cheerful' }, ['My dear wizard! How perfectly splendid to see you!']),
    at(2.6, { phrFlavour: 'register', register: 'plain', temper: 'cheerful' }, ['Wizard! Grand to see you. Grand!']),
    at(2.6, { phrFlavour: 'register', register: 'fine', temper: 'shy' }, ['Oh, good day. Do forgive me. I wasn\'t expecting company.']),
    at(2.6, { phrFlavour: 'register', register: 'fine', temper: 'witty' }, ['Wizard! You\'re looking positively venerable today.']),
    at(2.6, { phrFlavour: 'register', register: 'plain', temper: 'witty' }, ['Wizard! Lost your way again? Lane\'s only got the one end.']),

    // at work, a word for every trade and temper
    at(4.6, { phrDoing: 'work', job: 'miller', temper: 'ornery' }, ['Mind the sacks. And the wheel. And me.']),
    at(4.6, { phrDoing: 'work', job: 'postie', temper: 'cheerful' }, ['A wizard! I\'ve delivered to all sorts, never a wizard. Got an address?']),
    at(4.6, { phrDoing: 'work', job: 'innkeeper', temper: 'witty' }, ['A wizard walks into an inn. Stop me if you\'ve heard it.']),
    at(4.6, { phrDoing: 'work', job: 'herbalist', temper: 'shy' }, ['Oh! Careful... that\'s foxglove. Don\'t touch. Hello.']),
    at(4.6, { phrDoing: 'work', job: 'fisher', temper: 'gloomy' }, ['Nothing biting. Never is.']),
    at(4.6, { phrDoing: 'work', job: 'woodwright', temper: 'proud' }, ['Felled three trees before breakfast. Not big ones. Still.']),
    at(4.6, { phrDoing: 'work', job: 'herder', temper: 'cheerful' }, ['Wizard! Come and meet the new lambs! This one\'s called Wizard.']),
    at(4.6, { phrDoing: 'work', job: 'orchardist', temper: 'dreamy' }, ['The blossom\'s out. I could stand here all day. I nearly have.']),
    at(4.6, { phrDoing: 'work', job: 'storyteller', temper: 'curious' }, ['Wizard! Tell the children something true about dragons. They won\'t believe me.']),
    at(4.6, { phrDoing: 'work', job: 'tinker', temper: 'curious' }, ['Wizard, quick one: how does your staff light up? Battery? No battery?']),
    at(4.6, { phrDoing: 'work', job: 'grower', temper: 'ornery' }, ['Don\'t step on the leaf. Don\'t breathe on the leaf.']),
    at(4.6, { phrDoing: 'work', job: 'brewer', temper: 'cheerful' }, ['Wizard! Taste this. No, don\'t. It\'s not ready. Taste it anyway.']),
    at(4.6, { phrDoing: 'work', job: 'farmer', temper: 'cheerful' }, ['Wizard! The barley\'s up to my waist! Well, my waist.']),
    at(4.6, { phrDoing: 'work', job: 'baker', temper: 'gloomy' }, ['The bread didn\'t rise. Nothing rises. Hello.']),
    at(4.6, { phrDoing: 'work', job: 'postie', temper: 'witty' }, ['Letter for you! No. Just wanted to see your face.']),
    at(4.6, { phrDoing: 'work', job: 'herbalist', temper: 'proud' }, ['My remedies have cured half the lane. The other half won\'t take them.']),
    at(4.6, { phrDoing: 'work', job: 'innkeeper', temper: 'gloomy' }, ['Washing tankards. They just get dirty again. Like life.']),
    at(4.6, { phrDoing: 'work', job: 'woodwright', temper: 'shy' }, ['*lowers the axe* Oh. Hello. I\'ll be careful. I\'m always careful.']),
    at(4.6, { phrDoing: 'work', job: 'fisher', temper: 'dreamy' }, ['The river\'s talking to itself today. Listen. ...Hello.']),
    at(4.6, { phrDoing: 'work', job: 'miller', temper: 'cheerful' }, ['Wizard! Flour everywhere! Isn\'t it lovely? Like snow you can eat.']),

    // tipsy, poorly, hungry, tired, lonely: more tempers
    at(6.4, { tipsy: true, phrParty: has }, ['Wizard! It\'s a party! In my mouth! I mean the cake. The cake\'s a party.']),
    at(5.9, { sick: true, temper: 'dreamy' }, ['I\'ve a fever. Everything\'s swimmy and pretty. Hello, swimmy wizard.']),
    at(5.9, { sick: true, temper: 'curious' }, ['Do you know a cure? Is there a spell? There\'s a spell, isn\'t there?']),
    at(4.2, { hungry: true, temper: 'cheerful' }, ['Wizard! Hello! Are you hungry? I\'m hungry. Let\'s be hungry together.']),
    at(4.2, { hungry: true, temper: 'witty' }, ['If you\'re not carrying a pie, I\'m not sure I can talk to you.']),
    at(4.2, { hungry: true, temper: 'shy' }, ['*stomach rumbles loudly* ...Sorry. Hello.']),
    at(4.2, { hungry: true, rift: true }, ['Fuel low. Is there a meal soon? There\'s always a meal soon here.']),
    at(4.1, { tired: true, temper: 'dreamy' }, ['*yawns* I\'m somewhere between awake and a dream. Hello, dream wizard.']),
    at(4.1, { tired: true, temper: 'cheerful' }, ['Hello! *yawns* Sorry! Hello! *yawns*']),
    at(4.1, { tired: true, rift: true }, ['Hey. Need a recharge. Badly.']),
    at(3.7, { lonely: true, temper: 'cheerful' }, ['Wizard! Oh, I\'m so glad! I\'ve been saying hello to the cat all day.']),
    at(3.7, { lonely: true, temper: 'gloomy' }, ['Oh. Someone. ...Don\'t go yet.']),
    at(3.7, { lonely: true, stage: 'elder' }, ['Sit a while, would you? The days are long on your own.']),
  ]);

  // --- Greetings for the rift-folk, the youngsters and the old, wherever they are -------
  lines('greet', [
    at(2.8, { phrFlavour: 'temper', rift: true, temper: 'cheerful' }, ['Wizard! Best part of the day, you showing up. Well, joint best. With toast.']),
    at(2.8, { phrFlavour: 'temper', rift: true, temper: 'ornery' }, ['Wizard. If this is about the noise from my workshop, it\'s a feature.']),
    at(2.8, { phrFlavour: 'temper', rift: true, temper: 'shy' }, ['Oh. Hi. I was just... recalibrating. Myself. Hi.']),
    at(2.8, { phrFlavour: 'temper', rift: true, temper: 'curious' }, ['Wizard! Is magic just tech nobody\'s explained yet? I\'ve been thinking about it all night.']),
    at(2.8, { phrFlavour: 'temper', rift: true, temper: 'dreamy' }, ['Hey. I was watching the river. It doesn\'t loop. It just keeps going. Wild.']),
    at(2.8, { phrFlavour: 'temper', rift: true, temper: 'witty' }, ['The wizard! Still running on the original firmware, I see.']),
    at(2.8, { phrFlavour: 'temper', rift: true, temper: 'proud' }, ['Wizard. You\'ll have noticed my lamp. Only neon on the lane. You\'re welcome.']),
    at(2.8, { phrFlavour: 'temper', rift: true, temper: 'gloomy' }, ['Hey. Low power mode today. Don\'t mind me.']),
    at(2.8, { phrFlavour: 'temper', rift: true, stage: 'child' }, ['Wizard! Did you know your staff would make a great antenna? Can I borrow it?']),
    at(2.8, { phrFlavour: 'register', rift: true }, ['Hey, wizard. Still getting used to "good morning". Good morning. Or whatever it is.', 'Wizard. Greetings. Is that how you say it here? Greetings.']),
    at(2.8, { phrFlavour: 'likes', rift: true, likes: 'rifttech' }, ['Wizard! I got the Relay to say hello to a hill-hobbit. She screamed. Then she said hello back.']),
    at(2.8, { phrFlavour: 'weather', rift: true, phrStorm: true }, ['Thunder! Back home that meant the grid was about to fail. Here it just means rain. Better.']),
    at(4.5, { phrDoing: 'work', rift: true }, ['Hey. Mid-job. Talk while I work? It\'s basically multitasking.']),
    at(3.8, { phrDoing: 'meal', rift: true }, ['Real food! I\'m eating real food! Sorry. Still excited. Hello.']),
    at(3.8, { phrDoing: 'tea', rift: true }, ['Tea. You lot fix everything with tea. I\'m starting to think it works.']),
    at(3.8, { phrDoing: 'garden', rift: true }, ['I planted a seed and it GREW. Nobody coded it. It just grew.']),
    at(3.8, { phrDoing: 'stroll', rift: true }, ['Just walking. No destination. That\'s apparently a thing you can do here.']),
    at(3.8, { phrDoing: 'read', rift: true }, ['Paper books! They don\'t need charging. They just work. Hi.']),

    // youngsters, nearly grown and very aware of it
    at(2.8, { phrFlavour: 'weather', band: 'youth', weather: 'rain' }, ['Ugh. Rain. My hair. ...What? Hobbits can have hair problems.']),
    at(2.8, { phrFlavour: 'hour', band: 'youth', hour: 'morning' }, ['Morning. Don\'t talk too loud. It\'s too early for faces.']),
    at(2.8, { phrFlavour: 'hour', band: 'youth', hour: 'night' }, ['I\'m allowed out late now. Nearly. Don\'t tell anyone.']),
    at(2.8, { phrFlavour: 'season', band: 'youth' }, ['Another season, still not grown. They say next year. They always say next year.']),
    at(2.8, { phrFlavour: 'fond', band: 'youth', fond: { min: 0.4 } }, ['Oh, it\'s you. Good. I mean, whatever. Good.']),
    at(2.8, { phrFlavour: 'mood', band: 'youth', mood: 'low' }, ['Hi. I\'m fine. I\'m FINE. Everyone keeps asking.']),
    at(2.8, { phrFlavour: 'meal', band: 'youth' }, ['I\'m always hungry. Mum says it\'s growing. I say it\'s pie.']),
    at(4.4, { phrDoing: 'lesson', band: 'youth' }, ['Story time. I\'m too old for story time. ...It\'s a good story, though.']),

    // the old, in all weathers
    at(2.8, { phrFlavour: 'weather', stage: 'elder', weather: 'fog' }, ['Fog. At my age you get used to not seeing much. Hello, I think.']),
    at(2.8, { phrFlavour: 'weather', stage: 'elder', weather: 'cloudy' }, ['Grey. Like my hair. Like my beard, if I had one. Hello.']),
    at(2.8, { phrFlavour: 'mood', stage: 'elder', mood: 'merry' }, ['I feel twenty years younger today! Well, ten. Five.']),
    at(2.8, { phrFlavour: 'mood', stage: 'elder', mood: 'low' }, ['Hello. The old aches are talking today. They\'ve a lot to say.']),
    at(2.8, { phrFlavour: 'meal', stage: 'elder' }, ['At my age every meal\'s a feast. I eat slowly and enjoy all of it.']),
    at(2.8, { phrFlavour: 'likes', stage: 'elder' }, ['Sit, sit. I\'ll tell you how it was in my day. Briefly. Mostly briefly.']),
    at(2.8, { phrFlavour: 'register', stage: 'elder', register: 'common' }, ['Ah, wizard. You\'re a sight for old eyes.']),
    at(4.5, { phrDoing: 'work', stage: 'elder', temper: 'proud' }, ['Still working, at my age. The young ones can\'t keep up.']),
    at(3.8, { phrDoing: 'nap', stage: 'elder' }, ['*wakes* Hm? I was just... where was I? Oh. Wizard. Hello.']),
    at(3.8, { phrDoing: 'stroll', stage: 'elder' }, ['My daily walk. Down the lane and back. Takes longer every year.']),

    // first meetings at work, by trade
    at(8.8, { met: false, phrDoing: 'work', job: 'innkeeper' }, ['A wizard in the Badger! First drink\'s on the house. Second\'s on you.']),
    at(8.8, { met: false, phrDoing: 'work', job: 'baker' }, ['A wizard! Have a bun. Everybody gets a bun on first meeting. Rule of the house.']),
    at(8.8, { met: false, phrDoing: 'work', job: 'postie' }, ['A wizard! Have you an address? Everybody needs an address.']),
    at(8.8, { met: false, phrDoing: 'work', job: 'farmer' }, ['A wizard in my barley! Mind where you tread. How do you do?']),
    at(8.8, { met: false, phrDoing: 'work', job: 'tinker' }, ['Oh! A wizard. Hi. Don\'t touch anything. Actually, touch that. Does it spark?']),
  ]);
});
