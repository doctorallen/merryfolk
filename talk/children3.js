'use strict';
// ---------------------------------------------------------------------------
// Talking with the children, part three: the questions they ask the wizard,
// and what they mean to be. A child comes up with something they've been
// saving (why is the sky torn, are dragons real, how old are you, can you
// turn my brother into a frog, why is your hat pointy, can I come with you,
// where do wizards live), and what the wizard answers goes into how they're
// brought up (hill ways, rift ways, or both) and round the village as news.
// And: what will you be when you're grown?
// ---------------------------------------------------------------------------

talkPack('children3', () => {
  const has = (x) => x != null && x !== false && x !== '' && !(Array.isArray(x) && !x.length);
  const kid = (F) => F.stage === 'child';
  const talker = (F) => kid(F) && F.band !== 'toddler';
  const both = (amt) => (T, v) => { if (v.isChild() && typeof nudgeUp === 'function') { nudgeUp(v, 'hill', amt, 'The wizard said both ways have their good'); nudgeUp(v, 'rift', amt, null, true); } };

  // which of his things a child is asking about, kept on the talk
  addFacts((v, F, T) => { F.childQ = (T && T.childQ) || null; });

  // =====================================================================================
  // Why is the sky torn?
  // =====================================================================================
  addThread({
    id: 'child.q.sky', theirs: true, label: 'Why is the sky torn?', cool: 5,
    ask: '{Name} tugs at your sleeve and points up.',
    when: (F) => talker(F) && F.childRiftStage >= 1 && !F.rift,
    beats: {
      start: { line: 'child.q.sky.start', go: [
        { ap: 'warm', say: 'It isn\'t torn, {name}. It\'s a door. Someone on the other side is knocking.', to: 'door', fx: { lean: 'rift' } },
        { ap: 'ask', say: 'Why do you think it is?', to: 'think' },
        { ap: 'jest', say: 'Somebody sat on it. Somebody large.', to: 'sat' },
      ] },
      sat: { line: 'child.q.sky.sat', go: [
        { ap: 'ask', say: 'All right, all right. Why do you think it is?', to: 'think' },
        { ap: 'warm', say: 'Truly? It\'s a door. Someone\'s knocking.', to: 'door', fx: { lean: 'rift' } },
      ] },
      think: { line: 'child.q.sky.think', go: [
        { ap: 'warm', say: 'They\'re both a little bit right.', to: 'bothright', fx: { run: both(0.04), news: 'The wizard told little {name} the hill-folk and the rift-folk are both a bit right about the sky.' } },
        { ap: 'advise', say: 'Listen to the rift-folk on this. They came through it.', to: 'riftright', need: { if: { childRiftFolk: true } }, fx: { lean: 'rift', news: 'The wizard told {name} to listen to the rift-folk about the sky.' } },
        { ap: 'advise', say: 'Listen to your elders. The sky\'s torn before, in the old tales, and mended.', to: 'hillright', fx: { lean: 'hill', news: 'The wizard told {name} the sky has torn before and mended, in the old tales.' } },
      ] },
      door: { line: 'child.q.sky.door', go: [
        { ap: 'tale', say: 'Children. From a city where the lights are going out. Sent somewhere safe.', to: 'children', need: { if: { childRiftStage: { min: 3 } } }, soft: true },
        { ap: 'comfort', say: 'Nobody who means you any harm. I\'d know.', to: 'harm' },
        { ap: 'jest', say: 'The milkman, I expect. He\'s very lost.', to: 'milk' },
      ] },
      children: { line: 'child.q.sky.children', fx: { lean: 'rift', respect: 0.03, remember: 'The wizard says the rift-folk are children sent somewhere safe.', rv: 2, news: 'The wizard told {name} the rift-folk were sent here to be safe.' }, end: true },
      harm: { line: 'child.q.sky.harm', fx: { trust: 0.04, run: both(0.02) }, end: true },
      milk: { line: 'child.q.sky.milk', fx: { fond: 0.03, joke: { k: 'child.q.sky.milk', t: 'The milkman is very lost. Somewhere past the sky.' } }, end: true },
      bothright: { line: 'child.q.sky.bothright', fx: { fond: 0.02 }, end: true },
      riftright: { line: 'child.q.sky.riftright', fx: { respect: 0.02 }, end: true },
      hillright: { line: 'child.q.sky.hillright', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.q.sky.start', [
    { text: ['Mister Wizard! Why is the sky all torn?', 'Why does the sky rip? Is it old? Is it going to fall down?', 'Who tore the sky? Was it you? You can tell me.'] },
    { if: { childRiftOpen: true }, pri: 1, text: ['Look! It\'s doing it again! Why does it DO that?', 'The sky\'s open! Right there! Why is it open?'] },
    { if: { band: 'young' }, text: ['Is the sky broken? Can you fix it? With string?', 'The sky\'s got a hole. Will the rain fall out all at once?'] },
    { if: { band: 'school' }, text: ['I\'ve been thinking. If the sky can tear, what\'s behind it? There has to be a behind.', 'Is the sky a sort of cloth? Because it tears like cloth.'] },
    { if: { band: 'youth' }, text: ['Do you actually know what the rifts are? Honestly? Nobody tells us anything.', 'Everyone has a theory about the rifts. What\'s yours?'] },
    { if: { childTemper: 'shy' }, text: ['...Is the sky going to tear over our house? I keep watching.'] },
    { if: { childTemper: 'curious' }, text: ['Where does the sky go when it tears? I need to know. It\'s urgent.'] },
    { if: { childTemper: 'gloomy' }, text: ['Is the sky tearing because something bad is coming?'] },
  ]);
  lines('child.q.sky.sat', [
    { text: ['NO! Ha! Who\'s big enough to sit on the sky?', 'A troll? Did a troll sit on it? ...No. Really, though?', 'That\'s silly. Tell me properly.'] },
    { if: { childTemper: 'ornery' }, text: ['That\'s not an answer. That\'s a joke.'] },
  ]);
  lines('child.q.sky.think', [
    { text: ['Everyone says different. Some say weather. Some say it\'s a train in the sky.', 'Gran says it\'s bad luck. The rift-folk say it\'s just a road.'] },
    { if: { childParentWord: has, childRiftName: has }, text: ['{ChildParentWord} says it\'s bad weather. But {childRiftName} says it\'s a train. A train in the SKY.', '{ChildParentWord} says don\'t look at it. {ChildRiftName} says it\'s just a door that\'s stuck open.'] },
    { if: { childParentWord: has }, text: ['{ChildParentWord} says it\'s nothing to worry about. But {childParentWord} shut all the windows.'] },
    { if: { childTemper: 'curious' }, text: ['I think it\'s a door. A door in the air. Because things come out of it, and doors are for coming out of.'] },
    { if: { childUpb: 'hill' }, text: ['I think it\'s wrong. The sky should just be sky.'] },
    { if: { childUpb: 'rift' }, text: ['I think it\'s the best thing that ever happened here. Things come out of it!'] },
  ]);
  lines('child.q.sky.door', [
    { text: ['A DOOR? Who\'s knocking?', 'Knocking? On the sky? Who would knock on the sky?', 'A door to where?'] },
    { if: { childTemper: 'curious' }, text: ['A door! I KNEW it! Where does it go? Can you open it from this side?'] },
    { if: { childTemper: 'shy' }, text: ['...Should we let them in? Is it polite?'] },
  ]);
  lines('child.q.sky.children', [
    { text: ['Children? Like me?', 'Sent away? On their own? ...That\'s sad. That\'s really sad.', 'Their lights are going out? Can we give them some of ours?'] },
    { if: { childTemper: 'gloomy' }, text: ['Do they miss home? I would.'] },
    { if: { childRiftName: has }, text: ['Is {childRiftName} one of the children? Even though {childRiftName}\'s grown?'] },
  ]);
  lines('child.q.sky.harm', [
    { text: ['You\'d know? How would you know?', 'All right. If you say so. I believe you.', 'Promise?'] },
    { if: { childTemper: 'shy' }, text: ['...Then I won\'t watch it so much.'] },
  ]);
  lines('child.q.sky.milk', [
    { text: ['HA! A lost milkman! In the sky!', 'Is the milk all right?', 'He must be REALLY lost.'] },
  ]);
  lines('child.q.sky.bothright', [
    { text: ['Both? ...That\'s cheating. *runs off shouting* THE WIZARD SAYS YOU\'RE BOTH A BIT RIGHT!', 'Both right? Can you be both right? ...I suppose you can.', 'A bit right each. That\'s fair. I\'m telling everyone.'] },
    { if: { childRiftName: has }, text: ['Both! *runs off* {ChildRiftName}! The wizard says you\'re a bit right!'] },
  ]);
  lines('child.q.sky.riftright', [
    { text: ['They came through it! Of course! I\'m going to ask them everything.', 'I\'ll ask! I\'ll ask what it\'s like inside!'] },
    { if: { childRiftName: has }, text: ['I\'ll ask {childRiftName}! {ChildRiftName} will tell me. {ChildRiftName} tells me things.'] },
  ]);
  lines('child.q.sky.hillright', [
    { text: ['It\'s happened before? And it mended? ...That\'s good. That\'s really good.', 'The old tales knew. Gran always says the old tales know.', 'So it\'ll mend. I\'ll tell the little ones. They\'re scared.'] },
  ]);

  // =====================================================================================
  // Are dragons real?
  // =====================================================================================
  addThread({
    id: 'child.q.dragons', theirs: true, label: 'Are dragons real?', cool: 6,
    ask: '{Name} has a very serious question.',
    when: (F) => talker(F) && !F.childTween,
    beats: {
      start: { line: 'child.q.dragons.start', go: [
        { ap: 'tale', say: 'As real as you. I\'ve met one. He was very rude.', to: 'met' },
        { ap: 'jest', say: 'Only on Trewsdays.', to: 'trews' },
        { ap: 'ask', say: 'What do you think?', to: 'think' },
      ] },
      trews: { line: 'child.q.dragons.trews', go: [
        { ap: 'tale', say: 'No, truly. I\'ve met one. He was very rude.', to: 'met' },
        { ap: 'jest', say: 'And alternate Highdays.', to: 'highday' },
      ] },
      highday: { line: 'child.q.dragons.highday', fx: { joke: { k: 'child.dragons.days', t: 'Dragons are only real on Trewsdays. And alternate Highdays.' } }, end: true },
      think: { line: 'child.q.dragons.think', go: [
        { ap: 'warm', say: 'Then you\'re wiser than most grown-ups.', to: 'wise', fx: { respect: 0.02 } },
        { ap: 'tale', say: 'Well. I\'ve met one.', to: 'met' },
      ] },
      wise: { line: 'child.q.dragons.wise', end: true },
      met: { line: 'child.q.dragons.met', fx: { lean: 'rift', news: 'The wizard told {name} he has met a real dragon.' }, go: [
        { ap: 'tale', say: 'Red-gold, with a belly crusted in jewels, and a voice like a forge.', to: 'what' },
        { ap: 'comfort', say: 'And he\'s very far away. And very much not coming back.', to: 'far', fx: { lean: 'hill' } },
      ] },
      what: { line: 'child.q.dragons.what', go: [
        { ap: 'advise', say: 'If you ever meet one: be polite, be quick, and never tell it your name.', to: 'advice', fx: { lean: 'rift', remember: 'The wizard says if you meet a dragon, be polite, be quick, and never tell it your name.' } },
        { ap: 'jest', say: 'And his breath! Like a smithy full of old eggs.', to: 'breath' },
      ] },
      advice: { line: 'child.q.dragons.advice', fx: { respect: 0.03 }, end: true },
      breath: { line: 'child.q.dragons.breath', fx: { fond: 0.03, joke: { k: 'child.dragons.breath', t: 'The dragon\'s breath smelled like a smithy full of old eggs.' } }, end: true },
      far: { line: 'child.q.dragons.far', fx: { trust: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.q.dragons.start', [
    { text: ['Are dragons real? Real real? Not story real?', 'I need to know something. Are there dragons? Yes or no.', 'Have you ever seen a dragon? A proper one, not a firework?'] },
    { if: { childShow: true }, pri: 1, text: ['Was the firework dragon a real dragon? Shrunk down? Or pretend?'] },
    { if: { band: 'young' }, text: ['Are dragons real? Do they live under beds? Are they friendly ones?', 'Can I have a dragon when I\'m grown? A small one?'] },
    { if: { band: 'school' }, text: ['The big ones say dragons are made up. They\'re not, are they?', 'If dragons are real, how come nobody\'s got one?'] },
    { if: { band: 'school', childSib: has }, text: ['{ChildSib} says dragons are made up. Tell {childSib} they\'re not. They\'re not, are they?'] },
    { if: { band: 'youth' }, text: ['Be honest. The dragon in your tale. Did that actually happen?'] },
    { if: { childTemper: 'shy' }, text: ['...Are there dragons near here? Only I heard something in the night.'] },
    { if: { childTemper: 'ornery' }, text: ['Dragons aren\'t real. Are they. Tell me they aren\'t, so I can tell everyone I was right.'] },
    { if: { childTale: 'of the dragon under the Mountain' }, pri: 1, text: ['Your tale about the dragon under the Mountain. Was it TRUE?'] },
  ]);
  lines('child.q.dragons.trews', [
    { text: ['TREWSDAYS? It\'s Trewsday tomorrow!', 'That\'s not a real answer! Is it?', 'Only on Trewsdays? Where do they go the other days?'] },
    { if: { childTemper: 'curious' }, text: ['Why Trewsdays? What\'s special about Trewsdays? I\'ve always wondered about Trewsdays.'] },
  ]);
  lines('child.q.dragons.highday', [
    { text: ['You\'re making it up! ...Are you?', 'Which Highdays? I\'m going to watch.', 'Ugh! You\'re impossible!'] },
  ]);
  lines('child.q.dragons.think', [
    { text: ['I think... they were real. Once. And then there were fewer. And now they\'re hiding.', 'I think there\'s one under the big hill. That\'s why it\'s warm on top.', 'I think they\'re real but they\'re very far away and very old.'] },
    { if: { childTemper: 'ornery' }, text: ['I think they\'re made up to scare us into bed.'] },
    { if: { childTemper: 'curious' }, text: ['I think they\'re real because of the bones. There must be bones. Somewhere.'] },
    { if: { riftWays: true }, text: ['I think the rift-folk have machine ones. With lights for eyes.'] },
  ]);
  lines('child.q.dragons.wise', [
    { text: ['Ha! I know. Grown-ups don\'t think properly.', 'Thank you. ...So I\'m right? Which bit?', 'Wiser than most grown-ups! I\'m telling everyone.'] },
    { if: { childParentWord: has }, text: ['Wiser than most grown-ups! I\'m telling {childParentWord}.'] },
  ]);
  lines('child.q.dragons.met', [
    { text: ['You MET one? What was he like?', 'RUDE? What did he say?', 'You\'re joking. You\'re not joking. You\'re NOT joking!'] },
    { if: { childTemper: 'shy' }, text: ['*very quietly* ...was he big?'] },
    { if: { childTemper: 'ornery' }, text: ['I don\'t believe you. ...What color was he?'] },
  ]);
  lines('child.q.dragons.what', [
    { text: ['Jewels? On his TUMMY?', 'Like a forge? Like the smithy? Louder?', 'I want to see one. Just once. From a long way off.'] },
    { if: { childTemper: 'curious' }, text: ['How did the jewels stick on? Did he lie on them a long time? How long?'] },
  ]);
  lines('child.q.dragons.advice', [
    { text: ['Polite, quick, no name. Polite, quick, no name.', 'Never tell it your name? Why? Can it do something with your name?', 'I\'ll remember. In case.'] },
  ]);
  lines('child.q.dragons.breath', [
    { text: ['EURGH! Old eggs!', 'Ha! Smelly dragon! Smelly dragon!', 'Worse than the pig pen?'] },
    { if: { childSib: has }, text: ['Worse than {childSib}\'s feet?'] },
  ]);
  lines('child.q.dragons.far', [
    { text: ['Good. Very far?', 'Not coming back. Good. ...A tiny bit sad, though.', 'Further than Bree?'] },
  ]);

  // =====================================================================================
  // How old are you?
  // =====================================================================================
  addThread({
    id: 'child.q.age', theirs: true, label: 'How old are you?', cool: 8,
    ask: '{Name} has been looking at your beard and thinking.',
    when: (F) => talker(F) && !F.childTween,
    beats: {
      start: { line: 'child.q.age.start', go: [
        { ap: 'jest', say: 'Older than the hills. Not these hills. Taller ones.', to: 'hills' },
        { ap: 'ask', say: 'How old do you think?', to: 'guess' },
        { ap: 'share', say: 'Old enough to have forgotten. Young enough to mind.', to: 'mind', need: { open: 1 }, soft: true },
      ] },
      hills: { line: 'child.q.age.hills', go: [
        { ap: 'ask', say: 'Have a guess, then.', to: 'guess' },
        { ap: 'tale', say: 'I remember when this valley was all trees, and not a single door.', to: 'trees' },
      ] },
      guess: { line: 'child.q.age.guess', go: [
        { ap: 'jest', say: 'Close! Add a few more zeros.', to: 'more' },
        { ap: 'warm', say: 'You flatter me. I\'ll take it.', to: 'flatter' },
      ] },
      more: { line: 'child.q.age.more', go: [
        { ap: 'tale', say: 'I remember when this valley was all trees, and not a single door.', to: 'trees' },
        { ap: 'jest', say: 'I stopped counting at the first thousand. It got dull.', to: 'counting' },
      ] },
      trees: { line: 'child.q.age.trees', fx: { lean: 'hill', remember: 'The wizard remembers when Thistledown was all trees.', fond: 0.02 }, end: true },
      counting: { line: 'child.q.age.counting', fx: { joke: { k: 'child.age.count', t: 'The wizard stopped counting his birthdays at a thousand. It got dull.' } }, end: true },
      flatter: { line: 'child.q.age.flatter', fx: { fond: 0.02 }, end: true },
      mind: { line: 'child.q.age.mind', fx: { trust: 0.04 }, go: [
        { ap: 'warm', say: 'It means I\'d like to see you grow up. That\'s all.', to: 'grow' },
        { ap: 'jest', say: 'It means my knees creak. Listen.', to: 'knees' },
      ] },
      grow: { line: 'child.q.age.grow', fx: { fond: 0.04, remember: 'The wizard says he\'d like to see me grow up.' }, end: true },
      knees: { line: 'child.q.age.knees', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.q.age.start', [
    { text: ['How old are you?', 'Are you a hundred?', 'How old ARE you? Older than Gran?'] },
    { if: { band: 'young' }, text: ['Are you a hundred? Are you a THOUSAND? Are you a million?', 'How many birthdays have you had? Did you get cake at all of them?'] },
    { if: { band: 'school' }, text: ['I\'ve worked it out. You must be at least two hundred. Am I right?', 'How old are you, exactly? I\'m keeping a record.'] },
    { if: { band: 'youth' }, text: ['How old are you, really? Everyone says something different.'] },
    { if: { childGranWord: has }, text: ['Are you older than my {childGranWord}? {ChildGranWord} says {childGranWord} is the oldest person in the world.'] },
    { if: { childTemper: 'shy' }, text: ['...Is it rude to ask how old you are? Sorry. How old are you?'] },
  ]);
  lines('child.q.age.hills', [
    { text: ['TALLER hills? How tall?', 'Older than the hills? Hills don\'t get old.', 'That\'s not a number.'] },
    { if: { childTemper: 'ornery' }, text: ['That\'s not an answer. That\'s a riddle.'] },
  ]);
  lines('child.q.age.guess', [
    { text: ['A hundred and eleventy-seven.', 'Ninety? No. Nine hundred. No. ...Forty?', 'Older than the party tree. And it\'s ever so old.'] },
    { if: { band: 'young' }, text: ['SIX. No. A hundred. A hundred and six!', 'Infinity. Infinity and two.'] },
    { if: { band: 'school' }, text: ['Your beard\'s about three foot. If it grows an inch a year... thirty-six? That can\'t be right.'] },
  ]);
  lines('child.q.age.more', [
    { text: ['ZEROS? A thousand? Two thousand?', 'More zeros! You\'re older than THOUSANDS?', 'That\'s impossible. ...Is it?'] },
    { if: { childTemper: 'curious' }, text: ['Then you knew the first hobbits! What were they like? Did they have doors yet?'] },
  ]);
  lines('child.q.age.trees', [
    { text: ['No doors? Where did everyone live?', 'All trees? Even where the Badger is?', 'I wish I could have seen it.'] },
    { if: { childTemper: 'curious' }, text: ['Which tree was here? Right here? Where I\'m standing?'] },
  ]);
  lines('child.q.age.counting', [
    { text: ['You stopped counting? Then how do you know when it\'s your birthday?', 'Ha! Dull birthdays!', 'I\'ll count for you. One. Two...'] },
  ]);
  lines('child.q.age.flatter', [
    { text: ['What\'s flatter mean?', 'Ha. So I was close?', 'You don\'t look a day over three hundred.'] },
  ]);
  lines('child.q.age.mind', [
    { text: ['Young enough to mind what?', 'What does that mean?', '...That\'s a sad answer. Is it a sad answer?'] },
    { if: { band: 'youth' }, text: ['...I think I understand that. A bit.'] },
  ]);
  lines('child.q.age.grow', [
    { text: ['You will! You\'ll come back and see! Promise.', '...That\'s nice. I\'ll grow up quickly, then.', 'I\'m growing right now. Look.'] },
    { if: { childTemper: 'shy' }, text: ['*goes pink and looks at the ground, smiling*'] },
  ]);
  lines('child.q.age.knees', [
    { text: ['*listens* They DO creak! Like our gate!', 'Ha! Creaky wizard!', 'Gran\'s do that. Gran says it means rain.'] },
  ]);

  // =====================================================================================
  // Can you turn my brother into a frog?
  // =====================================================================================
  addThread({
    id: 'child.q.frog', theirs: true, label: (F) => `Turn ${F.childSib || 'someone'} into a frog?`, cool: 6,
    ask: '{Name} comes up with a very determined look.',
    when: (F) => talker(F) && !F.childTween && !!F.childSib,
    beats: {
      start: { line: 'child.q.frog.start', go: [
        { ap: 'jest', say: 'A frog? I\'d need a bigger pond.', to: 'pond' },
        { ap: 'ask', say: 'What did {childSib} do?', to: 'did' },
        { ap: 'advise', say: 'I don\'t turn family into frogs. It\'s the first rule.', to: 'rule' },
      ] },
      pond: { line: 'child.q.frog.pond', go: [
        { ap: 'ask', say: 'Before I fetch my wand: what did {childSib} do?', to: 'did' },
        { ap: 'advise', say: 'No, {name}. It\'s the first rule of wizarding.', to: 'rule' },
      ] },
      did: { line: 'child.q.frog.did', go: [
        { ap: 'advise', say: 'Then make it up. Frogs can\'t say sorry, and you\'ll want {childSib} to.', to: 'makeup', fx: { lean: 'hill' } },
        { ap: 'jest', say: 'A newt, then. Only till supper.', to: 'newt' },
        { ap: 'comfort', say: 'That sounds hard. Brothers and sisters can be.', to: 'hard' },
      ] },
      rule: { line: 'child.q.frog.rule', go: [
        { ap: 'jest', say: 'Never ask a wizard the second rule.', to: 'second' },
        { ap: 'tale', say: 'Never eat anything a dragon offers you. Not even toast.', to: 'toast' },
      ] },
      second: { line: 'child.q.frog.second', fx: { joke: { k: 'child.frog.rule', t: 'Never ask a wizard the second rule.' } }, end: true },
      toast: { line: 'child.q.frog.toast', fx: { fond: 0.02 }, end: true },
      makeup: { line: 'child.q.frog.makeup', fx: { respect: 0.03 }, end: true },
      newt: { line: 'child.q.frog.newt', fx: { fond: 0.03, news: 'Little {name} asked the wizard to turn {childSib} into a frog. He offered a newt.', joke: { k: 'child.frog.newt', t: 'You offered to make {childSib} a newt, only till supper.' } }, end: true },
      hard: { line: 'child.q.frog.hard', fx: { trust: 0.04, drive: { lonely: -0.1 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.q.frog.start', [
    { text: ['Can you turn {childSib} into a frog? Please? Just for a day?', 'I need a spell. A frog spell. For {childSib}.', 'How much would it cost to turn {childSib} into a frog? I\'ve got a penny and a conker.'] },
    { if: { childSibWord: has }, text: ['Can you turn my {childSibWord} into a frog? It\'s very important.', 'My {childSibWord} needs to be a frog. Can you do it? You\'re a wizard.'] },
    { if: { band: 'young' }, text: ['Make {childSib} a frog! A green one! RIBBIT!'] },
    { if: { band: 'youth', childSibWord: has }, text: ['Hypothetically. If someone wanted their {childSibWord} turned into a frog. Could it be done?'] },
    { if: { band: 'youth', childSibWord: (x) => !x }, text: ['Hypothetically. If someone wanted {childSib} turned into a frog. Could it be done?'] },
    { if: { childTemper: 'ornery' }, text: ['I want {childSib} turned into a frog. Today. Now, ideally.'] },
    { if: { childTemper: 'shy' }, text: ['...Could you... maybe... make {childSib} a frog? A nice frog?'] },
  ]);
  lines('child.q.frog.pond', [
    { text: ['A small frog! A really small one!', 'There\'s the duck pond. That\'s big enough.', 'A bucket, then. A frog in a bucket.'] },
  ]);
  lines('child.q.frog.did', [
    { text: ['{ChildSib} told on me. About the jam. And it was only SOME of the jam.', '{ChildSib} broke my best thing and said it was already broken.', '{ChildSib} said I can\'t come to the river because I\'m a baby. I\'m NOT a baby.'] },
    { if: { childSibBig: has }, text: ['{ChildSibBig} sat on me. For ages. And said I was a cushion.'] },
    { if: { childSibLittle: has }, text: ['{ChildSibLittle} keeps following me and copying and then crying when I run off.'] },
    { if: { childBaby: has }, text: ['It\'s not even about {childSib}. Since the baby came nobody listens to me.'] },
    { if: { childTemper: 'gloomy' }, text: ['{ChildSib} is better than me at everything. Everyone says so.'] },
  ]);
  lines('child.q.frog.rule', [
    { text: ['That\'s a stupid rule. What\'s the second rule?', 'Who MADE that rule?', 'Not even a little frog? Not even a tadpole?'] },
  ]);
  lines('child.q.frog.second', [
    { text: ['Why not? What happens? ...You\'re doing it again.', 'Ugh! Wizards!', 'That\'s the second rule? That\'s just a way of not telling.'] },
  ]);
  lines('child.q.frog.toast', [
    { text: ['Not even TOAST?', 'Why would a dragon have toast?', 'Ha! I\'ll remember. No dragon toast.'] },
  ]);
  lines('child.q.frog.makeup', [
    { text: ['Hmph. Frogs CAN\'T say sorry. ...That\'s a good point.', 'All right. But {childSib} has to say it first.', 'Fine. I\'ll go and make it up. Badly.'] },
    { if: { childTemper: 'ornery' }, text: ['...Fine. But I\'m keeping the frog idea for later.'] },
  ]);
  lines('child.q.frog.newt', [
    { text: ['A NEWT! Ha! Till supper! Yes!', 'Can I watch? Can I keep it in a jar?', 'Hee! A newt with {childSib}\'s face! ...No. Don\'t. I\'d miss {childSib} at supper.'] },
  ]);
  lines('child.q.frog.hard', [
    { text: ['...It IS hard. Nobody gets it.', 'I don\'t really want a frog. I just want them to be nice.', '*sniff* ...Yeah.'] },
  ]);

  // =====================================================================================
  // Why is your hat pointy? (and the beard, the staff, the pipe)
  // =====================================================================================
  const QS = ['hat', 'beard', 'staff', 'pipe'];
  addThread({
    id: 'child.q.hat', theirs: true, label: 'A question about your hat', cool: 4,
    ask: '{Name} is staring at you, head on one side.',
    when: (F) => talker(F) && !F.childTween,
    beats: {
      start: { line: 'child.q.hat.start', fx: { run: (T) => { T.childQ = T.F.childQ = QS[Math.floor(Math.random() * QS.length)]; } }, go: [
        { ap: 'jest', say: 'child.q.hat.w.jest', to: 'jest' },
        { ap: 'tale', say: 'child.q.hat.w.tale', to: 'tale' },
        { ap: 'warm', say: 'child.q.hat.w.try', to: 'try' },
      ] },
      jest: { line: 'child.q.hat.jest', go: [
        { ap: 'tale', say: 'child.q.hat.w.tale', label: 'Tell them the truth of it', to: 'tale' },
        { ap: 'warm', say: 'child.q.hat.w.try', to: 'try' },
      ] },
      tale: { line: 'child.q.hat.tale', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'Any more questions, while I\'m in the mood?', to: 'more' },
        { ap: 'warm', say: 'child.q.hat.w.try', to: 'try' },
      ] },
      try: { line: 'child.q.hat.try', fx: { fond: 0.04, remember: 'The wizard let me have a go with his things!', rv: 2 }, go: [
        { ap: 'jest', say: 'It suits you. You\'ll be a wizard by teatime.', to: 'suits' },
        { ap: 'ask', say: 'Any more questions, while I\'m in the mood?', to: 'more' },
      ] },
      suits: { line: 'child.q.hat.suits', fx: { lean: 'rift', joke: { k: 'child.hat.suits', t: '{Name} will be a wizard by teatime.' } }, end: true },
      more: { line: 'child.q.hat.more', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.q.hat.start', [
    { text: ['Can I ask you a question? About you?'] },
    { if: { childQ: 'hat' }, pri: 5, text: ['Why is your hat pointy?', 'What\'s in your hat? Is there something in your hat?', 'Why is your hat so tall? Is your head pointy?'] },
    { if: { childQ: 'beard' }, pri: 5, text: ['Why is your beard so long?', 'Do things live in your beard? Birds?', 'Does your beard get in your soup?'] },
    { if: { childQ: 'staff' }, pri: 5, text: ['What\'s your stick for?', 'Is your stick magic? Is it? Can I hold it?', 'Why have you got a stick? Are your legs tired?'] },
    { if: { childQ: 'pipe' }, pri: 5, text: ['How do you make the smoke rings into shapes?', 'Why does your pipe smoke go green sometimes?', 'Can you blow a smoke ring shaped like ME?'] },
  ]);
  lines('child.q.hat.w.jest', [
    { text: ['Ah. A trade secret, I\'m afraid.'] },
    { if: { childQ: 'hat' }, pri: 5, text: ['To keep the rain off my thoughts.', 'So birds can\'t nest on it. They tried.'] },
    { if: { childQ: 'beard' }, pri: 5, text: ['It keeps my chin warm. And my tummy.', 'I keep a spare sandwich in it.'] },
    { if: { childQ: 'staff' }, pri: 5, text: ['For poking dragons. And reaching apples.', 'To lean on when someone tells a long story.'] },
    { if: { childQ: 'pipe' }, pri: 5, text: ['Years of practice and a very good tobacco.', 'I ask the smoke nicely.'] },
  ]);
  lines('child.q.hat.w.tale', [
    { text: ['That\'s a long story, and a true one.'] },
    { if: { childQ: 'hat' }, pri: 5, text: ['A wizard\'s hat is grown, not made. It points to where it\'s needed.'] },
    { if: { childQ: 'beard' }, pri: 5, text: ['Every hair is a road I\'ve walked. That\'s a lot of roads.'] },
    { if: { childQ: 'staff' }, pri: 5, text: ['It was a branch of a very old tree, and the tree said I could have it.'] },
    { if: { childQ: 'pipe' }, pri: 5, text: ['The smoke remembers places I\'ve been, and makes their shapes.'] },
  ]);
  lines('child.q.hat.w.try', [
    { text: ['Here. See for yourself.'] },
    { if: { childQ: 'hat' }, pri: 5, text: ['Would you like to try it on?', 'Here. Try it.'] },
    { if: { childQ: 'beard' }, pri: 5, text: ['You can give it a tug. Gently.', 'Go on, feel it. It\'s quite soft.'] },
    { if: { childQ: 'staff' }, pri: 5, text: ['Here. Hold it. Both hands.', 'You may hold it. Carefully.'] },
    { if: { childQ: 'pipe' }, pri: 5, text: ['Watch closely, then. One for you.', 'Stand back. I\'ll do you a special one.'] },
  ]);
  lines('child.q.hat.jest', [
    { text: ['That\'s silly. ...Is it true?', 'Ha! You\'re making it up.', 'I don\'t believe you. But I like it.'] },
    { if: { childQ: 'hat' }, text: ['Rain on your THOUGHTS? Do thoughts get wet?', 'Birds! Ha! I\'d let them.'] },
    { if: { childQ: 'beard' }, text: ['A SANDWICH? Show me!', 'Ha! Your tummy\'s got a scarf!'] },
    { if: { childQ: 'staff' }, text: ['Poking DRAGONS? Have you poked one?', 'Apples! Get me that one. Up there.'] },
    { if: { childQ: 'pipe' }, text: ['Does the smoke always listen?', 'Ask it to make a pig!'] },
  ]);
  lines('child.q.hat.tale', [
    { text: ['Wow.', '...Really?', 'That\'s the best thing anyone\'s ever told me.'] },
    { if: { childQ: 'hat' }, text: ['It POINTS? Where\'s it pointing now? ...Up. Is something up there?', 'Grown? Like a turnip?'] },
    { if: { childQ: 'beard' }, text: ['Every hair? Can I count them? That\'d be all the roads!', 'That\'s a LOT of roads. Have you walked all of them twice?'] },
    { if: { childQ: 'staff' }, text: ['A tree SAID? Trees can\'t talk!', 'Which tree? Is it near here? Does it miss its branch?'] },
    { if: { childQ: 'pipe' }, text: ['Make one of a place! A far one!', 'So the smoke\'s been everywhere with you?'] },
  ]);
  lines('child.q.hat.try', [
    { text: ['*it comes down past {their} nose*', '*grins enormously*', 'Look at me! LOOK at me!'] },
    { if: { childQ: 'hat' }, text: ['*the hat comes down to {their} chin* I can\'t see! I\'m a wizard! I can\'t see!', '*wears it, very solemnly, while the brim rests on {their} shoulders*'] },
    { if: { childQ: 'beard' }, text: ['*tugs, very gently* It\'s SOFT. Like a sheep.', '*hides {their} whole face in it and giggles*'] },
    { if: { childQ: 'staff' }, text: ['*holds it with both hands and wobbles* It\'s HEAVY.', '*points it at a hen* ...Nothing happened. Is it broken?'] },
    { if: { childQ: 'pipe' }, text: ['*the smoke makes a little hobbit with a big head* That\'s ME!', '*tries to catch the smoke ring and it goes round {their} wrist*'] },
  ]);
  lines('child.q.hat.suits', [
    { text: ['By TEATIME? I\'ll need a hat!', 'I\'m going to be a wizard! I\'m telling everyone!', 'A wizard! Can hobbits be wizards? I\'m going to be the first!'] },
  ]);
  lines('child.q.hat.more', [
    { text: ['Yes! Why are your eyebrows so big?', 'Do you have a mom?', 'What do you eat? Do wizards eat?'] },
    { if: { band: 'school' }, text: ['Lots. I\'ve got a list. Number one: do you sleep?'] },
    { if: { childTemper: 'shy' }, text: ['...No. That was enough. Thank you.'] },
  ]);

  // =====================================================================================
  // Can I come with you?
  // =====================================================================================
  addThread({
    id: 'child.q.come', theirs: true, label: 'Can I come with you?', cool: 6,
    ask: '{Name} has been looking at your wagon.',
    when: (F) => talker(F),
    beats: {
      start: { line: 'child.q.come.start', go: [
        { ap: 'warm', say: 'child.q.come.w.oneday', to: 'oneday' },
        { ap: 'ask', say: 'And where would you want to go?', to: 'where' },
        { ap: 'advise', say: 'The road\'s no place for a hobbit your age. Home is.', to: 'home', fx: { lean: 'hill' } },
      ] },
      where: { line: 'child.q.come.where', go: [
        { ap: 'tale', say: 'child.q.come.w.tale', label: 'Tell them what it\'s like', to: 'describe', fx: { lean: 'rift' } },
        { ap: 'advise', say: 'Then learn your letters and your maps first. Both.', to: 'prepare', fx: { run: both(0.03) } },
        { ap: 'warm', say: 'child.q.come.w.oneday', to: 'oneday' },
      ] },
      describe: { line: 'child.q.come.describe', fx: { fond: 0.03 }, go: [
        { ap: 'warm', say: 'One day. When you\'re grown. I\'ll keep a seat on the wagon.', to: 'oneday' },
        { ap: 'advise', say: 'And then you come home and tell everyone. That\'s the best part.', to: 'tell', fx: { lean: 'hill' } },
      ] },
      tell: { line: 'child.q.come.tell', end: true },
      prepare: { line: 'child.q.come.prepare', fx: { respect: 0.03, queue: 'school' }, end: true },
      oneday: { line: 'child.q.come.oneday', fx: { promise: { k: 'child.wagon', t: 'You said {name} could ride on the wagon one day, when grown', days: 60 }, fond: 0.03 }, end: true },
      home: { line: 'child.q.come.home', go: [
        { ap: 'warm', say: 'Every road I take ends here, you know. That should tell you something.', to: 'ends', fx: { lean: 'hill' } },
        { ap: 'jest', say: 'And who\'d mind your treasures while you\'re gone?', to: 'treasures' },
      ] },
      ends: { line: 'child.q.come.ends', fx: { trust: 0.03 }, end: true },
      treasures: { line: 'child.q.come.treasures', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.q.come.start', [
    { text: ['Can I come with you? On the wagon? Next time?', 'Take me with you when you go. Please. I\'ll be good.', 'If I hid in the wagon, would you notice?'] },
    { if: { band: 'young' }, text: ['Can I come? I\'m small. I fit. I fit in a basket.', 'I want to come on the wagon! I\'ll bring my blanket!'] },
    { if: { band: 'youth' }, text: ['Do you ever take anyone with you? On the road?', 'I\'m nearly grown. Could I come? Just once?'] },
    { if: { childComing: true }, pri: 1, text: ['When I come of age... could I come on the road with you? I\'m serious.'] },
    { if: { childTemper: 'shy' }, text: ['...Would you ever take someone with you? Someone quiet? Who wouldn\'t be any trouble?'] },
    { if: { childTemper: 'gloomy' }, text: ['Take me with you. Nobody here would miss me.'] },
    { if: { rift: true }, text: ['When you go through the golden door to Neverdark... could I come? Just to look?'] },
  ]);
  lines('child.q.come.where', [
    { text: ['Everywhere! The Mountain! The Sea! Bree!', 'Where the dragons are. Were.', 'Somewhere nobody\'s been. Is there anywhere nobody\'s been?'] },
    { if: { childRiftStage: { min: 2 } }, text: ['Through the rift! To where the rift-folk come from!'] },
    { if: { rift: true }, text: ['Home. Just to see if my old window\'s still lit.'] },
    { if: { childTemper: 'curious' }, text: ['Wherever the map stops. I want to see what\'s off the edge.'] },
    { if: { band: 'youth' }, text: ['Anywhere that isn\'t here. ...Not because here\'s bad. Because it\'s here.'] },
  ]);
  lines('child.q.come.w.tale', [
    { text: ['The Sea, then. Gray as a dove and bigger than the sky.', 'The Mountain. Snow on top even in summer, and the wind sings.', 'Bree. A town of Big Folk and little, and the best inn in the world.'] },
    { if: { childRiftStage: { min: 2 } }, text: ['Neverdark. All rain and neon, and towers that hum, and noodles on every corner.'] },
  ]);
  lines('child.q.come.describe', [
    { text: ['*has gone very still, listening*', 'I want to see it. I want to see it SO much.', 'Bigger than the sky? Nothing\'s bigger than the sky.'] },
    { if: { childTemper: 'curious' }, text: ['And then? What\'s after that? And after that?'] },
    { if: { childTemper: 'gloomy' }, text: ['...I\'ll never see it. I know I won\'t.'] },
  ]);
  lines('child.q.come.tell', [
    { text: ['And tell everyone! At the Badger! Like you do!', 'Coming home and telling. Yes. That IS the best part.', 'I\'ll be like you. Tales and everything.'] },
  ]);
  lines('child.q.come.prepare', [
    { text: ['Letters AND maps? That\'s two lots of school.', 'All right. Letters and maps. Then the road.', 'I\'m going to learn every map there is.'] },
  ]);
  lines('child.q.come.oneday', [
    { text: ['You PROMISE?', 'I\'m going to remember you said that. Forever.', 'When I\'m grown. That\'s ages. ...I\'ll wait.'] },
    { if: { childComing: true }, text: ['That\'s not long now. Not long at all.'] },
  ]);
  lines('child.q.come.home', [
    { text: ['Home\'s BORING. Nothing happens here.', 'That\'s what everyone says.', 'But you\'re not home. You\'re always on the road.'] },
    { if: { childTemper: 'ornery' }, text: ['You\'re just saying that because grown-ups have to.'] },
  ]);
  lines('child.q.come.ends', [
    { text: ['...Here? Every road?', 'Really? You come back here because you want to?', 'Oh. ...That\'s nice. I didn\'t think of that.'] },
  ]);
  lines('child.q.come.treasures', [
    { text: ['Ha! I\'d take them with me.', 'Hmm. Good point. Nobody else knows where they are.', 'The cat would. The cat would mind them.'] },
  ]);

  // =====================================================================================
  // Where do wizards live?
  // =====================================================================================
  addThread({
    id: 'child.q.home', theirs: true, label: 'Where do you live?', cool: 8,
    ask: '{Name} wants to know something about you.',
    when: (F) => talker(F) && F.talks >= 1,
    beats: {
      start: { line: 'child.q.home.start', go: [
        { ap: 'share', say: 'I don\'t, really. A wagon and a road. That\'s all.', to: 'none' },
        { ap: 'jest', say: 'In my hat. It\'s roomier than it looks.', to: 'hat' },
        { ap: 'tale', say: 'In the high places and the low places. Wherever I\'m wanted.', to: 'wanted' },
      ] },
      hat: { line: 'child.q.home.hat', go: [
        { ap: 'share', say: 'No, truly. I don\'t have a home. A wagon and a road.', to: 'none' },
        { ap: 'jest', say: 'Three rooms and a pantry. The pantry is the brim.', to: 'pantry' },
      ] },
      pantry: { line: 'child.q.home.pantry', fx: { joke: { k: 'child.home.hat', t: 'The wizard lives in his hat. The pantry is the brim.' } }, end: true },
      wanted: { line: 'child.q.home.wanted', go: [
        { ap: 'warm', say: 'Here, at the moment. You\'re wanting me.', to: 'here' },
        { ap: 'share', say: 'Which means no house at all, if I\'m honest.', to: 'none' },
      ] },
      here: { line: 'child.q.home.here', fx: { fond: 0.03 }, end: true },
      none: { line: 'child.q.home.none', fx: { trust: 0.03 }, go: [
        { ap: 'warm', say: 'That\'s very kind. I may take you up on it.', to: 'kind', fx: { fond: 0.05, owe: -0.1, remember: 'I asked the wizard to come and live with us.', rv: 2 } },
        { ap: 'jest', say: 'Would I have to share a room with {childSib}?', to: 'share', need: { if: { childSib: has } } },
        { ap: 'comfort', say: 'Don\'t be sad for me. The road\'s a good home, mostly.', to: 'road' },
      ] },
      kind: { line: 'child.q.home.kind', fx: { news: 'Little {name} has invited the wizard to come and live with them.' }, end: true },
      share: { line: 'child.q.home.share', fx: { fond: 0.02 }, end: true },
      road: { line: 'child.q.home.road', fx: { lean: 'rift' }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.q.home.start', [
    { text: ['Where do you live? When you\'re not here?', 'Have you got a house? A wizard house?', 'Where do wizards sleep? In beds?'] },
    { if: { band: 'young' }, text: ['Do you have a mom? Where does your mom live?', 'Is your house in a tree? A big tree?'] },
    { if: { band: 'school' }, text: ['Where\'s your hole? Do wizards have holes or houses? I\'ve always wondered.'] },
    { if: { band: 'youth' }, text: ['Where do you actually go, between visits? Do you have a home somewhere?'] },
    { if: { childTemper: 'shy' }, text: ['...Do you have somewhere warm to go? At night?'] },
  ]);
  lines('child.q.home.hat', [
    { text: ['In your HAT? ...How many rooms?', 'That\'s silly. Where do you put your bed?', 'Let me look!'] },
  ]);
  lines('child.q.home.pantry', [
    { text: ['The BRIM? Ha! What\'s in the pantry?', 'Is that why it\'s so big? It\'s full of cake?', 'I want a hat house.'] },
  ]);
  lines('child.q.home.wanted', [
    { text: ['Where are you wanted now?', 'Wherever you\'re wanted? How do you know?', 'That sounds nice. And lonely.'] },
  ]);
  lines('child.q.home.here', [
    { text: ['I DO want you! Stay!', 'Then you live here! It\'s decided!', 'Ha! Then you\'re never leaving.'] },
    { if: { childTemper: 'shy' }, text: ['...I do want you here. Very much.'] },
  ]);
  lines('child.q.home.none', [
    { text: ['No HOUSE? You can live with us. We\'ve got a spare chair.', 'That\'s sad. Come and live at ours. You can have my bed. I\'ll sleep on the rug.', 'A wagon isn\'t a home! You need a door! A round one!'] },
    { if: { childParentWord: has }, text: ['That\'s sad. Come and live at ours. You can have my bed. I\'ll go in with {childParentWord}.'] },
    { if: { band: 'youth' }, text: ['...That must be hard. Always going. You could stay, you know. People would like it.'] },
    { if: { childTemper: 'gloomy' }, text: ['Then you\'re like me. Nowhere\'s really yours.'] },
    { if: { rift: true }, text: ['Me neither. Not really. Home\'s on the other side of the sky. We could be homeless together.'] },
  ]);
  lines('child.q.home.kind', [
    { text: ['You WILL? I\'ll tell everyone! I\'ll make up the chair!', 'Yes! I\'ll tidy! I\'ll clear a whole shelf for your hat!', 'Come for supper first. Then stay.'] },
    { if: { childParentWord: has }, text: ['Yes! I\'ll ask {childParentWord}. {ChildParentWord} won\'t mind. {ChildParentWord} will mind. I\'ll ask anyway.'] },
  ]);
  lines('child.q.home.share', [
    { text: ['Ha! I\'d have to ask. There\'s not much room.', 'You\'d have to share with the cat. The cat won\'t mind.'] },
    { if: { childSib: has }, text: ['Ha! {ChildSib} snores. You\'d hate it.', 'You can have {childSib}\'s room. {ChildSib} can live in the wagon.', 'NO. ...Maybe. If you did magic at night.'] },
  ]);
  lines('child.q.home.road', [
    { text: ['A road for a home. ...I\'d like that. For a bit.', 'Is it? Does the road have a fire?', 'Then the road\'s lucky.'] },
  ]);

  // =====================================================================================
  // What will you be when you're grown?
  // =====================================================================================
  addThread({
    id: 'child.grown', label: 'What will you be when you\'re grown?', reveals: 'child.calling', weight: 1.2, cool: 5,
    when: (F) => talker(F) && !!F.childCalling && !F.childComing,
    open: { ask: 'child.grown.open' },
    beats: {
      start: { line: 'child.grown.start', fx: { learn: ['child.calling', '{Name} thinks {they} might be {childCallingA} when grown'] }, go: [
        { ap: 'ask', say: 'Why that?', to: 'why' },
        { ap: 'jest', say: 'Not a wizard, then? I\'m disappointed.', to: 'wizard' },
        { ap: 'advise', say: 'Then start learning now. Who\'d teach you?', to: 'teach' },
      ] },
      why: { line: 'child.grown.why', go: [
        { ap: 'warm', say: 'You\'d make a fine {childCalling}.', to: 'fine', fx: { fond: 0.02 } },
        { ap: 'advise', say: 'The old trades keep a village fed. There\'s honor in that.', to: 'honor', fx: { lean: 'hill' } },
        { ap: 'advise', say: 'There\'s more to the world than the trades we know. Keep your eyes open.', to: 'wider', fx: { lean: 'rift' } },
      ] },
      fine: { line: 'child.grown.fine', fx: { remember: 'The wizard says I\'d make a fine {childCalling}.', rv: 2 }, end: true },
      honor: { line: 'child.grown.honor', fx: { respect: 0.02 }, end: true },
      wider: { line: 'child.grown.wider', fx: { respect: 0.02 }, end: true },
      wizard: { line: 'child.grown.wizard', go: [
        { ap: 'tale', say: 'There was once a hobbit who did a thing no wizard could. So, who knows?', to: 'hobbit', fx: { lean: 'rift' } },
        { ap: 'jest', say: 'The hat\'s the hard part. You have to grow into it.', to: 'hat' },
      ] },
      hobbit: { line: 'child.grown.hobbit', fx: { fond: 0.03, remember: 'The wizard says a hobbit once did a thing no wizard could.' }, end: true },
      hat: { line: 'child.grown.hat', fx: { fond: 0.02 }, end: true },
      teach: { line: 'child.grown.teach', go: [
        { ap: 'advise', say: 'Ask to watch them work. Watching is half of learning.', to: 'watch', fx: { respect: 0.02 } },
        { ap: 'warm', say: 'Then I\'ll put in a good word for you.', to: 'word', fx: { promise: { k: 'child.word', t: 'You said you\'d put in a good word for {name} as {childCallingA}', days: 10 } } },
      ] },
      watch: { line: 'child.grown.watch', end: true },
      word: { line: 'child.grown.word', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.grown.open', [
    { text: ['What will you be when you\'re grown, {name}?', 'Have you thought what you\'ll be, {name}? When you\'re big?', 'Tell me, {name}. What trade will you take up?'] },
  ]);
  lines('child.grown.start', [
    { text: ['{ChildCallingA}, I think. Probably. Maybe.', 'I\'m going to be {childCallingA}. Everyone says I\'d be good at it.', 'I don\'t know. {ChildCallingA}? Is that a good thing to be?'] },
    { if: { childCallingKey: 'farmer' }, text: ['A farmer! With my own field. And a pig called Pudding.', 'Farmer. I like it when things grow. I like it when I grow them.'] },
    { if: { childCallingKey: 'miller' }, text: ['A miller. The mill goes round and round and it never gets bored.', 'Miller! I want to be all floury.'] },
    { if: { childCallingKey: 'baker' }, text: ['A baker! Then I\'d get to eat the broken ones.', 'Baker. The bakery smells like the best morning ever.'] },
    { if: { childCallingKey: 'brewer' }, text: ['A brewer. Not for the ale. For the bubbling. I like the bubbling.', 'Brewer! The vats go blup.'] },
    { if: { childCallingKey: 'innkeeper' }, text: ['Innkeeper at the Badger! Then I\'d hear everything first.', 'I\'ll run the Badger. Everyone comes in and tells you things.'] },
    { if: { childCallingKey: 'grower' }, text: ['A leaf-grower. The fields smell nice and the grown-ups pay you.', 'Pipe-weed! Not to smoke. To grow. The leaves are so big.'] },
    { if: { childCallingKey: 'fisher' }, text: ['A fisher. You sit by the river all day and it\'s WORK.', 'Fisher! I can already catch tiddlers in my hands.'] },
    { if: { childCallingKey: 'woodwright' }, text: ['A woodwright. I want to build a hole with a door that sings when it opens.', 'I\'ll make things out of wood. Chairs. Boats. A whole house.'] },
    { if: { childCallingKey: 'herbalist' }, text: ['An herbalist. I know eleven plants already. Three of them are poison.', 'Herbalist. I like mixing things. And people getting better.'] },
    { if: { childCallingKey: 'orchardist' }, text: ['I\'ll keep the orchard. Up the trees all day. Officially.', 'Orchards! Apples, pears, plums. And climbing.'] },
    { if: { childCallingKey: 'herder' }, text: ['A herder. The sheep are my friends. Even the cross one.', 'Herder. With a dog. A clever dog.'] },
    { if: { childCallingKey: 'mailcarrier' }, text: ['A mail carrier! I\'d go everywhere and read all the... I mean deliver all the letters.', 'Mail carrier. Everyone\'s happy to see the mail carrier.'] },
    { if: { childCallingKey: 'storyteller' }, text: ['A storyteller. Under the old oak. With all the little ones listening.', 'I\'m going to tell stories. I\'ve got loads already. Some are true.'] },
    { if: { childCallingKey: 'tinker' }, text: ['A tinker! With the rift-folk! Wiring and sparks and neon!', 'Tinker. I want to know how everything works. Everything.'] },
    { if: { band: 'young' }, text: ['A DRAGON. ...Or {childCallingA}. But a dragon first.', 'A pirate! Or {childCallingA}. Whichever has more cake.'] },
    { if: { childParentJob: has }, when: (F) => F.childParentJob !== F.childCalling, text: ['{ChildCallingA}. Not {childParentJob}, like at home. Something of my own.'] },
    { if: { childApprentice: has }, pri: 1, text: ['I\'ve been learning to be {childApprentice}. I watched them at it. I think I could.'] },
  ]);
  lines('child.grown.why', [
    { text: ['Because I\'m good at it. And it\'s nice. And nobody shouts.', 'I don\'t know. I just think about it. All the time.', 'Because then I\'d be useful. And people would say "ask {name}, {name} knows".'] },
    { if: { childCallingKey: ['farmer', 'grower', 'orchardist', 'herder'] }, text: ['Because I like being outside. Inside is for sleeping and second breakfast.'] },
    { if: { childCallingKey: ['baker', 'miller', 'brewer', 'innkeeper'] }, text: ['Because food. Everyone needs food. And then they love you.'] },
    { if: { childCallingKey: ['tinker', 'herbalist'] }, text: ['Because I want to know why things work. And then make them work better.'] },
    { if: { childCallingKey: ['mailcarrier', 'storyteller'] }, text: ['Because I like words. And people. And words to people.'] },
    { if: { childCallingKey: ['woodwright', 'fisher'] }, text: ['Because my hands like it. My head doesn\'t have to think. My hands just know.'] },
    { if: { childParentJob: has }, when: (F) => F.childParentJob !== F.childCalling, text: ['Because at home it\'s all {childParentJob} this and {childParentJob} that, all through supper. I want my own.'] },
  ]);
  lines('child.grown.fine', [
    { text: ['You think so? Really?', 'A FINE one. I\'m going to remember you said fine.', '...Thank you. Nobody\'s said that.'] },
    { if: { childTemper: 'shy' }, text: ['*very quietly* ...really?'] },
  ]);
  lines('child.grown.honor', [
    { text: ['Honor. Like in the stories. A farmer with honor.', 'I like that. Keeping everyone fed. That\'s a big job.', 'That\'s what Gran says. Every trade\'s a good trade if you do it well.'] },
  ]);
  lines('child.grown.wider', [
    { text: ['More than the trades we know? Like what?', 'Like the rift-folk trades? Wiring and that?', 'I\'ll keep my eyes open. Wide open.'] },
  ]);
  lines('child.grown.wizard', [
    { text: ['Can hobbits BE wizards?', 'I\'d be a wizard if I could! Can I?', 'A wizard! I didn\'t know that was allowed!'] },
    { if: { band: 'youth' }, text: ['I don\'t think that\'s on offer.'] },
  ]);
  lines('child.grown.hobbit', [
    { text: ['A HOBBIT did? What did they do?', 'Better than a wizard? A hobbit?', 'Then I could do something too. Something big.'] },
  ]);
  lines('child.grown.hat', [
    { text: ['I\'ll grow fast, then.', 'I\'ve got a big head. Gran says.', 'Ha! The hat would fall over my feet.'] },
  ]);
  lines('child.grown.teach', [
    { text: ['I don\'t know. Somebody kind.', 'I could ask. If I was brave.', 'Nobody, yet. Do you know anyone?'] },
    { if: { childParentJob: has }, when: (F) => F.childParentJob !== F.childCalling, text: ['I could learn the {childParentJob}\'s trade at home. But I want my own thing.'] },
  ]);
  lines('child.grown.watch', [
    { text: ['Watching is half? Then I\'m half there already. I watch everything.', 'I\'ll go and watch. Quietly. Like a mouse.', 'All right. I\'ll ask to watch. Tomorrow.'] },
  ]);
  lines('child.grown.word', [
    { text: ['A good word! From the wizard! They\'d HAVE to take me!', 'Would you? Really?', 'I\'ll work ever so hard. You\'ll see.'] },
  ]);
  // =====================================================================================
  // More ways to say it: tempers, ages and the older youths
  // =====================================================================================
  lines('child.q.come.w.oneday', [
    { text: ['One day, perhaps. When you\'re grown.', 'When you\'re grown, ask me again.'] },
    { if: { childTween: true }, pri: 1, text: ['When you\'re of age, ask me again. I\'ll listen.', 'Not long now. Ask me on your birthday.'] },
    { if: { band: 'young' }, text: ['When you\'re as tall as my staff. Then we\'ll see.'] },
  ]);
  lines('child.q.sky.start', [
    { if: { childTween: true }, pri: 1, text: ['You must know what the rifts are. Everyone our age argues about it at the river.', 'Is it true the rifts are getting worse? I want the truth, not the version for little ones.'] },
    { if: { childTemper: 'cheerful' }, text: ['The sky\'s got a hole in! Isn\'t it BRILLIANT? Why does it do that?'] },
    { if: { childTemper: 'ornery' }, text: ['Who\'s going to mend the sky? Because somebody should.'] },
  ]);
  lines('child.q.sky.think', [
    { if: { childTween: true }, pri: 1, text: ['The old ones say it\'s an ill wind. The rift-folk say it\'s a road. I think the old ones are scared.'] },
    { if: { childTemper: 'shy' }, text: ['...I think it\'s someone crying. Up there. Is that silly?'] },
    { if: { childTemper: 'cheerful' }, text: ['I think it\'s a present! Things come out of it! People! Lights!'] },
    { if: { childTemper: 'gloomy' }, text: ['I think the sky\'s getting old and wearing out. Like Granddad\'s knees.'] },
  ]);
  lines('child.q.sky.door', [
    { if: { childTween: true }, pri: 1, text: ['A door. That\'s what the rift-folk say. I didn\'t believe them till you said it.'] },
    { if: { childTemper: 'cheerful' }, text: ['A DOOR! In the SKY! Can we knock back?'] },
  ]);
  lines('child.q.sky.children', [
    { if: { childTween: true }, pri: 1, text: ['Children sent somewhere safe. ...Then we\'d better be safe for them.'] },
    { if: { childTemper: 'shy' }, text: ['*very quiet for a while* ...I\'ll be nice to them. All of them.'] },
  ]);
  lines('child.q.sky.bothright', [
    { if: { childTween: true }, pri: 1, text: ['Both a bit right. That\'s going to start some arguments at the river.'] },
    { if: { childTemper: 'shy' }, text: ['...Both. I like both. Nobody has to be wrong.'] },
  ]);
  lines('child.q.sky.hillright', [
    { if: { childTween: true }, pri: 1, text: ['It\'s happened before. I\'ll tell the young ones. They lie awake.'] },
  ]);
  lines('child.q.sky.riftright', [
    { if: { childTween: true }, pri: 1, text: ['Listen to the ones who came through. Fair enough. Most folk won\'t.'] },
  ]);

  lines('child.q.dragons.met', [
    { if: { childTemper: 'cheerful' }, text: ['A REAL dragon? Rude? What did he SAY? Did he say a bad word?'] },
    { if: { childTemper: 'curious' }, text: ['How big? Bigger than the mill? What did he smell like? Did he have a name?'] },
  ]);
  lines('child.q.dragons.what', [
    { if: { childTemper: 'shy' }, text: ['*holding your sleeve* ...and you weren\'t burned?'] },
    { if: { childTemper: 'cheerful' }, text: ['Jewels on his TUMMY! I want jewels on MY tummy!'] },
    { if: { childTemper: 'ornery' }, text: ['I\'d have fought him. With a stick. A big stick.'] },
  ]);
  lines('child.q.dragons.advice', [
    { if: { childTemper: 'cheerful' }, text: ['Polite! I\'m always polite! Well. Sometimes.'] },
    { if: { childTemper: 'ornery' }, text: ['Polite to a DRAGON? ...Fine. If it\'s very big.'] },
  ]);
  lines('child.q.dragons.far', [
    { if: { childTemper: 'shy' }, text: ['...Good. Then I can sleep.'] },
    { if: { childTemper: 'curious' }, text: ['How far is very far? In days? In legs?'] },
  ]);

  lines('child.q.age.guess', [
    { if: { childTemper: 'shy' }, text: ['...Fifty? Sorry. Sixty?'] },
    { if: { childTemper: 'cheerful' }, text: ['A MILLION AND SIX!'] },
    { if: { childTemper: 'ornery' }, text: ['Too old to be climbing about on wagons, that\'s how old.'] },
  ]);
  lines('child.q.age.trees', [
    { if: { childTemper: 'shy' }, text: ['...Were there any hobbits then? Were you lonely?'] },
    { if: { childTemper: 'cheerful' }, text: ['ALL trees! I\'d have climbed every one!'] },
  ]);
  lines('child.q.age.grow', [
    { if: { childTemper: 'cheerful' }, text: ['Then I\'ll grow up SO fast! You\'ll see! Tomorrow, probably!'] },
  ]);

  lines('child.q.frog.start', [
    { if: { childTemper: 'cheerful' }, text: ['Do the frog spell on {childSib}! It\'ll be SO funny! Just for one supper!'] },
    { if: { childTemper: 'curious' }, text: ['Could you turn {childSib} into a frog? I just want to know if it\'s possible. For science.'] },
  ]);
  lines('child.q.frog.did', [
    { if: { childTemper: 'shy' }, text: ['...{ChildSib} laughed at me. In front of everyone.'] },
    { if: { childTemper: 'ornery' }, text: ['{ChildSib} exists. In my room. Breathing my air.'] },
  ]);
  lines('child.q.frog.makeup', [
    { if: { childTemper: 'cheerful' }, text: ['All right! I\'ll make it up! And THEN I\'ll ask for the frog!'] },
    { if: { childTemper: 'shy' }, text: ['...I\'ll try. Will you watch from a long way off?'] },
  ]);

  lines('child.q.hat.tale', [
    { if: { childTemper: 'shy' }, text: ['*very quietly* ...I knew it was special.'] },
    { if: { childTemper: 'ornery' }, text: ['Hmph. Probably made up. ...It\'s a good one, though.'] },
  ]);
  lines('child.q.hat.try', [
    { if: { childTemper: 'shy' }, text: ['*holds it as if it might break, barely breathing*'] },
    { if: { childTemper: 'cheerful' }, text: ['*runs a whole circle round you, shrieking*'] },
  ]);

  lines('child.q.come.start', [
    { if: { childTween: true }, pri: 1, text: ['When I\'m of age, take me on the road with you. I mean it. I\'ll pull the wagon if I have to.', 'Do you ever need a hand? On the road? Someone young, who doesn\'t mind walking?'] },
    { if: { childTemper: 'cheerful' }, text: ['Take me! I\'m brilliant company! I know songs! Loads of songs!'] },
    { if: { childTemper: 'curious' }, text: ['If I came, could I see everything? Even the dangerous bits? Mostly the dangerous bits?'] },
  ]);
  lines('child.q.come.where', [
    { if: { childTween: true }, pri: 1, text: ['Wherever you go first. Then wherever you go after that.'] },
    { if: { childTemper: 'shy' }, text: ['...Somewhere quiet. With a view. Not too far.'] },
  ]);
  lines('child.q.come.oneday', [
    { if: { childTween: true }, pri: 1, text: ['I\'m holding you to that. I\'ll be on your step the morning after my birthday.'] },
    { if: { childTemper: 'shy' }, text: ['*nods, and keeps nodding, and goes very pink*'] },
  ]);
  lines('child.q.come.home', [
    { if: { childTween: true }, pri: 1, text: ['I\'m not a child, wizard. ...Not for long, anyway.'] },
    { if: { childTemper: 'shy' }, text: ['...You\'re right. I\'d miss home. I miss it when I\'m at Gran\'s.'] },
  ]);
  lines('child.q.home.start', [
    { if: { childTween: true }, pri: 1, text: ['Where do you go, between? Do you have people somewhere? Someone who waits?'] },
    { if: { childTemper: 'curious' }, text: ['Where do you keep your things? Your spare hats? Have you got spare hats?'] },
  ]);
  lines('child.q.home.none', [
    { if: { childTween: true }, pri: 1, text: ['No home? That\'s not right. Everyone needs a door to come back to. Stay with us, next time.'] },
    { if: { childTemper: 'cheerful' }, text: ['Then live HERE! With US! We\'ll make you a bed out of cushions!'] },
  ]);
  lines('child.q.home.kind', [
    { if: { childTween: true }, pri: 1, text: ['I mean it, you know. The door\'s open. Any time.'] },
  ]);

  lines('child.grown.start', [
    { if: { childCallingKey: 'nanny' }, text: ['A nanny! I\'m good with the little ones. They do what I say. Mostly.', 'I\'ll mind the babies. I like babies. They laugh at everything.'] },
    { if: { childCallingKey: 'lamplighter' }, text: ['A lamplighter! With the long pole! Lighting up the whole lane at dusk!', 'Lamplighter. Everyone\'s glad to see you at dusk.'] },
    { if: { childTween: true }, pri: 1, text: ['{ChildCallingA}, most likely. I\'ve been thinking about it properly. It suits.', 'I\'ve a fair idea. {ChildCallingA}. I just haven\'t told anyone at home yet.'] },
    { if: { childTemper: 'shy' }, text: ['...{ChildCallingA}. If I\'m good enough.'] },
    { if: { childTemper: 'ornery' }, text: ['{ChildCallingA}. And the best one. Better than any of them now.'] },
    { if: { childTemper: 'cheerful' }, text: ['{ChildCallingA}! The happiest {childCalling} in the Shire!'] },
    { if: { childTemper: 'curious' }, text: ['{ChildCallingA}, this week. Last week it was everything else. I like trying them on.'] },
    { if: { childTemper: 'gloomy' }, text: ['{ChildCallingA}, I suppose. If anyone wants me.'] },
  ]);
  lines('child.grown.why', [
    { if: { childCallingKey: ['nanny', 'lamplighter'] }, text: ['Because somebody has to look after things when nobody\'s looking.'] },
    { if: { childTween: true }, pri: 1, text: ['Because I\'m good at it, and it\'s honest, and I can see myself doing it at ninety.'] },
    { if: { childTemper: 'shy' }, text: ['...Because it\'s quiet work. And I can do it well without having to talk.'] },
    { if: { childTemper: 'cheerful' }, text: ['Because it\'s FUN! Work should be fun! Shouldn\'t it?'] },
  ]);
  lines('child.grown.fine', [
    { if: { childTween: true }, pri: 1, text: ['A fine one. ...I\'ll try to be.'] },
    { if: { childTemper: 'cheerful' }, text: ['The FINEST! I\'m going to be the finest!'] },
  ]);
  lines('child.grown.wider', [
    { if: { childTween: true }, pri: 1, text: ['There\'s more than the trades. Yes. I\'ve been thinking that for a while.'] },
  ]);
  lines('child.grown.honor', [
    { if: { childTween: true }, pri: 1, text: ['Honor in it. ...Yes. I\'d like to be the sort folk depend on.'] },
  ]);
  // =====================================================================================
  // Tell us a story! (theirs): the moral the wizard chooses goes into their upbringing
  // =====================================================================================
  const moral = (m) => (T, v) => {
    if (!v.isChild() || typeof upbOf !== 'function' || typeof MORALS === 'undefined' || !MORALS[m]) return;
    const u = upbOf(v); u.morals[m] = (u.morals[m] || 0) + 1;
    if (typeof nudgeUp === 'function') nudgeUp(v, MORALS[m].side, MORALS[m].amt * 0.6, `A tale of ${MORALS[m].label.toLowerCase()} from the wizard`);
  };
  addThread({
    id: 'child.q.tale', theirs: true, label: 'Tell me a story!', cool: 3,
    ask: '{Name} plants {them}self in front of you, arms folded.',
    when: (F) => talker(F) && !F.childTween,
    beats: {
      start: { line: 'child.q.tale.start', go: [
        { ap: 'tale', say: 'A small hobbit once stood in front of a great wolf, and did not run.', label: 'A tale of courage', to: 'courage', fx: { run: moral('courage') } },
        { ap: 'tale', say: 'A goblin once came to a hobbit-hole starving, and the hobbit gave him soup.', label: 'A tale of kindness', to: 'kindness', fx: { run: moral('kindness') } },
        { ap: 'tale', say: 'A hobbit once went all the way to the Mountain, and the best part was coming home.', label: 'A tale of home', to: 'home', fx: { run: moral('home') } },
      ] },
      courage: { line: 'child.q.tale.courage', go: [
        { ap: 'ask', say: 'And what do you think it means?', to: 'means' },
        { ap: 'tale', say: 'And the wolf, being only a wolf, went home with its tail down.', to: 'more' },
      ] },
      kindness: { line: 'child.q.tale.kindness', go: [
        { ap: 'ask', say: 'And what do you think it means?', to: 'means' },
        { ap: 'tale', say: 'And the goblin went home and told the others, and they never raided that valley again.', to: 'more' },
      ] },
      home: { line: 'child.q.tale.home', go: [
        { ap: 'ask', say: 'And what do you think it means?', to: 'means' },
        { ap: 'tale', say: 'And he hung his sword over the fireplace and used it to toast crumpets.', to: 'more' },
      ] },
      more: { line: 'child.q.tale.more', go: [
        { ap: 'tale', say: 'Then one more: a hobbit tricked three trolls with nothing but her voice.', label: 'A tale of cleverness', to: 'clever', fx: { run: moral('cleverness') } },
        { ap: 'warm', say: 'That\'s enough for one day. Off you go.', to: 'off' },
      ] },
      clever: { line: 'child.q.tale.clever', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'And what do you think that one means?', to: 'means' },
        { ap: 'warm', say: 'That\'s enough for one day. Off you go.', to: 'off' },
      ] },
      means: { line: 'child.q.tale.means', fx: { respect: 0.02, remember: 'The wizard told me a story, just for me.' }, go: [
        { ap: 'warm', say: 'That\'s exactly it. You were listening.', to: 'right' },
        { ap: 'jest', say: 'It means always carry a spare cookie.', to: 'cookie' },
      ] },
      right: { line: 'child.q.tale.right', fx: { fond: 0.03 }, end: true },
      cookie: { line: 'child.q.tale.cookie', fx: { joke: { k: 'child.tale.cookie', t: 'The moral of every story is: always carry a spare cookie.' } }, end: true },
      off: { line: 'child.q.tale.off', end: true },
    },
    end: { fond: 0.03 },
  });
  lines('child.q.tale.start', [
    { text: ['Tell me a story. A new one. One with a fight in.', 'Story! Story! You have to. It\'s the rule.', 'I\'m not moving till you tell me a story.'] },
    { if: { childTale: has }, pri: 1, text: ['Tell the one {childTale} again! No, a NEW one!', 'I liked the one {childTale}. Have you got another like that?'] },
    { if: { band: 'young' }, text: ['Story! With a dragon! And a pudding! And me in it!'] },
    { if: { band: 'school' }, text: ['Tell me one the storyteller doesn\'t know. I\'ll know if they know it.'] },
    { if: { band: 'youth' }, text: ['Got a story? A proper one. Not one for little ones.'] },
    { if: { childTemper: 'shy' }, text: ['...Would you tell me a story? Just me? A short one?'] },
    { if: { childTemper: 'ornery' }, text: ['Your stories are better than the storyteller\'s. Don\'t tell them I said. Tell one.'] },
    { if: { childTemper: 'gloomy' }, text: ['Tell me one where it ends all right. I need one of those.'] },
    { if: { childTemper: 'curious' }, text: ['Tell me a true one. Not a made-up one. A true one only you know.'] },
  ]);
  lines('child.q.tale.courage', [
    { text: ['He didn\'t RUN? From a WOLF?', 'Was he scared? He must have been scared.', '*has gone completely still*'] },
    { if: { childTemper: 'shy' }, text: ['...I\'d have run. ...I\'d like to not run. One day.'] },
    { if: { childTemper: 'ornery' }, text: ['I wouldn\'t run either. I\'d bite it.'] },
    { if: { band: 'young' }, text: ['A WOLF! A big one? With teeth? Did it go AWOOO?'] },
  ]);
  lines('child.q.tale.kindness', [
    { text: ['Soup? For a GOBLIN?', 'Why would you give a goblin soup? Goblins are horrible.', 'Was it good soup? It should be good soup.'] },
    { if: { childTemper: 'ornery' }, text: ['I wouldn\'t give a goblin soup. I\'d give it the door.'] },
    { if: { childTemper: 'cheerful' }, text: ['Aww! Hungry goblin! I\'d give it pudding too!'] },
  ]);
  lines('child.q.tale.home', [
    { text: ['The best part was coming HOME? After the MOUNTAIN?', 'Did he bring any treasure? He must have brought treasure.', 'That\'s a funny sort of ending. I like it, though.'] },
    { if: { childTemper: 'curious' }, text: ['But what was the Mountain like? You skipped the Mountain!'] },
    { if: { rift: true }, text: ['...I know about coming home. Kind of. From the other way.'] },
  ]);
  lines('child.q.tale.more', [
    { text: ['Ha! Another! Tell another!', 'Is that the end? It can\'t be the end.', 'That\'s the best bit. Is there more?'] },
    { if: { childTemper: 'shy' }, text: ['...One more? If it\'s not too much bother?'] },
  ]);
  lines('child.q.tale.clever', [
    { text: ['Just with her VOICE? How?', 'Trolls are stupid. Everybody knows. But three of them!', 'I want to trick a troll. I\'d be good at it.'] },
    { if: { childTemper: 'curious' }, text: ['What did she say? Exactly? Word for word? I might need it.'] },
  ]);
  lines('child.q.tale.means', [
    { text: ['It means you don\'t have to be big.', 'It means... it\'s better to be nice. Even to goblins. Mostly to goblins.', 'It means home is the treasure. Is that right?'] },
    { if: { childMoral: 'courage' }, text: ['It means brave isn\'t not being scared. It\'s being scared and staying.'] },
    { if: { childMoral: 'kindness' }, text: ['It means a kind thing goes further than you\'d think. Further than soup.'] },
    { if: { childMoral: 'cleverness' }, text: ['It means use your head. Your head\'s better than a sword.'] },
    { if: { childMoral: 'home' }, text: ['It means wherever you go, home\'s waiting. That\'s the point of it.'] },
    { if: { band: 'young' }, text: ['It means... wolves are silly! And soup is nice!'] },
  ]);
  lines('child.q.tale.right', [
    { text: ['I WAS listening! I always listen! Mostly.', 'Ha! I knew it! I\'m going to tell everyone what it means.', 'You can tell me another one tomorrow. That\'s a rule now.'] },
  ]);
  lines('child.q.tale.cookie', [
    { text: ['That\'s not what it means! ...Is it?', 'Ha! I always carry a cookie. I\'ve got one now. You can\'t have it.', 'A COOKIE. You\'re silly.'] },
  ]);
  lines('child.q.tale.off', [
    { text: ['Aww. Tomorrow, then. You promised. You didn\'t but you did.', 'Fine! I\'m going to tell it to the little ones! Wrong!', '*runs off, already telling it to someone*'] },
  ]);
  // bright little ones, the rift-born, and the seasons
  lines('child.q.sky.start', [
    { if: { register: 'bright' }, text: ['I\'ve been keeping a record of the rifts. Times, colors, size. Would you like to see my findings?'] },
    { if: { childRiftFriend: true, childRiftName: has }, text: ['{ChildRiftName} came out of the sky. So the sky\'s got people in. How many people?'] },
  ]);
  lines('child.q.sky.sat', [
    { if: { band: 'young' }, text: ['A BIG bottom! Ha! A sky bottom!'] },
  ]);
  lines('child.q.sky.harm', [
    { if: { band: 'young' }, text: ['You\'d stop them! With your stick! BONK!'] },
  ]);
  lines('child.q.sky.milk', [
    { if: { band: 'young' }, text: ['A sky milkman! Does he bring sky milk? Is it blue?'] },
  ]);
  lines('child.q.dragons.start', [
    { if: { register: 'bright' }, text: ['I\'ve read conflicting accounts of dragons. I\'d like a primary source. That\'s you.'] },
    { if: { rift: true }, text: ['Back home dragons were just on screens. Are the ones here real? Proper real?'] },
  ]);
  lines('child.q.dragons.think', [
    { if: { register: 'bright' }, text: ['On balance, probably real but rare. Like honest grown-ups.'] },
    { if: { band: 'young' }, text: ['YES. There\'s one under my bed. It\'s small. It\'s friendly.'] },
  ]);
  lines('child.q.dragons.trews', [
    { if: { band: 'young' }, text: ['Is it Trewsday? Is it? I\'m going to look out the window!'] },
  ]);
  lines('child.q.age.start', [
    { if: { register: 'bright' }, text: ['I estimate you\'re between two hundred and two thousand. Could you narrow it down?'] },
    { if: { rift: true }, text: ['Back home we have a thing that tells how old things are. It would probably break on you.'] },
  ]);
  lines('child.q.age.hills', [
    { if: { band: 'young' }, text: ['Hills are VERY old! Older than Gran!'] },
  ]);
  lines('child.q.age.more', [
    { if: { band: 'young' }, text: ['A HUNDRED HUNDREDS? That\'s more than all the numbers!'] },
    { if: { childTemper: 'shy' }, text: ['...That\'s a lot of birthdays to be alone for.'] },
  ]);
  lines('child.q.age.counting', [
    { if: { childTemper: 'cheerful' }, text: ['Then EVERY day can be your birthday! Can I give you a present? It\'s a stone.'] },
  ]);
  lines('child.q.frog.pond', [
    { if: { childTemper: 'ornery' }, text: ['Then make the pond bigger. You\'re a wizard.'] },
  ]);
  lines('child.q.frog.rule', [
    { if: { childTemper: 'curious' }, text: ['How many rules are there? Is there a book? Can I read it?'] },
  ]);
  lines('child.q.frog.hard', [
    { if: { childTemper: 'ornery' }, text: ['...Yeah. It is. *kicks a stone, but gently*'] },
  ]);
  lines('child.q.hat.more', [
    { if: { childTemper: 'cheerful' }, text: ['YES! A hundred! Number one: can you fly? Number two: can I?'] },
    { if: { childTemper: 'curious' }, text: ['Only about forty. Do you dream? What about? Are wizard dreams different?'] },
  ]);
  lines('child.q.hat.suits', [
    { if: { childTemper: 'shy' }, text: ['...A wizard by teatime. *whispers it again, to keep it*'] },
  ]);
  lines('child.q.come.describe', [
    { if: { childTemper: 'cheerful' }, text: ['I\'m going! I\'m definitely going! I\'m packing tonight!'] },
    { if: { childTemper: 'shy' }, text: ['...It sounds big. I\'d hold onto the wagon very tight.'] },
  ]);
  lines('child.q.come.prepare', [
    { if: { childTemper: 'curious' }, text: ['Maps! Real ones! Are there maps with the rift on? Someone should make one.'] },
  ]);
  lines('child.q.home.start', [
    { if: { register: 'bright' }, text: ['Do wizards have a fixed abode? I\'ve always wondered about the postal arrangements.'] },
  ]);
  lines('child.q.home.wanted', [
    { if: { childTemper: 'shy' }, text: ['...You\'re wanted here. In case you didn\'t know.'] },
  ]);
  lines('child.q.home.road', [
    { if: { childTemper: 'shy' }, text: ['...Come back, though. The road has to bring you back.'] },
  ]);
  lines('child.q.tale.courage', [
    { if: { band: 'youth' }, text: ['Didn\'t run. ...I\'d like to be that sort. When it matters.'] },
  ]);
  lines('child.q.tale.kindness', [
    { if: { childTemper: 'shy' }, text: ['...I\'d give it soup. Quietly. And then hide.'] },
  ]);
  lines('child.q.tale.home', [
    { if: { childTemper: 'shy' }, text: ['...I\'d want to come home too. That\'s the part I\'d like best.'] },
  ]);
  lines('child.q.tale.clever', [
    { if: { childTemper: 'cheerful' }, text: ['HA! Trolls! Stupid trolls! She was brilliant! I\'m going to be her!'] },
  ]);
  lines('child.q.tale.means', [
    { if: { childTemper: 'curious' }, text: ['It means the story\'s about more than the story. Is that right? I think that\'s right.'] },
  ]);
  lines('child.grown.wizard', [
    { if: { childTemper: 'cheerful' }, text: ['YES! A wizard! With a hat! I\'ll be the first hobbit wizard! Can I?'] },
    { if: { childTemper: 'curious' }, text: ['Is there a school for it? Where is it? How long does it take? What do you learn first?'] },
  ]);
  lines('child.grown.teach', [
    { if: { childTemper: 'shy' }, text: ['...I\'d be too shy to ask. Could you ask for me?'] },
    { if: { childTemper: 'cheerful' }, text: ['Anyone! I\'ll ask everyone! Somebody will say yes!'] },
  ]);
  lines('child.grown.watch', [
    { if: { childTemper: 'curious' }, text: ['Watching and then asking. That\'s the other half. I\'m good at asking.'] },
  ]);
  // seasons and small hours
  lines('child.q.sky.start', [
    { if: { hour: ['evening', 'night'] }, text: ['Why does the sky tear more at night? It does. I\'ve watched from my window.'] },
    { if: { weather: 'rain' }, text: ['Is the rain coming through the tears? Is it rift-rain? Is it safe?'] },
  ]);
  lines('child.q.sky.door', [
    { if: { band: 'young' }, text: ['A DOOR? Does it have a knocker? A big one?'] },
    { if: { childTemper: 'gloomy' }, text: ['...What if the door stays open and everything falls out?'] },
  ]);
  lines('child.q.sky.think', [
    { if: { band: 'young' }, text: ['I think a giant poked it with a stick! A really big stick!'] },
  ]);
  lines('child.q.dragons.met', [
    { if: { band: 'young' }, text: ['A REAL ONE? Did it breathe fire? On YOU?'] },
  ]);
  lines('child.q.dragons.breath', [
    { if: { band: 'young' }, text: ['EGGY DRAGON! *holds nose and runs in a circle*'] },
  ]);
  lines('child.q.age.guess', [
    { if: { childGranWord: has }, text: ['Older than {childGranWord}. {ChildGranWord}\'s ninety. So... ninety-one?'] },
  ]);
  lines('child.q.age.mind', [
    { if: { childTemper: 'shy' }, text: ['*thinks about it for a long time* ...I think I know what you mean.'] },
  ]);
  lines('child.q.frog.newt', [
    { if: { band: 'young' }, text: ['A NEWT! With a TAIL! Do it! Do it now!'] },
    { if: { childTemper: 'shy' }, text: ['...Only till supper. And a nice newt. Not a slimy one.'] },
  ]);
  lines('child.q.frog.toast', [
    { if: { childTemper: 'curious' }, text: ['What would happen? If you ate the dragon toast? Asking for later.'] },
  ]);
  lines('child.q.hat.jest', [
    { if: { band: 'young' }, text: ['Ha! Silly wizard! Silly silly!'] },
  ]);
  lines('child.q.come.start', [
    { if: { season: 'spring' }, text: ['When you go, in the spring, can I come? Spring\'s the best time for going.'] },
    { if: { season: 'winter' }, text: ['Do you go anywhere warm? Take me somewhere warm. My toes are blue.'] },
  ]);
  lines('child.q.come.tell', [
    { if: { childTemper: 'shy' }, text: ['...Telling would be the hard bit. But I\'d do it. For you.'] },
  ]);
  lines('child.q.come.ends', [
    { if: { childTemper: 'shy' }, text: ['...Then I\'ll be here. When the road ends. Every time.'] },
  ]);
  lines('child.q.home.none', [
    { if: { band: 'young' }, text: ['No HOUSE? You can have my blanket fort! It\'s got a door!'] },
  ]);
  lines('child.q.home.here', [
    { if: { band: 'youth' }, text: ['Wanted. ...Yes, all right. You are.'] },
  ]);
  lines('child.grown.start', [
    { if: { season: 'autumn', childCallingKey: ['farmer', 'orchardist', 'grower'] }, text: ['Something with harvests. Look at it all! Somebody has to bring it in!'] },
    { if: { rift: true }, text: ['Back home I\'d have been a courier. Here, {childCallingA}? That would be strange. Strange good.'] },
  ]);
  lines('child.grown.hobbit', [
    { if: { childTemper: 'shy' }, text: ['...A hobbit. Even a small one?'] },
    { if: { band: 'youth' }, text: ['A hobbit who did what no wizard could. ...You\'re not just saying that.'] },
  ]);
  lines('child.q.tale.off', [
    { if: { childTemper: 'shy' }, text: ['*whispers thank you, and goes off hugging the story*'] },
  ]);
  lines('child.q.tale.right', [
    { if: { childTemper: 'shy' }, text: ['...I always listen. Nobody notices.'] },
  ]);
});
