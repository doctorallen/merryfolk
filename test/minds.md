# The minds on Tyrell: before and after

Merryfolk's villagers moved onto Tyrell, the minds engine in Tycho, in six
steps on the `minds` branch. This is how the village lived before and after,
measured the same way, and what moved where.

## How it was measured

`node test/season.js` founds a fresh village in the original valley for each
of three seeds (1, 2, 3), runs it headless for a season (three days), and
records what its life came to: meals eaten and missed, hours worked and jobs
done, goods made and the Store's levels, weddings, births and departures,
moods, breaks, friendships and quarrels, illness, skills, wishes and where
everyone's time went. `season-before.json` is the village before any of this
(the runner's own commit, 06dd4b3), `season-after.json` the branch as it ends;
the tables are means over the seeds (`--compare before after`). A year (twelve
days, seeds 1 and 2) was run too: `season-before-year.json` and
`season-after-year.json`.

Before, the seed drives Math.random and the whole village follows it. After,
the founding still follows it (each seed founds the same village before and
after), but every chance taken while the village lives is drawn from the
minds' own streams, so from the first morning the villages go their own ways:
the numbers compare the same villages living under two minds, not the same
days replayed. Small counts swing a lot from seed to seed: friendships formed
in a season ran 10, 17 and 29 across the three seeds before, wishes granted
19 to 31.

## A season

| | before | after |
|---|---:|---:|
| folk at the end | 27.33 | 29 |
| meals per villager-day | 2.59 | 2.45 |
| villager-days under two meals | 0.13 | 0.12 |
| villager-days with no meal | 0.03 | 0.01 |
| waking time very hungry | 0.17 | 0.02 |
| work hours per worker-day | 2.18 | 2.03 |
| commute hours per worker-day | 4.69 | 4.78 |
| jobs done | 746.67 | 779.67 |
| food made | 217 | 242.67 |
| food eaten | 207 | 215.67 |
| food in the Store at the end | 66.33 | 46 |
| lowest food in the Store | 63.67 | 40.67 |
| grain at the end | 180.67 | 252.67 |
| ale at the end | 31 | 42 |
| timber at the end | 30 | 30 |
| coin at the end | 20 | 26 |
| weddings | 0 | 0 |
| births | 0.33 | 0.67 |
| mood, mean | 0.59 | 0.64 |
| mood, lowest tenth | 0.29 | 0.38 |
| mood, highest tenth | 0.86 | 0.89 |
| breaks | 1.67 | 0.33 |
| friendships formed | 18.67 | 11.33 |
| falling-outs | 0 | 0 |
| quarrels | 0 | 0.67 |
| colds caught | 0.67 | 0.67 |
| time sick | 0.01 | 0 |
| skill points gained per villager | 3.86 | 3.59 |
| skill levels gained | 3.33 | 3.67 |
| wishes granted | 24 | 19 |
| time asleep | 0.26 | 0.25 |
| time working | 0.07 | 0.07 |
| time eating | 0.11 | 0.1 |
| time with others | 0.03 | 0.03 |
| time at leisure | 0.12 | 0.12 |
| time walking | 0.39 | 0.4 |
| time idle | 0.03 | 0.03 |

## Step by step

The same runner after each step (the last column is the branch's end, with
the two fixes the comparison led to, below):

| | before | 2: needs, choices | 3: families, skills | 4: work, the Store | 5 and 6: talk, feelings, friends, chance | end |
|---|---:|---:|---:|---:|---:|---:|
| meals per villager-day | 2.59 | 2.41 | 2.41 | 2.45 | 2.45 | 2.45 |
| waking time very hungry | 0.17 | 0.02 | 0.03 | 0.01 | 0.02 | 0.02 |
| work hours per worker-day | 2.18 | 2.07 | 2.03 | 2.03 | 2.04 | 2.03 |
| jobs done | 746.67 | 754.33 | 768 | 836.33 | 771.33 | 779.67 |
| food made | 217 | 235 | 241 | 280 | 252 | 242.67 |
| mood, mean | 0.59 | 0.66 | 0.66 | 0.64 | 0.65 | 0.64 |
| mood, lowest tenth | 0.29 | 0.42 | 0.41 | 0.39 | 0.37 | 0.38 |
| breaks | 1.67 | 0.33 | 0 | 0.33 | 0.67 | 0.33 |
| friendships formed | 18.67 | 20 | 23 | 20 | 15.67 | 11.33 |
| quarrels | 0 | 1.67 | 0 | 1.33 | 1.33 | 0.67 |
| skill points gained per villager | 3.86 | 3.78 | 3.56 | 3.42 | 3.47 | 3.59 |
| wishes granted | 24 | 18.67 | 21.33 | 20 | 23 | 19 |

## A year

Seeds 1 and 2, twelve days each:

| | before | after |
|---|---:|---:|
| folk at the end | 37 | 36 |
| meals per villager-day | 2.59 | 2.51 |
| villager-days under two meals | 0.17 | 0.12 |
| villager-days with no meal | 0.03 | 0.02 |
| waking time very hungry | 0.26 | 0.04 |
| work hours per worker-day | 1.62 | 1.69 |
| commute hours per worker-day | 3.78 | 4.05 |
| jobs done | 2752 | 3253 |
| food made | 983.5 | 1120.5 |
| food eaten | 865 | 904 |
| food in the Store at the end | 17.5 | 25 |
| lowest food in the Store | 0 | 0 |
| grain at the end | 162.5 | 178 |
| ale at the end | 0 | 0 |
| timber at the end | 17 | 8.5 |
| coin at the end | 52 | 50 |
| weddings | 3.5 | 3 |
| births | 8.5 | 6.5 |
| mood, mean | 0.54 | 0.62 |
| mood, lowest tenth | 0.26 | 0.38 |
| mood, highest tenth | 0.84 | 0.87 |
| breaks | 7.5 | 0.5 |
| friendships formed | 138 | 119 |
| falling-outs | 0 | 0 |
| quarrels | 5 | 4.5 |
| colds caught | 15 | 9 |
| time sick | 0.03 | 0.02 |
| skill points gained per villager | 15.42 | 14.25 |
| skill levels gained | 6.5 | 5.5 |
| wishes granted | 111 | 102 |
| time asleep | 0.25 | 0.22 |
| time working | 0.05 | 0.06 |
| time eating | 0.1 | 0.1 |
| time with others | 0.04 | 0.04 |
| time at leisure | 0.14 | 0.14 |
| time walking | 0.4 | 0.42 |
| time idle | 0.03 | 0.03 |

## What the numbers say

- **They eat about as well, and are hardly ever famished.** A little fewer
  meals a day each (2.45 against 2.59), but the waking time spent very
  hungry fell from 17% to 2%, in a season and in a year: Tyrell lets an
  urgent need break into what someone is doing (a hungry hobbit leaves the
  fishing for a bite), where the old brain finished whatever it had queued
  first.
- **They work about as much, and make more.** About the hours (2.03
  against 2.18 a worker-day in a season, 1.69 against 1.62 in a year), with
  more jobs done (3253 against 2752 in a year) and more food made. The Store ends a season a
  little lower, and the grain higher: more is eaten, and the mill keeps up.
- **They're happier, and break less.** Mean mood 0.64 against 0.59, the
  unhappiest tenth 0.38 against 0.29, and far fewer breaks (half a break in
  a year against seven and a half), in a season and in a year: folk who
  aren't famished aren't miserable. Fewer colds, too (9 against 15 in a
  year).
- **Their days look the same.** Time asleep, eating, with others, at
  leisure, walking and idle are within a few points of before, and so are
  chat hours (a quarter of an hour a villager a day, before and after).
- **Families go on much as before.** Over a year, 3 weddings against 3.5
  and 6.5 births against 8.5 (two villages each, so a birth or two either
  way); a season is too short for either.
- **Friendships form more slowly.** Fewer pairs passed half-way to fond
  over a season (11 against 19) and a year (119 against 138); they chat as long and as often,
  but fewer of their natters are good ones with a friend, so they're
  chatting more with folk they're less fond of. Where that comes from isn't
  pinned down: it came in with step 6 (friendships held in Fellowship, and
  every chance drawn from the minds' streams), and it's the measure that
  swings most from seed to seed. It's the one to watch.
- **Skills come a little slower** (3.59 points a villager a season against
  3.86): they learn exactly as before (Tyrell's rate, checked against the
  old formula to the third decimal), so it's the practice, the work hours
  above.

## What the comparison changed

- **Nobody slept or ate after step 3.** With no place to be, Tyrell offered
  them nothing, and the game's fallback had them strolling the whole season:
  the smoke test passed (nobody was stuck), the season said no meals. Each
  villager now has a place of their own in Tyrell, and the minds test fails
  if half a day goes by without meals and choices.
- **Natters held.** Quarrels had crept up (from none to one or two a season,
  and ten in a year against five): a natter broken off for a bite didn't finish
  (no warm word at the end), and a fresh one started later rolled for a
  squabble again. A natter both have stopped for is held to its end now, as
  the game always held one; only a break comes first. A year has 4.5 again.
- **Friendships to the last decimal.** A friendship grows by ten-thousandths
  as two folk sit together, and a spark by less, so the minds keep them
  unrounded.

## What moved where

| Merryfolk | Tyrell | |
|---|---|---|
| drives | Bicameral needs | Each rising at a rate per villager per hour (genes, age, trade, illness, ale, the season: `mindRates`); what the valley moves (chill, aches, comfort, quiet, unease) written in by the game |
| actions and the choice | Bicameral actions and the pick | Relief from each action's sat; every reason the old score gave reaches the weighing as a factor through the game's module (`MIND_MODULE`); urgent needs break in |
| reward learning, pats | habits, `reward` | |
| inborn tastes | instincts | From Delos |
| genes | Delos | Alleles with dominance (eyes, freckles, curls, chrome), copies taken whole (hair, clothes), blended traits, talents, instincts and food tastes, with the same founders, crossing, noise and mutations |
| births, couples, parents, ages, departures | Cradle, with Fellowship's partners | The game still ages folk, matches couples and decides when a baby comes |
| talents and skills | Tyrell's skills | Practice told in a quarter hour at a time |
| work rounds | Mentat tasks and methods | A slot per job, drawn by need from the person's stream |
| Common Store, chains, economy board | Ceres stock, production and chains | The caps stay the game's |
| the wizard's talks | Voice, with Cityspeak's lines | Every thread a Voice thread, every text of every line a Cityspeak line |
| moodlets, memories | Reverie feelings and memories | The mood is the game's; Reverie's reads it |
| rel, love, sentiments | Fellowship regard, attraction, sentiments | |
| Math.random in the simulation | a stream of the minds' seed and the moment | |

What stays the game's, and why:

- **Space.** Tyrell has no coordinates: the game walks folk to the bench or
  the field, works out who is near whom, and tells Tyrell how each action
  went (done, put down part way, impossible). Each villager has a place of
  their own in Tyrell, so nobody meets anybody there.
- **Imitation.** Fellowship's needs meetings, and isn't age-varying; the
  game's own (children watching someone happy at something nearby, much more
  than grown-ups do) stays, and writes habits as rewards.
- **The body.** Ale, germs and toxins are levels that rise and fall by the
  minute and are read all over (tipsy, hangover, immune, the rates of needs);
  Athelas runs an illness in phases, which would change how a pint or a cold
  plays.
- **Breaks.** Merryfolk's are moods that bend choices for a few hours (a
  binge, a wander, a sharp tongue, a child's tantrum), with a cap a day for
  the village; Reverie's are an action at the top rank.
- **Wishes, dreams and pastimes.** Granted by what happens in the valley (a
  feeling felt, an action finished, an hourly look), not drawn by weight.
- **In talk:** trust and respect, the talk's flags, the day's luck and the
  cross moods' approach-first openings, hooks, the hub's own menus, the
  wizard's own lines, jokes, secrets and the packs' promises.
- **Time walk.** Esper is off: the valley itself (fields, the Store's caps,
  the weather) isn't Tyrell's to rewind.

## Saves

The minds go in the save as Tyrell's own state (`Game.minds`). A save from
before the minds loads into fresh minds made from each villager as they were:
needs, habits, genes, skills, feelings, memories, friendships, couples and
parents carried over. A save from an earlier step takes on what that step
didn't have.

## Speed

A day simulated, before and after, back to back on the same (very busy)
machine, twice each: 8.3 and 12.9 seconds before, 20.5 and 22.9 after, about
twice the time. Played at the game's own pace a day is eight minutes, so it's
a few percent of the time either way, but fast-forward feels it. The time
goes on reading the minds (needs, habits, skills and friendships are views of
Tyrell's state, read many times a step), on Tyrell's weighing of every option
with the game's own score for each, and on telling Tyrell what the game did.
