'use strict';
// ---------------------------------------------------------------------------
// Making the economy legible and the stakes real (from the playtests).
//
//  * The Economy board on the Steward's Desk: for each good, what's in the
//    Store, what was made and used yesterday, and how many days it would
//    last, with the production chains (barley → flour → bread, barley → ale,
//    apples → pies, vegetables and fish → stew) checked for their bottleneck:
//    "Flour is piling up but the bread shelves are bare: more bakers."
//  * Building works: every project in hand with its progress, the one you
//    mark "first" gets the builders, and you can see what it's waiting for.
//  * Shortages bite: folk who are famished can't put their backs into their
//    work. And folk who stay miserable for days start talking about moving
//    to Bree; if nothing changes, they pack up and go (they're happier there,
//    and they write). Who's thinking of leaving, and why, is on the desk.
// ---------------------------------------------------------------------------

const ECON_GOODS = ['grain', 'flour', 'bread', 'pie', 'cake', 'veg', 'fish', 'apple', 'egg', 'cheese', 'stew', 'ale', 'leaf', 'wood', 'wool', 'herbs', 'remedy', 'honey', 'scrap'];
const CHAINS = [
  { from: 'grain', to: 'flour', job: 'miller', say: 'Barley is piling up but there\'s little flour: more millers' },
  { from: 'flour', to: 'bread', job: 'baker', say: 'Flour is piling up but the bread shelves are bare: more bakers' },
  { from: 'grain', to: 'ale', job: 'brewer', say: 'Plenty of barley but the ale is running dry: more brewers' },
  { from: 'apple', to: 'pie', job: 'baker', say: 'Apples are piling up but there are no pies: more bakers' },
  { from: 'veg', to: 'stew', job: 'innkeeper', say: 'Vegetables are piling up but no stew at the inn: is the innkeeper at work?' },
];
function econRows() {
  const y = Village.yesterday || { made: {}, used: {} };
  return ECON_GOODS.map((k) => {
    const have = Math.floor(Village.stores[k] || 0), made = Math.round(y.made[k] || 0), used = Math.round(y.used[k] || 0), net = made - used;
    return { k, have, cap: storeCap(k), made, used, net, days: net < 0 && have > 0 ? have / -net : null };
  }).filter((r) => r.have || r.made || r.used);
}
function bottlenecks() {
  const out = [];
  for (const c of CHAINS) {
    const a = Village.stores[c.from] || 0, b = Village.stores[c.to] || 0;
    if (a >= storeCap(c.from) * 0.5 && b <= storeCap(c.to) * 0.15) out.push(c);
  }
  const food = Village.foodTotal(), eat = Game.villagers.length * 2.2;
  if (food < eat) out.unshift({ say: `Less than a day's food in the Store (${food} helpings for ${Game.villagers.length} folk): more farmers and fishers, lean rations, or buy food from a caravan` });
  if (buildWood() < 4 && Village.projects.length) out.push({ say: 'The builders are waiting for timber: more woodwrights, or buy timber from the Bree carter' });
  return out;
}

// --- Building works and priority ---------------------------------------------
{
  const tgt = ACTIONS.build.target;
  ACTIONS.build.target = function (v, h, extra) {
    const first = Village.projects.find((p) => p.priority && canWorkProject(v, p));
    if (first) {
      const crew = Game.villagers.filter((o) => o.task && o.task.target && o.task.target.project === first).length;
      if (crew < 4) return { ...projectSpot(first), project: first };
    }
    return tgt(v, h, extra);
  };
}
function projectsHTML() {
  if (!Village.projects.length) return '<div class="sub">No building works in hand.</div>';
  return '<div class="ec-proj">' + Village.projects.map((p, i) => {
    const K = PROJECT_KIND[p.kind] || {};
    const crew = Game.villagers.filter((o) => o.task && o.task.target && o.task.target.project === p).length;
    const wait = K.wood && buildWood() < 2 ? 'waiting for timber' : K.scrap && (Village.stores.scrap || 0) < K.scrap ? 'waiting for scrap' : crew ? `${crew} at work` : 'nobody on it just now';
    return `<div class="ec-p${p.priority ? ' first' : ''}"><span>${escapeHtml(projectLabel(p))}</span>${bar(p.prog || 0, 'good')}<span class="sub">${Math.round((p.prog || 0) * 100)}% · ${wait}</span><button data-first="${i}" ${p.priority ? 'disabled' : ''}>${p.priority ? 'First' : 'Do first'}</button></div>`;
  }).join('') + '</div>';
}

