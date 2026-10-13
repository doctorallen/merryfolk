'use strict';
// ---------------------------------------------------------------------------
// The wizard's hearth. Playing as the wizard, you can ask a family you're on
// good terms with for a room, and if they'll have you, that hobbit-hole is
// your hearth: you sleep there instead of in the wagon (which stays parked as
// your store), you sup with them of an evening, and you follow their lives in
// the family book (each of them, what they wish for, who they're fond of,
// and what's happened to them since you came). As a friend of the family you
// can put in a good word: go and see your mother, take her some flowers, make
// it up with your brother. And when a stranger (rift-born, as often as not)
// is sleeping under a hedge, you can ask the family to take them in, and the
// supper table gets livelier: customs swapped, the odd sharp word to smooth
// over.
//
// Game.hearth: { home, since, family: [ids], log: [{ d, t }], supDay, lodger,
//                asked: { homeId: day }, lodgerAsked }
// ---------------------------------------------------------------------------

MOODLETS.hearth_supper = ['Supper with the wizard', 0.08, 720, ['The wizard ate four helpings. Four!', 'What a supper that was, with the wizard at the table.']];
MOODLETS.hearth_toast = ['A toast at supper', 0.06, 720, ['They raised a mug to me at supper. To me!']];
MOODLETS.drawn_out = ['The wizard listened to me', 0.1, 1440, ['The wizard asked me what I thought. And then he listened.']];
MOODLETS.taken_in = ['Taken in by the {x}s', 0.16, 2880, ['A bed, a door that shuts, and someone saying goodnight. I\'d forgotten.']];
MOODLETS.wizard_lodges = ['The wizard lodges with us', 0.08, 2880, ['We\'ve the wizard in the spare room! The neighbours are green.']];

function hearthState() { return Game.hearth || null; }
// The hole that keeps a room for him, if it's still a home.
function hearthHome() {
  const H = hearthState();
  if (!H) return null;
  const h = World.homes.find((x) => x.id === H.home);
  return h && h.built && residentsOf(h).length ? h : null;
}
function hearthFolk() { const h = hearthHome(); return h ? residentsOf(h) : []; }
function isHearthFolk(v) { const h = hearthHome(); return !!h && v.homeId === h.id; }
// play.js asks where he sleeps: the doorstep of his hearth, if he has one
function hearthBed() { const h = hearthHome(); return h ? { x: h.stepX, y: h.stepY } : null; }
function hearthLog(text) {
  const H = hearthState();
  if (!H) return;
  H.log = H.log || [];
  if (H.log.length && H.log[0].t === text) return;
  H.log.unshift({ d: Game.day, t: text.length > 160 ? text.slice(0, 157).replace(/\s\S*$/, '') + '…' : text });
  if (H.log.length > 30) H.log.length = 30;
}
const bandOf = (v) => (v.stage === 'baby' ? 'baby' : v.stage === 'elder' ? 'elder' : v.isChild() ? (kidBand(v) === 'youth' ? 'youngster' : 'little one') : 'grown-up');
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// --- Asking for a room ---------------------------------------------------------------
// They'll have him if they like him well enough, there's room, and the
// household is a welcoming sort; a wary or crusty one takes more winning.
function roomVerdict(v) {
  const h = v.home(), res = residentsOf(h), grown = res.filter((o) => o.isGrown());
  if (res.length >= HOME_CAP(h)) return { ok: false, why: 'full' };
  const welcome = grown.reduce((s, o) => s + o.genes.sociability, 0) / Math.max(1, grown.length);
  const crust = grown.filter((o) => temperOf(o) === 'ornery').length * 0.12;
  const score = regardOf(v) * 1.4 + welcome * 0.45 - crust - res.length * 0.04 + hash2(v.id, Game.day) * 0.15;
  return { ok: score > 0.45, score };
}
function takeRoom(v) {
  const h = v.home();
  Game.hearth = { home: h.id, since: Game.day, family: residentsOf(h).map((o) => o.id), log: [], supDay: 0, lodger: null, asked: {}, lodgerAsked: 0 };
  chronicle(`The household at ${h.name} has made up the spare room for the wizard. ${v.first} has aired the sheets twice.`, 'love');
  for (const o of residentsOf(h)) { feel(o, 'wizard_lodges'); addRegard(o, 0.05); metAtHearth(o); }
}
// living under one roof, he has met everyone in it
function metAtHearth(o) { const m = Game.wizMet || (Game.wizMet = {}); if (!m[o.id]) m[o.id] = Game.day; }
addTalkOption({
  id: 'room', order: 70, label: 'Might I trouble you for a room?',
  when: (v) => playMode() && !hearthHome() && v.isGrown() && v.homeId >= 0 && v.home().built && regardOf(v) >= 0.12 && ((Game.hearthAsked || {})[v.homeId] || 0) !== Game.day,
  run: (v, T) => {
    T.wiz(R.pick(['I wonder, might I trouble you for a room? A wagon bed is a hard bed for old bones.', 'Would your household have room for an old wanderer, now and then?']));
    const r = roomVerdict(v);
    (Game.hearthAsked || (Game.hearthAsked = {}))[v.homeId] = Game.day;
    if (r.ok) {
      T.reply(R.pick(['A room? For you? Well, I never. Of course you can! I\'ll air the sheets.', 'You\'d be very welcome. The little ones will be beside themselves.', 'Our spare room\'s yours whenever you\'re in the valley. Mind the low beam.']));
      takeRoom(v);
    } else if (r.why === 'full') T.reply(R.pick(['Oh, I would, I truly would. But we\'re packed to the rafters as it is.', 'There\'s not a spare inch. The children sleep two to a drawer.']));
    else T.reply(R.pick(['Well... I\'d have to ask the others. Let\'s see how we go, shall we?', 'Hmm. Perhaps. When we know you a little better.', 'I don\'t think it would suit, just now. No offence meant.']));
  },
});

