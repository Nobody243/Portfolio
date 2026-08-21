/**
 * BUILD-TIME glyph extraction. Run by hand; its OUTPUT is committed.
 *
 *   node scripts/extract-glyph-outlines.mjs
 *
 * Reads `public/fonts/space-grotesk-latin.typeface.json` and writes
 * `components/ui/msMarkGlyphs.ts` — the outlines the Intro's NAME is drawn
 * from. The mark's own geometry is hand-authored in
 * `components/ui/msMarkGeometry.ts`, which is the module both are consumed
 * through.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AMENDED 2026-08-21 — THERE IS NO MORPH ANY MORE, AND TWO THINGS BELOW ARE
 * NOW INERT. The mark was rebuilt as filled faceted shapes, `MorphSVGPlugin`
 * is unregistered, and the Intro's phase C is a convergence plus a crossfade
 * (`docs/06` §2, `docs/07` §3.1). The outlines themselves are still live — the
 * name is rendered from them so that it shares the mark's coordinate system —
 * but two morph-specific steps in this file no longer serve anything:
 *
 *   1. `PINNED_START` — pinning contour vertex 0 mattered because MorphSVG's
 *      `shapeIndex: "auto"` is not deterministic across font versions.
 *   2. The collinear-point stripping — it existed to give MorphSVG fewer
 *      redundant anchors to pair up.
 *
 * NEITHER CHANGES THE RENDERED SHAPE — one reorders commands, the other drops
 * anchors that lie on a straight line — so both are KEPT rather than removed,
 * because ripping them out would rewrite every path string in the committed
 * output for no visual difference. Anyone regenerating is free to delete them;
 * anyone reading them should not go looking for the morph they describe.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * WHY A GENERATOR AND NOT A RUNTIME PARSE. `docs/07_SITE_RESTRUCTURE.md` §3.1
 * rules out `opentype.js` on the first-paint path: a font parser shipped to the
 * browser to solve a problem with a static answer. The typeface JSON is 19 KB
 * of data for 53 glyphs when the Intro needs seven, and its command grammar is
 * not SVG. Both problems disappear if the conversion happens once, here.
 *
 * THE INPUT GRAMMAR is three.js `FontLoader`'s, in FONT UNITS WITH Y UP —
 * see `public/fonts/README.md`, which is the provenance record for the asset:
 *
 *   m x y                      moveTo
 *   l x y                      lineTo
 *   q x y cpx cpy              quadratic — END POINT FIRST, then the control
 *   b x y c1x c1y c2x c2y      cubic — same convention
 *
 * The `q`/`b` argument order is the one thing most likely to be got backwards,
 * and getting it wrong yields a subtly deformed glyph rather than an obvious
 * break. It is honoured below in exactly one place (`parseOutline`), so there
 * is one line to check rather than a convention to remember.
 *
 * THE OUTPUT is absolute-only SVG path data (`M`/`L`/`Q`/`C`/`Z`) in the SAME
 * font units, still Y-up, baseline at y = 0, glyph origin at x = 0. It is NOT
 * pre-placed into the mark's viewBox: placement is layout, layout belongs to
 * `msMarkGeometry.ts` where it can be read next to the numbers it derives from,
 * and a generator that also does layout is a generator nobody can review.
 *
 * "Absolute-only" is a load-bearing property of the output, not an
 * incidental one: it is what lets `msMarkGeometry.ts` transform a path by
 * walking its numbers in x,y pairs, with no path parser on the client.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONT_JSON = join(ROOT, "public", "fonts", "space-grotesk-latin.typeface.json");
const HERO_CONTENT = join(ROOT, "components", "hero", "heroContent.ts");
const OUT = join(ROOT, "components", "ui", "msMarkGlyphs.ts");

/**
 * The two glyphs that morph, and the vertex each one's contour must START at.
 *
 * MorphSVG's default `shapeIndex: "auto"` minimises travel, which is usually
 * right and is NOT deterministic across font versions — a logo animation that
 * rotates differently after a font update is a silent regression. Pinning
 * index 0 at build time and passing `shapeIndex: 0` at runtime removes the
 * solver from the picture entirely.
 *
 * `ms-mark-design.md` §6 fixes the two anchors: M enters at its bottom-left
 * extreme (which pairs with the trace's M1 `32,288`), S at its top-right
 * terminal — which pairs with the trace's S1, `560,112` since §12's terminal
 * flag moved the S's start point to the flag's tip. The glyph-side rule is
 * unchanged by that amendment and this file emits the same anchor it always
 * did; only the trace point it lands on has moved 80 units down the same
 * terminal. Both anchors are restated below as arithmetic in
 * the font's own Y-UP space, because "top-right" eyeballed once is not a thing
 * a later reader can re-derive.
 *
 * WHY THIS MATTERS BEYOND DETERMINISM, and it is the reason the two rules are
 * not interchangeable: the trace is a CLOSED, DOUBLED-BACK polyline (§6) —
 * out along the skeleton and back along itself. A stroked glyph contour has
 * the same ring topology: out along one side of the stroke, back along the
 * other. Pinning anchor 0 to the terminal that pairs with the trace's own
 * start makes the glyph's OUTER edge correspond to the outbound leg and its
 * INNER edge to the return leg. Verified for both letters against the emitted
 * anchor order — M runs bottom-left, up the outer left, over the apex, down to
 * bottom-right, then back along the inner edge; S runs top-right terminal,
 * down the inner edge to the bottom terminal, then back up the outer. Pick a
 * different anchor and the two rings still interpolate, but they interpolate
 * across the stroke instead of along it, which is what a folded morph is.
 */
