// Luna's Oasis — keeps the price cards on the landing page in sync with the
// Rates and Promos tabs in the Sheet (via the Apps Script web app).
(function () {
  // Used only if the backend can't be reached.
  var FALLBACK = {
    deposit: 1000, extra_hour_rate: 250,
    rates: [
      { package: '10H', rate_1_2_pax: 1200, rate_3_4_pax: 1400 },
      { package: '22H', rate_1_2_pax: 2200, rate_3_4_pax: 2500 }
    ],
    promos: [{ name: 'October 2026 promo', start_date: '2026-10-01', end_date: '2026-10-31', percent_off: 10 }]
  };

  function peso(n) { return '₱' + Math.round(n).toLocaleString('en-PH'); }
  function todayManila() {
    // yyyy-mm-dd in Philippine time, whatever the visitor's phone is set to
    return new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
  }
  function monthDay(ymd) {
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return m[Number(ymd.slice(5, 7)) - 1] + ' ' + Number(ymd.slice(8, 10));
  }

  function render(cfg) {
    var today = todayManila();
    var promo = (cfg.promos || []).filter(function (p) {
      return p.start_date <= today && today <= p.end_date;
    })[0];
    var pct = promo ? Number(promo.percent_off) : 0;

    (cfg.rates || []).forEach(function (r) {
      ['rate_1_2_pax', 'rate_3_4_pax'].forEach(function (col) {
        var key = r.package + ':' + col;
        var now = document.querySelector('[data-price="' + key + '"]');
        var was = document.querySelector('[data-was="' + key + '"]');
        if (!now) return;
        var base = Number(r[col]);
        now.textContent = peso(base * (100 - pct) / 100);
        if (was) {
          was.style.visibility = pct ? 'visible' : 'hidden';
          was.innerHTML = 'was <s>' + peso(base) + '</s>';
        }
      });
    });

    var note = document.querySelector('[data-price-note]');
    if (note) {
      note.textContent = promo
        ? pct + '% off stays checking in until ' + monthDay(promo.end_date) + '.'
        : 'Rates per stay, for up to 4 guests.';
    }
    var extra = document.querySelector('[data-extra]');
    if (extra && cfg.extra_hour_rate) extra.textContent = peso(cfg.extra_hour_rate);
    var dep = document.querySelector('[data-deposit]');
    if (dep && cfg.deposit) dep.textContent = peso(cfg.deposit);
  }

  render(FALLBACK); // instant, correct for today's date even before the backend answers

  var url = window.LUNA_CONFIG && window.LUNA_CONFIG.API_URL;
  if (!url || !window.fetch) return;
  fetch(url + '?action=getPublicConfig')
    .then(function (res) { return res.json(); })
    .then(function (json) { if (json && json.ok) render(json.data); })
    .catch(function () { /* keep the fallback prices */ });
})();