// --- The family book -------------------------------------------------------------------
function whatTheydLove(v) {
  const w = wishesOf(v)[0];
  if (w && WISHES[w.k]) { const W = WISHES[w.k]; return W.hint ? `${wishText(w)} (${lowerFirst(W.hint)})` : wishText(w); }
  if (v.isChild()) return R.pick(['A story before bed', 'A squib, and someone to watch it go bang']);
  const likes = typeof likesOf === 'function' ? likesOf(v) : [];
  if (likes.length && LIKES[likes[0]]) return `Anything to do with ${LIKES[likes[0]]}`;
  return `A plate of ${FOODS[v.favouriteFood()].label}`;
}
function notableTies(v, res) {
  const out = [];
  const sp = v.spouse && Game.villagers.find((o) => o.id === v.spouse);
  if (sp) out.push(`Married to ${sp.first}`);
  else { const sw = sweetheartOf(v); if (sw) out.push(`Sweet on ${sw.first}`); }
  let best = null, bs = 0.35;
  for (const o of Game.villagers) { if (o === v || res.includes(o) || o.stage === 'baby') continue; const r = v.rel[o.id] || 0; if (r > bs) { bs = r; best = o; } }
  if (best) out.push(`Best friend: ${best.first}`);
  for (const o of Game.villagers) {
    if (o === v) continue;
    const s = sentimentsOf(v, o)[0];
    if (s && SENT[s.tag]) { out.push(`${SENT[s.tag][0]} towards ${o.first} (${s.why})`); break; }
  }
  const rv = typeof rivalOf === 'function' ? rivalOf(v) : null;
  if (rv) out.push(`Rivals with ${rv.first}`);
  return out;
}
function lodgerPage(v) {
  const bits = [];
  if (v.arc) {
    bits.push(`Misses ${v.arc.home}.`);
    if (v.arc.lost) bits.push(v.arc.lost.found ? `Found ${v.arc.lost.name}, ${v.pron.their} ${v.arc.lost.rel}, again.` : `Still hoping for news of ${v.arc.lost.name}, ${v.arc.lost.rel === 'friend' ? 'a friend' : v.pron.their + ' ' + v.arc.lost.rel}.`);
  } else bits.push('A newcomer to the valley, still finding their feet.');
  const S = typeof story === 'function' ? story() : null;
  if (S) {
    const learned = Object.keys(S.customs || {}).filter((k) => CUSTOMS[k] && CUSTOMS[k].from === 'hill' && S.customs[k].knowers.includes(v.id)).map((k) => CUSTOMS[k].name);
    if (learned.length) bits.push(`Has learned to like ${learned.join(' and ')}.`);
  }
  let best = null, bs = 0;
  for (const o of Game.villagers) { if (o === v || o.stage === 'baby') continue; const r = v.rel[o.id] || 0; if (r > bs) { bs = r; best = o; } }
  if (best) bits.push(`Closest to ${best.first}.`);
  return bits.join(' ');
}
function openFamilyBook() {
  const h = hearthHome();
  if (!h) return;
  const H = hearthState(), res = hearthFolk().sort((a, b) => b.age - a.age);
  const card = (v) => {
    const lodger = H.lodger === v.id;
    const wish = wishesOf(v)[0];
    const ties = notableTies(v, res);
    const dream = v.dream && DREAMS[v.dream.k] ? `${dreamText(v.dream)} (${Math.round(dreamProgress(v) * 100)}%)` : '';
    return `<div class="fb-card${lodger ? ' lodger' : ''}"><canvas class="fb-por" data-v="${v.id}" width="60" height="80"></canvas><div class="fb-txt">
      <p class="fb-name">${escapeHtml(v.name())}${lodger ? ' <span class="fb-tag">your lodger</span>' : ''}</p>
      <p class="fb-sub">${bandOf(v)}${v.job && JOBS[v.job] ? ', ' + JOBS[v.job].label.toLowerCase() : ''} · ${v.stage === 'baby' ? 'contented' : escapeHtml(v.moodWord().toLowerCase())} · ${escapeHtml(regardWord(v).toLowerCase())}</p>
      ${v.stage === 'baby' ? '' : `<p><b>Wish:</b> ${wish ? escapeHtml(lowerFirst(wishText(wish))) : 'nothing in particular'}${dream ? `<br><b>Dream:</b> to ${escapeHtml(lowerFirst(dream))}` : ''}</p>`}
      ${ties.length ? `<p>${ties.map(escapeHtml).join(' · ')}</p>` : ''}
      ${lodger ? `<p>${escapeHtml(lodgerPage(v))}</p>` : ''}
      ${v.stage === 'baby' ? '' : `<p class="fb-love">Would love: ${escapeHtml(lowerFirst(whatTheydLove(v)))}</p>`}
    </div></div>`;
  };
  const log = (H.log || []).slice(0, 10).map((l) => `<li><span>Day ${l.d}</span> ${escapeHtml(l.t)}</li>`).join('');
  Sheet.open({
    kind: 'book', title: `The family at ${h.name}`, sub: `Your hearth since day ${H.since}`,
    html: `<div class="fb">${res.map(card).join('')}</div>${log ? `<h3 class="fb-h">Since you came</h3><ol class="fb-log">${log}</ol>` : ''}`,
    choices: [{ label: 'Close the book', back: true, run: () => Sheet.close(true) }],
  });
  for (const cv of document.querySelectorAll('#sheet-body canvas.fb-por')) {
    const v = Game.villagers.find((o) => o.id === +cv.dataset.v);
    if (v) drawPortrait(cv, v.genes, v.stage, false, v.look ? v.look() : {});
  }
  $('sheet-body').scrollTop = 0;
}

