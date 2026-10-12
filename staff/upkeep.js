/* Luna's Oasis — staff portal: Checklist & upkeep page. */
'use strict';
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
function upkeepHtml() {
  if (!S.up) return '<div class="loading"><div class="spin"></div>Loading checklist…</div>';
  var fin = isFinance(), list = ckBookings();
  if (S.ck.ref === undefined || (S.ck.ref && !list.some(function (b) { return b.ref === S.ck.ref; }))) pickCk(list[0] ? list[0].ref : '');
  var ref = S.ck.ref, b = ref && S.data.bookings.filter(function (x) { return x.ref === ref; })[0];
  var lc = ref ? lastCheck(ref) : null;
  var opts = list.map(function (x) {
    return '<option value="' + esc(x.ref) + '"' + (x.ref === ref ? ' selected' : '') + '>' + esc(x.ref) + ' · ' + esc(lead(x)) + ' · out ' + esc(when(x.check_out)) + '</option>';
  }).join('');
  var areas = [];
  S.up.items.forEach(function (it) { if (areas.indexOf(it.area) === -1) areas.push(it.area); });
  var done = 0, issues = 0;
  S.up.items.forEach(function (it) { var r = S.ck.res[it.id]; if (r && r.status) { done++; if (r.status !== 'OK') issues++; } });
  var itemsHtml = areas.map(function (a) {
    return '<h3 class="label">' + esc(a) + '</h3>' + S.up.items.filter(function (it) { return it.area === a; }).map(function (it) {
      var r = S.ck.res[it.id] || {};
      return '<div class="ckrow' + (r.status && r.status !== 'OK' ? ' bad' : '') + '"><span class="ckname">' + esc(it.item) + (it.qty > 1 ? ' <small>× ' + it.qty + '</small>' : '') + '</span>' +
        '<span class="ckseg">' + ['OK', 'Missing', 'Damaged'].map(function (s) { return '<button type="button" data-ck="' + esc(it.id) + '" data-cks="' + s + '" aria-pressed="' + (r.status === s) + '">' + s + '</button>'; }).join('') + '</span>' +
        (r.status && r.status !== 'OK' ? '<input class="inp cknote" data-ckn="' + esc(it.id) + '" placeholder="What happened? (e.g. 1 glass broken)" value="' + esc(r.note || '') + '">' : '') + '</div>';
    }).join('');
  }).join('');
  var staffOpts = '<option value="">Anyone</option>' + (S.data.staff || []).map(function (s) { return '<option value="' + esc(s.email) + '">' + esc(s.name) + '</option>'; }).join('');
  var tasks = S.up.upkeep.filter(function (u) { return S.upTab === 'done' ? u.status === 'Done' : u.status !== 'Done'; })
    .sort(function (a, c) { return S.upTab === 'done' ? (a.date < c.date ? 1 : -1) : (a.date > c.date ? 1 : -1); });
  var today = new Date(Date.now() + PH).toISOString().slice(0, 10);
  var taskHtml = tasks.map(function (u) {
    return '<div class="task"><label class="tcheck"><input type="checkbox" data-upd="' + esc(u.id) + '"' + (u.status === 'Done' ? ' checked' : '') + '><span><b>' + esc(u.task) + '</b>' +
      '<small>' + (u.date ? (u.date < today && u.status !== 'Done' ? '<span class="bal">Overdue · </span>' : '') + esc(when(u.date + 'T00:00').split(' · ')[0]) : '') + (u.assigned_to ? ' · ' + esc(staffName(u.assigned_to)) : ' · Anyone') + (u.notes ? ' · ' + esc(u.notes) : '') + '</small></span></label>' +
      (fin ? '<button type="button" class="xbtn" data-updel="' + esc(u.id) + '" aria-label="Delete task">✕</button>' : '') + '</div>';
  }).join('');
  var nTodo = S.up.upkeep.filter(function (u) { return u.status !== 'Done'; }).length;

  return '<div class="hello"><div><h1>Checklist &amp; upkeep</h1><p>Check the unit after every check-out, and keep track of cleaning and repairs.</p></div>' +
    '<button type="button" class="pill ghost sm" data-act="uprefresh">↻ Refresh</button></div>' +
    (S.error && !S.open ? '<div class="err" role="alert" style="margin-bottom:12px">' + esc(S.error) + '</div>' : '') +
    (S.umsg ? '<div class="okmsg" role="status" style="margin-bottom:12px">' + esc(S.umsg) + '</div>' : '') +
    '<div class="twocol" style="margin-top:0;align-items:start">' +
    '<section class="panel"><h2 class="ph">Check-out checklist</h2>' +
    (list.length ? '<label class="label" for="cksel">Booking</label><select class="inp" id="cksel">' + opts + '</select>' +
      (b ? '<p class="hint">' + esc(lead(b)) + ' · ' + b.pax + ' pax · out ' + esc(when(b.check_out)) + ' · <a href="#" data-open="' + esc(b.ref) + '" style="color:var(--bronze)">Open booking</a></p>' : '') +
      (lc ? '<p class="hint" style="color:var(--ok)">Last checked by ' + esc(staffName(lc.by)) + ' · ' + esc(when(lc.at)) + '</p>' : '<p class="hint">Not checked yet.</p>') +
      '<div class="acts" style="margin-top:6px"><button type="button" class="pill line sm" data-act="ckallok">Mark all OK</button>' +
      '<span class="hint" style="margin:0;align-self:center">' + done + ' of ' + S.up.items.length + ' checked' + (issues ? ' · <b class="bal">' + issues + ' issue' + (issues > 1 ? 's' : '') + '</b>' : '') + '</span></div>' +
      itemsHtml +
      '<button type="button" class="pill gold" style="width:100%;margin-top:16px" data-act="cksave"' + (S.busy || done < S.up.items.length ? ' disabled' : '') + '>' + (done < S.up.items.length ? 'Check all ' + S.up.items.length + ' items to save' : 'Save checklist') + '</button>' +
      '<p class="hint">If everything is OK, "Items complete &amp; unit clean" is ticked on the deposit automatically. Missing or damaged items flag the booking.</p>'
      : '<p class="empty">No guests checking out around now.</p>') +
    '</section>' +
    '<div>' +
    '<section class="panel"><div class="tools"><h2 class="ph">Upkeep</h2><div class="tabs"><button type="button" class="tab" data-uptab="todo" aria-pressed="' + (S.upTab !== 'done') + '">To do<span class="n">' + nTodo + '</span></button>' +
    '<button type="button" class="tab" data-uptab="done" aria-pressed="' + (S.upTab === 'done') + '">Done</button></div></div>' +
    (taskHtml || '<p class="empty" style="padding:14px 0">' + (S.upTab === 'done' ? 'Nothing done yet.' : 'All caught up.') + '</p>') +
    '<h3 class="label" style="margin-top:18px">Add a task</h3>' +
    '<label class="sr" for="ut">Task</label><input class="inp" id="ut" placeholder="e.g. Deep clean the bathroom" value="' + esc(S.uform.task) + '">' +
    '<div class="two" style="margin-top:8px"><div><label class="sr" for="ud">Date</label><input class="inp" id="ud" type="date" value="' + esc(S.uform.date) + '"></div>' +
    '<div><label class="sr" for="ua">Assign to</label><select class="inp" id="ua">' + staffOpts.replace('value="' + esc(S.uform.assigned_to) + '"', 'value="' + esc(S.uform.assigned_to) + '" selected') + '</select></div></div>' +
    '<label class="sr" for="un">Notes</label><input class="inp" id="un" style="margin-top:8px" placeholder="Notes (optional)" value="' + esc(S.uform.notes) + '">' +
    '<button type="button" class="pill dark sm" style="margin-top:10px" data-act="upadd"' + (S.busy ? ' disabled' : '') + '>Add task</button></section>' +
    (fin ? '<section class="panel" style="margin-top:14px"><details' + (S.itemsOpen ? ' open' : '') + ' id="itemsbox"><summary class="ph" style="cursor:pointer">Checklist items</summary>' +
      '<p class="hint">The things staff check after every check-out.</p>' +
      S.up.items.map(function (it) { return '<div class="row"><span>' + esc(it.area) + ' · ' + esc(it.item) + (it.qty > 1 ? ' × ' + it.qty : '') + '</span><button type="button" class="xbtn" data-itdel="' + esc(it.id) + '" aria-label="Remove ' + esc(it.item) + '">✕</button></div>'; }).join('') +
      '<h3 class="label">Add an item</h3><div class="two"><div><label class="sr" for="ia">Area</label><input class="inp" id="ia" list="areas" placeholder="Area (e.g. Kitchen)"><datalist id="areas">' + areas.map(function (a) { return '<option value="' + esc(a) + '">'; }).join('') + '</datalist></div>' +
      '<div><label class="sr" for="iq">Quantity</label><input class="inp" id="iq" type="number" min="1" value="1"></div></div>' +
      '<label class="sr" for="ii">Item</label><input class="inp" id="ii" style="margin-top:8px" placeholder="Item (e.g. Electric fan)">' +
      '<button type="button" class="pill line sm" style="margin-top:10px" data-act="itadd">Add item</button></details></section>' : '') +
    '</div></div>';
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
  enter: function () { S.umsg = ''; if (!S.up) loadUp(); },
  click: function (e) {
    var el = e.target.closest('[data-ck],[data-uptab],[data-updel],[data-itdel],[data-act="uprefresh"],[data-act="ckallok"],[data-act="cksave"],[data-act="upadd"],[data-act="itadd"]');
    if (!el || el.disabled) return false;
    var d = el.dataset;
    if (d.ck) { var cur = S.ck.res[d.ck] || {}; S.ck.res[d.ck] = { status: d.cks, note: d.cks === 'OK' ? '' : cur.note || '' }; S.umsg = ''; render(); return true; }
    if (d.uptab) { S.upTab = d.uptab; render(); return true; }
    if (d.updel) { if (window.confirm('Delete this task?')) upAct({ action: 'staffUpkeep', op: 'delete', id: d.updel }, 'Task deleted.'); return true; }
    if (d.itdel) { S.itemsOpen = true; if (window.confirm('Remove this item from the checklist?')) upAct({ action: 'staffChecklistItem', op: 'remove', item_id: d.itdel }, 'Item removed.'); return true; }
    switch (d.act) {
      case 'uprefresh': S.up = null; S.ck = {}; loadAll(); loadUp(); break;
      case 'ckallok': S.up.items.forEach(function (it) { if (!S.ck.res[it.id] || !S.ck.res[it.id].status) S.ck.res[it.id] = { status: 'OK', note: '' }; }); render(); break;
      case 'cksave':
        var results = S.up.items.map(function (it) { var r = S.ck.res[it.id] || {}; return { item_id: it.id, status: r.status, note: r.note || '' }; });
        var nIss = results.filter(function (r) { return r.status !== 'OK'; }).length;
        upAct({ action: 'staffSaveChecklist', ref: S.ck.ref, results: results }, nIss ? plural(nIss, 'issue') + ' saved for ' + S.ck.ref + '. The booking is flagged.' : 'All OK for ' + S.ck.ref + '. "Items complete & unit clean" is ticked on the deposit.');
        break;
      case 'upadd':
        if (S.uform.task.trim().length < 2) { S.error = 'Please type the task.'; render(); break; }
        upAct({ action: 'staffUpkeep', op: 'add', task: S.uform.task, date: S.uform.date, assigned_to: S.uform.assigned_to, notes: S.uform.notes }, 'Task added.')
          .then(function () { if (!S.error) S.uform = { task: '', date: '', assigned_to: '', notes: '' }; render(); });
        break;
      case 'itadd':
        S.itemsOpen = true;
        var ia = document.getElementById('ia').value, ii = document.getElementById('ii').value, iq = document.getElementById('iq').value;
        if (ii.trim().length < 2) { S.error = 'Please type the item name.'; render(); break; }
        upAct({ action: 'staffChecklistItem', op: 'add', area: ia, item: ii, qty: +iq || 1 }, 'Item added.');
        break;
    }
    return true;
  },
  input: function (e) {
    if (e.target.dataset.ckn) { (S.ck.res[e.target.dataset.ckn] || {}).note = e.target.value; return true; }
    var umap = { ut: 'task', ud: 'date', un: 'notes' };
    if (umap[e.target.id]) { S.uform[umap[e.target.id]] = e.target.value; return true; }
    return false;
  },
  change: function (e) {
    var id = e.target.id;
    if (id === 'cksel') { pickCk(e.target.value); S.umsg = ''; render(); return true; }
    if (id === 'ua') { S.uform.assigned_to = e.target.value; return true; }
    if (e.target.dataset.upd) { upAct({ action: 'staffUpkeep', op: 'status', id: e.target.dataset.upd, status: e.target.checked ? 'Done' : 'To do' }, e.target.checked ? 'Marked done.' : 'Moved back to To do.'); return true; }
    return false;
  }
};