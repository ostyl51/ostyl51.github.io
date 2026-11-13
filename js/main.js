/* Orestis Stylianides, portfolio behaviour. Plain JavaScript, no libraries.
   The project request form itself is handled in js/request.js (Firestore). */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var EMAIL = 'ostyl51@gmail.com';

  /* ---------- small toast ---------- */
  var toastEl = $('#toast'), toastTimer = 0;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* ---------- theme (dark / light) with a circular reveal ---------- */
  var themeBtn = $('#themeBtn');
  function currentTheme() { return root.dataset.theme === 'light' ? 'light' : 'dark'; }
  function paintThemeButton() {
    themeBtn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  function applyTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    paintThemeButton();
  }
  function toggleTheme(origin) {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduce) { applyTheme(next); return; }
    var x = origin ? origin.x : window.innerWidth / 2, y = origin ? origin.y : 0;
    var r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    var vt = document.startViewTransition(function () { applyTheme(next); });
    vt.ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () {});
  }
  paintThemeButton();
  themeBtn.addEventListener('click', function (e) {
    var r = themeBtn.getBoundingClientRect();
    toggleTheme(e.detail === 0 ? null : { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  });

  /* ---------- header: background, progress bar, mobile menu, active section ---------- */
  var header = $('#top'), menu = $('#menu'), burger = $('#burger'), progress = $('#progress');
  var navLinks = $$('a:not(.btn)', menu), indicator = $('.pill-ind', menu);
  var navSections = ['work', 'services', 'process', 'about', 'contact'].map(function (id) { return document.getElementById(id); });
  navLinks.forEach(function (a, i) { a.style.setProperty('--i', i); });

  function placeIndicator() {
    var a = navLinks.filter(function (x) { return x.classList.contains('active'); })[0];
    if (!a || window.innerWidth <= 1100) { indicator.classList.remove('on'); return; }
    indicator.style.width = a.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    indicator.classList.add('on');
  }
  function setActiveNav() {
    var line = window.innerHeight * 0.42, current = null;
    navSections.forEach(function (s) {
      var r = s.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) current = s.id;
    });
    var changed = false;
    navLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + current;
      if (on !== a.classList.contains('active')) changed = true;
      a.classList.toggle('active', on);
    });
    if (changed) placeIndicator();
  }

  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- scroll-driven bits (one rAF-throttled handler) ---------- */
  var tl = $('#timeline'), steps = $$('.step', tl);
  function updateTimeline() {
    var r = tl.getBoundingClientRect(), vh = window.innerHeight, p, horizontal = window.innerWidth > 900;
    p = horizontal ? (0.82 * vh - r.top) / (0.42 * vh) : (0.72 * vh - r.top) / r.height;
    p = clamp(p, 0, 1);
    tl.style.setProperty('--p', p.toFixed(3));
    steps.forEach(function (s) {
      var frac = horizontal ? (s.offsetLeft + 34) / tl.offsetWidth : (s.offsetTop + 38) / tl.offsetHeight;
      s.classList.toggle('lit', p >= frac);
    });
  }

  var workLinks = $$('#workNav a'), cases = $$('.case');
  function updateWorkNav() {
    var line = window.innerHeight * 0.45, current = null;
    cases.forEach(function (c) {
      var r = c.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) current = c.id;
    });
    workLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + current); });
  }

  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, h = root.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 8);
    progress.style.setProperty('--p', h > 0 ? clamp(y / h, 0, 1).toFixed(4) : 0);
    setActiveNav();
    updateWorkNav();
    updateTimeline();
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth > 1100 && menu.classList.contains('open')) setMenu(false);
      placeIndicator(); onScroll(); sizeCanvas();
    }, 120);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeIndicator(); onScroll(); });

  /* ---------- reveal on scroll, with a stagger inside groups ---------- */
  ['.svc-grid', '.timeline'].forEach(function (sel) {
    $$(sel + ' .reveal').forEach(function (el, i) { el.style.setProperty('--d', (i * 0.09) + 's'); });
  });
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- count-up numbers ---------- */
  if (!reduce) {
    $$('[data-count]').forEach(function (el) {
      var end = +el.dataset.count, t0 = null, dur = 1400;
      el.textContent = '0';
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      }
      setTimeout(function () { requestAnimationFrame(step); }, 750);
    });
  }

  /* ---------- Nicosia clock ---------- */
  var clocks = $$('#clock, #clock2');
  function tick() {
    var text;
    try { text = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Nicosia' }).format(new Date()); }
    catch (e) { text = ''; }
    clocks.forEach(function (c) { c.textContent = text || '—'; });
  }
  tick(); setInterval(tick, 20000);

  /* ---------- hero: rolling word ---------- */
  var words = $$('#roller span'), wi = 0;
  if (words.length > 1 && !reduce) {
    setInterval(function () {
      if (document.hidden) return;
      var cur = words[wi]; wi = (wi + 1) % words.length; var nx = words[wi];
      cur.classList.remove('is-in'); cur.classList.add('is-out');
      nx.classList.remove('is-out'); nx.classList.add('is-in');
      setTimeout(function () { cur.classList.remove('is-out'); }, 900);
    }, 2600);
  }

  /* ---------- hero: interactive dot grid + 3D scene ---------- */
  var hero = $('#hero'), canvas = $('#gridCanvas'), ctx = canvas.getContext('2d'), sceneInner = $('#sceneInner');
  var GAP = 30, W = 0, H = 0, dpr = 1, cols = 0, rows = 0, rafId = 0, heroVisible = true, t0 = performance.now();
  var ptr = { x: -9999, y: -9999 }, ripples = [], tilt = { x: 0, y: 0, tx: 0, ty: 0 };

  function sizeCanvas() {
    var r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / GAP) + 1; rows = Math.ceil(H / GAP) + 1;
    if (!rafId) draw(performance.now());
  }
  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    var t = (now - t0) / 1000, R = 175, i, j, k, rp;
    ripples = ripples.filter(function (q) { return now - q.t < 1400; });
    for (j = 0; j < rows; j++) {
      for (i = 0; i < cols; i++) {
        var x = i * GAP, y = j * GAP, px = x, py = y, r = 1.05;
        var a = reduce ? 0.2 : 0.13 + 0.09 * Math.sin(i * 0.33 + j * 0.27 + t * 0.9);
        var hot = 0;
        var dx = x - ptr.x, dy = y - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          var d = Math.sqrt(d2) || 1; k = 1 - d / R; k = k * k;
          px += dx / d * k * 16; py += dy / d * k * 16; r += k * 2.4; a += k * 0.8; hot = Math.max(hot, k);
        }
        for (var q = 0; q < ripples.length; q++) {
          rp = ripples[q];
          var rdx = x - rp.x, rdy = y - rp.y, rd = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
          var age = now - rp.t, rad = age * 0.5, band = Math.abs(rd - rad);
          if (band < 46) {
            var kk = (1 - band / 46) * (1 - age / 1400);
            px += rdx / rd * kk * 12; py += rdy / rd * kk * 12; r += kk * 2; a += kk * 0.7; hot = Math.max(hot, kk);
          }
        }
        ctx.fillStyle = hot > 0.35 ? 'rgba(255,207,61,' + Math.min(a, 1).toFixed(3) + ')' : 'rgba(154,166,255,' + Math.min(a, 1).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill();
      }
    }
  }
  function frame(now) {
    tilt.x += (tilt.tx - tilt.x) * 0.08; tilt.y += (tilt.ty - tilt.y) * 0.08;
    sceneInner.style.setProperty('--rx', tilt.x.toFixed(2) + 'deg');
    sceneInner.style.setProperty('--ry', tilt.y.toFixed(2) + 'deg');
    draw(now);
    rafId = requestAnimationFrame(frame);
  }
  function startLoop() { if (!rafId && !reduce && heroVisible && !document.hidden) rafId = requestAnimationFrame(frame); }
  function stopLoop() { if (rafId) cancelAnimationFrame(rafId); rafId = 0; }
  sizeCanvas();
  if (!reduce) {
    startLoop();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; heroVisible ? startLoop() : stopLoop(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? stopLoop() : startLoop(); });
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = hero.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
      tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 12;
      tilt.tx = -((e.clientY - r.top) / r.height - 0.5) * 9;
    });
    hero.addEventListener('pointerleave', function () { ptr.x = ptr.y = -9999; tilt.tx = tilt.ty = 0; });
    hero.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button')) return;
      var r = hero.getBoundingClientRect();
      ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
    });
  }

  /* ---------- magnetic buttons and 3D tilt (mouse only) ---------- */
  if (fine && !reduce) {
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.32).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.classList.add('is-tilting');
        el.style.setProperty('--ty', (((e.clientX - r.left) / r.width - 0.5) * 11).toFixed(2) + 'deg');
        el.style.setProperty('--tx', (-((e.clientY - r.top) / r.height - 0.5) * 9).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg');
      });
    });
    $$('[data-spot]').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- case-study galleries with a gentle autoplay ---------- */
  var DUR = 4600;
  $$('[data-gallery]').forEach(function (g) {
    var media = g.closest('.case-media'), img = $('.shot', media), thumbs = $('.thumbs', g);
    var btns = $$('button', thumbs), cap = $('.caption', g), ctl = $('.gal-ctl', g);
    var idx = 0, timer = 0, paused = reduce, visible = false, hovering = false;
    thumbs.style.setProperty('--dur', DUR + 'ms');
    ctl.setAttribute('aria-pressed', String(paused));
    if (paused) ctl.setAttribute('aria-label', 'Play automatic slideshow');

    function canPlay() { return !paused && visible && !hovering && !document.hidden; }
    function show(i) {
      idx = i;
      btns.forEach(function (b, k) { var on = k === i; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      var b = btns[i], next = new Image();
      next.onload = function () {
        img.classList.add('swap');
        setTimeout(function () { img.src = b.dataset.src; img.alt = b.dataset.alt; img.classList.remove('swap'); }, reduce ? 0 : 160);
      };
      next.src = b.dataset.src;
      $('h4', cap).textContent = b.dataset.title; $('p', cap).textContent = b.dataset.text;
      if (thumbs.scrollWidth > thumbs.clientWidth + 2) thumbs.scrollLeft = b.offsetLeft - (thumbs.clientWidth - b.offsetWidth) / 2;
    }
    function schedule() {
      clearTimeout(timer);
      btns.forEach(function (b) { b.classList.remove('run'); });
      if (!canPlay()) return;
      void btns[idx].offsetWidth;
      btns[idx].classList.add('run');
      timer = setTimeout(function () { show((idx + 1) % btns.length); schedule(); }, DUR);
    }
    btns.forEach(function (b, k) {
      b.setAttribute('aria-pressed', String(k === 0));
      b.addEventListener('click', function () {
        paused = true; ctl.setAttribute('aria-pressed', 'true'); ctl.setAttribute('aria-label', 'Play automatic slideshow');
        if (k !== idx) show(k);
        schedule();
      });
    });
    ctl.addEventListener('click', function () {
      paused = !paused;
      ctl.setAttribute('aria-pressed', String(paused));
      ctl.setAttribute('aria-label', paused ? 'Play automatic slideshow' : 'Pause automatic slideshow');
      schedule();
    });
    media.addEventListener('mouseenter', function () { hovering = true; schedule(); });
    media.addEventListener('mouseleave', function () { hovering = false; schedule(); });
    media.addEventListener('focusin', function () { hovering = true; schedule(); });
    media.addEventListener('focusout', function () { hovering = false; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; schedule(); }, { threshold: 0.4 }).observe(media);
    }
  });

  /* ---------- brief builder: fills in the contact form ---------- */
  var planner = $('#planner'), form = $('#contactForm');
  if (planner && form) {
    var typeSel = form.elements.projectType, timeSel = form.elements.timeline, msg = form.elements.message;
    var countEl = $('#plannerCount'), briefText = $('#briefText'), briefLabel = $('.brief-label', planner);
    var EMPTY = 'Pick an option above and your brief appears here and in the form.';
    var typeNames = { 'mobile-app': 'a mobile app', 'website': 'a website', 'web-app': 'a web app', 'ai-feature': 'an AI feature', 'other': 'a custom project' };
    var timeText = { 'flexible': "I'm flexible on timing.", '1-month': "I'd like it within a month.", '1-3-months': "I'm aiming for 1 to 3 months.", '3-months-plus': 'I have 3 months or more.' };
    var join = function (a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; };

    var buildBrief = function () {
      var t = $('input[name="pType"]:checked', planner), tm = $('input[name="pTime"]:checked', planner);
      var feats = $$('input[name="pFeat"]:checked', planner).map(function (i) { return i.value; });
      var done = (t ? 1 : 0) + (feats.length ? 1 : 0) + (tm ? 1 : 0);
      countEl.textContent = done + ' / 3';
      countEl.classList.toggle('full', done === 3);
      if (!done) {
        briefText.textContent = EMPTY; briefText.classList.add('empty'); briefLabel.textContent = 'Your brief, as it will be sent';
        return;
      }
      var s = "Hi Orestis, I'd like to build " + (t ? typeNames[t.value] : 'something new') + '.';
      if (feats.length) s += ' It should have ' + join(feats) + '.';
      if (tm) s += ' ' + timeText[tm.value];
      briefText.textContent = s; briefText.classList.remove('empty');
      if (t) { typeSel.value = t.value; typeSel.classList.remove('invalid'); }
      if (tm) timeSel.value = tm.value;
      if (!msg.value.trim() || msg.dataset.auto === '1') {
        msg.value = s + '\n\nA bit more about the project: '; msg.dataset.auto = '1'; msg.classList.remove('invalid');
        briefLabel.textContent = 'Your brief, as it will be sent';
      } else {
        briefLabel.textContent = 'Your message has your own edits, so it was left as it is';
      }
    };
    planner.addEventListener('change', buildBrief);
    msg.addEventListener('input', function (e) { if (e.isTrusted) msg.dataset.auto = ''; });
    typeSel.addEventListener('change', function () {
      var r = $('input[name="pType"][value="' + typeSel.value + '"]', planner); if (r) { r.checked = true; buildBrief(); }
    });
    timeSel.addEventListener('change', function () {
      var r = $('input[name="pTime"][value="' + timeSel.value + '"]', planner); if (r) { r.checked = true; buildBrief(); }
    });
    form.addEventListener('reset', function () {
      setTimeout(function () {
        $$('input', planner).forEach(function (i) { i.checked = false; });
        msg.dataset.auto = ''; buildBrief();
      }, 0);
    });
  }

  /* ---------- copy email ---------- */
  var copyBtn = $('#copyMail');
  function copyEmail() {
    function ok() {
      toast('Email address copied');
      if (copyBtn) {
        copyBtn.classList.add('done'); $('em', copyBtn).textContent = 'Copied';
        setTimeout(function () { copyBtn.classList.remove('done'); $('em', copyBtn).textContent = 'Copy'; }, 1800);
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(ok, function () { window.location.href = 'mailto:' + EMAIL; });
    } else {
      var ta = document.createElement('textarea'); ta.value = EMAIL; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { window.location.href = 'mailto:' + EMAIL; }
      document.body.removeChild(ta);
    }
  }
  if (copyBtn) copyBtn.addEventListener('click', copyEmail);

  /* ---------- command palette (Ctrl / Cmd + K, or "/") ---------- */
  var pal = $('#palette'), palInput = $('#palInput'), palList = $('#palList'), openPal = $('#openPalette');
  if (pal && typeof pal.showModal === 'function') {
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    var keyName = isMac ? '⌘ K' : 'Ctrl K';
    $('#kbdHint').textContent = keyName;
    $$('.hint kbd').forEach(function (k) { k.textContent = keyName; });

    var items = [
      { g: 'Go to', t: 'Work', h: 'Section 01', go: '#work', k: 'projects portfolio case studies' },
      { g: 'Go to', t: 'Services', h: 'Section 02', go: '#services', k: 'what i build offer' },
      { g: 'Go to', t: 'Process', h: 'Section 03', go: '#process', k: 'how it works steps' },
      { g: 'Go to', t: 'About', h: 'Section 04', go: '#about', k: 'me skills photo' },
      { g: 'Go to', t: 'Contact', h: 'Section 05', go: '#contact', k: 'hire start a project brief form' },
      { g: 'Projects', t: 'Budget Lover', h: 'AI budgeting app', go: '#budget-lover', k: 'flutter android finance' },
      { g: 'Projects', t: 'FKS Stars Motors', h: 'Live car dealer website', go: '#fks', k: 'cars javascript cloudflare' },
      { g: 'Projects', t: 'Epignwsi', h: 'Community web app', go: '#epignwsi', k: 'php mysql recovery' },
      { g: 'Open', t: 'FKS Stars Motors, live site', h: 'fksstarsmotors.com ↗', url: 'https://fksstarsmotors.com', k: 'website visit' },
      { g: 'Contact', t: 'Copy my email address', h: EMAIL, fn: copyEmail, k: 'gmail clipboard' },
      { g: 'Contact', t: 'Send an email', h: 'Opens your mail app', url: 'mailto:' + EMAIL, k: 'write message' },
      { g: 'Contact', t: 'Upwork profile', h: 'Hire me ↗', url: 'https://www.upwork.com/freelancers/~012e77b4ccc0023f5b', k: 'freelance' },
      { g: 'Contact', t: 'Fiverr', h: 'Hire me ↗', url: 'https://www.fiverr.com/s/3AAE6Am', k: 'freelance gig' },
      { g: 'Contact', t: 'LinkedIn', h: 'Connect ↗', url: 'https://www.linkedin.com/in/orestis-stylianidis-b73a7a3aa', k: 'social' },
      { g: 'Site', t: 'Switch theme', h: 'Dark / light', fn: function () { toggleTheme(null); }, k: 'dark light mode appearance' },
      { g: 'Site', t: 'View the source code', h: 'GitHub ↗', url: 'https://github.com/ostyl51/ostyl51.github.io', k: 'repo github' }
    ];
    var shown = [], sel = 0;

    var renderPal = function () {
      var q = palInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      shown = items.filter(function (it) {
        var hay = (it.t + ' ' + it.h + ' ' + it.g + ' ' + (it.k || '')).toLowerCase();
        return q.every(function (w) { return hay.indexOf(w) !== -1; });
      });
      sel = Math.min(sel, Math.max(shown.length - 1, 0));
      palList.textContent = '';
      if (!shown.length) {
        var empty = document.createElement('li'); empty.className = 'pal-empty'; empty.textContent = 'Nothing found. Try "work", "email" or "theme".';
        palList.appendChild(empty); palInput.removeAttribute('aria-activedescendant'); return;
      }
      var lastG = '';
      shown.forEach(function (it, i) {
        if (it.g !== lastG) {
          var gh = document.createElement('li'); gh.className = 'pal-group'; gh.setAttribute('role', 'presentation'); gh.textContent = it.g; palList.appendChild(gh); lastG = it.g;
        }
        var li = document.createElement('li');
        li.className = 'pal-item'; li.id = 'pal-' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === sel));
        var a = document.createElement('span'); a.textContent = it.t;
        var b = document.createElement('small'); b.textContent = it.h;
        li.appendChild(a); li.appendChild(b);
        li.addEventListener('pointermove', function () { if (sel !== i) { sel = i; mark(); } });
        li.addEventListener('click', function () { run(i); });
        palList.appendChild(li);
      });
      palInput.setAttribute('aria-activedescendant', 'pal-' + sel);
    };
    var mark = function () {
      $$('.pal-item', palList).forEach(function (li, i) { li.setAttribute('aria-selected', String(i === sel)); });
      var cur = $('#pal-' + sel, palList);
      if (cur) { palInput.setAttribute('aria-activedescendant', cur.id); cur.scrollIntoView({ block: 'nearest' }); }
    };
    var run = function (i) {
      var it = shown[i]; if (!it) return;
      pal.close();
      if (it.go) {
        var el = $(it.go);
        if (el) { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); history.replaceState(null, '', it.go); }
      } else if (it.url) {
        if (it.url.indexOf('mailto:') === 0) window.location.href = it.url; else window.open(it.url, '_blank', 'noopener');
      } else if (it.fn) { it.fn(); }
    };
    var openPalette = function () {
      if (pal.open) return;
      setMenu(false);
      palInput.value = ''; sel = 0; renderPal(); pal.showModal(); palInput.focus();
    };
    palInput.addEventListener('input', function () { sel = 0; renderPal(); });
    palInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (shown.length) { sel = (sel + 1) % shown.length; mark(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (shown.length) { sel = (sel - 1 + shown.length) % shown.length; mark(); } }
      else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    });
    pal.addEventListener('click', function (e) { if (e.target === pal) pal.close(); });
    openPal.addEventListener('click', openPalette);
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.open ? pal.close() : openPalette(); return; }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select' && !e.target.isContentEditable) { e.preventDefault(); openPalette(); }
      }
      if (e.key === 'Escape') setMenu(false);
    });
  } else {
    openPal.hidden = true;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- footer ---------- */
  $('#year').textContent = new Date().getFullYear();

  if (window.console && console.log) {
    console.log('%cHi, curious developer 👋', 'font:700 15px system-ui;color:#ffcf3d');
    console.log('This site is plain HTML, CSS and JavaScript. Source: https://github.com/ostyl51/ostyl51.github.io\nWant something like it? ' + EMAIL);
  }
})();