const PINNED_START = {
  /** Bottom-left extreme: least x, then least y. Lands on `(80, 0)`. */
  M: (pts) =>
    pts.reduce(
      (best, p, i) =>
        p[0] < pts[best][0] || (p[0] === pts[best][0] && p[1] < pts[best][1]) ? i : best,
      0,
    ),
  /**
   * Top-right terminal: the greatest x among anchors in the UPPER HALF of the
   * cap, then the greatest y among ties. Lands on `(550, 498)`, the outer
   * corner where the top-right stroke end meets its flat cut.
   *
   * The upper-half restriction is what makes this the *terminal* rather than
   * the glyph's global right extreme — that is `(564, 191)`, which is on the
   * BOTTOM half of the S, and pinning there would start the morph at the wrong
   * end of the letter.
   */
  S: (pts) =>
    pts.reduce((best, p, i) => {
      if (p[1] <= 350) return best;
      if (pts[best][1] <= 350) return i;
      if (p[0] > pts[best][0]) return i;
      if (p[0] === pts[best][0] && p[1] > pts[best][1]) return i;
      return best;
    }, 0),
};

/** Coordinates are rounded to this many decimals in the emitted path data. */
const PRECISION = 2;

const round = (n) => {
  const r = Number(n.toFixed(PRECISION));
  return Object.is(r, -0) ? 0 : r;
};

/**
 * `o` string -> contours of absolute segments.
 *
 * Each contour is `{ start: [x, y], segs: [...] }` where every segment records
 * its END point last, so a contour is a closed ring of anchors and rotating it
 * is an array rotation rather than a re-parse.
 */
function parseOutline(o) {
  const t = o.trim().split(/\s+/);
  const contours = [];
  let current = null;

  for (let i = 0; i < t.length; ) {
    const cmd = t[i++];
    const num = () => Number(t[i++]);

    if (cmd === "m") {
      const x = num();
      const y = num();
      current = { start: [x, y], segs: [] };
      contours.push(current);
    } else if (cmd === "l") {
      const x = num();
      const y = num();
      current.segs.push({ type: "L", ctrl: [], end: [x, y] });
    } else if (cmd === "q") {
      // END POINT FIRST, then the control point. See the header.
      const x = num();
      const y = num();
      const cx = num();
      const cy = num();
      current.segs.push({ type: "Q", ctrl: [[cx, cy]], end: [x, y] });
    } else if (cmd === "b") {
      const x = num();
      const y = num();
      const c1x = num();
      const c1y = num();
      const c2x = num();
      const c2y = num();
      current.segs.push({
        type: "C",
        ctrl: [
          [c1x, c1y],
          [c2x, c2y],
        ],
        end: [x, y],
      });
    } else if (cmd === "z" || cmd === "Z") {
      // Contours are implicitly closed by `toPathData`; an explicit close is a
      // no-op rather than an error.
    } else {
      throw new Error(`Unknown outline command "${cmd}"`);
    }
  }

  return contours;
}

