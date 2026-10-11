// Luna's Oasis — makes the first screen (logo, circle, buttons and the moving
// words) fit exactly into the visitor's screen, on phones and laptops.
(function () {
  var screen = document.querySelector('.hero-screen');
  if (!screen) return;
  var root = document.documentElement;
  root.classList.add('hero-fit');

  var ua = navigator.userAgent;
  // iPhone Safari draws its address bar over the bottom of the page.
  var iosSafariBar = /iP(hone|od)/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua) && !navigator.standalone;

  function visualScale() {
    // The phone design shrinks the page slightly (CSS zoom); measure it.
    var w = screen.offsetWidth;
    return w ? screen.getBoundingClientRect().width / w : 1;
  }
  function heightAt(c) {
    screen.style.setProperty('--c', c + 'px');
    return screen.getBoundingClientRect().height; // what the visitor sees
  }

  function fit() {
    var z = visualScale();
    var target = window.innerHeight - (iosSafariBar ? 64 : 0);
    var maxC = Math.min(600, (window.innerWidth * 0.88) / z);
    var minC = Math.min(150, maxC);
    screen.style.minHeight = '0';
    // Height grows in a straight line with the circle size: two measurements solve it.
    var h1 = heightAt(maxC), h2 = heightAt(maxC - 100);
    var perPx = (h1 - h2) / 100 || 1.3;
    var c = maxC - (h1 - target) / perPx;
    c = Math.max(minC, Math.min(maxC, c));
    screen.style.setProperty('--c', c + 'px');
    // If the circle is already at full size, the extra space goes around it evenly.
    screen.style.minHeight = (target / z) + 'px';
  }

  var lastW = 0, lastH = 0;
  function maybeFit(force) {
    var w = window.innerWidth, h = window.innerHeight;
    // Ignore the small height changes phones make while scrolling (address bar
    // hiding), so the page doesn't jump. Refit on rotation or real resizes.
    if (!force && w === lastW && Math.abs(h - lastH) < 120) return;
    lastW = w; lastH = h;
    fit();
  }

  maybeFit(true);
  window.addEventListener('load', function () { maybeFit(true); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { maybeFit(true); });
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { maybeFit(false); }, 150); });
  window.addEventListener('orientationchange', function () { setTimeout(function () { maybeFit(true); }, 300); });
})();
