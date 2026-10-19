// Luna's Oasis — shows the reviews the admin published (staff portal → Overview → Guest reviews)
// inside the guestbook section of the home page. If there are none yet, nothing changes.
(function () {
  var box = document.getElementById('guestReviews');
  var api = window.LUNA_CONFIG && window.LUNA_CONFIG.API_URL;
  if (!box || !api) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'publicReviews' }) })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      var list = j && j.ok && j.data && j.data.reviews;
      if (!list || !list.length) return;
      var stars = function (n) { return '★★★★★'.slice(0, n) + '<span style="opacity:.35">' + '★★★★★'.slice(0, 5 - n) + '</span>'; };
      box.innerHTML =
        '<div style="display:flex;align-items:baseline;gap:12px;margin:26px 0 14px;color:#C9A96E;font-size:13px;letter-spacing:.24em;text-transform:uppercase">' +
        '<span style="font-size:18px;letter-spacing:3px">' + stars(Math.round(j.data.average)) + '</span>' + j.data.average.toFixed(1) + ' · ' + list.length + ' review' + (list.length > 1 ? 's' : '') + '</div>' +
        '<div style="display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px">' +
        list.map(function (r) {
          return '<figure style="flex:0 0 min(300px,85%);scroll-snap-align:start;margin:0;border:1px solid rgba(201,169,110,.35);padding:18px 20px;display:flex;flex-direction:column;gap:10px">' +
            '<div style="color:#C9A96E;letter-spacing:3px">' + stars(r.rating) + '</div>' +
            '<blockquote style="margin:0;font-family:\'Cormorant Garamond\',serif;font-style:italic;font-size:20px;line-height:1.4;color:#F3ECE0">“' + esc(r.text) + '”</blockquote>' +
            '<figcaption style="color:#B9AE9F;font-size:13px;letter-spacing:.12em;text-transform:uppercase">— ' + esc(r.guest) + (r.month ? ' · ' + esc(r.month) : '') + '</figcaption>' +
            (r.reply ? '<div style="border-top:1px solid rgba(201,169,110,.25);padding-top:10px;color:#B9AE9F;font-size:14px;line-height:1.6"><span style="color:#C9A96E">Luna\'s Oasis:</span> ' + esc(r.reply) + '</div>' : '') +
            '</figure>';
        }).join('') + '</div>';
    })
    .catch(function () {});
})();