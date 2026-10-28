'use strict';
// ---------------------------------------------------------------------------
// You and them. Playing as the wizard, every hobbit has a history with you
// (Game.wizBond, by villager id): when you met, how often you've talked and
// when last, how far they trust you, what you've given them, what they've
// heard and seen you do, and what you've learned about them along the way
// (their wish, their dream, what they love and can't abide, home and the one
// they lost, for the rift-born). Their fondness for you is the regard in
// Game.wizRel. It shows as a strip on the conversation sheet and in full on
// the "You" tab of their panel; conversation reads and writes it.
// ---------------------------------------------------------------------------

function bondOf(v) {
  const all = Game.wizBond || (Game.wizBond = {});
  return all[v.id] || (all[v.id] = { talks: 0, last: 0, trust: 0, gifts: [], notes: [], known: {} });
}
// a line in your shared history, newest first, a dozen kept
function bondNote(v, text) {
  const b = bondOf(v);
  if (b.notes[0] && b.notes[0].t === text && b.notes[0].d === Game.day) return;
  b.notes.unshift({ d: Game.day, t: text });
  if (b.notes.length > 12) b.notes.length = 12;
}
// something you've learned about them (kept, with the day you learned it)
function learnAbout(v, key, value = true) {
  const k = bondOf(v).known;
  if (Array.isArray(k[key])) { if (!k[key].includes(value)) k[key].push(value); }
  else if (key === 'likes' || key === 'dislikes') k[key] = [value];
  else k[key] = { v: value, d: Game.day };
}
function addTrust(v, d) { const b = bondOf(v); b.trust = clamp((b.trust || 0) + d, 0, 1); }

const trustWord = (t) => (t > 0.7 ? 'would trust you with anything' : t > 0.45 ? 'trusts you' : t > 0.2 ? 'trusts you a little' : t > 0.05 ? 'is still making up their mind about you' : 'doesn\'t know you well enough to trust you');
function sinceWord(day) { const n = Game.day - day; return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`; }

// One line for the conversation sheet: how long you've known them, and how they feel.
function bondStrip(v) {
  const b = bondOf(v), met = (Game.wizMet || {})[v.id];
  if (!met) return '';
  const r = regardOf(v), pct = Math.round(((r + 1) / 2) * 100);
  return `<div class="bond-strip"><span class="bond-bar" title="How fond of you they are"><i style="width:${pct}%" class="${r < -0.1 ? 'cool' : ''}"></i></span><span>${escapeHtml(regardWord(v))}</span><span class="sub">· ${b.talks} talk${b.talks === 1 ? '' : 's'}, ${b.trust > 0.2 ? trustWord(b.trust).replace(/^is /, '') : 'met ' + sinceWord(met)}</span></div>`;
}

// The full page: how they feel, what you've been through, what you know.
function panelYou(v) {
  const b = bondOf(v), met = (Game.wizMet || {})[v.id], k = b.known, r = regardOf(v);
  if (!met) return `<p class="sub">You haven't met ${escapeHtml(v.first)} yet. Walk over and say good day.</p>`;
  const pron = v.pron;
  const rows = [];
  const pct = Math.round(((r + 1) / 2) * 100);
  let h = `<h4>How ${escapeHtml(v.first)} feels about you</h4>
    <div class="bond-row"><span>Fondness</span><span class="bond-bar big"><i style="width:${pct}%" class="${r < -0.1 ? 'cool' : ''}"></i></span><b>${escapeHtml(regardWord(v))}</b></div>
    <div class="bond-row"><span>Trust</span><span class="bond-bar big"><i style="width:${Math.round((b.trust || 0) * 100)}%" class="trust"></i></span><b>${escapeHtml(v.first)} ${escapeHtml(trustWord(b.trust || 0))}</b></div>`;
  // what's warmed or cooled them lately, in their own words
  const said = (v.memories || []).filter((m) => /wizard|Gandalf/i.test(m.t)).slice(0, 3);
  if (said.length) h += `<p class="bond-said">${said.map((m) => `“${escapeHtml(m.t)}”`).join('<br>')}</p>`;

  const bf = typeof bondFull === 'function' ? bondFull(v) : b;
  const resp = bf.respect || 0;
  h += `<div class="bond-row"><span>Respect</span><span class="bond-bar big"><i style="width:${Math.round(((resp + 1) / 2) * 100)}%" class="respect"></i></span><b>${escapeHtml(resp > 0.4 ? 'Hangs on your word' : resp > 0.15 ? 'Listens to you' : resp < -0.2 ? 'Thinks you a meddler' : 'Makes up their own mind')}</b></div>`;
  if (bf.owe > 0) h += `<p class="sub">${escapeHtml(v.first)} owes you a favor.</p>`; else if (bf.owe < 0) h += `<p class="sub">You owe ${escapeHtml(v.first)} a favor.</p>`;
  if (bf.told && bf.told.length) h += `<h4>Things ${escapeHtml(v.first)} has told you</h4><ul class="bond-list">${bf.told.slice(0, 8).map((x) => `<li>${x.secret ? '🤫 ' : ''}${escapeHtml(x.t)}</li>`).join('')}</ul>`;
  if (bf.jokes && bf.jokes.length) h += `<h4>Between you</h4><ul class="bond-list">${bf.jokes.slice(0, 5).map((x) => `<li>${escapeHtml(x.t)}</li>`).join('')}</ul>`;
  const ps = (bf.promises || []).slice(0, 6);
  if (ps.length) h += `<h4>Promises</h4><ul class="bond-list">${ps.map((p) => `<li>${escapeHtml(p.t)} <span class="sub">(${p.state === 'open' ? `by day ${p.due}` : p.state})</span></li>`).join('')}</ul>`;
  const sore = Object.keys(bf.sore || {}).filter((k) => bf.sore[k] > Game.day && THREADS && THREADS[k]);
  if (sore.length) h += `<p class="sub">Best not to mention: ${sore.map((k) => escapeHtml(threadLabel(THREADS[k], null).replace(/\?$/, '').toLowerCase())).join(', ')} (for now).</p>`;
  h += '<h4>You and them</h4><ul class="bond-list">';
  h += `<li>Met ${sinceWord(met)} (day ${met}); ${b.talks} talk${b.talks === 1 ? '' : 's'}${b.last ? `, the last ${sinceWord(b.last)}` : ''}.</li>`;
  if (b.gifts.length) h += `<li>You've given ${pron.them} ${b.gifts.slice(0, 4).map((g) => escapeHtml(g.what)).join(', ')}${b.gifts.length > 4 ? ` and ${b.gifts.length - 4} more` : ''}.</li>`;
  for (const n of b.notes.slice(0, 8)) h += `<li><span class="sub">Day ${n.d}:</span> ${escapeHtml(n.t)}</li>`;
  h += '</ul>';

  h += '<h4>What you know</h4><ul class="bond-list">';
  if (v.job) { const j = JOBS[v.job].label.toLowerCase(); rows.push(`Works as ${/^[aeiou]/.test(j) ? 'an' : 'a'} ${j}.`); }
  if (v.homeId >= 0) rows.push(`Lives at ${escapeHtml(v.home().name)}.`);
  const sp = v.spouse && person(v.spouse);
  if (sp) rows.push(`Married to ${escapeHtml(sp.first)}.`);
  const kids = Game.villagers.filter((o) => o.parents && o.parents.includes(v.id));
  if (kids.length) rows.push(`${kids.length === 1 ? 'A child' : 'Children'}: ${kids.map((o) => escapeHtml(o.first)).join(', ')}.`);
  if (k.wish) rows.push(`Wished for ${escapeHtml(k.wish.v.charAt(0).toLowerCase() + k.wish.v.slice(1))} <span class="sub">(${sinceWord(k.wish.d)})</span>.`);
  if (k.dream) rows.push(`Dreams of ${escapeHtml(k.dream.v.charAt(0).toLowerCase() + k.dream.v.slice(1))}.`);
  if (k.likes && k.likes.length) rows.push(`Loves ${k.likes.map((x) => LIKES[x] || x).join(' and ')}.`);
  if (k.dislikes && k.dislikes.length) rows.push(`Can't abide ${k.dislikes.map((x) => LIKES[x] || x).join(' or ')}.`);
  if (k.hobby) rows.push(`Spends spare hours on ${escapeHtml(k.hobby.v)}.`);
  for (const key in k) if (!['wish', 'dream', 'likes', 'dislikes', 'hobby'].includes(key) && k[key] && k[key].v && typeof k[key].v === 'string') rows.push(escapeHtml(k[key].v));
  if (!k.wish && !k.dream) rows.push('<span class="sub">Ask what\'s on their mind to learn what they wish for.</span>');
  h += rows.map((x) => `<li>${x}</li>`).join('') + '</ul>';
  return h;
}

