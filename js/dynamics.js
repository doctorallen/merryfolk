'use strict';
// ---------------------------------------------------------------------------
// Family dynamics (The Sims' "Growing Together"). Every parent and child have
// a way of being together that comes from their natures: Close (warm, easy),
// Jokesters (forever teasing), Competitive (everything's a contest), or a bit
// Distant (fond, but they don't say much). It's on the Kin tab, and it
// colours family dinners and bedtime stories: what's said round the table,
// and how everyone feels after.
// ---------------------------------------------------------------------------

const DYNAMICS = {
  close: { label: 'Close', lines: ['Pass the gravy, love.', 'How was your day, really?', 'I\'m proud of you, you know.'], feel: ['A cosy family dinner', 0.05] },
  jokers: { label: 'Jokesters', lines: ['Who put salt in my tea? WHO?', 'That\'s not a pie, that\'s a doorstop.', 'Knock knock! No, stop groaning.'], feel: ['Laughed till we cried at dinner', 0.06] },
  rivals: { label: 'Competitive', lines: ['Bet I can eat more than you.', 'I\'ll beat you at conkers tomorrow.', 'Mine\'s the bigger slice. Fair\'s fair.'], feel: ['A lively dinner (I won)', 0.03] },
  distant: { label: 'A bit distant', lines: ['...', 'Pass the salt.', 'Mm.'], feel: ['A quiet dinner; nobody said much', -0.02] },
};
function dynamicOf(a, b) {
  const sum = (k) => (a.genes[k] || 0.5) + (b.genes[k] || 0.5);
  const merry = sum('merriness'), temper = sum('temper'), soc = sum('sociability');
  const h = hash2(Math.min(a.id, b.id) * 17 + 3, Math.max(a.id, b.id) * 7 + 1) * 0.3;
  if (merry + h > 1.35) return 'jokers';
  if (temper + h > 1.25) return 'rivals';
  if (soc + h < 0.85) return 'distant';
  return 'close';
}
function familyPairs(v) {
  const out = [];
  for (const o of Game.villagers) if (o !== v && !o.leaving && (o.parents.includes(v.id) || v.parents.includes(o.id))) out.push(o);
  return out;
}
window.addEventListener('DOMContentLoaded', () => {
  const fdt = familyDinnerTick;
  familyDinnerTick = function (v, task) {
    const was = task.data.together;
    const r = fdt(v, task);
    if (!was && task.data.together && R.chance(0.5)) {
      const fam = familyPairs(v).filter((o) => o.inside === v.inside && o.stage !== 'baby');
      if (fam.length && v.stage !== 'baby') {
        const o = R.pick(fam), d = DYNAMICS[dynamicOf(v, o)];
        v.say(R.pick(d.lines), 3, { to: o });
        if (!MOODLETS['dyn_' + dynamicOf(v, o)]) MOODLETS['dyn_' + dynamicOf(v, o)] = [d.feel[0], d.feel[1], 600, []];
        feel(v, 'dyn_' + dynamicOf(v, o)); feel(o, 'dyn_' + dynamicOf(v, o));
      }
    }
    return r;
  };
  const bd = ACTIONS.bedtime_story.done;
  ACTIONS.bedtime_story.done = function (v, task) {
    for (const k of storyKids(v)) { const d = dynamicOf(v, k); k.remember(d === 'jokers' ? `${v.first} did all the voices in my bedtime story. I laughed so much.` : d === 'rivals' ? `${v.first} and I argued about how the story should end.` : d === 'distant' ? `${v.first} read me a story. It was nice, I think.` : `${v.first} read me a story and tucked me in.`, d === 'distant' ? 0 : 1); }
    return bd(v, task);
  };
  // on the Kin tab
  const pk = panelKin;
  panelKin = function (v) {
    let h = pk(v);
    const fam = familyPairs(v);
    if (fam.length) h += `<h3>How they get on</h3><div class="likes">${fam.map((o) => `<div><a data-v="${o.id}">${escapeHtml(o.first)}</a> <span class="sub">(${o.parents.includes(v.id) ? (o.genes.sex === 'f' ? 'daughter' : 'son') : (o.genes.sex === 'f' ? 'mother' : 'father')})</span>: ${DYNAMICS[dynamicOf(v, o)].label}</div>`).join('')}</div>`;
    return h;
  };
});
