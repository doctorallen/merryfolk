'use strict';
// ---------------------------------------------------------------------------
// The village calendar and birthdays.
//
// The Shire keeps a seven-day week: Sterday, Sunday, Monday, Trewsday,
// Hevensday, Mersday and Highday. Trewsday is market day, and folk come to
// the square to stock their larders and see who's about. Mersday evening is
// the sing-song at the Tipsy Badger. Highday is the day of rest: the trades
// mostly down tools, folk lie in, and the day goes on gardens, hobbies,
// rambles, fishing and long teas.
//
// Everyone has a birthday, once in the village's year of four seasons. As is
// proper among hobbits, it's the birthday hobbit who gives the presents:
// something for everyone at home over breakfast, then a round of visits to
// family and dear friends in other holes. Little ones get a present from
// their parents too.
// ---------------------------------------------------------------------------

const WEEKDAYS = ['Sterday', 'Sunday', 'Monday', 'Trewsday', 'Hevensday', 'Mersday', 'Highday'];
const YEAR_DAYS = SEASON_DAYS * 4;
const weekday = (day) => WEEKDAYS[(day - 1) % 7];
const isMarketDay = (day) => weekday(day) === 'Trewsday';
const isRestDay = (day) => weekday(day) === 'Highday';
const isSingNight = (day) => weekday(day) === 'Mersday';
// trades that can't stop for a day of rest
const NEVER_REST = new Set(['work_inn', 'work_lamps', 'work_nanny', 'work_herd', 'nurse', 'work_mail']);
const LEISURE = new Set(['garden', 'fish', 'tea', 'stroll', 'read', 'smoke', 'chat', 'play', 'watch', 'eat_inn', 'party', 'forage']);

function dayOfYear(day) { return ((day - 1) % YEAR_DAYS) + 1; }
function bdayOf(v) {
  if (v.bday == null) v.bday = v.born ? dayOfYear(Math.max(1, v.born)) : 1 + ((v.id * 7 + 3) % YEAR_DAYS);
  return v.bday;
}
function bdayWords(v) { const d = bdayOf(v); return `${['1st', '2nd', '3rd'][(d - 1) % SEASON_DAYS] || ((d - 1) % SEASON_DAYS + 1) + 'th'} of ${SEASONS[Math.floor((d - 1) / SEASON_DAYS)]}`; }
function birthdayToday(v) { return v.stage !== 'baby' && bdayOf(v) === dayOfYear(Game.day) && v.born !== Game.day; }
function dayWords(day) {
  return weekday(day) + (isMarketDay(day) ? ' · market day' : isRestDay(day) ? ' · day of rest' : isSingNight(day) ? ' · sing-song night' : '');
}

// The calendar leans everyone's choices a little.
{
  patch(Villager.prototype, 'score', (score) => function (a, h, ex) {
    let s = score.call(this, a, h, ex);
    if (s <= 0) return s;
    const mul = (name, f) => { s *= f; if (ex) ex.mul.push([name, f]); };
    const day = Game.day;
    if (isMarketDay(day) && a.id === 'market' && h >= 8 && h < 15) mul('market day', 2.2);
    if (isRestDay(day)) {
      if (a.job && !NEVER_REST.has(a.id)) mul('day of rest', 0.3);
      else if (LEISURE.has(a.id) || a.hobby) mul('day of rest', 1.35);
      if (a.id === 'sleep' && h >= 6 && h < 9.5) mul('a lie-in', 2);
    }
    if (isSingNight(day) && h >= 18.5 && h < 23.5 && this.isGrown() && (a.id === 'ale' || a.id === 'eat_inn')) mul('sing-song night', 1.8);
    if (birthdayToday(this) && (a.id === 'eat_inn' || a.id === 'tea' || a.id === 'party')) mul('birthday', 1.4);
    return s;
  }, 'calendar');
}

// What a birthday present might be.
function presentFor(giver, to) {
  const home = giver.homeId >= 0 ? giver.home() : null;
  const made = home ? Object.entries(homeCrafts(home)).filter(([, n]) => n > 0) : [];
  if (made.length && R.chance(0.6)) {
    const [k] = R.pick(made);
    homeCrafts(home)[k]--;
    homeCrafts(to.home())[k] = (homeCrafts(to.home())[k] || 0) + 1;
    return `a ${HOBBIES[k].made[0]} ${giver.pron.they} made`;
  }
  if (!to.isGrown()) return R.pick(['a wooden whistle', 'a toy boat', 'a bag of humbugs', 'a spinning top', 'a picture book', 'a rag doll', 'a box of marbles']);
  return R.pick(['a jar of honey', 'a pot of bramble jam', 'a new pipe', 'a pair of warm socks', 'a pretty teacup', 'a pocket handkerchief', 'a little brass bell', 'a tin of good leaf', 'a book of old songs', 'a pressed-flower bookmark']);
}
function givePresent(giver, to, how) {
  const what = presentFor(giver, to);
  to.remember(`${giver.first} gave me ${what} on ${giver.pron.their} birthday.`, 2);
  feel(to, 'present', giver.first); feel(giver, 'gave_gift', to.first);
  giver.bond(to, 0.04);
  (giver._bdayGiven || (giver._bdayGiven = [])).push(to.first);
  if (how === 'door') to.remember(`Found a birthday present from ${giver.first} on the doorstep.`, 1);
  if (typeof devLog === 'function') devLog('story', `${giver.first} gave ${to.first} ${what} for ${giver.pron.their} birthday${how === 'door' ? ' (left on the doorstep)' : ''}`);
  return what;
}

