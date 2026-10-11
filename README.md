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

The village saves to `localStorage` every in-game hour and when you leave the page. **?** → *Start a fresh village* resets it. One in-game day takes 8 real minutes at 1×, and each season lasts three days.

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

### Life in the village

- **Trades.** Grown-ups take up a trade: farmer, herder, miller, baker, brewer, innkeeper, leaf-grower, fisher, woodwright, herbalist, orchard-keeper, postie, storyteller, nanny or (for the rift-minded) tinker. The choice comes from their talents, the skills they've practised, their family's trade, what they watched as an apprentice child, and what the village is short of. Trades can change as experience grows, and you can steer anyone from their Work tab.
- **Skills.** Nine skills improve with practice, faster with talent and education. Better hands produce more.
- **The economy.** Everything flows through the Common Store: barley → flour → bread, barley → ale, apples and honey → pies and cakes, vegetables and fish → the innkeeper's stew, timber → hearths and new homes, herbs → remedies. Food spoils (except in winter's cold), larders are stocked from the Store, and in lean times folk grind barley at home.
- **Homes and growth.** Every married couple wants a hole of their own, and grown sons and daughters move out when a spare one is going. Woodwrights always keep a spare hole or two ready, digging the old knolls first and then fresh ones surveyed across the map (over 30 homes in all), with timber kept back so the hearths never go cold. Every hole is dug into its own hillside rather than sitting under a dome: a lopsided, lumpy rise that fades into the meadow, wider on one side so the door sits off-centre, with its south side cut back into a curving dry-stone face (mossy, with grass hanging over the top). The door and windows are set into the face (higher ones peep out of the slope), a raised flagstone terrace runs along its foot, and stone steps lead down from the door to the lane. Each hole is a little different: door style, stone, timber or brick surround, round or shuttered windows, porches, lanterns, flower boxes, rooftop wildflowers and garden apple trees.
- **Public works.** As the population passes each milestone the village builds a second and third well, a storehouse (stores hold half as much again), a smokehouse (food keeps twice as long), a second tavern, a second bakehouse and two more barley fields. Construction shows on the map: scaffolding rises, fields are staked and furrowed. The *Stores* ledger lists everything under way.
- **Farmland.** A sheepfold, cow paddock and pig sty are tended by the herder (cheese for the larders, wool for winter woollens that keep folk warm); farmers work vegetable allotments as well as the barley; two orchards and plenty of garden apple trees; two watermills and a windmill grind the flour.
- **The look.** Everything is drawn at double resolution: two canvas pixels to every world pixel, so the world keeps its size but has four times the detail. Villagers are drawn shape by shape from their genes in that resolution: faces with brows, shining eyes, blush and pointed ears; tidy, long, tousled or curly hair; waistcoats with buttons and a watch chain, skirts, big hairy feet; spectacles and beards on the old; visors, chrome eyes and neon-piped synth-weave on the rift-minded. The ground, hobbit-hole doors, windows, chimneys, particles and weather are painted at full detail too. Everything else (trees, buildings, crops, animals, props) goes through a Scale2x upscaler with its outline thinned to match. Zoom moves in even steps so every half-pixel lands on whole screen pixels. Folk walk with a four-step cycle (stride, pass, stride, pass) with swinging arms and a little bob, raise a hand to their work, fling their arms up to dance, blink every few seconds and shut their eyes to doze.
- **The lie of the land.** The world is worked out in stages, each reading the ones before (the way Dwarf Fortress builds its worlds): height, then slope and which way the ground faces (south-facing slopes are sunnier), then drainage (hollows are filled, every tile drains downhill and the flow gathers into runnels), then wetness from that flow and nearness to the river and pond, then soil (rich alluvium on the low flood ground, loam on gentle slopes, thin stony soil on the heights and steep banks, heavy clay where it's wet and flat). What grows and lies where comes from these. Developer mode can paint any of them over the map (the *land* overlay).
- **The land.** The north bank climbs towards the Hill and both banks fall away to the river, with hill-shading and grassy terraced banks. Chimneys smoke whenever the kettle's on. Paths, the river and the pond are painted with flowing curves (each point blends the tiles around it, so corners round off and stepped diagonals become smooth bends), while the tiles folk walk on stay the same. The lanes themselves were laid by the easiest way between their waypoints: they keep to the contours, take terrace banks at an angle, avoid wet ground and merge where they meet, while river crossings stay straight as bridges. Folk find their way with A* over the tiles: they keep to roads and cobbles, cut across grass only when it saves a fair way, and treat terrace banks as steep. They climb where a road or path makes a ramp unless there's no other way round. Fences, barrels, mailboxes and other props block their tiles.
- **Wind and weather in the trees.** A breeze blows across the valley in slow swells and rolling gusts: gentle on a clear day, stiff in the rain, wild in a storm, still in the fog. Trees lean and sway with it (tops more than trunks), bushes stir, and long grass and riverside reeds ripple as the gusts pass along.
- **Trees, bushes, grass and rocks.** Woodland grows where nobody has cleared it: on steep thin-soiled banks and wet clay, thick along the valley's edges and in the eastern forest, thinning out with a ragged edge towards the lanes, fields and homes. Trees are spaced by size (a big oak keeps the ground round it to itself) and each kind grows where it suits: oaks on deep loam and clay, birches and pines on thin dry soil and the heights, poplars on the damp flood ground, saplings at the woods' edge. Hawthorn hedgerows run round the barley and leaf fields and along the country lanes outside the village, white with may blossom in spring, red with haws in autumn and bare in winter, with gateways every few yards and an oak or birch left to grow up out of the hedge now and then (a check opens any hedge that would cut someone off). Bushes gather along the edges by kind: gorse and heather on dry banks, ferns and holly in the shade, brambles and thorn along the margins. Every tree's size and shape comes from its seed: broad old oaks and spindly young ones, slim silver birches, tall narrow poplars, saplings, pines and firs of every height, and weeping willows along the river and round the pond, all turning with the seasons. Bushes come in seven kinds that change through the year: leafy mounds, brambles with blackberries, hawthorn and wild rose, gorse in yellow bloom, fern clumps that bronze in autumn, holly with red winter berries, and purple heather. Everything small is placed by habitat: hay meadow (thick long grass) on the flood ground by the river, a long fringe along the woods, rushes down the wet runnels and reeds and bulrushes at the water's edge; rocky outcrops where the banks are steep and the soil thin, gravel in the runnels, cairns of stones cleared off the fields; mushrooms in damp shade and wild herbs on sunny dry banks. Wildflowers grow in drifts where they belong and only in their season: buttercups, daisies and clover in the meadows; bluebells and wood anemones under the trees; marsh marigolds, irises and ragged robin in wet ground; poppies and cornflowers at the field edges; primroses, campion, foxgloves and asters along the woods; harebells and thyme on the thin dry banks.
- **Festivals.** Each season has a feast: Mayday (maypole), Midsummer (double fireworks), the Harvest Feast and Yule (bonfire). Weddings, comings of age and house-warmings throw parties too.
- **Newcomers start as strangers.** Whoever arrives, through a rift or up the West Road, has no home and no trade. They go up to folk and ask questions (the wary hill-folk often make their excuses, and give the rift-folk short answers), and find their way round the landmarks. At night they ask at the inn for a bed and may be turned away, so they sleep rough under a tree or by the rift scar they came through, cold and miserable, until a kindly household offers them a room as a lodger. Once they know five faces and five places they find their feet: they take up a trade and, when a hole stands empty, get a home of their own.
- **Rift power and the rift-folk's own buildings.** The rift-folk bring their gadgets and a bag of spare parts, but the batteries run flat and there's no socket in the Shire. With nowhere to stay they rig up a camp by the rift scar (a neon-edged tarp, crates of salvage, a lamp that glows all night). They scavenge the scar for parts and go and study how the hill-folk use the land's own power: water turning the mill wheel, wind in the windmill's sails, sunshine on the fields. They learn faster together and when the miller or a woodwright is about. Each thing they master unlocks a building: the River Dynamo (where they charge up), the Wind Spinner on the high ground, then the Relay Mast, the Glowworm tavern and the Sun-Glass Array. Once they understand two kinds of power, they dig and wire hobbit-holes of their own and move straight in. Their small salvage buildings go up quickly, and they lend a hand themselves.
- **Rifts and the Riftfolk.** From the second evening, every couple of days the air tears open somewhere in the village and folk from a neon, wired-up world step through: dyed hair, chrome eyes, visors, synth-weave jackets and talk of "signal" and "low battery". Once they've found their feet they take up trades (above all the new *Tinker* trade), court and marry hill-folk, and raise children of mixed blood. Rift-blood and a dominant chrome-eye gene are inherited like any other gene, and mixed children often get names like Pipix or Bramax.
  - *Rift ways* are culture rather than blood, so they spread: by chatting, sharing a pint, living under the same roof (children most of all), gawking at an open rift and jacking in at the Relay. Folk who take them up wear neon trim, then synth-weave and visors, and slip into rift-talk. The rift-born soften too, swapping synth-weave for wool waistcoats. The chronicle marks when a tenth, a quarter, half and three-quarters of the hill-folk have gone rift-minded.
  - Tinkers salvage scrap from open rifts and the glittering scars they leave behind, retrofit hobbit-holes whose families have gone rift (neon arch round the door, a blinking sky-dish, a sun-glass panel, cool blue windows at night), and raise rift buildings as their numbers grow: the Relay Mast, the Glowworm (a neon tavern) and the Sun-Glass Array (hearths burn half the firewood).
  - Fewer come through when the larders are bare or it's winter. The *Travellers* ledger shows how far rift ways have spread, can open a rift on demand, and can stop rifts opening altogether.
- **Everyone keeps their own hours.** Each villager has a body clock from their nature (the merry and the lazy stay up late and lie in; others are early birds; elders rise early), shifted by their trade (bakers are up at four, farmers and herders soon after, the innkeeper keeps late hours) and varying a little from day to day, so the village wakes and goes to bed gradually.
- **Family routines** (after *The Sims*). Dinner is a family affair: at dinnertime folk make for home if the family's there, sit down together round the kitchen table and grow closer for it, and sometimes the whole household is in for once. The inn is a treat rather than every meal, and village dos come every few days rather than most nights. At bedtime a parent tells the little ones a story (they learn a little from it) and tucks them in, and a grown-up with toddlers out late heads home for their bedtime.
- **Hobbies.** Everyone over seven has a pastime or two, picked from their nature: wood-carving (whittling for children), basket-weaving, pottery, knitting, painting (drawing for children), collecting and birdwatching. Each has its own skill that grows with practice. Basket-makers cut reeds and potters dig clay down by the river; painters set up an easel by the water or in the meadows; collectors comb the riverbank, the meadows and the rift scars for stones, shells, feathers, pressed flowers, butterflies, conkers, old coins and rift trinkets; birdwatchers are out at dawn with a notebook (sixty kinds to find). What they make stays at home, and now and then a piece goes to a friend as a present. A household with two or more knitted things stays warmer in the cold. Hobbies compete with the inn and the pipe, and most days win.
- **Babies are never left alone.** A baby is always with a parent (or, with no parents in the village, the grown-ups they live with): in the cradle at home while a parent is in, or carried in their arms whenever they go out. A parent holding a baby keeps to gentle things (meals, a stroll, a natter, the Store, the story circle), and not work or ale, so one parent stays home while the other works. Babies crawl on the grass only right beside a parent who's sitting or working outdoors. If a little one is ever found alone, the nearest parent drops everything and comes for them; one with nobody at all is taken in by kin or a kindly family.
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
| `js/terrain.js` | The lie of the land: height, slope, sun, drainage and flow, wetness, soil |
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
