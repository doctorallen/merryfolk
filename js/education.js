'use strict';
// ---------------------------------------------------------------------------
// Education and speech. Every villager talks in whole sentences, but how they
// talk, and much of what they choose to do, depends on their education: a
// single 0..1 level built up at the story circle, at home round the supper
// table, from books, from chatting with folk who know more, from travel, and
// from you (the Teach button). Little ones talk like little ones; grown-ups
// talk plainly, ordinarily or rather grandly depending on their schooling.
// ---------------------------------------------------------------------------

const EDU_LEVELS = [
  [0, 'Unlettered', 'Can\'t read yet; learns trades by doing'],
  [0.15, 'Knows letters', 'Can read a simple storybook'],
  [0.4, 'Schooled', 'Reads for pleasure and keeps accounts'],
  [0.6, 'Well-read', 'Knows history, herb-lore and a great many stories'],
  [0.8, 'Learned', 'One of the wisest heads in the Shire'],
];
function eduLevel(e) { let out = EDU_LEVELS[0]; for (const l of EDU_LEVELS) if (e >= l[0]) out = l; return out; }
function eduLevelIndex(e) { let i = 0; EDU_LEVELS.forEach((l, k) => { if (e >= l[0]) i = k; }); return i; }

// Grown-ups arriving from elsewhere (founders, travellers) bring some schooling.
function startingEducation(genes, age) {
  const base = clamp(0.08 + genes.wit * 0.38 + genes.curiosity * 0.22 + R.f(-0.12, 0.16), 0.04, 0.92);
  if (age >= CHILD_DAYS) return base;
  if (age < BABY_DAYS) return 0;
  return clamp(base * 0.5 * (age - BABY_DAYS) / (CHILD_DAYS - BABY_DAYS), 0, 0.5);
}
// Saves from before the education level: grown-ups were all fluent then, so
// their schooling is worked out from their nature and their lore.
function educationFromOld(o, genes, age) {
  if (age >= CHILD_DAYS) return clamp(startingEducation(genes, age) * 0.8 + ((o.skills && o.skills.lore) || 0) / 160, 0.04, 0.95);
  const vals = Object.values(o.vocab || {});
  return clamp((vals.reduce((s, x) => s + x, 0) / Math.max(1, WORD_COUNT_OLD)) * 0.45, 0, 0.5);
}
const WORD_COUNT_OLD = 54;

const EDU_SOURCES = { school: 'story circle', home: 'home', books: 'books', talk: 'conversation', you: 'your lessons', travel: 'travel', work: 'apprenticing' };

// How readily someone learns: young minds soak things up; wit and curiosity help.
function learnRate(v) {
  if (v.stage === 'baby') return 0;
  return (v.isChild() ? 2.2 : 0.15) * (0.45 + v.genes.wit * 0.75 + v.genes.curiosity * 0.3);
}
function learn(v, amount, source) {
  const rate = learnRate(v);
  if (!rate || amount <= 0) return 0;
  const before = v.edu;
  // each step up is harder than the last
  const gain = amount * rate * (1 - before) * (1 - before);
  v.edu = clamp(before + gain, 0, 1);
  v.eduFrom[source] = (v.eduFrom[source] || 0) + gain;
  const a = eduLevelIndex(before), b = eduLevelIndex(v.edu);
  if (b > a) eduMilestone(v, b);
  return gain;
}
function eduMilestone(v, i) {
  if (i === 1) {
    v.remember(v.isChild() ? 'Read a whole storybook all by myself!' : 'Learned my letters at last.', 2);
    chronicle(v.isChild() ? `Little ${v.first} has learned ${v.pron.their} letters and read a whole storybook aloud. Everyone clapped.` : `${v.name()} has learned to read, and is very proud of it.`, 'learn');
  } else if (i === 2) {
    v.remember('Teacher says I\'m properly schooled now.', 2);
    if (v.isChild()) chronicle(`${v.first} is doing splendidly at the story circle: reading, sums and the names of all the rivers.`, 'learn');
  } else if (i === 3) {
    v.remember('Became well-read. There are so many books!', 2);
    chronicle(`${v.name()} is now ${v.isChild() ? 'the best-read little one in the village' : 'well-read'}, and quotes old verses at the slightest excuse.`, 'learn');
  } else if (i === 4) {
    v.remember('Counted among the learned.', 3);
    chronicle(`${v.name()} is now one of the most learned hobbits in Thistledown. Folk come to ${v.pron.them} for advice on everything from bee-stings to boundary disputes.`, 'learn');
  }
}

