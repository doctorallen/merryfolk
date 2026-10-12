'use strict';
// ---------------------------------------------------------------------------
// Occasions: what a party is for. Thistledown doesn't just throw a do every
// few days; every party has a reason, and each reason has its own look and
// doings, kept in one registry (PARTY_KINDS) that later files add to.
//
// Through the village's year of twelve days:
//   Founders' Day (spring, day 1, from the second year): a long lunch at the
//     long tables, and a toast to the first holes dug in the valley
//   Mayday (spring, day 2): the maypole, and a Queen or King of the May
//   Midsummer (summer, day 2): a bonfire and the biggest fireworks of the year
//   the Harvest Feast (autumn, day 2): a long dinner at the long tables
//   Lantern Night (autumn, day 3): paper lanterns let go into the dark
//   Yule (winter, day 2): the bonfire, carols and mulled ale
// Between them come birthday parties (where, as is proper among hobbits, the
// birthday hobbit has a present for every guest), a holiday declared now and
// then for no very good reason, a Highday dance if the village has asked for
// one, and the odd impromptu do. Weddings, Two Hearths and the Steward's
// feast are dinners at the long tables too; comings of age, house-warmings,
// openings and Moots keep their parties.
//
// The long tables are trestles with white cloths, set out in the party field
// (or the square, if the field has no room) only while a feast is on. The
// courses come out one after another (soup, the mains, pudding), each drawn
// from the Common Store, and the dinner ends with a toast.
// ---------------------------------------------------------------------------

MOODLETS.feast_dined = ['Dined at the long tables', 0.12, 1440, ['I couldn\'t eat another thing. Well. A little pudding.', 'What a dinner that was!']];
MOODLETS.holiday = ['A holiday: {x}', 0.06, 900, ['A holiday! No work today.', 'I could get used to holidays.']];
MOODLETS.bday_guest = ['At {x}\'s birthday party', 0.09, 900, ['What a party! And a present to take home.', 'Many happy returns, I said. Twice.']];
MOODLETS.crowned = ['Crowned {x} of the May', 0.15, 2880, ['Me! Of all people! With flowers in my hair!']];
MOODLETS.lantern = ['Let a lantern go on Lantern Night', 0.1, 1440, ['I made a wish on my lantern. I shan\'t tell.']];

// What a party is for: one entry per reason (Game.party.reason).
//   label     its name (the dev drawer, the HUD chip)
//   hud       the HUD chip's text, if not the label and a '!'
//   note      what the Chronicle says when it starts: a string, or fn(reason)
//   morning   what the Chronicle says at seven on the day (planned occasions)
//   fireworks how many rockets at ten o'clock: a number, fn(), or 0 for none
//   encore    another show at eleven (a number or fn)
//   show      fn(x, y, hour): put on the ten o'clock show itself instead
//   feast     true for a dinner at the long tables; `lunch: true` for a midday one
//   paid      the food was paid for up front (the Steward's feast)
//   bonfire   the party-field bonfire is lit
//   dayOff    the trades down tools for the day, as on Highday
//   quiet     no 'last lanterns' line when it ends
//   lines     what the dancers call out
//   toast     fn(host) the toast at the end of the dinner
//   host      fn() who gives the toast (by default the eldest at table)
//   start     fn(reason) run as it starts
//   startAt   the hour it starts (18, or 16 for a dinner, when the tables go out)
//   until     the hour it ends (by default a quarter to midnight)
//   rank      which wins when two fall on one night (the other is toasted too):
//             5 the calendar's own days, 4 the Steward's and the Moot's,
//             3 weddings, 2 birthdays and holidays, 1 comings of age and
//             new holes, 0 a do for no reason
//   also      how the night's other occasion is named when it's toasted too
const PARTY_KINDS = {};
function addPartyKind(key, def) { PARTY_KINDS[key] = { key, fireworks: 9, rank: 0, ...def }; return PARTY_KINDS[key]; }
const partyRank = (reason) => partyKind(reason).rank || 0;
function partyKind(reason = Game.party.reason) {
  if (PARTY_KINDS[reason]) return PARTY_KINDS[reason];
  if (typeof reason === 'string' && reason.startsWith('the opening of')) return PARTY_KINDS.opening;
  return PARTY_KINDS.evening;
}
const kindVal = (x, ...a) => (typeof x === 'function' ? x(...a) : x);
function partyHost() { return Game.party.host != null ? personById(Game.party.host) : null; }

