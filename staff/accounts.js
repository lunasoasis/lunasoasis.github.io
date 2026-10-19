/* Luna's Oasis — staff portal: faster sign-in, saved accounts on this device, more cats.
   Loaded after core.js. It replaces the sign-in screen and start-up from core.js:
   · the sign-in tiles show at once (saved from last time) and update in the background
   · signing in brings the bookings in the same answer (one wait instead of two)
   · "Keep me signed in" saves that account on this device: next time just tap its cat
   · "Log out & forget me on this device" in the cat menu removes it */
'use strict';

// ---------- more cat pictures ----------
FUR.brown = ['#9A6B47', '#D9A88A', '#FFF6EA'];
FUR.white = ['#FFFFFF', '#F6C9C9', '#2E2621'];
CATS.push(
  { id: 'c19', label: 'Chef', bg: '#E8C9A0', fur: 'ginger', face: EYES_HAPPY + SMILE + BLUSH, extra: '<path d="M16.5 12.5h15v-3.2a4 4 0 0 0-2.6-5.6 4.6 4.6 0 0 0-4.9-1.9 4.6 4.6 0 0 0-4.9 1.9 4 4 0 0 0-2.6 5.6z" fill="#FFFFFF" stroke="#D9CBB5" stroke-width=".8"/><rect x="16.5" y="11.5" width="15" height="3" rx="1" fill="#FFFFFF" stroke="#D9CBB5" stroke-width=".8"/>' },
  { id: 'c20', label: 'Flower', bg: '#BFE0A8', fur: 'cream', face: DOTS + SMILE + BLUSH, extra: '<g fill="#F59AAE"><circle cx="35" cy="9" r="2.6"/><circle cx="39.6" cy="12" r="2.6"/><circle cx="38" cy="17" r="2.6"/><circle cx="32.2" cy="17" r="2.6"/><circle cx="30.6" cy="12" r="2.6"/></g><circle cx="35" cy="13.2" r="2.2" fill="#F2C14E"/>' },
  { id: 'c21', label: 'Music', bg: '#9AA8E8', fur: 'gray', face: EYES_HAPPY + W_MOUTH, extra: '<path d="M11.5 26a12.5 12.5 0 0 1 25 0" fill="none" stroke="#2E2621" stroke-width="2.4"/><rect x="8.5" y="22.5" width="5.5" height="9" rx="2.7" fill="#E2586B"/><rect x="34" y="22.5" width="5.5" height="9" rx="2.7" fill="#E2586B"/>' },
  { id: 'c22', label: 'Cheeky', bg: '#F7A9A8', fur: 'black', face: '<path d="M16.5 29.6q2.6 2 5.2 0" fill="none" stroke="S" stroke-width="1.8" stroke-linecap="round"/><circle cx="29" cy="29" r="2" fill="S"/><path d="M20.5 33.5q3.5 2.6 7 0" fill="none" stroke="S" stroke-width="1.5" stroke-linecap="round"/><path d="M23.6 34.6h3v2.6a1.5 1.5 0 0 1-3 0z" fill="#F2879A"/>' },
  { id: 'c23', label: 'Happy tears', bg: '#A0D8EF', fur: 'cream', face: EYES_HAPPY + '<path d="M17 32.5q-1.2 2.2 0 3.2q1.2-1 0-3.2zM31 32.5q-1.2 2.2 0 3.2q1.2-1 0-3.2z" fill="#5BB5E0"/>' + W_MOUTH },
  { id: 'c24', label: 'Angel', bg: '#F3E6C4', fur: 'white', face: EYES_HAPPY + SMILE + BLUSH, extra: '<ellipse cx="24" cy="5.6" rx="8" ry="2.4" fill="none" stroke="#E9C46A" stroke-width="2"/>' },
  { id: 'c25', label: 'Gentleman', bg: '#5E7C8A', fur: 'brown', face: DOTS + SMILE, extra: '<path d="M24 40.5l-5.5-3.2v6.4zM24 40.5l5.5-3.2v6.4z" fill="#C23E52"/><circle cx="24" cy="40.5" r="1.5" fill="#8E2A3A"/>' },
  { id: 'c26', label: 'Cozy scarf', bg: '#D7E3EA', fur: 'ginger', face: DOTS + W_MOUTH + BLUSH, extra: '<path d="M13 35.5q11 5 22 0v4.2q-11 5-22 0z" fill="#C23E52"/><path d="M28.5 39l2.4 7h-4.6z" fill="#C23E52"/>' },
  { id: 'c27', label: 'Detective', bg: '#C9B79C', fur: 'gray', face: '<circle cx="19" cy="29" r="2" fill="S"/><path d="M26.5 29h5" stroke="S" stroke-width="1.8" stroke-linecap="round"/><path d="M21.5 34.5q2.5 1 5-.6" fill="none" stroke="S" stroke-width="1.5" stroke-linecap="round"/>', extra: '<circle cx="36.5" cy="34" r="5" fill="rgba(255,255,255,.4)" stroke="#2E2621" stroke-width="1.8"/><path d="M40 37.5l4 4" stroke="#2E2621" stroke-width="2.4" stroke-linecap="round"/>' },
  { id: 'c28', label: 'Coffee', bg: '#8C6A3C', fur: 'cream', face: '<path d="M16.5 29h5M26.5 29h5" stroke="S" stroke-width="1.8" stroke-linecap="round"/>' + SMILE + BLUSH, extra: '<path d="M33 34h8.5v5.5a4 4 0 0 1-4 4h-.5a4 4 0 0 1-4-4z" fill="#FFF6EA" stroke="#5A3E22" stroke-width="1"/><path d="M41.5 35.8h1.4a1.9 1.9 0 0 1 0 3.8h-1.4" fill="none" stroke="#5A3E22" stroke-width="1"/><path d="M35.8 31.5q1-1.5 0-3M38.8 31.5q1-1.5 0-3" stroke="#FFF6EA" stroke-width="1.1" fill="none" stroke-linecap="round"/>' },
  { id: 'c29', label: 'Ninja', bg: '#4A4E69', fur: 'black', face: '<rect x="11" y="25.5" width="26" height="7" fill="#C23E52"/><path d="M16.5 28l5 1.4M31.5 28l-5 1.4" stroke="#FFF6EA" stroke-width="1.8" stroke-linecap="round"/>', extra: '<path d="M10 27l-6 -3M10 28l-6 2" stroke="#C23E52" stroke-width="1.8" stroke-linecap="round"/>' },
  { id: 'c30', label: 'Rainbow', bg: '#B5E3D8', fur: 'cream', face: EYES_HAPPY + SMILE + BLUSH, extra: '<path d="M14 12.5a10 10 0 0 1 20 0" fill="none" stroke="#E2586B" stroke-width="2"/><path d="M16.6 12.5a7.4 7.4 0 0 1 14.8 0" fill="none" stroke="#F2C14E" stroke-width="2"/><path d="M19.2 12.5a4.8 4.8 0 0 1 9.6 0" fill="none" stroke="#6FC2B5" stroke-width="2"/>' },
  { id: 'c31', label: 'Boba', bg: '#E9D3B6', fur: 'brown', face: EYES_HAPPY + W_MOUTH, extra: '<path d="M4.5 33h8l-1 10h-6z" fill="#F3E2C7" stroke="#7A5A2E" stroke-width=".9"/><path d="M10 33l2.5-6" stroke="#E2586B" stroke-width="1.6" stroke-linecap="round"/><g fill="#3A2A1E"><circle cx="7" cy="41" r="1"/><circle cx="9.5" cy="40.6" r="1"/><circle cx="8.2" cy="38.8" r="1"/></g>' },
  { id: 'c32', label: 'Strawberry', bg: '#FFC2C7', fur: 'white', face: DOTS + SMILE + BLUSH, extra: '<path d="M35 9q6 0 5 6-1.6 5-5 7-3.4-2-5-7-1-6 5-6z" fill="#E2586B"/><path d="M31.5 9.5l3.5-3 3.5 3-3.5 1z" fill="#7FB98A"/><g fill="#FFE9A8"><circle cx="33.5" cy="13" r=".6"/><circle cx="36.5" cy="13" r=".6"/><circle cx="35" cy="16" r=".6"/></g>' },
  { id: 'c33', label: 'Sailor', bg: '#7FB3D5', fur: 'white', face: DOTS + W_MOUTH + BLUSH, extra: '<path d="M15 12.5q9-6 18 0z" fill="#FFFFFF" stroke="#2E4A6B" stroke-width="1"/><rect x="15" y="11.5" width="18" height="2.4" fill="#2E4A6B"/>' },
  { id: 'c34', label: 'Grandma', bg: '#D8C3E6', fur: 'gray', face: '<circle cx="19" cy="29" r="3.4" fill="none" stroke="S" stroke-width="1.2"/><circle cx="29" cy="29" r="3.4" fill="none" stroke="S" stroke-width="1.2"/><path d="M22.4 29h3.2" stroke="S" stroke-width="1.2"/><path d="M17.3 29.4q1.7 1.2 3.4 0M27.3 29.4q1.7 1.2 3.4 0" fill="none" stroke="S" stroke-width="1.3" stroke-linecap="round"/>' + SMILE + BLUSH, extra: '<circle cx="24" cy="7.5" r="4.2" fill="#E7E2DA" stroke="#B9AE9F" stroke-width=".8"/>' }
);
catOf = function (p) {   // people who never picked keep the same cat when new ones are added
  var name = typeof p === 'string' ? p : (p && p.name) || '', pick = p && typeof p === 'object' && catById(p.avatar);
  if (pick) return pick;
  for (var i = 0; i < 5; i++) if (CATS[i].key.test(name)) return CATS[i];
  var h = 0; for (var j = 0; j < name.length; j++) h = (h * 31 + name.charCodeAt(j)) % 997;
  return CATS[5 + h % 13];
};

