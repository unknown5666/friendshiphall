# FHE // Telemetry — pitch site

Single-page pitch for Friendship Hall Crane Rental. Three clickable tier demos.

## Files
- `index.html` — the pitch itself (hero, positioning, three tiers, perf, timeline, footer)
- `tier-1.html` — Foundation & Fleet Command demo (fleet matrix, outrigger footprint, RFQ cart)
- `tier-2.html` — Engineering & Interactive demo (blueprint canvas, load-chart, case teardowns)
- `tier-3.html` — Enterprise Portal + M365 demo (portal shell, compliance hub, webhook, signature, Teams)
- `styles.css` — shared Telemetry design system (dark + light themes)
- `vercel.json` — deploy config
- `.claude/launch.json` — local preview server

## Local preview
```bash
npx -y serve -l 5173 .
```
Then open http://localhost:5173

## Deploy to Vercel
```bash
vercel deploy --prod
```
Static site — no build step. Vercel edge caches everything.

## Design system
- Fonts: Space Grotesk (display), Manrope (body), JetBrains Mono (data), Instrument Serif italic (accent)
- Palette: matte carbon (#09090b) + safety amber (#f59e0b); light mode swaps to warm paper + deeper amber
- Theme toggle: top-right, persists via localStorage

## Performance targets (guaranteed in the pitch)
- Lighthouse mobile ≥ 92 (goal 96)
- LCP < 1.2s on Dubai edge, Fast 3G throttled
- FID < 20ms
- CLS < 0.05

## What each tier demonstrates
| Tier | Signature interaction |
|------|-----------------------|
| 01 | Hover any 300T+ crane → outriggers deploy on the isometric chassis + seismic pulse + ground-bearing readout |
| 02 | Drag Load / Angle / Length sliders → boom rotates, cable tensions, hook drops, load chart marker tracks the envelope |
| 03 | Live dispatch log streams, fleet availability table, M365 migration checklist + email signature + Teams call cards |
