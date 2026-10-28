'use strict';
// ---------------------------------------------------------------------------
// The village, part four: feuds, the fair and favors. Two neighbors at
// daggers drawn and the wizard asked to say who's right; what they'd enter
// at the fair and their secret for a prize pie; what they'd change about
// Thistledown (said to the wizard, and so to everyone); a secret about a
// neighbor, told in confidence; and what the village says about the wizard
// himself, which he can deny, laugh off or make a good deal worse.
// ---------------------------------------------------------------------------

talkPack('village4', () => {
  const has = (x) => x != null && x !== false && x !== '';
  const TEMPERS = ['cheerful', 'ornery', 'shy', 'curious', 'dreamy', 'witty', 'proud', 'gloomy', 'child'];
  const say = (key, spec, more) => {
    const rules = [];
    for (const k in spec) {
      const text = spec[k];
      if (k === '_') rules.push({ text });
      else if (TEMPERS.includes(k)) rules.push({ if: { temper: k }, text });
      else if (k === 'elder' || k === 'grown') rules.push({ if: { stage: k }, text });
      else if (k === 'rift') rules.push({ if: { rift: true }, text });
      else if (['plain', 'fine', 'bright'].includes(k)) rules.push({ if: { register: k }, text });
      else throw new Error(`village4 pack: unknown spec "${k}" in ${key}`);
    }
    lines(key, rules.concat(more || []));
  };
  const pick = (list, v, salt) => list[Math.floor(hash2(v.id * 11 + salt, Math.floor(Game.day / 2)) * list.length)];

  // --- Facts ----------------------------------------------------------------------
  const WISH_FOR = {
    thrift: 'a second storehouse, for the lean years', merriment: 'a proper dance floor on the party field', tradition: 'the old maypole back on the green',
    learning: 'a library, with a lamp and a stove', kin: 'a bench by every door, for the old folk', craft: 'a common workshop, with good tools for anyone',
    nature: 'more trees, and the meadow left to the larks', order: 'a signpost at every crossing, and the lanes swept on Sterdays',
  };
  const SECRETS = {
    surprise: '{X} is planning a surprise party for the whole lane', recipe: '{X}\'s prize cake has a spoonful of pepper in it', poems: '{X} writes poems, and hides them in the teapot',
    bree: '{X} has been thinking of moving to Bree', ring: '{X} lost the family ring in the river and hasn\'t told a soul', dance: '{X} has been taking dancing lessons in secret, from a scarecrow',
  };
  const WIZRUMORS = {
    age: 'you\'re three hundred years old', toad: 'you once turned a Sackville into a toad', hat: 'your hat has no bottom to it', dragon: 'you fought a dragon with a teaspoon',
    sleep: 'you never sleep, just drink tea till morning', mouse: 'you keep a mouse in your beard', stars: 'your fireworks are stars you caught and put in a box',
  };
  const WIZNEWS = {
    age: 'The wizard says he\'s older than three hundred, and the first hundred were the hardest.', toad: 'The wizard says it was a newt, not a toad, and the Sackville was much improved.',
    hat: 'The wizard says his hat has a bottom, but nobody has ever found it.', dragon: 'The wizard says it was a dessert spoon, and the dragon apologized.',
    sleep: 'The wizard says he sleeps one night in seven, and dreams for all the rest.', mouse: 'The wizard says there is no mouse in his beard. There is a wren.',
    stars: 'The wizard says his fireworks are only borrowed stars, and he always puts them back.',
  };
  const KEYS = ['vFeudA', 'vFeudAId', 'vFeudB', 'vFeudBId', 'vFeudWhat', 'vFeudKind', 'vFeudFav', 'vFeudFavId', 'vContestPrize', 'vContestThing', 'vContestGood', 'vContestWon',
    'vWishFor', 'vWishKey', 'vSecretAbout', 'vSecretAboutId', 'vSecretKey', 'vSecretText', 'vWizRumor', 'vWizRumorKey', 'vWizNews'];
  addFacts((v, F, T) => {
    for (const k of KEYS) F[k] = null;
    if (v.stage === 'baby') return;
    let P = T && T.vxFavors && T.vxFavors.vid === v.id ? T.vxFavors : null;
    if (!P) {
      P = { vid: v.id };
      const folk = Game.villagers.filter((o) => o !== v && o.isGrown() && !o.leaving);
      // a feud between two others: a rivalry, or two who've fallen out
      const pairs = [];
      for (const a of folk) for (const b of folk) {
        if (a.id >= b.id) continue;
        if (a.rival === b.id) pairs.push([a, b, 'rival']);
        else if (sentimentsOf(a, b).some((s) => SENT[s.tag][1] < 0) && (a.rel[b.id] ?? 0.1) < 0.2) pairs.push([a, b, 'sour']);
      }
      if (pairs.length) P.feud = pick(pairs, v, 1);
      // someone to keep a secret about: whoever they're fondest of who isn't family
      const kin = (o) => o.id === v.spouse || (v.parents || []).includes(o.id) || (o.parents || []).includes(v.id);
      P.secret = folk.filter((o) => !kin(o) && (v.rel[o.id] ?? 0) > 0.2).sort((a, b) => (v.rel[b.id] ?? 0) - (v.rel[a.id] ?? 0))[0] || null;
      P.secretKey = pick(Object.keys(SECRETS), v, 2);
      P.wizKey = pick(Object.keys(WIZRUMORS), v, 3);
      if (T && T.v) T.vxFavors = P;
    }
    const live = (o) => o && Game.villagers.includes(o) && !o.leaving;
    if (P.feud && live(P.feud[0]) && live(P.feud[1])) {
      const [a, b, kind] = P.feud;
      const fav = (v.rel[a.id] ?? 0.1) >= (v.rel[b.id] ?? 0.1) ? a : b;
      const sk = a.rivalSkill && CONTESTS[a.rivalSkill] ? CONTESTS[a.rivalSkill][0] : null;
      const why = sentimentsOf(a, b).find((s) => SENT[s.tag][1] < 0) || sentimentsOf(b, a).find((s) => SENT[s.tag][1] < 0);
      Object.assign(F, { vFeudA: a.first, vFeudAId: a.id, vFeudB: b.first, vFeudBId: b.id, vFeudKind: kind, vFeudWhat: kind === 'rival' ? sk : why ? why.why : null, vFeudFav: fav.first, vFeudFavId: fav.id });
    }
    // the fair: what they'd enter, from their trade or their best knack
    if (v.isGrown()) {
      const sk = v.job && JOBS[v.job] && CONTESTS[JOBS[v.job].skill] ? JOBS[v.job].skill : (typeof topTalents === 'function' ? topTalents(v.genes, 3).find((s) => CONTESTS[s]) : null);
      if (sk && CONTESTS[sk]) Object.assign(F, { vContestPrize: CONTESTS[sk][0], vContestThing: CONTESTS[sk][1], vContestGood: (v.skills[sk] || 0) >= 45, vContestWon: (v.memories || []).some((m) => /^Won /.test(m.t)) });
    }
    const vals = typeof valuesOf === 'function' ? valuesOf(v) : [];
    if (vals[0] && WISH_FOR[vals[0]]) { F.vWishFor = WISH_FOR[vals[0]]; F.vWishKey = vals[0]; }
    if (live(P.secret)) Object.assign(F, { vSecretAbout: P.secret.first, vSecretAboutId: P.secret.id, vSecretKey: P.secretKey, vSecretText: SECRETS[P.secretKey].replace('{X}', P.secret.first) });
    if (P.wizKey) Object.assign(F, { vWizRumor: WIZRUMORS[P.wizKey], vWizRumorKey: P.wizKey, vWizNews: WIZNEWS[P.wizKey] });
  });

  // =================================================================================
  // Their turn: two neighbors at daggers drawn
  // =================================================================================
  addThread({
    id: 'village.ask.feud', theirs: true, label: 'They tell you of a feud', cool: 5, ask: '{Name} wants a word about the neighbors.',
    when: (F) => F.met && F.talks >= 1 && F.stage !== 'child' && has(F.vFeudA),
    beats: {
      start: { line: 'village.ask.feud.q', go: [
        { ap: 'advise', say: 'Neither. Both. It takes two to quarrel.', to: 'both' },
        { ap: 'ask', say: 'And whose side are you on?', to: 'side' },
        { ap: 'advise', say: 'Somebody should bring them together over a pie.', to: 'bring' },
      ] },
      both: { line: 'village.ask.feud.both', go: [
        { ap: 'advise', say: 'So somebody should bring them together. Over a pie.', to: 'bring' },
        { ap: 'jest', say: 'Let them. It keeps them young.', to: 'young' },
      ] },
      side: { line: 'village.ask.feud.side', go: [
        { ap: 'warm', say: 'Then tell {vFeudFav} to be the bigger hobbit.', to: 'bigger' },
        { ap: 'advise', say: 'Stay out of it. Feuds are catching.', to: 'catching' },
      ] },
      bring: { line: 'village.ask.feud.bring', go: [
        { ap: 'warm', say: 'You. You\'re the very one.', to: [{ need: { fond: 0.2 }, to: 'willdo' }, { need: { respect: 0.1 }, to: 'willdo' }, 'notme'] },
        { ap: 'jest', say: 'Me? I\'d only set fire to the pie.', to: 'pie' },
      ] },
      willdo: { line: 'village.ask.feud.willdo', fx: { respect: 0.03, run: (T, v) => {
        const a = personById(T.F.vFeudAId), b = personById(T.F.vFeudBId);
        if (a && b) { a.bond(b, 0.04); v.remember(`I tried to bring ${a.first} and ${b.first} together, as the wizard said.`, 1); }
        const fav = personById(T.F.vFeudFavId);
        if (fav && ACTIONS.whisper_visit) v.queue.push({ a: ACTIONS.whisper_visit, extra: { to: fav, kind: 'kin' } });
      } }, end: true },
      notme: { line: 'village.ask.feud.notme', end: true },
      young: { line: 'village.ask.feud.young', end: true },
      bigger: { line: 'village.ask.feud.bigger', fx: { run: (T, v) => { const o = personById(T.F.vFeudFavId); if (o && ACTIONS.whisper_visit) v.queue.push({ a: ACTIONS.whisper_visit, extra: { to: o, kind: 'kin' } }); } }, end: true },
      catching: { line: 'village.ask.feud.catching', fx: { respect: 0.01 }, end: true },
      pie: { line: 'village.ask.feud.pie', end: true },
    },
    end: { fond: 0.015 },
  });
  say('village.ask.feud.q', {
    _: ['{VFeudA} and {vFeudB} are at it again. You can hear them from the well. Who\'s in the right?', 'Have you heard {vFeudA} and {vFeudB}? Not speaking, except to shout. What\'s to be done?', 'You\'re wise. {VFeudA} and {vFeudB}: who\'s right? The whole lane wants to know.'],
    cheerful: ['Oh, {vFeudA} and {vFeudB}! They\'re such dears, both of them. Why can\'t they be dears together?'],
    ornery: ['{VFeudA} and {vFeudB}. Shouting over the hedge again. Some of us are trying to nap.'],
    shy: ['...{VFeudA} and {vFeudB} had words by the mill. I hid behind a sack. What should I do?'],
    curious: ['I\'ve been following the {vFeudA} and {vFeudB} business closely. Purely in the public interest. Who\'s right?'],
    dreamy: ['{VFeudA} and {vFeudB} used to walk to the fair together. Now they walk on opposite sides of the lane.'],
    witty: ['The great {vFeudA} and {vFeudB} war enters its third week. Casualties include a gate and my patience.'],
    proud: ['I don\'t take part in squabbles. But someone ought to settle {vFeudA} and {vFeudB}.'],
    gloomy: ['{VFeudA} and {vFeudB}. It\'ll never mend. These things don\'t.'],
    rift: ['{VFeudA} versus {vFeudB}. It\'s like a flame war, but with actual hedges.'],
    elder: ['I\'ve seen a dozen feuds like {vFeudA} and {vFeudB}\'s. They all end at a funeral or a wedding.'],
  }, [
    { if: { vFeudKind: 'rival', vFeudWhat: (x) => has(x) }, pri: 1, text: ['{VFeudA} and {vFeudB}. {VFeudWhat}. Every year. This year it\'s got nasty.', 'It\'s {vFeudWhat} again. {VFeudA} says {vFeudB} cheated. {VFeudB} says {vFeudA} is a sore loser. Who\'s right?'] },
    { if: { vFeudKind: 'sour', vFeudWhat: (x) => has(x) }, pri: 1, text: ['{VFeudA} and {vFeudB} fell out. Over {vFeudWhat}, I\'m told. Neither will budge. Who\'s right?'] },
  ]);
  say('village.ask.feud.both', {
    _: ['Both. Yes. That\'s what I said. Nobody listened.', 'Takes two. Hm. It does. And neither of them will be the one.'],
    cheerful: ['Exactly! They\'re both lovely and both being silly!'],
    ornery: ['Both of them. Daft as a pair of geese.'],
    shy: ['Both. I thought so. I didn\'t like to say.'],
    curious: ['A fair answer. But someone started it. I\'d like to know who.'],
    witty: ['Both. Very diplomatic. You\'d make a terrible gossip.'],
    proud: ['Precisely my view, put less elegantly.'],
    gloomy: ['Both. And they\'ll both be stubborn till the end.'],
  });
  say('village.ask.feud.side', {
    _: ['{VFeudFav}\'s, if I\'m honest. But I wouldn\'t say so out loud.', 'Oh, I\'m with {vFeudFav}. Quietly. Very quietly.'],
    cheerful: ['Both! ...{VFeudFav}. A tiny bit more {vFeudFav}.'],
    ornery: ['{VFeudFav}, obviously. Anyone with eyes.'],
    shy: ['I don\'t take sides. ...{VFeudFav} was nicer to me last winter.'],
    curious: ['I\'ve weighed the evidence. {VFeudFav}, on balance. Narrowly.'],
    witty: ['I\'m on the side of whoever buys the next round. Currently {vFeudFav}.'],
    proud: ['{VFeudFav}. I don\'t change sides.'],
    gloomy: ['{VFeudFav}. Not that it matters what I think.'],
  });
  say('village.ask.feud.bring', {
    _: ['Over a pie! Yes. But who\'d do the bringing?', 'Together? It\'d take someone brave. Or someone with a very big pie.'],
    cheerful: ['Ooh! A making-up pie! Who\'d carry it?'],
    ornery: ['Bring them together and they\'ll throw the pie.'],
    shy: ['Someone should. Someone who isn\'t me.'],
    curious: ['Interesting. A neutral pie. On neutral ground. Who\'d host?'],
    witty: ['A peace pie. I like it. Pork, possibly. Nothing too provocative.'],
    proud: ['It wants someone of standing. Someone people respect.'],
    gloomy: ['They\'d never both come.'],
  });
  say('village.ask.feud.willdo', {
    _: ['Me? ...Well. Somebody has to. I\'ll bake. I\'ll invite. I\'ll hide the knives.', 'All right. I\'ll ask them round. If it goes wrong, I\'m telling them it was your idea.'],
    cheerful: ['Me! Oh, I\'d love to! A peace tea! With bunting!'],
    ornery: ['Hmph. Fine. I\'ll knock their heads together. Gently. Over tea.'],
    shy: ['...Me? I\'ll try. I\'ll start with {vFeudFav}. {VFeudFav}\'s less frightening.'],
    curious: ['I\'d like to try, actually. I want to hear both sides in the same room.'],
    proud: ['Very well. They\'ll listen to me. Most people do.'],
    witty: ['A wizard-appointed peacemaker. I\'ll need a sash.'],
    gloomy: ['It won\'t work. ...I\'ll try. Somebody has to.'],
  });
  say('village.ask.feud.notme', {
    _: ['Me? No, no. Not me. I\'ve my own hedges to worry about.', 'Not me. They\'d turn on me. They always turn on the one in the middle.'],
    ornery: ['Not likely. I\'ve enough feuds of my own.'],
    shy: ['Oh, I couldn\'t. I couldn\'t possibly.'],
  });
  say('village.ask.feud.young', {
    _: ['Ha! Keeps them young. It does keep them lively, I\'ll give you that.', 'Young! They\'ll be young and hoarse.'],
    ornery: ['Keeps ME old, listening to it.'],
    witty: ['A feud a day keeps the herbalist away.'],
  });
  say('village.ask.feud.bigger', {
    _: ['The bigger hobbit. Hm. {VFeudFav} would like that. Being called bigger.', 'I\'ll tell {vFeudFav}. Over a pint. When the moment\'s right.'],
    shy: ['I\'ll... I\'ll hint. I\'m good at hinting.'],
  });
  say('village.ask.feud.catching', {
    _: ['Catching! It is, isn\'t it? Half the lane has taken sides.', 'You\'re right. I\'ll keep my head down and my hedge trimmed.'],
    gloomy: ['Catching. Like a cold. Everything\'s catching.'],
  });
  say('village.ask.feud.pie', {
    _: ['Ha! A flaming peace pie! They\'d have to make up, just to put it out.', 'Set fire to it! Ha! That would unite them. Against you.'],
    witty: ['Brilliant. A common enemy. You\'re wiser than you look.'],
  });

  // =================================================================================
  // The fair: what they'd enter
  // =================================================================================
  addThread({
    id: 'village.contest', label: 'Entering anything at the fair?', weight: 0.8, cool: 5,
    when: (F) => has(F.vContestPrize), rel: (F) => (F.season === 'autumn' ? 1.6 : F.season === 'summer' ? 1.1 : 0.6),
    open: { ask: 'village.contest.open' },
    beats: {
      start: { line: 'village.contest.start', go: [
        { ap: 'ask', say: 'And your chances?', to: 'chances' },
        { ap: 'jest', say: 'I could enchant it. A small enchantment. A sparkle.', to: 'cheat' },
        { ap: 'ask', say: 'What\'s the secret of a good {vContestThing}?', to: 'secret', need: { open: 1 }, soft: true },
      ] },
      chances: { line: 'village.contest.chances', go: [
        { ap: 'warm', say: 'I\'ll be at the front, cheering.', to: 'cheer' },
        { ap: 'advise', say: 'Try it on the Badger crowd first. They\'re honest critics.', to: 'practice' },
        { ap: 'ask', say: 'What\'s the secret of a good {vContestThing}?', to: 'secret', need: { open: 1 }, soft: true },
      ] },
      cheat: { line: 'village.contest.cheat', go: [
        { ap: 'warm', say: 'I\'m teasing. You\'ll win it fair or not at all.', to: 'fair' },
        { ap: 'jest', say: 'A very small sparkle. Nobody would notice. Except everybody.', to: 'sparkle' },
      ] },
      secret: { line: 'village.contest.secret', fx: { confide: { k: 'village.contest.secret', t: '{Name}\'s secret for a prize {vContestThing}. Never to be told.', secret: true } }, go: [
        { ap: 'warm', say: 'Safe with me. I\'ve forgotten it already.', to: 'safe' },
        { ap: 'jest', say: 'I shall enter one myself, then. Watch out.', to: 'enter' },
      ] },
      cheer: { line: 'village.contest.cheer', fx: { fond: 0.02 }, end: true },
      practice: { line: 'village.contest.practice', fx: { respect: 0.02 }, end: true },
      fair: { line: 'village.contest.fair', fx: { respect: 0.01 }, end: true },
      sparkle: { line: 'village.contest.sparkle', fx: { joke: { k: 'village.sparkle', t: 'A very small sparkle on {name}\'s {vContestThing}. Nobody would notice.' } }, end: true },
      safe: { line: 'village.contest.safe', fx: { trust: 0.03 }, end: true },
      enter: { line: 'village.contest.enter', end: true },
    },
    end: { fond: 0.015 },
  });
  lines('village.contest.open', [{ text: ['Entering anything at the fair, {name}?', 'Will we see something of yours on the prize table, {name}?', 'I hear the fair\'s the thing to win, {name}. Any plans?'] }]);
  say('village.contest.start', {
    _: ['{VContestPrize}. I enter every year. I\'ll enter till they carry me out.', 'I\'m going for {vContestPrize}. Don\'t tell anyone. Everyone knows.', '{VContestPrize}. It\'s not about winning. It\'s about winning.'],
    cheerful: ['{VContestPrize}! I love the fair! Even losing\'s fun at the fair!'],
    ornery: ['{VContestPrize}. And the judges had better have their spectacles this year.'],
    shy: ['...{VContestPrize}, maybe. If I\'m brave enough to put it on the table.'],
    curious: ['{VContestPrize}. I\'ve been experimenting. Some of the experiments are edible.'],
    dreamy: ['{VContestPrize}. I don\'t mind winning. I like making the thing.'],
    witty: ['{VContestPrize}. My strategy is to be so good the others go home early.'],
    proud: ['{VContestPrize}. I\'ve won it before. I intend to win it again.'],
    gloomy: ['{VContestPrize}. I\'ll come fourth. I always come fourth.'],
    rift: ['{VContestPrize}. Competitive making with no rankings board. Just a rosette. I\'m obsessed.'],
  }, [
    { if: { vContestWon: true }, pri: 1, text: ['{VContestPrize}. I won something last time, you know. The rosette\'s on the mantel. I dust it daily.'] },
    { if: { rival: (r) => has(r) }, text: ['{VContestPrize}, and {rival} had better watch out.'] },
  ]);
  say('village.contest.chances', {
    _: ['Fair. Better than fair, if the weather holds.', 'Good, I think. Don\'t jinx it.'],
    cheerful: ['Wonderful! Well. Good. Well. I\'ll have fun!'],
    ornery: ['My chances are excellent. My judges are the problem.'],
    shy: ['Not very good. But I\'ll try.'],
    curious: ['I\'ve worked it out. About one in four. Better than last year.'],
    witty: ['Excellent, provided everyone else drops theirs on the way.'],
    proud: ['I don\'t deal in chances. I deal in rosettes.'],
    gloomy: ['None. But I\'ll still go.'],
  }, [
    { if: { vContestGood: true }, pri: 1, text: ['Good, honestly. I\'ve got the knack of it now. Years of practice.', 'Better than most. I don\'t say that lightly.'] },
    { if: { vContestGood: false }, pri: 1, text: ['Middling. I\'m still learning. Every year a little less middling.', 'Not great. But one year. One year.'] },
  ]);
  say('village.contest.cheat', {
    _: ['Don\'t you dare! I\'d be disqualified and drummed out of the Shire.', 'A sparkle! Ha! Tempting. No.'],
    cheerful: ['Ooh! No! Well. No. A tiny one? No!'],
    ornery: ['Cheat? I\'ve never cheated in my life. I\'ve been cheated against. Often.'],
    shy: ['Oh no! What if they found out? I\'d have to move to Bree.'],
    curious: ['What would the sparkle do, exactly? Hypothetically.'],
    dreamy: ['A sparkle. It would be pretty. But then it wouldn\'t be mine.'],
    witty: ['I\'d only accept magical help if the judges were also enchanted.'],
    proud: ['I don\'t need magic. That\'s rather the point of me.'],
    gloomy: ['Even with a sparkle I\'d lose.'],
    rift: ['Performance-enhancing wizardry. Banned in every league I know.'],
  });
  say('village.contest.secret', {
    _: ['...Patience. And something I\'ll never tell. Oh, all right. Leaning in. A pinch of nutmeg in everything.', 'Don\'t laugh. I talk to it. Every morning. Kindly.'],
    cheerful: ['Love! And extra butter. Mostly the butter.'],
    ornery: ['Spite. Pure spite. And good water from the east well.'],
    shy: ['...I put a little honey in. Just a spoonful. Nobody knows.'],
    curious: ['I measure everything twice and then trust my nose. The nose is the secret.'],
    dreamy: ['I make it at dawn, when the world\'s quiet. It knows the difference.'],
    witty: ['The secret is to make two and enter the better one. Tell no one.'],
    proud: ['My grandmother\'s method. Unchanged in sixty years. I\'ll tell you one part. Only one.'],
    gloomy: ['There isn\'t one. That\'s my secret. That\'s why I lose.'],
    rift: ['Precise measurement. I brought a scale through the rift. Sorry, everyone.'],
  }, [
    { if: { vContestThing: 'pumpkin' }, pri: 1, text: ['Muck. Good, old muck, and a song at sunset. I sing to them. Don\'t tell a soul.'] },
    { if: { vContestThing: 'pie' }, pri: 1, text: ['Cold hands for the pastry. I keep a stone in the river. Shh.'] },
    { if: { vContestThing: 'ale' }, pri: 1, text: ['A handful of heather in the mash. My father\'s trick. Not a word.'] },
    { if: { vContestThing: 'fish' }, pri: 1, text: ['The pool under the willow, at dusk, with a cheese worm. You never heard it from me.'] },
    { if: { vContestThing: 'tune' }, pri: 1, text: ['Play it to the cows first. If they lie down, it\'s ready.'] },
  ]);
  say('village.contest.cheer', {
    _: ['At the front! You\'d block everyone\'s view. Lovely, though.', 'Would you? Oh, that\'d help. A wizard in the crowd.'],
    shy: ['...Cheer quietly? Please?'],
    proud: ['Cheer when I win. Not before. It\'s bad luck.'],
  });
  say('village.contest.practice', {
    _: ['The Badger crowd! Ha! They\'ll eat anything and complain about all of it.', 'Honest critics. Yes. Brutal ones. Good idea.'],
    shy: ['In front of everyone? Oh. Oh dear. ...All right.'],
  });
  say('village.contest.fair', {
    _: ['Fair or not at all. Yes. That\'s how my mother won hers.', 'Of course. A rosette you cheated for would itch.'],
  });
  say('village.contest.sparkle', {
    _: ['Ha! Except everybody. I\'ll think of you when I lose fair and square.', 'A very small sparkle. You\'re incorrigible.'],
    child: ['Can you make MY thing sparkle?'],
  });
  say('village.contest.safe', {
    _: ['Forgotten already. Good. That\'s what I like in a wizard.', 'Thank you. It\'s been in the family a long time.'],
  });
  say('village.contest.enter', {
    _: ['You! Enter! Ha! What would you make?', 'Then I\'ll see you at the table, wizard. Bring your best.'],
    proud: ['Do. I\'d enjoy beating a wizard.'],
    witty: ['A wizard\'s {vContestThing}. Would it explode?'],
  });

  // =================================================================================
  // What they'd change about Thistledown
  // =================================================================================
  addThread({
    id: 'village.wishlist', label: 'What would you change about Thistledown?', weight: 0.8, cool: 7,
    when: (F) => F.stage !== 'child' && has(F.vWishFor),
    open: { ask: 'village.wishlist.open' },
    beats: {
      start: { line: 'village.wishlist.start', go: [
        { ap: 'ask', say: 'Why that?', to: 'why' },
        { ap: 'advise', say: 'Then put it to the Moot. Or on the notice board.', to: 'board' },
        { ap: 'warm', say: 'I\'ll tell folk you said so. Ideas want spreading.', to: 'spread' },
      ] },
      why: { line: 'village.wishlist.why', go: [
        { ap: 'advise', say: 'Then put it to the Moot.', to: 'board' },
        { ap: 'warm', say: 'I\'ll tell folk you said so.', to: 'spread' },
        { ap: 'ask', say: 'And who\'d be against it?', to: 'against' },
      ] },
      board: { line: 'village.wishlist.board', fx: { respect: 0.02 }, end: true },
      spread: { line: 'village.wishlist.spread', fx: { fond: 0.02, news: '{Name} would like {vWishFor} for Thistledown, and the wizard has been telling folk so.' }, end: true },
      against: { line: 'village.wishlist.against', go: [
        { ap: 'advise', say: 'Talk to them first. Win them over before the Moot.', to: 'board' },
        { ap: 'jest', say: 'Bake them something. Opposition melts in butter.', to: 'butter' },
      ] },
      butter: { line: 'village.wishlist.butter', end: true },
    },
    end: { fond: 0.01 },
  });
  lines('village.wishlist.open', [{ text: ['If you could change one thing about Thistledown, {name}, what would it be?', 'What\'s missing from this village, {name}? There must be something.', 'Give me one wish for the village, {name}. Not for you. For the village.'] }]);
  const VW = (k) => ({ if: { vWishKey: k } });
  say('village.wishlist.start', {
    _: ['{VWishFor}. That\'s what I\'d have. I\'ve said it for years.', 'Oh, I know exactly. {VWishFor}.', 'Change? {VWishFor}. That\'s all. Not much to ask.'],
    cheerful: ['Ooh! {VWishFor}! Wouldn\'t that be lovely?'],
    ornery: ['{VWishFor}. And fewer geese. Mostly the first thing.'],
    shy: ['...{VWishFor}. I\'ve never told anyone that.'],
    curious: ['{VWishFor}. I\'ve sketched where it would go.'],
    dreamy: ['{VWishFor}. I can see it when I close my eyes.'],
    witty: ['{VWishFor}. Also a statue of me, but I\'ll settle for the first.'],
    proud: ['{VWishFor}. It\'s what a village of our standing ought to have.'],
    gloomy: ['{VWishFor}. It\'ll never happen.'],
    rift: ['{VWishFor}. Also wifi. Kidding. Mostly.'],
  });
  say('village.wishlist.why', {
    _: ['Because it would make the place better. Simple as that.', 'Because I\'ve watched folk go without it for too long.'],
    cheerful: ['Because it would make everyone smile! That\'s reason enough!'],
    ornery: ['Because nobody else will suggest it, and somebody has to.'],
    shy: ['Because I think I\'d be happier. And maybe others would.'],
    gloomy: ['Because it\'s the one thing that might help.'],
  }, [
    { ...VW('thrift'), pri: 1, text: ['Because one bad harvest and we\'re eating the seed corn. I\'ve seen it. Never again.'] },
    { ...VW('merriment'), pri: 1, text: ['Because we dance on lumpy grass and somebody always turns an ankle. We deserve a floor!'] },
    { ...VW('tradition'), pri: 1, text: ['Because my grandmother danced round it, and hers did, and now there\'s a hole where it stood.'] },
    { ...VW('learning'), pri: 1, text: ['Because books are lonely in ones and twos. Put them together and they start talking.'] },
    { ...VW('kin'), pri: 1, text: ['Because the old folk stand at their doors waiting for somebody to pass. They should sit.'] },
    { ...VW('craft'), pri: 1, text: ['Because a good tool shouldn\'t sit in one shed. Half the village could make things, given the chance.'] },
    { ...VW('nature'), pri: 1, text: ['Because every year there are fewer larks. You notice when you\'ve listened all your life.'] },
    { ...VW('order'), pri: 1, text: ['Because I\'ve given directions to the mill nine times this week. Nine.'] },
  ]);
  say('village.wishlist.board', {
    _: ['The Moot! Me? ...Maybe I will. I\'ve a voice. Somewhere.', 'The board. Yes. I\'ll write it out neatly. Folk read neat.'],
    cheerful: ['I will! I\'ll make a speech! With hand-waving!'],
    ornery: ['I\'ve put it to the Moot four times. Five, then.'],
    shy: ['On the board? With my name on? ...Without my name?'],
    proud: ['I shall put it to the Moot. Properly worded.'],
    gloomy: ['They\'ll vote it down. But I\'ll put it up.'],
  });
  say('village.wishlist.spread', {
    _: ['Would you? Coming from you, they might listen.', 'Tell everyone! Tell them it was my idea, though.'],
    shy: ['...Don\'t say it was me. ...Actually, do. No. Yes. Do.'],
    proud: ['Do. And mention my name clearly.'],
    witty: ['Spread it. With dragons in, if you must.'],
  });
  say('village.wishlist.against', {
    _: ['The usual lot. Anyone who\'d have to pay for it.', 'The ones who like things as they are. Which is most folk, most days.'],
  }, [
    { ...VW('thrift'), pri: 1, text: ['The merrymakers. They\'d rather spend the timber on a dance floor.'] },
    { ...VW('merriment'), pri: 1, text: ['The penny-pinchers. They\'d rather build another storehouse.'] },
    { ...VW('tradition'), pri: 1, text: ['The bookish lot. They\'d rather have a library.'] },
    { ...VW('learning'), pri: 1, text: ['The old-ways crowd. They say books make children pale.'] },
    { ...VW('nature'), pri: 1, text: ['The tidy ones. They want paths and signposts everywhere.'] },
    { ...VW('order'), pri: 1, text: ['The green-valley folk. They think a signpost is an insult to a tree.'] },
  ]);
  say('village.wishlist.butter', {
    _: ['Opposition melts in butter! Ha! I\'m writing that on the board.', 'Bake them round. Yes. That\'s how anything gets done here.'],
  });

  // =================================================================================
  // Their turn: a secret about a neighbor
  // =================================================================================
  addThread({
    id: 'village.ask.secret', theirs: true, label: 'They tell you a secret', cool: 6, ask: '{Name} leans in close.',
    when: (F) => F.met && F.talks >= 2 && F.trust >= 0.2 && F.stage !== 'child' && has(F.vSecretAbout),
    beats: {
      start: { line: 'village.ask.secret.q', go: [
        { ap: 'warm', say: 'Of course. Wizards are made of secrets.', to: 'tell' },
        { ap: 'advise', say: 'Is it yours to tell?', to: 'yours' },
        { ap: 'jest', say: 'I can keep it for at least an hour.', to: 'hour' },
      ] },
      tell: { line: 'village.ask.secret.tell', fx: { confide: { k: 'village.secret', t: '{VSecretText}.', secret: true } }, go: [
        { ap: 'warm', say: 'Not a word, from me.', to: 'safe' },
        { ap: 'ask', say: 'Why tell me?', to: 'why' },
        { ap: 'jest', say: 'I may have to write it across the sky in fireworks.', to: 'sky' },
      ] },
      yours: { line: 'village.ask.secret.yours', fx: { respect: 0.03 }, go: [
        { ap: 'warm', say: 'Then let it rest. You\'re a good friend to {vSecretAbout}.', to: 'good' },
        { ap: 'ask', say: 'Is something worrying you about it?', to: 'worry' },
      ] },
      hour: { line: 'village.ask.secret.hour', go: [
        { ap: 'warm', say: 'I\'m teasing. Tell me.', to: 'tell' },
        { ap: 'advise', say: 'Perhaps it\'s best kept, then.', to: 'yours' },
      ] },
      safe: { line: 'village.ask.secret.safe', fx: { trust: 0.04, promise: { k: 'secret.village.neighbor', t: 'You promised to keep {name}\'s secret about {vSecretAbout}', days: 20 } }, end: true },
      why: { line: 'village.ask.secret.why', fx: { trust: 0.02 }, end: true },
      sky: { line: 'village.ask.secret.sky', end: true },
      good: { line: 'village.ask.secret.good', fx: { fond: 0.02 }, end: true },
      worry: { line: 'village.ask.secret.worry', fx: { trust: 0.02 }, end: true },
    },
  });
  say('village.ask.secret.q', {
    _: ['Can you keep a secret? It\'s about {vSecretAbout}.', 'Don\'t tell a soul. Promise? It\'s about {vSecretAbout}.', 'I\'ve been bursting to tell somebody. It\'s about {vSecretAbout}.'],
    cheerful: ['Oh, I have to tell someone or I\'ll pop! It\'s about {vSecretAbout}!'],
    ornery: ['I\'m not one for tittle-tattle. But this is about {vSecretAbout}, and it\'s been eating at me.'],
    shy: ['...Can I tell you something? About {vSecretAbout}? You won\'t say?'],
    curious: ['I found something out about {vSecretAbout}. Quite by accident. Mostly.'],
    dreamy: ['I\'ve been carrying something about {vSecretAbout}. It\'s too big for one.'],
    witty: ['Psst. Wizard. Classified information. Concerning {vSecretAbout}.'],
    proud: ['I don\'t gossip. This isn\'t gossip. It\'s about {vSecretAbout}, and it\'s important.'],
    gloomy: ['I shouldn\'t say. It\'s about {vSecretAbout}. I\'ll only make it worse.'],
    rift: ['Encrypted channel? Just you and me? It\'s about {vSecretAbout}.'],
  });
  say('village.ask.secret.tell', {
    _: ['{VSecretText}. There. I\'ve said it.', 'Well. {VSecretText}. Isn\'t that something?', '{VSecretText}. And nobody else knows. Except me. And now you.'],
    cheerful: ['{VSecretText}! Isn\'t that the best thing you ever heard?'],
    ornery: ['{VSecretText}. There. Now it\'s your problem too.'],
    shy: ['...{VSecretText}. Don\'t look at me like that.'],
    curious: ['{VSecretText}. I have questions. So many questions.'],
    dreamy: ['{VSecretText}. Isn\'t it a lovely, strange thing to know about someone?'],
    witty: ['{VSecretText}. I\'ve sworn myself to silence. Badly, clearly.'],
    proud: ['{VSecretText}. I trust you\'ll be discreet.'],
    gloomy: ['{VSecretText}. I don\'t know what to do with it.'],
    rift: ['{VSecretText}. Data leaked. To one wizard. Contained.'],
  }, [
    { if: { vSecretKey: 'surprise' }, pri: 1, text: ['{VSecretText}! Bunting and everything. Act surprised when you\'re invited.'] },
    { if: { vSecretKey: 'bree' }, pri: 1, text: ['{VSecretText}. I\'m worried. I don\'t want {vSecretAbout} to go.'] },
    { if: { vSecretKey: 'ring' }, pri: 1, text: ['{VSecretText}. {VSecretAbout} dives for it at dusk. I\'ve seen.'] },
    { if: { vSecretKey: 'poems' }, pri: 1, text: ['{VSecretText}. I read one. It was about the moon. It was good. Really good.'] },
  ]);
  say('village.ask.secret.yours', {
    _: ['...No. No, it isn\'t. You\'re right. I\'ll keep it.', 'Mine to tell? ...Hm. I suppose not. That\'s why it\'s heavy.'],
    cheerful: ['Oh! Oh, you\'re right. I do get carried away.'],
    ornery: ['Hmph. Fair. You\'ve more scruples than the Badger.'],
    shy: ['...No. Thank you for stopping me.'],
    curious: ['Strictly speaking, no. Morally, it\'s complicated. Actually, it isn\'t. No.'],
    proud: ['I had considered that. I\'ve reconsidered. Thank you.'],
    gloomy: ['No. I\'m a dreadful friend.'],
  });
  say('village.ask.secret.hour', {
    _: ['An hour! You\'re worse than the innkeeper.', 'Ha! At least you\'re honest. That\'s more than most.'],
    witty: ['An hour is generous. The mail carrier manages ten minutes.'],
    ornery: ['Then I\'ll not bother.'],
  });
  say('village.ask.secret.safe', {
    _: ['I knew I could trust you. You\'ve that kind of face. Under the beard.', 'Thank you. It\'s lighter, shared.'],
    shy: ['...Thank you. I feel better.'],
    ornery: ['Good. Now forget I said anything.'],
  });
  say('village.ask.secret.why', {
    _: ['Because you\'re not from here. You won\'t tell the well.', 'Because you\'ll know what to do with it. I don\'t.'],
    shy: ['Because you listen. Nobody else does.'],
  });
  say('village.ask.secret.sky', {
    _: ['Don\'t you DARE. ...In green, though. Green would be nice.', 'Fireworks! You\'d have the whole valley out. No!'],
    witty: ['Across the sky. In capitals. Signed "a friend". Perfect.'],
  });
  say('village.ask.secret.good', {
    _: ['A good friend. I try. Mostly I try.', 'Thank you. I\'ll keep it close.'],
  });
  say('village.ask.secret.worry', {
    _: ['A bit. I don\'t want {vSecretAbout} to be hurt. Or to go. That\'s all.', 'Only that I can\'t help. Knowing and not helping. That\'s the worst bit.'],
  });

  // =================================================================================
  // Their turn: what they say about the wizard
  // =================================================================================
  addThread({
    id: 'village.ask.wizrumor', theirs: true, label: 'They\'ve heard something about you', cool: 5, ask: '{Name} has heard something about you.',
    when: (F) => F.met && F.talks >= 1 && has(F.vWizRumor),
    beats: {
      start: { line: 'village.ask.wizrumor.q', go: [
        { ap: 'tale', say: 'village.ask.wizrumor.tale.say', label: 'Make it a good deal worse', to: 'tale' },
        { ap: 'advise', say: 'Nonsense, I\'m afraid. Folk will say anything.', to: 'deny' },
        { ap: 'jest', say: 'village.ask.wizrumor.jest.say', label: 'Laugh it off', to: 'jest' },
      ] },
      tale: { line: 'village.ask.wizrumor.tale', fx: { news: '{VWizNews}' }, go: [
        { ap: 'jest', say: 'And that\'s only the half of it.', to: 'half' },
        { ap: 'warm', say: 'Don\'t tell everyone. Well. Tell some.', to: 'tellsome' },
      ] },
      deny: { line: 'village.ask.wizrumor.deny', go: [
        { ap: 'tale', say: 'Well... there was one small thing.', to: 'tale' },
        { ap: 'warm', say: 'I\'m only an old man with a hat.', to: 'oldman' },
      ] },
      jest: { line: 'village.ask.wizrumor.jest', fx: { fond: 0.02 }, end: true },
      half: { line: 'village.ask.wizrumor.half', fx: { joke: { k: 'village.wizrumor', t: 'They say {vWizRumor}. The wizard says that\'s only the half of it.' } }, end: true },
      tellsome: { line: 'village.ask.wizrumor.tellsome', end: true },
      oldman: { line: 'village.ask.wizrumor.oldman', fx: { trust: 0.02 }, end: true },
    },
  });
  const WR = (k) => ({ if: { vWizRumorKey: k }, pri: 1 });
  say('village.ask.wizrumor.q', {
    _: ['Is it true {vWizRumor}? They\'re saying so at the Badger.', 'I heard {vWizRumor}. Is it true? You can tell me.', 'Somebody said {vWizRumor}. I said nonsense. Was I right?'],
    cheerful: ['Is it TRUE {vWizRumor}? Oh, say it is!'],
    ornery: ['They\'re saying {vWizRumor}. I told them it\'s nonsense. Is it nonsense?'],
    shy: ['...Is it true {vWizRumor}? Sorry. I just wondered.'],
    curious: ['I need to know. Is it true {vWizRumor}? I\'ve a bet on.'],
    dreamy: ['They say {vWizRumor}. I\'d like it to be true.'],
    witty: ['The Badger has ruled that {vWizRumor}. Care to appeal?'],
    proud: ['I don\'t listen to gossip, but is it true {vWizRumor}?'],
    gloomy: ['They say {vWizRumor}. Probably not. Nothing\'s ever true.'],
    child: ['Is it true {vWizRumor}? Is it? IS it?', 'My friend says {vWizRumor}! Is that real?'],
    rift: ['Rumor check: {vWizRumor}. True or false?'],
  });
  lines('village.ask.wizrumor.tale.say', [
    { text: ['True. And that\'s the dull version.'] },
    { ...WR('age'), text: ['Three hundred? I stopped counting at three hundred. Out of politeness.'] },
    { ...WR('toad'), text: ['A newt, not a toad. And the Sackville was much improved by it.'] },
    { ...WR('hat'), text: ['It has a bottom. Nobody has ever found it, mind.'] },
    { ...WR('dragon'), text: ['A dessert spoon. Much heavier. And the dragon apologized.'] },
    { ...WR('sleep'), text: ['I sleep one night in seven. The rest I spend dreaming awake.'] },
    { ...WR('mouse'), text: ['There\'s no mouse in my beard. There\'s a wren. She pays rent in song.'] },
    { ...WR('stars'), text: ['Only borrowed stars. I always put them back before dawn.'] },
  ]);
  lines('village.ask.wizrumor.jest.say', [
    { text: ['I\'ll neither confirm nor deny. Mostly deny. Partly confirm.'] },
    { ...WR('age'), text: ['Three hundred! I\'m wounded. Two hundred and ninety-nine, if you please.'] },
    { ...WR('toad'), text: ['Only once. And he asked me to.'] },
    { ...WR('hat'), text: ['There\'s a bottom. I keep my sandwiches on it.'] },
    { ...WR('dragon'), text: ['A teaspoon! What do they take me for? It was a fork.'] },
    { ...WR('sleep'), text: ['I sleep. I just do it standing up, like a horse.'] },
    { ...WR('mouse'), text: ['He\'s not a mouse, he\'s a lodger.'] },
    { ...WR('stars'), text: ['Caught stars? Please. I bought them at Bree market.'] },
  ]);
  say('village.ask.wizrumor.tale', {
    _: ['I KNEW it! I knew it! Wait till I tell the Badger!', 'Oh, my word. Oh, my giddy aunt.', 'Get away! Truly? Oh, that\'s the best thing I\'ve heard all year.'],
    cheerful: ['Ha! Oh, that\'s wonderful! I\'m telling everyone!'],
    ornery: ['Hmph. You\'re pulling my leg. ...Aren\'t you? You\'re not, are you.'],
    shy: ['Oh! Oh my. I don\'t know what to say.'],
    curious: ['But how? And where? And what happened next? Start from the beginning.'],
    dreamy: ['I knew there was more to you. I could feel it.'],
    witty: ['That\'s much better than the rumor. You should be in charge of rumors.'],
    proud: ['Well. I always said you were a wizard of some distinction.'],
    gloomy: ['Of course. Everyone has a better life than me. Even you. Especially you.'],
    child: ['WHOA. That\'s the BEST. I\'m going to tell EVERYONE.'],
    rift: ['That\'s canon now. You can\'t take it back.'],
  });
  say('village.ask.wizrumor.deny', {
    _: ['Oh. That\'s a shame. It was a good one.', 'Nonsense? Well. I\'ll tell them. They won\'t believe me.'],
    cheerful: ['Oh, bother! I liked that one! Never mind.'],
    ornery: ['Told you. I told them. Nobody listens.'],
    shy: ['Oh. I\'m sorry I asked.'],
    curious: ['Are you sure? You\'re hesitating. You\'re hesitating!'],
    dreamy: ['I\'ll keep believing it a little. You can\'t stop me.'],
    witty: ['That\'s exactly what someone would say if it were true.'],
    proud: ['As I suspected. I never credited it.'],
    gloomy: ['Of course not.'],
    child: ['Awww. Are you SURE?'],
  });
  say('village.ask.wizrumor.jest', {
    _: ['Ha! That\'s not an answer. That\'s a hat.', 'You\'re impossible. I\'ll tell them you laughed. That\'ll do.'],
    cheerful: ['Ha! Oh, you\'re wicked! I love it!'],
    ornery: ['A straight answer would kill you, wouldn\'t it.'],
    witty: ['Oh, very good. I\'ll be stealing that.'],
    child: ['That\'s not an ANSWER!'],
    curious: ['That\'s a dodge. I know a dodge.'],
  });
  say('village.ask.wizrumor.half', {
    _: ['Only the HALF? Sit down. Tell me the rest.', 'The half! What\'s the other half? No, don\'t tell me. Yes, tell me.'],
    child: ['WHAT\'S THE OTHER HALF?'],
  });
  say('village.ask.wizrumor.tellsome', {
    _: ['Some! I\'ll tell the innkeeper. That\'s all of them.', 'Only some. Yes. The right some.'],
    witty: ['Telling some in Thistledown is telling all by supper.'],
  });
  say('village.ask.wizrumor.oldman', {
    _: ['An old man with a hat. And fireworks. And a great deal you don\'t say.', 'Ha! Only an old man. I\'ll believe that when your hat stops twinkling.'],
    dreamy: ['That\'s what all the best stories say about the wizard, at the start.'],
    shy: ['...I don\'t think you\'re only anything.'],
    child: ['You\'re not OLD. You\'re a WIZARD.'],
  });

  // =================================================================================
  // More to say: variety for every moment above
  // =================================================================================
  say('village.ask.feud.side', {
    dreamy: ['I\'m on the side of them both being friends again. Is that a side?'],
    rift: ['Team {vFeudFav}. Quietly. I\'m not getting dragged in.'],
    elder: ['{VFeudFav}\'s. But I knew {vFeudFav}\'s mother, so I\'m biased.'],
  });
  say('village.ask.feud.both', {
    dreamy: ['Both. Like two cats on one wall.'],
    rift: ['Both. Classic. Two nodes, one bad connection.'],
  });
  say('village.ask.feud.bigger', {
    cheerful: ['Bigger! Ha! {VFeudFav} will love that word. I\'ll say it with a wink.'],
    ornery: ['Bigger. Hmph. {VFeudFav}\'s big enough already. In the head.'],
  });
  say('village.ask.feud.catching', {
    cheerful: ['Catching! Ha! Then I\'ll catch something nicer. A cold, maybe.'],
    proud: ['I don\'t catch things. I\'m above it.'],
  });
  say('village.ask.feud.pie', {
    cheerful: ['Ha! A burning pie of peace! Oh, I\'d pay to see that!'],
    ornery: ['You\'d set fire to the pie and the hedge. Stay away from both.'],
  });
  say('village.ask.feud.notme', {
    gloomy: ['Me? They\'d both end up cross with me. They always do.'],
    witty: ['I\'m a peacemaker of no experience and less courage.'],
  });
  say('village.ask.feud.young', {
    cheerful: ['Ha! Young! They\'re both over a hundred, between them. Each.'],
    gloomy: ['It keeps them something. Not young.'],
  });

  lines('village.contest.open', [{ if: { season: 'autumn' }, text: ['The fair\'s nearly on us, {name}. What are you entering?'] }, { if: { season: 'winter' }, text: ['Planning next year\'s fair already, {name}? I know the type.'] }]);
  say('village.contest.start', {
    elder: ['{VContestPrize}. I\'ve entered sixty times. Won nine. They were the best nine days of my life.'],
  }, [{ if: { season: 'autumn' }, text: ['{VContestPrize}. The fair\'s days away and I\'m not sleeping.'] }]);
  say('village.contest.fair', {
    proud: ['Fair, always. That\'s the only win worth having.'],
    cheerful: ['Fair and square! And with a bit of luck!'],
    ornery: ['Fair. Which is more than some will manage.'],
  });
  say('village.contest.safe', {
    shy: ['...Thank you. I\'ve never told anyone that.'],
    proud: ['Good. It\'s a family secret. Family secrets stay secret.'],
    witty: ['Already forgotten? Good. I\'ll test you later.'],
  });
  say('village.contest.cheer', {
    cheerful: ['Oh, please! The louder the better!'],
    ornery: ['Cheer if you like. Quietly. The judges are touchy.'],
  });
  say('village.contest.practice', {
    proud: ['Critics? I\'ll win them over in one bite.'],
    witty: ['The Badger crowd will eat my practice entries and call it criticism.'],
  });
  say('village.contest.sparkle', {
    cheerful: ['Ha! A sparkle! Oh, you\'re terrible!'],
    ornery: ['Not a sparkle. Not a glimmer. Not a twinkle.'],
  });
  say('village.contest.enter', {
    cheerful: ['Oh, do! A wizard at the fair! They\'d have to make a new prize!'],
    gloomy: ['You\'d win. Of course you would.'],
  });

  lines('village.wishlist.open', [{ if: { stage: 'elder' }, text: ['If you could leave the village one thing, {name}, what would it be?'] }]);
  say('village.wishlist.start', {
    elder: ['{VWishFor}. I\'d like to see it before I go. That\'s my wish.'],
  });
  say('village.wishlist.butter', {
    cheerful: ['Ha! Butter! Everything melts in butter! Even old Grumbles!'],
    ornery: ['Bake for them. Hmph. They should bake for me.'],
    witty: ['Butter diplomacy. The Shire\'s oldest art.'],
  });
  say('village.wishlist.spread', {
    ornery: ['Tell them. They don\'t listen to me.'],
    cheerful: ['Oh, yes! Tell everyone! The more the merrier!'],
  });
  say('village.wishlist.board', {
    curious: ['I\'ll draw a little picture on the notice. Folk read pictures.'],
    witty: ['The board. Next to the lost hen. Good company.'],
  });

  say('village.ask.secret.good', {
    shy: ['...I try to be. Thank you.'],
    proud: ['I am. Thank you for noticing.'],
    gloomy: ['A good friend. I don\'t feel it. But thank you.'],
  });
  say('village.ask.secret.worry', {
    shy: ['...That {vSecretAbout} will think I told. I didn\'t. Well. I told you.'],
    gloomy: ['That it\'ll all go wrong. That\'s always the worry.'],
  });
  say('village.ask.secret.why', {
    curious: ['Because you\'re the only one who won\'t ask me twenty questions about it. I would.'],
    proud: ['Because you\'re discreet. Discretion is rare.'],
  });
  say('village.ask.secret.sky', {
    cheerful: ['Ha! Don\'t you dare! ...In pink, maybe.'],
    shy: ['Oh no. Oh, please don\'t.'],
  });
  say('village.ask.secret.hour', {
    cheerful: ['An hour! Ha! That\'s longer than me!'],
    shy: ['...An hour? Oh. Maybe I won\'t tell you, then.'],
  });
  say('village.ask.secret.safe', {
    cheerful: ['Oh, thank you! I knew you\'d keep it!'],
    proud: ['I knew I chose well.'],
  });

  say('village.ask.wizrumor.half', {
    cheerful: ['The HALF! Ooh! I\'ll put the kettle on!'],
    ornery: ['Half. Hmph. Wizards and their halves.'],
  });
  say('village.ask.wizrumor.tellsome', {
    cheerful: ['I\'ll tell some! All the some! Every some!'],
    shy: ['I\'ll only tell one person. That\'s some.'],
  });
  say('village.ask.wizrumor.deny', {
    rift: ['False. Noted. Disappointing, but noted.'],
    elder: ['That\'s what you said fifty years ago too.'],
  });
  say('village.ask.wizrumor.jest', {
    proud: ['A charming non-answer. Very wizardly.'],
    shy: ['...Oh. Ha. I think that\'s a yes.'],
    rift: ['Unclear response. I\'ll mark it as true.'],
  });
});
