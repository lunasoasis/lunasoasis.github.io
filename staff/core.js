/* Luna's Oasis — staff portal: sign-in, bookings & payments, booking panel.
   Page files (calendar.js, records.js, upkeep.js) add the other pages. */
'use strict';
var API = window.LUNA_CONFIG && window.LUNA_CONFIG.API_URL;
var app = document.getElementById('app');
var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var HOUR = 3600000, PH = 8 * HOUR;
var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
// Extra pages (calendar.js, records.js, upkeep.js…) add themselves here:
// PAGES.name = { order, label, show(), html(), enter(), click(e), input(e), change(e) }
var PAGES = {};

var S = {
  token: '', me: null, data: null, page: 'bookings', cy: 0, cm: 0, rmode: 'month', ry: 0, rm: 0, rfilter: 'all', rmsg: '',
  up: null, ck: {}, upTab: 'todo', umsg: '', itemsOpen: false, uform: { task: '', date: '', assigned_to: '', notes: '' },
  past: { name: '', date: '', time: '14:00', pkg: '22H', pax: 2, nights: 1, extra: 0, amount: '', method: 'GCash', depBack: true }, tab: 'upcoming', q: '', open: '', menu: false,
  busy: false, error: '', msg: '', loginErr: '',
  pay: { amount: '', method: 'GCash', refno: '' }, ext: 1, dep: { method: 'GCash', deduction: '', reason: '' }
};


// ---------- helpers ----------
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function peso(n) { return '₱' + Math.round(Number(n) || 0).toLocaleString('en-PH'); }
function ms(v) { if (!v) return 0; var p = v.slice(0, 10).split('-'), t = (v.slice(11) || '00:00').split(':'); return Date.UTC(+p[0], +p[1] - 1, +p[2], +t[0], +t[1]) - PH; }
function when(v) {
  if (!v) return '—';
  var d = new Date(ms(v) + PH), h = d.getUTCHours(), m = d.getUTCMinutes();
  return DOW[d.getUTCDay()] + ', ' + MON[d.getUTCMonth()] + ' ' + d.getUTCDate() + ' · ' + ((h + 11) % 12 + 1) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
}
function whenS(v) {   // short form for tables: "Tue Oct 13, 2:00 PM"
  return when(v).replace(', ', ' ').replace(' · ', ', ');
}
function nowMs() { return Date.now(); }
function initials(n) { return String(n || '?').replace(/^Ms\.?\s+|^Mr\.?\s+/i, '').split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
function store(k, v) { try { if (v === null) { localStorage.removeItem(k); sessionStorage.removeItem(k); } else (S.remember ? localStorage : sessionStorage).setItem(k, v); } catch (e) {} }
function load(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
function lead(b) { return (b.guests[0] && b.guests[0].name) || b.guest_email; }
function hours(b) { return Math.round((ms(b.check_out) - ms(b.check_in)) / HOUR); }
function active(b) { return ['Cancelled', 'No-show'].indexOf(b.status) === -1; }
function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
function isFinance() { return S.me && (S.me.role === 'admin' || S.me.role === 'coadmin'); }
function staffName(email) {
  var s = (S.data.staff || []).filter(function (x) { return x.email === String(email).toLowerCase(); })[0];
  return s ? s.name : String(email || '').split('@')[0];
}

function post(body) {
  body.token = S.token;
  return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j.ok) { var e = new Error(j.error || 'Something went wrong.'); e.auth = j.auth; throw e; }
      return j.data;
    });
}
function act(body, okMsg) {   // staff action that returns fresh bookings
  S.busy = true; S.error = ''; S.msg = ''; render();
  return post(body).then(function (d) {
    S.busy = false; S.data = d; S.me = d.me; S.msg = okMsg || ''; render();
  }).catch(fail);
}
function fail(err) {
  S.busy = false;
  if (err && err.auth) { signOut('Please sign in again.'); return; }
  S.error = err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not reach the server. Please check your connection.';
  render();
}


