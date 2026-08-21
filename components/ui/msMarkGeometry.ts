/**
 * THE MARK'S GEOMETRY, and the Intro's name layout.
 *
 * One dataset, no component, no React. `MonogramMark` renders it, `Intro`
 * animates it, and every number either side of the merge is stated here so the
 * two ends cannot drift apart.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE MARK IS FACETED, FILLED SHAPES — six polygons: ONE for the M and five
 * for the S, every edge orthogonal or a true 45°. It replaces a
 * circuit-trace mark built from thin strokes and node dots, and the replacement
 * is structural rather than stylistic. `.claude/handoff/ms-mark-faceted-design.md`
 * carries the full argument; the operative half of it is this:
 *
 *   `MonogramMark.tsx`'s ORIGINAL objection was that a rim authored in viewBox
 *   units is 0.15 CSS pixels at nav size, and that OUTLINED letterforms do not
 *   survive that reduction while FILLED ones do. The trace mark answered it
 *   with `vector-effect="non-scaling-stroke"`, which is true but bought a
 *   second problem each time: a stroke ramp during the contraction (because a
 *   non-scaling stroke thickens into a blob as its geometry collapses), node
 *   dots as round-capped micro-segments (because `r` is in user units), a
 *   minimum-height floor derived from dot clearance, and finally an extra
 *   terminal flag on the S because a stroked S and a stroked 5 are the same
 *   skeleton in a 0/45/90 vocabulary.
 *
 *   FILLED SHAPES DO NOT HAVE THE PROBLEM TO BEGIN WITH. Ink scales with the
 *   mark, so there is nothing to hold constant and nothing to ramp. At the
 *   navbar's 17px the bars are 2.98px wide against the trace mark's 1.25px.
 *
 * WHAT IS RETIRED WITH IT, so it is not reintroduced by halves: `--ms-stroke`,
 * `--ms-node`, `msStroke()`, `NODE_RATIO`, `capFromHeight()`, `VERTICES`,
 * `TRACE`, `NODES`, the twelve node dots and every count derived from them.
 * Nothing in this module is stroked. If a future variant needs a rim, note that
 * the original objection still binds for anything authored in USER UNITS.
 *
 * S-VS-5 IS STRUCTURAL NOW, NOT PATCHED. The S carries two 45° chamfers,
 * top-right and bottom-left, diagonally opposite each other. That opposition is
 * the S's rotational character and is exactly what a 5 does not have — a 5 has
 * a square top-right terminal and a bowl at the bottom.
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

   Unchanged by the faceted rebuild, deliberately: keeping the box identical is
   what lets the Intro's positioning maths, the contraction point and the
   navbar's `h-[17px]` carry over without re-derivation.
------------------------------------------------------------------------- */
export const VB_W = 592;
export const VB_H = 320;

/** Every edge is inset by one module. Content occupies x 32 → 560, y 32 → 288.
 *  With nothing stroked there is no bleed past the geometry at all, so the
 *  inset is now plain optical padding — and the SVG still ships with no
 *  `overflow: visible` and no per-variant box padding. */
export const INSET = 32;

/** Cap height in viewBox units: y 32 → 288, exactly eight modules of 32. */
export const CAP = VB_H - INSET * 2;

/** The baseline. Everything in the mark and in the Intro's name sits on it. */
export const BASELINE = VB_H - INSET;

/* -------------------------------------------------------------------------
   Module sizes. Every coordinate below is built from these four and INSET.

   | Quantity        | Units | At nav (17px) |
   |-----------------|-------|---------------|
   | Cap height      | 256   | 13.60px       |
   | Bar thickness   |  56   |  2.98px       |
   | S bar gap       |  44   |  2.34px       |  <- tightest air in the mark
   | M → S gap       |  64   |  3.40px       |
   | M vee mouth     | 112   |  5.95px       |
   | 45° chamfer     |  56   |  2.98px       |
------------------------------------------------------------------------- */
/** Bar and stem thickness — the mark's one ink weight. */
export const BAR = 56;
/**
 * RETIRED, AND DELIBERATELY NOT DELETED YET.
 *
 * This was the clear air between the M's three bars, back when the M WAS three
 * bars, and `MIN_HEIGHT_PX` was derived from it as the tightest gap in the
 * mark. The M is now a single polygon with a vee, so it has no bar gaps at all
 * and this number measures nothing.
 *
 * The tightest air in the mark is now the S's 44-unit gap between its
 * horizontal bars — 2.34px at nav. See `MIN_HEIGHT_PX`, which is re-derived
 * from it.
 *
 * Nothing imports this. It is left for one commit so the rename is legible in
 * review; delete it on the next pass through this file.
 */
