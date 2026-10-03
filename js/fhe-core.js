/* FHE core — shared behaviour for the three homepage concepts. Loaded with `defer`, no dependencies.
 *
 *  1. Hook preloader   emblem drops on a cable, bounces, then lifts and docks into the header logo slot
 *  2. In-page links    anchor clicks scroll WITHOUT adding history entries, so Back always returns to the
 *                      previous page (the concepts hub) instead of stepping through #sections
 *  3. Hub link         "All concepts" uses history.back() when we arrived from the hub (no stack growth)
 *  4. Mobile nav       button-driven (never hash-driven), closes on navigate / Escape
 *  5. Lazy time-lapse  the <video> source is attached only when it nears the viewport; paused off-screen
 *  6. Reveal, count-up, UAE clock, scrolled-header flag
 *
 *  Contract (markup each concept provides):
 *    <html> gets `js` + `is-preloading` from the inline head snippet (see build brief)
 *    [data-preloader] > .preloader__backdrop + [data-preloader-rig] (cable + inline emblem)
 *    [data-dock-target]            header emblem the rig docks into
 *    [data-hub-link]               link to index.html
 *    [data-nav-toggle][aria-controls=ID]   mobile menu button; #ID gets `.is-open`
 *    video[data-lazy-video][data-poster] > source[data-src]   inside [data-timelapse]; optional [data-timelapse-toggle]
 *    [data-reveal]  [data-count="35"]  [data-uae-clock="hms|hm"]
 *
 *  Events: document dispatches `fhe:ready` as the curtain starts lifting, `fhe:navigate` as an in-page jump starts (menus close on it).
 *  window.FHE = { reduced, ready }  — `ready` is a Promise resolved on reveal.
 */
