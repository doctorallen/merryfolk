'use strict';
// ---------------------------------------------------------------------------
// Family, home and love, the third part: the hobbit-hole itself. The round
// door and the best room, the larder and the jars put by, the mathom on the
// mantelpiece, the vegetable patch, a hole of one's own after moving in, the
// stranger with no roof at all, and the hearth family the wizard lodges
// with, who come to treat him as one of their own, and their lodger.
// The facts come from talk/family.js.
// ---------------------------------------------------------------------------

talkPack('family3', () => {
  const has = (x) => x != null && x !== false && x !== '' && !(Array.isArray(x) && !x.length);
  const FB = (...text) => ({ text });
  const G = (...text) => ({ g: true, text });
  const W = (cond, ...text) => ({ if: cond, text });
  const tm = (temper, ...text) => ({ if: { temper }, text });
  const L = (key, guard, rules) => lines(key, rules.map((r) => (r.if || r.g ? { if: { ...(guard || {}), ...(r.if || {}) }, pri: r.pri, text: r.text } : r)));
  const C = 'cheerful', O = 'ornery', S = 'shy', Q = 'curious', D = 'dreamy', Wt = 'witty', P = 'proud', Gl = 'gloomy';
  const visit = (who, kind) => (T, v) => { const o = Game.villagers.find((x) => x.first === T.F[who] && x !== v && !x.leaving); if (o && ACTIONS.whisper_visit) v.queue.unshift({ a: ACTIONS.whisper_visit, extra: { to: o, kind } }); };

  // =====================================================================================
  // The hobbit-hole
  // =====================================================================================
  const HM = { home: has, homeless: false };
  addThread({
    id: 'family.hole', label: 'Tell me about your hole', weight: 1, cool: 5,
    when: (F) => !!F.home && !F.homeless && F.stage !== 'child',
    open: { ask: 'family.hole.open' },
    beats: {
      start: { line: 'family.hole.start', go: [
        { ap: 'ask', say: 'And which is the best room?', to: 'room' },
        { ap: 'ask', say: 'Why that color for the door?', to: 'door', need: { if: { holeDoor: has } } },
        { ap: 'jest', say: 'And is it tidy? Truly tidy? Under the beds?', to: 'tidy' },
      ] },
      room: { line: 'family.hole.room', go: [
        { ap: 'ask', say: 'And the worst? Every hole has one.', to: 'worst' },
        { ap: 'ask', say: 'Who lived here before you?', to: 'before' },
      ] },
      door: { line: 'family.hole.door', go: [
        { ap: 'ask', say: 'And which is the best room, behind it?', to: 'room' },
        { ap: 'ask', say: 'Who lived here before you?', to: 'before' },
      ] },
      tidy: { line: 'family.hole.tidy', go: [
        { ap: 'jest', say: 'I\'ll take that as a no. Wizards know the signs.', to: 'signs' },
        { ap: 'ask', say: 'And which is the best room?', to: 'room' },
      ] },
      worst: { line: 'family.hole.worst', go: [
        { ap: 'advise', say: 'A bit of moss in the gap and a stone on the latch. Old trick.', to: 'fix' },
        { ap: 'comfort', say: 'A hole\'s like a hobbit. The odd draft gives it character.', to: 'character' },
      ] },
      before: { line: 'family.hole.before', fx: { learn: ['family.holehistory', '{Home} has a history, and {name} knows it'] }, go: [
        { ap: 'ask', say: 'Do you ever feel them about the place?', to: 'ghosts', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'Then it\'s in good hands now.', to: 'hands' },
      ] },
      signs: { line: 'family.hole.signs', fx: { joke: { k: 'family.beds', t: 'The wizard knows what\'s under {name}\'s bed.' } }, end: true },
      fix: { line: 'family.hole.fix', fx: { respect: 0.02 }, end: true },
      character: { line: 'family.hole.character', fx: { fond: 0.01 }, end: true },
      ghosts: { line: 'family.hole.ghosts', fx: { trust: 0.03 }, end: true },
      hands: { line: 'family.hole.hands', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.015 },
  });
  L('family.hole.open', HM, [FB('Tell me about your hole, {name}. I\'ve only ever seen the door.'), G('Tell me about {home}, {name}. What\'s it like inside?', 'How is {home} these days, {name}?'), W({ holeDoor: has }, 'I do like your {holeDoor} door, {name}. What\'s behind it?')]);
  L('family.hole.start', HM, [
    FB('Oh, it\'s just a hole. Round door, round windows, a kettle. Everything a hobbit needs.', 'It\'s home. Drafty in one corner. Perfect in the others.'),
    G('{Home}? Best hole on the hill. Not the biggest. The best.', '{Home} has seven pegs for hats and only five hats. I\'m working on it.'),
    W({ grandHole: true }, 'It\'s a big old hole. Too many rooms. I\'ve got lost in it. Twice. In the dark.'),
    W({ livesAlone: true }, 'Just me in {home}. Every room is my favorite room. I rotate.'),
    W({ fullHouse: true }, 'Full! Full to the round door! Somebody\'s always in the bath when you need it.'),
    W({ household: { min: 3 } }, 'There\'s {householdWord} of us. It\'s cozy. That\'s the polite word.'),
    tm(C, 'Oh, I love it! The kitchen smells of bread and the parlor smells of apples!'),
    tm(O, 'It\'s a hole. Damp in winter. Hot in summer. Somebody always leaves the door open.'),
    tm(S, '...It\'s small. But it\'s mine. I like the window by the stair.'),
    tm(Q, 'There\'s a passage at the back that goes nowhere. Just stops. Who dug it? Why?'),
    tm(D, 'In the morning the light comes through the round window and lands on the hearthrug. Like a coin.'),
    tm(Wt, 'It\'s got everything. A door, a roof, and a mouse who pays no rent.'),
    tm(P, 'Finest paneling on the hill. My granddad carved it. You must see it.'),
    tm(Gl, 'It\'s all right. The ceiling\'s low. The damp gets in. It\'s home, I suppose.'),
  ]);
  L('family.hole.room', HM, [
    FB('The kitchen. Always the kitchen. Where else would anyone be?', 'The parlor, by the fire, with my feet up. That\'s heaven.'),
    G('The little room with the round window. You can see the whole lane from the sill.'),
    W({ pastime: has }, 'The back room. That\'s where the {pastimeWord} happens. Nobody\'s allowed in. Except the cat.'),
    W({ larder: 'full' }, 'The pantry. Have you seen it? Shelves to the ceiling. I go in there just to look.'),
    W({ littleOne: has }, 'The nursery. {LittleOne} painted the walls. Mostly the bits {kThey} could reach.'),
    tm(C, 'All of them! But the kitchen most! It\'s always warm and there\'s always cake!'),
    tm(O, 'My study. With the door shut. With me in it. Alone.'),
    tm(S, '...The little nook under the stairs. I read in there. Nobody finds me.'),
    tm(Q, 'The cellar. It\'s cold and full of old things. I find something new every time.'),
    tm(D, 'The bedroom, at dawn, with the curtains open. The whole hill goes gold.'),
    tm(Wt, 'The larder. It\'s the only room that never argues back.'),
    tm(P, 'The best parlor. We only use it for important visitors. You may see it, one day.'),
    tm(Gl, 'The bedroom. Because I can shut the door on the world.'),
  ]);
  L('family.hole.door', { holeDoor: has, home: has }, [
    FB('Because it was that color when we came. Nobody\'s dared change it.', 'It\'s always been that color. Ask the door.'),
    G('{HoleDoor}? My gran painted it {holeDoor}. Said it kept the bad luck off. Hasn\'t failed yet.', 'We argued for a week about the color. {HoleDoor} won. Nobody\'s quite sure how.'),
    W({ holeDoor: 'green' }, 'Green is the proper color for a door. Ask anyone. Ask the Old Took.', 'Green, like the hill. So the hole looks like it grew there.'),
    W({ holeDoor: 'yellow' }, 'Yellow, so it\'s sunny even when it isn\'t. Especially when it isn\'t.', 'Yellow. You can find it in the dark after the Badger. That\'s the main thing.'),
    W({ holeDoor: 'red' }, 'Red, so the wind knows we mean business.', 'Red, like a robin. Friendly but firm.'),
    W({ holeDoor: 'blue' }, 'Blue, like the sky over Bree on a good day. I was there once.', 'Blue. To match the delphiniums. Then the delphiniums died. The door stayed.'),
    W({ holeDoor: 'purple' }, 'Purple! Nobody else has purple! That\'s why!', 'It was meant to be blue. The paint had other ideas.'),
    W({ holeDoor: 'sea-green' }, 'The color of the sea, they said. I\'ve never seen the sea. I trust them.'),
    W({ holeDoor: 'orange' }, 'Orange, like a pumpkin. We\'re very fond of pumpkins in this family.'),
    tm(O, 'Because I like it. That\'s why. Is there something wrong with it?'),
    tm(Q, 'I\'ve wondered too! I\'ve scraped a bit off. There are four colors underneath. Four!'),
    tm(Wt, 'It matches my mood. Most days.'),
    tm(P, 'It\'s the smartest door on the hill. Freshly painted every spring.'),
  ]);
  L('family.hole.tidy', HM, [
    FB('Tidy! Of course it\'s tidy! ...Mostly. Don\'t look under the beds.', 'Under the BEDS? That\'s private, that is.'),
    G('{Home} is tidy in all the places a visitor could see.'),
    W({ littleOne: has }, 'With {littleOne} about? There\'s jam on the ceiling. I don\'t know how.'),
    W({ livesAlone: true }, 'I live alone. Tidy is whatever I say it is.'),
    tm(C, 'Ha! No! It\'s a wonderful mess! A cozy mess!'),
    tm(O, 'Under the beds is where things go so you don\'t have to look at them.'),
    tm(S, '...Please don\'t look under the beds.'),
    tm(Q, 'I found a cheese under there last spring. I still don\'t know whose.'),
    tm(D, 'I tidy in my head. The hole hasn\'t caught up.'),
    tm(Wt, 'It\'s organized chaos. Without the organized.'),
    tm(P, 'Spotless. Spotless! ...Under the beds is a separate matter.'),
    tm(Gl, 'I gave up on tidy years ago. Tidy never lasts.'),
  ]);
  L('family.hole.worst', HM, [
    FB('The back passage. Draft like a dragon breathing. A cold dragon.', 'The step down to the cellar. Everybody misses it. Everybody.'),
    G('The pantry door. Sticks in wet weather. I\'ve been locked out of my own pie.'),
    W({ grandHole: true }, 'The east wing. Nobody goes there. It\'s too far from the kitchen.'),
    W({ fullHouse: true }, 'The bathroom. Not the room. The queue.'),
    tm(C, 'Worst? Oh, nothing! Well. The chimney smokes. But it smells lovely! Like bacon.'),
    tm(O, 'The bedroom ceiling drips. Right on my pillow. Only on mine.'),
    tm(S, '...The front parlor. It\'s for visitors. I don\'t like visitors.'),
    tm(Q, 'There\'s a cupboard that whistles. I\'ve never found out why. It whistles in tune.'),
    tm(D, 'The spare room. It\'s always cold. Like it\'s waiting for someone.'),
    tm(Wt, 'The cellar. Damp, dark, full of spiders. Like my last landlord.'),
    tm(P, 'There\'s nothing wrong with any of it. ...The gutters. Possibly.'),
    tm(Gl, 'All of it, in winter. The damp gets into everything. Even me.'),
  ]);
  L('family.hole.before', HM, [
    FB('My gran. Her gran. Her gran\'s gran. Back to when the hill was dug.', 'Nobody knows. There are initials carved in the larder door. Nobody\'s claimed them.'),
    G('{Home} was dug by the Old Took\'s cousin. Or so the story goes. Everyone\'s cousin is the Old Took\'s cousin.'),
    W({ movedIn: true }, 'I\'ve only just moved in! Somebody left a jar of pickles on the shelf. I think it\'s a welcome.'),
    W({ rift: true }, 'Before me? Hill-folk, back and back. I found a cradle in the cellar. I don\'t know whose. I kept it.'),
    tm(C, 'A family of seven! And a goat! The goat had its own room! I\'ve kept it as a pantry!'),
    tm(O, 'Some fool who put the bedroom next to the kitchen. I hear the kettle in my sleep.'),
    tm(S, '...An old lady. She left her pressed flowers in the books. I\'ve kept them all.'),
    tm(Q, 'I\'ve been trying to find out! There are letters in the attic. I\'m on the third box.'),
    tm(D, 'A poet, they say. Sometimes I find lines scratched on the window frames.'),
    tm(Wt, 'A previous owner with very strong views on wallpaper. All of them wrong.'),
    tm(P, 'My family. Always my family. Four generations under this hill.'),
    tm(Gl, 'Someone who went on an adventure and never came back. That\'s what I heard.'),
  ]);
  L('family.hole.signs', HM, [
    FB('What signs? There are no signs. ...What signs?', 'Wizards and their signs. Hmph.'),
    tm(C, 'Ha! You\'ve got me! There\'s a whole lost tea set under there!'),
    tm(O, 'Keep your signs to yourself.'),
    tm(S, '...How did you know?'),
    tm(Q, 'What signs? Tell me. I want to know what gives it away.'),
    tm(D, 'Dust tells its own story. I let it.'),
    tm(Wt, 'The sign is the smell. I know. I\'m working on it.'),
    tm(P, 'There are no signs because there\'s no mess. Next subject.'),
    tm(Gl, 'Everybody knows. Everybody always knows.'),
  ]);
  L('family.hole.fix', HM, [
    FB('Moss and a stone. ...Huh. That\'s so simple it might work.', 'An old trick. I\'ll try it tonight.'),
    tm(C, 'Brilliant! I\'ll do it right now! Where\'s the moss?'),
    tm(O, 'Moss. I\'ve tried moss. ...Not with a stone. Fine.'),
    tm(S, '...Thank you. I\'ll try.'),
    tm(Q, 'Why does the stone help? Weight? Does it keep the latch from rattling? I\'ll test it.'),
    tm(D, 'Moss and stone. The hill fixing itself. I like that.'),
    tm(Wt, 'A wizard\'s spell: moss, stone, and saying it confidently.'),
    tm(P, 'I was going to do exactly that.'),
    tm(Gl, 'It\'ll come back. The draft always comes back.'),
  ]);
  L('family.hole.character', HM, [
    FB('Character. Yes. That\'s what I\'ll call it.', 'Ha! Then {home}\'s got a great deal of character.'),
    tm(C, 'Ha! That\'s exactly it! It\'s a characterful hole!'),
    tm(O, 'Character, my foot. It\'s a draft.'),
    tm(S, '...That\'s nice. I\'ll think of it like that.'),
    tm(Q, 'Like a hobbit? Do holes have tempers too? I\'ve suspected.'),
    tm(D, 'The house breathes. I\'ve always thought so.'),
    tm(Wt, 'Then my hole has a great deal of character and very little insulation.'),
    tm(P, 'It\'s a very distinguished draft.'),
    tm(Gl, 'Character. A nice word for cold feet.'),
  ]);
  L('family.hole.ghosts', HM, [
    FB('...Sometimes. A smell of pipe-weed in an empty room. I say good evening.', 'Not ghosts. Just... company. The good kind.'),
    tm(C, 'Oh, yes! A friendly one! It moves the spoons! I say thank you!'),
    tm(O, 'Ghosts? Don\'t be daft. ...The stair creaks at night. On its own. I don\'t like it.'),
    tm(S, '...Sometimes I think someone\'s just left the room. It isn\'t frightening. Just warm.'),
    tm(Q, 'I\'ve sat up all night to check. Twice. Nothing. But the kettle was warm in the morning.'),
    tm(D, 'In the evenings I feel them. All the suppers eaten here. All the songs.'),
    tm(Wt, 'Only one ghost. It\'s my own reflection before breakfast.'),
    tm(P, 'My ancestors, I expect. Keeping an eye on standards.'),
    tm(Gl, 'Yes. And one day I\'ll be one of them, listening.'),
  ]);
  L('family.hole.hands', HM, [
    FB('I hope so. I try to keep it the way they would.', 'Good hands. Yes. A bit floury.'),
    tm(C, 'The best hands! The happiest! I\'ll look after it forever!'),
    tm(O, 'Hmph. Somebody\'s got to fix the gutters.'),
    tm(S, '...Thank you. I hope I\'m doing it right.'),
    tm(Q, 'I wonder who\'ll have it after me. I hope they find the letters.'),
    tm(D, 'And one day I\'ll hand it on. Like a song.'),
    tm(Wt, 'Good hands, bad knees. It\'s a living.'),
    tm(P, 'The best hands it\'s ever been in, I\'d say.'),
    tm(Gl, 'For now. Nothing\'s forever.'),
  ]);

  // =====================================================================================
  // The larder
  // =====================================================================================
  addThread({
    id: 'family.larder', label: 'How\'s the larder?', weight: 0.9, cool: 4,
    when: (F) => !!F.home && !F.homeless && F.stage !== 'child',
    rel: (F) => (F.larder === 'bare' ? 1.8 : F.season === 'autumn' || F.season === 'winter' ? 1.3 : 0.8),
    open: { ask: 'family.lar.open' },
    beats: {
      start: { line: 'family.lar.start', go: [
        { ap: 'ask', say: 'And what\'s the pride of the shelf?', to: 'pride', need: { if: { larder: ['full', 'fair'] } } },
        { ap: 'jest', say: 'May I inspect it? For science.', to: 'inspect' },
        { ap: 'comfort', say: 'Winter\'s long. Shall I see what the Store can spare?', to: 'bare', need: { if: { larder: 'bare' } } },
        { ap: 'ask', say: 'Have you put anything by for winter?', to: 'jars' },
      ] },
      pride: { line: 'family.lar.pride', go: [
        { ap: 'ask', say: 'And the recipe? Or is it a family secret?', to: 'recipe' },
        { ap: 'jest', say: 'I\'ll need a sample. Purely to confirm.', to: 'sample' },
      ] },
      inspect: { line: 'family.lar.inspect', go: [
        { ap: 'ask', say: 'Seriously, what\'s the pride of the shelf?', to: 'pride', need: { if: { larder: ['full', 'fair'] } } },
        { ap: 'ask', say: 'Have you put anything by for winter?', to: 'jars' },
      ] },
      jars: { line: 'family.lar.jars', go: [
        { ap: 'advise', say: 'A jar a week in autumn and you\'ll laugh at the snow.', to: 'advice' },
        { ap: 'jest', say: 'I\'ll need a sample. Purely to confirm.', to: 'sample' },
      ] },
      bare: { line: 'family.lar.bare', fx: { confide: { k: 'family.bare', t: '{Name}\'s larder is bare, and {they}\'s worried' } }, go: [
        { ap: 'warm', say: 'I\'ll speak to the Store. Nobody in Thistledown goes hungry.', to: 'promise' },
        { ap: 'advise', say: 'Ask your neighbors. Pride\'s a poor supper.', to: 'neighbours' },
      ] },
      recipe: { line: 'family.lar.recipe', fx: { confide: { k: 'family.recipe', t: '{Name}\'s family recipe' } }, end: true },
      sample: { line: 'family.lar.sample', fx: { joke: { k: 'family.sample', t: 'The wizard asked for a sample. Purely to confirm.' }, fond: 0.02 }, end: true },
      advice: { line: 'family.lar.advice', fx: { respect: 0.02 }, end: true },
      promise: { line: 'family.lar.promise', fx: { promise: { k: 'family.larder', t: 'You said you\'d see that {name}\'s larder was filled', days: 3 }, trust: 0.04 }, end: true },
      neighbours: { line: 'family.lar.neighbours', fx: { respect: 0.01 }, end: true },
    },
    end: { fond: 0.015 },
  });
  L('family.lar.open', HM, [FB('How\'s the larder, {name}? Well stocked?', 'And the pantry, {name}? Ready for the cold?'), W({ season: 'winter' }, 'Larder holding up through the cold, {name}?')]);
  L('family.lar.start', HM, [
    FB('Oh, getting by. Bread, cheese, something pickled. The essentials.', 'Could be fuller. Could be emptier. Could always be fuller.'),
    W({ larder: 'full' }, 'Full! Shelves to the ceiling! I can hardly shut the door!', 'Bursting. I had to move the jam into the bedroom.'),
    W({ larder: 'fair' }, 'Fair enough. Enough for a week. Two, if nobody\'s hungry. Somebody\'s always hungry.'),
    W({ larder: 'bare' }, '...Bare, if I\'m honest. A heel of bread and some optimism.', 'Don\'t ask. There\'s a mouse in there looking for something too.'),
    W({ jars: { min: 6 } }, 'There are {famJarsWord} jars on the top shelf. I count them at night. It helps me sleep.'),
    W({ larder: 'full', temper: C }, 'Full to bursting! Come for supper! Come for three suppers!'),
    W({ larder: 'bare', temper: O }, 'Empty. And I know who\'s been at it. It\'s the one who lives here. It\'s me.'),
    W({ larder: 'bare', temper: S }, '...There\'s not much. It\'s all right. I don\'t eat much. ...I eat quite a lot, really.'),
    W({ larder: 'bare', temper: Gl }, 'Bare. It\'s always bare by now. I don\'t know why I bother looking.'),
    W({ larder: 'full', temper: P }, 'The best-stocked larder on the hill. I could feed the Steward for a month.'),
    tm(Q, 'Interesting question. I keep a list on the door. Want to see? It\'s color-coded.'),
    tm(D, 'I love a full larder. It feels like a promise. That the winter will end.'),
    tm(Wt, 'The larder\'s fine. It\'s my willpower that\'s empty.'),
  ]);
  L('family.lar.pride', HM, [
    FB('The blackberry jam. It\'s nearly black and nearly perfect.', 'A cheese the size of a cartwheel. I talk to it.'),
    G('My pickled onions. Hot enough to curl your beard. Even yours.'),
    W({ crop: 'pumpkin' }, 'Pumpkin. Pumpkin soup, pumpkin pie, pumpkin bread. I may have planted too many.'),
    W({ crop: 'potato' }, 'Potatoes. Boil \'em, mash \'em, stick \'em in a stew. From our own patch.'),
    W({ crop: 'tomato' }, 'Green tomato chutney. From the ones that didn\'t ripen. Waste not.'),
    W({ crop: 'carrot' }, 'Carrots in honey. Our own carrots. Our own honey, if you count the bees we borrowed.'),
    W({ crop: 'cabbage' }, 'Sauerkraut. Our own cabbages. The smell is legendary. Ask the neighbors.'),
    tm(C, 'The seed-cake! I make one every Highday! Have some! Have two!'),
    tm(O, 'My own ale. Don\'t tell the brewer. He thinks I buy his.'),
    tm(S, '...My mushroom pie. Nobody\'s tried it. Would you? Later?'),
    tm(Q, 'A jar of honey from the wild bees. I followed them for two days to find it.'),
    tm(D, 'Bramble jelly. You can taste the whole of September in it.'),
    tm(Wt, 'The emergency cookies. Hidden behind the flour. Don\'t tell anyone. Including me.'),
    tm(P, 'My plum preserve. Won at the fair three years running.'),
    tm(Gl, 'Turnips. There\'s always turnips. Nobody wants the turnips.'),
  ]);
  L('family.lar.inspect', HM, [
    FB('For SCIENCE? Ha! I know your science. It\'s called pudding.', 'You may look. You may not touch.'),
    W({ larder: 'bare' }, 'Inspect away. You\'ll find a mouse and a cobweb. The mouse is mine.'),
    tm(C, 'Of course! Come in! Bring a spoon!'),
    tm(O, 'Over my dead body. Last time a visitor inspected, half a pie went missing.'),
    tm(S, '...It\'s not very tidy in there. ...You can look.'),
    tm(Q, 'For science! Yes! I\'ve been meaning to catalog it.'),
    tm(D, 'The larder\'s a sort of museum. Of summers.'),
    tm(Wt, 'Science. Yes. I\'ve heard of wizards doing science. Mostly on pies.'),
    tm(P, 'You may admire it. From the door.'),
    tm(Gl, 'Go on. You\'ll only be disappointed.'),
  ]);
  L('family.lar.jars', HM, [
    FB('A few. Never enough. Never, ever enough.', 'Some. I start in autumn and eat them in autumn. It\'s a problem.'),
    W({ jars: { min: 10 } }, '{FamJarsWord} jars, top shelf. Jam, pickles, a side of smoked fish. Let the snow come.'),
    W({ jars: { max: 0 } }, 'Not one. I meant to. Every year I mean to.'),
    W({ season: 'autumn' }, 'I\'m at it now! The whole hole smells of vinegar and apples.'),
    W({ season: 'winter' }, 'We\'re eating them now. One jar a day. I\'ve got it worked out to the last week.'),
    tm(C, 'Loads! I love putting by! It\'s like wrapping presents for yourself!'),
    tm(O, 'Of course I have. I\'m not a fool. Unlike some I could mention.'),
    tm(S, '...A few. I hide them. In case.'),
    tm(Q, 'I\'ve been testing which keeps best. The pickled eggs are winning. Nobody knows why.'),
    tm(D, 'A row of jars in the lamplight. Like stained glass.'),
    tm(Wt, 'I put things by, then I put them away. Into me.'),
    tm(P, 'More than anyone on the hill. I\'ve counted theirs.'),
    tm(Gl, 'It won\'t be enough. It never is.'),
  ]);
  L('family.lar.bare', { home: has, larder: 'bare' }, [
    FB('...Would you? I didn\'t want to ask. Nobody wants to ask.', 'The Store? I hate asking. Everyone sees you go in.'),
    G('It\'s been a hard few weeks. I didn\'t want anyone to know. Especially not the Proudfoots.'),
    W({ littleOne: has }, 'It\'s {littleOne} I worry about. I can go without. {LittleOne} can\'t.'),
    W({ household: { min: 3 } }, 'There\'s {householdWord} of us. It goes so fast. I don\'t know where.'),
    tm(C, 'Oh, we\'ll be fine! We always are! ...It would be nice, though. A little help.'),
    tm(O, 'I can manage. I\'ve always managed. ...It\'s not been easy.'),
    tm(S, '...Please don\'t tell anyone.'),
    tm(Q, 'I can\'t work out where it all went. I\'ve gone over it and over it.'),
    tm(D, 'I keep thinking something will turn up. It usually does. Not lately.'),
    tm(Wt, 'I\'ve been dining on air and good humor. The humor\'s running out.'),
    tm(P, 'I don\'t need charity. ...But if it\'s offered as a neighbor, I\'d not refuse.'),
    tm(Gl, 'It\'s going to be a long winter. I can feel it.'),
  ]);
  L('family.lar.recipe', HM, [
    FB('Secret. ...Oh, all right. The trick is a pinch of nutmeg and a great deal of patience.', 'My gran\'s. She never wrote it down. I watched her hands.'),
    tm(C, 'It\'s no secret! Sugar, love and a song while you stir! The song\'s important!'),
    tm(O, 'A family secret. I\'ll take it to my grave. ...It\'s the brown sugar.'),
    tm(S, '...I\'ll tell you. Only you. It\'s a spoon of honey at the end.'),
    tm(Q, 'I\'ve been refining it for years. Thirty-one versions. This one\'s the best so far.'),
    tm(D, 'You pick the fruit at dawn, when it\'s still cold. Don\'t ask why. It just is.'),
    tm(Wt, 'The secret ingredient is not telling anyone the secret ingredient.'),
    tm(P, 'Passed down six generations. I\'ve improved it.'),
    tm(Gl, 'My mother\'s. It\'s never tasted quite like hers.'),
  ]);
  L('family.lar.sample', HM, [
    FB('Ha! Here. One spoon. ONE.', 'Purely to confirm. Ha. Here, then.'),
    tm(C, 'Of course! Have a jar! Have two! Take one for the road!'),
    tm(O, 'One. Spoon. I\'m watching.'),
    tm(S, '...Here. Tell me if it\'s nice. Truly.'),
    tm(Q, 'Yes! Tell me what you taste. All of it. Be precise.'),
    tm(D, 'Here. Close your eyes when you taste it. It\'s better that way.'),
    tm(Wt, 'Confirmation requires a second sample, of course. For rigor.'),
    tm(P, 'A sample of the finest preserve in the valley. You\'re welcome.'),
    tm(Gl, 'You won\'t like it. Nobody does. ...Do you like it?'),
  ]);
  L('family.lar.advice', HM, [
    FB('A jar a week. Yes. That\'s not so hard.', 'Laugh at the snow. I\'d like to laugh at the snow.'),
    tm(C, 'A jar a week! I\'ll do two! I\'ll laugh at the snow AND the hail!'),
    tm(O, 'I know how to put by, thank you. ...A jar a week is sensible.'),
    tm(S, '...I\'ll try. Thank you.'),
    tm(Q, 'A jar a week. Do the sums work out? Let me think. They do. Clever.'),
    tm(D, 'And in the snow, I\'ll open one and taste the summer. Yes.'),
    tm(Wt, 'A jar a week, eaten a jar a week. Net jars: none. I see a flaw.'),
    tm(P, 'I already do three a week. But it\'s good advice for others.'),
    tm(Gl, 'And if the harvest fails? ...Still. A jar a week.'),
  ]);
  L('family.lar.promise', HM, [
    FB('...Thank you. I won\'t forget it.', 'Nobody goes hungry. I\'ll hold you to that.'),
    tm(C, 'Oh, thank you! I\'ll bake you something when it\'s full! Something huge!'),
    tm(O, 'Hmph. Well. ...Thank you.'),
    tm(S, '...Thank you. Really. Thank you.'),
    tm(Q, 'How will you do it? Who will you talk to? Can I come?'),
    tm(D, 'Like a kindly wind blowing through. Thank you.'),
    tm(Wt, 'A wizard on the case of my larder. The mice should be worried.'),
    tm(P, 'I\'ll repay it. Every crumb. I insist.'),
    tm(Gl, '...Thank you. I didn\'t think anyone would notice.'),
  ]);
  L('family.lar.neighbours', HM, [
    FB('Pride\'s a poor supper. Ha. My gran used to say that.', 'You\'re right. I\'ll ask next door. They owe me a ladder.'),
    tm(C, 'Of course! They\'d help! I\'d help them!'),
    tm(O, 'Ask the neighbors? ...Fine. The ones on the left. Not the right.'),
    tm(S, '...That\'s hard. I\'ll try.'),
    tm(Q, 'Pride as a supper. How much would it weigh? Not much. You\'re right.'),
    tm(D, 'Neighbors are like the hill. You don\'t notice it holding you up.'),
    tm(Wt, 'Pride\'s a poor supper but an excellent pudding.'),
    tm(P, 'I\'d rather starve. ...I\'d rather not starve. I\'ll ask.'),
    tm(Gl, 'They\'ve little enough themselves.'),
  ]);

  // =====================================================================================
  // The mathom on the mantelpiece
  // =====================================================================================
  const MT = { mathom: has };
  addThread({
    id: 'family.mathom', label: 'What\'s that on your mantelpiece?', weight: 0.8, cool: 6,
    when: (F) => !!F.mathom && F.stage !== 'child',
    open: { ask: 'family.math.open' },
    beats: {
      start: { line: 'family.math.start', go: [
        { ap: 'ask', say: 'Where did it come from?', to: 'origin' },
        { ap: 'jest', say: 'Is it... meant to look like that?', to: 'look' },
        { ap: 'ask', say: 'Would you ever give it away?', to: 'give' },
      ] },
      origin: { line: 'family.math.origin', go: [
        { ap: 'ask', say: 'And would you ever give it away?', to: 'give' },
        { ap: 'warm', say: 'Then it\'s more than a mathom. It\'s a story.', to: 'story' },
      ] },
      look: { line: 'family.math.look', go: [
        { ap: 'ask', say: 'Where did it come from?', to: 'origin' },
        { ap: 'jest', say: 'I\'ll take it off your hands. For your next birthday.', to: 'bday' },
      ] },
      give: { line: 'family.math.give', go: [
        { ap: 'jest', say: 'I\'ll take it off your hands. For your next birthday.', to: 'bday' },
        { ap: 'warm', say: 'Then keep it. Some things should stay put.', to: 'story' },
      ] },
      story: { line: 'family.math.story', fx: { fond: 0.02 }, end: true },
      bday: { line: 'family.math.bday', fx: { joke: { k: 'family.mathom', t: 'The wizard wants the {mathom} for his birthday.' } }, end: true },
    },
    end: { fond: 0.015 },
  });
  L('family.math.open', MT, [FB('What\'s that on your mantelpiece, {name}?'), G('I couldn\'t help noticing the {mathom}, {name}.', 'Tell me about the {mathom}, {name}. I\'ve wondered.')]);
  L('family.math.start', MT, [
    FB('That? Oh, that\'s a mathom. Every hole has some.', 'Ah. Yes. That. We don\'t talk about that.'),
    G('The {mathom}? It\'s a mathom. Nobody uses it. Nobody throws it away. That\'s the rule.', 'That\'s the {mathom}. It\'s been there longer than the mantelpiece, I think.'),
    W({ mathomPassed: { min: 2 } }, 'The {mathom}. It\'s been given on {passedWord} times. It keeps coming back. Like a cat.'),
    W({ mathomTrip: true }, 'The {mathom}! Came back from an adventure. Nobody knows what it\'s for. It\'s foreign.'),
    tm(C, 'Isn\'t it marvelous? The {mathom}! I dust it every day! I love it! I don\'t know why!'),
    tm(O, 'That {mathom}. It was a present. I can\'t get rid of it. I\'ve tried.'),
    tm(S, '...It\'s silly. I like it, though. The {mathom}.'),
    tm(Q, 'The {mathom}! I\'ve been trying to work out what it\'s for. Seven years now.'),
    tm(D, 'It catches the evening light. Just for a minute. Then it\'s ordinary again.'),
    tm(Wt, 'The {mathom}. My most treasured possession that I\'d give away tomorrow.'),
    tm(P, 'A family piece. Very old. Probably valuable. Possibly.'),
    tm(Gl, 'It\'s ugly. I know. Everything I own is ugly.'),
  ]);
  L('family.math.origin', MT, [
    FB('A birthday. Somebody\'s birthday. I don\'t remember whose. Maybe mine. Maybe the cat\'s.', 'It came with the hole. Like the draft.'),
    G('Great-aunt Lobelia gave it to my gran, who gave it to my mom, who couldn\'t give it to anyone. So here it is.'),
    W({ mathomPassed: { min: 2 } }, 'It\'s been round the village {passedWord} times. Somebody gave it me at their birthday. I gave it on. It came back.'),
    W({ mathomTrip: true }, 'From over the hills. From an adventure. It has foreign dirt on it. I won\'t clean it.'),
    tm(C, 'A present! From someone I love! I can\'t remember who! But I love them!'),
    tm(O, 'The Proudfoots. It\'s always the Proudfoots. They give their mathoms on at every birthday.'),
    tm(S, '...My first birthday party. Somebody gave it me. I was too shy to say I didn\'t like it.'),
    tm(Q, 'There\'s a mark on the bottom. A maker\'s mark. I\'ve been trying to trace it.'),
    tm(D, 'It was on the step one morning. No note. I like to think it found me.'),
    tm(Wt, 'It was a wedding present. The marriage didn\'t last. The {mathom} did.'),
    tm(P, 'It\'s an heirloom. Four generations. Well. Three. Two at least.'),
    tm(Gl, 'Someone who\'s gone now. That\'s why I keep it.'),
  ]);
  L('family.math.look', MT, [
    FB('Nobody knows what it\'s meant to look like. That\'s mathoms for you.', 'Yes. No. Possibly.'),
    tm(C, 'Ha! I think it\'s meant to be a duck! Or a teapot! It\'s both!'),
    tm(O, 'Don\'t be rude about my mathom. Only I\'m allowed to be rude about it.'),
    tm(S, '...I think so. Doesn\'t it? I hope it does.'),
    tm(Q, 'That\'s the question, isn\'t it! I\'ve got theories. Seven.'),
    tm(D, 'It looks different every day. Depends on the weather.'),
    tm(Wt, 'It looks exactly like itself. That\'s more than most of us manage.'),
    tm(P, 'It\'s in a very old style. You wouldn\'t understand.'),
    tm(Gl, 'It\'s ugly. Say it. Everyone does.'),
  ]);
  L('family.math.give', MT, [
    FB('Give it away? At my next birthday, probably. That\'s what they\'re for.', 'Oh, it\'ll go round again. They always do.'),
    G('I\'ve tried giving the {mathom} away four times. It\'s still here. I think it likes me.'),
    tm(C, 'To someone who\'d love it! Do you know anyone? Anyone at all?'),
    tm(O, 'Gladly. Do you want it? Take it. Take it now.'),
    tm(S, '...No. I\'d miss it. Silly, isn\'t it.'),
    tm(Q, 'I\'d like to see how far it would travel. Round the village and back? I could tag it.'),
    tm(D, 'Not yet. One day, to someone who needs a bit of strangeness on their shelf.'),
    tm(Wt, 'To my worst enemy, at their birthday, with a very nice bow.'),
    tm(P, 'Certainly not. It\'s part of the family.'),
    tm(Gl, 'Nobody would want it.'),
  ]);
  L('family.math.story', MT, [
    FB('A story. Yes. Every mathom\'s a story nobody asked to hear.', 'You\'re right. I\'ll keep it a while longer.'),
    tm(C, 'Yes! A story! I\'ll tell it at every party!'),
    tm(O, 'A story. Hmph. A dust-collecting story.'),
    tm(S, '...I like that. A story on the shelf.'),
    tm(Q, 'If it\'s a story, I want to know the whole of it. I\'ll keep digging.'),
    tm(D, 'A story told in dust and chips. Yes.'),
    tm(Wt, 'A story with a very poor ending. It ends on my mantelpiece.'),
    tm(P, 'Exactly. That\'s what I\'ve always said.'),
    tm(Gl, 'Some stories should be left on the shelf.'),
  ]);
  L('family.math.bday', MT, [
    FB('Ha! You\'d regret it.', 'For your birthday? Do wizards have birthdays? I\'d wrap it nicely.'),
    tm(C, 'Yes! Do you have a birthday? I\'ll put a ribbon on it!'),
    tm(O, 'Take it now. I won\'t wait for your birthday.'),
    tm(S, '...Would you really want it?'),
    tm(Q, 'When IS your birthday? Nobody knows. That\'s very suspicious.'),
    tm(D, 'A wizard\'s mathom. It might go on an adventure at last.'),
    tm(Wt, 'Your birthday? You\'d give it straight back. That\'s the custom.'),
    tm(P, 'It would be a very fine present. You\'d be lucky.'),
    tm(Gl, 'You\'d only give it back.'),
  ]);

  // =====================================================================================
  // A hole of one's own: moving in, living alone
  // =====================================================================================
  addThread({
    id: 'family.movedin', label: (F) => (F.movedIn ? `Settling into ${F.home || 'the new hole'}?` : 'How do you find living on your own?'), weight: 1.1, cool: 5,
    when: (F) => !!F.home && !F.homeless && F.stage !== 'child' && (F.movedIn || F.livesAlone),
    rel: (F) => (F.movedIn ? 1.8 : 0.9),
    open: { warm: 'family.mov.open' },
    beats: {
      start: { line: 'family.mov.start', go: [
        { ap: 'ask', say: 'And the first night? How was it?', to: 'first' },
        { ap: 'jest', say: 'Talking to the furniture yet?', to: 'furniture' },
        { ap: 'warm', say: 'A hole of your own. That\'s a fine thing.', to: 'fine' },
      ] },
      first: { line: 'family.mov.first', go: [
        { ap: 'comfort', say: 'Every hole\'s strange at first. Then one night it isn\'t.', to: 'strange' },
        { ap: 'ask', say: 'Do you miss the old place?', to: 'miss' },
      ] },
      furniture: { line: 'family.mov.furniture', go: [
        { ap: 'ask', say: 'Do you miss the old place? Or the old company?', to: 'miss' },
        { ap: 'advise', say: 'Have folk round. A hole needs a party to wake it up.', to: 'party' },
      ] },
      fine: { line: 'family.mov.fine', go: [
        { ap: 'ask', say: 'And what will you do with it? Make it yours?', to: 'mine' },
        { ap: 'advise', say: 'Have folk round. A hole needs a party to wake it up.', to: 'party' },
      ] },
      miss: { line: 'family.mov.miss', go: [
        { ap: 'advise', say: 'Then go back for supper. Leaving doesn\'t mean gone.', to: 'supper' },
        { ap: 'warm', say: 'You\'ll make new noise here. Give it time.', to: 'strange' },
      ] },
      mine: { line: 'family.mov.mine', fx: { learn: ['family.myhole', '{Name} has plans for {home}'] }, end: true },
      strange: { line: 'family.mov.strange', fx: { trust: 0.02, drive: { lonely: -0.08 } }, end: true },
      party: { line: 'family.mov.party', fx: { respect: 0.02 }, end: true },
      supper: { line: 'family.mov.supper', fx: { respect: 0.01, run: (T, v) => { if (T.F.parent && T.F.parentAway) visit('parent', 'kin')(T, v); } }, end: true },
    },
    end: { fond: 0.02 },
  });
  const MV = { home: has };
  L('family.mov.open', MV, [FB('How are you finding a hole of your own, {name}?'), W({ movedIn: true }, 'Settling into {home}, {name}?', 'New door, new key, new creaks. How\'s {home}, {name}?'), W({ livesAlone: true }, 'How do you find living on your own, {name}?')]);
  L('family.mov.start', MV, [
    FB('Strange. Lovely. Strange.', 'Quiet. I didn\'t know quiet could be so loud.'),
    W({ movedIn: true }, 'I keep walking into the wrong rooms. Where\'s the pantry? It\'s here. Every time, it\'s here.', 'Everything\'s still in boxes. I\'ve been eating off the lid of one.'),
    W({ livesAlone: true }, 'I can sing in the bath. Nobody bangs on the wall. I miss someone banging on the wall.'),
    W({ nest: false, parent: has }, 'My {parentWord} came round with three jars of jam and a list. The list was longer than the jam.'),
    W({ spouse: has }, '{Spouse} and I have it all to ourselves. We walk round touching the walls. Like fools.'),
    tm(C, 'Oh, it\'s wonderful! I\'ve hung bunting in every room! Even the cellar!'),
    tm(O, 'Peace at last. Nobody touching my things. Nobody breathing near my pipe.'),
    tm(S, '...It\'s nice. I talk to myself more. Is that bad?'),
    tm(Q, 'Fascinating! Every hole sounds different. This one ticks. I haven\'t found what yet.'),
    tm(D, 'I lie in bed and listen to the hill settle. Like it\'s getting used to me.'),
    tm(Wt, 'I\'m my own landlord now. Very strict. Terrible about repairs.'),
    tm(P, 'It\'s very fine. Best-kept hole on the lane already.'),
    tm(Gl, 'Lonely, if I\'m honest. The evenings are long.'),
  ]);
  L('family.mov.first', MV, [
    FB('I didn\'t sleep a wink. Every creak was a burglar. Every burglar was the wind.', 'I slept on the floor. I couldn\'t find the bed. It was there all along.'),
    W({ movedIn: true }, 'I locked myself out at midnight. Slept on my own step. Very welcoming step.'),
    tm(C, 'I had a party! Just me! I danced round the kitchen till two!'),
    tm(O, 'Fine. Quiet. Very quiet. Too quiet. I slept with the lamp on.'),
    tm(S, '...I cried a bit. Not sad. Just... new.'),
    tm(Q, 'I counted every sound. Forty-one different ones. I\'m naming them.'),
    tm(D, 'I sat by the round window till dawn. Just looking. My own window.'),
    tm(Wt, 'I set a place at supper for the ghost. In case. It didn\'t come. Rude.'),
    tm(P, 'I slept perfectly. I always sleep perfectly.'),
    tm(Gl, 'Long. The first night\'s always the longest.'),
  ]);
  L('family.mov.furniture', MV, [
    FB('...Only the armchair. It\'s a very good listener.', 'Ha! Yes. The kettle and I have long talks.'),
    tm(C, 'Oh, yes! I named them! The dresser\'s called Bertha!'),
    tm(O, 'The furniture doesn\'t answer back. Which is more than I can say for my last household.'),
    tm(S, '...Yes. Don\'t tell anyone.'),
    tm(Q, 'Talking to it? I\'ve been taking it apart to see how it\'s made. The chairs are interesting.'),
    tm(D, 'The clock talks to me. Tick, tock. I answer in my head.'),
    tm(Wt, 'Only the chairs. The table and I aren\'t speaking.'),
    tm(P, 'I converse with my own reflection. It\'s excellent company.'),
    tm(Gl, 'Who else would I talk to?'),
  ]);
  L('family.mov.fine', MV, [
    FB('It is, isn\'t it? A round door with my name on it.', 'A fine thing. Yes. I keep touching the door.'),
    tm(C, 'The finest! I\'ll have you round! I\'ll have everyone round!'),
    tm(O, 'Fine enough. Needs a new hinge.'),
    tm(S, '...It is. Thank you.'),
    tm(Q, 'I wonder how many have lived here before. I\'m going to find out.'),
    tm(D, 'My own lamp in my own window. Like a little star on the hill.'),
    tm(Wt, 'A fine thing with a fine draft. It\'s a package.'),
    tm(P, 'I worked hard for it. It\'s only right.'),
    tm(Gl, 'Fine. Big. Empty.'),
  ]);
  L('family.mov.miss', MV, [
    FB('The noise. I miss the noise. Isn\'t that daft?', 'The smell of somebody else\'s cooking. You can\'t smell your own.'),
    W({ parent: has }, 'I miss my {parentWord} banging about in the kitchen at dawn. I never thought I would.'),
    W({ sibling: has }, 'I miss {sibling} hogging the blanket. I\'ve got my own blanket now. It\'s cold.'),
    tm(C, 'A bit! But I visit! Every day! Twice!'),
    tm(O, 'Miss it? No. ...The stew. I miss the stew.'),
    tm(S, '...Yes. I miss being somewhere I knew every corner.'),
    tm(Q, 'I miss knowing who was in which room by the footsteps.'),
    tm(D, 'I miss the old window. It looked out on the willow.'),
    tm(Wt, 'I miss having someone to blame for the mess.'),
    tm(P, 'Moving on is natural. ...I do miss it a little.'),
    tm(Gl, 'Yes. Everything. Every day.'),
  ]);
  L('family.mov.mine', MV, [
    FB('A garden. Proper vegetables. And a bench by the door for the evenings.', 'Books. All the walls. Books and a kettle.'),
    W({ pastime: has }, 'A room for my {pastimeWord}. With a door that shuts. And good light.'),
    tm(C, 'Bunting! Flowers! A swing on the oak outside! Everything!'),
    tm(O, 'Leave it as it is. With a good lock.'),
    tm(S, '...A window seat. With cushions. Somewhere to curl up.'),
    tm(Q, 'I\'m going to dig a new room. Underground. To see what\'s down there.'),
    tm(D, 'Paint the ceiling with stars. Then lie on the floor and look.'),
    tm(Wt, 'A sign on the door. \'No admittance except on business. And there\'s no business.\''),
    tm(P, 'Paneling. Brass fittings. The finest hole on the hill.'),
    tm(Gl, 'Nothing much. Keep it dry. That\'s enough.'),
  ]);
  L('family.mov.strange', MV, [
    FB('...I hope so. I\'ll wait for that night.', 'One night it isn\'t. Yes. I like that.'),
    tm(C, 'I\'m sure it\'ll be tonight! Or tomorrow!'),
    tm(O, 'Hmph. We\'ll see.'),
    tm(S, '...Thank you. That helps.'),
    tm(Q, 'Which night? How will I know? Is there a sign?'),
    tm(D, 'And then it\'ll just be home. Like it always was.'),
    tm(Wt, 'I\'ll mark it on the calendar. The night it stopped being strange.'),
    tm(P, 'It\'s already home. I adapt quickly.'),
    tm(Gl, 'I hope you\'re right.'),
  ]);
  L('family.mov.party', MV, [
    FB('A party to wake it up! Yes! It does feel asleep.', 'Have folk round. ...I\'ve never hosted. I\'ll learn.'),
    tm(C, 'A party! Yes! Tonight! Everyone! Bring chairs!'),
    tm(O, 'A small party. Small. Three people. Who don\'t touch anything.'),
    tm(S, '...A very small one. Maybe two people.'),
    tm(Q, 'A housewarming! Does a hole warm up from people? I bet it does. I\'ll measure.'),
    tm(D, 'Lanterns at the door and music in the parlor. Yes.'),
    tm(Wt, 'A housewarming. I\'ll invite the draft. It\'s been here longest.'),
    tm(P, 'A proper housewarming. I\'ll do it properly.'),
    tm(Gl, 'Who would come?'),
  ]);
  L('family.mov.supper', MV, [
    FB('Back for supper. Yes. I can do that.', 'Leaving doesn\'t mean gone. ...I needed to hear that.'),
    tm(C, 'Tonight! I\'ll go back tonight! With pudding!'),
    tm(O, 'Fine. I\'ll go. For the stew.'),
    tm(S, '...I\'ll go. I\'ve been worried they\'d think I didn\'t want to.'),
    tm(Q, 'I wonder if it\'s changed already. I\'ll go and see.'),
    tm(D, 'Back to the old table. Like coming in out of the rain.'),
    tm(Wt, 'I\'ll take my washing. Tradition.'),
    tm(P, 'I\'ll go. Not because I need to. Because it\'s proper.'),
    tm(Gl, 'They won\'t mind? ...I\'ll go.'),
  ]);

  // =====================================================================================
  // Without a roof
  // =====================================================================================
  const HL = { homeless: true };
  addThread({
    id: 'family.homeless', label: 'Where are you sleeping, these nights?', weight: 1.8, cool: 2,
    when: (F) => F.homeless && F.stage !== 'child',
    open: { comfort: 'family.hl.open' },
    beats: {
      start: { line: 'family.hl.start', go: [
        { ap: 'comfort', say: 'That\'s no way to live. I\'m sorry.', to: 'sorry' },
        { ap: 'ask', say: 'Has anyone offered you a room?', to: 'offered' },
        { ap: 'advise', say: 'Ask at the inn again. And smile. It works on innkeepers.', to: 'inn' },
      ] },
      sorry: { line: 'family.hl.sorry', go: [
        { ap: 'ask', say: 'Where was home, before?', to: 'before', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'I\'ll ask about. Someone will have a room.', to: 'promise' },
      ] },
      offered: { line: 'family.hl.offered', go: [
        { ap: 'warm', say: 'I\'ll ask about. Someone will have a room.', to: 'promise' },
        { ap: 'ask', say: 'Where was home, before?', to: 'before' },
      ] },
      inn: { line: 'family.hl.inn', go: [
        { ap: 'ask', say: 'Where was home, before?', to: 'before' },
        { ap: 'warm', say: 'And if not, I\'ll ask about for you.', to: 'promise' },
      ] },
      before: { line: 'family.hl.before', fx: { learn: ['family.wasfrom', '{Name} misses the home {they} left'], trust: 0.02 }, go: [
        { ap: 'share', say: 'I\'ve no home either. A wagon and a road. I know a little of it.', to: 'share' },
        { ap: 'comfort', say: 'This valley takes folk in. Give it a little longer.', to: 'longer' },
      ] },
      promise: { line: 'family.hl.promise', fx: { promise: { k: 'family.room', t: 'You said you\'d find {name} a room', days: 3 }, trust: 0.04 }, end: true },
      share: { line: 'family.hl.share', fx: { trust: 0.05, fond: 0.03, drive: { lonely: -0.15 } }, end: true },
      longer: { line: 'family.hl.longer', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.03 },
  });
  L('family.hl.open', HL, [FB('Where are you sleeping, these nights, {name}?', 'You look cold, {name}. Have you a bed?'), W({ weather: 'rain' }, 'You\'re soaked through, {name}. Where did you sleep?')]);
  L('family.hl.start', HL, [
    FB('Under the big oak. It\'s dry. Mostly. On one side.', 'Here and there. Hedges, mostly. I know all the good hedges now.'),
    W({ roughNights: { min: 3 } }, '{RoughWord} nights out now. I\'ve stopped counting. ...I haven\'t stopped counting.'),
    W({ refused: { min: 1 } }, 'The inn\'s full. Every night it\'s full. Funny how it\'s full when I ask.'),
    W({ weather: 'rain' }, 'In a hedge. In this. The hedge isn\'t trying very hard.'),
    W({ season: 'winter' }, 'Out. In the snow. I wrap myself in my coat and think about soup.'),
    W({ rift: true }, 'Under the bridge. Back home I had a pod. Ninth floor. Heated. Here I\'ve got moss.', 'Signal\'s good under the oak. That\'s about all that\'s good.'),
    tm(C, 'Under the stars! It\'s quite lovely! ...It\'s quite cold, too.'),
    tm(O, 'In a ditch. Thank you for asking. Very kind of the village.'),
    tm(S, '...Wherever no one minds. Behind the mill, mostly.'),
    tm(Q, 'I\'ve tried six different spots. The one by the Store is warmest. I\'ve made notes.'),
    tm(D, 'In the long grass by the river. I watch the stars till I sleep. It\'s almost nice.'),
    tm(Wt, 'I\'ve a lovely place. Open plan. Very airy. No roof.'),
    tm(P, 'I manage. I\'m used to managing. I\'d not ask for help.'),
    tm(Gl, 'Under a hedge. Where else? Nobody wants a stranger.'),
  ]);
  L('family.hl.sorry', HL, [
    FB('...Thank you. It\'s not so bad. It\'s quite bad.', 'It\'s not your fault. It\'s nobody\'s, really.'),
    tm(C, 'Oh, don\'t be sorry! Something will turn up! It always does! ...Doesn\'t it?'),
    tm(O, 'Sorry won\'t keep the rain off. ...But thank you.'),
    tm(S, '...Thank you. Nobody\'s said that.'),
    tm(Q, 'Is it always like this, for newcomers? How long did it take the last ones?'),
    tm(D, 'It\'s like being a ghost. You see all the lamps lit. None of them yours.'),
    tm(Wt, 'Don\'t be sorry. Be a wizard. Magic me up a roof.'),
    tm(P, 'I\'m quite all right. ...It would be nice to have a door, though.'),
    tm(Gl, 'Sorry doesn\'t change anything. ...I\'m glad someone is, though.'),
  ]);
  L('family.hl.offered', HL, [
    FB('No. They look at me and then at the door. Then they close the door.', 'Not yet. Somebody said maybe. Maybe\'s a long word.'),
    W({ rift: true }, 'They see the visor and remember something they\'ve left on the stove.'),
    tm(C, 'Nearly! Someone almost did! They were very nice about not doing it!'),
    tm(O, 'Offered? I\'ve been offered a lot of advice. Not a lot of rooms.'),
    tm(S, '...I haven\'t asked. I don\'t know how to ask.'),
    tm(Q, 'I\'ve worked out who has spare rooms. I just haven\'t worked out how to ask.'),
    tm(D, 'Not yet. One day a door will open. I can feel it.'),
    tm(Wt, 'I\'ve had several offers. All of them hedges.'),
    tm(P, 'I wouldn\'t impose. I\'d need to be asked properly.'),
    tm(Gl, 'No. Nobody will. Why would they?'),
  ]);
  L('family.hl.inn', HL, [
    FB('Smile. Right. I\'ll try. My face has forgotten how.', 'Again? ...All right. Again.'),
    tm(C, 'Smile! I can do that! I\'m very good at that!'),
    tm(O, 'I\'ll smile when there\'s something to smile about.'),
    tm(S, '...I\'ll try. I\'m not good at it with strangers.'),
    tm(Q, 'Does that work? Is there a type of smile? Show me.'),
    tm(D, 'A smile like a lamp at the window. I\'ll try.'),
    tm(Wt, 'I\'ll smile so hard they\'ll give me two rooms.'),
    tm(P, 'I don\'t beg. ...But I can be charming.'),
    tm(Gl, 'They\'ll say no again. ...I\'ll try.'),
  ]);
  L('family.hl.before', HL, [
    FB('Bree. A room over a saddler\'s. It smelled of leather. I miss it.', 'Over the hills. A little hole like these. It\'s gone now. That\'s why I came.'),
    W({ rift: true }, 'Neverdark. A stack on the ninth tier. Always lit. Always humming. I could hear my neighbors\' dreams.', 'A pod in the Relay district. Small. Mine. I had a plant. I wonder who\'s watering it.'),
    tm(C, 'Oh, a lovely place! By the river! With a red door! I\'ll tell you all about it!'),
    tm(O, 'Somewhere else. Somewhere that didn\'t want me either.'),
    tm(S, '...A little room. With a window that looked out on a tree.'),
    tm(Q, 'A farm on the Greenway. Fourteen siblings. I can\'t remember all their names.'),
    tm(D, 'A house by the sea. I think. I was very small. I remember gulls.'),
    tm(Wt, 'A palace. Twenty rooms. Gold faucets. ...A cupboard over a bakery.'),
    tm(P, 'A very good family, in a very fine hole. Circumstances changed.'),
    tm(Gl, 'Somewhere I can\'t go back to. Let\'s leave it there.'),
  ]);
  L('family.hl.promise', HL, [
    FB('Would you? ...I\'ll believe it when I see it. But thank you.', 'A room. Oh. That would be... a room.'),
    tm(C, 'Oh, thank you! I\'ll be the best lodger ever! I\'ll do the washing up!'),
    tm(O, 'Hmph. Well. If you can manage it. I\'ll not hold my breath.'),
    tm(S, '...Thank you. I didn\'t like to ask.'),
    tm(Q, 'Who will you ask? Do you know who has room? Can I come?'),
    tm(D, 'A door that shuts and someone saying goodnight. I\'d forgotten.'),
    tm(Wt, 'A room! With a roof! The height of luxury!'),
    tm(P, 'I\'d pay my way. Make sure they know.'),
    tm(Gl, 'Thank you. Even if it doesn\'t come to anything.'),
  ]);
  L('family.hl.share', HL, [
    FB('...You too? I never thought of wizards being homeless.', 'A wagon and a road. ...Then we\'re the same, a bit.'),
    W({ rift: true }, '...Huh. Two strays. One on the road, one dropped out of the sky.'),
    tm(C, 'Then we\'re road-friends! That\'s nice! That\'s really nice!'),
    tm(O, 'Hmph. At least you\'ve got a wagon.'),
    tm(S, '...Thank you for telling me. I feel less alone.'),
    tm(Q, 'Where do you sleep, then? In the wagon? Is it warm?'),
    tm(D, 'Maybe home isn\'t a place. Maybe it\'s who\'s glad to see you.'),
    tm(Wt, 'A wagon. Lucky. I\'ve got a hedge with ambitions.'),
    tm(P, 'Then you understand. Thank you for not pitying me.'),
    tm(Gl, '...So even wizards don\'t belong anywhere. That\'s oddly comforting.'),
  ]);
  L('family.hl.longer', HL, [
    FB('A little longer. I can do a little longer.', 'Does it? ...I\'ll wait, then.'),
    tm(C, 'I will! I like it here! Even the hedges!'),
    tm(O, 'A little longer. Fine. Then I\'m off to Bree.'),
    tm(S, '...I\'ll try.'),
    tm(Q, 'How long is a little? Days? Weeks? I like to know.'),
    tm(D, 'The valley takes folk in. Like a river takes a stone.'),
    tm(Wt, 'A little longer. My hedge will be devastated when I go.'),
    tm(P, 'I\'m patient. When I need to be.'),
    tm(Gl, 'I\'ve heard that before.'),
  ]);

  // =====================================================================================
  // The hearth: the family the wizard lodges with
  // =====================================================================================
  const HF = { hearth: true };
  addThread({
    id: 'family.hearth', label: 'About me lodging with you', weight: 1.2, cool: 4,
    when: (F) => F.hearth && F.stage !== 'child',
    open: { warm: 'family.hf.open' },
    beats: {
      start: { line: 'family.hf.start', go: [
        { ap: 'ask', say: 'Truly, though. Am I a good lodger?', to: 'lodger' },
        { ap: 'jest', say: 'I\'ve only set fire to the one curtain.', to: 'curtain' },
        { ap: 'warm', say: 'You\'ve made me very welcome. Thank you.', to: 'welcome' },
      ] },
      lodger: { line: 'family.hf.lodger', go: [
        { ap: 'warm', say: 'I\'ll wipe my boots. I promise.', to: 'boots' },
        { ap: 'jest', say: 'I could pay in fireworks.', to: 'fireworks' },
      ] },
      curtain: { line: 'family.hf.curtain', go: [
        { ap: 'ask', say: 'Truly, though. Am I a good lodger?', to: 'lodger' },
        { ap: 'warm', say: 'I\'ll buy you new ones. Red ones. Fireproof.', to: 'welcome' },
      ] },
      welcome: { line: 'family.hf.welcome', go: [
        { ap: 'listen', say: '*You wait. Something more is coming.*', label: 'Wait', to: 'family', need: { trust: 0.25 }, soft: true },
        { ap: 'ask', say: 'And how is the household, really?', to: 'house' },
      ] },
      boots: { line: 'family.hf.boots', fx: { promise: { k: 'family.boots', t: 'You promised to wipe your boots', days: 14 } }, end: true },
      fireworks: { line: 'family.hf.fireworks', fx: { joke: { k: 'family.rent', t: 'The wizard offered to pay his rent in fireworks.' } }, end: true },
      house: { line: 'family.hf.house', go: [
        { ap: 'listen', say: '*You wait. Something more is coming.*', label: 'Wait', to: 'family', need: { trust: 0.2 }, soft: true },
        { ap: 'warm', say: 'It\'s a good house. I\'m glad to be in it.', to: 'end' },
      ] },
      family: { line: 'family.hf.family', fx: { confide: { k: 'family.hearthworry', t: 'A worry {name} has never told anyone outside the hole', secret: true } }, go: [
        { ap: 'comfort', say: 'You\'ve trusted me with that. I\'ll keep it.', to: 'kept' },
        { ap: 'advise', say: 'Tell them. The ones under this roof. They\'ll carry it with you.', to: 'tell' },
      ] },
      kept: { line: 'family.hf.kept', fx: { trust: 0.06, fond: 0.03 }, end: true },
      tell: { line: 'family.hf.tell', fx: { respect: 0.04 }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.hf.open', HF, [FB('I hope I\'m not too much trouble about the place, {name}.', 'How are you finding having a wizard in the spare room, {name}?'), W({ hearthDays: { min: 5 } }, 'I\'ve been under your roof a good while now, {name}. Am I still welcome?')]);
  L('family.hf.start', HF, [
    FB('Trouble? You\'re no trouble. You\'re just very tall. In a low hole.', 'Oh, we\'ve got used to you. The neighbors haven\'t.'),
    G('You hit your head on the beam every morning. Every morning. We\'ve started counting.', 'You snore like a dragon with a cold. We\'ve grown quite fond of it.'),
    W({ hearthDays: { min: 6 } }, 'You\'ve been here so long the cat sits on your chair. That\'s acceptance, that is.'),
    W({ littleOne: has }, '{LittleOne} tells everyone at the story circle there\'s a wizard at home. {KThey}\'s unbearable.'),
    W({ lodger: has }, 'Between you and {lodger}, we\'ve the oddest table in Thistledown. I wouldn\'t change it.'),
    tm(C, 'It\'s wonderful! The whole lane\'s jealous! We\'re the wizard\'s hole!'),
    tm(O, 'You eat a lot. And your beard gets in the soup. ...It\'s fine. It\'s fine.'),
    tm(S, '...It\'s nice. I like hearing you come in at night. It feels safe.'),
    tm(Q, 'Fascinating! You hum in your sleep! In a language I don\'t know! What is it?'),
    tm(D, 'It\'s like having a story living in the spare room.'),
    tm(Wt, 'You\'re the only lodger who\'s ever paid rent in smoke rings.'),
    tm(P, 'Naturally you chose our hole. It\'s the finest. We\'re honored.'),
    tm(Gl, 'It\'s good. I keep waiting for you to leave. Everyone does, in the end.'),
  ]);
  L('family.hf.lodger', HF, [
    FB('Honestly? You leave your hat on the bread. And your staff in the umbrella stand. It doesn\'t fit.', 'Good enough. You eat everything and praise everything. That\'s a good lodger.'),
    G('You track mud in. Every day. From places that aren\'t even muddy.'),
    tm(C, 'The best! The very best! Apart from the boots. And the hat. The best otherwise!'),
    tm(O, 'You\'re loud on the stairs at night. And you hum. Otherwise, adequate.'),
    tm(S, '...You\'re very good. You always say thank you for supper.'),
    tm(Q, 'You come in at strange hours smelling of rain. Where do you go? I want to know.'),
    tm(D, 'You fill the hole with a sort of hum. Like before a storm. In a nice way.'),
    tm(Wt, 'Five stars for conversation. Two for tidiness. One for the fireworks in the bath.'),
    tm(P, 'You\'re a credit to us. Mostly.'),
    tm(Gl, 'You\'re fine. I just know you\'ll go one day. Everyone does.'),
  ]);
  L('family.hf.curtain', HF, [
    FB('The ONE? The kitchen curtain was the third!', 'One curtain. And the hearthrug. And the cat\'s tail, very slightly.'),
    tm(C, 'Ha! It was a very pretty fire! Like a sunset!'),
    tm(O, 'You owe me a curtain. And an eyebrow.'),
    tm(S, '...It was a nice curtain. It\'s all right.'),
    tm(Q, 'How DID it happen, exactly? I\'ve been trying to work it out.'),
    tm(D, 'The smoke made such pretty shapes. I didn\'t mind. Much.'),
    tm(Wt, 'One curtain. We\'ve had more fire in the house since you came than in a forge.'),
    tm(P, 'We\'ve replaced it with a better one. Silk. No harm done.'),
    tm(Gl, 'It\'ll be the roof next.'),
  ]);
  L('family.hf.welcome', HF, [
    FB('Welcome? You\'re one of the family now. Like it or not.', 'It\'s nice, having you. The house is fuller.'),
    G('You\'ve a place at our table as long as you like. That\'s that.'),
    tm(C, 'Of course! You\'re family! We\'ll keep you forever!'),
    tm(O, 'Hmph. Welcome. Well. Don\'t get too comfortable. ...Get comfortable.'),
    tm(S, '...We\'re glad. Really.'),
    tm(Q, 'We\'re glad! And curious. Mostly curious. Will you tell us where you go?'),
    tm(D, 'It feels right. Like the hole was waiting for you.'),
    tm(Wt, 'Welcome is a strong word. Tolerated with great affection.'),
    tm(P, 'We pride ourselves on our hospitality.'),
    tm(Gl, 'Stay as long as you like. Please.'),
  ]);
  L('family.hf.boots', HF, [
    FB('Wipe your boots. I\'ll believe it when I see it.', 'A wizard\'s promise. I\'ll check the mat.'),
    tm(C, 'Ha! Promise? I\'ll make you a special mat! With your name!'),
    tm(O, 'You\'d better. I\'ve swept that passage nine times this week.'),
    tm(S, '...Thank you. I didn\'t like to say.'),
    tm(Q, 'Why do wizards never wipe their boots? Is it a rule?'),
    tm(D, 'Your boots bring in all sorts. Leaves from far away. I quite like it.'),
    tm(Wt, 'I\'ll hold you to it. With a broom.'),
    tm(P, 'Good. Standards must be kept.'),
    tm(Gl, 'You\'ll forget.'),
  ]);
  L('family.hf.fireworks', HF, [
    FB('Fireworks! For rent! ...Actually, that\'s a deal.', 'Ha! The neighbors would complain. Let them.'),
    tm(C, 'YES! Fireworks every Highday! Deal!'),
    tm(O, 'Not in the house. Never again in the house.'),
    tm(S, '...Small ones? I like the small ones.'),
    tm(Q, 'How many fireworks is a week\'s rent? We should work out a rate.'),
    tm(D, 'Paid in sparks. That\'s a wizard\'s coin.'),
    tm(Wt, 'Rent paid in fireworks. The landlord\'s dream.'),
    tm(P, 'We don\'t charge our guests. But we\'d accept fireworks.'),
    tm(Gl, 'You\'d burn the hole down.'),
  ]);
  L('family.hf.house', HF, [
    FB('Really? Busy. Tired. Happy, mostly. Mostly.', 'Oh, the usual. Somebody\'s always cross about the bath.'),
    W({ littleOne: has }, '{LittleOne}\'s been difficult lately. You\'ll have noticed. You notice everything.'),
    W({ spouse: has }, '{Spouse} and I are all right. Tired. We don\'t talk as much as we did.'),
    W({ lodger: has }, '{Lodger}\'s settling. Slowly. There was a row over the kettle. There\'s always a row over the kettle.'),
    W({ larder: 'bare' }, 'The larder worries me. More mouths, less in it. I\'ve not said.'),
    tm(C, 'Good! Really good! ...Mostly good.'),
    tm(O, 'Same as any house. Too many people and not enough hooks.'),
    tm(S, '...All right. I think. I don\'t always know.'),
    tm(Q, 'That\'s an interesting question. I\'m not sure anyone\'s asked it.'),
    tm(D, 'It\'s a good house. It has a heart. You can hear it at night.'),
    tm(Wt, 'Really? Chaos with soup. Same as always.'),
    tm(P, 'We\'re doing very well. Thank you.'),
    tm(Gl, 'Holding together. Just.'),
  ]);
  L('family.hf.family', HF, [
    FB('...Can I tell you something? As family? I\'ve never told anyone.', '...You\'re one of us now. So I\'ll say it. I\'m tired. All the time. I don\'t know why.'),
    W({ littleOne: has }, '...I worry {littleOne} will leave. Go off to the rifts, or Bree. I\'d not survive it.'),
    W({ spouse: has }, '...Sometimes I think {spouse} would be happier with someone else. Someone easier.'),
    W({ goneKin: has }, '...I still set a place for my {goneRel}. {GoneKin}. Nobody knows. I clear it before they see.'),
    W({ parentOld: true }, '...My {parentWord}\'s fading. I can see it. I can\'t say it out loud at home.'),
    W({ rift: true }, '...I dream in neon still. Every night. I wake up and it\'s so dark here. I don\'t tell them.'),
    tm(C, '...I\'m not always as cheerful as I look. Some days it\'s very hard work.'),
    tm(O, '...I know I\'m hard to live with. I try. It doesn\'t come out right.'),
    tm(S, '...I\'m frightened of a lot of things. All the time. I hide it well, I think.'),
    tm(D, '...I always meant to go somewhere. Do something. I never did. Is it too late?'),
    tm(Wt, '...I make everyone laugh so nobody asks how I am.'),
    tm(P, '...I\'m not as sure of myself as I seem. Don\'t you dare tell.'),
    tm(Gl, '...Some days I don\'t want to get up. I do. But I don\'t want to.'),
  ]);
  L('family.hf.kept', HF, [
    FB('...Thank you. It\'s lighter now. Just for telling.', 'I know you will. That\'s why I told you.'),
    tm(C, '...Thank you. There. I feel better already. Mostly!'),
    tm(O, '...Hmph. Good. Not a word.'),
    tm(S, '...Thank you. I\'ve carried that a long time.'),
    tm(Q, 'Does it help, do you think? Telling? It feels like it does.'),
    tm(D, 'It feels like setting something down by the road.'),
    tm(Wt, '...Don\'t look at me like that. I\'ll start crying in the soup.'),
    tm(P, '...Thank you. I\'m glad it was you.'),
    tm(Gl, '...It helps. A bit. Thank you.'),
  ]);
  L('family.hf.tell', HF, [
    FB('...Tell them. You\'re right. They\'d want to know.', 'They\'ll carry it with me. ...I hadn\'t thought of it like that.'),
    tm(C, 'You\'re right! I\'ll tell them tonight! At supper! ...After the pudding.'),
    tm(O, 'Hmph. Maybe. When the moment\'s right. ...Maybe tonight.'),
    tm(S, '...I\'ll try. Will you be there?'),
    tm(Q, 'How do I start? ...I\'ll ask them a question first. That\'s how I start everything.'),
    tm(D, 'At supper, with the candles lit. That\'s when things get said.'),
    tm(Wt, 'I\'ll tell them. Then I\'ll make a joke to cover it. Then I\'ll tell them properly.'),
    tm(P, 'It\'s not easy, asking for help. ...I\'ll ask.'),
    tm(Gl, 'They might not understand. ...I\'ll try.'),
  ]);

  // =====================================================================================
  // The household's lodger
  // =====================================================================================
  const LG = { lodger: has };
  addThread({
    id: 'family.lodger', label: (F) => `How's ${F.lodger || 'the lodger'} settling in?`, weight: 1.1, cool: 4,
    when: (F) => !!F.lodger && F.stage !== 'child',
    open: { ask: 'family.lg.open' },
    beats: {
      start: { line: 'family.lg.start', go: [
        { ap: 'ask', say: 'Any squabbles? Customs that don\'t match?', to: 'customs' },
        { ap: 'jest', say: 'And has {lodger} worked out the bath yet?', to: 'bath' },
        { ap: 'warm', say: 'It was a kind thing, taking {lodger} in.', to: 'kind' },
      ] },
      customs: { line: 'family.lg.customs', go: [
        { ap: 'advise', say: 'Make {lodger} feel at home. Ask about the old ways.', to: 'welcome' },
        { ap: 'jest', say: 'And who won?', to: 'won' },
      ] },
      bath: { line: 'family.lg.bath', go: [
        { ap: 'ask', say: 'Any squabbles? Customs that don\'t match?', to: 'customs' },
        { ap: 'warm', say: 'It was a kind thing, taking {lodger} in.', to: 'kind' },
      ] },
      kind: { line: 'family.lg.kind', go: [
        { ap: 'advise', say: 'Make {lodger} feel at home. Ask about the old ways.', to: 'welcome' },
        { ap: 'warm', say: 'You\'ve a big heart in a small hole.', to: 'end' },
      ] },
      won: { line: 'family.lg.won', fx: { joke: { k: 'family.won', t: 'Who won the kettle war.' } }, end: true },
      welcome: { line: 'family.lg.welcome', fx: { respect: 0.02, run: visit('lodger', 'welcome') }, end: true },
    },
    end: { fond: 0.02 },
  });
  L('family.lg.open', LG, [FB('And how\'s your lodger settling in, {name}?'), G('How\'s {lodger} settling in, {name}?')]);
  L('family.lg.start', LG, [
    FB('Oh, well enough. It takes time.', 'Getting there. We all are.'),
    G('{Lodger}? Quiet. Eats like a bird. Says thank you for everything. I want to feed {lodger} up.', '{Lodger} sits up late by the fire, looking at nothing. I leave the lamp lit.'),
    tm(C, '{Lodger}\'s lovely! We\'ve taught {lodger} three songs and a dance!'),
    tm(O, '{Lodger} leaves the door open. And hums. And {lodger}\'s fine. I suppose.'),
    tm(S, '...{Lodger}\'s nice. We\'re both quiet. It works.'),
    tm(Q, '{Lodger} knows so many things I don\'t! We talk till the candles go out!'),
    tm(D, '{Lodger} tells me about where {lodger} came from. I lie awake imagining it.'),
    tm(Wt, '{Lodger} has learned to say \'second breakfast\' with a straight face. Progress.'),
    tm(P, 'We\'ve made {lodger} very comfortable. Nobody could do it better.'),
    tm(Gl, '{Lodger} seems sad. I don\'t know how to help.'),
  ]);
  L('family.lg.customs', LG, [
    FB('The kettle. {Lodger} boils it twice. Why twice?', 'Bedtimes. {Lodger} goes to bed at dawn. Says it\'s normal where {lodger} comes from.'),
    G('{Lodger} doesn\'t understand second breakfast. Or elevenses. Or why we\'d need both.', '{Lodger} says thank you to the hearth. Every night. We\'ve started doing it too.'),
    tm(C, 'Oh, loads! It\'s brilliant! We\'re learning all sorts!'),
    tm(O, '{Lodger} puts salt on porridge. SALT. On porridge.'),
    tm(S, '...{Lodger} talks to the plants. I do too. We don\'t say.'),
    tm(Q, 'I\'ve been writing them all down! There\'s a custom about spoons I can\'t get my head round.'),
    tm(D, '{Lodger} sings a song at bedtime I\'ve never heard. I hum it now. I don\'t know the words.'),
    tm(Wt, 'We disagree about everything. It\'s very refreshing.'),
    tm(P, 'We\'ve shown {lodger} the proper way of doing things. Mostly {lodger}\'s caught on.'),
    tm(Gl, 'Some. It\'s hard. Two ways of living in one small hole.'),
  ]);
  L('family.lg.bath', LG, [
    FB('Ha! Nearly. There was a flood. A small one.', 'The bath and {lodger} are still getting acquainted.'),
    tm(C, 'Ha! {Lodger} thought it was for washing the dishes! We used it for both!'),
    tm(O, 'No. And the floor\'s still wet.'),
    tm(S, '...We showed {lodger}. It took a while.'),
    tm(Q, 'They don\'t have baths where {lodger} comes from! Imagine! I\'ve so many questions!'),
    tm(D, '{Lodger} sits in it and sings. Very loudly. Very beautifully.'),
    tm(Wt, 'The bath has worked {lodger} out. Which is more than we have.'),
    tm(P, 'Our bath is very simple to operate. We\'ve written instructions.'),
    tm(Gl, 'There was an incident. We don\'t talk about it.'),
  ]);
  L('family.lg.kind', LG, [
    FB('Kind? It was only a bed. Anyone would have.', 'Nobody should sleep under a hedge. Not in Thistledown.'),
    tm(C, 'It was the best thing we ever did! The house is so much merrier!'),
    tm(O, 'Hmph. Somebody had to. Nobody else was going to.'),
    tm(S, '...I slept rough once. Long ago. I remember.'),
    tm(Q, 'Was it? I just wanted to know who {lodger} was.'),
    tm(D, 'It felt like the hole had a spare room for a reason.'),
    tm(Wt, 'Kind, and also we needed someone to blame for the cookies.'),
    tm(P, 'It was the proper thing to do. We do the proper thing.'),
    tm(Gl, 'It was nothing. I hope it\'s enough.'),
  ]);
  L('family.lg.won', LG, [
    FB('Nobody. We have two kettles now.', 'The kettle won. It always does.'),
    tm(C, 'Both of us! We\'re best friends now!'),
    tm(O, 'I did. Naturally.'),
    tm(S, '...{Lodger}. I didn\'t mind.'),
    tm(Q, 'It\'s ongoing. I\'m keeping score.'),
    tm(D, 'We met in the middle. Like a bridge.'),
    tm(Wt, 'It was a draw. Honor satisfied. Tea made.'),
    tm(P, 'Our way, of course. With some small concessions.'),
    tm(Gl, 'Nobody wins those.'),
  ]);
  L('family.lg.welcome', LG, [
    FB('Ask about the old ways. Yes. I\'ve been too busy telling ours.', 'I\'ll ask tonight. Over supper.'),
    tm(C, 'Yes! We\'ll have an evening of {lodger}\'s customs! With food!'),
    tm(O, 'Fine. I\'ll ask. If {lodger} starts on about the kettle, I\'m leaving.'),
    tm(S, '...I\'d like that. I\'m better at listening.'),
    tm(Q, 'I\'ve been dying to ask! I didn\'t know if it was rude!'),
    tm(D, 'Their old ways and ours, side by side. Like two songs.'),
    tm(Wt, 'I\'ll ask. And then I\'ll steal all the good customs.'),
    tm(P, 'It\'s only polite. I\'ll do it properly.'),
    tm(Gl, 'Maybe it\'ll make {lodger} homesick. ...I\'ll ask gently.'),
  ]);
});