// ---------- cat avatars (from the design) ----------
var CAT_BODY = '<path d="M11 38V22l4.5-11 6.5 8h4l6.5-8L37 22v16a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4z" fill="#FFF6EA"/><path d="M14.2 17.5l1.6-3.8 2.6 3.3zM33.8 17.5l-1.6-3.8-2.6 3.3z" fill="#F2C9B8"/>';
var CATS = [
  { key: /moralde|darling/i, color: '#7A5A2E', ty: 6.5, face: '<path d="M17 28q2.3 2 4.6 0M26.4 28q2.3 2 4.6 0" stroke="#2E2621" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M22 34q2 1.6 4 0" stroke="#2E2621" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="17" cy="32" r="1.6" fill="#F3AE98" opacity=".8"/><circle cx="31" cy="32" r="1.6" fill="#F3AE98" opacity=".8"/>',
    extra: '<path d="M15.5 14l1.8-8.5 3.9 4.6L24 3.2l2.8 6.9 3.9-4.6 1.8 8.5z" fill="#E9C46A" stroke="#FFF6EA" stroke-width="1.1" stroke-linejoin="round"/><circle cx="24" cy="3.4" r="1.4" fill="#FFF6EA"/><circle cx="17.3" cy="5.6" r="1.1" fill="#FFF6EA"/><circle cx="30.7" cy="5.6" r="1.1" fill="#FFF6EA"/>' },
  { key: /marco/i, color: '#7FCFA8', face: '<path d="M16 25l5.5 1.6M32 25l-5.5 1.6" stroke="#2E2621" stroke-width="1.8" stroke-linecap="round"/><path d="M17 29.3h4.6M26.4 29.3h4.6" stroke="#2E2621" stroke-width="2.2" stroke-linecap="round"/><path d="M22 35.5h4" stroke="#2E2621" stroke-width="1.6" stroke-linecap="round"/>' },
  { key: /valerie/i, color: '#F2A2B8', face: '<path d="M16.5 30q2.6-3.2 5.2 0M26.3 30q2.6-3.2 5.2 0" fill="none" stroke="#2E2621" stroke-width="1.8" stroke-linecap="round"/><path d="M21.3 34q2.7 2.8 5.4 0" fill="none" stroke="#2E2621" stroke-width="1.6" stroke-linecap="round"/><circle cx="15.5" cy="33.2" r="1.8" fill="#F3AE98"/><circle cx="32.5" cy="33.2" r="1.8" fill="#F3AE98"/><path d="M33 15.5l-5.5-3.6v7.2zM33 15.5l5.5-3.6v7.2z" fill="#E2586B"/><circle cx="33" cy="15.5" r="1.7" fill="#C23E52"/>' },
  { key: /rhein/i, color: '#84CFE0', face: '<g transform="rotate(-9 24 30)"><circle cx="19" cy="29" r="3.3" fill="#2E2621"/><circle cx="29" cy="29" r="3.3" fill="#2E2621"/><circle cx="20.2" cy="27.8" r="1.1" fill="#fff"/><circle cx="30.2" cy="27.8" r="1.1" fill="#fff"/><circle cx="24" cy="35.3" r="1.3" fill="none" stroke="#2E2621" stroke-width="1.4"/><path d="M16 23.6q3-1.6 5.5 0M26.5 23.6q3-1.6 5.5 0" fill="none" stroke="#2E2621" stroke-width="1.3" stroke-linecap="round"/></g><text x="40.5" y="15" font-size="11" font-weight="700" fill="#1B1714" font-family="Jost, sans-serif">?</text>' },
  { key: /irish/i, color: '#B29CE3', face: '<path d="M16.5 29.6q2.6 2 5.2 0" fill="none" stroke="#2E2621" stroke-width="1.8" stroke-linecap="round"/><circle cx="29" cy="29.2" r="2" fill="#2E2621"/><path d="M30.4 26.6l1.4-1.4" stroke="#2E2621" stroke-width="1.2" stroke-linecap="round"/><path d="M21.3 34q2.7 2.8 5.4 0" fill="none" stroke="#2E2621" stroke-width="1.6" stroke-linecap="round"/><g fill="#F7C6D9"><circle cx="11" cy="13" r="2"/><circle cx="14.6" cy="13" r="2"/><circle cx="12.8" cy="10" r="2"/><circle cx="12.8" cy="16" r="2"/></g><circle cx="12.8" cy="13" r="1.4" fill="#F2C14E"/>' }
];
function catOf(name) {   // known staff get their own cat; anyone else gets one picked from their name
  name = String(name || '');
  for (var i = 0; i < CATS.length; i++) if (CATS[i].key.test(name)) return CATS[i];
  var h = 0; for (var j = 0; j < name.length; j++) h = (h * 31 + name.charCodeAt(j)) % 997;
  return CATS[1 + h % 4];
}
function catSvg(name, size) {
  var c = catOf(name);
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="' + c.color + '"/>' +
    '<g transform="translate(4 ' + (c.ty || 3.5) + ') scale(.84)">' + CAT_BODY + c.face + '</g>' + (c.extra || '') + '</svg>';
}
function roleLabel(r) { return r === 'admin' ? 'Admin · Owner' : r === 'coadmin' ? 'Co-admin · Finance' : 'Operator'; }
function savedMails() { try { return JSON.parse(localStorage.getItem('lo_mails') || '{}') || {}; } catch (e) { return {}; } }

