'use strict';
// ---------------------------------------------------------------------------
// Playing as the wizard. In a village started this way (Game.mode 'wizard')
// you aren't the Steward or a giant hand: you are the grey wizard, walking
// the valley on your own two feet. Tap the ground and he walks there; tap a
// hobbit and he goes over for a word, and a sheet comes up with what they
// say and what you might say back. Folk remember how you treat them (his
// regard with each, Game.wizRel). Bigger doings sit on a bar of buttons at
// the bottom of the screen: tell a tale beneath the great tree, light the
// fireworks at a party, sleep till morning. The village runs itself on the
// Steward's defaults.
//
// Built phone first: in a tall window the sheet rises from the bottom within
// reach of a thumb, and the camera keeps the wizard and whoever he's talking
// to in the part of the screen above it; in a wide one it docks at the side.
//
// Other files add to it through three registries:
//   addTalkOption({ id, order, label(v, T), when(v, T), run(v, T) })
//       a line the wizard can say in a conversation. T is the talk: T.wiz(text)
//       has him say something, T.reply(text) has them answer, T.choices([...])
//       offers a follow-up menu ({ label, run }), T.end() closes it.
//   addWizardAction({ id, order, label(), icon, when(), run() })
//       a button on the bar.
//   Sheet.open({ title, sub, html, choices, onClose }) for any other page.
// ---------------------------------------------------------------------------

const playMode = () => Game.mode === 'wizard';
const Play = { talk: null, marker: null, sheet: null, held: null, skipping: false };

const TalkOptions = [];
function addTalkOption(o) { TalkOptions.push({ order: 50, ...o }); TalkOptions.sort((a, b) => a.order - b.order); }
const WizardActions = [];
function addWizardAction(o) { WizardActions.push({ order: 50, icon: '', ...o }); WizardActions.sort((a, b) => a.order - b.order); }

MOODLETS.wizard_talk = ['Had a word with the wizard', 0.06, 600, ['The wizard stopped to talk to me! Me!', 'He knew my name. Imagine.']];
MOODLETS.wizard_gift = ['A present from the wizard: {x}', 0.12, 1440, ['The wizard gave me a present. I shall keep it for ever.']];
MOODLETS.wizard_snub = ['The wizard was short with me', -0.06, 480, ['Wizards. No manners.']];

// --- His regard for each hobbit, and theirs for him --------------------------------
function regardOf(v) { return ((Game.wizRel || (Game.wizRel = {}))[v.id]) || 0; }
function addRegard(v, d) { const r = Game.wizRel || (Game.wizRel = {}); r[v.id] = clamp((r[v.id] || 0) + d, -1, 1); }
function regardWord(v) {
  const r = regardOf(v), met = (Game.wizMet || {})[v.id];
  if (!met) return 'Never met you';
  return r > 0.6 ? 'Devoted to you' : r > 0.35 ? 'Fond of you' : r > 0.12 ? 'Glad to see you' : r > -0.1 ? 'Knows you to nod to' : r > -0.35 ? 'Wary of you' : 'Can\'t abide you';
}
function wizardOf() { const w = wizard(); return w && w.phase === 'here' ? w : null; }

// --- The wizard's pack: small presents to hand out, filled again each morning ----------
const PACK = {
  cake: { label: 'a seed-cake', icon: 'cake', max: 3, give: (v) => { v.drives.hunger = Math.max(0, v.drives.hunger - 0.35); wishEvent(v, 'act:eat_item'); return v.isChild() ? 'Cake! For me? Thank you, thank you!' : 'Seed-cake! Oh, you shouldn\'t have. ...I\'m glad you did.'; } },
  leaf: { label: 'a pouch of pipe-weed', icon: 'leaf', max: 2, ok: (v) => v.isGrown(), give: (v) => { v.drives.pipe = Math.max(0, (v.drives.pipe || 0) - 0.5); return R.pick(['Old Toby! The real thing! You\'re a gentleman.', 'Now that is a fine-smelling leaf.']); } },
  book: { label: 'a storybook', icon: 'book', max: 2, give: (v) => { learn(v, 0.02, 'school'); v.drives.bored = Math.max(0, v.drives.bored - 0.3); wishEvent(v, 'act:read_item'); return v.isChild() ? 'A book! Has it got dragons in? It has! Look!' : 'A new book. I shall read it by the fire tonight.'; } },
  squib: { label: 'a squib', icon: 'spark', max: 4, ok: (v) => !v.isGrown() || v.genes.merriness > 0.5, give: (v) => { FX.sparkle(v.x, v.y - 18, R.pick(['#ff8ae0', '#6ad0ff', '#ffd34a'])); FX.sparkle(v.x, v.y - 18, '#ffffff'); Sound.boom(); wishEvent(v, 'fireworks'); v.drives.bored = Math.max(0, v.drives.bored - 0.4); return v.isChild() ? 'BANG! Again! Do it again!' : 'Ha! I haven\'t had a squib since I was a lad.'; } },
};
function packOf() { return Game.wizPack || (Game.wizPack = refillPack()); }
function refillPack() { const p = {}; for (const k in PACK) p[k] = PACK[k].max; return p; }

