'use strict';
// ---------------------------------------------------------------------------
// Last wishes (Spiritfarer's farewells). An elder who has decided to set off
// on a last adventure takes a day to put things in order first: one more
// natter with their dearest friend, one more pint at the Badger. These are
// ordinary wishes, so they lean that way and you can help (a keg near them,
// a pat). At the send-off the Chronicle tells which came true, and they're
// remembered with the stone on the Remembrance Green.
// ---------------------------------------------------------------------------

function dearestFriend(v) {
  const f = Object.entries(v.rel).map(([id, r]) => [Game.villagers.find((o) => o.id === +id), r]).filter(([o]) => o && !o.leaving && o.homeId !== v.homeId && o.stage !== 'baby').sort((a, b) => b[1] - a[1])[0];
  return f ? f[0] : null;
}
function setLastWishes(f) {
  const v = personById(f.id);
  if (!v || v.leaving) return;
  f.wished = true;
  f.day = Math.max(f.day, Game.day + 1);
  const fr = dearestFriend(v);
  const ws = [];
  if (fr) { const w = addWish(v, 'catch_up', { x: fr.first, last: true, until: Game.time + 3 * 1440 }); if (w) ws.push(`a last natter with ${fr.first}`); }
  if (v.isGrown()) { const w = addWish(v, 'pint', { last: true, until: Game.time + 3 * 1440 }); if (w) ws.push('one more pint at the Tipsy Badger'); }
  f.wishes = ws; f.granted = [];
  chronicle(`${v.name()} has decided it's time for a last great adventure, and means to set off on ${weekday(f.day)} morning${ws.length ? `. But first: ${ws.join(', and ')}` : ''}.`, 'adventure');
}
window.addEventListener('DOMContentLoaded', () => {
  const gw = grantWish;
  grantWish = function (v, w, ev) {
    const r = gw(v, w, ev);
    if (w.last) { const f = (Game.farewells || []).find((x) => x.id === v.id || x.comp === v.id); if (f) (f.granted || (f.granted = [])).push(w.k === 'pint' ? 'one more pint at the Badger' : `a last natter with ${w.x}`); }
    return r;
  };
  addHook('beforeHour', (h) => { for (const f of Game.farewells || []) if (!f.wished) setLastWishes(f); });
  const fd = farewellDeparture;
  farewellDeparture = function (f) {
    const v = personById(f.id);
    const granted = f.granted || [];
    const r = fd(f);
    if (v && granted.length) {
      chronicle(`Before setting off, ${v.first} had ${granted.join(', and ')}. ${granted.length === (f.wishes || []).length ? 'Everything in order, then.' : 'Not everything, but enough.'}`, 'adventure');
      const m = memorialFor(v.id); if (m) m.wishes = granted;
    }
    return r;
  };
  const vr = villageRemembered;
  villageRemembered = function () {
    let h = vr();
    for (const m of Game.memorials || []) if (m.wishes && m.wishes.length) h = h.replace(`<b>${escapeHtml(m.name)}</b>`, `<b>${escapeHtml(m.name)}</b> <span class="sub">(had ${escapeHtml(m.wishes.join(' and '))} before leaving)</span>`);
    return h;
  };
});
