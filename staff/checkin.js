/* Luna's Oasis — staff portal: check-in details email (unit number + key vault code).
   It is emailed to the guest automatically when a booking becomes fully paid.
   Booking panel → "Check-in details" lets staff check it, preview it and send it again.
   The admin and co-admin set the key vault code there once (it is remembered). */
'use strict';

var CK = null;   // the open box

// The button in the booking panel goes right under the GAF button.
(function () {
  var plainGaf = typeof gafButton === 'function' ? gafButton : function () { return ''; };
  gafButton = function (b) {
    var paid = b.balance <= 0;
    return plainGaf(b) + '<div style="margin-top:10px"><button type="button" class="pill line sm" data-ckin="' + esc(b.ref) + '" style="width:100%">🔑 Check-in details · unit &amp; key code</button>' +
      '<p class="hint" style="margin:6px 0 0">' + (paid ? 'Fully paid — the guest gets this by Gmail automatically. Tap to check or send again.' : 'Sent to the guest automatically once fully paid.') + '</p></div>';
  };
})();

// After recording a payment, say when the check-in email went out.
(function () {
  var plainAct = act;
  act = function (body, okMsg) {
    return plainAct(body, okMsg).then(function () {
      if (body.action === 'staffRecordPayment' && S.data && S.data.checkin_sent) {
        S.msg = (S.msg ? S.msg + ' ' : '') + 'Fully paid — check-in details (unit & key code) were emailed to ' + S.data.checkin_sent + '.';
        S.data.checkin_sent = ''; render();
      }
    });
  };
})();

function ckOpen(ref) {
  CK = { ref: ref, data: null, s: null, busy: true, err: '', msg: '' };
  ckRender();
  post({ action: 'staffCheckinData', ref: ref }).then(function (d) { CK.data = d; CK.s = d.settings; CK.busy = false; ckRender(); }).catch(ckFail);
}
function ckFail(err) {
  if (err && err.auth) { ckClose(); signOut('Please sign in again.'); return; }
  if (!CK) return;
  CK.busy = false; CK.err = err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not reach the server. Please check your connection.';
  ckRender();
}
function ckClose() { var x = document.getElementById('ckbox'); if (x) x.remove(); CK = null; document.body.style.overflow = ''; if (S.data) render(); }

function ckRender() {
  var box = document.getElementById('ckbox');
  if (!box) {
    box = document.createElement('div'); box.id = 'ckbox'; box.style.cssText = 'position:relative;z-index:60';
    document.body.appendChild(box); document.body.style.overflow = 'hidden';
    box.addEventListener('click', ckClick); box.addEventListener('input', ckInput); box.addEventListener('change', ckInput);
  }
  var scroll = box.querySelector('.drawer') ? box.querySelector('.drawer').scrollTop : 0;
  var b = S.data.bookings.filter(function (x) { return x.ref === CK.ref; })[0] || {};
  var inner;
  if (!CK.s) {
    inner = CK.err ? '<div class="err">' + esc(CK.err) + '</div>' : '<div style="padding:30px 0;text-align:center"><div class="spin" style="margin:0 auto 10px"></div>Getting the details…</div>';
  } else {
    var s = CK.s, ed = CK.data.can_edit, dis = ed ? '' : ' disabled';
    var f = function (id, label, v, ph, type) { return '<label class="label" for="' + id + '">' + label + '</label><input class="inp" id="' + id + '" value="' + esc(v) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + (type ? ' type="' + type + '"' : '') + dis + '>'; };
    var t = function (id, label, v, rows) { return '<label class="label" for="' + id + '">' + label + '</label><textarea class="inp" id="' + id + '" rows="' + rows + '" style="padding:10px 14px;line-height:1.5"' + dis + '>' + esc(v) + '</textarea>'; };
    inner =
      '<p class="hint" style="margin-top:0">Goes to <b>' + esc(b.guest_email || '') + '</b>' + (CK.data.sent_at ? ' · last sent ' + when(CK.data.sent_at) : ' · not sent yet') + '.</p>' +
      (!s.vault_code ? '<div class="err" style="margin-top:0">No key vault code saved yet — it will not send until the admin saves one here.</div>' : '') +
      f('ck_code', 'Key vault code', s.vault_code, 'e.g. 4821', ed ? 'text' : 'password') +
      f('ck_unit', 'Unit', s.unit) + f('ck_addr', 'Address', s.address) +
      t('ck_dir', 'How to get in (one step per line)', s.directions, 5) +
      '<div class="two">' + '<div>' + f('ck_wn', 'Wi-Fi name (optional)', s.wifi_name) + '</div><div>' + f('ck_wp', 'Wi-Fi password', s.wifi_pass) + '</div></div>' +
      t('ck_note', 'Good to know (check-out reminders)', s.note, 4) +
      (ed ? '<label style="display:flex;gap:10px;align-items:center;margin-top:12px;font-size:14px"><input type="checkbox" id="ck_auto"' + (s.auto ? ' checked' : '') + '> Send automatically when a booking is fully paid</label>' : '<p class="hint">Only the admin and co-admin can change these.</p>') +
      (CK.err ? '<div class="err" style="margin-top:14px">' + esc(CK.err) + '</div>' : '') +
      (CK.msg ? '<div class="okmsg" style="margin-top:14px">' + esc(CK.msg) + '</div>' : '') +
      (ed ? '<button type="button" class="pill line" style="width:100%;margin-top:16px" data-c="save"' + (CK.busy ? ' disabled' : '') + '>Save these details</button>' : '') +
      '<div class="two" style="margin-top:10px"><button type="button" class="pill line" data-c="preview"' + (CK.busy ? ' disabled' : '') + '>Preview email</button>' +
      '<button type="button" class="pill gold" data-c="send"' + (CK.busy || !s.vault_code ? ' disabled' : '') + '>' + (CK.busy ? 'Please wait…' : CK.data.sent_at ? 'Send again' : 'Send now') + '</button></div>' +
      '<p class="hint">Save first if you changed anything — the email uses the saved details.</p>';
  }
  box.innerHTML = '<div class="shade" data-c="close"></div><aside class="drawer" role="dialog" aria-label="Check-in details">' +
    '<div class="dh"><div class="t">Check-in · ' + esc(CK.ref) + '</div><button type="button" data-c="close" aria-label="Close">✕</button></div>' +
    '<div class="sec" style="border:0;padding-bottom:40px">' + inner + '</div></aside>';
  box.querySelector('.drawer').scrollTop = scroll;
}