// --- Getting about ----------------------------------------------------------------------
// Walk to a point, then do whatever the goal says when he gets there.
function wizWalkTo(x, y, goal = null) {
  const w = wizardOf();
  if (!w || Play.skipping) return false;
  const p = wizPath({ x: w.fx, y: w.fy }, { x, y });
  if (!p) { toast('He can\'t find a way there.', 'info'); return false; }
  if (w.doing === 'tale' && Game.time < (w.taleUntil || 0)) { w.taleUntil = 0; wizSay('Ah, but that is a story for another day.'); }
  w.fpath = p; w.fpi = 0; w.doing = 'player'; w.goal = goal; w.facingAt = null;
  Play.marker = { x, y, t: tReal };
  Object.assign(Play.markerVis, { x, y: y + 400, hidden: false });
  Game.follow = true; if (typeof updateFollowBtn === 'function') updateFollowBtn();
  return true;
}
function wizApproach(v) {
  const w = wizardOf();
  if (!w) return;
  if (v.inside) { toast(`${v.first} is indoors.`, 'info'); return; }
  if (v.stage === 'baby') { toast('Babies are poor conversationalists. Talk to their folk.', 'info'); return; }
  if (dist(v.x, v.y, w.fx, w.fy) < 26) { startTalk(v); return; }
  wizWalkTo(v.x, v.y + 2, { kind: 'talk', id: v.id });
}
// His turn each step while you're playing him: walking, the goal, a tale.
function playTick(w, dt) {
  // until the wagon is in, there's nothing for him to do
  const g = w.goal;
  if (g && g.kind === 'talk') {
    const v = Game.villagers.find((o) => o.id === g.id);
    if (!v || v.inside || v.leaving) { w.goal = null; w.fpath = null; }
    else if (dist(v.x, v.y, w.fx, w.fy) < 24) { w.fpath = null; w.goal = null; startTalk(v); }
    else if ((g.repath = (g.repath || 0) - dt) <= 0) { g.repath = 3; const p = wizPath({ x: w.fx, y: w.fy }, { x: v.x, y: v.y + 2 }); if (p) { w.fpath = p; w.fpi = 0; } }
  }
  if (w.fpath) {
    const { dx, dy } = wizStep(w, 'fpath', 'fpi', WIZARD.walk * 1.4, dt);
    w.walkDist = (w.walkDist || 0) + Math.hypot(dx, dy);
    if (Math.hypot(dx, dy) > 0.01) w.facing = facingOf(dx, dy);
    if (!w.fpath && g && g.kind !== 'talk') arriveGoal(w, g);
    return;
  }
  if (w.doing === 'tale') { taleTick(w, dt); return; }
  if (Math.random() < dt * 0.006 && !Play.talk) FX.smokeRing(w.fx + (facingLeft(w.facing) ? -6 : 6), w.fy - 30);
}
function arriveGoal(w, g) {
  w.goal = null;
  if (g.kind === 'enter' && g.home != null) { const h = World.homes[g.home]; if (h) openInterior(h); }
  else if (g.kind === 'building' && World.buildings[g.key]) openInterior(World.buildings[g.key]);
  else if (g.kind === 'tale') chooseTale();
  else if (g.kind === 'show') { const s = wizardShowSpot(); w.facing = 'up'; w.doing = 'show'; wizardShow(s.x, s.y); }
  else if (g.kind === 'sleep') sleepTillMorning();
  else if (g.run) g.run(w);
}

