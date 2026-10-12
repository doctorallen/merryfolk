'use strict';
// ---------------------------------------------------------------------------
// Manner: nature in the mouth. A strong trait gives someone a way of talking
// that colours what they say, whatever the topic: the quick-tempered are
// sharp, the merry crack jokes, the quick-witted have an aside for everything,
// the curious turn statements into questions, and those who keep to
// themselves say the least they can. Applied to conversation lines and to
// musings; how often, and the trait threshold, are in TUNE.manner.
// ---------------------------------------------------------------------------

const MANNERS = {
  sharp: { trait: 'temper', word: 'sharp-tongued', tails: [' Hmph.', ' And that\'s that.', ' Don\'t argue.', ' If you must know.', ' Not that it\'s any of your business.'], heads: ['Look, ', 'Listen. '] },
  joking: { trait: 'merriness', word: 'given to jokes', tails: [' Ha!', ' Or so they tell me.', ' I jest. Mostly.', ' Don\'t look at me like that, it\'s true!', ' Pull the other one.'], heads: [] },
  witty: { trait: 'wit', word: 'quick with an aside', tails: [' As my aunt used to say.', ' Mark my words.', ' There\'s a riddle in that somewhere.', ' Which is more than can be said for some.', ' Write that down.'], heads: ['Well now. ', 'Ah, but '] },
  questioning: { trait: 'curiosity', word: 'forever asking', tails: [' Don\'t you think?', ' Wouldn\'t you say?', ' And why is that, I wonder?', ' What do you make of it?', ' Have you noticed that?'], heads: ['I wonder: '] },
  terse: { trait: null, word: 'a hobbit of few words', tails: [], heads: [] },
};
const MANNER_KEYS = Object.keys(MANNERS);

// The manners someone has, by their nature: a strong trait each, and few words for the retiring.
function mannerOf(v) {
  if (v.stage === 'baby') return [];
  const t = TUNE.manner.threshold, g = v.genes, out = [];
  for (const k of MANNER_KEYS) { const tr = MANNERS[k].trait; if (tr && g[tr] >= t) out.push(k); }
  if (g.sociability <= 1 - t) out.push('terse');
  return out;
}
function mannerWords(v) { return mannerOf(v).map((k) => MANNERS[k].word).join(', '); }

// A line in their manner: now and then, a head or a tail, or for the terse, the first sentence only.
function applyManner(text, v) {
  if (!text || !v) return text;
  const ms = mannerOf(v);
  if (!ms.length || text.startsWith('*')) return text;
  const k = R.pick(ms);
  if (k === 'terse') {
    const first = text.match(/^[^.!?]*[.!?]/);
    const cut = first ? first[0].trim() : text;
    return R.chance(0.6) ? cut.replace(/!+$/, '.') : cut;
  }
  if (!R.chance(TUNE.manner.rate)) return text;
  const M = MANNERS[k];
  if (M.heads.length && R.chance(0.3) && /^[A-Z]/.test(text) && !text.includes('{')) return R.pick(M.heads) + text.charAt(0).toLowerCase() + text.slice(1);
  if (/[.!?]$/.test(text) && text.length < 90) return text + R.pick(M.tails);
  return text;
}

window.addEventListener('DOMContentLoaded', () => {
  if (typeof nextTurn === 'function') {
    const nt = nextTurn;
    nextTurn = function (conv) {
      const t = nt(conv);
      if (t && t.text && !t.end) t.text = applyManner(t.text, t.who);
      return t;
    };
  }
  // musings aloud take their manner too
  const chatter = Villager.prototype.chatter;
  Villager.prototype.chatter = function () {
    chatter.call(this);
    if (this.bubble && this.bubble.think && this.isGrown()) this.bubble.text = applyManner(this.bubble.text, this);
  };
});
