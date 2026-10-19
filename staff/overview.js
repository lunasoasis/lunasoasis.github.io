/* Luna's Oasis — staff portal: admin Overview · users & reviews (follows the design). */
'use strict';

function ovStars(n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
function ovMonthKey() { var t = new Date(Date.now() + PH); return t.getUTCFullYear() + '-' + (t.getUTCMonth() < 9 ? '0' : '') + (t.getUTCMonth() + 1); }
function ovName(email) {
  var p = S.ov && S.ov.staff.filter(function (s) { return s.email === email; })[0];
  if (p) return p.name;
  var b = S.data.bookings.filter(function (x) { return x.guest_email === email; })[0];
  return b ? lead(b) : String(email || '').split('@')[0];
}
function ovActivity(a) {   // turns an AuditLog row into a short sentence
  var d = a.details, m;
  switch (a.action) {
    case 'recordPayment': m = /^(.*?) (\d+(?:\.\d+)?)/.exec(d); return 'recorded ' + (m ? peso(m[2]) + ' ' + m[1] : d) + ' payment for ' + a.ref;
    case 'setStatus': return 'changed ' + a.ref + ' · ' + d;
    case 'extend': m = /\+(\d+)/.exec(d); return 'extended ' + a.ref + (m ? ' by ' + plural(+m[1], 'hr') : '');
    case 'depositRefund': return 'returned the deposit for ' + a.ref;
    case 'addPast': return 'added past booking ' + a.ref;
    case 'checklist': return 'checked the unit after ' + a.ref + ' · ' + d;
    case 'upkeep': return /^log /.test(d) ? 'logged ' + d.slice(4) : 'removed an upkeep entry';
    case 'createBooking': return 'booked ' + a.ref + ' on the website';
    case 'staff': return ({ add: 'added ', disable: 'disabled ', enable: 'enabled ' }[d.split(' ')[0]] || 'updated ') + ovName(d.replace(/^\w+ /, ''));
    case 'review': return /^add/.test(d) ? 'added a guest review' : /published/.test(d) ? 'published a review' : /hidden/.test(d) ? 'hid a review' : /reply/.test(d) ? 'replied to a review' : 'updated a review';
    default: return a.action + (a.ref ? ' ' + a.ref : '') + (d ? ' · ' + d : '');
  }
}
function ovRoleText(r) { return r === 'admin' ? 'Admin · Owner' : r === 'coadmin' ? 'Co-admin' : 'Operator'; }
function ovAccess(r) { return r === 'operator' ? 'Bookings, checklist, announcements' : 'Full access · finances'; }

function ovStats() {
  var mk = ovMonthKey(), y = +mk.slice(0, 4), mo = +mk.slice(5) - 1;
  var mStart = Date.UTC(y, mo, 1) - PH, mEnd = Date.UTC(y, mo + 1, 1) - PH, all = (mEnd - mStart) / HOUR;
  var act = S.data.bookings.filter(active), booked = 0, paid = 0;
  act.forEach(function (b) { booked += Math.max(0, Math.min(ms(b.check_out), mEnd) - Math.max(ms(b.check_in), mStart)) / HOUR; });
  S.data.bookings.forEach(function (b) { b.payments.forEach(function (p) { if (p.at.slice(0, 7) === mk) paid += p.amount; }); });
  var pub = S.ov ? S.ov.reviews.filter(function (r) { return r.status === 'published'; }) : [];
  return {
    month: MONTHS[mo],
    count: act.filter(function (b) { return b.check_in.slice(0, 7) === mk; }).length,
    occ: Math.round(booked / all * 100), hrs: Math.round(booked), all: all, paid: paid,
    bal: act.filter(function (b) { return b.status !== 'Completed'; }).reduce(function (a, b) { return a + Math.max(0, b.balance); }, 0),
    rating: pub.length ? (pub.reduce(function (a, r) { return a + r.rating; }, 0) / pub.length).toFixed(1) + ' ★' : '—',
    pending: S.ov ? S.ov.reviews.filter(function (r) { return r.status === 'pending'; }).length : 0
  };
}

function ovUsersHtml() {
  var tab = S.ovUserTab, E = S.ovEdit, iAmAdmin = S.me.role === 'admin';
  var staff = S.ov.staff;
  var form = '';
  if (E) {
    var isNew = E.email === '';
    var roleSel = (isNew || E.role !== 'admin') && E.email !== S.me.email
      ? '<select class="inp" id="ov_role"><option value="operator"' + (E.role === 'operator' ? ' selected' : '') + '>Operator</option>' + (iAmAdmin || E.role === 'coadmin' ? '<option value="coadmin"' + (E.role === 'coadmin' ? ' selected' : '') + '>Co-admin</option>' : '') + '</select>'
      : '<div class="inp ovfixed">' + ovRoleText(E.role) + '</div>';
    form = '<div class="ovform"><b>' + (isNew ? 'Add operator' : 'Edit ' + esc(E.name0)) + '</b>' +
      '<div class="ovgrid"><label><span class="k2">Name</span><input class="inp" id="ov_name" value="' + esc(E.name) + '"></label>' +
      '<label><span class="k2">Gmail</span>' + (isNew ? '<input class="inp" id="ov_email" type="email" inputmode="email" placeholder="name@gmail.com" value="' + esc(E.newEmail) + '">' : '<div class="inp ovfixed">' + esc(E.email) + '</div>') + '</label>' +
      '<label><span class="k2">Role</span>' + roleSel + '</label>' +
      '<label><span class="k2">' + (isNew ? 'Password (8+ characters)' : 'New password (leave blank to keep)') + '</span><input class="inp" id="ov_pw" type="text" autocomplete="off" value="' + esc(E.pw) + '"></label></div>' +
      '<div class="acts"><button type="button" class="ubtn green" data-act="ovsave"' + (S.busy ? ' disabled' : '') + '>' + (isNew ? 'Add operator' : 'Save changes') + '</button><button type="button" class="ubtn" data-act="ovcancel">Cancel</button></div>' +
      (isNew ? '<p class="hint" style="margin:0">Give them this password. They can change it after signing in (cat menu → Change my password).</p>' : '') + '</div>';
  }
  var rows;
  if (tab === 'staff') {
    rows = staff.map(function (s) {
      return '<tr><td><b>' + esc(s.name) + '</b></td><td>' + ovRoleText(s.role) + '</td><td>' + esc(s.email) + '</td><td>' + ovAccess(s.role) + '</td>' +
        '<td><span class="ovst' + (s.active ? '' : ' off') + '">' + (s.active ? (s.has_pw ? 'Active' : 'No password') : 'Disabled') + '</span></td>' +
        '<td class="ovbtns"><button type="button" class="ubtn sm" data-ovedit="' + esc(s.email) + '">Edit</button>' +
        (s.role !== 'admin' && s.email !== S.me.email && (iAmAdmin || s.role === 'operator') ? '<button type="button" class="ubtn sm" data-ovtoggle="' + esc(s.email) + '">' + (s.active ? 'Disable' : 'Enable') + '</button>' : '') + '</td></tr>';
    }).join('');
  } else {
    var by = {};
    S.data.bookings.forEach(function (b) { (by[b.guest_email] = by[b.guest_email] || []).push(b); });
    rows = Object.keys(by).map(function (em) {
      var list = by[em].sort(function (a, b) { return ms(b.check_in) - ms(a.check_in); }), latest = list[0];
      var stays = list.filter(active).length, ids = 0, guests = 0;
      list.forEach(function (b) { b.guests.forEach(function (g) { guests++; if (g.has_id) ids++; }); });
      var upcoming = list.some(function (b) { return active(b) && b.status !== 'Completed' && ms(b.check_out) > nowMs(); });
      return { t: ms(latest.check_in), html: '<tr><td><b>' + esc(lead(latest)) + '</b></td><td>Guest</td><td>' + esc(em) + '</td><td>' + plural(stays, 'stay') + ' · ' + (ids ? ids + ' of ' + guests + ' IDs on file' : 'IDs deleted') + '</td>' +
        '<td><span class="ovst' + (upcoming ? '' : ' past') + '">' + (upcoming ? 'Upcoming' : 'Past guest') + '</span></td>' +
        '<td class="ovbtns"><button type="button" class="ubtn sm" data-open="' + esc(latest.ref) + '">Open ' + esc(latest.ref) + '</button></td></tr>' };
    }).sort(function (a, b) { return b.t - a.t; }).map(function (x) { return x.html; }).join('');
  }
  return '<section class="panel"><div class="ovhead"><h2 class="ph">Users</h2><div class="tabs">' +
    '<button type="button" class="sortb" data-ovutab="staff" aria-pressed="' + (tab === 'staff') + '">Staff (' + staff.length + ')</button>' +
    '<button type="button" class="sortb" data-ovutab="guests" aria-pressed="' + (tab === 'guests') + '">Guests</button>' +
    '<button type="button" class="ubtn dark" data-act="ovadd">+ Add operator</button></div></div>' + form +
    '<div class="tscroll"><table><thead><tr><th>Name</th><th>Role</th><th>Gmail</th><th>' + (tab === 'staff' ? 'Access' : 'Stays &amp; IDs') + '</th><th>Status</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="6" class="empty">No guests yet.</td></tr>') + '</tbody></table></div></section>';
}