// --- The conversation sheet -----------------------------------------------------------
const WIZ_ASKS = {
  hello: { first: { child: ['Are you really a wizard? A real one?', 'Can you do magic? Go on. Do some magic.'], grown: ['Well, bless me. The wizard himself, in our lane.', 'Good morning! ...Or is it? You always say that, I hear.'] },
    warm: ['There you are! I hoped you\'d come by.', 'Gandalf! Sit, sit. Have you eaten?'], cool: ['Oh. It\'s you.', 'Yes? What is it?'], fair: ['Good day to you.', 'Back again, are you?'] },
};
function greeting(v) {
  const met = (Game.wizMet || (Game.wizMet = {}))[v.id], r = regardOf(v);
  if (!met) return R.pick(WIZ_ASKS.hello.first[v.isChild() ? 'child' : 'grown']);
  return R.pick(r > 0.25 ? WIZ_ASKS.hello.warm : r < -0.15 ? WIZ_ASKS.hello.cool : WIZ_ASKS.hello.fair);
}
function startTalk(v) {
  const w = wizardOf();
  if (!w || Play.talk || v.inside || v.carried) return;
  // if they're mid-natter, the other one stays for it too
  const third = typeof talkThird === 'function' ? talkThird(v) : null;
  const quarrel = !!(third && v.task && v.task.data && v.task.data.quarrel);
  // they stop what they're doing and turn to him
  v.abort(); v.queue = v.queue.filter((q) => q.a.id !== 'wizard_chat');
  v.task = { a: ACTIONS.wizard_chat, phase: 'do', target: { x: v.x, y: v.y }, t: 9999, data: {}, before: { ...v.drives }, chatLock: true };
  v.pose = 'stand'; v.path = null;
  v.facing = facingOf(w.fx - v.x, w.fy - v.y);
  w.facing = facingOf(v.x - w.fx, v.y - w.fy);
  w.fpath = null; w.goal = null; w.doing = 'player';
  const T = { v, third, quarrel, log: [], used: new Set(), sub: null };
  if (third) {
    third.abort();
    third.task = { a: ACTIONS.wizard_chat, phase: 'do', target: { x: third.x, y: third.y }, t: 9999, data: {}, before: { ...third.drives }, chatLock: true };
    third.pose = 'stand'; third.path = null; third.muteBubble = true;
    third.facing = facingOf(w.fx - third.x, w.fy - third.y);
    if (!(Game.wizMet || {})[third.id]) { Game.wizMet[third.id] = Game.day; addRegard(third, 0.03); }
    feel(third, 'wizard_talk');
  }
  // what's said shows on the sheet, not in bubbles over their heads
  v.muteBubble = true; Wiz.speaker.muteBubble = true;
  Play.talk = T;
  Play.heldSpeed = Game.speedIdx; setSpeed(0);
  T.wiz = (text) => { wizSay(text, v); T.log.push({ who: 'wiz', text }); };
  T.reply = (text) => { v.say(text, Math.max(3, text.length * 0.06), { to: Wiz.speaker }); T.log.push({ who: 'them', text }); };
  T.reply2 = (text) => { if (!third) return; third.say(text, Math.max(3, text.length * 0.06), { to: Wiz.speaker }); T.log.push({ who: 'third', text }); };
  T.choices = (list) => { T.sub = list; };
  T.end = () => endTalk();
  T.reply(greeting(v));
  if (third) T.reply2(quarrel ? R.pick(['Oh good, a witness. Tell them they\'re wrong.', 'Don\'t you start as well.']) : R.pick(['Join us! We were just saying...', 'Ah! Pull up a stool.']));
  if (!Game.wizMet[v.id]) { Game.wizMet[v.id] = Game.day; addRegard(v, v.isChild() ? 0.1 : 0.04); }
  feel(v, 'wizard_talk');
  selectVillager(null);
  Game.follow = true;
  renderTalk();
}
function endTalk() {
  const T = Play.talk;
  if (!T) return;
  Play.talk = null;
  const v = T.v;
  v.muteBubble = false; Wiz.speaker.muteBubble = false; v.bubble = null; Wiz.speaker.bubble = null;
  const t3 = T.third;
  if (t3) { t3.muteBubble = false; t3.bubble = null; if (t3.task && t3.task.a.id === 'wizard_chat') t3.task.t = 0.01; t3.drives.lonely = Math.max(0, t3.drives.lonely - 0.12); }
  if (v.task && v.task.a.id === 'wizard_chat') v.task.t = 0.01;
  v.drives.lonely = Math.max(0, v.drives.lonely - 0.15);
  setSpeed(Play.heldSpeed || 1);
  Sheet.close(true);
}
function renderTalk() {
  const T = Play.talk;
  if (!T) return;
  const v = T.v;
  // with two of them, only what's said to both (and goodbye)
  const opts = T.sub || TalkOptions.filter((o) => (!T.third || o.pair || o.id === 'bye') && (!o.when || o.when(v, T))).map((o) => ({ label: typeof o.label === 'function' ? o.label(v, T) : o.label, run: () => o.run(v, T), id: o.id, dim: T.used.has(o.id) }));
  if (T.sub) opts.push({ label: 'Never mind', run: () => {}, back: true });
  const log = T.log.slice(T.third ? -3 : -2).map((l) => `<p class="tk-line ${l.who}"><b>${l.who === 'wiz' ? 'You' : escapeHtml(l.who === 'third' ? T.third.first : v.first)}</b> ${escapeHtml(l.text)}</p>`).join('');
  const sub = v.stage === 'elder' ? 'an elder' : v.isChild() ? `${kidBand(v) === 'youth' ? 'a youngster' : 'a little one'}` : v.job ? JOBS[v.job].label.toLowerCase() : 'a grown-up';
  Sheet.open({
    kind: 'talk',
    title: T.third ? `${v.first} and ${T.third.first}` : v.name(),
    sub: T.third ? (T.quarrel ? 'in the middle of a squabble' : 'having a natter') : `${sub}${v.isRiftborn && v.isRiftborn() ? ', rift-born' : ''} · ${regardWord(v)}`,
    portrait: v,
    html: `<div class="tk-log">${log}</div>`,
    choices: opts.map((o) => ({ label: o.label, dim: o.dim, back: o.back, run: () => {
      if (!o.back && o.id) T.used.add(o.id);
      const wasSub = !!T.sub; T.sub = null;
      o.run();
      if (Play.talk === T) { if (wasSub && T.sub) { /* a further menu */ } renderTalk(); }
    } })),
    onClose: () => endTalk(),
  });
}
ACTIONS.wizard_chat = {
  label: 'Talking with the wizard', icon: 'chat', sat: { lonely: -0.3, bored: -0.25 }, dur: 10, pose: 'stand', queued: true, stages: AWAKE,
  target: (v) => ({ x: v.x, y: v.y }),
  tick: (v) => { const w = wizardOf(); if (w) v.facing = facingOf(w.fx - v.x, w.fy - v.y); if (!Play.talk || (Play.talk.v !== v && Play.talk.third !== v)) v.task.t = Math.min(v.task.t, 0.01); },
};
ACTIONS.wizard_chat.id = 'wizard_chat';
ACTION_NAMES.wizard_chat = 'Talking with the wizard';