// --- Supper at the hearth ----------------------------------------------------------------
const TABLE_TALK = {
  cheerful: ['Pass the potatoes, and don\'t be shy with them!', 'Isn\'t this nice? All of us round the one table.'],
  ornery: ['Who salted this? Too much salt.', 'Elbows, {other}. Elbows.'],
  shy: ['...This is nice.', '*passes the bread without being asked*'],
  curious: ['Gandalf, is it true the Big Folk eat sitting on chairs as tall as a hobbit?', 'What do they eat in the mountains? Rocks?'],
  dreamy: ['I saw a heron at the pond today. Just standing there. I stood too, for a bit.', 'Doesn\'t the lamp make everything look golden?'],
  witty: ['If the wizard eats like last time, we\'ll be out of pie till Thursday.', 'I\'ve hidden the good jam. Don\'t look at me like that, {other}.'],
  proud: ['That\'s my own carrot, that is. Grew it myself.', 'Best stew in the lane, this. Ask anyone.'],
  gloomy: ['Rain tomorrow. I can feel it in my knee.', 'Last of the cheese. Well. All good things.'],
  elder: ['In my day, wizards knocked.', 'When I was a lad we had a wizard to supper and he turned the soup purple. Lovely soup.'],
  child: ['Can we have a story? The dragon one? Please?', 'I learned my letters up to M!', '{other} kicked me under the table!', 'Is there pudding? Say there\'s pudding.'],
  rift: ['Back home, supper came out of a slot in the wall.', 'What is this green thing? It\'s... very alive.', 'We used to eat on the roof, under the neon. You could see the whole city.'],
};
const CLASH_LINES = ['Do they not have table manners where you come from, {lodger}?', 'Must you keep that blinking thing on at supper, {lodger}?', 'In this house we say grace to the cook, {lodger}. Not to the lamp.'];
function tableLine(v, others, used = new Set()) {
  const pool = v.isRiftborn && v.isRiftborn() && R.chance(0.6) ? TABLE_TALK.rift : v.isChild() ? TABLE_TALK.child : v.stage === 'elder' && R.chance(0.5) ? TABLE_TALK.elder : TABLE_TALK[temperOf(v)] || TABLE_TALK.cheerful;
  const o = R.pick(others.filter((x) => x !== v && x.stage !== 'baby')) || v;
  // (two of a temper at one table don't say the same thing)
  const line = R.pick(pool.filter((t) => !used.has(t)).concat(pool.every((t) => used.has(t)) ? pool : []));
  used.add(line);
  return line.replace('{other}', o.first);
}
// a custom passed across the table, and which one it was
function swapCustom(a, b) {
  if (typeof teachCustom !== 'function') return null;
  const S = story(), before = new Set(Object.keys(S.customs).filter((k) => S.customs[k].knowers.includes(b.id)));
  teachCustom(a, b);
  const k = Object.keys(S.customs).find((x) => S.customs[x].knowers.includes(b.id) && !before.has(x));
  return k ? CUSTOMS[k] : null;
}
const nearHearth = (w) => { const h = hearthHome(); return !!h && dist(w.fx, w.fy, h.stepX, h.stepY) < 40; };
function startSupper() {
  const w = wizardOf(), h = hearthHome(), H = hearthState();
  if (!w || !h || H.supDay === Game.day || Play.supper) return;
  const res = hearthFolk().filter((v) => v.stage !== 'baby' && !v.leaving);
  if (!res.length) return;
  for (const v of res) metAtHearth(v);
  w.fpath = null; w.doing = 'indoors'; w.fx = h.stepX; w.fy = h.stepY; h.doorAnim = 6;
  Play.heldSpeed = Game.speedIdx || Play.heldSpeed || 1; setSpeed(0);
  const host = res.filter((v) => v.isGrown()).sort((a, b) => b.age - a.age)[0] || res[0];
  const lodger = res.find((v) => v.id === H.lodger);
  const lines = [];
  const say = (v, text) => lines.push({ who: v ? v.first : null, text });
  const dish = R.pick(World.season === 'winter' ? ['a pot of mutton stew', 'pease pudding and a ham'] : World.season === 'autumn' ? ['mushroom pie', 'roast pumpkin and new bread'] : ['new potatoes and a cold pie', 'a heap of buttered carrots and a ham']);
  say(null, `${host.first} has laid a place for you at the head of the table. There's ${dish}, and a jug of the good ale.`);
  const talkers = res.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(3, res.length));
  const used = new Set();
  for (const v of talkers) say(v, tableLine(v, res, used));
  const S = { res, host, lodger, lines, clash: null, done: false };
  // a lodger brings a custom to the table, or takes one away
  if (lodger) {
    const hill = res.filter((v) => v !== lodger && !v.isRiftborn());
    const o = R.pick(hill);
    if (o) {
      const fromL = R.chance(0.5), c = fromL ? swapCustom(lodger, o) : swapCustom(o, lodger);
      if (c) { const t = fromL ? lodger : o, l = fromL ? o : lodger; say(null, `${t.first} is teaching ${l.first} ${c.name}.`); say(t, c.line); }
    }
    const wary = hill.filter((v) => v.isGrown() && (riftWary(v) > 0.12 || temperOf(v) === 'ornery')).sort((a, b) => riftWary(b) - riftWary(a))[0];
    if (wary && R.chance(0.5)) { S.clash = wary; say(wary, R.pick(CLASH_LINES).replace('{lodger}', lodger.first)); }
  }
  Play.supper = S;
  renderSupper();
}
function renderSupper() {
  const S = Play.supper;
  if (!S) return;
  const h = hearthHome();
  const html = `<div class="sp-scene">${S.lines.slice(-6).map((l) => (l.who ? `<p class="tk-line them"><b>${escapeHtml(l.who)}</b> ${escapeHtml(l.text)}</p>` : `<p class="sp-narr">${escapeHtml(l.text)}</p>`)).join('')}</div>`;
  let choices;
  if (S.done) choices = [{ label: 'Thank them for supper, and push back your chair', primary: true, run: endSupper }];
  else if (S.clash) {
    const a = S.clash, L = S.lodger;
    choices = [
      { label: `Take ${escapeHtml(L.first)}'s part`, run: () => { S.lines.push({ who: 'You', text: `Every house has its ways, ${a.first}. ${L.first} is learning ours, and I dare say we could learn a thing or two from theirs.` }); S.lines.push({ who: L.first, text: R.pick(['...Thank you.', 'Full signal. I mean: thank you.']) }); L.bond(a, 0.01); if (S.host !== a) addSentiment(L, S.host, 'welcomed', 'supper together'); addRegard(L, 0.08); addRegard(a, -0.03); S.clash = null; S.done = true; renderSupper(); } },
      { label: 'Make a joke of it', run: () => { const good = ['cheerful', 'witty'].includes(temperOf(a)); S.lines.push({ who: 'You', text: 'Manners! At a table with me on it? I once saw a dwarf eat a whole ham with his beard.' }); S.lines.push({ who: a.first, text: good ? 'Ha! Go on, then. Tell it properly.' : 'Hmph. That\'s different. Dwarves are different.' }); if (good) { a.bond(L, 0.05); L.bond(a, 0.05); } addRegard(a, good ? 0.04 : 0); S.clash = null; S.done = true; renderSupper(); } },
      { label: 'Change the subject', run: () => { S.lines.push({ who: 'You', text: 'Now, who\'s going to tell me what\'s been happening in the lanes?' }); S.lines.push({ who: S.host.first, text: 'Oh, where do I start!' }); S.clash = null; S.done = true; renderSupper(); } },
    ];
  } else {
    const kids = S.res.filter((v) => v.isChild());
    const quiet = S.res.filter((v) => !v.isChild()).sort((a, b) => a.mood() - b.mood() || a.genes.sociability - b.genes.sociability)[0];
    const toastFor = S.res.find((v) => (hearthState().log || []).some((l) => l.d >= Game.day - 2 && l.t.includes(v.first))) || S.host;
    choices = [];
    if (quiet) choices.push({ label: `Draw out ${escapeHtml(quiet.first)}`, run: () => {
      S.lines.push({ who: 'You', text: `You're quiet tonight, ${quiet.first}. What's on your mind?` });
      const m = quiet.memories && quiet.memories.find((x) => x.v !== undefined);
      S.lines.push({ who: quiet.first, text: m ? `Oh... ${lowerFirst(m.t)}` : R.pick(['Nothing much. ...Well. Since you ask.', 'I was just thinking how nice this is.']) });
      feel(quiet, 'drawn_out'); addRegard(quiet, 0.06); for (const o of S.res) if (o !== quiet) o.bond(quiet, 0.02);
      S.done = true; renderSupper();
    } });
    if (kids.length) choices.push({ label: 'A story for the children', run: () => {
      const k = R.pick(Object.keys(WIZARD_TALES).filter(taleOpen));
      S.lines.push({ who: 'You', text: `Very well. Have I told you ${WIZARD_TALES[k].x.replace(/^of /, 'about ')}?` });
      for (const c of kids) { c.drives.bored = Math.max(0, c.drives.bored - 0.4); learn(c, 0.008, 'school'); addRegard(c, 0.05); feel(c, 'wizard_tale', WIZARD_TALES[k].x); }
      S.lines.push({ who: R.pick(kids).first, text: R.pick(['Again! Tell it again!', 'Was it a REALLY big one?', 'I wasn\'t scared. Much.']) });
      S.done = true; renderSupper();
    } });
    if (S.lodger) choices.push({ label: `Ask ${escapeHtml(S.lodger.first)} about home`, run: () => {
      const L = S.lodger;
      S.lines.push({ who: 'You', text: `Tell us about home, ${L.first}. What do you miss?` });
      S.lines.push({ who: L.first, text: L.arc ? `${L.arc.home.charAt(0).toUpperCase() + L.arc.home.slice(1)}. I didn't think I'd miss it. I do.` : 'Everything, some days. Less, other days.' });
      L.drives.lonely = Math.max(0, L.drives.lonely - 0.3); addRegard(L, 0.06); for (const o of S.res) if (o !== L) o.bond(L, 0.03);
      S.done = true; renderSupper();
    } });
    choices.push({ label: `Raise a toast to ${escapeHtml(toastFor.first)}`, run: () => {
      S.lines.push({ who: 'You', text: `To ${toastFor.first}! And to this table, and everyone at it.` });
      S.lines.push({ who: R.pick(S.res).first, text: R.pick(['Hear, hear!', 'To ' + toastFor.first + '!', '*clink*']) });
      feel(toastFor, 'hearth_toast'); for (const o of S.res) feel(o, 'hearth_supper');
      S.done = true; renderSupper();
    } });
  }
  Sheet.open({ kind: 'supper', title: `Supper at ${h ? h.name : 'home'}`, sub: `${S.res.length + 1} round the table`, html, choices, onClose: endSupper });
}
function endSupper() {
  const S = Play.supper;
  if (!S) return;
  Play.supper = null;
  // (counted as had once it's eaten, so a supper cut short by leaving the page can be had again)
  const H = hearthState(); if (H) H.supDay = Game.day;
  for (const v of S.res) {
    v.drives.hunger = Math.max(0, v.drives.hunger - 0.3); v.drives.lonely = Math.max(0, v.drives.lonely - 0.2);
    feel(v, 'hearth_supper'); addRegard(v, 0.02);
    for (const o of S.res) if (o !== v) v.bond(o, 0.01);
  }
  hearthLog(`Supper at the table${S.lodger ? `, with ${S.lodger.first}` : ''}.`);
  Sheet.close(true);
  // an hour round the table, then out into the evening
  for (let i = 0; i < 120; i++) simulate(0.5);
  const w = wizardOf(), h = hearthHome();
  if (w) { w.doing = 'player'; if (h) { w.fx = h.stepX; w.fy = h.stepY + 6; h.doorAnim = 6; } }
  setSpeed(Play.heldSpeed || 1);
  Game.follow = true;
}

