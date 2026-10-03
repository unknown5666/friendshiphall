/* FHE core — shared behaviour for the three homepage concepts. Loaded with `defer`, no dependencies.
 *
 *  1. Hook preloader   emblem drops on a cable, bounces, then lifts and docks into the header logo slot
 *  2. In-page links    anchor clicks scroll WITHOUT adding history entries, so Back always returns to the
 *                      previous page (the concepts hub) instead of stepping through #sections
 *  3. Hub link         "All concepts" uses history.back() when we arrived from the hub (no stack growth)
 *  4. Mobile nav       button-driven (never hash-driven), closes on navigate / Escape
 *  5. Lazy time-lapse  the <video> source is attached only when it nears the viewport; paused off-screen
 *  6. Reveal, count-up, UAE clock, scrolled-header flag
 *  7. Crane hook       a hook block on wire rope pays out down the right margin as you scroll (spring + pendulum)
 *  8. WhatsApp         floating button + two-line chooser (native popover, with a fallback)
 *
 *  Contract (markup each concept provides):
 *    <html> gets `js` + `is-preloading` from the inline head snippet (see build brief)
 *    [data-preloader] > .preloader__backdrop + [data-preloader-rig] (cable + inline emblem)
 *    [data-dock-target]            header emblem the rig docks into
 *    [data-hub-link]               link to index.html
 *    [data-nav-toggle][aria-controls=ID]   mobile menu button; #ID gets `.is-open`
 *    video[data-lazy-video][data-poster] > source[data-src]   inside [data-timelapse]; optional [data-timelapse-toggle]
 *    [data-reveal]  [data-count="35"]  [data-uae-clock="hms|hm"]
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

  /* ---------------------------------------------------------------- 7. Crane hook */
  // A hook block on two falls of wire rope hangs in the right margin and pays out as you read. Page progress sets the
  // drop through a slightly under-damped spring (weight, a little cable stretch); scroll speed leans it off plumb so it
  // swings about the jib head, slower as the cable lengthens (ω² = g/L); the hook trails on its swivel; the sheave
  // turns and the rope lay slides as rope pays out. At the foot of the page it rests just above the WhatsApp button
  // (html.hk-landed). Decorative only: built here, aria-hidden, no pointer events. Reduced motion: it tracks the page
  // directly, no spring and no swing.
  const HOOK_SVG = `<svg class="hk__svg" viewBox="0 0 100 222" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="hkSteel" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="hk-s0"/><stop offset=".3" class="hk-s1"/><stop offset=".62" class="hk-s2"/><stop offset="1" class="hk-s3"/></linearGradient>
<linearGradient id="hkSheen" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".34" stop-color="#fff" stop-opacity="0"/><stop offset=".66" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>
<pattern id="hkHazard" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hk-stripe" width="4" height="8"/></pattern>
<clipPath id="hkPlate"><path d="M30 4H70Q84 4 84 18V64L77 86H23L16 64V18Q16 4 30 4Z"/></clipPath>
</defs>
<circle class="hk-window" cx="50" cy="30" r="17"/>
<g class="hk-sheave"><circle cx="50" cy="30" r="12" fill="url(#hkSteel)"/><circle class="hk-window" cx="50" cy="30" r="9" opacity=".7"/><path class="hk-spokes" d="M50 21.5V38.5M41.5 30H58.5M44 24l12 12M56 24 44 36"/><circle cx="50" cy="30" r="3.2" fill="url(#hkSteel)"/></g>
<path class="hk-rope" d="M38 0V30A12 12 0 0 0 62 30V0"/><path class="hk-rope-hi" d="M38 0V30A12 12 0 0 0 62 30V0"/>
<path class="hk-body" fill-rule="evenodd" d="M30 4H70Q84 4 84 18V64L77 86H23L16 64V18Q16 4 30 4ZM67 30A17 17 0 1 0 33 30A17 17 0 1 0 67 30Z"/>
<rect y="62" width="100" height="26" fill="url(#hkHazard)" clip-path="url(#hkPlate)"/>
<path fill="url(#hkSheen)" fill-rule="evenodd" d="M30 4H70Q84 4 84 18V64L77 86H23L16 64V18Q16 4 30 4ZM67 30A17 17 0 1 0 33 30A17 17 0 1 0 67 30Z"/>
<path class="hk-edge" d="M30 4H70Q84 4 84 18V64L77 86H23L16 64V18Q16 4 30 4ZM16 62H84"/><circle class="hk-edge" cx="50" cy="30" r="17"/>
<path d="M30 5.2H70" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>
<g fill="url(#hkSteel)"><circle cx="24" cy="14" r="2.4"/><circle cx="76" cy="14" r="2.4"/><circle cx="24" cy="50" r="2.4"/><circle cx="76" cy="50" r="2.4"/></g>
<rect x="27" y="86" width="46" height="9" rx="2.5" fill="url(#hkSteel)"/><rect class="hk-edge" x="27" y="86" width="46" height="9" rx="2.5"/>
<g class="hk-hook">
<rect x="40" y="95" width="20" height="10" rx="2" fill="url(#hkSteel)"/>
<path fill="url(#hkSteel)" d="M38 105H62L64.5 110L62 115H38L35.5 110Z"/><path class="hk-edge" d="M38 105H62L64.5 110L62 115H38L35.5 110ZM46 105V115M54 105V115"/>
<path fill="url(#hkSteel)" d="M45.5 115V146C45.5 157 22 160 21 186C20 207 35 218 53 218C70 218 81 206 81 190C81 177 77 166 72 159C70 156 66 156.5 66.5 160C67 166 67.5 176 67 186A15 15 0 0 1 37 186C37 171 45.5 162 54.5 156V115Z"/>
<path class="hk-edge" d="M45.5 115V146C45.5 157 22 160 21 186C20 207 35 218 53 218C70 218 81 206 81 190C81 177 77 166 72 159C70 156 66 156.5 66.5 160C67 166 67.5 176 67 186A15 15 0 0 1 37 186C37 171 45.5 162 54.5 156V115Z"/>
<path d="M26 176C25 195 35 209 51 212" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>
<path d="M65.6 188A13.6 13.6 0 0 1 38.4 188" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2"/>
<path class="hk-latch" d="M56 148L66.6 158.4"/><circle class="hk-latch-pin" cx="55.6" cy="147.6" r="1.8"/>
</g>
</svg>`;

  function craneHook() {
    const host = document.createElement('div');
    host.className = 'hk';
    host.setAttribute('aria-hidden', 'true');
    host.innerHTML = '<div class="hk__sway"><div class="hk__swing"><div class="hk__drop">'
      + '<i class="hk__rope hk__rope--dead"></i><i class="hk__rope hk__rope--live"></i>' + HOOK_SVG
      + '<span class="hk__tag"><b>SWL 700 T</b><span class="hk__dn"><span class="hk__pct">0</span>%</span></span>'
      + '</div></div></div>';
    document.body.append(host);

    const swing = host.querySelector('.hk__swing');
    const drop = host.querySelector('.hk__drop');
    const [dead, live] = host.querySelectorAll('.hk__rope');
    const sheave = host.querySelector('.hk-sheave');
    const hook = host.querySelector('.hk-hook');
    const pct = host.querySelector('.hk__pct');
    const wa = document.querySelector('[data-wa]');

    let top = 0;    // block top at the top of the page, px from the viewport top
    let floor = 0;  // ... and at the foot of the page
    let unit = 1;   // px per SVG unit
    let height = 0;
    let maxLean = 3.4; // degrees; halved on phones, where the hook hangs over the text column
    const measure = () => {
      unit = drop.offsetWidth / 100 || 1;
      maxLean = innerWidth < 600 ? 1.6 : 3.4;
      height = drop.offsetHeight;
      top = Math.max(132, innerHeight * 0.17); // clear of every concept's header
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
      // The dead end is made fast at the jib, so its lay holds still in the world; the live fall runs over the
      // sheave at twice the block's speed (once relative to it). The sheave turns by arc length / radius.
      dead.style.backgroundPosition = `0 0,0 ${(-y).toFixed(1)}px`;
      live.style.backgroundPosition = `0 0,0 ${y.toFixed(1)}px`;
      sheave.style.transform = `rotate(${((y / (12 * unit)) * 57.2958 % 360).toFixed(1)}deg)`;
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