const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;

/**
 * Drop zero-length line segments.
 *
 * The converter emits a defensive `l <last point>` after most curve runs, so
 * roughly half of `S`'s twenty `lineTo`s are degenerate — they restate the pen
 * position and draw nothing. They are invisible when rendered and actively
 * harmful when morphed: each one is an extra anchor coincident with its
 * neighbour, and MorphSVG has to find a partner for it in the target shape.
 * Stripping them is the cheapest thing available that improves the morph's
 * topology, and it changes no rendered pixel.
 *
 * It does NOT change the asset. `public/fonts/README.md`'s regression table
 * counts commands in the JSON; this counts anchors in the derived path.
 */
function stripDegenerate(contour) {
  const segs = [];
  let pen = contour.start;
  for (const seg of contour.segs) {
    if (seg.type === "L" && same(seg.end, pen)) continue;
    segs.push(seg);
    pen = seg.end;
  }
  // The final segment restating the move-to point is the contour's own closure,
  // which `Z` expresses; keeping it would double the start anchor.
  while (segs.length && segs[segs.length - 1].type === "L" && same(segs[segs.length - 1].end, contour.start)) {
    segs.pop();
  }
  return { start: contour.start, segs };
}

/**
 * Rotate a closed contour so that anchor `k` becomes its start point.
 *
 * A closed contour of N anchors is a ring of N segments — segment j runs
 * anchors[j] -> anchors[(j+1) % N]. The source data states the closing segment
 * explicitly when it is a curve and leaves it implicit when it is a line, so
 * the ring is completed here before rotating and re-opened afterwards.
 */
function rotate(contour, k) {
  const anchors = anchorsOf(contour);
  const n = anchors.length;
  const ring = contour.segs.slice();
  if (ring.length === n - 1) ring.push({ type: "L", ctrl: [], end: anchors[0] });
  if (ring.length !== n) throw new Error(`Contour ring is ${ring.length} segments for ${n} anchors`);
  if (k === 0) return contour;

  const segs = [];
  for (let j = 0; j < n; j++) segs.push(ring[(k + j) % n]);
  // The final segment returns to the new start point. If it is a plain line,
  // `Z` already draws it and stating it would duplicate the start anchor.
  if (segs[segs.length - 1].type === "L") segs.pop();
  return { start: anchors[k], segs };
}

/**
 * The contour's ring of anchors, start included exactly once.
 *
 * A rotated contour whose closing segment is a curve has to STATE that curve,
 * so its final segment ends back on the start point. That is one segment, not
 * one extra anchor, and counting it twice would misreport the number MorphSVG
 * actually works with.
 */
function anchorsOf(contour) {
  const pts = [contour.start, ...contour.segs.map((s) => s.end)];
  if (pts.length > 1 && same(pts[pts.length - 1], pts[0])) pts.pop();
  return pts;
}

function toPathData(contours) {
  const out = [];
  for (const c of contours) {
    out.push(`M${round(c.start[0])} ${round(c.start[1])}`);
    for (const seg of c.segs) {
      const nums = [...seg.ctrl, seg.end].flat().map(round);
      out.push(`${seg.type}${nums.join(" ")}`);
    }
    out.push("Z");
  }
  return out.join("");
}

/* ------------------------------------------------------------------------- */

const font = JSON.parse(readFileSync(FONT_JSON, "utf8"));

const heroSource = readFileSync(HERO_CONTENT, "utf8");
const nameMatch = heroSource.match(/HERO_NAME\s*=\s*"([^"]+)"/);
if (!nameMatch) throw new Error("Could not read HERO_NAME out of heroContent.ts");
const NAME = nameMatch[1];

const chars = [...new Set([...NAME])].filter((ch) => ch !== " ").sort();
const missing = chars.filter((ch) => !font.glyphs[ch]);
if (missing.length) {
  throw new Error(
    `Glyphs missing from the typeface asset: ${missing.join(", ")}. ` +
      `Regenerate it per public/fonts/README.md.`,
  );
}

const spaceAdvance = font.glyphs[" "]?.ha;
if (typeof spaceAdvance !== "number") throw new Error("No advance width for the space glyph");

const entries = [];
const report = [];