// --- A word in the right ear --------------------------------------------------------------
ACTIONS.whisper_visit = {
  label: 'Taking the wizard\'s advice', icon: 'heart', sat: { lonely: -0.4, bored: -0.15 }, dur: 15, pose: 'stand', social: true, pair: true, queued: true, stages: AWAKE,
  target: (v, h, extra) => (extra && extra.to && Game.villagers.includes(extra.to) && !extra.to.inside ? { other: extra.to, kind: extra.kind } : null),
  label2: (v) => (v.task && v.task.target && v.task.target.other ? `Off to see ${v.task.target.other.first}, as the wizard suggested` : 'Taking the wizard\'s advice'),
  meet: (v, o, task) => {
    const k = task.target.kind;
    if (k === 'flowers') {
      v.say(R.pick(['These are for you.', 'I picked these. Well. The wizard said I should.']), 2.6); o.say(R.pick(['For me? Oh!', 'You daft thing. They\'re lovely.']), 2.6);
      FX.hearts((v.x + o.x) / 2, Math.min(v.y, o.y) - 16); feel(o, 'flowers', v.first); v.bond(o, 0.06);
    } else if (k === 'mend') {
      v.say(R.pick(['I\'m sorry. About before.', 'Can we put it behind us?']), 2.8); o.say(R.pick(['...Yes. I\'d like that.', 'I\'ve been a fool too.']), 2.8);
      for (const [a, b] of [[v, o], [o, v]]) { if (a.sent && a.sent[b.id]) a.sent[b.id] = a.sent[b.id].filter((s) => SENT[s.tag][1] > 0); addSentiment(a, b, 'fond', 'making it up'); }
      v.bond(o, 0.08);
    } else if (k === 'welcome') {
      v.say(R.pick(['You\'re one of us now, you know.', 'If you need anything, you only have to say.']), 2.8); o.say(R.pick(['...Thank you. Really.', 'Full signal.']), 2.4);
      addSentiment(o, v, 'welcomed', 'made me feel at home'); v.bond(o, 0.06);
    } else {
      v.say(R.pick(['I was passing. Thought I\'d look in.', 'How are you keeping?', 'I\'ve missed you, you know.']), 2.6); o.say(R.pick(['Well, this is a nice surprise!', 'Come here, you.']), 2.6);
      v.bond(o, 0.06); addSentiment(o, v, 'fond', 'came to see me');
    }
    v.remember(`The wizard said I should go and see ${o.first}. I'm glad I did.`, 1);
    v.whisperDue = null;
  },
};
ACTIONS.whisper_visit.id = 'whisper_visit';
ACTION_NAMES.whisper_visit = 'The wizard\'s suggestions';
function whisperOptions(v) {
  const res = hearthFolk(), out = [];
  const add = (o, kind, label) => { if (o && o !== v && Game.villagers.includes(o) && !o.leaving && o.stage !== 'baby' && !out.some((x) => x.o === o)) out.push({ o, kind, label }); };
  for (const pid of v.parents) { const p = Game.villagers.find((o) => o.id === pid); if (p && p.homeId !== v.homeId) add(p, 'kin', `Go and see your ${p.genes.sex === 'f' ? 'mother' : 'father'}, ${p.first}`); }
  const sw = sweetheartOf(v), sp = v.spouse && Game.villagers.find((o) => o.id === v.spouse);
  if ((sw || sp) && World.season !== 'winter') add(sw || sp, 'flowers', `Take ${(sw || sp).first} some flowers`);
  for (const o of Game.villagers) { if (o === v) continue; const hurt = sentimentsOf(v, o).some((s) => SENT[s.tag][1] < 0) || (v.rel[o.id] || 0) < -0.15; if (hurt) { add(o, 'mend', `Make it up with ${o.first}`); break; } }
  const H = hearthState(), L = H && H.lodger != null && Game.villagers.find((o) => o.id === H.lodger);
  if (L && L !== v && res.includes(L)) add(L, 'welcome', `Make ${L.first} feel at home`);
  for (const o of Game.villagers) { if (o === v || !o.parents.length || !v.parents.length || !o.parents.some((p) => v.parents.includes(p))) continue; add(o, 'kin', `Be kind to your ${o.genes.sex === 'f' ? 'sister' : 'brother'}, ${o.first}`); }
  let best = null, bs = 0.3;
  for (const o of Game.villagers) { if (o === v || res.includes(o) || o.stage === 'baby') continue; const r = v.rel[o.id] || 0; if (r > bs) { bs = r; best = o; } }
  if (best) add(best, 'kin', `Look in on ${best.first}`);
  return out.slice(0, 4);
}
addTalkOption({
  id: 'whisper', order: 55, label: 'Put in a good word…',
  when: (v) => playMode() && isHearthFolk(v) && v.stage !== 'baby' && whisperOptions(v).length > 0,
  run: (v, T) => {
    T.choices(whisperOptions(v).map((x) => ({
      label: escapeHtml(x.label),
      run: () => {
        T.wiz(x.label.replace(/^./, (c) => c) + (x.label.endsWith('?') ? '' : '. It would do you both good.'));
        const take = 0.55 + regardOf(v) * 0.7 - (temperOf(v) === 'ornery' ? 0.25 : 0) + (v.isChild() ? 0.15 : 0);
        if (Math.random() < take) {
          T.reply(R.pick([`You're right. I'll go and see ${x.o.first}.`, `I will. I've been meaning to.`, `Now? ...All right. Now.`]));
          v.queue.unshift({ a: ACTIONS.whisper_visit, extra: { to: x.o, kind: x.kind } });
          // (and if the other's indoors just now, they'll try again later in the day)
          v.whisperDue = { to: x.o.id, kind: x.kind, until: Game.time + 12 * 60 };
          v.noteDecision('whisper_visit', 'the wizard suggested it', []);
          addRegard(v, 0.02);
        } else T.reply(R.pick(['Hmph. I\'ll see to my own affairs, thank you.', 'Maybe. Not today.', 'You don\'t know the half of it.']));
      },
    })));
  },
});