export const M_BAR_GAP = 40;
/** Clear air between the M and the S. Wider than the M's internal gaps, which
 *  is what keeps the pair reading as two letters rather than five bars. */
export const LETTER_GAP = 64;

/**
 * THE CONTRACTION POINT — horizontal centre, ON THE BASELINE. Not the bounding
 * box centre `(296, 160)`, and it is retained verbatim from the trace mark.
 *
 * Promoted to `docs/07` §3.2 because it constrains layout and not just motion.
 * Two things follow from it that are easy to miss:
 *
 *   1. WHY NOT THE BOX CENTRE. Collapsing toward y = 160 makes the mark cross
 *      itself — the M's stems and the vee between them travel in opposite
 *      vertical directions and pass through each other for roughly 150ms. That is a scribble arriving at
 *      exactly the beat the spec wants to read as deliberate. On the baseline
 *      every shape travels monotonically down-and-inward or straight along it;
 *      nothing crosses anything.
 *   2. THE MARK IS POSITIONED BY THIS POINT, NOT BY ITS BOX. `(296, 288)` is
 *      what sits at dead viewport centre during the Intro, which puts the box
 *      centre 128 units — about 193px at Intro scale — ABOVE centre. The mark
 *      visibly hangs upper-middle with its baseline through the middle of the
 *      screen. That is the intended composition, not an offset to correct.
 *
 * `x = 296` is the horizontal centre of the drawn box AND falls inside the
 * 64-unit letter gap (M ends at 280, S starts at 344), so the mark drains into
 * its own seam.
 */
export const CONTRACT_X = 296;
export const CONTRACT_Y = BASELINE;

export type MarkLetter = "m" | "s";

/* -------------------------------------------------------------------------
   THE SHAPES.

   M — ONE polygon: two stems joined by a vee. THE VEE IS WHAT MAKES IT AN M.
   Its mouth is 112 units across at the top and it descends 184 units, which is
   5.95px and 9.78px at nav.

   IT WAS THREE BARS FOR ONE COMMIT AND THAT FAILED, so the reason is recorded
   rather than left to be rediscovered. The first faceted M was three separate
   quadrilaterals with 45° cuts on their tops, on the theory that the cuts alone
   would carry the letter. Rendered at the real 17px and magnified from THAT
   raster, it read as three vertical strokes: a 56-unit cut is 2.98px at nav,
   and a diagonal that small with nothing on the far side of it is not a
   diagonal to the eye, it is a slightly soft corner.

   The stems are shared with H, N and U. What makes the letter is the vee
   between them, and a cut has to MEET something to read as a stroke.

   S — five quadrilaterals: three horizontal bars at y 32–88, 132–188 and
   232–288, with the two 44-unit gaps between them bridged on ALTERNATING sides
   by the two stems. The two 45° chamfers sit diagonally opposite — top-right on
   the top bar, bottom-left on the bottom bar — and they are the whole S-vs-5
   argument.

   S IS NARROWER THAN M BY DESIGN — 216 against 248. Space Grotesk's own
   advances are 613 and 865, a far wider ratio; 216:248 is the monogram
   compromise, close enough to read as a pair and different enough not to look
   like a mistake.
------------------------------------------------------------------------- */
type Point = readonly [number, number];