function ovReviewsHtml() {
  var tab = S.ovRevTab, A = S.ovRev;
  var count = function (st) { return S.ov.reviews.filter(function (r) { return r.status === st; }).length; };
  var list = S.ov.reviews.filter(function (r) { return r.status === tab; });
  var cards = list.map(function (r) {
    var replying = S.ovReply && S.ovReply.id === r.id;
    return '<article class="ovrev"><div class="ovr1"><span class="stars" aria-label="' + r.rating + ' out of 5 stars">' + ovStars(r.rating) + '</span><span>via Messenger' + (r.ref ? ' · ' + esc(r.ref) : '') + ' · ' + esc(whenS(r.at).replace(/^\w+ /, '').split(',')[0]) + '</span></div>' +
      '<p>' + esc(r.text) + '</p><b>' + esc(r.guest) + '</b>' +
      (r.reply && !replying ? '<div class="ovreply"><small>Our reply</small>' + esc(r.reply) + '</div>' : '') +
      (replying ? '<div class="ovreplyform"><label class="sr" for="ov_reply">Reply</label><input class="inp" id="ov_reply" placeholder="Thank you for staying with us…" value="' + esc(S.ovReply.text) + '"><button type="button" class="ubtn green sm" data-act="ovreplysave"' + (S.busy ? ' disabled' : '') + '>Save reply</button></div>' : '') +
      '<div class="acts">' + (r.status !== 'published' ? '<button type="button" class="ubtn green sm" data-ovrev="' + esc(r.id) + '" data-st="published"' + (S.busy ? ' disabled' : '') + '>Publish</button>' : '') +
      (r.status !== 'hidden' ? '<button type="button" class="ubtn sm" data-ovrev="' + esc(r.id) + '" data-st="hidden"' + (S.busy ? ' disabled' : '') + '>Hide</button>' : '<button type="button" class="ubtn sm" data-ovrev="' + esc(r.id) + '" data-st="pending">Move to pending</button>') +
      '<button type="button" class="ubtn sm" data-ovreply="' + esc(r.id) + '">' + (r.reply ? 'Edit reply' : 'Reply') + '</button></div></article>';
  }).join('');
  return '<section class="panel"><div class="ovhead"><div><h2 class="ph">Guest reviews</h2><p class="hint" style="margin:4px 0 0">Guests send reviews through Messenger. Add them here, then Publish to show them on the website.</p></div></div>' +
    '<div class="tabs" style="margin:12px 0">' + [['pending', 'Pending'], ['published', 'Published'], ['hidden', 'Hidden']].map(function (t) {
      return '<button type="button" class="sortb" data-ovrtab="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + ' (' + count(t[0]) + ')</button>';
    }).join('') + '<button type="button" class="ubtn dark" data-act="ovrevopen">+ Add review from Messenger</button></div>' +
    (A.open ? '<div class="ovform ovrevform"><div class="ovgrid4"><label><span class="k2">Guest name</span><input class="inp" id="ovr_guest" value="' + esc(A.guest) + '"></label>' +
      '<label><span class="k2">Booking ref</span><input class="inp" id="ovr_ref" placeholder="LO-1010" value="' + esc(A.ref) + '"></label>' +
      '<label><span class="k2">Stars</span><select class="inp" id="ovr_stars">' + [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '"' + (+A.rating === n ? ' selected' : '') + '>' + n + ' ★</option>'; }).join('') + '</select></label>' +
      '<label class="wide"><span class="k2">Review (paste from Messenger)</span><textarea class="inp" id="ovr_text" rows="2">' + esc(A.text) + '</textarea></label></div>' +
      '<div class="acts"><button type="button" class="ubtn green" data-act="ovrevsave"' + (S.busy ? ' disabled' : '') + '>Save as pending</button><button type="button" class="ubtn" data-act="ovrevcancel">Cancel</button></div></div>' : '') +
    (cards ? '<div class="ovrevs">' + cards + '</div>' : '<p class="empty" style="padding:10px 0">Nothing here.</p>') + '</section>';
}

