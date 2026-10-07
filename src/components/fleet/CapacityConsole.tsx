/* The capacity console: every crane on the books plotted by rated capacity on the same log scale as the rest of the
 * site (25 → 700 t), one block per unit, so the fleet reads as a skyline. Drag the load (or tap a column) and the cranes
 * rated for it light up, the readout counts them, and the brief button carries the size into Contact us.
 *
 * A Preact island (React API, ~4 KB runtime), server-rendered at build and hydrated as it nears the viewport. */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { BANDS, RATED, UNPLOTTED, type Rated } from '../../data/fleet';

const MIN = 25;
const MAX = 700;
const LN = Math.log(MAX / MIN);
/** the stops the load snaps to; the Contact us dial uses the same list */
export const SIZES = [25, 30, 35, 40, 50, 55, 60, 70, 75, 80, 90, 100, 110, 120, 130, 135, 150, 160, 200, 220, 250, 260, 300, 320, 350, 400, 450, 500, 700];
const START = 200;

const W = 1000;
const PAD = 16;
const BASE = 196;
const STEP = 15;
const BLOCK = 12;
const COL = 9;

const pos = (t: number) => Math.log(t / MIN) / LN;
const xOf = (t: number) => PAD + pos(t) * (W - PAD * 2);
const toT = (v: number) => {
  const t = MIN * Math.pow(MAX / MIN, v / 1000);
  return SIZES.reduce((a, b) => (Math.abs(Math.log(b / t)) < Math.abs(Math.log(a / t)) ? b : a));
};
const toV = (t: number) => Math.round(pos(t) * 1000);
const label = (r: Rated) => (r.make ? `${r.make} ${r.model}` : r.model);
const TICKS = [25, 50, 100, 200, 300, 500, 700];

// the cranes on the books that are not on the chart, said once in plain words under it
const notPlotted = (() => {
  const name = (f: (typeof UNPLOTTED)[number]['f'], m: string) => (f.id === 'sany-zoomlion-crawler' || f.id === 'hitachi-sumitomo' ? m : `${f.make} ${m}`);
  const small = UNPLOTTED.filter(({ u }) => typeof u.t === 'number').map(({ f, u }) => `the ${name(f, u.model)}, a ${u.t}-tonne compact crane`);
  const named = UNPLOTTED.filter(({ u }) => typeof u.t !== 'number' && u.model !== 'Other model').map(({ f, u }) => `${name(f, u.model)}${u.n > 1 ? ` ×${u.n}` : ''}`);
  const others = UNPLOTTED.filter(({ u }) => u.model === 'Other model').reduce((s, { u }) => s + u.n, 0);
  if (others) named.push(`${others} more ${others === 1 ? 'unit' : 'units'} listed without a model`);
  const parts = [...small, named.length ? `${named.join(', ')}, whose duties we give on request` : ''].filter(Boolean);
  return parts.length ? `Not plotted: ${parts.join('; ')}.` : '';
})();

type Filter = 'all' | 'mobile' | 'crawler';
const FILTERS: [Filter, string][] = [['all', 'All cranes'], ['mobile', 'Mobile'], ['crawler', 'Crawler']];

function useTween(target: number, ms = 520) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { cur.current = target; setV(target); return; }
    const from = cur.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      cur.current = from + (target - from) * (1 - Math.pow(1 - p, 3));
      setV(cur.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return Math.round(v);
}

