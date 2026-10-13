'use strict';
// ---------------------------------------------------------------------------
// The Relay board: the rift-folk's own way of talking. Once the rift-folk
// have come there's a crackling feed of short posts (on a handset at the
// camp, and on the Relay Mast once it's up) in rift-slang, written by the
// rift-born, by the youngsters who've taken up rift ways, and now and then by
// an astonished hill-folk who has found the button. It picks up what the
// village is talking about (a wedding, a birth, a party, a new building, a
// clue) and adds its own homesick, cheerful noise: a handful of posts a day.
//
// In the wizard's game you can read it (the bar's "The Relay"), post on it
// once a day, and pin a post so the whole village sees it. A kind word about
// a wary old hobbit softens them towards the rift-folk; a post about the
// Long Dim sways whoever reads it; a joke warms the young and the rift-minded
// and goes down less well with the elders, who grumble about the whole
// business at the inn.
// ---------------------------------------------------------------------------

MOODLETS.relay_kind = ['Somebody said something kind about me on the Relay', 0.1, 1440, ['They said a kind word about me on that Relay thing. Fancy.']];

function relay() { return Game.relay || (Game.relay = { posts: [], seq: 0, mine: null, today: 0, day: 0 }); }
const relayOpen = () => typeof riftBorn === 'function' && (riftBorn().length > 0 || (Game.riftStory && Game.riftStory.stage >= 2));
const relayReader = (v) => v.stage !== 'baby' && (v.isRiftborn() || v.tech >= RIFT_TIERS[0] || v.isChild());
function short(t, n = 72) { t = t.replace(/\s+/g, ' ').trim(); return t.length <= n ? t : t.slice(0, n).replace(/\s\S*$/, '') + '…'; }
function postRelay(who, text, kind = 'rift') {
  const R0 = relay();
  if (R0.day !== Game.day) { R0.day = Game.day; R0.today = 0; }
  R0.today++;
  const p = { id: ++R0.seq, day: Game.day, time: fmtTime(Game.time), who: who ? who.first : 'the wizard', whoId: who ? who.id : null, text, kind };
  R0.posts.unshift(p);
  if (R0.posts.length > 40) R0.posts = R0.posts.filter((x, i) => i < 40 || x.pinned);
  return p;
}
// who'd post: a rift-born, a rift-minded youngster, or a hill-folk who has found the button
function relayAuthor(prefer) {
  if (prefer && prefer.stage !== 'baby' && (prefer.isRiftborn() || prefer.tech >= RIFT_TIERS[0])) return prefer;
  const rb = riftBorn().filter((v) => v.isGrown()), kids = Game.villagers.filter((v) => v.isChild() && v.tech >= RIFT_TIERS[0] && kidBand(v) !== 'toddler');
  const r = Math.random();
  if (r < 0.12) { const old = Game.villagers.filter((v) => v.stage === 'elder' && !v.isRiftborn()); if (old.length) return R.pick(old); }
  if (r < 0.35 && kids.length) return R.pick(kids);
  return rb.length ? R.pick(rb) : null;
}
const SIGN_OFF = ['full signal.', 'no lag.', '10/10.', 'respect.', '*static*', 'ping.', 'battery low, morale high.'];
const AMBIENT = {
  rift: [(v) => `miss ${v.arc ? v.arc.home : 'the city'} tonight. battery low.`, () => 'second breakfast is a whole protocol here. respect.', () => 'the river does what our whole grid did. and it never sends an invoice.', () => 'rained again. REAL rain. still not over it.', () => 'anyone got a spare power cell? asking for a friend (me).', () => 'a hobbit asked me if my eye is "a sort of brooch". full signal.', () => 'learned the willow lamp song. it\'s ours too?? *static*', () => 'they call it "elevenses". it is a sixth meal. i love it here.'],
  kid: [() => 'i can count to 1010 in acorns', () => 'mum says the relay rots your brain. it does not. *static*', () => 'the wizard did a squib for me!!! BANG', () => 'who wants to play rift-tag by the pond', () => 'my gran thinks this is a wireless. ping gran'],
  hill: [() => 'Is this thing on', () => 'How do you make the letters bigger', () => 'Hello Relay. Turnips are doing well this year. Yours sincerely.', () => 'In my day we shouted over the hedge.'],
};
function authorKind(v) { return v.isRiftborn() ? 'rift' : v.isChild() ? 'kid' : 'hill'; }
function ambientPost() {
  const v = relayAuthor();
  if (!v) return;
  const k = authorKind(v);
  postRelay(v, R.pick(AMBIENT[k])(v), k);
}
// what the village is talking about, as the Relay has it
const RELAY_KINDS = new Set(['love', 'birth', 'party', 'rift', 'build', 'learn', 'letter', 'adventure']);
function relayHears(text, kind) {
  if (!RELAY_KINDS.has(kind) || !relayOpen() || relay().today >= 7 || !R.chance(kind === 'rift' ? 0.5 : kind === 'learn' ? 0.08 : 0.3)) return;
  // somebody who isn't the news themselves
  let v = null;
  for (let i = 0; i < 4 && (!v || text.includes(v.first)); i++) v = relayAuthor();
  if (!v || text.includes(v.first)) return;
  const k = authorKind(v);
  let first = text.split(/(?<=[.!?])\s/)[0].replace(/[.!]+$/, '');
  // (a sentence starting with somebody's name keeps its capital)
  const w0 = first.split(/[\s,']/)[0];
  if (!Game.villagers.some((o) => o.first === w0 || o.surname === w0)) first = first.charAt(0).toLowerCase() + first.slice(1);
  const body = short(first, 64), cut = body.endsWith('…');
  const t = k === 'hill' ? `I hear ${body}${cut ? '' : '.'} Lovely.` : `${R.pick(['ok so ', 'update: ', 'ping: ', 'big news: ', 'heard: '])}${body}${cut ? ' ' : '. '}${R.pick(SIGN_OFF)}`;
  postRelay(v, t, k);
}

// --- What the wizard can post (once a day) --------------------------------------------------------
function wariestElder() { return Game.villagers.filter((v) => !v.isRiftborn() && v.isGrown() && !v.leaving && riftWary(v) > 0.2).sort((a, b) => riftWary(b) - riftWary(a))[0]; }
function wizardPosts() {
  const out = [];
  const e = wariestElder();
  if (e) {
    const thing = e.job ? { farmer: 'turnips', baker: 'bread', miller: 'flour', brewer: 'ale', innkeeper: 'kitchen', herder: 'sheep', fisher: 'fish', orchardist: 'apples', woodwright: 'timber', herbalist: 'remedies' }[e.job] : null;
    out.push({ key: 'kind', text: `A word for ${e.first}, whose ${thing || 'good sense'} keeps this village going. Thank you, ${e.first}.`, run: (p) => {
      const soft = relay().soft || (relay().soft = {}); soft[e.id] = Math.min(0.6, (soft[e.id] || 0) + 0.25); feel(e, 'relay_kind'); addRegard(e, 0.06);
      if (!e.inside) e.say(R.pick(['Somebody said something nice about me on that Relay. Well!', 'Hmph. ...That was nice of them.']), 3);
    } });
  }
  out.push({ key: 'welcome', text: 'To all who came through the sky: Thistledown is glad of you. Second breakfast is at half past nine.', run: () => { for (const v of riftBorn()) addRegard(v, 0.04); } });
  out.push({ key: 'joke', text: 'Riddle for the Relay: what has roots nobody sees, is taller than trees, and yet never grows? (Answers to the wizard.)', run: () => { for (const v of Game.villagers) if (relayReader(v)) addRegard(v, v.isChild() ? 0.04 : 0.02); } });
  if (typeof voteOpen === 'function' && voteOpen()) out.push({ key: 'vote', text: 'On the Long Dim: a door kept open is a lamp kept lit. Think about it before the Moot.', run: () => { for (const v of Game.villagers) if (v.isGrown() && relayReader(v)) heard(v, riftWary(v) > 0.4 ? -0.03 : 0.1); } });
  return out;
}
function wizardPost(o) {
  const R0 = relay();
  const p = postRelay(null, o.text, 'wizard');
  R0.mine = Game.day;
  o.run(p);
  if (typeof addNews === 'function') addNews(`The wizard posted on the Relay: "${short(o.text, 60)}"`, 'rift');
  // the old folk grumble, whatever it said
  const old = Game.villagers.find((v) => v.stage === 'elder' && !v.isRiftborn() && !v.inside && v.tech < 0.2);
  if (old && o.key !== 'kind') old.say(R.pick(['The wizard\'s on that Relay now. Whatever next.', 'In my day a wizard wrote a letter.']), 3);
}
function pinPost(p) {
  for (const x of relay().posts) x.pinned = false;
  p.pinned = true;
  // pinned, it's read by everyone, not just the rift-minded
  if (/kind word|A word for/.test(p.text) || p.kind === 'wizard') for (const v of Game.villagers) if (v.isGrown() && !relayReader(v)) addRegard(v, 0.01);
  if (/Long Dim/.test(p.text)) for (const v of Game.villagers) if (v.isGrown() && !relayReader(v)) heard(v, riftWary(v) > 0.4 ? -0.02 : 0.06);
  toast('Pinned to the Relay board for all to see.', 'info');
}

// --- The board, in a sheet ---------------------------------------------------------------------------
function relaySheet(mode) {
  const R0 = relay();
  const posts = R0.posts.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).slice(0, 18);
  const html = `<div class="relay">${posts.length ? posts.map((p) => `<div class="post ${p.kind}${p.pinned ? ' pinned' : ''}"><span class="pw">${p.pinned ? '📌 ' : ''}${escapeHtml(p.who)}<small> · day ${p.day}, ${p.time}</small></span><span class="pt">${escapeHtml(p.text)}</span></div>`).join('') : '<p class="sub">*static*. Nothing on the Relay yet.</p>'}</div>`;
  let choices;
  if (mode === 'post') choices = wizardPosts().map((o) => ({ label: escapeHtml(o.text), run: () => { wizardPost(o); relaySheet(); } })).concat([{ label: 'Never mind', back: true, run: () => relaySheet() }]);
  else if (mode === 'pin') choices = R0.posts.filter((p) => !p.pinned).slice(0, 5).map((p) => ({ label: `${escapeHtml(p.who)}: ${escapeHtml(short(p.text, 60))}`, run: () => { pinPost(p); relaySheet(); } })).concat([{ label: 'Never mind', back: true, run: () => relaySheet() }]);
  else choices = [
    { label: R0.mine === Game.day ? 'You\'ve posted today' : 'Post something…', disabled: R0.mine === Game.day, run: () => relaySheet('post') },
    { label: 'Pin a post', disabled: !R0.posts.length, run: () => relaySheet('pin') },
    { label: 'Close', back: true, run: () => Sheet.close(true) },
  ];
  Sheet.open({ kind: 'relay-sheet', title: 'The Relay', sub: typeof builtCivic === 'function' && builtCivic('relay') ? 'On the Relay Mast, loud and clear' : 'On a crackling handset at the rift camp', html, choices });
  // newest at the top, so start there
  $('sheet-body').scrollTop = 0;
}

window.addEventListener('DOMContentLoaded', () => {
  registerField('relay', null, { nullish: true });
  patch(window, 'chronicle', (ch) => function (text, kind) { const r = ch.apply(this, arguments); if (typeof playMode === 'function' && playMode()) try { relayHears(text, kind); } catch (e) { /* the Relay is only gossip */ } return r; }, 'relay');
  // a kind word softens a wary elder towards the rift-folk
  patch(window, 'riftWary', (rw) => function (v) { const soft = Game.relay && Game.relay.soft; return rw.apply(this, arguments) * (1 - ((soft && soft[v.id]) || 0)); }, 'relay');
  addWizardAction({ id: 'relay', order: 32, icon: 'note', label: () => 'The Relay', when: () => typeof playMode === 'function' && playMode() && relayOpen(), run: () => relaySheet() });
  addHook('onHour', (h) => {
    if (!(typeof playMode === 'function' && playMode()) || !relayOpen()) return;
    if (h >= 8 && h <= 22 && relay().today < 6 && R.chance(0.22)) ambientPost();
    // the elders' view of it
    if (h >= 10 && h <= 20 && R.chance(0.06)) { const old = Game.villagers.find((v) => v.stage === 'elder' && !v.isRiftborn() && !v.inside && v.tech < 0.2 && !v.bubble); if (old) old.say(R.pick(['That Relay. Folk staring at a box instead of a hedge.', 'In my day we shouted over the hedge.', 'What\'s a "full signal" when it\'s at home?']), 3); }
  });
  addHook('newVillage', () => { Game.relay = null; });
});