// --- Taking in a stranger ------------------------------------------------------------------
function homelessStranger() {
  return Game.villagers.filter((v) => v.homeId < 0 && v.isGrown() && !v.leaving && !v.carried).sort((a, b) => (b.isRiftborn() ? 1 : 0) - (a.isRiftborn() ? 1 : 0))[0] || null;
}
addTalkOption({
  id: 'lodger', order: 72,
  label: (v) => { const g = homelessStranger(); return g ? `There's ${g.isRiftborn() ? 'a young one from the rifts' : 'a stranger'} sleeping under the hedge…` : 'A stranger…'; },
  when: (v) => {
    const H = hearthState(), h = hearthHome();
    return playMode() && h && isHearthFolk(v) && v.isGrown() && !(H.lodger != null && Game.villagers.some((o) => o.id === H.lodger && o.homeId === h.id)) && H.lodgerAsked !== Game.day && residentsOf(h).length < HOME_CAP(h) && !!homelessStranger();
  },
  run: (v, T) => {
    const g = homelessStranger(), h = hearthHome(), H = hearthState();
    H.lodgerAsked = Game.day;
    T.wiz(`There's ${g.first}, ${g.isRiftborn() ? 'one of the rift-folk, ' : ''}sleeping under the hedge by the lane. I wondered... your house has a big heart, and a box room.`);
    const grown = residentsOf(h).filter((o) => o.isGrown());
    const score = regardOf(v) * 1.2 + grown.reduce((s, o) => s + o.genes.sociability - (g.isRiftborn() ? riftWary(o) * 0.8 : 0), 0) / Math.max(1, grown.length) * 0.6 + (v.rel[g.id] || 0) * 0.5;
    if (score > 0.4) {
      T.reply(R.pick([`Under the hedge? In this weather? Bring them in, for goodness' sake.`, `Well. We've a box room full of jam. The jam can go in the cellar.`]));
      moveHome(g, h);
      H.lodger = g.id;
      if (!H.family.includes(g.id)) H.family.push(g.id);
      metAtHearth(g);
      g.bond(v, 0.15); v.bond(g, 0.08);
      feel(g, 'taken_in', v.surname); addRegard(g, 0.1);
      g.remember(`The ${v.surname}s took me in. The wizard asked them to.`, 3);
      chronicle(`The household at ${h.name} has taken in ${g.name()}${g.isRiftborn() ? ', one of the rift-folk,' : ''} who was sleeping rough. The wizard asked, and ${v.first} said yes before anyone else could say no.`, g.isRiftborn() ? 'rift' : 'love');
    } else T.reply(R.pick(['Oh, I don\'t know. A stranger, in the house? Let me think on it.', 'We\'re not ready for that. Not yet.', 'Ask me again when we know them a little.']));
  },
});

