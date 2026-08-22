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
/** Clear air between the M and the S. Wider than the M's internal gaps, which
 *  is what keeps the pair reading as two letters rather than five bars. */
export const LETTER_GAP = 64;

/**
 * THE MARK'S ANCHOR — horizontal centre, ON THE BASELINE. Not the bounding box
 * centre `(296, 160)`, and it is retained verbatim from the trace mark.
 *
 * Promoted to `docs/07` §3.2 because it constrains layout and not just motion.
 * It is the one point the whole entry sequence is built around, and it wears
 * three hats at once:
 *
 *   1. THE MARK IS POSITIONED BY THIS POINT, NOT BY ITS BOX. `(296, 288)` is
 *      what sits at dead viewport centre during the Intro. The box centre is
 *      128 units above it, so the mark visibly hangs upper-middle with its
 *      baseline through the middle of the screen. That is the intended
 *      composition, not an offset to correct.
 *   2. IT IS THE ORIGIN OF THE INTRO'S TEXT→MARK SCALE. `Intro.tsx` renders the
 *      settled mark at `NAME_SCALE` about this point so it lands at exactly the
 *      cap height of the name it replaces. `x = 296` is also the mark's INK
 *      centre — the M runs 32→280 and the S 344→560 — which is why scaling
 *      about it keeps the pair optically centred at every scale.
 *   3. IT IS THE CAMERA'S FIXED POINT. The zoom-out and the zoom-in both pivot
 *      here, so the move pushes into dead viewport centre, which is the pixel
 *      `Hero.tsx` expands out of.
 *
 * PREVIOUSLY NAMED `CONTRACT_X` / `CONTRACT_Y`, for a contraction-to-a-point
 * that was built, shipped and reverted (see `docs/07` §3). The point survived
 * the revert because it was never really about the contraction; the name was.
 *
 * `x = 296` also falls inside the 64-unit letter gap, so anything that collapses
 * here drains into the mark's own seam.
 */
export const ANCHOR_X = 296;
export const ANCHOR_Y = BASELINE;

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

/**
 * The navbar's instance. Do not reduce it — see `MIN_HEIGHT_PX`.
 *
 * WHICH OF THESE TWO IS "THE OWNER" — asked and answered 2026-08-22, because
 * `docs/07` §2.1 calls `MIN_HEIGHT_PX` the owner while `NAV_HEIGHT_PX` is what
 * every call site actually imports, so one of them looks dead from a grep.
 *
 * THEY OWN DIFFERENT THINGS AND BOTH STAY. `MIN_HEIGHT_PX` owns the DERIVED
 * FLOOR — the S's 44-unit gap, 14.5px arithmetic, 17px shipped — and the block
 * above is its documentation; it binds the navbar, `/about`, the reveal-footer
 * stamp and any future favicon. `NAV_HEIGHT_PX` owns ONE INSTANCE'S CHOSEN
 * SIZE, which today happens to sit exactly on the floor. Collapsing them into
 * one constant would assert that the bar must always render at the minimum,
 * which is not a decision anyone made.
 *
 * NOTHING MECHANICALLY ENFORCES `NAV_HEIGHT_PX >= MIN_HEIGHT_PX`. That is the
 * real cost of keeping both, it is stated here rather than left to be
 * discovered, and it is why `MIN_HEIGHT_PX` having no importer is not evidence
 * that it is dead surface.
 */
export const NAV_HEIGHT_PX = 17;