// Supper-table learning: every night little ones pick up what their family knows.
function householdLessons() {
  for (const v of Game.villagers) {
    if (!v.isChild() || v.leaving) continue;
    const family = Game.villagers.filter((o) => o.homeId === v.homeId && o.isGrown());
    if (!family.length) continue;
    const best = Math.max(...family.map((o) => o.edu));
    learn(v, 0.01 + best * 0.02, 'home');
  }
}

// What being educated changes, for the Mind tab.
function eduEffects(v) {
  const e = v.edu, out = [];
  if (v.stage === 'baby') return ['Too little for lessons yet'];
  out.push(`Picks up skills ${Math.round((eduSkillMul(v) - 1) * 100) >= 0 ? '+' : ''}${Math.round((eduSkillMul(v) - 1) * 100)}% compared with an average villager`);
  out.push(e >= 0.15 ? 'Can read books and storybooks alone' : 'Can only look at the pictures in books');
  if (e >= 0.4) out.push('Prefers a book or a cup of tea to a rowdy evening');
  else if (v.isGrown()) out.push('Happiest with simple pleasures: a pint, a pipe, a song');
  if (e >= 0.5) out.push('Knows a toadstool from a mushroom');
  if (e >= 0.45 && v.isGrown()) out.push('Suited to lettered trades (herbalist, postie, storyteller, brewer)');
  if (e >= 0.6 && v.isGrown()) out.push('Teaches little ones and passes on what they know in conversation');
  return out;
}
// Learning a trade comes quicker with schooling.
function eduSkillMul(v) { return v.isChild() ? 0.7 + v.edu * 0.5 : 0.65 + v.edu * 0.8; }

// ---------------------------------------------------------------------------
// Speech
// ---------------------------------------------------------------------------
// Registers: 'child' (young or unlettered little ones), 'bright' (schooled
// little ones), 'plain', 'common' and 'fine' for grown-ups.
function register(v) {
  if (v.stage === 'baby') return 'baby';
  if (v.isChild()) return v.edu >= 0.32 ? 'bright' : 'child';
  return v.edu < 0.28 ? 'plain' : v.edu < 0.55 ? 'common' : 'fine';
}
const FALLBACK = { bright: 'child', plain: 'common', fine: 'common', child: 'common' };

const FOOD_SAY = { cheese: 'a wedge of cheese', bread: 'fresh bread', pie: 'apple pie', cake: 'seed-cake', fish: 'fried fish', mush: 'mushrooms', apple: 'apples', egg: 'eggs', veg: 'vegetable soup', stew: 'stew' };