// ---------- left menu: Bookings and Payments are separate ----------
NAV.bookings = ['Bookings', '#8E3B46', 2, false];
NAV.payments = ['Payments', '#B07A3A', 3, true];
NAV.records[2] = 4; NAV.upkeep[2] = 5; NAV.announce[2] = 6;
var plainBookingsHtml = bookingsHtml;
bookingsHtml = function () { return plainBookingsHtml().replace('<h1>Bookings &amp; payments</h1>', '<h1>Bookings</h1>'); };

// ---------- saved accounts ----------
// Accounts saved on this device ("Keep me signed in"): tap the cat on the sign-in page to go straight in.
function savedAccts() { try { return JSON.parse(localStorage.getItem('lo_accts') || '{}') || {}; } catch (e) { return {}; } }
function saveAcct(name, email, token) { try { var a = savedAccts(); a[name] = { email: email, token: token }; localStorage.setItem('lo_accts', JSON.stringify(a)); } catch (e) {} }
function forgetAcct(name) { try { var a = savedAccts(); delete a[name]; localStorage.setItem('lo_accts', JSON.stringify(a)); } catch (e) {} }

// ---------- sign-in screen ----------
renderLogin = function () {
  if (L.staff === null) {
    try { L.staff = JSON.parse(localStorage.getItem('lo_pick') || '[]'); } catch (e) { L.staff = []; }   // the tiles from last time show at once…
    post({ action: 'staffPicker' }).then(function (list) {   // …then the latest list
      var changed = JSON.stringify(list || []) !== JSON.stringify(L.staff);
      L.staff = list || []; try { localStorage.setItem('lo_pick', JSON.stringify(L.staff)); } catch (e) {}
      if (L.pick) pickAcct(L.pick);
      if (!S.token && changed) renderLogin();
    }).catch(function () {});
  }
  var accts = savedAccts();
  var isOp = L.role !== 'admin';
  var tiles = L.staff.map(function (s) {   // everyone is shown; tapping a tile picks the role too
    var on = L.pick === s.name, c = catOf(s).bg;
    var dim = L.role && !on && ((s.role === 'operator') !== (L.role === 'operator'));
    return '<button type="button" class="acct' + (dim ? ' dim' : '') + '" data-acct="' + esc(s.name) + '" aria-pressed="' + on + '" style="' + (on ? 'background:' + c + '1f;border:2px solid ' + c + ';box-shadow:0 8px 18px ' + c + '33' : '') + '">' +
      catSvg(s, 52) + '<span>' + esc(s.name) + '</span><small>' + (L.opening === s.name ? 'Opening…' : accts[s.name] ? '✓ Saved' : roleShort(s.role)) + '</small></button>';
  }).join('');
  var ring = 'STAFF ONLY ✦ ON TIME ✦ SPOTLESS ✦ COZY STAYS ✦ STAFF ONLY ✦ ON TIME ✦ SPOTLESS ✦ COZY STAYS ✦ ';
  app.innerHTML = '<div class="login">' +
    '<section class="lside"><div class="in"><div class="ringbox">' +
    '<svg viewBox="0 0 600 600" aria-hidden="true"><defs><path id="circS" d="M300,300 m-270,0 a270,270 0 1,1 540,0 a270,270 0 1,1 -540,0"/></defs><text font-size="22" letter-spacing="4" fill="#C9A96E" font-family="Jost, sans-serif"><textPath href="#circS" textLength="1690" lengthAdjust="spacing">' + ring + '</textPath></text></svg>' +
    '<div class="ph2"><div>' + (L.pick ? '<span class="bigcat">' + catSvg(pickedStaff(), 220) + '</span>' : '<img src="../assets/img/living-room-night.jpg" alt="" onerror="this.onerror=null;this.src=\'../assets/img/logo.png\';this.style.objectFit=\'contain\'">') + '</div></div></div>' +
    '<div class="script">Luna\'s</div><div class="oasis">OASIS</div><div class="rule">Staff portal</div></div></section>' +
    '<section class="lmain"><form class="lcard" id="lf" novalidate>' +
    '<p class="wb">Welcome back</p><h1>Staff sign-in</h1>' +
    '<span class="lbl">I am signing in as</span>' +
    '<div class="roles" role="group" aria-label="Role"><button type="button" data-lrole="admin" aria-pressed="' + (L.role === 'admin') + '">Admin</button><button type="button" data-lrole="operator" aria-pressed="' + (L.role === 'operator') + '">Operator</button></div>' +
    (tiles ? '<span class="lbl">Who\'s signing in?</span><div class="accts" role="group" aria-label="Staff">' + tiles + '</div>' : '') +
    '<label class="lbl" for="le">Gmail</label><input class="linp" id="le" type="email" autocomplete="username" inputmode="email" placeholder="yourname@gmail.com" value="' + esc(L.email) + '">' +
    '<label class="lbl" for="lp">Password</label><input class="linp" id="lp" type="password" autocomplete="current-password" placeholder="••••••••" value="' + esc(L.pw) + '">' +
    '<div class="lrow"><label><input type="checkbox" id="lr"' + (L.remember ? ' checked' : '') + '> Keep me signed in</label><span>Forgot password? ' + (isOp ? 'Ask the admin.' : 'Reset it from the Sheet menu.') + '</span></div>' +
    (S.loginErr ? '<div class="err" role="alert" style="margin:-10px 0 18px">' + esc(S.loginErr) + '</div>' : '') +
    '<button class="go" id="lgo"' + (loginReady() && !S.busy ? '' : ' disabled') + '>' + esc(goLabel()) +
    ' <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 7h23M18 1l6 6-6 6"/></svg></button>' +
    '<p class="lback"><a href="../">← Back to the website</a></p></form></section></div>';
  var f = document.getElementById('lf');
  f.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lrole],[data-acct]');
    if (!b) return;
    if (b.dataset.lrole) {
      L.role = b.dataset.lrole; S.loginErr = '';
      var cur = L.staff.filter(function (s) { return s.name === L.pick; })[0];
      if (cur && (cur.role === 'operator') !== (L.role === 'operator')) { L.pick = ''; L.email = ''; L.pw = ''; }
    } else {
      if (S.busy) return;
      S.loginErr = '';
      if (savedAccts()[b.dataset.acct]) { resumeAcct(b.dataset.acct); return; }   // saved on this device: straight in
      pickAcct(b.dataset.acct);
    }
    renderLogin();
  });
  f.addEventListener('input', function (e) {
    if (e.target.id === 'le') L.email = e.target.value;
    if (e.target.id === 'lp') L.pw = e.target.value;
    if (e.target.id === 'lr') L.remember = e.target.checked;
    document.getElementById('lgo').disabled = !loginReady() || S.busy;
  });
  f.addEventListener('change', function (e) { if (e.target.id === 'lr') L.remember = e.target.checked; });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!loginReady()) { S.loginErr = 'Please enter your Gmail and password.'; renderLogin(); return; }
    S.remember = L.remember; S.busy = true; S.loginErr = ''; renderLogin();
    post({ action: 'staffLogin', email: L.email.trim(), password: L.pw, remember: L.remember }).then(function (d) {
      S.token = d.token; S.me = d.me; store('lo_staff', d.token); S.busy = false; L.pw = '';
      if (L.remember) {
        try { var m = savedMails(); m[d.me.name] = d.me.email; if (L.pick) m[L.pick] = d.me.email; localStorage.setItem('lo_mails', JSON.stringify(m)); } catch (x) {}
        saveAcct(d.me.name, d.me.email, d.token); if (L.pick && L.pick !== d.me.name) saveAcct(L.pick, d.me.email, d.token);
      }
      clearCache();
      if (d.boot) boot(d.boot); else loadAll();   // the bookings came with the sign-in: no second wait
    }).catch(function (err) {
      S.busy = false; S.loginErr = err.message === 'Failed to fetch' ? 'Could not reach the server.' : err.message; renderLogin();
    });
  });
};
// Tapping a saved account: one quick trip to the server, then the dashboard.
function resumeAcct(name) {
  var a = savedAccts()[name];
  L.opening = name; S.busy = true; renderLogin();
  S.token = a.token; S.remember = true;
  post({ action: 'staffResume', token: a.token }).then(function (d) {
    L.opening = ''; S.busy = false; store('lo_staff', a.token); clearCache(); boot(d);
  }).catch(function (err) {
    L.opening = ''; S.busy = false; S.token = '';
    if (err && err.auth) { forgetAcct(name); pickAcct(name); S.loginErr = 'Please type the password once more for ' + shortName(name) + '.'; }
    else S.loginErr = err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not reach the server.';
    renderLogin();
  });
}
function boot(d) {   // show the portal with bookings already in hand
  S.data = d; S.me = d.me; S.stale = false; S.offline = false; saveCache('bk', d);
  if (!S.landed) { S.landed = true; if (isFinance() && PAGES.overview && S.page === 'bookings') { S.page = 'overview'; PAGES.overview.enter(); } }
  render();
  prefetch();
}
signOut = function (msg) { L.staff = null; L.opening = ''; S.landed = false; S.page = 'bookings'; L.role = ''; L.pick = ''; L.email = ''; L.pw = ''; S.avPick = false; S.token = ''; S.data = null; S.up = null; S.an = null; clearCache(); S.open = ''; S.menu = false; store('lo_staff', null); S.loginErr = msg || ''; renderLogin(); };
loadAll = function (fresh) {
  var cached = !S.data && readCache('bk');
  if (cached) { S.data = cached; S.me = cached.me; S.stale = true; render(); }   // show the last data right away…
  else if (!S.data) app.innerHTML = '<div class="loading"><div class="spin"></div>Loading bookings…</div>';
  else { S.stale = true; render(); }
  post({ action: 'staffBookings', fresh: !!fresh }).then(function (d) {      // …then swap in the fresh data
    boot(d);   // admins start on Overview
  }).catch(function (err) {
    if (err.auth) { signOut('Please sign in again.'); return; }
    S.stale = false;
    var msg = err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not reach the server. Check your internet and try again.';
    if (S.data) { S.offline = msg; render(); return; }
    app.innerHTML = '<div class="loading"><p style="color:var(--cream);margin:0 0 14px">' + esc(msg) + '</p><button type="button" class="pill gold" id="retry">Try again</button></div>';
    document.getElementById('retry').onclick = function () { loadAll(true); };
  });
};

// ---------- "Log out & forget me on this device" in the cat menu ----------
var plainRender = render;
render = function () {
  plainRender();
  var lo = S.menu && app.querySelector('.menu [data-act="logout"]');
  if (lo && S.me && savedAccts()[S.me.name] && !app.querySelector('[data-act="forget"]'))
    lo.insertAdjacentHTML('afterend', '<button type="button" class="out" data-act="forget" style="font-size:12.5px">Log out &amp; forget me on this device</button>');
};
PAGES.accounts = {
  show: function () { return false; },
  click: function (e) {
    var el = e.target.closest('[data-act="forget"]');
    if (!el) return false;
    forgetAcct(S.me.name); signOut('');
    return true;
  }
};