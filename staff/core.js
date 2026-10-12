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

// ---------- sign-in ----------
function renderLogin() {
  app.innerHTML = '<div class="login"><form class="lcard" id="lf" novalidate>' +
    '<div class="logo"><img src="../assets/img/logo.png" alt=""><span>Luna\'s Oasis</span></div>' +
    '<h1>Staff sign-in</h1><p class="sub">For Luna\'s Oasis staff only.</p>' +
    '<label class="label" for="le">Gmail</label><input class="inp" id="le" type="email" autocomplete="username" inputmode="email" placeholder="yourname@gmail.com" required>' +
    '<label class="label" for="lp">Password</label><input class="inp" id="lp" type="password" autocomplete="current-password" required>' +
    '<label class="check"><input type="checkbox" id="lr"> Keep me signed in on this device</label>' +
    (S.loginErr ? '<div class="err" role="alert">' + esc(S.loginErr) + '</div>' : '') +
    '<button class="pill gold" style="width:100%;margin-top:18px" ' + (S.busy ? 'disabled' : '') + '>' + (S.busy ? 'Signing in…' : 'Sign in') + '</button>' +
    '<div class="foot"><span>Forgot password? Ask the admin.</span><a href="../">← Back to the website</a></div>' +
    '</form></div>';
  document.getElementById('lf').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('le').value.trim(), pw = document.getElementById('lp').value;
    S.remember = document.getElementById('lr').checked;
    if (!email || !pw) { S.loginErr = 'Please enter your Gmail and password.'; renderLogin(); return; }
    S.busy = true; S.loginErr = ''; renderLogin();
    post({ action: 'staffLogin', email: email, password: pw, remember: S.remember }).then(function (d) {
      S.token = d.token; S.me = d.me; store('lo_staff', d.token); S.busy = false; loadAll();
    }).catch(function (err) {
      S.busy = false; S.loginErr = err.message === 'Failed to fetch' ? 'Could not reach the server.' : err.message; renderLogin();
      var el = document.getElementById('le'); if (el) el.value = email;
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
function stats() {
  var now = nowMs(), act = S.data.bookings.filter(function (b) { return active(b) && b.status !== 'Completed'; });
  var cur = act.filter(function (b) { return ms(b.check_in) <= now && now < ms(b.check_out); })[0];
  var next = act.filter(function (b) { return ms(b.check_in) > now; }).sort(function (a, b) { return ms(a.check_in) - ms(b.check_in); })[0];
  var unpaid = S.data.bookings.filter(function (b) { return active(b) && b.balance > 0; });
  return {
    cur: cur ? { v: lead(cur), s: 'Out ' + when(cur.check_out) } : { v: 'No one', s: 'The unit is free right now' },
    next: next ? { v: lead(next), s: when(next.check_in) } : { v: 'None yet', s: 'No upcoming bookings' },
    unpaid: { v: peso(unpaid.reduce(function (a, b) { return a + b.balance; }, 0)), s: unpaid.length + ' booking' + (unpaid.length === 1 ? '' : 's') }
  };
}

function render() {
  if (!S.data) return;
  var focus = document.activeElement && document.activeElement.id, caret = focus === 'q' ? document.activeElement.selectionStart : null;
  var oldDrawer = app.querySelector('.drawer'), keepScroll = oldDrawer ? oldDrawer.scrollTop : 0;
  var L = lists(), st = stats(), list = L[S.tab], me = S.me;
  var hour = new Date(Date.now() + PH).getUTCHours();
  var greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  var tabs = [['upcoming', 'Upcoming'], ['pending', 'Needs confirming'], ['unpaid', 'Unpaid'], ['all', 'All']].map(function (t) {
    return '<button type="button" class="tab" data-tab="' + t[0] + '" aria-pressed="' + (S.tab === t[0]) + '">' + t[1] + '<span class="n">' + L[t[0]].length + '</span></button>';
  }).join('');
  var rows = list.map(function (b) {
    return '<tr class="rowb" data-open="' + esc(b.ref) + '" tabindex="0"><td class="ref">' + esc(b.ref) + '</td><td><span class="st ' + esc(b.status) + '">' + esc(b.status) + '</span></td>' +
      '<td>' + esc(lead(b)) + '</td><td>' + b.pax + '</td><td>' + when(b.check_in) + '</td><td>' + when(b.check_out) + '</td><td class="num">' + hours(b) + '</td>' +
      '<td class="num">' + peso(b.total) + '</td><td class="num ' + (b.balance > 0 ? 'bal' : 'paid') + '">' + (b.balance > 0 ? peso(b.balance) : 'Paid') + '</td></tr>';
  }).join('');
  var cards = list.map(function (b) {
    return '<button type="button" class="card" data-open="' + esc(b.ref) + '"><div class="l1"><span class="ref">' + esc(b.ref) + '</span><span class="st ' + esc(b.status) + '">' + esc(b.status) + '</span></div>' +
      '<div class="l2">' + esc(lead(b)) + ' · ' + b.pax + ' pax</div>' +
      '<div class="l3"><span>' + when(b.check_in) + '</span><span class="' + (b.balance > 0 ? 'bal' : 'paid') + '">' + (b.balance > 0 ? peso(b.balance) + ' due' : 'Paid') + '</span></div></button>';
  }).join('');
  app.innerHTML =
    '<header class="top"><div class="wrap">' +
    '<a class="brand" href="./"><img src="../assets/img/logo.png" alt=""><span><b>Luna\'s Oasis</b><small>Staff portal</small></span></a>' +
    '<div class="who"><button type="button" data-act="menu" aria-expanded="' + S.menu + '"><span class="av">' + esc(initials(me.name)) + '</span><span class="n">' + esc(me.name) + '</span></button>' +
    (S.menu ? '<div class="menu"><div class="mh"><div>' + esc(me.name) + '</div><div>' + esc(me.role === 'coadmin' ? 'Co-admin' : me.role) + ' · ' + esc(me.email) + '</div></div>' +
      '<button type="button" data-act="chpw">Change my password</button><a href="../" target="_blank" rel="noopener">View public site</a><button type="button" data-act="logout">Log out</button></div>' : '') +
    '</div></div></header>' +
    '<nav class="wrap pnav" aria-label="Pages"><button type="button" data-page="bookings"' + (S.page === 'bookings' ? ' aria-current="page"' : '') + '>Bookings</button>' +
    Object.keys(PAGES).sort(function (a, b) { return PAGES[a].order - PAGES[b].order; }).filter(function (k) { return !PAGES[k].show || PAGES[k].show(); }).map(function (k) {
      return '<button type="button" data-page="' + k + '"' + (S.page === k ? ' aria-current="page"' : '') + '>' + PAGES[k].label + '</button>';
    }).join('') + '</nav>' +
    '<main class="wrap page">' + (S.page !== 'bookings' && PAGES[S.page] ? PAGES[S.page].html() : (
    '<div class="hello"><div><h1>Bookings &amp; payments</h1><p>' + greet + ', ' + esc(me.name) + ' — here\'s what\'s happening at Luna\'s Oasis.</p></div>' +
    '<button type="button" class="pill ghost sm" data-act="refresh">↻ Refresh</button></div>' +
    '<div class="stats">' +
    '<div class="stat"><div><div class="k">Staying now</div><div class="s">' + esc(st.cur.s) + '</div></div><div class="v">' + esc(st.cur.v) + '</div></div>' +
    '<div class="stat"><div><div class="k">Next time-in</div><div class="s">' + esc(st.next.s) + '</div></div><div class="v">' + esc(st.next.v) + '</div></div>' +
    '<div class="stat"><div><div class="k">Unpaid balances</div><div class="s">' + esc(st.unpaid.s) + '</div></div><div class="v">' + esc(st.unpaid.v) + '</div></div>' +
    '</div>' +
    (S.error && !S.open ? '<div class="err" role="alert" style="margin-bottom:12px">' + esc(S.error) + '</div>' : '') +
    '<section class="panel"><div class="tools"><div class="tabs" role="group" aria-label="Filter bookings">' + tabs + '</div>' +
    '<label class="sr" for="q">Search bookings</label><input class="inp search" id="q" type="search" placeholder="Search name, ref or Gmail" value="' + esc(S.q) + '"></div>' +
    (list.length ? '<table><thead><tr><th>Ref</th><th>Status</th><th>Lead guest</th><th>Pax</th><th>Time-in</th><th>Time-out</th><th class="num">Hrs</th><th class="num">Total</th><th class="num">Balance</th></tr></thead><tbody>' + rows + '</tbody></table><div class="cards">' + cards + '</div>'
      : '<div class="empty">No bookings here.</div>') +
    '</section>')) + '</main>' + (S.open ? drawer() : '') + (S.chpw ? chpwBox() : '');
  if (focus === 'q') { var q = document.getElementById('q'); q.focus(); try { q.setSelectionRange(caret, caret); } catch (e) {} }
  var newDrawer = app.querySelector('.drawer'); if (newDrawer && oldDrawer) newDrawer.scrollTop = keepScroll;
}


// ---------- booking drawer ----------
function drawer() {
  var b = S.data.bookings.filter(function (x) { return x.ref === S.open; })[0];
  if (!b) return '';
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
  var stayLabel = b.nights ? b.nights + (b.nights > 1 ? ' nights' : ' night') + ' · ' + b.package : b.package + ' stay';
  var pays = b.payments.map(function (p) {
    return '<div class="row"><span>✓ ' + peso(p.amount) + ' · ' + esc(p.method) + (p.reference_no ? ' #' + esc(p.reference_no) : '') + '<br><small style="color:var(--muted)">' + when(p.at) + ' · ' + esc(p.by.split('@')[0]) + '</small></span></div>';
  }).join('');
  var canEdit = active(b) && b.status !== 'Completed';
  var newOut = when(new Date(ms(b.check_out) + S.ext * HOUR + PH).toISOString().slice(0, 16));
  var refundAmt = Math.max(0, b.deposit - (Number(S.dep.deduction) || 0));
  var gaps = b.guests.map(function (g) {
    return '<div class="g"><span>' + g.no + '. ' + esc(g.name) + (g.no === 1 ? ' <small style="color:var(--muted)">(main)</small>' : '') + '</span>' +
      (g.has_id ? '<button type="button" class="pill line sm" data-id="' + g.no + '">View ID</button>' : '<small style="color:var(--muted)">ID deleted</small>') + '</div>';
  }).join('');
  return '<div class="shade" data-act="close"></div><aside class="drawer" role="dialog" aria-label="Booking ' + esc(b.ref) + '">' +
    '<div class="dh"><div><div class="t">' + esc(b.ref) + '</div><span class="st ' + esc(b.status) + '" style="margin-top:6px">' + esc(b.status) + '</span></div><button type="button" data-act="close" aria-label="Close">✕</button></div>' +
    (S.error ? '<div class="sec"><div class="err" role="alert" style="margin:0">' + esc(S.error) + '</div></div>' : '') +
    (S.msg ? '<div class="sec"><div class="okmsg" role="status" style="margin:0">' + esc(S.msg) + '</div></div>' : '') +
    '<div class="sec"><div class="big">' + esc(lead(b)) + '</div><div style="font-size:14px;color:var(--muted)">' + b.pax + ' guest' + (b.pax > 1 ? 's' : '') + (b.baby ? ' + baby' : '') + ' · <a href="mailto:' + esc(b.guest_email) + '" style="color:var(--bronze)">' + esc(b.guest_email) + '</a></div>' +
    '<div class="kv" style="margin-top:12px"><div><small>Time-in</small>' + when(b.check_in) + '</div><div><small>Time-out</small>' + when(b.check_out) + '</div>' +
    '<div><small>Stay</small>' + esc(stayLabel) + '</div><div><small>Booked</small>' + when(b.created_at) + '</div></div>' +
    (statusBtns.length ? '<div class="acts" style="margin-top:14px">' + statusBtns.map(function (x) { return '<button type="button" class="pill ' + x[2] + ' sm" data-status="' + x[0] + '"' + (S.busy ? ' disabled' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' : '') +
    (b.status === 'Pending' ? '<p class="hint' + (b.paid_total < minPay ? ' warn' : '') + '">' + (b.paid_total < minPay ? 'Paid ' + peso(b.paid_total) + ' of the ' + peso(minPay) + ' needed to confirm (' + (S.data.settings.min_payment_pct || 50) + '% + deposit).' : 'Enough is paid to confirm.') + ' Confirming emails the guest.</p>' : '') +
    '</div>' +
    '<div class="sec"><h3>Guests &amp; IDs</h3><div class="glist">' + gaps + '</div></div>' +
    '<div class="sec"><h3>Payment</h3>' +
    '<div class="row"><span>' + (b.nights ? b.nights + (b.nights > 1 ? ' nights' : ' night') : b.package) + ' · ' + (b.pax <= 2 ? '2' : '4') + ' pax rate</span><span>' + peso(b.stay_rate) + '</span></div>' +
    (b.discount ? '<div class="row" style="color:var(--ok)"><span>' + esc(b.promo_name || 'Promo') + (b.promo_pct ? ' (−' + b.promo_pct + '%)' : '') + '</span><span>−' + peso(b.discount) + '</span></div>' : '') +
    (b.extras_total ? '<div class="row"><span>Extra &amp; stay-over hours (' + b.extra_hours + ' × ' + peso(rate) + ')</span><span>' + peso(b.extras_total) + '</span></div>' : '') +
    '<div class="row"><span>Security deposit</span><span>' + peso(b.deposit) + '</span></div>' +
    '<div class="row tot"><span>Total</span><span>' + peso(b.total) + '</span></div>' +
    '<div class="row"><span>Paid</span><span class="paid">' + peso(b.paid_total) + '</span></div>' +
    '<div class="row tot"><span>Balance</span><span class="' + (b.balance > 0 ? 'bal' : 'paid') + '">' + peso(b.balance) + '</span></div>' +
    (pays ? '<div style="margin-top:8px">' + pays + '</div>' : '') +
    (canEdit && b.balance > 0 ? '<span class="label">Record a payment</span>' +
      '<div class="two"><div><label class="sr" for="pa">Amount</label><input class="inp" id="pa" type="number" inputmode="decimal" min="1" placeholder="Amount (₱)" value="' + esc(S.pay.amount) + '"></div>' +
      '<div><label class="sr" for="pr">Reference no.</label><input class="inp" id="pr" placeholder="Reference no. (optional)" value="' + esc(S.pay.refno) + '"></div></div>' +
      '<div class="seg" style="margin-top:8px" role="group" aria-label="Paid by">' + ['GCash', 'Bank transfer'].map(function (m) { return '<button type="button" data-paym="' + m + '" aria-pressed="' + (S.pay.method === m) + '">' + m + '</button>'; }).join('') + '</div>' +
      '<div class="acts" style="margin-top:10px"><button type="button" class="pill gold sm" data-act="pay"' + (S.busy ? ' disabled' : '') + '>Record payment</button>' +
      '<button type="button" class="pill line sm" data-act="payall"' + (S.busy ? ' disabled' : '') + '>Mark balance (' + peso(b.balance) + ') as paid</button></div>' : '') +
    '</div>' +
    (canEdit ? '<div class="sec"><h3>Extend stay</h3>' +
      '<div class="stepper"><button type="button" class="round" data-act="exm" aria-label="Fewer hours"' + (S.ext > 1 ? '' : ' disabled') + '>−</button><output>' + S.ext + ' hr' + (S.ext > 1 ? 's' : '') + '</output>' +
      '<button type="button" class="round" data-act="exp" aria-label="More hours"' + (S.ext < S.data.settings.max_extend_hours ? '' : ' disabled') + '>+</button></div>' +
      '<p class="hint">New time-out: <b>' + newOut + '</b> · Charge ' + S.ext + ' × ' + peso(rate) + ' = <b>' + peso(S.ext * rate) + '</b></p>' +
      '<button type="button" class="pill dark sm" data-act="extend"' + (S.busy ? ' disabled' : '') + '>Apply extension</button></div>' : '') +
    (['Checked-in', 'Completed'].indexOf(b.status) !== -1 || dep.photo_ok || dep.refunded_at ? '<div class="sec"><h3>Security deposit · ' + peso(b.deposit) + '</h3>' +
      (dep.refunded_at
        ? '<p style="margin:0">✓ Returned ' + peso(dep.refunded_amount) + ' by ' + esc(dep.refund_method) + ' on ' + when(dep.refunded_at) + (dep.deduction ? '<br>Deducted ' + peso(dep.deduction) + ': ' + esc(dep.deduction_reason) : '') + '</p>'
        : '<p class="hint" style="margin-top:0">Return it after the guest sends the check-out photo and the unit is checked.</p>' +
          '<div class="ticks"><label><input type="checkbox" data-depf="photo_ok"' + (dep.photo_ok ? ' checked' : '') + '> Guest sent check-out photo</label>' +
          '<label><input type="checkbox" data-depf="items_ok"' + (dep.items_ok ? ' checked' : '') + '> Items complete &amp; unit clean</label></div>' +
          '<div class="two" style="margin-top:6px"><div><label class="sr" for="dd">Deduction</label><input class="inp" id="dd" type="number" min="0" placeholder="Deduction ₱ (if any)" value="' + esc(S.dep.deduction) + '"></div>' +
          '<div><label class="sr" for="dr">Reason</label><input class="inp" id="dr" placeholder="Reason (if any)" value="' + esc(S.dep.reason) + '"></div></div>' +
          '<div class="seg" style="margin-top:8px" role="group" aria-label="Return by">' + ['GCash', 'Bank transfer'].map(function (m) { return '<button type="button" data-depm="' + m + '" aria-pressed="' + (S.dep.method === m) + '">' + m + '</button>'; }).join('') + '</div>' +
          '<button type="button" class="pill gold sm" style="margin-top:10px" data-act="refund"' + (dep.photo_ok && dep.items_ok && !S.busy ? '' : ' disabled') + '>Mark ' + peso(refundAmt) + ' returned</button>') +
      '</div>' : '') +
    '</aside>';
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

function openBooking(ref) {
  S.open = ref; S.error = ''; S.msg = ''; S.ext = 1;
  var b = S.data.bookings.filter(function (x) { return x.ref === ref; })[0];
  S.pay = { amount: b && b.balance > 0 ? String(b.balance) : '', method: 'GCash', refno: '' };
  S.dep = { method: 'GCash', deduction: '', reason: '' };
  render();
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
    case 'close': S.open = ''; S.error = ''; S.msg = ''; render(); break;
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
  if (e.key === 'Escape' && (S.open || S.chpw)) { S.open = ''; S.chpw = false; S.error = ''; render(); }
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