'use strict';
// ---------------------------------------------------------------------------
// The village, part one: other people. Who they count a friend, who they're
// cross with, who they look up to, the neighbors and the old rivalry, and
// word carried between them by the wizard ("Bodo sends his regards"). Folk
// ask after each other through you, and now and then ask you to settle a
// squabble over a plum tree. The people a talk is about are picked once when
// it opens (facts below), so they don't change halfway through a thread.
// ---------------------------------------------------------------------------

talkPack('village', () => {
  const has = (x) => x != null && x !== false && x !== '';
  const TEMPERS = ['cheerful', 'ornery', 'shy', 'curious', 'dreamy', 'witty', 'proud', 'gloomy', 'child'];
  // say(key, { _: fallback, <temper>: [...], elder/grown: [...], rift: [...], fine/plain/bright: [...] }, [extra rules])
  const say = (key, spec, more) => {
    const rules = [];
    for (const k in spec) {
      const text = spec[k];
      if (k === '_') rules.push({ text });
      else if (TEMPERS.includes(k)) rules.push({ if: { temper: k }, text });
      else if (k === 'elder' || k === 'grown') rules.push({ if: { stage: k }, text });
      else if (k === 'rift') rules.push({ if: { rift: true }, text });
      else if (['plain', 'fine', 'bright'].includes(k)) rules.push({ if: { register: k }, text });
      else throw new Error(`village pack: unknown spec "${k}" in ${key}`);
    }
    lines(key, rules.concat(more || []));
  };
  const who = (T, k) => (T.F && T.F[k] != null ? personById(T.F[k]) : null);
  const moodWord = (o) => (o.mood() > 0.7 ? 'merry' : o.mood() > 0.45 ? 'fair' : o.mood() > 0.25 ? 'low' : 'miserable');
  const jobWord = (o) => (o && o.job && JOBS[o.job] ? JOBS[o.job].label.toLowerCase() : null);
  const visit = (T, v, k, kind) => { const o = who(T, k); if (o && ACTIONS.whisper_visit && !o.leaving) { v.queue.push({ a: ACTIONS.whisper_visit, extra: { to: o, kind } }); v.noteDecision && v.noteDecision('whisper_visit', 'the wizard suggested it', []); } };
  // carrying word: a promise kept when the wizard passes it on (village.regards)
  const promiseRegards = (T, v, o, sorry) => {
    if (!o) return;
    const b = bondFull(v), k = 'village.regards:' + o.id;
    const t = sorry ? `You said you'd tell ${o.first} that ${v.first} is sorry` : `You said you'd pass ${v.first}'s regards to ${o.first}`;
    const old = b.promises.find((p) => p.k === k && p.state === 'open');
    if (old) { if (sorry && !old.sorry) { old.sorry = true; old.t = t; } return; }
    b.promises.unshift({ k, t, d: Game.day, due: Game.day + 5, state: 'open', sorry: !!sorry });
    if (b.promises.length > 12) b.promises.length = 12;
    T.log.push({ who: 'note', text: `${v.first} will remember that.` });
  };
  addPromiseCheck('village.regards', (v, p) => (p.done ? 'kept' : null));

  // --- Facts: the people in their life ---------------------------------------------
  const SPATS = {
    plum: ['the plum tree on the boundary', 'plum'], barrow: ['a wheelbarrow that was borrowed and never came back', 'wheelbarrow'],
    hens: ['the hens in the cabbages', 'cabbage'], hedge: ['the hedge between our gardens', 'hedge'], bench: ['the good bench outside the Badger', 'bench'],
    mushrooms: ['the mushroom ring by the old oak', 'mushroom'], cat: ['the ginger cat that sleeps at mine', 'cat'], ladder: ['a ladder lent at Yule and kept till now', 'ladder'],
    recipe: ['Grandmother\'s seed-cake recipe', 'recipe'], path: ['the short cut across the bottom of my garden', 'path'],
  };
  // a sentiment's reason, as something you could say "I still think about ..." of (null if it won't read)
  const WHY = {
    'brought me flowers': 'the flowers', 'a present': 'that present', 'supper together': 'our supper together', 'a true friendship': 'all we\'ve been through', 'a letter': 'that letter',
    'the keepsake': 'the keepsake', 'finding each other again': 'finding each other again', 'a good natter': 'our last good natter', 'nursed me when I was poorly': 'the nursing, when I was poorly',
    'came to see me': 'that visit', 'making it up': 'making it up', 'giving me a good run': 'the run we had at the fair', 'a good recommendation': 'a good word put in',
    'soup when I had the flu': 'the soup, when I had the flu', 'understanding when I was homesick': 'the kindness, when I was homesick', 'all those contests': 'all those contests',
    'listening to my dream': 'that evening, talking about dreams', 'made me feel at home': 'being made to feel at home', 'an evening under the lanterns': 'that evening under the lanterns',
    'being such a good apprentice': 'the apprenticeship', 'sending word by the wizard': 'the word sent by the wizard', 'saying sorry, by the wizard': 'the apology', 'settling it fairly': 'settling things fairly',
    'a kind word from a rival': 'a kind word, from a rival', 'that squabble': 'that squabble', 'the wizard\'s say-so': 'the wizard\'s say-so',
  };
  const whyOf = (w) => (w == null ? null : WHY[w] ? WHY[w] : /^winning /.test(w) ? 'the business with ' + w.slice(8) : null);
  const PEOPLE = ['vFriend', 'vFriendId', 'vFriendJob', 'vFriendRift', 'vFriendMood', 'vFriendWhy', 'vFriendSeen', 'vFoe', 'vFoeId', 'vFoeWhy', 'vFoeTag', 'vFoeJob',
    'vHero', 'vHeroId', 'vHeroJob', 'vHeroWhy', 'vHeroElder', 'vNext', 'vNextId', 'vNextJob', 'vNextHome', 'vNextKind', 'vRivalPrize', 'vRivalThing', 'vRivalLead', 'vRivalJob',
    'vRegardsFrom', 'vRegardsFromId', 'vRegardsSorry', 'vAsked', 'vAskedId', 'vAskedMood', 'vAskedSick', 'vSpat', 'vSpatId', 'vSpatKey', 'vSpatWhat', 'vSpatThing'];
  function pickPeople(v) {
    const P = {};
    const others = Game.villagers.filter((o) => o !== v && !o.leaving && o.stage !== 'baby');
    const family = (o) => o.id === v.spouse || o.id === v.sweetheart || (v.parents || []).includes(o.id) || (o.parents || []).includes(v.id) || (typeof related === 'function' && related(v, o));
    const rel = (o) => v.rel[o.id] ?? 0.1;
    const sents = (o) => (typeof sentimentsOf === 'function' ? sentimentsOf(v, o) : []);
    const peers = others.filter((o) => !family(o) && o.id !== v.rival && (v.isChild() ? true : o.stage !== 'child'));
    P.friend = peers.filter((o) => rel(o) >= 0.3).sort((a, b) => rel(b) - rel(a))[0] || null;
    const sore = (o) => sents(o).filter((s) => SENT[s.tag] && SENT[s.tag][1] < 0);
    P.foe = others.filter((o) => o.id !== v.spouse && !(v.parents || []).includes(o.id) && !(o.parents || []).includes(v.id) && (sore(o).length || rel(o) < -0.15))
      .sort((a, b) => sore(b).length - sore(a).length || rel(a) - rel(b))[0] || null;
    const adm = others.find((o) => sents(o).some((s) => s.tag === 'admiring'));
    const skill = (o) => (o.job && JOBS[o.job] ? (o.skills[JOBS[o.job].skill] || 0) : 0);
    P.hero = adm || others.filter((o) => o.isGrown() && !family(o) && o.id !== v.rival && o !== P.foe && rel(o) >= 0.15 && skill(o) >= 35).sort((a, b) => skill(b) - skill(a))[0] || null;
    const h = World.homes[v.homeId];
    if (h && h.built) {
      const near = World.homes.filter((x) => x.built && x.id !== h.id && residentsOf(x).some((o) => o.stage !== 'baby'))
        .sort((a, b) => dist(a.stepX, a.stepY, h.stepX, h.stepY) - dist(b.stepX, b.stepY, h.stepX, h.stepY))[0];
      if (near) { const res = residentsOf(near).filter((o) => o.stage !== 'baby').sort((a, b) => (b.isGrown() ? 1 : 0) - (a.isGrown() ? 1 : 0) || a.id - b.id); P.next = res[0] || null; P.nextHome = near.name; }
    }
    // a word carried from someone: an open promise from them to you, not yet passed on
    for (const id in Game.wizBond || {}) {
      const b = Game.wizBond[id];
      if (!b.promises) continue;
      const pr = b.promises.find((p) => p.state === 'open' && !p.done && p.k === 'village.regards:' + v.id);
      if (pr) { const o = personById(+id); if (o && !o.leaving) { P.regards = o; P.regardsSorry = !!pr.sorry; break; } }
    }
    // someone they'd ask the wizard after: a friend he's met, else anyone they're fond of he's met
    const metW = (o) => !!(Game.wizMet || {})[o.id];
    P.asked = [P.friend, P.hero, P.next].find((o) => o && metW(o)) || peers.filter((o) => metW(o) && rel(o) >= 0.2).sort((a, b) => rel(b) - rel(a))[0] || null;
    // a squabble the wizard might settle: whoever they're cross with, else their rival, else next door
    P.spat = (P.foe && P.foe.isGrown() ? P.foe : null) || rivalOf(v) || (P.next && P.next.isGrown() ? P.next : null);
    if (P.spat) { const ks = Object.keys(SPATS); P.spatKey = ks[Math.floor(hash2(v.id * 7 + P.spat.id, Math.floor(Game.day / 3)) * ks.length)]; }
    return P;
  }
  addFacts((v, F, T) => {
    for (const k of PEOPLE) F[k] = null;
    if (v.stage === 'baby') return;
    // picked once a talk, so a thread keeps its subject
    let P = T && T.vxPeople && T.vxPeople.vid === v.id ? T.vxPeople : null;
    if (!P) { P = pickPeople(v); P.vid = v.id; if (T && T.v) T.vxPeople = P; }
    const alive = (o) => o && Game.villagers.includes(o);
    const fr = alive(P.friend) ? P.friend : null;
    if (fr) {
      const wb = (Game.wizBond || {})[fr.id];
      const s = sentimentsOf(v, fr).find((x) => SENT[x.tag] && SENT[x.tag][1] > 0);
      Object.assign(F, { vFriend: fr.first, vFriendId: fr.id, vFriendJob: jobWord(fr), vFriendRift: fr.isRiftborn(), vFriendMood: moodWord(fr), vFriendWhy: s ? whyOf(s.why) : null, vFriendSeen: !!(wb && wb.talks && wb.last >= Game.day - 1) });
    }
    const fo = alive(P.foe) ? P.foe : null;
    if (fo) {
      const s = sentimentsOf(v, fo).find((x) => SENT[x.tag] && SENT[x.tag][1] < 0);
      Object.assign(F, { vFoe: fo.first, vFoeId: fo.id, vFoeWhy: s ? whyOf(s.why) : null, vFoeTag: s ? s.tag : 'sour', vFoeJob: jobWord(fo) });
    }
    const he = alive(P.hero) ? P.hero : null;
    if (he) { const s = sentimentsOf(v, he).find((x) => x.tag === 'admiring'); Object.assign(F, { vHero: he.first, vHeroId: he.id, vHeroJob: jobWord(he), vHeroWhy: s ? whyOf(s.why) : null, vHeroElder: he.stage === 'elder' }); }
    const ne = alive(P.next) ? P.next : null;
    if (ne) Object.assign(F, { vNext: ne.first, vNextId: ne.id, vNextJob: jobWord(ne), vNextHome: P.nextHome || null, vNextKind: relKind(v, ne) });
    const ri = rivalOf(v);
    if (ri && CONTESTS[v.rivalSkill || 'farming']) {
      const c = CONTESTS[v.rivalSkill || 'farming'], a = v.rivalScore || 0, b = ri.rivalScore || 0;
      Object.assign(F, { vRivalPrize: c[0], vRivalThing: c[1], vRivalLead: a > b ? 'ahead' : a < b ? 'behind' : 'level', vRivalJob: jobWord(ri) });
    }
    const rg = alive(P.regards) ? P.regards : null;
    if (rg) Object.assign(F, { vRegardsFrom: rg.first, vRegardsFromId: rg.id, vRegardsSorry: !!P.regardsSorry });
    const as = alive(P.asked) ? P.asked : null;
    if (as) Object.assign(F, { vAsked: as.first, vAskedId: as.id, vAskedMood: moodWord(as), vAskedSick: as.isSick() });
    const sp = alive(P.spat) ? P.spat : null;
    if (sp && P.spatKey) Object.assign(F, { vSpat: sp.first, vSpatId: sp.id, vSpatKey: P.spatKey, vSpatWhat: SPATS[P.spatKey][0], vSpatThing: SPATS[P.spatKey][1] });
  });

  // =================================================================================
  // And how's your friend?
  // =================================================================================
  addThread({
    id: 'village.friend', label: (F) => (F.vFriend ? `And how's ${F.vFriend}?` : 'Your friends'), reveals: 'village.friend', weight: 1.1, cool: 4,
    when: (F) => has(F.vFriend), rel: (F) => (F.vFriendSeen ? 1.6 : 1.1),
    open: { ask: 'village.friend.open' },
    beats: {
      start: { line: 'village.friend.start', fx: { learn: ['village.friend', '{Name} counts {vFriend} a dear friend.'] }, go: [
        { ap: 'ask', say: 'What do you like best about {vFriend}?', to: 'best' },
        { ap: 'jest', say: 'village.friend.jest', label: 'Thick as thieves, you two', to: 'plot' },
        { ap: 'share', say: '{VFriend} was asking after you, as it happens.', to: 'asked', need: { if: { vFriendSeen: true } } },
        { ap: 'warm', say: 'Shall I pass on your regards, next time I see {vFriend}?', to: 'regards' },
      ] },
      best: { line: 'village.friend.best', go: [
        { ap: 'ask', say: 'How did you two meet?', to: 'met' },
        { ap: 'warm', say: 'Have you ever told {vFriend} that?', to: 'toldthem' },
        { ap: 'listen', say: '*You say nothing, and let them go on.*', label: 'Let them go on', to: 'deeper', need: { open: 2 }, soft: true },
      ] },
      plot: { line: 'village.friend.plot', go: [
        { ap: 'ask', say: 'Go on. What\'s the scheme?', to: 'scheme', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'Good friends are worth a few scrapes.', to: 'best' },
        { ap: 'jest', say: 'I shall be watching you both. Closely. From under my hat.', to: 'watched' },
      ] },
      asked: { line: 'village.friend.asked', fx: { run: (T, v) => { const o = who(T, 'vFriendId'); if (o) { v.bond(o, 0.03); feel(v, 'cheered', o.first); } } }, go: [
        { ap: 'advise', say: 'Go and see {vFriend}. Today, while it\'s fine.', to: 'visit' },
        { ap: 'jest', say: 'I said you\'d been pining. Was I wrong?', to: 'pining' },
        { ap: 'warm', say: 'I\'ll tell {vFriend} you were glad to hear it.', to: 'regards' },
      ] },
      regards: { line: 'village.friend.regards', fx: { run: (T, v) => promiseRegards(T, v, who(T, 'vFriendId')) }, go: [
        { ap: 'ask', say: 'Anything else I should tell {vFriend}?', to: 'message' },
        { ap: 'warm', say: 'Consider it done.', to: 'end' },
      ] },
      met: { line: 'village.friend.met', go: [
        { ap: 'warm', say: 'And friends ever since.', to: 'since' },
        { ap: 'jest', say: 'Not the most promising start.', to: 'since' },
        { ap: 'ask', say: 'Have you ever fallen out?', to: 'fallen', need: { open: 1 }, soft: true },
      ] },
      toldthem: { line: 'village.friend.toldthem', go: [
        { ap: 'advise', say: 'Tell {vFriend}. Folk like to hear it, even when they know.', to: 'visit' },
        { ap: 'warm', say: 'I expect {vFriend} knows.', to: 'end' },
      ] },
      deeper: { line: 'village.friend.deeper', fx: { confide: { k: 'village.friend.worry', t: '{Name} worries about {vFriend} more than {they} let on.' } }, go: [
        { ap: 'comfort', say: 'You\'re a good friend to worry.', to: 'end' },
        { ap: 'advise', say: 'Then go and see {vFriend}. Worry is lighter carried in company.', to: 'visit' },
      ] },
      scheme: { line: 'village.friend.scheme', fx: { joke: { k: 'village.scheme', t: '{Name} and {vFriend} have a scheme. The wizard is watching.' } }, go: [
        { ap: 'jest', say: 'Count me in. I\'ll bring the fireworks.', to: 'end', fx: { fond: 0.02 } },
        { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'end', fx: { trust: 0.03 } },
      ] },
      watched: { line: 'village.friend.watched', end: true },
      visit: { line: 'village.friend.visit', fx: { respect: 0.02, run: (T, v) => visit(T, v, 'vFriendId', 'kin') }, end: true },
      pining: { line: 'village.friend.pining', end: true },
      message: { line: 'village.friend.message', end: true },
      since: { line: 'village.friend.since', end: true },
      fallen: { line: 'village.friend.fallen', go: [
        { ap: 'ask', say: 'And how did you make it up?', to: 'madeup' },
        { ap: 'warm', say: 'The best friendships have a dent or two.', to: 'end' },
      ] },
      madeup: { line: 'village.friend.madeup', fx: { trust: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('village.friend.open', [
    { text: ['And how\'s {vFriend} these days, {name}?', 'I don\'t suppose you\'ve seen {vFriend} lately, {name}?', 'How\'s {vFriend} keeping, {name}? You two are close, I think.'] },
    { if: { stage: 'child' }, text: ['Who\'s your best friend, {name}? Is it {vFriend}?', 'And how\'s {vFriend}? Still your best friend?'] },
  ]);
  say('village.friend.start', {
    _: ['{VFriend}? Oh, {vFriend}\'s grand. The best of folk.', 'Ah, {vFriend}. I\'d be lost without {vFriend}, truth be told.', '{VFriend}\'s well, I think. I hope. I\'ll ask.'],
    cheerful: ['{VFriend}! Oh, the best. We laughed so hard on Highday I lost a button.', 'Wonderful, as ever. You can\'t be glum near {vFriend}. I\'ve tried.'],
    ornery: ['{VFriend}? Still daft as a brush. Still my friend. Don\'t tell {vFriend} I said so.', 'Hmph. {VFriend}\'s all right. Better than most. Most are dreadful.'],
    shy: ['...{VFriend}\'s my friend. My good friend. I don\'t have many, so I\'m careful of {vFriend}.', 'Oh! {VFriend}\'s well. I think. We don\'t need to talk much, us two.'],
    curious: ['{VFriend}? Do you know, I\'ve known {vFriend} years and still don\'t know what {vFriend} keeps in that tin.', 'Very well! Why do you ask? Has {vFriend} said something?'],
    dreamy: ['{VFriend}... is like a warm window on a wet night. You know?', 'We sit on the wall and watch the clouds, {vFriend} and me. Hours, sometimes.'],
    witty: ['{VFriend}? Still putting up with me. A saint, practically. A short one.', 'Thriving. Mostly on my jokes and other folk\'s cookies.'],
    proud: ['{VFriend} is a fine sort. I choose my friends with care, you know.', 'Very well indeed. {VFriend} has excellent taste in friends.'],
    gloomy: ['{VFriend} still talks to me. That\'s something, isn\'t it.', '{VFriend}\'s well. Better than me. Most folk are.'],
    child: ['{VFriend} is my BEST friend. We have a den. You can\'t come in. Sorry.', '{VFriend}! We\'re going to be friends for a hundred years. We swore.'],
    elder: ['{VFriend}? Ah. When you\'re my age, wizard, you count your friends like spoons. I\'ve one good one left.', 'Known {vFriend} since we were knee-high to a toadstool.'],
    rift: ['{VFriend}? First person here who didn\'t stare at my visor. Full signal, that one.', '{VFriend}\'s my anchor, kind of. Without {vFriend} I\'d have drifted off-grid.'],
  }, [
    { if: { vFriendMood: ['low', 'miserable'] }, text: ['{VFriend}? A bit low lately, I think. I\'ve been meaning to look in.', 'Not so bright, {vFriend}. I don\'t know why. I haven\'t liked to ask.'] },
    { if: { vFriendMood: 'merry' }, text: ['{VFriend}\'s as merry as a lark this week. It\'s catching.', 'On top of the world, {vFriend}. Whistling at breakfast, I heard.'] },
    { if: { vFriendRift: true, rift: false }, text: ['{VFriend}? From the other side, you know. Talks in riddles. Lovely riddles.', 'Funny, a friend from through the sky. {VFriend} taught me what a battery is. Sort of.'] },
    { if: { vFriendJob: (j) => has(j) }, text: ['{VFriend}\'s well. Worked off their feet, mind. {VFriendJob}s never get a sit-down.'] },
    { if: { vFriendWhy: (w) => has(w) }, pri: 1, text: ['{VFriend}? Oh, the best. I still think about {vFriendWhy}.', 'Grand, I hope. There was {vFriendWhy}, not long ago. I\'ve been smiling since.'] },
  ]);
  lines('village.friend.jest', [{ text: ['Thick as thieves, you two. What are you plotting?', 'Every time I see you and {vFriend} together, a pie goes missing. I\'m only saying.'] }]);
  say('village.friend.best', {
    _: ['{VFriend} listens. Really listens. That\'s rarer than you\'d think.', 'You always know where you are with {vFriend}.', '{VFriend} never once let me down. Not once.'],
    cheerful: ['The laugh! {VFriend} laughs like a kettle coming to the boil.', 'Everything\'s more fun with {vFriend}. Even weeding. Especially weeding.'],
    ornery: ['{VFriend} doesn\'t chatter. You can sit a whole afternoon and not say a word.', '{VFriend} tells me when I\'m being a fool. Nobody else dares.'],
    shy: ['{VFriend} doesn\'t make me talk. We just... are. It\'s nice.', '{VFriend} saved me a seat at the Badger. The first time anybody did.'],
    curious: ['{VFriend} always has a question I hadn\'t thought of. Drives me mad. I love it.', 'We argue about everything. Clouds, cheese, the moon. Wonderful.'],
    dreamy: ['{VFriend} sees things. Little things. A spider\'s web with dew on. Shows me.', 'When I say something daft, {vFriend} doesn\'t laugh. {VFriend} thinks about it.'],
    witty: ['{VFriend} laughs at my jokes. All of them. Even the ones about turnips.', 'We finish each other\'s... well. Sandwiches, mostly.'],
    proud: ['{VFriend} has standards. Like me. We don\'t suffer fools.', 'Loyal. {VFriend} would stand by me in front of the whole Moot.'],
    gloomy: ['{VFriend} doesn\'t try to cheer me up. Just sits with me. That\'s better.', '{VFriend} puts up with me. It can\'t be easy.'],
    child: ['{VFriend} can whistle with two fingers! And knows where the frogs are!', '{VFriend} shares. Even the last cookie. Even the jammy ones.'],
    elder: ['{VFriend} remembers the old days right. Everyone else gets them wrong.', 'We\'ve buried a lot of good folk between us, {vFriend} and I. You lean on each other.'],
    rift: ['{VFriend} asked about home and actually waited for the answer. No one does that.', '{VFriend} doesn\'t pretend I\'m from here. Doesn\'t pretend I\'m not, either.'],
  }, [
    { if: { vFriendJob: 'baker' }, text: ['Honestly? The crusts. {VFriend} saves me the ends of the loaves. That\'s friendship.'] },
    { if: { vFriendJob: 'innkeeper' }, text: ['{VFriend} always knows when I need a quiet corner at the Badger and a pint I didn\'t order.'] },
    { if: { vFriendJob: 'brewer' }, text: ['{VFriend} lets me taste the new barrel first. Now that\'s a friend.'] },
    { if: { vFriendJob: 'herbalist' }, text: ['{VFriend} knows a cure for everything. Except my singing. {VFriend}\'s tried.'] },
    { if: { vFriendJob: 'storyteller' }, text: ['{VFriend} tells me stories when I can\'t sleep. Old ones. Silly ones.'] },
  ]);
  say('village.friend.plot', {
    _: ['Plotting? Us? Nothing! ...Nothing you need to know about.', 'We\'re not plotting. We\'re planning. It\'s different.', 'Who says we\'re plotting? Has {vFriend} said something?'],
    cheerful: ['Ha! Only a little plotting. The nice kind. With cake.', 'Oh, we\'re always up to something! It keeps the days lively.'],
    ornery: ['Plotting? I\'m too old to plot. {VFriend} plots. I hold the ladder.', 'Mind your own beeswax, wizard. Hmph. ...It\'s a good plot, mind.'],
    shy: ['We... might be planning something. A small something.', 'Oh! No. Well. A bit. It\'s {vFriend}\'s idea.'],
    curious: ['Plotting\'s a strong word. Experimenting. Would you like to know with what?', 'Can I ask you something about fireworks? Hypothetically.'],
    dreamy: ['We were going to build a raft. Float down the Water. Just to see.', 'We talk about running off to the Sea. We never will. It\'s nice to talk about.'],
    witty: ['We\'re plotting to take over the Moot. I\'m to be Mayor and {vFriend} is to be the hat.', 'Plotting? We prefer \'arranging events in advance\'.'],
    proud: ['We are organizing something, yes. Something rather grand.', 'Plotting is for scoundrels. We are planning. Properly.'],
    gloomy: ['Nothing ever comes of our plots. We plot anyway.', 'We were going to... oh, it doesn\'t matter. It\'ll rain.'],
    child: ['We\'re NOT plotting. We\'re digging to the other side of the world. Don\'t tell.', 'Plotting! We have a secret password. It\'s... no. I can\'t tell you.'],
    rift: ['Not plotting. Patching. {VFriend}\'s helping me wire a lamp to a potato.', 'Plotting? Just a little side-project. Low-power. Mostly safe.'],
  });
  say('village.friend.asked', {
    _: ['{VFriend} was? Oh! That\'s nice. That\'s really nice.', 'Asking after me? Well. Well, well. That\'s cheered me up.', 'Did {vFriend}? What did {vFriend} say? Exactly?'],
    cheerful: ['Ha! Did {vFriend}? Oh, that\'s made my day, that has.', 'Asking after me! I\'ll go round with a pie. Two pies.'],
    ornery: ['Asking after me, was {vFriend}? Hmph. Nosy. ...Was {vFriend} well, though?', 'Probably wants the ladder back. ...Still. Nice of {vFriend}.'],
    shy: ['...{VFriend} asked about me? Really? Oh.', 'I didn\'t think anybody... oh. That\'s kind of {vFriend}.'],
    curious: ['What exactly did {vFriend} ask? Word for word, please.', 'Asking after me? Why? Has something happened? I\'m curious now.'],
    dreamy: ['Funny. I was just thinking about {vFriend}. Isn\'t that funny?', 'Like a letter you didn\'t expect. That\'s what that is.'],
    witty: ['Was {vFriend}? Then {vFriend} owes me tuppence. We have a bet on who\'d crack first.', 'Asking after me. {VFriend} must want something. Probably my company.'],
    proud: ['Naturally. {VFriend} knows a good friend when {vFriend} has one.', 'Well, of course. I am rather worth asking after.'],
    gloomy: ['Was {vFriend}? Somebody remembers me, then.', 'Really? I thought {vFriend} had forgotten. People do.'],
    child: ['{VFriend} ASKED about me? What did you say? Did you say I\'m brave?', 'Really really? I\'m going to go and find {vFriend} RIGHT NOW. After pudding.'],
    rift: ['{VFriend} pinged me? Through you? That\'s analog. I love it.', 'Message received, relay wizard. Signal strength: excellent.'],
  });
  say('village.friend.regards', {
    _: ['Would you? Tell {vFriend} I\'ll be round soon. I mean it this time.', 'Oh yes. Give {vFriend} my best. And say the kettle\'s always on.', 'Please. And tell {vFriend} I haven\'t forgotten about Highday.'],
    cheerful: ['Yes! Tell {vFriend} I said hello, and hello again, and a third hello for luck.', 'Do! Say I\'ve got a joke saved up. A good one.'],
    ornery: ['If you must. Tell {vFriend} I want my good knife back. And that I said hello. In that order.', 'Tell {vFriend}... oh, just say I asked. Don\'t make a fuss of it.'],
    shy: ['Would you? Just... say I said hello. Nothing soppy.', 'Could you? Thank you. I never know how to say things myself.'],
    curious: ['Yes, and ask {vFriend} whether the beans came up. I\'ve been dying to know.', 'Do, and watch {vFriend}\'s face when you say it. Then tell me.'],
    dreamy: ['Tell {vFriend} I saw the first swallow today and thought of us.', 'Say... say the evenings aren\'t the same. {VFriend}\'ll know.'],
    witty: ['Tell {vFriend} I said something devastatingly clever. Make one up. You\'re good at that.', 'Give {vFriend} my regards, and my apologies about the chicken. {VFriend} knows.'],
    proud: ['Please do. My regards, properly given. None of your mumbling.', 'Yes. Tell {vFriend} I asked particularly.'],
    gloomy: ['If you remember. Folk don\'t usually.', 'Tell {vFriend}... I hope {vFriend}\'s better than me.'],
    child: ['Tell {vFriend} the den is still secret! And we need more sticks!', 'Say I said HELLO. In a big voice. Like a wizard.'],
    rift: ['Forward my regards. Encrypted. Just whisper it.', 'Tell {vFriend}: ping received, ping returned.'],
  });
  say('village.friend.met', {
    _: ['We sat next to each other at a wedding. Neither of us knew the couple.', 'I trod on {vFriend}\'s foot at the dance. Twice. Friends ever since.', 'At the well. I dropped my bucket in and {vFriend} laughed for a week.'],
    cheerful: ['Over a pie! We both reached for the last slice at a party. We halved it.', 'Fell in the river together, chasing the same hat. Neither of us got it.'],
    ornery: ['We had a blazing row about cabbages. Then another. Then we were friends. That\'s how it goes.', '{VFriend} told me my fence was crooked. It was. I haven\'t forgiven {vFriend}.'],
    shy: ['{VFriend} sat with me at the harvest supper when nobody else did.', 'We were both hiding from a party. Behind the same tree.'],
    curious: ['{VFriend} asked me what I was looking at through a bottle. I showed {vFriend}. That was that.', 'We both wanted to know what was in the old badger sett. Got very muddy finding out.'],
    dreamy: ['I don\'t remember not knowing {vFriend}. It\'s like the river. Always been there.', 'In the rain, under the party tree. I can still smell it.'],
    witty: ['I told a joke at the Badger and {vFriend} was the only one who laughed. A kindred spirit.', 'We were both thrown out of a choir. For harmonizing. Badly.'],
    proud: ['We were the two best at the spelling bee. I won, of course. {VFriend} took it well.', '{VFriend} was the only one who came to see my first prize pumpkin.'],
    gloomy: ['We were both left out of the same game, as children. We started our own.', 'At a funeral. Funny where you find people.'],
    child: ['We both found the same frog! So we shared it. His name is Lord Puddle.', 'At school! {VFriend} lent me a pencil and never asked for it back.'],
    elder: ['Oh, seventy years gone. We stole apples from the same tree. The tree\'s gone now. We\'re not.', 'Before you last came, wizard. Before the time before that.'],
    rift: ['Day one. I came out of the rift soaking wet and {vFriend} lent me a towel and didn\'t ask a thing.', '{VFriend} found me asleep under a hedge. Brought soup. No questions.'],
  });
  say('village.friend.since', {
    _: ['Ever since. Through thick and thin. Mostly thin, some winters.', 'Ha! Yes. And I\'d do it all again.'],
    cheerful: ['And never a dull day since!', 'Best foot I ever trod on.'],
    ornery: ['Ever since, more or less. Mostly more.', 'Hmph. Well. It worked out.'],
    shy: ['...Yes. I\'m lucky.', 'Ever since. I don\'t know what I\'d do otherwise.'],
    witty: ['Unpromising starts make the best middles.', 'We\'re building up to a promising finish.'],
    gloomy: ['It\'s the one thing that\'s gone right, really.'],
    child: ['And we\'ll be friends FOREVER. We spat on it.'],
  });
  say('village.friend.toldthem', {
    _: ['Told {vFriend}? Oh, no. You don\'t SAY things like that. Do you?', 'Not in so many words. You don\'t, do you, with friends.'],
    ornery: ['Certainly not. {VFriend}\'d never let me hear the end of it.'],
    shy: ['I couldn\'t. I\'d go red as a radish.', 'I... wrote it in a card once. I never sent it.'],
    proud: ['I shouldn\'t need to. {VFriend} knows.'],
    cheerful: ['All the time! Well. Some of the time. Not lately.'],
    dreamy: ['I tell {vFriend} in other ways. With jam, mostly.'],
    witty: ['I tell {vFriend} with insults. It\'s our way.'],
    child: ['No! That\'s soppy. ...Should I?'],
  });
  say('village.friend.deeper', {
    _: ['...I worry about {vFriend}, if I\'m honest. {VFriend} carries everything alone.', 'Sometimes I think {vFriend} is lonelier than {vFriend} lets on. I don\'t know how to help.'],
    cheerful: ['I laugh a lot with {vFriend}, but... I don\'t think {vFriend}\'s laughing inside, lately.'],
    ornery: ['Don\'t repeat this. I think {vFriend}\'s been poorly and won\'t say. Stubborn as me.'],
    shy: ['...What if {vFriend} finds a better friend? Someone louder? I think about that.'],
    dreamy: ['I dreamed {vFriend} went away over the hills and didn\'t look back. I woke up crying. Daft.'],
    gloomy: ['I worry {vFriend}\'ll move to Bree one day. Everyone leaves, in the end.'],
    proud: ['I would never say so to {vFriend}. But I don\'t know what I\'d do without {vFriend}.'],
    child: ['Sometimes {vFriend} plays with other people. And I pretend I don\'t mind. But I do.'],
    rift: ['If the rift opened and {vFriend} had to choose... I don\'t know. I think about the rifts a lot.'],
  });
  say('village.friend.scheme', {
    _: ['All right. We\'re going to paint the old milestone. Gold. At night. Nobody knows.', 'We\'re going to win the pie contest. Together. One pie, two cooks. It\'s never been done.'],
    cheerful: ['A surprise party! For the whole lane! With bunting! Shh!', 'We\'re teaching the innkeeper\'s dog to fetch pints. It\'s going badly.'],
    curious: ['We\'re going to count every star over the party field. We\'ve done four hundred.', 'We\'re finding out where the river starts. With a map. A drawn one.'],
    dreamy: ['We\'re going to row to the island in the mill-pond and have breakfast there. At dawn.'],
    witty: ['We\'re writing a song about the Steward. Nine verses. All of them rude, but in a nice way.'],
    proud: ['We are building the finest scarecrow the valley has ever seen. It will have a waistcoat.'],
    shy: ['...We\'re making a quilt. For the old folk. A square each. Don\'t tell anyone.'],
    child: ['We\'re building a raft! Out of barrel lids! It floats! Mostly!', 'We\'re going to catch a fish as big as a dog. We\'ve got worms.'],
    rift: ['We\'re building a radio. From a teapot. Don\'t laugh, it nearly picked something up.'],
  });
  say('village.friend.watched', {
    _: ['Ha! Watch away. You\'ll never catch us.', 'From under your hat! I\'ll be looking up there now, every time.'],
    ornery: ['Watch all you like. We\'re very boring.'],
    witty: ['Your hat has seen worse, I\'m sure.'],
    child: ['You can\'t see under there! Can you? CAN you?'],
    shy: ['Oh dear. Please don\'t.'],
  });
  say('village.friend.visit', {
    _: ['You\'re right. I will. I\'ll go now, before I think better of it.', 'Today, then. I\'ll take something. You can\'t go empty-handed.'],
    cheerful: ['Ooh, yes! Right after this. I\'ll take the good cookies.'],
    ornery: ['I was going anyway. Don\'t think it was your idea.'],
    shy: ['...All right. If you think {vFriend} won\'t mind.'],
    proud: ['A fine notion. I was about to suggest it myself.'],
    gloomy: ['I\'ll go. If {vFriend}\'s in. {VFriend} won\'t be in. ...I\'ll go.'],
    child: ['I\'m going NOW! Bye! Bye, wizard!'],
    rift: ['On it. Plotting a route. Shortest path, no stairs.'],
  });
  say('village.friend.pining', {
    _: ['Pining! I do not pine. I may have sighed. Once.', 'You never said that! ...Did you say that?'],
    ornery: ['You\'ll be pining for your hat when I throw it in the river.'],
    witty: ['I pine only for seed-cake. Tell {vFriend} that.'],
    shy: ['Oh no. Oh, you didn\'t.'],
    child: ['I\'m NOT pining. What\'s pining?'],
  });
  say('village.friend.message', {
    _: ['Tell {vFriend}... no. Just my regards. The rest I\'ll say myself.', 'Say I\'ve kept the last of the blackberry jam. {VFriend}\'ll understand.'],
    witty: ['Tell {vFriend} the answer is "a turnip". {VFriend}\'ll know the question.'],
    dreamy: ['Tell {vFriend} the heron\'s back on the far bank. Just that.'],
    curious: ['Ask {vFriend} what happened with the bees. I must know.'],
    ornery: ['Tell {vFriend} the ladder. Just say "the ladder". Firmly.'],
  });
  say('village.friend.fallen', {
    _: ['Once. Over a hat. It was a very good hat.', 'Oh, we\'ve had our moments. A whole summer once, not speaking.'],
    ornery: ['Every week. It doesn\'t take.'],
    shy: ['Once. It was the worst month of my life.'],
    proud: ['We had a disagreement. I was right. We don\'t mention it.'],
    witty: ['We fell out over which of us was funnier. Still unresolved.'],
    child: ['Yes! {VFriend} broke my best stick. But I broke {vFriend}\'s first. So.'],
    gloomy: ['Once. I thought that was the end. It nearly was.'],
  });
  say('village.friend.madeup', {
    _: ['{VFriend} turned up with a pie and said nothing. Neither did I. We ate the pie.', 'I left a note under the door. Just "sorry" and a drawing of a hat.'],
    ornery: ['We didn\'t make up. We just forgot to keep quarreling.'],
    dreamy: ['It rained, and we both sheltered under the same tree. Hard to stay cross under a tree.'],
    child: ['We pinky-swore. Then we got cookies.'],
    proud: ['I was gracious. {VFriend} was grateful. That\'s the version I tell.'],
  });

  // =================================================================================
  // Word from a friend: the wizard passes it on
  // =================================================================================
  addThread({
    id: 'village.regards', label: (F) => (F.vRegardsFrom ? `Word from ${F.vRegardsFrom}` : 'Word from a friend'), weight: 2, cool: 1,
    when: (F) => has(F.vRegardsFrom), rel: () => 2,
    open: { warm: 'village.regards.open' },
    beats: {
      start: { line: 'village.regards.start', fx: { run: (T, v) => {
        const o = who(T, 'vRegardsFromId');
        if (!o) return;
        const b = bondFull(o), p = b.promises.find((x) => x.k === 'village.regards:' + v.id && x.state === 'open');
        if (p) p.done = true;
        if (T.F.vRegardsSorry) {
          if (v.sent && v.sent[o.id]) v.sent[o.id] = v.sent[o.id].filter((s) => SENT[s.tag][1] > 0);
          v.bond(o, 0.07); addSentiment(v, o, 'touched', 'saying sorry, by the wizard');
          v.remember(`${o.first} sent word by the wizard to say sorry.`, 1);
        } else {
          v.bond(o, 0.04); addSentiment(v, o, 'fond', 'sending word by the wizard'); feel(v, 'cheered', o.first);
          v.remember(`${o.first} sent me their regards, by the wizard.`, 1);
        }
      } }, go: [
        { ap: 'advise', say: 'Go and see {vRegardsFrom}. Put it behind you both.', to: 'mend', need: { if: { vRegardsSorry: true } } },
        { ap: 'ask', say: 'Anything you\'d like me to carry back?', to: 'back' },
        { ap: 'listen', say: '*You wait. They look as if there\'s more.*', label: 'Wait', to: 'more' },
        { ap: 'jest', say: 'I\'m a wizard, not a mail carrier. But for you, I made an exception.', to: 'postie', need: { if: { vRegardsSorry: false } } },
      ] },
      back: { line: 'village.regards.back', fx: { run: (T, v) => promiseRegards(T, v, who(T, 'vRegardsFromId')) }, go: [
        { ap: 'warm', say: 'I\'ll see it gets there.', to: 'end' },
        { ap: 'jest', say: 'At this rate I\'ll need a satchel.', to: 'satchel' },
      ] },
      more: { line: 'village.regards.more', fx: { trust: 0.02 }, go: [
        { ap: 'comfort', say: 'Then tell {vRegardsFrom} yourself. It\'s not far.', to: 'go' },
        { ap: 'advise', say: 'Go and see {vRegardsFrom}. Put it behind you both.', to: 'mend', need: { if: { vRegardsSorry: true } } },
        { ap: 'warm', say: 'I think {vRegardsFrom} knows.', to: 'end' },
      ] },
      postie: { line: 'village.regards.postie', go: [
        { ap: 'ask', say: 'Anything to carry back, while I\'m being useful?', to: 'back' },
        { ap: 'warm', say: 'Any time.', to: 'end' },
      ] },
      satchel: { line: 'village.regards.satchel', end: true },
      go: { line: 'village.regards.go', fx: { run: (T, v) => visit(T, v, 'vRegardsFromId', 'kin') }, end: true },
      mend: { line: 'village.regards.mend', fx: { respect: 0.03, run: (T, v) => visit(T, v, 'vRegardsFromId', 'mend') }, end: true },
    },
    end: { fond: 0.03, trust: 0.02 },
  });
  lines('village.regards.open', [
    { text: ['I bring regards from {vRegardsFrom}, {name}. Particular regards.', '{VRegardsFrom} asked me to say hello to you, {name}. So: hello, from {vRegardsFrom}.', 'A word from {vRegardsFrom}, {name}. Warmly sent.'] },
    { if: { vRegardsSorry: true }, pri: 2, text: ['I\'ve a word from {vRegardsFrom}, {name}. {VRegardsFrom} is sorry. Truly sorry.', '{VRegardsFrom} asked me to tell you something, {name}. That {vRegardsFrom} is sorry, and misses you.', 'A message, {name}, from {vRegardsFrom}. It\'s an apology. A heartfelt one.'] },
  ]);
  const SORRY = { if: { vRegardsSorry: true }, pri: 2 };
  lines('village.regards.start', [
    { ...SORRY, text: ['Sorry? {VRegardsFrom} said that? ...Well. Well, I never.', '...Oh. I wasn\'t expecting that. I don\'t know what to say.', 'Did {vRegardsFrom}? Truly? Oh, that takes a weight off.'] },
    { ...SORRY, if: { vRegardsSorry: true, temper: 'ornery' }, text: ['Sorry, is it. Hmph. ...About time. ...Thank you for bringing it.', 'Took {vRegardsFrom} long enough. ...I\'m glad, mind. Don\'t tell {vRegardsFrom} I\'m glad.'] },
    { ...SORRY, if: { vRegardsSorry: true, temper: 'proud' }, text: ['An apology. Well. I accept it. Graciously. ...I was a little at fault too.'] },
    { ...SORRY, if: { vRegardsSorry: true, temper: 'shy' }, text: ['...{VRegardsFrom} is sorry? I thought {vRegardsFrom} hated me. Oh.'] },
    { ...SORRY, if: { vRegardsSorry: true, temper: 'gloomy' }, text: ['Sorry? For me? ...I\'d given up. I\'d quite given up.'] },
    { ...SORRY, if: { vRegardsSorry: true, temper: 'cheerful' }, text: ['Oh, the daft thing! Of course I forgive {vRegardsFrom}! I was never really cross. I was a bit cross.'] },
    { ...SORRY, if: { vRegardsSorry: true, temper: 'witty' }, text: ['An apology by wizard. That\'s the most dramatic sorry this village has ever seen.'] },
    { ...SORRY, if: { vRegardsSorry: true, temper: 'dreamy' }, text: ['Like the first rain after a dry spell. That\'s what that is.'] },
    { ...SORRY, if: { vRegardsSorry: true, temper: 'curious' }, text: ['Sorry for which part, exactly? No. Don\'t answer. I\'ll take all of it.'] },
    { ...SORRY, if: { vRegardsSorry: true, stage: 'child' }, text: ['{VRegardsFrom} said SORRY? Then we can play again! Can we?'] },
    { ...SORRY, if: { vRegardsSorry: true, rift: true }, text: ['Apology received. Connection... restored. That\'s actually really nice.'] },
  ]);
  lines('village.regards.mend', [
    { text: ['Put it behind us. Yes. I\'ll go round. With a pie, so we\'ve something to do with our hands.', 'All right. I\'ll go. We\'ll both say sorry and then argue about who said it first.'] },
    { if: { temper: 'ornery' }, text: ['Fine. I\'ll go. I\'ll be gracious. I can be gracious. Watch me.'] },
    { if: { temper: 'shy' }, text: ['...I\'ll go. I\'ll knock. If I lose my nerve, I\'ll leave a note.'] },
    { if: { temper: 'proud' }, text: ['I shall call on {vRegardsFrom} this afternoon. It\'s the proper thing.'] },
    { if: { stage: 'child' }, text: ['I\'m going to find {vRegardsFrom} RIGHT NOW!'] },
  ]);
  lines('village.regards.more', [{ ...SORRY, text: ['I said things too. Worse things. I hope {vRegardsFrom} knows I didn\'t mean them.', 'We\'ve been friends too long for this. I\'m glad. I\'m so glad.'] }]);
  lines('village.regards.back', [{ ...SORRY, text: ['Tell {vRegardsFrom}... I\'m sorry too. And the kettle\'s on.', 'Say it\'s forgotten. No, say it\'s forgiven. Forgotten takes longer.'] }]);
  say('village.regards.start', {
    _: ['From {vRegardsFrom}? Oh! How lovely. How is {vRegardsFrom}?', 'Did {vRegardsFrom} really? Well, that\'s brightened my morning.', '{VRegardsFrom}! I was only thinking of {vRegardsFrom} yesterday.'],
    cheerful: ['Oh, that\'s wonderful! Regards! I love a regard!', 'Ha! {VRegardsFrom}, the old dear. Sending a wizard, no less!'],
    ornery: ['Regards, is it. From {vRegardsFrom}. Hmph. ...That\'s nice, actually.', '{VRegardsFrom} could have come round. ...Still. It\'s nice.'],
    shy: ['...From {vRegardsFrom}? For me? Oh. Thank you for bringing it.', 'Oh! I didn\'t think {vRegardsFrom} thought about me. Oh.'],
    curious: ['Really? What were {vRegardsFrom}\'s exact words? And where were you?', 'How did {vRegardsFrom} seem? Did {vRegardsFrom} say anything else?'],
    dreamy: ['Like finding a flower pressed in a book. That\'s what this is.', 'A word on the wind. Well, on a wizard. Same thing.'],
    witty: ['A wizard-borne greeting. I feel like royalty. Do I bow?', 'Regards by wizard. Very grand. Next time send it by eagle.'],
    proud: ['Naturally {vRegardsFrom} sends regards. We go back a long way.', 'How very proper of {vRegardsFrom}. I shall return them in kind.'],
    gloomy: ['{VRegardsFrom} remembered me? ...Well. That\'s something.', 'Regards. For me. You\'re not mixing me up with someone?'],
    child: ['{VRegardsFrom} said HELLO to me? Through a WIZARD?', 'A message! Is it secret? Is it a code? What does it mean?'],
    rift: ['Message routed through the wizard. Received and decoded. That\'s sweet.', 'A ping from {vRegardsFrom}? Analog networking. I love this valley.'],
  });
  say('village.regards.back', {
    _: ['Tell {vRegardsFrom} the same back, twice over. And that I\'ll be round for tea.', 'Say thank you. And say the plums are nearly ready, if {vRegardsFrom} wants some.'],
    cheerful: ['Tell {vRegardsFrom} I said hooray! Then hello. Then hooray again.'],
    ornery: ['Tell {vRegardsFrom} I got the message. And that\'s quite enough sentiment for one week.'],
    shy: ['Could you... say thank you? And that it meant a lot. But not in a strange way.'],
    curious: ['Ask {vRegardsFrom} what made {vRegardsFrom} think of me. I\'m curious.'],
    dreamy: ['Tell {vRegardsFrom} I\'ll wave from the hill at sunset. {VRegardsFrom}\'ll know.'],
    witty: ['Tell {vRegardsFrom} I return the regards with interest. Compound.'],
    proud: ['My compliments to {vRegardsFrom}. Properly, mind.'],
    gloomy: ['Tell {vRegardsFrom}... thank you. That\'s all. That\'s plenty.'],
    child: ['Tell {vRegardsFrom}: HELLO BACK. And a frog. No, just hello.'],
    rift: ['Send an ack back. That means \'got it, love you, bye\'. Roughly.'],
  });
  say('village.regards.more', {
    _: ['...We had words, {vRegardsFrom} and I, a while back. I thought it was still sore.', 'I\'ve not been round in weeks. I\'ve been meaning to. You know how it is.'],
    shy: ['...I never know if folk like me or just put up with me. This helps.'],
    gloomy: ['I thought {vRegardsFrom} had given up on me. I\'d have given up on me.'],
    proud: ['I\'ll admit I was waiting for {vRegardsFrom} to make the first move.'],
    dreamy: ['It\'s funny how much a few words can weigh. These weigh a lot.'],
    elder: ['At my age, wizard, you start to wonder who\'ll still ask after you. Thank you.'],
  });
  say('village.regards.postie', {
    _: ['Ha! Don\'t let the mail carrier hear. You\'ll be out of a job, and so will {they}.', 'An exception! I feel very special.'],
    witty: ['The mail carrier charges a penny. You\'re cheaper. Slower, mind.'],
    ornery: ['You\'d make a poor mail carrier. Too much chat.'],
    child: ['You could be the mail carrier! You\'ve got a hat for it!'],
  });
  say('village.regards.satchel', {
    _: ['Ha! A wizard with a satchel. I\'d pay to see that.', 'Get a pigeon. Much more wizardly.'],
    witty: ['A satchel and a whistle. You\'d look very official.'],
    child: ['You could have a bag with stars on!'],
  });
  say('village.regards.go', {
    _: ['You\'re right. It\'s not far. I\'ll go.', 'I will. I\'ll go this afternoon. With a cake.'],
    shy: ['...All right. I\'ll knock. Quietly.'],
    ornery: ['Fine. Fine! I\'m going. Stop looking at me like that.'],
    child: ['I\'m going! Bye!'],
  });

  // =================================================================================
  // Bad blood: someone they're cross with
  // =================================================================================
  addThread({
    id: 'village.foe', label: (F) => (F.vFoe ? `Is all well with ${F.vFoe}?` : 'Bad blood'), reveals: 'village.foe', weight: 1.1, cool: 3,
    when: (F) => has(F.vFoe), rel: (F) => (F.vFoeTag === 'hurt' ? 1.6 : 1.2),
    open: { ask: 'village.foe.open' },
    beats: {
      start: { line: 'village.foe.start', go: [
        { ap: 'listen', say: '*You wait, and fill your pipe.*', label: 'Wait, and fill your pipe', to: 'side' },
        { ap: 'ask', say: 'What happened between you?', to: 'side' },
        { ap: 'jest', say: 'Shall I turn {vFoe} into a newt? A small one. Temporary.', to: 'newt' },
      ] },
      side: { line: 'village.foe.side', fx: { open: 1, learn: ['village.foe', '{Name} has fallen out with {vFoe}.'] }, go: [
        { ap: 'ask', say: 'And what would {vFoe} say, if I asked?', to: 'other', need: { open: 1 }, soft: true },
        { ap: 'comfort', say: 'That sounds hard.', to: 'hurt' },
        { ap: 'advise', say: 'Life\'s too short. Go and make it up.', to: [{ need: { open: 3 }, to: 'mend' }, 'notyet'] },
      ] },
      newt: { line: 'village.foe.newt', go: [
        { ap: 'warm', say: 'Seriously, though. What happened?', to: 'side' },
        { ap: 'jest', say: 'A newt with {vFoe}\'s eyebrows. Picture it.', to: 'eyebrows' },
      ] },
      eyebrows: { line: 'village.foe.eyebrows', fx: { joke: { k: 'village.newt', t: 'The wizard offered to turn {vFoe} into a newt. With eyebrows.' } }, go: [
        { ap: 'ask', say: 'Now. What did {vFoe} do?', to: 'side' },
        { ap: 'warm', say: 'There. You\'re smiling.', to: 'end' },
      ] },
      other: { line: 'village.foe.other', fx: { respect: 0.02 }, go: [
        { ap: 'advise', say: 'Then you\'re halfway to mending it already.', to: 'mend' },
        { ap: 'warm', say: 'Being a little bit wrong is very forgivable.', to: 'softer' },
      ] },
      hurt: { line: 'village.foe.hurt', fx: { trust: 0.03 }, go: [
        { ap: 'advise', say: 'Tell {vFoe} that. Just that, and nothing else.', to: 'mend', need: { open: 2 }, soft: true },
        { ap: 'share', say: 'I fell out with a friend once. For a hundred years.', to: 'wizfoe' },
        { ap: 'comfort', say: 'It won\'t always smart like this.', to: 'end' },
      ] },
      notyet: { line: 'village.foe.notyet', fx: { sore: { days: 1 } }, end: true },
      softer: { line: 'village.foe.softer', go: [
        { ap: 'advise', say: 'Then go and say so. It\'ll cost less than you think.', to: 'mend' },
        { ap: 'warm', say: 'Sleep on it. It\'ll keep.', to: 'end' },
      ] },
      wizfoe: { line: 'village.foe.wizfoe', go: [
        { ap: 'tale', say: 'We did. Over a very small cup of tea, on a very large mountain.', to: 'tea' },
        { ap: 'share', say: 'Not yet. Perhaps you\'ll beat me to it.', to: 'beat' },
      ] },
      tea: { line: 'village.foe.tea', go: [
        { ap: 'advise', say: 'So. A small cup of tea with {vFoe}?', to: 'mend' },
        { ap: 'warm', say: 'Think on it.', to: 'end' },
      ] },
      beat: { line: 'village.foe.beat', fx: { fond: 0.03 }, go: [
        { ap: 'advise', say: 'Then we\'ll race. You go first.', to: 'mend' },
        { ap: 'warm', say: 'Whenever you\'re ready.', to: 'end' },
      ] },
      mend: { line: 'village.foe.mend', fx: { respect: 0.03, run: (T, v) => visit(T, v, 'vFoeId', 'mend') }, end: true },
    },
    end: { trust: 0.02 },
  });
  lines('village.foe.open', [
    { text: ['Is all well between you and {vFoe}, {name}? I\'ve heard a whisper.', 'You and {vFoe}, {name}. Not speaking, I hear?', 'I passed {vFoe} just now, {name}, and said your name. Such a face.'] },
    { if: { stage: 'child' }, text: ['Have you and {vFoe} fallen out, {name}?'] },
  ]);
  say('village.foe.start', {
    _: ['{VFoe}? I don\'t want to talk about {vFoe}.', 'Who told you? ...It\'s nothing. It\'s {vFoe}. It\'s always something with {vFoe}.', 'Oh, don\'t. Don\'t say that name. I\'ve only just calmed down.'],
    cheerful: ['Oh, {vFoe} and me? Just a silly thing. A silly, silly, really annoying thing.', 'Ha! You\'ve heard, then. I\'m trying to laugh about it. Trying.'],
    ornery: ['{VFoe}! Don\'t get me started on {vFoe}. You\'ve got me started.', 'If {vFoe} wants to say sorry, {vFoe} knows where I live. Same place as always.'],
    shy: ['...I don\'t want to make a fuss. It\'s just... {vFoe} hurt my feelings.', 'Oh. You know about that. I hoped nobody did.'],
    curious: ['Did {vFoe} say something about me? What did {vFoe} say? Never mind. Tell me.', 'Who\'s been talking? I\'d like to know how far it\'s gone.'],
    dreamy: ['It\'s like a cloud over the lane. You walk past {vFoe}\'s door and it rains a bit.', '{VFoe}... we used to be easy with each other. I don\'t know where it went.'],
    witty: ['{VFoe} and I are conducting a silent war. I\'m winning. Very quietly.', 'Not speaking? We\'re speaking. Just in sniffs.'],
    proud: ['I have nothing to say about {vFoe}. {VFoe} knows what {vFoe} did.', 'I\'ve conducted myself perfectly. I can\'t speak for {vFoe}.'],
    gloomy: ['{VFoe} doesn\'t like me. Nobody does, much. It\'s not news.', 'It\'s gone sour, that\'s all. Things do.'],
    child: ['{VFoe} is NOT my friend any more. {VFoe} knows why.', 'I\'m not talking to {vFoe}. Not ever. Until Highday, maybe.'],
    elder: ['At my age you\'d think we\'d know better, {vFoe} and I. We don\'t.', 'Sixty years I\'ve known {vFoe}. Sixty years of this, on and off.'],
    rift: ['{VFoe}? Blocked. Muted. In my head, anyway. You can\'t really mute people here.', 'Bad signal between me and {vFoe}. Really bad. Total static.'],
  }, [
    { if: { vFoeTag: 'jealous' }, text: ['{VFoe}? Oh, {vFoe} has everything, doesn\'t {vFoe}. Good luck to {vFoe}. Hmph.'] },
    { if: { vFoeTag: 'prickly' }, text: ['{VFoe}\'s gloating. You can hear it from here. Listen. There. Gloating.'] },
  ]);
  say('village.foe.side', {
    _: ['It was {vFoeWhy}, if you must know. I haven\'t forgotten.', 'Words were said. Unkind words. I\'d say them again, mind.', '{VFoe} said I\'d let the side down. In front of everyone. At the well.'],
    cheerful: ['I said something in fun and {vFoe} took it badly, and then {vFoe} said something NOT in fun.', 'It started over a joke. It\'s not funny now.'],
    ornery: ['{VFoe} put a cart across my gate. Twice. On purpose, I\'ll warrant.', 'I told {vFoe} the truth. Folk don\'t like the truth. That\'s all it is.'],
    shy: ['{VFoe} laughed at me. In the Badger. Everyone heard. I\'ve not been back.', 'I asked {vFoe} for help and {vFoe} said I was always asking. I won\'t ask again.'],
    curious: ['I asked {vFoe} one question. One! About {vFoe}\'s garden. Apparently that\'s prying.', 'I wanted to know why {vFoe} digs at midnight. Is that so wrong?'],
    dreamy: ['I don\'t even know, really. A look. A word. And then it just grew, like ivy.', 'I forgot something {vFoe} told me. It mattered to {vFoe}. I see that now, maybe.'],
    witty: ['I made one small joke about {vFoe}\'s hat. One. It was a very good joke. That\'s the trouble.', '{VFoe} has no sense of humor. I tested it thoroughly.'],
    proud: ['{VFoe} questioned my word. In public. That isn\'t done.', 'I was not thanked. I did a great deal and I was not thanked.'],
    gloomy: ['{VFoe} said I spoil every party. Maybe I do.', 'I was in the way. I\'m always in the way, it seems.'],
    child: ['{VFoe} said my den was junk. It is NOT junk. It has a door.', '{VFoe} wouldn\'t let me play. And then {vFoe} told on me.'],
    rift: ['{VFoe} called my stuff \'rift-junk\'. My stuff saved {vFoe}\'s cellar from flooding.', '{VFoe} said I\'m not from here. Which is true. It was how {vFoe} said it.'],
  }, [
    { if: { vFoeWhy: (w) => has(w) }, pri: 1, text: ['It was {vFoeWhy}. I\'m not one to hold a grudge. But I am holding it.', '{VFoeWhy}. You\'d think I\'d be over it. I\'m not.'] },
    { if: { vFoeWhy: 'that squabble' }, pri: 2, text: ['That squabble. Over nothing, really. That\'s what makes it worse.', 'We had words. {VFoe} had more words than me, mind.'] },
    { if: { vFoeTag: 'prickly' }, when: (F) => F.vFoe === F.rival, pri: 2, text: ['{VFoe} beat me. Fair and square, they all say. Fair and SQUARE.'] },
  ]);
  say('village.foe.newt', {
    _: ['Ha! ...Don\'t tempt me. Can you really?', 'A newt! Ha! Oh, that\'s wicked. ...How small?'],
    cheerful: ['Ha! Oh, that would serve {vFoe} right! A little newt! Ha!'],
    ornery: ['Don\'t make me laugh, I\'m trying to be cross.', 'Hmph. ...A newt. Hmph. ...Ha.'],
    shy: ['Oh! No, no. Don\'t. ...Could you, though?'],
    witty: ['A newt would be an improvement. Better company, certainly.'],
    proud: ['That would be beneath us both. ...I\'d like to see it, though.'],
    gloomy: ['{VFoe} would make a very happy newt. That\'s the annoying thing.'],
    child: ['YES! Do it! Do it now! Can I watch?'],
    rift: ['Turn {vFoe} into a newt. Low-cost, high-impact. I like it.'],
  });
  say('village.foe.eyebrows', {
    _: ['Ha! Stop it. The eyebrows! Oh dear.', 'Oh, the eyebrows! You\'re wicked, wizard.'],
    ornery: ['...Fine. That one\'s funny. Don\'t look so pleased.'],
    witty: ['A newt with eyebrows. I\'m going to be thinking of that at the worst times.'],
    child: ['HAHAHA. Newt eyebrows! I\'m telling everyone!'],
    shy: ['*laughs behind a hand*'],
  });
  say('village.foe.other', {
    _: ['...{VFoe}\'d say I started it. Which I might have. A little.', '{VFoe}\'d say I\'d been short with {vFoe} all month. Maybe I had.'],
    ornery: ['{VFoe}\'d say I\'m a cantankerous old so-and-so. And {vFoe}\'d have a point.'],
    shy: ['...That I never say what I mean. That\'s true, I suppose.'],
    proud: ['{VFoe} would say I was proud. I am. Is that a crime?'],
    gloomy: ['That I\'m hard work. Everybody says that.'],
    witty: ['{VFoe}\'d say I\'m impossible. Which is a compliment, if you think about it.'],
    child: ['That I pushed. But only after {vFoe} pushed! Probably.'],
    curious: ['That I ask too many questions. Which I do. Is that bad?'],
  });
  say('village.foe.hurt', {
    _: ['It is. It\'s hard. We were friends, once. Sort of.', 'It smarts, you know. More than I let on.'],
    cheerful: ['I keep smiling about it. But at night it creeps in.'],
    ornery: ['Hard? Hmph. ...Yes. Hard. Don\'t make a fuss.'],
    shy: ['...Thank you. Nobody\'s said that. They all say "don\'t mind {vFoe}".'],
    proud: ['I\'m not hurt. I\'m disappointed. It\'s different. ...It\'s the same.'],
    gloomy: ['It\'s just one more thing. They pile up.'],
    dreamy: ['It\'s like a splinter. You forget it, and then you lean on it.'],
    child: ['*sniffs* It IS hard. I wanted to be friends.'],
    rift: ['Yeah. It\'s like a dropped call that keeps ringing.'],
  });
  say('village.foe.notyet', {
    _: ['Make it up? Me? {VFoe} should come to me.', 'Not yet. Not today. Ask me next week.', 'Easy for you to say, wizard. You don\'t live next to {vFoe}.'],
    ornery: ['Make it up! I\'ll make up my mind, thank you.', 'Hmph. Go and be wise at somebody else.'],
    proud: ['I will not go cap in hand to anybody.'],
    shy: ['I couldn\'t. I wouldn\'t know what to say.'],
    child: ['NO. Not till {vFoe} says sorry first.'],
  });
  say('village.foe.softer', {
    _: ['...Forgivable. Yes. I suppose it is.', 'Hm. Maybe I\'ve been making a mountain out of a molehill.'],
    ornery: ['Hmph. Don\'t be reasonable at me.'],
    proud: ['Forgivable. I\'ll consider it. Graciously.'],
    shy: ['...I\'d like to be forgiven. If I\'m honest.'],
  });
  say('village.foe.wizfoe', {
    _: ['A hundred years! Did you make it up?', 'A hundred years? Over what?', 'You? Fall out? I can\'t picture it.'],
    curious: ['A hundred years! Who was it? Another wizard? What did they do?'],
    witty: ['A hundred years. That makes my month look very amateur.'],
    child: ['A HUNDRED years! Were you cross the whole time?'],
    gloomy: ['A hundred years. And you\'re still standing. That\'s something.'],
  });
  say('village.foe.tea', {
    _: ['A small cup of tea. On a mountain. That\'s all it took?', 'Ha. Tea. It\'s always tea, in the end.'],
    dreamy: ['I like that. A small cup on a big mountain. I\'ll remember that.'],
    ornery: ['Tea. Well. I do make good tea.'],
  });
  say('village.foe.beat', {
    _: ['Ha! A race to say sorry. All right, wizard.', 'You\'re a strange one. A good strange.'],
    witty: ['A race! Loser buys the cake. Winner has to say sorry. Hmm.'],
    child: ['A race! I\'ll win! I\'m fast!'],
  });
  say('village.foe.mend', {
    _: ['...All right. I\'ll go. After my tea. Don\'t look so pleased.', 'Fine. I\'ll go and see {vFoe}. If it goes badly, it\'s your fault.'],
    cheerful: ['You\'re right! Life\'s too short. I\'ll take {vFoe} a cake. A forgiving sort of cake.'],
    ornery: ['Ha. You\'re impossible. All right. I\'m going. Slowly.'],
    shy: ['...I\'ll try. I\'ll go and knock. If {vFoe} answers.'],
    proud: ['I shall go. Not because you said so. Because it\'s right.'],
    gloomy: ['It won\'t work. ...I\'ll go anyway.'],
    child: ['Okay. I\'ll say sorry. But only a little sorry.'],
    rift: ['Fine. I\'ll reconnect. Manually. On foot.'],
  });

  // =================================================================================
  // The old rivalry
  // =================================================================================
  addThread({
    id: 'village.rival', label: (F) => (F.rival ? `How goes it with ${F.rival}?` : 'The old rivalry'), weight: 1, cool: 4,
    when: (F) => has(F.rival) && has(F.vRivalPrize), rel: (F) => (F.vRivalLead === 'behind' ? 1.4 : 1.1),
    open: { jest: 'village.rival.open' },
    beats: {
      start: { line: 'village.rival.start', go: [
        { ap: 'ask', say: 'Who\'s ahead, these days?', to: 'score' },
        { ap: 'jest', say: 'I hear {rival} is practicing. Day and night.', to: 'stoke' },
        { ap: 'ask', say: 'What started it all?', to: 'origin' },
      ] },
      score: { line: 'village.rival.score', go: [
        { ap: 'warm', say: 'Next time is yours, I\'m sure of it.', to: 'nextyear' },
        { ap: 'ask', say: 'And is {rival} any good, truly?', to: 'admit', need: { open: 1 }, soft: true },
        { ap: 'advise', say: 'Perhaps the secret is to stop counting.', to: 'counting' },
      ] },
      stoke: { line: 'village.rival.stoke', go: [
        { ap: 'jest', say: 'By lamplight, I heard. Muttering.', to: 'fired' },
        { ap: 'warm', say: 'I\'m teasing. You\'ll do splendidly.', to: 'score' },
      ] },
      origin: { line: 'village.rival.origin', go: [
        { ap: 'ask', say: 'And is {rival} any good, truly?', to: 'admit', need: { open: 1 }, soft: true },
        { ap: 'jest', say: 'That\'s a very long grudge for a {vRivalThing}.', to: 'grudge' },
      ] },
      admit: { line: 'village.rival.admit', fx: { confide: { k: 'village.rival.admire', t: '{Name} thinks {rival} is good. Never to be said aloud.', secret: true } }, go: [
        { ap: 'warm', say: 'Your secret\'s safe with me.', to: 'safe' },
        { ap: 'advise', say: 'Tell {rival}. You might end up friends.', to: 'shake', need: { open: 2 }, soft: true },
      ] },
      counting: { line: 'village.rival.counting', go: [
        { ap: 'jest', say: 'I\'ve lost count of my birthdays. Very freeing.', to: 'end' },
        { ap: 'advise', say: 'A good rival makes you better. That\'s the prize.', to: 'admit' },
      ] },
      fired: { line: 'village.rival.fired', fx: { joke: { k: 'village.lamplight', t: '{Rival}, practicing by lamplight. Muttering.' }, drive: { bored: -0.1 } }, end: true },
      grudge: { line: 'village.rival.grudge', go: [
        { ap: 'ask', say: 'And is {rival} any good, truly?', to: 'admit', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'Long may it last. Life needs a little salt.', to: 'end' },
      ] },
      nextyear: { line: 'village.rival.nextyear', end: true },
      safe: { line: 'village.rival.safe', fx: { trust: 0.04, promise: { k: 'secret.village.rival', t: 'You promised never to tell {rival} what {name} really thinks of {rival}\'s work', days: 30 } }, end: true },
      shake: { line: 'village.rival.shake', fx: { respect: 0.03, run: (T, v) => { const r = rivalOf(v); if (r) { v.bond(r, 0.04); addSentiment(r, v, 'admiring', 'a kind word from a rival', 6); } } }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('village.rival.open', [
    { text: ['And how goes the great war with {rival}, {name}?', 'I hear {rival} has been boasting again, {name}.', 'Still at it with {rival}, {name}? Who\'s ahead?'] },
  ]);
  say('village.rival.start', {
    _: ['{Rival}! Don\'t mention {rival}. We\'re in the thick of it.', '{Rival} and I have an understanding. The understanding is: I win.', 'Ah, {rival}. Same as ever. Too clever by half.'],
    cheerful: ['Oh, it\'s great fun! {Rival} and I have been at it for years. It\'s the best part of the fair.', 'Ha! {Rival}! We had a lovely shouting match on Trewsday.'],
    ornery: ['{Rival} is a menace to the valley and a disgrace to {vRivalPrize}.', 'Don\'t say that name out loud. My {vRivalThing}s can hear you.'],
    shy: ['...{Rival}\'s very good. I try. I just want to do well once.', 'Oh. Um. It\'s not really a war. {Rival} just... always wins.'],
    curious: ['I\'ve been studying {rival}\'s methods. From a distance. With a spyglass.', 'Do you know, {rival} uses something secret? I\'ve narrowed it to three things.'],
    dreamy: ['Sometimes I think I only make my {vRivalThing}s so good because {rival} is out there.', 'It\'s like a dance, really. A long, cross dance.'],
    witty: ['The war continues. Casualties: two pies and my dignity.', '{Rival}? A worthy foe. Worthier than {rival} deserves.'],
    proud: ['{Rival} is a competent amateur. I am something else entirely.', 'There is no contest. There is me, and there is {rival}, trying.'],
    gloomy: ['{Rival}\'s always better. Every year. I don\'t know why I bother.', 'I\'ll lose again. I always lose. I\'ll still enter.'],
    elder: ['Forty years of it. Neither of us will give up. Neither of us will die first, either, out of spite.'],
    rift: ['{Rival}\'s my nemesis. Back home we\'d have settled it in a sim. Here it\'s {vRivalThing}s.', 'Rivalry with {rival}: ongoing. Leaderboard: disputed.'],
  }, [
    { if: { vRivalLead: 'ahead' }, text: ['{Rival}? I\'m ahead, you know. Not that I\'m counting. I am counting.', 'I\'ve the lead over {rival} this year and I don\'t mean to lose it.'] },
    { if: { vRivalLead: 'behind' }, text: ['{Rival} beat me last time. For {vRivalPrize}. I haven\'t slept properly since.', 'Behind, at the moment. Temporarily. Very temporarily.'] },
  ]);
  say('village.rival.score', {
    _: ['It\'s close. It\'s always close. That\'s what makes it unbearable.', 'Depends who you ask. Ask me.'],
    cheerful: ['Who cares! It\'s the fun of it! ...Me. I care. I\'m behind.'],
    ornery: ['I\'m ahead, whatever {rival} says. The judges were blind.'],
    shy: ['{Rival}. It\'s always {rival}. I\'m used to it.'],
    curious: ['By my reckoning, counting the disputed pumpkin, it\'s even. Without it, it\'s complicated.'],
    witty: ['I am ahead in all the categories that matter. Such as being me.'],
    proud: ['I am, of course. Anyone could see it. Except the judges.'],
    gloomy: ['Not me. Never me.'],
    rift: ['Score\'s glitched. Last fair was a tie, so I\'m calling it a draw. {Rival} isn\'t.'],
  }, [
    { if: { vRivalLead: 'ahead' }, pri: 1, text: ['Me! I won {vRivalPrize} last time. {Rival} went home without a word. Lovely.', 'Me, as it happens. By a nose. A long, well-earned nose.'] },
    { if: { vRivalLead: 'behind' }, pri: 1, text: ['{Rival}, for now. {Rival} beat me for {vRivalPrize}. There\'s talk of foul play. By me.', '{Rival}\'s ahead. I can hear {rival} being ahead from here.'] },
    { if: { vRivalLead: 'level' }, pri: 1, text: ['Level. Dead level. It\'s agony.', 'All square. Which means next time is everything.'] },
  ]);
  say('village.rival.stoke', {
    _: ['Practicing! I knew it. Day AND night?', 'Is {rival}? Is {rival} really? Right.', 'Then I\'ll practice more. I\'ll practice in my sleep.'],
    cheerful: ['Ha! Good! I like it when {rival} tries hard. Makes it worth winning.'],
    ornery: ['Day and night, is it? Well, I\'ll be at it day and night and teatime.'],
    shy: ['Oh no. Oh, I knew {rival} would.'],
    curious: ['What exactly is {rival} practicing? Did you see? Describe it.'],
    witty: ['Practicing? {Rival}\'ll need it. And a miracle. And my secret.'],
    proud: ['Let {rival} practice. Talent can\'t be practiced. I have it.'],
    gloomy: ['Of course {rival} is. I\'ll come second again.'],
    child: ['Practicing what? Can I watch?'],
  });
  say('village.rival.origin', {
    _: ['Years ago. A {vRivalThing} contest. {Rival} said mine was a fluke. A FLUKE.', 'Who remembers? We both say the other started it. That\'s how you know it\'s a good one.'],
    cheerful: ['I don\'t remember! We were both very young and very loud.'],
    ornery: ['{Rival} looked at my {vRivalThing} and sniffed. Once. That\'s all it takes.'],
    shy: ['I entered something for the first time and {rival} won. And then again. I just kept trying.'],
    curious: ['I\'ve been trying to work that out. I think it was the year of the hailstorm.'],
    dreamy: ['It was the summer the river froze in a single night. Or was that another year? It feels like always.'],
    witty: ['A misunderstanding about the word "best". {Rival} thought it meant {rival}.'],
    proud: ['{Rival} challenged me. In public. One doesn\'t refuse a challenge.'],
    gloomy: ['I lost. And then I kept losing. And here we are.'],
    elder: ['Our grandparents started it. We\'re just keeping it going. Out of respect.'],
    rift: ['Day one, {rival} saw my gear and said \'hmph\'. I took that as a challenge.'],
  });
  say('village.rival.admit', {
    _: ['...Good? {Rival}\'s brilliant. Don\'t you dare tell {rival} I said so.', 'Fine. {Rival}\'s the best in the valley, after me. Possibly before me. Never repeat that.'],
    cheerful: ['Oh, wonderful! The best! That\'s why it\'s such fun to beat {rival}!'],
    ornery: ['Good? ...Hmph. Yes. Very. It\'s infuriating.', 'If you ever tell {rival}, I\'ll know, and I\'ll put a toad in your hat.'],
    shy: ['...Much better than me. I learn from watching. I never said that.'],
    curious: ['Good. Very good. I\'ve copied three of {rival}\'s tricks. Secretly.'],
    dreamy: ['{Rival}\'s {vRivalThing}s are like poems. Mine are like... sentences.'],
    witty: ['Good is a strong word. Excellent is a stronger one. I\'ll say good.'],
    proud: ['...{Rival} is the only one in this valley worth beating. There. That\'s high praise from me.'],
    gloomy: ['Better than me. I knew that before you asked.'],
    rift: ['Honestly? {Rival}\'s output is top-tier. I\'m just running on spite and solder.'],
  });
  say('village.rival.counting', {
    _: ['Stop counting! What would be the point, then?', 'Not count? You might as well tell the river to stop running.'],
    ornery: ['Typical wizard advice. Very airy. Very unhelpful.'],
    curious: ['Hm. Would I enjoy it more? I suppose I might.'],
    dreamy: ['Stop counting. Just... make them. That\'s rather lovely.'],
    proud: ['Easy to say when you\'ve never lost to {rival}.'],
    witty: ['If I stop counting, {rival} wins by default. That\'s how counting works.'],
  });
  say('village.rival.fired', {
    _: ['Muttering! Right. That\'s it. I\'m going to practice till my hands drop off.', 'By lamplight! The sneak. Well, I\'ve got a lamp too.'],
    cheerful: ['Ha! I love it! This year\'s going to be a cracker!'],
    ornery: ['Muttering, is it? I\'ll give {rival} something to mutter about.'],
    witty: ['Two can mutter. I\'m an excellent mutterer.'],
    shy: ['Oh dear. I\'d better start now.'],
  });
  say('village.rival.grudge', {
    _: ['A grudge? It\'s not a grudge. It\'s a tradition.', 'It\'s not about the {vRivalThing}. It\'s about principle. And the {vRivalThing}.'],
    ornery: ['The length of a grudge is a measure of its quality.'],
    witty: ['The {vRivalThing} is just the excuse. The grudge is the main course.'],
    proud: ['Some things are worth a long grudge.'],
  });
  say('village.rival.nextyear', {
    _: ['From your lips to the judges\' ears.', 'It\'d better be. I\'ve a new trick.'],
    gloomy: ['That\'s what you said last time. ...Thank you, though.'],
    proud: ['Naturally.'],
    cheerful: ['Yes! Next time! I can feel it!'],
  });
  say('village.rival.safe', {
    _: ['It had better be. I\'ve a reputation.', 'Thank you. If {rival} ever finds out, I\'ll know who told.'],
    ornery: ['Good. Now forget I said it.'],
    shy: ['Thank you. It\'s nice to say it to someone.'],
  });
  say('village.rival.shake', {
    _: ['Tell {rival}? ...Maybe. A small word. At the fair. After I\'ve won.', 'Hm. Friends with {rival}. Stranger things have happened. You\'re one of them.'],
    ornery: ['Hmph. I\'ll say "well done". Through my teeth. It\'s a start.'],
    cheerful: ['Ha! Maybe I will. Then we can be rivals AND friends. The best kind.'],
    proud: ['I could be magnanimous. I\'m very good at magnanimous.'],
    shy: ['...I\'ll try. I\'ll say I liked {rival}\'s last one. It\'s true.'],
  });

  // =================================================================================
  // Someone they look up to
  // =================================================================================
  addThread({
    id: 'village.hero', label: 'Who do you look up to?', reveals: 'village.hero', weight: 0.9, cool: 6,
    when: (F) => has(F.vHero),
    open: { ask: 'village.hero.open' },
    beats: {
      start: { line: 'village.hero.start', fx: { learn: ['village.hero', '{Name} looks up to {vHero}.'] }, go: [
        { ap: 'ask', say: 'What is it about {vHero}?', to: 'why' },
        { ap: 'jest', say: 'Not me, then? I\'m wounded. Mortally.', to: 'notme' },
        { ap: 'ask', say: 'Does {vHero} know?', to: 'know' },
      ] },
      why: { line: 'village.hero.why', go: [
        { ap: 'ask', say: 'Would you like to be like {vHero}?', to: 'like' },
        { ap: 'listen', say: '*You nod, and wait for the rest.*', label: 'Wait for the rest', to: 'story', need: { open: 1 }, soft: true },
        { ap: 'warm', say: 'Then you\'ve chosen well.', to: 'end' },
      ] },
      notme: { line: 'village.hero.notme', go: [
        { ap: 'warm', say: 'I\'m teasing. Tell me about {vHero}.', to: 'why' },
        { ap: 'jest', say: 'I shall go and sulk in my wagon.', to: 'sulk' },
      ] },
      know: { line: 'village.hero.know', go: [
        { ap: 'advise', say: 'Tell {vHero}. It would mean the world.', to: 'tell' },
        { ap: 'warm', say: 'Some things are better shown than said.', to: 'shown' },
      ] },
      like: { line: 'village.hero.like', go: [
        { ap: 'advise', say: 'Then ask {vHero} to teach you.', to: 'teach' },
        { ap: 'warm', say: 'You\'re more like {vHero} than you think.', to: 'blush' },
      ] },
      story: { line: 'village.hero.story', fx: { trust: 0.03, confide: { k: 'village.hero.story', t: '{Name} remembers a kindness of {vHero}\'s, long ago.' } }, end: true },
      sulk: { line: 'village.hero.sulk', end: true },
      tell: { line: 'village.hero.tell', fx: { respect: 0.02, run: (T, v) => visit(T, v, 'vHeroId', 'kin') }, end: true },
      shown: { line: 'village.hero.shown', end: true },
      teach: { line: 'village.hero.teach', fx: { respect: 0.02, run: (T, v) => visit(T, v, 'vHeroId', 'kin') }, end: true },
      blush: { line: 'village.hero.blush', fx: { fond: 0.02 }, end: true },
    },
    end: { fond: 0.02 },
  });
  lines('village.hero.open', [{ text: ['Who do you look up to in Thistledown, {name}?', 'Tell me, {name}: who in this village do you most admire?', 'If you could be like anyone in the valley, {name}, who would it be?'] }, { if: { stage: 'child' }, text: ['Who\'s the best grown-up, {name}? Apart from me.'] }]);
  say('village.hero.start', {
    _: ['{VHero}. No question. {VHero}.', 'Oh, that\'s easy. {VHero}.', 'I don\'t say it often. {VHero}.'],
    cheerful: ['{VHero}! Everyone loves {vHero}. I\'m just louder about it.', 'Ooh. {VHero}. Definitely {vHero}.'],
    ornery: ['Look up to? I don\'t look up to anybody. ...{VHero}, maybe. A little.', 'Hmph. {VHero}. Don\'t tell {vHero}. It\'ll go to {vHero}\'s head.'],
    shy: ['...{VHero}. I could never say so to {vHero}.', 'Um. {VHero}. I watch how {vHero} does things.'],
    curious: ['{VHero}. I\'ve been trying to work out how {vHero} does it for years.', '{VHero}. I\'ve got a list of questions for {vHero}. It\'s very long.'],
    dreamy: ['{VHero}. {VHero} walks about like the valley belongs to {vHero}. In a kind way.'],
    witty: ['{VHero}. Partly for the skill. Mostly for the hat.', 'Apart from myself? {VHero}. Close second.'],
    proud: ['There are few I\'d call my equal. {VHero} is one.', '{VHero}. A hobbit of real quality. Like me.'],
    gloomy: ['{VHero}. Everything I\'m not.', '{VHero}. I\'ll never be half as good, mind.'],
    child: ['{VHero}! {VHero} is the BEST at everything!', '{VHero}! When I grow up I\'m going to be exactly like {vHero}. Except taller.'],
    rift: ['{VHero}. Back home we\'d call {vHero} a legend. Here {vHero}\'s just... good. Which is better.'],
  }, [
    { if: { vHeroElder: true }, text: ['Old {vHero}. {VHero}\'s seen everything twice and is still kind. That\'s rare.'] },
  ]);
  say('village.hero.why', {
    _: ['{VHero} is the best at what {vHero} does, and never boasts.', '{VHero} just gets on. Never a fuss, never a complaint.', '{VHero} helped half the village and never once mentioned it.'],
    cheerful: ['{VHero} makes everything look easy and fun! I want to be like that.'],
    ornery: ['{VHero} doesn\'t talk nonsense. In this village that\'s a miracle.'],
    shy: ['{VHero} is kind to everyone. Even to me. Especially to me.'],
    curious: ['{VHero} knows things. Things you can\'t learn from books. I want to know them.'],
    dreamy: ['When {vHero} works, it\'s like watching a song.'],
    witty: ['{VHero} is good at {vHero}\'s job and doesn\'t make you feel bad about yours. Very rare.'],
    proud: ['{VHero} has standards. And keeps them. That\'s character.'],
    gloomy: ['{VHero} never gives up. I give up all the time.'],
    child: ['{VHero} can do ANYTHING. I saw {vHero} carry two buckets at once.'],
    rift: ['{VHero} took me seriously when I first came through. Nobody else did.'],
  }, [
    { if: { vHeroJob: (j) => has(j) }, text: ['{VHero} is the best {vHeroJob} we\'ve ever had. And never boasts about it.'] },
    { if: { vHeroWhy: (w) => has(w) }, pri: 1, text: ['Do you know, I still think about {vHeroWhy}. {VHero} was so gracious about it. I still glow.'] },
    { if: { vHeroJob: 'baker' }, pri: 1, text: ['{VHero}\'s bread. Have you had {vHero}\'s bread? It\'s a kind of goodness you can eat.'] },
    { if: { vHeroJob: 'herbalist' }, pri: 1, text: ['{VHero} sat up three nights with my mother when she was ill. Never took a penny.'] },
    { if: { vHeroJob: 'storyteller' }, pri: 1, text: ['{VHero} tells stories that make the room go quiet. I\'d give anything for that.'] },
    { if: { vHeroJob: 'woodwright' }, pri: 1, text: ['{VHero} built half this village. Every door that doesn\'t stick, that\'s {vHero}.'] },
  ]);
  say('village.hero.notme', {
    _: ['Ha! You don\'t count. You\'re a wizard. That\'s cheating.', 'Oh, you\'re different. You\'re more of a weather.'],
    cheerful: ['Ha! You\'re in a class of your own!'],
    ornery: ['You? You\'d need to stay put longer than two weeks.'],
    witty: ['You\'re more someone I look AT. It\'s the hat.'],
    proud: ['You\'re very good, wizard. But you\'re not from here.'],
    child: ['You\'re second! Second best!'],
  });
  say('village.hero.know', {
    _: ['Know? Oh, no. Goodness, no. You don\'t SAY that.', 'I don\'t think so. I hope not. I\'d die.'],
    shy: ['No! And {vHero} mustn\'t. Ever.'],
    proud: ['I expect {vHero} suspects. I\'m not subtle.'],
    curious: ['I wonder. Do you think {vHero} might? What would {vHero} think?'],
    child: ['No! It\'s a secret. Well. It was.'],
  });
  say('village.hero.like', {
    _: ['Like {vHero}? I\'d settle for half.', 'More than anything. I\'m working on it.'],
    gloomy: ['I couldn\'t. I wouldn\'t know where to start.'],
    proud: ['I already am, in many ways.'],
    dreamy: ['Sometimes I pretend I am. When I\'m alone.'],
    child: ['Yes! I\'m practicing!'],
  });
  say('village.hero.story', {
    _: ['When I was small I broke a window. {VHero} said it was the wind. I\'ve never forgotten.', 'The winter we nearly lost the house, {vHero} came with a cart of wood and said nothing.'],
    shy: ['...I was crying behind the mill once. {VHero} sat down beside me and shared an apple. Didn\'t ask why.'],
    ornery: ['I was a terror as a youngster. {VHero} told me so. Then taught me a trade. Both were right.'],
    gloomy: ['The worst week of my life. {VHero} was the only one who knocked.'],
    rift: ['First night here, rain, no roof. {VHero} put a lantern in the window so I\'d find the way.'],
    child: ['{VHero} gave me a ride on {vHero}\'s shoulders at the fair. I could see EVERYTHING.'],
  });
  say('village.hero.sulk', {
    _: ['Ha! Go on, then. I\'ll bring you a scone later.', 'Don\'t you dare. You\'d sulk for a century.'],
    child: ['Don\'t be sad! You can be third!'],
  });
  say('village.hero.tell', {
    _: ['Maybe I will. Maybe I\'ll just... take {vHero} a cake. That says it.', 'You think? ...All right. I\'ll find the words. Somewhere.'],
    shy: ['I\'ll try. I\'ll probably just say "nice day". But I\'ll try.'],
    ornery: ['Hmph. I\'ll tell {vHero}. Gruffly.'],
  });
  say('village.hero.shown', {
    _: ['Shown. Yes. I like that.', 'Then I\'ll show it. Somehow.'],
    dreamy: ['Shown, not said. Like flowers on a step.'],
  });
  say('village.hero.teach', {
    _: ['Ask? Me? ...Well. Why not? Worst {vHero} can say is no.', 'I\'ll ask. Today. Before I lose my nerve.'],
    shy: ['...What if {vHero} says no? ...I\'ll ask.'],
    proud: ['I don\'t need teaching. But I might ask for... pointers.'],
  });
  say('village.hero.blush', {
    _: ['Get away with you. ...Do you really think so?', 'Oh, stop it. ...Really?'],
    shy: ['*goes pink to the ears*'],
    gloomy: ['You\'re just being nice. ...Thank you.'],
  });

  // =================================================================================
  // The neighbors
  // =================================================================================
  addThread({
    id: 'village.next', label: 'How are the neighbors?', weight: 0.9, cool: 5,
    when: (F) => has(F.vNext) && has(F.vNextHome),
    open: { ask: 'village.next.open' },
    beats: {
      start: { line: 'village.next.start', go: [
        { ap: 'ask', say: 'What are they like, over at {vNextHome}?', to: 'like' },
        { ap: 'jest', say: 'Do they borrow things and never bring them back?', to: 'borrow' },
        { ap: 'ask', say: 'Do you ever have {vNext} round for tea?', to: 'tea' },
      ] },
      like: { line: 'village.next.like', go: [
        { ap: 'listen', say: '*You lean on the gate.*', label: 'Lean on the gate', to: 'habits' },
        { ap: 'advise', say: 'Take {vNext} a pie. It works wonders on a neighbor.', to: 'pie' },
        { ap: 'warm', say: 'Good neighbors are worth more than a good roof.', to: 'end' },
      ] },
      borrow: { line: 'village.next.borrow', go: [
        { ap: 'jest', say: 'Lend {vNext} something enormous. A cart. Then ask for it back daily.', to: 'cart' },
        { ap: 'ask', say: 'What else do they get up to?', to: 'habits' },
      ] },
      tea: { line: 'village.next.tea', go: [
        { ap: 'advise', say: 'Ask {vNext} over. This week.', to: 'pie' },
        { ap: 'ask', say: 'And what are they like, close to?', to: 'habits' },
      ] },
      habits: { line: 'village.next.habits', go: [
        { ap: 'jest', say: 'There are worse things than a noisy neighbor. A silent one, for a start.', to: 'end' },
        { ap: 'warm', say: 'You sound fond of them, under it all.', to: 'fond' },
      ] },
      cart: { line: 'village.next.cart', fx: { joke: { k: 'village.cart', t: 'Lend {vNext} a cart and ask for it back daily.' } }, end: true },
      pie: { line: 'village.next.pie', fx: { respect: 0.02, run: (T, v) => visit(T, v, 'vNextId', 'kin') }, end: true },
      fond: { line: 'village.next.fond', fx: { run: (T, v) => { const o = who(T, 'vNextId'); if (o) v.bond(o, 0.02); } }, end: true },
    },
    end: { fond: 0.015 },
  });
  lines('village.next.open', [{ text: ['And how are the neighbors, {name}?', 'Getting on with the folk next door, {name}?', 'Who\'s that over the hedge from you, {name}? {VNext}, isn\'t it?'] }]);
  say('village.next.start', {
    _: ['{VNext}, over at {vNextHome}? Oh, they\'re all right. Mostly.', 'The neighbors. Well. There\'s a question.', 'Next door? {VNext}. We nod. We wave. We have opinions.'],
    cheerful: ['Oh, lovely! {VNext} waves every morning. I wave back. Sometimes we wave for ages.'],
    ornery: ['{VNext}\'s hens are in my beans again, if that\'s what you\'re asking.', 'Next door? Too close, that\'s what. Everyone\'s too close.'],
    shy: ['{VNext}? Very nice. I think. We don\'t talk much. I hide when I see {vNext}. Not on purpose.'],
    curious: ['{VNext}? Fascinating. Bakes at two in the morning. I\'ve never found out why.'],
    dreamy: ['You can hear {vNext} singing through the hill of an evening. It\'s rather nice.'],
    witty: ['Next door is {vNext}. Next-next door is also {vNext}, by the noise.'],
    proud: ['{VNext} keeps a decent step. Nothing like mine, but decent.'],
    gloomy: ['{VNext} has a better garden. A better door. A better everything.'],
    child: ['{VNext} lives next door! {VNext} gives me apples if I don\'t shout. I shout anyway.'],
    rift: ['Next door\'s {vNext}. Thinks my satellite dish is a birdbath. I let {vNext} think it.'],
  }, [
    { if: { vNextKind: ['close', 'friend'] }, not: { stage: 'child' }, text: ['{VNext}? Oh, the best neighbor you could ask for. We share a gate and a teapot.', 'Grand. {VNext} and I go back and forth over the hedge all day.'] },
    { if: { vNextKind: 'sour' }, not: { stage: 'child' }, text: ['{VNext}. Don\'t ask. We\'re at daggers drawn over the hedge.', 'Next door? I keep my curtains shut on that side, if you must know.'] },
    { if: { vNextKind: 'stranger' }, not: { stage: 'child' }, text: ['Do you know, I hardly know {vNext}. Isn\'t that terrible? Right next door.'] },
  ]);
  say('village.next.like', {
    _: ['Tidy. Quiet. Except on Highdays, when they\'re neither.', 'Good folk. A bit loud. A bit nosy. I\'m a bit nosy too, mind.'],
    cheerful: ['Oh, they\'re a hoot. Always someone laughing over there.'],
    ornery: ['They put their washing out on MY side of the line. Every week.'],
    shy: ['Kind. They leave things on my step. Plums, a scarf once. I never know what to do.'],
    curious: ['There\'s a lot of coming and going. I\'ve kept a little list. Just for interest.'],
    dreamy: ['They have a cat that sits on my window every evening and watches the sunset with me.'],
    witty: ['Delightful folk. From a distance. A hedge-width is ideal.'],
    proud: ['They\'re respectable. I wouldn\'t live next to anyone who wasn\'t.'],
    gloomy: ['They\'re happier than me. You can hear it through the wall.'],
    child: ['They have a dog! Or a very big cat. I\'m not sure.'],
    rift: ['They brought me a pie the first week. I didn\'t know what to do. I ate it.'],
  });
  say('village.next.borrow', {
    _: ['Borrow! {VNext} has had my good trowel since spring.', 'Ha! You\'ve met {vNext}, then. My ladder lives there now.'],
    cheerful: ['Oh, back and forth! I\'ve half their spoons and they\'ve half mine.'],
    ornery: ['My rake. My sieve. My second-best kettle. A trail of my things, all leading next door.'],
    shy: ['I\'m too shy to ask for my wheelbarrow back. It\'s been a year.'],
    curious: ['I\'ve been lending things to see what comes back. Science.'],
    witty: ['I don\'t lend. I make permanent gifts with the illusion of return.'],
    proud: ['I don\'t borrow and I don\'t lend. It keeps things clear.'],
    gloomy: ['They borrowed my good mood once. Never saw it again.'],
    child: ['They borrowed my ball. Over the hedge. Not on purpose. It\'s gone.'],
  });
  say('village.next.tea', {
    _: ['Tea? Oh, now and then. Not as often as we should.', 'Once a year, at Yule. It\'s a tradition. A short one.'],
    cheerful: ['All the time! We take turns. It\'s their turn. It\'s always their turn.'],
    ornery: ['Tea! With {vNext}? We\'d come to blows over the sugar.'],
    shy: ['I keep meaning to ask. I write the invitation and then I don\'t send it.'],
    dreamy: ['We used to. On the bench between our gardens. I miss that.'],
    proud: ['When it\'s suitable. I have a very good tea set.'],
    gloomy: ['They\'d only say no.'],
  });
  say('village.next.habits', {
    _: ['{VNext} sings in the bath. Every night. The same song. I know all the words now.', '{VNext} gets up before the cockerel and lets everyone know.'],
    cheerful: ['{VNext} dances in the garden when {vNext} thinks no one\'s looking. I join in from my side.'],
    ornery: ['{VNext} saws wood at dawn. At DAWN.', '{VNext} grows pumpkins the size of pigs and leaves them leaning on MY fence.'],
    shy: ['{VNext} talks to the vegetables. I do too. I think we\'d get on, if I ever said hello.'],
    curious: ['{VNext} has had a crate delivered every Mersday for a month. Nobody knows what\'s in it. I\'ve looked.'],
    dreamy: ['{VNext} keeps a lamp in the round window all night. I like knowing someone\'s awake.'],
    witty: ['{VNext} snores in a key I can only describe as \'major\'.'],
    proud: ['{VNext} polishes the doorknob every Sterday. I polish mine on Sunday, to make a point.'],
    gloomy: ['They have guests every week. Laughing. I can hear the laughing.'],
    child: ['{VNext} has a pipe that makes smoke rings! Like a dragon!'],
    rift: ['{VNext} keeps asking what my lights are for. Then stands in my garden looking at them.'],
  });
  say('village.next.cart', {
    _: ['Ha! A cart! Every day! Oh, that\'s wicked. I\'m doing it.', 'Daily! With a little bow! You\'re a terrible influence, wizard.'],
    ornery: ['Ha! That\'d learn {vNext}. That\'d learn {vNext} good and proper.'],
    shy: ['Oh, I couldn\'t. ...Could I?'],
    witty: ['An escalation in the lending wars. I like it.'],
  });
  say('village.next.pie', {
    _: ['A pie. Yes. Hard to quarrel with a pie.', 'All right, I\'ll go round. With a pie. A neutral sort of pie.'],
    ornery: ['A pie? For {vNext}? ...Fine. A small one.'],
    shy: ['I\'ll leave it on the step and knock and run. That counts.'],
    cheerful: ['A pie! Two pies! We\'ll have a pie evening!'],
    proud: ['My pies are the best on the lane. That\'ll show {vNext}.'],
  });
  say('village.next.fond', {
    _: ['...I suppose I am. Don\'t tell {vNext}.', 'Fond? Hm. Maybe. You get used to a noise.'],
    ornery: ['Fond! Of {vNext}! ...I\'d miss the racket, I\'ll grant you.'],
    dreamy: ['You get fond of the sounds a house makes. And the folk in it.'],
  });

  // =================================================================================
  // Their turn: they ask after someone
  // =================================================================================
  addThread({
    id: 'village.ask.howsx', theirs: true, label: 'They ask after someone', cool: 3, ask: '{Name} wants to ask you something.',
    when: (F) => F.met && F.talks >= 1 && has(F.vAsked),
    beats: {
      start: { line: 'village.ask.howsx.q', go: [
        { ap: 'warm', say: '{VAsked}\'s merry as a lark, I\'d say.', to: 'glad', need: { if: { vAskedMood: 'merry', vAskedSick: false } } },
        { ap: 'warm', say: 'Well enough, I think. Busy.', to: 'busy', need: { if: { vAskedMood: 'fair', vAskedSick: false } } },
        { ap: 'share', say: 'A little low, I thought. Quieter than usual.', to: 'worried', need: { if: { vAskedMood: ['low', 'miserable'], vAskedSick: false } } },
        { ap: 'share', say: '{VAsked}\'s full of cold, poor thing.', to: 'worried', need: { if: { vAskedSick: true } } },
        { ap: 'ask', say: 'Why don\'t you go and see for yourself?', to: 'go' },
        { ap: 'jest', say: 'Fat and happy and asking after you.', to: 'glad', need: { if: { vAskedSick: false, vAskedMood: ['merry', 'fair'] } } },
      ] },
      glad: { line: 'village.ask.howsx.glad', fx: { run: (T, v) => { const o = who(T, 'vAskedId'); if (o) v.bond(o, 0.02); } }, go: [
        { ap: 'ask', say: 'Shall I tell {vAsked} you asked?', to: 'regards' },
        { ap: 'advise', say: 'Go and see. It\'s been too long, I think.', to: 'go' },
      ] },
      busy: { line: 'village.ask.howsx.busy', go: [
        { ap: 'ask', say: 'Shall I say you were asking?', to: 'regards' },
        { ap: 'advise', say: 'Take {vAsked} some tea at work. Busy folk forget to stop.', to: 'go' },
      ] },
      worried: { line: 'village.ask.howsx.worried', go: [
        { ap: 'advise', say: 'Go and see {vAsked}. Today.', to: 'go' },
        { ap: 'comfort', say: 'Nothing a visit won\'t mend, I\'d wager.', to: 'go' },
        { ap: 'ask', say: 'Shall I tell {vAsked} you\'re thinking of {vAsked}?', to: 'regards' },
      ] },
      go: { line: 'village.ask.howsx.go', fx: { run: (T, v) => visit(T, v, 'vAskedId', 'kin') }, end: true },
      regards: { line: 'village.ask.howsx.regards', fx: { run: (T, v) => promiseRegards(T, v, who(T, 'vAskedId')) }, end: true },
    },
    end: { fond: 0.02 },
  });
  say('village.ask.howsx.q', {
    _: ['Have you seen {vAsked} lately? How is {vAsked}?', 'You get about. How\'s {vAsked}? I\'ve not seen {vAsked} in days.', 'Can I ask... how did {vAsked} seem, last you saw?'],
    cheerful: ['Ooh, you\'ve been all over! How\'s {vAsked}? Give me all of it!'],
    ornery: ['You talk to everyone. How\'s {vAsked}? Not that I care. I care a bit.'],
    shy: ['...Is {vAsked} all right, do you know? I\'ve been too shy to ask.'],
    curious: ['You\'ve talked to {vAsked}, haven\'t you? What did {vAsked} say? How was {vAsked}?'],
    dreamy: ['I had the oddest feeling about {vAsked} this morning. Is {vAsked} all right?'],
    witty: ['You\'re the village newspaper with a hat. How\'s {vAsked}?'],
    proud: ['You\'ll have seen {vAsked}. I trust {vAsked} is well?'],
    gloomy: ['Is {vAsked} all right? I always think something\'s wrong. Usually it isn\'t.'],
    child: ['Wizard! Is {vAsked} okay? Is {vAsked} coming out to play?'],
    rift: ['Got a status on {vAsked}? I\'ve lost signal, so to speak.'],
  });
  say('village.ask.howsx.glad', {
    _: ['Oh, good. Good. That\'s a weight off.', 'Ha! Asking after me? That\'s {vAsked} all over.', 'Merry! Oh, I\'m glad. I was fretting for nothing.'],
    cheerful: ['Hooray! Oh, I knew it! Good old {vAsked}!'],
    ornery: ['Well. Good. Hmph. Good.'],
    shy: ['...Oh, I\'m glad. Thank you for telling me.'],
    gloomy: ['That\'s something good, then. One thing.'],
    child: ['YAY. Can {vAsked} play now?'],
    rift: ['Status: merry. Excellent. Logging that.'],
  });
  say('village.ask.howsx.busy', {
    _: ['Busy. Of course. {VAsked}\'s always busy.', 'Too busy for me, it seems. ...No, that\'s not fair.'],
    ornery: ['Busy! That\'s what everyone says when they don\'t knock.'],
    cheerful: ['Busy bee! I\'ll catch {vAsked} at the Badger.'],
    gloomy: ['Busy. Right. Too busy, I expect.'],
  });
  say('village.ask.howsx.worried', {
    _: ['Oh no. I knew it. I had a feeling.', 'Low? {VAsked}? I should have gone round days ago.', 'Poor {vAsked}. And here\'s me, not knowing.'],
    cheerful: ['Oh, that won\'t do! That won\'t do at all!'],
    ornery: ['And nobody thought to tell me. Typical.'],
    shy: ['...Should I go? Would {vAsked} want me to?'],
    dreamy: ['I knew. I didn\'t know I knew, but I did.'],
    proud: ['Then something must be done. I shall see to it.'],
    gloomy: ['Of course. Everything\'s going wrong lately.'],
    child: ['Oh no. Is {vAsked} going to be all right?'],
    rift: ['Low battery. Got it. I\'ll take a charger. Well. Soup.'],
  });
  say('village.ask.howsx.go', {
    _: ['I will. I\'ll go now.', 'You\'re right. What am I standing here for?'],
    shy: ['...All right. I\'ll go. I\'ll take cookies. Cookies help.'],
    ornery: ['I was going anyway.'],
    child: ['Going! Bye!'],
  });
  say('village.ask.howsx.regards', {
    _: ['Would you? Yes. Tell {vAsked} I asked.', 'Please. Say I\'m thinking of {vAsked}.'],
    shy: ['Could you? Just that I asked. Nothing more.'],
    proud: ['Do. With my compliments.'],
    child: ['Say I said hi! A BIG hi!'],
  });

  // =================================================================================
  // Their turn: an apology they can't carry themselves
  // =================================================================================
  addThread({
    id: 'village.ask.sorry', theirs: true, label: 'They ask you to carry an apology', cool: 5, ask: '{Name} has a favor to ask.',
    when: (F) => F.met && F.talks >= 2 && F.trust >= 0.15 && has(F.vFoe),
    beats: {
      start: { line: 'village.ask.sorry.q', go: [
        { ap: 'warm', say: 'Of course. What shall I say?', to: 'what' },
        { ap: 'advise', say: 'It would mean more coming from you.', to: [{ need: { open: 2 }, to: 'brave' }, 'cant'] },
        { ap: 'ask', say: 'Are you sure you\'re ready to say it?', to: 'ready' },
      ] },
      what: { line: 'village.ask.sorry.what', fx: { trust: 0.03, run: (T, v) => promiseRegards(T, v, who(T, 'vFoeId'), true) }, go: [
        { ap: 'warm', say: 'I\'ll see it gets there. Word for word.', to: 'thanks' },
        { ap: 'jest', say: 'Shall I sing it? I\'ve a terrible voice. Very moving.', to: 'sing' },
      ] },
      brave: { line: 'village.ask.sorry.brave', fx: { respect: 0.04, run: (T, v) => visit(T, v, 'vFoeId', 'mend') }, end: true },
      cant: { line: 'village.ask.sorry.cant', go: [
        { ap: 'warm', say: 'Then I\'ll carry it for you.', to: 'what' },
        { ap: 'comfort', say: 'Take your time. It\'ll keep.', to: 'keep' },
      ] },
      ready: { line: 'village.ask.sorry.ready', go: [
        { ap: 'warm', say: 'Then I\'ll carry it.', to: 'what' },
        { ap: 'advise', say: 'Then say it yourself. Today, while you mean it.', to: [{ need: { open: 1 }, to: 'brave' }, 'cant'] },
      ] },
      thanks: { line: 'village.ask.sorry.thanks', end: true },
      sing: { line: 'village.ask.sorry.sing', end: true },
      keep: { line: 'village.ask.sorry.keep', end: true },
    },
    end: { fond: 0.02 },
  });
  say('village.ask.sorry.q', {
    _: ['Would you... tell {vFoe} something for me? I can\'t face {vFoe}. Not yet.', 'Can I ask a favor? It\'s about {vFoe}. I want to say sorry and I can\'t.', 'You talk to everyone. Would you take a word to {vFoe} for me?'],
    cheerful: ['Oh, wizard, I\'ve been silly with {vFoe}. Would you tell {vFoe} I\'m sorry? I\'d go myself but I\'d cry.'],
    ornery: ['Don\'t make a fuss. Tell {vFoe}... tell {vFoe} I was wrong. There. Don\'t make me say it twice.'],
    shy: ['...Could you tell {vFoe} something? I\'d write it, but my hand shakes.'],
    curious: ['If someone wanted to apologize without actually being in the room, how would they? Asking for me.'],
    dreamy: ['I keep writing it in my head. "Dear {vFoe}, I\'m sorry." Would you take it? The words, I mean.'],
    witty: ['Wizard. Professional favor. I need an apology delivered. Discreetly. Ideally with flourish.'],
    proud: ['I find I owe {vFoe} an apology. I would like it delivered. Properly.'],
    gloomy: ['{VFoe} won\'t want to hear it from me. Would you say I\'m sorry?'],
    child: ['Can you tell {vFoe} I\'m sorry? I said a bad word. Not a rude one. A mean one.'],
    rift: ['Need a relay. Message for {vFoe}: sorry. Can you route it?'],
  });
  say('village.ask.sorry.what', {
    _: ['Say I\'m sorry. That I didn\'t mean it. Well, I meant it then. I don\'t now.', 'Tell {vFoe} I\'m sorry, and that I miss the way things were.', 'Just "sorry". And "I was a fool". {VFoe} will like that bit.'],
    cheerful: ['Say sorry, and that I\'ll bring a cake. A sorry cake. With icing.'],
    ornery: ['"Sorry". One word. Don\'t embroider it.'],
    shy: ['...That I\'m sorry. And that I think about it every night.'],
    curious: ['That I\'m sorry, and that I\'d like to understand what went wrong. Properly.'],
    dreamy: ['That I\'m sorry, and the lane\'s been gray without {vFoe} in it.'],
    witty: ['Tell {vFoe} I\'m sorry and I\'ll never do it again. Whatever it was. I\'ve lost track.'],
    proud: ['That I regret my words. Use those exact words. "Regret".'],
    gloomy: ['That I\'m sorry. That\'s all. {VFoe} won\'t believe it.'],
    child: ['Say SORRY. And I\'ll share my conkers.'],
    rift: ['Sorry, full stop. No emoji. You don\'t have those here. Good.'],
  }, [
    { if: { vFoeWhy: (w) => has(w) }, pri: 1, text: ['Say I\'m sorry. About {vFoeWhy}. I\'ve thought about it every day.'] },
  ]);
  say('village.ask.sorry.brave', {
    _: ['...You\'re right. It should be me. I\'ll go now, before my knees give out.', 'From me. Yes. All right. I\'ll go.'],
    ornery: ['Hmph. You\'re right. I hate that you\'re right. I\'m going.'],
    shy: ['...I\'ll try. Walk me to the corner? No. I\'ll go. I\'ll go.'],
    proud: ['Quite so. One apologizes in person. I\'ll go.'],
    child: ['Okay. I\'ll say it. In a quiet voice.'],
  });
  say('village.ask.sorry.cant', {
    _: ['I can\'t. Not to {vFoe}\'s face. I\'d make it worse.', 'I tried. I got to the gate and turned round.'],
    ornery: ['I can\'t. I\'d start arguing again. I know me.'],
    shy: ['I can\'t. I go all hot and nothing comes out.'],
    proud: ['It\'s not that I won\'t. It\'s that I... won\'t. Not yet.'],
    gloomy: ['{VFoe} would shut the door. I know it.'],
  });
  say('village.ask.sorry.ready', {
    _: ['Ready? I\'ve been ready for a week. I just haven\'t been brave.', 'Yes. I lie awake with it. I\'d like to sleep.'],
    ornery: ['Ready? I wouldn\'t be asking otherwise, would I?'],
    curious: ['I think so. I\'ve examined it from every side. Sorry is the only side left.'],
    dreamy: ['As ready as the blossom is in spring. Which is to say, a bit early, but there.'],
  });
  say('village.ask.sorry.thanks', {
    _: ['Thank you. I owe you. A pie, at least.', 'Word for word. Thank you, wizard. Truly.'],
    shy: ['...Thank you. I feel lighter already.'],
    ornery: ['Hmph. Thank you. Don\'t mention it. To anyone.'],
  });
  say('village.ask.sorry.sing', {
    _: ['Sing it! Don\'t you dare! ...Actually, {vFoe} might laugh. That\'d help.', 'Ha! No singing. A normal, dignified apology, please.'],
    witty: ['Sing it. To the tune of the Bath Song. That\'s an order.'],
  });
  say('village.ask.sorry.keep', {
    _: ['It\'ll keep. It\'s kept this long.', 'Thank you for not pushing.'],
    gloomy: ['It\'ll keep. Like a stone in my shoe.'],
  });

  // =================================================================================
  // Their turn: settle a squabble
  // =================================================================================
  const spatAgree = (T, v) => {
    const o = who(T, 'vSpatId');
    if (!o) return;
    for (const [a, b] of [[v, o], [o, v]]) { if (a.sent && a.sent[b.id]) a.sent[b.id] = a.sent[b.id].filter((s) => SENT[s.tag][1] > 0); addSentiment(a, b, 'fond', 'settling it fairly'); }
    v.bond(o, 0.05); addRegard(o, 0.02);
    v.remember(`The wizard settled things between ${o.first} and me. Fairly, I suppose.`, 1);
  };
  addThread({
    id: 'village.ask.settle', theirs: true, label: 'They ask you to settle a squabble', cool: 6, ask: '{Name} wants you to settle something.',
    when: (F) => F.met && F.talks >= 1 && F.stage !== 'child' && has(F.vSpat) && has(F.vSpatKey),
    beats: {
      start: { line: 'village.ask.settle.q', go: [
        { ap: 'advise', say: 'You\'re in the right, plainly.', to: 'mine' },
        { ap: 'advise', say: 'By rights, I\'d say {vSpat} has it.', to: 'theirs' },
        { ap: 'listen', say: 'Tell me both sides first.', to: 'sides' },
      ] },
      sides: { line: 'village.ask.settle.sides', fx: { open: 1 }, go: [
        { ap: 'advise', say: 'Then you\'re in the right, fair and square.', to: 'mine' },
        { ap: 'advise', say: 'Then I\'m afraid {vSpat} has the right of it.', to: 'theirs' },
        { ap: 'ask', say: 'Why not settle it between you? Half each.', to: [{ need: { respect: 0.12 }, to: 'agree' }, { need: { fond: 0.3 }, to: 'agree' }, 'scoff'] },
      ] },
      mine: { line: 'village.ask.settle.mine', fx: { fond: 0.03, run: (T, v) => { const o = who(T, 'vSpatId'); if (o) { addSentiment(o, v, 'prickly', 'the wizard\'s say-so'); addRegard(o, -0.03); } } }, go: [
        { ap: 'advise', say: 'Be gracious. Take {vSpat} something.', to: 'gracious' },
        { ap: 'jest', say: 'Don\'t crow. Crowing is for cockerels.', to: 'crow' },
      ] },
      theirs: { line: 'village.ask.settle.theirs', fx: { fond: -0.02, respect: 0.03, run: (T, v) => { const o = who(T, 'vSpatId'); if (o) addRegard(o, 0.03); } }, go: [
        { ap: 'comfort', say: 'It\'s a hard thing to hear. You asked me true, and I answered true.', to: 'accept' },
        { ap: 'advise', say: 'Let it go. It\'s only a {vSpatThing}.', to: 'only' },
      ] },
      agree: { line: 'village.ask.settle.agree', fx: { respect: 0.04, run: spatAgree }, end: true },
      scoff: { line: 'village.ask.settle.scoff', go: [
        { ap: 'advise', say: 'Try it. For me.', to: [{ need: { fond: 0.2 }, to: 'agree' }, 'refuse'] },
        { ap: 'warm', say: 'Think on it, then.', to: 'end' },
      ] },
      gracious: { line: 'village.ask.settle.gracious', fx: { respect: 0.02 }, end: true },
      crow: { line: 'village.ask.settle.crow', end: true },
      accept: { line: 'village.ask.settle.accept', end: true },
      only: { line: 'village.ask.settle.only', end: true },
      refuse: { line: 'village.ask.settle.refuse', end: true },
    },
  });
  say('village.ask.settle.q', {
    _: ['You\'re wise. Settle it: {vSpatWhat}. Who\'s in the right, me or {vSpat}?', 'Wizard, you\'re fair. {VSpat} and I can\'t agree about {vSpatWhat}. Who\'s right?', 'Settle something for me: {vSpatWhat}. {VSpat} says one thing, I say the truth.'],
    cheerful: ['Ooh, you can settle it! {VSpat} and I have been arguing about {vSpatWhat} for a week. It\'s been lovely, but I want to win.'],
    ornery: ['Right. You. {VSpatWhat}. Tell {vSpat} I\'m right. Go on.', 'You\'ll settle this. {VSpat} won\'t listen to sense. {VSpatWhat}. Mine.'],
    shy: ['...Could you help? {VSpat} and I... there\'s a thing. {VSpatWhat}. I don\'t like arguing.'],
    curious: ['I need an impartial wizard. {VSpatWhat}. I\'ve drawn a map. Would you like to see the map?'],
    witty: ['A case for the wizard! The matter of {vSpatWhat}. I\'ll be prosecution and defense.'],
    proud: ['I would like a ruling. {VSpatWhat}. I am confident of the outcome.'],
    gloomy: ['You\'ll side with {vSpat}. Everyone does. But: {vSpatWhat}. Who\'s right?'],
    rift: ['Need an arbiter. Dispute with {vSpat}: {vSpatWhat}. Rule on it, wizard.'],
    elder: ['I\'ve been right about {vSpatWhat} for forty years. Tell {vSpat}.'],
  }, [
    { if: { vSpatKey: 'plum' }, pri: 1, text: ['The plum tree on the boundary. Its roots are on my side. Its plums fall on {vSpat}\'s. Whose plums?'] },
    { if: { vSpatKey: 'hens' }, pri: 1, text: ['{VSpat}\'s hens ate my cabbages. {VSpat} says my cabbages ate the hens\' good nature. Who pays?'] },
    { if: { vSpatKey: 'cat' }, pri: 1, text: ['That ginger cat sleeps at mine and eats at {vSpat}\'s. Whose cat is it? I\'ve a basket ready.'] },
    { if: { vSpatKey: 'bench' }, pri: 1, text: ['The good bench outside the Badger. I sit there Highdays. {VSpat} says {vSpat} sat there first. In what year?'] },
    { if: { vSpatKey: 'recipe' }, pri: 1, text: ['The seed-cake recipe. My grandmother\'s. {VSpat} says it was {vSpat}\'s grandmother\'s. They were the same grandmother, it turns out.'] },
    { if: { vSpatKey: 'mushrooms' }, pri: 1, text: ['The mushroom ring by the old oak. I found it first. {VSpat} picked it first. Which counts?'] },
    { if: { vSpatKey: 'ladder' }, pri: 1, text: ['{VSpat} borrowed my ladder at Yule and says it\'s been so long it\'s {vSpat}\'s now. Is that the law?'] },
    { if: { vSpatKey: 'hedge' }, pri: 1, text: ['The hedge between us. Who trims it? I did it last year. {VSpat} says I did it badly. That doesn\'t count.'] },
    { if: { vSpatKey: 'path' }, pri: 1, text: ['{VSpat} cuts across the bottom of my garden. Every day. There\'s a path now. A PATH.'] },
    { if: { vSpatKey: 'barrow' }, pri: 1, text: ['The wheelbarrow. I lent it. {VSpat} painted it blue. Now {vSpat} says it\'s a different wheelbarrow.'] },
  ]);
  say('village.ask.settle.sides', {
    _: ['Mine is that it\'s mine. {VSpat}\'s is... well. {VSpat} has a point. A small one.', 'I\'ve been right all along. Though {vSpat} did say a sensible thing, once.'],
    cheerful: ['My side is lovely. {VSpat}\'s side is also lovely, but wrong.'],
    ornery: ['My side\'s the right side. That\'s both sides.', 'Both sides? There\'s one side and a heap of nonsense.'],
    shy: ['{VSpat} probably needs it more, really. But I did have it first.'],
    curious: ['Here\'s the map. My claim is in red. {VSpat}\'s is in a more doubtful sort of brown.'],
    witty: ['My case: obviously mine. {VSpat}\'s case: an elaborate fantasy.'],
    proud: ['My claim is impeccable. {VSpat}\'s is... sincere.'],
    gloomy: ['Mine. But {vSpat} always gets things. I don\'t know why I bother.'],
    rift: ['My side: first claim, documented. {VSpat}\'s side: \'it\'s always been like that\'. Which is apparently a law here.'],
  });
  say('village.ask.settle.mine', {
    _: ['I knew it! I KNEW it! Wait till I tell {vSpat}.', 'Ha! The wizard says so. That\'s that, then.', 'Thank you! Finally, some sense in this valley.'],
    cheerful: ['Hooray! Oh, I\'ll be ever so nice about it. Mostly.'],
    ornery: ['Right. Good. Obviously. I\'ll be telling {vSpat} directly.'],
    shy: ['Oh! Really? Oh, I hope {vSpat} won\'t be upset.'],
    curious: ['Interesting. On what grounds? No, don\'t tell me. I\'m happy.'],
    witty: ['The court rules for the plaintiff. Who is me. Delightful.'],
    proud: ['Naturally. Justice prevails.'],
    gloomy: ['Really? Me? ...{VSpat} will never forgive me.'],
    rift: ['Ruling logged. Victory. Small, but I\'ll take it.'],
  });
  say('village.ask.settle.theirs', {
    _: ['{VSpat}\'s? But... oh. Oh, really?', 'You\'re siding with {vSpat}? After all that?', 'Well. I asked. I didn\'t think you\'d answer like that.'],
    cheerful: ['Oh! Well. Fair\'s fair, I suppose. Bother.'],
    ornery: ['{VSpat}\'s! You\'ve been got at. {VSpat}\'s been buttering you up.', 'Hmph. Some wizard you are.'],
    shy: ['...Oh. I thought so, really. I just hoped.'],
    curious: ['Really? On what grounds? I want to understand.'],
    witty: ['The court rules against the plaintiff. The plaintiff is appealing. To the moon.'],
    proud: ['I see. I shall respect the ruling. I shan\'t like it.'],
    gloomy: ['I knew you would. Everyone does.'],
    rift: ['Ruling noted. Disagreed with. But noted.'],
  });
  say('village.ask.settle.agree', {
    _: ['Share it? ...I suppose. Half each. Like grown hobbits.', 'Share. Hm. That\'s what my mother would\'ve said. Fine. Share.', 'You\'re right. It\'s daft, the two of us at it. I\'ll go and say so.'],
    cheerful: ['Share it! Oh, that\'s lovely. We\'ll have a sharing party!'],
    ornery: ['Share it. With {vSpat}. ...Fine. But I get the first go.'],
    shy: ['I\'d like that. I didn\'t want to fall out, really.'],
    curious: ['Shared. Do you know, that never occurred to me. How odd.'],
    witty: ['A compromise. How very wizardly of you. Infuriating.'],
    proud: ['A magnanimous solution. I\'ll be magnanimous first.'],
    gloomy: ['Share it. ...That might work. Things sometimes do.'],
    rift: ['Shared access. Like a network. Okay. I can live with that.'],
  });
  say('village.ask.settle.scoff', {
    _: ['Share it? With {vSpat}? You don\'t know {vSpat}.', 'Share! That\'s what folk say when they won\'t take sides.'],
    ornery: ['Sharing\'s for lambs and in-laws. I want a ruling.'],
    proud: ['A fudge. I asked for a judgment and you give me a fudge.'],
    witty: ['Sharing. The coward\'s verdict. Very diplomatic.'],
  });
  say('village.ask.settle.gracious', {
    _: ['Gracious. All right. I\'ll take {vSpat} a little something. A consolation.', 'You\'re right. Win nicely. My grandmother always said.'],
    ornery: ['Gracious! After all that! ...Fine. A small something.'],
    proud: ['I am always gracious. I\'ll be extra gracious.'],
  });
  say('village.ask.settle.crow', {
    _: ['Ha! I wasn\'t going to crow. Much. A little cluck.', 'No crowing. Just a small, dignified strut.'],
    witty: ['Crowing is for cockerels. Gloating is for hobbits. Different thing.'],
  });
  say('village.ask.settle.accept', {
    _: ['...You did. I suppose that\'s worth something. More than a fib.', 'Yes. Well. Thank you for being honest. I don\'t like it.'],
    ornery: ['Hmph. Honest. I\'ll take honest. Grudgingly.'],
    proud: ['Honest. I respect that. I respect it from a distance.'],
  });
  say('village.ask.settle.only', {
    _: ['Only a {vSpatThing}! It\'s the principle!', 'It\'s never only a {vSpatThing}, wizard. Never.'],
    gloomy: ['Only a {vSpatThing}. Yes. I suppose. Everything\'s only something.'],
  });
  say('village.ask.settle.refuse', {
    _: ['Not even for you. Not this time.', 'I like you, wizard. I like being right more.'],
    ornery: ['For you? Ha. Nice try.'],
    proud: ['I\'m afraid my mind is made up. It usually is.'],
    witty: ['For you, I\'d do almost anything. This falls in the gap.'],
    gloomy: ['It wouldn\'t work anyway. Nothing does with {vSpat}.'],
    cheerful: ['Oh, I couldn\'t! Well. Not today. Ask me after cake.'],
  });

  // =================================================================================
  // More to say: variety for every moment above, by temper, season and the hour
  // =================================================================================
  lines('village.friend.jest', [{ text: ['I\'ve seen you and {vFriend} whispering by the well. Conspiring, I\'d say.', 'You and {vFriend}. Like two peas in a pod. A pod with a secret.'] }]);
  lines('village.friend.open', [
    { if: { season: 'winter' }, text: ['Have you seen much of {vFriend} this winter, {name}? Snow keeps friends apart.'] },
    { if: { hour: 'evening' }, text: ['Will you be seeing {vFriend} tonight, {name}? At the Badger, perhaps?'] },
  ]);
  say('village.friend.start', {
    cheerful: ['Oh, {vFriend}\'s the best! I\'d give {vFriend} my last scone. My second-last, anyway.'],
    ornery: ['{VFriend}? Only one in the village I can stand for a whole afternoon.'],
    shy: ['{VFriend} is... the one person I don\'t have to practice talking to.'],
    curious: ['{VFriend}! We\'re halfway through counting the frogs in the mill-pond. It\'s a long project.'],
    dreamy: ['{VFriend}\'s the sort you can be quiet with. Those are the best sort.'],
    witty: ['{VFriend}? Still my favorite audience. Laughs in all the right places and some wrong ones.'],
    proud: ['{VFriend} and I go back a long way. A distinguished friendship.'],
    gloomy: ['{VFriend} is the only one who still knocks. Bless {vFriend}.'],
    child: ['{VFriend} can climb higher than ANYONE. Except me. Nearly.'],
    rift: ['{VFriend}\'s good people. Asked me what a city smells like. Nobody asks that.'],
  }, [
    { if: { season: 'winter' }, text: ['{VFriend}? Snowed in, last I heard. I\'ve been meaning to dig a path over.'] },
    { if: { season: 'summer' }, text: ['{VFriend}\'s brown as a nut. Out in the sun all day. We swam in the river on Highday.'] },
    { if: { season: 'autumn' }, text: ['{VFriend}? We were blackberrying together all last week. Purple to the elbows, both of us.'] },
    { if: { season: 'spring' }, text: ['{VFriend}\'s been out in the garden since the first thaw. Digs like a badger.'] },
  ]);
  say('village.friend.best', {
    _: ['{VFriend} remembers my birthday. Every year. Even the year I forgot it.', 'When I\'m wrong, {vFriend} lets me find out on my own. Kindly.'],
    cheerful: ['{VFriend} can make a game out of anything. Washing up. Rain. Anything.'],
    ornery: ['{VFriend} never once said "cheer up". Not once. That\'s a true friend.'],
    proud: ['{VFriend} has never once spoken ill of me behind my back. I\'ve checked.'],
    dreamy: ['{VFriend} hums when {vFriend}\'s happy. I don\'t think {vFriend} knows.'],
    witty: ['{VFriend} can keep a straight face through anything. Very useful in a friend.'],
    shy: ['{VFriend} speaks for me when I can\'t. Not over me. For me.'],
  });
  say('village.friend.plot', {
    _: ['There may be a plan. It may involve the Badger\'s cellar. That\'s all I\'m saying.', 'Plotting is a big word for a small thing involving geese.'],
    dreamy: ['We\'re going to watch the sunrise from the top of the far hill. We keep oversleeping.'],
    proud: ['Our plans are strictly above board. Mostly above board.'],
  });
  say('village.friend.asked', {
    _: ['Did {vFriend} really? I thought {vFriend} had forgotten me this week.', 'Well, that\'s put the kettle on in my heart, that has.'],
    ornery: ['Hmph. Well. I suppose I\'ll have to ask after {vFriend} now. Fair\'s fair.'],
    proud: ['How very good of {vFriend}. I shall reciprocate.'],
  });
  say('village.friend.regards', {
    _: ['Yes. Tell {vFriend} I\'ll save a seat by the fire on Mersday.', 'Would you? Say I said the garden misses {vFriend}. So do I.'],
    shy: ['...And say thank you. For last time. {VFriend} will know.'],
    witty: ['Pass on my regards, my respects and my best joke about badgers.'],
  });
  say('village.friend.met', {
    _: ['On the bridge. We both stopped to look at the same fish. It got away. We didn\'t.', 'Our mothers sat us in the same baby carriage. We\'ve been arguing about elbow room since.'],
    proud: ['At the Founders\' Day games. We came first and second. I\'ll leave you to guess who was first.'],
    witty: ['We were both hiding from the same aunt. A bond for life.'],
  });
  say('village.friend.since', {
    _: ['Since then, yes. Every season.', 'And not one week gone by without a word between us.'],
    dreamy: ['Since then. Like the river. It just keeps going.'],
    proud: ['A long and honorable friendship.'],
    curious: ['Ever since. I\'ve still not worked out why {vFriend} puts up with me.'],
  });
  say('village.friend.toldthem', {
    _: ['I should. I should, shouldn\'t I.', 'Not out loud. Folk don\'t, round here. We bake instead.'],
    gloomy: ['No. I keep meaning to. Then I think I\'ll sound daft.'],
    curious: ['Do you think {vFriend} would like to hear it? I genuinely wonder.'],
  });
  say('village.friend.deeper', {
    _: ['{VFriend} hasn\'t been sleeping. I can tell by the curtains. Open at all hours.'],
    curious: ['I\'ve noticed {vFriend} stopped going to the Badger. I don\'t know why. I want to know why.'],
    witty: ['I make jokes so {vFriend} doesn\'t notice I\'m worried. Mostly I make jokes.'],
    elder: ['We\'re neither of us young. Every winter I count us both and hope.'],
  });
  say('village.friend.scheme', {
    _: ['We\'re going to put a hat on the party tree. A very big hat. On Midsummer.'],
    ornery: ['We\'re going to fix the mill bridge ourselves, since nobody else will. Quietly.'],
    gloomy: ['We were going to plant a whole hedge of roses. They\'ll die. We\'re doing it anyway.'],
  });
  say('village.friend.watched', {
    curious: ['From under your hat? What else can you see from there?'],
    cheerful: ['Watch away! You can join in, if you\'re good!'],
    proud: ['We have nothing to hide. Very little to hide.'],
  });
  say('village.friend.visit', {
    _: ['I\'ll go round with a cake. Any excuse.', 'You\'re right. I\'ve been putting it off for no reason at all.'],
    curious: ['I will. And I\'ll ask about the tin. I\'ll finally ask about the tin.'],
    dreamy: ['I\'ll go the long way, by the river. {VFriend} likes it when I bring a flower.'],
    witty: ['I\'ll go. I\'ll pretend I was passing. {VFriend} will pretend to believe it.'],
  });
  say('village.friend.pining', {
    cheerful: ['Ha! Maybe a little bit! Don\'t tell!'],
    proud: ['I have never pined in my life. I may have mused.'],
    dreamy: ['Pining. What a lovely sad word. I might be.'],
  });
  say('village.friend.message', {
    _: ['Say I\'ll bring the cards on Highday. And this time I won\'t cheat.'],
    shy: ['Just... that I think of {vFriend}. That\'s all. That\'s a lot.'],
    proud: ['Tell {vFriend} I expect a visit. Soon.'],
    child: ['Tell {vFriend} the frog\'s name is Sir Hopsalot now. We voted.'],
  });
  say('village.friend.fallen', {
    curious: ['Once. Over whether fish sleep. They do. I was right. It didn\'t help.'],
    dreamy: ['A long time ago. I don\'t remember why. I remember how cold it was.'],
    cheerful: ['Oh, once or twice! We always laugh about it after.'],
  });
  say('village.friend.madeup', {
    _: ['Neither of us said a word. We just started talking about the weather again.'],
    cheerful: ['We bumped into each other at the fair and burst out laughing. That was that.'],
    shy: ['{VFriend} came and sat with me. Didn\'t say anything. That was the sorry.'],
    witty: ['We agreed we were both wrong, which was a lie, but a friendly one.'],
  });

  lines('village.regards.open', [{ if: { season: 'winter' }, text: ['A warm word from {vRegardsFrom}, {name}, to keep the cold off.'] }]);
  say('village.regards.start', {
    _: ['Oh, how kind. I\'ll keep that all day.'],
    shy: ['...That\'s the nicest thing that\'s happened this week.'],
    curious: ['What made {vRegardsFrom} think of me, do you suppose?'],
    child: ['Can I send one back? Can I? Like a letter but with a WIZARD?'],
  });
  say('village.regards.satchel', {
    ornery: ['A satchel! You\'d look like the mail carrier\'s grandfather.'],
    proud: ['A satchel would suit you. Leather. With a buckle.'],
  });
  say('village.regards.postie', {
    cheerful: ['Ha! A wizard mail carrier! I\'d write every day!'],
    shy: ['...Thank you for making an exception.'],
  });
  say('village.regards.go', {
    cheerful: ['Oh, I will! Right now! Hold my basket. No, I\'ll take it.'],
    proud: ['A personal visit. Yes. That would be proper.'],
    gloomy: ['It isn\'t far. I always think it\'s further.'],
  });

  lines('village.foe.open', [{ if: { vFoeWhy: (w) => has(w) }, text: ['Still smarting over {vFoeWhy}, {name}? I hear {vFoe} is too.'] }]);
  say('village.foe.start', {
    _: ['{VFoe} and I aren\'t... we\'re not... let\'s say we\'re having weather.'],
    cheerful: ['Oh, it\'ll blow over. It\'s blowing. It\'s just taking its time.'],
    curious: ['I\'ve been trying to work out what {vFoe} meant by it. I can\'t.'],
    dreamy: ['I passed {vFoe}\'s door this morning and the window was dark. I didn\'t like that.'],
  });
  say('village.foe.side', {
    _: ['{VFoe} took something I said the wrong way. And then I took it the wrong way back.'],
    ornery: ['I said what I thought. {VFoe} said what {vFoe} thought. Only one of us was right.'],
    witty: ['{VFoe} and I disagreed about something. Then about the disagreement. Then about the weather.'],
  });
  say('village.foe.tea', {
    ornery: ['Tea. You\'d think wizards had better tricks.'],
    proud: ['A small cup. I can manage a small cup.'],
    child: ['Can it be juice?'],
  });
  say('village.foe.beat', {
    ornery: ['A race. Hmph. I don\'t run. ...I might walk briskly.'],
    proud: ['I shall be first. I\'m always first.'],
  });
  say('village.foe.softer', {
    curious: ['Forgivable. Do you know, I hadn\'t looked at it that way.'],
    dreamy: ['Being a bit wrong. It\'s lighter, put like that.'],
    gloomy: ['Forgivable. If {vFoe} forgives. Which {vFoe} won\'t.'],
  });
  say('village.foe.notyet', {
    curious: ['Make it up? How? I\'ve thought of eleven ways and they all end in shouting.'],
    gloomy: ['It\'s gone too far. You don\'t know.'],
    rift: ['Not ready to reconnect. Need a reboot first.'],
  });

  lines('village.rival.open', [
    { if: { season: 'autumn' }, text: ['The fair\'s coming, {name}. Is {rival} worried yet?'] },
    { if: { vRivalLead: 'behind' }, text: ['I hear {rival} beat you last time, {name}. Revenge planned?'] },
  ]);
  say('village.rival.start', {
    _: ['{Rival}? We nod. We smile. We plot.', 'Still at it. {Rival} knows I\'m coming for {vRivalPrize}.'],
    curious: ['{Rival} has changed something. I can tell by the way {rival} walks. I need to know what.'],
    shy: ['{Rival} said "good effort" last time. I\'ve been thinking about it ever since.'],
  }, [{ if: { season: 'autumn' }, text: ['The fair\'s nearly here. {Rival} and I have stopped speaking. It\'s tradition.'] }]);
  say('village.rival.grudge', {
    cheerful: ['A grudge! No, it\'s a game! A long, silly game!'],
    dreamy: ['A long grudge for a {vRivalThing}. Isn\'t it funny what we hold on to?'],
  });
  say('village.rival.nextyear', {
    ornery: ['Of course it is. It was this year\'s too, if the judges had eyes.'],
    shy: ['...Do you think so? Really?'],
    witty: ['Next time is mine. I\'ve booked it.'],
  });
  say('village.rival.safe', {
    proud: ['I trust your discretion completely. Do not disappoint it.'],
    cheerful: ['Thank you! Oh, it\'s a relief to say it to someone!'],
  });
  say('village.rival.shake', {
    curious: ['Hm. What would we talk about, if not {vRivalThing}s? I\'d like to find out.'],
    gloomy: ['{Rival} would laugh. ...{Rival} wouldn\'t, actually. {Rival} isn\'t like that.'],
  });

  lines('village.hero.open', [{ if: { stage: 'elder' }, text: ['Is there anyone left you look up to, {name}, at your time of life?'] }]);
  say('village.hero.sulk', {
    cheerful: ['Ha! Come out for supper, though. Sulking\'s hungry work.'],
    witty: ['Sulk away. I\'ll tell {vHero} you were jealous.'],
  });
  say('village.hero.shown', {
    shy: ['...Shown. I can do shown. Shown\'s easier.'],
    ornery: ['Shown. Hmph. A loaf on the step. That\'s shown.'],
  });
  say('village.hero.tell', {
    cheerful: ['I will! I\'ll tell {vHero} at the Badger and buy a round!'],
    proud: ['I shall tell {vHero}. Once. Formally.'],
  });
  say('village.hero.teach', {
    cheerful: ['Ooh! I\'ll ask! I\'ll ask today!'],
    curious: ['I\'ve a list of questions already. This is just the excuse.'],
  });
  say('village.hero.blush', {
    proud: ['I have been told so. Not often enough.'],
    cheerful: ['Oh! That\'s the nicest thing! I\'m going to tell everyone!'],
  });

  lines('village.next.open', [
    { if: { season: 'summer' }, text: ['Long evenings, {name}. Do you hear much of the neighbors over the hedge?'] },
    { if: { weather: 'rain' }, text: ['Wet day to be indoors with the neighbors through the wall, {name}. How are they?'] },
  ]);
  say('village.next.fond', {
    cheerful: ['Fond! Of course! They\'re lovely! Loud, but lovely!'],
    shy: ['...I suppose I am. I wave more than I used to.'],
  });
  say('village.next.cart', {
    cheerful: ['Ha! A cart! I\'d have to borrow one first!'],
    proud: ['I\'d never stoop to it. It is tempting.'],
  });

  say('village.ask.howsx.q', {
    _: ['Is {vAsked} well, do you know? I keep meaning to call.'],
  }, [{ if: { vAskedSick: true }, text: ['I heard {vAsked} was poorly. Is it bad? You\'d know.'] }]);
  say('village.ask.howsx.busy', {
    shy: ['Busy. I shouldn\'t disturb {vAsked}, then.'],
    proud: ['Busy is good. Busy is respectable.'],
  });
  say('village.ask.howsx.go', {
    cheerful: ['I will! I\'ll take a pie! And a song!'],
    proud: ['I shall call this afternoon.'],
    gloomy: ['I\'ll go. If {vAsked} doesn\'t want me, I\'ll come straight back.'],
  });
  say('village.ask.howsx.regards', {
    ornery: ['If you must. Say I asked. Don\'t say I worried.'],
    dreamy: ['Tell {vAsked} the evening light made me think of {vAsked}.'],
  });

  say('village.ask.sorry.sing', {
    child: ['Yes! Sing it! Sing it like a dragon!'],
    shy: ['Please don\'t sing it. Please.'],
  });
  say('village.ask.sorry.keep', {
    ornery: ['It\'ll keep. So will I.'],
    shy: ['Thank you. I\'ll be braver next week.'],
  });
  say('village.ask.sorry.thanks', {
    cheerful: ['Oh, thank you! I could hug you! I won\'t. I might.'],
    proud: ['I\'m obliged to you, wizard.'],
  });
  say('village.ask.settle.gracious', {
    cheerful: ['Gracious! Yes! I\'ll take {vSpat} a basket of something nice!'],
    shy: ['I\'ll leave something on {vSpat}\'s step. Gracious and quiet.'],
  });
  say('village.ask.settle.accept', {
    shy: ['...I know. Thank you for not fibbing.'],
    gloomy: ['Honest. That\'s the worst kind of answer.'],
  });
  say('village.ask.settle.crow', {
    ornery: ['I\'ll crow if I like. Quietly.'],
    cheerful: ['No crowing! Just a small happy dance. Indoors.'],
  });
  say('village.ask.settle.only', {
    ornery: ['ONLY a {vSpatThing}! You\'ve never owned a {vSpatThing}, clearly.'],
    witty: ['It\'s only a {vSpatThing} in the way the sea is only some water.'],
  });
  say('village.ask.settle.scoff', {
    curious: ['Share it? Hm. How would that even work?'],
    gloomy: ['{VSpat} wouldn\'t share. {VSpat} never shares.'],
  });
});