const LINES = {
  baby: { baby: ['Ba-ba-ba!', 'Goo!', 'Mama!', 'Dada!', 'Waaah!', '*gurgle*', 'Bah!'] },
  hungry: {
    child: ['I\'m hungry! Can I have some {food}?', 'My tummy is growling, listen!', 'Is it second breakfast yet?'],
    bright: ['Is it second breakfast or elevenses next? I\'m hungry for both.', 'I could eat a whole {food} by myself, I think.'],
    plain: ['I\'m that hungry I could eat a whole {food}.', 'When\'s dinner? My belly thinks it\'s been forgotten.', 'Could do with a bite, I could.'],
    common: ['I\'m quite peckish. A plate of {food} would go down nicely.', 'Is it elevenses already? It feels like it.', 'I\'ve been dreaming of {food} all morning.'],
    fine: ['I confess my stomach is insisting on {food}, and I am inclined to agree with it.', 'One cannot think properly on an empty stomach, as the old books say.', 'Elevenses is an institution I would defend to my last crumb.'],
  },
  thirsty: {
    child: ['I\'m thirsty! Can I have a drink?', 'I want some water, please!'],
    plain: ['Parched, I am. Where\'s the well?', 'My throat\'s dry as a summer road.'],
    common: ['I could do with a cool drink.', 'A cup of something would be lovely just now.'],
    fine: ['A glass of cool well-water would be most welcome.', 'I find myself in urgent need of a cup of tea.'],
  },
  tired: {
    child: ['I\'m not sleepy! *yawn*', 'My eyes keep closing by themselves.', 'Can somebody carry me home?'],
    plain: ['I\'m dead on my feet.', 'Bed for me, I reckon.', 'Could sleep for a week.'],
    common: ['I\'m ready for my bed, I think.', 'What a long day it\'s been.', 'Time for a good night\'s sleep.'],
    fine: ['I believe I shall retire early with a good book, and not get past the first page.', 'Weariness has quite overtaken me.'],
  },
  cold: {
    child: ['Brrr! My toes are frozen!', 'It\'s cold! Can we light the fire?'],
    plain: ['It\'s bitter out. Fire\'s what I want.', 'Brr! Chilled to the bone.'],
    common: ['Goodness, it\'s nippy today. I\'ll be glad of the fire.', 'I should have worn my thicker waistcoat.'],
    fine: ['The chill has quite crept into my bones. A seat by the hearth is called for.', 'I find this cold most disagreeable.'],
  },
  lonely: {
    child: ['I want my {parent}!', 'Will somebody play with me?', 'Nobody wants to play...'],
    plain: ['Could do with some company.', 'Quiet round here, isn\'t it?'],
    common: ['I do miss a good natter. I wonder where {friend} has got to.', 'It\'s been a while since I had a proper chat.'],
    fine: ['Solitude is all very well, but I should dearly like a conversation.', 'I must call on {friend}. It has been far too long.'],
  },
  bored: {
    child: ['I\'m bored! There\'s nothing to do!', 'Can we play a game? Please?', 'What shall we play?'],
    bright: ['I\'ve read all my books twice. Is there a new one?', 'Let\'s play explorers! I\'ll draw the map.'],
    plain: ['Nothing doing today.', 'Bit of a dull one, this.'],
    common: ['I fancy doing something different today.', 'Is there a party coming up? I could do with one.'],
    fine: ['I am in want of some occupation for the mind.', 'Perhaps I shall take a walk and see what the hedgerows are up to.'],
  },
  sick: {
    child: ['I don\'t feel well. My tummy hurts.', 'Achoo! I\'ve got the sniffles!'],
    plain: ['Achoo! Blasted sniffles.', 'I feel rotten.', '*cough cough* I\'m all right, honest.'],
    common: ['Achoo! I think I\'ve caught a cold.', 'I feel dreadful. I might go and lie down.', 'I could do with one of the herbalist\'s remedies.'],
    fine: ['I fear I am quite unwell. Feverfew and bed, I think.', 'Achoo! Do pardon me. I seem to have caught a chill.'],
  },
  tipsy: {
    plain: ['Hic! Another round, I say!', 'Who moved the road? It was here a minute ago.', 'I love you all! Every one of you! Hic!'],
    common: ['I think that last ale was one too many. Hic!', 'Shall we have a song? I know a good one!', 'Is the ground supposed to wobble like this?'],
    fine: ['I may have overindulged a touch. Hic!', 'I propose a toast: to the brewer, a scholar and a gentle soul!'],
  },
  rain: {
    child: ['Puddles! Can I jump in the puddles?', 'It\'s raining! My feet are all squelchy.'],
    plain: ['Rain again. Good for the barley, mind.', 'Wet as a fish out here.'],
    common: ['Bother this rain. Still, the gardens will be glad of it.', 'I think I\'ll stay in and put the kettle on.'],
    fine: ['A soft rain, the farmers\' friend, though I\'d rather it fell on someone else\'s hat.', 'Splendid weather for reading by the window.'],
  },
  snow: {
    child: ['Snow! Let\'s make a snow-hobbit!', 'Can we go sledging?'],
    plain: ['Snow\'s coming down thick. Mind the path.', 'Cold enough to freeze your pipe.'],
    common: ['The snow makes everything look so peaceful.', 'I do love a snowy morning, as long as I\'m indoors.'],
    fine: ['There is a particular hush to a snowy day that I find most agreeable.', 'Winter has drawn its white blanket over the Shire again.'],
  },
  sunny: {
    child: ['It\'s sunny! Let\'s go to the river!', 'Look at the butterflies!'],
    plain: ['Lovely day for it.', 'Sun\'s out. Grand.'],
    common: ['What a beautiful day! The {season} sun is a joy.', 'Weather like this makes the garden sing.'],
    fine: ['A {season} day such as this deserves to be written into a poem.', 'The light on the hills this morning was quite remarkable.'],
  },
  party: {
    child: ['A party! Will there be cake?', 'Dance with me! Dance with me!', 'Can I stay up late? Please?'],
    plain: ['Party tonight! I\'ll be first at the barrel.', 'Strike up the fiddle!'],
    common: ['A party tonight! I can\'t wait.', 'I hope there are fireworks. There usually are.'],
    fine: ['I do enjoy a gathering. I have a speech prepared, though nobody ever lets me finish it.', 'A party! I\'ve composed a little verse for the occasion.'],
  },
  building: {
    child: ['They\'re building a new house! Can I help dig?', 'Look how big the {building} is getting!'],
    plain: ['They\'re putting up {building}. Hard work, that.', 'Good to see the village growing.'],
    common: ['Have you seen {building}? It\'s coming along nicely.', 'Thistledown\'s growing. We\'ll need every hole we can dig.'],
    fine: ['{building} is going up apace. A growing village is a healthy one.', 'I\'ve been advising the woodwrights on {building}. They mostly ignore me.'],
  },
  newhome: {
    plain: ['Still can\'t believe I\'ve got a hole of my own.', 'My own front door. Fancy that.'],
    common: ['I do love my new home at {home}. The round door sticks a little, but still.', 'Having a place of my own is wonderful.'],
    fine: ['{home} is everything I hoped for: dry, warm and full of bookshelves.', 'There is no greater comfort than one\'s own hearth.'],
  },
  love: {
    plain: ['That {sweet}... ooh, I\'m smitten.', 'Reckon I\'ll pick some flowers for {sweet}.'],
    common: ['I can\'t stop thinking about {sweet}.', 'Do you think {sweet} likes me? Really likes me?'],
    fine: ['{sweet} has quite stolen my heart. I\'m writing a poem about it. It\'s terrible.', 'I find {sweet} the most delightful company in the whole Shire.'],
  },
  ourbaby: {
    plain: ['Our little one never sleeps! Never!', 'Babies, eh? Worth every sleepless night.'],
    common: ['The baby is growing so fast!', 'I wonder who the little one will take after.'],
    fine: ['I\'ve started reading to the baby already. One can never begin too early.', 'Our little one has the most remarkable curiosity, I\'m told that\'s a good sign.'],
  },
  work: {
    plain: ['Hard work never hurt anybody.', 'Best {job} in the village, me.', 'Back to it, then.'],
    common: ['There\'s always something to do when you\'re the {job}.', 'I do like my work. Most days.', 'A {job}\'s work is never done!'],
    fine: ['I\'ve been reading up on a better way to do things. A {job} must keep learning.', 'There is a quiet dignity to being the village {job}.'],
  },
  happy: {
    child: ['I\'m happy! This is the best day ever!', 'I love Thistledown!'],
    bright: ['This is the best day ever, and I know lots of days.', 'I\'m going to write about today in my diary!'],
    plain: ['Can\'t complain. Can\'t complain at all.', 'Life\'s good, isn\'t it?'],
    common: ['What a lovely day it\'s been.', 'I\'m feeling rather cheerful today!'],
    fine: ['Contentment is an underrated virtue, and I am brimming with it.', 'A good day, a good meal, good company: what more could a hobbit want?'],
  },
  simple: {
    plain: ['Nothing beats a pint and a pipe after a day\'s work.', 'Books? Never needed \'em. Ask me about turnips instead.', 'Reckon it\'ll rain by teatime. Feel it in my knees.'],
  },
  books: {
    common: ['I\'ve just started a new book. About dragons!', 'Have you read the one about the journey to the mountains?'],
    fine: ['I\'ve been reading the old histories again. Did you know this valley was once a lake?', 'There\'s a line in an old poem I can\'t get out of my head: "The road goes ever on..."', 'I\'m compiling a list of every bird in the Shire. I\'m up to forty-one.', 'I\'ve been studying the old maps. There\'s a great deal of world out there.'],
  },
  rabbit: {
    child: ['A bunny! Look, a bunny! Can I keep it?', 'Shoo, bunny! Not the cabbages!'],
    plain: ['Blasted rabbits! Get out of it!'],
    common: ['Those rabbits will have the lettuces if we\'re not careful.'],
  },
  school: {
    child: ['I learned a new story today!', 'Our storyteller knows everything!'],
    bright: ['Today I learned that the river goes all the way to the sea!', 'I can count to a thousand. Want to hear?', 'Did you know bees can dance? It\'s how they talk!'],
  },
  play: {
    child: ['Tag! You\'re it!', 'Let\'s play hide and seek!', 'Race you to the big tree!', 'I\'m a dragon! Rarrr!'],
    bright: ['Let\'s play explorers! I\'ve drawn a map!', 'I\'m the hero and you\'re the troll, all right?'],
  },
  idle: {
    child: ['Hello! What are you doing?', 'Do you want to see my snail?', 'I found a shiny stone!'],
    plain: ['Afternoon.', 'All right?', 'Grand day, eh?', 'Hmm-hm-hmm...'],
    common: ['Good day to you!', 'Lovely to see you out and about.', 'How are your taters coming along?', 'What a nice morning for a stroll.'],
    fine: ['Good morrow! A fine day for contemplation.', 'Ah, the Shire. There\'s nowhere quite like it.', 'Have you noticed the swallows are back early this year?'],
  },
};

