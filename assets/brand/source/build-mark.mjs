/* Builds the FHS mark from the client's AutoCAD drawing.
 *
 *   logo_fhe.dwg (AutoCAD 2018, AC1032)  →  ../fhs-mark.svg          standalone, brand red
 *                                         →  ../fhs-mark.inline.svg   currentColor, for pasting into pages
 *
 * Run from this folder:
 *   npm i --no-save @mlightcad/libredwg-web && node build-mark.mjs
 *
 * The drawing is line work on layer 0: one circle (r = 69000), three wire-rope strands with cut (V) ends, a hook block
 * (shank, two arms, lugs, pins) and a ramshorn double hook. It is mapped so the circle sits at the origin with r = 500,
 * y pointing down. The lettering is an MTEXT ("FHS", Times New Roman Bold), i.e. a font reference rather than
 * geometry, so the glyph outlines are taken from ../fhs-emblem.svg (a vector export of the same drawing) and placed in
 * the same space. The script checks that export against the DWG and refuses to write if the two disagree.
 */
import { Dwg_File_Type, LibreDwg } from '@mlightcad/libredwg-web';
import fs from 'node:fs';

const here = (p) => new URL(p, import.meta.url);
const lib = await LibreDwg.create(new URL('./node_modules/@mlightcad/libredwg-web/wasm/', import.meta.url).pathname);
const db = lib.convert(lib.dwg_read_data(fs.readFileSync(here('./logo_fhe.dwg')), Dwg_File_Type.DWG));
const ent = Object.fromEntries(db.entities.map((e) => [String(e.handle), e]));

const ring = db.entities.find((e) => e.type === 'CIRCLE' && e.radius > 10000);
const R = 500;
const k = ring.radius / R;
const P = (p) => [(p.x - ring.center.x) / k, -(p.y - ring.center.y) / k];
const n = (v) => (Math.round(v * 100) / 100).toString();
const pt = ([x, y]) => `${n(x)} ${n(y)}`;

// Chain of LINE handles → one path (closed when the chain returns to its start).
function chain(handles, close) {
  const pts = [P(ent[handles[0]].startPoint), ...handles.map((h) => P(ent[h].endPoint))];
  if (close) pts.pop();
  return `M${pts.map(pt).join('L')}${close ? 'Z' : ''}`;
}
// ARC: counter-clockwise in the drawing. Flipping y keeps it counter-clockwise on screen, which in SVG is sweep 0.
function arc(h) {
  const a = ent[h];
  const at = (t) => P({ x: a.center.x + a.radius * Math.cos(t), y: a.center.y + a.radius * Math.sin(t) });
  let span = a.endAngle - a.startAngle;
  if (span < 0) span += Math.PI * 2;
  return `M${pt(at(a.startAngle))}A${n(a.radius / k)} ${n(a.radius / k)} 0 ${span > Math.PI ? 1 : 0} 0 ${pt(at(a.endAngle))}`;
}
function circle(h) {
  const c = ent[h];
  const [x, y] = P(c.center);
  const r = n(c.radius / k);
  return `M${n(x - c.radius / k)} ${n(y)}a${r} ${r} 0 1 0 ${n((2 * c.radius) / k)} 0a${r} ${r} 0 1 0 ${n((-2 * c.radius) / k)} 0`;
}
const range = (from, to) => Array.from({ length: parseInt(to, 16) - parseInt(from, 16) + 1 }, (_, i) => (parseInt(from, 16) + i).toString(16).toUpperCase());

// Entity handles in logo_fhe.dwg, grouped by the part they draw.
const ropes = [range('330', '335'), range('354', '359'), range('342', '347')].map((hs) => chain(hs, true)); // left, middle, right
const hook = {
  shank: chain(range('2E5', '2E9'), false),
  arms: [chain(range('2F1', '2F4'), true), chain(range('2F5', '2F8'), true)],
  lugs: [chain(['2ED', '2EE'], false), chain(['2EB', '2EC'], false)],
  pins: [circle('2F0'), circle('2EF')],
  horns: [arc('2CF'), arc('2DD'), arc('2D6'), arc('2E4')], // left outer, left inner, right outer, right inner
  base: chain(['2EA'], false),
};

