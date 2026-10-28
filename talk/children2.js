'use strict';
// ---------------------------------------------------------------------------
// Talking with the children, part two: what they learn and what they keep.
// The story circle under the old oak, letters and sums (and binary with
// acorns, once the rift-folk come), the treasures in their pockets, a secret
// told to the wizard, a child begging for magic, riddles to pass the time, and
// a bored child, read as a situation. The wizard's answers lean a child to the
// hill ways or the rift ways (or both), as his lessons do.
// ---------------------------------------------------------------------------

talkPack('children2', () => {
  const has = (x) => x != null && x !== false && x !== '' && !(Array.isArray(x) && !x.length);
  const kid = (F) => F.stage === 'child';
  const talker = (F) => kid(F) && F.band !== 'toddler';
  const both = (amt) => (T, v) => { if (v.isChild() && typeof nudgeUp === 'function') { nudgeUp(v, 'hill', amt, 'The wizard said both ways have their good'); nudgeUp(v, 'rift', amt, null, true); } };
  const spark = (col) => (T, v) => { if (typeof FX !== 'undefined' && FX.sparkle) FX.sparkle(v.x, v.y - 16, col || '#b8ff9a'); };

  // the riddle a child is asking, kept on the talk for the rest of the thread
  addFacts((v, F, T) => { F.childRiddle = (T && T.childRiddle) || null; });

  // =====================================================================================
  // The story circle under the old oak
  // =====================================================================================
  addThread({
    id: 'child.story', label: 'What did you hear at the story circle?', weight: 1.2, cool: 3,
    when: (F) => talker(F) && !F.childTween,
    rel: (F) => (F.was === 'school' ? 2 : F.childTale ? 1.4 : 1),
    open: { ask: 'child.story.open' },
    beats: {
      start: { line: 'child.story.start', go: [
        { ap: 'ask', say: 'And which is the best story of all?', to: 'best' },
        { ap: 'jest', say: 'And did anybody fall asleep? Be honest.', to: 'asleep' },
        { ap: 'tale', say: 'Shall I tell you one the old oak hasn\'t heard?', to: 'wiztale' },
      ] },
      best: { line: 'child.story.best', go: [
        { ap: 'ask', say: 'Why that one?', to: 'why' },
        { ap: 'jest', say: 'I was there, you know. For that one.', to: 'there' },
      ] },
      why: { line: 'child.story.why', go: [
        { ap: 'advise', say: 'Then keep it somewhere safe. You\'ll need it one day.', to: 'keep', fx: { respect: 0.02 } },
        { ap: 'warm', say: 'That\'s the best reason there is.', to: 'end' },
      ] },
      keep: { line: 'child.story.keep', fx: { remember: 'The wizard says to keep my favorite story somewhere safe.' }, end: true },
      there: { line: 'child.story.there', go: [
        { ap: 'jest', say: 'I was. I held everyone\'s coats.', to: 'coats' },
        { ap: 'share', say: 'I was. And I was frightened the whole time.', to: 'scared', need: { open: 1 }, soft: true },
      ] },
      coats: { line: 'child.story.coats', fx: { fond: 0.03, joke: { k: 'child.story.coats', t: 'The wizard held everyone\'s coats, in the old stories.' } }, end: true },
      scared: { line: 'child.story.scared', fx: { trust: 0.04, lean: 'rift', remember: 'The wizard was in a real story, and he was scared, and he went anyway.' }, end: true },
      asleep: { line: 'child.story.asleep', go: [
        { ap: 'jest', say: 'Did they snore? A good story deserves a good snore.', to: 'snore' },
        { ap: 'ask', say: 'And what\'s {childStoryteller} like, as a teacher?', to: 'teller', need: { if: { childStoryteller: has } } },
        { ap: 'warm', say: 'The warm afternoons do it. Even to wizards.', to: 'end' },
      ] },
      snore: { line: 'child.story.snore', fx: { fond: 0.02 }, end: true },
      teller: { line: 'child.story.teller', go: [
        { ap: 'warm', say: 'Tell {childStoryteller} I said they do it well.', to: 'praise', fx: { respect: 0.01 } },
        { ap: 'jest', say: 'And do they do the voices?', to: 'voices' },
      ] },
      praise: { line: 'child.story.praise', end: true },
      voices: { line: 'child.story.voices', fx: { fond: 0.02 }, end: true },
      wiztale: { line: 'child.story.wiztale', go: [
        { ap: 'tale', say: 'Beyond the hills are mountains, and beyond them more, and then the Sea, gray and endless.', label: 'A tale of the wide world', to: 'world', fx: { lean: 'rift' } },
        { ap: 'tale', say: 'There was once a hobbit who went all the way round the world, only to find his own door the finest.', label: 'A tale of coming home', to: 'home', fx: { lean: 'hill' } },
        { ap: 'tale', say: 'There\'s a city past the rifts where the lamps never go out, and a kind old engine tends them all.', label: 'A tale of Neverdark', to: 'neverdark', need: { if: { childRiftStage: { min: 2 } } }, fx: { lean: 'rift' } },
      ] },
      world: { line: 'child.story.world', fx: { fond: 0.03, remember: 'The wizard told me about the Sea. It goes on for ever.' }, end: true },
      home: { line: 'child.story.home', fx: { fond: 0.03, remember: 'The wizard told me about a hobbit who came home and found his own door the best.' }, end: true },
      neverdark: { line: 'child.story.neverdark', fx: { fond: 0.03, remember: 'The wizard told me about the city where the lamps never go out.' }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.story.open', [
    { text: ['What did you hear at the story circle today, {name}?', 'Been under the old oak, {name}? What was the story?', 'Tell me a story, {name}. One you heard this week.'] },
    { if: { was: 'school' }, text: ['Fresh from the old oak, {name}? What did you learn?', 'Was that the story circle breaking up? What was today\'s tale?'] },
    { if: { childTale: has }, text: ['Did you like my tale, {name}? Or was it too long?'] },
  ]);
  lines('child.story.start', [
    { text: ['A long one about a pig who wanted to be a horse. It didn\'t work out.', 'The one about Bullroarer Took. Again. I like it, but AGAIN.', 'Letters, and then a story about a bridge, and then letters again.'] },
    { if: { childStoryteller: has }, text: ['{ChildStoryteller} did the one about the Fell Winter. With wolf noises.', '{ChildStoryteller} told us about the first hobbits. They didn\'t have doors, if you can believe it.', '{ChildStoryteller} did a new one! About a heron who wanted to sing.'] },
    { if: { childTale: has }, text: ['YOURS! The one {childTale}! I told it to everyone after. I did it better.', 'Yours was best. The one {childTale}. Can you tell it again?'] },
    { if: { band: 'young' }, text: ['A story about a dragon! Or a cow. It had horns. I think a dragon.', 'I wasn\'t listening. There was a beetle. But it sounded good!'] },
    { if: { band: 'school' }, text: ['We did the history of Thistledown. It\'s mostly about who married who.', 'Herb-lore. Which mushrooms kill you. Most of them, it turns out.'] },
    { if: { band: 'youth' }, text: ['I don\'t really go any more. ...I go sometimes. To help with the little ones.', 'Same stories as always. I still like the Fell Winter. Don\'t tell anyone.'] },
    { if: { childTemper: 'curious' }, text: ['The one about Mungo the tinker who walked into green lightning! Where did he GO?'] },
    { if: { childTemper: 'shy' }, text: ['...I sit at the back. I hear everything though.'] },
    { if: { childTemper: 'ornery' }, text: ['A boring one. They\'re all boring except the ones with fights.'] },
    { if: { childTemper: 'gloomy' }, text: ['A sad one. Somebody\'s pony died. Why are there always ponies dying?'] },
    { if: { childRiftStage: { min: 3 } }, text: ['There was a rift-girl at the circle today. She told one about trains that fly. FLY.'] },
  ]);
  lines('child.story.best', [
    { text: ['The trolls one! When they turn to stone!', 'The dragon one. Obviously. Everyone says the dragon one.', 'The Fell Winter. When everyone stood together at the gates.'] },
    { if: { childMoral: 'courage' }, text: ['Any one where somebody small is brave. Those are the best.'] },
    { if: { childMoral: 'kindness' }, text: ['The one where the goblin gets given soup and stops being a goblin. Sort of.'] },
    { if: { childMoral: 'cleverness' }, text: ['The trolls! Because nobody fought them. Somebody just tricked them. That\'s better.'] },
    { if: { childMoral: 'home' }, text: ['The ones where they come home at the end. I like the ending bits best.'] },
    { if: { band: 'young' }, text: ['The one with the EAGLES. Whoosh! I want an eagle.', 'The one with the pudding. There\'s a pudding in it. I forget the rest.'] },
    { if: { childTemper: 'curious' }, text: ['Ones that don\'t finish. Then I can make up the end.'] },
    { if: { childTemper: 'shy' }, text: ['The quiet one about the lamp in the window. For people coming home.'] },
    { if: { rift: true }, text: ['The one about the Lamplighter. They tell it different at home, though.'] },
    { if: { rift: true, childParentWord: has }, text: ['The one about the Lamplighter. My {childParentWord} told it different, though.'] },
  ]);
  lines('child.story.why', [
    { text: ['Because it\'s exciting. And it ends right.', 'I don\'t know. It makes my tummy go fizzy.', 'Because nobody believed them, and they did it anyway.'] },
    { if: { childTemper: 'curious' }, text: ['Because I want to know if it\'s true. Is it true? You\'d know.'] },
    { if: { childTemper: 'gloomy' }, text: ['Because the sad bit gets better. Not all of them do.'] },
    { if: { band: 'school' }, text: ['Because it has a moral. The best ones have a moral, they say.'] },
    { if: { band: 'school', childStoryteller: has }, text: ['Because it has a moral. {ChildStoryteller} says the best ones have a moral.'] },
  ]);
  lines('child.story.keep', [
    { text: ['Somewhere safe? In my head?', 'I\'ll keep it under my pillow. In my head.', 'Need it for what?'] },
    { if: { childTemper: 'curious' }, text: ['What will I need it for? Is something going to happen?'] },
  ]);
  lines('child.story.there', [
    { text: ['You were THERE?', 'You were NOT.', 'Were you really? What did you do?'] },
    { if: { childTemper: 'ornery' }, text: ['Prove it. What color was the dragon?'] },
  ]);
  lines('child.story.coats', [
    { text: ['The COATS? That\'s all you did?', 'Ha! The coat-holder! That\'s not in the story!', 'Somebody has to hold the coats, I suppose.'] },
  ]);
  lines('child.story.scared', [
    { text: ['You were scared? And you still went?', '...That\'s braver, isn\'t it. Being scared and going anyway.', 'I didn\'t know wizards got scared.'] },
  ]);
  lines('child.story.asleep', [
    { text: ['Everyone! Except me. I was resting my eyes.', 'The little ones always fall asleep. And snore.', 'Nobody! ...Me. A bit. In the warm bit.'] },
    { if: { childStoryteller: has }, text: ['{ChildStoryteller} did! In the middle of a sentence! We had to wake them up!'] },
    { if: { childTemper: 'cheerful' }, text: ['Half of us! We were piled up like puppies!'] },
  ]);
  lines('child.story.snore', [
    { text: ['Ha! It was like a pig with a cold.', 'It went GRRRK-phew. GRRRK-phew. Like that.', 'Snores are better than stories, sometimes.'] },
  ]);
  lines('child.story.teller', [
    { text: ['Nice. Strict about letters. Not strict about cookies.', 'Good! Except when they do the same story twice.', 'They make the voices. The troll voice is the best.'] },
    { if: { childTemper: 'ornery' }, text: ['Bossy. But fair. Mostly bossy.'] },
    { if: { childTemper: 'shy' }, text: ['Kind. They let me sit near and not answer.'] },
  ]);
  lines('child.story.praise', [
    { text: ['I will! They\'ll be ever so pleased.', 'From the wizard? They\'ll go all pink.'] },
  ]);
  lines('child.story.voices', [
    { text: ['YES. The troll voice. Grrrr. Like that.', 'The best voices! Even the ladies! Even the horse!'] },
  ]);
  lines('child.story.wiztale', [
    { text: ['YES. A wizard one.', 'Yes yes yes. Sit down, everyone\'s sitting.', 'Is it a long one? I want a long one.'] },
    { if: { band: 'youth' }, text: ['...Go on, then. Since you\'re offering.'] },
    { if: { childTemper: 'shy' }, text: ['*sits very close, chin on knees*'] },
  ]);
  lines('child.story.world', [
    { text: ['For ever? Then where does it stop?', 'I\'m going to see it. The Sea. One day.', 'More mountains than you can count? I can count to a hundred.'] },
    { if: { childTemper: 'curious' }, text: ['What\'s on the other side of the Sea? There must be an other side.'] },
    { if: { childTemper: 'gloomy' }, text: ['It sounds lonely. All that water.'] },
  ]);
  lines('child.story.home', [
    { text: ['That\'s a nice one. I\'d like my door best too.', 'Why did he go all that way, then? Silly.', '...I like that. Coming home bits are the best bits.'] },
    { if: { childTemper: 'curious' }, text: ['But he SAW everything first. That\'s the bit I want.'] },
  ]);
  lines('child.story.neverdark', [
    { text: ['Lamps that never go out? Never? Not even at bedtime?', 'Is that where the rift-folk come from? Is it?', 'A kind engine. Engines can\'t be kind. ...Can they?'] },
    { if: { rift: true }, text: ['That\'s home. You told it right. Mostly right.'] },
  ]);

  // =====================================================================================
  // Letters and sums
  // =====================================================================================
  addThread({
    id: 'child.letters', label: (F) => (F.childLettered ? 'How are your letters coming?' : 'Can you read yet?'), weight: 1, cool: 4,
    when: (F) => talker(F) && !F.childTween,
    open: { ask: 'child.letters.open' },
    beats: {
      start: { line: 'child.letters.start', go: [
        { ap: 'ask', say: 'What\'s the hardest letter?', to: 'hard' },
        { ap: 'jest', say: 'Don\'t worry. Half the time I can\'t spell "wizard" either.', to: 'spell' },
        { ap: 'advise', say: 'Letters open doors, {name}. Every one of them.', to: 'doors' },
      ] },
      hard: { line: 'child.letters.hard', go: [
        { ap: 'tale', say: 'That one\'s a hobbit-hole door. Knock on it and it\'ll let you in.', to: 'door', fx: { lean: 'hill' } },
        { ap: 'ask', say: 'And how are your sums?', to: 'sums' },
      ] },
      door: { line: 'child.letters.door', fx: { remember: 'The wizard says that letter is a hobbit-hole door.' }, end: true },
      spell: { line: 'child.letters.spell', go: [
        { ap: 'jest', say: 'W-I-Z-... and then it goes a bit wrong.', to: 'wrong' },
        { ap: 'advise', say: 'But I keep at it. That\'s the trick.', to: 'doors' },
      ] },
      wrong: { line: 'child.letters.wrong', fx: { fond: 0.03, joke: { k: 'child.letters.wizrd', t: 'The wizard can\'t spell "wizard".' } }, end: true },
      doors: { line: 'child.letters.doors', go: [
        { ap: 'warm', say: 'A letter from far away, one day, with your name on it.', to: 'letter' },
        { ap: 'ask', say: 'What would you most like to read?', to: 'read' },
      ] },
      letter: { line: 'child.letters.letter', fx: { remember: 'The wizard says one day I\'ll get a letter from far away.', lean: 'rift' }, end: true },
      read: { line: 'child.letters.read', go: [
        { ap: 'advise', say: 'Then ask {childStoryteller}. Storytellers have all the books.', to: 'teller', need: { if: { childStoryteller: has } }, fx: { lean: 'hill' } },
        { ap: 'advise', say: 'The Relay is full of reading, the rift-folk say. Ask them to show you.', to: 'relay', need: { if: { childRiftFolk: true } }, fx: { lean: 'rift' } },
        { ap: 'warm', say: 'I\'ll bring you one, next time I come back from the road.', to: 'promise' },
      ] },
      teller: { line: 'child.letters.teller', fx: { queue: 'school' }, end: true },
      relay: { line: 'child.letters.relay', end: true },
      promise: { line: 'child.letters.promise', fx: { fond: 0.03, promise: { k: 'child.book', t: 'You said you\'d bring {name} a book from the road', days: 10 } }, end: true },
      sums: { line: 'child.letters.sums', go: [
        { ap: 'jest', say: 'If you have seven apples and I eat three...', to: 'apples' },
        { ap: 'advise', say: 'The rift-folk count with only ones and zeros. With acorns.', to: 'binary', need: { if: { childRiftFolk: true } }, fx: { lean: 'rift' } },
        { ap: 'warm', say: 'Sums are only stories about how many.', to: 'many', fx: { lean: 'hill' } },
      ] },
      apples: { line: 'child.letters.apples', fx: { fond: 0.02 }, end: true },
      binary: { line: 'child.letters.binary', fx: { remember: 'The wizard says the rift-folk count with acorns. One, none, one.' }, end: true },
      many: { line: 'child.letters.many', end: true },
    },
    end: { fond: 0.02, run: (T, v) => { if (typeof learn === 'function') learn(v, 0.006, 'you'); } },
  });
  lines('child.letters.open', [
    { text: ['How are your letters coming, {name}?', 'Can you read yet, {name}?', 'Tell me, {name}. What\'s the storyteller teaching you?'] },
    { if: { childLettered: true }, text: ['I hear you\'re reading now, {name}. What\'s the last thing you read?'] },
  ]);
  lines('child.letters.start', [
    { text: ['Some. I know my name. And PUDDING. That\'s the important ones.', 'A bit. The letters keep moving about when I look at them.', 'I can read the sign on the Badger. It says BADGER.'] },
    { if: { childLettered: true }, text: ['I can read! I read a whole book. It was about a duck.', 'Yes. I read everything. The jam labels. The almanac. A letter that wasn\'t mine.', 'I can read better than the big ones. Much better.'] },
    { if: { childLettered: true, childSib: has }, text: ['I can read better than {childSib}. Much better. Don\'t tell {childSib}.'] },
    { if: { band: 'young' }, text: ['I know A! And the round one. And the one like a snake.', 'I can write my name! Mostly. The last bit goes uphill.'] },
    { if: { band: 'youth' }, text: ['Course I can read. I\'m not a baby.', 'Well enough. Better than I let on.'] },
    { if: { register: 'bright' }, text: ['I\'m reading the almanac. All of it. The weather tables are fascinating.', 'I\'ve read every book in the house. Some twice. One backwards.'] },
    { if: { childTemper: 'ornery' }, text: ['Letters are stupid. Why can\'t you just SAY things?'] },
    { if: { childTemper: 'shy' }, text: ['...I can. I read under the covers. Nobody knows.'] },
    { if: { childTemper: 'curious' }, text: ['Yes! I\'m reading about the stars. Did you know they\'re very far away? Further than Bree.'] },
    { if: { riftWays: true }, text: ['I read the Relay. It scrolls. You have to be quick.'] },
  ]);
  lines('child.letters.hard', [
    { text: ['The one that\'s round with a tail. It looks like a pig going away.', 'All of them, when they\'re joined up.', 'The one that\'s the same as the other one but backwards. Why are there two?'] },
    { if: { band: 'young' }, text: ['The wiggly one. It wiggles too much.'] },
    { if: { childTemper: 'ornery' }, text: ['The one that sounds different every time. It\'s doing it on purpose.'] },
    { if: { register: 'bright' }, text: ['None, really. Spelling\'s harder. Why is there a G in "night"?'] },
  ]);
  lines('child.letters.door', [
    { text: ['A door! ...It IS a door! Look, it\'s got the round top!', 'I\'m going to knock on it every time now.', 'Then what\'s the one with a tail? A door with a dog?'] },
  ]);
  lines('child.letters.spell', [
    { text: ['You can\'t spell WIZARD?', 'Ha! I can. W-I-Z... ...hang on.', 'That\'s the most important word you\'ve got!'] },
  ]);
  lines('child.letters.wrong', [
    { text: ['W-I-Z-A-R-D. There. I\'ll teach YOU.', 'HA! The wizard can\'t spell wizard!', 'You need the story circle more than me.'] },
  ]);
  lines('child.letters.doors', [
    { text: ['What doors?', 'Doors to where?', 'I like doors. Round ones.'] },
    { if: { childTemper: 'curious' }, text: ['Every door? Even locked ones? Even the one in the hill nobody opens?'] },
    { if: { band: 'youth' }, text: ['That\'s the kind of thing grown-ups say. ...It\'s true, though, isn\'t it.'] },
  ]);
  lines('child.letters.letter', [
    { text: ['A letter? For ME? From where?', 'Nobody\'s ever written me a letter.', 'I\'d read it a hundred times. I\'d sleep with it.'] },
    { if: { childTemper: 'shy' }, text: ['...I\'d like that. A letter. Just for me.'] },
  ]);
  lines('child.letters.read', [
    { text: ['A map. A real map, with dragons on the edges.', 'A book about every animal. Every single one.', 'The big book in the Steward\'s hall that nobody\'s allowed to touch.'] },
    { if: { childTemper: 'curious' }, text: ['Everything. Is there a book of everything? There should be.'] },
    { if: { riftWays: true }, text: ['The Relay logs. All of them. The old ones from before.'] },
    { if: { childRiftStage: { min: 6 } }, text: ['That ledger. The one with Mungo\'s name in. I want to see his handwriting.'] },
  ]);
  lines('child.letters.teller', [
    { text: ['I\'ll ask! Tomorrow! Under the oak!', 'All the books? Even the big ones?'] },
  ]);
  lines('child.letters.relay', [
    { text: ['The rift-folk read on GLASS. It glows. I want to read glowing things.', 'The Relay! It talks in lights. I\'ll ask one of them.'] },
    { if: { childRiftName: has }, text: ['The Relay! It talks in lights. I\'ll ask {childRiftName}.'] },
  ]);
  lines('child.letters.promise', [
    { text: ['You PROMISE? A whole book?', 'With pictures? It has to have pictures.', 'I\'ll keep a shelf for it. An empty one. Waiting.'] },
  ]);
  lines('child.letters.sums', [
    { text: ['Sums are easy. Unless they\'re hard.', 'I can do adding. Taking away makes me sad.', 'I counted all the steps to the river. Four hundred and something. I lost count at a duck.'] },
    { if: { register: 'bright' }, text: ['I like sums. They\'re right or wrong. Not like people.'] },
    { if: { childTemper: 'ornery' }, text: ['What\'s the point of sums? I\'m never going to have forty-seven turnips.'] },
  ]);
  lines('child.letters.apples', [
    { text: ['FOUR. And you\'d have a tummy ache.', 'Why are YOU eating my apples?', 'Four. Unless you eat the cores. Do wizards eat the cores?'] },
  ]);
  lines('child.letters.binary', [
    { text: ['Acorns? Like this? One acorn, no acorn...', 'Only ones and zeros? How do they say seven?', 'That\'s silly. ...Show me. No, I\'ll ask them.'] },
    { if: { riftWays: true }, text: ['I know! One-one-one is seven! I can do it with pebbles too!'] },
  ]);
  lines('child.letters.many', [
    { text: ['Stories about how many. Huh. I like that.', 'So adding is a happy story and taking away is sad.', 'How many puddings. That\'s my favorite story.'] },
  ]);

  // =====================================================================================
  // What's in your pockets?
  // =====================================================================================
  addThread({
    id: 'child.treasure', label: 'What\'s in your pockets?', reveals: 'child.treasure', weight: 1.1, cool: 4,
    when: (F) => talker(F),
    rel: (F) => (F.pastime === 'collecting' ? 1.8 : 1),
    open: { ask: 'child.treasure.open' },
    beats: {
      start: { line: 'child.treasure.start', go: [
        { ap: 'ask', say: 'And which is the best one?', to: 'best' },
        { ap: 'jest', say: 'Is there a sandwich in there? I\'m a little peckish.', to: 'sandwich' },
        { ap: 'warm', say: 'May I see? Carefully.', to: 'see' },
      ] },
      see: { line: 'child.treasure.see', go: [
        { ap: 'ask', say: 'Where did you find that?', to: 'where' },
        { ap: 'ask', say: 'And which is the very best?', to: 'best' },
      ] },
      where: { line: 'child.treasure.where', go: [
        { ap: 'advise', say: 'Be careful near there. Treasure is no good to a hobbit in a ditch.', to: 'careful' },
        { ap: 'warm', say: 'You\'ve a good eye. Most folk walk straight past.', to: 'best' },
      ] },
      careful: { line: 'child.treasure.careful', fx: { respect: 0.01 }, end: true },
      sandwich: { line: 'child.treasure.sandwich', go: [
        { ap: 'jest', say: 'Thank you, no. I\'ll wait for one that\'s less... furry.', to: 'best' },
        { ap: 'warm', say: 'Very generous. Keep it for later.', to: 'best' },
      ] },
      best: { line: 'child.treasure.best', fx: { learn: ['child.treasure', '{Name} keeps treasures, and knows exactly which is best'] }, go: [
        { ap: 'ask', say: 'And where do you keep the rest?', to: 'hoard', need: { open: 2 }, soft: true },
        { ap: 'tale', say: 'A dragon would be jealous of that.', to: 'dragon' },
        { ap: 'jest', say: 'I\'ll trade you for it. A button off my coat?', to: 'trade' },
      ] },
      hoard: { line: 'child.treasure.hoard', fx: { confide: { k: 'child.treasure.hoard', t: '{Name} keeps a hoard of treasures hidden where nobody will look', secret: true } }, go: [
        { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'safe' },
        { ap: 'jest', say: 'I\'ll bring a spade, then. At midnight.', to: 'spade' },
      ] },
      safe: { line: 'child.treasure.safe', fx: { trust: 0.05, promise: { k: 'child.hoard', t: 'You promised {name} never to tell where the hoard is', days: 30 } }, end: true },
      spade: { line: 'child.treasure.spade', fx: { fond: 0.02 }, end: true },
      dragon: { line: 'child.treasure.dragon', go: [
        { ap: 'tale', say: 'Dragons hoard gold and never look at it. You look at yours. That\'s the difference.', to: 'look', fx: { lean: 'hill' } },
        { ap: 'jest', say: 'Just don\'t sleep on it. That\'s how it starts.', to: 'sleep' },
      ] },
      look: { line: 'child.treasure.look', fx: { respect: 0.02 }, end: true },
      sleep: { line: 'child.treasure.sleep', fx: { joke: { k: 'child.treasure.dragon', t: 'Don\'t sleep on your treasure. That\'s how dragons start.' } }, end: true },
      trade: { line: 'child.treasure.trade', go: [
        { ap: 'warm', say: '*You twist a brass button off your coat and hand it over.*', label: 'Give them a button off your coat', to: 'button', fx: { fond: 0.05, note: 'You gave {name} a button off your coat, for the hoard.', remember: 'The wizard gave me a button off his own coat.', rv: 2 } },
        { ap: 'jest', say: 'Ah. A hard bargainer. I withdraw.', to: 'end' },
      ] },
      button: { line: 'child.treasure.button', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.treasure.open', [
    { text: ['What have you got in your pockets, {name}?', 'Turn out your pockets, {name}. I\'m curious.', 'Your pockets are bulging, {name}. What\'s in them?'] },
    { if: { pastime: 'collecting' }, text: ['I hear you\'re a collector, {name}. What\'s the latest?'] },
  ]);
  lines('child.treasure.start', [
    { text: ['Lots. A stone, a string, a feather, a button, a stone that\'s different, and a bit of cake.', 'Nothing! ...Some things. Treasures.', 'Don\'t look. It\'s private. ...You can look a bit.'] },
    { if: { pastime: 'collecting', made: { min: 2 }, madeMany: has }, text: ['I\'ve got {made} {madeMany} at home. These are just the traveling ones.', 'Only the best ones. {Made} {madeMany} so far. I keep a list.'] },
    { if: { season: 'autumn' }, text: ['Conkers. Fourteen. And an acorn with a hat on.', 'Conkers, a crab apple and a leaf shaped like a hand.'] },
    { if: { season: 'spring' }, text: ['A bird\'s egg. Blue. It was already broken. I didn\'t take it.', 'A snail shell with nobody in it. I checked.'] },
    { if: { season: 'summer' }, text: ['A pebble from the river that\'s see-through if you lick it.', 'Feathers. A jay one. It\'s got blue in.'] },
    { if: { season: 'winter' }, text: ['An icicle. It was. It\'s a wet pocket now.', 'A holly leaf, a pine cone and a nail.'] },
    { if: { band: 'young' }, text: ['A worm. No, he went. A STONE. A good one.', 'Crumbs. And a snail. And more crumbs.'] },
    { if: { band: 'youth' }, text: ['Just a knife and some string. Ordinary things. ...And a pressed flower. Don\'t ask.'] },
    { if: { childRiftStage: { min: 4 } }, text: ['A bit of rift-glass! It glows when you breathe on it!', 'A chip from the rift-folk. It\'s got tiny roads on it.'] },
    { if: { rift: true }, text: ['A battery. Dead. But it\'s from home. And a hill-stone. They\'re friends.'] },
    { if: { childTemper: 'shy' }, text: ['...A feather. Just one. It\'s my best thing.'] },
  ]);
  lines('child.treasure.see', [
    { text: ['*lays out a stone, a button, a hazelnut and a very small bone*', '*empties a pocket onto your palm: string, two marbles, a dead beetle, lint*', 'Careful! That one\'s fragile. It\'s a moth wing.'] },
    { if: { pastime: 'collecting' }, text: ['These are sorted. Shiny, then pointy, then round, then things I can\'t decide about.'] },
    { if: { riftWays: true }, text: ['*a coil of copper wire, a blinking bead and a nut from the mill*'] },
  ]);
  lines('child.treasure.where', [
    { text: ['By the river. Where the bank fell in.', 'In the old quarry. Don\'t tell. We\'re not allowed.', 'Behind the Badger. Where they throw the bottles.'] },
    { if: { childRiftStage: { min: 2 } }, text: ['In a rift-scar. Where the grass went funny and purple.'] },
    { if: { childPetKind: 'dog', childPetName: has }, text: ['{ChildPetName} dug it up. {ChildPetName} finds the best stuff.'] },
  ]);
  lines('child.treasure.careful', [
    { text: ['I\'m always careful. Mostly.', 'All right. I\'ll take a stick to poke things with.', 'I only fell in once.'] },
  ]);
  lines('child.treasure.sandwich', [
    { text: ['There was. It\'s more of a crumb now. You can have it.', 'There\'s half a scone. It\'s been in there since Mersday. Want it?', 'No. I ate it. That\'s what pockets are for.'] },
  ]);
  lines('child.treasure.best', [
    { text: ['This. *a perfectly round white stone* It\'s a dragon egg. Probably.', 'This button. It\'s gold. Well, yellow. It\'s from somebody important.', 'The feather. It\'s from an eagle. A small eagle. Could be a pigeon.'] },
    { if: { pastime: 'collecting' }, text: ['My best is at home. A real arrowhead, from the old days. This is my second best.'] },
    { if: { childRiftStage: { min: 4 } }, text: ['This bit of rift-glass. Look. Look at it in the light. There\'s a city in it.'] },
    { if: { rift: true }, text: ['This. A token from the noodle stall at home. You get a free bowl with ten. I\'ve got nine.'] },
    { if: { band: 'youth' }, text: ['The flower. Someone gave it me. That\'s all I\'m saying.'] },
    { if: { childTemper: 'curious' }, text: ['This one. I don\'t know what it IS. That\'s why it\'s the best.'] },
  ]);
  lines('child.treasure.hoard', [
    { text: ['...In a tin. Under the party tree. Third root on the left.', '...Behind a loose stone in our wall. Nobody knows. Nobody at all.', '...In a hollow in the willow by the mill. It\'s got a lid made of bark.'] },
    { if: { childParentWord: has }, text: ['...Behind a loose stone in our wall. Nobody knows. Not even {childParentWord}.'] },
    { if: { childTemper: 'shy' }, text: ['...I\'ve never told anyone. Under the floorboard by my bed.'] },
  ]);
  lines('child.treasure.safe', [
    { text: ['You won\'t tell? Not even the other wizards?', 'Swear on your hat.', 'Good. Because if you tell I\'ll have to move it all. It took ages.'] },
  ]);
  lines('child.treasure.spade', [
    { text: ['NO! Ha! You wouldn\'t.', 'I\'ll guard it. With a stick.', 'You don\'t know which root. Ha.'] },
  ]);
  lines('child.treasure.dragon', [
    { text: ['Really? A real dragon?', 'Dragons would want it? Then I\'d better hide it better.', 'Ha! Bring the dragon here. I\'ll show it.'] },
  ]);
  lines('child.treasure.look', [
    { text: ['I look at mine every day. Some days twice.', 'What\'s the point of treasure you don\'t look at?', 'That\'s a silly dragon.'] },
  ]);
  lines('child.treasure.sleep', [
    { text: ['Ha! I\'ll sleep next to it. Not on it.', 'Is that how dragons start? Really?', 'I don\'t want to turn into a dragon. ...A bit.'] },
  ]);
  lines('child.treasure.trade', [
    { text: ['A WIZARD\'S button? From the actual coat?', 'Hmm. Two buttons.', 'A button for my best thing? No. ...For my third best thing.'] },
    { if: { childTemper: 'ornery' }, text: ['Three buttons and a firework.'] },
  ]);
  lines('child.treasure.button', [
    { text: ['*holds it up to the light* It\'s the best thing I\'ve ever had.', 'Now my coat\'s got a wizard button and yours hasn\'t. Ha.', 'I\'m going to keep it forever. And show everyone. No. Show nobody.'] },
  ]);

  // =====================================================================================
  // A secret (theirs)
  // =====================================================================================
  addThread({
    id: 'child.secret', theirs: true, label: 'A secret', cool: 6,
    ask: '{Name} looks both ways down the lane, then beckons you closer.',
    when: (F) => talker(F) && F.met && F.talks >= 1,
    beats: {
      start: { line: 'child.secret.start', go: [
        { ap: 'warm', say: 'Wizards are made of secrets. One more won\'t show.', to: 'tell' },
        { ap: 'jest', say: 'Only if it\'s a good one. I\'ve heard some very dull secrets.', to: 'tell' },
        { ap: 'ask', say: 'Is it a happy secret or a worrying one?', to: 'kind' },
      ] },
      kind: { line: 'child.secret.kind', go: [
        { ap: 'listen', say: '*You crouch down and wait.*', label: 'Crouch down and wait', to: 'tell' },
        { ap: 'warm', say: 'Then tell me, and we\'ll see which.', to: 'tell' },
      ] },
      tell: { line: 'child.secret.tell', fx: { confide: { k: 'child.secret', t: 'something {they}\'s never told anyone', secret: true } }, go: [
        { ap: 'ask', say: 'Does anybody else know?', to: 'who' },
        { ap: 'advise', say: 'That one might be worth telling a grown-up. A kind one.', to: 'grown' },
        { ap: 'warm', say: 'It\'s safe with me. Safe as stone.', to: 'safe' },
      ] },
      who: { line: 'child.secret.who', go: [
        { ap: 'warm', say: 'Then there are two of us now. That\'s a good number for a secret.', to: 'safe' },
        { ap: 'advise', say: 'Secrets get heavy, carried alone. Share it with someone you trust.', to: 'grown' },
      ] },
      grown: { line: 'child.secret.grown', fx: { respect: 0.03, lean: 'hill' }, end: true },
      safe: { line: 'child.secret.safe', fx: { trust: 0.05, promise: { k: 'child.secret', t: 'You promised {name} to keep the secret', days: 30 } }, end: true },
    },
    end: { fond: 0.03 },
  });
  lines('child.secret.start', [
    { text: ['Can you keep a secret? A real one?', 'I\'ve got a secret. I\'ve never told anyone. Can wizards keep secrets?', 'If I tell you something, will you swear on your hat not to tell?'] },
    { if: { band: 'youth' }, text: ['Can I tell you something? You won\'t laugh?', 'You\'re the only one I can tell. You don\'t live here, so it doesn\'t count.'] },
    { if: { childTemper: 'shy' }, text: ['*very quietly* I\'ve got a secret. Is that all right?'] },
    { if: { childTemper: 'cheerful' }, text: ['I\'ve got a SECRET! It\'s the best secret! Do you want it?'] },
  ]);
  lines('child.secret.kind', [
    { text: ['Happy. Mostly. A bit worrying.', 'Happy! ...I think. Unless someone finds out.', 'Worrying. A bit. Maybe. I don\'t know.'] },
    { if: { childTemper: 'gloomy' }, text: ['A worrying one. They\'re all worrying ones.'] },
  ]);
  lines('child.secret.tell', [
    { text: ['There\'s a den. In the willows by the mill. We built it. It\'s got a roof AND a door.', 'I know where the hens lay when they don\'t lay in the coop. There\'s TWENTY eggs.', 'There\'s a kitten under the woodpile. I\'ve been giving it my milk.'] },
    { if: { band: 'young' }, text: ['I ate the jam. All of the jam. Everyone thinks it was the mice.', 'I can whistle. Nobody knows. I\'m saving it.'] },
    { if: { band: 'school' }, text: ['I broke the window at the mill. With a conker. A really good shot, though.', 'I\'m learning to write backwards, so nobody can read my diary.'] },
    { if: { band: 'youth' }, text: ['I don\'t want to do what everyone thinks I\'m going to do. When I\'m grown.', 'I went out to the edge of the Long Meadow at night. Right to the edge. Just to see.'] },
    { if: { band: 'youth', childCrush: has }, text: ['I like {childCrush}. Like LIKE. Don\'t you dare.'] },
    { if: { childRiftOpen: true }, text: ['I touched the rift. Just the edge. It was warm. It tickled.'] },
    { if: { childRiftName: has }, text: ['{ChildRiftName} gave me a gadget. It blinks. I keep it in my sock.'] },
    { if: { rift: true }, text: ['I remember my old room. In the city. It had a window full of lights. I miss it.'] },
    { if: { childPetName: has }, text: ['{ChildPetName} can open the larder. I taught {childPetName}. Nobody knows it was me.'] },
    { if: { childTemper: 'shy' }, text: ['I talk to the old oak. When nobody\'s there. It listens better than people.'] },
    { if: { childTemper: 'curious' }, text: ['I followed a fox to its den. There are cubs. FOUR.'] },
    { if: { childTemper: 'gloomy' }, text: ['Sometimes I cry for no reason. Is that allowed?'] },
  ]);
  lines('child.secret.who', [
    { text: ['Nobody. Just you. And me.', 'My best friend. And now you. That\'s all.', 'The cat. But the cat won\'t tell.'] },
    { if: { childPal: has }, text: ['{ChildPal}. But {childPal} swore on a conker.'] },
    { if: { childTemper: 'shy' }, text: ['...Only you.'] },
  ]);
  lines('child.secret.grown', [
    { text: ['...Maybe. A kind one. I\'ll think about it.', '...Maybe. A kind one. If I pick the right time.', 'A grown-up? Like who? ...Gran wouldn\'t be cross. Gran\'s never cross.'] },
    { if: { childParentWord: has }, text: ['Not {childParentWord}! ...Maybe {childParentWord}. If I pick the right time.'] },
    { if: { band: 'youth' }, text: ['You\'re right. I know you\'re right. I hate it when you\'re right.'] },
  ]);
  lines('child.secret.safe', [
    { text: ['Safe as stone. I like that.', 'Thank you. I feel lighter. Is that silly?', 'Pinkie promise. Do wizards have pinkies? There. Promise.'] },
    { if: { childTemper: 'cheerful' }, text: ['Hee! We\'ve got a secret! You and me!'] },
  ]);

  // =====================================================================================
  // Do some magic! (theirs)
  // =====================================================================================
  addThread({
    id: 'child.magic', theirs: true, label: 'Begging for magic', cool: 2,
    ask: '{Name} has been staring at your staff for some time.',
    when: (F) => talker(F) && !F.childTween,
    beats: {
      start: { line: 'child.magic.start', go: [
        { ap: 'tale', say: '*You snap your fingers. A small green spark jumps out and pops.*', label: 'Snap out a spark', to: 'spark', fx: { run: spark('#b8ff9a') } },
        { ap: 'jest', say: 'Magic? Me? I\'m just an old man with a hat.', to: 'tease' },
        { ap: 'advise', say: 'Real magic is mostly patience. And knowing things.', to: 'patience' },
      ] },
      tease: { line: 'child.magic.tease', go: [
        { ap: 'tale', say: 'Oh, very well. *You blow a smoke ring the shape of a ship.*', label: 'Blow a smoke ship', to: 'ship' },
        { ap: 'advise', say: 'Truly, it\'s mostly patience. Very dull, I\'m afraid.', to: 'patience' },
      ] },
      patience: { line: 'child.magic.patience', go: [
        { ap: 'ask', say: 'And what would you do, if you had magic?', to: 'what' },
        { ap: 'tale', say: 'Watch, then. *You blow a smoke ring the shape of a ship.*', label: 'Blow a smoke ship', to: 'ship' },
      ] },
      ship: { line: 'child.magic.ship', fx: { fond: 0.04, run: (T, v) => { if (typeof FX !== 'undefined' && FX.smokeRing) FX.smokeRing(Game.wizard ? Game.wizard.fx : v.x, (Game.wizard ? Game.wizard.fy : v.y) - 20); }, news: 'The wizard blew a smoke ring like a ship, just for {name}.' }, go: [
        { ap: 'ask', say: 'And what would you do, if you had magic?', to: 'what' },
        { ap: 'jest', say: 'That\'s your lot. Magic has to be rationed, like cake.', to: 'ration' },
      ] },
      spark: { line: 'child.magic.spark', fx: { fond: 0.04, feel: 'wizard_show' }, go: [
        { ap: 'ask', say: 'And what would you do, if you had magic?', to: 'what' },
        { ap: 'jest', say: 'That\'s your lot. Magic has to be rationed, like cake.', to: 'ration' },
      ] },
      ration: { line: 'child.magic.ration', fx: { joke: { k: 'child.magic.cake', t: 'Magic is rationed, like cake.' } }, end: true },
      what: { line: 'child.magic.what', go: [
        { ap: 'advise', say: 'You can make a garden grow without any magic at all. Ask your gran.', to: 'garden', fx: { lean: 'hill' } },
        { ap: 'advise', say: 'The rift-folk make light without a scrap of magic. Ask them how.', to: 'light', need: { if: { childRiftFolk: true } }, fx: { lean: 'rift' } },
        { ap: 'warm', say: 'A kind hand and a clever head. That\'s most of the magic I know.', to: 'kind', fx: { run: both(0.025) } },
      ] },
      garden: { line: 'child.magic.garden', fx: { queue: 'garden', remember: 'The wizard says a garden is a kind of magic.' }, end: true },
      light: { line: 'child.magic.light', fx: { remember: 'The wizard says the rift-folk make light without magic.' }, end: true },
      kind: { line: 'child.magic.kind', fx: { respect: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.magic.start', [
    { text: ['Do some magic! Go on! Just a little bit!', 'Can you do magic? Prove it.', 'Make something float. Or explode. Explode is better.'] },
    { if: { childShow: true }, text: ['Do the dragon again! The firework one! Please please please!'] },
    { if: { band: 'young' }, text: ['Turn me into a bird! Just for a minute! I\'ll come back!', 'Make it snow! Or make it pudding! Make it snow pudding!'] },
    { if: { band: 'school' }, text: ['I\'ve read that wizards can\'t really do magic. I want to check.', 'What\'s the smallest magic you can do? Do that one.'] },
    { if: { band: 'youth' }, text: ['Is it real? The magic. Honestly. I won\'t tell the little ones.'] },
    { if: { childTemper: 'shy' }, text: ['...Could you do one tiny magic? Only if it\'s not too much bother.'] },
    { if: { childTemper: 'ornery' }, text: ['I don\'t believe in magic. Do some and I\'ll think about it.'] },
    { if: { rift: true }, text: ['Back home we had holograms. Is magic like holograms? Show me.'] },
  ]);
  lines('child.magic.tease', [
    { text: ['You are NOT. You\'ve got a staff!', 'Old men don\'t have hats like that.', 'Liar! A nice liar. But a liar.'] },
    { if: { childTemper: 'ornery' }, text: ['I knew it. Fake.'] },
    { if: { childTemper: 'cheerful' }, text: ['Hee! You\'re fibbing! Your eyebrows are doing it!'] },
  ]);
  lines('child.magic.patience', [
    { text: ['Patience? That\'s not magic. That\'s waiting.', 'Boring.', 'Knowing things is just school.'] },
    { if: { childTemper: 'curious' }, text: ['What things? Which things do you have to know? All of them?'] },
    { if: { band: 'youth' }, text: ['That sounds like a wizard way of saying no.'] },
  ]);
  lines('child.magic.ship', [
    { text: ['A SHIP! It\'s got SAILS!', '*watches it float off over the lane, mouth wide open*', 'How do you DO that? Show me! No, do it again!'] },
    { if: { childTemper: 'ornery' }, text: ['...That was all right. That was quite good actually.'] },
    { if: { childTemper: 'shy' }, text: ['*whispers* ...it\'s sailing away.'] },
  ]);
  lines('child.magic.spark', [
    { text: ['WHOA!', 'It went POP! Again! Again!', 'Did you see it? It was green! Real green!'] },
    { if: { childTemper: 'ornery' }, text: ['...That could have been a trick. Do it again so I can watch your hands.'] },
    { if: { childTemper: 'curious' }, text: ['Where did it come from? Your finger? Is it hot? Can I touch the next one?'] },
    { if: { rift: true }, text: ['No wires. No battery. Where\'s the power coming from?'] },
  ]);
  lines('child.magic.ration', [
    { text: ['Like CAKE? That\'s the worst rule.', 'Who rations it? Is there a wizard mom?', 'I\'d never ration cake. Or magic.'] },
  ]);
  lines('child.magic.what', [
    { text: ['Make every day a party. With the good cake.', 'Make it summer forever. And never have bedtime.', 'Fly. Over the hill, and over the next hill, and the next.'] },
    { if: { childSib: has }, text: ['Turn {childSib} into a frog. Only for a bit.'] },
    { if: { childRiftStage: { min: 1 } }, text: ['Mend the sky. So it stops tearing. Or tear it bigger. I can\'t decide.'] },
    { if: { rift: true }, text: ['Go home. Just to look. Then come back for tea.'] },
    { if: { childTemper: 'gloomy' }, text: ['Make everyone like me.'] },
    { if: { childTemper: 'shy' }, text: ['Be invisible. Not always. Just at parties.'] },
    { if: { childTemper: 'curious' }, text: ['Talk to animals. I have a LOT of questions for the hens.'] },
  ]);
  lines('child.magic.garden', [
    { text: ['A garden? That\'s just digging.', 'Gran does say her beans are magic.', 'All right. I\'ll grow something. Something big.'] },
    { if: { childGranWord: has }, text: ['{ChildGranWord}\'s got the best garden. Maybe {childGranWord}\'s a wizard.'] },
  ]);
  lines('child.magic.light', [
    { text: ['How do they do it? I\'m going to ask. Right now.', 'Without magic? Then how?', 'I want a light like theirs. A pink one.'] },
    { if: { childRiftName: has }, text: ['I\'ll ask {childRiftName}. {ChildRiftName} knows everything about lights.'] },
  ]);
  lines('child.magic.kind', [
    { text: ['That\'s not magic. ...Is it?', 'A kind hand and a clever head. I\'ve got one of those. Mostly the hand.', 'Hmm. I\'ll try both.'] },
    { if: { childTemper: 'curious' }, text: ['So magic is just being good at things? That\'s a bit disappointing. And a bit exciting.'] },
  ]);

  // =====================================================================================
  // Riddles, to pass the time
  // =====================================================================================
  const RIDDLES = ['egg', 'teapot', 'mushroom', 'shadow', 'echo', 'river', 'hole', 'candle'];
  addThread({
    id: 'child.pass.riddle', light: true, ap: 'jest', label: 'A riddle game', open: { jest: 'child.pass.riddle.open' },
    when: (F) => talker(F),
    beats: {
      start: { line: 'child.pass.riddle.ask', fx: { run: (T) => { T.childRiddle = T.F.childRiddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)]; } }, go: [
        { ap: 'jest', say: 'child.pass.riddle.wrong', label: 'Guess, badly', to: 'wrong' },
        { ap: 'ask', say: 'Give me a clue. A small one.', to: 'clue' },
        { ap: 'warm', say: 'child.pass.riddle.right', label: 'Guess it', to: 'right' },
      ] },
      wrong: { line: 'child.pass.riddle.no', go: [
        { ap: 'ask', say: 'A clue, then. Have pity on an old man.', to: 'clue' },
        { ap: 'warm', say: 'I give up. Tell me.', to: 'answer' },
      ] },
      clue: { line: 'child.pass.riddle.clue', go: [
        { ap: 'warm', say: 'child.pass.riddle.right', label: 'Guess it now', to: 'right' },
        { ap: 'jest', say: 'Is it... a turnip?', to: 'turnip' },
      ] },
      turnip: { line: 'child.pass.riddle.turnip', go: [{ ap: 'warm', say: 'I give up. Tell me.', to: 'answer' }] },
      answer: { line: 'child.pass.riddle.answer', fx: { fond: 0.02 }, go: [
        { ap: 'jest', say: 'Well! That\'s cleverer than any riddle of mine.', to: 'end' },
        { ap: 'tale', say: 'I once won my life with a riddle, you know. Or near enough.', to: 'life' },
      ] },
      right: { line: 'child.pass.riddle.yes', fx: { respect: 0.02 }, go: [
        { ap: 'jest', say: 'Wizards know everything. It\'s very tiresome.', to: 'end' },
        { ap: 'warm', say: 'It was a good one, though. I nearly didn\'t get it.', to: 'end', fx: { fond: 0.02 } },
      ] },
      life: { line: 'child.pass.riddle.life', fx: { fond: 0.02, lean: 'rift' }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('child.pass.riddle.open', [
    { text: ['A riddle game, {name}? You first.', 'I\'m told you know a riddle or two, {name}. Try me.', 'Riddle me something, {name}. I\'m feeling clever.'] },
  ]);
  lines('child.pass.riddle.ask', [
    { text: ['All right. What\'s small and white and round and goes in a cup at breakfast?'] },
    { if: { childRiddle: 'egg' }, pri: 5, text: ['All right. What\'s got a yellow heart and a white coat and no door to get out?', 'Riddle: a little white house with no windows and no door, and gold inside.'] },
    { if: { childRiddle: 'teapot' }, pri: 5, text: ['What has one ear and one nose and a tummy full of hot?', 'What sings when it\'s hot and pours when it\'s tipped?'] },
    { if: { childRiddle: 'mushroom' }, pri: 5, text: ['What wears a hat but has no head, and pops up in the night from its bed?', 'What\'s got a cap and a stalk and lives in the dark and comes up after rain?'] },
    { if: { childRiddle: 'shadow' }, pri: 5, text: ['What follows you all day and runs away at night?', 'What\'s always behind you when you face the sun?'] },
    { if: { childRiddle: 'echo' }, pri: 5, text: ['What answers you back but never asks anything?', 'What lives in the well and only says what you say?'] },
    { if: { childRiddle: 'river' }, pri: 5, text: ['What runs all day and never gets tired, and has a mouth but never eats?', 'What\'s got a bed but never sleeps, and a mouth but never talks?'] },
    { if: { childRiddle: 'hole' }, pri: 5, text: ['What gets bigger the more you take away from it?', 'What can you dig but never fill with nothing?'] },
    { if: { childRiddle: 'candle' }, pri: 5, text: ['What gets shorter the longer it lives?', 'What has a hot head and cries wax tears?'] },
  ]);
  lines('child.pass.riddle.wrong', [
    { text: ['Is it... a dragon?', 'A badger? It\'s always a badger.', 'Is it my hat? It feels like my hat.'] },
  ]);
  lines('child.pass.riddle.right', [
    { text: ['Hmm. An egg, perhaps?'] },
    { if: { childRiddle: 'egg' }, pri: 5, text: ['Hmm. Is it an egg?', 'An egg, I think. A boiled one.'] },
    { if: { childRiddle: 'teapot' }, pri: 5, text: ['A teapot! I\'d know one anywhere.', 'Is it a teapot?'] },
    { if: { childRiddle: 'mushroom' }, pri: 5, text: ['A mushroom, surely.', 'Is it a mushroom? A hobbit would know.'] },
    { if: { childRiddle: 'shadow' }, pri: 5, text: ['Your shadow.', 'Is it a shadow?'] },
    { if: { childRiddle: 'echo' }, pri: 5, text: ['An echo.', 'Is it an echo? ...echo?'] },
    { if: { childRiddle: 'river' }, pri: 5, text: ['A river.', 'Is it the river?'] },
    { if: { childRiddle: 'hole' }, pri: 5, text: ['A hole!', 'A hole, I should think. Ask any hobbit.'] },
    { if: { childRiddle: 'candle' }, pri: 5, text: ['A candle.', 'Is it a candle?'] },
  ]);
  lines('child.pass.riddle.no', [
    { text: ['NO! Ha! Wrong!', 'Not even close. Not even a bit close.', 'A WHAT? No!'] },
    { if: { childTemper: 'cheerful' }, text: ['Hee hee! Wrong! You\'re terrible at this!'] },
    { if: { childTemper: 'ornery' }, text: ['Wrong. Obviously. Try harder.'] },
  ]);
  lines('child.pass.riddle.clue', [
    { text: ['It\'s something in your kitchen. Probably.'] },
    { if: { childRiddle: 'egg' }, pri: 5, text: ['The hens make them.', 'You have it at breakfast. Dippy.'] },
    { if: { childRiddle: 'teapot' }, pri: 5, text: ['Gran\'s got one with a crack in.', 'You\'d die without it. A hobbit would.'] },
    { if: { childRiddle: 'mushroom' }, pri: 5, text: ['There\'s a field of them past the mill. We\'re not allowed.', 'You find them in the woods. Some of them kill you.'] },
    { if: { childRiddle: 'shadow' }, pri: 5, text: ['You\'ve got one. It\'s right there. On the ground.', 'It\'s long in the evening and short at dinner.'] },
    { if: { childRiddle: 'echo' }, pri: 5, text: ['Shout in the well. Go on.', 'It\'s in the quarry too. HELLO-ello-lo.'] },
    { if: { childRiddle: 'river' }, pri: 5, text: ['The mill uses it. And the ducks.', 'You can paddle in it. Or fall in it.'] },
    { if: { childRiddle: 'hole' }, pri: 5, text: ['You LIVE in one. Well, a nice one.', 'Rabbits make them.'] },
    { if: { childRiddle: 'candle' }, pri: 5, text: ['You take it to bed. Not IN bed.', 'It\'s got a wick.'] },
  ]);
  lines('child.pass.riddle.turnip', [
    { text: ['A TURNIP? No! Why would it be a turnip?', 'It\'s never a turnip. Nothing\'s ever a turnip.', 'Ha! Turnip! You\'re hopeless!'] },
  ]);
  lines('child.pass.riddle.answer', [
    { text: ['An egg! Obviously!'] },
    { if: { childRiddle: 'egg' }, pri: 5, text: ['An EGG! Yellow heart, see? Obviously.'] },
    { if: { childRiddle: 'teapot' }, pri: 5, text: ['A TEAPOT! The spout\'s a nose! Get it?'] },
    { if: { childRiddle: 'mushroom' }, pri: 5, text: ['A MUSHROOM! It\'s got a hat and no head!'] },
    { if: { childRiddle: 'shadow' }, pri: 5, text: ['Your SHADOW! It runs off at night because it\'s scared of the dark. Ha!'] },
    { if: { childRiddle: 'echo' }, pri: 5, text: ['An ECHO! In the well! It only copies!'] },
    { if: { childRiddle: 'river' }, pri: 5, text: ['A RIVER! Its mouth\'s at the end! Where it goes in the bigger river!'] },
    { if: { childRiddle: 'hole' }, pri: 5, text: ['A HOLE! The more you dig the bigger it gets!'] },
    { if: { childRiddle: 'candle' }, pri: 5, text: ['A CANDLE! It gets shorter! Because it burns!'] },
  ]);
  lines('child.pass.riddle.yes', [
    { text: ['How did you KNOW?', 'Ugh! You got it! That\'s my best one!', 'You must have heard it before. You cheated.'] },
    { if: { childTemper: 'ornery' }, text: ['Lucky guess.'] },
    { if: { childTemper: 'cheerful' }, text: ['YES! You\'re good! Now I\'ll do a harder one!'] },
  ]);
  lines('child.pass.riddle.life', [
    { text: ['Your LIFE? With a riddle? Who with?', 'You did NOT. ...Did you? What was the riddle?', 'I\'d have won. I\'m good at riddles.'] },
  ]);

  // =====================================================================================
  // A bored child, read as a situation
  // =====================================================================================
  addSituation('child.bored', {
    pri: 2, read: (F) => F.stage === 'child' && F.band !== 'toddler' && !F.childTween && F.bored && F.mood !== 'miserable', thread: 'child.sit.bored',
    aps: {
      jest: { base: 1, out: ['eyeroll', 'grin', 'giggle'] },
      tale: { base: 1, out: ['meh', 'listen', 'rapt'] },
      advise: { base: 0, out: ['sulk', 'shrug', 'off'] },
      ask: { base: 1, out: ['nothing', 'moan', 'idea'] },
      warm: { base: 1, out: ['meh', 'lean', 'idea'] },
    },
  });
  lines('sit.child.bored.jest', [{ text: ['Bored? In Thistledown? Have you tried counting the sheep? Both of them?'] }]);
  lines('sit.child.bored.tale', [{ text: ['Bored? Let me tell you about the most boring day of my life. It ended with a dragon.'] }]);
  lines('sit.child.bored.advise', [{ text: ['Only boring folk get bored, {name}. Go and find something to do.'] }]);
  lines('sit.child.bored.ask', [{ text: ['What would you be doing, {name}, if you could do anything?'] }]);
  lines('sit.child.bored.warm', [{ text: ['Come and sit with me a minute, {name}. Boredom shared is boredom halved.'] }]);
  addThread({
    id: 'child.sit.bored', situation: true, label: 'Bored stiff',
    beats: {
      eyeroll: { line: 'child.sit.bored.eyeroll', end: true },
      grin: { line: 'child.sit.bored.grin', fx: { open: 1 }, go: [
        { ap: 'jest', say: 'A race to the gate, then. Loser carries my hat.', to: 'race' },
        { ap: 'ask', say: 'Well, what\'s the best game when there\'s nothing to do?', to: 'idea' },
      ] },
      giggle: { line: 'child.sit.bored.giggle', fx: { open: 2, fond: 0.02 }, go: [
        { ap: 'jest', say: 'A race to the gate, then. Loser carries my hat.', to: 'race' },
        { ap: 'tale', say: 'Then let me tell you about the most boring day of my life. It ended with a dragon.', to: 'rapt' },
      ] },
      meh: { line: 'child.sit.bored.meh', end: true },
      listen: { line: 'child.sit.bored.listen', fx: { drive: { bored: -0.15 } }, go: [
        { ap: 'tale', say: 'And then the dragon sneezed.', to: 'rapt' },
        { ap: 'ask', say: 'What would you have done, in my boots?', to: 'idea' },
      ] },
      rapt: { line: 'child.sit.bored.rapt', fx: { drive: { bored: -0.35 }, fond: 0.03, lean: 'rift' }, end: true },
      sulk: { line: 'child.sit.bored.sulk', fx: { fond: -0.02 }, end: true },
      shrug: { line: 'child.sit.bored.shrug', end: true },
      off: { line: 'child.sit.bored.off', fx: { queue: 'play', respect: 0.02 }, end: true },
      nothing: { line: 'child.sit.bored.nothing', end: true },
      moan: { line: 'child.sit.bored.moan', fx: { open: 1 }, go: [
        { ap: 'advise', say: 'Then go and see what\'s new at the story circle.', to: 'school', fx: { lean: 'hill' } },
        { ap: 'jest', say: 'A race to the gate, then. Loser carries my hat.', to: 'race' },
      ] },
      idea: { line: 'child.sit.bored.idea', fx: { drive: { bored: -0.2 }, respect: 0.02 }, go: [
        { ap: 'warm', say: 'Then go and do it. Before the day\'s gone.', to: 'off' },
        { ap: 'jest', say: 'Take me with you. I\'m bored too.', to: 'race' },
      ] },
      lean: { line: 'child.sit.bored.lean', fx: { drive: { lonely: -0.15, bored: -0.1 }, trust: 0.03 }, go: [
        { ap: 'ask', say: 'Better? What shall we do about it?', to: 'idea' },
        { ap: 'tale', say: 'Shall I tell you about the most boring day of my life? It ended with a dragon.', to: 'rapt' },
      ] },
      race: { line: 'child.sit.bored.race', fx: { queue: 'play', drive: { bored: -0.4 }, fond: 0.04, joke: { k: 'child.race', t: 'The wizard lost a race to the gate and had to carry his own hat.' } }, end: true },
      school: { line: 'child.sit.bored.school', fx: { queue: 'school' }, end: true },
    },
  });
  lines('child.sit.bored.eyeroll', [{ text: ['*rolls eyes so hard {they} nearly fall over*', 'That\'s not funny. Nothing\'s funny. Everything\'s boring.', 'Ha. Ha. Ha.'] }, { if: { band: 'youth' }, text: ['Very droll, wizard.'] }]);
  lines('child.sit.bored.grin', [{ text: ['...There\'s three sheep, actually.', '*tries not to grin, and grins*', 'Ha! The black one\'s called Dennis.'] }]);
  lines('child.sit.bored.giggle', [{ text: ['Ha! Both of them! There\'s THREE!', '*giggles despite {them}self*', 'You\'re silly. You\'re a silly wizard.'] }]);
  lines('child.sit.bored.meh', [{ text: ['Mm.', 'If you like.', '*kicks a stone*'] }, { if: { band: 'youth' }, text: ['Right. Thanks.', 'Sure.'] }]);
  lines('child.sit.bored.listen', [{ text: ['...A dragon? Go on.', '*stops kicking the stone*', 'Boring days don\'t end with dragons.'] }]);
  lines('child.sit.bored.rapt', [{ text: ['And THEN what? You can\'t stop there!', '*hasn\'t blinked for some time*', 'That\'s not a boring day! That\'s the opposite of a boring day!'] }, { if: { band: 'youth' }, text: ['...All right, that\'s actually good. Go on.'] }]);
  lines('child.sit.bored.sulk', [{ text: ['I\'m NOT boring. YOU\'RE boring.', 'That\'s what grown-ups always say.', '*turns {their} back on you*'] }]);
  lines('child.sit.bored.shrug', [{ text: ['There isn\'t anything. That\'s the whole problem.', 'Like what?', '*shrugs one shoulder*'] }]);
  lines('child.sit.bored.off', [{ text: ['...Fine. I\'ll find something. And it\'ll be BRILLIANT.', 'All right! I\'m going! I\'m finding!', 'Hmph. I\'ll show you.'] }]);
  lines('child.sit.bored.nothing', [{ text: ['Nothing. I don\'t know. Nothing.', 'If I knew I\'d be doing it.', 'Being somewhere else.'] }]);
  lines('child.sit.bored.moan', [{ text: ['Everyone\'s busy. The little ones are napping. The big ones are working. There\'s just me.', 'There\'s nothing to DO. I\'ve done everything. Twice.'] }, { if: { season: 'winter' }, text: ['It\'s too cold for anything and the snow\'s gone slushy.'] }, { if: { weather: 'rain' }, text: ['It\'s RAINING. It\'s been raining for a hundred years.'] }]);
  lines('child.sit.bored.idea', [{ text: ['I\'d build a raft. And go down the river. All the way.', 'I\'d find out what\'s at the top of the big hill. Nobody goes.', 'I\'d make a kite. A big one. Big enough to lift the cat.'] }, { if: { childRiftOpen: true }, text: ['I\'d go and look at the rift. Close. Really close.'] }, { if: { pastimeWord: has }, text: ['I\'d do my {pastimeWord}. I\'ve got an idea for a new one.'] }]);
  lines('child.sit.bored.lean', [{ text: ['*sits and leans on you, heavy as a sack*', '...All right. Just for a minute.', '*sighs the longest sigh in the Shire*'] }]);
  lines('child.sit.bored.race', [{ text: ['GO! *already running* You\'re carrying your hat!', 'You\'re ON! Three, two, GO!', 'I won! I won! Carry your hat!'] }]);
  lines('child.sit.bored.school', [{ text: ['...There might be a new story. All right.', 'Fine. But if it\'s the pig one again I\'m leaving.'] }]);
  // =====================================================================================
  // More ways to say it: tempers, ages and the older youths
  // =====================================================================================
  lines('child.story.asleep', [
    { if: { childTemper: 'shy' }, text: ['...I did. Just for a moment. On somebody\'s shoulder.'] },
    { if: { childTemper: 'ornery' }, text: ['Not me. I stay awake to catch them getting the story wrong.'] },
    { if: { band: 'young' }, text: ['ME! I fell asleep in the leaves! Somebody carried me home!'] },
    { if: { band: 'youth' }, text: ['The little ones. I had to carry two of them home. One dribbled.'] },
  ]);
  lines('child.story.best', [
    { if: { childTemper: 'cheerful' }, text: ['The one where they have a party at the end! All the best ones have a party!'] },
    { if: { childTemper: 'ornery' }, text: ['The trolls. Because they\'re stupid and they lose. Serves them right.'] },
    { if: { childTemper: 'gloomy' }, text: ['The sad ones. I like it when the story knows how I feel.'] },
    { if: { band: 'youth' }, text: ['The Bullroarer. Not for the goblin. For being too big and doing it anyway.'] },
  ]);
  lines('child.story.why', [
    { if: { childTemper: 'shy' }, text: ['Because the quiet one turns out to be the one who saves everyone.'] },
    { if: { childTemper: 'cheerful' }, text: ['Because it makes me laugh every time! Even when I know what\'s coming!'] },
    { if: { childTemper: 'ornery' }, text: ['Because nobody tells the hero what to do.'] },
    { if: { band: 'youth' }, text: ['Because when I was small it made me feel brave. It still does, a bit.'] },
  ]);
  lines('child.story.there', [
    { if: { childTemper: 'curious' }, text: ['You were there? Then you know the bits they leave out! Tell me the bits they leave out!'] },
    { if: { childTemper: 'shy' }, text: ['...Were you? Was it frightening?'] },
  ]);
  lines('child.story.wiztale', [
    { if: { childTemper: 'curious' }, text: ['A new one? One nobody\'s heard? Not even the storyteller?'] },
    { if: { childTemper: 'cheerful' }, text: ['YES! Everyone! The wizard\'s telling one! Oh. There\'s only me. Go on anyway!'] },
    { if: { childTemper: 'ornery' }, text: ['If it\'s got a moral I\'m not listening. ...Go on.'] },
  ]);
  lines('child.story.world', [
    { if: { childTemper: 'shy' }, text: ['...I\'d like to see it. From a hill. A safe hill.'] },
    { if: { childTemper: 'cheerful' }, text: ['I\'m going to paddle in it! In the Sea! Up to my knees!'] },
    { if: { band: 'youth' }, text: ['I\'m going to see it. I\'ve decided. Don\'t tell anyone yet.'] },
  ]);
  lines('child.story.home', [
    { if: { childTemper: 'shy' }, text: ['...That\'s my favorite kind. Thank you.'] },
    { if: { childTemper: 'gloomy' }, text: ['I\'m glad he got home. Not everyone does, in stories.'] },
    { if: { band: 'youth' }, text: ['Bit soppy. ...I liked it.'] },
  ]);

  lines('child.letters.hard', [
    { if: { childTemper: 'shy' }, text: ['The ones you have to say out loud. I know them in my head.'] },
    { if: { childTemper: 'curious' }, text: ['The silent ones. Why have letters that don\'t say anything? What are they FOR?'] },
    { if: { childTemper: 'gloomy' }, text: ['All of them. I\'m no good at it.'] },
  ]);
  lines('child.letters.doors', [
    { if: { childTemper: 'shy' }, text: ['...Doors I could go through without anyone seeing. Books are like that.'] },
    { if: { childTemper: 'gloomy' }, text: ['Not for me. I can\'t even open the first one.'] },
  ]);
  lines('child.letters.sums', [
    { if: { childTemper: 'curious' }, text: ['I counted the stars. I got to two hundred and then there were more. How many are there?'] },
    { if: { childTemper: 'shy' }, text: ['I\'m good at sums. Nobody knows. I do them in my head at supper.'] },
    { if: { riftWays: true }, text: ['I can do sums with ones and zeros. The rift-folk taught me. It\'s faster. And weirder.'] },
  ]);
  lines('child.letters.apples', [
    { if: { childTemper: 'ornery' }, text: ['None. Because they\'re MY apples and you\'re not having any.'] },
    { if: { register: 'bright' }, text: ['Four. Though if they were my apples I\'d have seven and you\'d have a talking-to.'] },
  ]);
  lines('child.letters.letter', [
    { if: { childTemper: 'cheerful' }, text: ['A LETTER! I\'d read it out to everyone! At the Badger! Standing on a table!'] },
    { if: { childTemper: 'gloomy' }, text: ['Who would write to me?'] },
  ]);

  lines('child.treasure.start', [
    { if: { childTween: true }, pri: 1, text: ['Pockets? I\'m nearly grown. ...A pocket-knife, a ribbon, and the conker I\'ve had since I was six.', 'Nothing much. Keys. A letter I keep meaning to send. A lucky stone. Don\'t laugh.'] },
    { if: { childTemper: 'curious' }, text: ['Things I\'m working out. A stone with a hole in. A shell from nowhere near the sea. How?'] },
    { if: { childTemper: 'ornery' }, text: ['My pockets are my business. ...Fine. String. And a frog. Dead. Don\'t ask.'] },
    { if: { childTemper: 'cheerful' }, text: ['EVERYTHING! Look! *turns out both pockets onto the lane at once*'] },
  ]);
  lines('child.treasure.best', [
    { if: { childTween: true }, pri: 1, text: ['The conker. It\'s been in this pocket twenty years. It\'s more of a pebble now. It\'s lucky.'] },
    { if: { childTemper: 'shy' }, text: ['...This feather. I found it the day we moved here.'] },
    { if: { childTemper: 'cheerful' }, text: ['ALL of them! But this one! No, this one!'] },
  ]);
  lines('child.treasure.see', [
    { if: { childTween: true }, pri: 1, text: ['*sets out a stone worn smooth, a ribbon gone gray, and a key to nothing*'] },
    { if: { childTemper: 'shy' }, text: ['*opens one hand: a single blue bead*'] },
  ]);
  lines('child.treasure.hoard', [
    { if: { childTween: true }, pri: 1, text: ['...There\'s a box. Under the floor of the old shed. Everything since I was small. Don\'t you dare.'] },
    { if: { childTemper: 'cheerful' }, text: ['...In the party tree! In a hole! Above the swing! It\'s brilliant!'] },
  ]);
  lines('child.treasure.trade', [
    { if: { childTemper: 'cheerful' }, text: ['A wizard button! Yes! Deal! No take-backs!'] },
    { if: { childTemper: 'shy' }, text: ['...You\'d give me a button? Off your own coat?'] },
  ]);

  lines('child.secret.start', [
    { if: { childTween: true }, pri: 1, text: ['Can I tell you something? I can\'t tell anyone here. You\'ll be gone in a week.', 'I need to say something out loud. To someone who won\'t make it a thing.'] },
    { if: { childTemper: 'curious' }, text: ['Do wizards keep secrets in their hats? Can you fit one more?'] },
    { if: { childTemper: 'ornery' }, text: ['If you tell anyone, I\'ll know it was you. There\'s only you.'] },
  ]);
  lines('child.secret.tell', [
    { if: { childTween: true }, pri: 1, text: ['I\'ve been saving. Every penny. For the road. Nobody knows.', 'I\'m not sure I want what everyone thinks I want. A hole, a trade, the lot. Not yet.'] },
    { if: { childTween: true, childCrush: has }, pri: 1, text: ['It\'s {childCrush}. I think about {childCrush} far too much. There. Said it.'] },
    { if: { childTemper: 'cheerful' }, text: ['I\'m making everyone a present for Yule! From conkers! Shh!'] },
    { if: { childTemper: 'ornery' }, text: ['I let the pigs out. Last Mersday. Everybody blamed the wind.'] },
  ]);
  lines('child.secret.safe', [
    { if: { childTween: true }, pri: 1, text: ['Thanks. It feels lighter, said.', 'Good. I\'d have hated to have to go to Bree after all.'] },
    { if: { childTemper: 'shy' }, text: ['*a tiny nod, and the first proper smile*'] },
  ]);
  lines('child.secret.grown', [
    { if: { childTemper: 'shy' }, text: ['...A grown-up. Maybe the storyteller. They\'re kind.'] },
    { if: { childTemper: 'ornery' }, text: ['Grown-ups only make things worse. ...Fine. A nice one.'] },
  ]);

  lines('child.magic.what', [
    { if: { childTemper: 'cheerful' }, text: ['Make every pudding bigger! Double! No, triple!', 'Give everyone a dragon! A small one each!'] },
    { if: { childTemper: 'ornery' }, text: ['Make everyone do what I say.', 'Make it so nobody can tell me off ever again.'] },
    { if: { band: 'young' }, text: ['Turn into a cat! And sleep in the sun ALL DAY!'] },
    { if: { band: 'school' }, text: ['Know everything. Every book, all at once. Without the reading.'] },
    { if: { band: 'youth' }, text: ['Go anywhere. Just blink and be there. And back for supper.'] },
  ]);
  lines('child.magic.spark', [
    { if: { childTemper: 'shy' }, text: ['*gasps, and then claps both hands over {their} mouth*'] },
    { if: { childTemper: 'cheerful' }, text: ['AGAIN! Bigger! Make it purple!'] },
    { if: { band: 'youth' }, text: ['...Huh. All right. That was actually magic.'] },
  ]);
  lines('child.magic.patience', [
    { if: { childTemper: 'shy' }, text: ['...I\'m good at waiting. Does that mean I could do magic?'] },
    { if: { childTemper: 'cheerful' }, text: ['Patience! I\'m AWFUL at patience! Is there another kind?'] },
  ]);
  lines('child.magic.garden', [
    { if: { childTemper: 'curious' }, text: ['A garden IS a bit magic. A seed\'s tiny and a cabbage is HUGE. Where does it come from?'] },
  ]);
  lines('child.magic.kind', [
    { if: { childTemper: 'shy' }, text: ['...I think I\'ve got the kind hand. Maybe.'] },
    { if: { childTemper: 'ornery' }, text: ['That\'s a lot of words for "no".'] },
  ]);

  lines('child.pass.riddle.no', [
    { if: { childTemper: 'shy' }, text: ['...No. But that\'s a good guess.', '*shakes head, smiling*'] },
    { if: { childTemper: 'curious' }, text: ['No! But why did you think that? I want to know how wizards think.'] },
    { if: { band: 'youth' }, text: ['Wrong. You\'re slipping, wizard.'] },
  ]);
  lines('child.pass.riddle.yes', [
    { if: { childTemper: 'shy' }, text: ['...You got it. Nobody ever gets it.'] },
    { if: { childTemper: 'curious' }, text: ['How? Did you work it out or did you just know? Tell me how you worked it out.'] },
    { if: { band: 'youth' }, text: ['Fine. You\'re good. I\'ve got harder ones.'] },
  ]);
  lines('child.pass.riddle.turnip', [
    { if: { childTemper: 'cheerful' }, text: ['A TURNIP! Ha! Hahaha! It\'s not a turnip! Nothing\'s a turnip!'] },
    { if: { childTemper: 'ornery' }, text: ['You\'re not even trying.'] },
  ]);

  lines('child.sit.bored.moan', [
    { if: { childTemper: 'gloomy' }, text: ['Every day\'s the same. Get up, eat, nothing, eat, bed. Forever.'] },
    { if: { childTemper: 'curious' }, text: ['I\'ve found out everything there is to find out round here. Everything. I checked twice.'] },
    { if: { band: 'youth' }, text: ['Nothing ever happens in Thistledown. Nothing. Except the sky tearing. And that\'s old now.'] },
  ]);
  lines('child.sit.bored.rapt', [
    { if: { childTemper: 'curious' }, text: ['Why did it sneeze? Do dragons get colds? Do they get hay fever? Wait, tell me the rest first.'] },
    { if: { childTemper: 'shy' }, text: ['*has crept closer and closer and is now sitting on your boot*'] },
  ]);
  lines('child.sit.bored.idea', [
    { if: { childTemper: 'shy' }, text: ['...I\'d draw the mill. From the far bank. Where nobody goes.'] },
    { if: { childTemper: 'cheerful' }, text: ['A PARADE! Down the lane! With pans for drums!'] },
    { if: { band: 'youth' }, text: ['I\'d walk to the top of the ridge and see how far I can see. Further than here, anyway.'] },
  ]);
  lines('child.sit.bored.race', [
    { if: { childTemper: 'shy' }, text: ['*wins by a nose, and looks astonished about it*'] },
    { if: { band: 'youth' }, text: ['I won. Obviously. You\'re carrying your hat. Ha.'] },
  ]);
  lines('child.sit.bored.eyeroll', [
    { if: { childTemper: 'ornery' }, text: ['Two sheep. Very funny. Go away.'] },
  ]);
  lines('child.sit.bored.sulk', [
    { if: { band: 'youth' }, text: ['Thank you, wizard. Very wise. Very helpful.'] },
  ]);
  // =====================================================================================
  // The best day of the year (and the next one coming)
  // =====================================================================================
  addFacts((v, F) => {
    let next = null;
    try { next = v.isChild() && typeof upcomingOccasions === 'function' ? upcomingOccasions(1)[0] || null : null; } catch (e) { next = null; }
    const soon = next && next[0] - Game.day <= 3 ? next : null;
    F.childFest = soon ? soon[1] : null;
    F.childFestLabel = soon && PARTY_KINDS[soon[1]] ? PARTY_KINDS[soon[1]].label : null;
    F.childFestToday = !!(soon && soon[0] === Game.day);
  });
  addThread({
    id: 'child.fest', label: (F) => (F.childFestLabel ? `${F.childFestLabel} soon!` : 'What\'s the best day of the year?'), weight: 1.1, cool: 4,
    when: (F) => talker(F) && !F.childTween,
    rel: (F) => (F.childFest || F.party ? 2 : 0.8),
    open: { ask: 'child.fest.open' },
    beats: {
      start: { line: 'child.fest.start', go: [
        { ap: 'ask', say: 'And what\'s the very best part of it?', to: 'part' },
        { ap: 'jest', say: 'I suppose I\'ll have to bring a firework or two.', to: 'fireworks' },
        { ap: 'tale', say: 'In the old days, they did it differently. Shall I tell you how?', to: 'olddays' },
      ] },
      part: { line: 'child.fest.part', go: [
        { ap: 'warm', say: 'Then I hope it\'s the best one yet.', to: 'end' },
        { ap: 'ask', say: 'And what will you wish for, this time?', to: 'wish', need: { open: 1 }, soft: true },
      ] },
      wish: { line: 'child.fest.wish', fx: { confide: { k: 'child.fest.wish', t: 'what {they}\'ll wish for at the next festival', secret: true } }, go: [
        { ap: 'warm', say: 'I hope it comes true.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'jest', say: 'You\'re not supposed to tell! Now it won\'t count.', to: 'count' },
      ] },
      count: { line: 'child.fest.count', fx: { joke: { k: 'child.fest.count', t: 'Wishes told to a wizard still count. Probably.' } }, end: true },
      fireworks: { line: 'child.fest.fireworks', go: [
        { ap: 'warm', say: 'For you, the dragon. I promise.', to: 'promise', fx: { promise: { k: 'child.dragon', t: 'You promised {name} the firework dragon at the next party', days: 6 }, fond: 0.04 } },
        { ap: 'jest', say: 'Or perhaps just a small sparkler. A very small one.', to: 'sparkler' },
      ] },
      promise: { line: 'child.fest.promise', fx: { news: 'Little {name} says the wizard has promised the firework dragon at the next party.' }, end: true },
      sparkler: { line: 'child.fest.sparkler', end: true },
      olddays: { line: 'child.fest.olddays', go: [
        { ap: 'tale', say: 'The Old Took once lit a bonfire so big the Bree folk thought the Shire was on fire.', to: 'took', fx: { lean: 'hill' } },
        { ap: 'tale', say: 'Far away, past the rifts, they have a festival of lights every night. Every single night.', to: 'lights', need: { if: { childRiftStage: { min: 2 } } }, fx: { lean: 'rift' } },
      ] },
      took: { line: 'child.fest.took', fx: { fond: 0.03 }, end: true },
      lights: { line: 'child.fest.lights', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.fest.open', [
    { text: ['What\'s the best day of the year, {name}?', 'If you could have one day of the year twice, {name}, which would it be?'] },
    { if: { childFestLabel: has }, text: ['{ChildFestLabel} soon, {name}! Are you ready?', 'Not long till {childFestLabel}, {name}. Excited?'] },
    { if: { childFestToday: true, childFestLabel: has }, pri: 1, text: ['It\'s {childFestLabel} today, {name}! What are you most looking forward to?'] },
    { if: { party: true }, text: ['There\'s a party on, {name}! Aren\'t you going?'] },
  ]);
  lines('child.fest.start', [
    { text: ['Yule! Because of the bonfire. And the presents. And the bonfire.', 'My birthday. Obviously. I get to give everyone presents and they all say thank you.', 'Midsummer. The fireworks go on for AGES.'] },
    { if: { childFest: 'yule' }, text: ['YULE! The bonfire\'s going to be massive this year. I\'ve been collecting sticks.', 'Yule\'s coming! There\'ll be carols! I know all the words. Some of the words.'] },
    { if: { childFest: 'lantern' }, text: ['Lantern Night! I\'m making mine with a moon on it. And a frog. A moon frog.', 'Lantern Night! You make a wish and let it go and it goes up and up and UP.'] },
    { if: { childFest: 'mayday' }, text: ['Mayday! I\'m going to do the maypole and NOT get tangled this year.', 'Mayday! I want to be King of the May. Or Queen. Whichever has the better crown.'] },
    { if: { childFest: 'midsummer' }, text: ['Midsummer! The bonfire! The fireworks! Staying up till it gets dark, which is NEVER!'] },
    { if: { childFest: 'harvest' }, text: ['The Harvest Feast! Pie. Pie and more pie. And the long tables, with cloths on.'] },
    { if: { childFest: 'founding' }, text: ['Founders\' Day! We get the whole day off! Even the grown-ups!'] },
    { if: { party: true }, pri: 1, text: ['It\'s a PARTY! Right now! Why are we standing here?', 'There\'s a party! I\'ve had three cakes. Don\'t tell anyone. Four.'] },
    { if: { childTemper: 'shy' }, text: ['...Lantern Night. It\'s quiet, and everyone looks up, and nobody looks at me.'] },
    { if: { childTemper: 'gloomy' }, text: ['None of them. They\'re always over too soon.'] },
    { if: { childTemper: 'curious' }, text: ['Whichever one I haven\'t been to yet. I want a new one. Can we have a new one?'] },
    { if: { band: 'youth' }, text: ['The Highday dances. Not that I dance. I watch. Mostly.'] },
    { if: { rift: true }, text: ['Any of them! Back home we didn\'t have days off. The city never stopped.'] },
  ]);
  lines('child.fest.part', [
    { text: ['The food. All the food. And staying up.', 'When everyone sings and the grown-ups go silly.', 'The bit right at the end when everyone\'s tired and happy and nobody wants to go home.'] },
    { if: { childFest: 'lantern' }, text: ['Letting go. You hold it and hold it and then you let go and it\'s gone. It\'s the best and the saddest.'] },
    { if: { childFest: 'yule' }, text: ['When the bonfire\'s so hot your front\'s cooking and your back\'s freezing.'] },
    { if: { childFest: 'mayday' }, text: ['The ribbons! Over, under, round! And then everyone falls over!'] },
    { if: { childTemper: 'cheerful' }, text: ['ALL of it! Every single bit! Especially the pudding bit!'] },
    { if: { childTemper: 'shy' }, text: ['...Sitting on the wall and watching. Everyone looks so happy.'] },
    { if: { childShow: true }, text: ['Your fireworks! The dragon! I dreamed about the dragon!'] },
  ]);
  lines('child.fest.wish', [
    { text: ['...A pony. A small one. Just to visit.', '...That everyone stays. Nobody goes away. Not ever.', '...That I\'m good at something. Really good. Better than everyone.'] },
    { if: { childTemper: 'curious' }, text: ['...To find out what\'s on the other side of everything.'] },
    { if: { childTemper: 'gloomy' }, text: ['...A friend. A proper one. That picks me first.'] },
    { if: { rift: true }, text: ['...To send a lantern all the way home. Through the sky.'] },
    { if: { childSib: has }, text: ['...That {childSib} gets a nice present. Don\'t you dare tell {childSib}.'] },
  ]);
  lines('child.fest.count', [
    { text: ['It still counts! Doesn\'t it? Tell me it still counts!', 'You tricked me!', 'Then you\'ll have to make it come true yourself. That\'s the rule now.'] },
  ]);
  lines('child.fest.fireworks', [
    { text: ['THE DRAGON! Do the dragon!', 'A firework or two? Or ten. Ten\'s nicer.', 'Fireworks! Can I light one? I won\'t burn anything. Much.'] },
    { if: { childTemper: 'shy' }, text: ['...Could they be quiet ones? The bangs make me jump. I like the colors.'] },
    { if: { childTemper: 'ornery' }, text: ['Only two? You\'re a wizard. Bring a cartload.'] },
  ]);
  lines('child.fest.promise', [
    { text: ['THE DRAGON. For ME. I\'m telling everyone.', 'Promise promise? You said it. I heard it.', '*runs off shouting* THE WIZARD\'S DOING THE DRAGON!'] },
  ]);
  lines('child.fest.sparkler', [
    { text: ['A SMALL one? Boo!', 'A sparkler is still fire. I\'ll take it.', 'Hmph. A big sparkler.'] },
  ]);
  lines('child.fest.olddays', [
    { text: ['Differently how? Were there dragons?', 'The OLD days? How old? Older than Gran?', 'Tell me! Did they have cake in the old days?'] },
  ]);
  lines('child.fest.took', [
    { text: ['The whole SHIRE on fire? Ha! Did they come running?', 'I want a bonfire that big. Bigger.', 'The Old Took sounds brilliant. Why aren\'t grown-ups like that now?'] },
  ]);
  lines('child.fest.lights', [
    { text: ['Every NIGHT? That\'s too many festivals! ...Is it?', 'A festival every night? I\'d never sleep. I\'d never WANT to sleep.', 'Then nobody would know when it was special.'] },
  ]);

  // =====================================================================================
  // Helping at home (or at the trade)
  // =====================================================================================
  addThread({
    id: 'child.helping', label: (F) => (F.childParentJob ? `Helping with the ${F.childParentJob}'s work?` : 'Doing your chores?'), weight: 0.9, cool: 4,
    when: (F) => talker(F) && !F.childTween,
    open: { ask: 'child.helping.open' },
    beats: {
      start: { line: 'child.helping.start', go: [
        { ap: 'ask', say: 'And what\'s the worst job they give you?', to: 'worst' },
        { ap: 'warm', say: 'They\'re lucky to have you.', to: 'lucky' },
        { ap: 'jest', say: 'I hear you\'re the hardest-working hobbit in Thistledown. Or was it the laziest?', to: 'lazy' },
      ] },
      worst: { line: 'child.helping.worst', go: [
        { ap: 'advise', say: 'Do the worst job first. Then the day only gets better.', to: 'first', fx: { lean: 'hill' } },
        { ap: 'advise', say: 'Find a cleverer way to do it. That\'s how every good invention starts.', to: 'clever', fx: { lean: 'rift' } },
        { ap: 'jest', say: 'I\'ll swap you. You can be a wizard and I\'ll muck out the hens.', to: 'swap' },
      ] },
      first: { line: 'child.helping.first', fx: { respect: 0.02, remember: 'The wizard says do the worst job first.' }, end: true },
      clever: { line: 'child.helping.clever', fx: { respect: 0.02, remember: 'The wizard says find a cleverer way to do it.' }, end: true },
      swap: { line: 'child.helping.swap', fx: { fond: 0.03, joke: { k: 'child.helping.swap', t: 'The wizard offered to muck out the hens. He hasn\'t yet.' } }, end: true },
      lucky: { line: 'child.helping.lucky', fx: { fond: 0.02 }, end: true },
      lazy: { line: 'child.helping.lazy', go: [
        { ap: 'warm', say: 'The hardest-working, I\'m sure.', to: 'lucky' },
        { ap: 'ask', say: 'So what\'s the worst job they give you?', to: 'worst' },
      ] },
    },
    end: { fond: 0.02 },
  });
  lines('child.helping.open', [
    { text: ['Helping out at home, {name}?', 'Have you done your chores, {name}?', 'I hear you\'re a great help to your folk, {name}.'] },
    { if: { childParentJob: has }, text: ['Do you help with the {childParentJob}\'s work, {name}?'] },
  ]);
  lines('child.helping.start', [
    { text: ['I do the hens. And the water. And the drying-up. And I get no thanks.', 'Loads! I swept the step. Some of the step. The middle.', 'I help. When I\'m asked. And sometimes when I\'m not, and then I get told off.'] },
    { if: { childParentJob: 'baker' }, text: ['I knead! My arms are the strongest in the lane. Feel. FEEL.'] },
    { if: { childParentJob: 'farmer' }, text: ['I scare the crows. I\'m the best crow-scarer. I just shout.'] },
    { if: { childParentJob: 'miller' }, text: ['I sweep the flour. Then I\'m covered in flour. Then I get swept.'] },
    { if: { childParentJob: 'fisher' }, text: ['I dig the worms. Nobody else wants to. I don\'t mind worms.'] },
    { if: { childParentJob: 'herder' }, text: ['I count the sheep. They keep moving. I\'ve never got the same number twice.'] },
    { if: { childParentJob: 'innkeeper' }, text: ['I collect the mugs at the Badger. I hear EVERYTHING. I\'m not telling.'] },
    { if: { childParentJob: 'tinker' }, text: ['I sort the screws. Big ones, little ones, and ones that look like little ones but aren\'t.'] },
    { if: { childParentJob: 'brewer' }, text: ['I stir. I\'m not allowed to taste. I\'ve smelled. That\'s nearly tasting.'] },
    { if: { childParentJob: 'mailcarrier' }, text: ['I carry the letters to the near houses. I don\'t read them. I read the outsides.'] },
    { if: { childParentJob: 'storyteller' }, text: ['I hold the book and turn the pages. And I mouth along to the scary bits.'] },
    { if: { band: 'young' }, text: ['I help! I carry the little basket! It\'s got one egg in!'] },
    { if: { childTemper: 'ornery' }, text: ['I do enough. More than enough. More than anyone else in that house.'] },
    { if: { childTemper: 'shy' }, text: ['...I do the quiet jobs. Shelling peas. I like shelling peas.'] },
    { if: { childTemper: 'cheerful' }, text: ['Loads! I love helping! Mostly! When it\'s not the hens!'] },
  ]);
  lines('child.helping.worst', [
    { text: ['The hens. They peck. They PECK, wizard.', 'Emptying the you-know-what. Every morning.', 'Weeding. The weeds grow back. They grow back faster than I can pull them.'] },
    { if: { season: 'winter' }, text: ['Fetching the water when the pump\'s frozen. My fingers fall off. Nearly.'] },
    { if: { season: 'autumn' }, text: ['Picking up apples. The wasps get there first and they\'re CROSS.'] },
    { if: { childBaby: has }, text: ['Minding {childBaby}. It\'s not a job, it\'s a war.'] },
    { if: { childTemper: 'curious' }, text: ['Anything you do the same way every day. Why do it the same way every day?'] },
  ]);
  lines('child.helping.first', [
    { text: ['The hens first. Then everything else is easy. ...That\'s actually clever.', 'Worst first. All right. I\'ll try it tomorrow.', 'So the day starts horrible and gets nicer? Hm. Better than the other way.'] },
  ]);
  lines('child.helping.clever', [
    { text: ['A cleverer way! I could build a hen-feeder that feeds them on its own!', 'Invent something. Yes. I\'ve been wanting an excuse.', 'If I invent a weed-puller I\'ll name it after you.'] },
  ]);
  lines('child.helping.swap', [
    { text: ['DEAL! Shake on it! ...You\'re not going to, are you.', 'Ha! The hens would peck your hat!', 'You\'d hate it. And I\'d be brilliant at wizarding.'] },
  ]);
  lines('child.helping.lucky', [
    { text: ['Tell them that! They never say it.', 'You think so? ...I\'ll do the drying-up without moaning, then. Tonight. Maybe.', 'Lucky! Ha. I\'m going to say that next time I\'m told off.'] },
    { if: { childTemper: 'shy' }, text: ['*smiles at the ground*'] },
  ]);
  lines('child.helping.lazy', [
    { text: ['The HARDEST-working! Who said lazy? Was it a hen?', 'Laziest? I did the step! The middle of the step!', 'Both. Depends on the day.'] },
  ]);

  // =====================================================================================
  // Weather, to pass the time
  // =====================================================================================
  addThread({
    id: 'child.pass.weather', light: true, ap: 'warm', label: 'The weather, to a child', open: { warm: 'child.pass.weather.open' },
    when: (F) => talker(F) && !F.childTween,
    beats: {
      start: { line: 'child.pass.weather.start', go: [
        { ap: 'jest', say: 'child.pass.weather.w.jest', to: 'jest' },
        { ap: 'ask', say: 'And what\'s the best weather of all?', to: 'best' },
      ] },
      jest: { line: 'child.pass.weather.jest', fx: { fond: 0.02 }, end: true },
      best: { line: 'child.pass.weather.best', go: [
        { ap: 'tale', say: 'I once saw it snow upwards, on a mountain far away.', to: 'upwards', fx: { lean: 'rift' } },
        { ap: 'warm', say: 'Then I\'ll ask the sky for some, next time I see it.', to: 'end' },
      ] },
      upwards: { line: 'child.pass.weather.upwards', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('child.pass.weather.open', [
    { text: ['A fine day for being small, {name}.', 'What do you make of this weather, {name}?'] },
    { if: { weather: 'rain' }, text: ['Good puddles today, {name}. Have you tried them all?', 'Wet enough for you, {name}?'] },
    { if: { weather: 'snow' }, text: ['Snow, {name}! Have you made a snow-hobbit yet?'] },
    { if: { season: 'summer', weather: 'fair' }, text: ['A day for paddling, {name}, if ever I saw one.'] },
    { if: { season: 'autumn', weather: 'fair' }, text: ['A day for kicking leaves, {name}.'] },
  ]);
  lines('child.pass.weather.start', [
    { text: ['It\'s all right. It\'s weather.', 'I like it! I like all weather. Except the boring kind.', 'It\'s the best day! Well. It\'s a day.'] },
    { if: { weather: 'rain' }, text: ['I\'ve jumped in every puddle in the lane. Some twice. My boots are full.', 'Rain\'s the best! You can make rivers in the mud. Dams! Whole lakes!'] },
    { if: { weather: 'snow' }, text: ['I made a snow-hobbit! It\'s got a carrot nose and a pipe. It looks like Granddad.', 'SNOW! I\'ve eaten loads. Is that bad? It tastes of nothing.'] },
    { if: { season: 'summer', weather: 'fair' }, text: ['It\'s so hot! I\'ve been in the river all morning! I\'ve gone wrinkly!'] },
    { if: { season: 'autumn', weather: 'fair' }, text: ['I\'ve made a leaf pile as big as me! Then I jumped in it! Then I lost a boot!'] },
    { if: { season: 'spring', weather: 'fair' }, text: ['There are lambs! In the far field! They BOUNCE!'] },
    { if: { childTemper: 'gloomy' }, text: ['It\'s always too something. Too wet, too hot, too cold.'] },
    { if: { rift: true }, text: ['Back home the weather was the same every day. Warm and pink. This is much more exciting.'] },
  ]);
  lines('child.pass.weather.w.jest', [
    { text: ['I ordered it specially. Do you like it?', 'The sky asked me what you\'d like. I said this.'] },
    { if: { weather: 'rain' }, text: ['I ordered the rain especially. For your puddles.'] },
    { if: { weather: 'snow' }, text: ['I shook my beard out of the window this morning. Sorry.'] },
  ]);
  lines('child.pass.weather.jest', [
    { text: ['You did NOT. ...Did you?', 'Ha! Order sun next. And a rainbow.', 'If you can order weather, order snow for my birthday.'] },
    { if: { weather: 'snow' }, text: ['Your BEARD? The snow\'s your beard? Ha! Eurgh!'] },
  ]);
  lines('child.pass.weather.best', [
    { text: ['Thunder! When it\'s far away. Not close. Far.', 'The first warm day. When you can take your coat off and nobody shouts.', 'Fog! You can sneak up on anyone in fog.'] },
    { if: { childTemper: 'shy' }, text: ['...Rain on the window when I\'m in bed. That\'s the best.'] },
    { if: { childTemper: 'curious' }, text: ['Rainbows. I want to find where they touch down. Nobody ever has. I will.'] },
  ]);
  lines('child.pass.weather.upwards', [
    { text: ['UPWARDS? Snow can\'t go upwards!', 'Did it land on the clouds?', 'I want to go there. Right now.'] },
  ]);
  // bright little ones, the rift-born, and the seasons
  lines('child.story.start', [
    { if: { register: 'bright' }, text: ['The genealogy of the Tooks. It was meant to be dull but somebody married a dwarf. Allegedly.', 'A story with a twist at the end. I guessed it. I always guess it.'] },
    { if: { season: 'winter' }, text: ['We had it indoors, by the fire. The Fell Winter. In winter. Very scary.'] },
    { if: { rift: true }, text: ['A hill story about a lamp in a window. We have one like it at home. Exactly like it.'] },
  ]);
  lines('child.story.teller', [
    { if: { childTemper: 'cheerful' }, text: ['Brilliant! They let us act the stories out! I was the troll! I was AMAZING.'] },
    { if: { childTemper: 'curious' }, text: ['They know SO much. I ask a hundred questions and they answer ninety.'] },
  ]);
  lines('child.story.voices', [
    { if: { band: 'young' }, text: ['The DRAGON voice! RAAAR! Like that! But scarier!'] },
  ]);
  lines('child.story.coats', [
    { if: { childTemper: 'curious' }, text: ['But you SAW everything? From the coats? What did you see?'] },
  ]);
  lines('child.story.neverdark', [
    { if: { childTemper: 'shy' }, text: ['...A kind engine. I\'d like to meet it. If it\'s kind.'] },
    { if: { childTemper: 'gloomy' }, text: ['If the lamps never go out, they never get to rest. That\'s sad.'] },
  ]);
  lines('child.letters.start', [
    { if: { band: 'school' }, text: ['I can read most things. Not the old almanac. It\'s all long esses and nonsense.'] },
    { if: { rift: true }, text: ['I could read rift-script before I came. Hill letters are slow. They have curly bits for no reason.'] },
  ]);
  lines('child.letters.read', [
    { if: { band: 'young' }, text: ['A book with a dragon in! A big one! And it eats the baddies!'] },
    { if: { childTemper: 'shy' }, text: ['...Poems. Short ones. You can read them under the covers in one go.'] },
  ]);
  lines('child.letters.binary', [
    { if: { childTemper: 'ornery' }, text: ['Why would anyone count with only two numbers? That\'s just being difficult.'] },
  ]);
  lines('child.letters.many', [
    { if: { childTemper: 'curious' }, text: ['Then dividing is a story about sharing! And nobody likes sharing! That\'s why it\'s hard!'] },
  ]);
  lines('child.treasure.where', [
    { if: { season: 'spring' }, text: ['In the hedge bank. Where the primroses are. You have to lie flat.'] },
    { if: { season: 'winter' }, text: ['Under the ice at the edge of the pond. You can see things down there. Frozen.'] },
    { if: { childTemper: 'curious' }, text: ['Everywhere! If you look at the ground instead of the sky, it\'s all treasure.'] },
  ]);
  lines('child.treasure.dragon', [
    { if: { childTemper: 'ornery' }, text: ['A dragon can try. I\'ve got a stick.'] },
    { if: { childTemper: 'shy' }, text: ['...Don\'t tell any dragons. Please.'] },
  ]);
  lines('child.treasure.button', [
    { if: { childTemper: 'shy' }, text: ['*closes {their} hand round it and doesn\'t open it again*'] },
    { if: { band: 'young' }, text: ['A WIZARD BUTTON! *runs off showing everyone*'] },
  ]);
  lines('child.treasure.sandwich', [
    { if: { band: 'young' }, text: ['There\'s a worm in my pocket. You can\'t eat him. He\'s Gerald.'] },
  ]);
  lines('child.secret.tell', [
    { if: { season: 'winter' }, text: ['I built a snow-cave behind the mill. It\'s got a shelf. I keep a candle in it.'] },
    { if: { season: 'summer' }, text: ['There\'s a pool upriver where the water\'s warm. Nobody knows. I swim there every day.'] },
    { if: { register: 'bright' }, text: ['I\'m writing a book. About everyone in Thistledown. In code. You\'re in chapter four.'] },
  ]);
  lines('child.secret.who', [
    { if: { childPetName: has }, text: ['{ChildPetName}. But {childPetName} won\'t tell. Can\'t.'] },
  ]);
  lines('child.magic.start', [
    { if: { childRiftOpen: true }, text: ['Did you make the rift? Was that magic? Do another one!'] },
    { if: { register: 'bright' }, text: ['I have a hypothesis that magic is just very advanced weather. Please demonstrate.'] },
  ]);
  lines('child.magic.ration', [
    { if: { childTemper: 'curious' }, text: ['How much do you get? A day? Do you run out? What happens when you run out?'] },
    { if: { band: 'young' }, text: ['NO! No rations! More magic! More CAKE!'] },
  ]);
  lines('child.magic.tease', [
    { if: { band: 'young' }, text: ['You ARE magic! You\'ve got a STAFF! And a HAT! Do it!'] },
  ]);
  lines('child.magic.light', [
    { if: { childTemper: 'ornery' }, text: ['If they can do it without magic, what\'s the point of you? ...Sorry. Do the spark again.'] },
  ]);
  lines('child.fest.start', [
    { if: { register: 'bright' }, text: ['Founders\' Day. There\'s history in it. And a long lunch. Mostly the lunch.'] },
    { if: { childPetName: has }, text: ['Yule! {ChildPetName} gets a sausage at Yule. A whole one.'] },
  ]);
  lines('child.fest.part', [
    { if: { band: 'young' }, text: ['The CAKE! And the bangs! And falling asleep under the table!'] },
    { if: { childTemper: 'curious' }, text: ['Finding out what everyone wished for. Nobody tells. I find out anyway.'] },
  ]);
  lines('child.fest.fireworks', [
    { if: { band: 'young' }, text: ['FIREWORKS! BANG! WHEE! The big ones! The BIGGEST!'] },
    { if: { childTemper: 'curious' }, text: ['How do you make them go green? And the dragon? Is the dragon one firework or lots?'] },
  ]);
  lines('child.helping.start', [
    { if: { register: 'bright' }, text: ['I keep the household accounts. Unofficially. Nobody else can add up.'] },
    { if: { rift: true }, text: ['I fix things. The lamp, the clock, the kettle. Hill-folk just put up with things being broken.'] },
  ]);
  lines('child.helping.worst', [
    { if: { childTemper: 'shy' }, text: ['Taking things to the neighbors. You have to knock. And then TALK.'] },
    { if: { childTemper: 'ornery' }, text: ['All of them. Every single one. Especially the ones I\'m doing right now.'] },
  ]);
  lines('child.pass.weather.start', [
    { if: { band: 'young' }, text: ['WEATHER! I like weather! It\'s outside!'] },
    { if: { childTemper: 'curious' }, text: ['Where do clouds go at night? Nobody knows. I\'m going to stay up and look.'] },
  ]);
  lines('child.pass.riddle.ask', [
    { if: { childRiddle: 'egg', band: 'young' }, pri: 5, text: ['What\'s white and round and has a chick inside? ...Wait, that\'s the answer. Guess anyway!'] },
  ]);
  lines('child.sit.bored.grin', [
    { if: { childTemper: 'cheerful' }, text: ['Ha! Dennis is the best sheep. He headbutts the fence.'] },
  ]);
  lines('child.sit.bored.nothing', [
    { if: { childTemper: 'curious' }, text: ['Something nobody\'s ever done. But all the things have been done. Probably.'] },
  ]);
  lines('child.sit.bored.off', [
    { if: { childTemper: 'cheerful' }, text: ['Right! I\'m going to find the best thing to do EVER!'] },
  ]);
  // the smaller beats, given voices too
  lines('child.story.keep', [
    { if: { childTemper: 'shy' }, text: ['...I keep all my stories somewhere safe. Nobody asks for them.'] },
    { if: { childTemper: 'cheerful' }, text: ['I\'ll keep it in my pocket! With the conkers!'] },
    { if: { band: 'youth' }, text: ['I think I already have. I just didn\'t know that\'s what I was doing.'] },
  ]);
  lines('child.story.snore', [
    { if: { childTemper: 'cheerful' }, text: ['Ha! A good story deserves a good snore! I\'m telling them that!'] },
    { if: { band: 'young' }, text: ['I snore like a PIG. Snrrk! Like that!'] },
  ]);
  lines('child.story.praise', [
    { if: { childTemper: 'shy' }, text: ['...I\'ll tell them. Quietly. After everyone\'s gone.'] },
    { if: { childTemper: 'ornery' }, text: ['Don\'t want it going to their head. ...I\'ll tell them.'] },
  ]);
  lines('child.letters.door', [
    { if: { childTemper: 'shy' }, text: ['...A door. I won\'t be scared of it now.'] },
    { if: { band: 'young' }, text: ['KNOCK KNOCK! *knocks on the air*'] },
  ]);
  lines('child.letters.spell', [
    { if: { register: 'bright' }, text: ['It\'s W-I-Z-A-R-D. Six letters. I could teach you a mnemonic.'] },
    { if: { childTemper: 'shy' }, text: ['...I can\'t spell my own name sometimes. So that\'s all right.'] },
  ]);
  lines('child.letters.wrong', [
    { if: { childTemper: 'shy' }, text: ['*giggles behind {their} hand*'] },
    { if: { register: 'bright' }, text: ['You put the D before the R. Classic error. I\'ll write it out for you.'] },
  ]);
  lines('child.letters.teller', [
    { if: { childTemper: 'shy' }, text: ['...I\'ll ask after. When the others have gone.'] },
    { if: { childTemper: 'curious' }, text: ['ALL the books? Even the ones about poison? Especially those.'] },
  ]);
  lines('child.letters.promise', [
    { if: { childTemper: 'shy' }, text: ['...A book of my own. *says it again, quietly, to make it real*'] },
    { if: { register: 'bright' }, text: ['Something difficult, please. With footnotes.'] },
  ]);
  lines('child.letters.relay', [
    { if: { childTemper: 'curious' }, text: ['Glowing words! Do they glow when you read them or all the time? I need to know.'] },
  ]);
  lines('child.treasure.careful', [
    { if: { childTemper: 'ornery' }, text: ['I KNOW. Everyone says. I\'m not a baby.'] },
    { if: { band: 'young' }, text: ['I won\'t fall in! Not again! I\'ll hold a branch!'] },
  ]);
  lines('child.treasure.safe', [
    { if: { childTemper: 'shy' }, text: ['...You\'re the only one who knows. That\'s nice. And scary.'] },
  ]);
  lines('child.treasure.spade', [
    { if: { childTemper: 'cheerful' }, text: ['HA! You\'d never find it! I\'ve moved it already! In my head!'] },
  ]);
  lines('child.treasure.look', [
    { if: { childTemper: 'shy' }, text: ['...I look at mine when I\'m sad. It helps.'] },
  ]);
  lines('child.treasure.sleep', [
    { if: { band: 'young' }, text: ['I\'m going to sleep on it! And be a DRAGON! ROAR!'] },
  ]);
  lines('child.secret.kind', [
    { if: { childTemper: 'cheerful' }, text: ['HAPPY! Mostly! There\'s a sad bit but it\'s small!'] },
    { if: { childTemper: 'shy' }, text: ['...I don\'t know. That\'s why I need to tell someone.'] },
  ]);
  lines('child.secret.who', [
    { if: { band: 'young' }, text: ['Nobody! Only you! And my teddy!'] },
  ]);
  lines('child.magic.ship', [
    { if: { childTemper: 'curious' }, text: ['How does it keep its shape? Smoke doesn\'t keep its shape! Do another and I\'ll watch closer!'] },
    { if: { band: 'young' }, text: ['A BOAT! In the AIR! Make it a dragon boat!'] },
  ]);
  lines('child.magic.ration', [
    { if: { childTemper: 'shy' }, text: ['...That\'s all right. One was enough. It was a lovely one.'] },
  ]);
  lines('child.pass.riddle.clue', [
    { if: { childTemper: 'ornery' }, text: ['No clues. ...Fine. One.', 'It\'s obvious. Think harder. ...It\'s in the kitchen.'] },
  ]);
  lines('child.pass.riddle.answer', [
    { if: { childTemper: 'cheerful' }, text: ['You gave up! I WIN! Riddle champion of Thistledown!'] },
    { if: { childTemper: 'ornery' }, text: ['You gave up too fast. Grown-ups always give up too fast.'] },
  ]);
  lines('child.fest.sparkler', [
    { if: { band: 'young' }, text: ['A SPARKLER! Can I wave it? Can I write my name?'] },
  ]);
  lines('child.fest.took', [
    { if: { childTemper: 'shy' }, text: ['...A bonfire you could see from Bree. I\'d like to see that. From far away.'] },
  ]);
  lines('child.helping.first', [
    { if: { childTemper: 'ornery' }, text: ['Hmph. Then the worst is first and the rest is still bad. ...Fine. I\'ll try.'] },
  ]);
  lines('child.helping.swap', [
    { if: { band: 'young' }, text: ['YES! I\'ll be the wizard! You do the HENS! HA!'] },
  ]);
});
