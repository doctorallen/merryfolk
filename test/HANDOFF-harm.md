# Harm in Merryfolk: where it stands (handoff)

Unfinished work, handed over on 2026-10-28. Merryfolk's `harm` branch
(from main at a1c999f) brings in the three things Tycho's harm design has
for Merryfolk (`vendor/tycho/docs/harm.md`, "Each game"): the body on
Athelas, scuffles and pranks, all on Morgul with lethality 0. Tycho's
`mf-harm` branch (9d5720b, which `vendor/tycho` names) has the engine's
part, merged with Tycho's main up to 0c155a3. Neither is merged to main.

## What's done

### 1. The body on Athelas (`js/body.js`)

villager.js's chemistry is Athelas courses while the minds are on Tyrell
(without them, villager.js runs it as it always did):

- **ale**: a level falling at 0.05 an hour; its phases are the bands
  (well in drink past 0.6, tipsy past 0.45, mellow below), each as long as
  the level takes to fall through it, entered at the band a pint leaves them
  in (a phase's `if`, new in Athelas). The pint in hand counts as it's drunk
  (`task.data.ale`, added into the view) and is told to the minds once it's
  down (`Body.drink`, also when the task is put down part way).
- **a cold**: coming on, at its worst, the sniffles, mending: the germs'
  rise (0.09 an hour) and fall (0.035 × (0.5 + hardiness)), the falling
  phases hastened half an hour for each half hour asleep (`Body.rest`), 70
  hours' immunity after.
- **the flu**: laid up 1.6 to 2.6 days (illness.js's roll on catching a
  cold still decides it), then getting over it and mending as a cold mends;
  soup hastens it four hours.
- **a toadstool**: a level falling at 0.04 an hour: queasy past 0.5 (no
  eating), a tummy-ache past 0.4 (hunger at 0.3), poorly past 0.35,
  settling.
- **a sprain**: a day's hobble (work and play weighed at 0.3; the half-pace
  walk stays illness.js's).
- Being poorly is the phases' `rates` (tired 1.6) and `weigh` (everything
  but sleep and a remedy at 0.4), so `mindRates` and `score()` leave it out
  when the body is on Athelas.
- `v.chem` and `v.illness` are views: each level worked out from where its
  course has got to, and a write (a toadstool nibbled, a toast, the dev
  drawer) becomes an affliction or a cure. A remedy (`Body.remedy`) does
  what villager.js's did: a cold at its worst or the sniffles mends on from
  what 0.7 off the germs leaves; one coming on or mending is gone, with 30
  hours kept from another; a toadstool is gone.
- Old saves: a village whose bodies weren't the minds' carries each
  villager's chemistry over as they join (`Body.adoptBody`, `Game.bodyMinds`).
- Catching things stays the game's (space: contagion, the chill), and so do
  the aches. Without the minds nothing changed.
- The new actions (scuffle, knocked flat, seeing to bruises, prank) are
  marked `instinct: false` and draw no taste in `genetics.js`, so a seed
  founds the same village before and after (without it the four extra draws
  per villager changed every founding; `test/harm/founding.js` checks it).
  This came last, and only the body-only season below was run after it.

### 2. Scuffles (`js/scuffle.js`, the squabble and scuffle kinds in `js/bree.js`)

- A squabble's sour turn can escalate to a scuffle (Bree's escalation, times
  the squabble kind's own `escalation`, new in Bree: `Scuffle.escalation`,
  `SCUFFLE.rate` 0.35 × (0.4 + temper × 1.2); children only with children,
  never an elder, a toddler, a sweetheart, a spouse or one's own parent,
  never indoors).
- A scuffle is Morgul's fight by numbers (`MIND_MORGUL`: six blows at most,
  a fist 0.055 give or take half, someone yields once 0.15 has landed,
  walking off 0.4, might from bravery, temper and hardiness). Wounds are
  Athelas courses: a bruise, a bloody nose from 0.078 (a day or two).
  Nobody goes down for long, nobody dies.
