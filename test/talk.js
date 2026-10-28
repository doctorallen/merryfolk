'use strict';
// The wizard's conversations: every talk pack loads, the content is sound,
// it all reaches Tyrell's Voice (each thread a Voice thread, each line's text
// a Cityspeak line), and a few hundred talks played at random behave, on Voice. The lint checks that every
// thread's beats exist and can be reached, every line key has a fallback,
// placeholders name real facts, lines fit a phone, nothing's said twice in a
// key, and the spelling is American. The fuzz walks talks across three villages
// and fails on page errors, unfilled {placeholders}, a line repeated within a
// talk, a talk that never ends, or talks that average under three beats.
const { launch, openGame, finish } = require('./lib');

(async () => {
  const failures = [];
  const browser = await launch();
  const { page, errors } = await openGame(browser, { width: 390, height: 844, mobile: true });
  const lint = await page.evaluate(async () => {
    Math.random = mulberry32(3);
    startGame(true);
    Game.mode = 'wizard';
    await loadAllTalk();
    const bad = [];
    // every fact name factsOf can produce, for placeholders
    const v0 = Game.villagers.find((v) => v.isGrown());
    const keys = new Set(Object.keys(factsOf(v0, { said: new Set() })).concat(['newsText', 'feelingX']));
    const BRITISH = /\b(colour|colours|favourite|favourites|neighbour|neighbours|grey|centre|theatre|travelled|travelling|realise|realised|organise|apologise|honour|humour|flavour|cosy|mum)\b/i;
    let n = 0;
    for (const key in TALK_LINES) {
      const rules = TALK_LINES[key];
      if (!key.startsWith('mix.') && !key.startsWith('sit.') && !rules.some((r) => !r.if && !r.not && !r.when)) bad.push(`line "${key}" has no fallback (a rule with no if)`);
      const seen = new Set();
      for (const r of rules) for (const t of r.text) {
        n++;
        if (typeof t !== 'string' || !t.trim()) { bad.push(`line "${key}" has an empty text`); continue; }
        if (seen.has(t)) bad.push(`line "${key}" says "${t.slice(0, 40)}" twice`); seen.add(t);
        if (t.length > 170) bad.push(`line "${key}" is too long for a phone (${t.length}): "${t.slice(0, 50)}…"`);
        // (the Grey in Gandalf's name, and in the Havens', is a name)
        const plain = t.replace(/Gandalf the Grey|Grey Havens|Grey Nuisance|Grey Rider/g, '');
        if (BRITISH.test(plain)) bad.push(`line "${key}" isn't American: "${plain.match(BRITISH)[0]}" in "${t.slice(0, 50)}"`);
        for (const m of t.matchAll(/\{([a-zA-Z0-9.:]+)\}/g)) {
          const k = m[1];
          if (k.startsWith('frag:')) { if (!FRAGS[k.slice(5)]) bad.push(`line "${key}" uses an unknown fragment {${k}}`); continue; }
          const base = k[0].toLowerCase() + k.slice(1);
          if (!keys.has(base)) bad.push(`line "${key}" uses an unknown fact {${k}}`);
        }
      }
    }
    // threads: beats exist, are reachable, and point at real lines
    const isKey = (x) => typeof x === 'string' && /^[a-z][\w-]*(\.[\w-]+)+$/.test(x);
    for (const id in THREADS) {
      const th = THREADS[id], B = th.beats;
      if (!th.situation && !B[th.start]) bad.push(`thread ${id}: no start beat "${th.start}"`);
      const reach = new Set();
      const walk = (b) => { if (reach.has(b) || !B[b]) return; reach.add(b); for (const g of B[b].go || []) { const tos = typeof g.to === 'function' ? [] : Array.isArray(g.to) ? g.to.map((x) => (typeof x === 'string' ? x : x.to)) : [g.to]; for (const t of tos) { if (t && t !== 'end' && !B[t]) bad.push(`thread ${id}: beat "${b}" goes to missing "${t}"`); if (t) walk(t); } } };
      if (th.situation) { for (const k in SITUATIONS) if (SITUATIONS[k].thread === id) for (const ap in SITUATIONS[k].aps) for (const o of SITUATIONS[k].aps[ap].out) { if (!B[o]) bad.push(`situation ${k}: ${ap} → missing beat "${o}"`); walk(o); } }
      else walk(th.start);
      for (const b in B) {
        if (!reach.has(b)) bad.push(`thread ${id}: beat "${b}" can't be reached`);
        const bt = B[b];
        for (const x of [bt.line, bt.notice]) if (x && !TALK_LINES[x]) bad.push(`thread ${id}: beat "${b}" uses missing line "${x}"`);
        if (!bt.line && !bt.text && !bt.end && !(bt.go && bt.go.length)) bad.push(`thread ${id}: beat "${b}" says nothing and goes nowhere`);
        for (const g of bt.go || []) for (const x of [g.say, g.label]) if (isKey(x) && !TALK_LINES[x]) bad.push(`thread ${id}: a choice in "${b}" uses missing line "${x}"`);
      }
      if (th.open) for (const ap in th.open) if (isKey(th.open[ap]) && !TALK_LINES[th.open[ap]]) bad.push(`thread ${id}: opener uses missing line "${th.open[ap]}"`);
    }
    // on Voice: every thread, and every text of every line
    if (!(typeof Shell !== 'undefined' && Shell.on)) bad.push('the minds (Tyrell) are not running, so the talks are not on Voice');
    else {
      for (const id in THREADS) if (!Shell.w.voice.threads.has(id)) bad.push(`thread ${id} isn't one of Voice's`);
      // (the natters' own lines are Cityspeak's too, with the minds: bree.js)
      const natter = typeof Natter !== 'undefined' ? Natter.lineCount : 0;
      if (Shell.w.cityspeak.lines.length - natter !== n) bad.push(`${n} lines' texts, but ${Shell.w.cityspeak.lines.length - natter} lines in Cityspeak (besides the natters' ${natter})`);
    }
    return { bad: bad.slice(0, 40), more: Math.max(0, bad.length - 40), lines: n, threads: Object.keys(THREADS).length, keys: Object.keys(TALK_LINES).length, packs: TalkPacks.loaded.size };
  });
  for (const b of lint.bad) failures.push('lint: ' + b);
  if (lint.more) failures.push(`lint: and ${lint.more} more`);

  const fuzz = await page.evaluate(async () => {
    const out = { talks: 0, beats: 0, bad: [], ended: 0, voice: 0 };
    for (const seed of [3, 7, 11]) {
      Math.random = mulberry32(seed);
      startGame(true);
      Game.mode = 'wizard'; document.body.classList.add('wizmode'); wizardBegin();
      for (let i = 0; i < 2000 && Game.wizard.phase === 'coming'; i++) simulate(0.5);
      // one village has rift-folk from the start, so their talk is played too
      if (seed === 11) { devAct('rift'); for (let i = 0; i < 200; i++) simulate(0.5); devAct('rift'); }
      for (let day = 0; day < 3; day++) {
        for (let i = 0; i < 700; i++) simulate(0.5);
        const folk = Game.villagers.filter((v) => !v.inside && v.stage !== 'baby' && !v.leaving);
        for (let k = 0; k < 22 && folk.length; k++) {
          const v = folk[Math.floor(Math.random() * folk.length)];
          const w = Game.wizard; w.fx = v.x + 14; w.fy = v.y;
          if (v.task && v.task.a.id === 'chat') continue;
          startTalk(v);
          const T = Play.talk;
          if (!T || !T.F) { if (Play.talk) endTalk(); continue; }
          out.talks++;
          if (T.voice) out.voice++;
          let guard = 0;
          while (Play.talk === T && guard++ < 40) {
            const bs = [...document.querySelectorAll('#sheet-choices .choice:not(:disabled)')];
            const pick = bs.filter((b) => !b.classList.contains('foot'));
            const b = pick.length && Math.random() < 0.9 ? pick[Math.floor(Math.random() * pick.length)] : bs.find((x) => /Good day/.test(x.textContent)) || bs[0];
            if (!b) break;
            b.click();
          }
          if (Play.talk === T) { out.bad.push(`a talk with ${v.first} never ended`); endTalk(); }
          out.beats += T.depth || 0;
          const said = new Map();
          for (const l of T.log) {
            if (/\{[a-zA-Z0-9.:]+\}/.test(l.text)) out.bad.push(`unfilled placeholder: "${l.text}"`);
            if (!l.text || !l.text.trim()) out.bad.push('an empty line was said');
            if (l.who === 'them' && l.text.length > 12) { if (said.has(l.text)) out.bad.push(`${v.first} said "${l.text.slice(0, 40)}" twice in one talk`); said.set(l.text, 1); }
          }
        }
      }
    }
    return out;
  });
  for (const b of [...new Set(fuzz.bad)].slice(0, 20)) failures.push('fuzz: ' + b);
  const depth = fuzz.talks ? fuzz.beats / fuzz.talks : 0;
  if (depth < 3) failures.push(`fuzz: talks average only ${depth.toFixed(1)} beats`);
  if (fuzz.voice < fuzz.talks) failures.push(`fuzz: only ${fuzz.voice} of ${fuzz.talks} talks ran on Voice`);
  for (const e of errors) failures.push('page error: ' + e);
  console.log(`talk: ${lint.packs} packs, ${lint.threads} threads, ${lint.keys} line keys, ${lint.lines} lines; ${fuzz.talks} talks (${fuzz.voice} on Voice) averaging ${depth.toFixed(1)} beats`);
  await browser.close();
  finish('talk', failures);
})();
