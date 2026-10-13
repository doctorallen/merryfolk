'use strict';
// ---------------------------------------------------------------------------
// Pastimes, part three: the habits folk grow fond of out of doors and at the
// inn (js/actions.js, weighed by habit in js/villager.js). An evening at the
// Tipsy Badger; a pipe on the step, and a smoke-ring contest with the wizard
// (who cheats); the river and the one that got away; the garden and its prize
// vegetables; mushrooming, and a patch nobody else knows. Some of them they
// bring up themselves. Facts come from the pastimes pack.
// ---------------------------------------------------------------------------

talkPack('pastimes3', () => {
  const has = (x) => x != null && x !== false && x !== '' && x !== 0;
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
  const habit = (F, k) => (F.habits || []).includes(k) || F.leisure === k;
  // something they'll go and do after the talk, if they can just now
  const queueIf = (id) => (T, v) => {
    const a = ACTIONS[id];
    if (!a || (a.stages && !a.stages.includes(v.stage))) return;
    try { if (a.avail && !a.avail(v, Game.hour)) return; } catch (e) { return; }
    v.queue.push({ a });
  };

  // ==================================================================================
  // --- The inn and the ale ---------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.inn', about: 'habit', reveals: 'pastime.inn', weight: 1, cool: 4,
    label: 'An evening at the Badger',
    when: (F) => F.stage !== 'child' && (habit(F, 'ale') || habit(F, 'inn') || F.job === 'innkeeper' || F.job === 'brewer'),
    rel: (F) => (F.hour === 'evening' ? 1.4 : 1) * (habit(F, 'ale') ? 1.2 : 1),
    open: { ask: 'pastime.inn.open' },
    beats: {
      start: { line: 'pastime.inn.start', go: [
        { ap: 'ask', say: 'Where do you sit? Everyone has a seat.', to: 'seat' },
        { ap: 'jest', say: 'How many is \'just the one\', in Badger measures?', to: 'one' },
        { ap: 'ask', say: 'Do you sing, on a Mersday?', to: 'sing' },
      ] },
      seat: { line: 'pastime.inn.seat', fx: { learn: ['pastime.inn', '{Name} has a favourite seat at the Tipsy Badger'] }, go: [
        { ap: 'ask', say: 'And who sits with you?', to: 'company' },
        { ap: 'jest', say: 'What happens if someone else sits in it?', to: 'usurper' },
      ] },
      one: { line: 'pastime.inn.one', fx: { joke: { k: 'pastime.justone', t: '\'Just the one.\' In Badger measures.' } }, go: [
        { ap: 'ask', say: 'What\'s the ale like, this season?', to: 'ale' },
        { ap: 'jest', say: 'I once saw a dwarf say \'just the one\'. We buried the barrel with honours.', to: 'dwarf' },
      ] },
      sing: { line: 'pastime.inn.sing', go: [
        { ap: 'ask', say: 'What\'s your song? Everyone has a song.', to: 'song' },
        { ap: 'share', say: 'I know a few. Some of them are even repeatable.', to: 'wizsong' },
      ] },
      company: { line: 'pastime.inn.company', go: [
        { ap: 'warm', say: 'That\'s what an inn is for. Not the ale. The company.', to: 'notale' },
        { ap: 'ask', say: 'And what do you talk about, the lot of you?', to: 'talk' },
      ] },
      usurper: { line: 'pastime.inn.usurper', go: [
        { ap: 'jest', say: 'I\'ll remember never to sit there. Not even by accident.', to: 'end' },
        { ap: 'ask', say: 'Has it ever come to blows?', to: 'blows' },
      ] },
      ale: { line: 'pastime.inn.ale', go: [
        { ap: 'advise', say: 'Have one tonight on me, then. Tell them the wizard said so.', to: 'onme' },
        { ap: 'ask', say: 'Who brews it?', to: 'brewer' },
      ] },
      dwarf: { line: 'pastime.inn.dwarf', go: [
        { ap: 'tale', say: 'Thorin\'s cousin. He drank the Prancing Pony dry and asked for the menu.', to: 'pony' },
        { ap: 'jest', say: 'Dwarves have hollow legs. It\'s well known.', to: 'end' },
      ] },
      song: { line: 'pastime.inn.song', go: [
        { ap: 'warm', say: 'Sing me a bit. Go on.', to: 'verse', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'I\'ll come on Mersday and drown you out.', to: 'drown' },
      ] },
      wizsong: { line: 'pastime.inn.wizsong', go: [
        { ap: 'share', say: 'There\'s one about a bath. Hot water, and a lot of shouting.', to: 'bath' },
        { ap: 'jest', say: 'The others would get me thrown out of three counties.', to: 'end' },
      ] },
      notale: { line: 'pastime.inn.notale', fx: { fond: 0.02 }, end: true },
      talk: { line: 'pastime.inn.talk', go: [
        { ap: 'ask', say: 'And who tells the tallest tales?', to: 'tales' },
        { ap: 'warm', say: 'I\'d like to sit in, some evening.', to: 'sitin' },
      ] },
      blows: { line: 'pastime.inn.blows', end: true },
      onme: { line: 'pastime.inn.onme', fx: { fond: 0.03, owe: 1, run: queueIf('ale') }, end: true },
      brewer: { line: 'pastime.inn.brewer', end: true },
      pony: { line: 'pastime.inn.pony', fx: { fond: 0.02, feel: 'wizard_tale', feelX: 'the dwarf at the Prancing Pony' }, end: true },
      verse: { line: 'pastime.inn.verse', fx: { fond: 0.03, trust: 0.02 }, end: true },
      drown: { line: 'pastime.inn.drown', fx: { promise: { k: 'pastime.mersday', t: '{Name} expects you at the Badger for the Mersday sing-song', days: 7 } }, end: true },
      bath: { line: 'pastime.inn.bath', fx: { joke: { k: 'pastime.bathsong', t: 'The wizard\'s bath song. Hot water, and a lot of shouting.' } }, end: true },
      tales: { line: 'pastime.inn.tales', end: true },
      sitin: { line: 'pastime.inn.sitin', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.inn.open', ['Shall I see you at the Badger tonight, {name}?', 'I hear you know the Tipsy Badger rather well, {name}.', 'Where does a hobbit go of an evening, {name}? The Badger, I\'m told.'], {}, [
    { if: { hour: 'evening' }, text: ['Off to the Badger, {name}? I can smell the stew from here.'] },
    { if: { job: 'innkeeper' }, text: ['How\'s the Badger, {name}? Still the best fire in the valley?'] },
    { if: { job: 'brewer' }, text: ['How\'s the ale this season, {name}? Honestly, now.'] },
  ]);
  L('pastime.inn.start', ['Oh, most evenings, I\'ll not lie. A pint, a pie, a bit of company.', 'The Badger? Now and then. Then and now. Mostly then.', 'Well, a hobbit needs somewhere to sit that isn\'t home.'], {
    cheerful: ['The Badger! Oh, it\'s the best room in the world! Everyone\'s there and everyone\'s glad!', 'Most nights! There\'s always someone to laugh with.'],
    ornery: ['When the noise isn\'t too bad. Which it always is.', 'I go for the ale. Not the company. Especially not the company.'],
    shy: ['...Sometimes. I sit by the fire. In the corner.', '...I like it when it\'s quiet. Early. Before the singing.'],
    curious: ['I go for the news. Everything that happens in this valley gets told at the Badger by nine.', 'I go to listen. You hear everything if you sit by the barrels.'],
    dreamy: ['I like the windows at night. All gold. Like the inn\'s keeping a secret.', 'I like it when everyone\'s singing and nobody knows the words.'],
    witty: ['I\'m practically a fixture. They dust me on Highdays.', 'The Badger and I have an understanding. I bring the money and it brings the ale.'],
    proud: ['I\'m a valued regular. My mug hangs on its own hook.', 'They keep a seat for me. Not everyone gets a seat kept.'],
    gloomy: ['It\'s warm and nobody asks how you are. That\'s worth something.', 'It beats sitting alone. Just about.'],
  }, [
    { if: { job: 'innkeeper' }, pri: 1, text: ['Every night! I keep it! Pulling pints, keeping the fire, keeping the peace.', 'I\'m behind the bar, so I see it all. I could tell you things.'] },
    { if: { job: 'brewer' }, pri: 1, text: ['I like to watch them drink it. It\'s like a cook watching folk eat.'] },
    { if: { stage: 'elder' }, text: ['Fifty years I\'ve been going. The fire\'s the same. The faces change.'] },
    { if: { rift: true }, text: ['Back home the bars had no doors and no names. This one has a badger. I love the badger.'] },
    { if: { weather: 'rain' }, text: ['On a day like this? I\'ll be there by four. With my boots by the fire.'] },
    { if: { season: 'winter' }, text: ['In winter it\'s the warmest room in the valley. Where else would I go?'] },
  ]);
  L('pastime.inn.seat', ['By the fire, on the left. The settle with the wobble.', 'At the end of the bar, where I can see the door.'], {
    cheerful: ['Wherever there\'s a gap! Right in the middle of things!'],
    ornery: ['MY seat. By the fire. And everyone knows it.'],
    shy: ['...The corner. Behind the coats. Nobody notices me there.'],
    curious: ['By the barrels. You hear everything. Everything.'],
    dreamy: ['By the window. I watch the lanterns going home.'],
    witty: ['The one nearest the kitchen. Strategic.'],
    proud: ['The good chair. With arms. The innkeeper keeps it for me.'],
    gloomy: ['Anywhere. Near the fire. I\'m always cold.'],
  }, [
    { if: { job: 'innkeeper' }, pri: 1, text: ['Seat? Ha! I haven\'t sat down since spring.'] },
  ]);
  L('pastime.inn.one', ['Just the one is a pint. Two is \'just the one more\'. Three\'s a sing-song.', 'Ha! Just the one. Every time. It\'s a very elastic one.'], {
    cheerful: ['Ha! Just the one! And then just the one! It\'s a lovely tradition!'],
    ornery: ['One. I have one. I don\'t know what you\'ve heard.'],
    shy: ['...One. Honestly. Sometimes two.'],
    curious: ['I worked it out once. \'Just the one\' averages two and a third.'],
    dreamy: ['As many as it takes for the fire to look like it\'s telling a story.'],
    witty: ['It\'s a unit of measure, not a number. Like \'a while\' or \'presently\'.'],
    proud: ['I know my limits. They\'re just quite generous.'],
    gloomy: ['One. Then I go home. To nothing much.'],
  }, [
    { if: { tipsy: true }, pri: 2, text: ['Jusht the one! ...I may have had the one already. Twice.'] },
  ]);
  L('pastime.inn.sing', ['On a Mersday everyone sings. Whether they can or not.', 'Sing? The whole Badger sings. You can hear us at the mill.'], {
    cheerful: ['Oh, yes! Loudest in the room! Ask anyone! Ask them from a distance!'],
    ornery: ['Not if I can help it. I tap my foot. That\'s my concession.'],
    shy: ['...I hum. Quietly. In the back.'],
    curious: ['I\'ve been collecting the verses. Some of the old songs have twenty. Nobody knows them all.'],
    dreamy: ['The slow ones, at the end of the night. When everyone\'s quiet and the fire\'s low.'],
    witty: ['I sing. Others call it something else. But I sing.'],
    proud: ['I\'ve a fine voice. I\'m usually asked to start.'],
    gloomy: ['Only the sad ones. There are always sad ones by the end.'],
  });
  L('pastime.inn.company', ['Whoever\'s in. That\'s the beauty of it.', 'The same three, most nights. We\'ve said everything. We say it again.'], {
    cheerful: ['Everybody! I go round all the tables!'],
    ornery: ['Nobody, if I can manage it.'],
    shy: ['...Nobody, mostly. It\'s all right. I like watching.'],
    curious: ['Whoever has the best story that night. I follow the stories.'],
    dreamy: ['Folk drift in and out. Like tides.'],
    witty: ['A very exclusive circle. Membership: whoever buys the next round.'],
    proud: ['People tend to come to me.'],
    gloomy: ['Nobody. I sit with my pint. It doesn\'t mind.'],
  }, [
    { if: { friend: has }, text: ['{Friend}, mostly. {Friend} and I have a table. It\'s not official. It\'s official.'] },
    { if: { spouse: has }, text: ['{Spouse}, when {spouse} can be got out of the house.'] },
  ]);
  L('pastime.inn.usurper', ['They get a look. One look. They move.', 'It happened once. We don\'t speak of it.'], {
    cheerful: ['Ha! I just sit on their lap! Nobody minds! Well, some mind.'],
    ornery: ['They don\'t. Not twice.'],
    shy: ['...I find another seat. And feel sad all evening.'],
    witty: ['I sit on the floor in front of them and stare. It takes about four minutes.'],
    proud: ['Nobody would. It\'s understood.'],
  });
  L('pastime.inn.ale', ['Good this season. The brewer\'s got the hops right at last.', 'Brown, wet and there\'s plenty. What more is there?'], {
    cheerful: ['Oh, it\'s grand! Nutty! Like autumn in a mug!'],
    ornery: ['Thin. It was better last year. It\'s always better last year.'],
    shy: ['...It\'s nice. I don\'t know much about ale.'],
    curious: ['It\'s different every brewing. I\'ve been trying to work out if it\'s the water or the weather.'],
    dreamy: ['It tastes of the barley field in August. If you shut your eyes.'],
    witty: ['Excellent. I\'ve tested it thoroughly. Repeatedly. For science.'],
    proud: ['Decent. I\'ve a good palate. I\'d know.'],
    gloomy: ['It\'s ale. It does what ale does.'],
  }, [
    { if: { job: 'brewer' }, pri: 1, text: ['Mine? It\'s the best batch I\'ve done. Don\'t tell anyone, but I sang to it.'] },
  ]);
  L('pastime.inn.dwarf', ['Ha! With honours! I\'d like to have seen that.', 'A dwarf! Did they really? A whole barrel?'], {
    cheerful: ['Ha! Oh, I\'d have paid to see that!'],
    ornery: ['Dwarves. No manners. ...How big a barrel?'],
    curious: ['How much does a dwarf hold? Is it true they have two stomachs?'],
    witty: ['I\'ve buried a few barrels myself. Never with honours. A quiet family affair.'],
  });
  L('pastime.inn.song', ['\'The Badger\'s Daughter\'. Eleven verses. I know nine.', '\'Down by the Mill Race\'. Everyone joins in the chorus. Everyone.'], {
    cheerful: ['\'Hey Ho, to the Bottle I Go\'! You must know it! Everybody knows it!'],
    ornery: ['I haven\'t got a song. ...\'Old Man Willow\'. If you must know.'],
    shy: ['...\'The Road Goes Ever On\'. The slow one.'],
    curious: ['\'The Man in the Moon\'. There\'s a verse nobody else sings. I found it in an old book.'],
    dreamy: ['The one about the ship that sails into the west. I don\'t know its name. I just know it.'],
    witty: ['\'The Cow Jumped Over the Moon\'. I do the cow.'],
    proud: ['\'The Lay of the Long Lane\'. I sing it solo. On request.'],
    gloomy: ['\'The Last Leaf\'. It\'s about a leaf. That falls. It\'s very good.'],
  });
  L('pastime.inn.wizsong', ['Repeatable! Ha! Now I want to hear the others.', 'A wizard who sings! Come on Mersday! I\'ll stand you a pint.'], {
    cheerful: ['Ha! Come and sing! Oh, please do!'],
    ornery: ['Hm. As long as it\'s not one of the long elvish ones.'],
    witty: ['The unrepeatable ones are the best ones. Everybody knows that.'],
  });
  L('pastime.inn.notale', ['...That\'s true, you know. It\'s the company. The ale\'s just the excuse.', 'Ha! Don\'t tell the brewer.'], {
    gloomy: ['...Yes. I suppose that\'s why I go.'],
  });
  L('pastime.inn.talk', ['Weather. Crops. Who\'s courting. Weather again.', 'Everything and nothing. Mostly who\'s done what to whose hedge.'], {
    curious: ['Everything! Last night we argued for an hour about whether fish sleep.'],
    witty: ['The weather, in very great depth. We\'re experts.'],
    dreamy: ['Sometimes, late on, the old days. Folk who\'ve gone. That\'s my favourite.'],
    ornery: ['Rubbish. Pure rubbish.'],
  });
  L('pastime.inn.blows', ['Once. Over a seat. And a pie. Mostly the pie.', 'Never. Very nearly, over a game of shove-ha\'penny.'], {
    ornery: ['Not yet.'],
    witty: ['A duel, once. With wet towels. Nobody won. Everybody was damp.'],
  });
  L('pastime.inn.onme', ['On you? Oh, I\'ll hold you to that! I\'ll drink your health!', 'The wizard\'s round! They\'ll never believe it.'], {
    cheerful: ['Oh, you are a dear! I\'ll toast you! Twice!'],
    ornery: ['Hm. Well. I won\'t say no.'],
    shy: ['...You don\'t have to. ...Thank you.'],
    witty: ['I\'ll tell them the wizard said so, and then I\'ll tell them what else the wizard said. I\'ll improve it.'],
    proud: ['Generous. I\'ll accept.'],
    gloomy: ['...That\'s kind. I\'ll raise it to you.'],
  });
  L('pastime.inn.brewer', ['Our brewer. Up at dawn, in the brew-house. Smells of malt for miles.', 'Ask the brew-house. They\'ll tell you it\'s a secret. It\'s barley.'], {
    witty: ['A genius and a menace. Mostly a genius.'],
  });
  L('pastime.inn.pony', ['And asked for the menu! Ha! Oh, that\'s going round the Badger tonight.', '*They laugh till they cough.* The menu!'], {
    ornery: ['...Ha. All right. That\'s funny.'],
    curious: ['The Prancing Pony! In Bree! You\'ve been! What\'s it like?'],
  });
  L('pastime.inn.verse', ['*They clear their throat and sing, a little wobbly, the chorus of a drinking song.* ...There. Don\'t tell anyone.', '*They hum, then sing a line, then go pink and stop.*'], {
    cheerful: ['*They sing the whole first verse, loudly, and two hens leave the lane.*'],
    shy: ['*A very small voice, barely a whisper, but true.* ...That\'s all I know.'],
    proud: ['*They sing a verse, rather well, and wait for applause.*'],
  });
  L('pastime.inn.drown', ['Ha! You\'d try! Mersday, then. I\'ll save you a stool.', 'You\'re on. Bring your loudest voice. And your wallet.'], {
    ornery: ['You can try. Nobody drowns me out.'],
  });
  L('pastime.inn.bath', ['A BATH song? You\'ll have to teach us! The Badger will go wild!', 'Ha! Hot water and shouting! That\'s every Highday in our hole!'], {
    curious: ['How does it go? Is there a chorus? Is it in elvish?'],
  });
  L('pastime.inn.tales', ['The old miller. His fish get bigger every telling.', 'The postie. She makes them up as she goes and swears they\'re true.'], {
    proud: ['I do. I\'ve won for it.'],
    witty: ['Me. But mine are true. Mostly. In spirit.'],
  }, [
    { if: { won: 'the best tall tale' }, pri: 1, text: ['Me! I won the tall tale at the fair! It was about a goose. It was very tall.'] },
  ]);
  L('pastime.inn.sitin', ['Do! Nobody would believe it. The wizard, at the Badger!', 'Come by. There\'s room on the settle.'], {
    ornery: ['As long as you don\'t take my seat.'],
    shy: ['...I\'d like that. You could sit with me.'],
  });

  // ==================================================================================
  // --- The pipe, pipe-weed and smoke rings --------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.pipe', about: 'habit', reveals: 'pastime.pipe', weight: 1, cool: 4,
    label: 'A pipe on the step',
    when: (F) => F.stage !== 'child' && (F.pipe || habit(F, 'pipe')),
    rel: (F) => (F.hour === 'evening' ? 1.4 : 1) * (habit(F, 'pipe') ? 1.2 : 1),
    open: { share: 'pastime.pipe.open' },
    beats: {
      start: { line: 'pastime.pipe.start', go: [
        { ap: 'ask', say: 'What leaf do you smoke?', to: 'leaf' },
        { ap: 'jest', say: 'Can you blow a smoke ring? A proper one?', to: 'ring' },
        { ap: 'share', say: 'Here. Fill your pipe from my pouch.', to: 'share', need: { if: { pouch: { max: 1 } } } },
        { ap: 'listen', say: '*You light your own pipe and say nothing for a while.*', label: 'Smoke together, quietly', to: 'quiet' },
      ] },
      leaf: { line: 'pastime.pipe.leaf', fx: { learn: ['pastime.pipe', '{Name} loves a pipe on the step of an evening'] }, go: [
        { ap: 'ask', say: 'And the pipe itself? It looks well loved.', to: 'thepipe' },
        { ap: 'share', say: 'The best leaf I ever had was in a cave, with a dragon snoring.', to: 'dragon' },
      ] },
      ring: { line: 'pastime.pipe.ring', go: [
        { ap: 'tale', say: 'Not bad. Watch this. *You blow a ship, with sails.*', label: 'Blow a smoke ship', to: 'ship' },
        { ap: 'jest', say: '*You blow a small ring straight through theirs.*', label: 'Blow a ring through theirs', to: 'through' },
        { ap: 'warm', say: 'That\'s a beauty. Rounder than mine.', to: 'letwin' },
      ] },
      share: { line: 'pastime.pipe.share', fx: { fond: 0.03, owe: 1, drive: { craving: -0.4 } }, go: [
        { ap: 'ask', say: 'Good, isn\'t it? Now. Smoke rings?', to: 'ring' },
        { ap: 'listen', say: '*You both smoke in silence a while.*', label: 'Smoke in silence', to: 'quiet' },
      ] },
      quiet: { line: 'pastime.pipe.quiet', fx: { trust: 0.03 }, go: [
        { ap: 'listen', say: '*You wait. The smoke goes up.*', label: 'Wait', to: 'thought', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'There\'s no better hour than this one.', to: 'end' },
      ] },
      thepipe: { line: 'pastime.pipe.thepipe', go: [
        { ap: 'warm', say: 'A pipe like that is half a friend.', to: 'end' },
        { ap: 'ask', say: 'Who gave it to you?', to: 'gave', need: { open: 1 } },
      ] },
      dragon: { line: 'pastime.pipe.dragon', fx: { feel: 'wizard_tale', feelX: 'the dragon\'s cave' }, go: [
        { ap: 'tale', say: 'He woke up halfway down the pipe. I\'ve never smoked so fast.', to: 'woke' },
        { ap: 'jest', say: 'The smoke rings were enormous. Mostly his.', to: 'end' },
      ] },
      ship: { line: 'pastime.pipe.ship', fx: { learn: ['pastime.rings', '{Name} has seen your smoke ship and wants a rematch'] }, go: [
        { ap: 'warm', say: 'Your turn. Go on.', to: 'answer' },
        { ap: 'jest', say: 'Three hundred years of practice. And a little magic. Very little.', to: 'cheat' },
      ] },
      through: { line: 'pastime.pipe.through', fx: { joke: { k: 'pastime.through', t: 'The wizard blew a ring through their ring. Cheat.' }, learn: ['pastime.rings', '{Name} has seen your smoke rings and wants a rematch'] }, go: [
        { ap: 'jest', say: 'Best of three?', to: 'answer' },
        { ap: 'warm', say: 'Yours was the better ring. Mine just had better aim.', to: 'letwin' },
      ] },
      letwin: { line: 'pastime.pipe.letwin', fx: { fond: 0.03, respect: -0.01, learn: ['pastime.rings', '{Name} thinks they beat you at smoke rings'] }, end: true },
      thought: { line: 'pastime.pipe.thought', fx: { trust: 0.03, feel: 'drawn_out' }, end: true },
      gave: { line: 'pastime.pipe.gave', fx: { trust: 0.02 }, end: true },
      woke: { line: 'pastime.pipe.woke', fx: { fond: 0.02 }, end: true },
      answer: { line: 'pastime.pipe.answer', go: [
        { ap: 'warm', say: 'Splendid! I concede. This once.', to: 'concede' },
        { ap: 'jest', say: '*You blow a little smoke dragon that eats their ring.*', label: 'A smoke dragon eats their ring', to: 'dragoneat' },
      ] },
      cheat: { line: 'pastime.pipe.cheat', fx: { joke: { k: 'pastime.cheat', t: 'The wizard cheats at smoke rings. A little magic. Very little.' } }, end: true },
      concede: { line: 'pastime.pipe.concede', fx: { fond: 0.03 }, end: true },
      dragoneat: { line: 'pastime.pipe.dragoneat', fx: { fond: 0.02, joke: { k: 'pastime.smokedragon', t: 'The smoke dragon that ate the ring.' } }, end: true },
    },
    end: { fond: 0.02, trust: 0.01 },
  });
  L('pastime.pipe.open', ['Mind if I join you for a pipe, {name}?', 'That smells like good leaf, {name}. Room on the step?', 'A pipe on a fine {hour}, {name}. Nothing like it.'], {}, [
    { if: { weather: 'rain' }, text: ['Too wet for the step, {name}. Under the eaves, then? A pipe?'] },
    { if: { hour: 'evening' }, text: ['Evening, {name}. The hour for a pipe, wouldn\'t you say?'] },
  ]);
  L('pastime.pipe.start', ['Sit, sit. There\'s room. A pipe\'s better with company.', 'Of an evening, on the step. Watch the swallows. It\'s a full programme.'], {
    cheerful: ['Oh, sit! There\'s nothing better than a pipe and a natter!'],
    ornery: ['Sit if you like. Don\'t talk too much. Pipe\'s for thinking.'],
    shy: ['...Oh. Yes. Sit. If you want.'],
    curious: ['Sit! I\'ve been wanting to ask a wizard about pipe-weed. Do you smoke anything different, out there?'],
    dreamy: ['Sit. Watch the smoke. It goes up and never comes down. Where does it go, do you think?'],
    witty: ['Sit. I\'ll warn you, I\'m very good company until the pipe goes out.'],
    proud: ['You\'ll find my leaf\'s the best on the lane.'],
    gloomy: ['Sit. It\'s the only good part of the day.'],
  }, [
    { if: { pouch: 0 }, pri: 1, text: ['I would, if I had any leaf. Pouch is empty. Has been since Sterday.', 'Empty pouch. I\'m just holding the pipe for comfort.'] },
    { if: { stage: 'elder' }, text: ['Sixty years I\'ve smoked on this step. The step\'s worn to my shape.'] },
    { if: { job: 'grower' }, pri: 1, text: ['My own leaf! I grow it. Smoke a bit of the field, I do.'] },
  ]);
  L('pastime.pipe.leaf', ['Our own. From the leaf-field by the hill. It\'s rough, but it\'s ours.', 'Old Toby, when I can get it. The valley leaf when I can\'t.'], {
    cheerful: ['Whatever\'s in the Store! It\'s all lovely!'],
    ornery: ['The good stuff. Not that dry rubbish the young ones smoke.'],
    shy: ['...Just the valley leaf. Nothing special.'],
    curious: ['The valley leaf, but I\'ve been mixing in a bit of dried apple. Try it. No? Try it.'],
    dreamy: ['The leaf from the south field. It tastes of the summer it grew in.'],
    witty: ['Whatever I can borrow. I\'m a connoisseur of other people\'s pouches.'],
    proud: ['The finest leaf in the valley. Aged a year in a cedar box.'],
    gloomy: ['Whatever\'s left. It all tastes of ash in the end.'],
  }, [
    { if: { job: 'grower' }, pri: 1, text: ['My own, from the leaf-field. I know every plant. I talk to them.'] },
    { if: { rift: true }, text: ['Back home we didn\'t smoke. We vaped neon. Don\'t ask. This is better. This is real.'] },
  ]);
  L('pastime.pipe.ring', ['*They draw, and puff, and a wobbly ring sails off.* There. That\'s a ring.', '*A neat ring, then another inside it.* Ha! Two!'], {
    cheerful: ['*A ring, a ring, a ring, all in a row!* Ha! Count them!'],
    ornery: ['*One fat ring, perfectly round.* There. Beat that.'],
    shy: ['*A very small ring, which hangs a moment, then goes.* ...Oh. It was better yesterday.'],
    curious: ['*A ring that turns slowly as it goes.* See? It spins! It\'s all in the tongue.'],
    dreamy: ['*A ring drifts up, slow as a cloud, and settles round a twig.* ...Oh, look.'],
    witty: ['*A ring, then a tiny puff through the middle.* That\'s a ring with a thought in it.'],
    proud: ['*Three perfect rings, one inside another.* The triple. Very few can do it.'],
    gloomy: ['*A ring, which collapses at once.* ...That\'s my life, that is.'],
  }, [
    { if: { known: 'pastime.rings' }, pri: 1, text: ['A rematch! I\'ve been practising! *A ring, big as a cartwheel.* HA!'] },
  ]);
  L('pastime.pipe.share', ['*They fill their pipe from your pouch, sniff, and close their eyes.* ...Oh. Oh, that\'s the real thing.', 'From your pouch? Oh, I couldn\'t. ...I could. Thank you.'], {
    cheerful: ['Oh! Oh, that\'s lovely! Where\'s this from? It smells like a holiday!'],
    ornery: ['...Hm. That\'s good leaf. Very good. ...Thank you.'],
    shy: ['...You\'re very kind. *They fill the pipe carefully, not taking too much.*'],
    curious: ['Where\'s it from? It\'s darker. Is it from the south? The far south?'],
    witty: ['Wizard\'s leaf! If I start floating, it\'s your fault.'],
    proud: ['Fine leaf. Almost as good as mine. ...Better than mine.'],
    gloomy: ['...Thank you. That\'s the nicest thing that\'s happened this week.'],
  });
  L('pastime.pipe.quiet', ['*The smoke rises. A blackbird sings. After a long time:* ...This is nice.', '*You smoke together. Neither of you says anything. It\'s easy.*'], {
    cheerful: ['*They manage almost a whole minute before humming.*'],
    shy: ['*They relax, bit by bit, until their shoulders come down.*'],
    dreamy: ['*They watch the smoke curl up into the evening, smiling a little.*'],
    gloomy: ['*They sigh, a long one, and something seems to go out with it.*'],
  });
  L('pastime.pipe.thepipe', ['Briar. Older than me. The stem\'s been chewed by three generations.', 'It\'s an old one. Cherry-wood. Smells of fifty winters.'], {
    cheerful: ['Isn\'t it a beauty? It\'s got a little face carved on the bowl! Look!'],
    ornery: ['It\'s a pipe. It works. That\'s all a pipe needs to do.'],
    shy: ['...It was my father\'s.'],
    curious: ['It\'s clay, look. Clay pipes are cooler. But they break. This is my fourth.'],
    dreamy: ['It\'s been to the sea, they say. With my great-grandfather. Before he settled.'],
    witty: ['Very well loved. Mostly by me. Occasionally by the dog.'],
    proud: ['Hand-carved. Meerschaum. There isn\'t another like it in the Shire.'],
    gloomy: ['It\'s cracked. Like me. Still works, mostly.'],
  });
  L('pastime.pipe.dragon', ['A DRAGON? Snoring? You smoked a pipe next to a dragon?', '...You\'re having me on. ...Aren\'t you?'], {
    cheerful: ['Ha! Oh, you have to tell me! Was it a big dragon?'],
    ornery: ['That\'s a tall tale if ever I heard one. ...What leaf was it?'],
    curious: ['What did the cave smell like? Did the smoke bother it? Do dragons like pipe-weed?'],
    witty: ['And did you offer him a pipe? Very rude not to.'],
  });
  L('pastime.pipe.ship', ['*They watch the ship sail off, sails and all, and their mouth falls open.* ...That\'s not fair.', '*The smoke ship drifts over the lane.* ...How? HOW?'], {
    cheerful: ['A SHIP! Ha! Oh, do it again! Do a pig!'],
    ornery: ['...Show-off. ...Do it again so I can see how.'],
    shy: ['*They forget to be shy and just stare.* ...Oh.'],
    curious: ['How do you get the sails? Is it the tongue? Is it magic? Tell me it isn\'t magic.'],
    dreamy: ['*They watch it sail away west, until it\'s gone.* ...Where\'s it going?'],
    witty: ['A ship. Right. Fine. I\'ll see your ship and raise you... a slightly bigger ring.'],
    proud: ['...Well. That\'s very good. I\'ll need some time to answer that.'],
    gloomy: ['...I\'ll never do that. ...It was lovely, though.'],
  });
  L('pastime.pipe.through', ['*Your ring sails clean through the middle of theirs.* Oi! That\'s cheating!', '*They watch your ring go through theirs and break into a laugh.* You rotter!'], {
    cheerful: ['Ha! Through the middle! Do it again! No, let me do it to you!'],
    ornery: ['That is NOT allowed. That\'s ring-stealing.'],
    shy: ['*They gasp, then giggle into their sleeve.*'],
    curious: ['How did you aim it? Do you aim with the lips or the breath?'],
    witty: ['Through the middle! That\'s the rudest thing a ring can do.'],
    proud: ['A cheap trick. ...A good one. But cheap.'],
  });
  L('pastime.pipe.letwin', ['Rounder? Ha! You hear that, lane? Rounder than a wizard\'s!', 'Really? ...Ha! I\'m telling everyone.'], {
    cheerful: ['I BEAT THE WIZARD! Oh, I\'m telling everyone!'],
    ornery: ['Of course it was. Some of us practise.'],
    shy: ['...Really? ...Really?'],
    witty: ['I\'ll have that carved over my door. \'Rounder than the wizard\'s.\''],
    proud: ['I know. But thank you for admitting it.'],
    gloomy: ['...You\'re only saying that. ...Am I really?'],
  });
  L('pastime.pipe.thought', ['*At last:* ...I was thinking about my dad. He sat just here. That\'s all.', '*Quietly:* ...Do you ever wonder if you\'ve done enough? With the days, I mean.'], {
    cheerful: ['*Softly:* ...I\'m lucky, aren\'t I. I don\'t say it enough.'],
    ornery: ['*Gruffly:* ...I said a hard thing to someone. I keep thinking about it.'],
    shy: ['*Very quietly:* ...Thank you. For not making me talk.'],
    dreamy: ['*Barely a whisper:* ...I\'d like to see the sea. Once. That\'s all.'],
    gloomy: ['*After a long while:* ...It helps, you sitting here. I don\'t know why.'],
  });
  L('pastime.pipe.gave', ['My grandad. He said a pipe should be given, never bought.', '...Somebody I loved. A long time ago.'], {
    shy: ['...My mother. She smoked on this step too.'],
    witty: ['I won it at cards. From the miller. He still wants it back.'],
  });
  L('pastime.pipe.woke', ['HA! Halfway down the pipe! Oh, I\'m telling that at the Badger.', 'And did he? Did he chase you? Oh, wizard.'], {
    ornery: ['...Ha. All right. That\'s a good one.'],
    curious: ['What did he say? Did he say anything? Do they talk?'],
  });
  L('pastime.pipe.answer', ['*They take a long draw, puff out their cheeks, and... a ring. A decent ring.* There!', '*They try a ship. It comes out a sort of boat-shaped cloud.* ...It\'s a barge.'], {
    cheerful: ['*A huge wobbly ring, then a little one chasing it.* Mother and baby! Ha!'],
    ornery: ['*One perfect ring, slow and fat.* There. Simple. Honest. A ring.'],
    shy: ['*A small, very round ring.* ...That\'s my best.'],
    curious: ['*A ring with another spinning inside it, sideways.* I\'ve been practising that for a month!'],
    dreamy: ['*A soft ring that drifts and catches the light.* ...There. A moon.'],
    witty: ['*A ring, then a small puff that sits on top.* A ring wearing a hat. Like you.'],
    proud: ['*Five rings, each through the last.* The chain. Only my family can do it.'],
    gloomy: ['*A ring that wobbles and falls apart.* ...See? Never mind.'],
  }, [
    { if: { known: 'pastime.rings' }, pri: 1, text: ['I\'ve been practising since last time! *A ring the size of a cartwheel.* HA! Answer that!'] },
  ]);
  L('pastime.pipe.cheat', ['MAGIC! I knew it! You cheat! The wizard cheats!', 'A little magic! I\'ll tell everyone! A cheat, at smoke rings!'], {
    cheerful: ['Ha! A cheat! I don\'t care, it was beautiful! Cheat again!'],
    ornery: ['I knew it. Nobody blows a ship honest.'],
    witty: ['Very little magic. That\'s what all the cheats say.'],
    proud: ['Then I won. In the honest league.'],
  });
  L('pastime.pipe.concede', ['HA! The wizard concedes! This once! I\'ll take it!', 'This once! I\'ll have that written down.'], {
    ornery: ['As you should.'],
    shy: ['...Really? ...I won?'],
    witty: ['I\'ll frame that. \'This once.\''],
  });
  L('pastime.pipe.dragoneat', ['*Your little smoke dragon swallows their ring, burps, and drifts off.* ...You absolute cheat!', '*They watch the dragon eat their ring and laugh till they cough.*'], {
    cheerful: ['A DRAGON! It ATE it! Oh, I\'ve never laughed so much!'],
    ornery: ['...That\'s not a smoke ring. That\'s a smoke crime.'],
    curious: ['How did it chew? Did it chew? I swear it chewed!'],
    witty: ['A dragon. Eating my ring. In my own lane. I\'ll want compensation.'],
    proud: ['...That is cheating. ...Teach me.'],
  });

  // --- Their turn: a smoke-ring rematch --------------------------------------------------
  addThread({
    id: 'pastime.rematch', theirs: true, about: 'habit', label: 'A smoke-ring rematch', cool: 5,
    ask: '{Name} taps out a pipe, fills it slowly, and gives you a look. A challenging look.',
    when: (F) => F.stage !== 'child' && (F.known || []).includes('pastime.rings') && F.pouch > 0,
    beats: {
      start: { line: 'pastime.rematch.start', go: [
        { ap: 'jest', say: 'Again? You\'re a glutton for defeat.', to: 'again' },
        { ap: 'warm', say: 'Gladly. Your go first.', to: 'theirgo' },
      ] },
      again: { line: 'pastime.rematch.again', go: [
        { ap: 'tale', say: '*You blow a smoke eagle that circles the lane.*', label: 'Blow a smoke eagle', to: 'eagle' },
        { ap: 'warm', say: '*You blow a plain, honest ring.*', label: 'Blow a plain, honest ring', to: 'honest' },
      ] },
      theirgo: { line: 'pastime.rematch.theirgo', go: [
        { ap: 'warm', say: 'That\'s the best I\'ve seen in the Shire.', to: 'best' },
        { ap: 'jest', say: '*You blow a tiny ring that sits on theirs like a hat.*', label: 'Put a hat on their ring', to: 'hat' },
      ] },
      eagle: { line: 'pastime.rematch.eagle', fx: { fond: 0.02 }, end: true },
      honest: { line: 'pastime.rematch.honest', fx: { fond: 0.03, respect: 0.02 }, end: true },
      best: { line: 'pastime.rematch.best', fx: { fond: 0.03 }, end: true },
      hat: { line: 'pastime.rematch.hat', fx: { joke: { k: 'pastime.ringhat', t: 'The smoke ring wearing a hat. Like the wizard.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.rematch.start', ['I\'ve been practising. Every evening. On the step. Best of three.', 'Rematch. Now. No magic this time.'], {
    cheerful: ['REMATCH! I\'ve got a new one! You\'ll love it! You\'ll hate it!'],
    ornery: ['Rematch. No ships. No magic. Honest rings.'],
    shy: ['...I\'ve been practising. Would you... a rematch?'],
    curious: ['I\'ve worked out how you did the ship. I think. Rematch?'],
    dreamy: ['I dreamt I blew a smoke swan. Let me try.'],
    witty: ['The lane has been talking. My honour demands a rematch.'],
    proud: ['I\'ve had time to prepare. Prepare to lose.'],
    gloomy: ['I\'ll lose. But I\'d like to try.'],
  });
  L('pastime.rematch.again', ['Defeat? I\'ve been practising! Go on, you first. Show off.', 'Ha! Your go, then. Let\'s see the magic.'], {
    ornery: ['Glutton? We\'ll see who\'s a glutton. Go.'],
  });
  L('pastime.rematch.theirgo', ['*A ring, then a second through it, then a third.* There. THERE.', '*A long draw, and out comes something very like a swan.* ...Did you see that? A swan!'], {
    cheerful: ['*A whole string of rings like a necklace.* HA!'],
    shy: ['*A beautiful ring, perfectly round, that sails all the way to the hedge.* ...Oh.'],
    proud: ['*Five rings, in a chain.* Your move, wizard.'],
    gloomy: ['*A ring. A good one, for once.* ...Huh. Look at that.'],
  });
  L('pastime.rematch.eagle', ['*It circles the lane twice before it fades.* ...All right. All RIGHT. Next time.', 'An EAGLE? You can\'t just blow an eagle! ...Next time. Next time I\'ll have you.'], {
    cheerful: ['Ha! I give up! Do another one!'],
    ornery: ['Cheat. Cheat. ...That was magnificent. Cheat.'],
  });
  L('pastime.rematch.honest', ['*Your ring is good. Theirs was better. They see it, and their face lights up.* ...I won. I won fair!', 'An honest ring. ...Mine was rounder. Wasn\'t it? It was!'], {
    proud: ['A fair contest, fairly won. By me.'],
    shy: ['*They look from one ring to the other.* ...Did I win? I think I won.'],
  });
  L('pastime.rematch.best', ['Really? The best? I\'m going to tell my grandchildren that.', 'You\'re not just saying that? ...You\'re not. Oh!'], {
    gloomy: ['...The best. Me. Well.'],
  });
  L('pastime.rematch.hat', ['*Their ring sails off wearing yours like a hat.* ...That\'s YOU! It\'s a ring dressed up as you!', 'A ring in a hat! Ha! Oh, that\'s the best one yet!'], {
    ornery: ['...That\'s not fair, it\'s funny. You can\'t win by being funny.'],
  });

  // ==================================================================================
  // --- Fishing ---------------------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.fishing', about: 'habit', reveals: 'pastime.fishing', weight: 1, cool: 4,
    label: 'Down by the river with a rod',
    when: (F) => habit(F, 'fishing') || F.job === 'fisher' || F.fishN > 0,
    rel: (F) => (F.job === 'fisher' ? 1.2 : 1) * (F.fishN > 2 ? 1.2 : 1),
    open: { ask: 'pastime.fishing.open' },
    beats: {
      start: { line: 'pastime.fishing.start', go: [
        { ap: 'ask', say: 'Where\'s your spot?', to: 'spot' },
        { ap: 'jest', say: 'And the one that got away? How big, this week?', to: 'away' },
        { ap: 'ask', say: 'What do you use for bait?', to: 'bait' },
      ] },
      spot: { line: 'pastime.fishing.spot', fx: { learn: ['pastime.fishing', '{Name} fishes the river, at a spot of their own'] }, go: [
        { ap: 'ask', say: 'What do you think about, sitting there all day?', to: 'think' },
        { ap: 'warm', say: 'Every hobbit should have a spot like that.', to: 'end' },
      ] },
      away: { line: 'pastime.fishing.away', fx: { joke: { k: 'pastime.bigfish', t: 'The one that got away. It grows a hand a week.' } }, go: [
        { ap: 'jest', say: 'It was bigger last time you told it.', to: 'bigger' },
        { ap: 'tale', say: 'I once hooked a pike that pulled me across a lake.', to: 'pike' },
      ] },
      bait: { line: 'pastime.fishing.bait', go: [
        { ap: 'ask', say: 'Will you tell me the secret?', to: 'secret', need: { open: 2 }, soft: true },
        { ap: 'jest', say: 'I use a word in the fish\'s ear. Very persuasive.', to: 'word' },
      ] },
      think: { line: 'pastime.fishing.think', fx: { trust: 0.02 }, go: [
        { ap: 'listen', say: '*You nod and look out at the water with them.*', label: 'Look at the water with them', to: 'water' },
        { ap: 'advise', say: 'Go down this afternoon. The river\'s calling you, I can tell.', to: 'go' },
      ] },
      bigger: { line: 'pastime.fishing.bigger', end: true },
      pike: { line: 'pastime.fishing.pike', fx: { feel: 'wizard_tale', feelX: 'the pike on the lake' }, go: [
        { ap: 'tale', say: 'It let go in the end. Then it laughed. I swear it laughed.', to: 'laughed' },
        { ap: 'jest', say: 'I let it win. Out of courtesy.', to: 'end' },
      ] },
      secret: { line: 'pastime.fishing.secret', fx: { confide: { k: 'pastime.fishing.bait', t: '{Name}\'s secret bait for the river trout' } }, go: [
        { ap: 'warm', say: 'I\'ll take it to my grave.', to: 'grave' },
        { ap: 'jest', say: 'I\'ll tell only the fish.', to: 'end' },
      ] },
      word: { line: 'pastime.fishing.word', end: true },
      water: { line: 'pastime.fishing.water', fx: { trust: 0.02, feel: 'drawn_out' }, end: true },
      go: { line: 'pastime.fishing.go', fx: { run: queueIf('fish'), respect: 0.01 }, end: true },
      laughed: { line: 'pastime.fishing.laughed', end: true },
      grave: { line: 'pastime.fishing.grave', fx: { trust: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.fishing.open', ['Biting today, {name}?', 'I passed your spot by the river, {name}. Nobody in it. Shocking.', 'Any luck with the rod, {name}?'], {}, [
    { if: { weather: 'rain' }, text: ['Good fishing weather, {name}? They say the trout like the rain.'] },
    { if: { job: 'fisher' }, text: ['Do you fish for fun as well as work, {name}? Or is that like a baker eating bread?'] },
  ]);
  L('pastime.fishing.start', ['Some days. Some days they bite and some days they laugh at you.', 'Not bad. {FishN} so far, if you count the small one. I count the small one.', 'Fishing\'s not about fish. Don\'t tell the fish.'], {
    cheerful: ['Oh, I love it! Even when I catch nothing! Especially then, some days!'],
    ornery: ['They\'re not biting. Somebody\'s been splashing upstream.'],
    shy: ['...I like it. Nobody talks to you when you\'re fishing.'],
    curious: ['I\'ve been keeping a note: they bite best an hour after rain, with the wind from the west.'],
    dreamy: ['I sit and the river goes by and after a while I go by with it.'],
    witty: ['I\'m very good at fishing. The catching\'s another matter.'],
    proud: ['Best catch on the river, most weeks. Ask anyone.'],
    gloomy: ['They don\'t bite. They never bite for me.'],
    child: ['I caught a fish! It was THIS big! Well. This big.'],
  }, [
    { if: { job: 'fisher' }, pri: 1, text: ['All day, every day. And on my day off I go fishing. Don\'t tell anyone.'] },
    { if: { fishN: 0 }, pri: 1, text: ['Not a bite. Not one. I think they know my face.'] },
    { if: { season: 'winter' }, text: ['Cold work in winter. The fish go deep and sulk. So do I.'] },
    { if: { stage: 'elder' }, text: ['I\'ve fished that river seventy years. It\'s caught me more than I\'ve caught it.'] },
  ]);
  L('pastime.fishing.spot', ['Below the willow, where the bank\'s undercut. The big ones lie in the shade.', 'By the mill race. The water\'s busy there. Fish like a bit of fuss.'], {
    cheerful: ['The best one! By the big stone! It\'s warm and the trout are friendly!'],
    ornery: ['That\'s between me and the river.'],
    shy: ['...Round the bend. Where nobody comes.'],
    curious: ['Where the stream comes in. Cold water meets warm. The fish come for the change.'],
    dreamy: ['Under the alders. The light comes through green. It\'s like sitting in a bottle.'],
    witty: ['Wherever the fish aren\'t, apparently. I\'m very consistent.'],
    proud: ['The best pitch on the river. I got there first, forty years ago.'],
    gloomy: ['Same as always. Not that it helps.'],
    child: ['On the bridge! You can see the fish from the bridge! They can see you too.'],
  });
  L('pastime.fishing.away', ['THIS big. *Their arms go out.* No, THIS big.', 'A trout like a loaf of bread. Golden. Looked right at me, and went.'], {
    cheerful: ['Ha! As big as a sheep! Well. A lamb. A big lamb!'],
    ornery: ['It didn\'t get away. I let it go. It was too small. Big. Too big.'],
    shy: ['...It was quite big. I fell in, a bit.'],
    curious: ['Long as my arm. A pike, I think, by the jaw. I\'ve been trying to work out what it eats.'],
    dreamy: ['Huge, and silver, and old. I think it was the king of the river. I\'m glad it got away.'],
    witty: ['It\'s grown every time I\'ve told it. By Yule it\'ll be a whale.'],
    proud: ['The biggest fish this river\'s ever seen. I had it on the line for an hour.'],
    gloomy: ['They all get away. Every one.'],
    child: ['It was bigger than ME. It was! It pulled me in!'],
  }, [
    { if: { known: 'pastime.fishing' }, text: ['You\'ve heard. It\'s bigger now, mind. I\'ve had time to think about it.'] },
    { if: { rivalWhat: 'fish' }, pri: 1, text: ['Bigger than anything {rival}\'s ever caught. That\'s all that matters.'] },
  ]);
  L('pastime.fishing.bait', ['Worms. Good honest worms. And a bit of cheese, for the chub.', 'Bread paste. Flour and water and a secret. I won\'t say what.'], {
    cheerful: ['Whatever\'s in my pockets! Cake works! The fish love cake!'],
    ornery: ['That\'s my business.'],
    shy: ['...Worms. I say sorry to them.'],
    curious: ['I\'ve tried everything. Maggots, cheese, sweetcorn, a bit of bacon. Bacon wins. Don\'t know why.'],
    dreamy: ['Flies I tie myself. Little bits of feather. They look like summer.'],
    witty: ['Hope, mostly. Hope and a worm.'],
    proud: ['My own recipe. Took me twenty years.'],
    gloomy: ['Worms. The fish eat the worm and leave. Every time.'],
    child: ['WORMS! I dig them up! I named one Gerald!'],
  });
  L('pastime.fishing.think', ['Nothing. That\'s the beauty. The float bobs and your head goes quiet.', 'Everything, at first. Then nothing. Then supper.'], {
    cheerful: ['How lucky I am! And pie. Mostly how lucky I am, and pie.'],
    ornery: ['That I\'d rather be here than anywhere with people in it.'],
    shy: ['...Things I wish I\'d said.'],
    curious: ['Where the water goes. All the way to the sea, they say. I\'d like to follow it once.'],
    dreamy: ['The river\'s been going by since before there were hobbits. I think about that.'],
    witty: ['Whether the fish are thinking about me. I hope not unkindly.'],
    proud: ['Strategy. Fishing\'s a thinking hobbit\'s sport.'],
    gloomy: ['The ones who used to fish with me.'],
    child: ['Dragons. Do dragons fish?'],
  });
  L('pastime.fishing.bigger', ['It\'s still growing. It\'s a growing fish.', 'Ha! It eats well, that fish. Mostly my pride.'], {
    ornery: ['It was always that big. You heard wrong.'],
    witty: ['Fish grow in the telling. Everyone knows that. It\'s in the almanac.'],
  });
  L('pastime.fishing.pike', ['ACROSS a lake? You never! On a line?', 'Ha! A pike! And then what? Tell me!'], {
    curious: ['What weight line? Were you in a boat? Did it break the rod?'],
    proud: ['...That beats mine. I\'ll grant you that.'],
    child: ['Did you fall IN? Did it EAT you?'],
  });
  L('pastime.fishing.secret', ['...Bread paste with a drop of honey. And a pinch of pepper. Tell a soul and I\'ll know.', '...Grasshoppers. Live ones. In August. The trout go mad for them. There. Now you know.'], {
    shy: ['...Honey. On the worm. Don\'t tell. Please.'],
    proud: ['...Very well. Aniseed. Three drops. It\'s been in my family for generations.'],
  });
  L('pastime.fishing.word', ['Ha! A word in the fish\'s ear! Fish haven\'t got ears!', 'What word? ...Go on. I\'m desperate.'], {
    curious: ['Have fish got ears? Have they? I don\'t think they have. How do they hear?'],
    witty: ['I\'ve tried words. Mostly rude ones. They don\'t work.'],
  });
  L('pastime.fishing.water', ['*You look at the river together for a long while.* ...You\'re easy to be quiet with, you know.', '*They breathe out, slowly.* ...That\'s it. That\'s the whole thing, really.'], {
    shy: ['*They don\'t say anything. They don\'t need to.*'],
  });
  L('pastime.fishing.go', ['You\'re right. I\'ll go. The work can wait an hour.', 'This afternoon. Yes. If anyone asks, the wizard said so.'], {
    ornery: ['I was going anyway.'],
    proud: ['I\'ll bring you back the biggest of the day.'],
  });
  L('pastime.fishing.laughed', ['A laughing pike. Ha! I\'ll be dreaming about that.', 'I believe you. Pike do that. Nasty, clever things.'], {
    child: ['FISH CAN\'T LAUGH. ...Can they?'],
  });
  L('pastime.fishing.grave', ['Good. Your grave\'ll be a long way off, I expect. Being a wizard.', 'You\'d better. That\'s three generations of secret, that is.'], {});

  // --- Their turn: the one that got away -------------------------------------------------
  addThread({
    id: 'pastime.catch', theirs: true, about: 'habit', label: 'The one that got away', cool: 5,
    ask: '{Name} holds {their} hands apart, wide, and looks at you meaningfully.',
    when: (F) => (habit(F, 'fishing') || F.job === 'fisher') && F.met,
    beats: {
      start: { line: 'pastime.catch.start', fx: { learn: ['pastime.catch', '{Name} lost a big fish, and the fish grows every telling'] }, go: [
        { ap: 'ask', say: 'And how big was it really?', to: 'really' },
        { ap: 'jest', say: 'That\'s not a fish. That\'s a sheep.', to: 'sheep' },
        { ap: 'warm', say: 'A fine fish. You\'ll have it next time.', to: 'next' },
      ] },
      really: { line: 'pastime.catch.really', fx: { trust: 0.02 }, end: true },
      sheep: { line: 'pastime.catch.sheep', fx: { fond: 0.01 }, end: true },
      next: { line: 'pastime.catch.next', fx: { fond: 0.02 }, end: true },
    },
  });
  L('pastime.catch.start', ['You won\'t believe what nearly happened this morning. A trout. THIS big.', 'I had one on the line. A monster. And then. Snap.'], {
    cheerful: ['It was THIS big! And then it waved at me! With its tail! And left!'],
    ornery: ['Lost one. A big one. Line was rotten. I\'m furious.'],
    shy: ['...I nearly caught a big one. I wanted to tell someone.'],
    curious: ['It took the bait from below. Straight up, like a cork. I\'ve never seen one do that.'],
    dreamy: ['It came up out of the water, all silver in the sun, and looked at me. Then it was gone.'],
    witty: ['A fish of such size, wizard, it had its own weather.'],
    proud: ['I had the biggest trout on this river on my line this morning. For a moment.'],
    gloomy: ['Lost another one. Biggest yet. Of course.'],
  }, [
    { if: { known: 'pastime.catch' }, pri: 1, text: ['You remember the big one? It\'s back. It\'s BIGGER. It\'s mocking me.'] },
  ]);
  L('pastime.catch.really', ['...About the size of a large shoe. A very large shoe.', '...All right. The size of a loaf. But a big loaf. A harvest loaf.'], {
    ornery: ['THIS big. ...Fine. Half that.'],
    proud: ['Exactly as I said. ...Give or take.'],
  });
  L('pastime.catch.sheep', ['Ha! A sheep with fins! I\'d have had it for Yule!', 'A sheep! Ha! Oh, I\'m telling that at the Badger.'], {
    ornery: ['It was a FISH.'],
  });
  L('pastime.catch.next', ['Next time. Yes. I know where it lives now.', 'I will. I\'ve got a plan. It involves cheese.'], {
    gloomy: ['...Maybe. Thank you.'],
  });

  // ==================================================================================
  // --- The garden and prize vegetables -----------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.garden', about: 'habit', reveals: 'pastime.garden', weight: 1, cool: 4,
    label: (F) => `The ${F.cropWord || 'garden'}`,
    when: (F) => F.gardener && F.season !== 'winter',
    rel: (F) => (habit(F, 'garden') ? 1.4 : 0.8) * (F.rivalWhat === 'marrow' || F.won ? 1.3 : 1),
    open: { ask: 'pastime.garden.open' },
    beats: {
      start: { line: 'pastime.garden.start', go: [
        { ap: 'ask', say: 'What\'s your secret? Everyone has a secret.', to: 'secret' },
        { ap: 'ask', say: 'Any trouble with the slugs?', to: 'slugs' },
        { ap: 'jest', say: 'Will you be entering anything at the fair? Something enormous?', to: 'fair' },
      ] },
      secret: { line: 'pastime.garden.secret', fx: { learn: ['pastime.garden', '{Name} grows {cropWord} and has a secret for them'] }, go: [
        { ap: 'ask', say: 'Do you really talk to them?', to: 'talk', need: { open: 1 } },
        { ap: 'warm', say: 'Whatever it is, it works.', to: 'works' },
      ] },
      slugs: { line: 'pastime.garden.slugs', go: [
        { ap: 'advise', say: 'A saucer of ale, sunk in the soil. They drown happy.', to: 'ale' },
        { ap: 'jest', say: 'I could turn them into something. Butterflies, perhaps.', to: 'butterflies' },
      ] },
      fair: { line: 'pastime.garden.fair', go: [
        { ap: 'ask', say: 'And who do you have to beat?', to: 'beat' },
        { ap: 'warm', say: 'I\'ll come and cheer.', to: 'cheer' },
      ] },
      talk: { line: 'pastime.garden.talk', fx: { confide: { k: 'pastime.garden.talk', t: '{Name} talks to the {cropWord}, and swears it helps' } }, go: [
        { ap: 'share', say: 'Ents talk to trees. Took them a week to say good morning.', to: 'ents' },
        { ap: 'warm', say: 'I\'m sure they listen.', to: 'end' },
      ] },
      works: { line: 'pastime.garden.works', end: true },
      ale: { line: 'pastime.garden.ale', fx: { respect: 0.02 }, end: true },
      butterflies: { line: 'pastime.garden.butterflies', end: true },
      beat: { line: 'pastime.garden.beat', go: [
        { ap: 'advise', say: 'Grow for the joy of it. The winning will follow. Or it won\'t.', to: 'joy' },
        { ap: 'jest', say: 'I could have a word with the judge. A wizardly word.', to: 'judge' },
      ] },
      cheer: { line: 'pastime.garden.cheer', fx: { fond: 0.02, promise: { k: 'pastime.fair', t: 'You said you\'d come and cheer at the fair', days: 20 } }, end: true },
      ents: { line: 'pastime.garden.ents', fx: { trust: 0.02, feel: 'wizard_tale', feelX: 'the Ents' }, end: true },
      joy: { line: 'pastime.garden.joy', fx: { respect: 0.02 }, end: true },
      judge: { line: 'pastime.garden.judge', fx: { joke: { k: 'pastime.judge', t: 'The wizard offered to have a word with the judge.' } }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.garden.open', ['Your {cropWord} are looking fine, {name}.', 'I stopped to admire your garden, {name}. The {cropWord} admired me back.', 'How does your garden grow, {name}?'], {}, [
    { if: { weather: 'rain' }, text: ['Good rain for the garden, {name}. The {cropWord} must be singing.'] },
    { if: { season: 'spring' }, text: ['Planting time, {name}. What\'s going in?'] },
  ]);
  L('pastime.garden.start', ['Coming on. Everything\'s growing, slugs included.', 'Coming on. The {cropWord} are doing well this year.', 'Oh, it\'s a joy. Hard work, but a joy. Look at those {cropWord}.'], {
    cheerful: ['Oh, look at them! Aren\'t they the happiest {cropWord} you ever saw?'],
    ornery: ['Fine, no thanks to the weather. Or the slugs. Or the neighbour\'s hens.'],
    shy: ['...They\'re doing all right. I try.'],
    curious: ['I\'m trying a new row, further from the hedge. More sun. I\'m measuring the difference.'],
    dreamy: ['I like the mornings out there, with the dew. Everything\'s growing and you can almost hear it.'],
    witty: ['My {cropWord} are thriving. I\'m less sure about me.'],
    proud: ['Best {cropWord} on the lane. Folk stop to stare.'],
    gloomy: ['Something always eats them.'],
  }, [
    { if: { stage: 'elder' }, text: ['Fifty summers in that patch. The soil knows me.'] },
    { if: { crop: 'pumpkin' }, text: ['The pumpkins are coming on like a family of pigs. One\'s the size of a stool.'] },
    { if: { crop: 'potato' }, text: ['Potatoes. You can\'t see how they\'re doing till you dig. It\'s like waiting for a letter.'] },
    { if: { crop: 'tomato' }, text: ['The tomatoes are reddening. I go out every hour to look. They know I\'m watching.'] },
    { if: { crop: 'cabbage' }, text: ['Cabbages. Big ones. Round as heads. I sometimes say good morning.'] },
    { if: { crop: 'carrot' }, text: ['Carrots. Straight ones, this year. Last year they were all legs.'] },
    { if: { season: 'autumn' }, text: ['Harvest! Everything at once! I can\'t eat fast enough.'] },
    { if: { weather: 'rain' }, text: ['The rain\'s doing my watering for me. I\'m on holiday.'] },
  ]);
  L('pastime.garden.secret', ['Manure. Good, old manure. And patience.', 'Tea leaves. I tip the pot on them every morning.'], {
    cheerful: ['Love! And manure! Mostly manure!'],
    ornery: ['Hard work. That\'s the secret. Not that anyone listens.'],
    shy: ['...I sing to them. Quietly.'],
    curious: ['Seaweed, if you can get it. Ash from the fire. Crushed eggshells. It\'s all in the balance.'],
    dreamy: ['I plant by the moon. The waxing moon pulls them up.'],
    witty: ['I threaten them. Nicely. \'Grow, or it\'s soup.\''],
    proud: ['My grandfather\'s method. I\'ll not share it.'],
    gloomy: ['There isn\'t one. It\'s luck. I haven\'t got any.'],
  }, [
    { if: { crop: 'pumpkin' }, text: ['For pumpkins? Milk. A little dish of milk, with a wick of wool into the stalk. Don\'t laugh.'] },
  ]);
  L('pastime.garden.slugs', ['Slugs! Don\'t start me. They come in the night like burglars.', 'Every year. I go out with a lantern and a bucket.'], {
    cheerful: ['Oh, they\'re a menace! I pick them off and put them in the hedge and say sorry!'],
    ornery: ['The slugs and I are at war. I\'m winning. Narrowly.'],
    shy: ['...I don\'t like to hurt them. So they eat everything.'],
    curious: ['I\'ve counted them. Forty on one row. They come up the path by the wall.'],
    dreamy: ['They leave silver trails in the moonlight. It\'s almost worth the {cropWord}.'],
    witty: ['The slugs eat better than I do. They\'ve a very refined palate. Mostly my lettuce.'],
    proud: ['Not in my garden.'],
    gloomy: ['They ate everything. Again.'],
  });
  L('pastime.garden.fair', ['Maybe. If the weather holds.', 'I\'ve a {cropWord} with my name on it. Literally. I scratched it on.'], {
    cheerful: ['Yes! Everything! The biggest! The roundest! The most cheerful!'],
    ornery: ['Not if they give the prize to the same lot again.'],
    shy: ['...I couldn\'t. Everyone would look.'],
    curious: ['I want to see if the tea leaves really work. A fair\'s a good test.'],
    witty: ['I\'m growing a marrow so big it\'ll enter itself.'],
    proud: ['Naturally. And win.'],
    gloomy: ['I never win.'],
  }, [
    { if: { won: has }, pri: 1, text: ['I won {won} last time! I\'m defending my title!'] },
    { if: { rivalWhat: 'marrow' }, pri: 1, text: ['The marrow. And I\'m beating {rival} this year if it kills me.'] },
  ]);
  L('pastime.garden.talk', ['...I do. Every morning. I tell them about my day. They grow. Explain that.', '...Only the shy ones.'], {
    cheerful: ['All the time! They love it! Look how happy they are!'],
    ornery: ['...Somebody has to. Nobody else listens to them.'],
    witty: ['They\'re very good listeners. Better than most of the lane.'],
    proud: ['I encourage them. That\'s different from talking.'],
  });
  L('pastime.garden.works', ['It does, doesn\'t it. Look at them.', 'Don\'t tell anyone. They\'ll all be at it.'], {});
  L('pastime.garden.ale', ['Ale! Waste good ale on slugs? ...They\'d die happy, though.', 'Hm. I\'ll try it. The cheap ale.'], {
    ornery: ['Waste ale? On slugs? I\'d sooner drink it and stamp on them.'],
    witty: ['Slugs dying drunk. That\'s more than most of us manage.'],
  });
  L('pastime.garden.butterflies', ['Butterflies that eat cabbages? That\'s just slugs with wings.', 'Ha! No. Turn them into something that eats slugs.'], {
    witty: ['Butterflies are just caterpillars that got above themselves. And caterpillars eat cabbages too.'],
  });
  L('pastime.garden.beat', ['The usual lot. The miller\'s marrows are big, but they\'re watery.', 'Everyone on the lane. It gets very serious in August.'], {
    ornery: ['That lot by the mill. Cheats, the lot of them.'],
    proud: ['Nobody of note.'],
  }, [
    { if: { rival: has }, pri: 1, text: ['{Rival}. Always {rival}. We\'ve been at it for years.', '{Rival}. Don\'t say the name too loud. The {cropWord} get upset.'] },
  ]);
  L('pastime.garden.cheer', ['Would you? I\'d win for sure with a wizard cheering.', 'Ha! Come and cheer! Loudly! Wave the hat!'], {
    shy: ['...Not too loud. ...A little loud.'],
  });
  L('pastime.garden.ents', ['Ents? Trees that talk? ...A week to say good morning! Ha!', 'A week! My {cropWord} haven\'t got a week. They\'re supper by Friday.'], {
    curious: ['Trees that talk? Real ones? What do they talk about?'],
    dreamy: ['*They look at their garden as if it might say something.*'],
  });
  L('pastime.garden.joy', ['For the joy of it. Yes. ...But I\'d still like to win.', 'You\'re right. I\'ve been losing sleep over a vegetable.'], {
    ornery: ['Joy. Hm. The joy\'s in the winning.'],
  });
  L('pastime.garden.judge', ['Ha! Don\'t you dare. ...What sort of word?', 'A wizardly word! The judge would faint!'], {
    ornery: ['...Would you? ...No. No. I want to win fair. ...What sort of word?'],
    proud: ['I don\'t need help. ...But thank you.'],
  });

  // ==================================================================================
  // --- Mushrooming and foraging ---------------------------------------------------------
  // ==================================================================================
  addThread({
    id: 'pastime.mushrooms', about: 'habit', reveals: 'pastime.mushrooms', weight: 1, cool: 4,
    label: 'Mushrooming',
    when: (F) => habit(F, 'mushrooms') || F.favFood === 'mush',
    rel: (F) => (F.season === 'autumn' ? 1.5 : 1),
    open: { ask: 'pastime.mushrooms.open' },
    beats: {
      start: { line: 'pastime.mushrooms.start', go: [
        { ap: 'ask', say: 'Where do the best ones grow?', to: 'where' },
        { ap: 'advise', say: 'Mind the toadstools. Even wizards get those wrong.', to: 'toad' },
        { ap: 'ask', say: 'How do you cook them?', to: 'cook' },
      ] },
      where: { line: 'pastime.mushrooms.where', fx: { learn: ['pastime.mushrooms', '{Name} goes mushrooming, and loves mushrooms more than is sensible'] }, go: [
        { ap: 'ask', say: 'Do you have a patch? A secret one?', to: 'patch', need: { open: 2 }, soft: true },
        { ap: 'jest', say: 'I\'ll follow you, very quietly. Tall as I am.', to: 'follow' },
      ] },
      toad: { line: 'pastime.mushrooms.toad', go: [
        { ap: 'ask', say: 'Have you ever eaten a bad one?', to: 'bad' },
        { ap: 'share', say: 'I ate one in Mirkwood once. Saw music for a week.', to: 'mirkwood' },
      ] },
      cook: { line: 'pastime.mushrooms.cook', go: [
        { ap: 'warm', say: 'Now I\'m hungry.', to: 'hungry' },
        { ap: 'ask', say: 'Who taught you?', to: 'taught' },
      ] },
      patch: { line: 'pastime.mushrooms.patch', fx: { confide: { k: 'pastime.mushrooms.patch', t: '{Name} has a secret mushroom patch, and has told nobody but you', secret: true } }, go: [
        { ap: 'warm', say: 'I won\'t tell a soul. Not even the farmer.', to: 'safe' },
        { ap: 'jest', say: 'And if I happened to be passing at dawn...?', to: 'dawn' },
      ] },
      follow: { line: 'pastime.mushrooms.follow', end: true },
      bad: { line: 'pastime.mushrooms.bad', go: [
        { ap: 'comfort', say: 'It happens to the best of us.', to: 'end' },
        { ap: 'jest', say: 'And did you see colours?', to: 'colours' },
      ] },
      mirkwood: { line: 'pastime.mushrooms.mirkwood', fx: { joke: { k: 'pastime.mirkwood', t: 'The wizard ate a mushroom in Mirkwood and saw music for a week.' } }, end: true },
      hungry: { line: 'pastime.mushrooms.hungry', fx: { fond: 0.02 }, go: [
        { ap: 'warm', say: 'I\'d be honoured.', to: 'invite', need: { fond: 0.15 }, soft: true },
        { ap: 'jest', say: 'Don\'t tempt a wizard. We eat like dragons.', to: 'end' },
      ] },
      taught: { line: 'pastime.mushrooms.taught', end: true },
      safe: { line: 'pastime.mushrooms.safe', fx: { trust: 0.04, promise: { k: 'pastime.patch', t: 'You promised never to tell where {name}\'s mushrooms grow', days: 60 } }, end: true },
      dawn: { line: 'pastime.mushrooms.dawn', end: true },
      colours: { line: 'pastime.mushrooms.colours', end: true },
      invite: { line: 'pastime.mushrooms.invite', fx: { fond: 0.03, promise: { k: 'pastime.mushsupper', t: '{Name} has asked you to a mushroom supper', days: 7 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('pastime.mushrooms.open', ['Been out mushrooming, {name}? You\'ve a basket and a look.', 'I hear you\'ve the best nose for mushrooms in the valley, {name}.', 'Mushrooms coming up yet, {name}?'], {}, [
    { if: { season: 'autumn' }, text: ['Autumn, {name}! The woods must be thick with them.'] },
    { if: { weather: 'rain' }, text: ['Rain like this, {name}, and there\'ll be mushrooms by morning.'] },
  ]);
  L('pastime.mushrooms.start', ['Oh, I love it. Up early, wet grass, a basket. And mushrooms!', 'Every chance I get. There\'s nothing better on a plate.'], {
    cheerful: ['MUSHROOMS! Oh, don\'t get me started. I\'ll never stop.'],
    ornery: ['When folk aren\'t trampling my spots. Which they are.'],
    shy: ['...I go early. Before anyone. It\'s nice in the woods then.'],
    curious: ['I\'ve learned eleven kinds. Twelve, if you count the one I\'m not sure about. I don\'t eat that one.'],
    dreamy: ['They come up overnight, like magic. One day nothing, next day a fairy ring.'],
    witty: ['I\'m a hunter. My prey just doesn\'t run very fast.'],
    proud: ['I\'ve the sharpest eye for mushrooms in the valley.'],
    gloomy: ['Someone always gets there first.'],
    child: ['I found a mushroom! Mum says don\'t eat it! I didn\'t! Much!'],
  }, [
    { if: { season: 'autumn' }, text: ['Autumn! It\'s the best time. They\'re everywhere. My basket\'s never been fuller.'] },
    { if: { season: 'summer' }, text: ['Summer\'s slow for them. A few field ones, after a storm.'] },
    { if: { favFood: 'mush' }, pri: 1, text: ['Mushrooms are the best food there is. I\'ll hear no argument.'] },
    { if: { job: 'herbalist' }, text: ['I go for the herbs and come back with mushrooms. Every time.'] },
  ]);
  L('pastime.mushrooms.where', ['Under the oaks, after rain. And in the old pasture, where the horses used to be.', 'In the woods past the mill. Where the ground\'s soft and the light\'s low.'], {
    cheerful: ['Everywhere! Behind the hedge, under the oak, in a boot once!'],
    ornery: ['Where I find them. Which is my business.'],
    shy: ['...In the wood. Quiet places.'],
    curious: ['They like birch and oak, but never pine. And old dung. I\'m not proud of that bit.'],
    dreamy: ['Where the moss is thick. They come up in circles. Fairy rings, my gran said.'],
    witty: ['Wherever they think they\'re hidden. They\'re not very clever.'],
    proud: ['In places only I know.'],
    gloomy: ['Wherever someone else hasn\'t been first.'],
    child: ['In the GARDEN! And in the bit behind the shed!'],
  });
  L('pastime.mushrooms.toad', ['I know my toadstools. Red with spots, leave it. Pale and pretty, run.', 'Oh, I know. I\'ve a rule: if in doubt, it\'s out.'], {
    cheerful: ['I know! I always check twice! Well. Once and a half.'],
    ornery: ['I\'ve been picking mushrooms since before you were... well. A while.'],
    shy: ['...I know. I\'m very careful. I check them in a book.'],
    curious: ['The white ones are worst. They look the most innocent. That\'s the trick of them.'],
    dreamy: ['The pretty ones are always the dangerous ones. That\'s in all the stories.'],
    witty: ['If it looks like it wants to be eaten, it\'s plotting.'],
    proud: ['I don\'t get them wrong.'],
    gloomy: ['I know. I learned the hard way.'],
    child: ['The red ones with spots are for FAIRIES. Not us.'],
  });
  L('pastime.mushrooms.cook', ['In butter. Lots of butter. Then more butter.', 'Fried, with bacon. On toast. At any hour of the day.'], {
    cheerful: ['Butter! Garlic! A pinch of salt! On toast! Ohhh!'],
    ornery: ['Properly. In a pan. Not boiled, like some I could name.'],
    shy: ['...Just in butter. Simple.'],
    curious: ['I\'ve tried them every way. Dried ones are stronger. Did you know? Drying makes them stronger.'],
    dreamy: ['In a little pan over the fire, with thyme from the garden. The whole house smells of autumn.'],
    witty: ['I cook them with great respect. They\'ve been through a lot.'],
    proud: ['My own way. In cream. Folk come from the mill for it.'],
    gloomy: ['Fried. Then they\'re gone. Like everything.'],
    child: ['I don\'t cook! Mum cooks! I eat!'],
  });
  L('pastime.mushrooms.patch', ['...There is. Don\'t look at me like that. ...There is. In the wood, past the fallen ash.', '...I\'ve never told anyone. Not even family. There\'s a ring of them. Every autumn.'], {
    ornery: ['...If you tell anyone, wizard or not, I\'ll never speak to you again. ...Past the old ash.'],
    shy: ['*whispering* ...By the old ash. A whole ring. Nobody knows.'],
    proud: ['...My family\'s had it for generations. I\'m telling you because you\'re you.'],
    child: ['...I\'ve got a secret one. Behind the big rock. You can\'t come.'],
  });
  L('pastime.mushrooms.follow', ['Ha! You\'d stick out like a maypole.', 'You couldn\'t follow quietly if your hat depended on it.'], {
    ornery: ['Try it. I\'ll lead you to the nettles.'],
    witty: ['I\'d hear you coming a mile off. Your hat creaks.'],
  });
  L('pastime.mushrooms.bad', ['Once. Years ago. I was sick for three days and talked to the curtains.', 'Once. Never again. I still can\'t look at a pale one.'], {
    ornery: ['Once. I don\'t talk about it.'],
    witty: ['Once. I saw my grandmother. She\'s been dead twenty years. She told me off.'],
    gloomy: ['Yes. It was the worst week of my life. And I\'ve had some weeks.'],
    child: ['I ate a funny one and was sick on the dog.'],
  });
  L('pastime.mushrooms.mirkwood', ['MUSIC? You saw music?', 'Ha! What did it look like? The music?'], {
    curious: ['What colour was it? Does music have a colour? It must, if you saw it.'],
    ornery: ['That\'s what comes of eating things in Mirkwood.'],
    witty: ['I hear the Badger\'s sing-song does that too. Without the mushroom.'],
  });
  L('pastime.mushrooms.hungry', ['Ha! Come round. There\'s a pan going this evening.', 'Then come to supper. Bring an appetite.'], {
    shy: ['...You could come to supper. If you liked.'],
    ornery: ['Hmph. I suppose there\'s enough for two.'],
  });
  L('pastime.mushrooms.taught', ['My gran. She knew every kind. She could smell them.', 'Nobody. Trial and error. More error than trial.'], {});
  L('pastime.mushrooms.safe', ['Thank you. I mean it. Not a soul.', 'I knew I could trust you. I just knew.'], {
    ornery: ['You\'d better not.'],
  });
  L('pastime.mushrooms.dawn', ['You\'d find nothing. I\'d have them all by then.', 'Ha! I\'d know. The mushrooms would tell me.'], {});
  L('pastime.mushrooms.colours', ['Colours? I saw the colour of Tuesday.', 'Ha! I saw sounds. And the sounds were rude.'], {});
  L('pastime.mushrooms.invite', ['Then come tomorrow. I\'ll do the cream ones.', 'Supper, then. Mushrooms, butter, and a wizard. Lovely.'], {
    shy: ['...Really? ...Tomorrow, then.'],
    cheerful: ['Yes! I\'ll do every kind!'],
  });

  // --- More ways of saying it: registers, moods, weather and the rift-born ---------------
  const M = (key, rules) => lines(key, guard(rules));
  M('pastime.inn.start', [
    { if: { register: 'fine' }, text: ['I take a glass at the Badger of an evening. One must keep up with the parish.', 'The Badger is a little rough, but the fire is excellent and the company improving.'] },
    { if: { register: 'plain' }, text: ['Badger\'s me second home. First, some weeks.', 'Pint after work. Two on a Mersday. That\'s me.'] },
    { if: { mood: 'merry' }, text: ['Last night was the best night! We sang till the innkeeper threw her apron at us!'] },
    { if: { mood: ['low', 'miserable'] }, text: ['I go to be near folk. Even if I don\'t say much. Specially then.'] },
    { if: { tipsy: true }, pri: 2, text: ['I\'ve jus\' come from there! Lovely place. Lovely people. Lovely... what was I saying?'] },
    { if: { hour: 'morning' }, text: ['Not at this hour! I\'m not a sot. ...Not till noon.'] },
    { if: { party: true }, pri: 1, text: ['Not tonight! There\'s a party! The Badger\'s come to us!'] },
  ]);
  M('pastime.inn.seat', [
    { if: { register: 'fine' }, text: ['The settle by the hearth. It has a cushion, which I brought myself.'] },
    { if: { register: 'plain' }, text: ['End o\' the bench. Back to the wall. Same as me dad.'] },
  ]);
  M('pastime.inn.ale', [
    { if: { register: 'fine' }, text: ['Rather good this season. A pleasing nuttiness. I\'ve said as much to the brewer.'] },
    { if: { register: 'plain' }, text: ['Wet an\' brown an\' there\'s plenty. Can\'t ask more.'] },
    { if: { season: 'autumn' }, text: ['The new barrels are in. Harvest ale. It\'s like drinking a hayfield.'] },
    { if: { season: 'winter' }, text: ['Mulled, this time of year. With apple and a hot poker. Lovely.'] },
  ]);
  M('pastime.inn.sing', [
    { if: { register: 'fine' }, text: ['I\'ve been known to take the descant. Quietly.'] },
    { if: { register: 'plain' }, text: ['Sing? Loudest in the room. Can\'t carry a tune in a bucket, mind.'] },
  ]);
  M('pastime.pipe.start', [
    { if: { register: 'fine' }, text: ['Do join me. A pipe after dinner is one of the civilised pleasures.'] },
    { if: { register: 'plain' }, text: ['Sit down. Pipe\'s lit. Nothin\' better.'] },
    { if: { mood: 'merry' }, text: ['Sit! What an evening! Look at that sky! Puff, puff. Lovely.'] },
    { if: { mood: ['low', 'miserable'] }, text: ['Sit if you like. I\'m not much company. The pipe\'s better company than me.'] },
    { if: { weather: 'rain' }, text: ['Under the eaves. A pipe tastes better when it\'s raining just past your toes.'] },
    { if: { season: 'winter' }, text: ['Cold for it. But a pipe warms the nose, if nothing else.'] },
    { if: { tipsy: true }, pri: 2, text: ['Sssit. Sit down! Have a puff. Have two. I\'ve had... several.'] },
  ]);
  M('pastime.pipe.leaf', [
    { if: { register: 'fine' }, text: ['A fine Longbottom when I can get it. The valley leaf when I can\'t, which is usually.'] },
    { if: { register: 'plain' }, text: ['Valley leaf. Rough. Does the job.'] },
  ]);
  M('pastime.pipe.ring', [
    { if: { register: 'fine' }, text: ['*A neat, small ring, launched with some ceremony.* There. A modest ring.'] },
    { if: { mood: 'merry' }, text: ['*A big fat ring, and a laugh blows it to pieces.* Oh! Ha! Again!'] },
  ]);
  M('pastime.fishing.start', [
    { if: { register: 'fine' }, text: ['I fish a little. Fly, chiefly. It\'s a contemplative art.'] },
    { if: { register: 'plain' }, text: ['Fishin\'. Rod, worm, river. Can\'t beat it.'] },
    { if: { mood: 'merry' }, text: ['I had three this morning! THREE! Before breakfast!'] },
    { if: { mood: ['low', 'miserable'] }, text: ['I go down to the river when things are bad. The fish don\'t ask how I am.'] },
    { if: { weather: 'rain' }, text: ['Rain\'s the best time. The fish come up for the drops. I come down for the fish.'] },
    { if: { hour: 'morning' }, text: ['Just come back. Dawn\'s the time. Mist on the water and the trout rising.'] },
    { if: { rift: true }, text: ['Back home the fish came in tins. Here they fight back. It\'s amazing. It\'s rude.'] },
  ]);
  M('pastime.fishing.spot', [
    { if: { register: 'fine' }, text: ['A pool beneath the willows. I\'ll not be more specific. A gentleman keeps his water.'] },
    { if: { register: 'plain' }, text: ['Down the bend. Under the tree. Best spot there is.'] },
  ]);
  M('pastime.fishing.away', [
    { if: { register: 'fine' }, text: ['A trout of some considerable size. I estimate four pounds. Possibly five.'] },
    { if: { fishN: { min: 5 } }, text: ['I\'ve caught {fishN} good ones. But the one I didn\'t catch is the one I think about.'] },
  ]);
  M('pastime.garden.start', [
    { if: { register: 'fine' }, text: ['The {cropWord} are doing rather well. I attribute it to a rigorous regime of manure.'] },
    { if: { register: 'plain' }, text: ['Comin\' on. {CropWord} are fat as pigs. Good soil, this.'] },
    { if: { mood: 'merry' }, text: ['Everything\'s up! Everything! I counted! I went round twice!'] },
    { if: { mood: ['low', 'miserable'] }, text: ['I\'ve let it go a bit. The weeds are winning. I can\'t find the heart.'] },
    { if: { rift: true }, text: ['I\'ve never grown anything before. You put a seed in the dirt and it just... does it. It\'s mad.'] },
  ]);
  M('pastime.garden.secret', [
    { if: { register: 'fine' }, text: ['Well-rotted manure, a careful rotation, and a little bone meal. It\'s a science.'] },
    { if: { register: 'plain' }, text: ['Muck. Good honest muck. And spit on yer hands.'] },
  ]);
  M('pastime.mushrooms.start', [
    { if: { register: 'fine' }, text: ['I forage a little. It\'s rather a passion. The fungi of the valley are remarkably various.'] },
    { if: { register: 'plain' }, text: ['Mushrooms. Up early, basket, wet feet. Lovely.'] },
    { if: { mood: 'merry' }, text: ['I found a ring of them this morning! A whole ring! I danced in the middle!'] },
    { if: { weather: 'rain' }, text: ['Rain! Tomorrow they\'ll be up everywhere. I\'ll be out at dawn.'] },
    { if: { rift: true }, text: ['You can just pick food off the ground here! Nobody stops you! Some of it kills you, but still!'] },
  ]);
  M('pastime.mushrooms.cook', [
    { if: { register: 'fine' }, text: ['Sauteed in butter with a little thyme and a splash of cream. Simplicity itself.'] },
    { if: { register: 'plain' }, text: ['Pan. Butter. Bit o\' bacon. Bread to mop.'] },
  ]);
});
