/* Luna's Oasis — staff portal: Guest Authorization Letter (GAF).
   Booking panel → "Send GAF" opens a form with everything pre-filled. Staff check and
   fix the details, can preview the PDF, then send it to the building admin and the guest. */
'use strict';

var G = null;              // the open form
var GAF_SENT = {};         // ref -> time sent (this session)

function gafWhen(v) {      // "2026-10-03T18:00" -> "Oct. 03, 2026 @6pm"
  if (!v) return '';
  var y = v.slice(0, 4), mo = +v.slice(5, 7) - 1, d = v.slice(8, 10), h = +v.slice(11, 13), m = v.slice(14, 16);
  var mon = MON[mo] + (MON[mo] === 'May' ? '' : '.');
  return mon + ' ' + d + ', ' + y + ' @' + ((h + 11) % 12 + 1) + (m !== '00' ? ':' + m : '') + (h < 12 ? 'am' : 'pm');
}
function gafDay(v) { return v ? MONTHS[+v.slice(5, 7) - 1] + ' ' + (+v.slice(8, 10)) : ''; }
function gafSubject(l) { return l.building + ' ' + l.unit + ' Authorization Letter'; }
function gafBody(l, b) {
  return 'Dear Sir/Madam,\n\nI, ' + l.owner + ', hereby authorize the following guests to stay at the property from ' + gafDay(b.check_in) + ' to ' + gafDay(b.check_out) + '.\n\n' +
    'Attached below are copies of their valid IDs for verification and authorization purposes.\n\nThank you for your assistance.\n\nSincerely,\n' + l.owner;
}
function gafBooking() { return S.data.bookings.filter(function (x) { return x.ref === G.ref; })[0]; }

// The button inside the booking panel (core.js calls this).
function gafButton(b) {
  var sent = GAF_SENT[b.ref];
  return '<div style="margin-top:12px"><button type="button" class="pill dark sm" data-gaf="' + esc(b.ref) + '" style="width:100%">Send GAF · authorization letter</button>' +
    '<p class="hint" style="margin:6px 0 0">' + (sent ? '✓ Sent ' + when(sent) + '. You can send it again if something changed.' : 'Check the IDs first. You can fix the details before sending.') + '</p></div>';
}

function gafOpen(ref) {
  G = { ref: ref, data: null, letter: null, busy: true, err: '', msg: '', done: false, subjEdited: false, bodyEdited: false };
  gafRender();
  post({ action: 'staffGafData', ref: ref }).then(function (d) {
    var b = gafBooking(), df = d.defaults, last = d.last;
    var guests = b.guests.map(function (g) {
      var old = last && last.guests.filter(function (x) { return x.guest_no === g.no; })[0];
      return { name: g.name, proof: old ? old.proof : '', reason: old ? old.reason : 'Visit', guest_no: g.no, attach: g.has_id, has_id: g.has_id };
    });
    if (last) last.guests.forEach(function (x) { if (!x.guest_no) guests.push({ name: x.name, proof: x.proof, reason: x.reason, guest_no: 0, attach: false, has_id: false }); });
    var l = {
      date: d.today, owner: df.owner, building: df.building, unit: df.unit, contact: df.contact,
      check_in: gafWhen(b.check_in), check_out: gafWhen(b.check_out), guests: guests,
      admin_to: (df.admin_to || []).join('\n'), guest_to: b.guest_email || ''
    };
    l.subject = gafSubject(l); l.body = gafBody(l, b);
    if (d.sent_at) GAF_SENT[ref] = d.sent_at;
    G.data = d; G.letter = l; G.busy = false; gafRender();
  }).catch(gafFail);
}
function gafFail(err) {
  if (err && err.auth) { gafClose(); signOut('Please sign in again.'); return; }
  if (!G) return;
  G.busy = false;
  G.err = err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not reach the server. Please check your connection.';
  gafRender();
}
function gafClose() {
  var box = document.getElementById('gafbox');
  if (box) box.remove();
  G = null; document.body.style.overflow = '';
  if (typeof render === 'function' && S.data) render();
}

