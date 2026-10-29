'use strict';
// ---------------------------------------------------------------------------
// The core of what's said when you talk with folk as the wizard: greetings,
// partings, how a remark lands, phrases folk are fond of, and the everyday
// threads (how they are, what's on their mind, the news, their evenings,
// passing the time). Loaded first; the other packs add to the same keys.
//
// How to write a pack (copy this file's shape):
//   talkPack('name', () => { lines(...); addThread({...}); ... });
// Lines: lines(key, [ { if: { fact: value | [any of] | {min,max} | fn }, not: {...}, pri, text: [...] } ])
//   The most specific rule that fits wins (most `if` keys, plus pri); a rule
//   with no `if` is the fallback every key must have. Placeholders come from
//   factsOf() in js/threads.js: {name} {Name} {they} {them} {their} {jobWord}
//   {pastimeWord} {made} {madeOne} {madeMany} {spouse} {kid} {kids} {parent}
//   {rival} {friend} {like} {dislike} {wishText} {dreamText} {home} {season}
//   {weather} {hour} {lost} {lostRel} {joke} {told} {lastLabel} {lastAsked} {pet} {wiz},
//   and {frag:key} for a random fragment. A line with a placeholder that
//   can't be filled is skipped, so only use one where its `if` guarantees it.
// Facts of your own: addFacts((v, F, T) => { F.myFact = ... ?? null; }) — set the key
//   even when it doesn't apply (null), so the lint knows it exists.
// Threads: see addThread in js/threads.js. Keep their lines short (a phone
//   screen: 140 characters at most), American English, cozy and gently funny.
// ---------------------------------------------------------------------------

