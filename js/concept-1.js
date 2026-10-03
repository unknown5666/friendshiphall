/* FHE · Concept 1 — Industrial Brutalism. Variant-specific behaviour, no dependencies.
 *  1. Fit        giant lines shrink (never grow) so they can never overflow their cell, fonts loaded or not
 *  2. Gauge      keyboard / pointer capacity scale: highlights the crane class and its typical application
 *  3. Nav spy    marks the nav link of the section currently in view
 *  4. Time-lapse playhead on the year ruler follows the video
 */
(() => {
  'use strict';
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------ 1. Fit */
  // [data-fit] is either a single nowrap element, or a group whose [data-fit-line] children share one scale.
  function fitAll() {
    const groups = $$('[data-fit]');
    groups.forEach((g) => g.style.removeProperty('--fit'));
    const ratios = groups.map((g) => {
      const lines = $$('[data-fit-line]', g);
      const els = lines.length ? lines : [g];
      let r = 1;
      els.forEach((el) => {
        const cw = el.clientWidth;
        const sw = el.scrollWidth;
        if (cw > 0 && sw > cw + 1) r = Math.min(r, cw / sw);
      });
      return r;
    });
    groups.forEach((g, i) => {
      if (ratios[i] < 1) g.style.setProperty('--fit', (Math.floor(ratios[i] * 985) / 1000).toFixed(3));
    });
  }
  let fitQueued = false;
  const queueFit = () => {
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(() => { fitQueued = false; fitAll(); });
  };
  fitAll();
  addEventListener('resize', queueFit, { passive: true });
  addEventListener('load', queueFit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueFit);

  /* ------------------------------------------------------------ 2. Capacity gauge */
  const gauge = $('[data-gauge]');
  if (gauge) {
    const range = $('[data-gauge-range]', gauge);
    const valEl = $('[data-gauge-val]', gauge);
    const clsEl = $('[data-gauge-class]', gauge);
    const useEl = $('[data-gauge-use]', gauge);
    const rows = $$('.gauge__classes li', gauge);
    const ticks = $$('.gauge__ticks button', gauge);
    const stops = [25, 50, 100, 200, 300, 500, 700];
    const classes = [
      { label: '25–60T class', speak: '25 to 60 tonne class', use: 'City picks, HVAC & signage, plant maintenance' },
      { label: '25–60T class', speak: '25 to 60 tonne class', use: 'City picks, HVAC & signage, plant maintenance' },
      { label: '70–130T class', speak: '70 to 130 tonne class', use: 'Precast, steel erection, tower-crane assembly' },
      { label: '150–300T class', speak: '150 to 300 tonne class', use: 'Bridge girders, heavy modules, tandem lifts' },
      { label: '150–300T class', speak: '150 to 300 tonne class', use: 'Bridge girders, heavy modules, tandem lifts' },
      { label: '400–500T class', speak: '400 to 500 tonne class', use: 'Heavy industrial, refinery & power, superlift work' },
      { label: '700T flagship', speak: '700 tonne flagship', use: 'Vessels, heavy plant, long-radius lifts' },
    ];
    const update = () => {
      const i = Math.max(0, Math.min(6, parseInt(range.value, 10) || 0));
      const c = classes[i];
      gauge.style.setProperty('--i', String(i));
      if (valEl) valEl.textContent = String(stops[i]);
      if (clsEl) clsEl.textContent = c.label;
      if (useEl) useEl.textContent = c.use;
      rows.forEach((li) => li.classList.toggle('is-active', (li.dataset.stops || '').split(' ').indexOf(String(i)) > -1));
      ticks.forEach((b, k) => b.classList.toggle('is-on', k === i));
      range.setAttribute('aria-valuetext', `${stops[i]} tonnes, ${c.speak}`);
    };
    range.addEventListener('input', update);
    ticks.forEach((b) => b.addEventListener('click', () => {
      range.value = b.dataset.stop;
      update();
    }));
    update();
  }

  /* ------------------------------------------------------------ 3. Nav spy */
  const links = $$('.nav__list a[href^="#"]');
  if (links.length && 'IntersectionObserver' in window) {
    const map = new Map();
    links.forEach((a) => {
      const sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) map.set(sec, a);
    });
    const live = new Set();
    const paint = () => {
      let current = null;
      map.forEach((a, sec) => { if (live.has(sec)) current = a; });
      links.forEach((a) => {
        const on = a === current;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) live.add(en.target); else live.delete(en.target); });
      paint();
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((a, sec) => io.observe(sec));
  }

  /* ------------------------------------------------------------ 4. Time-lapse playhead */
  const rig = $('.tl-rig');
  const video = rig && $('video', rig);
  if (video) {
    const sync = () => {
      if (video.duration > 0) rig.style.setProperty('--p', (video.currentTime / video.duration).toFixed(4));
    };
    video.addEventListener('timeupdate', sync);
    video.addEventListener('loadedmetadata', sync);
  }
})();
