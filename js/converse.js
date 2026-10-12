'use strict';
// ---------------------------------------------------------------------------
// A proper natter. A conversation runs over turns: someone opens a topic, the
// other answers in their own manner, the first follows it up, the other comes
// back, and then one of them starts on something else, until they've said
// their piece and part. What they talk about comes from what's true for the
// two of them and the place: the weather, the food in front of them, the
// day's work, the news, their families, hobbies, aches, old tales, plans,
// grievances, compliments, jokes and riddles. How each answers depends on
// their temper (cheerful, ornery, shy, curious, dreamy, witty, proud or
// gloomy) and on what the two are to each other (strangers, friends, close
// friends, sweethearts, married, kin, rivals). Friends and spouses talk long;
// strangers briefly; and a sour answer from a grump can send the other off
// with a short word. Round the supper table and in the taproom, everyone at
// the table takes a turn.
// ---------------------------------------------------------------------------

MOODLETS.snubbed = ['{x} was short with me', -0.04, 240, ['Well, I shan\'t ask {x} again.', '{x} can keep their own company.']];
MOODLETS.long_chat = ['A proper long natter with {x}', 0.07, 420, ['Me and {x} put the world to rights.', 'I could talk to {x} all day.']];
MOODLETS.table_talk = ['Good company at table', 0.04, 240, ['Nothing like a meal with friends.']];

// --- who they are, and what they are to each other ------------------------------
const TEMPERS = ['cheerful', 'ornery', 'shy', 'curious', 'dreamy', 'witty', 'proud', 'gloomy'];
// The manner someone answers in, from their nature and how they're feeling.
function temperOf(v) {
  const g = v.genes, m = v.mood(), jit = (k) => hash2(v.id * 13 + k, 7) * 0.1;
  if (v.isChild()) {
    if (m < 0.35) return 'gloomy';
    if (g.curiosity > 0.65) return 'curious';
    if (g.sociability < 0.3) return 'shy';
    return g.temper > 0.7 && g.merriness < 0.4 ? 'ornery' : 'cheerful';
  }
  const sc = {
    cheerful: g.merriness * 0.85 + (m - 0.5) * 0.5 + jit(0),
    ornery: g.temper * 1.25 - g.merriness * 0.25 + (0.5 - m) * 0.7 + (v.sulk ? 0.3 : 0) + jit(1),
    shy: (1 - g.sociability) * 1.0 + jit(2),
    curious: g.curiosity * 0.9 + jit(3),
    dreamy: g.romance * 0.8 + (v.dream ? 0.15 : 0) + jit(4),
    witty: g.wit * 0.95 + g.merriness * 0.15 + jit(5),
    proud: 0.15 + (v.masterpiece ? 0.35 : 0) + ((v.stats.taught || 0) > 0 ? 0.2 : 0) + (register(v) === 'fine' ? 0.35 : 0) + g.wit * 0.4 + (1 - g.curiosity) * 0.2 + jit(6),
    gloomy: (0.5 - m) * 1.8 + (v.sulk ? 0.5 : 0) + (v.glum || 0) * 0.5 + (v.isSick() ? 0.35 : 0) + jit(7),
  };
  let best = 'cheerful', bs = -1e9;
  for (const k of TEMPERS) if (sc[k] > bs) { bs = sc[k]; best = k; }
  return best;
}
const TEMPER_WORD = { cheerful: 'cheerful', ornery: 'short-tempered', shy: 'shy', curious: 'curious', dreamy: 'dreamy', witty: 'quick-witted', proud: 'proud', gloomy: 'gloomy' };
// What b is to a.
function relKind(a, b) {
  if (a.spouse === b.id) return 'spouse';
  if (a.sweetheart === b.id) return 'sweetheart';
  if (a.parents.includes(b.id) || b.parents.includes(a.id)) return 'kin';
  if (typeof related === 'function' && related(a, b)) return 'kin';
  if (a.rival === b.id || b.rival === a.id) return 'rival';
  const r = a.rel[b.id] ?? 0.1;
  if (r < -0.15) return 'sour';
  if (r >= 0.6) return 'close';
  if (r >= 0.3) return 'friend';
  if (r >= 0.05) return 'acquaintance';
  return 'stranger';
}
const WARM = { spouse: 1, sweetheart: 1, kin: 0.8, close: 0.9, friend: 0.6, acquaintance: 0.3, stranger: 0.1, rival: 0.2, sour: 0 };

// --- the words, filled in -----------------------------------------------------------
const weatherWord = () => (Game.weather === 'storm' ? 'this storm' : Game.raining ? 'this rain' : Game.weather === 'snow' ? 'the snow' : Game.weather === 'fog' ? 'this fog' : Game.weather === 'cloudy' ? 'this grey sky' : 'this sunshine');
function kidsOf(v) { return Game.villagers.filter((o) => o.parents.includes(v.id) && !o.leaving); }
function fillTalk(text, s, l, ctx = {}) {
  if (!text) return null; // a pool run dry: the caller skips the turn
  const kid = kidsOf(s)[0], sp = s.spouse ? personById(s.spouse) : null, hob = typeof hobbiesOf === 'function' && hobbyAge(s) ? hobbiesOf(s)[0] : null;
  return text
    .replace(/\{name\}/g, l ? l.first : 'friend').replace(/\{me\}/g, s.first)
    .replace(/\{season\}/g, World.season).replace(/\{weather\}/g, weatherWord())
    .replace(/\{inn\}/g, innName()).replace(/\{job\}/g, s.job && JOBS[s.job] ? JOBS[s.job].label.toLowerCase() : 'work')
    .replace(/\{yourjob\}/g, l && l.job && JOBS[l.job] ? JOBS[l.job].label.toLowerCase() : 'work')
    .replace(/\{dish\}/g, ctx.dish || 'the stew').replace(/\{hobby\}/g, hob ? hobbyName(s, hob).toLowerCase() : 'my garden')
    .replace(/\{kid\}/g, kid ? kid.first : 'the little ones').replace(/\{spouse\}/g, sp ? sp.first : 'my better half')
    .replace(/\{home\}/g, s.homeId >= 0 && s.home() ? s.home().name : 'home').replace(/\{day\}/g, typeof weekday === 'function' ? weekday(Game.day) : 'today');
}
const pickUnused = (pool, used) => {
  if (!pool || !pool.length) return null;
  const fresh = pool.filter((t) => !used.has(t));
  if (!fresh.length) return null;
  const t = R.pick(fresh);
  used.add(t);
  return t;
};
// a pool keyed by register ('grown'/'child') or a plain list
const poolFor = (tbl, v) => (Array.isArray(tbl) ? tbl : tbl ? (v.isChild() ? tbl.child || tbl.grown : tbl.grown || tbl.child) : null);
// a reply keyed by temper, with 'child' and 'any' fallbacks
function replyPool(tbl, v, temper) {
  if (!tbl) return null;
  if (v.isChild() && tbl.child) return tbl.child;
  return tbl[temper] || tbl.any || tbl.cheerful || null;
}