function ckInput(e) {
  if (!CK || !CK.s) return;
  var map = { ck_code: 'vault_code', ck_unit: 'unit', ck_addr: 'address', ck_dir: 'directions', ck_wn: 'wifi_name', ck_wp: 'wifi_pass', ck_note: 'note' };
  if (e.target.id === 'ck_auto') { CK.s.auto = e.target.checked; return; }
  if (map[e.target.id]) CK.s[map[e.target.id]] = e.target.value;
}

function ckClick(e) {
  var el = e.target.closest('[data-c]');
  if (!el || el.disabled) return;
  var k = el.dataset.c;
  if (k === 'close') { if (!CK.busy) ckClose(); return; }
  if (k === 'save') {
    CK.busy = true; CK.err = ''; CK.msg = ''; ckRender();
    post({ action: 'staffCheckin', op: 'save', settings: CK.s }, 0).then(function (d) { CK.s = d.settings; CK.busy = false; CK.msg = 'Saved.'; ckRender(); }).catch(ckFail);
  }
  if (k === 'preview') {
    CK.busy = true; CK.err = ''; CK.msg = ''; ckRender();
    post({ action: 'staffCheckin', op: 'preview', ref: CK.ref }, 0).then(function (d) {
      CK.busy = false; ckRender();
      var v = document.createElement('div'); v.className = 'viewer'; v.style.zIndex = '70';
      v.innerHTML = '<p>Preview · not sent</p><iframe title="Email preview" style="background:#fff"></iframe><button type="button" class="pill gold sm">Back</button>';
      document.body.appendChild(v); v.querySelector('iframe').srcdoc = d.html;
      v.querySelector('button').onclick = function () { v.remove(); };
    }).catch(ckFail);
  }
  if (k === 'send') {
    var b = S.data.bookings.filter(function (x) { return x.ref === CK.ref; })[0];
    if (!window.confirm('Email the unit number and key vault code to ' + (b ? b.guest_email : 'the guest') + '?')) return;
    CK.busy = true; CK.err = ''; CK.msg = ''; ckRender();
    post({ action: 'staffCheckin', op: 'send', ref: CK.ref }, 0).then(function (d) { CK.data = d; CK.s = d.settings; CK.busy = false; CK.msg = 'Sent ✓'; ckRender(); }).catch(ckFail);
  }
}

PAGES.checkin = {
  show: function () { return false; },
  click: function (e) { var el = e.target.closest('[data-ckin]'); if (!el) return false; ckOpen(el.dataset.ckin); return true; }
};
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && CK && !CK.busy && !document.querySelector('.viewer')) ckClose(); });