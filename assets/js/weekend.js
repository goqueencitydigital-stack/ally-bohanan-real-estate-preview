/* Plan My Weekend — builds a 2–3 stop plan from verified places (with hours) and events. */
(function () {
  var A = window.ALLY, root = document.querySelector('[data-wk]'); if (!root || !A) return;
  var $ = A.$, esc = A.esc, B = A.base || '';
  var D = JSON.parse($('[data-wk-data]', root).textContent), out = $('[data-wk-out]', root), form = $('[data-wk-form]', root);
  var EVENTS = [];
  fetch(B + '/assets/data/events.json').then(function (r) { return r.json(); }).then(function (e) { EVENTS = e; boot(); }).catch(boot);

  var CATS = { sports: { ev: ['sports'], pl: ['food', 'arts'] }, food: { ev: ['food', 'festival'], pl: ['food'] }, lake: { ev: [], pl: ['lake', 'outdoors'] },
    arts: { ev: ['arts', 'festival'], pl: ['arts', 'food'] }, outdoors: { ev: [], pl: ['outdoors', 'lake'] } };
  var WHY = { sports: 'a live game day', food: 'coffee and good food', lake: 'time by the water', arts: 'downtown and the arts', outdoors: 'time outside on the trails' };
  var WIN = { half: [600, 840], full: [600, 1140], evening: [1020, 1290] };

  function hm(m) { var h = Math.floor(m / 60), mi = m % 60, ap = h < 12 ? 'a.m.' : 'p.m.'; h = h % 12 || 12; return h + (mi ? ':' + (mi < 10 ? '0' : '') + mi : '') + ' ' + ap; }
  function toMin(t) { if (!t) return null; var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function nextSat() { var d = new Date(A.today); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return A.iso(d); }
  function span(e) { var f = function (x) { return new Date(x + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }); }; return f(e.date) + ' through ' + f(e.end); }
  function maps(q) { return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(q); }
  function guide(town) { var s = D.guides[town]; return s ? '<a class="link" href="' + B + '/' + s + '/">' + esc(town) + ' guide</a>' : ''; }

  function openRange(p, wd) { // wd: 0=Mon..6=Sun (python weekday)
    if (!p.hours) return null;
    var h = p.hours[wd] || p.hours[String(wd)]; return h ? h : 'closed';
  }

  function plan(o) {
    var d = new Date(o.date + 'T12:00:00'), wd = (d.getDay() + 6) % 7, area = [o.town].concat(D.near[o.town] || []);
    var w = WIN[o.time], c = CATS[o.i], stops = [], note = [], mo = d.getMonth(), dusk = (mo < 2 || mo > 9) ? 1020 : (mo < 4 || mo > 7) ? 1110 : 1200;
    // 1) anchor event on that date (matching interest, nearby or Charlotte for sports)
    var evs = EVENTS.filter(function (e) {
      var on = e.date === o.date || (e.end && e.date <= o.date && o.date <= e.end);
      var near = area.indexOf(e.town) > -1 || (o.i === 'sports' && e.town === 'Charlotte');
      return on && near && c.ev.indexOf(e.cat) > -1;
    }).sort(function (a, b) { var r = function (x) { var k = area.indexOf(x.town); return k < 0 ? 99 : k; }; return r(a) - r(b); });
    var anchor = null;
    evs.some(function (e) {
      var st = toMin(e.t24); if (st == null && !e.end) return false;
      if (st == null) st = w[0] + 60;
      if (o.time === 'half' && st > w[1] && st <= WIN.evening[1]) { // half day: slide it so it ends with the evening event
        w = [st - 180, st + 90]; note.push('Your half day starts in the afternoon so it can end at ' + e.title + ', which starts at ' + hm(st) + (hm(st).slice(-1) === '.' ? '' : '.'));
      }
      if (st < w[0] - 30 || st > w[1]) return false;
      anchor = { kind: 'event', e: e, start: st, dur: e.cat === 'sports' ? 180 : 90, town: e.town }; return true;
    });
    // 2) places, start town first, then neighbours; open at the needed time
    var pool = D.places.filter(function (p) { return area.indexOf(p.town) > -1 && p.cats.some(function (k) { return c.pl.indexOf(k) > -1; }); })
      .sort(function (a, b) { return score(a) - score(b); });
    function score(p) { return (p.cats.indexOf(c.pl[0]) > -1 ? 0 : 50) + area.indexOf(p.town) * 3 + (p.hours ? 0 : 1); }
    function fits(p, t) {
      var r = openRange(p, wd);
      if (r === 'closed') return false;
      if (r && (t < r[0] || t + p.mins > r[1])) return false;
      if (!r && (t < 540 || t + p.mins > 1020)) return false; // no published hours: typical daytime only, flagged
      var outside = p.cats.every(function (k) { return k === 'outdoors' || k === 'lake'; });
      if (outside && t + p.mins > dusk) return false; // outdoor stops stay in daylight
      return true;
    }
    var t = w[0], last = o.town, used = {}, lastCat = null;
    if (anchor) D.places.forEach(function (p) { if (anchor.e.venue.indexOf(p.name) === 0) used[p.id] = 1; }); // don't send people to the event's venue twice
    function gap(town) { return town === last ? 15 : 30; }
    function addPlace(limit) {
      for (var pass = 0; pass < 2; pass++) for (var i = 0; i < pool.length; i++) {
        var p = pool[i]; if (used[p.id]) continue;
        if (!pass && lastCat && p.cats[0] === lastCat) continue; // vary the day when we can
        var st = t + (stops.length ? gap(p.town) : 0);
        if (st + p.mins > limit) continue;
        if (!fits(p, st)) continue;
        used[p.id] = 1; stops.push({ kind: 'place', p: p, start: st, dur: p.mins, town: p.town }); t = st + p.mins; last = p.town; lastCat = p.cats[0]; return true;
      }
      return false;
    }
    if (anchor) {
      while (stops.length < 2 && addPlace(anchor.start - gap(anchor.town))) {}
      if (stops.length && t + gap(anchor.town) > anchor.start) stops.pop();
      stops.push(anchor); t = anchor.start + anchor.dur; last = anchor.town;
      while (stops.length < 3 && addPlace(w[1] + 60)) {}
    } else {
      while (stops.length < 3 && addPlace(w[1])) {}
      if (c.ev.length) note.push('We did not find a verified ' + (o.i === 'sports' ? 'home game' : 'event') + ' for that date near ' + o.town + ', so this plan uses places that are always there.');
    }
    if (stops.length < 2) note.push('There is not enough verified information for a longer plan here, so this is a shorter one. Try a neighboring town or another interest.');
    return { stops: stops, note: note, wd: wd };
  }

  var PL = { food: 'Good for coffee or a meal', arts: 'Good for an easy, walkable stop downtown', lake: 'Good for time by the water', outdoors: 'Good for time outside' };
  function fitLine(p, o, s, r) {
    var k = p.cats.indexOf(CATS[o.i].pl[0]) > -1 ? CATS[o.i].pl[0] : p.cats[0], ev = r.stops.filter(function (x) { return x.kind === 'event'; })[0];
    var lead = ev && o.i === 'sports' ? (s.start < ev.start ? 'Fuel up before the game' : 'A relaxed stop after the game') : PL[k];
    return lead + (p.town === o.town ? ', right in ' + esc(o.town) + '.' : ', in nearby ' + esc(p.town) + '.');
  }
  function render(o, r) {
    if (!r.stops.length) { out.innerHTML = '<p class="note">We could not build a plan from verified places for that combination. Try a different interest or town, or read <a href="' + B + '/lifestyle/a-saturday-in-belmont/">A Saturday in Belmont</a>.</p>'; out.hidden = false; return; }
    var d = new Date(o.date + 'T12:00:00');
    var html = '<div class="ig-head"><div><p class="eyebrow">Your plan · ' + esc(d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })) + '</p><h2 class="big-serif">' + r.stops.length + (r.stops.length === 1 ? ' stop' : ' stops') + ' from ' + esc(o.town) + '</h2></div>' +
      '<div class="btns no-print"><button class="btn ghost" type="button" data-wk-share>Share This Plan</button><button class="btn ghost" type="button" data-wk-print>Print</button></div></div>';
    r.note.forEach(function (n) { html += '<p class="note">' + esc(n) + '</p>'; });
    html += '<ol class="itin">';
    r.stops.forEach(function (s, i) {
      var nextTown = i && r.stops[i - 1].town !== s.town ? '<p class="muted wk-travel">Then head to ' + esc(s.town) + '. Leave travel time; check your map app for the drive.</p>' : '';
      if (s.kind === 'event') {
        var e = s.e;
        html += '<li class="stop wk-ev">' + '<div>' + nextTown + '<span class="time">' + (e.t24 ? hm(s.start) + ' · verified start time' : 'All day') + '</span><h3>' + esc(e.title) + '</h3>' +
          '<p><strong>Why it fits:</strong> ' + esc(e.summary) + ' It is on your date, and the rest of the plan is timed around its verified start.</p>' +
          (e.end ? '<p class="muted">Runs ' + esc(span(e)) + '. Multi-day runs can skip some nights, so confirm your date on the official page.</p>' : '') + '<p class="muted">' + esc(e.venue) + ', ' + esc(e.town) + '</p>' +
          '<div class="btns"><a class="btn ghost sm" href="' + e.source + '" target="_blank" rel="noopener">Official event page</a><a class="link" href="' + maps(e.venue + ', ' + e.town) + '" target="_blank" rel="noopener">Directions</a>' +
          '<a class="link" href="' + B + '/assets/ics/' + e.id + '.ics" download>Save to Calendar</a>' + guide(e.town) + '</div></div></li>';
      } else {
        var p = s.p, hrs = p.hours ? '' : '<p class="muted"><strong>Check hours before you go:</strong> published hours were not available for this stop.</p>';
        html += '<li class="stop"><div>' + nextTown + '<span class="time">' + hm(s.start) + ' · about ' + (p.mins >= 60 ? Math.round(p.mins / 60 * 2) / 2 + (p.mins === 60 ? ' hour' : ' hours') : p.mins + ' minutes') + '</span><h3>' + esc(p.name) + '</h3>' +
          '<p><strong>Why it fits:</strong> ' + esc(p.blurb) + ' ' + fitLine(p, o, s, r) + '</p>' +
          '<p class="muted">' + esc(p.addr) + '</p>' + hrs +
          '<div class="btns"><a class="link" href="' + maps(p.addr) + '" target="_blank" rel="noopener">Directions</a><a class="link" href="' + p.url + '" target="_blank" rel="noopener">Official site</a>' + guide(p.town) + '</div></div></li>';
      }
    });
    html += '</ol><p class="source-note">Built from places and events verified on this site. Hours and dates can change; confirm with each official source.</p>';
    out.innerHTML = html; out.hidden = false;
    $('[data-wk-print]', out).addEventListener('click', function () { window.print(); });
    $('[data-wk-share]', out).addEventListener('click', function () {
      var url = location.href, b = this;
      if (navigator.share) navigator.share({ title: 'My weekend plan', url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { b.textContent = 'Link copied'; });
      A.track('share', { tool: 'plan_my_weekend' });
    });
  }

  function read() { var f = new FormData(form); return { town: f.get('town'), date: f.get('date') || nextSat(), time: f.get('time'), i: f.get('i') || 'arts' }; }
  function go(push) {
    var o = read(); form.elements.date.value = o.date;
    render(o, plan(o));
    if (push) history.replaceState(null, '', '?' + new URLSearchParams(o).toString());
    var m = document.querySelector('meta[name=robots]'); if (m) m.setAttribute('content', 'noindex, follow');
    A.track('tool_use', { tool: 'plan_my_weekend', interest: o.i });
  }
  function boot() {
    var q = new URLSearchParams(location.search);
    if (q.get('town')) form.elements.town.value = q.get('town');
    form.elements.date.value = q.get('date') || nextSat();
    if (q.get('time')) form.elements.time.value = q.get('time');
    if (q.get('i')) { var r = form.querySelector('input[name=i][value="' + q.get('i').replace(/[^a-z]/g, '') + '"]'); if (r) r.checked = true; }
    $('[data-wk-go]', root).addEventListener('click', function () { go(true); out.setAttribute('tabindex', '-1'); out.focus(); });
    if (q.get('town')) go(false);
  }
})();