// --- What the wizard can say -------------------------------------------------------------
// How folk take a remark, by their temper: how much it warms them, and what they say.
const TONE_TAKE = {
  warm: { cheerful: [0.06, ['Oh, you are kind!', 'Ha! You old flatterer.']], ornery: [0.01, ['Hm. Well. Thank you, I suppose.']], shy: [0.05, ['...Thank you.', '*goes pink*']], curious: [0.03, ['That\'s nice of you. Where have you been, anyway?']], dreamy: [0.05, ['I think about you sometimes, out on the road.']], witty: [0.02, ['Steady on. I\'ll get a big head.']], proud: [0.05, ['I do keep myself well, it\'s true.']], gloomy: [0.07, ['...Do you mean that? That\'s cheered me up, that has.']], child: [0.05, ['Hee! You\'re nice.']] },
  witty: { cheerful: [0.06, ['Ha! You haven\'t changed a bit.', 'Ha! Stop it, my sides!']], ornery: [-0.05, ['I don\'t see what\'s funny.', 'Laugh at your own jokes, do you?']], shy: [-0.02, ['Oh. Ha. Yes.']], curious: [0.03, ['Ha! Is that what they say in the Big Folk towns?']], dreamy: [0.02, ['Hm? Oh! Ha, yes.']], witty: [0.09, ['Ha! You\'ll keep. I\'ll get you back for that.', 'Oh, very good. Very good indeed.']], proud: [-0.03, ['I\'ll have you know I\'m very well thought of.']], gloomy: [0, ['Mm. Funny.']], child: [0.07, ['Ahahaha! Say it again!']] },
  curious: { cheerful: [0.04, ['Oh, where do I start!']], ornery: [0.03, ['Well, since you ask. Nobody ever asks.']], shy: [0.04, ['You... want to know about that? Well...']], curious: [0.07, ['Oh, I could talk about that all day! Have you got all day?']], dreamy: [0.06, ['Nobody\'s ever asked me that before.']], witty: [0.03, ['How long have you got?']], proud: [0.08, ['Ah! Well. I am rather good at it, you know.']], gloomy: [0.04, ['...It\'s not much. But I like it.']], child: [0.05, ['I can show you! Can I show you?']] },
};
const WIZ_TONES = {
  warm: ['You\'re looking well, {name}. The valley agrees with you.', 'It does my old heart good to see you, {name}.', 'I thought of this place often on the road. And of you, {name}.'],
  witty: ['Still keeping out of trouble, {name}? A pity.', 'If you\'ve eaten fewer than six meals today, {name}, I shall be most concerned.', 'I\'ve met dragons with better manners than your rooster, {name}.'],
  curious: ['Tell me about your work, {name}. What\'s the hardest part?', 'What do you do of an evening, {name}, when nobody\'s looking?', 'What do you love best about Thistledown, {name}?'],
};
function toneLine(v, tone) {
  let text = R.pick(WIZ_TONES[tone]).replace('{name}', v.first);
  if (tone === 'curious' && v.isChild()) text = R.pick(['What\'s the best game you know, {name}?', 'What do you want to be when you\'re grown, {name}?', 'What have you learned at the story circle, {name}?']).replace('{name}', v.first);
  return text;
}
function sayTone(v, T, tone, text) {
  T.wiz(text);
  const tm = v.isChild() ? 'child' : temperOf(v), [d, lines] = TONE_TAKE[tone][tm] || [0.02, ['Ah.']];
  // the same kind of remark twice in one talk does less, and a third grates
  const n = (T.tones = T.tones || {})[tone] = (T.tones[tone] || 0) + 1;
  const dd = n === 1 ? d : n === 2 ? d * 0.4 : -0.02;
  addRegard(v, dd);
  if (dd < 0) feel(v, 'wizard_snub');
  T.reply(R.pick(lines));
}
// how they are, from whatever's most on their mind
function howAreYou(v) {
  const f = feelingsOf(v).find((x) => !(x[3] && x[3].k.startsWith('wizard')));
  if (f && f[3] && MOODLETS[f[3].k] && MOODLETS[f[3].k][3]) return MOODLETS[f[3].k][3][0].replace('{x}', f[3].x || '');
  const m = v.mood();
  if (v.isSick()) return 'Under the weather, if I\'m honest. Sniffles.';
  if (v.drives.hunger > 0.7) return 'Hungry! Is it nearly time for something?';
  if (v.drives.tired > 0.7) return 'Tired. Dead on my feet.';
  return m > 0.75 ? R.pick(['Never better!', 'Grand, thank you. Just grand.']) : m > 0.5 ? R.pick(['Fair enough. Mustn\'t grumble.', 'Not bad at all.']) : m > 0.3 ? R.pick(['Oh, middling. You know.', 'Could be better. Could be worse.']) : R.pick(['Truth be told, I\'ve had better weeks.', 'Don\'t ask.']);
}
addTalkOption({ id: 'how', order: 10, label: 'How are you keeping?', run: (v, T) => { T.wiz(R.pick(['How are you keeping?', 'And how are you, really?'])); T.reply(howAreYou(v)); if (!T.used.has('how')) addRegard(v, 0.02); } });
addTalkOption({
  id: 'mind', order: 20, label: 'What\'s on your mind?',
  run: (v, T) => {
    T.wiz(R.pick(['What\'s on your mind?', 'Tell me, what would make you happy just now?']));
    const ws = wishesOf(v), w = ws[0];
    if (w && WISHES[w.k]) {
      const W = WISHES[w.k];
      T.reply((W.say ? R.pick(W.say) : `I'd love ${wishText(w).toLowerCase()}.`).replace('{x}', w.x || ''));
      (Game.wizWishes || (Game.wizWishes = {}))[v.id] = w.k;
    } else if (v.dream && DREAMS[v.dream.k]) { const d = dreamText(v.dream); T.reply(`One day I'd like to ${d.charAt(0).toLowerCase() + d.slice(1)}. That's what I'd like.`); }
    else T.reply(R.pick(['Nothing much. Supper.', 'Oh, this and that.']));
  },
});
addTalkOption({
  id: 'news', order: 30, label: 'Heard any news?',
  run: (v, T) => {
    T.wiz(R.pick(['Heard any news?', 'What\'s the word in the lanes?']));
    const known = Game.wizKnows || (Game.wizKnows = []);
    const n = newsList().find((x) => knowsNews(v, x) && !known.includes(x.id) && Game.day - x.day <= 6);
    if (n) { known.push(n.id); const t = n.text.replace(/\.$/, ''); T.reply(R.pick(['Did you hear? ', 'You\'ll never guess! ', 'Well, ']) + t + (/[!?]$/.test(t) ? '' : '.')); addRegard(v, 0.01); }
    else T.reply(R.pick(['Nothing you won\'t have heard already.', 'Quiet as a mouse, this week.', 'You\'d do better asking at the inn.']));
  },
});
addTalkOption({
  id: 'chat', order: 40, label: 'Pass the time of day…',
  run: (v, T) => {
    const lines = ['warm', 'witty', 'curious'].map((tone) => ({ tone, text: toneLine(v, tone) }));
    T.choices(lines.map((l) => ({ label: `<span class="tone ${l.tone}">${l.tone}</span> ${escapeHtml(l.text)}`, run: () => sayTone(v, T, l.tone, l.text) })));
  },
});
addTalkOption({
  id: 'give', order: 60, label: 'Give them something from your pack…',
  when: () => Object.values(packOf()).some((n) => n > 0),
  run: (v, T) => {
    const pk = packOf();
    T.choices(Object.keys(PACK).filter((k) => pk[k] > 0 && (!PACK[k].ok || PACK[k].ok(v))).map((k) => ({
      label: `${PACK[k].label} <small>(${pk[k]} left)</small>`,
      run: () => {
        pk[k]--;
        T.wiz(R.pick([`Here. I saved you ${PACK[k].label}.`, `I believe this is for you, ${v.first}.`]));
        T.reply(PACK[k].give(v));
        feel(v, 'wizard_gift', PACK[k].label.replace(/^a (pouch of )?/, ''));
        addRegard(v, v.isChild() ? 0.08 : 0.06);
        if (!v.inside) FX.hearts(v.x, v.y - 14);
      },
    })));
  },
});
addTalkOption({ id: 'about', order: 90, label: (v) => `About ${v.first}…`, run: (v) => { endTalk(); selectVillager(v); } });
addTalkOption({ id: 'bye', order: 99, label: 'Good day to you', run: (v, T) => { T.wiz(R.pick(['Good day to you.', 'I must be off. Take care, now.'])); T.reply(R.pick(regardOf(v) > 0.25 ? ['Come again soon!', 'Don\'t be a stranger!'] : ['Good day.', 'Mind how you go.'])); endTalk(); } });