addPartyKind('evening', { label: 'An impromptu do', hud: 'Party tonight!', note: 'The lanterns are lit in the party field: there\'s a do tonight, and everyone\'s invited.', quiet: true });
addPartyKind('fireworks', { label: 'Fireworks party', hud: 'Party tonight!', note: 'The lanterns are lit in the party field: there\'s a do tonight, and it\'s an impromptu one!', quiet: true });
addPartyKind('highday', { label: 'The Highday dance', hud: 'Highday dance!', note: 'The Highday dance has started up in the party field.', fireworks: 5, quiet: true, lines: ['Highday! No work tomorrow either. Oh. Yes there is.', 'Strip the willow!'] });
addPartyKind('wedding', { rank: 3, also: 'the newly-weds',
  label: 'A wedding feast', hud: 'Wedding feast!', feast: true,
  note: 'The long tables are out in the party field for the wedding feast, and the whole village is sitting down to dinner for the happy couple.',
  // the bride or groom's eldest kin gives the toast
  host: () => { const c = (Game.party.couple || []).map(personById).filter(Boolean); const kin = Game.villagers.filter((o) => c.some((w) => w.parents.includes(o.id))).sort((a, b) => b.age - a.age); return kin[0] || null; },
  toast: () => { const c = (Game.party.couple || []).map(personById).filter(Boolean); return c.length === 2 ? `To ${c[0].first} and ${c[1].first}! May your pantry never be bare, and may you always save each other the last scone.` : 'To the happy couple! May your pantry never be bare.'; },
  lines: ['To the bride and groom!', 'Kiss! Kiss!', 'I cried. I always cry at weddings.'],
});
addPartyKind('coming-of-age', { rank: 1, also: 'the folk who\'ve come of age', label: 'A coming of age', hud: 'Coming of age!', note: 'The lanterns are lit in the party field: there\'s a do tonight, to celebrate a coming of age.', lines: ['Thirty-three! A grown hobbit at last!', 'You\'ll be wanting a hole of your own next.'] });
addPartyKind('house-warming', { rank: 1, also: 'the new hole', label: 'A house-warming', hud: 'House-warming!', note: 'The lanterns are lit in the party field: there\'s a do tonight, to warm the new hole.' });
addPartyKind('opening', { rank: 1, also: (r) => (r && r !== 'opening' ? r.replace('the opening of ', '') : 'the new building'), label: 'An opening', hud: 'Party tonight!', note: (r) => `The lanterns are lit in the party field: there's a do tonight, for ${r === 'opening' ? 'the opening of something new' : r}.` });
addPartyKind('moot', { rank: 4, label: 'After the Moot', hud: 'Party tonight!', note: 'The Moot is done, and the party field is lit up for the celebrations.' });
addPartyKind('twohearths', { rank: 4,
  label: 'Two Hearths', hud: 'Two Hearths!', feast: true,
  note: 'For Two Hearths, the long tables are out and hill-folk and rift-folk are sitting down to dinner side by side.',
  toast: () => 'To Two Hearths: one village, however we got here!',
});
addPartyKind('feast', { rank: 4,
  label: 'The Steward\'s feast', hud: 'Village feast!', feast: true, paid: true,
  note: 'The long tables are out in the party field: the Steward\'s feast is laid, and the whole village is sitting down to dinner.',
  toast: () => 'To the Steward, who knows a hungry village when she sees one!',
});
addPartyKind('mayday', { rank: 5,
  label: 'Mayday', hud: 'Mayday dance!', note: 'The maypole is up and the fiddles are tuned. Round and round they go!',
  lines: ['Round the maypole!', 'Over and under! No, under!', 'Mind the ribbons!', 'Hey for the May!'],
  start: () => crownMay(),
});
addPartyKind('midsummer', { rank: 5, label: 'Midsummer', hud: 'Midsummer!', note: 'Midsummer revels have begun in the party field! The bonfire\'s lit.', fireworks: 18, encore: 14, bonfire: true, lines: ['Jump the fire! Go on!', 'The shortest night of the year, and we\'ll not waste it.'] });
addPartyKind('harvest', { rank: 5,
  label: 'The Harvest Feast', hud: 'Harvest Feast!', feast: true,
  note: 'The Harvest Feast is laid on the long tables! Pies, stews and cider for everyone.',
  start: () => { Village.produce('pie', 10); Village.produce('stew', 12); },
  toast: () => `To the harvest, and to every hand that brought it in! ${World.fields.length ? 'And the barley.' : ''}`,
  lines: ['To the harvest!', 'Best year for marrows I can remember.'],
});
addPartyKind('yule', { rank: 5,
  label: 'Yule', hud: 'Yule!', note: 'The Yule bonfire is roaring. Mulled ale and carols in the snow!', bonfire: true,
  start: () => { if (Village.stores.ale > 6) Village.use('ale', 6); },
  lines: ['♪ Deck the hole with boughs of holly... ♪', '♪ Yule-tide fire and frosty air... ♪', 'Mulled ale! Mind, it\'s hot.', 'Happy Yule!'],
});
addPartyKind('founding', { rank: 5,
  label: 'Founders\' Day', hud: 'Founders\' Day!', feast: true, lunch: true, startAt: 11, until: 15.5, fireworks: 0, dayOff: true,
  morning: () => `It's Founders' Day: ${yearOf(Game.day) - 1 === 1 ? 'a year' : `${yearOf(Game.day) - 1} years`} since the first holes were dug in Thistledown. Tools down: the long tables go out in the party field for a long lunch.`,
  note: 'The long tables are laid in the party field for the Founders\' Day lunch.',
  toast: () => `To Thistledown, and to the folk who dug the first holes in it! ${yearOf(Game.day) - 1 > 1 ? `${yearOf(Game.day) - 1} years` : 'A year'}, and may there be a hundred more.`,
  lines: ['To the founders!', 'My gran dug the first hole on this hill, you know. With a spoon, to hear her tell it.'],
});
addPartyKind('lantern', { rank: 5,
  label: 'Lantern Night', hud: 'Lantern Night!',
  morning: 'It\'s Lantern Night. Everyone\'s making paper lanterns to let go from the party field at ten o\'clock.',
  note: 'Lantern Night: the party field is lit, and everyone\'s brought a paper lantern to let go.',
  show: (x, y) => skyLanterns(x, y),
  lines: ['Mine\'s got a moon on it.', 'Make a wish before you let go!', 'Careful! Don\'t set fire to the hay.'],
});
addPartyKind('birthday', { rank: 2, also: () => { const h = partyHost(); return h ? `${h.first}'s birthday` : 'a birthday'; },
  label: 'A birthday party', hud: 'Birthday party!',
  note: () => { const h = partyHost(); return h ? `${h.name()}'s birthday party has begun in the party field. True to custom, ${h.pron.they} has a present for every guest!` : 'There\'s a birthday party in the party field tonight!'; },
  lines: ['Happy birthday!', 'Many happy returns!', 'Speech! Speech!', 'Look, a present! For me!'],
});
addPartyKind('holiday', { rank: 2,
  label: 'A holiday', hud: 'Holiday!', dayOff: true, fireworks: 6,
  note: () => `The lanterns are lit in the party field for ${(Game.holiday && Game.holiday.name) || 'the holiday'}.`,
  lines: ['A holiday! Whatever next?', 'I say we have one every week.'],
});

