'use strict';
// ---------------------------------------------------------------------------
// The ages of life, part three: life's big questions, asked of the wizard.
// Folk of every age come to him with them now and then (these are all their
// own threads): what's beyond the hills, does he get lonely, is he afraid of
// anything, how old is he really, was he ever young, what's the secret of a
// happy life, will anyone remember us, can he give an old hobbit back their
// years, and what happens when hobbits go on their last adventure. You choose
// between thoughtful, kind and funny answers, and what you say is shaped to
// who's asking: a child gets the tale, an elder the truth gently put.
// ---------------------------------------------------------------------------

talkPack('ages3', () => {
  const L = (key, o, extra) => {
    const rules = [];
    for (const k in o) {
      if (k === '_') rules.push({ text: o[k] });
      else if (k.startsWith('k:')) rules.push({ if: { ageNature: k.slice(2) }, text: o[k] });
      else if (k.startsWith('s:')) rules.push({ if: { stage: k.slice(2) }, text: o[k] });
      else rules.push({ if: { temper: k }, text: o[k] });
    }
    lines(key, rules.concat(extra || []));
  };
  const has = (x) => x != null && x !== false && x !== '';
  const known = (F) => F.met && F.talks >= 1;

  // ==================================================================================
  // What's beyond the hills?
  // ==================================================================================
  addThread({
    id: 'ages.ask.beyond', theirs: true, label: 'They ask what\'s beyond the hills', cool: 10, ask: '{Name} is looking past you, at the hills.',
    when: (F) => known(F) && F.stage !== 'elder' && !F.rift,
    beats: {
      start: { line: 'ages.beyond.q', go: [
        { ap: 'tale', say: 'ages.beyond.a.tale', label: 'More hills, then a river, then the Sea…', to: 'wonder' },
        { ap: 'jest', say: 'ages.beyond.a.jest', label: 'More hills. Then an inn. Then more hills.', to: 'laugh' },
        { ap: 'share', say: 'ages.beyond.a.share', label: 'Nothing half as good as this valley.', to: 'home' },
      ] },
      wonder: { line: 'ages.beyond.wonder', go: [
        { ap: 'warm', say: 'ages.beyond.a.gate', label: 'If you want to. The road starts at your gate.', to: 'gate' },
        { ap: 'advise', say: 'Go as far as the next hill first. See if you like the view.', to: 'nexthill' },
        { ap: 'comfort', say: 'Some of it, I think. The best of it comes to you.', to: 'comes' },
      ] },
      laugh: { line: 'ages.beyond.laugh', go: [
        { ap: 'tale', say: 'ages.beyond.a.tale', label: 'All right. More hills, then a river, then the Sea…', to: 'wonder' },
        { ap: 'share', say: 'ages.beyond.a.share', label: 'Truly? Nothing half as good as this valley.', to: 'home' },
      ] },
      home: { line: 'ages.beyond.home', go: [
        { ap: 'warm', say: 'Home\'s the place that makes the rest worth seeing.', to: 'worth' },
        { ap: 'jest', say: 'The Mountain has very poor pies. I\'ve checked.', to: 'pies' },
      ] },
      gate: { line: 'ages.beyond.gate', fx: { feel: 'inspired', fond: 0.02 }, end: true },
      nexthill: { line: 'ages.beyond.nexthill', fx: { respect: 0.02, drive: { bored: -0.08 } }, end: true },
      comes: { line: 'ages.beyond.comes', fx: { trust: 0.02 }, end: true },
      worth: { line: 'ages.beyond.worth', fx: { fond: 0.02 }, end: true },
      pies: { line: 'ages.beyond.pies', fx: { joke: { k: 'ages.pies', t: 'The Mountain has very poor pies. The wizard checked.' } }, end: true },
    },
    end: { fond: 0.01 },
  });
  L('ages.beyond.q', {
    _: ['Wizard? What\'s really beyond the hills? Not the story. The real thing.', 'You\'ve been past the hills. What\'s there? I\'ve always wondered.'],
    cheerful: ['Ooh, tell me! What\'s over the hills? Is it lovely? Say it\'s lovely!'],
    ornery: ['Go on, then. What\'s over the hills that\'s so special folk keep leaving?'],
    shy: ['...Can I ask you something? What\'s over there? Past the hills?'],
    curious: ['I\'ve a question I\'ve been saving. What\'s beyond the hills? Exactly. In order.'],
    dreamy: ['When the hills go blue in the evening, what\'s behind them? What does it look like?'],
    witty: ['Settle something for me. Is it true there\'s nothing past the hills but more hills?'],
    proud: ['I\'ve always meant to see what\'s beyond the hills. What would I find?'],
    gloomy: ['Is it better, over the hills? Is that why folk go?'],
    child: ['Mister Wizard! What\'s on the other side of the hills? Is it dragons?', 'What\'s past the hills? Is it the edge of the world? Can you fall off?'],
    'k:curious': ['What\'s beyond the hills? And beyond that? And beyond THAT?'],
  }, [
    { if: { ageAway: has }, text: ['{AgeAway}\'s gone over the hills. What will {ageAway} see? What\'s there?'] },
  ]);
  lines('ages.beyond.a.tale', [
    { text: ['More hills, then a river wide as the sky, then woods, then mountains with snow in summer, and at the very end, the Sea.'] },
    { if: { stage: 'child' }, text: ['More hills, then a forest where the trees whisper, then mountains with snow on, and then the Sea, which is a pond that forgot to stop.'] },
    { if: { stage: 'grown', temper: 'curious' }, text: ['Hills for three days, then the Brandywine, then the Old Forest, the Barrow-downs, Bree, and a great deal more. I\'ll draw you a map.'] },
  ]);
  lines('ages.beyond.a.jest', [
    { text: ['More hills. Then an inn. Then more hills. Then a slightly worse inn.'] },
    { if: { stage: 'child' }, text: ['More hills. And a troll who wants his ball back. Have you seen a ball?'] },
  ]);
  lines('ages.beyond.a.share', [
    { text: ['Nothing half as good as this valley. I\'ve looked. I keep coming back.'] },
    { if: { stage: 'child' }, text: ['Lots of things. But nothing as good as here. That\'s why I always come back.'] },
  ]);
  lines('ages.beyond.a.gate', [
    { text: ['If you want to. The road starts at your own gate. It always has.'] },
    { if: { stage: 'child' }, text: ['When you\'re bigger, if you want to. The road starts right at your gate. It\'ll wait.'] },
  ]);
  L('ages.beyond.wonder', {
    _: ['The Sea. Will I ever see it, do you think?', 'Snow in summer. ...I\'d like to see that. Will I?'],
    cheerful: ['Oh, the Sea! Will I see it? Will I? I want to see EVERYTHING!'],
    ornery: ['Hmph. Sounds a long walk. ...Would I make it, do you think?'],
    shy: ['...That sounds very big. Could someone like me ever go?'],
    curious: ['A river wide as the sky! How wide is that exactly? Could I see it one day?'],
    dreamy: ['The Sea at the very end. Oh. I can almost hear it. Will I ever?'],
    witty: ['And at the end, the Sea. And then you have to walk all the way back. Will I, though?'],
    proud: ['I\'ll see it. One day. Won\'t I?'],
    gloomy: ['And I\'ll never see any of it.'],
    child: ['The SEA! Will I see it? When I\'m big? Will I?', 'Snow in SUMMER? Can I go? Can I go tomorrow?'],
  });
  L('ages.beyond.laugh', {
    _: ['Ha! A worse inn! No, really. What\'s there?', 'Ha! You\'re dreadful. Tell me properly.'],
    cheerful: ['Ahaha! A worse inn! Oh, go on, tell me properly!'],
    ornery: ['Very funny. Now the real answer.'],
    shy: ['...Ha. But really?'],
    curious: ['Ha. But what\'s in between the inns?'],
    dreamy: ['Ha. You\'re teasing. Tell me the real one.'],
    witty: ['Ha! I knew it. But seriously, what\'s there?'],
    proud: ['Ha. Yes. But truly?'],
    gloomy: ['Ha. ...But truly?'],
    child: ['NO! A troll! Really? REALLY? No, tell me properly!'],
  });
  L('ages.beyond.home', {
    _: ['Truly? Better than the Mountain? Better than the Sea?', 'Nothing as good as here? You\'re just saying that.'],
    cheerful: ['Oh, I knew it! I always said so! Thistledown\'s the best!'],
    ornery: ['Then why does everyone keep leaving?'],
    shy: ['...That makes me feel better about staying.'],
    curious: ['But how can that be? You\'ve seen everything.'],
    dreamy: ['Then we\'re lucky. The ones who stay.'],
    witty: ['You haven\'t tried my aunt\'s cooking.'],
    proud: ['Of course not. It\'s Thistledown.'],
    gloomy: ['Then it\'s all the same everywhere. Hm.'],
    child: ['Better than DRAGONS?', 'Truly? Better than everywhere?'],
  });
  L('ages.beyond.gate', {
    _: ['From my own gate. Ha. I\'ve walked past it a thousand times.', 'My gate. I\'ll look at it differently now.'],
    cheerful: ['From my gate! I\'m going to go and stand at it right now!'],
    ornery: ['My gate sticks. Typical.'],
    shy: ['...My gate. Maybe one day.'],
    curious: ['Every road starts at a gate? Then they\'re all joined up. How lovely.'],
    dreamy: ['The road starts at my gate. Oh, I\'ll dream about that tonight.'],
    witty: ['My gate leads to the privy. But I take your point.'],
    proud: ['I\'ll take it when I choose.'],
    gloomy: ['...Maybe. One day.'],
    child: ['My gate? MY gate? I\'m going to look at it!'],
  });
  L('ages.beyond.nexthill', {
    _: ['The next hill. Yes. That\'s not so far.', 'See if I like the view. Ha. I\'ll do that.'],
    cheerful: ['Yes! The next hill! With a picnic!'],
    ornery: ['One hill. Fine. I\'ll judge it.'],
    shy: ['...Just one hill. I could do one.'],
    curious: ['And then the one after. And then I\'ll know.'],
    dreamy: ['From the top of the next hill I\'ll see the hill after. Oh.'],
    witty: ['If I don\'t like the view, I\'ll complain to you.'],
    proud: ['One hill. Easily.'],
    gloomy: ['...All right. One hill.'],
    child: ['Can I go NOW?', 'The next hill! Then the next! Then the SEA!'],
  });
  L('ages.beyond.comes', {
    _: ['The best of it comes to me? ...Like you, you mean.', 'Comes to me. Hm. Like the travelers, and the letters.'],
    cheerful: ['Like you! You came to us!'],
    ornery: ['It\'d better bring something useful.'],
    shy: ['...That suits me. I\'ll wait for it.'],
    curious: ['Like the rift-folk. They brought a whole world with them.'],
    dreamy: ['The world comes knocking. Yes. I\'ll leave the door open.'],
    witty: ['Like the mail. Late, and damp.'],
    proud: ['As it should.'],
    gloomy: ['...I hope so.'],
    child: ['Like YOU!'],
  });
  L('ages.beyond.worth', {
    _: ['Makes the rest worth seeing. I like that.', 'Then I\'ll see a bit, and come home. That\'s the way.'],
    cheerful: ['Oh, that\'s lovely! I\'m going to say that to everyone!'],
    ornery: ['Hmph. That\'s wise. Annoyingly.'],
    shy: ['...I\'ll remember that.'],
    curious: ['So you only know home\'s good when you\'ve left it? Interesting.'],
    dreamy: ['The going and the coming back. That\'s the whole song.'],
    witty: ['And makes the pies taste better.'],
    proud: ['Exactly so.'],
    gloomy: ['...That\'s nice. Thank you.'],
    child: ['Home is the BEST.'],
  });
  L('ages.beyond.pies', {
    _: ['Ha! You checked! Of course you did!', 'Poor pies! Then I\'m staying put.'],
    cheerful: ['Ha! Then I\'ll take my own!'],
    ornery: ['Then what\'s the point of a mountain?'],
    shy: ['...Ha. Good. I\'ll stay.'],
    curious: ['What\'s wrong with them? Too much crust?'],
    dreamy: ['A mountain with no good pies. How sad for it.'],
    witty: ['Then the Mountain\'s overrated. I always said.'],
    proud: ['Our pies are the best anywhere. I knew it.'],
    gloomy: ['Ha. Typical.'],
    child: ['Ew! Bad pies!'],
  });

  // ==================================================================================
  // Do you ever get lonely?
  // ==================================================================================
  addThread({
    id: 'ages.ask.lonely', theirs: true, label: 'They ask if you get lonely', cool: 12, ask: '{Name} has been thinking about something.',
    when: (F) => known(F) && (F.fond >= 0.15 || F.stage === 'child'),
    beats: {
      start: { line: 'ages.lonely.q', go: [
        { ap: 'share', say: 'ages.lonely.a.share', label: 'Sometimes. On the road, at night.', to: 'honest' },
        { ap: 'jest', say: 'ages.lonely.a.jest', label: 'Never. My hat\'s excellent company.', to: 'hat' },
        { ap: 'warm', say: 'ages.lonely.a.warm', label: 'Not here. Never here.', to: 'nothere' },
      ] },
      honest: { line: 'ages.lonely.honest', fx: { trust: 0.03 }, go: [
        { ap: 'warm', say: 'I\'d like that very much.', to: 'invite' },
        { ap: 'ask', say: 'Do you ever get lonely?', to: 'them' },
        { ap: 'jest', say: 'Careful. I eat a great deal.', to: 'eat' },
      ] },
      hat: { line: 'ages.lonely.hat', go: [
        { ap: 'share', say: 'All right. Sometimes. On the road, at night.', to: 'honest' },
        { ap: 'ask', say: 'Why do you ask? Do you get lonely?', to: 'them' },
      ] },
      nothere: { line: 'ages.lonely.nothere', fx: { fond: 0.03 }, go: [
        { ap: 'ask', say: 'And you? Do you ever get lonely?', to: 'them' },
        { ap: 'share', say: 'On the road, though. Sometimes, on the road.', to: 'honest' },
      ] },
      them: { line: 'ages.lonely.them', fx: { learn: ['trouble', 'feeling lonely sometimes'], trust: 0.02 }, go: [
        { ap: 'comfort', say: 'Then we\'ll keep each other company, now and then.', to: 'company' },
        { ap: 'advise', say: 'Go to the sing-song on Mersday. Sit by someone new.', to: 'mersday' },
      ] },
      invite: { line: 'ages.lonely.invite', fx: { fond: 0.04, trust: 0.03 }, end: true },
      eat: { line: 'ages.lonely.eat', fx: { fond: 0.03, joke: { k: 'ages.eat', t: 'The wizard eats a great deal. They\'ve been warned.' } }, end: true },
      company: { line: 'ages.lonely.company', fx: { fond: 0.03, drive: { lonely: -0.15 } }, end: true },
      mersday: { line: 'ages.lonely.mersday', fx: { respect: 0.02, drive: { lonely: -0.05 } }, end: true },
    },
  });
  L('ages.lonely.q', {
    _: ['Do you ever get lonely? On the road, I mean. All on your own.', 'Can I ask you something? Do wizards get lonely?'],
    cheerful: ['Do you ever get lonely? You must have friends everywhere! Don\'t you?'],
    ornery: ['All that wandering. Don\'t you get lonely? Or are you too proud to say?'],
    shy: ['...Do you ever get lonely? I wondered. You\'re always on your own.'],
    curious: ['I\'ve been wondering. When you\'re on the road, who do you talk to?'],
    dreamy: ['When you\'re out under the stars on your own, do you feel lonely, or free?'],
    witty: ['Do you get lonely? Or do you just talk to the horse?'],
    proud: ['A wizard on his own. Does it never trouble you?'],
    gloomy: ['Do you get lonely? I do. I wondered if everyone did.'],
    child: ['Do you have a mom? Who do you live with? Are you lonely?', 'Do wizards have friends? Who\'s your best friend?'],
  }, [
    { if: { stage: 'elder' }, text: ['You\'ve outlived everyone you ever knew, I expect. Doesn\'t that get lonely?'] },
  ]);
  lines('ages.lonely.a.share', [
    { text: ['Sometimes. On the road, at night, when the fire\'s low. Then I think of places like this, and it passes.'] },
    { if: { stage: 'child' }, text: ['Sometimes, at night, on the road. Then I think of all my friends, like you, and I feel better.'] },
    { if: { stage: 'elder' }, text: ['Yes. More than I say. Old friends go, and the road gets long. But there are always new ones.'] },
  ]);
  lines('ages.lonely.a.jest', [
    { text: ['Never. My hat\'s excellent company. Bit of a know-it-all.'] },
    { if: { stage: 'child' }, text: ['Never! My hat talks to me. It\'s very rude. Tells me to eat my vegetables.'] },
  ]);
  lines('ages.lonely.a.warm', [
    { text: ['Not here. Never here. Not with folk like you about.'] },
    { if: { stage: 'child' }, text: ['Not when I\'m here! Not with you running about.'] },
  ]);
  L('ages.lonely.honest', {
    _: ['Then you\'ll come to ours. Any night you like. There\'s always a chair.', 'Well, you\'ve a chair at my table. Whenever you\'re passing.'],
    cheerful: ['Oh, then come to supper! Every night! We\'ve plenty!'],
    ornery: ['Hmph. Well. There\'s a chair by my fire. Don\'t make a habit of it. ...Do.'],
    shy: ['...You could come by. If you wanted. I\'d make tea.'],
    curious: ['What do you think about, at night? No. Come and tell me over supper.'],
    dreamy: ['Then think of my window, with the lamp lit. It\'ll be lit for you.'],
    witty: ['Then come to ours. You\'ll never be lonely again. You\'ll wish you were.'],
    proud: ['You\'re always welcome at my door. I\'d be honored.'],
    gloomy: ['...Me too. Maybe we could be lonely together. That\'s less lonely.'],
    child: ['You can sleep at ours! In the spare room! I\'ll ask Mom!', 'You can be MY friend! Then you\'re not lonely!'],
  });
  L('ages.lonely.hat', {
    _: ['Ha! A know-it-all hat. That explains a lot.', 'Ha! But truly?'],
    cheerful: ['Ahaha! Does it sing? Does your hat sing?'],
    ornery: ['That\'s not an answer. That\'s a hat.'],
    shy: ['...Ha. But really?'],
    curious: ['What does the hat say? No. Truly, though?'],
    dreamy: ['Ha. But under the hat?'],
    witty: ['Your hat and I should meet. We\'d get on.'],
    proud: ['A fine hat. But you\'re dodging.'],
    gloomy: ['Ha. ...That\'s not really an answer, is it.'],
    child: ['Does it really talk? Make it talk!', 'Hee! Hats can\'t talk! ...Can they?'],
  });
  L('ages.lonely.nothere', {
    _: ['Not here. Oh, that\'s nice. That\'s very nice.', 'Good. We\'d hate to think of you lonely here.'],
    cheerful: ['Oh, good! That\'s how it should be!'],
    ornery: ['Hmph. Good. ...Good.'],
    shy: ['...I\'m glad.'],
    curious: ['What makes here different? I\'d like to know.'],
    dreamy: ['Then this valley\'s done its job.'],
    witty: ['Not here. We\'re too nosy for anyone to be lonely.'],
    proud: ['Of course not. We\'re a hospitable village.'],
    gloomy: ['...I\'m glad someone isn\'t.'],
    child: ['Yay! Because we\'re here!'],
  });
  L('ages.lonely.them', {
    _: ['Sometimes. In the evenings, mostly. When the lane goes quiet.', 'Yes. Not often. But yes.'],
    cheerful: ['Me? Hardly ever! ...Sometimes in winter. When it\'s dark early.'],
    ornery: ['Only when folk leave me alone. Which is what I ask for. It\'s complicated.'],
    shy: ['...Yes. Quite often. I don\'t know how to stop it.'],
    curious: ['Sometimes. When I find something out and there\'s nobody to tell.'],
    dreamy: ['When the light goes and I\'ve nobody to say "look" to.'],
    witty: ['Only in a crowd. Odd, that.'],
    proud: ['Rarely. But it happens.'],
    gloomy: ['All the time. There. I said it.'],
    child: ['When nobody will play with me.', 'At bedtime. When it\'s dark.'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['Since {ageMissed} went. The chair\'s still there. That\'s when.'] },
    { if: { rift: true }, text: ['Here it\'s quiet. Too quiet. Back home there was always noise, always someone online.'] },
  ]);
  L('ages.lonely.invite', {
    _: ['Then that\'s settled. I\'ll put an extra cup out.', 'Good. I\'ll hold you to it.'],
    cheerful: ['Oh, wonderful! I\'ll bake!'],
    ornery: ['Hmph. Wipe your boots.'],
    shy: ['...I\'d like that too.'],
    curious: ['Then you can tell me all about the road.'],
    dreamy: ['A lamp in the window, then. For you.'],
    witty: ['I\'ll warn the larder.'],
    proud: ['I\'ll set the good china.'],
    gloomy: ['...That\'s cheered me.'],
    child: ['YAY! I\'m telling Mom!'],
  });
  L('ages.lonely.eat', {
    _: ['Ha! I\'ve seen you at a party. I\'ll stock up.', 'Then I\'ll bake two of everything.'],
    cheerful: ['Ha! So do I! We\'ll be perfect company!'],
    ornery: ['I\'ve noticed. Bring your own.'],
    shy: ['...Ha. That\'s all right.'],
    curious: ['How much does a wizard eat? Exactly?'],
    dreamy: ['A full table and a wizard at it. Lovely.'],
    witty: ['I\'ll hide the good cookies. You\'ll find them.'],
    proud: ['My larder can take it.'],
    gloomy: ['Ha. That\'s all right.'],
    child: ['I\'ll give you my pudding!'],
  });
  L('ages.lonely.company', {
    _: ['Company. Yes. Now and then. I\'d like that.', 'Then neither of us needs be lonely. Not entirely.'],
    cheerful: ['Oh, yes! Every day!'],
    ornery: ['Now and then. Not every day.'],
    shy: ['...Thank you.'],
    curious: ['We can compare lonelinesses. That sounds daft. You know what I mean.'],
    dreamy: ['Two lanterns. Yes.'],
    witty: ['Company. Low expectations on both sides. Perfect.'],
    proud: ['I\'d be glad of it.'],
    gloomy: ['...That would help.'],
    child: ['You can be my friend!'],
  });
  L('ages.lonely.mersday', {
    _: ['The sing-song. Hm. I always mean to go.', 'Sit by someone new. That\'s frightening. All right.'],
    cheerful: ['Oh, I love the sing-song! I\'ll sit by everyone!'],
    ornery: ['I can\'t sing. ...I\'ll go.'],
    shy: ['...Someone new. Oh. Maybe at the end of a bench.'],
    curious: ['I\'ll go and see who\'s there.'],
    dreamy: ['Singing together. That\'s a cure for lots of things.'],
    witty: ['I\'ll sit by someone who sings worse than me. Hard to find.'],
    proud: ['I\'m a fine singer, as it happens.'],
    gloomy: ['...I\'ll try.'],
    child: ['Can kids go?'],
  });

  // ==================================================================================
  // Are you afraid of anything?
  // ==================================================================================
  addThread({
    id: 'ages.ask.afraid', theirs: true, label: 'They ask what you\'re afraid of', cool: 12, ask: '{Name} has a question that\'s been bothering {them}.',
    when: known,
    beats: {
      start: { line: 'ages.afraid.q', go: [
        { ap: 'share', say: 'ages.afraid.a.share', label: 'Being too late. Always being too late.', to: 'late' },
        { ap: 'jest', say: 'ages.afraid.a.jest', label: 'Spiders. Large ones. And the Moot.', to: 'spiders' },
        { ap: 'tale', say: 'ages.afraid.a.tale', label: 'Once, in a dark place under a mountain…', to: 'dark', need: { open: 1 }, soft: true },
      ] },
      late: { line: 'ages.afraid.late', fx: { trust: 0.03 }, go: [
        { ap: 'ask', say: 'And you? What frightens you?', to: 'them' },
        { ap: 'share', say: 'So I come early when I can. Usually for supper.', to: 'supper' },
      ] },
      spiders: { line: 'ages.afraid.spiders', go: [
        { ap: 'share', say: 'All right. Truly? Being too late, when it matters.', to: 'late' },
        { ap: 'ask', say: 'And you? What frightens you?', to: 'them' },
      ] },
      dark: { line: 'ages.afraid.dark', fx: { trust: 0.03 }, go: [
        { ap: 'share', say: 'ages.afraid.a.light', label: 'I lit a light. It\'s what I always do.', to: 'light' },
        { ap: 'ask', say: 'Have you ever been that afraid?', to: 'them' },
      ] },
      them: { line: 'ages.afraid.them', fx: { trust: 0.02 }, go: [
        { ap: 'advise', say: 'Keep walking. And sing, if you can.', to: 'sing' },
        { ap: 'comfort', say: 'Being afraid and doing it anyway. That\'s all courage is.', to: 'courage' },
      ] },
      supper: { line: 'ages.afraid.supper', fx: { fond: 0.02 }, end: true },
      light: { line: 'ages.afraid.light', fx: { fond: 0.02, trust: 0.02, lean: 'hill' }, end: true },
      sing: { line: 'ages.afraid.sing', fx: { respect: 0.02 }, end: true },
      courage: { line: 'ages.afraid.courage', fx: { trust: 0.03, fond: 0.02, lean: 'hill' }, end: true },
    },
  });
  L('ages.afraid.q', {
    _: ['Are you ever afraid? Of anything? You never look it.', 'What frightens a wizard? I\'ve always wondered.'],
    cheerful: ['Is there anything you\'re scared of? I bet there isn\'t! Is there?'],
    ornery: ['You stride about like nothing scares you. Is that true, or is it the hat?'],
    shy: ['...Do wizards get scared? I get scared a lot.'],
    curious: ['I\'ve been wondering. What\'s the most frightening thing you\'ve ever seen?'],
    dreamy: ['Is there anything in the whole wide world that frightens you?'],
    witty: ['What scares a wizard? Apart from a hobbit with an empty plate?'],
    proud: ['A wizard must fear nothing. Or is that just a story?'],
    gloomy: ['Are you ever afraid? I wondered if it ever stops.'],
    child: ['Are you scared of ANYTHING? Not even the dark?', 'What\'s the scariest thing ever? Have you seen it?'],
  }, [
    { if: { stage: 'elder' }, text: ['Do you fear the road? Like we do, at the end? Or is it different for you?'] },
    { if: { rift: true }, text: ['What scares you? Back home it was blackouts. When the signal went and the city went quiet.'] },
  ]);
  lines('ages.afraid.a.share', [
    { text: ['Being too late. Arriving when it\'s all over, and someone needed me.'] },
    { if: { stage: 'child' }, text: ['Being late. When a friend needs me and I\'m still on the road. That\'s the scariest thing.'] },
  ]);
  lines('ages.afraid.a.jest', [
    { text: ['Spiders. Large ones. And the Moot, when it has opinions.'] },
    { if: { stage: 'child' }, text: ['Spiders! Big hairy ones! And your mom, when I\'ve kept you out late.'] },
  ]);
  lines('ages.afraid.a.tale', [
    { text: ['Once, under a mountain, in the dark, with something old and terrible on the bridge. I was very afraid.'] },
    { if: { stage: 'child' }, text: ['Once, in a very dark place under a mountain, there was a monster made of shadow. I was scared. Very.'] },
  ]);
  lines('ages.afraid.a.light', [
    { text: ['I lit a light. It\'s what I always do, when it\'s dark. Light something.'] },
    { if: { stage: 'child' }, text: ['I lit my staff, as bright as I could. When it\'s dark, you make a light. That\'s the trick.'] },
  ]);
  L('ages.afraid.late', {
    _: ['Too late. Oh. I hadn\'t thought of that. That\'s a sad sort of fear.', 'You worry you\'ll not come in time. That\'s why you always come, isn\'t it.'],
    cheerful: ['But you always turn up! You\'re never late! Well. You\'re late. But never too late.'],
    ornery: ['Then don\'t be. Simple. ...Not simple, I suppose.'],
    shy: ['...That\'s a kind fear. Worrying about others.'],
    curious: ['Have you ever been? Too late?'],
    dreamy: ['A wizard on the road, hurrying, hurrying. I\'ll think of that.'],
    witty: ['You\'re late for everything. You must be terrified all the time.'],
    proud: ['A fear worthy of a wizard.'],
    gloomy: ['...We all are, a bit. Too late for things.'],
    child: ['You\'re not late for US! You came!'],
  });
  L('ages.afraid.spiders', {
    _: ['Ha! The Moot! Everyone\'s afraid of the Moot.', 'Spiders! Truly? A wizard?'],
    cheerful: ['Ahaha! The Moot! You\'re right to be!'],
    ornery: ['The Moot. Now you\'re talking sense.'],
    shy: ['...I\'m scared of spiders too.'],
    curious: ['How large? Like a cat? Like a cart?'],
    dreamy: ['Spiders the size of houses, in a dark forest. Ooh.'],
    witty: ['The Moot is worse. Spiders at least know what they want.'],
    proud: ['The Moot is a very fine institution. ...Mostly.'],
    gloomy: ['Ha. Spiders. At least yours have legs you can see.'],
    child: ['SPIDERS? Big ones? How big?', 'Ew! I\'m scared of spiders too!'],
  });
  L('ages.afraid.dark', {
    _: ['Under a mountain. With something terrible. ...What did you do?', 'You were afraid. Even you. What did you do?'],
    cheerful: ['Oh! And you got out! You did get out! Didn\'t you?'],
    ornery: ['And you\'re still here. So you must have done something.'],
    shy: ['...I\'d have hidden. What did you do?'],
    curious: ['What was it? What did you do? How did it end?'],
    dreamy: ['Something old in the dark. Like the stories. What happened?'],
    witty: ['And you told it a joke and it laughed itself to death?'],
    proud: ['And you faced it. Of course you did.'],
    gloomy: ['...And you came out. How?'],
    child: ['A MONSTER? What did you DO?', 'Were you SO scared? What happened?'],
  });
  L('ages.afraid.them', {
    _: ['The dark, a bit. And losing people. And deep water.', 'Being alone when I\'m old. That\'s the big one.'],
    cheerful: ['Thunder! I know it\'s silly. I hide under the table.'],
    ornery: ['Nothing. ...Being useless. That frightens me.'],
    shy: ['...Talking in front of people. And thunder.'],
    curious: ['Not knowing. Something happening and not knowing why.'],
    dreamy: ['That one day I\'ll stop noticing things. That frightens me.'],
    witty: ['Running out of things to say. It hasn\'t happened yet.'],
    proud: ['Failing. In front of everyone.'],
    gloomy: ['Most things. Honestly. Most things.'],
    child: ['The dark! And the big dog at the mill!', 'Monsters under the bed. Are there monsters under the bed?'],
  }, [
    { if: { stage: 'elder' }, text: ['The road, at the end. A little. Not the walking. The goodbyes.'] },
    { if: { kid: has }, text: ['Something happening to {kid}. Nothing else comes close.'] },
    { if: { rift: true }, text: ['That the rift closes and I never get to go back. Or that it opens and I have to choose.'] },
  ]);
  L('ages.afraid.supper', {
    _: ['Ha! Early for supper! That\'s the cure for everything.', 'Usually for supper. Ha. Very wise.'],
    cheerful: ['Ha! Come early to ours! We eat at five!'],
    ornery: ['Early for supper and late for everything else.'],
    shy: ['...Ha. That\'s nice.'],
    curious: ['Does it work? Being early for supper?'],
    dreamy: ['A wizard early for supper. That\'s a happy thought.'],
    witty: ['Early for supper. Your priorities are sound.'],
    proud: ['Punctual for meals. That\'s proper.'],
    gloomy: ['Ha. That helps.'],
    child: ['Come early to ours! Mom makes pie!'],
  });
  L('ages.afraid.light', {
    _: ['Light something. I\'ll remember that. Next time it\'s dark.', 'When it\'s dark, make a light. That\'s good. That\'s really good.'],
    cheerful: ['I\'ll keep a candle by my bed! Always!'],
    ornery: ['Light something. Hm. Practical. I like practical.'],
    shy: ['...I\'ll try that. Thank you.'],
    curious: ['Any light? Even a small one? Does size matter?'],
    dreamy: ['A light in the dark. That\'s what you are, aren\'t you.'],
    witty: ['Light something. Not the hay-rick, I hope.'],
    proud: ['A wise answer.'],
    gloomy: ['...A light. Yes. I\'ll try.'],
    child: ['I\'m going to make a light EVERY time!', 'I have a candle! I\'ll light it!'],
  });
  L('ages.afraid.sing', {
    _: ['Keep walking and sing. Ha. I can do that.', 'Sing, if you can. I\'ll try. Badly.'],
    cheerful: ['Sing! I\'m always singing! No wonder I\'m never scared!'],
    ornery: ['I don\'t sing. ...I might hum.'],
    shy: ['...Very quietly.'],
    curious: ['Why does singing help? Does it?'],
    dreamy: ['A song in the dark. Like the old walking songs.'],
    witty: ['If I sing, the monsters will run.'],
    proud: ['I\'ll sing loudly.'],
    gloomy: ['...All right. A sad song.'],
    child: ['I know a song! I\'ll sing it!'],
  });
  L('ages.afraid.courage', {
    _: ['Afraid and doing it anyway. ...Then maybe I\'m braver than I thought.', 'That\'s all courage is? Oh. Then I\'ve got some.'],
    cheerful: ['Oh! Then I\'m brave! Hooray!'],
    ornery: ['Hmph. I\'ve been doing that for years.'],
    shy: ['...Then maybe I\'m brave. A little.'],
    curious: ['So you can\'t be brave without being afraid first. Interesting.'],
    dreamy: ['Then every hobbit who ever got up on a cold morning is a hero.'],
    witty: ['Then I\'m the bravest hobbit in the valley. I\'m afraid of everything.'],
    proud: ['Exactly so.'],
    gloomy: ['...Thank you. That helps.'],
    child: ['Then I\'m BRAVE!', 'I\'m going to be scared and do it anyway!'],
  });

  // ==================================================================================
  // How old are you, really?
  // ==================================================================================
  addThread({
    id: 'ages.ask.old', theirs: true, label: 'They ask how old you really are', cool: 10, ask: '{Name} squints at your beard.',
    when: known,
    beats: {
      start: { line: 'ages.old.q', go: [
        { ap: 'jest', say: 'ages.old.a.jest', label: 'Older than your teapot, younger than the hills.', to: 'teapot' },
        { ap: 'share', say: 'ages.old.a.share', label: 'Old enough to have forgotten.', to: 'forgot' },
        { ap: 'tale', say: 'ages.old.a.tale', label: 'I remember when the stars were new.', to: 'stars' },
      ] },
      teapot: { line: 'ages.old.teapot', go: [
        { ap: 'share', say: 'ages.old.a.share', label: 'Truly? Old enough to have forgotten.', to: 'forgot' },
        { ap: 'jest', say: 'The teapot\'s very well preserved.', to: 'preserved' },
      ] },
      forgot: { line: 'ages.old.forgot', go: [
        { ap: 'share', say: 'Some days. Mostly I\'m glad of it. Every year has someone new in it.', to: 'tired' },
        { ap: 'jest', say: 'I only feel it on stairs.', to: 'stairs' },
      ] },
      stars: { line: 'ages.old.stars', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'Does it tire you, all those years?', to: 'tired' },
        { ap: 'jest', say: 'They were dimmer then. Needed polishing.', to: 'polish' },
      ] },
      tired: { line: 'ages.old.tired', fx: { trust: 0.03, fond: 0.02 }, end: true },
      preserved: { line: 'ages.old.preserved', fx: { joke: { k: 'ages.teapot', t: 'The wizard: older than the teapot, younger than the hills.' } }, end: true },
      stairs: { line: 'ages.old.stairs', fx: { fond: 0.02 }, end: true },
      polish: { line: 'ages.old.polish', fx: { fond: 0.02 }, end: true },
    },
  });
  L('ages.old.q', {
    _: ['How old are you, really? Folk say all sorts.', 'Can I ask? How old are you? Truly?'],
    cheerful: ['How old ARE you? I bet you\'re a thousand! Are you a thousand?'],
    ornery: ['How old are you? And don\'t say "old enough".'],
    shy: ['...Is it rude to ask how old you are? You don\'t have to say.'],
    curious: ['How old are you? I\'ve worked it out three ways and got three answers.'],
    dreamy: ['How old are you, wizard? You seem older than the hills and younger than the morning.'],
    witty: ['How old are you? Your beard\'s older than my house.'],
    proud: ['What age are you? I like to know who I\'m talking to.'],
    gloomy: ['How old are you? Does it ever end, for you?'],
    child: ['How old are you? Are you a HUNDRED?', 'Are you older than my granddad? Older than the hills?'],
  }, [
    { if: { stage: 'elder' }, text: ['I\'m {ageYearsWord} and I feel every one. How many have you got? Truly?'] },
    { if: { stage: 'grown', ageYears: { min: 33, max: 45 } }, text: ['I\'ve been grown {ageGrownWord} years and I feel ancient. How old are you, then?'] },
  ]);
  lines('ages.old.a.jest', [
    { text: ['Older than your grandmother\'s teapot. Younger than the hills. Somewhere between.'] },
    { if: { stage: 'child' }, text: ['Older than your granny\'s teapot! But younger than the hills. Just.'] },
  ]);
  lines('ages.old.a.share', [
    { text: ['Old enough to have forgotten. Young enough to mind that I have.'] },
    { if: { stage: 'child' }, text: ['So old I forgot to count. Isn\'t that silly? Don\'t forget to count yours.'] },
  ]);
  lines('ages.old.a.tale', [
    { text: ['I remember when the stars were new, and the sun was young, and there wasn\'t a single hobbit-hole in the world.'] },
    { if: { stage: 'child' }, text: ['I remember when the stars were brand new and still had the shine on. That old.'] },
  ]);
  L('ages.old.teapot', {
    _: ['Ha! Older than the teapot! That\'s very old. It\'s a very old teapot.', 'Ha! The teapot\'s chipped. Are you chipped?'],
    cheerful: ['Ahaha! The teapot! I\'m telling my granny!'],
    ornery: ['That\'s not a number.'],
    shy: ['...Ha. That\'s a good answer.'],
    curious: ['The teapot\'s a hundred and nine. So, more than that. Fine. That\'s a start.'],
    dreamy: ['Between the teapot and the hills. That\'s a lovely place to be.'],
    witty: ['Younger than the hills. Very vain of you.'],
    proud: ['Ha. A diplomatic answer.'],
    gloomy: ['Ha. ...But really?'],
    child: ['Older than the TEAPOT?! Wow!'],
  });
  L('ages.old.forgot', {
    _: ['Forgotten! How can you forget how old you are? ...Does it tire you?', 'Old enough to forget. Do you mind it? Being old?'],
    cheerful: ['Ha! I forget my age all the time! But do you get tired of it?'],
    ornery: ['Convenient. Do you mind it, then? Being that old?'],
    shy: ['...Is it lonely, being that old?'],
    curious: ['What\'s it like, remembering that much? Doesn\'t it get heavy?'],
    dreamy: ['So many years. Do they all blur, like rain on a window?'],
    witty: ['I\'d forget too. Saves on birthday presents.'],
    proud: ['A wizard\'s prerogative. Do you mind it?'],
    gloomy: ['Does it tire you? It tires me, and I\'m not that old.'],
    child: ['You FORGOT? I\'m seven and three-quarters!', 'How can you forget? I never forget!'],
  });
  L('ages.old.stars', {
    _: ['When the stars were new! You\'re teasing. You are teasing?', 'Before hobbit-holes? Was there anything at all?'],
    cheerful: ['Oh, what were they like? New stars! Were they shiny?'],
    ornery: ['Now you\'re showing off.'],
    shy: ['...Truly? That\'s... very old.'],
    curious: ['What did they look like? Were there more? Fewer? Did they move?'],
    dreamy: ['New stars. Oh. I wish I\'d seen that.'],
    witty: ['And you\'ve been complaining about your knees ever since.'],
    proud: ['Then you\'ve seen the whole of it. Remarkable.'],
    gloomy: ['And now you\'ll see the end of us too.'],
    child: ['WOW. Were the stars sparkly? Were they BIG?'],
  });
  L('ages.old.tired', {
    _: ['Someone new every year. That\'s a nice way of looking at it.', 'I\'d never thought. We\'re your new ones.'],
    cheerful: ['Then I\'m one of your new ones! Hooray!'],
    ornery: ['Hmph. Lucky for some.'],
    shy: ['...I hope I\'m one of the good ones.'],
    curious: ['And who were your first ones? Long ago?'],
    dreamy: ['A long road with a friend at every bend. That\'s not so bad.'],
    witty: ['We\'re this year\'s vintage. Fine, with notes of turnip.'],
    proud: ['Then we\'re honored to be in your years.'],
    gloomy: ['...Then maybe old isn\'t all bad.'],
    child: ['Am I someone new? Am I?'],
  }, [
    { if: { stage: 'elder' }, pri: 1, text: ['And when we go, you\'ll remember us. That\'s what the years are for. I see it now.'] },
  ]);
  L('ages.old.preserved', {
    _: ['Ha! Like you. Pickled, I\'d say.', 'Ha! I\'ll tell the teapot. It\'ll be thrilled.'],
    cheerful: ['Ha! Like jam! You\'re preserved like jam!'],
    ornery: ['Unlike its owner.'],
    shy: ['...Ha.'],
    curious: ['What\'s your secret? Pipe smoke?'],
    dreamy: ['Preserved by stories, I\'d say.'],
    witty: ['Well preserved. Like a wizard in pipe-weed.'],
    proud: ['Our teapots are made to last.'],
    gloomy: ['Ha. Better than me.'],
    child: ['Hee! Teapots!'],
  });
  L('ages.old.stairs', {
    _: ['Ha! Stairs! We\'re the same, then.', 'Only on stairs! Hobbits have no stairs. You\'ll live for ever here.'],
    cheerful: ['Ha! Live in a hole, then! No stairs!'],
    ornery: ['I feel it on stairs and in my back and in the rain.'],
    shy: ['...Ha.'],
    curious: ['Is that why hobbits dig holes? To avoid stairs?'],
    dreamy: ['Stairs up to a tower. That\'s where wizards live, isn\'t it?'],
    witty: ['Stairs are the true enemy of wizards. Not dragons.'],
    proud: ['A sound reason to live in a hole.'],
    gloomy: ['Ha. Stairs. Yes.'],
    child: ['I jump down stairs! Two at a time!'],
  });
  L('ages.old.polish', {
    _: ['Ha! Polishing stars! Was that your job?', 'Polishing! You\'re making it up.'],
    cheerful: ['Ha! I\'d love that job!'],
    ornery: ['They could do with another polish now.'],
    shy: ['...Ha. That\'s lovely.'],
    curious: ['With what? A very long cloth?'],
    dreamy: ['Somebody polishing the stars. I like that very much.'],
    witty: ['And you\'ve let the job slip, I see.'],
    proud: ['A worthy occupation.'],
    gloomy: ['Ha. They look dull now. Somebody stopped.'],
    child: ['Can I polish a star?!'],
  });

  // ==================================================================================
  // Were you ever young?
  // ==================================================================================
  addThread({
    id: 'ages.ask.young', theirs: true, label: 'They ask if you were ever young', cool: 12, ask: '{Name} is trying to picture you small.',
    when: (F) => known(F) && (F.stage === 'child' || F.ageBand === 'young' || F.temper === 'curious' || F.temper === 'witty'),
    beats: {
      start: { line: 'ages.young.q', go: [
        { ap: 'tale', say: 'ages.young.a.tale', label: 'I was a terrible apprentice. I set fire to a library.', to: 'library' },
        { ap: 'jest', say: 'ages.young.a.jest', label: 'No. I was born with this beard.', to: 'beard' },
        { ap: 'share', say: 'ages.young.a.share', label: 'I was. And lonely. Then I found fireworks.', to: 'lonely' },
      ] },
      library: { line: 'ages.young.library', go: [
        { ap: 'jest', say: 'Only a small one. Only the poetry section.', to: 'poetry' },
        { ap: 'share', say: 'My master said: if you\'re going to make a mess, make a bright one.', to: 'bright' },
      ] },
      beard: { line: 'ages.young.beard', go: [
        { ap: 'share', say: 'ages.young.a.share', label: 'All right. I was young. And lonely. Then I found fireworks.', to: 'lonely' },
        { ap: 'tale', say: 'ages.young.a.tale', label: 'All right. I set fire to a library.', to: 'library' },
      ] },
      lonely: { line: 'ages.young.lonely', fx: { trust: 0.03 }, go: [
        { ap: 'warm', say: 'A light in the sky says "here I am". I wanted to be found.', to: 'found' },
        { ap: 'jest', say: 'And eyebrows grow back. That was the other lesson.', to: 'eyebrows' },
      ] },
      poetry: { line: 'ages.young.poetry', fx: { joke: { k: 'ages.library', t: 'The wizard set fire to the poetry section, as a boy.' } }, end: true },
      bright: { line: 'ages.young.bright', fx: { fond: 0.02 }, end: true },
      found: { line: 'ages.young.found', fx: { trust: 0.03, fond: 0.03 }, end: true },
      eyebrows: { line: 'ages.young.eyebrows', fx: { fond: 0.02 }, end: true },
    },
  });
  L('ages.young.q', {
    _: ['Were you ever young? I can\'t picture it. I\'ve tried.', 'What were you like, when you were young? Were you ever?'],
    cheerful: ['Were you ever little? Were you a little wizard with a little hat?'],
    ornery: ['You can\'t always have been old. What were you like? Trouble, I\'ll bet.'],
    shy: ['...Were you ever young? Like me?'],
    curious: ['I\'ve been trying to work out what you were like as a youngster. Give me a clue.'],
    dreamy: ['Were you ever young? I imagine you with dark hair, running through long grass.'],
    witty: ['Were you ever young, or did you come out of the egg with a staff?'],
    proud: ['A wizard must have been a remarkable youngster. Were you?'],
    gloomy: ['Were you ever young? Did you know you were? I didn\'t.'],
    child: ['Were you ever a kid? Did you have a mom? Did you get told off?', 'Were you ever small like me? With no beard?'],
    'k:curious': ['Were you ever my age? What did you want to be? Did you always know?'],
  });
  lines('ages.young.a.tale', [
    { text: ['I was a terrible apprentice. I set fire to a library. A small one. Mostly.'] },
    { if: { stage: 'child' }, text: ['I was very naughty! I set fire to a whole room of books. By accident. Mostly.'] },
  ]);
  lines('ages.young.a.jest', [
    { text: ['No. I was born with this beard. My poor mother.'] },
    { if: { stage: 'child' }, text: ['No! I was born with this beard and this hat. My mom was VERY surprised.'] },
  ]);
  lines('ages.young.a.share', [
    { text: ['I was. And lonely, and too clever by half. Then I found fireworks, and folk came to look.'] },
    { if: { stage: 'child' }, text: ['I was. And I didn\'t have many friends. Then I made a firework, and everyone came to see. That\'s how I made friends.'] },
  ]);
  L('ages.young.library', {
    _: ['A LIBRARY? You never!', 'A library! What did they do to you?'],
    cheerful: ['Ahaha! A library! Was it on purpose? It was, wasn\'t it!'],
    ornery: ['That\'s criminal. ...How?'],
    shy: ['...Did you get in trouble? Lots of trouble?'],
    curious: ['How? With what? Which books? Were they important?'],
    dreamy: ['All those words going up in sparks. Like a firework of stories.'],
    witty: ['Mostly? What survived? The cookbooks?'],
    proud: ['A library! That\'s shocking. ...Impressive.'],
    gloomy: ['And they still let you be a wizard? There\'s hope for me.'],
    child: ['A WHOLE library? Did you get SMACKED?', 'Hee! You were naughty!'],
  });
  L('ages.young.beard', {
    _: ['Ha! Your poor mother indeed! No, really.', 'Ha! I knew it! ...No. Really?'],
    cheerful: ['Ahaha! A baby with a beard! I can see it!'],
    ornery: ['Don\'t be daft. Tell the truth.'],
    shy: ['...Ha. No, really?'],
    curious: ['That\'s not biologically likely. The real answer, please.'],
    dreamy: ['A baby with a long gray beard. Ha. That\'s a picture.'],
    witty: ['And the hat? Did you come with the hat?'],
    proud: ['Ha. A wizard\'s answer. But truly?'],
    gloomy: ['Ha. ...But really?'],
    child: ['Ahaha! NO! Really really?', 'A beard BABY! Hee!'],
  });
  L('ages.young.lonely', {
    _: ['You were lonely too? ...Then the fireworks were for being found.', 'Fireworks to make friends. Oh, that\'s lovely. And sad.'],
    cheerful: ['Oh! So that\'s why you do them! To make friends! It worked!'],
    ornery: ['Hmph. Fireworks. Easier than talking, I suppose.'],
    shy: ['...I\'m like that. Maybe I need a firework.'],
    curious: ['So you started doing fireworks so folk would come? Why fireworks?'],
    dreamy: ['A lonely young wizard, lighting up the sky so someone would look up. Oh.'],
    witty: ['And now you can\'t get rid of us.'],
    proud: ['And now you\'re the most famous wizard in the Shire.'],
    gloomy: ['...So it gets better. Even if you\'re lonely young.'],
    child: ['You didn\'t have friends? I\'ll be your friend!', 'Can I make a firework? To make friends?'],
  });
  L('ages.young.poetry', {
    _: ['Only the poetry! Ha! Some would call that a favor.', 'Ha! The poetry! Did anyone miss it?'],
    cheerful: ['Ahaha! Oh, that\'s wonderful!'],
    ornery: ['The poetry. Hmph. No great loss.'],
    shy: ['...I like poetry. Ha. But that\'s funny.'],
    curious: ['Which poems? Were they good ones?'],
    dreamy: ['Poems on fire. Words flying up into the dark. I like that, a bit.'],
    witty: ['The poetry section. A public service.'],
    proud: ['A crime against culture. ...Ha.'],
    gloomy: ['Ha. Probably sad poems anyway.'],
    child: ['Hee! Poems are boring anyway!'],
  });
  L('ages.young.bright', {
    _: ['Make a bright mess. Ha! I\'ll remember that.', 'If you\'re going to make a mess, make a bright one. Oh, I like that.'],
    cheerful: ['Bright messes! That\'s my whole life!'],
    ornery: ['That\'s not good advice. ...It\'s a bit good.'],
    shy: ['...I\'m always scared of messes. Maybe a bright one\'s all right.'],
    curious: ['A bright mess. So a mistake you learn from?'],
    dreamy: ['A bright mess. Like a sunset. All over the place, and lovely.'],
    witty: ['I make bright messes daily. Nobody\'s impressed.'],
    proud: ['A wise master.'],
    gloomy: ['...Mine are mostly dull messes.'],
    child: ['I make LOTS of messes! Are they bright?'],
  });
  L('ages.young.found', {
    _: ['Here I am. Yes. I see it now, every time you set one off.', 'You wanted to be found. ...And we found you.'],
    cheerful: ['We found you! Every time! We always run to look!'],
    ornery: ['Hmph. Well. Here you are.'],
    shy: ['...I\'ll look up, every time. I\'ll know what it means.'],
    curious: ['So every firework is a sort of message? I\'ll read them differently.'],
    dreamy: ['"Here I am." Oh. I\'ll never see a rocket the same way.'],
    witty: ['Found. And fed. And kept.'],
    proud: ['A fine way to be found.'],
    gloomy: ['...I wish I could make a light like that.'],
    child: ['Here I am! HERE I AM! Like that?'],
  });
  L('ages.young.eyebrows', {
    _: ['Ha! They grow back! Good to know.', 'Your eyebrows! Ha! So that\'s why they\'re so bushy.'],
    cheerful: ['Ahaha! The eyebrows!'],
    ornery: ['Ha. Hmph. Ha.'],
    shy: ['...Ha.'],
    curious: ['How long do eyebrows take to grow back? Asking for a reason.'],
    dreamy: ['Eyebrows grow back. That\'s quite hopeful, really.'],
    witty: ['They\'ve over-grown, I\'d say.'],
    proud: ['A small price.'],
    gloomy: ['Ha. At least something grows back.'],
    child: ['Hee! No eyebrows!'],
  });

  // ==================================================================================
  // What's the secret of a happy life?
  // ==================================================================================
  addThread({
    id: 'ages.ask.happy', theirs: true, label: 'They ask the secret of a happy life', cool: 12, ask: '{Name} has a big question.',
    when: (F) => known(F) && F.stage !== 'child',
    beats: {
      start: { line: 'ages.happy.q', go: [
        { ap: 'jest', say: 'ages.happy.a.jest', label: 'Second breakfast.', to: 'breakfast' },
        { ap: 'share', say: 'ages.happy.a.share', label: 'Good friends and a warm hearth.', to: 'hearth' },
        { ap: 'advise', say: 'ages.happy.a.advise', label: 'Notice when you\'re happy.', to: 'notice' },
      ] },
      breakfast: { line: 'ages.happy.breakfast', go: [
        { ap: 'share', say: 'All right. Good friends and a warm hearth. The rest is decoration.', to: 'hearth' },
        { ap: 'advise', say: 'And noticing it, when you\'re happy. Most folk don\'t.', to: 'notice' },
      ] },
      hearth: { line: 'ages.happy.hearth', go: [
        { ap: 'ask', say: 'And are you? Happy?', to: 'are' },
        { ap: 'advise', say: 'And noticing it. That\'s the trick.', to: 'notice' },
      ] },
      notice: { line: 'ages.happy.notice', go: [
        { ap: 'ask', say: 'When were you last happy, and noticed?', to: 'when' },
        { ap: 'ask', say: 'And are you? Happy?', to: 'are' },
      ] },
      are: { line: 'ages.happy.are', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'Then I\'m glad. Truly.', to: 'glad' },
        { ap: 'comfort', say: 'There\'s time to be. There\'s always time.', to: 'time' },
      ] },
      when: { line: 'ages.happy.when', fx: { trust: 0.02, drive: { bored: -0.05 } }, end: true },
      glad: { line: 'ages.happy.glad', fx: { fond: 0.02 }, end: true },
      time: { line: 'ages.happy.time', fx: { trust: 0.02 }, end: true },
    },
  });
  L('ages.happy.q', {
    _: ['You\'ve seen a lot. What\'s the secret? To a happy life? Is there one?', 'What makes a life a happy one, do you think? You\'d know.'],
    cheerful: ['What\'s the secret of being happy? I think I know! But tell me yours!'],
    ornery: ['Go on, then, wise one. What\'s the secret of a happy life? There isn\'t one, is there.'],
    shy: ['...Can I ask something big? How do you be happy? Properly?'],
    curious: ['I\'ve been collecting answers. What\'s the secret of a happy life? Everyone says something different.'],
    dreamy: ['If you could put a happy life in a bottle, what would be in it?'],
    witty: ['What\'s the secret of a happy life? And don\'t say "fireworks".'],
    proud: ['What would you say makes a life well lived?'],
    gloomy: ['How do people do it? Be happy? I\'ve never worked it out.'],
  }, [
    { if: { stage: 'elder' }, text: ['I\'ve had a long life and I\'m still not sure I know. What\'s the secret, wizard?'] },
    { if: { ageBand: 'young' }, text: ['I\'m just starting out. What should I aim at? For a happy life?'] },
  ]);
  lines('ages.happy.a.jest', [{ text: ['Second breakfast. Every day. Without fail.'] }, { if: { temper: 'gloomy' }, text: ['Second breakfast. I\'m only half joking.'] }]);
  lines('ages.happy.a.share', [{ text: ['Good friends and a warm hearth. The rest is decoration.'] }, { if: { stage: 'elder' }, text: ['Good friends, a warm hearth, and folk to miss you when you go. You\'ve all three, I think.'] }]);
  lines('ages.happy.a.advise', [{ text: ['Notice when you\'re happy. Most folk only notice the other thing.'] }, { if: { ageBand: 'young' }, text: ['Notice when you\'re happy. Say "this, this is it". Most folk only notice later.'] }]);
  L('ages.happy.breakfast', {
    _: ['Ha! I knew you\'d say that. No, truly.', 'Second breakfast! Well, it\'s a start. And truly?'],
    cheerful: ['Ha! I knew it! I\'m already doing it! But what else?'],
    ornery: ['That\'s not a secret, that\'s a meal.'],
    shy: ['...Ha. And truly?'],
    curious: ['Is that the whole of it? There must be more.'],
    dreamy: ['Second breakfast, in the sun, with someone you love. Maybe that\'s it.'],
    witty: ['Then I\'ve been happy for years without knowing.'],
    proud: ['A good foundation. And beyond that?'],
    gloomy: ['Ha. If only it were that easy.'],
  });
  L('ages.happy.hearth', {
    _: ['Good friends and a warm hearth. ...That\'s it? That\'s all?', 'The rest is decoration. Ha. All the things I worry about.'],
    cheerful: ['I\'ve got both! So I\'m doing it right!'],
    ornery: ['Hmph. Plain. True, I suppose. Plain and true.'],
    shy: ['...I have a warm hearth. I\'m working on the friends.'],
    curious: ['How many friends, would you say? Is there a right number?'],
    dreamy: ['A hearth and faces round it. Yes. That\'s it.'],
    witty: ['And decoration\'s still nice. I\'m keeping my curtains.'],
    proud: ['I have both, in good measure.'],
    gloomy: ['...I have a hearth. That\'s half.'],
  }, [
    { if: { spouse: has }, text: ['{Spouse} and the fire. That\'s my happy. You\'re right.'] },
  ]);
  L('ages.happy.notice', {
    _: ['Notice it. Hm. I suppose I only notice when it\'s gone.', 'Most folk only notice the other thing. That\'s true. That\'s very true.'],
    cheerful: ['Oh, I notice! I\'m always going "isn\'t this lovely"! Folk find it annoying!'],
    ornery: ['I notice when things go wrong. That\'s my gift.'],
    shy: ['...I don\'t know if I\'d know. I\'ll try.'],
    curious: ['How do you notice? Is there a feeling? I\'ll start watching for it.'],
    dreamy: ['Like catching a butterfly. You have to be quick, and gentle.'],
    witty: ['I\'ll keep a tally. Happy, Mersday, half past four.'],
    proud: ['I do notice. I\'m grateful for what I\'ve built.'],
    gloomy: ['I never notice. I only notice after.'],
  });
  L('ages.happy.are', {
    _: ['Happy? Mostly. More than I thought I\'d be.', 'I think so. I\'d have to think about it. ...Yes.'],
    cheerful: ['Yes! Very! Isn\'t everyone?'],
    ornery: ['Happy enough. Don\'t tell anyone.'],
    shy: ['...Some days. More days than before.'],
    curious: ['I\'m not sure how to measure it. But I think I\'m doing well.'],
    dreamy: ['Sometimes so happy it hurts. Sometimes not at all.'],
    witty: ['Happier than I let on. I have a reputation.'],
    proud: ['I\'ve every reason to be.'],
    gloomy: ['...No. Not really. Not lately.'],
  }, [
    { if: { mood: 'merry' }, pri: 1, text: ['Right now? Yes. Very. I think I\'ll notice it, like you said.'] },
    { if: { mood: 'miserable' }, pri: 1, text: ['Not today. Not for a while. I\'d like to be.'] },
  ]);
  L('ages.happy.when', {
    _: ['This morning. The bread came out right and the sun was on the step. I noticed. I did.', 'Last Highday. Lying in the orchard. I remember thinking, this is it.'],
    cheerful: ['Every morning! But especially yesterday, at the market!'],
    ornery: ['When my neighbor\'s hens got out and it wasn\'t my fault.'],
    shy: ['...Just now, actually. Talking to you.'],
    curious: ['When I worked out how the mill-wheel gears go. Pure joy.'],
    dreamy: ['Last evening, watching swallows. I noticed. I really did.'],
    witty: ['When the Moot adjourned early.'],
    proud: ['When I finished a fine piece of work.'],
    gloomy: ['...I can\'t remember. That\'s the trouble.'],
  }, [
    { if: { ageMemory: has, ageMemoryGood: true }, pri: 1, text: ['"{AgeMemory}." That day. I didn\'t notice at the time. I do now.'] },
    { if: { pastime: ['carving', 'basketry', 'pottery', 'knitting', 'painting'] }, text: ['When I finished my last {madeOne}. I sat and looked at it a long time.'] },
  ]);
  L('ages.happy.glad', {
    _: ['So am I. Thank you for asking.', 'Thank you. That means something, from you.'],
    cheerful: ['Oh, you\'re lovely!'],
    ornery: ['Hmph. Thank you.'],
    shy: ['...Thank you.'],
    curious: ['And are you happy, wizard?'],
    dreamy: ['Glad. Yes. That\'s a good word.'],
    witty: ['Don\'t get soppy. ...Thank you.'],
    proud: ['Thank you.'],
    gloomy: ['...It helps, hearing that.'],
  });
  L('ages.happy.time', {
    _: ['There\'s always time. I\'ll hold on to that.', 'You think so? ...I\'ll try to believe it.'],
    cheerful: ['Then I\'ll be happier tomorrow!'],
    ornery: ['Hmph. We\'ll see.'],
    shy: ['...Thank you.'],
    curious: ['How do you know? Have you seen it happen?'],
    dreamy: ['Time. Like spring after winter.'],
    witty: ['Time I have. It\'s the happy I\'m short of.'],
    proud: ['I\'ll make the time.'],
    gloomy: ['...Maybe. Maybe there is.'],
  });

  // ==================================================================================
  // Will anyone remember us, after?
  // ==================================================================================
  addThread({
    id: 'ages.ask.remember', theirs: true, label: 'They ask if anyone will remember them', cool: 14, ask: '{Name} has something on {their} mind.',
    when: (F) => known(F) && (F.stage === 'elder' || F.ageDeparted >= 2 || F.temper === 'gloomy' || F.temper === 'dreamy') && F.stage !== 'child',
    beats: {
      start: { line: 'ages.remember.q', go: [
        { ap: 'warm', say: 'ages.remember.a.warm', label: 'I will. Wizards have long memories.', to: 'wizard' },
        { ap: 'tale', say: 'ages.remember.a.tale', label: 'Your names are in the tales I tell.', to: 'tales' },
        { ap: 'comfort', say: 'ages.remember.a.comfort', label: 'You\'re in every hedge you planted.', to: 'hedge' },
      ] },
      wizard: { line: 'ages.remember.wizard', go: [
        { ap: 'warm', say: 'I promise. Every one of you.', to: 'promise' },
        { ap: 'jest', say: 'Especially the ones who fed me.', to: 'fed' },
      ] },
      tales: { line: 'ages.remember.tales', go: [
        { ap: 'warm', say: 'I promise. Under the great tree, and further off.', to: 'promise' },
        { ap: 'jest', say: 'With improvements. You\'ll be taller.', to: 'taller' },
      ] },
      hedge: { line: 'ages.remember.hedge', go: [
        { ap: 'ask', say: 'What would you want them to remember?', to: 'what' },
        { ap: 'warm', say: 'And in every hobbit you were kind to. That\'s a long memory.', to: 'kind' },
      ] },
      what: { line: 'ages.remember.what', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'Then that\'s what I\'ll tell them.', to: 'promise' },
      ] },
      promise: { line: 'ages.remember.promise', fx: { trust: 0.05, fond: 0.03, confide: { k: 'ages.rememberme', t: 'you promised {Name} you\'d remember them' } }, end: true },
      fed: { line: 'ages.remember.fed', fx: { fond: 0.03 }, end: true },
      taller: { line: 'ages.remember.taller', fx: { fond: 0.03 }, end: true },
      kind: { line: 'ages.remember.kind', fx: { trust: 0.03 }, end: true },
    },
  });
  L('ages.remember.q', {
    _: ['Do you think anyone will remember us? After? Ordinary folk like me?', 'When I\'ve gone over the hills, will anyone remember? Truly?'],
    cheerful: ['Will they remember me, do you think? After? I\'d like to be remembered laughing.'],
    ornery: ['Nobody remembers anybody. Do they? Tell me I\'m wrong.'],
    shy: ['...Will anyone remember me? When I\'m gone? I don\'t think I\'m very memorable.'],
    curious: ['How long does a hobbit get remembered for, after? Is there a usual length?'],
    dreamy: ['Do you think we leave something behind? A sort of glow, in the places we loved?'],
    witty: ['Will anyone remember me? Apart from the Badger, who I owe money.'],
    proud: ['A life ought to be remembered. Will mine be, do you think?'],
    gloomy: ['Nobody will remember me. Will they. Be honest.'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['I still remember {ageMissed}. But when I\'m gone, who\'ll remember {ageMissed}? Or me?'] },
    { if: { stage: 'elder' }, text: ['I\'m {ageYearsWord}. The ones who remember me are going too. Who\'ll be left to remember?'] },
  ]);
  lines('ages.remember.a.warm', [{ text: ['I will. Wizards have very long memories. Very long, and very full.'] }, { if: { stage: 'elder' }, text: ['I will. Long after the stones are mossy. I\'ll remember every one of you.'] }]);
  lines('ages.remember.a.tale', [{ text: ['Your names are in the tales I tell. Under the great tree, and far away in other valleys.'] }]);
  lines('ages.remember.a.comfort', [{ text: ['You\'re in every hedge you planted, every loaf, every lane you walked. The valley remembers.'] }, { if: { job: has }, text: ['You\'re in every bit of {ageTrade} you ever did. The valley\'s full of you.'] }]);
  L('ages.remember.wizard', {
    _: ['You will? All of us? ...Even me?', 'Then I\'ll be remembered by a wizard. That\'s not nothing.'],
    cheerful: ['Oh! Then I\'ll make sure I\'m worth remembering!'],
    ornery: ['Hmph. Get my name right.'],
    shy: ['...Even me? Truly?'],
    curious: ['How do you remember so many? Is there room?'],
    dreamy: ['Remembered by a wizard. Like being kept in a song.'],
    witty: ['Remember my good side. It\'s the left.'],
    proud: ['That would be an honor.'],
    gloomy: ['...You promise?'],
  });
  L('ages.remember.tales', {
    _: ['In your tales? Me? In other valleys?', 'My name, told under a tree I\'ll never see. Oh.'],
    cheerful: ['In your TALES? Oh, make it a funny one!'],
    ornery: ['Tell it right. No exaggerating.'],
    shy: ['...I\'m in a tale? Truly?'],
    curious: ['What would you say about me? I want to know before I\'m in it.'],
    dreamy: ['My name, traveling further than I ever did. That\'s beautiful.'],
    witty: ['Am I the hero or the comic relief? Be honest.'],
    proud: ['I\'d be honored to be in a wizard\'s tale.'],
    gloomy: ['...You\'d really tell about me?'],
  });
  L('ages.remember.hedge', {
    _: ['In the hedges. Ha. I did plant a lot of hedges.', 'The valley remembers. I like that. Then I\'m not going anywhere.'],
    cheerful: ['Oh! And my roses! I\'ll be in the roses!'],
    ornery: ['They\'d better keep the hedges trimmed.'],
    shy: ['...Little things. Yes. That\'s how I\'d like to be remembered.'],
    curious: ['The valley as a sort of memory. That\'s a fascinating idea.'],
    dreamy: ['In the hedges and the light. Oh, yes.'],
    witty: ['In the hedges. Prickly. That\'s fair.'],
    proud: ['My work will last. I\'ve made sure.'],
    gloomy: ['...That\'s a kind way to see it.'],
  }, [
    { if: { job: has }, text: ['In the {ageTrade}. Yes. Somebody will do it the way I showed them.'] },
  ]);
  L('ages.remember.what', {
    _: ['That I was kind. And that I made a good cup of tea.', 'That I tried. That I loved them. That\'s enough.'],
    cheerful: ['That I laughed! Loudly! At everything!'],
    ornery: ['That I was right about the drains.'],
    shy: ['...That I was a good friend. Quietly.'],
    curious: ['That I asked good questions.'],
    dreamy: ['That I loved this place.'],
    witty: ['My jokes. The good ones.'],
    proud: ['That I did things properly.'],
    gloomy: ['That I was here at all.'],
  });
  L('ages.remember.promise', {
    _: ['...Thank you. I believe you. I don\'t know why, but I do.', 'Promise. Then I can stop worrying about it.'],
    cheerful: ['Oh, thank you! Now I can just get on with living!'],
    ornery: ['Hmph. I\'ll hold you to it. From wherever.'],
    shy: ['...Thank you. That means everything.'],
    curious: ['I\'ll trust you. You\'ve remembered a lot already.'],
    dreamy: ['Then I\'ll be kept somewhere safe. Thank you.'],
    witty: ['I\'ll check. I have connections.'],
    proud: ['Thank you. I\'m honored.'],
    gloomy: ['...That\'s the kindest thing anyone\'s ever said to me.'],
  });
  L('ages.remember.fed', {
    _: ['Ha! Then I\'ll feed you well. Starting now.', 'Ha! I\'ll bake you a cake. A memorable one.'],
    cheerful: ['Ha! Come for supper tonight! I\'ll be unforgettable!'],
    ornery: ['Bribery. Fine. Come at six.'],
    shy: ['...I\'ll bake something. Ha.'],
    curious: ['So memory\'s linked to food? I knew it.'],
    dreamy: ['A meal remembered. Yes. That\'s how I remember my grandmother.'],
    witty: ['Then I\'m set. I\'ve fed you twice.'],
    proud: ['My cooking is unforgettable.'],
    gloomy: ['Ha. ...I\'ll feed you, then.'],
  });
  L('ages.remember.taller', {
    _: ['Ha! Taller! And handsomer!', 'Taller. Ha. Make me a head taller. And braver.'],
    cheerful: ['Ha! Make me a giant!'],
    ornery: ['Just right. No taller. No shorter.'],
    shy: ['...Ha. Just a little taller.'],
    curious: ['How much taller? Will I have to be a different person?'],
    dreamy: ['Taller, and in a better coat.'],
    witty: ['And thinner. And funnier. Just me, but more.'],
    proud: ['Accurately. But perhaps a little taller.'],
    gloomy: ['Ha. Taller. That\'s cheered me.'],
  });
  L('ages.remember.kind', {
    _: ['In every hobbit I was kind to. ...That\'s a lot of hobbits, I hope.', 'A long memory. I\'d like that.'],
    cheerful: ['Then I\'ll be kind to everyone! Starting now!'],
    ornery: ['I wasn\'t always kind. ...I could start.'],
    shy: ['...I hope I was kind enough.'],
    curious: ['Kindness passed on. Like a game of pass-the-parcel.'],
    dreamy: ['Kindness echoing on, after. Oh.'],
    witty: ['I\'ll need to be kinder. I\'ve some catching up.'],
    proud: ['I\'ve always tried.'],
    gloomy: ['...Then I\'ll try harder.'],
  });

  // ==================================================================================
  // Can you give me my years back? (an elder asks)
  // ==================================================================================
  addThread({
    id: 'ages.ask.years', theirs: true, label: 'They ask if you could make them young again', cool: 14, ask: '{Name} leans on the gate and looks at you sideways.',
    when: (F) => known(F) && F.stage === 'elder',
    beats: {
      start: { line: 'ages.years.q', go: [
        { ap: 'jest', say: 'I could. But you\'d have to go back to school.', to: 'school' },
        { ap: 'share', say: 'If I could, I\'d have done it for myself. And then given it back.', to: 'giveback' },
        { ap: 'comfort', say: 'I wouldn\'t. You\'d lose all that you\'ve learned.', to: 'learned' },
      ] },
      school: { line: 'ages.years.school', go: [
        { ap: 'ask', say: 'What would you do with them, if you had them back?', to: 'do' },
        { ap: 'share', say: 'Truly? I\'d not do it if I could. Every year\'s been worth having.', to: 'giveback' },
      ] },
      giveback: { line: 'ages.years.giveback', go: [
        { ap: 'ask', say: 'What would you do with them, if you had them?', to: 'do' },
        { ap: 'warm', say: 'These years have you in them. I\'d not trade that.', to: 'trade' },
      ] },
      learned: { line: 'ages.years.learned', go: [
        { ap: 'ask', say: 'What would you do with them, if you could?', to: 'do' },
      ] },
      do: { line: 'ages.years.do', fx: { trust: 0.02 }, go: [
        { ap: 'advise', say: 'Do the smallest bit of it this week. Years aren\'t needed for that.', to: 'smallbit' },
        { ap: 'warm', say: 'It sounds like a good life. It was one.', to: 'goodlife' },
      ] },
      trade: { line: 'ages.years.trade', fx: { fond: 0.03 }, end: true },
      smallbit: { line: 'ages.years.smallbit', fx: { respect: 0.02, feel: 'inspired' }, end: true },
      goodlife: { line: 'ages.years.goodlife', fx: { fond: 0.03, trust: 0.02 }, end: true },
    },
  });
  L('ages.years.q', {
    _: ['Could you do it? With a spell? Give an old hobbit back a few years?', 'Is there a spell for being young? Just a bit young. Fifty would do.'],
    cheerful: ['Can you magic me young again? Just for one dance? Go on!'],
    ornery: ['You\'re a wizard. Make my knees young. Go on. I dare you.'],
    shy: ['...I\'ve always wondered. Could you? Make someone young?'],
    curious: ['Is it possible? Making someone young? In theory? I\'ve been wondering how it would work.'],
    dreamy: ['If you had a spell to make me young again, would you use it?'],
    witty: ['I\'ll pay well for a few years back. Cash. No questions.'],
    proud: ['A wizard of your standing must have a spell for youth.'],
    gloomy: ['There\'s no spell for this, is there. For being old.'],
  }, [
    { if: { ageRoad: ['near', 'planned'] }, pri: 1, text: ['Before I set off. Could you give me back a year or two? Just to finish things?'] },
  ]);
  L('ages.years.school', {
    _: ['School! Ha! No thank you. Keep your spell.', 'Back to school! Oh, I\'d rather the knees.'],
    cheerful: ['Ha! I loved school! ...No, I didn\'t.'],
    ornery: ['Then forget it. I\'m not doing sums again.'],
    shy: ['...Ha. No. Never mind, then.'],
    curious: ['Would I keep what I know now? That changes everything.'],
    dreamy: ['School, and long summers, and the swing by the river... hm.'],
    witty: ['I\'d be top of the class this time. I\'ve seen the answers.'],
    proud: ['I was very good at school, as it happens.'],
    gloomy: ['Ha. Typical. There\'s always a catch.'],
  });
  L('ages.years.giveback', {
    _: ['Given it back? Why?', 'You\'d give them back. ...You don\'t want to be young?'],
    cheerful: ['Give them back! Why? Being young is wonderful!'],
    ornery: ['That makes no sense. ...Explain.'],
    shy: ['...Why would you give them back?'],
    curious: ['Why? What would be wrong with being young again?'],
    dreamy: ['Because the years are what made you, I suppose.'],
    witty: ['You\'d give them back. Wizards are very odd.'],
    proud: ['A wise answer. Even if I don\'t like it.'],
    gloomy: ['...Then old isn\'t all bad. For you.'],
  });
  L('ages.years.learned', {
    _: ['Lose what I\'ve learned. ...Hm. I hadn\'t thought of that.', 'All I\'ve learned. Some of it was very dear.'],
    cheerful: ['Oh! I\'d forget everyone! No! Keep the spell!'],
    ornery: ['I\'ve learned plenty. Not losing it now.'],
    shy: ['...I\'d forget the good bits too. No.'],
    curious: ['You\'re right. The knowing\'s the best bit. I\'d keep it.'],
    dreamy: ['Then I\'d not remember the swallows. No, keep the years.'],
    witty: ['I\'ve learned not to buy spells from wizards.'],
    proud: ['True. I\'ve learned a great deal.'],
    gloomy: ['...You\'re right. I suppose.'],
  });
  L('ages.years.do', {
    _: ['I\'d dance. And climb the knoll. And say a few things I never said.', 'I\'d go to the Sea. Finally.'],
    cheerful: ['Dance all night at the Badger! Then do it again!'],
    ornery: ['Fix the things I got wrong. There\'s a list.'],
    shy: ['...I\'d say hello to someone. Someone I never said hello to.'],
    curious: ['Learn the old maps. Every one.'],
    dreamy: ['Walk the whole valley at dawn, end to end.'],
    witty: ['Eat everything. Without consequences.'],
    proud: ['Do it all again, the same. And better.'],
    gloomy: ['I don\'t know. That\'s the trouble.'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['I\'d spend them with {ageMissed}. Every one of them.'] },
  ]);
  L('ages.years.trade', {
    _: ['These years have me in them. Ha. Yes. They do, don\'t they.', '...Thank you. I\'ll keep them, then.'],
    cheerful: ['Oh! Then I\'ll keep them! Every creaky one!'],
    ornery: ['Hmph. Flattery. ...Thank you.'],
    shy: ['...That\'s a lovely thing to say.'],
    curious: ['I\'d not thought of it that way. They are mine.'],
    dreamy: ['My years. Yes. I\'ll keep them close.'],
    witty: ['These years have me AND my knees in them. Mixed blessing.'],
    proud: ['They are good years.'],
    gloomy: ['...Then I\'ll stop wishing them away.'],
  });
  L('ages.years.smallbit', {
    _: ['The smallest bit. This week. All right. I can do a small bit.', 'No years needed. Hm. You\'re right, curse you.'],
    cheerful: ['Yes! I\'ll dance one dance this Mersday!'],
    ornery: ['Fine. One thing off the list.'],
    shy: ['...I\'ll say hello. To them. This week.'],
    curious: ['The smallest bit. I\'ll start with one map.'],
    dreamy: ['One dawn walk. Just one.'],
    witty: ['I\'ll eat one thing without consequences. Probably a cookie.'],
    proud: ['I\'ll do it properly.'],
    gloomy: ['...All right. A small bit.'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['The smallest bit. I\'ll sit by {ageMissed}\'s stone this week and say the things I meant to.'] },
  ]);
  L('ages.years.goodlife', {
    _: ['It was. It is. Thank you.', 'A good life. Yes. I think it was.'],
    cheerful: ['It was! It IS!'],
    ornery: ['Hmph. It was. Mostly.'],
    shy: ['...Thank you.'],
    curious: ['Was it? I\'d like to think so.'],
    dreamy: ['A good life. Like a long golden afternoon.'],
    witty: ['Good enough to want more of. That\'s the best kind.'],
    proud: ['It was. It still is.'],
    gloomy: ['...Maybe it was.'],
  });

  // ==================================================================================
  // What happens when hobbits go on their last adventure?
  // ==================================================================================
  addThread({
    id: 'ages.ask.lastroad', theirs: true, label: 'They ask about the last adventure', cool: 14, ask: '{Name} has a question, and it\'s a big one.',
    when: (F) => known(F) && (F.ageDeparted >= 1 || F.stage === 'elder'),
    rel: (F) => (F.ageMissedLately ? 2 : 1),
    beats: {
      start: { line: 'ages.last.q', go: [
        { ap: 'comfort', say: 'ages.last.a.green', label: 'They go somewhere green, under a quick sunrise.', to: 'green' },
        { ap: 'share', say: 'ages.last.a.dontknow', label: 'I don\'t know. Nobody does. But I\'m not afraid of it.', to: 'dontknow' },
        { ap: 'tale', say: 'ages.last.a.west', label: 'There\'s a road that bends west, the elves say…', to: 'west' },
      ] },
      green: { line: 'ages.last.green', go: [
        { ap: 'warm', say: 'I\'d bet my hat on it.', to: 'hat' },
        { ap: 'ask', say: 'Who would you want to see there?', to: 'who' },
      ] },
      dontknow: { line: 'ages.last.dontknow', fx: { trust: 0.03 }, go: [
        { ap: 'comfort', say: 'Everyone I\'ve seen set off has gone smiling.', to: 'smiling' },
        { ap: 'ask', say: 'What do you think happens?', to: 'think' },
      ] },
      west: { line: 'ages.last.west', go: [
        { ap: 'tale', say: 'ages.last.a.westmore', label: 'And at the end of it, a white shore and a far green country.', to: 'shore' },
        { ap: 'ask', say: 'What do you think is there?', to: 'think' },
      ] },
      who: { line: 'ages.last.who', fx: { trust: 0.02 }, end: true },
      hat: { line: 'ages.last.hat', fx: { fond: 0.02 }, end: true },
      smiling: { line: 'ages.last.smiling', fx: { trust: 0.02, fond: 0.02 }, end: true },
      think: { line: 'ages.last.think', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'That sounds right to me. Just right.', to: 'right' },
      ] },
      shore: { line: 'ages.last.shore', fx: { fond: 0.03, trust: 0.02 }, end: true },
      right: { line: 'ages.last.right', fx: { fond: 0.02 }, end: true },
    },
    end: { remember: 'Asked the wizard where the last road goes. He was kind about it.', rv: 1 },
  });
  L('ages.last.q', {
    _: ['When folk go on their last adventure... where do they go? Do you know?', 'Where does the last road go? You\'ve been further than anyone.'],
    cheerful: ['Where do they go, when they set off for the last time? Somewhere nice? Tell me it\'s nice.'],
    ornery: ['They walk off over the hills and that\'s that. Where to? Somebody must know.'],
    shy: ['...Where do they go? The old ones? When they set off and don\'t come back?'],
    curious: ['I\'ve always wanted to know. The last adventure. Where does it go? Has anyone come back?'],
    dreamy: ['When they go over the hills for the last time, what\'s waiting? Do you know?'],
    witty: ['The last adventure. Is there a good inn at the end, at least?'],
    proud: ['A last adventure is a fine way to go. But where does it lead?'],
    gloomy: ['Where do they go? Do they just... walk off and stop?'],
    child: ['Where do the old folk go, over the hills? When do they come back?', 'Why don\'t the old people come back from the last adventure? Where do they go?'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['{AgeMissed} went over the hills. Where is {ageMissed} now? Do you know? Can you tell me?'] },
    { if: { ageMissed: has, stage: 'child' }, pri: 2, text: ['My {ageMissedRel} {ageMissed} went on the last adventure. Where IS {ageMissed}? Is it nice there?'] },
    { if: { stage: 'elder' }, text: ['I\'ll be going myself, before long. Where does it go? Tell me true.'] },
  ]);
  lines('ages.last.a.green', [
    { text: ['Somewhere green, under a quick sunrise. Where nobody\'s knees ache and the kettle\'s always on.'] },
    { if: { stage: 'child' }, text: ['Somewhere lovely and green, where the sun comes up quick and there\'s cake, and all the old friends are waiting.'] },
  ]);
  lines('ages.last.a.dontknow', [
    { text: ['I don\'t know. Nobody does, not even wizards. But I\'ve never been afraid of it.'] },
    { if: { stage: 'child' }, text: ['I don\'t know, little one. Nobody knows. But I think it\'s somewhere good, and I\'m not scared of it.'] },
    { if: { stage: 'elder' }, text: ['I don\'t know. That\'s the truth, and you\'ve earned the truth. But I\'ve never once been afraid of it.'] },
  ]);
  lines('ages.last.a.west', [
    { text: ['There\'s a road that bends west, the elves say, that only the old can see. It goes on and on, and it\'s lit all the way.'] },
    { if: { stage: 'child' }, text: ['There\'s a secret road that bends west, and only the very old can see it. It has lanterns all the way along.'] },
  ]);
  lines('ages.last.a.westmore', [
    { text: ['And at the end, a white shore, and beyond it a far green country under a swift sunrise.'] },
    { if: { stage: 'child' }, text: ['And at the very end there\'s a white beach and a green country, and the sun comes up and everyone\'s there.'] },
  ]);
  L('ages.last.green', {
    _: ['Green. With the kettle on. ...I\'d like that. I think they\'d like that.', 'Under a quick sunrise. Oh. That sounds like a song.'],
    cheerful: ['Oh, lovely! And a party, I\'ll bet! There\'s always a party!'],
    ornery: ['As long as nobody\'s knees ache. That\'s the main thing.'],
    shy: ['...That sounds gentle. I\'m glad.'],
    curious: ['How do you know? Have you seen it? Seen into it?'],
    dreamy: ['A quick sunrise. I\'ll think of that every dawn now.'],
    witty: ['The kettle\'s always on. That\'s heaven, for a hobbit.'],
    proud: ['A fitting place.'],
    gloomy: ['...Do you think so? Really?'],
    child: ['With CAKE? Really?', 'So they\'re having cake? Good.'],
  });
  L('ages.last.dontknow', {
    _: ['You don\'t know either. ...That\'s strangely comforting.', 'Not afraid. Even you don\'t know, and you\'re not afraid.'],
    cheerful: ['Then I won\'t be afraid either! We\'ll not be afraid together!'],
    ornery: ['An honest wizard. That\'s rare.'],
    shy: ['...If you\'re not afraid, maybe I don\'t have to be.'],
    curious: ['So it\'s still a mystery. Good. I\'d hate to know everything.'],
    dreamy: ['Not knowing, and not afraid. That\'s how I\'d like to go.'],
    witty: ['A wizard who admits he doesn\'t know. Write it down.'],
    proud: ['Honest. I respect that.'],
    gloomy: ['...Thank you for not pretending.'],
    child: ['You don\'t know? But you know EVERYTHING.', 'Not scared? Then I\'m not scared.'],
  });
  L('ages.last.west', {
    _: ['A road that only the old can see. ...Lit all the way. Oh.', 'Bends west. I\'ve seen the old ones look west. Now I know why.'],
    cheerful: ['Lit all the way! Like Lantern Night! How wonderful!'],
    ornery: ['Only the old can see it. Hmph. Convenient.'],
    shy: ['...Lit all the way. Then nobody\'s walking in the dark.'],
    curious: ['Only the old can see it? How? What does it look like?'],
    dreamy: ['A lantern road, bending west. I can see it, almost.'],
    witty: ['Lit all the way. Somebody\'s paying for a lot of lamp oil.'],
    proud: ['A road worthy of the journey.'],
    gloomy: ['...Lit. That\'s good. I always worried it was dark.'],
    child: ['A SECRET road? With lanterns? Can I see it?'],
  });
  L('ages.last.who', {
    _: ['My mother. My old dog. Everyone who ever sat at our table.', 'Everyone I\'ve waved off. Waiting at the gate.'],
    cheerful: ['Everyone! And they\'ll all have saved me a seat!'],
    ornery: ['My father. I owe him an apology.'],
    shy: ['...Just one person. They know who.'],
    curious: ['The old storyteller. I\'ve a hundred questions saved up.'],
    dreamy: ['Everyone who ever made me laugh.'],
    witty: ['Whoever borrowed my good spade.'],
    proud: ['My family. All of them.'],
    gloomy: ['Everyone I didn\'t say goodbye to properly.'],
    child: ['Everyone! And my old cat!'],
  }, [
    { if: { ageMissed: has }, pri: 1, text: ['{AgeMissed}. First. Before anyone. {AgeMissed}.'] },
  ]);
  L('ages.last.hat', {
    _: ['Your hat! Then you\'re sure. Nobody bets that hat lightly.', 'Ha. Your hat. That\'s as good as a promise.'],
    cheerful: ['Your HAT! Then it must be true!'],
    ornery: ['Your hat\'s not worth much. ...But thank you.'],
    shy: ['...Thank you.'],
    curious: ['How sure does a wizard have to be, to bet a hat?'],
    dreamy: ['A wizard\'s hat on it. I\'ll sleep better.'],
    witty: ['The hat. Big stakes.'],
    proud: ['A serious wager. Thank you.'],
    gloomy: ['...All right. I believe you.'],
    child: ['Your HAT? Wow. Okay.'],
  });
  L('ages.last.smiling', {
    _: ['Smiling. ...Yes. They did, didn\'t they. I saw it.', 'Every one of them smiling. I\'ll remember that.'],
    cheerful: ['They do! They wave and smile! I\'ve seen them!'],
    ornery: ['Hmph. I\'ll go smiling, then. To spite the hills.'],
    shy: ['...That helps. A lot.'],
    curious: ['Why do you think that is? What do they know?'],
    dreamy: ['Smiling, walking into the light. Yes.'],
    witty: ['Smiling. Probably because they\'ve escaped the Moot.'],
    proud: ['With dignity, then.'],
    gloomy: ['...Then it can\'t be so bad.'],
    child: ['They wave! I saw them wave!'],
  });
  L('ages.last.think', {
    _: ['I think it\'s like coming home. After a long day. Someone opens the door.', 'I think it\'s a long walk with good company, and a hot supper at the end.'],
    cheerful: ['A party! The biggest one! And everyone\'s invited!'],
    ornery: ['Peace and quiet. Finally.'],
    shy: ['...Somewhere you don\'t have to be anyone. You just are.'],
    curious: ['I think it\'s the answers. To everything. That\'s my hope.'],
    dreamy: ['Like falling asleep in the sun, and waking in the morning of the world.'],
    witty: ['An inn that doesn\'t close. And no washing up.'],
    proud: ['A place where everything you did counts for something.'],
    gloomy: ['I hope it\'s rest. Just rest.'],
    child: ['A big garden with everyone in it!'],
  });
  L('ages.last.shore', {
    _: ['A far green country. ...I\'ll hold on to that.', 'A white shore. Under a swift sunrise. Oh, wizard.'],
    cheerful: ['Oh, I want to see it! Not yet! But one day!'],
    ornery: ['Hmph. It sounds very nice. Very nice indeed.'],
    shy: ['...Thank you. I\'ll think of that tonight.'],
    curious: ['Is it real? It sounds real. You make it sound real.'],
    dreamy: ['I\'ve heard that before. In a dream, I think.'],
    witty: ['Green. Good. I was worried it\'d be beige.'],
    proud: ['A worthy end to the road.'],
    gloomy: ['...That\'s beautiful. Thank you.'],
    child: ['I want to go to the green country! When I\'m old!'],
  });
  L('ages.last.right', {
    _: ['Just right. Ha. Then we agree.', 'Thank you. I\'ve never said that aloud.'],
    cheerful: ['We agree! Hooray!'],
    ornery: ['Of course it does.'],
    shy: ['...Thank you.'],
    curious: ['I\'ll keep thinking about it. But I\'m glad you agree.'],
    dreamy: ['Then that\'s where I\'ll go.'],
    witty: ['We\'ll compare notes. After.'],
    proud: ['Thank you.'],
    gloomy: ['...That helps.'],
    child: ['Yay!'],
  });

  // ==================================================================================
  // Do wizards have to grow up? (a child or youngster asks)
  // ==================================================================================
  addThread({
    id: 'ages.ask.growup', theirs: true, label: 'They ask if wizards have to grow up', cool: 10, ask: '{Name} tugs at your sleeve.',
    when: (F) => F.stage === 'child' && F.band !== 'toddler' && F.met,
    beats: {
      start: { line: 'ages.grow.q', go: [
        { ap: 'jest', say: 'Never. I\'m still waiting to.', to: 'never' },
        { ap: 'share', say: 'Everyone grows up. The trick is to keep a little bit back.', to: 'keep' },
        { ap: 'tale', say: 'Once I met a hobbit who decided not to. He was a hundred and still climbed trees.', to: 'trees' },
      ] },
      never: { line: 'ages.grow.never', go: [
        { ap: 'share', say: 'Truly? Everyone grows. But you can keep a little bit back.', to: 'keep' },
        { ap: 'jest', say: 'Don\'t tell anyone. They\'ll take my hat away.', to: 'secret' },
      ] },
      keep: { line: 'ages.grow.keep', go: [
        { ap: 'ask', say: 'Which bit would you keep?', to: 'which' },
        { ap: 'advise', say: 'Keep the wondering. Grown-ups who wonder are the best ones.', to: 'wonder' },
      ] },
      trees: { line: 'ages.grow.trees', go: [
        { ap: 'ask', say: 'Which bit of being young would you keep?', to: 'which' },
        { ap: 'warm', say: 'You could be like him. I think you will be.', to: 'like' },
      ] },
      secret: { line: 'ages.grow.secret', fx: { joke: { k: 'ages.growup', t: 'The wizard never grew up. It\'s a secret.' }, fond: 0.03 }, end: true },
      which: { line: 'ages.grow.which', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'Then keep it. I\'ll check, when you\'re grown.', to: 'check' },
      ] },
      wonder: { line: 'ages.grow.wonder', fx: { lean: 'rift', respect: 0.02 }, end: true },
      like: { line: 'ages.grow.like', fx: { fond: 0.02, lean: 'hill' }, end: true },
      check: { line: 'ages.grow.check', fx: { fond: 0.02, trust: 0.02 }, end: true },
    },
  });
  L('ages.grow.q', {
    _: ['Do wizards have to grow up? Or can you stay how you like?', 'Did you have to grow up? Did someone make you?'],
    'k:cheerful': ['Do wizards have to grow up? Because I don\'t want to! Not ever!'],
    'k:ornery': ['Do I HAVE to grow up? Everyone keeps saying I have to.'],
    'k:shy': ['...Do wizards have to grow up? I don\'t think I want to.'],
    'k:curious': ['When does growing up happen? Is there a day? Did wizards have one?'],
    'k:gloomy': ['Do you have to grow up? Grown-ups never play.'],
  }, [
    { if: { band: 'youth' }, pri: 1, text: ['Do wizards ever grow up properly? I\'m nearly grown and I don\'t feel it at all.'] },
  ]);
  L('ages.grow.never', {
    _: ['Ha! Still waiting! Really?', 'You\'re not grown up? But you\'re so OLD!'],
    'k:cheerful': ['Ahaha! Then I won\'t either!'],
    'k:ornery': ['Good. Then nobody can make me.'],
    'k:shy': ['...Really? Hee.'],
    'k:curious': ['How do you wait to grow up? What happens if it never comes?'],
    'k:gloomy': ['...Really? You\'re not?'],
  });
  L('ages.grow.keep', {
    _: ['Keep a little bit back. Like a sweet in your pocket?', 'Keep a bit? Which bit?'],
    'k:cheerful': ['Like keeping a bit of cake for later! I\'m good at that!'],
    'k:ornery': ['Only a little bit? I want to keep all of it.'],
    'k:shy': ['...I could keep a little bit. Quietly.'],
    'k:curious': ['How do you keep a bit back? Where do you put it?'],
    'k:gloomy': ['...Can you? Really?'],
  });
  L('ages.grow.trees', {
    _: ['A hundred and still climbing trees! Is that true?', 'Did he fall out? Did he?'],
    'k:cheerful': ['I want to be him! I\'m going to climb trees when I\'m a hundred!'],
    'k:ornery': ['Good for him. Nobody told HIM to get down.'],
    'k:shy': ['...I like trees. I could do that.'],
    'k:curious': ['Which tree? How high? Did his knees hurt?'],
    'k:gloomy': ['...That\'s nice. I hope I can.'],
  });
  L('ages.grow.secret', {
    _: ['I won\'t tell! Cross my heart!', 'Hee! A secret! Your hat\'s safe!'],
    'k:cheerful': ['I promise! Pinkie promise!'],
    'k:ornery': ['I\'ll keep it. If you give me a squib.'],
    'k:shy': ['...I won\'t tell. Hee.'],
    'k:curious': ['Who would take it? Is there a wizard council? Do they check?'],
    'k:gloomy': ['...I won\'t tell. Promise.'],
  });
  L('ages.grow.which', {
    _: ['The playing. And the not being scared of mud.', 'Laughing at nothing. Grown-ups don\'t laugh at nothing.'],
    'k:cheerful': ['ALL the fun bits! Puddles! Cartwheels! Pudding!'],
    'k:ornery': ['Saying what I think. Grown-ups never say what they think.'],
    'k:shy': ['...The bit where you can hide under the table and nobody minds.'],
    'k:curious': ['Asking why. About everything. I\'m keeping that.'],
    'k:gloomy': ['...The bit where someone tucks you in.'],
  });
  L('ages.grow.wonder', {
    _: ['Keep the wondering. I will! I wonder about everything!', 'Grown-ups who wonder. Like you!'],
    'k:cheerful': ['I\'ll wonder ALL the time!'],
    'k:ornery': ['Fine. But I\'m keeping the shouting too.'],
    'k:shy': ['...I\'m good at wondering. Quietly.'],
    'k:curious': ['I\'ll never stop! Never ever!'],
    'k:gloomy': ['...I can do that.'],
  });
  L('ages.grow.like', {
    _: ['Like him? Climbing trees at a hundred? Yes!', 'You think so? Really?'],
    'k:cheerful': ['YES! I\'ll be the oldest tree-climber ever!'],
    'k:ornery': ['I\'ll climb higher than him.'],
    'k:shy': ['...I\'d like that.'],
    'k:curious': ['How will you know? Will you come back and check?'],
    'k:gloomy': ['...Do you think?'],
  });
  L('ages.grow.check', {
    _: ['You\'ll check? Promise? You\'ll come back?', 'Then I have to keep it! You\'ll know!'],
    'k:cheerful': ['Come and check! I\'ll show you!'],
    'k:ornery': ['You\'d better come back, then.'],
    'k:shy': ['...I\'ll keep it safe.'],
    'k:curious': ['How will you check? Is there a test?'],
    'k:gloomy': ['...You\'ll come back?'],
  });
});
