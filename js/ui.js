'use strict';
// ---------------------------------------------------------------------------
// Interface: toolbar, HUD, the villager inspector (five tabs), the village
// ledger, family trees, posting villagers, the chronicle and the intro card.
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Chronicle and toasts
// ---------------------------------------------------------------------------
const QUIET_KINDS = ['info', 'harvest', 'work', 'learn', 'letter', 'quarrel', 'sick'];
function chronicle(text, kind = 'info') {
  devLog({ rift: 'rift', build: 'town', love: 'family', birth: 'family', work: 'jobs', party: 'party', adventure: 'travel', letter: 'travel', season: 'weather' }[kind] || 'story', text);
  Game.log.unshift({ day: Game.day, time: fmtTime(Game.time), text, kind });
  if (Game.log.length > 80) Game.log.length = 80;
  renderLog();
  if (!QUIET_KINDS.includes(kind)) toast(text, kind);
  if (kind === 'birth' && typeof Sound !== 'undefined') Sound.chime();
}

function renderLog() {
  const ol = $('log');
  if (!ol) return;
  ol.innerHTML = '';
  for (const e of Game.log.slice(0, 20)) {
    const li = document.createElement('li'); li.dataset.kind = e.kind;
    li.innerHTML = `<time>Day ${e.day}, ${e.time}</time><span></span>`;
    li.querySelector('span').textContent = e.text;
    ol.appendChild(li);
  }
}

let toastTimer = null;
function toast(text, kind) {
  const el = $('toast');
  if (!el) return;
  el.textContent = text; el.dataset.kind = kind || 'info';
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4800);
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
const TOOLS = [
  { id: 'hand', label: 'Hand', hint: 'Click a villager to select them, click again to pat. Drag a villager to pick them up and carry them. Drag the ground to look around.' },
  { id: 'cake', label: 'Seed-cake', hint: 'Leave a seed-cake on the ground. Hungry folk will come for a slice.' },
  { id: 'ale', label: 'Keg of ale', hint: 'Roll out a keg. Thirsty, merry folk will gather round.' },
  { id: 'leaf', label: 'Pipe-weed', hint: 'Drop a pouch of leaf for the pipe-smokers.' },
  { id: 'remedy', label: 'Remedy', hint: 'Click a poorly villager to dose them with a herbal remedy, or leave a bottle on the ground.' },
  { id: 'book', label: 'Storybook', hint: 'Leave a storybook out. Whoever reads it learns a little (little ones most of all).' },
  { id: 'flowers', label: 'Flowers', hint: 'Plant a patch of wildflowers anywhere you like.' },
  { id: 'firework', label: 'Fireworks', hint: 'Set off fireworks. Folk come to watch. In the party field, it starts a party!' },
];

function iconCanvas(key, size = 18) {
  const c = document.createElement('canvas'); c.width = 9; c.height = 9; c.className = 'ico';
  c.style.width = size + 'px'; c.style.height = size + 'px';
  const ic = ICONS[key];
  if (ic) c.getContext('2d').drawImage(ic, 0, 0);
  return c;
}
function iconHTML(key) { return `<i class="ico" data-icon="${key}"></i>`; }
function hydrateIcons(root) {
  root.querySelectorAll('i.ico[data-icon]').forEach((el) => { const c = iconCanvas(el.dataset.icon, 18); el.replaceWith(c); });
}

function toolIcon(id) {
  const [c, x] = makeCanvas(16, 16);
  let img = null;
  if (id === 'hand') {
    img = spriteFrom([
      '................', '......kk........', '.....kwwk.kk....', '.....kwwkkwwk...', '..kk.kwwkkwwkkk.', '.kwwkkwwkkwwkwwk', '.kwwkkwwwwwwkwwk', '..kwwkwwwwwwwwwk',
      '..kwwwwwwwwwwwwk', '...kwwwwwwwwwwk.', '...kwwwwwwwwwwk.', '....kwwwwwwwwk..', '.....kwwwwwwk...', '......kkkkkk....', '................', '................'],
    { k: '#2a1c12', w: '#f4cfa8' });
  } else if (id === 'flowers') img = makeFlowerPatch(7);
  else if (id === 'firework') img = ICONS.spark;
  else img = SPR.items[id];
  x.drawImage(img, Math.floor((16 - img.width) / 2), Math.floor((16 - img.height) / 2));
  return c;
}

function buildUI() {
  const bar = $('toolbar');
  bar.innerHTML = '';
  TOOLS.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'tool'; b.id = 'tool-' + t.id; b.title = t.hint;
    b.setAttribute('aria-label', t.label);
    const ic = toolIcon(t.id); ic.className = 'tool-icon';
    b.appendChild(ic);
    const lab = document.createElement('span'); lab.textContent = t.label; b.appendChild(lab);
    const key = document.createElement('kbd'); key.textContent = i + 1; b.appendChild(key);
    b.addEventListener('click', () => setTool(t.id));
    bar.appendChild(b);
  });
  setTool('hand');
  document.querySelectorAll('[data-speed]').forEach((b) => b.addEventListener('click', () => setSpeed(+b.dataset.speed)));
  setSpeed(1);
  $('btn-sound').addEventListener('click', () => { Sound.setEnabled(!Sound.enabled); updateSoundBtn(); });
  $('btn-help').addEventListener('click', () => openIntro(false));
  $('btn-folk').addEventListener('click', () => { const r = $('roster'); r.hidden = !r.hidden; if (!r.hidden) renderRoster(); });
  $('btn-village').addEventListener('click', toggleVillage);
  $('build').textContent = BUILD_INFO;
  $('btn-zoomin').addEventListener('click', () => zoomStep(1));
  $('btn-dev').addEventListener('click', () => devToggle());
  $('btn-zoomout').addEventListener('click', () => zoomStep(-1));
  $('roster-close').addEventListener('click', () => { $('roster').hidden = true; });
  $('panel-close').addEventListener('click', () => selectVillager(null));
  $('p-now').addEventListener('click', () => { const v = Game.selected; if (v && v.inside && (v.inside.kind === 'home' || v.inside.kind === 'building')) openInterior(v.inside); });
  $('b-pat').addEventListener('click', doPat);
  $('b-tut').addEventListener('click', doTut);
  $('b-teach').addEventListener('click', doTeach);
  $('b-follow').addEventListener('click', toggleFollow);
  $('log-toggle').addEventListener('click', () => { $('chronicle').classList.toggle('collapsed'); });
  // a first village begins by shaping its valley
  $('intro-go').addEventListener('click', () => (!Game.started && !hasSave() ? openWorldSetup() : startGame(false)));
  $('intro-new').addEventListener('click', () => { $('intro-new').hidden = true; $('intro-confirm').hidden = false; });
  $('intro-confirm-yes').addEventListener('click', openWorldSetup);
  setupWorldGenUI();
  $('intro-confirm-no').addEventListener('click', () => { $('intro-new').hidden = false; $('intro-confirm').hidden = true; });
  document.querySelectorAll('#panel .tabs button').forEach((b) => b.addEventListener('click', () => { Game.panelTab = b.dataset.tab; renderPanel(true); }));
  document.querySelectorAll('#village .tabs button').forEach((b) => b.addEventListener('click', () => { Game.villageTab = b.dataset.tab; renderVillage(); }));
  $('village-close').addEventListener('click', () => { $('village').hidden = true; });
  $('tree-close').addEventListener('click', () => { $('tree').hidden = true; });
  $('post-close').addEventListener('click', () => { $('post').hidden = true; });
  $('post-copy').addEventListener('click', () => {
    const ta = $('post-code'); ta.select();
    try { navigator.clipboard.writeText(ta.value).then(() => { $('post-copy').textContent = 'Copied!'; }, () => document.execCommand('copy')); } catch (e) { document.execCommand('copy'); }
  });
  Game.panelTab = 'life'; Game.villageTab = 'stores';
}

