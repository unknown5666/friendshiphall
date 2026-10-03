/* Concept 2 — Cinematic Editorial.
 * The only variant-specific behaviour: the "cable rail" on wide screens. A hairline gold cable grows down the left
 * margin as you read, ending in a small hook; a vertical folio beside it names the chapter on screen.
 * Everything else (preloader, reveals, nav, time-lapse) lives in fhe-core.js and the stylesheet.
 */
(() => {
  'use strict';

  const rail = document.querySelector('[data-rail]');
  if (!rail) return;

  const doc = document.documentElement;
  const label = rail.querySelector('[data-rail-label]');
  const folios = Array.from(document.querySelectorAll('[data-folio]'));
  const wide = matchMedia('(min-width: 1100px)');

  let ticking = false;
  let active = false;
  let io = null;

  const update = () => {
    ticking = false;
    const max = doc.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    rail.style.setProperty('--p', p.toFixed(4));
  };
  const request = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };

  const start = () => {
    if (active) return;
    active = true;
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request, { passive: true });
    update();
    if (label && 'IntersectionObserver' in window) {
      // a hairline band across the middle of the viewport: whichever chapter crosses it is "current"
      io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && en.target.dataset.folio) label.textContent = en.target.dataset.folio;
        });
      }, { rootMargin: '-50% 0px -49.9% 0px', threshold: 0 });
      folios.forEach((el) => io.observe(el));
    }
  };

  const stop = () => {
    if (!active) return;
    active = false;
    removeEventListener('scroll', request);
    removeEventListener('resize', request);
    if (io) { io.disconnect(); io = null; }
  };

  const sync = () => (wide.matches ? start() : stop());
  wide.addEventListener('change', sync);
  sync();
})();
