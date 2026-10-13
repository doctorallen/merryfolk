'use strict';
// ---------------------------------------------------------------------------
// Reading the mood, part four: the brighter moods and the everyday ones.
// Folk smitten (courting, sweet on someone in secret, or just wed), proud
// (a prize, a masterpiece, a crown of May, a thing built), merry (tipsy, or
// at a party, a feast or a holiday), bored, and busy at their work when the
// wizard stops them. The facts come from talk/moods.js.
// ---------------------------------------------------------------------------

talkPack('moods4', () => {
  const COND = { elder: { stage: 'elder' }, child: { stage: 'child' }, rift: { rift: true }, plain: { register: 'plain' }, fine: { register: 'fine' } };
  const L = (key, base, by, more) => lines(key, [{ text: base }].concat(Object.keys(by || {}).map((k) => ({ if: COND[k] || { temper: k }, text: by[k] })), more || []));
  const fresh = (F, id) => { const b = (Game.wizBond || {})[F.id]; return !(b && ((b.seen && b.seen[id] === Game.day) || (b.sore && b.sore[id] > Game.day))); };
  const daily = (F, n, p) => hash2(F.id * 17 + Game.day, n) < p;
  const ladder = (ap, cell) => { const sit = { aps: { [ap]: cell } }; const r = (T) => rungFor(sit, ap, T); return [{ to: cell.out[2], need: { when: (F, T) => r(T) >= 2 } }, { to: cell.out[1], need: { when: (F, T) => r(T) === 1 } }, cell.out[0]]; };
  const has = (x) => !!x;

  // --- Smitten ----------------------------------------------------------------------
  const Sm = (k, text, pri) => ({ if: { moodSmitHow: k }, pri: pri || 1, text });
  addSituation('smitten', {
    pri: 2.2, thread: 'mood.smitten', read: (F) => !!F.moodSmit && fresh(F, 'mood.smitten') && (F.moodSmitHow === 'wed' || daily(F, 15, 0.6)),
    aps: {
      jest: { base: 1, out: ['flustered', 'blush', 'gushes'] },
      ask: { base: 1, out: ['coy', 'gushes', 'confides'] },
      warm: { base: 1, out: ['coy', 'glows', 'gushes'] },
      listen: { base: 1, out: ['coy', 'dreamy', 'confides'] },
      share: { base: 0, out: ['ew', 'swap', 'tale'] },
      advise: { base: 0, out: ['huffy', 'nervous', 'flowers'], after: 'gushed' },
    },
  });
  const court = ladder('advise', { base: 0, after: 'gushed', out: ['huffy', 'nervous', 'flowers'] });
  const posy = (T) => { const o = personById(T.F.moodSmitId); return o ? { to: o, kind: 'flowers' } : null; };
  addThread({
    id: 'mood.smitten', situation: true, label: (F) => (F.moodSmitHow === 'wed' ? 'Just married' : F.moodSmit ? `Sweet on ${F.moodSmit}` : 'Sweet on someone'),
    beats: {
      flustered: { line: 'mood.smitten.flustered', go: [
        { ap: 'warm', say: 'It\'s written all over you, {name}. It suits you.', to: 'glows' },
        { ap: 'ask', say: 'So. {MoodSmit}?', to: 'coy' },
      ] },
      blush: { line: 'mood.smitten.blush', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'Go on. Tell me about {moodSmit}.', to: 'gushes' },
        { ap: 'ask', say: 'What do you like best about {moodSmitThem}?', to: 'best', need: { flag: 'gushed' } },
        { ap: 'advise', say: 'mood.smitten.w.court', to: court },
      ] },
      gushes: { line: 'mood.smitten.gushes', notice: 'mood.smitten.see', fx: { flag: 'gushed', fond: 0.02 }, go: [
        { ap: 'ask', say: 'What do you like best about {moodSmitThem}?', to: 'best' },
        { ap: 'advise', say: 'mood.smitten.w.court', to: court },
        { ap: 'jest', say: 'Steady. You\'ll float off.', to: 'blush' },
      ] },
      coy: { line: 'mood.smitten.coy', go: [
        { ap: 'jest', say: 'mood.smitten.w.jest', to: 'blush' },
        { ap: 'listen', say: '*You smile, and wait.*', label: 'Smile, and wait', to: 'dreamy' },
      ] },
      glows: { line: 'mood.smitten.glows', fx: { fond: 0.03, flag: 'gushed' }, go: [
        { ap: 'ask', say: 'What do you like best about {moodSmitThem}?', to: 'best' },
        { ap: 'advise', say: 'mood.smitten.w.court', to: court },
      ] },
      confides: { line: 'mood.smitten.confides', fx: { flag: 'gushed', confide: { k: 'mood.smitten', t: '{Name} is sweet on {moodSmit}', secret: true } }, go: [
        { ap: 'advise', say: 'mood.smitten.w.court', to: court },
        { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'safe' },
      ] },
      dreamy: { line: 'mood.smitten.dreamy', fx: { flag: 'gushed' }, go: [
        { ap: 'ask', say: 'What do you like best about {moodSmitThem}?', to: 'best' },
        { ap: 'jest', say: 'mood.smitten.w.jest', to: 'blush' },
      ] },
      huffy: { line: 'mood.smitten.huffy', fx: { respect: -0.02 }, go: [
        { ap: 'jest', say: 'Of course. You\'re doing splendidly on your own. Clearly.', to: 'blush' },
        { ap: 'warm', say: 'Quite right. I\'ll keep my nose out.', to: 'glows' },
      ] },
      nervous: { line: 'mood.smitten.nervous', go: [
        { ap: 'comfort', say: 'Nobody ever laughed at a posy, {name}. Not once in all my years.', to: 'flowers' },
        { ap: 'jest', say: 'If {moodSmitThey} laughs, I\'ll turn {moodSmitThem} into a frog. A handsome one.', to: 'blush' },
      ] },
      flowers: { line: 'mood.smitten.flowers', fx: { respect: 0.04, queue: 'whisper_visit', queueExtra: posy }, end: true },
      ew: { line: 'mood.smitten.ew', go: [
        { ap: 'ask', say: 'Never mind me. Tell me about {moodSmit}.', to: 'coy' },
        { ap: 'jest', say: 'mood.smitten.w.jest', to: 'blush' },
      ] },
      swap: { line: 'mood.smitten.swap', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'Now you. Tell me about {moodSmit}.', to: 'gushes' },
        { ap: 'jest', say: 'mood.smitten.w.jest', to: 'blush' },
      ] },
      tale: { line: 'mood.smitten.tale', fx: { trust: 0.04, joke: { k: 'mood.elf', t: 'The wizard was sweet on an elf once. She wrote to him for a hundred years.' } }, go: [
        { ap: 'ask', say: 'Now you. Tell me about {moodSmit}.', to: 'gushes' },
        { ap: 'warm', say: 'Hold on to it, {name}. It\'s the best thing going.', to: 'done' },
      ] },
      best: { line: 'mood.smitten.best', fx: { learn: ['sweetheart', '{Name} is sweet on {moodSmit}'] }, go: [
        { ap: 'warm', say: 'Then {moodSmitThey}\'s a lucky one.', to: 'done' },
        { ap: 'advise', say: 'mood.smitten.w.court', to: court },
      ] },
      safe: { line: 'mood.smitten.safe', fx: { trust: 0.05, promise: { k: 'mood.smitten', t: 'You promised to keep quiet about {moodSmit}', days: 20 } }, end: true },
      done: { line: 'mood.smitten.done', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('sit.smitten.jest', [{ text: ['You\'re humming, {name}. You never hum.', 'You\'ve a look about you. A soppy one.'] }, Sm('wed', ['Well! The newlywed! Have you come down off the ceiling yet?']), Sm('crush', ['You\'ve walked past the same door four times, {name}. I counted.'])]);
  lines('sit.smitten.ask', [{ text: ['And how\'s {moodSmit}?', 'You look like somebody with something on their mind. Or someone.'] }, Sm('wed', ['How\'s married life, then?'])]);
  lines('sit.smitten.warm', [{ text: ['You\'re looking very well, {name}. Glowing, almost.', 'Something\'s put the light in your face.'] }, Sm('wed', ['Congratulations, {name}. Truly. It was a lovely wedding.'])]);
  lines('sit.smitten.listen', [{ text: ['*You stand beside them and watch them not watch {moodSmit}\'s door.*', '*You wait, and let them be soppy in peace.*'] }]);
  lines('sit.smitten.share', [{ text: ['I was in love once, you know. A long time ago, in a wood.', 'Love\'s the oldest magic there is. Older than mine.'] }]);
  lines('sit.smitten.advise', [{ text: ['Take {moodSmit} some flowers, {name}. It never fails.', 'Don\'t wait too long, {name}. Summers are short.'] }, Sm('wed', ['Bring {moodSmit} breakfast in bed. Crumbs and all.'])]);
  L('mood.smitten.w.court', ['Take {moodSmitThem} some flowers. Today. Before you lose your nerve.', 'Ask {moodSmit} to walk out with you after supper. Just ask.'], {}, [Sm('wed', ['Pick {moodSmitThem} a posy, for no reason at all. Those are the best ones.'])]);
  L('mood.smitten.w.jest', ['You\'ve gone the colour of a radish.', 'Look at you. Pink as a ham.']);
  L('mood.smitten.see', ['Their eyes slide off to one particular round door, and back.', 'They\'re smiling at nothing, and don\'t know it.']);

  L('mood.smitten.flustered', ['I don\'t know what you mean! Humming? Me? I\'m not humming!', 'Soppy? I\'m NOT soppy. I\'m just... in a good mood. Generally.'], {
    proud: ['I have no idea to what you are referring.'], ornery: ['Mind your own business, you old busybody.'], shy: ['*goes scarlet from the neck up, and looks for a hole to climb into*'],
    witty: ['Me? Soppy? I\'ve never been soppy in my... oh, curse it.'], child: ['EWW. No. I\'m NOT.'],
  }, [Sm('crush', ['I was just passing! Four times. It\'s a busy door. I mean lane.'])]);
  L('mood.smitten.blush', ['*goes pink, and laughs, and goes pinker*', 'Oh, stop it. ...No, go on, it\'s quite nice.'], {
    cheerful: ['Ha! Is it that obvious? It\'s that obvious. Oh, well!'], shy: ['*hides behind both hands*'], ornery: ['Hmph. Radish yourself.'],
  });
  L('mood.smitten.gushes', ['Oh, {moodSmit}! Have you noticed how {moodSmitThey} laughs? With the whole face? And the hands?', '{MoodSmit} made me a cup of tea yesterday. Just made me one. Without asking. I\'ve thought of nothing else.'], {
    cheerful: ['{MoodSmit} is the most wonderful hobbit in the whole Shire and I\'ll fight anyone who says different!'], dreamy: ['When {moodSmit} walks into a room the light changes. It does. I\'ve watched it.'],
    proud: ['{MoodSmit} has excellent taste. {MoodSmitThey} chose me, after all.'], ornery: ['{MoodSmit} is the only one in this valley with a grain of sense. And lovely ears.'],
    witty: ['{MoodSmit} laughed at my joke. The bad one. The one nobody laughs at.'], shy: ['...{MoodSmit} said good morning to me. On purpose. Twice.'], elder: ['At my age! Who\'d have thought it. {MoodSmit} makes me feel forty.'],
  }, [Sm('wed', ['Married! Me! To {moodSmit}! I keep saying it. Married. It doesn\'t get old.', 'We\'ve the same cups now. Matching cups. I didn\'t know I wanted matching cups.'])]);
  L('mood.smitten.coy', ['{MoodSmit}? Oh, {moodSmit}\'s very nice. We\'re just friends. Very good friends.', 'Who? Oh. Fine, I suppose. Why do you ask? Who said anything?'], {
    proud: ['We are acquainted. Cordially.'], ornery: ['What about {moodSmitThem}?'], shy: ['...Fine. {MoodSmitThey}\'s fine. Why?'], child: ['Who? I don\'t know anyone called that.'],
  }, [Sm('wed', ['Married life? Oh, it\'s... *a great silly grin spreads* ...it\'s fine.'])]);
  L('mood.smitten.glows', ['...Does it show? It shows. Oh, I don\'t care if it shows.', '*beams so hard you can feel it*'], { shy: ['...Thank you. I didn\'t know anyone could tell.'], ornery: ['Hmph. Well. It\'s a good feeling, I\'ll grant.'] });
  L('mood.smitten.confides', ['...Can you keep a secret? It\'s {moodSmit}. It\'s been {moodSmit} since the spring fair.', '...Don\'t tell a soul. I think about {moodSmit} all day. All of it.'], {
    shy: ['...It\'s {moodSmit}. I\'ve never told anybody. I\'m telling you. Oh no.'], proud: ['In strictest confidence: I hold {moodSmit} in the highest regard. The highest.'],
  }, [Sm('crush', ['{MoodSmit} doesn\'t know. Nobody knows. I can\'t even say it to the hens.'])]);
  L('mood.smitten.dreamy', ['*gazes off down the lane at nothing, smiling*', '...Do you ever think about a whole life? The two cups. The two chairs. The arguing about the blanket.'], {
    dreamy: ['...I\'ve planned the garden. For both of us. There\'s a bench. For when we\'re old.'], cheerful: ['Oh, sorry, were you talking? I was thinking about {moodSmit}. I\'m always thinking about {moodSmit}.'],
  });
  L('mood.smitten.huffy', ['I don\'t need a wizard to do my courting, thank you.', 'I\'ll get round to it. In my own time.'], { proud: ['I have it all in hand.'], ornery: ['Courting advice. From you. What would you know?'] });
  L('mood.smitten.nervous', ['But what if {moodSmitThey} laughs? What if {moodSmitThey} says no? What if {moodSmitThey} says yes?', 'I\'d go all red. I\'d drop them. I\'d say something about turnips.'], {
    shy: ['...I couldn\'t. I couldn\'t. Could I?'], witty: ['I\'d make a joke. I always make a joke. It\'d be a bad one.'],
  });
  L('mood.smitten.flowers', ['...All right. Flowers. I\'ll pick the yellow ones. {MoodSmit} likes yellow. I think.', 'Right. Right! Now. Before I think about it. Where are the flowers?'], {
    shy: ['...I\'ll leave them on the step. And knock. And run.'], proud: ['A posy. Naturally. I was going to anyway.'], cheerful: ['Flowers! Yes! Armfuls! I\'ll empty the meadow!'],
  }, [Sm('wed', ['A posy for no reason. {MoodSmit} will pretend to tell me off. I can\'t wait.'])]);
  L('mood.smitten.ew', ['You? In love? Don\'t. I can\'t imagine it.', 'I don\'t want to hear about wizards being soppy.'], { child: ['EWWW.'], witty: ['A wizard in love. Did you write poems? Did they rhyme?'] });
  L('mood.smitten.swap', ['...Really? Who? Was it a wizard? Do wizards marry wizards?', 'In a wood? That\'s very romantic. Or very damp.'], { curious: ['What happened? Did it end well? Don\'t say. Do say.'] });
  L('mood.smitten.tale', ['An ELF? And she wrote to you? For a hundred years? ...Oh, that\'s the loveliest thing I ever heard.', '...So it lasts. If it\'s real, it lasts. Even for wizards.'], {
    dreamy: ['*a long sigh* A hundred years of letters. I\'ll write to {moodSmit}. Every day.'], ornery: ['Hmph. A hundred years. Show-off.'],
  });
  L('mood.smitten.best', ['The way {moodSmitThey} hums when {moodSmitThey} works. Off key. Every time.', 'That {moodSmitThey} listens. Properly. Like you do. Only prettier.'], {
    cheerful: ['Everything! But mostly the laugh. And the ears. And the laugh again.'], proud: ['{MoodSmit}\'s good sense. And {moodSmitTheir} fine profile.'], shy: ['...That {moodSmitThey} never makes me feel silly.'],
  });
  L('mood.smitten.safe', ['Thank you. Not a word. Not even a look.', 'I knew I could tell you. Wizards are good at secrets.'], { shy: ['...Thank you. Truly.'] });
  L('mood.smitten.done', ['Oh, look at me. Away with the fairies. Thank you, wizard.', 'I\'ll go and be soppy somewhere else. Good day!'], { ornery: ['Not a word to anyone. Not one.'], cheerful: ['What a lovely day it is! Isn\'t it? It is!'] });

  // --- Proud ------------------------------------------------------------------------
  const P = (k, text, pri) => ({ if: { moodProud: k }, pri: pri || 1, text });
  addSituation('proud', {
    pri: 2.5, thread: 'mood.proud', read: (F) => !!F.moodProud && fresh(F, 'mood.proud') && (['master', 'won', 'crowned'].includes(F.moodProud) || daily(F, 17, 0.6)),
    aps: {
      warm: { base: 1, out: ['modest', 'preens', 'glows'] },
      ask: { base: 1, out: ['short', 'how', 'secret'] },
      listen: { base: 1, out: ['modest', 'how', 'preens'] },
      jest: { base: 0, out: ['huff', 'grin', 'laughs'] },
      share: { base: 0, out: ['upstaged', 'swap', 'kindred'] },
      advise: { base: 0, out: ['bristle', 'nod', 'thanks'] },
    },
  });
  const humble = ladder('advise', { base: 0, after: 'told', out: ['bristle', 'nod', 'thanks'] });
  addThread({
    id: 'mood.proud', situation: true, label: (F) => ({ master: 'A masterpiece', won: 'A prize won', crowned: 'Crowned for May', built: 'Something built', graduated: 'An apprenticeship done' })[F.moodProud] || 'Pleased as punch',
    beats: {
      modest: { line: 'mood.proud.modest', go: [
        { ap: 'warm', say: 'Luck had nothing to do with it, {name}.', to: 'preens' },
        { ap: 'ask', say: 'Tell me how you did it.', to: 'how' },
      ] },
      preens: { line: 'mood.proud.preens', fx: { fond: 0.02 }, go: [
        { ap: 'jest', say: 'Careful. Your hat won\'t fit.', to: 'laughs' },
        { ap: 'ask', say: 'And who taught you?', to: 'teacher' },
      ] },
      glows: { line: 'mood.proud.glows', fx: { fond: 0.03, feel: 'cheered', feelX: 'the wizard' }, go: [
        { ap: 'ask', say: 'And what\'s next?', to: 'next' },
        { ap: 'ask', say: 'And who taught you?', to: 'teacher' },
      ] },
      short: { line: 'mood.proud.short', go: [
        { ap: 'warm', say: 'Hard work and a knack. You\'ve both.', to: 'preens' },
        { ap: 'jest', say: 'mood.proud.w.jest', to: 'grin' },
      ] },
      how: { line: 'mood.proud.how', fx: { flag: 'told', respect: 0.01 }, go: [
        { ap: 'ask', say: 'And who taught you?', to: 'teacher' },
        { ap: 'jest', say: 'mood.proud.w.jest', to: 'laughs' },
      ] },
      secret: { line: 'mood.proud.secret', fx: { flag: 'told', confide: { k: 'mood.proud', t: '{Name} told you the secret of {their} knack', secret: true } }, go: [
        { ap: 'warm', say: 'Safe with me. I can\'t cook anyway.', to: 'done' },
        { ap: 'ask', say: 'And what\'s next?', to: 'next' },
      ] },
      huff: { line: 'mood.proud.huff', fx: { fond: -0.03 }, go: [
        { ap: 'warm', say: 'Forgive me. It\'s splendid, and so are you.', to: 'preens' },
        { ap: 'ask', say: 'Tell me how you did it.', to: 'how' },
      ] },
      grin: { line: 'mood.proud.grin', go: [{ ap: 'ask', say: 'Go on, then. How did you do it?', to: 'how' }, { ap: 'warm', say: 'Well done, {name}. Truly.', to: 'glows' }] },
      laughs: { line: 'mood.proud.laughs', fx: { fond: 0.03 }, go: [
        { ap: 'ask', say: 'And what\'s next?', to: 'next' },
        { ap: 'advise', say: 'mood.proud.w.thank', to: humble },
      ] },
      bristle: { line: 'mood.proud.bristle', fx: { respect: -0.02 }, go: [{ ap: 'warm', say: 'You\'re right. Enjoy it. You\'ve earned it.', to: 'glows' }, { ap: 'jest', say: 'mood.proud.w.jest', to: 'grin' }] },
      nod: { line: 'mood.proud.nod', go: [{ ap: 'ask', say: 'And what\'s next?', to: 'next' }, { ap: 'warm', say: 'Well done, {name}.', to: 'done' }] },
      thanks: { line: 'mood.proud.thanks', fx: { respect: 0.05, queue: 'whisper_visit', queueExtra: (T) => { const o = personById(T.F.moodPalId); return o ? { to: o, kind: 'kin' } : null; } }, end: true },
      upstaged: { line: 'mood.proud.upstaged', fx: { fond: -0.02 }, go: [{ ap: 'warm', say: 'Quite right. Today\'s yours. Tell me.', to: 'preens' }, { ap: 'ask', say: 'Tell me how you did it.', to: 'how' }] },
      swap: { line: 'mood.proud.swap', go: [{ ap: 'ask', say: 'Now tell me yours, properly.', to: 'how' }, { ap: 'jest', say: 'mood.proud.w.jest', to: 'laughs' }] },
      kindred: { line: 'mood.proud.kindred', fx: { trust: 0.04 }, go: [{ ap: 'ask', say: 'And what\'s next?', to: 'next' }, { ap: 'warm', say: 'Enjoy it, {name}. It doesn\'t come every day.', to: 'done' }] },
      teacher: { line: 'mood.proud.teacher', fx: { flag: 'told' }, go: [
        { ap: 'advise', say: 'mood.proud.w.thank', to: humble },
        { ap: 'warm', say: 'They\'d be proud of you.', to: 'done' },
      ] },
      next: { line: 'mood.proud.next', fx: { learn: ['dream', '{dreamText}'] }, go: [{ ap: 'warm', say: 'I\'ve no doubt you will.', to: 'done' }, { ap: 'jest', say: 'And then the moon, I suppose.', to: 'done' }] },
      done: { line: 'mood.proud.done', fx: { remember: 'The wizard came to congratulate me. The wizard!', rv: 1 }, end: true },
    },
    end: { fond: 0.02, respect: 0.01 },
  });
  frags('mood.knack', ['a pinch of salt where nobody would think to put it', 'they sing to it while they work', 'they do the fiddly bit first, before breakfast', 'patience, and a borrowed tool they never gave back']);
  lines('sit.proud.warm', [{ text: ['Well done, {name}! The whole lane\'s talking.', 'I hear congratulations are in order!'] }, P('won', ['{MoodProudWhat}! Well done, {name}!']), P('master', ['I\'ve seen {moodProudWhat}, {name}. It took my breath away.']), P('crowned', ['Hail, {moodProudWhat} of the May!'])]);
  lines('sit.proud.ask', [{ text: ['How did you do it, {name}?', 'Go on, then. How?'] }, P('won', ['How did you win it?']), P('built', ['You built that {moodProudWhat}? How?'])]);
  lines('sit.proud.listen', [{ text: ['*You stand back, and let them tell it.*', '*You lean on your staff, ready for the whole story.*'] }]);
  lines('sit.proud.jest', [{ text: ['Careful, {name}. Your head\'s getting too big for your hat.', 'I suppose you\'ll want a statue now.'] }, P('crowned', ['Your Majesty. Shall I bow? My back says no.'])]);
  lines('sit.proud.share', [{ text: ['I won a prize once. For fireworks. They gave me a sash. I set fire to it.', 'I know that feeling. Mine was a dragon made of sparks.'] }]);
  lines('sit.proud.advise', [{ text: ['Don\'t let it go to your head, {name}.', 'Enjoy it. Then thank whoever helped you.'] }]);
  L('mood.proud.w.jest', ['I\'ll need to stand further back. Your glow\'s hurting my eyes.', 'Shall I carry your hat? Your head\'s too big for it now.']);
  L('mood.proud.w.thank', ['Who helped you get here? Go and tell them.', 'Nobody gets anywhere alone. Go and share it with someone.']);

  L('mood.proud.modest', ['Oh, it was nothing. Luck, mostly.', 'I don\'t know how it happened. It just came out right.'], {
    shy: ['...It wasn\'t that good. Was it? Folk keep saying.'], gloomy: ['It\'ll be someone else next year. It always is.'], cheerful: ['Oh, stop! ...No, keep going.'], child: ['I just DID it. It wasn\'t hard. It was a bit hard.'],
  });
  L('mood.proud.preens', ['Well. Yes. It was rather good, wasn\'t it?', 'Everyone\'s been round. Even the Steward. The Steward!'], {
    proud: ['I always knew I had it in me. Now everyone else knows.'], cheerful: ['I keep telling people! I\'ve told the hens! The hens are very impressed!'], ornery: ['About time somebody noticed.'],
    shy: ['...Folk keep stopping me in the lane. I don\'t know where to look.'], child: ['I\'m the BEST. Everyone says. Well, Mum says.'],
  }, [P('won', ['{MoodProudWhat}! Me! I\'ve put the ribbon where I can see it from bed.']), P('crowned', ['{MoodProudWhat} of the May! I\'ve had flowers in my hair all day. I\'m keeping them in.']), P('master', ['{MoodProudWhat}. Folk come from the far end of the valley to look at it. I stand nearby. Casually.'])]);
  L('mood.proud.glows', ['...Thank you. That means a lot, from you.', '*glows like a lamp*'], { shy: ['...Thank you. Nobody\'s said it quite like that.'], ornery: ['Hmph. Well. Thank you. Very kind.'], child: ['*bounces on their toes*'] });
  L('mood.proud.short', ['Hard work. That\'s all there is to it.', 'You just keep at it. That\'s the whole secret.'], { ornery: ['Work. Not that wizards would know.'], proud: ['Talent. And practice. Mostly talent.'] });
  L('mood.proud.how', ['Months of practice. And a lot of getting it wrong first.', 'I did it a hundred times badly so I could do it once well.'], {
    curious: ['Oh, I worked it out! You see, if you do it backwards, it comes out forwards!'], proud: ['Skill, wizard. Skill and an eye. Not everyone has the eye.'], child: ['I just tried and tried and then it WORKED.'],
  }, [P('won', ['Early starts. Talking to it every morning. Folk laugh. They\'re not laughing now.']), P('master', ['A fey mood took me. I shut the door and when I came out it was done. I hardly remember it.']), P('built', ['Measure twice, saw once. And swear a bit. That helps.']), P('crowned', ['I didn\'t DO anything! They just picked me! I nearly fell over.']), P('skill', ['It\'s like a door that was stuck. Then one day it just opens. {MoodProudWhat}, it was.'])]);
  L('mood.proud.secret', ['...Come closer. Don\'t tell. It\'s {frag:mood.knack}.', '...All right. Just you. The secret is {frag:mood.knack}.'], { shy: ['...Promise not to tell? It\'s {frag:mood.knack}.'], proud: ['A secret of the trade. I tell nobody but you: it\'s {frag:mood.knack}.'] });
  L('mood.proud.huff', ['Well! I didn\'t expect that from you.', 'Hmph. Some folk can\'t bear anyone else to do well.'], { proud: ['I am entitled to a little pride, I think.'], shy: ['*face falls*'], child: ['That\'s MEAN. I DID do well.'] });
  L('mood.proud.grin', ['Ha. A bit, maybe.', '*grins, unrepentant*'], { proud: ['A statue would be appropriate, yes.'] });
  L('mood.proud.laughs', ['Ha! Carry my hat! I might let you.', 'Ha! Yes, all right. I\'m insufferable. Just for today.'], { witty: ['Ha! A statue. A small one. By the well.'], child: ['AHAHA. My head\'s not THAT big!'] });
  L('mood.proud.bristle', ['Can\'t a hobbit enjoy a thing for five minutes?', 'I\'ll let it go to my head if I want. It\'s my head.'], { proud: ['I don\'t believe I asked.'], ornery: ['Oh, here we go. Wise words.'] });
  L('mood.proud.nod', ['Mm. Fair. I won\'t get above myself.', 'You\'re right. But I can be pleased, can\'t I?'], { proud: ['Wise. If unnecessary.'] });
  L('mood.proud.thanks', ['...You\'re right. I couldn\'t have done it without {moodPal}. I\'ll go and tell {moodPal} so.', 'I\'ll go and say thank you. Properly. Not just a nod.'], { proud: ['A gracious word would not go amiss. I shall give one.'], child: ['I\'ll tell Mum! It was Mum! Mostly me. But Mum!'] });
  L('mood.proud.upstaged', ['This is MY day, wizard.', 'Yes, well, nobody\'s asking about yours.'], { proud: ['How nice. Now, about mine.'], child: ['But it\'s MY turn.'] });
  L('mood.proud.swap', ['A sash! You set fire to a sash? Ha!', 'A dragon of sparks? That\'s showing off.'], { curious: ['How do you make a dragon out of sparks? Show me. Later.'] });
  L('mood.proud.kindred', ['...So you know. That feeling. Like you\'re a foot taller.', 'Ha! So wizards get it too. The glow.'], { shy: ['...I didn\'t know anyone else felt it like this.'] });
  L('mood.proud.teacher', ['Nobody. Well. Everybody, a bit. You learn from every hand you watch.', 'I watched. For years. Then one day I just did it.'], { proud: ['I am largely self-taught.'], child: ['Mum! And Gran! And a book!'] }, [{ if: { parent: has }, text: ['{Parent}, mostly. Patient as stone. I\'ve had to learn to be patient too.'] }, P('apprenticed', ['{MoodProudWhat}. Taking me on. Me! I mean to learn everything.'])]);
  L('mood.proud.next', ['Next? I hadn\'t thought. Something bigger. Something better.', 'Oh, I\'m only getting started.'], { dreamy: ['Something nobody\'s ever made before. I can almost see it.'], proud: ['Greater things, naturally.'] }, [{ if: { dreamText: has }, pri: 1, text: ['One day I\'d like to {dreamText}. This is a start.'] }]);
  L('mood.proud.done', ['Thank you, wizard. I\'ll remember you came.', 'I\'ll not forget you stopping to say so.'], { proud: ['I appreciate the visit.'], child: ['Bye! I\'m going to show everyone AGAIN!'] });

  // --- Merry: tipsy, or a party, feast or holiday ---------------------------------------
  const M = (k, text, pri) => ({ if: { moodMerry: k }, pri: pri || 1, text });
  addSituation('merry', {
    pri: 2.1, thread: 'mood.merry', read: (F) => !!F.moodMerry && fresh(F, 'mood.merry') && (F.moodMerry === 'tipsy' || daily(F, 19, 0.6)),
    aps: {
      jest: { base: 1, out: ['huh', 'roars', 'toast'] },
      warm: { base: 1, out: ['hug', 'hug', 'loveyou'] },
      ask: { base: 1, out: ['ramble', 'ramble', 'blurts'] },
      listen: { base: 1, out: ['ramble', 'song', 'song'] },
      advise: { base: 0, out: ['spoilsport', 'grumble', 'sense'] },
    },
  });
  const sober = ladder('advise', { base: 0, out: ['spoilsport', 'grumble', 'sense'] });
  const sobering = (T, v) => { if (v.chem) v.chem.ale = Math.max(0, (v.chem.ale || 0) - 0.15); const a = v.homeId >= 0 ? ACTIONS.eat_home : ACTIONS.eat_inn; if (a && T.F.moodMerry === 'tipsy') v.queue.push({ a }); };
  addThread({
    id: 'mood.merry', situation: true, label: (F) => (F.moodMerry === 'tipsy' ? 'Merrily tipsy' : F.moodMerry === 'birthday' ? 'A birthday' : 'In high spirits'),
    beats: {
      huh: { line: 'mood.merry.huh', go: [{ ap: 'jest', say: 'mood.merry.w.jest', to: 'roars' }, { ap: 'ask', say: 'Having a good time, then?', to: 'ramble' }] },
      roars: { line: 'mood.merry.roars', fx: { fond: 0.02 }, go: [
        { ap: 'jest', say: 'mood.merry.w.jest', to: 'toast' },
        { ap: 'advise', say: 'mood.merry.w.easy', to: sober },
      ] },
      toast: { line: 'mood.merry.toast', fx: { fond: 0.03, joke: { k: 'mood.toast', t: 'To the wizard\'s hat, and everything under it!' } }, go: [
        { ap: 'warm', say: 'And to you, {name}. Long may you laugh.', to: 'done' },
        { ap: 'jest', say: 'I\'ll drink to that. Water. Wizards can\'t hold their ale.', to: 'done' },
      ] },
      hug: { line: 'mood.merry.hug', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'And what are we celebrating?', to: 'ramble' },
        { ap: 'advise', say: 'mood.merry.w.easy', to: sober },
      ] },
      loveyou: { line: 'mood.merry.loveyou', fx: { fond: 0.04 }, go: [
        { ap: 'warm', say: 'And you\'re mine, {name}. Now sit down before you fall down.', to: 'done' },
        { ap: 'jest', say: 'mood.merry.w.jest', to: 'roars' },
      ] },
      ramble: { line: 'mood.merry.ramble', notice: 'mood.merry.see', go: [
        { ap: 'listen', say: '*You let them ramble. It\'s a good ramble.*', label: 'Let them ramble', to: 'song' },
        { ap: 'advise', say: 'mood.merry.w.easy', to: sober },
      ] },
      blurts: { line: 'mood.merry.blurts', fx: { confide: { k: 'mood.merry', t: '{Name} let a secret slip, in high spirits', secret: true } }, go: [
        { ap: 'jest', say: 'I\'ll forget you said that. I\'ve a terrible memory. For some things.', to: 'toast' },
        { ap: 'warm', say: 'Safe with me, {name}.', to: 'done' },
      ] },
      song: { line: 'mood.merry.song', go: [
        { ap: 'jest', say: '*You join in, in a deep and wobbly bass.*', label: 'Join in the chorus', to: 'dance' },
        { ap: 'warm', say: 'Lovely, {name}. Lovely.', to: 'done' },
      ] },
      dance: { line: 'mood.merry.dance', fx: { fond: 0.04, joke: { k: 'mood.dance', t: 'The wizard sang bass. Badly.' }, feel: 'cheered', feelX: 'the wizard' }, end: true },
      spoilsport: { line: 'mood.merry.spoilsport', go: [{ ap: 'jest', say: 'mood.merry.w.jest', to: 'roars' }, { ap: 'warm', say: 'All right, all right. Enjoy yourself.', to: 'hug' }] },
      grumble: { line: 'mood.merry.grumble', go: [{ ap: 'warm', say: 'That\'s the spirit. The sensible spirit.', to: 'done' }] },
      sense: { line: 'mood.merry.sense', fx: { respect: 0.03, run: sobering }, end: true },
      done: { line: 'mood.merry.done', end: true },
    },
    end: { fond: 0.02 },
  });
  frags('mood.slip', ['that they once ate a whole Yule pudding meant for six', 'who really broke the Steward\'s best chair', 'that they can\'t swim, and never could', 'that they still sleep with a knitted rabbit']);
  lines('sit.merry.jest', [{ text: ['Steady on, {name}. The lane\'s not moving. It only looks like it.', 'Is it a party, or have you just seen a very good cheese?'] }, M('tipsy', ['How many is that, {name}? And don\'t say "one".'])]);
  lines('sit.merry.warm', [{ text: ['It does me good to see you so happy, {name}.', 'Now there\'s a face I like to see.'] }, M('birthday', ['Many happy returns, {name}!'])]);
  lines('sit.merry.ask', [{ text: ['What\'s put you in such spirits, {name}?', 'Having a good day, {name}?'] }, M('tipsy', ['Been at the Badger, have we?'])]);
  lines('sit.merry.listen', [{ text: ['*You stand back and let them be merry at you.*', '*You lean on your staff and enjoy the show.*'] }]);
  lines('sit.merry.advise', [{ text: ['Pace yourself, {name}. The night\'s young and so are you. Relatively.'] }, M('tipsy', ['A glass of water and a crust, {name}. Trust me.'])]);
  L('mood.merry.w.jest', ['To the hens! Long may they lay!', 'Who\'s that handsome wizard? Oh, it\'s me.']);
  L('mood.merry.w.easy', ['Go easy, {name}. Have a bite to eat.', 'A glass of water between each one. Old wizard\'s rule.']);
  L('mood.merry.see', ['Their cheeks are pink as apples.', 'They sway, very slightly, like a tree in a breeze.'], {}, [M('tipsy', ['There\'s a fine froth of ale on their upper lip.'])]);

  L('mood.merry.huh', ['Eh? What\'s moving? Oh! Ha! I get it. No I don\'t.', 'Hm? Sorry, I was listening to the fiddle. Say it again?'], { ornery: ['Hmph. Funny. Have a drink.'] }, [M('tipsy', ['Wha\'? The lane\'s moving? Is it? Hold on to me.'])]);
  L('mood.merry.roars', ['HA! Oh, that\'s the funniest thing anyone\'s ever said! Say it again!', 'AHAHAHA! Stop! My sides!'], {
    witty: ['Ha! I\'ve a better one. No I don\'t. Ha!'], ornery: ['Ha! ...You know, you\'re not so bad, wizard.'], shy: ['*laughs, then claps a hand over their mouth, then laughs anyway*'],
  }, [M('tipsy', ['HAHAHA! Cheese! I LOVE cheese! Is there cheese?'])]);
  L('mood.merry.toast', ['A toast! To the wizard\'s hat, and everything under it!', '*raises a mug that turns out to be empty* To you! And to more of this!'], {
    child: ['*raises a cup of milk* To the wizard! And to staying up late!'], cheerful: ['To the wizard! To Thistledown! To everyone! Even the Steward!'], proud: ['A toast, to me. And you. Mostly me.'],
  }, [M('birthday', ['To me! Another year! And to cake, which is the point of birthdays!'])]);
  L('mood.merry.hug', ['*throws both arms round your middle, which is as high as they reach*', 'Come here, you great tall lovely thing!'], { shy: ['*gives you a very quick, very small hug, and goes pink*'], ornery: ['*a gruff pat on the arm, which is a hug, for them*'] });
  L('mood.merry.loveyou', ['You\'re my best friend. My BEST friend. Did you know that? You are.', 'I love you, wizard. I love everyone. But you especially.'], {
    ornery: ['You know what? I take back everything I said about you. Most of it.'], shy: ['...I\'m really glad you came to our village. Really.'],
  }, [M('tipsy', ['Have I told you you\'re my best friend? I have? Well, you ARE.'])]);
  L('mood.merry.ramble', ['So I said to the miller, I said, and he said, and THEN... where was I? It was funny. Trust me.', 'Did I tell you about the pig? There was a pig. At the... no, that was last year. Still.'], {
    curious: ['Do you know why ale\'s brown? I asked the brewer. He didn\'t know. Nobody knows!'], child: ['I\'ve had THREE cakes and I danced with a grown-up and I\'m not even TIRED. Not at all.'], dreamy: ['Look at the lanterns. Aren\'t they the loveliest lanterns? Lanterns are wonderful.'],
  }, [M('party', ['Isn\'t it a grand party? The fiddler\'s on fire tonight. Not really. I checked.']), M('feast', ['I\'ve had four puddings. FOUR. I\'m going to have a fifth. Don\'t stop me.']), M('holiday', ['No work today! None! I\'ve done nothing at all and it\'s been marvellous.'])]);
  L('mood.merry.blurts', ['Shall I tell you a secret? ...I know {frag:mood.slip}. Don\'t tell. Ha! I told you.', 'Between you and me... *loudly*... it was me. The thing. You know the thing.'], { shy: ['...I\'m not usually like this. ...I like you. There. Secret.'] });
  L('mood.merry.song', ['*sings, loud and slightly wrong* The road goes ever on and on...', '*bursts into a song about a cat who married a kettle*'], {
    shy: ['*hums, then sings, very softly, a song about the river*'], ornery: ['*a gruff old song about a farmer and a very bad pig*'], child: ['*sings a skipping song, very fast, and gets the words wrong on purpose*'],
  }, [M('birthday', ['*sings Happy Birthday to themself, with feeling*']), M('tipsy', ['*bursts into song* Ho! Ho! Ho! To the bottle I go, to heal my heart and drown my woe!'], 2)]);
  L('mood.merry.dance', ['HA! The wizard sings bass! Everybody! The WIZARD sings BASS!', '*seizes your hands and tries to dance you round in a circle. You go round. Slowly.*'], { shy: ['*laughs so hard they have to sit down*'] });
  L('mood.merry.spoilsport', ['Go easy? It\'s a PARTY!', 'Spoilsport! Wizards are spoilsports!'], { ornery: ['I\'ll go as I please, beanpole.'], child: ['But it\'s not even BEDTIME yet.'] }, [M('tipsy', ['Water? WATER? Who drinks water?'])]);
  L('mood.merry.grumble', ['Soon. One more dance. Then I\'ll sit.', 'Fine. A crust. But a big one.'], { child: ['One more go on the swing. Then I\'ll be sensible.'] }, [M('tipsy', ['One more. Then water. Then one more.'], 2)]);
  L('mood.merry.sense', ['...You\'re right. A crust. And some water. And a sit down.', 'All right. Bread first. You\'re a wise old thing.'], { child: ['...Okay. A sit down. Just a short one. I\'m not sleepy.'], ornery: ['Hmph. Fine. You\'re no fun. You\'re RIGHT, but no fun.'] }, [M('tipsy', ['...Oh. The lane IS moving. Water. Bread. Bed. In that order.'])]);
  L('mood.merry.done', ['What a day! What a day! Good night! Good morning! Whichever!', 'Bless you, wizard. Bless your hat. Bless everything.'], { shy: ['...That was fun. Thank you.'], child: ['Best day EVER! Bye, wizard!'] });

  // --- Bored ------------------------------------------------------------------------
  addSituation('bored', {
    pri: 1, thread: 'mood.bored', read: (F) => F.bored && !F.moodWork && fresh(F, 'mood.bored') && daily(F, 21, F.stage === 'child' ? 0.8 : 0.45),
    aps: {
      jest: { base: 1, out: ['flat', 'snicker', 'scheme'] },
      ask: { base: 1, out: ['sigh', 'moan', 'wish'] },
      tale: { base: 1, out: ['yawn', 'listens', 'rapt'] },
      share: { base: 0, out: ['meh', 'swap', 'idea'] },
      advise: { base: 0, out: ['donethat', 'maybe', 'takes'] },
    },
  });
  const tryIt = ladder('advise', { base: 0, after: 'moaned', out: ['donethat', 'maybe', 'takes'] });
  const kidGame = (side) => ladder('advise', { base: 1, out: ['donethat', 'maybe', side === 'hill' ? 'hillgame' : 'riftgame'] });
  const unbore = (n) => (T, v) => { v.drives.bored = Math.max(0, v.drives.bored - n); };
  const busyThem = (T, v) => { unbore(0.2)(T, v); const a = v.isChild() ? ACTIONS.play : (hobbiesOf(v)[0] && ACTIONS['hobby_' + hobbiesOf(v)[0]]) || ACTIONS.stroll; if (a) v.queue.push({ a }); };
  addThread({
    id: 'mood.bored', situation: true, label: 'Bored stiff',
    beats: {
      flat: { line: 'mood.bored.flat', go: [{ ap: 'ask', say: 'What would you rather be doing?', to: 'moan' }, { ap: 'tale', say: 'mood.bored.w.tale', to: 'listens' }] },
      snicker: { line: 'mood.bored.snicker', fx: { run: unbore(0.1) }, go: [
        { ap: 'advise', say: 'mood.bored.w.try', to: tryIt },
        { ap: 'ask', say: 'What would you rather be doing?', to: 'wish' },
      ] },
      scheme: { line: 'mood.bored.scheme', fx: { run: unbore(0.2), joke: { k: 'mood.scheme', t: 'The plan with the Steward\'s hat and the weathervane.' } }, go: [
        { ap: 'advise', say: 'Not the Steward\'s hat. Anything but the hat.', to: 'takes' },
        { ap: 'jest', say: 'I didn\'t hear any of that. I\'m very deaf. Suddenly.', to: 'done' },
      ] },
      sigh: { line: 'mood.bored.sigh', fx: { flag: 'moaned' }, go: [
        { ap: 'advise', say: 'mood.bored.w.try', to: tryIt },
        { ap: 'tale', say: 'mood.bored.w.tale', to: 'listens' },
      ] },
      moan: { line: 'mood.bored.moan', fx: { flag: 'moaned' }, go: [
        { ap: 'jest', say: 'mood.bored.w.jest', to: 'snicker' },
        { ap: 'advise', say: 'mood.bored.w.try', to: tryIt },
        { ap: 'advise', say: 'mood.bored.w.hill', to: kidGame('hill'), need: { if: { stage: 'child' } } },
      ] },
      wish: { line: 'mood.bored.wish', fx: { flag: 'moaned', learn: ['wish', '{wishText}'] }, go: [
        { ap: 'advise', say: 'mood.bored.w.try', to: tryIt },
        { ap: 'advise', say: 'mood.bored.w.rift', to: kidGame('rift'), need: { if: { stage: 'child' } } },
        { ap: 'warm', say: 'Then I hope it comes along soon.', to: 'done' },
      ] },
      donethat: { line: 'mood.bored.donethat', go: [{ ap: 'tale', say: 'mood.bored.w.tale', to: 'listens' }, { ap: 'jest', say: 'mood.bored.w.jest', to: 'snicker' }] },
      maybe: { line: 'mood.bored.maybe', go: [{ ap: 'warm', say: 'Go on. Before the day\'s gone.', to: 'done' }] },
      takes: { line: 'mood.bored.takes', fx: { run: busyThem, respect: 0.02 }, end: true },
      hillgame: { line: 'mood.bored.hillgame', fx: { run: busyThem, lean: 'hill' }, end: true },
      riftgame: { line: 'mood.bored.riftgame', fx: { run: busyThem, lean: 'rift' }, end: true },
      yawn: { line: 'mood.bored.yawn', go: [{ ap: 'jest', say: 'mood.bored.w.jest', to: 'snicker' }, { ap: 'advise', say: 'mood.bored.w.try', to: tryIt }] },
      listens: { line: 'mood.bored.listens', fx: { run: unbore(0.15) }, go: [{ ap: 'tale', say: 'And THEN the troll sat down on the cart.', to: 'rapt' }, { ap: 'advise', say: 'mood.bored.w.try', to: tryIt }] },
      rapt: { line: 'mood.bored.rapt', fx: { run: unbore(0.4), fond: 0.04, feel: 'wizard_tale', feelX: 'of the troll and the cart' }, go: [
        { ap: 'advise', say: 'mood.bored.w.try', to: tryIt },
        { ap: 'warm', say: 'There. Not bored now, are you?', to: 'done' },
      ] },
      meh: { line: 'mood.bored.meh', go: [{ ap: 'ask', say: 'What would you rather be doing?', to: 'wish' }, { ap: 'tale', say: 'mood.bored.w.tale', to: 'listens' }] },
      swap: { line: 'mood.bored.swap', go: [{ ap: 'advise', say: 'mood.bored.w.try', to: tryIt }, { ap: 'jest', say: 'mood.bored.w.jest', to: 'snicker' }] },
      idea: { line: 'mood.bored.idea', fx: { run: unbore(0.2), fond: 0.02 }, go: [{ ap: 'advise', say: 'Go on, then. Off you go.', to: 'takes' }, { ap: 'warm', say: 'I\'d like to see how it turns out.', to: 'done' }] },
      done: { line: 'mood.bored.done', end: true },
    },
    end: { fond: 0.01 },
  });
  lines('sit.bored.jest', [{ text: ['You look as bored as a hen in a hatbox, {name}.', 'Shall I set something on fire? Just a small thing?'] }, { if: { stage: 'child' }, text: ['Have you counted all the clouds yet? I make it forty-one.'] }]);
  lines('sit.bored.ask', [{ text: ['Nothing to do, {name}?', 'What would you be doing, if you could do anything?'] }]);
  lines('sit.bored.tale', [{ text: ['Did I ever tell you about the three trolls and the mutton?', 'Shall I tell you a story? A true one. Mostly true.'] }, { if: { stage: 'child' }, text: ['Do you want to hear about the time a dragon sneezed on me?'] }]);
  lines('sit.bored.share', [{ text: ['When I\'m bored, I make smoke rings into ships and sail them.', 'I get bored too, you know. Hundreds of years of it. You learn tricks.'] }]);
  lines('sit.bored.advise', [{ text: ['Go and do something you\'ve never done, {name}.', 'A walk to the end of the valley and back. You\'ll come home a new hobbit.'] }, { if: { stage: 'child' }, text: ['Go and find the biggest puddle in the village. Report back.'] }]);
  L('mood.bored.w.try', ['Go and do something with your hands. Anything. Make a thing.', 'Walk somewhere you\'ve never walked. There\'s a stile up the valley nobody uses.'], {}, [{ if: { pastimeWord: has, stage: ['grown', 'elder'] }, text: ['When did you last do any {pastimeWord}? Go on. An hour.'] }, { if: { stage: 'child' }, text: ['Go and build a den. A proper one. With a door.'] }]);
  L('mood.bored.w.hill', ['Go and roll down the big hill. Then climb up and do it again. That\'s what hills are for.']);
  L('mood.bored.w.rift', ['Ask one of the rift-folk to teach you a game from the city. They\'ve odd ones.']);
  L('mood.bored.w.tale', ['Shall I tell you a story while you\'re bored?', 'Let me tell you about the dullest week of my life. It ended with a dragon.']);
  L('mood.bored.w.jest', ['Shall I turn you into something more interesting? A teapot?', 'I could make your eyebrows dance. I\'ve done it before. Nobody was pleased.']);

  L('mood.bored.flat', ['Ha. Ha.', 'Mm. Funny.'], { ornery: ['Don\'t try to cheer me up. I like being bored. It\'s restful.'], child: ['That\'s not funny. NOTHING is funny today.'] });
  L('mood.bored.snicker', ['*snorts* ...A teapot. With your hat on it.', 'Ha. That\'s quite good, actually.'], { child: ['Hee! Do the eyebrows! Do mine!'] });
  L('mood.bored.scheme', ['...Ooh. Ooh, I\'ve had an idea. It involves the Steward\'s hat and the weathervane.', '...What if we put all the hens in the inn? Just to see.'], { child: ['I\'ve got a PLAN. It\'s secret. It\'s got frogs in it.'], witty: ['If I tied a bell to every cat in the village, how long before anyone noticed?'] });
  L('mood.bored.sigh', ['Nothing. There\'s nothing to do. There\'s never anything to do.', '*a sigh that goes on for most of a minute*'], {
    child: ['There\'s NOTHING to DO. I\'ve done EVERYTHING.'], ornery: ['Same lane. Same faces. Same everything.'], dreamy: ['...I keep waiting for something to happen. It never does.'], elder: ['When you\'re my age, the days get long. Lovely, but long.'],
  });
  L('mood.bored.moan', ['I\'ve swept, I\'ve dusted, I\'ve counted the spoons. Twice. There are forty.', 'Same as yesterday. And the day before. And next week, probably.'], {
    child: ['I\'ve played with the cat and the cat left. Even the CAT is bored of me.'], curious: ['I\'ve read every book in the house. Twice. One of them three times. It was a cookbook.'], proud: ['I have mastered everything there is to do here. It\'s a curse.'],
  }, [{ if: { season: 'winter' }, text: ['Winter. Snow. Indoors. Snow. Indoors again. I\'ll go mad.'] }, { if: { weather: 'rain' }, text: ['It\'s raining. It\'s been raining since the beginning of time.'] }]);
  L('mood.bored.wish', ['If I could do anything? Something new. Something I\'ve never done.', 'Go somewhere. Anywhere. Over the hill, even. Just to see.'], { child: ['I want to go on an ADVENTURE. Like you.'] }, [{ if: { wishText: has }, pri: 1, text: ['Honestly? {WishText}. That would do it.'] }, { if: { dreamText: has, stage: ['grown', 'elder'] }, text: ['One day I\'d like to {dreamText}. Today I\'d settle for anything.'] }]);
  L('mood.bored.donethat', ['Done that. Done that too. Done that twice.', 'I\'ve tried. It\'s boring as well.'], { child: ['I did that YESTERDAY.'], ornery: ['Don\'t organise me.'] });
  L('mood.bored.maybe', ['Hm. Maybe. If nothing better turns up.', 'Could do. Could do.'], { child: ['...Maybe. Is it fun?'] });
  L('mood.bored.takes', ['...Do you know, I will. Better than counting spoons.', 'Right! Off I go. Something new!'], { child: ['OKAY! I\'m going! Bye!'], ornery: ['Fine. But if it\'s dull, I\'m coming back to tell you.'] }, [{ if: { pastimeWord: has, stage: ['grown', 'elder'] }, text: ['{PastimeWord}. Yes. I\'d forgotten I liked it.'] }]);
  L('mood.bored.hillgame', ['The big hill! Rolling! I\'m going RIGHT NOW!', 'Down the hill and up the hill! Race you! ...You\'re too slow. Bye!']);
  L('mood.bored.riftgame', ['A city game! Kira knows one with lights! I\'m going to ask!', 'Rift games! They\'ve got one with pretend signals and you have to FIND them!']);
  L('mood.bored.yawn', ['*yawns, hugely* ...Sorry. Go on.', 'Is this the one with the trolls? I\'ve heard the one with the trolls.'], { child: ['Is it a long one? I don\'t like long ones.'] });
  L('mood.bored.listens', ['Mutton? Trolls eat mutton? ...Go on.', '*sits up, despite themselves*'], { child: ['A DRAGON? What colour was it? Was it big?'], curious: ['Wait. How did you know they were trolls? Go on.'] });
  L('mood.bored.rapt', ['And then what? What happened to the cart?', '...I forgot I was bored. All the way through.'], { child: ['AGAIN! Tell it AGAIN!'], ornery: ['Hmph. Not bad. Not bad at all.'] });
  L('mood.bored.meh', ['That\'s nice for you.', 'Smoke rings. Right.'], { child: ['I can\'t do smoke rings. I\'m not ALLOWED.'] });
  L('mood.bored.swap', ['Hundreds of years? Of being bored? ...How do you stand it?', 'Ships out of smoke. Huh. I could try that.'], { curious: ['What tricks? Teach me one.'] });
  L('mood.bored.idea', ['...Ooh. That\'s given me an idea. A proper one.', 'Ships! I\'ll make ships! Out of... something. I\'ll find something.'], { child: ['I\'m going to make a smoke-ring ship out of SOAP BUBBLES.'] });
  L('mood.bored.done', ['Thanks, wizard. You\'re never boring, I\'ll say that.', 'Well! That\'s the most interesting thing that\'s happened all week.'], { child: ['Bye! Come back and be interesting again!'] });

  // --- Busy at their work ------------------------------------------------------------
  const J = (k, text, pri) => ({ if: { moodWork: k }, pri: pri || 1, text });
  addSituation('busy', {
    pri: 1.4, thread: 'mood.busy', read: (F) => !!F.moodWork && F.stage !== 'child' && fresh(F, 'mood.busy') && daily(F, 23, 0.6),
    aps: {
      warm: { base: 1, out: ['shoo', 'nod', 'smile'] },
      ask: { base: 1, out: ['shoo', 'explains', 'proudly'] },
      listen: { base: 1, out: ['ignore', 'mutters', 'explains'] },
      share: { base: 1, out: ['inway', 'helps', 'helps'] },
      jest: { base: 0, out: ['shoo', 'grin', 'laughs'] },
      advise: { base: 0, out: ['bristle', 'tip', 'break'] },
    },
  });
  const rest = ladder('advise', { base: 0, after: 'helped', out: ['bristle', 'tip', 'break'] });
  const breather = (T, v) => { const a = v.homeId >= 0 ? ACTIONS.tea : ACTIONS.eat_inn; if (a) v.queue.push({ a }); v.drives.tired = Math.max(0, v.drives.tired - 0.05); };
  addThread({
    id: 'mood.busy', situation: true, label: (F) => (F.moodWorkDoing ? `${F.moodWorkDoing.charAt(0).toUpperCase()}${F.moodWorkDoing.slice(1)}` : 'Hard at work'),
    beats: {
      shoo: { line: 'mood.busy.shoo', go: [
        { ap: 'warm', say: 'I\'ll leave you to it.', to: 'later' },
        { ap: 'share', say: 'mood.busy.w.help', to: 'helps' },
      ] },
      nod: { line: 'mood.busy.nod', go: [{ ap: 'ask', say: 'How\'s it going today?', to: 'explains' }, { ap: 'warm', say: 'I\'ll not keep you.', to: 'later' }] },
      smile: { line: 'mood.busy.smile', fx: { fond: 0.02 }, go: [{ ap: 'ask', say: 'How\'s it going today?', to: 'explains' }, { ap: 'share', say: 'mood.busy.w.help', to: 'helps' }] },
      explains: { line: 'mood.busy.explains', notice: 'mood.busy.see', go: [
        { ap: 'ask', say: 'And the hardest part?', to: 'hardest' },
        { ap: 'share', say: 'mood.busy.w.help', to: 'helps' },
        { ap: 'advise', say: 'mood.busy.w.rest', to: rest },
      ] },
      proudly: { line: 'mood.busy.proudly', fx: { respect: 0.02, fond: 0.02 }, go: [
        { ap: 'warm', say: 'You\'ve a gift for it, {name}.', to: 'later' },
        { ap: 'ask', say: 'And the hardest part?', to: 'hardest' },
      ] },
      grin: { line: 'mood.busy.grin', go: [{ ap: 'ask', say: 'How\'s it going today?', to: 'explains' }, { ap: 'share', say: 'mood.busy.w.help', to: 'helps' }] },
      laughs: { line: 'mood.busy.laughs', fx: { fond: 0.03 }, go: [{ ap: 'ask', say: 'How\'s it going today?', to: 'explains' }, { ap: 'advise', say: 'mood.busy.w.rest', to: rest }] },
      inway: { line: 'mood.busy.inway', go: [
        { ap: 'jest', say: 'I\'ll stand very still. Like a hatstand.', to: 'laughs' },
        { ap: 'warm', say: 'Sorry. I\'ll get out from under your feet.', to: 'later' },
      ] },
      helps: { line: 'mood.busy.helps', fx: { flag: 'helped', fond: 0.04, run: (T, v) => { v.drives.industry = Math.max(0, v.drives.industry - 0.15); v.drives.bored = Math.max(0, v.drives.bored - 0.1); } }, go: [
        { ap: 'ask', say: 'And the hardest part?', to: 'hardest' },
        { ap: 'advise', say: 'mood.busy.w.rest', to: rest },
      ] },
      bristle: { line: 'mood.busy.bristle', fx: { respect: -0.02 }, go: [{ ap: 'ask', say: 'Then show me how it\'s done.', to: 'explains' }, { ap: 'warm', say: 'Fair. I\'ll leave it to the expert.', to: 'later' }] },
      tip: { line: 'mood.busy.tip', go: [{ ap: 'warm', say: 'Only a thought.', to: 'later' }] },
      break: { line: 'mood.busy.break', fx: { respect: 0.03, run: breather }, end: true },
      ignore: { line: 'mood.busy.ignore', go: [{ ap: 'jest', say: 'mood.busy.w.jest', to: 'grin' }, { ap: 'warm', say: 'I\'ll come back when you\'re less busy.', to: 'later' }] },
      mutters: { line: 'mood.busy.mutters', go: [{ ap: 'ask', say: 'What\'s that you\'re saying?', to: 'explains' }, { ap: 'share', say: 'mood.busy.w.help', to: 'helps' }] },
      hardest: { line: 'mood.busy.hardest', fx: { trust: 0.02 }, go: [{ ap: 'warm', say: 'Well, you make it look easy.', to: 'later' }, { ap: 'advise', say: 'mood.busy.w.rest', to: rest }] },
      later: { line: 'mood.busy.later', end: true },
    },
    end: { fond: 0.01, respect: 0.01 },
  });
  lines('sit.busy.warm', [{ text: ['Don\'t let me stop you, {name}. I\'m only passing.', 'Hard at it, I see.'] }]);
  lines('sit.busy.ask', [{ text: ['How\'s the work today, {name}?', 'How\'s it coming along?'] }, J('baker', ['What\'s in the oven today?']), J('farmer', ['How\'s the barley looking?']), J('brewer', ['How\'s the brew?'])]);
  lines('sit.busy.listen', [{ text: ['*You stand back and watch them work.*', '*You lean on a post, and admire the work.*'] }]);
  lines('sit.busy.share', [{ text: ['Here, let me lend a hand.', 'Pass me something. I\'m good at holding things.'] }]);
  lines('sit.busy.jest', [{ text: ['Working? On a day like this? Scandalous.', 'Is this what they call work? It looks like hard work.'] }]);
  lines('sit.busy.advise', [{ text: ['You should stop for a cup of tea, {name}.', 'You\'ve done enough for one morning. Take a breather.'] }]);
  L('mood.busy.w.help', ['Here. Let me lend a hand.', 'Give me the easy end of it. I\'m old.']);
  L('mood.busy.w.rest', ['Take a breather, {name}. The work will still be here.', 'Five minutes and a cup of tea. Doctor\'s orders. Wizard\'s orders.']);
  L('mood.busy.w.jest', ['I\'ll just stand here and look decorative, then.', 'Is it all right if I watch? I promise not to help.']);
  L('mood.busy.see', ['There\'s a smear of something on their forehead, where they wiped it with a working hand.', 'Their sleeves are rolled to the elbow.'], {}, [J('baker', ['They\'re floured to the elbows.']), J('farmer', ['There\'s mud to the knee, and straw in their hair.']), J('woodwright', ['Shavings curl in their hair like a second fringe.'])]);

  L('mood.busy.shoo', ['Not now, wizard! I\'m right in the middle of it!', 'Can it wait? Only my hands are full and my head\'s fuller.'], {
    ornery: ['Some of us have work to do.', 'If you\'re going to stand there, stand there quietly.'], proud: ['I am rather occupied, as you can see.'], shy: ['...Sorry, I can\'t stop. I\'m sorry.'],
  }, [J('baker', ['Not now! The bread\'ll catch!', 'If I stop now the loaves go flat. FLAT, wizard.']), J('farmer', ['Rain\'s coming. I\'ve a field to finish. Talk to me after.']), J('innkeeper', ['Three tables want ale and one wants it NOW. Later, wizard.']), J('postie', ['I\'ve a sack full of letters and every one of them\'s late. Walk with me or don\'t.'])]);
  L('mood.busy.nod', ['*nods, and goes on working*', 'Mm. Morning. *doesn\'t look up*'], { cheerful: ['Morning! Can\'t stop! Lovely to see you! Can\'t stop!'] });
  L('mood.busy.smile', ['*looks up and smiles* Thanks, wizard. It\'s good to be noticed.', 'Ha! Passing, he says. You\'re always passing.'], { shy: ['*a small smile, and a nod*'] });
  L('mood.busy.explains', ['Busy. Always busy. But it\'s good busy, the kind that sends you to bed tired and pleased.', 'Not bad. Not bad at all. It\'s going the way it should.'], {
    proud: ['Exceptionally well, as usual.'], gloomy: ['Same as ever. Too much of it, and not enough thanks.'], curious: ['I\'m trying a new way of doing it. Don\'t tell anyone till I know if it works.'],
  }, [
    J('baker', ['Seed-cake in the far oven, bread in the near. The trick\'s keeping both in your head.', 'Forty loaves since dawn. And they\'ll be gone by supper. That\'s baking.']),
    J('farmer', ['Barley\'s coming on. If the weather holds, we\'ll have a good one.', 'It\'s all weather, farming. The rest is just waiting.']),
    J('miller', ['The wheel\'s singing today. When it sings, the flour\'s fine.']), J('brewer', ['It\'s working nicely. Smell that? That\'s next month\'s good mood.']),
    J('innkeeper', ['Full house last night. Half of them still owe me. Same half as always.']), J('fisher', ['They\'re biting today. Not at me. At the hooks. Mostly.']),
    J('woodwright', ['A new door for the Bracegirdles. Oak. It\'ll outlast the lot of us.']), J('herbalist', ['Half the lane\'s coughing. I\'ve boiled enough sage to choke a horse.']),
    J('postie', ['Twelve letters, two parcels and a cake for old Mother Brockhouse. I\'m not to look at the cake.']), J('tinker', ['This thing\'s from the other side of the sky. I\'ve no idea what it does. That\'s the fun.']),
    J('herder', ['The sheep have decided they don\'t like the north field. Sheep decide things.']), J('orchardist', ['The trees want talking to. I talk to them. Don\'t laugh.']),
  ]);
  L('mood.busy.proudly', ['Here. Look at this. I did that this morning. Not bad, eh?', 'Watch. See how it goes? Twenty years, that took me to learn.'], {
    shy: ['...Would you like to see? It\'s not much. It\'s quite good, actually.'], proud: ['Observe. This is how it is properly done.'],
  }, [J('baker', ['Look at the crust on that. Listen to it. *taps it* Hollow. Perfect.']), J('woodwright', ['Feel that joint. Not a nail in it.']), J('farmer', ['Straightest furrows in the Shire, these. Measure them if you like.'])]);
  L('mood.busy.grin', ['Ha. Scandalous. That\'s me.', '*grins without stopping*'], { ornery: ['Hmph. Come back when you\'ve done a day\'s work.'] });
  L('mood.busy.laughs', ['Ha! Hard work, he says. You should try it!', 'Ha! Decorative. You\'re the size of a maypole. Very decorative.'], { witty: ['Ha! A wizard with nothing to do. There\'s a sight.'] });
  L('mood.busy.inway', ['Mind the... oh. Well. That was full.', 'No, not that end! The OTHER end! ...Never mind.'], {
    ornery: ['Give it here. You\'re worse than useless. You\'re helpful.'], cheerful: ['Ha! You\'re hopeless! Lovely, but hopeless.'],
  }, [J('baker', ['You\'ve floured your beard. And the cat.']), J('farmer', ['That\'s the seed bag. The SEED bag. Never mind. The birds will be pleased.'])]);
  L('mood.busy.helps', ['Oh! Well, thank you. Hold that there. Just there. Perfect.', 'You\'re not bad at this. For a wizard.'], {
    ornery: ['Hmph. You\'re quite useful. I\'m surprised.'], cheerful: ['Many hands! Even old ones! Thank you!'], shy: ['...Thank you. Nobody ever helps.'],
  }, [J('baker', ['Knead. No, knead. Like you mean it. There! You\'re a natural.']), J('farmer', ['Lift with your knees, not your hat. There. Done twice as quick.']), J('innkeeper', ['Carry those to table four. Don\'t drink any. Good wizard.'])]);
  L('mood.busy.bristle', ['I\'ve done this twenty years. I think I know when to stop.', 'Tea? With all this to do?'], { proud: ['I set my own hours, thank you.'], ornery: ['Rest is for wizards.'] });
  L('mood.busy.tip', ['Hm. Might try that. Might.', 'That\'s an idea. Not a good one, but an idea.'], { curious: ['Oh! I\'ve never thought of it like that. Hm.'] });
  L('mood.busy.break', ['...You\'re right. Five minutes. A cup of tea. Then back to it.', 'Oh, go on. Just a short one. My back says thank you.'], { ornery: ['Fine. Five minutes. You\'re timing it.'], cheerful: ['Tea! Yes! You\'re the best kind of interruption.'] });
  L('mood.busy.ignore', ['*doesn\'t seem to notice you at all*', '*works on, lips moving as they count*'], { shy: ['*glances up, startles, and goes back to work faster*'] });
  L('mood.busy.mutters', ['...forty-one, forty-two... sorry? Forty-three...', '...if that goes there, then this goes... sorry, wizard. Thinking.'], {}, [J('baker', ['...two of flour, one of... where did I put the salt? Sorry. Salt.'])]);
  L('mood.busy.hardest', ['Getting up for it, in the dark, in the winter. The work\'s easy. The getting up isn\'t.', 'The bits nobody sees. Nobody thanks you for the bits nobody sees.'], {
    gloomy: ['Doing it the same every day, for ever. That\'s the hard part.'], proud: ['Nothing about it is hard for me. The hard part is everyone else.'],
  }, [J('baker', ['Getting up at four. Every day. The bread doesn\'t know it\'s a holiday.']), J('farmer', ['The weather. You can do everything right and the sky does what it likes.']), J('innkeeper', ['Last orders. Folk take it personally.'])]);
  L('mood.busy.later', ['Come back at supper and I\'ll talk your ear off.', 'Thanks, wizard. I\'ll stop properly later.'], { ornery: ['Good. Off you go.'], cheerful: ['Bye! Come back! Bring a cake! Or eat one, I don\'t mind!'] });

  // --- More ways of saying it (additive rules, the fallbacks are above) ----------------
  const A = (key, by, more) => lines(key, Object.keys(by || {}).map((k) => ({ if: COND[k] || { temper: k }, text: by[k] })).concat(more || []));

  // smitten
  A('mood.smitten.w.court', { elder: ["Don't leave it till you're my age, {name}. Go and knock on {moodSmit}'s door."] }, [
    Sm('crush', ["Tell {moodSmit}. Just tell {moodSmitThem}. Secrets go stale if you keep them too long.", "Sit by {moodSmitThem} at the next party. That's all. Just sit."]),
    Sm('sweet', ["Walk {moodSmitThem} home after the Badger tonight. The long way round."]),
  ]);
  A('mood.smitten.w.jest', { elder: ['At your age! Your ears have gone pink. Both of them.'] }, [Sm('wed', ["You've been grinning since the wedding. Does your face not ache?"]), Sm('crush', ["You've sighed four times since I got here. I'm keeping count."])]);
  A('mood.smitten.see', { child: ['They keep peeping round the hedge, and ducking back.'] }, [Sm('wed', ['A new ring catches the light, and they keep turning it.']), Sm('crush', ['A small posy is half hidden behind their back, wilting a little.'])]);
  A('mood.smitten.flustered', { cheerful: ['Ha! Humming? Was I? Oh no. Was it the soppy song?'], curious: ['How can you tell? Is it a wizard thing? What gives me away?'], dreamy: ['Was I humming? I didn\'t notice. I don\'t notice much, lately.'], gloomy: ["It's not soppy. It's hopeless. That's different."], elder: ['At my age? Don\'t be daft. ...Is it that obvious?'] }, [Sm('wed', ["I'm not soppy, I'm married. It's a very dignified state. Stop grinning."])]);
  A('mood.smitten.blush', { proud: ['Pink? I am not pink. I am... flushed with good health.'], curious: ['Am I that colour? How interesting. How awful.'], dreamy: ['*goes pink, and looks off down the lane, smiling*'], witty: ['A radish! A ham! Do go on, I\'m collecting them.'], gloomy: ["Oh, don't. ...It is nice, though. Being teased about it."], elder: ['Ha! I\'ve not blushed since the old Steward\'s day.'], child: ['I\'m NOT pink! ...Am I pink?'] });
  A('mood.smitten.gushes', { curious: ['Did you know {moodSmit} can name every star over the party field? I asked about all of them. Twice.'], gloomy: ['{MoodSmit} is far too good for me. I know it. I just can\'t stop thinking about {moodSmitThem}.'], rift: ['{MoodSmit} makes my whole chest go full signal. Every time. No lag at all.'] }, [
    Sm('crush', ['{MoodSmit} borrowed my pencil once. I haven\'t sharpened it since.', '{MoodSmit} sat next to me at the Badger. Our elbows touched. I\'ve not been right since.']),
    Sm('sweet', ['We walked by the river last night. {MoodSmit} pointed at a heron. I\'ll never see a heron the same.']),
    { if: { moodSmitHow: 'wed', season: 'winter' }, pri: 2, text: ['We sit with our feet on the same fender every night. Married in winter. Best idea I ever had.'] },
  ]);
  A('mood.smitten.coy', { cheerful: ['{MoodSmit}? Oh! Lovely. Lovely hobbit. Lovely... anyway. What were we saying?'], curious: ['Why do you ask about {moodSmit} especially? Has somebody said something?'], dreamy: ['{MoodSmit}...? Oh, yes. {MoodSmit}. Hm? Sorry.'], witty: ['{MoodSmit}? Never heard of {moodSmitThem}. Who is this mysterious person?'], gloomy: ['{MoodSmit} doesn\'t even know I\'m alive. Not that I care. Not at all.'], elder: ['{MoodSmit}? We\'re old friends. Just old friends. Old and friends.'], rift: ['{MoodSmit}? Just a contact. A regular contact. Nothing special. No.'] });
  A('mood.smitten.glows', { cheerful: ['It shows? Good! Let it show! I want the whole lane to see!'], proud: ['I suppose some things cannot be hidden. Nor should they be.'], curious: ['Really? It shows? Where? On my face? All of it?'], dreamy: ['*smiles, and keeps smiling, and forgets to stop*'], witty: ['Glowing. Like a lamp. A lamp with a very silly grin.'], gloomy: ['...I\'d forgotten I could look like this.'], elder: ['Ha! An old lamp with new oil. Thank you, wizard.'], child: ['I\'m glowing? Like a glow-worm? Hee!'] }, [Sm('wed', ['Married suits me. Everyone says. I say it too, about twice an hour.'])]);
  A('mood.smitten.confides', { cheerful: ['Oh, I can\'t keep it in any longer! It\'s {moodSmit}! It\'s always been {moodSmit}!'], curious: ['Can I ask you something? How do you know if it\'s love? Because it\'s {moodSmit}, and I think it is.'], dreamy: ['...I think about {moodSmit} when the evening comes in. Every evening. Since the spring.'], ornery: ['If you breathe a word, wizard, I\'ll set the geese on you. It\'s {moodSmit}.'], gloomy: ['...It\'s {moodSmit}. It\'ll come to nothing. But it\'s {moodSmit}.'], elder: ['...At my age you\'d think I\'d know better. It\'s {moodSmit}. There.'], rift: ['...Encrypted message, wizard. For you only. It\'s {moodSmit}.'] });
  A('mood.smitten.dreamy', { shy: ['*traces a heart on the gatepost with one finger, then rubs it out quick*'], curious: ['...Do you think two people can like the same jam for ever? We both like damson. That\'s a sign.'], proud: ['...I have a vision. The finest wedding this valley has seen. Bunting to the river.'], gloomy: ['...I picture it, and then I picture {moodSmitThem} saying no, and then I picture it again.'], elder: ['...Two old chairs by one fire. That\'s all I want, at my age.'], witty: ['...I\'ve written {moodSmitThem} a poem. It rhymes "heart" with "cart". It\'s not finished.'] }, [Sm('wed', ['...Our first winter. Two cups, one teapot. I\'ll learn how {moodSmitThey} takes it. I nearly know.'])]);
  A('mood.smitten.huffy', { cheerful: ['Ha! I\'ll manage it myself, thank you. Probably. Eventually.'], shy: ['...I can\'t. Please don\'t make me. Not yet.'], curious: ['What would a wizard know about courting? ...Do you, though?'], witty: ['Courting tips from a man who lives in a cart. I\'ll bear it in mind.'], gloomy: ['What\'s the use? {MoodSmit} won\'t look twice at me.'], elder: ['I was courting before your hat was a hat, young man.'] }, [Sm('wed', ['We\'re married, wizard. The courting\'s done. Now it\'s just the snoring.'])]);
  A('mood.smitten.nervous', { cheerful: ['What if I trip? I\'ll trip. I always trip. On the step. Into {moodSmitThem}.'], curious: ['What does one say, exactly? Is there a form of words? Is there a book?'], dreamy: ['What if it\'s not how I imagined? I\'ve imagined it so many times.'], gloomy: ['{MoodSmitThey}\'ll say no. I know {moodSmitThey} will. I can feel it.'], proud: ['What if I make a fool of myself? A {surname}, making a fool of themselves.'], elder: ['My hands shake already. What if I drop the flowers in the duck pond?'], ornery: ['And if {moodSmitThey} laughs, I\'ll never show my face at the Badger again.'] });
  A('mood.smitten.flowers', { curious: ['Which flowers say I like you but not too much? There must be some.'], dreamy: ['Bluebells. No, cornflowers. No... I\'ll pick one of everything.'], ornery: ['Fine. Flowers. If anyone sees me picking them, I\'m picking them for my mother.'], witty: ['Flowers it is. If it goes wrong I\'ll say they were from you.'], gloomy: ['I\'ll go. And if it goes wrong, at least the flowers were nice.'], elder: ['Daisies. I took {moodSmit}\'s grandmother daisies once. Never mind that.'], child: ['I\'ll pick the BIGGEST ones! With roots on!'] }, [Sm('crush', ['I\'ll leave them on the doorstep. No name. {MoodSmit} will guess. I hope.'])]);
  A('mood.smitten.ew', { cheerful: ['Ha! A wizard in love! Did your beard go curly?'], ornery: ['Don\'t. I\'ve just had my dinner.'], curious: ['Wait, really? Who with? No, tell me after. No, tell me now.'], dreamy: ['...A wizard in love. That\'s rather lovely, actually. Sorry. Go on.'], shy: ['...Oh. Um. That\'s nice. For you.'], proud: ['I\'m sure it was very dignified, but this is about me.'], elder: ['Ha! A long time ago in a wood. That\'s how all the daft stories start.'] });
  A('mood.smitten.swap', { cheerful: ['A wood! How romantic! Was there a lake? Say there was a lake.'], shy: ['...So it happens to everyone. Even wizards. That\'s nice to know.'], dreamy: ['...Older than your magic. I like that. I\'ll think about that.'], ornery: ['Hmph. And how did that turn out for you, then?'], witty: ['Did she turn you into a toad? It would explain a lot.'], elder: ['Love\'s old magic, aye. And I\'ve the grey hairs to prove it.'] });
  A('mood.smitten.tale', { cheerful: ['A hundred years of letters! Oh, I\'m going to cry. Happy crying. Go on.'], shy: ['...That\'s the most beautiful thing. I won\'t tell anyone. Unless I tell {moodSmit}.'], curious: ['Did you keep them? The letters? Do you carry them? Can I see the writing?'], witty: ['A hundred years. Did she ever mention the weather? Elves must run out of things.'], gloomy: ['...So it lasts. Even when it can\'t. That\'s hopeful. For once.'], proud: ['An elf. Of course. Wizards don\'t do things by halves.'], elder: ['A hundred years. I\'ve been married sixty and I\'d still write every day.'], child: ['An ELF? A real one? Did she have pointy ears? Did you kiss her? EWW.'] });
  A('mood.smitten.best', { curious: ['That {moodSmitThey} asks questions back. Most folk just wait for their turn to talk.'], dreamy: ['The way {moodSmitThey} looks at the evening. As if it was put there for {moodSmitThem}.'], witty: ['{MoodSmitThey} laughs at my jokes. Even the bad ones. Especially the bad ones.'], ornery: ['{MoodSmitThey} doesn\'t put up with my nonsense. Nobody\'s ever not put up with it before.'], gloomy: ['{MoodSmitThey} makes the grey days less grey. That\'s everything, really.'], elder: ['{MoodSmitThey} remembers the old songs. All the verses. Even the rude ones.'], rift: ['{MoodSmitThey} never asks about the rift. Just asks how my day was. Here.'] }, [Sm('wed', ['That {moodSmitThey} said yes. I still can\'t get over it. Yes! To me!'])]);
  A('mood.smitten.safe', { cheerful: ['Thank you! Oh, it\'s lovely to have told someone. My chest feels lighter.'], ornery: ['Good. Because I\'ll know if you tell. I always know.'], proud: ['I trust your discretion, wizard. You\'ve not let me down yet.'], dreamy: ['...It\'s safe in two hearts now. Yours and mine.'], gloomy: ['Thank you. Not that there\'s much to keep. But thank you.'], witty: ['If it gets out, I\'ll say you made it up. Nobody believes wizards.'] });
  A('mood.smitten.done', { shy: ['...Thank you for not laughing. I\'ll go and be pink in private.'], curious: ['Thanks, wizard. I\'ve so many questions now. Mostly about flowers.'], dreamy: ['I\'ll go for a walk. A long one. Past a certain door.'], proud: ['Thank you for your counsel. I shall consider my approach.'], gloomy: ['Thank you. I feel a bit less hopeless. A bit.'], witty: ['Off I go, then. To be soppy at the hens.'], elder: ['Bless you, wizard. You\'ve made an old heart feel young.'] }, [Sm('wed', ['I\'d best get home. {MoodSmit} will wonder where I\'ve got to. I love it when {moodSmitThey} wonders.'])]);

  // proud
  A('mood.proud.w.jest', { elder: ['At your age, {name}? Showing off? Splendid.'] }, [P('crowned', ['Shall I fetch a cushion for the crown, Your Majesty?']), P('won', ['I hear they\'re putting up a statue. Of the {moodProudThing}, not you.'])]);
  A('mood.proud.w.thank', {}, [{ if: { parent: has }, text: ['Have you told {parent} yet? Go and tell {parent}.'] }, P('apprenticed', ['Go and thank {moodProudWhat} for taking you on. Properly.'])]);
  A('mood.proud.modest', { ornery: ['Hmph. Anyone could have done it. Nobody did, mind.'], proud: ['Luck? Perhaps a little. Mostly not.'], curious: ['I still don\'t quite know how it happened. I\'ve been trying to work it out.'], dreamy: ['It felt like somebody else did it, and I just watched my hands.'], witty: ['Nothing at all. I sneezed and there it was.'], elder: ['At my age, you don\'t expect it. I\'m as surprised as anyone.'], rift: ['It just compiled, first try. Never happens. Never.'] }, [P('crowned', ['They only picked me because I was standing nearest the maypole.']), P('built', ['It\'s just a {moodProudWhat}. Wood and nails. Mostly nails.'])]);
  A('mood.proud.preens', { curious: ['Folk keep asking how I did it. I\'ve explained it eleven times. I could do twelve.'], dreamy: ['I walked past it six times this morning, just to look at it again.'], witty: ['I\'ve been accepting compliments all day. I\'m very good at it. Practice.'], gloomy: ['Everyone\'s being so nice. I keep waiting for the catch.'], elder: ['Seventy years I\'ve been at it, and now they notice. Better late, I say.'], rift: ['Full signal all week. Everyone pinging me. Well, knocking. Same thing.'] }, [P('built', ['Have you seen my {moodProudWhat}? Folk stop and sit on it. That\'s the best bit.']), P('graduated', ['A proper hand now! Not an apprentice! I keep saying it to myself.'])]);
  A('mood.proud.glows', { cheerful: ['Oh! From you! I\'ll tell everyone you said so. Twice.'], curious: ['Do you really think so? Truly? What was best about it?'], dreamy: ['*smiles quietly, and holds the words close*'], proud: ['High praise. I accept it. Graciously.'], gloomy: ['...I don\'t hear that much. Thank you. I\'ll remember it.'], witty: ['Careful, wizard. Much more of that and I\'ll be unbearable.'], elder: ['Bless you. An old hobbit doesn\'t hear that often enough.'] });
  A('mood.proud.short', { cheerful: ['Oh, sweat and sunshine! And a bit of cake now and then.'], shy: ['...I just practised. That\'s all.'], curious: ['Trial and error. Mostly error. The trial was the fun part.'], gloomy: ['Doing it till it stops going wrong. That\'s all anything is.'], witty: ['Talent, timing, and not listening to anyone. Especially wizards.'], elder: ['Years. Just years. They add up.'], child: ['I just DID it. Like this. See?'] });
  A('mood.proud.how', { cheerful: ['I sang to it! Every morning! Folk think I\'m daft. Daft and a winner!'], shy: ['...Mostly I did it early, when nobody was watching. I go wrong less when nobody watches.'], dreamy: ['I dreamt it first. Then I just did what the dream did.'], ornery: ['Ignored everyone\'s advice. Every last bit. That\'s the secret.'], gloomy: ['I failed at it for years. Then one year I didn\'t. Don\'t ask me why.'], witty: ['Talent, I\'m afraid. Can\'t be taught. Can be envied, though.'], elder: ['My grandad\'s way. Nobody does it his way any more. More fools them.'], rift: ['Back home we\'d run a model first. Here I just ran it in my head. Same thing.'] }, [P('piece', ['Slowly, and with the good tools. And a cup of tea at every step.']), P('apprenticed', ['I kept turning up. Every day. In the end they had to take me on.'])]);
  A('mood.proud.secret', { cheerful: ['Oh, I\'ll tell you! Only you! It\'s {frag:mood.knack}. Ha! Don\'t tell.'], curious: ['I worked it out by accident. It\'s {frag:mood.knack}. Fascinating, isn\'t it?'], ornery: ['If this gets about, wizard, I\'ll know who. It\'s {frag:mood.knack}.'], dreamy: ['...It came to me one evening. It\'s {frag:mood.knack}. Like a gift.'], witty: ['The secret? It\'s {frag:mood.knack}. Also genius. Mostly the genius.'], elder: ['My old mum\'s trick. Sixty years I\'ve kept it. It\'s {frag:mood.knack}.'] });
  A('mood.proud.huff', { cheerful: ['Oh! Well. That\'s a bit unkind. Funny, but unkind.'], ornery: ['Watch it, wizard. I\'ve a long memory and a short temper.'], curious: ['Is that a joke? It sounded like a joke. It didn\'t feel like one.'], dreamy: ['...Oh. I thought you\'d be pleased for me.'], gloomy: ['Knew it was too good to last.'], witty: ['Says the man whose hat has its own postcode.'], elder: ['When you\'re my age, wizard, you\'ll want your moment too.'] });
  A('mood.proud.grin', { cheerful: ['Ha! Too big for my hat? I\'ll buy a bigger hat!'], ornery: ['Hmph. You\'re only jealous.'], curious: ['A statue? Of me? What would I be holding?'], shy: ['*grins at the ground, and can\'t stop*'], witty: ['A small statue. By the well. Facing the inn.'], elder: ['Let an old hobbit have a swagger, wizard.'], child: ['*grins so wide you can see the gap in their teeth*'] });
  A('mood.proud.laughs', { cheerful: ['Ha! Insufferable! Me! Oh, I love it.'], ornery: ['Ha! ...Fine. I\'ll be humble tomorrow.'], shy: ['*laughs, then goes red, then laughs again*'], curious: ['Ha! How big would a hat need to be? Shall we measure?'], dreamy: ['Ha! A glow. Well, I do feel a bit like a lantern.'], gloomy: ['Ha. ...I\'m allowed, aren\'t I? Just for one day?'], elder: ['Ha! Carry my hat. You\'re a cheeky one, for your age. Which is old.'] });
  A('mood.proud.bristle', { cheerful: ['Oh, let me enjoy it! I\'ll be modest next week!'], shy: ['...Oh. Sorry. I\'ll stop talking about it.'], curious: ['Why shouldn\'t it go to my head? What harm would it do there?'], gloomy: ['Right. Of course. Back in my box.'], witty: ['My head has plenty of room. Ask anyone who\'s talked to me.'], elder: ['I\'ve earned a swollen head, at my age.'], child: ['But I WON. You\'re supposed to be PLEASED.'] });
  A('mood.proud.nod', { cheerful: ['Fair! I\'ll be pleased and humble. Both at once. Watch.'], ornery: ['Hmph. Maybe. A bit.'], shy: ['...You\'re right. I don\'t want to be a show-off.'], curious: ['Hm. How does one stay humble, exactly? I\'ve never had to try.'], gloomy: ['No fear of that. I\'ll be back to nothing by Tuesday.'], elder: ['Wise words. I said the same to my grandson. He didn\'t listen either.'], child: ['...Okay. I\'ll only tell people who ask. And some who don\'t.'] });
  A('mood.proud.thanks', { cheerful: ['You\'re right! I\'ll go and hug everyone who helped! Starting now!'], ornery: ['Hmph. I suppose {moodPal} did lend me the good spade. Fine.'], shy: ['...I\'ll go and say thank you. Quietly. They\'ll know.'], curious: ['Who did help, now I think of it? Lots of people, actually. I\'ll start with {moodPal}.'], dreamy: ['Yes. Nobody makes anything alone. I\'ll go and tell {moodPal}.'], gloomy: ['...I forget other folk help. I\'ll go and say so.'], elder: ['Quite right. Manners cost nothing. I\'ll go and see {moodPal} now.'] });
  A('mood.proud.upstaged', { cheerful: ['Ha! Later, wizard! It\'s my turn to boast!'], ornery: ['Oh, here we go. Wizards always have a bigger fish.'], shy: ['...Oh. That\'s nice. Mine wasn\'t a dragon.'], curious: ['A dragon of sparks? ...Wait, no. Me first. Then dragons.'], gloomy: ['Course. Everyone\'s done something better.'], witty: ['Very nice. Did yours get a ribbon? No? Then hush.'], elder: ['Save your stories, wizard. I may not have many prize days left.'] });
  A('mood.proud.swap', { cheerful: ['Ha! A sash! On fire! I\'d have paid to see that!'], ornery: ['Hmph. Set fire to it. Typical wizard.'], shy: ['...So even wizards win things. And feel like this?'], dreamy: ['A dragon of sparks. I\'d love to have seen it.'], gloomy: ['At least you won something. Mine\'ll be forgotten by spring.'], witty: ['You set fire to your prize? That\'s one way to keep it from going to your head.'], elder: ['Ha! I remember those fireworks. Or ones like them. Long ago.'] });
  A('mood.proud.kindred', { cheerful: ['Isn\'t it the best feeling? I want to bottle it!'], ornery: ['Hmph. Didn\'t think wizards needed praise.'], curious: ['Does it fade? Tell me it doesn\'t fade.'], dreamy: ['...Like the whole valley is smiling at you. Yes.'], gloomy: ['...So it\'s real. I keep thinking I\'m imagining it.'], witty: ['A foot taller. In your case that\'s dangerous. Mind the beams.'], elder: ['It never gets old, that feeling. Even when you do.'] });
  A('mood.proud.teacher', { cheerful: ['Everyone! The whole lane! Even the cat taught me patience.'], shy: ['...Nobody really. Books. And watching from behind things.'], curious: ['I taught myself. Then I found out I\'d taught myself wrong. Then I taught myself again.'], dreamy: ['The river, a bit. It does the same thing over and over and never gets bored.'], ornery: ['Nobody. Everybody told me I\'d never manage it. That taught me.'], gloomy: ['My own mistakes. There were plenty to learn from.'], elder: ['Old Holman, before your time. Never smiled. Never wrong.'], rift: ['Back home we had tutorials for everything. Here I just watched the old ones.'] });
  A('mood.proud.next', { cheerful: ['Next? Do it again! Better! Bigger!'], shy: ['...Something small. Something I can do on my own.'], curious: ['There\'s a way of doing it nobody\'s tried. I want to try it.'], ornery: ['Win again. And again. Till they stop entering.'], gloomy: ['Probably nothing. But I\'d like to try for something.'], witty: ['Retire at my peak. No. Win again first. Then retire.'], elder: ['At my age? Teach someone. Pass it down before I go over the hills.'], child: ['Be a wizard! Or a baker! Or both!'] });
  A('mood.proud.done', { cheerful: ['Thank you, wizard! Best day ever! Possibly!'], shy: ['...Thank you for coming. It meant a lot.'], curious: ['Thanks! I\'ll come and tell you how the next one goes.'], dreamy: ['I\'ll remember today. And you in it.'], ornery: ['Hmph. Decent of you. Very decent.'], gloomy: ['That\'s the nicest thing that\'s happened in ages. Thank you.'], witty: ['Off you go. I\'ve more people to show off to.'], elder: ['Bless you, wizard. You\'ve made an old hobbit\'s year.'] });
  A('sit.proud.warm', {}, [P('built', ['A fine {moodProudWhat}, {name}. I sat on it. It held.']), P('graduated', ['A proper hand now, {name}! Congratulations!']), P('skill', ['They tell me you\'re getting good at {moodProudWhat}, {name}.'])]);

  // merry
  A('mood.merry.w.jest', { elder: ['To the old folk! Who could dance the young off their feet!'] }, [M('birthday', ['To {name}! Older, wiser, and only slightly sticky!']), M('feast', ['To the cooks! And to whoever invented pudding!'])]);
  A('mood.merry.w.easy', {}, [M('tipsy', ['Water, {name}. Then bread. Then bed. In that order.']), M('feast', ['Pace yourself, {name}. Pudding\'s a marathon, not a sprint.'])]);
  A('mood.merry.see', { child: ['They\'re bouncing on the spot, quite unable to keep still.'] }, [M('party', ['There\'s a paper crown slipping over one ear.']), M('feast', ['There\'s gravy on their waistcoat and a smile under it.']), M('birthday', ['There\'s cake on their chin, and they don\'t care a bit.'])]);
  A('mood.merry.huh', { cheerful: ['Eh? Oh! Ha! Yes! ...What?'], shy: ['*smiles uncertainly, and nods along anyway*'], curious: ['Moving? Is it? How? Oh, a joke! I get it now!'], dreamy: ['Hm? Sorry, I was watching the lanterns. They\'re ever so pretty.'], witty: ['I\'ll laugh at that later. When I\'ve understood it.'], elder: ['Eh? Speak up, wizard, the fiddler\'s got my good ear.'], child: ['What? What did you say? Say it again!'] }, [M('feast', ['Mm? Sorry, mouth full. Mouth very full. Go on.'])]);
  A('mood.merry.roars', { curious: ['Ha! How did you think of that? Wait. Ha!'], dreamy: ['Ha! Oh, what a lovely night to laugh in.'], proud: ['Ha! Very good. Very good. I\'ll tell that one as my own.'], gloomy: ['Ha! Ha! I haven\'t laughed like this in months!'], elder: ['Ha! Oh, my old ribs! Stop it, you devil!'], child: ['HAHAHA! You\'re SO FUNNY!'] }, [M('feast', ['HA! Oh, I can\'t laugh, I\'ll burst. I\'ve had three pies!'])]);
  A('mood.merry.toast', { shy: ['*lifts a cup, very small* ...To you, wizard.'], curious: ['A toast! To... what are we toasting? To toasting!'], dreamy: ['To nights like this. May there be a hundred more.'], ornery: ['To the wizard. You\'ll do. There. I said it.'], gloomy: ['To tonight. Let\'s not think about tomorrow.'], witty: ['To the wizard\'s hat! May it never fall in the soup again!'], elder: ['To absent friends, and present ones. And to you, lad.'] }, [M('feast', ['To the cooks! To the pies! To my belt, which has given up!']), M('holiday', ['To no work! May every day be a holiday! Except the ones that aren\'t!'])]);
  A('mood.merry.hug', { cheerful: ['*grabs you round the middle and squeezes*', 'Come here! Everyone\'s getting a hug today!'], curious: ['*hugs you, then steps back* You smell of pipe-weed and rain. Interesting.'], dreamy: ['*a long warm hug, and a sigh*'], proud: ['*a dignified embrace, then a pat on the arm*'], witty: ['*hugs you* You\'re very bony for a wizard.'], gloomy: ['*hugs you hard* ...Thanks. I needed that.'], elder: ['*hugs you, and pats your back twice, firmly*'], child: ['*leaps at you and clings like a limpet*'] });
  A('mood.merry.loveyou', { cheerful: ['I love you! I love the fiddler! I love the TABLE!'], curious: ['Why are you so nice? Is it magic? It\'s magic, isn\'t it?'], dreamy: ['You\'re like a lighthouse, wizard. A tall, hatted lighthouse.'], proud: ['I don\'t say this often. You\'re a credit to wizards.'], witty: ['You\'re my favourite wizard. Out of all the wizards. All one of you.'], gloomy: ['You\'re the only one who ever stops to talk. Did you know that?'], elder: ['You\'re a good lad. A good, tall, old lad.'], child: ['You\'re my BEST friend. After the cat. No, before the cat!'] }, [M('birthday', ['Best birthday ever, and you came! You\'re the best present!'])]);
  A('mood.merry.ramble', { cheerful: ['And the fiddler played my favourite, and I danced, and I fell over, and I danced again!'], shy: ['...I danced. With somebody. I don\'t usually. I did tonight.'], proud: ['I was the best dancer there, of course. Ask anyone. Ask the fiddler.'], ornery: ['The ale\'s not as good as last year, the fiddler\'s too fast, and I\'m having a grand time.'], gloomy: ['Do you know, I nearly didn\'t come? I\'m so glad I came.'], witty: ['And THEN the Steward tried to dance. You missed it. You\'ll never recover.'], elder: ['In my day we danced till the sun came up. I\'ll manage till ten.'] }, [M('birthday', ['Did you know it\'s my birthday? It is! Everyone gave me things! I gave myself cake!']), M('tipsy', ['I\'ve had... how many? Two. Five. Some.'])]);
  A('mood.merry.blurts', { cheerful: ['Ooh, I shouldn\'t say! But I will! I know {frag:mood.slip}! Ha!'], curious: ['Can I tell you something? I found out {frag:mood.slip}. Isn\'t that interesting?'], dreamy: ['...You know what I\'ve never told anyone? I know {frag:mood.slip}.'], proud: ['Strictly between ourselves, I happen to know {frag:mood.slip}.'], ornery: ['You want a secret? Fine. I know {frag:mood.slip}. No. I didn\'t say that.'], gloomy: ['...I know {frag:mood.slip}. I\'ve been carrying that for years.'], elder: ['Did you know {frag:mood.slip}? Ha! Nobody remembers but me.'], child: ['I know a SECRET. It\'s {frag:mood.slip}. Don\'t tell Mum I told.'] });
  A('mood.merry.song', { cheerful: ['*sings a merry jig and claps along, mostly in time*'], curious: ['*sings a song with eleven verses, and asks you to guess the twelfth*'], dreamy: ['*sings an old slow song about the moon on the Brandywine*'], proud: ['*sings a ballad in a fine strong voice, and bows at the end*'], witty: ['*sings a rude song about the Steward, very quietly*'], gloomy: ['*sings a sad song, very happily*'], elder: ['*sings a song so old nobody else knows the words*'] }, [M('party', ['*sings along with the fiddler, a beat behind, gloriously*']), M('feast', ['*sings a song about pies, banging the table in time*'])]);
  A('mood.merry.dance', { cheerful: ['Round and round! Faster! FASTER! Ha!'], curious: ['Is that how wizards dance? Do it again, I want to see your feet.'], dreamy: ['*dances slowly, eyes closed, humming the tune*'], proud: ['Not bad, wizard. Not bad. I\'ll lead.'], ornery: ['Ha! A bass! I\'ll never let you forget it. Never.'], gloomy: ['Ha! I\'m DANCING. With a WIZARD. Nobody\'ll believe me.'], witty: ['That voice! Like a cellar door! A very cheerful cellar door!'], elder: ['*does a creaky little jig and has to sit down, laughing*'], child: ['*swings round and round holding your fingers till you\'re both dizzy*'] });
  A('mood.merry.spoilsport', { cheerful: ['Oh, don\'t be dull! The night\'s young! I\'m young! Ish!'], shy: ['...Oh. Sorry. I\'ll be quieter.'], curious: ['Why should I? Give me one good reason. A good one.'], dreamy: ['But it\'s so lovely. Let me have it a bit longer.'], proud: ['I know my limits, wizard. I\'m nowhere near them.'], witty: ['Easy? Easy is for tomorrow. Tonight is for hard.'], gloomy: ['First time I\'ve been happy in weeks and you want me to stop?'], elder: ['I\'ve been going easy for eighty years. Tonight I\'m going hard.'] }, [M('feast', ['Go easy? On PUDDING? Are you mad?'])]);
  A('mood.merry.grumble', { cheerful: ['Ha! All right! One more, then sensible!'], ornery: ['Fine. Sensible. You\'re worse than my mother.'], shy: ['...All right. In a bit.'], curious: ['Hm. Just one more, then I\'ll test your theory about water.'], proud: ['When I choose. Which will be soon. Possibly.'], witty: ['One more dance and then I\'ll be very sensible. Promise.'], elder: ['My knees say yes. My heart says one more jig.'] }, [M('feast', ['One more pudding. Then I\'ll stop. Then maybe one more.'])]);
  A('mood.merry.sense', { cheerful: ['Oh, you\'re right! Bread and water! And then MORE dancing!'], shy: ['...Thank you. I was getting a bit wobbly.'], curious: ['Hm. Bread first. I\'ll see if it works. For science.'], proud: ['A sensible suggestion. I was about to make it myself.'], dreamy: ['A sit down. Under the lanterns. That sounds perfect.'], gloomy: ['You\'re right. I\'d only regret it tomorrow. I regret most things tomorrow.'], witty: ['Fine. A crust. Wizards are terrible at parties.'], elder: ['You\'re right, you\'re right. My head will thank you in the morning.'] }, [M('feast', ['...Yes. A walk. A slow one. I can\'t move fast after four puddings.'])]);
  A('mood.merry.done', { cheerful: ['Night, wizard! Or morning! Love you! Bye!'], ornery: ['Not a bad night. Not bad at all. Don\'t tell anyone I enjoyed it.'], curious: ['Same time tomorrow? Is there one tomorrow? Can we have one?'], dreamy: ['I\'ll remember tonight. Every lantern.'], proud: ['A splendid evening. I was splendid in it.'], gloomy: ['...That was the best night I\'ve had in ages. Thank you.'], witty: ['Off I go, before I say anything I\'ll remember.'], elder: ['Bless you, lad. I\'ll be stiff tomorrow, and glad of it.'] }, [M('birthday', ['Best birthday ever! Thank you, wizard! Now where did I put my cake?'])]);
  A('sit.merry.jest', {}, [M('birthday', ['Another year! I\'d never have guessed. You don\'t look a day over pudding.']), M('feast', ['How many pies is that, {name}? Don\'t count the small ones.'])]);

  // bored
  A('mood.bored.w.try', { elder: ['Teach a little one something you know, {name}. Boredom can\'t abide a lesson.'], rift: ['Go and take something apart, {name}. You rift-folk always feel better after.'] }, [{ if: { spouse: has }, text: ['Take {spouse} for a walk to the river. You\'ll find something to talk about.'] }, { if: { season: 'autumn' }, text: ['The blackberries are out on the far hedge. Go and get scratched.'] }, { if: { season: 'winter' }, text: ['Go and build something out of snow. A snow-wizard. Make the hat big.'] }]);
  A('mood.bored.w.hill', {}, [{ if: { season: 'winter' }, text: ['Get a tea-tray and go down the big hill on it. That\'s what hills and trays are for.'] }, { if: { season: ['spring', 'summer'] }, text: ['Go and find the best climbing tree on the hill. Then find a better one.'] }]);
  A('mood.bored.w.rift', {}, [{ if: { season: 'winter' }, text: ['Ask the rift-folk how they kept warm in the city. They\'ve stories with lights in.'] }, { if: { stage: 'child' }, text: ['The rift-folk have a game where you hide and send each other signals. Go and ask.'] }]);
  A('mood.bored.w.tale', { child: ['Shall I tell you about the time a goblin stole my hat? It\'s a good one.'], elder: ['Shall I tell you a tale from before your grandmother\'s grandmother?'] });
  A('mood.bored.w.jest', { child: ['Shall I make you into a frog? You\'d have lots to do. Catching flies.'] });
  A('mood.bored.flat', { cheerful: ['Ha. Yes. Good one. ...I\'m too bored to laugh. That\'s how bad it is.'], shy: ['*a polite little smile*'], curious: ['A teapot. Hm. No.'], dreamy: ['Mm. Nice.'], proud: ['I\'m beyond such amusements, wizard.'], witty: ['That was the joke? Bless you for trying.'], gloomy: ['Ha. Even jokes are boring today.'], elder: ['I\'ve heard that one. I heard it before your hat was made.'] });
  A('mood.bored.snicker', { cheerful: ['Ha! Dancing eyebrows! Do it! Go on!'], ornery: ['Hmph. ...That\'s mildly funny.'], shy: ['*a small snort, hidden behind a hand*'], curious: ['A teapot? What sort? Would I have a spout?'], dreamy: ['Ha. A teapot on a shelf, watching the world. Not so bad.'], proud: ['Ha. A fine teapot I\'d make. Bone china.'], gloomy: ['Ha. ...Huh. That got me.'], elder: ['Ha! My old eyebrows could do with a dance.'] });
  A('mood.bored.scheme', { cheerful: ['Ooh! Let\'s paint the hens! In stripes!'], curious: ['What if we found out where the river actually goes? Follow it! All the way!'], dreamy: ['What if we had a party for no reason at all? Tonight?'], ornery: ['I\'ve a mind to rearrange every bench on the green. Just to see the faces.'], proud: ['I shall organise a contest. With rules. And a prize. Which I\'ll win.'], gloomy: ['...What if I just went over the hill and saw what\'s there?'], elder: ['When I was young we greased the maypole. I\'ve still got the lard.'], rift: ['What if I wired the weathervane to whistle? Just a small whistle.'] });
  A('mood.bored.sigh', { cheerful: ['Me, bored! Isn\'t it awful? I\'m usually so busy being happy.'], shy: ['...I don\'t mind. I\'m used to it. It\'s just quiet.'], curious: ['There\'s nothing left to find out. I\'ve found it all out.'], proud: ['There\'s nothing worthy of my attention.'], witty: ['I\'ve run out of things to be clever about.'], gloomy: ['Every day\'s the same as the last. Same as tomorrow will be.'], rift: ['No feed, no signal, no noise. Just hens. Hens all day.'] }, [{ if: { weather: 'rain' }, text: ['It\'s raining. It\'s been raining for ever. I\'ve counted the drops. Forty thousand.'] }]);
  A('mood.bored.moan', { cheerful: ['I\'ve swept the step three times. It\'s the cleanest step in the Shire. I\'m losing my mind.'], shy: ['...I sat by the window all morning. Nobody went past. Not even a cat.'], ornery: ['Nothing to do but listen to the neighbours argue. Again.'], dreamy: ['I tried to daydream, but even my daydreams were dull.'], witty: ['I\'ve read the almanac. Twice. The weather was the exciting bit.'], gloomy: ['Nothing\'s happened since the spring fair. And that was only a fair.'], elder: ['At my age they won\'t let me do anything. Sit down, they say. I\'ve sat.'], rift: ['Back home there was always something lit up. Here the most exciting thing is a duck.'] }, [{ if: { season: 'summer' }, text: ['It\'s too hot to do anything and too nice to do nothing.'] }]);
  A('mood.bored.wish', { cheerful: ['A party! A big one! With fireworks and a pie the size of a cart!'], shy: ['...Something new. On my own. Where nobody watches.'], curious: ['Find out something nobody knows. Anything. Even about worms.'], dreamy: ['Go on a journey. Not far. Just over the next hill. Just to see.'], ornery: ['Anything but this. Anything at all.'], proud: ['Something worthy of me. A great project. Something they\'d talk about.'], gloomy: ['Something to look forward to. That\'s all. One thing.'], elder: ['Go to the sea once more. I saw it when I was young. Never again.'], rift: ['Fix something. Anything. My hands are going soft.'] });
  A('mood.bored.donethat', { cheerful: ['Done it! Loved it! Done it again! Now what?'], shy: ['...I tried. It wasn\'t any good on my own.'], curious: ['Done that. And worked out how it works. Now it\'s boring.'], dreamy: ['I did that last week. It was nice. It isn\'t now.'], proud: ['I mastered that years ago.'], witty: ['Done that, wrote a song about it, sang the song. Next?'], gloomy: ['Tried it. Didn\'t help.'], elder: ['Did that in the Fell Winter. Didn\'t help then either.'] });
  A('mood.bored.maybe', { cheerful: ['Ooh. Maybe! That might be fun!'], ornery: ['Maybe. Don\'t push.'], shy: ['...Maybe. If nobody\'s about.'], curious: ['Hm. I haven\'t done that. I could see how it goes.'], dreamy: ['Maybe. If the day feels right.'], proud: ['I shall consider it.'], gloomy: ['Could try. Won\'t help. But could try.'], elder: ['Maybe. If my knees agree.'] });
  A('mood.bored.takes', { shy: ['...I\'ll try it. Quietly. Thank you.'], curious: ['Yes! I\'ve never done it that way. I want to see how it turns out.'], dreamy: ['Oh, that sounds lovely. I\'ll go now, while the light\'s nice.'], proud: ['A worthy pursuit. I shall do it properly.'], witty: ['Fine. If it\'s dull, I\'ll make it interesting. That\'s a promise and a threat.'], gloomy: ['...All right. Can\'t be worse than this.'], elder: ['Right. Up I get. The old bones could do with moving.'], rift: ['A project. Yes. Something to fix. Battery recharging.'] });
  A('mood.bored.hillgame', { cheerful: ['ROLLING! The big hill! Last one down\'s a turnip!'], shy: ['...I\'ll roll down when nobody\'s looking. It\'ll still count.'], curious: ['Which side\'s fastest? I\'m going to try ALL the sides!'], ornery: ['Fine. But I\'m going down the steep bit. On purpose.'], gloomy: ['...I haven\'t rolled down a hill in ages. Okay.'] });
  A('mood.bored.riftgame', { cheerful: ['A city game! With lights! I\'m going to be the BEST at it!'], shy: ['...Will they mind? They won\'t mind. I\'ll ask. Quietly.'], curious: ['How does it work? Is it real signals? I\'m going to ask a hundred questions!'], ornery: ['Fine. But if it\'s rubbish I\'m coming back.'], gloomy: ['...They might let me play. They might. I\'ll ask.'] });
  A('mood.bored.yawn', { cheerful: ['*a huge happy yawn* Sorry! Go on! I\'m awake! Mostly!'], ornery: ['Is this going to take long?'], shy: ['*tries to hide a yawn, and fails*'], curious: ['Is it new? I\'ve heard all your old ones.'], dreamy: ['*yawns, and starts to drift off on the spot*'], proud: ['I believe I know how that ends.'], gloomy: ['Is it a sad one? They\'re usually sad.'], elder: ['I\'ve heard it. You told it at my wedding.'] });
  A('mood.bored.listens', { cheerful: ['Ooh, trolls! I love a troll story! Go on!'], ornery: ['Hmph. Trolls. ...What did they do, then?'], shy: ['*leans in, very quiet, listening hard*'], dreamy: ['*eyes go far away, seeing the trolls*'], proud: ['I\'d have handled the trolls differently. ...Go on.'], witty: ['Mutton? Trolls with taste. Go on.'], gloomy: ['...All right. I\'m listening. A bit.'], elder: ['My grandad saw a troll once. Said it was mostly elbows. Go on.'] });
  A('mood.bored.rapt', { cheerful: ['Oh! Oh! That was BRILLIANT! Another!'], shy: ['...That was wonderful. Thank you.'], curious: ['Did that really happen? How heavy was the cart? Did it break?'], dreamy: ['...I could see it all. The trolls, the fire. Everything.'], proud: ['A fine tale. Well told. I\'ll tell it at the Badger.'], witty: ['Ha! A troll on a cart. I\'ll never look at a cart the same.'], gloomy: ['...I forgot to be miserable. All the way through.'], elder: ['Ha! That\'s a story, that is. They don\'t make them like that now.'] });
  A('mood.bored.meh', { cheerful: ['Ha, that\'s nice! Doesn\'t help me, though!'], ornery: ['Good for you. I don\'t smoke.'], shy: ['...Oh. That sounds nice.'], curious: ['Smoke ships? How? No, I\'m too bored to ask.'], dreamy: ['Ships... I suppose. Mm.'], proud: ['I\'m sure it impresses the hens.'], gloomy: ['Smoke rings won\'t help. Nothing helps.'], elder: ['I\'ve blown smoke rings for sixty years. They\'re still just smoke.'] });
  A('mood.bored.swap', { cheerful: ['Hundreds of years? I\'d have run out of things! What do you DO?'], ornery: ['Hmph. Wizards. Bored for centuries and still lecturing the rest of us.'], shy: ['...So it\'s not just me. That helps.'], dreamy: ['Ships of smoke sailing on the evening. That\'s lovely, actually.'], proud: ['So boredom comes even to the great. How reassuring.'], gloomy: ['Centuries of it. And you\'re still cheerful? How?'], elder: ['Ha. Me too, wizard. Only I\'ve done it in decades.'] });
  A('mood.bored.idea', { cheerful: ['Ooh! I\'ve got it! I\'m going to make a kite! A huge one!'], ornery: ['Hmph. That\'s given me an idea. A good one. Don\'t look so smug.'], shy: ['...I\'ve thought of something. I won\'t say. I\'ll show you after.'], curious: ['Wait! What if I tried that with soap and a straw? I\'m going to find out!'], dreamy: ['Ships made of mist on the pond, in the morning. I\'ll try it.'], proud: ['An idea. A fine one. I shall execute it at once.'], gloomy: ['...Hm. That might work. Might.'], elder: ['Ha! I used to do that. I\'ll show the young ones how.'] });
  A('mood.bored.done', { cheerful: ['Thanks, wizard! Day saved! Probably!'], ornery: ['Hmph. Less bored. Don\'t take the credit.'], shy: ['...Thank you. That was nice.'], curious: ['Thanks! Come back when you\'ve more stories!'], dreamy: ['Thank you. The day feels bigger now.'], proud: ['Thank you for the diversion, wizard.'], gloomy: ['That helped. I don\'t know why, but it did.'], elder: ['Bless you, lad. You\'ve livened up an old hobbit\'s day.'] });
  A('sit.bored.ask', {}, [{ if: { stage: 'child' }, text: ['What\'s the matter, {name}? Nobody to play with?'] }, { if: { weather: 'rain' }, text: ['Rained in, {name}?'] }]);

  // busy
  A('mood.busy.w.help', { elder: ['Here. I may be old, but I can hold the end of a plank.'] }, [J('baker', ['Hand me a bowl. I\'ve stirred a cauldron or two in my time.']), J('farmer', ['Pass me a hoe. Wizards can hoe. Badly, but we can.']), J('innkeeper', ['I\'ll carry the mugs. I\'ll try not to drink any.']), J('fisher', ['Pass me the net. I\'ll hold the wet end.'])]);
  A('mood.busy.w.rest', {}, [J('baker', ['The bread can rise without you watching it, {name}. Sit down.']), J('farmer', ['The barley won\'t grow faster for you staring at it. Sit a minute.']), J('innkeeper', ['Pour yourself one, {name}. Just a small one.'])]);
  A('mood.busy.w.jest', {}, [J('baker', ['Shall I just stand here and smell the bread? I\'m very good at that.']), J('fisher', ['I\'ll just stand here and frighten the fish for you.'])]);
  A('mood.busy.see', { elder: ['They move slowly but surely, and never waste a step.'] }, [J('fisher', ['Their boots are soaked, and there\'s a fish scale on one cheek.']), J('herbalist', ['Their fingers are stained green with something sharp-smelling.']), J('brewer', ['They smell of malt and warm yeast.']), J('innkeeper', ['A cloth over one shoulder, and three mugs in one hand.'])]);
  A('mood.busy.shoo', { cheerful: ['Can\'t stop! Lovely to see you! Can\'t stop!'], curious: ['Oh! Hello! Wait, hold this. No, don\'t. Later, wizard!'], dreamy: ['Hm? Oh, wizard. Sorry, my head\'s in the work.'], witty: ['If you want a chat, you\'ll have to book. I\'m fully booked.'], gloomy: ['Of course you come when I\'m busiest. Everyone does.'], elder: ['Not now, lad. These old hands have to get it done before dark.'] }, [J('brewer', ['Not now! If I stop stirring it\'ll catch!']), J('fisher', ['Shh! They\'re biting! Don\'t frighten them!']), J('woodwright', ['Mind the saw! Not now, wizard!']), J('herbalist', ['Not now! I\'m counting drops! One, two... oh, now I\'ve lost count.'])]);
  A('mood.busy.nod', { ornery: ['*grunts, and keeps on*'], shy: ['*a quick nod, and back to it*'], curious: ['Hello! Watch this bit, it\'s tricky.'], dreamy: ['*nods slowly, and hums to the work*'], proud: ['*nods, gravely, without breaking stride*'], witty: ['Morning. I\'d wave, but I\'m holding things.'], gloomy: ['Mm. Same old work.'], elder: ['Morning, lad. Mind the bucket.'] });
  A('mood.busy.smile', { cheerful: ['Ha! It\'s always nice to see you, wizard!'], ornery: ['Hmph. Passing. Course you are.'], curious: ['Passing? To where? You\'re always going somewhere.'], dreamy: ['*smiles up at you, warm as the sun*'], proud: ['Good of you to notice the work. Most don\'t.'], witty: ['Passing! Very slowly. I saw you coming from the bridge.'], gloomy: ['Thanks. Nobody notices usually.'], elder: ['Ah, the wizard. Always a pleasure, lad.'] });
  A('mood.busy.grin', { cheerful: ['Ha! Scandalous! That\'s me all over!'], shy: ['*grins at the work and says nothing*'], curious: ['Hard work? Is there easy work? What does it look like?'], dreamy: ['Ha. On a day like this. You\'re right, really.'], proud: ['Hard work is the only work worth doing, wizard.'], witty: ['It\'s only hard if you do it properly. I do it properly.'], elder: ['Ha! Sixty years of scandal, then.'] });
  A('mood.busy.laughs', { cheerful: ['Ha! You! Working! I\'d pay to watch!'], ornery: ['Ha! ...Fine. That was funny.'], shy: ['*laughs, and nearly drops something*'], curious: ['Ha! A wizard who doesn\'t help. Is that a rule?'], dreamy: ['Ha! A decorative wizard. Every lane should have one.'], proud: ['Ha! Watch and learn, wizard.'], gloomy: ['Ha. ...That\'s the first laugh I\'ve had all day.'], elder: ['Ha! You\'re a card, you are.'] });
  A('mood.busy.inway', { shy: ['...Oh. It\'s all right. Really. I\'ll pick it up.'], curious: ['Ha! How did you manage that? Do it again. No, don\'t.'], dreamy: ['Oh. Well. It looked better on the floor anyway.'], proud: ['Perhaps you\'d better watch. From over there.'], witty: ['Thank you. I needed more to do.'], gloomy: ['Course. Course it did.'], elder: ['Steady on, lad. You\'re worse than my grandson.'] }, [J('innkeeper', ['That was a full mug. That was a PAID-FOR full mug.']), J('woodwright', ['That plank was straight. Was.'])]);
  A('mood.busy.helps', { curious: ['Oh, you\'re left-handed! Interesting. Hold it this way.'], dreamy: ['Thank you. It\'s nicer, working with someone.'], proud: ['Acceptable. With practice, you could be adequate.'], witty: ['Look at that. A wizard with a useful skill.'], gloomy: ['...Thanks. It goes quicker with two.'], elder: ['Good lad. Many hands, as my mother said.'] }, [J('fisher', ['Pull! Pull! There! Look at that one! We\'ll have supper out of you yet!']), J('woodwright', ['Hold it steady. Steady. There. Square as a die.']), J('brewer', ['Stir. Slowly. Like you\'re thinking about something nice.'])]);
  A('mood.busy.bristle', { cheerful: ['Oh, I couldn\'t stop now! Too much to do!'], shy: ['...I\'d rather keep going. If that\'s all right.'], curious: ['Why? What\'s wrong with how I\'m doing it?'], dreamy: ['I\'m nearly in the swing of it. If I stop I\'ll lose it.'], witty: ['Thank you, wizard. Now I\'ll do it exactly the same.'], gloomy: ['And who\'ll do it if I stop? Nobody.'], elder: ['Rest? I\'ll rest when I\'m over the hills.'] });
  A('mood.busy.tip', { cheerful: ['Ooh, could be! I\'ll try it after!'], ornery: ['Hmph. I\'ll think on it. Probably not.'], shy: ['...I\'ll try it. Thank you.'], dreamy: ['Hm. I like that. I\'ll see.'], proud: ['An interesting suggestion. I\'ll consider it.'], witty: ['A tip from a wizard. Should I pay you?'], gloomy: ['Might help. Probably won\'t.'], elder: ['My dad said the same. I didn\'t listen to him either.'] });
  A('mood.busy.break', { shy: ['...Five minutes. Thank you. I didn\'t like to stop on my own.'], curious: ['A break? All right. Tell me something while I drink it.'], dreamy: ['Tea and a sit in the sun. That\'s a lovely idea.'], proud: ['A short respite is permissible.'], witty: ['Tea. Wizard\'s orders. I\'ll tell the boss. The boss is me.'], gloomy: ['...Maybe I do need a minute.'], elder: ['Ha! You\'re right. These old knees have earned it.'] }, [J('baker', ['The loaves can mind themselves for five minutes. Kettle!']), J('innkeeper', ['Five minutes. If anyone wants ale, they can pour it themselves.'])]);
  A('mood.busy.ignore', { cheerful: ['*sings to the work, and doesn\'t hear you*'], ornery: ['*works on, very deliberately not looking up*'], curious: ['*frowns at the work, puzzling something out*'], dreamy: ['*far away, hands working on their own*'], proud: ['*does not look up. Busy hands, busy mind.*'], gloomy: ['*sighs at the work, and keeps going*'], elder: ['*working slowly, steadily, deaf to the world*'] });
  A('mood.busy.mutters', { cheerful: ['...la la la, one more, two more... oh! Hello!'], ornery: ['...and if HE thinks I\'m doing this twice... oh. Wizard.'], curious: ['...if I turn it that way... hm. No. Sorry, wizard. Thinking.'], dreamy: ['...nearly there, nearly there... sorry? Oh, hello.'], gloomy: ['...always me, always me... oh. Didn\'t see you.'], elder: ['...in my day we did it by hand... we still do. Hello, lad.'] }, [J('farmer', ['...one row, two row... rain by four... sorry. Rows.']), J('postie', ['...Bagshot Row, then the mill, then old Mother... sorry. Letters.'])]);
  A('mood.busy.hardest', { cheerful: ['Not stopping to chat! I love a chat. Work gets in the way.'], shy: ['...When people watch. I go wrong when people watch.'], curious: ['Not knowing why things go wrong. I always want to know why.'], dreamy: ['Remembering to come back down when my head\'s in the clouds.'], ornery: ['Other people. Always other people.'], witty: ['Making it look easy. That\'s the hardest bit of all.'], elder: ['My knees. Everything else I could do in my sleep.'] }, [J('fisher', ['Waiting. You can\'t hurry a fish. I\'ve tried.']), J('postie', ['Dogs. Every lane\'s got a dog that hates letters.']), J('herbalist', ['Folk who won\'t take the remedy. You can lead a hobbit to sage...'])]);
  A('mood.busy.later', { shy: ['...Thank you for stopping. Come again.'], curious: ['Later! I\'ll have questions for you. I always do.'], dreamy: ['Later, wizard. Come at sunset. It\'s nicer then.'], proud: ['Do come by when the work\'s done. You can admire it.'], witty: ['Later, then. I\'ll pencil you in. Between the bread and the washing.'], gloomy: ['Right. Later. If there is a later.'], elder: ['Come for supper, lad. We\'ll talk properly.'] });
  A('sit.busy.ask', {}, [J('fisher', ['Biting today?']), J('innkeeper', ['Busy at the Badger?']), J('woodwright', ['What are you making?']), J('herbalist', ['Who\'s poorly today?'])]);
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
  lines('mood.smitten.w.close', [{ text: ['Go on, then. Go and be soppy somewhere nice.', 'I\'m glad for you, {name}. Truly.', 'Hold on to it. It\'s the best thing going.'] }]);
  tidy('mood.smitten', 'done', 'mood.smitten.w.close');
  lines('mood.proud.w.close', [{ text: ['Well done, {name}. Truly.', 'You\'ve earned every bit of it.', 'Enjoy it. Days like this don\'t come every week.'] }]);
  tidy('mood.proud', 'done', 'mood.proud.w.close');
  lines('mood.merry.w.close', [{ text: ['Enjoy yourself, {name}. Mind the step.', 'Go on, back to the fun with you.', 'Long may it last. Good night, or day, or whichever.'] }]);
  tidy('mood.merry', 'done', 'mood.merry.w.close');
  lines('mood.bored.w.close', [{ text: ['Go and find something to do. I\'ll want to hear about it.', 'Something will turn up. It always does.', 'Off you go. Surprise yourself.'] }]);
  tidy('mood.bored', 'done', 'mood.bored.w.close');
  lines('mood.busy.w.close', [{ text: ['I\'ll leave you to it, {name}.', 'I\'ll not keep you from your work.', 'Back to it, then. I\'ll stop by later.'] }]);
  tidy('mood.busy', 'later', 'mood.busy.w.close');
});
