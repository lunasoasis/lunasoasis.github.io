/* Luna's Oasis — staff portal: admin screens opened from the profile (cat) menu.
   · Users          (staff accounts & guests)
   · Payments by method
   · Recent activity (everything staff do, with sign-in and sign-out times) */
'use strict';

(function () {   // styles for these screens
  var css =
    '.adtop{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px}' +
    '.mnav{display:flex;align-items:center;gap:8px}.mnav b{font-family:"Cormorant Garamond",serif;font-size:24px;font-weight:600;min-width:170px;text-align:center}' +
    '.pmrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:center;margin-bottom:14px}' +
    '.pmrow .ckbar{grid-column:1 / -1;margin:0}.pmrow small{color:var(--muted);font-size:12.5px}' +
    '.daygrp{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--bronze);margin:16px 0 2px}' +
    '.afil{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0 4px}.afil select{width:auto;min-height:40px;background:var(--paper)}' +
    '.inout{font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px;background:#E8DCC4;color:#2F5A47;margin-right:6px}.inout.out{background:#EDE3D1;color:#7A5A2E}' +
    '@media (max-width:760px){.mnav b{font-size:20px;min-width:0}.afil .sortb{min-height:36px;padding:0 12px;font-size:12.5px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

if (NAV.overview) NAV.overview[0] = 'Overview · reviews';   // users now have their own screen

// Extra buttons in the cat menu (core.js calls this).
function menuExtra() {
  if (!isFinance()) return '';
  var b = function (k, t) { return '<button type="button" data-page="' + k + '"' + (S.page === k ? ' aria-current="page"' : '') + '>' + t + '</button>'; };
  return '<div class="mk">Admin</div>' + b('users', 'Users') + b('activity', 'Recent activity');
}

function adName(email) { return staffName(email); }
function adTime(v) {   // "1:05 PM"
  if (!v) return '';
  var h = +v.slice(11, 13), m = v.slice(14, 16);
  return ((h + 11) % 12 + 1) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM');
}
function adDay(v) {    // "Today", "Yesterday" or "Mon, Oct 12"
  var t = new Date(Date.now() + PH).toISOString().slice(0, 10), y = new Date(Date.now() + PH - 24 * HOUR).toISOString().slice(0, 10), d = v.slice(0, 10);
  return d === t ? 'Today' : d === y ? 'Yesterday' : when(v).split(' · ')[0];
}
function adLen(a, b) {
  var mins = Math.max(1, Math.round((ms(b) - ms(a)) / 60000));
  return mins < 60 ? mins + ' min' : Math.floor(mins / 60) + ' hr' + (mins >= 120 ? 's' : '') + (mins % 60 ? ' ' + mins % 60 + ' min' : '');
}

// ===================== Users =====================
PAGES.users = {
  show: function () { return false; }, menu: isFinance,
  html: function () {
    return '<div class="hello"><div><h1>Users</h1><p>Staff accounts and the guests who booked.</p></div><button type="button" class="pill ghost sm" data-act="ovrefresh">↻ Refresh</button></div>' +
      (S.error ? '<div class="err" role="alert">' + esc(S.error) + '</div>' : '') + (S.ovMsg ? '<div class="okmsg" role="status">' + esc(S.ovMsg) + '</div>' : '') +
      (S.ov ? ovUsersHtml() : '<div class="loading"><div class="spin"></div>Loading users…</div>');
  },
  enter: function () {
    S.error = ''; S.ovMsg = '';
    if (!S.ovUserTab) { S.ovUserTab = 'staff'; S.ovRevTab = 'pending'; S.ovRev = { open: false, guest: '', ref: '', rating: 5, text: '' }; }
    loadOv();
  }
};

// ===================== Payments by method =====================
function pmList() {
  var P = S.pm, out = [];
  var key = P.mode === 'year' ? String(P.y) : P.y + '-' + (P.m < 9 ? '0' : '') + (P.m + 1);
  S.data.bookings.forEach(function (b) {
    b.payments.forEach(function (p) {
      if (p.at.slice(0, key.length) === key) out.push({ at: p.at, ref: b.ref, guest: lead(b), method: p.method, amount: p.amount, refno: p.reference_no, by: p.by, type: p.type });
    });
  });
  return out.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
}
function paymentsHtml() {
  var P = S.pm, all = pmList(), total = 0, by = {}, staff = {};
  var methods = { 'GCash': { n: 0, sum: 0 }, 'Bank transfer': { n: 0, sum: 0 } };
  all.forEach(function (p) {
    total += p.amount;
    methods[p.method] = methods[p.method] || { n: 0, sum: 0 }; methods[p.method].n++; methods[p.method].sum += p.amount;
    staff[p.by] = staff[p.by] || { n: 0, sum: 0 }; staff[p.by].n++; staff[p.by].sum += p.amount;
  });
  var label = P.mode === 'year' ? String(P.y) : MONTHS[P.m] + ' ' + P.y;
  var list = all.filter(function (p) { return P.method === 'all' || p.method === P.method; });
  var max = Math.max(1, total);
  var mrows = Object.keys(methods).map(function (k) {
    var v = methods[k], pct = total ? Math.round(v.sum / total * 100) : 0;
    return '<div class="pmrow"><b>' + esc(k) + '</b><b>' + peso(v.sum) + '</b><small>' + plural(v.n, 'payment') + '</small><small>' + pct + '%</small><div class="ckbar"><i style="width:' + Math.round(v.sum / max * 100) + '%"></i></div></div>';
  }).join('');
  var srows = Object.keys(staff).sort(function (a, b) { return staff[b].sum - staff[a].sum; }).map(function (k) {
    return '<div class="row"><span><b>' + esc(adName(k)) + '</b> <small style="color:var(--muted)">' + plural(staff[k].n, 'payment') + '</small></span><span>' + peso(staff[k].sum) + '</span></div>';
  }).join('');
  var rows = list.map(function (p) {
    return '<tr class="rowb" data-open="' + esc(p.ref) + '" tabindex="0"><td>' + whenS(p.at) + '</td><td class="ref">' + esc(p.ref) + '</td><td>' + esc(p.guest) + '</td><td>' + esc(p.method) + '</td><td>' + esc(p.refno || '—') + '</td><td>' + esc(adName(p.by)) + '</td><td class="num"><b>' + peso(p.amount) + '</b></td></tr>';
  }).join('');
  return '<div class="hello"><div><h1>Payments</h1><p>Every payment staff recorded — GCash or bank transfer, deposits included.</p></div></div>' +
    '<section class="panel"><div class="adtop"><div class="tabs">' +
    '<button type="button" class="sortb" data-pmmode="month" aria-pressed="' + (P.mode === 'month') + '">Month</button><button type="button" class="sortb" data-pmmode="year" aria-pressed="' + (P.mode === 'year') + '">Year</button></div>' +
    '<div class="mnav"><button type="button" class="round" data-pmstep="-1" aria-label="Previous">‹</button><b>' + label + '</b><button type="button" class="round" data-pmstep="1" aria-label="Next">›</button></div>' +
    (typeof exportCsv === 'function' ? '<button type="button" class="pill line sm" data-pmcsv="1">Export payments (CSV)</button>' : '') + '</div></section>' +
    '<div class="stats"><div class="stat"><div class="k">Collected</div><div class="v">' + peso(total) + '</div><div class="s">' + plural(all.length, 'payment') + ' · ' + esc(label) + '</div></div>' +
    '<div class="stat"><div class="k">GCash</div><div class="v">' + peso(methods['GCash'].sum) + '</div><div class="s">' + plural(methods['GCash'].n, 'payment') + '</div></div>' +
    '<div class="stat"><div class="k">Bank transfer</div><div class="v">' + peso(methods['Bank transfer'].sum) + '</div><div class="s">' + plural(methods['Bank transfer'].n, 'payment') + '</div></div>' +
    '<div class="stat"><div class="k">Average</div><div class="v">' + peso(all.length ? total / all.length : 0) + '</div><div class="s">per payment</div></div></div>' +
    '<div class="twocol" style="margin-top:0"><section class="panel"><h2 class="ph" style="margin-bottom:14px">By method</h2>' + mrows + '</section>' +
    '<section class="panel"><h2 class="ph" style="margin-bottom:10px">Recorded by</h2>' + (srows || '<p class="empty" style="padding:10px 0">No payments yet.</p>') + '</section></div>' +
    '<section class="panel"><div class="adtop"><h2 class="ph">All payments · ' + esc(label) + '</h2><div class="tabs">' +
    [['all', 'All'], ['GCash', 'GCash'], ['Bank transfer', 'Bank transfer']].map(function (t) {
      return '<button type="button" class="sortb" data-pmmethod="' + t[0] + '" aria-pressed="' + (P.method === t[0]) + '">' + t[1] + '</button>';
    }).join('') + '</div></div>' +
    (rows ? '<div class="tscroll" style="margin-top:10px"><table><thead><tr><th>Date</th><th>Ref</th><th>Guest</th><th>Method</th><th>Reference no.</th><th>Recorded by</th><th class="num">Amount</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="hint">Tap a payment to open its booking.</p>'
      : '<p class="empty">No payments for ' + esc(label) + '.</p>') + '</section>';
}

PAGES.payments = {
  label: 'Payments', show: isFinance, html: paymentsHtml,
  enter: function () { if (!S.pm) { var t = new Date(Date.now() + PH); S.pm = { mode: 'month', y: t.getUTCFullYear(), m: t.getUTCMonth(), method: 'all' }; } },
  click: function (e) {
    if (S.page !== 'payments') return false;
    var el = e.target.closest('[data-pmmode],[data-pmstep],[data-pmmethod],[data-pmcsv]');
    if (!el) return false;
    var d = el.dataset, P = S.pm;
    if (d.pmmode) P.mode = d.pmmode;
    if (d.pmmethod) P.method = d.pmmethod;
    if (d.pmstep) {
      if (P.mode === 'year') P.y += +d.pmstep;
      else { P.m += +d.pmstep; if (P.m < 0) { P.m = 11; P.y--; } if (P.m > 11) { P.m = 0; P.y++; } }
    }
    if (d.pmcsv) { S.rmode = P.mode; S.ry = P.y; S.rm = P.m; exportCsv('ledger'); return true; }
    render(); return true;
  }
};

// ===================== Recent activity =====================
var AD_KINDS = [['all', 'Everything'], ['signin', 'Time in & out'], ['bookings', 'Bookings'], ['payments', 'Payments'], ['unit', 'Checklist & upkeep'], ['gaf', 'GAF letters'], ['people', 'Users & reviews']];
function adKind(a) {
  return { staffLogin: 'signin', staffLogout: 'signin', createBooking: 'bookings', setStatus: 'bookings', extend: 'bookings', addPast: 'bookings', recordPayment: 'payments', depositRefund: 'payments',
    checklist: 'unit', upkeep: 'unit', gaf: 'gaf', staff: 'people', review: 'people' }[a.action] || 'other';
}
function adText(a) {
  if (a.action === 'staffLogin') return 'signed in' + (a.details === 'kept signed in' ? ' (kept signed in)' : '');
  if (a.action === 'staffLogout') return 'signed out';
  if (a.action === 'gaf') return a.details === 'signature changed' ? 'changed the GAF signature' : 'sent the GAF for ' + a.ref + (a.details ? ' · ' + a.details.replace(/^sent /, '') : '');
  return typeof ovActivity === 'function' ? ovActivity(a) : a.action + ' ' + a.ref;
}
function adShifts(list) {   // pairs each sign-in with the sign-out that follows it
  var asc = list.filter(function (a) { return a.action === 'staffLogin' || a.action === 'staffLogout'; }).slice().reverse(), open = {}, out = [];
  asc.forEach(function (a) {
    if (a.action === 'staffLogin') {
      if (open[a.email]) out.push(open[a.email]);
      open[a.email] = { email: a.email, inAt: a.at, outAt: '' };
    } else if (open[a.email]) { open[a.email].outAt = a.at; out.push(open[a.email]); delete open[a.email]; }
    else out.push({ email: a.email, inAt: '', outAt: a.at });
  });
  Object.keys(open).forEach(function (k) { out.push(open[k]); });
  return out.sort(function (x, y) { return (y.inAt || y.outAt) < (x.inAt || x.outAt) ? -1 : 1; });
}
function activityHtml() {
  var F = S.af, A = S.act;
  var people = (S.data.staff || []).map(function (s) { return s.email; });
  var cut = F.days ? Date.now() - F.days * 24 * HOUR : 0;
  if (F.days === 1) cut = ms(new Date(Date.now() + PH).toISOString().slice(0, 10) + 'T00:00');
  var inRange = function (v) { return v && (!cut || ms(v) >= cut); };
  var log = '', shifts = '';
  if (A) {
    var lastDay = '';
    log = A.activity.filter(function (a) {
      return inRange(a.at) && (F.kind === 'all' || adKind(a) === F.kind) && (F.who === 'all' || a.email === F.who);
    }).slice(0, 250).map(function (a) {
      var day = adDay(a.at), head = day !== lastDay ? '<div class="daygrp">' + esc(day) + '</div>' : '';
      lastDay = day;
      var tag = a.action === 'staffLogin' ? '<span class="inout">IN</span>' : a.action === 'staffLogout' ? '<span class="inout out">OUT</span>' : '';
      return head + '<div class="actrow"><span>' + adTime(a.at) + '</span><span>' + tag + '<b>' + esc(a.action === 'createBooking' ? 'Guest' : adName(a.email)) + '</b> ' + esc(adText(a)) + '</span></div>';
    }).join('');
    shifts = adShifts(A.activity).filter(function (s) { return (F.who === 'all' || s.email === F.who) && inRange(s.inAt || s.outAt); }).slice(0, 80).map(function (s) {
      return '<tr><td><b>' + esc(adName(s.email)) + '</b></td><td>' + (s.inAt ? whenS(s.inAt) : '—') + '</td><td>' + (s.outAt ? whenS(s.outAt) : '<small style="color:var(--muted)">Not signed out yet</small>') + '</td><td>' + (s.inAt && s.outAt ? adLen(s.inAt, s.outAt) : '—') + '</td></tr>';
    }).join('');
  }
  return '<div class="hello"><div><h1>Recent activity</h1><p>Everything staff do, with the time they sign in and sign out.</p></div><button type="button" class="pill ghost sm" data-act="adrefresh">↻ Refresh</button></div>' +
    (S.error ? '<div class="err" role="alert">' + esc(S.error) + '</div>' : '') +
    '<section class="panel"><h2 class="ph">Time in &amp; out</h2>' +
    (A ? (shifts ? '<div class="tscroll" style="margin-top:12px"><table><thead><tr><th>Name</th><th>Signed in</th><th>Signed out</th><th>How long</th></tr></thead><tbody>' + shifts + '</tbody></table></div>' : '<p class="empty">No sign-ins in this period.</p>') : '<div class="loading" style="padding:20px"><div class="spin"></div>Loading…</div>') +
    '<p class="hint">Sign-out times show from now on. If someone closes the portal without tapping Log out, it says "Not signed out yet".</p></section>' +
    '<section class="panel"><h2 class="ph">Activity log</h2>' +
    '<div class="afil"><label class="sr" for="af_who">Person</label><select class="inp" id="af_who"><option value="all">Everyone</option>' +
    people.map(function (e) { return '<option value="' + esc(e) + '"' + (F.who === e ? ' selected' : '') + '>' + esc(adName(e)) + '</option>'; }).join('') + '</select>' +
    [[1, 'Today'], [7, '7 days'], [30, '30 days'], [0, 'All']].map(function (t) { return '<button type="button" class="sortb" data-afdays="' + t[0] + '" aria-pressed="' + (F.days === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
    '<div class="afil">' + AD_KINDS.map(function (k) { return '<button type="button" class="sortb" data-afkind="' + k[0] + '" aria-pressed="' + (F.kind === k[0]) + '">' + k[1] + '</button>'; }).join('') + '</div>' +
    (!A ? '<div class="loading" style="padding:20px"><div class="spin"></div>Loading the log…</div>' : log || '<p class="empty">Nothing in this period.</p>') + '</section>';
}
function loadAct() { post({ action: 'staffActivity' }).then(function (d) { S.act = d; if (S.page === 'activity') render(); }).catch(fail); }

PAGES.activity = {
  show: function () { return false; }, menu: isFinance, html: activityHtml,
  enter: function () { S.error = ''; if (!S.af) S.af = { who: 'all', kind: 'all', days: 7 }; loadAct(); },
  click: function (e) {
    if (S.page !== 'activity') return false;
    var el = e.target.closest('[data-afdays],[data-afkind],[data-act="adrefresh"]');
    if (!el) return false;
    if (el.dataset.act === 'adrefresh') { S.act = null; render(); loadAct(); return true; }
    if (el.dataset.afdays != null) S.af.days = +el.dataset.afdays;
    if (el.dataset.afkind) S.af.kind = el.dataset.afkind;
    render(); return true;
  },
  change: function (e) {
    if (e.target.id !== 'af_who') return false;
    S.af.who = e.target.value; e.target.blur(); render(); return true;
  }
};