// --- The calendar of occasions --------------------------------------------------
// Fixed days of the village's year (dayOfYear), besides the four festivals.
const FIXED_OCCASIONS = { 1: 'founding', 9: 'lantern' };
const HOLIDAYS = [
  ['Swallow Day', 'the first swallows are back under the eaves', ['spring', 'summer']],
  ['Piglet Day', 'the miller\'s sow has had eleven piglets, and every one of them squealing', null],
  ['Dry Feet Day', 'it\'s a hundred days since anybody fell in the river', null],
  ['Rainbow Day', 'a rainbow came down in the party field, and you can\'t not', ['spring', 'summer', 'autumn']],
  ['Old Took\'s Day', 'it\'s somebody\'s great-great-grandfather\'s birthday, nobody\'s sure whose', null],
  ['Bee Day', 'the bees swarmed and nobody was stung', ['spring', 'summer']],
  ['Pudding Day', 'it\'s the anniversary of the Great Pudding, which fed forty', null],
  ['Snow Day', 'the snow\'s too deep to work in and too good to waste', ['winter']],
  ['Conker Day', 'the conkers are down, and the little ones won\'t think about anything else', ['autumn']],
  ['Idle Day', 'nobody could think of a good reason not to', null],
];
function occasionOn(day) {
  const doy = dayOfYear(day);
  if (dayOfSeason(day) === 2) return FESTIVALS[seasonKey(day)][0];
  const f = FIXED_OCCASIONS[doy];
  if (f === 'founding' && day <= YEAR_DAYS) return null;
  return f || null;
}
// The next few fixed occasions, for the dev drawer.
function upcomingOccasions(n = 4) {
  const out = [];
  for (let d = Game.day; out.length < n && d < Game.day + YEAR_DAYS + 1; d++) { const k = occasionOn(d); if (k) out.push([d, k]); }
  return out;
}

// Seven o'clock: what's on today.
function planOccasion() {
  const day = Game.day, fixed = occasionOn(day);
  if (fixed && dayOfSeason(day) !== 2) {
    // the festivals are planned when the season turns; the rest here
    const k = PARTY_KINDS[fixed];
    if (Game.party.planned !== fixed && partyRank(Game.party.planned) < k.rank) { if (Game.party.planned) alsoToast(Game.party.planned); Game.party.planned = fixed; }
    if (k.dayOff) Game.holiday = { day, key: fixed, name: k.label };
    if (k.morning) chronicle(kindVal(k.morning), 'party');
    return;
  }
  if (fixed || partyRank(Game.party.planned) >= 2 || Game.party.on) return;
  // a birthday party, every couple of days or so, for one of the day's birthday folk
  const bday = Game.villagers.filter((v) => birthdayToday(v) && !v.leaving && v.stage !== 'baby' && (v.isGrown() || kidBand(v) !== 'toddler'));
  if (bday.length && day - (Game.lastBirthdayParty ?? -9) >= 2 && R.chance(0.6)) {
    const host = R.pick(bday.filter((v) => v.isGrown())) || R.pick(bday);
    if (Game.party.planned) alsoToast(Game.party.planned);
    Game.party.planned = 'birthday'; Game.party.host = host.id; Game.lastBirthdayParty = day;
    chronicle(host.isGrown()
      ? `${host.name()} is throwing a birthday party in the party field tonight, and the whole village is invited. There'll be a present for every guest, as is proper.`
      : `Little ${host.first} is having a birthday party in the party field tonight! Everyone's invited, and ${host.pron.they}'s been wrapping presents for days.`, 'party');
    return;
  }
  // now and then a holiday is declared, for whatever reason comes to hand
  if (day - (Game.lastHoliday ?? -9) >= 5 && R.chance(0.15)) {
    const pool = HOLIDAYS.filter((h) => !h[2] || h[2].includes(World.season));
    const [name, why] = R.pick(pool);
    Game.lastHoliday = day;
    Game.holiday = { day, key: 'holiday', name };
    if (Game.party.planned) alsoToast(Game.party.planned);
    Game.party.planned = 'holiday';
    for (const v of Game.villagers) if (v.stage !== 'baby') feel(v, 'holiday', name);
    chronicle(`A holiday has been declared: ${name}, because ${why}. Tools down, and a party tonight!`, 'party');
  }
}

// Two occasions on one night: the lesser is toasted at the greater.
function alsoToast(reason) {
  const k = partyKind(reason), name = kindVal(k.also, reason);
  if (!name) return;
  const a = Game.party.also || (Game.party.also = []);
  if (!a.includes(name)) a.push(name);
}
function schedulePartyFor(reason, plan) {
  const p = Game.party, cur = p.on ? p.reason : p.planned;
  if (cur && cur !== reason && partyRank(cur) >= partyRank(reason)) { alsoToast(reason); if (p.on) p.until = Math.max(p.until, Game.time + 120); return; }
  if (cur && cur !== reason) alsoToast(cur);
  plan(reason);
}

// Mayday's Queen or King of the May: one of the young folk, crowned with flowers.
function crownMay() {
  const pool = Game.villagers.filter((v) => !v.leaving && ((v.isChild() && kidBand(v) === 'youth') || (v.stage === 'adult' && v.years() < 50)));
  const v = R.pick(pool);
  if (!v) return;
  const title = v.pron.they === 'she' ? 'Queen' : 'King';
  feel(v, 'crowned', title);
  v.remember(`Was crowned ${title} of the May.`, 2);
  chronicle(`${v.name()} has been crowned ${title} of the May, with a garland of hawthorn blossom, and leads the first dance round the maypole.`, 'party');
}