function ovDataHtml() {
  var mk = ovMonthKey(), m = { 'GCash': 0, 'Bank transfer': 0 };
  S.data.bookings.forEach(function (b) { b.payments.forEach(function (p) { if (p.at.slice(0, 7) === mk) m[p.method] = (m[p.method] || 0) + p.amount; }); });
  var max = Math.max(1, m['GCash'], m['Bank transfer']);
  var acts = S.ov.activity.slice(0, 12).map(function (a) {
    return '<div class="actrow"><span>' + esc(whenS(a.at).replace(/^\w+ /, '')) + '</span><span><b>' + esc(a.action === 'createBooking' ? 'Guest' : ovName(a.email)) + '</b> ' + esc(ovActivity(a)) + '</span></div>';
  }).join('');
  return '<div class="cols ovdata"><section class="panel" style="flex:1 1 320px"><h2 class="ph" style="margin-bottom:12px">Payments by method</h2><p class="hint" style="margin:-6px 0 12px">' + MONTHS[+mk.slice(5) - 1] + ', including deposits</p>' +
    Object.keys(m).map(function (k) { return '<div style="margin-bottom:12px"><div class="ovm"><span>' + esc(k) + '</span><span>' + peso(m[k]) + '</span></div><div class="ckbar"><i style="width:' + Math.round(m[k] / max * 100) + '%"></i></div></div>'; }).join('') +
    (typeof exportCsv === 'function' ? '<div class="acts" style="margin-top:8px"><button type="button" class="pill line sm" data-ovcsv="bookings">Export bookings (CSV)</button><button type="button" class="pill line sm" data-ovcsv="ledger">Export payments (CSV)</button></div>' : '') + '</section>' +
    '<section class="panel" style="flex:999 1 420px"><h2 class="ph" style="margin-bottom:12px">Recent activity</h2>' + (acts || '<p class="empty" style="padding:10px 0">Nothing yet.</p>') + '</section></div>';
}

