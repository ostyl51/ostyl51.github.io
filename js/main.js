(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* nav: background on scroll, mobile menu, active link */
  var nav = $('#nav'), links = $('#links'), burger = $('#burger');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 12); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', links).forEach(function (a) {
    a.addEventListener('click', function () { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
  });
  var sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          $$('a', links).forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* reveal on scroll (with a small stagger inside groups) */
  $$('.reveal-group').forEach(function (g) {
    $$('.reveal', g).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.09) + 's'); });
  });
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* count-up numbers */
  var counters = $$('[data-count]');
  function runCount(el) {
    var end = +el.dataset.count, t0 = null, dur = 1300;
    if (reduce) { el.textContent = end; return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else { counters.forEach(function (c) { c.textContent = c.dataset.count; }); }

  /* cursor glow + hero parallax tilt (pointer devices only) */
  var fine = window.matchMedia('(pointer: fine)').matches;
  var glow = $('.glow-cursor'), hv = $('#heroVisual');
  if (fine && !reduce) {
    window.addEventListener('mousemove', function (e) {
      glow.style.opacity = 1;
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
      if (hv) {
        var r = hv.getBoundingClientRect();
        var mx = ((e.clientX - r.left) / r.width - 0.5) * 2, my = ((e.clientY - r.top) / r.height - 0.5) * 2;
        mx = Math.max(-1, Math.min(1, mx)); my = Math.max(-1, Math.min(1, my));
        hv.style.setProperty('--mx', mx.toFixed(3));
        hv.style.setProperty('--my', my.toFixed(3));
      }
    }, { passive: true });
    $$('.card').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* Budget Lover feature tabs */
  var blShot = $('#blShot'), capT = $('#blCapTitle'), capX = $('#blCapText');
  var blTabs = $$('#blTabs button');
  function selectBl(btn) {
    blTabs.forEach(function (b) { b.classList.toggle('on', b === btn); b.setAttribute('aria-selected', b === btn); });
    blShot.classList.add('fade');
    setTimeout(function () {
      blShot.src = 'assets/bl/' + btn.dataset.img + '.webp';
      capT.textContent = btn.dataset.title; capX.textContent = btn.dataset.text;
    }, reduce ? 0 : 180);
    blShot.onload = function () { blShot.classList.remove('fade'); };
  }
  blTabs.forEach(function (b) { b.addEventListener('click', function () { selectBl(b); resetAuto(); }); });

  /* gentle auto-rotation of the Budget Lover tabs while it is on screen and untouched */
  var autoTimer = null, blVisible = false, userTouched = false;
  function nextBl() {
    var i = blTabs.findIndex(function (b) { return b.classList.contains('on'); });
    selectBl(blTabs[(i + 1) % blTabs.length]);
  }
  function resetAuto() { userTouched = true; clearInterval(autoTimer); }
  if ('IntersectionObserver' in window && !reduce) {
    new IntersectionObserver(function (es) {
      blVisible = es[0].isIntersecting;
      clearInterval(autoTimer);
      if (blVisible && !userTouched) autoTimer = setInterval(nextBl, 3600);
    }, { threshold: 0.4 }).observe($('#budget-lover'));
  }

  /* Epignwsi screen tabs */
  var epShot = $('#epShot'), epUrl = $('#epUrl');
  var epTabs = $$('#epTabs button');
  epTabs.forEach(function (b) {
    b.addEventListener('click', function () {
      epTabs.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
      epShot.classList.add('fade');
      setTimeout(function () { epShot.src = 'assets/ep/' + b.dataset.img + '.webp'; epUrl.textContent = b.dataset.url; }, reduce ? 0 : 180);
      epShot.onload = function () { epShot.classList.remove('fade'); };
    });
  });

  /* contact form: opens the visitor's mail app (no backend yet) */
  var form = $('#contactForm'), status = $('#formStatus');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form), name = (d.get('name') || '').trim(), email = (d.get('email') || '').trim(), msg = (d.get('message') || '').trim();
    var ok = name && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && msg;
    status.classList.toggle('err', !ok);
    if (!ok) { status.textContent = 'Please fill in your name, a valid email and a short message.'; return; }
    var body = msg + '\n\n' + name + '\n' + email;
    window.location.href = 'mailto:ostyl51@gmail.com?subject=' + encodeURIComponent('Project enquiry from ' + name) + '&body=' + encodeURIComponent(body);
    status.textContent = 'Opening your email app… if nothing opens, write to ostyl51@gmail.com.';
  });

  $('#year').textContent = new Date().getFullYear();
})();
