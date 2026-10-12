'use strict';
// ---------------------------------------------------------------------------
// The Talk tab of the Chronicle: every natter between two folk is kept as a
// thread, line by line, back and forth, so you can read what Pippa and Tobbo
// found to say to each other by the well. A line joins a thread when both
// speaker and listener are in a natter together; one-off remarks across the
// supper table or the taproom, and the storyteller's tales, aren't threaded.
// ---------------------------------------------------------------------------

const TALK_THREADS_MAX = 40, TALK_LINES_MAX = 16;
function talksList() { return Game.talks || (Game.talks = []); }

// Where two folk are standing, for the thread's heading.
function talkPlace(v) {
  if (v.inside) return `in ${v.inside.name || 'the hall'}`;
  const tx = v.x / 16, ty = v.y / 16;
  if (World.wellSpot && dist(v.x, v.y, World.wellSpot.x, World.wellSpot.y) < 40) return 'by the well';
  if (Math.hypot(tx - PLAZA.cx, ty - PLAZA.cy) < 7) return 'on the square';
  if (Math.hypot(tx - PARTY.cx, (ty - PARTY.cy) * 1.4) < 10) return 'in the party field';
  if (Math.hypot(tx - STORY.x, ty - STORY.y - 1) < 4) return 'under the story oak';
  if (Math.hypot(tx - POND.cx, (ty - POND.cy) * 1.4) < 9) return 'by the pond';
  for (const h of World.homes) if (h.built && dist(v.x, v.y, h.doorX, h.doorY) < 48) return `outside ${h.name}`;
  for (const k in World.buildings) { const b = World.buildings[k]; if (dist(v.x, v.y, b.stepX, b.stepY) < 48) return `outside ${b.name}`; }
  if (Math.abs(ty - RIVER_Y(tx)) < 5) return 'by the river';
  const t = World.tiles[tIdx(Math.floor(tx), Math.floor(ty))];
  return t === T.PATH || t === T.COBBLE ? 'in the lane' : t === T.FIELD || t === T.SOIL ? 'in the fields' : 'out on the grass';
}

// A natter in progress between these two, or a new one.
function talkThreadFor(s, l) {
  const a = Math.min(s.id, l.id), b = Math.max(s.id, l.id), T = talksList();
  let th = T.find((t) => t.a === a && t.b === b && Game.time - t.last < 40);
  if (!th) {
    th = { id: (Game.talkSeq = (Game.talkSeq || 0) + 1), day: Game.day, time: fmtTime(Game.time), a, b, an: personById(a).first, bn: personById(b).first, where: talkPlace(s), lines: [], last: Game.time };
    T.unshift(th);
    if (T.length > TALK_THREADS_MAX) T.length = TALK_THREADS_MAX;
  }
  return th;
}
function logTalkLine(s, l, text) {
  const th = talkThreadFor(s, l);
  th.last = Game.time;
  if (th.lines.length < TALK_LINES_MAX) th.lines.push({ v: s.id, t: text });
  if (Game.logFilter === 'talk') renderLog();
}
// A thread for a table or a gathering: three or more, each named.
function talkGroupThread(folk, where) {
  const T = talksList();
  const th = { id: (Game.talkSeq = (Game.talkSeq || 0) + 1), day: Game.day, time: fmtTime(Game.time), ids: folk.map((v) => v.id), names: Object.fromEntries(folk.map((v) => [v.id, v.first])), where, lines: [], last: Game.time };
  T.unshift(th);
  if (T.length > TALK_THREADS_MAX) T.length = TALK_THREADS_MAX;
  return th;
}
function logGroupLine(th, who, text) {
  if (!th || !talksList().includes(th)) return;
  th.last = Game.time;
  if (!th.ids.includes(who.id)) { th.ids.push(who.id); th.names[who.id] = who.first; }
  if (text && th.lines.length < TALK_LINES_MAX + 8) th.lines.push({ v: who.id, t: text });
  if (Game.logFilter === 'talk') renderLog();
}
const listNames = (names) => names.join(', ').replace(/, ([^,]*)$/, ' and $1');

function renderTalkLog(ol) {
  const T = talksList();
  if (!T.length) { const li = document.createElement('li'); li.className = 'talk-none'; li.textContent = 'Nobody has stopped for a natter yet.'; ol.appendChild(li); return; }
  for (const th of T.slice(0, 20)) {
    const li = document.createElement('li'); li.className = 'talk-thread';
    const open = !!(Game.talkOpen && Game.talkOpen[th.id]), long = th.lines.length > 4;
    const lines = long && !open ? th.lines.slice(0, 3) : th.lines;
    const group = !!th.ids;
    const name = (id) => `<a data-v="${id}">${escapeHtml(group ? th.names[id] || '?' : id === th.a ? th.an : th.bn)}</a>`;
    const side = (id) => (group ? 'abcde'[Math.max(0, th.ids.indexOf(id)) % 5] : id === th.a ? 'a' : 'b');
    const head = group ? `${listNames(th.ids.map(name))}, ${escapeHtml(th.where)}` : `${name(th.a)} and ${name(th.b)}, ${escapeHtml(th.where)}`;
    li.innerHTML = `<time>Day ${th.day}, ${th.time} · ${head}</time>`
      + lines.map((ln) => `<div class="talk-line ${side(ln.v)}"><b>${name(ln.v)}</b><span>${escapeHtml(ln.t)}</span></div>`).join('')
      + (long ? `<button class="talk-more" data-talk="${th.id}">${open ? 'Fold it away' : `${th.lines.length - 3} more…`}</button>` : '');
    ol.appendChild(li);
  }
  ol.querySelectorAll('a[data-v]').forEach((a) => a.addEventListener('click', () => { const o = Game.villagers.find((x) => x.id === +a.dataset.v); if (o) { selectVillager(o); focusVillager(o); } }));
  ol.querySelectorAll('.talk-more').forEach((b) => b.addEventListener('click', () => { const o = Game.talkOpen || (Game.talkOpen = {}); o[b.dataset.talk] = !o[b.dataset.talk]; renderLog(); }));
}

window.addEventListener('DOMContentLoaded', () => {
  // the Talk tab, after the others
  const bar = document.querySelector('#chronicle .log-filters');
  if (bar) {
    const b = document.createElement('button'); b.dataset.lf = 'talk'; b.textContent = '… Talk';
    b.addEventListener('click', () => { Game.logFilter = 'talk'; bar.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); renderLog(); });
    bar.appendChild(b);
  }
  const rl = renderLog;
  renderLog = function () {
    if (Game.logFilter !== 'talk') return rl();
    const ol = $('log');
    if (!ol) return;
    ol.innerHTML = '';
    renderTalkLog(ol);
  };
  // every line said to the other half of a natter goes on the thread
  const say = Villager.prototype.say;
  Villager.prototype.say = function (text, dur, opts = {}) {
    const to = opts.to;
    if (text && to && this.task && this.task.a.id === 'chat' && this.task.partner === to && to.task && to.task.a.id === 'chat' && to.task.partner === this) logTalkLine(this, to, text);
    return say.call(this, text, dur, opts);
  };
  const nv = newVillage;
  newVillage = function () { Game.talks = []; Game.talkSeq = 0; Game.talkOpen = {}; return nv(); };
});
