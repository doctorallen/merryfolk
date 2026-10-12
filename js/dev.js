'use strict';
// ---------------------------------------------------------------------------
// Developer mode (the ` key, or the Dev button). A drawer with four tabs:
//   Brain   the selected villager's drives, task and path, every action scored
//           and explained (or the reason it's ruled out), and recent choices
//   Events  everything that happens under the hood, filterable by kind
//   World   stores, trades, housing, building, rifts and population at a glance
//   Tools   nudge time, weather, rifts, parties and the selected villager;
//           rank the village up, unlock everything, build at once, free coin,
//           and switches for the painting, lighting and sprites
// plus map overlays: what each villager is doing, where they're walking, the
// tile grid with walkability and surveyed lots, the cliffs, and the chunks of
// ground as they are painted.
// ---------------------------------------------------------------------------

const DEV_KEY = 'merryfolk-dev';
const Dev = {
  on: false, tab: 'brain', overlay: { labels: true, paths: true, grid: false, land: 'off', cliffs: false, chunks: false }, filter: 'all', paused: false,
  events: [], seen: 0, fps: 60, refreshT: 0, built: false,
  // cheats and switches (never saved): everything builds at once, coin never runs out, parts of the picture hidden for timing
  insta: false, freeCoin: false, hide: { grass: false, weather: false, light: false },
  timing: { sim: 0, paint: 0, render: 0 },
};
const DEV_CATS = ['decide', 'talk', 'story', 'family', 'jobs', 'homes', 'town', 'rift', 'weather', 'party', 'travel'];

// Anything under the hood can note itself here; the Events tab shows the last 600.
function devLog(cat, text) {
  if (Dev.paused) return;
  Dev.events.unshift({ t: Game.time, cat, text });
  if (Dev.events.length > 600) Dev.events.length = 600;
}

function devLoad() {
  try { const d = JSON.parse(localStorage.getItem(DEV_KEY) || '{}'); Object.assign(Dev.overlay, d.overlay || {}); Dev.tab = d.tab || Dev.tab; Dev.filter = d.filter || 'all'; if (d.on) devToggle(true); } catch (e) { /* no storage: defaults */ }
}
function devSave() {
  try { localStorage.setItem(DEV_KEY, JSON.stringify({ on: Dev.on, tab: Dev.tab, overlay: Dev.overlay, filter: Dev.filter })); } catch (e) { /* ignore */ }
}

function devToggle(force) {
  Dev.on = force ?? !Dev.on;
  if (Dev.on && !Dev.built) devBuild();
  if (Dev.built) $('dev').hidden = !Dev.on;
  document.body.classList.toggle('dev-on', Dev.on);
  const b = $('btn-dev'); if (b) b.classList.toggle('active', Dev.on);
  if (Dev.on) devRender(true);
  devSave();
}

