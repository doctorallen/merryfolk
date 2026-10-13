'use strict';
// ---------------------------------------------------------------------------
// The festivals and the parties, as folk talk of them to the wizard: the next
// festival coming (Mayday, Midsummer, the Harvest Feast, Lantern Night, Yule,
// Founders' Day) and today's occasion, the party in full swing, the wizard's
// fireworks and his fire dragon, birthdays and their presents, the lantern
// wish, the Queen or King of the May, and Yule. Folk ask him whether there'll
// be fireworks, and hold him to it. The facts come from talk/seasons.js.
// ---------------------------------------------------------------------------

talkPack('seasons2', () => {
  // whose wedding it is, if it is one
  addFacts((v, F) => {
    const p = Game.party || {};
    const c = (p.on ? p.reason : p.planned) === 'wedding' ? (p.couple || []).map(personById).filter(Boolean) : [];
    F.couple = c.length === 2 ? `${c[0].first} and ${c[1].first}` : null;
    F.isCouple = c.includes(v);
  });
  const promiseFw = (T, v) => { if (window.seasonFestPromise) window.seasonFestPromise('season.fireworks', 'You promised fireworks at {nextFestWord}')(T, v); };

  // --- The next festival -----------------------------------------------------------------
  addThread({
    id: 'season.next', cool: 2, weight: 1.3,
    label: (F) => (F.nextFestWord ? `Looking forward to ${F.nextFestWord}?` : 'The next festival'),
    when: (F) => !!F.nextFest && F.nextFestIn <= 2 && !F.festToday,
    rel: (F) => (F.nextFestIn === 1 ? 1.8 : 1.3),
    open: { ask: 'season.next.open' },
    beats: {
      start: { line: 'season.next.start', go: [
        { ap: 'ask', say: 'And what will you do at {nextFestWord}?', to: 'plans' },
        { ap: 'jest', say: 'season.next.jest', label: 'Tease them about it', to: 'tease' },
        { ap: 'ask', say: 'What was it like, last year?', to: 'lastyear', need: { if: { firstYear: false } } },
        { ap: 'ask', say: 'And before Thistledown? How did you keep it?', to: 'before', need: { if: { firstYear: true } } },
      ] },
      plans: { line: 'season.next.plans', go: [
        { ap: 'warm', say: 'Save me a dance, then.', to: 'dance' },
        { ap: 'ask', say: 'And who will you go with?', to: 'whom', need: { open: 1 }, soft: true },
        { ap: 'advise', say: 'Pace yourself. It\'s a long night, and the pies go first.', to: 'pace' },
      ] },
      tease: { line: 'season.next.tease', go: [
        { ap: 'warm', say: 'I only tease. What are you really looking forward to?', to: 'plans' },
        { ap: 'jest', say: 'I\'ll be watching. With a notebook.', to: 'end' },
      ] },
      lastyear: { line: 'season.next.lastyear', go: [
        { ap: 'ask', say: 'And will it be like that this time?', to: 'hope' },
        { ap: 'listen', say: '*You wait. There\'s more, by the look of them.*', label: 'Wait for the rest', to: 'missing', need: { open: 2 }, soft: true },
      ] },
      before: { line: 'season.next.before', go: [
        { ap: 'warm', say: 'Then you\'ll make new ways of keeping it here.', to: 'newways' },
        { ap: 'ask', say: 'Do you miss it? The old place?', to: 'missing', need: { open: 1 }, soft: true },
      ] },
      dance: { line: 'season.next.dance', go: [
        { ap: 'jest', say: 'I\'ll warn you, I dance like a windmill in a gale.', to: 'windmill' },
        { ap: 'warm', say: 'Then it\'s a promise. The first slow one.', to: 'end', fx: { fond: 0.03 } },
      ] },
      windmill: { line: 'season.next.windmill', fx: { joke: { k: 'season.windmill', t: 'The wizard dances like a windmill in a gale.' } }, end: true },
      whom: { line: 'season.next.whom', go: [
        { ap: 'warm', say: 'Come and stand with me, then. Somebody has to hold my hat.', to: 'hat', need: { if: { spouse: null } } },
        { ap: 'jest', say: 'Just make sure they don\'t eat all your pie.', to: 'end' },
        { ap: 'warm', say: 'Then you\'ll have a fine night of it.', to: 'end' },
      ] },
      hat: { line: 'season.next.hat', fx: { fond: 0.03, drive: { lonely: -0.1 } }, end: true },
      pace: { line: 'season.next.pace', fx: { respect: 0.01 }, end: true },
      hope: { line: 'season.next.hope', end: true },
      missing: { line: 'season.next.missing', fx: { confide: { k: 'season.missing', t: '{Name} misses someone at every {nextFestWord}' }, open: 1 }, go: [
        { ap: 'comfort', say: 'They\'d want you to dance anyway. I\'m sure of it.', to: 'comforted' },
        { ap: 'warm', say: 'Raise a cup to them, at the toast. I\'ll raise mine too.', to: 'toast' },
      ] },
      comforted: { line: 'season.next.comforted', fx: { trust: 0.03 }, end: true },
      toast: { line: 'season.next.toast', fx: { trust: 0.04, fond: 0.02, remember: 'The wizard said he\'d raise a cup with me at the toast.', rv: 1 }, end: true },
      newways: { line: 'season.next.newways', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.next.open', [
    { text: ['{NextFestWord} soon, {name}. Are you ready for it?', 'Looking forward to {nextFestWord}, {name}?'] },
    { if: { festTomorrow: true }, text: ['{NextFestWord} tomorrow, {name}! Can you wait?', 'Only one more sleep till {nextFestWord}, {name}.'] },
    { if: { nextFest: 'yule' }, text: ['Yule\'s nearly here, {name}. Have you been good?'] },
    { if: { nextFest: 'mayday' }, text: ['Mayday soon, {name}. Have you been practising your ribbons?'] },
    { if: { stage: 'child' }, text: ['Do you know what\'s coming, {name}? {NextFestWord}!'] },
  ]);
  lines('season.next.start', [
    { text: ['Ready? I\'ve been ready since the last one.', 'Oh, I can\'t wait. I never can.', 'Am I? I\'ve been counting the days on the pantry door.'] },
    { if: { nextFest: 'mayday' }, text: ['Mayday! The maypole\'s been lying in the field all week, waiting.', 'I\'ve been practising the ribbon dance in the kitchen. Over, under, over. Mostly under.'] },
    { if: { nextFest: 'midsummer' }, text: ['Midsummer! The biggest bonfire and the biggest fireworks of the whole year.', 'The shortest night. I mean to stay up for every minute of it.'] },
    { if: { nextFest: 'harvest' }, text: ['The Harvest Feast! I\'ve been saving room since Highday.', 'Long tables, pies and the year\'s best ale. I\'ve let my belt out already.'] },
    { if: { nextFest: 'yule' }, text: ['Yule! The bonfire and the carols and the mulled ale. I can smell it already.', 'Yule. I\'ve wrapped half my presents and eaten half my mince pies.'] },
    { if: { nextFest: 'founding' }, text: ['Founders\' Day! A long lunch and a toast to the first holes. Tools down!', 'Founders\' Day. A whole day off and a lunch that lasts till teatime.'] },
    { if: { nextFest: 'lantern' }, text: ['Lantern Night! I\'ve got the paper and the paste, and I\'ve no idea what to paint.', 'Lantern Night. All those little lights going up into the dark. I cry every year.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Noise, crowds and somebody standing on my foot. Every year.', 'Ready? I\'m ready for it to be over. ...I\'ll go, mind. I always go.'] },
    { if: { temper: 'ornery', nextFest: 'midsummer' }, text: ['Midsummer. Young idiots jumping over fires. Somebody\'ll lose their eyebrows.'] },
    { if: { temper: 'ornery', nextFest: 'mayday' }, text: ['Mayday. Prancing round a pole. In my day we had dignity. And a bigger pole.'] },
    { if: { temper: 'cheerful' }, text: ['Ready? I was born ready! I\'ve been humming the tunes all week.', 'I love a festival. I love all of them. I love the one after this one too.'] },
    { if: { temper: 'shy' }, text: ['...I like watching. From the edge. With a cup of something.', '...I\'m looking forward to the food. The dancing I\'m less sure about.'] },
    { if: { temper: 'dreamy' }, text: ['The night before is my favourite. When it\'s all still to come.', 'I like the moment the lanterns are lit and nobody\'s said anything yet.'] },
    { if: { temper: 'witty' }, text: ['Ready? I\'ve fasted since second breakfast. It\'s been agony.', 'I\'ve planned my excuses for leaving early. I won\'t use any of them.'] },
    { if: { temper: 'proud' }, text: ['I always do my part. You\'ll see. Nobody does it like my family.', 'I\'m bringing my pie. People talk about my pie. Ask them.'] },
    { if: { temper: 'gloomy' }, text: ['I suppose. It\'s always over too soon. Then there\'s the washing up.', 'It\'ll rain. It rained last time. ...I\'ll still go.'] },
    { if: { temper: 'curious' }, text: ['Do you know how it started? {NextFestWord}, I mean. Nobody here seems to.', 'I want to see how they put it all together. Every year it\'s a bit different.'] },
    { if: { stage: 'child' }, text: ['YES! I\'ve been waiting FOREVER. Is it tomorrow? Is it today?', 'I\'m allowed to stay up! Mum said! Well, she said "we\'ll see".'] },
    { if: { stage: 'child', nextFest: 'yule' }, text: ['Yule! Presents! I\'ve made Dad a spoon. Don\'t tell him. It\'s mostly a stick.'] },
    { if: { stage: 'child', nextFest: 'midsummer' }, text: ['Fireworks! The big ones! Are you doing them? You are, aren\'t you?'] },
    { if: { stage: 'elder' }, text: ['Another one. I\'ve seen a good many. I mean to see a good many more.', 'I\'ll sit at the end of the table where the pudding comes out first. Privilege of age.'] },
    { if: { rift: true }, text: ['Back home we had Sale Day. This is better. Nobody\'s selling anything.', 'A festival with no screens. Just people and fire. I\'m still getting used to it.'] },
    { if: { rift: true, nextFest: 'lantern' }, text: ['Lanterns that just float? No battery? I need to see this.'] },
    { if: { job: 'baker', nextFest: ['harvest', 'yule', 'founding'] }, pri: 1, text: ['Ready? I\'ve been baking since Sterday. My arms are made of dough.'] },
    { if: { job: 'brewer' }, pri: 1, text: ['The barrels are tapped and waiting. It\'s my best brew in years, if I say so myself.'] },
    { if: { job: 'innkeeper' }, pri: 1, text: ['Ready? The Badger\'s been stocked to the rafters. Everyone ends up at mine after.'] },
    { if: { job: 'farmer', nextFest: 'harvest' }, pri: 1, text: ['The last sheaf\'s in. Now I can eat it, in pie form.'] },
    { if: { hazardOn: true }, pri: 1, text: ['With all this trouble about? We need it more than ever, I\'d say.'] },
    { if: { weather: 'rain' }, text: ['If this rain lets up. It had better let up.'] },
  ]);
  lines('season.next.jest', [
    { text: ['I\'ve heard you\'re the one who always eats the last pie.', 'Still recovering from the last one, are you?'] },
    { if: { nextFest: 'mayday' }, text: ['I hear you\'re the one who tied the fiddler to the maypole last year.'] },
    { if: { nextFest: 'midsummer' }, text: ['Will you be jumping the fire this year? Mind your eyebrows.'] },
    { if: { nextFest: 'harvest' }, text: ['I\'ve warned the trestles. They\'re bracing themselves.'] },
    { if: { nextFest: 'yule' }, text: ['Will you be under the mistletoe again? I\'ve heard stories.'] },
    { if: { nextFest: 'lantern' }, text: ['Last year\'s lantern of yours set fire to a haystack, I heard.'] },
    { if: { nextFest: 'founding' }, text: ['Will you give the toast? I hear it lasts till supper.'] },
  ]);
  lines('season.next.tease', [
    { text: ['That was ONE time. And it was mostly not my fault.', 'Who told you that? I\'ll have words with them.'] },
    { if: { temper: 'ornery' }, text: ['Lies. Malicious lies. I know who told you, too.'] },
    { if: { temper: 'witty' }, text: ['I\'ll have you know I\'ve done far worse than that. You\'ve heard the polite version.'] },
    { if: { temper: 'shy' }, text: ['...It wasn\'t me. ...It was a bit me.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! Guilty. And I\'ll do it again.'] },
    { if: { temper: 'proud' }, text: ['A slander. My conduct at festivals is beyond reproach.'] },
    { if: { temper: 'gloomy' }, text: ['Everyone remembers that. Nobody remembers the good things.'] },
    { if: { stage: 'child' }, text: ['I didn\'t! ...Who said? Was it my brother? It was my brother.'] },
    { if: { nextFest: 'midsummer' }, text: ['My eyebrows grew back. Mostly. The left one\'s a bit surprised.'] },
    { if: { nextFest: 'yule' }, text: ['Mistletoe is a tradition. I\'m very traditional. That\'s all.'] },
  ]);
  lines('season.next.plans', [
    { text: ['Eat. Dance. Eat again. Sing badly. Go home happy.', 'The same as always, and that\'s the best of it.'] },
    { if: { nextFest: 'mayday' }, text: ['Dance round the maypole till I\'m dizzy, then lie in the grass and watch the sky spin.', 'Pick hawthorn blossom first thing. You wear it for luck.'] },
    { if: { nextFest: 'midsummer' }, text: ['Jump the fire, if I\'m brave. Watch the fireworks. Stay up to see the sun come back.', 'Dance till the bonfire\'s embers, then walk home in the half-dark.'] },
    { if: { nextFest: 'harvest' }, text: ['Sit at the long tables and eat until somebody carries me home.', 'Soup, then pie, then pudding, then the toast. In that order. Twice.'] },
    { if: { nextFest: 'yule' }, text: ['Carols round the bonfire, mulled ale, and the presents in the morning.', 'Hang holly on the round door and sing till my voice goes.'] },
    { if: { nextFest: 'founding' }, text: ['Down tools, and the long lunch. And listen to the old ones tell how it was.'] },
    { if: { nextFest: 'lantern' }, text: ['Make my lantern this afternoon, and let it go at ten. Then watch it till it\'s a star.'] },
    { if: { temper: 'shy' }, text: ['...Sit near the back. Watch the dancing. Maybe dance. Maybe.'] },
    { if: { temper: 'ornery' }, text: ['Find a good chair and keep it. Last year someone took mine. I know who.'] },
    { if: { temper: 'witty' }, text: ['Stand near the kitchen door. That\'s where the food comes out first. Strategy.'] },
    { if: { temper: 'proud' }, text: ['Lead the first dance. My family always has.'] },
    { if: { temper: 'dreamy' }, text: ['Slip away for a bit, up the hill, and look down at it all lit up.'] },
    { if: { temper: 'gloomy' }, text: ['Go. Stay an hour. Feel a bit better. Come home.'] },
    { if: { temper: 'curious' }, text: ['Watch how the fiddler does that fast bit. I\'ve been trying to work it out for a year.'] },
    { if: { stage: 'child' }, text: ['Stay up the LATEST. Later than anyone. Later than you.', 'Eat cake till I\'m sick. Mum says don\'t. I\'ll do it quietly.'] },
    { if: { stage: 'elder' }, text: ['Sit by the fire with the other old ones and say it was better in our day.'] },
    { if: { spouse: (s) => !!s }, text: ['Dance with {spouse}. We always have the first one. Every year since we were wed.'] },
    { if: { kid: (k) => !!k }, text: ['Keep {kid} out of the punch and off the trestles. Wish me luck.'] },
    { if: { job: 'innkeeper' }, pri: 1, text: ['Work, mostly. But the last hour\'s mine. I always have the last dance.'] },
    { if: { rift: true }, text: ['Watch, mostly. Try to learn the dances. Your dances have rules I can\'t see yet.'] },
  ]);
  lines('season.next.dance', [
    { text: ['A dance with the wizard! I\'ll tell everyone.', 'Ha! You\'re on. Can you keep up?'] },
    { if: { temper: 'shy' }, text: ['...Me? With you? In front of everyone? ...All right.'] },
    { if: { temper: 'ornery' }, text: ['Don\'t tread on my feet. My last partner did and I\'ve not forgiven them.'] },
    { if: { temper: 'cheerful' }, text: ['Two! I\'ll save you two! One fast, one slow!'] },
    { if: { temper: 'witty' }, text: ['A dance with a wizard. Will I come back as a frog?'] },
    { if: { temper: 'proud' }, text: ['I\'ll save you one. I don\'t save dances for just anyone.'] },
    { if: { temper: 'gloomy' }, text: ['If you like. I\'m not much of a dancer. ...But all right.'] },
    { if: { temper: 'dreamy' }, text: ['Under the lanterns. Yes. I\'d like that.'] },
    { if: { stage: 'child' }, text: ['Can you lift me up? Dad lifts me up when we dance.', 'You have to do the spinny one. The spinny one\'s the best.'] },
    { if: { stage: 'elder' }, text: ['A slow one, mind. My knees are older than your hat.'] },
    { if: { spouse: (s) => !!s }, text: ['One. {Spouse} gets the rest. {Spouse}\'s very particular.'] },
  ]);
  lines('season.next.windmill', [
    { text: ['A windmill! Then I\'ll stand well back.', 'Ha! I\'ll warn the trestles.'] },
    { if: { temper: 'witty' }, text: ['Then we\'ll do the windmill dance. Nobody else will be able to get near.'] },
    { if: { stage: 'child' }, text: ['Do it now! Do the windmill! Go on!'] },
  ]);
  lines('season.next.whom', [
    { text: ['Everyone. You don\'t go with anyone. You just go.', 'Whoever\'s walking that way. That\'s the custom.'] },
    { if: { spouse: (s) => !!s }, text: ['With {spouse}, of course. Arm in arm. We\'ve not missed one yet.'] },
    { if: { spouse: null, friend: (f) => !!f }, text: ['With {friend}, I expect. We always end up together, by the fire.'] },
    { if: { spouse: null, temper: 'shy' }, text: ['...Nobody, really. I sort of arrive on my own.'] },
    { if: { spouse: null, temper: 'dreamy' }, text: ['On my own. Who knows who I\'ll come home with? Well. Nobody, probably.'] },
    { if: { kid: (k) => !!k }, text: ['With {kid} pulling me there by the hand, half an hour too early.'] },
    { if: { stage: 'child' }, text: ['With everyone! And my friends! And you!'] },
    { if: { lonely: true }, pri: 1, text: ['...Nobody. I don\'t really have anyone to go with.'] },
  ]);
  lines('season.next.hat', [
    { text: ['Hold your hat! I\'d be honoured. I\'ll try not to wear it.', 'Ha! All right. I\'ll find you by the party tree.'] },
    { if: { temper: 'shy' }, text: ['...Really? I\'d like that. I won\'t drop it.'] },
    { if: { temper: 'ornery' }, text: ['A hat-holder. That\'s what I\'m good for. ...Fine. I\'ll be there.'] },
    { if: { lonely: true }, pri: 1, text: ['...Thank you. That\'s made my week, that has.'] },
  ]);
  lines('season.next.pace', [
    { text: ['Pace myself? At a feast? You\'ve not met many hobbits.', 'I\'ll have one of everything, then go round again. That\'s pacing.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I\'ve paced myself through more feasts than you\'ve had birthdays.'] },
    { if: { temper: 'witty' }, text: ['Pies first is the strategy. Thank you for confirming.'] },
    { if: { stage: 'child' }, text: ['I\'ll eat the pudding first. Then I can\'t run out.'] },
  ]);
  lines('season.next.lastyear', [
    { text: ['Oh, lovely. It rained a bit, and nobody minded.', 'Wonderful. Somebody fell in the river. It was wonderful.'] },
    { if: { lastFest: (x) => !!x }, text: ['Like {lastFestWord}, only more so. You were there!'] },
    { if: { temper: 'ornery' }, text: ['Too long, too loud, too much dancing. I loved it.'] },
    { if: { temper: 'dreamy' }, text: ['I remember the light most. Everything gold and soft.'] },
    { if: { temper: 'gloomy' }, text: ['Good. Better than this year will be, probably.'] },
    { if: { temper: 'witty' }, text: ['I remember the first half. The second half was described to me later.'] },
    { if: { stage: 'child' }, text: ['I was little last year. I was SO little. I fell asleep under the table.'] },
    { if: { stage: 'elder' }, text: ['Like all the others. Like the first. It doesn\'t change, and that\'s the comfort of it.'] },
    { if: { fwLately: true }, text: ['Not a patch on your fireworks. Nothing\'s a patch on those.'] },
  ]);
  lines('season.next.hope', [
    { text: ['Better. I\'ve a feeling. I\'ve a good feeling.', 'If the weather holds, and the ale holds out.'] },
    { if: { temper: 'gloomy' }, text: ['Hope not. Hope\'s how you get disappointed.'] },
    { if: { temper: 'cheerful' }, text: ['Better! Every year\'s better. I\'ve decided.'] },
    { if: { temper: 'witty' }, text: ['Same, but with less of me falling in the river.'] },
  ]);
  lines('season.next.before', [
    { text: ['Small. A few families round a fire. It was nice. This is bigger.', 'Much the same, only we had to borrow a field from a farmer who hated us.'] },
    { if: { stage: 'elder' }, text: ['We kept it in the old way, in the old village. Fewer of us every year. That\'s why we came.'] },
    { if: { rift: true }, text: ['We didn\'t. There was nothing to keep. That\'s why this one matters to me.'] },
    { if: { temper: 'dreamy' }, text: ['On a hill, under the stars, with the whole valley below. I think about it a lot.'] },
    { if: { stage: 'child' }, text: ['I don\'t remember! I was a baby. I was a baby EVERYWHERE.'] },
  ]);
  lines('season.next.newways', [
    { text: ['New ways. Yes. I\'d like that. Something that\'s ours.', 'That\'s it, isn\'t it. We\'re the old ones now, for somebody one day.'] },
    { if: { temper: 'dreamy' }, text: ['And one day someone will say "we\'ve always done it this way", and it\'ll be us they mean.'] },
    { if: { temper: 'proud' }, text: ['Thistledown ways. They\'ll be the best ways. I\'ll see to it.'] },
  ]);
  lines('season.next.missing', [
    { text: ['...Somebody I used to dance with. They\'re not here now. I always look for them, first.', 'My mother loved it more than anyone. I still save her a seat. Don\'t laugh.'] },
    { if: { lost: (x) => !!x }, pri: 2, text: ['{Lost}. My {lostRel}. We were meant to see one together. I keep thinking they\'ll turn up.'] },
    { if: { stage: 'elder' }, text: ['All of them. Every year there\'s one less of us at the old table.'] },
    { if: { rift: true }, text: ['My people. Back on the other side. I wonder if they\'d like it. I think they would.'] },
    { if: { temper: 'gloomy' }, text: ['The one who made it worth going. I go anyway. That\'s what you do.'] },
    { if: { temper: 'shy' }, text: ['...A friend. From before. I don\'t talk about it much.'] },
    { if: { stage: 'child' }, text: ['My granny. She did the best ribbons. She\'s not here now.'] },
  ]);
  lines('season.next.comforted', [
    { text: ['...Yes. They would. They\'d be first on the floor.', 'Thank you. I\'ll dance one for them, then.'] },
    { if: { temper: 'proud' }, text: ['Hm. Yes. Well. ...Thank you, wizard.'] },
    { if: { temper: 'gloomy' }, text: ['...Maybe. Maybe I will.'] },
  ]);
  lines('season.next.toast', [
    { text: ['You will? ...Then I\'ll look for you, when the cups go up.', 'That\'s... yes. I\'d like that very much.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. I\'ll look for your hat.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Don\'t make me cry at the long tables. ...Thank you.'] },
  ]);

  // --- Today's occasion -----------------------------------------------------------------
  const TODAY_LABEL = { mayday: 'Happy Mayday!', midsummer: 'A merry Midsummer!', harvest: 'The Harvest Feast tonight', yule: 'Happy Yule!', founding: 'Founders\' Day', lantern: 'Lantern Night', birthday: 'The birthday party', wedding: 'The wedding', holiday: 'A holiday!', wizard: 'Your party tonight', feast: 'The Steward\'s feast', twohearths: 'Two Hearths' };
  addThread({
    id: 'season.today', cool: 1, weight: 1.6,
    label: (F) => TODAY_LABEL[F.occasion] || (F.occasion ? 'Tonight\'s do' : 'Today'),
    when: (F) => !!F.occasion && !['evening', 'fireworks'].includes(F.occasion),
    rel: (F) => (F.festToday ? 1.9 : 1.5),
    open: { warm: 'season.today.open' },
    beats: {
      start: { line: 'season.today.start', go: [
        { ap: 'warm', say: 'season.today.wish', label: 'Wish them joy of the day', to: 'glad' },
        { ap: 'ask', say: 'What\'s the best of it, for you?', to: 'best' },
        { ap: 'jest', say: 'Have you eaten your own weight yet, or is that tonight?', to: 'weight' },
      ] },
      glad: { line: 'season.today.glad', go: [
        { ap: 'ask', say: 'And will you dance?', to: 'dance' },
        { ap: 'share', say: 'I\'ve kept days like this in a hundred places. None quite like here.', to: 'hundred' },
      ] },
      best: { line: 'season.today.best', go: [
        { ap: 'ask', say: 'And who will you spend it with?', to: 'company' },
        { ap: 'listen', say: '*You smile, and wait.*', label: 'Smile, and wait', to: 'means', need: { open: 1 }, soft: true },
      ] },
      weight: { line: 'season.today.weight', go: [
        { ap: 'jest', say: 'I\'ll weigh you on the way in and the way out.', to: 'scales' },
        { ap: 'warm', say: 'Good. A day like this wants a good appetite. What else is the best of it?', to: 'best' },
      ] },
      scales: { line: 'season.today.scales', fx: { joke: { k: 'season.scales', t: 'The wizard threatened to weigh everyone on the way in and out of the feast.' } }, end: true },
      dance: { line: 'season.today.dance', go: [
        { ap: 'jest', say: 'Only if the fiddler plays slow enough for an old wizard.', to: 'slow' },
        { ap: 'warm', say: 'Then I\'ll come and watch you.', to: 'end', fx: { fond: 0.02 } },
      ] },
      slow: { line: 'season.today.slow', fx: { fond: 0.02 }, end: true },
      hundred: { line: 'season.today.hundred', go: [
        { ap: 'tale', say: 'season.today.tale', label: 'Tell of a feast far away', to: 'tale' },
        { ap: 'warm', say: 'No. Here\'s best. Here\'s where the people are.', to: 'here' },
      ] },
      tale: { line: 'season.today.taleback', fx: { fond: 0.03 }, end: true },
      here: { line: 'season.today.here', fx: { fond: 0.02, trust: 0.01 }, end: true },
      company: { line: 'season.today.company', end: true },
      means: { line: 'season.today.means', fx: { trust: 0.03, remember: 'Told the wizard what today means to me.', rv: 1 }, go: [
        { ap: 'warm', say: 'Then I\'m glad you have it.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'share', say: 'It\'s the days like this I carry with me on the road.', to: 'carry' },
      ] },
      carry: { line: 'season.today.carry', fx: { trust: 0.03 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('season.today.open', [
    { text: ['A happy day to you, {name}!', 'Quite a day, {name}. Are you ready for tonight?'] },
    { if: { occasion: 'mayday' }, text: ['Happy Mayday, {name}! Have you hawthorn in your buttonhole?'] },
    { if: { occasion: 'midsummer' }, text: ['A merry Midsummer, {name}! The longest day, and we\'ll use every minute.'] },
    { if: { occasion: 'harvest' }, text: ['The Harvest Feast tonight, {name}! Are you hungry?'] },
    { if: { occasion: 'yule' }, text: ['Happy Yule, {name}! There\'s frost on my beard and joy in my heart.'] },
    { if: { occasion: 'founding' }, text: ['Happy Founders\' Day, {name}. To the first holes!'] },
    { if: { occasion: 'lantern' }, text: ['Lantern Night, {name}. Have you made yours?'] },
    { if: { occasion: 'birthday', bdayHost: (h) => !!h }, text: ['{BdayHost}\'s birthday party tonight, {name}. Will you be going?'] },
    { if: { occasion: 'wedding', couple: (c) => !!c }, text: ['A wedding today, {name}! {Couple}. Isn\'t it grand?'] },
    { if: { occasion: 'holiday', holidayName: (h) => !!h }, text: ['Happy {holidayName}, {name}! A holiday for no good reason is the best kind.'] },
    { if: { occasion: 'wizard' }, text: ['There\'s a party tonight, {name}, and I believe I\'m the excuse.'] },
    { if: { bdayToday: true }, pri: 3, text: ['Happy birthday, {name}! Many happy returns of the day!'] },
    { if: { isCouple: true }, pri: 3, text: ['The happy day, {name}! Congratulations, with all my heart.'] },
  ]);
  lines('season.today.start', [
    { text: ['Isn\'t it grand? The whole village is humming.', 'I\'ve been up since dawn. Too excited to sleep. Like a child!', 'What a day! I keep stopping in the lane just to smile.'] },
    { if: { occasion: 'mayday' }, text: ['The maypole\'s up and the ribbons are out. I\'ve got blossom in my hair and I don\'t care who knows it.'] },
    { if: { occasion: 'mayday', mayQueen: (q) => !!q }, pri: 1, text: ['Did you hear? {MayQueen}\'s to be {mayTitle} of the May! In a hawthorn crown!'] },
    { if: { occasion: 'midsummer' }, text: ['Midsummer! They\'ve been building the bonfire all morning. It\'s taller than the inn.', 'The longest day! I\'ve been up since four and I mean to see the sun come up again.'] },
    { if: { occasion: 'harvest' }, text: ['The tables are going out! Pies, stews and cider for everyone. I\'ve not eaten since breakfast. Second breakfast.', 'The Harvest Feast. The whole year\'s work, on one long table.'] },
    { if: { occasion: 'yule' }, text: ['Happy Yule! The bonfire\'s ready and the ale\'s mulling. Can you smell the cloves?', 'Yule! Holly on every door and the carols tonight. Best night of the year.'] },
    { if: { occasion: 'founding' }, text: ['Founders\' Day. Tools down and the long tables out. To the first holes!', 'Founders\' Day. I keep thinking of the first spadeful, and look at us now.'] },
    { if: { occasion: 'lantern' }, text: ['Lantern Night. My lantern\'s drying on the windowsill. I\'ve painted a fish on it. It looks like a boot.', 'Lantern Night! At ten o\'clock we let them all go. Have you seen it? It\'s like the stars coming home.'] },
    { if: { occasion: 'birthday', bdayHost: (h) => !!h }, text: ['{BdayHost}\'s party tonight! There\'s a present for every guest. That\'s proper, that is.'] },
    { if: { occasion: 'wedding', couple: (c) => !!c }, text: ['{Couple}! Married today! I\'ve cried twice already and the feast hasn\'t started.', 'A wedding! {Couple}. I always knew. Well. I hoped.'] },
    { if: { occasion: 'holiday', holidayName: (h) => !!h }, text: ['{HolidayName}! No work and a party. I could get used to holidays.', 'A holiday! {HolidayName}! Nobody quite knows why. Nobody\'s asking.'] },
    { if: { occasion: 'coming-of-age' }, text: ['A coming of age tonight! Thirty-three, and a grown hobbit at last.'] },
    { if: { occasion: 'house-warming' }, text: ['A house-warming! There\'s a new hole in the hill, and we\'re all going to warm it.'] },
    { if: { occasion: 'wizard' }, text: ['A party for the wizard! For you! There\'ll be fireworks, won\'t there? There will.'] },
    { if: { occasion: 'feast' }, text: ['The Steward\'s feast! All paid for! I\'m going to eat like a king. Like two kings.'] },
    { if: { occasion: 'twohearths' }, text: ['Two Hearths. Hill-folk and rift-folk at one table. My gran would have fainted. I think it\'s lovely.'] },
    { if: { occasion: 'highday' }, text: ['The Highday dance! Strip the Willow and no work tomorrow. Well. Some work.'] },
    { if: { occasion: 'moot' }, text: ['The Moot\'s done, and now we dance about it. That\'s how it should be.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Another do. Everyone shrieking and nobody listening. I\'ll be there by six.'] },
    { if: { temper: 'shy' }, text: ['...It\'s nice. Everyone\'s so happy. I like watching them.'] },
    { if: { temper: 'gloomy' }, text: ['I suppose it is a happy day. For some. I\'ll try.'] },
    { if: { temper: 'witty' }, text: ['A happy day! Everyone\'s nicer. It\'s very unsettling.'] },
    { if: { temper: 'proud' }, text: ['A fine day for Thistledown. We do these things properly here.'] },
    { if: { temper: 'cheerful' }, text: ['Happy day! Happy day! I\'ve said it to everyone. Now I\'ve said it to you.'] },
    { if: { temper: 'dreamy' }, text: ['Days like this feel like they\'ve always been happening, somewhere.'] },
    { if: { stage: 'child' }, text: ['IT\'S TODAY! It\'s actually today! I\'ve been waiting a WHOLE YEAR!', 'I\'m allowed to stay up! I\'m allowed! Mum said yes this time!'] },
    { if: { stage: 'elder' }, text: ['Another one. I never tire of them. That surprises people.'] },
    { if: { rift: true }, text: ['Everyone\'s smiling at once. In Neverdark that meant a sale. Here it just means a party.'] },
    { if: { bdayToday: true }, pri: 3, text: ['It\'s my birthday! I\'ve been giving out presents since breakfast. That\'s the custom!'] },
    { if: { isCouple: true }, pri: 3, text: ['I\'m getting married. Today. Me! Pinch me. No, don\'t, I bruise.'] },
    { if: { weather: 'rain' }, pri: 1, text: ['If only this rain would stop! The whole thing\'s in the balance.'] },
  ]);
  lines('season.today.wish', [
    { text: ['Joy of the day to you, {name}, and to everyone under your roof.', 'May your cup be full and your plate fuller, {name}.'] },
    { if: { occasion: 'mayday' }, text: ['A merry May to you, {name}. May the ribbons never tangle.'] },
    { if: { occasion: 'midsummer' }, text: ['A long day and a short night to you, {name}, and a soft landing over the fire.'] },
    { if: { occasion: 'harvest' }, text: ['A full table and an empty plate to you, {name}. Many times over.'] },
    { if: { occasion: 'yule' }, text: ['Joy of the Yule to you, {name}, and a warm hearth till spring.'] },
    { if: { occasion: 'lantern' }, text: ['May your lantern fly high, {name}, and your wish fly higher.'] },
    { if: { occasion: 'wedding' }, text: ['Joy to the couple, {name}, and to everyone who loves them.'] },
    { if: { bdayToday: true }, pri: 3, text: ['Many happy returns, {name}, and many happy returns of the returns.'] },
  ]);
  lines('season.today.glad', [
    { text: ['Thank you! And to you. Wizards deserve a happy day too.', 'Oh, that\'s lovely. I\'ll remember that one.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. That\'s very kind.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. And to you. Don\'t make a speech of it.'] },
    { if: { temper: 'witty' }, text: ['A wish from a wizard! Does that count double?'] },
    { if: { temper: 'cheerful' }, text: ['And to YOU! And your hat! And your horse!'] },
    { if: { temper: 'gloomy' }, text: ['...That\'s kind. That\'s really kind. I\'ll try to have one.'] },
    { if: { temper: 'proud' }, text: ['Thank you, wizard. Very properly said.'] },
    { if: { stage: 'child' }, text: ['Was that a spell? It sounded like a spell!'] },
    { if: { rift: true }, text: ['That\'s a nice one. Can I save it? I\'m collecting your sayings.'] },
  ]);
  lines('season.today.best', [
    { text: ['Everyone in one place, for once. Even the ones who don\'t like each other.', 'The moment the first tune starts. Every year it gets me.'] },
    { if: { occasion: 'mayday' }, text: ['The ribbons all plaiting down the pole. And then somebody goes the wrong way and it\'s chaos.', 'The crowning. Seeing some young one go pink under a hawthorn crown.'] },
    { if: { occasion: 'midsummer' }, text: ['Jumping the fire. It\'s for luck. And for showing off.', 'The fireworks at the end. Yours. Nothing else comes close.'] },
    { if: { occasion: 'harvest' }, text: ['The toast. Everyone standing, all down the long tables, cups up for the harvest.', 'The pies. Every family brings their own, and you have to try them all. It\'s only polite.'] },
    { if: { occasion: 'yule' }, text: ['Carols round the bonfire, with everyone\'s breath going up in clouds.', 'Giving the presents. Seeing their faces. That\'s Yule.'] },
    { if: { occasion: 'founding' }, text: ['The old ones telling how it was. Same stories every year. I\'d miss them if they stopped.'] },
    { if: { occasion: 'lantern' }, text: ['That second when you let go and it doesn\'t fall. It goes up. Every time I\'m surprised.'] },
    { if: { occasion: 'birthday' }, text: ['The presents, of course. The birthday hobbit gives them. Best custom there is.'] },
    { if: { occasion: 'wedding' }, text: ['The vows. Everyone pretending not to cry. Everyone crying.'] },
    { if: { occasion: 'holiday' }, text: ['The lie-in. The long, long lie-in. Then the party. Then another lie-in.'] },
    { if: { occasion: 'wizard' }, text: ['The fireworks, of course. Will there be the dragon? Tell me there\'ll be the dragon.'] },
    { if: { temper: 'ornery' }, text: ['Going home. ...And the bit before going home. The pie bit.'] },
    { if: { temper: 'witty' }, text: ['Watching who dances with whom. Better than any story.'] },
    { if: { temper: 'dreamy' }, text: ['Late on, when the music\'s slow and the lanterns are low and nobody wants to go.'] },
    { if: { temper: 'gloomy' }, text: ['When it\'s quiet again after. ...And a bit of the middle.'] },
    { if: { stage: 'child' }, text: ['Staying up! And cake! And running between the tables!'] },
    { if: { stage: 'elder' }, text: ['Seeing the young ones dance the dances I danced. They do it wrong. It\'s lovely.'] },
    { if: { bdayToday: true }, pri: 3, text: ['Giving the presents! I\'ve one for everyone. Even the grumpy ones.'] },
    { if: { isCouple: true }, pri: 3, text: ['Them. The one I\'m marrying. Everything else is cake.'] },
  ]);
  lines('season.today.weight', [
    { text: ['Tonight. I\'ve been working up to it all day.', 'Not yet! I\'m pacing myself. Like an athlete.'] },
    { if: { temper: 'ornery' }, text: ['Rude. ...Tonight. Twice my weight, if I can manage it.'] },
    { if: { temper: 'witty' }, text: ['My own weight? Amateur. I\'m going for yours.'] },
    { if: { temper: 'proud' }, text: ['I eat precisely what is proper. Which is a great deal.'] },
    { if: { temper: 'shy' }, text: ['...I\'ve had a biscuit. Just one. Saving room.'] },
    { if: { stage: 'child' }, text: ['I\'ve had THREE cakes and it\'s not even dinner!'] },
  ]);
  lines('season.today.scales', [
    { text: ['Ha! Then I\'ll come in by the back door.', 'You wouldn\'t dare! ...Would you?'] },
    { if: { temper: 'witty' }, text: ['Then I\'ll carry rocks in on the way in. It\'ll look like I lost weight.'] },
    { if: { stage: 'child' }, text: ['Weigh me! Weigh me now! Then after! I want to see!'] },
  ]);
  lines('season.today.dance', [
    { text: ['Course I will! Who doesn\'t?', 'Strip the Willow, if the fiddler\'s quick enough. And I\'ll be quicker.'] },
    { if: { temper: 'shy' }, text: ['...If somebody asks. Nobody usually asks.'] },
    { if: { temper: 'ornery' }, text: ['Once. One dance. Then I sit.'] },
    { if: { temper: 'gloomy' }, text: ['Maybe one. It usually helps, if I\'m honest.'] },
    { if: { stage: 'child' }, text: ['I\'ll dance ALL NIGHT. Until I fall over. That\'s how you know you\'re done.'] },
    { if: { stage: 'elder' }, text: ['One slow one. My dancing days are mostly sitting days now.'] },
    { if: { spouse: (s) => !!s }, text: ['With {spouse}. We\'ve a dance of our own. Nobody else knows the steps.'] },
    { if: { likes: 'music' }, pri: 1, text: ['Every dance. Every single one. Try and stop me.'] },
  ]);
  lines('season.today.slow', [
    { text: ['Ha! I\'ll have a word with the fiddler.', 'Then it\'ll be the slowest Strip the Willow in history.'] },
    { if: { temper: 'witty' }, text: ['Slow enough for a wizard? We\'ll be dancing till Yule.'] },
    { if: { stage: 'child' }, text: ['I\'ll make him play SUPER slow. Like a snail. A dancing snail.'] },
  ]);
  lines('season.today.hundred', [
    { text: ['A hundred places! Where\'s the best one? Apart from here.', 'Go on, then. Where else? What do they do?'] },
    { if: { temper: 'proud' }, text: ['None like here, I should think. We do it properly.'] },
    { if: { temper: 'curious' }, text: ['A hundred! Tell me one. Just one. The strangest one.'] },
    { if: { stage: 'child' }, text: ['Do they have fireworks everywhere? Do they have dragons?'] },
  ]);
  lines('season.today.tale', [
    { text: ['The elves keep their feasts under the stars, singing till the dawn, and nobody eats a thing.'] },
    { if: { season: ['spring', 'summer'] }, text: ['The elves keep Midsummer under the stars, singing till the dawn, and nobody eats a thing.'] },
    { if: { season: 'autumn' }, text: ['The dwarves keep their harvest in a hall of stone, and the toasts go on so long the candles burn down twice.'] },
    { if: { season: 'winter' }, text: ['Far in the north, the Yule fire is lit on the ice of a frozen lake, and they skate round it all night.'] },
  ]);
  lines('season.today.taleback', [
    { text: ['Nobody eats? Then what\'s the point of it?', 'I\'d like to see that, once. Just once.'] },
    { if: { temper: 'dreamy' }, text: ['Oh, I\'d like to be there, once. Just to see it.'] },
    { if: { temper: 'ornery' }, text: ['Foreign feasts. All show and no supper. I\'ll stay here.'] },
    { if: { season: 'autumn' }, text: ['Twice! I\'d like to see that. I\'d like to eat at that.', 'Dwarves know how to keep a feast. I\'ll give them that.'] },
    { if: { season: 'winter' }, text: ['On the ice! With a fire! Doesn\'t it go through?', 'Skating round a bonfire. I\'d fall in. I know I would.'] },
    { if: { season: ['spring', 'summer'], temper: 'ornery' }, text: ['Elves. All singing and no supper. I\'ll stay here.'] },
    { if: { stage: 'child', season: 'winter' }, text: ['Skating round a fire? Doesn\'t the ice melt? Doesn\'t it?'] },
    { if: { stage: 'child' }, text: ['Can I go? When I\'m big? Will you take me?'] },
  ]);
  lines('season.today.here', [
    { text: ['Oh, you old charmer. ...It is, though, isn\'t it?', 'That\'s right. Here\'s best. Now come and have some pie.'] },
    { if: { temper: 'proud' }, text: ['Quite right. I\'ve always said so.'] },
    { if: { temper: 'shy' }, text: ['...That\'s nice. That you think that.'] },
  ]);
  lines('season.today.company', [
    { text: ['Everyone! That\'s the beauty of it.', 'Whoever sits down next to me. That\'s half the fun.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse}, and whoever {spouse}\'s decided we\'re talking to this year.'] },
    { if: { friend: (f) => !!f }, text: ['{Friend}, probably. We always end up at the same end of the table.'] },
    { if: { kid: (k) => !!k }, text: ['{Kid}, if I can keep hold of them. They\'re off like a shot.'] },
    { if: { lonely: true }, pri: 1, text: ['...I don\'t know. I\'ll find somebody. Maybe you?'] },
    { if: { stage: 'child' }, text: ['My friends! We\'ve got a den under the long tables.'] },
  ]);
  lines('season.today.means', [
    { text: ['...It means we\'re still here. All of us. Another year.', 'It means nobody\'s on their own tonight. That\'s what it means to me.'] },
    { if: { occasion: 'founding' }, text: ['My people dug some of those first holes. I think of them every Founders\' Day.'] },
    { if: { occasion: 'yule' }, text: ['Yule\'s when I miss the ones who\'ve gone, and love the ones who haven\'t, all at once.'] },
    { if: { occasion: 'lantern' }, text: ['Every lantern\'s a wish, and every wish is someone hoping. A whole sky of hoping.'] },
    { if: { occasion: 'harvest' }, text: ['It means we\'ll be all right through the winter. You don\'t know how much that means till you\'ve been hungry.'] },
    { if: { rift: true }, text: ['It means I belong somewhere. That they set a place for me.'] },
    { if: { stage: 'elder' }, text: ['I\'ve fewer of them left than behind me. So each one means a bit more.'] },
    { if: { bdayToday: true }, pri: 3, text: ['That I\'m still here, and have folk to give presents to. That\'s a lot to be glad of.'] },
  ]);
  lines('season.today.carry', [
    { text: ['You carry us with you? On the road?', '...That\'s lovely. I\'ll think of that when you\'re away.'] },
    { if: { temper: 'dreamy' }, text: ['Then part of us goes everywhere you go. I like that very much.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Carry us careful, then. Don\'t drop anyone.'] },
  ]);

  // --- The party, in full swing ------------------------------------------------------------
  addThread({
    id: 'season.party', cool: 1, weight: 1.4, label: 'Enjoying the party?',
    when: (F) => !!F.party,
    rel: () => 1.6,
    open: { warm: 'season.party.open' },
    beats: {
      start: { line: 'season.party.start', go: [
        { ap: 'jest', say: 'Has anyone fallen in the punch yet?', to: 'gossip' },
        { ap: 'ask', say: 'Will you dance?', to: 'dance' },
        { ap: 'warm', say: 'You look like you\'re having the time of your life.', to: 'glow' },
      ] },
      gossip: { line: 'season.party.gossip', go: [
        { ap: 'ask', say: 'And you? Is there anyone you\'d like to dance with?', to: 'sweet', need: { open: 1, if: { stage: ['grown', 'child'], spouse: null } }, soft: true },
        { ap: 'jest', say: 'Write it all down. We\'ll sell it in Bree.', to: 'bree' },
        { ap: 'warm', say: 'Let them have their fun. It\'s what tonight\'s for.', to: 'end' },
      ] },
      dance: { line: 'season.party.dance', go: [
        { ap: 'jest', say: 'Very well. One dance. Fetch the fiddler.', to: 'wizdance' },
        { ap: 'share', say: 'I don\'t dance, these days. I once trod on an elf.', to: 'elf' },
      ] },
      glow: { line: 'season.party.glow', go: [
        { ap: 'ask', say: 'What\'s made it, for you?', to: 'made' },
        { ap: 'jest', say: 'It\'s the punch. I\'d know that glow anywhere.', to: 'punch' },
      ] },
      sweet: { line: 'season.party.sweet', fx: { confide: { k: 'season.sweet', t: '{Name} has someone they\'d like to dance with, and hasn\'t dared ask', secret: true } }, go: [
        { ap: 'advise', say: 'Ask them. Tonight. Parties are made for asking.', to: 'asked' },
        { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'safe' },
      ] },
      asked: { line: 'season.party.asked', fx: { respect: 0.03, hook: 'season.sweet' }, end: true },
      safe: { line: 'season.party.safe', fx: { trust: 0.04, promise: { k: 'secret.season.sweet', t: 'You promised to keep who they\'d like to dance with to yourself', days: 10 } }, end: true },
      bree: { line: 'season.party.bree', end: true },
      wizdance: { line: 'season.party.wizdance', fx: { fond: 0.03, joke: { k: 'season.willow', t: 'The wizard danced Strip the Willow and lost his hat in the punch.' }, drive: { bored: -0.2 } }, end: true },
      elf: { line: 'season.party.elf', go: [
        { ap: 'tale', say: 'He was very gracious about it. He limped for a century.', to: 'limp' },
        { ap: 'warm', say: 'But for you, I might risk it.', to: 'wizdance' },
      ] },
      limp: { line: 'season.party.limp', fx: { fond: 0.02 }, end: true },
      made: { line: 'season.party.made', fx: { remember: 'Had a lovely night at the party. Told the wizard so.', rv: 1 }, end: true },
      punch: { line: 'season.party.punch', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('season.party.open', [
    { text: ['Enjoying yourself, {name}?', 'What a night, {name}! Are you having fun?'] },
    { if: { tipsy: true }, text: ['You\'re looking very merry, {name}. Is the cider good?'] },
    { if: { stage: 'child' }, text: ['Shouldn\'t you be in bed, {name}? No? Good.'] },
  ]);
  lines('season.party.start', [
    { text: ['Oh, it\'s lovely! The music, the lanterns, all of it.', 'Best do in ages! Did you see the fiddler\'s face? He\'s on fire tonight.'] },
    { if: { tipsy: true }, pri: 2, text: ['Wizard! My favourite wizard! Have you had the cider? Have the cider.', 'I love everyone. Everyone! Even the miller. Especially the miller.'] },
    { if: { temper: 'ornery' }, text: ['Too loud. Too crowded. Somebody trod on me twice. ...It\'s not bad, I suppose.'] },
    { if: { temper: 'shy' }, text: ['...It\'s nice from here. At the edge. I can see everyone.'] },
    { if: { temper: 'cheerful' }, text: ['I\'m having the BEST time. I\'ve danced four times and eaten six times.'] },
    { if: { temper: 'witty' }, text: ['Wonderful. I\'ve seen three proposals and one of them was to a goat.'] },
    { if: { temper: 'gloomy' }, text: ['It\'s all right. I\'m trying. The music helps.'] },
    { if: { temper: 'dreamy' }, text: ['Look at the lanterns in the party tree. Like fruit made of light.'] },
    { if: { temper: 'proud' }, text: ['A fine party. I helped hang the lanterns. The good ones.'] },
    { if: { temper: 'curious' }, text: ['Did you know the fiddler only knows nine tunes? He plays them faster and calls them new.'] },
    { if: { stage: 'child' }, text: ['I\'ve had FOUR cakes and nobody\'s noticed!', 'We\'re playing hide and seek under the tables! Don\'t tell!'] },
    { if: { stage: 'elder' }, text: ['I\'ve found the best chair, next to the food. I\'m not moving till midnight.'] },
    { if: { rift: true }, text: ['No speakers, no lights, just one man with a fiddle, and everyone dancing. It\'s wild.'] },
    { if: { occasion: 'midsummer' }, pri: 1, text: ['Did you see? Somebody jumped the fire and landed in the cider barrel!'] },
    { if: { occasion: 'yule' }, pri: 1, text: ['The bonfire\'s roaring and the carols have started. Sing, wizard!'] },
    { if: { occasion: 'mayday' }, pri: 1, text: ['The ribbons are in such a tangle! Somebody went over when they should\'ve gone under.'] },
    { if: { feastOn: true }, pri: 1, text: ['The long tables! I\'ve had the soup and the pie and I\'m waiting for pudding. Bliss.'] },
  ]);
  lines('season.party.gossip', [
    { text: ['Not yet! Give it an hour.', 'Nearly! Somebody leaned on the bowl and it was close.'] },
    { if: { rival: (r) => !!r }, text: ['{Rival}\'s had three cups and is singing. Badly. I\'m enjoying it enormously.'] },
    { if: { friend: (f) => !!f }, text: ['{Friend}\'s been dancing with the same partner all night. Make of that what you will.'] },
    { if: { temper: 'witty' }, text: ['Two folk in the punch and one in the pond. The pond one was intentional.'] },
    { if: { temper: 'ornery' }, text: ['Not yet. I\'m watching the miller. He\'s due.'] },
    { if: { temper: 'shy' }, text: ['...Somebody\'s been sitting under the party tree crying. Happy crying, I think.'] },
    { if: { stage: 'child' }, text: ['My brother fell in the punch! Well, his hand did. Then his sleeve.'] },
    { if: { stage: 'elder' }, text: ['In my day we had a proper punch. You could lose a whole hobbit in it.'] },
  ]);
  lines('season.party.bree', [
    { text: ['Ha! We\'d make a fortune.', 'Bree wouldn\'t believe half of it.'] },
    { if: { temper: 'witty' }, text: ['We\'ll call it "The Thistledown Times". Every word true. Embroidered.'] },
    { if: { temper: 'ornery' }, text: ['Don\'t you dare. I\'m in half of it.'] },
  ]);
  lines('season.party.dance', [
    { text: ['Only if you do!', 'I\'ve danced till my feet hurt. One more can\'t hurt them more.'] },
    { if: { temper: 'shy' }, text: ['...Nobody\'s asked. I\'m waiting.'] },
    { if: { temper: 'ornery' }, text: ['I\'ve done mine. One a party. That\'s plenty.'] },
    { if: { temper: 'cheerful' }, text: ['Yes! Come on! Come on, wizard, everybody\'s dancing!'] },
    { if: { temper: 'witty' }, text: ['I will if you will. I want to see a wizard do the spinny bit.'] },
    { if: { stage: 'child' }, text: ['Dance with ME! Spin me! Spin me round!'] },
    { if: { stage: 'elder' }, text: ['I\'ll watch, thank you. Watching\'s dancing for the knees.'] },
    { if: { tipsy: true }, pri: 1, text: ['I\'ve been dancing all night! Was I good? Nobody will tell me if I was good.'] },
  ]);
  lines('season.party.wizdance', [
    { text: ['He\'s dancing! The wizard\'s dancing! ...Mind the punch! Oh. Oh, your hat.', 'Ha! Look at you go! Like a heron in a gale. A happy heron.'] },
    { if: { temper: 'shy' }, text: ['*laughs so hard they forget to be shy*'] },
    { if: { temper: 'ornery' }, text: ['Well. I\'ve seen worse. ...Not much worse.'] },
    { if: { stage: 'child' }, text: ['AGAIN! Spin AGAIN! Your hat came off! It\'s in the punch!'] },
    { if: { stage: 'elder' }, text: ['Ha! That takes me back. I\'ve not laughed like that since my wedding.'] },
  ]);
  lines('season.party.elf', [
    { text: ['You trod on an elf? What did it say?', 'An ELF? What did you do?'] },
    { if: { temper: 'witty' }, text: ['And it\'s been a feud ever since, I expect. Elves never forget a toe.'] },
    { if: { stage: 'child' }, text: ['Did the elf cry? Do elves cry?'] },
  ]);
  lines('season.party.limp', [
    { text: ['A century! Poor elf.', 'Ha! You\'re making that up. ...Aren\'t you?'] },
    { if: { temper: 'dreamy' }, text: ['A whole century. I\'d have liked to see an elf limp. Gracefully, I suppose.'] },
  ]);
  lines('season.party.glow', [
    { text: ['I am! I really am. It\'s been a long time.', 'Oh, is it that obvious? I can\'t stop smiling.'] },
    { if: { temper: 'shy' }, text: ['...Am I? I suppose I am. Don\'t tell anyone.'] },
    { if: { temper: 'gloomy' }, text: ['...You know, I think I am. That\'s a surprise.'] },
    { if: { temper: 'proud' }, text: ['A hobbit of my standing enjoys a party with decorum. ...But yes.'] },
    { if: { stage: 'child' }, text: ['I AM! It\'s the best night EVER!'] },
  ]);
  lines('season.party.made', [
    { text: ['The music. When the fiddler plays the old slow one, the whole field goes quiet.', 'Everyone together. Even the ones I\'ve fallen out with. Tonight none of it matters.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse} asked me to dance. After all these years. Like the first time.'] },
    { if: { friend: (f) => !!f }, text: ['{Friend} and I made it up. Over a cup of punch. Just like that.'] },
    { if: { stage: 'child' }, text: ['I won the sack race! I fell over three times and still won!'] },
    { if: { rift: true }, text: ['Somebody taught me a dance. Patiently. They didn\'t laugh. Well. Not much.'] },
    { if: { lonely: true }, pri: 1, text: ['Somebody sat with me. Just sat. That\'s all it took.'] },
  ]);
  lines('season.party.punch', [
    { text: ['Ha! It\'s not! Well. It\'s partly.', 'Cheek! ...Two cups. Three.'] },
    { if: { tipsy: true }, pri: 1, text: ['It\'s the punch. It\'s definitely the punch. The punch loves me.'] },
    { if: { stage: 'child' }, text: ['I\'m not allowed punch. I had a bit. It was horrible.'] },
  ]);
  lines('season.party.sweet', [
    { text: ['...There\'s someone. I won\'t say who. They\'re over by the party tree. Don\'t look!', '...Maybe. Someone. I\'ve been trying to get near them all night and I keep losing my nerve.'] },
    { if: { temper: 'shy' }, text: ['...There is. I could never ask. I\'d go red as a radish.'] },
    { if: { temper: 'proud' }, text: ['I don\'t ask. I am asked. ...Nobody\'s asked.'] },
    { if: { temper: 'witty' }, text: ['There\'s someone. They laughed at my joke about the goat. Nobody laughs at that joke.'] },
    { if: { stage: 'child' }, text: ['...There\'s a girl who can whistle with her fingers. I want to learn. That\'s all. That\'s ALL.'] },
  ]);
  lines('season.party.asked', [
    { text: ['...You think so? Right. Right. Before the next tune. Before I think about it.', 'Parties are for asking. Yes. ...Hold my cup.'] },
    { if: { temper: 'shy' }, text: ['...I\'ll try. If I faint, catch me.'] },
    { if: { temper: 'proud' }, text: ['Very well. I shall ask. Graciously.'] },
  ]);
  lines('season.party.safe', [
    { text: ['Thank you. Not a word. Not even a wink.', 'I knew I could tell you. Now forget I did.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. Really. Thank you.'] },
  ]);

  // --- After the fireworks ---------------------------------------------------------------
  addThread({
    id: 'season.fireworks', cool: 3, weight: 1.5,
    label: 'Your fireworks',
    when: (F) => !!F.fwLately,
    rel: (F) => (F.fwAgo === 0 ? 2 : 1.4),
    open: { ask: 'season.fw.open' },
    beats: {
      start: { line: 'season.fw.start', go: [
        { ap: 'ask', say: 'What did you like best?', to: 'best' },
        { ap: 'jest', say: 'I nearly set my beard alight, you know.', to: 'beard' },
        { ap: 'share', say: 'Did you see the rune, in the sky? That\'s my name, in the old letters.', to: 'rune' },
      ] },
      best: { line: 'season.fw.best', go: [
        { ap: 'ask', say: 'Were you frightened, when the dragon came low?', to: 'scared' },
        { ap: 'warm', say: 'Then the dragon was for you.', to: 'foryou' },
      ] },
      beard: { line: 'season.fw.beard', go: [
        { ap: 'tale', say: 'The first firework I ever made blew my hat into a pond.', to: 'firsthat' },
        { ap: 'jest', say: 'It\'s grown back. Mostly. The left side\'s a little surprised.', to: 'end', fx: { joke: { k: 'season.beard', t: 'The wizard nearly set his beard alight at the fireworks.' } } },
      ] },
      rune: { line: 'season.fw.rune', go: [
        { ap: 'share', say: 'A little magic, a lot of powder, and a dwarf who owes me money.', to: 'how' },
        { ap: 'jest', say: 'A wizard never tells. Especially about the dwarf.', to: 'never' },
      ] },
      scared: { line: 'season.fw.scared', go: [
        { ap: 'comfort', say: 'It\'s only light and noise. It would never hurt you.', to: 'safe' },
        { ap: 'jest', say: 'It was frightened of you. Didn\'t you see it flinch?', to: 'flinch' },
      ] },
      safe: { line: 'season.fw.safe', fx: { trust: 0.03 }, end: true },
      flinch: { line: 'season.fw.flinch', fx: { fond: 0.02 }, end: true },
      foryou: { line: 'season.fw.foryou', fx: { fond: 0.03, remember: 'The wizard said the fire dragon was for me.', rv: 2 }, end: true },
      firsthat: { line: 'season.fw.firsthat', fx: { fond: 0.02 }, end: true },
      how: { line: 'season.fw.how', fx: { confide: { k: 'season.dwarf', t: 'The wizard\'s fireworks are partly paid for by a dwarf who owes him money' }, trust: 0.02 }, end: true },
      never: { line: 'season.fw.never', end: true },
    },
    end: { fond: 0.02 },
  });
  lines('season.fw.open', [
    { text: ['What did you make of the fireworks, {name}?', 'Did you see the fireworks, {name}?'] },
    { if: { fwAgo: 0 }, text: ['Did you enjoy tonight\'s show, {name}?', 'Still got stars in your eyes, {name}?'] },
    { if: { stage: 'child' }, text: ['Did you like the fireworks, {name}? Honestly?'] },
  ]);
  lines('season.fw.start', [
    { text: ['The DRAGON! I\'ve not slept. I keep seeing it when I shut my eyes.', 'I\'ve never seen anything like it. Never. I\'ll be telling my grandchildren.', 'That dragon! I thought it would land on the inn.'] },
    { if: { temper: 'ornery' }, text: ['Loud. Very loud. The hens haven\'t laid since. ...It was very good.', 'Frightened the pigs half to death. ...I watched the whole thing, mind.'] },
    { if: { temper: 'cheerful' }, text: ['Wonderful! Wonderful! I cheered so loud I\'ve lost my voice!'] },
    { if: { temper: 'shy' }, text: ['...It was beautiful. I watched from the hedge. I didn\'t breathe the whole time.'] },
    { if: { temper: 'dreamy' }, text: ['When the golden willows came down, slow as anything... I wanted to catch one.'] },
    { if: { temper: 'witty' }, text: ['Not bad. I\'d have liked a bit more dragon. Perhaps two dragons.'] },
    { if: { temper: 'proud' }, text: ['A fine show. Fit for Thistledown. We deserve no less.'] },
    { if: { temper: 'gloomy' }, text: ['It was over so quickly. ...But it was lovely. While it lasted.'] },
    { if: { temper: 'curious' }, text: ['How do you make them burst in a shape? The heart! How do you do a heart?'] },
    { if: { stage: 'child' }, text: ['THE DRAGON! It went ROAR and then BOOM and then it was ALL STARS!', 'Can you do it again? Tonight? Now? Please please please?'] },
    { if: { stage: 'elder' }, text: ['I saw your fireworks once before, when I was young. They were good then. They\'re better now.'] },
    { if: { rift: true }, text: ['In Neverdark we had holo-shows every night. They never once made me cry. Yours did.'] },
    { if: { likes: 'quiet' }, pri: 1, text: ['Very... loud. Beautiful. I had my fingers in my ears and my mouth open.'] },
    { if: { job: 'herder' }, pri: 1, text: ['The cows have forgiven you. The sheep have not. ...Worth it.'] },
  ]);
  lines('season.fw.best', [
    { text: ['The dragon. Obviously the dragon. Flying right over the party field, roaring.', 'The golden willows. They hang there and fall so slow, like the sky\'s weeping gold.'] },
    { if: { temper: 'dreamy' }, text: ['The heart. A heart in the sky, over all of us. I\'ll never forget it.'] },
    { if: { temper: 'witty' }, text: ['The bit where the miller ducked under the trestle. Best thing all night.'] },
    { if: { temper: 'proud' }, text: ['The finale. Everything at once. Thistledown deserves an everything-at-once.'] },
    { if: { temper: 'ornery' }, text: ['The quiet after. ...And the dragon. The dragon was good.'] },
    { if: { stage: 'child' }, text: ['The dragon\'s TAIL! It went all swishy and sparkly! I want a tail like that!'] },
    { if: { rift: true }, text: ['The rocket that went up so high it vanished. Back home nothing ever went up. Only down.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse} held my hand all through the dragon. Hasn\'t done that in years.'] },
  ]);
  lines('season.fw.scared', [
    { text: ['A bit. When it roared. Then it burst into stars and I laughed at myself.', 'Frightened? ...I may have grabbed somebody\'s arm. A stranger\'s arm.'] },
    { if: { temper: 'proud' }, text: ['Frightened? Certainly not. I merely stepped back. Several steps.'] },
    { if: { temper: 'shy' }, text: ['...I hid behind the trestle. Just for the low bit.'] },
    { if: { temper: 'ornery' }, text: ['A dragon in the sky over my house. Of course I was. Do it again, mind.'] },
    { if: { stage: 'child' }, text: ['NO. ...A little. I hid behind Mum. Only my eyes. My eyes were out.'] },
    { if: { stage: 'elder' }, text: ['At my age, I\'ve no time to be frightened. I just watched it come.'] },
  ]);
  lines('season.fw.safe', [
    { text: ['I know. I know. It\'s just... it was very big.', 'Only light. Yes. That\'s what makes it magic, I suppose.'] },
    { if: { stage: 'child' }, text: ['Only light? Then can I touch it next time?'] },
  ]);
  lines('season.fw.flinch', [
    { text: ['Ha! It did, didn\'t it? It saw me coming.', 'Frightened of me! I\'ll tell everyone.'] },
    { if: { stage: 'child' }, text: ['I KNEW it! I made a scary face! It worked!'] },
  ]);
  lines('season.fw.foryou', [
    { text: ['For me? ...Really? I\'ll remember that.', 'Oh, get away with you. ...For me. Fancy that.'] },
    { if: { temper: 'shy' }, text: ['...Nobody\'s ever made a dragon for me before.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Flattery. ...I\'m keeping it, though.'] },
    { if: { stage: 'child' }, text: ['MINE? My own dragon? Can I keep it? Where does it live?'] },
  ]);
  lines('season.fw.beard', [
    { text: ['You never! Your beard?', 'Ha! I did smell something. I thought it was the bonfire.'] },
    { if: { stage: 'child' }, text: ['Your BEARD was on FIRE? Can you do it again?'] },
    { if: { temper: 'witty' }, text: ['A wizard with a smoking beard. Very dramatic. Was it planned?'] },
    { if: { temper: 'ornery' }, text: ['Serves you right. Playing with fire at your age.'] },
  ]);
  lines('season.fw.firsthat', [
    { text: ['A pond! Did you get it back?', 'Ha! And you kept making them?'] },
    { if: { stage: 'child' }, text: ['Was there a frog in it? Was there a frog in your hat?'] },
    { if: { temper: 'curious' }, text: ['What went wrong? Too much powder? How much is too much?'] },
  ]);
  lines('season.fw.rune', [
    { text: ['Your name! In the sky! How do you make it hang there like that?', 'I saw it! I thought it was a sort of bird. A sort of written bird.'] },
    { if: { temper: 'curious' }, text: ['What do the old letters say? Teach me the rune. Please.'] },
    { if: { temper: 'witty' }, text: ['Writing your name in the sky. Bit much, isn\'t it? I\'d do mine bigger.'] },
    { if: { rift: true }, text: ['Like a logo. But it doesn\'t sell anything. It\'s just... you. That\'s nice.'] },
  ]);
  lines('season.fw.how', [
    { text: ['A dwarf! Ha! Does he know you\'re spending his money on dragons?', 'That\'s the best secret anyone\'s told me all year.'] },
    { if: { temper: 'curious' }, text: ['How much does he owe? What for? No, don\'t tell me. Yes, tell me.'] },
    { if: { stage: 'child' }, text: ['A DWARF? A real one? With an axe?'] },
  ]);
  lines('season.fw.never', [
    { text: ['Then I\'ll guess. Magic. It\'s always magic.', 'Hmph. Wizards and their secrets.'] },
    { if: { temper: 'witty' }, text: ['A dwarf! You\'ve told me already. Sloppy, for a wizard.'] },
    { if: { stage: 'child' }, text: ['Tell me when I\'m grown up. Promise.'] },
  ]);

  // --- Their turn: will there be fireworks? -------------------------------------------------
  addThread({
    id: 'season.fw.ask', theirs: true, cool: 3, label: 'They ask about the fireworks',
    ask: '{Name} catches at your sleeve.',
    when: (F) => F.met && !!F.nextFest && F.nextFestIn <= 2 && F.nextFest !== 'founding',
    beats: {
      start: { line: 'season.fwask.q', go: [
        { ap: 'warm', say: 'I wouldn\'t miss it for all the tea in Bree.', to: 'promise' },
        { ap: 'jest', say: 'Only if somebody saves me a slice of pie.', to: 'pie' },
        { ap: 'tale', say: 'This time, perhaps, something new. A ship of fire, sailing over the hill.', to: 'ship' },
      ] },
      pie: { line: 'season.fwask.pie', go: [
        { ap: 'warm', say: 'Then it\'s a bargain. Fireworks for pie.', to: 'promise' },
        { ap: 'jest', say: 'Two slices, and the dragon does a loop.', to: 'loop' },
      ] },
      loop: { line: 'season.fwask.loop', fx: { run: promiseFw, joke: { k: 'season.pieloop', t: 'Two slices of pie and the wizard\'s dragon does a loop.' } }, end: true },
      ship: { line: 'season.fwask.ship', go: [
        { ap: 'warm', say: 'I promise. Watch the sky over the hill.', to: 'promise' },
        { ap: 'jest', say: 'Or a very large duck. I haven\'t decided.', to: 'duck' },
      ] },
      duck: { line: 'season.fwask.duck', fx: { fond: 0.02 }, end: true },
      promise: { line: 'season.fwask.promise', fx: { run: promiseFw, fond: 0.02 }, end: true },
    },
  });
  lines('season.fwask.q', [
    { text: ['Will you do the fireworks at {nextFestWord}? Will there be the dragon?', 'You\'ll be doing the fireworks at {nextFestWord}, won\'t you? Say you will.'] },
    { if: { stage: 'child' }, text: ['Are you doing fireworks at {nextFestWord}? The DRAGON? Promise? PROMISE?', 'Will the dragon come back for {nextFestWord}? I want to wave at it.'] },
    { if: { temper: 'ornery' }, text: ['You\'ll be letting off those bangers at {nextFestWord}, I suppose. ...Will you? Only I want a good seat.'] },
    { if: { temper: 'shy' }, text: ['...Will there be fireworks? At {nextFestWord}? Sorry. I only wondered.'] },
    { if: { temper: 'witty' }, text: ['A question of state, wizard: fireworks at {nextFestWord}, yes or yes?'] },
    { if: { fwLately: true }, pri: 1, text: ['After last time... will you do them again for {nextFestWord}? I\'ve thought of nothing else.'] },
    { if: { rift: true }, text: ['Will you do the sky-fire again for {nextFestWord}? I want to film it. In my head. I\'ve no battery.'] },
  ]);
  lines('season.fwask.pie', [
    { text: ['Done! I\'ll save you the biggest slice. I\'ll guard it with my life.', 'Pie! I\'ll make you a whole pie. With a firework on top in pastry.'] },
    { if: { temper: 'ornery' }, text: ['A slice. Fine. The edge bit, mind. Not the middle.'] },
    { if: { stage: 'child' }, text: ['I\'ll save you MY slice! Well. Half. A bit.'] },
    { if: { job: 'baker' }, pri: 1, text: ['From the baker? You\'ll have the pick of the tray. Fireworks first, mind.'] },
  ]);
  lines('season.fwask.loop', [
    { text: ['A LOOP! Two slices it is! I\'ll tell everyone to watch for the loop!', 'Ha! You drive a hard bargain. Two slices and a loop.'] },
    { if: { stage: 'child' }, text: ['A LOOP? I\'ll save you THREE slices. I\'ll steal them.'] },
  ]);
  lines('season.fwask.ship', [
    { text: ['A ship! Of fire! Over our hill! ...You promise?', 'A ship. I\'ll be watching that hill all night.'] },
    { if: { stage: 'child' }, text: ['A SHIP? With sails? With FIRE sails? Can I ride on it?'] },
    { if: { temper: 'dreamy' }, text: ['A ship of fire, sailing over the hill. I\'ll dream about that till then.'] },
  ]);
  lines('season.fwask.duck', [
    { text: ['A duck! Ha! A fire duck. I\'d pay to see a fire duck.', 'Make it a ship. Please. Not the duck.'] },
    { if: { stage: 'child' }, text: ['DUCK! DUCK! Do the duck! Quack in fire!'] },
  ]);
  lines('season.fwask.promise', [
    { text: ['You promise? I\'ll hold you to it. I\'ll be right at the front.', 'Hooray! I\'ll tell everyone. The wizard says yes!'] },
    { if: { temper: 'ornery' }, text: ['Hmph. A wizard\'s promise. We\'ll see. I\'ll be watching, mind.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. I\'ll be by the hedge. That\'s my spot.'] },
    { if: { stage: 'child' }, text: ['YESSS! I\'m going to tell EVERYONE!', 'Pinkie promise? Pinkie promise. You can\'t un-pinkie.'] },
  ]);

  // --- Birthdays ---------------------------------------------------------------------------
  addThread({
    id: 'season.birthday', cool: 2, weight: 1.6,
    label: (F) => (F.bdayToday ? 'Happy birthday!' : 'Your birthday soon'),
    when: (F) => !!F.bdayToday || !!F.bdaySoon,
    rel: (F) => (F.bdayToday ? 2 : 1.3),
    open: { warm: 'season.bday.open' },
    beats: {
      start: { line: 'season.bday.start', go: [
        { ap: 'warm', say: 'Many happy returns, {name}!', to: 'returns' },
        { ap: 'ask', say: 'And who\'s getting presents from you?', to: 'presents' },
        { ap: 'jest', say: 'How old? No, don\'t tell me. I\'ll guess. Two hundred and six?', to: 'age' },
      ] },
      returns: { line: 'season.bday.returns', go: [
        { ap: 'ask', say: 'And what will you give, this year?', to: 'presents' },
        { ap: 'share', say: 'I\'ve lost count of my own birthdays. I think I\'m owed a few.', to: 'wizbday' },
      ] },
      age: { line: 'season.bday.age', go: [
        { ap: 'warm', say: 'You don\'t look a day over a hundred. Many happy returns.', to: 'returns' },
        { ap: 'jest', say: 'Then I\'ll guess again next year. I\'ll be closer.', to: 'end' },
      ] },
      presents: { line: 'season.bday.presents', go: [
        { ap: 'ask', say: 'And is there one you\'ve been saving for someone special?', to: 'special', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'That\'s a generous heart, {name}.', to: 'generous' },
        { ap: 'jest', say: 'Is it socks? It\'s always socks.', to: 'socks' },
      ] },
      special: { line: 'season.bday.special', fx: { confide: { k: 'season.present', t: '{Name} has a special birthday present put by for someone dear', secret: true } }, go: [
        { ap: 'warm', say: 'I\'ll not breathe a word.', to: 'safe' },
        { ap: 'advise', say: 'Give it to them first. Before you lose your nerve.', to: 'first' },
      ] },
      safe: { line: 'season.bday.safe', fx: { trust: 0.04, promise: { k: 'secret.season.present', t: 'You promised to keep the birthday present a secret', days: 3 } }, end: true },
      first: { line: 'season.bday.first', fx: { respect: 0.02 }, end: true },
      generous: { line: 'season.bday.generous', fx: { fond: 0.02 }, end: true },
      socks: { line: 'season.bday.socks', fx: { fond: 0.01 }, end: true },
      wizbday: { line: 'season.bday.wizbday', go: [
        { ap: 'warm', say: 'Then I\'ll count this one. Shared with you.', to: 'shared' },
        { ap: 'jest', say: 'Not socks, I hope.', to: 'wizsocks' },
      ] },
      shared: { line: 'season.bday.shared', fx: { fond: 0.03, joke: { k: 'season.sharedbday', t: 'The wizard shares their birthday now. He\'s owed a few.' } }, end: true },
      wizsocks: { line: 'season.bday.wizsocks', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('season.bday.open', [
    { text: ['A little bird tells me it\'s your birthday soon, {name}.', 'Your birthday\'s coming, {name}, unless my almanac lies.'] },
    { if: { bdayToday: true }, text: ['Happy birthday, {name}! I\'d know that face anywhere. It\'s a birthday face.', 'Is it true, {name}? Is today the day?'] },
    { if: { stage: 'child', bdayToday: true }, text: ['Happy birthday, young {name}! How old? A hundred?'] },
  ]);
  lines('season.bday.start', [
    { text: ['It is! The {bdayWhen}. Same as every year.', 'My birthday. I\'d nearly forgotten. ...I hadn\'t forgotten.'] },
    { if: { bdayToday: true }, text: ['It is! I\'ve been up since dawn giving presents. That\'s the custom. I love the custom.', 'Today! And I\'ve a present for everyone under my roof. Wrapped properly this time.'] },
    { if: { bdayIn: 1 }, text: ['Tomorrow! And I\'ve not wrapped a thing. Not a single thing.', 'Tomorrow. I\'ve a list as long as my arm and half the presents still to find.'] },
    { if: { bdayIn: 2 }, text: ['The day after tomorrow. Plenty of time. ...Is it? It isn\'t, is it.'] },
    { if: { temper: 'ornery' }, text: ['Don\'t make a fuss. I hate a fuss. ...You can make a small fuss.'] },
    { if: { temper: 'shy' }, text: ['...Oh. You knew. Nobody usually knows.'] },
    { if: { temper: 'cheerful' }, text: ['Yes! My favourite day! Everybody gets a present! From ME!'] },
    { if: { temper: 'gloomy' }, text: ['Another year. They go faster. ...Thank you for remembering, though.'] },
    { if: { temper: 'witty' }, text: ['My birthday. The one day a year I\'m expected to give things away. Hobbits are mad.'] },
    { if: { temper: 'proud' }, text: ['It is. I\'ve planned the presents with great care. Every one a gem.'] },
    { if: { temper: 'dreamy' }, text: ['My birthday. I always feel a bit new on my birthday. Like spring.'] },
    { if: { stage: 'child' }, text: ['MY BIRTHDAY! I\'m giving everyone a present! I made them! Out of stones!', 'I\'m getting bigger! And I get a present from Mum AND I give presents! Double!'] },
    { if: { stage: 'elder' }, text: ['Another one. I stopped counting at ninety. I started again at a hundred, out of pride.'] },
    { if: { rift: true }, text: ['Here you GIVE presents on your birthday? Back home you\'d get a voucher. This is better.'] },
  ]);
  lines('season.bday.returns', [
    { text: ['Thank you! And many happy returns to you, whenever yours is.', 'Thank you, wizard. You\'re the first to say it with a beard.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. That\'s nice.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Thank you. Don\'t sing.'] },
    { if: { temper: 'cheerful' }, text: ['Thank you! Thank you! That\'s twelve people now! I\'m counting!'] },
    { if: { stage: 'child' }, text: ['Thank you! Did you bring me something? You don\'t have to. Did you?'] },
  ]);
  lines('season.bday.age', [
    { text: ['Two hundred! Cheek! I\'m nowhere near... well, I\'m a fair way off.', 'Ha! You\'re out by a good bit, wizard. The good way.'] },
    { if: { temper: 'ornery' }, text: ['Two hundred! I\'ll give you two hundred. ...Rude.'] },
    { if: { temper: 'witty' }, text: ['Two hundred and SEVEN, thank you. Do keep up.'] },
    { if: { stage: 'child' }, text: ['NO! I\'m little! I\'m not even nearly two hundred!'] },
    { if: { stage: 'elder' }, text: ['Closer than you\'d think. Don\'t tell anyone.'] },
  ]);
  lines('season.bday.presents', [
    { text: ['Everyone at home first, then the family, then my dearest friends. Proper order.', 'A jar of honey for this one, a pocket handkerchief for that one. It\'s a whole morning\'s work.'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse} first. Always {spouse} first. Then the rest of the household.'] },
    { if: { kid: (k) => !!k }, text: ['{Kid}\'s getting a toy boat. I\'ve been whittling it at night. Don\'t tell.'] },
    { if: { friend: (f) => !!f }, text: ['{Friend}\'s getting a pretty teacup. Theirs has a crack. They think I haven\'t noticed.'] },
    { if: { pastime: (p) => !!p, madeMany: (m) => !!m }, pri: 1, text: ['{MadeMany}! I\'ve been making {madeMany} all year. Everyone\'s getting one. Whether they like it or not.'] },
    { if: { temper: 'proud' }, text: ['The finest of everything. Nobody will say I gave a poor present.'] },
    { if: { temper: 'witty' }, text: ['Everybody gets what they gave me last year. Wrapped differently.'] },
    { if: { stage: 'child' }, text: ['Everyone! I made them all stones. Painted stones. Mine\'s got a face.'] },
    { if: { rift: true }, text: ['I\'ve made everyone a little light. Rift-tech. They glow when you shake them.'] },
  ]);
  lines('season.bday.special', [
    { text: ['...There is one. Wrapped twice, in the bottom drawer. I\'ve been saving it a long time.', '...Yes. For someone I\'ve never quite told how much they mean. It\'s a little thing. It isn\'t.'] },
    { if: { spouse: (s) => !!s }, text: ['...For {spouse}. A ring I had made, to match the one I lost on our wedding day. Don\'t say.'] },
    { if: { lost: (x) => !!x }, pri: 1, text: ['...One for {lost}. I wrap one every year. In case. Silly, isn\'t it.'] },
    { if: { temper: 'shy' }, text: ['...There\'s one. I don\'t know if I\'ll dare give it.'] },
    { if: { stage: 'child' }, text: ['...For my best friend. It\'s my best marble. The blue one. I\'m giving it away. I am.'] },
  ]);
  lines('season.bday.safe', [
    { text: ['Thank you. Not a word, mind. Not even a hint.', 'I knew you\'d keep it. That\'s why I told you.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. It\'s nice, somebody knowing.'] },
  ]);
  lines('season.bday.first', [
    { text: ['First. Yes. Before breakfast. Before I can think.', 'You\'re right. If I wait I\'ll put it back in the drawer for another year.'] },
    { if: { temper: ['proud', 'ornery'] }, text: ['I\'ll give it when I\'m ready. ...First, then. Fine.'] },
  ]);
  lines('season.bday.generous', [
    { text: ['It\'s only proper. You give on your birthday. It\'s how you know you\'re rich.', 'Oh, it\'s the best bit. Getting presents is nice. Giving them is better.'] },
    { if: { temper: 'witty' }, text: ['Generous? It\'s self-defence. If I give first, nobody can out-give me.'] },
    { if: { temper: 'shy' }, text: ['...I just like seeing them smile.'] },
  ]);
  lines('season.bday.socks', [
    { text: ['It is not socks! ...Two of them are socks.', 'Socks are a perfectly good present. Warm feet are a gift.'] },
    { if: { pastime: 'knitting' }, pri: 1, text: ['They\'re ALL socks. I knit. What did you expect?'] },
    { if: { stage: 'child' }, text: ['I\'m not giving socks! Socks are BORING. ...Except stripy ones.'] },
  ]);
  lines('season.bday.wizbday', [
    { text: ['Then have one of mine! You can share. I\'ve plenty.', 'You poor thing! A wizard with no birthday. That won\'t do.'] },
    { if: { temper: 'witty' }, text: ['Lost count? Or stopped counting on purpose? I know your sort.'] },
    { if: { stage: 'child' }, text: ['You can have my birthday! Half of it. The cake half.'] },
  ]);
  lines('season.bday.shared', [
    { text: ['Then happy birthday to us both! You\'ll need to give me a present now. That\'s the rule.', 'Ha! Happy birthday, wizard. You\'re very old today.'] },
    { if: { temper: 'shy' }, text: ['...Happy birthday, then. To you. Too.'] },
    { if: { stage: 'child' }, text: ['Happy birthday WIZARD! Now you have to give ME a present! That\'s how it works!'] },
  ]);
  lines('season.bday.wizsocks', [
    { text: ['...Well, it was going to be socks. Now I\'ll have to think of something.', 'Not socks. A hat-pin. To keep that thing on in the wind.'] },
    { if: { pastime: 'knitting' }, pri: 1, text: ['Too late. They\'re grey. They\'re very long. They\'re very wizardly.'] },
  ]);

  // --- Lantern Night -------------------------------------------------------------------------
  addThread({
    id: 'season.lantern', cool: 4, weight: 1.3,
    label: 'Your lantern',
    when: (F) => F.festToday === 'lantern' || (F.nextFest === 'lantern' && F.nextFestIn <= 2),
    rel: (F) => (F.festToday === 'lantern' ? 2 : 1.3),
    open: { ask: 'season.lantern.open' },
    beats: {
      start: { line: 'season.lantern.start', go: [
        { ap: 'ask', say: 'And what will you wish for, when you let it go?', to: 'wish', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'Mine will have a firework in it. Cheating, I know.', to: 'cheat' },
        { ap: 'ask', say: 'Who taught you to make them?', to: 'made' },
      ] },
      wish: { line: 'season.lantern.wish', fx: { confide: { k: 'season.lanternwish', t: '{Name} told you their lantern wish', secret: true } }, go: [
        { ap: 'warm', say: 'Then I hope it flies higher than any of them.', to: 'high' },
        { ap: 'listen', say: '*You wait. There\'s more behind it.*', label: 'Wait', to: 'why', need: { open: 2 }, soft: true },
      ] },
      why: { line: 'season.lantern.why', fx: { trust: 0.04 }, go: [
        { ap: 'comfort', say: 'Wishes like that have a way of finding the road.', to: 'road' },
        { ap: 'warm', say: 'I\'ll watch for yours. I\'ll know it.', to: 'watch' },
      ] },
      road: { line: 'season.lantern.road', fx: { trust: 0.02 }, end: true },
      watch: { line: 'season.lantern.watch', fx: { fond: 0.03, remember: 'The wizard said he\'d watch for my lantern.', rv: 1 }, end: true },
      high: { line: 'season.lantern.high', fx: { fond: 0.02 }, end: true },
      cheat: { line: 'season.lantern.cheat', go: [
        { ap: 'jest', say: 'A small one. It\'ll go off at the top. Pop.', to: 'pop' },
        { ap: 'ask', say: 'What\'s on yours?', to: 'start2' },
      ] },
      start2: { line: 'season.lantern.painted', go: [
        { ap: 'warm', say: 'I\'ll look for it in the sky.', to: 'high' },
        { ap: 'ask', say: 'And the wish to go with it?', to: 'wish', need: { open: 1 }, soft: true },
      ] },
      pop: { line: 'season.lantern.pop', fx: { joke: { k: 'season.lanternpop', t: 'The wizard\'s lantern has a firework in it. Pop.' } }, end: true },
      made: { line: 'season.lantern.made', go: [
        { ap: 'ask', say: 'And what\'s on yours this year?', to: 'start2' },
        { ap: 'warm', say: 'Then they\'d be proud of yours.', to: 'end' },
      ] },
    },
    end: { fond: 0.02 },
  });
  lines('season.lantern.open', [
    { text: ['Have you made your lantern yet, {name}?', 'What\'s on your lantern this year, {name}?'] },
    { if: { festToday: 'lantern' }, text: ['Tonight\'s the night, {name}. Is your lantern ready?'] },
  ]);
  lines('season.lantern.start', [
    { text: ['Nearly. The paste\'s still wet. I\'ve painted a moon on it, and a hare under the moon.', 'Made it this morning. It\'s lopsided. They all fly, lopsided or not.'] },
    { if: { temper: 'ornery' }, text: ['I make the same one every year. A plain one. It flies the same as the fancy ones.'] },
    { if: { temper: 'shy' }, text: ['...It\'s just a small one. With a star on it.'] },
    { if: { temper: 'cheerful' }, text: ['I\'ve made THREE! One for me, one for luck and one in case I drop one.'] },
    { if: { temper: 'dreamy' }, text: ['I painted the valley on it. All of it. So it can see where it came from.'] },
    { if: { temper: 'witty' }, text: ['I\'ve painted my own face on it. So the sky knows who to blame.'] },
    { if: { temper: 'proud' }, text: ['Mine\'s the biggest in the lane. Gold paper. It took two days.'] },
    { if: { temper: 'gloomy' }, text: ['I made one. It\'ll probably catch fire. They usually do, mine.'] },
    { if: { temper: 'curious' }, text: ['I\'ve worked out why they fly. The hot air\'s lighter. I want to make one go higher.'] },
    { if: { stage: 'child' }, text: ['I made mine ALL BY MYSELF. It\'s got a dragon on it. Your dragon!'] },
    { if: { stage: 'elder' }, text: ['I\'ve made one every year since I could hold a brush. This is the best one. I say that every year.'] },
    { if: { rift: true }, text: ['A paper light with a candle in it. No battery. No app. I keep checking it\'s real.'] },
    { if: { pastime: 'painting' }, pri: 1, text: ['I\'ve painted it all over. Birds and leaves. It seems a shame to let it go.'] },
  ]);
  lines('season.lantern.wish', [
    { text: ['...That everyone I love is here next year. All of them. That\'s all.', '...That I\'m brave, this year. About a thing. Don\'t ask what thing.'] },
    { if: { wish: (w) => !!w }, text: ['...Honestly? {WishText}. Small, isn\'t it. It\'s what I want.'] },
    { if: { dream: (d) => !!d }, pri: 1, text: ['...That one day I\'ll {dreamText}. I wish it every year. It\'s getting closer.'] },
    { if: { lost: (x) => !!x }, pri: 2, text: ['...That it finds {lost}. Wherever they are. That they look up and see it.'] },
    { if: { spouse: (s) => !!s }, text: ['...That {spouse} and I grow old together. Older. Very old.'] },
    { if: { kid: (k) => !!k }, text: ['...That {kid} has a good life. Better than mine. Not that mine\'s bad.'] },
    { if: { stage: 'child' }, text: ['...A puppy. Don\'t tell. If you say it out loud it doesn\'t work.'] },
    { if: { lonely: true }, pri: 1, text: ['...That somebody notices me. Just a bit.'] },
  ]);
  lines('season.lantern.why', [
    { text: ['...Because some days I\'m not sure it\'ll come true. So I send it up, where it can\'t be lost.', 'Because I\'ve wished it a long time. Saying it to you makes it feel nearer.'] },
    { if: { lost: (x) => !!x }, pri: 2, text: ['Because the sky\'s the only thing we both have. Me here, {lost} wherever. Same sky.'] },
    { if: { stage: 'elder' }, text: ['Because I haven\'t so many lanterns left, and I want this one to count.'] },
    { if: { rift: true }, text: ['Because back home the sky was full of ads. This is the first sky I\'ve trusted with anything.'] },
  ]);
  lines('season.lantern.road', [
    { text: ['...I hope so. I really do.', 'Finding the road. I like that. I\'ll think of it tonight.'] },
    { if: { temper: 'gloomy' }, text: ['...You make it sound possible. Thank you.'] },
  ]);
  lines('season.lantern.watch', [
    { text: ['You\'ll know it. It\'ll be the one going up a bit crooked.', 'Will you? Then I\'ll let it go near you.'] },
    { if: { stage: 'child' }, text: ['It\'s the one with the dragon! Wave at it! Wave at my dragon!'] },
  ]);
  lines('season.lantern.high', [
    { text: ['Higher than the party tree! Higher than the hill!', 'That\'s a nice thing to say. I\'ll tell it you said so.'] },
    { if: { temper: 'shy' }, text: ['...Thank you.'] },
    { if: { temper: 'ornery' }, text: ['As long as it doesn\'t come down on the haystack again.'] },
  ]);
  lines('season.lantern.cheat', [
    { text: ['A firework! That\'s cheating! ...Can I watch?', 'You can\'t! It\'s a quiet night! ...What colour?'] },
    { if: { temper: 'ornery' }, text: ['Of course it does. Wizards. Can\'t leave anything alone.'] },
    { if: { stage: 'child' }, text: ['Put one in mine! Please! A little one!'] },
  ]);
  lines('season.lantern.pop', [
    { text: ['Pop! Ha! The whole field will jump.', 'I\'ll be watching for the pop now. I\'ll miss my own lantern.'] },
    { if: { stage: 'child' }, text: ['POP! I\'m going to stand right under it!'] },
  ]);
  lines('season.lantern.painted', [
    { text: ['A moon and a hare. The hare\'s looking at the moon. Like it\'s waiting.', 'A heron. It came out like a teapot. It\'ll fly the same.'] },
    { if: { stage: 'child' }, text: ['A dragon! Your dragon! It\'s green because I ran out of red.'] },
    { if: { temper: 'dreamy' }, text: ['A door. Open. I don\'t know why. It felt right.'] },
    { if: { rift: true }, text: ['A city. My city. Small and lit up. Sending it home.'] },
  ]);
  lines('season.lantern.made', [
    { text: ['My mother. She folded them faster than you could watch. I still can\'t.', 'Everybody learns as a child. You fold the paper like this, and like this, and then you ruin it.'] },
    { if: { parent: (p) => !!p }, text: ['{Parent} did. Sat me on the table and folded with me till I got it.'] },
    { if: { rift: true }, text: ['Nobody. I watched the children and copied. A little one corrected my folds. Very strictly.'] },
    { if: { stage: 'child' }, text: ['My mum. She did the hard bits. I did the painting. And the paste. There was a lot of paste.'] },
  ]);

  // --- The May --------------------------------------------------------------------------------
  addThread({
    id: 'season.may', cool: 4, weight: 1.1,
    label: (F) => `The ${F.mayTitle || 'Queen'} of the May`,
    when: (F) => (F.season === 'spring' && F.stage !== 'child') || F.nextFest === 'mayday' && F.nextFestIn <= 2 || F.festToday === 'mayday' || (F.season === 'spring' && F.band === 'youth'),
    rel: (F) => (F.festToday === 'mayday' || F.mayCrowned ? 1.5 : 1),
    open: { ask: 'season.may.open' },
    beats: {
      start: { line: 'season.may.start', go: [
        { ap: 'ask', say: 'Were you ever crowned yourself?', to: 'self' },
        { ap: 'jest', say: 'I was King of the May once. The hawthorn gave me hay fever.', to: 'hayfever' },
        { ap: 'ask', say: 'Who would you crown, if you had the choosing?', to: 'choose' },
      ] },
      self: { line: 'season.may.self', go: [
        { ap: 'ask', say: 'What was it like?', to: 'like', need: { if: { mayCrowned: (x) => !!x } } },
        { ap: 'warm', say: 'There\'s time yet. The May\'s not fussy.', to: 'still', need: { if: { mayCrowned: null } } },
        { ap: 'jest', say: 'I\'d have crowned you. Twice. Once for each ear.', to: 'ears' },
      ] },
      like: { line: 'season.may.like', fx: { remember: 'Told the wizard about the day I was crowned.', rv: 1, fond: 0.02 }, end: true },
      still: { line: 'season.may.still', fx: { fond: 0.02 }, end: true },
      ears: { line: 'season.may.ears', end: true },
      hayfever: { line: 'season.may.hayfever', go: [
        { ap: 'tale', say: 'I sneezed the crown clean off, into the duck pond.', to: 'pond' },
        { ap: 'warm', say: 'It\'s an honour, all the same. Even sneezing.', to: 'end' },
      ] },
      pond: { line: 'season.may.pond', fx: { joke: { k: 'season.maypond', t: 'The wizard was King of the May once, and sneezed the crown into the duck pond.' } }, end: true },
      choose: { line: 'season.may.choose', go: [
        { ap: 'ask', say: 'Why them?', to: 'whythem' },
        { ap: 'jest', say: 'Not me, then? I\'m hurt.', to: 'notme' },
      ] },
      whythem: { line: 'season.may.whythem', fx: { trust: 0.02 }, end: true },
      notme: { line: 'season.may.notme', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('season.may.open', [
    { text: ['Who\'ll be crowned at the May, do you think, {name}?', 'Tell me about the Queen of the May, {name}. I\'m behind the times.'] },
    { if: { mayQueen: (q) => !!q }, text: ['{MayQueen} was crowned {mayTitle} of the May, {name}. Did you see?'] },
    { if: { mayCrowned: (x) => !!x }, pri: 1, text: ['I hear you were crowned at the May once, {name}. Is it true?'] },
  ]);
  lines('season.may.start', [
    { text: ['One of the young ones. They choose by the ribbons, or by who\'s blushing most.', 'Whoever\'s the bonniest that morning. It\'s never who you\'d guess.'] },
    { if: { mayQueen: (q) => !!q }, text: ['{MayQueen}! In a hawthorn crown! I\'ve never seen anyone go so pink.', '{MayQueen}. A good choice. Danced the first dance without a single wrong step.'] },
    { if: { mayCrowned: (x) => !!x }, pri: 1, text: ['It\'s true. {MayCrowned} of the May! Flowers in my hair and everyone looking. I\'ll never forget it.'] },
    { if: { temper: 'ornery' }, text: ['It\'s always some youngster who can\'t dance. Picking by the ribbons. Ridiculous.'] },
    { if: { temper: 'dreamy' }, text: ['Whoever it is, they\'ll feel like spring itself for a day. Imagine.'] },
    { if: { temper: 'witty' }, text: ['They crown whoever\'s standing nearest when the garland\'s finished. Very scientific.'] },
    { if: { temper: 'proud' }, text: ['My family\'s had three Queens of the May. Three! I like to mention it.'] },
    { if: { temper: 'shy' }, text: ['...I hope it\'s not me. I\'d die. ...I\'d like it to be me, a bit.'] },
    { if: { band: 'youth' }, pri: 1, text: ['It could be me this year. It could! Or my friend. Probably my friend.'] },
    { if: { stage: 'elder' }, text: ['I\'ve seen sixty of them crowned. Every one of them thought it was the best day of their life.'] },
    { if: { rift: true }, text: ['You crown a teenager with flowers and they lead the dance? Back home we\'d elect a brand.'] },
  ]);
  lines('season.may.self', [
    { text: ['Me? No. Never. I danced on the edges.', 'Not me. I was always holding somebody else\'s ribbon.'] },
    { if: { mayCrowned: (x) => !!x }, text: ['I was! {MayCrowned} of the May. They still call me it, some of the old ones.'] },
    { if: { temper: 'proud', mayCrowned: null }, text: ['I should have been. Everyone said so. The ribbons were rigged.'] },
    { if: { temper: 'gloomy', mayCrowned: null }, text: ['No. Nobody picks me for things.'] },
    { if: { temper: 'witty', mayCrowned: null }, text: ['No. I was too busy tying the maypole ribbons in knots.'] },
  ]);
  lines('season.may.like', [
    { text: ['Like being the sun for a day. Everyone turns to look at you.', 'Terrifying. Wonderful. My knees shook all through the first dance.'] },
    { if: { temper: 'proud' }, text: ['Exactly as it should be. I wore the crown very well.'] },
    { if: { temper: 'shy' }, text: ['...I hid behind the garland most of the day. But I kept the flowers. Pressed.'] },
    { if: { stage: 'elder' }, text: ['A long time ago. I can still smell the hawthorn. Some things you keep.'] },
  ]);
  lines('season.may.still', [
    { text: ['Ha! At my age? The May would have to be very generous.', 'Not fussy! Then I\'ll stand at the front this year.'] },
    { if: { stage: 'elder' }, text: ['You\'re kind. I\'ll settle for watching the young ones blush.'] },
    { if: { band: 'youth' }, pri: 1, text: ['You think? This year? ...I\'ll wear my best shirt. Just in case.'] },
  ]);
  lines('season.may.ears', [
    { text: ['Ha! A crown for each ear. That\'s a lot of hawthorn.', 'Twice! I\'d look like a hedge.'] },
    { if: { temper: 'shy' }, text: ['...*goes very pink about the ears*'] },
  ]);
  lines('season.may.hayfever', [
    { text: ['You were never King of the May!', 'Hay fever! Ha! What happened?'] },
    { if: { temper: 'witty' }, text: ['A sneezing king. Very regal. Did they keep the crown on with string?'] },
    { if: { stage: 'child' }, text: ['You were a KING? Of the MAY? Did you have a sword?'] },
  ]);
  lines('season.may.pond', [
    { text: ['Into the pond! Ha! Did the ducks wear it?', 'Oh, that\'s wonderful. I\'m telling everyone.'] },
    { if: { stage: 'child' }, text: ['A DUCK was King of the May! Ha! Duck King!'] },
  ]);
  lines('season.may.choose', [
    { text: ['Oh, the shyest one. The one who\'d never think it could be them.', 'Somebody who needs a good day. There\'s always somebody.'] },
    { if: { friend: (f) => !!f }, text: ['{Friend}. Don\'t laugh. {Friend} would look a picture in hawthorn.'] },
    { if: { kid: (k) => !!k }, text: ['{Kid}. Course I would. What parent wouldn\'t?'] },
    { if: { spouse: (s) => !!s }, text: ['{Spouse}. Still. After all these years. I\'d crown {spouse} every May.'] },
    { if: { temper: 'witty' }, text: ['The goat. It\'s eaten more of the garland than anyone else. It\'s earned it.'] },
  ]);
  lines('season.may.whythem', [
    { text: ['Because they\'d never ask. The ones who\'d never ask are the ones to crown.', 'Because they light up when nobody\'s looking. I\'d like everyone to see it.'] },
    { if: { temper: 'dreamy' }, text: ['Because they\'re a bit like spring already. Quiet and then suddenly everywhere.'] },
  ]);
  lines('season.may.notme', [
    { text: ['You! Ha! You\'d need a crown the size of a cartwheel.', 'You\'ve had your turn. In the pond.'] },
    { if: { stage: 'child' }, text: ['You can be the King of the Fireworks instead! That\'s better!'] },
  ]);

  // --- Yule ----------------------------------------------------------------------------------
  addThread({
    id: 'season.yule', cool: 3, weight: 1.2,
    label: 'Yule',
    when: (F) => F.season === 'winter' || F.nextFest === 'yule' && F.nextFestIn <= 3,
    rel: (F) => (F.festToday === 'yule' || F.nextFest === 'yule' ? 1.7 : 1),
    open: { warm: 'season.yule.open' },
    beats: {
      start: { line: 'season.yule.start', go: [
        { ap: 'ask', say: 'What are you making for Yule?', to: 'making' },
        { ap: 'ask', say: 'Do you sing, at the bonfire?', to: 'carols' },
        { ap: 'jest', say: 'Will there be mulled ale, or shall I bring my own?', to: 'ale' },
      ] },
      making: { line: 'season.yule.making', go: [
        { ap: 'ask', say: 'And who\'s it for? You can tell me.', to: 'forwhom', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'Whoever gets it is lucky.', to: 'lucky' },
      ] },
      forwhom: { line: 'season.yule.forwhom', fx: { confide: { k: 'season.yulegift', t: '{Name} is making a Yule present in secret', secret: true } }, go: [
        { ap: 'warm', say: 'My lips are sealed. With holly.', to: 'sealed' },
        { ap: 'jest', say: 'And what am I getting?', to: 'me' },
      ] },
      sealed: { line: 'season.yule.sealed', fx: { trust: 0.03, promise: { k: 'secret.season.yule', t: 'You promised to keep their Yule present a secret', days: 6 } }, end: true },
      me: { line: 'season.yule.me', fx: { fond: 0.02 }, end: true },
      lucky: { line: 'season.yule.lucky', end: true },
      carols: { line: 'season.yule.carols', go: [
        { ap: 'jest', say: 'I\'ll sing bass. Very low. Very loud.', to: 'bass' },
        { ap: 'share', say: 'I learned a carol from the elves once. It made the snow stop to listen.', to: 'elves' },
      ] },
      bass: { line: 'season.yule.bass', fx: { joke: { k: 'season.bass', t: 'The wizard sings bass at Yule. Very low. Very loud.' } }, end: true },
      elves: { line: 'season.yule.elves', go: [
        { ap: 'tale', say: '*You hum a few bars. The lane goes very quiet.*', label: 'Hum a few bars', to: 'hum' },
        { ap: 'warm', say: 'Perhaps I\'ll sing it at the bonfire. If you\'ll sing with me.', to: 'together' },
      ] },
      hum: { line: 'season.yule.hum', fx: { fond: 0.03, feel: 'liked', feelX: 'the wizard\'s elvish carol' }, end: true },
      together: { line: 'season.yule.together', fx: { fond: 0.02, promise: { k: 'season.carol', t: 'You said you\'d sing the elvish carol at the Yule bonfire', days: 4 } }, end: true },
      ale: { line: 'season.yule.ale', go: [
        { ap: 'ask', say: 'And who makes the best mulled ale in the valley?', to: 'brewer' },
        { ap: 'jest', say: 'I\'ll bring my own anyway. In my hat. For emergencies.', to: 'hatale' },
      ] },
      brewer: { line: 'season.yule.brewer', fx: { learn: ['season.ale', '{Name} has firm views on who makes the best mulled ale'] }, end: true },
      hatale: { line: 'season.yule.hatale', fx: { joke: { k: 'season.hatale', t: 'The wizard keeps emergency ale in his hat.' } }, end: true },
    },
    end: { fond: 0.015 },
  });
  // the carol promise: kept if Yule's party happened while it was open
  addPromiseCheck('season.carol', (v, p) => ((Game.lastParty ?? -9) >= p.d && occasionOn(Game.lastParty) === 'yule' ? 'kept' : null));
  lines('season.yule.open', [
    { text: ['Yule\'s in the air, {name}. Can you smell it?', 'Are you ready for Yule, {name}?'] },
    { if: { festToday: 'yule' }, text: ['Happy Yule, {name}! There\'s holly on every door.'] },
    { if: { stage: 'child' }, text: ['Have you been good this year, {name}? Yule\'s coming.'] },
  ]);
  lines('season.yule.start', [
    { text: ['Nearly! The holly\'s up and the pudding\'s made. The pudding\'s the important bit.', 'Ready? I\'ve been ready since the first frost.'] },
    { if: { festToday: 'yule' }, text: ['It\'s Yule! The bonfire tonight, and carols, and mulled ale. Best night of the year.'] },
    { if: { temper: 'ornery' }, text: ['Yule. Everyone singing in the snow and treading slush through the house.'] },
    { if: { temper: 'cheerful' }, text: ['I love Yule! I love it! I\'ve wrapped everything twice.'] },
    { if: { temper: 'shy' }, text: ['...I like Yule. Everyone\'s kinder. It\'s easier to talk to people.'] },
    { if: { temper: 'dreamy' }, text: ['The longest night, and then the year turns back to the light. I always sit up for it.'] },
    { if: { temper: 'witty' }, text: ['Yule: when we celebrate the dark by setting fire to things. Very sensible.'] },
    { if: { temper: 'proud' }, text: ['My Yule pudding has won no fewer than four arguments. It\'s that good.'] },
    { if: { temper: 'gloomy' }, text: ['Yule. Lots of cheer. I find it a bit much. ...The bonfire\'s nice.'] },
    { if: { temper: 'curious' }, text: ['Why holly? Why a log? Nobody here can tell me why we do any of it.'] },
    { if: { stage: 'child' }, text: ['YULE! Presents! The pudding with a coin in it! I\'m going to find the coin!'] },
    { if: { stage: 'elder' }, text: ['Another Yule. I like to count them. I\'ve a lot to count.'] },
    { if: { rift: true }, text: ['In Neverdark there was a holiday called Upgrade Day. This is better. Nobody upgrades.'] },
    { if: { job: 'baker' }, pri: 1, text: ['Yule baking. Mince pies by the hundred. I\'ve dreamt in mince.'] },
    { if: { job: 'brewer' }, pri: 1, text: ['The mulled ale\'s steeping. Cloves, orange peel and a secret. I\'ll never tell the secret.'] },
    { if: { jarsWord: 'full' }, text: ['Shelves full, woodpile high, and Yule coming. I could purr.'] },
    { if: { jarsWord: 'bare' }, pri: 1, text: ['Yule, and the shelves half bare. We\'ll manage. We always manage at Yule.'] },
  ]);
  lines('season.yule.making', [
    { text: ['Presents. Small ones. Everybody gets something, even if it\'s a pine cone with a bow on.', 'A pudding the size of a cartwheel. And a few presents. Mostly the pudding.'] },
    { if: { pastime: (p) => !!p, madeMany: (m) => !!m }, pri: 1, text: ['{MadeMany}. Everyone on the lane is getting one. Some are getting two by accident.'] },
    { if: { pastime: 'knitting' }, pri: 2, text: ['Scarves. Everyone\'s getting a scarf. The lane will be very warm and very stripy.'] },
    { if: { pastime: 'carving' }, pri: 2, text: ['Little animals. A badger for one, a hare for another. The heron\'s for nobody. It went wrong.'] },
    { if: { stage: 'child' }, text: ['A present for Mum! It\'s a box. With things in. I won\'t say what things.'] },
    { if: { temper: 'ornery' }, text: ['Nothing. Bought things. ...Fine, a few socks.'] },
    { if: { rift: true }, text: ['Little lights. Rift-tech, but gentle. They glow when you hold them. Like a heartbeat.'] },
  ]);
  lines('season.yule.forwhom', [
    { text: ['...There\'s one that\'s not like the others. For someone I\'ve been meaning to thank.', '...A proper present. For someone who doesn\'t know I\'ve noticed them.'] },
    { if: { spouse: (s) => !!s }, text: ['...For {spouse}. Something I\'ve been making since autumn. A box with our names carved on it.'] },
    { if: { rival: (r) => !!r }, pri: 1, text: ['...For {rival}. Don\'t look like that. It\'s Yule. Even {rival} gets something.'] },
    { if: { stage: 'child' }, text: ['...For YOU. Oops. I said it. Pretend I didn\'t.'] },
  ]);
  lines('season.yule.sealed', [
    { text: ['With holly! Ha! That\'ll sting.', 'Thank you. I can always tell, with you.'] },
    { if: { stage: 'child' }, text: ['Cross your heart? With holly? Ow.'] },
  ]);
  lines('season.yule.me', [
    { text: ['You? A lump of coal, for asking.', 'Wait and see. Wizards have to wait like everybody else.'] },
    { if: { stage: 'child' }, text: ['It\'s a SECRET. ...It\'s a stone. It\'s a nice stone.'] },
    { if: { pastime: 'knitting' }, pri: 1, text: ['A hat-cosy. For your hat. Don\'t ask. You\'ll see.'] },
  ]);
  lines('season.yule.lucky', [
    { text: ['That\'s nice of you. I\'ll tell them you said so.', 'Lucky, or polite. We\'ll see which.'] },
    { if: { temper: 'shy' }, text: ['...You think so? Thank you.'] },
  ]);
  lines('season.yule.carols', [
    { text: ['Course! "Yule-tide fire and frosty air." Everyone knows it. Everyone sings it wrong.', 'I sing, loud and badly. That\'s how carols are meant to be sung.'] },
    { if: { temper: 'shy' }, text: ['...I mouth the words. Nobody can tell in a crowd.'] },
    { if: { temper: 'ornery' }, text: ['I sing the right words. Everyone else makes them up.'] },
    { if: { temper: 'proud' }, text: ['I lead the second verse. Nobody else knows the second verse.'] },
    { if: { likes: 'music' }, pri: 1, text: ['Every carol. Every verse. I start them and the others have to catch up.'] },
    { if: { stage: 'child' }, text: ['"Deck the hole with boughs of holly!" I know ALL the words! Most!'] },
    { if: { rift: true }, text: ['I\'m learning them. The songs here don\'t loop. They just end. I like that.'] },
  ]);
  lines('season.yule.bass', [
    { text: ['Ha! Low and loud. The snow will fall off the roofs.', 'Then we\'ll hear you in Bree.'] },
    { if: { temper: 'witty' }, text: ['Very low, very loud, and very slightly out of tune. Perfect.'] },
    { if: { stage: 'child' }, text: ['Do it now! Do the low voice! ...Ha! You sound like a cow!'] },
  ]);
  lines('season.yule.elves', [
    { text: ['The snow stopped? To listen?', 'An elvish carol! Sing it! Go on!'] },
    { if: { temper: 'dreamy' }, text: ['Oh. I\'d give anything to hear that.'] },
    { if: { temper: 'ornery' }, text: ['Snow doesn\'t listen. ...Does it?'] },
  ]);
  lines('season.yule.hum', [
    { text: ['...Oh. Oh, that\'s lovely. Don\'t stop.', '...I\'ve got goosebumps. Look. All up my arm.'] },
    { if: { temper: 'ornery' }, text: ['...Hmph. Not bad. ...Not bad at all, actually.'] },
    { if: { stage: 'child' }, text: ['...Again. Please. The quiet bit again.'] },
  ]);
  lines('season.yule.together', [
    { text: ['With you? At the bonfire? I don\'t know the words!', 'I\'ll try. You\'ll have to go slow.'] },
    { if: { temper: 'shy' }, text: ['...In front of everyone? ...All right. If you go first.'] },
    { if: { stage: 'child' }, text: ['YES! I\'ll learn it! I\'ll learn it in elf!'] },
  ]);
  lines('season.yule.ale', [
    { text: ['There\'ll be mulled ale enough to float a boat. Bring your own cup.', 'Bring your own? You\'d offend the brewer. Mortally.'] },
    { if: { job: 'brewer' }, pri: 1, text: ['Bring your own! I\'ll pretend I didn\'t hear that.'] },
    { if: { temper: 'witty' }, text: ['Bring your own and we\'ll compare. Then drink both.'] },
    { if: { stage: 'child' }, text: ['I\'m not allowed mulled ale. I\'m allowed mulled apple. It\'s the same but sadder.'] },
  ]);

  // --- More voices: tempers and stages for the shorter beats ------------------------------
  lines('season.yule.brewer', [
    { text: ['The brewer, of course. Though my gran\'s was better, and she\'d tell you so.', 'Whoever puts in the most cloves. I don\'t care who. Cloves.'] },
    { if: { job: 'brewer' }, text: ['Me. Next question.', 'You\'re looking at them. Don\'t tell the innkeeper I said so.'] },
    { if: { job: 'innkeeper' }, text: ['The Badger\'s, naturally. The brewer makes it, but I warm it properly.'] },
    { if: { temper: 'ornery' }, text: ['Nobody. They all put too much honey in. I make my own.'] },
    { if: { temper: 'proud' }, text: ['My family\'s recipe is the only one worth the name. The rest are warm puddles.'] },
    { if: { temper: 'witty' }, text: ['Whoever\'s pouring when I\'m holding out my cup.'] },
    { if: { stage: 'child' }, text: ['I don\'t know. I only get mulled apple. Mulled apple\'s best. Probably.'] },
    { if: { rift: true }, text: ['Hot beer with oranges in? I thought they were joking. They weren\'t. It\'s amazing.'] },
  ]);
  lines('season.yule.hatale', [
    { text: ['In your hat! Ha! That explains the hat.', 'Emergency ale. Is there an emergency hat for when the ale runs out?'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Mind it doesn\'t leak on the carols.'] },
    { if: { stage: 'child' }, text: ['Is there ale in your hat NOW? Can I look?'] },
    { if: { temper: 'witty' }, text: ['Wizards. Pockets full of fireworks, hats full of ale. No wonder you walk funny.'] },
  ]);
  lines('season.next.windmill', [
    { if: { temper: 'ornery' }, text: ['A windmill. Wonderful. Somebody\'ll lose an eye.'] },
    { if: { temper: 'shy' }, text: ['...I\'ll dance next to you. Nobody will look at me then.'] },
    { if: { temper: 'cheerful' }, text: ['Perfect! I dance like a duck in a puddle. We\'ll be a pair.'] },
    { if: { temper: 'proud' }, text: ['I\'ll show you how it\'s done properly. Watch my feet.'] },
    { if: { stage: 'elder' }, text: ['Ha! My dancing\'s more of a slow mill-wheel these days.'] },
  ]);
  lines('season.next.hat', [
    { if: { temper: 'cheerful' }, text: ['Oh, I\'d love that! I\'ll wear my good waistcoat!'] },
    { if: { temper: 'witty' }, text: ['Hat-holder to the wizard. I\'ll put it on my door.'] },
    { if: { temper: 'gloomy' }, text: ['...You mean it? ...All right. That\'s nice of you.'] },
    { if: { stage: 'child' }, text: ['Can I WEAR it? Just for a bit? I\'ll hold it really carefully after.'] },
  ]);
  lines('season.next.pace', [
    { if: { temper: 'cheerful' }, text: ['Ha! I\'ll pace myself straight to the pudding table.'] },
    { if: { temper: 'shy' }, text: ['...I always eat too fast when I\'m nervous. I\'ll try.'] },
    { if: { temper: 'gloomy' }, text: ['The pies always go before I get there anyway.'] },
    { if: { stage: 'elder' }, text: ['I\'ve been pacing myself at feasts for ninety years. I\'m very good at it. I eat everything.'] },
  ]);
  lines('season.next.hope', [
    { if: { temper: 'dreamy' }, text: ['It\'ll be like it and not like it. They always are. That\'s the magic.'] },
    { if: { temper: 'ornery' }, text: ['It had better be. I\'ve paid for my own pie.'] },
    { if: { temper: 'shy' }, text: ['...I hope so. I\'d like it to be.'] },
    { if: { stage: 'child' }, text: ['BETTER! Because I\'m bigger now. I can reach the table.'] },
  ]);
  lines('season.next.before', [
    { if: { temper: 'ornery' }, text: ['Properly. With none of this new nonsense. ...Some of the new nonsense is all right.'] },
    { if: { temper: 'cheerful' }, text: ['Same as here, only smaller and muddier! We loved it.'] },
    { if: { temper: 'shy' }, text: ['...Quietly. There weren\'t many of us.'] },
  ]);
  lines('season.next.newways', [
    { if: { temper: 'ornery' }, text: ['New ways. Hmph. The old ways were fine. ...Some new ones, maybe.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, yes! We\'ll have a new dance! I\'ll make it up myself!'] },
    { if: { temper: 'shy' }, text: ['...I\'d like that. Something that\'s ours, that I helped start.'] },
    { if: { rift: true }, text: ['New ways. Yes. Some of mine, some of theirs. A bit of neon in the hawthorn.'] },
  ]);
  lines('season.next.comforted', [
    { if: { temper: 'shy' }, text: ['...You think so? ...Then I will. Just one.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. They would. They\'d tread on everyone\'s toes, too.'] },
    { if: { stage: 'child' }, text: ['...She would. She loved dancing. I\'ll do her twirl.'] },
    { if: { rift: true }, text: ['...They would. They\'d want to see what a fiddle is. I\'ll dance for both of us.'] },
  ]);
  lines('season.next.toast', [
    { if: { temper: 'gloomy' }, text: ['...That\'s the nicest thing anyone\'s said to me in a long while.'] },
    { if: { stage: 'child' }, text: ['...I\'ll raise my mulled apple. That counts. Doesn\'t it?'] },
    { if: { temper: 'proud' }, text: ['...Thank you. That\'s very proper of you. Very proper indeed.'] },
  ]);
  lines('season.today.weight', [
    { if: { temper: 'cheerful' }, text: ['Halfway! I\'m pacing myself for the other half!'] },
    { if: { temper: 'gloomy' }, text: ['I\'ve not felt like eating. ...I might, later. The smell\'s getting to me.'] },
    { if: { stage: 'elder' }, text: ['At my age you eat your weight slowly. Over a whole day.'] },
    { if: { tipsy: true }, pri: 1, text: ['I\'ve drunk my own weight. Does that count? It feels like it counts.'] },
  ]);
  lines('season.today.scales', [
    { if: { temper: 'ornery' }, text: ['Weigh me and I\'ll weigh you. Hat and all.'] },
    { if: { temper: 'proud' }, text: ['Weigh away. I carry it well.'] },
    { if: { temper: 'shy' }, text: ['...Please don\'t. Everyone would look.'] },
  ]);
  lines('season.today.slow', [
    { if: { temper: 'ornery' }, text: ['Slow? He only knows fast and faster.'] },
    { if: { temper: 'shy' }, text: ['...A slow one. I could manage a slow one.'] },
    { if: { stage: 'elder' }, text: ['Slow suits me too. We\'ll have the floor to ourselves.'] },
  ]);
  lines('season.today.hundred', [
    { if: { temper: 'ornery' }, text: ['A hundred places and you keep coming back here. Says it all.'] },
    { if: { temper: 'shy' }, text: ['...Really? That many? I\'ve only ever had this one.'] },
    { if: { temper: 'dreamy' }, text: ['A hundred places. I\'d like to see just one of them. Then come home.'] },
    { if: { rift: true }, text: ['A hundred places! I\'ve had two. This one\'s winning.'] },
  ]);
  lines('season.today.here', [
    { if: { temper: 'ornery' }, text: ['Hmph. The people are the trouble. ...Mostly the good kind.'] },
    { if: { temper: 'cheerful' }, text: ['That\'s exactly it! Come on, then, there\'s cider.'] },
    { if: { stage: 'child' }, text: ['Here\'s the BEST. Everyone knows that.'] },
    { if: { rift: true }, text: ['...Yeah. Here\'s where the people are. I\'m starting to see it.'] },
  ]);
  lines('season.today.company', [
    { if: { temper: 'ornery' }, text: ['As few as I can manage. ...And whoever brings the pie.'] },
    { if: { temper: 'shy' }, text: ['...Whoever doesn\'t mind me sitting with them.'] },
    { if: { temper: 'witty' }, text: ['Whoever\'s nearest the pudding. Loyalties are fluid on feast days.'] },
    { if: { stage: 'elder' }, text: ['The old ones. Our end of the table. We\'ve sat together sixty years.'] },
    { if: { rift: true }, text: ['The other rift-folk, at first. Then whoever pulls me into the dancing.'] },
  ]);
  lines('season.today.means', [
    { if: { stage: 'child' }, pri: 1, text: ['It means staying up! And everyone\'s nice to you! And cake!', '...It means Mum and Dad laugh a lot. I like it when they laugh.'] },
    { if: { temper: 'ornery' }, text: ['It means a day off. ...And seeing everyone. Fine. It means that.'] },
    { if: { temper: 'shy' }, text: ['...It means I belong here. Even if I stand at the back.'] },
  ]);
  lines('season.today.carry', [
    { if: { stage: 'child' }, text: ['Carry me too! In your hat! I\'m small!'] },
    { if: { temper: 'shy' }, text: ['...Me too? Do you carry me too?'] },
    { if: { temper: 'gloomy' }, text: ['...It\'s nice to think somebody remembers.'] },
  ]);
  lines('season.party.bree', [
    { if: { temper: 'cheerful' }, text: ['Ha! I\'ll write the bit about the goat.'] },
    { if: { temper: 'shy' }, text: ['...Don\'t put me in it. Please.'] },
    { if: { stage: 'child' }, text: ['Put me in it! Put the bit where I fell off the bench!'] },
  ]);
  lines('season.party.elf', [
    { if: { temper: 'ornery' }, text: ['An elf. Serves it right, being under your feet.'] },
    { if: { temper: 'curious' }, text: ['What do elves feel like? To tread on, I mean. Squashy? Not squashy?'] },
    { if: { temper: 'shy' }, text: ['...I\'d be too frightened to dance near an elf.'] },
  ]);
  lines('season.party.limp', [
    { if: { stage: 'child' }, text: ['A whole HUNDRED YEARS? Poor elf!'] },
    { if: { temper: 'witty' }, text: ['A century! You must have trodden on it like a dropped anvil.'] },
    { if: { temper: 'ornery' }, text: ['Elves. Make a fuss about anything.'] },
  ]);
  lines('season.party.punch', [
    { if: { temper: 'ornery' }, text: ['It\'s my own natural glow, thank you very much.'] },
    { if: { temper: 'shy' }, text: ['...It\'s not! It\'s the dancing. ...And a bit of punch.'] },
    { if: { temper: 'witty' }, text: ['The punch? No, no. The punch has merely helped.'] },
  ]);
  lines('season.party.asked', [
    { if: { temper: 'witty' }, text: ['Right. If I come back married, I\'m blaming you.'] },
    { if: { temper: 'gloomy' }, text: ['...They\'ll say no. ...But I\'ll ask.'] },
    { if: { stage: 'child' }, text: ['...Fine. I\'ll ask her to show me the whistle. That\'s all.'] },
  ]);
  lines('season.party.safe', [
    { if: { temper: 'witty' }, text: ['Good. If it gets out, I know where you sleep. In a wagon.'] },
    { if: { stage: 'child' }, text: ['Cross your heart? ...Good.'] },
  ]);
  lines('season.fw.safe', [
    { if: { temper: 'shy' }, text: ['...I know. I\'ll stand nearer, next time.'] },
    { if: { temper: 'proud' }, text: ['I wasn\'t frightened. I said. But thank you.'] },
    { if: { stage: 'elder' }, text: ['Light and noise. Like being young again.'] },
  ]);
  lines('season.fw.flinch', [
    { if: { temper: 'ornery' }, text: ['Hmph. It should. I\'ve a temper.'] },
    { if: { temper: 'shy' }, text: ['...It didn\'t. Did it? ...It did a bit.'] },
    { if: { temper: 'proud' }, text: ['Naturally. Dragons know their betters.'] },
  ]);
  lines('season.fw.foryou', [
    { if: { temper: 'cheerful' }, text: ['For me! I\'ll tell everyone! The dragon was mine!'] },
    { if: { temper: 'gloomy' }, text: ['...Nobody\'s ever done anything just for me. Thank you.'] },
    { if: { temper: 'witty' }, text: ['Mine? Then I\'ll want it housetrained by Midsummer.'] },
    { if: { stage: 'elder' }, text: ['For an old hobbit. Well. Well, well. I\'ll keep that.'] },
  ]);
  lines('season.fw.firsthat', [
    { if: { temper: 'witty' }, text: ['A pond. And you call yourself a wizard.'] },
    { if: { temper: 'ornery' }, text: ['Practice, then. It shows. Mostly.'] },
    { if: { temper: 'dreamy' }, text: ['Even wizards start somewhere. In a pond. I like that.'] },
  ]);
  lines('season.fw.how', [
    { if: { temper: 'ornery' }, text: ['Owes you money. Typical. Nobody pays their debts any more.'] },
    { if: { temper: 'witty' }, text: ['So the dragon\'s a debt, paid in sparks. I knew there was a catch.'] },
    { if: { temper: 'shy' }, text: ['...I won\'t tell anyone. About the dwarf.'] },
  ]);
  lines('season.fw.never', [
    { if: { temper: 'ornery' }, text: ['Wizards never tell anything. That\'s why folk don\'t trust you.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! Fine. I like it better not knowing.'] },
    { if: { temper: 'dreamy' }, text: ['Don\'t tell. It\'s better as magic.'] },
  ]);
  lines('season.fwask.pie', [
    { if: { temper: 'shy' }, text: ['...I could save you a slice. A big one.'] },
    { if: { temper: 'witty' }, text: ['A firework for a slice. Cheapest show in the Shire.'] },
    { if: { temper: 'gloomy' }, text: ['The pies always go before I get there. ...I\'ll save one in my pocket.'] },
    { if: { temper: 'proud' }, text: ['You shall have a slice of mine. It is very well thought of.'] },
  ]);
  lines('season.fwask.loop', [
    { if: { temper: 'ornery' }, text: ['A loop. Fine. Two slices. It had better be a proper loop.', 'Hmph. Two slices. That\'s robbery. ...With a loop?'] },
    { if: { temper: 'shy' }, text: ['...Two slices. I\'ll bring them. And watch for the loop.'] },
    { if: { temper: 'gloomy' }, text: ['Two slices. All right. Something to look forward to.'] },
    { if: { temper: 'proud' }, text: ['Two slices, and a loop, and it had better be the finest loop seen in the Shire.'] },
  ]);
  lines('season.fwask.ship', [
    { if: { temper: 'ornery' }, text: ['A ship. Over the hill. Mind it doesn\'t sink in my garden.'] },
    { if: { temper: 'witty' }, text: ['A ship of fire. Where\'s it sailing? To the Badger, I hope.'] },
    { if: { temper: 'shy' }, text: ['...A ship. Oh. I\'d like to see that.'] },
  ]);
  lines('season.fwask.duck', [
    { if: { temper: 'ornery' }, text: ['A duck. Don\'t you dare. ...What colour duck?'] },
    { if: { temper: 'witty' }, text: ['A fire duck. Finally, a firework I can relate to.'] },
  ]);
  lines('season.fwask.promise', [
    { if: { temper: 'witty' }, text: ['A promise from a wizard. I\'ll frame it. In the sky.'] },
    { if: { temper: 'gloomy' }, text: ['...You promise? ...All right. I\'ll believe you. This once.'] },
    { if: { temper: 'proud' }, text: ['Good. Thistledown expects nothing less.'] },
    { if: { temper: 'dreamy' }, text: ['Then I\'ll lie in the grass and wait for it. Like waiting for a star.'] },
    { if: { stage: 'elder' }, text: ['Good. I\'d like to see the dragon once more. Once more, at least.'] },
  ]);
  lines('season.bday.safe', [
    { if: { temper: 'ornery' }, text: ['Good. If it gets out I\'ll know who.'] },
    { if: { temper: 'witty' }, text: ['A wizard who keeps secrets. That\'s a present in itself.'] },
    { if: { stage: 'child' }, text: ['Cross your heart? Cross it properly.'] },
  ]);
  lines('season.bday.first', [
    { if: { temper: 'shy' }, text: ['...First. Before I lose my nerve. Yes.'] },
    { if: { temper: 'gloomy' }, text: ['...They might not like it. ...I\'ll give it first anyway.'] },
  ]);
  lines('season.bday.generous', [
    { if: { temper: 'ornery' }, text: ['Generous nothing. It\'s the custom. I just follow it to the letter.'] },
    { if: { temper: 'proud' }, text: ['My family has always given well. It\'s a point of honour.'] },
    { if: { stage: 'child' }, text: ['I like giving! Mostly. Except the blue marble.'] },
  ]);
  lines('season.bday.wizbday', [
    { if: { temper: 'ornery' }, text: ['Owed a few? Then pay for your own cake.'] },
    { if: { temper: 'shy' }, text: ['...You could have some of mine. If you wanted.'] },
    { if: { temper: 'dreamy' }, text: ['Wizards must have so many birthdays they run together. Like rivers.'] },
  ]);
  lines('season.bday.shared', [
    { if: { temper: 'ornery' }, text: ['Shared. Fine. You\'re doing the washing up.'] },
    { if: { temper: 'proud' }, text: ['It\'s an honour to share it. For you, I mean.'] },
  ]);
  lines('season.bday.wizsocks', [
    { if: { temper: 'ornery' }, text: ['You\'ll get socks and like them.'] },
    { if: { temper: 'witty' }, text: ['Not socks. A sock. Singular. For your hat.'] },
  ]);
  lines('season.lantern.road', [
    { if: { stage: 'child' }, text: ['Will it find them? Really? Even far away?'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Wishes don\'t know the road. ...Mine might.'] },
  ]);
  lines('season.lantern.watch', [
    { if: { temper: 'shy' }, text: ['...I\'ll let it go near you, then. So you can see.'] },
    { if: { temper: 'ornery' }, text: ['You won\'t know it. ...It\'s got a red rim. Just so you know.'] },
    { if: { temper: 'dreamy' }, text: ['Then I\'ll watch yours, and you watch mine.'] },
  ]);
  lines('season.lantern.high', [
    { if: { temper: 'cheerful' }, text: ['Higher than the moon! I\'ll put an extra candle in.'] },
    { if: { stage: 'child' }, text: ['Higher than YOUR hat! Higher than EVERYTHING!'] },
    { if: { temper: 'dreamy' }, text: ['Higher than any of them. Up where nobody can lose it.'] },
  ]);
  lines('season.lantern.cheat', [
    { if: { temper: 'witty' }, text: ['A firework in a lantern. You\'ve taken the one quiet night of the year and added a bang.'] },
    { if: { temper: 'shy' }, text: ['...Won\'t it frighten the others? ...Can I stand near it?'] },
    { if: { rift: true }, text: ['A lantern with a payload. Now you\'re speaking my language.'] },
  ]);
  lines('season.lantern.pop', [
    { if: { temper: 'ornery' }, text: ['Pop. Wonderful. The cows will love that.'] },
    { if: { temper: 'cheerful' }, text: ['Pop! Ha! I\'ll cheer when it goes!'] },
  ]);
  lines('season.lantern.painted', [
    { if: { temper: 'ornery' }, text: ['Nothing. Plain paper. It flies just as well.'] },
    { if: { temper: 'shy' }, text: ['...Just a star. A little one.'] },
    { if: { temper: 'witty' }, text: ['A badger in a waistcoat. Don\'t ask. It was late.'] },
  ]);
  lines('season.may.like', [
    { if: { temper: 'cheerful' }, text: ['The best day of my life! Well, one of the best twelve.'] },
    { if: { temper: 'witty' }, text: ['Itchy. Hawthorn\'s very itchy. Glorious, but itchy.'] },
    { if: { temper: 'gloomy' }, text: ['Lovely. For a day. Then it\'s just a memory, and you\'re you again.'] },
  ]);
  lines('season.may.still', [
    { if: { temper: 'shy' }, text: ['...Oh, I couldn\'t. ...Could I?'] },
    { if: { temper: 'ornery' }, text: ['Me? In flowers? I\'d sooner wear the maypole.'] },
    { if: { temper: 'gloomy' }, text: ['...Maybe. Somebody has to be picked last.'] },
  ]);
  lines('season.may.ears', [
    { if: { temper: 'ornery' }, text: ['Leave my ears out of it.'] },
    { if: { temper: 'witty' }, text: ['One for each ear. Then I\'d be royalty of the Hedge.'] },
  ]);
  lines('season.may.hayfever', [
    { if: { temper: 'ornery' }, text: ['A wizard crowned in our May? Who allowed that?'] },
    { if: { temper: 'shy' }, text: ['...Were you? Really?'] },
  ]);
  lines('season.may.pond', [
    { if: { temper: 'ornery' }, text: ['Serves you right. The May\'s for the young.'] },
    { if: { temper: 'witty' }, text: ['The duck wore it better, I expect.'] },
  ]);
  lines('season.may.whythem', [
    { if: { temper: 'ornery' }, text: ['Because they\'d hate it. And I\'d enjoy that.'] },
    { if: { stage: 'child' }, text: ['Because they\'re nice to me. And they can do a cartwheel.'] },
  ]);
  lines('season.may.notme', [
    { if: { temper: 'witty' }, text: ['You\'re too tall. The garland would only reach your knees.'] },
    { if: { temper: 'shy' }, text: ['...I\'d crown you. If I could. Quietly.'] },
  ]);
  lines('season.yule.sealed', [
    { if: { temper: 'ornery' }, text: ['Good. And no hints. You\'re terrible at not hinting.'] },
    { if: { temper: 'witty' }, text: ['Sealed with holly. Very festive. Very prickly.'] },
  ]);
  lines('season.yule.me', [
    { if: { temper: 'ornery' }, text: ['Coal. You\'re getting coal.'] },
    { if: { temper: 'witty' }, text: ['A box. With a smaller box in it. And so on, down to nothing.'] },
    { if: { temper: 'shy' }, text: ['...You might be getting something. I won\'t say.'] },
  ]);
  lines('season.yule.lucky', [
    { if: { temper: 'ornery' }, text: ['Lucky? They\'ll be lucky if I finish it.'] },
    { if: { temper: 'cheerful' }, text: ['They will be! I\'ll make sure of it!'] },
  ]);
  lines('season.yule.bass', [
    { if: { temper: 'ornery' }, text: ['Low and loud. The two worst things in a singer.'] },
    { if: { temper: 'shy' }, text: ['...Then I can sing quietly next to you, and nobody will hear me.'] },
  ]);
  lines('season.yule.elves', [
    { if: { stage: 'child' }, text: ['Sing it! Sing it now! Make the snow stop!'] },
    { if: { temper: 'curious' }, text: ['How? What was it in the tune? Was it the words or the notes?'] },
  ]);
  lines('season.yule.hum', [
    { if: { temper: 'dreamy' }, text: ['...Oh. I\'ll hear that in my sleep.'] },
    { if: { temper: 'witty' }, text: ['...Well. That\'s ruined every other carol for me.'] },
  ]);
  lines('season.yule.together', [
    { if: { temper: 'ornery' }, text: ['Hmph. I\'ll stand at the back and hum. That\'s my offer.'] },
    { if: { temper: 'proud' }, text: ['I\'d be honoured. I have a fine voice. Everybody says.'] },
  ]);
  lines('season.yule.ale', [
    { if: { temper: 'ornery' }, text: ['Bring your own. I\'m not sharing mine.'] },
    { if: { temper: 'cheerful' }, text: ['There\'ll be plenty! There\'s always plenty at Yule!'] },
  ]);
});
