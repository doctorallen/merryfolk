'use strict';
// ---------------------------------------------------------------------------
// The Steward's Desk: running the village, not just watching it. (Stronghold's
// rations and ale, Age of Empires' villager allocation, SimCity's migration.)
//
//  * Rations: lean (food lasts longer, folk grumble), fair, generous or
//    feasts (everyone's cheerful, the Store empties fast).
//  * The ale: kept dry, a pint or two, or flowing (merrier, thirstier).
//  * The working week: an easy week (two rest days), the usual, or a busy
//    one (no Highday: more gets done, and folk feel it).
//  * Contentment: the village's mood as one number, with what's lifting and
//    sinking it. A contented village gets talked about on the road, and
//    travellers come looking to settle; a discontented one doesn't.
//  * Workforce: how many hands each trade should have. The village fills
//    them, moving folk between trades when you change the numbers.
// ---------------------------------------------------------------------------

const POLICY = {
  rations: { label: 'Rations', opts: [['lean', 'Lean'], ['fair', 'Fair'], ['generous', 'Generous'], ['feast', 'Feasts']], def: 'fair',
    desc: { lean: 'Half portions: the Store lasts much longer, but bellies grumble', fair: 'Ordinary helpings', generous: 'Second helpings now and then: more cheerful, more food used', feast: 'Hobbit-sized portions every meal: very merry, very hungry Store' } },
  ale: { label: 'Ale', opts: [['dry', 'Dry'], ['some', 'A pint or two'], ['flowing', 'Flowing']], def: 'some',
    desc: { dry: 'No ale served: the barrels last, the taproom sulks', some: 'Ale as usual', flowing: 'Generous pints: merrier evenings, twice the ale used' } },
  week: { label: 'Working week', opts: [['easy', 'Easy'], ['usual', 'Usual'], ['busy', 'Busy']], def: 'usual',
    desc: { easy: 'Sunday and Highday off: less done, happier folk', usual: 'Highday off', busy: 'No day of rest: more done, wearier folk' } },
};
function policy(k) { return (Game.policy && Game.policy[k]) || POLICY[k].def; }
function setPolicy(k, v) {
  (Game.policy || (Game.policy = {}))[k] = v;
  const word = POLICY[k].opts.find((o) => o[0] === v)[1];
  chronicle(`By order of the Steward: ${POLICY[k].label.toLowerCase()} ${k === 'week' ? 'will be' : 'are now'} ${word.toLowerCase()}. ${POLICY[k].desc[v]}.`, 'info');
}

// --- Rations and ale ---------------------------------------------------------
{
  const wrapMeal = (A, fromStore) => {
    const st = A.start;
    A.start = function (v, task) {
      if (!st(v, task)) return false;
      const r = policy('rations'), k = task.data.food;
      const sat = task.sat || (task.sat = { ...A.sat });
      if (r === 'lean') {
        sat.hunger = (sat.hunger || 0) * 0.65;
        // half a portion: half the time it doesn't use a whole helping
        if (R.chance(0.5)) { if (fromStore) Village.stores[k] = (Village.stores[k] || 0) + 1; else v.home().pantry[k]++; }
      } else if (r === 'generous' || r === 'feast') {
        sat.hunger = (sat.hunger || 0) * (r === 'feast' ? 1.25 : 1.12);
        sat.bored = (sat.bored || 0) - 0.08;
        if (r === 'feast' || R.chance(0.5)) { if (fromStore) { if ((Village.stores[k] || 0) > 0) Village.use(k, 1); } else if (v.home().pantry[k] > 0) v.home().pantry[k]--; }
      }
      return true;
    };
  };
  wrapMeal(ACTIONS.eat_home, false);
  wrapMeal(ACTIONS.eat_inn, true);
  const ale = ACTIONS.ale, av = ale.avail, ast = ale.start;
  ale.avail = (v, h) => policy('ale') !== 'dry' && av(v, h);
  ale.start = function (v, task) {
    if (ast && !ast(v, task)) return false;
    if (policy('ale') === 'flowing' && Village.stores.ale >= 1) { Village.use('ale', 1); task.sat = { ...(task.sat || ale.sat), bored: (ale.sat.bored || 0) - 0.15 }; }
    return true;
  };
}

