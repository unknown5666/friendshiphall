# Friendship Hall (FHE): website

The live site for Friendship Hall Sole Proprietorship L.L.C (fhscrane.com), in the client-confirmed **Cinematic Editorial** design: obsidian #0B0C10, zinc #1F2833, brushed gold #C5A059, Bodoni Moda headlines over Instrument Sans, an asymmetric layout, film grain and a gold glint on the italics. On a first visit it opens with a short **mark intro**, it closes with the **seal**, and its **Contact us** button opens the lift slate.

It's built with [Astro](https://astro.build): components at build time, plain HTML and CSS in the browser. The one interactive widget that needs state, the fleet's **capacity console**, is a Preact island (React's API on a 4 KB runtime) that loads as it scrolls near. Everything else is a few small scripts.

## Develop
Needs Node 22.12 or later. (On the Mac this was built on, Node lives in `~/.local/node/bin`; add it to `PATH`.)
```bash
npm ci
npm run dev        # http://localhost:4321, live reload
npm run build      # the site, in dist/
npm run preview    # serve dist/ locally
```

## Deploy
**Hostinger (fhscrane.com).** Push to `main`. The GitHub Action in `.github/workflows/deploy.yml` builds the site and commits the result to the `deploy` branch, which Hostinger serves (hPanel → Websites → fhscrane.com → Advanced → Git: repository `unknown5666/friendshiphall`, branch **`deploy`**, auto-deployment on). The `deploy` branch only ever holds built files; never edit it by hand. `public/.htaccess` (copied into the build) sets the cache, compression and security headers there.

**Vercel (friendshiphall.vercel.app).** Builds `main` itself; `vercel.json` sets the build command, `dist/` as output, and the same headers.

## Speed
Lighthouse 13, run locally on the production build (mobile = simulated Moto G Power on slow 4G, first visit, so the intro plays):

| | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Mobile | 98 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

What keeps it there, so it stays there:
- **One request to first paint.** All CSS is inlined into the HTML (`build.inlineStylesheets: 'always'`); the hero photo and the two upright fonts are preloaded; the hero is AVIF (WebP fallback).
- **No layout jumps when fonts load.** The fallback fonts in `Base.astro` are metric-matched to Bodoni Moda and Instrument Sans (`size-adjust` and overrides computed from the woff2 files).
- **The browser skips what's off screen.** Every chapter below the hero has `content-visibility: auto`.
- **Little JS, none of it blocking.** About 14 KB (gzipped) for the page, deferred. Anything that builds DOM or reads layout (the hook, the rail, the seal, the Contact us dialog) sets itself up in an idle moment after load. The console island (≈ 10 KB with Preact) loads only as the fleet chapter nears.
- **Animations on the compositor.** Scroll effects are CSS scroll-driven animations (`animation-timeline`) of `transform`, `clip-path` and `opacity`; nothing animates `filter`, `box-shadow` or layout. There is no scroll-jacking library: scrolling is native.
- **CSS is minified with esbuild, not Lightning CSS** (`astro.config.mjs`). Lightning CSS folds `animation-timeline` into the `animation` shorthand, where browsers reject it, and every scroll-driven effect silently disappears. Don't switch it back.

## Structure
```
src/pages/index.astro            the page: the chapters in order
src/layouts/Base.astro           <head>: meta, preloads, fonts, the first-visit intro gate; the page script
src/components/                  one component per chapter (Hero, Prologue, Film, Services, Panorama, Works,
                                 Industries, Safety, Contact, Footer), plus Header, Intro, Brief (Contact us),
                                 WhatsApp, Mark (the FHS mark), Photo (responsive images), Drawing (line drawings)
src/components/fleet/            Chapter III: Fleet.astro, Odometer.astro, CapacityConsole.tsx (Preact island)
src/data/fleet.ts                the fleet register: every heavy unit, by family and class, with rated capacities
src/data/media.ts                finds each photo's widths in public/assets/media at build time
src/styles/                      site.css (the design), fleet.css (Chapter III), overlays.css (hook + WhatsApp)
src/scripts/                     mark.js (intro, header swing, seal), core.js (shared behaviour), site.js (rail,
                                 lit prologue, Contact us), fleet.js (drums, the stage)
public/assets/                   photos (WebP 480–1920; the hero also AVIF), fleet model photos, video, fonts, brand
public/.htaccess                 Hostinger headers
brand-source/                    the client's DWG and the script that builds the mark from it (not deployed)
```

## Core behaviour (`src/scripts/core.js`)
- **Intro gate.** The head script in `Base.astro` plays the mark intro on the **first visit only** (localStorage `fhe:intro`), never on Back/Forward or with reduced motion. The page under it is already painted. If the page script never runs, the curtain lifts itself after 4.5 s.
- **In-page links** scroll with `history.replaceState`, so they never add history entries. The mobile menu is a button, not a hash link.
- **Lazy time-lapse.** The `<video>` gets its source only when it nears the viewport and pauses when off-screen.
- Reveal-on-scroll, count-up numbers, a live Asia/Dubai clock and a scrolled-header flag.
- **Crane hook.** A twin-sheave block with a ramshorn double hook hangs in the right margin on four falls of wire rope and is lowered as you scroll: a spring gives it weight, scroll speed swings it like a pendulum, the rope lay and the sheave knurl run as it pays out. At the foot of the page it rests above the WhatsApp button. With reduced motion it simply follows the page.
- **Floating WhatsApp.** One button opens a chooser with two lines (Bashir, COO, +971 52 902 6103 and Saeed, CEO, +971 52 833 5333), each with an enquiry pre-filled. Native `popover`, with a scripted fallback. The button blinks green.

## The mark
The logo comes from the client's AutoCAD file, `brand-source/logo_fhe.dwg`. `brand-source/build-mark.mjs` reads it and writes `public/assets/brand/fhs-mark.svg` (brand red) and `fhs-mark.inline.svg` (currentColor); the same paths are in `src/components/Mark.astro`. The drawing's circle is mapped to r = 500 at the origin, and every line, arc and pin comes straight from the DWG; the lettering (a font reference in the DWG) comes from the earlier vector export `fhs-emblem.svg`, checked against the DWG. To rebuild: `npm i --no-save @mlightcad/libredwg-web && node brand-source/build-mark.mjs`.

`src/scripts/mark.js` animates it. The header copy is the source; the intro and the seal clone it.
- **Intro** (about 1.6 s, first visit). A welding spark draws the ring while a load dial ticks round and the readout counts 25 → 700 T; the rope and hook drop in and swing; three weld heads trace F, H and S; molten gold pours into the letters; the mark locks with a punch and a spray of sparks; the ring opens as an iris onto the hero while the mark flies into the header. A tap, key or scroll jumps to the lock.
- **Header.** Hovering or focusing the brand swings the hook on its ropes.
- **Seal** (top of the footer). A large mark draws itself as it scrolls in, then pours; it tilts toward the pointer and scroll speed swings the hook. It is built only as the footer comes within a few screens.

## Chapter III: the fleet
Built from the client's vehicle register (FHE-BBH and FHE-DXB, September 2026): **158 heavy units** in 21 families: 64 mobile cranes, 14 crawler cranes, 33 prime movers (rows the register calls "Tractor" or "Locomotive" are truck heads), 36 trailers and 11 forklifts and loaders. Passenger and light vehicles are left out on purpose; plates and chassis numbers are never shown. Everything comes from `src/data/fleet.ts`: edit a family's units there and the totals, ledgers and console all follow.

1. **Overture.** The yard photo opens from a letterbox slit to full frame as you scroll (pinned, CSS scroll-driven), over the total on rolling drums and the five class counts (each a link to its class).
2. **Line-up.** One chapter per class with a ledger of every make and model and its share of the class drawn in gold. From 1100 px a pinned stage beside the chapters changes photograph with the class (a wipe in the direction of travel), rolls its count, and shows each make's photo or line drawing under the pointer.
3. **Capacity console** (`CapacityConsole.tsx`). Every crane with a known rated capacity, one block per unit, on the site's 25–700 t log scale. Drag the load (it snaps to common sizes) or tap a column: the cranes rated for it light up, the readout counts them and names the range, and **Brief us on a … T lift** opens Contact us with that size set. Rated capacity is the maker's maximum at minimum radius, and the note under the chart says so.
4. Makers marquee, support equipment and operators, and the photo credits.

Rated capacities come from the model designations (LTM 1500 = 500 t, AC 700 = 700 t, QY 50K = 50 t …). The others were checked against maker data: Terex Explorer 5800 220 t, Hitachi KH 300 80 t, Sumitomo LS-248RH 150 t, XCMG XGC 150 150 t, Sany SCC 3200A 320 t, Sany SCC 600A 60 t, Kobelco CKE 1350 135 t. The Kobelco RK 70M is a **7 t compact** rough-terrain crane, so it is listed but not plotted.

**Photos.** Demag, Terex, flatbed and lowbed families and the mobile, crawler and trailer classes use FHE's own photos ("FHE fleet"). The others are model photos of the same makes and models from Wikimedia Commons (`public/assets/media/fleet/`, WebP), with author, licence and source in `credits.json`, which the "Photo credits" list under the chapter is built from. Several are CC BY or CC BY-SA, so **keep that list on the page** while they're used. Sany HQC, Kobelco RK and the Sany/Zoomlion crawlers have gold line drawings instead.

## Contact us
Every **Contact us** button opens a full-screen brief: pick a service, set the crane size on a 25–700 T dial (the same stops as the capacity console), add the emirate, start date, notes and details, and a film-slate panel fills in as you type. **Send on WhatsApp** opens a chat with Sales (+971 52 902 6105); **Send by email** opens the visitor's mail app addressed to fhcrane@gmail.com. Nothing is stored or sent by the site, so there is no server or form backend. A link with `data-cap="220"` opens it with that size set. Without JavaScript the buttons fall back to the contact chapter.

## Assets: where everything came from
The original photos are in `C:/Users/user/Downloads/FHE Assets/` (2–23 MB phone images), resized to WebP with descriptive names in `public/assets/media/`; `manifest.json` there maps every file back to its original with capture date, aspect ratio, alt text and intended use. The time-lapse was rendered from 30 dated photos in capture order (2017-12-19 to 2020-11-29); `crane-timelapse.cues.json` lists when each appears.

## To finalise with the client
- **Fleet capacities.** Not on the capacity chart until confirmed: Terex A600 ×2, Kobelco "600 series" ×3, Zoomlion ZCC 300V, and one Kobelco crawler and one Sany crane the register lists without a model. Add a `t` to each in `src/data/fleet.ts` once known.
- **Fleet register.** Four rows say "Nissan H?" but share the Sany HQC chassis series, so they're counted as Sany HQC (8 in all). The "Skania? 300T" crane has a Sany chassis prefix and is shown as "Sany 300 T".
- **Leadership portraits.** Haji Saleem (Chairman), Saeed (CEO), Darwaish (Managing Director) and Bashir (COO) have placeholder images in `public/assets/team/` (not currently shown).
- **Certificates** shown: ISO 9001:2015 (SD-26048/01, valid to 25 Mar 2027), ISO 45001:2018 (valid to 30 Nov 2028) and ICV no. 150476, 47.14%. **The ICV certificate expires 03 Nov 2026**, so update it when it's renewed.
- **WhatsApp numbers** are from fhecrane.com: Admin +971 52 902 6102, Sales +971 52 902 6105. The floating button uses Bashir (+971 52 902 6103) and Saeed (+971 52 833 5333).
