/* Responsive sources for the photographs in public/assets/media, read from disk at build time.
 * FHE's own photos are WebP at 480–1920 (not every one has a 1920); the fleet model photos (fleet/) are WebP at
 * 640, 960 and 1280. A photo with AVIF files beside its WebP ones (name-960.avif …) is served as AVIF where supported.
 * A missing photo fails the build rather than shipping a broken image. */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'public/assets/media');
const files = new Set([
  ...fs.readdirSync(root),
  ...fs.readdirSync(path.join(root, 'fleet')).map((f) => `fleet/${f}`),
]);

export interface Sources {
  src: string;
  srcset: string;
  widths: number[];
  /** AVIF variants, where they have been made (the hero, for the fastest first paint) */
  avif?: string;
}

const cache = new Map<string, Sources>();

export function sources(name: string, fleet = false): Sources {
  const key = `${fleet ? 'fleet/' : ''}${name}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const widths = [480, 640, 800, 960, 1280, 1920].filter((w) => files.has(`${key}-${w}.webp`));
  if (!widths.length) throw new Error(`No WebP sources for ${key} in public/assets/media`);
  const url = (w: number) => `/assets/media/${key}-${w}.webp`;
  const avif = widths.filter((w) => files.has(`${key}-${w}.avif`));
  const out = {
    src: url(widths.includes(1280) ? 1280 : widths[widths.length - 1]),
    srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
    widths,
    avif: avif.length ? avif.map((w) => `/assets/media/${key}-${w}.avif ${w}w`).join(', ') : undefined,
  };
  cache.set(key, out);
  return out;
}
