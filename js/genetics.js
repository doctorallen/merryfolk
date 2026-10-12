// @ts-check
'use strict';
// ---------------------------------------------------------------------------
// Genetics. Every villager carries a genome:
//  - looks: skin, hair, clothes, hair style, plus two-allele genes for eye
//    colour, freckles and curls (dominant / recessive, so traits can skip
//    a generation and reappear)
//  - personality: thirteen continuous traits blended from both parents
//  - talents: aptitudes for each skill, which set how fast they learn it
//  - instincts: inborn tastes for each action and each food
// Children get a crossover of both parents plus occasional mutations.
// ---------------------------------------------------------------------------

const TRAITS = ['appetite', 'sociability', 'laziness', 'merriness', 'pipeLove', 'curiosity', 'temper', 'romance', 'bravery', 'wit', 'hardiness', 'fertility', 'longevity'];
const TRAIT_INFO = {
  appetite: ['Appetite', 'Picky eater', 'Hearty eater'],
  sociability: ['Sociability', 'Keeps to themself', 'Chatty'],
  laziness: ['Easygoingness', 'Industrious', 'Easygoing'],
  merriness: ['Merriness', 'Serious-minded', 'Merry'],
  pipeLove: ['Love of the pipe', 'Rarely smokes', 'Loves a pipe'],
  curiosity: ['Curiosity', 'Homebody', 'Curious'],
  temper: ['Temper', 'Even-tempered', 'Quick-tempered'],
  romance: ['Romance', 'Sensible heart', 'Romantic'],
  bravery: ['Wanderlust', 'Stay-at-home', 'Adventurous'],
  wit: ['Wit', 'Slow and steady', 'Quick-witted'],
  hardiness: ['Hardiness', 'Delicate', 'Hardy'],
  fertility: ['Fondness for little ones', 'Content as they are', 'Wants a big family'],
  longevity: ['Longevity', 'Ages quickly', 'Long-lived'],
};

const SKILLS = ['farming', 'cooking', 'brewing', 'fishing', 'woodcraft', 'herbalism', 'lore', 'music', 'tinkering'];
const SKILL_LABEL = { farming: 'Farming', cooking: 'Cooking', brewing: 'Brewing', fishing: 'Fishing', woodcraft: 'Woodcraft', herbalism: 'Herb-lore', lore: 'Storytelling', music: 'Music', tinkering: 'Tinkering' };

const EYE_ALLELES = ['B', 'H', 'G', 'b']; // brown > hazel > green > blue
const EYE_INFO = { B: ['brown', '#3a2414'], H: ['hazel', '#7a5a2a'], G: ['green', '#2f7a3a'], b: ['blue', '#3a6ab0'] };

function expressEyes(pair) {
  for (const a of EYE_ALLELES) if (pair.includes(a)) return a;
  return 'B';
}

function randomGenes() {
  const g = {
    sex: R.chance(0.5) ? 'f' : 'm',
    skin: R.i(0, SKIN_TONES.length - 1), hair: R.pick(HAIR_COLS), vest: R.pick(VEST_COLS), shirt: R.pick(SHIRT_COLS), legs: R.pick(LEG_COLS),
    style: R.i(0, 2), garment: R.chance(0.45) ? 1 : 0,
    eyes: [R.weighted([[5, 'B'], [2, 'H'], [1.5, 'G'], [2.5, 'b']]), R.weighted([[5, 'B'], [2, 'H'], [1.5, 'G'], [2.5, 'b']])],
    freckles: [R.chance(0.25) ? 1 : 0, R.chance(0.25) ? 1 : 0],
    curls: [R.chance(0.3) ? 1 : 0, R.chance(0.3) ? 1 : 0],
    // rift-blood: how much of their ancestry stepped through a rift (0 for hill-folk);
    // a chrome-eye gene (dominant) and a favourite neon, which shows once they take up rift ways
    rift: 0, chrome: [0, 0], neon: R.i(0, NEON_COLS.length - 1),
    taste: {}, food: {}, apt: {}, mutations: [],
  };
  for (const t of TRAITS) g[t] = R.f(0.1, 0.95);
  for (const s of SKILLS) g.apt[s] = s === 'tinkering' ? R.f(0.05, 0.45) : R.f(0.15, 1);
  for (const a in ACTIONS) g.taste[a] = R.f(0.8, 1.25);
  for (const f in FOODS) g.food[f] = R.f(0.7, 1.3);
  return g;
}

