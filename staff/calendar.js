/* Luna's Oasis — staff portal: Calendar page. */
'use strict';
var PAL = ['#8E3B46', '#2F5A47', '#6B4A6E', '#A8834A', '#3D5A80', '#B5651D', '#5F7161', '#7A2A16', '#4A5568', '#9C6B98', '#8C6A3C', '#476C78'];
function calendarHtml() {
  var y = S.cy, m = S.cm, DAY = 24 * HOUR;
  var mStart = Date.UTC(y, m, 1) - PH, mEnd = Date.UTC(y, m + 1, 1) - PH;
  var gap = (S.data.settings.cleaning_gap_hours || 0) * HOUR;
  var list = S.data.bookings.filter(function (b) { return active(b) && ms(b.check_in) < mEnd && ms(b.check_out) + gap > mStart; })
    .sort(function (a, b) { return ms(a.check_in) - ms(b.check_in); });
  var color = {}; list.forEach(function (b, i) { color[b.ref] = PAL[i % PAL.length]; });
  var first = new Date(Date.UTC(y, m, 1)).getUTCDay(), dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  var todayKey = new Date(Date.now() + PH).toISOString().slice(0, 10);
  var cells = '', full = 0, part = 0, open = 0;
  for (var i = 0; i < first; i++) cells += '<div class="cday blank"></div>';
  for (var d = 1; d <= dim; d++) {
    var ds = Date.UTC(y, m, d) - PH, de = ds + DAY, booked = 0, segs = '', chips = [];
    list.forEach(function (b) {
      var a = ms(b.check_in), z = ms(b.check_out);
      var o = Math.max(0, Math.min(z, de) - Math.max(a, ds));
      if (o) {
        booked += o;
        segs += '<span style="left:' + ((Math.max(a, ds) - ds) / DAY * 100) + '%;width:' + (o / DAY * 100) + '%;background:' + color[b.ref] + '"></span>';
        chips.push('<button type="button" class="chip2" data-open="' + esc(b.ref) + '" style="background:' + color[b.ref] + '" title="' + esc(lead(b)) + ' · ' + esc(b.ref) + '">' + esc(lead(b).split(' ')[0]) + '</button>');
      }
      var c = Math.max(0, Math.min(z + gap, de) - Math.max(z, ds));
      if (c) segs += '<span class="clean" style="left:' + ((Math.max(z, ds) - ds) / DAY * 100) + '%;width:' + (c / DAY * 100) + '%"></span>';
    });
    var hrs = Math.round(booked / HOUR);
    if (hrs >= 20) full++; else if (hrs > 0) part++; else open++;
    var key = new Date(ds + PH).toISOString().slice(0, 10);
    cells += '<div class="cday' + (hrs ? ' busy' : '') + (key === todayKey ? ' today' : '') + (key < todayKey ? ' past' : '') + '">' +
      '<div class="top1"><b>' + d + '</b><span>' + (hrs ? hrs + ' hrs' : 'Open') + '</span></div>' +
      chips.slice(0, 2).join('') + (chips.length > 2 ? '<span class="more">+' + (chips.length - 2) + ' more</span>' : '') +
      '<span class="strip">' + segs + '</span></div>';
  }
  var keyList = list.map(function (b) {
    return '<button type="button" data-open="' + esc(b.ref) + '"><span class="dot" style="background:' + color[b.ref] + '"></span><span>' + esc(lead(b)) + ' · ' + esc(b.ref) +
      '<small>' + when(b.check_in) + ' → ' + when(b.check_out) + '</small></span></button>';
  }).join('');
  return '<div class="hello"><div><h1>Calendar</h1><p>Every booking, time-in, time-out and extension. Tap a name to open the booking.</p></div>' +
    '<button type="button" class="pill ghost sm" data-act="refresh">↻ Refresh</button></div>' +
    (S.error && !S.open ? '<div class="err" role="alert" style="margin-bottom:12px">' + esc(S.error) + '</div>' : '') +
    '<section class="panel">' +
    '<div class="calbar"><div class="calnav"><button type="button" class="round" data-cal="-1" aria-label="Previous month">‹</button>' +
    '<h2>' + MONTHS[m] + ' ' + y + '</h2><button type="button" class="round" data-cal="1" aria-label="Next month">›</button>' +
    '<button type="button" class="pill line sm" data-cal="0">Today</button></div>' +
    '<div class="counts"><span><b>' + full + '</b> fully booked</span><span><b>' + part + '</b> partly booked</span><span><b>' + open + '</b> open</span></div></div>' +
    '<div class="cdow">' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (x) { return '<div>' + x.toUpperCase() + '</div>'; }).join('') + '</div>' +
    '<div class="cgrid">' + cells + '</div>' +
    '<p class="hint">The bar at the bottom of each day shows the booked hours in colour and the cleaning time as stripes.</p>' +
    '<h3 class="label" style="margin-top:18px">Bookings in ' + MONTHS[m] + '</h3>' +
    (keyList ? '<div class="gkey" style="margin-top:0">' + keyList + '</div>' : '<p class="empty" style="padding:10px 0">No bookings this month.</p>') +
    '</section>';
}

PAGES.calendar = {
  order: 2, label: 'Calendar', html: calendarHtml,
  click: function (e) {
    var el = e.target.closest('[data-cal]');
    if (!el) return false;
    var c = el.dataset.cal;
    if (c === '0') { var t = new Date(Date.now() + PH); S.cy = t.getUTCFullYear(); S.cm = t.getUTCMonth(); }
    else { S.cm += +c; if (S.cm < 0) { S.cm = 11; S.cy--; } if (S.cm > 11) { S.cm = 0; S.cy++; } }
    render(); return true;
  }
};