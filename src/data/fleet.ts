/* The fleet, from the client's vehicle register (FHE-BBH and FHE-DXB, September 2026): every heavy unit on the books,
 * 158 in all. Passenger and light vehicles are left out on purpose; plates and chassis numbers are never shown.
 *
 * `t` is the rated capacity in tonnes: the maker's maximum, at minimum radius. Most come straight from the model
 * designation (LTM 1500 = 500 t, AC 700 = 700 t, QY 50K = 50 t); the others were checked against maker data:
 * Terex Explorer 5800 220 t, Hitachi KH 300 80 t, Sumitomo LS-248RH 150 t, XCMG XGC 150 150 t, Sany SCC 3200A 320 t,
 * Sany SCC 600A 60 t, Kobelco CKE 1350 135 t, and the Kobelco RK 70M is a 7 t compact rough-terrain crane.
 * Units without a `t` are not plotted on the capacity console (the register doesn't pin the model down; see README).
 *
 * Updating: edit a family's units; the class totals, the tally and the console all follow from this file. */

export type ClassId = 'mobile' | 'crawler' | 'prime' | 'trailer' | 'handling';

export interface Unit {
  model: string;
  n: number;
  t?: number;
}

export interface Photo {
  /** file stem under /assets/media/ (FHE's own photos, WebP 480–1920) or /assets/media/fleet/ (model photos, JPG 640–1280) */
  src: string;
  fleet?: boolean;
  w: number;
  h: number;
  alt: string;
  pos?: string;
}

export interface Family {
  id: string;
  cls: ClassId;
  make: string;
  /** the italic part of the name, set in gold */
  em?: string;
  kind: string;
  units: Unit[];
  photo?: Photo;
  /** line drawing for families without a usable photo */
  drawing?: 'rough' | 'crawler' | 'tractor';
  /** FHE's own machines, photographed in the yard */
  own?: boolean;
}

const own = (src: string, w: number, h: number, alt: string, pos?: string): Photo => ({ src, w, h, alt, pos });
const model = (src: string, w: number, h: number, alt: string, pos?: string): Photo => ({ src, fleet: true, w, h, alt, pos });