// --- Starting, the fireworks and the end ----------------------------------------
function partyFireworks(h) {
  if (!Game.party.on || Game.raining) return;
  const k = partyKind(), x = PARTY.danceX * 16 + 8, y = (PARTY.danceY - 3) * 16;
  if (h === 22 && k.show) { k.show(x, y, h); return; }
  const n = kindVal(h === 22 ? k.fireworks : k.encore) || 0;
  if (n > 0) fireworkShow(x, y, n);
}
// The party's start hour, for a planned one.
function partyStartsAt(k) { return k.startAt ?? (k.feast ? 16 : 18); }
function occasionHour(h) {
  if (h === 7) planOccasion();
  const p = Game.party, planned = p.planned;
  if (!p.on && planned && !Game.raining) {
    const k = partyKind(planned), at = partyStartsAt(k);
    // a planned occasion starts at its hour, or as soon after as the rain lets it
    if (h >= at && h <= (k.lunch ? at + 2 : Math.max(at + 2, 20))) startParty(planned);
  }
  if (!p.on && !p.planned && h === 18 && !Game.raining && R.chance(0.07) && Game.day - (Game.lastParty ?? -9) >= 2) startParty('evening');
  if (h === 21 && !p.on && p.planned && Game.raining) { const k = partyKind(p.planned); if (!k.lunch) { chronicle(`The rain has put paid to ${k.label.charAt(0).toLowerCase() + k.label.slice(1)} tonight. Everyone's gone home damp.`, 'info'); p.planned = null; } }
  if (h === 21 && p.on && p.reason === 'birthday') birthdaySpeech();
  if (p.on && p.also && p.also.length) {
    // comings of age are nearly nightly, and only worth a word if there's company
    const a = p.also.splice(0);
    const w = a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0];
    if (a.length === 1 && a[0] === PARTY_KINDS['coming-of-age'].also) devLog('party', `also toasted: ${w}`);
    else chronicle(R.pick([`While they're at it, the party drinks to ${w} too.`, `A mug is raised to ${w} as well.`, `Nobody forgets ${w}: there's a toast for them too.`]), 'party');
  }
  if (h === 22 || h === 23) partyFireworks(h);
  if (h === 0) { p.planned = null; if (!p.on) { p.host = null; p.also = null; } }
  if (!p.on && feastUp()) takeDownTables();
}

// --- Birthday parties ------------------------------------------------------------
function birthdaySpeech() {
  const h = partyHost();
  if (!h || h.inside) return;
  const n = (Game.party.given || []).length;
  h.say(R.pick([
    'Thank you all for coming! I don\'t know half of you as well as I\'d like, and I like more than half of you better than you\'d think.',
    `Friends! ${n > 1 ? `${n} of you` : 'You'} came to my party, and I'm very much obliged. Now: who wants cake?`,
    'A speech? Oh, very well. Thank you all, and there\'s cake, and that\'s my speech.',
  ]), 6);
  for (const v of Game.villagers) if (v !== h && v.task && v.task.a.id === 'party' && v.task.phase === 'do' && R.chance(0.4)) v.say(R.pick(['Hear, hear!', 'Happy birthday!', 'Speech! ...Oh, that was it.', '*cheers*']), 3);
}
// A guest at a birthday party gets a present from the birthday hobbit, once.
function birthdayGuest(v, task) {
  const h = partyHost();
  if (!h || h === v || task.data.present || h.inside || dist(h.x, h.y, v.x, v.y) > 12 * 16) return;
  if (!h.task || h.task.a.id !== 'party') return;
  const given = Game.party.given || (Game.party.given = []);
  task.data.present = true;
  if (given.includes(v.id)) return;
  given.push(v.id);
  feel(v, 'bday_guest', h.first);
  if (given.length <= 16) {
    const what = givePresent(h, v, 'party');
    if (R.chance(0.35)) v.say(R.pick([`${what.charAt(0).toUpperCase() + what.slice(1)}! Thank you, ${h.first}!`, 'A present! But it\'s your birthday!', 'Happy birthday, and thank you!']), 3);
  }
}

// --- Holidays: a day off ----------------------------------------------------------
const holidayToday = () => !!(Game.holiday && Game.holiday.day === Game.day);

