'use strict';
// ---------------------------------------------------------------------------
// Work across the trades, the fourth work pack: apprentices and their masters,
// rivals at the fair, folk with no trade and folk who've retired from one,
// children who want a trade, the Steward's working week as it's felt, the
// Common Store, and a bad year (the season's trial and the harvest). And
// things folk bring to the wizard: whether to take on an apprentice, what to
// make of the Steward moving them, how to beat a rival at the fair. Lines use
// the same W(key, spec) helper as talk/work.js (see its banner).
// ---------------------------------------------------------------------------

talkPack('work4', () => {
  const TEMPERS = ['cheerful', 'ornery', 'shy', 'curious', 'dreamy', 'witty', 'proud', 'gloomy', 'child'];
  const has = (x) => !!(Array.isArray(x) ? x.length : x);
  const cond = (s) => {
    const c = {}; let pri = 0;
    for (const p of s.split(' ')) {
      if (!p) continue;
      let m;
      if (p[0] === '^') pri += +p.slice(1);
      else if (TEMPERS.includes(p)) c.temper = p;
      else if ((m = p.match(/^(\w+)>(-?[\d.]+)$/))) c[m[1]] = { min: +m[2] };
      else if ((m = p.match(/^(\w+)<(-?[\d.]+)$/))) c[m[1]] = { max: +m[2] };
      else if ((m = p.match(/^!(\w+)$/))) c[m[1]] = false;
      else if ((m = p.match(/^(\w+)=(.+)$/))) { const vs = m[2].split('|').map((x) => (x === 'true' ? true : x === 'false' ? false : x)); c[m[1]] = vs.length > 1 ? vs : vs[0]; }
      else c[p] = has;
    }
    return [c, pri];
  };
  const W = (key, spec) => {
    const rules = [];
    for (const k in spec) {
      const text = Array.isArray(spec[k]) ? spec[k] : [spec[k]];
      if (k === '_') { rules.push({ text }); continue; }
      const [c, pri] = cond(k);
      rules.push(pri ? { if: c, pri, text } : { if: c, text });
    }
    lines(key, rules);
  };
  const grown = (F) => F.stage === 'grown' || F.stage === 'elder';

  // --- Facts of our own -------------------------------------------------------------
  const GOODS = { bread: 'bread', ale: 'ale', veg: 'vegetables', fish: 'fish', wood: 'firewood', leaf: 'pipe-weed', cheese: 'cheese', apple: 'apples', flour: 'flour', egg: 'eggs', honey: 'honey', remedy: 'remedies', pie: 'pies', cake: 'seed-cake', grain: 'barley' };
  const OLD = {
    farmer: ['hoe', 'the barley fields'], herder: ['crook', 'the pens'], miller: ['flour scoop', 'the mill'], baker: ['peel', 'the Bakehouse'], brewer: ['mash paddle', 'the brewhouse'],
    innkeeper: ['ladle', 'the inn'], grower: ['leaf knife', 'the leaf field'], fisher: ['rod', 'the river'], woodwright: ['axe', 'the woods'], herbalist: ['pestle', 'the herb beds'],
    orchardist: ['pruning hook', 'the orchard'], postie: ['satchel', 'the round'], storyteller: ['old storybook', 'the old oak'], nanny: ['rocking chair', 'the nursery'], tinker: ['soldering iron', 'the Relay'], lamplighter: ['pole', 'the lanes'],
  };
  const SKILL_JOB = { farming: 'farmer', cooking: 'baker', brewing: 'brewer', fishing: 'fisher', woodcraft: 'woodwright', herbalism: 'herbalist', lore: 'storyteller', music: 'innkeeper', tinkering: 'tinker' };
  const IDLE = { garden: 'puttering in the garden', fish: 'a bit of fishing', stroll: 'walking the lanes', read: 'reading by the window', forage: 'mushrooming', work_odd: 'odd jobs about the place', smoke: 'a pipe on the step', nap: 'napping, if I\'m honest', chat: 'nattering', fiddle: 'fiddling', bake_home: 'baking at home' };
  const HAZ = { flood: 'the flood', drought: 'the dry spell', blight: 'the blight', frost: 'the hard frost' };
  addFacts((v, F) => {
    const st = Village.stores || {}, used = (Village.yesterday && Village.yesterday.used) || {};
    let sc = null, sd = 1e9, pl = null, pr = -1;
    for (const k in GOODS) {
      const have = st[k] || 0, u = used[k] || 0;
      const days = u > 0 ? have / u : have > 2 ? 99 : 0;
      if (days < sd) { sd = days; sc = k; }
      const cap = typeof storeCap === 'function' ? storeCap(k) : 100;
      const r = have / Math.max(1, cap);
      if (r > pr) { pr = r; pl = k; }
    }
    F.workLifeScarce = sc && sd < 2.5 ? GOODS[sc] : null;
    F.workLifeScarceKey = sc && sd < 2.5 ? sc : null;
    F.workLifePlenty = pl && pr > 0.55 && pl !== sc ? GOODS[pl] : null;
    F.workLifeIdleDoes = !v.job && v.isGrown() ? (IDLE[v.lastAction] || 'odd jobs about the place') : null;
    const top = typeof topTalents === 'function' ? topTalents(v.genes, 1)[0] : null;
    let fit = top ? SKILL_JOB[top] : null;
    if (fit === 'tinker' && !(v.tech > 0.3)) fit = 'farmer';
    F.workLifeFitJob = fit && JOBS[fit] ? fit : null;
    F.workLifeFit = fit && JOBS[fit] ? JOBS[fit].label.toLowerCase() : null;
    const rj = !v.job && (v.memories || []).map((m) => m.t && m.t.match(/^Retired after years as an? (.+)\.$/)).find(Boolean);
    const rjob = rj ? Object.keys(JOBS).find((j) => JOBS[j].label.toLowerCase() === rj[1].toLowerCase()) : null;
    F.workLifeOldTool = rjob && OLD[rjob] ? OLD[rjob][0] : null;
    F.workLifeOldPlace = rjob && OLD[rjob] ? OLD[rjob][1] : null;
    const succ = rjob ? Game.villagers.find((o) => o !== v && o.job === rjob && !o.leaving) : null;
    F.workLifeSuccessor = succ ? succ.first : null;
    F.workLifeLessons = v.master ? v.master.lessons || 0 : null;
    const ap = typeof apprenticesOf === 'function' ? apprenticesOf(v)[0] : null;
    F.workLifeApprenticeChild = ap ? ap.isChild() : null;
    F.workLifeFair = World.season === 'autumn' ? 'Harvest Fair' : 'market-day show';
    const hz = typeof hazard === 'function' ? hazard() : null;
    F.workLifeHazard = hz && HAZ[hz.k] ? HAZ[hz.k] : null;
    F.workLifeJarsLow = v.homeId >= 0 && typeof jarsTotal === 'function' ? jarsTotal(v.home()) < 6 : null;
  });
  const runLean = (T, v) => { if (typeof nudgeUp === 'function' && v.isChild()) nudgeUp(v, T.F.workLifeFitJob === 'tinker' || T.F.rift ? 'rift' : 'hill', 0.04, 'the wizard talked of trades'); };
  const pushQ = (v, k) => { if (ACTIONS[k]) v.queue.push({ a: ACTIONS[k] }); };

  // --- Apprentices --------------------------------------------------------------------
  addThread({
    id: 'work.apprentice', label: (F) => (F.workMaster ? `Learning from ${F.workMaster}` : 'Learning a trade'), about: 'work', weight: 1.2, cool: 3,
    when: (F) => !!F.workMaster,
    open: { ask: 'work.apprentice.open' },
    beats: {
      start: { line: 'work.apprentice.start', go: [
        { ap: 'ask', say: 'What\'s {workMaster} like to learn from?', to: 'habits' },
        { ap: 'ask', say: 'And what have you learned so far?', to: 'learned' },
        { ap: 'jest', say: 'Has {workMaster} let you touch anything yet?', to: 'touch' },
      ] },
      habits: { line: 'work.apprentice.habits', go: [
        { ap: 'jest', say: 'Do you do the voice when they\'re not looking?', to: 'voice' },
        { ap: 'listen', say: '*You wait. There\'s more, by the look of it.*', label: 'Wait for more', to: 'grumble' },
        { ap: 'warm', say: 'You\'re lucky to have them.', to: 'lucky' },
      ] },
      learned: { line: 'work.apprentice.learned', fx: { learn: ['work.apprentice', '{Name} is learning the {workMasterTrade}\'s trade from {workMaster}.'] }, go: [
        { ap: 'ask', say: 'And the worst mistake so far?', to: 'mistake' },
        { ap: 'ask', say: 'When will you be done, do you think?', to: 'finish' },
        { ap: 'warm', say: 'That\'s a good deal to learn. Well done.', to: 'lucky' },
      ] },
      touch: { line: 'work.apprentice.touch', go: [
        { ap: 'jest', say: 'A broom is a very important tool. Ask any witch.', to: 'laugh' },
        { ap: 'ask', say: 'No, truly. What have you learned?', to: 'learned' },
      ] },
      voice: { line: 'work.apprentice.voice', fx: { joke: { k: 'work.voice', t: '{Name} does {workMaster}\'s voice when nobody\'s looking.' }, fond: 0.02 }, go: [
        { ap: 'jest', say: 'Do mine.', to: 'mine' },
        { ap: 'ask', say: 'And underneath the voice? Are they kind?', to: 'grumble' },
      ] },
      grumble: { line: 'work.apprentice.grumble', go: [
        { ap: 'comfort', say: 'They push because they see something in you.', to: 'seen' },
        { ap: 'advise', say: 'Ask them why. Masters love to be asked why.', to: 'askwhy' },
        { ap: 'listen', say: '*You say nothing, and let it sit.*', label: 'Say nothing', to: 'fear', need: { open: 2 }, soft: true },
      ] },
      mistake: { line: 'work.apprentice.mistake', go: [
        { ap: 'share', say: 'I once turned my master\'s cat blue. For a month.', to: 'cat' },
        { ap: 'comfort', say: 'Everyone does that once. The good ones only once.', to: 'eased' },
        { ap: 'jest', say: 'And did {workMaster} see?', to: 'laugh' },
      ] },
      finish: { line: 'work.apprentice.finish', go: [
        { ap: 'ask', say: 'And what then?', to: 'then' },
        { ap: 'listen', say: '*You wait. Something\'s behind that.*', label: 'Wait', to: 'fear', need: { open: 2 }, soft: true },
      ] },
      fear: { line: 'work.apprentice.fear', fx: { confide: { k: 'work.apprentice.fear', t: '{Name} is afraid of never being as good as {workMaster}', secret: true } }, go: [
        { ap: 'warm', say: 'You\'ll be better. Not the same. Better, in your own way.', to: 'believe' },
        { ap: 'share', say: 'I felt the same about my master. I still do, some days.', to: 'shared' },
      ] },
      mine: { line: 'work.apprentice.mine', fx: { fond: 0.02 }, end: true },
      lucky: { line: 'work.apprentice.lucky', fx: { fond: 0.01 }, end: true },
      laugh: { line: 'work.apprentice.laugh', fx: { fond: 0.02 }, end: true },
      seen: { line: 'work.apprentice.seen', fx: { trust: 0.02, feel: 'cheered', feelX: 'the wizard' }, end: true },
      askwhy: { line: 'work.apprentice.askwhy', fx: { respect: 0.03, feel: 'good_tip', feelX: 'the wizard' }, end: true },
      eased: { line: 'work.apprentice.eased', fx: { trust: 0.02 }, end: true },
      cat: { line: 'work.apprentice.cat', fx: { joke: { k: 'work.bluecat', t: 'The wizard once turned his master\'s cat blue.' }, fond: 0.02 }, end: true },
      then: { line: 'work.apprentice.then', end: true },
      believe: { line: 'work.apprentice.believe', fx: { trust: 0.04, fond: 0.02, feel: 'drawn_out' }, end: true },
      shared: { line: 'work.apprentice.shared', fx: { trust: 0.05 }, end: true },
    },
    end: { fond: 0.01 },
  });
  W('work.apprentice.open', {
    _: ['How are you getting on with {workMaster}, {name}?', 'And how\'s the apprentice, {name}?', 'Learning a great deal, {name}?'],
    child: ['Are you learning lots from {workMaster}, {name}?'],
  });
  W('work.apprentice.start', {
    _: ['Slowly! {WorkMaster} says that\'s the only way that sticks.', 'I\'m getting there. I think. Ask {workMaster}.', 'Some days I\'m sure I\'ve got it. Then I haven\'t.'],
    cheerful: ['Ever so well! I\'ve only spoiled two things this week.', 'Wonderfully! Every day there\'s something new to get wrong.'],
    ornery: ['{WorkMaster} has me doing the dull bits. Always the dull bits.', 'Well enough, if {workMaster} would stop watching over my shoulder.'],
    shy: ['...All right, I think. {WorkMaster} hasn\'t sent me home yet.', '...I try very hard. I don\'t say much. I watch.'],
    curious: ['I\'ve a hundred questions a day and {workMaster} answers about four.', 'Brilliantly! Did you know there\'s a right way to hold a {workTool}? I didn\'t.'],
    dreamy: ['It\'s like learning a song. Bit by bit, and then it sings itself.', 'Sometimes my hands know before I do. That\'s new.'],
    witty: ['I\'m learning all the wrong ways first, so I\'ll know them when I see them.', 'Splendidly. I\'ve mastered looking busy. The rest is detail.'],
    proud: ['Faster than {workMaster} expected. {WorkMaster} said so. Nearly.', 'Very well. I\'ll be done before the year\'s out, you\'ll see.'],
    gloomy: ['I\'ll never get it. {WorkMaster} makes it look so easy and it isn\'t.', 'Slowly. Very slowly. Like a snail learning to bake.'],
    child: ['It\'s the BEST. {WorkMaster} lets me hold things! Sometimes!', 'I\'m an apprentice! That\'s a real word! It means I\'m learning!'],
    'workLifeLessons>8 ^1': ['That\'s my {workLifeLessons}th lesson today. I\'m counting. {WorkMaster} isn\'t.', 'We\'ve had a good many lessons now. It\'s starting to stay in.'],
    'workLifeLessons<1 ^1': ['We\'ve hardly started! I\'ve been shown where the {workTool} lives. That\'s all so far.'],
    'workMasterTrade=baker': ['I can knead now. Properly, from the shoulder. My arms ache in new places.'],
    'workMasterTrade=farmer': ['I can tell a weed from a seedling. Mostly. Sorry, seedling.'],
    'workMasterTrade=brewer': ['I\'m allowed to stir! Not taste. Stir.'],
    'workMasterTrade=woodwright': ['I\'ve felled a sapling. A small one. It fell the right way, which is the main thing.'],
    'workMasterTrade=herbalist': ['I know eleven herbs by smell now. Twelve, if you count mint, and everyone does.'],
    'workMasterTrade=fisher': ['I can tie a fly! It doesn\'t look like a fly. The fish don\'t seem to mind.'],
    'workMasterTrade=tinker': ['I can solder! Burned only one finger. Two. The same one twice.'],
    'workMasterTrade=innkeeper': ['I can carry four mugs at once. Not full ones. Yet.'],
    'rift': ['Learning hill-folk ways the slow way. No manual, no download. Just {workMaster} and patience.'],
  });
  W('work.apprentice.habits', {
    _: ['{WorkMaster} hums when it\'s going well and goes very quiet when it isn\'t. You learn to listen.', 'Strict but fair. Mostly strict.'],
    cheerful: ['Oh, lovely! {WorkMaster} tells the same three jokes and I laugh every time. Nearly every time.'],
    ornery: ['{WorkMaster} has to do everything a particular way. A particular, slow way.', 'Fussy. If a thing\'s a hair out, we start again.'],
    shy: ['...Kind. {WorkMaster} never shouts. Just sighs. The sighs are worse.'],
    curious: ['{WorkMaster} has a reason for everything and won\'t tell me half of them. I write them down when I guess.'],
    dreamy: ['{WorkMaster} stops sometimes, mid-work, and just looks at it. I\'ve started doing it too.'],
    witty: ['{WorkMaster} says "that\'ll do" in nine different ways. Only one of them means it\'ll do.'],
    proud: ['Demanding. Which is right. I\'d not want to learn from somebody soft.'],
    gloomy: ['{WorkMaster} expects a great deal. I expect to disappoint. We\'re well matched.'],
    child: ['{WorkMaster} says "careful" about a hundred times. And "not like that". And "good".'],
    'stage=elder': ['{WorkMaster}\'s younger than me, you know. That takes some swallowing. Good teacher, though.'],
  });
  W('work.apprentice.learned', {
    _: ['How to hold the {workTool}. How to stand. How not to stand. That one took a while.', 'More than I knew there was to know. And that\'s only the start, they tell me.'],
    cheerful: ['Loads! I learned three things this morning and forgot only one of them.'],
    ornery: ['That most of it\'s waiting about. Nobody tells you about the waiting.'],
    shy: ['...To go slowly. And that it\'s all right to ask. I don\'t, much. But it\'s all right.'],
    curious: ['That every rule has a reason and every reason has a story. I\'m collecting the stories.'],
    dreamy: ['That the work has a feel to it. You stop thinking and start listening.'],
    witty: ['That there\'s a right way, a wrong way, and {workMaster}\'s way. They\'re all different.'],
    proud: ['The basics, and then some. {WorkMaster} says I\'ve a gift. Well. Implied it.'],
    gloomy: ['That I knew nothing before. Nothing at all. It\'s humbling.'],
    child: ['Loads! You have to wash your hands first. And THEN you can do the fun bit.'],
  });
  W('work.apprentice.touch', {
    _: ['The broom. I\'ve touched the broom a great deal.', 'Ha! Once. By mistake. We don\'t talk about it.'],
    cheerful: ['Yes! The broom, the bucket and once, for a whole minute, the good {workTool}!'],
    ornery: ['I\'ve swept that floor so often I could do it asleep. I have done it asleep.'],
    shy: ['...I\'m allowed to watch. Watching\'s important. {WorkMaster} says.'],
    witty: ['I\'m trusted with the things that can\'t break. Mostly myself.'],
    proud: ['Of course. I\'m past the broom stage, thank you.'],
    gloomy: ['The broom. Only the broom. Forever, probably.'],
    child: ['I touched the {workTool}! Once! When nobody was looking! Don\'t tell!'],
    curious: ['Everything, once. Some things twice. The second time I asked first.'],
    dreamy: ['I\'m let hold things now and then. It feels like holding a bird.'],
  });
  W('work.apprentice.voice', {
    _: ['*does a very good {workMaster}* "Not like that. Like THIS." ...Don\'t tell.', 'Only on Highdays. Ha! "Again. From the start."'],
    cheerful: ['Ha! "Steady, steady, SLOWLY!" That\'s {workMaster} exactly. Don\'t you dare tell.'],
    ornery: ['Might do. "Is that how I showed you?" Every blessed time.'],
    shy: ['*very quietly, a perfect {workMaster}* ...Oh, I shouldn\'t have.'],
    witty: ['I do the voice, the sigh AND the eyebrow. The eyebrow took months.'],
    proud: ['I would never. ...Well. "That\'ll do." There. Uncanny, isn\'t it.'],
    gloomy: ['I don\'t need to. I hear it in my sleep.'],
    child: ['"CAREFUL!" Hee! That\'s {workMaster}! I do it for my friends!'],
    curious: ['I\'ve got the words but not the hands. {WorkMaster} talks with the hands.'],
    dreamy: ['Sometimes I catch myself saying things in that voice without meaning to. It gets in you.'],
  });
  W('work.apprentice.mine', {
    _: ['*in a deep voice* "Ahem. Good morning." ...It\'s the hat, mostly.', 'Ha! "You shall not pass the butter." There. That\'s you.'],
    witty: ['*strokes an invisible beard* "Hmm. Interesting. Hmm." That\'s the whole act.'],
    shy: ['...I couldn\'t. You\'d know.'],
    child: ['*grumbly voice* "I am a WIZARD." Hee!'],
    proud: ['I don\'t do wizards. Too much beard.'],
  });
  W('work.apprentice.grumble', {
    _: ['...It\'s just. Nothing I do is ever quite right. Not quite.', '{WorkMaster} never says well done. Never. Not once.'],
    cheerful: ['Oh, I don\'t mind really. Only sometimes I wish {workMaster} would smile at it.'],
    ornery: ['I\'ll be honest. Some days I could throw the {workTool} in the river.'],
    shy: ['...I don\'t think {workMaster} likes me much.'],
    curious: ['I can\'t tell whether I\'m getting better. There\'s no way to measure it.'],
    dreamy: ['It\'s all so slow. I want to make something whole, and I\'m only let do the edges.'],
    witty: ['I\'ve been "nearly there" for a month. "Nearly there" is a lovely place. I\'d like to leave it.'],
    proud: ['I\'m better than {workMaster} lets on. I know I am.'],
    gloomy: ['I think {workMaster} wishes they\'d picked someone else.'],
    child: ['{WorkMaster} said I was too little for the good bits. I\'m NOT little.'],
  });
  W('work.apprentice.mistake', {
    _: ['I left the {workTool} out in the rain. It\'s been forgiven. Not forgotten.', 'I did the whole morning\'s work backwards. Neatly, though.'],
    cheerful: ['Ha! I fell in something. I\'d rather not say what. We laughed. Eventually.'],
    ornery: ['It wasn\'t my fault. Mostly. The thing was in the wrong place.'],
    shy: ['...I broke something. I hid it. Then I owned up. That was the worst bit.'],
    curious: ['I tried a shortcut I\'d thought of. There\'s a reason nobody uses it. A good reason.'],
    dreamy: ['I was watching the light on the water and forgot what I was doing. For an hour.'],
    witty: ['I invented a new way of doing it. {WorkMaster} invented some new words.'],
    proud: ['I don\'t make mistakes. I make lessons. ...It was a big lesson.'],
    gloomy: ['Which one? There\'s a long list.'],
    child: ['I spilled EVERYTHING. All of it. On {workMaster}\'s feet.'],
    'workMasterTrade=baker': ['I put salt in instead of sugar. A whole tray. The pigs were thrilled.'],
    'workMasterTrade=brewer': ['I left the bung out. The cellar smelled of ale for a week. Folk came to visit.'],
    'workMasterTrade=farmer': ['I weeded the carrots. All of them. I thought they were weeds.'],
    'workMasterTrade=woodwright': ['I sawed the plank I was sitting on. You can guess the rest.'],
    'workMasterTrade=herbalist': ['I mixed up the sleeping draft and the tonic. Old Mrs. Brockhouse had a very lively nap.'],
  });
  W('work.apprentice.finish', {
    _: ['When {workMaster} says so. Not before. I asked. I was told.', 'A season or two, they reckon. If I stop dropping things.'],
    cheerful: ['Soon, I hope! And then I\'ll have an apprentice and make THEM sweep.'],
    ornery: ['When I\'m as old as {workMaster}, at this rate.'],
    shy: ['...I don\'t know. I\'m not sure I want it to end. It\'s nice, being taught.'],
    curious: ['When the {workTool} feels like my own hand. I\'m told you just know.'],
    dreamy: ['One morning I\'ll wake and it\'ll be mine. That\'s how I picture it.'],
    witty: ['When {workMaster} runs out of things to correct. So never.'],
    proud: ['Sooner than anyone thinks.'],
    gloomy: ['If. Not when. If.'],
    child: ['When I\'m BIG. Then I\'ll do it all myself!'],
    'workLifeLessons>15 ^1': ['Soon, I think. {WorkMaster}\'s stopped hovering. That\'s a sign.'],
  });
  W('work.apprentice.fear', {
    _: ['...What if I\'m never as good? What if this is as good as I get?', '...{WorkMaster} is so good. I watch and think, I\'ll never. Not in a hundred years.'],
    ornery: ['...Fine. I\'m frightened I\'ll be ordinary. There. Happy?'],
    shy: ['...I\'m scared I\'ll let {workMaster} down. In front of everyone.'],
    proud: ['...If I\'m not the best at it, what am I? I don\'t know how to be second.'],
    gloomy: ['...I think I\'ve already got as good as I\'ll get. I just haven\'t told anyone.'],
    child: ['...What if I\'m only ever little at it?'],
    dreamy: ['...What if it never sings for me, the way it does for {workMaster}?'],
  });
  W('work.apprentice.lucky', {
    _: ['I am, aren\'t I? I forget, some mornings.', 'Lucky. Yes. Tell my aching back that.'],
    cheerful: ['The luckiest! I tell everyone.'],
    ornery: ['Hm. Lucky. I suppose so. Don\'t tell them I said.'],
    shy: ['...Yes. I know.'],
    proud: ['They\'re lucky to have me too. But yes.'],
    gloomy: ['Lucky. Yes. If I don\'t spoil it.'],
    child: ['I KNOW!'],
  });
  W('work.apprentice.laugh', {
    _: ['Ha! Thankfully not. Or I\'d still be hearing about it.', 'Ha! You\'re as bad as {workMaster}.'],
    child: ['Hee! A witch! I\'m a witch with a broom!'],
    ornery: ['Hmph. Very funny. ...It is a bit funny.'],
    witty: ['Ha! I\'ll tell {workMaster} the wizard approves of my broom work.'],
  });
  W('work.apprentice.seen', {
    _: ['...You think so? I\'d not thought of it like that.', 'Something in me. Huh. I\'ll hang on to that.'],
    shy: ['*goes pink* ...Do you really think so?'],
    ornery: ['Hm. Maybe. They could say so.'],
    gloomy: ['...Maybe. I\'ll try to believe it.'],
    child: ['Something in me? Like what? Like magic?'],
  });
  W('work.apprentice.askwhy', {
    _: ['Ask why. Ha. I will. Tomorrow, first thing.', 'They do love being asked, don\'t they? All right.'],
    proud: ['I don\'t like to look like I don\'t know. ...But all right.'],
    curious: ['Oh, I ask why ALL the time. Maybe I should listen to the answers.'],
    child: ['I always ask why! Grown-ups get cross!'],
  });
  W('work.apprentice.eased', {
    _: ['Only once. Right. I\'ve done it once. Never again.', 'That helps. It does.'],
    gloomy: ['Once. Let\'s hope.'],
    child: ['Only once! Okay!'],
  });
  W('work.apprentice.cat', {
    _: ['BLUE? For a month? What did your master say?', 'Ha! A blue cat! Oh, I\'d have paid to see that.'],
    child: ['A BLUE CAT! Can you do it again? To a dog?'],
    ornery: ['Ha. Well. That\'s worse than mine, I\'ll grant you.'],
    shy: ['*laughs, then covers mouth* Sorry. The poor cat.'],
  });
  W('work.apprentice.then', {
    _: ['Then I\'ll be the {workMasterTrade}. A proper one. Imagine.', 'Then I\'ll find out if I can do it without anyone watching.'],
    proud: ['Then they\'ll be coming to ME for it.'],
    dreamy: ['Then I\'ll make something of my own. Something nobody\'s seen.'],
    child: ['Then I\'ll be a grown-up and do it ALL DAY!'],
  });
  W('work.apprentice.believe', {
    _: ['...Better in my own way. I like that. Thank you, wizard.', '...I\'ll remember you said that. On the bad days.'],
    shy: ['*nods, and doesn\'t say anything for a while*'],
    proud: ['...My own way. Yes. That\'s right, isn\'t it?'],
    child: ['Better? Better than {workMaster}? Really?'],
  });
  W('work.apprentice.shared', {
    _: ['You? Still? ...That\'s oddly comforting.', 'Even wizards. Huh. Then I\'m in good company.'],
    gloomy: ['...If a wizard feels it, I suppose I\'m allowed to.'],
    child: ['You had a teacher? Was he scary?'],
  });

  // --- Masters --------------------------------------------------------------------
  addThread({
    id: 'work.master', label: (F) => (F.workApprentice ? `How's ${F.workApprentice} coming on?` : 'Your apprentice'), about: 'work', weight: 1.2, cool: 3,
    when: (F) => !!F.workApprentice,
    open: { ask: 'work.master.open' },
    beats: {
      start: { line: 'work.master.start', go: [
        { ap: 'ask', say: 'Have they the makings?', to: 'makings' },
        { ap: 'jest', say: 'Have they broken anything yet?', to: 'broken' },
        { ap: 'ask', say: 'And who taught you, once?', to: 'taught' },
      ] },
      makings: { line: 'work.master.makings', go: [
        { ap: 'ask', say: 'What do they do best?', to: 'best' },
        { ap: 'listen', say: '*You wait. They look as if they\'d say more.*', label: 'Wait', to: 'worry', need: { open: 2 }, soft: true },
        { ap: 'warm', say: 'They\'re lucky to have you.', to: 'lucky' },
      ] },
      broken: { line: 'work.master.broken', go: [
        { ap: 'jest', say: 'Apprentices are like puppies. Mostly chewing.', to: 'laugh' },
        { ap: 'ask', say: 'And how did you take it?', to: 'patience' },
      ] },
      taught: { line: 'work.master.taught', go: [
        { ap: 'ask', say: 'Were you a good apprentice?', to: 'wasgood' },
        { ap: 'warm', say: 'And now it\'s your turn to be remembered.', to: 'remembered' },
      ] },
      wasgood: { line: 'work.master.wasgood', go: [
        { ap: 'jest', say: 'So it\'s all coming back round to you.', to: 'laugh' },
        { ap: 'ask', say: 'And do you teach the way you were taught?', to: 'way' },
      ] },
      patience: { line: 'work.master.patience', go: [
        { ap: 'advise', say: 'Let them get it wrong. That\'s how it sticks.', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'wrong'] },
        { ap: 'comfort', say: 'Patience is a craft too. You\'re learning it.', to: 'craft' },
        { ap: 'ask', say: 'Have they the makings, though?', to: 'makings' },
      ] },
      best: { line: 'work.master.best', go: [
        { ap: 'advise', say: 'Tell them so. Out loud. Once a week.', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'tell'] },
        { ap: 'warm', say: 'Then you\'ve chosen well.', to: 'lucky' },
      ] },
      worry: { line: 'work.master.worry', fx: { confide: { k: 'work.master.worry', t: '{Name} half fears and half hopes {workApprentice} will outdo them' } }, go: [
        { ap: 'warm', say: 'That\'s the whole point of a master, isn\'t it?', to: 'point' },
        { ap: 'share', say: 'My pupils have outdone me. It\'s the best ache there is.', to: 'shared' },
      ] },
      way: { line: 'work.master.way', fx: { learn: ['work.master', '{Name} is teaching {workApprentice} the {jobWord}\'s trade.'] }, end: true },
      lucky: { line: 'work.master.lucky', fx: { fond: 0.01 }, end: true },
      laugh: { line: 'work.master.laugh', fx: { fond: 0.02 }, end: true },
      remembered: { line: 'work.master.remembered', fx: { fond: 0.02, trust: 0.01 }, end: true },
      wrong: { line: 'work.master.wrong', fx: { respect: 0.03 }, end: true },
      tell: { line: 'work.master.tell', fx: { respect: 0.03, promise: { k: 'work.master.tell', t: 'You told {name} to praise {workApprentice} out loud', days: 7 } }, end: true },
      bristle: { line: 'work.master.bristle', fx: { fond: -0.02, sore: { days: 1 } }, end: true },
      craft: { line: 'work.master.craft', fx: { trust: 0.02 }, end: true },
      point: { line: 'work.master.point', fx: { trust: 0.03, feel: 'drawn_out' }, end: true },
      shared: { line: 'work.master.shared', fx: { trust: 0.04, joke: { k: 'work.pupils', t: 'Being outdone is the best ache there is.' } }, end: true },
    },
    end: { fond: 0.01, respect: 0.01 },
  });
  W('work.master.open', {
    _: ['How\'s {workApprentice} coming on, {name}?', 'And how\'s your apprentice, {name}?', 'I hear you\'ve taken on {workApprentice}, {name}.'],
  });
  W('work.master.start', {
    _: ['{WorkApprentice}? Coming on. Slowly. Like good bread.', 'Better than I was at that age. Don\'t tell {workApprentice}.'],
    cheerful: ['Oh, a delight! A clumsy, chattering delight.', 'Coming on beautifully. I\'d forgotten how much fun it is to teach.'],
    ornery: ['Asks too many questions and listens to half the answers.', 'Coming on. When I can stop {workApprentice} doing it the quick way.'],
    shy: ['...Very well, I think. I\'m not used to being watched while I work.'],
    curious: ['Fascinating! You never know how you do a thing till you have to explain it.'],
    dreamy: ['It\'s strange. Watching someone learn it is like learning it again.'],
    witty: ['{WorkApprentice} has learned all my bad habits already. The good ones are proving harder.'],
    proud: ['Very well indeed. Mine is the best apprenticeship in the valley.'],
    gloomy: ['It\'s hard work, teaching. Harder than the work.'],
    'workLifeApprenticeChild ^1': ['Little {workApprentice}! Comes along after school, all elbows and questions.'],
    'workLevel=master ^1': ['I\'ve waited years to have someone to pass it on to. {WorkApprentice} will do nicely.'],
    'stage=elder': ['It\'s time I passed it on. These hands won\'t do it forever. {WorkApprentice}\'s will.'],
  });
  W('work.master.makings', {
    _: ['The makings? Yes. Good hands. The head\'ll follow.', 'More than I had. Less patience, mind.'],
    cheerful: ['Oh, every bit! I can see it already.'],
    ornery: ['The makings, yes. The sense, not yet.'],
    shy: ['...I think so. I hope I\'m not spoiling it.'],
    curious: ['I\'m not sure yet. That\'s the interesting part.'],
    dreamy: ['There\'s a feel for it. You can\'t teach that. You can only notice it.'],
    witty: ['The makings of something. We\'ll find out what.'],
    proud: ['Of course. I\'d not have taken on anyone without them.'],
    gloomy: ['Perhaps. It\'s early. It\'s always early until it\'s too late.'],
  });
  W('work.master.broken', {
    _: ['Only a {workTool} and my patience. The {workTool} mended.', 'One or two things. All small. One medium.'],
    cheerful: ['Ha! Everything! And apologized so sweetly each time.'],
    ornery: ['What hasn\'t {workApprentice} broken? Go on. Name one thing.'],
    shy: ['...Only a little. I didn\'t mind. Much.'],
    witty: ['Several things, and one record. Fastest breakage in the valley.'],
    proud: ['Nothing that matters. I don\'t let them near what matters. Yet.'],
    gloomy: ['My good {workTool}. I\'d had it forty years.'],
    curious: ['A few. Each in a new way. It\'s almost impressive.'],
    dreamy: ['A cup. We laughed. Then we swept it up together.'],
  });
  W('work.master.taught', {
    _: ['Old {workParentName}. Same trade. I still hear the telling-off in my head.', 'Nobody, really. I taught myself and paid for every lesson.'],
    'workFamilyTrade ^1': ['{WorkParentName} did, same hands, same trade. And now I\'m doing it to someone else.'],
    cheerful: ['A dear old soul who sang the whole time. I sing now. {WorkApprentice} hates it.'],
    ornery: ['A hard one. Hard and right. I\'m softer. Don\'t tell anyone.'],
    shy: ['...Someone patient. I try to be as patient. It\'s harder than it looked.'],
    curious: ['Everyone a little. I asked questions till they gave in.'],
    proud: ['I learned from the best. Now {workApprentice} does.'],
    gloomy: ['Someone who\'s gone, now. You don\'t know what you had.'],
    'stage=elder': ['So long ago. I was younger than {workApprentice} is. Fancy.'],
  });
  W('work.master.wasgood', {
    _: ['Dreadful! I talked back, I dropped things, I knew best. Of course I did.', 'Ha! No. I was the sort I\'m now teaching.'],
    proud: ['Excellent. Which is why I\'m so hard to please.'],
    shy: ['...Quiet. I never asked anything. I wish I had.'],
    witty: ['I was a cautionary tale. They still tell me.'],
    gloomy: ['I didn\'t think so then. I don\'t think so now.'],
    cheerful: ['Awful! Lovely, but awful.'],
  });
  W('work.master.way', {
    _: ['Mostly. Kinder, I hope. The shouting never helped.', 'The same words. A softer voice. That\'s the change.'],
    ornery: ['Exactly the same. It worked, didn\'t it?'],
    shy: ['...I try to explain things. Nobody explained things to me.'],
    curious: ['No! I try everything. Whatever sticks.'],
    proud: ['Better. Of course better.'],
    gloomy: ['I hear myself sounding like them. It\'s unsettling.'],
  });
  W('work.master.patience', {
    _: ['Badly, at first. Then I remembered being young. Then better.', 'I counted to ten. Then twenty. Then I made a cup of tea.'],
    cheerful: ['I laughed! What else can you do?'],
    ornery: ['I said a few things. Then I said sorry. Then a few more things.'],
    shy: ['...I didn\'t say anything. I just fixed it. I should have said something.'],
    proud: ['Calmly. I\'m always calm. ...Mostly calm.'],
    gloomy: ['I went for a walk. A long one.'],
  });
  W('work.master.best', {
    _: ['Listening. When {workApprentice} actually listens, I could cry.', 'The finishing. {WorkApprentice} has a lovely finish. Better than mine.'],
    cheerful: ['Laughing it off! Gets it wrong, laughs, tries again.'],
    ornery: ['Turning up. I\'ll give {workApprentice} that. Always turns up.'],
    curious: ['Asking the right question. Not the most questions. The right one.'],
    dreamy: ['Seeing what a thing wants to be. You can\'t teach that.'],
    proud: ['Doing it my way. Which is the right way.'],
    gloomy: ['Not giving up. I nearly did, at that age.'],
    shy: ['...Being kind to the work. Gentle. Some never learn that.'],
    witty: ['Finding new ways to make me look good.'],
  });
  W('work.master.worry', {
    _: ['...Between us? {WorkApprentice} will be better than me one day. And I\'m glad. And I\'m not.', '...Some days I want {workApprentice} to fail, just a little. Isn\'t that awful?'],
    proud: ['...I\'ve been the best for a long time. I don\'t know who I am if I\'m not.'],
    gloomy: ['...When {workApprentice}\'s ready, there\'ll be nothing left for me to do.'],
    shy: ['...I\'m afraid I\'m teaching it wrong and {workApprentice} won\'t tell me.'],
    ornery: ['...I\'m getting old, wizard. That\'s all. That\'s all it is.'],
    cheerful: ['...I hope I see the day {workApprentice} makes something better than I ever did.'],
  });
  W('work.master.lucky', {
    _: ['Ha! Tell {workApprentice} that. Loudly.', 'Lucky. Maybe. We\'re lucky in each other.'],
    proud: ['Very lucky. I\'m glad someone said it.'],
    shy: ['...Do you think so?'],
    gloomy: ['I hope they think so.'],
  });
  W('work.master.laugh', {
    _: ['Ha! Puppies! That\'s exactly it. With aprons.', 'Ha! You\'ve had an apprentice, haven\'t you.'],
    ornery: ['Puppies. Hmph. Puppies learn faster.'],
    witty: ['Puppies at least fetch things. Mine fetches the wrong things.'],
  });
  W('work.master.remembered', {
    _: ['...I hadn\'t thought of it like that. That\'s a nice thought.', 'Remembered. Well. I\'d like that.'],
    gloomy: ['...If I\'m any good, perhaps.'],
    proud: ['I mean to be.'],
  });
  W('work.master.wrong', {
    _: ['Let them get it wrong. Hm. That\'s harder than it sounds. I\'ll try.', 'Yes. I did. Every mistake I made, I still remember.'],
    curious: ['Oh, that\'s clever. The wrong stays with you longer.'],
    cheerful: ['Ha! I\'ll sit on my hands and watch.'],
  });
  W('work.master.tell', {
    _: ['Out loud? Once a week? ...All right. I\'ll try. Don\'t laugh.', 'You\'re right. I never do. I just think it.'],
    shy: ['...Out loud. Goodness. I\'ll try.'],
    cheerful: ['Oh, every day! Why not?'],
  });
  W('work.master.bristle', {
    _: ['I\'ll teach my apprentice my way, thank you, wizard.', 'I didn\'t ask for lessons in teaching.'],
    proud: ['I know how to bring on an apprentice. I was one.'],
    ornery: ['Oh, aye. Coddle them. That\'s how you get soft work.'],
  });
  W('work.master.craft', {
    _: ['A craft. Ha. I\'m an apprentice at it, then.', 'Patience as a craft. I like that. I\'m not good at it.'],
    gloomy: ['Then I\'m a poor craftsman.'],
    witty: ['And who\'s my master at patience? You?'],
  });
  W('work.master.point', {
    _: ['...It is, isn\'t it. That\'s the whole point.', '...Yes. Yes, it is. Thank you.'],
    proud: ['...Then I\'ll make sure they outdo me properly.'],
    shy: ['*nods slowly*'],
  });
  W('work.master.shared', {
    _: ['The best ache. Ha. That\'s it exactly.', 'Your pupils? Wizards have pupils? ...Of course they do.'],
    curious: ['Who were they? Did they turn anyone\'s cat blue?'],
    gloomy: ['An ache\'s still an ache. But I\'ll take it.'],
  });

  // --- Rivals ---------------------------------------------------------------------
  addThread({
    id: 'work.rival', label: (F) => (F.workRival ? `You and ${F.workRival}` : 'Your rival'), about: 'work', weight: 1.1, cool: 3,
    when: (F) => !!F.workRival && F.stage !== 'child',
    rel: (F) => (F.season === 'autumn' || F.workMarket ? 1.6 : 1.1),
    open: { jest: 'work.rival.open' },
    beats: {
      start: { line: 'work.rival.start', go: [
        { ap: 'ask', say: 'What is it about {workRival}?', to: 'what' },
        { ap: 'jest', say: 'work.rival.stoke', label: 'Stir it up a little', to: 'stoked' },
        { ap: 'advise', say: 'Shake hands with them. Life\'s short.', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'shake'] },
      ] },
      what: { line: 'work.rival.what', go: [
        { ap: 'ask', say: 'And what does {workRival} do better?', to: 'better', need: { open: 1 }, soft: true },
        { ap: 'listen', say: '*You let them get it off their chest.*', label: 'Let them get it off their chest', to: 'vent' },
        { ap: 'jest', say: 'work.rival.stoke', label: 'Stir it up a little', to: 'stoked' },
      ] },
      stoked: { line: 'work.rival.stoked', go: [
        { ap: 'jest', say: 'I\'d hate to be {workRival} at the {workLifeFair}.', to: 'fired' },
        { ap: 'warm', say: 'I\'m teasing. Yours is the better {workRivalThing}.', to: 'soothed' },
        { ap: 'ask', say: 'What would winning mean to you?', to: 'winning' },
      ] },
      vent: { line: 'work.rival.vent', go: [
        { ap: 'comfort', say: 'You\'ve nothing to prove. Not to {workRival}.', to: 'soothed' },
        { ap: 'ask', say: 'Do you like them, underneath?', to: 'underneath', need: { open: 2 }, soft: true },
        { ap: 'ask', say: 'What would winning mean to you?', to: 'winning' },
      ] },
      better: { line: 'work.rival.better', fx: { respect: 0.02 }, go: [
        { ap: 'advise', say: 'Tell them so. At the fair. In front of everyone.', to: 'shake' },
        { ap: 'jest', say: 'I\'ll not breathe a word to {workRival}. Much.', to: 'tease' },
      ] },
      winning: { line: 'work.rival.winning', fx: { learn: ['work.rival', '{Name} means to win {workRivalWhat} from {workRival}.'] }, go: [
        { ap: 'warm', say: 'Then I hope you win. Fairly.', to: 'fairly' },
        { ap: 'ask', say: 'And if you lose?', to: 'lose' },
      ] },
      underneath: { line: 'work.rival.underneath', fx: { confide: { k: 'work.rival.like', t: '{Name} rather likes {workRival}, underneath it all', secret: true } }, go: [
        { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'safe' },
        { ap: 'advise', say: 'Then shake on it at the fair. Call it a draw.', to: 'shake' },
      ] },
      lose: { line: 'work.rival.lose', go: [
        { ap: 'comfort', say: 'Then there\'s next year. There\'s always next year.', to: 'soothed' },
        { ap: 'jest', say: 'Then you sulk magnificently, I expect.', to: 'fired' },
      ] },
      shake: { line: 'work.rival.shake', fx: { respect: 0.04, run: (T, v) => { const o = v.rival != null ? personById(v.rival) : null; if (o) v.bond(o, 0.04); }, remember: 'The wizard says I should shake {workRival}\'s hand.', rv: 0 }, end: true },
      bristle: { line: 'work.rival.bristle', fx: { fond: -0.02, sore: { days: 1 } }, end: true },
      fired: { line: 'work.rival.fired', fx: { fond: 0.02, drive: { bored: -0.1 } }, end: true },
      soothed: { line: 'work.rival.soothed', fx: { trust: 0.02 }, end: true },
      tease: { line: 'work.rival.tease', fx: { fond: 0.01 }, end: true },
      fairly: { line: 'work.rival.fairly', fx: { fond: 0.02 }, end: true },
      safe: { line: 'work.rival.safe', fx: { trust: 0.05, promise: { k: 'work.rival.secret', t: 'You promised not to tell {workRival} that {name} likes them', days: 30 } }, end: true },
    },
    end: { fond: 0.01 },
  });
  W('work.rival.open', {
    _: ['I hear you and {workRival} have a contest on, {name}.', 'How\'s the old rivalry, {name}? Still going strong?', 'And {workRival}, {name}? Still at daggers drawn?'],
  });
  W('work.rival.stoke', {
    _: ['I hear {workRival} says yours is the second-best {workRivalThing}.', 'I tasted {workRival}\'s. Very good. Very, very good.'],
    'workRivalLead=behind': ['{WorkRival} was telling everyone about last time. Again.'],
    'workRivalLead=ahead': ['{WorkRival} says your win was luck. Loudly.'],
  });
  W('work.rival.start', {
    _: ['{WorkRival}. Don\'t say the name. I can feel my ears go hot.', 'Oh, {workRival} and me go back a long way. Down a muddy road.'],
    cheerful: ['Ha! {WorkRival}! Best enemy I ever had. I mean that kindly. Mostly.'],
    ornery: ['{WorkRival} thinks they\'re the best at it. They\'re not. I am. There.', 'Don\'t talk to me about {workRival}. Every fair, the same smug face.'],
    shy: ['...{WorkRival} is very good. I try hard. It\'s just... I\'d like to win once.'],
    curious: ['{WorkRival} does something I can\'t work out. I\'ve watched. I\'ll find it.'],
    dreamy: ['It\'s a sort of dance, {workRival} and me. Round and round, every fair.'],
    witty: ['{WorkRival} and I have an understanding. I\'m better, and they don\'t understand it.'],
    proud: ['There\'s no contest. Though {workRival} keeps entering, bless them.'],
    gloomy: ['{WorkRival} will win again. They always do. I\'ll enter anyway.'],
    'workRivalLead=ahead ^1': ['I\'m ahead! {WorkRival} knows it, too. You can see it in the walk.', 'I beat {workRival} last time, and I\'ll do it again. Fair and square.'],
    'workRivalLead=behind ^1': ['{WorkRival}\'s ahead. For now. FOR NOW.', 'Beaten by {workRival} again. I\'ve not been able to look at a {workRivalThing} since.'],
    'workRivalLead=level ^1': ['Neck and neck, {workRival} and me. The next fair settles it.'],
    'season=autumn': ['The Harvest Fair\'s coming, and so is {workRival}\'s face. Smug as a full cat.'],
    'workMarket': ['Market day! The show\'s this afternoon. {WorkRival}\'s been up since dawn, I\'ll bet.'],
    'season=summer': ['The market-day shows have started. {WorkRival}\'s been strutting since Trewsday.'],
    'season=winter': ['A whole winter before the next fair. {WorkRival} will be plotting. So will I.'],
    'stage=elder': ['{WorkRival} and me have been at it since we were in short trousers. Neither of us will stop now.'],
    'rift': ['{WorkRival}\'s got the edge. For now. I\'m running diagnostics on their technique.'],
  });
  W('work.rival.what', {
    _: ['It\'s the way {workRival} looks at my {workRivalThing}. Like it\'s a nice try.', 'We started out together. Then {workRival} got good. Then I got better. Then it got silly.'],
    cheerful: ['Oh, it\'s nothing really! Except everything. Except the {workRivalThing}.'],
    ornery: ['{WorkRival} cheats. I can\'t prove it. But I know.', 'It\'s the smugness. The smugness and the eyebrows.'],
    shy: ['...They never notice me till the fair. Then they notice.'],
    curious: ['I want to know how {workRival} does it. And then do it better.'],
    dreamy: ['We\'re two halves of the same thing, I sometimes think. Annoying halves.'],
    witty: ['{WorkRival} once said my {workRivalThing} was "brave". BRAVE.'],
    proud: ['Somebody has to keep {workRival} honest. It falls to me.'],
    gloomy: ['{WorkRival} wins at everything. I\'m used to it. I\'m not used to it.'],
    'workRivalLead=behind': ['{WorkRival} beat me last time and hasn\'t stopped mentioning it. At weddings. At funerals.'],
    'workRivalLead=ahead': ['I beat {workRival} fair and square and they still say the judges were dazzled by my hat.'],
  });
  W('work.rival.stoked', {
    _: ['Second-best! SECOND-BEST? Oh, I\'ll show {workRival} second-best!', 'Did they now. Did they now. Right.'],
    cheerful: ['Ha! The cheek! I\'ll bake... I\'ll grow... I\'ll do something enormous!'],
    ornery: ['I knew it. I KNEW it. The snake.'],
    shy: ['...Did they really say that? Oh.'],
    curious: ['Did they? Exactly those words? Who else heard?'],
    dreamy: ['Second-best. Hm. I\'ll make one so good it makes {workRival} cry.'],
    witty: ['Second-best is still best at being second. ...No, I\'m furious.'],
    proud: ['They\'ll eat those words. With gravy.'],
    gloomy: ['...Well. They\'re probably right.'],
  });
  W('work.rival.fired', {
    _: ['Ha! You wicked old wizard. I\'m going to win now just to spite them.', 'You\'re enjoying this, aren\'t you? So am I.'],
    shy: ['...I might actually win this year. I might.'],
    ornery: ['Hmph. You\'ll see. Everyone will see.'],
    gloomy: ['...Maybe I will enter after all.'],
    witty: ['If I win, I\'ll thank you in my speech. If I lose, I\'ll blame you in it.'],
  });
  W('work.rival.soothed', {
    _: ['...That\'s kind. I\'ll try to remember it\'s only a {workRivalThing}.', 'Hm. You\'re right. It\'s only the fair.'],
    ornery: ['Hmph. ...Thank you.'],
    shy: ['...Thank you. I needed that.'],
    proud: ['I know. But it\'s nice to hear.'],
    gloomy: ['...All right. Nothing to prove. I\'ll try.'],
  });
  W('work.rival.vent', {
    _: ['And they WAVE at me! At the fair! A little wave, like we\'re friends!', 'Every year. Every single year. And everyone says how close it was.'],
    ornery: ['And folk say we\'re "alike". ALIKE. I\'ll give them alike.'],
    shy: ['...I practice for months. They just seem to do it. It isn\'t fair.'],
    proud: ['And the judges! Don\'t get me started on the judges.'],
    gloomy: ['It doesn\'t matter how good I get. {WorkRival} is always just a little better.'],
    cheerful: ['And they\'re ever so nice about it! Which makes it worse!'],
    witty: ['I\'ve composed several speeches for when I win. And one for {workRival}\'s face.'],
    curious: ['I\'ve tried everything. Different ways, different days. Still {workRival}.'],
    dreamy: ['Sometimes I dream I\'ve won and {workRival} shakes my hand. Then I wake up.'],
  });
  W('work.rival.better', {
    _: ['...Oh, all right. {WorkRival}\'s patient. Patient where I\'m quick.', '...Fine. Their {workRivalThing}s are good. Very good. Don\'t you dare repeat that.'],
    ornery: ['...Nothing. Everything. Oh, they\'ve a lighter touch. There.'],
    shy: ['...Everything. That\'s the trouble.'],
    proud: ['...They don\'t rush. I rush. I\'ll deny saying it.'],
    gloomy: ['...All of it. I just try harder.'],
    curious: ['That\'s what I\'m trying to find out! Something in the timing.'],
    dreamy: ['...They make it look like it was always going to be that way. Like it grew.'],
    witty: ['Being {workRival}. It\'s a talent. It\'s their only one.'],
    cheerful: ['Oh, loads! They\'re ever so good. I just want to be gooder.'],
  });
  W('work.rival.winning', {
    _: ['Winning? Just once. Just to see {workRival}\'s face. Then I\'d retire happy.', 'It\'d mean I\'m as good as I think I am. That\'s all.'],
    shy: ['...It\'d mean folk would know my name. Just for a day.'],
    proud: ['It\'d mean the world was in its right order.'],
    dreamy: ['A ribbon on the mantelpiece. And a story to tell grandchildren.'],
    gloomy: ['It\'d mean I wasn\'t wrong to keep trying.'],
    ornery: ['It\'d mean {workRival} would shut up for a whole year.'],
    witty: ['It\'d mean I could be gracious. I\'ve been practicing gracious.'],
    cheerful: ['It\'d mean a party! A party in MY honor!'],
    curious: ['It\'d mean I\'d cracked it. Whatever it is.'],
  });
  W('work.rival.lose', {
    _: ['Then I\'ll lose. And start the next one the morning after.', 'Lose? I\'ve had practice.'],
    proud: ['I won\'t.'],
    gloomy: ['Then it\'ll be like every other year.'],
    ornery: ['Then I\'ll know it was rigged.'],
  });
  W('work.rival.underneath', {
    _: ['...Don\'t tell a soul. I\'d miss {workRival} terribly if they stopped. Who else would I beat?', '...I like them. There. If anything happened to {workRival} I\'d be first at the door.'],
    ornery: ['...{WorkRival} brought me soup when I was poorly. Didn\'t say a word. Just soup.'],
    proud: ['...They\'re the only one who\'s ever been worth beating.'],
    shy: ['...We used to be friends. Before the fairs. I miss it a bit.'],
    gloomy: ['...They\'re the only one who takes my work seriously.'],
  });
  W('work.rival.shake', {
    _: ['Shake hands? With {workRival}? ...Maybe. After the fair. If I win.', 'Hm. A handshake. It would take the wind out of them. I like that.'],
    cheerful: ['Ha! Why not? I\'ll shake so hard their teeth rattle.'],
    shy: ['...I\'d like that. I don\'t know if they would.'],
    curious: ['I wonder what they\'d do. I\'d quite like to find out.'],
    dreamy: ['A draw. Like the end of a story. Yes.'],
    witty: ['Shake hands. And then watch them count their fingers.'],
    gloomy: ['They\'d probably laugh. ...I might, though.'],
  });
  W('work.rival.bristle', {
    _: ['Shake hands? I\'ll shake hands when I\'ve won and not before.', 'Life\'s short, is it? Then I\'d best win quickly.'],
    proud: ['I don\'t concede to {workRival}. Ever.'],
    ornery: ['Whose side are you on, wizard?'],
  });
  W('work.rival.tease', {
    _: ['Not a word! Or I\'ll tell everyone about your hat.', 'Ha! You\'d better not.'],
    ornery: ['You breathe one word and I\'ll... I\'ll be very cross.'],
  });
  W('work.rival.fairly', {
    _: ['Fairly. Of course fairly. ...Mostly fairly.', 'I\'ll win so fairly they\'ll have to admit it.'],
    witty: ['Fairly. The most annoying way to win.'],
    proud: ['There\'s no other way to win.'],
  });
  W('work.rival.safe', {
    _: ['Thank you. If {workRival} ever found out I\'d have to move to Bree.', 'Not a word. I mean it.'],
    shy: ['...Thank you.'],
    ornery: ['It had better be.'],
  });

  // --- No trade -------------------------------------------------------------------
  addThread({
    id: 'work.idle', label: 'What do you do with your days?', about: 'work', weight: 1, cool: 4,
    when: (F) => !F.job && !F.workRetired && F.stage === 'grown',
    open: { ask: 'work.idle.open' },
    beats: {
      start: { line: 'work.idle.start', go: [
        { ap: 'ask', say: 'Would you like a trade?', to: 'want' },
        { ap: 'jest', say: 'A hobbit of leisure! I envy you.', to: 'leisure' },
        { ap: 'ask', say: 'And what fills the days?', to: 'days' },
      ] },
      want: { line: 'work.idle.want', go: [
        { ap: 'advise', say: 'Then go to the Steward and say so.', to: 'steward' },
        { ap: 'advise', say: 'Watch someone at it first. Learn by looking.', to: 'watch' },
        { ap: 'listen', say: '*You wait. There\'s more to it.*', label: 'Wait for more', to: 'useless', need: { open: 1 }, soft: true },
      ] },
      leisure: { line: 'work.idle.leisure', go: [
        { ap: 'ask', say: 'Do you like it, though? Truly?', to: [{ to: 'freedom', need: { if: { temper: ['cheerful', 'dreamy', 'witty'] } } }, 'useless'] },
        { ap: 'jest', say: 'Teach me the trick of it. Wizards never stop.', to: 'trick' },
      ] },
      days: { line: 'work.idle.days', go: [
        { ap: 'warm', say: 'That\'s work too, of a kind.', to: 'kind' },
        { ap: 'ask', say: 'Would you like a trade, though?', to: 'want' },
        { ap: 'share', say: 'I\'ve no trade either, you know. Just a hat and a habit.', to: 'swap' },
      ] },
      useless: { line: 'work.idle.useless', fx: { confide: { k: 'work.idle.useless', t: '{Name} feels a bit useless without a trade' } }, go: [
        { ap: 'comfort', say: 'Nobody\'s worth is in their trade, {name}.', to: 'comforted' },
        { ap: 'advise', say: 'Then do odd jobs. Every lane needs a pair of willing hands.', to: 'oddjobs' },
      ] },
      freedom: { line: 'work.idle.freedom', go: [
        { ap: 'warm', say: 'Then enjoy every minute of it.', to: 'enjoy' },
        { ap: 'ask', say: 'And if the village needed you?', to: 'want' },
      ] },
      swap: { line: 'work.idle.swap', fx: { trust: 0.02 }, go: [
        { ap: 'jest', say: 'Meddling, mostly. It\'s very skilled.', to: 'meddle' },
        { ap: 'ask', say: 'So. Would you like a trade?', to: 'want' },
      ] },
      steward: { line: 'work.idle.steward', fx: { respect: 0.03, remember: 'The wizard thinks I should ask the Steward for a trade.', rv: 1 }, end: true },
      watch: { line: 'work.idle.watch', fx: { respect: 0.02, queue: 'stroll', learn: ['work.idle', '{Name} has no trade yet, and has a feel for the {workLifeFit}\'s work.'] }, end: true },
      comforted: { line: 'work.idle.comforted', fx: { trust: 0.03, fond: 0.02, feel: 'drawn_out' }, end: true },
      oddjobs: { line: 'work.idle.oddjobs', fx: { respect: 0.02, queue: 'work_odd' }, end: true },
      enjoy: { line: 'work.idle.enjoy', fx: { fond: 0.02 }, end: true },
      trick: { line: 'work.idle.trick', fx: { fond: 0.02 }, end: true },
      kind: { line: 'work.idle.kind', fx: { fond: 0.02 }, end: true },
      meddle: { line: 'work.idle.meddle', fx: { joke: { k: 'work.meddle', t: 'The wizard\'s trade is meddling. Very skilled.' }, fond: 0.02 }, end: true },
    },
    end: { fond: 0.01 },
  });
  W('work.idle.open', { _: ['What do you do with your days, {name}?', 'No trade for you yet, {name}?', 'How do you pass the days, {name}?'] });
  W('work.idle.start', {
    _: ['Oh, this and that. I\'ve no trade, as such.', 'Nothing much. The village hasn\'t found a use for me yet.'],
    cheerful: ['Whatever comes along! No trade, no master, no early mornings. It\'s glorious. Mostly.'],
    ornery: ['Nothing, apparently. Nobody\'s asked me. Not once.'],
    shy: ['...I help where I\'m wanted. Which isn\'t often.'],
    curious: ['Everything! A bit of everything. I\'m trying the whole valley on for size.'],
    dreamy: ['I wander. Watch the river. Think. It\'s a sort of trade, if you squint.'],
    witty: ['I\'m between trades. I\'ve been between them for some time. It\'s roomy.'],
    proud: ['I\'m waiting for the right trade. I won\'t take just any.'],
    gloomy: ['Nothing. That\'s the long and short of it. Nothing.'],
    'workLifeIdleDoes': ['{WorkLifeIdleDoes}, mostly. It passes the time.'],
    'rift': ['No job. Back in Neverdark I had three. Here nobody knows what to do with me.'],
  });
  W('work.idle.want', {
    _: ['I would. I think I\'d be good at the {workLifeFit}\'s work, if anyone asked.', 'A trade? Yes. Something to get up for.'],
    cheerful: ['Ooh, yes! I\'d love to be the {workLifeFit}. Can you imagine?'],
    ornery: ['I\'d have one if anyone thought to ask. The {workLifeFit}\'s work. I\'d be good at it.'],
    shy: ['...Maybe the {workLifeFit}\'s. If they\'d have me. I don\'t like to push.'],
    curious: ['I keep watching the {workLifeFit}. There\'s so much to it.'],
    dreamy: ['I\'ve always fancied the {workLifeFit}\'s work. It looks peaceful, from the hedge.'],
    witty: ['I\'d make a passable {workLifeFit}. Passable is underrated.'],
    proud: ['The {workLifeFit}\'s, and I\'d be the best this valley\'s seen.'],
    gloomy: ['What would I be good for? ...The {workLifeFit}, maybe. Maybe.'],
    'rift': ['Give me something with wires. Or the {workLifeFit}. I\'m not fussy. I\'m a bit fussy.'],
  });
  W('work.idle.leisure', {
    _: ['Ha! Don\'t. It sounds grand but the days are long.', 'Envy away! ...It\'s not all naps.'],
    cheerful: ['It IS lovely! I\'ve had three naps today and it\'s not dinner.'],
    ornery: ['Envy me? Try being asked "and what do YOU do" at every table.'],
    shy: ['...It\'s quieter than it looks.'],
    witty: ['I\'m very busy doing nothing. It takes it out of you.'],
    proud: ['Leisure? I\'m not idle. I\'m available.'],
    gloomy: ['Envy me. Go on. It doesn\'t take long.'],
    dreamy: ['Leisure. Yes. I watched a heron for an hour this morning.'],
    curious: ['It\'s good for finding things out. I know where everyone keeps their spare key.'],
  });
  W('work.idle.days', {
    _: ['{WorkLifeIdleDoes}, and helping with the heavy things when someone calls.', 'A bit of help here, a bit there. Carrying things, mostly.'],
    cheerful: ['I help whoever\'s busiest! Yesterday the baker, today the hens.'],
    ornery: ['Fetching and carrying for folk who have trades. Lovely.'],
    shy: ['...I tidy. I tidy a great deal.'],
    curious: ['Learning. I\'ve sat with half the trades in the valley, asking questions.'],
    dreamy: ['Walking. I know every path in the valley now. Every stile.'],
    witty: ['Supervising. Somebody has to watch everyone else work.'],
    proud: ['Keeping my hand in. I\'m ready when I\'m wanted.'],
    gloomy: ['Waiting. For something. I\'m not sure what.'],
  });
  W('work.idle.useless', {
    _: ['...Everyone has a trade. I have a chair by the window.', '...It\'s hard, at supper, when everyone talks about their day.'],
    ornery: ['...Fine. It galls me. Watching everyone else be needed.'],
    shy: ['...I don\'t think anyone would notice if I wasn\'t here.'],
    proud: ['...I\'m capable of so much more than they\'ve let me do.'],
    gloomy: ['...I feel like an extra spoon. Nice to have. Never used.'],
    cheerful: ['...Some days I laugh it off. Some days I don\'t.'],
    curious: ['...I know a bit of everything and none of it well enough to be asked.'],
    dreamy: ['...I wonder sometimes whether I\'m meant for something that isn\'t here.'],
    witty: ['...Jokes only go so far. They don\'t get you a trade.'],
  });
  W('work.idle.freedom', {
    _: ['Truly? I love it. No master, no bell. I can stop and look at a thing.', 'I like it. Don\'t tell the Steward.'],
    cheerful: ['Like it? I adore it! Every day\'s a holiday with chores.'],
    dreamy: ['I like the time. Time to see things. Most folk are too busy to see.'],
    witty: ['I\'m the only free hobbit in the valley. I\'d hate to spoil it with work.'],
  });
  W('work.idle.swap', {
    _: ['No trade! A wizard! What do you DO all day, then?', 'Ha! A hat and a habit. That\'s me, near enough.'],
    curious: ['Really? What\'s the habit? What do wizards do?'],
    shy: ['...So we\'re the same, a bit.'],
    ornery: ['Hm. A wizard without a trade. That explains a great deal.'],
  });
  W('work.idle.steward', {
    _: ['The Steward. Yes. I\'ll go and ask. What\'s the worst they can say?', 'All right. I\'ll put my name forward. Before I lose my nerve.'],
    shy: ['...Could I? Just walk up and ask? ...I\'ll try.'],
    proud: ['I shouldn\'t have to ask. But I will.'],
    gloomy: ['They\'ll say no. ...I\'ll ask anyway.'],
  });
  W('work.idle.watch', {
    _: ['Watch first. Yes. I can do that. I\'m good at watching.', 'I\'ll go and stand near the {workLifeFit} and look keen.'],
    curious: ['Oh, I\'d love that. I\'ll take a notebook.'],
    proud: ['Watching\'s for beginners. ...Fine. I\'m a beginner.'],
  });
  W('work.idle.comforted', {
    _: ['...Not in their trade. That\'s a kind thing to say.', '...Thank you. I\'ll try to believe it.'],
    ornery: ['Hmph. Easy for a wizard to say. ...Thank you.'],
    shy: ['*nods, eyes bright*'],
    gloomy: ['...Maybe. Maybe not. But thank you.'],
  });
  W('work.idle.oddjobs', {
    _: ['Odd jobs. Willing hands. ...Yes, all right. I\'ll go and find one now.', 'I could be the one everyone calls on. I\'d like that.'],
    cheerful: ['Ooh, the village handyhobbit! I\'ll need a hat.'],
    ornery: ['Hm. Better than sitting. I\'ll go and fix that gate.'],
  });
  W('work.idle.enjoy', { _: ['I shall! Every last idle minute.', 'Thank you. You\'re the first who hasn\'t told me to get a trade.'], cheerful: ['Every minute! I\'ll start with a nap in your honor.'], dreamy: ['I will. There\'s a heron I\'ve been meaning to watch all afternoon.'], witty: ['I\'ll enjoy it professionally. It\'s the closest I\'ll get to a trade.'] });
  W('work.idle.trick', { _: ['The trick is to look as if you\'re about to start something.', 'Ha! Sit down. Stay down. That\'s the trick.'], witty: ['Carry a bucket. Nobody questions a hobbit with a bucket.'], cheerful: ['Hum a tune. Folk think you\'re busy if you hum.'], ornery: ['The trick is nobody asking. I\'ve not mastered it.'], dreamy: ['Look at clouds. If anyone asks, you\'re reading the weather.'] });
  W('work.idle.kind', { _: ['...Of a kind. Yes. I suppose it is.', 'You\'re kind. That\'s a sort of trade too.'], gloomy: ['Of a kind. A small kind.'], cheerful: ['It is, isn\'t it! I\'ll tell folk I\'m in the helping trade.'], proud: ['It is work. Nobody else seems to see that.'], shy: ['...Thank you. Nobody\'s said that before.'] });
  W('work.idle.meddle', { _: ['Ha! Meddling! Is there an apprenticeship?', 'Meddling. That explains the hat.'], witty: ['I\'d be good at meddling. I\'ll put it to the Steward.'], ornery: ['Hmph. Meddling. I\'ve noticed.'], cheerful: ['Ha! Teach me! I\'ll meddle with the best of them.'] });

  // --- Retired -------------------------------------------------------------------------
  addThread({
    id: 'work.retired', label: (F) => (F.workRetired ? `Your years as the ${F.workRetired}` : 'Your old trade'), about: 'work', weight: 1.1, cool: 4,
    when: (F) => !!F.workRetired && !F.job,
    open: { warm: 'work.retired.open' },
    beats: {
      start: { line: 'work.retired.start', go: [
        { ap: 'ask', say: 'Do you miss it?', to: 'miss' },
        { ap: 'ask', say: 'And how\'s {workLifeSuccessor} doing at it?', to: 'young', need: { if: { workLifeSuccessor: has } } },
        { ap: 'jest', say: 'Enjoying the lie-ins, I hope?', to: 'lieins' },
      ] },
      miss: { line: 'work.retired.miss', go: [
        { ap: 'ask', say: 'What do you miss most?', to: 'most' },
        { ap: 'listen', say: '*You let the quiet go on a little.*', label: 'Let the quiet go on', to: 'quiet', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'Enjoying the lie-ins, at least?', to: 'lieins' },
      ] },
      young: { line: 'work.retired.young', go: [
        { ap: 'advise', say: 'Then go and show them. Kindly.', to: [{ to: 'pride', need: { if: { temper: ['proud', 'ornery'] } } }, 'teach'] },
        { ap: 'jest', say: 'In your day, I suppose, it was all done uphill.', to: 'uphill' },
        { ap: 'ask', say: 'And what do you miss most?', to: 'most' },
      ] },
      lieins: { line: 'work.retired.lieins', go: [
        { ap: 'ask', say: 'Do you still wake at the old hour?', to: 'hour' },
        { ap: 'jest', say: 'I\'ve been retired for centuries. It never takes.', to: 'laugh' },
        { ap: 'ask', say: 'And what do you miss most?', to: 'most' },
      ] },
      most: { line: 'work.retired.most', fx: { learn: ['work.retired', '{Name} was the {workRetired} for years, and misses it.'] }, go: [
        { ap: 'ask', say: 'Still got your old {workLifeOldTool}?', to: 'tool', need: { if: { workLifeOldTool: has } } },
        { ap: 'warm', say: 'They were lucky to have you all those years.', to: 'lucky' },
        { ap: 'advise', say: 'Walk past {workLifeOldPlace} now and then. Say hello to it.', to: 'walk', need: { if: { workLifeOldPlace: has } } },
      ] },
      hour: { line: 'work.retired.hour', go: [
        { ap: 'comfort', say: 'The body remembers what it loved.', to: 'loved' },
        { ap: 'ask', say: 'What do you miss most?', to: 'most' },
      ] },
      quiet: { line: 'work.retired.quiet', fx: { confide: { k: 'work.retired.lost', t: 'Since giving up the {workRetired}\'s work, {name} doesn\'t quite know who they are' } }, go: [
        { ap: 'comfort', say: 'You\'re the same hobbit. Just with softer hands.', to: 'comforted' },
        { ap: 'advise', say: 'Teach someone. It\'s all still in your hands.', to: 'teach' },
      ] },
      tool: { line: 'work.retired.tool', go: [
        { ap: 'warm', say: 'Keep it oiled. You never know.', to: 'oiled' },
        { ap: 'jest', say: 'Lend it to me. I\'ll take up the trade.', to: 'laugh' },
      ] },
      teach: { line: 'work.retired.teach', fx: { respect: 0.03, queue: 'stroll', promise: { k: 'work.retired.teach', t: 'You told {name} to pass on what they know of the {workRetired}\'s trade', days: 7 } }, end: true },
      pride: { line: 'work.retired.pride', fx: { fond: -0.01 }, end: true },
      uphill: { line: 'work.retired.uphill', fx: { fond: 0.02 }, end: true },
      laugh: { line: 'work.retired.laugh', fx: { fond: 0.02 }, end: true },
      lucky: { line: 'work.retired.lucky', fx: { fond: 0.02 }, end: true },
      walk: { line: 'work.retired.walk', fx: { queue: 'stroll', trust: 0.01 }, end: true },
      loved: { line: 'work.retired.loved', fx: { trust: 0.02 }, end: true },
      comforted: { line: 'work.retired.comforted', fx: { trust: 0.04, fond: 0.02, feel: 'drawn_out' }, end: true },
      oiled: { line: 'work.retired.oiled', fx: { fond: 0.01 }, end: true },
    },
    end: { fond: 0.02 },
  });
  W('work.retired.open', { _: ['You were the {workRetired} a good many years, {name}.', 'Tell me about your years as the {workRetired}, {name}.', 'Do you miss being the {workRetired}, {name}?'] });
  W('work.retired.start', {
    _: ['Oh, years and years. I was the {workRetired} before half this village was born.', 'The {workRetired}. Yes. I hung it up. It still feels like it\'s on the peg waiting.'],
    cheerful: ['The {workRetired}! Best years of my life. Now I\'ve got the second-best years, which are also lovely.'],
    ornery: ['I was the {workRetired}, and a proper one. Not like now.'],
    shy: ['...I was the {workRetired}. Nobody much remembers. That\'s all right.'],
    curious: ['The {workRetired}. And I still think of things I never tried. Funny.'],
    dreamy: ['Being the {workRetired}... it was like being part of the valley\'s clock.'],
    witty: ['I was the {workRetired}. Now I\'m an expert on how it should be done. Unpaid.'],
    proud: ['I was the finest {workRetired} this valley had. Ask anyone over sixty.'],
    gloomy: ['I was the {workRetired}. Was. That\'s the word now. Was.'],
    'workRetired=baker': ['I still wake at four, smelling bread that isn\'t there.'],
    'workRetired=farmer': ['I still look at the sky first thing and think, good drying day.'],
    'workRetired=fisher': ['I go down to the river and don\'t fish. Just look. The fish seem relieved.'],
    'workRetired=innkeeper': ['I sit on the customer side of the bar now. It\'s very strange. The stools are lower.'],
    'workRetired=postie': ['My feet still walk the round on their own. I end up at doors with nothing to give.'],
  });
  W('work.retired.miss', {
    _: ['Miss it? Every morning, for about a minute. Then I put the kettle on.', 'I miss being needed. The work, less. The being needed, a lot.'],
    cheerful: ['A little! But I\'ve got my garden and my pipe. I miss it in a nice way.'],
    ornery: ['Of course I miss it. Nobody does it right now.'],
    shy: ['...Yes. I miss the quiet of it. The rhythm.'],
    curious: ['I miss not knowing what the day would bring. Now I always know.'],
    dreamy: ['I miss the mornings. Being up before anyone. The valley all mine.'],
    witty: ['I miss the moaning. You can\'t moan about work when you\'ve none.'],
    proud: ['I miss doing something better than anyone else. It\'s a hard habit.'],
    gloomy: ['More than I thought I would. More than I\'d say.'],
  });
  W('work.retired.young', {
    _: ['{WorkLifeSuccessor}? Doing it all wrong, but getting there.', 'Well enough. Differently. I\'ve stopped saying so. Mostly.'],
    cheerful: ['Oh, {workLifeSuccessor}\'s grand! Much better than I was at that age.'],
    ornery: ['{WorkLifeSuccessor} does it the quick way. The quick way is the wrong way.'],
    shy: ['...I watch from the gate. I don\'t say anything. I want to.'],
    curious: ['{WorkLifeSuccessor} has new ideas. Some of them are even good.'],
    dreamy: ['It\'s strange, seeing someone else in my place. Like a song in a new voice.'],
    witty: ['{WorkLifeSuccessor} is making all my old mistakes. It\'s like watching my youth.'],
    proud: ['{WorkLifeSuccessor} tries. It\'s not the same. It can\'t be.'],
    gloomy: ['Fine. Better than fine. They don\'t need me at all.'],
  });
  W('work.retired.lieins', {
    _: ['Lie-ins! I wish. I\'m up before the cock, every day. Nothing to do. Just up.', 'Ha! I lie there awake, feeling guilty.'],
    cheerful: ['Oh, gloriously! I lie there and listen to everyone else go to work.'],
    ornery: ['The body doesn\'t know it\'s retired. Nobody told the body.'],
    witty: ['I\'ve been practicing lying in. I\'m getting quite good. Twenty minutes.'],
    gloomy: ['I can\'t sleep past dawn. Years of it. It\'s in the bones.'],
    dreamy: ['I lie and watch the light come in. I never saw it, working.'],
    proud: ['I don\'t lie in. A hobbit of my standing gets up.'],
    shy: ['...A little. I feel I oughtn\'t.'],
    curious: ['I\'ve tried. I\'ve worked out it\'s the birds. The birds have a job and I haven\'t.'],
  });
  W('work.retired.most', {
    _: ['The company. The folk who came by. You don\'t get that sitting at home.', 'The feel of it. The {workLifeOldTool} in my hand. Silly.'],
    cheerful: ['The chatter! Everyone stopped by. Now I have to go and find them.'],
    ornery: ['Being asked. Folk used to ASK me. Now they ask {workLifeSuccessor}.'],
    shy: ['...The work itself. Just the quiet doing of it.'],
    curious: ['The puzzles. Every day something to work out.'],
    dreamy: ['The way the day had a shape. Now it\'s all one long afternoon.'],
    witty: ['The excuse. "Can\'t, I\'m working." Best phrase ever invented.'],
    proud: ['Being the one. The one everyone relied on.'],
    gloomy: ['All of it. Even the bad bits. Especially the bad bits.'],
  });
  W('work.retired.hour', {
    _: ['Every day! On the dot. And then I lie there with nowhere to go.', 'Oh yes. The body\'s a creature of habit. Stubborn creature.'],
    gloomy: ['Every day. It\'s like a ghost knocking.'],
    witty: ['To the minute. I could set the church clock by me, if we had one.'],
  });
  W('work.retired.quiet', {
    _: ['...I was the {workRetired} so long. Now I don\'t know quite what I am.', '...Folk still call me the {workRetired}. I don\'t correct them. I like it.'],
    ornery: ['...You stop, and the valley carries on. Like you were never there.'],
    proud: ['...They\'ve forgotten already. Not the work. Me, doing it.'],
    gloomy: ['...Some days I feel like a hole in the hedge where a gate used to be.'],
    shy: ['...I don\'t know what to do with my hands.'],
    dreamy: ['...It\'s like a song stopped in the middle. I keep waiting for the next line.'],
  });
  W('work.retired.tool', {
    _: ['On the wall. I take it down and clean it. Then put it back. Every week.', 'Course I have. Above the mantel. Better than any picture.'],
    cheerful: ['Yes! I show it to everyone who visits. They\'re very patient.'],
    ornery: ['Course. And nobody else is to touch it.'],
    shy: ['...Under the bed. I take it out sometimes. Just to hold.'],
    dreamy: ['It\'s by the door. Ready. For what, I don\'t know.'],
    proud: ['Polished. Like the day I was given it.'],
    gloomy: ['In the shed. Rusting a bit. Like me.'],
    witty: ['I\'ve had it framed. It looks very distinguished. So do I.'],
  });
  W('work.retired.teach', {
    _: ['Teach someone... I\'d like that. I\'ll go and see who\'s keen.', 'Hm. There\'s a young one who hangs about. Perhaps.'],
    shy: ['...Would they want me? ...I\'ll ask.'],
    cheerful: ['Oh, yes! I\'ve a head full of it with nowhere to go!'],
    curious: ['Teach! I\'ve forgotten half of what I knew. I\'ll learn it again teaching.'],
    gloomy: ['They\'ll think me an old bore. ...I\'ll try.'],
  });
  W('work.retired.pride', {
    _: ['Show them? I\'ll not go poking in where I\'m not asked.', 'They\'ll come to me when they need me. Not before.'],
    ornery: ['They\'ve made their bed. Let them lie on it. Wrongly.'],
  });
  W('work.retired.uphill', { _: ['Uphill, both ways, in the snow! Ha! Nearly true.', 'Ha! Uphill, and we were grateful for the hill.'], ornery: ['It WAS uphill. Ask anyone.'], witty: ['Uphill both ways, and the hill charged rent.'], 'stage=elder': ['In my day the hills were bigger. They\'ve worn down since. From me walking on them.'] });
  W('work.retired.laugh', { _: ['Ha! You\'re a rogue.', 'Ha! You\'d be dreadful at it. Bless you.'], gloomy: ['Ha. ...That\'s cheered me, that has.'], ornery: ['Hmph. A wizard at the {workRetired}\'s trade. I\'d pay to watch.'], cheerful: ['Ha! Oh, I\'d love to see you try!'] });
  W('work.retired.lucky', { _: ['...We were lucky in each other, the village and me.', 'That\'s kind. I hope they think so.'], proud: ['They were. I\'m glad someone remembers.'], shy: ['...Do you think so? I only did the work.'], gloomy: ['...Do they remember, though?'] });
  W('work.retired.walk', { _: ['Say hello to it. Ha. ...I might. I\'ll go the long way round.', 'I\'ll walk past {workLifeOldPlace} this afternoon. Just to look.'] });
  W('work.retired.loved', { _: ['...It does, doesn\'t it. Funny thing.', 'What it loved. Yes. That\'s it exactly.'], shy: ['...Yes.'], dreamy: ['The body remembers. Like a tune you can\'t stop humming.'], ornery: ['Loved. Hm. ...Aye. Maybe.'] });
  W('work.retired.comforted', { _: ['Softer hands. Ha. ...Thank you, wizard.', '...The same hobbit. I\'ll try to remember.'], ornery: ['Hm. Soft hands. ...Thank you.'], gloomy: ['...That helps more than you\'d think.'] });
  W('work.retired.oiled', { _: ['You never know. Ha. I\'ll oil it tonight.', 'Keep it ready. Yes. I like that.'], gloomy: ['Ready for what? ...Still. I\'ll oil it.'], cheerful: ['Ooh, yes! Ready for anything!'] });

  // --- Children who want a trade ------------------------------------------------------
  addThread({
    id: 'work.kid', label: 'What will you be when you\'re grown?', about: 'work', weight: 1.2, cool: 4,
    when: (F) => F.stage === 'child' && ['young', 'school', 'youth'].includes(F.band),
    open: { ask: 'work.kid.open' },
    beats: {
      start: { line: 'work.kid.start', go: [
        { ap: 'ask', say: 'Why that one?', to: 'why' },
        { ap: 'jest', say: 'Not a dragon-tamer, then?', to: 'dragon' },
        { ap: 'ask', say: 'Have you watched them at it?', to: 'watched' },
      ] },
      why: { line: 'work.kid.why', go: [
        { ap: 'warm', say: 'You\'d be a fine one.', to: 'fine' },
        { ap: 'advise', say: 'Then watch the grown-ups at it. Stand close, ask questions.', to: 'watch' },
        { ap: 'tale', say: 'I knew a little hobbit who wanted that very thing.', to: 'tale' },
      ] },
      dragon: { line: 'work.kid.dragon', go: [
        { ap: 'jest', say: 'I\'ll put in a word with the dragons.', to: 'laugh' },
        { ap: 'ask', say: 'And if not dragons?', to: 'why' },
      ] },
      watched: { line: 'work.kid.watched', go: [
        { ap: 'ask', say: 'What\'s the hardest bit, do you think?', to: 'hardest' },
        { ap: 'warm', say: 'You\'ve been paying attention. That\'s the start.', to: 'fine' },
      ] },
      hardest: { line: 'work.kid.hardest', go: [
        { ap: 'advise', say: 'work.kid.suggest', label: 'Tell them what suits them', to: 'suit' },
        { ap: 'comfort', say: 'You\'ll grow into it. Everyone does.', to: 'grow' },
      ] },
      fine: { line: 'work.kid.fine', go: [
        { ap: 'advise', say: 'work.kid.suggest', label: 'Tell them what suits them', to: 'suit' },
        { ap: 'ask', say: 'And what do you really, secretly want?', to: 'secret', need: { open: 2 }, soft: true },
      ] },
      tale: { line: 'work.kid.tale', go: [
        { ap: 'tale', say: 'They grew up to be the best in three valleys.', to: 'fine' },
        { ap: 'jest', say: 'Then they fell in the duck pond. But they got there.', to: 'laugh' },
      ] },
      suit: { line: 'work.kid.suit', fx: { run: (T, v) => runLean(T, v), learn: ['work.kid', '{Name} might make a good {workLifeFit} one day.'] }, go: [
        { ap: 'warm', say: 'I mean it. I can see it in your hands.', to: 'hands' },
        { ap: 'ask', say: 'And what do you really, secretly want?', to: 'secret', need: { open: 2 }, soft: true },
      ] },
      secret: { line: 'work.kid.secret', fx: { confide: { k: 'work.kid.secret', t: '{Name} told you what they secretly want to be when they\'re grown', secret: true } }, go: [
        { ap: 'warm', say: 'Then I\'ll keep a spare hat for you.', to: 'hat' },
        { ap: 'jest', say: 'Then you\'ll need a very long beard.', to: 'beard' },
      ] },
      watch: { line: 'work.kid.watch', fx: { run: (T, v) => { pushQ(v, 'apprentice'); runLean(T, v); }, respect: 0.02 }, end: true },
      laugh: { line: 'work.kid.laugh', fx: { fond: 0.02 }, end: true },
      grow: { line: 'work.kid.grow', fx: { trust: 0.02 }, end: true },
      hands: { line: 'work.kid.hands', fx: { fond: 0.03, feel: 'cheered', feelX: 'the wizard' }, end: true },
      hat: { line: 'work.kid.hat', fx: { fond: 0.03, trust: 0.03, promise: { k: 'work.kid.hat', t: 'You promised {name} a spare wizard\'s hat', days: 30 } }, end: true },
      beard: { line: 'work.kid.beard', fx: { joke: { k: 'work.kid.beard', t: '{Name} is growing a wizard\'s beard. Any day now.' }, fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  W('work.kid.open', { _: ['What will you be when you\'re grown, {name}?', 'Have you picked a trade yet, {name}?', 'Tell me, {name}, what will you be one day?'] });
  W('work.kid.suggest', {
    _: ['I think you\'d make a fine {workLifeFit}.', 'Have you thought of the {workLifeFit}\'s trade?'],
    'workLifeFitJob=tinker': ['You\'ve the hands for the tinker\'s work, I think.'],
    'workLifeFitJob=storyteller': ['I think you\'d tell a fine tale under the oak one day.'],
  });
  W('work.kid.start', {
    _: ['I don\'t know! Everything! A baker AND a fisher. On different days.', 'Something with a big hat. Or a big spoon.'],
    child: ['Something loud! With a horn! Is there a horn trade?'],
    'workWants ^1': ['A {workWants}! I watched one ALL morning. I know how already. Nearly.', 'I\'m going to be the {workWants}. I\'ve decided. I decided yesterday.'],
    'workParentTrade ^1': ['A {workParentTrade}, like {workParentName}! Or not. Maybe not. Maybe yes.', 'I\'ll be the {workParentTrade}. {WorkParentName} says I\'m not tall enough yet.'],
    'band=young': ['A hen! ...No, the one that gets the eggs. That one.', 'I want to be the one with the long pole that lights the lamps!'],
    'band=youth': ['Honestly? I don\'t know. Everyone keeps asking. It\'s a lot.', 'I\'ve a fancy for the {workLifeFit}\'s trade. Don\'t tell anyone yet.'],
    'band=youth workWants ^1': ['I\'ve been watching the {workWants}. I think I could. I think I want to.'],
    'register=bright': ['The storyteller. Or the herbalist. Something with books and long words.'],
    'rift': ['Tinker! Wires and sparks! Mom says no. Mom\'s wrong.', 'I want to run the Relay. All the signal in the valley through MY hands.'],
  });
  W('work.kid.why', {
    _: ['Because it looks fun! And you get to eat bits.', 'Because then everyone needs you. That\'s nice.'],
    child: ['Because! Because because because.'],
    'workWants=baker': ['The Bakehouse is warm and smells of cake and you get the ends.'],
    'workWants=fisher': ['You sit by the river ALL DAY and nobody says do your letters.'],
    'workWants=farmer': ['You get to drive the cart. And shout at crows.'],
    'workWants=brewer': ['The brewhouse goes bloop. All day. Bloop.'],
    'workWants=woodwright': ['You get to shout TIMBER! And it\'s allowed!'],
    'workWants=tinker': ['Sparks! And things that light up! And beep!'],
    'workWants=innkeeper': ['Everyone sings at the inn. I want to be where the singing is.'],
    'workWants=herder': ['Lambs. That\'s all. Lambs.'],
    'band=youth': ['Because I\'m good at it. Or I think I could be. That\'s the same, nearly.'],
    'band=young': ['Because it has a hat!'],
  });
  W('work.kid.dragon', {
    _: ['Is that a real trade? Is it? Can I?', 'Dragon-tamer! I didn\'t know that was allowed!'],
    'band=youth': ['Ha. Very funny. ...Is it, though? A real trade?'],
    'band=young': ['YES. That one. I want that one.'],
    'rift': ['Do dragons have firmware? I could tame one if it had firmware.'],
  });
  W('work.kid.watched', {
    _: ['Loads! I sat on the wall and watched till I got called in.', 'Yes! I helped! I held the bucket. It was an important bucket.'],
    'workParentTrade': ['I watch {workParentName} every day. I know all the bits. I can\'t do any of them yet.'],
    'band=young': ['I watched! And then I fell asleep. But I watched first.'],
    'band=youth': ['Every chance I get. They\'re getting used to me hanging about.'],
  });
  W('work.kid.hardest', {
    _: ['Getting up early. Grown-ups get up SO early.', 'The heavy bits. I\'ll be bigger, though.'],
    'band=young': ['Being tall enough. I\'m nearly tall enough.'],
    'band=youth': ['Being good enough. Not just good. Good enough that they\'d want me.'],
    'register=bright': ['Knowing all of it. There\'s so much. You\'d need years.'],
  });
  W('work.kid.fine', {
    _: ['Really? REALLY? I\'m telling everyone you said.', 'A fine one! Did you hear that? A FINE one!'],
    'band=youth': ['...You think so? People don\'t usually say that.'],
    'band=young': ['I KNOW. I\'m going to be the best.'],
  });
  W('work.kid.tale', {
    _: ['Was it a real one? What happened to them?', 'Did they do it? Go on, tell!'],
    'band=youth': ['...And did they manage it? Truly?'],
  });
  W('work.kid.suit', {
    _: ['The {workLifeFit}? Me? ...Huh. I hadn\'t thought of that. I\'m thinking of it now.', 'A {workLifeFit}! Do you think I could? I bet I could.'],
    'band=young': ['A {workLifeFit}! Is there a hat?'],
    'band=youth': ['The {workLifeFit}\'s trade... You know, I think you might be right.'],
    'workLifeFitJob=tinker': ['Tinker! Sparks! I KNEW it. I\'m telling Mom.'],
    'workLifeFitJob=storyteller': ['Me? Telling stories under the oak? With everyone listening?'],
  });
  W('work.kid.secret', {
    _: ['...Promise not to laugh? A wizard. Like you. With the hat and the fireworks.', '...I want to be a wizard. Don\'t tell. Everyone says hobbits can\'t.'],
    'band=youth': ['...Honestly? I want to go off on an adventure first. Then come back and pick.'],
    'rift': ['...I want to go back through the rift and see the city. Just once. Then come home.'],
  });
  W('work.kid.watch', {
    _: ['I\'ll go now! Right now! Before tea!', 'Close! And questions! I\'m good at questions.'],
    'band=youth': ['I\'ll ask if I can help. Properly. Not just the bucket.'],
  });
  W('work.kid.laugh', { _: ['Hee! Ask them nicely! Dragons like nicely.', 'Ha! The duck pond! That\'s what I\'d do!'], 'band=youth': ['Ha. ...That\'s a bit funny, actually.'] });
  W('work.kid.grow', { _: ['I AM growing. Look. Look at my feet.', 'Grow into it. Like Dad\'s coat.'] });
  W('work.kid.hands', { _: ['*looks at their hands very hard* ...I can see it too! A bit!', 'In my HANDS? Wow. I\'m going to look after them.'] });
  W('work.kid.hat', { _: ['A SPARE HAT? You PROMISE?', 'A real wizard hat! I\'m going to be SO good.'], 'band=youth': ['...You\'d really? Ha. I\'ll hold you to that.'] });
  W('work.kid.beard', { _: ['I\'m going to start growing it TODAY.', 'I\'ve got a bit of a beard already. Feel. ...No, don\'t.'] });

  // --- The Steward's working week ------------------------------------------------------
  addThread({
    id: 'work.week', label: (F) => (F.workWeek === 'busy' ? 'This busy week' : F.workWeek === 'easy' ? 'This easy week' : 'The working week'), about: 'work', weight: 0.9, cool: 4,
    when: (F) => !!F.job && grown(F),
    rel: (F) => (F.workWeek !== 'usual' || F.workRations !== 'fair' || F.workAle !== 'some' ? 1.5 : 0.7),
    open: { ask: 'work.week.open' },
    beats: {
      start: { line: 'work.week.start', go: [
        { ap: 'ask', say: 'And the rations?', to: 'rations' },
        { ap: 'ask', say: 'What would you tell the Steward, if you could?', to: 'tell' },
        { ap: 'jest', say: 'Highday\'s my favorite day too.', to: 'highday' },
      ] },
      rations: { line: 'work.week.rations', go: [
        { ap: 'ask', say: 'And the ale?', to: 'ale' },
        { ap: 'comfort', say: 'It won\'t be like this forever.', to: 'forever' },
        { ap: 'ask', say: 'What would you tell the Steward?', to: 'tell' },
      ] },
      ale: { line: 'work.week.ale', go: [
        { ap: 'jest', say: 'I could magic up a barrel. A small one.', to: 'barrel' },
        { ap: 'ask', say: 'What would you tell the Steward?', to: 'tell' },
      ] },
      highday: { line: 'work.week.highday', go: [
        { ap: 'ask', say: 'And what do you do with it?', to: 'restday' },
        { ap: 'ask', say: 'What would you tell the Steward?', to: 'tell' },
      ] },
      restday: { line: 'work.week.restday', go: [
        { ap: 'warm', say: 'That sounds exactly right.', to: 'right' },
        { ap: 'listen', say: '*You wait for the rest of it.*', label: 'Wait', to: 'deep', need: { open: 2 }, soft: true },
      ] },
      tell: { line: 'work.week.tell', fx: { learn: ['work.week', '{Name} has views on the Steward\'s working week.'] }, go: [
        { ap: 'warm', say: 'I\'ll pass it on. Word for word.', to: 'pass' },
        { ap: 'jest', say: 'Shall I put it a little more politely?', to: 'politely' },
        { ap: 'listen', say: '*You wait. There\'s more behind it.*', label: 'Wait', to: 'deep', need: { open: 2 }, soft: true },
      ] },
      deep: { line: 'work.week.deep', fx: { confide: { k: 'work.week.deep', t: '{Name} told you what the working week really costs them' } }, go: [
        { ap: 'comfort', say: 'You\'ve carried a great deal. I see it.', to: 'seen' },
        { ap: 'advise', say: 'Take an hour for yourself today. The work will keep.', to: 'hour' },
      ] },
      pass: { line: 'work.week.pass', fx: { trust: 0.03, promise: { k: 'work.week.steward', t: 'You promised to pass {name}\'s word on to the Steward', days: 5 }, feel: 'heartened', feelX: 'the wizard listening' }, end: true },
      politely: { line: 'work.week.politely', fx: { fond: 0.02 }, end: true },
      forever: { line: 'work.week.forever', fx: { trust: 0.01 }, end: true },
      barrel: { line: 'work.week.barrel', fx: { fond: 0.02 }, end: true },
      right: { line: 'work.week.right', fx: { fond: 0.01 }, end: true },
      seen: { line: 'work.week.seen', fx: { trust: 0.03, feel: 'drawn_out' }, end: true },
      hour: { line: 'work.week.hour', fx: { respect: 0.02, queue: 'smoke', drive: { tired: -0.05 } }, end: true },
    },
    end: { fond: 0.01 },
  });
  W('work.week.open', {
    _: ['How\'s the week treating you, {name}?', 'How are you finding the Steward\'s week, {name}?'],
    'workWeek=busy': ['No day of rest this week, {name}. How are you bearing it?'],
    'workWeek=easy': ['Two days off this week, {name}! What will you do with them?'],
  });
  W('work.week.start', {
    _: ['Same as ever. Work six, rest on Highday, grumble on all seven.', 'It\'s a week. It has days in it. Most of them are work.'],
    cheerful: ['Oh, it\'s a good rhythm. Work, work, market, work, Highday! Lovely.'],
    ornery: ['Too long, and the Steward\'s never done a day of it.'],
    shy: ['...It\'s all right. I don\'t mind. I like knowing what day it is.'],
    curious: ['I\'ve been counting how much gets done on each day. Mersday\'s the slowest. Nobody knows why.'],
    dreamy: ['The days run together. I only know it\'s Highday by the bells in my head.'],
    witty: ['Six days\' work and one day\'s worrying about the six. A fair system.'],
    proud: ['I work the week through and I work it properly.'],
    gloomy: ['Long. They\'re always long. Even the short ones.'],
    'workWeek=busy ^1': ['No Highday! By order! My bones didn\'t get the order.', 'A busy week, the Steward says. Busy\'s a kind word for it.'],
    'workWeek=busy cheerful ^1': ['A busy week! Well, it gets things done. I\'m flagging, mind.'],
    'workWeek=busy ornery ^1': ['No day off! Not one! I\'d like to see the Steward knead on no sleep.'],
    'workWeek=easy ^1': ['Sunday AND Highday off! I\'ve never been so rested. It\'s unsettling.', 'An easy week. Two days\' rest. I could weep, I\'m that grateful.'],
    'workWeek=easy proud ^1': ['An easy week. Some of us still keep busy, mind.'],
    'workRestDay ^1': ['It\'s Highday! I\'m only here because my feet walked out of habit.'],
    'workMarket ^1': ['Market day! Everyone\'s at the stalls and the work has to fit round it.'],
    'workRations=lean ^1': ['Lean rations and a full week. You can\'t work on half a plate. Well. You can. Badly.'],
    'workRations=feast ^1': ['Feasts every meal! I\'ve never worked so slowly or so happily.'],
  });
  W('work.week.rations', {
    _: ['Fair. Ordinary helpings. Nobody\'s starving, nobody\'s waddling.', 'Rations are rations. I\'d not say no to seconds.'],
    cheerful: ['Oh, they\'re fine! I sneak a bit of extra butter. Don\'t tell.'],
    ornery: ['Rations! In my day we just ate.'],
    shy: ['...Enough. I don\'t eat much. Well. I eat a normal hobbit amount.'],
    curious: ['I\'ve worked out exactly how many crumbs is a helping. It\'s a lot of crumbs.'],
    dreamy: ['I dream of second breakfast. A proper one. With mushrooms.'],
    witty: ['Ordinary helpings, they say. Nothing\'s ordinary to a hungry hobbit.'],
    proud: ['Fair\'s fair. I don\'t complain about food.'],
    gloomy: ['They\'ll cut them soon. You\'ll see.'],
    'workRations=lean ^2': ['Lean. Half portions. My stomach growls at the Steward\'s door every time I pass.', 'Lean rations. I\'ve started dreaming about bread. Just bread. Plain.'],
    'workRations=lean ornery ^2': ['Half a plate and a whole day\'s work. Somebody\'s sums are off.'],
    'workRations=lean shy ^2': ['...I\'m always a bit hungry. I don\'t like to say.'],
    'workRations=generous ^2': ['Generous! Second helpings! I\'d work for the Steward till I dropped.', 'Seconds, now and then. The whole valley\'s cheerier for it.'],
    'workRations=feast ^2': ['Feasts! Every meal! I\'ve had to let my waistcoat out twice.', 'Feasting every day. The Store must be groaning. Well, it was.'],
    'workRations=feast gloomy ^2': ['Feasts. It can\'t last. The Store will run dry and then where will we be?'],
  });
  W('work.week.ale', {
    _: ['A pint or two of an evening. That\'s civilized.', 'The ale\'s as it should be. One, maybe two, and home.'],
    cheerful: ['A pint after work! Best part of the day!'],
    ornery: ['Watered, if you ask me. Nobody asked me.'],
    witty: ['A pint or two. The or two does a lot of work in that sentence.'],
    gloomy: ['It\'s fine. It\'s ale. It doesn\'t fix anything.'],
    shy: ['...I have a half. Sometimes a whole. Don\'t tell.'],
    proud: ['I take my one pint like a respectable hobbit.'],
    dreamy: ['A pint on the bench outside, watching the light go. That\'s the week\'s reward.'],
    curious: ['I\'d like to know what the brewer puts in this batch. It tastes of autumn.'],
    'workAle=dry ^2': ['Dry! The taproom\'s DRY! A hobbit can\'t live on tea alone. Well. He can. Sadly.', 'No ale. By order. The Badger is very quiet and very sad.'],
    'workAle=dry ornery ^2': ['Dry! I\'ll be writing to the Steward. In strong terms.'],
    'workAle=dry cheerful ^2': ['No ale! Oh well, more tea for me. Lots of tea. So much tea.'],
    'workAle=flowing ^2': ['Flowing! Pints all round! I\'ve not been entirely sure of the floor since Monday.', 'Generous pints. Merry evenings. Slightly slower mornings.'],
    'job=brewer workAle=flowing ^3': ['Flowing! Lovely for them. I can\'t brew fast enough.'],
    'job=brewer workAle=dry ^3': ['Dry! Barrels stacked to the rafters and nobody to drink them.'],
  });
  W('work.week.highday', {
    _: ['Highday! The best of days. Nobody wants anything of you.', 'Ha! Highday\'s everyone\'s favorite. Even the work\'s, I think.'],
    'workWeek=busy ^1': ['Highday! I remember Highday. Fondly. From before the busy week.'],
    cheerful: ['Highday! I count down to it from Sterday.'],
    ornery: ['Not that I get to enjoy it. Somebody always needs something.'],
    witty: ['Highday is the day I do all the things I said I\'d do on Highday. Which is nothing.'],
  });
  W('work.week.restday', {
    _: ['A long breakfast. A longer lunch. A nap between. A walk. A pipe. Bed.', 'Visit folk, mostly. Sit in gardens that aren\'t mine.'],
    cheerful: ['Everything! A picnic, a party, a nap in a field.'],
    ornery: ['Mend the things I didn\'t have time to mend all week.'],
    shy: ['...Nothing. Wonderful, quiet nothing.'],
    curious: ['Go and see something I\'ve not seen. There\'s still corners of the valley I\'ve missed.'],
    dreamy: ['Lie in the long grass and watch clouds become things.'],
    witty: ['Rest, strenuously. I\'m a professional.'],
    proud: ['Look over the week\'s work and think, well done.'],
    gloomy: ['Think about the week to come.'],
    'spouse': ['A whole day with {spouse}. We don\'t say much. We don\'t have to.'],
    'kid': ['Play with {kid}. Get muddy. Get told off by {kid}.'],
  });
  W('work.week.tell', {
    _: ['I\'d say: we\'re not mules. Give us our Highday and we\'ll give you our best.', 'I\'d say thank you. And then ask for more butter.'],
    cheerful: ['I\'d say thank you! And maybe a little more cake on Mersdays.'],
    ornery: ['I\'d tell the Steward to try a week of it. Just one.'],
    shy: ['...I\'d say we\'re trying. All of us. Very hard.'],
    curious: ['I\'d ask why. Why this week, why these rations. I\'d just like to know the reasons.'],
    dreamy: ['I\'d say there\'s more to a valley than what\'s in the Store.'],
    witty: ['I\'d say it in a song. Folk listen to songs.'],
    proud: ['I\'d say I\'ve done my share and more. They know it.'],
    gloomy: ['Nothing. They wouldn\'t listen.'],
    'workWeek=busy ^1': ['Give us back our Highday. That\'s all. One day.'],
    'workRations=lean ^1': ['Feed us properly and we\'ll work properly. It\'s not a riddle.'],
    'workWeek=easy ^1': ['I\'d say thank you. Truly. The easy week\'s done us all good.'],
    'workRations=feast ^1': ['Thank you for the feasts. And maybe count the barrels.'],
  });
  W('work.week.deep', {
    _: ['...I\'ve not sat down to a meal with my own family all week. I eat standing up.', '...I\'m tired, wizard. Not body tired. Tired all through.'],
    'spouse': ['...I\'ve not seen {spouse} awake since Monday. I come home, they\'re asleep. I go, they\'re asleep.'],
    'kid': ['...{Kid} asked me who I was this morning. A joke. I think it was a joke.'],
    proud: ['...I\'ll not say it to anyone else. I\'m nearly done in.'],
    ornery: ['...If I stop grumbling, I\'ll start crying. So I grumble.'],
    gloomy: ['...Some weeks I wonder what it\'s all for.'],
    cheerful: ['...I smile so much at work. When I get home I just sit in the dark a bit.'],
  });
  W('work.week.pass', {
    _: ['Would you? Word for word? Oh, you\'re a good one.', 'Tell them it came from a hobbit who knows. They\'ll know which.'],
    shy: ['...Don\'t say it was me. Say it was a lot of us. It is.'],
    ornery: ['Word for word. Including the rude bits.'],
    proud: ['Use my name. I\'ll stand by it.'],
    gloomy: ['They won\'t listen. ...But thank you.'],
  });
  W('work.week.politely', { _: ['Ha! Politely. Yes. Leave out the bit about the mules.', 'A little. Not too much. I want them to feel it.'], ornery: ['No. Exactly as I said it.'], witty: ['Make it rhyme. They\'ll remember it.'], shy: ['...Very politely. Please.'], proud: ['I\'m always polite. Leave it as it is.'] });
  W('work.week.forever', { _: ['No. Nothing is. Thank you.', 'I hope not. I\'ll hold on.'], gloomy: ['Everything\'s forever till it isn\'t.'], cheerful: ['No! And when it\'s over I\'ll have three helpings.'], ornery: ['It had better not be.'] });
  W('work.week.barrel', { _: ['Ha! Don\'t you dare. ...How small?', 'A wizard bootlegger! Ha!'], ornery: ['Hmph. Make it a big one.'], shy: ['*giggles* ...You wouldn\'t.'], proud: ['I couldn\'t possibly. ...Leave it by the back door.'] });
  W('work.week.right', { _: ['It is, isn\'t it? Exactly right.', 'Every Highday, if they\'ll let me.'], gloomy: ['It would be. If Highday lasted longer.'], dreamy: ['It\'s the best day. Like a held breath.'] });
  W('work.week.seen', { _: ['...Thank you. Most folk don\'t see.', '...I didn\'t know it showed.'], proud: ['...It\'s good to have it noticed.'], ornery: ['...Hmph. Well. Somebody had to notice.'], shy: ['*nods, not trusting their voice*'] });
  W('work.week.hour', { _: ['An hour. A pipe on the step. ...Yes. Yes, I will.', 'The work will keep. Will it? ...It will.'], ornery: ['Hm. One hour. Not a minute more.'], cheerful: ['An hour! A whole hour! What luxury!'], proud: ['I don\'t usually. ...Just this once.'] });

  // --- The Common Store ----------------------------------------------------------------
  addThread({
    id: 'work.store', label: 'The Common Store', about: 'work', weight: 0.9, cool: 3,
    when: (F) => grown(F),
    rel: (F) => (F.workLifeScarce ? 1.5 : 0.8),
    open: { ask: 'work.store.open' },
    beats: {
      start: { line: 'work.store.start', go: [
        { ap: 'ask', say: 'What\'s running short?', to: 'short' },
        { ap: 'ask', say: 'And what\'s piling up?', to: 'plenty' },
        { ap: 'ask', say: 'Is it all fairly shared?', to: 'fair' },
      ] },
      short: { line: 'work.store.short', go: [
        { ap: 'advise', say: 'Put a little by at home, against the lean days.', to: 'putby' },
        { ap: 'ask', say: 'And whose job is it to fix it?', to: 'who' },
        { ap: 'ask', say: 'And what\'s piling up?', to: 'plenty' },
      ] },
      plenty: { line: 'work.store.plenty', go: [
        { ap: 'jest', say: 'Then a feast is in order, surely.', to: 'feast' },
        { ap: 'ask', say: 'Is it all fairly shared, though?', to: 'fair' },
      ] },
      fair: { line: 'work.store.fair', go: [
        { ap: 'ask', say: 'Does everyone pull their weight?', to: 'shirk' },
        { ap: 'warm', say: 'A village that shares is a village that lasts.', to: 'lasts' },
      ] },
      shirk: { line: 'work.store.shirk', go: [
        { ap: 'listen', say: '*You wait. They clearly have someone in mind.*', label: 'Wait', to: 'name', need: { open: 2 }, soft: true },
        { ap: 'advise', say: 'Lead by example. It shames the idle better than words.', to: 'example' },
        { ap: 'comfort', say: 'Some are carrying things you can\'t see.', to: 'unseen' },
      ] },
      name: { line: 'work.store.name', fx: { confide: { k: 'work.store.shirker', t: '{Name} thinks somebody\'s taking more from the Store than they put in', secret: true } }, go: [
        { ap: 'warm', say: 'I\'ll keep an eye out. Quietly.', to: 'quiet' },
        { ap: 'advise', say: 'Talk to them before you talk about them.', to: 'talk' },
      ] },
      putby: { line: 'work.store.putby', fx: { respect: 0.02, queue: 'put_by' }, end: true },
      who: { line: 'work.store.who', end: true },
      feast: { line: 'work.store.feast', fx: { fond: 0.02 }, end: true },
      lasts: { line: 'work.store.lasts', fx: { fond: 0.01, respect: 0.01 }, end: true },
      example: { line: 'work.store.example', fx: { respect: 0.03 }, end: true },
      unseen: { line: 'work.store.unseen', fx: { trust: 0.02 }, end: true },
      quiet: { line: 'work.store.quiet', fx: { trust: 0.03 }, end: true },
      talk: { line: 'work.store.talk', fx: { respect: 0.03, remember: 'The wizard says talk to folk before talking about them.', rv: 0 }, end: true },
    },
    end: { fond: 0.01 },
  });
  W('work.store.open', { _: ['How\'s the Common Store looking, {name}?', 'Is the Store keeping us all, {name}?', 'You\'ll know, {name}: how are the shelves at the Store?'] });
  W('work.store.start', {
    _: ['Oh, it\'s keeping us. Just about. You can always use a bit more of everything.', 'The Store? Full of some things, short of others. Same as any larder.'],
    cheerful: ['Bursting! Well. Bursting in places. Lovely to see.'],
    ornery: ['Half of it\'s full of things nobody wants and the other half\'s empty.'],
    shy: ['...I don\'t like to take much. I put more in than I take, I think.'],
    curious: ['I\'ve been keeping a tally in my head. Want to hear it? You don\'t. It\'s long.'],
    dreamy: ['I love the smell of it. Apples and flour and woodsmoke all at once.'],
    witty: ['It\'s a fine institution. Like a larder with a committee.'],
    proud: ['Well stocked, thanks to those of us who work.'],
    gloomy: ['It\'ll be empty by spring. Mark me.'],
    'workLifeScarce ^1': ['We\'re short of {workLifeScarce}. Very short. Folk are starting to notice.', 'The {workLifeScarce} shelf is bare. Bare! I\'ve never seen it so.'],
    'workLifePlenty ^1': ['We\'re drowning in {workLifePlenty}. There\'s {workLifePlenty} in the rafters.'],
    'workShort job ^2': ['Short of what I make, and I can\'t make it faster. Everyone asks me.'],
    'workGlut job ^2': ['Full to the roof with what I make. They\'ll have to build another shed.'],
    'season=winter': ['Winter\'s eating into it. Every week the shelves are a little higher up the wall.'],
    'season=autumn': ['Harvest\'s coming in. The Store\'s the busiest place in the valley.'],
  });
  W('work.store.short', {
    _: ['A bit of everything, when you look closely. Nothing dreadful yet.', 'Nothing, just now. Touch wood. Touch a lot of wood.'],
    'workLifeScarce ^1': ['{WorkLifeScarce}. It goes out faster than it comes in.', 'The {workLifeScarce}. Ask anyone. Everyone\'s asking.'],
    'workLifeScarceKey=ale ^2': ['Ale! The Badger\'s scraping the barrels. There\'ll be riots. Polite riots.'],
    'workLifeScarceKey=bread ^2': ['Bread. Bread! A hobbit can do without many things. Not bread.'],
    'workLifeScarceKey=wood ^2': ['Firewood. And the cold\'s coming. Somebody needs to swing an axe.'],
    'workLifeScarceKey=leaf ^2': ['Pipe-weed. Folk are smoking the dregs. Smells like burning boots.'],
    'workLifeScarceKey=fish ^2': ['Fish. The fishers can only do so much. The river\'s not a larder.'],
    'workLifeScarceKey=remedy ^2': ['Remedies. And it\'s sniffling season. The herbalist looks worn through.'],
    ornery: ['Everything I like. Funny, that.'],
    gloomy: ['All of it, nearly. We\'ll manage. We always manage. Until we don\'t.'],
    cheerful: ['Oh, a few things! Nothing a good harvest won\'t mend.'],
    curious: ['The things nobody\'s making enough of. It\'s always the chain, you see. One link short.'],
  });
  W('work.store.plenty', {
    _: ['Barley, mostly. There\'s always barley.', 'Odd things. Too many eggs one week, too many apples the next.'],
    'workLifePlenty ^1': ['{WorkLifePlenty}! More {workLifePlenty} than we\'ll eat in a season.', '{WorkLifePlenty}. I\'ve had {workLifePlenty} for breakfast, lunch and tea.'],
    cheerful: ['Lots! Isn\'t it lovely? Too much of a good thing is still good.'],
    ornery: ['Things nobody needs. Somebody\'s been overdoing it.'],
    witty: ['Whatever nobody asked for. That\'s the law of stores.'],
    gloomy: ['The things that spoil. Always the things that spoil.'],
  });
  W('work.store.fair', {
    _: ['Fair enough. Everyone takes what they need. Mostly.', 'Fairer than most places, I\'d say. We\'re hobbits. We share. Grudgingly.'],
    cheerful: ['Oh, yes! Everyone\'s ever so good about it.'],
    ornery: ['Some take more than their share and some take less. Guess which I am.'],
    shy: ['...I think so. I don\'t like to say otherwise.'],
    curious: ['I\'ve wondered. Nobody counts what anyone takes. It runs on trust.'],
    dreamy: ['It\'s a lovely idea. Everyone giving, everyone getting. I like living in it.'],
    witty: ['Perfectly fair. Everyone thinks everyone else gets more.'],
    proud: ['Fair to those who put in. I put in plenty.'],
    gloomy: ['It\'s fair till it\'s short. Then we\'ll see.'],
    'values': ['Fair as long as folk remember it\'s ours, not theirs.'],
  });
  W('work.store.shirk', {
    _: ['Mostly. There\'s always one. There\'s always one in every valley.', 'Most do. A few do their pulling at supper time.'],
    cheerful: ['Oh, everyone tries! In their own way. Some ways are slower.'],
    ornery: ['Pull their weight? Some of them pull up a chair.'],
    shy: ['...I don\'t like to say. I see things. I don\'t say.'],
    curious: ['I\'ve noticed some folk always come to the Store just after the cart\'s been. Curious, that.'],
    witty: ['Everyone pulls their weight. Some just weigh very little.'],
    proud: ['I do. I can\'t speak for anyone else. Well. I could.'],
    gloomy: ['No. But nobody ever does.'],
    dreamy: ['Everyone pulls in their own way. Some just pull dreams. I\'m one of those, sometimes.'],
  });
  W('work.store.name', {
    _: ['...I\'ll not say who. But somebody takes a full basket on Mersdays and never puts a thing in.', '...There\'s one. I won\'t name names. You\'d know them by their waistcoat.'],
    ornery: ['...You know who. Everybody knows who. Nobody says.'],
    shy: ['...I saw someone take three loaves. Three. I don\'t know if I should say.'],
    proud: ['...I\'m not one to tell tales. But I keep a list.'],
  });
  W('work.store.putby', {
    _: ['A little by. Jars on the top shelf. Yes, that\'s sensible.', 'I will. My grandmother always did. Never went hungry.'],
    gloomy: ['Every jar\'s a jar we won\'t be sorry for.'],
    cheerful: ['Ooh, jam-making! Any excuse.'],
  });
  W('work.store.who', {
    _: ['Everyone\'s. That\'s the trouble with everyone\'s. It\'s nobody\'s.', 'The Steward\'s, I suppose. More hands where they\'re needed.'],
    ornery: ['Not mine. I do my share.'],
    witty: ['Whoever\'s caught standing nearest the empty shelf.'],
  });
  W('work.store.feast', { _: ['Ha! I\'ll put it to the Steward. They\'ll say no.', 'A feast! Now you\'re talking sense, wizard.'], gloomy: ['And then we\'ll be short next month.'], cheerful: ['A feast! Long tables! I\'ll bring a pie. Two pies.'], witty: ['A feast to use up the surplus. Very responsible. I approve.'] });
  W('work.store.lasts', { _: ['...That\'s true. That\'s very true.', 'I\'ll remember that. A village that shares.'], ornery: ['Lasts, aye. If everyone shares the same amount.'], dreamy: ['A village that lasts. I like the sound of that.'] });
  W('work.store.example', { _: ['Lead by example. Hm. I already do. I\'ll do it louder.', 'Yes. Better than complaining. I\'ll try that.'], proud: ['I\'ve been leading by example for years. Nobody\'s following.'] });
  W('work.store.unseen', { _: ['...Maybe. I hadn\'t thought of that.', 'Things I can\'t see. Yes. That\'s fair.'], ornery: ['Hmph. Maybe. Some.'], shy: ['...That\'s true. I carry things nobody sees.'], proud: ['Perhaps. I\'ll reserve judgment.'] });
  W('work.store.quiet', { _: ['Quietly. Yes. I don\'t want trouble.', 'Thank you. Don\'t say it came from me.'], ornery: ['Not too quietly.'], shy: ['...Thank you. I feel better for saying.'] });
  W('work.store.talk', { _: ['Before I talk about them. ...You\'re right, curse you.', 'Talk to them. Yes. That\'s harder. That\'s why it\'s right.'], ornery: ['Talk to them. Hmph. I\'d rather talk about them.'], shy: ['...To their face? Oh dear. ...All right.'] });

  // --- A bad year and the season's trial ---------------------------------------------------
  addThread({
    id: 'work.harvest', label: (F) => ({ flood: 'The flood', drought: 'The dry spell', blight: 'The blight in the barley', frost: 'The hard frost' }[F.workHazard || F.workHazardSoon] || 'The harvest'), about: 'work', weight: 1.1, cool: 2,
    when: (F) => grown(F) && (!!F.workHazard || !!F.workHazardSoon || F.season === 'autumn'),
    rel: (F) => (F.workHazard ? 2 : F.workHazardSoon ? 1.6 : 1),
    open: { ask: 'work.harvest.open' },
    beats: {
      start: { line: 'work.harvest.start', go: [
        { ap: 'ask', say: 'How bad is it?', to: 'bad' },
        { ap: 'advise', say: 'work.harvest.fix', label: 'Advise them what to do', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'fixed'] },
        { ap: 'comfort', say: 'We\'ll get through it. Valleys always do.', to: 'through' },
      ] },
      bad: { line: 'work.harvest.bad', go: [
        { ap: 'ask', say: 'And what does it mean for winter?', to: 'winter' },
        { ap: 'advise', say: 'work.harvest.fix', label: 'Advise them what to do', to: 'fixed' },
        { ap: 'listen', say: '*You let them say the worst of it.*', label: 'Let them say the worst', to: 'fear', need: { open: 1 }, soft: true },
      ] },
      winter: { line: 'work.harvest.winter', go: [
        { ap: 'advise', say: 'Put by what you can, while you can.', to: 'putby' },
        { ap: 'warm', say: 'Nobody in this valley will go hungry. Not while I\'m about.', to: 'promise' },
      ] },
      fear: { line: 'work.harvest.fear', fx: { confide: { k: 'work.harvest.fear', t: '{Name} is frightened of a hungry winter' } }, go: [
        { ap: 'comfort', say: 'We\'ll get through it. Together.', to: 'through' },
        { ap: 'tale', say: 'I remember the Long Winter. The Shire came through. So will you.', to: 'tale' },
      ] },
      fixed: { line: 'work.harvest.fixed', fx: { respect: 0.04, run: (T, v) => {
        const z = T.F.workHazard || T.F.workHazardSoon, j = v.job;
        if (z === 'blight') pushQ(v, j === 'herbalist' || j === 'farmer' ? 'treat_blight' : 'chat');
        else if (z === 'drought' && j === 'farmer') { pushQ(v, 'farmer_fetchwater'); pushQ(v, 'farmer_water'); }
        else if (z === 'frost' && j === 'woodwright') pushQ(v, 'woodwright_stack');
        else if (z === 'frost' || World.season === 'autumn') pushQ(v, 'put_by');
        if (typeof feel === 'function') feel(v, 'good_tip', 'the wizard');
      } }, go: [
        { ap: 'warm', say: 'You\'ll manage. I\'ve every faith.', to: 'through' },
        { ap: 'jest', say: 'And if it fails, blame the wizard.', to: 'blame' },
      ] },
      bristle: { line: 'work.harvest.bristle', fx: { fond: -0.02 }, go: [
        { ap: 'listen', say: '*You hold up a hand, and let them talk.*', label: 'Back off, and listen', to: 'bad' },
        { ap: 'warm', say: 'Forgive me. You know the land far better.', to: 'through' },
      ] },
      tale: { line: 'work.harvest.tale', fx: { fond: 0.02, trust: 0.02 }, end: true },
      putby: { line: 'work.harvest.putby', fx: { queue: 'put_by', respect: 0.02 }, end: true },
      promise: { line: 'work.harvest.promise', fx: { trust: 0.03, promise: { k: 'work.harvest', t: 'You told {name} nobody would go hungry this winter', days: 20 } }, end: true },
      through: { line: 'work.harvest.through', fx: { trust: 0.02 }, end: true },
      blame: { line: 'work.harvest.blame', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.01 },
  });
  W('work.harvest.open', {
    _: ['How\'s the harvest coming in, {name}?', 'A good year, {name}, or a lean one?'],
    'workHazard': ['How are you bearing {workLifeHazard}, {name}?'],
    'workHazardSoon': ['They say {workLifeHazard} is coming, {name}. Are you ready?'],
  });
  W('work.harvest.fix', {
    _: ['Put food by while the shelves are full.', 'Bring it all in while the weather holds.'],
    'workHazard=blight': ['Treat it with a strong herbal wash, before it spreads.'],
    'workHazardSoon=blight': ['Keep herbs ready. The herbalist will need them.'],
    'workHazard=drought': ['Water from the river and the wells. Bucket by bucket.'],
    'workHazardSoon=drought': ['Fill every bucket now, and water near the wells.'],
    'workHazard=frost': ['Stack the woodpile high. Then higher.'],
    'workHazardSoon=frost': ['Stack the woodpile before it bites. Then stack it again.'],
    'workHazard=flood': ['Get what\'s low up high, and keep out of the meadows.'],
    'workHazardSoon=flood': ['Get what\'s low up high. Raised banks will hold it back.'],
  });
  W('work.harvest.start', {
    _: ['Coming in. Good in places, thin in others. Like every year.', 'Busy! Every hand at the sheaves and every cart full.'],
    cheerful: ['A grand harvest! The barley\'s heavy and the apples are falling over themselves.'],
    ornery: ['It\'d be better if folk had listened to me in spring.'],
    shy: ['...All right, I think. I just carry what I\'m given.'],
    curious: ['I\'ve been weighing the sheaves. Heavier than last year, near enough.'],
    dreamy: ['Golden. The whole valley\'s golden. I wish it lasted.'],
    witty: ['The barley\'s in, the apples are in, and I\'m done in.'],
    proud: ['As good a harvest as I\'ve seen. And I\'ve seen a few.'],
    gloomy: ['It\'ll not be enough. It never is.'],
    'workHazard=blight ^2': ['Blight in the barley. Brown and limp, a whole field of it. I could weep.', 'The blight\'s in. It spreads like gossip. Faster.'],
    'workHazard=drought ^2': ['Dry. Dry as an old cookie. The ground\'s cracking like a pie crust.', 'No rain for days. The barley\'s gasping. So am I.'],
    'workHazard=flood ^2': ['The river\'s in the meadows. Everything low is under water.', 'Flood! The low fields are a lake. The ducks are delighted.'],
    'workHazard=frost ^2': ['Hard frost. The ground rings like iron. Hearths roaring, woodpile shrinking.', 'Bitter. Every hearth in the valley\'s eating timber like it\'s cake.'],
    'workHazardSoon=blight ^2': ['There\'s a blight about. The farmers don\'t like the look of the barley. Nor do I.'],
    'workHazardSoon=drought ^2': ['Not a cloud. The wells are low. There\'s a dry spell coming, I can smell it.'],
    'workHazardSoon=flood ^2': ['The river\'s high and brown and rising. The low meadows won\'t last the night.'],
    'workHazardSoon=frost ^2': ['The air bites. A hard frost\'s coming. Is the woodpile ready? Is anyone?'],
    'workHazard=blight job=farmer ^3': ['My barley! Blighted! I\'ve been out there all morning just looking at it.'],
    'workHazard=drought job=farmer ^3': ['I\'ve carried water till my arms are rope. The barley drinks it and asks for more.'],
    'workHazard=frost job=woodwright ^3': ['Everyone wants wood. Now. Yesterday. I\'ve not stopped swinging since dawn.'],
    'workHazard=blight job=herbalist ^3': ['The blight! They\'re all looking at me. I need herbs, and plenty.'],
  });
  W('work.harvest.bad', {
    _: ['Bad enough. Not the worst. Not by a long way. But bad enough.', 'We\'ll lose some. You always lose some. It\'s how much.'],
    cheerful: ['Oh, not so bad! We\'ll muddle through. We always do.'],
    ornery: ['Bad. And it\'s nobody\'s fault, which makes it worse. I can\'t shout at anybody.'],
    shy: ['...Worse than folk are saying, I think.'],
    curious: ['A third of the field, at a guess. I\'ve been counting rows.'],
    dreamy: ['It feels like the valley\'s holding its breath.'],
    witty: ['Bad enough to talk about all winter. That\'s a hobbit\'s measure.'],
    proud: ['We\'ll weather it. We\'ve weathered worse.'],
    gloomy: ['Bad. Worse tomorrow. You\'ll see.'],
    'workHazard=blight': ['A whole field. If it spreads, more. It\'s the spreading I fear.'],
    'workHazard=drought': ['The crops away from the water are suffering. The ones by the river are fine. It\'s a lesson.'],
    'workHazard=frost': ['If the woodpile holds, we\'re fine. If it doesn\'t, we\'re cold. Simple sums.'],
    'workHazard=flood': ['Whatever was growing low down is gone. And the holes by the water are damp.'],
  });
  W('work.harvest.winter', {
    _: ['Tighter belts. More soup, less pie. We\'ve done it before.', 'Jars on the top shelf, and we\'ll pray they last.'],
    'workLifeJarsLow ^1': ['My shelves are bare. I\'ve not put a single jar by. I\'d better start.'],
    cheerful: ['Soup! Lots of lovely soup. I like soup.'],
    ornery: ['A long hungry winter, and everyone grumbling at me as if I\'d done it.'],
    shy: ['...I\'ll eat less. I don\'t need much.'],
    gloomy: ['A hungry one. Hungry and cold and long.'],
    proud: ['My larder\'s stocked. It always is. I\'ll share where I must.'],
    dreamy: ['Long evenings by the fire, telling each other about meals we used to have.'],
    curious: ['I\'ve worked it out. If everyone eats a bit less, we\'ll make it to spring. Just.'],
    witty: ['It means everyone becomes very fond of turnips.'],
  });
  W('work.harvest.fear', {
    _: ['...I remember a hungry winter. When I was small. I don\'t want that for anyone.', '...What if it\'s not enough? What if we don\'t make spring?'],
    'kid': ['...I keep looking at {kid} and thinking of the shelves.'],
    ornery: ['...I\'m not frightened. I\'m. ...All right. A bit.'],
    proud: ['...I\'ve never been afraid of a winter. I\'m a bit afraid of this one.'],
    gloomy: ['...I\'ve been counting jars at night instead of sleeping.'],
  });
  W('work.harvest.fixed', {
    _: ['Right. Yes. That I can do. I\'ll get at it straight away.', 'Huh. Of course. I\'ve been so busy worrying I forgot to do anything.'],
    cheerful: ['Oh, that\'s a plan! I love a plan. Off I go!'],
    ornery: ['Hm. Might help. Can\'t hurt. ...I\'ll do it.'],
    shy: ['...Yes. I can do that. Thank you.'],
    curious: ['Yes! That gets at the root of it. Literally, in this case.'],
    dreamy: ['Do something. Yes. It\'s the waiting that\'s worst.'],
    witty: ['A sensible wizard. Whatever next.'],
    proud: ['I was about to. But yes.'],
    gloomy: ['It won\'t be enough. ...I\'ll do it anyway.'],
    'workHazard=blight job=herbalist ^1': ['A strong wash. Yes. I\'ve the herbs for it. I\'ll go now.'],
    'workHazard=drought job=farmer ^1': ['Bucket by bucket. My arms will hate you. The barley won\'t.'],
  });
  W('work.harvest.bristle', {
    _: ['I\'ve worked this land all my life, wizard. I know what to do.', 'Thank you, but I don\'t need telling.'],
    proud: ['I was doing that before you were... well. A while.'],
    ornery: ['Oh, aye. Easy for a wizard. Wave a stick and it\'s done.'],
  });
  W('work.harvest.tale', {
    _: ['The Long Winter? Were you there? Tell me how they managed.', '...If the Shire came through that, I suppose we can come through this.'],
    shy: ['...Thank you. That helps.'],
    curious: ['You were there? What did they eat? How did they keep warm?'],
  });
  W('work.harvest.putby', { _: ['While I can. Yes. Jars out tonight.', 'Put by. My grandmother\'s motto. I\'ll get the jars down.'], cheerful: ['Jam-making! Pickling! A whole afternoon of it.'], gloomy: ['Every jar\'s a winter evening that won\'t be hungry.'], proud: ['My shelves will be the fullest on the lane.'] });
  W('work.harvest.promise', { _: ['...You\'d see to that? Truly? Thank you.', 'I\'ll remember you said so. All winter.'], ornery: ['Hm. I\'ll hold you to it.'], gloomy: ['...I hope you\'re right.'] });
  W('work.harvest.through', { _: ['...We do, don\'t we. We always do.', 'Together. Yes. I needed someone to say it.'], ornery: ['Hm. We\'d better.'], proud: ['Of course we will.'], gloomy: ['...Most of us. Most years.'], cheerful: ['We will! And we\'ll have a party after.'], shy: ['...Together. Yes.'] });
  W('work.harvest.blame', { _: ['Ha! I will. Loudly. At the Badger.', 'Ha! Deal. It\'s nice to have someone to blame.'], witty: ['I already do. For the weather. It\'s your hat, isn\'t it.'], ornery: ['I\'ll blame you either way.'] });

  // --- Their turn: should I take on an apprentice? / how do I get taken on? -----------------
  addThread({
    id: 'work.ask.apprentice', theirs: true, label: 'A question about apprentices', cool: 5, ask: '{Name} has something to ask you about the trade.',
    when: (F) => (!!F.job && F.stage !== 'child' && ['skilled', 'master'].includes(F.workLevel) && !F.workApprentice && F.met) || (F.band === 'youth' && !F.workMaster && F.met),
    beats: {
      start: { line: 'work.ask.apprentice.start', go: [
        { ap: 'advise', say: 'Take one on. Teaching makes a master.', to: 'takeon', need: { if: { stage: ['grown', 'elder'] } } },
        { ap: 'advise', say: 'Go and watch the one you admire. Every day.', to: 'watch', need: { if: { stage: 'child' } } },
        { ap: 'ask', say: 'What\'s holding you back?', to: 'holding' },
        { ap: 'jest', say: 'Only if they make the tea.', to: 'tea' },
      ] },
      holding: { line: 'work.ask.apprentice.holding', go: [
        { ap: 'comfort', say: 'Everyone feels that. The good ones most.', to: 'feels' },
        { ap: 'advise', say: 'Take one on. Teaching makes a master.', to: 'takeon', need: { if: { stage: ['grown', 'elder'] } } },
        { ap: 'advise', say: 'Ask. The worst they say is not yet.', to: 'watch', need: { if: { stage: 'child' } } },
      ] },
      tea: { line: 'work.ask.apprentice.tea', go: [
        { ap: 'ask', say: 'No, but truly. What\'s holding you back?', to: 'holding' },
        { ap: 'jest', say: 'And the cookies. Don\'t forget the cookies.', to: 'biscuits' },
      ] },
      feels: { line: 'work.ask.apprentice.feels', go: [
        { ap: 'advise', say: 'Then do it scared. That\'s the only way.', to: 'scared' },
        { ap: 'warm', say: 'You\'re readier than you know.', to: 'ready' },
      ] },
      takeon: { line: 'work.ask.apprentice.takeon', fx: { respect: 0.03, remember: 'The wizard thinks I should take on an apprentice.', rv: 1 }, end: true },
      watch: { line: 'work.ask.apprentice.watch', fx: { respect: 0.02, run: (T, v) => { pushQ(v, 'apprentice'); runLean(T, v); } }, end: true },
      biscuits: { line: 'work.ask.apprentice.cookies', fx: { fond: 0.02 }, end: true },
      scared: { line: 'work.ask.apprentice.scared', fx: { trust: 0.03 }, end: true },
      ready: { line: 'work.ask.apprentice.ready', fx: { trust: 0.02, fond: 0.02 }, end: true },
    },
  });
  W('work.ask.apprentice.start', {
    _: ['Can I ask you something? There\'s a youngster keeps hanging about while I work. Should I take them on?', 'Do you think I\'m ready to teach? To have an apprentice?'],
    cheerful: ['I\'ve been thinking of taking on an apprentice! Is that mad? Tell me it\'s not mad.'],
    ornery: ['Somebody\'s asked me to teach their youngster. I don\'t know that I\'ve the patience.'],
    shy: ['...Someone asked if I\'d teach them. Me. I didn\'t know what to say.'],
    proud: ['Folk keep asking me to take on an apprentice. I\'m particular. Should I?'],
    gloomy: ['Who\'d want to learn from me? But somebody\'s asked. I don\'t understand it.'],
    'stage=child': ['How do you get to be an apprentice? Do you just ask? What if they say no?', 'I want to be taken on. Properly. How do I make them see I mean it?'],
    'stage=child register=bright': ['What\'s the proper way to ask to be apprenticed? Is there a form? A letter?'],
  });
  W('work.ask.apprentice.holding', {
    _: ['What if I teach it wrong? Then there\'s two of us doing it wrong.', 'Time. And nerve. Mostly nerve.'],
    ornery: ['Patience. I\'ve got none. Ask anyone.'],
    shy: ['...Being watched. I can\'t work when I\'m watched.'],
    proud: ['Standards. Mine are very high.'],
    gloomy: ['Me. I\'m what\'s holding me back. Always have been.'],
    'stage=child': ['What if they think I\'m too little? Or not good enough? Or too loud?'],
  });
  W('work.ask.apprentice.tea', {
    _: ['Ha! I\'ll put that in the terms. Tea, twice a day.', 'Ha! Well, that\'s one problem solved.'],
    'stage=child': ['I can make tea! I can! Mostly without spilling!'],
  });
  W('work.ask.apprentice.feels', { _: ['...Do they? Even the good ones?', 'The good ones most. Huh. That\'s a comfort, strangely.'], 'stage=child': ['Even grown-ups get scared? Really?'] });
  W('work.ask.apprentice.takeon', {
    _: ['Teaching makes a master. ...Yes. I like that. I\'ll do it.', 'All right. I\'ll say yes. Before I talk myself out of it.'],
    ornery: ['Hm. Fine. But they\'re sweeping for the first month.'],
    shy: ['...I\'ll try. I\'ll say yes. Quietly.'],
    proud: ['Yes. Someone should learn it properly. From me.'],
  });
  W('work.ask.apprentice.watch', {
    _: ['Every day! I\'ll be there so much they\'ll HAVE to take me on!', 'Watch, and ask. Right. Starting now.'],
    'band=youth': ['Every day. Until they notice. Then every day after.'],
  });
  W('work.ask.apprentice.cookies', { _: ['Ha! The good cookies. It\'s in the contract.', 'Ha! You drive a hard bargain, wizard.'], 'stage=child': ['I can do cookies! I can eat them, anyway.'], ornery: ['Cookies. Ha. Mine, not theirs.'] });
  W('work.ask.apprentice.scared', { _: ['Do it scared. ...All right. I can do scared.', 'Scared it is, then. I\'m good at scared.'], 'stage=child': ['Scared! Okay! I\'ll be brave and scared!'] });
  W('work.ask.apprentice.ready', { _: ['...You think so? Then maybe I am.', 'Readier than I know. I\'ll remember that.'], 'stage=child': ['READY! I\'m READY!'] });

  // --- Their turn: the Steward moved me ---------------------------------------------------
  addThread({
    id: 'work.ask.steward', theirs: true, label: 'The Steward moved them', cool: 6, ask: '{Name} wants a word with you about the Steward.',
    when: (F) => !!F.job && F.stage !== 'child' && F.met && (!!F.workPlayer || !!F.workAsked || !!F.workFormer),
    beats: {
      start: { line: 'work.ask.steward.start', go: [
        { ap: 'ask', say: 'And how do you feel about it?', to: 'feel' },
        { ap: 'advise', say: 'Give it a season. Then decide.', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'season'] },
        { ap: 'jest', say: 'Perhaps the Steward saw something in you.', to: 'saw' },
      ] },
      feel: { line: 'work.ask.steward.feel', go: [
        { ap: 'comfort', say: 'It\'s hard, being moved about like a chess piece.', to: 'chess' },
        { ap: 'advise', say: 'Give it a season. Then decide.', to: 'season' },
        { ap: 'ask', say: 'What do you miss about the old work?', to: 'miss', need: { if: { workFormer: has } } },
      ] },
      saw: { line: 'work.ask.steward.saw', go: [
        { ap: 'warm', say: 'I think the village needed you, and chose well.', to: 'chose' },
        { ap: 'ask', say: 'And how do you feel about it?', to: 'feel' },
      ] },
      miss: { line: 'work.ask.steward.miss', go: [
        { ap: 'advise', say: 'Keep a little of it. An evening here and there.', to: 'keep' },
        { ap: 'comfort', say: 'It\'s still part of you. It doesn\'t go away.', to: 'chess' },
      ] },
      bristle: { line: 'work.ask.steward.bristle', go: [
        { ap: 'listen', say: '*You let them say their piece.*', label: 'Let them say their piece', to: 'feel' },
        { ap: 'warm', say: 'You\'re right. It\'s your life, not the Steward\'s.', to: 'chose' },
      ] },
      season: { line: 'work.ask.steward.season', fx: { respect: 0.03 }, end: true },
      chess: { line: 'work.ask.steward.chess', fx: { trust: 0.03, feel: 'drawn_out' }, end: true },
      chose: { line: 'work.ask.steward.chose', fx: { fond: 0.02, feel: 'heartened', feelX: 'the wizard' }, end: true },
      keep: { line: 'work.ask.steward.keep', fx: { respect: 0.02 }, end: true },
    },
  });
  W('work.ask.steward.start', {
    _: ['The Steward put me to the {jobWord}\'s work. I never asked for it. What do I make of that?', 'Can I ask you? The Steward moved me to this trade. Was it something I did?'],
    'workFormer ^1': ['I was a {workFormer}, happily. Now I\'m the {jobWord}. Nobody asked me. Should I mind?'],
    'workAsked ^1': ['The Steward said there were too many {workAsked}s. So now I\'m this. Do I just... accept it?'],
    cheerful: ['The Steward\'s made me the {jobWord}! It\'s new and odd and I\'m not sure. Is it good?'],
    ornery: ['The Steward shuffled me about like a turnip in a sack. I want your view before I give mine.'],
    shy: ['...The Steward moved me. I didn\'t say anything. Should I have said something?'],
    proud: ['I\'ve been moved to the {jobWord}\'s trade. I trust it\'s because I\'m needed and not otherwise?'],
    gloomy: ['The Steward moved me. I suppose they didn\'t want me where I was.'],
  });
  W('work.ask.steward.feel', {
    _: ['Muddled. Like wearing someone else\'s waistcoat.', 'I don\'t know. It\'s not bad. It\'s not mine yet.'],
    cheerful: ['Mostly excited! A little bit lost. Excited and lost.'],
    ornery: ['Put out. That\'s how I feel. Put out like a cat.'],
    shy: ['...Like the new one. Everyone watching to see if I can.'],
    curious: ['Interested, honestly. I\'d never have tried it. Now I have to.'],
    dreamy: ['Like I\'ve been dropped into a different story. I\'m learning my lines.'],
    witty: ['Like a square peg that\'s been told it\'s round now.'],
    proud: ['I\'ll do it well. I do everything well. But I\'d have liked to be asked.'],
    gloomy: ['Unwanted. Somewhere else. Then needed here. It\'s confusing.'],
  });
  W('work.ask.steward.saw', {
    _: ['Saw something? In me? Ha. I hadn\'t thought of that.', 'Maybe. Or maybe I was nearest. Like always.'],
    proud: ['Of course they did. They\'re not fools.'],
    gloomy: ['Saw a spare pair of hands, more like.'],
  });
  W('work.ask.steward.miss', {
    _: ['The old {workFormer}\'s work. The way I knew every bit of it with my eyes shut.', 'Being good at it. I\'m not good at this. Yet.'],
    cheerful: ['The folk! I\'d got to know everyone on the old round.'],
    ornery: ['Knowing what I was doing.'],
  });
  W('work.ask.steward.bristle', {
    _: ['A season? I didn\'t ask to be told to wait. I asked what you thought.', 'Easy to say "a season" when it isn\'t your season.'],
    proud: ['I don\'t need patience. I need to be asked.'],
  });
  W('work.ask.steward.season', { _: ['A season. Yes, that\'s fair. Then I\'ll know.', 'All right. One season. I\'ll give it my all.'], ornery: ['One season. Then I\'m having words.'], shy: ['...A season. I can do a season.'] });
  W('work.ask.steward.chess', { _: ['A chess piece! That\'s exactly it. ...Thank you for understanding.', '...It is hard. I\'m glad somebody said so.'], ornery: ['A pawn, more like. Hmph. ...Thank you.'] });
  W('work.ask.steward.chose', { _: ['Chose well. ...I\'ll try to deserve it.', 'You think so? Then perhaps they did.'], proud: ['They did. I\'ll prove it.'] });
  W('work.ask.steward.keep', { _: ['An evening here and there. Yes. For old times.', 'Keep a bit. I like that. I\'ll not let it go entirely.'], shy: ['...Just for me. I\'d like that.'], ornery: ['Hm. Nobody can stop me doing it of an evening.'] });

  // --- Their turn: how do I beat my rival? -------------------------------------------------
  addThread({
    id: 'work.ask.rival', theirs: true, label: 'A favor about their rival', cool: 5, ask: '{Name} has a favor to ask, about {workRival}.',
    when: (F) => !!F.workRival && F.stage !== 'child' && F.met && (F.season === 'autumn' || F.season === 'summer'),
    beats: {
      start: { line: 'work.ask.rival.start', go: [
        { ap: 'advise', say: 'work.ask.rival.tip', label: 'Give them a tip', to: 'tip' },
        { ap: 'jest', say: 'I could turn {workRival}\'s {workRivalThing} into a frog.', to: 'frog' },
        { ap: 'advise', say: 'Beat them by being kind. It drives rivals mad.', to: [{ to: 'bristle', need: { if: { temper: ['proud', 'ornery'] } } }, 'kind'] },
      ] },
      frog: { line: 'work.ask.rival.frog', go: [
        { ap: 'advise', say: 'work.ask.rival.tip', label: 'All right: give them a real tip', to: 'tip' },
        { ap: 'warm', say: 'I\'d rather you won it yourself. You can.', to: 'can' },
      ] },
      tip: { line: 'work.ask.rival.tipped', fx: { respect: 0.03, run: (T, v) => { const k = T.F.workFix; if (k) pushQ(v, k); if (typeof feel === 'function') feel(v, 'good_tip', 'the wizard'); } }, go: [
        { ap: 'warm', say: 'Good luck at the {workLifeFair}.', to: 'luck' },
        { ap: 'jest', say: 'And if you win, I want a share.', to: 'share' },
      ] },
      bristle: { line: 'work.ask.rival.bristle', go: [
        { ap: 'advise', say: 'work.ask.rival.tip', label: 'Then a proper tip', to: 'tip' },
        { ap: 'jest', say: 'I could turn {workRival}\'s {workRivalThing} into a frog.', to: 'frog' },
      ] },
      kind: { line: 'work.ask.rival.kind', fx: { respect: 0.03 }, end: true },
      can: { line: 'work.ask.rival.can', fx: { trust: 0.02, fond: 0.01 }, end: true },
      luck: { line: 'work.ask.rival.luck', fx: { fond: 0.02 }, end: true },
      share: { line: 'work.ask.rival.share', fx: { fond: 0.02, joke: { k: 'work.rival.share', t: 'The wizard wants a share of the prize.' } }, end: true },
    },
  });
  W('work.ask.rival.start', {
    _: ['Wizard. Between us. How do I beat {workRival} for {workRivalWhat}? Just once.', 'You\'re clever. Tell me how to beat {workRival} at the {workLifeFair}. Please.'],
    cheerful: ['Help me beat {workRival}! Just once! I\'ll be ever so nice about it after!'],
    ornery: ['I need to beat {workRival}. I don\'t care how. Well. I care a little how.'],
    shy: ['...Is there a secret? To winning {workRivalWhat}? {WorkRival} seems to know it.'],
    curious: ['What\'s {workRival}\'s secret? You must know. Wizards know things.'],
    proud: ['I don\'t need help beating {workRival}. But if you had a thought, I\'d hear it.'],
    gloomy: ['I\'ll lose to {workRival} again. Unless you know something I don\'t.'],
    'workRivalLead=ahead ^1': ['I\'m ahead of {workRival}, and I mean to stay ahead. Any thoughts?'],
  });
  W('work.ask.rival.tip', {
    _: ['Do the plain things perfectly. Contests are won on the basics.', 'Practice early, rest the day before, and don\'t look at their table.'],
    'workRivalThing=pie': ['Cold butter, a hot oven, and don\'t fuss the pastry.'],
    'workRivalThing=pumpkin': ['Water at dusk, and talk to it. Pumpkins are vain.'],
    'workRivalThing=ale': ['Clean everything twice, and let it rest a day longer than you dare.'],
    'workRivalThing=fish': ['Go before dawn, where the willow hangs over. The big ones lie in the shade.'],
    'workRivalThing=carving': ['Follow the grain. Don\'t make the wood do what it doesn\'t want.'],
    'workRivalThing=tale': ['Tell it shorter than you want to. End it sooner than they expect.'],
    'workRivalThing=remedy': ['Fresh-picked, ground fine, and a spoon of honey. Judges are hobbits too.'],
    'workRivalThing=gadget': ['Make it do one thing beautifully. Not ten things badly.'],
  });
  W('work.ask.rival.frog', {
    _: ['Ha! Tempting. Very tempting. ...No. I\'d never live it down.', 'A FROG! Oh, the look on their face! No. No. ...No.'],
    ornery: ['Hmph. Don\'t tempt me.'],
    witty: ['A frog would probably still win. That\'s the kind of luck {workRival} has.'],
    shy: ['*giggles* ...No, that\'s not fair.'],
    proud: ['I\'ll win fairly or not at all. ...Was that a real offer?'],
  });
  W('work.ask.rival.tipped', {
    _: ['That\'s it? That simple? ...I\'ll try it. I\'ll practice tonight.', 'Huh. I\'d have never thought of that. Right. To work.'],
    cheerful: ['Oh, that\'s clever! I\'m going to win! Probably! Possibly!'],
    ornery: ['Hm. Might work. If it does I\'ll say I thought of it.'],
    shy: ['...Thank you. I\'ll try. Don\'t tell {workRival}.'],
    curious: ['Oh! Yes. That\'s the bit I\'ve been missing.'],
    proud: ['I\'d half thought of that. But it helps to hear it.'],
    gloomy: ['It won\'t be enough. ...I\'ll try it anyway.'],
    dreamy: ['The plain things, perfectly. Like a song with three notes.'],
    witty: ['If I win, I\'ll give you a mention. A small one.'],
  });
  W('work.ask.rival.bristle', {
    _: ['Kind? To {workRival}? I asked how to beat them, not hug them.', 'Being kind never won anything at a fair.'],
    proud: ['I\'ll be kind after I\'ve won.'],
  });
  W('work.ask.rival.kind', {
    _: ['Kind. Hm. It WOULD drive them mad. ...I\'ll try it.', 'Ha! That\'s devious. I like it.'],
    shy: ['...I can do kind. I\'m good at kind.'],
    witty: ['Weaponized kindness. Oh, that\'s wicked. I\'m in.'],
  });
  W('work.ask.rival.can', { _: ['...You think I can? Then I\'ll try.', 'Myself. Yes. That\'d mean more.'], gloomy: ['...Maybe. Maybe I can.'], proud: ['I can. I know I can.'], cheerful: ['I can! I CAN! Watch me!'] });
  W('work.ask.rival.luck', { _: ['Thank you. I\'ll need it.', 'I\'ll make my own luck. With your tip.'], proud: ['I won\'t need luck. But thank you.'], shy: ['...Thank you. Will you come and watch?'], witty: ['Luck\'s for those without a wizard\'s tip.'] });
  W('work.ask.rival.share', { _: ['Ha! A share of a ribbon? You can have the ribbon. I want the glory.', 'Ha! You\'ll get a slice. A thin one.'], ornery: ['A share! Wizards. Always an angle.'], cheerful: ['Half! You can have half! Of the ribbon.'] });
});