function gafRender() {
  var box = document.getElementById('gafbox');
  if (!box) {
    box = document.createElement('div'); box.id = 'gafbox'; box.style.cssText = 'position:relative;z-index:60';
    document.body.appendChild(box); document.body.style.overflow = 'hidden';
    box.addEventListener('click', gafClick); box.addEventListener('input', gafInput); box.addEventListener('change', gafChange);
  }
  var keep = document.activeElement && box.contains(document.activeElement) ? document.activeElement.id : '';
  var scroll = box.querySelector('.drawer') ? box.querySelector('.drawer').scrollTop : 0;
  var l = G.letter, f = function (id, label, val, ph) {
    return '<label class="label" for="' + id + '">' + label + '</label><input class="inp" id="' + id + '" value="' + esc(val) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>';
  };
  var inner;
  if (!l) {
    inner = G.err ? '<div class="err" role="alert">' + esc(G.err) + '</div>' : '<div style="padding:30px 0;text-align:center"><div class="spin" style="margin:0 auto 10px"></div>Getting the details…</div>';
  } else if (G.done) {
    inner = '<div class="okmsg" role="status" style="font-size:15px;line-height:1.6">✓ The GAF was sent to:<br>' + G.done.map(esc).join('<br>') + '</div>' +
      (G.skipped && G.skipped.length ? '<p class="hint warn">No ID picture was found for: ' + G.skipped.map(esc).join(', ') + '.</p>' : '') +
      '<button type="button" class="pill gold" style="width:100%;margin-top:16px" data-g="close">Done</button>';
  } else {
    var gs = l.guests.map(function (g, i) {
      return '<div style="border:1.5px solid var(--line);border-radius:14px;padding:4px 12px 12px;margin-top:10px;background:#fff">' +
        '<label class="label" for="gn' + i + '" style="margin-top:8px">Guest ' + (i + 1) + ' · name</label><input class="inp" id="gn' + i + '" data-gi="' + i + '" data-gk="name" value="' + esc(g.name) + '">' +
        '<div class="two" style="margin-top:8px"><div><label class="sr" for="gp' + i + '">Proof of ID</label><input class="inp" id="gp' + i + '" data-gi="' + i + '" data-gk="proof" placeholder="ID type (e.g. BIR)" value="' + esc(g.proof) + '"></div>' +
        '<div><label class="sr" for="gr' + i + '">Reason</label><input class="inp" id="gr' + i + '" data-gi="' + i + '" data-gk="reason" placeholder="Reason" value="' + esc(g.reason) + '"></div></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px;font-size:14px">' +
        (g.has_id ? '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-gatt="' + i + '"' + (g.attach ? ' checked' : '') + '> Attach their ID</label>' : '<small style="color:var(--muted)">No ID on file' + (g.guest_no ? ' (deleted)' : '') + '</small>') +
        '<button type="button" class="linkbtn" data-g="del" data-i="' + i + '" style="color:var(--bad)">Remove</button></div></div>';
    }).join('');
    inner =
      '<p class="hint" style="margin-top:0">Everything is filled in from the booking. Please check each line — you can change anything.</p>' +
      '<div class="k2" style="margin-top:18px">The letter</div>' +
      f('g_date', 'Date', l.date) + f('g_owner', 'Unit owner', l.owner) +
      '<div class="two"><div>' + f('g_building', 'Tower / building', l.building) + '</div><div>' + f('g_unit', 'Unit no.', l.unit) + '</div></div>' +
      f('g_in', 'Check-in date &amp; time', l.check_in, 'Oct. 03, 2026 @6pm') + f('g_out', 'Check-out date &amp; time', l.check_out, 'Oct. 04, 2026 @4pm') +
      '<div class="k2" style="margin-top:22px">Authorized guests</div>' + gs +
      '<button type="button" class="pill line sm" style="margin-top:10px" data-g="add">+ Add a guest (e.g. a child)</button>' +
      f('g_contact', 'Contact no.', l.contact) +
      '<span class="label">Signature</span>' +
      (G.data.has_signature
        ? '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:14px">✓ Saved signature will be used<label class="linkbtn" style="cursor:pointer">Change<input type="file" id="g_sig" accept="image/*" hidden></label></div>'
        : '<p class="hint" style="margin:0 0 8px">No signature saved yet. Upload a clear photo of the owner\'s signature on white paper — it is saved for next time.</p><label class="pill line sm" style="cursor:pointer">Upload signature<input type="file" id="g_sig" accept="image/*" hidden></label>') +
      '<div class="k2" style="margin-top:24px">The email</div>' +
      '<label class="label" for="g_admin">Building admin emails (one per line)</label><textarea class="inp" id="g_admin" rows="5" style="padding:10px 14px;line-height:1.5">' + esc(l.admin_to) + '</textarea>' +
      f('g_guest', 'Guest\'s Gmail (gets a copy)', l.guest_to) +
      f('g_subject', 'Subject', l.subject) +
      '<label class="label" for="g_body">Message</label><textarea class="inp" id="g_body" rows="11" style="padding:10px 14px;line-height:1.5">' + esc(l.body) + '</textarea>' +
      (G.err ? '<div class="err" role="alert" style="margin-top:14px">' + esc(G.err) + '</div>' : '') +
      (G.msg ? '<div class="okmsg" role="status" style="margin-top:14px">' + esc(G.msg) + '</div>' : '') +
      '<div class="two" style="margin-top:16px"><button type="button" class="pill line" data-g="preview"' + (G.busy ? ' disabled' : '') + '>Preview PDF</button>' +
      '<button type="button" class="pill gold" data-g="send"' + (G.busy ? ' disabled' : '') + '>' + (G.busy ? 'Please wait…' : 'Send GAF') + '</button></div>' +
      '<p class="hint">The building details and admin emails are remembered for next time.</p>';
  }
  box.innerHTML = '<div class="shade" data-g="close"></div><aside class="drawer" role="dialog" aria-label="Guest authorization letter">' +
    '<div class="dh"><div class="t">GAF · ' + esc(G.ref) + '</div><button type="button" data-g="close" aria-label="Close">✕</button></div>' +
    '<div class="sec" style="border:0;padding-bottom:40px">' + inner + '</div></aside>';
  box.querySelector('.drawer').scrollTop = scroll;
  if (keep && document.getElementById(keep)) document.getElementById(keep).focus();
}