// --- the topics ------------------------------------------------------------------------
// Each has openers, replies by temper, a follow-up by the opener and a reply
// to that; `sour` marks the tempers whose reply is a snub. `when` says whether
// it fits these two, here and now, and `w` how likely it is.
const SOUR_DEFAULT = ['ornery', 'gloomy'];
const TOPICS = {
  weather: {
    w: 1, when: () => true,
    open: { grown: ['Well, what do you make of {weather}, {name}?', 'Some weather for {season}, this.', 'My knee says {weather} is set in for the week.', 'I don\'t remember a {season} like it.'], child: ['Look at {weather}! Isn\'t it brilliant?', 'Do you think it\'ll stay like this, {name}?'] },
    reply: {
      cheerful: ['Oh, I don\'t mind it. Good for the garden!', 'Every kind of weather\'s good for something, that\'s what I say.'],
      ornery: ['It\'s weather. It happens.', 'I\'ve seen worse. I\'ve seen better. What of it?'],
      shy: ['...Yes. It\'s quite something.', 'Mm. I suppose it is.'],
      curious: ['Do you know, I\'ve been wondering what makes the clouds go that colour.', 'The old almanac says it means a hard winter. Do you believe that?'],
      dreamy: ['I like the sky when it\'s like this. It looks like the start of a story.', 'It makes me want to walk out along the river and keep going.'],
      witty: ['Weather for ducks, this. And I\'ve met the ducks. They\'re not impressed either.', 'If I\'d wanted {weather} I\'d have asked for it.'],
      proud: ['I predicted this on Sterday, you know. Nobody listened.', 'My barley doesn\'t mind it. Mine never does.'],
      gloomy: ['It\'ll turn. It always turns.', 'Suits my mood, that\'s all I\'ll say.'],
      child: ['I like it! Can we go to the river?', 'Mum says it\'s good for the taters.'],
    },
    more: { grown: ['Mind you, it was worse the {season} before last. You remember.', 'Good for the barley, whatever it does to my hat.', 'Still, you can\'t argue with the sky.'], child: ['When it\'s dry can we play by the oak?', 'I hope it snows. Proper snow.'] },
    back: { any: ['That\'s true enough.', 'Aye, well. We take what comes.', 'You never said a truer word.'], ornery: ['If you say so.'], witty: ['You can argue with it. You just don\'t win.'], child: ['Yeah!', 'Can we? Can we really?'] },
  },
  food_here: {
    w: 3, when: (s, l, c) => !!c.dish,
    open: { grown: ['Now, {dish}. Just the thing.', 'Who made the {dish}? It wants congratulating.', 'I could eat {dish} every day of the week and twice on Highday.', 'Pass the salt, {name}. The {dish} could take a pinch more.'], child: ['Mmm, {dish}! My favourite!', 'Is there more {dish}?'] },
    reply: {
      cheerful: ['Isn\'t it? I had seconds before I\'d finished my firsts.', 'Best {dish} this side of Bree, I\'d say.'],
      ornery: ['It\'s all right. Bit heavy on the salt.', 'My mother\'s was better. Everyone\'s mother\'s was better.'],
      shy: ['It\'s very nice. ...Could I have the bread?', 'Mm. Yes. Lovely.'],
      curious: ['What\'s in it, do you think? There\'s a herb I can\'t place.', 'I\'d love to know how they get the crust like that.'],
      dreamy: ['It tastes like {season}, doesn\'t it? Like the whole {season} in a bowl.', 'My gran made {dish} on feast days. I can almost see her kitchen.'],
      witty: ['It\'s so good I may propose to the cook.', 'Careful, {name}, you\'ll wear out the spoon.'],
      proud: ['I\'ve made better, if I\'m honest. But this\'ll do.', 'The trick is in the stock. I\'ve told them that.'],
      gloomy: ['I haven\'t much appetite tonight. You have mine.', 'It\'s fine. Everything\'s fine.'],
      child: ['I want the crusty bit!', 'Can I have seconds? And thirds?'],
    },
    more: { grown: ['There\'s a pudding after, I\'m told. Leave room.', 'Eat up, {name}. There\'s a long {season} ahead.', 'A meal like this and a pipe after. That\'s a day done right.'], child: ['I\'m going to be as tall as the oak if I eat it all.'] },
    back: { any: ['Pudding! Now you\'re talking.', 'I always leave room. It\'s a gift.', 'Hear, hear.'], gloomy: ['Maybe. We\'ll see.'], child: ['Pudding!'] },
    sour: ['ornery', 'gloomy'],
  },
  work: {
    w: 1.4, when: (s, l) => s.isGrown() && l.isGrown() && !!(s.job || l.job),
    open: { grown: ['How\'s the {yourjob} keeping you, {name}?', 'Busy at the {yourjob}\'s?', 'My hands are raw from work. Worth it, mind.', 'I was up before the birds for work today.'] },
    reply: {
      cheerful: ['Busy as a bee in a bluebell! Just how I like it.', 'Can\'t complain. Wouldn\'t if I could.'],
      ornery: ['Busy. Too busy to stand here, truth be told.', 'Same as ever. Nobody thanks you.'],
      shy: ['Oh, it\'s... it\'s fine. Quiet.', 'There\'s always something to do.'],
      curious: ['I\'ve been trying a new way of going about it. Shall I tell you?', 'Do you ever wonder how they do it over the hills?'],
      dreamy: ['Some days I forget what I\'m meant to be doing and just watch the clouds.', 'I\'d sooner be fishing, if I\'m honest.'],
      witty: ['I\'d say it keeps me out of trouble, but you\'ve met me.', 'The work\'s fine. It\'s the working I object to.'],
      proud: ['Best {job} the village has had, if I say so myself.', 'Nobody does it the way I do it. Ask anyone.'],
      gloomy: ['One day much like another.', 'It gets done. That\'s all I can say for it.'],
      child: ['I helped Dad today! I carried the bucket.', 'I\'m going to be a {yourjob} when I\'m big.'],
    },
    more: { grown: ['Well, the village runs on folk like you, {name}.', 'Mind you don\'t wear yourself out before the party.', 'Rest on Highday, that\'s my rule. Mostly.'] },
    back: { any: ['Kind of you to say.', 'I\'ll rest when the barley\'s in.', 'Highday can\'t come soon enough.'], ornery: ['Hm.'], proud: ['It does. It really does.'], child: ['I never get tired!'] },
    sour: ['ornery', 'gloomy'],
  },
  doings: {
    w: 1.6, when: (s) => s.memories.some((m) => m.d === Game.day || m.d === Game.day - 1),
    open: { grown: ['You\'ll never guess what I\'ve been up to, {name}.', 'I must tell you about my day.', 'Funny thing happened to me, {name}.'], child: ['Guess what I did today, {name}!', 'You\'ll never guess what happened!'] },
    reply: { any: ['Go on, then.', 'Oh? Tell me.', 'I\'m all ears.'], ornery: ['Must I guess? Just say it.'], shy: ['...Oh?'], curious: ['Ooh, what? Tell me everything.'], witty: ['You found a dragon in the larder.'], child: ['What? What? Tell me!'] },
    // the follow-up is the memory itself, told as a story
    memory: true,
    back: { cheerful: ['Ha! Good for you.', 'Well, that\'s a day and a half!'], ornery: ['Is that it?', 'Hm. Things happen.'], shy: ['Goodness.', 'That\'s... that\'s something.'], curious: ['And then what? What did you do?', 'How did that come about?'], dreamy: ['I\'d have liked to see that.', 'You live more in a day than I do in a week.'], witty: ['Only you, {name}. Only you.', 'I\'d have paid a penny to watch.'], proud: ['Reminds me of the time I did much the same, only better.'], gloomy: ['Mm. Nothing ever happens to me.'], child: ['Wow! Can I come next time?'], any: ['Well I never.'] },
    sour: ['ornery'],
  },
  family: {
    w: 1.2, when: (s, l) => s.isGrown() && (kidsOf(s).length > 0 || s.spouse != null),
    open: { grown: ['How\'s your lot keeping, {name}?', 'A full house is a loud house, {name}, and I wouldn\'t swap it.'], kid: ['{kid}\'s growing like a weed, you know.', 'The little ones had me up at dawn again. {kid} wanted the dawn explained.'], spouse: ['{spouse} says I talk too much. Can you imagine?', '{spouse} has me up a ladder every Highday. It\'s never the same ladder.'] },
    reply: {
      cheerful: ['Children! Worth every grey hair.', 'Mine are thriving, thank you for asking.'],
      ornery: ['Noisy. All children are noisy.', 'Don\'t get me started on mine.'],
      shy: ['They\'re... well. Thank you. And yours?', 'It\'s nice to have a full house. Mostly.'],
      curious: ['Does {kid} ask you questions all day long? Mine never stops.', 'What were you like as a child, {name}? I bet you were a terror.'],
      dreamy: ['I remember being that small. The world went on forever.', 'They\'ll have their own hearths one day. Strange to think.'],
      witty: ['Mine are angels. Loud, muddy angels.', 'I had a quiet house once. Nineteen years ago.'],
      proud: ['Mine take after me, luckily for them.', '{kid} can already read better than the storyteller.'],
      gloomy: ['They grow up and off they go. That\'s the way of it.', 'We do our best. It never feels like enough.'],
      child: ['My dad snores so loud the windows shake!', 'My mum makes the best pie. Better than yours.'],
    },
    more: { grown: ['Still, a house with no little feet in it is a quiet house.', 'They\'ll look after us in our old age. Or so I keep telling them.', 'Bring yours round for supper one evening, {name}.'] },
    back: { any: ['We\'d like that very much.', 'True. Quiet\'s overrated.', 'If they remember who we are!'], ornery: ['Only if they behave.'], child: ['Can I bring my conker?'] },
    sour: ['ornery', 'gloomy'],
  },
  hobby: {
    w: 1.1, when: (s) => typeof hobbiesOf === 'function' && hobbyAge(s) && hobbiesOf(s).length > 0,
    open: { grown: ['I\'ve been at my {hobby} every evening this week.', 'Do you ever try your hand at {hobby}, {name}?', 'I\'ve nearly finished a piece. My {hobby}, you know.'], child: ['I\'ve been doing {hobby}! Want to see?', 'Do you like {hobby}, {name}? I love it.'] },
    reply: {
      cheerful: ['Oh, how lovely! You must show me.', 'I\'ve seen your work. It\'s a credit to you.'],
      ornery: ['Can\'t see the point of it, myself.', 'Hobbies. Hm. Don\'t they take up time?'],
      shy: ['I... I\'d like to see it. If that\'s all right.', 'I wouldn\'t be any good at that.'],
      curious: ['How do you start? Where did you learn?', 'Would you teach me one day? I\'d be a terrible pupil.'],
      dreamy: ['There\'s something about making a thing with your hands. It stays.', 'I\'d like to make something that lasts.'],
      witty: ['Everyone needs something to do that nobody asked them to do.', 'I tried it once. The pot and I weren\'t on speaking terms.'],
      proud: ['I dabble myself. Rather well, actually.', 'Mine\'s won prizes, you know. Well, one prize.'],
      gloomy: ['I used to. Haven\'t the heart for it lately.', 'Good for you. I can\'t settle to anything.'],
      child: ['Can I have a go? Please?', 'Show me! Show me!'],
    },
    more: { grown: ['Come round of an evening and I\'ll show you the knack.', 'It\'s mostly patience. And swearing, when nobody\'s listening.', 'It settles the mind, that\'s the thing.'], child: ['I\'ll show you after school!'] },
    back: { any: ['I might just do that.', 'Patience I\'ve got. Mostly.', 'That I can believe.'], ornery: ['We\'ll see.'], curious: ['Tomorrow? I could come tomorrow.'], child: ['Yes! After school!'] },
    sour: ['ornery', 'gloomy'],
  },
  party: {
    w: 1.4, when: () => !!Game.party.planned || Game.party.on,
    open: { grown: ['Are you going to the party, {name}?', 'There\'s a do tonight. I\'ve had my waistcoat out.', 'Fireworks tonight, they say. Or so the children insist.'], child: ['There\'s a party! Are you going? Are you?', 'I\'m staying up for the fireworks. Mum said.'] },
    reply: {
      cheerful: ['Wouldn\'t miss it! I\'ll be first at the barrel and last to leave.', 'I\'ve been practising my steps all afternoon.'],
      ornery: ['All that noise. I might show my face. Might not.', 'Parties. Someone always treads on my feet.'],
      shy: ['I might come for a little while. Just to see.', 'I\'ll stand at the edge, I think.'],
      curious: ['Who\'s playing the fiddle this time? I want to see how they do that fast bit.', 'Do you think the rift-folk will dance?'],
      dreamy: ['I love the lanterns best. And the walk home after, with the stars out.', 'Dancing under the big tree... there\'s nothing like it.'],
      witty: ['I\'ll come for the cake and stay for the gossip.', 'I dance like a cart with a loose wheel, but I dance.'],
      proud: ['They\'ll want me there. A party\'s nothing without a good speech.', 'I\'ve been asked to judge the pies. Naturally.'],
      gloomy: ['Perhaps. If I feel up to it.', 'Not sure I\'m in the mood for a crowd.'],
      child: ['Yes! I\'m going to dance till I fall over!', 'I\'m going to eat all the cake. ALL of it.'],
    },
    more: { grown: ['Save me a dance, {name}.', 'Come on, I\'ll walk you over. It won\'t be the same without you.', 'Mind the ale. Last time you sang.'] },
    back: { any: ['Only if you promise not to tread on my toes.', 'Oh, go on then.', 'I did not sing. ...Did I?'], shy: ['...All right. Just the one.'], gloomy: ['Maybe. We\'ll see how I feel.'], child: ['I\'ll dance with you! And you! And everyone!'] },
    sour: ['ornery', 'gloomy'],
  },
  rifts: {
    w: 1, when: (s, l) => (Game.stats.rifts || 0) > 0 && s.isGrown(),
    open: { grown: ['What do you make of the rift-folk, {name}, honestly?', 'Those lights in the sky again last night. Did you see?', 'My gran would\'ve had a fit at all this rift business.'] },
    reply: {
      cheerful: ['I like them! Odd manners, good hearts.', 'More folk at the table, I say. The more the merrier.'],
      ornery: ['Don\'t hold with it. Humming and flashing all night.', 'They can keep their gadgets. A kettle is a kettle.'],
      shy: ['They seem... kind. I haven\'t spoken to many.', 'I don\'t know what to say to them.'],
      curious: ['I want to know how the Relay works. Properly know.', 'Have you heard them sing? It\'s all odd intervals. I rather like it.'],
      dreamy: ['Imagine a city where the dark is hard. That\'s what one of them said.', 'They came through the lightning. The lightning! Think of it.'],
      witty: ['They think tea is a ritual. They\'re not wrong.', 'I asked one what a battery was. I\'m still none the wiser.'],
      proud: ['They\'ve a lot to learn from us. Water-wheels, for one.', 'I showed one how to plant beans. He took notes.'],
      gloomy: ['Nothing stays the same. That\'s all I know.', 'The valley was quieter before. I\'ll say that.'],
    },
    more: { grown: ['Still, {name}, they\'re here now, and they\'re ours.', 'The little ones don\'t see any difference. Maybe they\'ve the right of it.', 'Time will tell. It usually does.'] },
    back: { any: ['Aye. That it will.', 'The little ones usually have.', 'Ours, is it? ...Well. Perhaps.'], ornery: ['Time can tell what it likes.'], curious: ['I hope it tells soon. I hate waiting.'] },
    sour: ['ornery', 'gloomy'],
  },
  ailment: {
    w: 1.6, when: (s) => s.isSick() || s.drives.ache > 0.5 || s.stage === 'elder',
    open: { grown: ['My back\'s giving me gyp again, {name}.', 'Achoo! Pardon me. This cold won\'t shift.', 'I feel every one of my years this morning.', 'Do you know anything for a stiff knee?'], child: ['My tummy hurts. I think it was the mushrooms.', 'Achoo! I\'ve got the sniffles.'] },
    reply: {
      cheerful: ['Oh, you poor thing. A hot bath and a hot toddy, that\'s my cure.', 'You\'ll be right as rain by Highday, you see.'],
      ornery: ['We\'ve all got aches. Mine\'s worse.', 'Don\'t breathe on me, then.'],
      shy: ['Oh dear. ...Have you seen the herbalist?', 'I hope you feel better soon.'],
      curious: ['Where exactly does it hurt? Is it worse in the damp?', 'Feverfew, the herbalist says. Or was it yarrow?'],
      dreamy: ['My gran swore by sitting in the sun with a cat. Any cat.', 'Rest. The valley will still be here tomorrow.'],
      witty: ['You\'re falling to bits, {name}. I\'ll hold you together with string.', 'Try standing nearer the fire and further from work.'],
      proud: ['I\'ve never had a day\'s illness. Good stock.', 'What you want is my remedy. Famous for it.'],
      gloomy: ['Join the club. I ache in places I didn\'t know I had.', 'It\'s the damp. It gets into everything.'],
      child: ['Yuck. Don\'t give it to me!', 'Mum says honey and lemon. And no sweets. Which is unfair.'],
    },
    more: { grown: ['I\'ll be fine. A pipe and a sit-down, that\'s all I need.', 'Growing old\'s not for the faint-hearted, {name}.', 'I\'ll see the herbalist if it\'s no better tomorrow.'] },
    back: { any: ['You do that.', 'Mind you do.', 'Growing old beats the alternative.'], ornery: ['Pipe won\'t fix a back.'], cheerful: ['That\'s the spirit!'], child: ['Can I have your pudding if you\'re poorly?'] },
    sour: ['ornery'],
  },
  tale: {
    w: 1.3, when: (s) => s.stage === 'elder' || (s.isGrown() && s.edu >= 0.55),
    open: { grown: ['Did I ever tell you about the winter the river froze clean through?', 'When I was a lad, {name}, the lanes were half the width and twice the mud.', 'My grandmother used to say the hill had a door in it nobody could find.', 'There was a fiddler once who played the mill wheel backwards. True story.'] },
    reply: { any: ['Go on, then. I\'ve time.', 'You have, but tell it again.', 'I\'ve not heard that one.'], ornery: ['You\'ve told me. Twice.', 'Is this a long one?'], curious: ['A door? Where? Did anyone look?'], witty: ['I\'ve heard it. It gets better every time.'], gloomy: ['Those were the days, I suppose.'], shy: ['...Please.'], child: ['Was it a dragon? Please say it was a dragon.'] },
    more: { grown: ['Well. It started, as these things do, with a bet and a pie.', 'Three days we were snowed in. Three days! And only one pack of cards.', 'And the strangest thing was, nobody ever saw the fiddler again.', 'I swear every word of it. Most of them, anyway.'] },
    back: { cheerful: ['Ha! I\'d have liked to be there.', 'You tell it so well.'], ornery: ['Mm. Sounds like a lot of fuss.'], shy: ['Goodness.'], curious: ['But what happened to the pie?', 'And then? You can\'t stop there!'], dreamy: ['I\'d like to find that door.', 'I can see it like I was there.'], witty: ['Most of them. That\'s the honest version.'], proud: ['My own grandfather told it differently, but yours will do.'], gloomy: ['Nothing like that happens any more.'], child: ['Tell it again! The dragon bit!'], any: ['Well I never.'] },
    sour: ['ornery'],
  },
  plans: {
    w: 1.1, when: (s, l) => WARM[relKind(s, l)] >= 0.6,
    open: { grown: ['Fancy a bit of fishing tomorrow, {name}?', 'We should take a picnic up the Hill before the weather turns.', 'Come round for tea on Highday. I\'ll bake.', 'Let\'s walk out along the river one evening, like we used to.'], child: ['Let\'s build a den tomorrow! A big one!', 'Will you come and play by the oak after school?'] },
    reply: {
      cheerful: ['I\'d love to! I\'ll bring the seed-cake.', 'Say the word and I\'m there.'],
      ornery: ['Depends. What time? Not early.', 'I\'ll think about it. Don\'t count on it.'],
      shy: ['Oh. ...Yes. I\'d like that. If you\'re sure.', 'Just us? ...All right.'],
      curious: ['Where to? Somewhere new? I want to see the far bank.', 'Can we go by the old orchard? I\'ve a question about the bees.'],
      dreamy: ['Yes. Let\'s go somewhere we can see the whole valley.', 'I\'ve been hoping someone would ask.'],
      witty: ['Only if you carry the basket. My back\'s a national treasure.', 'Fishing? I can sit by water and catch nothing anywhere.'],
      proud: ['I\'ll bring my pie. It\'ll show yours up, mind.', 'I know the best spot. Nobody else does.'],
      gloomy: ['Maybe. If the weather holds. It won\'t.', 'I\'m not much company lately, {name}.'],
      child: ['Yes! Yes! The biggest den ever!', 'I\'ll bring my ball!'],
    },
    more: { grown: ['Then it\'s settled. After second breakfast.', 'I\'ll call for you. Don\'t keep me waiting at the gate.', 'You\'re the best company there is, you know that?'], child: ['After school! Don\'t forget!'] },
    back: { any: ['Settled.', 'I\'ll be ready.', 'Oh, get away with you.'], shy: ['...Thank you, {name}.'], gloomy: ['We\'ll see.'], child: ['I won\'t! I promise!'] },
    sour: ['ornery', 'gloomy'],
  },
  grumble: {
    w: 1, when: (s, l) => s.isGrown() && l.isGrown(),
    open: { grown: ['That lane by the mill\'s a disgrace. Mud to the ankle.', 'Somebody\'s left the gate open again. Hens everywhere.', 'The lamp by my door\'s been dark three nights running.', 'The noise from {inn} last night! Did you hear it?', 'The price of timber these days. Don\'t get me started.'] },
    reply: {
      cheerful: ['Oh, it\'s not so bad. We\'ll get it sorted.', 'Ha! That\'ll be the children. Bless them.'],
      ornery: ['You think that\'s bad? Try living next to the brewhouse.', 'Nobody does anything about anything round here.'],
      shy: ['Oh. I hadn\'t noticed. Sorry.', 'Perhaps someone should put a note on the board.'],
      curious: ['Who looks after the lamps, do you know? I\'ve never asked.', 'I wonder if the Steward knows.'],
      dreamy: ['Mud\'s only the river dreaming of being somewhere else.', 'I rather like a dark lane. You can see the stars.'],
      witty: ['Mud to the ankle? Luxury. In my day it was mud to the ears.', 'The hens are probably on their way to complain about us.'],
      proud: ['I raised it at the Moot, you know. Twice.', 'I\'d have it fixed in a day if they\'d let me.'],
      gloomy: ['It\'s all going downhill. Always has been.', 'Nothing we can do. Nothing anyone can do.'],
      child: ['I like the mud!', 'I let the hens out. ...Don\'t tell.'],
    },
    more: { grown: ['I\'ll put a note on the board. Not that anyone reads it.', 'Mark my words, someone\'ll break a leg in that lane.', 'Still, {name}, no use moaning. Much.'] },
    back: { any: ['I read it. I just don\'t do anything about it.', 'Well, if it\'s you, you\'ll bounce.', 'Moaning\'s half the fun.'], ornery: ['Moaning\'s all we\'ve got.'], cheerful: ['That\'s the spirit. Chin up.'], child: ['I\'d break two legs and get cake.'] },
    sour: ['ornery', 'gloomy'],
  },
  compliment: {
    w: 0.9, when: (s, l) => WARM[relKind(s, l)] >= 0.3 && s.mood() > 0.5,
    open: { grown: ['That\'s a fine waistcoat, {name}. New?', 'I\'ve always said you\'ve the best garden in the lane.', 'Your {yourjob}\'s the talk of the village, you know.', 'You\'re looking well, {name}. {season} suits you.'], child: ['I like your hair, {name}.', 'You\'re the best at skipping. Everyone says.'] },
    reply: {
      cheerful: ['Oh, go on with you! But thank you.', 'Aren\'t you kind. I\'ll say the same of you, and mean it.'],
      ornery: ['What do you want?', 'Flattery. Hm. It\'s old, this waistcoat.'],
      shy: ['...Oh. Thank you. It\'s nothing, really.', '*blushes* You\'re very kind.'],
      curious: ['Do you think so? What is it about it?', 'Really? What have they been saying?'],
      dreamy: ['My mother made it. It still smells of her kitchen, a little.', 'That\'s the nicest thing anyone\'s said to me this {season}.'],
      witty: ['This old thing? I only wear it on days ending in y.', 'The talk of the village? That\'s usually bad news.'],
      proud: ['Yes, it is rather good, isn\'t it?', 'I know. But it\'s nice to hear it said.'],
      gloomy: ['Kind of you. I don\'t feel it.', 'Looking well? I must be a better actor than I thought.'],
      child: ['Thanks! I like yours too.', 'I know! I practised ALL summer.'],
    },
    more: { grown: ['I mean it. Don\'t let anyone tell you otherwise.', 'Well, I notice these things. Somebody should.'] },
    back: { any: ['You\'re a good sort, {name}.', 'Somebody should. Thank you.'], ornery: ['Hm. All right.'], shy: ['...Thank you.'], child: ['You\'re my best friend.'] },
    sour: ['ornery'],
  },
  joke: {
    w: 0.9, when: (s) => s.genes.wit > 0.4 || s.genes.merriness > 0.6,
    open: { grown: ['Why did the hobbit cross the river, {name}?', 'What\'s brown and sticky? ...A stick.', 'I\'d tell you the joke about the barley, but it\'s corny.', 'What do you call a dragon with no fire? Cold.'], child: ['Knock knock!', 'What\'s a cow\'s favourite day? Moo-nday!'] },
    reply: {
      cheerful: ['Ha! Ha ha! Oh, that\'s a good one.', 'I\'ll be telling that at the inn tonight.'],
      ornery: ['That\'s not funny.', 'I\'ve heard it. It wasn\'t funny then either.'],
      shy: ['*small laugh* ...I don\'t know. Why?', 'Hee. Sorry. Go on.'],
      curious: ['Why did he? Was there a pie?', 'Is that a real word, "corny"?'],
      dreamy: ['Ha. I\'ll think of that when I\'m fishing and smile to myself.', 'You\'ve a funny way of looking at things. I like it.'],
      witty: ['To get to the other side, where the jokes are better.', 'Cold? That dragon\'s not the only thing.'],
      proud: ['Ha. I\'ve a better one. Mine has a bear in it.', 'Not bad. Not up to my standard, but not bad.'],
      gloomy: ['Heh. Nothing\'s funny today, {name}, but thank you for trying.', 'Mm.'],
      child: ['Who\'s there?', 'Hahahaha! Tell another one!'],
    },
    more: { grown: ['Because the other side had a better inn!', 'Oh, tough crowd. All right, a riddle, then: what has roots nobody sees?', 'Wait, wait, I\'ve another. ...No, I\'ve forgotten it.'], child: ['Boo. ...Boo hoo! Don\'t cry, it\'s only a joke!'] },
    back: { any: ['A mountain. Everyone knows that one.', 'Forgotten it? That\'s the funniest thing you\'ve said.', 'You\'re wasted on the {job}.'], ornery: ['Thank goodness.'], cheerful: ['Oh, my sides!'], curious: ['Roots nobody sees? ...The hill? Tell me!'], child: ['Hahaha! That\'s the best one ever!'] },
    sour: ['ornery'],
  },
  song: {
    w: 0.6, when: (s, l) => (s.inside === World.inn || Game.party.on || s.isTipsy()) && s.isGrown(),
    open: { grown: ['Do you know the one about the willow lamp, {name}?', 'Sing us a verse, then. You\'ve the voice for it.', '"Oh, the road goes ever on and on..." Come on, join in.'] },
    reply: {
      cheerful: ['"...down from the door where it began!" Everybody now!', 'Only if you harmonise. Badly.'],
      ornery: ['I don\'t sing. And nor should you.', 'Not in here. Folk are eating.'],
      shy: ['Oh, I couldn\'t. Not in front of people.', '...Maybe a quiet one.'],
      curious: ['Who wrote that one, do you know? I\'ve always wondered.', 'Teach me the second verse. I only know the chorus.'],
      dreamy: ['"...and I must follow, if I can." I love that line.', 'My mother sang that over the washing. I can hear her now.'],
      witty: ['I sing like a gate in the wind. But louder.', 'I know all the words. It\'s the tune that escapes me.'],
      proud: ['I\'ll take the high part. It wants a proper voice.', 'They always ask me to lead. Naturally.'],
      gloomy: ['Not tonight. Another night, maybe.', 'I\'ve no song in me just now.'],
    },
    more: { grown: ['"...pursuing it with eager feet..." You do know it!', 'Louder! The brewer can\'t hear you!', 'There. Now the whole room\'s at it.'] },
    back: { any: ['"...until it joins some larger way!"', 'The brewer\'s heard enough of me.', 'Now look what you\'ve started.'], ornery: ['Shocking.'], shy: ['*hums along, very quietly*'] },
    sour: ['ornery', 'gloomy'],
  },
  old_days: {
    w: 0.8, when: (s, l) => s.stage === 'elder' && l.isChild(),
    open: { grown: ['When I was your age, {name}, we walked to the mill and back before breakfast.', 'Did you know the party tree was a sapling when I was small?', 'Your grandmother could skip a stone nine times. Nine!'] },
    reply: { child: ['Nine? That\'s impossible!', 'Were there dragons then?', 'Did you have cake in the old days?', 'Was it black and white when you were little?'], any: ['Is that so?'] },
    more: { grown: ['There was more mud and less cake. We made do.', 'Dragons? Only in the stories. But the stories were better.', 'Nine. I counted. Then she pushed me in.'] },
    back: { child: ['I\'m going to skip ten!', 'Tell me a story with a dragon!', 'I\'d never make do with less cake.'], any: ['Fancy that.'] },
  },
  curious_q: {
    w: 0.9, when: (s) => s.genes.curiosity > 0.55 || s.isChild(),
    open: { grown: ['Do you ever wonder what\'s past the far hills, {name}?', 'Why do you think the river bends just there, by the willow?', 'How do bees know the way home? I\'ve never understood it.'], child: ['Why is the sky blue, {name}?', 'Where do the ducks go at night?', 'How many stars are there? Have you counted?'] },
    reply: {
      cheerful: ['Ha! Now there\'s a question. More of the same, I expect. Only further.', 'Bees are cleverer than they look. Like hobbits.'],
      ornery: ['No. I\'ve enough to think about here.', 'Does it matter? The river goes where it goes.'],
      shy: ['I... I don\'t know. I\'ve wondered too.', 'Nobody\'s ever asked me that.'],
      curious: ['Every day! I\'d go and look if I had the nerve.', 'The old maps say there\'s a lake. A big one. I want to see it.'],
      dreamy: ['More rivers. More hills. Someone like us, wondering back.', 'Past the hills, past the next ones, all the way to the sea.'],
      witty: ['Past the hills? More hills, {name}. It\'s hills all the way down.', 'The ducks go to the duck inn. It\'s very exclusive.'],
      proud: ['I\'ve been as far as Bree. There\'s not much to it.', 'The storyteller asked me that once. I had to put her right.'],
      gloomy: ['Nothing good, I expect.', 'Same as here, only without a fire to come home to.'],
      child: ['Because it\'s painted! ...I think.', 'They go under the bridge. I\'ve seen them.', 'A hundred! At least.'],
    },
    more: { grown: ['One day I\'ll go and see. One day.', 'The world\'s bigger than this valley. That\'s all I know for certain.', 'The storyteller would know. Let\'s ask her.'], child: ['When I\'m big I\'m going to go and see.', 'Let\'s count them tonight!'] },
    back: { any: ['Come back and tell us, then.', 'Bigger, maybe. Not better.', 'She knows everything, that one.'], dreamy: ['Take me with you.'], ornery: ['Mind you come back.'], child: ['Me too! I\'ll come!', 'I\'ll count up to a hundred and you count the rest.'] },
    sour: ['ornery'],
  },
  riddle: {
    w: 0.6, when: (s) => s.edu >= 0.4 || s.isChild(),
    open: { grown: ['A riddle for you, {name}: what has a bed but never sleeps?', 'Riddle me this: what goes up the chimney down but not down the chimney up?', 'What gets wetter the more it dries?'], child: ['I\'ve got a riddle! What has hands but can\'t clap?', 'What\'s full of holes but holds water?'] },
    reply: {
      cheerful: ['Ooh, I know this one! ...No, I don\'t. Go on.', 'A river! No, wait. Yes, a river!'],
      ornery: ['I haven\'t time for riddles.', 'A river. Everyone knows that. Next.'],
      shy: ['Um... a river?', '...I\'m not very good at riddles.'],
      curious: ['Hmm. A bed. A bed... a river bed! Is it a river?', 'An umbrella! No... Give me a moment.'],
      dreamy: ['A river. Though it dreams, I think, even if it never sleeps.', 'A towel. Isn\'t that sad, somehow?'],
      witty: ['Me, after the inn. Oh, you mean a river.', 'A towel. And what gets drier the more it drinks? The brewer.'],
      proud: ['Child\'s play. A river.', 'Too easy. Give me a hard one.'],
      gloomy: ['A river. I used to like riddles.', 'Mm. A towel. Is that all?'],
      child: ['A clock! A clock! Was I right?', 'A sponge! My mum told me that one.'],
    },
    more: { grown: ['Right first time. Here\'s a harder one: what has a neck but no head?', 'Not bad. The storyteller\'s been teaching you.', 'A bottle. ...No, listen, that\'s the next one.'], child: ['You got it! Now you ask me one!'] },
    back: { any: ['A bottle. Now you\'re showing off.', 'She has. I\'m her best pupil. Don\'t tell her.', 'A shirt! No, a bottle!'], ornery: ['A bottle. Are we done?'], curious: ['A bottle! Another, another!'], child: ['Umm... what has four legs and goes moo?'] },
    sour: ['ornery'],
  },
  court: {
    w: 0, when: () => false, // reached only in courting mode
    strands: {
      sweet: {
        open: ['You look lovely today, {name}.', 'I like the way you laugh. Did I ever tell you that?', 'I was thinking about you all through my work today.'],
        reply: { cheerful: ['Oh, {me}! You\'ll have me blushing.', 'Go on with you. ...But say it again.'], ornery: ['Hm. Flattery. ...Don\'t stop, mind.', 'What have you done, that you\'re being so nice?'], shy: ['*looks at feet* ...Thank you.', 'Oh. Oh, {me}.'], curious: ['All through your work? What did you think about, exactly?', 'The way I laugh? What\'s it like? Nobody\'s told me.'], dreamy: ['I was thinking about you too. I think the whole valley knows.', 'Say that again when the lanterns are lit.'], witty: ['Lovely? I\'ve mud on my nose. You\'re a terrible judge.', 'You\'ve told me. I\'m keeping count. That\'s eleven.'], proud: ['I know I do. But I like hearing it from you.', 'Naturally. And you\'re not so bad yourself.'], gloomy: ['You\'re kind to say so, {me}. I don\'t feel it today.', 'Even today? With this face?'] },
        more: ['I mean every word, you know. Every one.', 'Mud and all. Especially the mud.', 'I\'ll keep saying it until you believe me.'],
        back: { any: ['I know you do.', 'Then I\'ll keep listening.', '...Go on, then. Once more.'], shy: ['*nods, smiling*'], witty: ['Twelve.'], ornery: ['See that you do.'] },
      },
      picnic: {
        open: ['Fancy a picnic up the Hill tomorrow, just the two of us?', 'Let\'s take a basket down to the river one evening, {name}.', 'Walk with me a while, {name}? Just to the bridge and back.'],
        reply: { cheerful: ['A picnic! I\'ll bake. You bring the sunshine.', 'Just try and stop me.'], ornery: ['If it doesn\'t rain. It will.', 'The Hill? My knees have opinions about the Hill.'], shy: ['...I\'d like that. Just us?', 'Yes. ...Yes, all right.'], curious: ['Up the Hill? What\'s up there I haven\'t seen?', 'Which bridge? The old one, where the swallows are?'], dreamy: ['Let\'s go somewhere we can see the stars come out.', 'To the bridge, and then past it, and then we\'ll see.'], witty: ['With your cooking? ...All right, I\'m brave.', 'To the bridge and back? Let\'s be reckless. The bridge, and then the other bridge.'], proud: ['I\'ll bring the good basket. The one with the handles.', 'I know the best spot. Nobody else does.'], gloomy: ['Maybe. I\'m poor company lately, {me}. ...But maybe.', 'If you still want to, tomorrow. Ask me tomorrow.'] },
        more: ['Then it\'s a promise. Tomorrow, after second breakfast.', 'I\'ll bring the seed-cake and you bring yourself. That\'s the whole list.', 'Past the bridge it is. Let\'s see where the lane goes.'],
        back: { any: ['A promise, then.', 'That I can manage.', 'The lane goes to Bree, you know. ...Let\'s see anyway.'], shy: ['...Tomorrow.'], gloomy: ['Tomorrow, then. Ask me tomorrow.'] },
      },
      future: {
        open: ['Do you ever think about a hole of our own, {name}? Somewhere with a round green door.', 'My mother asked after you today. Twice.', 'I\'d like to grow old and daft with you, {name}. Dafter, I mean.'],
        reply: { cheerful: ['A green door! And a kitchen big enough to dance in.', 'Twice! Then I\'d best make a good impression. I\'ll bring a pie.'], ornery: ['Green? Blue. We\'ll argue about it.', 'Dafter? You\'ve a head start.'], shy: ['...I think about it. More than I should.', 'I\'d like that. ...A lot.'], curious: ['What did she say? Tell me exactly what she said.', 'Which hill would we dig into? I\'ve been looking at the south bank.'], dreamy: ['With a window on the river, and a chair for each of us, and a third for the cat.', 'Old and daft, with the fire lit. Yes.'], witty: ['Round and green. You\'ve clearly been reading the pattern books.', 'I\'m already daft. You\'re catching up nicely.'], proud: ['A big one, mind. With a proper pantry. People will talk.', 'Your mother has excellent taste in asking after people.'], gloomy: ['Don\'t say things like that, {me}. Not unless you mean them.', 'Old, yes. I\'m not sure about the daft. I\'m not sure about much.'] },
        more: ['I mean it. I\'ve been looking at knolls.', 'She likes you. She pretends not to, but she saved you the end of the loaf.', 'Blue, green, I don\'t mind. So long as you\'re behind it.'],
        back: { any: ['Then we\'ll need a cat.', 'The end of the loaf! That\'s as good as a blessing.', 'Behind it, in front of it. Either.'], shy: ['*reaches for their hand*'], gloomy: ['...All right. I believe you. Today, I believe you.'] },
      },
    },
  },
};