// --- The long tables --------------------------------------------------------------
const COURSES = [
  { key: 'soup', at: 75, label: 'the soup', food: ['stew', 'veg', 'mush'], say: ['Ooh, leek and potato.', 'Pass the bread, {name}.', 'Mind, it\'s hot!', 'More soup? Don\'t mind if I do.'] },
  { key: 'main', at: 110, label: 'the mains', food: ['pie', 'fish', 'cheese', 'egg', 'bread', 'veg', 'stew'], say: ['Pass the gravy, {name}!', 'Is there more pie? There\'s always more pie.', 'This is the best mushroom pie I\'ve had all year.', 'Don\'t hog the taters, {name}.', 'I\'ll just have a sliver. A big sliver.'] },
  { key: 'pudding', at: 145, label: 'pudding', food: ['cake', 'apple', 'honey', 'pie'], say: ['Pudding! I saved room. Mostly.', 'Seed-cake and cream!', 'Is that honey cake? {name}, is that honey cake?', 'I couldn\'t. ...Well, a small one.'] },
  { key: 'toast', at: 175, label: 'the toast', food: [] },
];
// the tables go out well before the soup, since folk come from all over the valley
const FEAST_LEN = 205;
const feastOn = () => !!(Game.party.on && Game.party.feast && Game.time < Game.party.feast.start + FEAST_LEN);
// Long tables want a clear strip of ground with room to sit either side: in
// the party field round the dance floor (the field's ground is the party's,
// so its being spoken for is no bar), or failing that in the square. Each is
// five to nine places long, and as many go out as it takes to seat everyone.
function feastLayout() {
  const F = World._feast;
  if (F && F.statics === World.statics) return F;
  const out = { statics: World.statics, tables: [], up: false, blocked: [] };
  World._feast = out;
  const inField = (x, y) => Math.hypot(x - PARTY.cx, (y - PARTY.cy) * 1.4) < 13;
  const onFloor = (x, y) => Math.abs(x - PARTY.danceX) < 5 && Math.abs(y + 0.5 - PARTY.danceY) < 3.6;
  const okTile = (x, y) => walkable(x, y) && !onFloor(x, y) && (!World.reserved[tIdx(x, y)] || inField(x, y)) && [T.GRASS, T.LAWN, T.PATH, T.COBBLE].includes(tileAt(x, y));
  // with a way round each end, so a table never shuts a lane or butts against another
  const fits = (x0, ty, L) => {
    if (!walkable(x0 - 1, ty) || !walkable(x0 + L, ty)) return false;
    for (let x = x0; x < x0 + L; x++) for (let y = ty - 1; y <= ty + 1; y++) if (!okTile(x, y)) return false;
    return true;
  };
  const cands = [];
  const look = (cx, cy, r, bias) => {
    for (let ty = Math.floor(cy - r); ty <= cy + r; ty++) for (let x0 = Math.floor(cx - r - 5); x0 <= cx + r; x0++) for (let L = 9; L >= 5; L--) {
      if (!fits(x0, ty, L)) continue;
      let paths = 0;
      for (let x = x0; x < x0 + L; x++) if (tileAt(x, ty) === T.PATH || tileAt(x, ty) === T.COBBLE) paths++;
      cands.push({ x0, ty, L, s: Math.hypot(x0 + L / 2 - cx, (ty - cy) * 1.4) + (9 - L) * 1.2 + paths * 2 + bias });
      break;
    }
  };
  look(PARTY.cx, PARTY.cy + 2, 10, 0);
  look(PLAZA.cx, PLAZA.cy, 8, 25);
  cands.sort((a, b) => a.s - b.s);
  for (const c of cands) {
    if (out.tables.length >= 5) break;
    // the tables keep a row between them for passing behind the chairs
    if (out.tables.some((t) => Math.abs(t.ty - c.ty) < 4 && c.x0 < t.x0 + t.L + 1 && t.x0 < c.x0 + c.L + 1)) continue;
    // and a short way round from one side to the other, with the tables already chosen up
    const shut = [];
    for (const t of out.tables.concat([c])) for (let x = t.x0; x < t.x0 + t.L; x++) { const i = tIdx(x, t.ty); if (!World.block[i]) { World.block[i] = 1; shut.push(i); } }
    const mid = c.x0 + (c.L >> 1), way = findPath(mid, c.ty - 1, mid, c.ty + 1);
    for (const i of shut) World.block[i] = 0;
    if (!way || way.length > c.L + 8) continue;
    out.tables.push({ x0: c.x0, ty: c.ty, L: c.L });
  }
  for (const t of out.tables) {
    t.seats = [];
    for (let i = 0; i < t.L; i++) {
      const x = (t.x0 + i) * 16 + 8;
      t.seats.push(makeSpot(x, t.ty * 16 - 2, 'down', 'sit', 'partyseat'), makeSpot(x, (t.ty + 1) * 16 + 6, 'up', 'sit', 'partyseat'));
    }
    for (const s of t.seats) s.feast = true;
  }
  return out;
}
function feastUp() { const F = World._feast; return !!(F && F.statics === World.statics && F.up); }
function putUpTables() {
  const F = feastLayout();
  if (F.up) return F;
  // as many tables as it takes to seat everyone, nearest first
  const folk = Game.villagers.filter((v) => v.stage !== 'baby').length;
  F.used = []; let seats = 0;
  for (const t of F.tables) { if (seats >= folk) break; F.used.push(t); seats += t.L * 2; }
  F.useSeats = F.used.flatMap((t) => t.seats);
  for (const t of F.used) {
    if (!t.st) t.st = World._addStatic(longTableImg(t.L, -1), (t.x0 * 16) + t.L * 8, t.ty * 16 + 13, { snow: false });
    t.st.hidden = false;
    for (let x = t.x0; x < t.x0 + t.L; x++) { const i = tIdx(x, t.ty); if (!World.block[i]) { World.block[i] = 1; F.blocked.push(i); } }
  }
  for (const s of F.useSeats) if (!World.partySeats.includes(s)) World.partySeats.push(s);
  F.up = true;
  setTableCourse(Game.party.feast ? Game.party.feast.course : 3);
  return F;
}
function takeDownTables() {
  const F = World._feast;
  if (!F || !F.up) return;
  for (const v of Game.villagers) if (v.task && v.task.spot && v.task.spot.feast) v.task.t = Math.min(v.task.t, 0.5);
  for (const t of F.tables) if (t.st) t.st.hidden = true;
  for (const i of F.blocked) World.block[i] = 0;
  F.blocked = [];
  World.partySeats = World.partySeats.filter((s) => !s.feast);
  F.up = false;
}
function setTableCourse(c) {
  const F = World._feast;
  if (!F || !F.used) return;
  for (const t of F.used) if (t.st) { t.st.img = t.st.base = longTableImg(t.L, c); }
}
// A trestle table seen from above, a white cloth hanging over its front edge:
// a plate and a cup at every place, candles in brass sticks down the middle,
// and whatever's being served. -1 is the table laid; then the soup (tureens,
// bowls, loaves), the mains (pies, a roast bird, taters, greens), pudding (a
// tall cake, apples, a honey pot, a jug of cream) and last the crumbs, with
// a mug of ale at every place for the toast.
const TABLE_IMGS = {};
function longTableImg(L, course) {
  const key = L + ':' + course;
  if (TABLE_IMGS[key]) return TABLE_IMGS[key];
  const W = L * 16 - 2, H = 22;
  const [c, x] = makeCanvas(W + 2, H + 2);
  const R = (col, X, Y, w, h) => { x.fillStyle = col; x.fillRect(1 + X, 1 + Y, w, h); };
  // the trestles under it, and the boards showing at either end
  for (const lx of [4, W - 6]) { R('#4a2e1a', lx, 13, 2, 8); R('#3a2414', lx - 2, 20, 6, 2); R('#5a3a22', lx - 1, 16, 4, 1); }
  R('#6a4428', 0, 1, W, 13); R('#8a5a32', 0, 1, W, 1);
  // the cloth, with a scalloped hem along the front
  R('#efe6cf', 2, 1, W - 4, 12); R('#f8f2e4', 2, 1, W - 4, 1);
  R('#ddd0b4', 2, 13, W - 4, 2);
  for (let i = 3; i < W - 3; i += 4) R('#c8ba9a', i, 15, 2, 1);
  for (let i = 5; i < W - 3; i += 16) R('#e4d8bc', i, 6, 6, 1);
  const PLATE = (px, py, food) => {
    R('#c8c0b0', px - 1, py + 1, 7, 2); R('#ffffff', px, py, 5, 3); R('#e8e4dc', px + 1, py + 1, 3, 1);
    if (food) food(px, py);
  };
  const ON_PLATE = {
    0: (X, Y) => { R('#d8862a', X + 1, Y, 3, 2); R('#f0b04a', X + 2, Y, 1, 1); },
    1: (X, Y) => { R('#a8642a', X + 1, Y, 2, 2); R('#5a9a3a', X + 3, Y, 1, 2); R('#f0d890', X + 2, Y + 1, 1, 1); },
    2: (X, Y) => { R('#e8a0b0', X + 1, Y, 3, 2); R('#fff4e8', X + 1, Y, 3, 1); },
    3: (X, Y) => { R('#c8a46a', X + 2, Y + 1, 1, 1); },
  };
  for (let i = 0; i < L; i++) {
    const px = i * 16 + 5, h = hash2(i * 7 + L, course + 9);
    // the two places: plates and cups (mugs of ale, for the toast)
    for (const [py, cy] of [[2, 1], [10, 11]]) {
      PLATE(px, py, ON_PLATE[course]);
      if (course === 3) { R('#c9a46a', px + 7, cy, 3, 3); R('#f4f0e0', px + 7, cy, 3, 1); R('#9a7a4a', px + 10, cy + 1, 1, 1); }
      else { R('#9a9488', px + 7, cy + 1, 2, 2); R('#c8c4bc', px + 7, cy + 1, 2, 1); }
    }
    // down the middle
    const mx = i * 16 + 3;
    if (i % 3 === 1) {
      // a candle in a brass stick, burning lower as the night goes on
      const ch = course < 1 ? 4 : course < 3 ? 3 : 2;
      R('#b8902a', mx + 3, 8, 4, 1); R('#e8c860', mx + 4, 7, 2, 1);
      R('#f4efe2', mx + 4, 7 - ch, 2, ch); R('#ffe080', mx + 4, 6 - ch, 2, 1); R('#fff8d0', mx + 4, 6 - ch, 1, 1);
      continue;
    }
    if (course === -1) {
      if (h < 0.5) { R('#5a8a3a', mx + 3, 6, 4, 2); R('#d84a5a', mx + 3, 5, 1, 1); R('#f0d040', mx + 5, 5, 1, 1); R('#f4f0f8', mx + 6, 6, 1, 1); }
      else { R('#a87a3a', mx + 2, 5, 7, 3); R('#d8a860', mx + 3, 5, 2, 1); R('#d8a860', mx + 6, 5, 2, 1); }
    } else if (course === 0) {
      if (i % 3 === 0) { R('#e8e0d0', mx + 1, 4, 9, 5); R('#ffffff', mx + 2, 4, 7, 1); R('#c8c0b0', mx + 1, 8, 9, 1); R('#d8862a', mx + 3, 5, 5, 2); R('#a89880', mx + 5, 3, 1, 1); }
      else { R('#c8945a', mx + 2, 5, 7, 3); R('#e8b86a', mx + 3, 5, 5, 1); R('#8a5a2a', mx + 4, 7, 3, 1); }
    } else if (course === 1) {
      if (i % 3 === 0 && h < 0.6) { R('#e8e0d0', mx, 4, 11, 5); R('#c8c0b0', mx, 8, 11, 1); R('#a8642a', mx + 2, 4, 7, 4); R('#c8844a', mx + 3, 4, 4, 1); R('#f4efe2', mx + 1, 5, 1, 1); R('#f4efe2', mx + 9, 5, 1, 1); }
      else if (i % 3 === 0) { R('#d8a050', mx + 1, 4, 9, 5); R('#f0c870', mx + 2, 4, 7, 1); for (let k = 0; k < 3; k++) R('#a86a2a', mx + 2 + k * 3, 6, 2, 1); }
      else { R('#e8e0d0', mx + 2, 5, 7, 4); R(h < 0.5 ? '#f0d890' : '#5a9a3a', mx + 3, 5, 5, 2); R(h < 0.5 ? '#d8b860' : '#3a7a2a', mx + 4, 6, 2, 1); }
    } else if (course === 2) {
      if (i % 3 === 0) { R('#f4e8e0', mx + 2, 2, 7, 7); R('#e88aa0', mx + 2, 2, 7, 2); R('#fff4f0', mx + 2, 5, 7, 1); R('#d83a4a', mx + 5, 1, 1, 1); R('#c8b8a8', mx + 2, 8, 7, 1); }
      else if (h < 0.5) { for (const [ax, ay] of [[3, 5], [5, 5], [7, 5], [4, 4], [6, 4], [5, 3]]) R('#c83a2a', mx + ax, ay, 2, 2); R('#e86a4a', mx + 5, 3, 1, 1); }
      else { R('#d89a2a', mx + 3, 4, 4, 4); R('#f0c050', mx + 3, 4, 4, 1); R('#8a5a2a', mx + 3, 3, 4, 1); R('#f4f0e0', mx + 7, 5, 2, 3); }
    } else {
      R('#e8e0d0', mx + 2, 6, 6, 2); R('#c8a46a', mx + 4, 5, 1, 1); R('#c8a46a', mx + 7, 7, 1, 1);
    }
  }
  return (TABLE_IMGS[key] = outlineCanvas(c, OUTLINE));
}
// Serves the next course, when it's time: the food comes out of the Store,
// everyone at table eats, and after pudding there's a toast.
function feastStep() {
  const f = Game.party.feast;
  if (!f || !Game.party.on) return;
  const k = partyKind(), t = Game.time - f.start;
  for (const p of (f.pending || []).filter((q) => q.at <= Game.time)) { const v = personById(p.id); if (v && !v.inside) v.say(p.text, 3); }
  if (f.pending) f.pending = f.pending.filter((q) => q.at > Game.time);
  while (f.course < COURSES.length - 1 && t >= COURSES[f.course + 1].at) {
    f.course++;
    const C = COURSES[f.course];
    const diners = Game.villagers.filter((v) => v.task && v.task.spot && v.task.spot.feast && v.task.phase === 'do');
    if (C.key === 'toast') { feastToast(k, diners); setTableCourse(3); continue; }
    // a helping each, from what the Store has, the course's own first
    let need = k.paid ? 0 : Math.ceil(diners.length * 0.35), got = 0;
    for (const res of C.food.concat(PANTRY_KINDS, ['stew'])) {
      if (need <= 0) break;
      const n = Math.min(need, Math.floor(Village.stores[res] || 0));
      if (n > 0) { Village.use(res, n); need -= n; got += n; }
    }
    const share = k.paid || !diners.length ? 1 : clamp(got / Math.max(1, Math.ceil(diners.length * 0.35)), 0.2, 1);
    for (const v of diners) {
      v.drives.hunger = Math.max(0, v.drives.hunger - 0.38 * share);
      v.drives.thirst = Math.max(0, v.drives.thirst - 0.15);
      v.drives.bored = Math.max(0, v.drives.bored - 0.1);
    }
    if (share < 0.5 && f.course === 1 && !f.thin) { f.thin = true; chronicle('The Store is bare, and the courses at the long tables are thin ones. Folk are making the best of it.', 'info'); }
    setTableCourse(f.course);
  }
}
function feastToast(k, diners) {
  let host = k.host ? k.host() : null;
  if (!host || !diners.includes(host)) host = diners.slice().sort((a, b) => b.age - a.age)[0];
  if (!host) return;
  const text = k.toast ? k.toast(host) : 'To Thistledown, and everyone in it!';
  host.say(text, 6);
  if (Village.stores.ale > 0) Village.use('ale', Math.min(Village.stores.ale, Math.ceil(diners.length / 3)));
  const f = Game.party.feast;
  f.pending = diners.filter((v) => v !== host && R.chance(0.45)).slice(0, 8).map((v, i) => ({ id: v.id, at: Game.time + 1.5 + i * 0.4, text: R.pick(v.isChild() ? ['Hooray!', 'Is there more pudding?'] : ['Hear, hear!', 'Hear, hear!', 'Cheers!', 'To Thistledown!', '*raises a mug*']) }));
  for (const v of diners) { if (!v.isChild() && Village.stores.ale > 0) v.chem.ale = clamp(v.chem.ale + 0.12, 0, 1); }
  chronicle(`At the long tables, ${host.name()} stands and raises a mug: "${text}"`, 'party');
}
function feastBegin() {
  const f = Game.party.feast;
  f.course = -1; f.pending = [];
  putUpTables();
}