const POLYGONS: Readonly<Record<MarkLetter, readonly (readonly Point[])[]>> = {
  // ONE POLYGON, NOT THREE BARS — and the reason is a measured failure, not a
  // preference.
  //
  // The first faceted M was three separate bars with 45° cuts on their tops,
  // on the theory that the cuts alone would carry the letter. Rendered at the
  // real 17px and blown up from that raster, it read as THREE VERTICAL
  // STROKES. The cuts are 56 units = 2.98px at nav; a diagonal that small,
  // with nothing on the other side of it, is not a diagonal to the eye, it is
  // a slightly soft corner.
  //
  // AN M IS THE V, NOT THE BARS. The stems are shared with H, N and U; what
  // makes the letter is the vee descending between them. Three bars cannot
  // produce one however their tops are cut, because the cut has to MEET
  // something to read as a stroke. Joining them into a single outline gives
  // the vee a depth of 184 units = 9.78px at nav — sixty times the area of the
  // chamfers it replaces, and the same argument that made filled shapes beat
  // strokes in the first place: at this scale only large features survive.
  //
  // Wound clockwise from the bottom-left. Stem width, overall width and the
  // baseline are unchanged, so nothing downstream re-derives.
  m: [
    [
      [32, 288], // bottom-left
      [32, 32], // up the left edge
      [100, 32], // flat top-left
      [156, 152], // vee, left arm outer
      [212, 32], // vee, right arm outer
      [280, 32], // flat top-right
      [280, 288], // down the right edge
      [224, 288], // bottom, right stem inner
      [224, 120], // up the right stem inner edge
      [180, 216], // vee, right arm inner
      [132, 216], // vee floor
      [88, 120], // vee, left arm inner
      [88, 288], // down the left stem inner edge
    ],
  ],
  s: [
    // top bar — 45° chamfer, TOP-RIGHT
    [
      [344, 32],
      [504, 32],
      [560, 88],
      [344, 88],
    ],
    // left stem — bridges the upper gap on the left
    [
      [344, 88],
      [400, 88],
      [400, 132],
      [344, 132],
    ],
    // middle bar
    [
      [344, 132],
      [560, 132],
      [560, 188],
      [344, 188],
    ],
    // right stem — bridges the lower gap on the right
    [
      [504, 188],
      [560, 188],
      [560, 232],
      [504, 232],
    ],
    // bottom bar — 45° chamfer, BOTTOM-LEFT
    [
      [344, 232],
      [560, 232],
      [560, 288],
      [400, 288],
    ],
  ],
};

function polygonPath(points: readonly Point[]): string {
  return `${points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join("")}Z`;
}

/**
 * ONE PATH PER LETTER, subpaths joined, filled `nonzero`. The shapes abut
 * rather than overlap, so the fill rule is belt-and-braces rather than
 * load-bearing.
 *
 * One string per letter, used by every instance including the navbar. Two `d`
 * strings for the same visual shape is a divergence waiting to happen.
 */
export const LETTER_PATH: Readonly<Record<MarkLetter, string>> = {
  m: POLYGONS.m.map(polygonPath).join(""),
  s: POLYGONS.s.map(polygonPath).join(""),
};

/** Each letter's leftmost x — derived from the shapes rather than written down,
 *  because the Intro anchors each capital of the name on the letter it becomes
 *  and an indexed constant is a silent one-glyph offset waiting to happen. */
export const LETTER_LEFT: Readonly<Record<MarkLetter, number>> = {
  m: Math.min(...POLYGONS.m.flat().map(([x]) => x)),
  s: Math.min(...POLYGONS.s.flat().map(([x]) => x)),
};

/**
 * The mark's minimum legible rendered height. Pass/fail, not a preference —
 * `docs/07` §2.1 promotes it because it binds the navbar, About, the
 * reveal-footer stamp and any future favicon or OG use.
 *
 * THE DERIVATION HAS MOVED TWICE, THE NUMBER HAS NOT. The trace mark derived it
 * from node-dot clearance across the 112-unit letter gap; there are no dots any
 * more. The three-bar faceted M derived it from that M's 40-unit bar gap; the M
 * is one polygon now and has no bar gaps.
 *
 * WHAT BINDS TODAY IS THE S'S 44-UNIT GAP between its three horizontal bars —
 * the tightest clear air anywhere in the mark, the M's vee mouth being 112 and
 * the letter gap 64. Keeping ~2px of it needs 44 / 2 = 22 units per pixel, i.e.
 * an arithmetic floor of **14.5px**; below that the S's bars start to fuse and
 * it silts up into a block. 17px gives 2.34px of air and ~17% of margin for
 * antialiasing, so the shipped floor stays where it has always been.
 *
 * INK IS NO LONGER THE BINDING CONSTRAINT and that is the point of the rebuild:
 * at 17px the bars are 2.98px wide, well clear of the ~1.25px floor at which a
 * stroke goes entirely to antialiasing. Air is what runs out first now.
 */
