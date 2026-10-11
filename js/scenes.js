'use strict';
// ---------------------------------------------------------------------------
// Heart scenes (Stardew Valley's heart events, Wildermyth's vignettes): short
// moments between two folk, played out on the map in a few exchanged lines,
// when the time and the place and their feelings are right. Friends confide
// a dream at dusk on a bench; sweethearts hold hands under the party tree;
// two who squabbled make it up; an elder tells a grandchild about someone
// long gone over the hills; two friends lie on the grass counting stars;
// a homesick rift-born is comforted by a hill-folk friend; new parents stand
// at their door in wonder; rivals trade banter at the market. Each pair sees
// each scene once. The Chronicle tells of it, and clicking that line takes
// you to where it happened.
// ---------------------------------------------------------------------------

const SCENES = [
  {
    id: 'confide', when: (h) => h >= 18 && h < 21,
    pair: (a, b) => a.isGrown() && b.isGrown() && (a.rel[b.id] || 0) >= 0.6 && a.spouse !== b.id && a.dream,
    lines: (a, b) => [[a, `Can I tell you something, ${b.first}? I've never told anyone.`], [b, 'Of course. Go on.'], [a, `I want to ${dreamText(a.dream).charAt(0).toLowerCase() + dreamText(a.dream).slice(1)}. Silly, isn't it?`], [b, 'Not silly at all. I\'ll help, if I can.']],
    after: (a, b) => { addSentiment(a, b, 'kindred', 'listening to my dream'); a.remember(`Told ${b.first} about my dream. ${b.pron.they.charAt(0).toUpperCase() + b.pron.they.slice(1)} didn't laugh.`, 2); },
    chron: (a, b) => `At dusk, ${a.first} told ${b.first} a secret: ${a.pron.their} dream, to ${dreamText(a.dream).charAt(0).toLowerCase() + dreamText(a.dream).slice(1)}. ${b.first} promised to help.`,
  },
  {
    id: 'sweet', when: (h) => h >= 20 || h < 1,
    pair: (a, b) => a.sweetheart === b.id && !a.spouse && (a.love[b.id] || 0) >= 0.6,
    lines: (a, b) => [[a, 'Look, the lanterns are coming on.'], [b, 'I hadn\'t noticed. I was looking at you.'], [a, `Oh, ${b.first}.`], [b, '...Shall we walk home the long way?']],
    after: (a, b) => { const l = clamp((a.love[b.id] || 0) + 0.12, 0, 1); a.love[b.id] = l; b.love[a.id] = l; addSentiment(a, b, 'fond', 'an evening under the lanterns'); addSentiment(b, a, 'fond', 'an evening under the lanterns'); },
    chron: (a, b) => `${a.first} and ${b.first} were seen holding hands under the lanterns, taking the long way home. The whole village pretended not to notice.`,
  },
  {
    id: 'sorry', when: (h) => h >= 9 && h < 19,
    pair: (a, b) => sentimentsOf(a, b).some((s) => s.tag === 'hurt') && (a.rel[b.id] || 0) > 0.05,
    lines: (a, b) => [[b, `${a.first}... about the other day.`], [a, 'I know. Me too.'], [b, 'I was a proper fool.'], [a, 'We both were. Friends?'], [b, 'Friends.']],
    after: (a, b) => { for (const v of [a, b]) { const o = v === a ? b : a; if (v.sent && v.sent[o.id]) v.sent[o.id] = v.sent[o.id].filter((s) => s.tag !== 'hurt'); v.bond(o, 0.1); } },
    chron: (a, b) => `${a.first} and ${b.first} have made it up after their squabble, with a handshake in the lane and, later, ${a.isGrown() && b.isGrown() ? 'a pint' : 'a shared apple'}.`,
  },
  {
    id: 'tale', when: (h) => h >= 14 && h < 19,
    pair: (a, b) => a.stage === 'elder' && b.isChild() && b.parents.some((p) => (personById(p) || {}).parents?.includes(a.id)) && (Game.memorials || []).length,
    lines: (a, b) => { const m = R.pick(Game.memorials); return [[b, 'Grandad, who\'s that stone for?'], [a, `That's ${m.first}. Set off over the hills when I was not much older than you.`], [b, 'Will they come back?'], [a, 'Not to stay. But we tell their stories, and that\'s nearly as good.']]; },
    after: (a, b) => { b.bond(a, 0.08); learn(b, 0.02, 'family'); b.remember('Grandad told me about the folk on the Remembrance Green.', 2); },
    chron: (a, b) => `${a.first} took little ${b.first} to the Remembrance Green and told stories about the folk on the stones.`,
  },
  {
    id: 'stars', when: (h) => h >= 21 || h < 2,
    pair: (a, b) => (a.rel[b.id] || 0) >= 0.5 && !Game.raining && Game.weather === 'clear' && a.stage !== 'baby' && b.stage !== 'baby',
    lines: (a, b) => [[a, 'How many do you reckon there are?'], [b, 'Seven hundred and twelve. I counted.'], [a, 'You did not.'], [b, 'I counted the ones over the mill. I made the rest up.']],
    after: (a, b) => { a.bond(b, 0.06); feel(a, 'liked', 'a night under the stars'); feel(b, 'liked', 'a night under the stars'); },
    chron: (a, b) => `${a.first} and ${b.first} lay on the grass half the night counting stars. They disagree on the total.`,
  },
  {
    id: 'homesick', when: (h) => h >= 17 && h < 22,
    pair: (a, b) => a.isRiftborn() && !b.isRiftborn() && (a.lost || 0) >= 0.3 && (a.rel[b.id] || 0) >= 0.45,
    lines: (a, b) => [[a, a.arc ? `I miss ${a.arc.home}. Isn't that daft?` : 'I miss the city. Isn\'t that daft?'], [b, 'Not daft. I\'d miss this if I were far away.'], [a, 'It\'s the quiet. It\'s so loud.'], [b, 'Come for supper. We\'re very noisy at supper.']],
    after: (a, b) => { a.lost = Math.max(0, (a.lost || 0) - 0.15); addSentiment(a, b, 'grateful', 'understanding when I was homesick'); a.queue.push({ a: ACTIONS.supper_guest, extra: { home: b.home(), host: b } }); },
    chron: (a, b) => `${a.first} was homesick for the city tonight. ${b.first} listened, then dragged ${a.pron.them} round for a noisy supper.`,
  },
  {
    id: 'parents', when: (h) => h >= 8 && h < 20,
    pair: (a, b) => a.spouse === b.id && Game.villagers.some((k) => k.stage === 'baby' && k.parents.includes(a.id) && k.parents.includes(b.id)),
    lines: (a, b) => { const k = Game.villagers.find((x) => x.stage === 'baby' && x.parents.includes(a.id)); return [[a, `${k.first} has your nose, you know.`], [b, 'And your appetite, heaven help us.'], [a, 'We made a person.'], [b, 'We did. Now who\'s going to feed them at three in the morning?']]; },
    after: (a, b) => { a.bond(b, 0.05); },
    chron: (a, b) => `${a.first} and ${b.first} stood at their door with the new baby, quite unable to stop smiling.`,
  },
  {
    id: 'rivals', when: (h) => h >= 9 && h < 16,
    pair: (a, b) => a.rival === b.id,
    lines: (a, b) => [[a, `Morning, ${b.first}. Practising for the fair?`], [b, 'Don\'t need to practise. Unlike some.'], [a, 'We\'ll see about that.'], [b, 'We will.']],
    after: (a, b) => { if (R.chance(0.3)) { a.bond(b, 0.05); } },
    chron: (a, b) => `${a.first} and ${b.first} traded barbs in the square. The rivalry is alive and well.`,
  },
];

