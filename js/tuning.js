// @ts-check
'use strict';
// ---------------------------------------------------------------------------
// The dials of the villagers' minds, all in one place. Nothing here is saved
// with a village: change a number, reload, and every hobbit feels it at once.
// In developer mode (the ⚙ menu, then Tools) the same numbers can be nudged
// live. Each line says what moving it does; the README's "Tuning the minds"
// section says how to see the effect in the Brain tab.
// ---------------------------------------------------------------------------

const TUNE = {
  // --- mood: how the needs add up ---
  mood: {
    scale: 1.6,         // how hard unmet needs pull mood down (was 1.45 with nine needs; 1.6 keeps the village as it was with twelve); higher = gloomier
    weights: { industry: 0.5, comfort: 0.6, crowded: 0.5, unease: 0.8 }, // how much each need counts in the mood sum (unlisted needs count 1)
    steerLow: 0.4,      // below this mood, folk lean to comforts and away from work
    steerHigh: 0.88,    // above this, folk lean to parties, presents, play and hobbies (when the work itch is low)
    comfortPull: 1.3,   // ×score of comforting actions when low
    workShy: 0.7,       // ×score of work actions when low
    highPull: 1.2,      // ×score of merry actions when high
  },
  // --- recreation variety: the same pleasure palls ---
  variety: {
    gain: 0.35,         // how much tolerance one go of a pastime adds (0..1)
    decayPerHour: 0.08, // how fast tolerance wears off
    penalty: 0.6,       // ×score lost at full tolerance: relief is scaled by 1 − penalty·tolerance
  },
  // --- memories: what sticks, and for how long ---
  memory: {
    weight: 0.02,       // mood lift per point of a memory's valence, at full strength
    halfLifeDays: 4,    // a memory's pull halves every this many days
    cap: 0.1,           // the most all memories together can move mood (±)
    grudgeDays: 20,     // a squabble with someone sours things between them for this long
    grudgeBelow: 0.3,   // ...unless their friendship is above this
    reminisceAfterDays: 1, // a strong memory older than this can come up as "Do you remember…"
    strong: 1,          // |valence| at and above which a memory is strong (pats and tuts never count)
  },
  // --- dreams pull like wishes ---
  dream: { pull: 1.2 }, // ×score of actions that carry someone toward their dream
  // --- nature in the mouth ---
  manner: {
    threshold: 0.68,    // a trait at or above this gives someone a manner of speaking
    rate: 0.45,         // how often (0..1) a line is colored by their manner
  },
  // --- breaks: sulks, tantrums and the rest ---
  breaks: {
    lowMood: 0.28,      // mood below this counts as a low hour (grown-ups)
    lowHours: 10,       // low hours in a row before a break can start
    chance: 0.04,       // chance per hour, once eligible
    villagePerDay: 3,   // at most this many breaks across the village in a day
    minutes: 600,       // how long a sulk or binge lasts unless cheered up
    tantrumMood: 0.32,  // children: mood below this counts as a low hour
    tantrumHours: 3,    // low hours in a row before a tantrum
    tantrumChance: 0.25,
    tantrumMinutes: 25,
  },
  // --- comfort and home ---
  comfort: {
    rate: 0.04,         // how fast the want of comfort rises per hour, on a dry ordinary day
    coldBoost: 1.5,     // ×rate when chilled
    wetBoost: 1.2,      // ×rate when out in the rain
    homeGood: 0.05,     // mood lift from a well-kept hole (state feeling)
    homeBare: -0.05,    // mood sink from a bare, drafty hole
    reliefHome: 1.25,   // ×comfort relief at home when the hole is well-kept (0.75 when bare)
  },
  // --- purpose: everyone wants to be useful ---
  purpose: {
    joblessRate: 0.045, // the itch to be useful for folk with no trade (per hour, daytime); was 0.02
    elderRate: 0.03,    // and for the retired
    reliefMaking: 0.35, // how much making something (a hobby piece, baking) scratches it
    reliefHelping: 0.3, // nursing, teaching, building, odd jobs, bringing soup
  },
  // --- company and solitude ---
  crowded: {
    many: 3,            // this many folk within reach counts as a crowd
    reach: 64,          // in world pixels
    rate: 0.09,         // how fast the want of quiet rises per hour in a crowd (×(1 − sociability))
    ease: 0.12,         // how fast it eases per hour when alone
  },
  // --- unease: hazards, rifts and sickness about ---
  unease: {
    hazardWarn: 0.04,   // per hour while a hazard is forecast
    hazardOn: 0.08,     // per hour while one is on
    rifts: 0.05,        // per hour per open rift (hill-folk only; rift-folk feel none)
    sickness: 0.03,     // per hour when a few neighbors are poorly
    nightOut: 0.03,     // per hour out of doors after dark
    ease: 0.1,          // per hour of calm (double indoors at home)
    braveryScale: 1.3,  // rises ×(braveryScale − bravery): the brave shrug it off
  },
  // --- values: what each hobbit holds dear ---
  values: {
    pull: 1.2,          // ×score of actions that serve one of their values
    shared: 1.15,       // ×friendship gains between folk who share a value
    clash: 0.85,        // ×friendship gains between folk whose values clash
    mutation: 0.15,     // chance a child picks up a value from neither parent
  },
  // --- traits that are (nearly) idle elsewhere get a job here ---
  traits: {
    braveryTrips: 1,    // placeholder for later: ×chance of a wanderlust trip
  },
};
