# Merryfolk

A cozy, pixel-art artificial-life game in the spirit of *Creatures*, set in Thistledown, a Shire-like village of hobbit-holes, gardens, pipe-weed and parties. Villagers are born with a genome and grow up learning from experience. They go to school, take up trades, fall in love, raise families who inherit their looks and nature, and one day set off over the hills. The village grows with them: new hobbit-holes, public buildings and fields are built as the population rises. It runs in any modern browser, with no build step and no dependencies.

## Play

Play online at **https://doctorallen.github.io/merryfolk/**, or open `index.html` in a browser. Double-clicking works, since everything is plain `<script>` tags. Or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

| Action | Controls |
| --- | --- |
| Look around | Drag the map, or WASD / arrow keys |
| Zoom | Mouse wheel, `+` / `−` |
| Select a villager | Click them; `Tab` cycles through everyone |
| Look inside a hobbit-hole | Click it (or *Look inside* on an indoor villager's panel) |
| Pat (reward) / tut-tut (discourage) | Click the selected villager again or `P` / `T` |
| Give a lesson | `E` (or the Teach button) |
| Pick a villager up | Drag them with the hand, drop them anywhere |
| Follow with the camera | `F` |
| Village ledger | `V`: stores, trades, census, the departed, travellers |
| Tools | `1`–`8`: hand, seed-cake, keg of ale, pipe-weed, remedy, storybook, flowers, fireworks |
| Pause / speed | `Space`, or the 1× to 16× buttons |
| Developer mode | `` ` `` (backtick), or the Dev button |

The village saves to `localStorage` every in-game hour and when you leave the page. **?** → *Start a fresh village* resets it.

**Scenarios.** The setup screen also offers a scenario, each with its own conditions and a goal:
- **A Gentle Start:** become a Village.
- **The Long Winter:** a hard frost every winter and a lean Store. Become a Village and see out the first winter.
- **The Flood Plain:** a wild, meandering river that floods almost every spring. Become a Market Town by the end of year two.
- **Hard Times:** a near-bare Store, an empty chest and low spirits. Become a Market Town by the end of year two.
- **The Open Valley:** no goal and no clock.

The goal shows at the top of the Charter. Meet it and the village is honoured (+50 renown); miss it and you simply play on.

**Shaping the valley.** A new village (the very first, or a fresh start) begins on the *Shape your valley* screen. Every new village is a new valley planned from its seed: the river's course (its slant and meanders), the square on gentle ground on the north bank with the store, bakehouse, inn and brewhouse close round it (the whole village mirrored left to right half the time), the barley and pipe-weed fields on the flattest land within walking distance, the barn between the fields and the square, the pond in a hollow with the herbalist beside it, the workshop towards the woods, the mills where the river runs straight enough for a wheel, the windmill on the high ground, the party field, the story oak, the old orchard on a sunny slope, the Hall on the Hill above the square and the other knolls on south-facing slopes round about, with six spare knolls further out; then the lanes join everything to the square by the easiest way, crossing the river by two bridges, with lamps along the lanes and benches about the place. The plan is kept with the village, so a later change to the planning can never move anyone's home; the original valley of Thistledown is still there as *The valley: Thistledown*. Pick a seed (or roll one) and how the land is made: gentle, rolling or hilly ground; a lazy, winding or meandering river; sparse, fair or thick woodland; dry, fair or damp ground; no hedgerows, some or many; few wildflowers, plenty or a riot; few rocks, some or many; no cliffs, some or many; smooth, broken or rugged relief. Then watch it being made on a map, stage by stage: the river finds its way down the valley, knolls rise for the hobbit-holes, lanes wind along the contours, fields are ploughed, rain runs off the hills and the soil settles, the mills and the inn go up, then hedges, woods, willows, long grass and stones, and finally the wildflowers. The same seed and settings always make the same valley, and they're saved with the village. One in-game day takes 8 real minutes at 1×, and each season lasts three days.

## Inside the hobbit-holes

Click any finished hobbit-hole to open a live cutaway of it. The view is from deep in the hill, looking out toward the round front door. Rooms and folk are drawn at the same double resolution as the folk outside.

- **Built from the household.** There's a bed for everyone who lives there: a double for each married couple, small beds for the children and a cradle for each baby. There are bedrooms enough for all of them, chairs round the kitchen table for everyone, and coats on the hall pegs. The hall wall carries the tools of their trades. A study appears for storytellers, posties, herbalists and tinkers (and for rift-born households).
- **Real contents.** The pantry shelves hold what's actually in the larder, loaf for loaf. A bare larder gets a cobweb and a hopeful mouse. The parlour has portraits of the family, and sepia ones of parents who have left. The hearth is cold when there's no timber.
- **Live.** Whoever's home is in there: asleep in their own bed with their eyes shut, sitting up at the table behind their plates for supper, by the fire with tea, at the range baking, or pottering from room to room. People come in and go out by the front door, and speech bubbles show what they're saying.
- **Time and weather.** The windows show the real sky, rain and snow. Rooms darken at night, the lanterns come on while anyone's awake, and the fire is banked once everyone's in bed.
- **Hobby rooms.** Makers get a workshop (a pegboard of tools, a workbench with a half-carved badger, shelves of carvings and glazed pots, heaps of baskets and bundled reeds, a potter's wheel) or a studio (an easel and finished paintings of the valley). Collectors get a curio room: a glass cabinet of finds, pressed flowers and butterflies in frames, and a chart of every bird spotted. Knitters keep a basket of wool by the fire. Everything shown is what's actually been made or found.
- **Neon retrofits.** Wired-up homes get dark walls, neon strips and screens. Lost rift-born keep a corkboard of sketches and red string as they work out the way home.

Hover over anything for a closer look. Click a villager inside to open their panel. The `−` / `+` buttons resize the cutaway, and it scrolls sideways for bigger homes.

### Inside every other building

Every other building opens the same way: click it on the map, or *Look inside* on the panel of someone who's in there. It's a cutaway of the building under its pitched roof, furnished for its trade:
- **The inns:** a taproom with an inglenook fire, tables and a bar backed by barrels and bottles, the kitchen, and a lodgers' room with three narrow beds.
- **The Common Store, storehouse and granary:** a counter and shelves stocked with what's actually in the Store, loaf for loaf and sack for sack.
- **The mills:** millstones that turn and dust the air while the miller works, plus the sack loft.
- **The bakehouses:** ovens that glow while baking, a kneading table, racks of loaves.
- **The brewhouse:** a copper that steams while brewing, and a cellar of barrels.
- **Everything else:** the herbalist's stillroom, the woodwright's workshop and timber stack, the smokehouse with fish and hams in the smoke, and the rift-folk's machine rooms of flickering screens and charging racks.

Whoever's inside is at work at the right spot, sitting at a table, or asleep in a lodger's bed.

## Developer mode

Press `` ` `` (or the Dev button) to open a console drawer:

- **Brain** shows the selected villager's drives, body chemistry, current task and path, and every action scored and explained: the relief it promises for each drive, then each multiplier (learned habit, inborn taste, time of day, personality, mealtime, rain, winter and so on), with each top-three option's chance of being picked. Actions that are ruled out are grouped by why. It also lists their recent decisions with the runners-up, learned habits, relationships and memories.
- **Events** is a filterable log of what happens under the hood: decisions and conversations of the selected villager, trades taken up and changed, the chance of a baby for each couple each night, wedding rolls, moves between homes, town planning, rift scheduling and crew sizes, rift ways spreading, first meetings, the choice to go home, and the weather.
- **World** summarises the clock, population, trades wanted against filled, the Common Store with yesterday's comings and goings, homes and building projects, rifts, and what everyone is doing.
- **Tools** skip time (it runs the simulation for real), set the weather, start parties and fireworks, fill the stores, open rifts, push the way home along, and nudge the selected villager (hunger, sleepiness, loneliness, tipsiness, a cold, rift ways, age, education, or "choose again now").
- **Map overlays** label each villager with their action and most pressing drive, draw where they're walking, and show the tile grid, unwalkable tiles and surveyed lots.

## What's going on under the hood

### Ideas borrowed from the *Creatures* series

| In Creatures | In Merryfolk |
| --- | --- |
| Norns with drives (hunger, tiredness, loneliness, boredom, coldness, pain…) | Nine drives: hunger, thirst, sleepiness, loneliness, boredom, pipe craving, chill, aches, and an itch to work |
| Biochemistry: chemicals, toxins, bacteria | Body chemistry: tipsiness from ale (with wobbly walks and hangovers), germs (colds that spread through gossip and parties), toxins (toadstools), immunity. The Life tab shows them all |
| Medicine and the Health Kit | Herbalists gather herbs and brew remedies, then walk to the sick to nurse them. You can dose anyone with the Remedy tool |
| Reward and punishment (tickle / slap) shape behaviour | Pat and tut-tut nudge the learned weight of whatever they're doing |
| A brain that learns from experience | Every action's habit weight moves towards how much it actually helped. Food likes are learned from taste. Bitter experience teaches wariness of toadstools |
| Norns learning from each other | Imitation: villagers, especially children, copy what contented folk nearby are doing |
| Teaching with the learning computer | Education: every villager has an education level (unlettered, knows letters, schooled, well-read, learned). Little ones build it at the story circle, round the supper table, from storybooks, from grown-ups who explain things, and from your lessons. It shapes how they talk (everyone speaks in whole sentences, from plain and folksy to grand and bookish), which trades suit them, whether they read or head for the inn, and how fast they learn skills |
| Genome with crossover and mutation, the Genetics Kit | Inherited looks, including two-allele recessive genes for eye colour, freckles and curls (traits can skip a generation), thirteen personality traits, talents for nine skills, and inborn tastes. Mutations are noted in the chronicle and the Nature tab |
| Life stages: baby → child → adult → old | Baby (fed and cuddled by parents), little one, grown-up (comes of age at 33 with a party), elder |
| Breeding, eggs and the Hatchery | Every villager is female or male. Courtship (chemistry, sweethearts, flowers, dances) between a lass and a lad, weddings, expecting, baby girls and boys, twins. The *Invite a traveller* button brings a newcomer up the West Road |
| Family trees and the Owner's Kit | Kin tab, a family-tree view spanning grandparents to grandchildren, and the archive of everyone who ever lived here |
| The graveyard / photo album | The *Remembered* ledger: elders who set off on a last great adventure, with sepia portraits |
| Docking Station warp: sending creatures to other players | *Post a copy to a friend* packs a villager's genome, skills and habits into a code that another game of Merryfolk can receive |
| The hand picking creatures up | Drag a villager to carry them. Little ones love it; grown-ups grumble; drop them in the river and they'll remember it |
| Seasons, weather and ecology (Creatures 2) | Spring blossom, summer storms, autumn fog and falling leaves, winter snow. Crops follow the seasons; mushrooms boom in autumn; hearths burn timber in the cold |
| Grendels and Ettins causing mischief | Rabbits sneak out of the woods to nibble gardens (children and gardeners chase them off), and crows raid the barley. Click them to shoo |
| Observation Kit graphs | The Census ledger charts population, children and village mood day by day |

### Finding your way around

- **The top bar.** It shows the season, the day and time, then chips for the village chest (opens the Market), the village's rank and progress to the next era (opens the Charter), and contentment (opens the Steward's Desk). A ⚠ chip appears when a hazard is coming. The ⚙ menu holds music, how to play, the guide and developer mode.
- **The Charter tracker.** Under the top bar, a small card tracks the three open charters with progress bars. Hide it with –, or click it to open the Charter.
- **The Chronicle** has filters: ♥ Hearts (love, births, letters, parties), ⌂ Village (building, trades, seasons, learning), ✦ Rifts, and ⚠ Trouble (illness, quarrels, hazards). Unfound clues on the Rifts page each carry a riddling hint about where to look.
- **Notices.** They queue below the top bar, three at most, and never cover the buttons.
- **The ledger.** Five sections, each with its own sub-tabs, and the game pauses while it's open:
  - **Steward:** policies and workforce, plus trades.
  - **Charter.**
  - **Store & Market:** the market, plus the Common Store.
  - **Folk:** census and Almanac, the Remembered, and travellers.
  - **Rifts.**