// The diner's part.
ACTIONS.feast = {
  id: 'feast', label: 'Dining at the long tables', icon: 'pie', sat: { hunger: -0.45, lonely: -0.7, bored: -0.6, thirst: -0.15 }, dur: FEAST_LEN, pose: 'sit', social: true, stages: AWAKE, meal: true,
  avail: () => feastOn(),
  extra: (v) => 1.8 + (v.isChild() ? 0.3 : 0),
  label2: (v) => { const f = Game.party.feast, c = f && COURSES[f.course]; return c ? (c.key === 'toast' ? 'Raising a mug at the long tables' : `At the long tables: ${c.label}`) : 'Sitting down to dinner at the long tables'; },
  // the far side first, facing the rest of the party, then the near
  target: (v) => {
    if (!feastUp()) putUpTables();
    const seats = World._feast.useSeats || [];
    return freeSpot(v, seats.filter((s) => s.facing === 'down')) || freeSpot(v, seats) || freeSpot(v, World.partySeats);
  },
  start: (v, task) => { task.chatLock = true; if (task.spot) task.spot.prop = 'mug'; return true; },
  tick: (v, task, dt) => {
    feastStep();
    if (!feastOn()) { task.t = Math.min(task.t, 1); return; }
    task.t = Math.max(task.t, 5);
    const f = Game.party.feast, C = COURSES[f.course];
    if (C && C.say && Math.random() < dt * 0.012) {
      const near = Game.villagers.find((o) => o !== v && o.task && o.task.a.id === 'feast' && dist(o.x, o.y, v.x, v.y) < 40);
      v.say(R.pick(C.say).replace('{name}', near ? near.first : 'there'), 3, { to: near || null });
    }
  },
  done: (v) => feel(v, 'feast_dined'),
};
ACTION_NAMES.feast = 'Feasts';
ARMS_OK.add('feast');