// Conversation: things said *to* someone.
const CHAT = {
  greet: {
    child: ['Hi, {name}! Want to play?', 'Hello, {name}! Guess what?'],
    plain: ['Morning, {name}.', 'All right, {name}?', 'How do, {name}.'],
    common: ['Hello, {name}! How are you keeping?', 'Good to see you, {name}!', 'There you are, {name}!'],
    fine: ['{name}! What a pleasure. How do you do?', 'Good day, {name}. I trust all is well at home?'],
  },
  gossip: {
    plain: ['Heard about {other}? No? Well...', 'That {other}, eh? You\'ll never guess.'],
    common: ['Did you hear what {other} did? Well, I never!', 'I saw {other} at the market. Looking very pleased with themselves.', 'Between you and me, {other} has been courting.'],
    fine: ['I hear {other} has been reading again. Promising, very promising.', 'I had a most illuminating talk with {other} the other day.'],
  },
  weather: {
    plain: ['Rain later, mark my words.', 'Warm one today.'],
    common: ['Lovely weather we\'re having!', 'Do you think it\'ll rain? My knee says yes.'],
    fine: ['The clouds over the western hills suggest rain by evening.', 'This {season} has been remarkably pleasant, hasn\'t it?'],
  },
  work: {
    plain: ['Busy day at the {job}\'s?', 'How\'s the work?'],
    common: ['How\'s life as the {job}?', 'Busy day, {name}?'],
    fine: ['And how goes the noble work of the {job}, {name}?'],
  },
  reply: {
    child: ['Really? Wow!', 'Me too!', 'No way!', 'That\'s silly!'],
    plain: ['Is that right?', 'Well, I never.', 'You don\'t say!', 'Ha!'],
    common: ['You don\'t say!', 'Well I never!', 'How wonderful!', 'Oh, that\'s splendid.', 'Ha! Very good.'],
    fine: ['How very interesting.', 'Quite so, quite so.', 'I hadn\'t considered that.', 'Fascinating!'],
  },
  // a better-read villager passes something on
  explain: {
    common: ['Did you know you can tell the time by which flowers are open?', 'If you plant beans near the corn, they help each other grow.', 'Willow bark is good for a headache, you know.'],
    fine: ['The reason the river floods in spring is the snow melting in the far hills.', 'Mint and feverfew together will see off a cold, if you catch it early.', 'Bees visit one kind of flower at a time, which is why the honey tastes of clover.', 'The stars that look like a plough point the way north.'],
  },
  puzzled: {
    child: ['What does that mean?', 'Ooh! Tell me more!'],
    plain: ['If you say so.', 'Never knew that.', 'Huh. Learn something new every day.'],
    common: ['Really? I never knew that!', 'How clever of you to know that.'],
  },
  // grown-ups telling little ones things
  toChild: {
    plain: ['Mind the river, {name}. It\'s deeper than it looks.', 'Here, {name}, hold the spoon like this.', 'That\'s a robin, {name}. Hear him sing?'],
    common: ['That\'s a robin, {name}. He sings to tell the others this is his garden.', 'Count the apples with me, {name}: one, two, three...', 'Always say please and thank you, {name}.'],
    fine: ['Do you know why the moon changes shape, {name}? Let me show you.', 'That flower is called feverfew, {name}. It cures headaches.', 'Shall I tell you about the great journeys of old, {name}?'],
  },
  quarrel: {
    child: ['That\'s mine! Give it back!', 'You\'re not my friend any more!', 'I\'m telling!'],
    plain: ['Mind your own taters!', 'Oh, go boil your head!', 'Hmph! Says you!'],
    common: ['How dare you!', 'Well, I never! The cheek of it!', 'Hmph! Nonsense!'],
    fine: ['I find your argument entirely without merit.', 'I shall not dignify that with a reply.', 'You are quite mistaken, and I can cite three books to prove it.'],
  },
  court: {
    plain: ['You look a picture today.', 'Fancy a walk down by the river?', '*blushes*'],
    common: ['You look lovely today.', 'Would you walk with me a while?', 'Fancy a picnic tomorrow?'],
    fine: ['Your company is the brightest part of my day.', 'Might I recite you a little verse? I wrote it myself.', 'Would you do me the honour of a stroll?'],
  },
};

