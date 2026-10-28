'use strict';
// ---------------------------------------------------------------------------
// The hill-folk on the rift-folk: wary elders and curious youngsters, friends
// made across the lane, the neighbors who've taken up rift ways (and what
// their grannies say), supper with a stranger at the table, the machines
// humming by the river, that Relay, the old days before the sky tore, and the
// questions the children bring the wizard. A kind word here can soften a
// wary hobbit (as a kind post on the Relay does), send someone off to say
// good morning to a rift-born neighbor, or set a supper; a child's answer
// leans them hill or rift. Reads the facts set in talk/rift.js.
// ---------------------------------------------------------------------------

talkPack('rift3', () => {
  const softenSelf = (amt) => (T, v) => { if (typeof relay !== 'function') return; const r = relay(); const s = r.soft || (r.soft = {}); s[v.id] = Math.min(0.6, (s[v.id] || 0) + amt); };
  const natterWith = (key) => (T, v) => { const n = T.F[key]; const o = n && Game.villagers.find((x) => x.first === n && x !== v && !x.leaving); if (o && ACTIONS.chat) v.queue.push({ a: { ...ACTIONS.chat, target: () => ({ other: o }) } }); };
  const heardIt = (lean) => (T, v) => { if (typeof heard === 'function' && v.isGrown()) heard(v, lean); };
  const both = (...fns) => (T, v) => { for (const f of fns) f(T, v); };
  // the wizard arranges a supper: the rift-born neighbor is asked round
  const askToSupper = (T, v) => {
    const n = T.F.riftNeighbor, o = n && Game.villagers.find((x) => x.first === n && x.isRiftborn() && x.isGrown());
    if (!o || v.homeId < 0 || !ACTIONS.supper_guest || o.queue.some((q) => q.a.id === 'supper_guest')) return;
    o.queue.push({ a: ACTIONS.supper_guest, extra: { home: v.home(), host: v } });
  };
  const hill = (F) => !F.rift && F.riftCount > 0;
  const nudgeBoth = (T, v) => { if (typeof nudgeUp === 'function' && v.isChild()) { nudgeUp(v, 'hill', 0.03, 'the wizard said both were right'); nudgeUp(v, 'rift', 0.03, 'the wizard said both were right'); } };

  // --- What do you make of the rift-folk? -------------------------------------------------
  addThread({
    id: 'rift.hill.folk', label: 'What do you make of the rift-folk?', weight: 1.1, cool: 4,
    when: (F) => hill(F) && F.stage !== 'child',
    rel: (F) => (F.riftWary === 'much' ? 1.8 : F.riftWary === 'some' ? 1.4 : F.riftFriend ? 1.2 : 0.8),
    open: { ask: 'rift.hill.folk.open' },
    beats: {
      start: { line: 'rift.hill.folk.start', go: [
        { ap: 'ask', say: 'What is it about them, exactly?', to: [{ to: 'fear', need: { if: { riftWary: ['some', 'much'] } } }, 'like'] },
        { ap: 'ask', say: 'Have you spoken to any of them?', to: [{ to: 'friend', need: { if: { riftFriend: (x) => !!x } } }, 'notspoken'] },
        { ap: 'jest', say: 'They say the same about us, you know. The feet, mostly.', to: 'feet' },
      ] },
      fear: { line: 'rift.hill.folk.fear', go: [
        { ap: 'listen', say: '*You let them say it all.*', label: 'Let them say it all', to: 'vent' },
        { ap: 'advise', say: 'Go and say good morning to {riftNeighbor}. Just that.', to: 'hello', need: { if: { riftNeighbor: (x) => !!x } } },
        { ap: 'tale', say: 'I think they\'re children sent somewhere safe.', to: 'children', need: { if: { riftClues: { min: 2 } } }, soft: true },
      ] },
      like: { line: 'rift.hill.folk.like', go: [
        { ap: 'warm', say: 'Then they\'re lucky to have a neighbor like you.', to: 'glad' },
        { ap: 'ask', say: 'And the rest of the lane? Do they agree?', to: 'others' },
      ] },
      friend: { line: 'rift.hill.folk.friend', go: [
        { ap: 'ask', say: 'How did you and {riftFriend} meet?', to: 'met' },
        { ap: 'ask', say: 'Do you ever worry {riftFriend} might go home?', to: 'worry', need: { open: 1 }, soft: true },
      ] },
      notspoken: { line: 'rift.hill.folk.notspoken', go: [
        { ap: 'advise', say: 'Go and say good morning to {riftNeighbor}. Just that.', to: 'hello', need: { if: { riftNeighbor: (x) => !!x } } },
        { ap: 'ask', say: 'What would you say to one, if you did?', to: 'whatsay' },
      ] },
      feet: { line: 'rift.hill.folk.feet', fx: { fond: 0.01 }, go: [
        { ap: 'ask', say: 'Have you spoken to any of them?', to: [{ to: 'friend', need: { if: { riftFriend: (x) => !!x } } }, 'notspoken'] },
        { ap: 'ask', say: 'But truly, what do you make of them?', to: [{ to: 'fear', need: { if: { riftWary: ['some', 'much'] } } }, 'like'] },
      ] },
      vent: { line: 'rift.hill.folk.vent', fx: { trust: 0.03, flag: 'vented' }, go: [
        { ap: 'comfort', say: 'Change is frightening. It can still be kind.', to: 'kind' },
        { ap: 'advise', say: 'Go and say good morning to {riftNeighbor}. Just that.', to: 'hello', need: { if: { riftNeighbor: (x) => !!x } } },
      ] },
      hello: { line: 'rift.hill.folk.hello', fx: { respect: 0.03, run: both(softenSelf(0.12), natterWith('riftNeighbor')) }, end: true },
      children: { line: 'rift.hill.folk.children', fx: { trust: 0.02, run: both(softenSelf(0.1), heardIt(0.06)) }, end: true },
      glad: { line: 'rift.hill.folk.glad', fx: { fond: 0.02 }, end: true },
      others: { line: 'rift.hill.folk.others', end: true },
      met: { line: 'rift.hill.folk.met', go: [
        { ap: 'warm', say: 'Then you\'ve done more for this village than any Moot.', to: 'glad' },
        { ap: 'ask', say: 'Do you ever worry {riftFriend} might go home?', to: 'worry' },
      ] },
      worry: { line: 'rift.hill.folk.worry', go: [
        { ap: 'comfort', say: 'Friends who leave are still friends. And some come back.', to: 'kind' },
        { ap: 'advise', say: 'Have you told {riftFriend} that?', to: 'tellthem' },
      ] },
      whatsay: { line: 'rift.hill.folk.whatsay', go: [
        { ap: 'warm', say: 'That would do very nicely. Go and say it.', to: 'hello', need: { if: { riftNeighbor: (x) => !!x } } },
        { ap: 'jest', say: 'Start with the weather. It works on everyone.', to: 'weather' },
      ] },
      weather: { line: 'rift.hill.folk.weather', fx: { run: softenSelf(0.06) }, end: true },
      kind: { line: 'rift.hill.folk.kind', fx: { trust: 0.02, run: softenSelf(0.06) }, end: true },
      tellthem: { line: 'rift.hill.folk.tellthem', fx: { respect: 0.03, run: natterWith('riftFriend') }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('rift.hill.folk.open', [
    { text: ['What do you make of the rift-folk, {name}?', 'How are you getting on with the newcomers, {name}?', 'The folk from the sky, {name}. What\'s your verdict?'] },
    { if: { riftFriend: (x) => !!x }, text: ['I see you\'re thick with {riftFriend}, {name}.'] },
    { if: { riftWary: 'much' }, text: ['You keep well clear of the rift-folk, I notice, {name}.'] },
  ]);
  lines('rift.hill.folk.start', [
    { text: ['The rift-folk? Nice enough, once you\'re used to the eyes.', 'They\'re folk. Odd folk. But folk.', 'I\'ve not made up my mind. I\'ve made up half of it.'] },
    { if: { riftWary: 'much' }, text: ['I don\'t like them. There. I said it. Glowing eyes and no proper names.', 'Strangers out of the sky, sleeping under hedges, and the Moot wants us to make them welcome. Hmph.'] },
    { if: { riftWary: 'some' }, text: ['They seem harmless. Probably. I keep my door shut, all the same.', 'I wave. I\'m not unkind. I just don\'t know what they want.'] },
    { if: { riftWary: 'none' }, text: ['I like them! Hard workers. Funny. One fixed my gate and wouldn\'t take a farthing.', 'Grand folk. Talk funny. So do the Brandybucks.'] },
    { if: { riftFriend: (x) => !!x }, pri: 1, text: ['{RiftFriend}\'s my friend. That\'s what I make of them. The rest, I take one at a time.'] },
    { if: { temper: 'ornery' }, text: ['What do I make of them? Noise. Lights. Talk of "uplinks" over second breakfast. In MY day.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, they\'re a hoot! I had one round for tea. She asked if the teapot was alive.'] },
    { if: { temper: 'shy' }, text: ['I... haven\'t really... they\'re very loud. And bright. And tall in their boots.'] },
    { if: { temper: 'proud' }, text: ['They\'ll learn our ways in time. I\'ve offered to show them. Properly.'] },
    { if: { temper: 'curious' }, text: ['Fascinating! A whole other world, and they lived in it! I\'ve a hundred questions. I\'ve asked forty.'] },
    { if: { temper: 'dreamy' }, text: ['They came out of the sky, wizard. Out of the sky. How can anyone not love that?'] },
    { if: { temper: 'gloomy' }, text: ['More mouths. More noise. ...They seem sad, mind. I know sad when I see it.'] },
    { if: { temper: 'witty' }, text: ['They\'re the most interesting thing to happen here since the Proudfoots\' goat ate the mail.'] },
    { if: { stage: 'elder', riftWary: ['some', 'much'] }, pri: 1, text: ['In eighty years nobody\'s ever fallen out of the sky. I\'d have liked to finish without it.'] },
    { if: { riftPolicy: 'open', riftWary: ['some', 'much'] }, pri: 1, text: ['Holes for strangers while our own wait two years. That\'s what the Moot did. You can\'t blame me for grumbling.'] },
  ]);
  lines('rift.hill.folk.fear', [
    { text: ['The eyes, for one. They glow. In the dark. Like a cat\'s. A cat with opinions.', 'It\'s the not knowing. Where they\'ve come from. Why. Whether more are coming.'] },
    { if: { temper: 'ornery' }, text: ['They talk to boxes. Out loud. And the boxes answer. Nothing good ever answered from a box.'] },
    { if: { temper: 'shy' }, text: ['They\'re so... sure. They walk up and say hello. Just like that. I don\'t know what to do with my hands.'] },
    { if: { temper: 'gloomy' }, text: ['Things change. Then they don\'t change back. I\'ve seen it with mills and marriages.'] },
    { if: { temper: 'proud' }, text: ['They don\'t know our ways. They sit in the wrong chairs. They whistle at the table. It\'s not right.'] },
    { if: { stage: 'elder' }, text: ['My old mom used to say: nothing good comes out of a green storm. I\'ve never forgotten it.'] },
    { if: { riftStage: { min: 8 } }, pri: 1, text: ['The sky keeps tearing and guttering, every night. Something\'s not right on the other side. What if it comes here?'] },
    { if: { riftPolicy: 'open' }, text: ['Our Tom\'s been waiting two years for a hole. Then a stranger walks out of the sky and gets one in a day.'] },
  ]);
  lines('rift.hill.folk.like', [
    { text: ['They\'re grafters. You should see them at a harvest. And they say thank you for everything.', 'They\'ve a way of seeing things. Turned my old kettle into a lamp. It\'s lovely.'] },
    { if: { temper: 'cheerful' }, text: ['They laugh at all my jokes! Even the bad ones! Especially the bad ones!'] },
    { if: { temper: 'curious' }, text: ['They know things. Real things. About light and wire and the stars. I\'m learning binary. With acorns.'] },
    { if: { temper: 'dreamy' }, text: ['They make the evenings feel bigger. Like the valley\'s got a window now, onto somewhere else.'] },
    { if: { riftDynamo: true }, text: ['They built a lamp out of our river! Our river! The lane by the mill\'s bright enough to read by.'] },
  ]);
  lines('rift.hill.folk.friend', [
    { text: ['{RiftFriend}? Best friend I\'ve made in twenty years. Never thought it\'d be one from the sky.', 'Oh, {riftFriend}\'s grand. Comes round most evenings. Eats my cookies. I\'d be lost without.'] },
    { if: { temper: 'ornery' }, text: ['{RiftFriend}\'s all right. For a stranger. ...Better than all right. Don\'t tell {riftFriend}.'] },
    { if: { temper: 'shy' }, text: ['{RiftFriend} talks enough for both of us. I like that. I don\'t have to.'] },
    { if: { temper: 'proud' }, text: ['I took {riftFriend} under my wing. Taught {riftFriend} everything. Well. Most things.'] },
    { if: { temper: 'witty' }, text: ['{RiftFriend} beats me at cards. I\'ve never forgiven the sky.'] },
  ]);
  lines('rift.hill.folk.notspoken', [
    { text: ['Not as such. I nod. They nod. We\'ve a very good nod going.', 'Not yet. I keep meaning to. Then I don\'t.'] },
    { if: { temper: 'shy' }, text: ['No. I wouldn\'t know what to say. What do you say to someone from another world?'] },
    { if: { temper: 'proud' }, text: ['It\'s for them to come to me. I\'ve lived here sixty years.'] },
    { if: { temper: 'ornery' }, text: ['No, and I don\'t intend to. ...Unless they come to me. Politely.'] },
    { if: { riftNeighbor: (x) => !!x }, text: ['There\'s {riftNeighbor}, down the lane. I\'ve never said more than good morning. Not even that, lately.'] },
  ]);
  lines('rift.hill.folk.feet', [
    { text: ['Our feet? What\'s wrong with our feet? ...Oh, they\'re shocked by the hair. Ha!', 'Cheek! Our feet are perfectly respectable. ...They have very odd boots, mind.'] },
    { if: { temper: 'ornery' }, text: ['They can say what they like about my feet. My feet were here first.'] },
    { if: { temper: 'witty' }, text: ['Fair. I\'d be alarmed by us too. We\'re all ankles and appetite.'] },
  ]);
  lines('rift.hill.folk.vent', [
    { text: ['...It\'s not them, really. It\'s that everything was the same for so long. And now it isn\'t. And I\'m old.', 'I\'m frightened. That\'s the long and short of it. Frightened, and ashamed of being.'] },
    { if: { temper: 'ornery' }, text: ['And the noise! And the lights at all hours! And nobody asked me! ...Nobody asked me. That\'s it, really.'] },
    { if: { temper: 'gloomy' }, text: ['I lost my brother to a fever, the year the river flooded. Since then I don\'t like surprises. That\'s all.'] },
    { if: { temper: 'proud' }, text: ['I built this lane. My father did before me. I just want to know it\'ll still be ours.'] },
  ]);
  lines('rift.hill.folk.hello', [
    { text: ['Good morning. Just that. ...I suppose I can manage good morning.', 'Hm. All right. Good morning. Not a word more.'] },
    { if: { riftNeighbor: (x) => !!x }, pri: 1, text: ['{RiftNeighbor}. All right. Good morning to {riftNeighbor}. I\'ll take a scone, in case.'] },
    { if: { temper: 'ornery' }, text: ['Fine. Good morning. If they say anything back, I\'m blaming you.'] },
    { if: { temper: 'shy' }, text: ['...Will you stand nearby? Not close. Nearby.'] },
  ]);
  lines('rift.hill.folk.children', [
    { text: ['Children sent somewhere safe. ...Like we sent the little ones up the hill, the year of the flood.', 'Safe. Here. ...Well. I\'d want someone to take in mine, if it came to it.'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['And one of ours went first. Fernsby. So they\'re our children\'s children, in a manner of speaking. Bless me.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. ...Children. All right. I\'ll stop calling them strangers. I\'ll call them lodgers.'] },
  ]);
  lines('rift.hill.folk.glad', [{ text: ['Get away with you. I just do what anyone would.', 'Oh, I don\'t know about that. They\'re lucky in the pies, I\'ll grant you.'] }, { if: { temper: 'proud' }, text: ['They are. I\'ve always been a good neighbor.'] }]);
  lines('rift.hill.folk.others', [
    { text: ['Some do. The young ones. The old ones sit at the Badger and grumble into their pints.', 'Half and half. Like everything in this village.'] },
    { if: { riftElder: (x) => !!x }, pri: 1, text: ['Not {riftElder}. {RiftElder} would sooner eat a boot than say good morning to one.'] },
  ]);
  lines('rift.hill.folk.met', [
    { text: ['{RiftFriend} fell over my wall. Literally. Fresh out of the sky, into my beans. We\'ve been friends since.', 'At the well. {RiftFriend} couldn\'t work the bucket. I laughed. {RiftFriend} laughed. That was that.'] },
    { if: { riftSupper: true }, text: ['Supper. I asked {riftFriend} round because the Moot said. Then I asked again because I wanted to.'] },
    { if: { riftMixed: true }, text: ['{RiftFriend} lodges with us. First night, I didn\'t sleep a wink. Now I can\'t sleep till I hear the door.'] },
  ]);
  lines('rift.hill.folk.worry', [
    { text: ['Every time the sky opens. I watch {riftFriend} watching it. Like a dog at a gate.', 'I do. If the way home opened, would {riftFriend} go? I wouldn\'t blame {riftFriend}. I\'d mind, though.'] },
    { if: { riftFinale: 'hearthlink' }, pri: 1, text: ['Not now. The golden doors go both ways. {RiftFriend} visits home and comes back with stories. Every time.'] },
    { if: { riftFinale: 'softclose' }, pri: 1, text: ['Not now. The rifts are shut. {RiftFriend}\'s here for good. I feel guilty for being glad.'] },
    { if: { temper: 'gloomy' }, text: ['Everyone leaves in the end. I just hoped {riftFriend} would be later.'] },
  ]);
  lines('rift.hill.folk.whatsay', [
    { text: ['I\'d ask if they\'d eaten. That\'s what you ask. That\'s always what you ask.', 'Welcome to Thistledown, I suppose. Mind the step.'] },
    { if: { temper: 'curious' }, text: ['I\'d ask what the stars look like from the other side. Then I\'d ask the other ninety-nine.'] },
    { if: { temper: 'ornery' }, text: ['I\'d ask them to keep the noise down. Nicely. With a scone.'] },
  ]);
  lines('rift.hill.folk.weather', [{ text: ['The weather! Ha. I can do weather. Everyone can do weather.', 'Lovely day for it. Looks like rain. I\'ve got a whole conversation there.'] }]);
  lines('rift.hill.folk.kind', [{ text: ['Kind. ...Yes. I\'d like it to be kind.', 'Hm. You\'ve a way of putting things, wizard.'] }, { if: { temper: 'ornery' }, text: ['Hmph. Kind. ...Fine. I\'ll try kind.'] }]);
  lines('rift.hill.folk.tellthem', [{ text: ['Told {riftFriend}? Hobbits don\'t say those things. ...Maybe I\'ll say it. Over tea. Quietly.', 'No. ...I\'ll go now. Before I lose my nerve.'] }]);

  // --- Taking up rift ways --------------------------------------------------------------
  addThread({
    id: 'rift.hill.ways', label: 'Taken up rift ways, I see', weight: 1, cool: 4,
    when: (F) => !F.rift && F.riftTier >= 1,
    open: { jest: 'rift.hill.ways.open' },
    beats: {
      start: { line: 'rift.hill.ways.start', go: [
        { ap: 'ask', say: 'What drew you to it?', to: 'why' },
        { ap: 'jest', say: 'Your grandmother would have a fit.', to: 'gran' },
        { ap: 'ask', say: 'And what does your family make of it?', to: 'family' },
      ] },
      why: { line: 'rift.hill.ways.why', go: [
        { ap: 'ask', say: 'And the old ways? Put away?', to: 'old' },
        { ap: 'warm', say: 'It suits you, I must say.', to: 'suits' },
      ] },
      gran: { line: 'rift.hill.ways.gran', go: [
        { ap: 'ask', say: 'And the rest of your family?', to: 'family' },
        { ap: 'jest', say: 'Get her a visor. She\'d suit one as well as you do.', to: 'suits' },
      ] },
      family: { line: 'rift.hill.ways.family', go: [
        { ap: 'advise', say: 'Show them. Don\'t argue. Show them.', to: 'show' },
        { ap: 'comfort', say: 'They\'ll come round. Families do, slowly.', to: 'old' },
      ] },
      old: { line: 'rift.hill.ways.old', go: [
        { ap: 'warm', say: 'Two kinds of ways, one hobbit. That\'s not a bad thing to be.', to: 'both' },
        { ap: 'jest', say: 'Second breakfast with a visor on. It suits you, mind.', to: 'suits' },
      ] },
      suits: { line: 'rift.hill.ways.suits', fx: { fond: 0.02 }, end: true },
      show: { line: 'rift.hill.ways.show', fx: { respect: 0.02 }, end: true },
      both: { line: 'rift.hill.ways.both', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('rift.hill.ways.open', [
    { text: ['Taken up rift ways, I see, {name}. Is that neon on your waistcoat?', 'Well, {name}! You\'re glowing. Literally.'] },
    { if: { riftTier: 2 }, text: ['{Name}! I hardly knew you under all that synth-weave.', 'A visor, {name}? On a hobbit? Whatever next?'] },
  ]);
  lines('rift.hill.ways.start', [
    { text: ['A strip of neon. Just a strip. It suits a waistcoat, don\'t you think?', 'Bit of glow never hurt anyone. I say "ping" now, too. Ping.'] },
    { if: { riftTier: 2 }, text: ['All in, wizard. Synth-weave, glow trim, and I\'ve a gadget that tells me the weather. It\'s usually wrong. I love it.', 'I\'ve gone rift. Properly. The hole has a dish on the roof. My mother has disowned the dish.'] },
    { if: { temper: 'proud' }, text: ['First on the lane to take it up properly. Others followed. They always do.'] },
    { if: { temper: 'shy' }, text: ['Oh, it\'s just a little light. You can hardly see it. ...You can see it, can\'t you.'] },
    { if: { temper: 'witty' }, text: ['I\'m keeping up with the times. The times have neon now. I didn\'t make the rules.'] },
    { if: { temper: 'cheerful' }, text: ['Isn\'t it fun? I glow at parties! People find me in the dark! Nobody can lose me!'] },
    { if: { temper: 'ornery' }, text: ['And? A hobbit can wear what he likes. Or she. Or whatever glows.'] },
    { if: { stage: 'elder' }, pri: 1, text: ['At my age, wizard, you take your thrills where you find them. I found mine in a strip of blue light.'] },
    { if: { stage: 'child' }, text: ['I\'m a rift-hobbit now! Ping! I\'ve got a blinky! It\'s a button that doesn\'t do anything but it blinks!'] },
  ]);
  lines('rift.hill.ways.why', [
    { text: ['The Relay, at first. Then the young ones. Then I thought, why should they have all the fun?', 'It\'s exciting! Nothing new\'s happened in this valley since the mill was rebuilt.'] },
    { if: { riftFriend: (x) => !!x }, pri: 1, text: ['{RiftFriend}. Rubs off on you. One day you\'re lending a wrench, next you\'re saying "copy that".'] },
    { if: { temper: 'curious' }, text: ['I wanted to understand it. You can\'t understand a thing from the outside. You have to wear it.'] },
    { if: { temper: 'dreamy' }, text: ['It feels like wearing a little piece of another sky. I like having it about me.'] },
  ]);
  lines('rift.hill.ways.gran', [
    { text: ['She has! She calls it my "electrical phase". She also calls the Relay "that wireless".', 'Gran says neon is how the devil reads in the dark. She also asked if it came in green.'] },
    { if: { stage: 'elder' }, pri: 1, text: ['I AM the grandmother. And I\'ve had my fit. Now I\'ve a glowing shawl.'] },
    { if: { temper: 'ornery' }, text: ['Gran\'s had a fit about everything since the invention of the spoon.'] },
  ]);
  lines('rift.hill.ways.family', [
    { text: ['Half of them love it, half of them pretend not to. The other half are hiding my visor.', 'Mom tuts. Dad borrowed it. Don\'t tell mom.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse} sighs. Then {spouse} asks me to light the way home from the Badger. Every time.'] },
    { if: { kid: (k) => !!k }, text: ['{Kid} thinks I\'m the best. {Kid}\'s friends think I\'m embarrassing. Both are true.'] },
    { if: { temper: 'gloomy' }, text: ['They don\'t understand. They think I\'m running from something. Maybe I am.'] },
  ]);
  lines('rift.hill.ways.old', [
    { text: ['Put away? Never. I\'ve the pipe in one pocket and the gadget in the other. Second breakfast still comes first.', 'I still sing the old songs. I just sing them with a light on.'] },
    { if: { riftTier: 2 }, text: ['Mostly. I miss my pipe sometimes. ...I still have it. In a drawer. With the old waistcoat.'] },
    { if: { temper: 'proud' }, text: ['I\'m still a hobbit of Thistledown. Neon doesn\'t change that. Nothing does.'] },
  ]);
  lines('rift.hill.ways.suits', [{ text: ['It does, doesn\'t it? I\'ve been told I glow from within. Mostly from the battery.', 'Ha! I\'ll tell gran the wizard approves. That\'ll settle her.'] }, { if: { temper: 'shy' }, text: ['...Really? Thank you. I\'ll keep it, then.'] }]);
  lines('rift.hill.ways.show', [{ text: ['Show them. Yes. I\'ll light the table at supper. Let the soup do the arguing.', 'Not argue. Just glow. Quietly. I can do that.'] }]);
  lines('rift.hill.ways.both', [{ text: ['One hobbit, two kinds of ways. I\'ll have that sewn on a cushion.', 'That\'s me, isn\'t it. Both. I think I knew.'] }]);

  // --- The young ones and the rift-folk -------------------------------------------------
  addThread({
    id: 'rift.hill.young', label: 'Have you met the rift-folk?', weight: 1.1, cool: 3,
    when: (F) => hill(F) && F.stage === 'child',
    open: { ask: 'rift.hill.young.open' },
    beats: {
      start: { line: 'rift.hill.young.start', go: [
        { ap: 'ask', say: 'What do you like best about them?', to: 'best' },
        { ap: 'ask', say: 'Does your mom mind them?', to: 'mum' },
        { ap: 'tale', say: 'Do you know where they come from?', to: 'where' },
      ] },
      best: { line: 'rift.hill.young.best', go: [
        { ap: 'advise', say: 'Ask {riftNeighbor} to show you a gadget. Politely.', to: 'go', need: { if: { riftNeighbor: (x) => !!x } } },
        { ap: 'ask', say: 'And what do you like best about the hills?', to: 'hillbest' },
      ] },
      mum: { line: 'rift.hill.young.mom', go: [
        { ap: 'advise', say: 'Your mom\'s right about staring. Ask instead.', to: 'askinstead' },
        { ap: 'warm', say: 'Your mom and the rift-folk will be friends one day.', to: 'both' },
      ] },
      where: { line: 'rift.hill.young.where', go: [
        { ap: 'warm', say: 'You\'re both a little bit right.', to: 'both' },
        { ap: 'advise', say: 'Ask the rift-folk. They know best.', to: 'go' },
        { ap: 'advise', say: 'Ask your gran. She knows the old stories.', to: 'hillbest' },
      ] },
      go: { line: 'rift.hill.young.go', fx: { fond: 0.03, lean: 'rift' }, end: true },
      hillbest: { line: 'rift.hill.young.hillbest', fx: { fond: 0.03, lean: 'hill' }, end: true },
      askinstead: { line: 'rift.hill.young.askinstead', fx: { fond: 0.02, lean: 'rift' }, end: true },
      both: { line: 'rift.hill.young.both', fx: { fond: 0.03, run: nudgeBoth }, end: true },
    },
  });
  lines('rift.hill.young.open', [
    { text: ['Have you met the rift-folk, {name}?', 'What do you think of the folk from the sky, {name}?'] },
    { if: { riftNeighbor: (x) => !!x }, text: ['Have you said hello to {riftNeighbor} yet, {name}?'] },
  ]);
  lines('rift.hill.young.start', [
    { text: ['They\'ve got glowy eyes! Some of them! And blue hair! I want blue hair!', 'I\'ve SEEN them. Up close. Nearly up close. Behind a hedge.'] },
    { if: { riftNeighbor: (x) => !!x }, text: ['{RiftNeighbor} let me hold a blinky thing! It went beep! I nearly dropped it!'] },
    { if: { riftTier: { min: 1 } }, text: ['I\'m practically one. I say "ping" and I\'ve got a strip of light on my sweater. Gran hates it.'] },
    { if: { band: 'youth' }, text: ['Yeah. They\'re all right. Better than all right. They don\'t treat you like a baby.'] },
    { if: { temper: 'gloomy' }, text: ['They\'re scary. One looked at me. Its eye went GREEN.'] },
    { if: { temper: 'curious' }, text: ['I\'ve been following one. For science. She knows. She waves.'] },
    { if: { riftWary: 'much' }, pri: 1, text: ['Mom says don\'t go near them. So I watch from the wall. They\'re very interesting from the wall.'] },
  ]);
  lines('rift.hill.young.best', [
    { text: ['The lights! And they know songs with beeps in. And they let you count on their fingers. They\'ve got metal ones!', 'They tell stories about a city that\'s always awake! Imagine never going to bed!'] },
    { if: { band: 'youth' }, text: ['They talk to you like you\'re grown. And they know how things work. Real things.'] },
    { if: { riftRelay: true }, text: ['The Relay! You can write things on it and everyone sees! I wrote "hello" and forty people said "ping"!'] },
  ]);
  lines('rift.hill.young.mom', [
    { text: ['Mom says don\'t stare. I don\'t stare. I look a lot. That\'s different.', 'Mom says they\'re nice but I\'m not to go in their camp. I\'ve been in their camp twice.'] },
    { if: { riftWary: 'much' }, text: ['Mom doesn\'t like them. She says they\'re "not our sort". What\'s our sort?'] },
    { if: { riftWary: 'none' }, text: ['Mom had one round for supper! He ate SIX potatoes. Mom was so pleased.'] },
  ]);
  lines('rift.hill.young.where', [
    { text: ['Mom says it\'s bad weather. But the rift-folk say it\'s a door. A door in the SKY.', 'From a city behind the sky. My friend says. Gran says that\'s nonsense and they\'re from Bree.'] },
    { if: { riftNeighbor: (x) => !!x }, text: ['{RiftNeighbor} says it\'s a train. A train in the sky! Dad says it\'s a storm. Which is it?'] },
    { if: { temper: 'curious' }, text: ['I think it\'s a hole in the sky and on the other side there\'s ANOTHER sky. With other hobbits. Upside down.'] },
  ]);
  lines('rift.hill.young.go', [
    { text: ['Can I? Now? I\'m going NOW. Politely! I\'ll say please twice!', 'Okay! I\'ll ask! If they say no I\'ll ask again tomorrow.'] },
    { if: { riftNeighbor: (x) => !!x }, pri: 1, text: ['{RiftNeighbor}! I\'m going to find {riftNeighbor}! Bye, wizard!'] },
  ]);
  lines('rift.hill.young.hillbest', [
    { text: ['Conkers. And the pond. And Gran\'s stories about the old days. They\'re long but they\'re good.', 'Second breakfast! The rift-folk didn\'t even HAVE second breakfast. We had to teach them.'] },
  ]);
  lines('rift.hill.young.askinstead', [{ text: ['Ask? Like, with words? Okay. I can do words.', 'Ask instead of stare. Okay. I\'ll ask what their eyes are for.'] }]);
  lines('rift.hill.young.both', [
    { text: ['Both? ...That\'s cheating. Wizards can\'t say both.', 'A bit right each! I\'m telling everyone! MOM! THE WIZARD SAYS YOU\'RE A BIT RIGHT!'] },
    { if: { riftNeighbor: (x) => !!x }, text: ['{RiftNeighbor}! The wizard says you\'re a bit right! And so\'s my dad! Bye!'] },
  ]);

  // --- The children's questions -------------------------------------------------------
  addThread({
    id: 'rift.hill.kidask', theirs: true, label: 'A child\'s question', cool: 4, ask: '{Name} has a question for you.',
    when: (F) => !F.rift && F.stage === 'child' && F.riftStage >= 1 && F.met,
    beats: {
      start: { line: 'rift.hill.kidask.q', go: [
        { ap: 'warm', say: 'It\'s not torn. It\'s a door. Someone\'s knocking.', to: 'door' },
        { ap: 'ask', say: 'Why do you think it is?', to: 'think' },
        { ap: 'jest', say: 'Somebody sat on it.', to: 'sat' },
      ] },
      door: { line: 'rift.hill.kidask.door', go: [
        { ap: 'ask', say: 'Who do you think is knocking?', to: 'think' },
      ] },
      sat: { line: 'rift.hill.kidask.sat', go: [
        { ap: 'warm', say: 'No, really. It\'s a door, I think. Someone\'s knocking.', to: 'door' },
        { ap: 'ask', say: 'Why do you think it is?', to: 'think' },
      ] },
      think: { line: 'rift.hill.kidask.think', go: [
        { ap: 'warm', say: 'They\'re both a little bit right.', to: 'both' },
        { ap: 'advise', say: 'Listen to the rift-folk. They\'ve come from the other side.', to: 'riftside' },
        { ap: 'advise', say: 'Listen to your mom. She\'s been here longest.', to: 'hillside' },
      ] },
      both: { line: 'rift.hill.kidask.both', fx: { fond: 0.03, run: nudgeBoth, news: 'The wizard says the rift-folk and the hill-folk are both a bit right about the sky.' }, end: true },
      riftside: { line: 'rift.hill.kidask.riftside', fx: { fond: 0.02, lean: 'rift' }, end: true },
      hillside: { line: 'rift.hill.kidask.hillside', fx: { fond: 0.02, lean: 'hill' }, end: true },
    },
  });
  lines('rift.hill.kidask.q', [
    { text: ['Mister Wizard! Why is the sky all torn?', 'Wizard! Wizard! Where do the sky people COME from?', 'Is the sky broken? Can you fix it? Is it your fault?'] },
    { if: { riftOpen: true }, text: ['There\'s a hole in the sky RIGHT NOW. Did you do it? Can you do another one?'] },
    { if: { band: 'youth' }, text: ['Can I ask you something? Properly? What actually are the rifts?'] },
  ]);
  lines('rift.hill.kidask.door', [
    { text: ['A DOOR? In the SKY? Who\'s knocking? Is it a giant?', 'Knocking! I knew it! It sounds like knocking! Kind of. A hummy knock.'] },
    { if: { band: 'youth' }, text: ['A door. Huh. Then someone\'s on the other side. Someone who wants in. Or out.'] },
  ]);
  lines('rift.hill.kidask.sat', [
    { text: ['HAHAHA. Somebody sat on the sky! A big bottom!', 'Who? Who sat on it? Was it you? You\'re very tall.'] },
  ]);
  lines('rift.hill.kidask.think', [
    { text: ['Mom says it\'s bad weather. But the rift-folk say it\'s a door. A door in the sky.', 'Gran says it\'s a punishment for not eating greens. I think it\'s a train. A sky train!'] },
    { if: { riftNeighbor: (x) => !!x }, pri: 1, text: ['Mom says it\'s bad weather. But {riftNeighbor} says it\'s a train. A train in the SKY.'] },
    { if: { temper: 'curious' }, text: ['I think the sky\'s like a curtain. And somebody on the other side is trying to open it but they can\'t find the middle.'] },
  ]);
  lines('rift.hill.kidask.both', [
    { text: ['Both! ...That\'s cheating. *runs off* MOM! THE WIZARD SAYS YOU\'RE A BIT RIGHT!', 'Both a bit right! I\'m going to tell everyone! Bye!'] },
    { if: { riftNeighbor: (x) => !!x }, pri: 1, text: ['Both! *runs off* {RiftNeighbor}! THE WIZARD SAYS YOU\'RE A BIT RIGHT!'] },
  ]);
  lines('rift.hill.kidask.riftside', [{ text: ['The rift-folk! I\'ll ask them! I\'ll ask them EVERYTHING.', 'From the other side! I\'m going to go and listen. Really hard.'] }]);
  lines('rift.hill.kidask.hillside', [{ text: ['Mom\'s been here longest. That\'s true. She\'s been here FOREVER.', 'Okay. Mom. But I\'m still going to look at the sky.'] }]);

  // --- Supper with a stranger at the table ---------------------------------------------
  addThread({
    id: 'rift.hill.supper', label: 'Had any of the rift-folk to supper?', weight: 0.9, cool: 5,
    when: (F) => hill(F) && F.stage !== 'child' && F.riftStage >= 2 && !F.homeless,
    rel: (F) => (F.riftSupper || F.riftMixed ? 1.5 : F.riftWary === 'none' ? 1 : 0.6),
    open: { ask: 'rift.hill.supper.open' },
    beats: {
      start: { line: 'rift.hill.supper.start', go: [
        { ap: 'ask', say: 'What did you give them?', to: 'menu', need: { if: { riftSupper: true } } },
        { ap: 'ask', say: 'And what did they make of it all?', to: 'reaction', need: { when: (F) => F.riftSupper || F.riftMixed } },
        { ap: 'advise', say: 'You should ask {riftNeighbor} round. One supper.', to: 'invite', need: { if: { riftNeighbor: (x) => !!x } } },
        { ap: 'jest', say: 'Afraid they\'ll eat you out of house and hole?', to: 'eat' },
      ] },
      menu: { line: 'rift.hill.supper.menu', go: [
        { ap: 'ask', say: 'And what did they make of it?', to: 'reaction' },
        { ap: 'jest', say: 'And did they survive the scones?', to: 'scones' },
      ] },
      reaction: { line: 'rift.hill.supper.reaction', go: [
        { ap: 'ask', say: 'And what did you learn from them?', to: 'learned' },
        { ap: 'warm', say: 'A full table is the best kind.', to: 'table' },
      ] },
      eat: { line: 'rift.hill.supper.eat', go: [
        { ap: 'advise', say: 'One supper. You\'ll not regret it.', to: 'invite', need: { if: { riftNeighbor: (x) => !!x } } },
        { ap: 'warm', say: 'A full table\'s the best kind. And they\'d help with the washing up.', to: 'table' },
      ] },
      invite: { line: 'rift.hill.supper.invite', fx: { respect: 0.03, run: askToSupper }, end: true },
      scones: { line: 'rift.hill.supper.scones', fx: { fond: 0.02 }, end: true },
      learned: { line: 'rift.hill.supper.learned', fx: { trust: 0.02 }, end: true },
      table: { line: 'rift.hill.supper.table', fx: { fond: 0.02 }, end: true },
    },
  });
  lines('rift.hill.supper.open', [
    { text: ['Had any of the rift-folk to supper, {name}?', 'Has a rift-born ever sat at your table, {name}?'] },
    { if: { riftMixed: true }, text: ['How\'s your lodger from the sky, {name}?'] },
  ]);
  lines('rift.hill.supper.start', [
    { text: ['Not yet. I\'ve thought about it. The table\'s only so big.', 'No. They\'ve their own ways. I\'d not know what to cook.'] },
    { if: { riftSupper: true }, pri: 1, text: ['I have! Last night! "Is tea a stimulant or a ritual?" she asked. "Yes," I said. We laughed till the pot went cold.', 'Just yesterday. He brought a little lamp as a guest-gift. It\'s on the dresser. It hums.'] },
    { if: { riftMixed: true }, pri: 1, text: ['Every night! One lodges with us. Sits at the end. Says grace in binary. It\'s very short.'] },
    { if: { riftPolicy: 'sponsor' }, text: ['The Moot said each house should sponsor one. We drew a name. Then we kept drawing it.'] },
    { if: { temper: 'ornery' }, text: ['Supper\'s for family. ...Though I\'ve seen the state of their camp. Hm.'] },
    { if: { temper: 'cheerful' }, text: ['Not yet, but I\'d love to! Do they eat potatoes? Everyone eats potatoes.'] },
    { if: { temper: 'shy' }, text: ['I... wouldn\'t know what to talk about. Over the soup. For a whole evening.'] },
  ]);
  lines('rift.hill.supper.menu', [
    { text: ['Mushroom pie, two kinds of potato, and the good jam. You don\'t give a guest the ordinary jam.', 'Stew, bread, cheese and a seed-cake. She cried at the seed-cake. Actually cried.'] },
    { if: { temper: 'proud' }, text: ['My best. The pork and apple. People have walked from the next valley for it.'] },
    { if: { temper: 'witty' }, text: ['Seven courses. They thought it was a feast. I said no, it\'s Tuesday.'] },
  ]);
  lines('rift.hill.supper.reaction', [
    { text: ['Asked what every dish was. Ate it all. Asked again. Like a child at a fair.', 'She held the bread like it was made of gold. Then she asked for the recipe. And the oven.'] },
    { if: { riftMixed: true }, text: ['Our lodger still can\'t believe the pantry. Opens it every morning like it might have vanished.'] },
    { if: { temper: 'dreamy' }, text: ['He went quiet over the pudding. Then said it was the first time he\'d been full in years. I had to go and see to the kettle.'] },
  ]);
  lines('rift.hill.supper.eat', [
    { text: ['Ha! One of them ate my whole pantry\'s worth of compliments. Not the food. The compliments.', 'Afraid? A little. I\'ve heard they eat noodles. Long ones. On purpose.'] },
    { if: { temper: 'ornery' }, text: ['They eat like hobbits. Better than hobbits. It\'s indecent.'] },
  ]);
  lines('rift.hill.supper.invite', [
    { text: ['One supper. All right. I\'ll do the good jam.', 'Go on, then. I\'ll ask. If it goes badly I\'m blaming you.'] },
    { if: { riftNeighbor: (x) => !!x }, pri: 1, text: ['{RiftNeighbor}? All right. I\'ll send word. Tonight, if the pie\'s ready.'] },
    { if: { temper: 'shy' }, text: ['...You\'ll tell me what to say? No? ...All right. I\'ll ask about the weather.'] },
  ]);
  lines('rift.hill.supper.scones', [{ text: ['Survived and asked for more. Then hid two in a pocket. Like a proper hobbit.', 'One chipped a tooth. Still finished it. I respect that.'] }]);
  lines('rift.hill.supper.learned', [
    { text: ['Counting in ones and zeros. With peas. My children think I\'m clever now.', 'That they call happy "full signal". My lad says it at breakfast now.'] },
    { if: { riftCustoms: 'ramen' }, text: ['How to make a broth with noodles in it. Mushroom. I\'ve made it twice. The second time it was good.'] },
    { if: { riftCustoms: 'blues' }, text: ['A song. The Low Battery Blues. It\'s about being tired. I know a lot about being tired.'] },
  ]);
  lines('rift.hill.supper.table', [{ text: ['A full table. Yes. My mother used to say that. I\'d forgotten.', 'It is. Even with someone in a visor at it.'] }]);

  // --- The machines by the river ------------------------------------------------------
  addThread({
    id: 'rift.power', label: 'The rift-folk\'s machines', weight: 0.8, cool: 5,
    when: (F) => !F.rift && F.stage !== 'child' && (F.riftDynamo || F.riftRelay || F.riftCamp),
    rel: (F) => (F.job === 'miller' || F.job === 'woodwright' ? 1.6 : 0.9),
    open: { ask: 'rift.power.open' },
    beats: {
      start: { line: 'rift.power.start', go: [
        { ap: 'ask', say: 'Do they trouble you?', to: 'trouble' },
        { ap: 'ask', say: 'Have you seen how they work?', to: 'how' },
        { ap: 'jest', say: 'Lamps that need no oil. Whatever next? Talking hedges?', to: 'next' },
      ] },
      trouble: { line: 'rift.power.trouble', go: [
        { ap: 'ask', say: 'And the lights in the hollow? Do you like them?', to: 'lights' },
        { ap: 'comfort', say: 'The river\'s still the river. It\'s only lending a hand.', to: 'river' },
      ] },
      how: { line: 'rift.power.how', go: [
        { ap: 'ask', say: 'And the lights in the hollow? Do you like them?', to: 'lights' },
        { ap: 'warm', say: 'You\'ve taught them as much as they\'ve taught you, I think.', to: 'taught' },
      ] },
      next: { line: 'rift.power.next', go: [
        { ap: 'ask', say: 'Truly, though. Do they trouble you?', to: 'trouble' },
        { ap: 'ask', say: 'And the lights in the hollow?', to: 'lights' },
      ] },
      lights: { line: 'rift.power.lights', fx: { fond: 0.01 }, end: true },
      river: { line: 'rift.power.river', fx: { trust: 0.02 }, end: true },
      taught: { line: 'rift.power.taught', fx: { respect: 0.02 }, end: true },
    },
  });
  lines('rift.power.open', [
    { text: ['What do you make of the rift-folk\'s machines, {name}?', 'That humming by the river, {name}. Does it bother you?'] },
    { if: { job: 'miller' }, text: ['They\'ve been studying your wheel, {name}. Did you know?'] },
    { if: { riftRelay: true }, text: ['That tall mast, {name}. What do you make of it?'] },
  ]);
  lines('rift.power.start', [
    { text: ['The humming? You get used to it. Like a bee that\'s moved in for good.', 'They hum. They glow. They\'ve not done any harm I can see.'] },
    { if: { job: 'miller' }, pri: 1, text: ['They stood on my bank for a month watching my wheel go round. Counting. Then they built their own. Cheek!', 'My wheel! They learned it all from my wheel. The least they could do is mention me on the plaque.'] },
    { if: { riftDynamo: true, temper: 'ornery' }, text: ['The Humming Nuisance, I call it. To its face. It doesn\'t care. It just hums.'] },
    { if: { riftRelay: true }, text: ['That mast. Tall as three oaks. Blinks red at night. The owls have taken against it.'] },
    { if: { riftDynamo: false, riftCamp: true }, text: ['That camp of theirs, all crates and a lamp that never goes out. I don\'t know how they sleep.'] },
    { if: { temper: 'curious' }, text: ['Marvelous! I\'ve asked a dozen questions. Understood two answers. Going back for more.'] },
    { if: { temper: 'dreamy' }, text: ['At night they glow like a little town of glow-worms. I go and sit by the river and watch.'] },
    { if: { stage: 'elder' }, text: ['In my day a light was a candle and you went to bed when it guttered. Now the lane stays lit till dawn.'] },
  ]);
  lines('rift.power.trouble', [
    { text: ['Trouble me? Not as such. I just like to know what\'s in my river.', 'A bit. Things that work and nobody knows how. That\'s how dragons start, my gran said.'] },
    { if: { temper: 'ornery' }, text: ['Trouble me? The fish have gone funny. They\'ve not, really. But they might.'] },
    { if: { riftWary: 'none' }, text: ['Not a bit. I charge my lamp there now. Don\'t tell my mother.'] },
  ]);
  lines('rift.power.how', [
    { text: ['A coil on a turning axle, they said. Same as my mill, near enough. I nodded. I didn\'t understand.', 'Water turns a wheel, wheel turns a coil, coil makes the glow. Simple as bread, they said. Bread isn\'t simple.'] },
    { if: { job: 'miller' }, pri: 1, text: ['I showed them. The race, the gearing, the lot. They took notes. Then they fixed my squeak. Forty years.'] },
    { if: { job: 'woodwright' }, text: ['I built the housing for them. Oak, pegged. Their side\'s all wires. My side\'ll outlast it.'] },
  ]);
  lines('rift.power.next', [
    { text: ['Talking hedges! Don\'t give them ideas.', 'Ha! They\'ve already got a box that talks. A hedge can\'t be far off.'] },
    { if: { temper: 'witty' }, text: ['A talking hedge would be an improvement on the Sackville-Bagginses.'] },
  ]);
  lines('rift.power.lights', [
    { text: ['The lights? ...I do, actually. Walking home from the Badger, I can see my feet. My feet are grateful.', 'They\'re pretty. There. I said it. Blue and pink on the snow.'] },
    { if: { temper: 'gloomy' }, text: ['I miss the dark, a bit. You could see the stars better. Now you see the lane.'] },
    { if: { stage: 'elder' }, text: ['I sat under one last night and read a letter from my sister. First time in years I\'ve read past dusk.'] },
  ]);
  lines('rift.power.river', [{ text: ['Lending a hand. Yes. The river\'s always been generous. I suppose it doesn\'t mind.', 'Still the river. ...I like that. I\'ll think of it like that.'] }]);
  lines('rift.power.taught', [{ text: ['Have I? Well. I suppose I have. Don\'t tell them, they\'ll want more lessons.', 'Fair\'s fair. They fixed my squeak. I showed them the river. We\'re square.'] }]);

  // --- That Relay ------------------------------------------------------------------
  addThread({
    id: 'rift.hill.relay', label: 'That Relay thing', weight: 0.7, cool: 5,
    when: (F) => !F.rift && F.stage !== 'child' && F.riftCount > 0 && F.riftStage >= 2,
    rel: (F) => (F.stage === 'elder' ? 1.4 : F.riftTier >= 1 ? 1.2 : 0.7),
    open: { ask: 'rift.hill.relay.open' },
    beats: {
      start: { line: 'rift.hill.relay.start', go: [
        { ap: 'jest', say: 'I\'ve posted on it, you know.', to: 'wiz' },
        { ap: 'ask', say: 'Have you ever tried it?', to: 'tried' },
        { ap: 'warm', say: 'It\'s only a very long hedge to shout over.', to: 'hedge' },
      ] },
      wiz: { line: 'rift.hill.relay.wiz', go: [
        { ap: 'ask', say: 'Have you ever tried it yourself?', to: 'tried' },
        { ap: 'jest', say: 'I\'ll put in a good word for your turnips.', to: 'turnips' },
      ] },
      tried: { line: 'rift.hill.relay.tried', go: [
        { ap: 'warm', say: 'Then you\'re braver than half the lane.', to: 'brave' },
        { ap: 'jest', say: 'I\'ll put in a good word for your turnips.', to: 'turnips' },
      ] },
      hedge: { line: 'rift.hill.relay.hedge', go: [
        { ap: 'ask', say: 'So you might try it, then?', to: 'tried' },
      ] },
      turnips: { line: 'rift.hill.relay.turnips', fx: { fond: 0.02 }, end: true },
      brave: { line: 'rift.hill.relay.brave', fx: { fond: 0.02 }, end: true },
    },
  });
  lines('rift.hill.relay.open', [
    { text: ['Have you seen the Relay, {name}?', 'What do you make of that Relay, {name}?'] },
    { if: { stage: 'elder' }, text: ['I hear you\'ve opinions on the Relay, {name}.'] },
  ]);
  lines('rift.hill.relay.start', [
    { text: ['That Relay. Folk staring at a box instead of a hedge.', 'In my day if you wanted to tell someone something, you walked over and told them.'] },
    { if: { riftTier: { min: 1 } }, pri: 1, text: ['I\'m on it every evening! I post the weather. Mostly wrong. Folk ping me anyway.'] },
    { if: { temper: 'ornery' }, text: ['A box that talks and nobody to blame for what it says. I don\'t hold with it.'] },
    { if: { temper: 'curious' }, text: ['It\'s a marvel. I read it at the camp. The young ones write in little bursts, like birds.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, it\'s a laugh! Somebody wrote that the goat\'s escaped again. Everybody already knew. Everybody pinged.'] },
    { if: { stage: 'elder' }, text: ['My granddaughter showed me. I asked how to make the letters bigger. She made them bigger. Still couldn\'t read it.'] },
  ]);
  lines('rift.hill.relay.wiz', [
    { text: ['You! On the Relay! A wizard ought to write proper letters, with a seal.', 'I saw that. Everyone saw that. The innkeeper read it out. Twice.'] },
    { if: { temper: 'witty' }, text: ['I saw. Very short. Not a single "thee". I was disappointed.'] },
  ]);
  lines('rift.hill.relay.tried', [
    { text: ['Once. I wrote "Is this thing on". Fourteen people said "ping". I don\'t know what that means.', 'Once. I wrote "Hello Relay. Turnips doing well. Yours sincerely." They loved it. I don\'t know why.'] },
    { if: { temper: 'shy' }, text: ['No. Everyone would see. ...I read it, though. Every night.'] },
    { if: { temper: 'ornery' }, text: ['Never. And I never shall. ...What would I even say? The weather?'] },
  ]);
  lines('rift.hill.relay.hedge', [{ text: ['A long hedge. Hm. I\'ve always liked a good hedge.', 'Put like that it\'s not so bad. Hedges never did anyone harm.'] }]);
  lines('rift.hill.relay.turnips', [{ text: ['My turnips need no good word. They speak for themselves. Loudly.', 'Ha! You do that. They\'re very good turnips this year.'] }]);
  lines('rift.hill.relay.brave', [{ text: ['Brave! Ha. It\'s only a box. ...It\'s a frightening box.', 'Braver than half the lane. I\'ll tell my sister that.'] }]);

  // --- The old days, before the sky tore -------------------------------------------------
  addThread({
    id: 'rift.hill.old', label: 'It\'s all changed, hasn\'t it?', weight: 0.9, cool: 6,
    when: (F) => !F.rift && F.stage === 'elder' && F.riftCount > 0,
    open: { warm: 'rift.hill.old.open' },
    beats: {
      start: { line: 'rift.hill.old.start', go: [
        { ap: 'ask', say: 'Better or worse, do you think?', to: 'better' },
        { ap: 'ask', say: 'What do you miss, of how it was?', to: 'miss' },
        { ap: 'share', say: 'Every valley changes. I\'ve watched a few.', to: 'wiz' },
      ] },
      better: { line: 'rift.hill.old.better', go: [
        { ap: 'ask', say: 'And the young ones? Do you worry for them?', to: 'young' },
        { ap: 'warm', say: 'You\'ve seen it all with a steady eye. That\'s worth something.', to: 'steady' },
      ] },
      miss: { line: 'rift.hill.old.miss', go: [
        { ap: 'listen', say: '*You let them remember.*', label: 'Let them remember', to: 'storms' },
        { ap: 'comfort', say: 'The stars are still there, above the lamps.', to: 'steady' },
      ] },
      wiz: { line: 'rift.hill.old.wiz', go: [
        { ap: 'ask', say: 'Do you remember any old tales of the sky?', to: 'storms' },
        { ap: 'warm', say: 'This one\'s changing gently. That\'s rare.', to: 'steady' },
      ] },
      storms: { line: 'rift.hill.old.storms', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'Green lightning? Tell me more.', to: 'green' },
        { ap: 'warm', say: 'Old tales have a way of coming round again.', to: 'steady' },
      ] },
      green: { line: 'rift.hill.old.green', fx: { trust: 0.02 }, end: true },
      young: { line: 'rift.hill.old.young', end: true },
      steady: { line: 'rift.hill.old.steady', fx: { fond: 0.02 }, end: true },
    },
  });
  lines('rift.hill.old.open', [
    { text: ['It\'s all changed, hasn\'t it, {name}?', 'You\'ve seen a good many years in this valley, {name}. Anything like these?'] },
  ]);
  lines('rift.hill.old.start', [
    { text: ['Changed? I\'ve lived here eighty years and the sky never once fell in. Now it does it on Tuesdays.', 'It has. Neon on the doorsteps. Children saying "ping". My mother would have taken to her bed.'] },
    { if: { temper: 'gloomy' }, text: ['Changed. Everything does. I\'d hoped to be gone before it did, that\'s all.'] },
    { if: { temper: 'cheerful' }, text: ['Hasn\'t it! I\'m eighty-four and I\'ve learned three new words this month. One of them\'s "uplink".'] },
    { if: { temper: 'ornery' }, text: ['Changed! You don\'t say. Lights all night, strangers in the lanes, a box that talks. Changed!'] },
    { if: { temper: 'dreamy' }, text: ['It has. I sit on the step and watch the sky tear and I think, well, I never expected to see magic.'] },
    { if: { riftTier: { min: 1 } }, pri: 1, text: ['Changed, and I\'ve changed with it. Look at me. A glowing shawl. At my age.'] },
  ]);
  lines('rift.hill.old.better', [
    { text: ['Better, mostly. Worse at night, when I can\'t sleep for the lights.', 'Different. Better and worse aren\'t the right words at my age. Different.'] },
    { if: { riftFriend: (x) => !!x }, pri: 1, text: ['Better. {RiftFriend} comes and reads to me now my eyes are going. Better.'] },
    { if: { riftWary: 'much' }, pri: 1, text: ['Worse. I don\'t care who hears it. I liked my valley quiet.'] },
  ]);
  lines('rift.hill.old.miss', [
    { text: ['The dark. Proper dark. You could see every star. Now the lane\'s all aglow.', 'Knowing everyone. Every face on the lane, I knew their gran. Now there are faces I don\'t know.'] },
    { if: { temper: 'gloomy' }, text: ['Being sure of things. I was sure the sky would stay up. That was a comfort.'] },
  ]);
  lines('rift.hill.old.wiz', [
    { text: ['Have you, now? And do they settle?', 'You would have. You\'ve the look of someone who\'s seen a lot of valleys.'] },
  ]);
  lines('rift.hill.old.storms', [
    { text: ['My granddad told of green storms. Out over the Long Meadow. Green lightning, that took the hay and left the field.', 'There were tales. Lightning the wrong color, long ago. A summer evening. My grandma wouldn\'t speak of it.'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['Green lightning. And the tinker, Fernsby. It\'s in the ledger. My granddad\'s granddad knew the family. Imagine.'] },
  ]);
  lines('rift.hill.old.green', [
    { text: ['Green. Like a beetle\'s back. Someone walked into it, the tale went. Never came back. I thought it was a story to keep us off the meadow.', 'That\'s all I know. Green, and quiet after. The old folk would say "mind the green weather" and change the subject.'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['Fernsby walked into it with a kettle. And now look. His kettle\'s on their sleeves. The sky remembers, I suppose.'] },
  ]);
  lines('rift.hill.old.young', [
    { text: ['Worry? No. They\'ll take what\'s good from both. Young ones always do.', 'A little. They forget the old songs. But they learn new ones. It\'s a fair swap, I suppose.'] },
  ]);
  lines('rift.hill.old.steady', [{ text: ['Steady. Ha. I was steady once. Now I\'m just slow.', 'Gently. Yes. I\'d not thought of it like that. Gently.'] }]);

  // --- Every temper, every beat: more ways of saying it ------------------------------------
  const byTemper = (key, o) => lines(key, Object.keys(o).map((temper) => ({ if: { temper }, text: o[temper] })));
  byTemper('rift.hill.folk.fear', {
    cheerful: ["I try to like them, I do! But the eyes at night give me the collywobbles.", "Oh, it's silly. They're so bright. Everything about them's bright. I'm used to candles."],
    curious: ["What they might know that we don't. What might follow them through. I want to know and I'm scared to.", "That I can't work them out. I can work out anyone. Not them. Not yet."],
    dreamy: ["They're like something from a story. And stories aren't always kind, are they?", "They came out of the sky. Things that come out of the sky can go back into it. Take things with them."],
    witty: ["They talk to their sleeves. I talk to my sleeves too, but mine don't answer.", "It's the hair. Nobody's hair should be that color without a fight involved."],
  });
  byTemper('rift.hill.folk.like', {
    ornery: ["They work hard and they don't moan. That's more than I can say for my cousins.", "They're all right. They mind their business. Mostly. They fix things. I'll give them that."],
    shy: ["...One of them helped me carry my basket. Didn't say anything. Just carried it.", "...They're kind. Quietly. I like quiet kind."],
    witty: ["They make the Badger's gossip twice as good. Fresh material.", "They think our pies are a miracle. Anyone who thinks that is a friend of mine."],
    proud: ["They've learned our ways respectfully. I've seen to that, mostly.", "They admire what we've built here. Rightly."],
    gloomy: ["They're sad, underneath. I know sad. We get on.", "They lost everything and they still say thank you. Shames the rest of us."],
  });
  byTemper('rift.hill.folk.friend', {
    cheerful: ["{RiftFriend}! My favorite! We sing together at the Badger! Badly! Loudly!", "Oh, {riftFriend} is a treasure! I'd be lost without {riftFriend} now!"],
    curious: ["{RiftFriend} teaches me things and I teach {riftFriend} things. It's an exchange. A wonderful one.", "{RiftFriend} answers all my questions. Nobody else has the patience."],
    dreamy: ["{RiftFriend} sees the valley like it's new. Through {riftFriend}, I see it new too.", "{RiftFriend} and I sit on the hill and watch the sky. Different skies, same sky."],
    gloomy: ["{RiftFriend} gets it. The missing things. We miss things together.", "{RiftFriend}'s the only one who doesn't tell me to cheer up."],
  });
  byTemper('rift.hill.folk.notspoken', {
    cheerful: ["Not yet! I keep meaning to! I'll do it tomorrow! I always say that!", "Not properly! I wave! They wave! It's a lovely wave!"],
    curious: ["Not yet. I've watched, mostly. Taking notes. I should probably just ask.", "Not properly. I've so many questions I don't know where to start."],
    dreamy: ["Not yet. I keep imagining what I'd say. The imagining's lovely. The doing's harder.", "Only in my head. I've had some wonderful conversations in my head."],
    witty: ["We've exchanged nods. Very meaningful nods. Practically a friendship.", "Not yet. I'm waiting for an introduction. Proper form."],
    gloomy: ["No. I'm not good with new folk. I'm not good with old folk either.", "No. They wouldn't want to talk to me."],
  });
  byTemper('rift.hill.folk.feet', {
    cheerful: ["Ha! Our feet! They're lovely feet! Furry and warm!", "They're jealous of the fur! Who wouldn't be?"],
    shy: ["*looks down at feet, embarrassed*", "...Oh. I hadn't thought."],
    curious: ["Our feet? What do they say? I want to know what they think of us!", "Really? I've never thought of our feet as odd. Interesting."],
    dreamy: ["Ha. Maybe to them we're the strange ones. From the strange green world.", "To them, we're the story. I like that."],
    proud: ["Our feet are perfectly respectable. Finest feet in the Shire.", "They can say what they like. Our feet have walked these hills for generations."],
    gloomy: ["Hm. Fair enough. We're all strange to someone.", "They're probably right. We are odd."],
  });
  byTemper('rift.hill.folk.vent', {
    cheerful: ["...Oh, I hate being frightened. I'm not made for it. I'm made for parties.", "I don't like being scared. It doesn't suit me. That's it. That's all."],
    shy: ["...It's all so much. So many new faces. I hide. I'm ashamed of hiding.", "...I just want things to stay the same. Is that so bad?"],
    curious: ["...I want to know, and I'm scared to know. Both at once. It's maddening.", "...What frightens me is what I don't understand. And I don't understand them."],
    dreamy: ["...It's like the world got bigger overnight and I'm still the same size.", "...I keep dreaming the sky falls. And it does. Every week."],
    witty: ["...Truth? I'm scared. It's not funny. I'll make it funny later.", "...I'm frightened. Write that down. It won't happen again."],
  });
  byTemper('rift.hill.folk.hello', {
    cheerful: ["Good morning! I can do that! I'll do it with a pie!", "Yes! Good morning! I'll go now!"],
    curious: ["Good morning. And then maybe a question. Just one. Two.", "Yes. I'll say good morning. And watch what happens."],
    dreamy: ["Good morning. Just that. Like opening a window.", "A good morning. That's a beginning, isn't it?"],
    witty: ["Good morning. Bold. Radical. I'll do it.", "A whole good morning? Steady on."],
    proud: ["Good morning. Properly. With a nod. As one should.", "I'll say it. I'm no coward."],
    gloomy: ["Good morning. ...I'll try. They might not answer.", "All right. Good morning. If they say it back, I'll be surprised."],
  });
  byTemper('rift.hill.folk.children', {
    cheerful: ["Children! Oh! Then we must look after them!", "Sent somewhere safe! And they chose us! Oh, that's lovely!"],
    shy: ["...Children. Oh. I didn't think of them like that.", "*softens visibly*"],
    curious: ["Sent here? On purpose? By whom? That changes everything.", "Children sent somewhere safe. That's a hypothesis. A good one."],
    dreamy: ["Children of light, looking for a soft place. Oh, wizard.", "Like a lullaby. Somebody sang them here."],
    witty: ["Children. So I've been rude to someone's babies. Marvelous.", "Children sent somewhere safe. And they picked the place with the best pies."],
    proud: ["If they were sent here, then we were chosen. That's an honor.", "Then we'll do right by them."],
    gloomy: ["Children sent away from home. Poor things.", "Safe. I hope we are. I hope we're safe enough."],
  });
  byTemper('rift.hill.folk.glad', {
    cheerful: ["Aw! You're lovely! They're lovely! Everyone's lovely!", "Lucky! Ha! I'll tell them you said!"],
    ornery: ["Hmph. Lucky. I do what's decent, that's all.", "Don't make a fuss."],
    shy: ["...Oh. Thank you.", "*goes pink*"],
    curious: ["Lucky? I'd say we're both lucky. It's mutual.", "Interesting. I thought of it the other way round."],
    dreamy: ["Lucky... maybe we're all lucky. To have found each other.", "That's kind."],
    witty: ["They're lucky in the pie department, I'll grant you.", "Lucky. Yes. Tell my mother that."],
    gloomy: ["Lucky. Hm. I don't feel it. But thank you.", "That's kind of you."],
  });
  byTemper('rift.hill.folk.others', {
    cheerful: ["Mostly! The young ones love them! The old ones are coming round!", "Half and half! But the happy half is louder!"],
    ornery: ["Agree? This lane's never agreed on anything. Not the weather. Not the time.", "Some do. The rest are fools."],
    shy: ["...I don't know. I don't ask.", "...Some of them do."],
    curious: ["It's split. By age, mostly. And by who's met one.", "I've noticed: anyone who's eaten with them likes them."],
    dreamy: ["Slowly, I think. Like a field turning green.", "More every day. You can feel it."],
    witty: ["The lane agrees about one thing only: everyone else is wrong.", "About as much as they agree on anything. Which is never."],
    proud: ["Those with sense agree with me.", "The ones who matter do."],
    gloomy: ["Not all. Some never will.", "Some. The rest will grumble till they're buried."],
  });
  byTemper('rift.hill.folk.met', {
    cheerful: ["The best story! {RiftFriend} fell into my pond! I fished {riftFriend} out! We laughed for an hour!", "At a party! {RiftFriend} taught me a dance! I taught {riftFriend} a better one!"],
    ornery: ["{RiftFriend} broke my fence. Then fixed it. Better than before. Annoying.", "{RiftFriend} wouldn't stop talking. Eventually I listened."],
    shy: ["...{RiftFriend} sat by me at the Badger. Didn't say anything. Then said something kind.", "...{RiftFriend} just kept saying hello. Every day. Till I said it back."],
    curious: ["I asked {riftFriend} a question. {RiftFriend} asked me two back. We've not stopped since.", "At the mill. We were both watching the wheel. Same questions."],
    dreamy: ["Under the party tree, at dusk. Like a story.", "On the hill, watching a rift close. We both said 'oh' at the same time."],
    witty: ["{RiftFriend} insulted my scones. I insulted {riftFriend}'s eye. Friends instantly.", "We met fighting over the last pie. I won. We shared it."],
    proud: ["I welcomed {riftFriend} properly. Someone had to.", "I took {riftFriend} under my wing the first week."],
    gloomy: ["{RiftFriend} found me crying by the river. Sat with me. Never asked why.", "We were both on our own at the Badger. Two lonely ones."],
  });
  byTemper('rift.hill.folk.worry', {
    cheerful: ["Oh, don't! I try not to think about it! {RiftFriend} would visit, wouldn't {riftFriend}?", "A bit! But I'd throw such a leaving party!"],
    ornery: ["Worry? If {riftFriend} goes I'll go and fetch {riftFriend} back. Rift or no rift.", "Don't talk about it."],
    shy: ["...Every time the sky opens.", "...I don't say. But yes."],
    curious: ["I've asked. {RiftFriend} doesn't know. I respect that. I hate it.", "It depends on the door. Whether it's both ways."],
    dreamy: ["I dream {riftFriend} walks into the light and waves. Then I wake up and check.", "If {riftFriend} went, I'd leave a lamp in the window forever."],
    witty: ["If {riftFriend} goes, who'll eat my terrible cooking?", "Worry? I've already started hiding {riftFriend}'s boots."],
    proud: ["{RiftFriend} has a home here now. I've made sure of it.", "I'd understand. I'd still be proud of {riftFriend}."],
  });
  byTemper('rift.hill.folk.whatsay', {
    cheerful: ["I'd say welcome! With a hug! A big one!", "I'd say hello and give them a cake! Everyone likes cake!"],
    shy: ["...Hello. Just hello.", "...I'd probably just nod."],
    dreamy: ["I'd ask what their home was like. And just listen.", "I'd say you're welcome here, and mean it."],
    witty: ["'Lovely weather for falling out of the sky.'", "I'd start with an apology for my neighbors."],
    proud: ["I'd welcome them properly, as is right.", "I'd tell them how things are done here."],
    gloomy: ["I'd say sorry. For the staring.", "Something kind. Nobody said anything kind to me when I needed it."],
  });
  byTemper('rift.hill.folk.weather', {
    cheerful: ["The weather! Of course! I love talking about the weather!", "Ha! Yes! Weather! Easy!"],
    ornery: ["Weather. Fine. It's always bad. I'll tell them that.", "Weather. Safe ground."],
    shy: ["...The weather. I can manage the weather.", "*smiles* Yes."],
    curious: ["Weather! I wonder what their weather was like!", "Good idea. And then I'll ask about theirs."],
    dreamy: ["The weather. The clouds today look like ships.", "The weather. Then the stars. Then everything."],
    witty: ["Weather. The hobbit's opening move.", "The weather. Then rain. Then a pint."],
    proud: ["I know the weather better than anyone.", "Weather. I'm good at weather."],
    gloomy: ["The weather. It's going to rain.", "Weather. Always gray. Something to say."],
  });
  byTemper('rift.hill.folk.kind', {
    cheerful: ["Kind! Yes! I'll be kind! It's easy!", "Kind it is! Thank you, wizard!"],
    shy: ["...Kind. I'll try.", "*nods*"],
    curious: ["Kind change. I hadn't thought change could be kind.", "Hm. Kindness as the measure. Yes."],
    dreamy: ["Change, but kind. Like spring.", "That's lovely. I'll keep it."],
    witty: ["Kind change. Rarer than kind cats.", "I'll try kind. If it doesn't work I'll try pie."],
    proud: ["Kind. Yes. That's how I was raised.", "I'll be kind. I always am."],
    gloomy: ["Kind. Maybe. I hope so.", "That would be nice."],
  });
  byTemper('rift.hill.folk.tellthem', {
    cheerful: ["Tell {riftFriend}! Yes! Right now! With a cake!", "I will! I'll tell {riftFriend} everything!"],
    ornery: ["Tell {riftFriend}? Ugh. Fine. Quickly.", "I'll say it once."],
    shy: ["...I'll try. Maybe I'll write it down.", "...Okay. Over tea."],
    curious: ["I've never said it out loud. I wonder what {riftFriend}'ll say.", "Good idea. I'll ask {riftFriend} back."],
    dreamy: ["I'll tell {riftFriend} on the hill, at sunset.", "I'll tell {riftFriend}. Like letting a bird go."],
    witty: ["Feelings. Out loud. In a hobbit-hole. Unprecedented.", "Fine. I'll tell {riftFriend}. Then I'll hide."],
    proud: ["I'll tell {riftFriend}. Properly.", "Of course. A friend should know."],
    gloomy: ["I'll tell {riftFriend}. Before it's too late.", "Yes. You never know how long you've got."],
  });
  byTemper('rift.hill.ways.start', {
    curious: ["I wanted to understand it. So I wear it. Then I understand a little more each day.", "Just experimenting! A strip of neon, a gadget. Seeing how it changes things."],
    dreamy: ["The glow reminds me of fireflies. I always loved fireflies.", "A little light about me. Like carrying a star."],
    gloomy: ["Something new. I needed something new. Things were gray.", "It cheers me up. Not much cheers me up."],
  });
  byTemper('rift.hill.ways.why', {
    cheerful: ["It's fun! It glows! Everyone smiles at me!", "Why not? It's lovely! Everything's more fun with a glow!"],
    ornery: ["I wanted to annoy my brother. It worked. Then I liked it.", "Because everyone said I couldn't."],
    shy: ["...It makes me feel brave. Like I'm someone new.", "...A friend gave it to me. I wear it for them."],
    witty: ["The neon was free and the waistcoat was dull.", "It's the only way to find me at night after the Badger."],
    proud: ["I'm not afraid of new things. Somebody has to show the way.", "Because it's the future. I'd rather lead than follow."],
    gloomy: ["It made me feel less stuck.", "I wanted to belong to something. Anything."],
  });
  byTemper('rift.hill.ways.gran', {
    cheerful: ["She did! She screamed! Then she asked for one! Pink!", "Ha! She's coming round! She asked if it comes in lavender!"],
    shy: ["...She doesn't know. I take it off when I visit.", "...I hide it in my pocket at hers."],
    curious: ["She did! And then asked how it worked. Gran's more curious than she lets on.", "She had a fit, then asked how the battery worked. Classic Gran."],
    dreamy: ["Gran said I looked like a will-o'-the-wisp. Then she smiled.", "She cried a bit. Then said Granddad would've worn it."],
    witty: ["Gran's been having fits since the invention of trousers.", "She did. She also had a fit about forks. Gran fits are constant."],
    proud: ["She'll come round. I always win Gran over.", "Gran'll be proud eventually."],
    gloomy: ["She won't speak to me. It's been a week.", "She said I'd forgotten where I came from."],
  });
  byTemper('rift.hill.ways.family', {
    cheerful: ["They love it! Well, half of them do! The other half will!", "My little sister wants one! Mom's furious! It's brilliant!"],
    ornery: ["Family can mind its own business.", "They grumble. They grumble about everything."],
    shy: ["...They don't say much. I can tell they don't like it.", "...Mom keeps asking if I'm all right."],
    curious: ["Split down the middle. The young ones want to try it. The old ones want to ban it.", "It's divided us neatly by age. I'm studying it."],
    dreamy: ["They look at me like I've gone somewhere. I haven't. I'm right here.", "They'll understand one day."],
    witty: ["Dad says I glow like a pub sign. He means it as an insult. I take it as a compliment.", "Mom calls it my 'phase'. It's been a year."],
    proud: ["They'll see I'm right.", "My family respects my choices. Eventually."],
  });
  byTemper('rift.hill.ways.old', {
    cheerful: ["Never! I love both! Neon and second breakfast! Perfect!", "Both! I've both! The best of everything!"],
    ornery: ["Put away? I still smoke my pipe. With a light on it.", "Gone? Never. I'm not daft."],
    shy: ["...I still sing the old songs. Quietly.", "...I keep the old waistcoat. Just in case."],
    curious: ["I'm keeping both and watching which wins. So far it's a draw.", "Interesting question. The old ways have deeper roots."],
    dreamy: ["The old ways are in my bones. The new ones are on my sleeve.", "Both. Like two tunes in one song."],
    witty: ["I've added neon. I haven't subtracted pie.", "Old ways, new lights. Same appetite."],
    gloomy: ["Some. I miss them more than I let on.", "A bit. It's hard to hold both."],
  });
  byTemper('rift.hill.ways.suits', {
    cheerful: ["It does! I knew it! Thank you!", "Hooray! The wizard likes it!"],
    ornery: ["Of course it suits me. Everything suits me.", "Hmph. I didn't ask. ...Thanks."],
    curious: ["Suits me? Interesting. Why do you think?", "Does it? I'll ask a few more people. For a sample."],
    dreamy: ["Like a star on a hobbit. Thank you.", "That's lovely of you."],
    witty: ["It suits me. Tell that to my gran.", "Suits me. Unlike my sense of rhythm."],
    proud: ["It does. I chose well.", "I know. But it's nice to hear."],
    gloomy: ["Does it? ...Thank you. I needed that.", "Really? Okay."],
  });
  byTemper('rift.hill.ways.show', {
    cheerful: ["Show them! Yes! I'll light up the whole supper table!", "Yes! Actions! Not words!"],
    ornery: ["Show them. Fine. They'll still moan.", "I'm not arguing. I'm glowing."],
    shy: ["...Show them. Quietly. I can do that.", "*nods*"],
    curious: ["Show, not argue. A good strategy. I'll test it.", "Hm. Demonstration over debate. Sound."],
    dreamy: ["I'll light the way home for Mom one night. Then she'll see.", "Show them the glow on a dark night."],
    witty: ["Show them. Silently. Glowingly.", "No arguing. Just very bright passive aggression."],
    proud: ["They'll see. I'll make sure of it.", "Show, don't argue. My father's advice too."],
    gloomy: ["I'll try. They might never see.", "Show them. If they look."],
  });
  byTemper('rift.hill.ways.both', {
    cheerful: ["Both! I love being both!", "Two ways, one me! Brilliant!"],
    ornery: ["Both. Fine. As long as nobody makes me choose.", "Both. Don't tell my gran."],
    shy: ["...Both. That feels right.", "*small smile*"],
    curious: ["Both. A hybrid. I'm a new kind of hobbit.", "Two ways, one hobbit. That's a good thesis."],
    dreamy: ["Both. Like dusk. Day and night together.", "Both. That's the nicest thing."],
    witty: ["Both. Twice the traditions. Twice the excuses.", "One hobbit, two ways, three breakfasts."],
    proud: ["Both. And I do both well.", "That's me. Proudly."],
    gloomy: ["Both. Or neither. Some days.", "I hope that's enough."],
  });
  // the hill children, by age
  lines('rift.hill.young.start', [
    { if: { band: 'young' }, text: ['They have SHINY BOOTS. I want shiny boots.', 'There\'s a lady with BLUE HAIR. Real blue! Like a bird!'] },
    { if: { band: 'school' }, text: ['They know about circuits. I\'m learning. I made a light go on. Once.', 'One of them showed me binary with acorns. I can count to eleven in ones and zeros.'] },
    { if: { mood: 'merry' }, text: ['They\'re the BEST. Everything\'s the best today.'] },
  ]);
  lines('rift.hill.young.best', [
    { if: { band: 'young' }, text: ['The glowy bits! And they let you hold the beepy thing!', 'They talk funny! "Ping!" Ping! I say ping now!'] },
    { if: { band: 'school' }, text: ['They know how things work inside. I want to know how things work inside.', 'They don\'t tell you off for asking questions. They LIKE questions.'] },
    { if: { temper: 'child', mood: ['low', 'miserable'] }, text: ['They don\'t laugh at me. Some kids laugh at me. They don\'t.'] },
  ]);
  lines('rift.hill.young.mom', [
    { if: { band: 'young' }, text: ['Mom holds my hand tight when they walk past. Too tight.', 'Mom says be polite! I\'m always polite! Mostly!'] },
    { if: { band: 'school' }, text: ['Mom says they\'re "very interesting" in a voice that means no.', 'Mom doesn\'t mind. Dad minds. Dad minds everything.'] },
    { if: { band: 'youth' }, text: ['Mom minds. I\'m nearly grown. I can talk to who I like.', 'Mom worries I\'ll go rift. Maybe I will.'] },
  ]);
  lines('rift.hill.young.where', [
    { if: { band: 'young' }, text: ['From the moon! No! From a star! A big star!', 'From behind the sky! There\'s another sky back there!'] },
    { if: { band: 'youth' }, text: ['A city called Neverdark. It\'s running out of power. They don\'t like talking about it.', 'From another world. A dying one, they say. Quietly.'] },
  ]);
  lines('rift.hill.young.go', [
    { if: { band: 'young' }, text: ['Now? NOW! Bye! I\'ll say please!', 'I\'m going! I\'m going! Wait for me, wizard!'] },
    { if: { band: 'youth' }, text: ['All right. I\'ll ask. Properly. Don\'t follow me.', 'Okay. I\'ve been meaning to. Thanks.'] },
  ]);
  lines('rift.hill.young.hillbest', [
    { if: { band: 'young' }, text: ['The pond! And the ducks! And the cake!', 'Puddles! The best puddles are here!'] },
    { if: { band: 'youth' }, text: ['The old stories. And knowing everyone. I\'d miss that.', 'The fields at harvest. Everyone together. I like that.'] },
  ]);
  lines('rift.hill.young.askinstead', [
    { if: { band: 'young' }, text: ['Ask! Okay! What\'s your NAME? Like that?', 'I\'ll ask! I\'ll ask SO much!'] },
    { if: { band: 'youth' }, text: ['Ask. Fair. Staring\'s rude. I knew that.', 'Ask instead. Right. I\'ll try.'] },
  ]);
  lines('rift.hill.young.both', [
    { if: { band: 'young' }, text: ['Both! Hee! Both right! Everyone\'s right!', 'BOTH! That\'s the best answer!'] },
    { if: { band: 'youth' }, text: ['Both a bit right. That\'s what grown-ups say when they don\'t know.', 'Both. Hm. Maybe. That\'s actually fair.'] },
  ]);
  lines('rift.hill.kidask.q', [
    { if: { band: 'young' }, text: ['Wizard! Is the sky BROKEN?', 'Did the sky get a hole? Who did it? Was it a dragon?'] },
    { if: { band: 'school' }, text: ['Mister Wizard, my teacher doesn\'t know what the rifts are. Do you?', 'Why do the rifts make that humming noise? Is it a song?'] },
    { if: { mood: ['low', 'miserable'] }, pri: 1, text: ['Wizard? Will the sky fall on us? I had a bad dream.'] },
  ]);
  lines('rift.hill.kidask.door', [
    { if: { band: 'young' }, text: ['A door! Knock knock! Who\'s there? HEE!', 'A DOOR! Can I knock back?'] },
    { if: { band: 'school' }, text: ['A door. Then the people who come out are visitors! Not monsters!', 'Knocking. Huh. Like they want to come in.'] },
  ]);
  lines('rift.hill.kidask.sat', [
    { if: { band: 'young' }, text: ['A BOTTOM! Hahaha! On the SKY!', 'Who? A giant? A cow?'] },
    { if: { band: 'school' }, text: ['Ha. Very funny. Now tell me properly.', 'That\'s silly. ...Was it a giant?'] },
    { if: { band: 'youth' }, text: ['Ha. Right. Seriously, though.', 'Very funny. Not.'] },
  ]);
  lines('rift.hill.kidask.think', [
    { if: { band: 'young' }, text: ['I think it\'s a door to Biscuit Land.', 'I think a star fell and made a hole.'] },
    { if: { band: 'youth' }, text: ['Gran says bad luck. The rift-folk say it\'s home calling them. I think the rift-folk are right.', 'I think it\'s something trying to reach us. On purpose.'] },
  ]);
  lines('rift.hill.kidask.both', [
    { if: { band: 'youth' }, text: ['Both a bit right. Fine. That\'s a grown-up answer, but fine.', 'Both. Okay. I\'ll tell them both. They\'ll both be smug.'] },
  ]);
  lines('rift.hill.kidask.riftside', [
    { if: { band: 'young' }, text: ['The sky people! I\'ll ask the sky people!', 'They know! They came THROUGH!'] },
    { if: { band: 'youth' }, text: ['Makes sense. They\'ve been there. I\'ll ask.', 'Fair. They\'d know best.'] },
  ]);
  lines('rift.hill.kidask.hillside', [
    { if: { band: 'young' }, text: ['Mom knows everything! Mostly!', 'Okay! Mom!'] },
    { if: { band: 'youth' }, text: ['Mom. Hm. She\'s never been through a rift, though.', 'Fine. Mom. But I\'ll ask the others too.'] },
  ]);
  byTemper('rift.hill.supper.start', {
    curious: ["Not yet! But I've planned the menu. Seven dishes, to see what they like best.", "I'm dying to. What do they eat? I'll ask them. Over supper. There."],
    dreamy: ["I keep imagining it. A rift-born at my table, lamp-light on their eye. I should just do it.", "Not yet. I've set an extra place a few times. In case."],
    witty: ["Not yet. I'm still recovering from having my cousins.", "Supper with a stranger. The Proudfoots had one. They're still talking about it. So am I."],
    proud: ["My table's open to anyone. Nobody's asked.", "Of course. My hospitality is well known."],
    gloomy: ["No. My table's too small. And so am I, these days.", "No. Nobody comes to supper any more."],
  });
  byTemper('rift.hill.supper.menu', {
    cheerful: ["Everything! I made everything! We ate till we couldn't move!", "Pie! And more pie! And then pudding!"],
    ornery: ["What I always make. If it's good enough for me it's good enough for them.", "Stew. They ate it. No complaints."],
    shy: ["...Just soup. And bread. I was nervous.", "...Something simple. I didn't want to get it wrong."],
    curious: ["A tasting! A little of everything! I took notes on what they liked!", "Our oldest recipes. I wanted to see their faces."],
    dreamy: ["Mushrooms and honey and fresh bread, by candle-light.", "A summer supper. In the garden. Under the stars."],
  });
  byTemper('rift.hill.supper.reaction', {
    cheerful: ["They loved it! They said it was the best meal ever! I cried!", "They couldn't stop eating! I was so happy!"],
    ornery: ["They ate everything. Didn't leave a scrap. Respect.", "They complained about nothing. Good guests."],
    shy: ["...They said thank you so many times. I didn't know what to do.", "...They were quiet. Then they smiled. That was enough."],
    curious: ["They asked about every dish. Where it came from. How long it took. I loved it.", "They were fascinated. Everything was new. Even salt."],
    witty: ["They thought the gravy was a sauce. Then a soup. Then a religion.", "They called my pie a 'masterpiece'. I'm having that carved on my door."],
    proud: ["They were impressed. As they should be.", "They said it was the best they'd ever had. I believe them."],
    gloomy: ["They were grateful. Too grateful. It broke my heart a little.", "They ate like they hadn't eaten in years. Maybe they hadn't."],
  });
  byTemper('rift.hill.supper.eat', {
    cheerful: ["Ha! Let them! There's always more!", "Eat me out of house? I'd love that!"],
    shy: ["...A little afraid. Not of eating. Of talking.", "...It's not the food. It's the talking."],
    curious: ["I'd like to see how much they can eat. For science.", "Their appetites are fascinating. Have you seen them?"],
    dreamy: ["Let them eat. They've had little enough.", "A full table. I'd like that."],
    witty: ["My pantry has survived three cousins and a goat. It'll survive.", "They can try. My larder's legendary."],
    proud: ["My pantry can feed anyone.", "Afraid? Of a guest? Never."],
    gloomy: ["My pantry's half empty anyway.", "There's not much to eat me out of."],
  });
  byTemper('rift.hill.supper.invite', {
    cheerful: ["Yes! Tonight! I'll make everything!", "Brilliant! I'll invite them now!"],
    ornery: ["Fine. One supper. If they're late, they get it cold.", "All right. Don't make me regret it."],
    curious: ["One supper. And many questions. I'll prepare.", "Yes. I'll make a list of things to ask."],
    dreamy: ["Tonight, with candles. Yes.", "I'll lay the extra place. Like I always meant to."],
    witty: ["One supper. Then I'll know if they snore at the table.", "Fine. If they hate the pie, I'll blame you."],
    proud: ["I'll make it a proper welcome.", "Yes. My best table."],
    gloomy: ["Maybe. If they'd want to.", "All right. It might be nice."],
  });
  byTemper('rift.hill.supper.scones', {
    cheerful: ["They loved the scones! They had five!", "Survived and thrived! Scone champions!"],
    ornery: ["They survived. My scones aren't that hard.", "Of course they did. My scones are perfect."],
    shy: ["*laughs* Just about.", "...They liked them. I think."],
    curious: ["They studied the crumb structure. Then ate it.", "They asked how they were made. I told them. They looked worried."],
    dreamy: ["They held one up to the light like a jewel.", "They said it tasted like a sunny morning."],
    witty: ["Survived, chipped a tooth, asked for seconds. Proper hobbit.", "They thought it was a doorstop. Then a delicacy."],
    proud: ["My scones are famous. They survived just fine.", "They loved them. Naturally."],
    gloomy: ["They did. Barely. I should make softer ones.", "Just about."],
  });
  byTemper('rift.hill.supper.learned', {
    cheerful: ["Loads! Songs! Words! A game with acorns!", "That they're lovely! And they count funny!"],
    ornery: ["That they hold forks wrong. And that it doesn't matter.", "That they're not so different. Don't tell anyone."],
    shy: ["...That they miss their families too.", "...That they're shy too, sometimes."],
    curious: ["How their city works! The power, the trains! Fascinating!", "That their stars are lights! No real stars! Imagine!"],
    dreamy: ["About a city that never sleeps. I dreamed of it after.", "That we're all looking for the same thing. A warm table."],
    witty: ["That rift-folk can't hold their ale. Valuable intelligence.", "That 'full signal' means happy. I said it at breakfast. My husband choked."],
    proud: ["That they respect good cooking.", "That they're decent folk. As I suspected."],
    gloomy: ["That they've lost so much. More than I knew.", "That their city's dying. They didn't say it like that, but I heard."],
  });
  byTemper('rift.hill.supper.table', {
    cheerful: ["The best kind! Yes! Full and loud!", "A full table! I love it!"],
    ornery: ["A full table. And a lot of washing up.", "Hm. Yes. Full's better than empty."],
    shy: ["...Yes. It was nice. Not lonely.", "*smiles*"],
    curious: ["A full table. Every chair a different story.", "Full and interesting. The best combination."],
    dreamy: ["A full table, under the lamp. Like it should be.", "Yes. Like a painting."],
    witty: ["A full table. And an empty pantry.", "Best kind. Worst for the dishes."],
    proud: ["My table's always full. Now it's fuller.", "Yes. And mine's the best."],
    gloomy: ["A full table. It's been a long time.", "Yes. I'd forgotten."],
  });
  byTemper('rift.power.start', {
    cheerful: ["Oh, they're lovely! All that glowing! Like Midsummer every night!", "I love the hum! It sounds like the river's purring!"],
    shy: ["...I don't go near them. But they're pretty from far off.", "...They hum. I like the hum, actually."],
    witty: ["A machine that turns water into light. Next they'll turn ale into wisdom.", "The Humming Nuisance. Best thing to happen to the riverbank."],
    proud: ["I helped with the stonework. Best part of the whole thing.", "They're well built. I'll give them that."],
    gloomy: ["More noise. More change. The river used to be quiet.", "They glow. Everything glows now."],
  });
  byTemper('rift.power.trouble', {
    cheerful: ["Not at all! I love them! The river's happy too, I think!", "Trouble? No! It's exciting!"],
    shy: ["...A bit. Things I don't understand.", "...Sometimes. At night, when they hum."],
    curious: ["Trouble? No. Puzzle me, yes. I've been studying the coil.", "Not trouble. Intrigue."],
    dreamy: ["They sound like sleeping creatures. Breathing. I wonder what they dream.", "Not trouble. They're like the river's new song."],
    witty: ["They trouble me less than my neighbors.", "Not much. The fish seem to have opinions."],
    proud: ["Nothing troubles me. I've seen floods.", "Not at all. I understand them better than most."],
    gloomy: ["A bit. Everything new troubles me.", "They're not ours. That's all."],
  });
  byTemper('rift.power.how', {
    cheerful: ["Yes! Wheel, coil, glow! I understood one bit! The glow bit!", "They showed me! It's magic! It's not magic! It's lovely!"],
    ornery: ["They explained. I nodded. I didn't follow a word. Don't tell them.", "Water, wheel, wire. Simple, they said. Nothing's simple."],
    shy: ["...I watched from the bank. It's clever.", "...A bit. They're very patient explaining."],
    curious: ["The coil spins inside a magnet! The motion makes the current! I've drawn diagrams!", "Rotational energy converted to electrical! Like the mill, but the grain is light!"],
    dreamy: ["The river turns the wheel and the wheel makes light. Like the river's thinking.", "It's like the water is giving its dreams away."],
    witty: ["I asked how it worked. They said 'induction'. I said 'bless you'.", "It's like a mill, but it grinds darkness."],
    proud: ["I understand it perfectly. Mostly. Enough to explain it badly to others.", "I could build one. Given time."],
    gloomy: ["They explained. It's beyond me. Like most things lately.", "Wheels and wires. I'll stick to wheels."],
  });
  byTemper('rift.power.next', {
    cheerful: ["Talking hedges! I'd love a talking hedge!", "Ha! Don't tempt them!"],
    ornery: ["Don't joke. They'd do it.", "Talking hedges. Over my dead body."],
    shy: ["*laughs* Oh, I hope not.", "...Would they talk back?"],
    curious: ["A talking hedge. Actually, with the Relay, it's possible.", "Ha! Technically, they could wire one."],
    dreamy: ["A talking hedge would know all the secrets of the lane.", "Ha. I'd ask it about the birds."],
    proud: ["My hedges speak for themselves. Neatly trimmed.", "Next they'll want to improve my garden. No."],
    gloomy: ["Next? Everything. Nothing'll be left the same.", "Hedges with opinions. That's all we need."],
  });
  byTemper('rift.power.lights', {
    cheerful: ["I love them! The lane looks like a party every night!", "Yes! I can see where I'm going after the Badger!"],
    ornery: ["They're useful. That's all I'll say. They're very useful.", "Fine. They're pretty. Happy?"],
    shy: ["...Yes. I feel safer walking home.", "...They're pretty. Blue and pink."],
    curious: ["Yes! I've been reading by them! At night! Whole books!", "I've noticed the moths love them. I'm studying the moths."],
    dreamy: ["They look like fallen stars on the lane.", "Like glow-worms that decided to stay."],
    witty: ["The lights mean I can see my neighbors' faces. Not always an improvement.", "Pretty. And now I can't pretend I didn't see who left the Badger with whom."],
    proud: ["The lane looks well. I'll grant them that.", "They've done a good job. I'll say so."],
  });
  byTemper('rift.power.river', {
    cheerful: ["The river's lending a hand! I love that!", "Yes! Kind river!"],
    ornery: ["Still the river. Hm. All right.", "Lending. It better get it back."],
    shy: ["...That's nice. The river's kind.", "*nods*"],
    curious: ["The river as a lender. An interesting idea.", "It's not losing anything. It's sharing. Fascinating."],
    dreamy: ["The river sharing its strength. Like an old friend.", "That's lovely."],
    witty: ["The river's always been generous. Ask the fish.", "Lending. With no interest. The river's a terrible banker."],
    proud: ["Our river. Generous, like us.", "Of course. Our river's the best."],
    gloomy: ["Still the river. For now.", "I hope it doesn't mind."],
  });
  byTemper('rift.power.taught', {
    cheerful: ["Have I? Oh! That's lovely!", "We've taught each other! Brilliant!"],
    ornery: ["Taught them? I told them to get off my bank. Same thing.", "Hm. Maybe."],
    shy: ["...Have I? I didn't mean to.", "...Oh. That's nice."],
    curious: ["We've exchanged knowledge. A fair trade.", "Mutual teaching. The best kind."],
    dreamy: ["Like two rivers meeting.", "That's a nice thought."],
    witty: ["I taught them how to complain about the weather. Vital skill.", "Taught them? Mostly where not to stand."],
    proud: ["I have. I'm a good teacher.", "Of course I have."],
    gloomy: ["Maybe. It doesn't feel like much.", "I suppose."],
  });
  byTemper('rift.hill.relay.start', {
    shy: ["...I read it, at the camp. I don't post. Everyone would see.", "...It's a lot. All those little messages."],
    dreamy: ["Little lines of light. Like messages in bottles, floating by.", "It's like a well you shout into, and the whole village shouts back."],
    witty: ["A box that tells you what your neighbor had for breakfast. Revolutionary.", "It's gossip that glows."],
    proud: ["I don't need it. I tell people things to their faces.", "A box. I prefer a well-written letter."],
    gloomy: ["Folk looking at boxes instead of each other.", "More noise. Less talk."],
  });
  byTemper('rift.hill.relay.wiz', {
    cheerful: ["You posted? Ha! That's brilliant! What did you say?", "A wizard on the Relay! I love it!"],
    ornery: ["You? Posting? Disgraceful. ...What did you post?", "A wizard. On a box. Whatever next."],
    shy: ["...I saw. It was nice.", "*giggles*"],
    curious: ["What was your post? How many pings did you get?", "Did it work? Did people respond?"],
    dreamy: ["A wizard's words on the Relay, glowing in the dark. Lovely.", "It must have looked like a spell."],
    proud: ["I saw. Not bad, for a beginner.", "Hm. I could do better."],
    gloomy: ["You too. Everyone's on it now.", "So even the wizard's gone that way."],
  });
  byTemper('rift.hill.relay.tried', {
    cheerful: ["Yes! I wrote 'HELLO!' Everyone pinged! I was so happy!", "Once! It was fun! I'll do it again!"],
    curious: ["Yes! I've posted questions. The answers are fascinating.", "I've tested it. Response time's very fast."],
    dreamy: ["I wrote a little poem. Two lines. Someone pinged it at midnight.", "Once. 'Stars are lovely tonight.' Forty pings."],
    witty: ["Once. I posted 'Who stole my turnip?' Three confessions.", "I tried. I wrote a limerick. It was banned."],
    proud: ["Once. I posted the harvest figures. Everyone needed them.", "I've posted. Properly spelled, unlike most."],
    gloomy: ["Once. Nobody pinged. I haven't tried again.", "No. Nobody would read it."],
  });
  byTemper('rift.hill.relay.hedge', {
    cheerful: ["A hedge! Ha! I love a hedge!", "Yes! A long hedge! I'll shout!"],
    ornery: ["A hedge. Hm. I've shouted over worse.", "Fine. A hedge. Still daft."],
    shy: ["...A hedge. That's less scary.", "*smiles*"],
    curious: ["A hedge with infinite length. Interesting.", "Hm. A hedge. The principle holds."],
    dreamy: ["A hedge in the sky. I like that.", "A long hedge, glowing at night."],
    witty: ["A hedge with spelling mistakes.", "A hedge that never needs trimming."],
    proud: ["My hedge is better.", "I'll stick to my own hedge, thank you."],
    gloomy: ["A hedge. With strangers on the other side.", "Maybe."],
  });
  byTemper('rift.hill.relay.turnips', {
    cheerful: ["Ha! Yes! My turnips deserve fame!", "Please! My turnips need fans!"],
    ornery: ["My turnips don't need a wizard's help.", "Leave my turnips out of it."],
    shy: ["*laughs* Thank you.", "...They are nice turnips."],
    curious: ["How many pings would turnips get? I'd like to know.", "An experiment! Turnip popularity!"],
    dreamy: ["My turnips, glowing on the Relay. Ha.", "Turnips in lights. Lovely."],
    witty: ["My turnips will be famous. Finally.", "Turnip celebrity. I've waited for this."],
    proud: ["My turnips are the finest. Tell everyone.", "Please do. They're excellent."],
    gloomy: ["Nobody cares about turnips.", "Ha. Maybe."],
  });
  byTemper('rift.hill.relay.brave', {
    cheerful: ["Brave! Ha! I'll be braver! I'll post again!", "I'm brave! Hooray!"],
    ornery: ["Brave. Hm. I just wanted to complain.", "Braver than my neighbors. That's not hard."],
    shy: ["...Brave. Really? Thank you.", "*blushes*"],
    curious: ["Brave. Or curious. Sometimes they're the same.", "Hm. I didn't think of it as bravery."],
    dreamy: ["Brave. Like a lantern in a storm.", "That's nice."],
    witty: ["Brave. The Relay is my dragon.", "Brave. Tell my mother."],
    proud: ["Brave. Yes. I always am.", "Of course."],
    gloomy: ["Brave. Or foolish.", "Hm. Thank you."],
  });
  byTemper('rift.hill.old.start', {
    shy: ["...It has. So fast. I can't keep up.", "...Yes. Everything's different."],
    curious: ["It has! Isn't it fascinating? I never thought I'd see so much change in one life!", "Changed? Wonderfully. I'm learning things at eighty."],
    witty: ["Changed? The sky falls in weekly and the young ones say 'ping'. Business as usual.", "It's changed. I've changed. My hip has definitely changed."],
    proud: ["Changed. But we've held our own. Thistledown is still Thistledown.", "Changed, yes. And we've managed well."],
  });
  byTemper('rift.hill.old.better', {
    cheerful: ["Better! Definitely better! More parties!", "Better! More people! More cake!"],
    ornery: ["Worse. ...Mostly worse. Some bits are better. Not many.", "Better and worse. Mostly louder."],
    shy: ["...Different. I don't know.", "...Better, I think. Harder, too."],
    curious: ["Better! Life's more interesting! I'll never be bored again!", "Better, on balance. I've done the sums."],
    dreamy: ["Better. Like a window opened in a stuffy room.", "Better. Stranger. Brighter."],
    witty: ["Better. The gossip's improved enormously.", "Better. Worse. More interesting. Pick one."],
    proud: ["Better, because we've handled it well.", "Better. We've risen to it."],
    gloomy: ["Worse. Or maybe I'm just old.", "Hard to say. Everything feels worse at my age."],
  });
  byTemper('rift.hill.old.miss', {
    cheerful: ["The quiet evenings. But the new ones are lovely too!", "Oh, the old songs. But we still sing them!"],
    ornery: ["The quiet. And knowing where everyone was. And who.", "The way it was. Isn't that enough?"],
    shy: ["...The dark nights. I liked the dark.", "...Knowing every face."],
    curious: ["The simplicity. Though I'd never go back.", "Knowing what tomorrow would bring. That's gone."],
    dreamy: ["The stars, bright and close. Before the lamps.", "Long evenings with nothing but the fire and the owls."],
    witty: ["Being the oldest thing in the valley. Now the sky is.", "Knowing everyone's business. Now there's too much business."],
    proud: ["The respect for the old ways.", "When everyone knew their place."],
  });
  byTemper('rift.hill.old.wiz', {
    cheerful: ["Have you! Tell me! Do they all get happy in the end?", "Lots of valleys! Ooh! Which was your favorite?"],
    ornery: ["A few, have you. And did they all have holes in the sky?", "Hm. And what did you learn?"],
    shy: ["...Do they settle? I hope so.", "...Were they all right? In the end?"],
    curious: ["Every valley changes? How? What patterns?", "Tell me about the others. How did they change?"],
    dreamy: ["Valleys changing like seasons. That's comforting.", "You've watched so many. Like a gardener."],
    witty: ["A connoisseur of changing valleys. Marvelous.", "And you came back to ours. Brave man."],
    proud: ["Ours will handle it best. You'll see.", "And how does ours compare?"],
    gloomy: ["Every valley changes. And every one loses something.", "I suppose they do."],
  });
  byTemper('rift.hill.old.storms', {
    cheerful: ["Oh! My granddad told stories! Green lightning! We loved being scared!", "Green storms! The old ones loved telling it!"],
    ornery: ["There were tales. Nobody believed them. Now look.", "Green weather. Nobody listened."],
    shy: ["...There was a story. About green lightning. It frightened me.", "...My grandma wouldn't speak of it."],
    curious: ["Yes! Green lightning! The Long Meadow! I always wondered if it was real!", "There are records, if you know where to look. Green storms."],
    dreamy: ["Green lightning on summer evenings. Like a door opening.", "My granddad said the sky turned green and sang."],
    witty: ["Green lightning. My granddad said it was the cheese. It wasn't the cheese.", "Green storms. The old folk were right about something."],
    proud: ["My family remembered. We always remember.", "There were tales. My family kept them."],
    gloomy: ["Green lightning. And folk who never came home.", "Storms that took things."],
  });
  byTemper('rift.hill.old.green', {
    cheerful: ["Green like spring! But scary! That's all I know!", "Someone walked into it! Brave or daft!"],
    ornery: ["That's all I know. And it's enough.", "Somebody walked into it. Daft."],
    shy: ["...That's all. I didn't want to know more.", "...It frightened me as a child."],
    curious: ["Someone walked into it! Who? When? I've wondered all my life!", "That's all I know. I'd love to know more."],
    dreamy: ["Someone walked into the green and never came back. Like a fairy tale.", "Green and quiet. And someone gone."],
    witty: ["Someone walked into green lightning. Our family motto ever since: don't.", "That's the whole tale. Short but memorable."],
    proud: ["My family kept that story safe. It mattered.", "That's the tale. As told to me."],
    gloomy: ["Someone gone. That's all the old tales are. Someone gone.", "Never came back. That's the end of it."],
  });
  byTemper('rift.hill.old.young', {
    cheerful: ["Worry? No! They'll be fine! They're clever!", "The young ones will love it! They do already!"],
    ornery: ["They don't listen. They never did. They'll be fine anyway.", "Worry? Constantly. It's my job."],
    shy: ["...A little. They're so trusting.", "...I hope they'll be all right."],
    curious: ["I'm fascinated by them. They're growing up between two worlds.", "They'll be the cleverest generation yet. I'm sure of it."],
    dreamy: ["They'll grow up with stars and neon both. Lucky things.", "They'll have two worlds to dream about."],
    witty: ["Worry? They'll be running the place by next week.", "They'll be fine. It's us old ones who need minding."],
    proud: ["They'll be fine. They come from good stock.", "They'll do us proud."],
    gloomy: ["A bit. They don't know what they're losing.", "Always."],
  });
  byTemper('rift.hill.old.steady', {
    cheerful: ["Gently! Yes! That's how I like it!", "Steady! Ha! I'm steady as a pudding!"],
    ornery: ["Steady. Or stubborn. Same thing.", "Hm. Thank you."],
    shy: ["...Thank you.", "*smiles quietly*"],
    curious: ["Gently. Interesting. Gentle change is rare?", "Steady eye. I'll take that."],
    dreamy: ["Gently. Like a leaf falling.", "That's lovely."],
    witty: ["Steady. My hands disagree.", "Steady eye, wobbly knees."],
    proud: ["Steady. Yes. I've always been.", "Thank you. I have."],
    gloomy: ["Gently. I hope it stays gentle.", "Steady. Or just tired."],
  });
});
