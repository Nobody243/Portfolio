/**
 * THE MARK'S GEOMETRY, and the Intro morph's other half.
 *
 * One dataset, no component, no React. `MonogramMark` renders it, `Intro`
 * animates it, and every number either side of the morph is stated here so the
 * two ends cannot drift apart. `docs/07_SITE_RESTRUCTURE.md` §3.1 asks for
 * exactly that — "one dataset then holds both the source and the target of the
 * morph" — and `.claude/handoff/ms-mark-design.md` F-3 records that the mark is
 * one artifact with no build smell to raise.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE MARK IS A CIRCUIT TRACE, NOT A LETTERFORM. M and S are drawn as thin
 * connected segments with node dots at the joints, echoing `ParticleGrid`'s
 * material — hairline links, dots at the junctions, dots carrying more weight
 * than the links. What is NOT borrowed is the field's randomness: every segment
 * here is horizontal, vertical, or a true 45°, which is PCB routing discipline
 * and is what makes the mark read as *routed* rather than *drawn*. A mark of
 * arbitrary-angle segments would be a screenshot of the background, not a logo.
 *
 * HOW IT SURVIVES 17px, which is the constraint that shapes everything below.
 * The navbar renders the mark at `h-[17px]` against `VB_H = 320` — 18.8 viewBox
 * units per CSS pixel. Any stroke authored in viewBox units is multiplied by
 * 0.053 on the way to the screen, so a 2.25-unit rim becomes 0.12px and
 * disappears. `vector-effect="non-scaling-stroke"` resolves the stroke in the
 * coordinate system in effect BEFORE the viewBox transform, so weight is
 * authored and rendered in CSS PIXELS and the scale factor never touches it.
 *
 * This is not a workaround for the small case; it inverts the relationship in
 * the right direction. Stroke weight stops being a scale artifact and becomes a
 * variant-level design parameter — one CSS custom property, `--ms-stroke`, set
 * on the `<svg>` root and inherited by every child. Without it every responsive
 * instance would silently re-weight the logo at each breakpoint.
 *
 * `MonogramMark.tsx`'s STANDING OBJECTION IS TRUE BUT SCOPED, and it is kept
 * there rather than deleted: outlined letterforms really do turn to mush at nav
 * size *when the stroke scales with the viewBox*. These do not. Anyone
 * authoring a rim in user units will hit the original wall exactly as described.
 *
 * NODE DOTS ARE ROUND-CAPPED MICRO-SEGMENTS, NEVER `<circle>`. `r` is in user
 * units and `non-scaling-stroke` governs the stroke, not the fill geometry — an
 * 8-unit-radius circle renders at 0.42px in the navbar, which reintroduces the
 * exact failure the traces just escaped. A round cap projects a semicircle of
 * radius strokeWidth/2 past each endpoint, so a `l.01 0` subpath renders a disc
 * whose diameter IS the stroke width, in CSS pixels, at every size. Dot size
 * becomes a second non-scaling number rather than a geometric radius.
 *
 * `l.01 0` and not a zero-length `L`: the spec's handling of zero-length
 * subpaths with round caps is correct on paper and has a history of being
 * dropped by rasterisers. 0.01 units is 0.0005px at nav scale — a circle for
 * all practical purposes, and impossible to optimise away.
 * ─────────────────────────────────────────────────────────────────────────
 */

import {
  CAP_HEIGHT,
  GLYPHS,
  SOURCE_NAME,
  SPACE_ADVANCE,
} from "@/components/ui/msMarkGlyphs";
import { HERO_NAME } from "@/components/hero/heroContent";

/* -------------------------------------------------------------------------
   The box. ONE viewBox for every variant and every state.

   `MonogramMark.tsx` has always claimed "identical viewBox proportions" as the
   actual same-mark claim, and the shipped code contradicted it four lines
   below: `VB_W = { intro: 560, nav: 420 }` against a shared `VB_H = 320` —
   1.75:1 against 1.31:1. The intro box was padded so the glass rim and
   turbulence had bleed room. That dressing is gone, the bleed is solved by
   geometry inset instead, and the claim is true for the first time.

   `Intro.tsx` USED TO MIRROR THIS, as `MARK_VB_W = 560`, under a comment
   reading "MIRRORED FROM `MonogramMark.tsx` AND ONLY VALID WHILE THEY MATCH".
   It imports the value now, so the mirror — and the silent drift its own
   comment predicted — is gone rather than merely re-synced.
------------------------------------------------------------------------- */
export const VB_W = 592;
export const VB_H = 320;