const CURT_LINES = ['Mm.', 'Is that so.', 'If you say so.', '...', 'I\'m busy, {name}.', 'Not now.', 'Hm. Was there something else?', 'I heard you the first time.'];

// --- the ends of conversations ---------------------------------------------------------
const LEAVE_LINES = {
  grown: ['Well. I\'ll leave you to it.', 'I can see I\'m in the way. Good day, {name}.', 'Right. I\'ve things to be getting on with.', 'Suit yourself, {name}.', 'I\'ll not keep you, then.'],
  fine: ['I see I have caught you at a bad moment. Another time.', 'Quite. I shan\'t detain you further.'],
  child: ['Fine! I\'m going!', 'You\'re no fun today.', 'I\'ll go and find someone nicer.'],
};
const PARTING_SHOTS = { ornery: ['Good.', 'About time.', 'Mind the gate.'], gloomy: ['...Sorry, {name}. Not today.'] };
const GOODBYES = {
  spouse: ['Don\'t be late for supper.', 'Love you. Mind the mud.', 'Home by dark, now.'],
  sweetheart: ['Tomorrow, then. I\'ll be counting the hours.', 'Think of me.', 'Go on, before I say something soppy.'],
  kin: ['Give my love at home.', 'Be good. Both of us.', 'See you at supper.'],
  close: ['Same time tomorrow, {name}?', 'Mind how you go, old friend.', 'Don\'t be a stranger.', 'We must do this more often. We say that every time.'],
  friend: ['Good to see you, {name}.', 'Take care, now.', 'See you at {inn} later, maybe.'],
  acquaintance: ['Well, good day to you.', 'Mind how you go.', 'Be seeing you.'],
  stranger: ['Good day.', 'Well. Good day to you.'],
  rival: ['Until the fair, then.', 'May the best hobbit win. That\'s me, by the way.'],
  sour: ['Right.', 'Good day.'],
  child: ['Bye! See you at the oak!', 'Race you home!', 'Bye-bye!'],
};
function goodbyeLine(s, l) {
  const used = new Set();
  if (s.isChild()) return fillTalk(pickUnused(GOODBYES.child, used), s, l);
  return fillTalk(pickUnused(GOODBYES[relKind(s, l)] || GOODBYES.acquaintance, used), s, l);
}