function overviewHtml() {
  var st = ovStats();
  var head = '<div class="hello"><div><h1>Overview</h1><p>Everything about Luna\'s Oasis, in one place.</p></div><button type="button" class="pill ghost sm" data-act="ovrefresh">↻ Refresh</button></div>';
  var stats = '<div class="stats big5">' +
    '<div class="stat"><div class="k">Bookings</div><div class="v">' + st.count + '</div><div class="s">this month</div></div>' +
    '<div class="stat"><div class="k">Occupancy</div><div class="v">' + st.occ + '%</div><div class="s">' + st.hrs + ' of ' + st.all + ' hrs booked</div></div>' +
    '<div class="stat"><div class="k">Collected</div><div class="v">' + peso(st.paid) + '</div><div class="s">payments this month</div></div>' +
    '<div class="stat"><div class="k">Outstanding</div><div class="v">' + peso(st.bal) + '</div><div class="s">unpaid balances</div></div>' +
    '<div class="stat"><div class="k">Rating</div><div class="v">' + st.rating + '</div><div class="s">' + plural(st.pending, 'review') + ' pending</div></div></div>';
  var cal = '';
  if (typeof calendarHtml === 'function') {
    var c = calendarHtml(), i = c.indexOf('<section class="panel">');
    cal = i === -1 ? '' : '<section class="panel"><h2 class="ph" style="margin-bottom:12px">Occupancy summary</h2>' + c.slice(i + '<section class="panel">'.length);
  }
  return head + (S.error ? '<div class="err" role="alert">' + esc(S.error) + '</div>' : '') + (S.ovMsg ? '<div class="okmsg" role="status">' + esc(S.ovMsg) + '</div>' : '') + stats + cal +
    (S.ov ? ovUsersHtml() + ovReviewsHtml() + ovDataHtml() : '<div class="loading"><div class="spin"></div>Loading users &amp; reviews…</div>');
}

function loadOv() { post({ action: 'staffOverview' }).then(function (d) { S.ov = d; render(); }).catch(fail); }
function ovAct(body, msg, after) {
  S.busy = true; S.error = ''; S.ovMsg = ''; render();
  return post(body, 0).then(function (d) { S.ov = d; S.busy = false; S.ovMsg = msg || ''; if (after) after(); render(); }).catch(fail);
}

