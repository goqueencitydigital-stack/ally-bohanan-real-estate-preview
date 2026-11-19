/* Lifestyle story: day-nav scroll-spy */
(function(){
  var nav=document.querySelector('[data-spy]'); if(!nav||!('IntersectionObserver' in window)) return;
  var links=[].slice.call(nav.querySelectorAll('a[href^="#"]')), map={};
  links.forEach(function(a){var el=document.getElementById(a.getAttribute('href').slice(1)); if(el) map[el.id]=a;});
  var vis={};
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){vis[e.target.id]=e.isIntersecting;});
    var cur=null; links.forEach(function(a){var id=a.getAttribute('href').slice(1); if(vis[id]&&!cur) cur=a;});
    if(!cur) return;
    links.forEach(function(a){ if(a===cur){a.setAttribute('aria-current','true');} else a.removeAttribute('aria-current'); });
    if(nav.scrollWidth>nav.clientWidth){ nav.scrollTo({left:cur.offsetLeft-16,behavior:'smooth'}); }
  },{rootMargin:'-30% 0px -55% 0px'});
  Object.keys(map).forEach(function(id){io.observe(document.getElementById(id));});
})();