function fillLine(v, text, ctx = {}) {
  const fav = FOOD_SAY[v.favouriteFood()] || 'apple pie';
  const friendId = Object.entries(v.rel).filter(([id, r]) => r > 0.3 && +id !== v.id).sort((a, b) => b[1] - a[1]).map(([id]) => Game.villagers.find((o) => o.id === +id)).find(Boolean);
  const sweet = v.sweetheart != null ? Game.villagers.find((o) => o.id === v.sweetheart) : null;
  const proj = Village.projects[0];
  const parent = v.parents.map((p) => Game.villagers.find((o) => o.id === p)).find(Boolean);
  return text
    .replace(/\{food\}/g, fav)
    .replace(/\{friend\}/g, friendId ? friendId.first : 'old friends')
    .replace(/\{sweet\}/g, sweet ? sweet.first : 'a certain someone')
    .replace(/\{job\}/g, ctx.job || (v.job ? JOBS[v.job].label.toLowerCase() : 'worker'))
    .replace(/\{parent\}/g, parent ? (parent.genes.sex === 'f' ? 'mum' : 'dad') : 'mum')
    .replace(/\{season\}/g, World.season)
    .replace(/\{home\}/g, v.home() ? v.home().name : 'home')
    .replace(/\{building\}/g, proj ? projectLabel(proj).replace(/^The /, 'the ') : 'the new hole')
    .replace(/\{name\}/g, ctx.name || 'friend')
    .replace(/\{other\}/g, ctx.other || 'the miller');
}
function pickFrom(table, reg) {
  let list = table[reg];
  let r = reg;
  while (!list && FALLBACK[r]) { r = FALLBACK[r]; list = table[r]; }
  if (!list) list = table.common || table.plain || table.child || Object.values(table)[0];
  return R.pick(list);
}
function lineFor(v, topic, ctx) {
  const reg = register(v);
  const table = LINES[topic] || CHAT[topic];
  if (!table) return null;
  if (reg === 'baby') return R.pick(LINES.baby.baby);
  // little ones don't say grown-up things
  if ((reg === 'child' || reg === 'bright') && !table.child && !table.bright) return pickFrom(LINES.idle, reg);
  if ((reg !== 'child' && reg !== 'bright') && !table.plain && !table.common && !table.fine) return pickFrom(LINES.idle, reg);
  return fillLine(v, pickFrom(table, reg), ctx);
}

