/* Bohanan Construction pages: hotspot legend, "Discuss This Detail" carry, before/after drag. Uses window.ALLY from site.js. */
(function () {
  'use strict';
  var d = document, A = window.ALLY || {};
  var $ = A.$ || function (s, c) { return (c || d).querySelector(s); };
  var $$ = A.$$ || function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* hotspot legend buttons open the matching hotspot */
  $$('[data-hs-proxy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var hs = $('[data-hs][aria-controls="' + b.getAttribute('data-hs-proxy') + '"]');
      if (hs) hs.click();
    });
  });
  $$('[data-hs-wrap]').forEach(function (wrap) {
    $$('[data-hs]', wrap).forEach(function (hs) {
      hs.addEventListener('click', function () {
        var hint = $('[data-hs-hint]', wrap); if (hint) hint.hidden = true;
        var id = hs.getAttribute('aria-controls');
        $$('[data-hs-proxy]', wrap).forEach(function (p) { p.setAttribute('aria-pressed', p.getAttribute('data-hs-proxy') === id ? 'true' : 'false'); });
        if (A.track) A.track('hotspot_open', { feature: hs.getAttribute('data-feature') || '' });
      });
    });
    $$('[data-hs-proxy]', wrap).forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
  });

  /* Discuss This Detail -> carry project + feature into the construction form */
  var src = $('script[data-carry-src]'), base = {};
  if (src) { try { base = JSON.parse(src.getAttribute('data-carry-base') || src.textContent) || {}; } catch (e) {} }
  $$('[data-discuss]').forEach(function (b) {
    b.addEventListener('click', function () {
      var scene = b.closest('.bc-scene'), h = scene && $('h2', scene);
      var data = {}; for (var k in base) data[k] = base[k];
      data.Feature = b.getAttribute('data-discuss') + (h ? ' (' + h.textContent.trim() + ')' : '');
      if (src) src.textContent = JSON.stringify(data);
      if (A.carry) A.carry(data, 'About this detail');
      var wrap = d.getElementById('discuss'), form = wrap && $('form[data-form]', wrap);
      if (form && A.fillCarry) A.fillCarry(form);
      var msg = form && $('textarea', form);
      if (msg && !msg.value) msg.value = 'I would like to talk about the ' + b.getAttribute('data-discuss').toLowerCase() + ' for my own home.';
      if (wrap) { wrap.scrollIntoView({ behavior: 'smooth', block: 'start' }); var f = form && $('input:not([type=hidden]):not(.hp)', form); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 450); }
      if (A.track) A.track('detail_discuss', { feature: data.Feature });
    });
  });

  /* before/after: drag anywhere on touch and mouse (range input still handles keyboard) */
  $$('[data-ba-drag]').forEach(function (ba) {
    var r = $('input[type=range]', ba); if (!r) return;
    var down = false;
    function at(e) {
      var b = ba.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * 100;
      r.value = Math.max(0, Math.min(100, Math.round(x)));
      r.dispatchEvent(new Event('input', { bubbles: true }));
    }
    ba.addEventListener('pointerdown', function (e) { down = true; at(e); if (ba.setPointerCapture) try { ba.setPointerCapture(e.pointerId); } catch (x) {} });
    ba.addEventListener('pointermove', function (e) { if (down) at(e); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { ba.addEventListener(t, function () { down = false; }); });
    r.addEventListener('input', function () {
      r.setAttribute('aria-valuetext', r.value < 50 ? 'Showing mostly the finished photo' : (r.value > 50 ? 'Showing mostly the construction photo' : 'Half and half'));
    });
  });
})();
