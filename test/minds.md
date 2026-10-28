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
(the runner's own commit, 06dd4b3), `season-after.json` the village as it is
now; the tables are means over the seeds (`--compare before after`). A year
(twelve days, seeds 1 and 2) was run too: `season-before-year.json` and
`season-after-year.json`. The column "first" is the move as it first ended
(010e13b), before the second look below.

Before, the seed drives Math.random and the whole village follows it. After,
the founding still follows it (each seed founds the same village before and
after), but every chance taken while the village lives is drawn from the
minds' own streams, so from the first morning the villages go their own ways:
the numbers compare the same villages living under two minds, not the same
days replayed. Small counts swing a lot from seed to seed: friendships formed
in a season ran 10, 17 and 29 across the three seeds before, wishes granted
19 to 31. Even the old village doesn't play a seed quite the same twice, and
the wizard's visits (a crowd round him for a tale) move the friendships a lot
from run to run, so the friendships were looked at again over six seeds, and
without him (below).

## A season

| | before | first | after |
|---|---:|---:|---:|
| folk at the end | 27.33 | 29 | 28 |
| meals per villager-day | 2.59 | 2.45 | 2.5 |
| villager-days under two meals | 0.13 | 0.12 | 0.11 |
| villager-days with no meal | 0.03 | 0.01 | 0.02 |
| waking time very hungry | 0.17 | 0.02 | 0.02 |
| work hours per worker-day | 2.18 | 2.03 | 1.96 |
| commute hours per worker-day | 4.69 | 4.78 | 4.78 |
| jobs done | 746.67 | 779.67 | 776.33 |
| food made | 217 | 242.67 | 262.67 |
| food eaten | 207 | 215.67 | 229 |
| food in the Store at the end | 66.33 | 46 | 59.33 |
| lowest food in the Store | 63.67 | 40.67 | 45 |
| grain at the end | 180.67 | 252.67 | 201.33 |
| ale at the end | 31 | 42 | 32 |
| timber at the end | 30 | 30 | 39.33 |
| coin at the end | 20 | 26 | 26 |
| weddings | 0 | 0 | 0 |
| births | 0.33 | 0.67 | 0.33 |
| mood, mean | 0.59 | 0.64 | 0.64 |
| mood, lowest tenth | 0.29 | 0.38 | 0.38 |
| mood, highest tenth | 0.86 | 0.89 | 0.9 |
| breaks | 1.67 | 0.33 | 0 |
| friendships formed | 18.67 | 11.33 | 17.67 |
| falling-outs | 0 | 0 | 0 |
| quarrels | 0 | 0.67 | 0 |
| good natters | 15 | 12 | 12.33 |
| colds caught | 0.67 | 0.67 | 0 |
| time sick | 0.01 | 0 | 0 |
| skill points gained per villager | 3.86 | 3.59 | 3.26 |
| skill levels gained | 3.33 | 3.67 | 3 |
| wishes granted | 24 | 19 | 22.33 |
| time asleep | 0.26 | 0.25 | 0.25 |
| time working | 0.07 | 0.07 | 0.06 |
| time eating | 0.11 | 0.1 | 0.1 |
| time with others | 0.03 | 0.03 | 0.03 |
| time at leisure | 0.12 | 0.12 | 0.13 |
| time walking | 0.39 | 0.4 | 0.4 |
| time idle | 0.03 | 0.03 | 0.03 |

## Step by step

The same runner after each step (the "first" column is the branch's end, with
the two fixes the comparison led to, below; the last two are the second
look: each moment thought over once, then habits learned the game's way and
nothing set out for that's closed):

| | before | 2: needs, choices | 3: families, skills | 4: work, the Store | 5 and 6: talk, feelings, friends, chance | first | checks once | after |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| meals per villager-day | 2.59 | 2.41 | 2.41 | 2.45 | 2.45 | 2.45 | 2.44 | 2.5 |
| waking time very hungry | 0.17 | 0.02 | 0.03 | 0.01 | 0.02 | 0.02 | 0.02 | 0.02 |
| work hours per worker-day | 2.18 | 2.07 | 2.03 | 2.03 | 2.04 | 2.03 | 2.01 | 1.96 |
| jobs done | 746.67 | 754.33 | 768 | 836.33 | 771.33 | 779.67 | 781 | 776.33 |
| food made | 217 | 235 | 241 | 280 | 252 | 242.67 | 255 | 262.67 |
| mood, mean | 0.59 | 0.66 | 0.66 | 0.64 | 0.65 | 0.64 | 0.65 | 0.64 |
| mood, lowest tenth | 0.29 | 0.42 | 0.41 | 0.39 | 0.37 | 0.38 | 0.39 | 0.38 |
| breaks | 1.67 | 0.33 | 0 | 0.33 | 0.67 | 0.33 | 0.67 | 0 |
| friendships formed | 18.67 | 20 | 23 | 20 | 15.67 | 11.33 | 16 | 17.67 |
| quarrels | 0 | 1.67 | 0 | 1.33 | 1.33 | 0.67 | 0.67 | 0 |
| skill points gained per villager | 3.86 | 3.78 | 3.56 | 3.42 | 3.47 | 3.59 | 3.47 | 3.26 |
| wishes granted | 24 | 18.67 | 21.33 | 20 | 23 | 19 | 23 | 22.33 |

## A year

Seeds 1 and 2, twelve days each:

| | before | first | after |
|---|---:|---:|---:|
| folk at the end | 37 | 36 | 41.5 |
| meals per villager-day | 2.59 | 2.51 | 2.47 |
| villager-days under two meals | 0.17 | 0.12 | 0.14 |
| villager-days with no meal | 0.03 | 0.02 | 0.02 |
| waking time very hungry | 0.26 | 0.04 | 0.03 |
| work hours per worker-day | 1.62 | 1.69 | 1.59 |
| commute hours per worker-day | 3.78 | 4.05 | 4.05 |
| jobs done | 2752 | 3253 | 3122.5 |
| food made | 983.5 | 1120.5 | 1214.5 |
| food eaten | 865 | 904 | 970.5 |
| food in the Store at the end | 17.5 | 25 | 20 |
| lowest food in the Store | 0 | 0 | 0 |
| grain at the end | 162.5 | 178 | 152.5 |
| ale at the end | 0 | 0 | 0 |
| timber at the end | 17 | 8.5 | 12 |
| coin at the end | 52 | 50 | 76 |
| weddings | 3.5 | 3 | 4 |
| births | 8.5 | 6.5 | 9 |
| mood, mean | 0.54 | 0.62 | 0.63 |
| mood, lowest tenth | 0.26 | 0.38 | 0.39 |
| mood, highest tenth | 0.84 | 0.87 | 0.88 |
| breaks | 7.5 | 0.5 | 0 |
| friendships formed | 138 | 119 | 146 |
| falling-outs | 0 | 0 | 0 |
| quarrels | 5 | 4.5 | 3 |
| good natters | 92 | 63 | 66 |
| colds caught | 15 | 9 | 9 |
| time sick | 0.03 | 0.02 | 0.03 |
| skill points gained per villager | 15.42 | 14.25 | 13.27 |
| skill levels gained | 6.5 | 5.5 | 5 |
| wishes granted | 111 | 102 | 114 |
| time asleep | 0.25 | 0.22 | 0.23 |
| time working | 0.05 | 0.06 | 0.05 |
| time eating | 0.1 | 0.1 | 0.1 |
| time with others | 0.04 | 0.04 | 0.04 |
| time at leisure | 0.14 | 0.14 | 0.14 |
| time walking | 0.4 | 0.42 | 0.41 |
| time idle | 0.03 | 0.03 | 0.02 |

## What the numbers say

- **They eat about as well, and are hardly ever famished.** A little fewer
  meals a day each (2.5 against 2.59 in a season, 2.47 in a year), but the
  waking time spent very hungry fell from 17% to 2% in a season and from 26%
  to 3% in a year: Tyrell lets an urgent need break into what someone is
  doing (a hungry hobbit leaves the fishing for a bite), where the old brain
  finished whatever it had queued first.
- **They work about as much, and make more.** About the hours (1.96
  against 2.18 a worker-day in a season, 1.59 against 1.62 in a year), with
  more jobs done (3122 against 2752 in a year) and more food made (1214
  against 984). The Store ends a season a little lower: more is eaten.
- **They're happier, and break less.** Mean mood 0.64 against 0.59, the
  unhappiest tenth 0.38 against 0.29, and far fewer breaks (none in a year
  against seven and a half), in a season and in a year: folk who aren't
  famished aren't miserable. Fewer colds, too (9 against 15 in a year).
- **Their days look the same.** Time asleep, eating, with others, at
  leisure, walking and idle are within a few points of before.
- **Families go on as before.** Over a year, 4 weddings against 3.5 and 9
  births against 8.5 (two villages each, so a birth or two either way); a
  season is too short for either.
- **Friendships form about as fast in the runner's season and year**
  (17.67 against 18.67 a season, 146 against 138 a year), with fewer
  quarrels (3 against 5 a year), but fewer good natters (66 against 92 a
  year); over six seeds, and without the wizard, a gap remains (below).
- **Skills come a little slower** (3.26 points a villager a season against
  3.86, 13.3 against 15.4 a year): they learn exactly as before (Tyrell's
  rate, checked against the old formula to the third decimal), so it's the
  practice, the work hours above.

## Friendships, a second look

The first move ended with friendships well down (11 a season against 19, 119
a year against 138). Looking again:

- **Three seeds can't tell.** The old village doesn't replay a seed the
  same: run again, its seeds 1 to 3 formed 30, 39 and 19 friendships in a
  season, where the recorded run had 10, 17 and 29. With the fixes below the
  runner's three seeds have 17.67 a season and 146 a year, but over six
  seeds a season has 17.67 against 26.17.
- **The habits had drifted.** Bicameral learned habits its own way (relief
  got against relief expected), not the game's (after each task, by how much
  it relieved, less a little), so after six days a meal at the inn was a
  habit of 1.31 against 1.48, a natter 1.0 against 1.2 and a night's sleep
  0.95 against 1.45. The game's rule is back (below), and after six days they
  stand at 1.48, 1.1 and 1.57.
- **Without the wizard, a gap of a fifth remains, and it's company.** Six
  seeds, six days each, the wizard kept away:

| | before | first | after |
|---|---:|---:|---:|
| friendships formed | 50.7 | 42.8 | 40.7 |
| regard grown in company | 36 | 28.8 | 27.9 |
| others at the inn table, on average | 4.48 | 3.52 | 3.6 |
| natters finished | 99.7 | 78.7 | 80.7 |
| good natters | 33.7 | 22.8 | 26.2 |

Regard grows exactly as fast for each moment two spend together; there's
less of that: fewer minutes in company (28,700 a village against 31,600),
with fewer others about in them (3.2 against 3.8). Needs sit lower all day on
Tyrell (loneliness 0.33 against 0.45, boredom 0.06 against 0.16, by day):
its relief comes from the moment someone sets out, the walk included, and an
urgent need breaks in, so folk who are less lonely seek each other out less.

One reason was found and isn't changed here. What a task relieves of its own
(a dish, the innkeeper's company, a squabble, a diner who gave up waiting)
goes in as a difference before Tyrell's own relief, and a need already full
or already met loses some of it: a diner who leaves the inn unserved comes
away nearly fed (hunger 0.28, where the old village left them at 0.70, to go
home for a bite). Reckoned from the needs' levels instead, the gap closes
(49.7 friendships, 35.7 regard) and meals come back to 2.61 a day, but
squabbles went from one in six seasons to seven, good natters fell further
and the year had fewer friendships (122), so it wants a closer look before
it goes in.

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
- **Habits learned the game's way** (the second look). After each task the
  habit moves by 0.08 × (what it relieved × their taste for it − 0.25), a
  squabble takes 0.3 off, a queued errand teaches nothing, and it stays
  between 0.35 and 2.2, as before; what it relieved is reckoned from their
  needs as Tyrell's doing began (the walk there included, as Tyrell relieves).
  The game tells it in as a reward, and Bicameral's own learning is off
  (`habits: 0` in `MIND_CONFIG`).
- **Each moment thought over once.** Someone who kept on after a check had
  their next check queued again, so the same minute was thought over two or
  three times, with a fresh draw each time: 483 decisions in twelve hours
  against 386 now. Tyrell's `checksOnce` setting (off unless a game asks) is
  on.
- **Nothing set out for that's closed.** A choice of Tyrell's is checked
  against the game's own availability as the game begins it (a blight
  already cleared, say), and is reported failed if it's gone; before, one
  such took the year's run down.

## What moved where

| Merryfolk | Tyrell | |
|---|---|---|
| drives | Bicameral needs | Each rising at a rate per villager per hour (genes, age, trade, illness, ale, the season: `mindRates`); what the valley moves (chill, aches, comfort, quiet, unease) written in by the game |
| actions and the choice | Bicameral actions and the pick | Relief from each action's sat; every reason the old score gave reaches the weighing as a factor through the game's module (`MIND_MODULE`); urgent needs break in |
| reward learning, pats | habits, `reward` | The game's own rule after each task, told in as rewards; Bicameral's own learning off (`habits: 0`) |
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

A day simulated (seed 7), the main thread's CPU time, three times each back
to back: 1.60 seconds before, 3.60 as the move first ended, 3.20 now (wall
time 1.88, 4.05 and 3.50). Played at the game's own pace a day is eight
minutes, so it's under one percent of the time either way, but
fast-forward feels it. What was taken back, with the minds exactly the same
(the same hash): the views of each villager's needs, habits and skills share
one set of accessors and read each value once a moment until something
changes it, the needs the game writes are only sent when they've moved, and
who knows whom is indexed once instead of searched for every read. Thinking
each moment once took back a little more. Where the rest goes: Tyrell's
weighing of every option, with the game's own score for each (about a
quarter), the rest of Tyrell's work (about a sixth), the views and writes
between the game and the minds (a tenth to a fifth), and a bigger hourly
save (the minds' state, about 760 KB, adds some 14 ms an hour).