// --- The sheet: one card for talk and everything else ---------------------------------
const Sheet = {
  open(o) {
    const el = $('sheet');
    this.cur = o;
    el.hidden = false; el.className = 'card sheet ' + (o.kind || '');
    document.body.classList.add('sheet-open');
    $('sheet-title').textContent = o.title || '';
    $('sheet-sub').textContent = o.sub || '';
    const cv = $('sheet-portrait');
    if (o.portrait) { cv.hidden = false; drawPortrait(cv, o.portrait.genes, o.portrait.stage, false, o.portrait.look ? o.portrait.look() : {}); } else cv.hidden = true;
    $('sheet-body').innerHTML = o.html || '';
    const box = $('sheet-choices');
    box.innerHTML = '';
    for (const c of o.choices || []) {
      const b = document.createElement('button');
      b.className = 'choice' + (c.dim ? ' dim' : '') + (c.back ? ' back' : '') + (c.primary ? ' primary' : '');
      b.innerHTML = c.label;
      if (c.disabled) b.disabled = true;
      b.addEventListener('click', () => { Sound.click(); c.run(); });
      box.appendChild(b);
    }
    hydrateIcons(el);
    const body = $('sheet-body'); body.scrollTop = body.scrollHeight;
  },
  close(quiet) {
    const o = this.cur;
    this.cur = null;
    $('sheet').hidden = true;
    document.body.classList.remove('sheet-open');
    if (!quiet && o && o.onClose) o.onClose();
  },
  isOpen() { return !!this.cur; },
};

