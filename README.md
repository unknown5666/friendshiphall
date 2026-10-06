# Friendship Hall (FHE): website

The live site for Friendship Hall Sole Proprietorship L.L.C (fhecrane.com), in the client-confirmed **Cinematic Editorial** design: obsidian #0B0C10, zinc #1F2833, brushed gold #C5A059, serif headlines, an asymmetric layout, film grain and a gold glint on the italics. It opens with the **mark intro** and closes with the **seal** (see below), and its **Contact us** button opens the lift slate. It's plain static HTML and CSS with a little vanilla JS, and there's no build step.

## Preview locally
```bash
npx -y serve -l 5173 .
```
Then open http://localhost:5173. Use a server rather than double-clicking the file: the video needs HTTP range requests to seek and loop correctly.

## Deploy
Vercel serves the folder as-is (`/` is `index.html`). Run `vercel deploy --prod`, or push to `main`. `vercel.json` turns on clean URLs and sets security and cache headers.

## Structure
```
index.html                 the site
css/site.css               the design (ends with its crane-hook + WhatsApp theme)
css/fhe-overlays.css       crane hook + floating WhatsApp structure, linked before site.css
js/fhe-core.js             generic behaviour (see below)
js/fhe-mark.js             logo animation: intro, header swing, footer seal (loaded before fhe-core.js)
js/site.js                 page-specific interactions (prologue, lift slate, …)
js/smooth.js               smooth wheel/trackpad scrolling (Lenis), paused while an overlay holds the page
js/vendor/lenis.min.js     Lenis 1.3.26, self-hosted
assets/media/              optimised photos (WebP 640/960/1280/1920 + one 1280 JPG each) + manifest.json
assets/fonts/              self-hosted Google Fonts (latin woff2); @font-face is inlined in the page's <head>
assets/team/               leadership portraits (800×1000), not currently shown
assets/video/              crane-timelapse.mp4 (28.6 s, 720p), posters, cues JSON
assets/brand/              FHS mark built from the client's DWG (fhs-mark.svg red, fhs-mark.inline.svg currentColor),
                           the earlier emblem export fhs-emblem.svg (glyph source for the build) and source/ (the DWG + build script)
```

## Core behaviour (`js/fhe-core.js`)
- **Preloader.** A `[data-preloader="mark"]` preloader is handed to `window.FHEIntro` (`js/fhe-mark.js`, below). Tap or Escape skips it. It doesn't run for reduced-motion users or on Back/Forward navigation.
- **Smooth scrolling.** On mouse and trackpad, `js/smooth.js` runs Lenis and in-page links glide through it. Touch keeps native scrolling, reduced-motion users get none, and it pauses during the intro, the mobile menu and the Contact us dialog (which scroll natively via `data-lenis-prevent`).
- **Back button.** In-page menu links scroll with `history.replaceState`, so they never add history entries. The mobile menu is a button, not a hash link.
- **Lazy time-lapse.** The `<video>` gets its source only when it nears the viewport (IntersectionObserver), and it pauses when off-screen.
- Reveal-on-scroll, count-up numbers, a live Asia/Dubai clock and a scrolled-header flag.
- **Crane hook.** A twin-sheave block with a ramshorn double hook hangs in the right margin on four falls of wire rope and is lowered as you scroll. A spring gives it weight and a little bounce, scroll speed swings it like a pendulum (slower as the cable gets longer) and the hook trails on its swivel, while the rope lay and the knurl on the sheave rims run as the rope visibly pays out. The site stylesheet recolours the block, its hazard band and the rim light in the hook's throats. At the foot of the page it rests just above the WhatsApp button and shows the "WhatsApp us" label. JS builds it, so the pages carry no markup for it. With reduced motion it simply follows the page.
- **Floating WhatsApp.** One button opens a chooser with two lines: Friendship Hall main line +971 52 833 5333 and Bashir (COO) +971 52 902 6103. Each opens WhatsApp with a short enquiry pre-filled. It uses the native `popover`, so tap-outside and Escape close it, and older browsers get a scripted fallback. It hides while the mobile menu is open and shows the label once, a third of the way down the page.

## The mark
The logo comes from the client's AutoCAD file, `assets/brand/source/logo_fhe.dwg`. `build-mark.mjs` in the same folder reads it and writes `assets/brand/fhs-mark.svg` (brand red) and `fhs-mark.inline.svg` (currentColor). The drawing's circle is mapped to r = 500 at the origin, at a scale of 1:138, and every line, arc and pin comes straight from the DWG. The lettering in the DWG is a font reference (Times New Roman Bold), not geometry, so the glyph outlines come from the earlier vector export, `fhs-emblem.svg`. The script checks that export against the DWG and won't write the files if they disagree by more than one unit (today they're 0.07 apart). To rebuild, run `npm i --no-save @mlightcad/libredwg-web && node build-mark.mjs` inside `assets/brand/source/`. That folder is in `.vercelignore`, so it isn't deployed.

