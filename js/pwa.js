'use strict';
// ---------------------------------------------------------------------------
// Installing, and staying current (Tycho's installable app, Tycho.pwa, with
// sw.js). Served over the web, the game can be installed, and plays offline;
// a fresh launch is always the latest deploy, and a game left open looks for
// a new one whenever it comes back to the foreground and every fifteen
// minutes. When a new one has taken over, the village is saved and the page
// loads onto it, unless the page is already that build. Opened from a file
// (index.html), none of this runs and the game plays as it always has.
// ---------------------------------------------------------------------------
const Pwa = {
  app: null,
  init() {
    this.app = Tycho.pwa.start({
      build: BUILD_INFO, askedKey: 'merryfolk.installAsked', updatedKey: 'merryfolk.updated',
      // (the browser's install pop-up on a tap, once, again after a few days if turned down)
      canAsk: () => true,
      onInstalled: () => { if (typeof toast === 'function') toast('Installed. Merryfolk is on your home screen.'); },
      onNewer: () => { try { if (Game.villagers && Game.villagers.length && Game.started) save(true); } catch (e) { /* nothing to keep yet */ } this.app.reload(); },
    });
  },
};