(() => {
  'use strict';
  const doc = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let resolveReady;
  const ready = new Promise((r) => (resolveReady = r));
  window.FHE = { reduced, ready };

  /* ---------------------------------------------------------------- 1. Preloader */
  const pre = document.querySelector('[data-preloader]');
  const rig = pre && pre.querySelector('[data-preloader-rig]');
  const dock = document.querySelector('[data-dock-target]');
  let revealed = false;
  let announced = false;

  function markLoaded() {
    doc.classList.remove('is-preloading', 'is-revealing');
    doc.classList.add('is-loaded');
    if (pre) pre.hidden = true;
  }

  // Fired as the curtain starts lifting, so hero reveals animate while the backdrop fades.
  function announce() {
    if (announced) return;
    announced = true;
    resolveReady();
    document.dispatchEvent(new CustomEvent('fhe:ready'));
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    doc.classList.add('is-revealing'); // backdrop fades, header emblem appears, rig hides — same frame
    announce();
    setTimeout(markLoaded, 700);
  }

  // Where the rig's centre sits at rest (its `translate` centring applied, its animated `transform` not),
  // stored relative to its layout box so it can be recomputed mid-animation without reading animated values.
  // The emblem inside the rig (not the rig box) is what must land on the header emblem.
  let rest = null;
  function measureRest() {
    const prev = rig.style.transform;
    rig.style.transform = 'none';
    const r = rig.getBoundingClientRect();
    const svg = (rig.querySelector('svg') || rig).getBoundingClientRect();
    rig.style.transform = prev;
    const w = rig.offsetWidth || 1;
    const h = rig.offsetHeight || 1;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    rest = {
      rx: (cx - rig.offsetLeft) / w, // rig centre relative to its layout box (captures `translate` centring)
      ry: (cy - rig.offsetTop) / h,
      sw: svg.width / w,             // emblem width as a fraction of the rig
      sx: (svg.left + svg.width / 2 - cx) / w, // emblem centre offset from the rig centre
      sy: (svg.top + svg.height / 2 - cy) / h,
    };
  }

  function measureDock() {
    if (!rig || !dock) return false;
    const target = (dock.querySelector('svg') || dock).getBoundingClientRect();
    const w = rig.offsetWidth; // layout size, unaffected by transforms
    const h = rig.offsetHeight;
    if (!target.width || !w) return false;
    if (!rest) measureRest();
    // offsetLeft/Top of a fixed element are viewport-relative and ignore transforms
    const cx = rig.offsetLeft + rest.rx * w;
    const cy = rig.offsetTop + rest.ry * h;
    const s = target.width / (rest.sw * w);
    // scaling happens about the rig centre, so the emblem's offset from it shrinks by s too
    rig.style.setProperty('--dock-x', `${target.left + target.width / 2 - cx - s * rest.sx * w}px`);
    rig.style.setProperty('--dock-y', `${target.top + target.height / 2 - cy - s * rest.sy * h}px`);
    rig.style.setProperty('--dock-scale', s.toFixed(4));
    return true;
  }

  function runPreloader() {
    if (!doc.classList.contains('is-preloading') || !pre || !rig) {
      revealed = true;
      markLoaded();
      announce();
      return;
    }
    rig.addEventListener('animationend', (e) => {
      if (e.animationName === 'hookDropAndLift') reveal();
    });
    // re-measure if the viewport changes mid-animation (rotation, URL bar collapse)
    addEventListener('resize', measureDock, { passive: true });
    pre.addEventListener('pointerdown', reveal, { once: true }); // tap to skip
    addEventListener('keydown', (e) => { if (e.key === 'Escape') reveal(); }, { once: true });
    // The rig is parked off-screen by CSS, so starting one frame late is invisible — and measuring after
    // the browser's own first layout avoids forcing an extra full-page reflow during script execution.
    // A page opened in a background tab waits until it is first shown, so the drop is actually seen.
    const start = () => {
      if (revealed) return;
      if (!measureDock()) rig.classList.add('no-dock');
      rig.classList.add('is-running');
      setTimeout(reveal, 4200); // safety net
    };
    if (document.visibilityState === 'hidden') {
      document.addEventListener('visibilitychange', start, { once: true });
    } else {
      requestAnimationFrame(() => setTimeout(start, 0));
    }
  }

  // Restored from the back/forward cache: never replay or get stuck mid-animation.
  addEventListener('pageshow', (e) => {
    if (e.persisted && !doc.classList.contains('is-loaded')) {
      revealed = true;
      markLoaded();
      announce();
    }
  });

  /* ---------------------------------------------------------------- 2. In-page links */
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    const toTop = hash === '#' || hash === '#top';
    const target = toTop ? null : document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!toTop && !target) return;
    e.preventDefault();
    // Close menus first: an open mobile menu locks scrolling (overflow: hidden) and would swallow the jump.
    document.dispatchEvent(new CustomEvent('fhe:navigate', { detail: { hash } }));
    const behavior = reduced ? 'auto' : 'smooth';
    if (toTop) scrollTo({ top: 0, behavior });
    else target.scrollIntoView({ behavior, block: 'start' });
    // replaceState, never pushState: keeps the URL shareable without creating Back-button stops
    history.replaceState(history.state, '', toTop ? location.pathname + location.search : hash);
    if (target) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  /* ---------------------------------------------------------------- 3. Hub link */
  const norm = (p) => p.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '').replace(/(.)\/$/, '$1');
  document.querySelectorAll('[data-hub-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      let ref;
      try { ref = new URL(document.referrer); } catch { return; }
      const hub = new URL(a.getAttribute('href'), location.href);
      if (ref.origin === location.origin && norm(ref.pathname) === norm(hub.pathname) && history.length > 1) {
        e.preventDefault();
        history.back();
      }
    });
  });

  /* ---------------------------------------------------------------- 4. Mobile nav */
  document.querySelectorAll('[data-nav-toggle]').forEach((btn) => {
    const menu = document.getElementById(btn.getAttribute('aria-controls'));
    if (!menu) return;
    const set = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      doc.classList.toggle('nav-open', open);
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('fhe:navigate', () => set(false));
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); }
    });
    matchMedia('(min-width: 960px)').addEventListener('change', (m) => { if (m.matches) set(false); });
  });

  /* ---------------------------------------------------------------- 5. Lazy time-lapse */
  document.querySelectorAll('video[data-lazy-video]').forEach((video) => {
    const wrap = video.closest('[data-timelapse]') || video.parentElement;
    const toggle = wrap.querySelector('[data-timelapse-toggle]');
    // icon-only buttons get a spoken label; buttons with their own visible text keep it (label must match text)
    const iconOnly = toggle && !toggle.textContent.trim();
    let loaded = false;
    let userPaused = reduced; // reduced motion: never autoplay

    const sync = () => {
      const playing = !video.paused;
      wrap.classList.toggle('is-playing', playing);
      if (toggle) {
        toggle.setAttribute('aria-pressed', String(playing));
        if (iconOnly) toggle.setAttribute('aria-label', playing ? 'Pause time-lapse' : 'Play time-lapse');
      }
    };
    const play = () => video.play().catch(() => {});
    const load = () => {
      if (loaded) return;
      loaded = true;
      const sources = video.querySelectorAll('source[data-src]');
      sources.forEach((s) => { s.src = s.dataset.src; });
      const last = sources[sources.length - 1];
      if (last) last.addEventListener('error', () => wrap.classList.add('is-fallback'));
      video.addEventListener('loadeddata', () => wrap.classList.add('is-ready'), { once: true });
      video.load();
    };

    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    if (toggle) {
      toggle.addEventListener('click', () => {
        load();
        if (video.paused) { userPaused = false; play(); } else { userPaused = true; video.pause(); }
      });
    }

    // Browsers fetch `poster` eagerly even with preload="none", so it lives in data-poster until the
    // curtain lifts and the section is within a screen or two — keeps it off the critical path.
    const setPoster = () => { if (video.dataset.poster && !video.poster) video.poster = video.dataset.poster; };

    if (!('IntersectionObserver' in window)) { setPoster(); load(); if (!userPaused) play(); return; }
    ready.then(() => {
      const pio = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) { setPoster(); pio.disconnect(); }
      }, { rootMargin: '1200px 0px' });
      pio.observe(video);
    });
    ready.then(() => new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { load(); if (!userPaused) play(); }
        else if (loaded && !video.paused) video.pause();
      });
    }, { rootMargin: '300px 0px' }).observe(video));
    sync();
  });

  /* ---------------------------------------------------------------- 6. Reveal / count-up / clock / header */
  function startObservers() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduced) {
      els.forEach((el) => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      els.forEach((el) => io.observe(el));
    }

    const counters = document.querySelectorAll('[data-count]');
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const run = (el) => {
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.countDecimals || '0', 10);
      if (reduced || Number.isNaN(end)) return;
      const dur = parseInt(el.dataset.countDuration || '1400', 10);
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = (end * ease(p)).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.6 });
      counters.forEach((el) => cio.observe(el));
    }
  }

  const clocks = document.querySelectorAll('[data-uae-clock]');
  if (clocks.length) {
    const fmt = {
      hms: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      hm: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    const tick = () => {
      const now = new Date();
      clocks.forEach((el) => { el.textContent = (fmt[el.dataset.uaeClock] || fmt.hms).format(now); });
    };
    tick();
    setInterval(tick, 1000);
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { doc.classList.toggle('is-scrolled', scrollY > 24); ticking = false; });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  ready.then(startObservers);
  runPreloader();
})();