export const FAMILIES: Family[] = [
  // ---- mobile cranes: 64
  {
    id: 'liebherr', cls: 'mobile', make: 'Liebherr', em: 'LTM', kind: 'All-terrain',
    photo: model('liebherr', 1280, 960, 'Liebherr LTM all-terrain crane (model photo)', '50% 45%'),
    units: [
      { model: 'LTM 1500', n: 2, t: 500 }, { model: 'LTM 1300-6.2', n: 1, t: 300 }, { model: 'LTM 1250', n: 2, t: 250 },
      { model: 'LTM 1200', n: 3, t: 200 }, { model: 'LTM 1160', n: 2, t: 160 }, { model: 'LTM 1080', n: 1, t: 80 },
      { model: 'LTM 1050-4', n: 1, t: 50 },
    ],
  },
  {
    id: 'demag', cls: 'mobile', make: 'Demag', em: 'AC', kind: 'All-terrain', own: true,
    photo: own('heavy-crane-truss', 1280, 790, 'Red FHE crane with counterweight stack lifting a steel truss'),
    units: [
      { model: 'AC 700', n: 1, t: 700 }, { model: 'AC 500', n: 1, t: 500 }, { model: 'AC 200', n: 1, t: 200 },
      { model: 'AC 120', n: 3, t: 120 }, { model: 'AC 100', n: 7, t: 100 },
    ],
  },
  {
    id: 'zoomlion', cls: 'mobile', make: 'Zoomlion', kind: 'Truck & all-terrain',
    photo: model('zoomlion', 1280, 960, 'Zoomlion truck crane (model photo)', '50% 62%'),
    units: [
      { model: 'ZAT 4000', n: 1, t: 400 }, { model: 'ZTC 1300V', n: 1, t: 130 }, { model: 'ZTC 1000V', n: 1, t: 100 },
      { model: 'ZTC 800V', n: 3, t: 80 }, { model: 'ZTC 600', n: 1, t: 60 }, { model: 'ZTC 550V', n: 3, t: 55 },
      { model: 'QY 50', n: 1, t: 50 }, { model: 'ZTC 300', n: 1, t: 30 }, { model: 'ZTC 250', n: 2, t: 25 },
    ],
  },
  {
    id: 'sany', cls: 'mobile', make: 'Sany', kind: 'Truck & all-terrain',
    photo: model('sany', 1280, 1706, 'Sany STC truck crane (model photo)', '50% 28%'),
    units: [
      { model: '300 T', n: 1, t: 300 }, { model: 'SAC 2600T', n: 1, t: 260 }, { model: 'SAC 1600', n: 1, t: 160 },
      { model: 'STC 1000C', n: 1, t: 100 }, { model: '100 T', n: 1, t: 100 }, { model: 'STC 75', n: 1, t: 75 },
      { model: 'STC 500', n: 3, t: 50 }, { model: 'QY 50C', n: 1, t: 50 }, { model: 'STC 250', n: 1, t: 25 },
      { model: 'Other model', n: 1 },
    ],
  },
  {
    id: 'xcmg', cls: 'mobile', make: 'XCMG', kind: 'Truck & all-terrain',
    photo: model('xcmg', 1280, 960, 'XCMG QY50K truck crane (model photo)', '58% 55%'),
    units: [
      { model: 'XCA 250', n: 1, t: 250 }, { model: 'QY 110KH', n: 2, t: 110 }, { model: 'QY 100K', n: 1, t: 100 },
      { model: 'QY 70K', n: 1, t: 70 }, { model: 'XCT 70E', n: 1, t: 70 }, { model: '50 T', n: 1, t: 50 },
      { model: 'QY 50K', n: 1, t: 50 }, { model: 'QY 25K', n: 1, t: 25 },
    ],
  },
  {
    id: 'terex', cls: 'mobile', make: 'Terex', kind: 'All-terrain', own: true,
    photo: own('terex-friendship-closeup', 1280, 960, 'White Terex all-terrain crane in FRIENDSHIP livery'),
    units: [{ model: 'Explorer 5800', n: 1, t: 220 }, { model: 'A600', n: 2 }],
  },
  {
    id: 'kobelco-rk', cls: 'mobile', make: 'Kobelco', em: 'RK', kind: 'Compact rough-terrain', drawing: 'rough',
    units: [{ model: 'RK 70M', n: 1, t: 7 }],
  },

  // ---- crawler cranes: 14
  {
    id: 'kobelco', cls: 'crawler', make: 'Kobelco', kind: 'Lattice-boom crawler',
    photo: model('kobelco-crawler', 1280, 853, 'Kobelco CKE 2500 crawler crane (model photo)', '45% 62%'),
    units: [
      { model: 'CKE 2500', n: 2, t: 250 }, { model: 'CKE 1350', n: 1, t: 135 }, { model: '600 series', n: 3 },
      { model: 'Other model', n: 1 },
    ],
  },
  {
    id: 'sany-zoomlion-crawler', cls: 'crawler', make: 'Sany', em: '& Zoomlion', kind: 'Lattice-boom crawler', drawing: 'crawler',
    units: [{ model: 'Sany SCC 3200A', n: 1, t: 320 }, { model: 'Sany SCC 600A', n: 1, t: 60 }, { model: 'Zoomlion ZCC 300V', n: 1 }],
  },
  {
    id: 'hitachi-sumitomo', cls: 'crawler', make: 'Hitachi', em: '& Sumitomo', kind: 'Lattice-boom crawler',
    photo: model('hitachi-sumitomo', 1280, 960, 'Hitachi KH crawler crane (model photo)', '35% 55%'),
    units: [{ model: 'Sumitomo LS-248RH', n: 1, t: 150 }, { model: 'Hitachi KH 300', n: 1, t: 80 }],
  },
  {
    id: 'xcmg-crawler', cls: 'crawler', make: 'XCMG', kind: 'Crawler',
    photo: model('xcmg-crawler', 1280, 960, 'XCMG crawler cranes (model photo)', '58% 45%'),
    units: [{ model: 'XGC 150', n: 1, t: 150 }, { model: 'QUY 55', n: 1, t: 55 }],
  },

  // ---- prime movers: 33 (rows the register calls "Tractor" or "Locomotive" are truck heads)
  {
    id: 'mercedes', cls: 'prime', make: 'Mercedes-Benz', kind: 'Tractor heads',
    photo: model('mercedes', 1280, 1024, 'Mercedes-Benz Actros 2653 tractor head (model photo)', '50% 42%'),
    units: [
      { model: '3848', n: 2 }, { model: '2653', n: 1 }, { model: '1948', n: 1 }, { model: '1848', n: 2 },
      { model: '1843', n: 2 }, { model: '1840', n: 1 }, { model: '1834', n: 2 },
    ],
  },
  {
    id: 'volvo', cls: 'prime', make: 'Volvo', kind: 'Tractor heads',
    photo: model('volvo', 1280, 960, 'Volvo FH12 tractor head (model photo)', '78% 55%'),
    units: [{ model: 'FH12', n: 2 }, { model: 'FM12', n: 1 }, { model: 'FH', n: 5 }],
  },
  {
    id: 'sany-hqc', cls: 'prime', make: 'Sany', em: 'HQC', kind: 'Tractor heads', drawing: 'tractor',
    units: [{ model: 'HQC', n: 8 }],
  },
  {
    id: 'man', cls: 'prime', make: 'MAN', kind: 'Tractor heads',
    photo: model('man', 1280, 960, 'MAN TGX 18.440 tractor head (model photo)', '82% 55%'),
    units: [{ model: 'TGA 33.400', n: 1 }, { model: '19.414', n: 1 }, { model: 'TGA 18.440', n: 1 }, { model: 'TGX 18.440', n: 1 }],
  },
  {
    id: 'tata-daewoo', cls: 'prime', make: 'Tata', em: '& Daewoo', kind: 'Tractor heads',
    photo: model('tata-daewoo', 1280, 960, 'Tata Daewoo tractor head (model photo)', '22% 50%'),
    units: [{ model: 'Tata Prima', n: 1 }, { model: 'Daewoo 7542', n: 1 }],
  },

  // ---- trailers: 36
  {
    id: 'flatbeds', cls: 'trailer', make: 'Flatbeds', kind: 'Semi-trailers', own: true,
    photo: own('crane-on-flatbed', 1280, 960, 'Heavy crane lifting a mobile crane carrier onto an FHE flatbed trailer'),
    units: [{ model: 'Valt', n: 17 }, { model: 'Other builds', n: 13 }],
  },
  {
    id: 'lowbeds', cls: 'trailer', make: 'Lowbeds', kind: 'Semi-trailers', own: true,
    photo: own('lowbed-trailer', 1280, 960, 'Mobile crane lifting a yacht onto an FHE lowbed trailer at sunset', '40% 50%'),
    units: [{ model: 'Valt', n: 3 }, { model: 'Other builds', n: 3 }],
  },

  // ---- forklifts & loaders: 11
  {
    id: 'forklifts', cls: 'handling', make: 'Forklifts', kind: 'Up to 25 t class',
    photo: model('kalmar', 1280, 718, 'Kalmar DCD 250 heavy forklift (model photo)', '50% 46%'),
    units: [
      { model: 'Kalmar DCD250-12LB', n: 1 }, { model: 'Toyota FD50', n: 1 }, { model: 'Toyota FD8-32', n: 1 },
      { model: 'Hangcha CPCD100', n: 1 }, { model: 'Dalian CPCD30', n: 1 }, { model: 'CVS Ferrari', n: 1 },
    ],
  },
  {
    id: 'caterpillar', cls: 'handling', make: 'Caterpillar', kind: 'Wheel loaders',
    photo: model('caterpillar', 1280, 960, 'Caterpillar 966G wheel loader (model photo)', '40% 58%'),
    units: [{ model: '966G', n: 2 }, { model: '950G', n: 1 }],
  },
  {
    id: 'jcb', cls: 'handling', make: 'JCB', kind: 'Telehandlers',
    photo: model('jcb', 1280, 720, 'JCB 540-170 telehandler (model photo)', '45% 58%'),
    units: [{ model: '540-170', n: 2 }],
  },
];