// What someone feels like remarking on right now.
function speechTopic(v) {
  const d = v.drives, reg = register(v), kid = reg === 'child' || reg === 'bright';
  const opts = [];
  if (d.hunger > 0.55) opts.push([d.hunger * 3, 'hungry']);
  if (d.thirst > 0.6) opts.push([d.thirst * 2, 'thirsty']);
  if (d.tired > 0.7) opts.push([d.tired * 2.5, 'tired']);
  if (d.cold > 0.6) opts.push([d.cold * 2.5, 'cold']);
  if (d.lonely > 0.6) opts.push([d.lonely * 2, 'lonely']);
  if (d.bored > 0.6) opts.push([d.bored * 2, 'bored']);
  if (v.isSick()) opts.push([4, 'sick']);
  if (v.isTipsy() && !kid) opts.push([4, 'tipsy']);
  if (Game.raining) opts.push([1.2, 'rain']);
  else if (World.season === 'winter') opts.push([1, 'snow']);
  else if (Game.hour > 8 && Game.hour < 18) opts.push([0.6, 'sunny']);
  if (Game.party.on || Game.party.planned) opts.push([1.5, 'party']);
  if (Village.projects.length) opts.push([v.job === 'woodwright' ? 1.5 : 0.4, 'building']);
  if (!kid) {
    if (v.memories.some((m) => m.d >= Game.day - 2 && /^Moved into/.test(m.t))) opts.push([1.5, 'newhome']);
    if (v.sweetheart != null && !v.spouse) opts.push([1.2, 'love']);
    if (Game.villagers.some((b) => b.stage === 'baby' && b.parents.includes(v.id))) opts.push([1, 'ourbaby']);
    if (v.job && v.task && v.task.a.job) opts.push([1.2, 'work']);
    if (v.edu >= 0.4) opts.push([v.edu * 1.6, 'books']);
    if (v.edu < 0.3) opts.push([0.8, 'simple']);
  } else {
    if (World.rabbits.some((r) => dist(r.x, r.y, v.x, v.y) < 90)) opts.push([4, 'rabbit']);
    if (v.eduFrom.school > 0.02) opts.push([0.8 + v.edu, 'school']);
    opts.push([1.2, 'play']);
  }
  if (v.mood() > 0.72) opts.push([1, 'happy']);
  opts.push([0.8, 'idle']);
  return R.weighted(opts);
}