// Makes sure genes from older or imported villagers have every field.
function normalizeGenes(g) {
  const base = randomGenes();
  // an older villager's sex is worked out from their name instead
  for (const k in base) if (g[k] === undefined && k !== 'sex') g[k] = base[k];
  for (const t of TRAITS) if (typeof g[t] !== 'number') g[t] = base[t];
  for (const s of SKILLS) if (typeof g.apt[s] !== 'number') g.apt[s] = base.apt[s];
  for (const a in ACTIONS) if (typeof g.taste[a] !== 'number') g.taste[a] = 1;
  for (const f in FOODS) if (typeof g.food[f] !== 'number') g.food[f] = 1;
  if (typeof g.skin === 'string') g.skin = Math.max(0, SKIN_TONES.indexOf(g.skin));
  if (!Array.isArray(g.mutations)) g.mutations = [];
  return g;
}

const fromEither = (a, b) => (R.chance(0.5) ? a : b);
const allele = (pair) => pair[R.i(0, 1)];

function inheritGenes(a, b) {
  const g = { taste: {}, food: {}, apt: {}, mutations: [] };
  g.sex = R.chance(0.5) ? 'f' : 'm';
  // skin blends between the parents' tones
  g.skin = clamp(Math.round((a.skin + b.skin) / 2 + R.f(-0.7, 0.7)), 0, SKIN_TONES.length - 1);
  for (const k of ['hair', 'style', 'garment']) g[k] = fromEither(a[k], b[k]);
  g.vest = R.chance(0.6) ? fromEither(a.vest, b.vest) : R.pick(VEST_COLS);
  g.shirt = R.pick(SHIRT_COLS); g.legs = fromEither(a.legs, b.legs);
  g.eyes = [allele(a.eyes), allele(b.eyes)];
  g.freckles = [allele(a.freckles), allele(b.freckles)];
  g.curls = [allele(a.curls), allele(b.curls)];
  g.chrome = [allele(a.chrome), allele(b.chrome)];
  g.rift = clamp(((a.rift || 0) + (b.rift || 0)) / 2, 0, 1);
  g.neon = fromEither(a.neon, b.neon);
  for (const t of TRAITS) {
    g[t] = clamp(fromEither(a[t], b[t]) * 0.65 + (a[t] + b[t]) * 0.175 + R.f(-0.1, 0.1), 0.03, 1);
  }
  for (const s of SKILLS) g.apt[s] = clamp(fromEither(a.apt[s], b.apt[s]) * 0.7 + (a.apt[s] + b.apt[s]) * 0.15 + R.f(-0.08, 0.08), 0.05, 1);
  for (const k in ACTIONS) g.taste[k] = clamp(((a.taste[k] || 1) + (b.taste[k] || 1)) / 2 + R.f(-0.1, 0.1), 0.6, 1.4);
  for (const f in FOODS) g.food[f] = clamp(fromEither(a.food[f] || 1, b.food[f] || 1) + R.f(-0.1, 0.1), 0.5, 1.5);

  // Mutations: rare, and noted so the player can spot them.
  if (R.chance(0.06)) { g.hair = R.pick(HAIR_COLS); g.mutations.push('an unexpected hair colour'); }
  if (R.chance(0.04)) { const i = R.i(0, 1); g.eyes[i] = R.pick(EYE_ALLELES); }
  if (R.chance(0.03)) { g.freckles[R.i(0, 1)] = 1; }
  if (R.chance(0.12)) {
    const t = R.pick(TRAITS);
    const up = R.chance(0.5);
    g[t] = clamp(g[t] + (up ? 0.35 : -0.35), 0.03, 1);
    g.mutations.push(`${up ? 'unusually high' : 'unusually low'} ${TRAIT_INFO[t][0].toLowerCase()}`);
  }
  if (R.chance(0.1)) {
    const s = R.pick(SKILLS);
    g.apt[s] = clamp(g.apt[s] + 0.4, 0, 1);
    g.mutations.push(`a natural gift for ${SKILL_LABEL[s].toLowerCase()}`);
  }
  return g;
}

