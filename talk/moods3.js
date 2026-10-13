'use strict';
// ---------------------------------------------------------------------------
// Reading the mood, part three: the homesick (rift-folk missing the city,
// strangers off the West Road with no kin here, and folk dreaming of Bree),
// the lonely, the shy and the new, the sulking (and children in a tantrum),
// and the jealous, sore at a rival's win. The facts come from talk/moods.js.
// ---------------------------------------------------------------------------

talkPack('moods3', () => {
  const COND = { elder: { stage: 'elder' }, child: { stage: 'child' }, rift: { rift: true }, plain: { register: 'plain' }, fine: { register: 'fine' } };
  const L = (key, base, by, more) => lines(key, [{ text: base }].concat(Object.keys(by || {}).map((k) => ({ if: COND[k] || { temper: k }, text: by[k] })), more || []));
  const fresh = (F, id) => { const b = (Game.wizBond || {})[F.id]; return !(b && ((b.seen && b.seen[id] === Game.day) || (b.sore && b.sore[id] > Game.day))); };
  const daily = (F, n, p) => hash2(F.id * 17 + Game.day, n) < p;
  const ladder = (ap, cell) => { const sit = { aps: { [ap]: cell } }; const r = (T) => rungFor(sit, ap, T); return [{ to: cell.out[2], need: { when: (F, T) => r(T) >= 2 } }, { to: cell.out[1], need: { when: (F, T) => r(T) === 1 } }, cell.out[0]]; };
  const has = (x) => !!x;
  const visitTo = (key, kind) => (T) => { const o = personById(T.F[key]); return o ? { to: o, kind } : null; };

  // --- Homesick -------------------------------------------------------------------
  const H = (k, text, pri) => ({ if: { moodHomesick: k }, pri: pri || 1, text });
  addSituation('homesick', {
    pri: 3.5, thread: 'mood.homesick', read: (F) => !!F.moodHomesick && fresh(F, 'mood.homesick') && (F.moodHomesick !== 'bree' || daily(F, 7, 0.8)),
    aps: {
      listen: { base: 1, out: ['shutter', 'describes', 'aches'] },
      ask: { base: 1, out: ['shutter', 'describes', 'aches'], know: (F) => F.moodArcKnown.length > 0 },
      warm: { base: 1, out: ['shutter', 'warmed', 'belongs'] },
      share: { base: 0, out: ['notsame', 'swap', 'kindred'] },
      jest: { base: 0, out: ['flat', 'grin', 'laughs'] },
      advise: { base: 0, out: ['bristle', 'maybe', 'heretoo'], know: (F) => F.moodArcKnown.includes('home') },
    },
  });
  const settle = ladder('advise', { base: 0, after: 'told', know: (F) => F.moodArcKnown.includes('home'), out: ['bristle', 'maybe', 'heretoo'] });
  const easeLost = (n) => (T, v) => { if (v.lost) v.lost = Math.max(0, v.lost - n); };
  addThread({
    id: 'mood.homesick', situation: true, label: (F) => (F.moodHomesick === 'bree' ? 'Thinking of Bree' : 'Missing home'),
    beats: {
      shutter: { line: 'mood.homesick.shutter', go: [
        { ap: 'listen', say: '*You wait, and look where they\'re looking.*', label: 'Look where they\'re looking', to: 'describes' },
        { ap: 'warm', say: 'You\'d be allowed to miss it, you know.', to: 'warmed' },
      ] },
      describes: { line: 'mood.homesick.describes', notice: 'mood.homesick.see', fx: { flag: 'told', learn: ['home', '{moodHomesickWhat}'] }, go: [
        { ap: 'ask', say: 'mood.homesick.w.tour', to: 'tour' },
        { ap: 'advise', say: 'mood.homesick.w.here', to: settle },
        { ap: 'listen', say: '*You let the quiet go on, in case there\'s more.*', label: 'Wait, in case there\'s more', to: 'aches' },
      ] },
      aches: { line: 'mood.homesick.aches', fx: { flag: 'told', trust: 0.02 }, go: [
        { ap: 'comfort', say: 'mood.homesick.w.hope', to: 'hope' },
        { ap: 'warm', say: 'I\'ll keep {lost}\'s name in mind, wherever I go.', to: 'promise', need: { if: { lost: has, moodHomesick: 'rift' } } },
        { ap: 'advise', say: 'mood.homesick.w.write', to: 'letter', need: { if: { moodHomesick: ['road', 'bree'] } } },
      ] },
      notsame: { line: 'mood.homesick.notsame', go: [
        { ap: 'listen', say: '*You nod, and let them tell it.*', label: 'Let them tell it', to: 'describes' },
        { ap: 'warm', say: 'You\'re right. It isn\'t. Forgive me.', to: 'warmed' },
      ] },
      swap: { line: 'mood.homesick.swap', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'And yours? What do you see, when you shut your eyes?', to: 'describes' },
        { ap: 'jest', say: 'mood.homesick.w.jest', to: 'laughs' },
      ] },
      kindred: { line: 'mood.homesick.kindred', fx: { trust: 0.05, fond: 0.02, run: easeLost(0.05) }, go: [
        { ap: 'warm', say: 'Then let\'s both call it home, for now. It\'s a good one.', to: 'belongs' },
        { ap: 'ask', say: 'Who do you miss most?', to: 'aches' },
      ] },
      warmed: { line: 'mood.homesick.warmed', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'Tell me about it. Home.', to: 'describes' },
        { ap: 'advise', say: 'mood.homesick.w.here', to: settle },
      ] },
      belongs: { line: 'mood.homesick.belongs', fx: { trust: 0.04, fond: 0.03, run: easeLost(0.1) }, go: [
        { ap: 'warm', say: 'You already do. Ask anyone. Well, ask the nice ones.', to: 'done' },
        { ap: 'advise', say: 'mood.homesick.w.here', to: settle },
      ] },
      flat: { line: 'mood.homesick.flat', fx: { fond: -0.02 }, go: [
        { ap: 'warm', say: 'Sorry. That was a poor joke. Tell me about it.', to: 'describes' },
        { ap: 'listen', say: '*You fall quiet.*', label: 'Fall quiet', to: 'shutter' },
      ] },
      grin: { line: 'mood.homesick.grin', go: [
        { ap: 'ask', say: 'What would you be doing now, if you were there?', to: 'describes' },
        { ap: 'jest', say: 'mood.homesick.w.jest', to: 'laughs' },
      ] },
      laughs: { line: 'mood.homesick.laughs', fx: { fond: 0.03, run: easeLost(0.05) }, go: [
        { ap: 'ask', say: 'mood.homesick.w.tour', to: 'tour' },
        { ap: 'warm', say: 'There. That\'s the face I like.', to: 'done' },
      ] },
      bristle: { line: 'mood.homesick.bristle', fx: { fond: -0.02 }, go: [
        { ap: 'listen', say: '*You let them say it all.*', label: 'Let them say it all', to: 'aches' },
        { ap: 'warm', say: 'You\'re right. Nobody should tell you how to feel.', to: 'warmed' },
      ] },
      maybe: { line: 'mood.homesick.maybe', go: [
        { ap: 'warm', say: 'No hurry. Homes take a while to grow.', to: 'done' },
        { ap: 'ask', say: 'What do you miss most?', to: 'aches' },
      ] },
      heretoo: { line: 'mood.homesick.heretoo', fx: { respect: 0.04, run: easeLost(0.15), feel: 'cheered', feelX: 'the wizard' }, go: [
        { ap: 'warm', say: 'There. A little bit of home, on our side of the hills.', to: 'done' },
        { ap: 'jest', say: 'mood.homesick.w.jest', to: 'laughs' },
      ] },
      tour: { line: 'mood.homesick.tour', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'I\'d like that. One day, perhaps.', to: 'done' },
        { ap: 'advise', say: 'mood.homesick.w.here', to: settle },
      ] },
      hope: { line: 'mood.homesick.hope', fx: { trust: 0.03 }, end: true },
      promise: { line: 'mood.homesick.promise', fx: { promise: { k: 'mood.lost', t: 'You said you\'d keep {lost}\'s name in mind', days: 30 }, trust: 0.04 }, end: true },
      letter: { line: 'mood.homesick.letter', fx: { respect: 0.03, queue: 'write_letter' }, end: true },
      done: { line: 'mood.homesick.done', fx: { remember: 'The wizard let me talk about home. It helped, oddly.', rv: 1 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('sit.homesick.listen', [{ text: ['*You stand beside them and look at the same bit of sky.*', '*You lean on your staff, and wait.*'] }]);
  lines('sit.homesick.ask', [{ text: ['Thinking of home, {name}?', 'Where are you, just now? Not here, I think.'] }, H('rift', ['Missing the city?']), H('bree', ['Thinking of Bree again?'])]);
  lines('sit.homesick.warm', [{ text: ['Thistledown\'s glad of you, {name}. I hope you know that.'] }, H('rift', ['You\'ve folk here now, {name}. Hill-folk count.'])]);
  lines('sit.homesick.share', [{ text: ['I\'ve no home either, you know. A wagon and a road.', 'I\'ve been homesick for places that aren\'t there any more.'] }]);
  lines('sit.homesick.jest', [{ text: ['Cheer up. The hills here hardly ever fall on anyone.'] }, H('rift', ['Lost your signal, {name}?', 'Too quiet for you? I can ask the hens to beep.']), H('bree', ['Bree? Have you SMELT Bree?'])]);
  lines('sit.homesick.advise', [{ text: ['Find one thing here that feels like home, {name}. Just one.'] }, H('rift', ['Have you been to the mill at night? It hums. Like a city.']), H('bree', ['Give it one more season before you pack, {name}.'])]);
  L('mood.homesick.w.tour', ['If you took me there, what would you show me first?', 'Show me round it. In words.']);
  L('mood.homesick.w.here', ['Is there anything here that\'s a bit like it?', 'Find the bit of here that\'s most like there. Go and sit in it.'], {}, [H('rift', ['The Lamplighter\'s lamps at dusk. Have you watched them come on?', 'The mill-race hums all night. Go and listen. Tell me if it\'s close.'])]);
  L('mood.homesick.w.hope', ['Wherever they are, I hope there\'s tea, and someone thinking of them.', 'Missing them is how you keep them, {name}.']);
  L('mood.homesick.w.write', ['Write to them. The postie goes as far as the West Road.', 'A letter, {name}. Tell them about the hens. They\'ll want to know.']);
  L('mood.homesick.w.jest', ['I\'ll put in a request for a few more billboards.', 'I could make the hens glow, if that would help.'], {}, [H('bree', ['Bree has one street and forty puddles. I counted.'])]);
  L('mood.homesick.see', ['They keep looking up, at the place where the sky tore.', 'Their hand has gone to their pocket, and stayed there, holding something.'], {}, [H('rift', ['A little light on their sleeve blinks, slowly, like something asleep.'])]);

  L('mood.homesick.shutter', ['I\'m fine. It\'s nice here. Really. Everyone\'s very kind.', 'Homesick? No. ...Is it that obvious?'], {
    ornery: ['I\'m not homesick. I\'m just not home. There\'s a difference.'], shy: ['...I\'m fine. Don\'t worry about me.'], proud: ['I\'m quite settled, thank you.'], gloomy: ['Missing it won\'t bring it back. So I don\'t.'], child: ['I\'m NOT sad. I just want my old room.'],
  }, [H('rift', ['All systems normal. Just... low battery. That\'s all.', 'Signal\'s fine. I\'m fine. Full bars.'])]);
  L('mood.homesick.describes', ['Home was... noisy. Warm. Everybody knew which way you took your tea.', 'You could walk from one end to the other and say hello to everyone. Here I say hello and folk look surprised.'], {
    cheerful: ['Oh, it was grand! Little crooked lanes and a dog on every step.'], shy: ['...There was a window seat. I read there. Nobody looked for me. It was mine.'],
    dreamy: ['When the evening came in, all the windows lit up one by one, like somebody counting.'], proud: ['We were known there. Our name meant something. Here it\'s just a name.'],
    ornery: ['Folk minded their own business. And the bread was better. Don\'t tell the baker.'], child: ['My old room had a hole in the wall where a mouse lived. His name was Biscuit.'],
  }, [
    H('rift', ['Back home the lights never went off. You fell asleep under a billboard and dreamt in adverts.', 'Neverdark. Never dark, never quiet. Here the night is so BIG. It just keeps going.', 'We had trains that never stopped. Day and night. You set your heart by them.']),
    { if: { moodHomesick: 'rift', moodHomeThing: has }, pri: 2, text: ['I keep thinking of {moodHomeThing}. Isn\'t that daft? Of all the things.', 'You know what I miss? {MoodHomeThing}. I\'d give my last battery to see it.'] },
    H('road', ['{MoodOldHome}. A long way back down the West Road. Everyone there knew my mum.', 'In {moodOldHome} I knew every stile. Here I keep climbing the wrong ones.']),
    H('bree', ['My cousin\'s in Bree. Says there\'s room, and work, and an inn with two floors. Two!', 'Bree\'s got Big Folk and a market every day. Imagine. Every day.']),
  ]);
  L('mood.homesick.aches', ['...It\'s not the place. It\'s the people. The ones I left.', '...There was someone. I didn\'t get to say goodbye properly.'], {
    shy: ['...I think about them every night. I say their names. Quietly, so nobody hears.'], ornery: ['...You don\'t just stop missing folk because a wizard asks nicely.'], gloomy: ['...They\'ve probably forgotten me. That\'s the worst bit.'],
  }, [
    { if: { moodHomesick: 'rift', lost: has }, pri: 2, text: ['My {lostRel}. {Lost}. We were meant to come through together. The rift took me and not {lost}.', '{Lost}. My {lostRel}. Somewhere with no signal, I hope. Not nowhere. Please not nowhere.'] },
    H('road', ['My mum\'s still in {moodOldHome}. She writes. I don\'t write back enough.']), H('bree', ['...It\'s not Bree, really. It\'s that nothing here changes. And I\'m changing.']),
  ]);
  L('mood.homesick.notsame', ['It\'s not the same. You chose the road. Nobody asked me.', 'You can go back, wizard. I can\'t.'], {
    ornery: ['Don\'t compare. You\'ve got a wagon. I\'ve got a hole in the sky.'], proud: ['With respect, your wanderings are not my exile.'],
  }, [H('rift', ['You can walk home. Mine\'s on the other side of the sky. With the door shut.'])]);
  L('mood.homesick.swap', ['...Huh. A wagon. Do you get lonely?', 'I never thought of wizards being from anywhere.'], { curious: ['Where WERE you from? Before the road?'], child: ['Can I see the wagon?'] }, [H('rift', ['A wagon. Like a drone with wheels. And no signal. Huh.'])]);
  L('mood.homesick.kindred', ['...So you know. What it\'s like. Being from somewhere that isn\'t here.', '...Nobody\'s said that to me before. That they know.'], {
    shy: ['...Thank you. I thought I was the only one.'], dreamy: ['Two strays, then. On the same wall, looking at the same hills.'], child: ['You don\'t have a home either? You can share mine. Mum won\'t mind. Much.'],
  }, [H('rift', ['Full signal. ...That means I hear you. Properly.'])]);
  L('mood.homesick.warmed', ['...That\'s kind. I don\'t always feel it. But it\'s kind.', 'Do you mean that? ...You do. Huh.'], { ornery: ['Hmph. Some of them are glad. The baker isn\'t.'], shy: ['*goes pink, and smiles at the ground*'], child: ['Everyone? Even the old one with the stick?'] });
  L('mood.homesick.belongs', ['...You think I could belong here? Properly?', '...Maybe it\'s not a second best. Maybe it\'s just a second home.'], {
    cheerful: ['Home! I like the sound of that. Home, home, home.'], ornery: ['Hmph. Belong. I\'ll belong when they learn to say my name right.'], proud: ['I suppose a {surname} could put down roots anywhere.'],
  }, [H('rift', ['Two homes. Is that allowed? One with neon and one with hens?'])]);
  L('mood.homesick.flat', ['...Right. Funny.', 'That\'s not funny. Not to me.'], { ornery: ['Very droll, wizard.'], shy: ['*looks away*'], child: ['That\'s not FUNNY.'] }, [H('rift', ['Static. That\'s what that joke was. Static.'])]);
  L('mood.homesick.grin', ['Ha. ...Ha. Something like that.', '*a crooked grin, despite themselves*'], {}, [H('rift', ['Ha! Lost signal. Exactly. Zero bars, wizard. Zero.', 'Beeping hens. That\'d be an upgrade.'])]);
  L('mood.homesick.laughs', ['Ha! Oh, you\'re terrible. ...Thank you.', 'Ha! I\'ll have you know I\'m very sad. Or I was.'], { witty: ['Ha! Forty puddles. You\'ve clearly never been to the Marish.'] }, [H('rift', ['Ha! Glowing hens. Back home we\'d have paid to see that. Full lag, wizard. Full lag.'])]);
  L('mood.homesick.bristle', ['You sound like the Steward. "Settle in." As if I\'m a new hat.', 'Don\'t tell me to make the best of it. I am making the best of it.'], { ornery: ['I\'ll miss what I like, thank you.'], proud: ['I don\'t require settling.'] }, [H('rift', ['Settle in. Everybody says it. Like it\'s a switch.'])]);
  L('mood.homesick.maybe', ['...Maybe. I could try.', 'Perhaps. Not today. Some day.'], { shy: ['...I might. If nobody\'s about.'] });
  L('mood.homesick.heretoo', ['...The mill does hum, doesn\'t it. All night. I never listened.', '...There\'s a spot by the inn where you can hear everyone at once. It\'s nearly like home.'], {
    cheerful: ['Oh! The Badger on a Saturday! That\'s just like home! Louder, even!'], dreamy: ['...The lamps coming on, one by one, down the lane. I\'ll go and watch them tonight.'],
  }, [H('rift', ['The Lamplighter\'s glow on the clouds. Of course. I\'ll go up the hill tonight and look.', 'The Relay Mast blinks at night. Red, then nothing, then red. Like the trains. I\'ll go and look.'])]);
  L('mood.homesick.tour', ['First the market. Then the bridge at dusk. Then my mum\'s kitchen, for the smell.', 'First I\'d show you the bakehouse, then the hill, then the place where we all sat on summer nights.'], {
    child: ['My old room, and the mouse hole. Biscuit might still be there.'],
  }, [H('rift', ['The noodle stall under the overpass. Third from the end. Best noodles in the city. Then the rooftops.'])]);
  L('mood.homesick.hope', ['...I hope so too. Tea. They\'d like tea.', 'Missing them is how you keep them. ...I\'ll keep them, then.'], { ornery: ['Hmph. Pretty words. ...Thank you.'] });
  L('mood.homesick.promise', ['...You would? Thank you. If you ever hear the name...', 'Thank you. Not many folk would bother.'], {}, [{ if: { lost: has }, text: ['{Lost}. Say it if you see anyone. {Lost}. They\'ll know.'] }]);
  L('mood.homesick.letter', ['...A letter. Yes. I\'ve been meaning to for weeks.', 'I\'ll write tonight. About the hens. They\'ll laugh at the hens.'], { child: ['Can you help me spell it?'] });
  L('mood.homesick.done', ['...Thank you, wizard. It helped, talking about it.', 'I\'ll be all right. It comes and goes.'], { shy: ['...Thank you for asking. Nobody asks.'], cheerful: ['There! I feel almost local.'] }, [H('rift', ['Thanks, wizard. Signal\'s better. Honestly.'])]);

  // --- Lonely -----------------------------------------------------------------------
  addSituation('lonely', {
    pri: 2.6, thread: 'mood.lonely', read: (F) => F.moodLonely && fresh(F, 'mood.lonely') && daily(F, 9, 0.8),
    aps: {
      warm: { base: 1, out: ['braveface', 'thaws', 'glows'] },
      listen: { base: 1, out: ['silent', 'pours', 'opens'] },
      ask: { base: 1, out: ['braveface', 'pours', 'opens'], know: (F) => !!F.moodPal },
      share: { base: 0, out: ['pity', 'swap', 'kindred'] },
      jest: { base: 0, out: ['hurt', 'smile', 'laughs'] },
      advise: { base: 0, out: ['prickly', 'maybe', 'plan'], know: (F) => !!F.moodPal },
    },
  });
  const goSee = ladder('advise', { base: 0, after: 'told', know: (F) => !!F.moodPal, out: ['prickly', 'maybe', 'plan'] });
  const unlonely = (n) => (T, v) => { v.drives.lonely = Math.max(0, v.drives.lonely - n); };
  addThread({
    id: 'mood.lonely', situation: true, label: 'Lonely',
    beats: {
      braveface: { line: 'mood.lonely.braveface', go: [
        { ap: 'listen', say: '*You don\'t believe a word of it, and wait.*', label: 'Wait', to: 'pours' },
        { ap: 'warm', say: 'Well, I\'m glad of your company, for one.', to: 'thaws' },
      ] },
      thaws: { line: 'mood.lonely.thaws', fx: { run: unlonely(0.1), fond: 0.02 }, go: [
        { ap: 'ask', say: 'Who do you miss?', to: 'whomiss' },
        { ap: 'advise', say: 'mood.lonely.w.see', to: goSee },
      ] },
      glows: { line: 'mood.lonely.glows', fx: { run: unlonely(0.25), fond: 0.04, feel: 'cheered', feelX: 'the wizard' }, go: [
        { ap: 'ask', say: 'Who do you miss?', to: 'whomiss' },
        { ap: 'warm', say: 'I mean it. Come and find me, any day.', to: 'done' },
      ] },
      silent: { line: 'mood.lonely.silent', go: [
        { ap: 'ask', say: 'When did you last have a proper talk with someone?', to: 'pours' },
        { ap: 'warm', say: 'Well, I\'m here now.', to: 'thaws' },
      ] },
      pours: { line: 'mood.lonely.pours', fx: { run: unlonely(0.15), flag: 'told', feel: 'drawn_out' }, go: [
        { ap: 'ask', say: 'Who do you miss?', to: 'whomiss' },
        { ap: 'advise', say: 'mood.lonely.w.see', to: goSee },
        { ap: 'comfort', say: 'That\'s a lot of quiet for one hobbit.', to: 'glows' },
      ] },
      opens: { line: 'mood.lonely.opens', fx: { run: unlonely(0.2), flag: 'told', trust: 0.04, confide: { k: 'mood.lonely', t: '{Name} feels nobody would notice if {they} stayed in all week' } }, go: [
        { ap: 'advise', say: 'mood.lonely.w.see', to: goSee },
        { ap: 'warm', say: 'I\'d notice. I\'m noticing now.', to: 'done' },
      ] },
      pity: { line: 'mood.lonely.pity', fx: { fond: -0.02 }, go: [
        { ap: 'listen', say: '*You stop, and let them talk.*', label: 'Let them talk', to: 'pours' },
        { ap: 'warm', say: 'Not pity. Company. There\'s a difference.', to: 'thaws' },
      ] },
      swap: { line: 'mood.lonely.swap', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'And who would you knock on the door of, if you were brave?', to: 'whomiss' },
        { ap: 'jest', say: 'We could start a club. Very small. No meetings.', to: 'laughs' },
      ] },
      kindred: { line: 'mood.lonely.kindred', fx: { trust: 0.05, joke: { k: 'mood.club', t: 'The club of two. No meetings.' } }, go: [
        { ap: 'advise', say: 'mood.lonely.w.see', to: goSee },
        { ap: 'warm', say: 'Then we\'ll be lonely together, now and then. It\'s much less lonely.', to: 'done' },
      ] },
      hurt: { line: 'mood.lonely.hurt', fx: { fond: -0.03 }, go: [
        { ap: 'comfort', say: 'I\'m sorry. That was a stupid thing to say.', to: 'thaws' },
        { ap: 'listen', say: '*You say nothing more.*', label: 'Say nothing more', to: 'silent' },
      ] },
      smile: { line: 'mood.lonely.smile', go: [
        { ap: 'ask', say: 'What\'s the matter, really?', to: 'pours' },
        { ap: 'jest', say: 'mood.lonely.w.jest', to: 'laughs' },
      ] },
      laughs: { line: 'mood.lonely.laughs', fx: { run: unlonely(0.1), fond: 0.03 }, go: [
        { ap: 'advise', say: 'mood.lonely.w.see', to: goSee },
        { ap: 'warm', say: 'There. You\'re good company, you know.', to: 'done' },
      ] },
      prickly: { line: 'mood.lonely.prickly', fx: { respect: -0.02 }, go: [
        { ap: 'listen', say: '*You let it go, and wait.*', label: 'Let it go', to: 'pours' },
        { ap: 'jest', say: 'mood.lonely.w.jest', to: 'smile' },
      ] },
      maybe: { line: 'mood.lonely.maybe', go: [{ ap: 'warm', say: 'Do. They\'ll be glad. I\'d put money on it.', to: 'done' }] },
      plan: { line: 'mood.lonely.plan', fx: { respect: 0.04, queue: 'whisper_visit', queueExtra: visitTo('moodPalId', 'kin') }, end: true },
      whomiss: { line: 'mood.lonely.whomiss', go: [
        { ap: 'advise', say: 'mood.lonely.w.see', to: goSee },
        { ap: 'warm', say: 'They\'d want to know you miss them.', to: 'done' },
      ] },
      done: { line: 'mood.lonely.done', fx: { run: unlonely(0.1), remember: 'The wizard stopped and talked when I was lonely.', rv: 1 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('sit.lonely.warm', [{ text: ['There you are, {name}. I was hoping I\'d bump into you.', 'Just the hobbit I wanted to see.'] }, { if: { stage: 'child' }, text: ['Hello, you. Want some company? I\'ve plenty spare.'] }]);
  lines('sit.lonely.listen', [{ text: ['*You sit down beside them as if you\'d planned to all along.*', '*You lean on the fence next to them, and just stay.*'] }]);
  lines('sit.lonely.ask', [{ text: ['On your own today, {name}?', 'When did you last have somebody to talk to?'] }, { if: { moodPal: has }, text: ['Not seen {moodPal} about?'] }]);
  lines('sit.lonely.share', [{ text: ['I\'m on my own a lot, you know. On the road. It gets quiet.'] }]);
  lines('sit.lonely.jest', [{ text: ['Has everyone else been turned into toads? I didn\'t do it.', 'You look like the last biscuit in the tin, {name}.'] }]);
  lines('sit.lonely.advise', [{ text: ['Go and knock on a door, {name}. Any door.'] }, { if: { moodPal: has }, text: ['Go and see {moodPal}. Today.'] }]);
  L('mood.lonely.w.see', ['Go and knock on a door today. Somebody\'s waiting to be knocked on.', 'Ask someone to tea. They\'ll say yes. Folk always say yes to tea.'], {}, [{ if: { moodPal: has }, text: ['Go and see {moodPal}. Take a bun. Say you were passing.', '{MoodPal} would be glad of you. Go on.'] }]);
  L('mood.lonely.w.jest', ['I\'m very good company. I\'ve been told so by at least one goat.', 'If it helps, the hens think you\'re wonderful.']);

  L('mood.lonely.braveface', ['Lonely? Me? No. I\'ve the hens. And the kettle. I talk to the kettle.', 'Oh, I like my own company. Mostly.'], {
    ornery: ['I\'m not lonely. Folk are tiresome. I\'m avoiding them.'], proud: ['I am perfectly sufficient on my own.'], cheerful: ['Me? Lonely? Never! Well... a bit. But never!'], child: ['I\'m playing on my own ON PURPOSE.'], elder: ['At my age you get used to quiet. That\'s what they tell me.'],
  });
  L('mood.lonely.thaws', ['...That\'s nice of you to say. I don\'t hear it much.', '*the shoulders come down a little*'], { shy: ['...Thank you. I didn\'t think anybody noticed me.'], child: ['Really? You came to see ME?'], ornery: ['Hmph. Well. You\'ll do.'] });
  L('mood.lonely.glows', ['Oh! Oh, that\'s... nobody\'s said that in an age.', '*their whole face lights up, and they try to hide it, and fail*'], { shy: ['*goes pink to the ears*'], child: ['Can you stay? Can you stay ALL DAY?'], elder: ['Bless you. You\'ve made an old hobbit\'s week.'] });
  L('mood.lonely.silent', ['*they say nothing, and neither do you, and it goes on a bit too long*', '...'], { cheerful: ['...Sorry. I\'ve got out of the way of talking.'] });
  L('mood.lonely.pours', ['Days, it\'s been. I go to the Store and back. Nobody stops. I don\'t blame them. I don\'t stop either.', 'Everyone\'s busy. I don\'t like to bother anyone. Then a week goes by.'], {
    cheerful: ['I used to have a friend on every doorstep. I don\'t know where they went. Or where I went.'], gloomy: ['I could vanish and nobody\'d notice till the post piled up.'],
    shy: ['...I want to go and talk to people. Then I get to the door and turn round.'], proud: ['Folk don\'t call as they used to. Manners have gone to pot.'],
    child: ['Nobody will play with me. They play with each other. I watch.'], elder: ['All my old friends have gone over the hills. The young ones are kind, but they don\'t know the songs.'],
  }, [{ if: { spouse: has }, text: ['{Spouse}\'s always at work. I sit and listen to the clock.'] }, { if: { homeless: true }, text: ['When you\'ve no door of your own, nobody comes to knock on it.'] }]);
  L('mood.lonely.opens', ['...Sometimes I think nobody would notice if I stayed in all week. I tested it once. They didn\'t.', '...I lay the table for two, out of habit. Then I sit at it on my own.'], {
    shy: ['...I practise conversations in my head. Then nobody talks to me, so I never use them.'], child: ['...Sometimes I pretend I\'ve got a friend called Pip. Pip isn\'t real.'],
  });
  L('mood.lonely.pity', ['Don\'t feel sorry for me. I don\'t want pity.', 'I\'m not a charity, wizard.'], { ornery: ['Pity\'s for the poorly. I\'m not poorly.'], proud: ['I don\'t need to be pitied, thank you.'] });
  L('mood.lonely.swap', ['You? On your own? I thought wizards had... I don\'t know. Owls.', '...I never thought of you being lonely.'], { curious: ['What do you do, on the road, on your own? Talk to the horse?'], child: ['You can play with me. If you want.'] });
  L('mood.lonely.kindred', ['...A club of two. No meetings. Yes. I\'d like that.', '...So it\'s not just me. Huh.'], { shy: ['...Thank you for saying. It helps, knowing.'], cheerful: ['Ha! Lonely together. That\'s not lonely at all, is it?'] });
  L('mood.lonely.hurt', ['...Right.', 'That\'s not funny.'], { ornery: ['Oh, laugh. Everyone else does.'], shy: ['*looks down, and says nothing*'], child: ['*lip wobbles*'] });
  L('mood.lonely.smile', ['...Ha. Maybe they have been.', '*a small, surprised smile*'], { child: ['Hee. ...Are they toads?'] });
  L('mood.lonely.laughs', ['Ha! A goat! I believe it.', 'Ha! ...Oh, I\'d forgotten how good that feels.'], { witty: ['Ha! The goat was being polite.'], child: ['AHAHA! The hens LOVE me!'] });
  L('mood.lonely.prickly', ['I don\'t need telling to make friends. I\'m not six.', 'Easy for you. Everyone\'s pleased to see a wizard.'], { ornery: ['Don\'t organise me.'], child: ['They don\'t WANT me to play.'] });
  L('mood.lonely.maybe', ['...Maybe. If they\'re in.', 'I might. Tomorrow. If I\'m brave tomorrow.'], { shy: ['...I\'ll walk past. And if the door\'s open...'] });
  L('mood.lonely.plan', ['...All right. I will. I\'ll take a bun.', 'I\'ll go now. Before I talk myself out of it.'], { shy: ['...Now? ...All right. Now.'], ornery: ['Fine. But if they\'re out, I\'m blaming you.'], child: ['I\'ll go and ask if I can play! I\'m going! Watch!'] }, [{ if: { moodPal: has }, text: ['{MoodPal}. Yes. I\'ve been meaning to. I\'ll go now.', 'You\'re right. {MoodPal} always has the kettle on.'] }]);
  L('mood.lonely.whomiss', ['Everyone, a bit. The way it used to be, when we all sat out of an evening.', 'Someone to say good morning to who says it back.'], { child: ['Somebody who\'ll be my best friend. A proper one.'] }, [{ if: { moodPal: has }, text: ['{MoodPal}. We used to see each other every day. I don\'t know when we stopped.'] }]);
  L('mood.lonely.done', ['...Thank you, wizard. That\'s the most I\'ve talked all week.', 'That was nice. Will you stop again?'], { shy: ['...Thank you. Really.'], child: ['Bye! Come and play again!'], ornery: ['Hmph. You\'re not bad company. For a wizard.'] });

  // --- Shy, or new here -------------------------------------------------------------
  addSituation('shy', {
    pri: 1.8, thread: 'mood.shy', read: (F) => (F.moodNewcomer != null || (F.temper === 'shy' && F.talks < 3)) && fresh(F, 'mood.shy') && (F.moodNewcomer != null || daily(F, 11, 0.6)),
    aps: {
      warm: { base: 1, out: ['freezes', 'mumbles', 'opens'] },
      listen: { base: 1, out: ['freezes', 'mumbles', 'opens'] },
      share: { base: 1, out: ['mumbles', 'named', 'opens'] },
      ask: { base: 0, out: ['freezes', 'named', 'origin'] },
      jest: { base: 0, out: ['freezes', 'titter', 'laughs'] },
    },
  });
  const intro = ladder('advise', { base: 0, after: 'spoke', out: ['shrinks', 'maybe', 'introduce'] });
  addThread({
    id: 'mood.shy', situation: true, label: (F) => (F.moodNewcomer != null ? 'New in Thistledown' : 'Shy'),
    beats: {
      freezes: { line: 'mood.shy.freezes', notice: 'mood.shy.see', go: [
        { ap: 'share', say: 'mood.shy.w.self', to: 'named' },
        { ap: 'listen', say: '*You find something very interesting about the sky, and wait.*', label: 'Look at the sky, and wait', to: 'mumbles' },
      ] },
      mumbles: { line: 'mood.shy.mumbles', go: [
        { ap: 'ask', say: 'What\'s your name? I\'m terrible at names. Wizards are.', to: 'named' },
        { ap: 'jest', say: 'mood.shy.w.jest', to: 'titter' },
      ] },
      named: { line: 'mood.shy.named', fx: { flag: 'spoke', fond: 0.02 }, go: [
        { ap: 'ask', say: 'And who have you met so far?', to: 'faces' },
        { ap: 'warm', say: 'Well, I\'m glad to know you, {name}.', to: 'opens' },
      ] },
      origin: { line: 'mood.shy.origin', fx: { flag: 'spoke' }, go: [
        { ap: 'ask', say: 'And who have you met so far?', to: 'faces' },
        { ap: 'advise', say: 'mood.shy.w.intro', to: intro },
      ] },
      opens: { line: 'mood.shy.opens', fx: { flag: 'spoke', trust: 0.04, fond: 0.02 }, go: [
        { ap: 'ask', say: 'And who have you met so far?', to: 'faces' },
        { ap: 'advise', say: 'mood.shy.w.intro', to: intro },
      ] },
      titter: { line: 'mood.shy.titter', fx: { flag: 'spoke' }, go: [
        { ap: 'ask', say: 'There. Now, what do they call you?', to: 'named' },
        { ap: 'warm', say: 'You\'ve a good laugh. Use it more.', to: 'opens' },
      ] },
      laughs: { line: 'mood.shy.laughs', fx: { flag: 'spoke', fond: 0.03 }, go: [
        { ap: 'advise', say: 'mood.shy.w.intro', to: intro },
        { ap: 'ask', say: 'And who have you met so far?', to: 'faces' },
      ] },
      faces: { line: 'mood.shy.faces', go: [
        { ap: 'advise', say: 'mood.shy.w.intro', to: intro },
        { ap: 'warm', say: 'Well, now you\'ve met me. That\'s a start.', to: 'done' },
      ] },
      shrinks: { line: 'mood.shy.shrinks', go: [{ ap: 'warm', say: 'No hurry. Folk will come to you.', to: 'done' }, { ap: 'comfort', say: 'I\'ll not push you. Not today.', to: 'done' }] },
      maybe: { line: 'mood.shy.maybe', go: [{ ap: 'warm', say: 'Good. One hello at a time.', to: 'done' }] },
      introduce: { line: 'mood.shy.introduce', fx: { respect: 0.03, queue: 'whisper_visit', queueExtra: visitTo('moodGreeterId', 'kin') }, end: true },
      done: { line: 'mood.shy.done', fx: { remember: 'The wizard took the trouble to talk to me, when I didn\'t know anybody.', rv: 1 }, end: true },
    },
    end: { fond: 0.02, trust: 0.02 },
  });
  lines('sit.shy.warm', [{ text: ['Hello, there. You\'re a sight for sore eyes.', 'Good day! Don\'t mind me. I\'m mostly hat.'] }, { if: { stage: 'child' }, text: ['Hello, small person. I\'m Gandalf. I\'m very tall, but quite harmless.'] }]);
  lines('sit.shy.listen', [{ text: ['*You nod, and wait, and don\'t crowd them.*', '*You stand a polite distance off and admire a hedge.*'] }]);
  lines('sit.shy.share', [{ text: ['I\'m new here myself, really. I only come through now and then.', 'I never know what to say to new folk either. I just talk about hats.'] }]);
  lines('sit.shy.ask', [{ text: ['And who might you be?', 'Are you new here?'] }, { if: { moodNewcomer: { min: 0 } }, text: ['You\'re new, aren\'t you? Where have you come from?'] }]);
  lines('sit.shy.jest', [{ text: ['Don\'t worry. I only turn people into frogs on Tuesdays.', 'I promise I don\'t bite. My hat does, sometimes.'] }]);
  L('mood.shy.w.self', ['I\'m Gandalf. I do fireworks, mostly, and wander about.', 'I\'m the wizard. I\'m much less alarming once you get past the eyebrows.']);
  L('mood.shy.w.jest', ['Shall I go and stand behind a tree? Would that help?', 'I\'ll do the talking. I\'m very good at it. Ask anyone. They\'ll say too good.']);
  L('mood.shy.w.intro', ['Have you met {moodGreeter}? Go and say hello. {MoodGreeter} doesn\'t bite.', 'Go and find {moodGreeter}. Tell {moodGreeter} the wizard sent you.'], {}, [{ if: { moodNewcomer: { min: 0 } }, text: ['Go and introduce yourself to {moodGreeter}. Best way to learn a village is a face at a time.'] }]);
  L('mood.shy.see', ['They\'re half behind the gatepost, as if it might hide them.', 'They twist the hem of their sleeve round one finger.']);

  L('mood.shy.freezes', ['*goes very red, and studies their own feet*', '*opens their mouth, and nothing comes out at all*'], {
    child: ['*hides behind the nearest grown-up, which turns out to be you*'], rift: ['*pulls their collar up and looks very hard at the ground*'],
  }, [{ if: { moodNewcomer: { min: 0 } }, text: ['*clutches their bundle and looks about for somewhere to escape to*'] }]);
  L('mood.shy.mumbles', ['...Hello. Sorry. Hello.', '...Mm. Good day. I mean. Yes.'], { child: ['...hi.'], rift: ['...Hey. Sorry. Bad signal. On me, I mean.'] });
  L('mood.shy.named', ['...{Name}. I\'m {name}. People mostly don\'t ask.', '{Name}. ...That\'s me. Hello.'], {
    child: ['{Name}. I\'m nearly {frag:mood.age}.'], rift: ['{Name}. That\'s my hill name. It\'ll do.'],
  }, [{ if: { moodNewcomer: { min: 0 } }, text: ['{Name}. I came in on the West Road. I don\'t know anybody yet.'] }]);
  frags('mood.age', ['seven', 'eight', 'nine', 'ten']);
  L('mood.shy.origin', ['...From down the road. A long way down.', 'I came for the work. And the quiet. I got the quiet.'], {
    rift: ['From the other side. The city. Neverdark. You\'ve probably heard. Everyone stares.'],
  }, [{ if: { moodNewcomer: { min: 0 }, rift: false }, text: ['From down the West Road. I\'d heard there were empty holes. And kind folk.'] }, { if: { moodRough: true }, pri: 1, text: ['...I\'ve been sleeping under a tree. The inn was full. It\'s quite a nice tree.'] }]);
  L('mood.shy.opens', ['...You\'re easy to talk to. For somebody so tall.', '...I\'m not good at this. But you make it easier.'], { child: ['...Are you really a wizard? You\'re nice.'], rift: ['...Huh. Full signal. That means you\'re all right.'] });
  L('mood.shy.titter', ['*a startled giggle, quickly smothered*', 'Ha... sorry. That was funny.'], { child: ['*giggles into both hands*'] });
  L('mood.shy.laughs', ['Ha! ...Oh. I didn\'t mean to laugh so loud.', 'Ha! A biting hat. ...I like you.'], { child: ['AHAHA. Do frogs. Do a frog. Go on.'] });
  L('mood.shy.faces', ['Nobody, really. I say hello and then I panic and talk about the weather.', 'The innkeeper. A dog. That\'s it. The dog was nice.'], { child: ['Nobody. They\'ve all got friends already.'] }, [{ if: { moodNewcomer: { min: 0 } }, text: ['Hardly anyone. I don\'t know where anything is. I\'ve walked past the Store three times.'] }]);
  L('mood.shy.shrinks', ['Oh, I couldn\'t. Not just go up to them. Not yet.', '...I\'d go red. I\'m going red now, just thinking.'], { child: ['NO. They\'ll laugh.'] });
  L('mood.shy.maybe', ['...Maybe. If I see them on their own.', 'I\'ll try. I\'ll practise first.'], { child: ['...Will you come with me? No? ...Maybe.'] });
  L('mood.shy.introduce', ['...All right. {MoodGreeter}. I\'ll go and say hello. Just hello.', '...If you think {moodGreeter} wouldn\'t mind. I\'ll try.'], { child: ['Okay! I\'ll go! ...What do I say? Hello. I\'ll say hello.'] });
  L('mood.shy.done', ['...Thank you. For talking to me.', '...That wasn\'t so bad. Thank you.'], { child: ['Bye, wizard! You\'re my friend now. Okay?'], rift: ['...Thanks. Ping me again some time.'] });

  // --- Sulking (and children in a tantrum) -------------------------------------------
  const S = (k, text, pri) => ({ if: { moodSulk: k }, pri: pri || 1, text });
  addSituation('sulk', {
    pri: 4.5, thread: 'mood.sulk', read: (F) => !!F.moodSulk && fresh(F, 'mood.sulk'),
    aps: {
      listen: { base: 1, out: ['leaveme', 'grumbles', 'spills'] },
      ask: { base: 1, out: ['leaveme', 'grumbles', 'spills'] },
      warm: { base: 1, out: ['shrugs', 'sniffs', 'melts'] },
      comfort: { base: 0, out: ['shrugs', 'sniffs', 'melts'] },
      jest: { base: 0, out: ['glare', 'snort', 'laughs'] },
      advise: { base: 0, out: ['bite', 'mutter', 'agrees'] },
    },
  });
  const unsulk = (T, v) => { if (v.sulk) { v.sulk = null; feel(v, 'sulk_over'); } if (v.tantrum) { v.tantrum = null; } unfeel(v, 'binge'); };
  const sulkStep = (T, v) => { unsulk(T, v); const k = T.F.moodSulk; const a = k === 'binge' || k === 'comfort' ? (v.homeId >= 0 ? ACTIONS.tea : null) : k === 'wander' || k === 'huffy' ? (v.homeId >= 0 ? ACTIONS.eat_home : null) : k === 'tantrum' ? ACTIONS.play : null; if (a) v.queue.push({ a }); };
  const mend = ladder('advise', { base: 0, after: 'spilled', out: ['bite', 'mutter', 'agrees'] });
  addThread({
    id: 'mood.sulk', situation: true, label: (F) => (F.moodSulk === 'tantrum' ? 'A tantrum' : F.moodSulk === 'binge' ? 'On a binge' : 'In a sulk'),
    beats: {
      leaveme: { line: 'mood.sulk.leaveme', go: [
        { ap: 'listen', say: '*You stay anyway, and say nothing.*', label: 'Stay anyway', to: 'grumbles' },
        { ap: 'jest', say: 'mood.sulk.w.jest', to: 'snort' },
      ] },
      grumbles: { line: 'mood.sulk.grumbles', go: [
        { ap: 'ask', say: 'And what\'s really the matter?', to: 'spills' },
        { ap: 'comfort', say: 'Sounds like a rotten few days.', to: 'sniffs' },
      ] },
      spills: { line: 'mood.sulk.spills', fx: { flag: 'spilled', learn: ['trouble', 'has been low for days, and sulks rather than say so'] }, go: [
        { ap: 'comfort', say: 'Oh, {name}. Why didn\'t you say?', to: 'melts' },
        { ap: 'advise', say: 'mood.sulk.w.home', to: mend },
      ] },
      shrugs: { line: 'mood.sulk.shrugs', go: [
        { ap: 'listen', say: '*You wait them out.*', label: 'Wait them out', to: 'grumbles' },
        { ap: 'jest', say: 'mood.sulk.w.jest', to: 'snort' },
      ] },
      sniffs: { line: 'mood.sulk.sniffs', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'Want to tell me?', to: 'spills' },
        { ap: 'warm', say: 'Come on. Nobody sulks well on an empty stomach.', to: 'melts' },
      ] },
      melts: { line: 'mood.sulk.melts', fx: { run: unsulk, trust: 0.04, fond: 0.03 }, go: [
        { ap: 'warm', say: 'There you are. I knew you were in there.', to: 'done' },
        { ap: 'advise', say: 'mood.sulk.w.home', to: mend },
      ] },
      glare: { line: 'mood.sulk.glare', fx: { fond: -0.03 }, go: [
        { ap: 'comfort', say: 'Sorry. I\'m a clumsy old thing.', to: 'sniffs' },
        { ap: 'listen', say: '*You hold up your hands, and wait.*', label: 'Hold up your hands', to: 'leaveme' },
      ] },
      snort: { line: 'mood.sulk.snort', go: [
        { ap: 'jest', say: 'mood.sulk.w.again', label: 'Push your luck', to: 'laughs' },
        { ap: 'ask', say: 'Go on. What is it?', to: 'spills' },
      ] },
      laughs: { line: 'mood.sulk.laughs', fx: { run: unsulk, fond: 0.03 }, go: [
        { ap: 'warm', say: 'That\'s more like it.', to: 'done' },
        { ap: 'advise', say: 'mood.sulk.w.home', to: mend },
      ] },
      bite: { line: 'mood.sulk.bite', fx: { respect: -0.02 }, go: [
        { ap: 'listen', say: '*You let them be cross at you.*', label: 'Let them be cross at you', to: 'grumbles' },
        { ap: 'warm', say: 'Fair. I\'ll stop telling you things.', to: 'shrugs' },
      ] },
      mutter: { line: 'mood.sulk.mutter', go: [{ ap: 'warm', say: 'That\'s all I ask.', to: 'done' }] },
      agrees: { line: 'mood.sulk.agrees', fx: { respect: 0.04, run: sulkStep }, end: true },
      done: { line: 'mood.sulk.done', fx: { remember: 'The wizard coaxed me out of a sulk. Cheek.', rv: 1 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('sit.sulk.listen', [{ text: ['*You sit down nearby, not too near, and wait.*', '*You lean on your staff and look at nothing in particular.*'] }]);
  lines('sit.sulk.ask', [{ text: ['What\'s up, {name}?', 'Bad day?'] }, S('binge', ['How many is that, {name}?']), S('tantrum', ['What\'s all this, then?'])]);
  lines('sit.sulk.warm', [{ text: ['I\'ve missed your face about the lane, {name}.', 'Come on, old friend. Walk with me a bit.'] }, S('tantrum', ['Come here, you. Big breath.'])]);
  lines('sit.sulk.comfort', [{ text: ['Oh, {name}. Come here.', 'Whatever it is, it\'s not your fault.'] }, S('tantrum', ['Shh. Shh. It\'s all right.'])]);
  lines('sit.sulk.jest', [{ text: ['Is this a sulk or a performance? I\'d like to know whether to clap.', 'If you pout any harder you\'ll be able to stand a teacup on that lip.'] }, S('binge', ['Are you drinking that or swimming in it?']), S('comfort', ['Leave a slice for the rest of the Shire, {name}.'])]);
  lines('sit.sulk.advise', [{ text: ['Go home, {name}. Have a bath. Start again tomorrow.'] }, S('binge', ['That\'s enough ale for one day, {name}. Water, and bed.']), S('tantrum', ['Stamp your feet three more times, then stop. That\'s the rule.'])]);
  L('mood.sulk.w.jest', ['I\'ll just stand here being cheerful at you, then.', 'Shall I sulk too? I\'m very good at it. I\'ve had centuries.']);
  L('mood.sulk.w.again', ['I\'m going to keep standing here. I\'m very tall and I can stand for hours.', 'The lip. It\'s still going. It\'s magnificent.']);
  L('mood.sulk.w.home', ['Go home, {name}. Put the kettle on. Let tomorrow be better.', 'Have a wash, have a meal, have an early night. Sulks hate all three.'], {}, [S('binge', ['Put the mug down and come and eat something.']), S('tantrum', ['Go and play. The sulk will get bored and wander off.'])]);

  L('mood.sulk.leaveme', ['Leave me be.', 'Go away. I\'m not talking.'], { ornery: ['Go and bother someone else, wizard.'], shy: ['*turns their back*'], proud: ['I wish to be alone.'], child: ['GO AWAY.'] }, [S('binge', ['Another, and keep \'em coming. And you can go.']), S('sharp', ['What do you want? What does anyone want?'])]);
  L('mood.sulk.grumbles', ['Nobody cares. Nothing goes right. And it\'s raining. Or it will.', 'It\'s everything. It\'s been everything for days.'], {
    ornery: ['Everyone\'s an idiot and the bread\'s stale. That\'s what\'s up.'], gloomy: ['Nothing. Everything. Same thing.'], proud: ['I\'ve been slighted. Repeatedly.'], child: ['Nobody LISTENS to me.'],
  }, [S('comfort', ['I\'m eating. That\'s what I\'m doing. It\'s the only thing that\'s going right.']), S('wander', ['I just walked. Up the valley and back. Nowhere was any better.'])]);
  L('mood.sulk.spills', ['...I\'ve been low for days. Nothing\'s wrong exactly. Everything\'s just grey.', '...Nobody\'s asked how I am in a week. So I stopped being nice about it.'], {
    shy: ['...I didn\'t know how to say I was sad. So I hid instead.'], ornery: ['...If you must know, I\'m tired. Tired of being the one who copes.'], child: ['...They said I was too little. I\'m NOT too little.'],
  }, [S('binge', ['...If I stop drinking I have to think. I don\'t want to think.']), S('sharp', ['...I keep snapping at people. I don\'t mean to. It just comes out.'])]);
  L('mood.sulk.shrugs', ['*shrugs, very hard*', 'Mm.'], { ornery: ['Don\'t be nice. It won\'t work.'], child: ['*folds arms and turns away*'] });
  L('mood.sulk.sniffs', ['*sniffs* ...Maybe.', '...Hm. That\'s kind. I\'m still sulking, mind.'], { child: ['*sniff* ...I\'m still cross.'], ornery: ['Hmph. ...Maybe a bit.'] });
  L('mood.sulk.melts', ['...Oh, all right. I\'m done. I\'m done sulking. It\'s tiring.', '*the sulk goes out of them like air out of a pig\'s bladder*'], {
    child: ['*sniffs, hiccups, and climbs into your lap*', '...Okay. I\'m better. Can I have a biscuit?'], ornery: ['Hmph. Fine. The sulk\'s over. Don\'t gloat.'], cheerful: ['Oh, what a goose I\'ve been. Thank you.'],
  });
  L('mood.sulk.glare', ['*a look that could curdle milk*', 'Get. Out. Of. My. Light.'], { child: ['I HATE you. ...Not really. But I\'m CROSS.'], proud: ['I don\'t find that amusing.'] });
  L('mood.sulk.snort', ['*a snort, despite everything*', 'Hmph. ...That\'s not funny.'], { child: ['*a giggle, quickly swallowed*'] });
  L('mood.sulk.laughs', ['Ha! Oh, curse you. I was doing so well.', 'Ha! ...A teacup. You\'re impossible. Fine. I\'m done.'], { child: ['AHAHA. My lip isn\'t THAT big. ...Is it?'], witty: ['Ha! Centuries of sulking. I\'d like to see that.'] });
  L('mood.sulk.bite', ['Don\'t tell me what to do!', 'I\'ll go home when I\'m ready.'], { child: ['NO.'], ornery: ['I\'ll sulk where I like, thank you.'] }, [S('binge', ['I\'ll have as many as I want. It\'s a free inn.'])]);
  L('mood.sulk.mutter', ['...I\'ll think about it.', 'Mm. Maybe.'], { child: ['...In a minute.'] });
  L('mood.sulk.agrees', ['...You\'re right. Home. A bath. Start again.', 'All right. All right. I\'m going. Before I change my mind.'], { child: ['Okay. I\'ll go and play. ...Will you watch?'], ornery: ['Fine. I\'m going. Not because you said.'] }, [S('binge', ['...Water, then. And bread. And bed. Don\'t tell the innkeeper I gave up.'])]);
  L('mood.sulk.done', ['...Thank you, wizard. Sorry about the face.', 'I feel a fool. A better fool than before, though.'], { child: ['Bye! I\'m not cross any more!'], ornery: ['Hmph. Don\'t tell anyone you saw me like that.'] });

  // --- Jealous: sore at somebody else's luck ------------------------------------------
  addSituation('jealous', {
    pri: 2.8, thread: 'mood.jealous', read: (F) => !!F.moodEnvy && fresh(F, 'mood.jealous') && daily(F, 13, 0.8),
    aps: {
      listen: { base: 1, out: ['denies', 'fumes', 'admits'] },
      ask: { base: 1, out: ['denies', 'fumes', 'admits'], know: (F) => F.rival === F.moodEnvy },
      warm: { base: 1, out: ['denies', 'pat', 'praise'] },
      comfort: { base: 0, out: ['pity', 'pat', 'admits'] },
      jest: { base: 0, out: ['stung', 'grudge', 'laughs'] },
      advise: { base: 0, out: ['bristle', 'think', 'congrats'], after: 'vented' },
    },
  });
  const shake = ladder('advise', { base: 0, after: 'vented', out: ['bristle', 'think', 'congrats'] });
  const makeUp = (T) => { const o = Game.villagers.find((x) => x.first === T.F.moodEnvy && x !== T.v); return o ? { to: o, kind: 'mend' } : null; };
  addThread({
    id: 'mood.jealous', situation: true, label: (F) => (F.moodEnvy ? `Sore about ${F.moodEnvy}` : 'Sore about something'),
    beats: {
      denies: { line: 'mood.jealous.denies', go: [
        { ap: 'listen', say: '*You raise one eyebrow, and wait.*', label: 'Raise an eyebrow', to: 'fumes' },
        { ap: 'jest', say: 'mood.jealous.w.jest', to: 'grudge' },
      ] },
      fumes: { line: 'mood.jealous.fumes', fx: { flag: 'vented' }, go: [
        { ap: 'ask', say: 'And was it a fair win?', to: 'admits' },
        { ap: 'advise', say: 'mood.jealous.w.shake', to: shake },
        { ap: 'jest', say: 'mood.jealous.w.jest', to: 'laughs' },
      ] },
      admits: { line: 'mood.jealous.admits', fx: { flag: 'vented', trust: 0.04 }, go: [
        { ap: 'advise', say: 'mood.jealous.w.shake', to: shake },
        { ap: 'warm', say: 'mood.jealous.w.praise', to: 'praise' },
      ] },
      stung: { line: 'mood.jealous.stung', fx: { fond: -0.03 }, go: [
        { ap: 'warm', say: 'Sorry. Yours was very fine too.', to: 'pat' },
        { ap: 'listen', say: '*You let them have their say.*', label: 'Let them have their say', to: 'fumes' },
      ] },
      grudge: { line: 'mood.jealous.grudge', go: [
        { ap: 'ask', say: 'Go on. Admit it. Just to me.', to: 'admits' },
        { ap: 'jest', say: 'mood.jealous.w.again', label: 'Push your luck', to: 'laughs' },
      ] },
      laughs: { line: 'mood.jealous.laughs', fx: { fond: 0.03 }, go: [
        { ap: 'advise', say: 'mood.jealous.w.shake', to: shake },
        { ap: 'warm', say: 'There. Next year\'s yours. I can feel it in my hat.', to: 'done' },
      ] },
      bristle: { line: 'mood.jealous.bristle', fx: { respect: -0.02 }, go: [
        { ap: 'listen', say: '*You let it lie a moment.*', label: 'Let it lie a moment', to: 'fumes' },
        { ap: 'warm', say: 'All right. Not today.', to: 'pat' },
      ] },
      think: { line: 'mood.jealous.think', go: [{ ap: 'warm', say: 'That\'s enough for today.', to: 'done' }] },
      congrats: { line: 'mood.jealous.congrats', fx: { respect: 0.05, queue: 'whisper_visit', queueExtra: makeUp, run: (T, v) => { const o = Game.villagers.find((x) => x.first === T.F.moodEnvy); if (o && v.sent && v.sent[o.id]) v.sent[o.id] = v.sent[o.id].filter((s) => s.tag !== 'prickly' && s.tag !== 'jealous'); } }, end: true },
      pity: { line: 'mood.jealous.pity', go: [
        { ap: 'listen', say: '*You hold your tongue, and wait.*', label: 'Hold your tongue', to: 'fumes' },
        { ap: 'jest', say: 'mood.jealous.w.jest', to: 'grudge' },
      ] },
      pat: { line: 'mood.jealous.pat', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'What is it about {moodEnvy} that gets under your skin?', to: 'admits' },
        { ap: 'advise', say: 'mood.jealous.w.shake', to: shake },
      ] },
      praise: { line: 'mood.jealous.praise', fx: { fond: 0.03, respect: 0.02 }, go: [
        { ap: 'advise', say: 'mood.jealous.w.shake', to: shake },
        { ap: 'jest', say: 'mood.jealous.w.again', label: 'Tease them', to: 'laughs' },
      ] },
      done: { line: 'mood.jealous.done', fx: { remember: 'The wizard let me grumble about {moodEnvy}, and didn\'t tell.', rv: 1 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('sit.jealous.listen', [{ text: ['*You fall in beside them, and wait for it to come out.*'] }]);
  lines('sit.jealous.ask', [{ text: ['What\'s {moodEnvy} done to you?', 'Something about {moodEnvy}?'] }, { if: { moodEnvyWhy: has }, text: ['Is this about {moodEnvy} {moodEnvyWhy}?'] }]);
  lines('sit.jealous.warm', [{ text: ['I\'d have given you the prize, {name}. For what it\'s worth.', 'Some days the luck goes the other way. It comes back.'] }]);
  lines('sit.jealous.comfort', [{ text: ['Oh, {name}. It\'s hard, watching someone else win.'] }]);
  lines('sit.jealous.jest', [{ text: ['You\'ve gone as green as a pickled onion, {name}.', 'Shall I put a hex on {moodEnvy}? Just a small one.'] }]);
  lines('sit.jealous.advise', [{ text: ['Go and shake {moodEnvy}\'s hand, {name}. It costs nothing and it\'ll drive {moodEnvy} mad.', 'Envy\'s a poor lodger, {name}. Turn it out.'] }]);
  L('mood.jealous.w.jest', ['Green suits you. It goes with the hedges.', 'Shall I turn {moodEnvy} into a turnip? I\'d need it in writing.']);
  L('mood.jealous.w.again', ['Pickled onion green. With a hint of cabbage.', 'I can hear your teeth grinding from here.']);
  L('mood.jealous.w.shake', ['Go and congratulate {moodEnvy}. Mean it, or don\'t. Just do it.', 'Shake {moodEnvy}\'s hand. Then go home and practise for next year.']);
  L('mood.jealous.w.praise', ['If it helps, I\'ve seen your work. It\'s not second to anybody\'s.', 'You lost a prize, not your knack. That\'s still yours.']);

  L('mood.jealous.denies', ['Jealous? Of {moodEnvy}? Ha! Don\'t make me laugh.', 'I\'m not bothered. Not at all. Good luck to {moodEnvy}. Hmph.'], {
    ornery: ['Jealous? I\'m furious. That\'s different.'], proud: ['I don\'t envy anybody. I simply note that justice was not done.'], cheerful: ['Me? No! Well... no. Not much.'], child: ['I DON\'T CARE. ...I care a bit.'],
  });
  L('mood.jealous.fumes', ['Everybody\'s talking about {moodEnvy}. All week. {MoodEnvy} this, {moodEnvy} that. I could spit.', 'Did you see the look on {moodEnvy}\'s face? Like the cat with all the cream. And the jug.'], {
    ornery: ['{MoodEnvy} cheated. I can\'t prove it. But I know it in my bones.'], proud: ['My entry was finer. Anybody with eyes could see it. Which rules out the judges.'],
    gloomy: ['It\'s always {moodEnvy}. Every year. Some folk are just luckier.'], witty: ['{MoodEnvy}\'s marrow was large, I\'ll grant. Large and dull. Like {moodEnvy}.'], child: ['{MoodEnvy} got picked and I didn\'t and it\'s NOT FAIR.'],
  }, [{ if: { moodEnvyWhy: has }, pri: 1, text: ['{MoodEnvy}. {MoodEnvyWhy}. I\'ve not slept for thinking about it.', 'You heard? {MoodEnvy}, {moodEnvyWhy}. I lost by a whisker. A WHISKER.'] }]);
  L('mood.jealous.admits', ['...All right. Yes. I\'m jealous. It\'s a horrid feeling and I can\'t shake it.', '...It was fair. That\'s what\'s so annoying. It was perfectly fair.'], {
    proud: ['...Very well. {MoodEnvy}\'s was better. This once. Write the day down.'], ornery: ['...Fine. {MoodEnvy} earned it. I hate that {moodEnvy} earned it.'], shy: ['...I wanted it so much. I never want things out loud.'], child: ['...{MoodEnvy}\'s was better. ...A bit.'],
  });
  L('mood.jealous.stung', ['Oh, that\'s funny, is it? Laugh at the loser.', 'Thanks. Very helpful.'], { ornery: ['Go and laugh with {moodEnvy}, then. You\'ll get on.'], proud: ['I fail to see the humour.'], child: ['That\'s MEAN.'] });
  L('mood.jealous.grudge', ['...Hmph. Pickled onion. ...That\'s quite good.', '*a grudging twitch of the mouth*'], { ornery: ['Hmph. A turnip would be an improvement.'] });
  L('mood.jealous.laughs', ['Ha! A turnip! ...Oh, don\'t tempt me.', 'Ha! All right. I\'m green. I\'m as green as a frog in a hedge.'], { witty: ['Ha! A small hex. Just enough to make it wobble.'], child: ['AHAHA! Do it! Turn {moodEnvy} into a turnip!'] });
  L('mood.jealous.bristle', ['I\'ll shake hands when I\'m good and ready. Which is never.', 'Congratulate {moodEnvy}? I\'d sooner eat a hedgehog.'], { proud: ['I don\'t take instruction in manners.'], child: ['NO. Never ever.'] });
  L('mood.jealous.think', ['...Maybe. After the sting\'s gone.', 'Perhaps. I\'ll see how I feel at market.'], { ornery: ['I\'ll think about it. Thinking\'s free.'] });
  L('mood.jealous.congrats', ['...You\'re right. I\'ll go and say well done. Through my teeth, but I\'ll say it.', 'All right. I\'ll shake {moodEnvy}\'s hand. And then I\'ll beat {moodEnvy} next year.'], {
    proud: ['A {surname} is gracious in defeat. Watch me be gracious.'], ornery: ['Fine. Well done, I\'ll say. Through gritted teeth.'], child: ['Okay. I\'ll say well done. But next time it\'s ME.'],
  });
  L('mood.jealous.pity', ['Don\'t feel sorry for me. I\'m not a loser. I came second.', 'I don\'t need comforting. I need a recount.'], { proud: ['Pity is for those who deserved to lose.'] });
  L('mood.jealous.pat', ['...Thanks. It does sting.', '...Hm. That\'s decent of you.'], { ornery: ['Hmph. Well. Maybe.'], child: ['...Okay.'] });
  L('mood.jealous.praise', ['...Do you think? Really? Well. I\'ll show them next year.', '...That\'s kind. It helps more than it should.'], { proud: ['Quite so. The knack is mine, whatever the judges said.'], shy: ['...Thank you. Nobody said that.'] });
  L('mood.jealous.done', ['...Thanks, wizard. It\'s smaller than it was.', 'Next year. Next year it\'s mine.'], { ornery: ['Not a word to {moodEnvy}. Not one word.'], child: ['Bye! I\'m going to practise!'] });

  // --- More ways of saying it (additive: tempers, stages and facts the first pass left out) ---
  const A = (key, by, more) => lines(key, Object.keys(by || {}).map((k) => ({ if: COND[k] || { temper: k }, text: by[k] })).concat(more || []));

  // homesick
  A('sit.homesick.listen', { child: ["*You sit on the step beside them, knees up by your ears.*"], elder: ["*You lean on the gate with them, two old things looking at the hills.*"] }, [H('rift', ["*You follow their gaze up to the scar in the sky, and say nothing.*"])]);
  A('sit.homesick.ask', { child: ["Missing your old room, little one?"], elder: ["Thinking of the old days, {name}?"] }, [H('road', ["Thinking of {moodOldHome}?"])]);
  A('sit.homesick.warm', { child: ["You know, the whole lane would be duller without you, small one."] }, [H('road', ["{MoodOldHome}'s loss is our gain, {name}. I mean that."]), H('bree', ["Bree would never deserve you, {name}. We barely do."])]);
  A('sit.homesick.jest', { child: ["Shall I fetch your old house here in my pocket? It might be a squeeze."] }, [H('road', ["Is it the {moodOldHome} cooking you miss? I hear it's mostly turnips."])]);
  A('sit.homesick.advise', { child: ["Find the best climbing tree here, and make it yours. That's how it starts."] }, [H('road', ["Write to {moodOldHome}, {name}, and then go and knock on a door here."])]);
  A('mood.homesick.w.tour', { child: ["Show me round. Where's the best hiding place?"] }, [H('rift', ["Walk me through Neverdark. Slowly. I'm old.", "If I stepped out of the rift beside you, where would we go first?"]), H('road', ["Walk me down the main lane of {moodOldHome}. Who's on the first doorstep?"])]);
  A('mood.homesick.w.hope', { elder: ["Those we miss are never as far off as the miles say, {name}."] }, [{ if: { moodHomesick: 'rift', lost: has }, pri: 1, text: ["Doors that opened once can open again, {name}. Keep {lost}'s name warm."] }]);
  A('mood.homesick.w.write', { child: ["Draw them a picture. The postie will carry a picture anywhere."] }, [H('bree', ["Write to your cousin in Bree. Ask what the rain's like. Then decide."])]);
  A('mood.homesick.w.jest', { child: ["I could teach the frogs to sing your old songs. They'd get the words wrong."] }, [H('rift', ["I'll ask the Lamplighter to flicker a bit. For atmosphere.", "Shall I stand on the hill with a lantern and shout adverts?"])]);
  A('mood.homesick.see', { child: ["They're clutching a small, battered toy that came with them from far away."] }, [H('road', ["Their boots are still worn from the West Road, and they haven't mended them."]), H('bree', ["There's a folded letter with a Bree postmark poking out of their pocket."])]);

  A('mood.homesick.shutter', {
    cheerful: ["Me? Homesick? Never! ...Well. A smidge. A very small smidge."], curious: ["I was only wondering what they're all doing back there. That's all. Wondering."],
    dreamy: ["I wasn't anywhere. Just thinking. Thinking takes you places."], witty: ["Homesick? I'm sick of nothing. Except perhaps questions."], elder: ["At my age you don't get homesick. You just get quiet."],
  }, [H('road', ["{MoodOldHome}? No. I'm quite over {moodOldHome}. Completely over it."]), H('bree', ["Bree? I only mentioned Bree once. Twice. A few times."])]);
  A('mood.homesick.describes', {
    curious: ["Every house had a different door knocker. I used to collect the sounds. I could tell you all of them."], gloomy: ["It was home. That's the whole of it. Nowhere else will be, not really."],
    witty: ["Home was where the gossip was better and the pies were worse. I miss both."], elder: ["When I was young there were orchards right down to the water. I'm told they're houses now."],
  }, [H('rift', ["You could get noodles at four in the morning. Here at four in the morning you get a rooster.", "The Relay used to hum in my pocket all day. Messages from everyone. Here my pocket's just a pocket."]), H('road', ["In {moodOldHome} the bakehouse opened at five and the whole lane smelt of it by six.", "There's a hill outside {moodOldHome} where you can see three villages at once. I used to count chimneys."])]);
  A('mood.homesick.aches', {
    cheerful: ["...I try to be bright about it. Mostly I manage. Today I didn't."], curious: ["...I keep wondering if they wonder about me. Isn't that a strange thing to wonder?"],
    dreamy: ["...I dream I'm back, and everyone's there, and nobody's surprised to see me."], proud: ["...I left without a proper farewell. That is not how I was raised."], child: ["...I miss my best friend. She lives far away now. Or I do."],
    elder: ["...Everyone I grew up with is over the hills or far off. I'm the last one who remembers the old songs."],
  }, [H('bree', ["...My cousin's the only one who writes. If I went, I'd have someone. Here I sometimes feel I don't."])]);
  A('mood.homesick.notsame', {
    shy: ["...It's not quite the same. But thank you for trying."], gloomy: ["Everyone thinks their road is like mine. It isn't."], child: ["But you're a WIZARD. Wizards don't have mums."],
  }, [H('road', ["You can go back down the West Road any day you like. I can't afford the boots."]), H('bree', ["You left because you wanted to. I'm stuck because I'm not sure."])]);
  A('mood.homesick.swap', {
    shy: ["...I didn't know wizards got homesick. That helps, a little."], ornery: ["Hmph. A wagon. At least you can take yours with you."], dreamy: ["A wagon and a road. That sounds like a song. A sad one."],
  }, [H('road', ["Do you ever pass {moodOldHome}? On your wagon? You could wave from me."])]);
  A('mood.homesick.kindred', {
    cheerful: ["Oh! We should start a club. The Not-From-Here Club. You can be president."], ornery: ["Hmph. So you're a stray as well. Well, that's something."], proud: ["Then we are both travellers of distinction. I can bear that."],
  }, [H('road', ["You're from far off too. I can tell. You look at the hills like I do."])]);
  A('mood.homesick.warmed', {
    cheerful: ["Oh, you are a dear. I'll have a better day for that."], dreamy: ["...Glad of me. I'll keep that, and look at it later."], proud: ["That is most gracious of you, wizard."], elder: ["Bless you. An old body likes to be wanted somewhere."],
  }, [H('rift', ["Hill-folk count. Huh. My signal's better already."])]);
  A('mood.homesick.belongs', {
    shy: ["...Belong. I've never belonged anywhere loud enough to notice."], dreamy: ["...Maybe home is just wherever someone keeps a chair for you."], child: ["So I can stay? For always? Even when I'm big?"], elder: ["At my time of life, to put down new roots. Who'd have thought it."],
  }, [H('road', ["...Maybe {moodOldHome} can be where I'm from, and here can be where I am."])]);
  A('mood.homesick.flat', {
    cheerful: ["Ha. ...No, sorry. Not today. Not that one."], proud: ["I don't believe my feelings are a jest, wizard."], dreamy: ["...Oh. I thought you understood."],
  }, [H('road', ["Funny. They make jokes like that in {moodOldHome}. I miss those too, worse luck."])]);
  A('mood.homesick.grin', {
    cheerful: ["Ha! Oh, go on, then. It was a bit funny."], ornery: ["Hmph. ...Very well. I'll allow it."], child: ["Hee. Glowing hens. That would be good."],
  }, [H('bree', ["Ha. Forty puddles. You've been, then."])]);
  A('mood.homesick.laughs', {
    cheerful: ["Ha! Oh, I needed that. My face had forgotten how."], ornery: ["Ha! You're a menace. A useful one."], child: ["AHAHA! Do it! Make the hens glow!"], elder: ["Ha! You've made an old hobbit snort. That's rare these days."],
  });
  A('mood.homesick.bristle', {
    shy: ["...I'm trying. I am. It's just slower than people want."], cheerful: ["I know, I know. Make the best of it. I am! Mostly!"], child: ["I don't WANT to like it here. Not yet."],
  }, [H('road', ["Everyone in {moodOldHome} said I'd settle. Everyone here says it too. Nobody says how."])]);
  A('mood.homesick.maybe', { ornery: ["Hmph. I'll think on it."], dreamy: ["Maybe. I'll go at dusk, when everything looks like somewhere else."], child: ["Maybe. If you come too."] });
  A('mood.homesick.heretoo', {
    shy: ["...There's a corner of the library that smells like my old window seat. I'll go there."], ornery: ["Hmph. The miller's wheel does creak like the old bridge did. I'll give you that."],
    child: ["The big tree has a hole like my old mouse hole! Maybe a new mouse lives there!"], elder: ["The church bells over the hill on a still day. Just like home. I'd stopped listening."],
  }, [H('road', ["...The Bakehouse at five in the morning. That smells just like {moodOldHome}. I'll go tomorrow."])]);
  A('mood.homesick.tour', {
    shy: ["...My window seat. Only you'd have to be very quiet."], ornery: ["The pub. Then the other pub. Then home, to complain about both."], proud: ["The hall where my family's name is carved over the door. Second from the left."],
  }, [{ if: { moodHomesick: 'rift', moodHomeThing: has }, pri: 2, text: ["First, {moodHomeThing}. Then everything else. But {moodHomeThing} first."] }, H('road', ["The stile at the bottom of {moodOldHome}. Everyone falls off it the first time. Everyone."])]);
  A('mood.homesick.hope', { shy: ["...Thank you. I'll say their names tonight. Louder."], dreamy: ["Tea, and someone thinking of them. Yes. I'll think of them."], child: ["Do you think they miss me too?"] });
  A('mood.homesick.promise', { shy: ["...Nobody's ever said they'd look for anyone for me."], ornery: ["Hmph. Don't make promises you can't keep. ...Keep it, though."] }, [{ if: { moodHomesick: 'rift', lost: has }, pri: 1, text: ["{lost}. My {lostRel}. Ping me the second you hear. Day or night."] }]);
  A('mood.homesick.letter', { ornery: ["A letter. Fine. A short one. With complaints in it."], dreamy: ["I'll write by candlelight. It feels further away that way, and nearer."] }, [H('bree', ["I'll write to my cousin. And ask if the room's still there. Just to know."]), H('road', ["I'll write to {moodOldHome} tonight. My mum will cry at the spelling."])]);
  A('mood.homesick.done', { ornery: ["Hmph. Talking. It's overrated. ...It helped."], child: ["Bye, wizard! I'm going to find the mouse hole!"], elder: ["Thank you, my dear. Old roots ache. You've warmed them."] }, [H('road', ["Thank you. {MoodOldHome} feels nearer. And so does here, oddly."])]);

  // lonely
  A('sit.lonely.warm', { elder: ["Just the hobbit I hoped to find, {name}. Spare an old wizard a minute?"] });
  A('sit.lonely.ask', { child: ["Nobody to play with today?"], elder: ["Had many callers this week, {name}?"] });
  A('sit.lonely.share', { child: ["I have days with nobody to talk to, too. Even wizards do."] });
  A('sit.lonely.jest', { child: ["Have all your friends been eaten by a giant? I'll have words with him."] });
  A('mood.lonely.w.see', { elder: ["Ask the young ones round. They'd love your stories, {name}. Try them."] }, [{ if: { stage: 'child' }, text: ["Go and ask to join in. The worst they can say is no, and they won't."] }, { if: { homeless: true }, text: ["Go and sit in the Badger tonight. Nobody's lonely by that fire for long."] }]);
  A('mood.lonely.w.jest', { child: ["The ducks on the pond asked after you. Very rude ducks, but they asked."] });
  A('mood.lonely.braveface', {
    shy: ["...I don't mind being on my own. I'm used to it."], curious: ["Lonely? I've been reading. Books are company. Mostly they don't answer back."], dreamy: ["I'm never really alone. I've all sorts in my head."],
    witty: ["Lonely? I'm excellent company. I'm only sorry nobody else gets to enjoy me."], gloomy: ["Nobody comes. So what. I don't mind. I don't."],
  }, [{ if: { spouse: has }, text: ["I've {spouse}. When {spouse}'s home. Which isn't often."] }]);
  A('mood.lonely.thaws', { cheerful: ["Oh! Well, I'm glad of yours. Very glad."], curious: ["...You came over specially? To me? Why?"], gloomy: ["...Glad of me. Hm. Somebody is."], elder: ["Bless you. You're the first to stop all day."] });
  A('mood.lonely.glows', { cheerful: ["Oh, you've made my whole week! The whole of it!"], ornery: ["Hmph. Well. ...Well. That's very decent of you."], dreamy: ["...I'll keep that. I'll keep it in my pocket for the quiet days."], proud: ["How kind. Not that I was lacking company. But kind."] });
  A('mood.lonely.silent', { shy: ["*fiddles with a button, and looks hopefully at you*"], ornery: ["*grunts, and stares at the ground*"], child: ["*kicks at a stone, and doesn't look up*"], elder: ["*sits very still, the way folk do who've been still a long time*"] });
  A('mood.lonely.pours', { curious: ["I keep finding things out and there's nobody to tell. I told the hens about the moon last night."], witty: ["My best conversation this week was with a cat. I lost the argument."], dreamy: ["I walk the lanes in the evening and see all the lit windows. All those people. None of them mine."] });
  A('mood.lonely.opens', { cheerful: ["...Everyone thinks I'm fine because I smile. So I smile. And then go home to nobody."], ornery: ["...If I'm prickly, folk leave me be. Then I wish they hadn't."], proud: ["...I am not in the habit of asking for company. So I never get any."], elder: ["...Some days the only voice I hear is mine, reading aloud to the cat."] });
  A('mood.lonely.pity', { shy: ["...Please don't. It makes it worse."], child: ["I'm NOT sad. Stop looking at me like that."], elder: ["Don't you start pitying me, young man. I'm older than you look."] });
  A('mood.lonely.swap', { shy: ["...You get lonely too? I thought it was just me."], ornery: ["Hmph. Lonely wizards. Whatever next."], dreamy: ["A wizard alone on a long road. That's a lonely picture. And a lovely one."] });
  A('mood.lonely.kindred', { ornery: ["Hmph. A club. Fine. But I'm not making the tea."], child: ["Can I be in the club too? Can I be in charge?"], elder: ["A club of two old things. Count me in, wizard."] });
  A('mood.lonely.hurt', { cheerful: ["...Oh. Ha. Yes. Very good."], gloomy: ["Course. Even the wizard thinks it's funny."], elder: ["...That's unkind, from you."] });
  A('mood.lonely.smile', { ornery: ["Hmph. Toads. Some of them could do with it."], shy: ["*a tiny smile, that tries to hide*"], elder: ["Ha. Toads. My old friend Bramble would have laughed at that."] });
  A('mood.lonely.laughs', { shy: ["*laughs, and then looks startled at the sound*"], ornery: ["Ha! Hmph. A goat. I'll bet it was."], elder: ["Ha! Oh, I haven't laughed out loud in days."] });
  A('mood.lonely.prickly', { shy: ["...I know. I know I should. It's not that easy."], proud: ["I don't need arranging, thank you."], elder: ["Easy for the young. My friends are all over the hills."] });
  A('mood.lonely.maybe', { ornery: ["Hmph. Maybe. If I'm in the mood."], child: ["...Maybe. Will you watch from over there?"], elder: ["I might. If my knees allow."] });
  A('mood.lonely.plan', { cheerful: ["Yes! Right now! Why didn't I think of it? I'm off!"], proud: ["A call, then. I shall pay a call. That is perfectly proper."], elder: ["I'll go and knock. And take the good biscuits, not the broken ones."] });
  A('mood.lonely.whomiss', { shy: ["...Anyone who'd just sit with me. Without me having to be interesting."], ornery: ["Nobody. Everybody. Someone who argues back properly."], elder: ["The ones I grew up with. And there's no knocking on their doors now."] }, [{ if: { spouse: has }, text: ["{spouse}, if I'm honest. And {spouse} lives in the same hole."] }]);
  A('mood.lonely.done', { cheerful: ["Thank you! I feel ten times lighter!"], proud: ["Most agreeable. You must call again."], elder: ["Bless you for stopping. Come again. I'm always in."] });

  // shy
  A('sit.shy.warm', { elder: ["Good day! Don't mind the hat. It's more frightening than I am."] });
  A('sit.shy.ask', { child: ["And what's your name, then? Mine's long and tiresome."] });
  A('sit.shy.jest', { child: ["Shall I make my eyebrows wiggle? I'm told it's alarming."] });
  A('mood.shy.w.self', { child: ["I'm Gandalf. I make the fireworks. The bangy ones."] }, [{ if: { moodNewcomer: { min: 0 } }, text: ["I'm Gandalf. I'm not from here either, so we'll muddle along together."] }]);
  A('mood.shy.w.jest', { child: ["I'll do my best impression of a hatstand while you think of something."] });
  A('mood.shy.w.intro', {}, [{ if: { moodGreeter: has, stage: 'child' }, text: ["Go and ask {moodGreeter} for a story. {moodGreeter} knows the best ones."] }]);
  A('mood.shy.see', { child: ["They're peeping at you round the edge of their hands."] }, [{ if: { moodRough: true }, text: ["There are leaves in their hair, from sleeping under a hedge."] }]);
  A('mood.shy.freezes', { shy: ["*swallows hard, and says nothing at all*"], proud: ["*holds very still, as if being looked at were a test*"], elder: ["*clutches their stick and looks the other way*"] });
  A('mood.shy.mumbles', { shy: ["...Oh. Hello. Sorry. I didn't see you. I did see you."], cheerful: ["Oh! Hello! Hello. Sorry, I went all funny."], ornery: ["...Hm. Good day. What?"], elder: ["...Good morning. Afternoon. Whatever it is."] });
  A('mood.shy.named', { shy: ["...{name}. It's {name}. You can forget it if you like."], cheerful: ["{name}! I'm {name}. I should have said straight off."], proud: ["{name}. {name} {surname}. We're a very old family."], elder: ["{name}, they call me. Have done for a long while."] });
  A('mood.shy.origin', { child: ["From a long way away. We came on a cart. I was sick on the cart."], elder: ["From further off than my legs like to remember."] }, [{ if: { rift: true, moodRough: true }, pri: 2, text: ["...Out of the sky. And then under a tree. The tree's nicer than the sky was."] }]);
  A('mood.shy.opens', { cheerful: ["Oh, you're nice! I didn't know if wizards would be nice."], ornery: ["...Hm. You're not so bad. For someone so loud in the hat."], elder: ["...You've a way with you. My old mum had it."] });
  A('mood.shy.titter', { ornery: ["*a snort, quickly turned into a cough*"], rift: ["*a short laugh, half static*"] });
  A('mood.shy.laughs', { cheerful: ["Ha! Oh, I like you. I can tell already."], ornery: ["Ha! ...Hmph. That was funny. Don't tell anyone I laughed."], elder: ["Ha! A biting hat. My grandad had one of those."] });
  A('mood.shy.faces', { cheerful: ["Oh, loads! I've forgotten all their names. Loads, though."], elder: ["The ones I knew are mostly gone. I've not met the new ones."], rift: ["Three folk and a goose. The goose was the least scared of me."] }, [{ if: { moodRough: true }, text: ["The innkeeper said there was no room. And a hedgehog under my tree. That's it."] }]);
  A('mood.shy.shrinks', { ornery: ["I'm not going to go up to strangers. They might talk to me."], elder: ["At my age you don't go introducing yourself. They come to you, or they don't."], rift: ["Nope. Low battery. Can't do people today."] });
  A('mood.shy.maybe', { cheerful: ["Maybe! I'll try! I'll probably panic, but I'll try!"], elder: ["Perhaps. If I see them at the Store."], rift: ["Maybe. When my signal's up."] });
  A('mood.shy.introduce', { cheerful: ["Right! I'm going! Before I lose my nerve! Wish me luck!"], elder: ["Very well. I'll go and make myself known. Slowly."] }, [{ if: { moodGreeter: has, rift: true }, pri: 1, text: ["{moodGreeter}. Okay. Ping, then. In person. Weird, but okay."] }]);
  A('mood.shy.done', { cheerful: ["Oh, that was nice! Thank you, wizard!"], elder: ["Thank you. It's good to be spoken to."] }, [{ if: { moodNewcomer: { min: 0 } }, text: ["...Thank you. I think I might like it here. One day."] }]);

  // sulk
  A('sit.sulk.listen', { child: ["*You sit on the grass a little way off, and wait for the storm to blow out.*"] }, [S('binge', ["*You take the stool next to them, and order a glass of water.*"])]);
  A('sit.sulk.ask', { elder: ["What's got into you today, old friend?"] }, [S('wander', ["Where are you off to, {name}?"]), S('sharp', ["Who's rubbed you up the wrong way?"])]);
  A('sit.sulk.warm', { elder: ["Walk with me a bit, {name}. My old legs want company."] }, [S('comfort', ["Save me a slice, {name}, and sit with me."])]);
  A('mood.sulk.w.jest', { child: ["I'll sulk too. Look. *you stick out your lip* Am I doing it right?"] }, [S('binge', ["Is there any ale left in the cellar, or have you had it all?"])]);
  A('mood.sulk.w.again', { child: ["Look. My lip goes out further than yours. Watch."] }, [S('huffy', ["You huff like a bellows, {name}. You could light the forge."])]);
  A('mood.sulk.w.home', { elder: ["Go and sit by your own fire, {name}. It's missed you."] }, [S('wander', ["Turn your feet towards home, {name}. They know the way."]), S('sharp', ["Go and say sorry to whoever you snapped at. Then go home."])]);
  A('mood.sulk.leaveme', { cheerful: ["Not today. Not even you. Go on."], curious: ["Don't ask me anything. I've no answers today."], gloomy: ["Leave me. I'm better on my own. I'm worse company than nobody."] }, [S('huffy', ["*huffs, and walks a bit faster*"]), S('comfort', ["Mmph. Busy. *chews*"]), S('wander', ["I'm going for a walk. A long one. On my own."])]);
  A('mood.sulk.grumbles', { cheerful: ["I can't be cheerful all the time. Today I can't at all."], curious: ["I keep asking myself what's wrong. I don't know. That's worse."], elder: ["When you're old, nobody asks. They just say you're in one of your moods."] }, [S('huffy', ["I walked out. I walked out and I'm still walking. Hmph."]), S('sharp', ["Everyone keeps talking to me. I don't want to be talked to."])]);
  A('mood.sulk.spills', { cheerful: ["...I'm always the jolly one. It's exhausting, being jolly. I ran out."], proud: ["...I made a mistake at work and everyone saw it. Everyone."], elder: ["...My hands shake now. I dropped the good teapot. My mother's teapot."] }, [S('comfort', ["...When I'm eating I don't feel the empty bit. That's all it is."]), S('wander', ["...I kept thinking if I walked far enough I'd leave it behind. It walked with me."])]);
  A('mood.sulk.shrugs', { cheerful: ["*tries to smile and doesn't quite manage*"], proud: ["*lifts their chin and says nothing*"], elder: ["*shrugs, slow and heavy, like an old coat*"] }, [S('binge', ["*shrugs, and takes another pull*"])]);
  A('mood.sulk.sniffs', { cheerful: ["...You're a love. I don't deserve it today."], proud: ["...I am not crying. It is the pollen."], elder: ["*sniff* ...You always were a soft old thing."] });
  A('mood.sulk.melts', { shy: ["*a long wobbly breath, and then a small smile*"], proud: ["...Very well. I may have been somewhat sulky. Somewhat."], elder: ["...Oh, you old meddler. Help me up, then."] }, [S('binge', ["*pushes the mug away* ...That's enough of that. Thank you."]), S('comfort', ["*puts down the cake* ...I'm not even hungry. I haven't been for hours."])]);
  A('mood.sulk.glare', { cheerful: ["...That's not like you. Or me. Go away."], shy: ["*goes red and stares at the ground, furious*"], elder: ["Don't you cheek your elders, young man."] }, [S('binge', ["*glares over the rim of the mug*"])]);
  A('mood.sulk.snort', { cheerful: ["Pfft! Stop it. I'm being miserable."], proud: ["*a most undignified snort escapes*"], elder: ["*wheezes, which is laughing, for them*"] });
  A('mood.sulk.laughs', { cheerful: ["Ha! Oh, there I am! I wondered where I'd gone."], ornery: ["Ha! Blast you. I was sulking beautifully."], elder: ["Ha! Oh, you've undone me. A whole sulk, wasted."] }, [S('binge', ["Ha! Swimming in it. I nearly was. Pass the water."])]);
  A('mood.sulk.bite', { cheerful: ["Not now, wizard. Even for you."], proud: ["I am quite capable of managing my own evening."], elder: ["I've been going home on my own since before you had a beard."] }, [S('comfort', ["I'll stop eating when there's nothing left to eat."]), S('wander', ["I'll walk where I like. The hills don't mind."])]);
  A('mood.sulk.mutter', { ornery: ["Hmph. Maybe. Don't push it."], elder: ["...We'll see. We'll see."] });
  A('mood.sulk.agrees', { cheerful: ["Oh, you're right. Bath, supper, bed. I'll be myself in the morning."], proud: ["A sensible course. I had reached it myself, of course."], elder: ["All right. Home. My chair has a dent the shape of me. It's waiting."] }, [S('comfort', ["...You're right. I'll put the cake away and go for a walk. A short one."]), S('wander', ["...All right. Back home. I'll take the long way. But home."])]);
  A('mood.sulk.done', { cheerful: ["Thank you, wizard. I'm back. Mostly."], proud: ["I trust this will remain between us."], elder: ["Thank you. Even old hobbits need talking round."] });

  // jealous
  A('sit.jealous.listen', { elder: ["*You lean on the fence beside them and wait for the grumble.*"] });
  A('sit.jealous.ask', { child: ["What's {moodEnvy} got that you haven't?"] });
  A('sit.jealous.comfort', { child: ["Oh, little one. It's horrid when it's not you."] });
  A('sit.jealous.advise', { child: ["Go and say well done to {moodEnvy}. It makes you feel bigger."] });
  A('mood.jealous.w.jest', { child: ["Shall I make {moodEnvy}'s nose go green instead? Then you'll match."] });
  A('mood.jealous.w.again', {}, [{ if: { moodEnvyWhy: has }, text: ["You'll wear a hole in the lane, stamping like that."] }]);
  A('mood.jealous.w.shake', { child: ["Go and tell {moodEnvy} well done. Then come back and tell me how brave you were."] });
  A('mood.jealous.w.praise', { child: ["You're still the best at lots of things. I've seen you."] });
  A('mood.jealous.denies', { shy: ["...I'm pleased for {moodEnvy}. I am. Really."], curious: ["Jealous? I'm only interested. In how {moodEnvy} did it. Purely interested."], dreamy: ["I'm not jealous. I'm just imagining it was me. That's different."], witty: ["Jealous? Of {moodEnvy}? I'd sooner envy a parsnip."], elder: ["At my age? Jealous? Pah. Of a youngster like {moodEnvy}?"] });
  A('mood.jealous.fumes', { cheerful: ["I'm happy for {moodEnvy}. I am! I just wish I were a bit happier for me."], shy: ["...Everyone keeps saying {moodEnvy}'s name. I want to put my fingers in my ears."], curious: ["How did {moodEnvy} do it? I watched and watched. I can't see the trick."], elder: ["In my day you had to earn it over years. {moodEnvy} earned it in an afternoon."] });
  A('mood.jealous.admits', { cheerful: ["...Yes. Green as grass. I'm not proud of it."], curious: ["...I suppose I'm jealous. It's a funny feeling. Like a stone in your boot."], dreamy: ["...I wanted it to be me. I'd already pictured it."], elder: ["...I've been jealous of {moodEnvy}'s sort since I was small. Never grown out of it."] });
  A('mood.jealous.stung', { shy: ["*goes very quiet*"], cheerful: ["...Ha. Yes. Very funny. Ouch."], elder: ["You'd not laugh if you'd waited as long as me."] });
  A('mood.jealous.grudge', { cheerful: ["Ha. ...All right, that was a bit good."], proud: ["*the faintest twitch of the lip, quickly mastered*"], child: ["Hee. A green nose."] });
  A('mood.jealous.laughs', { cheerful: ["Ha! Oh, I'm ridiculous. Thank you for noticing."], ornery: ["Ha! A turnip. I'd pay to see it."], elder: ["Ha! You've a wicked streak, for a wizard."] });
  A('mood.jealous.bristle', { cheerful: ["Not today. Maybe tomorrow. Not today."], shy: ["...I can't. I'd go red and say something silly."], elder: ["I've shaken enough hands for one lifetime."] });
  A('mood.jealous.think', { cheerful: ["Maybe. When I'm less green."], shy: ["...I'll see. If {moodEnvy}'s on their own."], child: ["...Maybe later. After tea."] });
  A('mood.jealous.congrats', { cheerful: ["Right! I'll go and say it, and I'll even mean it. Mostly."], shy: ["...I'll go. I'll say well done. Quietly."], elder: ["I'll go and shake {moodEnvy}'s hand. My father would have."] });
  A('mood.jealous.pity', { cheerful: ["Oh, don't feel sorry for me! I'll only cry."], child: ["I'm not a BABY. I just wanted to win."], elder: ["Pity's for the old. Oh. Well. Still."] });
  A('mood.jealous.pat', { cheerful: ["...You're kind. It still stings, mind."], shy: ["...Thank you."], proud: ["...Most considerate."], elder: ["...Thank you, lad. It's a long while since anyone patted me."] });
  A('mood.jealous.praise', { cheerful: ["Oh! Oh, do you mean it? Then I don't mind half so much."], ornery: ["Hmph. At least somebody has an eye."], child: ["Really? Am I the best at something?"], elder: ["Kind words to an old hobbit. They go a long way."] });
  A('mood.jealous.done', { cheerful: ["Thank you! I feel a bit less green."], shy: ["...Thank you for listening."], proud: ["This conversation did not take place."], elder: ["Thank you, my dear. Old hearts can be petty. You've eased mine."] });

  // weather, season, hour and household, for a little more of the world in it
  const Wt = (k, text) => ({ if: { weather: k }, text });
  const Sn = (k, text) => ({ if: { season: k }, text });
  A('mood.homesick.w.here', { child: ["Is there a puddle here as good as your old one? There must be. Go and find it."], elder: ["Find the oldest tree in the village and sit under it. Old trees are the same everywhere."] }, [H('road', ["Ask the postie about {moodOldHome}. Postmen know a bit of everywhere."])]);
  A('mood.homesick.maybe', { proud: ["I shall consider it. In due course."], shy: ["...Maybe. When nobody's looking."] }, [H('rift', ["Maybe. When I've recharged a bit."])]);
  A('mood.homesick.describes', {}, [Sn('winter', ["In winter at home we'd skate on the millpond and come in to hot cider. Nobody skates here."]), Wt('rain', ["Rain like this reminds me of home. That's the trouble with rain."])]);
  A('mood.homesick.shutter', {}, [{ if: { hour: 'evening' }, text: ["It's only the evenings. Evenings are when I think of it. I'll be fine by morning."] }]);
  A('mood.homesick.aches', {}, [{ if: { hour: 'night' }, text: ["...It's worst at night. That's when they're all sitting down to supper, back there, without me."] }]);
  A('mood.homesick.heretoo', {}, [Wt('rain', ["...The rain on the round windows sounds like home. I'll sit by the window tonight and listen."])]);
  A('mood.homesick.hope', { elder: ["Tea and kind thoughts. That's all any of us can send, at my age."], proud: ["A fitting hope. I'll hold to it."] });
  A('mood.homesick.letter', { child: ["I'll draw the hens! Mum always liked hens."], proud: ["A letter, properly written. On the good paper."] });
  A('mood.homesick.notsame', { cheerful: ["...It isn't quite the same. But it's nice of you to say."], elder: ["You're young, for a wizard. You'll learn there's no going back."] });
  A('mood.homesick.swap', { cheerful: ["A wagon! Does it have a little stove? I'd love a wagon with a stove."], child: ["Does your wagon have a horse? What's its name?"] });
  A('mood.homesick.flat', { child: ["That's not funny! I really miss it!"], elder: ["Hmph. I was enjoying being sad, thank you."] });
  A('mood.homesick.grin', { proud: ["*a reluctant, rather dignified smile*"], elder: ["Ha. You're a cheeky one, for your years."] });

  A('mood.lonely.braveface', {}, [Wt('rain', ["Who goes visiting in the rain? Nobody. So I don't mind. Much."]), Sn('winter', ["Everyone stays in, in winter. It's only natural. I'm fine with the fire."]), { if: { kid: has }, text: ["I've {kid} for company. When {kid} isn't off with friends. Which is always."] }]);
  A('mood.lonely.pours', {}, [{ if: { hour: 'evening' }, text: ["It's the evenings. The day's all right, there's work. Then the door shuts and it's just the clock."] }, Sn('winter', ["Winter's long when nobody knocks. I've counted every knot in the ceiling."]), { if: { job: has }, text: ["I'm at my work all day with folk about, and nobody says more than good morning."] }]);
  A('mood.lonely.whomiss', { child: ["Someone to walk to school with. Everybody has someone."], curious: ["Someone to tell things to. I find things out and they just sit in me."] });
  A('mood.lonely.silent', { cheerful: ["*opens their mouth to say something bright, and doesn't*"], proud: ["*looks straight ahead, very upright, very alone*"] });
  A('mood.lonely.smile', { cheerful: ["Ha! I'd not be surprised. Half of them croak already."], child: ["*giggles* A toad can't play hopscotch."] });
  A('mood.lonely.maybe', { cheerful: ["Maybe! Oh, maybe. I'll think about it all afternoon."], proud: ["I may pay a call. If it's convenient."] });
  A('mood.lonely.done', { child: ["Bye! Come and play again tomorrow!"], gloomy: ["...That helped. Don't tell anyone it helped."] });

  A('mood.shy.mumbles', { child: ["...My mum says don't talk to strangers. You're a stranger. Hello."] });
  A('mood.shy.named', {}, [{ if: { moodRough: true }, pri: 1, text: ["...{name}. I'm the one sleeping under the big tree. You might have seen my boots."] }]);
  A('mood.shy.faces', { proud: ["A few. The right sort, I think. I'm choosy."], shy: ["...I know their faces. Not their names. I'm too shy to ask names."] });
  A('mood.shy.opens', { proud: ["You have a certain dignity. I find I can talk to you."], child: ["You're funny. Can I touch your staff? I won't break it."] });
  A('mood.shy.titter', { cheerful: ["*a giggle, then a bigger one*"], elder: ["*a creaky little chuckle*"] });
  A('mood.shy.introduce', { proud: ["Very well. I shall present myself. Properly."], shy: ["...All right. I'll go. I'll practise hello on the way."] });
  A('mood.shy.done', { shy: ["...That was the longest I've talked to anyone in weeks. Thank you."], proud: ["A pleasure, wizard. A genuine one."] });
  A('mood.shy.freezes', { cheerful: ["*starts to smile, gets flustered, and looks at the sky instead*"], curious: ["*stares at your hat with great interest and no words at all*"] });

  A('mood.sulk.leaveme', { elder: ["Leave an old hobbit to the grumbles. Go on. Shoo."] }, [S('holeup', ["*a curtain twitches, and stays shut*"]), S('tantrum', ["NO! I'm NOT TALKING to ANYONE!"])]);
  A('mood.sulk.grumbles', {}, [S('tantrum', ["They said NO and it's NOT FAIR and I HATE it!"]), S('binge', ["One more, I said. Then one more. It's been one more all afternoon."])]);
  A('mood.sulk.shrugs', { child: ["*flops on the grass and refuses to move*"] }, [S('wander', ["*shrugs, and looks off towards the far end of the valley*"])]);
  A('mood.sulk.sniffs', { shy: ["...*sniff*. Thank you."] }, [S('tantrum', ["*sniff* *hic* ...I'm still a bit cross."])]);
  A('mood.sulk.glare', {}, [S('tantrum', ["*stamps both feet, very hard*"]), S('sharp', ["Is that meant to help? It doesn't."])]);
  A('mood.sulk.snort', { child: ["*snorts, and then is cross about snorting*"] }, [S('comfort', ["*snorts crumbs*"])]);
  A('mood.sulk.mutter', { cheerful: ["Mm. Maybe. I'll see how I feel after."], proud: ["I shall weigh it."] }, [S('binge', ["After this one. Then we'll see."])]);
  A('mood.sulk.agrees', {}, [S('huffy', ["...All right. Back home. I've huffed enough for one day."]), S('sharp', ["...I'll go and say sorry. I've snapped at half the lane."])]);
  A('mood.sulk.done', { child: ["Thank you, wizard. I'm not cross now. Promise."] }, [S('binge', ["...Thank you. I'll be sore-headed tomorrow. I'll deserve it."])]);
  A('mood.sulk.bite', {}, [S('tantrum', ["I WON'T and you CAN'T make me!"]), S('sharp', ["Don't you start as well!"])]);

  A('mood.jealous.denies', { proud: ["I am above such feelings. Mostly."], gloomy: ["Jealous? No. Just used to losing."] }, [{ if: { rival: (r, F) => !!r && r === F.moodEnvy }, text: ["{rival} again. Always {rival}. Me jealous? Of {rival}? Ha."] }]);
  A('mood.jealous.fumes', {}, [{ if: { rival: (r, F) => !!r && r === F.moodEnvy }, text: ["{rival} and me have been at it for years. Years! And {rival} gets the ribbon. Again."] }]);
  A('mood.jealous.admits', { gloomy: ["...Yes. I'm jealous. I'm always jealous of someone. Today it's {moodEnvy}."] });
  A('mood.jealous.grudge', { shy: ["*a small, guilty smile*"], gloomy: ["Hm. ...Almost funny."] });
  A('mood.jealous.think', { proud: ["I shall give it some thought. Some."] });
  A('mood.jealous.congrats', { gloomy: ["...All right. I'll go. It won't hurt more than it already does."], dreamy: ["I'll go and shake {moodEnvy}'s hand. And imagine it's mine next year."] });
  A('mood.jealous.bristle', { gloomy: ["Shake hands? And watch {moodEnvy} smile? No."] });
  A('mood.jealous.stung', { gloomy: ["Course. Laugh. Everyone else is."] });
  // --- No going round in circles ---------------------------------------------------------
  // A beat once visited isn't offered again in the same talk (nor a ladder that would land
  // on one); if that leaves a beat with nothing to say, a warm way out to the close appears.
  const tidy = (id, close, say) => {
    const th = THREADS[id];
    if (!th) return;
    const mark = (b) => '@' + b;
    const target = (g, T) => { if (typeof g.to === 'string') return g.to; if (!Array.isArray(g.to)) return null; const x = g.to.find((y) => typeof y === 'string' || needMet(y.need, T)); return typeof x === 'string' ? x : x && x.to; };
    for (const name in th.beats) {
      const b = th.beats[name], fx = b.fx || {}, run = fx.run;
      b.fx = { ...fx, run: (T, v) => { if (run) run(T, v); (T.flags || (T.flags = {}))[mark(name)] = true; } };
      if (!b.go) continue;
      const opts = b.go.slice();
      for (const g of opts) { const need = g.need || {}, when = need.when; g.need = { ...need, when: (F, T) => (!when || when(F, T)) && !(T.flags && T.flags[mark(target(g, T))]) }; }
      if (name !== close && th.beats[close]) b.go.push({ ap: 'warm', say, to: close, need: { when: (F, T) => !opts.some((g) => needMet(g.need, T)) } });
    }
  };
  lines('mood.homesick.w.close', [{ text: ['You\'ve a home here too, {name}, whenever you want it.', 'Come and find me when it aches. I\'ll listen.', 'Thistledown\'s glad of you. I hope you know it.'] }]);
  tidy('mood.homesick', 'done', 'mood.homesick.w.close');
  lines('mood.lonely.w.close', [{ text: ['I\'ll stop by again, {name}. That\'s a promise.', 'You\'re good company, you know. Don\'t let anyone tell you otherwise.', 'Come and find me, any day. I mean it.'] }]);
  tidy('mood.lonely', 'done', 'mood.lonely.w.close');
  lines('mood.shy.w.close', [{ text: ['It was good to meet you, {name}. Truly.', 'There. That wasn\'t so bad. Good day to you.', 'I\'ll say hello next time. You can just nod.'] }]);
  tidy('mood.shy', 'done', 'mood.shy.w.close');
  lines('mood.sulk.w.close', [{ text: ['I\'ll leave you be. Come and find me when it lifts.', 'It\'ll pass, {name}. They always do.', 'Go gently. Tomorrow\'s another day.'] }]);
  tidy('mood.sulk', 'done', 'mood.sulk.w.close');
  lines('mood.jealous.w.close', [{ text: ['Next year\'s yours, {name}. I can feel it in my hat.', 'You\'ve a knack {moodEnvy} hasn\'t. Remember that.', 'Let it go, {name}. It\'s lighter on the ground than in your pocket.'] }]);
  tidy('mood.jealous', 'done', 'mood.jealous.w.close');
});