// ---------- sign-in ----------
var L = { role: 'operator', pick: '', staff: null, email: '', pw: '', remember: true };
function loginReady() { return /\S+@\S+/.test(L.email.trim()) && L.pw.length > 0; }
function shortName(n) {   // "Ms. Darling Moralde" → "Ms. Moralde", "Valerie Cruz" → "Valerie"
  var w = String(n || '').trim().split(/\s+/);
  return /^(ms|mr|mrs)\.?$/i.test(w[0]) && w.length > 1 ? w[0].replace(/\.?$/, '.') + ' ' + w[w.length - 1] : w[0];
}
function goLabel() { return S.busy ? 'Signing in…' : 'Sign in' + (L.pick ? ' as ' + shortName(L.pick) : ''); }
function pickAcct(name) { L.pick = name; var m = savedMails()[name]; L.email = m || ''; }
function renderLogin() {
  if (L.staff === null) {
    L.staff = [];
    post({ action: 'staffPicker' }).then(function (list) {
      L.staff = list || [];
      var mine = L.staff.filter(function (s) { return (s.role === 'operator') === (L.role === 'operator'); });
      if (!mine.length && L.staff.length) L.role = L.staff[0].role === 'operator' ? 'operator' : 'admin';
      if (!L.pick) { var first = L.staff.filter(function (s) { return (s.role === 'operator') === (L.role === 'operator'); })[0]; if (first) pickAcct(first.name); }
      if (!S.token) renderLogin();
    }).catch(function () {});
  }
  var isOp = L.role === 'operator';
  var accts = L.staff.filter(function (s) { return (s.role === 'operator') === isOp; });
  var tiles = accts.map(function (s) {
    var on = L.pick === s.name, c = catOf(s.name).color;
    return '<button type="button" class="acct" data-acct="' + esc(s.name) + '" aria-pressed="' + on + '" style="' + (on ? 'background:' + c + '1f;border:2px solid ' + c + ';box-shadow:0 8px 18px ' + c + '33' : '') + '">' +
      catSvg(s.name, isOp ? 52 : 44) + '<span>' + esc(s.name) + '</span></button>';
  }).join('');
  var ring = 'STAFF ONLY ✦ ON TIME ✦ SPOTLESS ✦ COZY STAYS ✦ STAFF ONLY ✦ ON TIME ✦ SPOTLESS ✦ COZY STAYS ✦ ';
  app.innerHTML = '<div class="login">' +
    '<section class="lside"><div class="in"><div class="ringbox">' +
    '<svg viewBox="0 0 600 600" aria-hidden="true"><defs><path id="circS" d="M300,300 m-270,0 a270,270 0 1,1 540,0 a270,270 0 1,1 -540,0"/></defs><text font-size="22" letter-spacing="4" fill="#C9A96E" font-family="Jost, sans-serif"><textPath href="#circS" textLength="1690" lengthAdjust="spacing">' + ring + '</textPath></text></svg>' +
    '<div class="ph2"><div><img src="../assets/img/living-room-night.jpg" alt=""></div></div></div>' +
    '<div class="script">Luna\'s</div><div class="oasis">OASIS</div><div class="rule">Staff portal</div></div></section>' +
    '<section class="lmain"><form class="lcard" id="lf" novalidate>' +
    '<p class="wb">Welcome back</p><h1>Staff sign-in</h1>' +
    '<span class="lbl">I am signing in as</span>' +
    '<div class="roles" role="group" aria-label="Role"><button type="button" data-lrole="admin" aria-pressed="' + !isOp + '">Admin</button><button type="button" data-lrole="operator" aria-pressed="' + isOp + '">Operator</button></div>' +
    (tiles ? '<span class="lbl">Which ' + (isOp ? 'operator' : 'admin') + '?</span><div class="accts' + (isOp ? '' : ' adm') + '" role="group" aria-label="' + (isOp ? 'Operator' : 'Admin') + ' account">' + tiles + '</div>' : '') +
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
      L.role = b.dataset.lrole; L.pw = ''; S.loginErr = '';
      var first = L.staff.filter(function (s) { return (s.role === 'operator') === (L.role === 'operator'); })[0];
      if (first) pickAcct(first.name); else { L.pick = ''; L.email = ''; }
    } else { pickAcct(b.dataset.acct); S.loginErr = ''; }
    renderLogin();
    var el = document.getElementById(L.email ? 'lp' : 'le'); if (el) el.focus();
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
      if (L.remember) { try { var m = savedMails(); m[d.me.name] = d.me.email; if (L.pick) m[L.pick] = d.me.email; localStorage.setItem('lo_mails', JSON.stringify(m)); } catch (x) {} }
      loadAll();
    }).catch(function (err) {
      S.busy = false; S.loginErr = err.message === 'Failed to fetch' ? 'Could not reach the server.' : err.message; renderLogin();
    });
  });
}
function signOut(msg) { S.token = ''; S.data = null; S.open = ''; S.menu = false; store('lo_staff', null); S.loginErr = msg || ''; renderLogin(); }
function loadAll() {
  app.innerHTML = '<div class="loading"><div class="spin"></div>Loading bookings…</div>';
  post({ action: 'staffBookings' }).then(function (d) { S.data = d; S.me = d.me; render(); }).catch(function (err) {
    if (err.auth) signOut(''); else { app.innerHTML = '<div class="loading">Could not load bookings. <a href="">Try again</a></div>'; }
  });
}

