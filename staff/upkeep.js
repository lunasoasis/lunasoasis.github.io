/* Luna's Oasis — staff portal: Checklist & upkeep page (follows the design). */
'use strict';
var CK_STATUS = [['OK', '#4F7A63', '#fff'], ['Missing', '#E6D3AE', '#2E2621'], ['Damaged', '#6B4A6E', '#fff'], ['Dirty', '#8C6A3C', '#fff'], ['Others', '#2E2621', '#fff']];
var UP_TYPES = { 'Cleaning': ['#1B1714', '#fff', 'Clean'], 'Inspection': ['#2E2621', '#fff', 'Inspect'], 'Lights & electrical': ['#EAD9B5', '#2E2621', 'Lights'],
  'Restock': ['#D3C4AA', '#2E2621', 'Restock'], 'Repair': ['#8C6A3C', '#fff', 'Repair'] };
var DAYNAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function todayKey() { return new Date(Date.now() + PH).toISOString().slice(0, 10); }
function upChip(t) { var c = UP_TYPES[t] || ['#E6DCCB', '#2E2621', 'Task']; return 'background:' + c[0] + ';color:' + c[1]; }
function ckBookings() {
  var now = nowMs();
  return S.data.bookings.filter(function (b) {
    return active(b) && ms(b.check_in) <= now + 3 * 24 * HOUR && ms(b.check_out) >= now - 14 * 24 * HOUR;
  }).sort(function (a, b) { return Math.abs(ms(a.check_out) - now) - Math.abs(ms(b.check_out) - now); });
}
function lastCheck(ref) {   // latest saved checklist for a booking: {at, by, map}
  var logs = S.up.logs.filter(function (l) { return l.ref === ref; });
  if (!logs.length) return null;
  var at = logs.reduce(function (m, l) { return l.at > m ? l.at : m; }, '');
  var map = {}, by = '';
  logs.filter(function (l) { return l.at === at; }).forEach(function (l) { map[l.item_id] = { status: l.status, note: l.note }; by = l.by; });
  return { at: at, by: by, map: map };
}
function pickCk(ref) {
  var lc = ref ? lastCheck(ref) : null;
  S.ck = { ref: ref || '', res: lc ? JSON.parse(JSON.stringify(lc.map)) : {} };
}
function rooms() {
  var r = [];
  S.up.items.forEach(function (it) { if (r.indexOf(it.area) === -1) r.push(it.area); });
  return r;
}