- On screen it's the bridge's `scuffles` beats: the two square up (the
  `tussle` pose, `Scuffle.look`), each blow a lunge and a stagger, stars for
  a heavy one, a drop or two of red for a bloody nose, words a moment after
  (`harmLater`, game time). A blow every five to eight minutes.
- Onlookers feel it (`saw_scuffle`) and think less of whoever started it;
  the chronicle hears of it (so gossip carries it); someone may step in
  (Bree's stepper); someone who likes the hurt one (family, a friend over
  0.35, sometimes the herbalist) comes round at 10, 14 or 18 to see to it
  (`tend_hurt`, Athelas's `tend`, the better for herbalism).
- Fixed on the way: a scuffle used to end at once as "parted" (the natter
  task giving way to it ended the exchange), so `begin` puts both in the
  scuffle task directly, Bree's `gone()` counts a fighter whose minds have
  them scuffling, and `releaseTask` only ends a partner's task of the same
  action.

### 3. Pranks (`js/mischief.js`)

- The `prank` action (tagged `harm`, chosen by Tyrell like anything else):
  someone with a grudge (from Bree's grudges and Fellowship's regard) or a
  wicked streak (quick wits and temper, little merriness) sets a tripwire
  across the other's path or by their door, a snare on their way into the
  village, or slips a bad mushroom into their pot while nobody's home.
  Capped at one a day in the village and three days between one person's.
- Traps and taints are Morgul's (means declared through the bridge's
  `means`); every trap is at a place of its own (`mf_spot_<x>_<y>`) and is
  the game's to spring through the bridge's `traps` (regions: the whole
  world); `Mischief.step` sees someone walk into one, they stumble and sit
  down hard (the `stumble` pose) and walk on a sore ankle at three quarters
  pace for a few hours. A taint is a queasy afternoon (a poison course).
  Traps are drawn small (`Mischief.draw`): a cord between two pegs, a loop.
- Suspicion is Morgul's, and needs evidence: the game tells Morgul who was
  about when the trap was set (a trap's `about`, new in Morgul: anyone within
  180 px who didn't see it), and whoever's caught suspects one of them, or
  whoever they bear a grudge.

### Elsewhere

- `js/villager.js`, `js/illness.js`, `js/shell.js`, `js/converse.js`,
  `js/main.js`, `js/fx.js`, `index.html`, `talk/core.js` (the wizard's lines
  for scuffles and pranks heard of), `README.md` and `CLAUDE.md` are updated.
- `test/season.js` counts the body (spells: count, finished length, share
  of time) and harm (scuffles, blows, wounds, tending, traps set and
  sprung, stews spiked, suspicion).

## What's left

1. **The final runs.** A season (six seeds, three days) and a year (four
   seeds, twelve days), harm on and body only, on the code as it is (with
   the founding fix). Only the body-only season has been run on it. The
   year numbers below come from runs before the founding fix, so their
   villages differ from main's.
2. **The colds** (below): see whether a year still has fewer colds once
   the villages are the same; `test/harm/cold-sources.js` on both.
3. **Scuffles in the wild.** None in any measured run (six village-seasons
   and four village-years with harm on). Forced, about one squabble in nine
   comes to blows (15 of 134, `test/harm/logs/squabbles-0.35.log`); main has
   about five squabbles a village-year, so expect one every couple of
   village-years. The year with harm on that saw none was run before the
   scuffle fixes. Check a long run; raise `SCUFFLE.rate` if it's too rare.
4. **Taints in the wild.** No bad mushroom has been slipped into a pot in
   any measured run (tripwires and snares only). The taint needs a grudge of
   0.25, knowing their home, nobody in, and a 40% draw
   (`Mischief.plan`); check it can happen, or loosen it.
5. **`test/minds.md`**: a section with the season and year tables before
   and after, as the minds' and the natters' moves have (a start is below).
6. **Speed**: a day's CPU before and after, back to back (a profile had
   body.js at about 6% of a day; one back-to-back pair on a busy machine
   had the branch about 13% slower: not confirmed).