function devBuild() {
  const el = document.createElement('aside');
  el.id = 'dev'; el.hidden = true; el.setAttribute('aria-label', 'Developer mode');
  el.innerHTML = `
    <div class="dev-head">
      <b>DEV</b>
      <nav class="dev-tabs">${['brain', 'events', 'world', 'tools'].map((t) => `<button data-tab="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</nav>
      <button class="dev-x" id="dev-close" aria-label="Close developer mode">×</button>
    </div>
    <div class="dev-overlays">
      <label><input type="checkbox" id="dev-ov-labels"> labels</label>
      <label><input type="checkbox" id="dev-ov-paths"> paths</label>
      <label><input type="checkbox" id="dev-ov-grid"> grid &amp; lots</label>
      <label><input type="checkbox" id="dev-ov-cliffs"> cliffs</label>
      <label><input type="checkbox" id="dev-ov-chunks"> chunks</label>
      <label>land <select id="dev-ov-land">${LAND_VIEWS.map((k) => `<option>${k}</option>`).join('')}</select></label>
      <span id="dev-fps"></span>
    </div>
    <div class="dev-body" id="dev-body"></div>`;
  $('game').appendChild(el);
  el.querySelectorAll('.dev-tabs button').forEach((b) => b.addEventListener('click', () => { Dev.tab = b.dataset.tab; devSave(); devRender(true); }));
  $('dev-close').addEventListener('click', () => devToggle(false));
  for (const k of ['labels', 'paths', 'grid', 'cliffs', 'chunks']) {
    const cb = $('dev-ov-' + k); cb.checked = Dev.overlay[k];
    cb.addEventListener('change', () => { Dev.overlay[k] = cb.checked; devSave(); });
  }
  const ls = $('dev-ov-land'); ls.value = Dev.overlay.land || 'off';
  ls.addEventListener('change', () => { Dev.overlay.land = ls.value; devSave(); });
  // clicks inside the body: links to villagers, filters, tools
  // the tuning dials: a number typed in changes TUNE at once (not saved)
  $('dev-body').addEventListener('change', (e) => {
    const t = e.target;
    if (!t.dataset.tune) return;
    const path = t.dataset.tune.split('.');
    let o = TUNE; for (const k of path.slice(0, -1)) o = o[k];
    const n = parseFloat(t.value); if (Number.isFinite(n)) o[path[path.length - 1]] = n;
  });
  $('dev-body').addEventListener('click', (e) => {
    const t = e.target.closest('[data-v],[data-cat],[data-act]');
    if (!t) return;
    if (t.dataset.v) { const v = Game.villagers.find((x) => x.id === +t.dataset.v); if (v) { selectVillager(v); focusVillager(v); Dev.tab = 'brain'; devRender(true); } }
    if (t.dataset.cat) { Dev.filter = t.dataset.cat; devSave(); devRender(true); }
    if (t.dataset.act) devAct(t.dataset.act);
  });
  Dev.built = true;
}

// Called every frame: keeps the frame rate, applies the cheats, and refreshes the open tab a few times a second.
function devFrame(dtReal) {
  if (dtReal > 0) Dev.fps = Dev.fps * 0.95 + (1 / dtReal) * 0.05;
  if (Dev.freeCoin && Game.started) Game.coin = 9999;
  if (Dev.insta && Game.started) devBuildEverything();
  if (!Dev.on) return;
  Dev.refreshT -= dtReal;
  if (Dev.refreshT <= 0) { Dev.refreshT = 0.4; devRender(false); }
}

function devRender(full) {
  if (!Dev.built || !Dev.on) return;
  document.querySelectorAll('#dev .dev-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === Dev.tab));
  const T = Dev.timing, G = typeof Ground !== 'undefined' ? Ground : null;
  const chunks = G ? [...G.chunks.values()] : [], painted = chunks.filter((c) => c.painted).length;
  // a red ! leads the line while an error has been caught, with what it was
  const errs = (typeof ScriptErrors !== 'undefined' ? ScriptErrors.length : 0), last = Game.lastError;
  const flag = errs || last ? `<b style="color:#c83a2a" title="${escapeHtml((last ? last.msg + ' ' : '') + (errs ? errs + ' script error(s) at load: ' + ScriptErrors.map((e) => e.msg).join('; ') : ''))}">!</b> ` : '';
  $('dev-fps').innerHTML = flag + escapeHtml(`${Math.round(Dev.fps)} fps · sim ${dfmt(T.sim, 1)} paint ${dfmt(T.paint, 1)} draw ${dfmt(T.render, 1)} ms · ${Game.villagers.length} folk · ${SPEEDS[Game.speedIdx]}×`
    + (G ? ` · chunks ${painted}/${chunks.length} (${Math.round(chunks.length * CHUNK_PX * CHUNK_PX * GS * GS * 4 / 1e6)} MB)` : '')
    + (typeof Scene !== 'undefined' ? ` · buckets ${[...Scene.by.values()].reduce((s, e) => s + e.map.size, 0)}` : ''));
  for (const k of ['labels', 'paths', 'grid', 'cliffs', 'chunks']) $('dev-ov-' + k).checked = Dev.overlay[k];
  const body = $('dev-body');
  if (Dev.tab === 'events') {
    if (!full && Dev.seen === Dev.events.length + (Dev.events[0] ? Dev.events[0].t : 0)) return;
    Dev.seen = Dev.events.length + (Dev.events[0] ? Dev.events[0].t : 0);
  }
  if (Dev.tab === 'tools' && !full) return;
  // keep the scroll position as the content refreshes
  const top = body.scrollTop;
  body.innerHTML = ({ brain: devBrain, events: devEvents, world: devWorld, tools: devTools }[Dev.tab] || devBrain)();
  body.scrollTop = full ? 0 : top;
}

const dfmt = (n, d = 2) => (typeof n === 'number' ? n.toFixed(d) : '–');
const dbar = (v, hot) => `<span class="dbar"><i style="width:${Math.round(clamp(v, 0, 1) * 100)}%" class="${hot && v > 0.7 ? 'hot' : hot && v > 0.4 ? 'warm' : ''}"></i></span>`;
const dname = (v) => `<a data-v="${v.id}">${escapeHtml(v.first)}</a>`;
const aname = (id) => escapeHtml(ACTION_NAMES[id] || (ACTIONS[id] && ACTIONS[id].label) || id);
const dtime = (t) => `d${Math.floor(t / 1440) + 1} ${fmtTime(t)}`;

// ----- Brain -----
function devBrain() {
  const v = Game.selected;
  if (!v) {
    const list = Game.villagers.slice().sort((a, b) => a.first.localeCompare(b.first));
    return `<p class="dhint">Select a villager (click one on the map, or pick here) to see how they decide.</p><div class="dpick">${list.map((o) => `${dname(o)} <small>${o.task ? escapeHtml(o.task.a.id) : 'idle'}</small>`).join('')}</div>`;
  }
  const h = Game.hour;
  let o = `<h4>${escapeHtml(v.name())} <small>#${v.id} · ${v.stage} · ${v.job || 'no trade'} · tile ${Math.floor(v.x / 16)},${Math.floor(v.y / 16)}${v.inside ? ' · inside ' + escapeHtml(v.inside.name) : ''}</small></h4>`;
  o += `<div class="dgrid2">`;
  for (const d of DRIVES) o += `<span>${d}</span>${dbar(v.drives[d], true)}<span class="dnum">${dfmt(v.drives[d])}</span>`;
  o += `<span>mood</span>${dbar(v.mood())}<span class="dnum">${dfmt(v.mood())}</span>`;
  o += `</div><div class="dkv">ale ${dfmt(v.chem.ale)} · germs ${dfmt(v.chem.germs)} · toxin ${dfmt(v.chem.toxin)} · immune ${dfmt(v.chem.immune)} · edu ${dfmt(v.edu)} · rift ways ${dfmt(v.tech)} (tier ${v.techTier})${v.isRiftborn() ? ' · lost ' + dfmt(v.lost || 0) : ''}</div>`;
  // the current task
  const t = v.task;
  o += '<h5>Now</h5>';
  if (t) {
    const tg = t.target || {};
    const where = tg.building ? 'building ' + escapeHtml(tg.building.name) : tg.other ? 'villager ' + dname(tg.other) : tg.x != null ? `${Math.round(tg.x)},${Math.round(tg.y)} (${Math.round(dist(v.x, v.y, tg.x, tg.y) / 16)} tiles away)` : '–';
    o += `<div class="dkv"><b>${escapeHtml(t.a.id)}</b> · ${t.phase === 'go' ? 'walking there' : 'doing it'} · ${Math.max(0, Math.round(t.t))} min left · target ${where}${v.path ? ` · path ${v.path.length - v.pathI} steps` : ''}${t.partner ? ' · with ' + dname(t.partner) : ''}</div>`;
  } else o += `<div class="dkv">thinking in ${dfmt(v.thinkDelay, 1)} min</div>`;
  if (v.queue.length) o += `<div class="dkv">queued: ${v.queue.map((q) => escapeHtml(q.a.id)).join(', ')}</div>`;
  // every action, scored and explained
  const rows = [], blocked = [];
  for (const k in ACTIONS) {
    const ex = {};
    const s = v.score(ACTIONS[k], h, ex);
    if (s < 0) blocked.push([k, ex.blocked || 'ruled out']); else rows.push([k, s, ex]);
  }
  rows.sort((a, b) => b[1] - a[1]);
  const top3 = rows.slice(0, 3), tot = top3.reduce((a, r) => a + r[1] * r[1], 0) || 1;
  o += `<h5>If they chose now <small>(one of the top three, weighted by score²)</small></h5><table class="dtab"><tr><th>action</th><th>score</th><th>chance</th><th>why</th></tr>`;
  for (const [k, s, ex] of rows.slice(0, 14)) {
    const i = top3.findIndex((r) => r[0] === k);
    const relief = ex.relief.map(([d, c]) => `${d} ${dfmt(c)}`).join(' + ');
    const parts = [relief, ex.extra ? `extra ${dfmt(ex.extra)}` : ''].filter(Boolean).join(' + ') || '0';
    const muls = ex.mul.map(([n, f]) => `<span class="${f > 1 ? 'up' : 'down'}">${n} ×${dfmt(f)}</span>`).join(' ');
    o += `<tr class="${t && t.a.id === k ? 'cur' : ''}"><td>${escapeHtml(k)}</td><td class="dnum">${dfmt(s)}</td><td class="dnum">${i >= 0 ? Math.round((s * s / tot) * 100) + '%' : ''}</td><td>(${parts}) ${muls}</td></tr>`;
  }
  o += '</table>';
  // what's ruled out, grouped by reason
  const why = {};
  for (const [k, r] of blocked) (why[r] || (why[r] = [])).push(k);
  o += `<details><summary>Ruled out (${blocked.length})</summary>${Object.entries(why).map(([r, ks]) => `<div class="dkv"><b>${escapeHtml(r)}</b>: ${ks.map(escapeHtml).join(', ')}</div>`).join('')}</details>`;
  // recent decisions
  o += '<h5>Recent decisions</h5>';
  for (const d of v.decisions || []) o += `<div class="dkv"><span class="dt">${dtime(d.t)}</span> <b>${escapeHtml(d.id)}</b> <small>${escapeHtml(d.how)}</small>${d.options.length ? ' · ' + d.options.map(([id, sc]) => `${escapeHtml(id)} ${dfmt(sc)}`).join(', ') : ''}</div>`;
  if (!(v.decisions || []).length) o += '<div class="dkv">none yet</div>';
  // habits and people
  const habits = Object.entries(v.weights).filter(([, w]) => Math.abs(w - 1) > 0.08).sort((a, b) => b[1] - a[1]);
  o += `<h5>Learned habits <small>(1 = untouched)</small></h5><div class="dkv">${habits.map(([k, w]) => `<span class="${w > 1 ? 'up' : 'down'}">${escapeHtml(k)} ${dfmt(w)}</span>`).join(' · ') || 'none yet'}</div>`;
  const people = Object.entries(v.rel).map(([id, r]) => [Game.villagers.find((x) => x.id === +id), r]).filter(([p]) => p).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8);
  o += `<h5>People</h5><div class="dkv">${people.map(([p, r]) => `${dname(p)} ${dfmt(r)}${v.love[p.id] > 0.05 ? ' ♥' + dfmt(v.love[p.id]) : ''}`).join(' · ') || 'nobody yet'}</div>`;
  if (v.memories.length) o += `<h5>Memories</h5>${v.memories.slice(0, 5).map((m) => `<div class="dkv"><span class="dt">d${m.d}</span> ${escapeHtml(m.t)}</div>`).join('')}`;
  return o;
}

