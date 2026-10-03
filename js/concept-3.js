/* Concept 3 — Data-Dense Telemetry. Vanilla JS, no dependencies. Loaded with `defer` after fhe-core.js.
 *
 *  1. Capacity scale   range input + tick buttons drive a procedural SVG blueprint of a mobile crane
 *  2. Time-lapse       timecode overlay, optional cue readout (assets/video/crane-timelapse.cues.json), scrubber
 *  3. Field log        sector filter (buttons + `hidden`, never hashes)
 *  4. Scroll-spy       marks the nav link of the section in view
 */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const pad2 = (n) => String(n).padStart(2, '0');
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ================================================================ 1. CAPACITY SCALE */

  /* One row per stop. `p` holds every number the drawing needs; the drawing is a schematic, not to scale,
     so none of these values is ever shown as a measurement. */
  const STOPS = [
    { t: 25,  cls: 'Entry class',        band: '25–60 T band',   apps: ['City picks', 'HVAC & signage', 'Plant maintenance'],
      p: { len: 150, ext: 24,  wr: 14, ch: 22, uH: 26, axles: 2, cwN: 1, cwW: 30, cwH: 10, boomL: 130, boomA: 68, jibL: 0,   secs: 3, loadW: 34, zoom: 1.5 } },
    { t: 50,  cls: 'Compact class',      band: '25–60 T band',   apps: ['City picks', 'HVAC & signage', 'Plant maintenance'],
      p: { len: 185, ext: 32,  wr: 15, ch: 25, uH: 30, axles: 3, cwN: 2, cwW: 38, cwH: 11, boomL: 165, boomA: 66, jibL: 0,   secs: 3, loadW: 42, zoom: 1.4 } },
    { t: 100, cls: 'Mid class',          band: '70–130 T band',  apps: ['Precast erection', 'Steel erection', 'Tower-crane assembly'],
      p: { len: 230, ext: 44,  wr: 16, ch: 28, uH: 36, axles: 4, cwN: 3, cwW: 50, cwH: 12, boomL: 215, boomA: 63, jibL: 0,   secs: 4, loadW: 54, zoom: 1.25 } },
    { t: 200, cls: 'Heavy class',        band: '150–300 T band', apps: ['Bridge girders', 'Heavy modules', 'Tandem lifts'],
      p: { len: 275, ext: 58,  wr: 17, ch: 31, uH: 42, axles: 5, cwN: 4, cwW: 62, cwH: 13, boomL: 265, boomA: 60, jibL: 0,   secs: 5, loadW: 68, zoom: 1.12 } },
    { t: 300, cls: 'Heavy class',        band: '150–300 T band', apps: ['Bridge girders', 'Heavy modules', 'Tandem lifts'],
      p: { len: 315, ext: 70,  wr: 18, ch: 34, uH: 48, axles: 6, cwN: 5, cwW: 72, cwH: 14, boomL: 295, boomA: 56, jibL: 55,  secs: 5, loadW: 80, zoom: 1.05 } },
    { t: 500, cls: 'Super-heavy class',  band: '400–500 T band', apps: ['Heavy industrial', 'Refinery & power', 'Superlift work'],
      p: { len: 360, ext: 86,  wr: 19, ch: 37, uH: 54, axles: 7, cwN: 6, cwW: 84, cwH: 15, boomL: 315, boomA: 53, jibL: 85,  secs: 6, loadW: 94, zoom: 1 } },
    { t: 700, cls: 'Flagship',           band: 'Flagship — 700 T', apps: ['Vessels', 'Heavy plant', 'Long-radius lifts'],
      p: { len: 400, ext: 100, wr: 20, ch: 40, uH: 60, axles: 8, cwN: 7, cwW: 96, cwH: 16, boomL: 330, boomA: 50, jibL: 100, secs: 6, loadW: 108, zoom: 1 } },
  ];

  const VB_W = 760;
  const VB_H = 540;
  const OX = 380; // world origin: carrier centre, on the ground line
  const OY = 450;

  const mk = (tag, parent, attrs) => {
    const e = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const r2 = (v) => String(Math.round(v * 100) / 100);
  const put = (e, attrs) => {
    for (const k in attrs) e.setAttribute(k, typeof attrs[k] === 'number' ? r2(attrs[k]) : attrs[k]);
  };
  const pts = (arr) => arr.map((v) => r2(v)).join(' ');

  /* Dimension line: witness lines, line, two arrowheads and a lettered tag. Arrowheads and tags are drawn at a
     constant on-screen size (scaled by k = viewBox units per CSS pixel) so they stay legible at any width. */
  function makeDim(parent, letter) {
    const g = mk('g', parent, { class: 'cr-dim' });
    const w1 = mk('line', g, { class: 'cr-wit' });
    const w2 = mk('line', g, { class: 'cr-wit' });
    const line = mk('line', g, { class: 'cr-dimline' });
    const a1 = mk('path', g, { class: 'cr-arrow', d: 'M0 0L-9 -3.4L-9 3.4Z' });
    const a2 = mk('path', g, { class: 'cr-arrow', d: 'M0 0L-9 -3.4L-9 3.4Z' });
    const tag = mk('g', g, { class: 'cr-tag' });
    mk('circle', tag, { r: 9 });
    const txt = mk('text', tag, { 'text-anchor': 'middle', dy: '.35em' });
    txt.textContent = letter;
    return {
      /* p1/p2: ends of the dimension line; f1/f2: the feature points the witness lines start from. */
      update(p1, p2, f1, f2, k, tagShift) {
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const angle = Math.atan2(uy, ux) * 180 / Math.PI;
        const inside = len > 30 * k;
        put(line, { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] });
        put(a1, { transform: `translate(${r2(p1[0])} ${r2(p1[1])}) rotate(${r2(inside ? angle + 180 : angle)}) scale(${r2(k)})` });
        put(a2, { transform: `translate(${r2(p2[0])} ${r2(p2[1])}) rotate(${r2(inside ? angle : angle + 180)}) scale(${r2(k)})` });
        [[w1, f1, p1], [w2, f2, p2]].forEach(([w, f, p]) => {
          const wx = p[0] - f[0];
          const wy = p[1] - f[1];
          const wl = Math.hypot(wx, wy) || 1;
          put(w, { x1: f[0], y1: f[1], x2: p[0] + (wx / wl) * 6 * k, y2: p[1] + (wy / wl) * 6 * k });
        });
        const mx = (p1[0] + p2[0]) / 2 + (tagShift ? tagShift[0] * k : 0);
        const my = (p1[1] + p2[1]) / 2 + (tagShift ? tagShift[1] * k : 0);
        put(tag, { transform: `translate(${r2(mx)} ${r2(my)}) scale(${r2(k)})` });
      },
    };
  }

  /* Builds every SVG primitive once; `render(params, k)` only rewrites attributes. */
  function buildCrane(svg) {
    const defs = mk('defs', svg);
    const hatch = mk('pattern', defs, { id: 'c3-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    mk('line', hatch, { x1: 0, y1: 0, x2: 0, y2: 6, class: 'cr-hatchline' });

    const world = mk('g', svg, { transform: `translate(${OX} ${OY})` });

    // ground
    mk('rect', world, { class: 'cr-groundfill', x: -OX * 2, y: 0, width: VB_W * 2, height: 16 });
    mk('line', world, { class: 'cr-ground', x1: -OX * 2, y1: 0, x2: OX * 2, y2: 0 });

    // outriggers (behind the carrier)
    const outr = [0, 1].map(() => ({
      beam: mk('rect', world, { class: 'cr-solid' }),
      jack: mk('rect', world, { class: 'cr-solid' }),
      pad: mk('rect', world, { class: 'cr-solid' }),
    }));

    // carrier
    const chassis = mk('rect', world, { class: 'cr-solid', rx: 3 });
    const cab = mk('polygon', world, { class: 'cr-solid' });
    const cabWin = mk('polygon', world, { class: 'cr-line cr-faint' });
    const wheels = Array.from({ length: 8 }, () => {
      const g = mk('g', world);
      return { g, tire: mk('circle', g, { class: 'cr-solid' }), rim: mk('circle', g, { class: 'cr-line' }), hub: mk('circle', g, { class: 'cr-line cr-faint' }) };
    });

    // superstructure
    const turn = mk('rect', world, { class: 'cr-solid' });
    const deck = mk('rect', world, { class: 'cr-solid', rx: 3 });
    const plates = Array.from({ length: 7 }, () => {
      const g = mk('g', world);
      return { g, r: mk('rect', g, { class: 'cr-solid cr-plate' }), h: mk('rect', g, { class: 'cr-hatch' }) };
    });
    const cyl = mk('line', world, { class: 'cr-cyl' });
    const cylIn = mk('line', world, { class: 'cr-cylin' });
    const cab2 = mk('polygon', world, { class: 'cr-solid' });
    const cab2Win = mk('polygon', world, { class: 'cr-line cr-faint' });

    // boom
    const boomG = mk('g', world);
    const secs = Array.from({ length: 6 }, () => mk('rect', boomG, { class: 'cr-solid' }));
    const head = mk('circle', boomG, { class: 'cr-solid' });
    const jibG = mk('g', world);
    const jib = mk('polygon', jibG, { class: 'cr-solid' });
    const jibSpine = mk('line', jibG, { class: 'cr-line cr-faint' });
    const foot = mk('circle', world, { class: 'cr-solid', r: 4.5 });

    // hoist, hook block, load
    const plumb = mk('line', world, { class: 'cr-plumb' });
    const mark = mk('path', world, { class: 'cr-line cr-faint' });
    const rope1 = mk('line', world, { class: 'cr-line' });
    const rope2 = mk('line', world, { class: 'cr-line' });
    const sling1 = mk('line', world, { class: 'cr-line cr-faint' });
    const sling2 = mk('line', world, { class: 'cr-line cr-faint' });
    const hookLine = mk('line', world, { class: 'cr-line' });
    const block = mk('rect', world, { class: 'cr-solid', rx: 2 });
    const sheave = mk('circle', world, { class: 'cr-line' });
    const load = mk('rect', world, { class: 'cr-solid', rx: 1 });
    const loadHatch = mk('rect', world, { class: 'cr-hatch' });

    // dimensions + load tag (constant on-screen size)
    const dimLayer = mk('g', world);
    const dims = { A: makeDim(dimLayer, 'A'), B: makeDim(dimLayer, 'B'), C: makeDim(dimLayer, 'C'), D: makeDim(dimLayer, 'D') };
    const loadTag = mk('g', dimLayer, { class: 'cr-loadtag' });
    const loadTxt = mk('text', loadTag, { 'text-anchor': 'middle', dy: '.35em' });

    function render(p, k0) {
      // The camera pulls back as the class grows: zoom crops the viewBox around the carrier, bottom-anchored.
      const k = k0 / p.zoom;
      const vbw = VB_W / p.zoom;
      const vbh = VB_H / p.zoom;
      const vbBottom = OY + 44 + 26 * k;
      svg.setAttribute('viewBox', `${r2(OX - vbw / 2)} ${r2(vbBottom - vbh)} ${r2(vbw)} ${r2(vbh)}`);

      const hl = p.len / 2;
      const ycb = -p.wr * 1.15;           // underside of chassis
      const yt = ycb - p.ch;              // top of chassis
      const deckTop = yt - p.uH;
      const uX0 = -0.40 * p.len;
      const uX1 = 0.16 * p.len;
      const px = uX0 + 0.45 * (uX1 - uX0); // boom foot
      const py = yt - 0.8 * p.uH;

      // outriggers
      const padW = 16 + p.wr;
      [-1, 1].forEach((s, i) => {
        const o = outr[i];
        const xe = s * (hl + p.ext);
        const x0 = s * (hl - 14);
        put(o.beam, { x: Math.min(x0, xe), y: ycb - 12, width: Math.abs(xe - x0), height: 10 });
        put(o.jack, { x: xe - 3.5, y: ycb - 2, width: 7, height: -8 - (ycb - 2) });
        put(o.pad, { x: xe - padW / 2, y: -8, width: padW, height: 8 });
      });

      // carrier
      put(chassis, { x: -hl, y: yt, width: p.len, height: p.ch });
      const cabW = 0.16 * p.len + 4;
      const cabH = p.ch * 0.85;
      put(cab, { points: pts([hl - cabW, ycb, hl - cabW, yt - cabH, hl - cabW * 0.2, yt - cabH, hl, yt - cabH * 0.15, hl, ycb]) });
      put(cabWin, { points: pts([hl - cabW + 4, yt - cabH + 4, hl - cabW * 0.2 - 2, yt - cabH + 4, hl - 5, yt - cabH * 0.35, hl - cabW + 4, yt - cabH * 0.35]) });
      const xf = hl - 0.10 * p.len;
      const xr = -hl + 0.12 * p.len;
      wheels.forEach((w, i) => {
        const f = p.axles > 1 ? Math.min(1, i / (p.axles - 1)) : 0;
        const x = lerp(xf, xr, f);
        put(w.g, { opacity: clamp(p.axles - i, 0, 1) });
        put(w.tire, { cx: x, cy: -p.wr, r: p.wr });
        put(w.rim, { cx: x, cy: -p.wr, r: p.wr * 0.52 });
        put(w.hub, { cx: x, cy: -p.wr, r: p.wr * 0.16 });
      });

      // superstructure
      put(turn, { x: uX0 * 0.92, y: yt - 3, width: (uX1 - uX0 * 0.92) * 0.96, height: 6 });
      put(deck, { x: uX0, y: deckTop, width: uX1 - uX0, height: p.uH });
      plates.forEach((pl, i) => {
        const attrs = { x: uX0 - p.cwW, y: yt - (i + 1) * p.cwH, width: p.cwW + 3, height: p.cwH };
        put(pl.r, attrs);
        put(pl.h, { x: attrs.x + 3, y: attrs.y + 2.5, width: attrs.width - 9, height: Math.max(0, attrs.height - 5) });
        put(pl.g, { opacity: clamp(p.cwN - i, 0, 1) });
      });

      // boom geometry
      const A = p.boomA * Math.PI / 180;
      const cosA = Math.cos(A);
      const sinA = Math.sin(A);
      const L = p.boomL;
      const w0 = 8 + 0.055 * L;
      const bx = px + L * cosA;
      const by = py - L * sinA;
      const Aj = (p.boomA - 24) * Math.PI / 180;
      const tipX = bx + p.jibL * Math.cos(Aj);
      const tipY = by - p.jibL * Math.sin(Aj);

      // luffing cylinder (drawn under the cab and boom)
      const cx0 = px + 8;
      const cy0 = yt - p.uH * 0.12;
      const cx1 = px + 0.30 * L * cosA + sinA * (w0 / 2);
      const cy1 = py - 0.30 * L * sinA + cosA * (w0 / 2);
      put(cyl, { x1: cx0, y1: cy0, x2: cx1, y2: cy1 });
      put(cylIn, { x1: cx0, y1: cy0, x2: lerp(cx0, cx1, 0.55), y2: lerp(cy0, cy1, 0.55) });

      // operator cab
      const cw2 = 0.10 * p.len + 8;
      const ch2 = p.uH * 0.62;
      put(cab2, { points: pts([uX1 - cw2, deckTop + 2, uX1 - cw2, deckTop - ch2, uX1 - 8, deckTop - ch2, uX1, deckTop - ch2 * 0.4, uX1, deckTop + 2]) });
      put(cab2Win, { points: pts([uX1 - cw2 + 4, deckTop - ch2 + 4, uX1 - 10, deckTop - ch2 + 4, uX1 - 4, deckTop - ch2 * 0.45, uX1 - cw2 + 4, deckTop - ch2 * 0.45]) });

      // boom sections (telescopic): each section is a rect in the boom's own frame
      put(boomG, { transform: `translate(${r2(px)} ${r2(py)}) rotate(${r2(-p.boomA)})` });
      secs.forEach((s, k2) => {
        const start = k2 === 0 ? 0 : L * (k2 / p.secs) * 0.88;
        const end = L * Math.min(1, (k2 + 1) / p.secs);
        const w = w0 * (1 - 0.13 * k2);
        put(s, { x: start, y: -w / 2, width: Math.max(0.5, end - start), height: w, opacity: clamp(p.secs - k2, 0, 1) });
      });
      put(head, { cx: L, cy: 0, r: Math.max(3, w0 * 0.34) });
      put(foot, { cx: px, cy: py });

      // luffing jib
      put(jibG, { transform: `translate(${r2(bx)} ${r2(by)}) rotate(${r2(-(p.boomA - 24))})`, opacity: clamp(p.jibL / 20, 0, 1) });
      put(jib, { points: pts([0, -4.5, p.jibL, -1.8, p.jibL, 1.8, 0, 4.5]) });
      put(jibSpine, { x1: 0, y1: 0, x2: p.jibL, y2: 0 });

      // hoist rope, hook block, slings, load
      const tipH = -tipY;
      const ylb = -0.48 * tipH;
      const lh = p.loadW * 0.6;
      const ylt = ylb - lh;
      const yh = ylt - p.loadW * 0.5;        // hook eye
      const yhb = yh - 20;                   // top of hook block
      put(rope1, { x1: tipX - 2.5, y1: tipY + 3, x2: tipX - 2.5, y2: yhb });
      put(rope2, { x1: tipX + 2.5, y1: tipY + 3, x2: tipX + 2.5, y2: yhb });
      put(block, { x: tipX - 7, y: yhb, width: 14, height: 20 });
      put(sheave, { cx: tipX, cy: yhb + 7, r: 3.4 });
      put(hookLine, { x1: tipX, y1: yhb + 20, x2: tipX, y2: yh });
      put(sling1, { x1: tipX, y1: yh, x2: tipX - p.loadW * 0.44, y2: ylt });
      put(sling2, { x1: tipX, y1: yh, x2: tipX + p.loadW * 0.44, y2: ylt });
      put(load, { x: tipX - p.loadW / 2, y: ylt, width: p.loadW, height: lh });
      put(loadHatch, { x: tipX - p.loadW / 2 + 3, y: ylt + 3, width: Math.max(0, p.loadW - 6), height: Math.max(0, lh - 6) });
      put(plumb, { x1: tipX, y1: ylb, x2: tipX, y2: 0 });
      put(mark, { d: `M${r2(tipX - 7)} 0L${r2(tipX + 7)} 0M${r2(tipX)} -7L${r2(tipX)} 7` });
      put(loadTag, { transform: `translate(${r2(tipX)} ${r2(ylb - lh / 2)}) scale(${r2(k)})` });
      loadTxt.textContent = `${Math.round(p.tons)} T`;

      // dimension lines
      const nx = -sinA;
      const ny = -cosA;
      const off = w0 / 2 + 24 * k;
      dims.A.update(
        [px + nx * off, py + ny * off], [bx + nx * off, by + ny * off],
        [px + nx * (w0 / 2 + 3 * k), py + ny * (w0 / 2 + 3 * k)], [bx + nx * (w0 * 0.3 + 3 * k), by + ny * (w0 * 0.3 + 3 * k)], k);
      const bxd = uX0 - p.cwW - 22 * k;
      const btop = yt - p.cwN * p.cwH;
      dims.B.update([bxd, btop], [bxd, yt], [uX0 - p.cwW, btop], [uX0 - p.cwW, yt], k, [-14, 0]);
      const cy = 16 + 16 * k;
      const sx = hl + p.ext;
      dims.C.update([-sx, cy], [sx, cy], [-sx, 6], [sx, 6], k);
      const dxp = Math.max(sx, tipX + p.loadW / 2) + 22 * k;
      dims.D.update([dxp, 0], [dxp, tipY], [dxp - 10 * k, 0], [tipX + 8, tipY], k);
    }

    return { render };
  }

  function initCapacity() {
    const root = $('[data-capacity]');
    if (!root) return;
    const svg = $('[data-crane]', root);
    const range = $('[data-cap-range]', root);
    if (!svg || !range) return;

    const ticks = $$('[data-stop]', root);
    const numEl = $('[data-cap-num]', root);
    const clsEl = $('[data-cap-class]', root);
    const bandEl = $('[data-cap-band]', root);
    const appsEl = $('[data-cap-apps]', root);
    const fillEl = $('[data-cap-fill]', root);
    const statusEl = $('[data-cap-status]', root);
    const ctaEl = $('[data-cap-cta]', root);
    const scaleEl = $('[data-cap-scale]', root);
    const ariaLabel = svg.getAttribute('data-label-base') || 'Schematic of a mobile crane';

    const crane = buildCrane(svg);
    const paramsFor = (i) => Object.assign({ tons: STOPS[i].t }, STOPS[i].p);
    let idx = clamp(parseInt(range.value, 10) || 0, 0, STOPS.length - 1);
    let cur = paramsFor(idx);
    let k = 1;
    let raf = 0;

    const measure = () => {
      const w = svg.getBoundingClientRect().width;
      k = w > 40 ? VB_W / w : 1;
    };
    const draw = () => crane.render(cur, k);

    function animateTo(i) {
      cancelAnimationFrame(raf);
      const target = paramsFor(i);
      if (reduced) {
        cur = target;
        draw();
        showNumber(cur.tons);
        return;
      }
      const from = Object.assign({}, cur);
      const dur = 700;
      const t0 = performance.now();
      const step = (now) => {
        const t = easeOut(clamp((now - t0) / dur, 0, 1));
        for (const key in target) cur[key] = lerp(from[key], target[key], t);
        draw();
        showNumber(cur.tons);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    function showNumber(v) {
      const n = Math.round(v);
      if (numEl) numEl.textContent = String(n);
      if (fillEl) fillEl.style.transform = `scaleX(${(clamp(v, 0, 700) / 700).toFixed(4)})`;
    }

    function setIndex(i, instant) {
      idx = clamp(i, 0, STOPS.length - 1);
      const s = STOPS[idx];
      range.value = String(idx);
      range.setAttribute('aria-valuetext', `${s.t} tonnes`);
      if (scaleEl) scaleEl.style.setProperty('--pf', (idx / (STOPS.length - 1)).toFixed(4));
      ticks.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.stop) === idx)));
      if (clsEl) clsEl.textContent = s.cls;
      if (bandEl) bandEl.textContent = s.band;
      if (appsEl) {
        appsEl.textContent = '';
        s.apps.forEach((a) => {
          const li = document.createElement('li');
          li.textContent = a;
          appsEl.appendChild(li);
        });
      }
      if (ctaEl) {
        ctaEl.href = `https://wa.me/971529026105?text=${encodeURIComponent(`Hello FHE, I would like to enquire about a ${s.t} T mobile crane.`)}`;
        ctaEl.textContent = `Ask Sales about ${s.t} T`;
      }
      if (statusEl) statusEl.textContent = `${s.t} tonne class selected. ${s.band}. Typical applications: ${s.apps.join(', ')}. Available with operator.`;
      svg.setAttribute('aria-label', `${ariaLabel} — ${s.t} tonne class`);
      if (instant) {
        cur = paramsFor(idx);
        draw();
        showNumber(cur.tons);
      } else {
        animateTo(idx);
      }
    }

    range.addEventListener('input', () => setIndex(parseInt(range.value, 10) || 0));
    ticks.forEach((b) => b.addEventListener('click', () => setIndex(Number(b.dataset.stop))));

    measure();
    setIndex(idx, true);
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { measure(); draw(); }).observe(svg);
    } else {
      addEventListener('resize', () => { measure(); draw(); }, { passive: true });
    }
  }

  /* ================================================================ 2. TIME-LAPSE MONITOR */

  function initTimelapse() {
    const wrap = $('[data-timelapse]');
    const video = wrap && $('video', wrap);
    if (!wrap || !video) return;
    const root = wrap.closest('[data-monitor]') || wrap;
    const tcEl = $('[data-tc]', root);
    const totalEl = $('[data-tc-total]', root);
    const cueEl = $('[data-cue]', root);
    const cueStaticEl = $('[data-cue-static]', root);
    const cueDateEl = $('[data-cue-date]', root);
    const cueLabelEl = $('[data-cue-label]', root);
    const scrub = $('[data-scrub]', root);
    const marks = $('[data-scrub-marks]', root);
    const FPS = 25;
    let cues = [];
    let raf = 0;
    let cuesRequested = false;

    const tc = (t) => {
      const s = Math.max(0, t || 0);
      return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(Math.floor(s % 60))}:${pad2(Math.floor((s % 1) * FPS))}`;
    };

    function showCue(t) {
      if (!cues.length || !cueEl) return;
      let c = null;
      for (let i = 0; i < cues.length; i++) { if (cues[i].t <= t + 0.04) c = cues[i]; else break; }
      if (!c) c = cues[0];
      if (cueDateEl) cueDateEl.textContent = c.date || '';
      if (cueLabelEl) cueLabelEl.textContent = c.label || '';
    }

    function paint() {
      const t = video.currentTime || 0;
      if (tcEl) tcEl.textContent = tc(t);
      if (scrub && !scrub.matches(':active')) scrub.value = String(Math.round(t * 100));
      if (scrub) scrub.setAttribute('aria-valuetext', tc(t));
      if (scrub) scrub.style.setProperty('--pf', video.duration ? (t / video.duration).toFixed(4) : '0');
      showCue(t);
    }

    const loop = () => {
      paint();
      raf = video.paused || video.ended ? 0 : requestAnimationFrame(loop);
    };
    video.addEventListener('play', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); });
    ['pause', 'seeked', 'timeupdate', 'ended'].forEach((ev) => video.addEventListener(ev, () => { if (!raf) paint(); }));

    function onMeta() {
      if (!video.duration || !isFinite(video.duration)) return;
      if (totalEl) totalEl.textContent = tc(video.duration);
      if (scrub) {
        scrub.max = String(Math.floor(video.duration * 100));
        scrub.disabled = false;
      }
      placeMarks();
    }
    video.addEventListener('loadedmetadata', onMeta);
    if (video.readyState >= 1) onMeta();

    if (scrub) {
      scrub.addEventListener('input', () => {
        video.currentTime = Number(scrub.value) / 100;
        paint();
      });
    }

    function placeMarks() {
      if (!marks || !cues.length || !video.duration) return;
      marks.textContent = '';
      cues.forEach((c) => {
        const s = document.createElement('span');
        s.style.left = `${clamp((c.t / video.duration) * 100, 0, 100).toFixed(2)}%`;
        marks.appendChild(s);
      });
    }

    // Cue file is optional: fetched once the video has data, failures are silent.
    function loadCues() {
      if (cuesRequested) return;
      cuesRequested = true;
      fetch('assets/video/crane-timelapse.cues.json', { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no cues'))))
        .then((data) => {
          if (!Array.isArray(data) || !data.length) return;
          cues = data.filter((c) => c && typeof c.t === 'number').sort((a, b) => a.t - b.t);
          if (!cues.length) return;
          if (cueEl) cueEl.hidden = false;
          if (cueStaticEl) cueStaticEl.hidden = true;
          placeMarks();
          paint();
        })
        .catch(() => {});
    }
    if (video.readyState >= 2) loadCues();
    else video.addEventListener('loadeddata', loadCues, { once: true });

    paint();
  }

  /* ================================================================ 3. FIELD LOG FILTER */

  function initLog() {
    const bar = $('[data-log-filter]');
    const table = $('[data-log]');
    if (!bar || !table) return;
    const buttons = $$('button[data-sector]', bar);
    const rows = $$('tbody tr', table);
    const status = $('[data-log-count]');
    function apply(sector) {
      let shown = 0;
      rows.forEach((tr) => {
        const on = sector === 'all' || tr.dataset.sector === sector;
        tr.hidden = !on;
        if (on) shown += 1;
      });
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sector === sector)));
      if (status) status.textContent = `SHOWING ${pad2(shown)} / ${pad2(rows.length)}`;
    }
    buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.sector)));
    apply('all');
  }

  /* ================================================================ 4. SCROLL-SPY */

  function initSpy() {
    const links = $$('#site-nav a[href^="#"]').filter((a) => a.getAttribute('href').length > 1);
    if (!links.length || !('IntersectionObserver' in window)) return;
    const map = new Map();
    links.forEach((a) => {
      const sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) map.set(sec, a);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        const a = map.get(en.target);
        if (a) a.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    map.forEach((_, sec) => io.observe(sec));
  }

  initCapacity();
  initTimelapse();
  initLog();
  initSpy();
})();