// --- how long two folk have to say to each other ------------------------------------------
function plannedTurns(a, b) {
  const k = relKind(a, b), base = { spouse: 8, sweetheart: 8, kin: 6, close: 8, friend: 5, acquaintance: 3, stranger: 2, rival: 4, sour: 2 }[k];
  let n = base + Math.round((a.genes.sociability + b.genes.sociability - 1) * 2);
  if (a.mood() < 0.35 || b.mood() < 0.35) n -= 2;
  if (Game.raining && !a.inside) n -= 2;
  if (a.isChild() && b.isChild()) n = Math.max(2, n - 1);
  return clamp(n + R.i(-1, 2), 2, 12);
}
// what's in front of them, for the talk of food
function dishFor(v) {
  const t = v.task;
  if (t && t.data && t.data.food && t.phase === 'do' && (t.a.id === 'eat_home' || t.a.id === 'eat_inn')) {
    const sp = innSpecial();
    return t.a.id === 'eat_inn' && sp && sp.food === t.data.food ? sp.name : (typeof FOOD_SAY !== 'undefined' && FOOD_SAY[t.data.food]) || (FOODS[t.data.food] ? FOODS[t.data.food].label : null);
  }
  if (t && t.a.id === 'ale' && t.phase === 'do') return 'ale';
  return null;
}
function talkCtx(s, l) { return { dish: dishFor(s) || dishFor(l) }; }
// the openers this speaker can use: some want a child or a spouse to speak of
function openerPool(T, s) {
  if (!T.open) return null;
  if (Array.isArray(T.open)) return T.open;
  if (s.isChild()) return T.open.child || null;
  const pools = [T.open.grown, kidsOf(s).length ? T.open.kid : null, s.spouse != null ? T.open.spouse : null].filter((p) => p && p.length);
  return pools.length ? pools.flat() : null;
}
// a topic that suits these two, here and now, and hasn't come up already
function pickTopic(s, l, conv) {
  const ctx = talkCtx(s, l), opts = [];
  for (const k in TOPICS) {
    const T = TOPICS[k];
    if (!T.w || conv.topics.includes(k)) continue;
    let ok = false; try { ok = T.when(s, l, ctx); } catch (e) { ok = false; }
    if (!ok) continue;
    if (!openerPool(T, s)) continue;
    opts.push([T.w * (k === 'food_here' && ctx.dish ? 2 : 1), k]);
  }
  return opts.length ? R.weighted(opts) : null;
}