// --- Lantern Night -------------------------------------------------------------
// Paper lanterns, each with a candle in it, drifting up and away on the night air.
const SKY_LANTERNS = [];
function skyLanterns(x, y) {
  const folk = Game.villagers.filter((v) => !v.inside && v.task && v.task.a.id === 'party' && dist(v.x, v.y, x, y) < 20 * 16);
  for (const v of folk) feel(v, 'lantern');
  const n = clamp(folk.length + 6, 10, 36);
  for (let i = 0; i < n; i++) {
    const v = folk[i % Math.max(1, folk.length)];
    SKY_LANTERNS.push({ x: v ? v.x : x + R.f(-60, 60), y: v ? v.y - 14 : y + R.f(-10, 20), vx: R.f(-3, 3), vy: -R.f(7, 11), t: -i * R.f(0.3, 0.7), life: R.f(30, 40), ph: R.f(0, 6), col: R.pick(['#ffb050', '#ffcf70', '#ff9a50', '#ffe090']) });
  }
  Game.fireworks = { x, y, until: Game.time + 50 };
}
patch(FX, 'update', (update) => function (dt) {
  for (let i = SKY_LANTERNS.length - 1; i >= 0; i--) {
    const l = SKY_LANTERNS[i];
    l.t += dt;
    if (l.t >= l.life) { SKY_LANTERNS.splice(i, 1); continue; }
    if (l.t < 0) continue;
    l.vy = Math.max(l.vy - dt * 0.3, -16);
    l.x += (l.vx + Math.sin(l.t * 0.6 + l.ph) * 2) * dt; l.y += l.vy * dt;
  }
  return update.apply(this, arguments);
}, 'lantern night');
patch(FX, 'draw', (draw) => function (ctx, emissive) {
  const r = draw.apply(this, arguments);
  if (emissive) for (const l of SKY_LANTERNS) {
    if (l.t < 0) continue;
    // a paper lantern, a little smaller as it goes higher, in half-pixel steps
    const f = l.t / l.life, a = f > 0.8 ? (1 - f) / 0.2 : 1, big = f < 0.45;
    const X = Math.round(l.x * RS) / RS, Y = Math.round(l.y * RS) / RS, H = 1 / RS;
    const P = (dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(X + dx * H, Y + dy * H, w * H, h * H); };
    ctx.globalAlpha = a;
    if (big) {
      P(-3, -6, 6, 1, shade(l.col, -0.45)); P(-4, -5, 8, 9, shade(l.col, -0.15)); P(-3, -5, 6, 9, l.col);
      P(-2, -3, 4, 5, Math.sin(l.t * 7 + l.ph) > -0.6 ? '#fff2b0' : '#ffe090'); P(-3, 4, 6, 1, shade(l.col, -0.45)); P(-1, 5, 2, 1, '#fff6c0');
    } else { P(-2, -3, 4, 5, l.col); P(-1, -2, 2, 3, '#fff2b0'); }
    ctx.globalAlpha = 1;
  }
  return r;
}, 'lantern night');
patch(FX, 'lights', (lights) => function (out) {
  for (const l of SKY_LANTERNS) if (l.t >= 0) out.push({ x: l.x, y: l.y, r: 22 * (1 - (l.t / l.life) * 0.5), a: 0.7 * (l.t / l.life > 0.8 ? (1 - l.t / l.life) / 0.2 : 1), col: '#ffb860' });
  return lights.apply(this, arguments);
}, 'lantern night');