// ----- Events -----
function devEvents() {
  const counts = {};
  for (const e of Dev.events) counts[e.cat] = (counts[e.cat] || 0) + 1;
  let o = `<div class="dchips"><button data-cat="all" class="${Dev.filter === 'all' ? 'on' : ''}">all ${Dev.events.length}</button>${DEV_CATS.map((c) => `<button data-cat="${c}" class="${Dev.filter === c ? 'on' : ''}">${c} ${counts[c] || 0}</button>`).join('')}</div>`;
  o += `<div class="dchips"><button data-act="logpause">${Dev.paused ? 'resume log' : 'pause log'}</button><button data-act="logclear">clear</button>${Dev.filter === 'decide' || Dev.filter === 'talk' ? '<span class="dhint">decisions and talk are logged for the selected villager</span>' : ''}</div>`;
  const list = Dev.events.filter((e) => Dev.filter === 'all' || e.cat === Dev.filter).slice(0, 250);
  o += list.map((e) => `<div class="dev-ev c-${e.cat}"><span class="dt">${dtime(e.t)}</span><span class="dc">${e.cat}</span>${escapeHtml(e.text)}</div>`).join('') || '<div class="dhint">Nothing logged yet.</div>';
  return o;
}

// ----- World -----
function devWorld() {
  const vs = Game.villagers;
  let o = `<h5>Clock</h5><div class="dkv">day ${Game.day} · ${fmtTime(Game.time)} · ${World.season} · ${Game.weather}${Game.raining ? ' (raining until ' + fmtTime(Game.rainUntil) + ')' : ''} · darkness ${dfmt(Game.darkness)} · party ${Game.party.on ? 'on (' + escapeHtml(Game.party.reason) + ')' : Game.party.planned ? 'planned' : 'no'}</div>`;
  const st = {}; for (const v of vs) st[v.stage] = (st[v.stage] || 0) + 1;
  const couples = vs.filter((v) => v.spouse && v.id < v.spouse).length, exp = vs.filter((v) => v.expecting).length;
  o += `<h5>Folk</h5><div class="dkv">${Object.entries(st).map(([k, n]) => `${k} ${n}`).join(' · ')} · couples ${couples} · expecting ${exp} · rift-born ${vs.filter((v) => v.isRiftborn()).length} · mixed ${vs.filter((v) => v.genes.rift > 0 && v.genes.rift < 0.99).length} · away ${Game.away.length} · mean mood ${dfmt(vs.reduce((a, v) => a + v.mood(), 0) / Math.max(1, vs.length))}</div>`;
  // trades
  const tg = jobTargets(), ct = jobCounts();
  o += `<h5>Trades <small>(have / want)</small></h5><div class="dkv">${Object.keys(JOBS).map((j) => `<span class="${ct[j] < tg[j] ? 'down' : ct[j] > tg[j] ? 'up' : ''}">${j} ${ct[j]}/${tg[j]}</span>`).join(' · ')} · no trade ${vs.filter((v) => v.isGrown() && !v.job).length}</div>`;
  // stores
  o += `<h5>Common Store <small>(now, cap, yesterday +made −used)</small></h5><table class="dtab">`;
  for (const k of STORE_KEYS) {
    const n = Village.stores[k] || 0, cap = storeCap(k), m = Math.round(Village.yesterday.made[k] || 0), u = Math.round(Village.yesterday.used[k] || 0);
    o += `<tr><td>${k}</td><td class="dnum">${Math.floor(n)}</td><td>${dbar(n / cap)}</td><td class="dnum">/${cap}</td><td class="dnum up">+${m}</td><td class="dnum down">−${u}</td></tr>`;
  }
  o += `</table><div class="dkv">food total ${Village.foodTotal()} · firewood kept back ${firewoodReserve()} · timber free for building ${buildWood()}</div>`;
  // homes and building
  const built = World.homes.filter((h) => h.built);
  o += `<h5>Homes and building</h5><div class="dkv">${built.length} homes · ${built.filter((h) => !residentsOf(h).length).length} empty · housing need ${housingNeed()} · knolls left ${World.lots.filter((l) => l.kind === 'home' && l.state === 'planned').length} · cold hearths ${built.filter((h) => h.chilly).length} · neon ${built.filter((h) => h.neon).length}</div>`;
  for (const p of Village.projects) o += `<div class="dkv">${escapeHtml(p.kind)} · ${escapeHtml(projectLabel(p))} ${dbar(p.prog)} ${Math.round(p.prog * 100)}% ${projectReady(p) ? '' : '<span class="down">stalled (materials)</span>'}</div>`;
  const nextCivic = CIVIC_DEFS.find((d) => World.lots.some((l) => l.key === d.key && l.state === 'planned'));
  if (nextCivic) o += `<div class="dkv">next public work: ${escapeHtml(nextCivic.name)} at ${nextCivic.pop} folk</div>`;
  // rifts
  o += `<h5>Rifts</h5><div class="dkv">rifts ${Village.riftsOn ? 'on' : 'off'} · next in ${dfmt(Math.max(0, (Game.riftNext - Game.time) / 60), 1)} h · open ${World.rifts.map((r) => `${r.home ? 'home' : 'rift'} a=${dfmt(r.a)} sent ${r.sent}/${r.crew}`).join(', ') || 'none'} · scars ${World.riftScars.map((s) => s.stock).join(',') || 'none'} · salvage ${Math.floor(Village.stores.scrap || 0)}</div>`;
  o += `<div class="dkv">novelty ${dfmt(riftNovelty())} · spectacle ${dfmt(riftSpectacle())} · hill-folk with rift ways ${Math.round(riftShare() * 100)}% · way home ${Math.round((Village.wayHome || 0) * 100)}% (tries ${Village.wayHomeTries || 0}, ${homeSeekers().length} searching)</div>`;
  // what everyone's doing right now
  const doing = {};
  for (const v of vs) { const k = v.leaving ? 'leaving' : v.task ? v.task.a.id : 'idle'; doing[k] = (doing[k] || 0) + 1; }
  o += `<h5>Everyone right now</h5><div class="dkv">${Object.entries(doing).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${escapeHtml(k)} ${n}`).join(' · ')}</div>`;
  return o;
}

// ----- Tools -----
// The dials of TUNE (tuning.js) that are worth a nudge in play; the rest are a reload away.
const TUNE_DIALS = [['mood.scale', 'mood scale'], ['mood.steerLow', 'low mood'], ['mood.steerHigh', 'high mood'], ['variety.penalty', 'variety penalty'], ['variety.decayPerHour', 'variety decay/h'], ['memory.halfLifeDays', 'memory half-life'], ['memory.cap', 'memory cap'], ['dream.pull', 'dream pull'], ['manner.rate', 'manner rate'], ['breaks.chance', 'break chance/h'], ['breaks.villagePerDay', 'breaks/day'], ['breaks.tantrumChance', 'tantrum chance'], ['comfort.rate', 'comfort rate'], ['purpose.joblessRate', 'jobless itch'], ['crowded.rate', 'crowd rate'], ['unease.ease', 'unease ease'], ['values.pull', 'values pull']];
function devTuning() {
  if (typeof TUNE === 'undefined') return '';
  const get = (p) => p.split('.').reduce((o, k) => (o ? o[k] : undefined), TUNE);
  return `<h5>Tuning <small>(TUNE in js/tuning.js; live, not saved)</small></h5><div class="dchips dev-tune">${TUNE_DIALS.map(([p, l]) => `<label title="${p}">${l} <input type="number" step="any" data-tune="${p}" value="${get(p)}"></label>`).join('')}</div>`;
}
function devTools() {
  const v = Game.selected;
  const B = (act, label, title = '') => `<button data-act="${act}"${title ? ` title="${escapeHtml(title)}"` : ''}>${label}</button>`;
  const Tg = (act, label, on, title = '') => `<button data-act="${act}" class="${on ? 'on' : ''}"${title ? ` title="${escapeHtml(title)}"` : ''}>${label}${on ? ' ✓' : ''}</button>`;
  const rank = ERAS[era()] ? ERAS[era()].name : '?', next = ERAS[era() + 1];
  const planned = (kind) => World.lots.filter((l) => l.kind === kind && l.state === 'planned').length;
  const civicLeft = World.lots.filter((l) => l.kind !== 'home' && l.state === 'planned').length;
  const loreLeft = Object.keys(LORE).filter((k) => !hasLore(k)).length;
  const pet = v && v.home() && typeof petOf === 'function' ? petOf(v.home()) : null;
  return `${devTuning()}<h5>Time</h5><div class="dchips">${B('hour', '+1 hour')}${B('day', '+1 day')}${B('season', 'next season')}${B('night', 'jump to 21:00')}${B('morning', 'jump to 08:00')}</div>
  <div class="dchips">jump to <input type="number" id="dev-hour" min="0" max="23" value="12" aria-label="hour"> o'clock ${B('tohour', 'go')} · skip <input type="number" id="dev-days" min="1" max="30" value="3" aria-label="days"> days ${B('todays', 'go')} · to <select id="dev-season">${SEASONS.map((s) => `<option value="${s.toLowerCase()}"${s.toLowerCase() === World.season ? ' selected' : ''}>${s}</option>`).join('')}</select> ${B('toseason', 'go', 'runs the simulation up to the first day of that season')}</div>
  <h5>Weather</h5><div class="dchips">${B('rain', 'rain')}${B('storm', 'storm')}${B('snow', 'snow')}${B('fog', 'fog')}${B('clear', 'clear')}</div>
  <h5>Village <small>(${escapeHtml(rank)}${next ? ' → ' + escapeHtml(next.name) : ', the top'})</small></h5><div class="dchips">${B('rankup', 'rank up', 'the next village type at once, without the Moot')}${B('unlock', 'unlock everything', `top rank, every public and rift building raised (${civicLeft} left), all lore learned (${loreLeft} left)`)}grow to <input type="number" id="dev-pop" min="1" max="${MAX_POP}" value="${Math.min(MAX_POP, Game.villagers.length + 10)}" aria-label="folk"> folk ${B('grow', 'go', 'newcomers arrive up the road until the village is that size')}</div>
  <div class="dchips">${B('traveller', 'invite a traveller')}${B('assign', 're-assign trades')}${B('plan', 'run town planning')}${B('newvalley', 'new valley…', 'the Shape your valley screen: a fresh village from a seed')}</div>
  ${devParties(B)}
  <h5>Building</h5><div class="dchips">${Tg('insta', 'insta-build', Dev.insta, 'every project and plan finishes the moment it is opened')}${B('finishall', `finish all projects now (${Village.projects.length + plansList().length})`)}${B('openhomes', `open all home lots (${planned('home')})`)}${B('opencivic', `open all public lots (${civicLeft})`, 'every public and rift building starts, whatever the village size')}</div>
  <h5>Coin and stores <small>(${Game.coin ?? 0}p)</small></h5><div class="dchips">${Tg('freecoin', 'coin doesn\'t matter', Dev.freeCoin, 'the chest holds 9999 pennies however much is spent')}${B('coin', '+100 pennies')}${B('fill', 'fill the stores')}${B('empty', 'empty the stores')}${B('lore', 'lore +50')}</div>
  <h5>Rifts</h5><div class="dchips">${B('rift', 'open a rift')}${B('riftsoon', 'next rift in 10 min')}${B('wayhome', 'way home +25%')}${B('novelty', 'make rifts new again')}</div>
  <h5>Picture and painting</h5><div class="dchips">${B('paintall', 'paint whole valley now')}${B('repaint', 'repaint from scratch')}${Tg('lozoom', 'fine folk at every zoom', FOLK_LO_ZOOMS.size === 0, 'draw the quadruple-resolution folk at zoom 2 as well')}${Tg('hidegrass', 'hide grass', Dev.hide.grass)}${Tg('hideweather', 'hide weather', Dev.hide.weather)}${Tg('hidelight', 'hide lighting', Dev.hide.light)}</div>
  <p class="dhint">The fps line above shows the time spent simulating, painting ground and drawing each frame, the chunks painted of those kept, and the scenery buckets. The cliffs and chunks overlays are in the row at the top.</p>
  <h5>Hooks and patches</h5>
  <p class="dhint">Hooks: ${Object.keys(Hooks).map((k) => `${k} ${Hooks[k].length}`).join(' · ')}. Patched chains, in the order they were wrapped${PATCHES.length ? ': ' + PATCHES.map((p) => `${p.key}${p.label ? ` (${p.label})` : ''}${p.immediate ? '' : '*'}`).join(', ') : ': none recorded yet'}. A * marks a wrap made once the page had loaded, which runs outside all the immediate ones.</p>
  <h5>Selected villager ${v ? '(' + escapeHtml(v.first) + ')' : '<small>(none selected)</small>'}</h5><div class="dchips">${v ? [B('rethink', 'choose again now'), B('content', 'satisfy all drives'), B('hungry', 'make hungry'), B('tired', 'make sleepy'), B('lonely', 'make lonely'), B('tipsy', 'make tipsy'), B('cold', 'give a cold'), B('riftways', 'rift ways +0.4'), B('older', 'age +1 day'), B('teach', 'education +0.2')].join('') : '<span class="dhint">select someone first</span>'}</div>
  ${v ? `<div class="dchips">${B('natter', 'natter with the nearest', 'starts a conversation with whoever is closest')}${B('gather', 'start a gathering here', 'three or more folk get together where they stand')}${B('ornery', 'make ornery', 'quick-tempered and glum: short with everyone')}${B('cheerful', 'make cheerful', 'even-tempered and merry')}${pet ? `<span class="dhint">has ${escapeHtml(pet.name)} the ${pet.kind}</span>` : B('petdog', 'give a dog') + B('petcat', 'give a cat')}</div>` : ''}
  <p class="dhint">Time skips run the simulation for real, so everything that would have happened does. Cheats aren't saved: they're off again next time.</p>`;
}

// The parties: what's on, what's coming, and any kind of party at once.
function devParties(B) {
  const p = Game.party, k = p.on ? partyKind() : null, f = p.feast;
  const sel = Dev.partyKind && PARTY_KINDS[Dev.partyKind] ? Dev.partyKind : 'birthday';
  const host = partyHost();
  const now = p.on ? `on: <b>${escapeHtml(k.label)}</b> (${escapeHtml(String(p.reason))})${host ? ' for ' + escapeHtml(host.first) : ''} until ${fmtTime(p.until)}${f ? `, dinner ${f.course < 0 ? 'being laid' : f.course >= COURSES.length - 1 ? 'over' : 'at ' + COURSES[f.course].label}` : ''}` : 'none on';
  const planned = p.planned ? ` · planned: <b>${escapeHtml(partyKind(p.planned).label)}</b> at ${partyStartsAt(partyKind(p.planned))}:00` : '';
  const hol = holidayToday() ? ` · today is a holiday (${escapeHtml(Game.holiday.name || Game.holiday.key)})` : '';
  const next = upcomingOccasions(5).map(([d, key]) => `${escapeHtml(PARTY_KINDS[key].label)} day ${d}`).join(', ');
  return `<h5>Parties</h5><div class="dkv">${now}${planned}${hol}</div><div class="dkv">coming: ${next || 'nothing fixed'} · last birthday party day ${Game.lastBirthdayParty ?? '-'} · last holiday day ${Game.lastHoliday ?? '-'}</div>
  <div class="dchips"><select id="dev-party" aria-label="kind of party">${Object.values(PARTY_KINDS).map((x) => `<option value="${x.key}"${x.key === sel ? ' selected' : ''}>${escapeHtml(x.label)}</option>`).join('')}</select>${B('partynow', 'start now', 'ends any party that\'s on and starts this one (a birthday is for the selected villager, or someone at random)')}${B('partyplan', 'plan for today', 'it starts at its own hour, as if it were on the calendar')}${B('partyend', 'end the party')}${B('course', 'next course', 'brings the next course of a dinner at the long tables out at once')}${B('fireworks', 'fireworks')}</div>`;
}
function devPartyPick() {
  const key = ($('dev-party') || {}).value || 'evening';
  Dev.partyKind = key;
  const k = PARTY_KINDS[key];
  if (key === 'birthday') { const v = Game.selected && Game.selected.stage !== 'baby' ? Game.selected : R.pick(Game.villagers.filter((o) => o.isGrown())); Game.party.host = v ? v.id : null; }
  if (key === 'wedding' && !(Game.party.couple || []).length) { const m = Game.villagers.find((o) => o.spouse != null); if (m) Game.party.couple = [m.id, m.spouse]; }
  if (k.dayOff) Game.holiday = { day: Game.day, key, name: key === 'holiday' ? 'Dev Day' : k.label };
  return key;
}

// ----- the cheats -----
// Finishes a building project as the woodwrights would, with nobody to thank.
function devFinishProject(p) {
  const lot = p.lot != null ? World.lots[p.lot] : null;
  Village.projects = Village.projects.filter((x) => x !== p);
  p.prog = 1;
  if (p.kind === 'retrofit') { if (typeof finishRetrofit === 'function') finishRetrofit(World.homes[p.homeId], Game.villagers.find((o) => o.job === 'tinker') || Game.villagers[0]); return; }
  if (p.kind === 'home') {
    const h = World.homes[p.homeId];
    if (!h) return;
    h.buildProg = 1;
    if (lot) finishLot(lot); else completeHome(h);
    if ((p.tinkered || 0) >= 0.5 || p.hab) h.neon = true;
    Village.wantHomes = Math.max(0, Village.wantHomes - 1);
    settleHomes(true);
    return;
  }
  if (lot) finishLot(lot);
}
// Everything under way is finished at once: projects and the player's plans.
function devBuildEverything() {
  let n = 0;
  for (const p of Village.projects.slice()) { devFinishProject(p); n++; }
  for (const p of plansList().slice()) { completePlan(p, null); n++; }
  if (n) devLog('town', `dev: finished ${n} projects and plans at once`);
  return n;
}
function devRankUp() {
  const i = era() + 1;
  if (i >= ERAS.length) { toast('Thistledown is already a ' + ERAS[era()].name + ', the top rank.', 'info'); return false; }
  Game.era = i;
  chronicle(`By the Steward's decree Thistledown is a ${ERAS[i].name} from this day! ${ERAS[i].blurb}`, 'party');
  for (const v of Game.villagers) if (v.stage !== 'baby') feel(v, 'era', ERAS[i].name);
  if (typeof renderBuildBar === 'function') renderBuildBar();
  renderVillage();
  devLog('town', `dev: ranked up to ${ERAS[i].name}`);
  return true;
}
// Every lot of the given kinds is started (and finished, with insta-build on).
function devOpenLots(kinds) {
  let n = 0;
  for (const l of World.lots) {
    if (l.state !== 'planned' || !kinds(l)) continue;
    if (l.def && l.def.rift && !Village.riftsOn) Village.riftsOn = true;
    const p = startProject(l); n++;
    if (Dev.insta) devFinishProject(p);
  }
  for (const h of World.homes) {
    if (h.built || !kinds({ kind: 'home' }) || Village.projects.some((p) => p.homeId === h.id)) continue;
    const np = { kind: 'home', homeId: h.id, prog: h.buildProg || 0 };
    Village.projects.push(np); n++;
    if (h.siteStatic) h.siteStatic.hidden = false;
    if (Dev.insta) devFinishProject(np);
  }
  return n;
}
function devUnlockAll() {
  while (devRankUp()) { /* to the top */ }
  const n = devOpenLots((l) => l.kind !== 'home');
  for (const p of Village.projects.slice()) if (p.kind !== 'home') devFinishProject(p);
  const Lr = lore();
  for (const k in LORE) if (!Lr.known.includes(k)) Lr.known.push(k);
  Lr.study = null; Lr.prog = 0; applyLore();
  if (typeof renderBuildBar === 'function') renderBuildBar();
  renderVillage();
  devLog('town', `dev: unlocked everything (${n} lots raised, all lore learned)`);
}
function devGrow(n) {
  let added = 0;
  while (Game.villagers.length < n) { const r = welcomeTraveller(null, true); if (!r || !r.ok) break; added++; }
  devLog('family', `dev: ${added} newcomers arrived, ${Game.villagers.length} folk now`);
  return added;
}

