/* Ally Bohanan Real Estate — site script (no dependencies). */
(function () {
  'use strict';
  var d = document, w = window, B = (w.SITE && w.SITE.base) || '', STAGING = !!(w.SITE && w.SITE.staging);
  var RM = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var dl = w.dataLayer = w.dataLayer || [];
  function track(ev, p) { try { var o = { event: ev }; for (var k in p || {}) o[k] = p[k]; dl.push(o); } catch (e) {} }
  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  function iso(dt) { return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2); }
  w.ALLY = { $: $, $$: $$, esc: esc, track: track, base: B, iso: iso, today: TODAY, carry: carry, fillCarry: fillCarry };

  /* ---------- header, mega menu, drawer ---------- */
  var hdr = $('[data-hdr]');
  function onScroll() { if (hdr) hdr.classList.toggle('scrolled', w.scrollY > 8); }
  w.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var mega = $('[data-mega]'), mbtn = $('[data-mega-btn]'), mli = mbtn && mbtn.closest('li'), mt;
  function megaOpen(v) { if (!mega) return; mega.classList.toggle('open', v); mbtn.setAttribute('aria-expanded', v ? 'true' : 'false'); }
  if (mega && mbtn) {
    mbtn.addEventListener('click', function () { megaOpen(mbtn.getAttribute('aria-expanded') !== 'true'); });
    [mli, mega].forEach(function (el) {
      el.addEventListener('mouseenter', function () { clearTimeout(mt); if (w.matchMedia('(hover:hover)').matches) megaOpen(true); });
      el.addEventListener('mouseleave', function () { mt = setTimeout(function () { megaOpen(false); }, 180); });
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mbtn.getAttribute('aria-expanded') === 'true') { megaOpen(false); mbtn.focus(); } });
    d.addEventListener('click', function (e) { if (!mega.contains(e.target) && !mli.contains(e.target)) megaOpen(false); });
    mega.addEventListener('focusout', function (e) { if (!mega.contains(e.relatedTarget) && !mli.contains(e.relatedTarget)) megaOpen(false); });
    $$('a[data-vis]', mega).forEach(function (a) {
      var show = function () { $$('figure[data-vis-for]', mega).forEach(function (f) { f.classList.toggle('on', f.getAttribute('data-vis-for') === a.getAttribute('data-vis')); }); };
      a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
    });
  }
  var menu = $('[data-menu]'), drawer = $('[data-drawer]'), lastFocus;
  function drawerOpen(v) {
    if (!drawer) return;
    drawer.classList.toggle('open', v); d.body.classList.toggle('lock', v); menu.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v) { lastFocus = d.activeElement; setTimeout(function () { var c = $('[data-close]', drawer); c && c.focus(); }, 60); }
    else if (lastFocus) lastFocus.focus();
  }
  if (menu && drawer) {
    menu.addEventListener('click', function () { drawerOpen(true); });
    $('[data-close]', drawer).addEventListener('click', function () { drawerOpen(false); });
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') drawerOpen(false);
      if (e.key !== 'Tab') return;
      var f = $$('a,button,summary,[tabindex]:not([tabindex="-1"])', drawer).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && d.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && d.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { drawerOpen(false); }); });
  }
  /* mobile action bar: hide while scrolling down, near footer or when a form field has focus */
  var mbar = $('[data-mbar]'), lastY = w.scrollY, ftr = $('.ftr');
  if (mbar) {
    var hero = $('main > section') || $('.hero');
    function tick() {
      var y = w.scrollY, nearEnd = ftr && ftr.getBoundingClientRect().top < w.innerHeight;
      if (hero && hero.getBoundingClientRect().bottom > w.innerHeight * 0.5) nearEnd = true; // stay clear of the hero buttons
      mbar.classList.toggle('hide', nearEnd || (y > lastY + 4 && y > 400));
      if (y < lastY - 4) mbar.classList.toggle('hide', !!nearEnd);
      lastY = y;
    }
    w.addEventListener('scroll', tick, { passive: true }); tick();
    d.addEventListener('focusin', function (e) { if (e.target.matches('input,textarea,select')) mbar.classList.add('hide'); });
  }
  /* fade-in */
  if ('IntersectionObserver' in w && !RM) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.fade-in').forEach(function (el) { io.observe(el); });
  } else $$('.fade-in').forEach(function (el) { el.classList.add('in'); });

  /* expiring content */
  $$('[data-expires]').forEach(function (el) { if (new Date(el.getAttribute('data-expires') + 'T23:59:59') < TODAY) el.remove(); });

  /* ---------- hero video ---------- */
  var hv = $('[data-hero-video]'), ht = $('[data-hero-toggle]');
  if (hv && !RM && !(navigator.connection && navigator.connection.saveData)) {
    $$('source[data-src]', hv).forEach(function (s) { s.src = s.getAttribute('data-src'); });
    hv.load(); var p = hv.play(); if (p && p.catch) p.catch(function () {});
    hv.addEventListener('playing', function () { hv.classList.add('on'); if (ht) ht.hidden = false; });
    if (ht) ht.addEventListener('click', function () { if (hv.paused) { hv.play(); ht.textContent = 'Pause film'; } else { hv.pause(); ht.textContent = 'Play film'; } });
  }

  /* ---------- reels (abkskinn pattern) ---------- */
  function stopAll(except) { $$('[data-vcard] video').forEach(function (v) { if (v !== except && !v.paused) v.pause(); }); }
  $$('[data-vcard]').forEach(function (card) {
    var v = $('video', card), b = $('[data-vplay]', card);
    if (!v || !b) return;
    b.addEventListener('click', function () {
      stopAll(v); v.muted = false; v.controls = true; card.classList.add('is-playing');
      var p = v.play(); if (p && p.catch) p.catch(function () {}); v.focus();
      track('video_play', { video_title: v.getAttribute('aria-label') || '' });
    });
    v.addEventListener('play', function () { stopAll(v); card.classList.add('is-playing'); });
    v.addEventListener('ended', function () { card.classList.remove('is-playing'); v.controls = false; v.load(); b.focus(); });
  });
  $$('.reels-sec').forEach(function (sec) {
    var row = $('[data-reels-row]', sec); if (!row) return;
    function step(dir) {
      var c = $('[data-vcard]', row); var wd = c ? c.getBoundingClientRect().width + 16 : 300;
      row.scrollBy({ left: dir * wd * 2, behavior: RM ? 'auto' : 'smooth' });
    }
    var pv = $('[data-reels-prev]', sec), nx = $('[data-reels-next]', sec);
    pv && pv.addEventListener('click', function () { step(-1); }); nx && nx.addEventListener('click', function () { step(1); });
    function upd() { if (pv) pv.disabled = row.scrollLeft < 4; if (nx) nx.disabled = row.scrollLeft + row.clientWidth > row.scrollWidth - 4; }
    row.addEventListener('scroll', upd, { passive: true }); upd();
  });

  /* ---------- context carry (tools → forms) ---------- */
  function carry(obj, label) { try { sessionStorage.setItem('ally-carry', JSON.stringify({ label: label || '', data: obj, from: location.pathname })); } catch (e) {} }
  function readCarry() {
    var out = null;
    var src = $('[data-carry-src]'); if (src) { try { out = { data: JSON.parse(src.textContent) }; } catch (e) {} }
    if (!out) { try { var s = sessionStorage.getItem('ally-carry'); if (s) out = JSON.parse(s); } catch (e) {} }
    var q = new URLSearchParams(location.search), extra = {};
    ['towns', 'project', 'feature', 'listing', 'topic'].forEach(function (k) { if (q.get(k)) extra[k.charAt(0).toUpperCase() + k.slice(1)] = q.get(k); });
    if (Object.keys(extra).length) out = { data: Object.assign((out && out.data) || {}, extra) };
    return out;
  }
  function fillCarry(form) {
    var c = readCarry(), box = $('[data-carry]', form); if (!c || !c.data || !box) return;
    var list = $('[data-carry-list]', box), rows = [];
    Object.keys(c.data).forEach(function (k) { var v = c.data[k]; if (v === '' || v == null) return; rows.push('<li><b>' + esc(k) + ':</b> ' + esc(Array.isArray(v) ? v.join(', ') : v) + '</li>'); });
    if (!rows.length) return;
    list.innerHTML = rows.join(''); box.hidden = false;
    var ctx = $('input[name=context]', form); if (ctx) ctx.value = Object.keys(c.data).map(function (k) { return k + ': ' + (Array.isArray(c.data[k]) ? c.data[k].join(', ') : c.data[k]); }).join(' | ');
  }

  /* ---------- forms ---------- */
  var ENDPOINT = { ally: 'https://formsubmit.co/ajax/ally@amb-homes.com', bohanan: 'https://formsubmit.co/ajax/Ally@BohananConstruction.com' };
  function fieldErr(el, msg) {
    var id = (el.id || (el.closest('fieldset') || {}).id) + '-e', e = d.getElementById(id);
    if (e) e.textContent = msg || '';
    var tgt = el.closest('fieldset') || el; tgt.classList.toggle('invalid', !!msg);
    if (el.setAttribute) el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validate(form) {
    var first = null;
    $$('[required]', form).forEach(function (el) {
      var msg = '';
      if (el.type === 'radio') { if (!$('input[name="' + el.name + '"]:checked', form)) msg = 'Please choose one.'; }
      else if (!el.value.trim()) msg = 'This field is required.';
      else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())) msg = 'Please enter a valid email address.';
      fieldErr(el, msg); if (msg && !first) first = el;
    });
    $$('input[type=tel]', form).forEach(function (el) {
      if (el.value && el.value.replace(/\D/g, '').length < 10) { fieldErr(el, 'Please enter a 10-digit phone number.'); if (!first) first = el; }
    });
    return first;
  }
  $$('form[data-form]').forEach(function (form) {
    var pg = $('input[name=page]', form); if (pg) pg.value = location.pathname;
    fillCarry(form);
    $$('input,select,textarea', form).forEach(function (el) { el.addEventListener('blur', function () { if (form.dataset.tried) validate(form); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); form.dataset.tried = '1';
      var st = $('.form-status', form), bad = validate(form);
      if (bad) { st.textContent = 'Please check the highlighted fields.'; st.className = 'form-status err-msg'; bad.focus(); return; }
      if ($('input[name=_honey]', form).value) return;
      var fd = new FormData(form), data = {};
      fd.forEach(function (v, k) { if (k === '_honey') return; data[k] = data[k] ? data[k] + ', ' + v : v; });
      if (data.include_context !== 'yes') delete data.context;
      if (STAGING) {
        st.className = 'form-status note'; st.innerHTML = '<strong>Review copy — nothing was sent.</strong> On the live site this message goes straight to ' + (form.dataset.route === 'bohanan' ? 'Bohanan Construction' : 'Ally') + '.';
        st.focus(); track('form_preview', { form_kind: form.dataset.form }); return;
      }
      var btn = $('button[type=submit]', form); btn.disabled = true; st.className = 'form-status'; st.textContent = 'Sending…';
      data._subject = 'Website inquiry (' + form.dataset.form + ') from ' + (data.name || 'a visitor'); data._template = 'table'; data._captcha = 'false';
      fetch(ENDPOINT[form.dataset.route] || ENDPOINT.ally, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && String(j.success) === 'true', j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error('send');
          track('generate_lead', { form_kind: form.dataset.form, form_route: form.dataset.route });
          try { sessionStorage.removeItem('ally-carry'); } catch (e) {}
          location.href = B + '/thank-you/?f=' + encodeURIComponent(form.dataset.form);
        })
        .catch(function () { btn.disabled = false; st.className = 'form-status err-msg'; st.innerHTML = 'Your message did not send. Please call <a href="tel:+17044862900">(704) 486-2900</a> or try again.'; st.focus(); });
    });
  });
  /* analytics: call + email clicks */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"],a[href^="mailto:"]'); if (!a) return;
    track(a.href.indexOf('tel:') === 0 ? 'call_click' : 'email_click', { link_url: a.href, page: location.pathname });
  });

  /* ---------- Around Town slots (homepage) ---------- */
  var around = $('[data-around]');
  if (around) {
    fetch(B + '/assets/data/events.json').then(function (r) { return r.json(); }).then(function (evs) {
      var up = evs.filter(function (x) { return new Date((x.end || x.date) + 'T23:59:59') >= TODAY; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      function fill(slot, ev) {
        var el = $('[data-around-slot="' + slot + '"]', around); if (!el || !ev) return;
        var dt = new Date(ev.date + 'T12:00:00');
        el.href = B + (ev.page || '/lifestyle/events/') + (ev.page ? '' : '#ev-' + ev.id);
        $('[data-t]', el).textContent = ev.title;
        $('[data-m]', el).textContent = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) + (ev.time ? ' · ' + ev.time : '') + ' · ' + ev.venue + ', ' + ev.town;
      }
      fill('event', up.filter(function (x) { return x.cat !== 'sports'; })[0]);
      fill('sports', up.filter(function (x) { return x.cat === 'sports'; })[0]);
    }).catch(function () {});
  }

  /* ---------- event list filters (Lifestyle › Events) ---------- */
  var evf = $('[data-evfilter]');
  if (evf || $('[data-ev]')) {
    var evs = $$('[data-ev]');
    evs.forEach(function (li) { if (new Date((li.dataset.end || li.dataset.date) + 'T23:59:59') < TODAY) li.remove(); });
    evs = $$('[data-ev]');
    var evEmpty = $('[data-ev-empty]'), evCount = $('[data-ev-count]');
    function evApply() {
      var f = {}; if (evf) $$('[data-f]', evf).forEach(function (s) { f[s.dataset.f] = s.value; });
      var n = 0, wk = new Date(TODAY); wk.setDate(wk.getDate() + 7); var mo = new Date(TODAY); mo.setDate(mo.getDate() + 31);
      evs.forEach(function (li) {
        var dt = new Date(li.dataset.date + 'T12:00:00'), ok = true;
        if (f.town && li.dataset.town !== f.town) ok = false;
        if (f.cat && li.dataset.cat !== f.cat) ok = false;
        if (f.when === 'week' && dt > wk) ok = false;
        if (f.when === 'month' && dt > mo) ok = false;
        if (f.when === 'weekend') { var day = dt.getDay(), diff = (dt - TODAY) / 864e5; if (!(diff < 8 && (day === 0 || day === 5 || day === 6))) ok = false; }
        li.hidden = !ok; if (ok) n++;
      });
      $$('[data-ev-month]').forEach(function (h) { var any = $$('[data-ev]:not([hidden])', h.parentNode).length; h.parentNode.hidden = !any; });
      if (evEmpty) evEmpty.hidden = n > 0;
      if (evCount) evCount.textContent = n + (n === 1 ? ' event' : ' events');
    }
    if (evf) { $$('[data-f]', evf).forEach(function (s) { s.addEventListener('change', evApply); }); var q = new URLSearchParams(location.search); $$('[data-f]', evf).forEach(function (s) { if (q.get(s.dataset.f)) s.value = q.get(s.dataset.f); }); }
    evApply();
  }

  /* ---------- listings filters, sort, show more ---------- */
  $$('[data-lfilter]').forEach(function (fm) {
    var grid = fm.parentNode.querySelector('[data-lgrid]'); if (!grid) return;
    var items = $$('[data-l]', grid), cnt = $('[data-lcount]', fm), empty = fm.parentNode.querySelector('[data-lempty]');
    var more = fm.parentNode.querySelector('[data-lmore]'), PAGE = 24, shown = PAGE, kind = fm.dataset.lfilter;
    function apply() {
      var f = {}; $$('[data-f]', fm).forEach(function (s) { f[s.dataset.f] = s.value; });
      var sort = ($('[data-sort]', fm) || {}).value || 'order';
      var list = items.slice().sort(function (a, b) {
        if (sort === 'price-d') return b.dataset.price - a.dataset.price;
        if (sort === 'price-a') return a.dataset.price - b.dataset.price;
        return a.dataset.order - b.dataset.order;
      });
      var n = 0;
      list.forEach(function (li) {
        var p = +li.dataset.price, ok = true;
        if (f.town && li.dataset.town !== f.town) ok = false;
        if (f.kind && li.dataset.kind !== f.kind) ok = false;
        if (f.max && p > +f.max) ok = false;
        if (f.beds && +li.dataset.beds < +f.beds) ok = false;
        if (f.side && li.dataset.side !== f.side && li.dataset.side !== 'both') ok = false;
        if (f.band) { var r = f.band.split('-'); if (p < +r[0] || p >= +r[1]) ok = false; }
        if (f.recent && li.dataset.recent !== '1') ok = false;
        grid.appendChild(li);
        li.classList.toggle('is-out', !ok);
        if (ok) { n++; li.removeAttribute('data-more'); li.classList.toggle('is-hidden', !!more && n > shown); if (more && n > shown) li.setAttribute('data-more', ''); }
      });
      if (cnt) cnt.textContent = n + (kind === 'sale' ? (n === 1 ? ' listing' : ' listings') : (n === 1 ? ' sale' : ' sales'));
      if (empty) empty.hidden = n > 0;
      if (more) more.parentNode.hidden = n <= shown;
      var q = new URLSearchParams(); Object.keys(f).forEach(function (k) { if (f[k]) q.set(k, f[k]); }); if (sort !== 'order') q.set('sort', sort);
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    }
    var q0 = new URLSearchParams(location.search);
    $$('[data-f],[data-sort]', fm).forEach(function (s) { var k = s.dataset.f || 'sort'; if (q0.get(k)) s.value = q0.get(k); s.addEventListener('change', function () { shown = PAGE; apply(); }); });
    if (more) more.addEventListener('click', function () { var firstNew = PAGE; shown += PAGE; apply(); var vis = $$('[data-l]:not(.is-out):not(.is-hidden)', grid)[shown - PAGE]; if (vis) { var a = vis.querySelector('a,h3'); vis.setAttribute('tabindex', '-1'); vis.focus({ preventScroll: false }); } });
    var rs = fm.parentNode.querySelector('[data-lreset]'); if (rs) rs.addEventListener('click', function () { $$('[data-f]', fm).forEach(function (s) { s.value = ''; }); apply(); });
    apply();
  });
  /* photo strip arrows */
  var strip = $('[data-strip]');
  if (strip) {
    var sp = $('[data-strip-prev]'), sn = $('[data-strip-next]');
    var sstep = function (dir) { strip.scrollBy({ left: dir * strip.clientWidth * 0.9, behavior: RM ? 'auto' : 'smooth' }); };
    sp && sp.addEventListener('click', function () { sstep(-1); }); sn && sn.addEventListener('click', function () { sstep(1); });
  }
  /* lightbox */
  var lb = $('[data-lb]');
  if (lb && lb.showModal) {
    var srcs = []; try { srcs = JSON.parse($('[data-lb-src]', lb).textContent); } catch (e) {}
    var img = $('[data-lb-img]', lb), cap = $('[data-lb-cap]', lb), idx = 0, opener;
    var show = function (i) { idx = (i + srcs.length) % srcs.length; var u = srcs[idx]; img.src = (u.charAt(0) === '/' && u.charAt(1) !== '/') ? ((window.SITE && SITE.base) || '') + u : u; img.alt = 'Photo ' + (idx + 1) + ' of ' + srcs.length; cap.textContent = (idx + 1) + ' / ' + srcs.length; };
    $$('[data-lb-open]').forEach(function (b) { b.addEventListener('click', function () { opener = b; show(+b.dataset.lbOpen); lb.showModal(); d.body.classList.add('lock'); $('[data-lb-close]', lb).focus(); }); });
    $('[data-lb-prev]', lb).addEventListener('click', function () { show(idx - 1); });
    $('[data-lb-next]', lb).addEventListener('click', function () { show(idx + 1); });
    $('[data-lb-close]', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('close', function () { d.body.classList.remove('lock'); opener && opener.focus(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
    var tx = null; lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (tx == null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); tx = null; });
  }

  /* ---------- mortgage calculator ---------- */
  var calc = $('[data-calc]');
  if (calc) {
    var out = $('[data-calc-out]', calc);
    var run = function () {
      var g = function (id) { return parseFloat((d.getElementById(id) || {}).value) || 0; };
      var price = g('c-price'), down = g('c-down') / 100, rate = g('c-rate') / 100 / 12, n = g('c-term') * 12;
      var loan = price * (1 - down), pi = rate ? loan * rate / (1 - Math.pow(1 + rate, -n)) : loan / n, extra = (g('c-tax') + g('c-ins')) / 12;
      var fmt = function (x) { return '$' + Math.round(x).toLocaleString('en-US'); };
      out.innerHTML = '<span class="k">Estimated monthly payment</span><strong>' + fmt(pi + extra) + '</strong><span>' + fmt(pi) + ' principal &amp; interest' + (extra ? ' + ' + fmt(extra) + ' taxes &amp; insurance' : '') + ' on a ' + fmt(loan) + ' loan.</span>';
    };
    $$('input,select', calc).forEach(function (el) { el.addEventListener('input', run); el.addEventListener('change', run); });
    var qp = new URLSearchParams(location.search).get('price'); if (qp && d.getElementById('c-price')) d.getElementById('c-price').value = qp;
    run();
  }

  /* ---------- seller timeline ---------- */
  var tl = $('[data-timeline]');
  if (tl) {
    var TASKS = JSON.parse($('[data-tl-tasks]', tl).textContent), tout = $('[data-tl-out]', tl), tf = $('[data-tl-form]', tl), KEY = 'ally-timeline';
    var di = $('#tl-date', tf); var min = new Date(TODAY); min.setDate(min.getDate() + 7); di.min = iso(min);
    var saved = null; try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    function opts() {
      return { date: di.value, living: ($('input[name=living]:checked', tf) || {}).value, staging: ($('input[name=staging]:checked', tf) || {}).value,
        prep: $$('input[name=prep]:checked', tf).map(function (x) { return x.value; }) };
    }
    function build(o, done) {
      done = done || {};
      var list = new Date(o.date + 'T12:00:00'), weeks = Math.floor((list - TODAY) / (7 * 864e5));
      var optional = ['repairs', 'preinspect', 'declutter', 'paint'];
      var tasks = TASKS.filter(function (t) {
        if (optional.indexOf(t.key) > -1 && o.prep.indexOf(t.key) < 0) return false;
        if (t.key === 'staging' && o.staging === 'no') return false;
        return true;
      }).map(function (t) { return Object.assign({}, t); });
      if (o.living === 'no') tasks.forEach(function (t) { if (t.key === 'declutter') t.label = 'Clear out remaining belongings; decide what staging furniture is needed'; if (t.key === 'showings') t.label = 'Set lockbox access, utilities on and a vacant-home check schedule'; });
      var compress = weeks < 8, scale = weeks >= 8 ? 1 : Math.max(weeks, 0) / 8;
      tasks.forEach(function (t) {
        var wk = weeks >= 8 ? t.w : Math.max(Math.round(t.w * scale), t.key === 'launch' ? 0 : Math.min(t.min, weeks));
        if (weeks > 12 && t.w >= 6) wk = t.w + Math.min(4, Math.floor((weeks - 12) / 3));
        t.wk = Math.min(wk, weeks); var due = new Date(list); due.setDate(due.getDate() - t.wk * 7); if (due < TODAY) due = new Date(TODAY); t.due = due;
      });
      var groups = {};
      tasks.forEach(function (t) { var k = iso(t.due); (groups[k] = groups[k] || []).push(t); });
      var keys = Object.keys(groups).sort();
      var note = weeks < 3 ? '<p class="note"><strong>Two weeks or less:</strong> the plan is condensed to the essentials. Call Ally this week so pricing, photos and repairs can run in parallel.</p>' :
        compress ? '<p class="note"><strong>A shorter runway:</strong> several steps overlap. Start with the pricing conversation so Ally can tell you which repairs are worth the time.</p>' :
        weeks > 20 ? '<p class="note"><strong>Plenty of time:</strong> the early steps start now so larger repairs can be spread out. Nothing here needs to happen all at once.</p>' : '';
      var html = '<div class="ig-head" style="margin-bottom:1rem"><div><p class="eyebrow">Your plan</p><h3 class="big-serif" style="font-size:var(--t-xl)">' + weeks + ' weeks to ' + list.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '</h3></div>' +
        '<div class="btns no-print"><button class="btn ghost" type="button" data-tl-print>Print</button><a class="btn" href="#tl-review">Have Ally Review My Timeline</a></div></div>' + note + '<ol class="week">';
      keys.forEach(function (k) {
        var dt = new Date(k + 'T12:00:00');
        html += '<li><p class="kicker-num">Week of ' + dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</p><ul class="checklist">' +
          groups[k].map(function (t) { return '<li><label class="task"><input type="checkbox" data-tk="' + t.key + '"' + (done[t.key] ? ' checked' : '') + '> <span><small>' + esc(t.group) + '</small> ' + esc(t.label) + '</span></label></li>'; }).join('') + '</ul></li>';
      });
      html += '</ol><p class="muted" style="font-size:var(--t-sm)">Saved in this browser only. Ally will adjust it after the walk-through.</p>';
      tout.innerHTML = html; tout.hidden = false;
      $$('[data-tk]', tout).forEach(function (c) { c.addEventListener('change', function () { done[c.dataset.tk] = c.checked; save(o, done); }); });
      $('[data-tl-print]', tout).addEventListener('click', function () { w.print(); });
      carry({ 'List date': list.toLocaleDateString('en-US'), 'Living in the home': o.living === 'yes' ? 'Yes' : 'No', 'Prep tasks': o.prep.join(', ') || 'None', 'Staging guidance': o.staging }, 'Your timeline');
      var rf = $('#tl-review form[data-form]'); if (rf) fillCarry(rf);
      save(o, done);
    }
    function save(o, done) { try { localStorage.setItem(KEY, JSON.stringify({ o: o, done: done })); } catch (e) {} }
    $('[data-tl-build]', tl).addEventListener('click', function () {
      if (!di.value) { fieldErr(di, 'Choose a target list date.'); di.focus(); return; }
      if (new Date(di.value + 'T12:00:00') < TODAY) { fieldErr(di, 'Choose a date in the future.'); di.focus(); return; }
      fieldErr(di, ''); build(opts()); tout.setAttribute('tabindex', '-1'); tout.focus(); track('tool_use', { tool: 'seller_timeline' });
    });
    if (saved && saved.o && saved.o.date && new Date(saved.o.date) >= TODAY) {
      di.value = saved.o.date; build(saved.o, saved.done);
    }
  }

  /* ---------- hotspots ---------- */
  $$('[data-hs]').forEach(function (b) {
    b.addEventListener('click', function () {
      var wrap = b.closest('[data-hs-wrap]'), id = b.getAttribute('aria-controls');
      $$('[data-hs]', wrap).forEach(function (x) { x.setAttribute('aria-expanded', x === b ? 'true' : 'false'); });
      $$('[data-hs-panel]', wrap).forEach(function (p) { p.hidden = p.id !== id; });
      var p = d.getElementById(id); if (p) { p.setAttribute('tabindex', '-1'); p.focus({ preventScroll: true }); p.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }); }
    });
  });
  /* ---------- before/after ---------- */
  $$('[data-ba]').forEach(function (ba) {
    var r = $('input[type=range]', ba); if (!r) return;
    var set = function () { ba.style.setProperty('--x', r.value + '%'); r.setAttribute('aria-valuetext', r.value + '% before'); };
    r.addEventListener('input', set); set();
  });
})();
