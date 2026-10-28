'use strict';
// ---------------------------------------------------------------------------
// The service worker: makes the game installable and playable offline, but
// never stale. Tycho's worker (vendor/tycho/dist/tycho-sw.js) does the work:
// every request goes to the network first and the cache is used only offline.
// It keeps what index.html names (every script, the stylesheet, the manifest
// and its icons) and `files`: the talk packs, which the wizard's village
// loads by script tag later. __BUILD__ is replaced with the commit at deploy,
// so each deploy is a new worker (js/pwa.js loads it). Opened from a file,
// there's no worker, and the game plays as a page.
// ---------------------------------------------------------------------------
self.TYCHO_SW = {
  name: 'merryfolk',
  build: '__BUILD__',
  files: [
  'talk/ages.js',
  'talk/ages2.js',
  'talk/ages3.js',
  'talk/children.js',
  'talk/children2.js',
  'talk/children3.js',
  'talk/children4.js',
  'talk/core.js',
  'talk/family.js',
  'talk/family2.js',
  'talk/family3.js',
  'talk/family4.js',
  'talk/moods.js',
  'talk/moods2.js',
  'talk/moods3.js',
  'talk/moods4.js',
  'talk/pastimes.js',
  'talk/pastimes2.js',
  'talk/pastimes3.js',
  'talk/pastimes4.js',
  'talk/phrasing.js',
  'talk/phrasing_bye.js',
  'talk/phrasing_pass.js',
  'talk/phrasing_pass2.js',
  'talk/rift.js',
  'talk/rift2.js',
  'talk/rift3.js',
  'talk/rift4.js',
  'talk/seasons.js',
  'talk/seasons2.js',
  'talk/seasons3.js',
  'talk/seasons4.js',
  'talk/village.js',
  'talk/village2.js',
  'talk/village3.js',
  'talk/village4.js',
  'talk/wizard.js',
  'talk/wizard2.js',
  'talk/wizard3.js',
  'talk/wizard4.js',
  'talk/work.js',
  'talk/work2.js',
  'talk/work3.js',
  'talk/work4.js',
  ],
};
importScripts('vendor/tycho/dist/tycho-sw.js');