// --- Shortages bite ------------------------------------------------------------------
{
  patch(Villager.prototype, 'score', (score) => function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s > 0 && a.job && this.drives.hunger > 0.75) { s *= 0.55; if (ex) ex.mul.push(['too hungry to work', 0.55]); }
    return s;
  }, 'economy');
  // famished hands get less done
  const wp = workProject;
  workProject = function (v, p) { if (v.drives.hunger > 0.8 && R.chance(0.4)) return; return wp(v, p); };
}
MOODLETS.leaving_thoughts = ['Thinking of moving to Bree', -0.02, 2880, ['Maybe I\'d be happier in Bree.', 'My cousin in Bree says there\'s room.']];
MOODLETS.stayed = ['Glad I stayed', 0.12, 2880, ['Bree? What was I thinking?']];
function leaversDaily() {
  for (const v of Game.villagers) {
    if (!v.isGrown() || v.leaving || v.homeId < 0 || v.isRiftborn()) continue;
    const m = v.mood();
    if (m < 0.32) v.glum = (v.glum || 0) + 1;
    else if (v.glum) { if (v.glum >= 2) { feel(v, 'stayed'); unfeel(v, 'leaving_thoughts'); chronicle(`${v.first} has decided to stay in Thistledown after all.`, 'love'); } v.glum = 0; }
    if (v.glum === 2) { feel(v, 'leaving_thoughts'); chronicle(`${v.name()} has been down in the dumps for days and is talking about moving to Bree. Something to cheer ${v.pron.them} up, and soon, might change ${v.pron.their} mind.`, 'sick'); }
    if (v.glum >= 4 && !v.spouse && !Game.villagers.some((k) => !k.isGrown() && k.parents.includes(v.id))) {
      v.glum = 0;
      archivePerson(v, 'bree');
      v.leaving = 'final';
      v.abort(); if (v.inside) v.exitBuilding(); v.queue = [];
      v.repathTo(WEST_EXIT.x, WEST_EXIT.y);
      v.task = { a: { id: 'adventure', label: 'Moving to Bree', icon: 'pack', sat: {}, dur: 1, pose: 'stand' }, phase: 'go', target: { x: WEST_EXIT.x, y: WEST_EXIT.y }, t: 1, data: {}, before: { ...v.drives } };
      v.say('Goodbye, Thistledown. I hope Bree is kinder.', 5);
      chronicle(`${v.name()} has packed a cart and moved away to Bree. Folk say ${v.pron.they} wasn't happy here.`, 'sick');
      Game.stats.movedAway = (Game.stats.movedAway || 0) + 1;
    }
  }
}

// --- On the Steward's Desk -------------------------------------------------------------
function econHTML() {
  const rows = econRows(), bn = bottlenecks();
  let h = '<h3>Economy</h3>';
  if (bn.length) h += `<div class="ec-bn">${bn.map((b) => `<div>⚠ ${escapeHtml(b.say)}.</div>`).join('')}</div>`;
  h += '<div class="ec-wrap"><table class="ec-table"><thead><tr><th>Good</th><th>Store</th><th>Made</th><th>Used</th><th>Lasts</th></tr></thead><tbody>';
  for (const r of rows) h += `<tr><td>${escapeHtml(RES_WORD[r.k] || r.k)}</td><td>${r.have}<small>/${r.cap}</small></td><td>${r.made ? '+' + r.made : '·'}</td><td>${r.used ? '−' + r.used : '·'}</td><td class="${r.days != null && r.days < 2 ? 'low' : ''}">${r.days == null ? (r.net >= 0 ? (r.net ? '↑' : '') : '') : r.days < 1 ? '< a day' : Math.round(r.days) + ' days'}</td></tr>`;
  h += '</tbody></table></div><div class="sub">Yesterday\'s comings and goings. "Lasts" is how long the stock would last if yesterday repeated.</div>';
  h += `<h3>Building works</h3>${projectsHTML()}`;
  const glum = Game.villagers.filter((v) => (v.glum || 0) >= 2 && !v.leaving);
  if (glum.length) h += `<h3>Thinking of leaving</h3><div class="likes">${glum.map((v) => { const f = feelingsOf(v).filter((x) => x[1] < 0).slice(0, 2).map((x) => x[0].toLowerCase()); return `<div><a data-v="${v.id}">${escapeHtml(v.name())}</a>: ${escapeHtml(f.join(', ') || 'unhappy')}${v.drives.hunger > 0.6 ? ', hungry' : ''}${v.drives.lonely > 0.6 ? ', lonely' : ''}</div>`; }).join('')}</div><div class="sub">A pat, a present, a feast or a friend might keep them.</div>`;
  return h;
}
window.addEventListener('DOMContentLoaded', () => {
  const sh = stewardHTML;
  stewardHTML = function () {
    const h = sh();
    const i = h.indexOf('<h3>Workforce</h3>');
    return i >= 0 ? h.slice(0, i) + econHTML() + h.slice(i) : h + econHTML();
  };
  const hook = hookStewardUI;
  hookStewardUI = function (body) {
    body.querySelectorAll('[data-first]').forEach((b) => b.addEventListener('click', () => { const p = Village.projects[+b.dataset.first]; for (const q of Village.projects) q.priority = false; if (p) { p.priority = true; toast(`The builders will see to ${projectLabel(p)} first.`, 'build'); } renderVillage(); }));
    body.querySelectorAll('a[data-v]').forEach((a) => a.addEventListener('click', () => { const o = Game.villagers.find((x) => x.id === +a.dataset.v); if (o) { $('village').hidden = true; selectVillager(o); focusVillager(o); } }));
    return hook(body);
  };
  addHook('onHour', (h) => { if (h === 6) leaversDaily(); });
});

