'use strict';
// ---------------------------------------------------------------------------
// Family, home and love, the fourth part: rows, loss and birthdays. A row
// with someone in the family and making it up, kin who've gone over the
// hills for good and kin away on a trip, a birthday (theirs, when it's the
// birthday hobbit who gives the presents, or a brother's or a mother's),
// a parent hoping the wizard can find their grown child a sweetheart, the
// wizard's own family (they ask), passing the time on family, and two moods
// read from the state: grieving for someone, and smitten.
// ---------------------------------------------------------------------------

talkPack('family4', () => {
  // a grown son or daughter with nobody yet
  addFacts((v, F) => {
    const k = v.isGrown() ? Game.villagers.find((o) => o.parents && o.parents.includes(v.id) && o.stage === 'adult' && !o.spouse && !o.sweetheart && !o.leaving) : null;
    F.singleKid = k ? k.first : null;
    F.singleKidWord = k ? (k.genes.sex === 'f' ? 'daughter' : 'son') : null;
  });

  const has = (x) => x != null && x !== false && x !== '' && !(Array.isArray(x) && !x.length);
  const FB = (...text) => ({ text });
  const G = (...text) => ({ g: true, text });
  const W = (cond, ...text) => ({ if: cond, text });
  const tm = (temper, ...text) => ({ if: { temper }, text });
  const L = (key, guard, rules) => lines(key, rules.map((r) => (r.if || r.g ? { if: { ...(guard || {}), ...(r.if || {}) }, pri: r.pri, text: r.text } : r)));
  const C = 'cheerful', O = 'ornery', S = 'shy', Q = 'curious', D = 'dreamy', Wt = 'witty', P = 'proud', Gl = 'gloomy';
  const visit = (who, kind) => (T, v) => { const o = Game.villagers.find((x) => x.first === T.F[who] && x !== v && !x.leaving); if (o && ACTIONS.whisper_visit) v.queue.unshift({ a: ACTIONS.whisper_visit, extra: { to: o, kind } }); };

  // =====================================================================================
  // A family row, and making it up
  // =====================================================================================
  const RW = { rowKin: has };
  addThread({
    id: 'family.row', label: (F) => `Is all well between you and ${F.rowKin || 'your family'}?`, weight: 1.5, cool: 3,
    when: (F) => !!F.rowKin,
    open: { ask: 'family.row.open' },
    beats: {
      start: { line: 'family.row.start', go: [
        { ap: 'ask', say: 'What happened?', to: 'what' },
        { ap: 'listen', say: '*You wait, and fill your pipe.*', label: 'Wait, and fill your pipe', to: 'what' },
        { ap: 'jest', say: 'Families. Can\'t live with them, can\'t feed them to trolls.', to: 'trolls' },
      ] },
      what: { line: 'family.row.what', fx: { open: 1 }, go: [
        { ap: 'ask', say: 'And whose fault was it? Honestly.', to: 'fault' },
        { ap: 'advise', say: 'Go and make it up. Take {rowKin} something.', to: 'mend' },
        { ap: 'comfort', say: 'Families say the worst things to the ones they love best.', to: 'love' },
      ] },
      trolls: { line: 'family.row.trolls', go: [
        { ap: 'ask', say: 'So what happened?', to: 'what' },
        { ap: 'advise', say: 'Go and make it up. Take {rowKin} something.', to: 'mend', need: { open: 2 } },
      ] },
      fault: { line: 'family.row.fault', fx: { respect: 0.02 }, go: [
        { ap: 'advise', say: 'Then go first. It costs less than you think.', to: 'mend' },
        { ap: 'warm', say: 'Being a bit wrong is very forgivable. In family most of all.', to: 'love' },
      ] },
      love: { line: 'family.row.love', fx: { trust: 0.03 }, go: [
        { ap: 'advise', say: 'Then tell {rowKin} so. Before supper.', to: 'mend' },
        { ap: 'warm', say: 'Shall I put in a word with {rowKin}?', to: 'word', need: { trust: 0.15 }, soft: true },
      ] },
      mend: { line: 'family.row.mend', fx: { respect: 0.05, run: visit('rowKin', 'mend') }, end: true },
      word: { line: 'family.row.word', fx: { promise: { k: 'family.rowword', t: 'You said you\'d put in a word with {rowKin}', days: 3 }, trust: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.row.open', RW, [FB('Is all well at home, {name}?'), G('Is all well between you and {rowKin}, {name}?', 'I hear there were words with your {rowRel}, {name}.')]);
  L('family.row.start', RW, [
    FB('Well enough. Why? What have you heard?', 'Families. You know how it is.'),
    G('{RowKin}? We\'re not speaking. Well. I\'m not. {RowKin} is speaking plenty.', 'Don\'t mention {rowKin}. Not today.'),
    W({ rowRel: ['mother', 'father'] }, 'My {rowRel} and I had words. We always have words. These were worse words.'),
    W({ rowRel: ['sister', 'brother'] }, 'My {rowRel}. Again. Same as when we were six. Only louder.'),
    W({ rowRel: ['wife', 'husband'] }, 'My {rowRel} is sleeping with the coats. Or I am. We haven\'t decided.'),
    W({ rowRel: ['son', 'daughter'] }, 'My {rowRel} said something. I said something back. Now neither of us can take it back.'),
    tm(C, 'Oh, a silly squabble! It\'s nothing! ...It\'s a bit of something.'),
    tm(O, 'All well? With {rowKin}? Ha. Ask {rowKin}. See what you get.', 'There\'s nothing wrong that an apology wouldn\'t fix. Not from me.'),
    tm(S, '...We had a falling out. I don\'t know how to fix it.'),
    tm(Q, 'We disagreed about something. I\'m still not sure what, exactly. That\'s the odd part.'),
    tm(D, 'There\'s a cold wind between us. It came in through a crack I didn\'t see.'),
    tm(Wt, 'All is well. Very well. We\'re having a lovely silence.'),
    tm(P, 'There was a misunderstanding. On {rowKin}\'s part.'),
    tm(Gl, 'No. Not well. It never is, for long.'),
  ]);
  L('family.row.what', RW, [
    FB('It started with the washing up. It ended with my whole life.', 'Something small. Then something old. Then everything we\'d ever not said.'),
    G('{RowKin} said I never listen. I said what? It was a joke. It didn\'t go down well.', '{RowKin} borrowed the good teapot and broke it. It was Gran\'s. Then words were said about Gran.'),
    W({ rowRel: ['mother', 'father'] }, 'My {rowRel} still thinks I\'m a child. Told me how to plant my beans. In front of the neighbours.'),
    W({ rowRel: ['sister', 'brother'] }, 'We were sharing out some old things. It got out of hand. Over a footstool.'),
    W({ rowRel: ['wife', 'husband'] }, 'Money. And the roof. And {rowKin}\'s mother. And the roof again.'),
    W({ rowRel: ['son', 'daughter'] }, '{RowKin} wants to go off somewhere. I said no. I got told I can\'t stop it. I can\'t.'),
    W({ rift: true }, '{RowKin} wants me to stop using the scanner. Says the neighbours talk. Let them.'),
    tm(C, 'Oh, it was silly. About a cake. Who ate it. It was me. I didn\'t say. Then I did.'),
    tm(O, '{RowKin} moved my things. Again. I said something. I\'d say it again.'),
    tm(S, '...I didn\'t say anything. That was the trouble. I should have said something.'),
    tm(Q, 'I asked one question too many. About {rowKin}\'s plans. Apparently it\'s none of my business.'),
    tm(D, 'I forgot something important. An anniversary. {RowKin} hasn\'t forgotten I forgot.'),
    tm(Wt, 'I made a joke. It was a very good joke. It was about {rowKin}.'),
    tm(P, '{RowKin} criticised my garden. My GARDEN. In front of the Proudfoots.'),
    tm(Gl, 'Everything. Years of it. It just came out.'),
  ]);
  L('family.row.trolls', RW, [
    FB('Ha! ...Don\'t tempt me.', 'Trolls would send {rowKin} back.'),
    G('Feed {rowKin} to trolls! Ha! The trolls would complain.'),
    tm(C, 'Ha! Oh, that\'s helped! I feel better already! Not much! A bit!'),
    tm(O, 'Hmph. Not funny. ...A bit funny.'),
    tm(S, '...Ha. Don\'t let {rowKin} hear you.'),
    tm(Q, 'Would trolls eat a hobbit who argues? I suppose they\'d have to catch {rowKin} first.'),
    tm(D, 'Can\'t live with them, can\'t live without them. That\'s the whole of it.'),
    tm(Wt, 'I\'ve looked into it. The trolls have a waiting list.'),
    tm(P, 'That\'s not a very wizardly thing to say.'),
    tm(Gl, 'Not funny. Not today.'),
  ]);
  L('family.row.fault', RW, [
    FB('...Both of us. Mostly me. A bit me. All right, me.', 'Whose fault? ...Mine. I knew that before you asked.'),
    G('{RowKin} started it. I finished it. Badly. I finished it badly.'),
    tm(C, 'Mine! Probably! I always say things too fast!'),
    tm(O, '{RowKin}\'s. ...Mostly. Some of it. A bit of it was mine.'),
    tm(S, '...Mine. I think it\'s always mine.'),
    tm(Q, 'That\'s the question. I\'ve gone over it eleven times. It\'s about sixty-forty. Against me.'),
    tm(D, 'Nobody\'s, really. Things just shift. Like a stream finding a new bed.'),
    tm(Wt, 'Mine, legally. {RowKin}\'s, morally. Neither of us, in a fair world.'),
    tm(P, 'I\'m not in the habit of being at fault. ...This may be an exception.'),
    tm(Gl, 'Mine. Of course mine. It\'s always mine.'),
  ]);
  L('family.row.love', RW, [
    FB('...That\'s true. You only fight with the ones you can\'t lose.', 'The worst things. Yes. Because you know where it hurts.'),
    G('...I do love {rowKin}. That\'s what makes it so awful.'),
    tm(C, 'You\'re right! I love {rowKin} to pieces! That\'s why it hurts so much!'),
    tm(O, '...Hmph. Maybe. Yes. Don\'t tell {rowKin} I said so.'),
    tm(S, '...Yes. That\'s it exactly.'),
    tm(Q, 'Is that why? Because we know each other best? That makes a strange kind of sense.'),
    tm(D, 'Love has thorns. You only feel them when you hold it close.'),
    tm(Wt, 'We love each other enough to be truly horrible. It\'s a family gift.'),
    tm(P, 'I suppose that\'s true. Family brings out the worst. In others.'),
    tm(Gl, 'Then why does it feel like this?'),
  ]);
  L('family.row.mend', RW, [
    FB('...All right. I\'ll take a cake. And say the first word. Ugh.', 'Make it up. Yes. Before it sets hard, like old porridge.'),
    G('I\'ll go and find {rowKin}. Now. Before I lose my nerve.'),
    tm(C, 'You\'re right! I\'ll go now! With flowers! And a hug! A big one!'),
    tm(O, 'Fine. I\'ll go. If {rowKin} slams the door, I\'m blaming you.'),
    tm(S, '...I\'ll go. I\'ll just say sorry. That\'s all I need to say.'),
    tm(Q, 'I\'ll go and ask {rowKin} what {rowKin} meant. Properly this time.'),
    tm(D, 'I\'ll go. Things look different after a walk.'),
    tm(Wt, 'I\'ll take a pie. A peace pie. With a white flag on top.'),
    tm(P, 'I\'ll go. Someone has to be the bigger hobbit. It may as well be me.'),
    tm(Gl, 'I\'ll try. It might not work. I\'ll try.'),
  ]);
  L('family.row.word', RW, [
    FB('Would you? Just to warm the ground?', 'A word from the wizard. {RowKin} might listen to you.'),
    tm(C, 'Oh, would you? Tell {rowKin} I\'m sorry! No, I\'ll tell {rowKin}! You just soften it up!'),
    tm(O, 'Hmph. Don\'t tell {rowKin} I asked. Just... say something.'),
    tm(S, '...Please. I can\'t find the words.'),
    tm(Q, 'What would you say? I want to know, so I can say it better.'),
    tm(D, 'Like a messenger between two castles. Yes. Thank you.'),
    tm(Wt, 'Tell {rowKin} I\'ve been very noble about it. Lie if you must.'),
    tm(P, 'If you think it\'ll help. I don\'t need it. But it might help.'),
    tm(Gl, 'Please. I don\'t know how else to fix it.'),
  ]);

  // =====================================================================================
  // Kin gone over the hills for good
  // =====================================================================================
  const GN = { goneKin: has };
  addThread({
    id: 'family.gone', label: (F) => `You must miss ${F.goneKin || 'them'}`, weight: 1.3, cool: 6,
    when: (F) => !!F.goneKin && F.stage !== 'child',
    rel: (F) => (F.goneDays != null && F.goneDays <= 6 ? 2 : 1),
    open: { comfort: 'family.gone.open' },
    beats: {
      start: { line: 'family.gone.start', go: [
        { ap: 'listen', say: '*You say nothing, and sit with them.*', label: 'Sit with them', to: 'tell' },
        { ap: 'ask', say: 'What was {goneKin} like?', to: 'like' },
        { ap: 'comfort', say: '{GoneKin} would be proud of you.', to: 'proud' },
      ] },
      tell: { line: 'family.gone.tell', fx: { feel: 'drawn_out', trust: 0.03 }, go: [
        { ap: 'ask', say: 'Do you think {goneKin} found it? Whatever was over the hills?', to: 'found' },
        { ap: 'advise', say: 'Sit by the stone a while. Talk to {goneKin}. It helps.', to: 'stone' },
      ] },
      like: { line: 'family.gone.like', go: [
        { ap: 'ask', say: 'Tell me something that would make {goneKin} laugh.', to: 'laugh' },
        { ap: 'listen', say: '*You nod, and let them go on.*', label: 'Let them go on', to: 'tell' },
      ] },
      proud: { line: 'family.gone.proud', go: [
        { ap: 'ask', say: 'What was {goneKin} like?', to: 'like' },
        { ap: 'tale', say: 'In the old tales, those who go over the hills find the sea.', to: 'sea' },
      ] },
      laugh: { line: 'family.gone.laugh', fx: { fond: 0.03, joke: { k: 'family.gonelaugh', t: 'Something {goneKin} used to say.' } }, go: [
        { ap: 'tale', say: 'In the old tales, those who go over the hills find the sea.', to: 'sea' },
        { ap: 'warm', say: 'Then keep saying it. That\'s how they stay.', to: 'stay' },
      ] },
      found: { line: 'family.gone.found', go: [
        { ap: 'tale', say: 'In the old tales, those who go over the hills find the sea.', to: 'sea' },
        { ap: 'warm', say: 'I think so. I think {goneKin} went gladly.', to: 'stay' },
      ] },
      stone: { line: 'family.gone.stone', fx: { respect: 0.02, run: (T, v) => { if (ACTIONS.visit_stone && ACTIONS.visit_stone.avail(v)) v.queue.unshift({ a: ACTIONS.visit_stone }); } }, end: true },
      sea: { line: 'family.gone.sea', fx: { trust: 0.04, remember: 'The wizard said {goneKin} has found the sea.', rv: 1 }, end: true },
      stay: { line: 'family.gone.stay', fx: { trust: 0.03 }, end: true },
    },
    end: { fond: 0.03 },
  });
  L('family.gone.open', GN, [FB('You must miss them, {name}.'), G('You must miss {goneKin}, {name}.', 'I was sorry to hear {goneKin} had gone over the hills, {name}.', 'I think of {goneKin} sometimes, {name}. Your {goneRel}.')]);
  L('family.gone.start', GN, [
    FB('...Every day. Little things. A cup left out. A chair.', 'I do. More than I say.'),
    G('{GoneKin}. Yes. I still turn round to tell {goneKin} things.', '"Off I go, don\'t wait up." That\'s what {goneKin} said. I keep waiting up.'),
    W({ goneRel: ['mother', 'father'] }, 'My {goneRel}. Yes. I hear {goneKin} in my own voice sometimes. It stops me cold.'),
    W({ goneRel: ['wife', 'husband'] }, 'My {goneRel}. Fifty years. Then a pack on the back and a wave at the gate.'),
    W({ goneRel: ['son', 'daughter'] }, 'My {goneRel}. You\'re not meant to see your children go first. Even over the hills.'),
    W({ goneRel: ['sister', 'brother'] }, 'My {goneRel}. We were never apart. Not really. Not till now.'),
    W({ goneDays: { max: 4 } }, 'It\'s only been a few days. I keep thinking {goneKin}\'ll come back for something. A scarf.'),
    tm(C, 'Oh, I do. But {goneKin} would hate me moping! So I don\'t! Mostly. At night, a bit.'),
    tm(O, '...Of course I do. What sort of question is that. ...Sorry. Yes. Every day.'),
    tm(S, '...Yes. I don\'t talk about it.'),
    tm(Q, 'I do. I keep wondering where {goneKin} is now. Exactly where. Which road.'),
    tm(D, 'Sometimes at dusk I think I see {goneKin} on the West Road. Then it\'s just a tree.'),
    tm(Wt, 'I miss {goneKin}\'s terrible jokes. I\'ve started telling them. They\'re still terrible.'),
    tm(P, '{GoneKin} went on a great adventure. As our family does. ...Yes. I miss {goneKin}.'),
    tm(Gl, 'Everyone goes, in the end. That\'s all there is to it.'),
  ]);
  L('family.gone.tell', GN, [
    FB('...Thank you. Most folk can\'t sit with it. They talk.', '...It\'s the quiet, after. Nobody warns you about the quiet.'),
    G('...{GoneKin}\'s chair is still by the fire. Nobody sits in it. Not even the cat.', '...I talk to {goneKin} in the garden. About the beans. {GoneKin} always had views on beans.'),
    tm(C, '...I smile all day. Then I go home and the hole\'s so quiet. Thank you for sitting.'),
    tm(O, '...Hmph. You\'re all right, wizard. You know when to shut up.'),
    tm(S, '...*leans against you, just a little*'),
    tm(Q, '...I keep thinking of things I should have asked. Hundreds of things.'),
    tm(D, '...The garden misses {goneKin} too. The roses came up wrong this year.'),
    tm(Wt, '...You\'re the first person who hasn\'t told me a story about their own aunt.'),
    tm(P, '...I don\'t cry in front of folk. ...This doesn\'t count.'),
    tm(Gl, '...I don\'t think it gets better. I think you just get used to it.'),
  ]);
  L('family.gone.like', GN, [
    FB('Stubborn. Kind. Hopeless with money. Wonderful with bread.', 'Loud. Always loud. Laughed like a door banging.'),
    G('{GoneKin} could grow anything. Stick a twig in the ground and {goneKin} would have pears by spring.', '{GoneKin} sang off-key on purpose. To make us laugh. It always worked.'),
    W({ goneRel: ['mother', 'father'] }, 'Strict. Then soft as butter when nobody was looking. Taught me everything I know about pastry.'),
    W({ goneRel: ['wife', 'husband'] }, 'The kindest hobbit I ever met. And the most annoying. Both, at once, every day.'),
    tm(C, 'Wonderful! The best! Always laughing! You\'d have loved {goneKin}!'),
    tm(O, 'Difficult. Like me. We got on like a house on fire. Both of us shouting.'),
    tm(S, '...Gentle. {GoneKin} never made me feel small.'),
    tm(Q, '{GoneKin} knew every star by name. Every one. I only know three.'),
    tm(D, '{GoneKin} always wanted to see the sea. Said it was calling. I think that\'s where {goneKin} went.'),
    tm(Wt, 'Sharp. Sharper than me. Never let me win a single argument. I miss losing.'),
    tm(P, 'A fine hobbit. Respected by everyone. I try to live up to it.'),
    tm(Gl, 'Better than me. Much better.'),
  ]);
  L('family.gone.proud', GN, [
    FB('...Do you think so? I hope so.', '{GoneKin} would say I\'m doing it all wrong. Then help.'),
    tm(C, 'Oh, I hope so! I try every day to make {goneKin} proud!'),
    tm(O, 'Proud? {GoneKin} would have something to say about my gutters.'),
    tm(S, '...Thank you. I needed to hear that.'),
    tm(Q, 'How do you know? Did {goneKin} ever say anything? About me?'),
    tm(D, 'I like to think {goneKin} can see. From wherever the road goes.'),
    tm(Wt, 'Proud? {GoneKin} would be appalled. Lovingly appalled.'),
    tm(P, 'I believe so. I\'ve kept the family name well.'),
    tm(Gl, 'I don\'t know. I hope so. I don\'t know.'),
  ]);
  L('family.gone.laugh', GN, [
    FB('"Never trust a hobbit who doesn\'t like mushrooms." {GoneKin} said it about everyone.', '{GoneKin} used to put a spoon on their nose at weddings. Every wedding.'),
    G('{GoneKin} once chased a goose round the party field in a Yule hat. The goose won.'),
    tm(C, 'Ha! {GoneKin} fell in the pond at the spring fair! Twice! Same pond!'),
    tm(O, '{GoneKin} once told the Steward his hat looked like a tea cosy. To his face. I\'ve never been prouder.'),
    tm(S, '...{GoneKin} used to hide notes in my boots. Silly ones. I still check.'),
    tm(Q, '{GoneKin} tried to teach a hen to count. Got to three. The hen, I mean.'),
    tm(D, '{GoneKin} used to dance in the rain. Badly. On purpose.'),
    tm(Wt, '{GoneKin} once said, \'I\'m not old, I\'m vintage.\' Then fell off a stool.'),
    tm(P, '{GoneKin} had excellent wit. Like mine. Where do you think I got it?'),
    tm(Gl, '...{GoneKin} used to say cheer up, it might never happen. Then it did.'),
  ]);
  L('family.gone.found', GN, [
    FB('I hope so. {GoneKin} was always looking for something.', 'I don\'t know. I like to think so.'),
    tm(C, 'Oh, I\'m sure of it! {GoneKin} always found everything! Except keys!'),
    tm(O, 'If {goneKin} didn\'t, they\'ll have given whoever\'s in charge a piece of their mind.'),
    tm(S, '...I hope so. I really hope so.'),
    tm(Q, 'What was {goneKin} looking for? I never asked. I should have asked.'),
    tm(D, 'The sea. {GoneKin} was looking for the sea. I think {goneKin} found it.'),
    tm(Wt, 'Found it, judged it, and suggested improvements, I expect.'),
    tm(P, 'Of course. Our family always finds what it seeks.'),
    tm(Gl, 'Or got lost. Roads are long.'),
  ]);
  L('family.gone.stone', GN, [
    FB('The stone. Yes. I haven\'t been in a while. I\'ll go.', 'Talk to {goneKin}. ...I do, at home. I\'ll go to the stone.'),
    tm(C, 'I\'ll go! I\'ll take flowers! And tell {goneKin} all the news!'),
    tm(O, 'Hmph. Talking to a stone. ...I\'ll go.'),
    tm(S, '...I\'ll go. When nobody\'s there.'),
    tm(Q, 'Does it help? Talking to a stone? I\'ll try it and see.'),
    tm(D, 'I\'ll sit by the stone and watch the swallows. {GoneKin} loved the swallows.'),
    tm(Wt, 'I\'ll tell {goneKin} about you. {GoneKin} would have liked you. Or argued with you.'),
    tm(P, 'I\'ll go. It\'s only right.'),
    tm(Gl, 'It\'s only a stone. ...I\'ll go.'),
  ]);
  L('family.gone.sea', GN, [
    FB('...The sea. Yes. I\'d like that. I\'d like to think that.', 'Do they? Do they truly?'),
    tm(C, 'The sea! Oh! {GoneKin} always wanted to see it! Oh, wizard!'),
    tm(O, '...Hmph. If anyone could get there, {goneKin} could. Stubborn enough.'),
    tm(S, '...Thank you. I\'ll think of that, at night.'),
    tm(Q, 'What\'s it like? The sea? Is it really endless? Tell me everything.'),
    tm(D, 'The sea. Grey and silver and going on forever. {GoneKin} on the shore. Yes.'),
    tm(Wt, 'Found the sea and complained it was too wet, I expect.'),
    tm(P, 'A fitting end to a fine journey.'),
    tm(Gl, '...I\'d like to believe that. I\'ll try.'),
  ]);
  L('family.gone.stay', GN, [
    FB('...Keep saying it. Yes. I will.', 'That\'s how they stay. ...I\'ll remember that.'),
    tm(C, 'I will! Every day! I\'ll tell everyone!'),
    tm(O, '...Hmph. Good advice. For once.'),
    tm(S, '...Thank you. Really.'),
    tm(Q, 'So remembering is a kind of keeping. Yes. That makes sense.'),
    tm(D, 'Like a candle you keep lit in the window.'),
    tm(Wt, 'I\'ll repeat {goneKin}\'s jokes till everyone begs me to stop. {GoneKin} would love that.'),
    tm(P, 'I\'ll keep the memory well. As I keep everything.'),
    tm(Gl, '...Maybe. Maybe that\'s enough.'),
  ]);

  // =====================================================================================
  // Kin away on a trip
  // =====================================================================================
  const AW = { awayKin: has };
  addThread({
    id: 'family.away', label: (F) => `Any word from ${F.awayKin || 'your folk'}?`, weight: 1.2, cool: 2,
    when: (F) => !!F.awayKin && F.stage !== 'child',
    open: { ask: 'family.away.open' },
    beats: {
      start: { line: 'family.away.start', go: [
        { ap: 'ask', say: 'Where do you think {awayKin} is now?', to: 'where' },
        { ap: 'comfort', say: '{AwayKin}\'ll be back before the harvest. They always say so.', to: 'back' },
        { ap: 'jest', say: 'Jealous? Just a little?', to: 'jealous' },
      ] },
      where: { line: 'family.away.where', go: [
        { ap: 'tale', say: 'I know that road. There\'s an inn at the third bend with the best pie west of Bree.', to: 'inn' },
        { ap: 'comfort', say: 'Wherever it is, {awayKin}\'s thinking of home.', to: 'back' },
      ] },
      back: { line: 'family.away.back', fx: { trust: 0.02 }, end: true },
      jealous: { line: 'family.away.jealous', go: [
        { ap: 'ask', say: 'Would you go? If you could?', to: 'go' },
        { ap: 'warm', say: 'Somebody has to keep the kettle warm.', to: 'kettle' },
      ] },
      inn: { line: 'family.away.inn', fx: { fond: 0.02 }, end: true },
      go: { line: 'family.away.go', fx: { learn: ['family.wander', '{Name} has itchy feet too'] }, end: true },
      kettle: { line: 'family.away.kettle', end: true },
    },
    end: { fond: 0.015 },
  });
  L('family.away.open', AW, [FB('Any word from your folk on the road, {name}?'), G('Any word from {awayKin}, {name}?', '{AwayKin}\'s off adventuring, I hear, {name}.')]);
  L('family.away.start', AW, [
    FB('Not a word. I didn\'t expect one. I check the post anyway.', 'Nothing yet. No news is good news, they say. They say a lot.'),
    G('{AwayKin} went off with a pack and a pie. The pie won\'t last the first day.', 'My {awayRel} {awayKin}. Off seeing the world. Leaving me to see the washing.'),
    tm(C, 'No! But I\'m sure {awayKin}\'s having a wonderful time! I\'m sure! ...Aren\'t you?'),
    tm(O, 'Not a word. Typical. {AwayKin} never writes. Never did.'),
    tm(S, '...Not yet. I wait by the gate sometimes.'),
    tm(Q, 'No word! I\'ve been guessing where {awayKin} is from the weather. Is that silly?'),
    tm(D, 'I look at the hills at dusk and imagine {awayKin} on the other side, lighting a fire.'),
    tm(Wt, 'No word. I assume {awayKin} has been captured by elves and is too polite to leave.'),
    tm(P, '{AwayKin} is seeing the world. It runs in our family, adventuring.'),
    tm(Gl, 'Nothing. I lie awake. The roads aren\'t safe, they say.'),
  ]);
  L('family.away.where', AW, [
    FB('Bree, maybe. Or further. {AwayKin} talked about the Old Forest. I hope not the Old Forest.', 'I don\'t know. Somewhere with a sky I haven\'t seen.'),
    tm(C, 'Somewhere wonderful! With mountains! And elves! And a good inn!'),
    tm(O, 'Somewhere wet, with no dinner. Serves {awayKin} right.'),
    tm(S, '...Somewhere safe. I hope.'),
    tm(Q, 'Three days\' walk, if {awayKin} kept to the road. Which {awayKin} won\'t have.'),
    tm(D, 'On a hilltop, looking back this way. I like to think so.'),
    tm(Wt, 'Lost. Asking directions from a sheep.'),
    tm(P, 'Somewhere important, doing something grand.'),
    tm(Gl, 'I don\'t like to think about it.'),
  ]);
  L('family.away.back', AW, [
    FB('Before the harvest. Yes. That\'s what {awayKin} said.', 'I hope so. The kettle\'s ready.'),
    tm(C, 'Of course! With presents! And stories! I can\'t wait!'),
    tm(O, 'And hungry, no doubt. Expecting supper.'),
    tm(S, '...I hope so. Thank you.'),
    tm(Q, 'They always say so? Do they always come back, though? How often?'),
    tm(D, 'Like the swallows. Yes.'),
    tm(Wt, 'Back before the harvest, in time to avoid helping with it.'),
    tm(P, 'Naturally. With tales to tell.'),
    tm(Gl, 'They always say so.'),
  ]);
  L('family.away.jealous', AW, [
    FB('...A little. All right. A lot.', 'Jealous? Me? Of mountains and dragons and no washing up? ...Yes.'),
    tm(C, 'Ha! A bit! But I\'ll hear all about it! That\'s nearly as good!'),
    tm(O, 'Jealous? Of sleeping in ditches? ...Yes. A bit.'),
    tm(S, '...Maybe. I\'d never go, though.'),
    tm(Q, 'Of course! Think what {awayKin}\'s seeing! Everything I\'ve only read about!'),
    tm(D, 'Very. I always wanted to see the world. I never got past the bridge.'),
    tm(Wt, 'Jealous? I\'m furious. {AwayKin} took the good boots.'),
    tm(P, 'I\'ve had my adventures. In my own way.'),
    tm(Gl, 'Jealous and worried. Mostly worried.'),
  ]);
  L('family.away.inn', AW, [
    FB('Ha! Then {awayKin}\'ll never come home.', 'The best pie west of Bree? I hope {awayKin} finds it.'),
    tm(C, 'Ooh! I hope {awayKin} brings me a slice!'),
    tm(O, 'Better than mine? I doubt it.'),
    tm(S, '...That\'s nice. I\'ll think of {awayKin} there.'),
    tm(Q, 'What kind of pie? Pork? Apple? I need to know.'),
    tm(D, 'A warm inn on a cold road. That\'s a good thought to have.'),
    tm(Wt, 'Then I know exactly where {awayKin} is. Third bend. Second helping.'),
    tm(P, 'I make a better pie, I expect.'),
    tm(Gl, 'If {awayKin} gets that far.'),
  ]);
  L('family.away.go', AW, [
    FB('...I would. Just once. Just to see.', 'If I could? Tomorrow. With a pie.'),
    tm(C, 'Yes! I\'d go everywhere! And come back and tell everyone!'),
    tm(O, 'I\'ve thought about it. Then I think about my bed.'),
    tm(S, '...I\'d be frightened. But I\'d go.'),
    tm(Q, 'In a heartbeat. I want to see everything I\'ve read about.'),
    tm(D, 'I\'ve dreamed of it all my life. One day.'),
    tm(Wt, 'I\'d go. I\'d get as far as the bridge and come back for a scarf.'),
    tm(P, 'I could, of course. I simply choose not to.'),
    tm(Gl, 'Too late for me.'),
  ]);
  L('family.away.kettle', AW, [
    FB('Somebody does. And the beds aired.', 'The kettle\'s always warm. Just in case.'),
    tm(C, 'That\'s me! The kettle-keeper! It\'s an important job!'),
    tm(O, 'It\'s always me. Someone has to.'),
    tm(S, '...I like keeping it warm.'),
    tm(Q, 'Keeping a kettle warm for months. I wonder how much wood that is.'),
    tm(D, 'A kettle on the hob and a lamp in the window. For when they come.'),
    tm(Wt, 'I\'ll keep the kettle warm and the pie cold. It\'s my revenge.'),
    tm(P, 'Home needs keeping. It\'s just as important.'),
    tm(Gl, 'And the kettle boils dry, waiting.'),
  ]);

  // =====================================================================================
  // Their birthday (and as is proper, they give the presents)
  // =====================================================================================
  const BD = { bdayToday: true };
  addThread({
    id: 'family.birthday', label: 'Happy birthday!', weight: 2.5, cool: 1,
    when: (F) => F.bdayToday,
    open: { warm: 'family.bday.open' },
    beats: {
      start: { line: 'family.bday.start', go: [
        { ap: 'ask', say: 'And what did you give away this year?', to: 'gave' },
        { ap: 'jest', say: 'And how old? No, don\'t tell me. I\'ll guess. Twelve.', to: 'age' },
        { ap: 'warm', say: 'Many happy returns of the day.', to: 'returns' },
      ] },
      gave: { line: 'family.bday.gave', go: [
        { ap: 'jest', say: 'A mathom, I\'ll wager. Given on with a straight face.', to: 'mathom' },
        { ap: 'warm', say: 'That\'s the best of the custom. Giving.', to: 'returns' },
      ] },
      age: { line: 'family.bday.age', go: [
        { ap: 'ask', say: 'And what did you give away this year?', to: 'gave' },
        { ap: 'warm', say: 'Well, you wear it well. Whatever it is.', to: 'returns' },
      ] },
      returns: { line: 'family.bday.returns', go: [
        { ap: 'ask', say: 'And what would you wish for, this year?', to: 'wish' },
        { ap: 'tale', say: 'On my hundredth birthday I lit a firework the size of a haystack.', to: 'tale' },
      ] },
      mathom: { line: 'family.bday.mathom', fx: { joke: { k: 'family.bdaymathom', t: 'The birthday mathom, given on with a straight face.' } }, end: true },
      wish: { line: 'family.bday.wish', fx: { learn: ['wish', '{wishText}'] }, end: true },
      tale: { line: 'family.bday.tale', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.04, run: (T, v) => { if (typeof feel === 'function') feel(v, 'cheered', T.F.wiz); } },
  });
  L('family.bday.open', BD, [FB('Happy birthday, {name}!', 'Many happy returns, {name}!', 'Is it true? A birthday today, {name}?')]);
  L('family.bday.start', BD, [
    FB('Thank you! I\'ve been up since dawn wrapping presents.', 'It is! I\'ve given away half the hole already!'),
    W({ household: { min: 2 } }, 'Thank you! Presents for everyone at breakfast. As is proper. My purse is empty and I\'m very happy.'),
    W({ party: true }, 'There\'s a party tonight! Under the tree! You\'ll come? You must come!'),
    W({ stage: 'elder' }, 'Thank you. Another one. I stopped counting when the candles set off the smoke bell.'),
    W({ stage: 'child' }, 'IT\'S MY BIRTHDAY! I\'m giving everyone a stone! A good stone! Here\'s yours!', 'I got a present from Mum AND Dad! And I gave the cat a feather!'),
    tm(C, 'Thank you thank you! It\'s the best day of the year! Have a present! I\'ve got loads!'),
    tm(O, 'Hmph. Thank you. Another year. Another round of giving away things I\'d rather keep.'),
    tm(S, '...Oh. You know? ...Thank you. I don\'t like the fuss.'),
    tm(Q, 'Thank you! Did you know the custom started with the Old Took? Or so I read. I\'m checking.'),
    tm(D, 'Thank you. Birthdays always feel like standing on a hill, looking back down the road.'),
    tm(Wt, 'Thank you. I\'m celebrating the anniversary of my greatest achievement. Turning up.'),
    tm(P, 'Thank you. I\'ve given the finest presents on the hill this year, if I say so myself.'),
    tm(Gl, 'Thank you. Another year gone. They go so fast now.'),
  ]);
  L('family.bday.gave', BD, [
    FB('A pot of honey to next door. A scarf to my cousin. A {frag:family.gift} to the postie.', 'Oh, little things. Jars. Socks. A pipe I\'d been meaning to stop using.'),
    W({ mathom: has }, 'The {mathom}. Don\'t tell anyone. It\'ll come back. It always comes back.'),
    W({ spouse: has }, 'I gave {spouse} a new kettle. {Spouse} gave me a look. It\'s our tradition.'),
    W({ littleOne: has }, 'I gave {littleOne} a whistle. I\'ll regret that by teatime.'),
    W({ pastime: has }, 'I made everyone a {madeOne}. Took all season. Everyone pretended to be surprised.'),
    tm(C, 'Everything! I\'ve given away so much! It\'s the best feeling!'),
    tm(O, 'My second-best teapot. To the Proudfoots. They\'ll never know it was second-best.'),
    tm(S, '...Little notes. In jars. With jam. I left them on doorsteps.'),
    tm(Q, 'I made a chart of who\'d like what. It took three weeks. Worth it.'),
    tm(D, 'Pressed flowers in paper. One for every hole on the lane.'),
    tm(Wt, 'A box of old jokes. Wrapped beautifully. Nobody\'s opened it yet. Wise.'),
    tm(P, 'Quality items. Nothing second-hand. Well. Hardly anything.'),
    tm(Gl, 'Nothing much. Nobody needs much from me.'),
  ]);
  L('family.bday.age', BD, [
    FB('Twelve! Ha! Add a few. Add a lot.', 'A lady never says. A gentleman never asks. A wizard never guesses right.'),
    W({ stage: 'elder' }, 'Twelve! Add ninety. Then add whatever you\'re thinking.'),
    W({ stage: 'child' }, 'NO! Older! Much older! I\'m nearly grown!'),
    tm(C, 'Ha! Twelve! I feel twelve! I\'ll take it!'),
    tm(O, 'Twelve. Very funny. My knees would disagree.'),
    tm(S, '...Ha. A bit older than that.'),
    tm(Q, 'In hobbit years or wizard years? Is there a conversion? Do you know your own?'),
    tm(D, 'Some days I feel twelve. Some days a hundred. Today, twelve.'),
    tm(Wt, 'Twelve. In dog years. Which makes me eighty-four. Which is closer.'),
    tm(P, 'Old enough to be distinguished. Young enough to be handsome.'),
    tm(Gl, 'Older than I\'d like. Younger than I feel.'),
  ]);
  L('family.bday.returns', BD, [
    FB('Thank you. That\'s kind of you to say.', 'Many returns! Yes! I\'ll take as many as there are.'),
    tm(C, 'And to you! Wait, it\'s not your birthday! Have a present anyway!'),
    tm(O, 'Hmph. Thank you. One or two more would do.'),
    tm(S, '...Thank you. That\'s nice.'),
    tm(Q, 'Why returns? What returns? The day? It\'s a funny phrase. I like it.'),
    tm(D, 'Happy returns. Like the seasons. Round and round.'),
    tm(Wt, 'Many happy returns. And no returns of the presents, please.'),
    tm(P, 'Thank you. I intend to have a great many.'),
    tm(Gl, 'Thank you. I\'ll take whatever returns are going.'),
  ]);
  L('family.bday.mathom', BD, [
    FB('...How did you know? It\'s been round the lane three times. It\'ll be back by spring.', 'A mathom? Me? ...Yes. With a very nice ribbon.'),
    W({ mathom: has }, 'The {mathom}. Shh. It went to the Proudfoots. They\'ll give it on at theirs.'),
    tm(C, 'Ha! Guilty! But I wrapped it so nicely! With a bow!'),
    tm(O, 'And what of it? That\'s what mathoms are for.'),
    tm(S, '...Is it that obvious? Oh dear.'),
    tm(Q, 'Only one! I\'m tracking where it goes. It\'s like a homing pigeon.'),
    tm(D, 'A mathom given on is a story passed along. That\'s how I see it.'),
    tm(Wt, 'A straight face is the most important part of any present.'),
    tm(P, 'I gave nothing but the best. ...And one small mathom.'),
    tm(Gl, 'It\'ll come back. They always come back.'),
  ]);
  L('family.bday.wish', BD, [
    FB('A quiet year. Good bread. Everyone well.', 'Oh, the usual. Pie. Sun. Nobody poorly.'),
    W({ wish: has }, 'If I\'m honest? {WishText}. Don\'t tell anyone, or it won\'t come true.'),
    tm(C, 'Everything! Another year just like this one!'),
    tm(O, 'Peace and quiet. Which I won\'t get.'),
    tm(S, '...A friend. A new one. Don\'t tell.'),
    tm(Q, 'To learn one completely new thing. Something nobody here knows.'),
    tm(D, 'To see something I\'ve never seen. Just one thing.'),
    tm(Wt, 'More presents. I gave all mine away.'),
    tm(P, 'Recognition. Long overdue.'),
    tm(Gl, 'Another year. That\'s all. Another one.'),
  ]);
  L('family.bday.tale', BD, [
    FB('The size of a haystack! I wish I\'d seen it!', 'Your HUNDREDTH? How many have you had?'),
    tm(C, 'Ooh! Do one for me! Tonight! A small haystack!'),
    tm(O, 'A haystack. I\'d have had words. About the haystack.'),
    tm(S, '...That sounds lovely. And loud.'),
    tm(Q, 'How old ARE you? Nobody knows. Is it a secret?'),
    tm(D, 'A firework like a haystack. Golden. Falling slowly. Oh.'),
    tm(Wt, 'Your hundredth. So you\'re twelve, in wizard years.'),
    tm(P, 'I\'ll expect something similar for mine. Next year.'),
    tm(Gl, 'Did anything catch fire? Things always catch fire.'),
  ]);
  frags('family.gift', ['pickle fork', 'tea cosy', 'egg-timer', 'pair of bookends', 'toast rack', 'wooden duck', 'pressed flower', 'jar of plum jam']);

  // =====================================================================================
  // Someone in the family has a birthday today
  // =====================================================================================
  const KB = { kinBday: has };
  addThread({
    id: 'family.kinbday', label: (F) => `${F.kinBday || 'Someone'}'s birthday today, isn't it?`, weight: 1.6, cool: 1,
    when: (F) => !!F.kinBday && !F.bdayToday,
    open: { ask: 'family.kb.open' },
    beats: {
      start: { line: 'family.kb.start', go: [
        { ap: 'ask', say: 'And what did {kinBday} give you?', to: 'got' },
        { ap: 'jest', say: 'And are you giving {kinBday} anything? Oh, no, wait. Wrong way round.', to: 'custom' },
      ] },
      got: { line: 'family.kb.got', go: [
        { ap: 'warm', say: 'You\'ll treasure that.', to: 'end' },
        { ap: 'jest', say: 'Into the mathom cupboard with it, then?', to: 'cupboard' },
      ] },
      custom: { line: 'family.kb.custom', go: [
        { ap: 'ask', say: 'And what did {kinBday} give you?', to: 'got' },
      ] },
      cupboard: { line: 'family.kb.cupboard', fx: { fond: 0.01 }, end: true },
    },
    end: { fond: 0.015 },
  });
  L('family.kb.open', KB, [FB('Somebody in your family has a birthday today, I hear.'), G('{KinBday}\'s birthday today, isn\'t it, {name}?')]);
  L('family.kb.start', KB, [
    FB('It is! We\'ve had presents since breakfast.', 'It is. There\'ll be cake later. There\'d better be.'),
    G('{KinBday}\'s! Up at dawn with a sack of presents, like always.', 'It is! {KinBday} came round with a parcel and a song. The song was worse than the parcel.'),
    tm(C, 'Yes! I love {kinBday}\'s birthday! Presents and cake and dancing!'),
    tm(O, 'Yes. Up at dawn. Singing. Can\'t abide singing before breakfast.'),
    tm(S, '...Yes. I made a card. I haven\'t given it yet.'),
    tm(Q, 'Yes! How old, though? Nobody will say. I\'ve been doing sums.'),
    tm(D, 'It is. I remember {kinBday}\'s first one. It doesn\'t seem a day ago.'),
    tm(Wt, 'It is. {KinBday} is a year older and no wiser. Like the rest of us.'),
    tm(P, 'It is. We\'ll do it properly. We always do.'),
    tm(Gl, 'Another year. Time goes so fast.'),
  ]);
  L('family.kb.got', KB, [
    FB('A jar of honey. And a hug. The hug was better.', 'A {frag:family.gift}. I\'ve no idea what for. I love it.'),
    tm(C, 'The loveliest {frag:family.gift}! I\'ll put it on the mantelpiece!'),
    tm(O, 'A {frag:family.gift}. I have three. Now I have four.'),
    tm(S, '...A little carved bird. I think {kinBday} made it. For me.'),
    tm(Q, 'A {frag:family.gift}. I\'m trying to work out if it\'s a mathom. I think it\'s a mathom.'),
    tm(D, 'A pressed flower. From the field where we used to play.'),
    tm(Wt, 'A {frag:family.gift}. Which I gave {kinBday} last year. Beautifully rewrapped.'),
    tm(P, 'Something very fine. As befits me.'),
    tm(Gl, 'A {frag:family.gift}. Nice. I suppose.'),
  ]);
  L('family.kb.custom', KB, [
    FB('Ha! No! It\'s {kinBday} who gives! That\'s the custom!', 'Wrong way round, wizard. Wizards. Honestly.'),
    tm(C, 'Ha! You forgot! It\'s the birthday hobbit who gives! The best custom!'),
    tm(O, 'Wrong way round. Do they not teach wizards anything?'),
    tm(S, '...It\'s the other way. But it\'s all right.'),
    tm(Q, 'Do wizards do it the other way? How strange! Tell me about it!'),
    tm(D, 'Giving on your birthday. It\'s like saying thank you for being born.'),
    tm(Wt, 'The wrong way round. Which is the right way, everywhere but here.'),
    tm(P, 'Our custom is the proper one. Older than anyone\'s.'),
    tm(Gl, 'Everyone gets it wrong the first time.'),
  ]);
  L('family.kb.cupboard', KB, [
    FB('Ha! Probably! By next birthday!', 'The mathom cupboard is full. It\'ll go under the bed.'),
    tm(C, 'Never! ...Probably! Ha!'),
    tm(O, 'Straight in. With the others.'),
    tm(S, '...No. I\'ll keep this one.'),
    tm(Q, 'I\'ll tag it. See how far it gets.'),
    tm(D, 'Everything ends up in the mathom cupboard. Even memories.'),
    tm(Wt, 'The mathom cupboard is where presents go to retire.'),
    tm(P, 'Certainly not. It\'s quite valuable.'),
    tm(Gl, 'Everything does, in the end.'),
  ]);

  // =====================================================================================
  // Their turn: a parent hopes the wizard can find their grown child a sweetheart
  // =====================================================================================
  const MM = { singleKid: has };
  addThread({
    id: 'family.matchmake', theirs: true, label: (F) => `About ${F.singleKid || 'their child'}'s prospects`, cool: 6, ask: '{Name} lowers {their} voice. It\'s about {singleKid}.',
    when: (F) => !!F.singleKid && F.met && F.stage !== 'child',
    beats: {
      start: { line: 'family.mm.q', go: [
        { ap: 'advise', say: 'Let {singleKid} find the way alone. Meddling backfires.', to: 'meddle' },
        { ap: 'jest', say: 'I\'ve made matches before. One of them ended with a goat.', to: 'goat' },
        { ap: 'ask', say: 'Does {singleKid} want a sweetheart? Have you asked?', to: 'asked' },
      ] },
      meddle: { line: 'family.mm.meddle', go: [
        { ap: 'warm', say: 'But I\'ll keep an eye out. Quietly.', to: 'eye' },
      ] },
      goat: { line: 'family.mm.goat', go: [
        { ap: 'ask', say: 'Seriously, though. Does {singleKid} want a sweetheart?', to: 'asked' },
        { ap: 'warm', say: 'All right. I\'ll keep an eye out. Quietly.', to: 'eye' },
      ] },
      asked: { line: 'family.mm.asked', go: [
        { ap: 'advise', say: 'Then let it be. Love finds hobbits at the sing-song, not in a plan.', to: 'meddle' },
        { ap: 'warm', say: 'I\'ll keep an eye out. Quietly.', to: 'eye' },
      ] },
      eye: { line: 'family.mm.eye', fx: { promise: { k: 'family.matchmake', t: 'You said you\'d keep an eye out for {singleKid}', days: 10 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.mm.q', MM, [
    FB('Wizard. You know everybody. Is there anyone... suitable? For my youngest?'),
    G('My {singleKidWord}, {singleKid}. No sweetheart. Not a sniff. Is it me? Is it the hole? Can you help?', 'You get about. Have you seen anyone look at {singleKid}? Anyone at all?'),
    tm(C, 'I want {singleKid} to be as happy as I am! Can you find someone? Someone lovely?'),
    tm(O, '{SingleKid}\'s wasting good years. Nearly forty and no sweetheart. Find someone. Please.'),
    tm(S, '...I worry about {singleKid}. Being alone, when I\'m gone. Do you think there\'s someone?'),
    tm(Q, 'How does matchmaking work, exactly? Is there a method? Could you do it for {singleKid}?'),
    tm(D, 'I dream of {singleKid}\'s wedding. Under the party tree. With the lanterns. Help me?'),
    tm(Wt, 'I need a match for {singleKid}. Must enjoy long walks and being lectured by me.'),
    tm(P, '{SingleKid} is a fine catch. The finest. Why is nobody catching?'),
    tm(Gl, 'I worry {singleKid} will end up alone. Like I nearly did.'),
  ]);
  L('family.mm.meddle', MM, [
    FB('...Backfires. Yes. My own mother meddled. I married the other one.', 'Let {singleKid} be. You\'re right. It\'s hard, though.'),
    tm(C, 'Oh, but it\'s such fun to meddle! ...Fine. A little bit less.'),
    tm(O, 'Hmph. Easy to say. You don\'t have to watch.'),
    tm(S, '...You\'re right. I\'ll leave it.'),
    tm(Q, 'Does it always backfire? Is there data? I\'d like to see it.'),
    tm(D, 'Love comes like spring. You can\'t hurry it.'),
    tm(Wt, 'Meddling backfires. Which is why I\'ve asked you to do it.'),
    tm(P, 'I don\'t meddle. I guide.'),
    tm(Gl, 'I\'ll leave it. And worry quietly.'),
  ]);
  L('family.mm.goat', MM, [
    FB('A GOAT? ...Was it a happy match?', 'Ha! I\'ll take my chances. {SingleKid} likes goats.'),
    tm(C, 'Ha! What happened? Did they marry the goat? Tell me!'),
    tm(O, 'I\'ll not have my {singleKidWord} married to a goat.'),
    tm(S, '...A goat? Oh dear.'),
    tm(Q, 'With a goat? How? What went wrong? Step by step, please.'),
    tm(D, 'Love finds strange ways. Even goats.'),
    tm(Wt, 'A goat. Well. Better than the Proudfoots\' boy.'),
    tm(P, 'My {singleKidWord} deserves better than a goat.'),
    tm(Gl, 'With my luck, it\'ll be a goat.'),
  ]);
  L('family.mm.asked', MM, [
    FB('...Asked? No. I just assumed. Doesn\'t everyone?', '{SingleKid} says all\'s well as it is. I don\'t believe a word.'),
    tm(C, 'Asked? Everyone wants a sweetheart! ...Don\'t they?'),
    tm(O, 'I don\'t need to ask. I\'m the parent.'),
    tm(S, '...No. I didn\'t like to.'),
    tm(Q, 'I asked. I got a long answer about the stars. I think it was a no.'),
    tm(D, '{SingleKid} says the right one will come along. Like it did for me.'),
    tm(Wt, 'I asked. {SingleKid} asked me to stop asking. So I\'m asking you.'),
    tm(P, 'There\'s no need to ask. Anyone would want my {singleKidWord}.'),
    tm(Gl, 'I\'m afraid of the answer.'),
  ]);
  L('family.mm.eye', MM, [
    FB('Quietly. Yes. Thank you, wizard.', 'An eye out. That\'s all I ask. Thank you.'),
    tm(C, 'Oh, thank you! You\'re the best! I\'ll bake for the wedding!'),
    tm(O, 'Quietly, mind. If {singleKid} finds out I asked, I\'ll never hear the end.'),
    tm(S, '...Thank you. Don\'t tell {singleKid}.'),
    tm(Q, 'Will you report back? Regularly? I\'d like updates.'),
    tm(D, 'A wizard watching over. That\'s a comfort.'),
    tm(Wt, 'Quietly. Like a wizard. So, with fireworks.'),
    tm(P, 'Good. Someone of quality, please.'),
    tm(Gl, 'Thank you. Even if nothing comes of it.'),
  ]);

  // =====================================================================================
  // Their turn: have you any family, wizard?
  // =====================================================================================
  addThread({
    id: 'family.wizkin', theirs: true, label: 'Have you any family, wizard?', cool: 8, ask: '{Name} looks at you curiously.',
    when: (F) => F.met && F.talks >= 2 && F.stage !== 'child',
    beats: {
      start: { line: 'family.wk.q', go: [
        { ap: 'tale', say: 'Brothers, of a sort. Grey ones. And one in white who thinks he\'s in charge.', to: 'order' },
        { ap: 'share', say: 'No. The road\'s my family. And this valley, these days.', to: 'valley' },
        { ap: 'jest', say: 'A great-aunt who was a tree. Lovely woman. Very still.', to: 'tree' },
      ] },
      order: { line: 'family.wk.order', go: [
        { ap: 'jest', say: 'Every family has one who thinks they\'re in charge.', to: 'charge' },
        { ap: 'share', say: 'We don\'t see each other much. It\'s lonely, sometimes.', to: 'valley' },
      ] },
      tree: { line: 'family.wk.tree', go: [
        { ap: 'share', say: 'No, truly? The road\'s my family. And this valley, these days.', to: 'valley' },
      ] },
      valley: { line: 'family.wk.valley', fx: { trust: 0.05, fond: 0.03 }, go: [
        { ap: 'warm', say: 'Then I\'m a lucky wizard.', to: 'end' },
      ] },
      charge: { line: 'family.wk.charge', fx: { joke: { k: 'family.white', t: 'The wizard has a brother in white who thinks he\'s in charge.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.wk.q', null, [
    FB('Have you any family, wizard? Anyone waiting for you?', 'Do wizards have families? Mothers? Cousins? Somebody\'s got to knit you scarves.'),
    W({ spouse: has }, '{Spouse} and I were wondering. Have you a family? Somewhere?'),
    W({ littleOne: has }, '{LittleOne} asked me if you have a mum. I didn\'t know. Have you?'),
    tm(C, 'Have you got a family? A big one? Do you have Yule together? With fireworks?'),
    tm(O, 'You\'re always round here. Haven\'t you got a family of your own to bother?'),
    tm(S, '...Can I ask... have you got anyone? Family, I mean?'),
    tm(Q, 'I\'ve been wondering. Where\'s your family? How old are they? Are they all wizards?'),
    tm(D, 'Do you ever miss home, wizard? Wherever home was?'),
    tm(Wt, 'Is there a Mrs Wizard? Or is the hat your only companion?'),
    tm(P, 'Our family goes back eleven generations. And yours? It must be very old.'),
    tm(Gl, 'Have you anyone? Or is it just you? On the road, I mean.'),
  ]);
  L('family.wk.order', null, [
    FB('Grey ones! And a white one! Like a set of chess pieces!', 'Brothers. In wizardry. That sounds lonely and grand.'),
    tm(C, 'Ooh! A whole family of wizards! Do you have Yule? Who brings the fireworks?'),
    tm(O, 'Hmph. Every family\'s got one of those.'),
    tm(S, '...That sounds a bit lonely.'),
    tm(Q, 'How many? What colours? Are there blue ones? There must be blue ones.'),
    tm(D, 'Grey and white. Like the sky before snow.'),
    tm(Wt, 'The one in white. Does he tell you off about your hat?'),
    tm(P, 'Then you come from distinguished stock. As I suspected.'),
    tm(Gl, 'Brothers you never see. I know how that is.'),
  ]);
  L('family.wk.tree', null, [
    FB('A TREE? ...You\'re pulling my leg.', 'Ha! Did she grow apples? Was she a nice tree?'),
    tm(C, 'Ha! A tree! I\'ll say hello to every tree now, in case!'),
    tm(O, 'Nonsense. ...Was she?'),
    tm(S, '...Is that true?'),
    tm(Q, 'What kind of tree? Oak? Ash? Can trees be great-aunts? How?'),
    tm(D, 'A tree. That would explain the way you stand so still sometimes.'),
    tm(Wt, 'A tree. And the family resemblance is in the beard.'),
    tm(P, 'A very old tree, I hope. Respectable.'),
    tm(Gl, 'Better company than most relations.'),
  ]);
  L('family.wk.valley', null, [
    FB('...Then you\'ve got us. All of us. Whether you like it or not.', 'This valley? ...Then you\'re family. That\'s that.'),
    W({ hearth: true }, 'You\'ve got us. You\'re under our roof. That makes you family. No arguing.'),
    tm(C, 'Then you\'re ours! You\'re everyone\'s wizard! Come for supper! Every night!'),
    tm(O, 'Hmph. Well. You\'d better behave, then. Family behaves.'),
    tm(S, '...We\'re glad. That you have us. I\'m glad.'),
    tm(Q, 'So we\'re your family? All of us? Even the Proudfoots? That\'s a lot of family.'),
    tm(D, 'A whole valley for a family. That\'s a big hearth.'),
    tm(Wt, 'Then welcome to the family. It\'s chaos. You\'ll fit right in.'),
    tm(P, 'Well, you could do a great deal worse.'),
    tm(Gl, 'We\'ll do our best. We\'re not much, but we\'re here.'),
  ]);
  L('family.wk.charge', null, [
    FB('Ha! Ours is my aunt. Every family has one!', 'Too true. Ours is the cat.'),
    tm(C, 'Ha! Ours is Mum! She\'s wonderful at it!'),
    tm(O, 'In our family that\'s me. And rightly.'),
    tm(S, '...Ours is everyone except me.'),
    tm(Q, 'Who\'s actually in charge, then? In your family? Is anyone?'),
    tm(D, 'Nobody\'s in charge, really. We just think we are.'),
    tm(Wt, 'The one in white. I bet he irons his robes.'),
    tm(P, 'In ours it\'s me. Naturally.'),
    tm(Gl, 'In ours it\'s whoever shouts loudest.'),
  ]);

  // =====================================================================================
  // Passing the time on family (a light opener)
  // =====================================================================================
  addThread({
    id: 'family.pass', light: true, ap: 'ask', label: 'Pass the time on family', open: { ask: 'family.pass.open' },
    when: (F) => F.stage !== 'child',
    beats: {
      start: { line: 'family.pass.reply', go: [
        { ap: 'ask', say: 'And who\'s the character of the family?', to: 'character' },
        { ap: 'jest', say: 'And who\'s the black sheep? There\'s always one.', to: 'sheep' },
        { ap: 'warm', say: 'Family\'s a fine thing to have about you.', to: 'fine' },
      ] },
      character: { line: 'family.pass.character', go: [
        { ap: 'jest', say: 'I\'d like to meet them. From a safe distance.', to: 'end' },
        { ap: 'warm', say: 'Every family needs one.', to: 'end' },
      ] },
      sheep: { line: 'family.pass.sheep', go: [
        { ap: 'jest', say: 'I suspected as much.', to: 'end', fx: { joke: { k: 'family.sheep', t: 'The black sheep of the family.' } } },
        { ap: 'warm', say: 'Black sheep keep a flock interesting.', to: 'end' },
      ] },
      fine: { line: 'family.pass.fine', end: true },
    },
    end: { fond: 0.015 },
  });
  L('family.pass.open', null, [FB('Big family, yours, {name}?', 'Tell me about your folk, {name}.', 'Whose side do you take after, {name}?')]);
  L('family.pass.reply', null, [
    FB('Oh, the usual number. Too many at Yule, not enough at harvest.', 'Big enough. There\'s always a cousin somewhere.'),
    W({ kidCount: { min: 3 } }, 'Big! {KidCountWord} of my own and cousins in every hole. I can\'t keep track.'),
    W({ sibCount: { min: 2 } }, 'There\'s {siblings} and me. We fill a table.'),
    W({ livesAlone: true, spouse: null }, 'Not so big. Just me, mostly. And cousins in Bree I write to at Yule.'),
    W({ rift: true }, 'Back in Neverdark? Seven in a stack. Here? Whoever lets me sit at their table.'),
    tm(C, 'Huge! Wonderful! Everyone\'s related to everyone! It\'s brilliant!'),
    tm(O, 'Too big. Too loud. Too many opinions. All wrong.'),
    tm(S, '...Not very. But I like them.'),
    tm(Q, 'I\'ve been drawing the family tree. It\'s got very tangled around the Tooks.'),
    tm(D, 'Big, once. Scattered, now. Like dandelion seeds.'),
    tm(Wt, 'Big enough that somebody always owes me a pie.'),
    tm(P, 'An old family. Very respected. We take after the right side.'),
    tm(Gl, 'Smaller every year.'),
  ]);
  L('family.pass.character', null, [
    FB('Great-uncle Bungo. Keeps a hedgehog in his waistcoat. Calls it Rupert.', 'My cousin. Tried to sail to Bree. In a barrel.'),
    W({ spouse: has }, '{Spouse}\'s aunt. Comes to every party in the same hat. The hat has a bird on it. Alive.'),
    tm(C, 'Me! Obviously! Ha!'),
    tm(O, 'My uncle. Shouts at the weather. I\'ve taken it up.'),
    tm(S, '...My grandad. He talks to bees. They talk back, he says.'),
    tm(Q, 'My aunt. She\'s been to the mountains. She won\'t say what she saw.'),
    tm(D, 'My gran. She walked to the sea and back when she was young. Nobody believed her.'),
    tm(Wt, 'Me. Though I\'m told it\'s not the compliment I think it is.'),
    tm(P, 'My great-grandfather. He met the Old Took. Shook his hand.'),
    tm(Gl, 'The one who left. There\'s always one who left.'),
  ]);
  L('family.pass.sheep', null, [
    FB('Me. Obviously.', 'My cousin. Ran off with a tinker. Came back with three goats. Nobody\'s sure whose.'),
    tm(C, 'Me! Ha! I painted the family door pink once!'),
    tm(O, 'Not me. ...Possibly me.'),
    tm(S, '...Me. I think. I never went to the parties.'),
    tm(Q, 'My uncle went to Bree and came back with ideas. That was enough.'),
    tm(D, 'The one who wanted to see the world. It\'s always them.'),
    tm(Wt, 'We\'re all black sheep. It\'s a very dark flock.'),
    tm(P, 'There are no black sheep in my family. Only grey ones. Distinguished grey.'),
    tm(Gl, 'Me. I\'m the one they worry about.'),
  ]);
  L('family.pass.fine', null, [
    FB('It is. Most days.', 'Fine and loud. Yes.'),
    tm(C, 'The finest! I wouldn\'t be without a single one!'),
    tm(O, 'From a distance.'),
    tm(S, '...It is. Thank you.'),
    tm(Q, 'Do you think so? Even for wizards?'),
    tm(D, 'Like a warm coat. Heavy, but you\'d be cold without it.'),
    tm(Wt, 'Fine, loud, and always borrowing ladders.'),
    tm(P, 'Especially a family like mine.'),
    tm(Gl, 'When they\'re about.'),
  ]);

  // =====================================================================================
  // Reading the mood: grieving for someone gone
  // =====================================================================================
  addSituation('family.grief', {
    pri: 2, read: (F) => F.feeling === 'missed' && !!F.feelingX, thread: 'family.sit.grief',
    aps: {
      listen: { base: 1, out: ['quiet', 'opens', 'shares'] },
      comfort: { base: 1, out: ['brave', 'leans', 'weeps'] },
      ask: { base: 1, out: ['short', 'tells', 'shares'] },
      jest: { base: 0, out: ['hurt', 'smile', 'laughs'] },
      tale: { base: 1, out: ['quiet', 'tells', 'sea'] },
    },
  });
  lines('sit.family.grief.listen', [{ text: ['*You sit beside them, and say nothing.*'] }]);
  lines('sit.family.grief.comfort', [{ text: ['I\'m sorry, {name}. About {feelingX}.'] }]);
  lines('sit.family.grief.ask', [{ text: ['Tell me about {feelingX}.'] }]);
  lines('sit.family.grief.jest', [{ text: ['{FeelingX} wouldn\'t want you moping, I\'ll bet.'] }]);
  lines('sit.family.grief.tale', [{ text: ['There\'s an old tale about the ones who go over the hills.'] }]);
  addThread({
    id: 'family.sit.grief', situation: true, label: 'Missing someone',
    beats: {
      quiet: { line: 'family.grief.quiet', fx: { trust: 0.01 }, end: true },
      opens: { line: 'family.grief.opens', fx: { trust: 0.03, feel: 'drawn_out' }, go: [
        { ap: 'comfort', say: 'Keep saying it. That\'s how they stay.', to: 'stay' },
        { ap: 'listen', say: '*You nod.*', label: 'Nod', to: 'shares' },
      ] },
      shares: { line: 'family.grief.shares', fx: { trust: 0.05, open: 2 }, go: [
        { ap: 'warm', say: 'Thank you for telling me.', to: 'stay' },
      ] },
      brave: { line: 'family.grief.brave', end: true },
      leans: { line: 'family.grief.leans', fx: { fond: 0.02 }, go: [
        { ap: 'listen', say: '*You let them lean.*', label: 'Let them lean', to: 'shares' },
      ] },
      weeps: { line: 'family.grief.weeps', fx: { trust: 0.05, fond: 0.03 }, end: true },
      short: { line: 'family.grief.short', fx: { sore: { days: 1 } }, end: true },
      tells: { line: 'family.grief.tells', fx: { trust: 0.03 }, go: [
        { ap: 'tale', say: 'In the old tales, those who go over the hills find the sea.', to: 'sea' },
        { ap: 'warm', say: 'Keep saying it. That\'s how they stay.', to: 'stay' },
      ] },
      hurt: { line: 'family.grief.hurt', fx: { fond: -0.03, sore: { days: 2 } }, end: true },
      smile: { line: 'family.grief.smile', go: [
        { ap: 'ask', say: 'Tell me about {feelingX}.', to: 'tells' },
      ] },
      laughs: { line: 'family.grief.laughs', fx: { fond: 0.04 }, go: [
        { ap: 'ask', say: 'Tell me about {feelingX}.', to: 'tells' },
      ] },
      sea: { line: 'family.grief.sea', fx: { trust: 0.04, remember: 'The wizard told me {feelingX} has found the sea.', rv: 1 }, end: true },
      stay: { line: 'family.grief.stay', fx: { trust: 0.02 }, end: true },
    },
  });
  const GR = { feelingX: has };
  L('family.grief.quiet', GR, [FB('...', '*They look away across the fields.*'), G('...{FeelingX}. I can\'t. Not today.')]);
  L('family.grief.opens', GR, [
    FB('...I keep setting a place. Every supper.', '...The house is so quiet. I didn\'t know quiet could be so loud.'),
    G('...{FeelingX} used to hum on the stairs. I keep listening for it.', '...I found {feelingX}\'s pipe in the coat pocket this morning. Still warm, it felt. It wasn\'t.'),
    tm(O, '...Hmph. You\'re a good one for sitting. ...I miss {feelingX}. There.'),
    tm(S, '...Thank you for not saying anything. Everyone says something.'),
    tm(Gl, '...It doesn\'t get easier. Everyone says it will.'),
  ]);
  L('family.grief.shares', GR, [
    FB('...We used to walk to the river every evening. I still go. Alone.', '...The last thing I said was something about the washing. The washing.'),
    G('...{FeelingX} said \'don\'t wait up\'. Like it was nothing. I\'m still waiting up.', '...I talk to {feelingX} when I\'m sure nobody\'s about. Is that daft?'),
    tm(C, '...I put on a brave face for everyone. You\'re the first I\'ve told how it really is.'),
    tm(D, '...At dusk I think I see {feelingX} on the West Road. Every time.'),
  ]);
  L('family.grief.brave', GR, [FB('I\'m fine. Really. Thank you.', 'It\'s all right. We all go, sooner or later.'), G('{FeelingX} would want me to get on. So I\'m getting on.'), tm(P, 'I\'m quite all right, thank you. Our family doesn\'t mope.')]);
  L('family.grief.leans', GR, [FB('...*leans, just a little, against your arm*', '...Thank you. I didn\'t know I needed that.'), G('...Sorry. It\'s just... {feelingX}. You know.')]);
  L('family.grief.weeps', GR, [FB('...*cries, quietly, for a while, and then wipes their face on their sleeve*', '...Oh, wizard. ...Thank you. I\'ve been holding that in for days.'), G('...I miss {feelingX} so much. ...There. I\'ve said it. Thank you.')]);
  L('family.grief.short', GR, [FB('I\'d rather not.', 'Not now, wizard.'), tm(O, 'That\'s my business.'), tm(S, '...I can\'t. Sorry.')]);
  L('family.grief.tells', GR, [
    FB('Stubborn. Kind. Hopeless with money. Wonderful with bread.', 'Laughed like a door banging. Everyone turned round. Every time.'),
    G('{FeelingX} could grow anything. Stick a twig in the ground and there\'d be pears by spring.', '{FeelingX} sang off-key on purpose. To make us laugh. It always worked.'),
    tm(Q, '{FeelingX} knew every star by name. Every one. I only know three.'),
    tm(Wt, '{FeelingX} never let me win an argument. Not one. I miss losing.'),
  ]);
  L('family.grief.hurt', GR, [FB('...That\'s not funny.', 'How would you know what {feelingX} would want?'), tm(O, 'Get out of my sight.'), tm(S, '...*turns away*')]);
  L('family.grief.smile', GR, [FB('...Ha. No. {FeelingX} would\'ve told me off for moping.', '...Maybe. {FeelingX} hated a long face.')]);
  L('family.grief.laughs', GR, [FB('...Ha! No. {FeelingX} would\'ve thrown a cushion at me. ...Thank you.', '*laughs, despite everything* ...{FeelingX} would\'ve liked you.')]);
  L('family.grief.sea', GR, [FB('...The sea. I\'d like to think that.', '...Do they? ...Thank you, wizard.'), tm(D, 'The sea. Grey and silver and going on forever. Yes.')]);
  L('family.grief.stay', GR, [FB('...I will. Every day.', '...That\'s how they stay. I\'ll remember.')]);

  // =====================================================================================
  // Reading the mood: smitten
  // =====================================================================================
  addSituation('family.smitten', {
    pri: 1.5, read: (F) => (F.feeling === 'flowers' || F.feeling === 'wedding') && !!(F.sweetheart || F.spouse), thread: 'family.sit.smitten',
    aps: {
      jest: { base: 1, out: ['flustered', 'giggles', 'jokes'] },
      warm: { base: 1, out: ['blush', 'glows', 'gushes'] },
      ask: { base: 1, out: ['coy', 'gushes', 'gushes'] },
      advise: { base: 0, out: ['huffy', 'blush', 'glows'] },
    },
  });
  lines('sit.family.smitten.jest', [{ text: ['You\'re grinning like a cat in a dairy, {name}.'] }]);
  lines('sit.family.smitten.warm', [{ text: ['You look happy, {name}. It suits you.'] }]);
  lines('sit.family.smitten.ask', [{ text: ['And who\'s put that smile there, {name}?'] }]);
  lines('sit.family.smitten.advise', [{ text: ['Careful, {name}. Hearts are breakable.'] }]);
  addThread({
    id: 'family.sit.smitten', situation: true, label: 'Head over heels',
    beats: {
      flustered: { line: 'family.smit.flustered', end: true },
      giggles: { line: 'family.smit.giggles', fx: { fond: 0.02 }, end: true },
      jokes: { line: 'family.smit.jokes', fx: { fond: 0.03, joke: { k: 'family.dairy', t: 'Grinning like a cat in a dairy.' } }, end: true },
      blush: { line: 'family.smit.blush', end: true },
      glows: { line: 'family.smit.glows', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'Tell me everything.', to: 'gushes' },
      ] },
      gushes: { line: 'family.smit.gushes', fx: { fond: 0.03, trust: 0.02 }, end: true },
      coy: { line: 'family.smit.coy', end: true },
      huffy: { line: 'family.smit.huffy', fx: { fond: -0.02 }, end: true },
    },
  });
  const SM = { sTheir: has };
  L('family.smit.flustered', SM, [FB('I am NOT. ...Am I?', 'A cat in a WHAT? ...Oh, go away.'), tm(S, '*goes the colour of a beetroot*')]);
  L('family.smit.giggles', SM, [FB('*giggles* ...Stop it.', 'Ha! I can\'t help it! I\'ve tried!'), W({ sweetheart: has }, 'Ha! {Sweetheart} brought me flowers! Flowers! Me!')]);
  L('family.smit.jokes', SM, [FB('A cat in a dairy! Ha! I\'ve had all the cream, wizard. All of it.', 'Ha! And you look like a heron in a hat. We\'re both happy.')]);
  L('family.smit.blush', SM, [FB('...Does it? Oh.', '*goes pink to the ears*')]);
  L('family.smit.glows', SM, [FB('I am happy. I\'m so happy I could burst.', 'It\'s been a lovely day. A lovely, lovely day.'), W({ spouse: has }, 'Married! I keep saying it. Married! To {spouse}!')]);
  L('family.smit.gushes', SM, [
    FB('Oh, wizard. Everything is wonderful. The sky. The bread. Even the hens.', 'I can\'t stop smiling. My face hurts. I don\'t care.'),
    W({ sweetheart: has }, '{Sweetheart}! {Sweetheart} brought me flowers! Picked them {sThem}self! There was a beetle in them! I kept the beetle!'),
    W({ spouse: has }, '{Spouse}! We\'re married! {Spouse} carried me over the step and dropped me in the hall! Best day of my life!'),
    W({ temper: O, sweetheart: has }, 'Hmph. Nobody. ...{Sweetheart}. Don\'t tell. ...Flowers. Can you believe it?'),
    tm(P, 'Well. It isn\'t every day one is so admired. I\'m bearing it well.'),
  ]);
  L('family.smit.coy', SM, [FB('Nobody! ...Somebody.', 'I couldn\'t possibly say. ...You know who.')]);
  L('family.smit.huffy', SM, [FB('Thank you for that, wizard. Very cheering.', 'Breakable? Well, mine isn\'t. So there.'), tm(Gl, '...I know. That\'s what frightens me.')]);
  // more of each temper for the two moods
  L('family.grief.quiet', GR, [tm(O, '...Not now.', '*stares at the ground and says nothing*'), tm(S, '...*shakes head*'), tm(C, '...Sorry. I\'m not much company today.'), tm(P, '...I\'d rather be alone, thank you.')]);
  L('family.grief.opens', GR, [
    tm(C, '...I\'ve been smiling all week so nobody worries. It\'s tiring.'),
    tm(Q, '...I keep wondering where {feelingX} is now. Exactly where. Which road.'),
    tm(D, '...The swallows came back this morning. {FeelingX} always noticed them first.'),
    tm(Wt, '...I keep thinking of jokes to tell {feelingX}. Then there\'s nobody to tell.'),
    tm(P, '...We\'re not a family that weeps. But I miss {feelingX}. I\'ll say that.'),
  ]);
  L('family.grief.shares', GR, [
    tm(O, '...I was short with {feelingX}, the last morning. Over nothing. Over porridge.'),
    tm(S, '...I never told {feelingX} how much I... I just never said.'),
    tm(Q, '...There\'s so much I never asked. Where {feelingX} was born. What the old songs meant.'),
    tm(Wt, '...{FeelingX}\'s last words to me were a joke. A bad one. I\'ll treasure it.'),
    tm(P, '...{FeelingX} taught me everything worth knowing. I don\'t know who to ask now.'),
    tm(Gl, '...Everyone goes. I knew that. Knowing doesn\'t help.'),
  ]);
  L('family.grief.leans', GR, [tm(O, '...Hmph. ...Don\'t move.'), tm(S, '...*leans against you, eyes shut*'), tm(C, '...Thank you. I\'ll be all right. Just give me a minute.'), tm(Gl, '...Thank you. Nobody\'s done that.')]);
  L('family.grief.weeps', GR, [tm(O, '...Blast. Blast it. ...Thank you. Don\'t tell anyone.'), tm(P, '...I don\'t do this. ...Thank you for staying.'), tm(Wt, '...Look what you\'ve done. My good handkerchief. ...Thank you.')]);
  L('family.grief.brave', GR, [tm(C, 'Oh, I\'m all right! Really! Life goes on, doesn\'t it!'), tm(O, 'Don\'t fuss. I\'ve work to do.'), tm(Gl, 'It\'s how things are. No use crying.')]);
  L('family.grief.tells', GR, [
    tm(C, '{FeelingX} laughed at everything. Even at funerals. Especially at funerals.'),
    tm(O, '{FeelingX} was the only one who could tell me I was wrong. And I listened.'),
    tm(S, '{FeelingX} never made me feel small. Not once.'),
    tm(D, '{FeelingX} wanted to see the sea. Always the sea.'),
    tm(P, '{FeelingX} was respected. Everyone came to {feelingX} for advice.'),
    tm(Gl, '{FeelingX} was the best of us. It\'s always the best who go.'),
  ]);
  L('family.grief.stay', GR, [tm(C, 'I will! I\'ll tell all the stories! Even the rude ones!'), tm(O, '...Hmph. All right.'), tm(D, 'Like a lamp kept lit. Yes.'), tm(Gl, '...Maybe that\'s enough.')]);
  L('family.smit.glows', SM, [tm(C, 'I could hug the whole village! I might! Stand still!'), tm(S, '...I am. I really am.'), tm(D, 'Everything looks golden today. Even the mud.'), tm(Wt, 'Happy? I\'m disgustingly happy. It\'s very unlike me.'), tm(Gl, 'I am. I keep waiting for the rain. It hasn\'t come.')]);
  L('family.smit.giggles', SM, [tm(O, 'Hmph. I am not grinning. ...I might be grinning.'), tm(P, 'I\'m merely in a good humour. It happens.'), tm(Q, 'Am I? I wonder what my face is doing. I can\'t see it.')]);
  L('family.smit.coy', SM, [tm(S, '...*shakes head, smiling*'), tm(Wt, 'A gentlehobbit never tells. A wizard should never ask.'), tm(Q, 'Who do you think? Go on, guess. I want to see if you know.')]);
  L('family.smit.blush', SM, [tm(C, 'Does it? I feel it does! I feel ten feet tall!'), tm(O, 'Hmph. Don\'t make a thing of it.'), tm(P, 'Happiness becomes everyone. Especially me.')]);

  // =====================================================================================
  // Rift-folk colour, and the old and the young, across the family threads
  // =====================================================================================
  const KH = { stage: 'child' };
  const add = (key, guard, rules) => L(key, guard, rules);
  add('family.spouse.start', { spouse: has, rift: true }, [
    W({}, '{Spouse}\'s good. Still learning which hill-folk words are rude. I keep a list.', 'We\'re synced, {spouse} and me. Mostly. Some days there\'s lag.'),
    W({ spouseTemper: has }, '{Spouse} says I hum in my sleep. Old Neverdark static songs. I didn\'t know.'),
  ]);
  add('family.spouse.met', { spouse: has, rift: true }, [W({}, 'I came through the rift face first into {spouse}\'s cabbages. {Spouse} offered me tea. I offered to fix the gate.', '{Spouse} was the first hill-folk who didn\'t stare at the visor. Looked straight past it. At me.')]);
  add('family.spouse.secret', { spouse: has, rift: true }, [W({}, 'Two kinds of tea. One kettle. And never mock the other one\'s home.', 'Keep the signal open. Say the small things. Don\'t let the battery run down.')]);
  add('family.sweet.start', { sweetheart: has, rift: true }, [W({}, 'Yeah. {Sweetheart}. Full signal. Don\'t make it weird.', 'Walking out. That\'s what you call it here? Back home we called it pinging. This is better.')]);
  add('family.sweet.worry', { sweetheart: has, rift: true }, [W({}, 'What if the rift opens one day and I have to choose? Home or {sweetheart}? I lie awake running the numbers.')]);
  add('family.crush.start', { rift: true }, [W({}, 'Caught my eye? Signal\'s... noisy. Lots of interference. Ask me later.'), W({ crush: has }, 'No comment. Static. Next question.')]);
  add('family.crush.name', { crush: has, rift: true }, [W({}, '...{Crush}. When {crush} laughs, my visor fogs up. That doesn\'t happen. Ever.')]);
  add('family.exp.start', { expecting: true, rift: true }, [W({}, 'A baby. Here. Where it\'s dark at night. Where there are stars. My kid will see stars.', 'I keep humming Down by the Willow Lamp. My gran sang it. I didn\'t know I remembered the words.')]);
  add('family.exp.worry', { expecting: true, rift: true }, [W({}, 'What if the baby\'s more Neverdark than hill? Or more hill than Neverdark? What if nobody\'s ever sure?')]);
  add('family.baby.start', { baby: has, rift: true }, [W({}, '{Baby} sleeps best when I hum the old Neverdark lullaby. Down by the Willow Lamp. Old folk here know it too. Weird.', '{Baby} grabbed my visor and won\'t let go. Strong grip. Takes after the grid side.')]);
  add('family.kids.start', { littleOne: has, rift: true }, [W({}, '{LittleOne} calls the stars \'sky-pixels\'. The hill kids have started saying it too.', '{LittleOne} knows more hill-folk songs than I do. And more Neverdark slang than the hill kids want.')]);
  add('family.kids.mischief', { littleOne: has, rift: true }, [W({}, '{LittleOne} wired the hen-house to beep when there\'s an egg. The hens are furious. The eggs are up.')]);
  add('family.pa.start', { parent: has, rift: true }, [W({}, 'My {parentWord}? Still says Neverdark was better. Every supper. Then asks for seconds of hill-folk stew.')]);
  add('family.sib.start', { sibling: has, rift: true }, [W({}, '{Sibling}\'s gone native. Wears a waistcoat. Took off the visor. I\'m proud. I\'m jealous.')]);
  add('family.hole.start', { home: has, homeless: false, rift: true }, [W({}, 'A hole. In a hill. With a round door. Back home I had a pod with a window onto a wall. I love it here.', 'No hum in the walls. First month I couldn\'t sleep. Now I can\'t sleep anywhere else.')]);
  add('family.hole.room', { home: has, homeless: false, rift: true }, [W({}, 'The window. I sit and watch it get dark. Properly dark. Back home dark was a rumour.')]);
  add('family.lar.start', { home: has, homeless: false, rift: true }, [W({}, 'A larder. Food you can see. On shelves. Back home it was all ration-bars and cold soup in tubes.')]);
  add('family.math.start', { mathom: has, rift: true }, [W({}, 'The {mathom}? Somebody gave it to me. I don\'t get mathoms. You keep a thing you don\'t want? On purpose? I love it.')]);
  add('family.mov.start', { home: has, rift: true }, [W({}, 'My own hole. A door that\'s mine. No stack, no neighbours through the wall. Too quiet. Perfect.')]);
  add('family.hf.start', { hearth: true, rift: true }, [W({}, 'A wizard in the spare room and a rift-born at the table. The neighbours have given up trying to keep track.')]);
  add('family.row.what', { rowKin: has, rift: true }, [W({}, '{RowKin} said I should go back where I came from. As a joke. It didn\'t land. Nothing lands like that.')]);
  add('family.gone.start', { goneKin: has, rift: true }, [W({}, 'Back home we\'d have messages. Recordings. Here there\'s just the chair. Empty. I talk to it.')]);
  add('family.bday.start', { bdayToday: true, rift: true }, [W({}, 'Birthday! Back home you got presents. Here you GIVE them. I\'ve given away my spare battery. Worth it.')]);
  add('family.away.start', { awayKin: has, rift: true }, [W({}, 'No signal from {awayKin}. Out here you just wait. I\'m learning to wait. It\'s like a skill nobody back home had.')]);
  add('family.kh.start', { stage: 'child', rift: true }, [W({}, 'Mum says the dark here is soft. I like it. You can see the stars. They\'re like little lamps nobody has to pay for.')]);
  add('family.hl.before', { homeless: true, rift: true }, [W({}, 'A stack on the ninth tier. Always lit. You\'d fall asleep under a billboard and dream in adverts.')]);

  // the old ones
  add('family.kids.start', { littleOne: has, stage: 'elder' }, [W({}, 'A little one at my age! I chase {littleOne} round the garden and need a lie-down after.')]);
  add('family.sweet.start', { sweetheart: has, stage: 'elder' }, [W({}, 'At my age? Walking out? ...Yes. Slowly. With frequent rests. Don\'t laugh.')]);
  add('family.pa.start', { parent: has, stage: 'elder' }, [W({}, 'My {parentWord}\'s older than the mill. Still sharper than me. Still tells me off.')]);
  add('family.sib.start', { sibling: has, stage: 'elder' }, [W({}, '{Sibling} and I are the last of the old lot. We sit on the bench and correct each other\'s memories.')]);
  add('family.hole.start', { home: has, homeless: false, stage: 'elder' }, [W({}, 'I\'ve lived here all my life. Every scratch on the door frame is somebody\'s height. Mine\'s the lowest.')]);
  add('family.hole.before', { home: has, homeless: false, stage: 'elder' }, [W({}, 'My grandad dug the back room himself. With a spade and a great deal of language.')]);
  add('family.lar.pride', { home: has, homeless: false, stage: 'elder' }, [W({}, 'My mother\'s damson cheese. I\'ve made it seventy autumns. It\'s nearly as good as hers.')]);
  add('family.bday.start', { bdayToday: true, stage: 'elder' }, [W({}, 'Another one! I gave away my old pipe. Fifty years in that pipe. The postie\'s got it now. Lucky postie.')]);
  add('family.gk.start', { grandkid: has, stage: 'elder' }, [W({}, '{Grandkid} climbed on my knee and asked if I was older than the hills. Not quite, I said.')]);
  add('family.gone.start', { goneKin: has, stage: 'elder' }, [W({}, 'At my age they all go before you. You\'d think you\'d get used to it. You don\'t.')]);
  add('family.single.start', { stage: 'elder' }, [W({ single: true }, 'Never wed. Never minded. Well. Minded once. On a spring evening. It passed.')]);

  // the seasons and the weather at home
  add('family.hole.start', { home: has, homeless: false, season: 'winter' }, [W({}, 'In winter it\'s the best place in the world. The fire, the jars, the snow on the round window.')]);
  add('family.hole.start', { home: has, homeless: false, season: 'summer' }, [W({}, 'Cool as a cellar in summer. That\'s the beauty of a hill. Everyone else is melting.')]);
  add('family.hole.start', { home: has, homeless: false, weather: 'rain' }, [W({}, 'Dry, thank goodness. Listen to it out there. In here it\'s all crackle and kettle.')]);
  add('family.hole.worst', { home: has, homeless: false, weather: 'rain' }, [W({}, 'The back step, today. It\'s a pond. A small pond with ambitions.')]);
  add('family.lar.jars', { home: has, homeless: false, season: 'spring' }, [W({}, 'Down to the last few. Spring\'s the hungry gap. I\'m rationing the jam. To three spoons a day.')]);
  add('family.lar.jars', { home: has, homeless: false, season: 'summer' }, [W({}, 'Not yet. Summer\'s for eating. Autumn\'s for worrying. I\'ll worry in autumn.')]);
  add('family.hl.start', { homeless: true, season: 'summer' }, [W({}, 'Out in the meadow. It\'s summer, at least. Warm nights. Midges, though. Midges everywhere.')]);
  add('family.hl.start', { homeless: true, weather: 'snow' }, [W({}, 'In the lee of the mill. Snow\'s soft, at least. Soft and cold. Mostly cold.')]);
  add('family.mov.start', { home: has, season: 'winter' }, [W({}, 'My own fire on a winter night. My own. I sit and watch it like it\'s a play.')]);
  add('family.nest.start', { flown: has, season: 'winter' }, [W({}, 'Winter\'s the worst. Long evenings. I used to have someone to play cards with.')]);
  add('family.exp.start', { expecting: true, season: 'spring' }, [W({}, 'A spring baby! Everything\'s being born at once. The lambs, the ducks, and us.')]);
  add('family.exp.start', { expecting: true, season: 'winter' }, [W({}, 'A winter baby. We\'re knitting like mad. The baby will be the warmest hobbit in the valley.')]);

  // the children: more of each age
  add('family.kh.start', KH, [
    W({ band: 'young' }, 'There\'s a crack in my wall that looks like a dragon. I say goodnight to it.', 'Mum lets me lick the spoon. Only on Highdays. It\'s the BEST.'),
    W({ band: 'school' }, 'I\'ve got the top bunk. I fought for it. Well, I asked nicely. Then I fought.', 'There\'s always somebody in the bath. ALWAYS.'),
    W({ band: 'youth' }, 'Mum says I\'ll understand when I\'m older. I\'m nearly older. I still don\'t.', 'Dad tells the same jokes at every supper. Every single one. I\'ve started mouthing along.'),
    W({ band: 'toddler' }, 'BATH! No bath. No no no.', 'My bed has a bear. The bear is called Bear.'),
  ]);
  add('family.kh.bossy', KH, [
    W({ band: 'young' }, 'The hen. The big hen. She chases me. She\'s the boss of everyone.'),
    W({ band: 'school' }, 'Gran. When Gran comes round, EVERYONE does what they\'re told. Even Dad.'),
    W({ band: 'youth' }, 'Mum, mostly. Dad pretends it\'s him. We all let him think it.'),
  ]);
  add('family.kh.told', KH, [
    W({ band: 'young' }, 'I gave my peas to the dog. Every supper. For a whole month. The dog\'s very healthy.'),
    W({ band: 'school' }, 'I let the pig out to see where it would go. It went to the inn. I walked it home.'),
    W({ band: 'youth' }, 'I\'ve been sneaking out to watch the rifts at night. Don\'t look like that. I\'m careful.'),
  ]);
  add('family.kh.love', KH, [
    W({ band: 'young', sibling: has }, 'I know! Mum says I\'m her favourite. She says it to {sibling} too. I heard.'), W({ band: 'young' }, 'Dad says I\'m his best thing. Better than his pipe!'),
    W({ band: 'school' }, 'I know. They kiss me goodnight in front of EVERYONE. In front of my FRIENDS.'),
  ]);
  add('family.kh.cuddles', KH, [W({ band: 'young' }, 'The cat. When she lets you. Which is never.'), W({ band: 'school' }, 'Grandad. He smells like pipe-smoke and toffees.')]);
  add('family.kh.frog', KH, [W({ band: 'school' }, 'Ha! Could you do just the head? Just a frog head for a day?'), W({ band: 'young' }, 'Can I keep it? In a jar? With leaves?')]);
  add('family.kh.safe', KH, [W({ band: 'young' }, 'Promise promise? Pinkie promise? Okay. *very serious nod*'), W({ band: 'school' }, 'Okay. If you tell, I\'ll tell everyone you sing in the bath.')]);
  add('family.kh.own', KH, [W({ band: 'young' }, 'Okay... Will they still love me? ...Okay. I\'ll tell.'), W({ band: 'school' }, 'Fine. But you\'re telling them it was brave.')]);
  add('family.kh.grown', KH, [W({ band: 'young' }, 'A pirate. On the river. With a hat like yours but with a feather.', 'A cake. ...A baker. I said baker.'), W({ band: 'school' }, 'An explorer! I\'ll find where the river goes and draw a map!', 'The Steward. Then I\'ll make every day a Highday.')]);
  add('family.kidask.q', KH, [W({ band: 'young' }, 'Wizard? Who tucks you in at night? Do you have a bear?'), W({ band: 'school' }, 'Do wizards have birthdays? Who gives the presents? Do you give everyone a firework?')]);
  add('family.kidask.stars', KH, [W({ band: 'school' }, 'That\'s not true. ...Is it? Can I try? Tonight? Will they come?')]);
  add('family.kidask.long', KH, [W({ band: 'school' }, 'That\'s sad. You can come to my birthday. I\'ll give you the best present. A stone. A really good stone.')]);

  // the threads children share with grown-ups, in a child's voice
  const CH = 'child', SB = { sibling: has };
  add('family.sib.growing', SB, [
    tm(CH, 'We ARE growing up. Right now. {Sibling} says I\'m doing it wrong.', 'We share a room. {Sibling} draws a line down the middle. I\'m not allowed over it. Not even my toes.'),
    W({ temper: CH, siblingOlder: true }, '{Sibling} taught me to whistle. And to climb the tree. And to blame the dog.'),
    W({ temper: CH, siblingOlder: false }, '{Sibling} follows me EVERYWHERE. Like a duckling. A loud duckling.'),
  ]);
  add('family.sib.fav', SB, [tm(CH, 'Me! Mum says she hasn\'t got one. That means me.', '{Sibling}. {Sibling} gets the top of the pie. Every time.'), W({ temper: CH, band: 'youth' }, 'Neither. The dog. Everyone knows it\'s the dog.')]);
  add('family.sib.fond', SB, [tm(CH, 'I am NOT. ...A bit. Don\'t tell {sibling}.', 'Only when {sibling}\'s asleep. Then {sibling}\'s nice.')]);
  add('family.sib.worst', SB, [tm(CH, 'I put a slug in {sibling}\'s slipper. A big one. {Sibling} screamed so loud the hens stopped laying.', '{Sibling} cut my hair while I was asleep. Mum cried. Then she laughed. Then she cried.')]);
  add('family.sib.now', SB, [tm(CH, 'We\'re friends on Highdays. And at bedtime. And when there\'s thunder.', 'We\'re close. Too close. I can hear {sibling} breathing. Loudly.')]);
  add('family.sib.kind', SB, [tm(CH, 'For no reason? ...I\'ll give {sibling} my second-best conker. Not my best one.', 'Okay! I\'ll give {sibling} a hug! A surprise one! From behind!')]);
  add('family.sib.start', SB, [W({ temper: CH, band: 'toddler' }, '{Sibling}! {Sibling} mine!'), W({ temper: CH, band: 'youth' }, '{Sibling} reads my diary. I know because {sibling} corrects the spelling.')]);
  add('family.bday.gave', BD, [tm(CH, 'I gave Mum a picture of a dragon. And Dad a stone. A shiny one. And the cat a feather.', 'Everyone got a daisy chain! I made them all morning! My fingers are green!')]);
  add('family.bday.age', BD, [tm(CH, 'I\'m nearly a hundred! ...No I\'m not. I\'m older than last year though!')]);
  add('family.bday.returns', BD, [tm(CH, 'Thank you! Is there cake? There\'s always cake on birthdays. That\'s the rule.')]);
  add('family.bday.wish', BD, [tm(CH, 'A pony! Or a dragon! A small one! I\'d feed it!', 'That it\'s my birthday tomorrow too.')]);
  add('family.bday.tale', BD, [tm(CH, 'A HAYSTACK? Can I have one? For my birthday? It IS my birthday!')]);
  add('family.bday.mathom', BD, [tm(CH, 'What\'s a mathom? Is it the frog vase? I gave the frog vase to Gran. She said \'oh\'.')]);
  add('family.kb.start', KB, [tm(CH, 'Yes! {KinBday} gave me a whistle! Mum said \'oh no\'!', 'It is! There\'s a party! I\'m allowed to stay up! Till nine!')]);
  add('family.kb.got', KB, [tm(CH, 'A whistle! Listen! *wheeeeee*', 'A wooden duck! It wobbles! Look!')]);
  add('family.kb.custom', KB, [tm(CH, 'No, silly! The birthday one GIVES! Everyone knows that!')]);
  add('family.kb.cupboard', KB, [tm(CH, 'NO! It\'s mine! I\'m keeping it forever! Under my pillow!')]);
  add('family.row.open', RW, [W({ stage: 'child' }, 'You look cross, {name}. Has somebody been unkind?')]);
  add('family.row.start', RW, [tm(CH, '{RowKin} is the WORST. I\'m never speaking to {rowKin} again. Ever. Till tea.', 'I\'m not cross. I\'m FURIOUS. There\'s a difference.')]);
  add('family.row.what', RW, [tm(CH, '{RowKin} broke my boat. The one I made. On purpose! Well, sort of on purpose.', '{RowKin} told everyone I cried at the story circle. I did NOT. Much.')]);
  add('family.row.trolls', RW, [tm(CH, 'YES! Feed {rowKin} to a troll! ...No. Not really. Maybe a small troll.')]);
  add('family.row.fault', RW, [tm(CH, '{RowKin}\'s! ...And a bit mine. A little bit. A very little bit.')]);
  add('family.row.love', RW, [tm(CH, 'I do love {rowKin}. I just don\'t LIKE {rowKin}. Today.')]);
  add('family.row.mend', RW, [tm(CH, 'Okay. I\'ll say sorry. But {rowKin} has to say it too. After. Okay, first. Fine.')]);
  add('family.row.word', RW, [tm(CH, 'Would you? Tell {rowKin} I\'m not cross any more. Nearly not.')]);
});
