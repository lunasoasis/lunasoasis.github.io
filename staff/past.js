/* Luna's Oasis — staff portal: past bookings live in Bookings, and guests & IDs can be changed.
   · Bookings has a "Past stays" tab and a "+ Add past booking" button (admin & co-admin)
   · A past booking can be changed: guests, IDs, children's ages, baby, dates, nights, payment
   · Any other booking: "Edit guests & IDs" (add a missing ID, fix a name, a child's age)
   Loaded after live.js. */
'use strict';

var PB = null;   // the open box
var PB_TYPES = ['PhilSys National ID', 'Driver\'s License', 'Passport', 'UMID', 'SSS ID', 'PRC ID', 'Postal ID', 'Voter\'s ID', 'PhilHealth ID',
  'Senior Citizen ID', 'PWD ID', 'School ID', 'Company ID', 'Other'];
var PB_AGE = /^(\d{1,2}) (month|months|year|years) old$/;

function isPastRef(b) { return /^PAST-/.test(b.ref) || /^Past/.test(b.source || ''); }
function pbRates() { return (S.data && S.data.settings.rates) || []; }
function pbRate(pkg) { return pbRates().filter(function (r) { return r.package === pkg; })[0]; }

// ---------- Bookings list: "Past stays" tab + "Add past booking" button ----------
(function () {
  var plainLists = lists;
  lists = function () {
    var t = plainLists(), now = nowMs(), q = S.q.trim().toLowerCase();
    t.past = S.data.bookings.filter(function (b) { return active(b) && b.check_out && ms(b.check_out) < now; })
      .filter(function (b) { return !q || (b.ref + ' ' + b.guest_email + ' ' + b.guests.map(function (g) { return g.name; }).join(' ')).toLowerCase().indexOf(q) !== -1; })
      .sort(function (a, b) { return ms(b.check_in) - ms(a.check_in); });
    return t;
  };
  var plainHtml = bookingsHtml;
  bookingsHtml = function () {
    var h = plainHtml(), n = lists().past.length;
    var tab = '<button type="button" class="tab" data-tab="past" aria-pressed="' + (S.tab === 'past') + '">Past stays<span class="n">' + n + '</span></button>';
    h = h.replace('</div><label class="sr" for="q">', tab + '</div><label class="sr" for="q">');
    var refresh = '<button type="button" class="pill ghost sm" data-act="refresh">↻ Refresh</button>';
    h = h.replace(refresh, '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      (isFinance() ? '<button type="button" class="pill gold sm" data-pbadd="1">+ Add past booking</button>' : '') + refresh + '</div>');
    return h;
  };
  // the booking panel: edit buttons, and "No ID yet" instead of "ID deleted" for past guests
  var plainGaf = typeof gafButton === 'function' ? gafButton : function () { return ''; };
  gafButton = function (b) {
    var btn = isPastRef(b)
      ? (isFinance() ? '<button type="button" class="pill dark sm" data-pbedit="' + esc(b.ref) + '" style="width:100%">✎ Edit past booking · guests, IDs, nights</button>' : '')
      : '<button type="button" class="pill line sm" data-pbguests="' + esc(b.ref) + '" style="width:100%">✎ Edit guests &amp; IDs</button>';
    return (btn ? '<div style="margin-top:12px">' + btn + '</div>' : '') + (isPastRef(b) ? '' : plainGaf(b));   // no GAF / key code for stays that are over
  };
  var plainDetail = detail;
  detail = function () {
    var h = plainDetail(), b = S.data.bookings.filter(function (x) { return x.ref === S.open; })[0];
    if (b && isPastRef(b)) h = h.split('>ID deleted<').join('>No ID yet<');
    return h;
  };
})();

// ---------- open / close ----------
function pbGuestFrom(g) {
  var kind = g.child_age ? 'child' : g.has_id ? 'id' : 'none';
  var t = g.id_type && g.id_type !== 'No ID (child)' ? g.id_type : '';
  var known = PB_TYPES.indexOf(t) !== -1;
  var m = PB_AGE.exec(g.child_age || '');
  return { old_no: g.no, name: g.name, kind: kind, idType: t ? (known ? t : 'Other') : '', idOther: t && !known ? t : '', saved: g.has_id, file: null,
    age: m ? m[1] : '', unit: m && /month/.test(m[2]) ? 'months' : 'years' };
}
function pbBlank() { return { old_no: 0, name: '', kind: 'id', idType: '', idOther: '', saved: false, file: null, age: '', unit: 'years' }; }
function pbBaby(info) {
  var p = String(info || '').split(' · '), m = PB_AGE.exec(p[1] || '');
  return { baby: !!info, babyName: info ? p[0] : '', babyAge: m ? m[1] : '', babyUnit: m && /year/.test(m[2]) ? 'years' : 'months' };
}
function pbOpen(mode, ref) {
  var night = pbRates().filter(function (r) { return r.hours >= 20; })[0] || pbRates()[0] || {};
  PB = { mode: mode, ref: ref || '', busy: false, err: '', guests: [pbBlank()], baby: false, babyName: '', babyAge: '', babyUnit: 'months',
    email: '', date: '', time: '14:00', pkg: night.package || '', nights: 1, extra: 0, amount: '', method: 'GCash', depBack: true, max: 4 };
  var b = ref && S.data.bookings.filter(function (x) { return x.ref === ref; })[0];
  if (b) {
    PB.guests = b.guests.length ? b.guests.map(pbGuestFrom) : [pbBlank()];
    var by = pbBaby(b.baby_info); Object.keys(by).forEach(function (k) { PB[k] = by[k]; });
    if (mode === 'guests') PB.max = b.pax <= 2 ? 2 : 4;
    if (mode === 'edit') {
      var r = pbRate(b.package) || {};
      PB.email = b.guest_email || ''; PB.date = b.check_in.slice(0, 10); PB.time = b.check_in.slice(11, 16);
      PB.pkg = b.package; PB.nights = b.nights || 1;
      var stayover = r.hours >= 20 && b.nights > 1 ? (b.nights - 1) * (24 - r.hours) : 0;
      PB.extra = Math.max(0, b.extra_hours - stayover);
      PB.amount = String(Math.max(0, b.paid_total - b.deposit));
      PB.method = (b.payments[0] && b.payments[0].method) || 'GCash';
      PB.depBack = !!(b.deposit_info && b.deposit_info.refunded_at);
    }
  }
  pbRender();
}
function pbClose() { var x = document.getElementById('pbbox'); if (x) x.remove(); PB = null; document.body.style.overflow = ''; }
function pbFail(err) {
  if (err && err.auth) { pbClose(); signOut('Please sign in again.'); return; }
  if (!PB) return;
  PB.busy = false; PB.err = err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not reach the server. Please check your connection.';
  pbRender();
}

// ---------- checks & price ----------
function pbAgeOk(v, unit, baby) {
  v = String(v || '').trim(); if (!/^\d{1,2}$/.test(v)) return false;
  var n = +v;
  return unit === 'months' ? n >= 0 && n <= (baby ? 24 : 35) : n >= 1 && n <= (baby ? 2 : 17);
}
function pbAgeText(v, unit) { var n = +v; return n + ' ' + (unit === 'months' ? (n === 1 ? 'month' : 'months') : (n === 1 ? 'year' : 'years')) + ' old'; }
function pbTypeOf(g) { return g.idType === 'Other' ? g.idOther.trim() : g.idType; }
function pbMissing() {
  for (var i = 0; i < PB.guests.length; i++) {
    var g = PB.guests[i], who = 'Guest ' + (i + 1);
    if (g.name.trim().length < 2) return who + ': type the full name.';
    if (g.kind === 'child' && !pbAgeOk(g.age, g.unit)) return who + ': type the child\'s age.';
    if (g.kind === 'id' && g.idType === 'Other' && g.idOther.trim().length < 2) return who + ': type the name of the ID.';
    if (g.kind === 'id' && g.file && g.file.busy) return who + ': the ID is still loading.';
  }
  if (PB.baby && PB.babyName.trim().length < 2) return 'Baby: type the full name.';
  if (PB.baby && !pbAgeOk(PB.babyAge, PB.babyUnit, true)) return 'Baby: type the age (2 years old and below).';
  if (PB.mode === 'guests') return '';
  if (!PB.date) return 'Type the check-in date.';
  var p = pbPrice(); if (!p) return 'Choose a package.';
  if (p.endMs > Date.now()) return 'That stay is not over yet. Use the booking page for current and future stays.';
  if (PB.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(PB.email.trim())) return 'Check the email address (or leave it empty).';
  return '';
}
function pbPrice() {
  var st = S.data.settings, r = pbRate(PB.pkg); if (!r) return null;
  var nightly = r.hours >= 20, n = nightly ? Math.max(1, +PB.nights || 1) : 0, pax = PB.guests.length, base = pax > 2 ? r.rate_3_4_pax : r.rate_1_2_pax;
  var stay = 0, disc = 0;
  for (var i = 0; i < Math.max(1, n); i++) {
    var day = PB.date ? new Date(ms(PB.date + 'T00:00') + PH + i * 24 * HOUR).toISOString().slice(0, 10) : '';
    var pr = (st.promos || []).filter(function (p) { return day && p.start_date <= day && day <= p.end_date; })[0];
    stay += base; disc += pr ? Math.round(base * pr.percent_off / 100) : 0;
  }
  var stayHrs = n > 1 ? (n - 1) * (24 - r.hours) : 0, extra = +PB.extra || 0;
  var stayTotal = stay - disc + (stayHrs + extra) * st.extra_hour_rate;
  var endMs = PB.date ? ms(PB.date + 'T' + (PB.time || '00:00')) + ((nightly ? 24 * (n - 1) + r.hours : r.hours) + extra) * HOUR : 0;
  return { nightly: nightly, n: n, hours: r.hours, pax: pax > 2 ? 4 : 2, base: base, stay: stay, disc: disc, stayHrs: stayHrs, extra: extra, stayTotal: stayTotal, deposit: st.deposit, endMs: endMs };
}

// ---------- ID photos ----------
function pbReadId(i, file) {
  var g = PB.guests[i];
  if (!file) return;
  if (file.size > 15 * 1024 * 1024) { g.file = { error: 'That file is too big (max 15 MB).' }; pbRender(); return; }
  g.file = { busy: true }; pbRender();
  var done = function (o) { if (PB && PB.guests[i] === g) { g.file = o; pbRender(); } };
  if (file.type === 'application/pdf') {
    if (file.size > 4.5 * 1024 * 1024) return done({ error: 'PDF is too big (max 4.5 MB). Try a photo instead.' });
    var fr = new FileReader();
    fr.onload = function () { done({ data: String(fr.result).split(',')[1], mime: 'application/pdf', label: 'PDF ready · ' + (file.name || 'ID.pdf') }); };
    fr.onerror = function () { done({ error: 'Could not read that file.' }); };
    fr.readAsDataURL(file); return;
  }
  var url = URL.createObjectURL(file), img = new Image();
  img.onload = function () {
    var sc = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    var c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    var big = c.toDataURL('image/jpeg', 0.82);
    var t = document.createElement('canvas'), ts = Math.min(1, 240 / Math.max(c.width, c.height)); t.width = Math.round(c.width * ts); t.height = Math.round(c.height * ts);
    t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
    URL.revokeObjectURL(url);
    done({ data: big.split(',')[1], mime: 'image/jpeg', label: 'New ID photo ready', thumb: t.toDataURL('image/jpeg', .75), view: big });
  };
  img.onerror = function () { URL.revokeObjectURL(url); done({ error: 'Please choose a JPG, PNG or PDF.' }); };
  img.src = url;
}

// ---------- drawing ----------
function pbAgeBox(key, val, unit) {
  return '<div style="display:flex;gap:8px;margin-top:8px"><input class="inp" style="width:90px" id="' + key + 'a" data-pba="' + key + '" inputmode="numeric" maxlength="2" placeholder="Age" value="' + esc(val) + '">' +
    '<select class="inp" style="width:auto;min-width:130px" data-pbu="' + key + '"><option value="years"' + (unit === 'years' ? ' selected' : '') + '>years old</option><option value="months"' + (unit === 'months' ? ' selected' : '') + '>months old</option></select></div>';
}
function pbGuestHtml(g, i) {
  var kinds = [['id', 'Has ID'], ['child', 'Child, no ID'], ['none', 'No ID yet']].map(function (k) {
    return '<button type="button" data-pbk="' + i + '" data-k="' + k[0] + '" aria-pressed="' + (g.kind === k[0]) + '">' + k[1] + '</button>';
  }).join('');
  var body = '';
  if (g.kind === 'child') {
    body = '<span class="label">How old is this child?</span>' + pbAgeBox('g' + i, g.age, g.unit) + '<p class="hint">Years, or months if below 1 year old.</p>';
  } else if (g.kind === 'id') {
    var opts = '<option value="">Type of ID…</option>' + PB_TYPES.map(function (t) { return '<option' + (g.idType === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('');
    var pic = '';
    if (g.file && g.file.error) pic = '<div class="err">' + esc(g.file.error) + '</div>';
    else if (g.file && g.file.busy) pic = '<p class="hint">Preparing the ID…</p>';
    else if (g.file && g.file.data) pic = '<div style="display:flex;gap:12px;align-items:center;margin-top:10px;padding:10px;border:1px solid var(--line);border-radius:12px;background:#fff">' +
      (g.file.thumb ? '<img src="' + g.file.thumb + '" alt="" style="width:104px;height:68px;object-fit:cover;border-radius:8px">' : '<span style="width:104px;height:68px;border-radius:8px;background:#F1E8DA;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--bronze)">PDF</span>') +
      '<div style="font-size:13px;line-height:1.45;min-width:0;overflow-wrap:anywhere"><b>' + esc(g.name.trim() || 'Guest ' + (i + 1)) + '</b><br>' + esc(pbTypeOf(g) || 'ID type not chosen') + '<br><span style="color:var(--ok)">✓ ' + esc(g.file.label) + '</span></div></div>';
    else if (g.saved) pic = '<p class="hint" style="color:var(--ok)">✓ ID already saved · <button type="button" class="linkbtn" data-pbview="' + g.old_no + '">View</button></p>';
    else pic = '<p class="hint">No ID photo yet — you can upload it now or later.</p>';
    body = '<select class="inp" data-pbt="' + i + '" style="margin-top:10px" aria-label="Type of ID of guest ' + (i + 1) + '">' + opts + '</select>' +
      (g.idType === 'Other' ? '<input class="inp" data-pbo="' + i + '" placeholder="Name of the ID (e.g. Barangay ID)" value="' + esc(g.idOther) + '" style="margin-top:8px">' : '') +
      '<label class="pill line sm" style="margin-top:10px;cursor:pointer">' + (g.file && g.file.data || g.saved ? 'Change ID photo' : 'Upload ID photo') +
      '<input type="file" data-pbf="' + i + '" accept="image/*,application/pdf" style="position:absolute;left:-9999px"></label>' + pic;
  } else {
    body = '<p class="hint">Saved without an ID. Choose "Has ID" when you have it.</p>';
  }
  return '<div style="border:1px solid var(--line);background:var(--paper);border-radius:14px;padding:12px 14px;margin-top:10px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--bronze)">Guest ' + (i + 1) + (i === 0 ? ' · main' : '') + '</span>' +
    (PB.guests.length > 1 ? '<button type="button" class="linkbtn" data-pbdel="' + i + '" style="color:var(--bad)">Remove</button>' : '') + '</div>' +
    '<input class="inp" data-pbn="' + i + '" placeholder="Full name" value="' + esc(g.name) + '" style="margin-top:8px" aria-label="Full name of guest ' + (i + 1) + '">' +
    '<div class="seg" style="margin-top:8px">' + kinds + '</div>' + body + '</div>';
}
function pbRender() {
  var box = document.getElementById('pbbox');
  if (!box) {
    box = document.createElement('div'); box.id = 'pbbox'; box.style.cssText = 'position:relative;z-index:60';
    document.body.appendChild(box); document.body.style.overflow = 'hidden';
    box.addEventListener('click', pbClick); box.addEventListener('input', pbInput); box.addEventListener('change', pbChange);
  }
  var scroll = box.querySelector('.drawer') ? box.querySelector('.drawer').scrollTop : 0;
  var title = PB.mode === 'add' ? 'Add past booking' : PB.mode === 'edit' ? 'Edit ' + PB.ref : 'Guests · ' + PB.ref;
  var guests = PB.guests.map(pbGuestHtml).join('') +
    (PB.guests.length < PB.max ? '<button type="button" class="pill line sm" data-pbaddg="1" style="margin-top:10px;width:100%">+ Add guest</button>' : '<p class="hint">' + PB.max + ' guests is the most for this booking.</p>');
  var baby = '<label style="display:flex;gap:10px;align-items:center;margin-top:14px;font-size:14px"><input type="checkbox" data-pbbaby="1"' + (PB.baby ? ' checked' : '') + '> A baby 2 years old or below came too (free)</label>' +
    (PB.baby ? '<div style="border:1px dashed var(--bronze);border-radius:14px;padding:12px 14px;margin-top:8px"><input class="inp" data-pbbn="1" placeholder="Full name of the baby" value="' + esc(PB.babyName) + '">' +
      '<span class="label">How old is the baby?</span>' + pbAgeBox('b', PB.babyAge, PB.babyUnit) + '</div>' : '');
  var stay = '';
  if (PB.mode !== 'guests') {
    var p = pbPrice() || {}, r = pbRate(PB.pkg) || {};
    var pkgOpts = pbRates().map(function (x) { return '<option value="' + esc(x.package) + '"' + (PB.pkg === x.package ? ' selected' : '') + '>' + x.hours + ' hours</option>'; }).join('');
    var stayAmt = p.stayTotal || 0;
    stay = '<div class="sec"><h3>Stay</h3>' +
      '<div class="two"><div><label class="label" for="pbd">Check-in date</label><input class="inp" id="pbd" data-pbs="date" type="date" value="' + esc(PB.date) + '"></div>' +
      '<div><label class="label" for="pbtm">Time-in</label><input class="inp" id="pbtm" data-pbs="time" type="time" step="1800" value="' + esc(PB.time) + '"></div></div>' +
      '<div class="two"><div><label class="label" for="pbpk">Package</label><select class="inp" id="pbpk" data-pbpk="1">' + pkgOpts + '</select></div>' +
      (r.hours >= 20 ? '<div><label class="label" for="pbnt">Nights</label><input class="inp" id="pbnt" data-pbs="nights" type="number" inputmode="numeric" min="1" max="30" value="' + esc(PB.nights) + '"></div>' : '<div></div>') + '</div>' +
      '<div class="two"><div><label class="label" for="pbex">Extra hours</label><input class="inp" id="pbex" data-pbs="extra" type="number" inputmode="numeric" min="0" max="12" value="' + esc(PB.extra) + '"></div>' +
      '<div><label class="label" for="pbem">Email (optional)</label><input class="inp" id="pbem" data-pbs="email" type="email" value="' + esc(PB.email) + '"></div></div>' +
      '<div id="pbprice" style="margin-top:12px;font-size:14px;line-height:1.7">' + pbPriceHtml() + '</div></div>' +
      '<div class="sec"><h3>Payment</h3>' +
      '<label class="label" for="pbam" style="margin-top:0">Amount paid for the stay (₱, not counting the deposit)</label><input class="inp" id="pbam" data-pbs="amount" type="number" inputmode="decimal" min="0" placeholder="' + Math.round(stayAmt) + '" value="' + esc(PB.amount) + '">' +
      '<div class="seg" style="margin-top:8px">' + ['GCash', 'Bank transfer'].map(function (k) { return '<button type="button" data-pbm="' + k + '" aria-pressed="' + (PB.method === k) + '">' + k + '</button>'; }).join('') + '</div>' +
      '<label style="display:flex;gap:10px;align-items:center;margin-top:12px;font-size:14px"><input type="checkbox" data-pbdep="1"' + (PB.depBack ? ' checked' : '') + '> ' + peso(S.data.settings.deposit) + ' deposit was already returned</label></div>';
  }
  var miss = pbMissing();
  box.innerHTML = '<div class="shade" data-pbc="1"></div><aside class="drawer" role="dialog" aria-label="' + esc(title) + '">' +
    '<div class="dh"><div class="t">' + esc(title) + '</div><button type="button" data-pbc="1" aria-label="Close">✕</button></div>' +
    '<div class="sec"><h3>Guests &amp; IDs</h3>' + guests + baby + '</div>' + stay +
    '<div class="sec" style="border:0;padding-bottom:40px">' +
    '<p class="hint" id="pbmiss" style="color:var(--bad);margin-top:0"' + (miss ? '' : ' hidden') + '>' + esc(miss) + '</p>' +
    (PB.err ? '<div class="err">' + esc(PB.err) + '</div>' : '') +
    '<button type="button" class="pill gold" data-pbsave="1" style="width:100%;margin-top:10px"' + (PB.busy || miss ? ' disabled' : '') + '>' +
    (PB.busy ? 'Saving…' : PB.mode === 'add' ? 'Add to bookings' : 'Save changes') + '</button></div></aside>';
  box.querySelector('.drawer').scrollTop = scroll;
}
function pbPriceHtml() {
  var p = pbPrice(); if (!p) return '';
  var amt = PB.amount === '' ? p.stayTotal : +PB.amount;
  return '<div class="dl"><span>' + (p.nightly ? p.n + (p.n > 1 ? ' nights' : ' night') : p.hours + ' hours') + ' · ' + p.pax + ' pax rate (' + PB.guests.length + ' guest' + (PB.guests.length > 1 ? 's' : '') + ')</span><b>' + peso(p.stay) + '</b></div>' +
    (p.disc ? '<div class="dl" style="color:var(--ok)"><span>Promo</span><b>−' + peso(p.disc) + '</b></div>' : '') +
    (p.stayHrs + p.extra ? '<div class="dl"><span>Extra &amp; stay-over hours (' + (p.stayHrs + p.extra) + ')</span><b>' + peso((p.stayHrs + p.extra) * S.data.settings.extra_hour_rate) + '</b></div>' : '') +
    '<div class="dl"><span>Stay total</span><b>' + peso(p.stayTotal) + '</b></div>' +
    '<div class="dl"><span>Paid for the stay</span><b style="color:' + (amt >= p.stayTotal ? 'var(--ok)' : 'var(--bad)') + '">' + peso(amt) + (amt < p.stayTotal ? ' · ' + peso(p.stayTotal - amt) + ' unpaid' : '') + '</b></div>';
}
function pbRefresh() {   // after typing: update the price and the save button without redrawing
  var pr = document.getElementById('pbprice'); if (pr) pr.innerHTML = pbPriceHtml();
  var miss = pbMissing(), m = document.getElementById('pbmiss'), btn = document.querySelector('[data-pbsave]');
  if (m) { m.textContent = miss; m.hidden = !miss; }
  if (btn) btn.disabled = PB.busy || !!miss;
}

// ---------- events ----------
function pbInput(e) {
  if (!PB) return;
  var d = e.target.dataset, v = e.target.value;
  if (d.pbn != null) PB.guests[+d.pbn].name = v;
  else if (d.pbo != null) PB.guests[+d.pbo].idOther = v;
  else if (d.pba != null) { v = v.replace(/\D/g, '').slice(0, 2); e.target.value = v; if (d.pba === 'b') PB.babyAge = v; else PB.guests[+d.pba.slice(1)].age = v; }
  else if (d.pbbn != null) PB.babyName = v;
  else if (d.pbs) PB[d.pbs] = v;
  else return;
  pbRefresh();
}
function pbChange(e) {
  if (!PB) return;
  var d = e.target.dataset;
  if (d.pbf != null) { pbReadId(+d.pbf, e.target.files && e.target.files[0]); return; }
  if (d.pbt != null) { PB.guests[+d.pbt].idType = e.target.value; pbRender(); return; }
  if (d.pbu != null) { if (d.pbu === 'b') PB.babyUnit = e.target.value; else PB.guests[+d.pbu.slice(1)].unit = e.target.value; pbRefresh(); return; }
  if (d.pbpk) { PB.pkg = e.target.value; pbRender(); return; }
  if (d.pbbaby) { PB.baby = e.target.checked; pbRender(); return; }
  if (d.pbdep) { PB.depBack = e.target.checked; return; }
  if (d.pbs) { PB[d.pbs] = e.target.value; pbRefresh(); }
}
function pbClick(e) {
  var el = e.target.closest('[data-pbc],[data-pbk],[data-pbdel],[data-pbaddg],[data-pbm],[data-pbview],[data-pbsave]');
  if (!el || el.disabled || !PB) return;
  var d = el.dataset;
  if (d.pbc) { if (!PB.busy) pbClose(); return; }
  if (d.pbk != null) { PB.guests[+d.pbk].kind = d.k; pbRender(); return; }
  if (d.pbdel != null) { PB.guests.splice(+d.pbdel, 1); pbRender(); return; }
  if (d.pbaddg) { PB.guests.push(pbBlank()); pbRender(); return; }
  if (d.pbm) { PB.method = d.pbm; pbRender(); return; }
  if (d.pbview) { viewId(PB.ref, +d.pbview); var vs = document.querySelectorAll('.viewer'); if (vs.length) vs[vs.length - 1].style.zIndex = '70'; return; }
  if (d.pbsave) pbSave();
}
function pbSave() {
  if (pbMissing() || PB.busy) return;
  var body = {
    guests: PB.guests.map(function (g) {
      var o = { old_no: g.old_no, full_name: g.name.trim(), kind: g.kind, id_type: g.kind === 'id' ? pbTypeOf(g) : '' };
      if (g.kind === 'child') o.age = pbAgeText(g.age, g.unit);
      if (g.kind === 'id' && g.file && g.file.data) o.id = { mime: g.file.mime, data: g.file.data };
      return o;
    }),
    baby_name: PB.baby ? PB.babyName.trim() : '', baby_age: PB.baby ? pbAgeText(PB.babyAge, PB.babyUnit) : ''
  };
  if (PB.mode === 'guests') { body.action = 'staffSaveGuests'; body.ref = PB.ref; }
  else {
    var p = pbPrice();
    body.action = PB.mode === 'add' ? 'staffAddPast2' : 'staffEditPast';
    if (PB.mode === 'edit') body.ref = PB.ref;
    body.guest_email = PB.email.trim(); body.check_in = PB.date + 'T' + (PB.time || '14:00'); body.package = PB.pkg;
    body.nights = +PB.nights || 1; body.extra_hours = +PB.extra || 0;
    body.amount_paid = PB.amount === '' ? p.stayTotal : +PB.amount; body.method = PB.method; body.deposit_returned = PB.depBack;
  }
  PB.busy = true; PB.err = ''; pbRender();
  var mode = PB.mode;
  post(body, 0).then(function (d) {
    var ref = d.added || d.saved || PB.ref;
    pbClose();
    S.data = d; S.me = d.me; saveCache('bk', d); S.error = '';
    S.msg = mode === 'add' ? 'Added as ' + ref + '.' : 'Saved ✓';
    S.page = 'bookings';
    if (mode !== 'guests') S.tab = 'past';
    S.open = ref; render();
    var x = document.getElementById('detail'); if (x && window.innerWidth <= 1000) x.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }).catch(pbFail);
}

// Records: the old "Add a past booking" form now points to Bookings.
if (PAGES.records) (function () {
  var plainRec = PAGES.records.html;
  PAGES.records.html = function () {
    var h = plainRec(), a = h.indexOf('<section class="panel"><h2 class="ph">Add a past booking</h2>');
    if (a === -1) return h;
    var b = h.indexOf('</section>', a) + 10;
    return h.slice(0, a) + '<section class="panel"><h2 class="ph">Past bookings</h2><p class="hint" style="margin-top:0">Past bookings are now in <b>Bookings → Past stays</b>. Open one there to add IDs, children\'s ages, or change the nights.</p>' +
      '<button type="button" class="pill gold sm" data-pbadd="1">+ Add past booking</button></section>' + h.slice(b);
  };
})();
// Recent activity: words for the new actions.
if (typeof ovActivity === 'function') (function () {
  var plainOv = ovActivity;
  ovActivity = function (a) {
    if (a.action === 'editPast') return 'changed past booking ' + a.ref;
    if (a.action === 'saveGuests') return 'updated the guests & IDs of ' + a.ref;
    return plainOv(a);
  };
})();
if (typeof adKind === 'function') (function () {
  var plainKind = adKind;
  adKind = function (a) { return a.action === 'editPast' || a.action === 'saveGuests' ? 'bookings' : plainKind(a); };
})();

PAGES.past = {
  show: function () { return false; },
  click: function (e) {
    var el = e.target.closest('[data-pbadd],[data-pbedit],[data-pbguests]');
    if (!el || el.disabled) return false;
    if (el.dataset.pbadd) pbOpen('add');
    else if (el.dataset.pbedit) pbOpen('edit', el.dataset.pbedit);
    else pbOpen('guests', el.dataset.pbguests);
    return true;
  }
};
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && PB && !PB.busy && !document.querySelector('.viewer')) pbClose(); });