export default function CapacityConsole() {
  const [v, setV] = useState(toV(START));
  const [filter, setFilter] = useState<Filter>('all');
  const [hover, setHover] = useState<number | null>(null);
  const [live, setLive] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const chart = useRef<SVGSVGElement>(null);
  const t = toT(v);

  const units = useMemo(() => RATED.filter((r) => filter === 'all' || r.cls === filter), [filter]);
  const columns = useMemo(() => {
    const by = new Map<number, Rated[]>();
    units.forEach((r) => by.set(r.t, [...(by.get(r.t) || []), r]));
    return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([cap, rs]) => ({ cap, rs, n: rs.reduce((s, r) => s + r.n, 0) }));
  }, [units]);
  const lit = units.filter((r) => r.t >= t);
  const count = lit.reduce((s, r) => s + r.n, 0);
  const shown = useTween(count);
  const total = units.reduce((s, r) => s + r.n, 0);
  const band = BANDS.find(([max]) => t <= max)!;
  const lightest = lit[lit.length - 1];
  const heaviest = lit[0];

  // the skyline rises as it scrolls in
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { setLive(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // pointer over the chart: the nearest column within reach
  const near = (e: PointerEvent) => {
    const svg = chart.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best: number | null = null;
    let d = 18;
    columns.forEach((c) => { const dx = Math.abs(xOf(c.cap) - x); if (dx < d) { d = dx; best = c.cap; } });
    return best;
  };
  const hovered = hover === null ? null : columns.find((c) => c.cap === hover) || null;

  return (
    <div ref={root} class={`cc${live ? ' is-in' : ''}`}>
      <div class="cc__head">
        <div class="cc__readout">
          <p class="cc__k">Load to lift</p>
          <p class="cc__t"><span>{t}</span><small>T</small></p>
          <p class="cc__count" aria-hidden="true"><b>{shown}</b> of {total} cranes rated {t} T or more</p>
          <p class="sr-only" aria-live="polite">{count} of {total} cranes are rated {t} tonnes or more.</p>
          {heaviest && lightest && (
            <p class="cc__span">{lightest === heaviest ? label(heaviest) : <>From {label(lightest)} <i aria-hidden="true">→</i><span class="sr-only"> to </span> {label(heaviest)}</>}</p>
          )}
          <p class="cc__band">{band[1] ? `${band[1]}. ` : ''}Typical work: {band[2].charAt(0).toLowerCase() + band[2].slice(1)}.</p>
        </div>
        <div class="cc__tools">
          <div class="cc__filters" role="group" aria-label="Show cranes">
            {FILTERS.map(([id, name]) => (
              <button type="button" class="cc__filter" aria-pressed={filter === id} onClick={() => setFilter(id)}>{name}</button>
            ))}
          </div>
          <p class="cc__legend" aria-hidden="true"><span class="cc__key cc__key--mobile"></span>Mobile <span class="cc__key cc__key--crawler"></span>Crawler <span>· One block per unit</span></p>
        </div>
      </div>

      <div class="cc__plot">
        <svg
          ref={chart}
          class="cc__chart"
          viewBox={`0 0 ${W} ${BASE + 4}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${total} cranes plotted by rated capacity from 25 to 700 tonnes; ${count} are rated ${t} tonnes or more.`}
          onPointerMove={(e) => setHover(near(e as unknown as PointerEvent))}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => { const c = near(e as unknown as PointerEvent); if (c) setV(toV(c)); }}
        >
          {TICKS.map((k) => <line class="cc__grid" x1={xOf(k)} x2={xOf(k)} y1={8} y2={BASE} />)}
          {columns.map((c) => {
            let k = 0;
            return (
              <g class={`cc__col${c.cap >= t ? ' is-lit' : ''}${hover === c.cap ? ' is-hover' : ''}`} style={`--x:${pos(c.cap).toFixed(3)}`}>
                <rect class="cc__hit" x={xOf(c.cap) - 11} y={0} width={22} height={BASE} />
                {c.rs.flatMap((r) => Array.from({ length: r.n }, () => {
                  const y = BASE - (++k) * STEP + (STEP - BLOCK);
                  return <rect class={`cc__u cc__u--${r.cls}`} x={xOf(c.cap) - COL / 2} y={y} width={COL} height={BLOCK} />;
                }))}
              </g>
            );
          })}
          <line class="cc__base" x1={0} x2={W} y1={BASE + 0.5} y2={BASE + 0.5} />
          <g class="cc__load" style={`transform: translateX(${xOf(t).toFixed(1)}px)`}>
            <line x1={0} x2={0} y1={0} y2={BASE} />
          </g>
        </svg>
        {hovered && (
          <div class="cc__tip" style={`--x:${pos(hovered.cap).toFixed(3)};--ax:${pos(hovered.cap) < 0.18 ? 0 : pos(hovered.cap) > 0.82 ? 1 : 0.5}`} aria-hidden="true">
            <p class="cc__tip-t">{hovered.cap} T <span>{hovered.n} {hovered.n === 1 ? 'unit' : 'units'}</span></p>
            <p class="cc__tip-m">{hovered.rs.map((r) => `${label(r)}${r.n > 1 ? ` ×${r.n}` : ''}`).join(' · ')}</p>
          </div>
        )}
        <div class="cc__dial">
          <input
            class="cc__range"
            type="range"
            min={0}
            max={1000}
            step={1}
            value={v}
            style={`--v:${(v / 1000).toFixed(4)}`}
            aria-label="Load to lift, in tonnes"
            aria-valuetext={`${t} tonnes`}
            onInput={(e) => {
              // snap to the detents: the thumb, the marker and the readout move together
              const el = e.currentTarget as HTMLInputElement;
              const nv = toV(toT(+el.value));
              el.value = String(nv);
              setV(nv);
            }}
          />
          <ol class="cc__ticks" aria-hidden="true">
            {TICKS.map((k) => <li style={`--x:${pos(k).toFixed(3)}`}>{k}<small>T</small></li>)}
          </ol>
        </div>
      </div>

      <ul class="cc__list" aria-label={`Cranes rated ${t} tonnes or more`}>
        {lit.map((r) => (
          <li key={`${r.make}|${r.model}`} class={`cc__chip cc__chip--${r.cls}`}>
            <span class="cc__chip-m">{label(r)}{r.n > 1 && <b> ×{r.n}</b>}</span>
            <span class="cc__chip-t">{r.t} T</span>
          </li>
        ))}
      </ul>

      <div class="cc__foot">
        <a class="btn btn--solid" href="#contact" data-enquire="" data-cap={String(t)}>
          Brief us on a {t} T lift
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </a>
        <p class="cc__note">
          Rated capacity is the maker's maximum, at minimum radius. Your load, radius and rigging decide the crane we send:
          our engineers size it with you, free of charge.
          {notPlotted && <> {notPlotted}</>}
        </p>
      </div>
    </div>
  );
}
