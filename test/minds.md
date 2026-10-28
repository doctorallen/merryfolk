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

## Natters on Bree

The natters between villagers moved onto Bree, Tyrell's module for what
passes between people, on the `bree` branch (with Tycho's `mf-bree`, which
gives Bree what a game that owns space needs, merged with Tycho's main).
Every natter, squabble, sweet-talk, natter with a little one, newcomer
asking their way, apology, making-up and round of table talk is now one of
Bree's exchanges: it strikes
them up when one villager walks up to another (at converse.js's own odds),
runs them turn by turn on the minds' clock, scores how each answer lands with
whoever hears it, decides when a curt word sends someone off or turns a
natter into a squabble, and leaves grudges; what each outcome does is the
game's own (friendship by `bond()`, its moodlets, memories and chronicle).
This is the village before and after.

### How it was measured

The season runner now counts what passes between people too: natters begun
(each once, by whoever walked up), the lines said in them, those someone
walked off from, long and good natters (the feelings, each one's), squabbles
(each one's hard words), table talks and gatherings and the lines said round
them, good company at table and sing-songs (feelings, counted each time
they're given or refreshed), and with Bree, the grudges formed and held,
feuds, making up, natters turned squabbles, patience kept and someone
stepping in. Friendships in a season ran 30, 39 and 19 on reruns of the old
village, so the season was played for six seeds (1 to 6) and the year for
four (1 to 4, twelve days each), and six seeds for six days with the wizard
kept away (`--no-wizard`: his visits, a crowd round him for a tale, move
friendships more than anything else): before is main as it was (c587726,
`season-bree-before*.json`), after is the branch (`season-bree-after*.json`).
Each cell is the mean over the seeds, with the lowest and highest seed's in
brackets. The usual comparison's three-seed season and two-seed year are the
first file of each pair (`node test/season.js --compare bree-before
bree-after`).

A season, six seeds (1 to 6), three days each:

| | before | after |
|---|---:|---:|
| folk at the end | 27.5 (26 to 29) | 27.67 (27 to 29) |
| meals per villager-day | 2.45 (2.29 to 2.61) | 2.46 (2.38 to 2.56) |
| weddings | 0 | 0 |
| births | 0.33 (0 to 1) | 0.17 (0 to 1) |
| mood, mean | 0.65 (0.63 to 0.66) | 0.65 (0.62 to 0.66) |
| mood, lowest tenth | 0.38 (0.36 to 0.41) | 0.38 (0.36 to 0.41) |
| mood, highest tenth | 0.9 (0.87 to 0.93) | 0.9 (0.88 to 0.94) |
| breaks | 0.17 (0 to 1) | 0 |
| friendships formed | 17.67 (10 to 30) | 14.83 (9 to 18) |
| natters begun | 19.5 (14 to 24) | 18.67 (14 to 26) |
| lines a natter | 6.07 (5.5 to 6.58) | 6.51 (5.4 to 7.32) |
| good natters | 12.33 (6 to 20) | 12.17 (5 to 18) |
| natters someone walked off from | 0.67 (0 to 2) | 1 (0 to 3) |
| long natters (each one's) | 17.33 (8 to 26) | 19.67 (12 to 30) |
| squabbles felt (each one's) | 0 | 1.67 (0 to 4) |
| table talks and gatherings | 32 (16 to 39) | 35.67 (25 to 48) |
| lines said round them | 240.33 (120 to 307) | 269.83 (178 to 423) |
| good company at table (felt) | 189.17 (70 to 281) | 232.5 (132 to 387) |
| sing-songs (felt) | 26.6 (16 to 42) | 54.17 (16 to 122) |
| gatherings (felt) | 5.83 (2 to 9) | 4 (2 to 7) |
| saw a squabble | 0 | 0.83 (0 to 4) |
| grudges formed or deepened | - | 2.17 (0 to 4) |
| grudges held at the end | - | 1.33 (0 to 3) |
| natters turned squabbles | - | 0 |
| someone stepped in | - | 0 |
| time with others | 0.03 (0.02 to 0.03) | 0.03 (0.02 to 0.03) |
| time at leisure | 0.12 (0.11 to 0.13) | 0.12 (0.11 to 0.13) |
| wishes granted | 20.33 (18 to 26) | 19.17 (13 to 28) |
| colds caught | 1 (0 to 3) | 1.33 (0 to 3) |

A year, four seeds (1 to 4), twelve days each:

| | before | after |
|---|---:|---:|
| folk at the end | 40.25 (37 to 43) | 39.75 (35 to 45) |
| meals per villager-day | 2.45 (2.39 to 2.51) | 2.5 (2.45 to 2.53) |
| weddings | 3 (2 to 4) | 3.5 (1 to 6) |
| births | 9.25 (7 to 12) | 7.5 (4 to 11) |
| mood, mean | 0.63 (0.62 to 0.63) | 0.62 (0.6 to 0.64) |
| mood, lowest tenth | 0.38 (0.37 to 0.39) | 0.38 (0.35 to 0.41) |
| mood, highest tenth | 0.87 (0.86 to 0.87) | 0.86 (0.83 to 0.89) |
| breaks | 0.75 (0 to 1) | 0.5 (0 to 2) |
| friendships formed | 133.5 (83 to 159) | 131.5 (108 to 149) |
| natters begun | 109 (92 to 126) | 114.5 (101 to 122) |
| lines a natter | 6.37 (5.83 to 6.83) | 6.42 (5.64 to 6.84) |
| good natters | 62.75 (41 to 74) | 59 (42 to 68) |
| natters someone walked off from | 4.5 (2 to 7) | 5 (1 to 9) |
| long natters (each one's) | 98.5 (64 to 120) | 93 (54 to 115) |
| squabbles felt (each one's) | 6.5 (4 to 12) | 9.5 (6 to 12) |
| table talks and gatherings | 211.5 (194 to 233) | 230 (221 to 239) |
| lines said round them | 1674 (1442 to 1861) | 1882.25 (1849 to 1904) |
| good company at table (felt) | 1573.5 (1071 to 1919) | 1820 (1728 to 1962) |
| sing-songs (felt) | 196.5 (81 to 289) | 397.5 (352 to 451) |
| gatherings (felt) | 26.75 (25 to 29) | 21.5 (15 to 26) |
| saw a squabble | 0 | 3.25 (1 to 5) |
| grudges formed or deepened | - | 15 (7 to 26) |
| grudges held at the end | - | 5.5 (3 to 9) |
| natters turned squabbles | - | 0.25 (0 to 1) |
| someone stepped in | - | 0.25 (0 to 1) |
| time with others | 0.04 | 0.04 (0.03 to 0.04) |
| time at leisure | 0.14 (0.13 to 0.15) | 0.14 (0.13 to 0.15) |
| wishes granted | 114.75 (105 to 128) | 105 (94 to 125) |
| colds caught | 11.5 (7 to 14) | 14.5 (13 to 19) |

Without the wizard, six seeds (1 to 6), six days each:

| | before | after |
|---|---:|---:|
| folk at the end | 32.33 (31 to 34) | 32 (30 to 35) |
| meals per villager-day | 2.56 (2.48 to 2.67) | 2.55 (2.49 to 2.7) |
| weddings | 0.33 (0 to 1) | 0.33 (0 to 1) |
| births | 3.33 (3 to 4) | 3.17 (2 to 5) |
| mood, mean | 0.62 (0.62 to 0.63) | 0.62 (0.61 to 0.64) |
| mood, lowest tenth | 0.36 (0.34 to 0.38) | 0.35 (0.33 to 0.38) |
| mood, highest tenth | 0.88 (0.86 to 0.89) | 0.88 (0.87 to 0.89) |
| breaks | 0.5 (0 to 2) | 0.67 (0 to 3) |
| friendships formed | 43.83 (40 to 48) | 35 (26 to 47) |
| natters begun | 45.67 (36 to 53) | 42.67 (36 to 49) |
| lines a natter | 6.1 (5.52 to 6.38) | 6.15 (4.97 to 6.82) |
| good natters | 26.33 (16 to 32) | 24.17 (15 to 31) |
| natters someone walked off from | 1.83 (0 to 5) | 2.83 (0 to 6) |
| long natters (each one's) | 39.33 (30 to 50) | 36 (16 to 50) |
| squabbles felt (each one's) | 1.33 (0 to 6) | 3.33 (2 to 6) |
| table talks and gatherings | 68.67 (47 to 76) | 63 (50 to 75) |
| lines said round them | 505.83 (325 to 642) | 458.67 (377 to 612) |
| good company at table (felt) | 387.5 (199 to 545) | 341.17 (258 to 504) |
| sing-songs (felt) | 47.17 (8 to 132) | 66.5 (27 to 146) |
| gatherings (felt) | 13.5 (11 to 18) | 11.17 (9 to 13) |
| saw a squabble | 0 | 2.33 (0 to 6) |
| grudges formed or deepened | - | 6.17 (2 to 13) |
| grudges held at the end | - | 3.33 (1 to 8) |
| natters turned squabbles | - | 0 |
| someone stepped in | - | 0 |
| time with others | 0.03 (0.03 to 0.04) | 0.03 (0.02 to 0.03) |
| time at leisure | 0.12 (0.11 to 0.12) | 0.12 (0.11 to 0.13) |
| wishes granted | 48.5 (39 to 55) | 44.33 (30 to 63) |
| colds caught | 1.33 (0 to 4) | 1.83 (0 to 3) |

### What the numbers say

The natters themselves are the old village's. Natters begun, the lines in
each, good natters, walk-offs and long natters fall inside the old seeds'
spread in all three, and their means are within about a tenth of the old
ones but for walk-offs, a handful each way (a year's 5 against 4.5).

The friendships are noise: a year's 131.5 against 133.5, a season's 14.83
against 17.67 (the old seeds ran 10 to 30), and without the wizard 35
against 43.83, the one low mark. Over the rounds of tuning below, none of
which changed how a friendship grows, the same six seeds without the wizard
formed 38.67, 41.67, 44.5, 43 and 35, and the year 112 to 147, so a round's
mean moves a tenth or more on its own. If anything lies under it, it's the
first days at the inn: over the first three days a villager spends a fifth
less time over an ale (0.46 hours a day against 0.58, most of it waiting to
be served, and the company there grows more friendships than any natter).
With only the natters on Bree, or only the tables, each took off about a
tenth (four days, six seeds, no wizard, in an earlier round); what moves it
wasn't found, and by the end of a year it's level (0.57 hours both).
Weddings, births and the size of the village follow, and stay within the
old spread (a year ends with 39.75 folk after 7.5 births, against 40.25
after 9.25; the new seeds had 4 to 11 births, the old 7 to 12, and the
seventh round's year 9.25).

Squabbles are a little more: 9.5 felt a year against 6.5 (the old seeds 4 to
12), 3.33 against 1.33 without the wizard. They're struck at exactly the old
odds; what's more is that a natter can now turn into one (a quarter of one a
year) and that a squabble cut short is still felt (the old village felt one
only if the chat ran to its end). What's new: someone about sees a squabble
(3.25 a year) and doesn't like it, and squabbles leave grudges (15 formed
or deepened a year, 5.5 still held at the end) that color the next natter
between the two and fade over a few days. Making it up is rare (a quarter
of one a year in earlier rounds, none in these): it wants both still sore
when they next meet. Nobody fell into a feud, and someone stepped in once in
the four years.

Table talk is about the old: as many tables (230 a year against 211.5), a
little more said round them (1882 lines against 1674, just over the old's
highest seed; without the wizard 459 against 506), and good company as often
(1820 against 1573; without the wizard 341 against 387). What's left is the
singing: sing-songs are felt twice as often in a year (397.5 against 196.5)
and a season, half again as often without the wizard. Played like for like
(seed 3, twelve days, once each way), song takes 18 of every hundred lines
round the table against 14, at tables a little bigger (4.4 against 4), and
the feeling comes 35% more often. The old count swings widely (seed 3 felt
it 81 times in the runner's year and 290 in that run), but every seed of the
new year sings more than any of the old. It's a feeling worth 0.08, and the
village's mood is the same (0.62 against 0.63 a year, the lowest and highest
tenths alike).

Gatherings are felt a fifth less (21.5 a year against 26.75), in every round
of tuning; they're the game's own, and what natters have to do with it
wasn't traced (more natters going, and a friend joining two in the lane at
the old chance). Everything else (meals, mood, breaks, time with others) is
the old village's within its spread; wishes granted are a little under it
(105 a year against 114.75: the new seeds 94 to 125, the old 105 to 128) and
colds a little over (14.5 against 11.5: 13 to 19, and 7 to 14).

### How it was tuned

The mapping as first built drifted in a few places, and seven rounds brought
it back (the year's means, four seeds each; the friendships between rounds
show how far a year swings with nothing much changed):

| | before | first | second | third | fourth | fifth | sixth | seventh | after |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| folk at the end | 40.25 | 39 | 41.75 | 37.5 | 36.75 | 36.25 | 38.75 | 40.25 | 39.75 |
| births | 9.25 | 8.25 | 10 | 7 | 7.5 | 7.75 | 7.5 | 9.25 | 7.5 |
| friendships formed | 133.5 | 118.5 | 147.25 | 120.75 | 129 | 112.25 | 126 | 136.5 | 131.5 |
| natters begun | 109 | 115.5 | 120 | 103 | 99.75 | 101.75 | 109.75 | 114.75 | 114.5 |
| lines a natter | 6.37 | 6.46 | 6.53 | 6.41 | 6.48 | 6.5 | 6.57 | 6.63 | 6.42 |
| good natters | 62.75 | 101.75 | 70.25 | 59.5 | 59 | 57.25 | 57.25 | 63.25 | 59 |
| natters someone walked off from | 4.5 | 2.5 | 4.25 | 4.25 | 4.75 | 5 | 4.25 | 2.5 | 5 |
| long natters (each one's) | 98.5 | 103 | 113 | 94.75 | 91.75 | 89.75 | 102.25 | 106.75 | 93 |
| squabbles felt (each one's) | 6.5 | 10 | 7.5 | 6 | 6.75 | 8 | 6.5 | 7 | 9.5 |
| table talks and gatherings | 211.5 | 308 | 297.5 | 224.25 | 265.25 | 228.75 | 223.5 | 219.25 | 230 |
| lines said round them | 1674 | 2007.5 | 1860.25 | 1377.25 | 1651 | 1747.25 | 1650.5 | 1748.75 | 1882.25 |
| good company at table (felt) | 1573.5 | 2388.75 | 2270.5 | 1509.5 | 1952.5 | 2022.75 | 1868.25 | 1588.25 | 1820 |
| sing-songs (felt) | 196.5 | 172 | 173.5 | 81 | 146.25 | 164.75 | 135 | 418 | 397.5 |

- **First:** the mapping as built. The natters themselves came out about the
  same (115.5 begun, 6.46 lines each), but good natters ran at 102 against 63
  (the chance of the feeling by outcome, warm 1, good 0.6, fine 0.3, was too
  generous), walk-offs at 2.5 against 4.5, and table talk half again as often
  (it ran without the old rounds' pauses between topics, at a turn every one
  and a half to two and a half minutes).
- **Second:** the good-natter chance down (warm 0.6, good 0.35, fine 0.2), a
  grump's curt answer landing a little worse (-3.5) and sending the other off
  a little more readily (`leaveBase` 0.6), a friend who happens by joining
  after the second line as before (the first cut waited for the third),
  table talk at two to three minutes a turn, and `escalation` 0.5 so a natter
  now and then turns into a squabble.
- **Third:** a lull of five minutes at a table after a round, as the old
  rounds paused between topics; squabbles that end awkward are seen
  (`seenAt`); making it up and saying sorry readier. Table talk fell
  below the old (1377 lines against 1674).
- **Fourth:** the lull three minutes, songs likelier at the inn of an
  evening, and a squabble that ends merely awkward leaves the two sore with
  each other (Bree's `grudge` table, a squabble's doubled), as the old
  village's squabble memory had them "sour" for a while; before, Bree left a
  grudge only for a sour one, so nobody ever had anything to make up.
- **Fifth:** tables that go on when someone gets up (Bree's `stays`: the
  first four rounds ran on a build of Bree from before it, so their tables
  ended as soon as anyone left, and their table numbers are a little low on
  lines), the natters with a toddler or a baby and newcomers asking their way
  on Bree too (before, about three natters in ten still ran on villager.js's
  old exchange), and the squabble odds exactly the old ones (an earlier
  round had scaled them to three quarters, thinking the old village's
  squabbles were often cut short before their hard words were felt; its year
  says they weren't).
- **Sixth:** a natter's relief reckoned as it always was. The old exchange
  stretched the chat task to the natter's length only once it was under way,
  after shell.js had taken the task's planned length (`t0`) as what the
  minds are owed, so a natter that ran its course gave its whole relief and
  was told to Tyrell as done. Bree's natters stretched it as they began, so a
  natter that ended with its own last word looked cut short: about three
  quarters of its relief, told as stopped part way, and the habit of a
  natter learned more weakly (over four days, seeds 1 and 4, it moved by
  -0.17 and +0.16 where the old village's grew by 0.23 and 0.51; with the
  planned length kept, +0.16 and +0.26). With it the natters came back (109.75 a
  year, against the old 109).
- **Seventh:** topics drawn by their weights alone, as converse.js drew
  them (`topicPull` and `topicCooldown` 0: Bree would favor a topic to the
  speaker's taste and keep two from raising the same one again for a day, so
  a family round the same table every mealtime talked of everything but the
  food in front of them), and the table's topics as the old rounds chose
  them: the first what's in front of them, or of an evening at the inn with
  a few in three times in ten a song and, with an elder there, about one in
  seven a tale; after that any topic that fits, each as likely, a song
  wherever a few are in at the old inn (Bree's songs had wanted an evening
  throughout: over three days, seeds 1 to 3, 11, 8 and 3 lines of song round
  the table where the old village sang 32, 21 and 12). With that the year
  came back nearly everywhere (friendships 136.5, the village 40.25 strong
  with 9.25 births, good company at table 1588), but sing-songs overshot
  (418) and walk-offs fell to 2.5: Bree's freshness had been sending grumps
  onto the topics that sour them.
- **After:** a curt answer sends someone off more readily (`leaveBase`
  0.75: the old natter asked again after every answer once one had been
  curt, where Bree asks once, as it lands; 0.9, tried first, overshot to
  7.75 a year); a song a little less likely as a later topic (0.6 against
  the others' 1: twelve days of seeds 1 and 2 played the old way and the
  new, song took 17 of every hundred lines round the table against 14); six
  at most sit down to a round, counting those who've got up, as the old
  rounds had it (Bree's table seated latecomers up to six there at once, so
  its singing tables were bigger, 4.7 on average against 4); and of an
  evening at the inn an elder there starts the table off, as the old rounds
  had the elder open a tale (Bree's opener was the first grown-up, so its
  evening tables began with a song where the old ones began with a tale).
  This round is the tables above.

### What moved where

| Merryfolk | Bree | |
|---|---|---|
| walking up to someone and settling in (`updateApproach`: the squabble roll, sweet-talk between sweethearts) | `strike`: the starter draws a kind by weight | `natterOdds`: the old odds, a kind each (natter, sweet nothings, squabble, a little one's natter, asking the way, making up, an apology) |
| tempers (`temperOf`) | manners | each fits by `temperOf`, its answers in its own lines |
| how long two talk (`plannedTurns`, by what they are to each other) | a kind's `turns`, as a function | the game's own reckoning; sweet-talk two more |
| topics (`TOPICS`: `when`, `w`) | topics: `if`, `weight` | the food in front of them `from: 'doing'`; the rest the game's own subjects (its memories, hobbies, news and messages are its own) |
| the pools (openers, answers by temper, follow-ups, last words, goodbyes, leaving) | Cityspeak lines on `<topic>.<step>`, `bree.bye`, `bree.leave` | `manner:` conditions, the child's own first, a curt word on an answer that landed badly, goodbyes by what the two are to each other |
| a sour answer (`pSour`) | the natter kind's `lands`, at the `reply` step | a grump on the topics that sour them, or anyone low, worn out, no friend of the speaker, a rival (`CURT`); four tenths as much between sweethearts |
| walking off (`wouldLeave`) | `leave` | `leaveBase` 0.6, `leaveTemper` 0.35, `leaveRegard` 0.3, `leaveSour` 0.2 |
| a natter's warmth (+0.06 at the start, +0.03 at the end, +0.03 a long one) | the kinds' `on` | by outcome (`NATTER_BOND`, warm 0.12 to a row -0.04), through `bond()`; long, +0.03 |
| snubbed, long_chat, good_chat, quarrel | `on.left`, `on.long`, `on.end` by outcome, the squabble's `on.end` | the game's moodlets, through `feel()` |
| the quarrel mode | the squabble kind (hostile, no topics) | its words `lineFor(…, 'quarrel')` |
| the court mode | sweet nothings (romantic) | the courting strands as topics |
| table rounds (`tableRounds`, `roundTick`) | the table kind (a group that `stays`, two to three minutes a turn) | started at tables by the game (`Natter.tables`), latecomers seated (`join`) |
| toddlers' natters, asking around | the little one's natter and asking the way | the old words and pace |
| a squabble remembered | grudges | `relKind`'s squabble memory stays too |
| | witnesses, patience, stepping in, making up, apologies | new |

What stays the game's, and why:

- **Space.** Every villager is at a place of their own in Tyrell, so Bree's
  `together` is the game's (both still in their natter, or at the table) and
  so are its `witnesses` (the room indoors, shouting distance outdoors); a
  natter task put down (a break, the giant hand, the wizard) ends its
  exchange.
- **The words.** converse.js's pools, as Cityspeak lines, filled in by
  `fillTalk` as they're said, with manners (`applyManner`); the news and the
  messages passed on (gossip.js, talk.js) are topics with the game's own
  words, and so are a little one's natter and asking the way.
- **How a friendship grows.** `bond()` (likeness, shared values and likes,
  sentiments, and the spark between two who could court), so Bree's own
  regard and attraction are off: its outcome says how much.
- **The feelings and memories.** The mood is the game's, from its moodlets,
  so Bree's own feelings and memories are off and its outcomes give the
  game's.
- **Gatherings,** the wizard's talks (Voice) and the third voice (natter.js;
  making the peace is Bree's reconcile now).
- **Talking on and off, and a word at the counter.** Bree's `again` (two
  still together strike up again later) and `interactWith` (an action that
  talks with whoever's there, as someone pays at a till) both go by who
  shares a place in Tyrell, and here nobody does, so the game does both its
  own way: a table talks again after a lull while they're still sat there
  (`Natter.tables`), and the innkeeper's serving stays work.js's.

### Speed

A day simulated (seed 7), the page's CPU time (its renderer, read from
/proc), three times each, before and after in turn: 5.0 seconds before and
5.1 after (4.7 to 5.4 and 4.9 to 5.3; wall time 3.6 both), which is the same
within what back-to-back runs vary on a shared machine. A day is a couple of
hundred turns, each a timer in the minds' queue and a line chosen.