// --- the conversation itself ---------------------------------------------------------------
// The state lives on the leader's task: who's on, which topic, the turn
// within it, what's been said, and how many turns are planned.
function newConversation(a, b, mode) {
  return { a, b, mode, plan: mode === 'court' ? plannedTurns(a, b) + 2 : plannedTurns(a, b), turn: 0, topics: [], topic: null, step: 0, used: new Set(), temper: { [a.id]: temperOf(a), [b.id]: temperOf(b) }, sour: 0, kind: { [a.id]: relKind(a, b), [b.id]: relKind(b, a) }, opener: null, ended: false, memory: null };
}
// Does the speaker walk off after that?
function wouldLeave(s, l, conv) {
  const warm = WARM[conv.kind[s.id]];
  const p = 0.3 + s.genes.temper * 0.35 + (1 - s.genes.sociability) * 0.15 + (s.mood() < 0.4 ? 0.15 : 0) - warm * 0.3 + conv.sour * 0.2;
  return R.chance(clamp(p, 0.05, 0.9));
}
// The next thing said: { who, to, text, end, sour }. Returns null when it's over.
function nextTurn(conv) {
  const { a, b } = conv;
  if (conv.ended) return null;
  // quarrels and newcomers' questions keep their own lines
  if (conv.mode === 'quarrel') {
    const who = conv.turn % 2 ? b : a, to = who === a ? b : a;
    conv.turn++;
    if (conv.turn > conv.plan) { conv.ended = true; return { who, to, text: lineFor(who, 'quarrel', { name: to.first }), end: true }; }
    return { who, to, text: lineFor(who, 'quarrel', { name: to.first }) };
  }
  // the planned length is up: whoever's turn it is takes their leave
  if (conv.turn >= conv.plan && conv.step !== 1) {
    const who = conv.opener === a ? b : a, to = who === a ? b : a;
    conv.ended = true;
    return { who, to, text: goodbyeLine(who, to), end: true };
  }
  // a new topic: the one who didn't open the last opens this
  if (conv.topic == null || conv.step >= 4) {
    const s = conv.opener == null ? (conv.mode === 'court' ? a : R.chance(0.5) ? a : b) : (conv.opener === a ? b : a), l = s === a ? b : a;
    conv.opener = s; conv.step = 0;
    // first, anything they've a message to pass on (a tip, a rave, an invitation) or news
    if (conv.mode !== 'court' && !s.isChild() && conv.turn > 0 && R.chance(0.35)) {
      const n = typeof newsToTell === 'function' ? newsToTell(s, l) : null;
      if (n) { conv.topic = 'news'; conv.step = 1; conv.turn++; conv.topics.push('news:' + n.id); l.pendingReply = 'surprise'; return { who: s, to: l, text: tellNews(s, l, n) }; }
      const msg = composeMessage(s, l);
      if (msg) { deliver(s, l, msg); conv.topic = 'message'; conv.step = 1; conv.turn++; conv.topics.push('message'); return { who: s, to: l, text: msg.text }; }
    }
    // sweethearts talk of each other, and of what's to come, before anything else
    const courting = conv.mode === 'court' && conv.topics.filter((t) => t.startsWith('court')).length < 2 && R.chance(conv.topics.length ? 0.6 : 1);
    const k = courting ? 'court' : pickTopic(s, l, conv);
    if (!k) { conv.ended = true; return { who: s, to: l, text: goodbyeLine(s, l), end: true }; }
    conv.step = 1; conv.turn++;
    let T = TOPICS[k];
    if (k === 'court') {
      const names = Object.keys(T.strands).filter((n) => !conv.topics.includes('court:' + n));
      const n = R.pick(names.length ? names : Object.keys(T.strands));
      conv.topics.push('court:' + n); T = conv.strand = T.strands[n];
    } else { conv.topics.push(k); conv.strand = null; }
    conv.topic = k;
    if (T.memory) conv.memory = s.memories.find((m) => m.d === Game.day) || s.memories.find((m) => m.d === Game.day - 1);
    return { who: s, to: l, text: fillTalk(pickUnused(openerPool(T, s), conv.used), s, l, talkCtx(s, l)) };
  }
  const s = conv.opener, l = s === a ? b : a;
  const T = conv.strand || TOPICS[conv.topic];
  if (conv.step === 1) {
    // the listener answers, in their own manner
    conv.step = 2; conv.turn++;
    if (conv.topic === 'news' || conv.topic === 'message') {
      const kind = l.pendingReply || 'reply'; l.pendingReply = null;
      conv.step = 4; // these threads are a line and an answer
      return { who: l, to: s, text: lineFor(l, kind, { name: s.first }) || 'Is that so?' };
    }
    const temper = conv.temper[l.id];
    let pool = replyPool(T.reply, l, temper);
    // a curt answer: from a grump by nature, or from anyone tired, low, or no friend of the speaker
    const rel = l.rel[s.id] ?? 0.1;
    const sourOn = T.sour || SOUR_DEFAULT;
    const pSour = (sourOn.includes(temper) ? 0.65 : 0) + (l.mood() < 0.4 ? 0.3 : 0) + (rel < 0 ? 0.4 : 0) + (l.drives.tired > 0.7 ? 0.2 : 0) + (conv.kind[l.id] === 'rival' ? 0.15 : 0);
    const sour = !l.isChild() && R.chance(Math.min(0.85, pSour * (conv.mode === 'court' ? 0.4 : 1)));
    if (sour) { conv.sour++; if (!sourOn.includes(temper) || !pool) pool = CURT_LINES; }
    return { who: l, to: s, text: fillTalk(pickUnused(pool, conv.used) || 'Mm.', l, s, talkCtx(l, s)), sour };
  }
  if (conv.step === 2) {
    // the opener follows it up, unless the answer sent them off
    if (conv.sour && wouldLeave(s, l, conv)) {
      conv.ended = true; conv.left = s;
      const pool = s.isChild() ? LEAVE_LINES.child : register(s) === 'fine' ? LEAVE_LINES.fine : LEAVE_LINES.grown;
      return { who: s, to: l, text: fillTalk(pickUnused(pool, conv.used), s, l), end: true, snub: true };
    }
    conv.step = 3; conv.turn++;
    let text;
    if (T.memory && conv.memory) text = conv.memory.t;
    else text = fillTalk(pickUnused(poolFor(T.more, s), conv.used) || '', s, l, talkCtx(s, l));
    if (!text) { conv.step = 4; return nextTurn(conv); }
    return { who: s, to: l, text };
  }
  // the listener's second word, then on to something else
  conv.step = 4; conv.turn++;
  const temper = conv.temper[l.id];
  const pool = replyPool(T.back, l, temper) || (T.back && T.back.any);
  const text = fillTalk(pickUnused(pool, conv.used) || '', l, s, talkCtx(l, s));
  if (!text) return nextTurn(conv);
  return { who: l, to: s, text };
}

