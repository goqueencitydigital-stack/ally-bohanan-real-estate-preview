/* The Journal: reading progress, table of contents, share buttons. No dependencies. */
(function () {
  var d = document, w = window;
  var main = d.querySelector('.jx-main');
  var bar = d.querySelector('.jx-progress span');
  if (main && bar) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = main.getBoundingClientRect(), h = r.height - w.innerHeight * 0.6;
      var p = h > 0 ? Math.min(1, Math.max(0, -r.top / h)) : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    };
    w.addEventListener('scroll', function () { if (!ticking) { ticking = true; w.requestAnimationFrame(update); } }, { passive: true });
    w.addEventListener('resize', update);
    update();
  }

  var toc = d.querySelector('[data-toc]');
  if (toc) {
    var mq = w.matchMedia('(min-width: 1100px)');
    var sync = function () { if (mq.matches) toc.setAttribute('open', ''); };
    sync();
    if (mq.addEventListener) mq.addEventListener('change', sync);
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    links.forEach(function (a) {
      a.addEventListener('click', function () { if (!mq.matches) toc.removeAttribute('open'); });
    });
    if ('IntersectionObserver' in w) {
      var map = {};
      links.forEach(function (a) { var t = d.getElementById(a.getAttribute('href').slice(1)); if (t) map[t.id] = a; });
      var current = null;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (current) current.removeAttribute('aria-current');
            current = map[e.target.id]; if (current) current.setAttribute('aria-current', 'true');
          }
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      Object.keys(map).forEach(function (id) { io.observe(d.getElementById(id)); });
    }
  }

  Array.prototype.forEach.call(d.querySelectorAll('.jx-share'), function (box) {
    var status = box.querySelector('.jx-sh-status');
    var say = function (msg) { if (!status) return; status.textContent = msg; setTimeout(function () { status.textContent = ''; }, 2500); };
    var copyBtn = box.querySelector('[data-copy]');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var url = copyBtn.getAttribute('data-copy');
      var fallback = function () {
        var t = d.createElement('textarea'); t.value = url; t.setAttribute('readonly', ''); t.style.position = 'absolute'; t.style.left = '-9999px';
        d.body.appendChild(t); t.select();
        try { d.execCommand('copy'); say('Link copied'); } catch (e) { say('Copy failed. The address is ' + url); }
        d.body.removeChild(t);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { say('Link copied'); }, fallback);
      else fallback();
    });
    var shareBtn = box.querySelector('[data-share]');
    if (shareBtn && navigator.share) {
      shareBtn.hidden = false;
      shareBtn.addEventListener('click', function () {
        navigator.share({ title: d.title, url: copyBtn ? copyBtn.getAttribute('data-copy') : location.href }).catch(function () {});
      });
    }
  });
})();
