// The shared globals as the type checker sees them. Every js/*.js file is a
// classic script in one global scope, so tsc already knows every top-level
// function and `const`; these declarations add the shape of the big state
// objects, which are object literals that later files add fields to. They
// are deliberately loose (an index signature at the end of each) so that a
// file can opt into `// @ts-check` without the checker objecting to every
// field it hasn't been told about yet. Tighten them as files are checked.

interface GameState {
  time: number; day: number; hour: number; season?: string;
  villagers: Villager[]; pets: any[]; selected: Villager | null; hovered: any;
  darkness: number; raining: boolean; weather: string; speed: number; speedIdx: number;
  cam: { x: number; y: number; w: number; h: number }; zoom: number;
  coin: number; renown: number; era: number; started: boolean; introOpen?: boolean;
  gen?: any; plans: any[]; planDone: any[]; terra: any[]; party: any;
  [key: string]: any;
}

interface WorldHome {
  id: number; name: string; def: any; built: boolean; grand: boolean;
  doorX: number; doorY: number; doorR: number; stepX: number; stepY: number; stepTile: [number, number];
  windows: { x: number; y: number }[]; lit: boolean; inside: Villager[]; v?: any;
  [key: string]: any;
}

interface WorldState {
  tiles: Uint8Array; block: Uint8Array; reserved: Uint8Array;
  homes: WorldHome[]; buildings: { [key: string]: any }; lots: any[]; statics: any[]; grass: any[]; flowers: any[];
  lamps: any[]; benches: any[]; fishing: any[]; shade: any[]; storySeats: any[]; partySeats: any[];
  fields: any[]; pens: any[]; allotments: any[]; orchard: any[]; hives: any[]; hens: any[]; ducks: any[];
  mushrooms: any[]; wildHerbs: any[]; woodSpots: any[]; weed: any[]; herbBeds: any[]; items: any[];
  rifts: any[]; riftScars: any[]; season: string; seed: number; gen: any; land: any; pads: any[] | null; padNear: any;
  px: any; tileLevel: Uint8Array | null; cliff: Uint8Array | null; cliffMask: Float32Array | null; cliffZone: Float32Array | null;
  L: any; paintJob: any; ground: any; treeAt: number[][]; inn: any; millWheel: any; millWheels: any[]; windmill: any;
  [key: string]: any;
}

interface VillageState {
  stores: { [kind: string]: number }; projects: any[];
  [key: string]: any;
}

// Villager is a class in villager.js; tsc infers it from the file. This only
// records that other files pin fields on instances freely.
interface Villager { [key: string]: any; }

// The three state objects are object literals in main.js, world.js and
// society.js, typed there with a JSDoc @type so later files' additions are allowed.

// Chrome-only performance memory, read by the dev tools and tests.
interface Performance { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }; }