export interface FleetClass {
  id: ClassId;
  name: string;
  /** the italic tail of the name */
  em: string;
  span: string;
  lede: string;
  photo: Photo;
}

export const CLASSES: FleetClass[] = [
  {
    id: 'mobile', name: 'Mobile', em: 'cranes', span: '25–700 T',
    lede: 'All-terrain and truck cranes, from city picks to the flagship Demag AC 700, with trained operators and lifting supervisors.',
    photo: own('superlift-truss-red', 1280, 960, 'Red FHE heavy crane with superlift counterweight lifting a steel truss', '50% 40%'),
  },
  {
    id: 'crawler', name: 'Crawler', em: 'cranes', span: '55–320 T',
    lede: 'Lattice-boom crawler cranes for heavy picks and long jobs, up to the 320-tonne Sany SCC 3200A.',
    photo: own('crawler-crane-coast', 1280, 960, 'White lattice-boom crawler crane working on a coastal site', '50% 45%'),
  },
  {
    id: 'prime', name: 'Prime', em: 'movers', span: 'Tractor heads',
    lede: 'Tractor heads from Mercedes-Benz, Volvo, Sany, MAN and Tata to pull our lowbeds and flatbeds.',
    photo: model('mercedes', 1280, 1024, 'Mercedes-Benz Actros 2653 tractor head (model photo)', '50% 42%'),
  },
  {
    id: 'trailer', name: 'Heavy', em: 'trailers', span: 'Flatbed & lowbed',
    lede: 'Flatbeds and lowbeds for over-dimensional and overweight shipments that need special equipment and permits.',
    photo: own('lowbed-trailer', 1280, 960, 'Mobile crane lifting a yacht onto an FHE lowbed trailer at sunset', '40% 50%'),
  },
  {
    id: 'handling', name: 'Forklifts', em: '& loaders', span: 'Up to 25 T class',
    lede: 'Heavy forklifts, wheel loaders and telehandlers for loading, staging and yard work.',
    photo: model('kalmar', 1280, 718, 'Kalmar DCD 250 heavy forklift (model photo)', '50% 46%'),
  },
];

