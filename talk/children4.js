'use strict';
// ---------------------------------------------------------------------------
// Talking with the children, part four: the youths, and the children of the
// rifts. Tweens thinking about a trade, sweethearts, leaving home and coming
// of age; scrapes they'd rather their parents didn't hear about; how things
// are at home. Rift-born children remembering Neverdark, hill children taken
// with gadgets and the Relay, and the ones growing up both ways at once. And
// two more for the littlest: a nursery rhyme, and peekaboo.
// ---------------------------------------------------------------------------

talkPack('children4', () => {
  const has = (x) => x != null && x !== false && x !== '' && !(Array.isArray(x) && !x.length);
  const kid = (F) => F.stage === 'child';
  const youth = (F) => kid(F) && F.band === 'youth';
  const both = (amt) => (T, v) => { if (v.isChild() && typeof nudgeUp === 'function') { nudgeUp(v, 'hill', amt, 'The wizard said both ways have their good'); nudgeUp(v, 'rift', amt, null, true); } };

  // =====================================================================================
  // A trade
  // =====================================================================================
  addThread({
    id: 'child.youth.trade', label: 'Thought about a trade?', weight: 1.3, cool: 4,
    when: (F) => youth(F) && F.childYears >= 16 && !!F.childCalling,
    rel: (F) => (F.childComing ? 1.8 : 1.1),
    open: { ask: 'child.youth.trade.open' },
    beats: {
      start: { line: 'child.youth.trade.start', go: [
        { ap: 'ask', say: 'And what does your family want for you?', to: 'family' },
        { ap: 'jest', say: 'You could always be a wizard. The hours are terrible, mind.', to: 'hours' },
        { ap: 'advise', say: 'Try your hand at a few. Nobody knows till they\'ve tried.', to: 'try' },
      ] },
      hours: { line: 'child.youth.trade.hours', go: [
        { ap: 'ask', say: 'Seriously, though. What does your family want for you?', to: 'family' },
        { ap: 'advise', say: 'Seriously, though: try a few. Nobody knows till they\'ve tried.', to: 'try' },
      ] },
      family: { line: 'child.youth.trade.family', go: [
        { ap: 'advise', say: 'Your life\'s your own to make, {name}.', to: 'own', fx: { lean: 'rift' } },
        { ap: 'advise', say: 'There\'s wisdom in a family trade. It\'s kept you all fed.', to: 'kept', fx: { lean: 'hill' } },
        { ap: 'listen', say: '*You say nothing, and let them work it out aloud.*', label: 'Let them think aloud', to: 'torn' },
      ] },
      torn: { line: 'child.youth.trade.torn', fx: { confide: { k: 'child.trade.torn', t: '{Name} is torn between what the family wants and what {they} want' } }, go: [
        { ap: 'comfort', say: 'You don\'t have to know yet. Nobody does, at your age.', to: 'yet' },
        { ap: 'advise', say: 'Do the one you\'d do for nothing. Then you\'ll never mind the work.', to: 'nothing', fx: { run: both(0.025) } },
      ] },
      yet: { line: 'child.youth.trade.yet', fx: { trust: 0.04 }, end: true },
      nothing: { line: 'child.youth.trade.nothing', fx: { respect: 0.04, remember: 'The wizard says do the work you\'d do for nothing.', rv: 2 }, end: true },
      own: { line: 'child.youth.trade.own', fx: { respect: 0.02, remember: 'The wizard says my life is my own to make.' }, end: true },
      kept: { line: 'child.youth.trade.kept', fx: { respect: 0.02 }, end: true },
      try: { line: 'child.youth.trade.try', go: [
        { ap: 'advise', say: 'Ask {childCallingA} if you can help of a morning. Just watch, at first.', to: 'help' },
        { ap: 'warm', say: 'I\'ll put a word in for you, if you like.', to: 'word', fx: { promise: { k: 'child.trade.word', t: 'You said you\'d put a word in for {name} with the {childCalling}s', days: 8 } } },
      ] },
      help: { line: 'child.youth.trade.help', fx: { respect: 0.02 }, end: true },
      word: { line: 'child.youth.trade.word', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.youth.trade.open', [
    { text: ['Thought about a trade yet, {name}?', 'You\'re nearly grown, {name}. What will you do with yourself?', 'What\'s it to be, {name}? When you\'re of age?'] },
    { if: { childComing: true }, text: ['Not long now, {name}. Have you settled on a trade?'] },
    { if: { childApprentice: has }, text: ['How\'s the {childApprentice}\'s work treating you, {name}?'] },
  ]);
  lines('child.youth.trade.start', [
    { text: ['{ChildCallingA}, probably. Everyone says I\'ve the hands for it.', 'I keep thinking {childCallingA}. Then I think something else. Then {childCallingA} again.', 'I don\'t know. {ChildCallingA}? It sounds so... final.'] },
    { if: { childApprentice: has }, pri: 1, text: ['I\'ve been helping the {childApprentice}. I like it. I think I\'m good at it. Don\'t tell them I said.', 'Learning the {childApprentice}\'s trade. My arms ache. In a good way.'] },
    { if: { childCallingKey: 'tinker' }, text: ['Tinkering. With the rift-folk. Gran nearly dropped the teapot when I said.', 'I want to work on the Relay. Wires, signal, the lot. It\'s the future.'] },
    { if: { childCallingKey: 'storyteller' }, text: ['Storyteller, maybe. Under the old oak. Is that a proper trade? It should be.'] },
    { if: { childCallingKey: ['farmer', 'grower', 'herder', 'orchardist'] }, text: ['The land. Same as everyone. I don\'t mind. I like dirt under my nails.', 'Outdoors work. I can\'t sit still indoors. I\'d go mad.'] },
    { if: { childCallingKey: ['baker', 'miller', 'brewer', 'innkeeper'] }, text: ['Something with food. Obviously. I\'m a hobbit.', 'I want to feed people. That\'s the whole plan. Feed people.'] },
    { if: { childParentJob: has }, text: ['Everyone assumes I\'ll be {childParentJob}, like at home. I might not.'] },
    { if: { childTween: true }, text: ['I\'ve been thinking about it a lot. {ChildCallingA}, I reckon. I\'m old enough to know my own mind.'] },
    { if: { childTemper: 'shy' }, text: ['...{ChildCallingA}. If they\'d have me. I\'m not sure they would.'] },
    { if: { childTemper: 'ornery' }, text: ['Whatever I like. Nobody\'s telling me.'] },
    { if: { childTemper: 'curious' }, text: ['All of them, if I could. Is that allowed? Can you do all of them?'] },
    { if: { childTemper: 'gloomy' }, text: ['Does it matter? I\'ll end up doing whatever there\'s a gap for.'] },
    { if: { rift: true }, text: ['Back home I\'d have been a courier by now. Here... {childCallingA}? The work\'s so slow. I like it, though.'] },
  ]);
  lines('child.youth.trade.hours', [
    { text: ['Ha! And the hat. I\'d need the hat.', 'Terrible hours and no pay and dragons. Where do I sign?', 'You make it sound so appealing.'] },
    { if: { childTemper: 'cheerful' }, text: ['Ha! I\'d be brilliant! I\'d do fireworks every night!'] },
    { if: { childTemper: 'ornery' }, text: ['Very funny.'] },
  ]);
  lines('child.youth.trade.family', [
    { text: ['They want me close. Something steady. Something they understand.', 'They don\'t say. They just leave jobs where I\'ll trip over them.', 'They want me happy. That\'s worse. Then I have to work out what happy is.'] },
    { if: { childParentJob: (x) => !x }, text: ['They don\'t say. They just look at me when there\'s work going.'] },
    { if: { childParentWord: has, childParentJob: has }, text: ['{ChildParentWord} wants me in the family trade. {ChildParentJob}. Same as always.', '{ChildParentWord} keeps leaving the {childParentJob}\'s tools where I\'ll trip over them. It\'s not subtle.'] },
    { if: { childUpb: 'rift' }, text: ['They think I spend too long with the rift-folk. They\'re probably right.'] },
    { if: { childUpb: 'hill' }, text: ['They want me to keep things as they are. So do I, mostly. Mostly.'] },
    { if: { rift: true }, text: ['My folks want me to fit in here. Be a proper hill-hobbit. I\'m trying.'] },
  ]);
  lines('child.youth.trade.torn', [
    { text: ['...I want to make them proud. But I want to want my own thing. Does that make sense?', '...If I do what they want I\'ll always wonder. If I don\'t, they\'ll always wonder.', '...I\'m scared of choosing wrong and being stuck with it for a hundred years.'] },
    { if: { childTemper: 'shy' }, text: ['...I\'ve never said this to anyone. I don\'t want what they want.'] },
    { if: { childTemper: 'gloomy' }, text: ['...Whatever I pick, somebody\'s disappointed. Usually me.'] },
  ]);
  lines('child.youth.trade.yet', [
    { text: ['Really? Everyone acts like I should.', 'That\'s... a relief, honestly.', 'Nobody does? Not even you, at my age?'] },
  ]);
  lines('child.youth.trade.nothing', [
    { text: ['The one I\'d do for nothing. ...I know which that is.', 'Huh. That makes it easier. And harder.', 'That\'s good, that. I\'m going to think about that.'] },
  ]);
  lines('child.youth.trade.own', [
    { text: ['My own to make. Yes. Yes, it is.', 'You can\'t say that to my folks. ...I might, though.', 'I\'ll remember that when they\'re going on at me.'] },
    { if: { childParentWord: has }, text: ['You can\'t say that to my {childParentWord}.'] },
  ]);
  lines('child.youth.trade.kept', [
    { text: ['That\'s true. It has. I don\'t say thank you enough.', 'I suppose. There\'s something in carrying it on.', 'Hm. You sound like Gran. That\'s not a bad thing.'] },
    { if: { childTemper: 'ornery' }, text: ['Hmph. Maybe. I still might not.'] },
  ]);
  lines('child.youth.trade.try', [
    { text: ['A few? How?', 'I suppose I\'ve only ever tried the one.', 'Try them? Would they let me?'] },
  ]);
  lines('child.youth.trade.help', [
    { text: ['Just watch. I can do watching. I\'m good at watching.', 'All right. Tomorrow morning. Early. Ugh.', 'I\'ll ask. If they say no I\'m blaming you.'] },
  ]);
  lines('child.youth.trade.word', [
    { text: ['From the WIZARD? They\'d have to listen.', 'Would you? That\'s... thank you.', 'Don\'t make me sound too good. Then I\'d have to be.'] },
  ]);

  // =====================================================================================
  // Sweet on someone
  // =====================================================================================
  addThread({
    id: 'child.youth.sweet', label: 'Sweet on anyone?', weight: 1.2, cool: 5,
    when: (F) => youth(F) && !!F.childCrush,
    open: { ask: 'child.youth.sweet.open' },
    beats: {
      start: { line: 'child.youth.sweet.start', go: [
        { ap: 'jest', say: 'I couldn\'t help noticing you looking at {childCrush}.', to: 'caught' },
        { ap: 'ask', say: 'Anyone special, then? You can tell an old wizard.', to: 'confess', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'Never mind. It\'s none of my business.', to: 'relief' },
      ] },
      caught: { line: 'child.youth.sweet.caught', go: [
        { ap: 'warm', say: 'There\'s nothing wrong with it, you know.', to: 'confess' },
        { ap: 'jest', say: 'You went very pink just then. Like a radish.', to: 'radish' },
      ] },
      radish: { line: 'child.youth.sweet.radish', fx: { joke: { k: 'child.sweet.radish', t: '{Name} goes as pink as a radish at the mention of {childCrush}.' } }, go: [
        { ap: 'warm', say: 'I\'m sorry. I\'ll stop. Tell me about them?', to: 'confess' },
      ] },
      relief: { line: 'child.youth.sweet.relief', go: [
        { ap: 'listen', say: '*You wait.*', label: 'Wait', to: 'confess' },
        { ap: 'warm', say: 'Only if you want to.', to: 'confess' },
      ] },
      confess: { line: 'child.youth.sweet.confess', fx: { confide: { k: 'child.sweet', t: '{Name} is sweet on {childCrush}', secret: true } }, go: [
        { ap: 'advise', say: 'Tell them. Kindly, and soon. Waiting only makes it heavier.', to: 'tell', fx: { lean: 'rift' } },
        { ap: 'advise', say: 'Take them a flower. The old way. It still works.', to: 'flower', fx: { lean: 'hill' } },
        { ap: 'comfort', say: 'Whatever comes of it, it\'s a fine thing to feel.', to: 'fine' },
      ] },
      tell: { line: 'child.youth.sweet.tell', fx: { respect: 0.03, remember: 'The wizard says to tell {childCrush}. Kindly, and soon.' }, end: true },
      flower: { line: 'child.youth.sweet.flower', fx: { respect: 0.02, remember: 'The wizard says take {childCrush} a flower.' }, end: true },
      fine: { line: 'child.youth.sweet.fine', fx: { trust: 0.05, promise: { k: 'child.sweet', t: 'You promised to say nothing about {name} and {childCrush}', days: 20 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.youth.sweet.open', [
    { text: ['You\'ve a look about you, {name}. A dreamy sort of look.', 'Anyone caught your eye, {name}?', 'You keep looking down the lane, {name}. Expecting someone?'] },
  ]);
  lines('child.youth.sweet.start', [
    { text: ['What? No. Who? Nobody. Why?', 'I don\'t know what you mean.', 'I\'ve got a lot on my mind. Trades and that.'] },
    { if: { childTemper: 'shy' }, text: ['*goes scarlet from the ears down*', '...N-no.'] },
    { if: { childTemper: 'cheerful' }, text: ['Ha! Is it that obvious? It\'s that obvious, isn\'t it.'] },
    { if: { childTemper: 'ornery' }, text: ['Mind your own business, wizard.'] },
    { if: { childTemper: 'gloomy' }, text: ['Doesn\'t matter if I am. Nobody looks at me.'] },
    { if: { childTween: true }, text: ['I\'m nearly of age. I\'m allowed to look at people.'] },
  ]);
  lines('child.youth.sweet.caught', [
    { text: ['I was NOT. I was looking past them. At a tree.', 'Everyone looks at {childCrush}. That\'s just... looking.', 'Did anyone else notice? Did {childCrush} notice?'] },
    { if: { childTemper: 'shy' }, text: ['*hides {their} face in {their} hands*'] },
    { if: { childTemper: 'ornery' }, text: ['Don\'t you dare say that where anyone can hear.'] },
  ]);
  lines('child.youth.sweet.radish', [
    { text: ['I did NOT go pink. It\'s the sun.', 'A RADISH? Thanks.', 'Stop it. Stop it. ...Am I still pink?'] },
  ]);
  lines('child.youth.sweet.relief', [
    { text: ['Good. ...Well. It\'s {childCrush}. All right? It\'s {childCrush}.', 'Thank you. ...It\'s just. There\'s someone. Sort of.', 'Right. Good. ...Can I ask you something, though?'] },
  ]);
  lines('child.youth.sweet.confess', [
    { text: ['It\'s {childCrush}. I can\'t think straight when {childCrush} is about.', '{ChildCrush} laughed at something I said once and I\'ve been thinking about it for a week.', 'I like {childCrush}. A lot. I don\'t know what to do with it.'] },
    { if: { childTemper: 'shy' }, text: ['...{ChildCrush}. I\'ve never even said hello properly.'] },
    { if: { childTemper: 'cheerful' }, text: ['{ChildCrush}! Isn\'t {childCrush} wonderful? Don\'t answer that.'] },
    { if: { childTemper: 'gloomy' }, text: ['{ChildCrush}. But {childCrush} would never. Not with me.'] },
    { if: { rift: true }, text: ['{ChildCrush}. Back home I\'d just send a ping. Here you have to SAY things. Out loud.'] },
  ]);
  lines('child.youth.sweet.tell', [
    { text: ['Soon? Like this week soon?', 'Kindly and soon. ...What if it goes wrong?', 'You make it sound easy. It\'s not easy.'] },
    { if: { childTemper: 'shy' }, text: ['...Maybe I could write it down. That\'s telling. Isn\'t it?'] },
  ]);
  lines('child.youth.sweet.flower', [
    { text: ['A flower? That\'s what Gran\'s generation did.', 'Which flower? Does it matter which?', '...That might actually be less frightening than talking.'] },
    { if: { season: 'winter' }, text: ['There aren\'t any flowers. It\'s winter. ...A holly sprig?'] },
  ]);
  lines('child.youth.sweet.fine', [
    { text: ['...Thanks. It is, a bit. Even when it\'s awful.', 'You won\'t tell anyone? Not even in a tale?', 'I feel better saying it out loud.'] },
  ]);

  // =====================================================================================
  // Leaving home
  // =====================================================================================
  addThread({
    id: 'child.youth.leave', label: 'Ever think of leaving?', weight: 1, cool: 6,
    when: (F) => youth(F) && F.childYears >= 15,
    rel: (F) => (F.childUpb === 'rift' || F.childComing ? 1.5 : 0.9),
    open: { ask: 'child.youth.leave.open' },
    beats: {
      start: { line: 'child.youth.leave.start', go: [
        { ap: 'ask', say: 'Where would you go?', to: 'where' },
        { ap: 'share', say: 'I left home young. I\'ve never quite gone back.', to: 'wiz', need: { open: 1 }, soft: true },
        { ap: 'advise', say: 'Thistledown will need folk like you, {name}.', to: 'needed', fx: { lean: 'hill' } },
      ] },
      where: { line: 'child.youth.leave.where', go: [
        { ap: 'tale', say: 'The road goes ever on, from the door where it began. It\'s a fine road.', to: 'road', fx: { lean: 'rift' } },
        { ap: 'advise', say: 'Go, and come back. The coming back is what makes it a journey.', to: 'back', fx: { run: both(0.03) } },
      ] },
      road: { line: 'child.youth.leave.road', fx: { news: '{Name} has been talking about going out on the road one day.', remember: 'The wizard says the road goes ever on.' }, end: true },
      back: { line: 'child.youth.leave.back', fx: { respect: 0.03 }, end: true },
      wiz: { line: 'child.youth.leave.wiz', fx: { trust: 0.04 }, go: [
        { ap: 'share', say: 'I do. Every road I take ends here for a while, though.', to: 'here' },
        { ap: 'warm', say: 'Wherever you go, a door like yours will always be there.', to: 'needed', fx: { lean: 'hill' } },
      ] },
      here: { line: 'child.youth.leave.here', fx: { fond: 0.03 }, end: true },
      needed: { line: 'child.youth.leave.needed', fx: { respect: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.youth.leave.open', [
    { text: ['Ever think of leaving Thistledown, {name}?', 'Do you ever look at the road and wonder, {name}?', 'What\'s past the hills, do you think, {name}?'] },
  ]);
  lines('child.youth.leave.start', [
    { text: ['All the time. Then I think about supper and I stay.', 'Sometimes. When it\'s quiet. I look at the road and I wonder.', 'Leave? Why would anyone leave? ...Sometimes I wonder.'] },
    { if: { childUpb: 'rift' }, text: ['Every single day. There\'s so much out there. And through the rifts.', 'I want to see everything. Here\'s lovely. But it\'s small.'] },
    { if: { childUpb: 'hill' }, text: ['Leave? No. My whole life\'s here. Why would I want another one?', 'Not really. I like knowing where everything is.'] },
    { if: { childUpb: 'both' }, text: ['I want to go and see, and then come back and tell everyone. Both.'] },
    { if: { childTemper: 'gloomy' }, text: ['Sometimes I think it\'d be easier somewhere nobody knows me.'] },
    { if: { childTemper: 'curious' }, text: ['I think about the Sea. I\'ve never seen it. Nobody here has. Doesn\'t that bother anyone?'] },
    { if: { childTemper: 'shy' }, text: ['...I\'d be too frightened. But I think about it.'] },
    { if: { rift: true }, text: ['I already left one home. I\'m not sure I\'ve got another leaving in me.'] },
  ]);
  lines('child.youth.leave.where', [
    { text: ['Bree. Just Bree. To start.', 'The Sea. I\'d walk till I saw it. Then I\'d sit down.', 'East. Where the mountains are. Where your tales come from.'] },
    { if: { childRiftStage: { min: 2 } }, text: ['Through a rift. Just to see the city. Just once.'] },
    { if: { rift: true }, text: ['Back. To see if my old street\'s still lit. Then here again.'] },
  ]);
  lines('child.youth.leave.road', [
    { text: ['Ever on. I like that. I\'m going to say that to myself.', 'From the door where it began. That\'s our door. Isn\'t it?', 'You make it sound like the road wants me.'] },
  ]);
  lines('child.youth.leave.back', [
    { text: ['Go and come back. Yes. That\'s the bit I\'d forgotten.', 'So I can have both. Leaving and home.', 'And then tell it at the Badger. Like you do.'] },
  ]);
  lines('child.youth.leave.wiz', [
    { text: ['Never gone back? Don\'t you miss it?', 'Where\'s home, for you? Is there one?', '...That sounds lonely.'] },
  ]);
  lines('child.youth.leave.here', [
    { text: ['Here? We\'re a stop on the wizard\'s road?', 'Ends here. I like that. Don\'t let the others hear, they\'ll be insufferable.', 'Then we\'re a sort of home. For you.'] },
  ]);
  lines('child.youth.leave.needed', [
    { text: ['Need me? For what?', 'Folk like me? Daydreamers?', 'You think so? ...I might stay, then. For a bit.'] },
    { if: { childTemper: 'ornery' }, text: ['Hmph. Thistledown managed fine before me.'] },
  ]);

  // =====================================================================================
  // Coming of age
  // =====================================================================================
  addThread({
    id: 'child.youth.coming', label: 'Nearly of age!', weight: 1.4, cool: 4,
    when: (F) => youth(F) && F.childComing,
    open: { warm: 'child.youth.coming.open' },
    beats: {
      start: { line: 'child.youth.coming.start', go: [
        { ap: 'ask', say: 'And who will you give presents to, on the day?', to: 'give' },
        { ap: 'jest', say: 'Thirty-three. A hobbit at last. Do you feel it in your feet?', to: 'feel' },
        { ap: 'warm', say: 'Shall I bring some fireworks for it?', to: 'fireworks' },
      ] },
      give: { line: 'child.youth.coming.give', go: [
        { ap: 'warm', say: 'A good list. A generous one.', to: 'generous', fx: { lean: 'hill' } },
        { ap: 'ask', say: 'And something for yourself? A present to the hobbit you\'ll be?', to: 'self' },
      ] },
      generous: { line: 'child.youth.coming.generous', fx: { respect: 0.02 }, end: true },
      self: { line: 'child.youth.coming.self', fx: { learn: ['child.coming', '{Name} wants, when grown, to keep something of being young'] }, end: true },
      feel: { line: 'child.youth.coming.feel', go: [
        { ap: 'comfort', say: 'Nobody feels grown. We all just put the waistcoat on and carry on.', to: 'waistcoat' },
        { ap: 'jest', say: 'It happens at midnight. Your feet get hairier with a pop.', to: 'pop' },
      ] },
      waistcoat: { line: 'child.youth.coming.waistcoat', fx: { trust: 0.04 }, end: true },
      pop: { line: 'child.youth.coming.pop', fx: { fond: 0.03, joke: { k: 'child.coming.pop', t: 'At midnight on your thirty-third birthday your feet get hairier with a pop.' } }, end: true },
      fireworks: { line: 'child.youth.coming.fireworks', fx: { fond: 0.05, promise: { k: 'child.fireworks', t: 'You said you\'d bring fireworks to {name}\'s coming of age', days: 6 }, news: 'The wizard says there\'ll be fireworks for {name}\'s coming of age.' }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.youth.coming.open', [
    { text: ['Nearly of age, {name}! Thirty-three before you know it.', 'Not long now, {name}. A grown hobbit!', 'I hear there\'s a coming of age on the way, {name}.'] },
  ]);
  lines('child.youth.coming.start', [
    { text: ['Thirty-three! Then I\'m grown. Properly. It\'s terrifying.', 'I can\'t wait. I can wait. I don\'t know.', 'Everyone keeps saying "not long now". I know it\'s not long. I can count.'] },
    { if: { childTemper: 'cheerful' }, text: ['I\'m going to have the BEST party. Everyone\'s invited. Even the goats.'] },
    { if: { childTemper: 'shy' }, text: ['...I don\'t want a party. Everyone looking. But I want a party.'] },
    { if: { childTemper: 'ornery' }, text: ['Finally. Then nobody can tell me what to do.'] },
    { if: { childTemper: 'gloomy' }, text: ['Then I\'m grown and that\'s it. No more being a child. Ever.'] },
    { if: { childTemper: 'curious' }, text: ['Does it feel different? Being grown? Does something happen?'] },
    { if: { childCrush: has }, text: ['I\'m going to ask {childCrush} to dance. At the party. Probably. Possibly.'] },
    { if: { rift: true }, text: ['Back home you were grown at sixteen. Here I get seventeen more years of being told off. Nearly done.'] },
  ]);
  lines('child.youth.coming.give', [
    { text: ['Everyone! It\'s the rule. You give presents on your birthday. I\'ve been saving.', 'My friends. Then the old ones who were kind to me when nobody was.', 'I\'ve made a list. It\'s long. Some of it\'s mathoms, don\'t tell.'] },
    { if: { childParentWord: has }, text: ['{ChildParentWord} first. Then my friends. Then the old ones who were kind to me.'] },
    { if: { childPal: has }, text: ['{ChildPal} gets the best one. {ChildPal} gave me my first conker.'] },
    { if: { childSib: has }, text: ['Even {childSib}. Especially {childSib}. Don\'t tell {childSib}.'] },
    { if: { pastimeWord: has }, text: ['I\'m doing presents myself. My {pastimeWord}. One for everyone.'] },
  ]);
  lines('child.youth.coming.generous', [
    { text: ['That\'s the hobbit way. Isn\'t it?', 'Gran said a generous birthday makes a generous year.', 'I like giving more than getting. Mostly.'] },
  ]);
  lines('child.youth.coming.self', [
    { text: ['...Something for me? I want to keep being silly. Sometimes. Grown and silly.', 'A present to who I\'ll be. I\'d give them... permission to still climb trees.', 'I don\'t know. Can you give yourself time?'] },
  ]);
  lines('child.youth.coming.feel', [
    { text: ['No! Should I? Is it in the feet?', 'I feel exactly the same. Is that wrong?', 'Not yet. Maybe it comes all at once.'] },
  ]);
  lines('child.youth.coming.waistcoat', [
    { text: ['Even you? You don\'t feel grown?', 'Put the waistcoat on and carry on. ...That\'s the secret?', 'That\'s the most comforting thing anyone\'s said about it.'] },
  ]);
  lines('child.youth.coming.pop', [
    { text: ['A POP? ...You\'re joking. You\'re joking, aren\'t you?', 'Ha! I\'m going to stay up and listen.', 'My feet are hairy ENOUGH, thank you.'] },
  ]);
  lines('child.youth.coming.fireworks', [
    { text: ['FIREWORKS? For ME?', 'The dragon one? Could you do the dragon?', 'Everyone will remember my party forever.'] },
    { if: { childTemper: 'shy' }, text: ['...for me? Really? *very pink*'] },
  ]);

  // =====================================================================================
  // A scrape (theirs, for the youths)
  // =====================================================================================
  addThread({
    id: 'child.youth.scrape', theirs: true, label: 'A scrape', cool: 5,
    ask: '{Name} sidles up, looking shifty.',
    when: (F) => youth(F) && F.talks >= 1,
    beats: {
      start: { line: 'child.youth.scrape.start', go: [
        { ap: 'ask', say: 'What have you done?', to: 'what' },
        { ap: 'jest', say: 'If it\'s a body, I don\'t want to know.', to: 'body' },
        { ap: 'warm', say: 'Out with it. I\'ve seen worse.', to: 'what' },
      ] },
      body: { line: 'child.youth.scrape.body', go: [{ ap: 'ask', say: 'Go on, then. What happened?', to: 'what' }] },
      what: { line: 'child.youth.scrape.what', go: [
        { ap: 'advise', say: 'Own up. Before someone else tells it worse.', to: 'own', fx: { lean: 'hill' } },
        { ap: 'jest', say: 'Did you at least get away with it in style?', to: 'style' },
        { ap: 'ask', say: 'And was it worth it?', to: 'worth' },
      ] },
      worth: { line: 'child.youth.scrape.worth', go: [
        { ap: 'advise', say: 'Then own up, and it\'ll have been worth it twice.', to: 'own', fx: { lean: 'hill' } },
        { ap: 'warm', say: 'Your secret\'s safe. But I\'d mend it, if I were you.', to: 'mend' },
      ] },
      style: { line: 'child.youth.scrape.style', fx: { fond: 0.03, respect: -0.01 }, go: [
        { ap: 'advise', say: 'Now go and own up. In style.', to: 'own' },
      ] },
      own: { line: 'child.youth.scrape.own', fx: { respect: 0.04 }, end: true },
      mend: { line: 'child.youth.scrape.mend', fx: { trust: 0.04, confide: { k: 'child.scrape', t: '{Name} got into a scrape and told you about it' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.youth.scrape.start', [
    { text: ['Can I ask you something? Hypothetically?', 'If someone did something, and nobody knew, would they have to say?', 'I might be in trouble. Might. Don\'t look at me like that.'] },
    { if: { childTemper: 'cheerful' }, text: ['So! Funny story! Not funny for the miller, though.'] },
    { if: { childTemper: 'ornery' }, text: ['Before you hear it from someone else: it wasn\'t my idea.'] },
  ]);
  lines('child.youth.scrape.body', [
    { text: ['NO! It\'s not that bad! ...It\'s not that good either.', 'Ha. No. Nobody\'s dead. Some apples are dead.'] },
  ]);
  lines('child.youth.scrape.what', [
    { text: ['We went scrumping. In the orchard. And I fell out of the tree onto the orchard-keeper.', 'We swam in the mill-race. We\'re not allowed. It was brilliant. I lost my breeches.', 'I snuck into the Badger after dark. Just to see. Someone saw me see.'] },
    { if: { season: 'winter' }, text: ['I went out on the pond ice. It held. Mostly. My left leg went through.'] },
    { if: { childRiftOpen: true }, text: ['We dared each other to touch the rift. I did it. My hair\'s still fizzing.'] },
    { if: { childRiftFolk: true }, text: ['I borrowed a gadget. Without asking. It\'s sort of... broken now.'] },
    { if: { childCrush: has }, text: ['I climbed onto {childCrush}\'s roof to leave something on the chimney. I got stuck.'] },
    { if: { rift: true }, text: ['I wired the Badger\'s lamp to blink. In time to the music. They weren\'t pleased. Everyone else was.'] },
  ]);
  lines('child.youth.scrape.worth', [
    { text: ['...Yes. Absolutely. Don\'t tell anyone I said.', 'Every second. Until the bit after.', 'I don\'t know yet. Ask me after the telling-off.'] },
  ]);
  lines('child.youth.scrape.style', [
    { text: ['Oh, absolute style. I bowed.', 'No. I fell in a ditch. But I fell stylishly.', 'Ha! I like you, wizard.'] },
  ]);
  lines('child.youth.scrape.own', [
    { text: ['...Ugh. Fine. You\'re right.', 'Before someone tells it worse. Yes. They would, too.', 'All right. I\'ll go now. While I\'m brave.'] },
    { if: { childTemper: 'ornery' }, text: ['Hmph. Fine. But I\'m not saying it was a bad idea.'] },
  ]);
  lines('child.youth.scrape.mend', [
    { text: ['Mend it. Yes. I can do that. Quietly.', 'Thanks. I needed to tell someone.', 'You\'re the only grown-up who doesn\'t shout first.'] },
  ]);

  // =====================================================================================
  // Getting on at home
  // =====================================================================================
  addThread({
    id: 'child.youth.home', label: 'Getting on at home?', weight: 0.9, cool: 5,
    when: (F) => youth(F) && !!F.childParentWord,
    rel: (F) => (F.mood === 'low' || F.mood === 'miserable' ? 1.6 : 0.8),
    open: { ask: 'child.youth.home.open' },
    beats: {
      start: { line: 'child.youth.home.start', go: [
        { ap: 'ask', say: 'What\'s the trouble?', to: 'trouble' },
        { ap: 'jest', say: 'Parents. Can\'t live with them, can\'t eat their cooking.', to: 'cooking' },
        { ap: 'listen', say: '*You lean on the wall and wait.*', label: 'Lean on the wall and wait', to: 'trouble' },
      ] },
      cooking: { line: 'child.youth.home.cooking', go: [{ ap: 'ask', say: 'So what\'s the trouble, really?', to: 'trouble' }] },
      trouble: { line: 'child.youth.home.trouble', go: [
        { ap: 'advise', say: 'Give them time. They\'re learning to let go, same as you\'re learning to go.', to: 'time', fx: { lean: 'hill' } },
        { ap: 'advise', say: 'Show them, then. Do something grown and let them see it.', to: 'show', fx: { lean: 'rift' } },
        { ap: 'share', say: 'My old master never thought I\'d amount to anything either.', to: 'master', need: { open: 1 }, soft: true },
      ] },
      time: { line: 'child.youth.home.time', fx: { respect: 0.03 }, end: true },
      show: { line: 'child.youth.home.show', fx: { respect: 0.03 }, end: true },
      master: { line: 'child.youth.home.master', fx: { trust: 0.05, confide: { k: 'child.home.master', t: 'Somebody once thought the wizard wouldn\'t amount to anything' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.youth.home.open', [
    { text: ['How are things at home, {name}?', 'Getting on with your {childParentWord}, {name}?', 'All well under your roof, {name}?'] },
  ]);
  lines('child.youth.home.start', [
    { text: ['Fine. Mostly. Except when it isn\'t.', '{ChildParentWord} still treats me like I\'m six.', 'It\'s all right. It\'s a bit small. With all of us in it.'] },
    { if: { mood: 'merry' }, text: ['Good, actually! {ChildParentWord} let me do the cooking. Nobody died.'] },
    { if: { childSibCount: { min: 2 }, childSib: has }, text: ['Crowded. I share a room with {childSib}. And {childSib}\'s feet.'] },
    { if: { childTemper: 'ornery' }, text: ['Don\'t get me started. Actually, do.'] },
    { if: { childTemper: 'shy' }, text: ['...It\'s fine. They worry. I\'m quiet. They worry more.'] },
    { if: { childUpb: 'rift' }, text: ['They don\'t like me spending time at the Relay. They say I come home talking funny.'] },
    { if: { rift: true }, text: ['Different. Back home everyone had their own screen. Here we all sit round one fire. I\'m getting used to it.'] },
  ]);
  lines('child.youth.home.cooking', [
    { text: ['Ha! {ChildParentWord}\'s cooking\'s fine. It\'s the lectures with it.', 'That\'s not fair. The cooking\'s the best bit.', 'Ha. Yes. That.'] },
  ]);
  lines('child.youth.home.trouble', [
    { text: ['Every time I want to do something, it\'s "when you\'re older". I AM older. I\'m always older.', 'Chores. Chores and more chores. And then "why don\'t you ever have any fun".', 'They don\'t listen. They hear me, but they don\'t listen.'] },
    { if: { childComing: true }, text: ['I\'m nearly of age and {childParentWord} still checks I\'ve got a scarf.'] },
    { if: { childCrush: has }, text: ['{ChildParentWord} has worked out about {childCrush}. Now it\'s jokes. Every meal.'] },
    { if: { childUpb: 'rift' }, text: ['I said I might work with the rift-folk. You\'d think I\'d said I was going to live on the moon.'] },
    { if: { childUpb: 'hill' }, text: ['They want me to see the world. I don\'t want to see the world. I like it here.'] },
  ]);
  lines('child.youth.home.time', [
    { text: ['Learning to let go. ...I never thought of it like that.', 'So it\'s hard for them too. Huh.', 'Time. Fine. But not too much.'] },
  ]);
  lines('child.youth.home.show', [
    { text: ['Do something grown. All right. Like what?', 'Show them. I could fix the gate. They\'ve been on about the gate for a year.', 'Yes. I\'ll show them.'] },
  ]);
  lines('child.youth.home.master', [
    { text: ['Someone thought that about YOU?', 'And look at you now. ...Well. Look at your hat.', 'Really? ...That helps, actually.'] },
  ]);

  // =====================================================================================
  // Rift-born children: home
  // =====================================================================================
  addThread({
    id: 'child.rift.home', label: 'Do you remember the city?', weight: 1.4, cool: 4,
    when: (F) => kid(F) && F.band !== 'toddler' && F.rift,
    open: { ask: 'child.rift.home.open' },
    beats: {
      start: { line: 'child.rift.home.start', go: [
        { ap: 'ask', say: 'What do you miss most?', to: 'miss' },
        { ap: 'share', say: 'I\'ve walked those streets, you know. In the rain.', to: 'walked' },
        { ap: 'warm', say: 'And here? What do you like about here?', to: 'here' },
      ] },
      walked: { line: 'child.rift.home.walked', fx: { trust: 0.04 }, go: [
        { ap: 'tale', say: 'The Lamplighter asked after its children. I told it they\'d learned second breakfast.', to: 'lamplighter' },
        { ap: 'ask', say: 'What do you miss most?', to: 'miss' },
      ] },
      lamplighter: { line: 'child.rift.home.lamplighter', fx: { fond: 0.04, remember: 'The wizard told the Lamplighter about us.', rv: 2 }, end: true },
      miss: { line: 'child.rift.home.miss', go: [
        { ap: 'advise', say: 'Teach the hill children something from home. A song. A game.', to: 'teach', fx: { run: both(0.03) } },
        { ap: 'advise', say: 'Learn something from here, too. Second breakfast is a fine start.', to: 'breakfast', fx: { lean: 'hill' } },
        { ap: 'comfort', say: 'It\'s all right to miss it. Missing is how you keep things.', to: 'keep' },
      ] },
      teach: { line: 'child.rift.home.teach', fx: { respect: 0.03, news: 'Little {name} is going to teach the hill children a game from Neverdark.' }, end: true },
      breakfast: { line: 'child.rift.home.breakfast', fx: { fond: 0.02 }, end: true },
      keep: { line: 'child.rift.home.keep', fx: { trust: 0.05, drive: { lonely: -0.15 } }, end: true },
      here: { line: 'child.rift.home.here', go: [
        { ap: 'warm', say: 'Then you\'ve two homes. That\'s rich, not poor.', to: 'rich', fx: { run: both(0.03) } },
        { ap: 'ask', say: 'And what do you miss, from there?', to: 'miss' },
      ] },
      rich: { line: 'child.rift.home.rich', fx: { respect: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.rift.home.open', [
    { text: ['Do you remember the city, {name}?', 'Tell me about Neverdark, {name}. What do you remember?', 'Do you think about home much, {name}? The other one?'] },
  ]);
  lines('child.rift.home.start', [
    { text: ['Bits. The rain on the neon. The noodle stall. The trains that never stopped.', 'I remember the lights. It was never dark. Not once. Not ever.', 'I remember my window. It was full of other people\'s windows.'] },
    { if: { band: 'young' }, text: ['It was SHINY. And loud. And the rain was pink.', 'There was a robot cat. It wasn\'t real but it purred.'] },
    { if: { band: 'school' }, text: ['I remember the Relay hum. And the market at night. Here the night\'s so quiet I can hear my ears.'] },
    { if: { band: 'youth' }, text: ['More than I let on. The hum of the city at night. I still listen for it.', 'Everything. And less every day. That\'s the worst bit.'] },
    { if: { childTemper: 'gloomy' }, text: ['I remember. I wish I didn\'t. Or I wish I remembered more.'] },
    { if: { childTemper: 'cheerful' }, text: ['Loads! Ask me anything! Except why we left. I don\'t really know that.'] },
    { if: { childTemper: 'shy' }, text: ['...A little. I don\'t talk about it much. People look.'] },
    { if: { lost: has, lostRel: has }, pri: 1, text: ['I remember {lost}. My {lostRel}. We were meant to come through together.'] },
  ]);
  lines('child.rift.home.walked', [
    { text: ['You WENT there? Through the golden door?', 'You walked in Neverdark? Did you see my street?', 'Did you have noodles? You have to have the noodles.'] },
    { if: { childTemper: 'curious' }, text: ['What\'s it like now? Is it darker? They say it\'s getting darker.'] },
  ]);
  lines('child.rift.home.lamplighter', [
    { text: ['It ASKED after us? It remembers us?', 'Second breakfast! Ha! Did it laugh?', '...I didn\'t know anyone was still thinking about us. Over there.'] },
  ]);
  lines('child.rift.home.miss', [
    { text: ['The noodles. Obviously the noodles.', 'The noise. Here it\'s so quiet. I can hear sheep THINKING.', 'Everyone I knew. And the lights.'] },
    { if: { lost: has }, pri: 1, text: ['{Lost}. I miss {lost} most. I check every new rift. Every one.'] },
    { if: { band: 'young' }, text: ['The robot cat. And the pink rain. And my bed that went up and down.'] },
    { if: { childTemper: 'gloomy' }, text: ['Being from somewhere. Here I\'m from somewhere else.'] },
  ]);
  lines('child.rift.home.teach', [
    { text: ['Glitch-tag! They\'d love glitch-tag!', 'I could teach them the Low Battery Blues. It\'s a good one for snow.', 'They\'d want to learn? From me?'] },
  ]);
  lines('child.rift.home.breakfast', [
    { text: ['Second breakfast is the best thing I\'ve ever found out about.', 'I\'ve already learned it. And elevenses. I\'m working on afternoon tea.', 'Ha! I\'m better at second breakfast than the hill kids.'] },
  ]);
  lines('child.rift.home.keep', [
    { text: ['Missing is how you keep things. ...I\'ll keep missing it, then.', '...Thanks. Everyone tells me to cheer up.', '*leans on you, very slightly*'] },
  ]);
  lines('child.rift.home.here', [
    { text: ['The dark. The real dark. And the stars in it. We didn\'t have stars.', 'Rain that isn\'t pink. Just wet. It\'s nice.', 'Nobody\'s in a hurry. I keep running places and everyone laughs.'] },
    { if: { season: 'winter' }, text: ['Snow! We didn\'t have snow. It was too warm with all the lights.'] },
    { if: { childPal: has }, text: ['{ChildPal}. {ChildPal} was the first one who asked me to play.'] },
  ]);
  lines('child.rift.home.rich', [
    { text: ['Rich, not poor. I\'m going to say that to the others.', 'Huh. I never thought of it like that.', 'Two homes. Yes. I like that.'] },
    { if: { childParentWord: has }, text: ['Two homes. Rich, not poor. I\'m going to tell my {childParentWord}.'] },
  ]);

  // =====================================================================================
  // Gadgets, neon and the Relay
  // =====================================================================================
  addThread({
    id: 'child.rift.ways', label: 'What\'s that gadget?', weight: 1.2, cool: 4,
    when: (F) => kid(F) && F.band !== 'toddler' && !F.rift && (F.riftWays || F.childUpb === 'rift' || ['gadget', 'jack_in', 'rift_gawk', 'rift_watch'].includes(F.was)),
    open: { ask: 'child.rift.ways.open' },
    beats: {
      start: { line: 'child.rift.ways.start', go: [
        { ap: 'ask', say: 'Show me how it works.', to: 'show' },
        { ap: 'advise', say: 'Mind your granny doesn\'t find it in her teapot.', to: 'gran', fx: { lean: 'hill' } },
        { ap: 'jest', say: 'In my day we had sticks. And we were grateful.', to: 'sticks' },
      ] },
      sticks: { line: 'child.rift.ways.sticks', go: [
        { ap: 'ask', say: 'Go on, then. Show me how it works.', to: 'show' },
      ] },
      gran: { line: 'child.rift.ways.gran', go: [
        { ap: 'ask', say: 'Go on, then. Show me how it works.', to: 'show' },
      ] },
      show: { line: 'child.rift.ways.show', go: [
        { ap: 'tale', say: 'The Relay sings at dusk. Half static, half lullaby. Listen for it.', to: 'relay', fx: { lean: 'rift' } },
        { ap: 'advise', say: 'Learn the old ways too. A lamp can fail. A song won\'t.', to: 'old', fx: { run: both(0.03) } },
        { ap: 'warm', say: 'Clever hands. You\'ll do great things with them.', to: 'hands', fx: { lean: 'rift' } },
      ] },
      relay: { line: 'child.rift.ways.relay', fx: { remember: 'The wizard says the Relay sings at dusk.' }, end: true },
      old: { line: 'child.rift.ways.old', fx: { respect: 0.03 }, end: true },
      hands: { line: 'child.rift.ways.hands', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.rift.ways.open', [
    { text: ['What\'s that you\'ve got, {name}?', 'Been at the rift-folk\'s gadgets, {name}?', 'You\'ve a look of the Relay about you, {name}.'] },
    { if: { was: 'rift_gawk' }, text: ['Been staring at the rift, {name}? What did you see?'] },
  ]);
  lines('child.rift.ways.start', [
    { text: ['It\'s a blinker! It goes pink, blue, pink. You can set it to go faster.', 'A bit of the Relay! Well. A bit of a bit. It hums if you hold it.', 'Look! You twist this and it lights up. Nobody else can make it do that.'] },
    { if: { childRiftName: has }, text: ['Look! {ChildRiftName} showed me. You twist this and it lights up.'] },
    { if: { was: 'jack_in' }, text: ['I was on the Relay! You put your hand on the panel and you can hear everyone. EVERYONE.'] },
    { if: { was: 'rift_gawk' }, text: ['The rift was humming! In a tune! I think it was saying something.'] },
    { if: { band: 'young' }, text: ['A shiny! It goes BEEP. Listen. BEEP.'] },
    { if: { band: 'youth' }, text: ['I\'m building a lamp that runs off the river. A proper one. Don\'t tell my folks.'] },
    { if: { childTemper: 'curious' }, text: ['I took it apart. And put it back. There\'s a bit left over. It still works. I think.'] },
    { if: { childUpb: 'rift' }, text: ['I\'m going to be a tinker. With neon. Everything I make will glow.'] },
  ]);
  lines('child.rift.ways.sticks', [
    { text: ['STICKS? What did sticks DO?', 'Ha! And you walked uphill both ways.', 'Sticks. That\'s sad. You can have a go on this.'] },
  ]);
  lines('child.rift.ways.gran', [
    { text: ['Ha! She nearly did! It was in the sugar bowl.', 'Gran thinks it\'s a beetle. I let her.', 'She found the last one. It\'s on the mantelpiece now. She uses it as a candle.'] },
  ]);
  lines('child.rift.ways.show', [
    { text: ['*twists it, and it hums, and blinks a pale blue light on your beard*', 'You do this, and this, and then wait, and... THERE.', '*taps a little panel and a tiny voice says something in rift-speak*'] },
    { if: { band: 'young' }, text: ['*presses it against your nose* BEEP!'] },
    { if: { childTemper: 'curious' }, text: ['It\'s ones and noughts inside. Like acorns. Only very small, and very fast.'] },
  ]);
  lines('child.rift.ways.relay', [
    { text: ['Half lullaby? I\'ve heard it! I thought I was dreaming!', 'I\'m going to listen. Tonight. At dusk.', 'A lullaby? Who\'s singing it?'] },
  ]);
  lines('child.rift.ways.old', [
    { text: ['A song won\'t fail. Huh. Unless you forget the words.', 'Gran says that. In more words.', 'Both, then. Lamp and song.'] },
  ]);
  lines('child.rift.ways.hands', [
    { text: ['Great things! Like what?', 'You think so? Really?', 'I\'m going to make something that glows the whole village.'] },
  ]);

  // =====================================================================================
  // Growing up both ways
  // =====================================================================================
  addThread({
    id: 'child.rift.both', label: 'Two kinds of folk', weight: 1.1, cool: 5,
    when: (F) => kid(F) && F.band !== 'toddler' && (F.childBlood === 'half' || F.childBlood === 'little' || F.childUpb === 'both' || F.goBetween),
    open: { ask: 'child.rift.both.open' },
    beats: {
      start: { line: 'child.rift.both.start', go: [
        { ap: 'ask', say: 'And which do you feel like, mostly?', to: 'which' },
        { ap: 'warm', say: 'You\'re lucky. You get to be both.', to: 'lucky', fx: { run: both(0.03) } },
        { ap: 'jest', say: 'So you have second breakfast with neon on?', to: 'neon' },
      ] },
      neon: { line: 'child.rift.both.neon', go: [{ ap: 'ask', say: 'But which do you feel like, mostly?', to: 'which' }] },
      which: { line: 'child.rift.both.which', go: [
        { ap: 'advise', say: 'You don\'t have to choose. Not ever.', to: 'nochoose', fx: { run: both(0.04) } },
        { ap: 'advise', say: 'You\'ll be the one who can talk to both. The village will need that.', to: 'between', fx: { run: both(0.04), news: 'The wizard says {name} could speak for both the hill-folk and the rift-folk one day.' } },
      ] },
      lucky: { line: 'child.rift.both.lucky', end: true },
      nochoose: { line: 'child.rift.both.nochoose', fx: { trust: 0.04 }, end: true },
      between: { line: 'child.rift.both.between', fx: { respect: 0.04 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.rift.both.open', [
    { text: ['You\'re a bit of both, aren\'t you, {name}? Hill and rift.', 'What\'s it like, growing up between two kinds of folk, {name}?'] },
  ]);
  lines('child.rift.both.start', [
    { text: ['At home it\'s all signal and static. At Gran\'s it\'s all scones and "speak properly".', 'Half the time I don\'t know which words to use. Then I use both and nobody understands.', 'The hill kids think I\'m rift. The rift kids think I\'m hill. I think I\'m me.'] },
    { if: { goBetween: true }, pri: 1, text: ['People keep asking me to explain each other to each other. Is that a job?'] },
    { if: { childBlood: 'half' }, text: ['My eyes do the thing. The glow. In the dark. The little ones love it.'] },
    { if: { childTemper: 'gloomy' }, text: ['I don\'t fit anywhere. Not properly.'] },
    { if: { childTemper: 'cheerful' }, text: ['It\'s brilliant! Two kinds of party! Neon AND fiddles!'] },
  ]);
  lines('child.rift.both.neon', [
    { text: ['Ha! Yes, actually. The bunting glows.', 'With noodles. Second breakfast noodles.', 'That\'s exactly it. You get it.'] },
  ]);
  lines('child.rift.both.which', [
    { text: ['Depends on the day. Rainy days, hill. Rift days, rift.', 'I don\'t know. Hill when I\'m sad. Rift when I\'m excited.', 'Both. Neither. Mostly hungry.'] },
    { if: { childUpb: 'hill' }, text: ['Hill, mostly. But I like the lights.'] },
    { if: { childUpb: 'rift' }, text: ['Rift, mostly. But I\'d never give up the scones.'] },
  ]);
  lines('child.rift.both.lucky', [
    { text: ['Lucky? ...I suppose I am.', 'Nobody\'s said lucky before. They say "poor thing".', 'Both. Yes. Both is more.'] },
  ]);
  lines('child.rift.both.nochoose', [
    { text: ['Not ever? Promise?', 'Good. Because I wasn\'t going to.', '...That\'s a big thing off my chest.'] },
  ]);
  lines('child.rift.both.between', [
    { text: ['Me? The one who talks to both?', 'Like a bridge. I could be a bridge.', 'I already do it at supper. Now it\'ll be for everyone.'] },
  ]);

  // =====================================================================================
  // The littlest: a nursery rhyme, and peekaboo
  // =====================================================================================
  addThread({
    id: 'child.tot.rhyme', label: 'Sing them a rhyme', weight: 1.3, cool: 2,
    when: (F) => F.band === 'toddler',
    open: { warm: 'child.tot.rhyme.open' },
    beats: {
      start: { line: 'child.tot.rhyme.start', go: [
        { ap: 'warm', say: 'Three for the heron and four for the hen...', to: 'more', fx: { lean: 'hill' } },
        { ap: 'jest', say: '*You sing it in a very deep, very silly voice.*', label: 'Sing it in a silly voice', to: 'silly' },
        { ap: 'tale', say: '♪ Down by the willow lamp, where the river runs slow... ♪', label: 'Sing the willow lamp song', to: 'lamp', fx: { run: both(0.02) } },
      ] },
      more: { line: 'child.tot.rhyme.more', fx: { fond: 0.03 }, go: [
        { ap: 'warm', say: 'Five for the fox who comes home in the end.', to: 'end' },
        { ap: 'jest', say: 'Six for the wizard who\'s lost all his hair.', to: 'hair' },
      ] },
      hair: { line: 'child.tot.rhyme.hair', fx: { joke: { k: 'child.tot.hair', t: 'Six for the wizard who\'s lost all his hair.' } }, end: true },
      silly: { line: 'child.tot.rhyme.silly', fx: { fond: 0.04 }, end: true },
      lamp: { line: 'child.tot.rhyme.lamp', fx: { trust: 0.03 }, end: true },
    },
    end: { fond: 0.02, run: (T, v) => { if (typeof learn === 'function') learn(v, 0.004, 'you'); } },
  });
  lines('child.tot.rhyme.open', [
    { text: ['One for the badger, two for the hare...', 'Shall we sing, little {name}? One for the badger...', 'Do you know this one, {name}? One for the badger, two for the hare...'] },
  ]);
  lines('child.tot.rhyme.start', [
    { text: ['*claps, nearly in time*', 'Badger!', '*bounces on the spot*'] },
    { if: { childTemper: 'shy' }, text: ['*mouths the words, without any sound*'] },
    { if: { childTemper: 'cheerful' }, text: ['BADGER! HARE! *spins round and falls over*'] },
    { if: { childTemper: 'curious' }, text: ['Why badger?', 'Where hare go?'] },
    { if: { childTemper: 'ornery' }, text: ['No. ...Badger. Again.'] },
    { if: { childTemper: 'gloomy' }, text: ['*stops sniffing to listen*'] },
  ]);
  lines('child.tot.rhyme.more', [
    { text: ['Hen! Bok bok!', '*flaps arms like a hen*', 'HERON! *stands on one leg and falls over*'] },
    { if: { childTemper: 'shy' }, text: ['*whispers* ...hen.'] },
  ]);
  lines('child.tot.rhyme.hair', [
    { text: ['*pats your hat, as if to check*', 'Hair! *pulls your beard to show you have some*', '*laughs so hard {they} get hiccups*'] },
  ]);
  lines('child.tot.rhyme.silly', [
    { text: ['*shrieks with laughter*', 'AGAIN! Silly again!', '*tries to sing deep too, and squeaks*'] },
    { if: { childTemper: 'shy' }, text: ['*giggles behind both hands*'] },
  ]);
  lines('child.tot.rhyme.lamp', [
    { text: ['*goes quiet and leans on your knee*', '*hums along, getting it all wrong, very happily*', 'Lamp. Nice lamp.'] },
    { if: { rift: true }, text: ['*knows it* Mama sings! Mama sings dat!'] },
  ]);

  addThread({
    id: 'child.tot.peekaboo', light: true, ap: 'jest', label: 'Peekaboo', open: { jest: 'child.tot.peekaboo.open' },
    when: (F) => F.band === 'toddler',
    beats: {
      start: { line: 'child.tot.peekaboo.start', go: [
        { ap: 'jest', say: '*Hat over your face again.* Where\'s the wizard?', label: 'Again, with the hat', to: 'again' },
        { ap: 'warm', say: '*You let them pull your hat off.*', label: 'Let them pull your hat off', to: 'hat' },
      ] },
      again: { line: 'child.tot.peekaboo.again', go: [{ ap: 'jest', say: '*Boo!*', label: 'Boo!', to: 'boo' }] },
      boo: { line: 'child.tot.peekaboo.boo', fx: { fond: 0.03 }, end: true },
      hat: { line: 'child.tot.peekaboo.hat', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('child.tot.peekaboo.open', [
    { text: ['*You hide your face behind your hat.* Where\'s the wizard?', '*You cover your eyes.* Where\'s {name}? Where did {name} go?'] },
  ]);
  lines('child.tot.peekaboo.start', [
    { text: ['*giggles*', 'Dere!', '*pulls your hand away* HERE!'] },
    { if: { childTemper: 'shy' }, text: ['*covers own eyes too, so you can\'t see {them}*'] },
    { if: { childTemper: 'ornery' }, text: ['*frowns, then giggles, then frowns harder*'] },
  ]);
  lines('child.tot.peekaboo.again', [
    { text: ['*holds breath, eyes huge*', 'Where... where...', '*hops from foot to foot*'] },
  ]);
  lines('child.tot.peekaboo.boo', [
    { text: ['*SHRIEKS with delight*', 'AGAIN!', '*falls over laughing and lies there laughing*'] },
    { if: { childTemper: 'shy' }, text: ['*squeaks, then smiles the biggest smile*'] },
  ]);
  lines('child.tot.peekaboo.hat', [
    { text: ['*puts your hat on and vanishes completely inside it*', 'Me wizzud!', '*runs off in your hat; you get it back eventually*'] },
  ]);
  // =====================================================================================
  // More ways to say it: tempers, and the older youths
  // =====================================================================================
  lines('child.youth.trade.try', [
    { if: { childTween: true }, pri: 1, text: ['I\'ve left it late. Everyone my age is already apprenticed.', 'I\'ve tried two. Hated one. Didn\'t hate the other.'] },
    { if: { childTemper: 'curious' }, text: ['Yes! A week each! I\'ll do them all and then pick!'] },
    { if: { childTemper: 'shy' }, text: ['I\'d have to ask. Asking\'s the hard bit.'] },
  ]);
  lines('child.youth.trade.family', [
    { if: { childTemper: 'shy' }, text: ['They\'ve never asked. I\'ve never said. That\'s how we do it.'] },
    { if: { childTemper: 'ornery' }, text: ['Doesn\'t matter what they want. I\'m the one doing it.'] },
    { if: { childTemper: 'cheerful' }, text: ['They want me to be happy! Which is nice. And no help at all.'] },
  ]);
  lines('child.youth.trade.own', [
    { if: { childTemper: 'shy' }, text: ['...My own. I like that. It\'s a bit frightening.'] },
    { if: { childTemper: 'ornery' }, text: ['Exactly. Thank you. Somebody finally said it.'] },
  ]);
  lines('child.youth.trade.kept', [
    { if: { childTemper: 'cheerful' }, text: ['That\'s true! We\'ve never gone hungry. Not once!'] },
  ]);
  lines('child.youth.trade.help', [
    { if: { childTemper: 'cheerful' }, text: ['Of a MORNING! I\'ll be there before they are!'] },
    { if: { childTemper: 'shy' }, text: ['...Just watch. I can do that. I\'ll stand at the back.'] },
  ]);

  lines('child.youth.sweet.confess', [
    { if: { childTween: true }, pri: 1, text: ['It\'s {childCrush}. Has been for a long while. I\'ll be of age soon and then it\'s not just silly any more.'] },
    { if: { childTemper: 'curious' }, text: ['{ChildCrush}. I keep wanting to know what {childCrush} thinks about everything. Is that what it is?'] },
    { if: { childTemper: 'ornery' }, text: ['{ChildCrush}. And if you laugh I\'ll set the goat on you.'] },
  ]);
  lines('child.youth.sweet.tell', [
    { if: { childTween: true }, pri: 1, text: ['Kindly and soon. Before someone else does. You\'re right.'] },
    { if: { childTemper: 'cheerful' }, text: ['Soon! Today! ...Tomorrow. Today\'s nearly over.'] },
    { if: { childTemper: 'ornery' }, text: ['Hmph. Fine. But if it goes wrong it\'s your fault.'] },
  ]);
  lines('child.youth.sweet.flower', [
    { if: { childTemper: 'cheerful' }, text: ['A whole armful! No, one. One good one.'] },
    { if: { childTemper: 'shy' }, text: ['I could leave it on the step. And not be there. That\'s allowed?'] },
  ]);
  lines('child.youth.sweet.fine', [
    { if: { childTemper: 'gloomy' }, text: ['A fine thing to feel. Even if nothing comes of it. ...I\'ll try to think that.'] },
  ]);

  lines('child.youth.leave.start', [
    { if: { childTween: true }, pri: 1, text: ['I think about it more now. Coming of age, everyone asks what\'s next. Nobody asks "where".'] },
    { if: { childTemper: 'cheerful' }, text: ['Leave? For a holiday! A long one! Then home for tea!'] },
    { if: { childTemper: 'ornery' }, text: ['If they keep on at me about chores, yes.'] },
  ]);
  lines('child.youth.leave.where', [
    { if: { childTemper: 'shy' }, text: ['...Somewhere nobody knows me. Just for a little. To see who I\'d be.'] },
    { if: { childTemper: 'cheerful' }, text: ['Everywhere with a party! Bree first. They say Bree never stops.'] },
  ]);
  lines('child.youth.leave.needed', [
    { if: { childTween: true }, pri: 1, text: ['Need me. ...That\'s the thing nobody says. Thank you.'] },
    { if: { childTemper: 'shy' }, text: ['...Me? Nobody needs me. ...Do they?'] },
  ]);

  lines('child.youth.coming.give', [
    { if: { childTemper: 'shy' }, text: ['Small things. Things nobody knows I noticed they wanted.'] },
    { if: { childTemper: 'cheerful' }, text: ['EVERYONE! The whole village! I\'m going to be poor for a year and I don\'t care!'] },
    { if: { childTemper: 'ornery' }, text: ['Only the people who\'ve been decent to me. It\'s a short list.'] },
  ]);
  lines('child.youth.coming.feel', [
    { if: { childTemper: 'shy' }, text: ['...I feel like I\'m pretending. Is that normal?'] },
    { if: { childTemper: 'ornery' }, text: ['I feel like I\'ve been grown for years and nobody noticed.'] },
  ]);
  lines('child.youth.coming.waistcoat', [
    { if: { childTemper: 'cheerful' }, text: ['Ha! I\'ve already got the waistcoat! Yellow! With buttons!'] },
  ]);

  lines('child.youth.scrape.what', [
    { if: { childTemper: 'shy' }, text: ['...I hid in the hay loft through a whole supper. They thought I\'d fallen in the river. Search party.'] },
    { if: { childTemper: 'cheerful' }, text: ['I painted the Steward\'s gate! Bright yellow! It looks much better! Nobody agrees!'] },
    { if: { childTemper: 'curious' }, text: ['I took the mill-wheel\'s pin out to see what would happen. It went. Downstream.'] },
  ]);
  lines('child.youth.scrape.own', [
    { if: { childTemper: 'cheerful' }, text: ['Right! Owning up! Loudly! With a smile! That always helps!'] },
    { if: { childTemper: 'shy' }, text: ['...Will you stand somewhere I can see you while I do it?'] },
  ]);

  lines('child.youth.home.trouble', [
    { if: { childTemper: 'shy' }, text: ['...They talk about me like I\'m not there. "Oh, {name}\'s quiet." I\'m right HERE.'] },
    { if: { childTemper: 'ornery' }, text: ['Everything. The hours I keep. The friends I keep. The face I make.'] },
    { if: { childTemper: 'gloomy' }, text: ['Nothing I do is right. It\'s always "when we were your age".'] },
  ]);
  lines('child.youth.home.time', [
    { if: { childTemper: 'ornery' }, text: ['Learning to let go. Hmph. They could learn faster.'] },
    { if: { childTemper: 'shy' }, text: ['...I never thought they might find it hard too.'] },
  ]);
  lines('child.youth.home.show', [
    { if: { childTemper: 'cheerful' }, text: ['I\'ll cook supper! For everyone! On my own! What could go wrong?'] },
  ]);

  lines('child.rift.home.miss', [
    { if: { childTemper: 'cheerful' }, text: ['The noodles! Obviously! Hill-folk can\'t do noodles. Not yet. I\'m teaching them.'] },
    { if: { childTemper: 'curious' }, text: ['Knowing how everything worked. Here half of it\'s "that\'s how it\'s always been".'] },
    { if: { childTemper: 'shy' }, text: ['...My nan\'s voice. She stayed behind.'] },
  ]);
  lines('child.rift.home.here', [
    { if: { childTemper: 'cheerful' }, text: ['SECOND BREAKFAST. And mud. I love mud. We didn\'t have mud.'] },
    { if: { childTemper: 'shy' }, text: ['...The quiet. I didn\'t know quiet before. It\'s nice. When it\'s not too much.'] },
    { if: { childTemper: 'gloomy' }, text: ['I don\'t know yet. Ask me in a year.'] },
  ]);
  lines('child.rift.home.teach', [
    { if: { childTemper: 'shy' }, text: ['...Maybe one. A quiet one. Signal, in the dark.'] },
  ]);
  lines('child.rift.home.keep', [
    { if: { childTemper: 'gloomy' }, text: ['...Then I\'m keeping a lot.'] },
  ]);

  lines('child.rift.ways.start', [
    { if: { childTemper: 'shy' }, text: ['...It\'s just a little light. I made it brighter. Don\'t tell.'] },
    { if: { childTemper: 'cheerful' }, text: ['LOOK! It glows! It GLOWS! I made it glow!'] },
    { if: { childUpb: 'hill' }, text: ['It\'s only a blinker. I\'m not going rift or anything. I just like it.'] },
  ]);
  lines('child.rift.ways.show', [
    { if: { childTemper: 'cheerful' }, text: ['*makes it flash every colour at once, and laughs*'] },
    { if: { childTemper: 'shy' }, text: ['*shows you, very carefully, cupping it so the light only falls on your hand*'] },
  ]);
  lines('child.rift.ways.relay', [
    { if: { childTemper: 'curious' }, text: ['Who\'s singing on the Relay? Is it someone in the city? Can they hear us back?'] },
  ]);
  lines('child.rift.ways.hands', [
    { if: { childTemper: 'shy' }, text: ['...Really? *looks at own hands as if for the first time*'] },
  ]);

  lines('child.rift.both.start', [
    { if: { childTemper: 'shy' }, text: ['...I don\'t know which way to be. So mostly I\'m quiet.'] },
    { if: { childTemper: 'curious' }, text: ['I\'m like a door. Things go through me both ways. I quite like it.'] },
  ]);
  lines('child.rift.both.which', [
    { if: { childTemper: 'shy' }, text: ['...Whichever the person I\'m with is. Is that wrong?'] },
    { if: { childTemper: 'cheerful' }, text: ['BOTH! At once! I\'m having noodles at second breakfast tomorrow!'] },
  ]);
  // =====================================================================================
  // A rift-born child who lost someone in the crossing
  // =====================================================================================
  addThread({
    id: 'child.rift.lost', label: (F) => (F.lost ? `About ${F.lost}` : 'Someone you lost'), weight: 1.3, cool: 5,
    when: (F) => kid(F) && F.band !== 'toddler' && F.rift && !!F.lost && !!F.lostRel,
    open: { comfort: 'child.rift.lost.open' },
    beats: {
      start: { line: 'child.rift.lost.start', fx: { learn: ['child.lost', '{Name} lost {their} {lostRel}, {lost}, in the crossing'] }, go: [
        { ap: 'ask', say: 'Tell me about {lost}.', to: 'about' },
        { ap: 'comfort', say: 'The rifts still open. People still come through.', to: 'hope' },
        { ap: 'listen', say: '*You sit down on the wall beside them.*', label: 'Sit beside them', to: 'quiet' },
      ] },
      quiet: { line: 'child.rift.lost.quiet', fx: { trust: 0.04, drive: { lonely: -0.15 } }, go: [
        { ap: 'ask', say: 'Tell me about {lost}.', to: 'about' },
        { ap: 'comfort', say: 'The rifts still open. People still come through.', to: 'hope' },
      ] },
      about: { line: 'child.rift.lost.about', go: [
        { ap: 'warm', say: 'I\'ll keep the name in my head. Every rift I see, I\'ll look.', to: 'promise', fx: { promise: { k: 'child.lost', t: 'You promised {name} to look for {lost} at every rift', days: 30 } } },
        { ap: 'advise', say: 'Write it all down. Everything you remember. So it keeps.', to: 'write', fx: { lean: 'hill' } },
        { ap: 'advise', say: 'Ask at the Relay. Messages go further than people.', to: 'relay', fx: { lean: 'rift' } },
      ] },
      hope: { line: 'child.rift.lost.hope', go: [
        { ap: 'warm', say: 'I\'ll keep the name in my head. Every rift I see, I\'ll look.', to: 'promise', fx: { promise: { k: 'child.lost', t: 'You promised {name} to look for {lost} at every rift', days: 30 } } },
        { ap: 'ask', say: 'Tell me about {lost}.', to: 'about' },
      ] },
      promise: { line: 'child.rift.lost.promise', fx: { trust: 0.05, fond: 0.03, remember: 'The wizard promised to look for {lost}.', rv: 2 }, end: true },
      write: { line: 'child.rift.lost.write', fx: { respect: 0.03 }, end: true },
      relay: { line: 'child.rift.lost.relay', fx: { respect: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.rift.lost.open', [
    { text: ['You were thinking of {lost} again, weren\'t you, {name}?', 'I heard you came through without your {lostRel}, {name}. I\'m sorry.'] },
  ]);
  lines('child.rift.lost.start', [
    { text: ['{Lost} was right behind me. Right there. And then the light went, and it was just me.', 'Every time the sky tears I run to look. It\'s never {lost}.', 'We were holding hands. In the crossing. I let go. I don\'t know why I let go.'] },
    { if: { band: 'young' }, text: ['Where\'s {lost}? Do you know? You know everything.', '{Lost} said "don\'t let go" and I did. I didn\'t mean to.'] },
    { if: { band: 'youth' }, text: ['I tell myself {lost} landed somewhere with no signal. That\'s all. Somewhere with no signal.'] },
    { if: { childTemper: 'shy' }, text: ['...I don\'t talk about {lost}. If I talk about it, it\'s real.'] },
    { if: { childTemper: 'cheerful' }, text: ['{Lost}\'s coming. I know it. I keep a spare spoon at supper. Just in case.'] },
    { if: { childTemper: 'gloomy' }, text: ['{Lost}\'s gone. Everyone says "maybe". Maybe means no.'] },
  ]);
  lines('child.rift.lost.quiet', [
    { text: ['*after a long while* ...Thanks.', '*leans, very slightly, against your arm*', '*sniffs, and says nothing, and that is all right*'] },
  ]);
  lines('child.rift.lost.about', [
    { text: ['{Lost} could whistle through two fingers. Loud enough to stop a train.', '{Lost} gave me the last noodle. Every time. Even when {lost} was hungry.', '{Lost} used to tell me the city was a dragon asleep, and the lights were its scales.'] },
    { if: { lostRel: 'brother' }, text: ['My brother. Bossy. The worst. I\'d give anything.'] },
    { if: { lostRel: 'sister' }, text: ['My sister. She plaited my hair every morning. Nobody does it right now.'] },
    { if: { lostRel: ['mother', 'father'] }, text: ['They sang the lullaby. The willow lamp one. Every night. I sing it to myself now.'] },
    { if: { lostRel: 'best friend' }, text: ['My best friend. We had a code. Two blinks and a tap. I still do it at the sky.'] },
  ]);
  lines('child.rift.lost.hope', [
    { text: ['They do. ...They do, don\'t they.', 'Do you think {lost} might? Really?', 'Somebody\'s sister came through. Ages after. So it happens.'] },
    { if: { childTemper: 'gloomy' }, text: ['...You\'re just saying that. ...Say it again, though.'] },
  ]);
  lines('child.rift.lost.promise', [
    { text: ['Every rift? You promise?', 'You\'ll know {lost}. {Lost} looks like me but taller and crosser.', 'Then there are two of us looking. That\'s better.'] },
  ]);
  lines('child.rift.lost.write', [
    { text: ['Everything? Even the little things?', 'I\'ll write it in the back of my letters book. So it keeps.', 'So if I forget, the book won\'t.'] },
  ]);
  lines('child.rift.lost.relay', [
    { text: ['The Relay! I could send a ping. Every night. Just in case.', 'Messages go further than people. ...I\'ll go tonight.', 'I never thought of that. I\'ll ask the tinkers to help.'] },
  ]);

  // =====================================================================================
  // Where the young ones get to
  // =====================================================================================
  addThread({
    id: 'child.youth.friends', label: 'Where do you young ones get to?', weight: 1, cool: 4,
    when: (F) => youth(F),
    open: { ask: 'child.youth.friends.open' },
    beats: {
      start: { line: 'child.youth.friends.start', go: [
        { ap: 'ask', say: 'And who\'s in your lot, these days?', to: 'who' },
        { ap: 'jest', say: 'I was young once. I know exactly what goes on at that bridge.', to: 'bridge' },
        { ap: 'warm', say: 'It sounds a fine way to spend an evening.', to: 'fine' },
      ] },
      bridge: { line: 'child.youth.friends.bridge', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'Who\'s in your lot, then?', to: 'who' },
        { ap: 'tale', say: 'In my day it was a bridge over a much colder river. With a troll under it.', to: 'troll' },
      ] },
      troll: { line: 'child.youth.friends.troll', fx: { fond: 0.02 }, end: true },
      who: { line: 'child.youth.friends.who', go: [
        { ap: 'ask', say: 'And has anyone fallen out lately?', to: 'fallen', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'Good friends are worth more than a hole full of gold.', to: 'gold', fx: { lean: 'hill' } },
      ] },
      fallen: { line: 'child.youth.friends.fallen', go: [
        { ap: 'advise', say: 'Go first. Whoever says sorry first is the bigger hobbit.', to: 'first', fx: { lean: 'hill' } },
        { ap: 'advise', say: 'Ask them, straight out, what\'s wrong. Plain words mend quickest.', to: 'plain', fx: { lean: 'rift' } },
      ] },
      first: { line: 'child.youth.friends.first', fx: { respect: 0.03 }, end: true },
      plain: { line: 'child.youth.friends.plain', fx: { respect: 0.03 }, end: true },
      gold: { line: 'child.youth.friends.gold', fx: { fond: 0.02 }, end: true },
      fine: { line: 'child.youth.friends.fine', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.youth.friends.open', [
    { text: ['Where do you young ones get to of an evening, {name}?', 'I never see your lot about, {name}. Where do you hide?'] },
  ]);
  lines('child.youth.friends.start', [
    { text: ['The bridge. We sit on the wall and drop sticks and talk about nothing.', 'Down by the river. Behind the reeds. Where the grown-ups can\'t see.', 'The old quarry. It echoes. We shout things.'] },
    { if: { childTween: true }, pri: 1, text: ['Round the back of the Badger. They let us have half a pint if we\'re quiet. We\'re never quiet.', 'The top of the hill, mostly. To watch the stars and talk about leaving. Nobody leaves.'] },
    { if: { childRiftFolk: true }, text: ['The Relay steps. It\'s warm there at night, and it hums. And the rift kids show us things.'] },
    { if: { childTemper: 'shy' }, text: ['...I don\'t go much. Sometimes I sit near. That counts.'] },
    { if: { childTemper: 'ornery' }, text: ['Wherever we like. That\'s the point.'] },
    { if: { childTemper: 'cheerful' }, text: ['Everywhere! The bridge, the river, the hill! We have a route!'] },
    { if: { season: 'winter' }, text: ['The barn. There\'s hay and it\'s warm and someone always brings a lantern.'] },
  ]);
  lines('child.youth.friends.bridge', [
    { text: ['You do NOT know. ...What do you know?', 'Ha. Nothing goes on. We drop sticks.', 'Don\'t tell anyone. Whatever you think you know.'] },
  ]);
  lines('child.youth.friends.troll', [
    { text: ['A real troll? Under a bridge? That\'s just a story.', 'What did you do? Pay the toll?', 'We\'ve got no trolls. Just a heron that hates us.'] },
  ]);
  lines('child.youth.friends.who', [
    { text: ['The usual. Six of us, maybe seven. Depends who\'s been grounded.', 'Everyone our age. There aren\'t that many of us.'] },
    { if: { childPal: has }, text: ['{ChildPal}, mostly. {ChildPal} and me since we were small.', '{ChildPal}. And whoever {childPal} drags along.'] },
    { if: { childCrush: has }, text: ['A few. ...{ChildCrush} comes sometimes. Not that I notice.'] },
    { if: { childRiftName: has }, text: ['{ChildRiftName} sometimes. {ChildRiftName} tells the best stories. All neon and noodles.'] },
  ]);
  lines('child.youth.friends.fallen', [
    { text: ['...Me and someone. Over something stupid. It\'s been a week.', 'Sort of. Someone said a thing. I said a worse thing.', 'Not fallen out. Drifted. Which is worse, somehow.'] },
    { if: { childPal: has }, text: ['...Me and {childPal}. Over nothing. We\'re both too stubborn.'] },
  ]);
  lines('child.youth.friends.first', [
    { text: ['The bigger hobbit. ...I\'d quite like to be the bigger hobbit.', 'Ugh. All right. Tomorrow.', 'Sorry first. Fine. It still costs.'] },
  ]);
  lines('child.youth.friends.plain', [
    { text: ['Plain words. That\'s the rift way, isn\'t it? Just say it.', 'Straight out. All right. I can do that.', 'That\'s braver than sorry, somehow.'] },
  ]);
  lines('child.youth.friends.gold', [
    { text: ['More than gold. Yes. Don\'t tell them I agreed.', 'I wouldn\'t swap them. Not for a dragon\'s hoard.', 'They\'re rubbish. And the best. Both.'] },
  ]);
  lines('child.youth.friends.fine', [
    { text: ['It is. Best part of the day.', 'Don\'t tell my folks it\'s fine. They think it\'s a den of wickedness.', 'It is fine. Don\'t come, though. No offence.'] },
  ]);

  // =====================================================================================
  // A child frightened by a rift close by, read as a situation
  // =====================================================================================
  addSituation('child.scared', {
    pri: 2, read: (F) => F.stage === 'child' && F.band !== 'toddler' && !F.childTween && F.childRiftOpen && !F.rift && (F.childTemper === 'shy' || F.childTemper === 'gloomy' || F.mood === 'low'), thread: 'child.sit.scared',
    aps: {
      comfort: { base: 1, out: ['cling', 'calmer', 'brave'] },
      tale: { base: 1, out: ['cling', 'listens', 'brave'] },
      jest: { base: 0, out: ['tears', 'wobbly', 'giggle'] },
      ask: { base: 1, out: ['cling', 'says', 'calmer'] },
    },
  });
  lines('sit.child.scared.comfort', [{ text: ['Come here, {name}. I\'ve got you. Nothing will come through while I\'m standing here.'] }]);
  lines('sit.child.scared.tale', [{ text: ['Shall I tell you what\'s really on the other side of that, {name}? It\'s not so frightening.'] }]);
  lines('sit.child.scared.jest', [{ text: ['It\'s only the sky yawning, {name}. It\'s had a long day.'] }]);
  lines('sit.child.scared.ask', [{ text: ['What is it about the rift that frightens you, {name}?'] }]);
  addThread({
    id: 'child.sit.scared', situation: true, label: 'Frightened of the rift',
    beats: {
      cling: { line: 'child.sit.scared.cling', fx: { trust: 0.02 }, end: true },
      calmer: { line: 'child.sit.scared.calmer', fx: { trust: 0.04, open: 1 }, go: [
        { ap: 'tale', say: 'It\'s a door, not a mouth. Children come through it, mostly. Like you.', to: 'brave', fx: { lean: 'rift' } },
        { ap: 'warm', say: 'Shall I walk you home? The long way, away from it.', to: 'home', fx: { lean: 'hill' } },
      ] },
      brave: { line: 'child.sit.scared.brave', fx: { trust: 0.05, fond: 0.03, run: (T, v) => { if (typeof unfeel === 'function') unfeel(v, 'uneasy'); } }, end: true },
      listens: { line: 'child.sit.scared.listens', fx: { open: 1 }, go: [
        { ap: 'tale', say: 'Behind it is a city of lamps, and its children are sent here to be safe.', to: 'brave', fx: { lean: 'rift' } },
        { ap: 'comfort', say: 'And every tear in the sky mends by morning. Every one.', to: 'calmer', fx: { lean: 'hill' } },
      ] },
      tears: { line: 'child.sit.scared.tears', fx: { fond: -0.02 }, end: true },
      wobbly: { line: 'child.sit.scared.wobbly', go: [
        { ap: 'comfort', say: 'I\'m sorry. That was silly of me. Come here.', to: 'calmer' },
      ] },
      giggle: { line: 'child.sit.scared.giggle', fx: { fond: 0.03, open: 1 }, go: [
        { ap: 'jest', say: 'Yes. And it hasn\'t brushed its teeth.', to: 'brave' },
      ] },
      says: { line: 'child.sit.scared.says', fx: { learn: ['child.fear', '{Name} is frightened of the rifts'] }, go: [
        { ap: 'comfort', say: 'Nothing will take you. I promise you that.', to: 'calmer' },
        { ap: 'tale', say: 'Let me tell you who\'s really on the other side.', to: 'listens' },
      ] },
      home: { line: 'child.sit.scared.home', fx: { fond: 0.03 }, end: true },
    },
  });
  lines('child.sit.scared.cling', [{ text: ['*holds onto your robe with both fists and won\'t let go*', '*hides behind you, peeping round at the rift*'] }]);
  lines('child.sit.scared.calmer', [{ text: ['*breathes out* ...It\'s all right while you\'re here.', '...It\'s humming. But it\'s further away now. Isn\'t it?', '*stops shaking, mostly*'] }]);
  lines('child.sit.scared.brave', [{ text: ['...Like me. Children. ...I\'m not scared of children.', '*looks at the rift properly, for the first time* ...It\'s quite pretty, really.', 'I\'m going to tell the little ones. So they\'re not scared.'] }]);
  lines('child.sit.scared.listens', [{ text: ['*sniffs* ...Go on.', 'Not so frightening? Promise?', '*listens with one eye on the sky*'] }]);
  lines('child.sit.scared.tears', [{ text: ['*bursts into tears*', 'It\'s NOT yawning! It\'s HUNGRY!', '*runs off home, wailing*'] }]);
  lines('child.sit.scared.wobbly', [{ text: ['*lip wobbles* ...Skies don\'t yawn.', 'That\'s not funny. ...It\'s a little bit funny.'] }]);
  lines('child.sit.scared.giggle', [{ text: ['*a wet giggle* ...The sky\'s tired?', 'Yawning! Ha. It is a bit like a mouth. A sleepy one.'] }]);
  lines('child.sit.scared.says', [{ text: ['It hums. Like it\'s calling. What if it calls me and I have to go?', 'Things come out. What if something comes out that isn\'t nice?', 'What if it opens over our house? In the night?'] }]);
  lines('child.sit.scared.home', [{ text: ['The long way. Yes. Past the mill.', '*takes your hand and holds on tight all the way*'] }]);
  // tempers, tweens and the rift-born, once more
  lines('child.youth.trade.start', [
    { if: { register: 'fine' }, text: ['I\'ve considered it at some length. {ChildCallingA}, I believe. It suits my temperament.'] },
    { if: { register: 'plain' }, text: ['{ChildCallingA}. Good honest work. Don\'t need letters for it.'] },
  ]);
  lines('child.youth.trade.torn', [
    { if: { childTemper: 'curious' }, text: ['...I want to try everything first. They want me settled. Both of us are right.'] },
    { if: { childTemper: 'ornery' }, text: ['...I don\'t want to be told. But I don\'t know what I want either. That\'s the annoying bit.'] },
  ]);
  lines('child.youth.trade.hours', [
    { if: { childTween: true }, pri: 1, text: ['Ha. I\'d take terrible hours if the hat came with it.'] },
  ]);
  lines('child.youth.trade.word', [
    { if: { childTemper: 'shy' }, text: ['...Would you? Then I\'d only have to say yes. I can say yes.'] },
  ]);
  lines('child.youth.sweet.start', [
    { if: { childTemper: 'curious' }, text: ['Sweet on? What does that even mean? ...Asking for a friend.'] },
    { if: { rift: true }, text: ['Back home you\'d just ping someone. Here everyone notices everything.'] },
  ]);
  lines('child.youth.sweet.caught', [
    { if: { childTemper: 'cheerful' }, text: ['Ha! Was I that obvious? I was, wasn\'t I. Was {childCrush} looking back?'] },
    { if: { childTween: true }, pri: 1, text: ['...All right. Yes. It\'s been going on a while. Don\'t make a thing of it.'] },
  ]);
  lines('child.youth.sweet.relief', [
    { if: { childTemper: 'shy' }, text: ['*silence, then, very fast* ...it\'s {childCrush}.'] },
  ]);
  lines('child.youth.leave.wiz', [
    { if: { childTemper: 'curious' }, text: ['Where did you leave? What was it like? Do you ever go back and look?'] },
  ]);
  lines('child.youth.leave.road', [
    { if: { childTemper: 'shy' }, text: ['...It doesn\'t sound so frightening, the way you say it.'] },
    { if: { childUpb: 'hill' }, text: ['Ever on. Hm. I like the door end of it better.'] },
  ]);
  lines('child.youth.leave.back', [
    { if: { childTemper: 'gloomy' }, text: ['Coming back. ...Then I\'d have somewhere to come back to. I\'d like that.'] },
  ]);
  lines('child.youth.coming.start', [
    { if: { childApprentice: has }, text: ['A grown {childApprentice}. That\'s what I\'ll be. It sounds so real.'] },
    { if: { register: 'fine' }, text: ['I find myself oddly sentimental about the whole business. Thirty-three. Gracious.'] },
  ]);
  lines('child.youth.coming.self', [
    { if: { childTemper: 'shy' }, text: ['...Permission to be quiet. Grown-ups aren\'t allowed to be quiet at parties.'] },
    { if: { childTemper: 'cheerful' }, text: ['A day off! One day every year when I\'m still allowed to be silly!'] },
  ]);
  lines('child.youth.coming.pop', [
    { if: { childTemper: 'curious' }, text: ['Is that true? What sort of pop? I\'m going to stay up and listen. With a lantern.'] },
  ]);
  lines('child.youth.scrape.start', [
    { if: { childTween: true }, pri: 1, text: ['I\'ve done something a grown hobbit shouldn\'t. Luckily I\'m not grown yet.'] },
    { if: { childTemper: 'shy' }, text: ['...I\'ve done something. And I don\'t know who to tell.'] },
  ]);
  lines('child.youth.scrape.style', [
    { if: { childTemper: 'shy' }, text: ['...No. I tripped. Over a goose. In front of everyone.'] },
  ]);
  lines('child.youth.scrape.mend', [
    { if: { childTemper: 'ornery' }, text: ['Mend it. Fine. Quietly. And nobody says a word.'] },
  ]);
  lines('child.youth.home.start', [
    { if: { childTween: true }, pri: 1, text: ['All right. I\'m out from under their feet most of the day. That helps.', 'Getting small. The hole, I mean. Or I\'m getting big.'] },
    { if: { childTemper: 'cheerful' }, text: ['Lovely! Noisy! {ChildParentWord} sings at the stove. Badly. I join in. Worse.'] },
  ]);
  lines('child.youth.home.cooking', [
    { if: { childTemper: 'cheerful' }, text: ['Ha! The cooking\'s the best part! It\'s everything else!'] },
    { if: { childTemper: 'ornery' }, text: ['I\'d eat out every night if the Badger let me.'] },
  ]);
  lines('child.youth.home.master', [
    { if: { childTemper: 'shy' }, text: ['...Even you. Then maybe I\'ll amount to something.'] },
  ]);
  lines('child.youth.friends.start', [
    { if: { register: 'fine' }, text: ['The old orchard wall. We discuss things. Philosophy. Mostly who likes whom.'] },
  ]);
  lines('child.youth.friends.first', [
    { if: { childTemper: 'shy' }, text: ['...I\'ll go first. Quietly. With a peace-offering. A good conker.'] },
  ]);
  lines('child.rift.home.start', [
    { if: { childRiftStage: { min: 8 } }, text: ['The rifts are going dim, aren\'t they. Does that mean home\'s going dim too?'] },
    { if: { register: 'bright' }, text: ['The city ran on the Lamplighter. Everything did. Even the trains. Even us, I think.'] },
  ]);
  lines('child.rift.home.walked', [
    { if: { childTemper: 'shy' }, text: ['...Was it still raining? It was always raining. I liked that.'] },
  ]);
  lines('child.rift.home.rich', [
    { if: { childTemper: 'cheerful' }, text: ['TWO HOMES! Two lots of birthdays! Two lots of food!'] },
  ]);
  lines('child.rift.ways.open', [
    { if: { riftWays: true }, text: ['You\'ve wires in your pocket, {name}. And a glow about the cuffs.'] },
  ]);
  lines('child.rift.ways.sticks', [
    { if: { childTemper: 'curious' }, text: ['What did you DO with sticks? All of it? Was it fun? Show me a stick game!'] },
  ]);
  lines('child.rift.ways.old', [
    { if: { childTemper: 'curious' }, text: ['A song that can\'t fail. Is a song a kind of machine? It sort of is, isn\'t it?'] },
  ]);
  lines('child.rift.both.between', [
    { if: { childTemper: 'shy' }, text: ['...Me? Talking for everyone? ...Maybe. If it\'s needed.'] },
    { if: { goBetween: true }, pri: 1, text: ['I already do it. At the Badger. Folk come to me to explain each other. I quite like it.'] },
  ]);
  lines('child.rift.lost.about', [
    { if: { childTemper: 'cheerful' }, text: ['{Lost} was SO funny. {Lost} could make a whole train carriage laugh.'] },
    { if: { childTemper: 'shy' }, text: ['...{Lost} always walked on the outside. Near the road. So I didn\'t have to.'] },
  ]);
  lines('child.tot.rhyme.start', [
    { if: { childPetName: has }, text: ['{ChildPetName}! *points: {childPetName} is apparently the badger*'] },
  ]);
  lines('child.tot.peekaboo.start', [
    { if: { childTemper: 'curious' }, text: ['*lifts your hat brim to check you\'re still there*'] },
    { if: { childTemper: 'cheerful' }, text: ['BOO! *does it back at you, delighted*'] },
  ]);
  // seasons, the older youths, and a few more voices
  lines('child.youth.trade.open', [
    { if: { childTween: true }, text: ['You\'re all but grown, {name}. What\'s the plan?'] },
  ]);
  lines('child.youth.trade.family', [
    { if: { childTween: true }, pri: 1, text: ['They\'ve stopped asking. That\'s worse. They just look hopeful at supper.', 'They\'d be happy with anything, they say. Then they list the things they\'d be happiest with.'] },
  ]);
  lines('child.youth.trade.nothing', [
    { if: { childTemper: 'cheerful' }, text: ['I\'d do it for nothing! Don\'t tell them that, though. I want paying.'] },
  ]);
  lines('child.youth.trade.yet', [
    { if: { childTemper: 'shy' }, text: ['...Thank you. I thought I was the only one.'] },
  ]);
  lines('child.youth.sweet.open', [
    { if: { season: 'spring' }, text: ['Spring, {name}. Hobbits your age go a bit dreamy in spring.'] },
  ]);
  lines('child.youth.sweet.confess', [
    { if: { season: 'spring' }, text: ['It\'s {childCrush}. It\'s the spring. It makes everything worse. Better. Worse.'] },
  ]);
  lines('child.youth.leave.open', [
    { if: { childTween: true }, text: ['You\'ll be of age soon, {name}. Have you thought about where?'] },
  ]);
  lines('child.youth.leave.where', [
    { if: { childTween: true }, pri: 1, text: ['Bree first. Then wherever the Bree road goes. Then I\'d write.', 'The Sea. I\'ve wanted to see the Sea since I was six. I still do.'] },
  ]);
  lines('child.youth.leave.here', [
    { if: { childTemper: 'shy' }, text: ['...Then we\'ll keep the road warm for you.'] },
  ]);
  lines('child.youth.coming.open', [
    { if: { season: 'winter' }, text: ['A winter coming of age, {name}! The best kind. Short days, long party.'] },
  ]);
  lines('child.youth.coming.generous', [
    { if: { childTemper: 'cheerful' }, text: ['Generous! That\'s me! Poor, but generous!'] },
  ]);
  lines('child.youth.coming.fireworks', [
    { if: { childTemper: 'cheerful' }, text: ['FIREWORKS! At MY party! I\'m going to cry. Happy cry.'] },
    { if: { childTemper: 'ornery' }, text: ['...Fine. Yes. Thank you. That\'s... really very good of you.'] },
  ]);
  lines('child.youth.scrape.worth', [
    { if: { childTemper: 'shy' }, text: ['...No. I don\'t think so. I feel awful.'] },
  ]);
  lines('child.youth.home.trouble', [
    { if: { childTween: true }, pri: 1, text: ['I\'m nearly grown and I still have to say where I\'m going. Every time. To the privy, practically.'] },
  ]);
  lines('child.youth.home.time', [
    { if: { childTween: true }, pri: 1, text: ['Let go. They\'re trying, I suppose. It\'s like watching someone open a jar.'] },
  ]);
  lines('child.youth.friends.who', [
    { if: { childTemper: 'shy' }, text: ['...A couple. The quiet ones. We sit at the end of the wall.'] },
  ]);
  lines('child.youth.friends.gold', [
    { if: { childTemper: 'shy' }, text: ['...They are. I\'ve only got two. They\'re enough.'] },
  ]);
  lines('child.rift.home.open', [
    { if: { childRiftStage: { min: 8 } }, text: ['The rifts are dimming, {name}. Are you thinking about the city?'] },
  ]);
  lines('child.rift.home.miss', [
    { if: { season: 'winter' }, text: ['Being warm. The city was always warm. Here my nose goes numb.'] },
  ]);
  lines('child.rift.home.breakfast', [
    { if: { childTemper: 'shy' }, text: ['...I like second breakfast. Nobody rushes you.'] },
  ]);
  lines('child.rift.ways.start', [
    { if: { season: 'winter' }, text: ['A hand-warmer! You squeeze it and it glows and goes hot. Feel!'] },
    { if: { hour: ['evening', 'night'] }, text: ['Watch, it\'s better in the dark. *it glows faintly blue in {their} cupped hands*'] },
  ]);
  lines('child.rift.ways.gran', [
    { if: { childTemper: 'cheerful' }, text: ['Ha! She\'d put it in the jam! She puts everything in the jam!'] },
  ]);
  lines('child.rift.both.lucky', [
    { if: { childTemper: 'gloomy' }, text: ['...Lucky. I\'ll try that word on. It might fit.'] },
  ]);
  lines('child.rift.lost.hope', [
    { if: { band: 'young' }, text: ['Will {lost} come through tomorrow? Or the day after? I can wait till the day after.'] },
  ]);
  lines('child.tot.rhyme.more', [
    { if: { childTemper: 'cheerful' }, text: ['*joins in with a word that isn\'t in the rhyme, very loudly*'] },
    { if: { childTemper: 'ornery' }, text: ['No hen. FOX. *glares*'] },
  ]);
  lines('child.tot.peekaboo.hat', [
    { if: { childTemper: 'shy' }, text: ['*hides inside your hat and refuses to come out*'] },
  ]);
  // the smaller beats, given voices too
  lines('child.youth.trade.kept', [
    { if: { childTween: true }, pri: 1, text: ['Fed and housed and loved, all from the one trade. That\'s worth thinking about.'] },
  ]);
  lines('child.youth.trade.own', [
    { if: { childTween: true }, pri: 1, text: ['Mine to make. I\'ve known it for a while. It helps to hear someone say it.'] },
  ]);
  lines('child.youth.sweet.radish', [
    { if: { childTemper: 'cheerful' }, text: ['A radish! Ha! Fine, I\'m a radish. A happy radish.'] },
    { if: { childTemper: 'ornery' }, text: ['Say radish again. Go on. I dare you.'] },
  ]);
  lines('child.youth.sweet.flower', [
    { if: { childTween: true }, pri: 1, text: ['A flower. The old way. ...The old way\'s lasted this long for a reason, I suppose.'] },
  ]);
  lines('child.youth.leave.needed', [
    { if: { childTemper: 'cheerful' }, text: ['Needed! Ha! I\'ll tell my folks. They think I\'m only needed for the washing-up.'] },
  ]);
  lines('child.youth.coming.waistcoat', [
    { if: { childTemper: 'shy' }, text: ['...Even you. Then I\'ll just put the waistcoat on. And carry on.'] },
  ]);
  lines('child.youth.coming.feel', [
    { if: { childTemper: 'cheerful' }, text: ['I feel AMAZING. Is that grown? It feels like being six but taller.'] },
  ]);
  lines('child.youth.scrape.body', [
    { if: { childTemper: 'shy' }, text: ['...No! No. Nothing like that. Just a... a fence. A fence is dead.'] },
  ]);
  lines('child.youth.home.show', [
    { if: { childTemper: 'shy' }, text: ['...I could fix the shelf. Without being asked. They\'d notice that.'] },
    { if: { childTween: true }, pri: 1, text: ['Show them. Right. I\'ll take on the garden. All of it. They\'ll see.'] },
  ]);
  lines('child.youth.friends.troll', [
    { if: { childTween: true }, pri: 1, text: ['A troll under a bridge. ...You\'re pulling my leg. Aren\'t you?'] },
  ]);
  lines('child.youth.friends.plain', [
    { if: { childTemper: 'shy' }, text: ['...Plain words. I\'ll write them first. Then say them.'] },
  ]);
  lines('child.rift.home.lamplighter', [
    { if: { childTemper: 'shy' }, text: ['*very quietly* ...tell it thank you. Next time.'] },
    { if: { band: 'young' }, text: ['Did it laugh? Engines can\'t laugh! ...Can they?'] },
  ]);
  lines('child.rift.home.teach', [
    { if: { childTemper: 'cheerful' }, text: ['YES! Glitch-tag for everyone! By teatime!'] },
  ]);
  lines('child.rift.ways.relay', [
    { if: { childTemper: 'shy' }, text: ['...I\'ll sit on the steps and listen. Nobody minds if you just listen.'] },
  ]);
  lines('child.rift.ways.hands', [
    { if: { childTemper: 'cheerful' }, text: ['Great things! A lamp for every hole! A glowing maypole!'] },
  ]);
  lines('child.rift.both.neon', [
    { if: { childTemper: 'shy' }, text: ['...Yes. Quietly. With the neon turned down.'] },
  ]);
  lines('child.rift.both.nochoose', [
    { if: { childTemper: 'cheerful' }, text: ['Never choose! I\'m having both forever!'] },
  ]);
  lines('child.rift.lost.write', [
    { if: { childTemper: 'shy' }, text: ['...I\'ll write it small. In the back. Where only I look.'] },
  ]);
  lines('child.rift.lost.relay', [
    { if: { childTemper: 'cheerful' }, text: ['A ping every night! {Lost} always answered pings! Always!'] },
  ]);
  lines('child.sit.scared.home', [
    { text: ['*holds your sleeve all the way, and only lets go at the door*'] },
  ]);
  lines('child.sit.scared.calmer', [
    { text: ['...Your hand\'s warm. Rifts aren\'t warm.'] },
  ]);
  lines('child.tot.rhyme.silly', [
    { if: { childTemper: 'curious' }, text: ['*puts a hand on your chest to feel the deep voice rumble*'] },
  ]);
  lines('child.tot.rhyme.lamp', [
    { if: { childTemper: 'shy' }, text: ['*hums one note of it, over and over, very softly*'] },
  ]);
  lines('child.tot.peekaboo.boo', [
    { if: { childTemper: 'curious' }, text: ['*pulls your hand down to see where you went*'] },
  ]);
});