function sceneSeen(a, b, id) { const k = [a.id, b.id].sort().join('-') + ':' + id; return (Game.scenesSeen || []).includes(k); }
function markScene(a, b, id) { (Game.scenesSeen || (Game.scenesSeen = [])).push([a.id, b.id].sort().join('-') + ':' + id); if (Game.scenesSeen.length > 400) Game.scenesSeen.shift(); }
const freeForScene = (v) => !v.inside && !v.leaving && !v.carried && !v.heldBy && v.stage !== 'baby' && !(v.task && ['sleep', 'deliver', 'work_lamps', 'scene', 'see_off'].includes(v.task.a.id)) && !v.sulk;
ACTIONS.scene = { id: 'scene', label: 'Having a moment', icon: 'heart', sat: { lonely: -0.4, bored: -0.3 }, dur: 14, pose: 'stand', stages: AWAKE, queued: true, target: (v) => ({ x: v.x, y: v.y }) };

function tryScene(h) {
  if (Game.sceneOn || (Game.lastSceneAt != null && Game.time - Game.lastSceneAt < 240)) return;
  const folk = Game.villagers.filter(freeForScene);
  for (const S of SCENES.sort(() => Math.random() - 0.5)) {
    if (!S.when(h)) continue;
    for (const a of folk) for (const b of folk) {
      if (a === b || dist(a.x, a.y, b.x, b.y) > 90 || sceneSeen(a, b, S.id)) continue;
      let ok = false; try { ok = S.pair(a, b); } catch (e) { ok = false; }
      if (!ok) continue;
      return playScene(S, a, b);
    }
  }
}
function playScene(S, a, b) {
  Game.sceneOn = true; Game.lastSceneAt = Game.time;
  markScene(a, b, S.id);
  // they step together and face each other
  for (const v of [a, b]) { v.abort(); v.queue = []; }
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  a.facing = b.x >= a.x ? 'right' : 'left'; b.facing = a.x > b.x ? 'right' : 'left';
  for (const v of [a, b]) { v.task = { a: ACTIONS.scene, phase: 'do', target: { x: v.x, y: v.y }, t: 40, data: {}, before: { ...v.drives } }; v.pose = 'stand'; }
  const lines = S.lines(a, b);
  FX.hearts(mx, my - 26);
  lines.forEach(([who, text], i) => setTimeout(() => { if (Game.villagers.includes(who) && !who.inside) { const to = who === a ? b : a; who.say(text, 3.2, { to }); } }, 400 + i * 2600));
  setTimeout(() => {
    Game.sceneOn = false;
    try { S.after(a, b); } catch (e) { /* the moment passed */ }
    for (const v of [a, b]) if (v.task && v.task.a.id === 'scene') v.task.t = 1;
    chronicle(S.chron(a, b), S.id === 'rivals' ? 'quarrel' : S.id === 'homesick' ? 'rift' : 'love');
    const e = Game.log[0]; if (e) { e.at = [Math.round(mx), Math.round(my)]; renderLog(); }
  }, 400 + lines.length * 2600 + 300);
}

window.addEventListener('DOMContentLoaded', () => {
  const oh = onHour;
  onHour = function (h) { const r = oh(h); if (R.chance(0.5)) tryScene(h); return r; };
  // chronicle lines with a place: click to go there
  const rl = renderLog;
  renderLog = function () {
    rl();
    const ol = $('log'); if (!ol) return;
    const shown = (Game.logFilter && Game.logFilter !== 'all') ? null : Game.log.slice(0, 20);
    if (!shown) return;
    ol.querySelectorAll('li').forEach((li, i) => { const e = shown[i]; if (e && e.at) { li.classList.add('goto'); li.title = 'Click to see where'; li.addEventListener('click', () => { Game.follow = false; centerOn(e.at[0], e.at[1] - 10); }); } });
  };
  const nv = newVillage;
  newVillage = function () { Game.scenesSeen = []; Game.sceneOn = false; return nv(); };
});
