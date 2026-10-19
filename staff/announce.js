/* Luna's Oasis — staff portal: Announcement board (follows the design). */
'use strict';
var IC = {
  trash: function (s) { return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>'; },
  upOn: '<svg width="26" height="24" viewBox="0 0 28 24" aria-hidden="true"><path d="M4 21V10l2.5-6 3.5 4.5h5L18.5 4 21 10v11z" fill="currentColor"/><path d="M8.6 14.2q1.4-1.2 2.8 0M13.6 14.2q1.4-1.2 2.8 0" fill="none" stroke="#2E2621" stroke-width="1.3" stroke-linecap="round"/><path d="M24.5 1a4 4 0 1 0 3.2 5.6A3.2 3.2 0 0 1 24.5 1z" fill="#C9A96E"/></svg>',
  upOff: '<svg width="26" height="24" viewBox="0 0 28 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M4 21V10l2.5-6 3.5 4.5h5L18.5 4 21 10v11z"/><circle cx="10" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/><path d="M11.5 17.2l1 .8 1-.8"/></svg>',
  downOn: '<svg width="40" height="24" viewBox="0 0 46 24" aria-hidden="true"><path d="M4 21V10l2.5-6 3.5 4.5h5L18.5 4 21 10v11z" fill="currentColor"/><path d="M8.8 13.2l1.8 1.8M10.6 13.2l-1.8 1.8M14 13.2l1.8 1.8M15.8 13.2L14 15" stroke="#EFE6D6" stroke-width="1.2" stroke-linecap="round"/><path d="M11 19q1.5-1.4 3 0" fill="none" stroke="#EFE6D6" stroke-width="1.2" stroke-linecap="round"/><path d="M25 2h17a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-11l-4 3v-3h-2a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z" fill="#7A5A2E"/><text x="33.5" y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" font-family="Jost, sans-serif">NO</text></svg>',
  downOff: '<svg width="26" height="24" viewBox="0 0 28 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M4 21V10l2.5-6 3.5 4.5h5L18.5 4 21 10v11z"/><path d="M8.8 14h2.4M13.8 14h2.4M11 18h3"/></svg>',
  chat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg>'
};

function anPerson(email) {
  var p = (S.an && S.an.people || []).filter(function (x) { return x.email === email; })[0];
  return p || { email: email, name: String(email || '').split('@')[0], role: 'operator', avatar: '' };
}
function anAvatar(p, size) {
  return '<span class="anav" style="width:' + size + 'px;height:' + size + 'px;box-shadow:0 0 0 2px #F3ECE0,0 0 0 3.5px ' + catOf(p).bg + '">' + catSvg(p, size) + '</span>';
}
function anWhen(v) { return whenS(v).replace(/^\w+ /, ''); }   // "Oct 8, 6:15 PM"
function anBadge(role) {
  return role === 'admin' ? '<span class="anrole dark">Admin</span>' : role === 'coadmin' ? '<span class="anrole dark">Co-admin</span>' : '<span class="anrole">Operator</span>';
}

function announceHtml() {
  var head = '<div class="hello"><div><h1>Announcement board</h1><p>Share news, vote on ideas, keep each other in the loop.</p></div>' +
    '<button type="button" class="pill ghost sm" data-act="anrefresh">↻ Refresh</button></div>';
  if (!S.an) return head + '<div class="loading"><div class="spin"></div>Loading posts…</div>';
  var me = anPerson(S.me.email), boss = isFinance(), F = S.anForm;
  var posts = S.an.posts.slice().sort(function (a, b) {
    return (b.pinned - a.pinned) || (S.anSort === 'top' ? (b.up - b.down) - (a.up - a.down) || (a.at < b.at ? 1 : -1) : (a.at < b.at ? 1 : -1));
  });
  var list = posts.map(function (p) {
    var who = anPerson(p.author), open = !!S.anOpen[p.id], draft = S.anDraft[p.id] || '';
    var comments = p.comments.map(function (c) {
      var cw = anPerson(c.author), mine = c.author === S.me.email;
      return '<div class="cmt' + (mine ? ' mine' : '') + '">' + anAvatar(cw, 30) + '<div class="bub"><div class="bh"><b>' + esc(cw.name) + '</b><span>' + esc(anWhen(c.at)) + '</span>' +
        (mine || boss ? '<button type="button" class="cdel" data-ancdel="' + esc(c.id) + '" aria-label="Delete comment">' + IC.trash(13) + '</button>' : '') + '</div>' +
        '<div class="bt">' + esc(c.text) + '</div></div></div>';
    }).join('');
    return '<article class="panel anpost' + (p.pinned ? ' pinned' : '') + '">' + (p.pinned ? '<span class="pintag">★ Pinned</span>' : '') +
      '<div class="anhead">' + anAvatar(who, 44) + '<div style="min-width:0"><div class="anname"><b>' + esc(who.name) + '</b>' + anBadge(who.role) + '</div><div class="antime">' + esc(anWhen(p.at)) + '</div></div>' +
      (p.author === S.me.email || boss ? '<button type="button" class="pdel" data-andel="' + esc(p.id) + '" aria-label="Delete announcement: ' + esc(p.title) + '">' + IC.trash(17) + '</button>' : '') + '</div>' +
      '<h2 class="antitle">' + esc(p.title) + '</h2>' + (p.body ? '<p class="anbody">' + esc(p.body) + '</p>' : '') +
      '<div class="anfoot">' +
      '<button type="button" class="vote' + (p.myVote === 1 ? ' up' : '') + '" data-anvote="' + esc(p.id) + '" data-v="1" title="Purr — I agree" aria-pressed="' + (p.myVote === 1) + '" aria-label="Agree, ' + p.up + ' so far">' + (p.myVote === 1 ? IC.upOn : IC.upOff) + '<span>' + p.up + '</span></button>' +
      '<button type="button" class="vote' + (p.myVote === -1 ? ' down' : '') + '" data-anvote="' + esc(p.id) + '" data-v="-1" title="Not convinced" aria-pressed="' + (p.myVote === -1) + '" aria-label="Disagree, ' + p.down + ' so far">' + (p.myVote === -1 ? IC.downOn : IC.downOff) + '<span>' + p.down + '</span></button>' +
      '<button type="button" class="cbtn' + (open ? ' on' : '') + '" data-antoggle="' + esc(p.id) + '" aria-expanded="' + open + '">' + IC.chat + plural(p.comments.length, 'comment') + '</button></div>' +
      (open ? '<div class="cbox">' + (comments || '<div class="nocmt">No comments yet — be the first.</div>') +
        '<div class="cin">' + anAvatar(me, 30) + '<label class="sr" for="anc-' + esc(p.id) + '">Write a comment</label><input id="anc-' + esc(p.id) + '" data-andraft="' + esc(p.id) + '" placeholder="Write a comment…" value="' + esc(draft) + '">' +
        '<button type="button" class="send' + (draft.trim() ? ' ready' : '') + '" data-ansend="' + esc(p.id) + '" aria-label="Send comment"' + (S.busy ? ' disabled' : '') + '>' + IC.send + '</button></div></div>' : '') +
      '</article>';
  }).join('');
  return '<div class="anwrap">' + head +
    (S.error ? '<div class="err" role="alert">' + esc(S.error) + '</div>' : '') +
    '<section class="panel ancompose"><div class="anhead">' + anAvatar(me, 40) + '<div><label class="k2" for="antitle" style="display:block">New announcement</label><div class="antime" style="font-size:13px">Posting as <b style="color:#2E2621">' + esc(me.name) + '</b></div></div></div>' +
    '<input class="inp" id="antitle" placeholder="Title" value="' + esc(F.title) + '">' +
    '<label class="sr" for="anbody">Message</label><textarea class="inp" id="anbody" rows="3" placeholder="What does the team need to know?">' + esc(F.body) + '</textarea>' +
    '<div class="anrow"><label class="anpin"><input type="checkbox" id="anpin"' + (F.pin ? ' checked' : '') + '> Pin to top</label>' +
    '<button type="button" class="ubtn dark" data-act="anpost"' + (S.busy ? ' disabled' : '') + '>Post announcement</button></div></section>' +
    '<div class="ansort"><div class="k2" style="color:var(--gold);font-size:13px">Latest posts</div><div class="tabs" role="group" aria-label="Sort">' +
    [['top', 'Top voted'], ['new', 'Newest']].map(function (o) { return '<button type="button" class="sortb" data-ansort="' + o[0] + '" aria-pressed="' + (S.anSort === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>' +
    (list || '<section class="panel"><p class="empty" style="padding:10px 0">No announcements yet. Post the first one above.</p></section>') +
    '</div>';
}

function loadAn(fresh) { post({ action: 'staffAnnounceData', fresh: !!fresh }).then(function (d) { S.an = d; saveCache('an', d); render(); }).catch(fail); }
function anAct(body, after) {
  S.busy = true; S.error = ''; render();
  return post(body, 0).then(function (d) { S.an = d; saveCache('an', d); S.busy = false; if (after) after(); render(); }).catch(fail);
}
function anSend(id) {
  var t = (S.anDraft[id] || '').trim();
  if (!t || S.busy) return;
  anAct({ action: 'staffAnnounce', op: 'comment', id: id, text: t }, function () {
    S.anDraft[id] = '';
    setTimeout(function () { var el = document.getElementById('anc-' + id); if (el) el.focus(); }, 0);
  });
}

PAGES.announce = {
  order: 5, label: 'Announcements', html: announceHtml,
  enter: function () {
    S.error = '';
    if (!S.anForm) { S.anForm = { title: '', body: '', pin: false }; S.anSort = 'top'; S.anOpen = {}; S.anDraft = {}; }
    if (!S.an) S.an = readCache('an');   // saved copy first, then the latest
    loadAn();
  },
  click: function (e) {
    var el = e.target.closest('[data-anvote],[data-antoggle],[data-ansend],[data-andel],[data-ancdel],[data-ansort],[data-act="anpost"],[data-act="anrefresh"]');
    if (!el || el.disabled) return false;
    var d = el.dataset;
    if (d.ansort) { S.anSort = d.ansort; render(); return true; }
    if (d.antoggle) { S.anOpen[d.antoggle] = !S.anOpen[d.antoggle]; render(); return true; }
    if (d.ansend) { anSend(d.ansend); return true; }
    if (d.anvote) {
      var p = S.an.posts.filter(function (x) { return x.id === d.anvote; })[0], v = +d.v;
      anAct({ action: 'staffAnnounce', op: 'vote', id: d.anvote, value: p && p.myVote === v ? 0 : v });
      return true;
    }
    if (d.andel) { if (window.confirm('Delete this announcement?')) anAct({ action: 'staffAnnounce', op: 'delete', id: d.andel }); return true; }
    if (d.ancdel) { if (window.confirm('Delete this comment?')) anAct({ action: 'staffAnnounce', op: 'uncomment', comment_id: d.ancdel }); return true; }
    if (d.act === 'anrefresh') { loadAn(true); return true; }
    if (d.act === 'anpost') {
      if (S.anForm.title.trim().length < 2) { S.error = 'Please type a title.'; render(); return true; }
      anAct({ action: 'staffAnnounce', op: 'post', title: S.anForm.title, body: S.anForm.body, pin: S.anForm.pin }, function () { S.anForm = { title: '', body: '', pin: false }; S.anSort = 'new'; });
      return true;
    }
    return false;
  },
  input: function (e) {
    var id = e.target.id;
    if (id === 'antitle') { S.anForm.title = e.target.value; return true; }
    if (id === 'anbody') { S.anForm.body = e.target.value; return true; }
    if (e.target.dataset.andraft) {
      S.anDraft[e.target.dataset.andraft] = e.target.value;
      var b = app.querySelector('[data-ansend="' + e.target.dataset.andraft + '"]'); if (b) b.classList.toggle('ready', !!e.target.value.trim());
      return true;
    }
    return false;
  },
  change: function (e) {
    if (e.target.id === 'anpin') { S.anForm.pin = e.target.checked; return true; }
    return false;
  }
};

// Enter sends a comment
app.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.andraft) { e.preventDefault(); anSend(e.target.dataset.andraft); }
});