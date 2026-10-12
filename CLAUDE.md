# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Merryfolk is a browser artificial-life game (a *Creatures*-style hobbit village) in plain JavaScript: no build step, no dependencies, no modules. `README.md` describes every feature in detail, so read the relevant section before changing a system, and keep it in step when behaviour changes.

## Commands

```sh
python3 -m http.server 8000                         # play at http://localhost:8000 (or just open index.html)
npm ci                                              # once per clone: puppeteer-core and typescript (dev only)
npm test                                            # everything CI runs: check, golden, smoke, valley
sh test/check.sh                                    # syntax, every script listed in index.html, tsc
npx tsc -p .                                        # the type check alone (files marked // @ts-check)
node test/golden.js --update                        # re-record test/golden.json after an intended world-gen change
git config core.hooksPath .githooks                 # once per clone: the pre-commit hook stamps js/version.js
```

The tests live in `test/` and run against the installed Chrome (set `CHROME` if it isn't at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`). `golden.js` hashes the generated world for three classic seeds and a valley, so any change to world generation must be intended and re-recorded; `smoke.js` plays two days on desktop and phone, checks the numbers stay finite and nobody is stuck, and round-trips the save; `valley.js` checks every building in a planned valley is reachable. There is no linter. CI (`.github/workflows/pages.yml`) runs `npm test` and deploys `main` to GitHub Pages only when it passes. Every push to `main` goes live.

Verify changes by driving the game headlessly with `puppeteer-core`: `test/lib.js` has `launch()` and `openGame(browser, { width, height, mobile })`, which open a fresh game and collect every page error, and the test scripts show the idiom. One-off scripts go in a scratch directory (`test/out/` is gitignored), and never install packages into the repo beyond `package.json`. The `qa-playtester` agent (`.claude/agents/qa-playtester.md`) has the full recipe. The essentials are:

- Wait for `typeof Game !== 'undefined' && Game.villagers.length > 0`, then call `startGame(false)`.
- `simulate(0.5)` advances half a game minute, so 2880 calls make one day.
- `save()` / `load()` round-trip the save.
- Set `Game.zoom` (steps 2/4/6/8), `Game.cam.x/y` and `Game.speed = 0` for screenshots.
- Wait for `!World.paintJob` before judging the ground, which paints in the background.
- Catch every `pageerror`.

For visual changes, look at the screenshots, and compare against a `git archive HEAD` copy for performance or regressions.

## Architecture

**Globals and load order.** Every file is a classic script sharing one global scope: `Game` (clock, villagers, player state), `World` (map, statics, homes, lots), `Village` (stores, projects), `Sound`, `FX`, `Light`. Order in `index.html` matters, with `util.js` first and `main.js` last. A new file needs a `<script>` tag there.

**Hooks and patches.** Later files add to earlier ones through two helpers in `util.js`. `addHook(name, fn)` registers a function for one of the moments in `Hooks`: `beforeHour` and `onHour` (from `onHour` in `main.js`, before and after the clock's own work), `newVillage` and `afterNewVillage` (either side of founding). `patch(obj, key, make, label)` replaces a method or function with one that wraps the original, as in `patch(Villager.prototype, 'speak', (speak) => function (...) { ...; return speak.apply(this, arguments); }, 'manner')`, and records it in `PATCHES`, which the dev drawer's Tools tab lists. A few global functions are still reassigned outright (`name = function`); before editing a function, grep for its patches and reassignments, or the change may be overridden. `fixes2.js` is a file of such patches from a playtest.

**Adding a feature file.** Create `js/<name>.js` beginning with `'use strict';` and a banner comment saying what it does; add its `<script>` tag to `index.html` in the right group, after every file it uses (`test/check.sh` fails on a file that isn't listed); add a row to the file table at the end of `README.md` and describe the feature in the relevant section; hook into the clock and founding with `addHook`, and wrap existing behaviour with `patch`; keep any new persistent state in `Game` and register it with `registerField(key, default, opts)` (`save.js`) so it is saved and loaded, or add it to `Villager.serialize` and the constructor if it belongs to a villager; make anything placed in the world deterministic from the seed or an id; then run `npm test`, and re-record the golden hashes only if world generation was meant to change.

**Units.** Positions are world pixels, with `TILE` = 16 and the map `MAP_W`×`MAP_H` tiles (128×96). Tile kinds are in `T` (`world.js`). Villager logic runs in game minutes.

**Loop.** `frame()` (`main.js`) runs `simulate(dt)` in steps of at most 0.5 game minutes, then `render()`. Each villager's update runs in its own try/catch: an error drops that villager's task, is noted on `Game.lastError` (the dev drawer shows a red `!`), and holds off the routine autosave for a game hour. Hourly and daily work (`onHour` with its hooks, `dailySociety`, `checkSeason`) fires from `simulate`.

**Saves rebuild the world from its seed.** `save()` (`save.js`) writes player and villager state to `localStorage`, plus the world-gen settings (`World.gen`), but not the map. Plain fields of `Game` are listed in `GAME_FIELDS` (features add theirs with `registerField`); anything that needs a transform is written by hand in `save()` and `load()`. `load()` regenerates the valley through `buildWorldSteps` (`world.js`, a generator that yields a line per stage for the setup screen). It then replays builds (`replayBuilds`) and town lots (`loadTown`), and re-furnishes homes. So anything placed at world generation must be deterministic from the seed, or from ids such as a home's id (`mulberry32(...)`, `hash2`), never `Math.random`. Anything added mid-game must be saved explicitly, or recreated by the replay path. New home plots go through `openLot` (`town.js`).

**Village life.** Villagers (`villager.js`) have drives and body chemistry, and choose actions from the catalogue in `actions.js` by scored relief times learned habit weights; the dev-mode Brain tab (`` ` ``) explains each choice. `society.js` handles the Common Store, trades, courtship, births and homes, and `town.js` handles town planning and building projects.

## Rendering and art

- **Two canvas pixels per world pixel.** `RS`/`GS` = 2 in `util.js`. The art style is chunky top-down pixel art: each world pixel is a square block.
  - Most sprites are drawn at world size, then doubled pixel for pixel by `hd()`/`blit()` (`sprites.js`).
  - Villagers alone are drawn natively at double resolution on a half-pixel grid (`folkCanvas`), and carry `.hd`.
- **Outlines.** `outlineCanvas()` (`util.js`) rings a sprite in a darkened shade of its own colours. The colour argument is ignored.
- **Ground.** The ground lives in `Ground` (`world.js`): chunks of 32×32 tiles, each its own canvas, made when first seen (a flat sketch at once, the real painting nearest the camera first, a few milliseconds a frame in `stepPaint`) and let go when out of sight longest (`CHUNK_MAX`). `paintGroundGen` paints a rectangle one colour per world pixel, then the hobbit-hole hills (`paintMound`), bridges and flower patches, and a final pass makes everything chunky and dithers it with a 4×4 Bayer pattern (`BAYER4`, `DITHER_STEP`). Everything it draws is placed by absolute coordinates, so chunks join without seams: keep it that way (no decisions that depend on the rectangle's edges).
  - After changing tiles, call `repaintRect` or `refreshGround`. To draw onto the ground, use `Ground.draw`.
  - `MAP_W`/`MAP_H` are variables; `setMapSize` (before building a world) remakes every map-sized array.
- **Scenery.** Statics (trees, bushes, buildings, props) carry a `gen` recipe and are re-made per season through `seasonalImage` (cached).
  - Long grass, tall grass, weeds and reeds are entries in `World.grass`, drawn by `drawTuft` (`nature.js`). Their `v` field selects the kind:
    - 0–7: grass and reeds
    - from `WILD_V` (100): the wild plants
    - from `TALL_V` (300): the tall grass
- **Draw order.** Everything standing is y-sorted in `render()`, so tall grass in front of a villager covers them. Statics and grass come from `Scene` buckets (8×8 tiles) under the camera, not a scan of the whole map; the buckets rebuild when a list's length changes and once a second.
- **Light.** Night light is stepped pools (`Light.render`, `fx.js`), and the house interiors (`interior.js`) do the same. Avoid smooth gradients in world art.
- **Trees and bushes.** These are built procedurally per seed (`makeTree`, `makeBush`) and placed by habitat (`nature.js`: `plantWoods`, `plantNature`, `plantWildflowers`, `plantHill`) using soil, moisture, shade and settlement data from `terrain.js`.

## Conventions

- Comments and in-game text are plain British English prose. Match the surrounding density and voice.
- Commits go straight to `main`. Subjects are short sentence-case statements of the player-visible change (for example "Hobbit-hole hills grow wild on top"). The pre-commit hook amends `js/version.js` itself.
