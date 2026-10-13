'use strict';
// ---------------------------------------------------------------------------
// The rifts themselves, and the Long Dim: what folk think the tears in the
// sky are, the rift-folk's nights at the scar hunting the way home, the
// tinker Mungo Fernsby once the ledger's found, the Moot over the Long Dim
// (talked through with each hobbit, so you learn where they stand, and a word
// in the right way leans them, as a tale or a post on the Relay does:
// riftplay.js heard()), and life after it's decided. Reads the facts set in
// talk/rift.js.
// ---------------------------------------------------------------------------

talkPack('rift4', () => {
  const heardIt = (lean) => (T, v) => { if (typeof heard === 'function' && v.isGrown()) heard(v, lean); };
  // asking is how you learn their mind: it shows on the Long Dim page
  const asked = (T, v) => { if (typeof rp === 'function') rp().ask[v.id] = Game.day; };
  const softenSelf = (amt) => (T, v) => { if (typeof relay !== 'function' || v.isRiftborn()) return; const r = relay(); const s = r.soft || (r.soft = {}); s[v.id] = Math.min(0.6, (s[v.id] || 0) + amt); };
  const both = (...fns) => (T, v) => { for (const f of fns) f(T, v); };
  // a rift-born's own word to their dearest hill friend carries further than the wizard's
  const friendHears = (lean) => (T, v) => { const n = T.F.riftHillFriend; const o = n && Game.villagers.find((x) => x.first === n); if (o && typeof heard === 'function' && o.isGrown()) heard(o, lean); };
  // how open they are to being argued with, by temper (as riftplay.js reckons it)
  const OPEN = { curious: 1.3, dreamy: 1.3, cheerful: 1, witty: 0.9, shy: 0.85, gloomy: 0.8, proud: 0.6, ornery: 0.4 };
  const receptive = (F) => (OPEN[F.temper] || 1) * (0.5 + Math.max(0, F.fond)) >= 0.55;
  const fragHas = (k) => (F) => (F.riftFrags || []).includes(k);

  // --- The tears in the sky ---------------------------------------------------------------
  addThread({
    id: 'rift.sky', label: 'The tears in the sky', weight: 0.9, cool: 5,
    when: (F) => F.riftStage >= 1 && !F.riftFinale,
    rel: (F) => (F.riftOpen ? 2 : F.riftStage <= 2 ? 1.3 : 0.7),
    open: { ask: 'rift.sky.open' },
    beats: {
      start: { line: 'rift.sky.start', go: [
        { ap: 'ask', say: 'And what do you think they are?', to: 'theory' },
        { ap: 'jest', say: 'Perhaps the sky wants darning.', to: 'darn' },
        { ap: 'ask', say: 'Do they frighten you?', to: 'afraid' },
      ] },
      theory: { line: 'rift.sky.theory', go: [
        { ap: 'tale', say: 'An old tale says green lightning once took a hobbit away.', to: 'tale', need: { if: { riftClues: { min: 2 } } }, soft: true },
        { ap: 'warm', say: 'Doors, I think. Someone\'s knocking.', to: 'doors' },
        { ap: 'ask', say: 'And if they stopped, would you miss them?', to: 'stop' },
      ] },
      darn: { line: 'rift.sky.darn', go: [
        { ap: 'ask', say: 'Seriously, though. What do you think they are?', to: 'theory' },
        { ap: 'warm', say: 'Doors, I think. Someone\'s knocking.', to: 'doors' },
      ] },
      afraid: { line: 'rift.sky.afraid', go: [
        { ap: 'comfort', say: 'Nothing that\'s come through has meant any harm.', to: 'comforted' },
        { ap: 'ask', say: 'What do you think they are?', to: 'theory' },
      ] },
      stop: { line: 'rift.sky.stop', go: [
        { ap: 'warm', say: 'Doors, I think. Someone\'s knocking.', to: 'doors' },
      ] },
      tale: { line: 'rift.sky.tale', fx: { trust: 0.02, run: heardIt(0.04) }, end: true },
      doors: { line: 'rift.sky.doors', fx: { fond: 0.01, run: both(softenSelf(0.05), heardIt(0.03)) }, end: true },
      comforted: { line: 'rift.sky.comforted', fx: { trust: 0.02, run: softenSelf(0.06) }, end: true },
    },
  });
  lines('rift.sky.open', [
    { text: ['What do you make of the rifts, {name}? The tears themselves.', 'The sky\'s been doing odd things, {name}. What do you think of it?'] },
    { if: { riftOpen: true }, text: ['There\'s one open now, {name}. Have you been to look?', 'Do you hear it humming, {name}? The rift?'] },
  ]);
  lines('rift.sky.start', [
    { text: ['The rifts? Ooh. Gives me the shivers. Lovely shivers, mostly.', 'Like someone took a knife to the sky and the light\'s bleeding through. Purple light.', 'I\'ve stopped looking up, honestly. Then I look up.'] },
    { if: { rift: true }, text: ['The rifts? They\'re how I got here. I look at them like you\'d look at the road home. A very strange road.'] },
    { if: { stage: 'child' }, text: ['They\'re SPARKLY. And they HUM. And sometimes people fall out! I want to go through!'] },
    { if: { riftOpen: true }, pri: 1, text: ['Have you seen it? Right now? It\'s humming like bees in a jar. Everyone\'s gone to gawp.'] },
    { if: { temper: 'ornery' }, text: ['A nuisance. Holes in the sky, bits of scrap in the hay, strangers in the lane. Nuisance.'] },
    { if: { temper: 'dreamy' }, text: ['The most beautiful thing I\'ve ever seen. I\'d be afraid if it wasn\'t so beautiful.'] },
    { if: { temper: 'curious' }, text: ['I\'ve been keeping a log! When they open, where, how long, who comes out. There\'s a pattern. I\'m close.'] },
    { if: { temper: 'gloomy' }, text: ['Bad weather that brings people. I don\'t know whether to curse it or thank it.'] },
    { if: { temper: 'witty' }, text: ['The sky\'s got a leak and it\'s leaking neighbours. I\'ve put a bucket out.'] },
    { if: { temper: 'shy' }, text: ['I close my curtains when they open. Then I peep.'] },
    { if: { riftStage: { min: 8 } }, pri: 1, text: ['They gutter now. Every night. Like candles near the end. It\'s worse than when they tore. It\'s sadder.'] },
  ]);
  lines('rift.sky.theory', [
    { text: ['Weather. Strange weather. My gran had a word for it. I forget the word.', 'Doors. Got to be. Things come through doors.'] },
    { if: { rift: true }, text: ['A signal. Something\'s calling. We\'re just what the call carries.', 'Doors, held open from the other side. By someone tired.'] },
    { if: { temper: 'ornery' }, text: ['Punishment. For all the dancing. I\'ve always said there was too much dancing.'] },
    { if: { temper: 'curious' }, text: ['They hum in threes. Open by day mostly. Near the party field oftener than chance. That\'s not weather. That\'s aim.'] },
    { if: { temper: 'dreamy' }, text: ['Wishes. Someone very far away wishing very hard. That\'s what I think.'] },
    { if: { temper: 'witty' }, text: ['Somebody up there\'s lost the thread on their knitting. Not my business. Very much my business.'] },
    { if: { temper: 'gloomy' }, text: ['A wound. Things that tear don\'t heal tidy. I\'ve buried enough to know.'] },
    { if: { stage: 'child' }, text: ['It\'s a TRAIN. A sky train. And it stops here because we have the best cakes.'] },
    { if: { riftFrags: 'gold' }, pri: 1, text: ['When every lamp\'s lit, the edges go gold. Something over there steadies when we\'re bright. I think it\'s drinking our light.'] },
  ]);
  lines('rift.sky.darn', [
    { text: ['Darning! Ha! My nan could\'ve done it. She darned everything. She darned a cat once.', 'I\'ll fetch my needles. You hold the ladder.'] },
    { if: { temper: 'ornery' }, text: ['Not funny. ...Bit funny.'] },
    { if: { stage: 'child' }, text: ['With a GIANT needle! And giant wool! Can I help?'] },
  ]);
  lines('rift.sky.afraid', [
    { text: ['A bit. When they open at night. The light goes all across the ceiling, purple, and the hens go quiet.', 'Frightened? No. Wary. There\'s a difference. I\'m not sure what it is.'] },
    { if: { rift: true }, text: ['Me? No. They\'re the only thing here that looks like home. That\'s what scares me. Wanting to go in.'] },
    { if: { temper: 'proud' }, text: ['Frightened? Of some lights? I\'ve faced down a bull.'] },
    { if: { stage: 'child' }, text: ['A bit. At night. In the day they\'re brilliant.'] },
  ]);
  lines('rift.sky.stop', [
    { text: ['Miss them? ...Do you know, I would. Life\'s more interesting with holes in it.', 'I\'d sleep easier. And I\'d miss them. Both.'] },
    { if: { rift: true }, text: ['If they stopped, that\'d be it. No more anybody. I\'d miss them like a door you\'ve stopped hoping at.'] },
  ]);
  lines('rift.sky.tale', [
    { text: ['A hobbit? Taken by lightning? ...So it\'s happened before. That\'s worse. That\'s better. I don\'t know which.', 'Green lightning. My gran said that. "Mind the green weather." I thought she meant the cabbages.'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['Fernsby. The ledger. So the sky\'s been open the other way before. One of ours went first. Bless me.'] },
  ]);
  lines('rift.sky.doors', [
    { text: ['Knocking. Hm. Then I suppose someone ought to answer.', 'Doors. Yes. And you don\'t leave folk knocking. Not here.'] },
    { if: { rift: true }, text: ['Knocking. Yes. And you lot answered. Thank you for that.'] },
    { if: { temper: 'ornery' }, text: ['Doors can be shut, too. ...But not in someone\'s face. My mum taught me that.'] },
  ]);
  lines('rift.sky.comforted', [{ text: ['No harm. That\'s true. A lot of noise and a good many noodles. No harm.', 'You\'re right. I\'ll stop drawing the curtains. Some nights.'] }]);

  // --- Hunting the way home, at the scar ---------------------------------------------------
  addThread({
    id: 'rift.seek', label: 'Out at the scar every night', weight: 1.1, cool: 3,
    when: (F) => F.rift && F.stage !== 'child' && !F.riftFinale && (F.riftSeeking || F.was === 'seek_home'),
    open: { ask: 'rift.seek.open' },
    beats: {
      start: { line: 'rift.seek.start', go: [
        { ap: 'ask', say: 'How close are you?', to: 'close' },
        { ap: 'ask', say: 'And if you find it?', to: 'ifind' },
        { ap: 'warm', say: 'Mind you sleep too. Doors wait.', to: 'sleep' },
      ] },
      close: { line: 'rift.seek.close', go: [
        { ap: 'ask', say: 'And if you find it?', to: 'ifind' },
        { ap: 'advise', say: 'Ask the miller about the river\'s rhythm. It might help.', to: 'miller' },
      ] },
      ifind: { line: 'rift.seek.ifind', fx: { trust: 0.02 }, go: [
        { ap: 'listen', say: '*You wait.*', label: 'Wait', to: 'torn' },
        { ap: 'comfort', say: 'Whatever you choose, there\'ll be a light left on here.', to: 'light' },
      ] },
      sleep: { line: 'rift.seek.sleep', go: [
        { ap: 'ask', say: 'And if you find it?', to: 'ifind' },
      ] },
      torn: { line: 'rift.seek.torn', go: [
        { ap: 'comfort', say: 'Whatever you choose, there\'ll be a light left on here.', to: 'light' },
      ] },
      miller: { line: 'rift.seek.miller', fx: { respect: 0.02 }, end: true },
      light: { line: 'rift.seek.light', fx: { trust: 0.03, fond: 0.02 }, end: true },
    },
  });
  lines('rift.seek.open', [
    { text: ['I see you out at the scar every night, {name}.', 'Still hunting for the way home, {name}?'] },
  ]);
  lines('rift.seek.start', [
    { text: ['Every night. Sensors, notes, the others. It hums in threes. We\'ve caught it twice.', 'We think the rifts have a frequency. If we match it, a door opens. One that stays.'] },
    { if: { temper: 'gloomy' }, text: ['Every night. It\'s the only thing that makes the waiting feel like doing.'] },
    { if: { temper: 'cheerful' }, text: ['It\'s fun, actually! We sit in a circle with gadgets and argue. Like your Moot, but with sparks.'] },
    { if: { temper: 'curious' }, text: ['It\'s the best puzzle I\'ve ever had. A door that tunes like a song. If I solve it, I\'ll cry.'] },
    { if: { temper: 'shy' }, text: ['I mostly hold the sensor. Very still. I\'m good at very still.'] },
    { if: { temper: 'proud' }, text: ['I\'m the one who caught it the second time. Write that down somewhere.'] },
    { if: { riftOpen: true }, pri: 1, text: ['There\'s one open now. It\'s louder than the scar. We\'re camped right by it. Listening.'] },
  ]);
  lines('rift.seek.close', [
    { text: ['Closer. We had it for a whole breath last night. Sparks and shouting. Then it drifted.', 'Close enough to dread it. Far enough to keep hoping.'] },
    { if: { riftRelay: true }, text: ['The Relay helps. Its mast catches the hum. We\'re closer than we\'ve been.'] },
  ]);
  lines('rift.seek.ifind', [
    { text: ['Then everyone has to choose. That\'s the part nobody says out loud at the scar.', 'Then I look through. A long time. And then I don\'t know.'] },
    { if: { spouse: (s) => !!s }, pri: 1, text: ['Then I bring {spouse} to look. And we decide together. That\'s the only way I can bear it.'] },
    { if: { riftHillFriend: (x) => !!x }, text: ['Then I\'d have to tell {riftHillFriend}. I\'ve practised it. I can\'t get past the first word.'] },
    { if: { lost: (x) => !!x }, text: ['Then maybe I find {lost}. Or maybe the door\'s empty on the other side, too.'] },
  ]);
  lines('rift.seek.sleep', [
    { text: ['Sleep. Yeah. I\'ll sleep when I\'m home. ...Wherever that is.', 'Doors wait. Okay. I\'ll take one night off. Maybe.'] },
    { if: { tired: true }, text: ['I\'m so tired, wizard. Okay. One night. Copy that.'] },
  ]);
  lines('rift.seek.torn', [
    { text: ['...I don\'t know if I\'m working to find it or to prove it can\'t be found.', 'Some nights I get the reading wrong on purpose. Don\'t tell the others.'] },
  ]);
  lines('rift.seek.miller', [{ text: ['The river\'s rhythm! Threes! The wheel goes in threes! Oh. Oh, I need to go.', 'The miller. Okay. Millers love explaining. I\'ve heard.'] }]);
  lines('rift.seek.light', [{ text: ['A light left on. ...Thanks. I\'ll remember which window.', 'Copy that. A light on. I\'ll look for it.'] }]);

  // --- Mungo Fernsby, once the ledger's found ------------------------------------------------
  addThread({
    id: 'rift.mungo', label: 'The tinker Mungo Fernsby', weight: 1.2, cool: 6,
    when: (F) => (F.riftFrags || []).includes('ledger') && F.stage !== 'child',
    rel: (F) => (F.stage === 'elder' || F.rift ? 1.5 : 1),
    open: { ask: 'rift.mungo.open' },
    beats: {
      start: { line: 'rift.mungo.start', go: [
        { ap: 'ask', say: 'What do folk say about him?', to: 'say' },
        { ap: 'jest', say: 'He still owes threepence at the Crooked Kettle.', to: 'debt' },
        { ap: 'ask', say: 'Do you think he meant to go?', to: 'meant' },
      ] },
      say: { line: 'rift.mungo.say', go: [
        { ap: 'ask', say: 'Do you think he meant to go?', to: 'meant' },
        { ap: 'warm', say: 'So the rift-folk are kin, in a way.', to: 'kin' },
      ] },
      debt: { line: 'rift.mungo.debt', fx: { joke: { k: 'rift.threepence', t: 'Mungo still owes the Crooked Kettle threepence.' } }, go: [
        { ap: 'ask', say: 'Do you think he meant to go?', to: 'meant' },
        { ap: 'warm', say: 'Perhaps his children\'s children will settle it.', to: 'kin' },
      ] },
      meant: { line: 'rift.mungo.meant', go: [
        { ap: 'tale', say: 'He asked me once if lightning could be caught in a jar. I laughed.', to: 'jar' },
        { ap: 'warm', say: 'So the rift-folk are kin, in a way.', to: 'kin' },
      ] },
      jar: { line: 'rift.mungo.jar', fx: { trust: 0.03 }, go: [
        { ap: 'warm', say: 'So the rift-folk are kin, in a way.', to: 'kin' },
      ] },
      kin: { line: 'rift.mungo.kin', fx: { fond: 0.02, run: both(softenSelf(0.15), heardIt(0.06)) }, end: true },
    },
  });
  lines('rift.mungo.open', [
    { text: ['The ledger, {name}. Mungo Fernsby. What do you make of it?', 'Have you heard about the tinker in the ledger, {name}?'] },
  ]);
  lines('rift.mungo.start', [
    { text: ['Mungo Fernsby! Walked into green lightning with a kettle. And now his kettle\'s on all their sleeves.', 'A tinker from our own valley. I can\'t get over it. Our own valley.'] },
    { if: { rift: true }, text: ['Saint Mungo of the First Lamp was a hill-hobbit tinker with a bar tab. I\'ve never loved a saint more.', 'He\'s on our coins. He\'s on your debt ledger. I laughed till I cried. Then I just cried.'] },
    { if: { stage: 'elder' }, pri: 1, text: ['Fernsby. My grandad\'s grandad knew the family. Kettle-menders, all of them. Never could leave a thing alone.'] },
    { if: { temper: 'ornery' }, text: ['A Fernsby. Typical. Never could stay put, that lot. Now look what he\'s started.'] },
    { if: { temper: 'dreamy' }, text: ['He went out into the dark with a kettle and made a city. If that\'s not a song, I don\'t know what is.'] },
    { if: { temper: 'curious' }, text: ['A kettle-dynamo! He built a dynamo out of a KETTLE. On the other side. With no help. I want to know how.'] },
    { if: { temper: 'witty' }, text: ['Walked into a storm, founded a civilisation, never paid his tab. Very hobbit, in the end.'] },
    { if: { temper: 'gloomy' }, text: ['Poor fellow. All that way from home. And nobody here remembered him but a ledger.'] },
  ]);
  lines('rift.mungo.say', [
    { text: ['That he was clever. Too clever. Mended kettles that weren\'t broken.', 'That he talked to the weather. And one day it talked back.'] },
    { if: { rift: true }, text: ['That he lit the first lamp. That he walked out of the storm with fire in a kettle. That he was kind.'] },
    { if: { stage: 'elder' }, text: ['My nan said the Fernsbys left a light in the window for him for forty years. Then they moved to Bree.'] },
  ]);
  lines('rift.mungo.debt', [
    { text: ['Threepence! Ha! Somebody ought to pay it. For the honour of the valley.', 'The Crooked Kettle closed sixty years ago. The debt\'s outlived the inn.'] },
    { if: { rift: true }, text: ['I\'m paying it. I\'ve got threepence. I\'ll pay it on behalf of the whole city. Where do I go?'] },
    { if: { temper: 'witty' }, text: ['With interest, it\'s a city. I think we\'re square.'] },
  ]);
  lines('rift.mungo.meant', [
    { text: ['Meant to? Who walks into lightning on purpose? ...A tinker would. A tinker might.', 'I think he meant to see where it went. Not to stay. Nobody means to stay.'] },
    { if: { rift: true }, text: ['I think he meant to come back. And couldn\'t. And so he made somewhere to wait. And it got big.'] },
    { if: { temper: 'dreamy' }, text: ['I think the lightning asked him. And he said yes. Some folk do.'] },
  ]);
  lines('rift.mungo.jar', [
    { text: ['You knew him? You KNEW him? ...And you laughed. Oh, wizard.', 'Lightning in a jar. And he did it. In a kettle. On the other side. Oh, I wish he knew you\'d remembered.'] },
    { if: { rift: true }, text: ['You knew Saint Mungo. You laughed at Saint Mungo. ...He\'d have laughed too. That\'s what the stories say.'] },
  ]);
  lines('rift.mungo.kin', [
    { text: ['Kin. Mungo\'s children\'s children. Coming home. ...Well. You don\'t turn kin from the door.', 'Kin. Bless me. I\'ve been rude to kin. I\'ll take round a pie.'] },
    { if: { rift: true }, text: ['Kin. Cousins, from a long way round. ...So I didn\'t fall out of the sky. I came home. Huh.'] },
    { if: { riftWary: ['some', 'much'] }, pri: 1, text: ['Kin. ...I\'ve been crossing the lane to avoid kin. That\'s not how I was raised.'] },
  ]);

  // --- The Long Dim: where do you stand? ---------------------------------------------------
  addThread({
    id: 'rift.dim', label: 'The Moot over the Long Dim', weight: 1.6, cool: 1,
    when: (F) => F.riftDim && F.stage !== 'child' && !F.rift,
    rel: (F) => 1.5,
    open: { ask: 'rift.dim.open' },
    beats: {
      start: { line: 'rift.dim.start', fx: { run: asked }, go: [
        { ap: 'ask', say: 'What weighs most with you?', to: 'weigh' },
        { ap: 'tale', say: 'Let me tell you what I think the rifts are.', to: 'tale' },
        { ap: 'listen', say: '*You let them think aloud.*', label: 'Let them think aloud', to: 'think' },
      ] },
      weigh: { line: 'rift.dim.weigh', go: [
        { ap: 'warm', say: 'rift.dim.case.open', label: 'Make the case for Hearthlink', to: [{ to: 'moved', need: { when: receptive } }, 'unmoved'] },
        { ap: 'advise', say: 'rift.dim.case.close', label: 'Make the case for closing them softly', to: [{ to: 'moved2', need: { when: receptive } }, 'unmoved2'] },
        { ap: 'ask', say: 'And if {riftFriend} asked you to vote the other way?', to: 'friendask', need: { if: { riftFriend: (x) => !!x } } },
      ] },
      tale: { line: 'rift.dim.tale', fx: { run: heardIt(0.05) }, go: [
        { ap: 'ask', say: 'Does that change anything, for you?', to: 'think' },
        { ap: 'warm', say: 'Whatever you decide, the village will hold.', to: 'hold' },
      ] },
      think: { line: 'rift.dim.think', go: [
        { ap: 'warm', say: 'rift.dim.case.open', label: 'Make the case for Hearthlink', to: [{ to: 'moved', need: { when: receptive } }, 'unmoved'] },
        { ap: 'advise', say: 'rift.dim.case.close', label: 'Make the case for closing them softly', to: [{ to: 'moved2', need: { when: receptive } }, 'unmoved2'] },
        { ap: 'comfort', say: 'Whatever you decide, the village will hold.', to: 'hold' },
      ] },
      moved: { line: 'rift.dim.moved', fx: { run: heardIt(0.1), respect: 0.02 }, end: true },
      unmoved: { line: 'rift.dim.unmoved', fx: { fond: -0.01 }, end: true },
      moved2: { line: 'rift.dim.moved2', fx: { run: heardIt(-0.1), respect: 0.02 }, end: true },
      unmoved2: { line: 'rift.dim.unmoved2', fx: { fond: -0.01 }, end: true },
      friendask: { line: 'rift.dim.friendask', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'rift.dim.case.open', label: 'Make the case for Hearthlink', to: [{ to: 'moved', need: { when: receptive } }, 'unmoved'] },
        { ap: 'comfort', say: 'Whatever you decide, the village will hold.', to: 'hold' },
      ] },
      hold: { line: 'rift.dim.hold', fx: { trust: 0.03, fond: 0.02 }, end: true },
    },
  });
  lines('rift.dim.open', [
    { text: ['The Moot\'s coming, {name}. Where do you stand on the Long Dim?', 'How will you vote, {name}, when the Moot meets?', 'Have you made up your mind about the Long Dim, {name}?'] },
  ]);
  lines('rift.dim.start', [
    { text: ['I don\'t rightly know. Lend them our river, or close the sky. It\'s a lot to ask of a hobbit with a cold.', 'I\'ve been turning it over. Like a stone in a pocket.'] },
    { if: { riftSide: 'hearthlink' }, text: ['Keep the doors open. Lend them the river. It\'s only water going by.', 'Hearthlink, I think. What\'s the harm in a lamp left lit?'] },
    { if: { riftSide: 'softclose' }, text: ['Close them. Gently. Let the rift-folk make their home here and let the sky heal.', 'Sing them shut, I say. Kindly. Before something worse comes through.'] },
    { if: { riftSide: 'undecided' }, text: ['I keep changing my mind. Morning, I\'m for the doors. Supper, I\'m for closing them.', 'There\'s sense on both sides. I\'ll know when I\'m in the Moot. Maybe.'] },
    { if: { riftSide: 'hearthlink', riftFriend: (x) => !!x }, pri: 1, text: ['{RiftFriend}\'s my friend. I\'d want {riftFriend} to see home again. Lend them the river, I say.'] },
    { if: { riftSide: 'softclose', riftWary: ['some', 'much'] }, pri: 1, text: ['They make me uneasy, and that\'s the truth. Close the doors, gently, and let us be.'] },
    { if: { temper: 'ornery' }, text: ['I\'ll vote how I like. ...Since you ask so politely. I\'m still thinking.'] },
    { if: { temper: 'proud' }, text: ['I\'ve made up my mind. I\'ll say it at the Moot, not before.'] },
    { if: { goBetween: true }, pri: 1, text: ['I\'m a go-between, they tell me. My word counts twice. So I\'d better get it right, hadn\'t I?'] },
  ]);
  lines('rift.dim.weigh', [
    { text: ['The young ones. What sort of valley we leave them. Doors in the sky, or no doors.', 'Whether it\'s ours to give. The river\'s not mine. It\'s everyone\'s.'] },
    { if: { riftFriend: (x) => !!x }, pri: 1, text: ['{RiftFriend}. Honestly. {RiftFriend}\'s face when the rifts flicker. I can\'t bear it.'] },
    { if: { riftWary: 'much' }, pri: 1, text: ['The not knowing. Lend them our river, then our wind. What do we lend them next year?'] },
    { if: { values: 'tradition' }, text: ['The old ways. We were a quiet valley. I\'d like us to be one again.'] },
    { if: { values: 'learning' }, text: ['The chance to learn. A door between worlds! When will anyone ever have that again?'] },
    { if: { values: 'kin' }, text: ['Family. Theirs and ours. Somebody\'s mum is on the other side of that sky.'] },
    { if: { values: 'thrift' }, text: ['The cost. Timber for the hearths, water for the mill. Lending\'s fine if you get it back.'] },
    { if: { values: 'merriment' }, text: ['The parties, if I\'m honest! Visitors from the city! Imagine the Midsummer we\'d have!'] },
    { if: { values: 'nature' }, text: ['The sky. It\'s torn. Things that are torn should be let heal, not held open.'] },
  ]);
  lines('rift.dim.case.open', [
    { text: ['They\'re children sent somewhere safe. We could keep their lamps lit with water that goes by anyway.', 'A door kept open is a lamp kept lit. And we\'d have visitors. Think of the stories.'] },
    { if: { riftFriend: (x) => !!x }, text: ['Think of {riftFriend}, going home for a visit and coming back with news. Both, not one or the other.'] },
  ]);
  lines('rift.dim.case.close', [
    { text: ['Perhaps it\'s kinder to close the door gently, and let them make their home here.', 'Some doors are best closed softly, before the wind slams them. Let the sky mend.'] },
  ]);
  lines('rift.dim.tale', [
    { text: ['A lamp in the dark, and children sent to find somewhere soft. ...You tell it well. Too well.', 'So they\'re not strangers. They\'re someone\'s little ones. Oh, that\'s not fair, wizard. That\'s not fair.'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['Fernsby\'s children\'s children. Coming home. ...You don\'t leave kin in the dark. You don\'t.'] },
    { if: { temper: 'ornery' }, text: ['A pretty story. Stories don\'t mend skies. ...It was a good story, though.'] },
  ]);
  lines('rift.dim.think', [
    { text: ['If we lend the river... the mill still turns? It still turns. And they get light. ...And if it costs us?', 'If we close it... they stay. All of them. For good. That\'s not nothing either.'] },
    { if: { temper: 'gloomy' }, text: ['Either way somebody\'s sad. I hate votes where somebody\'s sad.'] },
    { if: { temper: 'curious' }, text: ['What would a door between worlds even be like? Letters? Visitors? Trade? I can\'t stop imagining.'] },
    { if: { temper: 'shy' }, text: ['I don\'t want to stand up in the Moot. Everyone looks at you. I\'ll just raise my hand. Quietly.'] },
    { if: { stage: 'elder' }, text: ['At my age, you think about who\'ll mind the valley after. What will they want? I don\'t know.'] },
  ]);
  lines('rift.dim.moved', [
    { text: ['...You may have something there. I hadn\'t thought of it like that.', 'Water going by anyway. Hm. Put like that, it\'s hard to say no.'] },
    { if: { temper: 'dreamy' }, text: ['A lamp kept lit. Oh. Yes. I\'d like to be part of that.'] },
    { if: { temper: 'cheerful' }, text: ['Visitors! Stories! Neon at Midsummer! All right, you\'ve got me.'] },
    { if: { temper: 'shy' }, text: ['...I\'ll raise my hand for the doors. Quietly. But I\'ll raise it.'] },
  ]);
  lines('rift.dim.unmoved', [
    { text: ['Don\'t lecture me, wizard. I\'ll make up my own mind.', 'Hmph. We\'ll see.'] },
    { if: { temper: 'ornery' }, text: ['I\'ve been told what to think by better than you. Well. By louder.'] },
    { if: { temper: 'proud' }, text: ['I\'ll thank you not to decide my vote for me.'] },
  ]);
  lines('rift.dim.moved2', [
    { text: ['Closed softly. Yes. That\'s kinder than leaving it banging. Let them be ours.', 'Let the sky mend. ...I think that\'s right. I think that\'s what I\'d want, if I was the sky.'] },
    { if: { temper: 'gloomy' }, text: ['A soft close. Better than a slow fade. Yes.'] },
  ]);
  lines('rift.dim.unmoved2', [
    { text: ['Close it? And leave them all in the dark over there? No. Not me.', 'Easy to say close it when it\'s not your home going dark.'] },
    { if: { riftFriend: (x) => !!x }, pri: 1, text: ['And never let {riftFriend} see home again? No, wizard. Not for all the quiet in the Shire.'] },
  ]);
  lines('rift.dim.friendask', [
    { text: ['{RiftFriend}? ...Then I\'d vote the other way. Friends come first. Don\'t tell the Moot that.', 'If {riftFriend} asked? I\'d listen. I\'d always listen to {riftFriend}.'] },
    { if: { temper: 'proud' }, text: ['{RiftFriend} wouldn\'t ask. That\'s why I trust {riftFriend}.'] },
  ]);
  lines('rift.dim.hold', [
    { text: ['The village will hold. ...Yes. It always has. Thank you.', 'It\'ll hold. Hobbits are good at holding. Mostly onto plates.'] },
    { if: { temper: 'gloomy' }, text: ['I hope so. You say it like you know. That helps.'] },
  ]);

  // --- The Long Dim, from the other side -----------------------------------------------
  addThread({
    id: 'rift.dim.rift', label: 'Your city, going dark', weight: 1.6, cool: 1,
    when: (F) => F.riftDim && F.rift && F.stage !== 'child',
    open: { warm: 'rift.dimr.open' },
    beats: {
      start: { line: 'rift.dimr.start', fx: { run: asked }, go: [
        { ap: 'ask', say: 'What would Hearthlink mean, to you?', to: 'link' },
        { ap: 'ask', say: 'And if the rifts were sung shut?', to: 'shut' },
        { ap: 'comfort', say: 'Whatever happens, you have a home here.', to: 'home' },
      ] },
      link: { line: 'rift.dimr.link', go: [
        { ap: 'advise', say: 'Tell {riftHillFriend} that. In your own words.', to: 'speak', need: { if: { riftHillFriend: (x) => !!x } } },
        { ap: 'warm', say: 'Then I hope the village hears you.', to: 'home' },
      ] },
      shut: { line: 'rift.dimr.shut', go: [
        { ap: 'listen', say: '*You wait.*', label: 'Wait', to: 'torn' },
        { ap: 'comfort', say: 'Whatever happens, you have a home here.', to: 'home' },
      ] },
      torn: { line: 'rift.dimr.torn', fx: { trust: 0.03 }, go: [
        { ap: 'advise', say: 'Tell {riftHillFriend} that. In your own words.', to: 'speak', need: { if: { riftHillFriend: (x) => !!x } } },
        { ap: 'comfort', say: 'Whatever happens, you have a home here.', to: 'home' },
      ] },
      speak: { line: 'rift.dimr.speak', fx: { respect: 0.03, run: friendHears(0.1) }, end: true },
      home: { line: 'rift.dimr.home', fx: { trust: 0.03, fond: 0.02 }, end: true },
    },
  });
  lines('rift.dimr.open', [
    { text: ['The Moot, {name}. How are you bearing it?', 'Your city, {name}. Can you see it, through the rifts?'] },
  ]);
  lines('rift.dimr.start', [
    { text: ['I can see it through the rifts, some nights. Going dark. Window by window. Like someone walking through a house turning off lamps.', 'The Lamplighter\'s nearly out. Everyone I knew is in that dark.'] },
    { if: { temper: 'gloomy' }, text: ['Every night there\'s less of it. I count the lit windows. Last night I could count them.'] },
    { if: { temper: 'cheerful' }, text: ['I\'m trying to stay bright about it. It\'s hard to be bright about the dark.'] },
    { if: { temper: 'proud' }, text: ['I won\'t beg. It\'s not my place. But I\'ll stand at the Moot and say what\'s true.'] },
    { if: { temper: 'ornery' }, text: ['How am I bearing it? Badly. Thanks for asking. Nobody else does.'] },
    { if: { lost: (x) => !!x }, pri: 1, text: ['{Lost} might be in that dark. I look through every night. Every window. I don\'t know which is {lost}\'s.'] },
  ]);
  lines('rift.dimr.link', [
    { text: ['Both. Home and here. Go and visit, come back for supper. Letters. Do you know what that would mean?', 'It\'d mean the city sees stars. Neverdark, seeing stars. Your river, lighting our dark.'] },
    { if: { spouse: (s) => !!s }, text: ['I could take {spouse} home. Show {spouse} the night market. Then bring {spouse} back for second breakfast.'] },
    { if: { riftHomesick: 'home' }, text: ['I wouldn\'t go back to stay. But to visit. To tell them it\'s all right. That would mean everything.'] },
  ]);
  lines('rift.dimr.shut', [
    { text: ['Then this is home. For always. ...I\'ve made my peace with that. Mostly. Ask me at night.', 'Then the city goes on fading on its own. And we never know how it ends.'] },
    { if: { riftHomesick: 'home' }, text: ['Then I stay. I was going to anyway. I just... I\'d like to have chosen it.'] },
    { if: { riftHomesick: ['lost', 'homesick'] }, text: ['Then I\'ll never see it again. Never. That word\'s very big, wizard.'] },
  ]);
  lines('rift.dimr.torn', [
    { text: ['I don\'t want to ask you lot for anything. You\'ve given us so much. That\'s the trouble.', 'It\'s your river. Your wind. I can\'t ask. I want to ask.'] },
  ]);
  lines('rift.dimr.speak', [
    { text: ['{RiftHillFriend}. Okay. Not a speech. Just me, telling a friend what\'s on the other side. I can do that.', 'In my own words. Copy that. I\'ll go tonight.'] },
    { if: { temper: 'shy' }, text: ['...To {riftHillFriend}. Not the whole Moot. Just {riftHillFriend}. Okay. I can do one person.'] },
  ]);
  lines('rift.dimr.home', [{ text: ['A home here. Yeah. I know. I do know. Thank you.', 'Copy that. Whatever happens. ...Thanks, wizard.'] }]);

  // --- After the Moot -------------------------------------------------------------------
  addThread({
    id: 'rift.after', label: (F) => (F.riftFinale === 'hearthlink' ? 'The golden doors' : F.riftFinale === 'softclose' ? 'Now the rifts are closed' : 'The rifts, drifting'), weight: 1, cool: 6,
    when: (F) => !!F.riftFinale && F.stage !== 'child' && (F.rift || F.riftCount > 0),
    open: { ask: 'rift.after.open' },
    beats: {
      start: { line: 'rift.after.start', go: [
        { ap: 'ask', say: 'Was it the right choice, do you think?', to: 'right' },
        { ap: 'ask', say: 'What\'s changed, for you?', to: 'changed' },
        { ap: 'jest', say: 'rift.after.jest', label: 'Make light of it', to: 'jest' },
      ] },
      right: { line: 'rift.after.right', go: [
        { ap: 'ask', say: 'What\'s changed, for you?', to: 'changed' },
        { ap: 'warm', say: 'The valley chose with its heart. That\'s rare.', to: 'heart' },
      ] },
      changed: { line: 'rift.after.changed', go: [
        { ap: 'warm', say: 'The valley chose with its heart. That\'s rare.', to: 'heart' },
      ] },
      jest: { line: 'rift.after.jested', go: [
        { ap: 'ask', say: 'Truly, though. Was it right?', to: 'right' },
      ] },
      heart: { line: 'rift.after.heart', fx: { fond: 0.02 }, end: true },
    },
  });
  lines('rift.after.open', [
    { text: ['How does it sit with you, {name}, what the Moot decided?', 'The rifts, {name}. Has it settled, now it\'s decided?'] },
  ]);
  lines('rift.after.start', [
    { text: ['It\'s done. That\'s something. The waiting was the worst of it.'] },
    { if: { riftFinale: 'hearthlink' }, text: ['The golden doors! You can see right through. Visitors on Highdays. Letters from Neverdark. It\'s mad. It\'s wonderful.', 'Gold, now, not purple. Steady as a doorway. Somebody\'s granny came through yesterday for a scone.'] },
    { if: { riftFinale: 'softclose' }, text: ['The whole village sang on the Long Meadow and the sky closed, softly, like eyes going to sleep. I cried. Everyone cried.', 'Quiet skies again. I look up some nights and miss the purple. Is that daft?'] },
    { if: { riftFinale: 'drift' }, text: ['Nothing decided, and the rifts come and go as they please. Like weather. Like we never had a Moot.', 'We let it drift. I don\'t know if that was wise or just tired.'] },
    { if: { rift: true, riftFinale: 'hearthlink' }, pri: 1, text: ['I went home! For a day! Then I came back for second breakfast. Both, wizard. I have both.'] },
    { if: { rift: true, riftFinale: 'softclose' }, pri: 1, text: ['This is home now. For always. I sang them shut with everyone else. My voice cracked on the last note.'] },
  ]);
  lines('rift.after.jest', [
    { text: ['At least the scones are safe.'] },
    { if: { riftFinale: 'hearthlink' }, text: ['Two worlds and only one decent bakery between them.'] },
    { if: { riftFinale: 'softclose' }, text: ['No more strangers falling in the beans, then.'] },
  ]);
  lines('rift.after.jested', [
    { text: ['Ha! The scones are never safe. Not in this village.', 'Ha. Yes. That\'s the important thing, isn\'t it.'] },
    { if: { riftFinale: 'hearthlink' }, text: ['One bakery! The Neverdark folk queue round the green for it. The baker\'s never been so smug.'] },
    { if: { riftFinale: 'softclose' }, text: ['The beans have never been so safe. Or so dull.'] },
  ]);
  lines('rift.after.right', [
    { text: ['I think so. Ask me in ten years. Ask my grandchildren.', 'Right enough. There\'s no right in it, only kind and less kind. I think we were kind.'] },
    { if: { riftFinale: 'hearthlink' }, text: ['Right? We lent a city our river and it saw stars. I\'ll be telling that one when I\'m a hundred.'] },
    { if: { riftFinale: 'softclose' }, text: ['It was gentle. That\'s the best I can say. Gentle, and final.'] },
    { if: { riftFinale: 'drift' }, text: ['Right? We didn\'t choose. That\'s a choice too. Not a brave one.'] },
  ]);
  lines('rift.after.changed', [
    { text: ['Not much, day to day. The kettle still boils. That\'s a comfort.', 'I sleep better. Mostly.'] },
    { if: { riftFinale: 'hearthlink' }, text: ['There\'s a woman from Neverdark who comes through to buy my eggs. She pays in little glowing coins. I keep them in a jar.'] },
    { if: { riftFinale: 'softclose' }, text: ['The rift-folk have stopped looking up. That\'s the change. They look at us now.'] },
    { if: { rift: true }, text: ['I stopped waiting. That\'s what changed. I didn\'t know how much of me was waiting.'] },
  ]);
  lines('rift.after.heart', [{ text: ['With its heart. Yes. It\'s a big heart, this valley. Bigger than it looks.', 'Rare. Hm. We\'re a rare sort of village, I suppose.'] }]);

  // --- Every temper, every beat: more ways of saying it ------------------------------------
  const byTemper = (key, o) => lines(key, Object.keys(o).map((temper) => ({ if: { temper }, text: o[temper] })));
  byTemper('rift.sky.start', {
    cheerful: ["Oh, they're thrilling! Every time one opens I run to look! I've not missed one!", "Lovely and strange! Purple and humming! Like a party in the sky!"],
    proud: ["I've watched every one from my step. I'm not one for running about gawping.", "I'm not afraid of them. Someone has to keep a level head."],
  });
  byTemper('rift.sky.theory', {
    cheerful: ["A door to somewhere marvellous! That's my theory! Probably full of cake!", "Presents! The sky's giving us new neighbours! That's how I see it!"],
    shy: ["...I think someone's lonely. On the other side.", "...Doors, maybe. I don't like to say."],
    proud: ["I've thought about it longer than most. They're doors. Built doors. Somebody made them.", "Weather, the fools say. They're not weather. Anyone with eyes can see."],
  });
  byTemper('rift.sky.darn', {
    cheerful: ["Ha! Yes! A great big patch! In purple!", "I'll knit it! I'll knit the sky a scarf!"],
    shy: ["*laughs quietly* With a very long needle.", "Ha. That's silly. Nice silly."],
    curious: ["Darn it! With what thread, though? Light? Is that possible?", "Ha! Actually, could it be stitched? What's it made of?"],
    dreamy: ["Darning the sky with moonbeams. That's a lovely idea.", "Little stitches of starlight. Yes."],
    witty: ["Darning. Finally, a job for the knitting circle worthy of their talents.", "The sky's got a ladder in its stocking. Embarrassing."],
    proud: ["I'm a fine darner. Just saying.", "If anyone could, it'd be the women of this lane."],
    gloomy: ["Some holes can't be darned.", "Ha. If only."],
  });
  byTemper('rift.sky.afraid', {
    cheerful: ["A bit! But it's a fun frightened! Like a ghost story!", "Not really! Excited, mostly!"],
    ornery: ["Frightened? No. Annoyed. They keep me up.", "I'm not frightened of anything. Except the miller's dog."],
    shy: ["...Yes. I hide under the blanket when they hum.", "...A bit. Every time."],
    curious: ["Frightened? No. I want to understand them. Fear just gets in the way.", "Only of not knowing what they are."],
    dreamy: ["Not frightened. Awed. Like standing at the edge of the sea.", "They're too beautiful to be afraid of. Mostly."],
    witty: ["Frightened? I've met my mother-in-law. A hole in the sky's nothing.", "Only when they open over the privy."],
    gloomy: ["Yes. They feel like an ending.", "A bit. They don't feel like good news."],
  });
  byTemper('rift.sky.stop', {
    cheerful: ["Miss them? Yes! But then I'd have more time for parties!", "I'd miss them so much! They're exciting!"],
    ornery: ["Miss them? I'd sleep. That's what I'd do.", "I'd miss complaining about them."],
    shy: ["...I'd miss them a little. They're pretty.", "...I don't know."],
    curious: ["I'd miss the mystery. Even if I'd never solved it.", "Yes. They're the most interesting thing to happen here in centuries."],
    dreamy: ["I'd miss them like I miss summer in winter.", "I'd miss the purple glow on the ceiling."],
    witty: ["I'd miss having something to blame for the weather.", "Miss them? I'd have to find new gossip."],
    proud: ["I'd carry on. The valley carries on.", "I don't miss things. I remember them."],
    gloomy: ["I'd miss them. Things that bring people shouldn't stop.", "Maybe. Everything ends."],
  });
  byTemper('rift.sky.tale', {
    cheerful: ["A hobbit taken by lightning! Oh, that's thrilling! What happened?", "Green lightning! Ooh! Tell me more!"],
    ornery: ["Taken by lightning. Hm. Probably deserved it.", "So it's happened before. Typical."],
    shy: ["...Taken away? That's frightening.", "...Did they ever come back?"],
    curious: ["A precedent! Where? When? Was it the same place?", "That changes everything! The rifts aren't new!"],
    dreamy: ["Taken by lightning. Like a story. Maybe they went somewhere wonderful.", "Green lightning... like a door made of light."],
    witty: ["Taken by lightning. Always read the weather report.", "A hobbit in a rift. Bet he forgot his umbrella."],
    proud: ["I've always said there was more to the old tales.", "My family remembered that story. I knew it mattered."],
    gloomy: ["Taken. And never came back. That's the tale, isn't it.", "So it takes people. Both ways."],
  });
  byTemper('rift.sky.doors', {
    cheerful: ["Knocking! Then let's answer! With cake!", "Doors! Yes! Visitors!"],
    shy: ["...Someone knocking. That's less frightening.", "*nods slowly*"],
    curious: ["Doors. Then who's knocking? And why here?", "Doors make sense. They open, things come through."],
    dreamy: ["Doors in the sky, and someone on the other side, hoping.", "Knocking softly. Yes."],
    witty: ["Doors. And we never lock ours. Typical hobbits.", "Knocking. I'll put the kettle on."],
    proud: ["Then we'll answer properly. As hosts should.", "Doors. And we're good neighbours."],
    gloomy: ["Knocking. And what if they stop knocking?", "Doors. I hope they're not closing."],
  });
  byTemper('rift.sky.comforted', {
    cheerful: ["No harm! You're right! Lots of good, actually!", "Yes! They've been lovely!"],
    ornery: ["No harm. Yet. ...Fine. No harm.", "Hm. True. Mostly noise."],
    shy: ["...That's true. Thank you.", "*relaxes a little*"],
    curious: ["True. Statistically, they've been entirely benign.", "No harm. Good data point."],
    dreamy: ["No harm. Just people looking for somewhere soft.", "That's comforting."],
    witty: ["No harm. Unless you count the noodles. I don't.", "No harm. Just a lot of neon."],
    proud: ["I wasn't really frightened.", "No. And there won't be."],
    gloomy: ["No harm. Yet.", "I hope that stays true."],
  });
  byTemper('rift.seek.start', {
    ornery: ["Every night. The miller complains. The frequency doesn't care.", "Yes. And don't tell me to give up."],
    dreamy: ["Every night. We listen to the scar like it's a heartbeat.", "The hum's like a song half remembered. We're trying to finish it."],
    witty: ["Every night. Our social life is a hole in the ground with a hum.", "Yes. It's a very exclusive club. Membership: homesick."],
  });
  byTemper('rift.seek.close', {
    cheerful: ["Close! So close! We're nearly there!", "Closer every night! It's exciting!"],
    ornery: ["Close. It keeps slipping. Infuriating.", "Close enough to be annoyed."],
    shy: ["...Close. I think. I don't know.", "...Closer."],
    curious: ["Closer! The variance is narrowing! A week, maybe!", "We've got two of three harmonics. The third's elusive."],
    dreamy: ["Like a word on the tip of your tongue.", "Close. Like dawn. You can feel it coming."],
    witty: ["Close. Like a sneeze that won't happen.", "Close enough to start packing. Not close enough to finish."],
    proud: ["Close. I'll be the one to crack it.", "Very close. Thanks to me, mostly."],
    gloomy: ["Close. That's the problem.", "Closer than I'd like, some nights."],
  });
  byTemper('rift.seek.ifind', {
    cheerful: ["Then I go home for a visit! And come back! Both!", "Then I'll be so happy! And so sad! Both!"],
    ornery: ["Then I go and shout at whoever let the city fall apart. Then I decide.", "Don't. I don't want to think about it."],
    shy: ["...I don't know. I really don't.", "...I'd stand there a long time."],
    curious: ["Then we'd know it can be done. That's the main thing.", "Then the real question starts."],
    dreamy: ["Then I look through, and see the lights, and decide.", "Then I stand in the doorway, half and half."],
    witty: ["Then I find out if anyone kept my flat.", "Then I find out if the noodle stall's still open."],
    proud: ["Then I make my choice. And I stand by it.", "Then I choose. Clearly."],
    gloomy: ["Then I have to choose. That's the worst part.", "Then I lose something either way."],
  });
  byTemper('rift.seek.sleep', {
    cheerful: ["Sleep! Yes! Okay! One night!", "Ha! You're right! I'll sleep tonight!"],
    ornery: ["Sleep. Fine. If it'll stop you nagging.", "Doors wait. Hm. Do they, though?"],
    shy: ["...Okay. I'll try.", "*nods*"],
    curious: ["Sleep. Yes. Rested minds solve problems faster.", "Fair. I'll run better calculations tomorrow."],
    dreamy: ["Maybe I'll dream the frequency.", "Sleep. And dream of the door."],
    witty: ["Sleep. What a revolutionary concept.", "I'll sleep when the sky closes."],
    proud: ["I don't need much sleep. But I'll take some.", "Fine. One night."],
    gloomy: ["Sleep. I don't sleep much anyway.", "I'll try."],
  });
  byTemper('rift.seek.torn', {
    cheerful: ["...Even I don't know if I want it to work.", "...Some nights I hope we fail. Then I feel awful."],
    ornery: ["...Don't repeat that.", "...I don't know what I want. There. Happy?"],
    shy: ["...Please don't tell anyone.", "...I'm scared it'll work."],
    curious: ["...It's an unsolvable problem. Not the frequency. Me.", "...My data's good. My heart isn't."],
    dreamy: ["...Some nights I just listen and forget to measure.", "...I listen more than I tune."],
    witty: ["...I'm a very slow genius, on purpose.", "...If I find it, I have to decide. So I'm very bad at finding."],
    proud: ["...I'll find it. And then decide. I'm not afraid.", "...I'm working on it. Properly."],
    gloomy: ["...If it opens, I lose. If it doesn't, I lose.", "...I don't know any more."],
  });
  byTemper('rift.seek.miller', {
    cheerful: ["The miller! Yes! I'll ask!", "Brilliant! Threes!"],
    ornery: ["The miller. Fine. If he's in a good mood.", "Hm. Maybe."],
    shy: ["...The miller. I'll try.", "...Okay."],
    curious: ["The wheel's rhythm! Why didn't I think of that!", "Yes! The gearing ratio! It's threes!"],
    dreamy: ["The river's song. Yes. It might know.", "I'll listen to the wheel."],
    witty: ["The miller. Secret genius of the valley.", "Millers love explaining. I love listening. Perfect."],
    proud: ["I was going to try that next.", "Good idea. I'll go."],
    gloomy: ["Maybe. It's worth a try.", "All right."],
  });
  byTemper('rift.seek.light', {
    cheerful: ["A light on! Yes! I'll look for it!", "Thank you! Thank you!"],
    ornery: ["A light. Hm. I'll know which window.", "Fine. Keep it lit."],
    shy: ["...Thank you.", "*a long breath out*"],
    curious: ["A light. I'll remember which.", "Noted."],
    dreamy: ["A light in the window. Like the songs.", "I'll look for it every night."],
    witty: ["A light on. Mind the moths.", "I'll look for it. Don't let the candle go out."],
    proud: ["Thank you. I won't forget it.", "I'll come back. You'll see."],
    gloomy: ["...Thank you. That helps.", "A light on. Okay."],
  });
  byTemper('rift.mungo.start', {
    cheerful: ["Mungo Fernsby! Our very own! I'm so proud and I didn't even know him!", "A hobbit founded a city! On the other side of the sky! Isn't that marvellous?"],
    shy: ["...I read the ledger. Mungo. He sounds nice.", "...A tinker from here. It's strange to think."],
    proud: ["A Thistledown tinker. Founded a city. Of course he did. We're that sort of valley.", "Mungo. One of ours. I always said we were made for great things."],
  });
  byTemper('rift.mungo.say', {
    cheerful: ["That he was lovely! Always fixing things for people!", "That he was clever and kind! A good hobbit!"],
    ornery: ["That he couldn't leave things alone. Typical tinker.", "That he was a nuisance. A clever nuisance."],
    shy: ["...That he was quiet. Like me.", "...That he liked storms."],
    curious: ["That he asked questions nobody could answer. A kindred spirit.", "That he wanted to catch lightning. And he did."],
    dreamy: ["That he talked to the weather. And the weather listened.", "That he dreamed of lights in the dark."],
    witty: ["That he was always late. Still is, by several centuries.", "That he borrowed things. And never returned them. Including himself."],
    proud: ["That he was the finest tinker of his day.", "That he was a credit to the valley."],
    gloomy: ["That he was lonely. Too clever to fit in.", "That nobody understood him."],
  });
  byTemper('rift.mungo.debt', {
    cheerful: ["Ha! Threepence! I'll pay it! For Mungo!", "Somebody pay the man's tab! I'll start a collection!"],
    ornery: ["Threepence. Typical. Never pay your debts, found a city instead.", "Hm. Someone should pay it."],
    shy: ["*giggles* Threepence.", "...That's funny."],
    curious: ["Threepence at the Crooked Kettle. Adjusted for inflation, that's... a lot of noodles.", "Interesting. A financial record of a world-founder."],
    dreamy: ["Threepence. The price of a city.", "He'll come back for it one day."],
    proud: ["I'll pay it. For the honour of the valley.", "His debt is our debt. I'll see to it."],
    gloomy: ["He never came back to pay it. Poor man.", "Threepence. And a city. And a lot of lost people."],
  });
  byTemper('rift.mungo.meant', {
    cheerful: ["Meant to? I think he was excited! An adventure!", "He meant to see something wonderful! And he did!"],
    ornery: ["Meant to? Nobody means to walk into lightning. Daft.", "He meant to be clever. Look where it got him."],
    shy: ["...I don't think he meant to stay.", "...I hope he wasn't frightened."],
    curious: ["He meant to catch it. He'd been studying it. A scientist.", "I think it was an experiment. That worked too well."],
    witty: ["Meant to? He took a kettle. That's either planning or tea.", "He meant to find out. Tinkers always do."],
    proud: ["He meant to. A Thistledown hobbit doesn't do things by accident.", "He knew what he was doing."],
    gloomy: ["He meant to come back. They all mean to.", "He meant to see. Not to stay. Never to stay."],
  });
  byTemper('rift.mungo.jar', {
    cheerful: ["You knew him! Oh! What was he like? Was he nice?", "You laughed! Oh, wizard! But you remember!"],
    ornery: ["You laughed at him. And look what he did. Serves you right.", "Hm. You should have listened."],
    shy: ["...You knew him. Oh. Did he have friends?", "...That's sad. And lovely."],
    curious: ["You knew him personally! What did he ask exactly? What did he build?", "Lightning in a jar! He was decades ahead!"],
    dreamy: ["You laughed, and he went anyway. And lit a city. Oh.", "He caught his lightning. In the end."],
    witty: ["You laughed at the founder of a civilisation. Bold career move.", "Lightning in a jar. You owe him an apology. Several centuries late."],
    proud: ["You knew him. Then you know what our valley can produce.", "He proved you wrong. That's very Thistledown."],
    gloomy: ["You laughed. And he went alone. Oh, wizard.", "I wish someone had listened to him."],
  });
  byTemper('rift.mungo.kin', {
    cheerful: ["Kin! They're family! I'll bake them a pie! All of them!", "Kin! Oh, that's wonderful! Cousins!"],
    shy: ["...Kin. Oh. That's nice.", "...Then they're not strangers."],
    curious: ["Kin! Genealogically fascinating! Could we trace it?", "Kin across worlds! The first such family tree!"],
    dreamy: ["Kin. Coming home after a very long journey.", "Mungo's children's children. Home at last."],
    witty: ["Kin. So now I have to invite them to the reunion.", "Kin. And they eat like us. Of course they do."],
    proud: ["Kin. Then they're Thistledown folk. And we look after our own.", "Our kin. We'll do right by them."],
    gloomy: ["Kin. And we treated them like strangers. Shame on us.", "Kin, lost a long time. Like Mungo."],
  });
  byTemper('rift.dim.start', {
    cheerful: ["Oh, I don't know! Both choices are sad! I hate sad choices!", "I keep changing my mind! Every hour! It's exhausting!"],
    shy: ["...I don't know. I'll do what everyone else does. Probably.", "...I'm scared to choose."],
    curious: ["I've been weighing it. The costs, the benefits, the unknowns. Mostly the unknowns.", "I want to know more before I decide. What would it really mean?"],
    dreamy: ["I keep imagining both. Golden doors. Or a sky healing over. Both beautiful. Both sad.", "I dream about it every night."],
    witty: ["Where do I stand? Somewhere between the bar and the door.", "I'm firmly undecided. Very firmly."],
    gloomy: ["It's a sad choice either way. I hate it.", "I don't know. I don't think there's a right answer."],
  });
  byTemper('rift.dim.weigh', {
    cheerful: ["The parties we'd have with visitors! But also, the cost. Mostly the parties!", "Making everyone happy! That's what weighs!"],
    ornery: ["What weighs? Being told what to think by everyone. That's what.", "Not being made a fool of."],
    shy: ["...Not upsetting anyone.", "...My friends. What they'd want."],
    curious: ["The unknown. What happens next, either way? Nobody knows.", "The long-term effects. Nobody's thought about them."],
    dreamy: ["Whether we can be kind to two worlds at once.", "The children, on both sides of the sky."],
    witty: ["Whether the Badger stays open late either way.", "Whether I can live with myself. And the neighbours."],
    proud: ["Doing what's right. Not what's easy.", "The village's honour. We'll be remembered for this."],
    gloomy: ["Someone loses either way. That weighs.", "The ones we can't help."],
  });
  byTemper('rift.dim.tale', {
    cheerful: ["Oh! That's a lovely story! It makes it easier!", "Children! Sent here! Oh, we must help!"],
    shy: ["...That's a sad story. And a kind one.", "*eyes go wet*"],
    curious: ["A lamp sending its children to safety. That's a coherent theory. It fits the clues.", "That explains a great deal. The lullaby, the kettle."],
    dreamy: ["A lamp in the dark, sending its children away. Like a lullaby.", "That's the most beautiful thing I've heard."],
    witty: ["You tell a mean story, wizard. I'll give you that.", "A tear-jerker. Unfair tactics."],
    proud: ["A good story. But I'll make up my own mind.", "Then our duty's clear."],
    gloomy: ["And the lamp's dying alone. Oh, that's terrible.", "That's sad. So very sad."],
  });
  byTemper('rift.dim.think', {
    cheerful: ["Both choices have something good! That's nice, isn't it?", "If we lend the river, everyone's happy! Mostly! Maybe!"],
    ornery: ["It's a lot to decide. I don't like being rushed.", "Either way, someone'll moan. Probably me."],
    dreamy: ["If the doors stay open, we'd have two skies. If they close, one quiet one.", "I keep picturing the Lamplighter. Alone. In the dark."],
    witty: ["If we lend the river, who gets the fish?", "Closing the sky sounds very final. I don't do final before tea."],
    proud: ["I'll decide what's right for the village. And I'll stand by it.", "Whatever I decide, I'll stand up and say it."],
  });
  byTemper('rift.dim.moved', {
    ornery: ["Hm. ...You've a point. Don't tell anyone you won.", "Fine. Hearthlink. But I'm still cross about it."],
    curious: ["The logic holds. Water going by anyway. I'm persuaded.", "Yes. The cost is low. The benefit is enormous."],
    witty: ["You've talked me round. I'll deny it at the Moot.", "Fine. Hearthlink. For the visitors' gossip alone."],
    proud: ["I was leaning that way. You've confirmed it.", "Yes. That's right. I'll say so."],
    gloomy: ["Maybe. A lamp kept lit. That's better than darkness.", "If it helps. Yes."],
  });
  byTemper('rift.dim.unmoved', {
    cheerful: ["Oh! I don't like being told! Even nicely!", "I'll decide myself, thank you! Kindly!"],
    shy: ["...I'd rather decide on my own.", "...Please don't push."],
    curious: ["You're making an argument. I'd like to hear the other side too.", "Not convinced yet. I need more."],
    dreamy: ["I need to think on my own. Under the stars.", "I'll decide in my own time."],
    witty: ["A wizard lecture. My favourite. Not.", "Persuasion noted. Ignored."],
    gloomy: ["I'll think about it. I'm not sure.", "Nothing's that simple."],
  });
  byTemper('rift.dim.moved2', {
    cheerful: ["Closed softly. Yes. Gently. That's nice.", "Let the sky heal! And everyone stays! That's happy!"],
    ornery: ["Close it. Finally, someone with sense.", "Yes. Shut it. Softly. Then quiet."],
    shy: ["...Close it gently. Yes.", "*nods*"],
    curious: ["A soft close has fewer unknowns. That's a strong argument.", "Less risk. I see that."],
    dreamy: ["Close it softly, like eyes going to sleep.", "Let the sky mend. Like a healing wound."],
    witty: ["Close the door. Gently. Then lock it. Then have tea.", "Shut it softly. Before something else falls out."],
    proud: ["Close it. That's the responsible choice.", "Yes. Protect what we have."],
  });
  byTemper('rift.dim.unmoved2', {
    cheerful: ["Close it? No! What about their families? No, no, no!", "No! I want visitors!"],
    ornery: ["Close it? And look away while a city dies? Not me.", "No. That's cowardly."],
    shy: ["...No. I couldn't.", "...That feels wrong."],
    curious: ["Close it? We'd never learn what's on the other side.", "No. Too much would be lost."],
    dreamy: ["Close it? And leave the Lamplighter in the dark? No.", "No. Doors should stay open."],
    witty: ["Close it? And miss the most interesting thing that's ever happened here? No.", "No. I like interesting."],
    proud: ["No. That's not who we are.", "We don't turn our backs."],
    gloomy: ["Close it, and they're stuck in the dark forever. No.", "No. That's too sad."],
  });
  byTemper('rift.dim.friendask', {
    cheerful: ["I'd do anything {riftFriend} asked! That's what friends are for!", "I'd listen! {RiftFriend}'s my best friend!"],
    ornery: ["{RiftFriend} wouldn't ask. And if {riftFriend} did, I'd... think about it.", "Hm. That's unfair."],
    shy: ["...I'd do what {riftFriend} wanted.", "...{RiftFriend} matters more than a vote."],
    curious: ["Interesting. Would I prioritise friendship over judgement? ...Yes.", "That's a real question. I'd listen."],
    dreamy: ["I'd listen to {riftFriend}. Always.", "For {riftFriend}, anything."],
    witty: ["{RiftFriend} would bribe me with pie. It'd work.", "Then I'd be in trouble."],
    gloomy: ["I'd vote how {riftFriend} wanted. Even if it hurt.", "Then I'd have no choice."],
  });
  byTemper('rift.dim.hold', {
    cheerful: ["The village will hold! Of course it will! We always do!", "Thank you! I feel better!"],
    ornery: ["The village will hold. If it doesn't, I'll hold it.", "Hm. Good."],
    shy: ["...Thank you. I needed that.", "*breathes out*"],
    curious: ["The village will hold. That's been true for centuries. Good point.", "Resilience. Yes."],
    dreamy: ["Like a tree in a storm. Yes.", "That's comforting."],
    witty: ["The village will hold. With tea.", "It'll hold. It's held through worse cooking."],
    proud: ["It will. We're Thistledown.", "Of course it will."],
  });
  byTemper('rift.dimr.start', {
    shy: ["...I try not to look. I look anyway.", "...It's hard. I don't talk about it."],
    curious: ["I've been counting lights through the rifts. Fewer every night. I can graph it.", "The decline's accelerating. I've measured it."],
    dreamy: ["Through the rift I see the clouds going grey. They used to be gold.", "The city's going to sleep. Forever, maybe."],
    witty: ["Badly. Watching your home dim through a hole in the sky isn't a hobby I'd recommend.", "The city's on its last bar."],
  });
  byTemper('rift.dimr.link', {
    cheerful: ["Everything! Visits! Letters! I'd see my mum!", "Both worlds! Golden doors! It'd be wonderful!"],
    ornery: ["It'd mean not having to choose. That's all I want.", "It'd mean the city doesn't die. Isn't that enough?"],
    shy: ["...It'd mean I could say goodbye properly. Or hello.", "...Everything."],
    curious: ["A stable connection between worlds! Imagine what we'd learn!", "It'd mean the Lamplighter could be studied. Maybe saved."],
    dreamy: ["Neverdark would see stars. Stars! For the first time.", "Two homes, with a door between them."],
    witty: ["I could finally get my deposit back on the flat.", "Trade! Your scones for our noodles!"],
    proud: ["It'd mean we didn't abandon our city.", "It'd mean we kept faith."],
    gloomy: ["It'd mean maybe the dark stops. Maybe.", "Hope. It'd mean hope."],
  });
  byTemper('rift.dimr.shut', {
    cheerful: ["Then this is home! And it's a lovely home! ...But I'd still miss it.", "Then I'll be a hobbit forever! That's not so bad!"],
    ornery: ["Then that's that. I'll cope. I always cope.", "Shut. Fine. Don't make me talk about it."],
    shy: ["...Then I'd stay. I'd cry. Then stay.", "...I don't know."],
    curious: ["Then we'd never know what happens to the city. That's hard.", "Then all my research ends."],
    dreamy: ["Then the city becomes a dream. Just a dream.", "Then I sing it shut with everyone. And let it go."],
    witty: ["Then I'll be the only person in the valley who misses neon.", "Shut. No refunds."],
    proud: ["Then I'll make this home the best it can be.", "Then I'll be a Thistledowner. Properly."],
    gloomy: ["Then that's the end. Of everything I was.", "Then the city goes dark and I never know."],
  });
  byTemper('rift.dimr.torn', {
    cheerful: ["I want to ask but I don't want to be rude! It's horrible!", "You've all been so kind!"],
    ornery: ["I won't beg. I won't.", "It's not mine to ask."],
    shy: ["...I can't ask. I just can't.", "*shakes head*"],
    curious: ["The ethics are complicated. Asking for your river.", "I understand both sides. That's the problem."],
    dreamy: ["It's like asking someone to share their sunlight.", "Your river's so lovely. I can't ask for it."],
    witty: ["Asking hobbits for their river is like asking for their pantry key.", "It feels rude. And I'm usually very rude."],
    proud: ["I'm too proud to ask. I know it.", "We'll manage. We always have."],
    gloomy: ["You've given so much. Asking for more feels wrong.", "I don't want to be a burden."],
  });
  byTemper('rift.dimr.speak', {
    cheerful: ["Yes! I'll tell {riftHillFriend} everything!", "In my own words! Okay! I can do that!"],
    ornery: ["Fine. One friend. No speeches.", "Hm. I'll tell {riftHillFriend}. Plainly."],
    curious: ["One person at a time. A sound strategy.", "I'll explain it clearly. Facts and feelings."],
    dreamy: ["I'll tell {riftHillFriend} at dusk. When the city's lights show through.", "I'll tell it like a story."],
    witty: ["One friend. Then the Badger. Then the world.", "My own words. I've got plenty."],
    proud: ["I'll speak plainly. I've nothing to hide.", "I'll tell {riftHillFriend}. With dignity."],
    gloomy: ["I'll try. It might not change anything.", "Okay. One person."],
  });
  byTemper('rift.dimr.home', {
    cheerful: ["A home here! Yes! I know! Thank you!", "Thank you! That helps so much!"],
    ornery: ["I know. ...Thanks.", "Hm. Good."],
    shy: ["...Thank you.", "*nods, eyes bright*"],
    curious: ["A home here. That's the constant in all this.", "Yes. That's certain, at least."],
    dreamy: ["A home here. Like a lamp in the window.", "I'll hold onto that."],
    witty: ["A home here. And second breakfast. The essentials.", "A home. With a round door. Okay."],
    proud: ["I know. I've built it.", "Thank you. I have."],
    gloomy: ["A home here. ...Yes. I'll try to remember.", "Okay. Thank you."],
  });
  byTemper('rift.after.start', {
    cheerful: ["It's done! And everyone's still friends! That's the best part!", "We decided! Together! I'm so proud of us!"],
    ornery: ["It's done. Took long enough.", "Decided. Finally. Now everyone can stop talking about it."],
    shy: ["...It's settled. I'm glad it's settled.", "...It's quieter now."],
    curious: ["It's done. Now we see what happens. That's the exciting part.", "Decided. Now the results."],
    dreamy: ["It feels like waking after a long night.", "It's done. Like a song ending."],
    witty: ["Decided. Now we can argue about something else.", "Done. Time for a drink."],
    proud: ["We decided well. I'm proud of the village.", "We chose. As a village should."],
    gloomy: ["It's done. I don't know how I feel.", "Decided. And something's lost either way."],
  });
  byTemper('rift.after.jested', {
    cheerful: ["Ha! The scones! Always the scones!", "Ha! Yes! Most important thing!"],
    ornery: ["Hmph. The scones were never in danger.", "Ha. Very funny."],
    shy: ["*laughs* The scones.", "Ha."],
    curious: ["The scones. Actually, scone exports were a factor in some votes.", "Ha! I did hear that argument at the Moot."],
    dreamy: ["Ha. The scones will outlast us all.", "Safe scones. Safe valley."],
    witty: ["The scones survive all. Like cockroaches, but delicious.", "Priorities. Scones first."],
    proud: ["The scones are always safe. Our baking is legendary.", "Ha. Naturally."],
    gloomy: ["Ha. At least something's certain.", "The scones. Yes."],
  });
  byTemper('rift.after.right', {
    cheerful: ["Right! Definitely! I think! Yes!", "The right choice! I'm sure! Mostly!"],
    ornery: ["Right? It's done. Right doesn't come into it now.", "It was the choice. Leave it."],
    shy: ["...I hope so.", "...I think so."],
    curious: ["Time will tell. Ask me in a year. I'll have data.", "Right is hard to measure. Kind is easier."],
    dreamy: ["It felt right. Like the end of a long song.", "Right in the heart. That counts."],
    witty: ["Right? I'll tell you after the next harvest.", "Right enough. Nobody's set fire to anything."],
    proud: ["It was right. The village chose well.", "Yes. And I'll say so to anyone."],
    gloomy: ["Right? There was no right. Only less wrong.", "I hope so. I don't know."],
  });
  byTemper('rift.after.changed', {
    cheerful: ["Everything's lovelier! Or the same and lovely!", "I sleep better and I eat more! Perfect!"],
    ornery: ["Nothing. Which is how I like it.", "Less arguing at the Badger. Small mercies."],
    shy: ["...It's calmer. I like calmer.", "...Not much. Quieter."],
    curious: ["Lots! I'm tracking the changes. Trade, mood, sleep patterns.", "The rift-folk stopped looking at the sky. That's the biggest change."],
    dreamy: ["The sky feels different. Settled.", "The nights feel softer."],
    witty: ["The Relay's less dramatic. Pity.", "I've had to find a new topic for complaining."],
    proud: ["The village is stronger. We came through.", "We're more of a village now."],
    gloomy: ["Something's gone. Or come. I'm still working it out.", "Not much. Some things never change."],
  });
  byTemper('rift.after.heart', {
    cheerful: ["With its heart! Yes! The biggest heart!", "A big heart! I love this valley!"],
    ornery: ["Heart. Hm. And a lot of shouting.", "Its heart and its stubbornness."],
    shy: ["...That's nice.", "*smiles*"],
    curious: ["Heart over head. Interesting. It worked.", "Rare. Yes. Most places choose with their purse."],
    dreamy: ["With its heart. Like a song.", "That's the loveliest thing."],
    witty: ["With its heart. And its stomach.", "Heart, then pudding."],
    proud: ["Of course. That's Thistledown.", "We always do."],
    gloomy: ["Its heart. Hearts break, though.", "I hope the heart was right."],
  });
});
