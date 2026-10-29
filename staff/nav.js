/* Luna's Oasis — staff portal: remember the last page.
   After a refresh (or closing and opening the portal again) you land on the same page you were on:
   the same menu page, Bookings tab and open booking. It is remembered per account on this device.
   Loaded last. */
'use strict';

(function () {
  var KEY = 'lo_nav';
  var restored = false;
  function saved() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function allowed(p) {
    if (p === 'bookings') return true;
    var pg = PAGES[p];
    return !!pg && (navPages().indexOf(p) !== -1 || !!(pg.menu && pg.menu()));
  }
  var plainRender = render;
  render = function () {
    if (!restored && S.data && S.me) {
      restored = true;
      var s = saved();
      if (s && s.who === S.me.email && s.page && allowed(s.page)) {
        S.landed = true;                       // don't jump to Overview: go back to the last page
        S.page = s.page;
        if (s.tab) S.tab = s.tab;
        if (s.open) S.open = s.open;
        if (S.page !== 'bookings' && PAGES[S.page].enter) PAGES[S.page].enter();
      }
    }
    plainRender();
    if (S.data && S.me) {
      try { localStorage.setItem(KEY, JSON.stringify({ who: S.me.email, page: S.page, tab: S.tab, open: S.open })); } catch (e) {}
    }
  };
  var plainSignOut = signOut;
  signOut = function (msg) { restored = false; plainSignOut(msg); };   // the next person who signs in gets their own last page
})();