/* -------------------------------------------------------------------------
   The Intro's name — the SOURCE half of the name-to-mark reduction.

   "Muhammad Saad" is twelve letters plus a space and the mark is two letters.
   There is NO twelve-to-two anything here.

   THE CAPITAL M OF "Muhammad" BECOMES THE MARK'S M; THE CAPITAL S OF "Saad"
   BECOMES THE MARK'S S. One-to-one, twice. The other TEN inked glyphs — the
   space carries advance width and no ink, so it is not one of them — SHRINK
   TOWARD THEIR OWN PEN ORIGIN AND FADE, staggered left to right, leaving the
   two initials standing. A monogram is the initials that survived.

   THIS HEADER DESCRIBED A DIFFERENT MECHANIC UNTIL 2026-08-22. It said the ten
   "translate toward their own word's capital and fade, so each word visibly
   COLLAPSES INTO ITS OWN INITIAL". The shipped DROP tween (`Intro.tsx`, phase
   2) writes only `opacity` and `scale` — there is no translation toward a
   capital and no per-word collapse. The letters go where they stand.

   THE NAME IS RENDERED FROM OUTLINES, NOT DOM `<text>`, and the reason has
   CHANGED TWICE. It used to be that fill and stroke do not interpolate, so a
   morph forbade a paint-mode swap; there is no morph now. It then became "each
   capital's travel is `x: 0, scale: 1` — the identity transform — and it lands
   on the faceted letter EXACTLY". `docs/07` §3.1 explicitly retires that
   sentence: it was the reverted merge's mechanic. Phase 3 SLIDES the two
   survivors to a computed `SLIDE_X`; their travel is not the identity.

   WHAT ONE COORDINATE SYSTEM BUYS TODAY, per §3.1, is two things, and they are
   worth more than the one they replaced:
     - The slide is ARITHMETIC rather than a measured FLIP. There is no layout
       inside an SVG to reflow, so `SLIDE_X` computes the pair set solid on the
       font's own advances, re-centred in the box, from the same font metrics.
     - The crossfade is a SWAP IN PLACE. The parked pair is advance-centred on
       `VB_W / 2` = `ANCHOR_X`, which is where the settled mark's ink is
       centred, and both render at `NAME_SCALE`. Same cap height, same centre,
       no correction term — and so no DOM-to-SVG alignment probe. A
       `TextMetrics` baseline probe was deleted from this project once already;
       this is what replaced it.

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
      atWordStart = false;
    }
    wordOf.push(word);
    penInWord.push(wordPen);
    penInName.push(namePen);
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
 * factor on each glyph group.
 *
 * IT IS THE ONLY SCALE ON SCREEN FOR THE WHOLE OPENING, and that is the point.
 * Every glyph of the name holds it, both survivors hold it through the drop and
 * the slide, and the settled mark is rendered at it too — so the text-to-mark
 * crossfade swaps two letterforms of identical cap height. The version this
 * replaced tweened the two capitals from `NAME_SCALE` to 1 WHILE the other ten
 * were still at `NAME_SCALE`, which put two type scales on screen at once and
 * is exactly the defect that got it reverted (`docs/07` §3).
 */
export const NAME_SCALE = (() => {
  const total = [...HERO_NAME].reduce(
    (sum, ch) => sum + (ch === " " ? SPACE_ADVANCE : (GLYPHS[ch]?.ha ?? 0)),
    0,
  );
  return total > 0 ? NAME_WIDTH / total / K : 1;
})();

/**
 * WHERE THE TWO SURVIVORS PARK once the other ten have gone — each capital's
 * pen-origin x, in viewBox units, for the closed-up "MS" pair.
 *
 * WHAT THIS REPLACES, and why it is arithmetic now rather than a measurement.
 * The original DOM Intro did this as a real FLIP: it collapsed the non-initial
 * `<span>`s to `display: none`, let the flex row reflow, and read the survivors'
 * new rects back out. There is no layout inside an SVG to reflow, so the same
 * two facts — the pair set solid, and the pair re-centred in the box — are
 * computed instead. Both ends still come from the FONT's own advance widths, so
 * a font swap moves this exactly as it moved the measured version.
 *
 * ADVANCE-SET AND ADVANCE-CENTRED. The letters are laid nose-to-tail on their
 * advance widths, which is what a text run does, and the resulting box is
 * centred on `VB_W / 2` — which is `ANCHOR_X`, which is where the settled mark's
 * ink is centred. That identity is what lets the crossfade be a swap in place:
 * the mark drawn at `NAME_SCALE` about `ANCHOR_X` and the parked pair share a
 * centre without a correction term.
 *
 * DERIVED FROM `INTRO_GLYPHS`, never from the literal "MS" — the capitals are
 * whichever characters start the words of `HERO_NAME`.
 */
export const SLIDE_X: Readonly<Record<MarkLetter, number>> = (() => {
  // `NAME_SCALE` is per-glyph-group, i.e. relative to the mark's own `K`. Font
  // units reach viewBox units through both.
  const nameScale = NAME_SCALE * K;
  const capitals = INTRO_GLYPHS.filter(
    (g): g is IntroGlyph & { letter: MarkLetter } => g.letter !== null,
  );
  const widths = capitals.map((g) => (GLYPHS[g.char]?.ha ?? 0) * nameScale);
  const pairWidth = widths.reduce((sum, w) => sum + w, 0);

  const out = {} as Record<MarkLetter, number>;
  let pen = (VB_W - pairWidth) / 2;
  capitals.forEach((g, i) => {
    out[g.letter] = pen;
    pen += widths[i];
  });
  return out;
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