// --- running it on the two who are talking -------------------------------------------------
{
  const chatTick = Villager.prototype.chatTick;
  Villager.prototype.chatTick = function (task, dt) {
    const p = task.partner;
    if (!task.data.leader) return;
    // toddlers, and newcomers asking their questions, keep the old exchange
    if (task.data.ask || register(this) === 'toddler' || register(p) === 'toddler' || p.stage === 'baby') return chatTick.call(this, task, dt);
    task.data.talkT = (task.data.talkT || 0) - dt;
    if (task.data.talkT > 0) return;
    task.data.talkT = R.f(3, 5);
    let conv = task.data.conv;
    if (!conv) {
      const court = task.data.court && (this.spouse !== p.id || R.chance(0.35));
      conv = task.data.conv = newConversation(this, p, task.data.quarrel ? 'quarrel' : court ? 'court' : null);
      // the natter lasts as long as they've things to say
      const mins = conv.plan * 4.5 + 8;
      task.t = Math.max(task.t, mins); if (p.task && p.task.a.id === 'chat' && p.task.partner === this) p.task.t = Math.max(p.task.t, mins);
      if (Game.selected === this || Game.selected === p) devLog('talk', `${this.first} (${conv.temper[this.id]}) and ${p.first} (${conv.temper[p.id]}) settle in for ${conv.plan} turns: ${conv.kind[this.id]}`);
    }
    const turn = nextTurn(conv);
    if (!turn) { task.t = Math.min(task.t, 0.5); if (p.task && p.task.partner === this) p.task.t = Math.min(p.task.t, 0.5); return; }
    turn.who.say(turn.text, undefined, { to: turn.to });
    if (Game.selected === this || Game.selected === p) devLog('talk', `${turn.who.first} → ${turn.to.first} [${conv.topic}${turn.sour ? ', sour' : ''}${turn.end ? ', end' : ''}]: "${turn.text}"`);
    // a friend happening by may make it three
    if (!turn.end && !conv.mode && conv.turn >= 2 && !this.inside && R.chance(0.12) && typeof tryJoin === 'function' && tryJoin(this, p)) return;
    if (conv.mode === 'quarrel') FX.puff(turn.who.x, turn.who.y - 20);
    else if (conv.mode === 'court' && R.chance(0.5)) FX.hearts((this.x + p.x) / 2, Math.min(this.y, p.y) - 18);
    else if (!turn.sour) { this.bond(p, 0.004); shareWays(this, p); }
    if (this.chem.germs > 0.3 && Math.random() < 0.05 * (1.2 - p.genes.hardiness)) p.catchCold(this.first);
    if (turn.end) {
      // a word or two to see them off, then both go about their day
      const left = conv.left, other = left ? (left === this ? p : this) : null;
      if (left) {
        feel(left, 'snubbed', other.first); left.bond(other, -0.03);
        left.remember(`${other.first} was short with me. I left them to it.`, -1);
        if (Game.selected === left || Game.selected === other) devLog('talk', `${left.first} walks off: ${other.first} was in a mood`);
        if (WARM[conv.kind[left.id]] >= 0.6 && R.chance(0.2)) chronicle(`${left.first} left ${other.first} to it in the lane: ${other.first} was in no mood for company.`, 'quarrel');
        const shot = PARTING_SHOTS[conv.temper[other.id]];
        if (shot && R.chance(0.6)) setTimeout(() => { if (other.task && other.task.a.id === 'chat') other.say(fillTalk(R.pick(shot), other, left), undefined, { to: left }); }, 1200);
      } else if (conv.mode !== 'quarrel' && conv.turn >= 6) {
        for (const v of [this, p]) { const o = v === this ? p : this; if ((v.rel[o.id] ?? 0) > 0.2) feel(v, 'long_chat', o.first); }
        this.bond(p, 0.03);
        if (conv.turn >= 9 && R.chance(0.25)) this.remember(`A proper long natter with ${p.first}.`, 1);
      }
      const end = (v) => { if (v.task && v.task.a.id === 'chat') v.task.t = Math.min(v.task.t, left ? 1 : 3); };
      end(this); end(p);
    }
  };
}