export const unitsOf = (f: Family) => f.units.reduce((s, u) => s + u.n, 0);
export const classTotal = (id: ClassId) => FAMILIES.filter((f) => f.cls === id).reduce((s, f) => s + unitsOf(f), 0);
export const TOTAL = FAMILIES.reduce((s, f) => s + unitsOf(f), 0);

/** Every crane with a rated capacity in the 25–700 t range, as plotted on the capacity console. */
export interface Rated {
  make: string;
  model: string;
  n: number;
  t: number;
  cls: 'mobile' | 'crawler';
}
const shortMake = (f: Family) => (f.id === 'sany-zoomlion-crawler' || f.id === 'hitachi-sumitomo' ? '' : f.make);
export const RATED: Rated[] = FAMILIES
  .filter((f): f is Family & { cls: 'mobile' | 'crawler' } => f.cls === 'mobile' || f.cls === 'crawler')
  .flatMap((f) => f.units
    .filter((u): u is Unit & { t: number } => typeof u.t === 'number' && u.t >= 25)
    .map((u) => ({ make: shortMake(f), model: u.model, n: u.n, t: u.t, cls: f.cls })))
  .sort((a, b) => b.t - a.t);

/** Cranes on the books that the console leaves out, and why (shown as a footnote under the chart). */
export const UNPLOTTED = FAMILIES
  .filter((f) => f.cls === 'mobile' || f.cls === 'crawler')
  .flatMap((f) => f.units.filter((u) => !(typeof u.t === 'number' && u.t >= 25)).map((u) => ({ f, u })));

/** Typical work by size: the same bands the Contact us brief uses. */
export const BANDS: [number, string, string][] = [
  [65, '', 'City picks, HVAC & signage, plant maintenance'],
  [140, '', 'Precast, steel erection, tower-crane assembly'],
  [350, '', 'Bridge girders, heavy modules, tandem lifts'],
  [600, '', 'Heavy industrial, refinery & power, superlift work'],
  [Infinity, 'Flagship', 'Vessels, heavy plant, long-radius lifts'],
];

export const MAKERS = ['Liebherr', 'Demag', 'Terex', 'Zoomlion', 'XCMG', 'Sany', 'Kobelco', 'Hitachi', 'Sumitomo',
  'Mercedes-Benz', 'Volvo', 'MAN', 'Tata', 'Daewoo', 'Caterpillar', 'JCB', 'Kalmar', 'Toyota', 'Hangcha'];
