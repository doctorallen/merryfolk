'use strict';
// ---------------------------------------------------------------------------
// The hill-folk on the rift-folk: wary elders and curious youngsters, friends
// made across the lane, the neighbours who've taken up rift ways (and what
// their grannies say), supper with a stranger at the table, the machines
// humming by the river, that Relay, the old days before the sky tore, and the
// questions the children bring the wizard. A kind word here can soften a
// wary hobbit (as a kind post on the Relay does), send someone off to say
// good morning to a rift-born neighbour, or set a supper; a child's answer
// leans them hill or rift. Reads the facts set in talk/rift.js.
// ---------------------------------------------------------------------------

talkPack('rift3', () => {
  const softenSelf = (amt) => (T, v) => { if (typeof relay !== 'function') return; const r = relay(); const s = r.soft || (r.soft = {}); s[v.id] = Math.min(0.6, (s[v.id] || 0) + amt); };
  const natterWith = (key) => (T, v) => { const n = T.F[key]; const o = n && Game.villagers.find((x) => x.first === n && x !== v && !x.leaving); if (o && ACTIONS.chat) v.queue.push({ a: { ...ACTIONS.chat, target: () => ({ other: o }) } }); };
  const heardIt = (lean) => (T, v) => { if (typeof heard === 'function' && v.isGrown()) heard(v, lean); };
  const both = (...fns) => (T, v) => { for (const f of fns) f(T, v); };
  // the wizard arranges a supper: the rift-born neighbour is asked round
  const askToSupper = (T, v) => {
    const n = T.F.riftNeighbour, o = n && Game.villagers.find((x) => x.first === n && x.isRiftborn() && x.isGrown());
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
        { ap: 'advise', say: 'Go and say good morning to {riftNeighbour}. Just that.', to: 'hello', need: { if: { riftNeighbour: (x) => !!x } } },
        { ap: 'tale', say: 'I think they\'re children sent somewhere safe.', to: 'children', need: { if: { riftClues: { min: 2 } } }, soft: true },
      ] },
      like: { line: 'rift.hill.folk.like', go: [
        { ap: 'warm', say: 'Then they\'re lucky to have a neighbour like you.', to: 'glad' },
        { ap: 'ask', say: 'And the rest of the lane? Do they agree?', to: 'others' },
      ] },
      friend: { line: 'rift.hill.folk.friend', go: [
        { ap: 'ask', say: 'How did you and {riftFriend} meet?', to: 'met' },
        { ap: 'ask', say: 'Do you ever worry {riftFriend} might go home?', to: 'worry', need: { open: 1 }, soft: true },
      ] },
      notspoken: { line: 'rift.hill.folk.notspoken', go: [
        { ap: 'advise', say: 'Go and say good morning to {riftNeighbour}. Just that.', to: 'hello', need: { if: { riftNeighbour: (x) => !!x } } },
        { ap: 'ask', say: 'What would you say to one, if you did?', to: 'whatsay' },
      ] },
      feet: { line: 'rift.hill.folk.feet', fx: { fond: 0.01 }, go: [
        { ap: 'ask', say: 'Have you spoken to any of them?', to: [{ to: 'friend', need: { if: { riftFriend: (x) => !!x } } }, 'notspoken'] },
        { ap: 'ask', say: 'But truly, what do you make of them?', to: [{ to: 'fear', need: { if: { riftWary: ['some', 'much'] } } }, 'like'] },
      ] },
      vent: { line: 'rift.hill.folk.vent', fx: { trust: 0.03, flag: 'vented' }, go: [
        { ap: 'comfort', say: 'Change is frightening. It can still be kind.', to: 'kind' },
        { ap: 'advise', say: 'Go and say good morning to {riftNeighbour}. Just that.', to: 'hello', need: { if: { riftNeighbour: (x) => !!x } } },
      ] },
      hello: { line: 'rift.hill.folk.hello', fx: { respect: 0.03, run: both(softenSelf(0.12), natterWith('riftNeighbour')) }, end: true },
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
        { ap: 'warm', say: 'That would do very nicely. Go and say it.', to: 'hello', need: { if: { riftNeighbour: (x) => !!x } } },
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
    { if: { temper: 'witty' }, text: ['They\'re the most interesting thing to happen here since the Proudfoots\' goat ate the post.'] },
    { if: { stage: 'elder', riftWary: ['some', 'much'] }, pri: 1, text: ['In eighty years nobody\'s ever fallen out of the sky. I\'d have liked to finish without it.'] },
    { if: { riftPolicy: 'open', riftWary: ['some', 'much'] }, pri: 1, text: ['Holes for strangers while our own wait two years. That\'s what the Moot did. You can\'t blame me for grumbling.'] },
  ]);
  lines('rift.hill.folk.fear', [
    { text: ['The eyes, for one. They glow. In the dark. Like a cat\'s. A cat with opinions.', 'It\'s the not knowing. Where they\'ve come from. Why. Whether more are coming.'] },
    { if: { temper: 'ornery' }, text: ['They talk to boxes. Out loud. And the boxes answer. Nothing good ever answered from a box.'] },
    { if: { temper: 'shy' }, text: ['They\'re so... sure. They walk up and say hello. Just like that. I don\'t know what to do with my hands.'] },
    { if: { temper: 'gloomy' }, text: ['Things change. Then they don\'t change back. I\'ve seen it with mills and marriages.'] },
    { if: { temper: 'proud' }, text: ['They don\'t know our ways. They sit in the wrong chairs. They whistle at the table. It\'s not right.'] },
    { if: { stage: 'elder' }, text: ['My old mum used to say: nothing good comes out of a green storm. I\'ve never forgotten it.'] },
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
    { text: ['{RiftFriend}? Best friend I\'ve made in twenty years. Never thought it\'d be one from the sky.', 'Oh, {riftFriend}\'s grand. Comes round most evenings. Eats my biscuits. I\'d be lost without.'] },
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
    { if: { riftNeighbour: (x) => !!x }, text: ['There\'s {riftNeighbour}, down the lane. I\'ve never said more than good morning. Not even that, lately.'] },
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
    { if: { riftNeighbour: (x) => !!x }, pri: 1, text: ['{RiftNeighbour}. All right. Good morning to {riftNeighbour}. I\'ll take a scone, in case.'] },
    { if: { temper: 'ornery' }, text: ['Fine. Good morning. If they say anything back, I\'m blaming you.'] },
    { if: { temper: 'shy' }, text: ['...Will you stand nearby? Not close. Nearby.'] },
  ]);
  lines('rift.hill.folk.children', [
    { text: ['Children sent somewhere safe. ...Like we sent the little ones up the hill, the year of the flood.', 'Safe. Here. ...Well. I\'d want someone to take in mine, if it came to it.'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['And one of ours went first. Fernsby. So they\'re our children\'s children, in a manner of speaking. Bless me.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. ...Children. All right. I\'ll stop calling them strangers. I\'ll call them lodgers.'] },
  ]);
  lines('rift.hill.folk.glad', [{ text: ['Get away with you. I just do what anyone would.', 'Oh, I don\'t know about that. They\'re lucky in the pies, I\'ll grant you.'] }, { if: { temper: 'proud' }, text: ['They are. I\'ve always been a good neighbour.'] }]);
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
        { ap: 'jest', say: 'Get her a visor. See what happens.', to: 'suits' },
      ] },
      family: { line: 'rift.hill.ways.family', go: [
        { ap: 'advise', say: 'Show them. Don\'t argue. Show them.', to: 'show' },
        { ap: 'comfort', say: 'They\'ll come round. Families do, slowly.', to: 'old' },
      ] },
      old: { line: 'rift.hill.ways.old', go: [
        { ap: 'warm', say: 'Two kinds of ways, one hobbit. That\'s not a bad thing to be.', to: 'both' },
        { ap: 'jest', say: 'Second breakfast with a visor on. The future is strange.', to: 'suits' },
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
    { if: { riftFriend: (x) => !!x }, pri: 1, text: ['{RiftFriend}. Rubs off on you. One day you\'re lending a spanner, next you\'re saying "copy that".'] },
    { if: { temper: 'curious' }, text: ['I wanted to understand it. You can\'t understand a thing from the outside. You have to wear it.'] },
    { if: { temper: 'dreamy' }, text: ['It feels like wearing a little piece of another sky. I like having it about me.'] },
  ]);
  lines('rift.hill.ways.gran', [
    { text: ['She has! She calls it my "electrical phase". She also calls the Relay "that wireless".', 'Gran says neon is how the devil reads in the dark. She also asked if it came in green.'] },
    { if: { stage: 'elder' }, pri: 1, text: ['I AM the grandmother. And I\'ve had my fit. Now I\'ve a glowing shawl.'] },
    { if: { temper: 'ornery' }, text: ['Gran\'s had a fit about everything since the invention of the spoon.'] },
  ]);
  lines('rift.hill.ways.family', [
    { text: ['Half of them love it, half of them pretend not to. The other half are hiding my visor.', 'Mum tuts. Dad borrowed it. Don\'t tell mum.'] },
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
        { ap: 'ask', say: 'Does your mum mind them?', to: 'mum' },
        { ap: 'tale', say: 'Do you know where they come from?', to: 'where' },
      ] },
      best: { line: 'rift.hill.young.best', go: [
        { ap: 'advise', say: 'Ask {riftNeighbour} to show you a gadget. Politely.', to: 'go', need: { if: { riftNeighbour: (x) => !!x } } },
        { ap: 'ask', say: 'And what do you like best about the hills?', to: 'hillbest' },
      ] },
      mum: { line: 'rift.hill.young.mum', go: [
        { ap: 'advise', say: 'Your mum\'s right about staring. Ask instead.', to: 'askinstead' },
        { ap: 'warm', say: 'Your mum and the rift-folk will be friends one day.', to: 'both' },
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
    { if: { riftNeighbour: (x) => !!x }, text: ['Have you said hello to {riftNeighbour} yet, {name}?'] },
  ]);
  lines('rift.hill.young.start', [
    { text: ['They\'ve got glowy eyes! Some of them! And blue hair! I want blue hair!', 'I\'ve SEEN them. Up close. Nearly up close. Behind a hedge.'] },
    { if: { riftNeighbour: (x) => !!x }, text: ['{RiftNeighbour} let me hold a blinky thing! It went beep! I nearly dropped it!'] },
    { if: { riftTier: { min: 1 } }, text: ['I\'m practically one. I say "ping" and I\'ve got a strip of light on my jumper. Gran hates it.'] },
    { if: { band: 'youth' }, text: ['Yeah. They\'re all right. Better than all right. They don\'t treat you like a baby.'] },
    { if: { temper: 'gloomy' }, text: ['They\'re scary. One looked at me. Its eye went GREEN.'] },
    { if: { temper: 'curious' }, text: ['I\'ve been following one. For science. She knows. She waves.'] },
    { if: { riftWary: 'much' }, pri: 1, text: ['Mum says don\'t go near them. So I watch from the wall. They\'re very interesting from the wall.'] },
  ]);
  lines('rift.hill.young.best', [
    { text: ['The lights! And they know songs with beeps in. And they let you count on their fingers. They\'ve got metal ones!', 'They tell stories about a city that\'s always awake! Imagine never going to bed!'] },
    { if: { band: 'youth' }, text: ['They talk to you like you\'re grown. And they know how things work. Real things.'] },
    { if: { riftRelay: true }, text: ['The Relay! You can write things on it and everyone sees! I wrote "hello" and forty people said "ping"!'] },
  ]);
  lines('rift.hill.young.mum', [
    { text: ['Mum says don\'t stare. I don\'t stare. I look a lot. That\'s different.', 'Mum says they\'re nice but I\'m not to go in their camp. I\'ve been in their camp twice.'] },
    { if: { riftWary: 'much' }, text: ['Mum doesn\'t like them. She says they\'re "not our sort". What\'s our sort?'] },
    { if: { riftWary: 'none' }, text: ['Mum had one round for supper! He ate SIX potatoes. Mum was so pleased.'] },
  ]);
  lines('rift.hill.young.where', [
    { text: ['Mum says it\'s bad weather. But the rift-folk say it\'s a door. A door in the SKY.', 'From a city behind the sky. My friend says. Gran says that\'s nonsense and they\'re from Bree.'] },
    { if: { riftNeighbour: (x) => !!x }, text: ['{RiftNeighbour} says it\'s a train. A train in the sky! Dad says it\'s a storm. Which is it?'] },
    { if: { temper: 'curious' }, text: ['I think it\'s a hole in the sky and on the other side there\'s ANOTHER sky. With other hobbits. Upside down.'] },
  ]);
  lines('rift.hill.young.go', [
    { text: ['Can I? Now? I\'m going NOW. Politely! I\'ll say please twice!', 'Okay! I\'ll ask! If they say no I\'ll ask again tomorrow.'] },
    { if: { riftNeighbour: (x) => !!x }, pri: 1, text: ['{RiftNeighbour}! I\'m going to find {riftNeighbour}! Bye, wizard!'] },
  ]);
  lines('rift.hill.young.hillbest', [
    { text: ['Conkers. And the pond. And Gran\'s stories about the old days. They\'re long but they\'re good.', 'Second breakfast! The rift-folk didn\'t even HAVE second breakfast. We had to teach them.'] },
  ]);
  lines('rift.hill.young.askinstead', [{ text: ['Ask? Like, with words? Okay. I can do words.', 'Ask instead of stare. Okay. I\'ll ask what their eyes are for.'] }]);
  lines('rift.hill.young.both', [
    { text: ['Both? ...That\'s cheating. Wizards can\'t say both.', 'A bit right each! I\'m telling everyone! MUM! THE WIZARD SAYS YOU\'RE A BIT RIGHT!'] },
    { if: { riftNeighbour: (x) => !!x }, text: ['{RiftNeighbour}! The wizard says you\'re a bit right! And so\'s my dad! Bye!'] },
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
        { ap: 'advise', say: 'Listen to your mum. She\'s been here longest.', to: 'hillside' },
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
    { text: ['Mum says it\'s bad weather. But the rift-folk say it\'s a door. A door in the sky.', 'Gran says it\'s a punishment for not eating greens. I think it\'s a train. A sky train!'] },
    { if: { riftNeighbour: (x) => !!x }, pri: 1, text: ['Mum says it\'s bad weather. But {riftNeighbour} says it\'s a train. A train in the SKY.'] },
    { if: { temper: 'curious' }, text: ['I think the sky\'s like a curtain. And somebody on the other side is trying to open it but they can\'t find the middle.'] },
  ]);
  lines('rift.hill.kidask.both', [
    { text: ['Both! ...That\'s cheating. *runs off* MUM! THE WIZARD SAYS YOU\'RE A BIT RIGHT!', 'Both a bit right! I\'m going to tell everyone! Bye!'] },
    { if: { riftNeighbour: (x) => !!x }, pri: 1, text: ['Both! *runs off* {RiftNeighbour}! THE WIZARD SAYS YOU\'RE A BIT RIGHT!'] },
  ]);
  lines('rift.hill.kidask.riftside', [{ text: ['The rift-folk! I\'ll ask them! I\'ll ask them EVERYTHING.', 'From the other side! I\'m going to go and listen. Really hard.'] }]);
  lines('rift.hill.kidask.hillside', [{ text: ['Mum\'s been here longest. That\'s true. She\'s been here FOREVER.', 'Okay. Mum. But I\'m still going to look at the sky.'] }]);

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
        { ap: 'advise', say: 'You should ask {riftNeighbour} round. One supper.', to: 'invite', need: { if: { riftNeighbour: (x) => !!x } } },
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
        { ap: 'advise', say: 'One supper. You\'ll not regret it.', to: 'invite', need: { if: { riftNeighbour: (x) => !!x } } },
        { ap: 'warm', say: 'They\'d help with the washing up, I\'ll wager.', to: 'table' },
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
    { if: { riftNeighbour: (x) => !!x }, pri: 1, text: ['{RiftNeighbour}? All right. I\'ll send word. Tonight, if the pie\'s ready.'] },
    { if: { temper: 'shy' }, text: ['...You\'ll tell me what to say? No? ...All right. I\'ll ask about the weather.'] },
  ]);
  lines('rift.hill.supper.scones', [{ text: ['Survived and asked for more. Then hid two in a pocket. Like a proper hobbit.', 'One chipped a tooth. Still finished it. I respect that.'] }]);
  lines('rift.hill.supper.learned', [
    { text: ['Counting in ones and noughts. With peas. My children think I\'m clever now.', 'That they call happy "full signal". My lad says it at breakfast now.'] },
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
    { if: { temper: 'curious' }, text: ['Marvellous! I\'ve asked a dozen questions. Understood two answers. Going back for more.'] },
    { if: { temper: 'dreamy' }, text: ['At night they glow like a little town of glow-worms. I go and sit by the river and watch.'] },
    { if: { stage: 'elder' }, text: ['In my day a light was a candle and you went to bed when it guttered. Now the lane stays lit till dawn.'] },
  ]);
  lines('rift.power.trouble', [
    { text: ['Trouble me? Not as such. I just like to know what\'s in my river.', 'A bit. Things that work and nobody knows how. That\'s how dragons start, my gran said.'] },
    { if: { temper: 'ornery' }, text: ['Trouble me? The fish have gone funny. They\'ve not, really. But they might.'] },
    { if: { riftWary: 'none' }, text: ['Not a bit. I charge my lamp there now. Don\'t tell my wife.'] },
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
    { text: ['My grandad told of green storms. Out over the Long Meadow. Green lightning, that took the hay and left the field.', 'There were tales. Lightning the wrong colour, long ago. A summer evening. My nan wouldn\'t speak of it.'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['Green lightning. And the tinker, Fernsby. It\'s in the ledger. My grandad\'s grandad knew the family. Imagine.'] },
  ]);
  lines('rift.hill.old.green', [
    { text: ['Green. Like a beetle\'s back. Someone walked into it, the tale went. Never came back. I thought it was a story to keep us off the meadow.', 'That\'s all I know. Green, and quiet after. The old folk would say "mind the green weather" and change the subject.'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['Fernsby walked into it with a kettle. And now look. His kettle\'s on their sleeves. The sky remembers, I suppose.'] },
  ]);
  lines('rift.hill.old.young', [
    { text: ['Worry? No. They\'ll take what\'s good from both. Young ones always do.', 'A little. They forget the old songs. But they learn new ones. It\'s a fair swap, I suppose.'] },
  ]);
  lines('rift.hill.old.steady', [{ text: ['Steady. Ha. I was steady once. Now I\'m just slow.', 'Gently. Yes. I\'d not thought of it like that. Gently.'] }]);
});