// The visible look, after dominance is applied.
function expressed(g) {
  return {
    skin: SKIN_TONES[g.skin] || SKIN_TONES[0],
    hair: g.hair, vest: g.vest, shirt: g.shirt, legs: g.legs, sex: g.sex || 'm',
    // lasses mostly wear dresses and lads breeches; the garment gene tips the balance
    garment: g.sex === 'f' ? (g.garment || hash2(g.skin * 13, g.style * 7 + 3) > 0.15 ? 1 : 0) : 0,
    style: g.curls && g.curls[0] && g.curls[1] ? 3 : g.style,
    eyes: EYE_INFO[expressEyes(g.eyes || ['B', 'B'])][1],
    freckles: !!(g.freckles && g.freckles[0] && g.freckles[1]),
    chrome: !!(g.chrome && (g.chrome[0] || g.chrome[1])),
    neon: NEON_COLS[g.neon] || NEON_COLS[0],
  };
}

function eyeWord(g) { return EYE_INFO[expressEyes(g.eyes)][0]; }
function geneDescription(g) {
  const lines = [['Sex', g.sex === 'f' ? 'Female' : 'Male']];
  const eyeCarry = g.eyes.filter((a) => a !== expressEyes(g.eyes)).map((a) => EYE_INFO[a][0]);
  lines.push(['Eyes', eyeWord(g) + (eyeCarry.length && eyeCarry[0] !== eyeWord(g) ? ` (carries ${eyeCarry[0]})` : '')]);
  const fr = g.freckles[0] + g.freckles[1];
  lines.push(['Freckles', fr === 2 ? 'freckled' : fr === 1 ? 'none (carrier)' : 'none']);
  const cu = g.curls[0] + g.curls[1];
  lines.push(['Hair', (cu === 2 ? 'curly' : ['tidy', 'long', 'tousled'][g.style] || 'tidy') + (cu === 1 ? ' (carries curls)' : '')]);
  const ch = (g.chrome || [0, 0])[0] + (g.chrome || [0, 0])[1];
  if (ch) lines.push(['Optic', ch === 2 ? 'chrome eye (pure-bred)' : 'chrome eye (carries a plain one)']);
  if (g.rift > 0) lines.push(['Rift-blood', g.rift >= 0.99 ? 'rift-born' : Math.round(g.rift * 100) + '%']);
  return lines;
}

function topTalents(g, n = 2) {
  return SKILLS.slice().sort((a, b) => g.apt[b] - g.apt[a]).slice(0, n);
}

// ---------------------------------------------------------------------------
// Posting villagers between villages (the "warp" of Docking Station):
// a villager's genome and upbringing packed into a short code.
// ---------------------------------------------------------------------------
function exportVillager(v) {
  const data = {
    f: v.first, s: v.surname, g: v.genes, a: Math.min(v.age, ELDER_DAYS - 1), k: v.skills, w: v.weights,
    e: Math.round(v.edu * 100) / 100, t: Math.round(v.tech * 100) / 100,
    from: 'Thistledown',
  };
  const json = JSON.stringify(data);
  return 'TD2:' + btoa(unescape(encodeURIComponent(json)));
}

function importVillagerCode(code) {
  code = (code || '').trim();
  if (!code.startsWith('TD2:')) throw new Error('That doesn\'t look like a Merryfolk letter. Codes start with TD2:');
  let data;
  try { data = JSON.parse(decodeURIComponent(escape(atob(code.slice(4))))); } catch (e) { throw new Error('The letter is smudged. The code seems incomplete.'); }
  if (!data || !data.g || !data.f) throw new Error('The letter is missing its traveller.');
  return data;
}