/**
 * Every edge is inset by one module, and the number is stroke-bleed clearance
 * rather than aesthetic padding. The widest paint anywhere is the nav node dot
 * at 2.75px, whose half-width is 1.375px = 25.9 viewBox units at nav scale.
 * 32 clears it with six units to spare, which is what lets the SVG ship with no
 * `overflow: visible` and no per-variant box padding — the thing that killed
 * the old mark's single-viewBox claim.
 */
export const INSET = 32;

/** Cap height in viewBox units: y 32 → 288, exactly eight modules of 32. Every
 *  coordinate below is a multiple of 16 — half a module — and that is a
 *  checkable invariant, not a stylistic note. */
export const CAP = VB_H - INSET * 2;

/** The baseline. Everything in the mark and in the Intro's name sits on it. */
export const BASELINE = VB_H - INSET;

/**
 * THE CONTRACTION POINT — horizontal centre, ON THE BASELINE. Not the bounding
 * box centre `(296, 160)`, and not a node.
 *
 * Promoted to `docs/07` §3.2 because it constrains layout and not just motion.
 * Two things follow from it that are easy to miss:
 *
 *   1. WHY NOT THE BOX CENTRE. Collapsing toward y = 160 makes the mark cross
 *      itself — M1 `(32,288)` travels UP while M2 `(32,32)` travels DOWN, so
 *      the left stem passes through itself for roughly 150ms. That is a
 *      scribble arriving at exactly the beat the spec wants to read as
 *      deliberate. On the baseline every one of the eleven nodes travels
 *      monotonically down-and-inward or straight along it; nothing crosses
 *      anything, and the read is drainage along a route.
 *   2. THE MARK IS POSITIONED BY THIS POINT, NOT BY ITS BOX. `(296, 288)` is
 *      what sits at dead viewport centre during the Intro, which puts the box
 *      centre 128 units — about 193px at Intro scale — ABOVE centre. The mark
 *      visibly hangs upper-middle with its baseline through the middle of the
 *      screen. That is the intended composition, not an offset to correct.
 *
 * `x = 296` is the horizontal centre of the drawn box AND falls inside the
 * 112-unit letter gap, so the mark drains into its own seam: the final frame is
 * a single dot where the M and the S shake hands.
 */
export const CONTRACT_X = 296;
export const CONTRACT_Y = BASELINE;

export type MarkLetter = "m" | "s";

/* -------------------------------------------------------------------------
   The traces.

   M — 5 vertices, 4 segments, both diagonals exactly 45° (Δ112, Δ112). The apex
   sits at y = 144, which is 44% down the cap height and deliberately shallow: a
   deep display-M vertex closes its two diagonals into a solid wedge once the
   strokes are 1.25px on a 13.6px cap. At 44% the aperture stays open at nav
   size.

   S — 6 vertices, 5 segments, orthogonal. The M carries the 45°s; a real board
   mixes orthogonal runs with 45° corners freely. THE THREE HORIZONTAL BARS ARE
   DELIBERATELY UNEQUAL — 160 / 112 / 144, top to bottom. A seven-segment digit
   has all three equal, and equal bars are exactly what makes a squared S read
   as a blocky LED glyph. The two overhanging terminals (S1 overhangs the right
   stem by 48 units, S6 the left stem by 32) are the single detail doing the
   most work to keep this from looking like a digit.

   THE GAP IS 112 UNITS and it, not the stroke width, sets the minimum legible
   render size: at 17px it is 5.95px of centreline separation, and subtracting
   the two facing node dots leaves 3.2px of clear air — just above the ~3px
   floor at which a letter pair starts to fuse. See `MIN_HEIGHT_PX`.
------------------------------------------------------------------------- */

