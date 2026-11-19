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

  /* hub teaser: in-place hotspot cards (one open at a time, Esc closes, focus returns) */
  $$('[data-hpop-wrap]').forEach(function (wrap) {
    var btns = $$('[data-hpop]', wrap), open = null;
    function close(back) {
      if (!open) return;
      var b = open, c = d.getElementById(b.getAttribute('aria-controls'));
      b.setAttribute('aria-expanded', 'false'); b.classList.remove('on'); if (c) c.hidden = true;
      open = null; wrap.classList.remove('has-open');
      if (back) b.focus();
    }
    function show(b) {
      if (open === b) { close(true); return; }
      close(false);
      var c = d.getElementById(b.getAttribute('aria-controls')); if (!c) return;
      b.setAttribute('aria-expanded', 'true'); b.classList.add('on'); c.hidden = false;
      open = b; wrap.classList.add('has-open');
      try { c.focus({ preventScroll: true }); } catch (e) { c.focus(); }
      if (window.matchMedia('(max-width:600px)').matches && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (A.track) A.track('hotspot_open', { feature: (c.querySelector('h3') || {}).textContent || '', where: 'hub' });
    }
    btns.forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); show(b); }); });
    $$('[data-hpop-close]', wrap).forEach(function (x) { x.addEventListener('click', function (e) { e.stopPropagation(); close(true); }); });
    $$('.bc-hp-card', wrap).forEach(function (c) { c.addEventListener('click', function (e) { e.stopPropagation(); }); });
    wrap.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.key === 'Esc') && open) { e.preventDefault(); close(true); } });
    d.addEventListener('click', function () { close(false); });
  });

  /* explore page: #hs-<scene>-<n> opens that hotspot */
  function fromHash() {
    var id = (location.hash || '').slice(1); if (!/^hs-[\w-]+$/.test(id)) return;
    var hs = $('[data-hs][aria-controls="' + id + '"]'); if (!hs) return;
    if (hs.getAttribute('aria-expanded') !== 'true') hs.click();
    var p = d.getElementById(id), wrap = hs.closest('.bc-hs') || hs;
    setTimeout(function () {
      var t = p && !p.hidden ? p : wrap, hd = d.querySelector('header'), off = hd ? Math.min(hd.getBoundingClientRect().height, 120) : 0;
      window.scrollTo(0, t.getBoundingClientRect().top + window.pageYOffset - off - 16);
      if (p) try { p.focus({ preventScroll: true }); } catch (e) {}
    }, 60);
  }
  if ($('[data-hs]')) { window.addEventListener('hashchange', fromHash); if (d.readyState === 'complete') fromHash(); else window.addEventListener('load', fromHash); }
})();