// --- table talk: everyone at the table takes a turn ------------------------------------------
// A round at supper or in the taproom: a topic (the food, first of all),
// each in turn answering in their manner, then a follow-up and a last word.
// The lines fall a few minutes apart, so the thread reads as a meal.
const TABLE_OPEN = {
  food: { grown: ['Nothing beats {dish} after a day like today.', 'Who cooked? The {dish} wants congratulating.', 'Pass the bread, somebody. The {dish} needs mopping up.', 'I\'ll have seconds of the {dish} if nobody objects.'], child: ['Mmm, {dish}!', 'Can I have the crusty bit?'] },
  day: { grown: ['So. How was everyone\'s day?', 'Worn to a thread, I am. What a day at work!', 'Anything happen while I was out at work?'], child: ['Guess what happened at the oak today!', 'I saw a rabbit as big as a dog. Honest.'] },
  ale: { grown: ['Good drop, this. The brewer\'s outdone herself.', 'To the brewer! And to the roof over our heads.', 'Another round, and then I really must go. Probably.'] },
  song: { grown: ['Right. Who knows the one about the willow lamp? All together now.', '"Oh, the road goes ever on and on..." Come on, I\'m not singing this alone.', 'A song! A song! {name}, you start, you\'ve the voice.'] },
  tale: { grown: ['Did I ever tell you lot about the winter the river froze clean through?', 'Hush, now. This is a true story, and I was there for most of it.', 'My grandfather swore the Hill had a door in it nobody could find. Listen.'] },
};
const TABLE_REPLY = {
  food: {
    cheerful: ['Best meal I\'ve had all week!', 'Seconds for me too, and no shame in it.'], ornery: ['Bit salty. I\'ve had worse.', 'Pass it here before it goes cold.'], shy: ['It\'s lovely. ...Thank you.', '*eats quietly, nodding*'], curious: ['Is that thyme I can taste? Or sage?', 'How long does it take, a {dish} like this?'],
    dreamy: ['Tastes of the whole {season}, this.', 'My gran made this. I can see her table.'], witty: ['Careful, you\'ll wear through the plate.', 'I\'d marry the cook if I weren\'t already spoken for. Or was.'], proud: ['Not how I\'d do it, but it\'ll serve.', 'Mine\'s better. But this is close.'], gloomy: ['I\'ve not much appetite. You have mine.', 'Fine. It\'s fine.'],
    child: ['I want the crusty bit!', 'Can I leave the greens?', 'Is there pudding?'],
  },
  day: {
    cheerful: ['Oh, grand! Sun on my back all day.', 'Can\'t complain. Wouldn\'t if I could.'], ornery: ['Long. Don\'t ask.', 'Same as yesterday. And tomorrow.'], shy: ['Quiet. ...Quiet\'s nice.', 'Nothing much. Just work.'], curious: ['I found a snail with a stripe I\'ve never seen. Blue-ish.', 'I\'ve been wondering why the mill wheel squeaks on the turn.'],
    dreamy: ['I watched the clouds for an hour. Didn\'t mean to.', 'I walked the long way home. The light on the river...'], witty: ['Thrilling. I counted turnips. Eleven thousand.', 'I survived. That\'s the main thing.'], proud: ['Did twice the work of anyone, as usual.', 'The Steward noticed my fence. Of course she did.'], gloomy: ['Got through it.', 'Mm.'],
    child: ['I fell in the ditch! It was brilliant!', 'The storyteller said a word I don\'t know. Nincompoop.', 'I learned my letters up to M!'],
  },
  song: {
    cheerful: ['"...down from the door where it began!" Everybody!', 'Louder! The brewer can\'t hear us!'], ornery: ['Not in here. Folk are eating.', 'I don\'t sing. Watch me not sing.'], shy: ['*hums along, very quietly*', '...I only know the chorus.'], curious: ['Who wrote it, do you know? It\'s older than the inn.', 'Teach me the second verse!'],
    dreamy: ['"...and I must follow, if I can." That\'s my line.', 'My mother sang this over the washing.'], witty: ['I know all the words. The tune\'s the trouble.', 'I sing like a gate in the wind. Louder, mind.'], proud: ['I\'ll take the high part. It wants a proper voice.', 'They always ask me to lead.'], gloomy: ['Not tonight. ...Oh, go on, just the chorus.', '"...pursuing it with eager feet..." I always liked that bit.'],
    child: ['I know this one! LA LA LA!', 'Sing the dragon one!'],
  },
  tale: {
    cheerful: ['Go on, then! Don\'t leave out the pie.', 'I\'ve heard it, and I\'ll hear it again.'], ornery: ['You\'ve told it. Twice.', 'Is this a long one? I\'ve an ale to finish.'], shy: ['...Please.', '*pulls the stool closer*'], curious: ['A door? Where? Did anyone look?', 'Clean through? Could you walk on it?'],
    dreamy: ['I can see it like I was there.', 'Tell it slow.'], witty: ['It gets better every time. Longer, too.', 'Most of it true? Which half?'], proud: ['My grandfather told it differently. Yours will do.', 'I was there for the end of that one, you know.'], gloomy: ['Those were the days, I suppose.', 'Nothing like that happens any more.'],
    child: ['Was it a dragon? Say it was a dragon!', 'Tell it! Tell it!'],
  },
  ale: {
    cheerful: ['To the brewer!', 'Hear, hear! And another!'], ornery: ['It\'s ale. It does the job.', 'Mind you don\'t sing, {name}.'], shy: ['*raises mug, says nothing*', 'Just the one for me.'], curious: ['What\'s in this batch? There\'s something different.', 'How do they get it so clear?'],
    dreamy: ['Good ale and a warm room. What else is there?', 'Here\'s to the road, and to coming home off it.'], witty: ['One more and I\'ll be able to play the fiddle. Badly.', 'I drink to forget. Forget what? I forget.'], proud: ['I could brew better. I\'ve said so.', 'They water it. I can tell.'], gloomy: ['Here\'s to absent friends.', 'Another, landlord. Don\'t ask why.'],
  },
};
const TABLE_MORE = {
  food: { grown: ['There\'s pudding after. Leave room, {name}.', 'Eat up, there\'s a long {season} ahead.', 'A meal like this is what a day\'s for.'], child: ['I\'m going to grow as tall as the oak!'] },
  day: { grown: ['Well, we\'re all here, and the fire\'s lit. That\'s enough.', 'Early night for me, I think.', 'Tomorrow\'s another day, as they say. They say it a lot.'], child: ['Can I stay up? Just a bit?'] },
  ale: { grown: ['Right. One more, then home, before {spouse} sends out a search party.', 'Landlord! Same again all round.', 'Mind the step on the way out. I always forget the step.'] },
  song: { grown: ['"...until it joins some larger way!" Now the whole room\'s at it.', 'One more verse and then the slow one. The sad one. You know the one.', 'There! Now that\'s what I call a Mersday. Even if it\'s not Mersday.'] },
  tale: { grown: ['Three days we were snowed in. Three! And only one pack of cards.', 'And the strangest thing was, nobody ever saw the fiddler again.', 'I swear every word of it. Most of them, anyway.'] },
};
const TABLE_LAST = { any: ['Hear, hear.', 'Aye, well.', 'Pass the salt.', 'Well said.'], ornery: ['Hm.'], cheerful: ['Lovely!', 'That\'s the spirit.'], gloomy: ['Mm.'], child: ['Pudding!', 'Can I get down?'] };
const TABLE_LAST_SONG = { any: ['*applause*', 'Again! From the top!', 'My throat\'s gone.'], ornery: ['Thank goodness that\'s over.'], child: ['Again! Again!'] };
const TABLE_LAST_TALE = { any: ['Well I never.', 'And that\'s a true story, is it?', 'Another! The one with the bear.'], ornery: ['Mm. Sounds like a lot of fuss.'], curious: ['But what happened to the pie?'], child: ['Tell the dragon bit again!'] };

