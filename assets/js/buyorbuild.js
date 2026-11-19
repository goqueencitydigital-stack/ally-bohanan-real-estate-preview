/* Should I Buy or Build? Educational brief builder. Every point is tied to one answer. No prices, feasibility or dates. */
(function () {
  'use strict';
  var d = document, A = window.ALLY || {};
  var $ = A.$, $$ = A.$$, esc = A.esc;
  var root = $('[data-bob]'); if (!root) return;
  var form = $('[data-bob-form]', root), out = $('[data-bob-out]', root);
  var KEY = 'ally-bob';
  var B = (window.SITE && window.SITE.base) || '';

  var LABEL = {
    land: { own: 'You own a lot', contract: 'Under contract on land', need: 'You would need to find land', unsure: 'Land: not sure yet' },
    timing: { firm: 'Firm move date', soon: 'Moving within the next year', flex: 'Flexible timing', explore: 'Just exploring' },
    place: { street: 'A specific established neighborhood', land: 'Room and privacy, maybe acreage', town: 'Close to a town center', open: 'Open on location' },
    must: { layout: 'A specific layout', primary: 'Main-floor primary suite', acreage: 'Acreage or privacy', shop: 'Oversized garage or shop', outdoor: 'Covered outdoor living', 'new': 'Everything new', none: 'No specific must-haves' },
    design: { enjoy: 'You would enjoy design decisions', guided: 'Design decisions, with guidance', avoid: 'You would rather skip design decisions' },
    reno: { happy: 'Happy to renovate', small: 'Small updates only', none: 'Move-in ready only' }
  };

  function read() {
    var o = {};
    ['land', 'timing', 'place', 'design', 'reno'].forEach(function (k) { var c = $('input[name="' + k + '"]:checked', form); o[k] = c ? c.value : ''; });
    o.must = $$('input[name="must"]:checked', form).map(function (c) { return c.value; });
    var t = $('#bob-town', form); o.town = t ? t.value : ''; o.townName = t && t.value ? t.options[t.selectedIndex].text : '';
    return o;
  }
  function restore(o) {
    ['land', 'timing', 'place', 'design', 'reno'].forEach(function (k) { var c = o[k] && $('input[name="' + k + '"][value="' + o[k] + '"]', form); if (c) c.checked = true; });
    (o.must || []).forEach(function (v) { var c = $('input[name="must"][value="' + v + '"]', form); if (c) c.checked = true; });
    if (o.town) { var t = $('#bob-town', form); if (t) t.value = o.town; }
  }

  function brief(o) {
    var buy = [], build = [], next = [], sb = 0, sB = 0;
    function P(list, tag, text) { list.push({ tag: tag, text: text }); }
    var L = LABEL;
    /* land */
    if (o.land === 'own') { sB += 3; P(build, L.land.own, 'Owning the land removes the search and lets the home be designed for this exact site.');
      P(next, L.land.own, 'Confirm road access to the lot and any shared driveways or easements.');
      P(next, L.land.own, 'Find out whether public water and sewer reach the lot, or whether it needs a private well and septic system.');
      P(next, L.land.own, 'If septic is needed, ask about a soil evaluation (perc test) through the county.');
      P(next, L.land.own, 'Pull the survey or plat and any HOA documents to check setbacks and restrictions.');
      P(next, L.land.own, 'Ask Bohanan Construction about a site evaluation conversation for the lot.'); }
    else if (o.land === 'contract') { sB += 2; P(build, L.land.contract, 'You already have a site in mind, so the design can start from real conditions.');
      P(next, L.land.contract, 'Before your due-diligence period ends, check access, utilities, soil and septic suitability, and recorded restrictions.');
      P(next, L.land.contract, 'Ask Bohanan Construction what to look at on the site before you close on the land.'); }
    else if (o.land === 'need') { sb += 1; P(buy, L.land.need, 'Buying an existing home means one search instead of two: no separate land purchase.');
      P(build, L.land.need, 'Searching for land and a plan together lets the lot fit the home you want.');
      P(next, L.land.need, 'Ask Ally what land is available in your area and what to check before making an offer on a lot.'); }
    else if (o.land === 'unsure') { P(next, L.land.unsure, 'Decide whether you would consider buying land at all. It is the biggest fork between the two paths.'); }
    /* timing */
    if (o.timing === 'firm') { sb += 3; P(buy, L.timing.firm, 'An existing home lets you work toward a known closing date.');
      P(next, L.timing.firm, 'Ask Ally: how quickly are homes with your must-haves going under contract in your target area, and what does a typical timeline from offer to closing look like?');
      P(next, L.timing.firm, 'Ask Bohanan Construction: what has to happen before a build could start (land, design, permitting, site work), and what timing is realistic for your project?'); }
    else if (o.timing === 'soon') { sb += 1; P(buy, L.timing.soon, 'A year leaves room to buy, but less room for land, design and permitting on a build.');
      P(next, L.timing.soon, 'Ask both teams what fits inside your window before you commit to either path.'); }
    else if (o.timing === 'flex') { sB += 2; P(build, L.timing.flex, 'Flexible timing gives a custom home the time that design, permitting and construction need.'); }
    else if (o.timing === 'explore') { sB += 1; sb += 1; P(next, L.timing.explore, 'Without a deadline, you can watch the market and talk to a builder at the same time.'); }
    /* place */
    if (o.place === 'street') { sb += 2; P(buy, L.place.street, 'Established neighborhoods are mostly built out, so buying is often the only way onto a specific street.');
      P(next, L.place.street, 'Ask Ally whether any lots or teardown opportunities exist in that neighborhood.'); }
    else if (o.place === 'land') { sB += 2; P(build, L.place.land, 'Acreage and private settings are easier to find as land than as finished homes.');
      P(next, L.place.land, 'On larger land, ask about driveway length, clearing and private utilities early.'); }
    else if (o.place === 'town') { sb += 1; P(buy, L.place.town, 'Homes near a town center are usually existing homes on established lots.'); }
    else if (o.place === 'open') { P(next, L.place.open, 'Compare a few towns first. The community guides and Find My Carolina Community can help.'); }
    if (o.townName) P(next, o.townName, 'Read the ' + o.townName.replace(/, (NC|SC)$/, '') + ' town guide for what to check before you buy there.');
    /* must-haves */
    var m = o.must || [];
    if (m.indexOf('layout') > -1) { sB += 2; P(build, L.must.layout, 'A specific layout is the clearest reason to build: the plan can start from how you live.'); }
    if (m.indexOf('primary') > -1) { P(buy, L.must.primary, 'Main-floor primary suites exist on the resale market, so a search is worth doing.'); P(build, L.must.primary, 'Building lets the primary suite be placed and sized exactly as you want.'); }
    if (m.indexOf('acreage') > -1) { sB += 1; P(build, L.must.acreage, 'Privacy and acreage are easier to secure by choosing the land yourself.'); }
    if (m.indexOf('shop') > -1) { sB += 1; P(build, L.must.shop, 'Oversized garages and shops are uncommon in existing homes and can be planned from the start in a build.'); }
    if (m.indexOf('outdoor') > -1) { P(build, L.must.outdoor, 'Covered porches and outdoor living can be designed into the house rather than added later.'); P(buy, L.must.outdoor, 'Many existing homes already have porches or room to add one.'); }
    if (m.indexOf('new') > -1) { sB += 1; P(build, L.must['new'], 'A new build means new systems, roof and finishes throughout.'); P(buy, L.must['new'], 'A recently built home can offer much of the new-construction feel without the wait.'); }
    if (m.indexOf('none') > -1 && m.length === 1) { sb += 1; P(buy, L.must.none, 'Without specific must-haves, the existing-home market gives you the most choice right away.'); }
    if (m.length && m.indexOf('none') < 0) P(next, 'Your must-haves', 'Ask Ally how often homes with ' + m.map(function (k) { return L.must[k].toLowerCase(); }).join(', ') + ' come up in your area.');
    /* design */
    if (o.design === 'enjoy') { sB += 2; P(build, L.design.enjoy, 'Building puts hundreds of choices in your hands, from the floor plan to the lighting.'); }
    else if (o.design === 'guided') { sB += 1; P(build, L.design.guided, 'A builder with design guidance can narrow the choices so they feel manageable.'); P(next, L.design.guided, 'Ask Bohanan Construction how design and selections are guided and organized.'); }
    else if (o.design === 'avoid') { sb += 2; P(buy, L.design.avoid, 'An existing home arrives with its decisions made. You choose the house, not every finish.'); }
    /* renovation */
    if (o.reno === 'happy') { sb += 2; P(buy, L.reno.happy, 'Being open to renovation widens the pool of existing homes you can consider.'); P(next, L.reno.happy, 'Ask Ally to flag homes where an update would unlock what you want, and ask Bohanan Construction about remodels.'); }
    else if (o.reno === 'small') { sb += 1; P(buy, L.reno.small, 'Homes that need only paint, lighting or a bathroom refresh are a realistic target.'); }
    else if (o.reno === 'none') { sB += 1; P(build, L.reno.none, 'If nothing on the market is move-in ready for you, building ends with a finished home designed for you.'); P(buy, L.reno.none, 'Newer and recently updated homes can be move-in ready on day one.'); }

    var diff = sB - sb, verdict, sum;
    if (Math.abs(diff) <= 2) { verdict = 'Both paths are reasonable for you.'; sum = 'Your answers point both ways. It is worth talking to both teams and comparing what each path would look like.'; }
    else if (diff > 0) { verdict = 'Your answers lean toward building.'; sum = 'Several of your answers favor a custom home. The points below show which ones, and what to check before you decide.'; }
    else { verdict = 'Your answers lean toward buying.'; sum = 'Several of your answers favor an existing home. The points below show which ones, and what to check before you decide.'; }
    if (!buy.length) P(buy, 'From your answers', 'None of your answers strongly favor buying. Compare a few listings anyway to see what is out there.');
    if (!build.length) P(build, 'From your answers', 'None of your answers strongly favor building. A short talk with a builder can confirm that.');
    return { buy: buy, build: build, next: next, verdict: verdict, sum: sum, lean: Math.abs(diff) <= 2 ? 'Both reasonable' : (diff > 0 ? 'Leans build' : 'Leans buy') };
  }

  function li(x) { return '<li><small>' + esc(x.tag) + '</small>' + esc(x.text) + '</li>'; }
  var current = null;
  function render(o) {
    var b = brief(o); current = { o: o, b: b };
    $('[data-bob-verdict]', out).textContent = b.verdict;
    $('[data-bob-sum]', out).textContent = b.sum;
    $('[data-bob-buy]', out).innerHTML = b.buy.map(li).join('');
    $('[data-bob-build]', out).innerHTML = b.build.map(li).join('');
    var nx = b.next.map(li);
    if (o.town) nx = nx.map(function (h) { return h.replace(esc('town guide'), '<a href="' + B + '/' + o.town + '/">town guide</a>'); });
    $('[data-bob-next]', out).innerHTML = nx.join('');
    out.hidden = false;
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }
  function summary() {
    var o = current.o, L = LABEL;
    return { 'Tool': 'Should I Buy or Build?', 'Land': L.land[o.land], 'Timing': L.timing[o.timing], 'Location': L.place[o.place] + (o.townName ? ' (' + o.townName + ')' : ''),
             'Must-haves': (o.must || []).map(function (k) { return L.must[k]; }), 'Design decisions': L.design[o.design], 'Renovations': L.reno[o.reno], 'Brief': current.b.verdict };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var o = read(), first = null;
    ['land', 'timing', 'place', 'must', 'design', 'reno'].forEach(function (k) {
      var miss = k === 'must' ? !o.must.length : !o[k], er = d.getElementById('q-' + k + '-e'), fs = d.getElementById('q-' + k);
      if (er) er.textContent = miss ? (k === 'must' ? 'Choose at least one, or “Nothing specific yet.”' : 'Please choose one.') : '';
      if (fs) fs.classList.toggle('invalid', miss);
      if (miss && !first) first = fs;
    });
    if (first) { var i = $('input', first); if (i) i.focus(); first.scrollIntoView({ block: 'center' }); return; }
    render(o); out.focus({ preventScroll: true }); out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (A.track) A.track('tool_use', { tool: 'buy_or_build', result: current.b.lean });
  });
  form.addEventListener('reset', function () {
    setTimeout(function () { out.hidden = true; $$('.err', form).forEach(function (x) { x.textContent = ''; }); try { localStorage.removeItem(KEY); } catch (e) {} }, 0);
  });
  /* "None" is exclusive among must-haves */
  $$('input[name="must"]', form).forEach(function (c) {
    c.addEventListener('change', function () {
      if (!c.checked) return;
      if (c.value === 'none') $$('input[name="must"]', form).forEach(function (x) { if (x !== c) x.checked = false; });
      else { var n = $('input[name="must"][value="none"]', form); if (n) n.checked = false; }
    });
  });

  $('[data-bob-print]', out).addEventListener('click', function () { window.print(); });
  $('[data-bob-edit]', out).addEventListener('click', function () { var f = $('input', form); form.scrollIntoView({ behavior: 'smooth' }); if (f) f.focus({ preventScroll: true }); });
  $$('[data-bob-act]', out).forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!current) return;
      var kind = btn.getAttribute('data-bob-act'), data = summary();
      if (A.carry) A.carry(data, 'From your Buy or Build brief');
      $$('[data-bob-fwrap]').forEach(function (w) { w.hidden = w.getAttribute('data-bob-fwrap') !== kind; });
      var wrap = $('[data-bob-fwrap="' + kind + '"]'), f = wrap && $('form[data-form]', wrap);
      if (!f) return;
      if (A.fillCarry) A.fillCarry(f);
      var o = current.o;
      if (kind === 'build') {
        var lv = { own: 'Yes, I own a lot', contract: 'I am under contract on land', need: 'No, I need to find land' }[o.land];
        $$('input[name="land"]', f).forEach(function (r) { if (r.value === lv) r.checked = true; });
        var wh = $('input[name="where"]', f); if (wh && !wh.value && o.townName) wh.value = o.townName;
      } else {
        var ar = $('input[name="area"]', f); if (ar && !ar.value && o.townName) ar.value = o.townName;
        var tm = $('select[name="timing"]', f); if (tm && !tm.value) tm.value = { firm: '', soon: '6+ months', flex: '6+ months', explore: 'Just exploring' }[o.timing] || '';
      }
      wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var first = $('input:not([type=hidden]):not(.hp):not([type=radio]):not([type=checkbox])', f);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 450);
      if (A.track) A.track('tool_cta', { tool: 'buy_or_build', action: kind });
    });
  });

  /* restore last answers in this browser; ?land=own deep link pre-selects the first answer */
  var q = new URLSearchParams(location.search), saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (saved) { restore(saved); if (saved.land && saved.timing && saved.place && saved.design && saved.reno && (saved.must || []).length) render(saved); }
  if (q.get('land')) { var c = $('input[name="land"][value="' + q.get('land') + '"]', form); if (c) c.checked = true; }
})();
