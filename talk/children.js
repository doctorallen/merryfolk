'use strict';
// ---------------------------------------------------------------------------
// Talking with the children, part one: the little ones and their days. What
// a child is like to talk to (the facts below: their own temper, siblings, the
// household pet, who minds them, how the rifts look to them), toddlers who say
// one word at a time, the best game in Thistledown, a frog in a pocket, the
// cat or dog at home, brothers and sisters, being told off, and what frightens
// them in the dark. The other children's packs build on these facts.
// ---------------------------------------------------------------------------

talkPack('children', () => {
  const has = (x) => x != null && x !== false && x !== '' && !(Array.isArray(x) && !x.length);
  const kid = (F) => F.stage === 'child';
  const talker = (F) => kid(F) && F.band !== 'toddler';
  // a word from the wizard that leans a child both ways at once
  const both = (amt) => (T, v) => { if (v.isChild() && typeof nudgeUp === 'function') { nudgeUp(v, 'hill', amt, 'The wizard said both ways have their good'); nudgeUp(v, 'rift', amt, null, true); } };

  // --- What's true about a child, for the children's packs ---------------------------------
  addFacts((v, F) => {
    const child = v.isChild();
    const P = (v.parents || []).map(personById).filter(Boolean);
    const p0 = P[0] || null;
    F.childTemper = child && typeof temperOf === 'function' ? temperOf(v) : null;
    F.childYears = child ? v.years() : null;
    F.childTween = child && v.years() >= 20;
    F.childComing = child && v.years() >= 28;
    F.childParentWord = child && p0 ? (p0.genes.sex === 'f' ? 'Mum' : 'Dad') : null;
    const p1 = P[1] || null;
    F.childOther = child && p1 ? p1.first : null;
    F.childOtherWord = child && p1 ? (p1.genes.sex === 'f' ? 'Mum' : 'Dad') : null;
    const jp = P.find((p) => p.job);
    F.childParentJob = child && jp ? JOBS[jp.job].label.toLowerCase() : null;
    const gps = P.flatMap((p) => (p.parents || []).map(personById).filter(Boolean));
    F.childGran = child && gps[0] ? gps[0].first : null;
    F.childGranWord = child && gps[0] ? (gps[0].genes.sex === 'f' ? 'Gran' : 'Grandad') : null;
    // brothers and sisters: anyone sharing a parent
    const sibs = child && P.length ? Game.villagers.filter((o) => o !== v && !o.leaving && (o.parents || []).some((p) => v.parents.includes(p))) : [];
    const walkers = sibs.filter((o) => o.stage !== 'baby');
    F.childSib = walkers[0] ? walkers[0].first : null;
    F.childSibCount = walkers.length;
    F.childSibWord = walkers[0] ? (walkers[0].genes.sex === 'f' ? 'sister' : 'brother') : null;
    const little = walkers.filter((o) => o.age < v.age).sort((a, b) => b.age - a.age)[0];
    const big = walkers.filter((o) => o.age > v.age).sort((a, b) => a.age - b.age)[0];
    F.childSibLittle = little ? little.first : null;
    F.childSibBig = big ? big.first : null;
    F.childSibBigWord = big ? (big.genes.sex === 'f' ? 'sister' : 'brother') : null;
    F.childSibLittleWord = little ? (little.genes.sex === 'f' ? 'sister' : 'brother') : null;
    const baby = sibs.find((o) => o.stage === 'baby');
    F.childBaby = baby ? baby.first : null;
    // the household's cat or dog
    const pet = child && v.homeId >= 0 && typeof petOf === 'function' && v.home() ? petOf(v.home()) : null;
    F.childPetName = pet ? pet.name : null;
    F.childPetKind = pet ? pet.kind : null;
    F.childPetCoat = pet ? petWord(pet) : null;
    F.childPetMine = !!(pet && pet.owner === v.id);
    // friends and folk
    const teller = Game.villagers.find((o) => o.job === 'storyteller' && !o.leaving);
    F.childStoryteller = child && teller ? teller.first : null;
    const rel = (o) => (v.rel && v.rel[o.id]) || 0;
    const pals = child ? Game.villagers.filter((o) => o !== v && o.isChild() && !o.leaving && !sibs.includes(o) && rel(o) > 0.12).sort((a, b) => rel(b) - rel(a)) : [];
    F.childPal = pals[0] ? pals[0].first : null;
    const rb = Game.villagers.filter((o) => o !== v && o.isRiftborn && o.isRiftborn() && !o.leaving && o.stage !== 'baby').sort((a, b) => rel(b) - rel(a));
    F.childRiftFolk = rb.length > 0;
    F.childRiftName = child && rb[0] ? rb[0].first : null;
    F.childRiftFriend = !!(child && rb[0] && rel(rb[0]) > 0.3);
    F.childRiftStage = typeof story === 'function' ? story().stage : 0;
    F.childRiftOpen = !!(World.rifts && World.rifts.some((r) => r.a > 0.6 && !r.closing));
    const g = (v.genes && v.genes.rift) || 0;
    F.childBlood = child ? (g >= 0.99 ? 'rift' : g >= 0.4 ? 'half' : g > 0.05 ? 'little' : null) : null;
    F.childUpb = child && typeof upbClass === 'function' ? upbClass(v) : null;
    F.childLettered = child && v.edu >= 0.15;
    // what's happened to them lately
    const ms = (typeof moodletsOf === 'function' ? moodletsOf(v) : []).filter((m) => m.until > Game.time);
    const mk = (k) => ms.find((m) => m.k === k);
    F.childTale = child && mk('wizard_tale') && mk('wizard_tale').x ? mk('wizard_tale').x : null;
    F.childShow = !!(child && mk('wizard_show'));
    F.childNewBaby = !!(child && mk('new_baby'));
    F.childTantrum = !!(child && mk('tantrum'));
    F.childTutted = !!(child && mk('tutted'));
    F.childPatted = !!(child && mk('patted'));
    const u = child && Game.upb && Game.upb[v.id];
    const top = u && u.morals ? Object.keys(u.morals).sort((a, b) => u.morals[b] - u.morals[a])[0] : null;
    F.childMoral = top || null;
    // what they might be when they're grown
    let best = null, bs = -1e9;
    if (child && typeof jobFit === 'function') for (const j in JOBS) { let s = -1e9; try { s = jobFit(v, j); } catch (e) { /* no fit */ } if (s > bs) { bs = s; best = j; } }
    F.childCallingKey = best;
    F.childCalling = best ? JOBS[best].label.toLowerCase() : null;
    F.childCallingA = best ? (/^[aeiou]/.test(F.childCalling) ? 'an ' : 'a ') + F.childCalling : null;
    F.childApprentice = child && v.apprenticedTo && JOBS[v.apprenticedTo] ? JOBS[v.apprenticedTo].label.toLowerCase() : null;
    // someone a youth is sweet on
    let crush = null;
    if (child && v.years() >= 16) crush = Game.villagers.filter((o) => o !== v && !o.leaving && (o.isChild() ? o.years() >= 16 : o.stage === 'adult' && o.years() < 45 && o.spouse == null) && !related(v, o) && rel(o) > 0.25).sort((a, b) => rel(b) - rel(a))[0] || null;
    F.childCrush = crush ? crush.first : null;
  });

  // --- Phrases ------------------------------------------------------------------------------------
  frags('child.wow', ['Wow!', 'Ooh!', 'Cor!', 'Blimey!', 'Whoa!']);
  frags('child.honest', ['honest', 'honest and true', 'cross my heart', 'on my pudding', 'swear on my conkers']);

  // =====================================================================================
  // Toddlers: hello, little one
  // =====================================================================================
  addThread({
    id: 'child.tot.hello', label: 'Say hello to the little one', weight: 1.6, cool: 1,
    when: (F) => F.band === 'toddler',
    open: { warm: 'child.tot.hello.open' },
    beats: {
      start: { line: 'child.tot.hello.start', go: [
        { ap: 'jest', say: '*You waggle your eyebrows.*', label: 'Waggle your eyebrows', to: 'giggle' },
        { ap: 'ask', say: 'What have you got there, {name}?', to: 'got' },
        { ap: 'warm', say: '*You crouch down, knees creaking, to their height.*', label: 'Crouch down to their height', to: 'crouch' },
      ] },
      giggle: { line: 'child.tot.hello.giggle', go: [
        { ap: 'jest', say: '*Waggle them again, slower.*', label: 'Again, slower', to: 'again' },
        { ap: 'tale', say: '*You make your hat dance on top of your staff.*', label: 'Make your hat dance', to: 'hat' },
        { ap: 'warm', say: 'What a fine laugh you have.', to: 'laugh' },
      ] },
      again: { line: 'child.tot.hello.again', go: [
        { ap: 'jest', say: 'One more. Only one, mind.', to: 'tired' },
        { ap: 'tale', say: '*You make your hat dance instead.*', label: 'Try the hat instead', to: 'hat' },
      ] },
      hat: { line: 'child.tot.hello.hat', fx: { fond: 0.03, run: (T, v) => { if (typeof FX !== 'undefined' && FX.sparkle) FX.sparkle(v.x, v.y - 14, '#c8b0ff'); } }, go: [
        { ap: 'warm', say: 'You liked that, didn\'t you?', to: 'laugh' },
        { ap: 'jest', say: 'Now you try. Wiggle your ears.', to: 'ears' },
      ] },
      ears: { line: 'child.tot.hello.ears', fx: { joke: { k: 'child.ears', t: 'Little {name} wiggles {their} whole face, not just the ears.' } }, end: true },
      laugh: { line: 'child.tot.hello.laugh', end: true },
      tired: { line: 'child.tot.hello.tired', end: true },
      got: { line: 'child.tot.hello.got', go: [
        { ap: 'ask', say: 'Is it a good one?', to: 'good' },
        { ap: 'jest', say: 'May I have it?', to: 'mine' },
        { ap: 'warm', say: 'That\'s a very fine thing.', to: 'gift' },
      ] },
      good: { line: 'child.tot.hello.good', go: [
        { ap: 'warm', say: 'I thought so. You have a good eye.', to: 'gift' },
        { ap: 'jest', say: 'Can it do tricks?', to: 'tricks' },
      ] },
      tricks: { line: 'child.tot.hello.tricks', end: true },
      mine: { line: 'child.tot.hello.mine', go: [
        { ap: 'warm', say: 'Quite right. Finders keepers.', to: 'end' },
        { ap: 'jest', say: 'Not even for a wizard? Not even a little bit?', to: 'gift' },
      ] },
      gift: { line: 'child.tot.hello.gift', fx: { fond: 0.04, note: 'Little {name} gave you a treasure, very solemnly.' }, go: [
        { ap: 'warm', say: 'Thank you. I shall keep it always.', to: 'end', fx: { remember: 'I gave the wizard my best thing.', rv: 2 } },
        { ap: 'jest', say: 'Just what I needed. My staff was getting old.', to: 'end', fx: { joke: { k: 'child.tot.staff', t: 'The wizard\'s new staff, from little {name}.' } } },
      ] },
      crouch: { line: 'child.tot.hello.crouch', go: [
        { ap: 'jest', say: 'Yes, it\'s a beard. It\'s mine. Mostly.', to: 'beard' },
        { ap: 'ask', say: 'And who might you be?', to: 'who' },
        { ap: 'warm', say: 'Gently now. That\'s it.', to: 'gentle' },
      ] },
      beard: { line: 'child.tot.hello.beard', go: [
        { ap: 'jest', say: 'Ow! Ow. A very strong grip, for one so small.', to: 'strong' },
        { ap: 'warm', say: 'There, you can let go now. There we are.', to: 'gentle' },
      ] },
      strong: { line: 'child.tot.hello.strong', fx: { fond: 0.02 }, end: true },
      gentle: { line: 'child.tot.hello.gentle', fx: { trust: 0.03 }, end: true },
      who: { line: 'child.tot.hello.who', go: [
        { ap: 'warm', say: 'A very good name, {name}.', to: 'end' },
        { ap: 'jest', say: 'And I\'m Gandalf. Can you say Gandalf?', to: 'gandalf' },
      ] },
      gandalf: { line: 'child.tot.hello.gandalf', fx: { joke: { k: 'child.tot.name', t: 'Little {name} calls you something that isn\'t quite Gandalf.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.tot.hello.open', [
    { text: ['Hello, little {name}.', 'Well now. And who is this?', 'Good morning to you, small person.'] },
    { if: { hour: 'evening' }, text: ['Shouldn\'t you be in bed, little one?', 'Hello, {name}. Nearly bedtime, I think.'] },
    { if: { childParentWord: has }, text: ['Hello, {name}. Where\'s your {childParentWord}, then?'] },
  ]);
  lines('child.tot.hello.start', [
    { text: ['*stares up at you with enormous eyes*', 'Hat.', 'Big man.', '*points at your hat, then at you, then at the hat*'] },
    { if: { childTemper: 'shy' }, text: ['*hides behind a gatepost*', '*peeps at you round somebody\'s leg*', '*sucks a thumb and says nothing at all*'] },
    { if: { childTemper: 'cheerful' }, text: ['HALLO!', 'Hiya! Hiya hiya!', '*waves both arms, then falls over, then waves again*'] },
    { if: { childTemper: 'curious' }, text: ['What dat?', 'Why you tall?', '*points at your staff* What dat stick?'] },
    { if: { childTemper: 'ornery' }, text: ['No.', 'Go way.', '*frowns tremendously*'] },
    { if: { childTemper: 'gloomy' }, text: ['*sniff*', 'Want home.', '*lip wobbles*', '*sniffs, very sadly*'] },
    { if: { childTemper: 'gloomy', childParentWord: has }, text: ['Want {childParentWord}.', '*sniff* {ChildParentWord}?'] },
    { if: { met: true }, text: ['Wizzud!', 'Gannal!', 'Hat man!'] },
    { if: { weather: 'rain' }, text: ['Wet!', '*stamps in a puddle, looking at you to see if that\'s allowed*'] },
    { if: { weather: 'snow' }, text: ['Snow!', '*holds up a fistful of snow, already melting*'] },
    { if: { childPetName: has }, text: ['{ChildPetName}!', '*points the wrong way* {ChildPetName} there!'] },
    { if: { rift: true }, text: ['Beep.', '*holds up a little blinking light*'] },
  ]);
  lines('child.tot.hello.giggle', [
    { text: ['*giggles*', 'Hee hee!', '*laughs so hard {they} sit down*'] },
    { if: { childTemper: 'shy' }, text: ['*a tiny smile, then hides again*', '*peeps out. Peeps back. Peeps out.*'] },
    { if: { childTemper: 'ornery' }, text: ['*tries very hard not to laugh, and fails*', 'Not funny. *giggles* NOT funny.'] },
    { if: { childTemper: 'gloomy' }, text: ['*stops sniffing, to stare*', '*a wet little smile*'] },
    { if: { childTemper: 'curious' }, text: ['*reaches up to touch your eyebrows*', 'How you do dat?'] },
  ]);
  lines('child.tot.hello.again', [
    { text: ['AGAIN!', 'Again! Again!', 'More eyebrow!'] },
    { if: { childTemper: 'shy' }, text: ['*whispers* again', '*holds up one finger, which means again*'] },
    { if: { childTemper: 'ornery' }, text: ['...Again. Please.', 'Do it MORE.'] },
    { if: { childTemper: 'curious' }, text: ['*tries to waggle own eyebrows, waggles whole face*'] },
  ]);
  lines('child.tot.hello.hat', [
    { text: ['*squeals*', 'HAT DANCING!', '*claps with both hands and one foot*'] },
    { if: { childTemper: 'shy' }, text: ['*comes all the way out to watch*', '*ohhhh*'] },
    { if: { childTemper: 'ornery' }, text: ['...Hat do it again.', '*stops frowning altogether*'] },
    { if: { childTemper: 'gloomy' }, text: ['*stops crying, mid-sob, to watch*'] },
    { if: { childTemper: 'curious' }, text: ['Hat alive?', 'Me hat. ME hat.'] },
  ]);
  lines('child.tot.hello.ears', [
    { text: ['*wiggles whole face, very hard*', '*scrunches up nose, eyes and most of {their} cheeks*'] },
    { if: { childTemper: 'ornery' }, text: ['*wiggles one ear and looks extremely smug*'] },
    { if: { childTemper: 'cheerful' }, text: ['*wiggles everything, including both feet*'] },
  ]);
  lines('child.tot.hello.laugh', [
    { text: ['*laughs again, to show you*', 'Hee!', '*beams*'] },
    { if: { childTemper: 'shy' }, text: ['*goes pink and hides, but smiling*'] },
    { if: { childTemper: 'ornery' }, text: ['*laughs, then remembers to frown*'] },
  ]);
  lines('child.tot.hello.tired', [
    { text: ['*yawns enormously and sits down in the lane*', '*rubs eyes* Nap.', 'All done.'] },
    { if: { childParentWord: has }, text: ['{ChildParentWord}! *toddles off to find {childParentWord}*'] },
    { if: { childTemper: 'ornery' }, text: ['NO more. *stomps off*'] },
  ]);
  lines('child.tot.hello.got', [
    { text: ['Stick.', '*holds out a stick, very seriously*', 'Stone. Good stone.'] },
    { if: { season: 'autumn' }, text: ['Conker!', '*shows you a conker, shiny as a boot*', 'Leaf. Big leaf.'] },
    { if: { season: 'spring' }, text: ['Snail.', '*opens both hands: a snail, slightly squashed*', 'Worm! Wriggly!'] },
    { if: { season: 'summer' }, text: ['Flower. Yellow.', '*holds out a daisy with no petals left*', 'Bug!'] },
    { if: { season: 'winter' }, text: ['Snow. *it is water now*', 'Icicle!'] },
    { if: { childTemper: 'shy' }, text: ['*opens one fist a crack, then shuts it*'] },
    { if: { childTemper: 'ornery' }, text: ['Mine.', 'Nothing. *hides something behind back*'] },
  ]);
  lines('child.tot.hello.good', [
    { text: ['Good.', 'Best one.', '*nods very hard*'] },
    { if: { childTemper: 'curious' }, text: ['Good! Look. *turns it round to show you the other side*'] },
    { if: { childTemper: 'cheerful' }, text: ['Bestest!', 'Yes! Good good good.'] },
  ]);
  lines('child.tot.hello.tricks', [
    { text: ['*puts it on {their} head*', 'No. *eats it a bit*', '*throws it, and looks at you to fetch it*'] },
    { if: { childPetKind: 'dog', childPetName: has }, text: ['Throw! For {childPetName}!'] },
  ]);
  lines('child.tot.hello.mine', [
    { text: ['MINE.', 'No. Mine.', '*clutches it to {their} tummy*'] },
    { if: { childTemper: 'cheerful' }, text: ['Mine! *giggles*', 'Mine! ...Yours? No. Mine.'] },
    { if: { childTemper: 'shy' }, text: ['*hides it in {their} pocket, and hides {their} face too*'] },
  ]);
  lines('child.tot.hello.gift', [
    { text: ['For you.', '*presses it into your hand and closes your fingers round it*', 'You have.'] },
    { if: { childTemper: 'ornery' }, text: ['...You have it. *sighs, as if this is a great sacrifice*'] },
    { if: { childTemper: 'shy' }, text: ['*puts it on your boot and runs away*'] },
    { if: { childTemper: 'cheerful' }, text: ['PRESENT! For wizzud!'] },
  ]);
  lines('child.tot.hello.crouch', [
    { text: ['*grabs your beard*', 'Beard!', '*pats your nose*'] },
    { if: { childTemper: 'shy' }, text: ['*steps forward one step, very bravely*', '*touches your sleeve with one finger*'] },
    { if: { childTemper: 'curious' }, text: ['*puts a hand in your beard to see what lives there*'] },
    { if: { childTemper: 'ornery' }, text: ['*pulls your hat brim down over your eyes*'] },
  ]);
  lines('child.tot.hello.beard', [
    { text: ['*pulls*', 'Mine beard.', '*does not let go*'] },
    { if: { childTemper: 'cheerful' }, text: ['*swings on it a bit*'] },
  ]);
  lines('child.tot.hello.strong', [
    { text: ['Strong!', '*lets go and shows you {their} muscles*', '*very pleased with {them}self*'] },
  ]);
  lines('child.tot.hello.gentle', [
    { text: ['*pats your beard, very gently, like a cat*', 'Soft.', '*strokes your sleeve*'] },
    { if: { childTemper: 'shy' }, text: ['*leans on your knee, just for a moment*'] },
  ]);
  lines('child.tot.hello.who', [
    { text: ['{Name}.', 'Me!', '*points at self* Dis one.'] },
    { if: { childTemper: 'shy' }, text: ['*whispers something that might be a name*'] },
    { if: { childSib: has }, text: ['{Name}. An\' {childSib}.'] },
    { if: { childTemper: 'cheerful' }, text: ['{Name}! {Name} {Name} {Name}!', 'I {name}! I free! *holds up two fingers*'] },
  ]);
  lines('child.tot.hello.gandalf', [
    { text: ['Gangle.', 'Gannaf.', 'Dandelf.', 'Wizzud.'] },
    { if: { childTemper: 'ornery' }, text: ['No. Hat man.'] },
  ]);

  // --- A toddler shows you something (theirs) ----------------------------------------------
  addThread({
    id: 'child.tot.show', theirs: true, label: 'A little one shows you something', cool: 2,
    ask: '{Name} toddles up with something held out in both hands.',
    when: (F) => F.band === 'toddler',
    beats: {
      start: { line: 'child.tot.show.start', go: [
        { ap: 'ask', say: 'What\'s that, then?', to: 'what' },
        { ap: 'jest', say: 'Is it for me? It\'s exactly what I wanted.', to: 'forme' },
        { ap: 'warm', say: 'Oh, how lovely. Did you find it all by yourself?', to: 'found' },
      ] },
      what: { line: 'child.tot.show.what', go: [
        { ap: 'ask', say: 'And where does it live?', to: 'lives' },
        { ap: 'jest', say: 'Does it have a name?', to: 'named' },
      ] },
      lives: { line: 'child.tot.show.lives', end: true },
      named: { line: 'child.tot.show.named', fx: { joke: { k: 'child.tot.named', t: 'Little {name} names everything after you.' } }, end: true },
      forme: { line: 'child.tot.show.forme', go: [
        { ap: 'warm', say: 'Then I\'ll take great care of it.', to: 'end', fx: { fond: 0.04 } },
        { ap: 'jest', say: 'I\'ll put it in my hat with the others.', to: 'inhat' },
      ] },
      inhat: { line: 'child.tot.show.inhat', end: true },
      found: { line: 'child.tot.show.found', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'Clever little thing.', to: 'end' },
        { ap: 'ask', say: 'Are there more?', to: 'more' },
      ] },
      more: { line: 'child.tot.show.more', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.tot.show.start', [
    { text: ['Look!', 'Wizzud. Look.', '*holds it up as high as {their} arms go*'] },
    { if: { season: 'spring' }, text: ['Snail! Look! SNAIL.', 'Froggy! *it is a stone*'] },
    { if: { season: 'summer' }, text: ['Butterfly. *it has flown off* ...Gone.', 'Flower for you!'] },
    { if: { season: 'autumn' }, text: ['Conker! Shiny!', 'Leaf! Orange!'] },
    { if: { season: 'winter' }, text: ['Snow! *it is mostly gone*', 'Cold! *holds out red little hands*'] },
    { if: { childTemper: 'shy' }, text: ['*holds it out without a word and looks at your boots*'] },
  ]);
  lines('child.tot.show.what', [
    { text: ['Is a snail.', 'Is a... *thinks very hard* ...thing.', 'Is mine.'] },
    { if: { childTemper: 'curious' }, text: ['Is a snail. Why snail?', 'Dunno. You know?'] },
    { if: { season: 'autumn' }, text: ['Conker. Is a TREE BABY.'] },
  ]);
  lines('child.tot.show.lives', [
    { text: ['Pocket.', 'In the garden. An\' pocket.', '*points at {their} pocket, very firmly*'] },
    { if: { childParentWord: has }, text: ['In {childParentWord}\'s boot.', 'Under {childParentWord}\'s pillow. Shh.'] },
  ]);
  lines('child.tot.show.named', [
    { text: ['Gandalf.', 'Hat.', 'Snaily. No. GANDALF.'] },
    { if: { childPetName: has }, text: ['{ChildPetName}. Like {childPetName}.'] },
  ]);
  lines('child.tot.show.forme', [
    { text: ['*nods*', 'For you!', 'Yes. Keep it.'] },
    { if: { childTemper: 'ornery' }, text: ['No. *takes it back* ...Yes. *gives it again*'] },
  ]);
  lines('child.tot.show.inhat', [
    { text: ['Hat! *tries to see in your hat*', '*giggles* Hat full of snails.'] },
  ]);
  lines('child.tot.show.found', [
    { text: ['Me! Me found!', '*nods* All by self.', 'Under there. *points nowhere in particular*'] },
    { if: { childSib: has }, text: ['Me! Not {childSib}. ME.'] },
  ]);
  lines('child.tot.show.more', [
    { text: ['Lots!', 'All of them! *runs off to look*', '*holds up all ten fingers*'] },
  ]);

  // =====================================================================================
  // The best game in Thistledown
  // =====================================================================================
  addThread({
    id: 'child.games', label: 'What\'s the best game?', weight: 1.4, cool: 3,
    when: (F) => talker(F) && !F.childTween,
    rel: (F) => (F.was === 'play' || F.bored ? 1.6 : 1),
    open: { ask: 'child.games.open' },
    beats: {
      start: { line: 'child.games.start', go: [
        { ap: 'ask', say: 'And how do you play?', to: 'rules' },
        { ap: 'jest', say: 'I was champion at that, you know. In the year dot.', to: 'champ' },
        { ap: 'warm', say: 'Who do you play it with?', to: 'who' },
      ] },
      rules: { line: 'child.games.rules', go: [
        { ap: 'ask', say: 'And who wins?', to: 'wins' },
        { ap: 'jest', say: 'That sounds suspiciously like cheating.', to: 'cheat' },
        { ap: 'listen', say: '*You nod slowly, trying to follow.*', label: 'Try to follow', to: 'lost' },
      ] },
      lost: { line: 'child.games.lost', go: [
        { ap: 'jest', say: 'I was listening! It\'s... the one with the... yes.', to: 'cheat' },
        { ap: 'warm', say: 'Sorry. Show me, instead of telling me.', to: 'play' },
      ] },
      wins: { line: 'child.games.wins', go: [
        { ap: 'jest', say: 'Always? Every single time?', to: 'cheat' },
        { ap: 'warm', say: 'Then you\'ll have to teach me.', to: 'play' },
      ] },
      cheat: { line: 'child.games.cheat', go: [
        { ap: 'warm', say: 'I believe you. Mostly.', to: 'end' },
        { ap: 'jest', say: 'A wizard always knows. It\'s in the hat.', to: 'hat' },
      ] },
      hat: { line: 'child.games.hat', fx: { joke: { k: 'child.games.hat', t: 'A wizard always knows. It\'s in the hat.' } }, end: true },
      who: { line: 'child.games.who', go: [
        { ap: 'ask', say: 'And does anyone get left out?', to: 'left', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'Sounds like a fine gang.', to: 'gang' },
      ] },
      gang: { line: 'child.games.gang', end: true },
      left: { line: 'child.games.left', go: [
        { ap: 'advise', say: 'Ask them in, next time. A game\'s better with one more.', to: 'askin', fx: { lean: 'hill', remember: 'The wizard says a game is better with one more.' } },
        { ap: 'comfort', say: 'Being left out is a hard thing. It won\'t always be so.', to: 'comfort' },
        { ap: 'ask', say: 'Why do you think that is?', to: 'why' },
      ] },
      why: { line: 'child.games.why', go: [
        { ap: 'advise', say: 'Then ask them in. It costs nothing.', to: 'askin', fx: { lean: 'hill' } },
        { ap: 'warm', say: 'You\'re a thoughtful one, {name}.', to: 'end', fx: { respect: 0.02 } },
      ] },
      askin: { line: 'child.games.askin', fx: { respect: 0.03, fond: 0.02 }, end: true },
      comfort: { line: 'child.games.comfort', fx: { trust: 0.04, drive: { lonely: -0.15 } }, end: true },
      champ: { line: 'child.games.champ', go: [
        { ap: 'tale', say: 'I once beat the Old Took at it. He was a hundred and two. He cheated.', to: 'tale' },
        { ap: 'jest', say: 'Wizards are very good at games. We can see round corners.', to: 'corners' },
      ] },
      corners: { line: 'child.games.corners', go: [
        { ap: 'jest', say: 'Try me. One round.', to: 'play' },
        { ap: 'warm', say: 'No, I can\'t really. But don\'t tell anyone.', to: 'end', fx: { trust: 0.03, confide: { k: 'child.games.corners', t: 'The wizard can\'t really see round corners', secret: false } } },
      ] },
      tale: { line: 'child.games.tale', fx: { fond: 0.02 }, go: [
        { ap: 'jest', say: 'Played it with him every Yule till he was a hundred and thirty.', to: 'play' },
        { ap: 'warm', say: 'He\'d have liked you. He liked anyone who played to win.', to: 'end' },
      ] },
      play: { line: 'child.games.play', go: [
        { ap: 'warm', say: 'One round, then. Just the one.', to: 'played', fx: { queue: 'play', fond: 0.04, drive: { bored: -0.3 } } },
        { ap: 'advise', say: 'Not today. Go and find a friend, and play it properly.', to: 'off', fx: { queue: 'play' } },
      ] },
      played: { line: 'child.games.played', fx: { remember: 'I played with the wizard! And I won.', rv: 2, joke: { k: 'child.games.beat', t: '{Name} beat the wizard at a game, fair and square. Nearly.' } }, end: true },
      off: { line: 'child.games.off', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.games.open', [
    { text: ['What\'s the best game in Thistledown, {name}?', 'Tell me, {name}. What game should an old wizard learn?', 'What do you play, {name}, when nobody\'s making you do anything?'] },
    { if: { was: 'play' }, text: ['That looked like a good game, {name}. What was it?', 'Who\'s winning, {name}?'] },
    { if: { season: 'winter' }, text: ['Snowballs, {name}? Or is there a better game in winter?'] },
    { if: { season: 'autumn' }, text: ['Is it conker time yet, {name}?'] },
  ]);
  lines('child.games.start', [
    { text: ['Tag! Tag\'s the best. Everyone knows that.', 'Hide-and-seek. I\'m brilliant at hiding. You\'d never find me.', 'Stuck-in-the-mud! It\'s the best and also the worst.', 'Pooh-sticks off the bridge. Mine always wins.'] },
    { if: { season: 'winter' }, text: ['SNOWBALLS. Obviously.', 'Sliding on the pond! Don\'t tell anyone. It\'s not allowed.', 'Snow-forts. We\'ve got a fort. It\'s got a wall and everything.'] },
    { if: { season: 'autumn' }, text: ['Conkers! I\'ve got a ninety-niner.', 'Conkers. Mine\'s been soaked in vinegar. Don\'t tell.', 'Jumping in leaf piles. And then hiding in them.'] },
    { if: { season: 'spring' }, text: ['Frog-catching! Down by the reeds.', 'Racing boats in the ditch. Mine\'s a walnut shell.', 'Hopscotch. I chalked it myself. It goes up to twelve.'] },
    { if: { season: 'summer' }, text: ['Paddling! And dam-building. Mostly dam-building.', 'Kick-the-can, down the lane, till it gets dark.', 'Daisy chains. Don\'t laugh. I made one round the whole party tree.'] },
    { if: { band: 'young' }, text: ['Chasing! I chase and they run and then THEY chase and I run!', 'Being a dragon. I\'m the dragon. I\'m always the dragon.', 'Hiding! I hid in a barrel. Nobody found me for AGES.'] },
    { if: { band: 'school' }, text: ['Tag, but proper tag, with rules. I made the rules.', 'Knights and trolls. I\'m always the knight. Somebody has to be.', 'Marbles. I\'ve won forty-three. Off the same boy.'] },
    { if: { band: 'youth' }, text: ['Games? I\'m a bit old for games. ...Conkers doesn\'t count. Conkers is a sport.', 'Skimming stones. My record\'s eleven. Nobody believes me.', 'Quoits, at the Badger. They let us, if we\'re quiet.'] },
    { if: { childTemper: 'shy' }, text: ['I like hiding best. Nobody finds me. Sometimes they stop looking.', '...Pooh-sticks. You can play it on your own.'] },
    { if: { childTemper: 'ornery' }, text: ['Tag, but I\'m never It. I don\'t do being It.', 'Conkers. I always win. I don\'t see why that\'s a problem.'] },
    { if: { childTemper: 'curious' }, text: ['I\'m making up a new game. It\'s got fourteen rules so far.', 'Finding out where the stream goes. Is that a game? It\'s a game.'] },
    { if: { childTemper: 'gloomy' }, text: ['I don\'t know. Nobody asks me to play anything.', 'There\'s nothing to play. There\'s never anything.'] },
    { if: { rift: true }, text: ['There\'s a game from home called Signal. You hide a blinker and find it in the dark.', 'Glitch-tag. Like tag, but when you\'re caught you freeze and buzz.'] },
    { if: { riftWays: true }, text: ['Relay-tag! You tap a code on someone\'s back and they have to guess who.'] },
  ]);
  lines('child.games.rules', [
    { text: ['Easy. You run, and if they touch you you\'re It, unless you\'re on wood, or you said "fainites" first.', 'Well, there\'s a base, and a jail, and if you\'re in jail someone has to free you, but not by running.'] },
    { if: { season: 'winter' }, text: ['No ice in the snowballs. No snowballs at grown-ups. Except at the Yule party. That\'s allowed.'] },
    { if: { season: 'autumn' }, text: ['You put your conker on a string and they hit it and you hit theirs and whoever\'s breaks, loses. And cries.'] },
    { if: { season: 'spring' }, text: ['You catch them, you say hello, and you put them back. Frogs don\'t like pockets. I asked.'] },
    { if: { band: 'young' }, text: ['You run! And then... you run more! And then you\'re It and you say "you\'re It"!', 'There\'s a rule about the hedge. And a rule about not crying. And I forget the others.'] },
    { if: { band: 'school' }, text: ['Rule one: no cheating. Rule two: no biting. Rule three: I\'m in charge. That\'s it.', 'There are nine rules. Shall I start at the beginning or the important ones?'] },
    { if: { band: 'youth' }, text: ['There aren\'t really rules. There\'s just being better than everyone else.'] },
    { if: { childTemper: 'curious' }, text: ['Rule eleven is the best one. You have to hop backwards if anyone says "turnip".'] },
    { if: { register: 'bright' }, text: ['It\'s quite complicated, actually. There\'s a scoring system. I wrote it down.'] },
  ]);
  lines('child.games.lost', [
    { text: ['You\'re not even listening!', 'You\'ve gone all glazed. Like Grandad does.', 'That\'s the wrong nod. That\'s the nod grown-ups do when they don\'t know.'] },
    { if: { childTemper: 'ornery' }, text: ['Ugh. Grown-ups.', 'Never mind. You\'d only lose.'] },
    { if: { childTemper: 'shy' }, text: ['...Sorry. I talk too much about it.'] },
    { if: { childGranWord: has }, text: ['You look like {childGranWord} when I explain things.'] },
  ]);
  lines('child.games.wins', [
    { text: ['Me. Always me.', 'Me, mostly. When there\'s anyone to beat.', 'Whoever cries least.'] },
    { if: { childPal: has }, text: ['Me, mostly. Sometimes {childPal}, if I let them.', '{ChildPal} and me take turns. My turns are longer.'] },
    { if: { childSibBig: has }, text: ['{ChildSibBig}, mostly. Because {childSibBig} is BIGGER, which isn\'t fair.'] },
    { if: { childSibLittle: has }, text: ['Me. {ChildSibLittle} always loses and cries. I let them win sometimes. Shh.'] },
    { if: { childTemper: 'shy' }, text: ['Not me. ...Sometimes me. Once.'] },
    { if: { childTemper: 'gloomy' }, text: ['Not me. Never me.'] },
  ]);
  lines('child.games.cheat', [
    { text: ['I do NOT cheat!', 'That was ONE TIME.', 'It\'s not cheating if you don\'t get caught. ...That\'s a joke! It\'s a joke.'] },
    { if: { childTemper: 'ornery' }, text: ['Take that back.', 'Who said? Who SAID?'] },
    { if: { childTemper: 'ornery', childSib: has }, text: ['Who said? Was it {childSib}? It was {childSib}.'] },
    { if: { childTemper: 'cheerful' }, text: ['Hee! Only a little bit.', 'Maybe a teeny bit. Everyone does!'] },
    { if: { childTemper: 'curious' }, text: ['Is it cheating if the rule wasn\'t written down yet? I don\'t think it is.'] },
    { if: { band: 'youth' }, text: ['It\'s called strategy.', 'I prefer to call it being clever.'] },
  ]);
  lines('child.games.hat', [
    { text: ['That\'s not fair. I haven\'t got a hat.', 'Is there really stuff in your hat? Can I look?', 'I KNEW it. I knew there was something in there.'] },
    { if: { band: 'youth' }, text: ['That\'s ridiculous. ...Is it, though?'] },
  ]);
  lines('child.games.who', [
    { text: ['Everyone! Well, everyone who\'s out.', 'The lane lot. We\'re a gang. We haven\'t got a name yet.'] },
    { if: { childPal: has }, text: ['{ChildPal}, mostly. {ChildPal}\'s my best friend. Don\'t tell {childPal} I said.', '{ChildPal} and me. We\'re a team. We\'re unbeatable.'] },
    { if: { childSib: has }, text: ['Me and {childSib}. We fight, but we\'re a team.', '{ChildSib}, when there\'s nobody better. Don\'t tell {childSib}.'] },
    { if: { childSib: has, childParentWord: has }, text: ['{ChildSib}, when I have to. {ChildParentWord} says I have to.'] },
    { if: { childPetName: has, childPetKind: 'dog' }, text: ['{ChildPetName}! {ChildPetName}\'s brilliant at chasing. Better than people.'] },
    { if: { childTemper: 'shy' }, text: ['On my own, mostly. I don\'t mind. Mostly.'] },
    { if: { childRiftName: has }, text: ['Everyone. And sometimes {childRiftName} joins in and makes it go all fizzy.'] },
  ]);
  lines('child.games.gang', [
    { text: ['The finest gang. We\'re going to have a badge.', 'We need a name. Can you think of a name? Something with dragons in.'] },
    { if: { band: 'youth' }, text: ['We\'re not a gang. We\'re... associates.'] },
  ]);
  lines('child.games.left', [
    { text: ['...Sometimes. There\'s a boy who\'s slow at running. We don\'t pick him.', 'Me. Sometimes it\'s me. They pick everyone and then there\'s me.'] },
    { if: { childTemper: 'ornery' }, text: ['Only people who deserve it.', 'Some people are rubbish at games. It\'s not my fault.'] },
    { if: { childTemper: 'shy' }, text: ['...Me, mostly. I don\'t ask. They don\'t ask.'] },
    { if: { childTemper: 'cheerful' }, text: ['No! Well. The little ones. They\'re too slow. ...Is that bad?'] },
    { if: { childTemper: 'gloomy' }, text: ['Me. Always me. I don\'t care. I do care.'] },
    { if: { rift: true }, text: ['Sometimes they don\'t pick me. Because of my eyes, I think. Or because I glow a bit.'] },
  ]);
  lines('child.games.why', [
    { text: ['I don\'t know. Because it\'s always been like that.', 'Because... I don\'t know. It\'s just what happens.'] },
    { if: { childTemper: 'shy' }, text: ['Because I\'m quiet. People forget quiet people.'] },
    { if: { childTemper: 'curious' }, text: ['Hm. I never thought about why. I\'m thinking now.'] },
  ]);
  lines('child.games.askin', [
    { text: ['All right. Tomorrow. If I remember.', '...Fine. But if we lose, it\'s your fault.', 'Maybe. A game IS better with one more. More people to tag.'] },
    { if: { childTemper: 'ornery' }, text: ['Hmph. All right. But I\'m still captain.'] },
    { if: { childTemper: 'cheerful' }, text: ['Yes! I\'ll ask everyone! Even the slow ones!'] },
    { if: { childTemper: 'shy' }, text: ['I could ask. I could. ...I will.'] },
  ]);
  lines('child.games.comfort', [
    { text: ['...Thanks. It\'s all right. Mostly.', 'You won\'t tell anyone I said?'] },
    { if: { childTemper: 'gloomy' }, text: ['...That\'s nice of you. Nobody says that.'] },
  ]);
  lines('child.games.champ', [
    { text: ['You? Wizards don\'t play games!', 'In the year WHAT?', 'Prove it.'] },
    { if: { childTemper: 'ornery' }, text: ['I don\'t believe you.', 'You\'d lose. You\'re too tall. You\'d stick out.'] },
    { if: { childTemper: 'curious' }, text: ['What\'s the year dot? Is it before the Shire? Were there games then?'] },
    { if: { band: 'youth' }, text: ['I\'m sure you were, wizard.'] },
  ]);
  lines('child.games.corners', [
    { text: ['No you can\'t.', 'CAN you?', 'That\'s cheating! You\'re a cheat! A wizard cheat!'] },
    { if: { childTemper: 'curious' }, text: ['How? Is it your eyebrows? Is that what they\'re for?'] },
  ]);
  lines('child.games.tale', [
    { text: ['A hundred and TWO?', 'You played games with the Old Took? The real one?', 'He cheated? What did he do?'] },
    { if: { childTemper: 'curious' }, text: ['How did he cheat? I need to know. For research.'] },
  ]);
  lines('child.games.play', [
    { text: ['Will you play? Now? Will you?', 'You can play if you want. You\'ll be rubbish, but you can.', 'Play with us! You can be It. You\'ll be It forever because you\'re slow.'] },
    { if: { childTemper: 'shy' }, text: ['...Would you play? With me? Just a bit?'] },
    { if: { band: 'youth' }, text: ['I suppose you could play. If you wanted. I\'m not bothered either way.'] },
  ]);
  lines('child.games.played', [
    { text: ['I WON! I beat the wizard!', 'You\'re rubbish! That was brilliant!', 'Again tomorrow! You promised! You didn\'t, but you did!'] },
    { if: { childTemper: 'ornery' }, text: ['You let me win. Don\'t let me win. ...I would have won anyway.'] },
    { if: { childTemper: 'shy' }, text: ['...That was the best game. Ever.'] },
  ]);
  lines('child.games.off', [
    { text: ['Fine. Your loss. Literally.', 'All right! Bye!', '*already running*'] },
    { if: { childPal: has }, text: ['{ChildPal}! {ChildPal}! The wizard says we have to play!'] },
  ]);

  // =====================================================================================
  // A frog in a pocket (theirs)
  // =====================================================================================
  addThread({
    id: 'child.frog', theirs: true, label: 'Something in a pocket', cool: 4,
    ask: '{Name} comes up with both hands clamped over a pocket.',
    when: (F) => (F.band === 'young' || F.band === 'school') && F.season !== 'winter',
    beats: {
      start: { line: 'child.frog.start', go: [
        { ap: 'ask', say: 'What\'s in there?', to: 'what' },
        { ap: 'jest', say: 'If that\'s a dragon, I\'d rather you didn\'t let it out.', to: 'dragon' },
        { ap: 'warm', say: 'Gently, now. Whatever it is.', to: 'what' },
      ] },
      dragon: { line: 'child.frog.dragon', go: [
        { ap: 'jest', say: 'A small one? Then I\'m only a little bit afraid.', to: 'what' },
        { ap: 'ask', say: 'Go on, then. Show me.', to: 'what' },
      ] },
      what: { line: 'child.frog.what', go: [
        { ap: 'ask', say: 'And what\'s it called?', to: 'name' },
        { ap: 'advise', say: 'Frogs prefer ponds to pockets, you know.', to: 'pond' },
        { ap: 'tale', say: 'I knew a frog who was a prince once. Or said he was.', to: 'prince' },
      ] },
      name: { line: 'child.frog.name', go: [
        { ap: 'jest', say: 'A very distinguished name for a frog.', to: 'keep' },
        { ap: 'advise', say: 'Then {Name}\'s frog had better go home for its tea.', to: 'pond' },
      ] },
      keep: { line: 'child.frog.keep', go: [
        { ap: 'advise', say: 'Frogs need water. And other frogs. Same as you need tea and friends.', to: 'pond' },
        { ap: 'warm', say: 'One night, then. In a bucket. With a stone to sit on.', to: 'bucket' },
      ] },
      bucket: { line: 'child.frog.bucket', fx: { promise: { k: 'child.frog', t: 'You said the frog could stay one night, then go home', days: 2 } }, end: true },
      pond: { line: 'child.frog.pond', fx: { respect: 0.02, lean: 'hill', remember: 'I let my frog go home to the pond.' }, end: true },
      prince: { line: 'child.frog.prince', go: [
        { ap: 'tale', say: 'He was very rude, and he wanted kissing, and nobody would.', to: 'kiss' },
        { ap: 'jest', say: 'This one\'s a frog all the way through, I\'m afraid.', to: 'pond' },
      ] },
      kiss: { line: 'child.frog.kiss', fx: { fond: 0.03, joke: { k: 'child.frog.kiss', t: 'Nobody would kiss the frog prince. Ugh.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.frog.start', [
    { text: ['Guess what I\'ve got. You\'ll never guess.', 'Don\'t tell anyone. I\'ve got something. It\'s alive.', 'Wizard! Wizard! Feel my pocket. No, don\'t. It might jump.'] },
    { if: { band: 'school' }, text: ['I\'ve made a scientific discovery. It\'s in my pocket.', 'Can you keep a secret? It\'s a wet one.'] },
    { if: { childTemper: 'shy' }, text: ['...I found something. Do you want to see? You don\'t have to.'] },
    { if: { childTemper: 'ornery' }, text: ['Promise you won\'t tell. Promise first.'] },
    { if: { childTemper: 'ornery', childParentWord: has }, text: ['Don\'t tell {childParentWord}. Promise first.'] },
  ]);
  lines('child.frog.dragon', [
    { text: ['It\'s not a DRAGON. ...It\'s a very small dragon.', 'Ha! No. But it\'s nearly as good.', 'If it was a dragon my pocket would be on fire. Think.'] },
    { if: { childTemper: 'curious' }, text: ['Do dragons fit in pockets? When they\'re babies? Do they?'] },
  ]);
  lines('child.frog.what', [
    { text: ['*opens the pocket a crack* A FROG.', 'It\'s a frog! Look at his little hands!', '*a frog looks out at you, very unimpressed*'] },
    { if: { season: 'spring' }, text: ['Tadpoles! In a jar! And the jar\'s in my pocket! Some of them have legs!'] },
    { if: { season: 'autumn' }, text: ['A toad. He\'s going to sleep all winter. I\'m going to watch.'] },
    { if: { season: 'summer' }, text: ['A newt! A real newt with a orange tummy!', 'A beetle. A big shiny one. He\'s called Sir.'] },
    { if: { band: 'school' }, text: ['It\'s a common frog. Rana. The storyteller told us. Isn\'t he handsome?'] },
  ]);
  lines('child.frog.name', [
    { text: ['Gandalf. After you.', 'Mister Hoppington.', 'Pudding. He looks like a pudding.', 'Bilbo. Because he likes going out and coming back.'] },
    { if: { childSib: has }, text: ['{ChildSib}. Because he\'s green and grumpy. Don\'t tell {childSib}.'] },
    { if: { childTemper: 'ornery' }, text: ['He doesn\'t have a name. He\'s a frog. Frogs don\'t care.'] },
  ]);
  lines('child.frog.keep', [
    { text: ['Can I keep him? Can I? I\'ll feed him flies.', 'I\'m going to keep him in my room. Under the bed. Nobody looks there.', 'He likes me. Look. He\'s not even trying to get out. Much.'] },
    { if: { childParentWord: has }, text: ['{ChildParentWord} won\'t let me keep him. Could you tell {childParentWord} it\'s wizard business?'] },
  ]);
  lines('child.frog.bucket', [
    { text: ['One night! With a stone! He\'ll love it!', 'I\'ll put a leaf in too. For a blanket.', 'Deal! And tomorrow he goes home. Probably.'] },
  ]);
  lines('child.frog.pond', [
    { text: ['...All right. But I\'m going to visit him.', 'Fine. He was getting my pocket wet anyway.', 'I\'ll take him back. He\'s probably got a mum.'] },
    { if: { childTemper: 'gloomy' }, text: ['Everything I like has to go home.'] },
    { if: { childTemper: 'ornery' }, text: ['Hmph. He liked my pocket. ...Fine.'] },
  ]);
  lines('child.frog.prince', [
    { text: ['A frog prince? A REAL one?', 'What happened to him?', 'Did he have a crown? A tiny crown?'] },
    { if: { band: 'school' }, text: ['That\'s a made-up story. ...Isn\'t it?'] },
  ]);
  lines('child.frog.kiss', [
    { text: ['EURGH! Kissing! Kissing a FROG!', 'Ugh! I\'m not kissing mine. Not even if he\'s a king.', 'Hee hee! Serves him right for being rude.'] },
  ]);

  // =====================================================================================
  // The cat or dog at home
  // =====================================================================================
  addThread({
    id: 'child.pet', label: (F) => (F.childPetName ? `How's ${F.childPetName}?` : 'Any pets at home?'), weight: 1.3, cool: 3,
    when: (F) => kid(F) && !!F.childPetName,
    open: { ask: 'child.pet.open' },
    beats: {
      start: { line: 'child.pet.start', go: [
        { ap: 'ask', say: 'And what does {childPetName} get up to all day?', to: 'day' },
        { ap: 'jest', say: 'I\'ve heard {childPetName} is the real head of the household.', to: 'boss' },
        { ap: 'warm', say: 'Who named {childPetName}?', to: 'named' },
      ] },
      day: { line: 'child.pet.day', go: [
        { ap: 'ask', say: 'And does {childPetName} sleep on your bed?', to: 'bed' },
        { ap: 'tale', say: 'I knew a cat once who could talk. He only ever said rude things.', to: 'tale', need: { if: { childPetKind: 'cat' } } },
        { ap: 'tale', say: 'I knew a dog once who could find a lost hobbit in a snowdrift.', to: 'tale', need: { if: { childPetKind: 'dog' } } },
        { ap: 'warm', say: 'A good life, that.', to: 'end' },
      ] },
      boss: { line: 'child.pet.boss', go: [
        { ap: 'jest', say: 'Then I must pay my respects. Does {childPetName} take tea?', to: 'tea' },
        { ap: 'ask', say: 'And who\'s second in charge?', to: 'second' },
      ] },
      tea: { line: 'child.pet.tea', fx: { joke: { k: 'child.pet.tea', t: '{ChildPetName} doesn\'t take tea. {ChildPetName} takes the cream.' } }, end: true },
      second: { line: 'child.pet.second', end: true },
      named: { line: 'child.pet.named', go: [
        { ap: 'warm', say: 'A fine name. It suits.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'ask', say: 'What else nearly got called?', to: 'nearly' },
      ] },
      nearly: { line: 'child.pet.nearly', end: true },
      bed: { line: 'child.pet.bed', go: [
        { ap: 'jest', say: 'I won\'t tell a soul. Wizards are excellent at not telling.', to: 'secret' },
        { ap: 'warm', say: 'Then you\'re never alone in the dark. That\'s a fine thing.', to: 'dark' },
      ] },
      secret: { line: 'child.pet.secret', fx: { confide: { k: 'child.pet.bed', t: '{ChildPetName} sleeps on {name}\'s bed, which is not allowed', secret: true } }, end: true },
      dark: { line: 'child.pet.dark', fx: { trust: 0.03 }, end: true },
      tale: { line: 'child.pet.tale', fx: { fond: 0.03, lean: 'rift' }, end: true },
    },
    end: { fond: 0.02, drive: { lonely: -0.05 } },
  });
  lines('child.pet.open', [
    { text: ['How\'s {childPetName}, {name}?', 'And how is the famous {childPetName}?', 'I hear you\'ve {childPetName} at home, {name}.'] },
    { if: { childPetKind: 'cat' }, text: ['Is {childPetName} still ruling your house, {name}?'] },
    { if: { childPetKind: 'dog' }, text: ['Where\'s {childPetName}? I thought that dog went everywhere you go.'] },
  ]);
  lines('child.pet.start', [
    { text: ['{ChildPetName}\'s the best. The best in the whole Shire.', '{ChildPetName}\'s brilliant. Do you want to know everything about {childPetName}? I know everything.'] },
    { if: { band: 'toddler' }, pri: 3, text: ['{ChildPetName}!', '*makes a noise that is probably a {childPetKind}*', 'Soft. {ChildPetName} soft.'] },
    { if: { band: 'toddler', childPetKind: 'dog' }, pri: 3, text: ['Woof! *licks own hand, to show you*'] },
    { if: { band: 'toddler', childPetKind: 'cat' }, pri: 3, text: ['Meow! {ChildPetName} meow.'] },
    { if: { childPetKind: 'cat' }, text: ['{ChildPetName} sat on my homework. It was the best thing that happened to it.', '{ChildPetName}\'s a {childPetCoat}. The prettiest {childPetCoat} there is.'] },
    { if: { childPetKind: 'dog' }, text: ['{ChildPetName} can sit! And lie down! And eat a whole pie! That last one wasn\'t meant.', '{ChildPetName}\'s a {childPetCoat}. The fastest {childPetCoat} in the Shire.'] },
    { if: { childPetMine: true }, pri: 1, text: ['{ChildPetName}\'s MINE. Well, everyone\'s. But mine most.'] },
    { if: { band: 'youth' }, text: ['{ChildPetName}? Daft animal. ...I love {childPetName} to bits. Don\'t tell anyone.'] },
    { if: { childTemper: 'shy' }, text: ['{ChildPetName}\'s my best friend. I tell {childPetName} things.'] },
    { if: { childTemper: 'ornery' }, text: ['{ChildPetName}\'s the only one in my house who listens.'] },
    { if: { childTemper: 'gloomy' }, text: ['{ChildPetName} is the only thing that\'s good today.'] },
  ]);
  lines('child.pet.day', [
    { text: ['Sleeps, mostly. Then eats. Then sleeps somewhere else.', 'Sits in the sun and looks at things. It\'s a lot of work.'] },
    { if: { childPetKind: 'cat' }, text: ['Hunts! Mice, mostly. Once a sausage. Off the table.', 'Sits on the step and judges everyone who goes past.', 'Goes off on business. Cat business. Nobody knows what.'] },
    { if: { childPetKind: 'dog' }, text: ['Follows everyone about. And barks at the post.', 'Chases rabbits. Never catches them. Doesn\'t mind.', 'Digs. Mostly in the garden. Mostly where the carrots were.'] },
    { if: { childPetKind: 'dog', childParentWord: has }, text: ['Follows {childParentWord} about. And barks at the post.', 'Lies across the door so {childParentWord} trips over. Every morning.'] },
    { if: { band: 'toddler' }, pri: 3, text: ['Sleep.', '*mimes a cat washing its face*', 'Run run run!'] },
    { if: { weather: 'rain' }, text: ['Hides under the table from the rain. Same as me.'] },
  ]);
  lines('child.pet.boss', [
    { text: ['Ha! It\'s true. {ChildPetName} gets the best chair.', 'Everyone does what {childPetName} wants. Even the grown-ups.', '{ChildPetName} would make a good Steward, honestly.'] },
    { if: { band: 'toddler' }, pri: 3, text: ['*nods very seriously*', 'Boss.'] },
    { if: { childPetKind: 'cat' }, text: ['Cats are always in charge. That\'s just science.'] },
  ]);
  lines('child.pet.tea', [
    { text: ['{ChildPetName} doesn\'t take tea. {ChildPetName} takes the cream. Off the top.', 'Only if there\'s a biscuit in it.', 'Ha! {ChildPetName} would knock the cup off the table.'] },
    { if: { band: 'toddler' }, pri: 3, text: ['*giggles* Tea!'] },
  ]);
  lines('child.pet.second', [
    { text: ['Me. Obviously.', 'Not me. I\'m about eighth. Below the broom.', 'The kettle. Then me.'] },
    { if: { childParentWord: has }, text: ['{ChildParentWord}. Then me. Then the kettle.'] },
    { if: { childSib: has }, text: ['Me. Not {childSib}. {ChildSib} thinks so but it\'s me.'] },
  ]);
  lines('child.pet.named', [
    { text: ['Me! I did!', 'I did. Everyone wanted something boring.'] },
    { if: { childPetMine: true }, text: ['Me! I named {childPetName}! I thought about it for a whole day.'] },
    { if: { childSib: has }, text: ['{ChildSib} did. I wanted something better. I\'m still cross.'] },
    { if: { band: 'toddler' }, pri: 3, text: ['Me!', '*points at self, then at the sky, for some reason*'] },
  ]);
  lines('child.pet.nearly', [
    { text: ['Dragonfang. Somebody said no.', 'Sir Fluffington the Third. There wasn\'t a first or second.', 'Gandalf. But that\'s you. It would get confusing.'] },
    { if: { childPetKind: 'cat' }, text: ['Mousebane. It\'s very fierce. {ChildPetName} isn\'t.'] },
  ]);
  lines('child.pet.bed', [
    { text: ['...Maybe. Don\'t tell.', 'Only when it\'s cold. And when it\'s warm. And always.', 'No! ...Yes. Shh.'] },
    { if: { band: 'toddler' }, pri: 3, text: ['*nods, finger to lips* Shhh.'] },
    { if: { childTemper: 'shy' }, text: ['...I can\'t sleep without {childPetName} now.'] },
  ]);
  lines('child.pet.secret', [
    { text: ['Thanks. Everyone thinks {childPetName} sleeps in the kitchen.', 'You\'re all right, for a wizard.'] },
    { if: { childParentWord: has }, text: ['Thanks. {ChildParentWord} thinks {childPetName} sleeps in the kitchen.'] },
  ]);
  lines('child.pet.dark', [
    { text: ['...Yeah. That\'s why. Don\'t tell anyone that\'s why.', 'Yes. {ChildPetName} keeps the bad dreams off.'] },
  ]);
  lines('child.pet.tale', [
    { text: ['Wow! Where was that? Was it far?', 'Tell me another one! About a different animal!', 'I want to go where you\'ve been. And take {childPetName}.'] },
  ]);

  // =====================================================================================
  // Brothers and sisters
  // =====================================================================================
  addThread({
    id: 'child.sibs', label: (F) => (F.childBaby && F.childNewBaby ? 'The new baby' : 'Brothers and sisters'), weight: 1.2, cool: 3,
    when: (F) => talker(F) && !!(F.childSib || F.childBaby),
    rel: (F) => (F.childNewBaby ? 2 : 1),
    open: { ask: 'child.sibs.open' },
    beats: {
      start: { line: 'child.sibs.start', go: [
        { ap: 'jest', say: 'Shall I turn them into something? I\'m told I do a good newt.', to: 'newt' },
        { ap: 'ask', say: 'And what\'s the worst thing about them?', to: 'worst' },
        { ap: 'warm', say: 'And the best thing about them?', to: 'best' },
      ] },
      newt: { line: 'child.sibs.newt', go: [
        { ap: 'jest', say: 'A small newt. Temporary. Back by teatime.', to: 'teatime' },
        { ap: 'warm', say: 'No? I thought not. You\'d miss them.', to: 'miss' },
      ] },
      teatime: { line: 'child.sibs.teatime', fx: { joke: { k: 'child.sibs.newt', t: 'The wizard offered to turn {childSib} into a newt. Back by teatime.' } }, end: true },
      worst: { line: 'child.sibs.worst', go: [
        { ap: 'advise', say: 'Have you told them it bothers you? Kindly?', to: 'told' },
        { ap: 'share', say: 'I have brothers of a sort. They\'re a nuisance too. And I\'d miss them.', to: 'wizbro', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'That\'s nothing. My brother turned my hat into a teapot once.', to: 'teapot' },
      ] },
      told: { line: 'child.sibs.told', fx: { respect: 0.02, lean: 'hill' }, end: true },
      teapot: { line: 'child.sibs.teapot', go: [
        { ap: 'tale', say: 'It whistled every time I sneezed. For a year.', to: 'end', fx: { fond: 0.03 } },
        { ap: 'warm', say: 'I forgave him. Eventually. Brothers are like that.', to: 'miss' },
      ] },
      wizbro: { line: 'child.sibs.wizbro', fx: { trust: 0.04, confide: { k: 'child.sibs.wizbro', t: 'The wizard has brothers of a sort, and he misses them' } }, end: true },
      best: { line: 'child.sibs.best', go: [
        { ap: 'ask', say: 'Have you ever told them that?', to: 'tellthem' },
        { ap: 'warm', say: 'Then you\'re lucky. Both of you.', to: 'miss' },
      ] },
      tellthem: { line: 'child.sibs.tellthem', fx: { remember: 'The wizard says I should tell {childSib} the nice thing.' }, end: true },
      miss: { line: 'child.sibs.miss', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.sibs.open', [
    { text: ['And how are your brothers and sisters, {name}?', 'Tell me about the rest of your lot, {name}.'] },
    { if: { childSib: has }, text: ['How\'s {childSib}, {name}?', 'And what\'s {childSib} been up to?'] },
    { if: { childNewBaby: true, childBaby: has }, text: ['I hear there\'s a new baby at yours, {name}! Little {childBaby}!'] },
  ]);
  lines('child.sibs.start', [
    { text: ['Ugh. Don\'t ask.', 'Annoying. Always annoying.', 'Fine. Loud. Fine.'] },
    { if: { childSib: has }, text: ['{ChildSib}? {ChildSib} took my best conker and said it was always theirs.', '{ChildSib}\'s all right. When asleep.', '{ChildSib} keeps copying me. Everything I do. EVERYTHING.'] },
    { if: { childSibLittle: has }, text: ['{ChildSibLittle} follows me EVERYWHERE. Like a duckling. A sticky duckling.', '{ChildSibLittle} chewed my best drawing. And then said sorry with a mouth full of it.'] },
    { if: { childSibBig: has }, text: ['{ChildSibBig} says I\'m too little for everything. I\'m NOT.', '{ChildSibBig} gets to do everything first. It\'s not fair. I was born second through no fault of my own.'] },
    { if: { childBaby: has }, text: ['There\'s a baby. {ChildBaby}. It just cries and does smells.', 'We\'ve got a baby now. {ChildBaby}. Everybody looks at it all day.'] },
    { if: { childNewBaby: true, childBaby: has }, pri: 1, text: ['There\'s a NEW BABY. {ChildBaby}. It\'s very small and very loud and nobody looks at me any more.', 'I\'ve got a baby {childBaby}! I held it! It looked at me like I was a turnip.'] },
    { if: { childSibCount: { min: 3 } }, text: ['There are SO many of us. I\'ve never had a bath first. Not once.'] },
    { if: { band: 'youth' }, text: ['Family. You know. They\'re a lot.', 'Honestly? I\'ll be glad of a hole of my own one day.'] },
    { if: { childTemper: 'shy' }, text: ['...They\'re loud. I\'m not. That\'s how it is.'] },
    { if: { childTemper: 'cheerful' }, text: ['Brilliant! Annoying, but brilliant! We build forts.'] },
    { if: { childTemper: 'ornery' }, text: ['If you\'re here to tell me to share, I already did. Once.'] },
  ]);
  lines('child.sibs.newt', [
    { text: ['YES. ...No. Maybe. How long for?', 'Could you? Really? Just for an afternoon?', 'Ha! Do a toad. A warty one.'] },
    { if: { childTemper: 'cheerful' }, text: ['Hee! A newt! With little shoes on!'] },
    { if: { childTemper: 'ornery' }, text: ['A slug. Do a slug.'] },
    { if: { band: 'youth' }, text: ['Tempting. Very tempting. ...No.'] },
    { if: { childTemper: 'shy' }, text: ['No! ...I mean. No. I\'d be lonely.'] },
  ]);
  lines('child.sibs.teatime', [
    { text: ['Back by teatime. ...All right then, NO. But it\'s nice to know.', 'Ha! I\'m telling them you said that. They\'ll be ever so good now.'] },
    { if: { childSib: has }, text: ['Ha! I\'m telling {childSib} you said that. {ChildSib} will be ever so good now.'] },
  ]);
  lines('child.sibs.worst', [
    { text: ['They tell on me. Every time. Even for things I haven\'t done YET.', 'They eat the last of everything. The last biscuit. The last scone. The last ANYTHING.', 'They get away with everything. I get told off for breathing.'] },
    { if: { childSibLittle: has }, text: ['{ChildSibLittle} gets away with everything because {childSibLittle}\'s "only little."', 'Everyone says I have to look after {childSibLittle}. Nobody looks after ME.'] },
    { if: { childSibBig: has }, text: ['{ChildSibBig} bosses me about. Then says I\'m the bossy one.', 'I get all {childSibBig}\'s old clothes. My best waistcoat has someone else\'s name in it.'] },
    { if: { childBaby: has }, text: ['The baby wakes up the whole house. Every night. At the worst bit of my dream.'] },
    { if: { band: 'youth' }, text: ['No privacy. None. I wrote something in a book and it got READ OUT.'] },
    { if: { childTemper: 'gloomy' }, text: ['Everyone likes them better. Everyone.'] },
  ]);
  lines('child.sibs.told', [
    { text: ['Kindly? That\'s hard. ...I could try kindly.', 'I\'ll try. If they start it I\'m not being kind though.', 'Hm. Maybe. With a biscuit. Biscuits help.'] },
    { if: { childTemper: 'ornery' }, text: ['Kindly. Hmph. Fine. Kindly-ish.'] },
    { if: { band: 'youth' }, text: ['...You\'re probably right. Don\'t look so pleased about it.'] },
  ]);
  lines('child.sibs.teapot', [
    { text: ['A TEAPOT? Your HAT?', 'What did you do back? Tell me what you did back.', 'Hee! Did it pour?'] },
  ]);
  lines('child.sibs.wizbro', [
    { text: ['Wizards have brothers? ...Where are they?', 'Do you miss them? You sound like you miss them.', 'Oh. ...I\'d miss mine. Don\'t tell them.'] },
  ]);
  lines('child.sibs.best', [
    { text: ['...They\'re there. At night. When it\'s dark.', 'When I\'m sad they give me their pudding. Sometimes.', 'They stick up for me. When the big ones are mean.'] },
    { if: { childSibLittle: has }, text: ['{ChildSibLittle} thinks I\'m the best person in the whole world. Which is right, obviously.'] },
    { if: { childSibBig: has }, text: ['{ChildSibBig} taught me to whistle. And to skim stones. And a rude word.'] },
    { if: { childBaby: has }, text: ['The baby holds my finger. Really tight. Like it knows me.'] },
    { if: { childTemper: 'ornery' }, text: ['Hmph. ...They\'re useful in a snowball fight.'] },
  ]);
  lines('child.sibs.tellthem', [
    { text: ['NO. Never. They\'d be unbearable.', '...Maybe on their birthday.', 'I could write it down and leave it on their pillow. And run.'] },
    { if: { band: 'youth' }, text: ['Some things are better left unsaid. ...I might, though.'] },
  ]);
  lines('child.sibs.miss', [
    { text: ['...Yeah. I would. Don\'t tell them.', 'I suppose. A bit. A very small bit.', 'Ugh. Fine. Yes.'] },
    { if: { childTemper: 'cheerful' }, text: ['I would! I\'d miss them loads! I\'m going to go and annoy them now.'] },
  ]);

  // =====================================================================================
  // Being told off
  // =====================================================================================
  addThread({
    id: 'child.toldoff', label: 'In trouble, are we?', weight: 1, cool: 3,
    when: (F) => talker(F),
    rel: (F) => (F.childTantrum || F.childTutted ? 3 : F.mood === 'low' || F.mood === 'miserable' ? 1.5 : 0.5),
    open: { ask: 'child.toldoff.open' },
    beats: {
      start: { line: 'child.toldoff.start', go: [
        { ap: 'ask', say: 'What happened?', to: 'what' },
        { ap: 'jest', say: 'Was it you? It\'s usually you, I find.', to: 'usually' },
        { ap: 'comfort', say: 'Come here. Sit by me a while.', to: 'sit' },
      ] },
      what: { line: 'child.toldoff.what', go: [
        { ap: 'ask', say: 'And was it your fault? Even a little?', to: 'fault' },
        { ap: 'jest', say: 'That sounds like an honest mistake. A very messy one.', to: 'messy' },
        { ap: 'listen', say: '*You wait for the rest of it.*', label: 'Wait for the rest', to: 'rest' },
      ] },
      rest: { line: 'child.toldoff.rest', go: [
        { ap: 'advise', say: 'Then say sorry. Properly. It\'s quicker than sulking.', to: 'sorry' },
        { ap: 'comfort', say: 'You\'re not a bad hobbit. You had a bad afternoon.', to: 'notbad' },
      ] },
      usually: { line: 'child.toldoff.usually', go: [
        { ap: 'ask', say: 'Go on. What did you do?', to: 'what' },
        { ap: 'warm', say: 'I\'m teasing. Tell me.', to: 'what' },
      ] },
      sit: { line: 'child.toldoff.sit', fx: { drive: { lonely: -0.1 } }, go: [
        { ap: 'listen', say: '*You say nothing, and let them say it when they\'re ready.*', label: 'Say nothing', to: 'rest' },
        { ap: 'tale', say: 'Shall I tell you about the time I got told off by an elf-lord?', to: 'elf' },
      ] },
      elf: { line: 'child.toldoff.elf', go: [
        { ap: 'tale', say: 'I set fire to his eyebrows. By accident. Mostly.', to: 'eyebrows' },
        { ap: 'advise', say: 'And I said sorry, and he forgave me, and we\'ve been friends for an age.', to: 'sorry' },
      ] },
      eyebrows: { line: 'child.toldoff.eyebrows', fx: { fond: 0.03, joke: { k: 'child.toldoff.elf', t: 'The wizard once set fire to an elf-lord\'s eyebrows.' } }, go: [
        { ap: 'advise', say: 'And then I said sorry. That\'s the important part.', to: 'sorry' },
        { ap: 'jest', say: 'They grew back. Bushier. He thanked me in the end.', to: 'end' },
      ] },
      fault: { line: 'child.toldoff.fault', go: [
        { ap: 'advise', say: 'Then go and say so. It takes the sting out.', to: 'sorry' },
        { ap: 'warm', say: 'Owning up is the hardest bit. You\'ve done it.', to: 'owned' },
      ] },
      messy: { line: 'child.toldoff.messy', fx: { fond: 0.02 }, go: [
        { ap: 'advise', say: 'Offer to clean it up. Before anyone asks.', to: 'sorry' },
        { ap: 'jest', say: 'Next time, do it where nobody can see.', to: 'bad' },
      ] },
      bad: { line: 'child.toldoff.bad', fx: { respect: -0.02, fond: 0.02 }, end: true },
      sorry: { line: 'child.toldoff.sorry', fx: { respect: 0.03, lean: 'hill', run: (T, v) => { if (typeof unfeel === 'function') { unfeel(v, 'tantrum'); unfeel(v, 'tutted'); } } }, end: true },
      notbad: { line: 'child.toldoff.notbad', fx: { trust: 0.04, drive: { lonely: -0.1 } }, end: true },
      owned: { line: 'child.toldoff.owned', fx: { trust: 0.03, respect: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.toldoff.open', [
    { text: ['You look like a hobbit who\'s been told off, {name}.', 'That\'s a long face, {name}. In trouble, are we?', 'Who\'s been cross with you, {name}?'] },
    { if: { childTantrum: true }, text: ['I heard some shouting, {name}. Was that you?'] },
  ]);
  lines('child.toldoff.start', [
    { text: ['I got told off. And it wasn\'t even fair.', 'Everyone\'s cross with me. Everyone.', 'I\'m not allowed out after supper for a WEEK.'] },
    { if: { mood: 'merry' }, text: ['Me? In trouble? Never. ...Not today, anyway.', 'Not yet! It\'s still early.'] },
    { if: { childTantrum: true }, pri: 1, text: ['I had a tantrum. A big one. In the lane. Everyone saw.', 'I shouted. And I kicked the door. And now my toe hurts AND I\'m in trouble.'] },
    { if: { childTutted: true }, pri: 1, text: ['Someone tutted at me. A big tut. From the sky, it felt like.'] },
    { if: { band: 'youth' }, text: ['It\'s fine. They just don\'t understand. Nobody understands.', 'I\'m grounded. At my age. It\'s humiliating.'] },
    { if: { childTemper: 'shy' }, text: ['...I broke something. I didn\'t mean to.'] },
    { if: { childTemper: 'ornery' }, text: ['It wasn\'t my fault. It\'s never my fault. It\'s just ALWAYS me.'] },
    { if: { childTemper: 'cheerful' }, text: ['A bit! But it was worth it. Mostly worth it.'] },
    { if: { childTemper: 'gloomy' }, text: ['Everything I do is wrong.', 'I\'m the worst hobbit in Thistledown. Everyone says.'] },
    { if: { childParentWord: has }, text: ['{ChildParentWord} used my whole name. My WHOLE name.'] },
  ]);
  lines('child.toldoff.what', [
    { text: ['I was only seeing if the hens could fly. They can\'t. Not really.', 'I ate the pie. Some of the pie. It was a test pie, I thought.', 'I painted the cat. Only a bit. Only blue.'] },
    { if: { childPetName: has, childPetKind: 'cat' }, text: ['I tried to give {childPetName} a bath. {childPetName} did NOT want a bath. Nor did the curtains.'] },
    { if: { childSib: has }, text: ['{ChildSib} started it! I just... finished it.', 'I hid {childSib}\'s boots. In the well. Not ON purpose. On a bit of purpose.'] },
    { if: { season: 'winter' }, text: ['I snowballed the miller. By accident. Four times.'] },
    { if: { season: 'autumn' }, text: ['I climbed the apple tree. And fell out of the apple tree. Into the pigs.'] },
    { if: { season: 'spring' }, text: ['I brought frogspawn in. In the teapot. Nobody checked before pouring.'] },
    { if: { season: 'summer' }, text: ['I built a dam in the stream. It worked. It worked too well. Into the garden.'] },
    { if: { was: 'rift_gawk' }, text: ['I went too close to the rift. I only wanted to see. It was humming at me.'] },
    { if: { riftWays: true }, text: ['I took apart the kettle to see how it worked. It doesn\'t work now.'] },
    { if: { band: 'youth' }, text: ['I stayed out late. At the river. With friends. It\'s not a crime.', 'I was rude at supper. A bit. Someone was rude first.'] },
  ]);
  lines('child.toldoff.rest', [
    { text: ['...And then I said a word. A bad word. I heard it at the Badger.', '...And then I didn\'t say sorry. Because I\'m stubborn.', '...And it was a bit my fault. A bit. Most of it.'] },
    { if: { childParentWord: has }, text: ['...And then I didn\'t say sorry. {ChildParentWord} says I get my stubbornness from {childParentWord}.'] },
    { if: { childTemper: 'gloomy' }, text: ['...And now everyone thinks I\'m bad. Maybe I am.'] },
    { if: { childTemper: 'shy' }, text: ['...I hid in the coal-hole after. For hours. Nobody noticed. That was worse.'] },
  ]);
  lines('child.toldoff.usually', [
    { text: ['It is NOT usually me!', 'Hey! ...It is usually me.', 'That\'s what everyone says. It\'s a conspiracy.'] },
    { if: { childTemper: 'ornery' }, text: ['Don\'t you start as well.'] },
    { if: { childTemper: 'cheerful' }, text: ['Hee. Yes. It usually is.'] },
  ]);
  lines('child.toldoff.sit', [
    { text: ['*sits, and leans a bit on your arm*', '*sits. Kicks heels against the wall. Sniffs once.*', '...All right.'] },
    { if: { band: 'youth' }, text: ['*sits, not too close, arms folded*'] },
  ]);
  lines('child.toldoff.elf', [
    { text: ['An ELF? A real elf told YOU off?', 'Wizards get told off? Who by?', 'What did you DO?'] },
  ]);
  lines('child.toldoff.eyebrows', [
    { text: ['Hahaha! Did they go all frizzly?', 'His EYEBROWS? Did he look like a burnt sausage?', 'You\'re worse than me!'] },
  ]);
  lines('child.toldoff.fault', [
    { text: ['...Maybe. A little.', 'A bit. Most of it. All right, all of it.', 'No! ...Yes. A bit.'] },
    { if: { childTemper: 'ornery' }, text: ['Maybe five percent. Ten. Fine, half.'] },
    { if: { childTemper: 'shy' }, text: ['*nods, very small*'] },
  ]);
  lines('child.toldoff.messy', [
    { text: ['VERY messy. There\'s still jam on the ceiling.', 'It was really messy! You should have seen it!'] },
  ]);
  lines('child.toldoff.bad', [
    { text: ['Hee! You\'re not supposed to say that! You\'re a grown-up!', 'That\'s terrible advice. I love it.', 'I\'m telling on you. ...No I\'m not.'] },
    { if: { childParentWord: has }, text: ['I\'m telling {childParentWord} you said that. ...No I\'m not.'] },
  ]);
  lines('child.toldoff.sorry', [
    { text: ['...All right. I\'ll go and say sorry. But I\'m not saying it nicely.', 'Fine. I\'ll say sorry. And then can I go out again?', 'Sorry is a hard word. I\'ll say it anyway.'] },
    { if: { childTemper: 'cheerful' }, text: ['Right! Sorry! I\'ll go and do it now! Before I forget!'] },
    { if: { childTemper: 'ornery' }, text: ['...Hmph. All right. Quickly, though. Before anyone sees.'] },
    { if: { band: 'youth' }, text: ['...You\'re right. I\'ll go and talk to them.'] },
  ]);
  lines('child.toldoff.notbad', [
    { text: ['...You think so?', 'A bad afternoon. Yes. That\'s what it was.', '*wipes nose on sleeve* Thanks.'] },
    { if: { childTemper: 'gloomy' }, text: ['...Nobody ever says that. Thank you.'] },
  ]);
  lines('child.toldoff.owned', [
    { text: ['It was hard. It still is a bit.', 'I feel better. Is that how it\'s meant to work?'] },
  ]);

  // =====================================================================================
  // Afraid of the dark (and what's in it)
  // =====================================================================================
  addThread({
    id: 'child.dark', label: 'Afraid of anything?', reveals: 'child.fear', weight: 1.1, cool: 4,
    when: (F) => talker(F) && !F.childTween,
    rel: (F) => (F.hour === 'evening' || F.hour === 'night' || F.childRiftOpen ? 1.6 : 0.9),
    open: { ask: 'child.dark.open' },
    beats: {
      start: { line: 'child.dark.start', fx: { learn: ['child.fear', '{Name} is frightened of the dark, though {they} won\'t say so to everyone'] }, go: [
        { ap: 'ask', say: 'What do you think is in it?', to: 'what' },
        { ap: 'jest', say: 'The dark? It\'s only the day with its eyes shut.', to: 'eyes' },
        { ap: 'comfort', say: 'Everybody is, a little. Even wizards.', to: 'wizards' },
      ] },
      what: { line: 'child.dark.what', go: [
        { ap: 'tale', say: 'Trolls? Trolls are frightened of the morning. Let me tell you why.', to: 'trolls' },
        { ap: 'jest', say: 'Trolls are far too big for a hobbit-hole. They\'d get stuck in the round door.', to: 'stuck' },
        { ap: 'advise', say: 'Leave a lamp lit. A small one. Light keeps a lot of things away.', to: 'lamp' },
      ] },
      eyes: { line: 'child.dark.eyes', go: [
        { ap: 'warm', say: 'And it opens them again every morning. Without fail.', to: 'morning' },
        { ap: 'ask', say: 'What is it, really? The worst part?', to: 'what' },
      ] },
      wizards: { line: 'child.dark.wizards', go: [
        { ap: 'share', say: 'I was lost under a mountain once, in the black. I sang to myself. Badly.', to: 'sang' },
        { ap: 'advise', say: 'So I carry a light. You could carry one too.', to: 'lamp' },
      ] },
      sang: { line: 'child.dark.sang', fx: { trust: 0.04, confide: { k: 'child.dark.sang', t: 'The wizard was frightened, once, under a mountain, and sang to himself' } }, go: [
        { ap: 'warm', say: 'You try it, next time. A song makes the dark smaller.', to: 'song' },
        { ap: 'jest', say: 'The goblins complained about the singing. That\'s how I got out.', to: 'goblins' },
      ] },
      song: { line: 'child.dark.song', fx: { lean: 'hill', remember: 'The wizard says a song makes the dark smaller.' }, end: true },
      goblins: { line: 'child.dark.goblins', fx: { fond: 0.03, joke: { k: 'child.dark.goblins', t: 'The goblins let the wizard go to stop him singing.' } }, end: true },
      trolls: { line: 'child.dark.trolls', go: [
        { ap: 'tale', say: 'Three of them, arguing about supper, till the sun came up and turned them to stone.', to: 'stone', fx: { lean: 'rift' } },
        { ap: 'warm', say: 'And there are no trolls in Thistledown. I\'d know. I checked.', to: 'checked' },
      ] },
      stone: { line: 'child.dark.stone', fx: { fond: 0.03, remember: 'The wizard told me trolls turn to stone in the sun.' }, end: true },
      checked: { line: 'child.dark.checked', fx: { trust: 0.03 }, end: true },
      stuck: { line: 'child.dark.stuck', fx: { fond: 0.02 }, end: true },
      lamp: { line: 'child.dark.lamp', go: [
        { ap: 'advise', say: 'A rushlight on the sill. The old way. It has kept hobbits safe for ages.', to: 'rush', fx: { lean: 'hill' } },
        { ap: 'advise', say: 'Or ask {childRiftName} for one of those little lights that never go out.', to: 'neon', need: { if: { childRiftName: has } }, fx: { lean: 'rift' } },
        { ap: 'warm', say: 'Or leave your door open a crack, to the kitchen fire.', to: 'morning' },
      ] },
      rush: { line: 'child.dark.rush', fx: { respect: 0.02 }, end: true },
      neon: { line: 'child.dark.neon', fx: { respect: 0.02, remember: 'The wizard said I could have a rift-light for the dark.' }, end: true },
      morning: { line: 'child.dark.morning', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.02, trust: 0.02 },
  });
  lines('child.dark.open', [
    { text: ['Are you afraid of anything, {name}?', 'What frightens you, {name}? Everybody has something.', 'Tell me, {name}. What do you think lives in the dark?'] },
    { if: { hour: ['evening', 'night'] }, text: ['Getting dark, {name}. Do you mind the dark?'] },
    { if: { childRiftOpen: true }, text: ['That rift\'s bright tonight, {name}. Does it frighten you?'] },
  ]);
  lines('child.dark.start', [
    { text: ['No. ...Maybe the dark. A bit. When the fire goes out.', 'Nothing! ...The dark. And spiders. Mostly the dark.', 'Don\'t tell anyone. The dark. Under the bed, mainly.'] },
    { if: { band: 'young' }, text: ['The dark has eyes. I\'ve seen them. They blink.', 'There\'s something under my bed. It breathes when I breathe.'] },
    { if: { band: 'school' }, text: ['Not the dark. Obviously. What\'s IN the dark. That\'s different.', 'Trolls. I know there aren\'t any. But if there were.'] },
    { if: { band: 'youth' }, text: ['I\'m not scared of anything. ...The rifts, maybe. When they hum.', 'Afraid? Me? ...Not of the dark. Of not knowing what I\'ll be.'] },
    { if: { childTemper: 'shy' }, text: ['...Lots of things. The dark most.', '*whispers* The dark.'] },
    { if: { childTemper: 'ornery' }, text: ['I\'m not scared of anything. The dark\'s scared of ME.'] },
    { if: { childTemper: 'curious' }, text: ['The dark! But I want to know what\'s in it. That\'s the problem.'] },
    { if: { childTemper: 'gloomy' }, text: ['The dark. And being alone in it. And everything, really.'] },
    { if: { childRiftStage: { min: 1 } }, text: ['The sky tearing. It did it at teatime once. What if it does it at bedtime?'] },
    { if: { childRiftOpen: true }, pri: 1, text: ['The rift. It hums at night. It sounds like it\'s saying my name.'] },
    { if: { rift: true }, pri: 1, text: ['The dark here is SO dark. Back home it never got dark. Ever.'] },
  ]);
  lines('child.dark.what', [
    { text: ['Trolls. Big ones. With turnip noses.', 'Goblins. Or a wolf. Or just... a shape.', 'I don\'t know. That\'s what\'s scary.'] },
    { if: { band: 'young' }, text: ['A troll that eats toes. It only eats toes. So I keep my feet in.', 'Bogles. Somebody said bogles live in the coal-hole.'] },
    { if: { band: 'young', childSib: has }, text: ['Bogles. {ChildSib} says bogles live in the coal-hole. {ChildSib} would know. {ChildSib} is one.'] },
    { if: { childTale: has }, text: ['Since you told the tale {childTale}, I keep thinking about it. In the dark.'] },
    { if: { childRiftStage: { min: 2 } }, text: ['Things from the rift. Not the rift-folk. Other things. Things that didn\'t come yet.'] },
    { if: { childTemper: 'curious' }, text: ['I think it\'s probably moths. Big moths. That\'s still scary.'] },
  ]);
  lines('child.dark.eyes', [
    { text: ['The day with its eyes shut? ...I like that.', 'Then who\'s looking at me, if its eyes are shut?', 'Ha. That\'s silly. ...Say it again?'] },
    { if: { band: 'youth' }, text: ['That\'s a nice way of putting it. I might steal it.'] },
  ]);
  lines('child.dark.wizards', [
    { text: ['Even wizards? Really?', 'You\'re not scared of anything! You\'re a wizard!', 'What are YOU scared of?'] },
    { if: { childTemper: 'curious' }, text: ['What does a wizard\'s dark look like? Is it darker?'] },
  ]);
  lines('child.dark.sang', [
    { text: ['You sang? What did you sing?', 'Under a MOUNTAIN? In the black?', 'Were you really scared? Like, really?'] },
    { if: { childTemper: 'shy' }, text: ['...I sing too. Under the blankets. Very quietly.'] },
  ]);
  lines('child.dark.song', [
    { text: ['I know one! The one about the willow lamp.', 'A song. I could do that. Quietly.', 'Will you teach me one? A brave one?'] },
    { if: { rift: true }, text: ['I know the Low Battery Blues. Is that a brave song? It\'s a sad one.'] },
  ]);
  lines('child.dark.goblins', [
    { text: ['HA! You must be really bad at singing!', 'That\'s the best escape ever!', 'I\'m going to sing at the dark. Loud. It\'ll run off.'] },
  ]);
  lines('child.dark.trolls', [
    { text: ['Frightened of the MORNING? Why?', 'Go on. Tell it.', 'Is this a true story? Is it?'] },
  ]);
  lines('child.dark.stone', [
    { text: ['To STONE? Are they still there?', 'So if I see a troll I just have to wait till morning?', 'Ha! Stupid trolls. Should have had breakfast earlier.'] },
    { if: { band: 'school' }, text: ['So the sun\'s more powerful than a troll. That\'s actually quite comforting.'] },
  ]);
  lines('child.dark.checked', [
    { text: ['You checked? Even under the beds?', 'Promise?', 'All right. If you checked.'] },
    { if: { childTemper: 'curious' }, text: ['How do you check for trolls? Do you sniff?'] },
  ]);
  lines('child.dark.stuck', [
    { text: ['Ha! A troll stuck in a door! With its bottom out!', 'That\'s true. Our door\'s ever so round.', 'I\'d laugh. And then run.'] },
  ]);
  lines('child.dark.lamp', [
    { text: ['A lamp would help. If anyone let me.', 'A lamp would help. A little one.', 'But what if it goes out in the night?'] },
    { if: { childParentWord: has }, text: ['A lamp? {ChildParentWord} says lamps waste oil.'] },
    { if: { riftWays: true }, text: ['I\'ve got a blinker. It goes pink, then blue. It helps a bit.'] },
  ]);
  lines('child.dark.rush', [
    { text: ['Like Gran\'s? She always has one on the sill.', 'A rushlight. All right. That\'s what hobbits do.', 'I\'ll ask. A small one. A brave one.'] },
  ]);
  lines('child.dark.neon', [
    { text: ['One of those?! They\'re pink! I\'d have a PINK room!', 'Will they give me one? Really?', 'A light that never goes out. Never ever. Wow.'] },
  ]);
  lines('child.dark.morning', [
    { text: ['...I like the morning. The morning always comes.', 'All right. I\'ll try.', 'The fire\'s nice. I like hearing it.'] },
    { if: { childTemper: 'gloomy' }, text: ['...It does come. Every time. I\'d forgotten that.'] },
  ]);
  // =====================================================================================
  // More ways to say it: tempers, ages and the older youths
  // =====================================================================================
  lines('child.games.rules', [
    { if: { childTemper: 'shy' }, text: ['You hide. That\'s all. You hide, and you wait, and nobody finds you.', 'It\'s easy. I can show you better than say it.'] },
    { if: { childTemper: 'ornery' }, text: ['My rules or no rules. Those are the rules.', 'There ARE rules but everybody breaks them except me.'] },
    { if: { childTemper: 'cheerful' }, text: ['There\'s running, and shrieking, and more running! That\'s it! It\'s the best!'] },
    { if: { childTemper: 'gloomy' }, text: ['You run till you\'re caught. Then you\'re out. I\'m always out first.'] },
    { if: { rift: true }, text: ['You freeze when you\'re tagged and buzz like a dead lamp till someone unfreezes you. Bzzzz.'] },
  ]);
  lines('child.games.wins', [
    { if: { childTemper: 'curious' }, text: ['Depends how you count. I count differently. I win more my way.'] },
    { if: { childTemper: 'cheerful' }, text: ['Everyone! Sort of! It doesn\'t matter! It\'s fun!'] },
    { if: { childTemper: 'ornery' }, text: ['Me. And if anyone says different they\'re lying.'] },
    { if: { band: 'youth' }, text: ['Whoever\'s oldest. So, me. Finally.'] },
  ]);
  lines('child.games.cheat', [
    { if: { childTemper: 'shy' }, text: ['I wouldn\'t! ...I might have peeped. Once. In hide-and-seek.'] },
    { if: { childTemper: 'gloomy' }, text: ['Everyone always thinks it\'s me.'] },
  ]);
  lines('child.games.who', [
    { if: { childTemper: 'cheerful' }, text: ['Everybody! Anyone who\'s about! You, if you like!'] },
    { if: { childTemper: 'ornery' }, text: ['Whoever does what I say.'] },
    { if: { childTemper: 'curious' }, text: ['Anyone who\'ll try my new rules. That\'s not many people, actually.'] },
    { if: { band: 'youth' }, text: ['The river lot. We sit on the bridge and see who can spit furthest. It\'s very grown-up.'] },
  ]);
  lines('child.games.champ', [
    { if: { childTemper: 'cheerful' }, text: ['You were? Brilliant! We\'ll have a champion\'s match!'] },
    { if: { childTemper: 'shy' }, text: ['...Were you really? What was it like, being champion?'] },
  ]);
  lines('child.games.play', [
    { if: { childTemper: 'ornery' }, text: ['You can play. But I\'m captain. And you\'re on the losing side.'] },
    { if: { childTemper: 'cheerful' }, text: ['PLAY! Play play play! Come ON!'] },
    { if: { childTemper: 'curious' }, text: ['Will you? I want to see if wizards are good at hiding. You\'re very tall to hide.'] },
  ]);
  lines('child.games.played', [
    { if: { childTemper: 'curious' }, text: ['You hid behind a TREE. A thin tree. Your hat stuck out both sides.'] },
    { if: { childTemper: 'cheerful' }, text: ['That was the BEST! You fell over! You FELL OVER!'] },
    { if: { season: 'winter' }, text: ['I got you right in the beard! A snowball in the BEARD!'] },
  ]);
  lines('child.games.tale', [
    { if: { childTemper: 'cheerful' }, text: ['Ha! The Old Took cheated! I knew grown-ups cheated!'] },
    { if: { band: 'youth' }, text: ['A hundred and two and still playing. I like the sound of him.'] },
  ]);

  lines('child.frog.what', [
    { if: { childTemper: 'shy' }, text: ['*opens the pocket very slowly* ...This is Pebble. He\'s a frog.'] },
    { if: { childTemper: 'curious' }, text: ['A frog! Look at his throat go in and out! Why does it do that? Do you know?'] },
  ]);
  lines('child.frog.keep', [
    { if: { childTemper: 'gloomy' }, text: ['He\'s the only one who doesn\'t tell me off.'] },
    { if: { childTemper: 'curious' }, text: ['I want to see if he can learn his name. I\'ve been saying it a lot.'] },
  ]);
  lines('child.frog.prince', [
    { if: { childTemper: 'curious' }, text: ['How do you tell a frog prince from a frog frog? Is there a sign?'] },
  ]);

  lines('child.pet.start', [
    { if: { childTween: true }, pri: 1, text: ['{ChildPetName}? Still the best-tempered one in our house. Which isn\'t saying much.', '{ChildPetName}\'s getting on a bit now. Sleeps more. Don\'t we all.'] },
    { if: { childTemper: 'curious' }, text: ['{ChildPetName} knows things. I\'m sure {childPetName} knows things. The way {childPetName} looks at the door.'] },
    { if: { childTemper: 'cheerful' }, text: ['{ChildPetName}\'s brilliant! Brilliant brilliant brilliant!'] },
    { if: { rift: true }, text: ['{ChildPetName}\'s the first real animal I ever touched. Back home they were all clockwork.'] },
  ]);
  lines('child.pet.day', [
    { if: { childTween: true }, pri: 1, text: ['Mostly lies across the doorway being trodden on. It\'s a sort of trade.'] },
    { if: { season: 'winter' }, text: ['Sits as close to the fire as possible. Singed whiskers twice this week.'] },
    { if: { season: 'summer' }, text: ['Lies in the long grass where nobody can find {childPetName}. Except me. I always know.'] },
  ]);
  lines('child.pet.boss', [
    { if: { childTween: true }, pri: 1, text: ['Ha! True. We all just live in {childPetName}\'s house.'] },
  ]);
  lines('child.pet.named', [
    { if: { childTween: true }, pri: 1, text: ['I did, years ago. I was going through a pudding phase. It shows.'] },
  ]);
  lines('child.pet.bed', [
    { if: { childTween: true }, pri: 1, text: ['Every night. I\'m nearly grown and I still can\'t sleep without the weight on my feet.'] },
  ]);
  lines('child.pet.tale', [
    { if: { childTween: true }, pri: 1, text: ['I\'d like to see a place like that. With {childPetName} at my heels.'] },
  ]);

  lines('child.sibs.start', [
    { if: { childTween: true }, pri: 1, text: ['We\'re all getting too big for one hole. Somebody\'s going to have to marry out soon.', 'We get on better now. Mostly. We\'ve run out of things to fight about.'] },
    { if: { childTemper: 'curious' }, text: ['Did you know siblings share half the same stuff inside? I don\'t believe it. We\'re nothing alike.'] },
    { if: { childTemper: 'gloomy' }, text: ['They\'re fine. Everyone likes them more. That\'s fine too.'] },
  ]);
  lines('child.sibs.worst', [
    { if: { childTween: true }, pri: 1, text: ['They still tell embarrassing stories about me. At parties. To people I like.'] },
    { if: { childTemper: 'shy' }, text: ['They talk for me. I start to say something and they say it louder.'] },
    { if: { childTemper: 'cheerful' }, text: ['They snore! Like a pig in a barrel! Ha! It\'s quite funny actually.'] },
  ]);
  lines('child.sibs.best', [
    { if: { childTween: true }, pri: 1, text: ['They\'d fight anyone for me. They\'d never admit it. But they would.'] },
    { if: { childTemper: 'shy' }, text: ['...They never make me talk when I don\'t want to.'] },
    { if: { childTemper: 'cheerful' }, text: ['We laugh at the same things! Nobody else gets the jokes. Only us.'] },
  ]);
  lines('child.sibs.newt', [
    { if: { childTween: true }, pri: 1, text: ['Ha! I\'m too old to want that. ...What colour newt?'] },
  ]);
  lines('child.sibs.miss', [
    { if: { childTween: true }, pri: 1, text: ['I would. When they move out it\'ll be strange. Quiet. Awful.'] },
  ]);

  lines('child.toldoff.start', [
    { if: { childTween: true }, pri: 1, text: ['I\'m nearly grown and I still get told off like a little one. It\'s humiliating.', 'I\'m in disgrace. Apparently. For something I\'d do again.'] },
    { if: { childTemper: 'curious' }, text: ['I got told off for asking why. Then for asking why I got told off.'] },
    { if: { rift: true }, text: ['I got told off in hill-speak. I didn\'t understand half of it. I understood the tone.'] },
  ]);
  lines('child.toldoff.what', [
    { if: { childTween: true }, pri: 1, text: ['I came home after midnight. From the river. It was a nice night. That\'s not a crime.', 'I said I might not take up the family trade. At supper. In front of the uncles.'] },
    { if: { childTemper: 'shy' }, text: ['...I hid when I was meant to be helping. In the coal-hole. With a book.'] },
    { if: { childTemper: 'curious' }, text: ['I wanted to see what\'s inside a beehive. Now I know. Bees.'] },
    { if: { childTemper: 'cheerful' }, text: ['I taught the hens to come when I whistle. All of them. At five in the morning.'] },
  ]);
  lines('child.toldoff.usually', [
    { if: { childTween: true }, pri: 1, text: ['It used to be. I\'m reformed. Mostly.'] },
  ]);
  lines('child.toldoff.sorry', [
    { if: { childTween: true }, pri: 1, text: ['Properly. Yes. Like a grown-up. Ugh.', 'All right. I\'ll go and say it before supper. While they\'re still cross enough to be glad.'] },
    { if: { childTemper: 'shy' }, text: ['...I\'ll write it down. Sorry is easier written.'] },
    { if: { childTemper: 'gloomy' }, text: ['I\'ll say sorry. It won\'t help. But I\'ll say it.'] },
  ]);
  lines('child.toldoff.notbad', [
    { if: { childTween: true }, pri: 1, text: ['...Thanks. I needed someone to say that who isn\'t family.'] },
    { if: { childTemper: 'shy' }, text: ['*nods, and stops crying, mostly*'] },
  ]);
  lines('child.toldoff.elf', [
    { if: { childTween: true }, pri: 1, text: ['An elf-lord. Of course. You don\'t get told off by anyone ordinary.'] },
  ]);
  lines('child.toldoff.fault', [
    { if: { childTween: true }, pri: 1, text: ['...Yes. Mostly mine. Don\'t tell them I said.'] },
  ]);

  lines('child.dark.what', [
    { if: { childTemper: 'shy' }, text: ['Nothing. Everything. Something that\'s quiet and waits.'] },
    { if: { childTemper: 'ornery' }, text: ['Nothing. There\'s nothing. I just don\'t like it. Is that allowed?'] },
    { if: { childTemper: 'gloomy' }, text: ['Being forgotten. If I went out in the dark nobody would come looking.'] },
    { if: { band: 'youth' }, text: ['Not trolls. I\'m not six. ...Something like trolls, maybe.'] },
  ]);
  lines('child.dark.wizards', [
    { if: { childTemper: 'shy' }, text: ['...Really? Even you? Then it\'s all right that I am.'] },
    { if: { childTemper: 'ornery' }, text: ['You\'re just saying that so I feel better. ...It\'s working a bit.'] },
  ]);
  lines('child.dark.trolls', [
    { if: { childTemper: 'shy' }, text: ['*sits closer* ...Is it a scary one?'] },
    { if: { childTemper: 'curious' }, text: ['Trolls are scared of something? What? Tell me everything.'] },
  ]);
  lines('child.dark.stone', [
    { if: { childTemper: 'shy' }, text: ['...So morning always wins. Good.'] },
    { if: { childTemper: 'cheerful' }, text: ['Ha! Stone trolls! I\'m going to find them and sit on one!'] },
  ]);
  lines('child.dark.morning', [
    { if: { childTemper: 'shy' }, text: ['...I can hear the fire from my bed. If the door\'s open. I\'ll ask.'] },
    { if: { childTemper: 'ornery' }, text: ['Hmph. All right. A crack. A small one.'] },
  ]);
  lines('child.dark.song', [
    { if: { childTemper: 'shy' }, text: ['...Very quietly. So the dark doesn\'t hear me singing back.'] },
    { if: { childTemper: 'cheerful' }, text: ['I\'ll sing SO loud. The dark won\'t know what hit it.'] },
  ]);

  lines('child.tot.hello.got', [
    { if: { childTemper: 'cheerful' }, text: ['LOOK! *thrusts a fistful of daisies, roots and all, at your nose*'] },
    { if: { childTemper: 'curious' }, text: ['Dis? *holds out a beetle* Wassit?'] },
  ]);
  lines('child.tot.hello.mine', [
    { if: { childTemper: 'curious' }, text: ['Mine. *thinks* ...Yours have one?'] },
  ]);
  lines('child.tot.hello.who', [
    { if: { childTemper: 'ornery' }, text: ['Not telling.', '*points at you* You.'] },
    { if: { childTemper: 'curious' }, text: ['{Name}. Who you?'] },
  ]);
  lines('child.tot.show.start', [
    { if: { childTemper: 'cheerful' }, text: ['WIZZUD! LOOK! LOOK LOOK LOOK!'] },
    { if: { childTemper: 'ornery' }, text: ['*holds it out, then snatches it back, then holds it out again*'] },
    { if: { childTemper: 'curious' }, text: ['Wassit? *holds out something unidentifiable and slightly sticky*'] },
  ]);
  lines('child.tot.show.found', [
    { if: { childTemper: 'shy' }, text: ['*nods, very proud, very quiet*'] },
  ]);
  // =====================================================================================
  // Gran and Grandad
  // =====================================================================================
  addThread({
    id: 'child.gran', label: (F) => (F.childGranWord ? `How's your ${F.childGranWord.toLowerCase()}?` : 'Your grandparents'), weight: 1, cool: 4,
    when: (F) => talker(F) && !!F.childGran && !!F.childGranWord,
    open: { ask: 'child.gran.open' },
    beats: {
      start: { line: 'child.gran.start', go: [
        { ap: 'ask', say: 'And what stories does {childGran} tell?', to: 'stories' },
        { ap: 'jest', say: 'I knew {childGran} when {childGran} was your age. A terror.', to: 'terror' },
        { ap: 'warm', say: 'You\'re lucky to have {childGran}. Be sure to listen.', to: 'listen' },
      ] },
      stories: { line: 'child.gran.stories', go: [
        { ap: 'advise', say: 'Write them down. One day you\'ll be the one telling them.', to: 'write', fx: { lean: 'hill', remember: 'The wizard says I should write down {childGran}\'s stories.' } },
        { ap: 'ask', say: 'And do you believe them?', to: 'believe' },
      ] },
      believe: { line: 'child.gran.believe', go: [
        { ap: 'warm', say: 'The best stories are true in the ways that matter.', to: 'write', fx: { lean: 'hill' } },
        { ap: 'jest', say: 'Ask {childGran} about the time with the goose. Watch the face.', to: 'goose' },
      ] },
      goose: { line: 'child.gran.goose', fx: { fond: 0.03, joke: { k: 'child.gran.goose', t: 'Ask {childGran} about the time with the goose.' } }, end: true },
      write: { line: 'child.gran.write', fx: { respect: 0.02 }, end: true },
      terror: { line: 'child.gran.terror', go: [
        { ap: 'tale', say: 'Climbed the party tree to the very top and wouldn\'t come down till supper.', to: 'climb' },
        { ap: 'warm', say: 'Only teasing. Your {childGranWord} was a kind one. Still is.', to: 'listen' },
      ] },
      climb: { line: 'child.gran.climb', fx: { fond: 0.03, news: 'The wizard told {name} that {childGran} once climbed to the top of the party tree.' }, end: true },
      listen: { line: 'child.gran.listen', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('child.gran.open', [
    { text: ['How\'s your {childGranWord}, {name}?', 'And how is {childGran} keeping, {name}?', 'Seen your {childGranWord} lately, {name}?'] },
  ]);
  lines('child.gran.start', [
    { text: ['{ChildGranWord}\'s all right. {ChildGranWord} gives me humbugs when nobody\'s looking.', '{ChildGranWord} falls asleep in the chair and then says {childGranWord} wasn\'t asleep.', '{ChildGranWord} knows everything. Everything that happened ever. And says so.'] },
    { if: { childGranWord: 'Gran' }, text: ['Gran\'s the best. She makes the scones with the jam already in.', 'Gran pinches my cheeks. I\'m too old for it. I let her.'] },
    { if: { childGranWord: 'Grandad' }, text: ['Grandad\'s teaching me to whittle. I\'ve still got all my fingers. So far.', 'Grandad tells the same story every supper. I mouth along. He hasn\'t noticed.'] },
    { if: { band: 'young' }, text: ['{ChildGranWord} has a WHISTLE in {childGranWord}\'s nose! When {childGranWord} sleeps!'] },
    { if: { band: 'youth' }, text: ['{ChildGranWord}\'s slowing down. I sit with {childGranWord} more. Don\'t tell anyone.'] },
    { if: { childTemper: 'shy' }, text: ['...{ChildGranWord}\'s the only one who doesn\'t mind when I\'m quiet.'] },
    { if: { childTemper: 'ornery' }, text: ['{ChildGranWord} takes my side. Always. Even when I\'m wrong. That\'s how it should be.'] },
    { if: { childTemper: 'curious' }, text: ['{ChildGranWord} remembers before the rifts. Before the mill. Before everything!'] },
  ]);
  lines('child.gran.stories', [
    { text: ['About the old days. When the winters were worse and the puddings were better.', 'About when {childGranWord} was little and walked ten miles to the story circle. Uphill. Both ways.', 'About the old folk. Who married who, and who fell out over a pig.'] },
    { if: { childParentWord: has }, text: ['About my {childParentWord} being naughty. Those are the best ones.'] },
    { if: { childRiftStage: { min: 1 } }, text: ['{ChildGranWord} says the sky tore once before, long ago, and a tinker walked into it. Mungo something.'] },
  ]);
  lines('child.gran.believe', [
    { text: ['Some of them. Not the one about the forty-pound marrow.', 'All of them. Even the silly ones. Especially the silly ones.', 'I believe {childGranWord} believes them. That\'s nearly the same.'] },
  ]);
  lines('child.gran.goose', [
    { text: ['What goose? WHAT GOOSE? I\'m asking tonight!', 'Ha! There\'s a goose story? Nobody told me about a goose!', 'I\'m going to ask at supper. In front of everyone.'] },
  ]);
  lines('child.gran.write', [
    { text: ['Write them down. All right. In the back of my letters book.', 'One day I\'ll tell them. To my own little ones. Ugh. Strange thought.', 'True in the ways that matter. I like that.'] },
  ]);
  lines('child.gran.terror', [
    { text: ['{ChildGranWord}? A TERROR? What did {childGranWord} do?', 'You knew {childGranWord} when {childGranWord} was little? You\'re SO old.', 'No! {ChildGranWord} is ever so proper!'] },
  ]);
  lines('child.gran.climb', [
    { text: ['To the TOP? {ChildGranWord}? I\'m going to remind {childGranWord} every time I get told off.', 'Ha! And {childGranWord} told ME off for the apple tree!', 'I\'m going to do it too. Then we\'ll be even.'] },
  ]);
  lines('child.gran.listen', [
    { text: ['I do listen. Mostly. When there\'s cake.', 'I will. {ChildGranWord} won\'t be here forever. I know that.', 'Lucky. Yes. I am.'] },
  ]);
  // bright little ones, the rift-born, and the seasons
  lines('child.games.start', [
    { if: { register: 'bright' }, text: ['Chess. Well, chess with conkers. I invented the rules. The conker horses jump.', 'A memory game. You say a list and add one each go. I got to forty-one.'] },
    { if: { childPetKind: 'dog', childPetName: has }, text: ['Fetch! With {childPetName}! {ChildPetName} always wins. {ChildPetName} cheats with legs.'] },
    { if: { weather: 'rain' }, text: ['Puddle-jumping. Points for splash. Extra points if it goes on a grown-up.'] },
  ]);
  lines('child.games.rules', [
    { if: { register: 'bright' }, text: ['There\'s a points table. Two for a tag, five for a rescue, minus one for crying. I keep score.'] },
    { if: { season: 'spring' }, text: ['Catch, look, let go. That\'s the frog rule. The tadpole rule is just look.'] },
  ]);
  lines('child.games.who', [
    { if: { band: 'young' }, text: ['Everyone who can run! And the little ones who can\'t, they\'re the jail.'] },
    { if: { register: 'bright' }, text: ['Whoever understands the rules. That narrows it down a lot.'] },
  ]);
  lines('child.games.left', [
    { if: { band: 'young' }, text: ['The babies. They can\'t run. They just sit down.'] },
    { if: { register: 'bright' }, text: ['Nobody\'s left out. Some people opt out. That\'s different. ...Is it?'] },
  ]);
  lines('child.games.askin', [
    { if: { band: 'young' }, text: ['OK! Even the slow boy! He can be the dragon! Dragons don\'t need to be fast!'] },
    { if: { childTemper: 'gloomy' }, text: ['...If I ask, they might ask me back. All right.'] },
  ]);
  lines('child.games.gang', [
    { if: { childTemper: 'cheerful' }, text: ['The Lane Dragons! That\'s our name now! You named us! Sort of!'] },
    { if: { childTemper: 'shy' }, text: ['...They\'re nice. Mostly. I\'m at the edge of it.'] },
  ]);
  lines('child.games.corners', [
    { if: { band: 'young' }, text: ['Round CORNERS? Show me! Which corner? That one?'] },
  ]);
  lines('child.games.off', [
    { if: { childTemper: 'shy' }, text: ['...All right. I\'ll see who\'s about.'] },
    { if: { childTemper: 'ornery' }, text: ['Fine. They\'re all rubbish anyway. I\'ll win.'] },
  ]);
  lines('child.frog.start', [
    { if: { childTemper: 'cheerful' }, text: ['Guess what\'s in my pocket! Guess! You\'ll NEVER guess! It\'s a frog!'] },
    { if: { childTemper: 'curious' }, text: ['I\'ve found something and I don\'t know what it eats. You\'ll know.'] },
  ]);
  lines('child.frog.name', [
    { if: { childTemper: 'cheerful' }, text: ['Sir Hops-a-Lot the Brave! The Third!'] },
    { if: { register: 'bright' }, text: ['Bartholomew. He looks like a Bartholomew. It\'s the chin.'] },
  ]);
  lines('child.frog.pond', [
    { if: { childTemper: 'cheerful' }, text: ['All right! I\'ll take him home! And say hello to his family!'] },
    { if: { childTemper: 'curious' }, text: ['All right. But I\'m going to watch where he goes. For science.'] },
  ]);
  lines('child.frog.kiss', [
    { if: { childTemper: 'curious' }, text: ['Did anyone ever try? Just to check? Somebody should check.'] },
  ]);
  lines('child.pet.open', [
    { if: { childPetMine: true }, text: ['How\'s your {childPetKind}, {name}? I hear {childPetName} is yours especially.'] },
  ]);
  lines('child.pet.start', [
    { if: { register: 'bright' }, text: ['{ChildPetName} is very intelligent. I\'m teaching {childPetName} to count. We\'re on one.'] },
    { if: { band: 'young' }, text: ['{ChildPetName}! {ChildPetName} licked my face! All of it!'] },
  ]);
  lines('child.pet.day', [
    { if: { band: 'young' }, text: ['Chases its tail! Round and round and round! Then falls over!'] },
    { if: { childPetKind: 'cat', band: 'school', childParentWord: has }, text: ['Brings in mice and leaves them on {childParentWord}\'s slipper. It\'s a present. {ChildParentWord} doesn\'t see it that way.'] },
  ]);
  lines('child.pet.nearly', [
    { if: { childPetKind: 'dog' }, text: ['Thunderpaws. It\'s a good name. Nobody listens to me.'] },
    { if: { band: 'young' }, text: ['Doggy. Or Cat. Or Pudding Pudding.'] },
  ]);
  lines('child.pet.dark', [
    { if: { childPetKind: 'dog' }, text: ['{ChildPetName} would bark at anything that came. Anything. Even nothing.'] },
    { if: { childPetKind: 'cat' }, text: ['{ChildPetName} purrs. You can\'t be scared with a purr on your feet.'] },
  ]);
  lines('child.sibs.start', [
    { if: { band: 'young', childSib: has }, text: ['{ChildSib} is BIG and I am SMALL and it\'s NOT FAIR.'] },
    { if: { register: 'bright' }, text: ['My siblings and I have what Gran calls a lively relationship. We fight a lot.'] },
    { if: { rift: true }, text: ['We came through together. That makes you closer. Even when they\'re annoying. Which is always.'] },
  ]);
  lines('child.sibs.worst', [
    { if: { band: 'young' }, text: ['They say I\'m adopted! From the goats! I\'m NOT from the goats!'] },
    { if: { register: 'bright' }, text: ['They borrow things without asking. And return them broken. And deny it. With jam on their face.'] },
  ]);
  lines('child.sibs.best', [
    { if: { band: 'young' }, text: ['They let me sleep in their bed when there\'s thunder.'] },
  ]);
  lines('child.sibs.told', [
    { if: { band: 'young' }, text: ['Kindly? Like with a hug? EURGH. ...Maybe a small hug.'] },
    { if: { childTemper: 'shy' }, text: ['...I could leave a note. Notes are kind.'] },
  ]);
  lines('child.sibs.teapot', [
    { if: { childTemper: 'curious' }, text: ['How do you turn a hat into a teapot? Is it a spell or a trick? Teach me. For research.'] },
  ]);
  lines('child.toldoff.what', [
    { if: { band: 'young' }, text: ['I drew on the wall. A dragon. It was a GOOD dragon.', 'I put the cat in the bread bin. She wanted to go. She TOLD me.'] },
    { if: { register: 'bright', childParentWord: has }, text: ['I corrected {childParentWord}\'s sums. Out loud. In front of the miller.'] },
    { if: { childPetKind: 'dog', childPetName: has }, text: ['I let {childPetName} in with muddy feet. And then {childPetName} got on the bed. And then I did.'] },
  ]);
  lines('child.toldoff.sit', [
    { if: { childTemper: 'cheerful' }, text: ['*sits, swings legs, and is already half-forgotten why they were sad*'] },
    { if: { childTemper: 'ornery' }, text: ['*sits, arms folded, scowling at the horizon*'] },
  ]);
  lines('child.toldoff.messy', [
    { if: { band: 'young' }, text: ['SO messy! There was mud on the CAT!'] },
  ]);
  lines('child.toldoff.owned', [
    { if: { childTemper: 'shy' }, text: ['...It was easier than I thought. Telling you, I mean.'] },
  ]);
  lines('child.dark.start', [
    { if: { register: 'bright' }, text: ['Not the dark exactly. The not knowing. It\'s philosophically frightening.'] },
    { if: { childPetName: has }, text: ['The dark. Unless {childPetName}\'s on my bed. Then it\'s just dark.'] },
  ]);
  lines('child.dark.eyes', [
    { if: { childTemper: 'shy' }, text: ['...Then it\'s just sleeping. Sleeping things don\'t hurt you.'] },
    { if: { childTemper: 'curious' }, text: ['What does the day dream about, when its eyes are shut?'] },
  ]);
  lines('child.dark.checked', [
    { if: { childTemper: 'shy' }, text: ['...Even the coal-hole? You checked the coal-hole?'] },
  ]);
  lines('child.dark.neon', [
    { if: { childTemper: 'shy' }, text: ['...A little pink light. That never goes out. That would help. A lot.'] },
  ]);
  lines('child.tot.hello.start', [
    { if: { season: 'autumn' }, text: ['*holds up a conker as big as {their} fist*', 'Leaf! *shows you a leaf, then eats a bit*'] },
    { if: { hour: 'evening' }, text: ['*yawns* ...Hat.', '*rubs eyes with both fists*'] },
  ]);
  lines('child.tot.hello.giggle', [
    { if: { childPetName: has }, text: ['*giggles* {ChildPetName} do dat!'] },
  ]);
  lines('child.tot.hello.laugh', [
    { if: { childTemper: 'curious' }, text: ['*laughs, then stops, then laughs to see if it\'s still working*'] },
    { if: { childTemper: 'gloomy' }, text: ['*a hiccupy little laugh, the first today*'] },
  ]);
  lines('child.tot.hello.tired', [
    { if: { childTemper: 'shy' }, text: ['*leans on your boot and closes {their} eyes*'] },
    { if: { childTemper: 'cheerful' }, text: ['*yawns, waves, falls asleep standing up*'] },
  ]);
  lines('child.tot.hello.gentle', [
    { if: { childTemper: 'cheerful' }, text: ['*hugs your knee, very hard*'] },
    { if: { childTemper: 'ornery' }, text: ['*pats you twice, as if you are a dog that has been good*'] },
  ]);
  lines('child.gran.start', [
    { if: { childTemper: 'cheerful' }, text: ['{ChildGranWord}\'s brilliant! {ChildGranWord} lets me stay up and tells me rude songs!'] },
    { if: { childTemper: 'gloomy' }, text: ['{ChildGranWord} coughs a lot now. I don\'t like it.'] },
    { if: { rift: true }, text: ['{ChildGranWord} is the hill side of the family. {ChildGranWord} says I\'m "a bit of both" like it\'s a cake.'] },
  ]);
  lines('child.gran.listen', [
    { if: { childTemper: 'shy' }, text: ['*nods* ...I sit by {childGranWord}\'s chair. We don\'t talk much. It\'s nice.'] },
    { if: { band: 'youth' }, text: ['I know. I\'ve been sitting with {childGranWord} more. We play draughts. {ChildGranWord} cheats.'] },
  ]);
  lines('child.gran.stories', [
    { if: { childTemper: 'curious' }, text: ['About the Fell Winter. {ChildGranWord}\'s gran was THERE. With a pitchfork!'] },
    { if: { band: 'young' }, text: ['About a pig that could talk! {ChildGranWord} says it\'s true!'] },
  ]);
  // the smaller beats, given voices too
  lines('child.games.hat', [
    { if: { childTemper: 'curious' }, text: ['What else is in the hat? A list. I want a list.'] },
    { if: { childTemper: 'cheerful' }, text: ['A KNOWING hat! I want a knowing hat! For Yule!'] },
    { if: { band: 'young' }, text: ['*tries to look up into your hat from underneath*'] },
  ]);
  lines('child.games.comfort', [
    { if: { childTemper: 'shy' }, text: ['...It won\'t always be so. *says it to {them}self, to keep it*'] },
    { if: { band: 'young' }, text: ['*sniffs, and wipes {their} nose on your sleeve*'] },
  ]);
  lines('child.games.why', [
    { if: { childTemper: 'ornery' }, text: ['Because they\'re rubbish at it. ...And because nobody asks why.'] },
    { if: { childTemper: 'gloomy' }, text: ['Because I\'m me, I expect.'] },
  ]);
  lines('child.frog.dragon', [
    { if: { band: 'young' }, text: ['It IS a dragon! A little green one! It goes ribbit!'] },
  ]);
  lines('child.frog.bucket', [
    { if: { childTemper: 'curious' }, text: ['One night! I\'ll watch him all night. To see if frogs sleep.'] },
  ]);
  lines('child.pet.tea', [
    { if: { childPetKind: 'dog' }, text: ['Ha! {ChildPetName} would drink it out of the saucer and then knock it over.'] },
  ]);
  lines('child.pet.second', [
    { if: { childPetKind: 'dog' }, text: ['The cat next door. {ChildPetName}\'s scared of it.'] },
  ]);
  lines('child.pet.secret', [
    { if: { band: 'young' }, text: ['*finger on lips* Shh! Wizard secret!'] },
  ]);
  lines('child.sibs.wizbro', [
    { if: { childTemper: 'shy' }, text: ['...I\'m sorry you miss them. I\'d miss mine. I would.'] },
    { if: { childTemper: 'curious' }, text: ['Are they wizards too? Do they have hats? Are their hats bigger?'] },
  ]);
  lines('child.sibs.tellthem', [
    { if: { childTemper: 'shy' }, text: ['...I could tell them with a present. Presents say things.'] },
    { if: { childTemper: 'cheerful' }, text: ['I\'m going to tell them RIGHT NOW. And then run away.'] },
  ]);
  lines('child.toldoff.eyebrows', [
    { if: { childTemper: 'shy' }, text: ['*giggles, and then tries to stop, and giggles more*'] },
  ]);
  lines('child.toldoff.rest', [
    { if: { childTemper: 'ornery' }, text: ['...And then I slammed the door. It was a good slam. I regret it a bit.'] },
    { if: { childTemper: 'cheerful' }, text: ['...And then I laughed. Which made it worse. Much worse.'] },
  ]);
  lines('child.dark.rush', [
    { if: { childTemper: 'shy' }, text: ['...A little rushlight. I\'ll watch it till I fall asleep.'] },
  ]);
  lines('child.dark.goblins', [
    { if: { childTemper: 'shy' }, text: ['*laughs out loud, and looks surprised at {them}self*'] },
  ]);
  lines('child.tot.hello.ears', [
    { if: { childTemper: 'shy' }, text: ['*wiggles one ear, very slightly, and hides*'] },
  ]);
  lines('child.tot.hello.beard', [
    { if: { childTemper: 'shy' }, text: ['*holds one whisker, very gently, and looks at you*'] },
    { if: { childTemper: 'ornery' }, text: ['*pulls, harder, watching your face*'] },
  ]);
  lines('child.tot.hello.strong', [
    { if: { childTemper: 'shy' }, text: ['*smiles, very shy, very proud*'] },
  ]);
  lines('child.tot.hello.good', [
    { if: { childTemper: 'shy' }, text: ['*nods, once, very seriously*'] },
  ]);
  lines('child.tot.hello.gandalf', [
    { if: { childTemper: 'cheerful' }, text: ['GANNA! GANNA-FF!'] },
  ]);
  lines('child.tot.show.what', [
    { if: { childTemper: 'shy' }, text: ['*whispers* snail.'] },
  ]);
  lines('child.tot.show.named', [
    { if: { childTemper: 'cheerful' }, text: ['WIZZUD! Is wizzud snail!'] },
  ]);
  lines('child.tot.show.forme', [
    { if: { childTemper: 'shy' }, text: ['*puts it in your hand, and runs*'] },
  ]);
  lines('child.tot.show.more', [
    { if: { childTemper: 'curious' }, text: ['More! Under stone! *points at every stone in sight*'] },
  ]);
  lines('child.gran.goose', [
    { if: { childTemper: 'shy' }, text: ['...I\'ll ask when {childGranWord} is in a good mood.'] },
  ]);
  lines('child.gran.terror', [
    { if: { childTemper: 'cheerful' }, text: ['HA! I knew it! {ChildGranWord} has that look!'] },
  ]);
  lines('child.gran.climb', [
    { if: { childTemper: 'shy' }, text: ['...{ChildGranWord} did that? I\'ll never be told off for climbing again.'] },
  ]);
});