function devAdvance(minutes) {
  // note what things looked like, so the skip can say what changed
  const before = { log: Game.log.length, pop: Game.villagers.length, built: World.lots.filter((l) => l.state === 'built').length + World.homes.filter((h) => h.built).length, proj: Village.projects.map((p) => p.prog) };
  let left = minutes;
  while (left > 0) { const s = Math.min(0.5, left); simulate(s); left -= s; }
  const built = World.lots.filter((l) => l.state === 'built').length + World.homes.filter((h) => h.built).length;
  const prog = Village.projects.map((p) => `${projectLabel(p)} ${Math.round(p.prog * 100)}%`).join(', ');
  devLog('story', `dev: skipped ${minutes >= 1440 ? (minutes / 1440).toFixed(1) + ' days' : Math.round(minutes) + ' min'}: ${Game.log.length - before.log} chronicle entries, ${Game.villagers.length - before.pop >= 0 ? '+' : ''}${Game.villagers.length - before.pop} folk, ${built - before.built} new buildings${prog ? '; under way: ' + prog : ''}`);
  if (typeof toast === 'function') toast(`Skipped ahead to day ${Game.day}, ${fmtTime(Game.time)}`);
  renderPanel && Game.selected && renderPanel(true);
}
function devAct(act) {
  const v = Game.selected;
  const weather = (w, mins = 180) => { Game.weather = w; Game.raining = w === 'rain' || w === 'storm'; Game.rainUntil = Game.time + mins; devLog('weather', `dev: weather set to ${w}`); };
  switch (act) {
    case 'hour': devAdvance(60); break;
    case 'day': devAdvance(1440); break;
    case 'season': devAdvance((SEASON_DAYS - dayOfSeason(Game.day)) * 1440 + (1440 - (Game.time % 1440)) + 1); break;
    case 'night': devAdvance(((21 * 60 - (Game.time % 1440)) + 1440) % 1440); break;
    case 'morning': devAdvance(((8 * 60 - (Game.time % 1440)) + 1440) % 1440); break;
    case 'rain': weather('rain'); break;
    case 'storm': weather('storm'); break;
    case 'snow': weather('snow'); break;
    case 'fog': Game.weather = 'fog'; Game.raining = false; break;
    case 'clear': Game.weather = 'clear'; Game.raining = false; break;
    case 'partynow': { const key = devPartyPick(); if (Game.party.on) { Game.party.on = false; Game.party.feast = null; takeDownTables(); } startParty(key); devLog('party', `dev: started ${key}`); break; }
    case 'partyplan': { const key = devPartyPick(); Game.party.planned = key; devLog('party', `dev: planned ${key} for ${partyStartsAt(PARTY_KINDS[key])}:00`); break; }
    case 'partyend': if (Game.party.on) Game.party.until = Game.time - 1; break;
    case 'course': { const f = Game.party.feast; if (f && f.course < COURSES.length - 1) { f.start -= COURSES[f.course + 1].at - (Game.time - f.start); feastStep(); } break; }
    case 'fireworks': fireworkShow(PARTY.danceX * 16 + 8, (PARTY.danceY - 3) * 16, 9); break;
    case 'fill': for (const k of STORE_KEYS) Village.stores[k] = storeCap(k); devLog('town', 'dev: filled the stores'); break;
    case 'empty': for (const k of STORE_KEYS) Village.stores[k] = 0; devLog('town', 'dev: emptied the stores'); break;
    case 'coin': Game.coin = (Game.coin || 0) + 100; break;
    case 'freecoin': Dev.freeCoin = !Dev.freeCoin; if (Dev.freeCoin) Game.coin = 9999; break;
    case 'lore': addLore(50); break;
    case 'tohour': { const h = clamp(+($('dev-hour') || {}).value || 0, 0, 23); devAdvance(((h * 60 - (Game.time % 1440)) + 1440) % 1440 || 1440); break; }
    case 'todays': devAdvance(clamp(+($('dev-days') || {}).value || 1, 1, 30) * 1440); break;
    case 'toseason': { const want = ($('dev-season') || {}).value; let guard = 0; while (World.season !== want && guard++ < 4) devAct('season'); return; }
    case 'rankup': devRankUp(); break;
    case 'unlock': devUnlockAll(); break;
    case 'grow': devGrow(clamp(+($('dev-pop') || {}).value || 0, 1, MAX_POP)); break;
    case 'newvalley': if (typeof openWorldSetup === 'function') openWorldSetup(); break;
    case 'insta': Dev.insta = !Dev.insta; if (Dev.insta) devBuildEverything(); break;
    case 'finishall': devBuildEverything(); break;
    case 'openhomes': devLog('town', `dev: opened ${devOpenLots((l) => l.kind === 'home')} home lots`); if (typeof settleHomes === 'function') settleHomes(true); break;
    case 'opencivic': devLog('town', `dev: opened ${devOpenLots((l) => l.kind !== 'home')} public lots`); break;
    case 'paintall': if (typeof paintGround === 'function') { const t0 = performance.now(); paintGround(World.groundSeason || World.season); toast(`Painted every chunk in ${Math.round(performance.now() - t0)} ms`); } break;
    case 'repaint': if (typeof Ground !== 'undefined') Ground.reset(World.groundSeason || World.season); break;
    case 'lozoom': if (FOLK_LO_ZOOMS.size) FOLK_LO_ZOOMS.clear(); else FOLK_LO_ZOOMS.add(2); break;
    case 'hidegrass': Dev.hide.grass = !Dev.hide.grass; break;
    case 'hideweather': Dev.hide.weather = !Dev.hide.weather; break;
    case 'hidelight': Dev.hide.light = !Dev.hide.light; break;
    case 'traveller': { const r = welcomeTraveller(null); if (!r.ok) toast(r.msg, 'info'); break; }
    case 'assign': assignJobs(true); break;
    case 'plan': planTown(); break;
    case 'rift': { const r = openRift(true); if (!r.ok) toast(r.msg, 'info'); else { centerOn(r.r.x, r.r.y - 20); Game.follow = false; } break; }
    case 'riftsoon': Game.riftNext = Game.time + 10; Village.riftsOn = true; break;
    case 'wayhome': wayHomeProgress(0.25); break;
    case 'novelty': Game.stats.firstRiftDay = Game.day; Game.stats.rifts = 1; break;
    case 'logpause': Dev.paused = !Dev.paused; break;
    case 'logclear': Dev.events = []; break;
    default:
      if (!v) return;
      if (act === 'rethink') { v.abort(); v.queue = []; v.thinkDelay = 0; v.think(Game.hour); }
      if (act === 'content') for (const d of DRIVES) v.drives[d] = 0;
      if (act === 'hungry') v.drives.hunger = 0.95;
      if (act === 'tired') v.drives.tired = 0.95;
      if (act === 'lonely') v.drives.lonely = 0.95;
      if (act === 'tipsy') v.chem.ale = 0.8;
      if (act === 'cold') { v.chem.immune = 0; v.catchCold('dev mode'); }
      if (act === 'riftways') shiftWays(v, 0.4);
      if (act === 'older') { v.age += 1; const st = v.lifeStage(); if (st !== v.stage) { v.stage = st; v.refreshSprites(); } }
      if (act === 'teach') v.edu = Math.min(1, v.edu + 0.2);
      if (act === 'natter') {
        const o = Game.villagers.filter((x) => x !== v && !x.inside && !x.leaving && x.stage !== 'baby').sort((a, b) => dist(a.x, a.y, v.x, v.y) - dist(b.x, b.y, v.x, v.y))[0];
        if (!o) toast('Nobody about to natter with.', 'info');
        else { for (const p of [v, o]) { p.abort(); p.queue = []; } v.begin({ ...ACTIONS.chat, target: () => ({ other: o }) }, Game.hour); o.thinkDelay = 0; }
      }
      if (act === 'gather') {
        if (typeof startGathering === 'function') startGathering(v);
        else toast('No gatherings in this build yet.', 'info');
      }
      if (act === 'ornery') { v.genes.temper = 1; v.genes.merriness = 0; v.genes.sociability = Math.min(v.genes.sociability, 0.3); }
      if (act === 'cheerful') { v.genes.temper = 0; v.genes.merriness = 1; v.genes.sociability = Math.max(v.genes.sociability, 0.7); }
      if ((act === 'petdog' || act === 'petcat') && typeof adoptPet === 'function' && v.home()) adoptPet(v.home(), act === 'petdog' ? 'dog' : 'cat', v);
      devLog('decide', `dev: ${act} on ${v.first}`);
  }
  devRender(true);
}

