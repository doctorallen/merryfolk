'use strict';
// ---------------------------------------------------------------------------
// Pastimes, part one: the crafts. Deep threads for whittling, basket-weaving,
// pottery, knitting and painting (js/hobbies.js): the craft itself, the piece
// on the bench, the one that went wrong, the best they ever made, and what
// they'd make if they could make anything. Also the facts every pastimes pack
// leans on: second hobby, latest piece, tallies, top leisure habits,
// favourite food, the garden, the masterpiece. The other parts are
// pastimes2 (collecting, birds, masterpieces, gifts, teaching, showing the
// wizard), pastimes3 (the inn, the pipe, fishing, the garden, mushrooming)
// and pastimes4 (reading, strolling, napping, tea, food, baking, games).
// ---------------------------------------------------------------------------

talkPack('pastimes', () => {
  const has = (x) => x != null && x !== false && x !== '' && x !== 0;
  // Each text that names a fact which may be missing is filed under a copy of its rule
  // that requires the fact (at the same specificity), so nothing is ever left unfilled.
  const ALWAYS = new Set(['name', 'surname', 'full', 'they', 'them', 'their', 'wiz', 'season', 'weather', 'hour', 'temper', 'stage', 'mood', 'register']);
  const guard = (rules) => {
    const out = [];
    for (const r of rules) {
      const groups = new Map();
      for (const t of r.text) {
        const need = [...new Set([...t.matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1][0].toLowerCase() + m[1].slice(1)))].filter((k) => !ALWAYS.has(k) && !(r.if && k in r.if)).sort();
        const g = need.join(',');
        if (!groups.has(g)) groups.set(g, { need, text: [] });
        groups.get(g).text.push(t);
      }
      for (const { need, text } of groups.values()) {
        if (!need.length) { out.push({ ...r, text }); continue; }
        const cond = { ...(r.if || {}) }; for (const k of need) cond[k] = has;
        out.push({ ...r, if: cond, pri: (r.pri || 0) - need.length, text });
      }
    }
    return out;
  };
  const L = (key, base, by, more) => lines(key, guard([{ text: base }, ...Object.keys(by || {}).map((t) => ({ if: { temper: t }, text: by[t] })), ...(more || [])]));
  const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const numWord = (n) => (n <= 20 ? NUM[n] : String(n));

  // --- Facts: the pastimes, habits and small pleasures of this hobbit ------------------
  const SHORT = { carving: 'carve', basketry: 'basket', pottery: 'pot', knitting: 'knit', painting: 'paint', collecting: 'collect', birdwatching: 'bird' };
  const LAST = {
    carving: ['badger', 'owl', 'rabbit', 'hedgehog', 'pig', 'fox', 'dragon', 'pony', 'frog'],
    basketry: ['egg basket', 'log basket', 'linen basket', 'bread basket', 'picnic hamper', 'fine willow basket'],
    pottery: ['jug', 'honey pot', 'bowl', 'jar'],
    knitting: ['scarf', 'pair of mittens', 'tea cosy', 'woolly hat', 'pair of socks', 'blanket'],
    painting: ['the river', 'the Hill', 'the mill', 'the orchard'],
  };
  const RARE = ['kingfisher', 'nightingale', 'hoopoe', 'waxwing', 'barn owl', 'dipper', 'goldcrest', 'cuckoo', 'snipe', 'treecreeper'];
  const LEISURE = { ale: 'ale', eat_inn: 'inn', smoke: 'pipe', fish: 'fishing', garden: 'garden', forage: 'mushrooms', read: 'reading', nap: 'napping', stroll: 'strolling', tea: 'tea', bake_home: 'baking', potter: 'pottering', party: 'dancing' };
  addFacts((v, F) => {
    const hs = typeof hobbiesOf === 'function' ? hobbiesOf(v) : [];
    const st = v.stats || {}, sk = v.hobbySkill || {};
    F.hobbies = hs.slice();
    F.pastime2 = hs[1] || null;
    F.pastime2Word = hs[1] ? hobbyName(v, hs[1]).toLowerCase() : null;
    F.pastimeLevel = hs[0] ? Math.round(sk[hs[0]] || 0) : 0;
    let show = null;
    for (const k in SHORT) {
      const s = SHORT[k], on = hs.includes(k);
      const n = !on ? 0 : k === 'birdwatching' ? (v.birds || 0) : k === 'collecting' ? (st.finds || 0) : (st['made_' + k] || 0);
      F[s + 'N'] = n;
      F[s + 'Level'] = on ? Math.round(sk[k] || 0) : 0;
      F[s + 'Skill'] = on ? hobbySkillWord(sk[k] || 0) : null;
      F[s + 'Tally'] = n > 0 ? (k === 'birdwatching' ? `${numWord(n)} kind${n === 1 ? '' : 's'} of bird` : `${numWord(n)} ${HOBBIES[k].made[n === 1 ? 0 : 1]}`) : null;
      // the piece on the bench, or the last one finished
      F[s + 'Last'] = on && LAST[k] ? LAST[k][Math.floor(hash2(v.id * 3 + n, 41) * LAST[k].length)] : null;
      if (!show && n > 0 && LAST[k]) show = k;
    }
    F.pastimeTally = hs[0] ? F[SHORT[hs[0]] + 'Tally'] : null;
    F.pastime2Tally = hs[1] ? F[SHORT[hs[1]] + 'Tally'] : null;
    // birds: the latest written up, and the one they're still waiting for
    const nb = F.birdN;
    F.birdLast = nb > 0 ? BIRDS[(v.id * 7 + (nb - 1) * 13) % BIRDS.length] : null;
    const seenB = new Set(); for (let i = 0; i < nb; i++) seenB.add(BIRDS[(v.id * 7 + i * 13) % BIRDS.length]);
    const want = RARE.filter((b) => !seenB.has(b));
    F.birdWant = hs.includes('birdwatching') && want.length ? want[Math.floor(hash2(v.id, 43) * want.length)] : null;
    // the collection on the shelf at home
    const home = v.homeId >= 0 && World.homes[v.homeId] ? v.home() : null;
    const C = home && home.collection ? home.collection : {};
    const top = Object.keys(C).filter((k) => C[k] > 0 && COLLECT_KINDS[k]).sort((a, b) => C[b] - C[a])[0];
    F.collectKind = hs.includes('collecting') && top ? COLLECT_KINDS[top][1] : null;
    F.collectOne = hs.includes('collecting') && top ? COLLECT_KINDS[top][0] : null;
    F.collectTrinkets = !!(C.trinkets > 0);
    F.collectCoins = !!(C.coins > 0);
    // a piece to show: the latest thing made in their first craft that has any
    F.showKind = show;
    F.showPiece = show ? { carving: `carved ${F.carveLast}`, basketry: F.basketLast, pottery: F.potLast, knitting: F.knitLast, painting: `painting of ${F.paintLast}` }[show] : null;
    // a masterpiece, theirs or a neighbour's
    const mps = Game.masterpieces || [];
    const mp = mps.find((m) => m.by === v.id);
    F.masterpiece = v.masterpiece || null;
    F.masterThing = mp ? mp.thing : null;
    F.masterShows = mp ? mp.shows : null;
    const omp = mps.find((m) => m.by !== v.id && personById(m.by));
    F.otherMaster = omp ? omp.name : null;
    F.otherMasterBy = omp ? personById(omp.by).first : null;
    F.inspired = !!v.inspired;
    // presents made and given: the recipient remembers it
    F.giftTo = null; F.giftWhat = null;
    const re = new RegExp(`^${v.first} gave me an? (.+?) they made\\.$`);
    // (first names can repeat, so the piece must be one of theirs)
    const MADE = { carving: /carved/, basketry: /basket/, pottery: /jug|pot|bowl|jar/, knitting: /scarf|mittens|cosy|hat|socks|blanket/, painting: /painting/ };
    const mine = (w) => hs.some((k) => MADE[k] && MADE[k].test(w));
    for (const o of Game.villagers) { if (o === v) continue; const m = (o.memories || []).map((x) => re.exec(x.t)).find((x) => x && mine(x[1])); if (m) { F.giftTo = o.first; F.giftWhat = m[1]; break; } }
    const gm = (v.memories || []).map((x) => /^(\S+) gave me an? (.+?) they made\.$/.exec(x.t)).find(Boolean);
    F.giftFrom = gm ? gm[1] : null; F.giftFromWhat = gm ? gm[2] : null;
    // habits: the small pleasures they've grown fond of
    const W = v.weights || {}, tas = (v.genes && v.genes.taste) || {};
    const hab = Object.keys(LEISURE).filter((a) => ACTIONS[a] && (!ACTIONS[a].stages || ACTIONS[a].stages.includes(v.stage))).map((a) => [(W[a] || 1) * (tas[a] || 1), LEISURE[a]]).sort((a, b) => b[0] - a[0]);
    F.habits = hab.filter((h) => h[0] >= 1.2).slice(0, 4).map((h) => h[1]);
    F.leisure = hab.length && hab[0][0] >= 1.05 ? hab[0][1] : null;
    // food
    const fav = typeof v.favouriteFood === 'function' ? v.favouriteFood() : null;
    F.favFood = fav; F.favFoodWord = fav && FOODS[fav] ? FOODS[fav].label : null;
    let worst = null, ws = 9;
    for (const k of PANTRY_KINDS) { const s = ((v.genes.food || {})[k] || 1) * ((v.foodLike || {})[k] || 1); if (s < ws) { ws = s; worst = k; } }
    F.hateFood = worst && worst !== fav && ws < 0.9 ? worst : null; F.hateFoodWord = F.hateFood ? FOODS[F.hateFood].label : null;
    // the garden, the river, the pipe, the book
    F.gardener = !!(home && home.plots && home.plots.length) && v.isGrown();
    F.crop = F.gardener ? home.cropType : null; F.cropWord = F.crop ? CROP_PLURAL[F.crop] : null;
    F.fishN = st.fish || 0;
    F.pipe = v.isGrown() && (v.genes.pipeLove || 0) > 0.4;
    F.pouch = v.pouch || 0;
    F.reader = (v.edu || 0) >= 0.15;
    F.rivalWhat = v.rival != null && v.rivalSkill && CONTESTS[v.rivalSkill] ? CONTESTS[v.rivalSkill][1] : null;
    const won = (v.memories || []).map((x) => /^Won (.+?) at the/.exec(x.t)).find(Boolean);
    F.won = won ? won[1] : null;
  });

  // ==================================================================================
  // --- Whittling and wood-carving ---------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.carving', about: 'pastime', reveals: 'pastime.carving', weight: 1, cool: 5,
    label: (F) => (F.stage === 'child' ? 'How\'s the whittling?' : 'How\'s the carving coming on?'),
    when: (F) => (F.hobbies || []).includes('carving'),
    rel: (F) => (F.pastime === 'carving' ? 1.3 : 0.9),
    open: { ask: 'pastime.carving.open' },
    beats: {
      start: { line: 'pastime.carving.start', go: [
        { ap: 'ask', say: 'What\'s on the bench just now?', to: 'piece' },
        { ap: 'jest', say: 'Still turning herons into badgers?', to: 'heron' },
        { ap: 'ask', say: 'What wood do you like best?', to: 'wood' },
      ] },
      piece: { line: 'pastime.carving.piece', fx: { learn: ['pastime.carving', '{Name} carves little animals: the latest is a {carveLast}'] }, go: [
        { ap: 'warm', say: 'Might I see it?', to: 'see' },
        { ap: 'ask', say: 'How do you know when one\'s finished?', to: 'finished' },
        { ap: 'jest', say: 'Does it look like anyone we know?', to: 'likeness' },
      ] },
      heron: { line: 'pastime.carving.heron', fx: { joke: { k: 'pastime.heron', t: 'The heron that came out a badger.' } }, go: [
        { ap: 'ask', say: 'What went wrong with it?', to: 'wrong' },
        { ap: 'jest', say: 'Badgers are only herons that gave up.', to: 'likeness' },
        { ap: 'warm', say: 'I\'d have liked the badger anyway.', to: 'see' },
      ] },
      wood: { line: 'pastime.carving.wood', go: [
        { ap: 'ask', say: 'And the knife? Is it a good one?', to: 'knife', need: { open: 1 }, soft: true },
        { ap: 'share', say: 'My staff is ash, I\'m told. I\'ve never asked it.', to: 'staff' },
        { ap: 'listen', say: '*You nod, and let them talk wood.*', label: 'Let them talk wood', to: 'finished' },
      ] },
      knife: { line: 'pastime.carving.knife', fx: { confide: { k: 'pastime.carving.knife', t: '{Name} carves with an old family knife, and nobody else may sharpen it' } }, go: [
        { ap: 'warm', say: 'Then it\'s in good hands.', to: 'end' },
        { ap: 'ask', say: 'Would you ever teach someone with it?', to: 'teach' },
      ] },
      staff: { line: 'pastime.carving.staff', go: [
        { ap: 'jest', say: 'It\'s never answered back. Not once in three hundred years.', to: 'end' },
        { ap: 'ask', say: 'Could you carve a head on it? An owl, say?', to: 'owlstaff', need: { fond: 0.15 }, soft: true },
      ] },
      owlstaff: { line: 'pastime.carving.owlstaff', fx: { promise: { k: 'pastime.staff', t: '{Name} said they\'d carve an owl\'s head for your staff, one day', days: 10 }, fond: 0.02 }, end: true },
      see: { line: 'pastime.carving.see', notice: 'pastime.carving.notice', go: [
        { ap: 'warm', say: 'It\'s lovely. It really is.', to: 'praised' },
        { ap: 'jest', say: 'It\'s looking at me. Is it meant to be looking at me?', to: 'likeness' },
        { ap: 'advise', say: 'A touch more off the ears, perhaps?', to: 'advised' },
      ] },
      finished: { line: 'pastime.carving.finished', go: [
        { ap: 'ask', say: 'And the best you ever made?', to: 'best', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'That\'s wise, that is. Wiser than most wizards.', to: 'end' },
      ] },
      likeness: { line: 'pastime.carving.likeness', go: [
        { ap: 'jest', say: 'Then carve me next. My good side is the hat.', to: 'end', fx: { joke: { k: 'pastime.hatside', t: 'The wizard\'s good side is his hat.' } } },
        { ap: 'warm', say: 'Whoever it is, they\'re lucky to be carved so kindly.', to: 'end' },
      ] },
      wrong: { line: 'pastime.carving.wrong', go: [
        { ap: 'comfort', say: 'Every carver keeps a box of mistakes.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'jest', say: 'Sell it as a heron-badger. A very rare beast.', to: 'end' },
      ] },
      best: { line: 'pastime.carving.best', go: [
        { ap: 'warm', say: 'You\'ll make a better one yet.', to: 'end' },
        { ap: 'ask', say: 'If you could carve anything at all, what would it be?', to: 'dream' },
      ] },
      dream: { line: 'pastime.carving.dream', fx: { learn: ['pastime.carving.dream', '{Name} dreams of carving something grand one day'], trust: 0.02 }, go: [
        { ap: 'warm', say: 'Then start it this winter. I\'d come and see.', to: 'end', fx: { hook: 'pastime.carving' } },
        { ap: 'advise', say: 'Start small. A great work is a lot of small ones.', to: 'end', fx: { respect: 0.02 } },
      ] },
      praised: { line: 'pastime.carving.praised', fx: { fond: 0.02, feel: 'made_piece', feelX: 'carving' }, end: true },
      advised: { line: 'pastime.carving.advised', end: true },
      teach: { line: 'pastime.carving.teach', end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  L('pastime.carving.open', ['I hear you\'ve a knife and a block of wood on the go, {name}.', 'Shown me your hands, {name}. Those are a carver\'s hands.', 'Still whittling of an evening, {name}?'], {}, [
    { if: { stage: 'child' }, text: ['Somebody\'s been whittling, {name}. There are shavings in your hair.', 'I hear you\'re allowed a knife now, {name}. Very grown-up.'] },
    { if: { season: 'winter' }, text: ['A good season for carving by the fire, {name}. Are you?', 'Long evenings, {name}. Plenty of time for the knife.'] },
    { if: { carveLevel: { min: 45 } }, text: ['Folk tell me you\'re the best carver this side of the Water, {name}.', 'I saw one of your carvings on a windowsill, {name}. Lovely work.'] },
  ]);
  L('pastime.carving.start', ['Oh, whittling away. Most evenings, if I\'m honest.', 'Coming on. Slowly. Wood won\'t be hurried.', 'Not bad! {CarveTally} so far.'], {
    cheerful: ['Oh, I love it! {CarveTally} and every one a joy.', 'Coming on a treat! I\'ve hardly cut myself at all this week.'],
    ornery: ['It\'s coming on fine, no thanks to the wood.', 'Slowly. Everyone wants one and nobody wants to wait.'],
    shy: ['...Oh. It\'s just a bit of whittling. Nothing really.', '...You heard about that? It\'s only little animals.'],
    curious: ['Did you know every wood smells different when you cut it? Cherry smells of jam.', 'I\'m trying a new cut. Slanted, like a beak. It might work.'],
    dreamy: ['I just let the knife find what\'s in the wood. It\'s usually a badger.', 'Of an evening, by the fire. The shavings curl like little waves.'],
    witty: ['It\'s coming on. The wood\'s winning, but only on points.', 'Splendidly. I\'ve only carved one thumb this week.'],
    proud: ['Very well indeed. {CarveTally}, and not a bad one among them.', 'Rather well. I\'m {carveSkill}, you know. Folk say so.'],
    gloomy: ['Badly. Everything comes out looking sad.', 'It\'s something to do with my hands. Keeps the thoughts off.'],
    child: ['I made a {carveLast}! Well. Mostly. It\'s got three legs.', 'I\'m allowed a knife! A real one! I only cut myself twice.'],
  }, [
    { if: { stage: 'elder' }, text: ['My hands aren\'t what they were. But they remember how.', 'Sixty years of whittling and the wood still surprises me.'] },
    { if: { carveLevel: { max: 19 } }, text: ['I\'m just starting. Mostly I make very small logs.', 'Badly, if you want the truth. But I\'m enjoying it.'] },
    { if: { carveLevel: { min: 75 } }, text: ['Well, I\'ve got the knack now. The wood listens, mostly.', 'These days the hard part is choosing what to carve.'] },
    { if: { season: 'winter' }, text: ['Busy! Winter\'s for carving. The fire, a knife, a bit of lime-wood.'] },
    { if: { rift: true }, text: ['Back home nothing was made of wood. Here everything is. I can\'t stop carving it.'] },
  ]);
  L('pastime.carving.piece', ['Something small. An animal. It\'ll tell me which when it\'s ready.', 'A little {carveLast}. Nearly done. The ears are the hard bit.', 'A {carveLast}. Don\'t look too close at the feet.', 'There\'s a {carveLast} on the bench. Or there will be, by Highday.'], {
    cheerful: ['A {carveLast}! It\'s got such a cheeky face. I keep laughing at it.', 'Oh, a {carveLast}. My best yet, I think. I think that every time.'],
    ornery: ['A {carveLast}. It\'s fighting me every inch.', 'A {carveLast}, if the wood stops splitting on me.'],
    shy: ['...A {carveLast}. A little one. It\'s not very good.', '...Just a {carveLast}. For the windowsill.'],
    curious: ['A {carveLast}. I went and watched a real one for an hour first. They fidget.', 'A {carveLast}. Did you know the hardest part of any animal is the knees?'],
    dreamy: ['A {carveLast}. I could see it in the wood before I cut it. Honestly.', 'A {carveLast}, sleeping. I wanted something peaceful.'],
    witty: ['A {carveLast}. Or a potato with ambitions. We\'ll see which.', 'A {carveLast}. It started as a horse, but we don\'t talk about that.'],
    proud: ['A {carveLast}. You\'ll not find a better one in the Shire.', 'A {carveLast}, with every whisker cut. Every one.'],
    gloomy: ['A {carveLast}. It looks how I feel.', 'A {carveLast}. Half done. Like most things.'],
    child: ['A {carveLast}! It\'s for my mum. Don\'t tell her.', 'A {carveLast}! Do you want to know its name? It\'s Bumble.'],
  }, [
    { if: { carveLast: 'dragon' }, text: ['A dragon! A little one. It\'s supposed to look fierce. It looks hungry.', 'A dragon. The wings keep snapping. Real ones must be sturdier.'] },
    { if: { carveLast: 'owl' }, text: ['An owl. I\'ve done the eyes three times. Owls are all eyes.'] },
    { if: { carveLast: 'hedgehog' }, text: ['A hedgehog. Do you know how many spines a hedgehog has? Neither do I. I\'ve stopped counting.'] },
    { if: { carveLast: 'pig' }, text: ['A pig. A fat, happy pig. It\'s the easiest thing to carve. Pigs are mostly round.'] },
    { if: { carveLast: 'frog' }, text: ['A frog. I\'ve made it look surprised. All frogs look surprised.'] },
    { if: { spouse: has }, text: ['A {carveLast}, for {spouse}. {Spouse} thinks I\'m mending the gate.'] },
    { if: { kid: has }, text: ['A {carveLast} for {kid}. Something to put on the shelf by the bed.'] },
  ]);
  L('pastime.carving.heron', ['Ha! You heard about the heron. Everyone\'s heard about the heron.', 'That heron. I\'ll never live it down. It did look like a badger.', 'Once! It happened once. ...Twice.'], {
    cheerful: ['Ha! Oh, that heron. I gave it a stripe and called it a badger. Nobody knew.', 'Ha! I still have it. It\'s my favourite, really.'],
    ornery: ['Who told you about that? It was the wood\'s fault.', 'That heron would have been perfect if the knot hadn\'t been there.'],
    shy: ['...Oh no. Who told you? It was meant to be a heron.', '...It still sits on my shelf. I can\'t look at it.'],
    curious: ['The neck. Herons are mostly neck, and necks snap. I\'ve been trying to work out why.', 'I think I cut across the grain. Wood is like hair, you know. It has a way it wants to go.'],
    dreamy: ['Maybe it wanted to be a badger all along. Who am I to argue with a block of wood?', 'I think the heron just flew off and left the badger behind.'],
    witty: ['The heron was a badger in disguise. I simply set it free.', 'It\'s a heron. A heron that\'s let itself go.'],
    proud: ['That was years ago. My herons now are the envy of the lane.', 'I\'ll have you know it was a deliberate badger.'],
    gloomy: ['Most of my herons are badgers. Most of my plans are badgers.', 'Yes. That\'s about how things go for me.'],
    child: ['It was a duck! It was meant to be a duck and it came out a sausage!', 'Hee! Mine came out a sausage. A sausage with a beak.'],
  }, [
    { if: { known: 'pastime.carving' }, text: ['You remember that! Oh dear. The {carveLast} came out better, at least.'] },
    { if: { carveLevel: { min: 45 } }, text: ['I keep it on the mantel to stay humble. It doesn\'t work.'] },
  ]);
  L('pastime.carving.wood', ['Lime-wood. Soft, no knots, cuts like cheese.', 'Cherry, when I can get it. It goes a lovely red with oil.', 'Whatever the woodwright leaves behind. Off-cuts are free.'], {
    cheerful: ['Oh, lime-wood! It smells lovely and it never fights you.', 'Anything! Holly, beech, an old fence post once. That was a good fence post.'],
    ornery: ['Not oak. Oak is for doors and stubborn folk.', 'Lime. Anyone who tells you otherwise is selling something.'],
    shy: ['...Lime, mostly. It\'s gentle.', '...Whatever I find. I don\'t like to ask.'],
    curious: ['Box-wood for small things, it holds a fine edge. Lime for big. Never pine. Pine bleeds.', 'I\'ve been trying pear. It\'s hard, but you can carve a whisker in it.'],
    dreamy: ['Apple wood. From the old tree that came down. It feels like it remembers the blossom.', 'Wood from the river. It\'s been places. You can feel it.'],
    witty: ['Lime. Easy to carve, easy to forgive. Like a good hobbit.', 'Anything that isn\'t a table leg. I\'ve been told off about table legs.'],
    proud: ['Box-wood. It\'s hard as bone and only a fine hand can manage it.', 'Cherry. It takes a polish like a pond at dawn.'],
    gloomy: ['Whatever doesn\'t split. Which is nothing, lately.', 'It all splits in the end.'],
    child: ['Sticks! Good sticks. I have a stick pile.', 'Lime-wood! It\'s soft so you don\'t cut yourself. Much.'],
  }, [
    { if: { job: 'woodwright' }, text: ['Off-cuts from my own felling. A carver\'s perk, that is.'] },
    { if: { rift: true }, text: ['Back home wood was a luxury. Real wood. I still can\'t believe you just let it grow on trees.'] },
    { if: { stage: 'elder' }, text: ['Lime. My grandmother swore by lime, and she swore at everything else.'] },
  ]);
  L('pastime.carving.knife', ['It was my grandfather\'s. Nobody else sharpens it. Nobody.', 'An old blade, worn thin as a leaf. It knows the way better than I do.'], {
    cheerful: ['Oh, it\'s the best knife in the world. It was my gran\'s. She\'d have liked that I use it.'],
    ornery: ['Nobody touches that knife. I mean it. Nobody.'],
    shy: ['...It was my grandad\'s. I\'ve never told anyone that.'],
    curious: ['It\'s older than the mill, I think. The steel\'s different. Darker. I don\'t know where it came from.'],
    dreamy: ['When I hold it I can almost feel my grandfather\'s hand on mine. Silly, isn\'t it.'],
    witty: ['It\'s older than me and sharper than me. We get along.'],
    proud: ['It was my grandfather\'s, and he was the finest carver in three villages. I keep it as he did.'],
    gloomy: ['It\'s all I have of my grandfather. I\'d be lost without it.'],
    child: ['It used to be Grandad\'s! I\'m only allowed it if somebody\'s watching.'],
  }, [
    { if: { parent: has }, text: ['My {parent} gave it me. Said I\'d earned it. I hadn\'t, yet.'] },
  ]);
  L('pastime.carving.staff', ['Ash! Good wood, ash. Springy. It\'d never split.', 'Ha! I\'ve wondered about that staff. It\'s got a lovely grain.'], {
    cheerful: ['Oh, may I look? Ha! Somebody\'s carved little stars up the side. Did you know?'],
    ornery: ['It\'s been badly kept. Look at the bottom. Mud, mostly.'],
    shy: ['...I\'ve wondered about your staff. It\'s very handsome.'],
    curious: ['It\'s not ash. It\'s older than ash. I don\'t know what it is. Can I hold it?'],
    dreamy: ['I think it\'s listening. Wood does, sometimes.'],
    witty: ['Three hundred years and not one answer? Sounds like my uncle.'],
    proud: ['I could do a far finer job on that. With respect.'],
    gloomy: ['It\'s outlived everyone who made it. Wood does.'],
    child: ['Can I carve my name on it? Just a little? On the bottom?'],
  });
  L('pastime.carving.owlstaff', ['An owl\'s head. I could do that. Leave it with me. Well, not now. One day.', 'An owl! Yes. With big eyes. I\'ll think on it.'], {
    cheerful: ['Oh, yes! A wise old owl for a wise old wizard. I\'ll start the drawings tonight.'],
    ornery: ['Hm. Maybe. If you keep it out of the mud.'],
    shy: ['...Really? You\'d want one of mine? On your staff?'],
    proud: ['It would be the finest staff in the West. I\'ll think about it.'],
    witty: ['An owl on a staff. You\'ll look terribly wise. People will start asking you things.'],
    child: ['YES! An owl! With a hat! Like yours!'],
  });
  L('pastime.carving.see', ['*They fish a little {carveLast} out of a pocket.* There. Be honest.', 'Here. *They hold it out on a flat palm.* Mind the tail.'], {
    cheerful: ['Here he is! *A little {carveLast}, beaming.* Isn\'t he grand?'],
    ornery: ['Go on, then. *Thrusts out a {carveLast}.* Don\'t drop it.'],
    shy: ['...*They hold out a small {carveLast}, not quite looking at you.*'],
    curious: ['Look at the grain on the back. *Turns the {carveLast} to the light.* See how it follows the curve?'],
    dreamy: ['*They set a {carveLast} on the wall between you, as if it might wake.*'],
    witty: ['Behold. *A {carveLast}, held up like a trophy.* Applause may follow.'],
    proud: ['*They unwrap a {carveLast} from a clean cloth.* Every line by hand.'],
    gloomy: ['*They hand you a {carveLast}.* It\'s not right. You\'ll see.'],
    child: ['LOOK! *Pushes a lumpy {carveLast} into your hand.* That\'s its nose!'],
  });
  L('pastime.carving.notice', ['There\'s sawdust in their cuffs, and a sticking plaster on one thumb.', 'Their thumb is nicked in a dozen places, long healed.'], {}, [
    { if: { carveLevel: { min: 45 } }, text: ['The cuts are clean and sure. Somebody has done this a thousand times.'] },
    { if: { stage: 'child' }, text: ['There are three plasters on that thumb, and a fourth on the other.'] },
  ]);
  L('pastime.carving.finished', ['When I stop wanting to take a bit more off. That\'s when.', 'You don\'t. You just stop. Then you see what you should have done.'], {
    cheerful: ['When it smiles at me! They all smile in the end.'],
    ornery: ['When I\'m sick of the sight of it.'],
    shy: ['...I don\'t know. I always think they could be better.'],
    curious: ['I run my thumb over it with my eyes shut. If nothing catches, it\'s done.'],
    dreamy: ['When it looks like it might walk off the shelf in the night.'],
    witty: ['When there\'s no more wood to take away. Or when supper\'s ready.'],
    proud: ['I know. A craftsman knows.'],
    gloomy: ['They\'re never finished. I just give up on them.'],
    child: ['When Mum says it\'s bedtime!'],
  }, [
    { if: { stage: 'elder' }, text: ['My father said a carving\'s done when it would be a shame to cut more. He was right.'] },
  ]);
  L('pastime.carving.likeness', ['...It might have a look of the miller. Around the jowls.', 'Ha! Well. It\'s got your nose. I didn\'t mean it to.'], {
    cheerful: ['Ha! It looks like my uncle Bungo. Everything I carve does.'],
    ornery: ['It looks like a {carveLast}. That\'s the idea.'],
    shy: ['...It might look a bit like me. Don\'t tell anyone.'],
    curious: ['Do you know, I think it does! Do we all carve ourselves, without meaning to?'],
    dreamy: ['It looks like someone I knew once. A long time ago.'],
    witty: ['It\'s the spit of the postie. Don\'t tell the postie.'],
    proud: ['A good carving has character. This one has lots.'],
    gloomy: ['It looks like I feel. Tired.'],
    child: ['It looks like YOU! Look! It\'s got a beard!'],
  }, [
    { if: { rival: has }, text: ['Honestly? It looks like {rival}. I didn\'t do it on purpose. Mostly.'] },
    { if: { spouse: has }, text: ['{Spouse} says it looks like me. I say it looks like {spouse}.'] },
  ]);
  L('pastime.carving.wrong', ['Cut too deep at the neck. Off came the head. Rolled under the dresser.', 'A knot. Right where the eye went. It looked like it was winking at me.'], {
    cheerful: ['Oh, everything! But I made it into a badger and it\'s the best one I have.'],
    ornery: ['The wood had a knot in it. Wood\'s full of spite.'],
    shy: ['...I wasn\'t paying attention. I was thinking about something else.'],
    curious: ['I cut across the grain at the neck. Wood\'s like a bundle of straws. Cut across, and it snaps.'],
    dreamy: ['I was watching the fire and my hands went on without me.'],
    witty: ['I sneezed. Never sneeze while carving a neck.'],
    proud: ['A flaw in the wood. Not in the carver.'],
    gloomy: ['I did. I always do. Something always goes.'],
    child: ['I dropped it in the pond. Then a duck sat on it.'],
  });
  L('pastime.carving.best', ['The best? A hare, sitting up. I gave it away. I still miss it.', 'An owl for my grandmother\'s grave. I won\'t make another like it.'], {
    cheerful: ['Oh, a dancing pig for the harvest fair! Everyone laughed. In a good way.'],
    ornery: ['I gave the best one away, more fool me.'],
    shy: ['...A little wren. I gave it to someone. They don\'t know it was me.'],
    curious: ['A fox, curled up asleep. I did the fur with the tip of the knife, one hair at a time.'],
    dreamy: ['A pair of swallows, flying. You could almost hear them.'],
    witty: ['My first badger. It was meant to be a heron, but it was the best badger I ever made.'],
    proud: ['A stag, a hand high. Folk came from the mill just to see it.'],
    gloomy: ['I haven\'t made it yet. I don\'t think I will.'],
    child: ['My {carveLast}! It\'s the best one! It\'s the ONLY one!'],
  }, [
    { if: { masterpiece: has }, pri: 2, text: ['{Masterpiece}. You\'ve heard. I don\'t know where it came from. A day and a night and there it was.', 'The {masterThing}. {Masterpiece}. I can\'t look at it without shaking.'] },
    { if: { giftTo: has }, pri: 1, text: ['The one I gave {giftTo}. A {giftWhat}. It came out better than I deserved.'] },
  ]);
  L('pastime.carving.dream', ['A cradle. Carved all over. For a baby who doesn\'t exist yet.', 'A chest, with the whole valley round the sides. The mill, the river, every hole.'], {
    cheerful: ['A merry-go-round! Little ponies going round and round. For the children.'],
    ornery: ['A proper front door. Oak. With a knocker that bites.'],
    shy: ['...A chess set. Everyone in the lane, as a piece. Don\'t laugh.'],
    curious: ['A clock. A wooden clock. All wooden, the cogs too. Is that possible? I think it\'s possible.'],
    dreamy: ['A ship. A great ship with all its sails, like in the old songs about the sea.'],
    witty: ['A wizard. Life size. To keep in the hall and frighten callers.'],
    proud: ['A great door for the Moot hall. Folk would talk about it for a hundred years.'],
    gloomy: ['A headstone. For when I go. Oh, don\'t look like that. A nice one.'],
    child: ['A DRAGON. A real-size one. And it can breathe fire. Somehow.'],
  }, [
    { if: { rift: true }, text: ['A map of the city. In wood. Every street I can remember, before I forget them.'] },
    { if: { kid: has }, text: ['A rocking horse for {kid}. Before {kid}\'s too big for it.'] },
  ]);
  L('pastime.carving.praised', ['Oh, go on. ...Do you really think so?', 'That\'s kind. It\'s only a bit of wood.'], {
    cheerful: ['Ha! You\'re a love. You can have the next one.'],
    ornery: ['Hmph. Well. It\'s not bad, I suppose.'],
    shy: ['*goes pink to the ears* ...Thank you.'],
    curious: ['Really? Which bit? The tail? I worried about the tail.'],
    dreamy: ['*smiles at it as if it\'s just said something*'],
    witty: ['Careful. I\'ll get a big head and have to carve a bigger hat.'],
    proud: ['It is, isn\'t it? I\'m glad you can see it.'],
    gloomy: ['...You\'re just being kind. ...Thank you, though.'],
    child: ['Hee! I\'m going to make you one! A wizard one!'],
  });
  L('pastime.carving.advised', ['The ears? ...Hm. You might be right. Blast.', 'More off the ears. Yes. I see it now.'], {
    cheerful: ['Oh! Yes! That\'s it! Thank you!'],
    ornery: ['When you\'ve carved a {carveLast}, wizard, you can talk to me about ears.'],
    shy: ['...Oh. Yes. I\'ll fix it.'],
    curious: ['Do you think so? Here? Or here? Show me.'],
    dreamy: ['Maybe. Or maybe it\'s listening for something.'],
    witty: ['A critic! In my own lane! I\'ll have you know those ears are avant-garde.'],
    proud: ['They\'re meant to be like that. ...I\'ll look at them again.'],
    gloomy: ['I knew it. It\'s ruined.'],
    child: ['NO it\'s got big ears because it LISTENS.'],
  });
  L('pastime.carving.teach', ['I might. If they\'d sit still and not cry over a nick or two.', 'Maybe. It\'s good to pass things on. My grandad would say so.'], {
    cheerful: ['Oh, I\'d love that! Send me anyone. Even you.'],
    ornery: ['Teach? I haven\'t the patience. ...Well. One, maybe.'],
    shy: ['...Me? Teach? I wouldn\'t know where to start.'],
    curious: ['I\'d have to work out how I do it first. I\'ve never thought about it.'],
    dreamy: ['One day. When I find someone who looks at wood the way I do.'],
    witty: ['First lesson: point it away from you. Second lesson: no, further away.'],
    proud: ['I\'d teach the right pupil. They\'d have to be serious.'],
    gloomy: ['Who\'d want to learn from me?'],
    child: ['I\'d teach my friends! Then we could all have knives! ...Mum says no.'],
  }, [
    { if: { kid: has }, text: ['I\'ve been meaning to teach {kid}. When {kid}\'s old enough for the knife.'] },
  ]);

  // ==================================================================================
  // --- Basket-weaving --------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.basketry', about: 'pastime', reveals: 'pastime.basketry', weight: 1, cool: 5,
    label: 'All those baskets',
    when: (F) => (F.hobbies || []).includes('basketry'),
    rel: (F) => (F.pastime === 'basketry' ? 1.3 : 0.9),
    open: { ask: 'pastime.basketry.open' },
    beats: {
      start: { line: 'pastime.basketry.start', go: [
        { ap: 'ask', say: 'Where do you get your reeds?', to: 'reeds' },
        { ap: 'jest', say: 'How many baskets does one hobbit need?', to: 'many' },
        { ap: 'warm', say: 'I saw one of yours by a door. A fine thing.', to: 'which' },
      ] },
      reeds: { line: 'pastime.basketry.reeds', fx: { learn: ['pastime.basketry', '{Name} weaves baskets from river reeds'] }, go: [
        { ap: 'ask', say: 'And how do you weave them, once they\'re cut?', to: 'how' },
        { ap: 'listen', say: '*You picture the river, and wait.*', label: 'Picture the river, and wait', to: 'river' },
        { ap: 'share', say: 'I slept in a reed-bed once. The frogs had opinions.', to: 'frogs' },
      ] },
      many: { line: 'pastime.basketry.many', fx: { joke: { k: 'pastime.baskets', t: 'You can never have too many baskets. You can only have too few shelves.' } }, go: [
        { ap: 'jest', say: 'Have you thought of a basket to keep the baskets in?', to: 'basketbasket' },
        { ap: 'ask', say: 'Who gets them all, then?', to: 'gives' },
      ] },
      which: { line: 'pastime.basketry.which', go: [
        { ap: 'ask', say: 'What\'s the hardest kind to make?', to: 'hard' },
        { ap: 'warm', say: 'It\'s good to see your work about the place.', to: 'gives' },
      ] },
      how: { line: 'pastime.basketry.how', go: [
        { ap: 'ask', say: 'Has one ever gone wrong?', to: 'wrong' },
        { ap: 'warm', say: 'It sounds like a kind of music, the way you tell it.', to: 'music' },
      ] },
      river: { line: 'pastime.basketry.river', fx: { trust: 0.02 }, go: [
        { ap: 'warm', say: 'It sounds like your favourite place.', to: 'end' },
        { ap: 'ask', say: 'Do you see much, down there?', to: 'see' },
      ] },
      frogs: { line: 'pastime.basketry.frogs', go: [
        { ap: 'jest', say: 'I said sorry. They didn\'t accept.', to: 'end' },
        { ap: 'ask', say: 'Is it peaceful, cutting reeds?', to: 'river' },
      ] },
      basketbasket: { line: 'pastime.basketry.basketbasket', end: true },
      gives: { line: 'pastime.basketry.gives', go: [
        { ap: 'ask', say: 'Would you ever sell them at market?', to: 'market' },
        { ap: 'warm', say: 'A gift you can carry the harvest in. That\'s a good gift.', to: 'end' },
      ] },
      hard: { line: 'pastime.basketry.hard', go: [
        { ap: 'ask', say: 'Have you made one?', to: 'cradle', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'You will, one day.', to: 'end' },
      ] },
      cradle: { line: 'pastime.basketry.cradle', fx: { confide: { k: 'pastime.basketry.cradle', t: '{Name} keeps a half-woven cradle-basket hidden away, for a baby that might come one day' } }, go: [
        { ap: 'warm', say: 'It will be the luckiest cradle in the Shire.', to: 'end', fx: { fond: 0.03 } },
        { ap: 'listen', say: '*You say nothing, and let it be a secret.*', label: 'Keep it quiet', to: 'end', fx: { trust: 0.03 } },
      ] },
      wrong: { line: 'pastime.basketry.wrong', go: [
        { ap: 'jest', say: 'A basket that won\'t hold anything is very restful.', to: 'end' },
        { ap: 'comfort', say: 'The ducks got a fine nest out of it, I expect.', to: 'end' },
      ] },
      music: { line: 'pastime.basketry.music', end: true },
      see: { line: 'pastime.basketry.see', end: true },
      market: { line: 'pastime.basketry.market', end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  L('pastime.basketry.open', ['I tripped over one of your baskets, {name}. A very fine basket.', 'Every hole on the lane has one of your baskets, {name}. Did you know?', 'Weaving anything just now, {name}?'], {}, [
    { if: { season: 'autumn' }, text: ['Harvest time, {name}. A good season for baskets.'] },
    { if: { job: 'orchardist' }, text: ['I saw the apples going down the lane in your baskets, {name}.'] },
  ]);
  L('pastime.basketry.start', ['Oh, baskets. Always baskets. {BasketTally} so far.', 'Weaving away. It\'s good for the hands, and the house is full of baskets.', 'I\'ve a {basketLast} half done by the fire.'], {
    cheerful: ['Baskets! I love a basket. {BasketTally}, and I\'m not stopping.', 'Oh, it\'s lovely. Over, under, over, under. Like a dance.'],
    ornery: ['{BasketTally}, and still folk come asking for one more.', 'Baskets. Somebody has to. The shop ones fall apart.'],
    shy: ['...Just baskets. They\'re useful, at least.', '...I make a few. To be useful.'],
    curious: ['I\'m trying a new weave. Twill, they call it. Like the cloth.', 'I\'ve been dyeing reeds with blackberry. Purple baskets. Why not?'],
    dreamy: ['Over and under, over and under. The day goes quiet when I weave.', 'A basket\'s like a nest. I like making nests.'],
    witty: ['I\'m a basket case. I\'ve heard all the jokes. Most of them from me.', '{BasketTally}. The house is mostly basket now, with a bit of house round it.'],
    proud: ['{BasketTally}, and none of them leak. Well. Baskets leak. None of them fall apart.', 'My baskets are the best in the village. Ask anyone. Ask the eggs.'],
    gloomy: ['It keeps my hands busy. That\'s all.', 'Baskets. Somebody always sits on them.'],
    child: ['I made a basket! It\'s a bit wonky. It holds conkers though!'],
  }, [
    { if: { stage: 'elder' }, text: ['My fingers are stiff, but the reeds know what to do.', 'I\'ve woven baskets for three generations of this lane.'] },
    { if: { season: 'winter' }, text: ['I cut the reeds in autumn and weave all winter. It\'s a good rhythm.'] },
    { if: { basketLevel: { min: 45 } }, text: ['I can do it in the dark now. I have, once. It came out square. On purpose.'] },
  ]);
  L('pastime.basketry.reeds', ['Down by the river. The tall ones by the bend, where the water\'s slow.', 'The reed-beds below the mill. You want them green, but not too green.'], {
    cheerful: ['The river! Up to my knees in it, singing. The fish don\'t mind.'],
    ornery: ['By the river. And if anyone else has been cutting my patch, they\'ll hear about it.'],
    shy: ['...By the river. Early, when nobody\'s about.'],
    curious: ['The best reeds are on the inside of the bend. The water\'s slow there and they grow straight. I measured.'],
    dreamy: ['By the river, at dawn. The mist comes up off the water. It\'s like cutting clouds.'],
    witty: ['By the river. I\'d grow them in the parlour, but the parlour drew the line.', 'By the river. I tried the pond, but the ducks objected in writing.'],
    proud: ['From my own patch by the bend. I\'ve tended it for years.'],
    gloomy: ['By the river. Wet feet every time. Every single time.'],
    child: ['From the river! I fell in. Only a bit.'],
  }, [
    { if: { job: 'fisher' }, text: ['I cut them while the lines are out. The fish never notice.'] },
    { if: { weather: 'rain' }, text: ['By the river, and not today, thank you. Today the river comes to you.'] },
  ]);
  L('pastime.basketry.many', ['Ha! All of them. Every one of them.', 'You can never have too many baskets. Only too few shelves.'], {
    cheerful: ['More! Always more! There\'s always something that needs carrying.'],
    ornery: ['As many as I like, that\'s how many.'],
    shy: ['...I do have quite a lot. I keep meaning to give some away.'],
    curious: ['I counted once. Thirty-one. Then I found four more in the loft.'],
    dreamy: ['One for every kind of thing. Eggs, apples, wool, wishes.'],
    witty: ['One more than I\'ve got, wizard. Always one more.'],
    proud: ['A hobbit with a good basket is a hobbit prepared.'],
    gloomy: ['Too many. The house is full of them. I can\'t stop.'],
    child: ['I need a hundred. One for each conker.'],
  });
  L('pastime.basketry.basketbasket', ['...I have one. It\'s the biggest basket. It\'s full.', 'Don\'t think I haven\'t. It\'s in the hall. You walked past it.'], {
    cheerful: ['Ha! I have! It\'s my favourite! It has a basket in it with a smaller basket in that.'],
    ornery: ['Very droll. Yes. I have one.'],
    witty: ['And a basket for that basket, and so on, all the way down. It\'s baskets all the way down.'],
    proud: ['Naturally. Nested, by size. It\'s very elegant.'],
    gloomy: ['Yes. Don\'t tell anyone.'],
    child: ['That\'s silly! ...Can I make one?'],
  });
  L('pastime.basketry.which', ['The one by the bakery door? That\'s mine. The good handle.', 'Oh, that\'ll be one of mine. They get about.'], {
    cheerful: ['Oh, that\'s my favourite! The one with the red band? Isn\'t it a good one!'],
    ornery: ['Which one? There\'s forty of them. Was the handle on straight?'],
    shy: ['...Was it all right? The handle wasn\'t loose?'],
    curious: ['Was it the round one or the square one? The square ones are harder. Corners are tricky.'],
    dreamy: ['I like to think of them all out there, carrying things for people.'],
    witty: ['If it was holding anything worth having, it was mine. If it was empty, it was someone else\'s.'],
    proud: ['You\'ll know mine. They\'re the ones that last.'],
    gloomy: ['Was it falling apart? They do, in the end.'],
    child: ['Was it MINE? Was it the wonky one?'],
  });
  L('pastime.basketry.how', ['Stakes first, like the spokes of a wheel. Then you weave round and round. Then you swear a bit.', 'You soak them till they bend. Then over, under, over. It\'s simple. It takes years.'], {
    cheerful: ['Over, under, over, under! I sing as I go. The basket comes out singing too.'],
    ornery: ['Patiently. Which is more than most folk can manage.'],
    shy: ['...Slowly. One reed at a time.'],
    curious: ['The base is the hard bit. If the base is true, the rest follows. Like most things, really.'],
    dreamy: ['You sort of hum and your hands do it. I\'m not sure I\'m involved at all.'],
    witty: ['You weave them. It\'s in the name. Basket-weaving. Not basket-knitting.'],
    proud: ['Tightly. A loose weave is a lazy weave.'],
    gloomy: ['With a lot of soaking, and a lot of sore fingers.'],
    child: ['You go in and out! In and out! And then it\'s a basket!'],
  });
  L('pastime.basketry.river', ['It\'s quiet down there. The water goes by and doesn\'t want anything.', 'I like the reed-beds. Nobody comes. It\'s just me and a heron who disapproves of me.'], {
    cheerful: ['Oh, it\'s lovely. The dragonflies! Blue as anything.'],
    ornery: ['Nobody talks to you by the river. That\'s what I like.'],
    shy: ['...It\'s the only place nobody looks at me.'],
    curious: ['There\'s a whole world in the reeds. Warblers, voles, a water rail once. Very rare.'],
    dreamy: ['The river whispers. You can almost hear what it says, if you cut slowly.'],
    witty: ['The heron and I have an understanding. He doesn\'t like me and I don\'t like him.'],
    proud: ['My patch. Nobody cuts it but me. The reeds know me.'],
    gloomy: ['It\'s cold. But it\'s peaceful. I can think, down there.'],
    child: ['There\'s frogs! Hundreds of frogs! I caught one and it weed on me.'],
  });
  L('pastime.basketry.frogs', ['Ha! The frogs. They\'ve opinions about my cutting too.', 'They\'re very loud, frogs, for something you can sit on.'], {
    cheerful: ['Ha! I bet they sang you to sleep!'],
    ornery: ['Frogs. Noisy, slimy things. They get in the baskets.'],
    witty: ['The frogs have opinions about everything. They\'re like the Moot, but greener.'],
    child: ['Did you kiss one? Did it turn into a prince?'],
  });
  L('pastime.basketry.gives', ['Everyone! Anyone who needs to carry something. Which is everyone.', 'Neighbours, mostly. And the Common Store. There\'s never enough baskets at harvest.'], {
    cheerful: ['Everyone gets a basket! Births, weddings, birthdays. A basket!'],
    ornery: ['Whoever asks nicely. Which is fewer folk than you\'d think.'],
    shy: ['...I leave them on doorsteps. Nobody knows. Well, they know. They don\'t say.'],
    proud: ['They\'re given as wedding presents, my baskets. That\'s how good they are.'],
    gloomy: ['People take them. They don\'t bring them back.'],
    child: ['My mum! And my friend! And the duck. The duck didn\'t want it.'],
  }, [
    { if: { giftTo: has }, pri: 1, text: ['I gave {giftTo} a {giftWhat} not long ago. {GiftTo} cried. In a good way.'] },
    { if: { spouse: has }, text: ['{Spouse} says no more for our house. So the neighbours get them.'] },
  ]);
  L('pastime.basketry.hard', ['A cradle-basket. With a hood. If you get it wrong, there\'s a baby in it.', 'A market hamper, with a lid that sits right. The lid is everything.'], {
    cheerful: ['Oh, a cradle-basket! I dream about it. A little hood, and a rocker!'],
    ornery: ['Anything with a lid. Lids are liars.'],
    shy: ['...A cradle. I\'ve never dared.'],
    curious: ['Round to square. Starting round and ending square. I\'ve tried eleven times.'],
    dreamy: ['A cradle. The most important thing a basket can hold.'],
    witty: ['A basket that holds water. I\'m told it\'s called a bucket.'],
    proud: ['A market hamper with a fitted lid. I\'m one of three hobbits who can do it.'],
    gloomy: ['All of them. They\'re all hard.'],
    child: ['A basket with a lid that doesn\'t fall off! I can\'t do it.'],
  });
  L('pastime.basketry.cradle', ['...I\'ve started one. It\'s in the loft. For... well. For one day. If.', '...There\'s one in the cupboard. Half made. I don\'t know who for yet.'], {
    cheerful: ['I have! It\'s hidden. It\'s for one day. Oh, don\'t tell anyone!'],
    ornery: ['...Mind your business. ...Yes. One. It\'s in the loft.'],
    shy: ['...I have. Nobody knows. It\'s for a baby I haven\'t got.'],
    dreamy: ['It\'s waiting. Half woven. Like it knows something I don\'t.'],
    proud: ['One. The finest I\'ve made. It\'s waiting for a reason.'],
    gloomy: ['One. Years ago. It\'s still waiting.'],
  }, [
    { if: { kid: has }, text: ['I made one for {kid}. I keep it. {Kid} doesn\'t know. Maybe for {kid}\'s own, one day.'] },
  ]);
  L('pastime.basketry.wrong', ['Oh, yes. A whole basket, unravelled in the river. Floated off like a duck.', 'One came out the shape of a hat. I wear it now. Don\'t tell anyone.'], {
    cheerful: ['Ha! I wove one so tight it rang like a bell when you tapped it! Couldn\'t get anything in it.'],
    ornery: ['The reeds were too dry. I said so at the time.'],
    shy: ['...Most of them, at first. I hid them.'],
    curious: ['I forgot to soak the reeds once. They cracked like twigs. Water matters.'],
    dreamy: ['One went all spiral. I kept it. It looks like a snail\'s house.'],
    witty: ['I made a basket with a hole in the bottom. I sold it as a hat. Then as a sieve.'],
    proud: ['Not lately.'],
    gloomy: ['Most of my life, really. But yes, baskets too.'],
    child: ['Mine fell apart when I put a frog in it! The frog was fine.'],
  });
  L('pastime.basketry.music', ['Music? ...Do you know, it is a bit. Over, under. Like a reel.', 'Ha! Maybe that\'s why I hum.'], {
    cheerful: ['It is! I sing while I do it and the rhythm gets into the weave!'],
    ornery: ['It\'s baskets, not music. ...It is a bit like music.'],
    dreamy: ['Yes. That\'s it exactly. It\'s a slow tune you can hold.'],
    witty: ['If it\'s music, I\'m a one-hobbit band. Mostly percussion.'],
  });
  L('pastime.basketry.see', ['Kingfishers. A flash of blue and gone. You have to be still.', 'Otters, once. Two of them, playing. I didn\'t cut a single reed that day.'], {
    cheerful: ['Everything! Dragonflies, a kingfisher, little fish in shoals!'],
    ornery: ['Mud. Mostly mud.'],
    shy: ['...An otter, once. It looked at me. I looked at it.'],
    curious: ['A water vole. They\'re terribly rare now. It sat and washed its face.'],
    dreamy: ['The light. Mostly I see the light on the water.'],
    witty: ['The heron. Judging me. Always judging.'],
    gloomy: ['Rain coming, mostly.'],
    child: ['A FISH. A big one. It was THIS big.'],
  });
  L('pastime.basketry.market', ['Sell them? I couldn\'t. They\'re for folk.', 'I\'ve thought about it. But then they\'d be a job, and I\'d stop liking them.'], {
    cheerful: ['Oh, maybe! A basket stall! With baskets of baskets!'],
    ornery: ['And have folk haggle over my work? Never.'],
    proud: ['They\'d fetch a good price. But some things are for giving.'],
    witty: ['I\'d have to buy one to carry them there in.'],
  });

  // ==================================================================================
  // --- Pottery --------------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.pottery', about: 'pastime', reveals: 'pastime.pottery', weight: 1, cool: 5,
    label: 'Clay and the wheel',
    when: (F) => (F.hobbies || []).includes('pottery'),
    rel: (F) => (F.pastime === 'pottery' ? 1.3 : 0.9),
    open: { ask: 'pastime.pottery.open' },
    beats: {
      start: { line: 'pastime.pottery.start', go: [
        { ap: 'ask', say: 'Where does the clay come from?', to: 'clay' },
        { ap: 'jest', say: 'I heard one of yours went off like a firework.', to: 'bang' },
        { ap: 'ask', say: 'What\'s the latest?', to: 'latest' },
      ] },
      clay: { line: 'pastime.pottery.clay', fx: { learn: ['pastime.pottery', '{Name} digs clay from the riverbank and throws pots'] }, go: [
        { ap: 'ask', say: 'And then the wheel?', to: 'wheel' },
        { ap: 'jest', say: 'So you spend your evenings making mud pies. Grown-up ones.', to: 'mudpies' },
      ] },
      bang: { line: 'pastime.pottery.bang', fx: { joke: { k: 'pastime.bang', t: 'The pot that went off like one of the wizard\'s fireworks.' } }, go: [
        { ap: 'ask', say: 'What happened?', to: 'why' },
        { ap: 'jest', say: 'I could use you at the next party.', to: 'party' },
        { ap: 'comfort', say: 'Was anyone hurt? The bread?', to: 'bread' },
      ] },
      latest: { line: 'pastime.pottery.latest', go: [
        { ap: 'ask', say: 'What do you glaze them with?', to: 'glaze' },
        { ap: 'warm', say: 'I\'d drink my tea from one of yours any day.', to: 'tea' },
        { ap: 'jest', say: 'Is it the right shape? Or the shape it wanted?', to: 'shape' },
      ] },
      wheel: { line: 'pastime.pottery.wheel', go: [
        { ap: 'ask', say: 'Could I have a go, some day?', to: 'goes', need: { fond: 0.1 }, soft: true },
        { ap: 'listen', say: '*You watch their hands as they talk.*', label: 'Watch their hands', to: 'hands' },
      ] },
      mudpies: { line: 'pastime.pottery.mudpies', go: [
        { ap: 'jest', say: 'I\'ll have a slice.', to: 'end' },
        { ap: 'ask', say: 'What\'s the trick of it, then?', to: 'wheel' },
      ] },
      why: { line: 'pastime.pottery.why', go: [
        { ap: 'warm', say: 'Every potter has one, I\'m sure.', to: 'end' },
        { ap: 'ask', say: 'And did you try again?', to: 'again' },
      ] },
      party: { line: 'pastime.pottery.party', end: true },
      bread: { line: 'pastime.pottery.bread', end: true },
      glaze: { line: 'pastime.pottery.glaze', go: [
        { ap: 'ask', say: 'Is there a colour you\'ve never managed?', to: 'colour', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'That sounds lovely. Like the valley in a cup.', to: 'end' },
      ] },
      tea: { line: 'pastime.pottery.tea', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'I\'d treasure it.', to: 'end', fx: { owe: -1 } },
        { ap: 'jest', say: 'A big one. Wizards drink a great deal of tea.', to: 'end' },
      ] },
      shape: { line: 'pastime.pottery.shape', end: true },
      goes: { line: 'pastime.pottery.goes', fx: { promise: { k: 'pastime.wheel', t: '{Name} said you could have a go at the wheel some evening', days: 7 } }, end: true },
      hands: { line: 'pastime.pottery.hands', fx: { trust: 0.02 }, end: true },
      again: { line: 'pastime.pottery.again', end: true },
      colour: { line: 'pastime.pottery.colour', fx: { confide: { k: 'pastime.pottery.blue', t: '{Name} has been trying for years to get a glaze the blue of a kingfisher' } }, go: [
        { ap: 'warm', say: 'You\'ll find it. I\'d bet my hat.', to: 'end', fx: { hook: 'pastime.pottery' } },
        { ap: 'share', say: 'I saw that blue once, on a dragon\'s scale. Never since.', to: 'dragon' },
      ] },
      dragon: { line: 'pastime.pottery.dragon', fx: { trust: 0.03 }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  L('pastime.pottery.open', ['Clay under your nails, {name}. Been at the wheel?', 'I had tea from one of your pots, {name}. It didn\'t leak at all.', 'How\'s the potting, {name}?'], {}, [
    { if: { weather: 'rain' }, text: ['Good weather for clay, {name}. Everything\'s clay today.'] },
  ]);
  L('pastime.pottery.start', ['Oh, it\'s grand. Messy, but grand. {PotTally} so far.', 'Getting there! There\'s a {potLast} drying on the sill.', 'Muddy. Always muddy. But I love it.'], {
    cheerful: ['Oh, I love it! There\'s nothing like clay going round under your hands.', 'Wonderful! {PotTally} and only a few of them wonky.'],
    ornery: ['Fine, as long as nobody touches the wheel.', 'It\'d be going better if folk stopped borrowing my pots and not bringing them back.'],
    shy: ['...Just pots. Little ones. For the house.', '...It\'s nice. Quiet. Just me and the wheel.'],
    curious: ['I\'ve been working out why some crack in the oven. I think it\'s air bubbles.', 'Did you know clay from the bend fires red and clay from the mill fires grey? I don\'t know why.'],
    dreamy: ['It\'s like the clay already knows what it wants to be.', 'The wheel goes round and round, and so do my thoughts. Gently.'],
    witty: ['I\'m a potter. I make pots. Some of them even hold things.', 'Coming on. I\'ve gone from \'what is it?\' to \'oh, a pot.\''],
    proud: ['{PotTally}, and every one of them true.', 'I\'m {potSkill}, they say. I\'d say a bit better than that.'],
    gloomy: ['They crack. Half of them crack.', 'Mud in, mud out. Some days I wonder.'],
    child: ['I made a bowl! It\'s for my tadpoles.'],
  }, [
    { if: { stage: 'elder' }, text: ['My hands ache, but warm clay helps. Better than any remedy.'] },
    { if: { potLevel: { min: 45 } }, text: ['I can throw a jug with my eyes shut now. I have done, once, for a bet.'] },
    { if: { job: 'baker' }, text: ['I fire them in the bread oven after the last loaves. Don\'t tell anyone.'] },
  ]);
  L('pastime.pottery.clay', ['From the riverbank. I dig it out by the bend, where it\'s blue-grey and sticky.', 'The bank below the mill. You can tell good clay. It squeaks.'], {
    cheerful: ['The riverbank! Up to my elbows. It\'s the best fun I have all week.'],
    ornery: ['From the bank. My bit of bank. Hands off.'],
    shy: ['...The riverbank. Early, before anyone sees me covered in it.'],
    curious: ['The bend. There\'s a seam of clay there a yard thick. I think the river laid it down, ages ago.'],
    dreamy: ['From the river\'s own bed. It\'s been waiting there for ever, for me.'],
    witty: ['From the river. I\'m a mud-farmer, really. I just harvest it in a fancy way.'],
    proud: ['I\'ve a seam nobody else knows of. The finest clay in the valley.'],
    gloomy: ['The riverbank. Cold and wet and I always slip in.'],
    child: ['From the MUD! I get to play in the mud and it counts as a hobby!'],
  }, [
    { if: { weather: 'rain' }, text: ['From the bank. Not today, though. Today the bank comes to you.'] },
  ]);
  L('pastime.pottery.bang', ['Ha! The oven. It went off like a firework. Bits of jug in the bread for a week.', 'Oh, no. You heard. The whole lane heard. It was very loud.'], {
    cheerful: ['Ha! BANG! I\'d left a bubble in it. The cat\'s still not forgiven me.'],
    ornery: ['It was the oven\'s fault. Too hot. Somebody stoked it.'],
    shy: ['...Everyone heard. I wanted to hide under the table.'],
    curious: ['Air! A pocket of air in the clay. It swells in the heat. Bang. I wedge it twice as long now.'],
    dreamy: ['It sounded like a star bursting. Then it sounded like a lot of broken jug.'],
    witty: ['I like to think of it as an experimental firework. Very short. Mostly jug.'],
    proud: ['Once. It happened once. And I\'ve learned from it.'],
    gloomy: ['It took three others with it. Three. A whole evening\'s work.'],
    child: ['BOOM! It was so loud! I want to do it again!'],
  }, [
    { if: { job: 'baker' }, text: ['In my own bread oven. Bits of honey pot in the morning loaves. Folk thought it was nuts.'] },
  ]);
  L('pastime.pottery.latest', ['Something for the larder. It\'s drying on the sill.', 'A {potLast}. It\'s drying. Don\'t breathe on it.', 'A {potLast}. Lopsided, but it\'ll hold.', 'A {potLast}, for the larder. The lid nearly fits.'], {
    cheerful: ['A {potLast}! Round as a pumpkin and twice as cheerful.'],
    ornery: ['A {potLast}. If it survives the oven.'],
    shy: ['...A {potLast}. A little one. For honey.'],
    curious: ['A {potLast}. I tried a thinner wall. You can see the light through it.'],
    dreamy: ['A {potLast}. It wobbled, and I let it. I like the wobble.'],
    witty: ['A {potLast}. Or possibly a hat. Depends which way up.'],
    proud: ['A {potLast}, thrown in one go. Not a mark on it.'],
    gloomy: ['A {potLast}. It\'ll crack. They always crack.'],
    child: ['A {potLast}! It\'s for my mum! It\'s a bit squashed.'],
  }, [
    { if: { potLast: 'honey pot' }, text: ['A honey pot, with a bee on the lid. The bee looks a bit like a sheep.'] },
    { if: { potLast: 'jug' }, text: ['A jug. The spout pours sideways. I\'m calling it a feature.'] },
  ]);
  L('pastime.pottery.wheel', ['You centre it first. That\'s the whole secret. If it\'s not centred, nothing\'s right.', 'Kick the wheel, wet your hands, and press. Gently. Like settling a baby.'], {
    cheerful: ['Oh, the wheel\'s the best bit! Round and round and up it comes, like magic!'],
    ornery: ['You centre it. And you don\'t talk to me while I\'m doing it.'],
    shy: ['...You have to be very still inside. That\'s why I like it.'],
    curious: ['The centring is everything. A hair off and it wobbles itself to pieces. Like a top.'],
    dreamy: ['You find the middle of it. The still bit. And then everything else follows.'],
    witty: ['You spin it and pray. Mostly pray.'],
    proud: ['Centring. Most can\'t. I can do it in a breath.'],
    gloomy: ['It\'s harder than it looks. Everything is.'],
    child: ['It goes round SO fast! I got clay in my ear!'],
  });
  L('pastime.pottery.mudpies', ['Ha! Fancy mud pies. I\'ll put that on the sign.', 'Well... yes. Very fancy ones. You can drink from mine.'], {
    cheerful: ['Ha! That\'s exactly what it is! Grown-up mud pies!'],
    ornery: ['Mud pies don\'t hold water, wizard.'],
    witty: ['Mud pies with ambition. Mud pies that went to school.'],
    proud: ['Mud pies don\'t get admired at the harvest fair.'],
    child: ['They ARE mud pies! That\'s why I like it!'],
  });
  L('pastime.pottery.why', ['A bubble. Air in the clay. In the heat it swells and goes bang.', 'I hadn\'t wedged it. You knead clay like dough, to get the air out. I was lazy.'], {
    curious: ['I\'ve worked it out since. Air, and water. The water turns to steam, and steam wants out.'],
    ornery: ['Somebody stoked the oven too hot. I\'m not saying who.'],
    witty: ['The pot had ambitions. It wanted to be a firework. It achieved its dream.'],
    gloomy: ['I was careless. I\'m always careless.'],
  });
  L('pastime.pottery.party', ['Ha! I\'ll make you a squib in clay. Light the touchpaper and stand well back.', 'Don\'t tempt me. The miller still talks about it.'], {
    cheerful: ['Ha! A pottery firework! The children would love it!'],
    ornery: ['Very funny. It took the eyebrows off the cat.'],
    witty: ['I\'ll do the clay and you do the bang. We\'ll call it a joint venture.'],
  });
  L('pastime.pottery.bread', ['The bread was a loss. Bits of jug in every loaf.', 'Nobody hurt. The cat\'s still sulking.'], {
    cheerful: ['Ha! Only the bread. We called it crunchy bread.'],
    gloomy: ['The bread. And my pride.'],
  });
  L('pastime.pottery.glaze', ['Ash from the hearth, mostly. And a bit of river mud. It comes out green, like moss.', 'Whatever I can find. Elder ash gives a lovely brown.'], {
    cheerful: ['Oh, everything! Ash, mud, a bit of copper from an old pot. It\'s like baking!'],
    ornery: ['That\'s my business. Took me years to get right.'],
    shy: ['...Wood ash. Simple. Nothing clever.'],
    curious: ['Wood ash. Different trees give different colours. Apple\'s pale, oak\'s dark. I keep notes.'],
    dreamy: ['Ash from the fire. So every pot has a bit of a winter\'s evening in it.'],
    witty: ['A secret recipe. Mostly ash. Partly hope.'],
    proud: ['My own glaze. Nobody else can get that green.'],
    gloomy: ['Ash. It all comes out brown.'],
    child: ['I don\'t glaze. I just paint them with jam.'],
  });
  L('pastime.pottery.tea', ['Would you? I\'ll make you a cup. A big one.', 'Then you shall. I\'ll throw one for you. Wizard-sized.'], {
    cheerful: ['Oh, then I\'ll make you one! With a star on it!'],
    ornery: ['You\'d only break it. ...Fine. I\'ll make you one.'],
    shy: ['...Really? I could make you one. If you want.'],
    proud: ['Then you\'ll have the best cup in the Shire.'],
    witty: ['A cup big enough for wizard\'s tea is a bucket. I\'ll see what I can do.'],
    child: ['I\'ll make you one! It might be a bowl. It\'s hard to tell with mine.'],
  });
  L('pastime.pottery.shape', ['The shape it wanted. They always win.', 'Ha! Mostly the shape it wanted. I just negotiate.'], {
    cheerful: ['Ha! The clay always wins. I\'ve made my peace with it.'],
    ornery: ['The shape I meant. Mostly.'],
    dreamy: ['The shape it wanted. That\'s the only honest shape.'],
    witty: ['I tell people it\'s the shape I wanted. They nod politely.'],
    proud: ['The shape I meant. Always.'],
  });
  L('pastime.pottery.goes', ['Come by some evening. Bring an apron. Bring two.', 'You can. But you\'ll be terrible. Everyone is, the first time.'], {
    cheerful: ['Oh, yes! Come on Trewsday! You\'ll get clay in your beard!'],
    ornery: ['If you must. Don\'t touch anything until I say.'],
    shy: ['...You\'d want to? With me? All right.'],
    witty: ['I\'d love to see a wizard covered in clay. I\'d sell tickets.'],
    proud: ['I\'ll teach you properly. No shortcuts.'],
  });
  L('pastime.pottery.hands', ['*Their hands make a shape in the air as they talk, round and round.* ...Sorry. I do that.', '*They\'re pressing a pot that isn\'t there.* The trick is not to fight it.'], {
    shy: ['*Their hands go still in their lap.* ...Sorry. You were looking.'],
    dreamy: ['*Their hands cup the air gently, as if holding something warm.*'],
  });
  L('pastime.pottery.again', ['Next morning. I wedged that clay till my arms ached. It came out fine.', 'Of course. You don\'t stop because of one bang.'], {
    gloomy: ['Eventually. It took me a month to go near the oven.'],
    proud: ['Next day. Better than ever.'],
  });
  L('pastime.pottery.colour', ['...Blue. The blue of a kingfisher\'s back. I\'ve tried for years.', '...Kingfisher blue. I can see it. I can\'t make it.'], {
    cheerful: ['Blue! The proper blue, like a kingfisher! I\'ll get it one day!'],
    ornery: ['Blue. Not grey-blue. Not green-blue. Blue. It can\'t be done with ash.'],
    shy: ['...There\'s a blue I want. I\'ve never told anyone.'],
    curious: ['Kingfisher blue. You\'d need copper, I think, and a hotter fire than an oven. I\'m working on it.'],
    dreamy: ['The blue of the sky right after sunset. Before it goes dark. I dream about it.'],
    proud: ['Blue. And I\'ll be the first in the Shire to manage it.'],
    gloomy: ['Blue. I never will.'],
  });
  L('pastime.pottery.dragon', ['...A dragon? You\'ve seen a dragon? Up close? ...No, don\'t tell me. Tell me the colour.', 'A dragon\'s scale. That\'s the blue. I knew it existed.'], {
    curious: ['Was it the scale itself, or the light on it? It matters! Tell me everything.'],
    child: ['A DRAGON! What colour was the rest of it?'],
  });

  // ==================================================================================
  // --- Knitting --------------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.knitting', about: 'pastime', reveals: 'pastime.knitting', weight: 1, cool: 5,
    label: (F) => (F.season === 'winter' || F.season === 'autumn' ? 'Knitting for the cold' : 'What\'s on the needles?'),
    when: (F) => (F.hobbies || []).includes('knitting'),
    rel: (F) => (F.pastime === 'knitting' ? 1.3 : 0.9) * (F.season === 'winter' ? 1.3 : 1),
    open: { ask: 'pastime.knitting.open' },
    beats: {
      start: { line: 'pastime.knitting.start', go: [
        { ap: 'ask', say: 'What\'s on the needles?', to: 'needles' },
        { ap: 'jest', say: 'Is it true you once knitted a scarf that reached the river?', to: 'scarf' },
        { ap: 'ask', say: 'Where does the wool come from?', to: 'wool' },
      ] },
      needles: { line: 'pastime.knitting.needles', fx: { learn: ['pastime.knitting', '{Name} knits of an evening; there\'s a {knitLast} on the needles'] }, go: [
        { ap: 'ask', say: 'And who\'s it for?', to: 'forwho' },
        { ap: 'jest', say: 'Could you knit one for a wizard? A very long one?', to: 'wizard' },
        { ap: 'warm', say: 'Nobody\'s cold with you about.', to: 'warm' },
      ] },
      scarf: { line: 'pastime.knitting.scarf', fx: { joke: { k: 'pastime.longscarf', t: 'The scarf that reached the river.' } }, go: [
        { ap: 'jest', say: 'I\'d like one. I\'m very tall.', to: 'wizard' },
        { ap: 'ask', say: 'Why didn\'t you stop?', to: 'stop' },
      ] },
      wool: { line: 'pastime.knitting.wool', go: [
        { ap: 'ask', say: 'Unpicking old jumpers? Whose?', to: 'unpick' },
        { ap: 'listen', say: '*You let them talk wool.*', label: 'Let them talk wool', to: 'forwho' },
      ] },
      forwho: { line: 'pastime.knitting.forwho', go: [
        { ap: 'warm', say: 'They\'re lucky to have you.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'ask', say: 'And have you ever knitted something for yourself?', to: 'self', need: { open: 2 }, soft: true },
      ] },
      wizard: { line: 'pastime.knitting.wizard', go: [
        { ap: 'warm', say: 'I\'d wear it on every road.', to: 'promise', need: { fond: 0.2 }, soft: true },
        { ap: 'jest', say: 'Grey, please. To match the beard.', to: 'grey' },
      ] },
      warm: { line: 'pastime.knitting.warm', end: true },
      stop: { line: 'pastime.knitting.stop', go: [
        { ap: 'warm', say: 'A good reason to keep going.', to: 'end' },
        { ap: 'ask', say: 'What do you think about, while you knit?', to: 'think' },
      ] },
      unpick: { line: 'pastime.knitting.unpick', go: [
        { ap: 'ask', say: 'Does it feel strange, unpicking someone\'s old jumper?', to: 'strange', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'So somewhere there\'s a hobbit walking about cold.', to: 'end' },
      ] },
      strange: { line: 'pastime.knitting.strange', fx: { trust: 0.02 }, go: [
        { ap: 'listen', say: '*You let the needles click, and wait.*', label: 'Let it be quiet a while', to: 'quiet', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'Then they\'re still keeping folk warm. That\'s a fine thing.', to: 'end', fx: { fond: 0.02 } },
      ] },
      self: { line: 'pastime.knitting.self', fx: { trust: 0.02 }, go: [
        { ap: 'advise', say: 'Knit yourself something this winter. Doctor\'s orders.', to: 'end', fx: { respect: 0.02 } },
        { ap: 'warm', say: 'Then I hope someone knits you one.', to: 'end', fx: { fond: 0.02 } },
      ] },
      promise: { line: 'pastime.knitting.promise', fx: { promise: { k: 'pastime.wizscarf', t: '{Name} said they\'d knit you a scarf for the road', days: 14 }, fond: 0.03 }, end: true },
      grey: { line: 'pastime.knitting.grey', end: true },
      think: { line: 'pastime.knitting.think', fx: { trust: 0.02 }, go: [
        { ap: 'listen', say: '*You let the needles click, and wait.*', label: 'Let it be quiet a while', to: 'quiet', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'That sounds like a good way to spend an evening.', to: 'end' },
      ] },
      quiet: { line: 'pastime.knitting.quiet', fx: { trust: 0.03, feel: 'drawn_out' }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  L('pastime.knitting.open', ['Something on the needles, {name}?', 'I see a strand of wool on your sleeve, {name}. Knitting again?', 'The whole lane\'s in your scarves, {name}. I counted.'], {}, [
    { if: { season: 'winter' }, text: ['Cold enough for your mittens, {name}. I saw three pairs go by.'] },
    { if: { season: 'summer' }, text: ['Knitting in this heat, {name}? You\'re a hero.'] },
  ]);
  L('pastime.knitting.start', ['Oh, always something. {KnitTally} this year, I think.', 'Click, click, click. Every evening, without fail.', 'There\'s always something on the needles. Always.'], {
    cheerful: ['Oh, I love it! {KnitTally}! Everyone\'s getting something.', 'Knit one, purl one! It\'s my favourite part of the day.'],
    ornery: ['I knit. Somebody has to. Folk would freeze otherwise.', 'Busy. The whole lane wants mittens and nobody brings wool.'],
    shy: ['...A little. It\'s nice to have something in my hands.', '...Just socks and things. Nothing special.'],
    curious: ['I\'m trying cables. You twist the stitches over each other. Like a rope. It\'s hard.', 'I\'ve been working out a pattern for a hat with ear-flaps. For the herder.'],
    dreamy: ['The needles click like a clock. I lose whole evenings.', 'I knit and the fire crackles and the world goes very small and warm.'],
    witty: ['I\'ve knitted {knitTally}. I\'ve dropped a great many more stitches.', 'I\'m in a constant state of being three rows from finished.'],
    proud: ['{KnitTally}, and not a dropped stitch among them.', 'My cables are the envy of the lane.'],
    gloomy: ['It passes the evenings. They\'re long.', 'Knitting. It\'s all I\'m good for.'],
    child: ['I\'m knitting a snake! It\'s very long. It\'s a scarf really.'],
  }, [
    { if: { stage: 'elder' }, text: ['I\'ve knitted for three generations of this family. I\'ll knit for a fourth.', 'My eyes aren\'t what they were. I knit by feel now.'] },
    { if: { season: 'winter' }, text: ['Busy! Winter\'s when they all remember they need mittens.'] },
    { if: { season: 'summer' }, text: ['Even in summer. You have to get ahead. Winter always comes.'] },
    { if: { spouse: null }, text: ['Every evening. The needles are good company.'] },
    { if: { spouse: has }, text: ['Click, click, click. {Spouse} says I knit in my sleep.'] },
  ]);
  L('pastime.knitting.needles', ['Something warm. Mostly green, so far.', 'A {knitLast}. Green, with a stripe.', 'A {knitLast}. I\'m on the last bit.', 'A {knitLast}. Then another one. Then another.'], {
    cheerful: ['A {knitLast}! In red! Everyone looks merry in red!'],
    ornery: ['A {knitLast}. If anyone stops interrupting me.'],
    shy: ['...A {knitLast}. It\'s a present. I mean. It might be.'],
    curious: ['A {knitLast}. With a new stitch. Moss stitch, it\'s called. It\'s bumpy, like moss.'],
    dreamy: ['A {knitLast}, the colour of the sky before it rains.'],
    witty: ['A {knitLast}. Or a very small blanket. It\'s been a long evening.'],
    proud: ['A {knitLast}, with a pattern I worked out myself.'],
    gloomy: ['A {knitLast}. It\'s gone wrong in the middle. I\'ll unpick it.'],
    child: ['A {knitLast}! It\'s got a hole. On purpose.'],
  }, [
    { if: { knitLast: 'tea cosy' }, text: ['A tea cosy. Shaped like a hen. The teapot looks very surprised in it.'] },
    { if: { knitLast: 'pair of socks' }, text: ['Socks. The second sock is the hardest thing in the world. Nobody tells you that.'] },
    { if: { knitLast: 'blanket' }, text: ['A blanket. Squares, all different. Every square a different evening.'] },
    { if: { knitLast: 'woolly hat' }, text: ['A woolly hat, with a bobble. The bobble is the best bit.'] },
  ]);
  L('pastime.knitting.scarf', ['It reached the gate. Not the river. ...It reached the river.', 'Ha! I forgot to stop. It happens.'], {
    cheerful: ['Ha! It did! Three of us wore it at once for the Yule walk!'],
    ornery: ['It was meant to be long. Folk don\'t understand long scarves.'],
    shy: ['...Who told you that?'],
    curious: ['I wanted to see how long a ball of wool goes. Further than you\'d think. Much further.'],
    dreamy: ['I was thinking about something and the evening went and the scarf went with it.'],
    witty: ['It\'s not a scarf. It\'s a lifestyle.'],
    proud: ['The longest scarf in the Shire. I measured. Nobody\'s beaten it.'],
    gloomy: ['I couldn\'t think how to end it. I\'m like that with most things.'],
    child: ['I want a scarf that reaches the river! I\'ll start now!'],
  });
  L('pastime.knitting.wool', ['The Common Store, when the herder\'s been shearing. Otherwise old jumpers, unpicked.', 'From the sheep! Well, via the Store. I don\'t ask the sheep.'], {
    cheerful: ['From the sheep! Bless them. I give them a pat when I go past to say thank you.'],
    ornery: ['From the Store, when there is any. Which there never is.'],
    shy: ['...Old jumpers. I unpick them. Nobody minds.'],
    curious: ['Store wool, mostly. I\'ve tried dyeing it with onion skins. Comes out gold!'],
    dreamy: ['Every ball of wool was a sheep on a hill once. I think about that.'],
    witty: ['Sheep. Very generous animals. They\'ve never asked for it back.'],
    proud: ['Only the best. I pick it myself, at shearing.'],
    gloomy: ['Whatever\'s left. There\'s never enough.'],
    child: ['From SHEEP. Did you know? I didn\'t know. Sheep!'],
  }, [
    { if: { job: 'herder' }, text: ['My own sheep! I know every one. This scarf was mostly Bramble.'] },
  ]);
  L('pastime.knitting.forwho', ['Whoever\'s coldest. That\'s the rule.', 'The little ones grow out of everything. I can\'t keep up.'], {
    cheerful: ['Everyone! I\'ve a list! You\'re on it now.'],
    ornery: ['Whoever needs it. Not whoever wants it.'],
    shy: ['...Someone. I won\'t say.'],
    curious: ['I measure folk when they\'re not looking. With my eyes. I\'m very accurate.'],
    dreamy: ['For whoever it turns out to be for. It usually knows.'],
    witty: ['Whoever\'s nearest when I finish. Stand back if you don\'t want a scarf.'],
    proud: ['Folk ask for mine by name.'],
    gloomy: ['Nobody, maybe. It\'ll go in the drawer.'],
    child: ['For my teddy! He\'s cold.'],
  }, [
    { if: { kid: has }, text: ['For {kid}. {Kid} grows a hand a season. I knit faster.'] },
    { if: { spouse: has }, text: ['{Spouse}. Always {spouse} first. Then the rest of the lane.'] },
    { if: { giftTo: has }, pri: 1, text: ['I gave {giftTo} a {giftWhat} last. {GiftTo} wears it every day. Every day!'] },
  ]);
  L('pastime.knitting.wizard', ['A wizard\'s scarf? It\'d take a sheep and a half.', 'Ha! I could. You\'d need to stand still while I measure.'], {
    cheerful: ['Oh, yes! A long one! With stars on!'],
    ornery: ['You\'d lose it in a week. Wizards lose things.'],
    shy: ['...I could. If you\'d want one.'],
    curious: ['How long is a wizard? Let me look. ...Very long.'],
    dreamy: ['A scarf that\'s been all over the world. On you. I\'d like that.'],
    witty: ['I\'d have to knit it in instalments. Send the next bit by post.'],
    proud: ['It\'d be the finest scarf beyond the Shire.'],
    gloomy: ['You\'d go off and we\'d never see it again. Like you.'],
    child: ['YES! A wizard scarf! Can it be magic?'],
  });
  L('pastime.knitting.warm', ['Not while I\'ve wool and needles.', 'That\'s the idea. Nobody cold, nobody sad. Well. Fewer sad.'], {
    cheerful: ['Ha! That\'s my motto! Nobody cold!'],
    shy: ['...Thank you. That\'s nice.'],
    proud: ['Nobody\'s been cold on this lane in ten winters.'],
    gloomy: ['Somebody always is.'],
  });
  L('pastime.knitting.stop', ['I was listening to the rain. And then the wool ran out. And then it was the river.', 'It was a good evening. I didn\'t want it to end.'], {
    cheerful: ['Why stop? It was going so well!'],
    ornery: ['Because nobody told me to.'],
    dreamy: ['It felt like the scarf wanted to see the river.'],
    witty: ['I\'d have stopped if I\'d found a good place. There isn\'t one. It\'s a scarf.'],
  });
  L('pastime.knitting.unpick', ['Old ones from the Store. And Grandad\'s. He doesn\'t need them now.', 'Whoever leaves one in the Store. I make them into something new.'], {
    shy: ['...My mother\'s, mostly. It\'s nice. She\'s still keeping folk warm.'],
    dreamy: ['They carry a bit of the one who wore them. I like that.'],
    witty: ['I\'ve unpicked most of the lane at some point. They don\'t know.'],
    gloomy: ['Someone who doesn\'t need them any more.'],
  });
  L('pastime.knitting.strange', ['A bit. You find a darn they did, and you think of them doing it.', 'Strange, and nice. Every stitch was someone\'s evening once.'], {
    cheerful: ['Not strange! It\'s like they\'re helping! I say thank you to the jumper.'],
    ornery: ['Wool\'s wool. ...Though I did keep one of Dad\'s. Didn\'t have the heart.'],
    shy: ['...I keep one strand from each. In a tin. I\'ve never told anyone.'],
    curious: ['You learn how they knitted. Everyone\'s different. Tight, loose, a twist in the purl.'],
    dreamy: ['Like reading a letter backwards. Every row a sentence.'],
    witty: ['Only when they\'re still wearing it. They do object.'],
    proud: ['Not at all. I put it to better use than it was.'],
    gloomy: ['It\'s sad. Everything unravels in the end.'],
    child: ['I unpicked my sock by accident! It went all the way to the kitchen!'],
  }, [
    { if: { stage: 'elder' }, text: ['I\'m unpicking my own old things now. Making them into things for the grandchildren.'] },
  ]);
  L('pastime.knitting.self', ['...Me? Do you know, I don\'t think I have. Not once.', 'For myself? ...No. I never thought.'], {
    cheerful: ['Ha! I\'ve never! I always give them away. I\'m always cold!'],
    ornery: ['I don\'t need anything. I\'m fine.'],
    shy: ['...No. It feels greedy.'],
    proud: ['I\'ve no need. ...Well. My elbows are out.'],
    gloomy: ['No. Nobody\'s ever knitted me anything either.'],
  });
  L('pastime.knitting.promise', ['Then you\'ll have one. Grey. Long. Before you go.', 'I\'ll start tonight. Don\'t leave before it\'s done.'], {
    cheerful: ['Oh, you\'re on! I\'ll start tonight! Stars or stripes?'],
    ornery: ['Fine. But if you lose it, don\'t come back for another.'],
    shy: ['...I\'ll do it. Properly. You\'ll see.'],
    proud: ['You\'ll have the finest scarf on any road.'],
  });
  L('pastime.knitting.grey', ['Grey to match the beard. Ha! I\'ve just the wool.', 'Grey it is. Dull, but distinguished.'], {
    witty: ['Grey. To match the beard, the hat and the mood. Very wizardly.'],
    child: ['No! It should be PINK!'],
  });
  L('pastime.knitting.think', ['Nothing. That\'s the joy of it. Knit one, purl one, and nothing.', 'Everything, and then nothing. It sorts itself out by the end of the row.'], {
    cheerful: ['Pudding, mostly. And who\'ll get what.'],
    ornery: ['How nobody else can knit.'],
    shy: ['...People. Wondering if they\'re warm.'],
    curious: ['Patterns. Everything\'s patterns, if you knit long enough. Fields, frost, ripples.'],
    dreamy: ['Far-off places. Places I\'ll never go. The needles take me.'],
    witty: ['Whether I\'ve left the kettle on. I always have.'],
    proud: ['The next pattern. I\'m always three ahead.'],
    gloomy: ['The ones who aren\'t here.'],
  });
  L('pastime.knitting.quiet', ['*The needles click on. After a while:* ...Thank you. Nobody just sits with me.', '*Click, click.* ...That\'s nice. Just this. Thank you, wizard.'], {
    shy: ['*They knit a whole row before they look up, and smile.*'],
    gloomy: ['*Click, click.* ...I needed that more than I knew.'],
  });

  // ==================================================================================
  // --- Painting and drawing ---------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.painting', about: 'pastime', reveals: 'pastime.painting', weight: 1, cool: 5,
    label: (F) => (F.stage === 'child' ? 'Your drawings' : 'Your paintings'),
    when: (F) => (F.hobbies || []).includes('painting'),
    rel: (F) => (F.pastime === 'painting' ? 1.3 : 0.9),
    open: { ask: 'pastime.painting.open' },
    beats: {
      start: { line: 'pastime.painting.start', go: [
        { ap: 'ask', say: 'What did you paint last?', to: 'last' },
        { ap: 'ask', say: 'Where do your colours come from?', to: 'colours' },
        { ap: 'jest', say: 'Have you painted me yet? I\'ll want my good side.', to: 'me' },
      ] },
      last: { line: 'pastime.painting.last', fx: { learn: ['pastime.painting', '{Name} paints the valley: last of all, {paintLast}'] }, go: [
        { ap: 'ask', say: 'Why that, of all the valley?', to: 'why' },
        { ap: 'warm', say: 'I\'d love to see it.', to: 'see' },
        { ap: 'share', say: 'I\'ve seen that view from the road. It stays with you.', to: 'road' },
      ] },
      colours: { line: 'pastime.painting.colours', go: [
        { ap: 'ask', say: 'Is there a colour you can\'t make?', to: 'cant' },
        { ap: 'jest', say: 'So if I eat your paints, I\'ll be fine?', to: 'eat' },
      ] },
      me: { line: 'pastime.painting.me', fx: { joke: { k: 'pastime.portrait', t: 'The wizard\'s good side is his hat.' } }, go: [
        { ap: 'jest', say: 'I\'ll sit very still. Wizards are good at sitting still.', to: 'sit' },
        { ap: 'ask', say: 'Who would you most like to paint?', to: 'who' },
      ] },
      why: { line: 'pastime.painting.why', go: [
        { ap: 'ask', say: 'Do you ever paint people?', to: 'who' },
        { ap: 'listen', say: '*You look out at the same view, and wait.*', label: 'Look out at the view', to: 'light' },
      ] },
      see: { line: 'pastime.painting.see', notice: 'pastime.painting.notice', go: [
        { ap: 'warm', say: 'You\'ve caught it. You really have.', to: 'praised' },
        { ap: 'advise', say: 'The sky\'s a little heavy, perhaps?', to: 'advised' },
        { ap: 'ask', say: 'What\'s that, there, in the corner?', to: 'corner' },
      ] },
      road: { line: 'pastime.painting.road', fx: { trust: 0.02 }, end: true },
      cant: { line: 'pastime.painting.cant', go: [
        { ap: 'share', say: 'I\'ve seen the sea. It\'s every colour at once, and none of them.', to: 'sea' },
        { ap: 'warm', say: 'You\'ll find it.', to: 'end' },
      ] },
      eat: { line: 'pastime.painting.eat', end: true },
      sit: { line: 'pastime.painting.sit', fx: { promise: { k: 'pastime.sit', t: '{Name} wants you to sit for a portrait', days: 10 } }, end: true },
      who: { line: 'pastime.painting.who', go: [
        { ap: 'warm', say: 'Then you should. While you can.', to: 'end' },
        { ap: 'ask', say: 'Why haven\'t you?', to: 'havent', need: { open: 2 }, soft: true },
      ] },
      light: { line: 'pastime.painting.light', fx: { trust: 0.02 }, end: true },
      praised: { line: 'pastime.painting.praised', fx: { fond: 0.02, feel: 'made_piece', feelX: 'painting' }, end: true },
      advised: { line: 'pastime.painting.advised', end: true },
      corner: { line: 'pastime.painting.corner', go: [
        { ap: 'jest', say: 'A secret signature. Very artistic.', to: 'end' },
        { ap: 'warm', say: 'That\'s the best bit.', to: 'end' },
      ] },
      sea: { line: 'pastime.painting.sea', fx: { trust: 0.03 }, end: true },
      havent: { line: 'pastime.painting.havent', fx: { confide: { k: 'pastime.painting.who', t: '{Name} has never dared paint the one they\'d most like to' } }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  L('pastime.painting.open', ['Paint on your cuff, {name}. Blue, I think. Been at the easel?', 'I saw an easel by the river, {name}. Yours?', 'How are the paintings coming, {name}?'], {}, [
    { if: { stage: 'child' }, text: ['I hear you\'re the best drawer on the lane, {name}.', 'Have you drawn anything good lately, {name}?'] },
  ]);
  L('pastime.painting.start', ['Coming along. {PaintTally} on the walls now.', 'Oh, slowly. The light keeps changing. It\'s very rude of it.', 'I paint when I can. Mostly the valley.'], {
    cheerful: ['Oh, I love it! There\'s always something to paint! Look at that sky!'],
    ornery: ['It\'d go better if folk stopped standing in my view.'],
    shy: ['...I just paint a little. For myself. Nobody sees.'],
    curious: ['I\'m learning how shadows go blue in the evening. Have you noticed? They\'re never black.'],
    dreamy: ['I try to paint what a place feels like. It never looks right but it feels right.'],
    witty: ['I paint. Badly, but with feeling. Mostly the feeling of having painted badly.'],
    proud: ['{PaintTally}, and folk ask to hang them.', 'Well, I\'m {paintSkill}. I don\'t like to boast.'],
    gloomy: ['They never come out how I see them.'],
    child: ['I drew a horse! It looks like a dog. A horse-dog.'],
  }, [
    { if: { stage: 'elder' }, text: ['I\'ve painted this valley sixty years. It\'s never once been the same.'] },
    { if: { season: 'autumn' }, text: ['Autumn. All the colours at once. I can\'t paint fast enough.'] },
    { if: { season: 'winter' }, text: ['Winter\'s hard. White and grey and white. But the shadows! Blue as anything.'] },
    { if: { rift: true }, text: ['Back home everything was neon. Here I\'m learning greens. There are so many greens.'] },
  ]);
  L('pastime.painting.last', ['A bit of the valley, from the bank, in the evening light.', '{PaintLast}. In the evening light. It took four goes.', '{PaintLast}, from the bank. I\'m nearly happy with it.'], {
    cheerful: ['{PaintLast}! With the sun on it! I put a duck in. Ducks make everything better.'],
    ornery: ['{PaintLast}. Somebody\'s cow walked into it. I painted the cow out.'],
    shy: ['...{PaintLast}. It\'s not very good.'],
    curious: ['{PaintLast}, at dawn and at dusk. The same place, two paintings. You wouldn\'t know it.'],
    dreamy: ['{PaintLast}, with mist on it. Mist is the hardest. It\'s mostly what you leave out.'],
    witty: ['{PaintLast}. You can tell, if you squint. And tilt your head. And want to.'],
    proud: ['{PaintLast}. The best thing I\'ve done. You can almost hear it.'],
    gloomy: ['{PaintLast}. In the rain. It suited my mood.'],
    child: ['{PaintLast}! And a dragon on top! There isn\'t really a dragon.'],
  }, [
    { if: { paintLast: 'the mill' }, text: ['The mill. With the wheel turning. You can\'t paint a turning wheel. I tried.'] },
    { if: { paintLast: 'the river' }, text: ['The river. Water\'s the hardest thing. It won\'t keep still.'] },
    { if: { paintLast: 'the orchard' }, text: ['The orchard, in blossom. All that white. I used up every bit of white I had.'] },
  ]);
  L('pastime.painting.colours', ['Berries, earth, soot. Elderberry for purple. Woad for blue, when I can get it.', 'I grind them myself. Ochre from the bank, charcoal from the fire.'], {
    cheerful: ['Everywhere! Blackberries, marigolds, beetroot! My kitchen\'s a rainbow!'],
    ornery: ['I make them. Nobody else will.'],
    shy: ['...I make them. From plants. It takes ages.'],
    curious: ['Walnut husks for brown, onion skins for gold, oak galls and iron for black. I keep a book.'],
    dreamy: ['From the valley itself. So the valley paints itself, really. I just help.'],
    witty: ['The kitchen. I\'m not allowed in the kitchen any more.'],
    proud: ['My own recipes. Nobody makes a green like mine.'],
    gloomy: ['Mud, mostly. Everything comes out mud.'],
    child: ['Mud and jam! And grass! You rub the grass on!'],
  });
  L('pastime.painting.me', ['Ha! Not yet. The hat\'s the hard part.', 'I\'ve tried. I can never get the eyebrows right.'], {
    cheerful: ['Ha! I\'d love to! You\'d have to sit still, mind!'],
    ornery: ['Paint you? I\'d need a bigger canvas.'],
    shy: ['...I did. A bit. In the corner of one. Don\'t look.'],
    curious: ['Your face changes when you talk. That\'s the difficulty. Which face do I paint?'],
    dreamy: ['I\'d paint you on the road, going away. With the sunset.'],
    witty: ['Your good side is the hat, I think. I\'d paint mostly hat.'],
    proud: ['I\'d do it justice. Few could.'],
    gloomy: ['You\'d not like it. Nobody likes their portrait.'],
    child: ['I drew you! With a rainbow beard!'],
  });
  L('pastime.painting.why', ['Because it\'s there every day, and I never really look at it. Painting makes you look.', 'It\'s the bit of the valley I\'d miss most.'], {
    cheerful: ['Because it\'s lovely! Isn\'t it lovely?'],
    ornery: ['Because it holds still. Unlike people.'],
    shy: ['...It\'s where I go to be on my own.'],
    curious: ['The light falls on it differently every hour. I wanted to catch one hour.'],
    dreamy: ['Because one day it won\'t be like that, and I want to remember.'],
    witty: ['It was the only bit of the valley not covered in my family.'],
    proud: ['It\'s the finest view in the Shire. It deserves a fine painter.'],
    gloomy: ['Because everything changes and goes. I wanted to keep some of it.'],
    child: ['Because there\'s ducks!'],
  });
  L('pastime.painting.see', ['*They unroll a canvas, a little shyly.* There. Be honest. No, don\'t be.', '*They prop it against the wall.* Stand back a bit. It looks better from further.'], {
    cheerful: ['*They hold it up proudly.* Ta-da!'],
    ornery: ['*Holds it out at arm\'s length.* Go on, then.'],
    shy: ['*They hold it face down for a moment, then turn it over.*'],
    proud: ['*They set it on the easel as if it were a crown.*'],
    child: ['*A smudgy drawing, held very close to your nose.* LOOK.'],
  });
  L('pastime.painting.notice', ['There\'s a smudge of blue on their ear.', 'Every fingernail is a different colour.'], {}, [
    { if: { stage: 'child' }, text: ['There\'s paint on their nose, their knees and somehow the back of their neck.'] },
  ]);
  L('pastime.painting.road', ['...Then you know. It stays with you. That\'s why I paint it.', 'You\'ve seen it from away. I\'ve only seen it from here. Tell me how it looks from the road.'], {
    dreamy: ['From the road... I\'d like to see it from the road, once. Going away and coming back.'],
  });
  L('pastime.painting.cant', ['The sea. I\'ve never seen it. How can you paint what you\'ve never seen?', 'The blue of a kingfisher. It\'s not a colour, it\'s a light.'], {
    cheerful: ['Sunshine! You can\'t paint sunshine! You can only paint where it lands!'],
    ornery: ['Proper black. Everything\'s brown if you look close.'],
    shy: ['...Someone\'s smile. I can never get it.'],
    curious: ['Gold. Real gold. Yellow just isn\'t it. There\'s a shine you can\'t mix.'],
    dreamy: ['The colour of a memory. You know. That faded gold.'],
    witty: ['Invisible. I\'ve been told my invisible is very good.'],
    proud: ['None. I\'ve mixed them all. ...Except the sea.'],
    gloomy: ['Happy. I can never paint happy.'],
    child: ['Ghosts! What colour are ghosts?'],
  }, [
    { if: { rift: true }, text: ['Neon. You can\'t make it from berries. The colours here don\'t glow. I miss the glow.'] },
  ]);
  L('pastime.painting.eat', ['I wouldn\'t. The green\'s got copper in it.', 'Mostly fine. Don\'t eat the yellow.'], {
    witty: ['The red\'s beetroot, so that\'s fine. The blue\'s a mystery even to me.'],
    child: ['I ate the red one! It was beetroot! My tongue went red!'],
  });
  L('pastime.painting.sit', ['Done. Thursday. Bring the hat. Wear the beard.', 'I\'ll hold you to that. A wizard, painted! Folk will come from Bree.'], {
    cheerful: ['Oh, yes! I\'ll get the big canvas!'],
    shy: ['...Really? You\'d sit for me?'],
    proud: ['A worthy subject at last.'],
  });
  L('pastime.painting.who', ['My mother. Before I forget her face.', 'Everyone at the Badger on a Mersday. All of them singing.'], {
    cheerful: ['Everyone! All of us, at a party, all at once!'],
    ornery: ['Nobody. People fidget.'],
    shy: ['...Someone. I won\'t say who.'],
    curious: ['The old miller. His face is like a map. Every line\'s a story.'],
    dreamy: ['Someone I\'ll never see again.'],
    witty: ['Myself. Then at least someone would sit still for me.'],
    proud: ['The Steward. In oils. Very grand.'],
    gloomy: ['The ones who\'ve gone. Before I forget them.'],
    child: ['My dog! I haven\'t got a dog. I\'d paint one first.'],
  }, [
    { if: { spouse: has }, text: ['{Spouse}. Asleep. It\'s the only time {spouse} stops moving.'] },
    { if: { kid: has }, text: ['{Kid}. Before {kid} grows up. They do it so fast.'] },
  ]);
  L('pastime.painting.light', ['*They look with you a while.* ...There. See how it goes gold on the water? That\'s the bit I\'m after.', '...You see it too. Most folk walk past.'], {
    shy: ['*After a long while:* ...Thank you for looking. Nobody looks.'],
    dreamy: ['*They let out a breath.* ...This is what I paint. This moment. Never quite catch it.'],
  });
  L('pastime.painting.praised', ['Oh, you\'re only saying that. ...Say it again.', 'Do you think? It\'s not quite right. But thank you.'], {
    cheerful: ['Ha! You can have it! No, wait, you can have the next one!'],
    ornery: ['Hm. It\'s all right. The sky\'s wrong.'],
    shy: ['*very pink* ...Thank you.'],
    proud: ['I know. But it\'s nice to hear.'],
    gloomy: ['...Really? ...Thank you.'],
    child: ['YES! I\'m going to be a painter when I\'m big!'],
  });
  L('pastime.painting.advised', ['Heavy? ...It is a bit heavy. Blast it.', 'You might be right. I\'ll take some grey out.'], {
    ornery: ['It\'s meant to be heavy. It was going to rain.'],
    proud: ['It\'s a stormy sky. It\'s meant to be heavy.'],
    curious: ['Do you think? Lighter where? There, by the hill?'],
    child: ['It\'s heavy because it\'s FULL OF RAIN.'],
  });
  L('pastime.painting.corner', ['...A little hare. I put one in every painting. Nobody notices.', '...Oh, that\'s me. Very small. I always put myself in.'], {
    shy: ['...That\'s me. Very tiny. Watching.'],
    witty: ['That\'s a hare. Or a smudge. I\'m keeping it mysterious.'],
    child: ['That\'s YOU!'],
  });
  L('pastime.painting.sea', ['...Every colour and none of them. Oh, I\'d give anything to see that.', '...Say that again. Slowly. I want to remember it.'], {
    dreamy: ['*They close their eyes.* ...Every colour, and none. I\'ll paint that, one day.'],
  });
  L('pastime.painting.havent', ['...Because I\'d get it wrong, and then that would be how I remember them.', '...Because they\'d see how I see them. And that\'s too much.'], {
    shy: ['...I couldn\'t. They\'d know. They\'d know everything.'],
  });
});
