/* Chapter III — the fleet (src/components/fleet/Fleet.astro, src/styles/fleet.css).
 *  1. Drums      every .odo rolls to its number the first time it is well into view
 *  2. Overture   where CSS can't drive the yard from scroll, the classes rise in once (.is-in)
 *  3. Stage      from 1100px: the class chapter crossing the middle of the screen sets the stage's photograph (a wipe
 *                in the direction of travel), its count (the drums roll to it), name and range; a make's row under the
 *                pointer shows that make's photo or line drawing, loaded on first hover.
 * The capacity console is its own island (CapacityConsole.tsx). Everything here is decorative or a progressive
 * enhancement: without JS the drums show their numbers and the chapters carry all the content. */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 1 · drums */
const drums = document.querySelectorAll('.odo:not(.stage__odo)');
if ('IntersectionObserver' in window && !reduced) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-on');
      io.unobserve(en.target);
    });
  }, { threshold: 0.6 });
  // wait for the intro, so the first roll is seen
  const start = () => drums.forEach((d) => io.observe(d));
  if (window.FHE && window.FHE.ready) window.FHE.ready.then(start); else start();
} else {
  drums.forEach((d) => d.classList.add('is-on'));
}

/* 2 · overture fallback */
const overture = document.querySelector('[data-overture]');
if (overture && !(window.CSS && CSS.supports('animation-timeline: view()'))) {
  if (!('IntersectionObserver' in window) || reduced) overture.classList.add('is-in');
  else {
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { overture.classList.add('is-in'); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(overture);
  }
}

/* 3 · the stage */
const lineup = document.querySelector('[data-lineup]');
const stage = lineup && lineup.querySelector('[data-stage]');
if (stage && 'IntersectionObserver' in window) {
  const wide = matchMedia('(min-width: 1100px)');
  const chapters = Array.from(lineup.querySelectorAll('[data-lu]'));
  const frames = Array.from(stage.querySelectorAll('[data-frame]'));
  const no = stage.querySelector('[data-stage-no]');
  const tag = stage.querySelector('[data-stage-tag]');
  const span = stage.querySelector('[data-stage-span]');
  const ticks = Array.from(stage.querySelectorAll('.stage__ticks li'));
  const odo = stage.querySelector('.stage__odo');
  const digits = odo ? Array.from(odo.querySelectorAll('.odo__d')) : [];
  const sr = odo && odo.querySelector('.sr-only');
  const peekHost = stage.querySelector('[data-peek-photo]');
  let peekPhoto = null;   // made on the first hover

  let cur = 0;
  let z = frames.length;
  let settle = 0;

  const ink = (el, text) => {
    if (!el || el.textContent === text) return;
    el.textContent = text;
    if (reduced) return;
    el.classList.remove('is-ink');
    void el.offsetWidth;   // restart the animation
    el.classList.add('is-ink');
  };

  const setCount = (n) => {
    const s = String(n).padStart(digits.length, '0');
    digits.forEach((d, i) => d.style.setProperty('--d', s[i]));
    if (sr) sr.textContent = String(n);
  };

  const show = (j) => {
    if (j === cur || !frames[j]) return;
    const down = j > cur;
    const f = frames[j];
    if (!reduced) {
      f.style.transition = 'none';
      f.style.clipPath = down ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)';
      void f.offsetWidth;
      f.style.transition = '';
    }
    f.style.zIndex = String(++z);
    f.classList.add('is-on');
    f.style.clipPath = 'inset(0)';
    clearTimeout(settle);
    // once the wipe has covered it, the frame underneath can go
    settle = setTimeout(() => frames.forEach((o, k) => {
      if (k === j) return;
      o.classList.remove('is-on');
      o.style.transition = 'none';
      o.style.clipPath = '';
      void o.offsetWidth;
      o.style.transition = '';
    }), reduced ? 0 : 1150);
    cur = j;
    const ch = chapters[j];
    ink(no, String(j + 1).padStart(2, '0'));
    ink(tag, ch.dataset.name);
    ink(span, ch.dataset.span);
    setCount(+ch.dataset.total);
    ticks.forEach((t, k) => t.classList.toggle('is-on', k === j));
  };

  // the chapter crossing a band across the middle of the screen is current
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) show(+en.target.dataset.lu); });
  }, { rootMargin: '-48% 0px -48% 0px' });

  // the drums on the stage roll in once the stage is first seen
  const sio = new IntersectionObserver(([en]) => {
    if (en.isIntersecting && odo) { odo.classList.add('is-on'); sio.disconnect(); }
  }, { threshold: 0.4 });

  /* a make under the pointer: its photo (srcset copied from the row on first use) or its line drawing */
  let peekTimer = 0;
  const peek = (row) => {
    clearTimeout(peekTimer);
    const kind = row ? row.dataset.peek : '';
    if (!kind) { peekTimer = setTimeout(() => { stage.removeAttribute('data-peek'); stage.classList.remove('is-peeking'); ink(tag, chapters[cur].dataset.name); }, 120); return; }
    if (kind === 'photo' && peekHost) {
      if (!peekPhoto) {
        peekPhoto = document.createElement('img');
        peekPhoto.alt = '';
        peekPhoto.decoding = 'async';
        peekHost.append(peekPhoto);
      }
      if (peekPhoto.dataset.for !== row.dataset.peekSrc) {
        peekPhoto.dataset.for = row.dataset.peekSrc;
        peekPhoto.sizes = '52vw';
        peekPhoto.srcset = row.dataset.peekSrcset;
        peekPhoto.src = row.dataset.peekSrc;
        peekPhoto.style.objectPosition = row.dataset.peekPos || '50% 50%';
        stage.classList.remove('is-peeking');
        void peekPhoto.offsetWidth;
      }
    }
    stage.dataset.peek = kind;
    stage.classList.add('is-peeking');
    ink(tag, `${row.dataset.peekName} · ${row.dataset.peekTag}`);
  };
  const rows = Array.from(lineup.querySelectorAll('.ledger__row[data-peek]'));
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const onEnter = (e) => peek(e.currentTarget);
  const onLeave = () => peek(null);

  let on = false;
  const sync = () => {
    if (wide.matches === on) return;
    on = wide.matches;
    if (on) {
      chapters.forEach((c) => io.observe(c));
      sio.observe(stage);
      if (fine.matches) rows.forEach((r) => { r.addEventListener('pointerenter', onEnter); r.addEventListener('pointerleave', onLeave); });
    } else {
      io.disconnect();
      rows.forEach((r) => { r.removeEventListener('pointerenter', onEnter); r.removeEventListener('pointerleave', onLeave); });
    }
  };
  wide.addEventListener('change', sync);
  sync();
  if (reduced && odo) odo.classList.add('is-on');
}

