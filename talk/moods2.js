'use strict';
// ---------------------------------------------------------------------------
// Reading the mood, part two: folk fretting (a poorly child, the weather's
// trial on its way, bare shelves, the tears in the sky), folk frightened
// (the flood, the frost, a rift close by, the dark), folk poorly, and folk
// so hungry they've gone grumpy with it. The facts come from talk/moods.js.
// ---------------------------------------------------------------------------

talkPack('moods2', () => {
  const COND = { elder: { stage: 'elder' }, child: { stage: 'child' }, rift: { rift: true }, plain: { register: 'plain' }, fine: { register: 'fine' } };
  const L = (key, base, by, more) => lines(key, [{ text: base }].concat(Object.keys(by || {}).map((k) => ({ if: COND[k] || { temper: k }, text: by[k] })), more || []));
  const fresh = (F, id) => { const b = (Game.wizBond || {})[F.id]; return !(b && ((b.seen && b.seen[id] === Game.day) || (b.sore && b.sore[id] > Game.day))); };
  const daily = (F, n, p) => hash2(F.id * 17 + Game.day, n) < p;
  const ladder = (ap, cell) => { const sit = { aps: { [ap]: cell } }; const r = (T) => rungFor(sit, ap, T); return [{ to: cell.out[2], need: { when: (F, T) => r(T) >= 2 } }, { to: cell.out[1], need: { when: (F, T) => r(T) === 1 } }, cell.out[0]]; };
  const has = (x) => !!x;
  const ease = (n) => (T, v) => { v.drives.unease = Math.max(0, (v.drives.unease || 0) - n); if (n >= 0.2) unfeel(v, 'unsettled'); };

  // --- Fretting -------------------------------------------------------------------
  const knowsWorry = (F) => ['hazard', 'rifts', 'sickness', 'hard'].includes(F.moodWorry);
  addSituation('fret', {
    pri: 4, thread: 'mood.fret', read: (F) => !!F.moodWorry && fresh(F, 'mood.fret') && (F.moodWorry === 'kid' || F.moodWorry === 'hazard' || daily(F, 3, 0.75)),
    aps: {
      listen: { base: 1, out: ['spiral', 'lists', 'unburden'] },
      ask: { base: 1, out: ['brush', 'lists', 'unburden'], know: knowsWorry },
      comfort: { base: 1, out: ['fussed', 'steadier', 'breathe'] },
      advise: { base: 0, out: ['snap', 'plan', 'firststep'], know: knowsWorry },
      jest: { base: 0, out: ['snipe', 'halfsmile', 'laughs'] },
    },
  });
  const step = ladder('advise', { base: 0, after: 'listed', know: knowsWorry, out: ['snap', 'plan', 'firststep'] });
  const firstStep = (T, v) => {
    const w = T.F.moodWorry;
    if (w === 'kid') { const k = Game.villagers.find((o) => o.first === T.F.moodWorryKid && o.parents.includes(v.id)); if (k && typeof hasFlu === 'function' && hasFlu(k)) v.queue.push({ a: ACTIONS.bring_soup, extra: { patient: k } }); }
    else if ((w === 'larder' || w === 'hard' || (w === 'hazard' && T.F.moodHazard === 'frost')) && ACTIONS.put_by && ACTIONS.put_by.avail && ACTIONS.put_by.avail(v)) v.queue.push({ a: ACTIONS.put_by });
    else if (v.homeId >= 0) v.queue.push({ a: ACTIONS.tea });
    v.drives.unease = Math.max(0, (v.drives.unease || 0) - 0.2);
  };
  addThread({
    id: 'mood.fret', situation: true, label: (F) => (F.moodWorry === 'kid' && F.moodWorryKid ? `Worried about ${F.moodWorryKid}` : 'Something\'s worrying them'),
    beats: {
      spiral: { line: 'mood.fret.spiral', notice: 'mood.fret.see', go: [
        { ap: 'comfort', say: 'One "and if" at a time, {name}.', to: 'breathe' },
        { ap: 'advise', say: 'mood.fret.w.first', to: step },
        { ap: 'jest', say: 'And if the moon falls in the millpond?', to: 'halfsmile' },
      ] },
      lists: { line: 'mood.fret.lists', fx: { flag: 'listed', learn: ['trouble', 'frets about {moodWorryWord}'] }, go: [
        { ap: 'ask', say: 'And which of those keeps you up at night?', to: 'deepest' },
        { ap: 'advise', say: 'mood.fret.w.first', to: step },
        { ap: 'comfort', say: 'That\'s a great deal to carry, {name}.', to: 'steadier' },
      ] },
      unburden: { line: 'mood.fret.unburden', fx: { flag: 'listed', run: ease(0.15), feel: 'drawn_out' }, go: [
        { ap: 'advise', say: 'mood.fret.w.first', to: step },
        { ap: 'warm', say: 'You\'ve carried that a long way. Put it down a minute.', to: 'breathe' },
      ] },
      brush: { line: 'mood.fret.brush', go: [
        { ap: 'listen', say: '*You wait. Wizards can out-wait anybody.*', label: 'Out-wait them', to: 'lists' },
        { ap: 'jest', say: 'You\'ve chewed that fingernail down to the elbow.', to: 'halfsmile' },
      ] },
      fussed: { line: 'mood.fret.fussed', go: [
        { ap: 'advise', say: 'mood.fret.w.first', to: step },
        { ap: 'listen', say: '*You stop, and let them talk.*', label: 'Stop, and let them talk', to: 'lists' },
      ] },
      steadier: { line: 'mood.fret.steadier', fx: { run: ease(0.1), fond: 0.02 }, go: [
        { ap: 'ask', say: 'What\'s the very worst of it?', to: 'deepest' },
        { ap: 'warm', say: 'Whatever comes, you\'ll not face it alone.', to: 'settled' },
      ] },
      breathe: { line: 'mood.fret.breathe', fx: { run: ease(0.25), feel: 'cheered', feelX: 'the wizard', trust: 0.02 }, go: [
        { ap: 'advise', say: 'mood.fret.w.first', to: step },
        { ap: 'warm', say: 'There. The sky\'s still up. I checked.', to: 'settled' },
      ] },
      snap: { line: 'mood.fret.snap', fx: { respect: -0.02, fond: -0.02 }, go: [
        { ap: 'comfort', say: 'You\'re right. I\'m sorry. Tell me properly.', to: 'lists' },
        { ap: 'listen', say: '*You hold up your hands, and hush.*', label: 'Hush', to: 'spiral' },
      ] },
      plan: { line: 'mood.fret.plan', fx: { respect: 0.01 }, go: [
        { ap: 'warm', say: 'That\'s all anyone can do.', to: 'settled' },
        { ap: 'ask', say: 'And what would help most, today?', to: 'firststep' },
      ] },
      firststep: { line: 'mood.fret.firststep', fx: { respect: 0.04, run: firstStep, remember: 'The wizard helped me see what to do first, when I was in a state.', rv: 1 }, end: true },
      snipe: { line: 'mood.fret.snipe', fx: { fond: -0.02 }, go: [
        { ap: 'comfort', say: 'Forgive me. Tell me properly.', to: 'lists' },
        { ap: 'listen', say: '*You say nothing, and let them go on.*', label: 'Let them go on', to: 'spiral' },
      ] },
      halfsmile: { line: 'mood.fret.halfsmile', go: [
        { ap: 'ask', say: 'What is it, really?', to: 'lists' },
        { ap: 'warm', say: 'There\'s a smile. Hold on to it.', to: 'steadier' },
      ] },
      laughs: { line: 'mood.fret.laughs', fx: { run: ease(0.2), fond: 0.03 }, go: [
        { ap: 'advise', say: 'mood.fret.w.first', to: step },
        { ap: 'warm', say: 'Better. Worry shrinks when it\'s laughed at.', to: 'settled' },
      ] },
      deepest: { line: 'mood.fret.deepest', fx: { confide: { k: 'mood.fret', t: '{Name} is frightened of not coping, and hides it well' } }, go: [
        { ap: 'comfort', say: 'mood.fret.w.deep', to: 'breathe' },
        { ap: 'warm', say: 'Thank you for telling me. That\'s the bravest bit done.', to: 'settled' },
      ] },
      settled: { line: 'mood.fret.settled', fx: { run: ease(0.1), remember: 'The wizard talked me down when I was in a state.', rv: 1 }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });

  lines('sit.fret.listen', [{ text: ['*You fall into step beside them, and wait.*', '*You lean on the wall, and let them fidget.*'] }, { if: { stage: 'child' }, text: ['*You sit on the step, so they don\'t have to look up.*'] }]);
  lines('sit.fret.ask', [
    { text: ['You look like you\'ve swallowed a bee, {name}. What is it?', 'Something\'s gnawing at you. What?'] },
    { if: { moodWorry: 'kid' }, pri: 1, text: ['How\'s {moodWorryKid} doing?', 'Is {moodWorryKid} any better?'] },
    { if: { moodWorry: 'hazard' }, pri: 1, text: ['You\'ve heard about tomorrow, then?'] },
    { if: { moodWorry: 'rifts' }, pri: 1, text: ['Is it the sky that\'s bothering you?'] },
  ]);
  lines('sit.fret.comfort', [{ text: ['Whatever it is, {name}, it\'s not as big as it looks from in there.', 'Come here. You\'re all of a tremble.'] }, { if: { stage: 'child' }, text: ['Hey, now. Nothing\'s going to get you while I\'m here.'] }]);
  lines('sit.fret.advise', [
    { text: ['Worry\'s a rocking chair, {name}. Plenty of motion, no distance.', 'Fretting won\'t mend it. Doing might.'] },
    { if: { moodWorry: 'hazard' }, pri: 1, text: ['The almanac\'s not always right, you know. Get ready, then stop fretting.'] },
    { if: { moodWorry: 'larder' }, pri: 1, text: ['Shelves can be filled, {name}. One jar at a time.'] },
  ]);
  lines('sit.fret.jest', [{ text: ['If you frown any harder you\'ll need a bigger hat.', 'Careful. Worry that much and you\'ll go grey. Look at me.'] }]);
  L('mood.fret.w.first', ['What\'s the first thing you could do about it? Just the first.', 'Pick the smallest piece of it, and do that today.', 'One thing. What\'s one thing you can do before supper?']);
  L('mood.fret.w.deep', ['You\'ve kept everyone safe so far. That\'s not luck, {name}. That\'s you.', 'Nobody keeps everyone safe. You keep trying. That\'s what counts.']);
  L('mood.fret.see', ['They\'ve wound the end of their scarf into a tight knot.', 'Their eyes keep flicking to the sky.', 'One foot taps, all the while.'], {}, [{ if: { moodWorry: 'kid' }, text: ['They keep glancing back at their own round door.'] }]);

  const W = (k, text, pri) => ({ if: { moodWorry: k }, pri: pri || 1, text });
  const Z = (k, text) => ({ if: { moodWorry: 'hazard', moodHazard: k }, pri: 1, text });
  L('mood.fret.spiral', ['And if it goes wrong, and then if THAT goes wrong, and then... oh, I can\'t stop it once it starts.', 'I keep thinking of what could happen. Then of what could happen after that. It goes on and on.'], {
    ornery: ['Nobody else is worried. So I have to be worried for all of them. Somebody has to.'], shy: ['...I lie awake making lists of everything that could go wrong. The lists have lists.'],
    cheerful: ['Me, worried! I know. It\'s a novelty. I don\'t like it.'], gloomy: ['It\'ll go wrong. Things do. I\'m just getting the worrying done early.'],
    proud: ['I\'m not worried. I am... considering every outcome. All of them. At night.'], dreamy: ['I dreamt the hill slid into the river. With us in it. I can\'t shake it.'],
    child: ['What if a monster comes? What if it comes and it\'s BIG? What if it has TEETH?'], elder: ['I\'ve seen bad years. I know how they start. They start like this.'],
  }, [
    W('kid', ['{MoodWorryKid}\'s so hot. What if it\'s the flu? What if it turns? What if I\'m not there?']),
    Z('flood', ['The river\'s brown and fast. If it comes up the field, then the cellar, then the stores...']), Z('frost', ['If the woodpile runs out in the night... if the little ones get cold... if the pipes freeze...']),
    Z('drought', ['If it doesn\'t rain the barley goes, and if the barley goes, the bread goes, and then...']), Z('blight', ['If the blight spreads to the next field, and the next, there\'ll be no barley at all.']),
    W('larder', ['The shelves are thin. If winter\'s long, and it might be, what then? What do we eat in Solmath?']),
    W('rifts', ['That tear in the sky. If it gets bigger. If something comes through that isn\'t friendly.']),
  ]);
  L('mood.fret.lists', ['It\'s the weather, and the roof, and the price of flour, and... oh, it\'s everything, really.', 'Where do I start? There\'s the leak, and the hens off laying, and something else I\'ve forgotten.'], {
    ornery: ['The roof leaks, the neighbours are idiots, and the weather\'s got it in for me. There.'], shy: ['...It\'s silly things. Lots of silly things. They add up.'],
    proud: ['I have responsibilities. Many. Somebody has to see to them, and that somebody is me.'], curious: ['I keep trying to work out what\'ll happen. I can\'t, and not knowing is the worst.'],
    gloomy: ['Everything. Honestly. Pick something. I\'m worried about it.'], cheerful: ['Oh, the usual! Only more of it. And all at once.'],
    child: ['Mum\'s worried, so I\'m worried. And there was a noise last night. And I lost my best conker.'], elder: ['The young ones don\'t put enough by. They don\'t remember the Fell Winter. I do.'],
  }, [
    W('kid', ['{MoodWorryKid}\'s poorly, and won\'t eat, and I\'ve the work to do, and I can\'t be in two places.']),
    W('hazard', ['They say it\'s coming tomorrow. I\'ve done what I can. I don\'t know if it\'s enough. I never know.']),
    W('larder', ['The jars, mostly. We\'ve fewer than last year, and last year was close.']), W('hard', ['Money\'s short. Food\'s short. Tempers are short. Everything\'s short but the winter.']),
    W('rifts', ['The sky, the strangers, what the Steward will do about it all. And nobody asks the likes of me.']), W('sickness', ['Half the lane\'s coughing. Who\'s next? Me? The little ones?']),
  ]);
  L('mood.fret.unburden', ['...Oh. Saying it out loud, it\'s smaller than it was in my head.', '*a great breath out* I\'ve been carrying all that up and down the lane for days.'], {
    ornery: ['Hmph. Well. It\'s off my chest. Doesn\'t mean you\'ve fixed it.'], shy: ['...I\'ve never said all that to anyone. It\'s lighter, somehow.'],
    proud: ['I am not in the habit of unburdening myself. ...It was useful, however.'], cheerful: ['Oh, that\'s better! Like taking off tight boots.'],
    gloomy: ['...It\'s still all true. But it\'s out here now, not just in me.'], child: ['...I feel less wobbly now.'],
  }, [W('kid', ['...{MoodWorryKid} will be all right, won\'t {they}? Saying it helps. Even if I don\'t believe it yet.'])]);
  L('mood.fret.brush', ['Worried? Me? No. Not at all. Why? Do I look worried?', 'I\'m perfectly fine, thank you. Fine.'], {
    ornery: ['I\'m not worried. I\'m annoyed. There\'s a difference.'], proud: ['Concerned, perhaps. Never worried.'], shy: ['...No. I\'m fine. Really.'], child: ['I\'m NOT scared. I\'m just checking.'],
  });
  L('mood.fret.fussed', ['Don\'t. If you\'re kind I\'ll fall apart, and I haven\'t time to fall apart.', 'Please don\'t fuss. Fussing makes it real.'], {
    ornery: ['Kind words won\'t mend the roof.'], proud: ['I don\'t require soothing. I require things to go right.'], child: ['I\'m not a BABY.'],
  });
  L('mood.fret.steadier', ['...Thank you. My heart\'s stopped going like a rabbit\'s.', 'That\'s... yes. That helps a bit.'], {
    shy: ['...Thank you. I didn\'t know I needed someone to say it.'], ornery: ['Hm. Well. Maybe.'], gloomy: ['A bit better. A bit.'], child: ['Okay. ...Okay.'],
  });
  L('mood.fret.breathe', ['*breathes in, and out, and their shoulders come down from round their ears*', '...Oh. I think I forgot to breathe for about a week.'], {
    cheerful: ['There! There I am. I knew I was in there somewhere.'], ornery: ['...Fine. I\'m breathing. Happy?'], shy: ['*a long slow breath, and a small nod*'],
    gloomy: ['...The world hasn\'t ended. Not yet, anyway.'], child: ['*breathes in so hard their cheeks puff out, and lets it all go*'],
  });
  L('mood.fret.snap', ['Easy for you to say! You can magic your way out of anything.', 'Don\'t tell me what to do. I\'ve done nothing but think what to do.'], {
    ornery: ['Thank you, wizard. Very wise. Now go and be wise at the river.'], proud: ['I have a plan, thank you. Several.'], shy: ['...I know. I know. I just can\'t.'], child: ['That\'s what GROWN-UPS say.'],
  });
  L('mood.fret.plan', ['Maybe. I\'ll sleep on it. If I sleep.', 'That\'s sense, I suppose. Annoying sense.'], { ornery: ['Hmph. I\'ll think about it.'], curious: ['Hm. Start small. I could try that.'], proud: ['I had considered that. I shall consider it further.'] });
  L('mood.fret.firststep', ['Right. Right! I can do that. I\'ll do that now, before I think about it.', 'The first thing. Yes. I can manage the first thing.'], {
    ornery: ['Fine. I\'ll do the first thing. If the second thing goes wrong I\'m blaming you.'], shy: ['...I can do that. I think I can do that.'],
    proud: ['Precisely what I was about to do. Thank you for agreeing.'], cheerful: ['Oh, that\'s better! Something to DO. Off I go!'], child: ['I\'ll do it! I\'ll do it RIGHT NOW!'],
  }, [
    W('kid', ['I\'ll take {moodWorryKid} some soup, and sit with {them}. That\'s the first thing.']), W('larder', ['I\'ll put some jars by. Today. A few jars is better than none.']),
    W('hazard', ['I\'ll get things ready, and then I\'ll stop. Ready is all anybody can be.']), W('unsettled', ['I\'ll go home and put the kettle on. Kettles are the first thing.']),
  ]);
  L('mood.fret.snipe', ['It\'s not funny. None of it is funny.', 'Don\'t joke. Not about this.'], { ornery: ['Oh, laugh it up, wizard.'], cheerful: ['...I\'m not in the mood. That\'s how you know it\'s bad.'], shy: ['*looks away*'], child: ['That\'s not FUNNY.'] });
  L('mood.fret.halfsmile', ['...Ha. Well. That would at least be interesting.', '*a twitch at the corner of the mouth, there and gone*'], { ornery: ['Hmph. ...The moon. Honestly.'], child: ['...The moon can\'t fall in. Can it?'] });
  L('mood.fret.laughs', ['Ha! Oh, you\'re impossible. ...I do feel better. Isn\'t that annoying?', 'Ha! Grey. Your hat\'s grey too. Is that worry?'], {
    witty: ['Ha! The rocking chair. I\'m stealing that.'], cheerful: ['Ahaha! Oh, I needed that. I\'ve been so serious. It doesn\'t suit me.'], gloomy: ['Ha. ...Ha. Huh. I forgot laughing was allowed.'], child: ['AHAHA! A hat for frowns!'],
  });
  L('mood.fret.deepest', ['...That I won\'t cope. That everyone thinks I\'m coping and one day I just won\'t.', '...That it\'ll be my fault. Whatever happens. That I\'ll have missed something.'], {
    shy: ['...That something happens and I\'m too frightened to do anything. That\'s it. That\'s the one.'], proud: ['...That I\'ll fail them. Everyone. Publicly.'],
    gloomy: ['...That this is how it\'ll always be now. Worried. For ever.'], child: ['...That Mum and Dad will go away over the hills. Like the old ones do.'],
  }, [W('kid', ['...That {moodWorryKid} will get worse in the night and I\'ll be asleep. I haven\'t slept. Not properly.'])]);
  L('mood.fret.settled', ['...Thank you, {wiz}. It\'s still there, but it\'s a size I can carry.', 'I\'ll be all right. I always am, in the end. I forget that.'], {
    ornery: ['Hmph. You\'re a meddler. A useful one, today.'], shy: ['...Thank you for staying. Most people hurry off when you\'re worried.'], cheerful: ['Back to my old self! Nearly.'],
    proud: ['I appreciate your counsel, wizard. Don\'t let it go to your head.'], child: ['Will you check the sky again later? Just in case?'], elder: ['You\'re a comfort, you know. Like a good fire.'],
  });

  // --- Frightened -----------------------------------------------------------------
  addSituation('fright', {
    pri: 5, thread: 'mood.fright', read: (F) => !!F.moodFright && fresh(F, 'mood.fright'),
    aps: {
      comfort: { base: 1, out: ['clings', 'calmer', 'brave'] },
      ask: { base: 1, out: ['babble', 'explains', 'reasons'] },
      advise: { base: 0, out: ['panic', 'busy', 'steady'], know: (F) => F.moodFright !== 'dark' },
      tale: { base: 1, out: ['notnow', 'listens', 'rapt'] },
      jest: { base: 0, out: ['shrill', 'giggle', 'laughs'] },
    },
  });
  const steady = ladder('advise', { base: 0, after: 'spoke', know: (F) => F.moodFright !== 'dark', out: ['panic', 'busy', 'steady'] });
  addThread({
    id: 'mood.fright', situation: true, label: (F) => ({ flood: 'The river\'s up', drought: 'The dry spell', blight: 'The blight', frost: 'The hard frost', rift: 'The tear in the sky', dark: 'Out in the dark' })[F.moodFright] || 'Frightened',
    beats: {
      clings: { line: 'mood.fright.clings', notice: 'mood.fright.see', go: [
        { ap: 'tale', say: 'mood.fright.w.tale', to: 'listens' },
        { ap: 'advise', say: 'mood.fright.w.do', to: steady },
      ] },
      calmer: { line: 'mood.fright.calmer', fx: { run: ease(0.15), flag: 'spoke' }, go: [
        { ap: 'ask', say: 'What frightens you most about it?', to: 'reasons' },
        { ap: 'advise', say: 'mood.fright.w.do', to: steady },
      ] },
      brave: { line: 'mood.fright.brave', fx: { run: ease(0.3), feel: 'cheered', feelX: 'the wizard', trust: 0.03 }, go: [
        { ap: 'warm', say: 'There\'s the {name} I know.', to: 'done' },
        { ap: 'advise', say: 'Now go and be brave at someone who needs it.', to: 'helper', need: { if: { moodPal: has } } },
      ] },
      panic: { line: 'mood.fright.panic', fx: { fond: -0.02 }, go: [
        { ap: 'comfort', say: 'Shh. I\'m here. Hold my sleeve.', to: 'clings' },
        { ap: 'tale', say: 'mood.fright.w.tale', to: 'listens' },
      ] },
      busy: { line: 'mood.fright.busy', fx: { run: ease(0.1), respect: 0.01 }, go: [
        { ap: 'warm', say: 'Good. Busy hands are brave hands.', to: 'done' },
        { ap: 'ask', say: 'And what else could we do?', to: 'reasons' },
      ] },
      steady: { line: 'mood.fright.steady', fx: { run: ease(0.25), respect: 0.04 }, go: [
        { ap: 'warm', say: 'You\'re braver than you know, {name}.', to: 'done' },
        { ap: 'jest', say: 'mood.fright.w.jest', to: 'laughs' },
      ] },
      notnow: { line: 'mood.fright.notnow', go: [
        { ap: 'comfort', say: 'No stories, then. Just me, and my big hat.', to: 'calmer' },
        { ap: 'advise', say: 'mood.fright.w.do', to: steady },
      ] },
      listens: { line: 'mood.fright.listens', fx: { run: ease(0.15), flag: 'spoke' }, go: [
        { ap: 'tale', say: 'mood.fright.w.more', to: 'rapt' },
        { ap: 'advise', say: 'mood.fright.w.do', to: steady },
      ] },
      rapt: { line: 'mood.fright.rapt', fx: { run: ease(0.35), fond: 0.04, feel: 'wizard_tale', feelX: 'of the goblin hill' }, go: [
        { ap: 'warm', say: 'See? You were brave the whole time I was talking.', to: 'done' },
        { ap: 'jest', say: 'mood.fright.w.jest', to: 'laughs' },
      ] },
      shrill: { line: 'mood.fright.shrill', fx: { fond: -0.03 }, go: [
        { ap: 'comfort', say: 'Forgive me. Come here.', to: 'clings' },
        { ap: 'ask', say: 'Tell me what you can see.', to: 'babble' },
      ] },
      giggle: { line: 'mood.fright.giggle', fx: { run: ease(0.1) }, go: [
        { ap: 'comfort', say: 'There. A laugh frightens off most things.', to: 'calmer' },
        { ap: 'tale', say: 'mood.fright.w.tale', to: 'listens' },
      ] },
      laughs: { line: 'mood.fright.laughs', fx: { run: ease(0.3), fond: 0.03 }, go: [
        { ap: 'warm', say: 'Fear never did like being laughed at.', to: 'done' },
        { ap: 'advise', say: 'mood.fright.w.do', to: steady },
      ] },
      babble: { line: 'mood.fright.babble', go: [
        { ap: 'comfort', say: 'Slowly. Slowly. I\'m listening.', to: 'calmer' },
        { ap: 'advise', say: 'mood.fright.w.do', to: steady },
      ] },
      explains: { line: 'mood.fright.explains', fx: { flag: 'spoke' }, go: [
        { ap: 'advise', say: 'mood.fright.w.do', to: steady },
        { ap: 'comfort', say: 'That\'s a fair thing to fear. Fear it with me, then.', to: 'calmer' },
      ] },
      reasons: { line: 'mood.fright.reasons', fx: { run: ease(0.2), respect: 0.02, flag: 'spoke' }, go: [
        { ap: 'warm', say: 'You\'ve worked it out yourself. You didn\'t need me.', to: 'done' },
        { ap: 'advise', say: 'mood.fright.w.do', to: steady },
      ] },
      helper: { line: 'mood.fright.helper', fx: { respect: 0.03, queue: 'whisper_visit', queueExtra: (T) => { const o = personById(T.F.moodPalId); return o ? { to: o, kind: 'kin' } : null; } }, end: true },
      done: { line: 'mood.fright.done', fx: { remember: 'The wizard stood with me when I was frightened.', rv: 1 }, end: true },
    },
    end: { fond: 0.02, trust: 0.02 },
  });
  const Fr = (k, text, pri) => ({ if: { moodFright: k }, pri: pri || 1, text });
  lines('sit.fright.comfort', [{ text: ['Come here, {name}. Stand by me.', 'I\'m here. Nothing comes past a wizard.'] }, { if: { stage: 'child' }, text: ['Come under my cloak. It\'s very roomy, and quite brave.'] }]);
  lines('sit.fright.ask', [{ text: ['What is it, {name}? Tell me what you see.', 'What\'s frightened you?'] }, Fr('rift', ['Is it the tear in the sky?']), Fr('flood', ['Is it the river?'])]);
  lines('sit.fright.advise', [
    { text: ['Fear likes idle hands, {name}. Let\'s give yours something to do.'] },
    Fr('flood', ['Get what matters up off the floor. Then come away from the water.']), Fr('frost', ['Bank the fire, close the shutters, and wear two pairs of socks.']),
    Fr('drought', ['Water the little plants first, and leave the big ones to tough it out.']), Fr('blight', ['Leave the sick field be. The herbalist will see to it.']),
    Fr('rift', ['Keep back from it, and keep your eyes open. It\'s a door, not a mouth.']), Fr('dark', ['Hold my hand and count the lamps. We\'ll walk home by them.']),
  ]);
  lines('sit.fright.tale', [{ text: ['Did I ever tell you about the night I outran a whole hill of goblins?', 'Shall I tell you what I did, the first time I was frightened?'] }, { if: { stage: 'child' }, text: ['Shall I tell you about the bravest hobbit I ever knew? He was smaller than you.'] }]);
  lines('sit.fright.jest', [{ text: ['Well! This is a fine fuss. Shall I tell it to go away?', 'If it comes any closer I shall give it a very stern look.'] }, Fr('frost', ['Cold? I once spent a night inside a snowdrift. It was cosier than the inn.']), Fr('dark', ['The dark? It\'s just the day with its hat off.'])]);
  L('mood.fright.w.tale', ['Shall I tell you a story while we wait it out?', 'Let me tell you about the time I was frightened. It was a Tuesday.']);
  L('mood.fright.w.more', ['And do you know what that hobbit did next?', 'There\'s more. The best bit.']);
  L('mood.fright.w.do', ['Let\'s do something. Doing beats dreading.', 'Come on. There\'s a job for your hands.'], {}, [Fr('flood', ['Help me get the sacks up off the floor.']), Fr('frost', ['Let\'s see your woodpile. And your socks.']), Fr('rift', ['Come back up the lane with me. Away from it.']), Fr('dark', ['Hold on to my staff. We\'ll walk to the next lamp.'])]);
  L('mood.fright.w.jest', ['And if it comes back, I shall sit on it.', 'There. Terrified? You? I\'ve seen braver jellies. Not many.']);
  L('mood.fright.see', ['They\'re shaking, very slightly, all over.', 'Their knuckles are white on the gatepost.'], {}, [Fr('rift', ['Their eyes won\'t leave the bright crack in the air.']), Fr('flood', ['They keep looking at the brown water, and back at their door.'])]);

  L('mood.fright.clings', ['*grabs your sleeve and doesn\'t let go*', 'Don\'t go. Please don\'t go anywhere.'], {
    ornery: ['I\'m not frightened. I\'m holding on to you for your sake.'], proud: ['...Stay. That is, it would be sensible for you to stay.'], shy: ['*presses close against your side, eyes shut*'],
    child: ['*wraps both arms round your leg and stays there*', 'Pick me up. PICK ME UP.'], elder: ['My old knees aren\'t made for running any more, wizard. Stay a while.'],
  }, [Fr('rift', ['It hums. Can you hear it hum? Don\'t let it see me.']), Fr('flood', ['It\'s coming up the field. I watched it come.'])]);
  L('mood.fright.calmer', ['...All right. All right. I can breathe now.', '...Thank you. My knees have stopped knocking. Mostly.'], {
    ornery: ['Hmph. I was perfectly calm all along. ...Thank you.'], shy: ['*a small nod, and a smaller smile*'], child: ['...Okay. I\'m a bit braver now.'], gloomy: ['...It\'s still out there. But I\'m less in pieces.'],
  });
  L('mood.fright.brave', ['...Do you know, I think I\'ll be all right. With you here. And after, too.', 'Right. Right! I\'m not frightened. I\'m not!'], {
    cheerful: ['Ha! Look at me. Brave as a badger!'], proud: ['I was never really frightened. I was... prepared.'], child: ['I\'m BRAVE now. Watch. *stands very straight*'],
    shy: ['...I didn\'t know I could be brave. I am. A little.'], elder: ['Seen worse than this. I\'d forgotten I had.'],
  }, [Fr('rift', ['It\'s just a door, isn\'t it? Somebody\'s door. Folk came through ours.'])]);
  L('mood.fright.panic', ['How can you be so CALM? Do something! You\'re a wizard!', 'Don\'t give me jobs! I can\'t think! I can\'t think!'], {
    ornery: ['Don\'t you order me about at a time like this!'], proud: ['I don\'t need instructions!'], child: ['I can\'t! I CAN\'T!'], shy: ['*shakes their head, and shakes, and shakes*'],
  });
  L('mood.fright.busy', ['...All right. Yes. Something to do. That helps a little.', 'I\'ll do it. Keep talking while I do.'], { ornery: ['Fine. I\'ll do it. But I\'m doing it my way.'], child: ['Like this? Am I doing it right?'] });
  L('mood.fright.steady', ['There. Done. ...Oh. That\'s much better. It\'s much smaller when you\'ve done something.', 'Right. That\'s seen to. Now it can do its worst.'], {
    ornery: ['There. Done. Now let it come, the brute.'], proud: ['Exactly what I\'d have done. Naturally.'], child: ['I did it! I did it all by myself! Nearly!'],
  }, [Fr('flood', ['The sacks are up. The water can have the floor. It can\'t have the flour.']), Fr('frost', ['Fire\'s banked. Two pairs of socks. Let it freeze.']), Fr('rift', ['Back up the lane, and it\'s just a light in the sky. Huh.'])]);
  L('mood.fright.notnow', ['Not a story! Not NOW!', 'Stories? At a time like this?'], { ornery: ['Spare me your adventures.'], child: ['I don\'t WANT a story. I want it to STOP.'] });
  L('mood.fright.listens', ['...Goblins? A whole hill of them? What did you do?', '*goes quiet, listening, eyes going wider and wider*'], {
    curious: ['Wait. How many goblins? And what were their hats like?'], child: ['And then what? AND THEN WHAT?'], dreamy: ['*listening, and the fear seems to drain away into the story*'],
  });
  L('mood.fright.rapt', ['...I forgot to be frightened. All the way through. I forgot.', 'Is that true? It isn\'t. ...Is it? Don\'t tell me. I like it either way.'], {
    child: ['AGAIN! Tell it again! With the goblin voices!'], curious: ['I\'ve a hundred questions. The fear\'s gone. Only questions.'], ornery: ['Hmph. Not bad. For a wizard.'],
  });
  L('mood.fright.shrill', ['Don\'t you DARE joke!', 'This is NOT the time!'], { ornery: ['Oh, a comedian. Wonderful.'], child: ['STOP IT. It\'s NOT FUNNY.'], shy: ['*eyes fill, and they turn away*'] });
  L('mood.fright.giggle', ['*a wobbly giggle escapes, against their will*', 'Ha... ha. Don\'t make me laugh. My legs are jelly.'], { child: ['Hee. ...A stern look. Do it. Do the look.'] });
  L('mood.fright.laughs', ['Ha! Oh, stop. ...It\'s gone. The fright\'s gone. Where did it go?', 'Ha! You\'re ridiculous. It\'s ridiculous. ...I\'m all right.'], {
    witty: ['Ha! The day with its hat off. I\'ll tell that to the dark next time.'], child: ['AHAHA! Do it again! I\'m not scared any more! Not even a bit!'],
  });
  L('mood.fright.babble', ['It came so FAST, and there was a noise, and then everyone was running, and I didn\'t know which way...', 'I don\'t know, I don\'t know, it\'s all at once, I can\'t...'], {
    child: ['There was a BIG noise and a light and Mum shouted and I ran and...'], shy: ['...I can\'t. I can\'t say. It\'s too much.'],
  }, [Fr('rift', ['The air tore. Just tore. Like cloth. And light came out, and humming, and...']), Fr('flood', ['The water came over the bank. Just like that. Over the bank and into the lane.'])]);
  L('mood.fright.explains', ['It\'s not knowing. If I knew what would happen I\'d manage. It\'s the not knowing.', 'It\'s what might happen to the others. Not me. The others.'], {
    proud: ['I fear for the village, not myself. Let\'s be clear.'], elder: ['I\'ve seen one of these before. I know how bad it can get. That\'s the trouble.'], child: ['It\'s big. And I\'m small. That\'s why.'],
  }, [Fr('frost', ['Cold that gets inside the walls. It killed my grandad\'s apple trees. All of them.']), Fr('drought', ['If the barley fails there\'s no bread. No bread, no winter. It\'s simple sums.']), Fr('dark', ['Things move in the dark. I know they don\'t. But they DO.'])]);
  L('mood.fright.reasons', ['...But it\'s only water, isn\'t it. We\'re on the hill. We\'re above it. ...We\'re all right.', '...Thinking it through, it\'s not so bad. It\'s a bad day, not a bad year.'], {
    curious: ['Actually, if you think about it properly, it\'s rather interesting. Frightening. But interesting.'], proud: ['On reflection, the situation is entirely manageable.'], child: ['...The dark is just the same place with the lights off. Isn\'t it?'],
  }, [Fr('rift', ['...The rift-folk came out of one of those. And they\'re all right. Mostly. Kira makes good tea.']), Fr('frost', ['...We\'ve wood. We\'ve blankets. It\'s only cold. Cold can\'t get in if you don\'t let it.'])]);
  L('mood.fright.helper', ['You\'re right. {MoodPal} will be beside {frag:mood.selfword}. I\'ll go and sit with {moodPal}.', 'I\'ll go and see {moodPal}. Two frightened folk make one brave one.'], { child: ['I\'ll go and look after {moodPal}! I\'m brave now, so I can.'] });
  frags('mood.selfword', ['themselves', 'themselves with it', 'themselves by now']);
  L('mood.fright.done', ['...Thank you, wizard. I\'ll not forget it.', 'I\'ll be all right now. I think I will.'], {
    ornery: ['Hmph. You were useful. Don\'t make a habit of it.'], shy: ['...You stayed. Thank you for staying.'], child: ['When I\'m big I\'m going to be a wizard and stand with people too.'], elder: ['Bless you. A body forgets how to be brave, at my age.'],
  });

  // --- Poorly -----------------------------------------------------------------------
  addSituation('poorly', {
    pri: 5.5, thread: 'mood.poorly', read: (F) => !!F.moodIll && fresh(F, 'mood.poorly'),
    aps: {
      comfort: { base: 1, out: ['grizzle', 'tucked', 'soothed'] },
      listen: { base: 1, out: ['grumble', 'symptoms', 'martyr'] },
      ask: { base: 1, out: ['grumble', 'symptoms', 'symptoms'] },
      jest: { base: 0, out: ['groan', 'wheeze', 'laughcough'] },
      advise: { base: 0, out: ['scoff', 'consider', 'remedy'] },
    },
  });
  const physic = ladder('advise', { base: 0, after: 'moaned', out: ['scoff', 'consider', 'remedy'] });
  const dose = (T, v) => { const a = ACTIONS.remedy_item; if (a && a.avail && a.avail(v)) v.queue.push({ a }); else if (ACTIONS.nap) v.queue.push({ a: ACTIONS.nap }); };
  const soupFor = (T, v) => { const o = personById(T.F.moodPalId); if (o && Game.villagers.includes(o) && ACTIONS.bring_soup && typeof hasFlu === 'function' && hasFlu(v) && v.homeId >= 0) o.queue.push({ a: ACTIONS.bring_soup, extra: { patient: v } }); else if (o) o.queue.push({ a: ACTIONS.whisper_visit, extra: { to: v, kind: 'kin' } }); };
  addThread({
    id: 'mood.poorly', situation: true, label: (F) => ({ flu: 'The flu', sprain: 'A twisted ankle', queasy: 'A queasy stomach', cold: 'A stinking cold' })[F.moodIll] || 'Poorly',
    beats: {
      grizzle: { line: 'mood.poorly.grizzle', go: [
        { ap: 'advise', say: 'mood.poorly.w.bed', to: physic },
        { ap: 'jest', say: 'mood.poorly.w.jest', to: 'wheeze' },
      ] },
      tucked: { line: 'mood.poorly.tucked', fx: { fond: 0.02, drive: { lonely: -0.1 } }, go: [
        { ap: 'advise', say: 'mood.poorly.w.bed', to: physic },
        { ap: 'ask', say: 'Has anyone brought you soup?', to: 'soup' },
      ] },
      soothed: { line: 'mood.poorly.soothed', fx: { feel: 'cheered', feelX: 'the wizard', drive: { lonely: -0.2 }, trust: 0.02 }, go: [
        { ap: 'ask', say: 'Has anyone brought you soup?', to: 'soup' },
        { ap: 'jest', say: 'mood.poorly.w.jest', to: 'laughcough' },
      ] },
      grumble: { line: 'mood.poorly.grumble', fx: { flag: 'moaned' }, go: [
        { ap: 'jest', say: 'mood.poorly.w.jest', to: 'wheeze' },
        { ap: 'comfort', say: 'You poor thing.', to: 'tucked' },
      ] },
      symptoms: { line: 'mood.poorly.symptoms', fx: { flag: 'moaned' }, go: [
        { ap: 'comfort', say: 'That sounds dreadful, {name}. Truly.', to: 'soothed' },
        { ap: 'advise', say: 'mood.poorly.w.bed', to: physic },
        { ap: 'jest', say: 'Have you tried being a wizard? We never catch anything.', to: 'laughcough' },
      ] },
      martyr: { line: 'mood.poorly.martyr', fx: { flag: 'moaned', fond: 0.02 }, go: [
        { ap: 'jest', say: 'Bravest invalid in the Shire. I\'ll have it carved.', to: 'laughcough' },
        { ap: 'advise', say: 'mood.poorly.w.bed', to: physic },
      ] },
      groan: { line: 'mood.poorly.groan', fx: { fond: -0.02 }, go: [
        { ap: 'comfort', say: 'Sorry, sorry. You poor thing.', to: 'tucked' },
        { ap: 'advise', say: 'mood.poorly.w.bed', to: physic },
      ] },
      wheeze: { line: 'mood.poorly.wheeze', go: [
        { ap: 'comfort', say: 'Steady. Steady. Breathe.', to: 'tucked' },
        { ap: 'advise', say: 'mood.poorly.w.bed', to: physic },
      ] },
      laughcough: { line: 'mood.poorly.laughcough', fx: { fond: 0.03, feel: 'cheered', feelX: 'the wizard' }, go: [
        { ap: 'advise', say: 'mood.poorly.w.bed', to: physic },
        { ap: 'warm', say: 'There. Laughing\'s half a cure.', to: 'mend' },
      ] },
      scoff: { line: 'mood.poorly.scoff', go: [
        { ap: 'jest', say: 'Then I shall stand here until you fall over. I\'m very patient.', to: 'consider' },
        { ap: 'warm', say: 'Suit yourself. But I\'m keeping an eye on you.', to: 'mend' },
      ] },
      consider: { line: 'mood.poorly.consider', fx: { respect: 0.01 }, go: [
        { ap: 'warm', say: 'Good. Mend first. The world will wait.', to: 'mend' },
        { ap: 'ask', say: 'Has anyone brought you soup?', to: 'soup' },
      ] },
      remedy: { line: 'mood.poorly.remedy', fx: { respect: 0.03, run: dose }, end: true },
      soup: { line: 'mood.poorly.soup', go: [
        { ap: 'advise', say: 'I\'ll put a word in {moodPal}\'s ear.', to: 'soupsent', need: { if: { moodPal: has } } },
        { ap: 'warm', say: 'Then I\'ll think of you over mine.', to: 'mend' },
      ] },
      soupsent: { line: 'mood.poorly.soupsent', fx: { fond: 0.03, run: soupFor }, end: true },
      mend: { line: 'mood.poorly.mend', fx: { remember: 'The wizard stopped to cheer me up when I was poorly.', rv: 1 }, end: true },
    },
    end: { fond: 0.02 },
  });
  const Ill = (k, text, pri) => ({ if: { moodIll: k }, pri: pri || 1, text });
  lines('sit.poorly.comfort', [{ text: ['Oh, you poor thing.', 'You look dreadful, {name}. Let me fuss a bit.'] }, { if: { stage: 'child' }, text: ['Oh dear, oh dear. Poorly little thing.'] }]);
  lines('sit.poorly.listen', [{ text: ['*You settle in to hear all about it.*', '*You nod gravely, the way a good listener does at a sickbed.*'] }]);
  lines('sit.poorly.ask', [{ text: ['What\'s the matter, {name}?', 'Where does it hurt?'] }, Ill('sprain', ['What have you done to that ankle?']), Ill('queasy', ['Something you ate?'])]);
  lines('sit.poorly.jest', [{ text: ['You look like something the cat dragged in, {name}. And dropped.', 'Is it catching? I\'ll stand over here.'] }, Ill('sprain', ['Chasing rabbits again? The rabbits are winning.'])]);
  lines('sit.poorly.advise', [{ text: ['Bed, {name}. Bed and a hot drink.', 'You want a remedy from the herbalist, and a long sleep.'] }, Ill('sprain', ['Sit down and put that foot up. Now.'])]);
  L('mood.poorly.w.bed', ['Bed. Now. A hot drink and a sleep and no arguing.', 'Go home, {name}. Wrap up. Let it pass.', 'The herbalist\'s remedies taste foul. That\'s how you know they work.'], {}, [Ill('sprain', ['Off that foot. Up on a stool. Today.'])]);
  L('mood.poorly.w.jest', ['Is your nose meant to be that colour?', 'I\'ve seen trolls with better complexions.'], {}, [Ill('sprain', ['A limp suits you. Very dashing. Very wounded hero.'])]);

  L('mood.poorly.grizzle', ['Don\'t fuss. It\'s only a sniffle. *sniff*', 'I\'m all right. I\'m all right! I\'m just... *sneezes*'], {
    ornery: ['I don\'t need mothering. *cough* I need you to stop looking at me.'], proud: ['I am perfectly well. This is a minor indisposition.'], child: ['I\'m not POORLY. I want to PLAY.'], gloomy: ['Fussing won\'t help. Nothing helps.'],
  }, [Ill('sprain', ['It\'s just an ankle. I\'ve another one.'])]);
  L('mood.poorly.tucked', ['...It is nice to be fussed. Just a bit.', 'Thank you. *sniff* Nobody\'s said poor thing all day.'], {
    shy: ['...Thank you. *very small sniff*'], child: ['Will you tuck me in? Wizards tuck properly.'], cheerful: ['Oh, bless you. I feel better already. That\'s a lie. But nicer.'], elder: ['At my age a cold\'s an event. Thank you for noticing.'],
  });
  L('mood.poorly.soothed', ['*sighs, and sags, and looks a little less grey*', '...That\'s the kindest thing anyone\'s said all week.'], {
    ornery: ['Hmph. Well. ...That\'s nice. Don\'t tell anyone I said so.'], child: ['*snuggles into your sleeve and sniffs*'], gloomy: ['...Maybe I\'ll live. Maybe.'],
  });
  L('mood.poorly.grumble', ['Rotten. *cough* Just rotten. Don\'t ask.', 'Mm. Bad. Everything\'s bad.'], { ornery: ['How do I look? Like a dishcloth. Thanks for asking.'], child: ['*just groans, dramatically*'] }, [Ill('sprain', ['Ankle. Ow. That\'s all.'])]);
  L('mood.poorly.symptoms', ['Well, it started in my head, then went to my throat, then it went everywhere at once. And the sneezing!', 'Hot, then cold, then hot. My nose is a tap. And my knees ache, and I don\'t know why knees.'], {
    curious: ['It\'s fascinating, really. Every hour, a new bit hurts. I\'m keeping notes.'], proud: ['I have the worst cold in the village. Ask anyone. Ask the herbalist.'],
    gloomy: ['It\'s my chest. I can feel it in my chest. It\'s going to my chest, you mark my words.'], child: ['My nose is all SNOT. Look. LOOK.'], elder: ['My bones say it\'s weather. My nose says it\'s worse.'],
  }, [Ill('flu', ['The flu. I couldn\'t get out of bed. I\'ve only come out to sit on the step. Everything aches.']), Ill('sprain', ['I went over on it chasing a rabbit. The rabbit\'s fine. The rabbit\'s laughing at me.']), Ill('queasy', ['It was the eggs. Or the mushrooms. Or the eggs AND the mushrooms. Don\'t say food.'])]);
  L('mood.poorly.martyr', ['Oh, don\'t mind me. I\'ll just be here. Suffering. Quietly. *cough* Very quietly.', 'I\'ve not complained once. Not once. Have I complained? I haven\'t.'], {
    cheerful: ['I\'m being SO brave about it. Everyone says. Well, I say. But still.'], ornery: ['Nobody\'s been to see me. I could be at death\'s door. Well, at death\'s gate.'],
  });
  L('mood.poorly.groan', ['Oh, ha ha. Very good. *cough* Kick a hobbit when they\'re down.', 'Don\'t make jokes. I can\'t laugh. It hurts to laugh.'], { ornery: ['Charming. Do you visit all the sick, or just me?'], child: ['That\'s MEAN. I\'m POORLY.'], proud: ['Hilarious. Truly.'] });
  L('mood.poorly.wheeze', ['Ha! *cough cough cough* Oh, don\'t. Don\'t!', 'Ha... *wheeze* ...that\'s not... *wheeze*'], { child: ['Hee! *sneezes all over you* ...Sorry.'] });
  L('mood.poorly.laughcough', ['Ha! *cough* Oh, that\'s better. That\'s actually better.', 'Ahaha! Trolls! *sniff* I do feel better. Isn\'t that daft?'], { witty: ['Ha! My nose has better colour than your hat.'], child: ['AHAHA *snort* ...Oops.'], gloomy: ['Ha. ...Huh. Didn\'t think I had a laugh in me.'] });
  L('mood.poorly.scoff', ['Bed? In the middle of the day? There\'s work to do!', 'I\'ve never gone to bed for a cold and I\'m not starting now.'], {
    ornery: ['Nobody tells me when to go to bed. Not since my mother.'], proud: ['I shall carry on. A {surname} carries on.'], child: ['I\'m not TIRED.'], elder: ['I\'ll rest when I\'m over the hills. Not before.'],
  });
  L('mood.poorly.consider', ['...Maybe a little lie down. A short one.', 'Well. If you put it that way. Perhaps.'], { ornery: ['Fine. But only because I want to, not because you said.'], child: ['...A SHORT nap. Not a baby nap.'] });
  L('mood.poorly.remedy', ['You\'re right. Bed, a hot drink, and the herbalist\'s horrid green stuff.', 'All right. I\'ll go and lie down. Wake me when I\'m better.'], {
    ornery: ['Fine. Fine! I\'ll go to bed. Happy now?'], child: ['Okay. Will you tell me a story after?'], proud: ['A sensible course. I had been about to suggest it.'],
  }, [Ill('sprain', ['Foot up. Stool. Cushion. I\'ll be a very dignified invalid.'])]);
  L('mood.poorly.soup', ['Nobody. *sniff* Not a drop.', 'Soup? No. Nobody\'s even been.'], { ornery: ['Soup! I should be so lucky.'], child: ['Mum made some. It had BITS in.'] }, [{ if: { moodPal: has }, text: ['{MoodPal} might, if word got round. I don\'t like to ask.', 'Not yet. {MoodPal} doesn\'t know I\'m poorly. I don\'t like to say.'] }]);
  L('mood.poorly.soupsent', ['Would you? Oh, would you? {MoodPal} makes lovely soup.', '...You\'d do that? For me? Oh, wizard.'], { ornery: ['Hmph. If {moodPal} wants to come, I suppose I\'ll allow it.'], child: ['Ask for the one with dumplings!'] });
  L('mood.poorly.mend', ['Thank you for stopping. Most folk cross the lane when you\'re sneezing.', 'I\'ll be up and about in no time. *sneeze* Some time.'], {
    ornery: ['Off you go, before you catch it. ...Thank you.'], child: ['Will you come back when I\'m better and do a firework?'], shy: ['...Thank you for visiting. I didn\'t think anyone would.'],
  });

  // --- Hungry and grumpy with it -----------------------------------------------------
  addSituation('hungry', {
    pri: 2, thread: 'mood.hungry', read: (F) => F.hungry && (F.moodStarving || F.mood === 'low' || F.mood === 'miserable' || F.temper === 'ornery') && fresh(F, 'mood.hungry') && daily(F, 5, 0.5),
    aps: {
      share: { base: 1, out: ['proud', 'takes', 'gobbles'] },
      jest: { base: 0, out: ['snarl', 'grumble', 'laughs'] },
      ask: { base: 1, out: ['snarl', 'menu', 'reverie'] },
      listen: { base: 1, out: ['rumble', 'rumble', 'menu'] },
      advise: { base: 1, out: ['nag', 'later', 'goes'] },
    },
  });
  const feed = ladder('advise', { base: 1, out: ['nag', 'later', 'goes'] });
  const goEat = (T, v) => { const a = v.homeId >= 0 && ACTIONS.eat_home ? ACTIONS.eat_home : ACTIONS.eat_inn; if (a) v.queue.push({ a }); };
  const bite = (n) => (T, v) => { v.drives.hunger = Math.max(0, v.drives.hunger - n); };
  addThread({
    id: 'mood.hungry', situation: true, label: 'Hungry, and cross with it',
    beats: {
      snarl: { line: 'mood.hungry.snarl', fx: { fond: -0.01 }, go: [
        { ap: 'share', say: 'mood.hungry.w.offer', to: 'takes' },
        { ap: 'advise', say: 'mood.hungry.w.go', to: feed },
      ] },
      grumble: { line: 'mood.hungry.grumble', go: [
        { ap: 'share', say: 'mood.hungry.w.offer', to: 'takes' },
        { ap: 'ask', say: 'And what would you eat, if you could have anything?', to: 'reverie' },
      ] },
      laughs: { line: 'mood.hungry.laughs', fx: { fond: 0.03 }, go: [
        { ap: 'share', say: 'mood.hungry.w.offer', to: 'gobbles' },
        { ap: 'advise', say: 'mood.hungry.w.go', to: feed },
      ] },
      proud: { line: 'mood.hungry.proud', go: [
        { ap: 'jest', say: 'Then I shall eat it myself, very slowly, right here.', to: 'laughs' },
        { ap: 'advise', say: 'mood.hungry.w.go', to: feed },
      ] },
      takes: { line: 'mood.hungry.takes', fx: { run: bite(0.25), fond: 0.02 }, go: [
        { ap: 'ask', say: 'Better?', to: 'menu' },
        { ap: 'advise', say: 'mood.hungry.w.go', to: feed },
      ] },
      gobbles: { line: 'mood.hungry.gobbles', fx: { run: bite(0.35), fond: 0.04, joke: { k: 'mood.cake', t: 'The wizard keeps seed-cake in his hat.' } }, go: [
        { ap: 'jest', say: 'There\'s more where that came from. Not much more.', to: 'fed' },
        { ap: 'ask', say: 'And what would you eat, if you could have anything?', to: 'reverie' },
      ] },
      menu: { line: 'mood.hungry.menu', go: [
        { ap: 'advise', say: 'mood.hungry.w.go', to: feed },
        { ap: 'share', say: 'mood.hungry.w.offer', to: 'takes' },
      ] },
      reverie: { line: 'mood.hungry.reverie', fx: { fond: 0.02 }, go: [
        { ap: 'advise', say: 'Then go and find the nearest thing to it. Now.', to: 'goes' },
        { ap: 'jest', say: 'Stop it. You\'re making me hungry, and I\'m a wizard.', to: 'laughs' },
      ] },
      rumble: { line: 'mood.hungry.rumble', notice: 'mood.hungry.see', go: [
        { ap: 'jest', say: 'Your stomach makes a good point.', to: 'laughs' },
        { ap: 'share', say: 'mood.hungry.w.offer', to: 'takes' },
      ] },
      nag: { line: 'mood.hungry.nag', go: [{ ap: 'jest', say: 'I\'ll say it again, then. Eat.', to: 'laughs' }, { ap: 'warm', say: 'Then I\'ll not keep you from it.', to: 'fed' }] },
      later: { line: 'mood.hungry.later', go: [{ ap: 'share', say: 'mood.hungry.w.offer', to: 'takes' }, { ap: 'warm', say: 'Don\'t leave it too long.', to: 'fed' }] },
      goes: { line: 'mood.hungry.goes', fx: { run: goEat, respect: 0.02 }, end: true },
      fed: { line: 'mood.hungry.fed', end: true },
    },
    end: { fond: 0.01 },
  });
  frags('mood.dish', ['a mushroom pie the size of a cartwheel', 'bacon, eggs and a heap of fried bread', 'seed-cake still warm from the oven', 'a proper Yule pudding with the brandy lit']);
  lines('sit.hungry.share', [{ text: ['Here. I\'ve a bit of seed-cake in my hat. Don\'t ask.', 'Have this. An apple. Only slightly squashed.'] }, { if: { stage: 'child' }, text: ['Psst. A toffee. Don\'t tell your mum.'] }]);
  lines('sit.hungry.jest', [{ text: ['Was that thunder, or your stomach?', 'You\'re looking at my staff like it\'s a sausage, {name}.'] }]);
  lines('sit.hungry.ask', [{ text: ['When did you last eat, {name}?', 'What are you hungriest for?'] }]);
  lines('sit.hungry.listen', [{ text: ['*You wait. Their stomach fills the silence.*', '*You say nothing. Something gurgles.*'] }]);
  lines('sit.hungry.advise', [{ text: ['Go and eat something, {name}. Before you bite somebody.', 'Whatever you\'re doing can wait for a sandwich.'] }]);
  L('mood.hungry.w.offer', ['Here. Have this. I always carry a bit of something.', 'Go on. Take the apple. Wizards don\'t really need apples.'], {}, [{ if: { stage: 'child' }, text: ['Here. One toffee. Strictly between us.'] }]);
  L('mood.hungry.w.go', ['Go and eat. Everything else will keep.', 'Off you go to your table, {name}. I insist.'], {}, [{ if: { homeless: true }, text: ['Go to the inn. Tell them the wizard sent you. And to put it on my slate.'] }]);
  L('mood.hungry.see', ['Their eyes follow every smell on the breeze.', 'They\'ve a crumb on their chin, from a meal long gone.']);

  L('mood.hungry.snarl', ['Not now. I\'m hungry. Everything\'s annoying when I\'m hungry, and you\'re everything.', 'Don\'t. Just don\'t. I haven\'t eaten since second breakfast.'], {
    ornery: ['If you\'re not carrying a pie, I\'m not talking.', 'One more word that isn\'t food and I shan\'t answer for myself.'], proud: ['I don\'t discuss anything on an empty stomach.'], child: ['I\'m STARVING. I\'m going to DIE of it.'], shy: ['...Sorry. I\'m just very hungry.'],
  });
  L('mood.hungry.grumble', ['Mm. Funny. Very funny. My stomach isn\'t laughing.', 'Hungry people have no sense of humour. Didn\'t you know?'], { ornery: ['Hmph. You\'d not joke if you\'d missed elevenses.'], child: ['That\'s not funny. I\'m HUNGRY.'] });
  L('mood.hungry.laughs', ['Ha! It was my stomach. It\'s been talking to me all morning.', 'Ha! Don\'t. Laughing makes it worse. It\'s all hollow in there.'], { witty: ['Ha! A sausage. It\'s the right shape, you have to admit.'], child: ['AHAHA. Your staff\'s not a sausage! ...Is it?'] });
  L('mood.hungry.proud', ['I don\'t need feeding, thank you. I\'m not a stray.', 'Keep your cake. I\'ve food at home. I just haven\'t got there.'], { ornery: ['I don\'t take charity. Not from wizards.'], child: ['Mum says not to take sweets off strangers. You\'re a stranger. Sort of.'] });
  L('mood.hungry.takes', ['...Oh. Thank you. *gone in two bites*', 'Well, since you\'re offering. *it vanishes*'], { ornery: ['Hmph. ...That\'s a good apple.'], shy: ['...Thank you. *nibbles politely, then not politely*'], child: ['*crams it all in at once, cheeks bulging*'] });
  L('mood.hungry.gobbles', ['*it\'s gone before you\'ve let go of it* Ohh. Oh, that\'s better. Have you got another?', 'You keep cake in your HAT? You marvellous old thing.'], {
    cheerful: ['Ohh, that\'s gorgeous. I could kiss you. I won\'t. But I could.'], ornery: ['...That\'s the best thing anyone\'s done for me all week. Don\'t make it awkward.'], child: ['Is your hat full of cake? Can I look in your hat?'],
  });
  L('mood.hungry.menu', ['Bread and dripping, and a bit of cheese, and if there\'s an onion, the onion.', 'Anything. Truly. I\'d eat the hat.'], { proud: ['A proper luncheon. Not a sandwich at the bench like a labourer.'], child: ['Jam. On anything. On my hand, even.'] });
  L('mood.hungry.reverie', ['Oh... {frag:mood.dish}. With butter. And then pudding.', 'If I could have anything? It\'d be {frag:mood.dish}. I can taste it.'], {
    dreamy: ['A feast at midsummer. Long tables. Lanterns. Pie after pie after pie, and nobody counting.'], ornery: ['A plate of bacon nobody else is allowed to touch.'], child: ['A cake as big as a HOUSE. And I live in it.'],
  });
  L('mood.hungry.rumble', ['*their stomach gives a long, low growl, like a dog under a table*', '*GRRRRUMBLE* ...That wasn\'t me.'], { child: ['*tummy rumbles* ...It\'s saying it\'s hungry.'], ornery: ['*stomach growls* ...Don\'t say a word.'] });
  L('mood.hungry.nag', ['I KNOW. I\'m going. Stop nagging.', 'Yes, yes. Food. I had thought of that myself.'], { child: ['You sound like MUM.'], proud: ['I am capable of feeding myself, wizard.'] });
  L('mood.hungry.later', ['After this. Then food. Then everything will be lovely.', 'Soon. I\'ve one more thing to do first.'], { ornery: ['When I\'m good and ready.'] });
  L('mood.hungry.goes', ['You\'re right. Food. Now. Everything else can wait.', 'Off I go. If you hear a noise like a badger in a larder, that\'s me.'], { cheerful: ['Right! Lunch! I\'ll be a new hobbit after lunch!'], child: ['Race you! ...You\'re not coming? Fine. Bye!'], ornery: ['Fine. Going. But only because I was going anyway.'] });
  L('mood.hungry.fed', ['...I\'m a nicer hobbit with something in me. Sorry about before.', 'Thank you. I\'ll be good company again soon. After pudding.'], { ornery: ['Hmph. Better. Don\'t get used to me being nice.'], child: ['Thank you, wizard! You\'re my favourite! Today.'] });
  // --- More ways of saying it ----------------------------------------------------------
  const A = (key, by, more) => lines(key, Object.keys(by || {}).map((k) => ({ if: COND[k] || { temper: k }, text: by[k] })).concat(more || []));

  // fretting: the wizard's side
  A('sit.fret.listen', { elder: ["*You lower yourself onto the bench beside them, knees creaking in sympathy.*"], rift: ["*You stand beside them under the open sky, and wait.*"] }, [W('kid', ["*You look towards their round door with them, and wait.*"])]);
  A('sit.fret.ask', { elder: ["You've a face like a wet Mersday, old friend. What's wrong?"], child: ["What's the matter, little one? You look all scrunched up."] }, [W('larder', ["Is it the larder that's bothering you?"]), W('sickness', ["Is it all this coughing about the lane?"])]);
  A('sit.fret.comfort', { elder: ["You've weathered worse than this, {name}. I've watched you do it."] }, [W('kid', ["{MoodWorryKid}'s a tough little thing, {name}. Tougher than you know."])]);
  A('sit.fret.advise', {}, [W('kid', ["Sit with {moodWorryKid}, {name}. Worry does better at a bedside than in a lane."]), W('rifts', ["The sky's been torn before and nobody fell through it but friends, {name}."])]);
  A('sit.fret.jest', { child: ["If you frown like that you'll turn into a walnut."] }, [W('larder', ["I've seen fuller larders, but I've seen emptier wizards."])]);
  A('mood.fret.w.first', {}, [W('kid', ["Go home and sit with {moodWorryKid}. That's the first thing. The rest can queue."]), W('larder', ["One jar today. Just one. Then another tomorrow."]), Z('frost', ["Stack the woodpile by the door. That's the first thing."]), Z('flood', ["Get the flour sacks up off the floor. That's the first thing."]), W('unsettled', ["Go home, put the kettle on, and sit in your own chair. That's the first thing."])]);
  A('mood.fret.w.deep', {}, [W('kid', ["{MoodWorryKid} has you, {name}. That's worth more than any remedy."]), { if: { stage: 'child' }, text: ["Grown-ups go over the hills when they're very, very old, and not before. You've ages."] }]);
  A('mood.fret.see', { child: ["They're chewing the end of a plait.", "One sock has been pulled up and down so often it's given up."], elder: ["Their pipe has gone out, and they haven't noticed."] }, [W('larder', ["There's flour on their sleeve, and a list of jars in their hand."])]);

  A('mood.fret.spiral', {
    curious: ["I've worked out eleven ways it could go wrong. I'm on twelve. Twelve is the worst one."],
    witty: ["I've written the whole disaster in my head. It's very well plotted. I'd rather not read it."],
    rift: ["My head's running every outcome at once. Like a server with too many tabs open. Sorry. City thing."],
    plain: ["And then the roof. And then the hens. And then it'll rain. It always rains after."],
  }, [W('hard', ["If the prices go up again, and they will, then what? Then we're eating the cat. We haven't got a cat."]), W('sickness', ["If I catch it, who does the work? If the little ones catch it, who minds them? If everyone catches it..."])]);
  A('mood.fret.lists', {
    dreamy: ["It's like a fog came in and every shape in it is something to worry about."],
    witty: ["I've a list. It's very long. I could read it to you, but you'd want a chair."],
    rift: ["It's all the background noise. Too many things running at once. I can't shut any of them down."],
    plain: ["The roof, the hens, the weather, the rent. Well, we don't pay rent. But if we did."],
  }, [W('unsettled', ["I can't say what. Just a feeling. Like the air before thunder, every hour of the day."]), Z('frost', ["The woodpile. The blankets. Gran's chest. Every winter I count them and every winter it's not enough."]), Z('blight', ["The barley, mostly. If it spreads we're on bread and hope come winter."])]);
  A('mood.fret.unburden', {
    curious: ["Huh. Said in a row like that, half of them cancel out. Funny, that."],
    dreamy: ["It's like opening a window. The room's still messy, but you can breathe."],
    witty: ["Well. That's my worries out on the lane for everyone to trip over. I feel lighter."],
    elder: ["At my age you'd think I'd have learned to say it out loud sooner. Thank you."],
    rift: ["Huh. Like clearing a cache. Everything runs faster now."],
  });
  A('mood.fret.brush', {
    cheerful: ["Worried? Ha! Never! ...Why, have you heard something?"],
    gloomy: ["No more than usual. Usual's quite a lot, mind."],
    witty: ["Worried? I'm merely taking the world very seriously. Someone has to."],
    elder: ["At my age I don't worry. I just think hard about things at three in the morning."],
    rift: ["All green. All systems go. Totally fine. ...Yeah, no."],
  });
  A('mood.fret.fussed', {
    cheerful: ["Oh, don't be kind, I'll only start, and I've got a stew on."],
    shy: ["...Please don't. I'll cry, and then everyone will look."],
    gloomy: ["Being kind doesn't change anything. It's nice. It doesn't change anything."],
    witty: ["Kindness at a time like this? Have you no sense of occasion?"],
    elder: ["I'm too old to be patted, wizard. Tell me something useful."],
  });
  A('mood.fret.steadier', {
    cheerful: ["Oh, that's better. That's much better. I'm almost me again."],
    proud: ["Quite. Yes. I was steadying myself anyway, but that helped."],
    curious: ["Funny how a thing feels smaller once someone else has looked at it too."],
    dreamy: ["The fog's lifting a little. I can see the hedges again."],
    elder: ["Aye. One day at a time. My mother used to say that. She was right, the old boot."],
  }, [W('kid', ["...You're right. {MoodWorryKid}'s strong. Stronger than me, the little rascal."])]);
  A('mood.fret.breathe', {
    proud: ["*draws themselves up, takes a long breath, and lets it out with dignity*"],
    curious: ["Huh. I'd forgotten breathing helps. You'd think I'd remember, I do it all day."],
    dreamy: ["*breathes, and for a moment looks at the clouds instead of the ground*"],
    witty: ["In, out. Remarkable. Somebody should write that down."],
    elder: ["*breathes out slowly, like an old bellows* That's the trick. I'd forgotten the trick."],
    rift: ["*breathes* ...Reboot complete. Thanks."],
  });
  A('mood.fret.snap', {
    cheerful: ["Oh, I know, I know! Don't you think I know? Sorry. Sorry. I'm not myself."],
    gloomy: ["Doing. Right. As if doing ever stopped anything."],
    curious: ["And what would you do, then? No, really, what? Because I've thought of everything."],
    elder: ["I was doing things before your hat was a twinkle in a hatter's eye, wizard."],
  });
  A('mood.fret.plan', {
    cheerful: ["Oh, that's a thought! I like a thought. I'll have it properly later."],
    shy: ["...Maybe. I'll see if I'm brave enough tomorrow."],
    gloomy: ["Maybe. It won't help. But maybe."],
    elder: ["Hm. My father would have said the same. He was right too, curse him."],
  });
  A('mood.fret.firststep', {
    curious: ["Do you know, that's the first time this week I've known what to do next. It's a lovely feeling."],
    gloomy: ["...All right. One thing. One thing I can manage."],
    dreamy: ["Yes. One small thing. Like lighting one lamp in a long dark lane."],
    elder: ["The first thing. Aye. You do the first thing and the second thing finds you."],
  }, [W('hard', ["I'll go through the cupboards and see what we've got. Knowing's better than guessing."]), W('rifts', ["I'll go and meet one of the rift-folk properly. Can't fear what's put the kettle on for you."])]);
  A('mood.fret.snipe', {
    witty: ["A joke? Now? That's my job, and I'm off duty."],
    gloomy: ["Hilarious. I'll laugh when it's over. If it's ever over."],
    proud: ["I don't see the humour, wizard."],
    elder: ["Laugh when you're my age and see what's funny then."],
  });
  A('mood.fret.halfsmile', {
    cheerful: ["Ha. ...Oh, I nearly laughed. I'd forgotten how."],
    witty: ["The moon in the millpond. That's almost good enough to steal."],
    shy: ["*a tiny smile, gone as soon as it came*"],
    gloomy: ["...That's daft. ...It's a bit funny. It's still daft."],
    rift: ["Ha. The moon. You'd see it from Neverdark, if it did."],
  });
  A('mood.fret.laughs', {
    ornery: ["Ha! Curse you. I was enjoying being miserable."],
    shy: ["*laughs, and covers their mouth, and laughs again*"],
    proud: ["Ha! A bigger hat. Well. I could carry one off."],
    curious: ["Ha! Does worry make you grey? Is that how it works? I'd like to know."],
    elder: ["Ha! Grey! I've been grey for forty years. Now I know why."],
    rift: ["Ha! Okay. Okay. Signal's back. You win."],
  });
  A('mood.fret.deepest', {
    cheerful: ["...That I'll stop being the cheerful one. Everyone needs me to be the cheerful one."],
    ornery: ["...That I'll be the one who got it wrong. Everyone will remember. I'll remember."],
    curious: ["...That there's something I haven't thought of. There always is."],
    witty: ["...That one day the joke won't come. And then they'll see what's under it."],
    elder: ["...That I'll go over the hills and leave a muddle behind. I don't want to leave a muddle."],
    rift: ["...That I came all this way and it'll go wrong here too. That's the one that keeps me up."],
  });
  A('mood.fret.settled', {
    curious: ["Do you know, I think I'll sleep tonight. I'd like to see what that's like again."],
    gloomy: ["It's still a worry. But it's a worry I can put on a shelf now."],
    witty: ["I'll worry again tomorrow, I expect. But I'll do it better."],
    dreamy: ["The sky looks bigger. Isn't that odd? It's the same sky."],
    rift: ["Thanks, wizard. Battery's back above half. That's good, for me."],
  }, [W('kid', ["I'll go and sit with {moodWorryKid}. And I'll let myself sleep, after."])]);

  // fright: the wizard's side
  A('sit.fright.comfort', { elder: ["Lean on me, old friend. I've two good arms and a staff."] }, [Fr('rift', ["Stay by me. It's a door, that's all. A bright, noisy door."]), Fr('dark', ["Take my hand. The dark is only the night with its eyes shut."])]);
  A('sit.fright.ask', { child: ["What did you see, little one?"] }, [Fr('frost', ["Is it the cold that's got into you?"]), Fr('dark', ["Did something give you a fright in the dark?"]), Fr('drought', ["Is it the dry spell, {name}?"])]);
  A('sit.fright.tale', { elder: ["Do you remember the Fell Winter? I'll tell you how it ended. It ended."] }, [Fr('frost', ["Shall I tell you about the winter I spent in a cave with a bear? He snored."])]);
  A('sit.fright.jest', { child: ["If anything comes, I'll pull a face at it. I have very good faces."] }, [Fr('flood', ["The river's only visiting. It'll go home once it's had its tea."]), Fr('rift', ["It's only the sky with a button undone."])]);
  A('mood.fright.w.tale', {}, [{ if: { stage: 'child' }, text: ["Shall I tell you about the bravest mouse in Bree?"] }, Fr('dark', ["Let me tell you about the night I got lost in Mirkwood. It ends with breakfast."])]);
  A('mood.fright.w.more', {}, [{ if: { stage: 'child' }, text: ["And guess what the little hobbit did then?", "Do you want to know how it ends? It ends well."] }]);
  A('mood.fright.w.do', {}, [Fr('drought', ["Come and help me carry a bucket to your seedlings."]), Fr('blight', ["Let's go and tell the herbalist. Then it's her worry, not yours."])]);
  A('mood.fright.w.jest', {}, [{ if: { stage: 'child' }, text: ["And if it comes back, we'll tickle it."] }, Fr('frost', ["And if it gets any colder, I'll knit it a scarf."])]);
  A('mood.fright.see', { child: ["They've got hold of a fistful of your robe and won't let go.", "Their bottom lip is going like a leaf in the wind."], elder: ["Their hand shakes on their stick, just a little."] }, [Fr('frost', ["Their breath smokes, quick and shallow.", "Their fingers have gone white with cold."]), Fr('dark', ["Their eyes are as round as saucers in the gloom."])]);

  A('mood.fright.clings', {
    cheerful: ["Don't go! I'm usually much braver than this. Usually."],
    curious: ["What is it? What's it doing? Don't let go of me while I look."],
    gloomy: ["I knew it. I knew something would come. Don't go."],
    witty: ["I'm holding your sleeve for purely practical reasons. Don't read anything into it."],
    rift: ["Stay close. Please. I've seen what comes out of those."],
  }, [Fr('dark', ["It's so dark. Why is it so dark? Don't let go."]), Fr('frost', ["I'm so cold my teeth are talking without me."])]);
  A('mood.fright.calmer', {
    cheerful: ["Oh, that's better. Ha. Look at me, in a state."],
    proud: ["I'm quite composed now. Thank you. I was composed before."],
    curious: ["Funny. The less I look at it the smaller it gets."],
    dreamy: ["It's still there. But it's further away now. Like a dream after waking."],
    elder: ["Aye. That's better. My heart's not as young as it was."],
    rift: ["Okay. Okay. Heart rate's coming down. Thanks."],
  });
  A('mood.fright.brave', {
    ornery: ["Hmph. Let it come. I'll give it a piece of my mind."],
    curious: ["Do you know, now I'm not scared, I want to go and look at it."],
    gloomy: ["...I'm not frightened. Huh. That's new."],
    dreamy: ["It's like a song I know the end of. It ends with us all right."],
    witty: ["Bravery's just fright with its hair combed. And I've combed mine."],
    rift: ["Okay. I've been through worse than this. I came through a hole in the sky."],
  }, [Fr('dark', ["The dark's just a blanket over everything. It's only dark."]), Fr('flood', ["Water goes down. It always goes down. I'll mop up tomorrow."])]);
  A('mood.fright.panic', {
    cheerful: ["I can't do jobs! I'm too busy being frightened!"],
    curious: ["What good would that do? WHAT GOOD would it do? Tell me!"],
    gloomy: ["There's no point. There's no point doing anything."],
    witty: ["Do something useful, he says. I'm too frightened to think of a joke!"],
    elder: ["I can't run about like I used to, wizard! Don't ask it of me!"],
    rift: ["Don't give me tasks! My head's all static!"],
  });
  A('mood.fright.busy', {
    cheerful: ["Oh, that's better. Hands busy, head quiet. Clever."],
    shy: ["*nods, and gets on with it, and the shaking stops*"],
    proud: ["I'll see to it. Properly. Somebody has to."],
    gloomy: ["...It helps. I don't know why it helps."],
    elder: ["Aye. Work's the cure for fright. Always was."],
    rift: ["Okay. Task loaded. Running."],
  });
  A('mood.fright.steady', {
    cheerful: ["Done! Look at that! I'm not frightened at all! Well, a little."],
    shy: ["...I did it. I didn't think I could."],
    curious: ["Do you know, the doing was the cure. I must remember that."],
    gloomy: ["...It's done. And nothing fell on me. That's a change."],
    elder: ["That's that. Done in my time, and done well."],
    rift: ["There. Patched. It's holding."],
  }, [Fr('drought', ["The little ones are watered. The big ones can tough it out."]), Fr('blight', ["The herbalist's on it. It's not mine to fix. That's a weight off."]), Fr('dark', ["We counted every lamp. There's only three more to home."])]);
  A('mood.fright.notnow', {
    shy: ["...No stories. Please. Not now."],
    proud: ["I'm in no state for entertainment, wizard."],
    gloomy: ["A story won't change what's out there."],
    elder: ["I've heard all the stories. Not one of them helped the river."],
    rift: ["Not a story. Not now. Just... stay."],
  });
  A('mood.fright.listens', {
    cheerful: ["Oh, I love a story! Even now! Go on!"],
    shy: ["*goes very still, listening*"],
    gloomy: ["...Did they get away? Go on. Did they?"],
    elder: ["Ha. I heard that one when I was young. Tell it the way you tell it."],
    rift: ["Goblins. Like the gangs in the low city? ...Go on."],
  });
  A('mood.fright.rapt', {
    cheerful: ["Oh, that was marvellous! I didn't think about the river once!"],
    shy: ["...Can I hear it again? Another time? When it isn't frightening?"],
    dreamy: ["...I was there. I was right there with you. And then I came back, and it's not so bad here."],
    elder: ["You tell a tale better than my grandad. And he told them well."],
    rift: ["That beat any stream I ever watched. Full signal, wizard."],
  });
  A('mood.fright.shrill', {
    cheerful: ["Not now! I can't laugh now! I'm busy being scared!"],
    proud: ["How dare you make light of this."],
    gloomy: ["Oh, a joke. That'll stop the water."],
    elder: ["Laugh at an old body when they're frightened? For shame."],
    rift: ["Not funny. Glitched. Totally glitched."],
  });
  A('mood.fright.giggle', {
    cheerful: ["Ha! Oh, don't! I'm meant to be terrified!"],
    shy: ["*giggles, very small, against your sleeve*"],
    witty: ["Ha... a stern look. You'd need a very stern look. Go on, then."],
    elder: ["Heh. You're a daft old thing. ...Thank you."],
  });
  A('mood.fright.laughs', {
    cheerful: ["Ha! Sit on it! I'd pay to see that!"],
    ornery: ["Ha! Hmph. Ha. I'm not frightened of it now. I'm cross with it."],
    shy: ["*laughs out loud, surprising everyone, them most of all*"],
    elder: ["Ha! I'd forgotten fright could be laughed at. My old mum knew."],
    rift: ["Ha! Okay. Okay. You sat on a rift. In my head. Thanks for that."],
  });
  A('mood.fright.babble', {
    cheerful: ["I was just out, and it was all lovely, and then it wasn't, and I don't know, I don't know!"],
    proud: ["It was very sudden, you see, and anyone would have, and I did, and then..."],
    elder: ["In all my years I never... and then it... and I couldn't... oh, my old heart."],
  }, [Fr('frost', ["The cold came down like a lid, and the water butt froze, and then the pipes, and I thought, the little ones..."]), Fr('dark', ["There was a shape, and a noise, and the lamp went out, and I couldn't see the path, and..."])]);
  A('mood.fright.explains', {
    shy: ["...I don't like not knowing what's going to happen. That's all. It's silly."],
    curious: ["It's not knowing how it works. If I knew how it worked I could stop being scared of it."],
    gloomy: ["Things go wrong. That's what I'm afraid of. That they will, and I'll watch."],
    rift: ["Back home the sky didn't tear. Well, it did once. That's how I got here."],
  }, [Fr('blight', ["If it gets into all the barley we'll have no bread. And no ale. Mostly I'm worried about the bread."]), Fr('rift', ["What if something comes through that isn't nice? Not everyone from out there is nice. I've heard."])]);
  A('mood.fright.reasons', {
    cheerful: ["Actually, it's not that bad, is it? I've had worse days. Last Trewsday was worse."],
    shy: ["...We'll be all right. Won't we? Yes. I think we will."],
    gloomy: ["...It's not the end of anything. It just felt like it."],
    elder: ["I've seen floods and frosts and worse. We always came through. I'd forgotten that."],
  }, [Fr('flood', ["It's only water. It comes up and it goes down. The hole's on the hill for a reason."]), Fr('drought', ["We've the well. And the pond. It's a dry spell, not a desert."]), Fr('blight', ["It's one field. We've others. And the herbalist knows her business."])]);
  A('mood.fright.helper', {
    cheerful: ["I'll go and see {moodPal}! We'll be brave together! It's easier in pairs!"],
    shy: ["...I'll go and sit with {moodPal}. We can be frightened quietly together."],
    elder: ["I'll look in on {moodPal}. We old ones have to stick together."],
  }, [{ if: { moodPal: has }, text: ["{MoodPal}'s always braver with company. I'll go and be company."] }]);
  A('mood.fright.done', {
    cheerful: ["Thank you, wizard! I'll tell everyone how brave I was. And you a bit."],
    proud: ["I'm grateful. I'd have managed, of course. But I'm grateful."],
    curious: ["Will you come by tomorrow and tell me how it all ended?"],
    gloomy: ["...It's still out there. But I'm not as frightened of it now."],
    witty: ["If anyone asks, I was magnificent. You can say you were there."],
    rift: ["Thanks, wizard. I'm fully charged again. Well. Half."],
  });

  // poorly
  A('sit.poorly.comfort', { elder: ["Oh, old friend. Sit down before you fall down."] }, [Ill('sprain', ["Oh dear. That ankle looks like a turnip."]), Ill('flu', ["You should be in bed, {name}. Come here, you poor thing."])]);
  A('sit.poorly.listen', { child: ["*You crouch beside them and wait to hear the whole sad tale.*"] }, [Ill('cold', ["*You stand just far enough away, and listen.*"])]);
  A('sit.poorly.ask', { child: ["Are you poorly, little one?"] }, [Ill('cold', ["A cold, is it?"]), Ill('flu', ["Is it the flu?"])]);
  A('sit.poorly.jest', { child: ["Your nose is the colour of a radish. A very sad radish."] }, [Ill('queasy', ["You've gone the colour of a pea, {name}. A disappointed pea."])]);
  A('sit.poorly.advise', { elder: ["At your age, a cold wants respecting. Bed, and no arguments."] }, [Ill('queasy', ["Dry toast and peppermint tea, {name}. Nothing else."]), Ill('flu', ["You should be in bed, {name}, not leaning on gates."])]);
  A('mood.poorly.w.bed', {}, [Ill('queasy', ["Dry toast, mint tea, and nothing fried for a day. Trust me."]), { if: { stage: 'child' }, text: ["Bed, little one. Bears sleep when they're poorly. Be a bear."] }]);
  A('mood.poorly.w.jest', {}, [Ill('queasy', ["You've gone a fine shade of green. Very spring-like."]), Ill('flu', ["You look like a dishcloth that's been through a mangle. Twice."])]);

  A('mood.poorly.grizzle', {
    cheerful: ["It's nothing! A sniffle! I've had worse sniffles at breakfast!"],
    shy: ["...I'm fine. Really. Please don't look at my nose."],
    curious: ["It's only a cold. Interesting, really. My ears have gone funny."],
    witty: ["I'm not ill. I'm just doing a very convincing impression."],
    elder: ["I've had more colds than you've had hot dinners. I'll live."],
    rift: ["It's just a bug. Hill-germs. My immune system's still downloading."],
  }, [Ill('queasy', ["I'm fine. It's just my stomach having opinions."])]);
  A('mood.poorly.tucked', {
    ornery: ["Hmph. ...It is nice. Don't tell anyone I said so."],
    proud: ["I suppose a little sympathy is in order. A little."],
    gloomy: ["...Thank you. I thought nobody would notice."],
    witty: ["Sympathy! Finally. I've been dropping hints all morning. Loudly."],
    rift: ["Thanks. Nobody fusses back home. Too busy."],
  });
  A('mood.poorly.soothed', {
    cheerful: ["Oh, you're a dear. I feel better already. My nose doesn't, but I do."],
    shy: ["*a small, grateful sniff*"],
    proud: ["That's... very kind. I'll bear it bravely now."],
    elder: ["Bless you. My mother used to say that. Poor thing. Just like that."],
    rift: ["Huh. That's like a warm drink for the brain. Thanks."],
  });
  A('mood.poorly.grumble', {
    cheerful: ["Awful. But I'm trying to be cheerful about it. Awfully cheerful."],
    shy: ["...Not good. *sniff*"],
    proud: ["Indisposed. Let us leave it at that."],
    gloomy: ["Worse than yesterday. Better than tomorrow, probably."],
    elder: ["My bones ache, my nose runs and my head's full of wool. Otherwise champion."],
    rift: ["System's crashed. Rebooting. Slowly."],
  }, [Ill('queasy', ["Don't ask. And don't say the word breakfast."]), Ill('flu', ["Like I've been sat on by a troll. Two trolls."])]);
  A('mood.poorly.symptoms', {
    cheerful: ["Well! First a tickle, then a sneeze, then a sneeze with a sneeze inside it!"],
    witty: ["My nose has taken up running. I wish it would take up something quieter."],
    rift: ["Fever, sneezing, and everything's laggy. Like bad signal, but inside."],
  }, [Ill('cold', ["My nose is blocked on one side and a waterfall on the other. I don't know which is worse."])]);
  A('mood.poorly.martyr', {
    shy: ["...I didn't want to bother anyone. I've just been... quietly poorly."],
    proud: ["I've carried on regardless. As one does."],
    gloomy: ["Don't mind me. Nobody else does."],
    witty: ["I've been very brave. Ask me how brave. Go on. Very brave."],
    elder: ["In my day we didn't make a fuss. *cough* I'm not making a fuss. *cough cough*"],
    child: ["I've been SO brave. I only cried twice. Three times."],
  });
  A('mood.poorly.groan', {
    cheerful: ["Oh, don't! I want to laugh and I can't! It's cruel!"],
    shy: ["*sniffs, and looks hurt*"],
    gloomy: ["Course. Laugh at the sick. Everyone does."],
    elder: ["Have a heart, wizard. I'm old AND poorly."],
    rift: ["Low battery, wizard. Not in the mood for jokes."],
  });
  A('mood.poorly.wheeze', {
    cheerful: ["Ha! *cough* ...ha! Oh, it hurts, but it's good hurt!"],
    ornery: ["Hmph! *cough* ...That's not... *cough*"],
    witty: ["Ha... *cough* ...you'll pay for that... *wheeze*"],
    elder: ["Heh! *rattling cough* ...Oh, me. Don't make an old one laugh."],
    rift: ["Ha! *cough* ...lag. Throat lag."],
  });
  A('mood.poorly.laughcough', {
    cheerful: ["Ha! Oh, I'm better for that! Not well. Better."],
    ornery: ["Ha! *cough* Hmph. All right. That was funny."],
    proud: ["Ha! Trolls! I'm much handsomer than a troll. Even now."],
    elder: ["Ha! *cough* Bless you, I needed that more than the herbalist's green stuff."],
    rift: ["Ha! Okay. Mood's up. Nose still down."],
  });
  A('mood.poorly.scoff', {
    cheerful: ["Bed? And miss the day? It's such a lovely day! *sneeze*"],
    shy: ["...I can't go to bed. People will think I'm making a fuss."],
    curious: ["Bed? I'd only lie there thinking. I'd rather think out here."],
    gloomy: ["Bed won't help. Nothing helps."],
    rift: ["Bed? In the daytime? That's not how anyone works."],
  }, [Ill('sprain', ["Put my foot up? I've a whole field to see to!"])]);
  A('mood.poorly.consider', {
    cheerful: ["Oh, a nap does sound lovely. A cosy nap. You've talked me into it."],
    shy: ["...Maybe. If you think I should."],
    curious: ["Hm. I suppose sleep is how the body mends. Fascinating, really."],
    proud: ["I suppose even I need rest. Occasionally."],
    elder: ["Aye. Maybe a lie down. Just for an hour. Or an afternoon."],
    rift: ["Okay. Power-save mode. For a bit."],
  });
  A('mood.poorly.remedy', {
    cheerful: ["Bed it is! With a hot water bottle! And a book! Poorly isn't so bad."],
    shy: ["...All right. I'll go and lie down. Thank you."],
    curious: ["I'll take the green stuff and see if it works. In the name of science."],
    gloomy: ["Fine. Bed. It won't help. I'll go anyway."],
    elder: ["Aye. A hot posset and bed. My old mum's cure for everything."],
    rift: ["Okay. Shutting down for the night. Early."],
  }, [Ill('queasy', ["Dry toast. Mint tea. And no mushrooms ever again. Well. For a week."])]);
  A('mood.poorly.soup', {
    cheerful: ["Not yet! But somebody will. Somebody always does, here."],
    shy: ["...No. I didn't like to ask anyone."],
    proud: ["I don't need soup. ...It would be nice, though."],
    gloomy: ["Nobody. Nobody knows. Nobody'd come if they did."],
    elder: ["Not yet. In my day the whole lane would've been round with a pot."],
    rift: ["Soup? Is that the hill version of meds? No. Nobody."],
  }, [{ if: { spouse: has }, text: ["{Spouse} tried. {Spouse} can't make soup. It was mostly turnip."] }]);
  A('mood.poorly.soupsent', {
    cheerful: ["Oh, you're a darling! Soup! I'll be up and dancing tomorrow!"],
    shy: ["...Thank you. You didn't have to. Thank you."],
    proud: ["Well. If {moodPal} insists. I shan't refuse."],
    elder: ["Bless you, wizard. A bit of soup and company. That's the cure, at my age."],
  });
  A('mood.poorly.mend', {
    cheerful: ["Thank you! I feel better already! My nose doesn't, but I do!"],
    proud: ["Kind of you to call. I'll be my usual self shortly."],
    gloomy: ["...Thank you. That's the nicest thing that's happened all week."],
    elder: ["Bless you for stopping. Old and poorly is a lonely business."],
    rift: ["Thanks, wizard. Better signal already."],
  }, [Ill('sprain', ["I'll be hopping about properly in a day or two. Thank you for stopping."])]);

  // hungry
  A('sit.hungry.share', { elder: ["Here. I've a bit of cheese about me. Wizards always carry cheese."] }, [{ if: { stage: 'grown' }, text: ["Have this bun. It's been in my pocket, but it's a clean pocket. Mostly."] }]);
  A('sit.hungry.jest', { child: ["I can hear your tummy from here. It's louder than the mill."] });
  A('sit.hungry.ask', { child: ["Have you had your second breakfast?"] }, [{ if: { hour: 'afternoon' }, text: ["Did you miss luncheon, {name}?"] }]);
  A('sit.hungry.listen', { child: ["*You wait. Their tummy fills the silence instead.*"] });
  A('sit.hungry.advise', { child: ["Go home and ask for a bit of bread and jam, little one."] }, [{ if: { homeless: true }, text: ["The inn does a good pie, {name}. Go and get one."] }]);
  A('mood.hungry.w.offer', {}, [{ if: { season: 'autumn' }, text: ["Have an apple. I picked it off the tree by the bridge. Don't tell."] }, { if: { stage: 'elder' }, text: ["Here. A wedge of cheese. I keep it for emergencies. This is one."] }]);
  A('mood.hungry.w.go', {}, [{ if: { stage: 'child' }, text: ["Go home and have something. Your mum will thank me."] }, { if: { job: has }, text: ["Leave the work a minute and go and eat. It'll keep."] }]);
  A('mood.hungry.see', { child: ["They're staring at a passing hen as if it were a pie.", "Their tummy rumbles, and they pretend it didn't."], elder: ["They keep patting their pockets for a biscuit that isn't there."] });

  A('mood.hungry.snarl', {
    cheerful: ["I'm usually lovely! I'm usually so lovely! I'm just so hungry!"],
    curious: ["Do you know you can't think properly when you're hungry? I can't. Go away."],
    dreamy: ["...Sorry. All I can think of is pie. A big one. Golden on top."],
    gloomy: ["Hungry. And it's raining in my soul. Leave me alone."],
    witty: ["My stomach and I are not on speaking terms. Neither are you and I, just now."],
    elder: ["At my age, a missed meal is a serious matter, wizard. Very serious."],
    rift: ["Low battery. Need fuel. Not chat. Sorry."],
  });
  A('mood.hungry.grumble', {
    cheerful: ["Ha ha. My stomach's laughing harder. It's laughing at me."],
    shy: ["...Sorry. I'm just very hungry."],
    proud: ["I'm not amused, I'm famished."],
    gloomy: ["Funny. Starving's funny. Everything's funny when you're starving."],
    elder: ["Jokes don't fill bellies, lad."],
  });
  A('mood.hungry.laughs', {
    cheerful: ["Ha! Thunder! It does sound like thunder! Like a whole storm!"],
    ornery: ["Ha! Hmph. All right, it was my stomach. Don't spread it about."],
    shy: ["*laughs, and their stomach laughs with them*"],
    elder: ["Ha! My stomach's older than your jokes, and twice as loud."],
    rift: ["Ha! Yeah. That's the low-fuel alarm."],
  });
  A('mood.hungry.proud', {
    cheerful: ["Oh, I couldn't take your food! ...Could I? No. No."],
    shy: ["...No, thank you. I couldn't. It's yours."],
    gloomy: ["I don't want your leftovers. I'll go hungry. I'm used to it."],
    elder: ["I've fed myself for eighty years, wizard. I'll not start begging now."],
    rift: ["I'm not a charity case. Back home I'd just buy noodles."],
  });
  A('mood.hungry.takes', {
    cheerful: ["Oh, thank you! *munch* You're the best wizard I know!"],
    curious: ["What is it? *bites* Oh, it's good. What's in it? *bites again*"],
    proud: ["Well. Since you insist. *eats it with great dignity, very fast*"],
    gloomy: ["...Thanks. *eats* ...That's better. A bit."],
    elder: ["Bless you. *chews slowly, with great satisfaction*"],
    rift: ["Thanks. *gone* ...Battery at forty percent. Better."],
  });
  A('mood.hungry.gobbles', {
    shy: ["*it vanishes, and they look surprised at their own empty hand*"],
    curious: ["Seed-cake in a hat! How do you keep it fresh? Is it magic? Is it?"],
    dreamy: ["Oh... that's the best thing I've ever eaten. It's probably not. It is today."],
    gloomy: ["...Oh. That's lovely. That's actually lovely."],
    elder: ["Bless you. That's as good a cake as my mother made. Nearly."],
    rift: ["Whoa. That's better than any vending machine in Neverdark."],
  });
  A('mood.hungry.menu', {
    cheerful: ["Everything! Toast and eggs and mushrooms and a pie and another pie!"],
    curious: ["Something new. I've had bread every day this week. Something I've never tried."],
    gloomy: ["Whatever there is. There's never much."],
    elder: ["A bit of ham, a bit of cheese, and a good strong cup of tea."],
    rift: ["Noodles. Hot ones. From a stall. ...Bread, I suppose. Bread's fine."],
  });
  A('mood.hungry.reverie', {
    cheerful: ["Roast chicken! With crispy taters! And gravy! And then pudding! And then another pudding!"],
    shy: ["...My mum's apple pie. With custard. I can almost smell it."],
    elder: ["A Yule dinner like we had when I was young. Goose, and chestnuts, and plum pudding."],
    rift: ["Hot noodles from the night market. Spicy. Steaming. With a fried egg on top."],
  });
  A('mood.hungry.rumble', {
    cheerful: ["*a rumble so loud they burst out laughing*"],
    shy: ["*stomach growls* ...Oh no. *goes red*"],
    proud: ["*stomach rumbles, and they pretend it was a cart going by*"],
    elder: ["*a long, low, ancient rumble, like an old cellar door*"],
    rift: ["*stomach growls* ...Low-fuel warning. Sorry."],
  });
  A('mood.hungry.nag', {
    cheerful: ["I know! I'm going! As soon as I can!"],
    shy: ["...Sorry. Yes. I'll go."],
    gloomy: ["Fine. Food. As if that fixes everything."],
    elder: ["I've been eating since before you were a twinkle, wizard. I know how."],
    rift: ["Copy that. Food. Yes. Going."],
  });
  A('mood.hungry.later', {
    cheerful: ["After this! Then a feast! A small feast!"],
    shy: ["...In a minute. I've just got to finish."],
    proud: ["When I have finished my task, and not before."],
    elder: ["I'll eat when the work's done. My father's rule."],
    rift: ["Few more minutes. Then I'll refuel."],
  });
  A('mood.hungry.goes', {
    shy: ["...All right. I'll go. Thank you."],
    curious: ["Good idea. I wonder what's in the larder. Let's go and find out."],
    gloomy: ["Fine. I'll go and eat. Might help. Probably won't."],
    elder: ["Aye. My stomach and I are agreed. Off we go."],
    rift: ["Copy. Heading for fuel. Bye, wizard."],
  });
  A('mood.hungry.fed', {
    cheerful: ["Thank you! I'm a nicer hobbit full! Much nicer!"],
    shy: ["...Thank you. Sorry I was cross."],
    gloomy: ["...Better. Things seem a bit less awful. Funny, that."],
    elder: ["Bless you, wizard. A full belly is a happy heart, my old dad said."],
    rift: ["Thanks. Battery back. I'm good company again. Mostly."],
  });
  A('mood.fret.halfsmile', { elder: ["Heh. The moon in the millpond. My grandad swore he saw it once. He'd had cider."] });
  A('mood.fret.snap', { shy: ["...I'm trying. I am trying. Please don't."], rift: ["Don't push me. I'm already running hot."] });
  A('mood.fright.giggle', { child: ["Hee! A stern look! Show me! Is it this one? *scrunches face*"], rift: ["Heh. A stern look. That'd work on half of Neverdark."] });
  A('mood.poorly.consider', { child: ["...A little nap. If you tell me a story first."], ornery: ["Hmph. An hour. Not a minute more. And I'm not enjoying it."] });
  A('mood.hungry.later', { child: ["After I finish my game! It's nearly finished! Nearly!"], gloomy: ["Later. There's always later. Food can wait. Everything waits."] });
  A('mood.hungry.nag', { proud: ["I am entirely capable of remembering to eat, wizard. I simply chose not to."], witty: ["Food. Yes. I'd heard of it. I'll look into it."] });
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
  lines('mood.fret.w.close', [{ text: ['Whatever comes, {name}, you\'ll not meet it on your own.', 'Let\'s leave the worrying there for today. It\'ll keep.', 'You\'ve done all the worrying anyone could ask. Rest now.'] }]);
  tidy('mood.fret', 'settled', 'mood.fret.w.close');
  lines('mood.fright.w.close', [{ text: ['I\'m here, {name}. I\'m not going anywhere.', 'Stand by me a while. Nothing gets past a wizard.', 'There. The worst of it\'s passing. Breathe.'] }]);
  tidy('mood.fright', 'done', 'mood.fright.w.close');
  lines('mood.poorly.w.close', [{ text: ['Get well, {name}. I\'ll look in on you tomorrow.', 'Off home with you. Wrap up warm.', 'Mend soon, {name}. The lane\'s dull without you.'] }]);
  tidy('mood.poorly', 'mend', 'mood.poorly.w.close');
  lines('mood.hungry.w.close', [{ text: ['Go and eat, {name}. We\'ll talk on full stomachs.', 'I\'ll not keep a hungry hobbit from the table.', 'Off you go. Mind you have seconds.'] }]);
  tidy('mood.hungry', 'fed', 'mood.hungry.w.close');
});
