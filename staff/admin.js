/* Luna's Oasis — staff portal: admin screens opened from the profile (cat) menu.
   · Payments by method
   · Activity & who's online (live) */
'use strict';

(function () {   // styles for these two screens
  var css =
    '.adtop{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px}' +
    '.mnav{display:flex;align-items:center;gap:8px}.mnav b{font-family:"Cormorant Garamond",serif;font-size:24px;font-weight:600;min-width:170px;text-align:center}' +
    '.pmrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:center;margin-bottom:14px}' +
    '.pmrow .ckbar{grid-column:1 / -1;margin:0}.pmrow small{color:var(--muted);font-size:12.5px}' +
    '.who{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:10px}' +
    '.whoc{display:flex;gap:12px;align-items:center;border:1px solid var(--line);border-radius:16px;padding:12px 14px;background:var(--paper);min-width:0}' +
    '.whoc.on{border-color:#4F7A63;box-shadow:0 0 0 1px #4F7A63 inset}' +
    '.whoc .av{position:relative;flex:none;line-height:0}.whoc .av i{position:absolute;right:0;bottom:0;width:13px;height:13px;border-radius:50%;border:2px solid var(--paper);background:#B9AE9F}' +
    '.whoc.on .av i{background:#3FA36B;animation:livep 1.6s ease-in-out infinite}' +
    '@keyframes livep{50%{box-shadow:0 0 0 5px rgba(63,163,107,.18)}}' +
    '.whoc b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.whoc span{display:block;font-size:13px;color:var(--muted)}.whoc .st2{color:#2F5A47;font-weight:600}' +
    '.daygrp{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--bronze);margin:16px 0 2px}' +
    '.afil{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0 4px}.afil select{width:auto;min-height:40px;background:var(--paper)}' +
    '.kick::after{content:"  ● LIVE";color:#7FCFA8;letter-spacing:.14em}' +
    '.pill[data-act$="refresh"]{display:none}' +
    '@media (max-width:760px){.mnav b{font-size:20px;min-width:0}.whoc{padding:10px}.afil .sortb{min-height:36px;padding:0 12px;font-size:12.5px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

// Extra buttons in the cat menu (core.js calls this).
function menuExtra() {
  if (!isFinance()) return '';
  return '<div class="mk">Admin</div>' +
    '<button type="button" data-page="payments"' + (S.page === 'payments' ? ' aria-current="page"' : '') + '>Payments by method</button>' +
    '<button type="button" data-page="activity"' + (S.page === 'activity' ? ' aria-current="page"' : '') + '>Activity &amp; who\'s online</button>';
}

function adName(email) {
  var p = (S.pres || []).filter(function (x) { return x.email === email; })[0];
  return p ? p.name : staffName(email);
}
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
  return '<div class="hello"><div><h1>Payments by method</h1><p>Every payment staff recorded — GCash or bank transfer, deposits included.</p></div></div>' +
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
  show: function () { return false; }, menu: isFinance, html: paymentsHtml,
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

// ===================== Activity & who's online =====================
var AD_KINDS = [['all', 'Everything'], ['bookings', 'Bookings'], ['payments', 'Payments'], ['unit', 'Checklist & upkeep'], ['gaf', 'GAF letters'], ['people', 'Users & reviews'], ['signin', 'Sign-ins']];
function adKind(a) {
  return { createBooking: 'bookings', setStatus: 'bookings', extend: 'bookings', addPast: 'bookings', recordPayment: 'payments', depositRefund: 'payments',
    checklist: 'unit', upkeep: 'unit', gaf: 'gaf', staff: 'people', review: 'people' }[a.action] || 'other';
}
function adText(a) {
  if (a.action === 'gaf') return a.details === 'signature changed' ? 'changed the GAF signature' : 'sent the GAF for ' + a.ref + (a.details ? ' · ' + a.details.replace(/^sent /, '') : '');
  return typeof ovActivity === 'function' ? ovActivity(a) : a.action + ' ' + a.ref;
}
function activityHtml() {
  var F = S.af, pres = S.pres;
  var online = pres ? pres.filter(function (p) { return p.online; }).length : 0;
  var who = pres ? pres.slice().sort(function (a, b) { return (b.online - a.online) || (a.name < b.name ? -1 : 1); }).map(function (p) {
    var line = p.online ? '<span class="st2">● Online now</span><span>since ' + adTime(p.since) + (adDay(p.since) !== 'Today' ? ' ' + adDay(p.since) : '') + (p.dev ? ' · on ' + esc(p.dev.toLowerCase()) : '') + '</span>'
      : '<span>Offline</span><span>' + (p.last_off ? 'last seen ' + adDay(p.last_off) + ', ' + adTime(p.last_off) + ' · ' + (p.last_how === 'Signed out' ? 'logged out' : 'closed the portal') : 'not seen yet') + '</span>';
    return '<div class="whoc' + (p.online ? ' on' : '') + '"><span class="av">' + catSvg(p, 44) + '<i></i></span><div style="min-width:0"><b>' + esc(p.name) + '</b>' + line + '</div></div>';
  }).join('') : '<div class="loading" style="padding:20px"><div class="spin"></div>Checking who\'s online…</div>';

  var A = S.act;
  var people = pres ? pres.map(function (p) { return p.email; }) : [];
  var events = [];
  if (A) {
    A.activity.forEach(function (a) { events.push({ at: a.at, email: a.email, kind: adKind(a), guest: a.action === 'createBooking', text: adText(a) }); });
    A.sessions.forEach(function (s) {
      events.push({ at: s.off, email: s.email, kind: 'signin', text: (s.how === 'Signed out' ? 'logged out' : 'went offline (closed the portal)') + ' · was online ' + adLen(s.on, s.off) + (s.dev ? ' on ' + s.dev.toLowerCase() : '') });
      events.push({ at: s.on, email: s.email, kind: 'signin', text: 'came online' + (s.dev ? ' on ' + s.dev.toLowerCase() : '') });
    });
    (pres || []).forEach(function (p) { if (p.online) events.push({ at: p.since, email: p.email, kind: 'signin', text: 'came online' + (p.dev ? ' on ' + p.dev.toLowerCase() : '') + ' · still online' }); });
  }
  var cut = F.days ? Date.now() - F.days * 24 * HOUR : 0;
  if (F.days === 1) { var t0 = new Date(Date.now() + PH).toISOString().slice(0, 10); cut = ms(t0 + 'T00:00'); }
  var shown = events.filter(function (ev) {
    return ev.at && (F.kind === 'all' || ev.kind === F.kind) && (F.who === 'all' || ev.email === F.who) && (!cut || ms(ev.at) >= cut);
  }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }).slice(0, 250);
  var lastDay = '', log = shown.map(function (ev) {
    var day = adDay(ev.at), head = day !== lastDay ? '<div class="daygrp">' + esc(day) + '</div>' : '';
    lastDay = day;
    return head + '<div class="actrow"><span>' + adTime(ev.at) + '</span><span><b>' + esc(ev.guest ? 'Guest' : adName(ev.email)) + '</b> ' + esc(ev.text) + '</span></div>';
  }).join('');

  var sess = A ? (pres || []).filter(function (p) { return p.online; }).map(function (p) {
    return '<tr><td><b>' + esc(p.name) + '</b></td><td>' + whenS(p.since) + '</td><td><span class="ovst">Still online</span></td><td>' + adLen(p.since, new Date(Date.now() + PH).toISOString().slice(0, 16)) + '</td><td>' + esc(p.dev || '—') + '</td></tr>';
  }).concat(A.sessions.filter(function (s) { return F.who === 'all' || s.email === F.who; }).slice(0, 60).map(function (s) {
    return '<tr><td><b>' + esc(adName(s.email)) + '</b></td><td>' + whenS(s.on) + '</td><td>' + whenS(s.off) + ' <small style="color:var(--muted)">' + (s.how === 'Signed out' ? 'logged out' : 'closed') + '</small></td><td>' + adLen(s.on, s.off) + '</td><td>' + esc(s.dev || '—') + '</td></tr>';
  })).join('') : '';

  return '<div class="hello"><div><h1>Activity &amp; who\'s online</h1><p>Everything staff do, as it happens. This page updates by itself.</p></div></div>' +
    '<section class="panel"><div class="adtop"><h2 class="ph">Who\'s online</h2><span class="hint" style="margin:0">' + (pres ? online + ' of ' + pres.length + ' online now' : '') + '</span></div>' +
    '<div class="who" style="margin-top:14px">' + who + '</div></section>' +
    '<section class="panel"><h2 class="ph">Activity log</h2>' +
    '<div class="afil"><label class="sr" for="af_who">Person</label><select class="inp" id="af_who"><option value="all">Everyone</option>' +
    people.map(function (e) { return '<option value="' + esc(e) + '"' + (F.who === e ? ' selected' : '') + '>' + esc(adName(e)) + '</option>'; }).join('') + '</select>' +
    [[1, 'Today'], [7, '7 days'], [30, '30 days'], [0, 'All']].map(function (t) { return '<button type="button" class="sortb" data-afdays="' + t[0] + '" aria-pressed="' + (F.days === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
    '<div class="afil">' + AD_KINDS.map(function (k) { return '<button type="button" class="sortb" data-afkind="' + k[0] + '" aria-pressed="' + (F.kind === k[0]) + '">' + k[1] + '</button>'; }).join('') + '</div>' +
    (!A ? '<div class="loading" style="padding:20px"><div class="spin"></div>Loading the log…</div>' : log || '<p class="empty">Nothing in this period.</p>') + '</section>' +
    '<section class="panel"><h2 class="ph" style="margin-bottom:10px">Sign-in history</h2>' +
    (sess ? '<div class="tscroll"><table><thead><tr><th>Name</th><th>Online from</th><th>Offline</th><th>How long</th><th>Device</th></tr></thead><tbody>' + sess + '</tbody></table></div>' : '<p class="empty">' + (A ? 'No sign-ins recorded yet. They start showing from now on.' : 'Loading…') + '</p>') +
    '<p class="hint">Someone counts as offline about a minute after they log out, close the portal or their phone screen turns off.</p></section>';
}
function loadAct() { post({ action: 'staffActivity' }).then(function (d) { S.act = d; if (S.page === 'activity') render(); }).catch(fail); }

PAGES.activity = {
  show: function () { return false; }, menu: isFinance, html: activityHtml,
  enter: function () {
    if (!S.af) S.af = { who: 'all', kind: 'all', days: 7 };
    loadAct();
    if (typeof liveTick === 'function') liveTick(true);
  },
  click: function (e) {
    if (S.page !== 'activity') return false;
    var el = e.target.closest('[data-afdays],[data-afkind]');
    if (!el) return false;
    if (el.dataset.afdays != null) S.af.days = +el.dataset.afdays;
    if (el.dataset.afkind) S.af.kind = el.dataset.afkind;
    render(); return true;
  },
  change: function (e) {
    if (e.target.id !== 'af_who') return false;
    S.af.who = e.target.value; e.target.blur(); render(); return true;
  }
};