function setTool(id) {
  Game.tool = id;
  document.querySelectorAll('.tool').forEach((b) => b.classList.toggle('active', b.id === 'tool-' + id));
  const t = TOOLS.find((x) => x.id === id);
  $('tool-hint').textContent = t.hint;
  updateHover();
}

function setSpeed(i) {
  if (Game.speedIdx > 0) Game.prevSpeed = Game.speedIdx;
  Game.speedIdx = i;
  document.querySelectorAll('[data-speed]').forEach((b) => b.classList.toggle('active', +b.dataset.speed === i));
}

function updateSoundBtn() {
  const b = $('btn-sound');
  b.textContent = Sound.enabled ? 'Music: on' : 'Music: off';
  b.classList.toggle('active', Sound.enabled);
}

// ---------------------------------------------------------------------------
// Selecting and teaching villagers
// ---------------------------------------------------------------------------
// While a rift-born is selected the whole interface glitches over to neon.
function setRiftMode(on) {
  const b = document.body;
  if (b.classList.contains('rift-mode') === on) return;
  b.classList.toggle('rift-mode', on);
  b.classList.remove('glitching'); void b.offsetWidth; b.classList.add('glitching');
  clearTimeout(setRiftMode.t); setRiftMode.t = setTimeout(() => b.classList.remove('glitching'), 450);
}

function selectVillager(v) {
  Game.selected = v;
  setRiftMode(!!v && v.isRiftborn());
  if (!v) Game.follow = false;
  $('panel').hidden = !v;
  if (v) { drawPortrait($('portrait'), v.genes, v.stage, false, v.look()); v._portraitKey = portraitKey(v); renderPanel(true); }
  updateFollowBtn();
}

function toggleFollow() { Game.follow = !Game.follow && !!Game.selected; updateFollowBtn(); }
function updateFollowBtn() { const b = $('b-follow'); if (b) { b.classList.toggle('active', Game.follow); b.textContent = Game.follow ? 'Following' : 'Follow'; } }

function doPat() {
  const v = Game.selected; if (!v) return;
  if (v.inside) { toast(`${v.first} is indoors. Wait until they pop out.`, 'info'); return; }
  const key = v.pat(); Sound.pat();
  if (key) flashLesson(`${v.first} will be keener on ${ACTION_NAMES[key] ? ACTION_NAMES[key].toLowerCase() : 'that'} now.`);
  renderPanel(true);
}
function doTut() {
  const v = Game.selected; if (!v) return;
  if (v.inside) { toast(`${v.first} is indoors and can't hear you.`, 'info'); return; }
  const key = v.tut(); Sound.tut();
  if (key) flashLesson(`${v.first} will think twice about ${ACTION_NAMES[key] ? ACTION_NAMES[key].toLowerCase() : 'that'}.`);
  renderPanel(true);
}
function doTeach() {
  const v = Game.selected; if (!v) return;
  if (v.inside) { toast(`${v.first} is indoors and can't hear you.`, 'info'); return; }
  if (v.stage === 'baby') { flashLesson(`${v.first} is too little for lessons, and tries to eat the chalk.`); return; }
  if (v.edu > 0.95) { flashLesson(`${v.first} already knows more than you could teach.`); return; }
  const before = eduLevel(v.edu)[1];
  v.teach(); Sound.click();
  const after = eduLevel(v.edu)[1];
  flashLesson(after !== before ? `${v.first} is now ${after.toLowerCase()}!` : `You gave ${v.first} a lesson. Education: ${Math.round(v.edu * 100)}%.`);
  renderPanel(true);
}
function flashLesson(text) { const el = $('lesson'); el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }

// ---------------------------------------------------------------------------
// The inspector panel
// ---------------------------------------------------------------------------
const bar = (val, cls = '') => `<span class="bar ${cls}"><i style="width:${Math.round(clamp(val, 0, 1) * 100)}%" data-level="${val > 0.7 ? 'high' : val > 0.4 ? 'mid' : 'low'}"></i></span>`;
const meter = (val) => `<span class="meter"><i style="width:${Math.round(clamp(val, 0, 1) * 100)}%"></i></span>`;
const stars = (val) => '★'.repeat(Math.max(1, Math.round(val * 5))) + '☆'.repeat(5 - Math.max(1, Math.round(val * 5)));
const link = (o) => {
  if (!o) return '';
  const alive = Game.villagers.includes(o);
  const away = Game.away.some((a) => a.id === o.id);
  return alive ? `<a data-v="${o.id}">${escapeHtml(o.first)}</a>` : `<span class="gone" title="${away ? 'Away adventuring' : 'Gone on a last adventure'}">${escapeHtml(o.first)}${away ? ' (away)' : ' (departed)'}</span>`;
};
const STAGE_WORD = { baby: 'Baby', child: 'Little one', adult: 'Grown-up', elder: 'Elder' };
const BAND_WORD = { toddler: 'Toddler', young: 'Little one', school: 'Schoolchild', youth: 'Youngster' };
function stageWord(v) { return (v.isChild && BAND_WORD[kidBand(v)]) || STAGE_WORD[v.stage]; }

function healthChips(v) {
  const out = [];
  if (v.chem.germs > 0.35) out.push(['bad', 'Sniffles']);
  if (v.chem.toxin > 0.35) out.push(['bad', 'Tummy-ache']);
  if (v.chem.hangover > 0.2) out.push(['bad', 'Sore head']);
  if (v.chem.ale > 0.45) out.push(['mid', 'Tipsy']);
  if (v.drives.cold > 0.6) out.push(['mid', 'Chilled']);
  if (v.chem.immune > 0.4) out.push(['good', 'Recently recovered']);
  if (!out.length) out.push(['good', 'Hale and hearty']);
  return out.map(([c, t]) => `<span class="chip ${c}">${t}</span>`).join('');
}