talkPack('core', () => {
  // --- Phrases of their own (one each, picked by id), and joints --------------------
  frags('pet', ['bless my buttons', 'and no mistake', 'as I live and breathe', 'mark my words', 'if you take my meaning', 'heaven help us', 'goodness gracious', 'as sure as eggs is eggs', 'by my grandmother\'s teapot', 'and that\'s the long and short of it', 'well I never', 'between you and me and the gatepost']);
  frags('pet.child', ['honest', 'cross my heart', 'for really real', 'I promise', 'it\'s true']);
  frags('pet.rift', ['copy that', 'full signal', 'no lag', 'low battery', 'ping me', 'static']);
  frags('fill', ['You fill your pipe.', 'You lean on your staff.', 'You tip your hat back.', 'You stroke your beard.']);

  // --- Greetings: a callback to last time where there is one ------------------------
  lines('greet', [
    { text: ['Good day to you, wizard.', 'Oh! Hello.', 'Well, now. Hello.'] },
    { if: { met: false, stage: 'child' }, text: ['Are you really a wizard? A real one?', 'Can you do magic? Go on. Do some magic.', 'You\'re very tall. Are all wizards tall?'] },
    { if: { met: false, stage: ['grown', 'elder'] }, text: ['Well, bless me. The wizard himself, in our lane.', 'Good morning! ...Or is it? You always say that, I hear.', 'So you\'re the wizard. You\'re taller than they said.'] },
    { if: { met: true, fond: { min: 0.3 } }, text: ['There you are! I hoped you\'d come by.', '{Wiz}! Sit, sit. Have you eaten?', 'Ah, my favorite wizard.'] },
    { if: { met: true, fond: { max: -0.15 } }, text: ['Oh. It\'s you.', 'Yes? What is it?', 'Come to meddle, have you?'] },
    { if: { met: true, joke: (j) => !!j }, pri: 1, text: ['Ah, it\'s you. "{joke}" I still laugh at that.', 'If it isn\'t the wizard. "{joke}"'] },
    { if: { met: true, lastLabel: (x) => !!x, daysSince: { min: 1, max: 4 } }, text: ['Back again! We were talking about {lastLabel}, last time.', 'I\'ve been thinking about what we said. About {lastLabel}.'] },
    { if: { met: true, told: (x) => !!x, trust: { min: 0.3 } }, pri: 1, text: ['You haven\'t told anyone, have you? About... you know.', 'Hello, you. Still keeping my secret?'] },
    { if: { met: true, promiseKept: true }, pri: 2, text: ['You kept your word! I knew you would.', 'There he is. A wizard of his word.'] },
    { if: { met: true, promiseBroken: true }, pri: 2, text: ['Oh. You. I waited, you know.', 'Hmph. You said you would, and you didn\'t.'] },
    { if: { met: true, daysSince: { min: 5 } }, text: ['Well! I thought you\'d forgotten us.', 'Look who it is! Where\'ve you been hiding?'] },
    { if: { weather: 'rain' }, text: ['Mind the puddle. Well, too late.', 'Wet enough for you, wizard?'] },
    { if: { weather: 'snow' }, text: ['You\'ve snow on your hat. A great deal of snow.', 'Brr! Isn\'t it a day?'] },
    { if: { hour: 'morning', met: true }, text: ['Morning! Have you had breakfast? Second breakfast?', 'Early about, aren\'t you?'] },
    { if: { hour: 'evening', met: true }, text: ['Evening, wizard. Lovely light.', 'Out late! There\'s a chill coming.'] },
    { if: { tipsy: true }, pri: 1, text: ['Wizard! My dear, dear wizard. Have you met my friend? It\'s you.', 'Gandalf! Have a drink. Have two!'] },
    { if: { sick: true }, pri: 1, text: ['*sniff* Don\'t come too close. I\'m full of cold.', 'Hello. I\'d smile, but my head hurts.'] },
    // after a scuffle, a prank, or with someone in mind for it (scuffle.js, mischief.js)
    { if: { feeling: 'scuffled', feelingX: (x) => !!x }, pri: 2, text: ['Don\'t look at my eye. {FeelingX} and I had a... difference of opinion.', 'If you\'ve come about me and {feelingX}, I don\'t want to talk about it.'] },
    { if: { feeling: 'tripped' }, pri: 2, text: ['Mind where you put your feet, wizard. Some joker\'s been stringing cords about.', 'Somebody tripped me up, and in front of everyone. My ankle!'] },
    { if: { feeling: 'suspects', feelingX: (x) => !!x }, pri: 2, text: ['Somebody played a nasty trick on me. I know who, too. {FeelingX}.', 'Have you heard what was done to me? I\'d wager {feelingX} put them up to it. Or did it.'] },
    { if: { stage: 'child', met: true }, text: ['Wizard! Wizard! Did you bring anything?', 'It\'s the wizard! Hello hello hello!'] },
    { if: { rift: true, met: true }, text: ['Hey. The wizard. Ping received.', 'Oh, hey. Signal\'s good today.'] },
  ]);
  lines('bye.wiz', [
    { text: ['Good day to you, {name}.', 'I must be off. Take care, now.', 'Well, I\'ll not keep you.'] },
    { if: { fond: { min: 0.3 } }, text: ['Until next time, {name}. Don\'t do anything I wouldn\'t.', 'Mind how you go, {name}.'] },
  ]);
  lines('bye.them', [
    { text: ['Good day.', 'Mind how you go.', 'Bye, then.'] },
    { if: { fond: { min: 0.25 } }, text: ['Come again soon!', 'Don\'t be a stranger!', 'Bye! Come for tea!'] },
    { if: { stage: 'child' }, text: ['Bye bye, wizard!', 'Come back tomorrow! Promise!'] },
    { if: { rift: true }, text: ['Logging off. Bye.', 'Catch you later, wizard.'] },
  ]);
  lines('close.soon', [
    { text: ['I really ought to be getting on.', 'Is that the time?', 'I mustn\'t keep you. Or me.'] },
    { if: { job: (j) => !!j }, text: ['The work won\'t do itself, you know.', 'Work\'s waiting.'] },
    { if: { stage: 'child' }, text: ['Mom\'ll be calling me in a minute.', 'I\'m meant to be somewhere. I forget where.'] },
    { if: { hungry: true }, pri: 1, text: ['My stomach\'s rumbling. Sorry. It does that.'] },
  ]);
  lines('close.patience', [
    { text: ['Well! I must be off. Lovely talking.', 'I\'d best get on. Good day, wizard!', 'Right. I\'ve things to do. Good day!'] },
    { if: { temper: 'ornery' }, text: ['That\'s enough talking for one day.', 'I\'ve work to do, even if wizards haven\'t.'] },
    { if: { temper: 'shy' }, text: ['I... I should go. Thank you. Bye.'] },
    { if: { stage: 'child' }, text: ['I have to go! Bye!', 'Somebody\'s calling me! Bye!'] },
  ]);

  // --- How a remark lands, when it lands strongly -----------------------------------
  lines('mix.good', [{ text: ['Ha!', 'Oh, that\'s nice.', 'You\'re a kind one.'] }, { if: { temper: 'shy' }, text: ['...Thank you.'] }, { if: { stage: 'child' }, text: ['Hee!'] }]);
  lines('mix.bad', [{ text: ['Hmph.', 'Well, really.', '...If you say so.'] }, { if: { temper: 'ornery' }, text: ['Don\'t you start.', 'Is that meant to be funny?'] }, { if: { temper: 'proud' }, text: ['I\'ll have you know I\'m very well thought of.'] }, { if: { temper: 'shy' }, text: ['Oh. Um.'] }]);
  lines('mix.jest.good', [{ text: ['Ha! You\'ll keep.', 'Oh, very good.'] }, { if: { temper: 'witty' }, text: ['Ha! I\'ll get you back for that.', 'Oh, that\'s good. I\'m stealing that.'] }, { if: { stage: 'child' }, text: ['Ahahaha! Say it again!'] }]);
  lines('mix.jest.bad', [{ text: ['I don\'t see what\'s funny.'] }, { if: { temper: 'ornery' }, text: ['Laugh at your own jokes, do you?'] }, { if: { temper: 'gloomy' }, text: ['Mm. Funny.'] }]);
  lines('mix.listen.good', [{ text: ['...You\'re a good listener, you know.', 'Nobody ever just lets me talk.'] }]);
  lines('mix.advise.bad', [{ text: ['I didn\'t ask for advice.', 'Thank you, wizard. I\'m a grown hobbit.'] }]);
  lines('mix.comfort.good', [{ text: ['...Thank you. I needed that.'] }]);
  lines('mix.comfort.bad', [{ text: ['Don\'t fuss.', 'I\'m not a child.'] }]);
  lines('mix.share.good', [{ text: ['Really? You? Well, I never.', 'I never thought of wizards having troubles.'] }]);

  // --- How are you keeping? ----------------------------------------------------------
  addThread({
    id: 'how', label: 'How are you keeping?', weight: 1.3, cool: 1, open: { warm: 'How are you keeping, {name}?' },
    beats: {
      start: { line: 'how.start', go: [
        { ap: 'ask', say: 'Why\'s that, then?', to: 'why', need: { if: { mood: ['low', 'miserable'] } } },
        { ap: 'ask', say: 'Oh? What\'s put the spring in your step?', to: 'good', need: { if: { mood: 'merry' } } },
        { ap: 'ask', say: 'And truly? Not just "mustn\'t grumble"?', to: 'truly', need: { if: { mood: 'fair' } } },
        { ap: 'jest', say: 'You look like a hobbit who\'s had at least four breakfasts.', to: 'tease' },
        { ap: 'listen', say: '*You wait.*', label: 'Wait for more', to: 'more' },
      ] },
      why: { line: 'how.why', fx: { learn: ['trouble', '{feelingText}'] }, go: [
        { ap: 'comfort', say: 'That\'s hard. I\'m sorry, {name}.', to: 'comforted' },
        { ap: 'advise', say: 'Have you told anyone? It helps, telling.', to: 'advised' },
        { ap: 'share', say: 'I know a little of that, myself.', to: 'shared' },
      ] },
      good: { line: 'how.good', go: [{ ap: 'warm', say: 'Then I\'m glad for you.', to: 'end' }, { ap: 'jest', say: 'Bottle some of it for me, would you?', to: 'end' }] },
      truly: { line: 'how.truly', go: [{ ap: 'listen', say: '*You nod, and let them go on.*', label: 'Let them go on', to: 'more' }, { ap: 'warm', say: 'Well, if you ever want to grumble, I\'m a fine grumbling post.', to: 'end' }] },
      tease: { line: 'how.tease', go: [{ ap: 'jest', say: 'Only four? I\'m disappointed in you.', to: 'end' }, { ap: 'warm', say: 'Good. Keep your strength up.', to: 'end' }] },
      more: { line: 'how.more', go: [{ ap: 'warm', say: 'Thank you for telling me.', to: 'end' }, { ap: 'ask', say: 'And what would set it right?', to: 'set' }] },
      set: { line: 'how.set', fx: { learn: ['wish', '{wishText}'] }, end: true },
      comforted: { line: 'how.comforted', fx: { trust: 0.03, fond: 0.02, drive: { lonely: -0.1 } }, end: true },
      advised: { line: 'how.advised', fx: { respect: 0.02 }, end: true },
      shared: { line: 'how.shared', fx: { trust: 0.04 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('how.start', [
    { text: ['Fair enough. Mustn\'t grumble.', 'Not bad at all, thank you.', 'Oh, getting along.'] },
    { if: { mood: 'merry' }, text: ['Never better!', 'Grand, thank you. Just grand.', 'Champion! Couldn\'t be happier.'] },
    { if: { mood: 'low' }, text: ['Oh, middling. You know.', 'Could be better. Could be worse.', 'I\'ve had better weeks.'] },
    { if: { mood: 'miserable' }, text: ['Truth be told? Not good.', 'Don\'t ask.', 'Rotten, if I\'m honest.'] },
    { if: { sick: true }, pri: 2, text: ['Full of cold. *sneeze* Sorry.', 'Under the weather. Literally, it feels like.'] },
    { if: { hungry: true }, pri: 1, text: ['Hungry! Is it nearly time for something?'] },
    { if: { tired: true }, pri: 1, text: ['Tired. Dead on my feet.', 'I could sleep for a week.'] },
    { if: { stage: 'child', mood: 'merry' }, text: ['GOOD! I found a frog!', 'Brilliant! It\'s nearly pudding!'] },
    { if: { stage: 'child', mood: ['low', 'miserable'] }, text: ['Nobody will play with me.', 'I got told off.'] },
    { if: { rift: true }, text: ['Battery\'s at about sixty percent. Emotionally.', 'Signal\'s okay. Bit patchy.'] },
  ]);
  lines('how.why', [
    { text: ['Oh, this and that. Mostly that.', 'It\'s nothing. ...It\'s not nothing.'] },
    { if: { feeling: (k) => !!k }, text: ['{FeelingText}, if you must know.', 'It\'s just... {feelingText}. That\'s all.'] },
    { if: { memory: (m) => !!m, memoryGood: false }, pri: 1, text: ['Something happened. "{memory}" I keep going over it.'] },
    { if: { lonely: true }, pri: 1, text: ['I\'ve not had a proper talk with anyone in days.', 'Everyone\'s busy. I\'m always on my own.'] },
    { if: { homeless: true }, pri: 2, text: ['I\'ve nowhere to sleep. The hedge is very... prickly.'] },
  ]);
  lines('how.good', [
    { text: ['Oh, everything! The sun, the tea, the lot.', 'I don\'t know. I just woke up happy.'] },
    { if: { feeling: (k) => !!k }, text: ['{FeelingText}. Isn\'t that grand?'] },
    { if: { party: true }, text: ['There\'s a party! Didn\'t you know?'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse} made me breakfast in bed. Crumbs everywhere. Lovely.'] },
  ]);
  lines('how.truly', [{ text: ['Well... a bit weary, maybe. The days run together.', 'Truly? I\'m all right. A bit restless.'] }, { if: { bored: true }, text: ['Bored, if I\'m honest. Same lane, same faces.'] }, { if: { lonely: true }, text: ['A bit lonely, I suppose. Don\'t tell anyone.'] }]);
  lines('how.tease', [{ text: ['Four? Five. Don\'t tell.', 'I resent that. It was three and a half.'] }, { if: { temper: 'ornery' }, text: ['I\'ll eat as many breakfasts as I please.'] }, { if: { stage: 'child' }, text: ['I had SIX. Mom doesn\'t know about two of them.'] }]);
  lines('how.more', [{ text: ['...It\'s just nice to be asked, that\'s all.', 'You\'re a patient one. Most people don\'t wait.'] }, { if: { temper: 'shy' }, text: ['...Nobody usually waits for the rest.'] }]);
  lines('how.set', [{ text: ['Honestly? {WishText}. Daft, isn\'t it?', 'If I\'m honest... {wishText}.'] }, { text: ['I don\'t know. Something to look forward to.'] }]);
  lines('how.comforted', [{ text: ['...Thank you. That helps, a bit.', 'You\'re kind. Kinder than a wizard needs to be.'] }, { if: { temper: 'ornery' }, text: ['Yes, well. Hmph. ...Thank you.'] }]);
  lines('how.advised', [{ text: ['Maybe. Maybe I will.', 'Perhaps you\'re right.'] }, { if: { temper: ['proud', 'ornery'] }, text: ['I can manage, thank you.'] }]);
  lines('how.shared', [{ text: ['You? Really? Well. That makes me feel less daft.', 'I never think of wizards being sad.'] }]);

  // --- What's on your mind? (their wish, or their dream) ------------------------------
  addThread({
    id: 'mind', topic: 'what I was wishing for', label: 'What\'s on your mind?', weight: 1.2, cool: 2, reveals: 'wish', open: { ask: 'What\'s on your mind, {name}?' },
    rel: (F) => (F.wish ? 1.5 : F.dream ? 1.2 : 0.6),
    beats: {
      start: { line: 'mind.start', fx: { learn: ['wish', '{wishText}'] }, go: [
        { ap: 'ask', say: 'Why that, especially?', to: 'why' },
        { ap: 'warm', say: 'I\'ll see what I can do.', to: 'promise', need: { if: { wish: (w) => !!w } } },
        { ap: 'jest', say: 'Is that all? I was hoping for dragons.', to: 'tease' },
        { ap: 'ask', say: 'And one day? What would you really like?', to: 'dream', need: { open: 1 } },
      ] },
      why: { line: 'mind.why', go: [{ ap: 'warm', say: 'Then I hope you get it.', to: 'end' }, { ap: 'ask', say: 'And one day? Not just today?', to: 'dream' }] },
      promise: { line: 'mind.promise', fx: { promise: { k: 'wish', t: 'You said you\'d see about {wishText}', days: 3 }, fond: 0.02 }, end: true },
      tease: { line: 'mind.tease', go: [{ ap: 'ask', say: 'Fair. And one day, then?', to: 'dream' }, { ap: 'warm', say: 'Small things are the best things.', to: 'end' }] },
      dream: { line: 'mind.dream', fx: { learn: ['dream', '{dreamText}'] }, go: [
        { ap: 'warm', say: 'I think you will.', to: 'end' }, { ap: 'advise', say: 'Then start tomorrow. Dreams don\'t like waiting.', to: 'advised' },
        { ap: 'share', say: 'I had a dream like that, once. Long ago.', to: 'shared', need: { open: 2 } },
      ] },
      advised: { line: 'mind.advised', fx: { respect: 0.03 }, end: true },
      shared: { line: 'mind.shared', fx: { trust: 0.04, joke: { k: 'wizdream', t: 'The wizard wanted to be a baker once.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('mind.start', [
    { text: ['Oh, nothing much. Supper.', 'This and that. Mostly supper.'] },
    { if: { wish: 'fav_food' }, text: ['I\'ve been dreaming of {wishText}, if you must know.'] },
    { if: { wish: (w) => !!w }, text: ['If I\'m honest? {WishText}.', 'I keep thinking about {wishText}.', 'Funny you should ask. {WishText}.'] },
    { if: { wish: 'cake' }, text: ['Seed-cake. A slice of seed-cake. I can smell it in my sleep.'] },
    { if: { wish: 'pint' }, text: ['A pint at the Badger. Just the one. Possibly two.'] },
    { if: { wish: 'fireworks' }, text: ['FIREWORKS. You\'ve got some, haven\'t you. You have.'] },
    { if: { wish: 'party' }, text: ['A good knees-up. It\'s been too long since we danced.'] },
    { if: { wish: 'book' }, text: ['A new book. I\'ve read every one in the house twice.'] },
    { if: { stage: 'child', wish: (w) => !!w }, text: ['{WishText}! Can you magic it? Can you?'] },
  ]);
  lines('mind.why', [{ text: ['I don\'t know. It\'s just stuck in my head.', 'Because it\'s been a long week, that\'s why.'] }, { if: { temper: 'dreamy' }, text: ['Because some things just feel like they ought to happen.'] }, { if: { temper: 'ornery' }, text: ['Does there have to be a reason?'] }]);
  lines('mind.promise', [{ text: ['Would you? Oh, you\'re a dear.', 'I\'ll hold you to that, wizard.'] }, { if: { temper: 'ornery' }, text: ['Hmph. We\'ll see.'] }, { if: { stage: 'child' }, text: ['PROMISE? Pinkie promise?'] }]);
  lines('mind.tease', [{ text: ['Dragons! I\'ve enough trouble with the hens.', 'Ha! Bring me one and we\'ll talk.'] }, { if: { stage: 'child' }, text: ['Can I have a dragon? A small one?'] }]);
  lines('mind.dream', [
    { text: ['One day? Oh, I don\'t know. Something of my own.'] },
    { if: { dream: (d) => !!d }, text: ['One day I\'d like to {dreamText}. There. I said it.', 'Don\'t laugh. I\'d like to {dreamText}.'] },
    { if: { dream: (d) => !!d, temper: 'shy' }, text: ['...I\'d like to {dreamText}. Don\'t tell.'] },
    { if: { dream: (d) => !!d, temper: 'proud' }, text: ['I mean to {dreamText}. And I shall.'] },
  ]);
  lines('mind.advised', [{ text: ['Tomorrow. Yes. ...Maybe the day after.', 'You\'re right. You\'re annoyingly right.'] }]);
  lines('mind.shared', [{ text: ['You? What was it?', '...And did it come true?'] }, { text: ['A baker? You? Ha! I can see it. The hat would get floury.'] }]);

  // --- Heard any news? ---------------------------------------------------------------
  // news they'd pass on: fresh, not yet told you, and not about themselves or you
  const tellable = (v, n) => knowsNews(v, n) && !(Game.wizKnows || []).includes(n.id) && Game.day - n.day <= 6 && !n.text.includes(v.first) && !/Gandalf|the wizard|^Growing up and growing old/.test(n.text);
  addThread({
    id: 'news', topic: 'the news', label: 'Heard any news?', weight: 0.9, cool: 1,
    rel: (F, T) => (newsList().some((n) => tellable(T.v, n)) ? 1.6 : 0.4),
    open: { ask: 'Heard any news, {name}?' },
    beats: {
      start: { line: 'news.start', fx: { run: (T) => { const known = Game.wizKnows || (Game.wizKnows = []); const n = newsList().find((x) => tellable(T.v, x)); T.newsText = T.F.newsText = n ? n.text.replace(/[.!]+$/, '') : null; if (n) known.push(n.id); } }, go: [
        { ap: 'ask', say: 'And what do you make of that?', to: 'opinion', need: { when: (F, T) => !!T.newsText } },
        { ap: 'jest', say: 'Scandalous. Tell me more.', to: 'more', need: { when: (F, T) => !!T.newsText } },
        { ap: 'ask', say: 'Who would know more?', to: 'who' },
      ] },
      opinion: { line: 'news.opinion', end: true },
      more: { line: 'news.more', end: true },
      who: { line: 'news.who', end: true },
    },
  });
  // the news line itself is said from the beat's run: a small rule set keyed on newsText
  lines('news.start', [{ text: ['Nothing you won\'t have heard.', 'Quiet as a mouse this week.'] }, { if: { newsText: (n) => !!n }, text: ['Did you hear? {NewsText}!', 'Well! {NewsText}.', 'You\'ll never guess. {NewsText}.'] }]);
  lines('news.opinion', [{ text: ['Good luck to them, I say.', 'About time, if you ask me.', 'Not my business. ...But I have opinions.'] }, { if: { temper: 'ornery' }, text: ['Nonsense, the lot of it.'] }, { if: { temper: 'cheerful' }, text: ['Isn\'t it lovely? I love a bit of news.'] }]);
  lines('news.more', [{ text: ['That\'s all I know! Ask at the Badger.', 'I\'ve told you everything. Nearly.'] }, { if: { temper: 'witty' }, text: ['I could make some more up, if you like.'] }]);
  lines('news.who', [{ text: ['The innkeeper hears everything. Everything.', 'Ask the mail carrier. She reads the backs of letters.'] }]);

  // --- Their evenings (the thread from the research report) ---------------------------
  addThread({
    id: 'evenings', topic: 'my evenings', label: 'What do you do of an evening?', about: 'pastime', reveals: 'hobby', weight: 1.1, cool: 4,
    when: (F) => F.stage !== 'child' || F.band === 'youth',
    open: { ask: 'What do you do of an evening, {name}, when nobody\'s looking?' },
    beats: {
      start: { line: 'evenings.start', go: [
        { ap: 'warm', say: 'All evening, if there\'s a pot of tea in it.', to: 'tell' },
        { ap: 'jest', say: 'I\'m a wizard, {name}. I have centuries. Mostly.', to: 'tell' },
        { ap: 'ask', say: 'Long enough. Out with it.', to: 'tell' },
      ] },
      tell: { line: 'evenings.tell', notice: 'evenings.notice', fx: { learn: ['hobby', '{pastimeWord}'] }, go: [
        { ap: 'ask', say: 'Why {madeMany}?', to: 'why', need: { if: { madeMany: (m) => !!m, made: { min: 1 } } } },
        { ap: 'jest', say: 'evenings.tease', label: 'Tease them about it', to: 'teased' },
        { ap: 'warm', say: 'And who are they all for?', to: 'secret', need: { open: 2, if: { made: { min: 3 } } }, soft: true },
        { ap: 'share', say: 'I whittle too, you know. Mostly walking sticks. Mostly badly.', to: 'swap' },
      ] },
      why: { line: 'evenings.why', go: [{ ap: 'warm', say: 'I\'d love to see one, one day.', to: 'show' }, { ap: 'ask', say: 'And who taught you?', to: 'taught' }] },
      teased: { line: 'evenings.teased', go: [{ ap: 'warm', say: 'I mean it kindly. I\'d love to see one.', to: 'show' }, { ap: 'jest', say: 'A heron that looks like a badger is still a heron. Ask any badger.', to: 'end' }] },
      secret: { line: 'evenings.secret', fx: { confide: { k: 'evenings.project', t: '{Name} is making {madeMany} for everyone on the lane, for Yule', secret: true } }, go: [
        { ap: 'jest', say: 'Am I in it?', to: 'bishop' }, { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'safe' },
      ] },
      bishop: { line: 'evenings.bishop', fx: { joke: { k: 'bishop', t: 'You\'re the bishop. It\'s the hat.' }, fond: 0.02 }, go: [{ ap: 'warm', say: 'I\'m honored. Truly.', to: 'end' }, { ap: 'jest', say: 'Bishops move diagonally, you know. Very wizardly.', to: 'end' }] },
      safe: { line: 'evenings.safe', fx: { trust: 0.05, promise: { k: 'secret.evenings', t: 'You promised to keep the Yule secret', days: 30 } }, end: true },
      show: { line: 'evenings.show', end: true },
      taught: { line: 'evenings.taught', end: true },
      swap: { line: 'evenings.swap', fx: { trust: 0.02 }, go: [{ ap: 'jest', say: 'The trick is to call it a staff before anyone asks.', to: 'end' }, { ap: 'warm', say: 'Perhaps you could show me how. Some evening.', to: 'end', fx: { fond: 0.02 } }] },
    },
    end: { fond: 0.03, trust: 0.02 },
  });
  lines('evenings.start', [{ text: ['How long have you got?', 'Ooh. Now there\'s a question.'] }, { if: { temper: 'shy' }, text: ['...Nothing much. Really.'] }, { if: { temper: 'ornery' }, text: ['Why? Who\'s asking? Oh, it\'s you.'] }]);
  lines('evenings.tell', [
    { text: ['Oh, this and that. Sit by the fire. Count the spoons.', 'A cup of tea and an early night. I\'m wild, me.'] },
    { if: { pastime: (p) => !!p }, text: ['{PastimeWord}, mostly. I\'m only just starting.', 'I\'ve taken up {pastimeWord}. Early days.'] },
    { if: { pastime: (p) => !!p, made: { min: 2 } }, text: ['{PastimeWord}, mostly. I\'ve made {made} {madeMany} so far.', 'I do a bit of {pastimeWord}. {Made} {madeMany}, and counting.'] },
    { if: { pastime: 'carving', made: { min: 2 } }, text: ['I whittle. {Made} {madeMany} so far, and a heron that came out a badger.'] },
    { if: { pastime: 'carving', temper: 'proud' }, text: ['I carve. Rather well, if I\'m honest. Ask anyone on the lane.'] },
    { if: { pastime: 'carving', temper: 'shy' }, text: ['...I carve little animals. They\'re not very good.'] },
    { if: { pastime: 'knitting' }, text: ['Knitting. Everyone on the lane is getting a scarf, whether they like it or not.'] },
    { if: { pastime: 'knitting', season: 'winter', made: { min: 2 } }, text: ['Knitting, by the fire. I\'ve done {made}. Nobody\'s cold on my watch.'] },
    { if: { pastime: 'birdwatching' }, text: ['I watch the birds settle. The heron\'s my favorite.'] },
    { if: { pastime: 'painting' }, text: ['I paint. Badly, but with feeling.'] },
    { if: { pastime: 'pottery' }, text: ['I throw pots. Mostly at the wheel. Sometimes across the room.'] },
    { if: { pastime: 'basketry' }, text: ['Baskets! I weave baskets. We have a great many baskets.'] },
    { if: { pastime: 'collecting' }, text: ['I collect. Stones, feathers, whatever catches my eye.'] },
    { if: { pastime: 'collecting', spouse: (x) => !!x }, text: ['I collect things. Don\'t ask {spouse} about the shelf.'] },
    { if: { rift: true }, text: ['Back home there was no evening. Here I watch the sky go dark. Every time. It\'s wild.'] },
  ]);
  lines('evenings.notice', [{ if: { pastime: 'carving' }, text: ['There\'s sawdust in their cuffs, and a sticking plaster on one thumb.'] }, { if: { pastime: 'knitting' }, text: ['A strand of wool is caught on their button.'] }, { if: { pastime: 'painting' }, text: ['There\'s a smudge of blue on their ear.'] }, { if: { pastime: 'pottery' }, text: ['Clay under every fingernail.'] }, { text: ['They\'re smiling, now. Just a little.'] }]);
  lines('evenings.tease', [{ text: ['I\'ll bet half of them have your face on.', 'A {madeOne} that looks like you, I\'ll wager.'] }, { if: { madeOne: (m) => !m }, text: ['A wild life, then.'] }]);
  lines('evenings.why', [{ text: ['I don\'t know. My hands like to be busy.', 'My grandmother did. Her grandmother did. It\'s in the fingers.'] }, { if: { temper: 'dreamy' }, text: ['Because when I\'m making something the day goes quiet.'] }, { if: { pastime: 'carving' }, text: ['Badgers have good faces. Honest faces. Herons are harder.'] }]);
  lines('evenings.teased', [{ text: ['Cheek! ...Only some of them.', 'Ha! You\'ll be next.'] }, { if: { temper: 'ornery' }, text: ['Laugh all you like. You couldn\'t do better.'] }]);
  lines('evenings.secret', [{ text: ['...Don\'t laugh. I\'m making one for everyone on the lane. For Yule. I\'ve done eleven.'] }, { if: { temper: 'shy' }, text: ['...Can you keep a secret? I\'m making one for everyone. For Yule. Don\'t tell.'] }]);
  lines('evenings.bishop', [{ text: ['You\'re the bishop. Don\'t ask me why. It\'s the hat.'] }]);
  lines('evenings.safe', [{ text: ['Thank you. And if you see anyone, don\'t say a word.', 'I knew I could tell you.'] }]);
  lines('evenings.show', [{ text: ['Maybe. If you\'re good.', 'Come by some evening. Bring cookies.'] }]);
  lines('evenings.taught', [{ text: ['Nobody. I taught myself, badly, and then less badly.', 'My {parent}. Patient as stone.'] }]);
  lines('evenings.swap', [{ text: ['Walking sticks! That\'s cheating, that is. It\'s just a stick.', 'Ha! I\'ve seen your staff. I wondered.'] }]);

  // --- Passing the time: light threads, each opened with an approach -------------------
  addThread({
    id: 'pass.warm', light: true, ap: 'warm', label: 'Pass the time warmly', open: { warm: 'pass.warm.open' },
    beats: {
      start: { line: 'pass.warm.reply', go: [
        { ap: 'ask', say: 'And how\'s {spouse}?', to: 'spouse', need: { if: { spouse: (s) => !!s } } },
        { ap: 'ask', say: 'And the little ones?', to: 'kids', need: { if: { kid: (k) => !!k } } },
        { ap: 'warm', say: 'I mean it. The valley\'s brighter for you.', to: 'blush' },
        { ap: 'ask', say: 'What\'s been the best of your week?', to: 'best' },
      ] },
      spouse: { line: 'pass.spouse', go: [{ ap: 'warm', say: 'Give {spouse} my best.', to: 'end' }, { ap: 'jest', say: 'Still putting up with you, then?', to: 'end' }] },
      kids: { line: 'pass.kids', go: [{ ap: 'warm', say: 'They\'re a credit to you.', to: 'end' }, { ap: 'jest', say: 'I\'ll teach them a trick or two. The noisy kind.', to: 'end' }] },
      blush: { line: 'pass.blush', end: true },
      best: { line: 'pass.best', go: [{ ap: 'warm', say: 'Then it was a good week.', to: 'end' }, { ap: 'ask', say: 'And the worst?', to: 'worst', need: { open: 1 } }] },
      worst: { line: 'pass.worst', go: [{ ap: 'comfort', say: 'Next week will be kinder.', to: 'end' }, { ap: 'jest', say: 'Then it can only get better. Or more interesting.', to: 'end' }] },
    },
    end: { fond: 0.02 },
  });
  lines('pass.warm.open', [{ text: ['You\'re looking well, {name}. The valley agrees with you.', 'It does my old heart good to see you, {name}.', 'I thought of this place often on the road. And of you, {name}.'] }]);
  lines('pass.warm.reply', [{ text: ['Oh, get away with you.', 'That\'s kind. I\'ve been well, mostly.'] }, { if: { temper: 'gloomy' }, text: ['Do you mean that? ...That\'s cheered me up, that has.'] }, { if: { temper: 'ornery' }, text: ['Hm. Well. Thank you, I suppose.'] }, { if: { temper: 'proud' }, text: ['I do keep myself well, it\'s true.'] }, { if: { stage: 'child' }, text: ['Hee! You\'re nice.'] }]);
  lines('pass.spouse', [{ text: ['{Spouse}? Oh, the same as ever. Snores like a bellows.', '{Spouse}\'s grand. Busy. Always busy.'] }, { if: { temper: 'dreamy' }, text: ['{Spouse}... is still the best thing that ever happened to me. Don\'t tell.'] }]);
  lines('pass.kids', [{ text: ['{Kid}\'s growing like a weed. Eats like a horse.', 'Noisy. Muddy. Lovely. Mostly noisy.'] }, { if: { kidCount: { min: 3 } }, text: ['All {kidCount}? Exhausting. I wouldn\'t change a thing. Except the noise.'] }]);
  lines('pass.blush', [{ text: ['Stop it. ...Don\'t stop it.', 'You\'ll make me blush, wizard.'] }, { if: { temper: 'shy' }, text: ['*goes very pink*'] }]);
  lines('pass.best', [{ text: ['The best? Oh... a really good loaf on Trewsday.', 'Sitting in the sun with nothing to do. Bliss.'] }, { if: { feeling: (f) => !!f, mood: 'merry' }, text: ['{FeelingText}. That was the best.'] }, { if: { pastime: (p) => !!p }, text: ['I finished a {madeOne}. I\'m rather proud of it.'] }]);
  lines('pass.worst', [{ text: ['Stubbed my toe on the same step. Three times.', 'The rain got in the larder. Don\'t ask.'] }, { if: { memory: (m) => !!m, memoryGood: false }, text: ['"{Memory}" That was the worst.'] }]);

  addThread({
    id: 'pass.jest', light: true, ap: 'jest', label: 'Pass the time with a jest', open: { jest: 'pass.jest.open' },
    beats: {
      start: { line: 'pass.jest.reply', go: [
        { ap: 'jest', say: 'pass.jest.again', label: 'Keep it going', to: 'again' },
        { ap: 'warm', say: 'Ha! I\'ve missed this.', to: 'end' },
        { ap: 'ask', say: 'Go on, tell me a joke of yours.', to: 'theirs' },
      ] },
      again: { line: 'pass.jest.back', go: [{ ap: 'jest', say: 'Touché. I yield.', to: 'end', fx: { joke: { k: 'touche', t: '"Touché." The wizard yielded.' } } }, { ap: 'warm', say: 'You win. You always win.', to: 'end' }] },
      theirs: { line: 'pass.jest.theirs', go: [{ ap: 'jest', say: '*laughs* That\'s terrible. Tell me another.', to: 'end' }, { ap: 'warm', say: 'I\'ll be telling that one in Bree.', to: 'end', fx: { fond: 0.02 } }] },
    },
    end: { fond: 0.015 },
  });
  lines('pass.jest.open', [{ text: ['Still keeping out of trouble, {name}? A pity.', 'If you\'ve eaten fewer than six meals today, {name}, I shall be most concerned.', 'I\'ve met dragons with better manners than your rooster, {name}.'] }]);
  lines('pass.jest.reply', [{ text: ['Ha! You haven\'t changed a bit.', 'Ha! You\'ll keep.'] }, { if: { temper: 'witty' }, text: ['Ha! I\'ll get you back for that.', 'Oh, very good. Very good indeed.'] }, { if: { temper: 'ornery' }, text: ['I don\'t see what\'s funny.', 'Laugh at your own jokes, do you?'] }, { if: { temper: 'shy' }, text: ['Oh. Ha. Yes.'] }, { if: { stage: 'child' }, text: ['Ahahaha! Say it again!'] }]);
  lines('pass.jest.again', [{ text: ['And another thing: your hat\'s on backwards.', 'What do you call a hobbit with no pudding? Unwell.'] }]);
  lines('pass.jest.back', [{ text: ['My hat? Look at YOUR hat.', 'Unwell! Ha! That\'s true, though.'] }, { if: { temper: 'witty' }, text: ['Coming from a man whose hat has its own weather.'] }]);
  lines('pass.jest.theirs', [{ text: ['Why did the hobbit cross the road? Second breakfast was on the other side.', 'What\'s the difference between a troll and a turnip? Turnips are better company.'] }, { if: { stage: 'child' }, text: ['What do you call a dragon with no fire? A lizard! HAHAHA.'] }]);

  addThread({
    id: 'pass.ask', light: true, ap: 'ask', label: 'Pass the time with a question', open: { ask: 'pass.ask.open' },
    beats: {
      start: { line: 'pass.ask.reply', go: [
        { ap: 'ask', say: 'Go on, then. I\'ve all day.', to: 'go' },
        { ap: 'listen', say: '*You settle on the wall to listen.*', label: 'Settle in to listen', to: 'go' },
        { ap: 'jest', say: 'The short version, please. I\'m only immortal on weekdays.', to: 'short' },
      ] },
      go: { line: 'pass.ask.go', fx: { learn: ['likes', '{like}'] }, go: [{ ap: 'ask', say: 'And what can\'t you abide?', to: 'dislike', need: { if: { dislike: (d) => !!d } } }, { ap: 'warm', say: 'I can see why.', to: 'end' }] },
      dislike: { line: 'pass.ask.dislike', fx: { learn: ['dislikes', '{dislike}'] }, end: true },
      short: { line: 'pass.ask.short', end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  lines('pass.ask.open', [{ text: ['What do you love best about Thistledown, {name}?', 'Tell me, {name}: what makes a good day for you?'] }, { if: { stage: 'child' }, text: ['What\'s the best game you know, {name}?', 'What do you want to be when you\'re grown, {name}?'] }]);
  lines('pass.ask.reply', [{ text: ['Oh, where do I start!', 'Now there\'s a question.'] }, { if: { temper: 'curious' }, text: ['Oh, I could talk about that all day! Have you got all day?'] }, { if: { temper: 'proud' }, text: ['Ah! Well. Since you ask.'] }, { if: { temper: 'shy' }, text: ['You... want to know? Well...'] }]);
  lines('pass.ask.go', [{ text: ['{Like}. Give me {like} and I\'m happy.', 'Honestly? {Like}. Nothing better.'] }, { if: { like: 'the rain' }, text: ['The rain. Everyone hates it but me. The sound on the window!'] }, { if: { like: 'peace and quiet' }, text: ['Peace and quiet. Which is why I\'m talking to you, obviously.'] }, { if: { stage: 'child' }, text: ['{Like}! And jumping in puddles. And pudding.'] }]);
  lines('pass.ask.dislike', [{ text: ['{Dislike}. Can\'t abide it. Never could.', 'Don\'t get me started on {dislike}.'] }]);
  lines('pass.ask.short', [{ text: ['Pudding. That\'s the short version.', 'Sun, tea, nobody wanting anything. There.'] }]);

  // --- Their turn: they ask the wizard ---------------------------------------------
  addThread({
    id: 'ask.road', theirs: true, label: 'They ask where you\'ve been', cool: 3, ask: '{Name} has a question for you.',
    when: (F) => F.met && F.talks >= 1,
    beats: {
      start: { line: 'ask.road.q', go: [
        { ap: 'tale', say: 'Over the hills, and into a little trouble with some trolls.', to: 'trolls' },
        { ap: 'jest', say: 'Here and there. Mostly there.', to: 'there' },
        { ap: 'share', say: 'Somewhere lonely. It\'s good to be back.', to: 'lonely', need: { open: 1 } },
      ] },
      trolls: { line: 'ask.road.trolls', fx: { fond: 0.02 }, end: true },
      there: { line: 'ask.road.there', end: true },
      lonely: { line: 'ask.road.lonely', fx: { trust: 0.03, fond: 0.02 }, end: true },
    },
  });
  lines('ask.road.q', [{ text: ['Where do you go, when you\'re not here?', 'What\'s it like, out past the hills?'] }, { if: { stage: 'child' }, text: ['Have you ever fought a dragon? Have you? HAVE you?'] }, { if: { rift: true }, text: ['Do you ever go somewhere... else? Like, really else?'] }]);
  lines('ask.road.trolls', [{ text: ['Trolls! What did you do?', 'You never did! Tell me everything!'] }, { if: { stage: 'child' }, text: ['TROLLS?! Did you turn them to stone? DID you?'] }]);
  lines('ask.road.there', [{ text: ['Ha! You\'re a slippery one.', 'That\'s not an answer, that\'s a hat.'] }]);
  lines('ask.road.lonely', [{ text: ['...Well, you\'re welcome here. Always.', 'Then stay a while. We\'ll keep you.'] }]);

  // --- Reading the mood: someone cross ---------------------------------------------
  addSituation('cross', {
    pri: 3, read: (F) => F.feeling === 'quarrel' || (F.temper === 'ornery' && F.mood === 'miserable'), thread: 'sit.cross',
    aps: {
      listen: { base: 1, out: ['stony', 'vents', 'softens'] },
      ask: { base: 1, out: ['business', 'vents', 'doubt'] },
      jest: { base: 0, out: ['bristles', 'grudging', 'laughs'] },
      advise: { base: 0, out: ['bristles', 'think', 'goes'], after: 'vented' },
      comfort: { base: 0, out: ['fuss', 'pat', 'thanks'] },
    },
  });
  lines('sit.cross.listen', [{ text: ['*You wait, and fill your pipe.*'] }]);
  lines('sit.cross.ask', [{ text: ['What\'s happened, {name}?'] }]);
  lines('sit.cross.jest', [{ text: ['You look like a wet cat in a bonnet, {name}.'] }]);
  lines('sit.cross.advise', [{ text: ['Life\'s too short, {name}.'] }]);
  lines('sit.cross.comfort', [{ text: ['Come here. It\'ll pass.'] }]);
  addThread({
    id: 'sit.cross', situation: true, label: 'Something\'s got their goat',
    beats: {
      stony: { line: 'cross.stony', end: true },
      vents: { line: 'cross.vents', fx: { flag: 'vented', open: 1 }, go: [
        { ap: 'ask', say: 'And were they right? Even a little?', to: 'doubt' },
        { ap: 'advise', say: 'Go and make it up. Take them something.', to: 'goes', need: { flag: 'vented' } },
        { ap: 'jest', say: 'Shall I turn them into a toad? I\'m a bit rusty.', to: 'laughs' },
      ] },
      softens: { line: 'cross.softens', fx: { trust: 0.04, open: 2 }, end: true },
      business: { line: 'cross.business', fx: { sore: { days: 1 } }, end: true },
      doubt: { line: 'cross.doubt', fx: { respect: 0.02 }, go: [{ ap: 'advise', say: 'Then go and say so. It\'ll cost you less than you think.', to: 'goes' }, { ap: 'warm', say: 'Being a bit wrong is very hobbit-like. Very forgivable.', to: 'end' }] },
      bristles: { line: 'cross.bristles', fx: { fond: -0.03, sore: { days: 1 } }, end: true },
      grudging: { line: 'cross.grudging', end: true },
      laughs: { line: 'cross.laughs', fx: { fond: 0.03, joke: { k: 'toad', t: 'The wizard offered to turn someone into a toad.' } }, end: true },
      think: { line: 'cross.think', fx: { respect: 0.01 }, end: true },
      goes: { line: 'cross.goes', fx: { respect: 0.05, run: (T, v) => { unfeel(v, 'quarrel'); v.drives.lonely = Math.max(0, v.drives.lonely - 0.2); } }, end: true },
      fuss: { line: 'cross.fuss', end: true },
      pat: { line: 'cross.pat', fx: { fond: 0.02 }, end: true },
      thanks: { line: 'cross.thanks', fx: { trust: 0.04, fond: 0.03 }, end: true },
    },
  });
  lines('cross.stony', [{ text: ['...', '*says nothing at all*'] }]);
  lines('cross.vents', [{ text: ['Words were had. Unkind words. And I wasn\'t the one who started it.', 'Some folk just don\'t know when to stop talking. That\'s all.'] }, { if: { rival: (r) => !!r }, text: ['{Rival}. It\'s always {rival}. Forty years of it.'] }, { if: { feeling: 'quarrel', feelingX: (x) => !!x }, pri: 1, text: ['{FeelingX}. Words were had. I\'m not saying who started it. ...It was {feelingX}.', 'It\'s {feelingX}. Stubborn as a stuck gate.'] }, { if: { feeling: 'scuffled', feelingX: (x) => !!x }, pri: 2, text: ['{FeelingX} and I came to blows. Fists! At our age. I\'m that ashamed.', 'I\'ll not say what {feelingX} called me. But I gave as good as I got.'] }, { if: { memory: (m) => !!m, memoryGood: false }, pri: 1, text: ['"{Memory}" There. Now you know.'] }]);
  lines('cross.softens', [{ text: ['...I might have said a thing or two myself. Don\'t tell anyone.', '...Thank you for not saying anything. Most folk can\'t help themselves.'] }]);
  lines('cross.business', [{ text: ['None of your business, wizard.', 'I don\'t want to talk about it.'] }]);
  lines('cross.doubt', [{ text: ['...Maybe a little. A very little.', 'Right? ...Oh, they might have had a point. Somewhere.'] }]);
  lines('cross.bristles', [{ text: ['Oh, very funny. Go and be wise at someone else.', 'Is that what passes for wit, where you come from?'] }]);
  lines('cross.grudging', [{ text: ['Hmph. ...It is a bit, isn\'t it.'] }]);
  lines('cross.laughs', [{ text: ['Ha! ...Ha. A toad. Don\'t tempt me.', '*despite everything, laughs*'] }]);
  lines('cross.think', [{ text: ['I\'ll think about it.', 'Maybe. Not today.'] }]);
  lines('cross.goes', [{ text: ['...All right. After my tea. Don\'t look so pleased with yourself.', 'Ha. Fine. You\'re impossible. I\'m going.'] }]);
  lines('cross.fuss', [{ text: ['Don\'t fuss. I\'m not a child.'] }]);
  lines('cross.pat', [{ text: ['...Hm. All right. Thank you.'] }]);
  lines('cross.thanks', [{ text: ['...Thank you. Daft, isn\'t it, getting in such a state.'] }]);
});