// --- How the occasions lean everyone's choices ---------------------------------
patch(Villager.prototype, 'score', (score) => function (a, h, ex) {
  let s = score.call(this, a, h, ex);
  if (s <= 0) return s;
  const mul = (name, f) => { s *= f; if (ex) ex.mul.push([name, f]); };
  // a holiday is a day off, as on Highday
  if (holidayToday() && !isRestDay(Game.day)) {
    if (a.job && !NEVER_REST.has(a.id)) mul('holiday', 0.3);
    else if (LEISURE.has(a.id) || a.hobby) mul('holiday', 1.3);
  }
  // no dancing till after dinner
  if (a.id === 'party' && feastOn()) mul('dinner first', 0.2);
  if (a.id === 'party' && Game.party.reason === 'birthday' && Game.party.host === this.id) mul('own birthday party', 3);
  return s;
}, 'occasions');
// who's being wed, for the wedding feast's toast
patch(window, 'wed', (wed) => function (a, b) { Game.party.couple = [a.id, b.id]; return wed.apply(this, arguments); }, 'occasions');
patch(Villager.prototype, 'isBusyForChat', (busy) => function () { return busy.call(this) || !!(this.task && this.task.a.id === 'feast'); }, 'occasions');
{
  const tick = ACTIONS.party.tick;
  ACTIONS.party.tick = (v, task, dt) => {
    if (tick) tick(v, task, dt);
    if (Game.party.reason === 'birthday') birthdayGuest(v, task);
    const k = partyKind();
    if (k.lines && Math.random() < dt * 0.006) v.say(R.pick(k.lines), 3);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  // the night's bigger occasion goes ahead, and the smaller one is toasted at it
  patch(Game, 'schedulePartyTonight', (sched) => function (reason) { schedulePartyFor(reason, (r) => sched.call(this, r)); }, 'occasions');
  registerField('holiday', null, { nullish: true });
  registerField('lastBirthdayParty', -9, { nullish: true });
  registerField('lastHoliday', -9, { nullish: true });
  registerField('lastParty', -9, { nullish: true });
  addHook('onHour', occasionHour);
  // candlelight down the long tables after dark
  patch(window, 'collectLights', (collect) => function () {
    const L = collect.apply(this, arguments);
    if (Game.darkness > 0.01 && feastUp()) for (const t of World._feast.used) for (let i = 1; i < t.L; i += 3) L.push({ x: (t.x0 + i) * 16 + 8, y: t.ty * 16 + 1, r: 26, a: 0.85, warm: true, glow: 1.2 });
    return L;
  }, 'occasions');
  addHook('newVillage', () => { World._feast = null; SKY_LANTERNS.length = 0; Game.holiday = null; });
});
