'use strict';
// ---------------------------------------------------------------------------
// The third voice. When two folk are nattering in the lane, the wizard can
// pull up and join in: what he says lands with both of them, each in their
// own temper, and he can steer the talk to something they both care about,
// or, if it's a squabble, back one, back the other, or make the peace. How
// they get on with each other afterwards is partly his doing.
// ---------------------------------------------------------------------------

// Who else is in the conversation he's walking into, if anyone.
function talkThird(v) {
  const t = v.task;
  if (!t || t.a.id !== 'chat' || !t.partner) return null;
  const p = t.partner;
  return p && !p.inside && !p.leaving && Game.villagers.includes(p) && dist(p.x, p.y, v.x, v.y) < 40 ? p : null;
}
const quarreling = (T) => !!T.quarrel;

// Both answer in their own way: a remark warms or cools each by their temper.
function sayToBoth(T, tone, text) {
  T.wiz(text);
  // the same kind of remark twice does less, and a third grates (as it does with one)
  const n = (T.tones = T.tones || {})[tone] = (T.tones[tone] || 0) + 1;
  for (const who of [T.v, T.third]) {
    const tm = who.isChild() ? 'child' : temperOf(who), [d, lines] = TONE_TAKE[tone][tm] || [0.02, ['Ha.']];
    addRegard(who, n === 1 ? d * 0.8 : n === 2 ? d * 0.32 : -0.02);
    if (who === T.v) T.reply(R.pick(lines)); else T.reply2(R.pick(lines));
  }
}
const PAIR_LINES = {
  warm: ['Now here are two of my favorite people in all the Shire.', 'It does me good to see the two of you together.'],
  witty: ['Plotting something, are we? I want in.', 'Don\'t stop on my account. I love a scandal.'],
  curious: ['What are you two talking about? You both look very serious.', 'Settle something for me: which of you is the better cook?'],
};
const SIDE_LINES = {
  a: ['I\'m with {a} on this one, I\'m afraid, {b}.', 'Come now, {b}. {a} has a point.'],
  b: ['I think {b} is right, {a}. Sorry.', '{a}, you know as well as I do that {b} has the right of it.'],
  peace: ['You two have been friends too long for this. Shake hands.', 'Enough. Nobody is cross with anybody in front of a wizard. Shake.'],
};