7. **The full `npm test` again** after the founding fix (below).
8. Split the work-in-progress commit as wanted, and merge Tycho's `mf-harm`
   first (Merryfolk's `vendor/tycho` must point at a commit on Tycho's main
   before Merryfolk's `harm` is merged).

## The numbers so far

Before is main (a1c999f, Tycho 7b52461) with this branch's
`test/season.js`. Spell lengths are pooled over the seeds (every spell
counts once; `test/harm/pooled.js`), since a season has a handful of colds.

### The courses given on purpose (same villagers, matched founding)

`test/harm/body-given.js`, seeds 1 to 4: at six on the first morning eight
grown-ups catch a cold, four nibble a toadstool, three are laid up with the
flu for two days (`test/harm/logs/body-given-*.log`).

| | before | after |
|---|---:|---:|
| colds (of 32) that turned to flu | 3 | 3 (the same three) |
| a cold, uncured: hours with it | 27.7 (29) | 28.0 (27) |
| hours sniffling | 15.1 | 15.2 |
| hours asleep while poorly | 9.3 | 9.0 |
| a toadstool: hours poorly (16) | 6.2 each | 6.2 each |
| the flu (12): hours laid up | 38.8 | 36.3 |
| hours with germs | 49.4 | 48.8 |
| hours sniffling | 41.3 | 39.7 |

Person by person the colds match within an hour or two (Barley 36/21 h
before, 35/18 after; Lobard 37/22, 39/20). A pint lasts its level over 0.05
an hour in both (drink spells pooled: 4.0 h before, 4.0 to 4.2 after).

### A season (six seeds, three days)

| | before | body only (final code) | harm on (before the founding fix) |
|---|---:|---:|---:|
| folk at the end | 27.67 | 28.17 | 27.83 |
| meals per villager-day | 2.45 | 2.45 | 2.44 |
| mood, mean | 0.65 | 0.64 | 0.64 |
| friendships formed | 15 | 15.33 | 11.83 |
| natters begun | 18.83 | 16.67 | 14.17 |
| good natters | 13 | 11 | 7.33 |
| pints drunk (all six) | 135 | 161 | 131 |
| hours a drink lasts (pooled) | 3.7 | 4.0 | 3.8 |
| colds (all six) | 8 | 11 | 6 |
| a cold, hours (pooled) | 27.3 (3) | 12.8 (4) | 10.7 (5) |
| flu (all six) | 1 | 1 | 0 |
| toadstools (all six) | 6 | 3 | 1 |
| sprains (all six) | 3 | 3 | 2 |
| nursed (all six) | 12 | 13 | 6 |
| tripwires and snares set, sprung | | | 7, 6 |
| suspected someone, rightly | | | 5, 3 |
| scuffles | | 0 | 0 |

A season's finished colds are too few to read their length from (a spell
still running at the end isn't counted, which cuts short ones in). Natters
ran 14 to 26 a seed before and 13 to 23 body-only; the harm-on season's
lower natters were on different villages (before the founding fix).

### A year (four seeds, twelve days; before the founding fix, so other villages)

| | before | body only | harm on (earlier scuffle code) |
|---|---:|---:|---:|
| folk at the end | 37.75 | 42 | 38 |
| mood, mean | 0.61 | 0.64 | 0.63 |
| friendships formed | 117.5 | 144 | 109 |
| natters begun | 115.75 | 106.5 | 85.5 |
| pints drunk (all four) | 622 | 559 | 577 |
| hours a drink lasts (pooled) | 4.0 | 4.1 | 4.2 |
| colds (all four) | 65 | 38 | 41 |
| a cold, hours (pooled) | 27.6 (43) | 18.7 (32) | 23.9 (28) |
| sniffling, hours (pooled) | 22.1 | 12.2 | 19.8 |
| flu (all four) | 16 | 7 | 13 |
| laid up with flu, hours (pooled) | 44.4 | 42.1 | 43.6 |
| toadstools, hours poorly (pooled) | 5, 3.1 | 6, 5.2 | 6, 4.1 |
| sprains | 10 | 16 | 9 |
| nursed | 38 | 41 | 46 |
| soup brought | 32 | 6 | 17 |
| tripwires and snares set, sprung | | | 19, 14 |
| suspected someone, rightly | | | 11, 6 |
| scuffles, stews spiked | | 0, 0 | 0, 0 |

Pranks: about one a village-season and five a village-year; three in four
traps catch someone; suspicion lands right about half
the time.

### Which differ, and by how much

- The courses themselves: the same within an hour or two (the table given
  on purpose).
- Colds a year: 65 before against 38 and 41 (about 40% fewer), shorter
  (18.7 and 23.9 hours pooled against 27.6), and fewer flu (7 and 13
  against 16), soup with them. But those years ran on other villages (the
  founding differed), and the one matched run, the body-only season, has
  colds at 11 against 8.
- Toadstools: 3.1 hours poorly before, 4.1 to 5.2 after in the years. The
  same toadstool given on purpose is 6.2 hours in both, so the difference is
  how many got a remedy early, with five or six cases a run.
- Natters: lower in the unmatched runs (85 against 116 a year with harm
  on), within the spread in the matched season. Check in the final runs.

## The colds: what I suspected

Most colds come from the daily chill (`dailySociety`'s roll, by season and
hardiness), not from each other: in two of main's years
(`test/harm/logs/cold-sources-before-partial.log`) 19 of 23 came from the
chill and 4 from someone poorly at a social do, and none from a natter.
So the count is mostly the villagers' hardiness and how many are open to a
cold (not ill and not immune) on the day, and the founding differing
changed every villager's hardiness. My guess is that the drop was the
villages, not the courses: the courses match on the same people, and the
matched season shows no drop. Things I checked that match main: immunity
(70 hours after a cold or the flu, 30 after a remedy that ended one), the
flu roll on catching, contagion's tests (`isSick`, `germs === 0`), the
remedy (main's remedies almost always land on a cold past its peak:
12 of 15 in two of its years). One real difference: on main a remedy
taken by someone without a cold (a remedy left out, "Yuck! I wasn't even
poorly") left their immunity at 0.6, keeping a cold off 30 hours; on the
branch only a remedy that ends a cold does that (`Body.remedy`). That
would give the branch more colds, not fewer, but it's a change to put
back or keep on purpose. Not yet looked at: whether the sick are
out and about as much (`cold-sources.js` counts hours poorly out of doors
and at something social, and stopped before the branch's turn).

## Re-running on a Mac

```sh
# the branch, with Tycho's mf-harm
git clone https://github.com/doctorallen/merryfolk && cd merryfolk
git checkout harm && git submodule update --init && npm ci
export CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"   # if it isn't there

# main, beside it, for "before", with this branch's season runner
git worktree add ../merryfolk-main a1c999f
(cd ../merryfolk-main && git submodule update --init && ln -s ../merryfolk/node_modules node_modules)
cp test/season.js ../merryfolk-main/test/season.js

# a season and a year, before (already kept as test/season-harm-before*.json)
(cd ../merryfolk-main && node test/season.js --record harm-before --seeds 1,2,3,4,5,6 --days 3)
(cd ../merryfolk-main && node test/season.js --record harm-before-year --seeds 1,2,3,4 --days 12)

# after, harm on
node test/season.js --record harm-after --seeds 1,2,3,4,5,6 --days 3
node test/season.js --record harm-after-year --seeds 1,2,3,4 --days 12
# after, body only: SCUFFLE.rate 0 (js/scuffle.js) and MISCHIEF.perDay 0 (js/mischief.js), then
node test/season.js --record harm-body --seeds 1,2,3,4,5,6 --days 3
node test/season.js --record harm-body-year --seeds 1,2,3,4 --days 12
# (put the two numbers back afterwards)

# compare, and pool the spells
node test/season.js --compare harm-before harm-after
node test/season.js --compare harm-before-year harm-after-year
node test/harm/pooled.js harm-before harm-after harm-before-year harm-after-year

# the courses given on purpose, and where colds come from
node test/harm/body-given.js ../merryfolk-main 1,2,3,4 > /tmp/given-before.log
node test/harm/body-given.js . 1,2,3,4 > /tmp/given-after.log
node test/harm/body-given-sum.js /tmp/given-before.log /tmp/given-after.log
node test/harm/cold-sources.js ../merryfolk-main 1,2,3,4 12
node test/harm/cold-sources.js . 1,2,3,4 12

# the same village founded in both (see the diff command in the script)
node test/harm/founding.js ../merryfolk-main /tmp/main.txt && node test/harm/founding.js . /tmp/harm.txt

# how often a squabble comes to blows, and the screenshots (test/out/)
node test/harm/squabbles.js 0.35 160
node test/harm/shots.js
```

A season is eighteen simulated days and a year forty-eight, at a few
seconds a day on a quiet machine. `test/harm/earlier/` keeps the runs from before the founding fix
(`season-harm-body3*`: body only; `season-harm-all2*`: harm on, before the
scuffle fixes; `season-harm-final`: harm on, current code but for the
founding fix).

## Tests

- Last full `npm test` (check, golden, sprites, pictures, gpu, smoke,
  minds, valley, wizard, talk, pwa): all passed against Tycho c887a9c
  (mf-harm with main 0c155a3 merged), before the founding fix
  (`genetics.js`, `instinct: false`) and the `test/harm/` scripts. Nothing
  has been run since; no golden values or pictures were re-recorded.
- Tycho's `mf-harm`: `npm test` (379 pass), `npm run typecheck` and
  `npm run vk` passed at c887a9c; 9d5720b changes only `docs/harm.md`
  (dist rebuilt, unchanged).
- Screenshots: `test/out/scuffle.png` (two squared up, "Take that!",
  "Ouch!") and `test/out/prank.png` (a cord between two pegs across a path,
  a snare loop, someone sat down hard, "Whoa! Oof!") looked right, taken
  with `test/harm/shots.js`.

## Tyrell and the bridge on `mf-harm`

All general, with defaults unchanged (every recorded hash the same), each
with tests and docs:

- **Athelas: a phase's `if`** (`tyrell/src/modules/athelas.ts`): a phase
  whose conditions don't hold as it would start is passed over, so a course
  can start at the band its severity says. Merryfolk's ale and toadstools
  are levels falling through bands; a pint that leaves them at 0.3 starts
  at "mellow", three at "well in drink".
- **Bree: a kind's `escalation`** (`bree.ts`): how readily that kind
  escalates, a number, considerations or a function from the side of who'd
  escalate, times Bree's own chance. Merryfolk's squabble seldom comes to
  blows, never between a child and a grown-up, and Bree's one knob would
  have changed natters turning into squabbles too.
- **Morgul: a trap's `about`** (`morgul.ts`, and the bridge's `traps` passes
  it through): who the game says was about when a trap was set or sprung,
  evidence for suspicion. Each villager is at a place of their own in
  Tyrell, so Morgul never had anyone at the place to suspect.
- Docs: `athelas.md`, `bree.md`, `morgul.md`, `tuning.md`, `minds.md`,
  `docs/harm.md` (Merryfolk's harm under way).
- Tycho's main merged in three times (cb5cb15, ee82508, 0c155a3); Westmarch's
  new `describe` already has words for every kind Athelas and Morgul log.