`js/fhe-mark.js` animates the mark. The header copy is the source, and the other two uses clone it:
- **Intro** (about 7.5 s). The preloader is `[data-preloader="mark"]`, so `fhe-core.js` hands it to `window.FHEIntro`.
  1. A welding spark draws the ring while a load dial ticks round it and the readout counts 25 → 700 T.
  2. The rope and hook drop in, catch, and swing.
  3. Three weld heads trace F, H and S, throwing sparks.
  4. Molten gold pours up into the letters.
  5. The mark locks with a punch, a shockwave, a spray of sparks and a glint, and the name fades up.
  6. The ring opens as an iris onto the hero while the mark flies into the header.

  A second load in the same tab gets a 3 s cut (sessionStorage `fhe:mark`). A tap, key or scroll jumps to the lock. It doesn't run with reduced motion or on Back/Forward. Styles are in `css/site.css` §3 and §3b.
- **Header.** Hovering or focusing the brand swings the hook on its ropes. It also swings once as the intro lands it.
- **Seal** (`[data-seal]`, top of the footer). A large mark draws itself as it scrolls in, then pours. The drawing eases after the scroll position, so even a fast flick plays out over about 2 s. It tilts toward the pointer with a moving highlight, scroll speed swings the hook, and the lettering turns slowly around it. With reduced motion it's shown finished and still.

## Contact us
Every **Contact us** button (header, hero, mobile menu, contact chapter, and the "Discuss a lift" links under Industries) opens a full-screen brief. Visitors pick a service, set the crane size on a 25–700 T dial (same log scale as the fleet chapter), and add the emirate, start date, notes and their details. A film-slate panel fills in as they type. **Send on WhatsApp** opens a chat with Sales (+971 52 902 6105) and **Send by email** opens their mail app addressed to fhcrane@gmail.com. Either way the brief is written out for them, and the slate claps shut. Nothing is stored or sent by the site itself, so there's no server or form backend to run. Name and phone are required. The behaviour is in `js/site.js` §3 and the styles are in `css/site.css` §23. Without JavaScript the buttons fall back to the contact chapter.

## Fleet roster
Chapter III lists every heavy unit on the books (`#roster`), built from the client's vehicle register (FHE-BBH and FHE-DXB, September 2026): **158 units** on 21 family cards: 64 mobile cranes, 14 crawler cranes, 33 prime movers (rows the register calls "Tractor" or "Locomotive" are truck heads), 36 trailers and 11 forklifts and loaders. Each card has a photo with the unit count over it and every model on the books as a chip. Passenger and light vehicles are left out on purpose (54 rows: sedans, SUVs, hatchbacks, double cabins, pickups, the Hiace bus, Isuzu staff carriers, Canters, the Dongfeng and Mahindra light cargo trucks, and the Kia workshop van). Plates and chassis numbers are never shown. The tally figures filter the cards (`js/site.js` §4, `css/site.css` §13b).

- **Photos.** Demag, Terex, flatbed and lowbed cards use FHE's own photos (tagged "FHE fleet"). The other cards use model photos of the same makes and models from Wikimedia Commons (`assets/media/fleet/`), with author, licence and source in `assets/media/fleet/credits.json` and in the "Photo credits" list under the cards. Several are CC BY or CC BY-SA, so **keep that credits list on the page** while they're used. Sany HQC, Kobelco RK and the Sany/Zoomlion crawlers have gold line drawings instead (no usable photo).
- **Updating.** Edit the card's model chips, its count in `.fam__n`, and the matching tally `data-count` together.

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
- **Fleet roster: please confirm.** Four register rows say "Nissan H?" but share the Sany HQC chassis series, so they're counted as Sany HQC (8 in all). The "Skania? 300T" crane has a Sany chassis prefix and is shown as "Sany 300 T". "Terex A600", "Kobelco 600 series" and the unnamed Sany/XCMG/Kobelco cranes are shown as the register names them.
- **WhatsApp numbers** are from fhecrane.com: Admin +971 52 902 6102, Sales +971 52 902 6105. The floating button uses +971 52 833 5333 (labelled "Main line") and Bashir on +971 52 902 6103. Please confirm both labels.