PAGES.overview = {
  order: 0, label: 'Overview · users & reviews', show: isFinance, html: overviewHtml,
  enter: function () {
    S.error = ''; S.ovMsg = '';
    if (!S.ovUserTab) { S.ovUserTab = 'staff'; S.ovRevTab = 'pending'; S.ovRev = { open: false, guest: '', ref: '', rating: 5, text: '' }; }
    loadOv();
  },
  click: function (e) {
    var el = e.target.closest('[data-ovutab],[data-ovrtab],[data-ovedit],[data-ovtoggle],[data-ovrev],[data-ovreply],[data-ovcsv],[data-act^="ov"]');
    if (!el || el.disabled) return false;
    var d = el.dataset;
    if (d.ovutab) { S.ovUserTab = d.ovutab; render(); return true; }
    if (d.ovrtab) { S.ovRevTab = d.ovrtab; S.ovReply = null; render(); return true; }
    if (d.ovcsv) { S.rmode = 'month'; var t = new Date(Date.now() + PH); S.ry = t.getUTCFullYear(); S.rm = t.getUTCMonth(); exportCsv(d.ovcsv); return true; }
    if (d.ovedit) {
      var s = S.ov.staff.filter(function (x) { return x.email === d.ovedit; })[0];
      S.ovUserTab = 'staff'; S.ovEdit = { email: s.email, name0: s.name, name: s.name, role: s.role, pw: '' }; S.error = ''; render(); return true;
    }
    if (d.ovtoggle) {
      var u = S.ov.staff.filter(function (x) { return x.email === d.ovtoggle; })[0];
      if (window.confirm((u.active ? 'Disable ' : 'Enable ') + u.name + '?' + (u.active ? ' They will not be able to sign in.' : ''))) ovAct({ action: 'staffUser', op: 'toggle', email: u.email }, u.name + (u.active ? ' is disabled.' : ' can sign in again.'));
      return true;
    }
    if (d.ovrev) {
      var labels = { published: 'Published — it now shows on the website.', hidden: 'Hidden from the website.', pending: 'Moved back to pending.' };
      ovAct({ action: 'staffReview', op: 'status', id: d.ovrev, status: d.st }, labels[d.st]);
      return true;
    }
    if (d.ovreply) { var r = S.ov.reviews.filter(function (x) { return x.id === d.ovreply; })[0]; S.ovReply = { id: r.id, text: r.reply }; render(); var f = document.getElementById('ov_reply'); if (f) f.focus(); return true; }
    switch (d.act) {
      case 'ovrefresh': loadAll(true); loadOv(); return true;
      case 'ovadd': S.ovUserTab = 'staff'; S.ovEdit = { email: '', newEmail: '', name0: '', name: '', role: 'operator', pw: '' }; S.error = ''; render(); return true;
      case 'ovcancel': S.ovEdit = null; S.error = ''; render(); return true;
      case 'ovsave':
        var E = S.ovEdit, isNew = E.email === '';
        ovAct({ action: 'staffUser', op: isNew ? 'add' : 'edit', email: isNew ? E.newEmail : E.email, name: E.name, role: E.role, password: E.pw },
          isNew ? E.name + ' was added. They can sign in now.' : 'Saved.', function () { S.ovEdit = null; });
        return true;
      case 'ovrevopen': S.ovRev.open = !S.ovRev.open; render(); return true;
      case 'ovrevcancel': S.ovRev.open = false; render(); return true;
      case 'ovrevsave':
        var A = S.ovRev;
        ovAct({ action: 'staffReview', op: 'add', guest: A.guest, ref: A.ref, rating: +A.rating, text: A.text }, 'Review saved as pending. Tap Publish to show it on the website.',
          function () { S.ovRev = { open: false, guest: '', ref: '', rating: 5, text: '' }; S.ovRevTab = 'pending'; });
        return true;
      case 'ovreplysave':
        ovAct({ action: 'staffReview', op: 'reply', id: S.ovReply.id, reply: S.ovReply.text }, 'Reply saved.', function () { S.ovReply = null; });
        return true;
    }
    return false;
  },
  input: function (e) {
    var id = e.target.id, E = S.ovEdit, A = S.ovRev;
    if (id === 'ov_name') { E.name = e.target.value; return true; }
    if (id === 'ov_email') { E.newEmail = e.target.value; return true; }
    if (id === 'ov_pw') { E.pw = e.target.value; return true; }
    if (id === 'ovr_guest') { A.guest = e.target.value; return true; }
    if (id === 'ovr_ref') { A.ref = e.target.value; return true; }
    if (id === 'ovr_text') { A.text = e.target.value; return true; }
    if (id === 'ov_reply') { S.ovReply.text = e.target.value; return true; }
    return false;
  },
  change: function (e) {
    if (e.target.id === 'ov_role') { S.ovEdit.role = e.target.value; return true; }
    if (e.target.id === 'ovr_stars') { S.ovRev.rating = +e.target.value; return true; }
    return false;
  }
};