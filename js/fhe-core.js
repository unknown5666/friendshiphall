/* FHE core — shared site behaviour. Loaded with `defer`, no dependencies.
 *
 *  1. Hook preloader   emblem drops on a cable, bounces, then lifts and docks into the header logo slot
 *                      (a [data-preloader="mark"] preloader is handed to window.FHEIntro instead — js/fhe-mark.js)
 *  2. In-page links    anchor clicks scroll WITHOUT adding history entries, so Back always returns to the
 *                      previous page instead of stepping through #sections
 *  4. Mobile nav       button-driven (never hash-driven), closes on navigate / Escape
 *  5. Lazy time-lapse  the <video> source is attached only when it nears the viewport; paused off-screen
 *  6. Reveal, count-up, UAE clock, scrolled-header flag
 *  7. Crane hook       a twin-sheave block and ramshorn hook on wire rope pays out down the right margin as you scroll (spring + pendulum)
 *  8. WhatsApp         floating button + two-line chooser (native popover, with a fallback)
 *
 *  Contract (markup the page provides):
 *    <html> gets `js` + `is-preloading` from the inline head snippet (see build brief)
 *    [data-preloader] > .preloader__backdrop + [data-preloader-rig] (cable + inline emblem)
 *      or [data-preloader="mark"] with js/fhe-mark.js loaded first: it gets { pre, dock, reveal } and calls reveal(ms)
 *    [data-dock-target]            header emblem the rig docks into
 *    [data-nav-toggle][aria-controls=ID]   mobile menu button; #ID gets `.is-open`
 *    video[data-lazy-video][data-poster] > source[data-src]   inside [data-timelapse]; optional [data-timelapse-toggle]
 *    [data-reveal]  [data-count="40"]  [data-uae-clock="hms|hm"]
 *    [data-wa] > button[data-wa-fab][popovertarget=ID] + #ID[popover][data-wa-panel]   (styles: css/fhe-overlays.css)
 *    The crane hook needs no markup: it is built here and appended to <body>.
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

  // `hold`: how long the curtain takes to clear before the preloader is removed
  function reveal(hold = 700) {
    if (revealed) return;
    revealed = true;
    doc.classList.add('is-revealing'); // backdrop fades, header emblem appears, rig hides — same frame
    announce();
    setTimeout(markLoaded, hold);
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
    const intro = pre && pre.dataset.preloader === 'mark' && typeof window.FHEIntro === 'function' ? window.FHEIntro : null;
    if (!doc.classList.contains('is-preloading') || !pre || (!rig && !intro)) {
      revealed = true;
      markLoaded();
      announce();
      return;
    }
    if (intro) {
      // The mark intro runs its own show (skip, visibility, safety net) and calls reveal(ms) as its iris opens.
      try { intro({ pre, dock, reveal }); } catch (err) { reveal(); }
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

  /* ---------------------------------------------------------------- 7. Crane hook */
  // A twin-sheave block with a ramshorn double hook hangs in the right margin on four falls of wire rope and pays out
  // as you read. Page progress sets the drop through a slightly under-damped spring (weight, a little cable stretch);
  // scroll speed leans it off plumb so it swings about the jib head, slower as the cable lengthens (ω² = g/L); the
  // hook trails on its swivel; the rope lay slides and the knurl on each sheave rim runs with it as rope pays out.
  // At the foot of the page it rests just above the WhatsApp button (html.hk-landed). Decorative only: built here,
  // aria-hidden, no pointer events. Reduced motion: it tracks the page directly, no spring and no swing.
  const HOOK_SVG = `<svg class="hk__svg" viewBox="0 0 120 204" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="hkSteel" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="hk-s0"/><stop offset=".3" class="hk-s1"/><stop offset=".62" class="hk-s2"/><stop offset="1" class="hk-s3"/></linearGradient>
<linearGradient id="hkSteelV" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="hk-s1"/><stop offset=".45" class="hk-s2"/><stop offset="1" class="hk-s0"/></linearGradient>
<linearGradient id="hkForge" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="hk-f0"/><stop offset=".3" class="hk-f1"/><stop offset=".66" class="hk-f2"/><stop offset="1" class="hk-f3"/></linearGradient>
<linearGradient id="hkSheen" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".34" stop-color="#fff" stop-opacity="0"/><stop offset=".66" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>
<pattern id="hkHazard" width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(52)"><rect class="hk-stripe" width="6.5" height="13"/></pattern>
<pattern id="hkTickD" width="10" height="5" patternUnits="userSpaceOnUse"><rect class="hk-tick" width="10" height="1.3"/></pattern>
<pattern id="hkTickL" width="10" height="5" patternUnits="userSpaceOnUse"><rect class="hk-tick" width="10" height="1.3"/></pattern>
<clipPath id="hkPlate"><path d="M17 8H103Q115 8 115 20V64L90 96H30L5 64V20Q5 8 17 8Z"/></clipPath>
</defs>
<path class="hk-window" d="M28 18H52Q55 18 55 21V61Q55 64 52 64H28Q25 64 25 61V21Q25 18 28 18ZM68 18H92Q95 18 95 21V61Q95 64 92 64H68Q65 64 65 61V21Q65 18 68 18Z"/>
<path fill="url(#hkSteel)" d="M28 24Q31.5 19.5 35 24V58Q31.5 62.5 28 58Z"/><path fill="url(#hkSteel)" d="M36.5 24Q40 19.5 43.5 24V58Q40 62.5 36.5 58Z"/><path fill="url(#hkSteel)" d="M45 24Q48.5 19.5 52 24V58Q48.5 62.5 45 58Z"/><path fill="url(#hkSteel)" d="M68 24Q71.5 19.5 75 24V58Q71.5 62.5 68 58Z"/><path fill="url(#hkSteel)" d="M76.5 24Q80 19.5 83.5 24V58Q80 62.5 76.5 58Z"/><path fill="url(#hkSteel)" d="M85 24Q88.5 19.5 92 24V58Q88.5 62.5 85 58Z"/><path fill="url(#hkTickD)" d="M28 24Q31.5 19.5 35 24V58Q31.5 62.5 28 58Z"/><path fill="url(#hkTickL)" d="M36.5 24Q40 19.5 43.5 24V58Q40 62.5 36.5 58Z"/><path fill="url(#hkTickL)" d="M45 24Q48.5 19.5 52 24V58Q48.5 62.5 45 58Z"/><path fill="url(#hkTickD)" d="M68 24Q71.5 19.5 75 24V58Q71.5 62.5 68 58Z"/><path fill="url(#hkTickL)" d="M76.5 24Q80 19.5 83.5 24V58Q80 62.5 76.5 58Z"/><path fill="url(#hkTickL)" d="M85 24Q88.5 19.5 92 24V58Q88.5 62.5 85 58Z"/><path class="hk-edge" opacity=".55" d="M28 24Q31.5 19.5 35 24V58Q31.5 62.5 28 58Z"/><path class="hk-edge" opacity=".55" d="M36.5 24Q40 19.5 43.5 24V58Q40 62.5 36.5 58Z"/><path class="hk-edge" opacity=".55" d="M45 24Q48.5 19.5 52 24V58Q48.5 62.5 45 58Z"/><path class="hk-edge" opacity=".55" d="M68 24Q71.5 19.5 75 24V58Q71.5 62.5 68 58Z"/><path class="hk-edge" opacity=".55" d="M76.5 24Q80 19.5 83.5 24V58Q80 62.5 76.5 58Z"/><path class="hk-edge" opacity=".55" d="M85 24Q88.5 19.5 92 24V58Q88.5 62.5 85 58Z"/>
<path class="hk-rope" d="M31.5 0V57M48.5 0V57M71.5 0V57M88.5 0V57"/><path class="hk-rope-hi" d="M31.5 0V57M48.5 0V57M71.5 0V57M88.5 0V57"/>
<rect x="25" y="28" width="30" height="2.4" rx=".8" fill="url(#hkSteelV)"/><rect x="25" y="52" width="30" height="2.4" rx=".8" fill="url(#hkSteelV)"/><rect x="65" y="28" width="30" height="2.4" rx=".8" fill="url(#hkSteelV)"/><rect x="65" y="52" width="30" height="2.4" rx=".8" fill="url(#hkSteelV)"/>
<g fill="url(#hkSteel)"><rect x="28.6" y="-12" width="5.8" height="10" rx="1.6"/><rect x="45.6" y="-12" width="5.8" height="10" rx="1.6"/><rect x="68.6" y="-12" width="5.8" height="10" rx="1.6"/><rect x="85.6" y="-12" width="5.8" height="10" rx="1.6"/></g><g class="hk-edge"><rect x="28.6" y="-12" width="5.8" height="10" rx="1.6"/><rect x="45.6" y="-12" width="5.8" height="10" rx="1.6"/><rect x="68.6" y="-12" width="5.8" height="10" rx="1.6"/><rect x="85.6" y="-12" width="5.8" height="10" rx="1.6"/></g>
<path fill="url(#hkSteel)" d="M52 9V3Q52 -4 60 -4Q68 -4 68 3V9Z"/><path class="hk-edge" d="M52 9V3Q52 -4 60 -4Q68 -4 68 3V9Z"/><circle class="hk-window" cx="60" cy="2" r="2.6"/>
<path class="hk-body" fill-rule="evenodd" d="M17 8H103Q115 8 115 20V64L90 96H30L5 64V20Q5 8 17 8ZM28 18H52Q55 18 55 21V61Q55 64 52 64H28Q25 64 25 61V21Q25 18 28 18ZM68 18H92Q95 18 95 21V61Q95 64 92 64H68Q65 64 65 61V21Q65 18 68 18Z"/>
<rect y="66" width="120" height="32" fill="url(#hkHazard)" clip-path="url(#hkPlate)"/>
<path fill="url(#hkSheen)" fill-rule="evenodd" d="M17 8H103Q115 8 115 20V64L90 96H30L5 64V20Q5 8 17 8ZM28 18H52Q55 18 55 21V61Q55 64 52 64H28Q25 64 25 61V21Q25 18 28 18ZM68 18H92Q95 18 95 21V61Q95 64 92 64H68Q65 64 65 61V21Q65 18 68 18Z"/>
<path class="hk-edge" d="M17 8H103Q115 8 115 20V64L90 96H30L5 64V20Q5 8 17 8ZM7 66H113M28 18H52Q55 18 55 21V61Q55 64 52 64H28Q25 64 25 61V21Q25 18 28 18ZM68 18H92Q95 18 95 21V61Q95 64 92 64H68Q65 64 65 61V21Q65 18 68 18Z"/>
<path class="hk-edge" opacity=".6" d="M10 14V62M15 14V62M20 14V62M100 14V62M105 14V62M110 14V62"/>
<path d="M17 9.2H103" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>
<g fill="url(#hkSteel)"><circle cx="60" cy="27" r="1.9"/><circle cx="60" cy="41" r="1.9"/><circle cx="60" cy="55" r="1.9"/></g>
<circle cx="60" cy="81" r="9" fill="url(#hkSteel)"/><circle class="hk-edge" cx="60" cy="81" r="9"/><circle class="hk-window" cx="60" cy="81" r="4.4" opacity=".8"/><circle cx="60" cy="81" r="2" fill="url(#hkSteel)"/>
<rect x="38" y="96" width="44" height="8" rx="2.5" fill="url(#hkSteel)"/><rect class="hk-edge" x="38" y="96" width="44" height="8" rx="2.5"/>
<g class="hk-hook">
<rect x="47" y="104" width="26" height="6" rx="1.5" fill="url(#hkSteel)"/>
<path fill="url(#hkSteel)" d="M45 110H75L78 115L75 120H45L42 115Z"/><path class="hk-edge" d="M45 110H75L78 115L75 120H45L42 115ZM52 110V120M68 110V120"/>
<path fill="url(#hkForge)" d="M67 120V158A11 11 0 0 0 89 158C89 150 88 145 86 140Q85 131 91 132C97 133 100 146 100 160C100 184 84 198 60 198C36 198 20 184 20 160C20 146 23 133 29 132Q35 131 34 140C32 145 31 150 31 158A11 11 0 0 0 53 158V120Z"/>
<path class="hk-rim" d="M34 140C32 145 31 150 31 158A11 11 0 0 0 53 158V136M86 140C88 145 89 150 89 158A11 11 0 0 1 67 158V136"/>
<path d="M24 162C24 182 38 194 56 195" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1.5" stroke-linecap="round"/>
<path d="M55 124V150" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.4" stroke-linecap="round"/>
</g>
</svg>`;

  function craneHook() {
    const host = document.createElement('div');
    host.className = 'hk';
    host.setAttribute('aria-hidden', 'true');
    host.innerHTML = '<div class="hk__sway"><div class="hk__swing"><div class="hk__drop">'
      + '<i class="hk__rope hk__rope--a"></i><i class="hk__rope hk__rope--b"></i>'
      + '<i class="hk__rope hk__rope--c"></i><i class="hk__rope hk__rope--d"></i>' + HOOK_SVG
      + '<span class="hk__tag"><b>SWL 700 T</b><span class="hk__dn"><span class="hk__pct">0</span>%</span></span>'
      + '</div></div></div>';
    document.body.append(host);

    const swing = host.querySelector('.hk__swing');
    const drop = host.querySelector('.hk__drop');
    const ropes = host.querySelectorAll('.hk__rope'); // a and c are made fast at the jib; b and d run over the sheaves
    const knurlDead = host.querySelector('#hkTickD');   // rim of a sheave whose rope is made fast ...
    const knurlLive = host.querySelector('#hkTickL');   // ... and of one whose rope runs
    const hook = host.querySelector('.hk-hook');
    const pct = host.querySelector('.hk__pct');
    const wa = document.querySelector('[data-wa]');

    let top = 0;    // block top at the top of the page, px from the viewport top
    let floor = 0;  // ... and at the foot of the page
    let unit = 1;   // px per SVG unit
    let height = 0;
    let maxLean = 3.4; // degrees; halved on phones, where the hook hangs over the text column
    const measure = () => {
      unit = drop.offsetWidth / 120 || 1;
      maxLean = innerWidth < 600 ? 1.6 : 3.4;
      height = drop.offsetHeight;
      top = Math.max(132, innerHeight * 0.17); // clear of the site header
      // layout box of the WhatsApp container: unaffected by the button's own hover / entrance transforms
      const base = wa ? wa.getBoundingClientRect().top - 18 : innerHeight - 24;
      floor = Math.max(top, base - height);
    };
    const progress = () => {
      const max = doc.scrollHeight - innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    };

    let y = 0, vy = 0;    // drop
    let th = 0, vth = 0;  // swing about the jib head, degrees
    let ph = 0, vph = 0;  // hook on its swivel, degrees
    let sv = 0;           // smoothed scroll speed, px/s
    let lastY = scrollY, lastT = 0, raf = 0, shown = '', landed = false;

    const paint = (p) => {
      swing.style.transform = `rotate(${th.toFixed(3)}deg)`;
      drop.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
      hook.style.transform = `rotate(${ph.toFixed(3)}deg)`;
      // The dead legs are made fast at the jib, so their lay holds still in the world; the live legs run over the
      // sheaves at twice the block's speed (once relative to it). Seen edge-on, a sheave turns as the knurl on its
      // rim running up or down with its rope; the pattern tile is 5 SVG units tall.
      const dead = `0 0,0 ${(-y).toFixed(1)}px`, live = `0 0,0 ${y.toFixed(1)}px`;
      ropes[0].style.backgroundPosition = ropes[2].style.backgroundPosition = dead;
      ropes[1].style.backgroundPosition = ropes[3].style.backgroundPosition = live;
      const u = y / unit;
      knurlDead.setAttribute('patternTransform', `translate(0 ${(-u % 5).toFixed(2)})`);
      knurlLive.setAttribute('patternTransform', `translate(0 ${(u % 5).toFixed(2)})`);
      const f = floor > top ? Math.min(1, Math.max(0, (y - top) / (floor - top))) : p;
      const txt = String(Math.round(f * 100));
      if (txt !== shown) pct.textContent = shown = txt;
      const now = p > 0.985 && Math.abs(y - floor) < 14;
      if (now !== landed) doc.classList.toggle('hk-landed', (landed = now));
    };

    const step = (t) => {
      raf = 0;
      // two callbacks can share a timestamp (throttled or forced frames): never divide by a zero step
      const dt = lastT && t > lastT ? Math.min(0.034, (t - lastT) / 1000) : 1 / 60;
      lastT = t;
      const s = scrollY;
      sv += ((s - lastY) / dt - sv) * 0.2;
      if (!Number.isFinite(sv)) sv = 0;
      lastY = s;
      const p = progress();
      const target = top + p * (floor - top);
      const w2 = 2400 / Math.max(60, y + height * 0.6);         // pendulum ω², jib head to centre of mass
      const lean = Math.max(-maxLean, Math.min(maxLean, sv * 0.0011)); // degrees off plumb at this scroll speed
      for (let i = 0, h = dt / 2; i < 2; i++) {
        vy += (90 * (target - y) - 11 * vy) * h;
        y += vy * h;
        vth += (-w2 * (th - lean) - 0.32 * Math.sqrt(w2) * vth) * h;
        th += vth * h;
        vph += (80 * (-0.4 * th - ph) - 5 * vph) * h;
        ph += vph * h;
      }
      paint(p);
      const moving = Math.abs(target - y) + Math.abs(vy) > 0.05
        || Math.abs(th) + Math.abs(vth) + Math.abs(ph) + Math.abs(vph) > 0.004 || Math.abs(sv) > 2;
      if (moving) raf = requestAnimationFrame(step);
      else lastT = 0;
    };

    const place = () => {
      raf = 0;
      const p = progress();
      y = top + p * (floor - top);
      paint(p);
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(reduced ? place : step); };

    ready.then(() => {
      measure();
      y = -(height + 60); // lowered in from just above the viewport as the curtain lifts
      lastY = scrollY;
      addEventListener('scroll', wake, { passive: true });
      addEventListener('resize', () => { measure(); wake(); }, { passive: true });
      addEventListener('load', () => { measure(); wake(); });
      setTimeout(wake, reduced ? 0 : 350);
    });
  }

  /* ---------------------------------------------------------------- 8. WhatsApp chooser */
  // [data-wa] holds a [data-wa-fab] button and the [data-wa-panel] popover it opens (popovertarget). The browser does
  // open/close, light dismiss, Escape and focus return; this adds `is-open` / `was-opened` for styling, focus to the
  // first line on open, a hand-rolled fallback where popover is unsupported, and one "WhatsApp us" tease a third of
  // the way down the page.
  function whatsapp() {
    const wa = document.querySelector('[data-wa]');
    const fab = wa && wa.querySelector('[data-wa-fab]');
    const panel = wa && wa.querySelector('[data-wa-panel]');
    if (!fab || !panel) return;
    const first = panel.querySelector('a');

    const set = (open) => {
      wa.classList.toggle('is-open', open);
      if (open) wa.classList.add('was-opened');
      if (open) wa.classList.remove('is-teasing');
    };
    if (typeof panel.showPopover === 'function') {
      panel.addEventListener('toggle', (e) => {
        const open = e.newState === 'open';
        set(open);
        if (open && first) first.focus({ preventScroll: true });
      });
    } else {
      wa.classList.add('wa--fallback');
      fab.removeAttribute('popovertarget');
      fab.setAttribute('aria-controls', panel.id);
      const toggle = (open) => { set(open); fab.setAttribute('aria-expanded', String(open)); };
      toggle(false);
      fab.addEventListener('click', () => {
        const open = !wa.classList.contains('is-open');
        toggle(open);
        if (open && first) first.focus({ preventScroll: true });
      });
      document.addEventListener('click', (e) => {
        if (wa.classList.contains('is-open') && !wa.contains(e.target)) toggle(false);
      });
      addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && wa.classList.contains('is-open')) { toggle(false); fab.focus(); }
      });
    }

    const tease = () => {
      const max = doc.scrollHeight - innerHeight;
      if (max <= 0 || scrollY / max < 0.33) return;
      removeEventListener('scroll', tease);
      if (wa.classList.contains('was-opened')) return;
      wa.classList.add('is-teasing');
      setTimeout(() => wa.classList.remove('is-teasing'), 4200);
    };
    ready.then(() => addEventListener('scroll', tease, { passive: true }));
  }

  ready.then(startObservers);
  craneHook();
  whatsapp();
  runPreloader();
})();