// --- The bar of things to do ----------------------------------------------------------
function renderWizBar() {
  const bar = $('wizbar');
  if (!bar) return;
  const show = playMode() && Game.started && !Play.skipping;
  bar.hidden = !show;
  if (!show) return;
  const acts = WizardActions.filter((a) => !a.when || a.when());
  const key = acts.map((a) => a.id + (typeof a.label === 'function' ? a.label() : a.label)).join('|');
  if (bar.dataset.key === key) return;
  bar.dataset.key = key;
  bar.innerHTML = '';
  for (const a of acts) {
    const b = document.createElement('button');
    b.className = 'wact' + (a.primary && a.primary() ? ' primary' : '');
    b.innerHTML = `${a.icon ? iconHTML(a.icon) : ''}<span>${typeof a.label === 'function' ? a.label() : a.label}</span>`;
    b.addEventListener('click', () => { Sound.click(); a.run(); renderWizBar(); });
    bar.appendChild(b);
  }
  hydrateIcons(bar);
}
const nearTree = (w) => dist(w.fx, w.fy, wizardTaleSpot().x, wizardTaleSpot().y) < 40;
addWizardAction({
  id: 'tale', order: 10, icon: 'book', label: () => 'Tell a tale',
  when: () => { const w = wizardOf(); return !!w && Game.hour >= 9 && Game.hour < 19 && !Game.raining && !(Game.time < (w.taleUntil || 0)) && !Game.party.on; },
  run: () => { const w = wizardOf(); const s = wizardTaleSpot(); if (nearTree(w)) chooseTale(); else wizWalkTo(s.x, s.y, { kind: 'tale' }); },
});
addWizardAction({
  id: 'show', order: 12, icon: 'spark', label: () => 'Light the fireworks', primary: () => true,
  when: () => { const w = wizardOf(); return !!w && Game.party.on && Game.hour >= 20.5 && w.showDay !== Game.day; },
  run: () => { const s = wizardShowSpot(); wizWalkTo(s.x - 26, s.y + 30, { kind: 'show' }); },
});
addWizardAction({
  id: 'sleep', order: 80, icon: 'zzz', label: () => 'Sleep till morning',
  when: () => !!wizardOf() && (Game.hour >= 20 || Game.hour < 6) && !(Game.party.on && wizardOf().showDay !== Game.day && Game.hour < 23),
  run: () => { const w = wizardOf(); const s = wizardBed(); if (dist(w.fx, w.fy, s.x, s.y) < 30) sleepTillMorning(); else wizWalkTo(s.x, s.y, { kind: 'sleep' }); },
});
addWizardAction({ id: 'home', order: 95, icon: 'ring', label: () => 'Find me', when: () => !Game.follow && !!wizardOf(), run: () => { Game.follow = true; } });

// Where he sleeps (his wagon, unless a family has given him a room).
function wizardBed() { const w = wizard(); return typeof hearthBed === 'function' && hearthBed() ? hearthBed() : { x: w.camp.x - w.face * 2, y: w.camp.y + 2 }; }

// The tale he'll tell: a short page of the tales he knows.
function chooseTale() {
  const w = wizardOf();
  if (!w) return;
  w.facing = 'down';
  const told = w.told || [];
  Sheet.open({
    kind: 'pick', title: 'Which tale?', sub: 'Folk will come from all over the village to hear it.',
    choices: Object.keys(WIZARD_TALES).filter(taleOpen).map((k) => ({ label: `The tale ${WIZARD_TALES[k].x}${told.includes(k) ? ' <small>(told before)</small>' : ''}`, dim: told.includes(k), run: () => { Sheet.close(true); beginTale(k); } }))
      .concat([{ label: 'Not now', back: true, run: () => Sheet.close(true) }]),
  });
}
function beginTale(key) {
  const w = wizardOf();
  if (!w) return;
  w.doing = 'tale';
  summonListeners(w);
  wizardStartTale(false, key);
  if (typeof onTaleBegun === 'function') onTaleBegun(key);
}

