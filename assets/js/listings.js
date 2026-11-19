/* Listings: filters/sort/grid-map toggle on index pages, detail-page map and "Show more". Leaflet + OSM tiles, loaded on demand. */
(function () {
  'use strict';
  var d = document, $ = function (s, c) { return (c || d).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var BASE = ((window.SITE && window.SITE.base) || '') + '/assets/vendor/leaflet/';
  var leafletP = null;
  function leaflet() {
    if (window.L && window.L.map) return Promise.resolve(window.L);
    if (leafletP) return leafletP;
    leafletP = new Promise(function (res, rej) {
      var l = d.createElement('link'); l.rel = 'stylesheet'; l.href = BASE + 'leaflet.css'; d.head.appendChild(l);
      var s = d.createElement('script'); s.src = BASE + 'leaflet.js'; s.onload = function () { res(window.L); }; s.onerror = rej; d.head.appendChild(s);
    });
    return leafletP;
  }
  function tiles(L, m) {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- index: filters, sort, show more, map ---------- */
  $$('[data-zres]').forEach(function (root) {
    var fm = $('[data-zf]', root), grid = $('[data-lgrid]', root); if (!fm || !grid) return;
    var items = $$('[data-l]', grid), cnt = $('[data-lcount]', fm), empty = $('[data-lempty]', root), more = $('[data-lmore]', root);
    var kind = fm.dataset.zf, PAGE = 24, shown = PAGE, pts = [];
    try { pts = JSON.parse($('[data-zpts]', root).textContent); } catch (e) {}
    var mapWrap = $('[data-zmapwrap]', root), mapEl = $('[data-zmap-index]', root), map = null, layer = null, view = 'grid';
    function visibleIds() { var s = {}; items.forEach(function (li) { if (!li.classList.contains('is-out')) s[li.dataset.id] = 1; }); return s; }
    function drawMap() {
      if (!map) return;
      var L = window.L, ids = visibleIds(), seen = {}, b = [];
      layer.clearLayers();
      pts.forEach(function (p) {
        if (!ids[p.id] || seen[p.id]) return; seen[p.id] = 1;
        var ic = L.divIcon({ className: 'zpin ' + p.s, html: '<span>' + esc(p.p) + '</span>', iconSize: null });
        var mk = L.marker([p.lat, p.lng], { icon: ic, title: p.a + ', ' + p.c, keyboard: true });
        mk.bindPopup('<a class="zpop" href="' + esc(p.u) + '">' + (p.img ? '<img src="' + esc(p.img) + '" alt="" width="240" height="180">' : '') +
          '<span class="zpop-b">' + esc(p.b) + '</span><b>' + esc(p.price) + '</b><span>' + esc(p.a) + '<br>' + esc(p.c) + '</span></a>', { maxWidth: 260 });
        layer.addLayer(mk); b.push([p.lat, p.lng]);
      });
      if (b.length) map.fitBounds(b, { padding: [40, 40], maxZoom: 14 });
    }
    function setView(v) {
      view = v;
      $$('[data-view]', fm).forEach(function (bt) { bt.setAttribute('aria-pressed', bt.dataset.view === v ? 'true' : 'false'); });
      root.classList.toggle('is-map', v === 'map');
      mapWrap.hidden = v !== 'map';
      if (v === 'map') {
        leaflet().then(function (L) {
          if (!map) { map = L.map(mapEl, { scrollWheelZoom: false }); tiles(L, map); layer = L.layerGroup().addTo(map); }
          setTimeout(function () { map.invalidateSize(); drawMap(); }, 30);
        });
      }
    }
    function apply() {
      var f = {}; $$('[data-f]', fm).forEach(function (s) { f[s.dataset.f] = s.value; });
      var sort = ($('[data-sort]', fm) || {}).value || 'order';
      var list = items.slice().sort(function (a, b) {
        if (sort === 'price-d') return b.dataset.price - a.dataset.price;
        if (sort === 'price-a') return a.dataset.price - b.dataset.price;
        if (sort === 'beds') return (b.dataset.beds - a.dataset.beds) || (b.dataset.price - a.dataset.price);
        if (sort === 'sqft') return b.dataset.sqft - a.dataset.sqft;
        return a.dataset.order - b.dataset.order;
      });
      var n = 0;
      list.forEach(function (li) {
        var p = +li.dataset.price, ok = true;
        if (f.town && li.dataset.town !== f.town) ok = false;
        if (f.kind && li.dataset.kind !== f.kind) ok = false;
        if (f.beds && +li.dataset.beds < +f.beds) ok = false;
        if (f.side && li.dataset.side !== f.side && li.dataset.side !== 'both') ok = false;
        if (f.band) { var r = f.band.split('-'); if (p < +r[0] || p >= +r[1]) ok = false; }
        if (f.recent && li.dataset.recent !== '1') ok = false;
        grid.appendChild(li);
        li.classList.toggle('is-out', !ok);
        if (ok) { n++; li.classList.toggle('is-hidden', !!more && n > shown); }
        else li.classList.remove('is-hidden');
      });
      if (cnt) cnt.textContent = n + (kind === 'sale' ? (n === 1 ? ' home' : ' homes') : (n === 1 ? ' sale' : ' sales'));
      if (empty) empty.hidden = n > 0;
      if (more) more.parentNode.hidden = n <= shown;
      var q = new URLSearchParams(); Object.keys(f).forEach(function (k) { if (f[k]) q.set(k, f[k]); }); if (sort !== 'order') q.set('sort', sort); if (view === 'map') q.set('view', 'map');
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
      drawMap();
    }
    var q0 = new URLSearchParams(location.search);
    $$('[data-f],[data-sort]', fm).forEach(function (s) { var k = s.dataset.f || 'sort'; if (q0.get(k)) s.value = q0.get(k); s.addEventListener('change', function () { shown = PAGE; apply(); }); });
    $$('[data-view]', fm).forEach(function (bt) { bt.addEventListener('click', function () { setView(bt.dataset.view); apply(); }); });
    if (more) more.addEventListener('click', function () {
      shown += PAGE; apply();
      var vis = $$('[data-l]:not(.is-out):not(.is-hidden)', grid)[shown - PAGE]; if (vis) { var a = vis.querySelector('a'); a && a.focus(); }
    });
    var rs = $('[data-lreset]', root); if (rs) rs.addEventListener('click', function () { $$('[data-f]', fm).forEach(function (s) { s.value = ''; }); apply(); });
    if (q0.get('view') === 'map') setView('map');
    apply();
  });

  /* ---------- detail: description "Show more" ---------- */
  $$('[data-zmore]').forEach(function (box) {
    var bt = box.parentNode.querySelector('[data-zmore-btn]'); if (!bt) return;
    if (box.scrollHeight <= box.clientHeight + 24) { box.classList.add('is-open'); return; }
    bt.hidden = false;
    bt.addEventListener('click', function () {
      var open = box.classList.toggle('is-open'); bt.setAttribute('aria-expanded', open ? 'true' : 'false'); bt.textContent = open ? 'Show less' : 'Show more';
    });
  });

  /* ---------- detail: map, loaded when it scrolls near ---------- */
  $$('[data-zmap]').forEach(function (el) {
    var go = function () {
      leaflet().then(function (L) {
        el.innerHTML = '';
        var ll = [+el.dataset.lat, +el.dataset.lng], m = L.map(el, { scrollWheelZoom: false }).setView(ll, 14);
        tiles(L, m);
        L.marker(ll, { icon: L.divIcon({ className: 'zpin home', html: '<span>' + esc(el.dataset.label) + '</span>', iconSize: null }), keyboard: false }).addTo(m);
      });
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '300px' }); io.observe(el);
    } else go();
  });
})();
