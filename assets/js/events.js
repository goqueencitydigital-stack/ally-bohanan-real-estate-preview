/* Local Events: hide past events by the visitor's date, weekend spotlights, filters, list/calendar view. No libraries. */
(function () {
  'use strict';
  var root = document.querySelector('[data-xe-results]'); if (!root) return;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function day(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function add(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);

  /* ---- data from the server-rendered cards; past events removed ---- */
  var cards = $$('[data-xe]', root).filter(function (li) {
    var end = day(li.dataset.end || li.dataset.date);
    if (end < TODAY) { li.remove(); return false; }
    return true;
  });
  var EV = cards.map(function (li) {
    var a = day(li.dataset.date), b = day(li.dataset.end || li.dataset.date);
    return { el: li, id: li.dataset.id, a: a, b: b, span: Math.round((b - a) / 864e5), town: li.dataset.town, cat: li.dataset.cat,
      free: li.dataset.free === '1', time: li.dataset.time, title: $('[data-xe-title]', li).textContent };
  });
  var total = $('[data-xe-total]'); if (total) total.textContent = EV.length;

  /* ---- date ranges ---- */
  function weekends() {
    var wd = TODAY.getDay(), fri, start;
    if (wd === 5 || wd === 6 || wd === 0) { fri = add(TODAY, wd === 0 ? -2 : 5 - wd); start = TODAY; }
    else { fri = add(TODAY, 5 - wd); start = fri; }
    return { weekend: [start, add(fri, 2)], next: [add(fri, 7), add(fri, 9)] };
  }
  var WK = weekends();
  function range(when) {
    if (when === 'weekend' || when === 'next') return WK[when];
    if (when === 'week') return [TODAY, add(TODAY, 6)];
    if (when === 'month') return [TODAY, new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0)];
    return null;
  }
  function overlaps(e, r) { return e.a <= r[1] && e.b >= r[0]; }
  function rtxt(r) {
    var a = r[0], b = r[1];
    if (+a === +b) return MON[a.getMonth()] + ' ' + a.getDate();
    return a.getMonth() === b.getMonth() ? MON[a.getMonth()] + ' ' + a.getDate() + '–' + b.getDate() : MON[a.getMonth()] + ' ' + a.getDate() + ' – ' + MON[b.getMonth()] + ' ' + b.getDate();
  }
  function shortWhen(e) {
    if (e.span > 0) return 'Through ' + MON[e.b.getMonth()] + ' ' + e.b.getDate();
    return DOW[e.a.getDay()] + ' ' + MON[e.a.getMonth()] + ' ' + e.a.getDate() + (e.time ? ' · ' + e.time : '');
  }

  /* ---- weekend spotlights ---- */
  $$('[data-xe-spot]').forEach(function (box) {
    var key = box.dataset.xeSpot, r = WK[key]; if (!r) return;
    var hit = EV.filter(function (e) { return overlaps(e, r); });
    var short = hit.filter(function (e) { return e.span <= 4; }), long = hit.filter(function (e) { return e.span > 4; });
    $('[data-xe-range]', box).textContent = rtxt(r);
    $('[data-xe-spot-list]', box).innerHTML = short.slice(0, 6).map(function (e) {
      return '<li class="xe-si xe-' + e.cat + '"><a href="#ev-' + e.id + '"><span class="xe-si-date"><b>' + e.a.getDate() + '</b>' + MON[e.a.getMonth()] + '</span><span class="xe-si-txt"><strong>' + esc(e.title) + '</strong><span>' + esc(e.town) + ' · ' + esc(shortWhen(e)) + '</span></span></a></li>';
    }).join('');
    var more = $('[data-xe-spot-more]', box); more.hidden = short.length <= 6; more.textContent = '+ ' + (short.length - 6) + ' more';
    var also = $('.xe-also', box), empty = $('.xe-spot-empty', box);
    if (also) also.remove(); if (empty) empty.remove();
    if (long.length) { var p = document.createElement('p'); p.className = 'xe-also'; p.innerHTML = '<b>Also running:</b> ' + long.map(function (e) { return '<a href="#ev-' + e.id + '">' + esc(e.title) + '</a>'; }).join(', '); box.appendChild(p); }
    if (!hit.length) { var q = document.createElement('p'); q.className = 'xe-spot-empty'; q.innerHTML = 'Nothing on the calendar yet. <a href="/lifestyle/plan-my-weekend/">Plan My Weekend</a> builds a day from verified places instead.'; box.appendChild(q); }
  });

  /* ---- filters ---- */
  var form = $('[data-xe-filters]'), list = $('[data-xe-list]'), cal = $('[data-xe-cal]'), empty = $('[data-xe-empty]'), count = $('[data-xe-count]');
  var townSel = $('[data-xe-town]', form);
  var S = { when: '', cat: '', town: '', free: false, view: 'list' };
  var q = new URLSearchParams(location.search);
  if (q.get('when') && range(q.get('when'))) S.when = q.get('when');
  if (q.get('cat') && $('[data-xe-cat="' + q.get('cat').replace(/[^a-z]/g, '') + '"]', form)) S.cat = q.get('cat');
  if (q.get('town')) S.town = q.get('town');
  if (q.get('free') === '1') S.free = true;
  if (q.get('view') === 'cal') S.view = 'cal';
  if (S.town && !$$('option', townSel).some(function (o) { return o.value === S.town || o.textContent === S.town; })) S.town = '';

  var LABEL = { weekend: 'this weekend', next: 'next weekend', week: 'in the next 7 days', month: 'this month' };
  function ok(e) {
    if (S.cat && e.cat !== S.cat) return false;
    if (S.town && e.town !== S.town) return false;
    if (S.free && !e.free) return false;
    var r = range(S.when); if (r && !overlaps(e, r)) return false;
    return true;
  }
  function sync() {
    $$('[data-xe-when]', form).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.xeWhen === S.when)); });
    $$('[data-xe-cat]', form).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.xeCat === S.cat)); });
    $('[data-xe-free]', form).setAttribute('aria-pressed', String(S.free));
    $$('[data-xe-view]', form).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.xeView === S.view)); });
    townSel.value = S.town;
    var p = new URLSearchParams();
    if (S.when) p.set('when', S.when); if (S.cat) p.set('cat', S.cat); if (S.town) p.set('town', S.town); if (S.free) p.set('free', '1'); if (S.view === 'cal') p.set('view', 'cal');
    var qs = p.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (err) {}
  }
  function apply() {
    var shown = EV.filter(function (e) { var v = ok(e); e.el.hidden = !v; return v; });
    $$('[data-xe-month]', list).forEach(function (sec) {
      var n = $$('[data-xe]:not([hidden])', sec).length; sec.hidden = !n;
      var c = $('[data-xe-mcount]', sec); if (c) c.textContent = n + (n === 1 ? ' event' : ' events');
    });
    var n = shown.length, bits = [];
    if (S.free) bits.push('free'); if (S.cat) bits.push($('[data-xe-cat="' + S.cat + '"]', form).textContent.toLowerCase());
    var txt = n + ' ' + (bits.length ? bits.join(' ') + ' ' : '') + (n === 1 ? 'event' : 'events') + (S.town ? ' in ' + S.town : '') + (S.when ? ' ' + LABEL[S.when] : ' coming up');
    count.textContent = txt;
    empty.hidden = n > 0;
    list.hidden = S.view !== 'list' || !n;
    cal.hidden = S.view !== 'cal' || !n;
    if (S.view === 'cal' && n) drawCal(shown);
    sync();
  }
  form.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-xe-when')) S.when = b.dataset.xeWhen;
    else if (b.hasAttribute('data-xe-cat')) S.cat = b.dataset.xeCat;
    else if (b.hasAttribute('data-xe-free')) S.free = !S.free;
    else if (b.hasAttribute('data-xe-view')) S.view = b.dataset.xeView;
    else if (b.hasAttribute('data-xe-reset')) { S.when = ''; S.cat = ''; S.town = ''; S.free = false; }
    else return;
    apply();
  });
  townSel.addEventListener('change', function () { S.town = townSel.value; apply(); });
  function reset() { S.when = ''; S.cat = ''; S.town = ''; S.free = false; apply(); }
  $$('[data-xe-reset]').forEach(function (b) { if (!form.contains(b)) b.addEventListener('click', function () { reset(); form.querySelector('button').focus(); }); });
  function toFilters() { var bar = $('#filters'); if (bar) bar.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
  $$('[data-xe-show]').forEach(function (b) { b.addEventListener('click', function () { S.when = b.dataset.xeShow; S.cat = ''; S.town = ''; S.free = false; apply(); toFilters(); count.focus && count.setAttribute('tabindex', '-1'); count.focus({ preventScroll: true }); }); });
  $$('[data-xe-towngo]').forEach(function (b) { b.addEventListener('click', function () { S.town = b.dataset.xeTowngo; S.when = ''; S.cat = ''; S.free = false; apply(); toFilters(); townSel.focus({ preventScroll: true }); }); });

  /* ---- jump to a card (spotlights, calendar, shared #ev- links) ---- */
  function reveal(id) {
    var e = EV.filter(function (x) { return x.id === id; })[0]; if (!e) return false;
    if (e.el.hidden || S.view !== 'list') { if (e.el.hidden) { S.when = ''; S.cat = ''; S.town = ''; S.free = false; } S.view = 'list'; apply(); }
    e.el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    e.el.focus({ preventScroll: true });
    e.el.classList.add('xe-hit'); setTimeout(function () { e.el.classList.remove('xe-hit'); }, 1800);
    return true;
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href^="#ev-"]'); if (!a) return;
    if (reveal(a.getAttribute('href').slice(4))) { ev.preventDefault(); try { history.replaceState(null, '', location.pathname + location.search + a.getAttribute('href')); } catch (err) {} }
  });

  /* ---- calendar view ---- */
  function drawCal(shown) {
    var first = shown.reduce(function (m, e) { var a = +e.a < +TODAY ? TODAY : e.a; return a < m ? a : m; }, new Date(8.64e15));
    var lastD = shown.reduce(function (m, e) { var a = e.span > 4 ? (+e.a < +TODAY ? TODAY : e.a) : e.b; return a > m ? a : m; }, new Date(0));
    var html = '', cur = new Date(first.getFullYear(), first.getMonth(), 1);
    while (cur <= lastD) {
      var y = cur.getFullYear(), m = cur.getMonth(), mEnd = new Date(y, m + 1, 0);
      var mr = [cur, mEnd];
      var longs = shown.filter(function (e) { return e.span > 4 && overlaps(e, mr); });
      var byDay = {};
      shown.forEach(function (e) {
        if (e.span > 4) return;
        for (var d = new Date(e.a); d <= e.b; d = add(d, 1)) { if (d.getMonth() === m && d.getFullYear() === y && d >= TODAY) (byDay[d.getDate()] = byDay[d.getDate()] || []).push(e); }
      });
      if (!Object.keys(byDay).length && !longs.length) { cur = new Date(y, m + 1, 1); continue; }
      html += '<section class="xe-cm" aria-labelledby="xc-' + y + m + '"><header class="xe-mhead"><h2 id="xc-' + y + m + '"><span class="xe-mname">' + MONTH[m] + '</span> <em>' + y + '</em></h2></header>';
      if (longs.length) html += '<p class="xe-running"><b>Running this month</b>' + longs.map(function (e) { return '<a class="xe-run xe-' + e.cat + '" href="#ev-' + e.id + '">' + esc(e.title) + ' <span>' + esc(e.town) + ' · to ' + MON[e.b.getMonth()] + ' ' + e.b.getDate() + '</span></a>'; }).join('') + '</p>';
      html += '<div class="xe-cgrid" role="table" aria-label="' + MONTH[m] + ' ' + y + '"><div class="xe-crow xe-cdow" role="row">' + DOW.map(function (d) { return '<span role="columnheader"><abbr title="' + DOWL[DOW.indexOf(d)] + '">' + d + '</abbr></span>'; }).join('') + '</div>';
      var pad = cur.getDay(), cells = [], i;
      for (i = 0; i < pad; i++) cells.push('<span class="xe-cd xe-cd-x" role="cell"></span>');
      for (i = 1; i <= mEnd.getDate(); i++) {
        var dd = new Date(y, m, i), evs = byDay[i] || [], past = dd < TODAY, isT = +dd === +TODAY;
        var cls = 'xe-cd' + (past ? ' xe-cd-past' : '') + (isT ? ' xe-cd-today' : '') + (evs.length ? ' xe-cd-on' : '');
        if (evs.length) {
          var lab = DOWL[dd.getDay()] + ', ' + MONTH[m] + ' ' + i + ': ' + evs.length + (evs.length === 1 ? ' event' : ' events');
          cells.push('<span class="' + cls + '" role="cell"><button type="button" data-xe-day="' + iso(dd) + '" aria-label="' + esc(lab) + '" aria-expanded="false"><span class="xe-cn">' + i + '</span><span class="xe-dots" aria-hidden="true">' +
            evs.slice(0, 4).map(function (e) { return '<i class="xe-' + e.cat + '"></i>'; }).join('') + '</span><span class="xe-cpills" aria-hidden="true">' +
            evs.slice(0, 2).map(function (e) { return '<span class="xe-pill xe-' + e.cat + '">' + esc(e.title) + '</span>'; }).join('') + (evs.length > 2 ? '<span class="xe-pmore">+' + (evs.length - 2) + ' more</span>' : '') + '</span></button></span>');
        } else cells.push('<span class="' + cls + '" role="cell"><span class="xe-cn">' + i + '</span></span>');
      }
      while (cells.length % 7) cells.push('<span class="xe-cd xe-cd-x" role="cell"></span>');
      for (i = 0; i < cells.length; i += 7) html += '<div class="xe-crow" role="row">' + cells.slice(i, i + 7).join('') + '</div>';
      html += '</div><div class="xe-dayp" data-xe-dayp hidden></div></section>';
      cur = new Date(y, m + 1, 1);
    }
    cal.innerHTML = html;
  }
  cal.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-xe-day]'); if (!b) return;
    var sec = b.closest('.xe-cm'), panel = $('[data-xe-dayp]', sec), d = day(b.dataset.xeDay);
    var open = b.getAttribute('aria-expanded') === 'true';
    $$('[data-xe-day]', cal).forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
    $$('[data-xe-dayp]', cal).forEach(function (p) { p.hidden = true; });
    if (open) return;
    var evs = EV.filter(function (e) { return !e.el.hidden && e.span <= 4 && e.a <= d && e.b >= d; });
    panel.innerHTML = '<h3 tabindex="-1">' + DOWL[d.getDay()] + ', ' + MONTH[d.getMonth()] + ' ' + d.getDate() + '</h3><ul>' + evs.map(function (e) {
      return '<li class="xe-si xe-' + e.cat + '"><a href="#ev-' + e.id + '"><span class="xe-si-txt"><strong>' + esc(e.title) + '</strong><span>' + esc(e.town) + (e.time ? ' · ' + esc(e.time) : '') + '</span></span></a></li>';
    }).join('') + '</ul>';
    panel.hidden = false; b.setAttribute('aria-expanded', 'true');
    $('h3', panel).focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });

  apply();
  if (/^#ev-/.test(location.hash)) setTimeout(function () { reveal(location.hash.slice(4)); }, 60);
})();