// --- Passing time quickly: a night's sleep, a journey -------------------------------
// Runs the simulation for real, a slice each frame, behind a card. Returns a
// promise that resolves when it's done. o: { title, text, onDay(day), steps }
function skipTime(mins, o = {}) {
  return new Promise((resolve) => {
    Play.skipping = true;
    const el = $('skip');
    el.hidden = false;
    $('skip-title').textContent = o.title || 'Time passes…';
    $('skip-text').textContent = o.text || '';
    $('skip-log').innerHTML = '';
    const total = mins, start = Game.time;
    let lastDay = Game.day;
    renderWizBar();
    const step = () => {
      const t0 = performance.now();
      while (Game.time - start < total && performance.now() - t0 < 24) {
        simulate(0.5);
        if (Game.day !== lastDay) { lastDay = Game.day; if (o.onDay) o.onDay(Game.day); }
      }
      $('skip-bar').style.width = `${Math.min(100, ((Game.time - start) / total) * 100)}%`;
      $('skip-clock').textContent = `${weekday(Game.day)}, day ${Game.day} · ${fmtTime(Game.time)}`;
      if (Game.time - start < total) requestAnimationFrame(step);
      else { el.hidden = true; Play.skipping = false; renderWizBar(); resolve(); }
    };
    requestAnimationFrame(step);
  });
}
function skipLog(html) { const li = document.createElement('li'); li.innerHTML = html; $('skip-log').prepend(li); }
function sleepTillMorning() {
  const w = wizardOf();
  if (!w) return;
  const mins = ((7 * 60 - (Game.time % 1440)) + 1440) % 1440 || 1440;
  w.doing = 'sleep'; w.fpath = null;
  Wiz.speaker.hidden = true;
  return skipTime(mins, { title: 'The wizard sleeps', text: 'The village settles down for the night, and the lamps go out one by one.' }).then(() => {
    const ww = wizardOf();
    if (!ww) return;
    ww.doing = 'player'; Wiz.speaker.hidden = false;
    const b = wizardBed(); ww.fx = b.x; ww.fy = b.y + 6;
    Game.wizPack = refillPack();
    Game.follow = true;
    wizSay(R.pick(['A fine morning! Now, where did I put my hat?', 'Ah, Thistledown. Second breakfast, I think.', 'Good morning! Whether I want it or not.']));
  });
}

// --- Starting a village as the wizard ---------------------------------------------------
// The setup screen gets a choice of how to play; a new village as the wizard
// opens with his wagon rolling in.
function wizardBegin() {
  if (!playMode()) return;
  Game.wizRel = Game.wizRel || {}; Game.wizMet = Game.wizMet || {};
  if (!wizard()) wizardArrive();
  Game.follow = true;
}