for (const ch of chars) {
  const glyph = font.glyphs[ch];
  const raw = parseOutline(glyph.o);
  const rawAnchors = raw.reduce((n, c) => n + anchorsOf(c).length, 0);
  let contours = raw.map(stripDegenerate);

  if (PINNED_START[ch]) {
    if (contours.length !== 1) {
      throw new Error(
        `"${ch}" has ${contours.length} contours. The 1-to-1 morph topology in ` +
          `ms-mark-design.md §6 assumes one. Stop and re-read F-7 before continuing.`,
      );
    }
    const anchors = anchorsOf(contours[0]);
    const k = PINNED_START[ch](anchors);
    contours = [rotate(contours[0], k)];
    report.push({
      ch,
      anchors: anchorsOf(contours[0]).length,
      rawAnchors,
      startIndex: k,
      startPoint: anchors[k],
    });
  }

  entries.push({
    ch,
    ha: glyph.ha,
    xMin: glyph.x_min,
    xMax: glyph.x_max,
    d: toPathData(contours),
  });
}

const lit = (s) => JSON.stringify(s);

const banner = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 *   node scripts/extract-glyph-outlines.mjs
 *
 * Space Grotesk glyph outlines for the Intro's NAME, converted once at build
 * time from \`public/fonts/space-grotesk-latin.typeface.json\`. See that file's
 * README for the asset's provenance and
 * \`scripts/extract-glyph-outlines.mjs\` for what this conversion does and why
 * it is not done in the browser.
 *
 * COORDINATES ARE FONT UNITS WITH Y UP, baseline at y = 0, glyph origin at
 * x = 0 — the font's own space, not the mark's viewBox.
 * \`components/ui/msMarkGeometry.ts\` places them, and it is the module
 * everything else imports; nothing should read this file directly.
 *
 * EVERY COMMAND IS ABSOLUTE (\`M\`/\`L\`/\`Q\`/\`C\`/\`Z\`). That is relied upon:
 * it is what lets a path be transformed by walking its numbers in x,y pairs
 * without a path parser.
 *
 * ONLY THE GLYPHS \`HERO_NAME\` NEEDS ARE EMITTED. \`SOURCE_NAME\` below records
 * the string they were generated for, and \`msMarkGeometry.ts\` checks it
 * against the live \`HERO_NAME\` in development — a renamed hero would
 * otherwise lose letters silently.
 */`;

const body = `${banner}

/** The string these glyphs were generated for. */
export const SOURCE_NAME = ${lit(NAME)};

/** Font units per em, from the asset's own \`resolution\`. */
export const UNITS_PER_EM = ${font.resolution};

/** OS/2 cap height, in font units. Every size in the mark is stated against
 *  cap height rather than em, because cap height is what the eye measures. */
export const CAP_HEIGHT = 700;

/** Advance width of the space glyph, in font units. It has no outline, so it
 *  is carried separately rather than as an entry with an empty \`d\`. */
export const SPACE_ADVANCE = ${spaceAdvance};

export type Glyph = {
  /** Advance width in font units. */
  readonly ha: number;
  /**
   * Ink bounds in font units. The mark anchors each capital by its \`xMin\`
   * rather than by its advance origin, so the trace a letter becomes starts on
   * the same vertical the letterform did — a left side bearing carried into the
   * morph would offset the whole shape by a few units for no reason.
   */
  readonly xMin: number;
  readonly xMax: number;
  /** Absolute-only SVG path data in font units, Y UP, baseline y = 0. */
  readonly d: string;
};

export const GLYPHS: Readonly<Record<string, Glyph>> = {
${entries
  .map(
    (e) =>
      `  ${lit(e.ch)}: { ha: ${e.ha}, xMin: ${e.xMin}, xMax: ${e.xMax}, d: ${lit(e.d)} },`,
  )
  .join("\n")}
};

export default GLYPHS;
`;

writeFileSync(OUT, body.replace(/\r?\n/g, "\n"), "utf8");

console.log(`Wrote ${OUT}`);
console.log(`  name           ${JSON.stringify(NAME)}`);
console.log(`  glyphs emitted ${chars.join(" ")}`);
for (const r of report) {
  console.log(
    `  ${r.ch}: ${r.anchors} anchors (was ${r.rawAnchors} before degenerate strip), ` +
      `start pinned to index ${r.startIndex} at (${r.startPoint.join(", ")})`,
  );
}
