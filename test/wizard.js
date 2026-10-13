'use strict';
// Playing as the wizard, headless on a phone: the wagon comes in, he walks
// over to a hobbit and talks (every option once), joins a natter, tells a
// tale under the great tree, lights the fireworks on his first night, sleeps
// till morning, and the save survives a reload. No page errors, nobody stuck.
const { launch, openGame, outDir, finish } = require('./lib');
const path = require('path');

(async () => {
  const failures = [];
  const browser = await launch();
  const { page, errors } = await openGame(browser, { width: 390, height: 844, mobile: true });
  const r = await page.evaluate(async () => {
    const out = { bad: [] };
    Math.random = mulberry32(9);
    startGame(true);
    Game.mode = 'wizard'; document.body.classList.add('wizmode'); wizardBegin(); setSpeed(1);
    for (let i = 0; i < 2000 && Game.wizard.phase === 'coming'; i++) simulate(0.5);
    if (Game.wizard.phase !== 'here') out.bad.push('the wagon never drew up');
    // walk over to the nearest grown-up and talk
    const w = Game.wizard;
    const v = Game.villagers.filter((o) => !o.inside && o.isGrown()).sort((a, b) => dist(a.x, a.y, w.fx, w.fy) - dist(b.x, b.y, w.fx, w.fy))[0];
    wizApproach(v);
    for (let i = 0; i < 4000 && !Play.talk; i++) simulate(0.5);
    if (!Play.talk) out.bad.push(`never reached ${v.first} to talk`);
    else {
      const click = (text) => { const b = [...document.querySelectorAll('#sheet-choices .choice')].find((x) => x.textContent.includes(text)); if (b) b.click(); return !!b; };
      for (const t of ['How are you', 'on your mind', 'Heard any news']) if (!click(t)) out.bad.push(`no "${t}" option`);
      click('Pass the time'); click('warm');
      click('Give them'); document.querySelector('#sheet-choices .choice').click();
      out.lines = Play.talk ? Play.talk.log.length : 0;
      click('Good day');
      if (Play.talk) out.bad.push('the talk did not end');
      if (Game.speedIdx === 0) out.bad.push('the game stayed paused after the talk');
    }
    // a tale
    while (Game.hour < 13) simulate(0.5);
    Game.raining = false;
    const s = wizardTaleSpot();
    wizWalkTo(s.x, s.y, { kind: 'tale' });
    for (let i = 0; i < 4000 && !Sheet.isOpen(); i++) simulate(0.5);
    if (!Sheet.isOpen()) out.bad.push('the tale picker never opened');
    else {
      document.querySelector('#sheet-choices .choice').click();
      // then its moral
      if (Sheet.isOpen()) document.querySelector('#sheet-choices .choice').click();
    }
    let listened = 0;
    for (let i = 0; i < 480; i++) { simulate(0.5); listened = Math.max(listened, Game.villagers.filter((o) => o.task && o.task.a.id === 'wizard_tale' && o.task.phase === 'do').length); }
    out.listened = listened;
    if (listened < 3) out.bad.push(`only ${listened} came to hear the tale`);
    // the first night's party and his fireworks
    while (Game.hour < 22.5) simulate(0.5);
    if (Game.wizard.showDay !== Game.day) out.bad.push('no fireworks on his first night');
    // sleep till morning
    while (Game.hour < 23.9) simulate(0.5);
    sleepTillMorning();
    await new Promise((res) => { const t = setInterval(() => { if (!Play.skipping) { clearInterval(t); res(); } }, 50); });
    if (Game.hour < 6.9 || Game.hour > 7.2) out.bad.push(`woke at ${Game.hour.toFixed(2)}`);
    // the save
    save(); const before = JSON.stringify([Game.mode, Game.wizRel, Game.wizMet, Game.wizard.leave]);
    load(); const after = JSON.stringify([Game.mode, Game.wizRel, Game.wizMet, Game.wizard.leave]);
    if (before !== after) out.bad.push('the wizard\'s state changed across a reload');
    for (let i = 0; i < 600; i++) simulate(0.5);
    out.day = Game.day;
    return out;
  });
  await page.screenshot({ path: path.join(outDir(), 'wizard-phone.png') });
  for (const b of r.bad) failures.push(b);
  for (const e of errors) failures.push('page error: ' + e);
  console.log(`wizard: talked ${r.lines || 0} lines, ${r.listened} heard the tale, day ${r.day}`);
  await browser.close();
  finish('wizard', failures);
})();
