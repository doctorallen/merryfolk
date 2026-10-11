'use strict';
// ---------------------------------------------------------------------------
// Letters and the post. Hobbits are great letter-writers, even to someone two
// doors down. Folk sit down at home and write: a thank-you after a birthday
// present, an invitation to tea, news for a friend they haven't seen in a
// while. Adventurers away on the road write home. Every letter goes into the
// mailbag at the Common Store and the postie takes them round, door by door,
// oldest first. A letter through the door is a little lift for a day; while a
// village has no postie yet, neighbours pass the letters on, a day late.
// ---------------------------------------------------------------------------

const LETTER_LINES = {
  friend: ['Come for tea on Highday? There\'ll be seed-cake.', 'The gooseberries are in: come and pick some before the birds do.', 'I\'ve been meaning to say how lovely your garden looks this year.', 'Did you hear what happened at the Badger on Mersday?', 'Haven\'t seen you in an age. Do drop by.', 'I found that recipe you wanted. It\'s mostly butter.'],
  thanks: ['Thank you ever so much for the {x}. It has pride of place.', 'What a kind present the {x} was. Thank you!', 'Thank you for the {x}! I shall think of you whenever I see it.'],
  away: ['I\'ve seen mountains taller than ten party trees!', 'The sea is ever so big, and ever so wet.', 'Met an elf. Very tall. Very polite.', 'Missing second breakfast terribly.', 'Found a cave full of glittering things!', 'Do water my tomatoes.', 'The beds at the inns out here are far too high.', 'Home soon, with stories!'],
  kin: ['Just a note to say we\'re all well here.', 'The little ones ask after you every day.', 'Mother sends her love, and a pie (it may be squashed).'],
};
function mailbag() { return Game.mailbag || (Game.mailbag = []); }
function postLetter(from, to, kind, x = '') {
  if (!to || to.leaving) return;
  const text = R.pick(LETTER_LINES[kind] || LETTER_LINES.friend).replace('{x}', x);
  mailbag().push({ from: from.id ?? null, fromName: from.first, to: to.id, home: to.homeId, kind, text, day: Game.day, t: Game.time });
}
function lettersFor(home) { return mailbag().filter((l) => l.home === home.id); }

function deliverLetters(home, by) {
  const ls = lettersFor(home);
  Game.mailbag = mailbag().filter((l) => !ls.includes(l));
  for (const l of ls) {
    const r = Game.villagers.find((o) => o.id === l.to);
    if (!r) continue;
    feel(r, 'got_letter', l.fromName);
    r.remember(`${l.kind === 'away' ? 'A letter came from ' + l.fromName + ', far away' : 'Got a letter from ' + l.fromName}: "${l.text}"`, l.kind === 'away' ? 2 : 1);
    const f = Game.villagers.find((o) => o.id === l.from);
    if (f) r.bond(f, 0.05);
    r.stats.letters = (r.stats.letters || 0) + 1;
    if (l.kind === 'away' && R.chance(0.5)) chronicle(`${by ? by.first + ' the postie' : 'A neighbour'} brought ${r.first} a letter from ${l.fromName}, away adventuring: "${l.text}"`, 'letter');
    devLog('story', `${r.first} got a letter from ${l.fromName}: "${l.text}"`);
  }
  return ls.length;
}

