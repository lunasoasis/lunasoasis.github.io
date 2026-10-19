/* Luna's Oasis — staff portal: quiet auto-updates.
   While the portal is open it asks the server every 15 seconds if anything changed. When anyone
   changes something (a booking, payment, checklist, announcement…) every open portal reloads it
   quietly. Tapping Log out writes the sign-out time to Recent activity.
   It never redraws while you are typing or have a box open; it waits until you are done. */
'use strict';

var LIVE = { ver: null, busy: false, pending: false, every: 15000, minute: -1 };

function liveTyping() {
  var a = document.activeElement;
  return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.id !== 'q' && a.type !== 'checkbox');
}
function liveRender() {
  if (!S.data || !S.token) return;
  if (S.busy || S.menu || S.chpw || S.avPick || liveTyping() || document.querySelector('.viewer')) { LIVE.pending = true; return; }
  LIVE.pending = false;
  var y = window.scrollY;
  render();
  if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
}

function liveTick(now) {
  if (!S.token || !S.data || LIVE.busy || (document.hidden && !now)) return;
  LIVE.busy = true;
  post({ action: 'staffSync' }, 0).then(function (d) {
    LIVE.busy = false;
    var redraw = false;
    if (LIVE.ver && d.ver !== LIVE.ver) {
      if (S.busy) return;           // you are saving something: try again on the next check
      LIVE.ver = d.ver; liveReload(); return;
    }
    LIVE.ver = d.ver;
    var min = new Date().getMinutes();
    if (min !== LIVE.minute) { LIVE.minute = min; redraw = true; }   // keeps the clock and "since" times fresh
    if (redraw || LIVE.pending) liveRender();
  }).catch(function (err) {
    LIVE.busy = false;
    if (err && err.auth) signOut('Please sign in again.');
  });
}

// Quietly reload whatever this portal has open.
function liveReload() {
  var quiet = function (p) { return p.catch(function () {}); };
  var jobs = [quiet(post({ action: 'staffBookings' }, 0).then(function (d) { S.data = d; S.me = d.me || S.me; saveCache('bk', d); }))];
  if (S.up) jobs.push(quiet(post({ action: 'staffUpkeepData' }, 0).then(function (d) { S.up = d; saveCache('up', d); })));
  if (S.an) jobs.push(quiet(post({ action: 'staffAnnounceData' }, 0).then(function (d) { S.an = d; saveCache('an', d); })));
  if (S.ov && isFinance()) jobs.push(quiet(post({ action: 'staffOverview' }, 0).then(function (d) { S.ov = d; })));
  if (S.act && isFinance()) jobs.push(quiet(post({ action: 'staffActivity' }, 0).then(function (d) { S.act = d; })));
  Promise.all(jobs).then(liveRender);
}

setInterval(liveTick, LIVE.every);
setTimeout(function () { liveTick(true); }, 2500);
document.addEventListener('visibilitychange', function () { if (!document.hidden) liveTick(true); });
document.addEventListener('focusout', function () { setTimeout(function () { if (LIVE.pending) liveRender(); }, 400); });
document.addEventListener('click', function () { setTimeout(function () { if (LIVE.pending && !S.menu) liveRender(); }, 600); });

// Logging out writes the sign-out time to Recent activity.
(function () {
  var plain = signOut;
  signOut = function (msg) {
    if (S.token && !msg) { try { post({ action: 'staffLogout' }, 0).catch(function () {}); } catch (e) {} }
    LIVE.ver = null; S.act = null; S.ov = null;
    plain(msg);
  };
})();