addTalkOption({
  id: 'pair_chat', pair: true, order: 35, label: 'Say something to both…',
  when: (v, T) => !!T.third && !quarreling(T),
  run: (v, T) => T.choices(['warm', 'witty', 'curious'].map((tone) => {
    const text = R.pick(PAIR_LINES[tone]);
    return { label: `<span class="tone ${tone}">${tone}</span> ${escapeHtml(text)}`, run: () => { sayToBoth(T, tone, text); T.v.bond(T.third, tone === 'warm' ? 0.02 : 0.01); } };
  })),
});
addTalkOption({
  id: 'pair_topic', pair: true, order: 36, label: 'Change the subject…',
  when: (v, T) => !!T.third && likesOf(T.v).concat(likesOf(T.third)).some((k) => !(T.topics || []).includes(k)),
  run: (v, T) => {
    const a = likesOf(T.v), b = likesOf(T.third), shared = a.filter((k) => b.includes(k));
    // (a subject once talked over isn't brought up again in the same natter)
    const fresh = (k) => !(T.topics || []).includes(k);
    const picks = shared.filter(fresh).concat(a.filter((k) => !shared.includes(k) && fresh(k)).slice(0, 1), b.filter((k) => !shared.includes(k) && fresh(k)).slice(0, 1)).slice(0, 3);
    T.choices(picks.map((k) => ({
      label: `Talk about ${LIKES[k]}${shared.includes(k) ? ' <small>(they both love it)</small>' : ''}`,
      run: () => {
        (T.topics || (T.topics = [])).push(k);
        T.wiz(R.pick([`Tell me, what do you two make of ${LIKES[k]}?`, `I find myself thinking about ${LIKES[k]} lately.`]));
        const both = shared.includes(k);
        if (both) {
          T.reply(R.pick(['Oh! Don\'t get me started.', 'Now you\'re talking!'])); T.reply2(R.pick(['We were only saying the other day!', 'Ha! Same as me.']));
          T.v.bond(T.third, 0.05); addRegard(T.v, 0.03); addRegard(T.third, 0.03);
          if (typeof learnAbout === 'function') { learnAbout(T.v, 'likes', k); learnAbout(T.third, 'likes', k); }
          if (T.quarrel) { T.quarrel = false; if (T.v.task) T.v.task.data.quarrel = false; T.reply(R.pick(['...Well. I suppose we can agree on that.'])); }
        } else {
          const fan = likesOf(T.v).includes(k) ? T.v : T.third, other = fan === T.v ? T.third : T.v;
          (fan === T.v ? T.reply : T.reply2)(R.pick(['Oh, I love that!', 'Now that I could talk about all day.']));
          (other === T.v ? T.reply : T.reply2)(R.pick(['Hm. Each to their own.', 'Can\'t see the appeal myself.']));
          addRegard(fan, 0.04); T.v.bond(T.third, 0.01);
          if (typeof learnAbout === 'function') { learnAbout(fan, 'likes', k); if (dislikes(other, k)) learnAbout(other, 'dislikes', k); }
        }
      },
    })));
  },
});
addTalkOption({
  id: 'pair_side', pair: true, order: 34, label: 'They\'re squabbling: step in…',
  when: (v, T) => !!T.third && quarreling(T),
  run: (v, T) => {
    const a = T.v, b = T.third, fill = (s) => s.replace(/\{a\}/g, a.first).replace(/\{b\}/g, b.first);
    T.choices([
      { label: `Back ${a.first}`, run: () => { T.wiz(fill(R.pick(SIDE_LINES.a))); addRegard(a, 0.08); addRegard(b, -0.1); T.reply('Thank you! Somebody here has sense.'); T.reply2('Oh, of course you\'d take their side.'); a.bond(b, -0.03); } },
      { label: `Back ${b.first}`, run: () => { T.wiz(fill(R.pick(SIDE_LINES.b))); addRegard(b, 0.08); addRegard(a, -0.1); T.reply2('There. You see?'); T.reply('Hmph. I see how it is.'); a.bond(b, -0.03); } },
      { label: 'Make the peace', run: () => {
        T.wiz(R.pick(SIDE_LINES.peace));
        // the more they think of him, the more likely they listen
        const resp = (x) => (typeof bondFull === 'function' ? bondFull(x).respect || 0 : 0);
        const sway = (regardOf(a) + regardOf(b)) / 2 * 0.6 + (resp(a) + resp(b)) / 2 * 0.8 + 0.35;
        // making the peace earns their respect, whichever way it goes in the end
        if (typeof bondFull === 'function') { bondFull(a).respect = clamp((bondFull(a).respect || 0) + 0.03, -1, 1); bondFull(b).respect = clamp((bondFull(b).respect || 0) + 0.03, -1, 1); }
        if (Math.random() < clamp(sway, 0.15, 0.9)) {
          T.quarrel = false; if (a.task) a.task.data.quarrel = false;
          a.bond(b, 0.08); unfeel(a, 'squabble'); unfeel(b, 'squabble');
          T.reply('...Oh, all right. Sorry, ' + b.first + '.'); T.reply2('Me too. Daft, the pair of us.');
          addRegard(a, 0.04); addRegard(b, 0.04);
          if (!a.inside) FX.hearts((a.x + b.x) / 2, (a.y + b.y) / 2 - 14);
        } else { T.reply('With respect, this is none of your business.'); T.reply2('Quite right. Keep out of it.'); addRegard(a, -0.03); addRegard(b, -0.03); }
      } },
    ]);
  },
});