// Writing one: to whom?
function letterTarget(v) {
  if (v.owesThanks && v.owesThanks.length) { const t = v.owesThanks[0]; const o = Game.villagers.find((p) => p.id === t.id); if (o && o.homeId !== v.homeId) return { o, kind: 'thanks', x: t.what }; v.owesThanks.shift(); }
  const kin = Game.villagers.filter((o) => o.homeId !== v.homeId && !o.leaving && o.stage !== 'baby' && (o.parents.includes(v.id) || v.parents.includes(o.id)));
  if (kin.length && R.chance(0.4)) return { o: R.pick(kin), kind: 'kin' };
  const friends = Object.entries(v.rel).filter(([, r]) => r > 0.4).map(([id]) => personById(+id)).filter((o) => o && o.homeId !== v.homeId && !o.leaving && o.stage !== 'baby');
  return friends.length ? { o: R.pick(friends), kind: 'friend' } : null;
}
ACTIONS.write_letter = {
  id: 'write_letter', label: 'Writing a letter', icon: 'letter', sat: { lonely: -0.25, bored: -0.3 }, dur: 30, pose: 'inside', stages: AWAKE, skill: 'lore', skillRate: 0.3,
  label2: (v) => (v.task && v.task.data.to ? `Writing to ${v.task.data.to.first}${v.task.data.kind === 'thanks' ? ' to say thank you' : ''}` : 'Writing a letter'),
  avail: (v) => v.homeId >= 0 && v.edu >= 0.3 && (v.isGrown() || v.years() >= 12),
  extra: (v) => (v.owesThanks && v.owesThanks.length ? 0.4 : 0.04 + v.genes.sociability * 0.04 + v.edu * 0.05),
  time: (h) => (h >= 9 && h < 21 ? 1 : 0.02),
  target: (v) => ({ building: v.home() }),
  start: (v, task) => { const t = letterTarget(v); if (!t) return false; task.data.to = t.o; task.data.kind = t.kind; task.data.x = t.x; return true; },
  done: (v, task) => {
    const { to, kind, x } = task.data;
    if (kind === 'thanks' && v.owesThanks) v.owesThanks.shift();
    postLetter(v, to, kind, x);
  },
};
ACTION_NAMES.write_letter = 'Writing letters';
HABIT_KEYS.push('write_letter');

// The postie's round: the oldest letter's door first.
Object.assign(ACTIONS.work_post, {
  label: 'Delivering the post',
  avail: () => mailbag().some((l) => World.homes[l.home] && World.homes[l.home].mailbox),
  extra: () => 0.2 + Math.min(0.4, mailbag().length * 0.03),
  target: (v) => {
    const l = mailbag().filter((x) => World.homes[x.home] && World.homes[x.home].mailbox).sort((a, b) => a.t - b.t)[0];
    if (!l) return null;
    const h = World.homes[l.home];
    return { x: h.mailbox.x + 6, y: h.mailbox.y + 2, facing: 'left', mail: h };
  },
  done: (v, task) => { const n = deliverLetters(task.target.mail, v); if (n && R.chance(0.3)) v.say(n > 1 ? `Post! ${n} for you today.` : 'Post!', 2); },
});

// A birthday present wants a thank-you letter.
{
  const gp = givePresent;
  givePresent = function (giver, to, how) {
    const what = gp(giver, to, how);
    if (to.homeId !== giver.homeId && to.edu >= 0.3 && R.chance(0.7)) (to.owesThanks || (to.owesThanks = [])).push({ id: giver.id, what: what.replace(/^(a|an) /, '').replace(/ \(.*\)$/, '').replace(/ (he|she|they) made$/, '') });
    return what;
  };
}
function postDaily() {
  // letters home from the road
  for (const a of Game.away) {
    const kin = Game.villagers.filter((o) => (a.data.parents && a.data.parents.includes(o.id)) || o.parents.includes(a.data.id) || a.data.spouse === o.id || (o.rel[a.data.id] || 0) > 0.5);
    if (kin.length && R.chance(0.5)) postLetter({ id: a.data.id, first: a.data.first }, R.pick(kin), 'away');
  }
  // with nobody on the round, a neighbour passes letters on after a day
  if (!Game.villagers.some((v) => v.job === 'postie' && !v.leaving)) {
    for (const h of World.homes) if (lettersFor(h).some((l) => Game.day - l.day >= 1)) deliverLetters(h, null);
  }
  // letters to folk who've left go back
  Game.mailbag = mailbag().filter((l) => Game.villagers.some((o) => o.id === l.to));
  for (const l of mailbag()) { const r = Game.villagers.find((o) => o.id === l.to); if (r) l.home = r.homeId; }
}
window.addEventListener('DOMContentLoaded', () => {
  const oh = onHour;
  onHour = function (h) { const r = oh(h); if (h === 8) postDaily(); return r; };
  const nv = newVillage;
  newVillage = function () { Game.mailbag = []; return nv(); };
});
