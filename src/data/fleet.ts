/* The fleet, from the client's vehicle register (FHE-BBH and FHE-DXB, September 2026): every heavy unit on the books,
 * 150 in all. Passenger and light vehicles are left out on purpose; plates and chassis numbers are never shown.
 *
 * `t` is the rated capacity in tonnes: the maker's maximum, at minimum radius. Most come straight from the model
 * designation (LTM 1500 = 500 t, AC 700 = 700 t, QY 50K = 50 t); the others were checked against maker data:
 * Terex Explorer 5800 220 t, Hitachi KH 300 80 t, Sumitomo LS-248RH 150 t, XCMG XGC 150 150 t, Sany SCC 3200A 320 t,
 * and Sany SCC 600A 60 t.
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
  /** file stem under /assets/media/ (FHS's own photos, WebP 480–1920) */
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
  /** line drawing for families without one of our own photos */
  drawing?: 'rough' | 'crawler' | 'tractor';
  /** FHE's own machines, photographed in the yard */
  own?: boolean;
}

const own = (src: string, w: number, h: number, alt: string, pos?: string): Photo => ({ src, w, h, alt, pos });

export const FAMILIES: Family[] = [
  // ---- mobile cranes: 63
  {
    id: 'liebherr', cls: 'mobile', make: 'Liebherr', em: 'LTM', kind: 'All-terrain',
    own: true,
    photo: own('fhs-liebherr-lowbed', 1280, 960, 'FHS Liebherr all-terrain crane in FRIENDSHIP livery, loaded on a lowbed', '50% 50%'),
    units: [
      { model: 'LTM 1500', n: 2, t: 500 }, { model: 'LTM 1300-6.2', n: 1, t: 300 }, { model: 'LTM 1250', n: 2, t: 250 },
      { model: 'LTM 1200', n: 3, t: 200 }, { model: 'LTM 1160', n: 2, t: 160 }, { model: 'LTM 1080', n: 1, t: 80 },
      { model: 'LTM 1050-4', n: 1, t: 50 },
    ],
  },
  {
    id: 'demag', cls: 'mobile', make: 'Demag', em: 'AC', kind: 'All-terrain', own: true,
    photo: own('heavy-crane-truss', 1280, 790, 'Red FHS crane with counterweight stack lifting a steel truss'),
    units: [
      { model: 'AC 700', n: 1, t: 700 }, { model: 'AC 500', n: 1, t: 500 }, { model: 'AC 200', n: 1, t: 200 },
      { model: 'AC 120', n: 3, t: 120 }, { model: 'AC 100', n: 7, t: 100 },
    ],
  },
  {
    id: 'zoomlion', cls: 'mobile', make: 'Zoomlion', kind: 'Truck & all-terrain',
    own: true,
    photo: own('fhs-zoomlion-truck', 720, 1280, 'FHS Zoomlion truck crane parked in the yard', '50% 66%'),
    units: [
      { model: 'ZAT 4000', n: 1, t: 400 }, { model: 'ZTC 1300V', n: 1, t: 130 }, { model: 'ZTC 1000V', n: 1, t: 100 },
      { model: 'ZTC 800V', n: 3, t: 80 }, { model: 'ZTC 600', n: 1, t: 60 }, { model: 'ZTC 550V', n: 3, t: 55 },
      { model: 'QY 50', n: 1, t: 50 }, { model: 'ZTC 300', n: 1, t: 30 }, { model: 'ZTC 250', n: 2, t: 25 },
    ],
  },
  {
    id: 'sany', cls: 'mobile', make: 'Sany', kind: 'Truck & all-terrain',
    drawing: 'rough',
    units: [
      { model: '300 T', n: 1, t: 300 }, { model: 'SAC 2600T', n: 1, t: 260 }, { model: 'SAC 1600', n: 1, t: 160 },
      { model: 'STC 1000C', n: 1, t: 100 }, { model: '100 T', n: 1, t: 100 }, { model: 'STC 75', n: 1, t: 75 },
      { model: 'STC 500', n: 3, t: 50 }, { model: 'QY 50C', n: 1, t: 50 }, { model: 'STC 250', n: 1, t: 25 },
      { model: 'Other model', n: 1 },
    ],
  },
  {
    id: 'xcmg', cls: 'mobile', make: 'XCMG', kind: 'Truck & all-terrain',
    own: true,
    photo: own('fhs-xcmg-qy130k', 960, 1280, 'FHS XCMG QY130K truck crane with its boom raised', '50% 52%'),
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

  // ---- crawler cranes: 7
  {
    id: 'sany-zoomlion-crawler', cls: 'crawler', make: 'Sany', em: '& Zoomlion', kind: 'Lattice-boom crawler', drawing: 'crawler',
    units: [{ model: 'Sany SCC 3200A', n: 1, t: 320 }, { model: 'Sany SCC 600A', n: 1, t: 60 }, { model: 'Zoomlion ZCC 300V', n: 1 }],
  },
  {
    id: 'hitachi-sumitomo', cls: 'crawler', make: 'Hitachi', em: '& Sumitomo', kind: 'Lattice-boom crawler',
    drawing: 'crawler',
    units: [{ model: 'Sumitomo LS-248RH', n: 1, t: 150 }, { model: 'Hitachi KH 300', n: 1, t: 80 }],
  },
  {
    id: 'xcmg-crawler', cls: 'crawler', make: 'XCMG', kind: 'Crawler',
    drawing: 'crawler',
    units: [{ model: 'XGC 150', n: 1, t: 150 }, { model: 'QUY 55', n: 1, t: 55 }],
  },

  // ---- prime movers: 33 (rows the register calls "Tractor" or "Locomotive" are truck heads)
  {
    id: 'mercedes', cls: 'prime', make: 'Mercedes-Benz', kind: 'Tractor heads',
    drawing: 'tractor',
    units: [
      { model: '3848', n: 2 }, { model: '2653', n: 1 }, { model: '1948', n: 1 }, { model: '1848', n: 2 },
      { model: '1843', n: 2 }, { model: '1840', n: 1 }, { model: '1834', n: 2 },
    ],
  },
  {
    id: 'volvo', cls: 'prime', make: 'Volvo', kind: 'Tractor heads',
    drawing: 'tractor',
    units: [{ model: 'FH12', n: 2 }, { model: 'FM12', n: 1 }, { model: 'FH', n: 5 }],
  },
  {
    id: 'sany-hqc', cls: 'prime', make: 'Sany', em: 'HQC', kind: 'Tractor heads', drawing: 'tractor',
    units: [{ model: 'HQC', n: 8 }],
  },
  {
    id: 'man', cls: 'prime', make: 'MAN', kind: 'Tractor heads',
    drawing: 'tractor',
    units: [{ model: 'TGA 33.400', n: 1 }, { model: '19.414', n: 1 }, { model: 'TGA 18.440', n: 1 }, { model: 'TGX 18.440', n: 1 }],
  },
  {
    id: 'tata-daewoo', cls: 'prime', make: 'Tata', em: '& Daewoo', kind: 'Tractor heads',
    drawing: 'tractor',
    units: [{ model: 'Tata Prima', n: 1 }, { model: 'Daewoo 7542', n: 1 }],
  },

  // ---- trailers: 36
  {
    id: 'flatbeds', cls: 'trailer', make: 'Flatbeds', kind: 'Semi-trailers', own: true,
    photo: own('crane-on-flatbed', 1280, 960, 'Heavy crane lifting a mobile crane carrier onto an FHS flatbed trailer'),
    units: [{ model: 'Valt', n: 17 }, { model: 'Other builds', n: 13 }],
  },
  {
    id: 'lowbeds', cls: 'trailer', make: 'Lowbeds', kind: 'Semi-trailers', own: true,
    photo: own('lowbed-trailer', 1280, 960, 'Mobile crane lifting a yacht onto an FHS lowbed trailer at sunset', '40% 50%'),
    units: [{ model: 'Valt', n: 3 }, { model: 'Other builds', n: 3 }],
  },

  // ---- forklifts & loaders: 11
  {
    id: 'forklifts', cls: 'handling', make: 'Forklifts', kind: 'Up to 25 t class',
    units: [
      { model: 'Kalmar DCD250-12LB', n: 1 }, { model: 'Toyota FD50', n: 1 }, { model: 'Toyota FD8-32', n: 1 },
      { model: 'Hangcha CPCD100', n: 1 }, { model: 'Dalian CPCD30', n: 1 }, { model: 'CVS Ferrari', n: 1 },
    ],
  },
  {
    id: 'caterpillar', cls: 'handling', make: 'Caterpillar', kind: 'Wheel loaders',
    units: [{ model: '966G', n: 2 }, { model: '950G', n: 1 }],
  },
  {
    id: 'jcb', cls: 'handling', make: 'JCB', kind: 'Telehandlers',
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
    photo: own('fhs-zoomlion-workshop', 768, 1364, 'FHS Zoomlion all-terrain crane in the workshop, boom stowed over the cab', '50% 44%'),
  },
  {
    id: 'crawler', name: 'Crawler', em: 'cranes', span: '55–320 T',
    lede: 'Lattice-boom crawler cranes for heavy picks and long jobs, up to the 320-tonne Sany SCC 3200A.',
    photo: own('crawler-crane-coast', 1280, 960, 'White lattice-boom crawler crane working on a coastal site', '50% 45%'),
  },
  {
    id: 'prime', name: 'Prime', em: 'movers', span: 'Tractor heads',
    lede: 'Tractor heads from Mercedes-Benz, Volvo, Sany, MAN and Tata to pull our lowbeds and flatbeds.',
    photo: own('fhs-night-haul-tall', 720, 1280, 'FHS Liebherr crane on a lowbed, ready for a night move', '28% 62%'),
  },
  {
    id: 'trailer', name: 'Heavy', em: 'trailers', span: 'Flatbed & lowbed',
    lede: 'Flatbeds and lowbeds for over-dimensional and overweight shipments that need special equipment and permits.',
    photo: own('fhs-liebherr-lowbed-rear', 960, 1280, 'FHS Liebherr crane loaded on a multi-axle lowbed, seen from behind', '50% 40%'),
  },
  {
    id: 'handling', name: 'Forklifts', em: '& loaders', span: 'Up to 25 T class',
    lede: 'Heavy forklifts, wheel loaders and telehandlers for loading, staging and yard work.',
    photo: own('crane-on-flatbed', 1280, 960, 'Heavy crane lifting a mobile crane carrier onto an FHS flatbed trailer'),
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
  [140, '', 'Precast, steel erection, tower-crane work'],
  [350, '', 'Bridge girders, heavy modules, long-reach lifts'],
  [600, '', 'Heavy industrial and power-plant lifts'],
  [Infinity, 'Flagship', 'Vessels, heavy plant, long-radius lifts'],
];

export const MAKERS = ['Liebherr', 'Demag', 'Terex', 'Zoomlion', 'XCMG', 'Sany', 'Hitachi', 'Sumitomo',
  'Mercedes-Benz', 'Volvo', 'MAN', 'Tata', 'Daewoo', 'Caterpillar', 'JCB', 'Kalmar', 'Toyota', 'Hangcha'];
