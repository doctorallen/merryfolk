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
});
