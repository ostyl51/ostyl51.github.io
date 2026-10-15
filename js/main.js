(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header: border once scrolled, mobile menu */
  var top = $('#top'), menu = $('#menu'), burger = $('#burger');
  function onScroll() { top.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* highlight the section in view */
  if ('IntersectionObserver' in window) {
    var links = $$('a:not(.btn)', menu);
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* work index: one product open at a time */
  var rows = $$('.index .row');
  function openRow(row, scroll) {
    rows.forEach(function (r) {
      var open = r === row && r.getAttribute('aria-expanded') !== 'true';
      if (r !== row) open = false;
      r.setAttribute('aria-expanded', String(open));
      $('#' + r.getAttribute('aria-controls')).hidden = !open;
    });
    if (scroll && row.getAttribute('aria-expanded') === 'true') {
      var y = row.getBoundingClientRect().top + window.scrollY - 76;
      if (row.getBoundingClientRect().top < 76) window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  rows.forEach(function (r) { r.addEventListener('click', function () { openRow(r, true); }); });

  /* galleries: switch the screenshot */
  $$('[data-gallery]').forEach(function (g) {
    var img = $('.stage img', g), buttons = $$('.thumbs button', g);
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.classList.contains('on')));
      b.addEventListener('click', function () {
        if (b.classList.contains('on')) return;
        buttons.forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
        var next = new Image();
        next.onload = function () {
          img.classList.add('swap');
          setTimeout(function () { img.src = b.dataset.src; img.alt = b.dataset.alt; img.classList.remove('swap'); }, reduce ? 0 : 150);
        };
        next.src = b.dataset.src;
      });
    });
  });

  /* the project request form is handled in js/request.js (Firestore) */

  $('#year').textContent = new Date().getFullYear();
})();