ACTIONS.give_present = {
  id: 'give_present', label: 'Taking round a birthday present', icon: 'heart', sat: { lonely: -0.3, bored: -0.15 }, dur: 6, pose: 'stand', stages: AWAKE, queued: true,
  label2: (v) => (v.task && v.task.target.other ? `Taking ${v.task.target.other.first} a birthday present` : 'Taking round a birthday present'),
  target: (v, h, extra) => (extra && extra.to && Game.villagers.includes(extra.to) && !extra.to.leaving ? { other: extra.to } : null),
  meet: (v, o, task) => {
    task.data.given = true;
    givePresent(v, o, 'hand');
    v.say(R.pick([`Happy birthday to me, and this is for you!`, `It's my birthday, ${o.first}, so here's a little something.`, 'A present, for you! Go on, open it.']), 3, { to: o });
    o.say(R.pick(['For me? On your birthday? Oh, you shouldn\'t have!', 'Many happy returns!', 'Happy birthday! Oh, how lovely.']), 3, { to: v });
    FX.hearts((v.x + o.x) / 2, Math.min(v.y, o.y) - 18);
  },
  // if they couldn't be found, it's left on the doorstep
  release: (v, task) => { const o = task.target && task.target.other; if (o && !task.data.given && Game.villagers.includes(o)) { task.data.given = true; givePresent(v, o, 'door'); } },
};
ACTION_NAMES.give_present = 'Giving birthday presents';

function birthdayMorning(v) {
  feel(v, 'birthday');
  v.remember('Had my birthday.', 2);
  const home = v.homeId >= 0 ? v.home() : null;
  const housemates = home ? Game.villagers.filter((o) => o !== v && o.homeId === v.homeId && o.stage !== 'baby') : [];
  for (const o of housemates) givePresent(v, o, 'home');
  // little ones get something from their parents, too
  if (!v.isGrown()) for (const pid of v.parents) { const p = personById(pid); if (p && !p.leaving) { const what = presentFor(p, v); v.remember(`Got ${what} from ${p.first} for my birthday.`, 2); feel(v, 'present', p.first); } }
  // then a round of visits to family and dear friends elsewhere
  if (v.isGrown()) {
    const kin = (o) => o.parents.includes(v.id) || v.parents.includes(o.id) || o.parents.some((p) => v.parents.includes(p));
    const others = Game.villagers.filter((o) => o !== v && o.homeId !== v.homeId && o.stage !== 'baby' && !o.leaving && (kin(o) || (v.rel[o.id] ?? 0) > 0.5))
      .sort((a, b) => (kin(b) ? 1 : 0) - (kin(a) ? 1 : 0) || (v.rel[b.id] ?? 0) - (v.rel[a.id] ?? 0)).slice(0, 4);
    for (const o of others) v.queue.push({ a: ACTIONS.give_present, extra: { to: o } });
  }
  const n = housemates.length + (v.isGrown() ? v.queue.filter((q) => q.a.id === 'give_present').length : 0);
  (Game._bdays || (Game._bdays = [])).push(v.isGrown() ? `${v.name()}${n ? ` (presents for ${n === 1 ? 'one lucky hobbit' : ['', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][n] || n}${n > 1 ? ' folk' : ''})` : ''}` : `little ${v.first}`);
}

function calendarMorning() {
  const day = Game.day;
  if (isMarketDay(day)) chronicle('It\'s Trewsday, market day. Baskets out: the square will be busy.', 'info');
  else if (isRestDay(day)) chronicle('Highday: the day of rest. Tools down, kettles on.', 'info');
  else if (isSingNight(day)) chronicle('Mersday. There\'ll be a sing-song at the Tipsy Badger tonight.', 'info');
  Game._bdays = [];
  for (const v of Game.villagers) { delete v._bdayGiven; if (birthdayToday(v) && !v.leaving) birthdayMorning(v); }
  const b = Game._bdays; Game._bdays = [];
  if (b.length) chronicle(`${b.length === 1 ? 'A birthday today' : 'Birthdays today'}: ${b.length > 1 ? b.slice(0, -1).join(', ') + ' and ' + b[b.length - 1] : b[0]}. True to custom, the birthday folk give the presents.`, 'party');
}

window.addEventListener('DOMContentLoaded', () => {
  addHook('onHour', (h) => {
    if (h === 7) calendarMorning();
    // the sing-song: the innkeeper strikes up and the taproom joins in
    if (isSingNight(Game.day) && h >= 19 && h <= 22) {
      const inn = World.inn;
      const there = inn ? Game.villagers.filter((v) => v.inside === inn && v.isGrown()) : [];
      if (there.length >= 2) { for (const v of there) feel(v, 'singsong'); if (h === 20 && Interior.home !== inn) devLog('story', `Sing-song at the Tipsy Badger: ${there.length} voices`); }
    }
  });
});
MOODLETS.singsong = ['Sang along at the Badger', 0.08, 600, ['Oh, the hey diddle diddle...', 'My throat\'s hoarse from all that singing.']];
MOODLETS.market = ['Market day bustle', 0.04, 300, ['You see everyone on market day.']];
{
  patch(Villager.prototype, 'finish', (finish) => function () {
    if (this.task && this.task.a.id === 'market' && isMarketDay(Game.day)) feel(this, 'market');
    return finish.call(this);
  }, 'calendar');
}