/** Vertices in drawing order. The node dots are these points and nothing else:
 *  joints and terminals only, no midpoints — eleven in total.
 *
 *  MIDPOINTS ARE EXCLUDED BY ARITHMETIC, NOT BY TASTE. The binding constraint
 *  at nav size is dot separation, not stroke width. The tightest segment is the
 *  S waist at 112 units = 5.95px, leaving 3.20px clear between 2.75px dots.
 *  Adding midpoints halves that: 2.98px between dot CENTRES against a 2.75px
 *  dot DIAMETER — the dots would touch and the waist would render as a
 *  caterpillar. Since one geometry serves every size, unavailable at nav means
 *  unavailable everywhere. It is also what a circuit actually looks like: pads
 *  sit where traces change direction or terminate, not at arbitrary points
 *  along a run. */
export const VERTICES: Readonly<Record<MarkLetter, readonly (readonly [number, number])[]>> = {
  m: [
    [32, 288], // M1 bottom-left terminal
    [32, 32], // M2 top-left
    [144, 144], // M3 apex
    [256, 32], // M4 top-right
    [256, 288], // M5 bottom-right terminal
  ],
  s: [
    [560, 32], // S1 top-right terminal
    [400, 32], // S2 top-left corner
    [400, 160], // S3 waist-left
    [512, 160], // S4 waist-right
    [512, 288], // S5 bottom-right
    [368, 288], // S6 bottom-left terminal
  ],
};

/**
 * THE TRACES ARE CLOSED, DOUBLED-BACK POLYLINES — walked out along the
 * skeleton and back along the identical vertices, then closed.
 *
 * The return leg lies exactly on the outbound leg, so this renders
 * pixel-identical to the open polyline when stroked. What it buys is the morph:
 * a glyph contour ends with `Z` and a polyline does not, so open-vs-closed is
 * the one topology mismatch that would otherwise exist. Closing both ends it,
 * and the point counts rise from 5 and 6 to 9 and 11 against glyph contours of
 * 16 and 39 — a far better match, and better matches are what make a morph read
 * as deformation rather than as replacement.
 *
 * TWO CONSEQUENCES THAT MUST NOT BE FORGOTTEN:
 *   - NEVER fade the mark with `stroke-opacity`. The doubled path compounds
 *     with itself and reads denser than intended. Fade the GROUP's `opacity`,
 *     which composites once.
 *   - EVERY JOIN AND CAP IS ROUND. With `stroke-linejoin: miter` the 180°
 *     turnaround at M5 and S6 produces an infinite spike.
 *
 * One string per letter, used by every instance including the navbar. Two `d`
 * strings for the same visual shape is a divergence waiting to happen.
 */
