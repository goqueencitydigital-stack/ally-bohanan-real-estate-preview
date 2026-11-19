/* Find My Carolina Community — transparent rule-based matching (rules are printed on the page). */
(function () {
  var A = window.ALLY, root = document.querySelector('[data-fit]'); if (!root || !A) return;
  var $ = A.$, $$ = A.$$, esc = A.esc, B = A.base || '';
  var towns = JSON.parse($('[data-fit-data]', root).textContent);
  var form = $('[data-fit-form]', root), out = $('[data-fit-out]', root);
  var LBL = { sat: { main: 'a walkable Main Street', water: 'time on the water', outdoors: 'trails and summit views', city: 'an afternoon in the city' },
    set: { downtown: 'being close to a downtown', neighborhood: 'established neighborhoods', water: 'being near the water', country: 'room to spread out' },
    reach: { charlotte: 'Charlotte', gastonia: 'Gastonia', york: 'Rock Hill and York County', lake: 'Lake Wylie' } };
  function val(n) { var c = $('input[name=' + n + ']:checked', form); return c ? c.value : ''; }
  function vals(n) { return $$('input[name=' + n + ']:checked', form).map(function (c) { return c.value; }); }
  function answers() { return { sat: val('sat'), set: val('set'), lot: val('lot'), reach: vals('reach'), kind: val('kind') }; }
  function score(t, a) {
    var s = 0, why = [], f = t.fit;
    if (a.sat && f.sat.indexOf(a.sat) > -1) { s += 3; why.push('Known for ' + LBL.sat[a.sat]); }
    if (a.set && f.set.indexOf(a.set) > -1) { s += 2; why.push('Offers ' + LBL.set[a.set]); }
    if ((a.lot === 'acre' || a.kind === 'land') && f.set.indexOf('country') > -1) { s += 2; why.push('Has more rural land and larger lots around town'); }
    if (a.lot === 'small' && f.set.indexOf('downtown') > -1) { s += 1; why.push('Has in-town homes with smaller yards near downtown'); }
    a.reach.forEach(function (r) { if (f.reach.indexOf(r) > -1) { s += 1; why.push('On the ' + LBL.reach[r] + ' side of the region'); } });
    return { t: t, s: s, why: why };
  }
  function vis(t) { return B ? t.vis.replace(/(="|, )\/assets/g, '$1' + B + '/assets') : t.vis; }
  function run(push) {
    var a = answers(), any = a.sat || a.set || a.lot || a.kind || a.reach.length;
    if (!any) { out.hidden = false; out.innerHTML = '<p class="note">Answer at least one question and we will show matching towns. Every question is optional.</p>'; return; }
    var r = towns.map(function (t) { return score(t, a); }).filter(function (x) { return x.s > 0; })
      .sort(function (x, y) { return y.s - x.s || y.why.length - x.why.length; }).slice(0, 3);
    if (!r.length) { out.hidden = false; out.innerHTML = '<p class="note">No town matched these answers closely. Try changing one answer, or ask Ally directly below.</p>'; return; }
    var html = '<div class="ig-head"><div><p class="eyebrow">Your matches</p><h2 class="big-serif">' + (r.length === 1 ? 'One town fits' : r.length + ' towns fit') + ' what you described</h2></div></div>';
    r.forEach(function (x, i) {
      var t = x.t;
      html += '<article class="res-card">' + vis(t) + '<div class="res-body"><p class="kicker-num">Match ' + (i + 1) + '</p><h3>' + esc(t.name) + ', ' + esc(t.st) + '</h3>' +
        '<ul class="why">' + x.why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' +
        '<p><strong>Local detail:</strong> ' + esc(t.fit.detail) + '</p><p class="muted"><strong>Worth checking:</strong> ' + esc(t.consider) + '</p>' +
        '<div class="btns"><a class="btn ghost" href="' + B + '/' + t.slug + '/">Read the ' + esc(t.name) + ' guide</a></div></div></article>';
    });
    html += '<div class="btns" style="margin-top:1rem">' + (r.length > 1 ? '<button class="btn ghost" type="button" data-fit-cmp>Compare My Top Two</button>' : '') + '<a class="btn" href="#towns-form" data-fit-ask>Ask Ally About These Towns</a></div><div data-fit-cmpout></div>';
    out.innerHTML = html; out.hidden = false;
    var cb = $('[data-fit-cmp]', out);
    if (cb) cb.addEventListener('click', function () {
      var p = r[0].t, q = r[1].t, pair = [p.slug, q.slug];
      var known = { 'belmont-vs-mount-holly': ['belmont', 'mount-holly'], 'gastonia-vs-kings-mountain': ['gastonia', 'kings-mountain'], 'fort-mill-vs-lake-wylie': ['fort-mill', 'lake-wylie'] }, hit = '';
      Object.keys(known).forEach(function (k) { if (known[k].indexOf(pair[0]) > -1 && known[k].indexOf(pair[1]) > -1) hit = k; });
      var rows = [['Why it matched', r[0].why.join('; '), r[1].why.join('; ')], ['Local detail', p.fit.detail, q.fit.detail], ['Worth checking', p.consider, q.consider]];
      $('[data-fit-cmpout]', out).innerHTML = '<div class="fit-cmp"><table><thead><tr><th scope="col"></th><th scope="col">' + esc(p.name) + '</th><th scope="col">' + esc(q.name) + '</th></tr></thead><tbody>' +
        rows.map(function (rw) { return '<tr><th scope="row">' + rw[0] + '</th><td>' + esc(rw[1]) + '</td><td>' + esc(rw[2]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        (hit ? '<p style="margin-top:1rem"><a class="link" href="' + B + '/communities/compare/' + hit + '/">Read the full ' + esc(p.name) + ' and ' + esc(q.name) + ' comparison</a></p>' : '') + '</div>';
      A.track('tool_use', { tool: 'find_my_fit_compare' });
    });
    var summary = { 'Saturday': a.sat ? LBL.sat[a.sat] : '', 'Surroundings': a.set ? LBL.set[a.set] : '', 'Land': { small: 'A small yard', standard: 'A typical lot', acre: 'An acre or more' }[a.lot] || '',
      'Places to reach': a.reach.map(function (x) { return LBL.reach[x]; }), 'Home or land': { home: 'Existing home', land: 'Land to build on', either: 'Either' }[a.kind] || '', 'Matched towns': r.map(function (x) { return x.t.name + ', ' + x.t.st; }) };
    A.carry(summary, 'Your Find My Fit results');
    var wrap = document.querySelector('[data-fit-form-wrap]'); if (wrap) { wrap.hidden = false; var f = $('form[data-form]', wrap); if (f) A.fillCarry(f); }
    if (push) { var q = new URLSearchParams(); ['sat', 'set', 'lot', 'kind'].forEach(function (k) { if (a[k]) q.set(k, a[k]); }); if (a.reach.length) q.set('reach', a.reach.join(',')); history.replaceState(null, '', '?' + q.toString()); }
    A.track('tool_use', { tool: 'find_my_fit', matches: r.length });
  }
  $('[data-fit-go]', root).addEventListener('click', function () { run(true); out.setAttribute('tabindex', '-1'); out.focus(); });
  $('[data-fit-reset]', root).addEventListener('click', function () { form.reset(); out.hidden = true; out.innerHTML = ''; history.replaceState(null, '', location.pathname); });
  var q = new URLSearchParams(location.search), pre = false;
  ['sat', 'set', 'lot', 'kind'].forEach(function (k) { var v = q.get(k); if (v) { var el = $('input[name=' + k + '][value="' + CSS.escape(v) + '"]', form); if (el) { el.checked = true; pre = true; } } });
  (q.get('reach') || '').split(',').forEach(function (v) { if (!v) return; var el = $('input[name=reach][value="' + CSS.escape(v) + '"]', form); if (el) { el.checked = true; pre = true; } });
  if (pre) run(false);
})();