window.addEventListener('DOMContentLoaded', () => {
  registerField('mode', 'steward');
  registerField('wizRel', {}); registerField('wizMet', {}); registerField('wizKnows', []); registerField('wizPack', null, { nullish: true }); registerField('wizWishes', {});
  document.body.classList.toggle('wizmode', playMode());

  // a tap: walk there, or go and talk, or knock at a door
  patch(window, 'handleClick', (hc) => function (sx, sy) {
    if (!playMode() || !wizardOf() || Play.skipping) return hc.apply(this, arguments);
    if (Play.talk) { endTalk(); return; }
    if (Sheet.isOpen()) Sheet.close();
    const [wx, wy] = screenToWorld(sx, sy);
    const v = villagerAt(wx, wy);
    if (v) { wizApproach(v); return; }
    const h = homeAt(wx, wy);
    if (h && h.built) { wizWalkTo(h.stepX, h.stepY + 4, { kind: 'enter', home: World.homes.indexOf(h) }); return; }
    const bd = buildingAt(wx, wy);
    if (bd) { const key = Object.keys(World.buildings).find((k) => World.buildings[k] === bd); wizWalkTo(bd.stepX, bd.stepY + 4, { kind: 'building', key }); return; }
    const t = nearestWalkable(Math.floor(wx / 16), Math.floor(wy / 16));
    if (t) wizWalkTo(wx, wy + 0, null);
  }, 'play');
  // the camera stays with him (and, while the sheet's up in a tall window, keeps him above it)
  patch(window, 'updateCamera', (uc) => function (dt) {
    const w = wizardOf();
    if (!playMode() || !w || !Game.follow || Game.selected) return uc.apply(this, arguments);
    // keep them in the part of the screen the sheet leaves clear: above it, or to its left
    const sheet = $('sheet');
    let lift = 0, shove = 0;
    if (!sheet.hidden) {
      const r = sheet.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.3) lift = (window.innerHeight - r.top) / 2 / Game.zoom;
      else shove = (window.innerWidth - r.left) / 2 / Game.zoom;
    }
    const tv = Play.talk ? Play.talk.v : null;
    const px = tv ? (w.fx + tv.x) / 2 : w.fx, py = (tv ? (w.fy + tv.y) / 2 : w.fy) - 16;
    const tx = px - Game.cam.w / 2 + shove, ty = py - Game.cam.h / 2 + lift;
    Game.cam.x += (tx - Game.cam.x) * Math.min(1, dt * 4);
    Game.cam.y += (ty - Game.cam.y) * Math.min(1, dt * 4);
    const r = uc.apply(this, arguments);
    return r;
  }, 'play');
  // the hand's picking up and dropping isn't his to do
  patch(window, 'pickUp', (pu) => function (v) { if (playMode()) return; return pu.apply(this, arguments); }, 'play');
  // a marker where you tapped, fading (sorted far down the list so it's drawn under nobody)
  Play.markerVis = { x: 0, y: 0, hidden: true, draw(ctx) {
    const m = Play.marker; if (!m) { this.hidden = true; return; }
    const a = 1 - (tReal - m.t) / 0.8; if (a <= 0) { Play.marker = null; this.hidden = true; return; }
    ctx.globalAlpha = a; ctx.fillStyle = '#fff6c0';
    const r = 4 + (1 - a) * 5;
    for (let k = 0; k < 12; k++) { const an = (k / 12) * Math.PI * 2; ctx.fillRect(Math.round(m.x + Math.cos(an) * r), Math.round(m.y + Math.sin(an) * r * 0.6), 1, 1); }
    ctx.globalAlpha = 1;
  } };
  Visitors.push(Play.markerVis);

  // the sheet's own close button, and Escape
  $('sheet-close').addEventListener('click', () => Sheet.close());
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && Sheet.isOpen()) Sheet.close(); });
  // the bar keeps itself up to date
  setInterval(renderWizBar, 400);

  // a village started on the setup screen asks how you'd like to play
  patch(window, 'renderWorldSetup', (rws) => function () {
    const r = rws.apply(this, arguments);
    const box = $('wg-opts');
    const mode = GenUI.mode || 'wizard';
    const row = document.createElement('div'); row.className = 'wg-row wg-mode';
    row.innerHTML = '<span class="wg-label">You play</span>';
    const seg = document.createElement('div'); seg.className = 'wg-seg';
    for (const [val, label] of [['wizard', 'The wizard'], ['steward', 'The Steward']]) {
      const b = document.createElement('button'); b.textContent = label; b.className = mode === val ? 'on' : '';
      b.setAttribute('aria-pressed', mode === val ? 'true' : 'false');
      b.addEventListener('click', () => { GenUI.mode = val; renderWorldSetup(); });
      seg.appendChild(b);
    }
    row.appendChild(seg);
    const note = document.createElement('p'); note.className = 'wg-note';
    note.textContent = mode === 'wizard' ? 'Walk the valley as the grey wizard: talk with the folk, tell tales, teach the children. The village runs itself.' : 'Run the village from above: build, set rations and trades, trade with the caravans, and lend a giant hand.';
    box.prepend(note); box.prepend(row);
    return r;
  }, 'play');
  addHook('afterNewVillage', () => {
    Game.mode = GenUI && GenUI.pendingMode ? GenUI.pendingMode : 'steward';
    GenUI.pendingMode = null;
    Game.wizRel = {}; Game.wizMet = {}; Game.wizKnows = []; Game.wizPack = null; Game.wizWishes = {};
    document.body.classList.toggle('wizmode', playMode());
  });
  patch(window, 'runWorldGen', (rwg) => function () { GenUI.pendingMode = GenUI.mode || 'wizard'; return rwg.apply(this, arguments); }, 'play');
  patch(window, 'startGame', (sg) => function () {
    const r = sg.apply(this, arguments);
    document.body.classList.toggle('wizmode', playMode());
    if (playMode()) wizardBegin();
    return r;
  }, 'play');
  // the village runs its own Moots while you're the wizard: the hall decides
  // (taking in strangers a household at a time, as a rule), and the clerk's
  // season report stays in the Chronicle instead of opening over the screen
  patch(window, 'askMoot', (am) => function (title, text, options) {
    if (!playMode() || /Long Dim/.test(title)) return am.apply(this, arguments);
    const o = options.find((x) => /Sponsor/.test(x.label)) || R.pick(options);
    o.fn();
  }, 'play');
  patch(window, 'showAlmanac', (sa) => function (rep) { if (playMode()) { if (rep) Game.lastAlmanac = rep; return; } return sa.apply(this, arguments); }, 'play');
  // the opening card tells a wizard's village what it's in for
  window.addEventListener('load', () => {
    if (!playMode()) return;
    const card = document.querySelector('#intro .intro-card');
    if (!card) return;
    card.querySelector('.lede').textContent = 'You are the grey wizard, come again to Thistledown: a snug village of hobbit-holes, gardens and good ale between green hills and a slow river, where lately the sky has been tearing open. Walk its lanes, stop folk for a word, teach the children, tell tales beneath the great tree, and light the fireworks when there\'s a party.';
    const sub = card.querySelector('p.sub'); if (sub) sub.hidden = true;
    const how = card.querySelector('.how');
    if (how) how.innerHTML = '<div><b>Walk</b><span>Tap the ground to walk there. Drag to look around; pinch to zoom.</span></div><div><b>Talk</b><span>Tap a hobbit to stop for a word. They remember how you treat them.</span></div><div><b>Do</b><span>The bar at the bottom: tell a tale, light the fireworks, sleep till morning, and more as the story grows.</span></div>';
  });
  patch(window, 'load', (ld) => function () { const r = ld.apply(this, arguments); document.body.classList.toggle('wizmode', playMode()); return r; }, 'play');
});
