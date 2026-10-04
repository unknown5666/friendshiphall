# Friendship Hall (FHE): homepage concepts

This folder holds three complete, mobile-first homepage concepts for Friendship Hall Sole Proprietorship L.L.C (fhecrane.com). They're plain static HTML and CSS with a little vanilla JS, and there's no build step.

| Page | What it is |
|------|------------|
| `index.html` | The hub. Click **1**, **2** or **3** (or press the number key) to open a concept. The browser Back button returns here. |
| `concept-1.html` | **Industrial Brutalism.** Charcoal #1A1A1A, white, safety amber #FFB000. Block type, bento grids, hard borders. |
| `concept-2.html` | **Cinematic Editorial.** Obsidian #0B0C10, zinc #1F2833, brushed gold #C5A059. Serif headlines, asymmetric layout, film grain and a gold glint on the italics. Its **Contact us** button opens the lift slate (see below). |
| `concept-3.html` | **Data-Dense Telemetry.** Navy #0A192F, steel #172A45, cyan #64FFDA. Metric modules and an interactive 25–700T capacity scale. |

The earlier "FHE // Telemetry" pitch is archived, unchanged, in `_archive/telemetry-pitch/`. It still opens on its own.

## Preview locally
```bash
npx -y serve -l 5173 .
```
Then open http://localhost:5173. Use a server rather than double-clicking the files: the video needs HTTP range requests to seek and loop correctly.

## Deploy
Run `vercel deploy --prod`. `vercel.json` turns on clean URLs (`/concept-1`) and sets cache headers.

## Structure
```
index.html                 hub (1 · 2 · 3)
concept-{1,2,3}.html       the three concepts
css/concept-{1,2,3}.css    one stylesheet per concept (each ends with its crane-hook + WhatsApp theme)
css/fhe-overlays.css       shared crane hook + floating WhatsApp, linked before each concept stylesheet
js/fhe-core.js             shared behaviour (see below)
js/concept-{n}.js          concept-specific interactions
assets/media/              optimised photos (WebP 640/960/1280/1920 + one 1280 JPG each) + manifest.json
assets/fonts/              self-hosted Google Fonts (latin woff2); @font-face is inlined in each page's <head>
assets/team/               leadership portraits (800×1000)
assets/video/              crane-timelapse.mp4 (28.6 s, 720p), posters, cues JSON
assets/brand/              FHS emblem SVG (standalone red + inline currentColor version)
```

## Shared behaviour (`js/fhe-core.js`)
- **Hook preloader (`@keyframes hookDropAndLift`).** The FHS emblem, whose "H" holds a crane hook block, drops on a cable, catches with a bounce, holds, then lifts and docks into the header logo slot. The script measures the slot and passes the offset to the CSS as `--dock-x`, `--dock-y` and `--dock-scale`. Tap or Escape skips it. It doesn't run for reduced-motion users or on Back/Forward navigation.
- **Back button.** In-page menu links scroll with `history.replaceState`, so they never add history entries. Back always returns to the previous page. The "All concepts" link calls `history.back()` when you arrived from the hub. The mobile menus are buttons, not hash links.
- **Lazy time-lapse.** The `<video>` gets its source only when it nears the viewport (IntersectionObserver), and it pauses when off-screen.
- Reveal-on-scroll, count-up numbers, a live Asia/Dubai clock and a scrolled-header flag.
- **Crane hook.** A twin-sheave block with a ramshorn double hook hangs in the right margin on four falls of wire rope and is lowered as you scroll. A spring gives it weight and a little bounce, scroll speed swings it like a pendulum (slower as the cable gets longer) and the hook trails on its swivel, while the rope lay and the knurl on the sheave rims run as the rope visibly pays out. Each concept recolours the block, its hazard band and the rim light in the hook's throats. At the foot of the page it rests just above the WhatsApp button and shows the "WhatsApp us" label. JS builds it, so the pages carry no markup for it. With reduced motion it simply follows the page.
- **Floating WhatsApp.** One button opens a chooser with two lines: Friendship Hall main line +971 52 833 5333 and Bashir (COO) +971 52 902 6103. Each opens WhatsApp with a short enquiry pre-filled. It uses the native `popover`, so tap-outside and Escape close it, and older browsers get a scripted fallback. It hides while the mobile menu is open and shows the label once, a third of the way down the page.

## Contact us (concept 2)
Every **Contact us** button in concept 2 (header, hero, mobile menu, contact chapter, and the "Discuss a lift" links under Industries) opens a full-screen brief. Visitors pick a service, set the crane size on a 25–700 T dial (same log scale as the fleet chapter), and add the emirate, start date, notes and their details. A film-slate panel fills in as they type. **Send on WhatsApp** opens a chat with Sales (+971 52 902 6105) and **Send by email** opens their mail app addressed to fhcrane@gmail.com. Either way the brief is written out for them, and the slate claps shut. Nothing is stored or sent by the site itself, so there's no server or form backend to run. Name and phone are required. The behaviour is in `js/concept-2.js` §3 and the styles are in `css/concept-2.css` §23. Without JavaScript the buttons fall back to the contact chapter.

## Assets: where everything came from
The original photos are in `C:/Users/user/Downloads/FHE Assets/` (2–23 MB phone images). Browsers can't load `C:/` paths from a web page, and those paths won't exist on a server. So each photo was resized to WebP, given a descriptive name and placed in `assets/media/`. `assets/media/manifest.json` maps every file back to its original and records its capture date, aspect ratio, alt text and intended use. For example:

- `lowbed-trailer` ← `20180410_183509.jpg` (yacht onto a lowbed, sunset)
- `rigging-team` ← `20201104_1738421.png` (crew in front of the Terex)
- `crawler-crane-coast` ← `banner.jpg`
- `tandem-bridge-panorama` ← `20201116_153907.jpg`

The time-lapse was rendered from the 30 dated photos in capture order, from 2017-12-19 to 2020-11-29. `crane-timelapse.cues.json` lists when each photo appears in the video.

There's no forklift photo in the asset folder, so forklifts are shown as typographic or blueprint spec blocks.

## To finalise with the client
- **Leadership portraits.** Haji Saleem (Chairman), Saeed (CEO), Darwaish (Managing Director) and Bashir (COO) have placeholder images. Replace `assets/team/{haji-saleem,saeed,darwaish,bashir}.webp` (and the `.jpg`) with 800×1000 photos under the same names.
- **Habib** uses the real on-site photo. His title is set to **"Site Operations"**. Please confirm it.
- **Certificates** shown: ISO 9001:2015 (SD-26048/01, valid to 25 Mar 2027), ISO 45001:2018 (valid to 30 Nov 2028) and ICV no. 150476, 47.14%. **The ICV certificate expires 03 Nov 2026**, so update it when it's renewed.
- **WhatsApp numbers** are from fhecrane.com: Admin +971 52 902 6102, Sales +971 52 902 6105. The floating button uses +971 52 833 5333 (labelled "Main line") and Bashir on +971 52 902 6103. Please confirm both labels.
