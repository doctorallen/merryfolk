'use strict';
// ---------------------------------------------------------------------------
// Gossip, of the harmless sort. Whatever the Chronicle hears of (a wedding, a
// new baby, a birthday, an elder setting off, a letter from far away, a
// squabble in the lane), a few folk hear of it first, and then it goes round:
// at the Tipsy Badger above all, but in any natter in the lane. "Did you hear?
// Rose and Bilbo were wed beneath the party tree!" Each bit of news is only
// news once, so you can watch it spread, and the Census tab lists the talk of
// the village and how many have heard. Nobody is ever the worse for it: it's
// news, never spite.
// ---------------------------------------------------------------------------

const NEWSWORTHY = new Set(['love', 'birth', 'party', 'adventure', 'letter', 'quarrel', 'rift', 'build', 'learn', 'work']);
MOODLETS.gossip = ['Heard some news: {x}', 0.04, 300, ['Well I never. Fancy that.', 'Wait till I tell the others.']];
LINES.surprise = {
  plain: ['Never!', 'Get away!', 'Well, I\'ll be!', 'Ooh, who\'d have thought.'],
  common: ['Well I never!', 'You don\'t say!', 'Fancy that!', 'Bless my buttons!'],
  fine: ['How perfectly extraordinary.', 'Goodness, I had no idea.', 'What splendid news.'],
  child: ['Really? Wow!', 'No way!', 'Ooh! Tell me more!'],
  bright: ['Really? How marvellous!', 'Goodness! Truly?'],
};
function newsList() { return Game.news || (Game.news = []); }
function knowsNews(v, n) { return n.knowers.includes(v.id); }
// The first sentence, as it would be told.
function newsLine(text) {
  const first = text.split(/(?<=[.!?])\s/)[0].replace(/^(It's|There's)\s/, (m) => m);
  return first;
}
function addNews(text, kind) {
  if (!Game.started || !NEWSWORTHY.has(kind) || text.length > 220) return;
  const n = { id: (Game.newsSeq = (Game.newsSeq || 0) + 1), text: newsLine(text), kind, day: Game.day, knowers: [] };
  // the few who saw or heard it first: whoever's named in it, and a couple of others
  for (const v of Game.villagers) if (v.stage !== 'baby' && (text.includes(v.first + ' ') || text.includes(v.first + ',') || text.includes(v.first + '\''))) n.knowers.push(v.id);
  const others = Game.villagers.filter((v) => v.isGrown() && !n.knowers.includes(v.id));
  for (let i = 0; i < 2 && others.length; i++) n.knowers.push(others.splice(Math.floor(Math.random() * others.length), 1)[0].id);
  // the innkeeper hears everything sooner or later
  const inn = Game.villagers.find((v) => v.job === 'innkeeper');
  if (inn && !n.knowers.includes(inn.id)) n.knowers.push(inn.id);
  newsList().unshift(n);
  if (Game.news.length > 30) Game.news.length = 30;
}
// Some news the speaker has that the listener hasn't, freshest first, and not about the listener.
function newsToTell(s, l) {
  // never news about the listener, the speaker, or either of their households
  const about = (v) => [v.first, v.surname, v.homeId >= 0 ? v.home().name : null].filter(Boolean);
  const names = about(l).concat(about(s));
  return newsList().find((n) => Game.day - n.day <= 4 && knowsNews(s, n) && !knowsNews(l, n) && !names.some((w) => n.text.includes(w)));
}
function tellNews(s, l, n) {
  n.knowers.push(l.id);
  feel(l, 'gossip', n.text.length > 40 ? n.text.slice(0, 38).replace(/\s\S*$/, '') + '...' : n.text);
  s.bond(l, 0.01);
  const opener = R.pick(['Did you hear? ', 'You\'ll never guess! ', 'Have you heard? ', 'Word is, ', 'They\'re saying ']);
  const t = n.text.replace(/\.$/, '');
  return opener + (opener === 'Word is, ' || opener === 'They\'re saying ' ? t.charAt(0).toLowerCase() + t.slice(1) : t) + (/[!?]$/.test(t) ? '' : '!');
}

// In any friendly natter there's a chance of news; at the inn, a good one.
{
  const cv = converse;
  converse = function (speaker, listener, mode) {
    if (!mode && speaker.stage !== 'baby' && listener.stage !== 'baby') {
      const atInn = speaker.inside && World.inn && speaker.inside === World.inn;
      const n = newsToTell(speaker, listener);
      if (n && R.chance(atInn ? 0.85 : 0.5)) { listener.pendingReply = 'surprise'; return tellNews(speaker, listener, n); }
    }
    return cv(speaker, listener, mode);
  };
}
// Folk who spend time together pass news on: in the same room (the taproom
// above all, of an evening), or out in the lane within earshot.
function talkTick(h) {
  const awake = Game.villagers.filter((v) => v.stage !== 'baby' && !v.leaving && !(v.task && ['sleep', 'lodge', 'sleep_rough', 'nap'].includes(v.task.a.id) && v.task.phase === 'do'));
  for (const s of awake) for (const l of awake) {
    if (s === l) continue;
    const together = s.inside ? s.inside === l.inside : !l.inside && dist(s.x, s.y, l.x, l.y) < 50;
    if (!together) continue;
    const n = newsToTell(s, l);
    if (!n) continue;
    const atInn = s.inside && s.inside === World.inn;
    if (R.chance(atInn && h >= 17 ? 0.6 : 0.25)) tellNews(s, l, n);
  }
}
function innTalk() { talkTick(20); }

// and over dinner, the day's news goes round the table
function dinnerTalk() {
  for (const h of World.homes) {
    if (!h.built) continue;
    const res = residentsOf(h).filter((v) => v.stage !== 'baby' && v.inside === h);
    if (res.length < 2) continue;
    for (const n of newsList().filter((x) => Game.day - x.day <= 2).slice(0, 6)) {
      const teller = res.find((v) => knowsNews(v, n));
      if (teller) for (const l of res) if (!knowsNews(l, n) && R.chance(0.7)) tellNews(teller, l, n);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const ch = chronicle;
  chronicle = function (text, kind = 'info') { const r = ch(text, kind); addNews(text, kind); return r; };
  addHook('onHour', (h) => { if (h >= 8 && h <= 23) talkTick(h); if (h === 19 || h === 8) dinnerTalk(); });
  addHook('newVillage', () => { Game.news = []; Game.newsSeq = 0; });
  // the talk of the village, on the Census tab
  const vc = villageCensus;
  villageCensus = function () {
    const ns = newsList().filter((n) => Game.day - n.day <= 4).slice(0, 8);
    const pop = Game.villagers.filter((v) => v.stage !== 'baby').length;
    const talk = ns.length ? `<h3>Talk of the village</h3><div class="likes">${ns.map((n) => `<div>${escapeHtml(n.text)} <span class="sub">(${n.knowers.filter((id) => Game.villagers.some((v) => v.id === id)).length} of ${pop} have heard)</span></div>`).join('')}</div>` : '';
    return vc() + talk;
  };
});