- **Build tools.** Locked tools show a 🔒 with the era that unlocks them. Tapping one shows exactly what's still needed.
- **The Steward's Errands.** A short guide for new villages: meet a hobbit, pat them, lay a path, watch it built, check contentment, look at the charters, pick something to study, answer a petition, trade with a caravan. It can be skipped, or restarted from ⚙.
- **On phones.** Bigger touch targets, pinch to zoom, the chronicle starts folded, the villager panel keeps its buttons in reach, and build mode becomes a full-width dock with a scrolling row of tools.

### Running the village (the Steward's Desk)

The **☺ contentment** pill in the top bar opens the Steward's Desk, the first tab of the village ledger. It's where you make the choices that steer the village:
- **Contentment.** The whole village's mood as one number, with what's lifting spirits and what's weighing on folk. A contented village (66% and up) gets talked about on the road, and travellers come up the West Road hoping to settle, more so if a hole stands empty. A discontented one draws nobody.
- **Rations** (as in Stronghold). *Lean* half-portions stretch the food a long way, but folk feel the short rations. *Generous* and *Feasts* mean bigger helpings and a merrier village, and the Store empties fast. The desk shows how many days the food would last at the current rations.
- **Ale.** *Dry* (the barrels last, the taproom sulks), *a pint or two*, or *flowing* (merrier evenings, twice the ale used).
- **The working week.** *Easy* adds Sunday off (less done, happier folk); *Busy* cancels Highday (more done, wearier folk).
- **Economy board.** For every good: what's in the Store (against its capacity), what was made and used yesterday, and how many days it would last if yesterday repeated. The chains (barley → flour → bread, barley → ale, apples → pies, vegetables → stew) are checked for their bottleneck, with a plain-spoken warning: *Flour is piling up but the bread shelves are bare: more bakers.* It also warns when food is under a day or the builders are starved of timber.
- **Building works.** Every project in hand with its progress and what it's waiting for (timber, scrap, hands). Mark one **Do first** and the builders put their backs into it.
- **The Steward's orders.** Things coin can buy at any time:
  - throw a village feast (30 pennies and 25 helpings: spirits lift for days)
  - send for dwarf masons (50: building twice as fast for two days)
  - buy books from Bree (20: +15 lore)
  - hire day labourers (25: every crop brought on)
- **Shortages bite.** Famished folk can't put their backs into their work, at their trade or on the building sites. Folk who stay miserable for days start talking about moving to Bree (the Chronicle says so, and the desk lists who and why). Cheer them up and they'll stay, glad they did; leave it, and unattached grown-ups pack a cart and go.
- **Idle hands.** Trades whose workers are standing idle are flagged on the desk with the reason (*the flour bins are full*, *no letters in the bag*), so you can move hands elsewhere or sell off the surplus.
- **Workforce** (as in Age of Empires). Every trade shows hands now against hands wanted. Use − and + to set how many each trade should have: folk are moved over from trades that can spare them (the best-suited first) or let go to find other work. *auto* hands a trade back to the village.

### The Lamplighter's Children: the story of the rifts

Why do the rifts open? The rift-folk aren't invaders. Centuries ago a Thistledown tinker, Mungo Fernsby, walked into green lightning carrying a copper kettle. In a cold, dark world he built a kettle-dynamo and a tending-engine called the Lamplighter, and the city of Neverdark grew around it. Now Neverdark's power is failing, and the fading Lamplighter is sending its children back to "the place where the dark is soft".

The village pieces this together from **clues**: the kettle sigil on every rift-born's sleeve, a city lullaby the old folk know the words to, a coin stamped with a round door, whispers on the Relay, golden edges on the rifts when the dynamos run strong, a name in an old ledger, and at last the Lamplighter's own voice. Each turns up in the Chronicle and is collected on the **Rifts** tab of the ledger.

The story moves through stages as the village changes:
1. Strange weather
2. Folk out of the sky
3. The first kettle
4. Lights in the hollow
5. The Relay sings
6. Mungo's name
7. Two hearths
8. The Long Dim

