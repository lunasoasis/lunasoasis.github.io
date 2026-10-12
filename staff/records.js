/* Luna's Oasis — staff portal: Records & earnings page (admin & co-admin). */
'use strict';
function inPeriod(v, mode, y, m) {
  if (!v) return false;
  var yy = +v.slice(0, 4), mm = +v.slice(5, 7) - 1;
  return mode === 'year' ? yy === y : yy === y && mm === m;
}
function money(b) {   // what a booking means for earnings (deposit is never income)
  var stay = b.total - b.deposit, dep = b.deposit_info || {};
  var paidStay = Math.min(b.paid_total, stay);
  var held = !dep.refunded_at ? Math.min(b.deposit, Math.max(0, b.paid_total - stay)) : 0;
  return { stay: stay, paidStay: paidStay, kept: dep.refunded_at ? (dep.deduction || 0) : 0, toCollect: Math.max(0, stay - b.paid_total), held: held };
}
function periodStats(mode, y, m) {
  var bs = S.data.bookings.filter(function (b) { return active(b) && inPeriod(b.check_in, mode, y, m); });
  var t = { list: bs, count: bs.length, booked: 0, earn: 0, toCollect: 0, bal: 0, balCount: 0, paidCount: 0, held: 0, heldCount: 0, ret: 0, retCount: 0 };
  bs.forEach(function (b) {
    var x = money(b);
    t.booked += x.stay; t.earn += x.paidStay + x.kept; t.toCollect += x.toCollect;
    if (b.balance > 0) { t.bal += b.balance; t.balCount++; } else t.paidCount++;
    if (x.held > 0) { t.held += x.held; t.heldCount++; }
  });
  S.data.bookings.forEach(function (b) {
    var d = b.deposit_info;
    if (d && d.refunded_at && inPeriod(d.refunded_at, mode, y, m)) { t.ret += d.refunded_amount; t.retCount++; }
  });
  return t;
}
function ledger(mode, y, m) {
  var out = [];
  S.data.bookings.forEach(function (b) {
    b.payments.forEach(function (p) {
      if (inPeriod(p.at, mode, y, m)) out.push({ at: p.at, ref: b.ref, guest: lead(b), type: 'Payment', method: p.method, amount: p.amount, refno: p.reference_no, by: p.by });
    });
    var d = b.deposit_info;
    if (d && d.refunded_at && inPeriod(d.refunded_at, mode, y, m)) out.push({ at: d.refunded_at, ref: b.ref, guest: lead(b), type: 'Deposit returned', method: d.refund_method, amount: -d.refunded_amount, refno: '', by: d.handled_by });
  });
  return out.sort(function (a, b) { return ms(b.at) - ms(a.at); });
}
function pastPreview() {
  var P = S.past, st = S.data.settings, r = (st.rates || []).filter(function (x) { return x.package === P.pkg; })[0];
  if (!r) return { ok: false, text: 'Choose a package.' };
  var nightly = r.hours >= 20, n = nightly ? Math.max(1, +P.nights || 1) : 0, base = +P.pax > 2 ? r.rate_3_4_pax : r.rate_1_2_pax;
  var stay = 0, disc = 0;
  for (var i = 0; i < Math.max(1, n); i++) {
    var day = P.date ? new Date(ms(P.date + 'T00:00') + PH + i * 24 * HOUR).toISOString().slice(0, 10) : '';
    var pr = (st.promos || []).filter(function (p) { return day && p.start_date <= day && day <= p.end_date; })[0];
    stay += base; disc += pr ? Math.round(base * pr.percent_off / 100) : 0;
  }
  var stayHrs = n > 1 ? (n - 1) * (24 - r.hours) : 0;
  var total = stay - disc + (stayHrs + (+P.extra || 0)) * st.extra_hour_rate;
  var endMs = P.date ? ms(P.date + 'T' + (P.time || '00:00')) + ((nightly ? 24 * (n - 1) + r.hours : r.hours) + (+P.extra || 0)) * HOUR : 0;
  if (!P.name.trim()) return { ok: false, total: total, text: 'Enter the guest\'s name.' };
  if (!P.date) return { ok: false, total: total, text: 'Enter the check-in date.' };
  if (endMs > Date.now()) return { ok: false, total: total, text: 'That stay is not over yet. Use the booking page for current and future stays.' };
  var amt = P.amount === '' ? total : +P.amount;
  return { ok: true, total: total, amt: amt, text: r.hours + ' hrs' + (n > 1 ? ' × ' + n + ' nights' : '') + ' · ' + (+P.pax > 2 ? 4 : 2) + ' pax' + (+P.extra ? ' + ' + P.extra + ' extra hr' : '') + (disc ? ' · promo rate' : '') + ' — adds ' + peso(amt) + ' to earnings' };
}