export const MIN_HEIGHT_PX = 17;

/** The navbar's instance. Do not reduce it — see `MIN_HEIGHT_PX`. */
export const NAV_HEIGHT_PX = 17;

/* -------------------------------------------------------------------------
   The Intro's name — the merge's SOURCE half.

   "Muhammad Saad" is twelve letters plus a space and the mark is two letters.
   There is NO twelve-to-two anything here.

   THE CAPITAL M OF "Muhammad" BECOMES THE MARK'S M; THE CAPITAL S OF "Saad"
   BECOMES THE MARK'S S. One-to-one, twice. The other TEN inked glyphs — the
   space carries advance width and no ink, so it is not one of them — translate
   toward their own word's capital and fade, so each word visibly COLLAPSES INTO
   ITS OWN INITIAL. That is not a shortcut, it is the concept made literal: a
   monogram is the initials that survived.

   THE NAME IS RENDERED FROM OUTLINES, NOT DOM `<text>`, and the reason has
   CHANGED with the faceted rebuild. It used to be that fill and stroke do not
   interpolate, so a morph forbade a paint-mode swap. There is no morph now. The
   reason it still holds: the name and the mark are then in ONE coordinate
   system, so each capital's travel is `x: 0, scale: 1` — the identity transform
   — and it lands on the faceted letter EXACTLY, at the same baseline and the
   same cap height, with no DOM-to-SVG alignment probe anywhere. That exactness
   is what makes the crossfade at the meeting point invisible instead of a
   double image. A `TextMetrics` baseline probe was deleted from this project
   once already; this is what replaced it.

   EVERYTHING IS FILLED, name and mark alike. The old "nothing is ever filled"
   rule was a morph constraint and is void.
------------------------------------------------------------------------- */

/**
 * Font units → viewBox units. Sized so a glyph's cap height equals the mark's:
 * 700 font units become 256 viewBox units. The glyph M is then 258 units wide
 * against the faceted M's 248, and the glyph S 189 against 216 — close enough
 * that each capital dissolves into a shape of its own size and position.
 */
const K = CAP / CAP_HEIGHT;

/**
 * The name is laid out to fill the drawn box exactly — 528 units, inset to
 * inset — which fixes its scale without a magic number and keeps it inside the
 * viewBox at every viewport. At the Intro's desktop size that is a cap height
 * of roughly 54px.
 */
const NAME_WIDTH = VB_W - INSET * 2;

export type IntroGlyph = {
  readonly char: string;
  /** Set for the two capitals that become the mark; `null` for the ten that
   *  collapse and fade. */
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
 * capital's ink starts on the same vertical as the shape it becomes: the M's
 * left edge at x = 32, the S's at x = 344.
 */
const LETTER_ORIGIN: Record<MarkLetter, number> = LETTER_LEFT;

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

/** The name, in document order. The two capitals carry a `letter`; the ten
 *  others do not, and that flag is the only thing that distinguishes them —
 *  `Intro.tsx` indexes elements against this array position for position. */
export const INTRO_GLYPHS = buildIntroGlyphs();

/**
 * How much smaller the opening name is than the settled mark, as a scale
 * factor on each glyph group. The two capitals tween from this to 1 while they
 * travel; the other ten hold it and fade, because a non-initial that also grew
 * would be near full size at the moment it is supposed to be disappearing.
 */
export const NAME_SCALE = (() => {
  const total = [...HERO_NAME].reduce(
    (sum, ch) => sum + (ch === " " ? SPACE_ADVANCE : (GLYPHS[ch]?.ha ?? 0)),
    0,
  );
  return total > 0 ? NAME_WIDTH / total / K : 1;
})();

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