function gafRead() {   // the letter as the server wants it
  var l = G.letter;
  return {
    date: l.date, owner: l.owner, building: l.building, unit: l.unit, check_in: l.check_in, check_out: l.check_out, contact: l.contact,
    guests: l.guests.map(function (g) { return { name: g.name, proof: g.proof, reason: g.reason, guest_no: g.guest_no, attach: g.attach }; }),
    admin_to: l.admin_to, guest_to: l.guest_to, subject: l.subject, body: l.body
  };
}

function gafClick(e) {
  var el = e.target.closest('[data-g]');
  if (!el || el.disabled) return;
  var k = el.dataset.g;
  if (k === 'close') { if (G && G.busy && G.letter) return; gafClose(); return; }
  if (k === 'add') { G.letter.guests.push({ name: '', proof: '', reason: 'Visit', guest_no: 0, attach: false, has_id: false }); G.err = ''; gafRender(); var n = document.getElementById('gn' + (G.letter.guests.length - 1)); if (n) n.focus(); return; }
  if (k === 'del') { G.letter.guests.splice(+el.dataset.i, 1); gafRender(); return; }
  if (k === 'preview' || k === 'send') {
    if (k === 'send') {
      var n2 = G.letter.admin_to.split(/[\s,;]+/).filter(String).length + G.letter.guest_to.split(/[\s,;]+/).filter(String).length;
      if (!window.confirm('Send the GAF for ' + G.ref + ' to ' + n2 + ' email address' + (n2 === 1 ? '' : 'es') + '?')) return;
    }
    G.busy = true; G.err = ''; G.msg = ''; gafRender();
    post({ action: 'staffGaf', op: k, ref: G.ref, letter: gafRead() }, 0).then(function (d) {
      G.busy = false;
      if (k === 'preview') {
        gafRender(); gafShowPdf(d);
        if (d.skipped && d.skipped.length) { G.msg = 'No ID picture was found for: ' + d.skipped.join(', ') + '.'; gafRender(); }
      } else {
        GAF_SENT[G.ref] = d.data.sent_at; G.done = d.sent_to; G.skipped = d.skipped; gafRender();
        S.msg = 'GAF sent for ' + G.ref + '.';
      }
    }).catch(gafFail);
  }
}

