'use strict';
// ---------------------------------------------------------------------------
// Family, home and love, the second part: children and parents. A baby on
// the way and what to call it, a new baby and no sleep, raising little ones
// (mischief and pride), a parent asking the wizard's advice about a child,
// the empty nest, their own mum and dad, brothers and sisters, grandchildren,
// and the children's own view of home, with a question or two for the
// wizard. The facts come from talk/family.js.
// ---------------------------------------------------------------------------

talkPack('family2', () => {
  const has = (x) => x != null && x !== false && x !== '' && !(Array.isArray(x) && !x.length);
  const FB = (...text) => ({ text });
  const G = (...text) => ({ g: true, text });
  const W = (cond, ...text) => ({ if: cond, text });
  const tm = (temper, ...text) => ({ if: { temper }, text });
  const L = (key, guard, rules) => lines(key, rules.map((r) => (r.if || r.g ? { if: { ...(guard || {}), ...(r.if || {}) }, pri: r.pri, text: r.text } : r)));
  const C = 'cheerful', O = 'ornery', S = 'shy', Q = 'curious', D = 'dreamy', Wt = 'witty', P = 'proud', Gl = 'gloomy';
  const visit = (who, kind) => (T, v) => { const o = Game.villagers.find((x) => x.first === T.F[who] && x !== v && !x.leaving); if (o && ACTIONS.whisper_visit) v.queue.unshift({ a: ACTIONS.whisper_visit, extra: { to: o, kind } }); };

  // =====================================================================================
  // A little one on the way
  // =====================================================================================
  const EX = { expecting: true };
  addThread({
    id: 'family.expecting', label: 'A little one on the way, I hear!', weight: 1.8, cool: 2,
    when: (F) => F.expecting && F.stage !== 'child',
    open: { warm: 'family.exp.open' },
    beats: {
      start: { line: 'family.exp.start', go: [
        { ap: 'ask', say: 'Boy or girl, do you think?', to: 'guess' },
        { ap: 'jest', say: 'And are you ready? Nobody\'s ever ready.', to: 'ready' },
        { ap: 'comfort', say: 'You\'ll be a fine {role}. I can tell these things.', to: 'fine' },
      ] },
      guess: { line: 'family.exp.guess', go: [
        { ap: 'ask', say: 'And have you names picked out?', to: 'names' },
        { ap: 'jest', say: 'Well, as long as it\'s a hobbit. I\'ve known families surprised.', to: 'hobbit' },
      ] },
      ready: { line: 'family.exp.ready', go: [
        { ap: 'ask', say: 'What\'s worrying you most?', to: 'worry', need: { open: 1 }, soft: true },
        { ap: 'advise', say: 'Sleep now. Bank it, like jam for winter.', to: 'sleep' },
        { ap: 'ask', say: 'And have you names picked out?', to: 'names' },
      ] },
      fine: { line: 'family.exp.fine', go: [
        { ap: 'listen', say: '*You wait. Something\'s behind the smile.*', label: 'Wait', to: 'worry' },
        { ap: 'ask', say: 'And have you names picked out?', to: 'names' },
      ] },
      names: { line: 'family.exp.names', go: [
        { ap: 'jest', say: 'Name it after me. Every child needs a wizard\'s name.', to: 'wizname' },
        { ap: 'advise', say: 'A good plain name. Hobbits wear those best.', to: 'plain' },
        { ap: 'ask', say: 'Any names from the family?', to: 'kin' },
      ] },
      hobbit: { line: 'family.exp.hobbit', fx: { fond: 0.01 }, go: [
        { ap: 'ask', say: 'And have you names picked out?', to: 'names' },
      ] },
      worry: { line: 'family.exp.worry', fx: { confide: { k: 'family.expworry', t: '{Name} is frightened of not being a good enough {role}' } }, go: [
        { ap: 'comfort', say: 'Every good {role} I ever knew worried exactly that.', to: 'eased' },
        { ap: 'share', say: 'I\'ve held a great many babies. Not one of them complained.', to: 'held' },
        { ap: 'advise', say: 'Ask your own folk. They\'ll have done it all wrong and lived.', to: 'folk' },
      ] },
      sleep: { line: 'family.exp.sleep', end: true },
      wizname: { line: 'family.exp.wizname', fx: { joke: { k: 'family.wizname', t: 'The wizard wants a baby named after him.' } }, end: true },
      plain: { line: 'family.exp.plain', end: true },
      kin: { line: 'family.exp.kin', fx: { learn: ['family.babyname', '{Name} has a family name in mind for the baby'] }, end: true },
      eased: { line: 'family.exp.eased', fx: { trust: 0.04, drive: { lonely: -0.1 } }, end: true },
      held: { line: 'family.exp.held', fx: { trust: 0.03, promise: { k: 'family.holdbaby', t: 'You said you\'d come and see the baby', days: 6 } }, end: true },
      folk: { line: 'family.exp.folk', fx: { respect: 0.02, run: (T, v) => { if (T.F.parent) visit('parent', 'kin')(T, v); } }, end: true },
    },
    end: { fond: 0.03 },
  });
  L('family.exp.open', EX, [FB('A little one on the way, I hear, {name}!', 'Congratulations, {name}! The knitting needles are out, I\'m told.'), W({ spouse: has }, 'You and {spouse}! A little one! Congratulations, {name}.')]);
  L('family.exp.start', EX, [
    FB('Isn\'t it wonderful? Isn\'t it terrifying?', 'I can hardly think of anything else.'),
    G('We\'ve told everyone. Then we told them again.', 'It\'s real, wizard. It\'s really, really real.'),
    W({ carrying: true }, 'I\'m eating for two. Well, for four. The baby likes pickles. And cake. Together.', 'I can\'t see my own feet. I\'ve been told they\'re still there.'),
    W({ carrying: false }, 'I\'ve painted the cradle twice. Now I\'m painting it a third time. I can\'t sit still.', 'I keep bringing cushions. Nobody\'s asked for cushions. I can\'t stop.'),
    W({ littleOne: has }, 'Another one! {LittleOne} wants a brother. And a sister. And a goat. We\'ll see.'),
    tm(C, 'Wonderful! Marvellous! I\'ve cried four times this morning and it\'s not even second breakfast!'),
    tm(O, 'Yes. Well. Somebody\'s got to keep the family going. I\'ve not slept.', 'More mouths. More noise. ...I\'m very happy. Don\'t tell anyone.'),
    tm(S, '...Yes. Oh, wizard. Yes. *goes pink*', '...We\'re having a baby. I keep saying it to make sure it\'s true.'),
    tm(Q, 'Isn\'t it extraordinary? Where do they get their noses from? I want to watch it all happen.'),
    tm(D, 'I keep wondering who it\'ll be. Somebody new. Somebody who\'s never been before.'),
    tm(Wt, 'We\'re expecting! Well, we were always expecting something. This time it\'s a baby.'),
    tm(P, 'It\'ll be the finest baby in the valley. With our looks, how could it not?'),
    tm(Gl, 'It\'s wonderful. I\'m frightened out of my wits. Both. All the time.'),
    W({ stage: 'elder' }, 'At our age! The village is talking. Let it talk.'),
  ]);
  L('family.exp.guess', EX, [
    FB('Everyone has a guess. The postie says a girl. The miller says twins.', 'I don\'t mind. As long as it has all its toes.'),
    G('A girl, I think. Or a boy. I\'ve changed my mind eleven times.'),
    W({ carrying: true }, 'A boy. It kicks like a pony at the fair.', 'A girl. I just know. Don\'t ask how.'),
    tm(C, 'Both! Twins! No, one! I don\'t care! I\'m so happy!'),
    tm(O, 'A hobbit. That\'s all I\'m saying. Don\'t start a book on it.'),
    tm(S, '...I don\'t mind. I\'d just like it to be happy.'),
    tm(Q, 'My gran swung a ring over the bump. It went in circles. That means a girl. Or a turnip.'),
    tm(D, 'Someone with curly hair and a laugh like a brook. That\'s who I see.'),
    tm(Wt, 'Something small and loud that eats all day. So, a hobbit. Probably.'),
    tm(P, 'Whichever it is, it\'ll be clever. It runs in the family.'),
    tm(Gl, 'Don\'t tempt fate. I won\'t guess till I see.'),
  ]);
  L('family.exp.ready', EX, [
    FB('Ready? No. We have a cradle and a great many socks.', 'Nobody\'s ever ready, they tell me. That\'s a comfort, I suppose.'),
    G('We\'ve got everything. Two cradles, by accident. And a blanket from every aunt in the valley.'),
    tm(C, 'Ready as a hobbit can be! Which is not at all! Ha!'),
    tm(O, 'Ready? I\'ve fixed every loose board in the hole. Twice. Ask me again.'),
    tm(S, '...No. Not at all. Is that bad?'),
    tm(Q, 'I\'ve read everything. Nobody agrees. One book says singing, one says silence.'),
    tm(D, 'I don\'t think you can be ready for someone new. You just open the door.'),
    tm(Wt, 'Ready? I\'ve practised changing a cushion. The cushion\'s very pleased.'),
    tm(P, 'Entirely ready. I\'ve made lists. The lists have lists.'),
    tm(Gl, 'Ready? I lie awake every night counting what could go wrong.'),
  ]);
  L('family.exp.fine', EX, [
    FB('Do you think so? Really?', 'That\'s kind of you. I hope you\'re right.'),
    G('A fine {role}. ...I keep saying it to myself. It doesn\'t sound like me yet.'),
    tm(C, 'Oh, thank you! I\'ll be the best {role} in the world! I\'ll try, anyway!'),
    tm(O, 'Hmph. We\'ll see. My own {parentWord} would laugh.'),
    tm(S, '...Thank you. I needed someone to say that.'),
    tm(Q, 'Can you tell? How? What does a good {role} look like?'),
    tm(D, 'I hope so. I hope I\'m the kind they remember fondly.'),
    tm(Wt, 'A fine {role}? I\'ll settle for an adequate one with good biscuits.'),
    tm(P, 'Of course. I shall be exemplary.'),
    tm(Gl, 'You think so? ...I wish I did.'),
  ]);
  L('family.exp.names', EX, [
    FB('Dozens. We can\'t agree on any of them.', 'We\'ve a list as long as the West Road.'),
    G('{Spouse} likes the long ones. I like the short ones. We\'ll end up with a middle-sized one.'),
    tm(C, 'Rosie! Or Bilbo! Or Daisy! Or all three! Can you have three?'),
    tm(O, 'Something sensible. Not one of these flowery things everyone\'s giving them now.'),
    tm(S, '...One. A secret one. I haven\'t told anyone. Not even {spouse}.'),
    tm(Q, 'I\'ve been reading old names in the almanac. Did you know someone was once called Fortinbras?'),
    tm(D, 'Something that sounds like the river in spring. I\'ll know it when I hear it.'),
    tm(Wt, 'We\'re torn between a family name and something the neighbours can\'t spell.'),
    tm(P, 'A name worthy of the family. Something that looks well on a door.'),
    tm(Gl, 'I daren\'t pick one yet. It feels like tempting fate.'),
  ]);
  L('family.exp.hobbit', EX, [
    FB('Ha! What else would it be?', 'Surprised? What, by a dwarf? Ha!'),
    G('If it comes out with a beard, wizard, I\'m blaming you.'),
    tm(C, 'Ha! If it\'s an elf I\'ll be ever so pleased!'),
    tm(O, 'Don\'t even joke. My nerves are bad enough.'),
    tm(S, '...What? Oh. Oh, that\'s a joke. Ha.'),
    tm(Q, 'Really? Surprised how? Tell me. No. Don\'t. Yes. Tell me.'),
    tm(D, 'A baby\'s always a surprise. You never know who\'s coming through the door.'),
    tm(Wt, 'If it\'s a troll we\'ll call it Bert and say nothing.'),
    tm(P, 'It will be a hobbit of the very first quality.'),
    tm(Gl, 'Don\'t. I\'ve enough to worry about.'),
  ]);
  L('family.exp.worry', EX, [
    FB('...What if I get it wrong? All of it?', 'What if I\'m like my own {parentWord}? In the bad ways.'),
    G('What if I\'m not enough? A baby needs so much. I can barely keep a fern alive.'),
    W({ larder: 'bare' }, 'The larder\'s bare as it is. Another mouth. I lie awake doing sums.'),
    W({ rift: true }, 'A rift-born baby in a hill-folk village. Will they treat it right? Will it belong?'),
    tm(C, 'I just want it to be happy. What if I can\'t make it happy? I always can! But what if?'),
    tm(O, 'I\'ve a temper. You know I have. What if the little one gets it? What if I lose it with them?'),
    tm(S, '...What if it doesn\'t like me? Babies can tell, can\'t they?'),
    tm(Q, 'There\'s so much I don\'t know. And nobody can tell me all of it. I hate not knowing.'),
    tm(D, 'What if I\'m off in my head somewhere and miss it all? The first step. The first word.'),
    tm(Wt, 'I make jokes about everything. What if I can\'t make a joke of this?'),
    tm(P, 'I\'m used to being good at things. What if I\'m not good at this?'),
    tm(Gl, 'Everything. The cold. The fevers. The world. Everything.'),
  ]);
  L('family.exp.sleep', EX, [
    FB('Bank it! Ha! Like jam! I\'ll try.', 'Sleep. Right. I\'ll start now. Here. On this wall.'),
    G('{Spouse} says that too. Then {spouse} snores and I lie awake.'),
    tm(C, 'Ha! I\'ll sleep all afternoon! Doctor\'s orders! Wizard\'s orders!'),
    tm(O, 'Sleep? With all I\'ve got to do?'),
    tm(S, '...I\'ll try. Thank you.'),
    tm(Q, 'Can you bank sleep? Does it keep? I\'d like to know how.'),
    tm(D, 'Like a squirrel with nuts. Yes. I\'ll gather sleep.'),
    tm(Wt, 'I\'ll bank it. With interest. Then spend it all in the first night.'),
    tm(P, 'I sleep very efficiently. I\'ll be fine.'),
    tm(Gl, 'I can\'t sleep for worrying. That\'s the trouble.'),
  ]);
  L('family.exp.wizname', EX, [
    FB('Gandalf? For a hobbit? Ha!', 'After you? Can you imagine? Little Gandalf in the cradle!'),
    G('Ha! {Spouse} would never let me. ...As a middle name, perhaps.'),
    tm(C, 'Ha! Little Gandalf! In a tiny hat! Oh, I want to now!'),
    tm(O, 'Absolutely not. The poor thing would be teased into the river.'),
    tm(S, '...I\'d have to ask {spouse}. ...Ha. No.'),
    tm(Q, 'What does Gandalf mean, anyway? Is it Elvish? Does it mean something?'),
    tm(D, 'Gandalf. A name for someone who goes on adventures. Maybe that\'s why not.'),
    tm(Wt, 'Gandalf for a boy, Gandalfa for a girl. They\'d thank us later. Much later.'),
    tm(P, 'Our child will have a proper family name, thank you.'),
    tm(Gl, 'With a name like that they\'d be off on an adventure the minute they could walk.'),
  ]);
  L('family.exp.plain', EX, [
    FB('Plain names. Yes. Like Sam. Or Rose.', 'You\'re right. Nobody wants to shout \'Hildifons\' across a field.'),
    G('Plain. {Spouse} will be pleased. {Spouse} hates my list.'),
    tm(C, 'A plain name for a sunny baby! Perfect!'),
    tm(O, 'Exactly what I said. Nobody listens to me.'),
    tm(S, '...My secret name is plain. Good.'),
    tm(Q, 'Why do hobbits wear plain names best? Is it the round doors?'),
    tm(D, 'Plain as bread. Bread\'s the best thing, really.'),
    tm(Wt, 'Plain. Like Bob. Nobody\'s ever been sad named Bob.'),
    tm(P, 'Plain, but distinguished. There\'s a difference.'),
    tm(Gl, 'Plain is safe. Safe is good.'),
  ]);
  L('family.exp.kin', EX, [
    FB('My grandmother\'s, if it\'s a girl. She\'d have liked that.', 'There\'s an old name in the family Bible. Nobody\'s used it in a hundred years.'),
    G('{Spouse}\'s grandad\'s. He was the kindest hobbit in three valleys. It\'s a lot to live up to.'),
    W({ goneKin: has }, '{GoneKin}. If it\'s right. After my {goneRel}. I haven\'t told {spouse} yet.'),
    W({ parent: has }, '{Parent}, maybe. My {parentWord} would cry for a week.'),
    tm(C, 'Everyone\'s! We\'ll give it all the names! It\'ll take a whole morning to call it in!'),
    tm(O, 'My father\'s. Whether anyone likes it or not.'),
    tm(S, '...My gran\'s. She was quiet too.'),
    tm(Q, 'I\'ve been tracing the family back. There was a Mungo. I like Mungo.'),
    tm(D, 'My great-aunt\'s. She went off to see the sea and never came back. I like the idea.'),
    tm(Wt, 'Uncle Bungo\'s. Then it can blame him for everything.'),
    tm(P, 'The family name. It has a fine history. The baby will carry it well.'),
    tm(Gl, 'Somebody we\'ve lost. So they\'re not forgotten.'),
  ]);
  L('family.exp.eased', EX, [
    FB('...Did they? Really? That\'s... that\'s a help.', 'Thank you. I\'ve not told anyone that.'),
    G('I\'ll tell {spouse} what you said. We\'re both lying awake over it.'),
    tm(C, 'Really? Oh, good! Then I\'m a proper {role} already! Ha!'),
    tm(O, 'Hmph. Well. If they all worried, maybe it\'s not so daft.'),
    tm(S, '...Thank you. That helps.'),
    tm(Q, 'Every one? Then worrying is a sign! A good sign! I\'ll worry with confidence.'),
    tm(D, 'So the worry is love, wearing its boots. Yes.'),
    tm(Wt, 'So I\'m already good at the worrying part. One down.'),
    tm(P, 'Then I shall worry very well. Better than anyone.'),
    tm(Gl, '...Maybe. Maybe worrying isn\'t the same as failing.'),
  ]);
  L('family.exp.held', EX, [
    FB('Not one? Ha! Will you come and hold ours?', 'You\'ll have to hold ours, then. For luck.'),
    G('Come and see us, when it comes. {Spouse} would love that.'),
    tm(C, 'You must come! Bring fireworks! Tiny ones!'),
    tm(O, 'You\'ll wipe your boots first, mind.'),
    tm(S, '...Would you come? When it\'s here? I\'d like that.'),
    tm(Q, 'How many? How do you hold them? Show me. With a loaf.'),
    tm(D, 'A wizard\'s blessing. Yes. Come when it\'s born.'),
    tm(Wt, 'Not one complained? They couldn\'t talk yet. Very convenient.'),
    tm(P, 'You may hold ours. It will be a privilege.'),
    tm(Gl, 'Come, then. For luck. We\'ll need it.'),
  ]);
  L('family.exp.folk', EX, [
    FB('Ha! True. I was dropped twice and look at me.', 'My {parentWord}\'ll be pleased to be asked. Insufferable, but pleased.'),
    G('I\'ll go and see my {parentWord}. Take a cake. That\'ll start the stories.'),
    tm(C, 'Yes! I\'ll ask everyone! I\'ll have a hundred stories by supper!'),
    tm(O, 'Fine. If I can stand the lecture.'),
    tm(S, '...I\'ll ask. Quietly.'),
    tm(Q, 'Of course! I\'ll write it all down. An almanac of mistakes.'),
    tm(D, 'They were frightened once, too. I never thought of that.'),
    tm(Wt, 'Did it all wrong and lived. I\'ll put that on a sampler.'),
    tm(P, 'My family did everything right, as it happens.'),
    tm(Gl, 'And if they did it wrong and it shows? ...I\'ll ask anyway.'),
  ]);

  // =====================================================================================
  // Their turn: what shall we call it?
  // =====================================================================================
  addThread({
    id: 'family.names', theirs: true, label: 'What shall we call it?', cool: 3, ask: '{Name} wants your opinion on something very important.',
    when: (F) => F.expecting && F.met && F.stage !== 'child',
    beats: {
      start: { line: 'family.names.q', go: [
        { ap: 'ask', say: 'What have you got so far?', to: 'list' },
        { ap: 'tale', say: 'In the old tales, the name finds the child, not the other way.', to: 'finds' },
        { ap: 'jest', say: 'Gandalf. For a boy or a girl. It suits everyone.', to: 'gandalf' },
      ] },
      list: { line: 'family.names.list', go: [
        { ap: 'advise', say: 'The second one. It sounds like someone you\'d want to know.', to: 'second' },
        { ap: 'warm', say: 'All lovely. You\'ll know when you see the little face.', to: 'face' },
      ] },
      finds: { line: 'family.names.finds', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'You\'ll know when you see the little face.', to: 'face' },
        { ap: 'ask', say: 'What have you got so far, though?', to: 'list' },
      ] },
      gandalf: { line: 'family.names.gandalf', go: [
        { ap: 'ask', say: 'Fine, fine. What have you got so far?', to: 'list' },
      ] },
      second: { line: 'family.names.second', fx: { respect: 0.03 }, end: true },
      face: { line: 'family.names.face', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.names.q', EX, [
    FB('Wizard! You know a lot of names. What shall we call the baby?', 'We can\'t agree on a name. You decide. No, don\'t. Yes. Help us.'),
    G('{Spouse} and I have stopped speaking over names. Nicely. Help?'),
    tm(C, 'Names! I need names! Good ones! You\'ve met everyone in the world, you must know some!'),
    tm(O, 'Right. Names. Everyone\'s got an opinion. I want a sensible one. Yours.'),
    tm(S, '...Can I ask you something? About names? For the baby?'),
    tm(Q, 'What makes a good name, do you think? Sound? Meaning? Who you\'re named after?'),
    tm(D, 'Do you think a name changes who you become? I think about it all night.'),
    tm(Wt, 'We need a name. Something that sounds good shouted from a door at teatime.'),
    tm(P, 'We need a name that befits the family. You\'re well travelled. Advise us.'),
    tm(Gl, 'Everyone says a name\'s for life. What if we pick wrong?'),
  ]);
  L('family.names.list', EX, [
    FB('Rose. Merry. Hamfast. Lily. Fosco. And Primula, if {spouse} has {sTheir} way.', 'Daisy, Pippin, Bell, Bungo. Bungo\'s a joke. Mostly.'),
    G('Peony, Tolman, Myrtle, Odo. {Spouse} wants Odo. I don\'t want Odo.'),
    tm(C, 'Lily! Poppy! Primrose! Bluebell! ...We\'ve mostly got flowers. Is that bad?'),
    tm(O, 'Sam. Rose. That\'s the list. Everyone else keeps adding to it.'),
    tm(S, '...Lily. Or Tom. Just those two.'),
    tm(Q, 'Forty-three names. I\'ve ranked them. By sound, length, and how they\'d look carved on a door.'),
    tm(D, 'Willow. Wren. Robin. Things that live by the river.'),
    tm(Wt, 'Bilbo, Frodo, Dodo. We stopped at Dodo.'),
    tm(P, 'Fortinbras. Belladonna. Isengrim. Family names. Proper ones.'),
    tm(Gl, 'We had a list. We crossed them all out.'),
  ]);
  L('family.names.finds', EX, [
    FB('The name finds the child? Oh, I like that.', 'So we wait and see who comes? That\'s braver than a list.'),
    tm(C, 'Oh, that\'s lovely! Like the name\'s waiting outside the door!'),
    tm(O, 'Hmph. Wizard talk. ...It\'s nice, though.'),
    tm(S, '...So I don\'t have to choose. I can just listen. I like that.'),
    tm(Q, 'How does a name find a child? Does it knock? What does it look like?'),
    tm(D, 'Like a bird finding its tree. Yes. I knew it would be like that.'),
    tm(Wt, 'So if it\'s called Bungo it\'s not our fault. Brilliant.'),
    tm(P, 'Then I expect a very fine name will find ours.'),
    tm(Gl, 'And if no name finds it? ...Sorry. That\'s just me.'),
  ]);
  L('family.names.gandalf', EX, [
    FB('Ha! For a girl? Gandalfina?', 'You\'re no help at all.'),
    tm(C, 'Ha! Little Gandalf! In a tiny hat with a tiny staff! I\'m half tempted!'),
    tm(O, 'You\'re no help at all. Be serious.'),
    tm(S, 'Ha... no. Sorry. No.'),
    tm(Q, 'What would the girl\'s version be? Gandalfa? Gandalfina? There must be a rule.'),
    tm(D, 'It would suit someone who wanders. ...No, I want them home.'),
    tm(Wt, 'Gandalf Proudfoot. It does have a ring. A dreadful ring.'),
    tm(P, 'Our child deserves a name of its own, thank you.'),
    tm(Gl, 'Then they\'d grow a beard and wander off. No.'),
  ]);
  L('family.names.second', EX, [
    FB('Someone you\'d want to know. ...Yes. That\'s the one.', 'You\'re right. I keep saying it out loud. It fits.'),
    G('I\'ll tell {spouse} the wizard chose it. That\'ll end the argument.'),
    tm(C, 'That\'s it! That\'s the one! Oh, thank you!'),
    tm(O, 'Hmph. That was my favourite anyway.'),
    tm(S, '...That was my secret one. How did you know?'),
    tm(Q, 'Why that one? What did you hear in it? I want to hear it too.'),
    tm(D, 'Someone you\'d want to know. That\'s the nicest thing to say about a name.'),
    tm(Wt, 'Decided by wizard. That\'ll be a story at their coming of age.'),
    tm(P, 'An excellent choice. I suggested it first, I think.'),
    tm(Gl, '...Yes. It feels lucky. I hope it is.'),
  ]);
  L('family.names.face', EX, [
    FB('The little face. Yes. I can\'t wait to see it.', 'You\'re right. We\'ll look, and we\'ll know.'),
    tm(C, 'Oh, I can\'t wait! I\'ll know at once! I\'m sure I will!'),
    tm(O, 'And if it\'s a cross little face? ...Ha. Then it\'s mine.'),
    tm(S, '...Yes. I\'d like to wait for that.'),
    tm(Q, 'How will we know? Will it just look like a Rose? Do babies look like names?'),
    tm(D, 'The face will tell us. Faces always know.'),
    tm(Wt, 'And if it looks like a potato, we call it Spud.'),
    tm(P, 'The face will be handsome, and the name will follow.'),
    tm(Gl, 'I hope we know. I hope we\'re right.'),
  ]);

  // =====================================================================================
  // A new baby, and no sleep
  // =====================================================================================
  const BB = { baby: has };
  addThread({
    id: 'family.baby', label: (F) => `And how's little ${F.baby || 'one'}?`, weight: 1.6, cool: 2,
    when: (F) => !!F.baby && F.stage !== 'child',
    open: { warm: 'family.baby.open' },
    beats: {
      start: { line: 'family.baby.start', go: [
        { ap: 'jest', say: 'You look like you\'ve slept under a hedge.', to: 'tired' },
        { ap: 'ask', say: 'And who does {baby} take after?', to: 'likeness' },
        { ap: 'warm', say: 'May I see? Just a peek.', to: 'peek' },
      ] },
      tired: { line: 'family.baby.tired', go: [
        { ap: 'advise', say: 'Take turns. And nap when {baby} naps. Wizard\'s orders.', to: 'turns' },
        { ap: 'comfort', say: 'It passes. They sleep eventually. Usually by thirty.', to: 'passes' },
        { ap: 'ask', say: 'And is it worth it?', to: 'worth' },
      ] },
      likeness: { line: 'family.baby.likeness', go: [
        { ap: 'jest', say: 'Has the family nose, I see. Poor mite.', to: 'nose' },
        { ap: 'ask', say: 'And is it worth it? The nights?', to: 'worth' },
      ] },
      peek: { line: 'family.baby.peek', go: [
        { ap: 'warm', say: 'Bless. A perfect little hobbit.', to: 'perfect' },
        { ap: 'tale', say: 'I\'ll tell {baby} stories, one day. Of dragons. The friendly sort.', to: 'stories' },
      ] },
      turns: { line: 'family.baby.turns', fx: { respect: 0.02 }, end: true },
      passes: { line: 'family.baby.passes', fx: { fond: 0.01 }, go: [
        { ap: 'ask', say: 'And is it worth it?', to: 'worth' },
      ] },
      worth: { line: 'family.baby.worth', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'I thought you\'d say that.', to: 'end' },
        { ap: 'ask', say: 'What do you want for {baby}? When grown?', to: 'hope', need: { open: 1 }, soft: true },
      ] },
      nose: { line: 'family.baby.nose', fx: { joke: { k: 'family.nose', t: '{Baby} has the family nose, poor mite.' } }, end: true },
      perfect: { line: 'family.baby.perfect', go: [
        { ap: 'ask', say: 'What do you want for {baby}? When grown?', to: 'hope' },
        { ap: 'tale', say: 'I\'ll tell {baby} stories, one day. Of dragons. The friendly sort.', to: 'stories' },
      ] },
      stories: { line: 'family.baby.stories', fx: { promise: { k: 'family.babystory', t: 'You said you\'d tell {baby} stories one day', days: 30 } }, end: true },
      hope: { line: 'family.baby.hope', fx: { confide: { k: 'family.babyhope', t: 'What {name} hopes for {baby}' } }, end: true },
    },
    end: { fond: 0.03, drive: { lonely: -0.05 } },
  });
  L('family.baby.open', BB, [FB('And how\'s the little one, {name}?'), G('And how\'s little {baby}, {name}?', 'I hear little {baby}\'s got a fine pair of lungs, {name}.')]);
  L('family.baby.start', BB, [
    FB('Loud. Lovely. Loud.', 'Oh, wizard. I\'ve never been so tired or so happy.'),
    G('{Baby}\'s grand. Sleeps all day, sings all night. Like a nightingale with colic.', '{Baby} grabbed my finger this morning and wouldn\'t let go. I didn\'t want {baby} to.'),
    W({ babyWord: 'girl' }, 'Our little girl! She\'s got a grip like a blacksmith.'),
    W({ babyWord: 'boy' }, 'Our little lad! He\'s already eaten more than his dad.'),
    W({ spouse: has }, '{Spouse} and I take turns walking {baby} up and down the passage. We\'ve worn a groove.'),
    W({ littleOne: has }, '{LittleOne} keeps trying to give {baby} a worm. As a present. We\'re working on it.'),
    tm(C, 'Wonderful! {Baby} smiled at me! Well, it might have been wind. It was a smile!'),
    tm(O, 'Loud. Very loud. Gets that from {spouse}\'s side.', 'Fine. Hungry. Always hungry. Gets that from me.'),
    tm(S, '...{Baby}\'s asleep. Finally. I\'m whispering out of habit.'),
    tm(Q, '{Baby} looked at a candle for an hour. An hour! What was {baby} thinking?'),
    tm(D, 'I sit and watch {baby} sleep. Little hands opening and closing. Like a flower.'),
    tm(Wt, '{Baby}\'s in charge now. We\'re just the staff. Poorly paid.'),
    tm(P, '{Baby}\'s the most forward baby in the valley. Everyone says so.'),
    tm(Gl, '{Baby} had a sniffle. I didn\'t sleep. {Baby}\'s fine. I\'m not.'),
  ]);
  L('family.baby.tired', BB, [
    FB('A hedge would be restful. A hedge doesn\'t cry at three in the morning.', 'Do I? I put my boots on the wrong feet this morning.'),
    G('{Baby} wakes every two hours. I\'ve forgotten what sleep is. Is it nice?'),
    tm(C, 'Ha! I\'m so tired I laughed at a spoon! It wasn\'t even a funny spoon!'),
    tm(O, 'Thank you so much. I\'ll be sure to tell the hedge.'),
    tm(S, '...Do I? I tried to wash my face. I think I missed.'),
    tm(Q, 'How long can a hobbit go without sleep, do you think? I\'m testing it.'),
    tm(D, 'I\'m so tired the days have gone soft at the edges. Like a dream I\'m walking in.'),
    tm(Wt, 'I slept under a hedge once. Better than this. The hedge didn\'t need feeding.'),
    tm(P, 'I look perfectly well. I always look well.'),
    tm(Gl, 'I feel worse than I look. And I look like a wet sack.'),
  ]);
  L('family.baby.likeness', BB, [
    FB('Everyone says something different. The ears are mine. Nobody wants the ears.', 'The neighbours say the milkman. We haven\'t got a milkman.'),
    G('{Spouse}, I think. The frown. {Baby} frowns at everything. Like a little judge.', 'Me, when {baby} laughs. {Spouse}, when {baby} howls.'),
    tm(C, 'Me! Definitely me! Look at that smile! Well, wait till {baby} smiles!'),
    tm(O, 'My father. Same scowl. Same appetite. Poor thing.'),
    tm(S, '...Me, I think. {Baby} hides behind the blanket.'),
    tm(Q, 'I made a chart of features. It\'s fifty-fifty, with one ear unaccounted for.'),
    tm(D, 'My gran. Something about the eyes. Like someone old looking out of someone new.'),
    tm(Wt, 'A potato, mostly. A beautiful potato.'),
    tm(P, 'Me. Clearly me. The family chin.'),
    tm(Gl, 'Whoever it is, I hope {baby} doesn\'t get my worrying.'),
  ]);
  L('family.baby.peek', BB, [
    FB('Shh. There. Look. Isn\'t that the best thing you ever saw?', 'Quietly! ...There. All curled up.'),
    G('Look, there\'s {baby}. With a fist up by the ear, like {baby}\'s listening to something far away.'),
    tm(C, 'Look look look! There! Isn\'t {baby} perfect? Isn\'t {baby} just perfect?'),
    tm(O, 'Fine. One peek. If {baby} wakes, you\'re walking the passage.'),
    tm(S, '...Here. Gently. Isn\'t {baby} small?'),
    tm(Q, 'Look at the fingernails! Tiny! How do they grow so small?'),
    tm(D, 'Look. Asleep. Wherever babies go when they sleep. Somewhere lovely, I think.'),
    tm(Wt, 'Behold. The ruler of the hole. Bow, wizard.'),
    tm(P, 'There. The handsomest baby in Thistledown.'),
    tm(Gl, 'Shh. Don\'t wake {baby}. Please. Please don\'t.'),
  ]);
  L('family.baby.turns', BB, [
    FB('Nap when the baby naps. Ha. I\'ll try.', 'Turns. Yes. Tonight it\'s my turn to sleep. I\'ll hold {spouse} to it.'),
    tm(C, 'Wizard\'s orders! I\'ll tell {spouse}! Ha!'),
    tm(O, 'Turns. {Spouse} will say it\'s always my turn.'),
    tm(S, '...Thank you. I\'ll try to ask.'),
    tm(Q, 'Does it work? Napping with the baby? I\'ve always wondered.'),
    tm(D, 'Napping in the afternoon with the baby on my chest. That sounds like heaven.'),
    tm(Wt, 'Nap when {baby} naps? {Baby} doesn\'t nap. {Baby} plots.'),
    tm(P, 'We have a very good system already, but thank you.'),
    tm(Gl, 'I\'ll try. I can\'t sleep for listening, though.'),
  ]);
  L('family.baby.passes', BB, [
    FB('By THIRTY? Ha! ...You\'re joking. You\'re joking?', 'Usually by thirty. I\'ll hold you to that.'),
    tm(C, 'Ha! Thirty! I\'ll have a lie-in on {baby}\'s birthday!'),
    tm(O, 'Thirty. Marvellous. Something to look forward to.'),
    tm(S, '...Oh. Ha. You\'re teasing.'),
    tm(Q, 'Is that true? When did you sleep through? Do wizards sleep?'),
    tm(D, 'It passes. Everything passes. Even the nice bits. That\'s the sad part.'),
    tm(Wt, 'Thirty! Then {baby} can get up in the night for me.'),
    tm(P, 'Ours will sleep through much sooner. I\'m certain.'),
    tm(Gl, 'If I last that long.'),
  ]);
  L('family.baby.worth', BB, [
    FB('Worth it? Every minute. Even the three o\'clock ones.', 'Oh, wizard. More than anything.'),
    G('When {baby} goes quiet against my shoulder. That\'s worth every night there ever was.'),
    tm(C, 'Worth it? It\'s the best thing that ever happened! Ever!'),
    tm(O, '...Yes. Don\'t make me say it twice.'),
    tm(S, '...Yes. Very much.'),
    tm(Q, 'Worth it? I\'ve stopped measuring. That surprised me.'),
    tm(D, 'It\'s like holding a whole life you haven\'t read yet.'),
    tm(Wt, 'Worth it? Ask me after a full night. ...Yes. Obviously yes.'),
    tm(P, 'Of course. It\'s the most important work there is.'),
    tm(Gl, 'Yes. That\'s what frightens me. How much it\'s worth.'),
  ]);
  L('family.baby.nose', BB, [
    FB('Ha! The poor thing. We\'ll make a hat to cover it.', 'Don\'t. {Spouse} is very sensitive about the nose.'),
    tm(C, 'Ha! The family nose! It\'s a very good nose for smelling cake!'),
    tm(O, 'Nothing wrong with that nose. That\'s a working nose.'),
    tm(S, '...It is a big nose. Bless.'),
    tm(Q, 'Do noses grow at the same rate as the rest? I\'ve been wondering.'),
    tm(D, 'A nose with a history. Generations of it.'),
    tm(Wt, 'The nose came first. {Baby} followed shortly after.'),
    tm(P, 'It\'s a distinguished nose. Noble.'),
    tm(Gl, 'They\'ll tease {baby} about it. They teased me.'),
  ]);
  L('family.baby.perfect', BB, [
    FB('Perfect. Yes. When sleeping.', 'Isn\'t {baby}? I can\'t stop looking.'),
    tm(C, 'Isn\'t {baby}! Perfect! Perfect perfect perfect!'),
    tm(O, 'Perfect when quiet. Which is never.'),
    tm(S, '...Yes. I think so too.'),
    tm(Q, 'A perfect hobbit. What does that mean, I wonder? I\'ll find out.'),
    tm(D, 'Perfect. Like the first snowfall, before anyone walks on it.'),
    tm(Wt, 'Perfect. Wait till the teeth come.'),
    tm(P, 'Of course. Look at the parents.'),
    tm(Gl, 'Perfect. I\'m frightened to breathe on {baby}.'),
  ]);
  L('family.baby.stories', BB, [
    FB('Would you? Oh, {baby} would love that. One day.', 'The friendly sort. Mind you keep them friendly.'),
    tm(C, 'Oh, yes! Promise! Dragons and elves and everything!'),
    tm(O, 'Friendly dragons. Hmph. No such thing. ...Fine. Friendly ones.'),
    tm(S, '...Would you? {Baby} would be so lucky.'),
    tm(Q, 'Are there friendly dragons? Really? Tell me first. For research.'),
    tm(D, 'A wizard\'s stories, in the cradle. {Baby} will dream such dreams.'),
    tm(Wt, 'No dragons before bedtime. After breakfast, fine.'),
    tm(P, 'Our child deserves the best stories. I\'ll hold you to it.'),
    tm(Gl, 'Nothing frightening. Promise. Not even a little bit.'),
  ]);
  L('family.baby.hope', BB, [
    FB('Happy. Kind. With a full larder and friends at the door.', 'That {baby} never goes hungry and never feels alone.'),
    G('That {baby} stays in Thistledown. And if not, comes home for supper sometimes.'),
    tm(C, 'Everything! That {baby} laughs every day! Like I do!'),
    tm(O, 'That {baby}\'s got more sense than me. Not hard.'),
    tm(S, '...That {baby} is braver than me. Talks to people. Isn\'t frightened.'),
    tm(Q, 'That {baby} wants to know everything. And finds out half of it.'),
    tm(D, 'That {baby} sees the sea. I never did.'),
    tm(Wt, 'That {baby} inherits my wit and {spouse}\'s looks. Not the other way round.'),
    tm(P, 'That {baby} does the family proud. Which {baby} will.'),
    tm(Gl, 'That {baby} is spared the bad years. That\'s all I want.'),
    W({ rift: true }, 'That {baby} gets to choose. Hill-folk or rift. Both. Neither. {Baby}\'s own.'),
  ]);

  // =====================================================================================
  // Raising little ones: mischief and pride
  // =====================================================================================
  const LO = { littleOne: has };
  addThread({
    id: 'family.kids', label: 'How are the children getting on?', weight: 1.3, cool: 3,
    when: (F) => !!F.littleOne && F.stage !== 'child',
    open: { ask: 'family.kids.open' },
    beats: {
      start: { line: 'family.kids.start', go: [
        { ap: 'ask', say: 'And what\'s {littleOne} been up to?', to: 'mischief' },
        { ap: 'ask', say: 'What are you proudest of?', to: 'pride' },
        { ap: 'jest', say: 'Are they as much trouble as you were?', to: 'you' },
      ] },
      mischief: { line: 'family.kids.mischief', go: [
        { ap: 'jest', say: 'That\'s a hobbit after my own heart.', to: 'laugh' },
        { ap: 'advise', say: 'A firm word and a hug, in that order.', to: 'firm' },
        { ap: 'ask', say: 'And what did you do?', to: 'punish' },
      ] },
      pride: { line: 'family.kids.pride', go: [
        { ap: 'ask', say: 'And what will {littleOne} be, grown?', to: 'future' },
        { ap: 'warm', say: 'They\'re a credit to you.', to: 'credit' },
      ] },
      you: { line: 'family.kids.you', fx: { confide: { k: 'family.youngscrape', t: 'A scrape {name} got into as a child' } }, go: [
        { ap: 'jest', say: 'So {littleOne} comes by it honestly.', to: 'honest' },
        { ap: 'ask', say: 'And what\'s {littleOne} been up to?', to: 'mischief' },
      ] },
      laugh: { line: 'family.kids.laugh', go: [
        { ap: 'ask', say: 'And what will {littleOne} be, grown?', to: 'future' },
        { ap: 'warm', say: 'They\'re a credit to you. Muddy, but a credit.', to: 'credit' },
      ] },
      firm: { line: 'family.kids.firm', fx: { respect: 0.02 }, go: [
        { ap: 'ask', say: 'And what will {littleOne} be, grown?', to: 'future' },
      ] },
      punish: { line: 'family.kids.punish', go: [
        { ap: 'warm', say: 'That sounds about right to me.', to: 'credit' },
        { ap: 'advise', say: 'A firm word and a hug, in that order.', to: 'firm' },
      ] },
      honest: { line: 'family.kids.honest', fx: { joke: { k: 'family.honest', t: '{LittleOne} comes by the mischief honestly.' } }, end: true },
      credit: { line: 'family.kids.credit', fx: { fond: 0.02 }, end: true },
      future: { line: 'family.kids.future', fx: { learn: ['family.kidfuture', '{Name} hopes {littleOne} will go far'] }, go: [
        { ap: 'warm', say: 'Whatever it is, they\'ll do it well, with you behind them.', to: 'end' },
        { ap: 'warm', say: 'I\'ll keep an eye on {littleOne}. A wizard\'s eye.', to: 'eye' },
      ] },
      eye: { line: 'family.kids.eye', fx: { promise: { k: 'family.kideye', t: 'You said you\'d keep an eye on {littleOne}', days: 10 }, trust: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.kids.open', LO, [FB('How are the children getting on, {name}?'), G('And how\'s {littleOne} getting on, {name}?', 'I saw {littleOne} by the river, {name}. Growing like a weed.'), W({ littleCount: { min: 2 } }, 'And how are all your little ones, {name}?')]);
  L('family.kids.start', LO, [
    FB('Oh, growing. Eating. Growing some more.', 'Noisy. Muddy. Lovely. Mostly noisy.'),
    G('{LittleOne}\'s grand. Into everything. I found {kThem} in the flour bin yesterday.', '{LittleOne}\'s shot up. I\'ve let the trousers down twice this season.'),
    W({ littleBand: 'toddler' }, '{LittleOne}\'s walking! Well, falling forwards with great purpose.', '{LittleOne} has one word. It\'s \'no\'. {KThey} uses it beautifully.'),
    W({ littleBand: 'young' }, '{LittleOne} asks why. About everything. Why is the sky. Just that. Why is the sky.'),
    W({ littleBand: 'school' }, '{LittleOne} roams the whole valley now. Comes back with pockets full of frogs.'),
    W({ littleBand: 'youth' }, '{LittleOne} sighs at everything I say. Every single thing. A great long sigh.', '{LittleOne}\'s nearly grown. Eats like three hobbits and talks like none.'),
    W({ littleCount: { min: 3 } }, 'All {littleCountWord} of them? Exhausting. I wouldn\'t change a thing. Except the noise.'),
    tm(C, 'Wonderful! They\'re the joy of my life! Even when they\'re awful!'),
    tm(O, 'Under my feet. Every minute. ...I\'d not have it otherwise.'),
    tm(S, '...They\'re well. {LittleOne} is braver than me already.'),
    tm(Q, '{LittleOne} asked me where the river goes. I didn\'t know. Now we\'re both trying to find out.'),
    tm(D, 'Growing too fast. I blink and {littleOne}\'s another inch taller.'),
    tm(Wt, 'The children are well. The furniture is not.'),
    tm(P, '{LittleOne} is top of the story circle. Knows every tale. Gets that from me.'),
    tm(Gl, 'Well enough. I worry, of course. Every cough. Every scrape.'),
  ]);
  L('family.kids.mischief', LO, [
    FB('Up the party tree. The top. In a thunderstorm.', 'Painted the hens. Blue. With my good paint.'),
    G('{LittleOne} let the pigs into the Proudfoots\' garden. To \'visit\'. The pigs had a lovely time.', '{LittleOne} sold my pipe to the tinker for a whistle. A whistle!'),
    W({ littleBand: 'toddler' }, '{LittleOne} ate a beetle. Then a second beetle, to be sure.', 'Pulled every pan out of the cupboard and played them like drums. At dawn.'),
    W({ littleBand: 'young' }, '{LittleOne} buried my slippers in the garden. To see if they\'d grow.'),
    W({ littleBand: 'school' }, 'Caught {littleOne} with a jar of the bees. To make honey at home. In the bedroom.'),
    W({ littleBand: 'youth' }, '{LittleOne} was out till all hours at the Badger. Says {kThey} was \'just watching\'.'),
    W({ rift: true }, '{LittleOne} rewired the lamp to talk. It says \'hello\' when you light it. I can\'t switch it off.'),
    tm(C, 'Ha! {LittleOne} made a raft and sailed down the stream! In the washtub! Brilliant!'),
    tm(O, 'Mud. Mud up the walls. Mud on the ceiling. How? HOW?'),
    tm(S, '...{LittleOne} took the cake to share with everyone. Without asking. Well, it was kind.'),
    tm(Q, '{LittleOne} took the clock apart. All of it. To see where the tick lives. I helped, a bit.'),
    tm(D, '{LittleOne} ran off to find the end of the rainbow. Came back at dusk with a stone. Said it was gold.'),
    tm(Wt, '{LittleOne} told the whole lane I was a dragon in disguise. I\'ve had to stop roaring.'),
    tm(P, 'Nothing very bad. {LittleOne} is very well behaved. ...Apart from the goat business.'),
    tm(Gl, 'Fell in the river. Pulled out by the miller. I haven\'t slept since.'),
  ]);
  L('family.kids.pride', LO, [
    FB('Kindness. {LittleOne} shares. Even pudding. I can\'t do that.', 'That they\'re happy. That\'s all a hobbit could want.'),
    G('{LittleOne} stood up for a little rift-born girl at the story circle. Just stood there. I cried.', '{LittleOne} made me breakfast. On a tray. It was mostly jam. Best breakfast of my life.'),
    W({ littleBand: ['school', 'youth'] }, '{LittleOne} reads better than me now. Reads to me, some nights.'),
    W({ littleBand: ['toddler', 'young'] }, '{LittleOne} said \'thank you\' to the hens. Every egg. Unprompted.'),
    tm(C, 'Everything! The laugh! The hugs! The awful drawings! I keep them all!'),
    tm(O, '{LittleOne} doesn\'t back down. From anything. ...Gets that from me.'),
    tm(S, '...{LittleOne} talks to everyone. I never could. I\'m so proud.'),
    tm(Q, '{LittleOne} asks better questions than I do. Much better.'),
    tm(D, '{LittleOne} sees things. Faces in clouds. Stories in puddles. Like I used to.'),
    tm(Wt, '{LittleOne} told me a joke I didn\'t see coming. My own child! I\'ve never been prouder.'),
    tm(P, 'Everything. {LittleOne} is the finest youngster in the valley. Rightly so.'),
    tm(Gl, 'That {littleOne}\'s happier than I was. That\'s all I wanted.'),
  ]);
  L('family.kids.you', LO, [
    FB('Me? I was an angel. ...I set fire to the tablecloth at Yule.', 'Ha! Worse. I went missing for a whole day. In the larder. Eating.'),
    G('Ask my {parentWord}. Actually don\'t. You\'ll be there a week.'),
    W({ parent: has }, 'Ask my {parentWord}. {Parent} still tells the story about the pig and the wedding cake.'),
    tm(C, 'Much worse! I rolled a cheese down the hill and chased it into the river!'),
    tm(O, 'Worse. I bit the schoolmistress. She deserved it.'),
    tm(S, '...I hid. All the time. In cupboards. They\'d forget I was there.'),
    tm(Q, 'I dug a hole to the other side of the world. Got about four feet. Found a pipe.'),
    tm(D, 'I ran away to join the elves. Got as far as the bridge. Came back for supper.'),
    tm(Wt, 'I was never caught. That\'s different from being good.'),
    tm(P, 'I was a model child. Mostly. There was a small business with a goat.'),
    tm(Gl, 'I broke my arm falling off the mill roof. I still don\'t like heights.'),
  ]);
  L('family.kids.laugh', LO, [
    FB('Ha! Don\'t encourage {kThem}.', 'After your own heart! That\'s what I\'m afraid of.'),
    tm(C, 'Ha! I know! I laughed till I cried! Then I made {kThem} clean it up.'),
    tm(O, 'Don\'t you encourage it. I\'ll set {kThem} on you.'),
    tm(S, '...I did laugh. Afterwards. Quietly.'),
    tm(Q, 'You did the same, I suppose? Wizards must have been children. Were you?'),
    tm(D, 'It\'s nice that they still get into scrapes. It means they\'re still small.'),
    tm(Wt, 'A wizard\'s approval. Now I\'ll never get {kThem} to behave.'),
    tm(P, 'Well. Spirited children are a sign of good breeding.'),
    tm(Gl, 'Funny now. It wasn\'t at the time.'),
  ]);
  L('family.kids.firm', LO, [
    FB('Word, then hug. Yes. I\'ve been doing it backwards.', 'In that order. Right. I always crack first.'),
    tm(C, 'I always do the hug first! I can\'t help it! I\'ll try!'),
    tm(O, 'I can do the firm word. I\'m good at the firm word.'),
    tm(S, '...I can do the hug. The word\'s harder.'),
    tm(Q, 'Why that order? Does the hug undo the word? Interesting.'),
    tm(D, 'A firm word and a hug. Like rain, then sun.'),
    tm(Wt, 'Firm word: \'No.\' Hug: \'But I love you.\' Done. Every day.'),
    tm(P, 'That\'s exactly what I do. Good to hear it confirmed.'),
    tm(Gl, 'And if the word\'s too firm? I always worry.'),
  ]);
  L('family.kids.punish', LO, [
    FB('Sent {kThem} to bed with no pudding. Then took {kThem} pudding at bedtime.', 'Made {kThem} apologise to the hens. In person.'),
    tm(C, 'Laughed, then made {kThem} help clean it all up! Fun for everyone!'),
    tm(O, 'Gave {kThem} a talking-to {kThey}\'ll not forget. Then a biscuit. Don\'t tell.'),
    tm(S, '...I asked {kThem} not to. Very nicely. {KThey} said sorry.'),
    tm(Q, 'I asked {kThem} why. {KThey} had a very good reason. I\'m still thinking about it.'),
    tm(D, 'Nothing. I was too busy being glad {kThey} was safe.'),
    tm(Wt, 'Sentenced {kThem} to an afternoon of helping me with the accounts. Cruel and unusual.'),
    tm(P, 'Firmly and fairly. As my parents did with me.'),
    tm(Gl, 'Shouted. Then felt dreadful all night.'),
  ]);
  L('family.kids.honest', LO, [
    FB('Ha! I suppose {kThey} does. Don\'t tell {kThem}.', 'Honestly! Don\'t you go telling {littleOne} that story.'),
    tm(C, 'Ha! Like {role}, like child!'),
    tm(O, 'Hmph. Don\'t you breathe a word of it to {kThem}.'),
    tm(S, '...Please don\'t tell {kThem}.'),
    tm(Q, 'Is it in the blood, do you think? Mischief? I\'ve wondered.'),
    tm(D, 'The same scrapes, handed down. Like a coat.'),
    tm(Wt, 'Honestly earned. Honestly inherited. Honestly exhausting.'),
    tm(P, 'Spirit runs in the family. It\'s not the same as mischief.'),
    tm(Gl, 'I hope that\'s all {kThey} gets from me.'),
  ]);
  L('family.kids.credit', LO, [
    FB('Thank you. They are, aren\'t they?', 'A credit. Yes. A muddy one.'),
    tm(C, 'Aren\'t they! I tell them every day!'),
    tm(O, 'Hmph. Don\'t tell them that. They\'ll get ideas.'),
    tm(S, '...Thank you. That\'s kind.'),
    tm(Q, 'Do you think so? What makes you say that? I want to know what you saw.'),
    tm(D, 'I hope so. I hope they\'ll think so too, one day.'),
    tm(Wt, 'A credit to me. A debit to the pantry.'),
    tm(P, 'They are. I know it.'),
    tm(Gl, 'I hope I\'m a credit to them.'),
  ]);
  L('family.kids.future', LO, [
    FB('Whatever {kThey} likes. As long as {kThey}\'s happy.', 'A baker, this week. Last week a dragon.'),
    G('{LittleOne} wants to be a wizard. Like you. I said {kThey}\'d need a bigger hat.', '{LittleOne} says an adventurer. Over my dead body. ...Well. We\'ll see.'),
    W({ job: has }, 'A {jobWord}, like me, I hope. Or anything but. I can\'t decide.'),
    W({ rift: true }, 'Something that\'s both. Hill and rift. Something nobody\'s been yet.'),
    tm(C, 'Everything! A baker AND a fiddler AND the Steward!'),
    tm(O, 'Something useful. With a roof. Not off wandering.'),
    tm(S, '...Whatever makes {kThem} brave.'),
    tm(Q, 'I don\'t know! That\'s the best part! I\'m dying to find out!'),
    tm(D, 'Someone who goes further than I did. And comes back to tell me.'),
    tm(Wt, 'Rich enough to keep me in my old age. In pies.'),
    tm(P, 'Something important. The Steward, perhaps. Why not?'),
    tm(Gl, 'Safe. That\'s all. Safe and fed.'),
  ]);
  L('family.kids.eye', LO, [
    FB('Would you? A wizard\'s eye! {LittleOne}\'ll be thrilled.', 'Thank you. It\'s a comfort, knowing someone\'s watching.'),
    tm(C, 'Oh, would you? {LittleOne} will be over the moon!'),
    tm(O, 'A kindly eye, mind. Not a meddling one.'),
    tm(S, '...Thank you. That means a lot.'),
    tm(Q, 'What does a wizard\'s eye see that mine doesn\'t? Tell me sometimes.'),
    tm(D, 'Like a star over the house. Yes. Thank you.'),
    tm(Wt, 'Keep both eyes. {LittleOne} needs watching from all sides.'),
    tm(P, '{LittleOne} will be glad of the attention. {KThey} deserves it.'),
    tm(Gl, 'Thank you. I can\'t watch every minute. I try.'),
  ]);

  // =====================================================================================
  // Their turn: a parent asks the wizard's advice about a child
  // =====================================================================================
  addThread({
    id: 'family.worry', theirs: true, label: (F) => `About ${F.littleOne || 'the children'}`, cool: 4, ask: '{Name} catches your sleeve. It\'s about {littleOne}.',
    when: (F) => !!F.littleOne && F.stage !== 'child' && F.littleBand !== 'toddler' && F.met,
    beats: {
      start: { line: 'family.worry.q', go: [
        { ap: 'advise', say: 'Give {kThem} a job to be proud of. Responsibility works wonders.', to: 'job' },
        { ap: 'ask', say: 'Have you asked {littleOne} about it?', to: 'asked' },
        { ap: 'comfort', say: 'It\'s a phase. Most things are, at that age.', to: 'phase' },
      ] },
      job: { line: 'family.worry.job', go: [
        { ap: 'warm', say: 'Shall I have a word with {littleOne} myself?', to: 'word' },
        { ap: 'advise', say: 'And praise {kThem} when {kThey} does it. Out loud. In front of folk.', to: 'praise' },
      ] },
      asked: { line: 'family.worry.asked', go: [
        { ap: 'advise', say: 'Then ask, and listen to the whole answer. Even the dull bits.', to: 'listen' },
        { ap: 'warm', say: 'Shall I have a word with {littleOne} myself?', to: 'word' },
      ] },
      phase: { line: 'family.worry.phase', go: [
        { ap: 'ask', say: 'Were you the same, at that age?', to: 'same' },
        { ap: 'warm', say: 'Shall I have a word with {littleOne} myself?', to: 'word' },
      ] },
      same: { line: 'family.worry.same', fx: { trust: 0.02 }, go: [
        { ap: 'jest', say: 'And look how you turned out. Mostly sensible.', to: 'end' },
        { ap: 'advise', say: 'Then tell {littleOne} that. Children love knowing their folk were daft too.', to: 'listen' },
      ] },
      praise: { line: 'family.worry.praise', fx: { respect: 0.03 }, end: true },
      listen: { line: 'family.worry.listen', fx: { respect: 0.03 }, end: true },
      word: { line: 'family.worry.word', fx: { promise: { k: 'family.kidword', t: 'You said you\'d have a word with {littleOne}', days: 4 }, trust: 0.03 }, end: true },
    },
    end: { fond: 0.02, respect: 0.01 },
  });
  L('family.worry.q', LO, [
    FB('Wizard, can I ask you something? About the children? I don\'t know who else to ask.', 'You\'ve seen a lot of young ones grow. What do you do when they won\'t listen?'),
    G('It\'s {littleOne}. {KThey} won\'t eat {kTheir} greens. Not one. I\'ve tried hiding them in pie.', '{LittleOne} has gone quiet. Not sulky. Just quiet. I don\'t know what\'s in there.'),
    W({ littleBand: 'youth' }, '{LittleOne} talks about leaving. Bree. The Wild. The rifts. At {kTheir} age! What do I say?', '{LittleOne} wants nothing to do with me lately. Is that normal? Was I like that?'),
    W({ littleBand: 'school' }, '{LittleOne}\'s fallen out with every child on the lane. One by one. What am I doing wrong?', '{LittleOne} won\'t go to the story circle. Says it\'s for babies. What do I do?'),
    W({ littleBand: 'young' }, '{LittleOne} has an invisible friend. Called Bert. Bert is a troll. Should I worry?', '{LittleOne} won\'t sleep without the lamp lit. Says there are rifts in the dark.'),
    W({ littleBand: ['school', 'youth'], rift: false }, '{LittleOne} spends every hour with the rift-folk now. Talks in their slang. I can\'t follow it.'),
    W({ rift: true }, '{LittleOne} wants to be hill-folk. Wants to throw away the visor. My {littleWord}. Throw it away.'),
    tm(O, 'Right. You\'re wise, they say. {LittleOne} won\'t do a thing I say. Not one thing. What works?'),
    tm(S, '...Can I ask you something? It\'s {littleOne}. I don\'t know if I\'m doing it right.'),
    tm(Q, 'How do you get a child to tell you things? {LittleOne} used to tell me everything.'),
    tm(P, 'I\'m not one for asking advice. But {littleOne}... I\'m at the end of my wits.'),
    tm(Gl, 'I think I\'m failing {littleOne}. I don\'t know how. I just feel it.'),
  ]);
  L('family.worry.job', LO, [
    FB('A job. Yes. Like feeding the hens. Or minding the bread.', 'Responsibility. I hadn\'t thought of that. I do it all myself.'),
    G('{LittleOne} could take the eggs to the Store. {KThey}\'d like that. Feeling grown.'),
    tm(C, 'Of course! A job! {LittleOne} would love a job! Why didn\'t I think of that?'),
    tm(O, 'A job. Hmph. If {kThey}\'ll do it. ...I\'ll try it.'),
    tm(S, '...I could ask {kThem} to help in the garden. With me.'),
    tm(Q, 'Why does that work, do you think? Feeling needed? I\'ll test it.'),
    tm(D, 'Something of {kTheir} own. Yes. Everyone needs something of their own.'),
    tm(Wt, 'A job! I\'ll make {littleOne} head of pudding. That\'ll go to {kTheir} head.'),
    tm(P, 'A position of responsibility. Quite right. {LittleOne} is ready for one.'),
    tm(Gl, 'And if {kThey} does it badly? ...I\'ll try. I\'ll let {kThem}.'),
  ]);
  L('family.worry.asked', LO, [
    FB('...No. I just worried. I didn\'t think to ask.', 'Asked? I\'ve told. I\'ve not asked.'),
    G('I asked once. {LittleOne} said \'nothing\'. Then went off to the river.'),
    tm(C, 'Ask? Oh! I\'ve been talking at {kThem}, haven\'t I?'),
    tm(O, 'Asked? I\'ve shouted. That\'s a sort of asking.'),
    tm(S, '...I\'m not good at asking. Even {littleOne}.'),
    tm(Q, 'I ask all the time! {LittleOne} answers with questions. Gets that from me.'),
    tm(D, 'I asked. {KThey} said something about the moon. I think I missed it.'),
    tm(Wt, 'I asked. {KThey} rolled {kTheir} eyes so hard I heard it.'),
    tm(P, 'I shouldn\'t have to ask. {KThey} should come to me.'),
    tm(Gl, 'I\'m frightened of the answer, I think.'),
  ]);
  L('family.worry.phase', LO, [
    FB('A phase. Yes. Everyone says that. I hope everyone\'s right.', 'Is it? I hope so. It\'s a long phase.'),
    G('A phase. {LittleOne}\'ll be grown before I know it and I\'ll miss this. Won\'t I.'),
    tm(C, 'Of course! A phase! Next week it\'ll be something new! Ha!'),
    tm(O, 'A phase. Hmph. So was my grandad, and he lasted ninety years.'),
    tm(S, '...Thank you. I needed to hear that.'),
    tm(Q, 'How long do phases last? Is there a usual length? I\'d like to plan.'),
    tm(D, 'Like the moon. A phase. It\'ll come round full again.'),
    tm(Wt, 'A phase. Like my phase of not sleeping. Going on six years.'),
    tm(P, 'Well. If it\'s a phase, {kThey}\'ll come through it splendidly.'),
    tm(Gl, 'And if it\'s not? If it\'s just who {kThey} is?'),
  ]);
  L('family.worry.same', LO, [
    FB('...Worse. Much worse. I\'d forgotten.', 'Ha. I ran away to the mill once. For a whole afternoon.'),
    G('My {parentWord} would say worse. My {parentWord} would say a great deal.'),
    tm(C, 'Ha! Yes! Exactly the same! I\'d forgotten! Poor Mum!'),
    tm(O, 'I was perfectly reasonable. My parents were the trouble.'),
    tm(S, '...I was quiet too. I just wanted to be left alone. Oh.'),
    tm(Q, 'Was I? I suppose I was. I asked my dad why so often he hid in the shed.'),
    tm(D, 'I was always off somewhere in my head. My mother said I\'d float away.'),
    tm(Wt, 'I was a delight. Ask anyone who wasn\'t there.'),
    tm(P, 'I was very well behaved. ...There was the business with the goat.'),
    tm(Gl, 'Yes. And look at me. That\'s what I\'m afraid of.'),
  ]);
  L('family.worry.praise', LO, [
    FB('Out loud. In front of folk. ...Yes. I never do that.', 'You\'re right. I keep it all in. {LittleOne} doesn\'t know.'),
    tm(C, 'Out loud! I\'ll shout it from the party tree!'),
    tm(O, 'I\'m not one for fuss. ...I\'ll do it. Once. Quietly loud.'),
    tm(S, '...In front of people. That\'s hard. For {kThem}, I will.'),
    tm(Q, 'Why in front of folk? Because it counts more? Yes. It would.'),
    tm(D, 'Praise said out loud is like a lamp in a window. Everyone sees it.'),
    tm(Wt, 'I\'ll praise {kThem} at the Badger. Embarrass {kThem} properly.'),
    tm(P, 'I always praise {kThem}. ...In my head. I\'ll say it.'),
    tm(Gl, 'I\'ll try. I never had it, so I forget to give it.'),
  ]);
  L('family.worry.listen', LO, [
    FB('Even the dull bits. ...They\'re never dull, really. I just stop hearing.', 'The whole answer. Yes. I\'ll try that tonight.'),
    tm(C, 'I\'ll listen! I\'ll sit on my hands so I can\'t interrupt!'),
    tm(O, 'Listen. Fine. I can listen. I\'m an excellent listener. ...What?'),
    tm(S, '...I can do that. I\'m better at listening than talking.'),
    tm(Q, 'And not ask a question back? That\'ll be hard. I\'ll try.'),
    tm(D, 'Listen properly. Like you\'d listen to rain. Yes.'),
    tm(Wt, 'And no jokes in the middle. That\'s the real test.'),
    tm(P, 'I always listen. ...I\'ll listen more.'),
    tm(Gl, 'And if what I hear is bad? ...I\'ll still listen.'),
  ]);
  L('family.worry.word', LO, [
    FB('Would you? {LittleOne} looks up to you. Everybody does.', 'A word from the wizard. That\'ll carry more than mine.'),
    tm(C, 'Oh, would you! {LittleOne} will be so excited a wizard came to talk!'),
    tm(O, 'Kindly, mind. I\'ll do the scolding.'),
    tm(S, '...Thank you. I didn\'t like to ask.'),
    tm(Q, 'What will you say? Will you tell me what {kThey} says? Everything?'),
    tm(D, 'A word from a wizard is like a seed. It grows.'),
    tm(Wt, 'Tell {kThem} you\'ll turn {kThem} into a toad. That should do it.'),
    tm(P, 'Well, it can\'t hurt. {LittleOne} admires you. Nearly as much as me.'),
    tm(Gl, 'Please. I\'m out of words.'),
  ]);

  // =====================================================================================
  // The empty nest
  // =====================================================================================
  const NS = { flown: has };
  addThread({
    id: 'family.nest', label: 'Quiet at home, now?', weight: 1.1, cool: 5,
    when: (F) => !!F.flown && F.stage !== 'child' && !F.littleOne && !F.baby,
    open: { warm: 'family.nest.open' },
    beats: {
      start: { line: 'family.nest.start', go: [
        { ap: 'ask', say: 'Does {flown} come home much?', to: 'visits' },
        { ap: 'warm', say: 'You did a fine job. {Flown}\'s a fine hobbit.', to: 'job' },
        { ap: 'jest', say: 'More pie for you, at least.', to: 'pie' },
      ] },
      visits: { line: 'family.nest.visits', go: [
        { ap: 'advise', say: 'Then go and see {gThem}. Take jam. Nobody turns away jam.', to: 'jam' },
        { ap: 'comfort', say: 'They always come back. For Yule, if nothing else.', to: 'yule' },
      ] },
      job: { line: 'family.nest.job', go: [
        { ap: 'ask', say: 'And what will you do with the room?', to: 'room' },
        { ap: 'listen', say: '*You let the quiet sit a moment.*', label: 'Let the quiet sit', to: 'quiet' },
      ] },
      pie: { line: 'family.nest.pie', go: [
        { ap: 'ask', say: 'And what will you do with the room?', to: 'room' },
        { ap: 'warm', say: 'You must miss {gThem}, though.', to: 'quiet' },
      ] },
      quiet: { line: 'family.nest.quiet', fx: { trust: 0.03, feel: 'drawn_out' }, go: [
        { ap: 'advise', say: 'Then go and see {gThem}. Take jam.', to: 'jam' },
        { ap: 'ask', say: 'And what will you do with the room?', to: 'room' },
      ] },
      room: { line: 'family.nest.room', go: [
        { ap: 'jest', say: 'A room for a wizard, perhaps? I hardly snore.', to: 'wizroom' },
        { ap: 'warm', say: 'Whatever you fill it with, fill it with something you love.', to: 'end' },
      ] },
      yule: { line: 'family.nest.yule', end: true },
      jam: { line: 'family.nest.jam', fx: { respect: 0.02, run: visit('flown', 'kin') }, end: true },
      wizroom: { line: 'family.nest.wizroom', fx: { joke: { k: 'family.wizroom', t: 'The wizard says he hardly snores.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.nest.open', NS, [FB('Quiet at home, now, {name}?'), G('{Flown}\'s flown the nest, I hear, {name}.', 'Is it strange, {name}, with {flown} gone to a hole of {gTheir} own?')]);
  L('family.nest.start', NS, [
    FB('Quiet as a church. I talk to the clock now.', 'It\'s very tidy. I hate it.'),
    G('{Flown}\'s gone to {flownHome}. Three lanes away. It might as well be Bree.', 'I still set a place for {flown} at supper. Then I eat it. That\'s the bright side.'),
    W({ flownHome: has }, '{Flown}\'s up at {flownHome}. Sent a note to say the chimney smokes. I\'m pleased. It means {gThey} needs me.'),
    W({ spouse: has }, 'It\'s just {spouse} and me again. Like when we started. We\'ve forgotten what we used to talk about.'),
    W({ livesAlone: true }, 'Just me now. Me and the mice. The mice are very good company. Very quiet.'),
    tm(C, 'Oh, it\'s lovely! The bath\'s always free! ...I cried in it yesterday. Lovely bath.'),
    tm(O, 'Peaceful. Finally. Nobody using my good razor. ...It\'s too quiet. Don\'t tell anyone.'),
    tm(S, '...It\'s very quiet. I didn\'t think I\'d mind. I mind.'),
    tm(Q, 'I wonder what {flown}\'s doing at every hour. Is that normal? I\'ve made a little chart.'),
    tm(D, 'I keep hearing footsteps in the passage. Old ones. The house remembers.'),
    tm(Wt, 'I\'ve finally got the larder to myself. It\'s not as fun without someone to blame.'),
    tm(P, '{Flown} has a hole of {gTheir} own. As it should be. I raised a very capable hobbit.'),
    tm(Gl, 'Empty. That\'s the word. Empty.'),
  ]);
  L('family.nest.visits', NS, [
    FB('Highdays. Sometimes. When {gThey} remembers.', 'Now and then. With washing, mostly.'),
    G('{Flown} comes for Highday dinner. Brings washing. Takes cake. It\'s a fair trade.', 'Not as much as I\'d like. More than {gThey} needs to.'),
    tm(C, 'Every chance! With washing and stories! I love the washing!'),
    tm(O, 'When the larder\'s empty. Funny, that.'),
    tm(S, '...Sometimes. I don\'t like to ask. In case {gThey}\'s busy.'),
    tm(Q, 'Every fourth day, roughly. I\'ve counted. Is that a lot? It feels like not.'),
    tm(D, 'I watch the lane at teatime. Sometimes it\'s {flown}. Sometimes it\'s only a hen.'),
    tm(Wt, 'Whenever the washing piles up. I\'ve considered hiding {gTheir} socks.'),
    tm(P, '{Flown} is very busy. Important work. {GThey} visits when {gThey} can.'),
    tm(Gl, 'Less and less. It\'s how it goes. They grow away.'),
  ]);
  L('family.nest.job', NS, [
    FB('Did I? ...I suppose I did. Somebody should tell me more often.', 'Thank you. You don\'t hear that, as a {role}.'),
    G('{Flown}? A fine hobbit. Yes. Better than me. That was the plan.'),
    tm(C, 'Oh, thank you! I did, didn\'t I? I did a lovely job!'),
    tm(O, 'Hmph. I did my best. Best\'s all you can do.'),
    tm(S, '...Thank you. I wasn\'t sure.'),
    tm(Q, 'Did I? How can you tell? What did you notice?'),
    tm(D, 'I just loved {gThem}. I don\'t know if that\'s a job.'),
    tm(Wt, 'I did a fine job. {Flown} did a finer job of ignoring it.'),
    tm(P, 'I did. I\'m very proud. I\'d say so to anyone.'),
    tm(Gl, 'Did I? I keep thinking of what I got wrong.'),
  ]);
  L('family.nest.pie', NS, [
    FB('Ha! True. A whole pie, and nobody to say \'are you having that?\'', 'More pie. Less fun. It\'s a trade.'),
    tm(C, 'Ha! I\'ve had three this week! Shh!'),
    tm(O, 'At least there\'s that. My pie, for once.'),
    tm(S, '...I still cut it in half. Out of habit.'),
    tm(Q, 'Funny how the pie tastes different, eaten alone.'),
    tm(D, 'Pie for one. Doesn\'t sound like a pie. Sounds like a sigh.'),
    tm(Wt, 'More pie! Fewer witnesses! Living the dream!'),
    tm(P, 'I bake very well. It\'s a shame to waste it on one.'),
    tm(Gl, 'Pie doesn\'t taste of much, on your own.'),
  ]);
  L('family.nest.quiet', NS, [
    FB('...I miss {gThem}. Every day. Just a little. Like a stone in a boot.', 'The house is too big now. I didn\'t know a house could grow.'),
    G('I keep {flown}\'s room just so. In case. Daft. {GThey}\'s three lanes away.'),
    tm(C, '...I do miss {gThem}. I put on a brave face. It\'s a very good face.'),
    tm(O, '...Yes. I miss {gThem}. There. I\'ve said it.'),
    tm(S, '...I miss {gThem} terribly. I haven\'t told anyone.'),
    tm(Q, 'I miss the questions. {Flown} always asked such good ones.'),
    tm(D, 'Some evenings I hear {gThem} laughing. It\'s only the wind in the chimney.'),
    tm(Wt, 'I miss {gThem}. I even miss the arguments about the bathwater.'),
    tm(P, 'I do miss {gThem}. I\'m proud, but I miss {gThem}.'),
    tm(Gl, 'It\'s like a door\'s shut that won\'t open again.'),
  ]);
  L('family.nest.room', NS, [
    FB('I don\'t know. I go in and dust. Then I come out.', 'Mathoms. It\'s filling up with mathoms. It\'s the way of things.'),
    G('Keep it for {flown}. And the grandchildren, one day. If.'),
    tm(C, 'A sewing room! A music room! A room for nothing at all!'),
    tm(O, 'A store-room. Practical. ...I\'ve not moved a thing yet.'),
    tm(S, '...Nothing yet. I like to sit in there sometimes.'),
    tm(Q, 'I thought a reading room. Or a room for my collections. Or both. Can you have both?'),
    tm(D, 'I\'ll let the light in. Grow some herbs on the sill. Let it be quiet.'),
    tm(Wt, 'A room for my mathoms. They\'ve been begging for one.'),
    tm(P, 'A proper guest room. For important visitors.'),
    tm(Gl, 'Shut the door on it, I suppose.'),
  ]);
  L('family.nest.yule', NS, [
    FB('Yule. Yes. And birthdays. And whenever the chimney smokes.', 'They do, don\'t they? Like swallows.'),
    tm(C, 'Yule! I\'ll bake for a week!'),
    tm(O, 'For the pudding, mostly. I know {gThem}.'),
    tm(S, '...I hope so.'),
    tm(Q, 'Why Yule, do you think? Something about the dark?'),
    tm(D, 'Like swallows to the same eaves. Yes.'),
    tm(Wt, 'For Yule, and for the washing.'),
    tm(P, 'Of course {gThey}\'ll come. Ours is the best Yule table in the valley.'),
    tm(Gl, 'If nothing better turns up.'),
  ]);
  L('family.nest.jam', NS, [
    FB('Jam. Yes. I\'ve a whole shelf. I\'ll take two.', 'Go and see {gThem}. ...You\'re right. Why do I wait to be asked?'),
    tm(C, 'Jam! Oh, yes! I\'ll take three! I\'m going now!'),
    tm(O, 'Fine. I\'ll take jam. I\'m not staying for tea. ...I might stay for tea.'),
    tm(S, '...I\'ll go. I\'ll leave it on the step if {gThey}\'s busy.'),
    tm(Q, 'Why does nobody turn away jam? It\'s a good question. I\'ll go and test it.'),
    tm(D, 'Jam, and a walk across the lanes. Yes. A good afternoon.'),
    tm(Wt, 'Jam as a bribe. Old as hobbits. I\'ll go.'),
    tm(P, 'My jam is famous. {Flown} will be glad of it.'),
    tm(Gl, 'And if {gThey}\'s not in? ...I\'ll go anyway.'),
  ]);
  L('family.nest.wizroom', NS, [
    FB('Hardly snore? I\'ve heard you in the wagon from three lanes off.', 'Ha! A wizard in the spare room. The neighbours would talk.'),
    tm(C, 'Ha! Would you? Oh, that would be fun!'),
    tm(O, 'You\'d set the curtains alight. I know your sort.'),
    tm(S, '...You could. If you wanted.'),
    tm(Q, 'Do wizards sleep in beds? Or standing up, like horses?'),
    tm(D, 'A wizard in the room where {flown} grew up. That\'d be a fine thing.'),
    tm(Wt, 'Hardly snore. Hardly a wizard. Hardly believable.'),
    tm(P, 'It\'s a very good room. You\'d be honoured.'),
    tm(Gl, 'You\'d leave too. Everybody leaves.'),
  ]);

  // =====================================================================================
  // Their own mum and dad
  // =====================================================================================
  const PA = { parent: has };
  addThread({
    id: 'family.parents', label: (F) => `And how's your ${F.parentWord || 'family'}?`, weight: 1, cool: 4,
    when: (F) => !!F.parent && F.stage !== 'child',
    open: { ask: 'family.pa.open' },
    beats: {
      start: { line: 'family.pa.start', go: [
        { ap: 'ask', say: 'What did you learn from {parent}?', to: 'learned' },
        { ap: 'jest', say: 'Does {parent} still tell you to wear a scarf?', to: 'scarf' },
        { ap: 'ask', say: 'And is {parent} keeping well? Truly?', to: 'old', need: { if: { parentOld: true } } },
      ] },
      learned: { line: 'family.pa.learned', go: [
        { ap: 'warm', say: 'Have you ever told {parent} that?', to: 'told' },
        { ap: 'ask', say: 'And what did you swear you\'d never do like {parent}?', to: 'never' },
      ] },
      scarf: { line: 'family.pa.scarf', go: [
        { ap: 'ask', say: 'And what did you learn from {parent}? Besides scarves.', to: 'learned' },
        { ap: 'warm', say: 'Go and see {parent}. Today, if you can.', to: 'go', need: { if: { parentAway: true } } },
      ] },
      old: { line: 'family.pa.old', fx: { confide: { k: 'family.paold', t: '{Name} worries about {parent} getting on' } }, go: [
        { ap: 'comfort', say: 'Then go and sit with {parent}. Time spent is never wasted.', to: 'go' },
        { ap: 'listen', say: '*You put a hand on their shoulder.*', label: 'A hand on the shoulder', to: 'hand' },
      ] },
      never: { line: 'family.pa.never', go: [
        { ap: 'jest', say: 'And how\'s that going?', to: 'going' },
        { ap: 'warm', say: 'Have you ever told {parent} the good bits, though?', to: 'told' },
      ] },
      told: { line: 'family.pa.told', go: [
        { ap: 'advise', say: 'Go and tell {parent}. Today. Take a cake.', to: 'go', need: { if: { parentAway: true } } },
        { ap: 'warm', say: 'Tell {parent} at supper, then.', to: 'end' },
      ] },
      going: { line: 'family.pa.going', fx: { joke: { k: 'family.becoming', t: '{Name} is turning into {parent}, despite every effort.' } }, end: true },
      hand: { line: 'family.pa.hand', fx: { trust: 0.04, feel: 'drawn_out' }, end: true },
      go: { line: 'family.pa.go', fx: { respect: 0.02, run: visit('parent', 'kin') }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.pa.open', PA, [FB('And your family, {name}? Are they well?'), G('And how\'s your {parentWord}, {name}?', 'I passed {parent} on the lane, {name}. Is {parent} keeping well?')]);
  L('family.pa.start', PA, [
    FB('Oh, well enough. The same as ever.', 'Getting along. As we all are.'),
    G('{Parent}? Same as ever. Still thinks I\'m nine.', 'My {parentWord}\'s grand. Bossy. Grand.'),
    W({ parentWord: 'mum' }, 'Mum? Still sends round a pie every Highday. In case I\'m not eating. I\'m eating.'),
    W({ parentWord: 'dad' }, 'Dad? Still fixing things that aren\'t broken. Mostly my gate.'),
    W({ parentOld: true }, '{Parent}\'s slowing down. Doesn\'t like to admit it. Took the hill in two goes yesterday.'),
    W({ parentAway: false }, 'We still share a roof, {parent} and me. We\'re like two cats on one cushion.'),
    tm(C, '{Parent}\'s wonderful! We had a picnic yesterday! {Parent} fell asleep in the jam!'),
    tm(O, '{Parent}\'s on at me again. About everything. Same as always.'),
    tm(S, '...{Parent} is well. I don\'t visit as much as I should.'),
    tm(Q, '{Parent}\'s taken up something new. Won\'t tell me what. I\'ve been trying to find out for a week.'),
    tm(D, '{Parent} tells the old stories more, lately. Same ones. I don\'t mind.'),
    tm(Wt, '{Parent} is well, and has opinions about my hair. As ever.'),
    tm(P, '{Parent} is very well regarded. I take after {parent}, I\'m told.'),
    tm(Gl, '{Parent}\'s getting older. We all are. I try not to think about it.'),
  ]);
  L('family.pa.learned', PA, [
    FB('How to make bread. How to say sorry. In that order.', 'Never trust a cloud on a Highday. Always carry a handkerchief.'),
    G('{Parent} taught me to whistle. Took a whole summer. {Parent} never gave up.', 'To leave a bit of everything for the next one. A bit of pie. A bit of patience.'),
    W({ job: has, parentWord: ['mum', 'dad'] }, 'The trade, a bit. Before I was a {jobWord} I watched {parent} at work for years.'),
    tm(C, 'To laugh at everything! Even the bad things! Especially those!'),
    tm(O, 'How to stand my ground. And how to slam a door properly.'),
    tm(S, '...That it\'s all right to be quiet. {Parent} never minded.'),
    tm(Q, 'To ask why. {Parent} always had an answer. Usually made up. Still.'),
    tm(D, 'To look at things. Really look. The light on the water. {Parent} would stop for ages.'),
    tm(Wt, 'Timing. {Parent} could get a laugh out of a funeral. Not always the right thing.'),
    tm(P, 'Standards. {Parent} never did anything by halves. Neither do I.'),
    tm(Gl, 'That things don\'t always turn out. But you keep the door open anyway.'),
  ]);
  L('family.pa.scarf', PA, [
    FB('Every day! In summer!', 'Scarves. Vests. Two pairs of socks. I\'m fifty.'),
    G('{Parent} knitted me three this winter. I\'m wearing all of them. Look.'),
    tm(C, 'Ha! Yes! And I wear it! It\'s a lovely scarf!'),
    tm(O, 'And I tell {parent} I\'m a grown hobbit. Then I wear the scarf.'),
    tm(S, '...Yes. I don\'t mind. It\'s nice.'),
    tm(Q, 'Yes! Why do parents always worry about necks? Is there a reason?'),
    tm(D, 'And I always do. Because one day nobody will tell me.'),
    tm(Wt, '{Parent} once sent a scarf by post. To my own hole. Next door.'),
    tm(P, 'I\'m quite capable of dressing myself. But I do look well in a scarf.'),
    tm(Gl, 'Yes. And one day {parent} won\'t. I think about that.'),
  ]);
  L('family.pa.old', PA, [
    FB('...Truly? Slower. Forgets things. Calls me by my aunt\'s name.', 'Not really. I can see it. Getting smaller, somehow.'),
    G('{Parent} fell asleep at supper again. And forgot the bread in the oven. {Parent} never forgets bread.'),
    tm(C, '...Truly? Not as well as I make out. I make jokes so I don\'t cry.'),
    tm(O, '...No. Stubborn as ever, won\'t be helped. Like someone else I could name.'),
    tm(S, '...I\'m frightened. {Parent}\'s slowing down. I don\'t know what I\'ll do.'),
    tm(Q, 'I\'ve been reading about old age. The herbalist\'s books. They don\'t say much that helps.'),
    tm(D, '{Parent} talks about going over the hills. The last adventure. Like it\'s nothing.'),
    tm(Wt, 'Truly? {Parent}\'s still sharper than me. But the knees are going. And the hearing. Selectively.'),
    tm(P, '{Parent} is very strong. ...Less than before. I don\'t like to say it.'),
    tm(Gl, 'No. It won\'t be long now. I can feel it coming.'),
  ]);
  L('family.pa.never', PA, [
    FB('Shout at the hens. And look at me now. I shout at the hens.', 'Fuss. I swore I\'d never fuss. I fuss.'),
    G('Hum while eating. {Parent} hums while eating. I caught myself at it last week.'),
    tm(C, 'Laugh at my own jokes! And I do! Constantly!'),
    tm(O, 'Nag. I swore I\'d never nag. ...I nag.'),
    tm(S, '...Talk to strangers in the lane for hours. That one I\'ve kept.'),
    tm(Q, 'Answer \'because I said so\'. I\'ve said it twice this week.'),
    tm(D, 'Stay. {Parent} never left the valley. I meant to. I haven\'t.'),
    tm(Wt, 'Turn into {parent}. I\'m about halfway. It\'s going very well.'),
    tm(P, 'Be too proud to say sorry. ...Hm.'),
    tm(Gl, 'Worry. I swore I wouldn\'t worry like {parent}. I worry more.'),
  ]);
  L('family.pa.told', PA, [
    FB('...No. You don\'t, do you? You just think it.', 'Told {parent}? We don\'t say things like that in our family.'),
    G('I don\'t think I ever have. {Parent} probably knows. Probably.'),
    tm(C, 'All the time! Well. Not that bit. I should!'),
    tm(O, 'We\'re not that sort of family. ...Maybe we should be.'),
    tm(S, '...No. I wouldn\'t know how.'),
    tm(Q, 'No. I wonder why not. I tell {parent} everything else.'),
    tm(D, 'I meant to, on {parent}\'s last birthday. The words went somewhere.'),
    tm(Wt, 'I told {parent} once. {Parent} asked if I was ill.'),
    tm(P, '{Parent} knows I\'m grateful. I\'m sure of it.'),
    tm(Gl, 'No. And one day it\'ll be too late.'),
  ]);
  L('family.pa.going', PA, [
    FB('Badly. Very badly. I\'m {parent} with a different hat.', 'Ha! It\'s not going. I\'ve given up.'),
    tm(C, 'Terribly! I\'m turning into {parent} and I don\'t even mind!'),
    tm(O, 'Mind your business. ...Badly.'),
    tm(S, '...Not very well. Ha.'),
    tm(Q, 'Interesting question. I think it\'s in the bones. You can\'t outgrow it.'),
    tm(D, 'We become our parents slowly, like a river becomes the sea.'),
    tm(Wt, 'I\'m turning into {parent} at a rate of about one habit a season.'),
    tm(P, 'I am entirely my own hobbit. ...Mostly.'),
    tm(Gl, 'I\'ve already become {parent}. I just haven\'t told anyone.'),
  ]);
  L('family.pa.hand', PA, [
    FB('...Thank you. I didn\'t know I needed that.', '*They lean, just a little, into your hand.*'),
    G('...Thank you. I\'ll go and see {parent} later. Just to sit.'),
    tm(C, '...Thank you. I\'m all right. I am. I will be.'),
    tm(O, '...Hmph. ...Thank you.'),
    tm(S, '...*nods, and doesn\'t say anything for a while*'),
    tm(Q, '...You\'ve done this before. Sat with folk. Haven\'t you?'),
    tm(D, '...You\'re kind. Kinder than wizards are meant to be.'),
    tm(Wt, '...Don\'t. You\'ll set me off. ...Thank you.'),
    tm(P, '...I\'m quite all right. Thank you. ...Stay a moment.'),
    tm(Gl, '...It helps. A little. Thank you.'),
  ]);
  L('family.pa.go', PA, [
    FB('...You\'re right. I\'ll go. Now, before I think of a reason not to.', 'A cake. Yes. {Parent} likes the seed kind.'),
    tm(C, 'I will! I\'ll take a cake and flowers and everything!'),
    tm(O, 'Fine. I\'ll go. If {parent} starts on about my hair I\'m leaving.'),
    tm(S, '...I\'ll go. I\'ll just sit. {Parent} likes that.'),
    tm(Q, 'I\'ll go and ask {parent} all the questions I never asked. There are hundreds.'),
    tm(D, 'I\'ll go. We\'ll sit on the bench and watch the swallows. Like we used to.'),
    tm(Wt, 'I\'ll go. I\'ll tell {parent} the wizard sent me. {Parent} will be unbearable.'),
    tm(P, 'I visit regularly. But I\'ll go today. Why not.'),
    tm(Gl, 'Yes. While I can. While there\'s time.'),
  ]);

  // =====================================================================================
  // Brothers and sisters
  // =====================================================================================
  const SB = { sibling: has };
  addThread({
    id: 'family.siblings', label: (F) => `And your ${F.siblingWord || 'family'}, ${F.sibling || ''}?`.replace(/, \?$/, '?'), weight: 0.9, cool: 5,
    when: (F) => !!F.sibling,
    open: { ask: 'family.sib.open' },
    beats: {
      start: { line: 'family.sib.start', go: [
        { ap: 'ask', say: 'family.sib.askgrowing', to: 'growing' },
        { ap: 'jest', say: 'And who was the favourite? Be honest.', to: 'fav' },
        { ap: 'warm', say: 'You speak of {sibling} fondly.', to: 'fond' },
      ] },
      growing: { line: 'family.sib.growing', go: [
        { ap: 'ask', say: 'What was the worst you ever did to each other?', to: 'worst' },
        { ap: 'warm', say: 'And now? Are you close now?', to: 'now' },
      ] },
      fav: { line: 'family.sib.fav', go: [
        { ap: 'ask', say: 'family.sib.askgrowing', to: 'growing' },
        { ap: 'jest', say: 'I\'ll take that as a yes. You.', to: 'end' },
      ] },
      fond: { line: 'family.sib.fond', go: [
        { ap: 'ask', say: 'Have you told {sibling} that?', to: 'now' },
        { ap: 'listen', say: '*You nod, and let them go on.*', label: 'Let them go on', to: 'worst' },
      ] },
      worst: { line: 'family.sib.worst', fx: { joke: { k: 'family.sibworst', t: 'The worst thing {name} ever did to {sibling}.' } }, go: [
        { ap: 'jest', say: 'And has {sibling} forgiven you?', to: 'now' },
        { ap: 'warm', say: 'That\'s what brothers and sisters are for.', to: 'end' },
      ] },
      now: { line: 'family.sib.now', go: [
        { ap: 'advise', say: 'Go and be kind to {sibling}. Today. For no reason.', to: 'kind' },
        { ap: 'warm', say: 'Good. Keep each other close.', to: 'end' },
      ] },
      kind: { line: 'family.sib.kind', fx: { respect: 0.02, run: visit('sibling', 'kin') }, end: true },
    },
    end: { fond: 0.015 },
  });
  L('family.sib.askgrowing', SB, [FB('Were you close, growing up?', 'Were you thick as thieves, as little ones?'), W({ stage: 'child' }, 'Do you two play together?', 'And do you two get on, mostly?'), W({ stage: 'elder' }, 'Were you close, when you were young?')]);
  L('family.sib.open', SB, [FB('Have you brothers and sisters, {name}?'), G('And how\'s your {siblingWord}, {name}? {Sibling}, isn\'t it?', 'I saw {sibling} at the well, {name}. Your {siblingWord}, I think?')]);
  L('family.sib.start', SB, [
    FB('Oh, the usual. We squabble. We make up. We squabble.', 'We get along. Mostly. From a distance.'),
    G('{Sibling}? Oh, {sibling}\'s all right. Don\'t tell {sibling} I said so.', '{Sibling}\'s my {siblingWord}. That\'s the long and short of it. I\'d die for {sibling}. Don\'t tell.'),
    W({ siblingOlder: true }, '{Sibling}\'s the eldest. Never lets me forget it. Still bosses me about the jam.'),
    W({ siblingOlder: false }, '{Sibling}\'s the baby of the family. Still. Even now. Gets away with everything.'),
    W({ sibCount: { min: 3 } }, 'Which one? There\'s {siblings}. It\'s like a flock of geese at our table.'),
    W({ stage: 'child' }, '{Sibling}? {Sibling}\'s SO annoying. Took my conker. My BEST conker.', '{Sibling} gets all the pudding and I get told off. It\'s not fair.'),
    tm(C, '{Sibling}\'s my best friend! Well, my second-best. Third. Top three!'),
    tm(O, '{Sibling} borrowed my good saw. Two winters ago. I\'m still waiting.'),
    tm(S, '...{Sibling} always did the talking for both of us. Still does.'),
    tm(Q, '{Sibling}\'s so different from me. Same parents, same hole. How? I want to know how.'),
    tm(D, 'We used to make up whole countries, {sibling} and me. Under the table.'),
    tm(Wt, '{Sibling} is the second-best looking in the family. I won\'t say who\'s first.'),
    tm(P, '{Sibling} does well. Not as well as me, but well.'),
    tm(Gl, 'We don\'t see each other much. It\'s how it goes, I suppose.'),
  ]);
  L('family.sib.growing', SB, [
    FB('Close? We shared a bed till we were twelve. Close as two peas. Two kicking peas.', 'Like cat and dog. Then like two cats.'),
    G('{Sibling} taught me to climb the party tree. Then left me at the top.', 'We built a raft once, {sibling} and me. Sank in a minute. Best minute of the summer.'),
    tm(C, 'Oh, yes! We did everything together! Mostly trouble!'),
    tm(O, 'Close enough to fight. Every day. Over everything.'),
    tm(S, '...{Sibling} looked after me. When I was frightened of the dark. Still would, I think.'),
    tm(Q, 'We used to take things apart together. Clocks, mostly. Never put one back right.'),
    tm(D, 'We had a den in the hedge. We\'d sit and tell each other who we\'d be.'),
    tm(Wt, 'Close? {Sibling} once sold me to the tinker for a ribbon. I came back. Nobody had noticed.'),
    tm(P, 'I set a very good example. {Sibling} mostly followed it.'),
    tm(Gl, 'Once. Then we grew up and somehow stopped talking.'),
  ]);
  L('family.sib.fav', SB, [
    FB('Me! ...Mum says it\'s whoever brings the most cake.', 'Neither. The dog. The dog was the favourite.'),
    G('{Sibling}. Obviously. {Sibling} could charm a hen off its eggs.'),
    tm(C, 'Me! No, {sibling}! No, both! We were both perfect!'),
    tm(O, '{Sibling}. Always {sibling}. I\'m not bitter. I\'m quite bitter.'),
    tm(S, '...{Sibling}. I never minded. Much.'),
    tm(Q, 'I\'ve asked. Mum won\'t say. I\'ve been gathering evidence for years.'),
    tm(D, 'Whoever was nearest the fire. That changed with the seasons.'),
    tm(Wt, 'Me. I\'ve never asked, so it\'s never been disproved.'),
    tm(P, 'Me. Naturally.'),
    tm(Gl, '{Sibling}. Of course. Who wouldn\'t pick {sibling}?'),
  ]);
  L('family.sib.fond', SB, [
    FB('Do I? Don\'t tell {sibling}. It\'d go straight to {sibling}\'s head.', '...I suppose I am fond. Underneath.'),
    tm(C, 'I am! {Sibling}\'s lovely! Annoying, but lovely!'),
    tm(O, 'Fond? I put up with {sibling}. That\'s fond, in our family.'),
    tm(S, '...Yes. Very. I\'ve never said.'),
    tm(Q, 'Do I? I hadn\'t noticed. I suppose you notice things.'),
    tm(D, '{Sibling} is the only one who remembers the same things I do. That\'s precious.'),
    tm(Wt, 'Fondly? I was going for neutral with an edge of complaint.'),
    tm(P, 'I\'m fond of all my family. They\'re a credit to me.'),
    tm(Gl, 'I am. I just don\'t show it. Neither does {sibling}.'),
  ]);
  L('family.sib.worst', SB, [
    FB('I put a frog in {sibling}\'s boot. {Sibling} put a frog in my soup. We stopped at frogs.', 'Ate {sibling}\'s birthday cake. All of it. I was six. I still regret nothing.'),
    G('{Sibling} cut off my plait while I slept. I put {sibling}\'s best waistcoat on the scarecrow.'),
    W({ stage: 'child' }, 'I told everyone {sibling} still wets the bed. {Sibling} doesn\'t. Much.'),
    tm(C, 'We dyed the cat green! Both of us! Together! Best day ever!'),
    tm(O, '{Sibling} told Mum it was me who broke the teapot. It was {sibling}. I\'m still owed.'),
    tm(S, '...I hid {sibling}\'s shoes before the dance. I was jealous. I\'ve never said sorry.'),
    tm(Q, 'I read {sibling}\'s diary. Every page. It was mostly about cheese.'),
    tm(D, 'I told {sibling} there were dragons under the bridge. {Sibling} didn\'t cross it for a year.'),
    tm(Wt, 'I taught {sibling} a song with very wrong words. {Sibling} sang it at the Yule party.'),
    tm(P, 'I never did anything to {sibling}. {Sibling} did everything to me.'),
    tm(Gl, 'Left {sibling} behind when the others wanted to play. I still think about it.'),
  ]);
  L('family.sib.now', SB, [
    FB('...Not as much as we should be. Not like it was.', 'We see each other at Yule. We\'re civil. That\'s something.'),
    G('{Sibling}\'s always round for supper. Eats like a horse. I\'d miss it.'),
    tm(C, 'Oh, as thick as thieves! We\'re having a picnic on Highday!'),
    tm(O, 'We nod. In the lane. It\'s a lot, for us.'),
    tm(S, '...I\'d like to be closer. I don\'t know how to start.'),
    tm(Q, 'Close? It\'s a hard thing to measure. We talk. We don\'t talk about things.'),
    tm(D, 'Not like before. I miss the den in the hedge.'),
    tm(Wt, 'We\'re very close. Within shouting distance.'),
    tm(P, 'We get on well. {Sibling} relies on me, of course.'),
    tm(Gl, 'Drifted. It happens. Nobody\'s fault.'),
  ]);
  L('family.sib.kind', SB, [
    FB('For no reason? That\'ll frighten {sibling} half to death. ...I\'ll do it.', 'All right. I\'ll take {sibling} a pie. That\'s kind, in our family.'),
    tm(C, 'Yes! I\'ll take {sibling} flowers! And a cake! And a hug!'),
    tm(O, 'Kind. Fine. If {sibling} asks why, I\'m blaming you.'),
    tm(S, '...I\'ll try. Maybe just a hello.'),
    tm(Q, 'I wonder what {sibling} will say. I\'ll go and find out.'),
    tm(D, 'I\'ll take {sibling} back to the den. If it\'s still there.'),
    tm(Wt, '{Sibling} will think I want something. That\'s half the fun.'),
    tm(P, 'I\'m always kind. But I\'ll go out of my way. Today.'),
    tm(Gl, 'Before it\'s too late. Yes. I\'ll go.'),
  ]);

  // =====================================================================================
  // Grandchildren
  // =====================================================================================
  const GK = { grandkid: has };
  addThread({
    id: 'family.grandkids', label: 'And the grandchildren?', weight: 1.2, cool: 4,
    when: (F) => !!F.grandkid,
    open: { warm: 'family.gk.open' },
    beats: {
      start: { line: 'family.gk.start', go: [
        { ap: 'ask', say: 'And who\'s the favourite? I won\'t tell.', to: 'fav' },
        { ap: 'jest', say: 'Spoiling them rotten, I suppose.', to: 'spoil' },
        { ap: 'warm', say: 'They\'re lucky to have you.', to: 'lucky' },
      ] },
      fav: { line: 'family.gk.fav', go: [
        { ap: 'ask', say: 'Do you tell them stories?', to: 'stories' },
        { ap: 'jest', say: 'So {grandkid}, then.', to: 'end' },
      ] },
      spoil: { line: 'family.gk.spoil', go: [
        { ap: 'ask', say: 'Do you tell them stories?', to: 'stories' },
        { ap: 'warm', say: 'That\'s what grandparents are for.', to: 'lucky' },
      ] },
      lucky: { line: 'family.gk.lucky', go: [
        { ap: 'ask', say: 'Did you have grandparents like that?', to: 'own', need: { open: 1 }, soft: true },
        { ap: 'ask', say: 'Do you tell them stories?', to: 'stories' },
      ] },
      stories: { line: 'family.gk.stories', go: [
        { ap: 'tale', say: 'I could tell them one or two. About a dragon and a hobbit.', to: 'tale' },
        { ap: 'warm', say: 'They\'ll remember those all their lives.', to: 'end' },
      ] },
      own: { line: 'family.gk.own', fx: { trust: 0.03, confide: { k: 'family.gran', t: 'What {name}\'s own grandparents were like' } }, end: true },
      tale: { line: 'family.gk.tale', fx: { promise: { k: 'family.gktale', t: 'You said you\'d tell {grandkid} a dragon story', days: 7 } }, end: true },
    },
    end: { fond: 0.03 },
  });
  L('family.gk.open', GK, [FB('And the grandchildren, {name}?'), G('And how\'s young {grandkid}, {name}?', 'I hear you\'re a grandparent, {name}. How does it suit you?')]);
  L('family.gk.start', GK, [
    FB('Oh, wizard. It\'s all the fun and none of the nights.', 'Wonderful. They come, they eat, they go home. Perfect.'),
    G('{Grandkid}\'s the light of my life. Don\'t tell the others.', '{Grandkid} came round and ate all the biscuits. All of them. I was so proud.'),
    W({ grandCount: { min: 3 } }, 'All {grandCountWord} of them! I need a bigger biscuit tin.'),
    tm(C, 'Oh, they\'re wonderful! Every one of them! I\'ve a drawing from each on the wall!'),
    tm(O, 'Noisy. Sticky. Into my pipe-rack. ...I\'d fight a troll for any of them.'),
    tm(S, '...{Grandkid} holds my hand on the way to the well. Every time.'),
    tm(Q, '{Grandkid} asks me everything! What it was like when I was small! I\'m remembering things I forgot!'),
    tm(D, 'I see my own children in them. And my parents. It\'s like a river coming round again.'),
    tm(Wt, 'Grandchildren are your revenge on your children. And it\'s sweet.'),
    tm(P, 'The finest grandchildren in the valley. Naturally.'),
    tm(Gl, 'I hope I\'m around to see them grow. That\'s all.'),
  ]);
  L('family.gk.fav', GK, [
    FB('I haven\'t got a favourite. ...It\'s {grandkid}.', 'Whoever\'s nearest the biscuit tin.'),
    tm(C, 'All of them! Every single one! ...{Grandkid}. Shh.'),
    tm(O, 'Don\'t ask such questions. ...{Grandkid}. Don\'t you dare repeat it.'),
    tm(S, '...I couldn\'t say. ...{Grandkid}.'),
    tm(Q, 'That\'s a fascinating question. I\'ve no answer. I\'ll think about it.'),
    tm(D, 'Each one\'s my favourite for a different reason.'),
    tm(Wt, 'The quiet one. Which none of them are.'),
    tm(P, 'I\'m scrupulously fair. ...Mostly {grandkid}.'),
    tm(Gl, 'Whichever one remembers me, after.'),
  ]);
  L('family.gk.spoil', GK, [
    FB('Rotten! Sweets in every pocket. I rattle.', 'That\'s the job! Spoil them and send them home.'),
    tm(C, 'Absolutely! It\'s the best part! Seed-cake for breakfast!'),
    tm(O, 'Spoil them? I\'m strict. ...There may be toffees.'),
    tm(S, '...A little. I keep a jar. Just for them.'),
    tm(Q, 'Is it spoiling, though? Or just making up for lost time?'),
    tm(D, 'I give them the things I never had. Is that spoiling?'),
    tm(Wt, 'Rotten to the core. Like a good apple left too long. Sweet, though.'),
    tm(P, 'I believe in treats as a reward. Frequent rewards.'),
    tm(Gl, 'While I can. While there\'s time.'),
  ]);
  L('family.gk.lucky', GK, [
    FB('...Do you think so? That\'s kind.', 'Lucky? I\'m the lucky one.'),
    tm(C, 'Oh, I\'m the lucky one! Every single day!'),
    tm(O, 'Hmph. They\'re lucky I put up with them. ...I\'m lucky. There.'),
    tm(S, '...Thank you. I hope they think so.'),
    tm(Q, 'Lucky? I wonder if they know. Children don\'t, do they?'),
    tm(D, 'It feels like being given a second go. A gentler one.'),
    tm(Wt, 'Lucky is a strong word. Well-fed is better.'),
    tm(P, 'They are. I\'m a very good grandparent.'),
    tm(Gl, 'I hope they remember me kindly.'),
  ]);
  L('family.gk.stories', GK, [
    FB('Every night they stay. The same three. They know them better than me.', 'All the old ones. And some I make up. They can tell.'),
    tm(C, 'Yes! With all the voices! The troll voice is very popular!'),
    tm(O, 'One story. Then bed. ...Then another. Then bed.'),
    tm(S, '...Quiet ones. About rabbits. They fall asleep halfway.'),
    tm(Q, 'They ask me for true stories. About the old days. I\'m running out.'),
    tm(D, 'Stories about the stars. Where they came from. I make it up as I go.'),
    tm(Wt, 'I tell them the story of how their {role} was born. With embellishments.'),
    tm(P, 'The family history. The great deeds. They should know where they come from.'),
    tm(Gl, 'Sad ones, mostly. They like sad ones. I don\'t know why.'),
  ]);
  L('family.gk.own', GK, [
    FB('My gran smelled of lavender and pipe-weed. She let me win at everything.', 'My grandad carried me on his shoulders to the fair. I could see the whole world.'),
    tm(C, 'Oh, yes! Gran had a laugh like a hen! I can hear it now!'),
    tm(O, 'Grandad was a terror. Shouted at everything. I adored him.'),
    tm(S, '...My gran let me sit under the table while the grown-ups talked. I loved that.'),
    tm(Q, 'My grandad knew every bird by its song. I still try to remember them all.'),
    tm(D, 'My gran used to say the moon was a lamp someone forgot to blow out.'),
    tm(Wt, 'My grandad taught me to cheat at cards. I\'ve passed it on. It\'s an heirloom.'),
    tm(P, 'My grandparents were very respected. I try to live up to them.'),
    tm(Gl, 'I hardly knew them. That\'s why I try so hard with mine.'),
  ]);
  L('family.gk.tale', GK, [
    FB('Would you? Oh, {grandkid} would talk of nothing else for a season.', 'A dragon and a hobbit! Mind it ends well.'),
    tm(C, 'Oh, yes! Come for tea! I\'ll make a dragon cake!'),
    tm(O, 'Not too frightening. I\'m the one up in the night with them.'),
    tm(S, '...Would you? {Grandkid} would be so happy.'),
    tm(Q, 'Is it a true story? Is the hobbit anyone I know?'),
    tm(D, 'A wizard\'s tale for my grandchild. That\'s a gift that lasts.'),
    tm(Wt, 'A dragon story. I\'ll warn the parents. And hide the matches.'),
    tm(P, '{Grandkid} deserves the very best stories. Yours will do.'),
    tm(Gl, 'Make sure the hobbit comes home. Please.'),
  ]);

  // =====================================================================================
  // The children's own view of home
  // =====================================================================================
  const KH = { stage: 'child' };
  addThread({
    id: 'family.kidhome', label: 'What\'s it like at home?', weight: 1.2, cool: 3,
    when: (F) => F.stage === 'child' && (!!F.mum || !!F.dad || !!F.sibling),
    open: { ask: 'family.kh.open' },
    beats: {
      start: { line: 'family.kh.start', go: [
        { ap: 'ask', say: 'And who\'s the bossiest?', to: 'bossy' },
        { ap: 'jest', say: 'And do you always do as you\'re told?', to: 'told' },
        { ap: 'warm', say: 'They love you very much, you know.', to: 'love' },
      ] },
      bossy: { line: 'family.kh.bossy', go: [
        { ap: 'ask', say: 'And who\'s the best at cuddles?', to: 'cuddles' },
        { ap: 'jest', say: 'Shall I turn them into a frog? Just for an afternoon?', to: 'frog' },
      ] },
      told: { line: 'family.kh.told', fx: { confide: { k: 'family.kidsecret', t: 'Something {name} did that nobody at home knows about', secret: true } }, go: [
        { ap: 'jest', say: 'Your secret\'s safe with me. Wizards are terrible at telling.', to: 'safe' },
        { ap: 'advise', say: 'Perhaps you should own up. It\'s easier than you\'d think.', to: 'own', fx: { lean: 'hill' } },
      ] },
      love: { line: 'family.kh.love', go: [
        { ap: 'ask', say: 'And who\'s the best at cuddles?', to: 'cuddles' },
        { ap: 'ask', say: 'What do you want to be, when you\'re grown?', to: 'grown' },
      ] },
      cuddles: { line: 'family.kh.cuddles', go: [
        { ap: 'ask', say: 'What do you want to be, when you\'re grown?', to: 'grown' },
        { ap: 'warm', say: 'That sounds like a good home.', to: 'end' },
      ] },
      frog: { line: 'family.kh.frog', fx: { joke: { k: 'family.frog', t: 'The wizard offered to turn the bossy one into a frog.' }, fond: 0.03 }, end: true },
      safe: { line: 'family.kh.safe', fx: { trust: 0.05 }, end: true },
      own: { line: 'family.kh.own', fx: { respect: 0.03 }, end: true },
      grown: { line: 'family.kh.grown', fx: { learn: ['family.kidgrown', '{Name} has big plans for when {they}\'s grown'] }, end: true },
    },
    end: { fond: 0.03 },
  });
  L('family.kh.open', KH, [FB('What\'s it like at home, {name}?', 'And who\'s at home with you, {name}?')]);
  L('family.kh.start', KH, [
    FB('Noisy! And there\'s always soup.', 'It\'s all right. There\'s a cat. The cat\'s not ours. It just comes.'),
    W({ mum: has }, 'Mum makes the best pancakes in the world. In the WORLD.', 'Mum sings when she cooks. Really loud. I sing too. Then the dog howls.'),
    W({ dad: has }, 'Dad snores like a bear. Like a REAL bear. I\'ve never heard a real bear but I know.', 'Dad lets me help in the garden. I\'m in charge of worms.'),
    W({ sibling: has }, '{Sibling} hogs the blanket. And the pudding. And the window seat.', '{Sibling} said I was adopted. From the goblins. I\'m NOT.'),
    W({ babySib: has }, 'There\'s a new baby. {BabySib}. {BabySib} just cries and eats. Like a little pig. I love {babySib}.'),
    W({ band: 'toddler' }, 'Mama! Mama is home! And DOG!', 'Home has a round door! I can open it! Nearly!'),
    W({ band: 'youth' }, 'Home\'s fine. They don\'t understand anything. But it\'s fine.', 'Everyone\'s always in my room. It\'s not a room, it\'s a passage with a bed.'),
    W({ homeless: true }, 'We haven\'t got a home yet. We sleep under the big tree. It\'s like camping. Forever.'),
    W({ fullHouse: true }, 'Everyone\'s squashed in. I sleep in a drawer. A big drawer. It\'s cosy.'),
    W({ rift: true }, 'Home\'s weird. Mum says it\'s too quiet. I like quiet. I like the frogs.'),
    W({ mood: ['low', 'miserable'] }, 'Everyone\'s cross at home today. I got told off. For nothing. Nearly nothing.'),
  ]);
  L('family.kh.bossy', KH, [
    FB('Mum. No, Dad. No, the cat.', 'Everyone except me! I\'m never in charge!'),
    W({ mum: has }, 'Mum! Mum says \'wash behind your ears\'. Why? Nobody looks there!'),
    W({ dad: has }, 'Dad says \'because I said so\'. That\'s not a REASON.'),
    W({ sibling: has, siblingOlder: true }, '{Sibling}! {Sibling} thinks being older means being the boss! It doesn\'t!'),
    W({ sibling: has, siblingOlder: false }, '{Sibling}\'s little but SO bossy. Bossier than a hen.'),
    W({ band: 'youth' }, 'Everyone. All of them. All the time. I\'m nearly grown, you know.'),
    W({ band: 'toddler' }, 'ME! I\'m bossy! NO NO NO!'),
  ]);
  L('family.kh.told', KH, [
    FB('...Mostly. Not always. Don\'t tell.', 'Do you promise not to tell? ...I ate the whole pie. The whole one. And blamed the dog.'),
    W({ sibling: has }, 'I hid {sibling}\'s boots in the well bucket. Everyone looked for DAYS.'),
    W({ band: 'young' }, 'I drew on the wall. Behind the dresser. A dragon. It\'s still there.'),
    W({ band: 'school' }, 'I go down to the river on my own. Past the mill. I\'m not allowed. I\'m very careful.'),
    W({ band: 'youth' }, 'I went to the Badger once. Just to look. I had a cider. Half. It was horrible.'),
    W({ band: 'toddler' }, 'NO! ...Yes. I put the egg in the boot.'),
    W({ rift: true }, 'I took apart Mum\'s scanner. To see the little lights. I put it back. Mostly.'),
  ]);
  L('family.kh.love', KH, [
    FB('I know. They tell me. Every day. It\'s a bit much.', '...I know. I love them too. Don\'t tell anyone.'),
    W({ band: 'youth' }, 'Ugh. I know. Don\'t say it so loud.'),
    W({ band: ['toddler', 'young'] }, 'I love them THIS much! *arms out wide*'),
    W({ mood: ['low', 'miserable'] }, '...Do they? Even when I\'m bad?'),
    W({ homeless: true }, 'We\'ll have a home soon. Mum says. Then we\'ll have a door.'),
  ]);
  L('family.kh.cuddles', KH, [
    FB('Mum. Mum is warm like a teapot.', 'Dad. Dad does the bear hug. It squashes all the air out.'),
    W({ sibling: has }, '{Sibling}. But only when nobody\'s looking.'),
    W({ band: 'youth' }, 'I don\'t DO cuddles any more. ...Gran. Gran does.'),
    W({ band: 'toddler' }, 'Me! I give the best cuddles! Want one? *squeezes your knee*'),
    W({ babySib: has }, '{BabySib}! {BabySib} is like a warm loaf.'),
  ]);
  L('family.kh.frog', KH, [
    FB('YES! Do it! A big green one!', 'Can you? Really? ...No. They\'d be sad. Can it be a nice frog?'),
    W({ band: 'youth' }, 'Ha! ...Tempting. Very tempting.'),
    W({ band: 'toddler' }, 'FROG! Ribbit! RIBBIT!'),
    W({ mood: ['low', 'miserable'] }, '...Ha. Maybe a small frog. Just for an hour.'),
  ]);
  L('family.kh.safe', KH, [
    FB('Pinkie promise? Okay. You\'re my best wizard.', 'Thanks! You\'re all right, you are.'),
    W({ band: 'youth' }, 'Cheers. You\'re less terrible than most grown-ups.'),
    W({ band: 'toddler' }, 'Shhhhh! Secret! *puts finger on your nose*'),
  ]);
  L('family.kh.own', KH, [
    FB('...Do I have to? ...Okay. If you come with me.', 'Own up? ...I\'ll tell Mum. After supper. After pudding.'),
    W({ band: 'youth' }, 'Ugh. You sound like Gran. ...Fine. I will.'),
    W({ band: 'toddler' }, 'Sorry egg. Sorry boot.'),
  ]);
  L('family.kh.grown', KH, [
    FB('A wizard! Like you! With a hat AND a staff!', 'A baker. Then I can eat all the buns.'),
    W({ band: 'youth' }, 'I don\'t know. Something. Somewhere. Not here. ...Maybe here.', 'An adventurer. Don\'t tell Mum.'),
    W({ band: 'toddler' }, 'A DOG.', 'Big!'),
    W({ riftWays: true }, 'A rift-runner! Through the sky doors! And back for tea.'),
    W({ rift: true }, 'A grid-tech like my mum. Or a farmer. Can you be both?'),
    W({ mum: has }, 'Like Mum. Mum can do everything.'),
    W({ dad: has }, 'Like Dad. Dad can lift a whole pig.'),
  ]);

  // =====================================================================================
  // Their turn: a child asks the wizard about his own family
  // =====================================================================================
  addThread({
    id: 'family.kidask', theirs: true, label: 'Did you have a mum?', cool: 5, ask: '{Name} tugs at your robe.',
    when: (F) => F.stage === 'child' && F.met && F.band !== 'toddler',
    beats: {
      start: { line: 'family.kidask.q', go: [
        { ap: 'tale', say: 'A long, long time ago. She sang to the stars to make them come out.', to: 'stars' },
        { ap: 'jest', say: 'No. I was found under a toadstool, fully bearded.', to: 'toadstool' },
        { ap: 'share', say: 'Everyone has someone. Mine was a very long time ago.', to: 'long' },
      ] },
      stars: { line: 'family.kidask.stars', fx: { lean: 'hill' }, go: [
        { ap: 'warm', say: 'Your mum and dad sing too, I\'ll bet. In their way.', to: 'end' },
        { ap: 'tale', say: 'And that\'s why the stars come out at dusk. They\'re listening.', to: 'end', fx: { fond: 0.02 } },
      ] },
      toadstool: { line: 'family.kidask.toadstool', fx: { joke: { k: 'family.toadstool', t: 'The wizard was found under a toadstool, fully bearded.' } }, go: [
        { ap: 'share', say: 'No. I had a mother. A long time ago. I still miss her.', to: 'long' },
      ] },
      long: { line: 'family.kidask.long', fx: { trust: 0.04 }, end: true },
    },
    end: { fond: 0.03 },
  });
  L('family.kidask.q', KH, [
    FB('Wizard? Did you have a mum? Wizards have mums?', 'Have you got a family? Where are they? Are they wizards too?'),
    W({ band: 'young' }, 'Did your mum make you wear a scarf? Is that why you have a beard?'),
    W({ band: 'school' }, 'Do wizards have brothers and sisters? Do they do magic at each other?'),
    W({ band: 'youth' }, 'Where\'s your family, then? You never talk about them. Everyone wonders.'),
    W({ homeless: true }, 'Did you have a home? With a door? We don\'t have one yet.'),
    W({ rift: true }, 'Back where I come from, everyone\'s on the grid. Are wizards on a grid? Do they ping their mums?'),
  ]);
  L('family.kidask.stars', KH, [
    FB('Really? To the STARS? Did they come?', 'Wow. Can you do it? Can you sing them out?'),
    W({ band: 'youth' }, '...That\'s actually quite nice. Don\'t tell anyone I said that.'),
    W({ band: 'young' }, 'My mum sings to the KETTLE. It comes out too. The steam.'),
    W({ rift: true }, 'Where I come from there\'s too much light to see stars. I like it here for that.'),
  ]);
  L('family.kidask.toadstool', KH, [
    FB('NO you weren\'t! ...Were you?', 'Ha! A tiny wizard with a big beard! Under a mushroom!'),
    W({ band: 'youth' }, 'Ha ha. Very funny. ...Seriously, though.'),
    W({ band: 'young' }, 'I\'m going to look under ALL the toadstools now. For baby wizards.'),
  ]);
  L('family.kidask.long', KH, [
    FB('...Oh. Do you want a hug? I give good hugs.', 'You can share my mum, if you like. She won\'t mind.'),
    W({ band: 'youth' }, '...Sorry. I didn\'t mean to make you sad. Our family can be your family. Sort of.'),
    W({ band: 'young' }, 'You can have tea at ours! Mum makes too much! Always!'),
    W({ homeless: true }, 'We haven\'t got a house. But you can come round to our tree.'),
  ]);
});