// ----- map overlays, on the crisp text layer -----
function devOverlay(octx, z, cx, cy, W, H) {
  if (!Dev.on) return;
  const sx = (x) => (x - cx) * z, sy = (y) => (y - cy) * z;
  // the lie of the land: height, slope, sun, wetness, drainage or soil
  if (Dev.overlay.land && Dev.overlay.land !== 'off' && World.land) {
    const tx0 = Math.max(0, Math.floor(cx / 16)), ty0 = Math.max(0, Math.floor(cy / 16));
    const tx1 = Math.min(MAP_W - 1, Math.ceil((cx + W / z) / 16)), ty1 = Math.min(MAP_H - 1, Math.ceil((cy + H / z) / 16));
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const col = landColour(Dev.overlay.land, ty * MAP_W + tx);
      if (col) { octx.fillStyle = col; octx.fillRect(sx(tx * 16), sy(ty * 16), 16 * z + 0.5, 16 * z + 0.5); }
    }
  }
  // cliffs and crags: rock in red-brown, steps in yellow, the rocky mask fading in magenta
  if (Dev.overlay.cliffs && World.cliff) {
    const tx0 = Math.max(0, Math.floor(cx / 16)), ty0 = Math.max(0, Math.floor(cy / 16));
    const tx1 = Math.min(MAP_W - 1, Math.ceil((cx + W / z) / 16)), ty1 = Math.min(MAP_H - 1, Math.ceil((cy + H / z) / 16));
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const i = tIdx(tx, ty), c = World.cliff[i], m = World.cliffMask ? World.cliffMask[i] : 0;
      if (c === 1) octx.fillStyle = 'rgba(200,80,40,0.45)'; else if (c === 2) octx.fillStyle = 'rgba(255,220,40,0.5)'; else if (m > 0) octx.fillStyle = `rgba(255,0,255,${(m * 0.3).toFixed(2)})`; else continue;
      octx.fillRect(sx(tx * 16), sy(ty * 16), 16 * z + 0.5, 16 * z + 0.5);
    }
  } else if (Dev.overlay.cliffs && !World.cliff) { octx.fillStyle = '#fff'; octx.font = '600 11px ui-monospace, Menlo, monospace'; octx.textBaseline = 'top'; octx.fillText('no cliffs in this valley', 12, 40); }
  // the chunks of ground: painted green, painting yellow, still a sketch red
  if (Dev.overlay.chunks && typeof Ground !== 'undefined') {
    octx.font = '600 10px ui-monospace, Menlo, monospace'; octx.textBaseline = 'top'; octx.lineWidth = 2;
    for (const ch of Ground.chunks.values()) {
      const x0 = sx(ch.r.x0), y0 = sy(ch.r.y0), w = (ch.r.x1 - ch.r.x0) * z, h = (ch.r.y1 - ch.r.y0) * z;
      if (x0 > W || y0 > H || x0 + w < 0 || y0 + h < 0) continue;
      octx.strokeStyle = ch.gen ? 'rgba(255,220,40,0.9)' : ch.painted ? 'rgba(80,255,120,0.7)' : 'rgba(255,60,60,0.9)';
      octx.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
      octx.fillStyle = '#fff'; octx.fillText(`${ch.cx},${ch.cy} ${ch.gen ? 'painting' : ch.painted ? ch.season : 'sketch'}${ch.fade > 0 ? ' fade' : ''}`, x0 + 4, y0 + 4);
    }
    octx.lineWidth = 1;
  }
  if (Dev.overlay.grid) {
    const tx0 = Math.max(0, Math.floor(cx / 16)), ty0 = Math.max(0, Math.floor(cy / 16));
    const tx1 = Math.min(MAP_W - 1, Math.ceil((cx + W / z) / 16)), ty1 = Math.min(MAP_H - 1, Math.ceil((cy + H / z) / 16));
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (!walkable(tx, ty)) { octx.fillStyle = World.tiles[tIdx(tx, ty)] === T.WATER ? 'rgba(40,120,255,0.18)' : 'rgba(255,40,40,0.2)'; octx.fillRect(sx(tx * 16), sy(ty * 16), 16 * z, 16 * z); }
      else if (World.reserved[tIdx(tx, ty)]) { octx.fillStyle = 'rgba(255,220,40,0.1)'; octx.fillRect(sx(tx * 16), sy(ty * 16), 16 * z, 16 * z); }
    }
    octx.strokeStyle = 'rgba(0,0,0,0.18)'; octx.lineWidth = 1; octx.beginPath();
    for (let tx = tx0; tx <= tx1 + 1; tx++) { octx.moveTo(Math.round(sx(tx * 16)) + 0.5, 0); octx.lineTo(Math.round(sx(tx * 16)) + 0.5, H); }
    for (let ty = ty0; ty <= ty1 + 1; ty++) { octx.moveTo(0, Math.round(sy(ty * 16)) + 0.5); octx.lineTo(W, Math.round(sy(ty * 16)) + 0.5); }
    octx.stroke();
    // terrace edges: where the ground steps up or down a level (steep on grass, a ramp on a path)
    const lv = World.tileLevel;
    if (lv) {
      octx.lineWidth = 2;
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        const i = tIdx(tx, ty);
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          if (tx + dx >= MAP_W || ty + dy >= MAP_H) continue;
          const j = tIdx(tx + dx, ty + dy);
          if (lv[i] === lv[j]) continue;
          octx.strokeStyle = isRoadTile(World.tiles[i]) || isRoadTile(World.tiles[j]) ? 'rgba(120,255,160,0.9)' : 'rgba(255,150,40,0.9)';
          octx.beginPath();
          if (dx) { octx.moveTo(sx((tx + 1) * 16), sy(ty * 16)); octx.lineTo(sx((tx + 1) * 16), sy((ty + 1) * 16)); }
          else { octx.moveTo(sx(tx * 16), sy((ty + 1) * 16)); octx.lineTo(sx((tx + 1) * 16), sy((ty + 1) * 16)); }
          octx.stroke();
        }
      }
      octx.lineWidth = 1;
    }
    octx.font = '600 11px ui-monospace, Menlo, monospace'; octx.textBaseline = 'top';
    for (const l of World.lots) {
      const [x0, y0, x1, y1] = lotBounds(l);
      octx.strokeStyle = l.state === 'planned' ? 'rgba(255,255,255,0.7)' : l.state === 'building' ? '#ffd23a' : 'rgba(120,255,120,0.6)';
      octx.setLineDash(l.state === 'planned' ? [4, 4] : []); octx.strokeRect(sx(x0 * 16), sy(y0 * 16), (x1 - x0 + 1) * 16 * z, (y1 - y0 + 1) * 16 * z); octx.setLineDash([]);
      octx.fillStyle = '#fff'; octx.fillText(`${l.key || l.kind}·${l.state}`, sx(x0 * 16) + 3, sy(y0 * 16) + 3);
    }
  }
  if (Dev.overlay.paths) {
    for (const v of Game.villagers) {
      if (v.inside || !v.path || v.pathI >= v.path.length) continue;
      const sel = Game.selected === v;
      octx.strokeStyle = sel ? '#ffe14a' : 'rgba(255,255,255,0.45)'; octx.lineWidth = sel ? 2.5 : 1.2;
      octx.beginPath(); octx.moveTo(sx(v.x), sy(v.y));
      for (let i = v.pathI; i < v.path.length; i++) octx.lineTo(sx(v.path[i][0]), sy(v.path[i][1]));
      octx.stroke();
      const end = v.path[v.path.length - 1];
      octx.fillStyle = sel ? '#ffe14a' : 'rgba(255,255,255,0.7)'; octx.fillRect(sx(end[0]) - 3, sy(end[1]) - 3, 6, 6);
    }
  }
  if (Dev.overlay.labels) {
    octx.font = '600 11px ui-monospace, Menlo, monospace'; octx.textBaseline = 'top';
    for (const v of Game.villagers) {
      if (v.inside) continue;
      const x = sx(v.x), y = sy(v.y) + 6;
      if (x < -80 || x > W + 80 || y < -20 || y > H + 20) continue;
      const t = v.task;
      const label = v.leaving ? 'leaving' : t ? `${t.a.id}${t.phase === 'go' ? '→' : ''} ${Math.max(0, Math.round(t.t))}m` : `idle ${dfmt(v.thinkDelay, 1)}`;
      const dr = DRIVES.reduce((a, d) => (v.drives[d] > v.drives[a] ? d : a), DRIVES[0]);
      const line2 = `${dr} ${dfmt(v.drives[dr])} · mood ${dfmt(v.mood())}`;
      const w = Math.max(octx.measureText(label).width, octx.measureText(line2).width) + 8;
      octx.fillStyle = Game.selected === v ? 'rgba(80,60,0,0.85)' : 'rgba(10,14,20,0.72)'; octx.fillRect(x - w / 2, y, w, 28);
      octx.fillStyle = '#e8f6ff'; octx.fillText(label, x - w / 2 + 4, y + 2);
      octx.fillStyle = v.drives[dr] > 0.7 ? '#ff8a7a' : '#9ad0a8'; octx.fillText(line2, x - w / 2 + 4, y + 15);
    }
  }
}
