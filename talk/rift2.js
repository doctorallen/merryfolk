'use strict';
// ---------------------------------------------------------------------------
// The rift-born among the hill-folk: second breakfast and the great scone
// question, the customs they've learned and the ones they've taught, the
// wariness they meet and the friends who got past it, the Relay and the
// static under it, the Lamplighter they grew up under, a word or two of
// rift-talk, the things they ask the wizard, and the children growing up
// between two worlds. Reads the facts set in talk/rift.js.
// ---------------------------------------------------------------------------

talkPack('rift2', () => {
  const hookTo = (id) => (T, v) => { const b = bondFull(v); if (!b.hooks.some((h) => h.thread === id && h.d === Game.day)) b.hooks.unshift({ k: id, thread: id, d: Game.day }); b.hooks.length = Math.min(b.hooks.length, 12); };
  // a kind word from the wizard about someone wary softens them (as a kind post on the Relay does)
  const softenElder = (T, v) => { const n = T.F.riftElder; const o = n && Game.villagers.find((x) => x.first === n); if (o && typeof relay === 'function') { const r = relay(); const s = r.soft || (r.soft = {}); s[o.id] = Math.min(0.6, (s[o.id] || 0) + 0.12); } };
  const fragHas = (k) => (F) => (F.riftFrags || []).includes(k);

  // --- Second breakfast, scones and tea ---------------------------------------------------
  addThread({
    id: 'rift.food', label: 'Have we fed you properly?', weight: 1, cool: 3,
    when: (F) => F.rift,
    rel: (F) => (F.hungry ? 1.6 : F.hour === 'morning' ? 1.3 : 0.9),
    open: { jest: 'rift.food.open' },
    beats: {
      start: { line: 'rift.food.start', go: [
        { ap: 'ask', say: 'What did you eat, back home?', to: 'paste' },
        { ap: 'jest', say: 'rift.food.jest', label: 'Tease them about scones', to: 'scones' },
        { ap: 'ask', say: 'And tea? Have we converted you?', to: 'tea' },
      ] },
      paste: { line: 'rift.food.paste', go: [
        { ap: 'warm', say: 'Then you\'ve a great deal of eating to catch up on.', to: 'catchup' },
        { ap: 'ask', say: 'Is there anything you miss, from home?', to: 'missfood' },
      ] },
      scones: { line: 'rift.food.scones', fx: { joke: { k: 'rift.scones', t: 'Hobbit scones should be registered as weapons.' } }, go: [
        { ap: 'jest', say: 'rift.food.jest2', label: 'Keep it going', to: 'sconewar' },
        { ap: 'ask', say: 'Have you tried baking them yourself?', to: 'baking' },
      ] },
      tea: { line: 'rift.food.tea', go: [
        { ap: 'ask', say: 'So which is it, a stimulant or a ritual?', to: 'ritual' },
        { ap: 'warm', say: 'You\'ll be a proper hobbit yet.', to: 'proper' },
      ] },
      missfood: { line: 'rift.food.missfood', go: [
        { ap: 'advise', say: 'Cook it for the Badger. They\'d love it.', to: 'ramen' },
        { ap: 'ask', say: 'Could you make it here, with what we have?', to: 'ramen' },
      ] },
      catchup: { line: 'rift.food.catchup', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'And tea? Have we converted you?', to: 'tea' },
        { ap: 'jest', say: 'Elevenses is at eleven. Don\'t be late.', to: 'proper' },
      ] },
      sconewar: { line: 'rift.food.sconewar', fx: { fond: 0.02 }, end: true },
      baking: { line: 'rift.food.baking', go: [
        { ap: 'warm', say: 'The first batch is always for the birds.', to: 'proper' },
        { ap: 'ask', say: 'And tea? Have we converted you?', to: 'tea' },
      ] },
      ritual: { line: 'rift.food.ritual', go: [
        { ap: 'ask', say: 'A kettle? Like the one on your sleeve?', to: 'kettle', need: { when: fragHas('sigil') } },
        { ap: 'warm', say: 'Then you\'ve understood tea better than most hobbits.', to: 'proper' },
      ] },
      proper: { line: 'rift.food.proper', fx: { fond: 0.02 }, end: true },
      ramen: { line: 'rift.food.ramen', fx: { respect: 0.02, remember: 'The wizard said I should cook for the village.' }, end: true },
      kettle: { line: 'rift.food.kettle', fx: { trust: 0.03 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('rift.food.open', [
    { text: ['Have we fed you properly yet, {name}? You still look a bit city.', 'How many meals today, {name}? Be honest.'] },
    { if: { hour: 'morning' }, text: ['Had your second breakfast, {name}? Or are you still on the first?'] },
    { if: { hungry: true }, text: ['You look hungry, {name}. That\'s a crime in this valley.'] },
  ]);
  lines('rift.food.start', [
    { text: ['Properly? I\'ve eaten more in a month here than a year back home. I\'ve had to let out a waistcoat.', 'Fed? Wizard, I\'m being fed like a prize pig. Seven times a day. I counted.'] },
    { if: { temper: 'cheerful' }, text: ['Fed! I\'ve found second breakfast! Why did nobody tell me about second breakfast?', 'Oh, I\'m fed. I\'m so fed. I\'m the most fed I\'ve ever been. Look at me. Glowing.'] },
    { if: { temper: 'ornery' }, text: ['Too properly. Every door I pass, someone shoves a pie at me. I can\'t walk to the mill without a picnic.'] },
    { if: { temper: 'shy' }, text: ['Oh, very well. Everyone keeps giving me things. I don\'t know how to say no politely.'] },
    { if: { temper: 'proud' }, text: ['I eat what I\'m given and I give back. I made a broth last week. They\'re still talking about it.'] },
    { if: { temper: 'curious' }, text: ['Seven meals! I\'ve been mapping them. Breakfast, second breakfast, elevenses, luncheon... is there a pattern?'] },
    { if: { temper: 'dreamy' }, text: ['Every meal here tastes like a field. Like sunshine got cooked. I don\'t know how else to say it.'] },
    { if: { temper: 'witty' }, text: ['Properly? I\'ve put on so much weight my visor sits differently. It\'s a hardware issue now.'] },
    { if: { temper: 'gloomy' }, text: ['Well enough. Too well. I feel guilty, eating. Back home they\'re rationing.'] },
    { if: { stage: 'child' }, text: ['I had FOUR breakfasts! Mom only knows about two!'] },
    { if: { hungry: true }, pri: 1, text: ['Not lately. Running on low battery. Is there pie? There\'s usually pie.'] },
    { if: { riftCustoms: 'breakfast' }, pri: 1, text: ['Second breakfast. I\'m a convert. A zealot. I\'ve started telling the others they\'re doing mornings wrong.'] },
  ]);
  lines('rift.food.jest', [
    { text: ['Have you survived a hobbit scone yet? Some don\'t.', 'I hear you tried to charge your visor with a scone.'] },
    { if: { riftKnack: 'cook' }, text: ['A noodle cook, faced with a scone. How did that battle go?'] },
  ]);
  lines('rift.food.jest2', [{ text: ['They used one to wedge the mill door. It\'s held for forty years.', 'The Badger uses last week\'s for doorstops. And for the darts.'] }]);
  lines('rift.food.paste', [
    { text: ['Printed paste. Comes in four flavors: beige, other beige, green, and Tuesday.', 'Noodles from a machine. Protein bars. The odd real dumpling if you knew someone.'] },
    { if: { riftHome: 'the noodle stall under the overpass' }, pri: 1, text: ['Pak\'s broth. Under the overpass. When I could afford it, which was often, because Pak didn\'t charge me.'] },
    { if: { riftHome: 'the night market' }, pri: 1, text: ['The night market. Skewers, dumplings, things on sticks. Never asked what the things were. Better not.'] },
    { if: { riftHome: 'the rooftop gardens' }, pri: 1, text: ['Lettuce. A lot of lettuce. I grew it. Lettuce for breakfast, lettuce for tea. I can\'t look at lettuce now.'] },
    { if: { riftKnack: 'cook' }, pri: 1, text: ['Mine! I fed half the stack. Mushroom broth, chilli oil, noodles I pulled myself. I miss my pot.'] },
    { if: { temper: 'gloomy' }, text: ['Whatever there was. Less of it, at the end. You stood in line. Sometimes you stood in line and there wasn\'t any.'] },
    { if: { temper: 'witty' }, text: ['Algae. Lovingly shaped into the idea of a sausage. The idea was the best part.'] },
    { if: { stage: 'child' }, text: ['Squishy stuff from a tube. It was blue. Your food is lots of colors! And it\'s NOT squishy!'] },
  ]);
  lines('rift.food.scones', [
    { text: ['A scone. Ha! First one, I thought it was a stone someone had buttered. I still went back for three.', 'Survived? Barely. Then I discovered cream. And jam. Now I\'m in too deep.'] },
    { if: { temper: 'ornery' }, text: ['I chipped a tooth on a scone. The baker said I was "eating it wrong". How do you eat a scone wrong?'] },
    { if: { temper: 'witty' }, text: ['Scones should be registered as weapons. One fell off a shelf at the Badger and dented the floor.'] },
    { if: { temper: 'cheerful' }, text: ['Scones are the best thing in two universes! I\'d marry a scone. Don\'t tell the baker.'] },
    { if: { temper: 'proud' }, text: ['I\'ve mastered the scone. Jam first, then cream. I\'ve been told that\'s heresy. I\'ll die on that hill.'] },
    { if: { temper: 'shy' }, text: ['...I hide them in my pockets. For later. Everyone does it, I think? Do they?'] },
    { if: { temper: 'curious' }, text: ['Scones! Why do they crumble upward? I\'ve had six and I still don\'t understand the physics.'] },
    { if: { riftKnack: 'cook' }, pri: 1, text: ['I won. Barely. I\'ve worked out their secret. Cold butter and a bad temper. I\'ve got both.'] },
    { if: { stage: 'child' }, text: ['I threw one at Bramax and it bounced! Then I ate it.'] },
  ]);
  lines('rift.food.sconewar', [
    { text: ['Doorstops! Ha! That\'s not a joke, is it? It\'s not. I\'ve seen it.', 'I\'m telling the baker you said that. Run.'] },
    { if: { temper: 'witty' }, text: ['Then we\'ll build the Relay out of them. Weatherproof. Lightning-proof. Wizard-proof.'] },
    { if: { temper: 'ornery' }, text: ['Hmph. Don\'t say that near me after the baker\'s been kind. I\'ve got loyalties now.'] },
  ]);
  lines('rift.food.baking', [
    { text: ['Tried. The first lot came out black. The second lot came out flat. The hens ate them and looked at me.', 'Once. The innkeeper took one look and quietly put them in the pig bucket. Kindly, though.'] },
    { if: { riftKnack: 'cook' }, text: ['Of course! I\'ve put chilli in mine. The hill-folk cried. Then they asked for more.'] },
    { if: { temper: 'proud' }, text: ['They came out perfect. First go. The baker\'s not spoken to me since.'] },
    { if: { temper: 'shy' }, text: ['I made some for my neighbors. I left them on the step and ran. I don\'t know if they liked them.'] },
  ]);
  lines('rift.food.tea', [
    { text: ['Tea! Hot leaf water, five times a day, and it fixes everything. I\'m suspicious. And addicted.', 'Converted. I own a teapot. A teapot! With a little hat on it.'] },
    { if: { temper: 'witty' }, text: ['I asked if tea was a stimulant or a ritual. They said "yes". I\'ve been thinking about it ever since.'] },
    { if: { temper: 'ornery' }, text: ['Tea. Everyone offers it. You can\'t refuse. I\'m sloshing. I slosh when I walk.'] },
    { if: { temper: 'curious' }, text: ['I\'ve tested every kind in the valley. Mint, nettle, the one with the black leaves. There\'s a ranking. Want it?'] },
    { if: { temper: 'gloomy' }, text: ['Tea\'s the only thing that\'s ever warm all the way through. I didn\'t know I was cold till I drank it.'] },
    { if: { riftSupper: true }, pri: 1, text: ['I had supper at a hill-family\'s last night. The tea came in a pot with a sweater on. A sweater!'] },
    { if: { stage: 'child' }, text: ['Tea is yucky. But you get a cookie with it. So it\'s worth it.'] },
  ]);
  lines('rift.food.missfood', [
    { text: ['Ramen. Mushroom ramen. Steam in your face, rain on your back. I\'d trade a week of pies for one bowl.', 'Broth. Proper broth, with noodles you pull. Hobbits boil everything to death. Lovingly. To death.'] },
    { if: { riftCustoms: 'ramen' }, pri: 1, text: ['I miss ramen. Except I don\'t, now, because I made it at the Badger and now everyone wants it.'] },
    { if: { riftTraditions: 'ramen' }, pri: 2, text: ['Ramen, but it\'s a Thistledown thing now! The innkeeper does it Highdays. With leeks. It\'s wrong. It\'s wonderful.'] },
    { if: { temper: 'dreamy' }, text: ['A dumpling from the night market. I can still taste it. I think I always will, a little.'] },
    { if: { stage: 'child' }, text: ['Blinky jelly. It glowed in the dark. Your jelly doesn\'t glow. It\'s nice, though.'] },
  ]);
  lines('rift.food.catchup', [
    { text: ['That\'s what everyone says! Then they give me cake. It\'s a conspiracy. I\'m in favor.', 'Catching up, one breakfast at a time. Two, before ten.'] },
    { if: { temper: 'ornery' }, text: ['I\'m trying! The waistcoat\'s complaining.'] },
  ]);
  lines('rift.food.ritual', [
    { text: ['Both! The kettle\'s the point. You put it on and everyone stops. Sits. Talks. It\'s a reset button.', 'Ritual. Definitely ritual. Nobody here drinks it for the taste. They drink it to sit down.'] },
    { if: { temper: 'witty' }, text: ['Stimulant, ritual, currency and argument. One leaf. Remarkable.'] },
    { if: { temper: 'dreamy' }, text: ['The kettle\'s the heart of a hole. Like a little Lamplighter. Everyone gathers round it.'] },
  ]);
  lines('rift.food.proper', [
    { text: ['A proper hobbit. Ha! I\'ve got hairy feet, nearly. It\'s the shoes. They had to go.', 'I\'ll take that. Proper hobbit. Copy that.'] },
    { if: { temper: 'proud' }, text: ['I\'m already more proper than half the lane. I go to bed at nine.'] },
    { if: { stage: 'child' }, text: ['I\'m a proper hobbit! I\'m going to tell everyone the wizard said!'] },
  ]);
  lines('rift.food.ramen', [
    { text: ['At the Badger? Okay. Mushrooms are easy, you lot are mad for them. Leeks for noodles, maybe. Copy that.', 'With what you\'ve got? Mushrooms, barley, a good stock. It\'d be wrong. Wrong can be lovely.'] },
    { if: { riftKnack: 'cook' }, pri: 1, text: ['I\'ve been waiting for someone to say that. I\'ll need the big pot. And the innkeeper\'s blessing.'] },
    { if: { temper: 'shy' }, text: ['...What if they don\'t like it? ...Okay. A small pot. A trial pot.'] },
  ]);
  lines('rift.food.kettle', [
    { text: ['The kettle. Huh. The city\'s mark, and here\'s every hole with one on the fire. I never put that together.', '...Now I can\'t stop seeing it. A kettle, on every sleeve back home. A kettle, on every stove here.'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['A copper kettle. Mungo\'s. It\'s been in front of us this whole time. Over every fire.'] },
  ]);

  // --- Learning our ways, teaching theirs -----------------------------------------------
  addThread({
    id: 'rift.customs', label: 'Are our ways strange to you?', weight: 1, cool: 4,
    when: (F) => F.rift,
    rel: (F) => (F.riftCustoms.length ? 1.4 : 1),
    open: { ask: 'rift.customs.open' },
    beats: {
      start: { line: 'rift.customs.start', go: [
        { ap: 'ask', say: 'Which of our ways is the strangest?', to: 'strange' },
        { ap: 'ask', say: 'And what have you taught us?', to: 'taught' },
        { ap: 'jest', say: 'Have you been to a hobbit birthday yet? We give the presents away.', to: 'birthday' },
      ] },
      strange: { line: 'rift.customs.strange', go: [
        { ap: 'ask', say: 'And which of our ways do you like best?', to: 'best' },
        { ap: 'jest', say: 'Has anyone given you a mathom yet?', to: 'mathom' },
      ] },
      birthday: { line: 'rift.customs.birthday', go: [
        { ap: 'warm', say: 'It\'s the best way to have a birthday. Everyone\'s glad you were born.', to: 'best' },
        { ap: 'ask', say: 'Would you keep that one, if you ever went home?', to: 'keep' },
      ] },
      mathom: { line: 'rift.customs.mathom', fx: { joke: { k: 'rift.mathom', t: 'The mathom that went round the whole lane and came back.' } }, go: [
        { ap: 'ask', say: 'And which of our ways do you like best?', to: 'best' },
        { ap: 'jest', say: 'Give it to someone on their birthday. That\'s the law.', to: 'law' },
      ] },
      law: { line: 'rift.customs.law', fx: { fond: 0.02 }, end: true },
      taught: { line: 'rift.customs.taught', go: [
        { ap: 'ask', say: 'Which is catching on?', to: 'catching' },
        { ap: 'jest', say: 'Neon bunting. The elders will never forgive you.', to: 'bunting' },
      ] },
      best: { line: 'rift.customs.best', go: [
        { ap: 'warm', say: 'Then it\'s yours too, now.', to: 'yours' },
        { ap: 'ask', say: 'Would you teach it, back in Neverdark?', to: 'keep' },
      ] },
      catching: { line: 'rift.customs.catching', go: [
        { ap: 'warm', say: 'Two peoples, swapping songs. That\'s how villages are made.', to: 'yours' },
        { ap: 'ask', say: 'And would you take ours home with you?', to: 'keep' },
      ] },
      bunting: { line: 'rift.customs.bunting', fx: { fond: 0.02 }, go: [
        { ap: 'ask', say: 'What else have you taught us?', to: 'catching' },
      ] },
      keep: { line: 'rift.customs.keep', fx: { trust: 0.02 }, end: true },
      yours: { line: 'rift.customs.yours', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('rift.customs.open', [
    { text: ['Are our ways strange to you, {name}?', 'What do you make of hill-folk customs, {name}?', 'Has the valley taught you any bad habits yet, {name}?'] },
    { if: { party: true }, text: ['A party, {name}! Do they have these in your city?'] },
  ]);
  lines('rift.customs.start', [
    { text: ['Strange? Wizard, I\'ve made a list. It\'s three pages. Some of it\'s underlined.', 'Some of them. Most of them. All the good ones.'] },
    { if: { temper: 'cheerful' }, text: ['Strange and brilliant! I love them! Well, most. The pipe-weed I could do without.'] },
    { if: { temper: 'ornery' }, text: ['You lot bow to each other\'s gardens. Out loud. "Lovely beans." I don\'t understand and I won\'t.'] },
    { if: { temper: 'shy' }, text: ['Everyone says good morning to everyone. Every time. I panic and say it twice.'] },
    { if: { temper: 'curious' }, text: ['I\'ve been studying them! There are rules for everything. Who sits where, which spoon. Nobody wrote them down!'] },
    { if: { temper: 'proud' }, text: ['I\'ve learned them all faster than any of the others. Ask anyone. I bow at beans now.'] },
    { if: { temper: 'dreamy' }, text: ['Your customs are like a song everyone knows the words to. I\'m learning to hum along.'] },
    { if: { temper: 'witty' }, text: ['Strange? You celebrate your birthday by giving away your furniture. I\'ve seen sects with less dogma.'] },
    { if: { temper: 'gloomy' }, text: ['I keep getting them wrong. Sat in the wrong chair at the inn. Silence. A whole room of silence.'] },
    { if: { stage: 'child' }, text: ['You have to say please for EVERYTHING. Even for jam. Even if it\'s your jam!'] },
    { if: { riftTier: { max: 1 } }, pri: 1, text: ['Strange? Look at me. Wool. Braces. I said "well I never" yesterday and meant it. They got me.'] },
  ]);
  lines('rift.customs.strange', [
    { text: ['Mathoms! Things nobody wants, kept forever, and given to people who don\'t want them either. It\'s a perfect system.', 'Round doors. Why round? I asked. Everyone looked at me like I\'d asked why water\'s wet.'] },
    { if: { temper: 'witty' }, text: ['Seven meals and one word for evening. Forty for pie. Your language knows what it wants.'] },
    { if: { temper: 'curious' }, text: ['The party tree! A tree you have parties under. On purpose. Who decided? When? Is it the same tree?'] },
    { if: { temper: 'ornery' }, text: ['Pipe-weed. You set leaves on fire and breathe it in, on purpose, after a meal. We had filters for that.'] },
    { if: { temper: 'shy' }, text: ['Visiting. You just... knock on someone\'s door. Unannounced. And they\'re pleased. I can\'t do it yet.'] },
    { if: { temper: 'dreamy' }, text: ['Leaving the window open for the moon. Granny Proudfoot does it. Says the moon gets lonely. I do it now.'] },
    { if: { temper: 'cheerful' }, text: ['Dancing round a pole with ribbons! For no reason! Because it\'s May! I love it so much.'] },
    { if: { stage: 'child' }, text: ['You don\'t have to wear shoes! Ever! My feet are going all furry. Mom\'s horrified.'] },
  ]);
  lines('rift.customs.birthday', [
    { text: ['I have! I went to wish someone happy birthday and came home with a teapot, a scarf and a chicken.', 'The presents go the WRONG WAY. I tried to explain. They said I was the wrong way.'] },
    { if: { temper: 'witty' }, text: ['It\'s a brilliant economy. Nobody owns anything for long. Everything\'s circulating. Like data.'] },
    { if: { temper: 'ornery' }, text: ['I got a chipped jug on someone else\'s birthday. What am I supposed to do with a chipped jug?'] },
    { if: { temper: 'cheerful' }, text: ['It\'s the best idea anyone ever had! I can\'t wait for mine. I\'ve been saving things to give away.'] },
    { if: { temper: 'gloomy' }, text: ['I didn\'t know. I brought a present. They gave me one back. I didn\'t know what my face should do.'] },
    { if: { stage: 'child' }, text: ['I got a whistle at somebody ELSE\'s birthday! Can it be someone\'s birthday every day?'] },
  ]);
  lines('rift.customs.mathom', [
    { text: ['A mathom! I\'ve had four. A brass thing nobody can name. I gave it on. It came back to me in a week.', 'A cracked umbrella-stand. It\'s gone round the whole lane. It came back. I think it likes me.'] },
    { if: { temper: 'curious' }, text: ['I\'ve been tracking one. A china owl. Eleven households in two seasons. It\'s basically a courier.'] },
    { if: { riftKnack: 'courier' }, pri: 1, text: ['I tracked one round the whole lane. Faster than the mail. Mathoms are your real network.'] },
  ]);
  lines('rift.customs.law', [
    { text: ['That\'s the law? Okay. Your birthday\'s coming, wizard. Start clearing a shelf.', 'Copy that. Whose birthday is next? I\'ve got an owl to unload.'] },
  ]);
  lines('rift.customs.taught', [
    { text: ['Taught you? Saying "copy that" instead of "right you are". The young ones picked it up in a day.', 'A bit. A song here, a word there. Things soak in. Like rain.'] },
    { if: { riftCustoms: 'ramen' }, text: ['Mushroom ramen! At the Badger! I watched an old farmer slurp his first noodle. He looked betrayed. Then he had seconds.'] },
    { if: { riftCustoms: 'blues' }, text: ['The Low Battery Blues. Three chords and a lot of feeling. Your fiddler picked it up in one go.'] },
    { if: { riftCustoms: 'signal' }, text: ['"Full signal" for happy. I heard a farmer say it about his turnips. My heart nearly stopped.'] },
    { if: { riftCustoms: 'bunting' }, text: ['Neon bunting. It glows. At parties. Your elders hate it. Your elders also dance under it, I notice.'] },
    { if: { temper: 'proud' }, text: ['Plenty. Half the young ones say "ping" now. That\'s me. Mostly me.'] },
    { if: { temper: 'shy' }, text: ['Oh, nothing. ...Well, one song. The kids sing it at the pond. I didn\'t mean to teach it.'] },
    { if: { stage: 'child' }, text: ['I taught everyone rift-tag! You\'re offline if you\'re tagged! And you have to say "beep"!'] },
  ]);
  lines('rift.customs.best', [
    { text: ['The Willow Lamp song. Old folk sing it at the inn. It makes my chest hurt. In a good way.', 'Second breakfast. Obviously. Is there any other answer?'] },
    { if: { riftCustoms: 'willow' }, text: ['The Willow Lamp song. I know all the words now. I sing it walking home. I think it\'s the oldest song I know.'] },
    { if: { riftCustoms: 'mayday' }, text: ['The maypole. Left over right, under and round. I fell over twice and nobody minded.'] },
    { if: { temper: 'dreamy' }, text: ['Leaving a light in the window for whoever\'s out late. Everyone does it. Nobody says why.'] },
    { if: { temper: 'gloomy' }, text: ['Sitting together without talking. You lot are very good at it. It\'s my favorite thing.'] },
    { if: { temper: 'witty' }, text: ['Afternoon naps. Declared, public, unashamed. Neverdark would have called it a strike.'] },
    { if: { stage: 'child' }, text: ['The pudding. All of the puddings. Every pudding.'] },
  ]);
  lines('rift.customs.catching', [
    { text: ['The kids took the slang first. Then the young ones. The old ones pretend not to, then say "ping" by accident.', 'More than you\'d think. I saw a neon strip on a waistcoat at the mill. Hill waistcoat. Neon strip.'] },
    { if: { riftTraditions: (x) => x.length > 0 }, pri: 1, text: ['Some of it\'s a tradition now. Proper Thistledown. That makes me want to cry and I don\'t know why.'] },
    { if: { riftTraditions: 'ramen' }, pri: 2, text: ['Ramen\'s a Thistledown thing now. The innkeeper put it on the board. In chalk. Forever.'] },
    { if: { riftTraditions: 'blues' }, pri: 2, text: ['The Low Battery Blues! The fiddler plays it Highdays. Hill-folk sing it about their knees.'] },
    { if: { riftTraditions: 'breakfast' }, pri: 2, text: ['We took to second breakfast so hard it\'s a tradition the other way round. Rift-folk keep it. Fiercely.'] },
    { if: { temper: 'ornery' }, text: ['The kids are saying "lag" about the mail. The mail carrier is furious. I\'m delighted.'] },
  ]);
  lines('rift.customs.bunting', [
    { text: ['They\'ve forgiven worse. Probably. I saw old Hamfast tap his foot under it.', 'They grumble, but nobody\'s taken it down. That\'s a hobbit yes.'] },
    { if: { riftElder: (x) => !!x }, pri: 1, text: ['{RiftElder} called it "an affront to the moon". Then stood under it all night. Glowing a bit.'] },
  ]);
  lines('rift.customs.keep', [
    { text: ['Teach it at home? Second breakfast in Neverdark? It\'d spread like a virus. A nice virus.', 'I\'d bring the Willow Lamp song. Sing it on a rooftop. See who joined in.'] },
    { if: { riftFinale: 'softclose' }, pri: 1, text: ['Home\'s here now. I\'ll teach our ways to the little ones here instead. Somebody should remember both.'] },
    { if: { riftFinale: 'hearthlink' }, pri: 1, text: ['I already did! Went through the golden door with a basket of scones. They\'re rationing them like gold.'] },
    { if: { temper: 'gloomy' }, text: ['If I went. If there\'s anyone left to teach. ...Yes. I\'d teach it.'] },
  ]);
  lines('rift.customs.yours', [
    { text: ['Mine too. Huh. Okay. I\'ll take it.', 'Yours, mine, ours. I like the way you lot share things. Even songs.'] },
    { if: { temper: 'shy' }, text: ['...Thank you. I\'ll sing it a bit louder, then.'] },
  ]);

  // --- The wariness they meet --------------------------------------------------------
  addThread({
    id: 'rift.wary', label: 'Do folk treat you kindly?', weight: 1, cool: 4,
    when: (F) => F.rift && F.riftCount > 0,
    rel: (F) => (F.riftStage <= 3 ? 1.5 : F.riftElder ? 1.2 : 0.7),
    open: { warm: 'rift.wary.open' },
    beats: {
      start: { line: 'rift.wary.start', go: [
        { ap: 'ask', say: 'And the ones who stare?', to: 'stare' },
        { ap: 'ask', say: 'Who was first to say hello properly?', to: 'first' },
        { ap: 'comfort', say: 'Folk here are slow to warm. But they warm all the way.', to: 'slow' },
      ] },
      stare: { line: 'rift.wary.stare', go: [
        { ap: 'advise', say: 'Give them time. And bread. Hobbits trust bread.', to: 'bread' },
        { ap: 'comfort', say: 'Folk here are slow to warm. But they warm all the way.', to: 'slow' },
        { ap: 'ask', say: 'Does it hurt?', to: 'hurt', need: { open: 1 }, soft: true },
      ] },
      first: { line: 'rift.wary.first', go: [
        { ap: 'warm', say: 'Then you\'ve a friend for life. That\'s how it goes here.', to: 'friend' },
        { ap: 'ask', say: 'And who still won\'t?', to: 'stare' },
      ] },
      slow: { line: 'rift.wary.slow', go: [
        { ap: 'ask', say: 'Who was first to say hello properly?', to: 'first' },
        { ap: 'jest', say: 'Like cats. Then you can\'t get rid of them.', to: 'cat' },
      ] },
      hurt: { line: 'rift.wary.hurt', fx: { trust: 0.04 }, go: [
        { ap: 'warm', say: 'I\'ll have a word with {riftElder}.', to: 'word', need: { if: { riftElder: (x) => !!x } } },
        { ap: 'comfort', say: 'It says more about them than you.', to: 'slow' },
        { ap: 'advise', say: 'Give them time. And bread. Hobbits trust bread.', to: 'bread' },
      ] },
      bread: { line: 'rift.wary.bread', fx: { respect: 0.02 }, end: true },
      friend: { line: 'rift.wary.friend', fx: { fond: 0.02 }, end: true },
      cat: { line: 'rift.wary.cat', fx: { fond: 0.02 }, end: true },
      word: { line: 'rift.wary.word', fx: { trust: 0.04, run: softenElder, promise: { k: 'rift.elder', t: 'You said you\'d have a word with {riftElder}', days: 5 } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('rift.wary.open', [
    { text: ['Do folk treat you kindly, {name}?', 'How are the neighbors treating you, {name}?', 'Has the village made you welcome, {name}? Honestly?'] },
    { if: { homeless: true }, text: ['You\'re still at the camp, {name}. Is anyone being unkind?'] },
  ]);
  lines('rift.wary.start', [
    { text: ['Mostly kind. Some stare. Some cross the lane. Some bring pie. It averages out to pie.', 'Kind enough. They\'re careful. Like we might go off.'] },
    { if: { riftWary: null, riftStage: { max: 2 } }, text: ['Early days. They watch us from behind hedges. Not very good hedges. We can see them.'] },
    { if: { riftStage: { min: 5 } }, text: ['Kindly. Now. It wasn\'t always. Ask me about the first month and I\'ll need a drink.'] },
    { if: { temper: 'cheerful' }, text: ['Oh, mostly lovely! A few scaredy ones. I wave extra hard at those.'] },
    { if: { temper: 'ornery' }, text: ['Kindly? One old boy threw a turnip. Missed. I kept the turnip. It was a good turnip.'] },
    { if: { temper: 'shy' }, text: ['I think so. I don\'t go out much. When I do, people... look. It\'s fine. It\'s fine.'] },
    { if: { temper: 'proud' }, text: ['They treat me as I treat them. Fairly. Those that don\'t, I don\'t notice.'] },
    { if: { temper: 'gloomy' }, text: ['Kind to my face, mostly. I hear what they say at the inn. Walls are thin. Hobbits are loud.'] },
    { if: { temper: 'witty' }, text: ['Kindly, in a "keep your voice down, it might glow at us" sort of way.'] },
    { if: { temper: 'curious' }, text: ['It\'s fascinating. The children come right up. The adults circle. The elders do a sort of slow orbit.'] },
    { if: { stage: 'child' }, text: ['The big ones stare. The little ones want to touch my eye. I let them. It tickles.'] },
    { if: { riftHillFriend: (x) => !!x }, pri: 1, text: ['Kind. {RiftHillFriend} made sure of it. Stood up for me at the Badger. I won\'t forget it.'] },
  ]);
  lines('rift.wary.stare', [
    { text: ['The starers? They\'ve stopped, mostly. One still crosses the lane. Every time. I\'ve started crossing too, to save them the bother.', 'There\'s a lady who pulls her curtains when I pass. I wave at the curtains.'] },
    { if: { riftElder: (x) => !!x }, pri: 1, text: ['{RiftElder}. Crosses the lane. Every time. Mutters "strangers". I\'ve lived here longer than some of the hens.'] },
    { if: { temper: 'ornery' }, text: ['I stare back. Works a treat. They go very pink.'] },
    { if: { temper: 'shy' }, text: ['I look at my feet. Then they look at my feet. It\'s a lot of looking at feet.'] },
    { if: { temper: 'witty' }, text: ['I\'ve started charging. A farthing a stare. I\'m nearly rich.'] },
    { if: { temper: 'cheerful' }, text: ['I wave! Big wave! Some wave back now. Small waves. It\'s progress!'] },
    { if: { stage: 'child' }, text: ['A boy said I was a robot. I said I was a dragon. He ran off. I won.'] },
  ]);
  lines('rift.wary.first', [
    { text: ['A little one. Came right up and asked if my eye could see through walls. It can\'t. We\'re friends now.', 'The innkeeper. Put a bowl in front of me and said "eat". Didn\'t ask anything. Best hello I ever had.'] },
    { if: { riftHillFriend: (x) => !!x }, pri: 1, text: ['{RiftHillFriend}. Walked up, shook my hand, asked my name. That\'s all. That was everything.'] },
    { if: { riftTurned: (x) => !!x }, pri: 2, text: ['{RiftTurned}. Wouldn\'t look at me for weeks. Then one day, a pot of tea. Now we\'re thick as thieves.'] },
    { if: { temper: 'dreamy' }, text: ['An old lady at the well. She sang to me. I didn\'t know the song. I know it now.'] },
    { if: { temper: 'gloomy' }, text: ['A dog. Honestly. A dog came first. The owners followed the dog.'] },
  ]);
  lines('rift.wary.slow', [
    { text: ['All the way. I\'ve seen it happen. Slow, like your clocks. Then all at once.', 'Slow to warm. Like your ovens. Stays warm all night once it gets going.'] },
    { if: { temper: 'ornery' }, text: ['Slow? Glaciers are slow. Hobbits are geological.'] },
    { if: { temper: 'shy' }, text: ['Slow\'s okay. I\'m slow too. Maybe we\'ll meet in the middle.'] },
  ]);
  lines('rift.wary.hurt', [
    { text: ['A bit. When it\'s someone you\'d like to know. You can see they\'re kind. Just not to you. Yet.', 'Yeah. It does. I didn\'t ask to fall out of the sky.'] },
    { if: { temper: 'proud' }, text: ['Hurt? No. ...A little. Don\'t make me say it twice.'] },
    { if: { temper: 'gloomy' }, text: ['Every time. Like being a draft in someone\'s house.'] },
    { if: { stage: 'child' }, text: ['When the big girls whisper. That hurts. I pretend it doesn\'t.'] },
  ]);
  lines('rift.wary.bread', [
    { text: ['Bread. Okay. I\'ll bake. Badly. That\'s endearing, right?', 'Hobbits trust bread. Writing that down. Underlining it.'] },
    { if: { riftKnack: 'cook' }, pri: 1, text: ['Bread I can do. Bread with chilli in. That\'ll make them talk, one way or another.'] },
    { if: { temper: 'ornery' }, text: ['I\'m not buying friends with bread. ...Well. Maybe one loaf.'] },
  ]);
  lines('rift.wary.friend', [
    { text: ['For life. Huh. That\'s a long contract. Signing it.', 'Friend for life. I\'d like that. Copy that.'] },
  ]);
  lines('rift.wary.cat', [{ text: ['Ha! I\'ve noticed. One old fellow brings me apples now. Every day. I\'ve got so many apples.', 'Like cats! Yes! Then they sit on your feet and won\'t move.'] }]);
  lines('rift.wary.word', [
    { text: ['You\'d do that? A wizard\'s word. That\'ll weigh more than a turnip.', 'Thanks. Kind word, mind. Not a scolding. Then it\'ll just be worse.'] },
    { if: { temper: 'proud' }, text: ['I don\'t need defending. ...But if you happen to mention I\'m all right, I won\'t stop you.'] },
  ]);

  // --- The Relay ---------------------------------------------------------------------
  addThread({
    id: 'rift.relay', label: 'What is it you post, on the Relay?', weight: 0.8, cool: 4,
    when: (F) => F.rift && F.stage !== 'child' && (F.riftRelay || F.riftCamp || F.riftStage >= 2),
    rel: (F) => (F.riftRelay ? 1.4 : 0.8) * (F.hour === 'evening' ? 1.4 : 1),
    open: { ask: 'rift.relay.open' },
    beats: {
      start: { line: 'rift.relay.start', go: [
        { ap: 'ask', say: 'And what do people post?', to: 'posts' },
        { ap: 'jest', say: 'In my day we shouted over the hedge.', to: 'hedge' },
        { ap: 'ask', say: 'Do you ever send anything home?', to: 'home' },
      ] },
      posts: { line: 'rift.relay.posts', go: [
        { ap: 'ask', say: 'And have you posted anything?', to: 'mine' },
        { ap: 'ask', say: 'Do you ever send anything home?', to: 'home' },
      ] },
      hedge: { line: 'rift.relay.hedge', go: [
        { ap: 'ask', say: 'Seriously, though. What\'s it for?', to: 'posts' },
        { ap: 'ask', say: 'Do you ever send anything home?', to: 'home' },
      ] },
      home: { line: 'rift.relay.home', go: [
        { ap: 'listen', say: '*You wait. They\'re listening to something.*', label: 'Wait', to: 'static' },
        { ap: 'comfort', say: 'A message that\'s sent isn\'t wasted. Even unread.', to: 'pings' },
      ] },
      mine: { line: 'rift.relay.mine', fx: { fond: 0.02 }, end: true },
      static: { line: 'rift.relay.static', go: [
        { ap: 'ask', say: 'What does the voice say?', to: 'voice', need: { when: (F) => (F.riftFrags || []).includes('relay') } },
        { ap: 'warm', say: 'Maybe someone\'s listening for you, too.', to: 'pings' },
      ] },
      pings: { line: 'rift.relay.pings', fx: { trust: 0.02 }, end: true },
      voice: { line: 'rift.relay.voice', fx: { trust: 0.03 }, end: true },
    },
  });
  lines('rift.relay.open', [
    { text: ['What is it you post, on the Relay, {name}?', 'I see you on that Relay a good deal, {name}. What\'s on it?'] },
    { if: { riftRelay: true }, text: ['That mast hums half the night, {name}. What\'s it saying?'] },
    { if: { riftRelay: false }, text: ['That crackling handset at the camp, {name}. What\'s it for?'] },
  ]);
  lines('rift.relay.start', [
    { text: ['The Relay? It\'s how we talk. Short posts. Pings. Like your notice board, but it talks back.', 'Everything and nothing. Weather, gossip, who\'s got scrap. Mostly gossip.'] },
    { if: { riftRelay: false }, text: ['Just the handset, for now. Crackly. Half the posts are static. The other half are me.'] },
    { if: { temper: 'witty' }, text: ['It\'s a hedge you can shout over from a mile off. With spelling mistakes.'] },
    { if: { temper: 'curious' }, text: ['It\'s amazing what it picks up. Weddings, births, someone\'s lost goat. The whole village, in lines.'] },
    { if: { temper: 'shy' }, text: ['I mostly read. I like reading people. Easier than talking to them.'] },
    { if: { temper: 'gloomy' }, text: ['Noise, mostly. It\'s the noise I miss. The Relay\'s a little bit of noise.'] },
    { if: { temper: 'proud' }, text: ['I helped tune it. Best signal in the valley. Only signal. Still the best.'] },
    { if: { temper: 'ornery' }, text: ['It\'s ours. Leave it be. ...Fine. It\'s gossip with blinking lights.'] },
  ]);
  lines('rift.relay.posts', [
    { text: ['"Rained again. REAL rain." "Second breakfast is a protocol." "Who took my wrench." That sort of thing.', 'The kids post riddles. The old folk post "is this thing on". Every single time.'] },
    { if: { temper: 'witty' }, text: ['A farmer posted "Turnips doing well. Yours sincerely." I printed it out. It\'s on my wall.'] },
    { if: { temper: 'cheerful' }, text: ['Happy things! Who got married, who had a baby, who fell in the pond. Mostly the pond.'] },
    { if: { temper: 'dreamy' }, text: ['Little lines at dusk. "miss the trains tonight." "stars are out." Like lanterns in a window.'] },
  ]);
  lines('rift.relay.hedge', [
    { text: ['Ha! Same thing. Shorter. Further. Fewer hedges.', 'You still do. I\'ve heard you. You\'re very loud for an old man.'] },
    { if: { temper: 'witty' }, text: ['Shouting over a hedge is just the Relay with worse range. And better acoustics.'] },
    { if: { temper: 'ornery' }, text: ['And who heard you? The hedge. Relay\'s got reach.'] },
  ]);
  lines('rift.relay.home', [
    { text: ['Every night. Pings. Into the static. Nothing comes back. I keep sending.', 'Sometimes. A message to the old address. It just... goes. Like dropping a stone in a well.'] },
    { if: { lost: (x) => !!x }, pri: 1, text: ['Two pings for {lost}. Every night. Our old code. Two means noodles. Means "you okay".'] },
    { if: { riftFinale: 'hearthlink' }, pri: 2, text: ['Now? All the time! Letters come back through the golden doors. My aunt sends complaints. I love them.'] },
    { if: { riftFinale: 'softclose' }, pri: 2, text: ['Not now. The rifts closed. I sent one last ping. "Goodnight." That was enough.'] },
  ]);
  lines('rift.relay.mine', [
    { text: ['A picture of a hedgehog. Forty pings. Hedgehog was a hit.', '"First scone. Survived." Everyone liked it. Even the baker. Especially the baker.'] },
    { if: { temper: 'shy' }, text: ['One. "thank you for the soup." I didn\'t say who to. They knew.'] },
    { if: { temper: 'proud' }, text: ['I post the weather. Accurately. Your old folk check it before they hang washing now.'] },
  ]);
  lines('rift.relay.static', [
    { text: ['...Sometimes I think I hear something. Under the static. Like a voice, very far away.', '...Listen. That crackle. That\'s the sky. That\'s where the rifts come from. I swear it.'] },
    { if: { hour: 'evening' }, text: ['...It\'s dusk. This is when it happens. Listen. Under the hiss. Hear it?'] },
  ]);
  lines('rift.relay.voice', [
    { text: ['"Lamp... lighter... is anyone..." Then "the kettle\'s gone cold." Same words. Every dusk.', 'It\'s old. Tired. Kind. It\'s asking if anyone\'s there. I always say yes. Out loud. Like a fool.'] },
    { if: { riftFrags: 'voice' }, pri: 1, text: ['"Thank you for keeping the lamps low." It said that last night. To us. To this valley.'] },
  ]);
  lines('rift.relay.pings', [
    { text: ['Maybe. Maybe there\'s someone at the other end, pinging back, and the static\'s eating both.', 'Not wasted. Okay. I\'ll keep sending.'] },
    { if: { temper: 'gloomy' }, text: ['I hope so. Some nights hoping\'s all the signal I\'ve got.'] },
  ]);

  // --- The Lamplighter -------------------------------------------------------------------
  addThread({
    id: 'rift.lamp', label: 'Who was the Lamplighter?', weight: 0.9, cool: 5,
    when: (F) => F.rift && (F.riftStage >= 3 || F.riftClues >= 1),
    rel: (F) => 0.8 + Math.min(1, F.riftClues * 0.2),
    open: { ask: 'rift.lamp.open' },
    beats: {
      start: { line: 'rift.lamp.start', go: [
        { ap: 'ask', say: 'Who built it?', to: 'built' },
        { ap: 'ask', say: 'What did it do, exactly?', to: 'tended' },
        { ap: 'tale', say: 'There\'s an old song in the Shire about a lamp by a willow.', to: 'song' },
      ] },
      built: { line: 'rift.lamp.built', go: [
        { ap: 'ask', say: 'Mungo? That\'s a hill name, you know.', to: 'mungo', need: { when: (F) => (F.riftFrags || []).some((k) => k === 'saint' || k === 'ledger') } },
        { ap: 'ask', say: 'And the kettle?', to: 'kettle' },
      ] },
      tended: { line: 'rift.lamp.tended', go: [
        { ap: 'ask', say: 'And now?', to: 'fading' },
        { ap: 'listen', say: '*You wait for the rest.*', label: 'Wait for the rest', to: 'fading' },
      ] },
      song: { line: 'rift.lamp.song', go: [
        { ap: 'warm', say: 'Perhaps lamps everywhere sing the same song. And how is yours, now?', to: 'fading' },
        { ap: 'ask', say: 'Who built your Lamplighter?', to: 'built' },
      ] },
      kettle: { line: 'rift.lamp.kettle', go: [
        { ap: 'ask', say: 'And now? How is it now?', to: 'fading' },
        { ap: 'jest', say: 'A city founded on tea. I knew I liked it. Is it still brewing?', to: 'fading' },
      ] },
      mungo: { line: 'rift.lamp.mungo', fx: { trust: 0.03 }, go: [
        { ap: 'warm', say: 'Then you\'re not strangers here. You\'re a long way round from home.', to: 'sent' },
        { ap: 'ask', say: 'And the Lamplighter? Is it still lit?', to: 'fading' },
      ] },
      fading: { line: 'rift.lamp.fading', go: [
        { ap: 'comfort', say: 'Lamps can be relit. That\'s what lamps are for.', to: 'relit' },
        { ap: 'ask', say: 'Is that why you came here?', to: 'sent', need: { open: 1 }, soft: true },
      ] },
      relit: { line: 'rift.lamp.relit', fx: { fond: 0.02 }, end: true },
      sent: { line: 'rift.lamp.sent', fx: { trust: 0.04 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('rift.lamp.open', [
    { text: ['You speak of a Lamplighter, {name}. Who was it?', 'Tell me about the Lamplighter, {name}.'] },
    { if: { riftFrags: 'sigil' }, text: ['That kettle on your sleeve, {name}. Has it to do with your Lamplighter?'] },
  ]);
  lines('rift.lamp.start', [
    { text: ['The Lamplighter? It\'s the heart of the city. An old engine, under everything. It keeps the lights on. Kept.', 'Nobody\'s seen it. It\'s down deep. You feel it, though. Like a heartbeat in the floor.'] },
    { if: { temper: 'dreamy' }, text: ['It\'s the oldest thing in the city. Older than the towers. We said it dreamed us. Maybe it did.'] },
    { if: { temper: 'curious' }, text: ['An engine. A tending-engine. Nobody knows how it works. I\'ve read every theory. They\'re all wrong.'] },
    { if: { temper: 'proud' }, text: ['The Lamplighter is why Neverdark is the greatest city there ever was. It never failed us. Until.'] },
    { if: { temper: 'gloomy' }, text: ['It\'s tired. That\'s all anyone says now. The Lamplighter\'s tired.'] },
    { if: { temper: 'witty' }, text: ['Imagine your miller, but a machine, and he grinds light instead of barley, and he\'s three hundred years old.'] },
    { if: { temper: 'shy' }, text: ['It\'s... like a grandmother. For the whole city. I used to say goodnight to it.'] },
    { if: { temper: 'ornery' }, text: ['A machine. A big one. Everyone gets soppy about it. ...I get soppy about it.'] },
    { if: { temper: 'cheerful' }, text: ['It\'s the best! It lights the clouds pink on festival nights! Everybody cheers!'] },
    { if: { riftHome: 'the Lamplighter\'s glow on the clouds' }, pri: 1, text: ['The Lamplighter. That\'s what I miss. Its glow on the clouds. It was the sky, to me.'] },
  ]);
  lines('rift.lamp.built', [
    { text: ['Saint Mungo. The First Lamp. There\'s a story: he walked out of a storm with a kettle and lit the dark.', 'A saint, they say. Mungo. He\'s on the coins. Little fellow with big feet and a kettle.'] },
    { if: { temper: 'curious' }, text: ['Saint Mungo of the First Lamp. Small, big-footed, carried a copper kettle. Very specific saint. Why so specific?'] },
    { if: { temper: 'witty' }, text: ['A saint with a kettle. We built a religion round a tinker\'s tea. Make of that what you will.'] },
    { if: { riftFrags: 'saint' }, pri: 1, text: ['Saint Mungo. The one on your parlor wall. Same face. I nearly dropped my cup.'] },
  ]);
  lines('rift.lamp.tended', [
    { text: ['Everything. The lights, the trains, the hum. It tended the city like a garden. Patient. Never slept.', 'It lit the clouds so nobody was ever in the dark. That was the promise. Never dark.'] },
    { if: { riftKnack: 'gridtech' }, pri: 1, text: ['I worked its outer junctions. You could feel it, down the cables. Like it was paying attention.'] },
    { if: { temper: 'dreamy' }, text: ['It sang. Low. Under the hum. On quiet nights, if you lay on the floor, you could hear it.'] },
  ]);
  lines('rift.lamp.song', [
    { text: ['A lamp by a willow? ...Hum it. ...That\'s our lullaby. That\'s the city lullaby. How do you know it?', 'Down by the willow lamp? We sing that! To babies! In Neverdark!'] },
    { if: { riftFrags: 'lullaby' }, pri: 1, text: ['The Willow Lamp. Your grannies sang it. Ours too. Same words. I\'ve stopped thinking that\'s a coincidence.'] },
    { if: { temper: 'shy' }, text: ['...My mom sang that. I haven\'t heard it since. Could you... no. Never mind. Thank you.'] },
  ]);
  lines('rift.lamp.kettle', [
    { text: ['The kettle\'s the city\'s mark. It\'s on everything. Coins, sleeves, the trains. It\'s always been the kettle.', 'Mungo\'s kettle. The first lamp was a kettle, the story goes. Boiled the dark away.'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['A copper kettle, carried into green lightning on your Long Meadow. It\'s in your ledger. He owed threepence.'] },
  ]);
  lines('rift.lamp.mungo', [
    { text: ['A hill name? ...Mungo. Fernsby. Oh. Oh. He was one of yours, wasn\'t he.', 'Your Mungo and our saint. Same feet. Same kettle. So we\'re... we\'re cousins?'] },
    { if: { riftFrags: 'ledger' }, pri: 1, text: ['Mungo Fernsby. Owes the Crooked Kettle threepence. Our saint had a bar tab. Here. I love him more now.'] },
    { if: { temper: 'dreamy' }, text: ['So we came home. That\'s what the rifts are. A long way home.'] },
  ]);
  lines('rift.lamp.fading', [
    { text: ['Flickering. Street by street. Lights out where they\'d never been out. The Long Dim, they started calling it.', 'Tired. It\'s been tired for years. The clouds went gray. Some nights black. Nobody knew what to do.'] },
    { if: { riftStage: { min: 8 } }, pri: 1, text: ['Going out. You\'ve seen the rifts gutter. That\'s it. That\'s the Lamplighter, running down.'] },
    { if: { riftFinale: 'hearthlink' }, pri: 2, text: ['It\'s steadier! Your river\'s feeding it through the golden doors. Neverdark saw stars last month. Stars!'] },
    { if: { riftFinale: 'softclose' }, pri: 2, text: ['I don\'t know, now. The doors are closed. I hope it\'s resting. I hope someone\'s tucking it in.'] },
    { if: { temper: 'gloomy' }, text: ['Dying. Say it plain. The Lamplighter\'s dying and the city with it.'] },
  ]);
  lines('rift.lamp.relit', [
    { text: ['Relit. ...Yeah. That\'s what lamps are for. You\'re good at short sentences, wizard.', 'I hope so. I hope you\'re right.'] },
    { if: { riftDynamo: true }, text: ['With your river, maybe. The dynamo, the spinner. Maybe that\'s what all this is for.'] },
  ]);
  lines('rift.lamp.sent', [
    { text: ['Sent. That\'s what some say. It sent us. Out of the dark. Somewhere soft.', 'I think so. I think it opened the doors on purpose. Before the end. Like a mom pushing kids out of a fire.'] },
    { if: { riftFrags: 'voice' }, pri: 1, text: ['"I sent my children to find it." You heard it too. We\'re its children. This is the soft place.'] },
    { if: { temper: 'shy' }, text: ['...I think it wanted us safe. I think it\'s sitting in the dark on its own now. I try not to think that.'] },
  ]);

  // --- A word of rift-talk (passing the time) -----------------------------------------
  addThread({
    id: 'rift.slang', light: true, ap: 'jest', label: 'Teach me some rift-talk', open: { jest: 'rift.slang.open' },
    when: (F) => F.rift || F.riftTier >= 1,
    beats: {
      start: { line: 'rift.slang.start', go: [
        { ap: 'jest', say: 'rift.slang.try', label: 'Try it out', to: 'try' },
        { ap: 'ask', say: 'And how would you say "second breakfast"?', to: 'breakfast' },
      ] },
      try: { line: 'rift.slang.tried', fx: { joke: { k: 'rift.slang', t: 'The wizard tried saying "ping". It did not go well.' } }, go: [
        { ap: 'jest', say: 'Ping. Ping! Ping?', to: 'again' },
        { ap: 'ask', say: 'Teach me another, then.', to: 'breakfast' },
      ] },
      breakfast: { line: 'rift.slang.breakfast', fx: { fond: 0.01 }, end: true },
      again: { line: 'rift.slang.again', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('rift.slang.open', [
    { text: ['Teach an old wizard some rift-talk, {name}. Something rude, ideally.', 'What\'s the word for "hello" where you come from, {name}?'] },
    { if: { riftTier: { min: 1 }, rift: false }, text: ['You\'ve been talking like the rift-folk, {name}. Teach me.'] },
  ]);
  lines('rift.slang.start', [
    { text: ['"Ping." Means hello. Or "you there?" Or "I\'m here". It\'s a whole conversation.', '"Copy that." Means yes, I heard, I\'ll do it. Or I heard, I won\'t. Depends on the face.'] },
    { if: { temper: 'witty' }, text: ['"Lag." When someone\'s slow. As in: hobbits are very laggy before second breakfast.'] },
    { if: { temper: 'cheerful' }, text: ['"Full signal!" Means happy. Really happy. Like now! Full signal!'] },
    { if: { temper: 'gloomy' }, text: ['"Low battery." Means tired. Means sad. Means the whole city, lately.'] },
    { if: { temper: 'ornery' }, text: ['"Log off." Means go away. I\'ll let you guess where I learned that.'] },
    { if: { temper: 'dreamy' }, text: ['"Static." When you can\'t think. When you\'re full of fuzz. When you\'re in love, sometimes.'] },
    { if: { temper: 'curious' }, text: ['Ooh. Start with "ping". Then "lag". Then "patch", which means a fix, or a plaster, or a pie.'] },
    { if: { stage: 'child' }, text: ['"Beep boop" means I\'m a robot. "Ping" means tag. "Offline" means you\'re OUT.'] },
    { if: { rift: false }, text: ['"Ping." I say it at the mill now. The miller says it back. He thinks it\'s Elvish.'] },
  ]);
  lines('rift.slang.try', [
    { text: ['Ping, {name}. Full signal. Copy that. ...Did I do it?', 'Low battery! Lag! Ping ping. How was that?'] },
  ]);
  lines('rift.slang.tried', [
    { text: ['Oh no. Oh, that was terrible. You said "ping" like a hen.', 'You did it. Technically. Don\'t ever do it again.'] },
    { if: { temper: 'witty' }, text: ['That was the worst "ping" in two universes. I\'m logging it. For history.'] },
    { if: { temper: 'cheerful' }, text: ['Ha! Yes! Nearly! You\'re ninety per cent rift now. The hat\'s the last ten.'] },
    { if: { temper: 'ornery' }, text: ['No. No. Stop. Wizards shouldn\'t say ping.'] },
    { if: { stage: 'child' }, text: ['HAHAHA! Say it again! The wizard said PING!'] },
  ]);
  lines('rift.slang.breakfast', [
    { text: ['"Second breakfast." We kept it. Some things don\'t need translating.', '"Top-up." Or "the second boot". We never had one. Now we say "second breakfast" like you.'] },
    { if: { temper: 'witty' }, text: ['"Mandatory firmware update." It\'s on the schedule now. Half past nine. Everyone attends.'] },
  ]);
  lines('rift.slang.again', [
    { text: ['Ping. ...Ping. ...Okay, that last one was all right.', 'Three pings means trouble. You just said there\'s trouble. Three times.'] },
    { if: { temper: 'witty' }, text: ['You\'ve pinged so hard the Relay\'s blushing.'] },
  ]);

  // --- What they ask the wizard ----------------------------------------------------------
  const asks = (id, key, extra) => addThread({ id, theirs: true, label: 'They have a question for you', cool: 5, ask: '{Name} has a question for you.', when: (F) => F.rift && F.met && F.talks >= 2, ...extra,
    beats: {
      start: { line: `${key}.q`, go: [
        { ap: 'tale', say: `${key}.tale`, label: `${key}.tale`, to: 'tale' },
        { ap: 'jest', say: `${key}.jest`, label: `${key}.jest`, to: 'jest' },
        { ap: 'share', say: `${key}.share`, label: `${key}.share`, to: 'share', need: { open: 1 }, soft: true },
      ] },
      tale: { line: `${key}.r.tale`, fx: { fond: 0.02 }, go: [{ ap: 'ask', say: 'And you? What do you make of it?', to: 'theirview' }] },
      jest: { line: `${key}.r.jest`, fx: { fond: 0.01 }, go: [{ ap: 'warm', say: 'I\'m only half joking. The other half\'s a secret.', to: 'theirview' }] },
      share: { line: `${key}.r.share`, fx: { trust: 0.04 }, go: [{ ap: 'ask', say: 'And you? What do you make of it?', to: 'theirview' }] },
      theirview: { line: `${key}.view`, end: true },
    } });
  asks('rift.ask.battery', 'rift.askb');
  lines('rift.askb.q', [
    { text: ['Do wizards have batteries? Where does yours plug in? Is it the hat?', 'Serious question. Where do you charge? Is it pipe-weed? Is the pipe a battery?'] },
    { if: { temper: 'curious' }, text: ['I\'ve been watching you. You never charge. You never plug in. What\'s your power source?'] },
    { if: { stage: 'child' }, text: ['Where\'s your battery? Is it in your beard? Can I look?'] },
  ]);
  lines('rift.askb.tale', [{ text: ['A long time ago, a fire was lit in me. It hasn\'t gone out yet.'] }]);
  lines('rift.askb.jest', [{ text: ['The hat, obviously. Why else would anyone wear it?'] }]);
  lines('rift.askb.share', [{ text: ['Some days I\'m very low indeed. Then someone gives me tea.'] }]);
  lines('rift.askb.r.tale', [{ text: ['A fire, lit in you. That\'s... that\'s a battery that never runs down. I want one.', 'Hasn\'t gone out. In how long? ...Don\'t tell me. I don\'t want to know.'] }, { if: { temper: 'dreamy' }, text: ['A fire that doesn\'t go out. Like the Lamplighter. Before.'] }]);
  lines('rift.askb.r.jest', [{ text: ['I KNEW it. I knew it was the hat.', 'The hat. Logged. Confirmed. Everyone owes me a farthing.'] }, { if: { stage: 'child' }, text: ['Can I wear it? Will I get magic? Please? PLEASE?'] }]);
  lines('rift.askb.r.share', [{ text: ['Low? You? ...Huh. Tea\'s a battery. You told me that. I thought you were joking.', 'Wizards run low too. Okay. That makes me feel less broken.'] }]);
  lines('rift.askb.view', [{ text: ['I think people are the battery here. You lot charge each other. All day. Constantly.', 'I think I\'m charging slower. But steadier. Like your river.'] }, { if: { temper: 'witty' }, text: ['I think the real battery was the pies we ate along the way.'] }]);

  asks('rift.ask.rift', 'rift.askr', { when: (F) => F.rift && F.met && F.talks >= 2 && F.stage !== 'child' });
  lines('rift.askr.q', [
    { text: ['Can you open a rift? Like, on purpose? Could you send me back, if I asked?', 'You\'re a wizard. Do you know what the rifts are? Really?'] },
    { if: { temper: 'gloomy' }, text: ['Could you close them? The rifts? So nobody else has to fall through like I did?'] },
  ]);
  lines('rift.askr.tale', [{ text: ['There\'s an old tale of a tinker who walked into green lightning. I\'m still learning the ending.'] }, { if: { riftFrags: 'ledger' }, text: ['A tinker named Fernsby walked into green lightning on the Long Meadow. I think you know where he came out.'] }]);
  lines('rift.askr.jest', [{ text: ['Open one? I can barely open a jar of pickles.'] }]);
  lines('rift.askr.share', [{ text: ['No. I can\'t. I\'m sorry. Wizards can do less than people hope.'] }]);
  lines('rift.askr.r.tale', [{ text: ['A tinker. Green lightning. ...That\'s not a tale. That\'s a clue. You know it is.', 'You\'re learning the ending. So there IS an ending. Good. I\'ll wait.'] }]);
  lines('rift.askr.r.jest', [{ text: ['Pickles. Course. Most powerful being in the valley, defeated by a lid.', 'Ha. I\'ll do your pickles. You do the sky.'] }]);
  lines('rift.askr.r.share', [{ text: ['...Thanks for saying so. Everyone else just looks wise and changes the subject.', 'Less than people hope. Okay. That\'s honest. I\'ll take honest over magic.'] }]);
  lines('rift.askr.view', [{ text: ['I think the rifts are doors someone\'s holding open. I think they\'re getting tired.', 'I think it\'s a signal. Someone\'s calling. We\'re just what the call carried.'] }, { if: { temper: 'curious' }, text: ['They hum in threes. Did you notice? Threes. That\'s not weather. That\'s a pattern.'] }]);

  asks('rift.ask.age', 'rift.aska');
  lines('rift.aska.q', [
    { text: ['How old are you? In cycles. Ours. Roughly. Ballpark.', 'Is it true you\'re older than the river? A kid told me. I said that\'s impossible. Is it?'] },
    { if: { stage: 'child' }, text: ['Are you a hundred? Are you a THOUSAND?'] },
  ]);
  lines('rift.aska.tale', [{ text: ['I remember when this valley was all oak, and the river ran the other side of the hill.'] }]);
  lines('rift.aska.jest', [{ text: ['Thirty-nine. I\'ve been thirty-nine for a very long time.'] }]);
  lines('rift.aska.share', [{ text: ['Old enough to have lost count. Young enough to mind.'] }]);
  lines('rift.aska.r.tale', [{ text: ['The river moved? Rivers move? ...You\'re older than a river\'s mind. Okay. Wow.', 'All oak. I\'m trying to picture it. I can\'t. Was it nice? Was it quiet?'] }, { if: { stage: 'child' }, text: ['WHOA. You\'re older than TREES.'] }]);
  lines('rift.aska.r.jest', [{ text: ['Thirty-nine! Ha! And the beard?', 'Thirty-nine. Sure. And I\'m a turnip.'] }, { if: { temper: 'witty' }, text: ['Thirty-nine. That\'s binary for "don\'t ask".'] }]);
  lines('rift.aska.r.share', [{ text: ['Young enough to mind. ...Yeah. I get that one.', 'Lost count. I lost count of days, first month here. Then I started counting breakfasts.'] }]);
  lines('rift.aska.view', [{ text: ['I think you\'re as old as you need to be. Which is very.', 'I think you\'re old like the Lamplighter\'s old. Kind old.'] }]);

  asks('rift.ask.staff', 'rift.asks', { when: (F) => F.rift && F.met && F.talks >= 1 });
  lines('rift.asks.q', [
    { text: ['Your staff. Is it a remote? A conductor? Can I hold it? I won\'t press anything.', 'What does the staff actually do? Be honest. Is it just for leaning?'] },
    { if: { riftKnack: 'gridtech' }, text: ['Your staff carries a charge. I can feel it. What voltage? What\'s it grounded to?'] },
  ]);
  lines('rift.asks.tale', [{ text: ['It was cut from an old tree that remembered the first sunrise. It remembers for me, now.'] }]);
  lines('rift.asks.jest', [{ text: ['Mostly for leaning. Occasionally for pointing at things dramatically.'] }]);
  lines('rift.asks.share', [{ text: ['Honestly? It\'s the only thing I\'ve kept, all these years. That and the hat.'] }]);
  lines('rift.asks.r.tale', [{ text: ['A tree that remembers. So it\'s storage. Wooden storage. That\'s beautiful.', 'Remembers the first sunrise. ...I\'ve never seen a sunrise till here. I\'m remembering mine.'] }]);
  lines('rift.asks.r.jest', [{ text: ['Pointing dramatically! I knew it. I\'ve seen you practice.', 'Leaning and pointing. Best tools there are.'] }]);
  lines('rift.asks.r.share', [{ text: ['The only thing you\'ve kept. ...I kept one thing too. Look. A bit of my old coat.', 'Huh. You and me both. One thing each. That\'s a lot, from the other side.'] }]);
  lines('rift.asks.view', [{ text: ['I think it\'s a staff. And that\'s the best thing it could be.', 'I think it hums. Very quietly. Like home.'] }]);

  // --- Growing up between two worlds ------------------------------------------------------
  addThread({
    id: 'rift.kids', label: 'What\'s it like, being from two worlds?', weight: 1.2, cool: 3,
    when: (F) => F.stage === 'child' && (F.rift || !!F.riftBlood || F.riftTier >= 1),
    open: { ask: 'rift.kids.open' },
    beats: {
      start: { line: 'rift.kids.start', go: [
        { ap: 'ask', say: 'What\'s your favorite game?', to: 'game' },
        { ap: 'ask', say: 'Do the other children ask about your eye?', to: 'eye', need: { if: { rift: true } } },
        { ap: 'jest', say: 'Can you see in the dark? I can\'t. I walk into trees.', to: 'dark' },
      ] },
      game: { line: 'rift.kids.game', go: [
        { ap: 'warm', say: 'May I play? I\'m very good at being the dragon.', to: 'play' },
        { ap: 'ask', say: 'And the hill games? Do you play those too?', to: 'hillgame' },
      ] },
      eye: { line: 'rift.kids.eye', go: [
        { ap: 'comfort', say: 'Children ask because they wish they had one.', to: 'comfort' },
        { ap: 'warm', say: 'It\'s a fine eye. The finest in the valley.', to: 'fine' },
      ] },
      dark: { line: 'rift.kids.dark', go: [
        { ap: 'ask', say: 'What\'s your favorite game, then?', to: 'game' },
        { ap: 'warm', say: 'Then you can lead me home at night.', to: 'lead' },
      ] },
      lead: { line: 'rift.kids.lead', fx: { fond: 0.03 }, end: true },
      play: { line: 'rift.kids.play', fx: { fond: 0.04, lean: 'rift' }, end: true },
      hillgame: { line: 'rift.kids.hillgame', fx: { fond: 0.02, lean: 'hill' }, end: true },
      comfort: { line: 'rift.kids.comfort', fx: { fond: 0.03 }, end: true },
      fine: { line: 'rift.kids.fine', fx: { fond: 0.03 }, end: true },
    },
    end: { fond: 0.01 },
  });
  lines('rift.kids.open', [
    { text: ['What\'s it like, {name}, having two worlds in you?', 'Are you a hill-hobbit or a rift-hobbit, {name}?'] },
    { if: { rift: true }, text: ['Do you remember the city, {name}?'] },
    { if: { riftBlood: 'half' }, text: ['One parent from the hills and one from the sky, {name}. Which do you take after?'] },
  ]);
  lines('rift.kids.start', [
    { text: ['Both! I\'m BOTH. That means I get two of everything. That\'s the rule.', 'I\'m a hill-rift-hobbit. It\'s a new kind. I\'m the first. Probably.'] },
    { if: { rift: true }, text: ['I remember lights. And a lift that sang. And mom\'s hand. That\'s all, mostly.', 'The city was loud. Here is quiet. I like quiet now. Don\'t tell mom, she misses loud.'] },
    { if: { riftBlood: 'half' }, text: ['My mom says I\'ve got a rift nose. My dad says I\'ve got hill feet. I\'ve got my own everything else.'] },
    { if: { riftBlood: 'little' }, text: ['My gran came out of the sky! I\'ve got a sky gran! Nobody else has a sky gran.'] },
    { if: { riftTier: { min: 1 }, riftBlood: null }, text: ['I\'m not from the sky but I say "ping" anyway. Rift-folk say I\'m an honorary. That\'s a real word.'] },
    { if: { band: 'youth' }, text: ['Two worlds? Mostly it means two lots of people telling me how to live. But both lots make good food.'] },
  ]);
  lines('rift.kids.game', [
    { text: ['Hackers and dragons! One side hacks, one side breathes fire. The dragons always win. It\'s unfair.', 'Rift-tag! If you get tagged you\'re offline. You have to say "beep" till somebody reboots you.'] },
    { if: { band: 'youth' }, text: ['Games? I\'m too old for games. ...We do race to the Relay, though. That\'s training, not a game.'] },
    { if: { riftRelay: true }, text: ['Relay racing! First to touch the mast wins. You have to say "ping" when you touch it or it doesn\'t count.'] },
  ]);
  lines('rift.kids.eye', [
    { text: ['All the time. They ask if it can see through walls. It can\'t. I say it can. Then they\'re scared. It\'s good.', 'Sometimes. A big boy said it was a marble. I said HIS eyes were marbles. Then we were friends.'] },
    { if: { band: 'youth' }, text: ['Less now. They got used to it. I sort of miss being interesting.'] },
  ]);
  lines('rift.kids.dark', [
    { text: ['A bit! My eye goes green. I can find the cookie tin at night. That\'s the main use.', 'YOU walk into trees? But you\'re a WIZARD. Wizards shouldn\'t walk into trees.'] },
    { if: { rift: false }, text: ['I can\'t, but my cousin can. She leads us home from the pond. She\'s like a lantern with legs.'] },
  ]);
  lines('rift.kids.lead', [
    { text: ['Deal! I\'ll go first and say "tree!" before every tree.', 'Okay! Hold my hand. Mind the pond. Mind the OTHER pond.'] },
    { if: { rift: true }, text: ['Yes! My eye goes green and I\'ll shout which way! Left! Tree! Left!', 'Deal! I can see the path glow. Sort of. Follow me!'] },
    { if: { band: 'young' }, text: ['I\'ll be the lantern! Beep beep! This way!', 'Okay! But you have to carry me when I get tired.'] },
    { if: { band: 'youth' }, text: ['Ha. Sure. I\'ll walk the wizard home. That\'s a story for the Relay.', 'Fine. Don\'t walk into anything. People will think it\'s my fault.'] },
  ]);
  lines('rift.kids.play', [
    { text: ['YES! You can be the dragon! You\'re the biggest dragon! Tomorrow, after lessons!', 'You can play but you have to say "beep" when you\'re offline. Even wizards.'] },
  ]);
  lines('rift.kids.hillgame', [
    { text: ['Conkers! And hide-and-seek in the barley. I\'m best at hiding. Nobody can find me. Except mom.', 'Yes! Leapfrog. Hill games are good. You don\'t need a battery.'] },
  ]);
  lines('rift.kids.comfort', [{ text: ['...Really? They\'re jealous? ...Huh. I\'m going to tell them that.', 'Wish they had one. Okay. I\'ll let them look closer. For a cookie.'] }]);
  lines('rift.kids.fine', [{ text: ['The FINEST! I\'m telling everyone! The wizard said!', 'Hee! It\'s a good eye. It\'s mine.'] }]);

  // --- Every temper, every beat: more ways of saying it ------------------------------------
  const byTemper = (key, o) => lines(key, Object.keys(o).map((temper) => ({ if: { temper }, text: o[temper] })));
  byTemper('rift.food.paste', {
    cheerful: ["Paste! In a tube! Every color of gray! I didn't know what I was missing till your mushrooms!", "Vending noodles! They were fine! Then I had a pie and cried!"],
    ornery: ["Printed muck. Don't remind me. I'm still angry about every meal before this valley.", "Paste. Beige. Every day. Your sheep eat better than we did."],
    shy: ["...Mostly bars. Little gray bars. I ate them on my own.", "...Noodles from a box. They were all right. Not like here."],
    curious: ["Protein printed from algae, mostly. Fascinating process. Terrible flavor.", "Lab-grown everything. Here it all comes out of the ground. I still find that astonishing."],
    dreamy: ["Things that came in little lit boxes. Here food comes out of the earth with dirt on. I love the dirt.", "Steam from a hundred stalls. That's what I remember. More the steam than the food."],
    proud: ["The best the city could make. Which wasn't much. I made the best of it.", "I cooked my own when I could. Never touched the paste. Well. Rarely."],
  });
  byTemper('rift.food.scones', {
    dreamy: ["A scone. Warm. Jam like a sunset on it. I closed my eyes and the city went away.", "My first scone was at dusk, at a stranger's door. I'll remember it longer than the rift."],
    gloomy: ["Survived it. Barely. My jaw still aches. ...I went back for another. Don't tell anyone.", "A scone nearly finished what the rift started. It was delicious."],
  });
  byTemper('rift.food.sconewar', {
    cheerful: ["Ha! A scone doorstop! I'm going to make one for my hole!", "Brilliant! Scones for everything! Doorstops! Weapons! Pillows!"],
    shy: ["*giggles* Don't let the baker hear.", "Ha. I won't tell. ...I might tell."],
    curious: ["Forty years? I want to study it. Carbon-date the doorstop.", "Is that true? I'm going to check. I need to see this scone."],
    dreamy: ["A scone that's held a door for forty years. That's sort of beautiful.", "Everything here lasts. Even the scones. Especially the scones."],
    proud: ["Mine would last fifty. I've been practicing.", "Doorstops. Hm. My scones are softer than that."],
    gloomy: ["Ha. At least something here's built to last.", "Forty years. Longer than some cities."],
  });
  byTemper('rift.food.baking', {
    cheerful: ["Yes! They were awful! I loved them anyway! So did the hens!", "I tried! It went everywhere! Flour in my hair for a week!"],
    ornery: ["Once. The oven and I had words. The oven won.", "I tried. The baker laughed. I'm never trying again. I'm trying again tomorrow."],
    curious: ["Yes! Three times! Adjusting one variable each time! The fourth will be perfect!", "I've been experimenting with ratios. Cold butter matters. Nobody tells you why."],
    dreamy: ["I tried. They came out like little moons. Pale and lumpy and sort of lovely.", "Once, at dusk, with the window open. They weren't good. It was a good evening."],
    witty: ["I tried. The result is now a load-bearing part of my hole.", "Baked some. Built a wall with them. Very sturdy wall."],
    gloomy: ["Tried. Failed. Like most things the first time here.", "Once. They were bad. I ate them all anyway."],
  });
  byTemper('rift.food.tea', {
    cheerful: ["Converted! Totally! I drink it all day! I've started humming like a kettle!", "TEA! I love tea! Why did nobody tell us about tea?"],
    shy: ["...I like it. The pot gives you something to hold. When you don't know what to say.", "...Yes. I drink it quietly. It's nice."],
    dreamy: ["Tea's like holding a little bit of sunshine in a cup.", "The steam in the morning, curling up. Like the city's mist, but sweet."],
    proud: ["I've learned to make it properly. Pot warmed. Leaves measured. Better than half the lane.", "Converted, and I make it better than anyone in my row."],
  });
  byTemper('rift.food.missfood', {
    cheerful: ["Ramen! Oh, ramen! I'll make some! You'll love it! Everyone loves ramen!", "Noodles! Long ones! Slurpy ones! I miss slurping!"],
    ornery: ["Spice. Your food's lovely and it's got no fight in it. I miss food that fights back.", "Real chilli. Here everything's gentle. Too gentle."],
    shy: ["...A dumpling. Mom made them. I don't know how.", "...Just one bowl of broth from home."],
    curious: ["Fermented things! Here nobody ferments anything but ale. I've started a jar. It's bubbling.", "Spices. I've been trying to recreate them with herbs. Some success. One explosion."],
    witty: ["Anything that came in a box with a picture of what it wasn't.", "Pak's broth. And the shouting that came with it. Seasoning, that."],
    proud: ["My own cooking. I was good. I'll be good here too.", "My broth. I'll make it again. Properly. Here."],
    gloomy: ["Things nobody here can make. Things that don't exist any more.", "Mom's dumplings. I'll never have them again."],
  });
  byTemper('rift.food.catchup', {
    cheerful: ["I'm catching up as fast as I can! It's my favorite job!", "A great deal! I'm on it! Fork in hand!"],
    shy: ["...I'm trying. People keep giving me more.", "*nods, slightly overwhelmed*"],
    curious: ["How much catching up? I've estimated. It's several years of breakfasts.", "I've been keeping a list. Forty-two new foods so far."],
    dreamy: ["Every meal's a little bit of the life I missed.", "Catching up. One warm plate at a time."],
    witty: ["I've a lot of catching up to do. My waistcoat's a lot of letting out to do.", "Catching up? I'm overtaking."],
    proud: ["I'm catching up faster than any of the others.", "I've already caught up. I'm working ahead."],
    gloomy: ["I'll never catch up. But I'll try. Mostly with pie.", "Years of gray food. A lot of catching up."],
  });
  byTemper('rift.food.ritual', {
    cheerful: ["It's both! It's the best thing! Everyone stops and smiles!", "Ritual! With cookies! The best kind!"],
    ornery: ["Ritual. And a tyrannical one. You can't refuse a cup. It's illegal.", "It's a ritual. A compulsory one."],
    shy: ["...Ritual. It's the bit where everyone sits down. I like that bit.", "...It gives you something to do with your hands."],
    curious: ["Both, but the ritual matters more. I've timed how long people stay after the pot's empty. Ages.", "I've studied it. The tea's almost irrelevant. It's the stopping."],
    proud: ["Ritual. And I've mastered it.", "Both. I respect a good ritual."],
    gloomy: ["Ritual. It's the one time nobody's in a hurry.", "Both. And it's the warmest part of the day."],
  });
  byTemper('rift.food.proper', {
    cheerful: ["A proper hobbit! Yes! Let me tell everyone!", "Hooray! I'm a hobbit! Mostly!"],
    ornery: ["A proper hobbit. Hm. I'll take it. Don't tell anyone.", "Proper. Ha. I've still got the boots."],
    shy: ["...A proper hobbit. Really? Thank you.", "*smiles, a bit pink*"],
    curious: ["Proper hobbit. What's the threshold? I'd like to know how close I am.", "What makes a proper hobbit, exactly? I'm collecting criteria."],
    dreamy: ["A proper hobbit... I'd like that. I'd like it very much.", "One day. Maybe I already am, a bit."],
    witty: ["A proper hobbit. Next I'll be complaining about the weather and loving it.", "Proper. My feet are getting hairier. It's happening."],
    gloomy: ["Proper hobbit. Maybe. If they'll have me.", "I'll never be proper. But I'm close enough."],
  });
  byTemper('rift.food.ramen', {
    cheerful: ["Yes! A ramen night! Everyone! At the Badger! I'll make SO much!", "I'll do it! You'll love it! Everybody loves it!"],
    ornery: ["Fine. But if anyone puts gravy in it, I'm leaving.", "I'll cook. They'll moan. Then they'll ask for more."],
    curious: ["Mushrooms, barley noodles, a good stock. Let me experiment. Three batches.", "I'll adapt the recipe. Local ingredients. A research project."],
    dreamy: ["Ramen at the Badger, steam in the lamp-light. Like home. Like here. Both.", "I'll make it on a rainy night. That's when it tastes most like home."],
    witty: ["Ramen at the Badger. Hill-folk with chopsticks. I'm selling tickets.", "I'll cook. You bring the fire buckets."],
    proud: ["I'll make the best broth this valley's ever had.", "They'll talk about it for years."],
    gloomy: ["Maybe. It won't be the same. ...It might be nice anyway.", "I'll try. Things never taste like home. But I'll try."],
  });
  byTemper('rift.food.kettle', {
    cheerful: ["The kettle! Oh! It's everywhere! Our sign and your tea! That's wonderful!", "A kettle! Everywhere I look! Like a little hello from home!"],
    ornery: ["A kettle. Huh. I've been staring at that mark my whole life and never thought about it.", "Kettle on the sleeve, kettle on the stove. Someone's having a joke."],
    shy: ["...Oh. The kettle. I never thought.", "*looks at their sleeve for a long moment*"],
    curious: ["The kettle. A city sigil and a hobbit tea-ritual. That can't be coincidence. I'll find out.", "A kettle. Same shape. Same copper. I need to look into this."],
    dreamy: ["The kettle. Like a thread tying two worlds together.", "It's like the city left a message for me. On every stove."],
    witty: ["The kettle. Our sacred symbol is your hot water jug. I'm dying.", "A kettle. Of course. Everything comes back to tea here."],
    proud: ["Our mark. In your kitchens. I knew there was something.", "The kettle. It means something. I'll prove it."],
    gloomy: ["The kettle. Back home it's going cold. Here it's always on.", "Huh. A kettle. Home's everywhere and nowhere."],
  });
  byTemper('rift.customs.strange', {
    proud: ["Your Moots. Everyone talks at once and somehow decides something. We had a Council. One voice.", "That you share everything. Nobody keeps score. I'm still learning not to."],
    gloomy: ["How sure you all are, about everything. I've never been that sure.", "How nobody leaves. Families stay in one hole for a hundred years."],
  });
  byTemper('rift.customs.birthday', {
    shy: ["...I went to one. They gave me a scarf. I didn't know what to do. I said thank you four times.", "...I didn't know. I brought nothing. Then I got a jar of honey."],
    curious: ["It's fascinating! The gifts circulate! Nobody hoards anything! I'm writing a paper.", "The economy of it! Everyone gives, everyone gets. Who designed this?"],
    dreamy: ["Giving on your own birthday. It's like saying thank you for being born. Lovely.", "I want to give everyone something on mine. I've been saving little things."],
    proud: ["I went to one and gave the best gifts. Someone else's birthday and I won it.", "I understand it now. I'll do mine properly."],
  });
  byTemper('rift.customs.mathom', {
    cheerful: ["Yes! A brass thing! Nobody knows what it is! I love it!", "I got one! I gave it on! It came back! It loves me!"],
    ornery: ["A broken clock. Nobody wants it. Not even me. It's mine now, apparently.", "Yes. An ugly vase. I tried to give it away. It came back in a week."],
    shy: ["...A little china dog. I kept it. I'm not supposed to keep it, am I?", "...Yes. I don't know what to do with it."],
    dreamy: ["A tin music box that plays half a tune. I wind it at night. The half's enough.", "A mathom. It's like a story nobody finished."],
    witty: ["A mathom is a present that's going somewhere else. Like gossip.", "Yes. A cracked teapot. It's done more rounds than the mail carrier."],
    proud: ["Several. I've given away more than anyone in my lane.", "Yes. And I passed it on correctly."],
    gloomy: ["A mathom. Something nobody wanted. Felt about right.", "A cracked plate. I've kept it. It feels like me."],
  });
  byTemper('rift.customs.law', {
    cheerful: ["The law! I'll obey! Who's next? I'll give them EVERYTHING!", "Ha! Yes! Birthday law! I love your laws!"],
    ornery: ["A law. Typical. Fine. Whose birthday is it? They're getting the vase.", "That's not a law, it's a conspiracy."],
    shy: ["...Okay. I'll find someone. Quietly.", "*nods solemnly*"],
    curious: ["Is it actually a law? Who enforces it? I have questions.", "Noted. When's the next birthday? I'll track it."],
    dreamy: ["A law about giving. That's the nicest law I've heard.", "I'll give it to someone who'll love it. Or at least keep it."],
    witty: ["The Mathom Act. Strictly enforced by aunties.", "I'll give it to you. On your birthday. You'll have no choice."],
    proud: ["I know the law. I'll follow it better than anyone.", "Of course. I'll give it with dignity."],
    gloomy: ["Then it'll come back to me. They always do.", "Fine. Someone else can have the ugly thing."],
  });
  byTemper('rift.customs.taught', {
    cheerful: ["Loads! Songs! Words! Games! I teach everyone everything!", "The kids learned 'ping' in a day! I'm so proud!"],
    ornery: ["Taught you? You lot don't learn. ...Except the kids. And the miller. And the innkeeper.", "I've taught them to say 'lag' about the mail. It's my finest achievement."],
    curious: ["A few things! And I've been tracking how they spread! Kids first, then everyone!", "Binary. With acorns. The little ones are faster at it than our kids were."],
    dreamy: ["A song. At dusk, on the hill. The children hum it now.", "The way we say goodnight. 'Lights low.' Some of you say it now."],
    witty: ["To say 'copy that' instead of 'right you are'. A hundred years of hobbit culture, undone in a week.", "How to complain about the Relay. Very popular."],
    gloomy: ["Not much. A song or two. Maybe that's enough.", "A few words. They'll outlast us, maybe."],
  });
  byTemper('rift.customs.best', {
    cheerful: ["Parties under the big tree! Everyone dancing! I love it so much!", "Second breakfast! And elevenses! And the parties! All of it!"],
    ornery: ["The afternoon nap. Finally, a society that understands rest.", "Not having to explain myself to anyone. You lot just let people be."],
    shy: ["...Leaving a light on for whoever's out late. I noticed the first night.", "...How you sit together without talking. I'm good at that."],
    curious: ["The way you keep old things. Nobody throws anything away. Everything has a history.", "Mathoms! The whole idea! I'm obsessed."],
    proud: ["The respect for craft. A good table lasts a hundred years. I respect that.", "Second breakfast. And I've perfected it."],
  });
  byTemper('rift.customs.catching', {
    cheerful: ["Everything! Neon at parties! Ping at the market! It's spreading like jam!", "Loads! I hear 'full signal' everywhere now! It makes me so happy!"],
    shy: ["...The kids say 'ping'. I hear it at the pond. It makes me smile.", "...A few things. I don't want to push."],
    curious: ["I've been mapping it! Ping spread fastest! Then neon trim! Then the songs!", "The slang's catching fastest. Language always does. Fascinating."],
    dreamy: ["Little things. Like seeds blowing on the wind. They land where they land.", "A song here, a word there. Like two rivers meeting."],
    witty: ["'Lag'. Everyone's using it about the mail. The mail carrier's furious.", "Neon bunting. The elders pretend to hate it. They dance under it."],
    proud: ["Plenty. And most of it's from me.", "Our ways are good. Of course they're catching on."],
    gloomy: ["A little. Enough that we won't be forgotten.", "Some. It's nice. It means we're here."],
  });
  byTemper('rift.customs.bunting', {
    cheerful: ["Ha! They'll forgive us! They danced under it! I saw!", "They love it really! Everyone glows at parties now!"],
    ornery: ["They'll forgive it. Or they won't. It's still going up.", "The elders can stand under it and complain. It's good for them."],
    shy: ["...I hope they're not too cross. It's pretty, isn't it?", "*worried giggle*"],
    curious: ["Actually, the elders' feet tap faster under neon. I've observed it. Science.", "The bunting's improved attendance by a third. The elders came to complain. Then stayed."],
    dreamy: ["Neon bunting in the party tree. Like the city came to visit for the night.", "They'll grow to love it. Everyone does, eventually."],
    witty: ["The elders' official position is outrage. Their unofficial position is the dance floor.", "Never forgive us? They asked for more for Midsummer."],
    proud: ["It's beautiful. They'll see that.", "I made that bunting. They'll come round."],
    gloomy: ["Probably not. But it'll still be there next year.", "They'll forgive. Or they won't. It still glows."],
  });
  byTemper('rift.customs.keep', {
    cheerful: ["Yes! Second breakfast in Neverdark! Everyone would be so happy!", "I'd teach them all of it! Every song! Every pie!"],
    ornery: ["They'd never accept it. Too busy. ...I'd try anyway.", "Neverdark doesn't stop for breakfast. It should."],
    shy: ["...I'd teach the little ones. Quietly.", "...Maybe. One song."],
    curious: ["I'd want to see if it spreads there like it spread here. An experiment.", "I'd introduce it in one district first. Control group."],
    dreamy: ["I'd teach them to stop and look at the sky. That's the most important one.", "I'd take the willow song. Sing it in the dark streets. Light by light."],
    witty: ["Second breakfast. They'd call it a productivity crisis.", "I'd try. The city would need a nap."],
    proud: ["Of course. I'd bring the best of here to the best of there.", "I'd teach it and they'd listen."],
  });
  byTemper('rift.customs.yours', {
    cheerful: ["Mine too! Hooray! I'll treasure it!", "Yes! Mine! I'm so happy!"],
    ornery: ["Mine. Hm. Well. I'll take it.", "Fine. I'll keep it. It's nice."],
    curious: ["Mine. That's interesting. When does a custom become yours?", "Ownership of a song. Fascinating idea."],
    dreamy: ["Mine too... like a gift from the valley.", "I'll carry it with me. Always."],
    witty: ["Mine. Without even signing anything. Your paperwork's very lax.", "Mine, and I didn't even have to give a mathom for it."],
    proud: ["Mine. And I'll do it justice.", "Thank you. I've earned it."],
    gloomy: ["Mine. ...That's nice. To have something that's mine.", "Okay. Thank you."],
  });
  byTemper('rift.wary.start', {
    dreamy: ["Kindly, mostly. Some folk look at us like we're a dream they're not sure about.", "Some are lovely. Some are scared. I understand the scared ones. I was scared too."],
  });
  byTemper('rift.wary.stare', {
    curious: ["I've categorized the starers. Curious, worried, rude. The curious ones talk to me eventually.", "It's fascinating, honestly. Who stares, who waves, who hides. There's a pattern."],
    dreamy: ["I wave at the ones who hide behind curtains. Maybe one day the curtain will wave back.", "They look at me like I'm a ghost. Maybe I am, a bit."],
    proud: ["I don't hide. I walk where I like. They'll get used to it.", "They stare. I hold my head up. That's all."],
    gloomy: ["Some days the staring's all I notice.", "There's one who still cuts me dead. Every day. It wears."],
  });
  byTemper('rift.wary.first', {
    cheerful: ["Oh, a lovely lady with a basket of eggs! She gave me six! I didn't know what to do with them!", "A little lad! He asked if I was a robot! I said yes! He was thrilled!"],
    ornery: ["An old farmer who told me I was standing in his cabbages. Rude. We're friends now.", "Someone who shouted at me. Then apologized. That's how you know they mean it."],
    shy: ["...A girl at the well. She just smiled. That was enough.", "...Someone left a loaf on my step. I never found out who."],
    curious: ["A child who asked forty questions. I answered thirty-nine. The fortieth was about my eye.", "The storyteller. Asked about the city and wrote down everything I said."],
    witty: ["The innkeeper. Asked if I wanted ale. I said yes. Instant citizenship.", "A goose. It was hostile, but it was first."],
    proud: ["I said hello first. Nobody else would. So I did.", "The miller. Because I fixed his wheel. Respect earned."],
  });
  byTemper('rift.wary.slow', {
    cheerful: ["All the way! I can wait! I'm good at waiting! Not really! But I'll try!", "Slow and warm! Like a pie! I love it!"],
    curious: ["Slow to warm, all the way. I'm measuring the rate.", "That's what I've seen. The curve's slow at first, then steep."],
    dreamy: ["Like the sun coming up. Slow, then everything's gold.", "Like spring. You don't see it, then it's everywhere."],
    witty: ["Slow? It took a goose a week to trust me. Hobbits are slower than geese.", "I'll set a reminder for next year."],
    proud: ["I'll earn it. However long it takes.", "Then I'll be patient. I can be patient."],
    gloomy: ["I hope so. Some days it feels like they never will.", "Slow. Yes. I just hope I'm still here when they warm."],
  });
  byTemper('rift.wary.hurt', {
    cheerful: ["A bit! But I don't let it stop me! I just smile harder!", "Sometimes. Then someone gives me a pie and I forget."],
    ornery: ["Hurt? It makes me angry. Angry's easier than hurt.", "Hurt. Yes. I won't let them see it."],
    shy: ["...Yes. I go home and sit for a while.", "...It's why I don't go out much."],
    curious: ["It does. I try to understand why they're scared. It helps a little.", "I didn't expect it to. It does. Interesting how that works."],
    dreamy: ["Like a cold draft through a warm room.", "It aches. Then it fades. Then it comes back."],
    witty: ["Does it hurt? Only my feelings. And my feelings are very large.", "A little. I cope with jokes. You may have noticed."],
  });
  byTemper('rift.wary.bread', {
    cheerful: ["Bread! Yes! I'll bake for the whole lane!", "Ha! Bread diplomacy! I love it!"],
    shy: ["...Bread. I could leave it on a step.", "...Okay. Bread. I'll try."],
    curious: ["Bread as a trust mechanism. Fascinating. I'll test it.", "Hobbits trust bread. I've seen it. It's true."],
    dreamy: ["Bread. Warm, shared. That's how you make friends anywhere.", "I'll bake at dawn and leave it while it's warm."],
    witty: ["Bread. The universal language. Even geese speak it.", "Bribery with bread. Very traditional."],
    proud: ["I'll bake the best bread they've ever had. Then they'll see.", "Good bread speaks for itself."],
    gloomy: ["Bread. Okay. I hope it's enough.", "It might work. Things sometimes do."],
  });
  byTemper('rift.wary.friend', {
    cheerful: ["Friends for life! Yes! The best!", "I'll tell them! They'll be so pleased!"],
    ornery: ["For life. Hm. They'd better not snore.", "For life. Fine. Lucky them."],
    shy: ["...For life. That's nice.", "*small, happy smile*"],
    curious: ["For life. Is that how it works here? Once made, never broken?", "Fascinating. Friendship as a lifelong contract."],
    dreamy: ["Friends for life. Like an anchor.", "That's the best thing I've heard."],
    witty: ["For life. Long sentence. Good company.", "Friends for life. No escape clause."],
    proud: ["For life. And I'll be a good friend back.", "Yes. They chose well."],
    gloomy: ["For life. I hope so. People leave.", "I'd like that. I'll hold onto it."],
  });
  byTemper('rift.wary.cat', {
    cheerful: ["Ha! Like cats! I love cats!", "Then I've got a lot of cats coming!"],
    ornery: ["Cats. Great. I'll have them sitting on me forever.", "Hm. Cats don't stare, though."],
    shy: ["*laughs softly* Like cats. Yes.", "Ha. I like cats."],
    curious: ["Cats! Yes! Same behavior pattern! Suspicion, then sudden devotion!", "That's a good model. I'll use it."],
    dreamy: ["Like cats curling up by a fire. Yes.", "That's a lovely way of seeing it."],
    witty: ["Like cats. So they'll bring me dead mice next?", "Then I'll need a cat flap."],
    proud: ["Like cats. They'll come to me when they're ready.", "I'll wait. I'm good with cats."],
    gloomy: ["Like cats. Then they leave you for whoever's got more fish.", "Ha. Maybe."],
  });
  byTemper('rift.wary.word', {
    cheerful: ["You'd do that? Thank you! You're the best wizard!", "A word from you! That'll do it!"],
    ornery: ["A word. Not a lecture. They hate lectures. So do I.", "Hm. Fine. But gently."],
    shy: ["...You'd do that? For me? ...Thank you.", "...Please be kind about it."],
    curious: ["A word from a wizard. I wonder how much that weighs here. Let's find out.", "Interesting. I'd like to see if it changes anything."],
    dreamy: ["A word. Like a seed. Let's see what grows.", "Thank you. Kind words go a long way here."],
    witty: ["A wizard's word. Heavier than a turnip. Lighter than a scone.", "Go on. Tell them I'm delightful. It's true."],
    gloomy: ["Thank you. It might not help. But thank you.", "I'd like that. Even if nothing changes."],
  });
  byTemper('rift.relay.start', {
    cheerful: ["The Relay! It's brilliant! Everyone posts silly things! I post silly things!", "It's how we stay together! Pings and posts! It's lovely!"],
    dreamy: ["Little lines of light, all evening. Like lanterns hung in the dark.", "It's the city's voice, small, in a valley. I like hearing it."],
  });
  byTemper('rift.relay.posts', {
    ornery: ["Nonsense, mostly. 'Rained again.' Yes. We know. We're standing in it.", "Gossip with spelling mistakes. And a hill-folk asking how to make letters bigger."],
    shy: ["...Little things. Somebody's lost hen. Somebody's birthday.", "...I like reading them at night. All the little lives."],
    curious: ["Everything! Weather, births, scrap, songs! It's a perfect record of the village!", "I've been categorizing them. Mostly food."],
    proud: ["The important things. Who's built what. Who needs help.", "Useful things. I post useful things."],
    gloomy: ["Homesick things, at night. Everyone pretends they're jokes.", "'miss the trains tonight.' That sort of thing."],
  });
  byTemper('rift.relay.hedge', {
    cheerful: ["Ha! A hedge! I love it! The Relay is a hedge!", "Shouting over a hedge! Yes! That's exactly it!"],
    shy: ["...I'm not good at shouting. The Relay's easier.", "*laughs quietly* A hedge."],
    curious: ["The Relay is just a hedge with range! You're right! The principle's the same!", "Yes! Same thing! Different medium!"],
    dreamy: ["A very long hedge, glowing in the dark. Yes.", "Shouting over a hedge in the moonlight. Lovely."],
    proud: ["Our hedge reaches further.", "Ours is a better hedge."],
    gloomy: ["At least a hedge answers back. The Relay mostly hums.", "A hedge. Yes. But mine's on the other side of the sky."],
  });
  byTemper('rift.relay.home', {
    cheerful: ["Every night! A little hello! Maybe someone's getting them!", "Pings! Lots! One day one will come back!"],
    ornery: ["Every night. Nothing back. I keep sending. Don't tell me it's pointless.", "I send. The static eats them. I send more."],
    shy: ["...Every night. I don't tell anyone.", "...A little message. Always the same one."],
    curious: ["I send on different frequencies. If one gets through I'll know which.", "Every night. I log every send. Nothing yet."],
    dreamy: ["I send a little light up into the sky. Every night. Like a wish.", "Every night. 'Lights low. Love you.' Into the dark."],
    witty: ["Every night. The static's received forty messages from me. It's never replied. Rude.", "I send. Nothing comes back. The worst pen pal."],
    proud: ["I send reports. Someone should know we're well.", "I keep the line open. Someone has to."],
    gloomy: ["I send. I stopped expecting. I still send.", "Every night. Into the nothing."],
  });
  byTemper('rift.relay.mine', {
    cheerful: ["Loads! Mostly pictures of hedgehogs! The hedgehogs are very popular!", "'Full signal today!' Every day! Because it's true!"],
    ornery: ["One. 'Stop posting about the weather.' It didn't work.", "I posted that the goose is a menace. Forty pings."],
    curious: ["Observations! 'Bees prefer the purple clover.' Nobody pinged. I don't care.", "Data. Weather, harvest times. Someone has to."],
    dreamy: ["'Stars out. Look up.' That's all I ever post.", "Little things I notice. A dewdrop. A heron."],
    witty: ["'Second breakfast is a human right.' Most pinged post in the valley's history.", "I posted a riddle. Nobody's solved it. Including me."],
    gloomy: ["Once. 'miss home.' Then I deleted it. Everyone saw.", "Not much. I read more than I post."],
  });
  byTemper('rift.relay.static', {
    cheerful: ["...Listen! There's something there! Under the hiss! Isn't it exciting?", "...Shh! I think I hear something!"],
    ornery: ["...It's static. It's always static. ...Except when it isn't. Listen.", "...There. Hear that? Or am I going mad."],
    shy: ["...Sometimes there's a voice. Very quiet. I don't tell anyone.", "...Listen. Just there."],
    curious: ["...There's a pattern in the static. At dusk especially. I'm recording it.", "...It's not random. I've checked. Something's underneath."],
    dreamy: ["...Like the sea in a shell. But the sea is a city.", "...I hear voices in it. Old ones. Kind ones."],
    witty: ["...The static's chattier than most hobbits. Listen.", "...Either it's a voice or I need more sleep."],
    proud: ["...I can hear things others can't. Listen.", "...I tuned it myself. Listen closely."],
    gloomy: ["...Sometimes I think I hear home. Then it's gone.", "...It's like someone calling from the bottom of a well."],
  });
  byTemper('rift.relay.voice', {
    cheerful: ["It's asking if anyone's there! And I say yes! Every time!", "It's old and kind and it's looking for us! Isn't that wonderful?"],
    ornery: ["It's asking for help. And nobody's answering. Except me. Like a fool.", "The kettle's gone cold, it says. Every night. Same words."],
    shy: ["...It sounds lonely. I whisper back. I don't know if it hears.", "...It's sad. Kind and sad."],
    curious: ["It's the Lamplighter. I'm almost certain. The cadence matches the old recordings.", "Same message. Every dusk. Like a beacon."],
    dreamy: ["It's the city, calling its children home. Or calling them away. I can't tell which.", "A voice like a lullaby, worn thin."],
    witty: ["It's asking for tea. I'm not even joking. 'The kettle's gone cold.'", "The oldest machine in two worlds, and it wants a cup of tea."],
    proud: ["It's the Lamplighter. I'd know it anywhere.", "It's asking for us. We'll answer."],
    gloomy: ["It's dying. Listen to it. It's dying and it's still asking about us.", "It's saying goodbye, I think."],
  });
  byTemper('rift.relay.pings', {
    cheerful: ["Yes! Someone's listening! I believe it!", "Not wasted! Hooray! I'll send two tonight!"],
    ornery: ["Not wasted. Hm. Maybe. I'll keep sending anyway.", "Fine. Not wasted. Still annoying."],
    shy: ["...Okay. I'll keep sending.", "*nods*"],
    curious: ["Not wasted. A message sent changes the sender, if nothing else. I'll accept that.", "Interesting. I'll keep a record."],
    dreamy: ["Someone listening. Like a lamp in a far window. Yes.", "I'll imagine them reading it. That's enough."],
    witty: ["Not wasted. Just undelivered. Like the mail.", "Keep sending. The static's going to have to reply eventually."],
    proud: ["I'll keep the line open. Someone will hear.", "Not wasted. Nothing I do is."],
  });
  byTemper('rift.lamp.built', {
    cheerful: ["Saint Mungo! He's lovely! Little round face! Big feet! He's on everything!", "Saint Mungo! Every kid in the city loves him!"],
    ornery: ["A saint. With a kettle. Don't laugh. ...Fine, laugh.", "Saint Mungo. The church says he walked out of the dark. I say he got lost."],
    shy: ["...Saint Mungo. Mom had a little picture of him. Over the stove.", "...Saint Mungo. He's kind, in the stories."],
    dreamy: ["Saint Mungo, who walked out of the storm with fire in a kettle. I always loved that story.", "A saint from nowhere, with big feet. Like someone from here."],
    proud: ["Saint Mungo of the First Lamp. Founder of the greatest city there ever was.", "Our saint. Our founder. Our light."],
    gloomy: ["Saint Mungo. He lit the first lamp. Now the last ones are going out.", "Saint Mungo. I wonder if he'd be sad, seeing it now."],
  });
  byTemper('rift.lamp.tended', {
    cheerful: ["Everything! It was like a giant friendly grandmother! A grandmother made of light!", "It lit the clouds pink on festival nights! Everyone cheered!"],
    ornery: ["Everything. And nobody thanked it. Not once. Then they wondered why it got tired.", "Everything. We took it for granted. Every one of us."],
    shy: ["...It kept us safe. I used to say goodnight to it.", "...It hummed. That's how you knew you were safe."],
    curious: ["Power distribution, traffic, the cloud-glow. One machine. Nobody knows how.", "I've seen plans of the outer layers. The core's never been mapped."],
    witty: ["Everything. Imagine if your miller also ran the weather and the mail. That.", "It was the city's mom. Nobody ever called."],
    proud: ["It kept ten million people safe. Every night. For centuries.", "Everything. The greatest machine ever built."],
    gloomy: ["Everything. That's why it's so bad that it's tired.", "It did everything. Now it can't."],
  });
  byTemper('rift.lamp.song', {
    cheerful: ["That's our song! How do you know our song? Sing it again!", "Down by the willow lamp! We sing it to babies! I can't believe this!"],
    ornery: ["That's... that's a Neverdark lullaby. Who taught it to you?", "Hum it again. ...Hm. That's ours. Or it's yours. Or both."],
    curious: ["That's the city lullaby! Exactly! The same notes! That's not possible! Unless...", "How? A song from here in a city over there? Somebody carried it."],
    dreamy: ["...My gran sang that. In the dark. With the window open to the glow.", "It's the same song. Two worlds, one song. Like a bridge."],
    witty: ["You've stolen our lullaby. Or we stole yours. Either way, someone owes royalties.", "The same song. Our city's oldest tune was a hobbit hit."],
    proud: ["That's ours. The oldest song in the city. And it's yours too.", "That's our lullaby. It belongs to both of us, then."],
    gloomy: ["...Nobody's sung that to me since I was small.", "That song. Oh. That song."],
  });
  byTemper('rift.lamp.kettle', {
    cheerful: ["The kettle! It's on everything! Coins! Trains! I've got one on my boot!", "The kettle's our sign! Isn't it funny? You have kettles too!"],
    ornery: ["The kettle. Everyone's mark. Nobody asks why. I asked why. Nobody knew.", "It's a kettle. On everything. Don't ask me why."],
    shy: ["...The kettle. Mom sewed one on my sleeve. For luck.", "...It's the city's mark. Always has been."],
    curious: ["The kettle's on everything. The oldest coins have one. I've always wondered.", "Every seal, every badge. A kettle. Odd choice for a city of light."],
    dreamy: ["The kettle. It means home, back there. Funny, it means home here too.", "A kettle, warm, waiting. That's what the city was meant to be."],
    witty: ["The kettle. Our city's crest is a tea appliance. Says a lot.", "A kettle. Founded on tea. Like every good thing."],
    proud: ["The kettle. Our mark. Our pride.", "The first lamp was a kettle. Never forget."],
    gloomy: ["The kettle. And it's gone cold, they say.", "The kettle. It's on the city's gates. Above the dark."],
  });
  byTemper('rift.lamp.mungo', {
    cheerful: ["Mungo! From here! Oh, that's wonderful! We're cousins!", "A hill name! Our saint's a hobbit! I love that!"],
    ornery: ["A hill name. Hm. So our saint was a runaway hobbit. Figures.", "Mungo. From here. Of course he was. Stubborn and odd."],
    shy: ["...A hill name. Oh. So he was like you.", "*stares, wide-eyed*"],
    curious: ["Mungo's a hill name? Then he came from here! That explains the kettle, the song, everything!", "A hill name! The pieces are fitting! Tell me everything!"],
    witty: ["Our saint was a hobbit with a kettle and a bad sense of direction. Explains a lot.", "A hill-hobbit founded my city. I'll never hear the end of it."],
    proud: ["Then our founder came from good stock. I always knew it.", "A hill-hobbit, founding a city. Of course he did."],
    gloomy: ["So he was lost too. Like us. And he never came home.", "A long way from home, Mungo. Just like me."],
  });
  byTemper('rift.lamp.fading', {
    cheerful: ["Tired. But I keep hoping! Maybe it's resting!", "It flickers. But it's still going! Last I knew!"],
    ornery: ["Fading. And the Council pretended it wasn't. Cowards.", "Going out. And everyone pretending it isn't."],
    shy: ["...It's getting dark. I don't like thinking about it.", "...It flickers. I used to watch it flicker."],
    curious: ["Fading. I measured it. Output's down by half in twenty years.", "The decline's accelerating. I've seen the numbers."],
    dreamy: ["Like a candle near the end. Brighter for a moment, then smaller.", "The clouds go gray now. They used to be gold."],
    witty: ["Fading. Like my enthusiasm for mornings.", "Dimming. Someone forgot to change the bulb for three hundred years."],
    proud: ["Fading. But it held on longer than anyone thought possible.", "It's tired. It's earned its tiredness."],
  });
  byTemper('rift.lamp.relit', {
    cheerful: ["Yes! Relit! I believe it! Let's relight it!", "Relit! You're right! Lamps are for lighting!"],
    ornery: ["Relit. Easy to say. How?", "Hm. If anyone can, it's not the Council."],
    shy: ["...I hope so.", "*nods, hopeful*"],
    curious: ["Relit. How? What would it take? I'd like to work that out.", "That's a design problem. I like design problems."],
    dreamy: ["Relit... like morning after a long night.", "That's a lovely thought. I'll hold onto it."],
    witty: ["Relit. Just need a very long match.", "Relit. I'll bring the kettle."],
    proud: ["Then we'll relight it. Somehow.", "If anyone can, we can."],
    gloomy: ["Maybe. Some lamps go out for good.", "I want to believe that."],
  });
  byTemper('rift.lamp.sent', {
    cheerful: ["Sent us somewhere safe! And it worked! Look at this place!", "Yes! And it chose so well! Pies! Stars!"],
    ornery: ["Sent us. Without asking. ...It was right, though.", "Sent us. Pushed us, more like. Kindly."],
    curious: ["That's my theory. The rifts aren't random. They're aimed. Here.", "It makes sense. It chose a place with power, peace and pie."],
    dreamy: ["Sent us to the soft place. Like a mother putting children to bed.", "I think it sang us here."],
    witty: ["Sent us. With no luggage and no instructions. Very parental.", "Sent us somewhere safe. And with good catering."],
    proud: ["Sent us because we were worth saving.", "It chose us. And it chose well."],
    gloomy: ["Sent us away. While it stays in the dark. Alone.", "Sent us. I don't know if it's a kindness or a goodbye."],
  });
  byTemper('rift.slang.start', {
    shy: ["...'Ping.' It means hello. Quietly.", "...'Copy.' Means I heard you. That's a nice one."],
    proud: ["'Full signal.' Happy. And I say it best.", "Let me teach you properly. 'Ping.' Crisp. Not like a hen."],
  });
  byTemper('rift.slang.tried', {
    shy: ["*giggles* That was... nearly right.", "Oh. Um. Almost?"],
    curious: ["Close! The emphasis is wrong. It's 'PING' not 'piiing'.", "Interesting. You've got an accent. A wizard accent."],
    dreamy: ["Ha. It sounded like a bell. A lost bell.", "That was lovely. Wrong. But lovely."],
    proud: ["No. Watch. 'Ping.' Like that.", "Not bad. For a beginner."],
    gloomy: ["Ha. Yes. Close enough. Nobody says it right any more anyway.", "Ha. That's... yes. Sort of."],
  });
  byTemper('rift.slang.breakfast', {
    cheerful: ["Second breakfast! We kept it! It's the best word!", "We don't translate it! It's too good!"],
    ornery: ["We don't have a word. We didn't deserve one.", "'Second breakfast.' We stole yours. No apologies."],
    shy: ["...We just say 'second breakfast' now.", "...There isn't one. We use yours."],
    curious: ["There isn't one! Linguistic gap! We borrowed yours wholesale!", "We never had the concept. We had to import the word."],
    dreamy: ["We never had one. Now it's the most important word I know.", "There's no word. Only a feeling. A warm one."],
    proud: ["'Second breakfast.' I say it properly now.", "We use your word. Respect where it's due."],
    gloomy: ["There wasn't one. There wasn't a second anything.", "We never had enough for one breakfast."],
  });
  byTemper('rift.slang.again', {
    cheerful: ["Ha! Ping ping ping! You're getting it!", "Yes! Again! You're a natural!"],
    ornery: ["Stop. Please. Stop pinging.", "One more and I'm logging off."],
    shy: ["*laughs* Okay. That one was good.", "Ha. Yes. Ping."],
    curious: ["The third one was closest. Keep the vowel short.", "Getting better! The second was off but the third landed."],
    dreamy: ["Ping. Like raindrops on a tin roof.", "Ha. That one sounded like home."],
    proud: ["Acceptable. Barely.", "Better. Not good. Better."],
    gloomy: ["Ha. You sound like the Relay at dusk.", "That's... actually quite good."],
  });
  // their questions for the wizard, by temper
  byTemper('rift.askb.q', {
    cheerful: ["Wizard! Do you have a battery? You must! You're always so full of beans!", "Where do you plug in? Do you need a charge? I could lend you my cable!"],
    ornery: ["Wizards. Do you run on something, or is it just smugness?", "What's your power source? And don't say 'magic', that's cheating."],
    shy: ["...Can I ask something silly? Where do you charge up?", "...Do wizards get low battery? Like us?"],
    dreamy: ["Do you run on starlight? I think you might run on starlight.", "Where does your glow come from? You've got a sort of glow."],
    witty: ["Is the beard a solar panel? Be honest.", "Do you plug the staff in at night, or is that rude to ask?"],
    proud: ["I've worked out most things here. Not you. What's your power source?", "What keeps you going? I want to know."],
    gloomy: ["Do you ever run down? Completely?", "Do wizards ever just... stop?"],
  });
  byTemper('rift.askb.r.tale', {
    cheerful: ["A fire in you! Of course! I could tell! You're all warm!", "That's brilliant! A wizard battery!"],
    ornery: ["A fire. Lit long ago. Fine. I'll accept that. It's better than 'magic'.", "Hm. Romantic answer. I'll allow it."],
    shy: ["...A fire. That's beautiful.", "*wide-eyed nod*"],
    curious: ["A fire that's never gone out? What fuels it? How long ago? Please, more.", "I need the specifications of this fire."],
    witty: ["A fire. So you're a very old kettle.", "A fire inside. So when you're grumpy, it's indigestion?"],
    proud: ["A fire. Yes. I've got one too. Smaller.", "Then we're the same, more or less."],
    gloomy: ["A fire that doesn't go out. I'd like one of those.", "Lucky. Mine's down to embers."],
  });
  byTemper('rift.askb.r.jest', {
    cheerful: ["The hat! I knew it! I'm getting a hat!", "Ha! The hat! Everyone said! I said!"],
    ornery: ["The hat. Course. Ridiculous. ...Can I try it?", "That's not an answer, that's an accessory."],
    shy: ["*laughs* The hat. Really?", "Ha. That's silly. Is it true?"],
    curious: ["The hat! Is it lined with anything? Copper? I need to check.", "If it's the hat, what's the charging rate?"],
    dreamy: ["The hat. Pointed at the sky, catching the stars. That makes sense.", "Ha. A star-catching hat."],
    witty: ["The hat. So if I steal it, I'm the wizard? Asking for a friend.", "Charged by the hat. Explains the brim."],
    proud: ["The hat. I'll design a better one.", "Ha. Then I'll need a hat."],
    gloomy: ["The hat. ...I'd like a hat that fixed things.", "If only it were that easy."],
  });
  byTemper('rift.askb.r.share', {
    cheerful: ["You run low too? Then I'll make you tea! Lots!", "Oh! Then we'll look after each other!"],
    ornery: ["Hm. Low. So you're not perfect. Good.", "Even wizards. Fine. That's comforting. Don't tell anyone I said."],
    shy: ["...Me too. Tea helps me too.", "*nods, understanding*"],
    curious: ["Interesting. Low how? Tired? Sad? Both?", "Tea as recharge. You've confirmed my theory."],
    dreamy: ["Even you. Like a moon that wanes. Then comes back.", "Tea. And a good sit. That's what you need."],
    witty: ["Low battery wizard. Run on tea. Recharge in a hobbit-hole. Got it.", "Wizards need tea. That's the biggest secret I've learned."],
    proud: ["Then you're more like us than I thought.", "Low. I see. You manage well."],
    gloomy: ["You too. I'm glad I'm not the only one.", "Even you. Okay. That helps."],
  });
  byTemper('rift.askb.view', {
    cheerful: ["I think hobbits are the battery here! They charge everyone up!", "I think friends are batteries! I've got loads!"],
    ornery: ["I think nobody here needs batteries because nobody does anything fast.", "Hobbits don't need batteries. They've got pie."],
    shy: ["...I think the quiet charges me. Slowly.", "...I think I'm charging. A bit."],
    curious: ["I think energy here comes from rest. That's backwards from home. Fascinating.", "I think the valley's a sort of battery. Everything stores up."],
    dreamy: ["I think the sun's everyone's battery. It just charges slowly.", "Love, maybe. That's a battery."],
    proud: ["I think I'll be fully charged here soon.", "I've worked out how to run on less. I'm good at it now."],
    gloomy: ["I think I'm running on what's left. And it's enough, for now.", "I don't know. I just keep going."],
  });
  byTemper('rift.askr.q', {
    cheerful: ["Can you make a rift? Can you make a little one? Just for fun?", "Wizard! Are rifts magic? Are they YOUR magic?"],
    ornery: ["You've been looking at the sky like you know something. Do you?", "The rifts. You're a wizard. You must know. Spill it."],
    shy: ["...Could you open one? If someone wanted to go home?", "...Do you know what they are? Really?"],
    curious: ["What's your theory? I've got three. I want to compare.", "Have you studied them? What do you think they are?"],
    dreamy: ["Are the rifts magic? They feel like magic. Like a door in a story.", "Do you think they're dreams? Leaking through?"],
    proud: ["I've studied them more than anyone. What do you know that I don't?", "You know something about the rifts. I want to hear it."],
  });
  byTemper('rift.askr.r.tale', {
    cheerful: ["A tinker! In lightning! That's amazing! Tell me more!", "Ooh! A clue! I love clues!"],
    ornery: ["A tale. Always tales. ...Go on, then.", "A tinker. Hm. That's not nothing."],
    shy: ["...A tinker. Like Saint Mungo, in the stories. Oh.", "...That sounds like our story."],
    curious: ["Lightning! A tinker! That's a data point! When was it? Where exactly?", "A clue! What color was the lightning? Green? It was green, wasn't it?"],
    dreamy: ["A tinker in green lightning. Like a fairy tale. Like our fairy tales.", "That's a story I've heard. From the other side."],
    witty: ["You're telling me a tinker started all this. With a kettle. Classic.", "Still learning the ending. That's very wizard of you."],
    proud: ["I knew there was a story. I knew it.", "A tinker. Then it was one of yours who started it."],
    gloomy: ["And did he ever come back? ...No. I can tell by your face.", "A tale with no ending. Like mine."],
  });
  byTemper('rift.askr.r.jest', {
    cheerful: ["Ha! Pickles! I'll open them for you!", "Pickles! I love it! Most powerful wizard, defeated by a jar!"],
    ornery: ["Pickles. Course. Useless.", "Hm. Fine. Don't tell me."],
    shy: ["*giggles* Pickles.", "Ha. Okay."],
    curious: ["Pickles! What's the lid made of? Is it a vacuum seal? I could help!", "Is that a metaphor? Are the rifts the pickles?"],
    dreamy: ["Ha. Maybe the sky's just a jar nobody can open.", "Pickles and skies. Both stuck."],
    proud: ["I'll open your pickles. You open the sky. Deal.", "Pickles are easy. I'll show you."],
    gloomy: ["Ha. Even the wizard's stuck. Okay.", "Nobody can open the important jars."],
  });
  byTemper('rift.askr.r.share', {
    cheerful: ["That's okay! You're still the best wizard! You can do other things!", "Less than hoped is still something!"],
    ornery: ["Can't. Hm. At least you're honest.", "Fine. Can't. Good to know."],
    shy: ["...Oh. That's okay.", "...Thank you for telling me."],
    curious: ["What can wizards do, then? Exactly? I'd like a list.", "Less than people hope. Then what's the most you can do?"],
    dreamy: ["Less than hoped. But you're still here. That's something.", "Honest wizards. Rare and lovely."],
    witty: ["A wizard who admits limits. I want this framed.", "Less than hoped. Join the club."],
    proud: ["Then we'll find the way ourselves.", "I'll work it out, then. Someone will."],
    gloomy: ["I thought so. It's all right.", "No one can. I knew that."],
  });
  byTemper('rift.askr.view', {
    cheerful: ["I think they're doors! Happy doors! With someone waving on the other side!", "I think they're magic! Kind magic!"],
    ornery: ["I think someone's being careless with the sky.", "I think nobody knows and everyone pretends they do."],
    shy: ["...I think they're someone calling for help.", "...I think they're sad. Sad doors."],
    dreamy: ["I think they're the city's dreams. Spilling over.", "I think they're wishes, made of light."],
    witty: ["I think the sky's leaking and we're the drips.", "I think they're the universe's bad wiring."],
    proud: ["I think they're aimed. And I'll prove it.", "I've a theory. I'll be right."],
    gloomy: ["I think they're the last breaths of something.", "I think they're a goodbye."],
  });
  byTemper('rift.aska.q', {
    cheerful: ["How old ARE you? A hundred? A thousand? Tell me!", "Wizard! Birthday question! How many candles?"],
    ornery: ["You're old. How old? Don't dodge.", "Exactly how old are you? I've a bet with the miller."],
    shy: ["...Is it rude to ask how old you are?", "...You seem very old. Kindly old."],
    curious: ["How old are you? In years? Ours or yours? Is there a conversion?", "Age question. Honest answer. Please. For my records."],
    dreamy: ["Are you as old as the stars? You look like you might be.", "How many winters have you seen? Thousands?"],
    witty: ["Rumor says you predate the hills. True or false?", "How old are you? Ballpark. Era. Geological period."],
    proud: ["I've worked out everyone's age in the village except yours. Help me.", "What's your age? I'd like to know who I'm talking to."],
    gloomy: ["Do you remember being young?", "How long have you been wandering?"],
  });
  byTemper('rift.aska.r.tale', {
    cheerful: ["All oak! That sounds lovely! Was it lovely?", "The river moved! You saw it! That's amazing!"],
    ornery: ["Older than the river's path. Fine. You win the age contest.", "Hm. I'll tell the miller I lost the bet."],
    shy: ["...That's so old. ...And you're still kind.", "*stares in wonder*"],
    curious: ["The river moved! How fast? Over how many years? Tell me!", "All oak? What happened to the oaks? Who cut them?"],
    dreamy: ["All oak. Imagine the quiet. Even quieter than now.", "You've seen the valley before it was a valley. Like a dream."],
    witty: ["Older than the river. You've got seniority over the water.", "So you're the valley's granddad."],
    proud: ["Then you've seen everything. And you chose to come back.", "Impressive. Truly."],
    gloomy: ["All that time. And it all changes anyway.", "You've seen so much go. How do you bear it?"],
  });
  byTemper('rift.aska.r.jest', {
    cheerful: ["Thirty-nine! Ha! Happy birthday! Every year!", "Ha! Same as me! In spirit!"],
    ornery: ["Thirty-nine. Liar. ...Fine. Keep your secrets.", "Thirty-nine. I'll tell the miller. He'll laugh."],
    shy: ["*laughs* Thirty-nine. Okay.", "Ha. That's funny."],
    curious: ["Thirty-nine? Then your beard grows remarkably fast.", "Thirty-nine in what units?"],
    dreamy: ["Thirty-nine forever. Like a song that never ends.", "Ha. Time doesn't touch wizards, maybe."],
    proud: ["Thirty-nine. Then I'm older than you in experience.", "Ha. I'm not fooled."],
    gloomy: ["Ha. I wish I could stop at an age.", "Thirty-nine. If only."],
  });
  byTemper('rift.aska.r.share', {
    cheerful: ["Young enough to mind! I like that! You're young at heart!", "Then you're not too old! Good!"],
    ornery: ["Lost count. Lazy. ...I lost count of the days here, too.", "Hm. Fair."],
    shy: ["...That's a nice answer.", "...Me too, sort of."],
    curious: ["Lost count. How does one lose count? I'd love to know how wizards measure time.", "Interesting. Age as a feeling rather than a number."],
    dreamy: ["Old enough to have lost count. Young enough to mind. That's beautiful.", "I'll remember that one."],
    witty: ["Lost count. Convenient. I'll do the same.", "Young enough to mind. Old enough to not care. Perfect age."],
    proud: ["Then you've done well with the time.", "Wise answer. I respect it."],
    gloomy: ["Young enough to mind. I know that feeling.", "Lost count. ...Some days I wish I could."],
  });
  byTemper('rift.aska.view', {
    cheerful: ["I think you're as young as you feel! And you feel young!", "I think you're wonderful at any age!"],
    ornery: ["I think you're old and you know it.", "I think you're older than you'll admit and younger than you look."],
    shy: ["...I think you're kind. Age doesn't matter.", "...I think you're just right."],
    curious: ["I think age works differently for you. I'll figure out how.", "I think you're a mystery. I like mysteries."],
    dreamy: ["I think you're as old as stories.", "I think you're ageless, like a mountain."],
    witty: ["I think you're older than dirt. Respectfully.", "I think you're vintage."],
    proud: ["I think you've earned every year.", "I think you're old and wise. That's good."],
    gloomy: ["I think you've seen too much.", "I think you're tired, sometimes."],
  });
  byTemper('rift.asks.q', {
    cheerful: ["Can I hold your staff? Just for a second? Please?", "What does the staff do? Does it light up? Does it sing?"],
    ornery: ["Your stick. Is it actually doing anything or is it just for show?", "That staff. Weapon or walking aid?"],
    shy: ["...What's the staff for? If you don't mind me asking.", "...It's a beautiful staff."],
    curious: ["Your staff. What's it made of? How old? Does it conduct?", "I've been watching the staff. It sometimes glows. Why?"],
    dreamy: ["Your staff looks like it's grown, not made. Is it alive?", "Does the staff have a name?"],
    witty: ["The staff. Is it a magic wand that hit puberty?", "What's the staff's job? Besides making you look tall."],
    proud: ["I've inspected every tool in the village. Not yours. What is it?", "Tell me about the staff. I'd like to know."],
    gloomy: ["Does the staff ever get heavy?", "How long have you carried it?"],
  });
  byTemper('rift.asks.r.tale', {
    cheerful: ["A tree that remembers! That's amazing! Does it remember me?", "Wow! A memory staff!"],
    ornery: ["A tree that remembers. Romantic nonsense. ...Beautiful nonsense.", "Hm. So it's a very old stick."],
    shy: ["...It remembers for you. That's lovely.", "*touches it gently* Oh."],
    curious: ["A tree that remembers the first sunrise. How? Rings? Sap? I need to know.", "Wooden memory. Fascinating."],
    dreamy: ["A tree that remembers the first sunrise. I'd like to remember mine.", "It holds memories like light holds color."],
    witty: ["A tree with a better memory than me. Insulting.", "So the staff is a library. Wooden."],
    proud: ["A staff with history. Like a good tool should be.", "Respect. That's a fine staff."],
    gloomy: ["Remembers for you. ...Some things I'd rather not remember.", "Lucky. Some things should be remembered."],
  });
  byTemper('rift.asks.r.jest', {
    cheerful: ["Pointing dramatically! I love it! Do it now!", "Ha! Point at something! Go on!"],
    ornery: ["Leaning. Course. Thought so.", "A very expensive leaning pole."],
    shy: ["*giggles* Pointing.", "Ha. Okay."],
    curious: ["Leaning and pointing. Practical. Does it balance well?", "Pointing dramatically. Has it ever actually pointed at something important?"],
    dreamy: ["Pointing at the stars. Yes. That's its job.", "Ha. I'd point at the moon with it."],
    proud: ["A good leaning pole is an honest tool.", "Practical. I respect that."],
    gloomy: ["Ha. Leaning. We all need something to lean on.", "Pointing. And leaning. Useful."],
  });
  byTemper('rift.asks.r.share', {
    cheerful: ["Kept it all this time! That's so loyal!", "The staff and the hat! Best friends!"],
    ornery: ["Only kept two things. And one's a hat. Sentimental.", "Hm. I've kept less."],
    shy: ["...I kept one thing too.", "*shows a small trinket*"],
    curious: ["Why those two? What made them worth keeping?", "Two things in all those years. That's a strong selection."],
    dreamy: ["The things we keep are the things that keep us.", "That's beautiful. And sad."],
    witty: ["The staff and the hat. Your entire estate.", "Travel light, keep the hat."],
    proud: ["Keeping what matters. That's wisdom.", "A good choice."],
    gloomy: ["Only what you can carry. I know about that.", "Everything else got left. I know."],
  });
  byTemper('rift.asks.view', {
    cheerful: ["I think it's a magic staff and it loves you!", "I think it's the best staff ever!"],
    ornery: ["I think it's a stick. A very important stick.", "I think you lean on it more than you admit."],
    shy: ["...I think it's kind. Like you.", "...I think it's beautiful."],
    curious: ["I think it's more than wood. I'll figure it out.", "I think there's a mechanism. I'll find it."],
    dreamy: ["I think it's part of you now.", "I think it hums when you're happy."],
    witty: ["I think it's a hat stand with ambition.", "I think it does most of the work."],
    proud: ["I think it's a good tool for a good wizard.", "I think it's earned its place."],
    gloomy: ["I think it's been through a lot. Like you.", "I think it's tired. But steady."],
  });
  // the children, by age and mood
  const kidLines = (key, rules) => lines(key, rules);
  kidLines('rift.kids.start', [
    { if: { band: 'young' }, text: ['I\'m from the sky AND the hill! I\'m special! Mom says!', 'Two worlds! I don\'t know what that means but I like it!'] },
    { if: { band: 'school' }, text: ['At school they call me "sky-kid". I don\'t mind. Sky-kid\'s a good name.', 'Two worlds means two stories at bedtime. One about lights, one about dragons.'] },
    { if: { mood: ['low', 'miserable'] }, pri: 1, text: ['Sometimes I feel like I don\'t fit either. The hill kids and the sky kids.', 'It\'s hard sometimes. Everyone wants me to pick.'] },
  ]);
  kidLines('rift.kids.game', [
    { if: { band: 'young' }, text: ['Beep-boop tag! You say beep when you tag!', 'Hide-and-seek with lights! You have to find the glow!'] },
    { if: { band: 'school' }, text: ['Hackers and dragons. I\'m always the hacker. I hack the dragon\'s dinner.', 'We play Relay-runners. You carry a pebble message to the pond and back.'] },
    { if: { mood: 'merry' }, text: ['Everything! Today\'s a game day! Everything is a game!'] },
  ]);
  kidLines('rift.kids.eye', [
    { if: { band: 'young' }, text: ['They want to touch it! I let them! It goes beep!', 'Everybody looks! I wink with it! It glows when I wink!'] },
    { if: { band: 'school' }, text: ['Sometimes. A boy asked if I could see his thoughts. I said yes. He\'s been nice ever since.', 'They ask if it hurts. It doesn\'t. Mostly it itches.'] },
  ]);
  kidLines('rift.kids.dark', [
    { if: { band: 'young' }, text: ['A bit! The cookie tin glows green! I find it every time!', 'Yes! I\'m not scared of the dark! The dark\'s scared of ME!'] },
    { if: { band: 'school' }, text: ['A bit. Enough to find the privy at night. That\'s the most useful thing it does.', 'Sort of. Mostly I see the bats. They\'re friendly.'] },
  ]);
  kidLines('rift.kids.play', [
    { if: { band: 'young' }, text: ['YES! You can be the biggest dragon! Roar for me!', 'Wizard dragon! Wizard dragon! Tomorrow! Promise!'] },
    { if: { band: 'school' }, text: ['You can play. But you have to follow the rules. There are a lot of rules.', 'Okay! But wizards can\'t use magic. That\'s cheating.'] },
    { if: { band: 'youth' }, text: ['You? Play? ...Fine. You can be referee.', 'Ha. Sure. But don\'t tell my friends I said yes.'] },
  ]);
  kidLines('rift.kids.hillgame', [
    { if: { band: 'young' }, text: ['Puddle jumping! I\'m the best! I get the wettest!', 'Mud pies! The rift kids didn\'t know mud pies! I taught them!'] },
    { if: { band: 'school' }, text: ['Conkers. I\'ve got a forty-sixer. Nobody can beat it.', 'Climbing the party tree. Not allowed. Everyone does it.'] },
    { if: { band: 'youth' }, text: ['The old songs, at the Badger. Don\'t tell anyone I like them.', 'Fishing with Granddad. Quiet. I like quiet.'] },
  ]);
  kidLines('rift.kids.comfort', [
    { if: { band: 'young' }, text: ['Jealous! Hee! I\'m going to tell them!', 'They want one? I\'ll let them look! For one sweet!'] },
    { if: { band: 'school' }, text: ['Jealous? ...Huh. That makes sense, actually.', 'They wish they had one. I never thought of it like that.'] },
    { if: { band: 'youth' }, text: ['Jealous. Ha. Maybe. Thanks, wizard.', 'That\'s a nice thing to say. I\'ll pretend I believe it.'] },
  ]);
  kidLines('rift.kids.fine', [
    { if: { band: 'young' }, text: ['THE FINEST! I\'m telling Mom!', 'Hee! Finest eye! Finest!'] },
    { if: { band: 'school' }, text: ['Finest in the valley. I\'ll put that on a badge.', 'Ha! Thanks, wizard. It is pretty good.'] },
    { if: { band: 'youth' }, text: ['Finest eye. Okay. You\'re embarrassing. Thanks.', 'Ha. Don\'t say that in front of my friends.'] },
  ]);
});