// ---------- main page ----------
// Sidebar pages: [title, dot colour, order, admin & co-admin only?]
var NAV = {
  calendar: ['Calendar', '#8C6A3C', 1, true],
  bookings: ['Bookings & payments', '#8E3B46', 2, false],
  records: ['Records & earnings', '#4F7A63', 3, true],
  upkeep: ['Checklist & upkeep', '#6B4A6E', 4, false],
  announce: ['Announcements', '#6F7480', 5, false]
};
function navPages() {
  var keys = ['bookings'].concat(Object.keys(PAGES));
  return keys.filter(function (k) {
    var n = NAV[k] || [], p = PAGES[k];
    return (!n[3] || isFinance()) && (!p || !p.show || p.show());
  }).sort(function (a, b) { return ((NAV[a] || [])[2] || 9) - ((NAV[b] || [])[2] || 9); });
}
function lists() {
  var now = nowMs(), q = S.q.trim().toLowerCase(), all = S.data.bookings.slice();
  var t = {
    upcoming: all.filter(function (b) { return active(b) && b.status !== 'Completed' && ms(b.check_out) >= now - 6 * HOUR; }).sort(function (a, b) { return ms(a.check_in) - ms(b.check_in); }),
    pending: all.filter(function (b) { return b.status === 'Pending'; }).sort(function (a, b) { return ms(a.check_in) - ms(b.check_in); }),
    unpaid: all.filter(function (b) { return active(b) && b.balance > 0; }).sort(function (a, b) { return ms(a.check_in) - ms(b.check_in); }),
    all: all.sort(function (a, b) { return ms(b.check_in) - ms(a.check_in); })
  };
  if (q) Object.keys(t).forEach(function (k) {
    t[k] = t[k].filter(function (b) { return (b.ref + ' ' + b.guest_email + ' ' + b.guests.map(function (g) { return g.name; }).join(' ')).toLowerCase().indexOf(q) !== -1; });
  });
  return t;
}
function dur(h) { var w = Math.floor(h), m = Math.round((h - w) * 60); return w + ' hr' + (w === 1 ? '' : 's') + (m ? ' ' + m + ' min' : ''); }
function stats() {
  var now = nowMs(), act = S.data.bookings.filter(function (b) { return active(b) && b.status !== 'Completed'; });
  var cur = act.filter(function (b) { return ms(b.check_in) <= now && now < ms(b.check_out); })[0];
  var next = act.filter(function (b) { return ms(b.check_in) > now; }).sort(function (a, b) { return ms(a.check_in) - ms(b.check_in); })[0];
  var unpaid = S.data.bookings.filter(function (b) { return active(b) && b.balance > 0; });
  var gap = cur && next ? (ms(next.check_in) - ms(cur.check_out)) / HOUR : null;
  return {
    cur: cur ? { v: lead(cur), s: 'Out ' + when(cur.check_out) } : { v: 'Vacant', s: 'The unit is free right now' },
    next: next ? { v: lead(next), s: when(next.check_in) } : { v: 'None yet', s: 'No upcoming bookings' },
    gap: gap !== null ? { v: dur(gap), s: 'Time to clean between guests' } : { v: (S.data.settings.cleaning_gap_hours || 0) + ' hrs', s: 'Cleaning time between guests' },
    unpaid: { v: peso(unpaid.reduce(function (a, b) { return a + b.balance; }, 0)), s: plural(unpaid.length, 'booking') }
  };
}
function kicker() {
  var d = new Date(Date.now() + PH), h = d.getUTCHours(), m = d.getUTCMinutes();
  return DOW[d.getUTCDay()] + ', ' + MON[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear() + ' · ' + ((h + 11) % 12 + 1) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
}
function bookingsHtml() {
  var L2 = lists(), st = stats(), list = L2[S.tab], me = S.me;
  var hour = new Date(Date.now() + PH).getUTCHours();
  var greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  if (!S.open || !S.data.bookings.some(function (x) { return x.ref === S.open; })) {
    var first = list[0] || L2.upcoming[0] || S.data.bookings[0];
    if (first) selectBooking(first.ref);
  }
  var tabs = [['upcoming', 'Upcoming'], ['pending', 'Needs confirming'], ['unpaid', 'Unpaid'], ['all', 'All']].map(function (t) {
    return '<button type="button" class="tab" data-tab="' + t[0] + '" aria-pressed="' + (S.tab === t[0]) + '">' + t[1] + '<span class="n">' + L2[t[0]].length + '</span></button>';
  }).join('');
  var rows = list.map(function (b) {
    return '<tr class="rowb' + (b.ref === S.open ? ' sel' : '') + '" data-open="' + esc(b.ref) + '" tabindex="0"><td class="ref">' + esc(b.ref) + '</td><td>' + esc(lead(b)) + '</td><td>' + b.pax + '</td>' +
      '<td>' + whenS(b.check_in) + '</td><td>' + whenS(b.check_out) + '</td><td>' + hours(b) + '</td><td>' + peso(b.total) + '</td>' +
      '<td><span class="bpill' + (b.balance > 0 ? '' : ' ok') + '">' + (b.balance > 0 ? peso(b.balance) : 'Paid') + '</span></td>' +
      '<td><span class="st ' + esc(b.status) + '">' + esc(b.status) + '</span></td><td><button type="button" class="obtn" data-open="' + esc(b.ref) + '">Open</button></td></tr>';
  }).join('');
  return '<div class="hello"><div><h1>Bookings &amp; payments</h1><p>' + greet + ', ' + esc(shortName(me.name)) + ' — here\'s ' + (hour >= 18 ? 'tonight' : 'today') + ' at Luna\'s Oasis.</p></div>' +
    '<button type="button" class="pill ghost sm" data-act="refresh">↻ Refresh</button></div>' +
    '<div class="stats">' +
    '<div class="stat"><div class="k">Staying now</div><div class="v">' + esc(st.cur.v) + '</div><div class="s">' + esc(st.cur.s) + '</div></div>' +
    '<div class="stat"><div class="k">Next time-in</div><div class="v">' + esc(st.next.v) + '</div><div class="s">' + esc(st.next.s) + '</div></div>' +
    '<div class="stat"><div class="k">Turnover window</div><div class="v">' + esc(st.gap.v) + '</div><div class="s">' + esc(st.gap.s) + '</div></div>' +
    '<div class="stat"><div class="k">Unpaid balances</div><div class="v">' + esc(st.unpaid.v) + '</div><div class="s">' + esc(st.unpaid.s) + '</div></div>' +
    '</div>' +
    (S.error && !S.chpw && !S.open ? '<div class="err" role="alert">' + esc(S.error) + '</div>' : '') +
    '<div class="cols"><section class="panel"><h2 class="ph" style="margin-bottom:12px">All bookings</h2>' +
    '<div class="tools"><div class="tabs" role="group" aria-label="Filter bookings">' + tabs + '</div>' +
    '<label class="sr" for="q">Search bookings</label><input class="inp search" id="q" type="search" placeholder="Search name, ref or Gmail" value="' + esc(S.q) + '"></div>' +
    (list.length ? '<div class="tscroll"><table><thead><tr><th>Ref</th><th>Lead guest</th><th>Pax</th><th>Time-in</th><th>Time-out</th><th>Hrs</th><th>Total</th><th>Balance</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      : '<div class="empty">No bookings here.</div>') +
    '</section>' + detail() + '</div>';
}

function render() {
  if (!S.data) return;
  var focus = document.activeElement && document.activeElement.id, caret = focus === 'q' ? document.activeElement.selectionStart : null;
  var me = S.me, pages = navPages();
  if (pages.indexOf(S.page) === -1) S.page = 'bookings';
  var portal = me.role === 'admin' ? 'Admin portal' : me.role === 'coadmin' ? 'Co-admin portal' : 'Operator portal';
  var navBtns = function (cls) {
    return pages.map(function (k) {
      var n = NAV[k] || [PAGES[k].label, '#6F7480'];
      return '<button type="button" class="' + cls + '" data-page="' + k + '"' + (S.page === k ? ' aria-current="page"' : '') + '>' + (cls === 'nav' ? '<i style="background:' + n[1] + '"></i>' : '') + esc(n[0]) + '</button>';
    }).join('');
  };
  var c = catOf(me.name).color;
  app.innerHTML = '<div class="shell">' +
    '<aside class="side"><a class="sbrand" href="./"><img src="../assets/img/logo.png" alt="Luna\'s Oasis"><span class="script">Luna\'s</span><span class="oasis">OASIS</span></a>' +
    '<div class="srole">' + portal + '</div>' + navBtns('nav') + '</aside>' +
    '<a class="topbar" href="./"><img src="../assets/img/logo.png" alt=""><span><span class="script">Luna\'s</span><span class="oasis">OASIS</span></span></a>' +
    '<div class="pav"><button type="button" class="avbtn" data-act="menu" aria-label="Open profile menu" aria-expanded="' + S.menu + '" style="--c:' + c + '">' + catSvg(me.name, 46) + '</button>' +
    (S.menu ? '<div class="menu"><div class="mh"><b>' + esc(me.name) + '</b><small style="color:var(--soft)">' + esc(me.email) + '</small><br><span class="badge" style="background:' + c + '">' + roleLabel(me.role) + '</span></div>' +
      '<div class="mpages"><div class="mk">Pages</div>' + navBtns('') + '</div>' +
      '<button type="button" data-act="chpw">Change my password</button><a href="../" target="_blank" rel="noopener">View public site</a><button type="button" class="out" data-act="logout">Log out</button></div>' : '') +
    '</div>' +
    '<main class="pmain"><div class="kick">' + kicker() + '</div>' +
    (S.page !== 'bookings' && PAGES[S.page] ? PAGES[S.page].html() : bookingsHtml()) +
    '</main></div>' + (S.chpw ? chpwBox() : '');
  if (focus === 'q') { var q = document.getElementById('q'); if (q) { q.focus(); try { q.setSelectionRange(caret, caret); } catch (e) {} } }
}

// ---------- selected booking (right-hand card) ----------
function nextAfter(b) {
  return S.data.bookings.filter(function (x) { return x.ref !== b.ref && active(x) && x.status !== 'Completed' && ms(x.check_in) >= ms(b.check_out); })
    .sort(function (a, c) { return ms(a.check_in) - ms(c.check_in); })[0];
}
function detail() {
  var b = S.data.bookings.filter(function (x) { return x.ref === S.open; })[0];
  if (!b) return '<section class="panel detail"><p class="empty" style="padding:10px 0">Tap a booking to see it here.</p></section>';
  var rate = S.data.settings.extra_hour_rate, dep = b.deposit_info || {};
  var minPay = Math.round((b.total - b.deposit) * (S.data.settings.min_payment_pct || 50) / 100) + b.deposit;
  var statusBtns = {
    'Pending': [['Confirmed', 'Confirm booking', 'gold'], ['Cancelled', 'Cancel', 'red']],
    'Confirmed': [['Checked-in', 'Mark checked-in', 'gold'], ['No-show', 'No-show', 'line'], ['Cancelled', 'Cancel', 'red']],
    'Checked-in': [['Confirmed', 'Undo check-in', 'line']],
    'Completed': [],
    'Cancelled': [['Pending', 'Restore booking', 'line']],
    'No-show': [['Confirmed', 'Undo no-show', 'line']]
  }[b.status] || [];
  var stayLabel = b.nights ? plural(b.nights, 'night') + ' · ' + b.package : b.package + ' stay';
  var pays = b.payments.map(function (p) {
    return '<div style="font-size:13px;color:#3A322B;padding:4px 0">✓ ' + peso(p.amount) + ' · ' + esc(p.method) + (p.reference_no ? ' #' + esc(p.reference_no) : '') + ' · ' + esc(staffName(p.by)) + ' <small style="color:var(--muted)">' + when(p.at) + '</small></div>';
  }).join('');
  var canEdit = active(b) && b.status !== 'Completed';
  var nx = nextAfter(b), gapH = S.data.settings.cleaning_gap_hours || 0;
  var newEndMs = ms(b.check_out) + S.ext * HOUR;
  var clash = nx && newEndMs + gapH * HOUR > ms(nx.check_in);
  var newOut = when(new Date(newEndMs + PH).toISOString().slice(0, 16));
  var refundAmt = Math.max(0, b.deposit - (Number(S.dep.deduction) || 0));
  var depStatus = dep.refunded_at ? 'Returned' : dep.photo_ok && dep.items_ok ? 'Ready to return' : 'Held';
  var gaps = b.guests.map(function (g) {
    return '<div class="g"><span>' + esc(g.name) + (g.no === 1 ? ' <small style="color:var(--muted)">(main)</small>' : '') + '</span>' +
      (g.has_id ? '<button type="button" class="linkbtn" data-id="' + g.no + '">View ID</button>' : '<small style="color:var(--muted)">ID deleted</small>') + '</div>';
  }).join('');
  return '<section class="panel detail" id="detail" aria-label="Booking ' + esc(b.ref) + '">' +
    '<div><div class="k2">' + esc(b.ref) + ' · ' + plural(b.pax, 'guest') + (b.baby ? ' + baby' : '') + ' <span class="st ' + esc(b.status) + '" style="margin-left:6px">' + esc(b.status) + '</span></div>' +
    '<h2 class="h" style="font-size:26px;margin-top:6px">' + esc(lead(b)) + '</h2></div>' +
    (S.error ? '<div class="err" role="alert" style="margin:0">' + esc(S.error) + '</div>' : '') +
    (S.msg ? '<div class="okmsg" role="status" style="margin:0">' + esc(S.msg) + '</div>' : '') +
    (statusBtns.length ? '<div><div class="acts">' + statusBtns.map(function (x) { return '<button type="button" class="pill ' + x[2] + ' sm" data-status="' + x[0] + '"' + (S.busy ? ' disabled' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' +
      (b.status === 'Pending' ? '<p class="hint' + (b.paid_total < minPay ? ' warn' : '') + '">' + (b.paid_total < minPay ? 'Paid ' + peso(b.paid_total) + ' of the ' + peso(minPay) + ' needed to confirm (' + (S.data.settings.min_payment_pct || 50) + '% + deposit).' : 'Enough is paid to confirm.') + ' Confirming emails the guest.</p>' : '') + '</div>' : '') +
    '<div><div class="k2" style="margin-bottom:6px">Guests &amp; IDs</div><div class="glist">' + gaps + '</div>' +
    '<div style="font-size:13px;color:var(--muted);margin-top:6px">Gmail: <a href="mailto:' + esc(b.guest_email) + '" style="color:var(--bronze)">' + esc(b.guest_email) + '</a></div></div>' +
    '<div class="dkv"><div><small>Time-in</small>' + whenS(b.check_in) + '</div><div><small>Time-out</small>' + whenS(b.check_out) + '</div></div>' +
    '<div style="font-size:13px;color:var(--muted);margin-top:-6px">' + esc(stayLabel) + ' · ' + hours(b) + ' hrs · booked ' + when(b.created_at) + '</div>' +
    (canEdit ? '<div class="box"><h3>Extend stay</h3>' +
      '<div class="stepper"><button type="button" class="round" data-act="exm" aria-label="One hour less"' + (S.ext > 1 ? '' : ' disabled') + '>−</button><output class="extn">' + S.ext + '</output>' +
      '<button type="button" class="round" data-act="exp" aria-label="One hour more"' + (S.ext < S.data.settings.max_extend_hours ? '' : ' disabled') + '>+</button><span style="color:var(--muted)">hours</span></div>' +
      '<div style="margin-top:12px;font-size:14px;line-height:1.8">' +
      '<div class="dl"><span>New time-out</span><b>' + newOut + '</b></div>' +
      '<div class="dl"><span>Total stay</span><b>' + (hours(b) + S.ext) + ' hrs</b></div>' +
      '<div class="dl"><span>Extension charge (' + S.ext + ' × ' + peso(rate) + ')</span><b>' + peso(S.ext * rate) + '</b></div>' +
      '<div class="dl"><span>Next guest time-in</span><b>' + (nx ? when(nx.check_in) + ' (' + esc(lead(nx).split(' ')[0]) + ')' : 'No next booking') + '</b></div></div>' +
      (clash ? '<div class="err" style="margin-top:10px">Too close to the next guest — it needs ' + gapH + ' hrs for cleaning.</div>' : '') +
      '<button type="button" class="pill dark sm" style="width:100%;margin-top:12px" data-act="extend"' + (S.busy || clash ? ' disabled' : '') + '>Apply extension</button></div>' : '') +
    '<div class="box"><h3>Payment</h3>' +
    '<div class="row"><span>' + (b.nights ? plural(b.nights, 'night') : b.package) + ' · ' + (b.pax <= 2 ? '2' : '4') + ' pax rate</span><span>' + peso(b.stay_rate) + '</span></div>' +
    (b.discount ? '<div class="row" style="color:var(--ok)"><span>' + esc(b.promo_name || 'Promo') + (b.promo_pct ? ' (−' + b.promo_pct + '%)' : '') + '</span><span>−' + peso(b.discount) + '</span></div>' : '') +
    (b.extras_total ? '<div class="row"><span>Extra &amp; stay-over hours (' + b.extra_hours + ' × ' + peso(rate) + ')</span><span>' + peso(b.extras_total) + '</span></div>' : '') +
    '<div class="row"><span>Security deposit</span><span>' + peso(b.deposit) + '</span></div>' +
    '<div class="row tot"><span>Total</span><span>' + peso(b.total) + '</span></div>' +
    '<div class="row"><span>Paid</span><span class="paid">' + peso(b.paid_total) + '</span></div>' +
    '<div class="row tot" style="font-size:17px"><span>Balance</span><span class="' + (b.balance > 0 ? 'bal' : 'paid') + '">' + peso(b.balance) + '</span></div>' +
    (pays ? '<div style="margin-top:8px">' + pays + '</div>' : '') +
    (canEdit && b.balance > 0 ? '<span class="label">Record a payment</span>' +
      '<div class="two"><div><label class="sr" for="pa">Amount</label><input class="inp" id="pa" type="number" inputmode="decimal" min="1" placeholder="Amount (₱)" value="' + esc(S.pay.amount) + '"></div>' +
      '<div><label class="sr" for="pr">Reference no.</label><input class="inp" id="pr" placeholder="Reference no. (optional)" value="' + esc(S.pay.refno) + '"></div></div>' +
      '<div class="seg" style="margin-top:8px" role="group" aria-label="Paid by">' + ['GCash', 'Bank transfer'].map(function (m) { return '<button type="button" data-paym="' + m + '" aria-pressed="' + (S.pay.method === m) + '">' + m + '</button>'; }).join('') + '</div>' +
      '<div class="acts" style="margin-top:10px"><button type="button" class="pill dark sm" data-act="pay"' + (S.busy ? ' disabled' : '') + '>Record</button>' +
      '<button type="button" class="pill line sm" data-act="payall"' + (S.busy ? ' disabled' : '') + '>Mark balance as paid</button></div>' : '') +
    '</div>' +
    '<div class="box"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px"><h3 style="margin:0">Security deposit · ' + peso(b.deposit) + '</h3><span class="dep">' + depStatus + '</span></div>' +
    (dep.refunded_at
      ? '<p style="margin:0;font-size:14px">✓ Returned ' + peso(dep.refunded_amount) + ' by ' + esc(dep.refund_method) + ' on ' + when(dep.refunded_at) + (dep.deduction ? '<br>Deducted ' + peso(dep.deduction) + ': ' + esc(dep.deduction_reason) : '') + '</p>'
      : '<p class="hint" style="margin-top:0">Return it by GCash or bank transfer after the guest sends the check-out photo and the unit is checked.</p>' +
        '<div class="ticks"><label><input type="checkbox" data-depf="photo_ok"' + (dep.photo_ok ? ' checked' : '') + '> Guest sent check-out photo</label>' +
        '<label><input type="checkbox" data-depf="items_ok"' + (dep.items_ok ? ' checked' : '') + '> Items complete &amp; unit clean (see Checklist)</label></div>' +
        '<div class="two" style="margin-top:6px"><div><label class="sr" for="dd">Deduction</label><input class="inp" id="dd" type="number" min="0" placeholder="Deduction ₱ (if any)" value="' + esc(S.dep.deduction) + '"></div>' +
        '<div><label class="sr" for="dr">Reason</label><input class="inp" id="dr" placeholder="Reason (if any)" value="' + esc(S.dep.reason) + '"></div></div>' +
        '<div class="seg" style="margin-top:8px" role="group" aria-label="Return by">' + ['GCash', 'Bank transfer'].map(function (m) { return '<button type="button" data-depm="' + m + '" aria-pressed="' + (S.dep.method === m) + '">' + m + '</button>'; }).join('') + '</div>' +
        '<button type="button" class="pill gold sm" style="width:100%;margin-top:10px" data-act="refund"' + (dep.photo_ok && dep.items_ok && !S.busy ? '' : ' disabled') + '>Mark ' + peso(refundAmt) + ' returned</button>') +
    '</div></section>';
}

function chpwBox() {
  return '<div class="shade" data-act="chpwclose"></div><aside class="drawer" role="dialog" aria-label="Change my password" style="height:auto;bottom:auto;top:10%;right:50%;transform:translateX(50%);border-radius:22px;width:min(420px,94%)">' +
    '<div class="dh" style="border-radius:22px 22px 0 0"><div class="t">Change my password</div><button type="button" data-act="chpwclose" aria-label="Close">✕</button></div>' +
    '<form class="sec" id="cpf" style="border:0">' +
    '<label class="label" for="cp0" style="margin-top:0">Current password</label><input class="inp" id="cp0" type="password" autocomplete="current-password">' +
    '<label class="label" for="cp1">New password (8+ characters)</label><input class="inp" id="cp1" type="password" autocomplete="new-password">' +
    (S.error ? '<div class="err" role="alert">' + esc(S.error) + '</div>' : '') +
    (S.msg ? '<div class="okmsg" role="status">' + esc(S.msg) + '</div>' : '') +
    '<button class="pill gold" style="width:100%;margin-top:16px"' + (S.busy ? ' disabled' : '') + '>Save new password</button></form></aside>';
}

function viewId(ref, no) {
  var box = document.createElement('div');
  box.className = 'viewer'; box.setAttribute('role', 'dialog');
  box.innerHTML = '<div class="spin"></div><p>Loading ID…</p>';
  document.body.appendChild(box);
  post({ action: 'staffGetId', ref: ref, guest_no: no }).then(function (d) {
    var url = 'data:' + d.mime + ';base64,' + d.data;
    if (d.mime === 'application/pdf') {
      var bin = atob(d.data), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      url = URL.createObjectURL(new Blob([arr], { type: 'application/pdf' }));
    }
    box.innerHTML = '<p>' + esc(d.name) + '</p>' + (d.mime === 'application/pdf' ? '<iframe src="' + url + '" title="ID"></iframe><a class="pill ghost sm" href="' + url + '" target="_blank" rel="noopener">Open PDF</a>' : '<img src="' + url + '" alt="ID of ' + esc(d.name) + '">') +
      '<button type="button" class="pill gold">Close</button>';
    box.querySelector('button').onclick = function () { box.remove(); };
  }).catch(function (err) {
    if (err.auth) { box.remove(); signOut('Please sign in again.'); return; }
    box.innerHTML = '<p>' + esc(err.message) + '</p><button type="button" class="pill gold">Close</button>';
    box.querySelector('button').onclick = function () { box.remove(); };
  });
}


function selectBooking(ref) {
  S.open = ref; S.ext = 1;
  var b = S.data.bookings.filter(function (x) { return x.ref === ref; })[0];
  S.pay = { amount: b && b.balance > 0 ? String(b.balance) : '', method: 'GCash', refno: '' };
  S.dep = { method: 'GCash', deduction: '', reason: '' };
}
function openBooking(ref) {   // from any page: show this booking on Bookings & payments
  var fromOther = S.page !== 'bookings';
  selectBooking(ref); S.error = ''; S.msg = ''; S.page = 'bookings'; S.menu = false;
  if (fromOther && S.tab !== 'all' && !lists()[S.tab].some(function (b) { return b.ref === ref; })) S.tab = 'all';
  render();
  var d = document.getElementById('detail');
  if (d && (fromOther || window.innerWidth <= 1000)) d.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- events ----------
function fromPages(kind, e) {   // let page files handle their own buttons and fields first
  var ks = Object.keys(PAGES);
  for (var i = 0; i < ks.length; i++) { var p = PAGES[ks[i]]; if (p[kind] && p[kind](e)) return true; }
  return false;
}
app.addEventListener('click', function (e) {
  if (fromPages('click', e)) return;
  var el = e.target.closest('[data-act],[data-tab],[data-open],[data-status],[data-id],[data-paym],[data-depm],[data-page]');
  if (!el || el.disabled) { if (S.menu && !e.target.closest('.menu')) { S.menu = false; render(); } return; }
  var d = el.dataset, b = S.open && S.data.bookings.filter(function (x) { return x.ref === S.open; })[0];
  if (d.tab) { S.tab = d.tab; render(); return; }
  if (d.page) {
    S.page = d.page; S.error = ''; S.menu = false;
    if (PAGES[d.page] && PAGES[d.page].enter) PAGES[d.page].enter();
    render(); window.scrollTo(0, 0); return;
  }
  if (d.open) { e.preventDefault(); openBooking(d.open); return; }
  if (d.id) { viewId(S.open, +d.id); return; }
  if (d.paym) { S.pay.method = d.paym; render(); return; }
  if (d.depm) { S.dep.method = d.depm; render(); return; }
  if (d.status) {
    var label = el.textContent;
    if ((d.status === 'Cancelled' || d.status === 'No-show') && !window.confirm(label + ' ' + b.ref + '? Its time slot will be freed for other guests.')) return;
    act({ action: 'staffSetStatus', ref: b.ref, status: d.status }, b.ref + ' is now ' + d.status + (d.status === 'Confirmed' && b.status === 'Pending' ? '. We emailed the guest.' : '.'));
    return;
  }
  switch (d.act) {
    case 'menu': S.menu = !S.menu; render(); break;
    case 'logout': signOut(''); break;
    case 'refresh': S.error = ''; loadAll(); break;
    case 'chpw': S.menu = false; S.chpw = true; S.error = ''; S.msg = ''; render(); break;
    case 'chpwclose': S.chpw = false; S.error = ''; S.msg = ''; render(); break;
    case 'pay':
      if (!(Number(S.pay.amount) > 0)) { S.error = 'Please enter the amount paid.'; render(); return; }
      act({ action: 'staffRecordPayment', ref: b.ref, amount: Number(S.pay.amount), method: S.pay.method, reference_no: S.pay.refno }, 'Payment of ' + peso(S.pay.amount) + ' recorded.')
        .then(function () { var nb = S.data.bookings.filter(function (x) { return x.ref === S.open; })[0]; S.pay = { amount: nb && nb.balance > 0 ? String(nb.balance) : '', method: S.pay.method, refno: '' }; render(); });
      break;
    case 'payall':
      if (!window.confirm('Record ' + peso(b.balance) + ' paid by ' + S.pay.method + ' for ' + b.ref + '?')) return;
      act({ action: 'staffRecordPayment', ref: b.ref, amount: b.balance, method: S.pay.method, reference_no: S.pay.refno }, 'Balance marked as paid.');
      break;
    case 'exm': S.ext = Math.max(1, S.ext - 1); render(); break;
    case 'exp': S.ext = Math.min(S.data.settings.max_extend_hours, S.ext + 1); render(); break;
    case 'extend': act({ action: 'staffExtend', ref: b.ref, hours: S.ext }, 'Extended by ' + S.ext + ' hr' + (S.ext > 1 ? 's' : '') + '.').then(function () { S.ext = 1; render(); }); break;
    case 'refund':
      var amt = Math.max(0, b.deposit - (Number(S.dep.deduction) || 0));
      if (!window.confirm('Mark ' + peso(amt) + ' deposit as returned by ' + S.dep.method + '?')) return;
      act({ action: 'staffDeposit', ref: b.ref, refund: true, method: S.dep.method, deduction: Number(S.dep.deduction) || 0, reason: S.dep.reason }, 'Deposit returned. Booking completed.');
      break;
  }
});
app.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && (S.menu || S.chpw)) { S.menu = false; S.chpw = false; S.error = ''; render(); }
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.open) openBooking(e.target.dataset.open);
});
app.addEventListener('input', function (e) {
  if (fromPages('input', e)) return;
  var id = e.target.id;
  if (id === 'q') { S.q = e.target.value; render(); }
  if (id === 'pa') S.pay.amount = e.target.value;
  if (id === 'pr') S.pay.refno = e.target.value;
  if (id === 'dr') S.dep.reason = e.target.value;
  if (id === 'dd') { S.dep.deduction = e.target.value; var btn = app.querySelector('[data-act="refund"]'), b = S.data.bookings.filter(function (x) { return x.ref === S.open; })[0]; if (btn && b) btn.textContent = 'Mark ' + peso(Math.max(0, b.deposit - (Number(e.target.value) || 0))) + ' returned'; }
});
app.addEventListener('change', function (e) {
  if (fromPages('change', e)) return;
  if (e.target.dataset.depf) act({ action: 'staffDeposit', ref: S.open, field: e.target.dataset.depf, value: e.target.checked });
});
app.addEventListener('submit', function (e) {
  if (e.target.id !== 'cpf') return;
  e.preventDefault();
  var o = document.getElementById('cp0').value, n = document.getElementById('cp1').value;
  if (n.length < 8) { S.error = 'The new password needs at least 8 characters.'; render(); return; }
  S.busy = true; S.error = ''; render();
  post({ action: 'staffChangePassword', old_password: o, new_password: n }).then(function (d) {
    S.busy = false; S.token = d.token; S.remember = !!(function () { try { return localStorage.getItem('lo_staff'); } catch (x) { return ''; } })(); store('lo_staff', d.token);
    S.msg = 'Password changed.'; render();
  }).catch(fail);
});

// ---------- start (after all page files have loaded) ----------
document.addEventListener('DOMContentLoaded', function () {
  if (!API) { app.innerHTML = '<div class="loading">The portal is not set up yet.</div>'; return; }
  var t0 = new Date(Date.now() + PH); S.cy = S.ry = t0.getUTCFullYear(); S.cm = S.rm = t0.getUTCMonth();
  S.token = load('lo_staff');
  if (S.token) loadAll(); else renderLogin();
});