function checklistHtml() {
  var fin = isFinance(), list = ckBookings();
  if (S.ck.ref === undefined || (S.ck.ref && !list.some(function (b) { return b.ref === S.ck.ref; }))) pickCk(list[0] ? list[0].ref : '');
  var R = rooms();
  if (R.indexOf(S.room) === -1) S.room = R[0] || '';
  var ref = S.ck.ref, b = ref && S.data.bookings.filter(function (x) { return x.ref === ref; })[0];
  var lc = ref ? lastCheck(ref) : null;
  var done = 0, issues = 0, total = S.up.items.length;
  S.up.items.forEach(function (it) { var r = S.ck.res[it.id]; if (r && r.status) { done++; if (r.status !== 'OK') issues++; } });
  var tabs = R.map(function (a) {
    var its = S.up.items.filter(function (it) { return it.area === a; });
    var all = its.every(function (it) { return S.ck.res[it.id] && S.ck.res[it.id].status; });
    return '<button type="button" class="rtab" data-room="' + esc(a) + '" aria-pressed="' + (S.room === a) + '">' + esc(a) + (all && its.length ? ' ✓' : '') + '</button>';
  }).join('');
  var rows = S.up.items.filter(function (it) { return it.area === S.room; }).map(function (it) {
    var r = S.ck.res[it.id] || {};
    return '<div class="ckrow2"><div class="ckname2"><b>' + esc(it.item) + '</b><span>Expected: ' + esc(it.qty) + '</span></div>' +
      '<div class="ckbtns" role="group" aria-label="' + esc(it.item) + ' status">' + CK_STATUS.map(function (s) {
        var on = r.status === s[0];
        return '<button type="button" data-ck="' + esc(it.id) + '" data-cks="' + s[0] + '" aria-pressed="' + on + '"' + (on ? ' style="background:' + s[1] + ';color:' + s[2] + ';border-color:' + s[1] + '"' : '') + '>' + s[0] + '</button>';
      }).join('') + '</div>' +
      (S.editItems && fin ? '<button type="button" class="xbtn" data-itdel="' + esc(it.id) + '" aria-label="Remove ' + esc(it.item) + '">✕</button>' : '') +
      (r.status === 'Others' ? '<label class="sr" for="ckn-' + esc(it.id) + '">Note for ' + esc(it.item) + '</label><input class="inp cknote2" id="ckn-' + esc(it.id) + '" data-ckn="' + esc(it.id) + '" placeholder="Type what\'s wrong, e.g. stain on the cover, needs batteries…" value="' + esc(r.note || '') + '">' : '') +
      '</div>';
  }).join('');
  var opts = list.map(function (x) {
    return '<option value="' + esc(x.ref) + '"' + (x.ref === ref ? ' selected' : '') + '>' + esc(x.ref) + ' · ' + esc(lead(x)) + '</option>';
  }).join('');
  var A = S.addItem;
  return '<section class="panel">' +
    '<div class="ckhead"><div><h2 class="ph">Unit item checklist</h2>' +
    (b ? '<div class="cksub">Turnover check after ' + esc(b.ref) + ' (' + esc(lead(b)) + ') · time-out ' + esc(whenS(b.check_out)) + '</div>' : '<div class="cksub">No guests checking out around now.</div>') +
    (list.length > 1 ? '<label class="cksel"><span>Checking</span><select class="inp sel" id="cksel">' + opts + '</select></label>' : '') +
    (lc ? '<div class="cksub" style="color:var(--ok)">Last checked by ' + esc(staffName(lc.by)) + ' · ' + esc(when(lc.at)) + '</div>' : '') +
    '</div>' +
    '<div class="ckprog"><div><span>' + done + ' of ' + total + ' checked</span><span>' + plural(issues, 'issue') + '</span></div><div class="ckbar"><i style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></i></div></div></div>' +
    '<div class="rtabs">' + tabs + '</div>' +
    '<div class="cklist">' + (rows || '<p class="empty">No items in this room yet.</p>') + '</div>' +
    (A.open ? '<div class="additem"><label class="sr" for="ai">Item</label><input class="inp" id="ai" placeholder="Item name (e.g. Electric fan)" value="' + esc(A.item) + '">' +
      '<label class="sr" for="aq">Expected</label><input class="inp" id="aq" placeholder="Expected (e.g. 2)" value="' + esc(A.qty) + '">' +
      '<button type="button" class="ubtn green" data-act="itadd"' + (S.busy ? ' disabled' : '') + '>Add to ' + esc(S.room) + '</button><button type="button" class="ubtn" data-act="itcancel">Cancel</button></div>' : '') +
    '<div class="ckfoot">' + (A.open ? '' : '<button type="button" class="ubtn dashed" data-act="itopen">+ Add item to this room</button>') +
    (fin ? '<button type="button" class="linkbtn" data-act="itedit">' + (S.editItems ? 'Done editing' : 'Remove items') + '</button>' : '') +
    '<button type="button" class="ubtn dark" style="margin-left:auto" data-act="cksave"' + (S.busy || !ref ? ' disabled' : '') + '>Submit checklist</button></div>' +
    '</section>';
}

function upkeepCalHtml() {
  var y = S.uy, m = S.um, first = new Date(Date.UTC(y, m, 1)).getUTCDay(), dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), today = todayKey();
  var cells = '';
  for (var i = 0; i < first; i++) cells += '<span class="ucell blank"></span>';
  for (var d = 1; d <= dim; d++) {
    var key = y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d;
    var seen = {}, chips = '';
    S.up.upkeep.forEach(function (u) {
      if (u.at.slice(0, 10) === key && !seen[u.task]) { seen[u.task] = 1; chips += '<i style="' + upChip(u.task) + '">' + esc((UP_TYPES[u.task] || [0, 0, 'Task'])[2]) + '</i>'; }
    });
    cells += '<button type="button" class="ucell' + (key === S.upDay ? ' on' : '') + '" data-uday="' + key + '" aria-label="' + MONTHS[m] + ' ' + d + '">' +
      '<b>' + d + (key === today ? ' · Today' : '') + '</b><span>' + chips + '</span></button>';
  }
  var legend = Object.keys(UP_TYPES).map(function (t) { return '<span><i style="background:' + UP_TYPES[t][0] + '"></i>' + esc(t) + '</span>'; }).join('');
  return '<section class="panel" style="flex:999 1 560px">' +
    '<div class="uhead"><h2 class="ph">Upkeep calendar · ' + MONTHS[m] + ' ' + y + '</h2>' +
    '<div class="calnav"><button type="button" class="round" data-umon="-1" aria-label="Previous month">‹</button><button type="button" class="round" data-umon="1" aria-label="Next month">›</button></div></div>' +
    '<div class="ulegend">' + legend + '</div>' +
    '<div class="udow"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>' +
    '<div class="ugrid">' + cells + '</div></section>';
}

