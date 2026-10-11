'use strict';
// ---------------------------------------------------------------------------
// Bringing the stories to the surface (from the story playtest): filters on
// the Chronicle so love and letters, the village's works, the rifts or
// trouble can each be read on their own; riddling hints for the clues not yet
// found; weddings that happen on the map, with vows; and a rule that the same
// stock line isn't heard all over the village within a few hours.
// ---------------------------------------------------------------------------

const LOG_FILTERS = [
  ['all', 'All', null],
  ['hearts', '♥ Hearts', ['love', 'birth', 'letter', 'party', 'adventure']],
  ['village', '⌂ Village', ['build', 'work', 'info', 'season', 'learn']],
  ['rifts', '✦ Rifts', ['rift']],
  ['trouble', '⚠ Trouble', ['sick', 'quarrel']],
];
const CLUE_HINTS = {
  sigil: 'Look closely at what the rift-folk wear.',
  lullaby: 'Listen at the Mersday sing-song, when the rift-folk are in the taproom.',
  coin: 'Something glints in the rift scars. Scavengers and tinkers might find it.',
  relay: 'Raise the Relay, then listen at dusk.',
  saint: 'Old folk and rift-folk who are friends get to talking about portraits.',
  gold: 'Watch the rifts on a night when the dynamo and the turbine both run.',
  ledger: 'An old name is written somewhere in Thistledown. It will turn up once the village understands the rift-folk\'s ways.',
  voice: 'This one comes at the very end.',
};

window.addEventListener('DOMContentLoaded', () => {
  // Chronicle filters
  const head = document.querySelector('#chronicle .log-head');
  const bar = document.createElement('div');
  bar.className = 'log-filters';
  bar.innerHTML = LOG_FILTERS.map(([k, l]) => `<button data-lf="${k}" class="${k === 'all' ? 'on' : ''}">${l}</button>`).join('');
  head.after(bar);
  bar.querySelectorAll('[data-lf]').forEach((b) => b.addEventListener('click', () => { Game.logFilter = b.dataset.lf; bar.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); renderLog(); }));
  const rl = renderLog;
  renderLog = function () {
    const f = LOG_FILTERS.find((x) => x[0] === (Game.logFilter || 'all'));
    if (!f || !f[2]) return rl();
    const all = Game.log;
    Game.log = all.filter((e) => f[2].includes(e.kind));
    try { rl(); } finally { Game.log = all; }
  };
  // clue hints on the Rifts page
  const rv = renderVillage;
  renderVillage = function () {
    rv();
    if (Game.villageTab !== 'rifts') return;
    const S = story();
    const notFound = Object.keys(FRAGMENTS).filter((k) => !S.frags.includes(k));
    let i = 0;
    $('village-body').querySelectorAll('.likes .sub').forEach((el) => { if (/Not yet found/.test(el.textContent) && notFound[i]) { el.textContent = `◌ ${CLUE_HINTS[notFound[i]] || 'Not yet found'}`; i++; } });
  };
});

// weddings, on the map
{
  const w = wed;
  wed = function (a, b) {
    const r = w(a, b);
    a.wedDay = b.wedDay = Game.day;
    if (!a.inside) { a.say('I do!', 3, { to: b }); FX.hearts(a.x, a.y - 20); }
    if (!b.inside) { b.say('And so do I!', 3, { to: a }); FX.hearts(b.x, b.y - 20); }
    for (const o of Game.villagers) if (o !== a && o !== b && !o.inside && o.stage !== 'baby' && ((o.rel[a.id] || 0) > 0.4 || (o.rel[b.id] || 0) > 0.4) && R.chance(0.6)) o.say(R.pick(['Hurrah for the happy couple!', 'Doesn\'t she look a picture?', 'Kiss! Kiss!', 'I always knew!']), 3);
    toast(`${a.first} and ${b.first} are wed! There'll be dancing tonight.`, 'love');
    return r;
  };
}

// the same stock line isn't heard all over the village within a few hours
{
  const say = Villager.prototype.say;
  Villager.prototype.say = function (text, dur, opts = {}) {
    if (text && !opts.to && text.length >= 14) {
      const seen = Game._lines || (Game._lines = new Map());
      const last = seen.get(text);
      if (last != null && Game.time - last < (opts.think ? 240 : 150)) return;
      seen.set(text, Game.time);
      if (seen.size > 600) { for (const [k, t] of seen) if (Game.time - t > 240) seen.delete(k); }
    }
    return say.call(this, text, dur, opts);
  };
}