// --- The working week --------------------------------------------------------
{
  const score = Villager.prototype.score;
  Villager.prototype.score = function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s <= 0 || !a.job || NEVER_REST.has(a.id)) return s;
    const w = policy('week'), day = weekday(Game.day);
    const mul = (n, f) => { s *= f; if (ex) ex.mul.push([n, f]); };
    if (w === 'easy' && day === 'Sunday') mul('Steward\'s day off', 0.3);
    if (w === 'busy') mul(isRestDay(Game.day) ? 'no day of rest' : 'a busy week', isRestDay(Game.day) ? 3.3 : 1.15);
    return s;
  };
  const sf = stateFeelings;
  stateFeelings = function (v) {
    const out = sf(v);
    if (v.stage === 'baby') return out;
    const r = policy('rations');
    if (r === 'lean') out.push(['Short rations', -0.08]);
    else if (r === 'generous') out.push(['Generous helpings', 0.04]);
    else if (r === 'feast') out.push(['Feasting every day', 0.08]);
    if (v.isGrown()) {
      const a = policy('ale');
      if (a === 'dry' && (v.genes.taste.ale || 1) > 0.9) out.push(['The taproom\'s gone dry', -0.06]);
      else if (a === 'flowing') out.push(['The ale\'s flowing', 0.04]);
      const w = policy('week');
      if (w === 'easy') out.push(['An easy week', 0.04]);
      else if (w === 'busy' && v.job) out.push(['All work and no play', -0.07]);
    }
    return out;
  };
}

