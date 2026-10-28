'use strict';
// ---------------------------------------------------------------------------
// The wizard himself, and what folk want from him (1 of 4): the facts the
// other wizard packs share (which of his tales they've heard, whether they
// saw the fireworks, who owes whom a favor, a baby to bless), how his
// promises are kept, the small wonders he works in a talk, and the threads
// where folk ask about the old man: his age, his hat, his staff, his beard,
// his wagon and horse, what a wizard eats, and "Ask me anything".
// (These are talk/ files: nothing to do with js/wizard.js, which drives him.)
//
// Lines here are written with wz(key, { cond: [texts] }): `_` is the
// fallback, a temper, stage, register or fact word picks the rule (see WZ
// below), `a+b` needs both, and a trailing `!` adds priority. Each wizard
// pack carries its own copy of WZ and wz, since packs may load in any order.
// ---------------------------------------------------------------------------

talkPack('wizard', () => {
  // --- Writing lines by condition word -------------------------------------------------
  const has = (x) => !!x && (!Array.isArray(x) || x.length > 0);
  const WZ = {
    child: { stage: 'child' }, grown: { stage: 'grown' }, elder: { stage: 'elder' },
    rift: { rift: true }, riftWays: { riftWays: true, rift: false }, plain: { register: 'plain' }, fine: { register: 'fine' }, bright: { register: 'bright' },
    merry: { mood: 'merry' }, low: { mood: ['low', 'miserable'] }, sick: { sick: true }, hungry: { hungry: true }, tired: { tired: true },
    tipsy: { tipsy: true }, lonely: { lonely: true }, bored: { bored: true }, homeless: { homeless: true }, party: { party: true },
    rain: { weather: 'rain' }, snow: { weather: 'snow' }, fond: { fond: { min: 0.3 } }, cool: { fond: { max: -0.1 } },
    trusts: { trust: { min: 0.35 } }, meddler: { respect: { max: -0.2 } }, heeds: { respect: { min: 0.3 } },
    spouse: { spouse: has }, kids: { kid: has }, baby: { baby: has }, joke: { joke: has }, wizJoke: { wizJoke: has },
    heard: { favTale: has }, sawShow: { sawShow: true }, owesYou: { owesYou: true }, youOwe: { youOwe: true },
    smoker: { smoker: true }, gifted: { gifted: { min: 1 } }, showTonight: { showTonight: true }, hearth: { hearth: true },
    wizPromise: { wizPromise: has }, wish: { wish: has }, dream: { dream: has }, lost: { lost: has }, goBetween: { goBetween: true },
  };
  for (const t of ['cheerful', 'ornery', 'shy', 'curious', 'dreamy', 'witty', 'proud', 'gloomy']) WZ[t] = { temper: t };
  for (const s of ['spring', 'summer', 'autumn', 'winter']) WZ[s] = { season: s };
  for (const h of ['morning', 'afternoon', 'evening', 'night']) WZ[h] = { hour: h };
  for (const k of ['greenfields', 'trolls', 'dragon', 'eagles', 'fellwinter', 'oldtook', 'sea', 'mungo', 'mountain', 'havens', 'south', 'neverdark']) WZ[k] = { favTale: k };
  for (const j of Object.keys(JOBS)) WZ[j] = { job: j };
  for (const p of Object.keys(HOBBIES)) WZ[p] = { pastime: p };
  const wz = (key, o, extra) => {
    const rules = [];
    for (const k in o) {
      const pri = (k.match(/!/g) || []).length, words = k.replace(/!/g, '');
      if (words === '_') { rules.push({ pri, text: o[k] }); continue; }
      const cond = {};
      for (const w of words.split('+')) { if (!WZ[w]) throw new Error(`wz: unknown condition "${w}" in ${key}`); Object.assign(cond, WZ[w]); }
      rules.push({ if: cond, pri, text: o[k] });
    }
    lines(key, rules.concat(extra || []));
  };

  // --- What the wizard packs know about a hobbit -------------------------------------
  // Tales are known by how folk remember them ("of the three trolls").
  const taleList = () => Object.assign({}, typeof JOURNEY_TALES !== 'undefined' ? JOURNEY_TALES : {}, WIZARD_TALES);
  const taleWord = (x) => x.replace(/^(of|about) /, '');
  // an age in words: 'ninety-seven', 'a hundred and three'
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const numWords = (n) => (n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : n < 200 ? 'a hundred' + (n % 100 ? ' and ' + numWords(n % 100) : '') : String(n));
  addFacts((v, F) => {
    const b = bondFull(v), tales = taleList(), heard = [];
    for (const n of b.notes || []) {
      const m = /^Heard you tell the tale (.+)\.$/.exec(n.t);
      if (!m) continue;
      const k = Object.keys(tales).find((t) => tales[t].x === m[1]);
      if (k && !heard.includes(k)) heard.push(k);
    }
    F.heard = heard;
    F.favTale = heard[0] || null;
    F.favTaleWord = heard[0] ? taleWord(tales[heard[0]].x) : null;
    F.taleCount = heard.length;
    const ml = typeof moodletsOf === 'function' ? moodletsOf(v) : [];
    F.sawShow = (b.notes || []).some((n) => n.t === 'Watched your fireworks.') || ml.some((m) => m.k === 'wizard_show');
    F.owesYou = (b.owe || 0) > 0;
    F.youOwe = (b.owe || 0) < 0;
    const wp = (b.promises || []).find((p) => p.state === 'open' && p.k.indexOf('wiz.') >= 0);
    F.wizPromise = wp ? wp.t : null;
    const wj = (b.jokes || []).find((j) => j.k.startsWith('wiz.'));
    F.wizJoke = wj ? wj.t : null;
    const baby = Game.villagers.find((o) => o.stage === 'baby' && o.parents && o.parents.includes(v.id));
    F.baby = baby ? baby.first : null;
    F.smoker = !v.isChild() && ((v.weights && v.weights.smoke) || 1) > 1.15;
    F.years = numWords(Math.floor(v.years()));
    F.gifted = (b.gifts || []).length;
    const w = typeof wizard === 'function' ? wizard() : null;
    F.showTonight = !!(Game.party && (Game.party.on || Game.party.planned)) && !!w && w.showDay !== Game.day;
  });

  // --- Promises he makes in these threads, and how they're kept -------------------------
  // wiz.show.*: kept when they next watch his fireworks; wiz.tale.<key>: when they
  // hear that tale (or any, for wiz.tale.any); wiz.visit.*: when he comes back another day.
  const notedSince = (v, p, test) => (bondFull(v).notes || []).some((n) => n.d >= p.d && test(n.t));
  addPromiseCheck('wiz.show', (v, p) => (notedSince(v, p, (t) => t === 'Watched your fireworks.') ? 'kept' : null));
  addPromiseCheck('wiz.tale', (v, p) => {
    const k = p.k.split('.')[2], tales = taleList();
    return notedSince(v, p, (t) => t.startsWith('Heard you tell the tale') && (k === 'any' || !tales[k] || t.includes(tales[k].x))) ? 'kept' : null;
  });
  addPromiseCheck('wiz.visit', (v, p) => (bondFull(v).last > p.d ? 'kept' : null));

  // --- Small wonders, worked in the middle of a talk ------------------------------------
  // Sparing: a smoke ring or two, a puff of colored stars, a light on the staff.
  const STAR = ['#ff8ae0', '#6ad0ff', '#ffd34a', '#9aff7a'];
  const ding = (k) => { try { if (typeof Sound !== 'undefined' && Sound[k]) Sound[k](); } catch (e) { /* no sound is fine */ } };
  const wonder = (kind) => (T, v) => {
    if (typeof FX === 'undefined') return;
    const w = typeof wizardOf === 'function' ? wizardOf() : null;
    const wx = w ? w.fx : v.x + 14, wy = w ? w.fy : v.y;
    if (kind === 'ring') { FX.smokeRing(wx + 6, wy - 30); FX.smokeRing(wx + 8, wy - 34); }
    else if (kind === 'ship') { FX.smokeRing(wx + 6, wy - 30); FX.smokeRing(wx + 10, wy - 31); FX.smokeRing(wx + 14, wy - 33); }
    else if (kind === 'stars') { FX.sparkle(v.x, v.y - 20, R.pick(STAR)); FX.sparkle(v.x, v.y - 20, R.pick(STAR)); FX.sparkle(v.x, v.y - 20, '#ffffff'); ding('chime'); }
    else if (kind === 'light') { FX.sparkle(wx + 7, wy - 40, '#fff6c0'); FX.sparkle(wx + 7, wy - 40, '#ffffff'); ding('chime'); }
    else if (kind === 'puff') FX.puff(v.x, v.y - 8);
    else if (kind === 'hearts') FX.hearts(v.x, v.y - 20);
    else if (kind === 'bang') { FX.sparkle(v.x, v.y - 22, R.pick(STAR)); FX.sparkle(v.x, v.y - 22, '#ffffff'); ding('boom'); }
  };
  // shared with the other wizard packs (used when a choice is made, so the load order doesn't matter)
  window.WizTalk = { wonder, taleList, taleWord };
  const magic = (k) => wonder(k);

  // --- How old are you, really? ---------------------------------------------------------
  addThread({
    id: 'wiz.age', theirs: true, label: 'They ask how old you are', cool: 5,
    ask: '{Name} is looking at your beard, and doing sums.',
    when: (F) => F.met,
    beats: {
      start: { line: 'wiz.age.q', go: [
        { ap: 'jest', say: 'wiz.age.say.jest', to: 'teapot' },
        { ap: 'ask', say: 'How old do you think I am?', to: 'guess' },
        { ap: 'share', say: 'Old enough to have forgotten. Young enough to mind.', to: 'old' },
      ] },
      guess: { line: 'wiz.age.guess', go: [
        { ap: 'jest', say: 'Wrong by a few thousand years. Give or take a Tuesday.', to: 'shock' },
        { ap: 'warm', say: 'Flatterer. I\'ll take it, and say thank you.', to: 'flatter' },
        { ap: 'share', say: 'Closer than most. Don\'t tell anyone.', to: 'secret', need: { open: 1 }, soft: true },
      ] },
      teapot: { line: 'wiz.age.teapot', go: [
        { ap: 'ask', say: 'The true answer? A few thousand. Give or take a Tuesday.', to: 'shock' },
        { ap: 'jest', say: 'And better glazed. And with fewer chips.', to: 'chips' },
        { ap: 'share', say: 'The truth is, I stopped counting when the counting got sad.', to: 'old', need: { open: 1 }, soft: true },
      ] },
      shock: { line: 'wiz.age.shock', go: [
        { ap: 'ask', say: 'And you? What\'s the oldest thing you remember?', to: 'memory' },
        { ap: 'jest', say: 'I don\'t look a day over two thousand. Everyone says so.', to: 'chips' },
        { ap: 'share', say: 'It\'s less grand than it sounds. Mostly it\'s a great many goodbyes.', to: 'mortal', need: { open: 1, trust: 0.1 }, soft: true },
      ] },
      flatter: { line: 'wiz.age.flatter', go: [
        { ap: 'ask', say: 'And how old are you, if it isn\'t rude?', to: 'theirs' },
        { ap: 'jest', say: 'It\'s the hat. The hat takes centuries off.', to: 'chips' },
      ] },
      secret: { line: 'wiz.age.secret', fx: { joke: { k: 'wiz.age', t: 'The wizard is "a few thousand, give or take a Tuesday".' }, fond: 0.02 }, go: [
        { ap: 'warm', say: 'Between you and me and the gatepost.', to: 'end' },
        { ap: 'ask', say: 'And what\'s the oldest thing you remember?', to: 'memory' },
      ] },
      old: { line: 'wiz.age.old', go: [
        { ap: 'share', say: 'It\'s the goodbyes I mind, mostly.', to: 'mortal', need: { open: 1 }, soft: true },
        { ap: 'ask', say: 'Tell me the oldest thing you remember.', to: 'memory' },
        { ap: 'jest', say: 'Sad? Me? I\'ve a wagon full of fireworks. Nobody\'s sad near fireworks.', to: 'chips' },
      ] },
      chips: { line: 'wiz.age.chips', go: [
        { ap: 'ask', say: 'Now you. How old are you, truly?', to: 'theirs' },
        { ap: 'warm', say: 'You\'re good company, {name}. At any age.', to: 'end' },
      ] },
      theirs: { line: 'wiz.age.theirs', go: [
        { ap: 'warm', say: 'A fine age. The best one, I find, is whichever you\'re at.', to: 'end' },
        { ap: 'ask', say: 'And what\'s the oldest thing you remember?', to: 'memory' },
      ] },
      memory: { line: 'wiz.age.memory', fx: { remember: 'Told the wizard the oldest thing I remember.', trust: 0.02 }, go: [
        { ap: 'warm', say: 'Keep hold of that one. It\'s a good one.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'share', say: 'Mine is a song, sung by friends long gone. I\'ve said a great many goodbyes since.', to: 'mortal' },
      ] },
      mortal: { line: 'wiz.age.mortal', fx: { trust: 0.03 }, go: [
        { ap: 'comfort', say: 'Don\'t fret for me. Every goodbye was a hello first.', to: 'comforted' },
        { ap: 'warm', say: 'That\'s why I come here. You lot are very good at hellos.', to: 'comforted' },
        { ap: 'jest', say: 'Besides, nobody else will put up with my hat.', to: 'comforted' },
      ] },
      comforted: { line: 'wiz.age.comforted', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.01 },
  });
  wz('wiz.age.say.jest', {
    _: ['Older than your grandmother\'s grandmother\'s teapot.', 'Older than the river. Well. Older than the teapot at the Badger.'],
    child: ['Older than your granddad\'s granddad\'s teapot. Older than cheese.', 'Older than every teapot in the valley put together.'],
    elder: ['Older than you, youngster, and older than your grandmother\'s teapot.', 'Older than the teapot you were weaned on.'],
    rift: ['Older than your city. Older than the oldest teapot in this valley.'],
  });
  wz('wiz.age.q', {
    _: ['How old are you, really? You can tell me.', 'Can I ask you something? How old are you?', 'Folk say you\'re older than the hills. Are you?'],
    cheerful: ['Settle a bet! How old are you? I said three hundred. Was I close?', 'Oh, go on, how old are you? I won\'t tell. Much.'],
    ornery: ['How old are you, anyway? Old enough to know better, I\'d say.', 'You\'ve been coming here since before my dad. How old ARE you?'],
    shy: ['...Can I ask how old you are? Sorry. That\'s rude. Is it rude?', '...Are you very old? You don\'t have to say.'],
    curious: ['How old are you? Do wizards have birthdays? Who gives you presents?', 'How old are you exactly? And do you count in years, or something else?'],
    dreamy: ['You must have seen the world change a hundred times. How old are you?', 'Do you remember when the stars were new? You look as if you might.'],
    witty: ['How old are you? Don\'t say \'old enough\'. Everyone says \'old enough\'.', 'I\'ve been counting the gray in your beard. I gave up at three hundred.'],
    proud: ['My family\'s been in this valley nine generations. How long have YOU been about?', 'I can trace my line back two hundred years. How far back do you go?'],
    gloomy: ['How old are you? You must have buried a lot of folk.', 'Does it ever end, for a wizard? Getting old?'],
    child: ['How old are you? A HUNDRED? A MILLION?', 'Are you older than the party tree? Are you older than the SKY?', 'How many birthdays have you had? Do you get cake at all of them?'],
    elder: ['I\'m old, and you were old when I was young. How old does that make you?', 'You haven\'t aged a day since I was in short trousers. How old are you?'],
    rift: ['Real question. What\'s your age? Your file must be enormous.', 'How old are you? Back home we\'d just scan you. I miss scanning.'],
    'elder+ornery': ['You were old when I was courting, and you\'re old now. It\'s not fair.'],
    'child+bright': ['How old are you? I can count to a thousand. Is that enough?'],
    'elder+fond': ['I remember you at my naming day. You\'ve not changed a hair. How?'],
  });
  wz('wiz.age.guess', {
    _: ['Two hundred? Two hundred and fifty?', 'Ninety. No, wait. A hundred and ninety.', 'Older than the Old Took, they say. So, a hundred and thirty-one?'],
    cheerful: ['Three hundred! And not a day more, I\'ll bet.', 'A hundred and eleven? That\'s a lovely age. Very round.'],
    ornery: ['Older than you let on, I\'ll be bound. Four hundred.', 'I don\'t care to guess. A thousand. There. Happy?'],
    shy: ['...Sixty? Sorry. Seventy?', '...A hundred? I\'m bad at guessing.'],
    curious: ['From the beard, at least five hundred. From the knees, more.', 'Let me think. The rings on a tree go one a year. Do beards work like that?'],
    dreamy: ['As old as the first song ever sung, I should think.', 'You look like you were here before the valley had a name.'],
    witty: ['Judging by the hat? Antique. Judging by the jokes? Older.', 'Somewhere between \'very\' and \'don\'t ask\'.'],
    proud: ['My grandfather said you were old when HE was young. So, ancient.', 'Older than my family line. And that\'s saying a great deal.'],
    gloomy: ['Old enough to have outlived everyone. Poor thing.', 'Too old, I expect. It must ache.'],
    child: ['A BILLION!', 'Seventy-twelve! Is that a number? It is now.', 'Older than dinosaurs. Mom says there were no dinosaurs. Mom doesn\'t know.'],
    elder: ['Older than me by a long chalk, and I\'m {years}.', 'You knew my grandfather as a boy. So, very.'],
    rift: ['Biometrics say: unknown. Signal says: error. So, really old?', 'Your beard\'s got more data in it than our archives. Three hundred?'],
  });
  wz('wiz.age.teapot', {
    _: ['The teapot! That\'s old. That\'s VERY old. It came from Bree.', 'Ha! That teapot\'s held together with glue and stubbornness.'],
    cheerful: ['Ha! Then you\'re older than everything in my kitchen, and I\'ve got a very old pickle.', 'Oh, that\'s lovely. You\'re a teapot\'s elder!'],
    ornery: ['Leave my grandmother\'s teapot out of it.', 'That teapot\'s got more manners than some wizards I could name.'],
    shy: ['...Ha. That is very old. Is that true?', '*giggles behind a hand*'],
    curious: ['But how old is the teapot, then? Nobody knows! You\'ve dodged it!', 'That\'s not an answer, that\'s a riddle. I like riddles. Go on.'],
    dreamy: ['Imagine that. You and the teapot, both on the road all those years.', 'I always thought that teapot had seen things.'],
    witty: ['And no doubt better at keeping its lid on than you.', 'So, cracked, a bit stained, but still pours. I see the likeness.'],
    proud: ['That teapot\'s been in my family since the Fell Winter, I\'ll have you know.', 'It\'s a very distinguished teapot. So I\'ll take that as a compliment.'],
    gloomy: ['That teapot\'s cracked. Everything gets cracked, in the end.', 'Old, then. Old and tired, like the teapot.'],
    child: ['HAHAHA! You\'re older than a TEAPOT!', 'Is the teapot magic too? Is it? Can I talk to it?'],
    elder: ['That teapot\'s younger than me. So you\'re calling me old too.', 'Ha! I remember when that teapot was new. Just about.'],
    rift: ['A teapot as a unit of time. Okay. Logging that.', 'Back home nothing lasted long enough to be a grandmother\'s anything.'],
  });
  wz('wiz.age.shock', {
    _: ['A few THOUSAND? You\'re pulling my leg.', 'Thousands! How do you remember where you left your pipe?', 'Well, you look very well on it. Very well indeed.'],
    cheerful: ['Thousands! Then you must have had thousands of birthdays. Thousands of cakes!', 'Oh, that\'s marvelous. I hope I\'m that old. I hope I\'m that cheerful.'],
    ornery: ['Thousands. Pull the other one, it\'s got bells on.', 'Hmph. And still can\'t arrive on the day you say.'],
    shy: ['...Thousands? Oh. I\'m sorry I asked. Is that sad?', '...That\'s a lot. I\'d be tired.'],
    curious: ['Thousands! Then you saw the Fell Winter? The first hobbits crossing the river? Everything?', 'But what does that feel like? Does a year go by quicker, the more you have?'],
    dreamy: ['Thousands of springs. I can\'t think of anything lovelier, or lonelier.', 'Then you\'ve seen the stars move. Haven\'t you? Just a little.'],
    witty: ['Then you can\'t complain about the price of ale. You\'ve had centuries to save.', 'No wonder you\'re always late. You\'ve so much to remember on the way.'],
    proud: ['Well. My family\'s very old too. Not THAT old. But old.', 'Thousands. I suppose that makes our nine generations look like a weekend.'],
    gloomy: ['Thousands of years of things going wrong. You poor old soul.', 'I\'d not want it. All that time to watch it all go.'],
    child: ['THOUSANDS? You must be SO tired. Do you need a nap? I hate naps.', 'Is your beard thousands of years long? Can I measure it?'],
    elder: ['And here\'s me thinking my knees were old.', 'Thousands. Makes my lumbago seem very young and silly.'],
    rift: ['Thousands. That\'s longer than Neverdark\'s been switched on. Wild.', 'You\'ve had uptime longer than our whole grid. Respect.'],
  });
  wz('wiz.age.flatter', {
    _: ['I wasn\'t flattering! Well. A bit.', 'You don\'t look it. You do look a bit tired.'],
    cheerful: ['Flattery\'s free, wizard! Have some more! You\'ve got lovely eyebrows.'],
    ornery: ['I don\'t flatter. Ask anyone.', 'That wasn\'t flattery. That was a guess, and a bad one.'],
    shy: ['...I didn\'t mean... Oh, you\'re teasing. Ha.'],
    curious: ['So I was close? How close? Warmer? Colder?'],
    dreamy: ['Some folk are just older on the inside. You\'re one of those.'],
    witty: ['Flattery, wizard, is the only thing I give away free. Treasure it.', 'Then you owe me a thank you. I\'ll take it in fireworks.'],
    proud: ['I have a good eye for these things. Everyone says.'],
    gloomy: ['Well, you\'re welcome. Not that it changes anything.'],
    child: ['I\'m good at guessing. I guessed Mom\'s age and she said I was very rude.'],
    elder: ['At my age, wizard, everyone younger than me is a youngster. Except you.'],
    rift: ['Not flattery. Rough estimate. Error bars the size of a barn.'],
  });
  wz('wiz.age.secret', {
    _: ['I won\'t tell a soul. Give or take a Tuesday! I\'m keeping that one.', 'Your secret\'s safe. Mostly. I might tell the hens.'],
    cheerful: ['Ooh, a secret! I love a secret. Give or take a Tuesday! Ha!'],
    ornery: ['Who would I tell? Nobody listens to me anyway.'],
    shy: ['...I won\'t tell. I don\'t really tell anyone anything.'],
    curious: ['Give or take a Tuesday! Which Tuesday? Never mind. I won\'t tell.'],
    dreamy: ['I\'ll keep it like a pressed flower. A very old pressed flower.'],
    witty: ['Give or take a Tuesday. That\'s going on my wall.', 'I\'ll tell no one. I\'ll just smile knowingly at you for ever.'],
    proud: ['I can be trusted with anything. My family are famous for it.'],
    gloomy: ['Secrets are about all I\'m good at keeping.'],
    child: ['I won\'t tell! Cross my heart! ...Can I tell my cat?', 'I can keep secrets! I kept one for a whole DAY once.'],
    elder: ['At my age I forget secrets as fast as I hear them. You\'re quite safe.'],
    rift: ['Encrypted. Nobody\'s cracking that. Not even me.'],
  });
  wz('wiz.age.old', {
    _: ['That sounds like a sad thing to say, for a wizard.', 'Forgotten? How do you forget how old you are?', 'Oh. I didn\'t think wizards minded things.'],
    cheerful: ['Oh, don\'t mind! Every year\'s another excuse for a party.'],
    ornery: ['Mind? Everyone minds. You\'re not special.', 'Hmph. Sounds like something off a tea towel.'],
    shy: ['...I think I understand. I mind things too.'],
    curious: ['What is it you mind, exactly? The years, or what\'s in them?'],
    dreamy: ['Young enough to mind. I like that. I\'ll mind for you, if you like.'],
    witty: ['Old enough to forget, young enough to mind. Very wise. Did you make that up just now?'],
    proud: ['Well, I mind nothing. I mean to grow old very grandly.'],
    gloomy: ['I mind. All the time. Didn\'t think wizards did as well.', 'Does it get better? The minding?'],
    child: ['I mind getting old. I don\'t want a beard. Unless it\'s like yours.'],
    elder: ['Ah. You\'re talking my language now. The minding never goes, does it?'],
    rift: ['Data rot. Same with us. You keep the backups and they still fade.'],
  });
  wz('wiz.age.chips', {
    _: ['Ha! You\'re impossible.', 'Ha! I\'ll tell everyone you said that.', 'You never give a straight answer, do you?'],
    cheerful: ['Ha! Oh, I like you. Two thousand and not a day over!'],
    ornery: ['Hmph. Some of us have work to do, you know.', 'Fewer chips, my foot.'],
    shy: ['*laughs, then looks surprised at laughing*'],
    curious: ['Is that true about the hat? Does it really take centuries off?'],
    dreamy: ['You\'re like a story that won\'t finish. In a good way.'],
    witty: ['Better glazed! I\'ll remember that one. I\'ll use it on my aunt.', 'If you\'re the teapot, who\'s the tea cozy?'],
    proud: ['Well, I\'m a very well-preserved hobbit myself. Everyone says.'],
    gloomy: ['...That was funny. Don\'t tell anyone I laughed.'],
    child: ['HAHAHA! Say another one!', 'You\'re silly. Wizards aren\'t supposed to be silly.'],
    elder: ['Ha! You\'ll do. You\'ll do.'],
    rift: ['Lol. Sorry. That\'s rift for ha.', 'Okay, that got a laugh. Log it.'],
  });
  wz('wiz.age.theirs', {
    _: ['Me? {Years}. Feels like more, some mornings.', 'I\'m {years}. Not that anybody remembers my birthday.', '{Years}, this spring. Or was it last?'],
    cheerful: ['{Years}! And every one of them a corker.', '{Years}, and I mean to have {years} more.'],
    ornery: ['{Years}, and none of your business. ...There, you\'ve got it out of me.'],
    shy: ['...{Years}. That\'s not very interesting.'],
    curious: ['{Years}. Which is about four hundred breakfasts a year, if you count properly.'],
    dreamy: ['{Years}. But I feel about seven inside. Or ninety. It changes.'],
    witty: ['{Years}. Younger than you. Younger than your hat, probably.'],
    proud: ['{Years}, and I\'ve done more with them than most.', '{Years}, and not a gray hair. Well, one. It\'s a very good one.'],
    gloomy: ['{Years}. And what\'ve I got to show for it?'],
    child: ['I\'m {years}! And a half! The half is important.', '{Years}! Nearly {years} and a quarter!'],
    elder: ['{Years}, wizard. Old enough to sit when I like and say what I think.', '{Years}. I\'ve outlived three cats and a husband\'s mustache.'],
    rift: ['{Years}. Though my clock got scrambled coming through the rift. Could be off.'],
  });
  wz('wiz.age.memory', {
    _: ['The oldest? My mother singing over the washing. I couldn\'t see her, just hear her.', 'The smell of bread. Before I knew what bread was.', 'A red ball rolling down the hill and me crying after it.'],
    cheerful: ['Laughing! I don\'t know at what. I\'ve been at it ever since.', 'A snowball. Right in my granddad\'s ear. Best day of my life.'],
    ornery: ['Being told off. I expect I deserved it. I usually do.', 'A goose. A very angry goose. We\'ve not been friends since.'],
    shy: ['...Hiding under the table at a party. Everyone\'s feet. It was nice under there.', '...A blanket with ducks on. I still have it. Don\'t tell.'],
    curious: ['Taking the clock apart. I was three. It never went again.', 'Asking why the sky was blue. Nobody knew. I still don\'t.'],
    dreamy: ['Lying in the long grass watching clouds go by. I think I\'m still there, a bit.', 'Fireflies over the water. I thought they were stars that had come down to drink.'],
    witty: ['Being born, I expect. Didn\'t care for it. Too bright, and no breakfast.', 'My first joke. Nobody laughed. It was about a turnip.'],
    proud: ['Winning a prize for the biggest pumpkin. I was four. I grew it myself. Mostly.'],
    gloomy: ['A funeral. I didn\'t know what it was. I knew everyone was sad.', 'Rain on the window, and nobody coming.'],
    child: ['Yesterday! No, the day before. I fell in the duck pond.', 'Being a baby! I don\'t remember it. Mom says I was loud.'],
    elder: ['The Long Winter, when I was tiny. Granddad carried me through snow up to his chest.', 'The first lamp lit in the lane. Oh, we thought it was magic.'],
    rift: ['A neon sign outside my window, blinking. Pink, blue, pink. All night. I still can\'t sleep in the dark.', 'The hum of the city. Like a song with no words.'],
    'rift+shy': ['...The rain on the tram roof. Back home. It sounded like applause.'],
    'elder+gloomy': ['My little brother. He\'s been gone sixty years. I still see his face.'],
  });
  wz('wiz.age.mortal', {
    _: ['So you\'ve lost a lot of friends. Everyone you knew when you were young.', 'All those goodbyes. I\'d not have the heart for it.', 'Does it get lonely? Outliving everyone?'],
    cheerful: ['Oh, but think of all the friends you\'ve had! Hundreds! Thousands!'],
    ornery: ['Well, that\'s what you get for living so long. I\'ll not be doing it.'],
    shy: ['...I\'m sorry. I didn\'t mean to make you sad.', '...That must be hard. I\'d hide, I think.'],
    curious: ['Do you remember them all? Every face?', 'Is that why you keep moving? So you don\'t have to watch?'],
    dreamy: ['Maybe they\'re all somewhere. Waiting at the end of the road for you.'],
    witty: ['And yet you keep making new friends. Glutton for punishment.'],
    proud: ['Well, you\'ll not be saying goodbye to me for a long while. I\'m very sturdy.'],
    gloomy: ['That\'s the saddest thing I\'ve ever heard. And I\'ve heard a lot of sad things.', 'I knew it. Even wizards. Nobody gets away.'],
    child: ['Will you say goodbye to ME? Don\'t. Don\'t ever.', 'Then I\'ll be your friend for ever. For ever and ever. Deal?'],
    elder: ['I\'ve buried a fair few myself. You never get used to it. You just get better at carrying it.', 'Ah. I know that one. The empty chairs.'],
    rift: ['I lost everyone when I came through. So. Yeah. I get it.', 'Same. Different reasons. Same.'],
    lost: ['I lost {lost}. I know a little of goodbyes. Not as many as you.'],
  });
  wz('wiz.age.comforted', {
    _: ['Every goodbye was a hello first. I like that. I\'ll keep that.', 'Well. You\'re always welcome here. For as long as there\'s a here.', 'Then we\'ll keep saying hello. As often as you like.'],
    cheerful: ['Then HELLO! There! Another one for the pile!'],
    ornery: ['Hmph. Soft old thing. ...Have a cookie.'],
    shy: ['...Hello, then. Again. Ha.'],
    curious: ['I\'ll be a hello you remember. I\'ll make sure of it.'],
    dreamy: ['That\'s the loveliest thing. I\'ll think of it whenever someone waves.'],
    witty: ['Your hat, though. That\'s a goodbye nobody would mind.'],
    proud: ['We are very good at hellos here. Famous for them.'],
    gloomy: ['...That helps, oddly. Every goodbye was a hello first.'],
    child: ['HELLO! HELLO! I\'m going to say it every time I see you!'],
    elder: ['Aye. We\'ll keep the kettle on, wizard. Long as we\'re able.'],
    rift: ['Hello. Ping. Ping back. That\'s how we\'d say it.'],
  });

  // --- The hat ---------------------------------------------------------------------------
  addThread({
    id: 'wiz.hat', theirs: true, label: 'They have views on your hat', cool: 4,
    ask: '{Name} is staring at your hat. Most folk do, eventually.',
    beats: {
      start: { line: 'wiz.hat.q', go: [
        { ap: 'jest', say: 'It keeps the rain off my nose and the stars off my head.', to: 'stars' },
        { ap: 'ask', say: 'Would you like to know what\'s in it?', to: 'inside' },
        { ap: 'share', say: 'It was a present, a long time ago, from a very old friend.', to: 'present', need: { open: 1 }, soft: true },
      ] },
      stars: { line: 'wiz.hat.stars', go: [
        { ap: 'warm', say: 'Would you like to try it on?', to: 'tryon' },
        { ap: 'jest', say: 'Birds like it too. I don\'t know why. I\'ve stopped asking.', to: 'birds' },
        { ap: 'ask', say: 'What would you keep under a hat like this?', to: 'inside' },
      ] },
      inside: { line: 'wiz.hat.inside', go: [
        { ap: 'tale', say: '*You reach into the crown and bring out a puff of colored stars.*', label: 'Reach in and show them', to: 'pulled', fx: { run: magic('stars') } },
        { ap: 'jest', say: 'A spare hat. A very small one. For emergencies.', to: 'spare' },
        { ap: 'warm', say: 'Mostly my head. And a cookie, in case of a long afternoon.', to: 'cookie' },
      ] },
      pulled: { line: 'wiz.hat.pulled', fx: { fond: 0.02, drive: { bored: -0.15 } }, go: [
        { ap: 'warm', say: 'Would you like to try it on? Mind the stars.', to: 'tryon' },
        { ap: 'jest', say: 'That was the last of today\'s. Tomorrow\'s are still brewing.', to: 'spare' },
      ] },
      spare: { line: 'wiz.hat.spare', fx: { joke: { k: 'wiz.hat.spare', t: 'The wizard keeps a spare hat in his hat.' } }, go: [
        { ap: 'warm', say: 'Go on. Try it on.', to: 'tryon' },
        { ap: 'jest', say: 'And a spare beard. Don\'t tell anyone.', to: 'birds' },
      ] },
      cookie: { line: 'wiz.hat.cookie', go: [
        { ap: 'share', say: '*You find the cookie, break it, and give them half.*', label: 'Share the cookie', to: 'shared', fx: { fond: 0.03, drive: { hunger: -0.05 } } },
        { ap: 'jest', say: 'It\'s from the Old Took\'s birthday. Still good. Probably.', to: 'old' },
      ] },
      tryon: { line: 'wiz.hat.tryon', fx: { fond: 0.02, joke: { k: 'wiz.hat.tryon', t: '{Name} tried on the wizard\'s hat and disappeared under it.' } }, go: [
        { ap: 'warm', say: 'It suits you. Keep it on a minute.', to: 'suits' },
        { ap: 'jest', say: 'Careful. It bites the vain.', to: 'bites' },
        { ap: 'ask', say: 'Well? What does the world look like from under there?', to: 'world' },
      ] },
      present: { line: 'wiz.hat.present', fx: { trust: 0.02 }, go: [
        { ap: 'ask', say: 'Have you something like that? Something of someone you miss?', to: 'keepsake', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'So I mind it. Rain and all.', to: 'mind' },
        { ap: 'jest', say: 'She said it made me look distinguished. She was being kind.', to: 'kind' },
      ] },
      keepsake: { line: 'wiz.hat.keepsake', fx: { confide: { k: 'wiz.hat.keepsake', t: '{Name} keeps a keepsake of someone they miss, and keeps it close' }, trust: 0.03 }, go: [
        { ap: 'comfort', say: 'Then they\'re still with you. That\'s what keepsakes are for.', to: 'mind' },
        { ap: 'listen', say: '*You say nothing, and touch the brim of your hat.*', label: 'Touch your hat, and say nothing', to: 'mind' },
      ] },
      birds: { line: 'wiz.hat.birds', end: true },
      kind: { line: 'wiz.hat.kind', go: [
        { ap: 'warm', say: 'Would you like to try it on? Gently.', to: 'tryon' },
        { ap: 'share', say: 'I wear it for her, I suppose. Rain and all.', to: 'mind' },
      ] },
      shared: { line: 'wiz.hat.shared', end: true },
      old: { line: 'wiz.hat.old', end: true },
      suits: { line: 'wiz.hat.suits', end: true },
      bites: { line: 'wiz.hat.bites', end: true },
      world: { line: 'wiz.hat.world', fx: { fond: 0.01 }, end: true },
      mind: { line: 'wiz.hat.mind', fx: { fond: 0.02 }, end: true },
    },
  });
  wz('wiz.hat.q', {
    _: ['Can I ask about the hat? Everyone wants to ask about the hat.', 'Why\'s your hat so pointy? Doesn\'t it catch on things?', 'That hat. Is it heavy? It looks heavy.'],
    cheerful: ['I love your hat! I want one! Where do you get a hat like that?', 'Your hat\'s the best thing in the valley. After pie.'],
    ornery: ['That hat\'s a menace. You\'ll have someone\'s eye out.', 'You\'ll not get through a round door in that. I\'ve seen you try.', 'Do you ever take that ridiculous hat off?'],
    shy: ['...I like your hat. Sorry. I just do.', '...Is it true there\'s something living in your hat?'],
    curious: ['How tall is your hat, exactly? I measured it by eye and got three different answers.', 'Why pointed? Does it do something? Collect lightning? Keep thoughts in?'],
    dreamy: ['Your hat looks like a mountain with the clouds round it.', 'When you stand on the hill at dusk, your hat touches the first star.'],
    witty: ['Is that a hat, or a small gray tower you\'re wearing for a bet?', 'Your hat has its own weather. I saw a cloud on it this morning.'],
    proud: ['My uncle had a hat like that. Taller. Better brim.', 'A good hat says a great deal. Yours says... quite a lot, actually.'],
    gloomy: ['That hat must let the rain down your neck. Everything does, mine.', 'Doesn\'t it get tiring, being the one in the hat?'],
    child: ['Can I wear your hat? Please? PLEASE?', 'Is there a rabbit in your hat? Is there? Can I see it?', 'Your hat is SO tall. Is it taller than me? It\'s taller than me.'],
    elder: ['That\'s the same hat you had sixty years ago. I\'d know it anywhere.', 'In my day wizards had hats like that. Well. You did. In my day.'],
    rift: ['Is your hat an antenna? Be honest. It\'s an antenna.', 'Back home that hat would be a fashion statement. A loud one.'],
    'rain': ['Your hat\'s pouring water off the point like a gutter spout.'],
    'snow': ['There\'s a snowdrift on your hat. A proper little drift.'],
    'witty+wizJoke!': ['The hat again! Every time I see it I remember: {wizJoke}'],
  });
  wz('wiz.hat.stars', {
    _: ['Keeps the stars off! Ha! As if they\'d fall on you.', 'The stars off your head. I\'ll be thinking about that all night.'],
    cheerful: ['Ha! Then I want one for the stars. And the rain. And Mondays.'],
    ornery: ['Stars don\'t fall on folk. Rain, now, rain I\'ll give you.', 'Likely story.'],
    shy: ['...Do they fall on people? Should I get a hat?'],
    curious: ['But does it? Have stars ever hit it? Is that why there\'s a dent?'],
    dreamy: ['I\'d leave my hat off, then. Let them fall. I\'d catch one.'],
    witty: ['A star-guard. You should sell them at the market. Two pence a point.'],
    proud: ['A practical hat, then. I approve of practical. Mine\'s practical.'],
    gloomy: ['With my luck a star WOULD fall on me.'],
    child: ['Stars can\'t fall on you! ...Can they? Can they fall on ME?', 'Can I catch a star in it? Like a net?'],
    elder: ['I\'ve gone ninety years hatless and no star\'s got me yet. But I\'m careful.'],
    rift: ['A star-shield. Okay. Our city had smog for that.'],
  });
  wz('wiz.hat.inside', {
    _: ['Yes! What is in it? Rabbits? Letters? Cookies?', 'Go on, then. What\'s in there?', 'I always thought there was something in there. Something that moves.'],
    cheerful: ['Ooh, yes! Is it candy? Tell me it\'s candy.'],
    ornery: ['Nothing good, I\'ll bet. Fireworks. Trouble. Fireworks and trouble.', 'Go on, then. Surprise me. You won\'t.'],
    shy: ['...Only if it\'s not something with legs.', '...If you want to show me. You don\'t have to.'],
    curious: ['YES. Everything in it. In order. With labels.', 'Is it bigger on the inside? It\'s bigger on the inside, isn\'t it.'],
    dreamy: ['Is it the night sky? I always thought it might be the night sky.'],
    witty: ['If it\'s your head, I\'ll be very disappointed.', 'Let me guess. A smaller wizard.'],
    proud: ['I\'ll see what\'s in it, if you insist. I\'m not easily impressed.'],
    gloomy: ['Probably just more rain.'],
    child: ['A DRAGON? Is it a baby dragon? Is it a frog? I\'d like it to be a frog.', 'Candy! Is it candy? Candy and a frog?'],
    elder: ['I\'ve wondered that for seventy years. Go on. Before I go.'],
    rift: ['Hidden storage. I knew it. What\'s the capacity?'],
  });
  wz('wiz.hat.pulled', {
    _: ['Oh! Oh, look at them! Colored stars, out of a hat!', 'Do it again! No, don\'t, then it won\'t be special. Do it again.', 'Well, I never. I\'ll not look at a hat the same way.'],
    cheerful: ['HA! Oh, that\'s wonderful! Again! Everyone, come and look!', 'Stars! Out of a hat! Best day of the week, this.'],
    ornery: ['Hmph. Sparks. Mind you don\'t set the hedge alight.', '...All right. That was quite good. Don\'t look so pleased.'],
    shy: ['*watches the stars fade with both hands over their mouth*', '...Oh. Oh, that was lovely.'],
    curious: ['How? Where did they come from? Were they in the lining? Can I see the lining?'],
    dreamy: ['I\'ll keep the green one. I watched it all the way down. It\'s mine now.'],
    witty: ['And for my next trick, the wizard will pull out his dignity. Any moment now.'],
    proud: ['Very good. I\'ve seen better. Once. At a wedding. Possibly not.'],
    gloomy: ['...Oh. That was nice. I wasn\'t expecting nice today.'],
    child: ['AGAIN! AGAIN! AGAIN!', 'I SAW A PINK ONE! Did you see the pink one? I\'m going to tell EVERYONE.'],
    elder: ['You did that for me at my naming, my mother said. Same colors.'],
    rift: ['No battery. No wire. Nothing on any scan. I hate it. I love it.', 'Okay, that was better than a holo. Don\'t tell anyone back home.'],
  });
  wz('wiz.hat.spare', {
    _: ['A spare hat in the hat! Ha! And is there a spare in that one?', 'Ha! You never give a straight answer.'],
    cheerful: ['Hats all the way down! Oh, that\'s marvelous.'],
    ornery: ['Talking nonsense again.', 'And I suppose you keep a spare wizard in the spare hat.'],
    shy: ['...Ha. A tiny hat. I\'d like to see a tiny hat.'],
    curious: ['But does the small hat have a smaller hat? Where does it stop?'],
    dreamy: ['A hat inside a hat inside a hat. Like a dream inside a dream.'],
    witty: ['Very sensible. You can never have too many hats. Ask any hat.'],
    proud: ['I\'d have a spare too, if I had a hat that good.'],
    gloomy: ['A spare. Wish I had a spare. Of anything.'],
    child: ['A TINY HAT! For a mouse! Can a mouse be a wizard?'],
    elder: ['Old habits. I keep a spare pair of socks in my pocket.'],
    rift: ['Redundancy. Good engineering, that.'],
  });
  wz('wiz.hat.cookie', {
    _: ['A cookie in your hat? How long\'s it been there?', 'A hat-cookie. I\'ve heard of everything now.'],
    cheerful: ['A cookie! You\'re a hobbit at heart, wizard.'],
    ornery: ['That\'ll be soft. And full of hat.'],
    shy: ['...What sort of cookie?'],
    curious: ['What kind? Where from? Is it a magic cookie? Does it go off?'],
    dreamy: ['A cookie you\'ve carried all the way from somewhere. That\'s a well-traveled cookie.'],
    witty: ['I see. Not a wizard, then. A walking larder with a point.'],
    proud: ['I always keep a cookie about me. Very wise.'],
    gloomy: ['Bet it\'s broken. Cookies always are.'],
    child: ['Can I have it? Is it chocolate? Is it a magic one?'],
    elder: ['Very sensible. I keep a mint in my cardigan for the same.'],
    rift: ['Emergency rations. Respect.'],
    hungry: ['A cookie? Is it... is it a big one?'],
  });
  wz('wiz.hat.shared', {
    _: ['Oh, thank you. It\'s a bit hatty. It\'s lovely.', 'Half a wizard\'s cookie. I\'ll remember this.'],
    cheerful: ['Mm! Best cookie I\'ve had all morning. Tastes of adventure.'],
    ornery: ['Hmph. Soft as I said. ...Not bad, though.'],
    shy: ['*eats it in very small bites, smiling*'],
    curious: ['It tastes of... cinnamon. And pipe-weed. And far away.'],
    dreamy: ['I\'ll eat it slowly. You never know when you\'ll get another wizard\'s cookie.'],
    witty: ['A shared cookie is a binding agreement. You know that. We\'re allies now.'],
    proud: ['Thank you. I\'ll tell folk I shared cookies with the wizard.'],
    gloomy: ['...That\'s cheered me. Daft, isn\'t it. Half a cookie.'],
    child: ['Mmm! Crumbs! I got crumbs on your boots. Sorry!'],
    elder: ['Thank you, lad. Lad! Ha. Hark at me.'],
    rift: ['Calories received. Thank you. Seriously.'],
  });
  wz('wiz.hat.old', {
    _: ['The Old Took\'s birthday was a hundred years ago!', 'I\'ll not be eating that, thank you.'],
    cheerful: ['Ha! Vintage! Like cheese! Ha!'],
    ornery: ['That\'s disgusting. You\'re disgusting.'],
    shy: ['...I\'ll pass. Thank you, though.'],
    curious: ['Is it really? Can I see it? Has it turned to stone?'],
    dreamy: ['A cookie from a party a hundred years ago. It\'s practically a story.'],
    witty: ['Keep it. It\'s got more history than the rest of us put together.'],
    proud: ['My great-grandfather was at that party. Don\'t offer me his cookie.'],
    gloomy: ['Course it is. Nothing\'s fresh any more.'],
    child: ['EWWWW! Can I touch it?'],
    elder: ['I was at that party. I\'d know those cookies anywhere. Rock cakes.'],
    rift: ['Ha. Fossil food. We had those too, from vending machines.'],
  });
  wz('wiz.hat.tryon', {
    _: ['*puts it on, and it comes down to their chin* Hello? Where\'s everyone gone?', '*staggers under the hat* It\'s heavier than it looks!'],
    cheerful: ['*puts it on and spins round* Look at me! I\'m a wizard! Bring me a dragon!'],
    ornery: ['I will not. ...Oh, go on, then. *puts it on* Not a word. Not one word.'],
    shy: ['*puts it on and quite disappears under it* ...It\'s nice in here. Quiet.'],
    curious: ['*puts it on and looks up inside* There\'s a pocket! There\'s a little pocket in the top!'],
    dreamy: ['*puts it on, and goes very still* I can hear... something. Like the sea.'],
    witty: ['*puts it on* How do I look? Don\'t answer. I know. Magnificent.'],
    proud: ['*puts it on, very straight* It sits rather well, I think. Rather well.'],
    gloomy: ['*puts it on* It smells of rain and smoke. ...I like it, actually.'],
    child: ['*vanishes completely under the hat* I\'M INVISIBLE! Can you see me? You can\'t!'],
    elder: ['*puts it on* Ha! Sixty years I\'ve wanted to do that. Sixty years.'],
    rift: ['*puts it on* No signal. Total silence. It\'s a dead zone! I love it.'],
  });
  wz('wiz.hat.suits', {
    _: ['Does it? Really? ...I\'ll give it back. In a minute.', 'Here. Before I get used to it.'],
    cheerful: ['I KNEW it! I\'m keeping this for the party. ...No? Fine.'],
    ornery: ['Don\'t be daft. Here, have it back. Folk are looking.'],
    shy: ['...Really? *keeps it on a moment longer*'],
    curious: ['Do you think it\'d still work on me? The stars and that?'],
    dreamy: ['I\'ll remember this. The day I wore the wizard\'s hat.'],
    witty: ['Of course it does. I make everything look good. Even this.'],
    proud: ['I always thought I had the face for a hat like this.'],
    gloomy: ['First thing that\'s suited me all year.'],
    child: ['When I\'m big I\'m getting one EXACTLY like this. But blue.'],
    elder: ['Ha! I\'ll wear it to the Badger. Give them a turn.'],
    rift: ['I\'m going to post this on the Relay. Wizard hat. Me in it. Viral.'],
  });
  wz('wiz.hat.bites', {
    _: ['It does NOT. ...Does it?', 'Ha! Here, then. Have your biting hat back.'],
    cheerful: ['Ha! Then I\'m safe. I\'m not vain. I\'m gorgeous. That\'s different.'],
    ornery: ['Then it\'d have had you long since.'],
    shy: ['*takes it off very quickly*'],
    curious: ['How do hats bite? Has it got teeth? Where?'],
    dreamy: ['If it bites the vain, it\'s never bitten you. You\'re not vain. Just tall.'],
    witty: ['If it bit the vain, your head would be gone by now.'],
    proud: ['Then I\'ve nothing to fear. *keeps it on, a little nervously*'],
    gloomy: ['Course it does. Even hats don\'t like me.'],
    child: ['EEEK! *throws the hat in the air*'],
    elder: ['At my age, let it bite. I\'ve not much left worth biting.'],
    rift: ['A hat with a security system. Nice.'],
  });
  wz('wiz.hat.world', {
    _: ['Dark. And it smells of pipe-weed and rain. And somebody\'s been keeping toffee in here.', 'Like being in a very small tent. A very wise tent.'],
    cheerful: ['Brilliant! It\'s like a tiny house! I could live in here!'],
    ornery: ['It looks like the inside of a hat, wizard. What did you expect?'],
    shy: ['...Safe. It looks safe. Can I stay in a bit?'],
    curious: ['There\'s writing on the band! Tiny letters! What do they say? Is it a spell?'],
    dreamy: ['Like the sky before the stars come out. All soft and gray and waiting.'],
    witty: ['Much improved. I can\'t see anyone, and nobody can see me. Bliss.'],
    proud: ['Smaller than I\'d imagined. I\'d have expected more room for thinking.'],
    gloomy: ['Gray. Like everything. But warmer.'],
    child: ['DARK! It\'s like night time! Can I have night time whenever I want?'],
    elder: ['Like being a child again under the bedclothes. Thank you, wizard.'],
    rift: ['Zero light pollution. You know how rare that is where I\'m from?'],
  });
  wz('wiz.hat.present', {
    _: ['Who gave it you? A wizard? Do wizards give each other hats?', 'Oh. That\'s why you never take it off.'],
    cheerful: ['Oh, how lovely! And you\'ve kept it all this time! It\'s the best present ever, a hat.'],
    ornery: ['A present. Well. That\'s different, then. I take back the menace.'],
    shy: ['...That\'s nice. That you kept it.'],
    curious: ['Who? Where? When? Was it wrapped? How do you wrap a hat that shape?'],
    dreamy: ['So every time it rains, someone\'s keeping the rain off you. Even now.'],
    witty: ['And they never said anything about the color? A true friend.'],
    proud: ['A fine gift. I gave my sister a hat once. Better than this. But fine.'],
    gloomy: ['From someone you\'ve lost, isn\'t it. I can tell.'],
    child: ['Was it for your BIRTHDAY? Do wizards have birthdays?'],
    elder: ['Ah. Old friends\' gifts. They wear in, don\'t they, and you can\'t part with them.'],
    rift: ['A gift. Physical object. From a person. That\'s rare where I\'m from. It\'s all digital.'],
  });
  wz('wiz.hat.kind', {
    _: ['Distinguished! Ha! Well, she was right, a bit.', 'She was being kind. ...She was a bit right, too.'],
    cheerful: ['Distinguished! You ARE! Distinguished and pointy!'],
    ornery: ['Kind\'s one word for it.'],
    shy: ['...I think you look distinguished. Sorry.'],
    curious: ['Who was she? An elf? A wizard? Did she wear a hat too?'],
    dreamy: ['I think she meant it. People mean things they say kindly.'],
    witty: ['Distinguished. From a distance. In fog.'],
    proud: ['A hat like that would make anyone look distinguished. Even you.'],
    gloomy: ['Nobody\'s ever called me distinguished. Kind or not.'],
    child: ['What\'s DISTINGUISHED? Is it like extinguished? Like a fire?'],
    elder: ['Ha! My wife said that about my waistcoat. She was being kind too.'],
    rift: ['Distinguished. Vintage. Retro. Same thing, different decade.'],
  });
  wz('wiz.hat.keepsake', {
    _: ['...My mother\'s thimble. It lives in my waistcoat pocket. I touch it when I\'m nervous.', '...A button off my dad\'s coat. Just a button. I couldn\'t tell you why it matters.'],
    cheerful: ['...I don\'t talk about it much. Granddad\'s pipe. I don\'t smoke. I just hold it.'],
    ornery: ['...My brother\'s penknife. Blunt as a spoon. Don\'t you dare tell anyone I keep it.'],
    shy: ['...A ribbon. It was my grandma\'s. It\'s under my pillow. I\'ve never told anyone that.'],
    curious: ['...A letter I\'ve never opened. From an aunt. I want to know and I don\'t want to know.'],
    dreamy: ['...A pressed flower from my grandmother\'s garden. It\'s nearly dust now. I keep it anyway.'],
    witty: ['...All right, no jokes. My old friend\'s spoon. We used to fight over it. I won, in the end.'],
    proud: ['...My father\'s medal from the show. Best barley. I polish it every Highday.'],
    gloomy: ['...My sister\'s scarf. It doesn\'t smell of her any more. I check every day.'],
    child: ['...My first tooth. It\'s in a box. The Tooth Badger never came.'],
    elder: ['...My old dad\'s reading glasses. I don\'t need them. I wear them on Sundays.', '...A lock of hair. I\'ll not say whose. Some things you keep to yourself.'],
    rift: ['...A dead data-chip. Photos of my old crew on it. Can\'t read it here. I keep it anyway.'],
    lost: ['...Something of {lost}\'s. I\'ll not say what. I carry it everywhere.'],
  });
  wz('wiz.hat.birds', {
    _: ['Ha! Birds! Have they ever nested in it?', 'I\'ll watch for birds, next time you come.'],
    cheerful: ['Ha! A hat full of finches! I\'d pay to see that.'],
    ornery: ['Unhygienic, that is.'],
    shy: ['...I\'d like it if birds liked me.'],
    curious: ['Which birds? Starlings? Wrens? Do they ride on it?'],
    dreamy: ['They think it\'s a little mountain. Of course they do.'],
    witty: ['They think it\'s a roost with legs. They\'re not wrong.'],
    proud: ['A bird nested in my chimney. Very rare kind. Very particular.'],
    gloomy: ['Birds only ever do their business on me.'],
    child: ['A BIRD ON YOUR HAT! Do it! Make one land! Please?'],
    elder: ['My old hat had a robin on it one whole winter. Best company I had.'],
    rift: ['Birds are wild. We only had drones. Pigeons, sometimes. Mutant ones.'],
  });
  wz('wiz.hat.mind', {
    _: ['Then I\'ll mind it too. Even when it drips on my step.', 'I\'ll never laugh at the hat again. Much.'],
    cheerful: ['That\'s lovely. I\'ll tell everyone it\'s a precious hat. They\'ll be ever so careful.'],
    ornery: ['Hmph. Well. Mind you don\'t lose it, then.'],
    shy: ['...Thank you for telling me.'],
    curious: ['I\'ll ask you about her another day. When you\'re ready.'],
    dreamy: ['Some things are worth getting rained on for.'],
    witty: ['Very well. The hat is now officially exempt from jokes. Mostly.'],
    proud: ['Good. A thing well kept says a lot about a person.'],
    gloomy: ['...Some things are worth keeping. I suppose.'],
    child: ['I\'ll look after it if you ever need me to. I\'m very careful. Mostly.'],
    elder: ['Aye. Keep it. The things we keep keep us, in the end.'],
    rift: ['Understood. Some things you don\'t upgrade.'],
  });

  // --- The staff ---------------------------------------------------------------------------
  addThread({
    id: 'wiz.staff', theirs: true, label: 'They ask about your staff', cool: 5,
    ask: '{Name} is eyeing your staff.',
    beats: {
      start: { line: 'wiz.staff.q', go: [
        { ap: 'jest', say: 'Leaning on, mostly. It\'s a very good leaning stick.', to: 'lean' },
        { ap: 'tale', say: '*You tap the ground with it, and a small light wakes at its tip.*', label: 'Show them', to: 'light', fx: { run: magic('light') } },
        { ap: 'share', say: 'It\'s walked further than any hobbit ever has. I\'d be lost without it.', to: 'road' },
      ] },
      lean: { line: 'wiz.staff.lean', go: [
        { ap: 'ask', say: 'Have you a stick of your own?', to: 'stick' },
        { ap: 'tale', say: 'It does one or two other things. Watch the end.', to: 'light', fx: { run: magic('light') } },
      ] },
      light: { line: 'wiz.staff.light', fx: { drive: { bored: -0.1 } }, go: [
        { ap: 'warm', say: 'Would you like to hold it?', to: 'hold' },
        { ap: 'jest', say: 'It also does a very good impression of a candle. Ask me at bedtime.', to: 'candle' },
        { ap: 'share', say: 'It\'s the light I\'d want you to have, on a dark road.', to: 'dark', need: { open: 1 }, soft: true },
      ] },
      road: { line: 'wiz.staff.road', go: [
        { ap: 'ask', say: 'Where would you walk, if you had a staff like this?', to: 'walk' },
        { ap: 'warm', say: 'Would you like to hold it?', to: 'hold' },
      ] },
      stick: { line: 'wiz.staff.stick', go: [
        { ap: 'warm', say: 'Then it\'s a stick with a story. The best kind.', to: 'end' },
        { ap: 'jest', say: 'Bring it round. Our sticks can compare notes.', to: 'notes' },
      ] },
      hold: { line: 'wiz.staff.hold', fx: { fond: 0.02, joke: { k: 'wiz.staff.hold', t: '{Name} held the wizard\'s staff, and it hummed.' } }, go: [
        { ap: 'jest', say: 'Careful. It knows when it\'s held the wrong way up.', to: 'wrong' },
        { ap: 'warm', say: 'You hold it like you were born to it.', to: 'born' },
      ] },
      candle: { line: 'wiz.staff.candle', end: true },
      dark: { line: 'wiz.staff.dark', fx: { trust: 0.03 }, go: [
        { ap: 'comfort', say: 'Then remember this light, when it\'s dark. It\'s not far off.', to: 'remember' },
        { ap: 'ask', say: 'Is it the dark you mind, or what\'s in it?', to: 'fear', need: { open: 2 }, soft: true },
      ] },
      fear: { line: 'wiz.staff.fear', fx: { confide: { k: 'wiz.staff.fear', t: '{Name} is frightened of the dark, and has never told anyone' }, trust: 0.03 }, go: [
        { ap: 'comfort', say: 'Then I\'ll leave a little light on your step, of an evening. A small one.', to: 'remember', fx: { run: magic('light') } },
        { ap: 'share', say: 'So am I, sometimes. That\'s why I carry a light.', to: 'remember' },
      ] },
      walk: { line: 'wiz.staff.walk', go: [
        { ap: 'warm', say: 'Then I hope you get there. Take a stout stick.', to: 'end' },
        { ap: 'advise', say: 'Start with the next hill. That\'s how all roads start.', to: 'advised' },
      ] },
      notes: { line: 'wiz.staff.notes', end: true },
      wrong: { line: 'wiz.staff.wrong', end: true },
      born: { line: 'wiz.staff.born', end: true },
      remember: { line: 'wiz.staff.remember', fx: { fond: 0.03, remember: 'The wizard showed me the light on his staff.' }, end: true },
      advised: { line: 'wiz.staff.advised', fx: { respect: 0.02 }, end: true },
    },
  });
  wz('wiz.staff.q', {
    _: ['What\'s the stick for? Is it magic, or just for walking?', 'Can I ask about your staff? It\'s very knobbly.', 'Is that staff magic? It looks magic. It looks old.'],
    cheerful: ['What a staff! Does it do anything? Go on. Make it do a thing!'],
    ornery: ['What do you need a stick that size for? Beating off trolls?', 'You nearly had my eye out with that staff on the bridge.'],
    shy: ['...Is your stick very heavy?', '...Does your staff ever do anything? Sorry. Just wondering.'],
    curious: ['What\'s it made of? Ash? Oak? It doesn\'t look like any wood I know.', 'Is the staff where the magic lives, or does the magic live in you?'],
    dreamy: ['Your staff looks like it\'s been a tree in a story, once.', 'Does it remember being a tree, do you think?'],
    witty: ['That\'s a lot of stick for one wizard. Is it for leaning, or for emphasis?'],
    proud: ['My grandfather had a walking stick with a silver top. Finer than that. But that\'s a fine staff.'],
    gloomy: ['That staff must get heavy. Everything does, after a while.'],
    child: ['Is your stick a MAGIC WAND? It\'s too big to be a wand. Is it a BIG wand?', 'Can it shoot lightning? Can it? Please say yes.'],
    elder: ['That staff\'s older than me, I\'ll bet. It\'s got a look of the old oak about it.', 'I could do with a staff like that, for the hill. My knees, you know.'],
    rift: ['What\'s the power source on that? Can\'t find a port anywhere.', 'Is that staff a weapon, a tool, or an antenna? Asking for the Relay.'],
    woodwright: ['That\'s not wood from round here. The grain\'s all wrong. Where\'s it from?'],
  });
  wz('wiz.staff.lean', {
    _: ['Leaning! A wizard\'s staff, for leaning on!', 'Ha! Mine\'s a broom. Same idea.'],
    cheerful: ['Ha! Well, you\'ve got the knees for it. I mean that kindly.'],
    ornery: ['Leaning. I knew it. All show.'],
    shy: ['...I lean on things too. Walls, mostly.'],
    curious: ['Just leaning? But there must be a reason it\'s THAT stick and not another.'],
    dreamy: ['There\'s something lovely about a stick that\'s held you up for years.'],
    witty: ['Leaning. And looking mysterious while you do. The two go together.'],
    proud: ['A fine leaning stick is nothing to be ashamed of. My father leaned beautifully.'],
    gloomy: ['I could do with something to lean on.'],
    child: ['That\'s BORING. Make it do a magic.'],
    elder: ['Don\'t knock leaning. Leaning\'s half of getting old.'],
    rift: ['Oh. So it\'s a walking aid. Disappointing. Fine. Useful.'],
  });
  wz('wiz.staff.light', {
    _: ['Oh! It\'s glowing! It\'s like a little lamp!', 'A light! On the end of a stick! Like the lamplighter, only better.', 'Oh, it\'s warm. I can feel it from here.'],
    cheerful: ['Oh, that\'s BEAUTIFUL! Do it at the party! Do it at every party!'],
    ornery: ['Hmph. A light. We\'ve lamps for that.', 'Very clever. Mind it doesn\'t set your beard going.'],
    shy: ['*goes very quiet, watching the light*', '...Oh. It\'s so soft.'],
    curious: ['How does it work? Is it fire? It\'s not hot. Is it a sort of glow-worm?'],
    dreamy: ['It\'s like a star that\'s come down to sit on your stick.', 'It\'s the color of the first lamp on a winter evening.'],
    witty: ['So THAT\'S how you find the inn after dark.'],
    proud: ['Very good. I\'ve an excellent lamp at home, mind. Brass.'],
    gloomy: ['...That\'s the first nice light I\'ve seen in a while.'],
    child: ['WHOA! Do it again! Make it bigger! Make it PINK!'],
    elder: ['I\'ve seen that light before. When I was small and lost in the woods. Was that you?'],
    rift: ['No battery. No bulb. No anything. That\'s not physics, that\'s cheating.', 'Okay. Okay. That\'s cool. That\'s really cool.'],
    lamplighter: ['That\'d save me a lot of walking. Can you do all the lanes at once?'],
    night: ['In the dark like this it\'s like a lantern on a ship.'],
  });
  wz('wiz.staff.road', {
    _: ['Further than any hobbit? That\'s a long way.', 'Where has it been? Tell me one place.'],
    cheerful: ['Then it\'s the luckiest stick in the world!'],
    ornery: ['It\'s a stick. It went where you carried it.'],
    shy: ['...I\'ve never been past the bridge.'],
    curious: ['Have you counted? Miles? Leagues? Do you mark it on the wood?'],
    dreamy: ['If it could talk, the stories it would tell.'],
    witty: ['And still hasn\'t learned to walk on its own. Lazy stick.'],
    proud: ['My family walked here from the far hills, generations back. On foot. Without a magic stick.'],
    gloomy: ['And all that walking, and you end up back here. Funny, that.'],
    child: ['Has it been to the MOUNTAINS? Has it been to where the dragons live?'],
    elder: ['I used to walk. Every hill in this valley. Now it\'s the step and back.'],
    rift: ['I came further than that in a second. Through the rift. Didn\'t feel like traveling. Felt like falling.'],
  });
  wz('wiz.staff.stick', {
    _: ['I\'ve a stick by the door. My granddad cut it. It\'s seen better days. So have I.', 'Only an old blackthorn. Good for nettles.'],
    cheerful: ['I\'ve got a stick! It\'s got a duck\'s head on top. I named it Duncan.'],
    ornery: ['I\'ve a stick for poking cats off the wall. Works a treat.'],
    shy: ['...Only a little one. For walking in the woods. It\'s nothing special.'],
    curious: ['I\'ve a stick I found in the river. I\'ve carved a mark on it for every walk. Two hundred and four.'],
    dreamy: ['I found a hazel stick shaped like a lightning bolt once. I keep it by the bed.'],
    witty: ['I\'ve a stick. It\'s mostly for pointing at things I disapprove of. It\'s very busy.'],
    proud: ['My stick has a silver ferrule. It was my father\'s. Very well thought of, that stick.'],
    gloomy: ['I had one. It broke. Most things do.'],
    child: ['I\'ve got a stick! It\'s a sword! And a horse! And a fishing rod! It\'s a lot of things.'],
    elder: ['I\'ve three. One for good, one for mud and one for shaking at the young.'],
    rift: ['Not a stick. A collapsible baton. Carbon fiber. It doesn\'t collapse any more.'],
  });
  wz('wiz.staff.hold', {
    _: ['*takes it in both hands* It\'s warm! Why is it warm?', '*holds it, and goes very still* It\'s humming. Is it humming?', '*holds it up* Ooh. I feel taller. I feel ever so tall.'],
    cheerful: ['*waves it about* Look at me! Abracadabra! ...Nothing happened. Do it for me!'],
    ornery: ['*holds it at arm\'s length* There. Held it. Can I give it back now?'],
    shy: ['*holds it very carefully, as if it might break* ...It\'s lovely.'],
    curious: ['*runs a thumb along the grain* There are marks. Little marks. Like writing worn away.'],
    dreamy: ['*holds it, eyes shut* I can feel the road in it. All the roads.'],
    witty: ['*leans on it dramatically* How\'s this? Do I look mysterious? Wise? Overdue for a haircut?'],
    proud: ['*stands very straight with it* I think I carry it rather well. Rather well.'],
    gloomy: ['*holds it* ...Heavy. But a good heavy. Like a hand on your shoulder.'],
    child: ['*can barely lift it* I\'M A WIZARD! I\'M A WIZARD! Make the light come! Please!'],
    elder: ['*leans on it gratefully* Oh, that\'s better than my stick. Much better. Don\'t tell my stick.'],
    rift: ['*holds it up like a scanner* Faint vibration. Low frequency. I can\'t measure it. I want to.'],
  });
  wz('wiz.staff.candle', {
    _: ['Ha! A wizard\'s nightlight!', 'Bedtime! I\'ll know where to send the little ones.'],
    cheerful: ['Ha! Bring it round at bedtime! We\'ll all sit round it!'],
    ornery: ['Candles are cheaper.'],
    shy: ['...I\'d like a nightlight like that.'],
    curious: ['Does it go out by itself, or do you have to blow it?'],
    dreamy: ['I\'d fall asleep watching that light. Every night.'],
    witty: ['And when you read in bed, I suppose it turns the pages.'],
    proud: ['I use beeswax candles. The best. But that\'s very nice.'],
    gloomy: ['Bet it goes out right when you need it.'],
    child: ['Can I have one for my room? I\'m scared of the cupboard.'],
    elder: ['Saves on candles, at least. At my age you count candles.'],
    rift: ['A reading light with no wire. Patent it.'],
  });
  wz('wiz.staff.dark', {
    _: ['...I don\'t like dark roads. I never have.', 'That\'s a kind thing to say. Dark roads frighten me.'],
    cheerful: ['Oh! Well. I\'m not frightened of the dark. Not much. Not in summer.'],
    ornery: ['I\'m not afraid of the dark. The dark\'s afraid of me.'],
    shy: ['...I always run the last bit home after dark. Every time.'],
    curious: ['Do you ever need it? The light? On the road?'],
    dreamy: ['Dark roads have their own beauty. But a light is nice, all the same.'],
    witty: ['I\'d settle for a light on the way back from the Badger. That road\'s treacherous after three pints.'],
    proud: ['I\'ve walked every road in this valley in the dark. ...With a lantern.'],
    gloomy: ['Every road\'s dark, if you ask me. Some are just honest about it.'],
    child: ['I don\'t like the dark. The dark has things in it. Mom says it doesn\'t. Mom doesn\'t know.'],
    elder: ['When you\'re old, every night\'s a dark road. Thank you, wizard.'],
    rift: ['There was no dark back home. Not ever. Here the dark\'s so big. I still can\'t get used to it.'],
  });
  wz('wiz.staff.fear', {
    _: ['...What\'s in it. Or what might be. I know there\'s nothing. I know.', '...Both. Mostly what might be. I\'ve never said that out loud.'],
    cheerful: ['...I laugh so much in the daytime that nobody guesses. But at night. Well.'],
    ornery: ['...Don\'t you tell a soul. I sleep with a candle lit. Every night. There.'],
    shy: ['...I hear things. In the dark. I pull the blanket right over.'],
    curious: ['...Not knowing. That\'s what it is. In the light I can see everything. In the dark I can\'t.'],
    dreamy: ['...The dark is where the dreams come from. Not all of them are kind.'],
    witty: ['...It\'s silly. All right? Grown hobbit, frightened of a cupboard. Don\'t laugh.'],
    proud: ['...You\'ll keep this to yourself. I check under the bed. Every night. Since I was small.'],
    gloomy: ['...The quiet. In the dark you\'re alone with yourself. I\'m not good company.'],
    child: ['...The cupboard. There\'s something in it. It goes creak. Don\'t tell anyone.'],
    elder: ['...The last dark. You know the one. I think about it, at night.'],
    rift: ['...The silence. No hum. No light. I lie awake and think the world\'s been switched off.'],
  });
  wz('wiz.staff.walk', {
    _: ['Over the hills and far away, I suppose. Just to see.', 'To the sea. I\'ve never seen the sea.'],
    cheerful: ['Everywhere! And then back for tea.'],
    ornery: ['Nowhere. Why would I leave? Everything I need\'s here. Mostly.'],
    shy: ['...To the top of the hill, maybe. That\'s far enough.'],
    curious: ['East. Right to the edge of the maps. I want to see what\'s past the edge.'],
    dreamy: ['To where the elves sing. If there is such a place. I think there must be.'],
    witty: ['To the next inn, wherever that is, and then the one after.'],
    proud: ['To the Mountain. To see the dwarf-doors everyone talks of.'],
    gloomy: ['Somewhere it doesn\'t rain. If there is anywhere.'],
    child: ['To where the DRAGONS live! And the trolls! But only to look.'],
    elder: ['Back to the house I grew up in. It\'s gone now. But I\'d walk there all the same.'],
    rift: ['Back to the rift, and through, and home. Some nights. Other nights, nowhere.'],
    dream: ['I\'d walk anywhere that took me nearer to it. One day I\'d like to {dreamText}.'],
  });
  wz('wiz.staff.notes', {
    _: ['Ha! I will. Mine\'ll lose.', 'They\'ll have a lot to talk about. Mostly mud.'],
    cheerful: ['Ha! A stick party! I\'ll bring cake for the sticks.'],
    ornery: ['Sticks don\'t talk. You\'ve been on the road too long.'],
    shy: ['...Mine\'s shy too.'],
    curious: ['Do you think they would? Talk? In the night, when we\'re asleep?'],
    dreamy: ['I like to think they would. Quietly. About trees.'],
    witty: ['Yours would bore mine rigid. All those miles.'],
    proud: ['Mine has a silver top. It\'d hold its own.'],
    gloomy: ['Mine\'s not much of a talker.'],
    child: ['MY stick is a SWORD. It would win.'],
    elder: ['My stick\'s heard every complaint I\'ve ever had. It\'d have a lot to say.'],
    rift: ['A stick meet-up. Okay. Weirdest thing anyone\'s invited me to.'],
  });
  wz('wiz.staff.wrong', {
    _: ['*turns it round in a hurry* Which way\'s up?!', 'Ha! *hands it back very quickly*'],
    cheerful: ['Ha! *turns it upside down on purpose* There. Let\'s see what it does!'],
    ornery: ['Then take it back before it complains.'],
    shy: ['*hands it back at once, apologizing to the staff*'],
    curious: ['Which way IS up? Is there a top? How do you tell?'],
    dreamy: ['I\'ll hold it the way it wants, then. It\'ll tell me.'],
    witty: ['It\'s a stick. Both ends are the end.'],
    proud: ['I held it perfectly well, thank you.'],
    gloomy: ['Course I did. I do everything the wrong way up.'],
    child: ['*holds it upside down, then the right way, then upside down* Is THIS right?'],
    elder: ['At my age, I hold everything the wrong way up. Ask my spoons.'],
    rift: ['Polarity matters. Got it.'],
  });
  wz('wiz.staff.born', {
    _: ['Do I? ...Here, take it. Before I get ideas.', 'Born to it! Wait till I tell everyone.'],
    cheerful: ['I KNEW it! I\'m going to be a wizard! ...Can hobbits be wizards?'],
    ornery: ['Don\'t flatter me. Here.'],
    shy: ['...Really? *hands it back, glowing*'],
    curious: ['How can you tell? What does a born wizard hold it like?'],
    dreamy: ['Perhaps in some other life I was. Who knows.'],
    witty: ['I\'ve always said I was wasted on turnips.'],
    proud: ['I\'ve always had a certain bearing. People notice.'],
    gloomy: ['Born to it. Ha. Born to sweep the step, more like.'],
    child: ['I\'M GOING TO BE A WIZARD! MOM! MOM! I\'M A WIZARD!'],
    elder: ['Too late for me, wizard. But thank you.'],
    rift: ['Born to it. Back home I was a tech. Same thing, maybe.'],
  });
  wz('wiz.staff.remember', {
    _: ['...Thank you. I\'ll remember the light.', '...I\'ll think of it on the way home tonight.'],
    cheerful: ['Thank you, wizard. You\'re a dear. A tall, odd dear.'],
    ornery: ['...Hmph. Thank you. Don\'t make a fuss about it.'],
    shy: ['...Thank you. Nobody\'s ever... thank you.'],
    curious: ['...Thank you. I\'ll look for it. Out of the window.'],
    dreamy: ['I\'ll carry it with me. In my head. Like a little lamp.'],
    witty: ['...That\'s kind. You\'re not as daft as your hat.'],
    proud: ['...Well. Thank you. That\'s very decent of you.'],
    gloomy: ['...That helps more than you\'d think.'],
    child: ['Will it scare the cupboard? Thank you. You\'re the best wizard.'],
    elder: ['...Bless you, wizard. Bless you.'],
    rift: ['...A light that stays on. That\'s all I wanted, really. Thanks.'],
  });
  wz('wiz.staff.advised', {
    _: ['The next hill. Yes. That\'s not so very far.', 'You make it sound easy.'],
    cheerful: ['Tomorrow! I\'ll do the next hill tomorrow! With a picnic!'],
    ornery: ['I\'ve been up the next hill. It\'s just more hill.'],
    shy: ['...Maybe. If someone comes with me.'],
    curious: ['And then the hill after that. And see what\'s on the other side.'],
    dreamy: ['The next hill. And the one after. I can see it already.'],
    witty: ['And they say wizards never give a straight answer.'],
    proud: ['I\'ll be up it before you are. You\'ll see.'],
    gloomy: ['...Maybe. If it\'s not raining.'],
    child: ['I can climb a hill! I\'m a GOOD climber!'],
    elder: ['The next hill, at my age, is the one by the privy. But I take your point.'],
    rift: ['Incremental progress. Okay. I can do incremental.'],
  });

  // --- The beard ---------------------------------------------------------------------------
  addThread({
    id: 'wiz.beard', theirs: true, label: 'They ask about your beard', cool: 5,
    ask: '{Name} can\'t stop looking at your beard.',
    beats: {
      start: { line: 'wiz.beard.q', go: [
        { ap: 'jest', say: 'Long enough to tuck in my belt, and trip on twice a day.', to: 'trip' },
        { ap: 'ask', say: 'Why, are you thinking of growing one?', to: 'grow' },
        { ap: 'share', say: 'A wren nested in it once. I hadn\'t the heart to move her.', to: 'wren' },
      ] },
      trip: { line: 'wiz.beard.trip', go: [
        { ap: 'ask', say: 'Have you any advice for an old beard?', to: 'advice' },
        { ap: 'jest', say: 'I keep cookies in it too. In case.', to: 'crumbs' },
      ] },
      grow: { line: 'wiz.beard.grow', go: [
        { ap: 'warm', say: 'You\'d suit one. A fine, brushy one.', to: 'suit' },
        { ap: 'jest', say: 'Start now, and you\'ll have one by Yule. Next century\'s Yule.', to: 'yule' },
        { ap: 'ask', say: 'Have you any advice for mine, then?', to: 'advice' },
      ] },
      wren: { line: 'wiz.beard.wren', go: [
        { ap: 'share', say: 'She raised four chicks. I didn\'t shave for a year.', to: 'chicks' },
        { ap: 'ask', say: 'Would you have moved her?', to: 'move' },
      ] },
      advice: { line: 'wiz.beard.advice', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'I\'ll try it. Thank you, {name}.', to: 'thanks' },
        { ap: 'jest', say: 'The last hobbit who advised my beard ended up wearing it as a scarf.', to: 'scarf' },
      ] },
      crumbs: { line: 'wiz.beard.crumbs', fx: { joke: { k: 'wiz.beard.crumbs', t: 'The wizard keeps cookies in his beard.' } }, go: [
        { ap: 'warm', say: '*You find a cookie in your beard and offer it.*', label: 'Find one and offer it', to: 'offered', fx: { fond: 0.02 } },
        { ap: 'jest', say: 'I\'ve lost a spoon in there too. I\'ve stopped looking.', to: 'spoon' },
      ] },
      suit: { line: 'wiz.beard.suit', end: true },
      yule: { line: 'wiz.beard.yule', end: true },
      chicks: { line: 'wiz.beard.chicks', fx: { fond: 0.02 }, end: true },
      move: { line: 'wiz.beard.move', go: [
        { ap: 'warm', say: 'No. I\'d not have moved her either.', to: 'chicks' },
        { ap: 'jest', say: 'She paid rent in song. Very fair terms.', to: 'chicks' },
      ] },
      thanks: { line: 'wiz.beard.thanks', fx: { respect: 0.01 }, end: true },
      scarf: { line: 'wiz.beard.scarf', end: true },
      offered: { line: 'wiz.beard.offered', end: true },
      spoon: { line: 'wiz.beard.spoon', end: true },
    },
  });
  wz('wiz.beard.q', {
    _: ['How long\'s your beard? When you stand up straight?', 'Do you ever comb that beard? Honestly?', 'Is your beard as long as it looks, or is some of it robe?'],
    cheerful: ['Your beard! It\'s magnificent! Can I touch it? Is that weird? It\'s weird.'],
    ornery: ['That beard wants trimming. It\'s been in the soup, I\'ll bet.', 'You\'re trailing your beard in the mud, you know.'],
    shy: ['...Your beard\'s very long. Sorry. That\'s all.'],
    curious: ['How long does a beard like that take? Is it a year a foot? Do you measure?'],
    dreamy: ['Your beard looks like a waterfall in winter.'],
    witty: ['That beard\'s got more gray in it than the sky in November.', 'Does the beard come off with the hat, or is it a set?'],
    proud: ['My grandfather had a beard like that. He won prizes. Hobbits don\'t usually, you know.'],
    gloomy: ['Doesn\'t it itch? I\'d go mad.'],
    child: ['Can I pull your beard? Just a little bit? Is it real?', 'Is there anything living in your beard? Like a mouse?', 'Your beard is longer than my whole ARM!'],
    elder: ['Your beard was gray when I was young. Mine\'s just started. Hobbits hardly do beards, you know.'],
    rift: ['How much does that beard weigh? Rough estimate. I\'m curious.', 'Back home everyone had laser-trimmed everything. That\'s a real beard. Respect.'],
    herbalist: ['That beard could do with a rinse of rosemary. I could do you a bottle.'],
  });
  wz('wiz.beard.trip', {
    _: ['Twice a day! Ha! Only twice?', 'Ha! I\'ve seen you do it. On the step of the Badger.'],
    cheerful: ['Ha! Oh, I\'d pay to see that! Do it now!'],
    ornery: ['Then cut it. Simple. Some folk make everything hard.'],
    shy: ['...I trip on things too. Mostly my own feet.'],
    curious: ['Which foot catches it? Left or right? Have you tried a knot?'],
    dreamy: ['There\'s something lovely about a beard you trip on. It\'s like being followed by your own history.'],
    witty: ['A beard with ambitions. It wants to get there first.'],
    proud: ['I\'d never let anything of mine trip me. Not even my beard.'],
    gloomy: ['Something always trips you, in the end.'],
    child: ['HAHAHA! You fall over your BEARD!'],
    elder: ['I trip over my own slippers. It\'s the age, not the beard.'],
    rift: ['Design flaw. Have you thought about a clip?'],
  });
  wz('wiz.beard.grow', {
    _: ['Me? Hobbits don\'t do beards. Not proper ones.', 'I tried once. It came out like a hedgehog had sat on my chin.'],
    cheerful: ['Ooh, I\'d love one! I\'d braid it! With ribbons!'],
    ornery: ['Hobbits with beards. Whatever next. Dwarves in the Badger?'],
    shy: ['...I\'d like one. To hide behind.'],
    curious: ['Can hobbits grow them? I\'ve seen one or two. Is it the diet? The weather?'],
    dreamy: ['I\'d grow one long enough for birds, like yours. A beard full of birdsong.'],
    witty: ['I\'ve been growing one for years. It\'s very shy.'],
    proud: ['My family grows excellent beards. When we try. We mostly don\'t try.'],
    gloomy: ['I\'d only get crumbs in it.'],
    child: ['Can GIRLS have beards? Can I have a beard? A blue one?', 'I\'m going to have the LONGEST beard. Longer than yours. It\'ll go to the river.'],
    elder: ['At my age the beard grows wherever it likes. Mostly in my ears.'],
    rift: ['In the city beards were modular. Clip-on. Light-up ones for parties.'],
  });
  wz('wiz.beard.wren', {
    _: ['A WREN? In your beard? You\'re making that up.', 'Oh, that\'s lovely. I don\'t believe a word of it. It\'s lovely.'],
    cheerful: ['A bird in your beard! I love that! I LOVE that!'],
    ornery: ['That\'s not lovely, that\'s filthy.', 'Hmph. Did she pay rent?'],
    shy: ['...You let her stay. That\'s kind.'],
    curious: ['How long did she stay? Where did you sleep? Did you sleep sitting up?'],
    dreamy: ['That\'s the most beautiful thing I\'ve ever heard about a beard.'],
    witty: ['Was it a wren, or was it a very small dragon you didn\'t want to upset?'],
    proud: ['A wren nested in our hedge for three years. Very loyal birds, wrens.'],
    gloomy: ['Birds never nest near me. They know.'],
    child: ['A BIRD lived in your BEARD? Did it sing? Did it poo? Did it?'],
    elder: ['Ha! I believe it. I\'ve seen what lives in my thatch.'],
    rift: ['A living nest. In your face hair. That\'s the most organic thing I\'ve heard all week.'],
  });
  wz('wiz.beard.advice', {
    _: ['Comb it with a bit of goose fat. Gran swore by it.', 'Braid it, in the wet. Keeps the mud off.', 'Tuck it in your belt at the bridge. That\'s where the wind gets up.'],
    cheerful: ['Ribbons! A ribbon at the end. A red one. Then everyone sees you coming!'],
    ornery: ['A pair of shears and five minutes. That\'s my advice.'],
    shy: ['...A beard-net? Like for hair? I could make you one.'],
    curious: ['Have you tried oil? Which kind? Walnut? Linseed? I\'d like to test them all.'],
    dreamy: ['Brush it out under the moon. My grandma said that\'s when hair grows kindest.'],
    witty: ['Teach it to sit. A well-trained beard\'s a joy.'],
    proud: ['Our family uses a bone comb. Hand-carved. I could lend you it. Carefully.'],
    gloomy: ['Don\'t bother. It\'ll only get rained on.'],
    child: ['Put it in a ponytail! Like Mom\'s! I can do it! I\'m good at ponytails!'],
    elder: ['Wash it in rainwater, dry it by the fire, and never, ever let a child near it.'],
    rift: ['Static brush. We had those. Plug it in, and every hair stands to attention.'],
    herbalist: ['Rosemary oil and a nettle rinse. I\'ll make you a bottle. You\'ll smell like a herb bed.'],
    knitting: ['A beard-cozy! I\'ll knit you one! For winter! In gray, to match!'],
    baker: ['Keep it out of the dough, is all I ask. I found one in a loaf once. Not yours, I hope.'],
  });
  wz('wiz.beard.crumbs', {
    _: ['Cookies! In your beard! I knew it smelled of shortbread.', 'Ha! That explains the birds.'],
    cheerful: ['Ha! I\'m checking next time. I\'ll have a cookie out of there.'],
    ornery: ['That\'s how you get mice.'],
    shy: ['...Really? What kind?'],
    curious: ['How do they stay in? Is there a pocket? Is it a beard-pocket?'],
    dreamy: ['A beard full of cookies. That\'s a beard for a long road.'],
    witty: ['A wizard with a larder in his beard. You\'ve thought of everything.'],
    proud: ['I keep my cookies in a tin. Like a civilized hobbit.'],
    gloomy: ['Soggy ones, I\'ll bet.'],
    child: ['CAN I HAVE ONE? Can I find one? I\'ll look! Hold still!'],
    elder: ['Very sensible. I keep humbugs in my sleeve. Same principle.'],
    rift: ['Integrated storage. Okay, that\'s actually genius.'],
  });
  wz('wiz.beard.suit', {
    _: ['Do you think? ...No. My mother would have fits.', 'Brushy! Ha! I\'ll think about it.'],
    cheerful: ['I\'m going to do it! I\'m going to be the first hobbit with a wizard beard!'],
    ornery: ['I\'d look like a gorse bush.'],
    shy: ['...Maybe a small one.'],
    curious: ['How long before folk would notice? A week? A month? I\'ll keep a chart.'],
    dreamy: ['Me, with a long gray beard, sitting on a hill. I can see it.'],
    witty: ['A fine brushy one. To match my fine brushy personality.'],
    proud: ['I\'d grow a better one than most, I expect.'],
    gloomy: ['It\'d come in patchy. Everything does.'],
    child: ['I\'m going to grow one TONIGHT.'],
    elder: ['Too late for that, wizard. Mine\'s sprouting where it pleases.'],
    rift: ['I\'ll put it on my list. After \'find a charger\'.'],
  });
  wz('wiz.beard.yule', {
    _: ['Ha! I\'ll start tonight, then.', 'Next century! Cheek!'],
    cheerful: ['Then I\'ll have the BEST beard at the Yule of the year two thousand and something!'],
    ornery: ['Cheek. I could grow one by spring if I felt like it.'],
    shy: ['...I\'ll be old by then. Like you. Sorry. Not old. You know.'],
    curious: ['Is that true? A century? Have you measured how fast yours grows?'],
    dreamy: ['A beard that takes a hundred years. That\'s a patient sort of thing.'],
    witty: ['Then I\'ll leave it to my grandchildren. They can grow it in shifts.'],
    proud: ['I\'d do it in fifty. Our family\'s quick at everything.'],
    gloomy: ['I\'ll not see next century. Not at this rate.'],
    child: ['I can wait! I\'m good at waiting! ...How long\'s a century?'],
    elder: ['I\'ll be pushing up daisies by then. Daisies with beards.'],
    rift: ['Next century. Okay. Setting a reminder.'],
  });
  wz('wiz.beard.chicks', {
    _: ['Four chicks! In your beard! Oh, I\'ll tell everyone.', 'A year! Folk must have thought you very odd. Odder.'],
    cheerful: ['Four! Did they sing? Did they all sit in a row? I want to have been there!'],
    ornery: ['Soft, you are. Soft as butter.', 'And I suppose they\'re all wizards now.'],
    shy: ['...You were very kind to them.'],
    curious: ['Did they fledge from your beard? Did they fly off your chin?'],
    dreamy: ['They flew off into the world from a wizard\'s beard. What a way to start.'],
    witty: ['And you never once sneezed? That\'s the real magic.'],
    proud: ['Very good of you. Very proper. That\'s how you treat a guest.'],
    gloomy: ['And then they flew off, I expect. They always do.'],
    child: ['I WANT A BIRD IN MY HAIR!'],
    elder: ['That\'s a kindness, that is. The old world was full of kindnesses like that.'],
    rift: ['That\'s the softest thing a wizard\'s ever told me. Not that I know many wizards.'],
  });
  wz('wiz.beard.move', {
    _: ['No! Never! You can\'t move a nesting bird. Everybody knows that.', 'I\'d have moved her. Gently. To a hat.'],
    cheerful: ['Never! I\'d have let her stay for ever!'],
    ornery: ['In a heartbeat. Beards are for chins.'],
    shy: ['...No. I\'d have kept very still.'],
    curious: ['Could you even? Without breaking the nest? What\'s a beard-nest made of?'],
    dreamy: ['No. Some things choose you. You don\'t argue.'],
    witty: ['Moved her? I\'d have charged her rent.'],
    proud: ['A guest is a guest. You make them comfortable. Even in a beard.'],
    gloomy: ['She\'d only have come back. They always do, the ones you don\'t want.'],
    child: ['NO! She was your PET!'],
    elder: ['No. We never moved a nesting bird in this valley. Bad luck for a year.'],
    rift: ['No. I\'d have stuck a camera on her. Live feed. Beard-cam.'],
  });
  wz('wiz.beard.thanks', {
    _: ['You\'re welcome. Come back and show me.', 'I\'ll be checking, mind.'],
    cheerful: ['Ooh, I can\'t wait to see! You\'ll be the smartest wizard on the road!'],
    ornery: ['Hmph. You won\'t.'],
    shy: ['...You will? Oh.'],
    curious: ['Tell me how it goes. Take notes. Before and after.'],
    dreamy: ['It\'ll shine. You\'ll see.'],
    witty: ['If it works, I want my name on it. The {Name} Method.'],
    proud: ['It\'ll work. My advice always does.'],
    gloomy: ['Don\'t blame me if it goes green.'],
    child: ['I\'m going to check! I\'m going to check EVERY time!'],
    elder: ['Good lad. Listen to your elders. Ha! Listen to me.'],
    rift: ['Report back. I want data.'],
  });
  wz('wiz.beard.scarf', {
    _: ['Ha! A beard scarf. That\'s one way to keep warm.', 'You\'re making that up.'],
    cheerful: ['Ha! I\'d wear it! In winter! It\'d be lovely and warm!'],
    ornery: ['Disgusting. I take it all back.'],
    shy: ['...I\'ll keep my advice to myself, then.'],
    curious: ['Is that true? How long was the scarf?'],
    dreamy: ['A gray scarf that remembers being a wizard\'s beard. That\'s a story.'],
    witty: ['A scarf made of advice. Very warming. Very itchy.'],
    proud: ['I\'d have advised better.'],
    gloomy: ['Course they did.'],
    child: ['EWWW! A BEARD SCARF!'],
    elder: ['Ha! I\'ll keep my advice and my neck, thank you.'],
    rift: ['Recycled beard. Sustainable. We\'d have loved that back home.'],
  });
  wz('wiz.beard.offered', {
    _: ['*takes it, inspects it, eats it* ...It\'s actually quite good.', 'From your beard! Oh, I can\'t. ...Oh, go on.'],
    cheerful: ['A BEARD COOKIE! *eats it at once* Best cookie ever!'],
    ornery: ['I will not eat a cookie from your beard. *eats it* Hmph.'],
    shy: ['*takes it, and keeps it in a pocket for later*'],
    curious: ['*turns it over* Ginger. From Bree, I\'d say. Two weeks old. Am I right?'],
    dreamy: ['*holds it up to the light* A cookie that\'s been on the road with you. I\'ll treasure it. And then eat it.'],
    witty: ['I\'ll eat it, but I\'m telling everyone where it came from.'],
    proud: ['Thank you. I\'ll eat it later. In private.'],
    gloomy: ['*eats it* ...That\'s cheered me up. Of all things.'],
    child: ['*eats it in one go* MORE! Is there more in there? Can I look?'],
    elder: ['Ha! *takes it* Haven\'t had a beard cookie since the Old Took\'s day.'],
    rift: ['*eats it* Organic. Unprocessed. Tastes like... pipe-weed. And kindness.'],
  });
  wz('wiz.beard.spoon', {
    _: ['A SPOON! How do you lose a spoon in a beard?', 'Ha! If I find it, can I keep it?'],
    cheerful: ['Ha! A spoon! Let me look! I\'ll find it! I\'m good at finding!'],
    ornery: ['That\'s disgusting. And that\'s where my spoon went, last time you came for tea.'],
    shy: ['...I\'d help you look. If you wanted.'],
    curious: ['What kind of spoon? Wooden? Silver? Is there a whole drawer in there?'],
    dreamy: ['A spoon in a beard. Somewhere in there, the spoon\'s having an adventure.'],
    witty: ['A beard with cutlery. You\'re a whole kitchen, aren\'t you.'],
    proud: ['I\'ve never lost a spoon in my life. We count them on Highdays.'],
    gloomy: ['That\'ll be gone for ever, then. Like my good spoon.'],
    child: ['A SPOON? Let me find it! Let me LOOK! *peers into the beard*'],
    elder: ['I lost my teeth once. Found them in the bread box. So I understand.'],
    rift: ['I could build you a metal detector. For your beard. Genuinely.'],
  });

  // --- The wagon and the horse -------------------------------------------------------------
  addThread({
    id: 'wiz.wagon', theirs: true, label: 'They ask about your wagon and horse', cool: 5,
    ask: '{Name} nods toward your wagon by the party field.',
    beats: {
      start: { line: 'wiz.wagon.q', go: [
        { ap: 'jest', say: 'She has a name. She\'s never seen fit to tell me it.', to: 'name' },
        { ap: 'warm', say: 'Would you like to come and meet her?', to: 'meet' },
        { ap: 'share', say: 'The wagon\'s the nearest thing I have to a home.', to: 'home' },
      ] },
      name: { line: 'wiz.wagon.name', go: [
        { ap: 'warm', say: 'I\'ll put it to her. She may say yes.', to: 'named' },
        { ap: 'jest', say: 'She\'d want something with more dignity. She\'s very grand.', to: 'grand' },
        { ap: 'ask', say: 'Have you animals of your own?', to: 'animals' },
      ] },
      meet: { line: 'wiz.wagon.meet', fx: { fond: 0.02, drive: { bored: -0.1 } }, go: [
        { ap: 'ask', say: 'She likes apples, if you\'ve one about you.', to: 'apple' },
        { ap: 'jest', say: 'Mind her. She bites wizards. Only wizards.', to: 'bites' },
        { ap: 'share', say: 'She\'s pulled that wagon further than I can count. I owe her everything.', to: 'owes' },
      ] },
      home: { line: 'wiz.wagon.home', go: [
        { ap: 'ask', say: 'And what would you keep, if your home were a wagon?', to: 'keep' },
        { ap: 'warm', say: 'It\'s home enough, with a valley like this to stop in.', to: 'stop' },
        { ap: 'share', say: 'Some nights, on the road, I\'d give a great deal for a round door.', to: 'door', need: { open: 1 }, soft: true },
      ] },
      named: { line: 'wiz.wagon.named', fx: { joke: { k: 'wiz.wagon.name', t: '{Name} has a name for your horse. She hasn\'t said yes yet.' }, fond: 0.02 }, end: true },
      grand: { line: 'wiz.wagon.grand', end: true },
      animals: { line: 'wiz.wagon.animals', fx: { fond: 0.01 }, go: [
        { ap: 'warm', say: 'They\'re lucky in you.', to: 'end' },
        { ap: 'jest', say: 'Bring them round. My horse could do with the company. She finds me very dull.', to: 'end' },
      ] },
      apple: { line: 'wiz.wagon.apple', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'She\'ll remember you now. Horses never forget an apple.', to: 'friend' },
        { ap: 'jest', say: 'Now she\'ll follow you home. You\'ve only yourself to blame.', to: 'follow' },
      ] },
      bites: { line: 'wiz.wagon.bites', end: true },
      owes: { line: 'wiz.wagon.owes', fx: { trust: 0.02 }, end: true },
      keep: { line: 'wiz.wagon.keep', fx: { fond: 0.01 }, end: true },
      stop: { line: 'wiz.wagon.stop', fx: { fond: 0.02 }, end: true },
      door: { line: 'wiz.wagon.door', fx: { trust: 0.03 }, go: [
        { ap: 'warm', say: 'That\'s very kind. I\'ll knock one day. Tea, and nothing grand.', to: 'tea', fx: { promise: { k: 'wiz.visit.tea', t: 'You said you\'d come to {name}\'s for tea', days: 4 } } },
        { ap: 'jest', say: 'Careful. Wizards who come for tea stay for a hundred years.', to: 'stay' },
      ] },
      friend: { line: 'wiz.wagon.friend', end: true },
      follow: { line: 'wiz.wagon.follow', end: true },
      tea: { line: 'wiz.wagon.tea', end: true },
      stay: { line: 'wiz.wagon.stay', end: true },
    },
  });
  wz('wiz.wagon.q', {
    _: ['Is that your wagon by the party field? What\'s your horse called?', 'How far does your old horse pull that wagon in a day?', 'Do you sleep in that wagon? Isn\'t it cold?'],
    cheerful: ['I saw your horse! She\'s lovely! What\'s her name? Does she like hats?'],
    ornery: ['Your horse has been at my hedge. I\'ll say no more.', 'That wagon\'s parked on the best bit of grass in the valley. Did you know?'],
    shy: ['...I gave your horse a carrot. I hope that\'s all right.', '...Your horse looks kind.'],
    curious: ['What\'s in all those crates? How many are there? Do you count them?', 'How old\'s your horse? Do wizard horses live longer? Is she a bit magic?'],
    dreamy: ['Your wagon looks like it\'s been everywhere. Even the places that aren\'t on maps.'],
    witty: ['Your horse looks more sensible than you. No offense. Mostly to the horse.'],
    proud: ['We keep a very fine pony at our place. Very fine. Your horse is... sturdy.'],
    gloomy: ['That wagon looks lonely, out there on its own at night.'],
    child: ['Can I ride your HORSE? Please? Just to the bridge?', 'What\'s your horse CALLED? Is she magic? Can she fly?'],
    elder: ['I remember your wagon coming up the road when I was a nipper. Same wagon. Different horse?'],
    rift: ['A horse-powered vehicle. Actual horse. I\'m still not over it.', 'What\'s the range on that thing? Per apple?'],
    herder: ['That horse wants her hooves seen to. I could do it, if you like.'],
    orchardist: ['Your horse has been eyeing my apples. She has good taste.'],
  });
  wz('wiz.wagon.name', {
    _: ['Never told you? After all these years? Then you\'ll have to guess.', 'Then we should give her one. Something proper.'],
    cheerful: ['Then call her Buttercup! Or Clover! Or Sir Trots-a-Lot!'],
    ornery: ['A horse with no name. Typical wizard. Call her Horse.'],
    shy: ['...I\'d call her Willow. She looks like a Willow.'],
    curious: ['But how do you call her, then? Do you whistle? Is there a word?'],
    dreamy: ['Perhaps she has a secret name. A horse name, that only horses know.'],
    witty: ['Very wise of her. Once you tell a wizard your name, he\'s never off your doorstep.'],
    proud: ['Our pony is called Lord Bramblesworth the Third. You could have the Fourth.'],
    gloomy: ['Nobody ever asked her, I expect.'],
    child: ['SPARKLES! Call her SPARKLES! Or Princess Hoof!'],
    elder: ['We had a mare called Old Meg. Best horse in the valley. Call her Meg.'],
    rift: ['Give her a call-sign. Echo-One. Grey Rider. Something with a number.'],
  });
  wz('wiz.wagon.meet', {
    _: ['Oh, could I? She\'s very big. Is she friendly?', '*goes up to the horse very slowly* Hello, girl. Hello.'],
    cheerful: ['YES! *runs to the wagon* Hello, horse! Hello! You\'re beautiful!'],
    ornery: ['I\'ve met horses. They\'re all teeth and opinions. ...Fine. Just a quick hello.'],
    shy: ['*stands very still while the horse sniffs their hair* ...She likes me. I think she likes me.'],
    curious: ['*looks in her ears, at her hooves, at her teeth* She\'s very old. Very healthy. How?'],
    dreamy: ['*rests a cheek against her neck* She smells of hay and far away.'],
    witty: ['She\'s looking at me like I owe her money.'],
    proud: ['A fine animal. Not as fine as ours. But fine.'],
    gloomy: ['She looks tired. I know how she feels.'],
    child: ['SHE\'S SO BIG! Her nose is SOFT! She SNEEZED on me!'],
    elder: ['Ah, she\'s a beauty. Haven\'t stroked a horse in years.'],
    rift: ['*very carefully pats the horse* It\'s warm. It\'s alive. It\'s breathing on me. Okay.'],
  });
  wz('wiz.wagon.home', {
    _: ['A wagon for a home. Doesn\'t it rattle?', 'No round door? No pantry? No garden? Oh, you poor thing.'],
    cheerful: ['Oh, but it must be fun! A new view every morning!'],
    ornery: ['A home on wheels. Sounds like a home that can\'t make up its mind.'],
    shy: ['...I\'d like a little home on wheels. Somewhere small to hide.'],
    curious: ['What\'s inside? Is there a bed? A stove? Where do you keep the fireworks?'],
    dreamy: ['A home that takes you places. That\'s the dream, isn\'t it.'],
    witty: ['And when the neighbors get noisy, you just drive off. Clever.'],
    proud: ['Our home\'s been in the family nine generations. Built into the hill. Doesn\'t move an inch.'],
    gloomy: ['No proper home. That\'s sad. Even I have a proper home.'],
    child: ['A house with WHEELS! Can I sleep in it? Just once?'],
    elder: ['A home is where you hang your hat, my mother said. And your hat\'s everywhere.'],
    rift: ['Mobile habitat. Respect. I lived in a pod the size of that crate.'],
    homeless: ['...At least you\'ve got a wagon. I\'ve got a hedge.'],
  });
  wz('wiz.wagon.named', {
    _: ['Ask her nicely. Tell her it\'s from me.', 'If she says yes, I want to be the first to call her it.'],
    cheerful: ['Ooh, tell me what she says! Tell me straight away!'],
    ornery: ['She won\'t. Horses never do what you want.'],
    shy: ['...Tell her I said hello.'],
    curious: ['How will you know if she says yes? A nod? A whinny? A look?'],
    dreamy: ['If she likes it, she\'ll go a bit faster on the road. You\'ll see.'],
    witty: ['And if she says no, I\'ve a list. A long list.'],
    proud: ['She\'d be honored. It\'s a very good name.'],
    gloomy: ['She\'ll say no. Nobody says yes to me.'],
    child: ['She\'ll say YES! I KNOW she will!'],
    elder: ['Old Meg would be proud. Tell her that.'],
    rift: ['Pending approval. Ping me when she replies.'],
  });
  wz('wiz.wagon.grand', {
    _: ['Very grand! Then she\'ll want a very grand name.', 'Grand, is she? With that mane?'],
    cheerful: ['Lady Thistledown of the Long Road! There!'],
    ornery: ['She\'s a cart-horse, wizard.'],
    shy: ['...Princess, then. Quietly.'],
    curious: ['What makes a horse grand? Is it the walk? The nose?'],
    dreamy: ['She walks like a queen who\'s forgotten she\'s a queen.'],
    witty: ['Grander than you, certainly. She doesn\'t wear that hat.'],
    proud: ['I can tell. She holds her head like a hobbit of good family.'],
    gloomy: ['Everything\'s grander than me.'],
    child: ['Queen Horse! Queen Horse the Magnificent!'],
    elder: ['Grand? She\'s got mud to her knees. But she carries it grandly, I\'ll give her that.'],
    rift: ['Premium model. Got it.'],
  });
  wz('wiz.wagon.animals', {
    _: ['A cat, and the hens. The hens think they own the place.', 'Only a goat that won\'t be told. She eats my washing.'],
    cheerful: ['Three hens, a cat and a frog that lives under the step! I love them all!'],
    ornery: ['A cat. She hates everyone but me. Sensible cat.'],
    shy: ['...A cat. She sleeps on my feet. It\'s nice.'],
    curious: ['Bees! Well, they\'re not mine exactly. I just watch them. A lot.'],
    dreamy: ['A blackbird comes to my sill every morning. I think she\'s mine. She thinks I\'m hers.'],
    witty: ['A cat. Or rather, I belong to a cat. It\'s very clear on that.'],
    proud: ['We keep the best laying hens on the lane. Prize-winning.'],
    gloomy: ['I had a dog. He was old. I don\'t want to talk about it.'],
    child: ['I have a SNAIL. His name is Gerald. He\'s very fast for a snail.', 'I want a puppy. Mom says no. Will you tell Mom yes?'],
    elder: ['Just the old cat now. We\'re much of an age, the cat and me.'],
    rift: ['Back home I had a robot cat. Here there\'s a real one that keeps visiting. It\'s better.'],
    herder: ['Sheep, cows and pigs, all day long. And a dog who thinks he\'s in charge.'],
  });
  wz('wiz.wagon.apple', {
    _: ['*holds out an apple on a flat hand* There you go, girl. Gently.', 'I\'ve one in my pocket! *she takes it, very politely*'],
    cheerful: ['*gives her the apple and laughs as she crunches* She\'s got manners!'],
    ornery: ['*gives her the apple* There. Now leave my hedge alone.'],
    shy: ['*holds out the apple with a shaky hand, and she takes it softly*'],
    curious: ['*watches her eat* Do horses taste things the way we do? She looks like she does.'],
    dreamy: ['*gives her the apple* There. Now we\'re friends, you and me.'],
    witty: ['*gives the apple* That\'s a bribe, horse. I\'ll want a favor back.'],
    proud: ['*gives her the best apple* Only the best, for a guest.'],
    gloomy: ['*gives her the apple* ...She liked it. Something liked something I did.'],
    child: ['*holds the apple up high* Here, horsey! HERE! She took it! She TOOK it!'],
    elder: ['*gives her an apple from the cardigan pocket* Always keep an apple for a horse. Old rule.'],
    rift: ['*offers the apple at arm\'s length* Is this right? Is this how... oh. Okay. Good horse.'],
    orchardist: ['*gives her a Russet* Best eating apple in the valley. She knows quality.'],
  });
  wz('wiz.wagon.bites', {
    _: ['Only wizards! Then I\'m safe.', 'Ha! I\'d bite you too, if I had to pull your wagon.'],
    cheerful: ['Ha! A wizard-biting horse! I love her even more!'],
    ornery: ['Sensible horse.'],
    shy: ['*keeps a careful distance anyway*'],
    curious: ['Only wizards? How does she know? Is it the hat? The smell?'],
    dreamy: ['She bites you because she loves you. That\'s horse for hello.'],
    witty: ['I\'m beginning to like this horse a great deal.'],
    proud: ['Ours only bites tinkers.'],
    gloomy: ['She\'d bite me. Everything does.'],
    child: ['Make her bite you! I want to see!'],
    elder: ['Old Meg bit the Thain once. We were so proud.'],
    rift: ['Species-specific targeting. Impressive.'],
  });
  wz('wiz.wagon.owes', {
    _: ['That\'s nice. That you think of her like that.', 'Then you\'d best bring her the best hay in the valley.'],
    cheerful: ['Then she\'s getting all my apples. ALL of them.'],
    ornery: ['Then get her a better wagon. That one\'s held together with string.'],
    shy: ['...She knows. I think she knows.'],
    curious: ['How far? Roughly? There must be a number.'],
    dreamy: ['She\'s been your friend all this time. Your quiet, patient friend.'],
    witty: ['And she\'s never once asked for wages. You\'ve got a bargain there.'],
    proud: ['Loyalty. That\'s the best thing in an animal. Or a hobbit.'],
    gloomy: ['And one day she\'ll be too old. And then what?'],
    child: ['I\'ll give her my pudding. All of it. Well. Half.'],
    elder: ['Aye. You don\'t forget the ones who carried you.'],
    rift: ['That\'s a good partnership. I had one of those. Before.'],
  });
  wz('wiz.wagon.keep', {
    _: ['A kettle. Everything else is extra. Maybe a pan.', 'My good blanket, and a jar of pickles, and a book I\'ve read twice.'],
    cheerful: ['A fiddle, and enough cake for a month, and a lot of very bright cushions!'],
    ornery: ['Nothing. I\'d not live in a wagon. ...My good chair. Maybe.'],
    shy: ['...A little lamp. And a lot of blankets. And a curtain I could pull.'],
    curious: ['A map of everywhere, and a book to write down everything I saw.'],
    dreamy: ['A window in the roof, so I could see the stars from bed.'],
    witty: ['A spare wizard. In case the first one broke.'],
    proud: ['My family portraits. All of them. On the walls. Very straight.'],
    gloomy: ['An umbrella. You know why.'],
    child: ['My snail. And candy. And a SWORD.'],
    elder: ['My letters. Seventy years of them. And a good stout pair of slippers.'],
    rift: ['A solar panel. A kettle. And a way home.'],
    spouse: ['{Spouse}. Wherever {spouse} is, that\'s home enough. Don\'t tell {spouse} I said that.'],
  });
  wz('wiz.wagon.stop', {
    _: ['Then stop here as long as you like.', 'You\'re always welcome here. Wagon and all.'],
    cheerful: ['Then stay! Stay for ever! We\'ll build you a wagon-shed!'],
    ornery: ['Just keep it off the good grass.'],
    shy: ['...I\'m glad you stop here.'],
    curious: ['Is it really? Out of everywhere you\'ve been?'],
    dreamy: ['Then this is your harbor. Every wagon needs a harbor.'],
    witty: ['Flattery will get you a cup of tea. A small one.'],
    proud: ['Of course it is. Best valley there is.'],
    gloomy: ['...That\'s nice. That you think so.'],
    child: ['STAY FOR EVER!'],
    elder: ['Aye. It\'s home enough for me, too.'],
    rift: ['Same. Strange how fast a place becomes home.'],
  });
  wz('wiz.wagon.door', {
    _: ['...Then knock on mine. Whenever you like. I mean it.', 'You\'d be welcome at mine. There\'s always a kettle on.'],
    cheerful: ['Then come to ours! For supper! Tonight! There\'s always room!'],
    ornery: ['...Hmph. Well. Mine\'s round. Knock if you must.'],
    shy: ['...You could come to mine. If you wanted. It\'s small.'],
    curious: ['Then why not stop? For good? Is it a wizard rule?'],
    dreamy: ['A round door, a fire and somebody waiting. That\'s all anyone wants.'],
    witty: ['Take mine. I\'ll swap you. A round door for a wagon. I\'ll throw in the cat.'],
    proud: ['You\'d be very welcome at ours. Our door\'s the finest on the lane.'],
    gloomy: ['...You can share mine. It\'s not much. But it shuts.'],
    child: ['You can live in MY room! I\'ll go on the floor!'],
    elder: ['Come and sit by my fire any night. I\'ve more chairs than company these days.'],
    rift: ['...Same. Some nights I\'d give anything for a door that\'s mine. Even a round one.'],
    homeless: ['...I know that feeling. I\'d give a great deal for any door.'],
  });
  wz('wiz.wagon.friend', {
    _: ['She\'s nuzzling me! She\'s nuzzling me!', 'I\'ll bring her one every time you come.'],
    cheerful: ['Best friends! Me and the horse! Tell everyone!'],
    ornery: ['Hmph. As long as she remembers to stay off my hedge.'],
    shy: ['...I\'ve a friend. A big one.'],
    curious: ['Do horses really never forget? Is that true, or a saying?'],
    dreamy: ['Then she\'ll think of me, on the road. That\'s lovely.'],
    witty: ['Wonderful. A horse I owe apples to for life.'],
    proud: ['Of course she will. I gave her a very good apple.'],
    gloomy: ['...Something remembers me. Good.'],
    child: ['She\'s MY horse now! Half mine! A quarter mine!'],
    elder: ['Ha! Then I\'ve one more friend than I had this morning.'],
    rift: ['Memory backed up. In a horse. Okay.'],
  });
  wz('wiz.wagon.follow', {
    _: ['Ha! Then I\'ll have a horse and you\'ll have a wagon with no puller.', 'She\'s welcome. She can sleep in the shed.'],
    cheerful: ['Good! I\'ll keep her! I\'ll make her a hat!'],
    ornery: ['She\'d best not. I\'ve nowhere to put a horse.'],
    shy: ['...I\'d like that, a bit.'],
    curious: ['Would she, though? Has she done that before?'],
    dreamy: ['Me and a gray horse, walking home together. Like a story.'],
    witty: ['You\'d never get her back. I\'d feed her too well.'],
    proud: ['She\'d be very well kept at ours.'],
    gloomy: ['She wouldn\'t. Nothing follows me.'],
    child: ['YES! She can sleep in my bed!'],
    elder: ['At my age I\'d be glad of the company.'],
    rift: ['A stray horse. Okay. I\'ll set up a feed for her.'],
  });
  wz('wiz.wagon.tea', {
    _: ['I\'ll hold you to that. Seed-cake and all.', 'Tea, and nothing grand. I\'ll get the good cups out anyway.'],
    cheerful: ['Oh, I\'ll bake! I\'ll bake everything!'],
    ornery: ['Don\'t be late. I know what you\'re like.'],
    shy: ['...I\'ll tidy up. I\'ll tidy everything.'],
    curious: ['When? Which day? I want to be ready.'],
    dreamy: ['I\'ll put a candle in the window, so you know which door.'],
    witty: ['Nothing grand. I\'ll hide the silver, then.'],
    proud: ['Our tea is very well thought of. You\'ll see.'],
    gloomy: ['You won\'t come. They never come. ...Will you?'],
    child: ['A TEA PARTY! With the WIZARD! I\'ll set out my bears!'],
    elder: ['I\'ll be here. I\'m always here, these days.'],
    rift: ['Calendar\'s clear. It\'s always clear. Come whenever.'],
  });
  wz('wiz.wagon.stay', {
    _: ['Ha! I\'d not mind. You could mind the hens.', 'A hundred years! Then bring your own cup.'],
    cheerful: ['Good! Stay a hundred years! Stay two hundred!'],
    ornery: ['Then you\'re not coming for tea.'],
    shy: ['...I wouldn\'t mind.'],
    curious: ['Has that happened? Did someone have a wizard for a hundred years?'],
    dreamy: ['A hundred years of tea. Imagine the stories.'],
    witty: ['Then I\'ll charge rent. Starting from the first cookie.'],
    proud: ['We could manage a hundred years. We\'ve the room.'],
    gloomy: ['A hundred years. I\'ll not last that long.'],
    child: ['STAY A HUNDRED YEARS! STAY A MILLION!'],
    elder: ['I\'ll not see a hundred years. But you\'re welcome to the next few.'],
    rift: ['Long-term guest. Okay. Need a spare bunk.'],
  });

  // --- What does a wizard eat? -----------------------------------------------------------
  addThread({
    id: 'wiz.eats', theirs: true, label: 'They ask what a wizard eats', cool: 4,
    ask: '{Name} looks you up and down, as if you might be peckish.',
    beats: {
      start: { line: 'wiz.eats.q', go: [
        { ap: 'jest', say: 'Mushrooms. Stolen ones, ideally. They taste better.', to: 'mushrooms' },
        { ap: 'share', say: 'Whatever I\'m given. On the road, often nothing at all.', to: 'nothing' },
        { ap: 'ask', say: 'Why? What are you offering?', to: 'offer' },
      ] },
      mushrooms: { line: 'wiz.eats.mushrooms', go: [
        { ap: 'ask', say: 'And where would a wizard find the best mushrooms, round here?', to: 'spot', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'I\'ve been chased off more farms than I\'ve had hot dinners.', to: 'chased' },
        { ap: 'warm', say: 'I\'d trade a tale for a plate of them. Any day.', to: 'offer' },
      ] },
      nothing: { line: 'wiz.eats.nothing', go: [
        { ap: 'warm', say: 'I\'d never say no to a hobbit\'s table.', to: 'offer' },
        { ap: 'jest', say: 'Wizards run on pipe-weed and stubbornness. Mostly stubbornness.', to: 'pipe' },
      ] },
      offer: { line: 'wiz.eats.offer', go: [
        { ap: 'warm', say: 'I accept, with all my heart and most of my stomach.', to: 'accept' },
        { ap: 'jest', say: 'Only if there\'s seconds. And thirds. I\'m a growing wizard.', to: 'seconds' },
        { ap: 'ask', say: 'Did you make it yourself?', to: 'made' },
      ] },
      spot: { line: 'wiz.eats.spot', fx: { confide: { k: 'wiz.eats.spot', t: '{Name} told you where the best mushrooms grow, and made you swear', secret: true }, trust: 0.02 }, go: [
        { ap: 'warm', say: 'Not a word. I\'ll take one and leave the rest.', to: 'sworn', fx: { promise: { k: 'secret.wiz.mushrooms', t: 'You swore to keep {name}\'s mushroom patch secret', days: 20 } } },
        { ap: 'jest', say: 'I shall tell only the horse. She can\'t abide mushrooms.', to: 'sworn' },
      ] },
      chased: { line: 'wiz.eats.chased', go: [
        { ap: 'warm', say: 'If I\'d been asked to supper, I\'d never have had to steal.', to: 'offer' },
        { ap: 'jest', say: 'The dogs know me by name now. They\'re very polite about it.', to: 'dogs' },
      ] },
      pipe: { line: 'wiz.eats.pipe', go: [
        { ap: 'warm', say: 'Then perhaps you\'d feed a stubborn wizard?', to: 'offer' },
        { ap: 'jest', say: 'Second breakfast, though. I\'ve picked that up from you lot.', to: 'second' },
      ] },
      accept: { line: 'wiz.eats.accept', fx: { owe: -1, fond: 0.03, note: '{Name} fed you.' }, end: true },
      seconds: { line: 'wiz.eats.seconds', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'Then I accept, gratefully.', to: 'accept' },
        { ap: 'jest', say: 'Fourths, then, and we\'ll say no more about it.', to: 'accept' },
      ] },
      made: { line: 'wiz.eats.made', go: [
        { ap: 'warm', say: 'Then I\'ll eat it with twice the pleasure.', to: 'accept' },
        { ap: 'ask', say: 'Whose recipe is it?', to: 'recipe' },
      ] },
      sworn: { line: 'wiz.eats.sworn', end: true },
      dogs: { line: 'wiz.eats.dogs', end: true },
      second: { line: 'wiz.eats.second', end: true },
      recipe: { line: 'wiz.eats.recipe', fx: { trust: 0.02, owe: -1 }, end: true },
    },
  });
  wz('wiz.eats.q', {
    _: ['What does a wizard eat? You never seem to eat.', 'Do wizards eat proper food? Or just smoke and starlight?', 'When did you last have a proper meal, wizard?'],
    cheerful: ['What\'s a wizard\'s favorite food? Mine\'s everything!', 'Do you like pie? Everyone likes pie. Wizards must like pie.'],
    ornery: ['You\'re thin as a rake. Doesn\'t anyone feed you?', 'Do you eat, or do you just turn up at other folk\'s suppers?'],
    shy: ['...Do you get hungry? You never look hungry.', '...Would you like something to eat? Sorry. You probably have food.'],
    curious: ['What do wizards eat? Is it different? Do you need more, for the magic?'],
    dreamy: ['I imagine wizards eating honey and moonlight. Is it like that?'],
    witty: ['How many breakfasts does a wizard have? One? That explains a great deal.'],
    proud: ['Have you ever eaten a proper hobbit supper? A really proper one? Ours, say?'],
    gloomy: ['You look like you\'ve not eaten in a week. Nobody looks after you.'],
    child: ['What\'s your favorite food? Is it frogs? Do wizards eat FROGS?', 'Do you eat dragon eggs? For breakfast? On toast?'],
    elder: ['You never put on a pound, all these years. What\'s your secret? Don\'t say walking.'],
    rift: ['What\'s your fuel? Back home it was nutrient paste. Gray. Tasted gray.'],
    hungry: ['I\'m starving. Are you starving? You look starving.'],
    baker: ['Do wizards like seed-cake? I\'ve one cooling now.'],
    innkeeper: ['You never order at the Badger. What do wizards eat, then?'],
  });
  wz('wiz.eats.mushrooms', {
    _: ['Stolen mushrooms! Ha! You and every hobbit since the beginning of time.', 'Mushrooms! Now you\'re talking. Butter, a pinch of salt, and nothing else.'],
    cheerful: ['Ha! Mushrooms! With bacon! And more mushrooms!'],
    ornery: ['Stolen. I knew it. Well, keep off my patch.'],
    shy: ['...I like mushrooms too. I pick them early, before anyone\'s up.'],
    curious: ['Which kind? The flat ones? The little buttons? The ones that grow in rings?'],
    dreamy: ['Mushrooms in the morning mist. Best thing about autumn.'],
    witty: ['Stolen ones taste better because you eat them running. Builds an appetite.'],
    proud: ['Our mushrooms are the best in the valley. Not that I\'d tell you where.'],
    gloomy: ['Somebody always gets there first.'],
    child: ['I don\'t like mushrooms. They\'re SLIMY. Do wizards eat slimy things?'],
    elder: ['Ha! I stole a basket off old Maggot\'s field in my youth. Dogs on me all the way home.'],
    rift: ['Mushrooms. Fungi. You eat fungi here. Raw. On purpose. Okay.'],
    autumn: ['It\'s the season for them! I found a ring of them by the river this morning.'],
  });
  wz('wiz.eats.nothing', {
    _: ['NOTHING? Oh, you poor thing. Come here this minute.', 'Nothing! That\'s not right. That\'s not right at all.'],
    cheerful: ['Nothing! Well, that\'s fixed! You\'re coming for supper!'],
    ornery: ['Nothing. Well. That\'s no way to live. Even for a wizard.'],
    shy: ['...I\'ve a bun in my pocket. It\'s a bit squashed.'],
    curious: ['How long can a wizard go without eating? Have you ever tested it?'],
    dreamy: ['All those miles, and nobody to cook for you.'],
    witty: ['Nothing at all? That\'s the saddest thing I\'ve heard since the ale ran out at Yule.'],
    proud: ['That would never happen at our table. Never.'],
    gloomy: ['I know how that is. Some weeks.'],
    child: ['You can have my dinner! Not my pudding. My dinner.'],
    elder: ['When I was a girl we fed every traveler who passed. Every one. Things have slipped.'],
    rift: ['Same, first week here. Then a hill-hobbit fed me soup. Changed everything.'],
    hungry: ['Nothing! And here\'s me moaning, and I had breakfast. Twice.'],
  });
  wz('wiz.eats.offer', {
    _: ['Supper! At ours! There\'s a stew going and enough for ten.', 'There\'s bread and cheese and a jar of my pickles, if you\'ll have it.'],
    cheerful: ['Everything! Come to ours! There\'s pie and stew and jam roly-poly!'],
    ornery: ['Bread and dripping. It\'s good enough for me, it\'s good enough for wizards.'],
    shy: ['...There\'s soup. It\'s only soup. It\'s quite good soup.'],
    curious: ['I\'ve been trying a new pie. Ham and apple. You can be my first taster.'],
    dreamy: ['Honey cakes. I make them at night when I can\'t sleep. There\'s always honey cakes.'],
    witty: ['Mushrooms, obviously. Paid for. Very boring. But hot.'],
    proud: ['Roast pork, crackling and all. Our crackling is spoken of.'],
    gloomy: ['There\'s only potatoes. Again. But you\'re welcome to them.'],
    child: ['I can make you jam sandwiches! I\'m very good at jam sandwiches!'],
    elder: ['There\'s a rabbit pie. I always make too much. Habit, from when the house was full.'],
    rift: ['I can make you noodles. The hill-folk think they\'re worms. They\'re not worms.'],
    baker: ['Seed-cake, still warm. And a loaf, if you\'ve a pocket for it.'],
    innkeeper: ['A bowl of the Badger\'s stew. On the house. Don\'t tell the regulars.'],
    fisher: ['Trout, caught this morning. Fried in butter. You\'ve not lived till you\'ve had it.'],
    orchardist: ['Apples, of course. Baked, with honey. From the orchard, picked today.'],
    brewer: ['Bread, cheese and a jug of my best. Mostly the jug.'],
    herder: ['Cheese! Our cheese! Six months old. It\'ll make your beard curl.'],
    farmer: ['New bread, from our own barley. And butter. And more butter.'],
    miller: ['Bread made from my own flour. You can taste the difference. I can, anyway.'],
  });
  wz('wiz.eats.spot', {
    _: ['...Swear you won\'t tell. Down by the old willow, where the bank\'s soft. Under the dock leaves.', '...Behind the mill, by the wall. The shady bit. Swear it.'],
    cheerful: ['...Oh, I shouldn\'t! ...The field past the bridge, in the dip. Swear you won\'t tell!'],
    ornery: ['...If this gets out I\'ll know who. The ring of oaks on the north hill. There.'],
    shy: ['...I\'ve never told anyone. The edge of the beech wood. Where the moss is.'],
    curious: ['...I\'ve mapped them. All of them. But the best is under the old pear. Swear.'],
    dreamy: ['...There\'s a fairy ring past the pond. They come up overnight, after rain. Swear.'],
    witty: ['...I\'ll tell you, and then I\'ll have to feed you to the horse. The bottom of the long meadow.'],
    proud: ['...On our own land, of course. The far corner. Best in the valley. Not a word.'],
    gloomy: ['...By the churchyard wall. Nobody goes there. That\'s why.'],
    child: ['...I KNOW A PLACE. Behind the hen house. Don\'t tell Mom. She\'d eat them all.'],
    elder: ['...My grandmother\'s spot. Sixty years I\'ve kept it. By the stone with the hole in.'],
    rift: ['...I tagged them with a marker. Under the rift scar. They glow a bit. Is that bad?'],
  });
  wz('wiz.eats.chased', {
    _: ['Ha! Serves you right. Every farmer in the valley has a story about you.', 'Chased! A great wizard, chased by dogs.'],
    cheerful: ['Ha! I\'d have loved to see that! Robe flapping and all!'],
    ornery: ['Good. A wizard should knock first.'],
    shy: ['...Dogs frighten me too.'],
    curious: ['How fast can a wizard run? With the hat? Have you lost the hat?'],
    dreamy: ['A wizard running through a moonlit field with an armful of mushrooms. What a sight.'],
    witty: ['More farms than hot dinners. That explains why you\'re so thin.'],
    proud: ['Nobody\'s ever stolen from our fields. Not once. ...That I know of.'],
    gloomy: ['I always get caught too. You never get away with anything.'],
    child: ['Did the dogs BITE you? Did they get your BUM?'],
    elder: ['Ha! Maggot\'s dogs. Grip, Fang and Wolf. Terrors, all three.'],
    rift: ['Security systems with teeth. Okay. Respect.'],
  });
  wz('wiz.eats.pipe', {
    _: ['Stubbornness isn\'t food, wizard.', 'Pipe-weed! You\'ll waste away.'],
    cheerful: ['Ha! Well, I\'ve plenty of stubbornness. Shall I bake you some?'],
    ornery: ['That I believe. The stubbornness.'],
    shy: ['...I don\'t think that\'s enough.'],
    curious: ['Is that true? Is there something in the pipe-weed that keeps you going?'],
    dreamy: ['Pipe-weed and stubbornness. You should put that on your door.'],
    witty: ['And where do you get your stubbornness? Bree? I hear it\'s cheap there.'],
    proud: ['Good leaf, though. The best leaf comes from here, you know.'],
    gloomy: ['Mostly stubbornness. Same.'],
    child: ['You can\'t eat SMOKE!'],
    elder: ['That\'s how my old dad lived. Eighty years on pipe-weed and stubbornness.'],
    rift: ['Back home we\'d call that a stimulant diet. Not recommended.'],
  });
  wz('wiz.eats.accept', {
    _: ['Good! Tonight, then. Don\'t be late.', 'Then come hungry. Very hungry.', 'I\'ll lay an extra place. A long one, for the beard.'],
    cheerful: ['YES! I\'ll tell everyone! The wizard\'s coming to supper!'],
    ornery: ['Fine. Wipe your feet. And take that hat off at the table.'],
    shy: ['...Oh! Good. I\'ll... I\'ll make extra. Lots of extra.'],
    curious: ['Good! And you can tell me what wizards like, and I\'ll write it down.'],
    dreamy: ['A wizard at my table. Like something from a song.'],
    witty: ['Most of your stomach. I\'ll cook for that, then. Most of it.'],
    proud: ['You\'ll not get a better supper in the valley. You\'ll see.'],
    gloomy: ['...Really? You will? Well. I\'ll get the good plates out.'],
    child: ['I\'ll make you a jam sandwich! The wizard\'s having MY sandwich!'],
    elder: ['Good. It\'ll be nice to cook for two again.'],
    rift: ['Good. Dinner guest. First one I\'ve had. Ever. Here or there.'],
  });
  wz('wiz.eats.seconds', {
    _: ['Thirds! There\'s always thirds in this valley.', 'A growing wizard! Ha! There\'s plenty.'],
    cheerful: ['Fourths! Fifths! We\'ll roll you home!'],
    ornery: ['Seconds if you clear your plate. Wizard or no.'],
    shy: ['...I\'ll make sure there\'s enough. More than enough.'],
    curious: ['How much CAN a wizard eat? I\'d like to find out. For science.'],
    dreamy: ['Seconds of everything. That\'s what a feast is for.'],
    witty: ['Growing? Upwards, I hope. You\'ve run out of room sideways.'],
    proud: ['At ours, nobody leaves with room to spare. It\'s a point of pride.'],
    gloomy: ['There won\'t be seconds. There\'s never seconds. ...There might be seconds.'],
    child: ['You can have MY seconds! Not my pudding seconds.'],
    elder: ['Ha! A wizard after my own heart. I always cook for an army.'],
    rift: ['Seconds. Thirds. Here they just keep giving you food. It\'s incredible.'],
  });
  wz('wiz.eats.made', {
    _: ['Every bit. Since breakfast. Well, second breakfast.', 'With my own hands. Burned one thumb.'],
    cheerful: ['All of it! I sang to it while it cooked! It\'s a happy pie!'],
    ornery: ['Who else would? There\'s nobody else in my kitchen worth trusting.'],
    shy: ['...Yes. It\'s not very good. It\'s quite good. It\'s all right.'],
    curious: ['I did! I changed the recipe. Twice. I\'m trying a third.'],
    dreamy: ['I did. I always cook slowly. I think about things while I stir.'],
    witty: ['No, a passing dragon did. Of course I did.'],
    proud: ['Naturally. We\'ve never once bought a pie in this house.'],
    gloomy: ['I did. Don\'t expect much.'],
    child: ['I helped! I did the stirring! And the licking the spoon!'],
    elder: ['Seventy years I\'ve been making that. It\'s about right now.'],
    rift: ['I did. Still learning hill-cooking. No microwaves. Fire. Actual fire.'],
  });
  wz('wiz.eats.sworn', {
    _: ['Good. I\'ll know if you tell.', 'Then go, before I change my mind.'],
    cheerful: ['Ha! Good! Now you\'re one of the mushroom folk!'],
    ornery: ['You\'d better. I\'ll check.'],
    shy: ['...Thank you. That\'s my favorite place.'],
    curious: ['And tell me if you find any I\'ve missed.'],
    dreamy: ['Go at dawn. That\'s when they\'re best. When the mist\'s still on them.'],
    witty: ['The horse is sworn too, then. She looks discreet.'],
    proud: ['A wizard\'s word. That\'s worth something, I suppose.'],
    gloomy: ['...You\'re the only one I\'ve told.'],
    child: ['PINKY SWEAR! You have to pinky swear! ...Your pinky is huge.'],
    elder: ['Good. Some things should be passed on. Carefully.'],
    rift: ['Classified. Need-to-know. Good.'],
  });
  wz('wiz.eats.dogs', {
    _: ['Ha! Polite dogs! I\'d like to see that.', 'Wizards. Even the dogs give up on you.'],
    cheerful: ['Ha! Do they wave? Do they say hello wizard?'],
    ornery: ['I\'ll get a dog.'],
    shy: ['...I wish dogs were polite to me.'],
    curious: ['Do they really know your name? How?'],
    dreamy: ['Old dogs, old wizard. Friends at last.'],
    witty: ['They\'re only polite because they\'ve tasted your robe.'],
    proud: ['Our dog would never be so soft.'],
    gloomy: ['Even dogs like you more than me.'],
    child: ['Can you make dogs be polite to ME?'],
    elder: ['Ha! Dogs know a regular when they see one.'],
    rift: ['Biometric recognition. In a dog. Okay.'],
  });
  wz('wiz.eats.second', {
    _: ['Second breakfast! Ha! We\'ll make a hobbit of you yet.', 'Good. Elevenses next. Then we\'ll talk.'],
    cheerful: ['Ha! And luncheon! And afternoon tea! And dinner! You\'re learning!'],
    ornery: ['Ha. Next you\'ll be wanting elevenses.'],
    shy: ['...Second breakfast is the best one.'],
    curious: ['Which do you like better? First or second? Be honest.'],
    dreamy: ['Second breakfast, in the sun, with nowhere to be. That\'s the good life.'],
    witty: ['The first step is admitting it. Next, elevenses.'],
    proud: ['We invented it, you know. Hobbits. Everyone else just copies.'],
    gloomy: ['Second breakfast is the only thing that gets me through the morning.'],
    child: ['I have SIX breakfasts. Mom only knows about two.'],
    elder: ['It\'s about time you learned. Took you long enough.'],
    rift: ['Two breakfasts. I thought they were joking. They\'re not joking.'],
  });
  wz('wiz.eats.recipe', {
    _: ['My mother\'s. And hers before. I\'ve only changed the salt.', 'My gran\'s. She\'d never write it down. I watched her a hundred times.'],
    cheerful: ['Mine! I made it up! Mostly by accident!'],
    ornery: ['Mine. And it\'s staying mine.'],
    shy: ['...My dad\'s. He used to make it when I was sad.'],
    curious: ['Three recipes, really. I took the best bits of each. I keep notes.'],
    dreamy: ['My grandmother\'s. When I make it, the kitchen smells like her.'],
    witty: ['An ancient family recipe. Ancient as last Thursday.'],
    proud: ['A family recipe, nine generations old. The finest.'],
    gloomy: ['My mother\'s. She\'s gone now. I make it on her birthday.'],
    child: ['My MOM\'S! It\'s a secret! But I know some of it!'],
    elder: ['Mine, now. I\'ve made it longer than anyone else alive.'],
    rift: ['A hill-hobbit taught me. It\'s my first recipe that isn\'t from a packet.'],
  });

  // --- Ask me anything ---------------------------------------------------------------------
  // Each temper asks its own question, and every answer and reaction is keyed the same way
  // (the rift-born outrank their temper here, so the question and answers stay matched).
  addThread({
    id: 'wiz.any', label: 'Ask me anything', weight: 0.8, cool: 6,
    when: (F) => F.met && F.talks >= 2,
    open: { warm: 'wiz.any.open' },
    beats: {
      start: { line: 'wiz.any.q', go: [
        { ap: 'tale', say: 'wiz.any.say.tale', to: 'tale' },
        { ap: 'jest', say: 'wiz.any.say.jest', to: 'jest' },
        { ap: 'share', say: 'wiz.any.say.share', to: 'honest', need: { open: 1 }, soft: true },
      ] },
      tale: { line: 'wiz.any.tale', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'Another? Go on. You\'ve earned it.', to: 'more' },
        { ap: 'ask', say: 'Now I ask you one. If a wizard could grant it, what would you wish for?', to: 'turn' },
      ] },
      jest: { line: 'wiz.any.jest', go: [
        { ap: 'share', say: 'wiz.any.say.share', label: 'Answer it properly', to: 'honest' },
        { ap: 'ask', say: 'Now I ask you one. If a wizard could grant it, what would you wish for?', to: 'turn' },
      ] },
      honest: { line: 'wiz.any.honest', fx: { trust: 0.03, respect: 0.02 }, go: [
        { ap: 'warm', say: 'Another? Go on. You\'ve earned it.', to: 'more' },
        { ap: 'ask', say: 'Now I ask you one. If a wizard could grant it, what would you wish for?', to: 'turn' },
      ] },
      more: { line: 'wiz.any.more', go: [
        { ap: 'jest', say: 'wiz.any.say.more.jest', to: 'done' },
        { ap: 'share', say: 'wiz.any.say.more.share', to: 'done', fx: { trust: 0.02 } },
      ] },
      turn: { line: 'wiz.any.turn', fx: { learn: ['wish', '{wishText}'], fond: 0.01 }, go: [
        { ap: 'warm', say: 'I\'ll keep that in mind. A wizard\'s mind is very roomy.', to: 'done' },
        { ap: 'jest', say: 'Noted. I shall write it on my hat.', to: 'done' },
      ] },
      done: { line: 'wiz.any.done', end: true },
    },
    end: { fond: 0.02 },
  });
  wz('wiz.any.open', {
    _: ['You may ask me one question, {name}. Anything at all.', 'One question, {name}. Any you like. I\'ll answer it true.', 'Ask me something, {name}. Wizards get very dull, never being asked.'],
    child: ['You can ask me ONE question, {name}. Anything. Make it a good one.'],
    rift: ['Ask me one thing, {name}. Anything. No signal needed.'],
  });
  wz('wiz.any.q', {
    _: ['Anything? Oh. Then... why us? Of everywhere, why do you keep coming here?'],
    cheerful: ['Anything? Ooh. What\'s the best party you\'ve ever been to? In your whole life?'],
    ornery: ['All right. Why do wizards meddle? Straight answer, mind.'],
    shy: ['...Do you like it here? With us? Really?'],
    curious: ['What\'s on the other side of the Sea? Truly? Not the story version.'],
    dreamy: ['What do the stars sound like? Up close? I\'ve always wanted to know.'],
    witty: ['Why is a wizard never late? Is it a rule, or just a very good excuse?'],
    proud: ['Am I in any of your tales? Will I be, one day?'],
    gloomy: ['Will it all be all right? In the end? You\'d know, if anyone would.'],
    child: ['Can you FLY? Really really fly? Not on an eagle. On your own.'],
    'rift!': ['Is magic just tech nobody\'s explained yet? Be honest.'],
  });
  wz('wiz.any.say.tale', {
    _: ['Once, long ago, I found a valley where the folk knew how to be happy. I\'ve been coming back to learn.'],
    cheerful: ['The Old Took\'s hundred-and-tenth. A pig got into the cake, and the pig danced, and so did I.'],
    ornery: ['Once a friend of mine said nothing when he should have spoken. A town burned. So now I meddle.'],
    shy: ['Once I sat on this very hill in the rain, and a small hobbit brought me a blanket. I never forgot it.'],
    curious: ['An elf once told me: past the Sea, the road goes straight, and the light never quite goes out.'],
    dreamy: ['On the highest pass I ever crossed, the stars were so close I heard them. Like bells, far off, in snow.'],
    witty: ['I was late once. In the year of the Long Frost. I\'ve made up for it with very dramatic arrivals since.'],
    proud: ['There\'s a tale I tell of a hobbit who stood firm when the wolves came. I may add a chapter.'],
    gloomy: ['Once, in the Fell Winter, I thought nothing would ever be well again. Then spring came. It always has.'],
    child: ['Once I jumped off a cliff and flapped very hard. I didn\'t fly. I landed in a bush. That\'s the tale.'],
    'rift!': ['Once I met a tinker who said magic and making were cousins who\'d fallen out. He may have been right.'],
  });
  wz('wiz.any.say.jest', {
    _: ['Because nowhere else has seed-cake like yours. That\'s the whole secret.'],
    cheerful: ['This one. Probably. It\'s not over yet, and the night is young.'],
    ornery: ['Because you lot are so very good at needing it.'],
    shy: ['Like it? I\'ve bribed the horse to keep coming back. She hasn\'t noticed.'],
    curious: ['More sea. Then a very damp elf. Then some more sea.'],
    dreamy: ['Rather like the Badger at closing time. A lot of twinkling, and someone singing badly.'],
    witty: ['A wizard is never late. Everyone else is simply early.'],
    proud: ['Oh, you\'re in all of them. You\'re the troll. Every time.'],
    gloomy: ['Of course it will. Or else it isn\'t the end yet.'],
    child: ['Only on Tuesdays, and only when nobody\'s looking. So you\'ll never see it.'],
    'rift!': ['Magic is tech that remembered its manners.'],
  });
  wz('wiz.any.say.share', {
    _: ['Because I\'m happy here. Wizards aren\'t, often. I come to remember how it\'s done.'],
    cheerful: ['Truly? A small one, in a hill parlor, with nobody important there at all. I think it was yours.'],
    ornery: ['Because sometimes the world needs a push, and I\'d rather it were a gentle one. I get it wrong, too.'],
    shy: ['Yes. Very much. This is the place I think of on cold nights on the road.'],
    curious: ['I don\'t know. Nobody comes back to say. I\'d like to think it\'s somewhere kind.'],
    dreamy: ['Quieter than you\'d think. Like snow falling on snow. You feel it more than hear it.'],
    witty: ['It\'s a very good excuse. And I\'ve been early. Once. It was awful. Nobody had the kettle on.'],
    proud: ['You are now. I\'ll tell of the hobbit who asked to be in a tale. That\'s a fine start to any tale.'],
    gloomy: ['I don\'t know. Nobody does. But I\'ve seen it come right more often than not.'],
    child: ['No. I can\'t fly. I wish I could. But I know some eagles, and that\'s nearly as good.'],
    'rift!': ['Some of it, maybe. But some of it\'s older than any machine, and it isn\'t for explaining.'],
  });
  wz('wiz.any.tale', {
    _: ['...That\'s a lovely answer. Not an answer at all, but lovely.'],
    cheerful: ['A dancing pig! Ha! I wish I\'d been there! Was the cake all right?'],
    ornery: ['...Hmph. Well. I suppose that\'s a reason. Of sorts.'],
    shy: ['...Was that... was that one of us? With the blanket?'],
    curious: ['The road goes straight? Straight where? Did he say how far? Did you ask him?'],
    dreamy: ['Bells in the snow. Oh. I\'ll hear that every time I look up now.'],
    witty: ['Very dramatic arrivals. Yes. I\'ve seen them. The hat helps.'],
    proud: ['A chapter! About me? You\'ll get my name right, won\'t you? Both bits?'],
    gloomy: ['Spring came. ...It always has, hasn\'t it. I forget that.'],
    child: ['A BUSH! HAHAHA! You landed in a BUSH!'],
    'rift!': ['Cousins who fell out. I like that. Maybe we can get them talking again.'],
  });
  wz('wiz.any.jest', {
    _: ['Ha! That\'s not an answer, that\'s flattery. ...Keep going.'],
    cheerful: ['Ha! Then we\'ll make tonight the best! Fetch the fiddle!'],
    ornery: ['Cheek! Some of us need it a great deal less than others.'],
    shy: ['*laughs, very quietly*'],
    curious: ['A damp elf! That\'s not a real answer. ...Is it?'],
    dreamy: ['Ha! That\'s not what I meant at all. ...But it is a bit like that.'],
    witty: ['Oh, that\'s good. I\'m stealing that. Everyone else is simply early!'],
    proud: ['The TROLL! I am not the troll!'],
    gloomy: ['...Ha. That\'s almost comforting. Almost.'],
    child: ['I\'ll watch EVERY Tuesday! I\'ll catch you!'],
    'rift!': ['Tech with manners. Ha. That\'s going on the Relay.'],
  });
  wz('wiz.any.honest', {
    _: ['...Oh. I didn\'t expect a true answer. Thank you.'],
    cheerful: ['Mine? Was it really mine? Oh, I\'m going to cry. In a good way.'],
    ornery: ['...You get it wrong too? Well. That\'s more honest than most.'],
    shy: ['...On cold nights? Here? ...Oh.'],
    curious: ['You don\'t know? I didn\'t think there was anything you didn\'t know.'],
    dreamy: ['Snow falling on snow. That\'s exactly how I hoped it would be.'],
    witty: ['Nobody had the kettle on. That\'s the worst thing that\'s ever happened to anyone.'],
    proud: ['The hobbit who asked to be in a tale. ...I\'ll take it.'],
    gloomy: ['More often than not. ...I can live with more often than not.'],
    child: ['You CAN\'T fly? ...But EAGLES! You know EAGLES!'],
    'rift!': ['Older than any machine. Okay. That\'s scarier than I wanted. And better.'],
  });
  wz('wiz.any.more', {
    _: ['Another? All right. Do you ever wish you\'d stayed somewhere?'],
    cheerful: ['Another! What\'s your favorite color? It\'s gray, isn\'t it. It\'s gray.'],
    ornery: ['Fine. Do you ever get it badly wrong? Properly wrong?'],
    shy: ['...Do you remember everyone\'s names? Even the quiet ones?'],
    curious: ['What\'s the one thing you\'ve never told anyone? Small one. Doesn\'t have to be big.'],
    dreamy: ['Do wizards dream? What of?'],
    witty: ['What\'s under the hat? Hair? More hat? A tiny second wizard?'],
    proud: ['Who\'s the finest hobbit you ever met? Apart from present company.'],
    gloomy: ['Do you ever feel like giving up?'],
    child: ['What\'s your favorite animal? Is it a dragon? It\'s a dragon.'],
    'rift!': ['Could you ever go through the rift? To our side? Would you?'],
  });
  wz('wiz.any.say.more.jest', {
    _: ['Every day. Usually just before I\'ve finished a pudding somewhere.'],
    cheerful: ['Gray is a very cheerful color. Ask any cloud.'],
    ornery: ['I once set a tinker\'s cart on fire with a sneeze. Does that count?'],
    shy: ['Especially the quiet ones. They\'re the ones who notice my hat\'s on wrong.'],
    curious: ['I\'m frightened of geese. There. You\'ll take that to your grave.'],
    dreamy: ['Of cake, mostly. And of being on time, which is a nightmare.'],
    witty: ['A spare hat. Folded very small. I told you that already, I think.'],
    proud: ['Apart from present company? Nobody. There. You\'ve won.'],
    gloomy: ['Every morning before breakfast. Then breakfast happens, and I don\'t.'],
    child: ['A hedgehog. Dragons are very rude.'],
    'rift!': ['Only if there\'s a kettle on the other side.'],
  });
  wz('wiz.any.say.more.share', {
    _: ['Sometimes. But a wizard who stays somewhere stops seeing it. I\'d rather keep coming back.'],
    cheerful: ['Gray, yes. But I\'m very fond of the green of this valley in May.'],
    ornery: ['Yes. More than once. I carry those. It\'s why I listen more than I used to.'],
    shy: ['Especially the quiet ones. I remember you, {name}. I always will.'],
    curious: ['That I can\'t whistle. Not a note. Seven thousand years, and not one whistle.'],
    dreamy: ['Of a green country under a swift sunrise. I\'ve never seen it. I dream of it anyway.'],
    witty: ['Very thin gray hair, and a great many worries. The hat keeps them in.'],
    proud: ['An old hobbit who gave up her last loaf to a stranger in the Fell Winter. Nobody remembers her name.'],
    gloomy: ['Yes. And then somebody brings me tea and talks about their pumpkins, and I don\'t.'],
    child: ['Horses. Mine especially. Don\'t tell her. She\'ll be unbearable.'],
    'rift!': ['I don\'t know. Some doors aren\'t mine to open. But I\'d help you through one, if you needed.'],
  });
  wz('wiz.any.turn', {
    _: ['A wish? Oh. A quiet life and a full larder. That\'s not much to ask.', 'Fair\'s fair. ...Just for everyone I love to be well. Is that allowed?'],
    cheerful: ['A party! Every week! With you doing the fireworks!'],
    ornery: ['For folk to leave me be. Present company... mostly included.'],
    shy: ['...A friend. Just one more. A good one.'],
    curious: ['To see the Sea. Once. Just to know it\'s really there.'],
    dreamy: ['To hear the stars, like you did. Just once.'],
    witty: ['A second hat like yours, so I could disappear under it whenever I liked.'],
    proud: ['To be remembered. Long after. That\'s all. A name on someone\'s lips.'],
    gloomy: ['For it to stop raining. Inside me, I mean. ...That sounded daft.'],
    child: ['A PONY! No, a DRAGON! No, a pony that\'s a dragon!'],
    'rift!': ['A way home. Or a reason to stop wanting one. Either.'],
    'wish!': ['My wish? Honestly? {WishText}. That\'s all. That\'s what I\'d ask for.', 'You\'re asking what I\'d wish for. {WishText}. There. Now you know.'],
  });
  wz('wiz.any.done', {
    _: ['Well! I\'ll be thinking about that all week.', 'That\'s the best question I\'ve ever asked. And the best answer.'],
    cheerful: ['Ha! I\'m going to tell everyone what the wizard said! Every word!'],
    ornery: ['Hmph. Well. That was more than I expected.'],
    shy: ['...Thank you. For answering.'],
    curious: ['I\'m writing all of this down the minute you\'ve gone.'],
    dreamy: ['I\'ll take that with me into my dreams tonight.'],
    witty: ['On your hat. Ha! I\'ll check, you know.'],
    proud: ['A very satisfactory conversation. Very.'],
    gloomy: ['...That\'s cheered me up. I didn\'t expect that.'],
    child: ['I\'m going to ask you ANOTHER one tomorrow! And the day after!'],
    'rift!': ['Logged. All of it. Thanks, wizard.'],
  });

  // ~~~ more below ~~~
});