function roundsList() { return Game.rounds || (Game.rounds = []); }
// Starts a round at a table: who's there, the topic, the first line soon.
function startRound(b, folk) {
  const atInn = b === World.inn || !!(b.isInn), dish = folk.map(dishFor).find(Boolean);
  let topic = dish && dish !== 'ale' ? 'food' : dish === 'ale' ? 'ale' : R.chance(0.6) ? 'day' : null;
  // in the taproom of an evening, with a few in, a song may go up, or a tale from an elder
  if (atInn && folk.length >= 3 && Game.hour >= 19) { const r = Math.random(); if (r < 0.3) topic = 'song'; else if (r < 0.45 && folk.some((v) => v.stage === 'elder')) topic = 'tale'; }
  if (!topic) return null;
  const h = Game.hour, meal = h < 9.5 ? 'over breakfast' : h < 11.5 ? 'at elevenses' : h < 14 ? 'over lunch' : h < 17 ? 'at tea' : h < 20.5 ? 'at supper' : 'at table';
  const where = atInn ? `at ${b.name}` : `${meal} in ${b.name}`;
  const round = { b, ids: folk.map((v) => v.id), topic, dish, step: 0, next: Game.time + R.f(0.5, 1.5), used: new Set(), temper: {}, said: new Set(), thread: null, where, turns: 0 };
  for (const v of folk) round.temper[v.id] = temperOf(v);
  roundsList().push(round);
  return round;
}
function roundTick() {
  const R0 = roundsList();
  for (let i = R0.length - 1; i >= 0; i--) {
    const r = R0[i];
    if (Game.time < r.next) continue;
    const folk = r.ids.map(personById).filter((v) => v && v.inside === r.b && !(v.task && ['sleep', 'lodge'].includes(v.task.a.id)));
    if (r.step >= 5 && folk.length >= 2 && r.turns < 9 && R.chance(0.75)) {
      // another topic while they're still sat there
      const nexts = ['day', 'news', 'food', 'song', 'tale'].filter((t) => t !== r.topic && (t !== 'food' || (r.dish && r.dish !== 'ale')) && (t !== 'song' || (r.b === World.inn && folk.length >= 3)) && (t !== 'tale' || folk.some((v) => v.stage === 'elder')) && t !== 'news');
      // nothing left worth saying: the round is over
      if (!nexts.length) { r.step = 5; r.next = Game.time; continue; }
      r.topic = R.pick(nexts); r.step = 0; r.said = new Set(); r.next = Game.time + R.f(2, 4);
      continue;
    }
    if (folk.length < 2 || r.step >= 5) { if (r.thread && r.turns >= 3) for (const v of folk) feel(v, 'table_talk'); R0.splice(i, 1); continue; }
    // anyone who has since sat down at the table joins the round
    for (const v of Game.villagers) if (v.inside === r.b && !r.ids.includes(v.id) && v.stage !== 'baby' && register(v) !== 'toddler' && v.task && v.task.phase === 'do' && ['eat_home', 'eat_inn', 'ale'].includes(v.task.a.id) && r.ids.length < 6) { r.ids.push(v.id); r.temper[v.id] = temperOf(v); if (r.thread) logGroupLine(r.thread, v, null); }
    r.next = Game.time + R.f(1.5, 2.5);
    let who, text;
    const ctx = { dish: r.dish && r.dish !== 'ale' ? r.dish : null };
    if (r.step === 0) {
      who = (r.topic === 'tale' ? folk.find((v) => v.stage === 'elder') : null) || folk.find((v) => !v.isChild()) || folk[0];
      text = fillTalk(pickUnused(poolFor(TABLE_OPEN[r.topic], who), r.used), who, folk.find((o) => o !== who), ctx);
      r.opener = who.id;
    } else if (r.step === 1) {
      // everyone else answers in turn, one line each
      const left = folk.filter((v) => v.id !== r.opener && !r.said.has(v.id));
      if (!left.length) { r.step = 2; r.next = Game.time; continue; }
      who = left[0]; r.said.add(who.id);
      const RT = TABLE_REPLY[r.topic] || TABLE_REPLY.day;
      text = fillTalk(pickUnused(replyPool(RT, who, r.temper[who.id]) || RT.cheerful || RT.any, r.used) || 'Mm.', who, personById(r.opener) || folk[0], ctx);
      if (left.length > 1) r.step = 0.5; // stay on the replies
    } else if (r.step === 2) {
      who = personById(r.opener) || folk[0];
      text = fillTalk(pickUnused(poolFor(TABLE_MORE[r.topic], who), r.used) || '', who, folk.find((o) => o !== who), ctx);
    } else {
      who = R.pick(folk.filter((v) => v.id !== r.opener)) || folk[0];
      const LAST = r.topic === 'song' ? TABLE_LAST_SONG : r.topic === 'tale' ? TABLE_LAST_TALE : TABLE_LAST;
      text = fillTalk(pickUnused(replyPool(LAST, who, r.temper[who.id]) || LAST.any, r.used) || pickUnused(LAST.any, r.used), who, personById(r.opener) || folk[0], ctx);
      r.step = 4;
    }
    if (r.step === 0.5) r.step = 1; else if (r.step < 4) r.step = Math.floor(r.step) + 1; else r.step = 5;
    if (!text || !who) continue;
    r.turns++;
    who.say(text, undefined, { to: folk.find((o) => o !== who) });
    if (!r.thread) r.thread = talkGroupThread(folk, r.where);
    logGroupLine(r.thread, who, text);
    if (r.turns >= 3 && r.turns % 3 === 0) for (const v of folk) { feel(v, r.topic === 'song' ? 'singsong' : 'table_talk'); for (const o of folk) if (o !== v) v.bond(o, 0.004); }
    if (r.topic === 'song' && r.thread) r.thread.kind = 'song';
    if (r.topic === 'tale' && r.thread) r.thread.kind = 'tale';
  }
}
// At meal and taproom hours, a round starts wherever folk share a table.
function tableRounds(h) {
  const rooms = new Map();
  for (const v of Game.villagers) {
    if (!v.inside || v.stage === 'baby' || v.leaving || register(v) === 'toddler' || !v.task || v.task.phase !== 'do' || !['eat_home', 'eat_inn', 'ale'].includes(v.task.a.id)) continue;
    if (!rooms.has(v.inside)) rooms.set(v.inside, []);
    rooms.get(v.inside).push(v);
  }
  for (const [b, folk] of rooms) {
    if (folk.length < 2 || roundsList().some((r) => r.b === b)) continue;
    const atInn = b === World.inn || !!b.isInn;
    if (!R.chance(atInn ? 0.8 : 0.75)) continue;
    startRound(b, folk.slice(0, 5));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // rounds are started every so often, and tick with the world
  const uw = updateWorld;
  updateWorld = function (dtMin, raining, season, hour) {
    const r = uw(dtMin, raining, season, hour);
    if (Game.started) {
      Game._roundT = (Game._roundT || 0) + dtMin;
      if (Game._roundT >= 6) { Game._roundT = 0; tableRounds(hour); }
      roundTick();
    }
    return r;
  };
  const nv = newVillage;
  newVillage = function () { Game.rounds = []; return nv(); };
  // the old hourly room talk is covered by the rounds now
  roomTalk = function () {};
});