// --- Contentment ---------------------------------------------------------------
function contentment() {
  if (Game._contAt != null && Math.abs(Game.time - Game._contAt) < 3) return Game._cont;
  Game._contAt = Game.time;
  return (Game._cont = contentmentNow());
}
function contentmentNow() {
  const pop = Game.villagers.filter((v) => v.stage !== 'baby' && !v.leaving);
  return pop.length ? Math.round(pop.reduce((s, v) => s + v.mood(), 0) / pop.length * 100) : 50;
}
// What's lifting and sinking the village, summed over everyone.
function contentmentReasons() {
  const tally = {};
  for (const v of Game.villagers) {
    if (v.stage === 'baby' || v.leaving) continue;
    for (const [label, val, , m] of feelingsOf(v)) {
      const key = m ? MOODLETS[m.k][0].replace(/:? ?\{x\}('s)?/g, '').replace(/ (with|from|by|at)$/, '').trim() : label;
      tally[key] = (tally[key] || 0) + val;
    }
    for (const d of ['hunger', 'tired', 'lonely', 'cold', 'bored']) if (v.drives[d] > 0.6) { const k = { hunger: 'Hungry', tired: 'Worn out', lonely: 'Lonely', cold: 'Cold', bored: 'Bored' }[d]; tally[k] = (tally[k] || 0) - v.drives[d] * 0.1; }
  }
  const all = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  return { up: all.filter(([, n]) => n > 0).slice(0, 5), down: all.filter(([, n]) => n < 0).reverse().slice(0, 5) };
}
// A contented village is talked about on the road.
function migrationDaily() {
  const c = contentment();
  Game.contentLog = (Game.contentLog || []).concat([c]).slice(-30);
  const empty = World.homes.filter((h) => h.built && residentsOf(h).length === 0).length;
  if (c >= 66 && (empty || c >= 78) && Game.villagers.length < MAX_POP - 2 && Game.day - (Game.lastTraveller ?? -9) >= 2 && R.chance((c - 60) / 90 + (empty ? 0.1 : 0))) {
    const r = welcomeTraveller(null, true);
    if (r && r.ok !== false) { Game.lastTraveller = Game.day; chronicle(`Word of Thistledown's good cheer has got about: ${r.v ? r.v.name() : 'a traveller'} has come up the West Road hoping to settle.`, 'birth'); }
  }
}

// --- Workforce -----------------------------------------------------------------
function jobPlan() { return Game.jobPlan || (Game.jobPlan = {}); }
{
  const jt = jobTargets;
  jobTargets = function () {
    const t = jt();
    for (const [j, n] of Object.entries(jobPlan())) if (typeof n === 'number' && j in t) t[j] = n;
    return t;
  };
}
// Trim a trade down to its target: the least suited go back to finding work.
function trimTrades() {
  const t = jobTargets(), counts = jobCounts();
  for (const j in t) {
    let extra = counts[j] - t[j];
    if (extra <= 0 || typeof jobPlan()[j] !== 'number') continue;
    const folk = Game.villagers.filter((v) => v.job === j && !v.leaving).sort((a, b) => jobFit(a, j) - jobFit(b, j));
    for (const v of folk) { if (extra <= 0) break; v.job = null; v.playerJob = false; v.remember(`Was asked to leave the ${JOBS[j].label.toLowerCase()}'s work for something else.`, 0); extra--; }
  }
  assignJobs(false);
  // and fill a trade up to what you asked for: the best suited come over from trades that can spare them
  const t2 = jobTargets(), c2 = jobCounts();
  for (const [j, want] of Object.entries(jobPlan())) {
    let short = want - (c2[j] || 0);
    while (short > 0) {
      const v = Game.villagers.filter((o) => o.isGrown() && !o.leaving && !o.newcomer && o.job !== j && (!o.job || (c2[o.job] > Math.max(1, t2[o.job] ?? 1) - (typeof jobPlan()[o.job] === 'number' ? 0 : 1) && c2[o.job] > 1 && typeof jobPlan()[o.job] !== 'number')) && !(o.stage === 'elder' && o.age > ELDER_DAYS * 1.2))
        .sort((a, b) => jobFit(b, j) - jobFit(a, j))[0];
      if (!v) break;
      if (v.job) c2[v.job]--;
      chronicle(`${v.name()} has ${v.job ? `left the ${JOBS[v.job].label.toLowerCase()}'s work` : 'been asked'} to take up the ${JOBS[j].label.toLowerCase()}'s trade, at the Steward's request.`, 'work');
      v.job = j; c2[j] = (c2[j] || 0) + 1; short--;
    }
  }
}

// --- The desk itself, as the first tab of the village ledger --------------------
function stewardHTML() {
  const c = contentment(), why = contentmentReasons();
  const trend = (Game.contentLog || []).slice(-2);
  const arrow = trend.length === 2 ? (trend[1] > trend[0] + 1 ? '▲' : trend[1] < trend[0] - 1 ? '▼' : '') : '';
  let h = `<p class="lede-s">Run Thistledown your way. Every choice has a cost: watch the contentment meter and the Store.</p>`;
  h += `<div class="st-meter"><div class="st-num" data-level="${c >= 66 ? 'good' : c >= 45 ? 'mid' : 'low'}">${c}%${arrow ? ` <small>${arrow}</small>` : ''}</div><div><b>Contentment</b>${bar(c / 100, c >= 66 ? 'good' : c >= 45 ? 'mid' : 'low')}<div class="sub">${c >= 66 ? 'A happy village: travellers hear of it and come looking to settle.' : c >= 45 ? 'Middling. Folk are getting by.' : 'Discontented. Nobody new will want to come.'}</div></div></div>`;
  h += `<div class="st-why"><div><h4>Lifting spirits</h4>${why.up.map(([k]) => `<div>+ ${escapeHtml(k)}</div>`).join('') || '<div class="sub">Not much</div>'}</div><div><h4>Weighing on folk</h4>${why.down.map(([k]) => `<div>− ${escapeHtml(k)}</div>`).join('') || '<div class="sub">Nothing much</div>'}</div></div>`;
  h += '<h3>Policies</h3>';
  for (const k in POLICY) {
    const P = POLICY[k], cur = policy(k);
    h += `<div class="wg-row"><span class="wg-label">${P.label}</span><div><div class="wg-seg">${P.opts.map(([v, l]) => `<button data-pol="${k}" data-val="${v}" class="${cur === v ? 'on' : ''}">${l}</button>`).join('')}</div><div class="sub">${P.desc[cur]}</div></div></div>`;
  }
  const food = Village.foodTotal() + World.homes.reduce((n, hm) => n + (hm.built ? pantryTotal(hm) + (typeof jarsTotal === 'function' ? jarsTotal(hm) : 0) : 0), 0), eaters = Game.villagers.length;
  const perDay = Math.max(1, eaters * 2.2 * { lean: 0.77, fair: 1, generous: 1.3, feast: 1.8 }[policy('rations')]);
  const days = Math.round(food / perDay);
  h += `<div class="sub">The Store, larders and jars hold ${food} helpings for ${eaters} folk: ${days < 1 ? 'less than a day' : days === 1 ? 'about a day' : `about ${days} days`} at these rations, if nothing more came in. The taproom has ${Village.stores.ale || 0} pints of ale.</div>`;
  h += '<h3>Workforce</h3><div class="st-jobs">';
  const t = jobTargets(), counts = jobCounts();
  for (const j of Object.keys(JOBS)) {
    const planned = typeof jobPlan()[j] === 'number';
    h += `<div class="st-job">${iconHTML(JOBS[j].icon)}<span>${JOBS[j].label}</span><span class="st-n">${counts[j] || 0}<small>/${t[j] ?? 0}</small></span><button data-job="${j}" data-d="-1" aria-label="Fewer ${JOBS[j].label}s">−</button><button data-job="${j}" data-d="1" aria-label="More ${JOBS[j].label}s">+</button><button data-job="${j}" data-d="auto" class="st-auto" title="Let the village decide" style="visibility:${planned ? 'visible' : 'hidden'}">auto</button></div>`;
  }
  h += '</div><div class="sub">Numbers are hands now / hands wanted. Set a trade yourself with − and +; "auto" hands it back to the village. Changes are made at once, and folk who are moved on look for other work.</div>';
  return h;
}
function hookStewardUI(body) {
  body.querySelectorAll('[data-pol]').forEach((b) => b.addEventListener('click', () => { setPolicy(b.dataset.pol, b.dataset.val); renderVillage(); }));
  body.querySelectorAll('[data-job]').forEach((b) => b.addEventListener('click', () => {
    const j = b.dataset.job, P = jobPlan();
    if (b.dataset.d === 'auto') delete P[j];
    else P[j] = Math.max(0, (jobCounts()[j] || 0) + +b.dataset.d);
    trimTrades();
    renderVillage();
  }));
}

window.addEventListener('DOMContentLoaded', () => {
  const rv = renderVillage;
  renderVillage = function () {
    if (Game.villageTab === 'steward') {
      document.querySelectorAll('#village .tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'steward'));
      const body = $('village-body');
      body.innerHTML = stewardHTML();
      hydrateIcons(body);
      hookStewardUI(body);
      return;
    }
    return rv();
  };
  const oh = onHour;
  onHour = function (h) { const r = oh(h); if (h === 9) migrationDaily(); return r; };
  const nv = newVillage;
  newVillage = function () { Game.policy = {}; Game.jobPlan = {}; Game.contentLog = []; return nv(); };
  // the meter in the top bar opens the desk
  $('hud-content').addEventListener('click', () => { Game.villageTab = 'steward'; $('village').hidden = false; renderVillage(); });
  const hud = updateHUD;
  updateHUD = function () {
    hud();
    const c = contentment(), el = $('hud-content');
    el.textContent = `☺ ${c}%`; el.dataset.level = c >= 66 ? 'good' : c >= 45 ? 'mid' : 'low';
    el.title = `Contentment ${c}%: open the Steward's Desk`;
  };
});