Each stage has its Chronicle beat and changes something: wariness of the rift-folk eases a great deal once Mungo's name is found, and at Two Hearths there's a feast. Twice the Steward must decide, at a **Moot**:
- **When the third rift-born arrives homeless.** *Open doors* means empty holes go straight to them, while some old folk grumble. *Sponsor a stranger* means a willing household takes each one in, with supper invitations. *Wait and see* leaves it to folk.
- **At the Long Dim.** *Hearthlink* lends the village's river and wind power through the Relay: the rifts become steady golden doors, letters come from Neverdark, and the rift-folk can come and go. It needs the Dynamo and Turbine. *Soft close* sings the rifts shut for good, and the rift-folk stay as Thistledowners. Or you can *let it drift*.

Every rift-born has their own story:
- a memory of home (rain on neon, the night market)
- a hidden skill the village comes to value (courier, grid-tech, street medic, noodle cook, teacher, rooftop grower), which steers them to the matching trade
- someone they lost, who sometimes steps out of a later rift for a tearful reunion
- a turning point, when a wary neighbour becomes a true friend in a scene of its own (a letter carried through the rain, a mill-wheel fixed after forty years)

Hill-folk invite rift-folk round to **supper** ("Is tea a stimulant or a ritual?" "Yes."). The two peoples swap **customs**: mushroom ramen, the Low Battery Blues, neon bunting, saying "full signal" for happy, second breakfast, the Willow Lamp song, the maypole. Customs spread between friends, and once eight folk know one it becomes a Thistledown tradition.

### The giant hand's gifts have a cost