// --- Comings and goings -----------------------------------------------------------------------
// Each morning: the household's names, and what to do if the hole has emptied.
function hearthDaily() {
  const H = hearthState();
  if (!H) return;
  const h = hearthHome();
  if (h) { H.family = residentsOf(h).map((o) => o.id); if (H.lodger != null && !Game.villagers.some((o) => o.id === H.lodger && o.homeId === h.id)) H.lodger = null; return; }
  // the family has moved: follow them if most of them went to one hole
  const moved = H.family.map((id) => Game.villagers.find((o) => o.id === id)).filter((o) => o && o.homeId >= 0);
  const counts = {};
  for (const o of moved) counts[o.homeId] = (counts[o.homeId] || 0) + 1;
  const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const nh = best != null && World.homes.find((x) => x.id === +best && x.built);
  if (nh) {
    H.home = nh.id;
    chronicle(`Your family has moved to ${nh.name}, and kept a room for you there.`, 'love');
    hearthLog(`The family moved to ${nh.name}.`);
  } else {
    chronicle('The hole where you had a room stands empty now. Back to the wagon, for the time being.', 'info');
    Game.hearth = null;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  registerField('hearth', null, { nullish: true });
  registerField('hearthAsked', {});
  addWizardAction({
    id: 'supper', order: 14, icon: 'stew',
    label: () => { const h = hearthHome(); return h && nearHearth(wizardOf()) ? 'Sup with the family' : 'Home for supper'; },
    primary: () => true,
    when: () => { const w = wizardOf(), H = hearthState(); return !!w && !!hearthHome() && H.supDay !== Game.day && Game.hour >= 17.5 && Game.hour < 20.5 && !(Game.party.on && Game.party.feast); },
    run: () => { const w = wizardOf(), h = hearthHome(); if (nearHearth(w)) startSupper(); else wizWalkTo(h.stepX, h.stepY, { kind: 'supper', run: () => startSupper() }); },
  });
  addWizardAction({ id: 'family', order: 85, icon: 'house', label: () => 'Family', when: () => !!wizardOf() && !!hearthHome(), run: openFamilyBook });
  // the milestones of his family, as the Chronicle tells them
  patch(window, 'chronicle', (ch) => function (text, kind) {
    const r = ch.apply(this, arguments);
    try {
      if (hearthState() && typeof text === 'string' && ['love', 'birth', 'party', 'adventure', 'letter', 'rift', 'build', 'sick'].includes(kind)) {
        // their full names, and first names nobody outside the family shares
        const fam = hearthFolk(), names = fam.map((v) => v.name()).concat(fam.filter((v) => !Game.villagers.some((o) => o.first === v.first && !fam.includes(o))).map((v) => v.first));
        if (names.some((n) => new RegExp(`\\b${n}\\b`).test(text)) && !/^Supper at/.test(text)) hearthLog(text);
      }
    } catch (e) { /* the log is a nicety */ }
    return r;
  }, 'hearth');
  // he sleeps indoors at his hearth: the door swings as he goes in and comes out
  patch(window, 'sleepTillMorning', (stm) => function () {
    const h = hearthHome(), w = wizardOf();
    if (!h && w && !Game.hearthHinted) { Game.hearthHinted = true; toast('A wagon bed is a hard bed. A family you\'re on good terms with might give you a room: ask them.', 'info'); }
    if (h) h.doorAnim = 6;
    const p = stm.apply(this, arguments);
    if (p && p.then) p.then(() => { const hh = hearthHome(); if (hh) hh.doorAnim = 6; });
    return p;
  }, 'hearth');
  // a save made at the table wakes up outside on the step
  patch(window, 'load', (ld) => function () { const r = ld.apply(this, arguments); const w = wizard(); if (w && w.doing === 'indoors') w.doing = 'player'; Play.supper = null; return r; }, 'hearth');
  addHook('onHour', (h) => { if (h === 7) hearthDaily(); });
  // a visit the wizard suggested that didn't come off (they were indoors) is tried again
  addHook('onHour', () => {
    for (const v of Game.villagers) {
      const d = v.whisperDue;
      if (!d) continue;
      const o = Game.villagers.find((x) => x.id === d.to);
      if (!o || o.leaving || v.leaving || Game.time > d.until) { v.whisperDue = null; continue; }
      if (!(v.task && v.task.a.id === 'whisper_visit') && !v.queue.some((q) => q.a.id === 'whisper_visit')) v.queue.push({ a: ACTIONS.whisper_visit, extra: { to: o, kind: d.kind } });
    }
  });
  addHook('newVillage', () => { Game.hearth = null; Game.hearthAsked = {}; });
});