function gafInput(e) {
  var t = e.target, l = G && G.letter;
  if (!l) return;
  var map = { g_date: 'date', g_owner: 'owner', g_building: 'building', g_unit: 'unit', g_in: 'check_in', g_out: 'check_out', g_contact: 'contact', g_admin: 'admin_to', g_guest: 'guest_to', g_subject: 'subject', g_body: 'body' };
  if (t.dataset.gi != null) { l.guests[+t.dataset.gi][t.dataset.gk] = t.value; return; }
  if (!map[t.id]) return;
  l[map[t.id]] = t.value;
  if (t.id === 'g_subject') G.subjEdited = true;
  if (t.id === 'g_body') G.bodyEdited = true;
  // keep the subject and message in step with the details, until staff type in them
  var b = gafBooking();
  if (!G.subjEdited && (t.id === 'g_building' || t.id === 'g_unit')) { l.subject = gafSubject(l); document.getElementById('g_subject').value = l.subject; }
  if (!G.bodyEdited && b && t.id === 'g_owner') { l.body = gafBody(l, b); document.getElementById('g_body').value = l.body; }
}

function gafChange(e) {
  var t = e.target;
  if (t.dataset.gatt != null) { G.letter.guests[+t.dataset.gatt].attach = t.checked; return; }
  if (t.id !== 'g_sig' || !t.files || !t.files[0]) return;
  G.busy = true; G.err = ''; G.msg = ''; gafRender();
  gafShrink(t.files[0]).then(function (img) {
    return post({ action: 'staffGaf', op: 'signature', mime: img.mime, data: img.data }, 0);
  }).then(function () {
    G.busy = false; G.data.has_signature = true; G.msg = 'Signature saved.'; gafRender();
  }).catch(gafFail);
}

function gafShrink(file) {   // makes the signature photo small enough to send quickly
  return new Promise(function (ok, bad) {
    var r = new FileReader();
    r.onerror = function () { bad(new Error('Could not read that picture.')); };
    r.onload = function () {
      var im = new Image();
      im.onerror = function () { bad(new Error('Please choose a JPG or PNG picture.')); };
      im.onload = function () {
        var w = im.width, h = im.height, max = 1000, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        ok({ mime: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.9).split(',')[1] });
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

function gafShowPdf(d) {
  var bin = atob(d.data), arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  var url = URL.createObjectURL(new Blob([arr], { type: 'application/pdf' }));
  var v = document.createElement('div');
  v.className = 'viewer'; v.setAttribute('role', 'dialog'); v.style.zIndex = '70';
  v.innerHTML = '<p>Preview · not sent yet</p><iframe src="' + url + '" title="GAF preview"></iframe>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a class="pill ghost sm" href="' + url + '" target="_blank" rel="noopener" download="' + esc(d.name) + '">Open PDF</a>' +
    '<button type="button" class="pill gold sm">Back to the form</button></div>';
  document.body.appendChild(v);
  v.querySelector('button').onclick = function () { v.remove(); URL.revokeObjectURL(url); };
}

// Lets the booking panel's button open the form (not a page in the menu).
PAGES.gaf = {
  show: function () { return false; },
  click: function (e) {
    var el = e.target.closest('[data-gaf]');
    if (!el) return false;
    gafOpen(el.dataset.gaf);
    return true;
  }
};
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && G && !G.busy && !document.querySelector('.viewer')) gafClose(); });