The toolbar's gifts come out of somewhere:
- **Taken from the Common Store** (and not possible when there's none): a seed-cake (1 cake), a keg (6 pints of ale), a pouch of pipe-weed (3) or a remedy (1).
- **Paid for in pennies:** a storybook (3), a patch of flowers (1), fireworks (8).

Fireworks in the party field start a party at most once a night.

### Petitions and the village's interests

Every couple of days one of the village's interests brings a petition to the Steward:
- **The farmers:** plough a new field? all hands to the harvest for a day?
- **The craftsfolk:** fell the old copse for timber? a brewing contest with Store barley? a trade pact with Bree for a Sunday caravan?
- **The elders:** a quiet hour with no hammering? longer school hours?
- **The young folk:** a dance every Highday?
- **The rift-folk:** neon lights in the square, from salvage?
- **The little ones:** a swing on the party tree?

Each is a real choice with a cost and a benefit, and each pleases some and disappoints others. A 📜 Petition chip pulses in the top bar until you answer; you can think it over, but leave it a day and it's taken as a no. How each interest feels about the Steward (*devoted*, *pleased*, *neutral*, *grumbling*, *fed up*) is shown on the Steward's Desk. Folk whose interest is listened to are cheerful about it; those who feel ignored grumble. Granted petitions leave their mark: neon strung round the square glows after dark, and the little ones queue for the swing on the party tree. Moots, petitions and the Almanac wait their turn rather than interrupting each other.

### Charters, renown and the eras of Thistledown

The **coin pill** (pennies and the village's rank) in the top bar opens the **Charter** tab.
- **Charters.** Three goals are open at a time, chosen from what suits the season and the village: lay forty yards of new path, plant trees, put up benches, light twenty lamps on a single night, grow to so many folk, dig new hobbit-holes, welcome babies, see a wedding, keep contentment high through a whole day, put by jars for winter, stock timber or ale, deliver letters, make one of the rift-folk at home with three hill-folk friends, sell to the caravans. Each shows its progress and pays pennies and renown when it's met, and a fresh one takes its place. You can swap one you don't fancy, once a day.
- **Eras.** Renown, folk, charters met, contentment and public buildings carry the village through its eras: **Hamlet**, **Village**, **Market Town**, **Shire Town**. When everything's in place the Chronicle says so, and it's your call to hold a **Moot** on the party field. The village votes itself up a rank, throws a party and is proud of it for days.
- **Traditions.** At each Moot the village also chooses what it will be known for, and keeps it:
  - **Village:** farming (crops grow faster), building (works go faster) or merrymaking (parties lift spirits longer).
  - **Market Town:** commerce (better prices), learning (more lore) or hospitality (travellers settle more readily).
  - **Shire Town:** renown (charters pay more), tidiness (everywhere is lovelier) or the great outdoors (gentler hazards).
- **Unlocks.** Each era opens new build tools:
  - **Village:** raising and lowering the land, digging and filling ponds, siting public buildings, and new wells.
  - **Market Town:** stone statues of famous hobbits (30 pennies).
  - **Shire Town:** fountains (60 pennies), and a **Great Fair** at every season's festival, with contests, a caravan in the square and renown.

  Locked tools show greyed in the build bar, saying what unlocks them.

### Appeal and the notice board

- **Appeal.** Every spot in the village has an appeal from what's around it:
  - flowers, trees, hedges and bushes
  - benches and lamp-posts
  - statues and fountains, which count most
  - water nearby
  - bare dug earth counts against it

  Folk whose holes look out on lovely or delightful surroundings are happier, and a drab outlook wears on them. The Kin tab shows each home's outlook, and in build mode the **Appeal** button paints it over the map, as SimCity paints land value. Hovering says how lovely a spot is.
- **Soil.** Crops grow faster on good ground: rich river alluvium best (+25%), then loam, heavy clay (−15%), and thin stony ground worst (−35%). Hovering the Field, Orchard, Woodlot, Tree or Flowers tool tells you what the soil is like, and a field's ghost shows its expected barley yield before you commit.
- **The minimap.** A map of the whole valley in the corner shows folk, plans, flooded ground and request pins. Click or drag on it to look around.
- **Requests.** Every day or two someone pins a note to the board in the square: "A bench by the river would be lovely", "It's awfully dark near Crumblebank Delving of a night", "Some flowers near the Bakehouse would cheer everyone up". In build mode each request shows as a red pin with a circle around it, and is listed in the build bar. Click one to fly there with the right tool picked up. Build the thing inside the circle and the one who asked is delighted, and the village earns 8 renown and 5 pennies. Unanswered notes come down after five days.

### The weather's moods: seasonal hazards

Most seasons bring one trial. It always comes with a day's warning in the Chronicle and a pulsing ⚠ pill in the top bar; click the pill to see where. Nobody is ever hurt, but you'll want to plan:
- **Spring flood.** The river bursts onto its low meadows, shown as water over the land. Crops growing there are lost, and holes by the water get damp. Raised ground holds it back: banks you raise along the river with the Raise tool act as levees, and in build mode the meadows at risk are tinted while a flood is coming.
- **Summer drought.** A dry spell: crops grow at a third of the pace, except within reach of water (the river, a pond, a well), shown in build mode. Ponds and wells by the fields are the answer.
- **Autumn blight.** A barley field sickens and stops growing. The herbalist (or a farmer) treats it with herbs from the Store, or you can buy dwarf sulphur (15 pennies) on the Steward's Desk to clear it at once.
- **Winter hard frost.** Bitter nights: every hearth burns twice the timber, so stock the woodpile before it comes.

Weathering a trial without loss leaves folk proud of it.

### The Almanac

At the turn of every season the Almanac opens with a report on the season just gone, like SimCity's yearly report:
- folk gained or lost, and those born, wed and departed
- average contentment
- food made against food eaten
- coin and renown
- charters met and things built
- three of the season's best stories

Then the Steward's clerk gives advice on what to see to next: winter's coming and the jars per head are low, spirits dipped, the village ate more than it made, timber's short, notes are waiting on the board, or a Moot is ready to be called. The last report stays on the Census tab.

### Expeditions beyond the valley

From the Charter, send a brave hobbit to explore beyond the valley: the north hills, the east forest, the southern fens, or along the West Road. It costs 15 pennies and 10 helpings for the pack. They're gone two days, and come back with a tale, 10 renown and a discovery that opens something new:

| Where | What might be found |
|---|---|
| North hills | A stone quarry (stone to sell; statues cost half) or upland pasture (half as much wool again) |
| East forest | Old-growth timber (more from every felling) or wild bees (honey) |
| Southern fens | A peat bog (winter hearths burn peat before timber) or a clay pit (clay to sell) |
| West Road | A cache of old coins (+60 pennies, and mathoms) or a friendly hamlet whose wagon comes every Hevensday |

Each region can be explored once.

### Lore: what the village learns

Every hour of reading by the fire, every letter written, every lesson at the story circle adds a little **lore** (the more schooled the reader, the more). On the **Lore** page of the Charter you choose what the village studies next, and each discovery changes how the village works for good:
- **Old knowledge:** crop rotation (+15% growth), smoking and salting (40% less spoilage), herb lore (twice the remedies), bee-keeping (+50% honey), hedge-laying (lovelier hedgerows), dry-stone walling (faster terracing, floods take half the crops).
- **Craft knowledge** (needs two from the row above): mill gears (+25% flour, bigger flour store), brewing lore (+25% ale), cold frames (gardens grow through winter), wells and pumps (wider watering in droughts), master masons (+30% building).
- **Deep knowledge:** the Weather Almanack (two days' warning of hazards, gentler droughts and blights), the Lending Library (+50% lore), rift-and-hill engineering (an easier Hearthlink).

Progress on a study you switch away from is kept.

### The market and the caravans

On Trewsday (market day) a trader's wagon rolls up the West Road and stands in the square from eight till five. Once Thistledown is a Market Town, traders come on Mersday too. Each trader is different:
- the Bree carter
- a dwarf pedlar from the Blue Mountains
- a Tookland cheesemonger
- once the rift-folk have come, a rift scavenger with a cart of salvage

Open the **Market** tab of the ledger to trade:
- **Sell** what the village can spare. Each trader pays half as much again for the two things they want most, and the price falls as you sell them more. A ⚠ warns when the Store is low on food.
- **Buy** what it's short of, such as timber, flour, cheese, remedies or scrap. Prices rise as you buy.
- **Dwarf masons** (40 pennies, from the pedlar) double the pace of every building job for two days.

Coin also pays for statues and fountains, and selling counts towards charters.

### Shaping the village (build mode)

Press **Build** (or <kbd>B</kbd>) to shape Thistledown yourself. Pick a tool and click or drag on the map:
- **Path:** drag a footpath across the grass.
- **Flowers** (a penny): sow a bed of wildflowers in season.
- **Tree:** plant a young oak, birch, apple or poplar.
- **Hedge:** drag a straight hawthorn hedgerow.
- **Bench** (2 timber): a place to sit and gossip.
- **Lamp** (1 timber): a lamp-post that joins the lamplighter's round.

Drags are filled in tile by tile, however fast you move. A plan nobody can reach is marked *can't reach it*, and the Chronicle says so.
- **Clear:** drag a box over trees, bushes, hedges and stones. Felled trees give timber to the Store.
- **Raise** and **Lower:** lift or sink the ground a terrace at a time, three tiles across, and the banks reshape around it.
- **Pond** and **Fill in:** dig water, or fill in what you dug. The river is left alone.
- **Field:** have the farmers clear and plough a new 9×6 barley field. Scrub and trees are cleared as they go (felled trees give timber), and a knoll only surveyed for a future hobbit-hole can be given over to it.
- **Orchard** (1 timber): plant apple trees in rows.
- **Woodlot:** plant saplings that grow into timber stands the woodwrights can fell again and again.
- **Hive** (1 timber): set out a beehive.
- **Hobbit-hole** and **Well:** stake out a new knoll or well anywhere there's room and a way in. The woodwrights dig it like any other.
- **Buildings:** choose where the village's next public building (storehouse, smokehouse, second inn, bakehouse) will go, and start it now.

A green or red ghost previews every stroke, with the cost or the reason it won't go (*too close to a building*, *that's the river*). Nothing appears by magic: each stroke becomes a plan, pencilled on the map with stakes, and grown-ups with time on their hands (woodwrights first) come and do the work, paths tile by tile. They take timber from the Store, and a plan waits if the Store is short. **Undo** (<kbd>Ctrl</kbd>+<kbd>Z</kbd>) or **Cancel plan** takes back anything not yet started, at no cost. When something's finished, passers-by admire it ("Ooh, a new bench!") and the builder is proud of it. Everything you build is saved and put back when the valley is rebuilt.

### Life in the village

- **Feelings.** Besides their needs, folk carry a handful of passing feelings, each with a reason and a while to last: *Danced at the party*, *Had my favourite: honey cakes*, *Slept soundly*, *Had words with Rose*, *Caught in the rain*, *Slept rough*, *A present from Bilbo*, *Just married!*, *A new baby in the family*, *Proud of my new carved badger*, *Getting good at baking*. Some are states and last as long as the state does: merrily tipsy, a sore head, warm and cosy by the fire on an autumn evening, a cold hearth at home, no roof of one's own, happily married. Each lifts or sinks their mood a little (within limits), they're listed with their weight on the villager's Life tab, and whatever's most on their mind comes out when they muse aloud.
- **Trades.** Grown-ups take up a trade: farmer, herder, miller, baker, brewer, innkeeper, leaf-grower, fisher, woodwright, herbalist, orchard-keeper, postie, storyteller, nanny or (for the rift-minded) tinker. The choice comes from their talents, the skills they've practised, their family's trade, what they watched as an apprentice child, and what the village is short of. Trades can change as experience grows, and you can steer anyone from their Work tab.
- **Being poorly.** A cold is the sniffles for a day. In the colder months a cold can turn to **flu**, especially for the old and the frail: the patient is laid up in bed for a couple of days, too weak for work or play, and the Chronicle says so. Friends and family rally round with a **pot of soup**. They come to the door, sit a while, and leave the patient cheered, mending faster and grateful. A tumble chasing rabbits or a slip at heavy work can mean a **sprained ankle**: a hobble at half pace and no heavy lifting for a day. The Life tab's health chips show it all. Nobody ever dies of it.
- **Family dynamics.** Every parent and child have a way of being together that comes from their natures, shown on the Kin tab: *Close*, *Jokesters* (forever teasing), *Competitive* (everything's a contest) or *a bit Distant*. It colours family dinners ("Who put salt in my tea? WHO?") and how everyone feels afterwards, and the memories bedtime stories leave.
- **Sentiments.** How one villager feels about another, and why: *Grateful (nursed me when I was poorly)*, *Fond (brought me flowers)*, *Welcomed (supper together)*, *Touched (a letter)*, *Hurt (that squabble)*, *Prickly (winning the best pie)*. There are up to three per friend, fading with time, shown as chips under each friend on the Kin tab. They warm or cool the friendship, and come out when the two meet: "Thank you again for the flowers, Rosie!"
- **Likes and dislikes.** Everyone loves two things and can't abide one: the rain, mushrooms, music, gardens, rift-tech, peace and quiet, a good crowd, poetry, sunshine, animals (on the Nature tab). Folk who share likes become friends faster, and clashing tastes slow it. A rain-lover is happiest in a downpour, and a crowd-hater is glad when the party's over.
- **Friendly rivals.** Some of the more competitive grown-ups have one rival, usually in the same line of work. At the autumn Harvest Fair and at summer market-day shows they compete (the biggest marrow, the best pie, the finest ale, the cleverest gadget) and the Chronicle reports the results. The Kin tab keeps the score. Rivals who've become friends at heart shake hands and call it a draw.
- **Inspirations and sulks.** Someone who's been very happy for a while may be struck by inspiration:
  - a baking fit that fills the Store with seed-cake
  - a burst of creative work
  - matchmaking two singles
  - itchy feet and a walk round the valley that turns up an oddity

  Someone miserable for a while may sulk: shut indoors with the curtains drawn, comfort-eating through the larder, or off on a long huffy walk. A good natter, a letter, a present or a pat brings them round.
- **Masterpieces.** Once in a lifetime, an inspired and skilled maker is seized by a fey mood and comes out with a named masterpiece (*Bramblecup, a great jug that shows the day they married Rose*). It becomes a family heirloom, earns renown, and is listed among the Treasures of Thistledown on the Charter tab.
- **Heart scenes.** Short moments between two folk, played out on the map in a few exchanged lines when the time, the place and their feelings are right:
  - friends confiding a dream at dusk
  - sweethearts holding hands under the lanterns
  - two who squabbled making it up
  - an elder telling a grandchild about the folk on the Remembrance Green
  - two friends counting stars on a clear night
  - a homesick rift-born comforted (and dragged round for supper) by a hill-folk friend
  - new parents at their door
  - rivals trading barbs in the square

  Each pair sees each scene once, and it leaves its mark: a sentiment, a stronger bond, a memory. Its Chronicle line can be clicked to fly to where it happened.
- **Wishes and dreams.** Folk carry a wish or two at a time, chosen by their nature and how things stand: a plate of their favourite, a pint at the Tipsy Badger, a dance at the next party, a good natter with an old friend, making it up after a squabble, finishing a carving, catching a fish, a bright day after the rain, a sweetheart, a little one of their own, a roof of their own. A wish leans them a little towards what would grant it, they muse about it aloud, and when it comes true they're delighted for a day. Some are yours to grant, and the Mind tab says how: drop a seed-cake or a storybook nearby, set off fireworks, roll out a keg, give them a pat, a lesson or a remedy. Wishes that don't come true in a day or two fade. Every grown-up also has a dream for their life (become an expert at their trade, raise a big family, have ten good friends, marry their true love, fill the house with their carvings or finds, become the most learned hobbit in the valley, or for the rift-born, make a real home among the hill-folk), with its progress on the Mind tab. When one is lived, the Chronicle tells of it and they glow with it for days.
- **Pets.** Now and then a household takes one in (a stray tabby from the inn yard, a puppy from a farm litter, one of the herder's collie pups) and the little ones usually get to name it. Dogs go everywhere with their favourite person, trotting at their heels down the lanes and out to the pens (setting off once they're a fair way ahead, slowing as they catch up, and sitting at heel facing the way their person does). Pets are drawn side-on, coming towards you or going away, whichever way they're headed. Cats keep near home, sit in the sun on the doorstep and wander off on business of their own. Both come in at night and out of the rain. Folk passing stop to make a fuss of them (a purr, a wag, hearts), which does everyone good, and a pet curled up by the fire makes home cosier. A few founding households start with one; each household's pet is on the Kin tab.
- **Gossip (the harmless sort).** Whatever the Chronicle hears of (a wedding, a new baby, a birthday, an elder setting off, a rift-folk friendship, a new trade) a few folk hear of first: whoever's named in it, a couple of others, and the innkeeper, who hears everything. Then it goes round: in natters in the lane ("Did you hear? A baby boy, Podwick, has arrived!" "Well I never!"), among anyone sharing a room or standing within earshot, round the dinner table, and fastest of all in the taproom of an evening. Each bit of news is only news once, so you can watch it spread: the Census tab lists the talk of the village and how many have heard. It's always news, never spite.
- **Word of mouth.** What folk say to each other changes what they feel, know and do. A natter (or talk round the supper table, or in the taproom of an evening) can carry a message, and each message has one or more intents:
  - *Swaying a choice.* Folk remember what went well (a dish they loved at the inn, a good day's fishing, a hobby session, mushrooms up in the woods) and rave about it: "You must try the pumpkin cake at the Tipsy Badger, Rose!" The listener is pulled towards it for the next day or so, more if they trust the speaker, are open-minded and it suits their own tastes. At the inn they order the dish they heard about. Try it and like it, and they thank the friend and start recommending it themselves; dislike it and the friend's word counts for a little less. A dreadful meal earns a warning instead, which puts folk off.
  - *Passing on knowledge.* The inn has a dish of the day, from what's plentiful in the Store and in season (rhubarb pie, pumpkin cake, mutton hotpot, roast pumpkin). The innkeeper and whoever eats there know it; everyone else hears by word of mouth, and the Census tab shows how many have heard.
  - *Lifting or sinking a mood.* A cheerful friend tells a glum one to keep their chin up (and they feel better for it); a grump moans and spreads a little gloom, which merry folk shrug off. Folk brag about a new skill or something they've made.
  - *Invitations* to the coming party or the Mersday sing-song.
  - *Tips and tricks.* Someone who knows their craft (a trade skill or a hobby) passes on a tip to someone less practised: "Soak the reeds overnight and they won't split on you." The listener gets a little better at it, and a tip about a hobby they don't have can make them curious. Curious folk give it a go (twice) and, if they enjoy it, take it up: "Daisy has taken up basket-weaving, after Bilbo showed her the knack."
  - *Apprenticeships.* A skilled hand at a day trade or a hobby can take on an apprentice: a youth of twenty or more, or a young grown-up still new to their trade, or anyone new to a hobby. It's offered in conversation ("You've a feel for the wood, lad. Come along with me and I'll teach you properly"), or the keen go looking for a master. While the master works, the apprentice comes along and learns several times faster than on their own, with instruction and questions back and forth. When they've caught up (or reached a skilled hand's level) they finish their apprenticeship, in the Chronicle, grateful to their master and with a head start for the trade. Lessons that lapse for five days end the arrangement. The Work tab shows apprenticeships and who someone is teaching; the Census tab lists the village's masters and apprentices.
  - Each message's effects show in the Mind tab (*Word of mouth*), in the dev Brain as multipliers ("Rose said so ×1.6"), and in the dev Events log under *talk*.
- **Letters and the post.** Folk who've had some schooling sit down at home and write letters: a thank-you after a birthday present (the gift named), an invitation to tea, news for a friend or family in another hole. Adventurers away on the road write home. Every letter goes into the mailbag, and the postie takes them round door by door, oldest first, calling "Post!". A letter through the door is a lift for a day, warms the friendship, and is remembered word for word. Until the village is big enough for a postie, neighbours pass letters on, a day late.
- **Mathoms.** A mathom is anything a hobbit has no use for but can't bring themselves to throw away, and every hole starts with a few: a chipped blue teapot, a clock that runs backwards, a vase shaped like a frog. Since it's the birthday hobbit who gives the presents, many birthday presents are mathoms given on, and each one keeps count of how many times it's been passed round (the Chronicle notices when one reaches its fifth birthday or ends up back where it started; nobody has ever used it). Adventurers bring new ones home: a carved troll, a dwarvish spoon. Each hole's mathoms are listed on the Kin tab.
- **Putting by for winter.** Nothing much grows in the cold months, so from the last day of summer and all through autumn, grown-ups put food by: apples bottled into bramble-apple jam, vegetables pickled, fish smoked, from their own pantry first and then a fair share of the Store (the careful are keenest, and a good cook gets an extra jar out of a batch). The jars sit on the top pantry shelf, where you can see them, and never spoil. In winter, when the pantry runs low, a jar or two comes down each morning. On the first morning of winter the Chronicle reckons up who has full shelves and who has worryingly bare ones, and the households feel it.
- **Farewells and the Remembrance Green.** Nobody dies in Thistledown, but the old do leave: when an elder's time comes they set off on a last great adventure over the hills. One who makes up their mind in the night sets off mid-morning, not in the dark. First they take a day for **last wishes**: one more natter with their dearest friend, one more pint at the Tipsy Badger. These lean their days and you can help, and the Chronicle tells which came true; the Remembered tab keeps them with the stone. At nine on the morning they go, their family and dear friends gather at the door to see them off, and the elder hands a keepsake down to a child or grandchild (*Heather's walking stick*, *Grandpa's pocket-watch*, shown on the Kin tab). At ten they walk off down the West Road while everyone waves and calls goodbye. Those left behind miss them for a couple of days. A carved stone goes up for them on the Remembrance Green, a quiet lawn with a yew and a bench, and the folk who loved them go and sit by it now and then, telling them the news and sometimes leaving flowers.
- **The week, and birthdays.** Thistledown keeps the Shire's seven-day week (Sterday, Sunday, Monday, Trewsday, Hevensday, Mersday, Highday), shown in the top bar. Trewsday is market day and the square is busy with baskets; Mersday evening is the sing-song at the Tipsy Badger; Highday is the day of rest, when the trades mostly down tools (the innkeeper, lamplighter, nanny, herders and postie excepted), folk lie in and the day goes on gardens, hobbies, fishing and long teas. Everyone has a birthday once in the village's year (on the Kin tab, with today's in the top bar's tooltip), and as is proper among hobbits, the birthday hobbit gives the presents: something for everyone at home over breakfast (often a thing they made), then a round of visits to family and dear friends in other holes, leaving it on the doorstep if they're out. Little ones get a present from their parents too.
- **The lamplighter.** There's no electricity: the lamps along the lanes and round the square burn oil, and they stay dark until someone lights them. The village lamplighter (two once the village is big enough, one taking the west side and one the east) puts down whatever they're doing an hour and a quarter before sunset and walks briskly from lamp to lamp, nearest by the lanes next, reaching up with the pole, and stops for any unlit lamp they pass on the way (whichever side it is on). Each lamp's glass only glows, and its wide pool of light only spreads, once it has been lit, so the lamps come on one after another as the light goes. After sunrise they go round again and put them out.
- **Lanterns.** Nobody goes out after dark without a lantern. It swings in their hand as they walk, casting its own small pool of light, and is set down on the ground beside them while they sit, work or have their hands full (dancers leave theirs at the tables).
- **Skills.** Nine skills improve with practice, faster with talent and education. Better hands produce more.
- **Cider.** Brewers press surplus apples into cider at the brewhouse (3 apples make 5 pints). The taproom pours it when the ale runs out, and the dwarf pedlar and the Bree carter pay well for it, so apples go either into pies or into cider.
- **The economy.** Everything flows through the Common Store: barley → flour → bread, barley → ale, apples and honey → pies and cakes, vegetables and fish → the innkeeper's stew, timber → hearths and new homes, herbs → remedies. Food spoils (except in winter's cold), larders are stocked from the Store, and in lean times folk grind barley at home.
- **Homes and growth.** Every married couple wants a hole of their own, and grown sons and daughters move out when a spare one is going. Woodwrights always keep a spare hole or two ready, digging the old knolls first and then fresh ones surveyed across the map (over 30 homes in all), with timber kept back so the hearths never go cold. Every hole is dug into its own hillside rather than sitting under a dome: a lopsided, lumpy rise that fades into the meadow, wider on one side so the door sits off-centre, with its south side cut back into a curving dry-stone face (mossy, with grass hanging over the top). The top of every hill grows wild: clumps of long grass, drifts of wildflowers (a spring kind, a summer kind and one that lasts into autumn) and a fern, sprig of heather or leafy plant or two, more on the bigger hills, all kept clear of the stone face, the windows and the chimneys. The face is tall enough to hold the door with its stone surround and keystone, and the windows beside it, each under a flat lintel stone and on a sill (the outer ones peep out of the slope); a raised flagstone terrace runs along its foot, and stone steps lead down from the door to the lane. Each hole is a little different: door style, stone, timber or brick surround, round or shuttered windows, porches, lanterns, flower boxes, rooftop wildflowers and garden apple trees.
- **Public works.** As the population passes each milestone the village builds a second and third well, a storehouse (stores hold half as much again), a smokehouse (food keeps twice as long), a second tavern, a second bakehouse and two more barley fields. Construction shows on the map: scaffolding rises, fields are staked and furrowed. The *Stores* ledger lists everything under way.
- **Farmland.** A sheepfold, cow paddock and pig sty are tended by the herder (cheese for the larders, wool for winter woollens that keep folk warm); farmers work vegetable allotments as well as the barley; two orchards and plenty of garden apple trees; two watermills and a windmill grind the flour.
- **Doors and windows.** Every building sets its windows into the wall: a timber lintel over each, a frame, a shadow down the inside of the lintel and the left jamb where the glass is recessed, and a stone sill or a flower box under it. Doors are arched and hung in a dark frame, with a lit jamb on the left, shadow under the arch, planks, a brass knob and a stone threshold in front. The eaves cast a shadow along the top of the wall, and chimneys are lit down one side with a capstone and a pot.
- **The look.** Top-down pixel art in the manner of A Link to the Past, Moonlighter and Stardew Valley. Every world pixel is a crisp square block: the ground is painted one colour per pixel in deep greens, earthy lanes with a dark ragged rim, cobbles of varied stone with moss in the joints, furrowed fields, and water running from navy in the middle to a pale line of foam at the banks, with smooth shading dithered down to a few tones; grass grows in little tufts. The ground is kept in chunks of 32×32 tiles, each painted when it first comes into view (a flat sketch for a moment, then the real thing, nearest the camera first, a few milliseconds a frame) and let go again when it has been out of sight longest, so a big valley costs no more to hold than a small one; the chunks join without a seam, and a change of season repaints each as it is seen, fading from the old. Only the scenery and grass near the camera are considered each frame. Every sprite is ringed in a darkened shade of its own colour rather than one ink. At dusk the whole valley warms, and at night lamps, windows, doors and hearths cast stepped pools of light, four crisp rings each, indoors and out. Villagers are drawn at double resolution (two canvas pixels to every world pixel), shape by shape from their genes: faces with brows, shining eyes, blush and pointed ears; tidy, long, tousled or curly hair; waistcoats with buttons and a watch chain, skirts, big hairy feet; spectacles and beards on the old; visors, chrome eyes and neon-piped synth-weave on the rift-minded. Zoom moves in even steps so every half-pixel lands on whole screen pixels. Folk walk with a four-step cycle (stride, pass, stride, pass) with swinging arms and a little bob, raise a hand to their work, fling their arms up to dance, blink every few seconds and shut their eyes to doze. On a chair or bench they sit with their feet down; on the ground they sit cross-legged, or side on with their legs stretched out and toes up.
- **The lie of the land.** The world is worked out in stages, each reading the ones before (the way Dwarf Fortress builds its worlds): height, then slope and which way the ground faces (south-facing slopes are sunnier), then drainage (hollows are filled, every tile drains downhill and the flow gathers into runnels), then wetness from that flow and nearness to the river and pond, then soil (rich alluvium on the low flood ground, loam on gentle slopes, thin stony soil on the heights and steep banks, heavy clay where it's wet and flat). What grows and lies where comes from these. Built-on ground is levelled first: fields, buildings, the square, pens, orchards, allotments, gardens and the plots surveyed for building each sit on a flat pad at one terrace's height, with a margin for hedges, fences and doorsteps, blending back into the hillside over a couple of tiles, so no bank runs through a barley field or under a bakery. Trees and bushes aren't planted where a bank runs through. Developer mode can paint any of them over the map (the *land* overlay).
- **The land.** The north bank climbs towards the Hill and both banks fall away to the river, with hill-shading and terraced banks. On broken or rugged relief (every valley made since the setting arrived) the swells are pushed towards their tops and bottoms, giving flat shelves with steep sides between, ridgelines run across the land and small knolls and hollows are scattered about; the old valleys are smooth. Every terrace bank is a face of bare earth under a lip of hanging grass, taller for a bigger drop, with darker strata, stones and roots in it, a dark line and a shadow along its foot; where an edge runs up and down the map the earth shows as a narrow rim down its side. Where a lane climbs a bank it is cut into the earth as a short ramp of worn steps. Chimneys smoke whenever the kettle's on. Paths, the river and the pond are painted with flowing curves (each point blends the tiles around it, so corners round off and stepped diagonals become smooth bends), while the tiles folk walk on stay the same. The lanes themselves were laid by the easiest way between their waypoints: they keep to the contours, take terrace banks at an angle, avoid wet ground and merge where they meet, while river crossings stay straight as bridges. Folk find their way with A* over the tiles: they keep to roads and cobbles, cut across grass only when it saves a fair way, and treat terrace banks as steep. They climb where a road or path makes a ramp unless there's no other way round. Fences, barrels, mailboxes and other props block their tiles.
- **Wind and weather in the trees.** A breeze blows across the valley in slow swells and rolling gusts: gentle on a clear day, stiff in the rain, wild in a storm, still in the fog. Trees lean and sway with it (tops more than trunks), bushes stir, and long grass and riverside reeds ripple as the gusts pass along.
- **Cliffs.** Out in the wilder land, well away from the village, the ground here and there steps up a whole terrace at once in a rocky escarpment: a tall face of weathered, lichen-spotted boulders lit from the upper left, grass hanging over the lip in a ragged fringe, a hard dark line and a shadow scattered with fallen stones along the foot, and a rock edge where the land drops away to the north or the side. They are mossy in spring and summer, ochre in autumn and snow-capped in winter. Nobody can climb a cliff and nothing grows on its face. On broken or rugged relief the steepest of the natural banks nearer the village are bare rock too (crags), though the land isn't raised for them. Where a lane runs up a cliff or crag, or a ledge above would otherwise be cut off, stone steps are cut into the rock. Scree, fallen stones and the odd boulder lie along the foot of the rock, with foxtail and bracken among them, and gorse, heather, thistles and foxtail grow along the lip above. Raising or lowering the ground right by a cliff isn't allowed. Valleys from before there were cliffs keep their old shape.
- **Trees, bushes, grass and rocks.** Woodland grows where nobody has cleared it: on steep thin-soiled banks and wet clay, thick along the valley's edges and in the eastern forest, thinning out with a ragged edge towards the lanes, fields and homes. Trees are spaced by size (a big oak keeps the ground round it to itself) and each kind grows where it suits: oaks and beeches on deep loam and clay, with the odd copper beech, birches and pines on thin dry soil and the heights, poplars on the damp flood ground, saplings at the woods' edge. Hawthorn hedgerows run round the barley and leaf fields and along the country lanes outside the village, white with may blossom in spring, red with haws in autumn and bare in winter, with gateways every few yards and an oak or birch left to grow up out of the hedge now and then (a check opens any hedge that would cut someone off). Bushes gather along the edges by kind: gorse and heather on dry banks, ferns and holly in the shade, brambles and thorn along the margins. Every tree's size and shape comes from its seed: its crown is a scatter of leafy lobes that leans a little one way, lit from the upper left and dithered between five greens. There are broad old oaks and spindly young ones, domed beeches and dark red copper beeches, slim silver birches, tall narrow poplars, saplings (some a fresh lime green), pines with three to five tiers of boughs (some bluer than others) and firs of every height, and weeping willows along the river and round the pond, all turning with the seasons. Bushes come in seven kinds that change through the year: leafy mounds, brambles with blackberries, hawthorn and wild rose, gorse in yellow bloom, fern clumps that bronze in autumn, holly with red winter berries, and purple heather. Out in the open, away from the lanes and doorsteps, the grass grows in thick stands of tall meadow grass that fray out at the edges: anyone walking through is hidden half to three-quarters of the way up (little ones nearly to the chin), with seed heads in summer, gold in autumn and flattened straw in winter. Weeds and wild plants come in twelve kinds, each through the year and swaying in the wind like the long grass: dandelions, plantain and clover along the lanes; nettles and docks round homes and farms; thistles, ragwort and sorrel at the field margins and on the thin dry banks; cow parsley in lacy umbels at the woods' edge; bracken in the shade, bronze in autumn; horsetail and docks in wet ground; and grasses gone to seed in the meadows. Everything small is placed by habitat: hay meadow (thick long grass) on the flood ground by the river, a long fringe along the woods, rushes down the wet runnels and reeds and bulrushes at the water's edge; rocky outcrops where the banks are steep and the soil thin, gravel in the runnels, cairns of stones cleared off the fields; mushrooms in damp shade and wild herbs on sunny dry banks. Wildflowers grow in drifts where they belong and only in their season: buttercups, daisies and clover in the meadows; bluebells and wood anemones under the trees; marsh marigolds, irises and ragged robin in wet ground; poppies and cornflowers at the field edges; primroses, campion, foxgloves and asters along the woods; harebells and thyme on the thin dry banks.
- **Festivals.** Each season has a feast: Mayday (maypole), Midsummer (double fireworks), the Harvest Feast and Yule (bonfire). Weddings, comings of age and house-warmings throw parties too.
- **Newcomers start as strangers.** Whoever arrives, through a rift or up the West Road, has no home and no trade. They go up to folk and ask questions (the wary hill-folk often make their excuses, and give the rift-folk short answers), and find their way round the landmarks. At night they ask at the inn for a bed and may be turned away, so they sleep rough under a tree or by the rift scar they came through, cold and miserable, until a kindly household offers them a room as a lodger. Once they know five faces and five places they find their feet: they take up a trade and, when a hole stands empty, get a home of their own.
- **Rift power and the rift-folk's own buildings.** The rift-folk bring their gadgets and a bag of spare parts, but the batteries run flat and there's no socket in the Shire. With nowhere to stay they rig up a camp by the rift scar (a neon-edged tarp, crates of salvage, a lamp that glows all night). They scavenge the scar for parts and go and study how the hill-folk use the land's own power: water turning the mill wheel, wind in the windmill's sails, sunshine on the fields. They learn faster together and when the miller or a woodwright is about. Each thing they master unlocks a building: the River Dynamo (where they charge up), the Wind Spinner on the high ground, then the Relay Mast, the Glowworm tavern and the Sun-Glass Array. Once they understand two kinds of power, they dig and wire hobbit-holes of their own and move straight in. Their small salvage buildings go up quickly, and they lend a hand themselves.
- **Rifts and the Riftfolk.** From the second evening, every couple of days the air tears open somewhere in the village and folk from a neon, wired-up world step through: dyed hair, chrome eyes, visors, synth-weave jackets and talk of "signal" and "low battery". Once they've found their feet they take up trades (above all the new *Tinker* trade), court and marry hill-folk, and raise children of mixed blood. Rift-blood and a dominant chrome-eye gene are inherited like any other gene, and mixed children often get names like Pipix or Bramax.
  - *Rift ways* are culture rather than blood, so they spread: by chatting, sharing a pint, living under the same roof (children most of all), gawking at an open rift and jacking in at the Relay. Folk who take them up wear neon trim, then synth-weave and visors, and slip into rift-talk. The rift-born soften too, swapping synth-weave for wool waistcoats. The chronicle marks when a tenth, a quarter, half and three-quarters of the hill-folk have gone rift-minded.
  - Tinkers salvage scrap from open rifts and the glittering scars they leave behind, retrofit hobbit-holes whose families have gone rift (neon arch round the door, a blinking sky-dish, a sun-glass panel, cool blue windows at night), and raise rift buildings as their numbers grow: the Relay Mast, the Glowworm (a neon tavern) and the Sun-Glass Array (hearths burn half the firewood).
  - Fewer come through when the larders are bare or it's winter. The *Travellers* ledger shows how far rift ways have spread, can open a rift on demand, and can stop rifts opening altogether.
- **Everyone keeps their own hours.** Each villager has a body clock from their nature (the merry and the lazy stay up late and lie in; others are early birds; elders rise early), shifted by their trade (bakers are up at four, farmers and herders soon after, the innkeeper keeps late hours) and varying a little from day to day, so the village wakes and goes to bed gradually.
- **Family routines** (after *The Sims*). Dinner is a family affair: at dinnertime folk make for home if the family's there, sit down together round the kitchen table and grow closer for it, and sometimes the whole household is in for once. The inn is a treat rather than every meal, and village dos come every few days rather than most nights. At bedtime a parent tells the little ones a story (they learn a little from it) and tucks them in, and a grown-up with toddlers out late heads home for their bedtime.
- **Under the trees.** On a dry day out of winter folk like to sit on the grass with their backs against a tree trunk: to read a book, smoke a pipe (about one pipe in three by day) or doze off in the afternoon.
- **Hobbies.** Everyone over seven has a pastime or two, picked from their nature: wood-carving (whittling for children), basket-weaving, pottery, knitting, painting (drawing for children), collecting and birdwatching. Each has its own skill that grows with practice. Basket-makers cut reeds and potters dig clay down by the river; painters set up an easel by the water or in the meadows; collectors comb the riverbank, the meadows and the rift scars for stones, shells, feathers, pressed flowers, butterflies, conkers, old coins and rift trinkets; birdwatchers are out at dawn with a notebook (sixty kinds to find). What they make stays at home, and now and then a piece goes to a friend as a present. A household with two or more knitted things stays warmer in the cold. Hobbies compete with the inn and the pipe, and most days win.
- **Babies are never left alone.** A baby is always with a parent (or, with no parents in the village, the grown-ups they live with): in the cradle at home while a parent is in, or carried in their arms whenever they go out. A parent holding a baby keeps to gentle things (meals, a stroll, a natter, the Store, the story circle), and not work or ale, so one parent stays home while the other works. Babies crawl on the grass only right beside a parent who's sitting or working outdoors. If a little one is ever found alone, the nearest parent drops everything and comes for them; one with nobody at all is taken in by kin or a kindly family.
- **Talk or thought.** When folk speak to someone, the bubble carries a little "to Name" tab and its tail leans towards them (and when both of a pair are talking, one bubble sits above the other). When they're only musing to themselves it's a soft grey thought cloud in italics, trailing little bubbles, and they muse less often than before. Exclamations keep the plain bubble.
- **Talking their age.** Babies babble; toddlers talk a word or two at a time ("Bunny! Come back!", "Mine!", "Up! Carry!"); children chatter in simple sentences, brighter ones more bookishly; tweens of twenty and over talk like grown-ups.
- **Little ones are minded.** Toddlers (two to four) and young children (five to seven) always have a grown-up with them: at home with someone in, toddling along beside a parent or an older brother or sister (sharing their meal at the inn, watching them at work, dancing at the party), at the nursery, or at the story circle. Parents drop them off on the way to work and collect them in the afternoon. When enough little ones need minding, the warmest soul in the village becomes the *Nanny* and runs a nursery in their own hole, with lunch, songs and an afternoon nap. A grown-up with little ones in tow skips the ale and the pipe. Schoolchildren (eight to eleven) roam the village by day but are home by dark, and nobody under twelve eats at the inn alone.
- **Adventures.** Bold villagers take short trips and send letters home through the postie, then return with tales, trinkets or a spouse met far away. Elders eventually set off on a last great adventure, sometimes hand in hand. When the village is small, travellers from over the hills bring new blood.

## Files

| File | Contents |
| --- | --- |
| `js/util.js` | RNG, noise, colour helpers, names, meal times, the calendar |
| `js/sprites.js` | Procedural pixel art: villagers (with genes), seasonal trees, cottages and workshops, critters, props, icons |
| `js/genetics.js` | Genome, inheritance, dominance, mutation, posting villagers as codes |
| `js/world.js` | Map layout, seasonal ground painting, places, crops, critters, A* pathfinding |
| `js/worldgen_ui.js` | The *Shape your valley* setup screen and the stage-by-stage generation map |
| `js/steward.js` | The Steward's Desk: rations, ale and working-week policies, contentment and migration, workforce allocation |
| `js/charter.js` | Charters (goals with rewards), renown, coin, and the eras with their Moots and unlocks |
| `js/illness.js` | Flu (laid up abed), sprained ankles, and friends bringing soup |
| `js/almanac.js` | The seasonal Almanac report: population, contentment, food, coin, renown, stories and advice |
| `js/traditions.js` | Traditions chosen at each era's Moot, and their lasting effects |
| `js/expeditions.js` | Expeditions to four regions beyond the valley and the discoveries they bring back |
| `js/cider.js` | Cider: apples pressed by the brewers, poured at the taproom, sold to the caravans |
| `js/dynamics.js` | Parent-and-child family dynamics on the Kin tab, at dinner and at bedtime |
| `js/lastwishes.js` | An elder's last wishes before their last adventure, told at the send-off and kept with the stone |
| `js/scenarios.js` | Scenarios on the setup screen: starting conditions, harsher seasons and goals |
| `js/scenes.js` | Heart scenes: short vignettes between pairs of folk, played on the map |
| `js/surface.js` | Chronicle filters, clue hints, weddings on the map, and keeping stock lines from repeating |
| `js/lore.js` | Lore points from reading and lessons, and the three-tier tree of discoveries the player chooses |
| `js/petitions.js` | Petitions from the village's interests (choices with trade-offs) and their standing with the Steward |
| `js/production.js` | Player-laid fields, orchards, woodlots and hives; soil-based crop yields; the minimap |
| `js/economy.js` | The Economy board, chain bottlenecks, building-works priority, hunger slowing work, and unhappy folk moving to Bree |
| `js/tidy.js` | Unique names, family surnames, and the morning digest of growing-up news |
| `js/hud.js` | HUD layout, toast queue, gear menu, chips, charter tracker, the five-section ledger, locked-tool explanations, the Steward's Errands guide, phone layout |
| `js/hazards.js` | Seasonal hazards with warnings: floods (and levees), droughts, blight, hard frost |
| `js/balance.js` | Costs for the gifts, policies felt in full, honest forecasts, idle-trade warnings, the Great Fair |
| `js/hearts.js` | Sentiments between people, likes and dislikes, friendly rivals and contests, inspirations and sulks, masterpieces |
| `js/riftstory.js` | The rift-folk storyline: stages, clues, Moot decisions, personal arcs and reunions, suppers, shared customs |
| `js/appeal.js` | Appeal (how lovely each spot is, and how it affects folk at home) and requests pinned to the notice board |
| `js/market.js` | Market-day caravans: traders, prices, selling and buying, dwarf masons, the wagon in the square |
| `js/buildmode.js` | Build mode: the tool palette, ghost previews, plans the villagers build, terraforming, ponds, new lots |
| `js/pets.js` | Cats and dogs: adoption, following their person, pottering near home, being stroked |
| `js/gossip.js` | News spreading through conversations, shared rooms, dinner tables and the taproom |
| `js/talk.js` | Word of mouth: messages with intents (recommendations, warnings, the inn's dish of the day, cheering up, tips, hobby sparks), and masters and apprentices |
| `js/post.js` | Letters: written at home, sent from the road, carried round by the postie |
| `js/mathoms.js` | Mathoms: oddments passed round as birthday presents, and brought home from adventures |
| `js/larder.js` | Putting by for winter: jams, pickles and smoked fish, opened when the cold months bite |
| `js/farewells.js` | Send-offs for elders leaving on their last adventure, keepsakes, missing them, and the Remembrance Green |
| `js/calendar.js` | The Shire week (market day, the Mersday sing-song, Highday rest) and birthdays with presents |
| `js/wishes.js` | Wishes (small hopes, some yours to grant) and each grown-up's lifelong dream |
| `js/lamplighter.js` | The lamplighter's trade: lighting the lamps at dusk and putting them out after sunrise |
| `js/moodlets.js` | Feelings: passing moods with reasons, what brings them on, and how they lift or sink mood |
| `js/terrain.js` | The lie of the land: height, slope, sun, drainage and flow, wetness, soil |
| `js/cliffs.js` | Rocky escarpments in the wilder land, their painted faces and the steps cut through them |
| `js/layout.js` | The lie of the village: the original valley's layout, and the planning of new ones from their seed |
| `js/nature.js` | Wind, swaying trees, long grass and reeds, rocks |
| `js/fx.js` | Particles, fireworks, weather (rain, storms, snow, fog, leaves, petals), lighting |
| `js/audio.js` | Generative folk music and sound effects |
| `js/education.js` | Education levels, learning, and whole-sentence speech in five registers |
| `js/town.js` | Town planning: surveyed lots, housing need, building projects, public works |
| `js/farm.js` | Animal pens, the second orchard, allotments and farm animals |
| `js/rift.js` | Rifts, the Riftfolk, rift ways spreading, neon retrofits, tinkers' actions and rift-talk |
| `js/villager.js` | Drives, body chemistry, the learning brain, imitation, memories, speech |
| `js/family.js` | Family care: who minds the little ones, carrying babies, tagging along, the nursery and the nanny, drop-off and pick-up, fetching a little one found alone, fostering |
| `js/hobbies.js` | Hobbies: who takes up what, hobby skills, gathering materials, things made and found, presents |
| `js/newcomers.js` | Newcomers: asking around, learning the landmarks, lodging at the inn or sleeping rough, being taken in, finding their feet |
| `js/riftpower.js` | Rift power: batteries, studying water, wind and sun, the rift camp, the dynamo and wind spinner, rift-built homes |
| `js/actions.js` | The action catalogue: leisure, family, courtship, school and every trade |
| `js/society.js` | The Common Store, trade assignment, courtship, births, homes, adventures, the archive |
| `js/ui.js` | Toolbar, HUD, the five-tab inspector, the village ledger, family trees |
| `js/interior.js` | Hobbit-hole interiors: room layout from the household, furniture, larder, lighting and folk inside |
| `js/interior_buildings.js` | Cutaways of every other building: the shell, the furniture of each trade, stock on the shelves, where folk stand |
| `js/dev.js` | Developer mode: decision explanations, the event log, world stats, tools and map overlays |
| `js/main.js` | Game loop, seasons and weather, rendering, input, saving |

## Deployment

Every commit is stamped with a sequential version (v1, v2, …) by `.githooks/pre-commit`, which writes `js/version.js`; the game shows it in the bottom-right corner. After cloning, run `git config core.hooksPath .githooks` once to turn the hook on.


Every push to `main` runs `.github/workflows/pages.yml`. It checks the JavaScript syntax and that every script in `index.html` exists, then publishes `index.html`, `css/` and `js/` to GitHub Pages. Pull requests run the checks without deploying.