// --- The Steward's orders: things coin can buy at any time -------------------
const ORDERS = [
  { id: 'feast', label: 'Throw a village feast', cost: 30, need: () => Village.foodTotal() >= 25, why: 'needs 25 helpings in the Store', desc: 'Tables on the green tonight: 30 pennies and 25 helpings. Everyone\'s spirits lift for days.', fn: () => { let left = 25; for (const k of ['stew', 'pie', 'cake', 'bread', 'veg', 'fish', 'apple', 'cheese']) { const n = Math.min(left, Math.floor(Village.stores[k] || 0)); Village.use(k, n); left -= n; if (!left) break; } Game.party.planned = 'feast'; for (const v of Game.villagers) if (v.stage !== 'baby') feel(v, 'feasted'); chronicle('By the Steward\'s order, there\'s to be a feast on the green tonight! Long tables, lanterns, and pies as far as the eye can see.', 'party'); } },
  { id: 'masons', label: 'Send for dwarf masons', cost: 50, need: () => !masonsOn(), why: 'already here', desc: 'Every building job goes twice as fast for two days.', fn: () => { Game.masonsUntil = Game.time + 2 * 1440; chronicle('A crew of dwarf masons has come over the hills at the Steward\'s invitation. Building goes twice as fast for two days.', 'build'); } },
  { id: 'books', label: 'Buy books from Bree', cost: 20, need: () => true, desc: 'A crate of books from Bree: +15 lore at once.', fn: () => { addLore(15); chronicle('A crate of books has come from Bree. The village\'s readers are delighted.', 'learn'); } },
  { id: 'labor', label: 'Hire day laborers', cost: 25, need: () => World.season !== 'winter', why: 'not in winter', desc: 'Hands from over the hills bring the crops on in every field and garden.', fn: () => { const bump = (p) => { if (p.stage >= 1 && p.stage < 4) { p.prog += 0.6; if (p.prog >= 1) { p.prog = 0; p.stage++; } } }; for (const f of World.fields) f.plots.forEach(bump); for (const a of World.allotments) a.plots.forEach(bump); for (const h of World.homes) if (h.built) h.plots.forEach(bump); chronicle('Day laborers from over the hills have been hired: hoeing, weeding and watering in every field.', 'work'); } },
];
MOODLETS.feasted = ['The Steward\'s feast', 0.12, 2160, ['What a feast that was!', 'I couldn\'t eat another bite. Well, maybe one.']];
function ordersHTML() {
  return `<h3>The Steward's orders</h3><div class="ec-orders">${ORDERS.map((o) => { const ok = o.need() && (Game.coin || 0) >= o.cost; return `<div class="ec-o"><b>${escapeHtml(o.label)}</b><span class="sub">${escapeHtml(o.desc)}</span><button data-order="${o.id}" ${ok ? '' : 'disabled'} title="${!o.need() ? escapeHtml(o.why || '') : (Game.coin || 0) < o.cost ? 'Not enough pennies' : ''}">${o.cost}p</button></div>`; }).join('')}</div>`;
}
window.addEventListener('DOMContentLoaded', () => {
  const sh = stewardHTML;
  stewardHTML = function () { const h = sh(); const i = h.indexOf('<h3>Workforce</h3>'); return i >= 0 ? h.slice(0, i) + ordersHTML() + h.slice(i) : h + ordersHTML(); };
  const hook = hookStewardUI;
  hookStewardUI = function (body) {
    body.querySelectorAll('[data-order]').forEach((b) => b.addEventListener('click', () => { const o = ORDERS.find((x) => x.id === b.dataset.order); if (!o || !o.need() || (Game.coin || 0) < o.cost) return; Game.coin -= o.cost; o.fn(); renderVillage(); }));
    return hook(body);
  };
});