function doubledBack(points: readonly (readonly [number, number])[]): string {
  const out = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`);
  for (let i = points.length - 2; i >= 1; i--) out.push(`L${points[i][0]} ${points[i][1]}`);
  return `${out.join("")}Z`;
}

export const TRACE: Readonly<Record<MarkLetter, string>> = {
  m: doubledBack(VERTICES.m),
  s: doubledBack(VERTICES.s),
};

/** One subpath per node, in the trace's own drawing order — which is what the
 *  Intro's power-up stagger keys off. Separate paths rather than one per
 *  letter, because the stagger needs a handle on each dot and eleven
 *  three-command paths cost nothing at any size. */
export const NODES: Readonly<Record<MarkLetter, readonly string[]>> = {
  m: VERTICES.m.map(([x, y]) => `M${x} ${y}l.01 0`),
  s: VERTICES.s.map(([x, y]) => `M${x} ${y}l.01 0`),
};

/* -------------------------------------------------------------------------
   Weight.
------------------------------------------------------------------------- */

/**
 * `--ms-stroke` from cap height, both in CSS pixels.
 *
 * THE EXPONENT IS DERIVED, NOT TUNED. Cap height spans 13.6px (nav) to ~386px
 * (Intro at 1440) — 28.4× — while the weight should span 1.25px to 10px, which
 * is 8×. `ln 8 / ln 28.4 = 0.622`. Moving it moves one of the two anchors, and
 * both are load-bearing: 1.25px is the nav legibility floor, and 10px is the
 * heaviest the Intro mark can be before it stops reading as a routed trace.
 *
 * A CONSTANT ratio — the naive choice — would put the Intro stroke at 9.2% of
 * 386px = 35px. That is not a trace, it is a slab. Apparent weight has to fall
 * as size rises; it is the same optical sizing that makes a display cut of a
 * typeface lighter than its text cut.
 *
 * WHY 1.25px AT NAV, on two independent checks: below ~1px a stroke is entirely
 * antialiased and loses contrast against `bg-base` in light mode; and the mark
 * sits beside JetBrains Mono at `text-caption`, whose stems land around
 * 1.1–1.3px there. Matching the mono's stem weight is what makes the left
 * cluster read as one object rather than a logo parked next to some text — the
 * stronger of the two reasons, and one to re-check if `text-caption` changes.
 */
export const NAV_CAP_PX = 13.6;
export const NAV_STROKE_PX = 1.25;

export function msStroke(capPx: number): number {
  const w = NAV_STROKE_PX * Math.pow(capPx / NAV_CAP_PX, 0.62);
  return Math.min(12, Math.max(NAV_STROKE_PX, w));
}

/**
 * Node diameter as a multiple of trace weight.
 *
 * 2.2 is chosen so the difference survives a 1× DPR display. At 2.0× the nav
 * dot would be 2.50px against a 1.25px trace, and antialiasing largely eats a
 * 1.25px difference. At 2.2× the difference is 1.50px and clearly perceptible.
 * Above ~2.5× the dots start to bulge the corners into blobs at About size.
 *
 * If at 1× DPR and 17px the dots do not read as distinct beads on the traces,
 * raise this to 2.4. DO NOT thin the trace to manufacture the contrast — 1.25px
 * is the legibility floor and is not available as a variable.
 */
export const NODE_RATIO = 2.2;

/** Cap height is always 0.8 of the rendered SVG height (256 of 320 units). */
export function capFromHeight(heightPx: number): number {
  return heightPx * (CAP / VB_H);
}

/**
 * The mark's minimum legible rendered height, and it is pass/fail rather than a
 * preference. `docs/07` §2.1 promotes it out of the design brief because it
 * binds the navbar, About, the reveal footer and any future favicon or OG use.
 *
 * The binding number is the 112-unit letter gap: keeping 3px of clear air
 * between the two facing node dots needs 112 / (3 + 2.75) = 19.48 units per
 * pixel, i.e. ≥ 16.4px of rendered height. The navbar's 17px has 0.6px of
 * margin. 16px fuses the pair; 14px is illegible. Anything that renders the
 * mark smaller than this is a design change, not a layout tweak.
 */
export const MIN_HEIGHT_PX = 16.4;

/** The navbar's instance. Do not reduce it — see `MIN_HEIGHT_PX`. */
export const NAV_HEIGHT_PX = 17;

/* -------------------------------------------------------------------------
   The Intro's name — the morph's SOURCE half.

   "Muhammad Saad" is thirteen glyphs and the mark is two letters. There is NO
   13→2 morph here, and attempting one would read as mush at exactly the
   midpoint the spec most wants legible.

   THE CAPITAL M OF "Muhammad" MORPHS INTO THE MARK'S M; THE CAPITAL S OF
   "Saad" MORPHS INTO THE MARK'S S. One-to-one, twice. The other eleven glyphs
   never morph — they translate toward their own word's capital and fade, so
   each word visibly COLLAPSES INTO ITS OWN INITIAL. That is not a shortcut, it
   is the concept made literal: a monogram is the initials that survived.

   EVERYTHING IS STROKED AND NOTHING IS EVER FILLED. Fill and stroke do not
   interpolate into each other, so a filled name would force a paint-mode swap
   mid-timeline, and any dressing of that swap is the crossfade `docs/07` §3
   step 2 explicitly rules out. Keeping one paint mode from the first frame to
   the last is what makes "a becoming, not a crossfade" true rather than
   aspirational — and it means the name is already made of the same thin lines
   the mark is, so step 2 changes SHAPE ONLY.
------------------------------------------------------------------------- */

/**
 * Font units → viewBox units. Sized so a glyph's cap height equals the trace's:
 * 700 font units become 256 viewBox units. The glyph M is then 258 units wide
 * against the trace M's 224, and the glyph S 189 against 192 — close enough
 * that the morph is a deformation rather than a resize.
 */
const K = CAP / CAP_HEIGHT;

/**
 * The name is laid out to fill the drawn box exactly — 528 units, inset to
 * inset — which fixes its scale without a magic number and keeps it inside the
 * viewBox at every viewport. At the Intro's desktop size that is a cap height
 * of roughly 54px, within a pixel or two of what the outgoing DOM name rendered
 * at (`text-h2`, 68px type, 47.6px cap), so the opening beat is not quietly
 * larger or smaller than the one it replaces.
 *
 * `ms-mark-design.md` §5 estimates this cap at "~90px at desktop" and derives a
 * 4px stroke from it. That estimate assumed an Intro mark 893px wide, which is
 * itself inconsistent with the same section's `min(62vw, 720px)` rule — `min`
 * of those two at 1440 is 720, not 893. The RULE is kept and the estimate is
 * not: every weight here comes from `msStroke()` applied to the cap height that
 * is actually rendered, which is the section's own stated mechanism.
 */
const NAME_WIDTH = VB_W - INSET * 2;

export type IntroGlyph = {
  readonly char: string;
  /** Set for the two capitals that morph; `null` for the eleven that do not. */
  readonly letter: MarkLetter | null;
  /** Outline path in viewBox units, anchored at its MARK position. */
  readonly d: string;
  /** x of this glyph's ink origin in the settled mark's space. */
  readonly markX: number;
  /** x of the same origin in the opening name layout. */
  readonly nameX: number;
  /** x of this glyph's word's capital, in mark space. */
  readonly wordX: number;
  /**
   * x of this glyph's word's capital in the NAME layout — where a non-initial
   * collapses to.
   *
   * It collapses onto where the capital STARTED, not onto where the capital is
   * going. The two happen at once: the word closes up on itself at name scale
   * while its initial simultaneously travels off and grows into the mark. A
   * non-initial chasing a moving target would read as the word being dragged
   * rather than as the word being reduced.
   */
  readonly wordNameX: number;
  /** Index within the word, counted from the word's END. The fade is staggered
   *  outward-in: the last letter of each word goes first. Inward-out leaves the
   *  two capitals momentarily alone with a gap where the word was, which reads
   *  as deletion rather than as reduction. */
  readonly fadeOrder: number;
};

/**
 * Scale + translate an absolute-only path by walking its numbers in x,y pairs.
 *
 * Correct ONLY because `msMarkGlyphs.ts` emits nothing but absolute `M`/`L`/
 * `Q`/`C`/`Z`, in which every number is a coordinate and they alternate x,y
 * from the first one. That property is stated in the generator's header and is
 * the reason there is no path parser on the client.
 *
 * `y` is negated as well as scaled: font units are Y-UP, SVG is Y-DOWN.
 */
function placePath(d: string, tx: number, ty: number, k: number): string {
  let axis = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => {
    const v = Number(n);
    const out = axis === 0 ? tx + v * k : ty - v * k;
    axis ^= 1;
    return String(Math.round(out * 100) / 100);
  });
}

/**
 * WHERE THE TWO CAPITALS SIT IN THE SETTLED MARK. Each word is anchored so its
 * capital's ink starts on the same vertical as the trace it becomes: the M's
 * left edge at x = 32, the S's at x = 368.
 */
const LETTER_ORIGIN: Record<MarkLetter, number> = {
  m: INSET,
  s: VERTICES.s[5][0], // S6, the S's leftmost point
};

function buildIntroGlyphs(): readonly IntroGlyph[] {
  const chars = [...HERO_NAME];

  // Advance widths first: the name's total width sets its scale, and each
  // glyph's pen offset is needed in two coordinate systems.
  const advance = (ch: string) => (ch === " " ? SPACE_ADVANCE : (GLYPHS[ch]?.ha ?? 0));
  const total = chars.reduce((sum, ch) => sum + advance(ch), 0);
  const nameScale = total > 0 ? NAME_WIDTH / total : K;

  // Word bookkeeping: which word each character belongs to, its pen offset
  // within that word, and which letter of the mark the word's capital becomes.
  const wordOf: number[] = [];
  const penInWord: number[] = [];
  const penInName: number[] = [];
  const wordLengths: number[] = [];
  let word = -1;
  let wordPen = 0;
  let namePen = 0;
  let atWordStart = true;

  for (const ch of chars) {
    if (ch === " ") {
      atWordStart = true;
      wordOf.push(-1);
      penInWord.push(0);
      penInName.push(namePen);
      namePen += advance(ch);
      continue;
    }
    if (atWordStart) {
      word += 1;
      wordPen = 0;
      wordLengths.push(0);
      atWordStart = false;
    }
    wordOf.push(word);
    penInWord.push(wordPen);
    penInName.push(namePen);
    wordLengths[word] += 1;
    wordPen += advance(ch);
    namePen += advance(ch);
  }

  // Word 0's capital becomes the mark's M, word 1's the S. DERIVED FROM THE
  // STRING, never written down as a pair of indices — `HERO_NAME` is content
  // and content moves.
  const markLetters: MarkLetter[] = ["m", "s"];
  const wordOrigin = markLetters.map((letter, w) => {
    const capital = chars[wordOf.indexOf(w)];
    const xMin = GLYPHS[capital]?.xMin ?? 0;
    return LETTER_ORIGIN[letter] - xMin * K;
  });

  // Where each word's capital sits in the opening name layout — the point the
  // rest of that word collapses onto.
  const wordNameOrigin = wordOrigin.map((_, w) => INSET + penInName[wordOf.indexOf(w)] * nameScale);

  const out: IntroGlyph[] = [];
  let seenInWord = 0;
  let lastWord = -1;

  chars.forEach((ch, i) => {
    const glyph = GLYPHS[ch];
    const w = wordOf[i];
    if (!glyph || w < 0) return; // the space carries advance, never ink

    if (w !== lastWord) {
      seenInWord = 0;
      lastWord = w;
    }
    const isCapital = seenInWord === 0;
    seenInWord += 1;

    const markX = wordOrigin[w] + penInWord[i] * K;
    const nameX = INSET + penInName[i] * nameScale;

    out.push({
      char: ch,
      letter: isCapital ? (markLetters[w] ?? null) : null,
      d: placePath(glyph.d, markX, BASELINE, K),
      markX,
      nameX,
      wordX: wordOrigin[w],
      wordNameX: wordNameOrigin[w],
      fadeOrder: wordLengths[w] - seenInWord,
    });
  });

  return out;
}

export const INTRO_GLYPHS = buildIntroGlyphs();

/** The two capitals that morph, by the mark letter each becomes. */
export const INTRO_INITIALS: Readonly<Record<MarkLetter, IntroGlyph>> = {
  m: INTRO_GLYPHS.find((g) => g.letter === "m") as IntroGlyph,
  s: INTRO_GLYPHS.find((g) => g.letter === "s") as IntroGlyph,
};

/** The eleven that do not — in document order, which is the order they are
 *  rendered in and the order `fadeOrder` is applied against. */
export const INTRO_REST = INTRO_GLYPHS.filter((g) => g.letter === null);

/**
 * How much smaller the opening name is than the settled mark, as a scale
 * factor on each glyph group. The two capitals tween from this to 1 while the
 * morph runs; the other eleven hold it and fade, because a non-initial that
 * also grew would be near full size at the moment it is supposed to be
 * disappearing.
 */
export const NAME_SCALE = (() => {
  const total = [...HERO_NAME].reduce(
    (sum, ch) => sum + (ch === " " ? SPACE_ADVANCE : (GLYPHS[ch]?.ha ?? 0)),
    0,
  );
  return total > 0 ? NAME_WIDTH / total / K : 1;
})();

/** Cap height of the opening name, in viewBox units. `Intro.tsx` converts it to
 *  pixels against the rendered box and feeds it to `msStroke()`. */
export const NAME_CAP_UNITS = CAP * NAME_SCALE;

/**
 * The glyph dataset is generated for one specific string. A hero rename would
 * otherwise drop letters from the Intro silently — the layout would still run,
 * just with holes in it.
 */
if (process.env.NODE_ENV !== "production" && SOURCE_NAME !== HERO_NAME) {
  console.error(
    `[msMarkGeometry] HERO_NAME is "${HERO_NAME}" but the glyph outlines were ` +
      `generated for "${SOURCE_NAME}". Run: node scripts/extract-glyph-outlines.mjs`,
  );
}
