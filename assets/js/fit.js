/* Find My Carolina Community — one question at a time, live ranking, transparent scoring (rules printed on the page). */
(function () {
  var A = window.ALLY, root = document.querySelector('[data-ff]'); if (!root || !A) return;
  var $ = A.$, $$ = A.$$, esc = A.esc, B = A.base || '';
  var towns = JSON.parse($('[data-fit-data]', root).textContent);
  var form = $('[data-ff-form]', root), out = $('[data-ff-out]', root), steps = $$('.ff-step', root);
  var rank = $('[data-ff-rank]', root), liveH = $('[data-ff-live-h]', root), bar = $('[data-ff-bar]', root);
  var bNext = $('[data-ff-next]', root), bGo = $('[data-ff-go]', root), bBack = $('[data-ff-back]', root), bSkip = $('[data-ff-skip]', root);
  var cur = 1, N = steps.length, pointer = false, timer = 0;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LBL = { sat: { main: 'a walkable Main Street', water: 'time on the water', outdoors: 'trails and summit views', city: 'an afternoon in the city' },
    set: { downtown: 'being close to a downtown', neighborhood: 'established neighborhoods', water: 'being near the water', country: 'room to spread out' },
    reach: { charlotte: 'Charlotte', gastonia: 'Gastonia', york: 'Rock Hill and York County', lake: 'Lake Wylie' } };
  var SHORT = { sat: { main: 'Main Street', water: 'On the water', outdoors: 'Trails', city: 'The city' }, set: { downtown: 'Downtown', neighborhood: 'Neighborhood', water: 'Water', country: 'Space' },
    lot: { small: 'Small yard', standard: 'Typical lot', acre: 'Acre+' }, reach: { charlotte: 'CLT', gastonia: 'Gastonia', york: 'York Co.', lake: 'Lake Wylie' }, kind: { home: 'Home', land: 'Land', either: 'Either' } };

  function val(n) { var c = $('input[name=' + n + ']:checked', form); return c ? c.value : ''; }
  function vals(n) { return $$('input[name=' + n + ']:checked', form).map(function (c) { return c.value; }); }
  function answers() { return { sat: val('sat'), set: val('set'), lot: val('lot'), reach: vals('reach'), kind: val('kind') }; }
  function maxFor(a) { return (a.sat ? 3 : 0) + (a.set ? 2 : 0) + ((a.lot === 'acre' || a.kind === 'land') ? 2 : 0) + (a.lot === 'small' ? 1 : 0) + a.reach.length; }
  function score(t, a) {
    var s = 0, why = [], f = t.fit;
    if (a.sat && f.sat.indexOf(a.sat) > -1) { s += 3; why.push('Known for ' + LBL.sat[a.sat]); }
    if (a.set && f.set.indexOf(a.set) > -1) { s += 2; why.push('Offers ' + LBL.set[a.set]); }
    if ((a.lot === 'acre' || a.kind === 'land') && f.set.indexOf('country') > -1) { s += 2; why.push('Has more rural land and larger lots around town'); }
    if (a.lot === 'small' && f.set.indexOf('downtown') > -1) { s += 1; why.push('Has in-town homes with smaller yards near downtown'); }
    a.reach.forEach(function (r) { if (f.reach.indexOf(r) > -1) { s += 1; why.push('On the ' + LBL.reach[r] + ' side of the region'); } });
    return { t: t, s: s, why: why };
  }
  function ranked(a) {
    return towns.map(function (t) { return score(t, a); }).filter(function (x) { return x.s > 0; })
      .sort(function (x, y) { return y.s - x.s || y.why.length - x.why.length || x.t.name.localeCompare(y.t.name); });
  }
  function vis(t) { return B ? t.vis.replace(/(="|, )\/assets/g, '$1' + B + '/assets') : t.vis; }
  function pct(s, m) { return m ? Math.round(100 * s / m) : 0; }

  /* ---------- live ranking (FLIP-animated) ---------- */
  var rows = {};
  function live() {
    var a = answers(), m = maxFor(a), r = ranked(a).slice(0, 6);
    if (!m) { rank.innerHTML = ''; rows = {}; liveH.innerHTML = 'Answer a question and the towns <em>start to rank.</em>'; root.classList.remove('ff-has'); return; }
    root.classList.add('ff-has');
    liveH.innerHTML = r.length ? '<b>' + r.length + (r.length === 6 ? '+' : '') + '</b> towns in the running' : 'No town scores yet. <em>Try another answer.</em>';
    var first = {}; Object.keys(rows).forEach(function (k) { first[k] = rows[k].getBoundingClientRect().top; });
    var keep = {};
    r.forEach(function (x, i) {
      var k = x.t.slug, li = rows[k];
      if (!li) {
        li = document.createElement('li'); li.className = 'ff-row ff-in';
        li.innerHTML = '<span class="ff-rn"></span><span class="ff-rt">' + vis(x.t) + '</span><span class="ff-rb"><a href="' + B + '/' + k + '/">' + esc(x.t.name) + '<small>, ' + esc(x.t.st) + '</small></a><span class="ff-meter"><span></span></span></span><span class="ff-rp"></span>';
        rows[k] = li;
      }
      $('.ff-rn', li).textContent = i + 1;
      $('.ff-rp', li).textContent = pct(x.s, m) + '%';
      $('.ff-meter span', li).style.width = pct(x.s, m) + '%';
      li.classList.toggle('lead', i === 0);
      rank.appendChild(li); keep[k] = 1;
    });
    Object.keys(rows).forEach(function (k) { if (!keep[k]) { rows[k].remove(); delete rows[k]; } });
    if (reduce) return;
    Object.keys(rows).forEach(function (k) {
      var li = rows[k], f = first[k];
      if (f == null) { requestAnimationFrame(function () { li.classList.remove('ff-in'); }); return; }
      var d = f - li.getBoundingClientRect().top; if (!d) return;
      li.style.transition = 'none'; li.style.transform = 'translateY(' + d + 'px)';
      requestAnimationFrame(function () { requestAnimationFrame(function () { li.style.transition = ''; li.style.transform = ''; }); });
    });
  }

  /* ---------- stepper ---------- */
  function summary(k) {
    if (k === 'reach') { var v = vals('reach'); return v.map(function (x) { return SHORT.reach[x]; }).join(' · '); }
    var x = val(k); return x ? SHORT[k][x] : '';
  }
  function paintProg() {
    $$('.ff-prog button', root).forEach(function (b, i) {
      var n = i + 1, k = steps[i].getAttribute('data-key'), s = summary(k);
      b.classList.toggle('done', !!s); b.classList.toggle('on', n === cur && !out.classList.contains('show'));
      if (n === cur && !out.classList.contains('show')) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      $('.ff-pa', b).textContent = s;
    });
    var done = steps.filter(function (s) { return !!summary(s.getAttribute('data-key')); }).length;
    bar.style.width = (out.classList.contains('show') ? 100 : Math.max(done, cur - 1) / N * 100) + '%';
  }
  function show(n, focus) {
    clearTimeout(timer);
    cur = Math.max(1, Math.min(N, n));
    out.classList.remove('show'); out.hidden = true; form.hidden = false; root.classList.remove('ff-done');
    steps.forEach(function (s, i) {
      var on = i + 1 === cur; s.hidden = !on;
      if (on && !reduce) { s.classList.remove('ff-enter'); void s.offsetWidth; s.classList.add('ff-enter'); }
    });
    bBack.disabled = cur === 1;
    var last = cur === N; bNext.hidden = last; bGo.hidden = !last; bSkip.textContent = last ? 'Skip and show towns' : 'Skip';
    var st = steps[cur - 1], multi = st.hasAttribute('data-multi');
    bNext.innerHTML = (multi || summary(st.getAttribute('data-key')) ? 'Next ' : 'Next ') + A_ARR;
    paintProg();
    if (focus) { var q = $('.ff-q', st); q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true }); }
    var top = root.getBoundingClientRect().top; if (focus && (top < 0 || top > innerHeight * 0.4)) root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  var A_ARR = bNext.querySelector('svg') ? bNext.querySelector('svg').outerHTML : '→';

  form.addEventListener('pointerdown', function () { pointer = true; });
  form.addEventListener('keydown', function (e) {
    pointer = false;
    if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); cur < N ? show(cur + 1, true) : results(true); }
  });
  form.addEventListener('change', function (e) {
    live(); paintProg();
    var st = e.target.closest('.ff-step');
    if (pointer && st && !st.hasAttribute('data-multi') && e.target.checked) {
      st.classList.add('ff-picked');
      timer = setTimeout(function () { st.classList.remove('ff-picked'); cur < N ? show(cur + 1, true) : results(true); }, reduce ? 0 : 420);
    }
    pointer = false;
  });
  bNext.addEventListener('click', function () { show(cur + 1, true); });
  bBack.addEventListener('click', function () { show(cur - 1, true); });
  bSkip.addEventListener('click', function () { var st = steps[cur - 1]; $$('input', st).forEach(function (i) { i.checked = false; }); live(); cur < N ? show(cur + 1, true) : results(true); });
  bGo.addEventListener('click', function () { results(true); });
  $$('.ff-prog button', root).forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-goto'), true); }); });

  /* ---------- results ---------- */
  function chips(a) {
    var c = [];
    ['sat', 'set', 'lot', 'kind'].forEach(function (k) { if (a[k]) c.push(SHORT[k][a[k]]); });
    a.reach.forEach(function (x) { c.push(SHORT.reach[x]); });
    return c;
  }
  function results(push) {
    clearTimeout(timer);
    var a = answers(), m = maxFor(a), r = ranked(a).slice(0, 3), html = '';
    form.hidden = true; out.hidden = false; root.classList.add('ff-done');
    requestAnimationFrame(function () { out.classList.add('show'); paintProg(); });
    if (!m) {
      out.innerHTML = '<div class="ff-empty"><p class="ff-k">Nothing to match yet</p><h2>Answer at least <em>one question</em></h2><p>Every question is optional, but the quiz needs one answer to rank towns.</p><button class="btn" type="button" data-ff-edit="1">Start with your Saturday ' + A_ARR + '</button></div>';
      wire(); return;
    }
    if (!r.length) {
      out.innerHTML = '<div class="ff-empty"><p class="ff-k">No close match</p><h2>These answers point in <em>different directions</em></h2><p>Try changing one answer, or ask Ally directly. She knows these towns street by street.</p><button class="btn" type="button" data-ff-edit="1">Edit my answers ' + A_ARR + '</button></div>';
      wire(); return;
    }
    var top = r[0];
    html += '<div class="ff-rhead"><div><p class="ff-k">Your matches</p><h2>' + (r.length === 1 ? 'One town fits' : r.length + ' towns fit') + ' <em>your Saturday</em></h2></div><ul class="ff-chips">' + chips(a).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div>';
    html += '<article class="ff-hero"><div class="ff-hero-v">' + vis(top.t) + '<span class="ff-badge">Best match · ' + pct(top.s, m) + '%</span></div><div class="ff-hero-b"><p class="ff-script">Match one</p><h3>' + esc(top.t.name) + '<small>, ' + esc(top.t.st) + '</small></h3>' +
      '<ul class="ff-why">' + top.why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' +
      '<dl class="ff-dl"><div><dt>Local detail</dt><dd>' + esc(top.t.fit.detail) + '</dd></div><div><dt>Worth checking</dt><dd>' + esc(top.t.consider) + '</dd></div></dl>' +
      '<div class="btns"><a class="btn" href="' + B + '/' + top.t.slug + '/">Read the ' + esc(top.t.name) + ' guide ' + A_ARR + '</a></div></div></article>';
    if (r.length > 1) {
      html += '<div class="ff-more">' + r.slice(1).map(function (x, i) {
        return '<article class="ff-mini"><a class="ff-mini-v" href="' + B + '/' + x.t.slug + '/" tabindex="-1" aria-hidden="true">' + vis(x.t) + '</a><div class="ff-mini-b"><p class="ff-script">Match ' + (i === 0 ? 'two' : 'three') + '</p><h3><a href="' + B + '/' + x.t.slug + '/">' + esc(x.t.name) + '<small>, ' + esc(x.t.st) + '</small></a></h3><div class="ff-meter big"><span style="width:' + pct(x.s, m) + '%"></span></div><p class="ff-pp">' + pct(x.s, m) + '% match</p>' +
          '<ul class="ff-why sm">' + x.why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul><p class="ff-chk"><strong>Worth checking:</strong> ' + esc(x.t.consider) + '</p></div></article>';
      }).join('') + '</div>';
    }
    html += '<div class="ff-actions">' + (r.length > 1 ? '<button class="btn ghost" type="button" data-fit-cmp>Compare my top two</button>' : '') + '<a class="btn" href="#towns-form" data-fit-ask>Ask Ally about these towns ' + A_ARR + '</a><button class="ff-link" type="button" data-ff-edit="1">Edit answers</button><button class="ff-link" type="button" data-ff-copy>Copy link to my results</button><button class="ff-link" type="button" data-ff-reset>Start over</button></div><div data-fit-cmpout></div>';
    out.innerHTML = html;
    wire(r);
    var summaryObj = { 'Saturday': a.sat ? LBL.sat[a.sat] : '', 'Surroundings': a.set ? LBL.set[a.set] : '', 'Land': { small: 'A small yard', standard: 'A typical lot', acre: 'An acre or more' }[a.lot] || '',
      'Places to reach': a.reach.map(function (x) { return LBL.reach[x]; }), 'Home or land': { home: 'Existing home', land: 'Land to build on', either: 'Either' }[a.kind] || '', 'Matched towns': r.map(function (x) { return x.t.name + ', ' + x.t.st; }) };
    A.carry(summaryObj, 'Your Find My Fit results');
    var wrap = document.querySelector('[data-fit-form-wrap]'); if (wrap) { wrap.hidden = false; var f = $('form[data-form]', wrap); if (f) A.fillCarry(f); }
    if (push) {
      var q = new URLSearchParams(); ['sat', 'set', 'lot', 'kind'].forEach(function (k) { if (a[k]) q.set(k, a[k]); }); if (a.reach.length) q.set('reach', a.reach.join(','));
      history.replaceState(null, '', '?' + q.toString());
      out.focus({ preventScroll: true }); root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
    A.track('tool_use', { tool: 'find_my_fit', matches: r.length });
  }
  function wire(r) {
    $$('[data-ff-edit]', out).forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-ff-edit'), true); }); });
    var rs = $('[data-ff-reset]', out); if (rs) rs.addEventListener('click', reset);
    var cp = $('[data-ff-copy]', out); if (cp) cp.addEventListener('click', function () {
      var u = location.href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { cp.textContent = 'Link copied'; }, function () { prompt('Copy this link', u); });
    });
    var cb = $('[data-fit-cmp]', out);
    if (cb && r) cb.addEventListener('click', function () {
      var p = r[0].t, q = r[1].t, known = { 'belmont-vs-mount-holly': ['belmont', 'mount-holly'], 'gastonia-vs-kings-mountain': ['gastonia', 'kings-mountain'], 'fort-mill-vs-lake-wylie': ['fort-mill', 'lake-wylie'] }, hit = '';
      Object.keys(known).forEach(function (k) { if (known[k].indexOf(p.slug) > -1 && known[k].indexOf(q.slug) > -1) hit = k; });
      var rw = [['Why it matched', r[0].why.join('; '), r[1].why.join('; ')], ['Local detail', p.fit.detail, q.fit.detail], ['Worth checking', p.consider, q.consider]];
      var box = $('[data-fit-cmpout]', out);
      box.innerHTML = '<div class="ff-cmp"><div class="ff-cmp-h"><span>' + esc(p.name) + '</span><i>vs</i><span>' + esc(q.name) + '</span></div>' + rw.map(function (x) { return '<div class="ff-cmp-r"><p class="ff-k">' + x[0] + '</p><div><p>' + esc(x[1]) + '</p><p>' + esc(x[2]) + '</p></div></div>'; }).join('') +
        (hit ? '<p class="ff-cmp-l"><a class="link" href="' + B + '/communities/compare/' + hit + '/">Read the full ' + esc(p.name) + ' and ' + esc(q.name) + ' comparison</a></p>' : '') + '</div>';
      box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      A.track('tool_use', { tool: 'find_my_fit_compare' });
    });
  }
  function reset() {
    form.reset(); live(); history.replaceState(null, '', location.pathname);
    var wrap = document.querySelector('[data-fit-form-wrap]'); if (wrap) wrap.hidden = true;
    show(1, true);
  }

  /* ---------- prefill from URL (?sat=main etc.) ---------- */
  var q = new URLSearchParams(location.search), pre = false;
  ['sat', 'set', 'lot', 'kind'].forEach(function (k) { var v = q.get(k); if (v) { var el = $('input[name=' + k + '][value="' + CSS.escape(v) + '"]', form); if (el) { el.checked = true; pre = true; } } });
  (q.get('reach') || '').split(',').forEach(function (v) { if (!v) return; var el = $('input[name=reach][value="' + CSS.escape(v) + '"]', form); if (el) { el.checked = true; pre = true; } });
  live();
  var keys = q.toString() ? Array.from(q.keys()) : [];
  if (pre && keys.length === 1 && keys[0] === 'sat') show(2, false);  /* came from a Saturday pick: continue the quiz */
  else if (pre) results(false);
  else show(1, false);
})();