// Lettering: the glyphs from ../fhs-emblem.svg, whose space is matrix(.12 0 0 -.12 14 1636) applied to a drawing
// where this circle has centre (9778.515625, 6523.502604) and r 6162.5 — i.e. centre (1187.421875, 853.1796875) and
// r 739.5 in that file's viewBox.
const old = fs.readFileSync(here('../fhs-emblem.svg'), 'utf8');
const O = { x: 9778.515625 * 0.12 + 14, y: 1636 - 6523.502604 * 0.12, r: 6162.5 * 0.12 };
const m = R / O.r;
const glyphs = [...old.match(/<g class="fhs-letters"[\s\S]*?<\/g>/)[0].matchAll(/translate\(([\d.]+) ([\d.]+)\)" d="([^"]+)"/g)].map(([, tx, ty, d]) => {
  let i = 0;
  return d.trim().replace(/-?\d+(?:\.\d+)?/g, (v) => n(i++ % 2 === 0 ? (+v + +tx - O.x) * m : (+v + +ty - O.y) * m))
    .replace(/\s*([MLCZ])\s*/g, '$1').replace(/Z\s*M[^A-Z]*$/, 'Z'); // drop the exporter's trailing moveto
});
if (glyphs.length !== 3) throw new Error('expected three glyphs (F, H, S) in fhs-emblem.svg');

// Check the export against the DWG: rope corners and the lettering's insertion point must agree.
const oldRope = old.match(/<g class="fhs-hook"[\s\S]*?d="M ([\d.]+) ([\d.]+)/).slice(1).map(Number); // left rope, first point
const ropeOld = [(oldRope[0] * 0.12 + 14 - O.x) * m, (1636 - oldRope[1] * 0.12 - O.y) * m];
const ropeDwg = P(ent['330'].startPoint);
const text = db.entities.find((e) => e.type === 'MTEXT');
const fLeft = Math.min(...glyphs[0].match(/-?\d+(?:\.\d+)?/g).filter((_, i) => i % 2 === 0).map(Number));
const drift = Math.max(Math.hypot(ropeOld[0] - ropeDwg[0], ropeOld[1] - ropeDwg[1]), Math.abs(fLeft - P(text.insertionPoint)[0]));
if (drift > 1) throw new Error(`fhs-emblem.svg is ${drift.toFixed(2)} units off the DWG — re-export it before building`);

const ringPath = `M0 -${R}A${R} ${R} 0 1 1 0 ${R}A${R} ${R} 0 1 1 0 -${R}`;
const stroked = (cls, d) => `<path class="${cls}" pathLength="1" vector-effect="non-scaling-stroke" d="${d}"/>`;
const body = (color) => [
  `  <g class="fhm-ring" fill="none" stroke="${color}" stroke-width="1.6">${stroked('fhm-ring__path', ringPath)}</g>`,
  `  <g class="fhm-letters" fill="${color}">`,
  ...['f', 'h', 's'].map((c, i) => `    <path class="fhm-glyph fhm-glyph--${c}" pathLength="1" d="${glyphs[i]}"/>`),
  '  </g>',
  `  <g class="fhm-rig" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">`,
  `    <g class="fhm-ropes">${ropes.map((d) => stroked('fhm-rope', d)).join('')}</g>`,
  '    <g class="fhm-hook">',
  `      ${stroked('fhm-shank', hook.shank)}`,
  `      ${hook.arms.map((d) => stroked('fhm-arm', d)).join('')}`,
  `      ${hook.lugs.map((d) => stroked('fhm-lug', d)).join('')}${hook.pins.map((d) => stroked('fhm-pin', d)).join('')}`,
  `      ${hook.horns.map((d) => stroked('fhm-horn', d)).join('')}`,
  `      ${stroked('fhm-base', hook.base)}`,
  '    </g>',
  '  </g>',
].join('\n');

const vb = `-${R + 5} -${R + 5} ${2 * R + 10} ${2 * R + 10}`;
fs.writeFileSync(here('../fhs-mark.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="Friendship Hall emblem">\n  <title>Friendship Hall</title>\n${body('#e10600')}\n</svg>\n`);
fs.writeFileSync(here('../fhs-mark.inline.svg'),
  `<svg class="fhs-mark" xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true" focusable="false">\n${body('currentColor')}\n</svg>\n`);
console.log(`fhs-mark.svg written · scale 1:${k} · export drift ${drift.toFixed(3)} units`);
