// Luna's Oasis — chat helper for guests. Answers come from js/faq.js (no AI, no cost).
// If it doesn't know, it points the guest to Messenger.
(function () {
  var FAQ = (window.LUNA_FAQ || []).filter(function (f) { return f.a; });
  if (!FAQ.length) return;
  var MSG = (window.LUNA_CONFIG && window.LUNA_CONFIG.MESSENGER_URL) || 'https://www.facebook.com/';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var css = '#lchat{position:fixed;right:18px;bottom:18px;z-index:9999;font-family:Jost,Arial,sans-serif}' +
    '#lchat .lc-btn{width:62px;height:62px;border-radius:50%;border:0;cursor:pointer;background:#C9A96E;color:#12100E;box-shadow:0 12px 30px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;position:relative}' +
    '#lchat .lc-btn:focus-visible{outline:2px solid #F3ECE0;outline-offset:3px}' +
    '#lchat .lc-tip{position:absolute;right:72px;bottom:14px;white-space:nowrap;background:#F3ECE0;color:#2A231D;font-size:13px;padding:8px 12px;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,.35)}' +
    '#lchat .lc-win{position:absolute;right:0;bottom:76px;width:min(370px,calc(100vw - 36px));height:min(560px,calc(100vh - 120px));background:#12100E;border:1px solid rgba(201,169,110,.45);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden}' +
    '#lchat .lc-head{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(201,169,110,.25);color:#F3ECE0}' +
    '#lchat .lc-head b{display:block;font-family:"Cormorant Garamond",Georgia,serif;font-size:22px;font-weight:500;line-height:1}' +
    '#lchat .lc-head small{display:block;color:#B9AE9F;font-size:12px;margin-top:3px}' +
    '#lchat .lc-x{margin-left:auto;background:none;border:1px solid rgba(243,236,224,.35);color:#F3ECE0;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:16px}' +
    '#lchat .lc-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}' +
    '#lchat .lc-m{max-width:86%;padding:10px 13px;border-radius:16px;font-size:14px;line-height:1.55;white-space:pre-line;overflow-wrap:anywhere}' +
    '#lchat .lc-bot{background:#F3ECE0;color:#2A231D;border-bottom-left-radius:4px;align-self:flex-start}' +
    '#lchat .lc-me{background:#C9A96E;color:#12100E;border-bottom-right-radius:4px;align-self:flex-end}' +
    '#lchat .lc-link{display:inline-block;margin-top:8px;color:#7A5A2E;font-weight:600;text-decoration:underline;text-underline-offset:3px}' +
    '#lchat .lc-chips{display:flex;flex-wrap:wrap;gap:6px}' +
    '#lchat .lc-chip{border:1px solid rgba(201,169,110,.6);background:transparent;color:#F3ECE0;border-radius:999px;padding:7px 12px;font-size:12.5px;cursor:pointer;text-align:left;font-family:inherit}' +
    '#lchat .lc-chip:hover{background:rgba(201,169,110,.15)}' +
    '#lchat form{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(201,169,110,.25)}' +
    '#lchat input{flex:1;min-width:0;min-height:44px;border-radius:999px;border:1px solid rgba(201,169,110,.45);background:#1B1714;color:#F3ECE0;padding:0 16px;font-size:16px;font-family:inherit}' +
    '#lchat input:focus{outline:none;border-color:#C9A96E}' +
    '#lchat .lc-send{width:44px;height:44px;border-radius:50%;border:0;background:#C9A96E;color:#12100E;cursor:pointer;flex:none}' +
    '@media (max-width:600px){#lchat{right:12px;bottom:12px}#lchat .lc-btn{width:56px;height:56px}#lchat .lc-win{bottom:68px;height:min(540px,calc(100vh - 100px))}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var cat = '<svg width="34" height="34" viewBox="0 0 48 48" aria-hidden="true"><path d="M11 38V22l4.5-11 6.5 8h4l6.5-8L37 22v16a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4z" fill="#12100E"/><path d="M17 29q2.3 2 4.6 0M26.4 29q2.3 2 4.6 0" stroke="#C9A96E" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M22 34q2 1.6 4 0" stroke="#C9A96E" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  var root = document.createElement('div'); root.id = 'lchat';
  document.body.appendChild(root);
  var open = false, log = [], tipShown = false;
  try { tipShown = !!sessionStorage.getItem('lc_tip'); } catch (e) {}

  function norm(s) { return ' ' + String(s).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9₱ -]+/g, ' ').replace(/\s+/g, ' ') + ' '; }
  function find(text) {
    var t = norm(text), best = null, score = 0;
    FAQ.forEach(function (f) {
      var s = 0;
      f.keys.concat([f.q]).forEach(function (k) { var nk = norm(k); if (t.indexOf(nk) !== -1) s += nk.length; else if (nk.trim().length > 4 && t.indexOf(nk.trim()) !== -1) s += nk.length - 2; });
      if (s > score) { score = s; best = f; }
    });
    return best;
  }
  function answerHtml(f) {
    var link = '';
    if (f.link) link = '<br><a class="lc-link" href="' + esc(f.link[1] === 'MESSENGER' ? MSG : f.link[1]) + '"' + (/^https?:/.test(f.link[1]) || f.link[1] === 'MESSENGER' ? ' target="_blank" rel="noopener"' : '') + '>' + esc(f.link[0]) + ' →</a>';
    return esc(f.a) + link;
  }
  function say(who, html) { log.push({ who: who, html: html }); draw(); }
  function ask(text) {
    if (!text.trim()) return;
    say('me', esc(text));
    var f = find(text);
    setTimeout(function () {
      if (f) say('bot', answerHtml(f));
      else say('bot', 'Sorry, I\'m not sure about that one yet. Please message us — we\'ll answer you personally.<br><a class="lc-link" href="' + esc(MSG) + '" target="_blank" rel="noopener">Message us on Messenger →</a>');
    }, 250);
  }
  function chips(list) {
    return '<div class="lc-chips">' + list.map(function (f) { return '<button type="button" class="lc-chip" data-q="' + esc(f.q) + '">' + esc(f.q) + '</button>'; }).join('') + '</div>';
  }
  function draw() {
    var keep = document.activeElement && document.activeElement.id === 'lc-in';
    var draft = root.querySelector('#lc-in') ? root.querySelector('#lc-in').value : '';
    root.innerHTML = (open
      ? '<div class="lc-win" role="dialog" aria-label="Chat with Luna\'s Oasis">' +
        '<div class="lc-head"><span style="width:40px;height:40px;border-radius:50%;background:#C9A96E;display:flex;align-items:center;justify-content:center;flex:none">' + cat + '</span><div><b>Ask Luna</b><small>Quick answers · we reply on Messenger too</small></div><button type="button" class="lc-x" aria-label="Close chat">✕</button></div>' +
        '<div class="lc-body" aria-live="polite"><div class="lc-m lc-bot">Hi! 🌙 I\'m Luna. Tap a question or type your own.</div>' + chips(FAQ.slice(0, 6)) +
        log.map(function (m) { return '<div class="lc-m lc-' + m.who + '">' + m.html + '</div>'; }).join('') +
        (log.length ? '<div style="color:#B9AE9F;font-size:12px;margin-top:4px">More questions</div>' + chips(FAQ.slice(6)) : '') +
        '</div><form><label for="lc-in" style="position:absolute;left:-9999px">Your question</label><input id="lc-in" autocomplete="off" placeholder="Type your question…" value="' + esc(draft) + '"><button class="lc-send" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg></button></form></div>'
      : '') +
      (!open && !tipShown ? '<div class="lc-tip">Questions? Ask Luna 🐾</div>' : '') +
      '<button type="button" class="lc-btn" aria-label="' + (open ? 'Close chat' : 'Open chat — ask a question') + '" aria-expanded="' + open + '">' + (open ? '<span style="font-size:22px">✕</span>' : cat) + '</button>';
    var body = root.querySelector('.lc-body'); if (body) body.scrollTop = body.scrollHeight;
    if (keep) root.querySelector('#lc-in').focus();
  }
  root.addEventListener('click', function (e) {
    if (e.target.closest('.lc-btn') || e.target.closest('.lc-x')) {
      open = !open; tipShown = true; try { sessionStorage.setItem('lc_tip', '1'); } catch (x) {}
      draw(); if (open && window.innerWidth > 600) root.querySelector('#lc-in').focus(); return;
    }
    var c = e.target.closest('.lc-chip'); if (c) ask(c.dataset.q);
  });
  root.addEventListener('submit', function (e) {
    e.preventDefault(); var i = root.querySelector('#lc-in'); var v = i.value; i.value = ''; ask(v);
  });
  draw();
  setTimeout(function () { if (!tipShown) { tipShown = true; draw(); } }, 8000);   // the "Questions?" bubble shows for a few seconds
})();