window.addEventListener('DOMContentLoaded', () => {
  registerField('wizBond', {});
  addHook('newVillage', () => { Game.wizBond = {}; });
  // talks: counted as they start
  patch(window, 'startTalk', (st) => function (v) {
    const before = Play.talk;
    const r = st.apply(this, arguments);
    if (!before && Play.talk) {
      for (const o of [Play.talk.v, Play.talk.third].filter(Boolean)) {
        const b = bondOf(o);
        if (!b.talks) bondNote(o, 'You met.');
        b.talks++; b.last = Game.day;
        // a friendly word now and then builds trust slowly
        if (regardOf(o) > 0.1) addTrust(o, 0.01);
      }
      renderTalk();
    }
    return r;
  }, 'bond');
  // what happens between you is written down as it happens
  patch(window, 'feel', (fl) => function (v, key, x) {
    const r = fl.apply(this, arguments);
    if (v && typeof key === 'string' && key.startsWith('wizard') && playMode()) {
      if (key === 'wizard_gift') { bondOf(v).gifts.unshift({ d: Game.day, what: x }); addTrust(v, 0.03); }
      else if (key === 'wizard_tale') bondNote(v, `Heard you tell the tale ${x}.`);
      else if (key === 'wizard_show') bondNote(v, 'Watched your fireworks.');
      else if (key === 'wizard_snub') bondNote(v, 'Was put out by something you said.');
    }
    return r;
  }, 'bond');
  // the conversation sheet carries the strip, under the name
  patch(window, 'renderTalk', (rt) => function () {
    const r = rt.apply(this, arguments);
    const T = Play.talk;
    if (T && !T.third) {
      const body = $('sheet-body');
      if (body && !body.querySelector('.bond-strip')) body.insertAdjacentHTML('afterbegin', bondStrip(T.v));
    }
    return r;
  }, 'bond');
  // asking what's on their mind teaches you their wish (or dream)
  for (const o of TalkOptions) {
    if (o.id === 'mind') { const run = o.run; o.run = (v, T) => { run(v, T); const w = wishesOf(v)[0]; if (w && WISHES[w.k]) learnAbout(v, 'wish', wishText(w)); else if (v.dream && DREAMS[v.dream.k]) learnAbout(v, 'dream', dreamText(v.dream)); }; }
  }
  // the panel's You tab, and in the wizard's game it's the first thing you see
  patch(window, 'selectVillager', (sv) => function (v) { const r = sv.apply(this, arguments); if (v && playMode() && Game.panelTab !== 'you' && !Play.keepTab) { Game.panelTab = 'you'; renderPanel(true); } return r; }, 'bond');
});