function renderPanel(full) {
  const v = Game.selected;
  if (!v) return;
  if (v._portraitKey !== portraitKey(v)) { drawPortrait($('portrait'), v.genes, v.stage, false, v.look()); v._portraitKey = portraitKey(v); }
  $('p-name').textContent = v.name();
  const blood = bloodWord(v.genes);
  $('p-sub').textContent = `${v.genes.sex === 'f' ? '♀' : '♂'} ${v.years()} years · ${stageWord(v)}${blood ? ' · ' + blood : ''}${v.job ? ' · ' + JOBS[v.job].label : ''} · ${v.home().name}`;
  $('p-mood').textContent = 'Mood: ' + v.moodWord();
  $('p-mood').dataset.level = v.mood() > 0.6 ? 'good' : v.mood() > 0.35 ? 'mid' : 'low';
  $('p-now').textContent = v.inside && !v.carried ? (v.task ? (v.task.a.label2 ? v.task.a.label2(v) : v.task.a.label) : 'Indoors') + ` (inside ${v.inside.name})` : v.activity();
  const peek = !!(v.inside && (v.inside.kind === 'home' || v.inside.kind === 'building') && !v.carried && Interior.home !== v.inside);
  $('p-now').classList.toggle('peek', peek);
  $('p-now').title = peek ? `Look inside ${v.inside.name}` : '';
  $('b-teach').hidden = v.stage === 'baby' || v.edu > 0.95;
  document.querySelectorAll('#panel .tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === Game.panelTab));
  const body = $('p-body');
  const tab = Game.panelTab;
  if (!full && tab === 'life' && body.dataset.for === String(v.id) && body.dataset.tab === tab) {
    body.querySelectorAll('[data-d]').forEach((i) => { const val = v.drives[i.dataset.d]; i.style.width = Math.round(val * 100) + '%'; i.dataset.level = val > 0.7 ? 'high' : val > 0.4 ? 'mid' : 'low'; });
    body.querySelectorAll('[data-c]').forEach((i) => { i.style.width = Math.round(clamp(v.chem[i.dataset.c], 0, 1) * 100) + '%'; });
    const hc = body.querySelector('.health'); if (hc) hc.innerHTML = healthChips(v);
    const fc = body.querySelector('.feelings'); if (fc) { const html = feelingChips(v); if (fc._html !== html) { fc.innerHTML = html; fc._html = html; } }
    return;
  }
  if (!full) return;
  body.dataset.for = v.id; body.dataset.tab = tab;
  body.innerHTML = ({ life: panelLife, nature: panelNature, mind: panelMind, kin: panelKin, work: panelWork }[tab] || panelLife)(v);
  hydrateIcons(body);
  body.querySelectorAll('a[data-v]').forEach((a) => a.addEventListener('click', () => { const o = Game.villagers.find((x) => x.id === +a.dataset.v); if (o) { selectVillager(o); focusVillager(o); } }));
  const tb = body.querySelector('[data-tree]'); if (tb) tb.addEventListener('click', () => openTree(v));
  const pb = body.querySelector('[data-post]'); if (pb) pb.addEventListener('click', () => openPost(v));
  const js = body.querySelector('select[data-job]');
  if (js) js.addEventListener('change', () => {
    const val = js.value;
    if (val === 'auto') { v.playerJob = false; v.job = null; assignJobs(false); toast(`${v.first} will find their own trade.`, 'info'); }
    else { v.playerJob = true; v.job = val; v.remember(`Was steered towards ${JOBS[val].label.toLowerCase()} work.`, 0); toast(`${v.first} is now the village ${JOBS[val].label.toLowerCase()}.`, 'work'); }
    renderPanel(true);
  });
}

// How they feel, and why.
function feelingChips(v) {
  const f = feelingsOf(v);
  if (!f.length) return '<span class="chip mid">Nothing much either way</span>';
  return f.slice(0, 8).map(([label, val, left]) => `<span class="chip ${val > 0 ? 'good' : 'bad'}" title="${val > 0 ? 'Lifts' : 'Sinks'} their mood${left != null && left < 5000 ? ` for another ${fmtSpan(left)}` : ''}">${val > 0 ? '+' : '−'}${Math.max(1, Math.round(Math.abs(val) * 30))} ${escapeHtml(label)}</span>`).join('');
}
function fmtSpan(m) { return m >= 90 ? `${Math.round(m / 60)} hours` : `${Math.max(1, Math.round(m))} minutes`; }

function panelLife(v) {
  let h = v.stage === 'baby' ? '' : `<h3>Feelings</h3><div class="chips feelings">${feelingChips(v)}</div>`;
  h += '<h3>Needs</h3>';
  for (const d of DRIVES) {
    if ((d === 'craving' || d === 'industry') && !v.isGrown()) continue;
    if (d === 'craving' && v.genes.pipeLove < 0.15) continue;
    h += `<div class="drive"><span class="dl">${DRIVE_LABEL[d]}</span><span class="bar"><i data-d="${d}" style="width:${Math.round(v.drives[d] * 100)}%"></i></span></div>`;
  }
  h += `<h3>Health</h3><div class="chips health">${healthChips(v)}</div>`;
  h += '<div class="humours">';
  for (const [k, l] of [['ale', 'Tipsiness'], ['germs', 'Germs'], ['toxin', 'Toxins'], ['immune', 'Immunity']]) h += `<div class="drive small"><span class="dl">${l}</span><span class="bar thin"><i data-c="${k}" class="c-${k}" style="width:${Math.round(clamp(v.chem[k], 0, 1) * 100)}%"></i></span></div>`;
  h += '</div>';
  const home = v.home();
  const larder = PANTRY_KINDS.filter((k) => home.pantry[k] > 0).map((k) => `${home.pantry[k]} ${FOODS[k].label}`).join(', ') || 'bare!';
  h += `<div class="pocket">${v.isGrown() && v.genes.pipeLove > 0.15 ? `Leaf pouch: ${v.pouch} pinch${v.pouch === 1 ? '' : 'es'}<br>` : ''}Larder at home: ${larder}${home.chilly ? '<br><b>The hearth at home is cold. No timber!</b>' : ''}</div>`;
  if (v.expecting) { const o = person(v.expecting.with); h += `<div class="note">Expecting a little one with ${link(o)} any day now!</div>`; }
  return h;
}

function panelNature(v) {
  const g = v.genes;
  let h = '<h3>Personality</h3><div class="traits">';
  for (const t of TRAITS) {
    const val = g[t], [label, lo, hi] = TRAIT_INFO[t];
    const word = val >= 0.68 ? hi : val <= 0.32 ? lo : '';
    h += `<div class="trait"><span class="tl">${label}</span>${meter(val)}<span class="tw">${word}</span></div>`;
  }
  h += '</div><h3>Talents</h3><div class="talents">';
  for (const s of topTalents(g, 3)) h += `<div><span>${SKILL_LABEL[s]}</span><span class="stars" title="Aptitude">${stars(g.apt[s])}</span></div>`;
  h += '</div><h3>Inherited looks</h3><div class="genes">';
  for (const [k, val] of geneDescription(g)) h += `<div><b>${k}</b> ${val}</div>`;
  const ps = v.parents.map(person).filter(Boolean);
  if (ps.length) h += `<div><b>Parents</b> ${ps.map(link).join(' & ')}</div>`;
  if (g.mutations.length) h += `<div class="note">Born with ${g.mutations.join(', and ')}: a mutation, not inherited from either parent.</div>`;
  h += '</div><h3>Instincts</h3>';
  const inst = Object.keys(g.taste).filter((a) => HABIT_KEYS.includes(a)).sort((a, b) => g.taste[b] - g.taste[a]);
  const foods = PANTRY_KINDS.slice().sort((a, b) => g.food[b] - g.food[a]);
  h += `<div class="likes"><div><b>Born loving</b> ${inst.slice(0, 2).map((a) => ACTION_NAMES[a].toLowerCase()).join(', ')} and ${FOODS[foods[0]].label}</div><div><b>Born wary of</b> ${ACTION_NAMES[inst[inst.length - 1]].toLowerCase()} and ${FOODS[foods[foods.length - 1]].label}</div></div>`;
  if (v.isGrown()) h += '<div class="row-btns"><button data-post title="Pack this villager\'s genome into a code a friend can paste into their own game of Merryfolk">Post a copy to a friend</button></div>';
  return h;
}

function panelMind(v) {
  let h = '<h3>Habits (learned)</h3>';
  const keys = HABIT_KEYS.filter((a) => v.canDo(ACTIONS[a]) && (!ACTIONS[a].hobby || hasHobby(v, ACTIONS[a].hobby)));
  const ranked = keys.map((a) => [a, v.weights[a] * (v.genes.taste[a] || 1)]).sort((a, b) => b[1] - a[1]);
  h += '<div class="habits">';
  for (const [a, w] of ranked.slice(0, 4)) h += `<div class="habit"><span>${ACTION_NAMES[a]}</span>${bar(w / 2.4, 'good')}</div>`;
  h += '<div class="sep">Not keen on</div>';
  for (const [a, w] of ranked.slice(-3)) h += `<div class="habit"><span>${ACTION_NAMES[a]}</span>${bar(w / 2.4, 'low')}</div>`;
  h += '</div>';
  if (v.isGrown() || v.isChild()) {
    const foods = PANTRY_KINDS.slice().sort((a, b) => v.genes.food[b] * v.foodLike[b] - v.genes.food[a] * v.foodLike[a]);
    h += `<div class="likes"><div><b>Favourite food</b> ${FOODS[foods[0]].label}</div><div><b>Least favourite</b> ${FOODS[foods[foods.length - 1]].label}</div>`;
    if (v.wary > 0.1) h += `<div><b>Has learned</b> to be wary of toadstools${v.wary > 0.5 ? ' (very!)' : ''}</div>`;
    h += '</div>';
  }
  if (hobbyAge(v)) h += `<h3>Hobbies</h3><ul class="edu-fx">${hobbyLines(v).map((t) => `<li>${t}</li>`).join('')}</ul>`;
  const lvl = eduLevel(v.edu);
  h += `<h3>Education</h3><div class="drive"><span class="dl">${lvl[1]}</span>${bar(v.edu, 'good')}</div>`;
  h += `<div class="likes"><div><b>Speaks</b> ${{ baby: 'in babbles and gurgles', toddler: 'in toddler talk, a word or two at a time', child: 'like a chatty little one', bright: 'like a bright, bookish little one', plain: 'plainly, in good honest words', common: 'like most folk in the Shire', fine: 'rather grandly, quoting books' }[register(v)]}${v.techTier >= 2 ? ', thick with rift-talk' : v.techTier === 1 ? ', with a sprinkle of rift-talk' : ''}</div>`;
  if (v.isRiftborn()) h = h.replace(/<b>Speaks<\/b> [^<]*/, `<b>Speaks</b> in clipped rift-talk${v.tech < 0.7 ? ', softened with a few hill-folk sayings' : ''}`);
  const from = Object.entries(v.eduFrom).filter(([, x]) => x > 0.005).sort((a, b) => b[1] - a[1]);
  if (from.length) h += `<div><b>Learned from</b> ${from.slice(0, 4).map(([k]) => EDU_SOURCES[k] || k).join(', ')}</div>`;
  h += `</div><ul class="edu-fx">${eduEffects(v).map((t) => `<li>${t}</li>`).join('')}</ul>`;
  if (v.stage !== 'baby' && (v.tech > 0.02 || v.genes.rift > 0 || Game.villagers.some((o) => o.isRiftborn()))) {
    h += `<h3>Rift ways</h3><div class="drive"><span class="dl">${techWord(v)}</span>${bar(v.tech, 'mid')}</div>`;
    if (v.isRiftborn()) h += `<div class="drive"><span class="dl">${lostWord(v)}</span>${bar(v.lost || 0, 'low')}</div>`;
    const fx = [];
    if (v.techTier >= 1) fx.push('Wears neon trim' + (v.techTier >= 2 ? ', synth-weave' + (v.visor ? ' and a visor' : '') : ''));
    if (v.tech >= 0.3) fx.push(World.buildings.relay ? 'Likes to jack in at the Relay Mast' : 'Would jack in at a Relay, if the village had one');
    if (v.tech >= 0.45) fx.push('Fiddles with gadgets instead of (or as well as) a pipe');
    if (v.tech >= 0.6) fx.push('Could make a good tinker');
    if (v.techTier >= 1) fx.push('Slips into rift-talk: "ping", "signal", "low battery"');
    if (v.techTier === 0) fx.push('Picks up rift ways by chatting with the rift-minded, and at home');
    h += `<ul class="edu-fx">${fx.map((t) => `<li>${t}</li>`).join('')}</ul>`;
  }
  if (!v.isGrown()) h += '<div class="hint">Little ones learn at the story circle, from storybooks, round the supper table, from grown-ups who stop to explain things, and from you (Teach, or <kbd>E</kbd>).</div>';
  h += '<h3>Diary</h3><ol class="diary">';
  if (!v.memories.length) h += '<li>Nothing much to report yet.</li>';
  for (const m of v.memories.slice(0, 10)) h += `<li data-v="${m.v > 0 ? 'good' : m.v < 0 ? 'bad' : 'mid'}"><time>Day ${m.d}</time> ${escapeHtml(m.t)}</li>`;
  return h + '</ol>';
}

function kinOf(v) {
  const all = Game.villagers.concat(Object.values(Game.archive)).concat(Game.away.map((a) => a.data));
  const byId = (id) => person(id) || (Game.away.find((a) => a.id === id) || {}).data;
  const parents = v.parents.map(byId).filter(Boolean);
  const kids = all.filter((o) => o.parents && o.parents.includes(v.id));
  const sibs = all.filter((o) => o.id !== v.id && o.parents && o.parents.some((p) => v.parents.includes(p)));
  const gps = parents.flatMap((p) => (p.parents || []).map(byId)).filter(Boolean);
  const gks = all.filter((o) => o.parents && o.parents.some((p) => kids.some((k) => k.id === p)));
  return { parents, kids: uniq(kids), sibs: uniq(sibs), gps: uniq(gps), gks: uniq(gks), byId };
}
const uniq = (arr) => { const s = new Set(); return arr.filter((x) => (s.has(x.id) ? false : (s.add(x.id), true))); };

function panelKin(v) {
  const k = kinOf(v);
  let h = '<h3>Family</h3><div class="rel">';
  const sp = k.byId(v.spouse);
  if (sp) h += `<div>Married to ${link(sp)}</div>`;
  else if (v.sweetheart) h += `<div>Sweetheart: ${link(k.byId(v.sweetheart))} ${meter(v.love[v.sweetheart] || 0)}</div>`;
  if (k.parents.length) h += `<div>Child of ${k.parents.map(link).join(' & ')}</div>`;
  if (k.sibs.length) h += `<div>${k.sibs.length > 1 ? 'Siblings' : 'Sibling'}: ${k.sibs.map(link).join(', ')}</div>`;
  if (k.kids.length) h += `<div>Parent of ${k.kids.map(link).join(', ')}</div>`;
  if (k.gps.length) h += `<div>Grandparents: ${k.gps.map(link).join(', ')}</div>`;
  if (k.gks.length) h += `<div>Grandchildren: ${k.gks.map(link).join(', ')}</div>`;
  if (!sp && !k.parents.length && !k.kids.length && !v.sweetheart) h += '<div>No family in the village (yet).</div>';
  h += '<div class="row-btns"><button data-tree>Family tree</button></div></div>';
  const others = Object.entries(v.rel).map(([id, f]) => [Game.villagers.find((o) => o.id === +id), f]).filter(([o]) => o && o.id !== v.spouse && !v.parents.includes(o.id) && !o.parents.includes(v.id));
  const friends = others.filter(([, f]) => f > 0.3).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const rivals = others.filter(([, f]) => f < -0.15).sort((a, b) => a[1] - b[1]).slice(0, 3);
  h += '<h3>Friends</h3><div class="friends">';
  if (!friends.length) h += '<div>Still getting to know everyone.</div>';
  for (const [o, f] of friends) h += `<div class="friend">${link(o)}${bar(f, 'good')}${(v.love[o.id] || 0) > 0.2 ? '<span class="heart" title="Fond of them">♥</span>' : ''}</div>`;
  h += '</div>';
  if (rivals.length) {
    h += '<h3>Rivals</h3><div class="friends">';
    for (const [o, f] of rivals) h += `<div class="friend">${link(o)}${bar(-f, 'low')}</div>`;
    h += '</div>';
  }
  return h;
}

function panelWork(v) {
  let h = '';
  if (v.isGrown()) {
    const J = v.job ? JOBS[v.job] : null;
    h += `<h3>Trade</h3><div class="job">${J ? `${iconHTML(J.icon)} <b>${J.label}</b><div class="sub">${J.desc}</div>` : (v.stage === 'elder' ? '<b>Retired</b><div class="sub">Enjoying a well-earned rest.</div>' : '<b>No trade yet</b><div class="sub">Will find one soon.</div>')}</div>`;
    h += '<label class="jobsel">Steer them towards: <select data-job><option value="auto">Let them choose</option>';
    for (const j in JOBS) h += `<option value="${j}" ${v.playerJob && v.job === j ? 'selected' : ''}>${JOBS[j].label}</option>`;
    h += '</select></label>';
  } else {
    h += `<h3>Growing up</h3><div class="sub">${v.stage === 'baby' ? 'Too little for anything but milk and cuddles.' : `Watches grown-ups at work and picks up their skills.${v.apprenticedTo ? ` Lately fascinated by ${JOBS[v.apprenticedTo].label.toLowerCase()} work.` : ''}`}</div>`;
  }
  h += '<h3>Skills</h3><div class="skills">';
  for (const s of SKILLS) h += `<div class="skill"><span>${SKILL_LABEL[s]}</span>${bar(v.skills[s] / 100, 'good')}<span class="stars" title="Aptitude: how quickly they learn it">${stars(v.genes.apt[s])}</span></div>`;
  h += '</div><div class="hint">Skills grow with practice: faster with talent (stars) and with a good education. Better hands make more from their work.</div>';
  return h;
}

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------
// The list is built once and then only the activity lines are refreshed
// while it's open; it's rebuilt when someone moves, grows up or changes trade.
function renderRoster() {
  const list = $('roster-list');
  const sig = Game.villagers.map((v) => `${v.id}:${v.homeId}:${v.stage}:${v.job || ''}:${v.techTier}`).join(',') + '|' + Game.away.length;
  if (list._sig === sig) {
    for (const row of list.querySelectorAll('.roster-row')) {
      const v = row._v, sm = row._small;
      const text = v.inside ? (v.task ? (v.task.a.label2 ? v.task.a.label2(v) : v.task.a.label) : 'Indoors') : v.activity();
      if (sm.textContent !== text) sm.textContent = text;
    }
    return;
  }
  list._sig = sig;
  list.innerHTML = '';
  const byHome = World.homes.map((h) => [h, Game.villagers.filter((v) => v.homeId === h.id)]).filter(([, vs]) => vs.length);
  for (const [h, vs] of byHome) {
    const g = document.createElement('div'); g.className = 'roster-home';
    g.innerHTML = `<h4>${escapeHtml(h.name)}</h4>`;
    for (const v of vs) {
      const b = document.createElement('button'); b.className = 'roster-row';
      // the villager's own standing sprite, already drawn, scaled to fit
      const c = document.createElement('canvas'); c.width = 24; c.height = 32;
      const sp = v.sprites.down.stand, cx = c.getContext('2d');
      cx.imageSmoothingEnabled = false;
      const k = Math.min(c.width / sp.width, c.height / sp.height);
      cx.drawImage(sp, Math.floor((c.width - sp.width * k) / 2), c.height - sp.height * k, sp.width * k, sp.height * k);
      b.appendChild(c);
      const s = document.createElement('span');
      s.innerHTML = `<b>${escapeHtml(v.first)}${v.job ? ` <em>${JOBS[v.job].label}</em>` : v.stage === 'baby' ? ' <em>baby</em>' : ''}</b><small></small>`;
      b.appendChild(s);
      b._v = v; b._small = s.querySelector('small');
      b._small.textContent = v.inside ? (v.task ? v.task.a.label : 'Indoors') : v.activity();
      b.addEventListener('click', () => { selectVillager(v); focusVillager(v); });
      g.appendChild(b);
    }
    list.appendChild(g);
  }
  if (Game.away.length) {
    const g = document.createElement('div'); g.className = 'roster-home';
    g.innerHTML = `<h4>Away adventuring</h4>${Game.away.map((a) => `<div class="roster-away">${escapeHtml(a.data.first)} ${escapeHtml(a.data.surname)}, due back about day ${a.back}</div>`).join('')}`;
    list.appendChild(g);
  }
}

// ---------------------------------------------------------------------------
// The village ledger
// ---------------------------------------------------------------------------
function toggleVillage() { const el = $('village'); el.hidden = !el.hidden; if (!el.hidden) renderVillage(); }

function renderVillage() {
  document.querySelectorAll('#village .tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === Game.villageTab));
  const body = $('village-body');
  body.innerHTML = ({ stores: villageStores, trades: villageTrades, census: villageCensus, remembered: villageRemembered, travellers: villageTravellers }[Game.villageTab] || villageStores)();
  hydrateIcons(body);
  if (Game.villageTab === 'census') drawCensus($('census-chart'));
  if (Game.villageTab === 'remembered') body.querySelectorAll('canvas[data-arch]').forEach((c) => { const a = Game.archive[c.dataset.arch]; if (a) drawPortrait(c, a.genes, a.stage === 'baby' ? 'child' : a.stage, true, a.look); });
  body.querySelectorAll('a[data-v]').forEach((a) => a.addEventListener('click', () => { const o = Game.villagers.find((x) => x.id === +a.dataset.v); if (o) { selectVillager(o); focusVillager(o); } }));
  if (Game.villageTab === 'travellers') {
    $('tr-invite').addEventListener('click', () => {
      if (Game.day - Game.lastTraveller < 1) { toast('One traveller a day. The road is long.', 'info'); return; }
      const r = welcomeTraveller(null);
      if (!r.ok) toast(r.msg, 'info'); else { selectVillager(r.v); focusVillager(r.v); $('village').hidden = true; }
    });
    $('tr-rift').addEventListener('click', () => {
      const r = openRift(true);
      if (!r.ok) toast(r.msg, 'info'); else { $('village').hidden = true; Game.follow = false; centerOn(r.r.x, r.r.y - 20); updateFollowBtn(); }
    });
    $('tr-rifts-on').addEventListener('click', () => {
      Village.riftsOn = !Village.riftsOn;
      if (Village.riftsOn && Game.riftNext < Game.time + 300) Game.riftNext = Game.time + R.f(300, 900);
      renderVillage();
    });
    $('tr-import').addEventListener('click', () => {
      try {
        const data = importVillagerCode($('tr-code').value);
        const r = welcomeTraveller(data);
        if (!r.ok) toast(r.msg, 'info'); else { selectVillager(r.v); focusVillager(r.v); $('village').hidden = true; }
      } catch (e) { $('tr-error').textContent = e.message; }
    });
  }
}

function villageStores() {
  const S = Village.stores, Y = Village.yesterday;
  const groups = [['Food', ['bread', 'pie', 'cake', 'stew', 'veg', 'fish', 'mush', 'apple', 'egg', 'cheese']], ['Makings', ['grain', 'flour', 'honey', 'herbs', 'scrap']], ['Comforts', ['ale', 'leaf', 'remedy', 'wood', 'wool']]];
  let h = '<p class="lede-s">Everything the village grows, catches and makes goes into the Common Store, and folk fetch what their larders need. Numbers in grey are yesterday\'s comings and goings.</p>';
  for (const [title, keys] of groups) {
    h += `<h3>${title}</h3><div class="stores">`;
    for (const k of keys) {
      const made = Math.round(Y.made[k] || 0), used = Math.round(Y.used[k] || 0);
      const low = (S[k] || 0) < (k === 'wood' ? 8 : k === 'ale' ? 6 : 3);
      h += `<div class="store ${low ? 'low' : ''}">${iconHTML(RES_INFO[k].icon)}<span class="sl">${RES_INFO[k].label}</span><b>${Math.floor(S[k] || 0)}</b><small>+${made} / −${used}</small></div>`;
    }
    h += '</div>';
  }
  const larders = World.homes.filter((x) => x.built).reduce((s, x) => s + pantryTotal(x), 0);
  const cold = World.homes.filter((x) => x.built && x.chilly).length;
  const built = World.homes.filter((x) => x.built);
  const live = Game.villagers.filter((v) => !v.leaving).length;
  const empty = built.filter((x) => !residentsOf(x).length).length;
  const waiting = housingNeed();
  h += `<h3>Homes and building</h3><div class="likes"><div>${built.length} hobbit-holes for ${live} folk (about ${(live / Math.max(1, built.length - empty)).toFixed(1)} to a lived-in hole)${empty ? `, ${empty} standing ready for newcomers` : ''}. ${larders} helpings in larders${cold ? `, <b>${cold} cold hearth${cold > 1 ? 's' : ''}</b>` : ''}.</div>`;
  if (waiting) h += `<div><b>${waiting} household${waiting > 1 ? 's are' : ' is'} waiting for a hole of their own.</b></div>`;
  for (const p of Village.projects) {
    const what = p.kind === 'home' ? 'Digging' : p.kind === 'field' ? 'Ploughing' : p.kind === 'well' ? 'Sinking' : p.kind === 'retrofit' ? 'Wiring up' : 'Raising';
    const needsScrap = p.kind === 'retrofit' || (p.lot != null && World.lots[p.lot].def && World.lots[p.lot].def.rift);
    const stall = projectReady(p) ? '' : needsScrap && (Village.stores.scrap || 0) < 2 ? ' <small>(waiting for rift salvage)</small>' : ' <small>(waiting for timber: the hearths come first)</small>';
    h += `<div class="build-row"><span>${what} ${escapeHtml(projectLabel(p))} · ${Math.round(p.prog * 100)}%${stall}</span>${bar(p.prog, 'good')}</div>`;
  }
  const knolls = World.homes.filter((x) => !x.built && !Village.projects.some((p) => p.homeId === x.id)).length + World.lots.filter((l) => l.kind === 'home' && l.state === 'planned').length;
  if (!Village.projects.length) h += '<div>No building under way just now.</div>';
  h += `<div class="sub">${knolls} more spots surveyed for hobbit-holes. The woodwrights build whenever folk need room, and keep a spare hole or two ready.</div>`;
  const done = CIVIC_DEFS.filter((d) => civicBuilt(d.key));
  const next = CIVIC_DEFS.find((d) => !civicBuilt(d.key) && World.lots.some((l) => l.key === d.key && l.state === 'planned'));
  if (done.length) h += `<div>Built as the village grew: ${done.map((d) => d.name.replace(/^the /, 'the ')).join(', ')}.</div>`;
  if (next) h += `<div class="sub">Next planned: ${next.name.replace(/^the /, 'the ')}, once ${next.pop} folk live here.</div>`;
  return h + '</div>';
}

function villageTrades() {
  const targets = jobTargets();
  let h = '<p class="lede-s">Grown-ups take up a trade that suits their talents, their practice, their family\'s trade and what the village is short of. You can steer anyone from the Work tab of their panel.</p><div class="trades">';
  for (const j in JOBS) {
    const ws = Game.villagers.filter((v) => v.job === j);
    const want = targets[j];
    h += `<div class="trade">${iconHTML(JOBS[j].icon)}<div><b>${JOBS[j].label}</b> <small>${ws.length}/${want} wanted</small><div class="sub">${JOBS[j].desc}</div><div>${ws.map((v) => `${link(v)} <small>(${Math.round(v.skills[JOBS[j].skill])})</small>`).join(', ') || '<em>Nobody yet</em>'}</div></div></div>`;
  }
  const idle = Game.villagers.filter((v) => v.isGrown() && !v.job);
  if (idle.length) h += `<div class="trade">${iconHTML('pipe')}<div><b>Of leisure</b><div>${idle.map(link).join(', ')}</div></div></div>`;
  return h + '</div>';
}

function villageCensus() {
  const pop = Game.villagers.length;
  const kids = Game.villagers.filter((v) => !v.isGrown()).length;
  const st = Game.stats || {};
  const gens = Math.max(1, ...Game.villagers.map((v) => generationOf(v)));
  return `<p class="lede-s">Population, little ones and the village's mood, day by day.</p>
  <canvas id="census-chart" width="560" height="200"></canvas>
  <div class="legend"><span class="k pop">Folk</span><span class="k kids">Little ones</span><span class="k mood">Mood</span></div>
  <div class="census-facts"><div><b>${pop}</b> folk</div><div><b>${kids}</b> little ones</div><div><b>${Object.keys(Game.archive).length}</b> departed</div><div><b>${gens}</b> generations</div><div><b>${st.births || 0}</b> born here</div><div><b>${st.weddings || 0}</b> weddings</div></div>`;
}
function generationOf(v, depth = 0) {
  if (depth > 12 || !v || !v.parents || !v.parents.length) return 1;
  return 1 + Math.max(...v.parents.map((p) => generationOf(person(p), depth + 1)));
}
function drawCensus(c) {
  if (!c) return;
  const x = c.getContext('2d');
  const W = c.width, H = c.height;
  x.clearRect(0, 0, W, H);
  x.fillStyle = '#efe0bc'; x.fillRect(0, 0, W, H);
  const data = Game.census.length ? Game.census : [{ day: 0, pop: Game.villagers.length, mood: 0.7, kids: 0 }];
  const maxPop = Math.max(MAX_POP * 0.6, ...data.map((d) => d.pop));
  const px = (i) => 30 + (i / Math.max(1, data.length - 1)) * (W - 44);
  x.strokeStyle = '#d8bf88'; x.lineWidth = 1;
  for (let k = 0; k <= 4; k++) { const y = 10 + (H - 30) * (k / 4); x.beginPath(); x.moveTo(30, y); x.lineTo(W - 10, y); x.stroke(); }
  x.fillStyle = '#5a3a22'; x.font = '11px "Pixelify Sans", monospace';
  x.fillText(Math.round(maxPop), 4, 14); x.fillText('0', 14, H - 18);
  const line = (key, col, scale) => {
    x.strokeStyle = col; x.lineWidth = 2.5; x.beginPath();
    data.forEach((d, i) => { const y = 10 + (H - 30) * (1 - d[key] / scale); if (i) x.lineTo(px(i), y); else x.moveTo(px(i), y); });
    x.stroke();
  };
  line('pop', '#3f6b2f', maxPop); line('kids', '#2f6f8f', maxPop); line('mood', '#c9a227', 1);
  x.fillStyle = '#5a3a22';
  const step = Math.max(1, Math.ceil(data.length / 8));
  data.forEach((d, i) => { if (i % step === 0) x.fillText('Day ' + d.day, px(i) - 12, H - 4); });
}

function villageRemembered() {
  const arch = Object.values(Game.archive).sort((a, b) => b.left - a.left);
  let h = '<p class="lede-s">Everyone who has set off on a last great adventure, over the hills and far away. They live on in the family trees.</p>';
  if (Game.away.length) h += `<h3>Away adventuring (coming back)</h3><div class="likes">${Game.away.map((a) => `<div>${escapeHtml(a.data.first)} ${escapeHtml(a.data.surname)}: due home about day ${a.back}</div>`).join('')}</div>`;
  h += '<h3>Departed</h3><div class="arch">';
  if (!arch.length) h += '<div class="sub">Nobody yet. The old folk are still hale.</div>';
  for (const a of arch) h += `<div class="arch-row"><canvas data-arch="${a.id}" width="24" height="32"></canvas><div><b>${escapeHtml(a.first)} ${escapeHtml(a.surname)}</b><small>${a.years} years${a.job ? ' · ' + JOBS[a.job].label : ''} · ${a.reason === 'home' ? 'went home through a rift' : 'left'} on day ${a.left}</small></div></div>`;
  return h + '</div>';
}

function villageTravellers() {
  const wait = Game.day - Game.lastTraveller < 1;
  return `<p class="lede-s">Folk sometimes come walking up the West Road looking for a home, like the eggs in the old Creatures hatchery. Others step out of rifts in the sky. And villages can post their folk to one another, like Docking Station's warp.</p>
  <h3>Welcome a stranger</h3><div class="row-btns"><button id="tr-invite" ${wait || Game.villagers.length >= MAX_POP ? 'disabled' : ''}>Invite a traveller</button><span class="sub">${Game.villagers.length >= MAX_POP ? 'The village is full.' : wait ? 'Another may come tomorrow.' : 'A newcomer with their own genes will arrive along the West Road.'}</span></div>
  ${riftLedger()}
  <h3>Receive a villager by post</h3><p class="sub">Paste a code a friend made with "Post a copy to a friend" (on the Nature tab of any grown-up).</p>
  <textarea id="tr-code" rows="3" placeholder="TD2:..."></textarea><div class="row-btns"><button id="tr-import">Welcome them</button><span id="tr-error" class="err"></span></div>`;
}

function portraitKey(v) { return v.stage + v.techTier + (v.visor ? 'v' : ''); }

function riftLedger() {
  const born = Game.villagers.filter((v) => v.isRiftborn() && !v.leaving);
  const mixed = Game.villagers.filter((v) => v.genes.rift > 0 && v.genes.rift < 0.99 && !v.leaving);
  const share = Math.round(riftShare() * 100);
  const neon = World.homes.filter((h) => h.built && h.neon).length;
  const open = World.rifts.length > 0;
  const built = RIFT_CIVIC.filter((d) => civicBuilt(d.key));
  const next = RIFT_CIVIC.find((d) => !civicBuilt(d.key) && World.lots.some((l) => l.key === d.key && l.state === 'planned'));
  const days = Math.max(0, Math.ceil((Game.riftNext - Game.time) / 1440));
  let h = '<h3>Rifts</h3><div class="likes">';
  h += `<div>${born.length ? `<b>${born.length}</b> rift-born live here${mixed.length ? `, and <b>${mixed.length}</b> folk of mixed blood` : ''}.` : 'No rift-born live here yet.'} ${share}% of hill-folk have taken up rift ways. ${neon} neon home${neon === 1 ? '' : 's'}. ${Math.floor(Village.stores.scrap || 0)} salvage in the Store.</div>`;
  if (born.length) h += `<div>${born.slice(0, 12).map(link).join(', ')}</div>`;
  if (built.length) h += `<div>Rift-built: ${built.map((d) => d.name).join(', ')}.</div>`;
  const seekers = homeSeekers();
  if (World.rifts.some((r) => r.home)) h += '<div><b>The way home is open!</b> A golden rift hangs in the air. Each of the rift-folk is making their choice.</div>';
  else if (seekers.length || Village.wayHome > 0) h += `<div class="build-row"><span>The way home: ${seekers.length} rift-folk searching together · ${Math.round((Village.wayHome || 0) * 100)}%</span>${bar(Village.wayHome || 0, 'good')}</div>`;
  if (next) h += `<div class="sub">Next: ${next.name}, ${next.when}.</div>`;
  h += `<div class="sub">${open ? 'A rift is open right now!' : Village.riftsOn ? `The air feels thin. Another rift may open ${days <= 1 ? 'soon' : `in about ${days} days`}.` : 'Rifts are switched off: the sky stays stitched.'}</div></div>`;
  h += `<div class="row-btns"><button id="tr-rift" ${open || Game.villagers.length >= MAX_POP - 1 ? 'disabled' : ''}>Open a rift now</button><button id="tr-rifts-on" class="ghost">${Village.riftsOn ? 'Stop rifts opening' : 'Let rifts open again'}</button></div>`;
  return h;
}

// ---------------------------------------------------------------------------
// Family tree
// ---------------------------------------------------------------------------
function openTree(v) {
  const k = kinOf(v);
  const card = (o, cls = '') => {
    if (!o) return '';
    const alive = Game.villagers.find((x) => x.id === o.id);
    const away = Game.away.find((a) => a.id === o.id);
    const note = alive ? (alive.job ? JOBS[alive.job].label : stageWord(alive)) : away ? 'Away adventuring' : 'Departed';
    return `<button class="tnode ${cls} ${alive ? '' : 'gone'}" data-id="${o.id}"><canvas width="24" height="32" data-pid="${o.id}"></canvas><b>${escapeHtml(o.first)}</b><small>${note}</small></button>`;
  };
  const sp = k.byId(v.spouse);
  const rows = [
    ['Grandparents', k.gps], ['Parents', k.parents],
    [null, [v].concat(sp ? [sp] : []).concat(k.sibs)], ['Children', k.kids], ['Grandchildren', k.gks],
  ];
  let h = '';
  for (const [title, list] of rows) {
    if (!list.length) continue;
    h += `<div class="trow">${title ? `<div class="tlabel">${title}</div>` : '<div class="tlabel">&nbsp;</div>'}<div class="tnodes">${list.map((o, i) => card(o, o === v ? 'me' : o === sp ? 'spouse' : '')).join('')}</div></div>`;
  }
  $('tree-title').textContent = `The ${v.surname} family tree`;
  const body = $('tree-body');
  body.innerHTML = h;
  body.querySelectorAll('canvas[data-pid]').forEach((c) => {
    const id = +c.dataset.pid;
    const o = Game.villagers.find((x) => x.id === id) || Game.archive[id] || (Game.away.find((a) => a.id === id) || {}).data;
    if (o) drawPortrait(c, o.genes, o.stage === 'baby' && !Game.villagers.includes(o) ? 'child' : o.stage || 'adult', !Game.villagers.includes(o), o.look ? (typeof o.look === 'function' ? o.look() : o.look) : { tier: techTier(o.tech || 0), visor: o.visor });
  });
  body.querySelectorAll('.tnode').forEach((b) => b.addEventListener('click', () => {
    const o = Game.villagers.find((x) => x.id === +b.dataset.id);
    if (o) { selectVillager(o); focusVillager(o); openTree(o); }
  }));
  $('tree').hidden = false;
}

function openPost(v) {
  $('post-title').textContent = `Post ${v.first} to a friend`;
  $('post-code').value = exportVillager(v);
  $('post-copy').textContent = 'Copy code';
  $('post').hidden = false;
}

// ---------------------------------------------------------------------------
// Hover info for places
// ---------------------------------------------------------------------------
function namesInside(b) { return b.inside.map((id) => (Game.villagers.find((v) => v.id === id) || {}).first).filter(Boolean); }
function homeAt(wx, wy) {
  for (const h of World.homes) {
    const d = h.def, nx = (wx / 16 - d.cx - 0.5) / d.rx, ny = (wy / 16 - d.cy - 0.5) / d.ry;
    if (nx * nx + ny * ny < 1) return h;
  }
  return null;
}
function placeAt(wx, wy) {
  {
    const h = homeAt(wx, wy);
    if (h) {
      if (!h.built) {
        const p = Village.projects.find((x) => x.homeId === h.id);
        if (p) return [h.name, `A new hobbit-hole being dug: ${Math.round(p.prog * 100)}% done`, `Timber in the Store: ${Village.stores.wood} (${firewoodReserve()} kept back for hearths)`];
        return ['A grassy knoll', 'A fine spot for a new hobbit-hole, one day'];
      }
      const res = residentsOf(h);
      const inside = namesInside(h);
      const rp = Village.projects.find((p) => p.kind === 'retrofit' && p.homeId === h.id);
      const lines = [h.name, `${res.length} living here · larder: ${pantryTotal(h)} helpings`, h.chilly ? 'The hearth is cold: no timber!' : inside.length ? 'Inside: ' + inside.join(', ') : 'Nobody home just now'];
      if (h.neon) lines.push('Wired up: neon arch, sky-dish and a sun-glass panel');
      else if (rp) lines.push(`The tinkers are wiring it up: ${Math.round(rp.prog * 100)}% done`);
      lines.push('Click to look inside');
      return lines;
    }
  }
  const INFO = {
    inn: 'The finest ale this side of the river', bakery: 'Bread, apple pies and seed-cakes', brewhouse: 'Barley in, ale out',
    workshop: 'Timber, tools and new hobbit-holes', herbalist: 'Herbs drying in the rafters, remedies on the shelf',
    store: 'The Common Store: what the village makes, the village shares', barn: 'Barley and eggs are stored here', mill: 'Grinding barley into flour', mill2: 'The water wheel turns the millstones', windmill: 'Sails turning in the breeze, grinding barley into flour',
  };
  for (const p of Village.projects) {
    if (p.kind === 'home' || p.kind === 'retrofit') continue;
    const lot = World.lots[p.lot], [x0, y0, x1, y1] = lotBounds(lot);
    if (wx / 16 >= x0 && wx / 16 <= x1 + 1 && wy / 16 >= y0 && wy / 16 <= y1 + 1) return [projectLabel(p), `${p.kind === 'field' ? 'Being ploughed' : 'Under construction'}: ${Math.round(p.prog * 100)}% done`, lot.def.desc];
  }
  for (const k in World.buildings) {
    const b = World.buildings[k];
    if (wx > b.left + 6 && wx < b.left + b.w - 6 && wy > b.bottom - b.h + 12 && wy < b.bottom) {
      const inside = namesInside(b);
      const lines = [b.name, INFO[k] || (CIVIC_BY_KEY[k] ? CIVIC_BY_KEY[k].desc : '')];
      if (k === 'store' || k === 'barn' || k === 'storehouse') lines.push(`Food ${Village.foodTotal()} · barley ${Village.stores.grain} · timber ${Village.stores.wood} · ale ${Village.stores.ale}`);
      lines.push(inside.length ? 'Inside: ' + inside.join(', ') : 'Quiet inside');
      if (BUILDING_KIND[k]) lines.push('Click to look inside');
      return lines;
    }
  }
  for (const r of World.rifts) if (Math.abs(wx - r.x) < 22 && wy < r.y + 8 && wy > r.y - 56) {
    if (r.home) return ['The way home', 'A steady golden rift, with the lights of a city far beyond', 'The rift-folk are deciding whether to go'];
    return ['A rift', r.closing ? 'Flickering, closing up...' : r.sent < r.crew ? 'A tear between worlds. Someone is about to step through!' : 'A tear between worlds, humming like a hive', 'Tinkers salvage scrap here; curious folk come to gawk'];
  }
  for (const s of World.riftScars) if (dist(wx, wy, s.x, s.y) < 22) return ['A rift scar', 'Where a rift snapped shut. The grass glitters.', `${s.stock} loads of salvage left for the tinkers`];
  const tx = Math.floor(wx / 16), ty = Math.floor(wy / 16);
  const t = tileAt(tx, ty);
  if (t === T.WEED) return ['The pipe-weed field', World.season === 'winter' ? 'Bare until spring' : 'Leaf grows here for the village pipes'];
  if (t === T.FIELD) { const f = World.fields.find((f) => tx >= f.x0 && tx <= f.x1 && ty >= f.y0 && ty <= f.y1); return [f ? f.name.replace(/^the /, 'The ') : 'Barley', World.season === 'winter' ? 'Resting under the snow' : 'Barley for bread and ale']; }
  if (Math.hypot(tx - PARTY.cx, (ty - PARTY.cy) * 1.4) < 10) return ['The party field', Game.party.on ? 'A party is on!' : 'Parties most evenings (drop fireworks here to start one)'];
  if (Math.hypot(tx - STORY.x, ty - STORY.y - 1) < 3.5) { const st = anyStoryteller(); return ['The old story oak', st ? `${st.first} is telling stories!` : 'Little ones gather here for stories in the afternoon']; }
  for (const w of World.wells) if (Math.hypot(wx - w.x, wy - w.y + 14) < 18) return [w.name ? w.name.replace(/^the /, 'The ') : 'The village well', 'Cool water for thirsty folk'];
  if (Math.hypot(tx - 60.5, ty - 24.5) < 2) return ['Market stall', 'Folk fetch food for their larders here'];
  for (const p of World.pens) if (tx >= p.x0 && tx <= p.x1 && ty >= p.y0 && ty <= p.y1) {
    const n = World.animals.filter((a) => a.pen === p).length;
    return [p.name.replace(/^the /, 'The '), `${n} ${ANIMAL_INFO[p.kind].label.toLowerCase()} · ${p.tend > 0.5 ? 'well looked after' : p.tend > 0.2 ? 'could do with a visit' : 'wanting the herder'}`, p.kind === 'cow' ? 'Milk for the cheese-press' : p.kind === 'sheep' ? 'Wool for winter woollens' : 'They eat the scraps and dig for taters'];
  }
  for (const a of World.allotments) if (tx >= a.x0 && tx <= a.x1 && ty >= a.y0 && ty <= a.y1) return ['The allotments', 'Cabbages, carrots, taters, tomatoes and pumpkins for the Store', `${a.plots.filter((p) => p.stage === 4).length} rows ready to lift`];
  if (World.orchard2 && tx >= World.orchard2.x0 && tx <= World.orchard2.x1 && ty >= World.orchard2.y0 && ty <= World.orchard2.y1) return ['The south orchard', 'Young apple trees, planted for the growing village'];
  if (tx >= 5 && tx <= 33 && ty >= 5 && ty <= 15) return ['The orchard', `${World.orchard.reduce((s, o) => s + o.apples, 0)} apples on the trees · ${World.hives.reduce((s, o) => s + o.honey, 0)} combs of honey`];
  if (dist(wx, wy, World.henhouse.x, World.henhouse.y) < 40) return ['The henhouse', `${World.eggs} eggs waiting to be collected`];
  if (Math.hypot(tx - POND.cx, (ty - POND.cy) * 1.4) < 8) return ['The duck pond', 'Good fishing, and very good ducks'];
  if (tx >= 112) return ['The Eastwood', 'Timber, mushrooms and wild herbs'];
  return null;
}

// ---------------------------------------------------------------------------
// HUD, intro, starting
// ---------------------------------------------------------------------------
const WEATHER_WORD = { clear: 'Fair', cloudy: 'Overcast', rain: 'Rain', storm: 'Thunderstorm', snow: 'Snowing', fog: 'Misty' };
function updateHUD() {
  $('hud-day').textContent = `Day ${Game.day} · Year ${yearOf(Game.day)}`;
  $('hud-season').textContent = SEASONS[seasonIdx(Game.day)];
  $('hud-season').dataset.season = World.season;
  $('hud-time').textContent = fmtTime(Game.time);
  $('hud-meal').textContent = mealFor(Game.hour);
  $('hud-weather').textContent = Game.weather === 'clear' && Game.darkness > 0.4 ? 'Starry' : WEATHER_WORD[Game.weather] || 'Fair';
  $('hud-pop').textContent = Game.villagers.length + ' folk';
  $('hud-party').hidden = !Game.party.on;
  $('hud-party').textContent = { mayday: 'Mayday dance!', midsummer: 'Midsummer!', harvest: 'Harvest Feast!', yule: 'Yule!' }[Game.party.reason] || 'Party tonight!';
  if (Game.selected) renderPanel(false);
  if (!$('roster').hidden) renderRoster();
  if (!$('village').hidden && Game.villageTab === 'stores') { Game._vT = (Game._vT || 0) + 1; if (Game._vT % 8 === 0) renderVillage(); }
}

function openIntro(first) {
  $('intro').hidden = false;
  $('intro-go').textContent = first ? (hasSave() ? 'Return to Thistledown' : 'Enter Thistledown') : 'Back to the village';
  $('intro-new').hidden = !(hasSave() || !first);
  $('intro-confirm').hidden = true;
  Game.introOpen = true;
}
function closeModals() {
  if (Game.started) { $('intro').hidden = true; Game.introOpen = false; }
  closeInterior();
  $('roster').hidden = true; $('village').hidden = true; $('tree').hidden = true; $('post').hidden = true;
}

function startGame(fresh) {
  // straight to a new village in the original valley (the setup screen does this a stage at a time)
  if (fresh) { buildWorld(SEED); finishFreshVillage(); }
  $('intro').hidden = true;
  Game.introOpen = false;
  if (!Game.started) {
    Game.started = true;
    Sound.setEnabled(true); updateSoundBtn();
  }
}
