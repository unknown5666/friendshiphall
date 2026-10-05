/* FHE mark — the Friendship Hall emblem, built from the client's own drawing (assets/brand/source/logo_fhe.dwg →
 * assets/brand/fhs-mark.svg), brought to life. Loaded with `defer` BEFORE fhe-core.js. No dependencies.
 *
 *  1. Intro    window.FHEIntro: fhe-core.js hands it the preloader when that is [data-preloader="mark"].
 *              A spark welds the ring while a load dial ticks round it; the rope and hook drop in and swing; three
 *              weld heads trace F·H·S; molten gold pours into the letters; the mark locks with a shockwave and a
 *              spray of sparks; then the ring opens as an iris onto the page while the mark flies into the header.
 *              About 7.5 s; the second visit in a session gets a 3 s cut. A tap, a key or a scroll skips to the lock.
 *  2. Header   hovering the brand swings the hook on its ropes (and it swings once as the intro lands it).
 *  3. Seal     [data-seal] above the footer: the mark draws itself as it scrolls in and pours (eased behind the
 *              scroll, so a fast flick still plays out), tilts toward the pointer, and scroll speed swings the hook.
 *
 *  The header copy of the mark (assets/brand/fhs-mark.inline.svg) is the source; the intro and the seal clone it.
 *  Every moving part is plain SVG + one canvas for sparks, driven by requestAnimationFrame from a single clock.
 */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const PIVOT = -104.5;   // top of the ropes in mark units (ring r = 500, centre 0 0): the hook swings about it
  const UNITS = 1010;     // the mark's viewBox width

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));   // progress of t through [a, b]
  const lerp = (a, b, p) => a + (b - a) * p;
  const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const inOutSine = (p) => -(Math.cos(Math.PI * p) - 1) / 2;
  const outCubic = (p) => 1 - Math.pow(1 - p, 3);

  function svgEl(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------------------------------------------------------------- the gold mark */
  // Turns a copy of the mark into the gold one: brushed-gold strokes, letters as outlines over a clip that molten
  // metal pours into, and a glint. Starts empty (CSS hides the dashed strokes); returns handles to animate it.
  function dress(svg, id) {
    const glyphs = Array.from(svg.querySelectorAll('.fhm-glyph'));
    const letters = svg.querySelector('.fhm-letters');
    const rig = svg.querySelector('.fhm-rig');
    const defs = svgEl('defs', {});
    svg.insertBefore(defs, svg.firstChild);

    const gold = svgEl('linearGradient', { id: `${id}-gold`, gradientUnits: 'userSpaceOnUse', x1: -440, y1: -300, x2: 440, y2: 300 }, defs);
    [[0, '#7E5F27'], [0.18, '#E6CA86'], [0.34, '#C5A059'], [0.5, '#FBEFCF'], [0.66, '#A88440'], [0.84, '#DDBB72'], [1, '#86662B']]
      .forEach(([o, c]) => svgEl('stop', { offset: o, 'stop-color': c }, gold));
    const hot = svgEl('linearGradient', { id: `${id}-hot`, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    [[0, '#FFFDF3', 1], [0.3, '#FFE7AA', 0.95], [1, '#E3913A', 0]]
      .forEach(([o, c, a]) => svgEl('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, hot));
    const shine = svgEl('linearGradient', { id: `${id}-shine`, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    [[0, 0], [0.5, 0.92], [1, 0]].forEach(([o, a]) => svgEl('stop', { offset: o, 'stop-color': '#FFF9E8', 'stop-opacity': a }, shine));
    const clip = svgEl('clipPath', { id: `${id}-clip` }, defs);
    glyphs.forEach((g) => svgEl('path', { d: g.getAttribute('d') }, clip));

    const pour = svgEl('g', { class: 'fhm-pour', 'clip-path': `url(#${id}-clip)` });
    svg.insertBefore(pour, letters);
    const metal = svgEl('path', { class: 'fhm-metal', fill: `url(#${id}-gold)` }, pour);
    const surface = svgEl('path', { class: 'fhm-surface', fill: `url(#${id}-hot)` }, pour);
    const glint = svgEl('rect', { class: 'fhm-glint', x: -80, y: -330, width: 160, height: 660, fill: `url(#${id}-shine)` }, pour);

    const stroke = `url(#${id}-gold)`;
    [svg.querySelector('.fhm-ring'), letters, rig].forEach((g) => g.setAttribute('stroke', stroke));
    rig.id = `${id}-rig`;
    svg.classList.add('is-dressed');
    const m = { svg, glyphs, rig, pour, metal, surface, glint, ring: svg.querySelector('.fhm-ring__path') };
    pourTo(m, 0, 0);
    glintAt(m, -1);
    return m;
  }

  // Molten metal rising through the letters: p 0 → 1 lifts the level from below the baseline to above the caps.
  // The surface is a travelling double sine, calm at the start and at the brim, with a white-hot band under it.
  function pourTo(m, p, phase) {
    if (p <= 0) { m.pour.style.visibility = 'hidden'; return; }
    m.pour.style.visibility = '';
    const level = lerp(165, -172, p);
    const amp = 7.5 * Math.sin(Math.PI * Math.min(1, p * 1.12)) + 0.4;
    const top = [];
    for (let x = -430; x <= 430; x += 20) {
      top.push([x, level + amp * Math.sin(phase + x * 0.045) + amp * 0.45 * Math.sin(phase * 1.7 - x * 0.11)]);
    }
    const line = top.map(([x, y]) => `${x} ${y.toFixed(1)}`).join('L');
    m.metal.setAttribute('d', `M-430 190L${line}L430 190Z`);
    m.surface.setAttribute('d', `M${line}L${top.reverse().map(([x, y]) => `${x} ${(y + 36).toFixed(1)}`).join('L')}Z`);
    m.surface.style.opacity = (1 - seg(p, 0.8, 1)).toFixed(3);
  }

  // A bright band crossing the letters: p 0 → 1, anything else hides it.
  function glintAt(m, p) {
    if (p <= 0 || p >= 1) { m.glint.style.visibility = 'hidden'; return; }
    m.glint.style.visibility = '';
    m.glint.setAttribute('transform', `translate(${lerp(-560, 560, p).toFixed(1)} 0) skewX(-22)`);
  }

  // Stroke widths are set in screen pixels; the dressed mark draws in mark units, so convert per size.
  function strokePx(svg, px, scale = 1) {
    const w = svg.getBoundingClientRect().width / scale;
    if (w) svg.style.setProperty('--sw', `${(px * UNITS / w).toFixed(2)}px`);   // 1 CSS px = 1 mark unit inside the SVG
  }

  /* ---------------------------------------------------------------- sparks */
  // A small additive particle system on one canvas: welding sparks (streaks under gravity), glow sprites, shock rings.
  function sparks(canvas) {
    const ctx = canvas.getContext('2d');
    const parts = [];
    let W = 0, H = 0, max = 520;
    const glow = document.createElement('canvas');
    glow.width = glow.height = 128;
    const g = glow.getContext('2d');
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,248,1)');
    rg.addColorStop(0.14, 'rgba(255,238,188,.9)');
    rg.addColorStop(0.38, 'rgba(240,176,84,.32)');
    rg.addColorStop(1, 'rgba(197,160,89,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 128, 128);
    const tint = ['rgba(255,249,230,.95)', 'rgba(250,206,118,.85)', 'rgba(212,122,46,.55)'];

    return {
      ctx,
      size(w, h, dpr) {
        W = w; H = h;
        max = Math.min(w, h) < 600 ? 260 : 520;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      },
      clear() { ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, W, H); },
      // n sparks from x,y heading `dir` ± spread/2, at speed v0–v1 px/s
      emit(x, y, n, dir, spread, v0, v1) {
        for (let i = 0; i < n && parts.length < max; i++) {
          const a = dir + (Math.random() - 0.5) * spread;
          const v = v0 + Math.random() * (v1 - v0);
          parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: 380 + Math.random() * 720 });
        }
      },
      glow(x, y, size, alpha) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = clamp(alpha);
        ctx.drawImage(glow, x - size / 2, y - size / 2, size, size);
        ctx.globalAlpha = 1;
      },
      ring(x, y, r, width, rgba) {
        if (r <= 0) return;
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.lineWidth = width;
        ctx.strokeStyle = rgba;
        ctx.stroke();
      },
      step(dt) {
        const drag = Math.exp(-dt * 1.7);
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.age += dt * 1000;
          if (p.age > p.life) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
          p.vx *= drag;
          p.vy = p.vy * drag + 980 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
      },
      draw() {
        if (!parts.length) return;
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        for (let b = 0; b < 3; b++) {
          ctx.beginPath();
          for (const p of parts) {
            const a = p.age / p.life;
            if ((a < 0.22 ? 0 : a < 0.6 ? 1 : 2) !== b) continue;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 0.026, p.y - p.vy * 0.026);
          }
          ctx.lineWidth = [1.7, 1.3, 1][b];
          ctx.strokeStyle = tint[b];
          ctx.stroke();
        }
      },
      get count() { return parts.length; },
    };
  }

  /* ---------------------------------------------------------------- 1. Intro */
  function intro({ pre, dock, reveal }) {
    const doc = document.documentElement;
    const source = dock && dock.querySelector('.fhs-mark');
    const stage = pre.querySelector('[data-mark-stage]');
    const backdrop = pre.querySelector('.preloader__backdrop');
    const load = pre.querySelector('[data-mark-load]');
    if (!source || !stage || !backdrop) { reveal(); return; }

    let quick = false;
    try {
      quick = sessionStorage.getItem('fhe:mark') === 'seen';
      sessionStorage.setItem('fhe:mark', 'seen');
    } catch (e) { /* storage blocked: play it in full */ }
    pre.classList.toggle('is-quick', quick);

    // ms from the start. Everything up to the lock is a pure function of the clock, so a skip just moves the clock.
    // After the lock, times count from the moment it actually fired.
    // open: lock → iris; iris: the iris and the flight to the header. Full ≈ 7.4 s, quick ≈ 3.1 s.
    const T = quick
      ? { ring: [0, 900], drop: [100, 520], trace: [[250, 900], [310, 960], [370, 1020]], pour: [600, 1350], lock: 1400, open: 600, iris: 1100 }
      : { ring: [250, 1800], drop: [1650, 2150], trace: [[2350, 3350], [2480, 3480], [2610, 3610]], pour: [3500, 4650], lock: 4750, open: 1200, iris: 1450 };
    const land = T.drop[1];

    const svg = source.cloneNode(true);
    svg.classList.add('fhs-mark--intro');
    stage.appendChild(svg);
    const m = dress(svg, 'fhmi');
    m.rig.style.visibility = 'hidden';
    const lens = m.glyphs.map((g) => g.getTotalLength());
    const ghosts = [[0.34, 24], [0.14, 56]].map(([o, lag]) => {
      const u = svgEl('use', { href: `#${m.rig.id}`, opacity: 0 });
      svg.insertBefore(u, m.rig);
      return { u, o, lag };
    });

    const canvas = document.createElement('canvas');
    canvas.className = 'mark-fx';
    pre.appendChild(canvas);
    const fx = sparks(canvas);

    let W = 0, H = 0, cx = 0, cy = 0, S = 1, k = 1, R = 1, small = false;
    let dockTo = { x: 0, y: 0, s: 0.1 };
    function measure() {
      W = innerWidth; H = innerHeight; small = Math.min(W, H) < 600;
      fx.size(W, H, Math.min(devicePixelRatio || 1, 2));
      const prev = stage.style.transform;
      stage.style.transform = 'none';
      const r = stage.getBoundingClientRect();
      stage.style.transform = prev;
      S = r.width || 1; cx = r.left + S / 2; cy = r.top + S / 2; k = S / UNITS; R = 500 * k;
      if (openAt < 0) svg.style.setProperty('--sw', `${(2 / k).toFixed(2)}px`);   // 2px lines while it is built
      pre.style.setProperty('--cx', `${cx.toFixed(1)}px`);
      pre.style.setProperty('--cy', `${cy.toFixed(1)}px`);
      const d = source.getBoundingClientRect();
      if (d.width) dockTo = { x: d.left + d.width / 2 - cx, y: d.top + d.height / 2 - cy, s: d.width / S };
    }

    let t0 = 0, last = 0, raf = 0, done = false;
    let lockAt = -1, openAt = -1, irisAt = Infinity, docked = false, shown = '';
    const shocks = [];

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const t = now - t0;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const rate = (n) => Math.floor(n * (small ? 0.55 : 1) * dt + Math.random());
      fx.clear();

      // 1 · ring weld ----------------------------------------------------------------------------------------------
      const pr = inOutCubic(seg(t, T.ring[0], T.ring[1]));
      const head = -Math.PI / 2 + TAU * pr;
      if (openAt < 0) m.ring.style.strokeDashoffset = (1 - pr).toFixed(4);
      if (pr > 0 && pr < 1) {
        const hx = cx + Math.cos(head) * R, hy = cy + Math.sin(head) * R;
        fx.emit(hx, hy, rate(300), head - Math.PI / 2, 1.9, 90, 520);
        fx.glow(hx, hy, 70 + Math.random() * 24, 1);
      }

      // load dial: ticks appear behind the weld head, then turn; they ride out on the iris
      const ip = openAt < 0 ? 0 : seg(t, openAt, openAt + T.iris);
      const irisR = openAt < 0 ? 0 : lerp(R, Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 60, inOutCubic(ip));
      dial(t, pr < 1 ? head : Infinity, irisR ? irisR / R : 1, seg(t, T.ring[0], T.ring[0] + 450) * (1 - ip));

      // 2 · the rope and hook drop in, catch, and swing about the rope tops -----------------------------------------
      const off = cy / k + 380;   // far enough above to start off-screen
      let ry = -off, ra = 0, vy = 0;
      if (t >= T.drop[0] && t < land) {
        const p = seg(t, T.drop[0], land);
        ry = -off * (1 - p * p);
        vy = (2 * off * p) / (land - T.drop[0]);   // units per ms
        ra = 3.2 * p;
      } else if (t >= land) {
        const s = t - land;
        ry = 15 * Math.exp(-s / 220) * Math.sin((s / 320) * TAU);
        ra = 3.2 * Math.exp(-s / 700) * Math.cos((s / 980) * TAU);
      }
      m.rig.style.visibility = t < T.drop[0] ? 'hidden' : '';
      m.rig.setAttribute('transform', `translate(0 ${ry.toFixed(2)}) rotate(${ra.toFixed(3)} 0 ${PIVOT})`);
      ghosts.forEach((gh) => {
        gh.u.setAttribute('opacity', vy ? gh.o : 0);
        if (vy) gh.u.setAttribute('transform', `translate(0 ${(-vy * gh.lag).toFixed(1)})`);
      });

      // 3 · three weld heads trace F · H · S --------------------------------------------------------------------------
      m.glyphs.forEach((g, i) => {
        const p = inOutSine(seg(t, T.trace[i][0], T.trace[i][1]));
        g.style.strokeDashoffset = (1 - p).toFixed(4);
        if (p > 0 && p < 1) {
          const q = g.getPointAtLength(lens[i] * p);
          const x = cx + q.x * k, y = cy + q.y * k;
          fx.emit(x, y, rate(170), -Math.PI / 2, TAU, 40, 300);
          fx.glow(x, y, 44 + Math.random() * 20, 0.95);
        }
      });

      // 4 · molten gold pours in ------------------------------------------------------------------------------------
      pourTo(m, inOutSine(seg(t, T.pour[0], T.pour[1])), t * 0.011);

      // 5 · lock: punch, shake, shockwave, a spray of sparks off the ring, the name -------------------------------------
      if (lockAt < 0 && t >= T.lock) {
        lockAt = t;
        if (irisAt === Infinity) irisAt = lockAt + T.open;
        pre.classList.add('is-locked');
        for (let i = 0, n = small ? 90 : 170; i < n; i++) {
          const a = Math.random() * TAU;
          fx.emit(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 1, a, 0.5, 260, 1150);
        }
        shocks.push({ at: t, dur: 1200, r0: R, r1: R * 2.3, w: 2.4, a: 0.9 }, { at: t + 70, dur: 1600, r0: R * 0.98, r1: R * 3, w: 6, a: 0.14 });
      }
      let sx = 0, sy = 0, sc = 1;
      const tl = t - land;
      if (tl > 0 && tl < 520) sy += 3.5 * Math.exp(-tl / 90) * Math.sin(tl / 20);
      const tk = lockAt < 0 ? -1 : t - lockAt;
      if (tk >= 0 && tk < 1200) {
        sc *= 1 + 0.055 * Math.exp(-tk / 200) * Math.sin(tk / 60);
        sx += 6 * Math.exp(-tk / 110) * Math.sin(tk / 12);
        sy += 5 * Math.exp(-tk / 110) * Math.cos(tk / 14);
        m.ring.style.strokeWidth = `calc(var(--sw) * ${(1 + 1.6 * Math.exp(-tk / 220)).toFixed(3)})`;
        fx.glow(cx, cy, S * 2.4, 0.42 * Math.exp(-tk / 200));
      }
      const gap = Math.min(1200, irisAt - lockAt);   // the glint fits the hold before the iris (shorter in the quick cut / a skip)
      glintAt(m, tk < 0 ? -1 : seg(tk, gap * 0.08, gap * 1.08));
      const tons = String(Math.round(25 + 675 * outCubic(seg(t, T.ring[0], T.lock))));
      if (load && tons !== shown) load.textContent = shown = tons;

      // 6 · the ring opens as an iris onto the page; the mark flies into the header ------------------------------------
      if (openAt < 0 && t >= irisAt) {
        openAt = t;
        measure();
        backdrop.classList.add('is-iris');
        m.ring.style.visibility = 'hidden';   // the canvas carries the ring from here
        reveal(T.iris + 40);                  // hero reveals start under the opening iris
        shocks.push({ at: t, dur: 800, r0: R, r1: R * 1.45, w: 4, a: 0.4 });
      }
      if (openAt >= 0) {
        backdrop.style.setProperty('--ir', `${(irisR - 1).toFixed(1)}px`);
        const a = 1 - seg(ip, 0.75, 1);
        fx.ring(cx, cy, irisR, 18, `rgba(232,194,116,${(0.16 * a).toFixed(3)})`);
        fx.ring(cx, cy, irisR, 2.4, `rgba(252,230,176,${(0.95 * a).toFixed(3)})`);
        for (let i = rate(260); i > 0; i--) {
          const th = Math.random() * TAU;
          fx.emit(cx + Math.cos(th) * irisR, cy + Math.sin(th) * irisR, 1, th, 0.4, 120, 520);
        }
        const d = inOutCubic(seg(ip, 0.12, 1));
        const s = lerp(1, dockTo.s, d);
        sx += dockTo.x * d; sy += dockTo.y * d; sc *= s;
        svg.style.setProperty('--sw', `${(lerp(2, 1.6, d) / (k * s)).toFixed(2)}px`);   // lines thin to the header's 1.6px as it shrinks
        if (!docked && ip > 0.9) { docked = true; doc.classList.add('mark-docked'); }
        if (ip >= 1) finish();
      }
      stage.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;

      for (let i = shocks.length - 1; i >= 0; i--) {
        const s = shocks[i], q = (t - s.at) / s.dur;
        if (q < 0) continue;
        if (q >= 1) { shocks.splice(i, 1); continue; }
        fx.ring(cx, cy, lerp(s.r0, s.r1, outCubic(q)), s.w * (1 - q) + 0.5, `rgba(250,222,160,${(s.a * (1 - q) * (1 - q)).toFixed(3)})`);
      }
      fx.step(dt);
      fx.draw();
    }

    function dial(t, upTo, scale, alpha) {
      if (alpha <= 0) return;
      const ctx = fx.ctx;
      const spin = Math.max(0, t - T.ring[1]) * 0.00008 + (lockAt < 0 ? 0 : Math.max(0, t - lockAt) * 0.0003);
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      for (let i = 0; i < 120; i++) {
        const a0 = -Math.PI / 2 + (i * TAU) / 120;
        if (a0 > upTo) break;
        const a = a0 + spin, c = Math.cos(a), s = Math.sin(a);
        const r1 = R * scale * 1.075, r2 = R * scale * (i % 10 ? 1.1 : 1.145);
        ctx.moveTo(cx + c * r1, cy + s * r1);
        ctx.lineTo(cx + c * r2, cy + s * r2);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(197,160,89,${(0.55 * alpha).toFixed(3)})`;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, R * scale * 1.045, -Math.PI / 2, Math.min(upTo, 1.5 * Math.PI));
      ctx.strokeStyle = `rgba(197,160,89,${(0.24 * alpha).toFixed(3)})`;
      ctx.stroke();
    }

    // Skip: jump the clock to the lock (it still lands with a punch), then open soon after.
    function skip() {
      if (done || openAt >= 0) return;
      const now = performance.now();
      if (lockAt < 0) { t0 = now - T.lock; irisAt = T.lock + 450; }
      else irisAt = Math.min(irisAt, now - t0 + 120);
    }
    const events = [['keydown', skip], ['wheel', skip], ['touchmove', skip], ['resize', measure]];
    function finish() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      pre.removeEventListener('pointerdown', skip);
      events.forEach(([type, fn]) => removeEventListener(type, fn));
      doc.classList.add('mark-docked');
      fx.size(0, 0, 1);   // release the canvas memory; fhe-core hides the preloader
      document.dispatchEvent(new CustomEvent('fhe:mark-docked'));
    }

    const start = () => {
      measure();
      pre.classList.add('is-running');
      t0 = last = performance.now();
      raf = requestAnimationFrame(frame);
      pre.addEventListener('pointerdown', skip);
      events.forEach(([type, fn]) => addEventListener(type, fn, { passive: true }));
      // safety net: if frames stall (a background tab, a hung device), open the page anyway
      setTimeout(() => { if (!done) { reveal(0); finish(); } }, T.lock + T.open + T.iris + 3000);
    };
    // A page opened in a background tab waits until it is first shown, so the show is actually seen.
    if (document.visibilityState === 'hidden') document.addEventListener('visibilitychange', start, { once: true });
    else requestAnimationFrame(() => setTimeout(start, 0));
  }
  window.FHEIntro = intro;

  /* ---------------------------------------------------------------- 2. Header */
  function header() {
    const brand = document.querySelector('.brand');
    const mark = brand && brand.querySelector('.fhs-mark');
    if (!mark || reduced) return;
    const swing = () => mark.classList.add('is-swinging');
    brand.addEventListener('pointerenter', swing);
    brand.addEventListener('focus', swing);
    mark.addEventListener('animationend', (e) => { if (e.animationName === 'fhmSwing') mark.classList.remove('is-swinging'); });
    // the intro lands the mark in the slot: let it settle on its ropes
    document.addEventListener('fhe:mark-docked', () => setTimeout(swing, 80), { once: true });
  }

  /* ---------------------------------------------------------------- 3. Seal */
  function seal(root) {
    const host = root.querySelector('[data-seal-mark]');
    const tilt = root.querySelector('[data-seal-tilt]');
    const source = document.querySelector('.brand .fhs-mark');
    if (!host || !tilt || !source) return;
    const svg = source.cloneNode(true);
    svg.classList.remove('is-swinging');
    svg.classList.add('fhs-mark--seal');
    host.appendChild(svg);
    const m = dress(svg, 'fhms');
    const ropes = Array.from(m.rig.querySelectorAll('.fhm-rope'));
    const hook = Array.from(m.rig.querySelectorAll('path:not(.fhm-rope)'));
    const fit = () => strokePx(svg, 1.7);
    fit();
    addEventListener('resize', fit, { passive: true });
    root.classList.add('is-live');

    const draw = (els, q) => els.forEach((el) => {
      el.style.strokeDashoffset = (1 - q).toFixed(4);
      el.style.visibility = q > 0 ? '' : 'hidden';
    });
    let drawn = -1;
    function drawTo(p) {
      if (Math.abs(p - drawn) < 0.0005) return;
      drawn = p;
      draw([m.ring], inOutSine(seg(p, 0, 0.42)));
      draw(ropes, inOutSine(seg(p, 0.14, 0.46)));
      draw(hook, inOutSine(seg(p, 0.3, 0.62)));
      m.glyphs.forEach((g, i) => draw([g], inOutSine(seg(p, 0.36 + i * 0.05, 0.72 + i * 0.05))));
    }

    if (reduced) { drawTo(1); pourTo(m, 1, 0); return; }

    // progress: 0 as the seal's top meets the bottom of the screen, 1 as its centre reaches the middle — or, on screens
    // too tall to scroll that far (iPad portrait, 1200px desktops), as the page reaches its foot, so the pour always finishes
    const progress = () => {
      const r = root.getBoundingClientRect();
      const left = Math.max(0, document.documentElement.scrollHeight - innerHeight - scrollY);   // scroll still available
      const span = Math.min(innerHeight * 0.5 + r.height / 2, innerHeight - r.top + left);
      return span > 0 ? clamp((innerHeight - r.top) / span) : 1;
    };
    // Each frame writes only what moved, so a settled seal costs nothing but the frame callback.
    // The drawing chases the scroll position at most ~0.55 progress/s, then settles with a 0.55 s time constant, so a fast
    // flick still draws the ring over ~0.8 s and pours over ~1.3 s; scrolling back up follows freely.
    let raf = 0, last = 0, lastY = scrollY, ang = 0, vel = 0, shineAt = -1, poured = false, pourWas = -1, glinting = false, still = true;
    let eased = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const target = progress();
      const ahead = target - eased;
      eased += (ahead > 0 ? Math.min(ahead, 0.3) : ahead) * (1 - Math.exp(-dt / 0.55));
      if (Math.abs(target - eased) < 0.0005) eased = target;
      const p = eased;
      drawTo(p);
      const pp = inOutSine(seg(p, 0.7, 0.97));
      if (pp > 0 && pp < 1 || pp !== pourWas) pourTo(m, pp, now * 0.004);   // the surface ripples while it pours
      pourWas = pp;
      if (pp >= 1 && !poured) { poured = true; shineAt = now; }
      if (pp < 1) poured = false;
      const g = shineAt < 0 ? -1 : seg(now - shineAt, 0, 1500);
      if (g > 0 && g < 1 || glinting) { glintAt(m, g); glinting = g > 0 && g < 1; }

      // the hook lags behind the page: scroll speed leans it, a damped spring brings it home
      const v = dt ? (scrollY - lastY) / dt : 0;
      lastY = scrollY;
      const lean = clamp(-v * 0.011, -13, 13);
      vel += ((lean - ang) * 70 - vel * 6) * dt;
      ang += vel * dt;
      const settled = Math.abs(ang) < 0.005 && Math.abs(vel) < 0.005;
      if (settled) { ang = vel = 0; }
      if (!settled || !still) m.rig.setAttribute('transform', `rotate(${ang.toFixed(3)} 0 ${PIVOT})`);
      still = settled;
    }
    new IntersectionObserver(([en]) => {
      // the loop sleeps out of view, so on return start from where the page really is (never from a stale, fuller drawing)
      if (en.isIntersecting && !raf) { last = 0; lastY = scrollY; eased = Math.min(eased, progress()); raf = requestAnimationFrame(frame); }
      else if (!en.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { rootMargin: '15% 0px' }).observe(root);

    // tilt toward the pointer, with a highlight that follows it; entering replays the glint
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      root.addEventListener('pointermove', (e) => {
        const r = tilt.getBoundingClientRect();
        const nx = clamp((e.clientX - r.left) / r.width, 0, 1) * 2 - 1;
        const ny = clamp((e.clientY - r.top) / r.height, 0, 1) * 2 - 1;
        tilt.style.setProperty('--rx', `${(-ny * 9).toFixed(2)}deg`);
        tilt.style.setProperty('--ry', `${(nx * 11).toFixed(2)}deg`);
        tilt.style.setProperty('--mx', `${((nx + 1) * 50).toFixed(1)}%`);
        tilt.style.setProperty('--my', `${((ny + 1) * 50).toFixed(1)}%`);
      });
      root.addEventListener('pointerenter', () => {
        root.classList.add('is-hover');
        if (poured) shineAt = performance.now();
      });
      root.addEventListener('pointerleave', () => {
        root.classList.remove('is-hover');
        ['--rx', '--ry'].forEach((v) => tilt.style.setProperty(v, '0deg'));
      });
    }
  }

  const init = () => {
    header();
    document.querySelectorAll('[data-seal]').forEach(seal);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