// Something to say out loud, unprompted.
function remark(v) {
  if (v.stage === 'baby') {
    if (v.drives.hunger > 0.6 || v.drives.lonely > 0.7) return R.pick(['Waaah!', 'Waaaaah!', 'Mwaah!']);
    return R.pick(LINES.baby.baby);
  }
  return lineFor(v, speechTopic(v));
}

// One exchange in a conversation between two villagers. Whoever knows more
// passes a little of it on, and like-minded folk get on best.
function converse(speaker, listener, mode) {
  const ctx = { name: listener.first, job: listener.job ? JOBS[listener.job].label.toLowerCase() : null };
  if (mode === 'quarrel') return lineFor(speaker, 'quarrel', ctx);
  if (mode === 'court') return lineFor(speaker, 'court', ctx);
  const gap = speaker.edu - listener.edu;
  const opts = [[1, 'greet'], [1.2, 'weather'], [1.5, 'topic']];
  if (listener.job && speaker.isGrown()) opts.push([0.8, 'work']);
  const others = Object.keys(speaker.rel).map((id) => Game.villagers.find((o) => o.id === +id)).filter((o) => o && o !== listener && o.isGrown());
  if (others.length && speaker.isGrown()) opts.push([0.9, 'gossip']);
  if (gap > 0.15 && speaker.edu >= 0.4 && speaker.isGrown()) opts.push([1.5 + gap * 4, 'explain']);
  const kind = R.weighted(opts);
  if (kind === 'explain') {
    learn(listener, 0.003 + gap * 0.01, 'talk');
    listener.pendingReply = 'puzzled';
    return lineFor(speaker, 'explain', ctx);
  }
  if (gap > 0) learn(listener, gap * 0.002, 'talk');
  listener.pendingReply = 'reply';
  if (kind === 'gossip') return lineFor(speaker, 'gossip', { ...ctx, other: R.pick(others).first });
  if (kind === 'topic') return lineFor(speaker, speechTopic(speaker), ctx);
  return lineFor(speaker, kind, ctx);
}

// A grown-up telling a nearby little one something; they learn from it.
function instructChild(adult, kid) {
  learn(kid, 0.002 + adult.edu * 0.005, 'talk');
  return lineFor(adult, 'toChild', { name: kid.first });
}

// Your lessons (the Teach button).
const LESSON_SAY = {
  child: ['One, two, three, four... I can count!', 'A is for apple! B is for... bee!', 'I can write my name now! Look!'],
  bright: ['So that\'s why the leaves turn red! It\'s the cold!', 'Seven sevens are forty-nine. Easy!', 'I\'m going to read every book in Thistledown.'],
  plain: ['Huh. Well, I never knew that.', 'Letters, eh? I\'ll give it a go.', 'Never too old to learn, they say.'],
  common: ['How interesting! Tell me more.', 'I must write that down.', 'Well, that explains a great deal.'],
  fine: ['A splendid point. I shall look it up.', 'Ah, yes, I\'d read something of the sort. Thank you.'],
};
function lessonLine(v) { return pickFrom(LESSON_SAY, register(v)); }