function recordsHtml() {
  if (!isFinance()) {
    return '<div class="hello"><div><h1>Records &amp; earnings</h1><p>For the finance team only.</p></div></div>' +
      '<section class="panel"><p style="margin:0">Records &amp; earnings are handled by the admin and co-admin. You can still record payments from <b>Bookings</b>.</p></section>';
  }
  var mode = S.rmode, y = S.ry, m = S.rm, MONS = MONTHS;
  var short = mode === 'year' ? String(y) : MONS[m].slice(0, 3) + ' ' + y;
  var t = periodStats(mode, y, m);
  var py = mode === 'year' ? y - 1 : (m === 0 ? y - 1 : y), pm = m === 0 ? 11 : m - 1;
  var prev = periodStats(mode, py, pm).count;
  // year chart
  var yearEarn = MONS.map(function (_, i) { return periodStats('month', y, i).earn; });
  var yMax = Math.max.apply(null, [1].concat(yearEarn)), best = yearEarn.indexOf(Math.max.apply(null, yearEarn));
  var bars = yearEarn.map(function (v, i) {
    return '<button type="button" class="bar" data-rmonth="' + i + '" aria-label="' + MONS[i] + ' ' + peso(v) + '"' + (mode === 'month' && m === i ? ' aria-current="true"' : '') + '>' +
      '<span class="bv">' + (v ? '₱' + (v / 1000).toFixed(1) + 'k' : '') + '</span>' +
      '<span class="bb" style="height:' + Math.max(v ? 4 : 2, Math.round(v / yMax * 150)) + 'px;background:' + (i === best && v ? '#A8834A' : '#4F7A63') + ';opacity:' + (v ? 1 : .25) + '"></span>' +
      '<span class="bl">' + MONS[i].slice(0, 3) + '</span></button>';
  }).join('');
  // breakdown
  var rows = [];
  (S.data.settings.rates || []).forEach(function (r) {
    [2, 4].forEach(function (tier) {
      var g = t.list.filter(function (b) { return b.package === r.package && (b.pax > 2 ? 4 : 2) === tier; });
      rows.push([r.hours + ' hrs · ' + tier + ' pax', '(' + g.length + ')', g.reduce(function (a, b) { return a + b.stay_rate; }, 0)]);
    });
  });
  var extH = t.list.reduce(function (a, b) { return a + b.extra_hours; }, 0);
  rows.push(['Extra & stay-over hours', '(' + extH + ' hrs × ' + peso(S.data.settings.extra_hour_rate) + ')', t.list.reduce(function (a, b) { return a + b.extras_total; }, 0)]);
  var disc = t.list.reduce(function (a, b) { return a + b.discount; }, 0);
  if (disc) rows.push(['Promo discounts', '', -disc]);
  var led = ledger(mode, y, m);
  var methods = ['GCash', 'Bank transfer'].map(function (k) { return [k, led.filter(function (l) { return l.type === 'Payment' && l.method === k; }).reduce(function (a, l) { return a + l.amount; }, 0)]; });
  var mMax = Math.max(1, methods[0][1], methods[1][1]);
  var byStaff = {};
  led.filter(function (l) { return l.type === 'Payment'; }).forEach(function (l) { var k = staffName(l.by); byStaff[k] = byStaff[k] || [0, 0]; byStaff[k][0]++; byStaff[k][1] += l.amount; });
  // table
  var F = {
    all: function () { return true; },
    unpaid: function (b) { return b.balance > 0; },
    hold: function (b) { return b.balance <= 0 && money(b).held > 0; },
    done: function (b) { return b.balance <= 0 && b.deposit_info && b.deposit_info.refunded_at; }
  };
  var filters = [['all', 'All'], ['unpaid', 'Unpaid balance'], ['hold', 'Deposit on hold'], ['done', 'Complete']].map(function (f) {
    return '<button type="button" class="tab" data-rfilter="' + f[0] + '" aria-pressed="' + (S.rfilter === f[0]) + '">' + f[1] + '<span class="n">' + t.list.filter(F[f[0]]).length + '</span></button>';
  }).join('');
  var tl = t.list.filter(F[S.rfilter]).sort(function (a, b) { return ms(a.check_in) - ms(b.check_in); });
  var depText = function (b) { var d = b.deposit_info; return d && d.refunded_at ? 'Returned' : money(b).held > 0 ? 'On hold' : 'Not paid'; };
  var trs = tl.map(function (b) {
    return '<tr class="rowb" data-open="' + esc(b.ref) + '" tabindex="0"><td class="ref">' + esc(b.ref) + '</td><td>' + esc(lead(b)) + '</td><td>' + when(b.check_in) + '</td>' +
      '<td>' + (b.nights ? b.nights + 'n' : b.package) + ' · ' + b.pax + ' pax</td><td class="num">' + peso(b.total) + '</td><td class="num">' + peso(b.paid_total) + '</td>' +
      '<td class="num ' + (b.balance > 0 ? 'bal' : 'paid') + '">' + (b.balance > 0 ? peso(b.balance) : 'Paid') + '</td><td>' + depText(b) + '</td></tr>';
  }).join('');
  var tcards = tl.map(function (b) {
    return '<button type="button" class="card" data-open="' + esc(b.ref) + '"><div class="l1"><span class="ref">' + esc(b.ref) + '</span><span>' + peso(b.total) + '</span></div>' +
      '<div class="l2">' + esc(lead(b)) + ' · ' + when(b.check_in) + '</div>' +
      '<div class="l3"><span>Deposit: ' + depText(b) + '</span><span class="' + (b.balance > 0 ? 'bal' : 'paid') + '">' + (b.balance > 0 ? peso(b.balance) + ' due' : 'Paid') + '</span></div></button>';
  }).join('');
  var ledHtml = led.slice(0, 60).map(function (l) {
    return '<div class="row"><span><b>' + esc(l.ref) + '</b> · ' + esc(l.type) + '<br><small style="color:var(--muted)">' + when(l.at) + ' · ' + esc(l.method) + ' · by ' + esc(staffName(l.by)) + '</small></span><span class="' + (l.amount < 0 ? 'bal' : '') + '">' + (l.amount < 0 ? '−' : '') + peso(Math.abs(l.amount)) + '</span></div>';
  }).join('');
  var P = S.past, pv = pastPreview();
  var years = {}; years[new Date(Date.now() + PH).getUTCFullYear()] = 1;
  S.data.bookings.forEach(function (b) { if (b.check_in) years[+b.check_in.slice(0, 4)] = 1; });
  var yearOpts = Object.keys(years).sort().map(function (k) { return '<option value="' + k + '"' + (+k === y ? ' selected' : '') + '>' + k + '</option>'; }).join('');
  var monthOpts = MONS.map(function (n, i) { return '<option value="' + i + '"' + (i === m ? ' selected' : '') + '>' + n + '</option>'; }).join('');
  var pkgOpts = (S.data.settings.rates || []).map(function (r) { return '<option value="' + esc(r.package) + '"' + (P.pkg === r.package ? ' selected' : '') + '>' + r.hours + ' hours</option>'; }).join('');
  var nightly = ((S.data.settings.rates || []).filter(function (r) { return r.package === P.pkg; })[0] || {}).hours >= 20;

  return '<div class="hello"><div><h1>Records &amp; earnings</h1><p>Every booking, every peso, every deposit — in one place.</p></div>' +
    '<button type="button" class="pill ghost sm" data-act="refresh">↻ Refresh</button></div>' +
    (S.error ? '<div class="err" role="alert" style="margin-bottom:12px">' + esc(S.error) + '</div>' : '') +
    (S.rmsg ? '<div class="okmsg" role="status" style="margin-bottom:12px">' + esc(S.rmsg) + '</div>' : '') +
    '<section class="panel"><div class="tools">' +
    '<div class="tabs"><button type="button" class="tab" data-rmode="month" aria-pressed="' + (mode === 'month') + '">Month</button><button type="button" class="tab" data-rmode="year" aria-pressed="' + (mode === 'year') + '">Year</button>' +
    (mode === 'month' ? '<label class="sr" for="rmsel">Month</label><select class="inp sel" id="rmsel">' + monthOpts + '</select>' : '') +
    '<label class="sr" for="rysel">Year</label><select class="inp sel" id="rysel">' + yearOpts + '</select></div>' +
    '<div class="tabs"><span class="xl">Export for Google Sheets</span><button type="button" class="pill line sm" data-csv="bookings">Bookings CSV</button><button type="button" class="pill line sm" data-csv="ledger">Payments ledger CSV</button><button type="button" class="pill line sm" data-csv="summary">Earnings summary CSV</button></div>' +
    '</div>' +
    '<div class="kpis">' +
    '<div class="kpi big2"><small>Earnings · ' + esc(short) + '</small><b>' + peso(t.earn) + '</b><span>Collected stay payments</span></div>' +
    '<div class="kpi"><small>Bookings</small><b>' + t.count + '</b><span>' + (mode === 'year' ? py : MONS[pm].slice(0, 3)) + ': ' + prev + ' · all-time ' + S.data.bookings.filter(active).length + '</span></div>' +
    '<div class="kpi"><small>Fully paid</small><b>' + t.paidCount + '</b><span>of ' + plural(t.count, 'booking') + '</span></div>' +
    '<div class="kpi"><small>Unpaid balances</small><b class="' + (t.bal ? 'bal' : '') + '">' + peso(t.bal) + '</b><span>' + plural(t.balCount, 'booking') + '</span></div>' +
    '<div class="kpi"><small>Deposits on hold</small><b>' + peso(t.held) + '</b><span>' + plural(t.heldCount, 'guest') + ' · not income</span></div>' +
    '<div class="kpi"><small>Deposits returned</small><b>' + peso(t.ret) + '</b><span>' + plural(t.retCount, 'guest') + '</span></div>' +
    '</div></section>' +

    '<section class="panel" style="margin-top:14px"><div class="tools"><h2 class="ph">Earnings per month · ' + y + '</h2><span class="xl">Best month: <b>' + (yearEarn[best] ? MONS[best] + ' · ' + peso(yearEarn[best]) : '—') + '</b></span></div>' +
    '<div class="bars">' + bars + '</div><p class="hint">Tap a month to open its report. Earnings are counted in the month of check-in and never include deposits.</p></section>' +

    '<div class="twocol">' +
    '<section class="panel"><h2 class="ph">Earnings breakdown</h2><p class="hint" style="margin-top:0">Booked revenue for ' + esc(short) + ', by what guests paid for.</p>' +
    rows.map(function (r) { return '<div class="row"><span>' + esc(r[0]) + ' <small style="color:var(--muted)">' + esc(r[1]) + '</small></span><span' + (r[2] < 0 ? ' style="color:var(--bronze)"' : '') + '>' + (r[2] < 0 ? '−' : '') + peso(Math.abs(r[2])) + '</span></div>'; }).join('') +
    '<div class="row tot"><span>Booked revenue</span><span>' + peso(t.booked) + '</span></div>' +
    '<div class="row"><span>Collected</span><span class="paid">' + peso(t.earn) + '</span></div>' +
    '<div class="row"><span>Still to collect</span><span class="' + (t.toCollect ? 'bal' : '') + '">' + peso(t.toCollect) + '</span></div></section>' +
    '<section class="panel"><h2 class="ph">How guests paid</h2>' +
    methods.map(function (x) { return '<div class="meth"><div class="row" style="border:0;padding-bottom:2px"><span>' + x[0] + '</span><b>' + peso(x[1]) + '</b></div><div class="mbar"><span style="width:' + Math.round(x[1] / mMax * 100) + '%"></span></div></div>'; }).join('') +
    '<h3 class="label">Recorded by</h3>' +
    (Object.keys(byStaff).length ? Object.keys(byStaff).map(function (k) { return '<div class="row"><span>' + esc(k) + ' <small style="color:var(--muted)">' + byStaff[k][0] + ' payment' + (byStaff[k][0] > 1 ? 's' : '') + '</small></span><span>' + peso(byStaff[k][1]) + '</span></div>'; }).join('') : '<p class="hint">No payments recorded yet.</p>') +
    '<p class="hint">Payments include the ₱' + S.data.settings.deposit.toLocaleString('en-PH') + ' deposit when guests pay it.</p></section>' +
    '</div>' +

    '<section class="panel" style="margin-top:14px"><div class="tools"><h2 class="ph">All bookings · ' + esc(short) + '</h2><div class="tabs">' + filters + '</div></div>' +
    (tl.length ? '<table><thead><tr><th>Ref</th><th>Guest</th><th>Check-in</th><th>Stay</th><th class="num">Total</th><th class="num">Paid</th><th class="num">Balance</th><th>Deposit</th></tr></thead><tbody>' + trs + '</tbody></table><div class="cards">' + tcards + '</div>'
      : '<div class="empty">No bookings match this filter for ' + esc(short) + '.</div>') +
    '<p class="hint">Tap a booking to record a payment or return the deposit.</p></section>' +

    '<div class="twocol">' +
    '<section class="panel"><h2 class="ph">Payments ledger</h2><p class="hint" style="margin-top:0">Newest first.</p>' + (ledHtml || '<p class="hint">Nothing recorded for ' + esc(short) + '.</p>') + '</section>' +
    '<section class="panel"><h2 class="ph">Add a past booking</h2><p class="hint" style="margin-top:0">For guests who stayed before the website. Their payment then counts in earnings.</p>' +
    '<label class="label" for="pn">Guest name</label><input class="inp" id="pn" value="' + esc(P.name) + '">' +
    '<div class="two"><div><label class="label" for="pd">Check-in date</label><input class="inp" id="pd" type="date" value="' + esc(P.date) + '"></div>' +
    '<div><label class="label" for="pt">Time-in</label><input class="inp" id="pt" type="time" step="1800" value="' + esc(P.time) + '"></div></div>' +
    '<div class="two"><div><label class="label" for="ppk">Package</label><select class="inp" id="ppk">' + pkgOpts + '</select></div>' +
    '<div><label class="label" for="ppx">Pax</label><select class="inp" id="ppx"><option value="2"' + (+P.pax <= 2 ? ' selected' : '') + '>2 pax</option><option value="4"' + (+P.pax > 2 ? ' selected' : '') + '>4 pax</option></select></div></div>' +
    '<div class="two">' + (nightly ? '<div><label class="label" for="pnt">Nights</label><input class="inp" id="pnt" type="number" min="1" max="30" value="' + esc(P.nights) + '"></div>' : '') +
    '<div><label class="label" for="pex">Extra hours</label><input class="inp" id="pex" type="number" min="0" max="12" value="' + esc(P.extra) + '"></div></div>' +
    '<div class="two"><div><label class="label" for="pam">Amount paid for the stay (₱)</label><input class="inp" id="pam" type="number" min="0" placeholder="' + (pv.total || '') + '" value="' + esc(P.amount) + '"></div>' +
    '<div><span class="label">Paid by</span><div class="seg">' + ['GCash', 'Bank transfer'].map(function (k) { return '<button type="button" data-pastm="' + k + '" aria-pressed="' + (P.method === k) + '">' + k + '</button>'; }).join('') + '</div></div></div>' +
    '<label class="check"><input type="checkbox" id="pdb"' + (P.depBack ? ' checked' : '') + '> ' + peso(S.data.settings.deposit) + ' deposit was already returned</label>' +
    '<p class="hint" id="pprev" style="' + (pv.ok ? 'color:var(--ok)' : '') + '">' + esc(pv.text) + '</p>' +
    '<button type="button" class="pill gold sm" data-act="addpast"' + (S.busy ? ' disabled' : '') + '>Add to records</button></section>' +
    '</div>';
}
function downloadCsv(name, rows) {
  var text = rows.map(function (r) { return r.map(function (v) { var s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(','); }).join('\n');
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function exportCsv(kind) {
  var mode = S.rmode, y = S.ry, m = S.rm, stamp = mode === 'year' ? String(y) : y + '-' + (m < 9 ? '0' : '') + (m + 1);
  var dt = function (v) { return v ? v.replace('T', ' ') : ''; };
  if (kind === 'bookings') {
    var bs = S.data.bookings.filter(function (b) { return inPeriod(b.check_in, mode, y, m); }).sort(function (a, b) { return ms(a.check_in) - ms(b.check_in); });
    downloadCsv('LunasOasis_Bookings_' + stamp + '.csv', [['ref', 'status', 'guest', 'gmail', 'pax', 'package', 'nights', 'extra_hours', 'check_in', 'check_out', 'stay_rate', 'discount', 'extras_total', 'deposit', 'total', 'paid', 'balance', 'deposit_status', 'source']]
      .concat(bs.map(function (b) { var d = b.deposit_info; return [b.ref, b.status, lead(b), b.guest_email, b.pax, b.package, b.nights || '', b.extra_hours, dt(b.check_in), dt(b.check_out), b.stay_rate, b.discount, b.extras_total, b.deposit, b.total, b.paid_total, b.balance, d && d.refunded_at ? 'Returned' : money(b).held > 0 ? 'On hold' : 'Not paid', b.source]; })));
  } else if (kind === 'ledger') {
    downloadCsv('LunasOasis_Payments_' + stamp + '.csv', [['date', 'ref', 'guest', 'type', 'method', 'amount', 'reference_no', 'recorded_by']]
      .concat(ledger(mode, y, m).map(function (l) { return [dt(l.at), l.ref, l.guest, l.type, l.method, l.amount, l.refno, staffName(l.by)]; })));
  } else {
    var rows = [['period', 'bookings', 'booked_revenue', 'collected', 'still_to_collect', 'unpaid_balances', 'deposits_on_hold', 'deposits_returned']];
    var months = mode === 'year' ? MONTHS.map(function (_, i) { return i; }) : [m];
    months.forEach(function (i) { var t = periodStats('month', y, i); rows.push([MONTHS[i] + ' ' + y, t.count, t.booked, t.earn, t.toCollect, t.bal, t.held, t.ret]); });
    if (mode === 'year') { var t = periodStats('year', y, 0); rows.push(['Total ' + y, t.count, t.booked, t.earn, t.toCollect, t.bal, t.held, t.ret]); }
    downloadCsv('LunasOasis_Earnings_' + stamp + '.csv', rows);
  }
}

PAGES.records = {
  order: 3, label: 'Records', show: isFinance, html: recordsHtml,
  enter: function () { S.rmsg = ''; },
  click: function (e) {
    var el = e.target.closest('[data-rmode],[data-rmonth],[data-rfilter],[data-csv],[data-pastm],[data-act="addpast"]');
    if (!el || el.disabled) return false;
    var d = el.dataset;
    if (d.rmode) { S.rmode = d.rmode; render(); return true; }
    if (d.rmonth != null) { S.rmode = 'month'; S.rm = +d.rmonth; render(); return true; }
    if (d.rfilter) { S.rfilter = d.rfilter; render(); return true; }
    if (d.csv) { exportCsv(d.csv); return true; }
    if (d.pastm) { S.past.method = d.pastm; render(); return true; }
    var pv = pastPreview();
    if (!pv.ok) { S.error = pv.text; render(); return true; }
    S.busy = true; S.error = ''; S.rmsg = ''; render();
    post({ action: 'staffAddPast', guest_name: S.past.name.trim(), check_in: S.past.date + 'T' + (S.past.time || '14:00'), package: S.past.pkg, pax: +S.past.pax, nights: +S.past.nights || 1,
      extra_hours: +S.past.extra || 0, amount_paid: pv.amt, method: S.past.method, deposit_returned: S.past.depBack }).then(function (dd) {
      S.busy = false; S.data = dd; S.rmsg = S.past.name.trim() + ' added as ' + dd.added + ' — ' + peso(pv.amt) + ' now counts in earnings.';
      S.rmode = 'month'; S.ry = +S.past.date.slice(0, 4); S.rm = +S.past.date.slice(5, 7) - 1;
      S.past = { name: '', date: '', time: '14:00', pkg: S.past.pkg, pax: S.past.pax, nights: 1, extra: 0, amount: '', method: S.past.method, depBack: true };
      render(); window.scrollTo(0, 0);
    }).catch(fail);
    return true;
  },
  input: function (e) {
    var pmap = { pn: 'name', pd: 'date', pt: 'time', pnt: 'nights', pex: 'extra', pam: 'amount' };
    if (!pmap[e.target.id]) return false;
    S.past[pmap[e.target.id]] = e.target.value;
    var pv = pastPreview(), el = document.getElementById('pprev');
    if (el) { el.textContent = pv.text; el.style.color = pv.ok ? 'var(--ok)' : ''; }
    var am = document.getElementById('pam'); if (am && pv.total) am.placeholder = pv.total;
    return true;
  },
  change: function (e) {
    var id = e.target.id;
    if (id === 'rmsel') { S.rm = +e.target.value; render(); return true; }
    if (id === 'rysel') { S.ry = +e.target.value; render(); return true; }
    if (id === 'ppk') { S.past.pkg = e.target.value; render(); return true; }
    if (id === 'ppx') { S.past.pax = +e.target.value; render(); return true; }
    if (id === 'pdb') { S.past.depBack = e.target.checked; return true; }
    return false;
  }
};