function upkeepLogHtml() {
  var fin = isFinance(), day = S.upDay, dd = new Date(day + 'T00:00:00Z');
  var label = DAYNAMES[dd.getUTCDay()] + ', ' + MONTHS[dd.getUTCMonth()] + ' ' + dd.getUTCDate();
  var short = MON[dd.getUTCMonth()] + ' ' + dd.getUTCDate();
  var logs = S.up.upkeep.filter(function (u) { return u.at.slice(0, 10) === day; }).sort(function (a, b) { return a.at < b.at ? -1 : 1; });
  var F = S.uform;
  return '<section class="panel ulog" style="flex:1 1 340px">' +
    '<div><div class="k2">Upkeep log</div><h2 class="ph" style="font-size:24px;margin-top:4px">' + label + '</h2></div>' +
    (logs.length ? logs.map(function (u) {
      var t = when(u.at).split(' · ')[1] || '';
      var canDel = fin || u.by === S.me.email;
      return '<div class="uentry"><div class="ue1"><i style="' + upChip(u.task) + '">' + esc(UP_TYPES[u.task] ? u.task : 'Task') + '</i><span>' + esc(t) +
        (canDel ? ' <button type="button" class="xbtn" data-updel="' + esc(u.id) + '" aria-label="Delete">✕</button>' : '') + '</span></div>' +
        '<div class="ue2">' + esc(UP_TYPES[u.task] ? (u.notes || '—') : u.task + (u.notes ? ' · ' + u.notes : '')) + '</div><div class="ue3">by ' + esc(staffName(u.by)) + '</div></div>';
    }).join('') : '<p style="color:var(--muted);font-size:14px;margin:0">Nothing logged for this day yet.</p>') +
    '<div class="uform"><b>Log a task</b>' +
    '<label class="k2" for="ut">Task</label><select class="inp" id="ut">' + Object.keys(UP_TYPES).map(function (t) { return '<option' + (F.task === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>' +
    '<label class="k2" for="utm">Time done</label><input class="inp" id="utm" type="time" value="' + esc(F.time) + '">' +
    '<label class="k2" for="un">Notes</label><input class="inp" id="un" placeholder="e.g. Replaced bathroom bulb" value="' + esc(F.notes) + '">' +
    '<button type="button" class="ubtn green" style="width:100%" data-act="upadd"' + (S.busy ? ' disabled' : '') + '>Add to ' + short + '</button></div></section>';
}

function upkeepHtml() {
  if (!S.up) return '<div class="hello"><div><h1>Checklist &amp; upkeep</h1><p>Every item in place, every corner cozy.</p></div></div><div class="loading"><div class="spin"></div>Loading checklist…</div>';
  return '<div class="hello"><div><h1>Checklist &amp; upkeep</h1><p>Every item in place, every corner cozy.</p></div>' +
    '<button type="button" class="pill ghost sm" data-act="uprefresh">↻ Refresh</button></div>' +
    (S.error ? '<div class="err" role="alert">' + esc(S.error) + '</div>' : '') +
    (S.umsg ? '<div class="okmsg" role="status">' + esc(S.umsg) + '</div>' : '') +
    checklistHtml() +
    '<div class="cols">' + upkeepCalHtml() + upkeepLogHtml() + '</div>';
}
function loadUp() {
  post({ action: 'staffUpkeepData' }).then(function (d) { S.up = d; render(); }).catch(fail);
}
function upAct(body, msg) {
  S.busy = true; S.error = ''; S.umsg = ''; render();
  return post(body).then(function (d) {
    if (d.bookings) { S.data = d.bookings; delete d.bookings; }
    S.up = d; S.busy = false; S.umsg = msg || ''; render();
  }).catch(fail);
}

PAGES.upkeep = {
  order: 4, label: 'Checklist', html: upkeepHtml,
  enter: function () {
    S.umsg = ''; S.error = '';
    if (!S.upDay) { S.upDay = todayKey(); S.uy = +S.upDay.slice(0, 4); S.um = +S.upDay.slice(5, 7) - 1; }
    if (!S.uform || S.uform.time === undefined) { var t = new Date(Date.now() + PH).toISOString().slice(11, 16); S.uform = { task: 'Cleaning', time: t, notes: '' }; }
    if (!S.addItem) S.addItem = { open: false, item: '', qty: '1' };
    if (!S.up) loadUp();
  },
  click: function (e) {
    var el = e.target.closest('[data-ck],[data-room],[data-uday],[data-umon],[data-updel],[data-itdel],[data-act="uprefresh"],[data-act="cksave"],[data-act="upadd"],[data-act="itadd"],[data-act="itopen"],[data-act="itcancel"],[data-act="itedit"]');
    if (!el || el.disabled) return false;
    var d = el.dataset;
    if (d.ck) { var cur = S.ck.res[d.ck] || {}; S.ck.res[d.ck] = cur.status === d.cks ? {} : { status: d.cks, note: d.cks === 'Others' ? cur.note || '' : '' }; S.umsg = ''; S.error = ''; render(); return true; }
    if (d.room) { S.room = d.room; render(); return true; }
    if (d.uday) { S.upDay = d.uday; render(); return true; }
    if (d.umon) { S.um += +d.umon; if (S.um < 0) { S.um = 11; S.uy--; } if (S.um > 11) { S.um = 0; S.uy++; } render(); return true; }
    if (d.updel) { if (window.confirm('Delete this upkeep entry?')) upAct({ action: 'staffUpkeep', op: 'delete', id: d.updel }, 'Entry deleted.'); return true; }
    if (d.itdel) { if (window.confirm('Remove this item from the checklist?')) upAct({ action: 'staffChecklistItem', op: 'remove', item_id: d.itdel }, 'Item removed.'); return true; }
    switch (d.act) {
      case 'uprefresh': S.up = null; S.ck = {}; loadAll(); loadUp(); break;
      case 'itopen': S.addItem = { open: true, item: '', qty: '1' }; render(); break;
      case 'itcancel': S.addItem.open = false; render(); break;
      case 'itedit': S.editItems = !S.editItems; render(); break;
      case 'itadd':
        if (S.addItem.item.trim().length < 2) { S.error = 'Please type the item name.'; render(); break; }
        upAct({ action: 'staffChecklistItem', op: 'add', area: S.room, item: S.addItem.item, qty: S.addItem.qty || '1' }, S.addItem.item.trim() + ' added to ' + S.room + '.')
          .then(function () { if (!S.error) S.addItem = { open: false, item: '', qty: '1' }; render(); });
        break;
      case 'cksave':
        var missing = S.up.items.filter(function (it) { return !(S.ck.res[it.id] && S.ck.res[it.id].status); });
        if (missing.length) {
          S.room = missing[0].area;
          S.error = plural(missing.length, 'item') + ' still to check. Starting with ' + missing[0].area + '.'; render(); window.scrollTo(0, 0); break;
        }
        var noNote = S.up.items.filter(function (it) { var r = S.ck.res[it.id]; return r.status === 'Others' && !String(r.note || '').trim(); })[0];
        if (noNote) { S.room = noNote.area; S.error = 'Please type what is wrong for "' + noNote.item + '".'; render(); break; }
        var results = S.up.items.map(function (it) { var r = S.ck.res[it.id]; return { item_id: it.id, status: r.status, note: r.note || '' }; });
        var nIss = results.filter(function (r) { return r.status !== 'OK'; }).length;
        upAct({ action: 'staffSaveChecklist', ref: S.ck.ref, results: results }, nIss ? plural(nIss, 'issue') + ' saved for ' + S.ck.ref + '. The booking is flagged.' : 'All OK for ' + S.ck.ref + '. "Items complete & unit clean" is ticked on the deposit.')
          .then(function () { window.scrollTo(0, 0); });
        break;
      case 'upadd':
        upAct({ action: 'staffUpkeep', op: 'log', date: S.upDay, time: S.uform.time, task: S.uform.task, notes: S.uform.notes }, S.uform.task + ' logged.')
          .then(function () { if (!S.error) S.uform.notes = ''; render(); });
        break;
    }
    return true;
  },
  input: function (e) {
    if (e.target.dataset.ckn) { (S.ck.res[e.target.dataset.ckn] || {}).note = e.target.value; return true; }
    var id = e.target.id;
    if (id === 'utm') { S.uform.time = e.target.value; return true; }
    if (id === 'un') { S.uform.notes = e.target.value; return true; }
    if (id === 'ai') { S.addItem.item = e.target.value; return true; }
    if (id === 'aq') { S.addItem.qty = e.target.value; return true; }
    return false;
  },
  change: function (e) {
    var id = e.target.id;
    if (id === 'cksel') { pickCk(e.target.value); S.umsg = ''; render(); return true; }
    if (id === 'ut') { S.uform.task = e.target.value; return true; }
    if (id === 'utm') { S.uform.time = e.target.value; return true; }
    return false;
  }
};