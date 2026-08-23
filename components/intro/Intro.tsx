"use client";

/**
 * The INTRO — the branded, choreographed reveal.
 *
 * IT IS NOT A LOADER AND IT NEVER WAS. A loader answers "are the assets ready".
 * This answers nothing; it is a scripted timeline with known durations whose
 * only job is how the site feels in its first three seconds. `AssetLoader.tsx`
 * is the loader, it gates this component, and by the time this plays everything
 * it needs is already in.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE SEQUENCE — seven phases, ONE ENDING, ON ALL THREE ROUTES.
 * `docs/06_INTRO_AND_CHROME.md` §2 and `docs/07_SITE_RESTRUCTURE.md` §3.
 *
 *   1  0.000 → 0.300  HOLD.      "Muhammad Saad", still, long enough to read
 *                                as a name rather than as a flash.
 *   2  0.300 → 0.785  DROP.      The ten non-initials shrink and fade, left to
 *                                right. Only M and S are left standing.
 *   3  0.785 → 1.205  SLIDE.     The two survivors close up into a solid "MS",
 *                                re-centred in the box.
 *   4  0.995 → 1.395  MORPH.     Text becomes mark. The letterforms crossfade
 *                                into the faceted monogram AT THE SAME CAP
 *                                HEIGHT, overlapping the tail of the slide.
 *   5  1.395 → 1.995  ZOOM OUT.  The camera backs off to 0.82. A settling, not
 *                                a second move.
 *   6  1.995 → 2.215  BREATH.    Nothing happens. That is the phase.
 *   7  2.215 → 2.765  DISSOLVE.  The stage holds at 0.82 and the plate fades
 *                                out from under the mark on `power2.in`. THE
 *                                DISSOLVE IS THE TRANSITION. One `.call()` sits
 *                                inside it, at 2.573 — see
 *                                `PLATE_GROUND_RATIO`.
 *
 * PHASE 7 WAS A ×17 ZOOM-IN CAMERA ON HOME UNTIL 2026-08-22, AND ONLY ON HOME.
 * `/work` and `/about` already ended on this dissolve, so the file carried two
 * endings, one branch (`getHeroStage()`), two totals (3.165s and 2.765s) and a
 * 128-line docblock explaining why the camera could not travel to the other two
 * routes. The dissolve is now the only ending: one total, no branch, and the
 * sequence's last image is the settled mark at `ZOOM_OUT_SCALE` on every route.
 * The retired camera is preserved on the branch `intro-zoom-in-backup` and the
 * tag `intro-zoom-in`, the same pair `intro-merge-to-point-backup` /
 * `intro-plan-a` preserves the reverted merge. `docs/07` §3 records both.
 *
 * WHY THIS SHAPE AND NOT THE ONE IT REPLACES. A "merge to a point" version
 * shipped in between: the two capitals travelled and GREW into the mark's
 * positions while the other ten glyphs were still collapsing. It was reverted
 * because the two halves of that idea collide on screen. Frame captures show
 * the name correct at 250ms and, by 500ms, the M and S at full mark scale
 * sitting on top of "uhammad" and "aad" still at text scale — an overlapping
 * mess, not a becoming. That mechanic is preserved on the branch
 * `intro-merge-to-point-backup` and the tag `intro-plan-a`; `docs/07` §3
 * records the reasoning as superseded rather than deleting it.
 *
 * THE STRUCTURAL PROPERTY THAT MAKES THIS ONE SAFE, and the reason the phase
 * ORDER matters more than any of the durations: THERE IS NEVER MORE THAN ONE
 * TYPE SCALE ON SCREEN. The non-initials leave first (phase 2), the survivors
 * then move at a constant scale (phase 3), and the scale change is deferred to
 * phase 4 — by which point the only things on screen are two letterforms
 * occupying the same box. Anything reintroduced here that grows one glyph while
 * another is still at name scale reintroduces the bug.
 *
 * THE NAME IS SVG, NOT DOM `<text>`, and that is the one thing this restoration
 * keeps from the version it reverts. Outlines put the name and the mark in ONE
 * coordinate system — `components/ui/msMarkGeometry.ts` — which is what deletes
 * the old `TextMetrics` baseline probe, the three mirrored mark constants and
 * the measured FLIP along with it. The FLIP's two facts survive as arithmetic:
 * `SLIDE_X` sets the pair solid on the font's own advances and re-centres it.
 *
 * REPLAYABLE BY CONSTRUCTION, and that is a requirement rather than a nicety.
 * The timeline is BUILT FRESH on every play, keyed off `playToken`, and
 * `sequence="mark"` plays phases 4–7 alone (no name) which is the shape a
 * section transition needs. What it deliberately does NOT own is the scroll
 * lock — see `IntroGate.tsx`.
 *
 * WHY GSAP AND NOT FRAMER, given the house rule is "GSAP owns scroll-synced
 * timelines, Framer owns DOM": this IS a timeline — seven phases, a stagger, a
 * crossfade and a two-sided handoff in the middle of it — and expressing it as
 * nested Framer variants with delay arithmetic is how phase boundaries drift
 * apart when one duration is retuned.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useRef } from "react";

import { MonogramMark } from "@/components/ui/MonogramMark";
import {
  ANCHOR_X,
  ANCHOR_Y,
  BASELINE,
  INTRO_GLYPHS,
  NAME_SCALE,
  SLIDE_X,
  type IntroGlyph,
  type MarkLetter,
} from "@/components/ui/msMarkGeometry";
import { GSAP_EASE, gsap } from "@/lib/animation/gsap";
import { HANDOFF_S, NAV_ENTRANCE_ATTR } from "@/lib/animation/handoff";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/* -------------------------------------------------------------------------
   Phase durations, seconds. Every value below is the ORIGINAL sequence's,
   restored verbatim from commit `f640107`. Tuning them is a design act; read
   the sequence table above before moving any of them, because several overlap
   on purpose.
------------------------------------------------------------------------- */
/** 1. */
const HOLD_S = 0.3;
/** 2. */
const DROP_S = 0.35;
const DROP_STAGGER_S = 0.015;
/**
 * How far a departing glyph shrinks, as a fraction of the name's own scale.
 *
 * RELATIVE, NOT ABSOLUTE, and that is the whole translation from the DOM
 * version. There it was `scale: 0.6` on a `<span>` whose resting scale was 1.
 * Here every glyph group already carries `NAME_SCALE`, so a literal `0.6` would
 * be an eight-fold JUMP UP at the exact moment the letter is meant to be
 * leaving.
 */
const DROP_SCALE = 0.6;
/** 3. */
const SLIDE_S = 0.42;
/** 4. Text out, mark in. Overlaps the tail of the slide so the material
 *  changes while the letters are still closing, rather than after they have
 *  parked. */
const MORPH_S = 0.4;
/** How far into the slide the morph begins — the overlap, as a fraction. */
const MORPH_OVERLAP = 0.5;
/** The name's small swell as it dissolves, so it reads as being replaced from
 *  underneath rather than simply switched off. */
const MORPH_SWELL = 1.04;
/** And the mark's matching settle inward, from slightly over-size. */
const MORPH_MARK_FROM = 1.1;
/** 5. Long and soft — this beat exists to be a pause, so it must not read as
 *  another move. */
const ZOOM_OUT_S = 0.6;
/**
 * WHERE THE MARK IS LAST SEEN — not a way-point.
 *
 * Under the retired zoom-in camera the sequence passed THROUGH 0.82 on its way
 * to ×17, so this was a transitional size nobody looked at for long. Under the
 * dissolve ending the stage holds here for the whole of phase 6 and the whole
 * of phase 7, so 0.82 is the size of the final image of the entire entry
 * sequence, on every route.
 *
 * Retuning it is therefore a change to the last frame of the site's entrance,
 * not to a transition way-point. Say why, and look at it.
 */
const ZOOM_OUT_SCALE = 0.82;
/** 6. The breath at the bottom of the zoom-out, before the plate leaves. */
const BREATH_S = 0.22;

/**
 * PHASE 7 — the plate's dissolve, and the site's ONE ending on all three
 * routes.
 *
 * IT WAS `OFF_HOME_DISSOLVE_S` UNTIL 2026-08-22, and it was the EXCEPTION: Home
 * ended on a ×17 camera over 0.95s and this was what `/work` and `/about` got
 * instead, because they have no hero stage to aim a camera at. The camera is
 * retired (`intro-zoom-in-backup` / `intro-zoom-in`) and this is now the rule.
 * The rename is not tidying — a constant called OFF_HOME that runs ON Home is
 * the class of stale name this repo has shipped repeatedly.
 *
 * The stage holds at `ZOOM_OUT_SCALE` and the mark fades with the plate it is a
 * child of, at the same rate. There is no tween on the mark and there must not
 * be one.
 *
 * WHY `power2.in` RATHER THAN `GSAP_EASE.ui`. Two reasons, and ONLY THE FIRST
 * APPLIES ON HOME — which is why it is stated first now that Home shares this
 * curve:
 *
 *   1. EVERY SHARED CURVE DECELERATES INTO ITS END STATE, which is right for
 *      something ARRIVING and wrong for something LEAVING. The plate is
 *      leaving. This holds on all three routes, on any ground, in any theme,
 *      and it is the reason the curve is correct on Home.
 *   2. OFF HOME IT ALSO SHAPES A LIGHTNESS RAMP. In light mode the ground
 *      travels L* 2.41 -> 98.99 across ~93% of the viewport as the plate goes,
 *      and no mechanic deletes that ramp. On a 0.55s dissolve `GSAP_EASE.ui` is
 *      halfway through the lightness change at 193ms; `power2.in` is halfway at
 *      **437ms**, **2.27x** longer, and it delivers **12.5%** rather than 77.6%
 *      of the ramp in the first 275ms. ON HOME THERE IS NO SUCH RAMP —
 *      `bg-hero-surface` onto `bg-hero-surface`, 1.00:1 in both themes — so
 *      Home's curve rests on reason 1 alone. Do not read reason 2 as Home's
 *      justification; a curve that looks inherited is how a conclusion outlives
 *      its argument.
 *
 * THOSE TWO `power2.in` FIGURES READ 389ms AND 25% UNTIL 2026-08-22, AND THE
 * ERROR WAS THE CURVE, NOT THE ARITHMETIC. GSAP's `Power2` is CUBIC — Power0
 * Linear, Power1 Quad, Power2 Cubic — and both numbers were computed as if it
 * were quadratic (√0.5 rather than ∛0.5; 0.5² rather than 0.5³). The
 * `GSAP_EASE.ui` column is a real bezier and was evaluated correctly at 193ms;
 * its 275ms figure was 68% and is 77.6%. Every correction points the SAME
 * WAY — `power2.in` is gentler than this paragraph claimed, not harsher — so
 * the choice of curve is unaffected. What IS affected is anything that keys off
 * the plate-50% frame, which is the whole seam. See below, `Hero.tsx`'s
 * `ARRIVAL_S`, and `components/intro/IntroEntrance.tsx`.
 *
 * WHY 0.55s AND NOT LONGER, since longer is gentler: off Home the destination's
 * entrance is fired at the hand-off + 0.30s and its `y` leg is 0.70s, so a
 * longer outgoing half puts the incoming one back behind an opaque plate — the
 * "animates in secret" failure this whole arrangement exists to repair. On Home
 * the same pressure comes from `Hero.tsx`'s arrival, which is now 1.30s against
 * this 0.55s.
 *
 * THE ARITHMETIC, ON THE RIGHT CURVE. `power2.in` is CUBIC, so this plate is
 * half gone at `∛0.5 × 0.55` = **0.4365s**, not at the 389ms an earlier version
 * of this paragraph and the seam design both quoted from solving `p² = 0.5`.
 * At 0.55s the off-Home entrance is 66.3% done at that frame; at 0.75s it would
 * be 92.9% done — squarely back in the secret-animation band. 0.55s is the
 * balance point and the tension is real rather than a preference.
 *
 * That correction is also why the onset off Home reads 0.30s and not the 0.20s
 * that shipped first: at 0.20s the entrance measured 87.1% at plate-50%, which
 * is this paragraph's own rejection criterion, met by the configuration it
 * kept. `components/intro/IntroEntrance.tsx` carries the full table.
 *
 * A 128-LINE BLOCK ARGUING "WHY THE CAMERA CANNOT COME ALONG" STOOD HERE, and
 * it is deleted rather than carried over, because two of its three reasons were
 * never true of Home and carrying it would have made it the file's largest
 * conclusion-right / reason-wrong comment. For the record, since the reasons
 * are the interesting part: (1) "the receiving geometry does not exist" — it
 * does on Home, where the hero IS `h-dvh` at scroll 0; (2) "a transform on the
 * page re-parents this plate" — the plate is a body-level sibling via
 * `IntroProvider`, not a descendant of the hero's stage, so it never bit;
 * (3) "12% is six and a half times the site's travel budget" — still true, and
 * it is now the argument that took `ARRIVAL_SCALE` from 1.12 to 1.04 in
 * `Hero.tsx` rather than an argument about this plate.
 */
const DISSOLVE_S = 0.55;

/**
 * WHERE INSIDE THE DISSOLVE THE PLATE STOPS BEING A *GROUND*, as a fraction of
 * `DISSOLVE_S`. It is the instant `onPlateCleared` fires, and its only consumer
 * is the navbar's palette.
 *
 * THE PROBLEM IS THAT NEITHER END OF THIS TWEEN IS USABLE, AND BOTH ENDS WERE
 * TRIED. The bar is fixed over this plate on all three routes. While the plate
 * is opaque the bar must be transparent and carry `--color-hero-fg`; once the
 * plate has gone the bar must carry its own 80% `--color-base` scrim and
 * `--color-fg`. Off Home the swap therefore has to happen DURING the fade:
 *
 *   - AT THE HAND-OFF (`t = 0`), which is what shipped in `fc2f567`: the scrim
 *     paints over a plate at opacity 1.000. MEASURED at 1440x900 light on
 *     `/work`, sampling every frame: 15 frames — ~250ms — with header
 *     background alpha 204/255 while the plate was still ≥0.9 opaque. Contrast
 *     was never the failure (11.25:1 throughout); a light slab on a black plate
 *     was.
 *   - AT `onDone` (`t = 1`): the hero palette rides the fade to the end, and in
 *     light mode the ground under the bar travels #07090C → #FDFCFA. #E8EAEC on
 *     that measures **1.18:1** at the last frame. Not survivable.
 *
 * 0.65 IS DERIVED FROM TWO INDEPENDENT CONSTRAINTS THAT AGREE. `power2.in` is
 * cubic, so plate opacity at fraction `u` is `1 − u³`.
 *
 *   1. CONTRAST CEILING — how late the swap may be. #E8EAEC over the composite
 *      of the plate on `--color-base` (light) falls to 7:1 at u = 0.655 and to
 *      the 4.5:1 AA floor at u = 0.736. Swapping at 0.65 leaves the outgoing
 *      palette at **7.16:1** on its last frame and keeps ~45ms — three frames
 *      at 60Hz — of margin before AA would be breached by a late call.
 *   2. THE SLAB FLOOR — how early the swap may be. The bar's own row is tweened
 *      `yPercent −100 → 0` over `HANDOFF_DURATION_S` (0.45s) on `power2.out`,
 *      also cubic. At u = 0.65 that is t = 358ms, i.e. **99.1% arrived**: the
 *      scrim therefore never paints an EMPTY bar, which is what made the
 *      `t = 0` version read as a hole punched in the Intro rather than as a
 *      navbar. Below u ≈ 0.5 the row is still visibly short of its rest.
 *
 * WHAT IT COSTS, STATED RATHER THAN HIDDEN. Between u = 0.65 and u = 1 the bar
 * carries its light scrim over a plate that is still 0.725 → 0 opaque, so in
 * light mode a #D9D9D9 bar sits on a ground travelling #4B4C4D → #FDFCFA for
 * 192ms. That is a lighter bar over a fading plate, not a bar-shaped hole in an
 * opaque one, and it is the shortest window the contrast ceiling permits.
 *
 * WHY NOT A CROSS-FADE INSTEAD OF A DISCRETE SWAP AT A CHOSEN FRAME: because
 * ramping the scrim in over the fade walks the ground through mid-grey, where
 * NEITHER palette clears AA — at u = 0.7 with a half-strength scrim the ground
 * is ~#A8A8A8 and the two inks measure 1.92:1 and 4.31:1. `Navbar.tsx`'s
 * "A CROSS-FADE BETWEEN TWO INVERTED PALETTES IS UNSAFE AT ITS MIDPOINT" block
 * is the same finding, measured on the same bar at 1.01:1.
 *
 * ON HOME IT CHANGES NOTHING. `Navbar.tsx` ORs this ground with the hero's, and
 * at scroll 0 on `/` the hero is under the bar for the whole sequence — so the
 * attribute never changes there and this constant is inert.
 */
const PLATE_GROUND_RATIO = 0.65;

/** The navbar's slide, from `lib/animation/handoff.ts` so that the timing and
 *  the DOM contract it depends on stay in one place.
 *
 *  IT IS THE NAVBAR'S DURATION ONLY. This read "Both halves of the handoff.
 *  Shared with `Hero.tsx` and `Navbar.tsx` through one constant" — `Hero.tsx`
 *  stopped importing it when the zoom-in was restored, because the incoming
 *  half has to OUTLAST the outgoing one (its `ARRIVAL_S` is 1.30s against this
 *  0.45s, and against `DISSOLVE_S`'s 0.55s). What the three components share is
 *  the START INSTANT. */
const HANDOFF_DURATION_S = HANDOFF_S;

/* Reduced motion: a different, shorter thing — not this sequence slowed down.
   `docs/07` §8. */
const REDUCED_MARK_IN_S = 0.2;
const REDUCED_HOLD_S = 0.1;
const REDUCED_FADE_S = 0.25;
/** The About instance's rendered height. Under reduced motion the mark appears
 *  at About weight — settled, modest, no spectacle — rather than at the Intro's
 *  full Tier 1 scale. */
const REDUCED_MARK_H = 72;

/**
 * How many glyphs actually leave in phase 2, and therefore how long phase 2
 * runs once the stagger is counted.
 *
 * DERIVED, NOT WRITTEN DOWN. It is ten today because "Muhammad Saad" is twelve
 * inked characters and two of them are word-initial; `HERO_NAME` is content and
 * content moves. The space is not in `INTRO_GLYPHS` at all — it carries advance
 * but no ink — which is the one place this differs measurably from the DOM
 * original, where the space was a `<span>` and took a stagger slot of its own.
 * Phase 2 is 15ms shorter as a result.
 */
const DROP_COUNT = INTRO_GLYPHS.filter((g) => g.letter === null).length;
const DROP_TOTAL_S = DROP_S + Math.max(0, DROP_COUNT - 1) * DROP_STAGGER_S;

/* Absolute phase boundaries, so the timeline reads the way the table above does
   and nothing depends on the order tweens happen to be added in. The original
   built these with relative positions and a detached `gsap.to` for the slide;
   stating them absolutely is the same timing with the arithmetic visible. */
const T_DROP = HOLD_S; // 0.300
const T_SLIDE = T_DROP + DROP_TOTAL_S; // 0.785
const T_MORPH = T_SLIDE + SLIDE_S * MORPH_OVERLAP; // 0.995
/** The mark is formed and still. Phases 5–7 hang off this. */
const T_SETTLED = T_MORPH + MORPH_S; // 1.395

/**
 * The sequence's full length, DERIVED rather than typed — 2.765s, ON EVERY
 * ROUTE.
 *
 * NOTHING IMPORTS IT, and that is deliberate rather than an oversight waiting
 * to be tidied: the Intro is gated on `onDone`, not on a timer, so no consumer
 * should ever be scheduling against this number. What it is for is being
 * CORRECT AND CITEABLE — `docs/06` §2 and `docs/07` §3 both quote the total, and
 * `lib/animation/handoff.ts` points here after carrying the reverted merge's
 * ~2.35s for a while. Because it is computed from the phase constants directly
 * above it, retuning any phase updates it for free and a doc that disagrees
 * with it is provably the thing that is wrong.
 *
 * If a consumer ever does appear, read this paragraph first: wanting the total
 * is usually wanting `onDone`.
 *
 * IT IS ONE NUMBER AGAIN. It read 3.165s on Home and 2.765s off it while phase
 * 7 branched between a 0.95s camera and this 0.55s dissolve, and this block
 * carried a paragraph explaining that the entry was deliberately shorter on the
 * routes with no hero to arrive into. The camera is retired, so there is one
 * phase 7, one derivation and one total — and the three routes' plate lifetimes
 * are now expected to match each other rather than to differ by 0.4s.
 */
export const INTRO_TOTAL_S =
  T_SETTLED + ZOOM_OUT_S + BREATH_S + DISSOLVE_S; // 2.765

export type IntroSequence = "full" | "mark";

type IntroProps = {
  /**
   * `"full"` — all seven phases, the first-visit entry.
   * `"mark"` — phases 4 through 7 only, starting from the formed monogram. No
   * name, no drop, no slide: the mark, its settle, and the dissolve that hands
   * you to whatever is underneath, which is the shape a section transition
   * wants. (It read "the mark and the camera move that carries you somewhere
   * else" until the camera was retired on 2026-08-22.)
   */
  sequence?: IntroSequence;
  /**
   * Change this value to replay. A token rather than a boolean so that
   * replaying twice in a row is expressible; a `playing` flag would have to be
   * toggled off and on again, which is a race.
   */
  playToken?: number;
  /**
   * Fired as PHASE 7 begins, not when it ends — i.e. on the frame the plate
   * starts dissolving, while it is still fully opaque.
   *
   * This is the signal the hero uses to start its own arrival, and the overlap
   * between the two is what makes the handoff continuous instead of a cut.
   * `docs/06` §2 requires it, and collapsing it into `onComplete` turns the
   * seam back into a cut. The navbar rides the same instant.
   *
   * It read "as the ZOOM-IN begins" until 2026-08-22. The instant is unchanged
   * — `tHandoff` — but the tween that carries it is now the dissolve on every
   * route rather than a camera on one.
   */
  onHandoff?: () => void;
  /**
   * Fired PART-WAY THROUGH phase 7 — at `PLATE_GROUND_RATIO` of the dissolve —
   * on the frame the plate stops being the GROUND behind fixed chrome. See that
   * constant for why it is neither `onHandoff` nor `onComplete`.
   */
  onPlateCleared?: () => void;
  /** Fired once the plate is finished and can be unmounted. */
  onComplete?: () => void;
};

export function Intro({
  sequence = "full",
  playToken = 0,
  onHandoff,
  onPlateCleared,
  onComplete,
}: IntroProps) {
  const reducedMotion = useReducedMotion();

  const plateRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  /* Callbacks through refs, so a parent re-render that produces new function
     identities cannot restart a running timeline. */
  const onHandoffRef = useRef(onHandoff);
  const onPlateClearedRef = useRef(onPlateCleared);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onHandoffRef.current = onHandoff;
    onPlateClearedRef.current = onPlateCleared;
    onCompleteRef.current = onComplete;
  }, [onHandoff, onPlateCleared, onComplete]);

  /** The mark's letters, from the geometry module's own derivation of
   *  `HERO_NAME` — never the literal "MS". */
  const letters = useMemo(
    () => INTRO_GLYPHS.filter((g) => g.letter).map((g) => g.letter as MarkLetter),
    [],
  );

  useEffect(() => {
    const plate = plateRef.current;
    const stage = stageRef.current;
    const host = hostRef.current;
    if (!plate || !stage || !host) return;

    const svg = host.querySelector("svg");
    if (!svg) return;

    /* The faceted mark — phase 4's TARGET half, addressed as one object. This
       timeline writes `scale` and `opacity` to the wrapper and NEVER to the two
       `data-ms-letter` groups inside it: those belong to the navbar's hover
       gesture, and a second author on the same transform is how two systems
       start fighting the moment anyone reuses the component. */
    const wrapper = svg.querySelector<SVGGElement>("[data-ms-wrapper]");
    /* The name — document order, which is `INTRO_GLYPHS` order, which is what
       every index below is against. */
    const glyphEls = [...svg.querySelectorAll<SVGGElement>("[data-ms-glyph]")];
    /* The two capitals, by the letter each becomes. A subset of `glyphEls`, so
       nothing here may write a property the whole-name tweens also write. */
    const initialEls = letters
      .map((key) => svg.querySelector<SVGGElement>(`[data-ms-initial="${key}"]`))
      .filter((el): el is SVGGElement => el !== null);
    if (!wrapper) return;
    if (sequence === "full" && initialEls.length !== letters.length) return;

    /* The navbar's entrance. It is a SIBLING of everything this component can
       see — see `lib/animation/handoff.ts` for why it is addressed by
       attribute — and it is left alone entirely when it is absent, so the Intro
       stays reusable on a surface that has no chrome. */
    const nav = document.querySelector<HTMLElement>(`[${NAV_ENTRANCE_ATTR}]`);

    /*
      Every play starts from a known state. Without this, an interrupted or
      repeated run inherits whatever transform the last one left behind, and the
      second play of a "replayable" component is subtly different from the
      first — the classic reason a reusable sequence gets called one-shot.
    */
    const reset = () => {
      gsap.set(plate, { autoAlpha: 1 });
      // PHASE 5'S PIVOT. It was "the camera's fixed point" until 2026-08-22,
      // when the ×17 zoom-in was retired; the value does not move, but what it
      // serves has narrowed. With no camera, the only tween that reads this
      // origin is the zoom-OUT's contraction to 0.82, and `50% 90%` is what
      // makes the mark settle DOWNWARD into the composition's own weight
      // rather than shrinking about its middle. Two of the three routes have
      // shipped exactly that for a while; Home now joins them.
      //
      // Written here rather than as a Tailwind `origin-` class so that ONE
      // author owns it: GSAP writes this element's `transform`, and a transform
      // origin living in a class is a value nobody sees when they read the
      // tween.
      gsap.set(stage, { scale: 1, transformOrigin: "50% 90%" });
      gsap.set(wrapper, {
        svgOrigin: `${ANCHOR_X} ${ANCHOR_Y}`,
        scale: NAME_SCALE,
        opacity: 0,
      });
      /*
        THE TWELVE GLYPH GROUPS GO BACK TO AN IDENTITY MATRIX, and this line is
        the whole of Item 1's bug.

        `reset()` cleared the plate, the stage, the wrapper and the nav, and the
        lines below clear the `<svg>` and the host — but the glyph groups got
        only `display` and `opacity`, and `tl.kill()` does not revert. So on any
        SECOND run of this effect (React StrictMode's double-invoke, Fast
        Refresh, a `playToken` replay, an OS reduced-motion flip) `namePose`
        handed `svgOrigin` to an element that already carried a scaled matrix.
        GSAP then inverse-transforms the origin into local space and stores a
        smoothOrigin compensation, which cancel EXACTLY at the current scale —
        so the opening name still looked perfect — and diverge the instant a
        scale changes. Measured on the StrictMode run at 1440×900: glyph 7 (the
        `d` of "Muhammad") cached `xOrigin` 10224.11 and `xOffset` −6939.49
        against a correct `markX` of 1816.69 and `xOffset` 0, and phase 2 threw
        it 704px to the right — off a 720px plate. Cold production run, same
        frame: `xOrigin` 1816.69, `xOffset` 0.

        `clearProps: "transform"` also removes the SVG `transform` attribute and
        re-parses the cache as identity, so it is `data-svg-origin`-safe. The
        wrapper above does NOT need it: its pose's fixed point IS its own
        origin (`ANCHOR_X`, with no `x` term), so re-originating it is a no-op.
      */
      gsap.set(glyphEls, { clearProps: "transform" });
      if (nav) gsap.set(nav, { yPercent: 0 });
    };

    /** Put a glyph at its position in the OPENING NAME.
     *
     *  `svgOrigin` and not `transformOrigin`: the former is in the SVG's user
     *  coordinate system, which is the space every number in the geometry
     *  module is stated in. Set ONCE, here, and never changed afterwards —
     *  re-originating an already-transformed element is precisely the mechanism
     *  `reset()` above now guards against.
     *
     *  TWO ORIGINS, ONE PER ROLE, and the split is load-bearing:
     *
     *    - THE TWO CAPITALS KEEP THEIR PEN ORIGIN. Both ends of phase 3 are
     *      expressed against it — `SLIDE_X` is a pen-origin x — so the slide
     *      stays a pure `x` tween with no correction term. (A pure `x` tween is
     *      origin-independent anyway, which is exactly why M and S were the two
     *      glyphs the origin bug could not touch.)
     *    - THE TEN NON-INITIALS ARE ORIGINATED ON THEIR ADVANCE CENTRE, still
     *      on `BASELINE`, so phase 2's shrink is symmetric in x and sinks onto
     *      the one horizontal all ten share. This comment read "the glyph's own
     *      pen origin" for both until 2026-08-22; that was its bottom-LEFT, and
     *      it measured as 9–13px of leftward and 7–11px of downward drift per
     *      glyph on a cold run.
     *
     *  THE `x` TERM CARRIES A COMPENSATION and it is not optional. GSAP renders
     *  `σ·p + ox·(1 − σ) + x`, so moving `ox` off `markX` displaces the posed
     *  glyph by `(ox − markX)·(1 − NAME_SCALE)` — for a `d` that is ~112 viewBox
     *  units, i.e. the opening name would be dealt out sideways in frame 1.
     *  Subtracting it back keeps the rendered name layout byte-identical and
     *  leaves the origin free to do only the job it was moved for. It is zero
     *  for the capitals by construction. */
    const namePose = (el: Element, g: IntroGlyph) => {
      const originX = g.letter ? g.markX : g.markX + g.advanceX / 2;
      gsap.set(el, {
        svgOrigin: `${originX} ${BASELINE}`,
        scale: NAME_SCALE,
        x: g.nameX - g.markX - (originX - g.markX) * (1 - NAME_SCALE),
        y: 0,
      });
    };

    const finish = () => onCompleteRef.current?.();
    const handoff = () => onHandoffRef.current?.();
    const plateCleared = () => onPlateClearedRef.current?.();

    /* -------------------------------------------------------------------
       REDUCED MOTION — a fade to the settled mark and an instant reveal.

       Not the sequence at another speed: no name, no drop, no slide, no morph,
       no camera. Somebody who asked for less motion is not owed a shorter
       version of the spectacle, they are owed its absence.

       THE DOM IS IDENTICAL ON BOTH PATHS, deliberately. `useReducedMotion`
       returns `false` during prerender and corrects on hydration, so a branch
       that rendered different markup would be a hydration mismatch. The size
       and state changes below are all imperative.
    ------------------------------------------------------------------- */
    if (reducedMotion) {
      reset();
      // The box shrinks to the About instance and re-centres on its own middle
      // rather than on the anchor: with no camera move there is nothing for
      // that offset to serve, and a settled mark hanging above centre would
      // just look misplaced.
      //
      // THE OVERRIDE IS ON `translate`, NOT ON `transform`, and that is not
      // interchangeable here. Tailwind v4 compiles `-translate-x-1/2
      // -translate-y-[90%]` to the standalone `translate` property, which
      // COMPOSES with `transform` rather than being replaced by it — so a GSAP
      // `xPercent`/`yPercent` here does not re-centre the box, it adds a second
      // offset to the first and pushes the mark off the top of the screen.
      // Setting the same property the class set is what actually overrides it.
      host.style.translate = "-50% -50%";
      gsap.set(host, { width: "auto" });
      gsap.set(svg, { height: REDUCED_MARK_H, width: "auto" });
      gsap.set(glyphEls, { display: "none" });
      gsap.set(wrapper, { clearProps: "transform" });
      gsap.set(wrapper, { opacity: 0 });

      const tl = gsap.timeline({ onComplete: finish });
      tl.to(wrapper, { opacity: 1, duration: REDUCED_MARK_IN_S, ease: "power2.out" });
      tl.to({}, { duration: REDUCED_HOLD_S });
      /* THE SAME FRACTION OF THE SAME FADE. The reduced path's plate goes out
         LINEARLY over 0.25s rather than cubically over 0.55s, so the ratio is
         applied to the fade's own length and the opacity it lands on differs
         (1 − 0.65 = 0.35 here, 1 − 0.65³ = 0.725 there). Both are past the
         "still an opaque slab" band and short of the "ground has gone white"
         one, which is the property `PLATE_GROUND_RATIO` names. A `.call()` on
         the same timeline rather than a `setTimeout`, so killing the timeline
         cancels it. */
      tl.to(plate, { autoAlpha: 0, duration: REDUCED_FADE_S, onStart: handoff });
      tl.call(plateCleared, undefined, `-=${REDUCED_FADE_S * (1 - PLATE_GROUND_RATIO)}`);
      return () => {
        tl.kill();
        if (nav) gsap.set(nav, { yPercent: 0 });
      };
    }

    reset();
    gsap.set(svg, { clearProps: "width,height,transform" });
    gsap.set(host, { clearProps: "transform,width" });
    // Hand `translate` back to the Tailwind class. Only ever set by the reduced
    // branch above, and only reachable from here if the OS preference flipped
    // mid-session and re-ran this effect — but a stale inline override would
    // silently move the whole composition off its anchor.
    host.style.translate = "";

    const tl = gsap.timeline({ onComplete: finish });

    if (sequence === "full") {
      /* ---------------------------------------------------------------
         Opening state: the whole name posed into its own layout, at one
         scale, visible. The mark sits underneath it at the same cap height,
         invisible.
      --------------------------------------------------------------- */
      gsap.set(glyphEls, { display: "" });
      INTRO_GLYPHS.forEach((g, i) => namePose(glyphEls[i], g));
      gsap.set(glyphEls, { opacity: 1 });

      // 1. HOLD. A gap, not a tween: nothing animates before 0.300.

      /* 2. DROP. The ten non-initials shrink onto the shared baseline and
            fade, staggered left to right in document order.

            THEY FADE SYMMETRICALLY IN PLACE. They do NOT converge on anything,
            and that is the concept rather than a shortcut: a monogram is the
            initials that SURVIVED, so the ten are discarded, not carried in.
            Giving them a destination would sweep ten letterforms through the
            mark's 64-unit letter gap, which is the overlapping mess `docs/07`
            §3 already reverted, and would fill the centre that phase 3's slide
            needs empty in order to read as closing up.

            THE ORIGIN IS THE ADVANCE CENTRE ON `BASELINE`, set in `namePose`.
            This said "THE ORIGIN IS THE PEN ORIGIN, NOT THE GLYPH'S BOX
            CENTRE… the drift is a few pixels… correcting it would mean
            per-glyph ink bounds and a compensating translation on a group that
            is disappearing." The drift was real and measured (9–13px left,
            7–11px down at 1440×900), the correction needed no ink bounds — the
            font's own advance was already there — and the compensating
            translation is one term in a pose that was being written anyway. */
      const dropEls = glyphEls.filter((_, i) => INTRO_GLYPHS[i].letter === null);
      tl.to(
        dropEls,
        {
          opacity: 0,
          scale: NAME_SCALE * DROP_SCALE,
          duration: DROP_S,
          stagger: DROP_STAGGER_S,
          ease: "power2.in",
        },
        T_DROP,
      );

      /* 3. SLIDE. The two survivors close up into a solid pair, re-centred.
            SCALE IS UNTOUCHED HERE — it is the constant that keeps a single
            type scale on screen, and `SLIDE_X` is a pen-origin x in the same
            space `nameX` was, so this is one tween per letter on one property.

            No `y` term, unlike the DOM original: that measured `dy` existed
            because a flexed name can WRAP on a narrow viewport and a wrapped
            FLIP that only corrects x slides the S onto a different line. An
            SVG scales instead of wrapping, so there is no second line to
            land on. */
      INTRO_GLYPHS.forEach((g, i) => {
        if (!g.letter) return;
        tl.to(
          glyphEls[i],
          {
            x: SLIDE_X[g.letter] - g.markX,
            duration: SLIDE_S,
            ease: "power3.inOut",
          },
          T_SLIDE,
        );
      });

      /* 4. MORPH. The material change, overlapping the tail of the slide: the
            letterforms are still closing when the mark comes up underneath
            them. Both halves are at the SAME CAP HEIGHT and share a centre —
            `NAME_SCALE` about `ANCHOR_X` on the mark's side, `SLIDE_X`'s
            advance-centred pair on the name's — so this is a swap in place
            rather than a dissolve between two sizes. */
      tl.to(
        initialEls,
        {
          opacity: 0,
          scale: NAME_SCALE * MORPH_SWELL,
          duration: MORPH_S,
          ease: GSAP_EASE.ui,
        },
        T_MORPH,
      );
      tl.fromTo(
        wrapper,
        { opacity: 0, scale: NAME_SCALE * MORPH_MARK_FROM },
        {
          opacity: 1,
          scale: NAME_SCALE,
          duration: MORPH_S,
          ease: GSAP_EASE.hero,
        },
        T_MORPH,
      );
    } else {
      // sequence === "mark": start already formed. Phases 4 through 7.
      gsap.set(glyphEls, { display: "none" });
      tl.fromTo(
        wrapper,
        { opacity: 0, scale: NAME_SCALE * MORPH_MARK_FROM },
        {
          opacity: 1,
          scale: NAME_SCALE,
          duration: MORPH_S,
          ease: GSAP_EASE.hero,
        },
        0,
      );
    }

    /* The mark is formed and still from here. The two entry points converge:
       `"full"` has spent its setup, `"mark"` has only paid for the morph. */
    const tSettled = sequence === "full" ? T_SETTLED : MORPH_S;
    /* Phase 7's instant, and the hand-off's. It was `tZoomIn` until the camera
       was retired; the name now says what starts here rather than what used
       to. */
    const tHandoff = tSettled + ZOOM_OUT_S + BREATH_S;

    /* -------------------------------------------------------------------
       5. ZOOM OUT. The whole stage, so the mark backs off as one object.

       `GSAP_EASE.hero` is the long front-loaded tail: it arrives quickly and
       then almost stops, which is what makes this read as settling rather than
       as a second move.
    ------------------------------------------------------------------- */
    tl.to(
      stage,
      { scale: ZOOM_OUT_SCALE, duration: ZOOM_OUT_S, ease: GSAP_EASE.hero },
      tSettled,
    );

    /* 6. BREATH. Nothing is scheduled between the zoom-out and the dissolve.
          It is a named phase rather than a `+=0.22` buried in a call signature
          because a designer has to be able to retune it. */

    /* The navbar rides the same instant, in THIS timeline, because
       "simultaneous" arranged as two adjacent calls is simultaneous until one
       of them is retuned. `Hero.tsx` starts its own arrival off `onHandoff`
       below — on the same instant but NOT on the same constant: it runs 1.30s
       so the hero is still settling when the plate has gone. This comment
       claimed "the same shared duration" and "on the same constant" until
       2026-08-22; both were true only of the reverted merge sequence. */
    if (nav) {
      gsap.set(nav, { yPercent: -100 });
      tl.to(
        nav,
        { yPercent: 0, duration: HANDOFF_DURATION_S, ease: "power2.out" },
        tHandoff,
      );
    }

    /* -------------------------------------------------------------------
       7. DISSOLVE, which IS the transition, on every route.

       THERE IS NO BRANCH HERE ANY MORE. Until 2026-08-22 this section asked
       `getHeroStage()` and ran one of two endings: a ×17 `power2.in` camera on
       the stage over 0.95s with the plate dissolving over its back two-thirds,
       or — off Home, where there is no full-viewport stage to aim at — this
       fade. `getHeroStage()` was the file's only route-dependent read and it is
       gone with the camera. `Navbar.tsx` still imports it and is untouched.

       The stage simply holds at `ZOOM_OUT_SCALE`, where phase 5 left it, and
       the plate fades out from under the mark. It begins ON the hand-off
       instant rather than two-thirds of the way through a camera move, and it
       carries `onHandoff` from its own `onStart` because it is the only tween
       left at this instant. The mark needs no tween of its own — it is a child
       of this element and fades with it, at the same rate.
    ------------------------------------------------------------------- */
    tl.to(
      plate,
      {
        autoAlpha: 0,
        duration: DISSOLVE_S,
        ease: "power2.in",
        onStart: handoff,
      },
      tHandoff,
    );

    /* THE PALETTE HAND-OFF, WHICH IS NOT THE SAME INSTANT AS THE HAND-OFF.
       Scheduled on THIS timeline at an absolute position rather than fired from
       a `setTimeout` in the navbar: a timeline call is killed with the timeline
       and drifts with nothing, and it keeps the fraction next to the tween it
       is a fraction OF. `PLATE_GROUND_RATIO` carries the arithmetic and the two
       measurements that rule out both ends of this tween. */
    tl.call(plateCleared, undefined, tHandoff + DISSOLVE_S * PLATE_GROUND_RATIO);

    return () => {
      tl.kill();
      // A gate unmounted mid-sequence must not strand the bar off-screen: it is
      // a sibling this component reached out to, so putting it back is this
      // component's responsibility.
      if (nav) gsap.set(nav, { yPercent: 0 });
    };
  }, [playToken, sequence, reducedMotion, letters]);

  return (
    <div
      ref={plateRef}
      // Consumed by the no-JS net in app/layout.tsx, and SHARED with
      // `AssetLoader.tsx`'s plate because the two are one gate — one attribute,
      // one rule. Do not rename without changing that selector in the same
      // commit.
      //
      // ON THIS PLATE IT IS INSURANCE, NOT A LIVE FIX, and that is stated
      // rather than glossed for the same reason `[data-page-stack]`'s caveat
      // is: this component only ever mounts after `AssetLoader` reports ready,
      // which requires JS, so it can never appear in a document that has none.
      // The plate that DOES ship in the static HTML is the loader's. This one
      // carries the attribute anyway because the two plates are the same
      // surface to a reader, and an attribute on only one of them is the kind
      // of asymmetry that gets "tidied" the wrong way later.
      data-intro-plate
      // FIXED, not absolute: the plate must cover the VIEWPORT rather than any
      // one section, so nothing can be revealed by a scroll that lands before
      // the lock attaches — and so the navbar, which is also fixed, is covered
      // for the whole sequence rather than floating over it.
      className="fixed inset-0 z-50 overflow-hidden bg-hero-surface"
      // The whole plate is transient chrome and the name it shows is the <h1>
      // of the page underneath. Announcing it here would read the site's title
      // twice to a screen-reader user, once from content that is about to
      // vanish.
      aria-hidden="true"
    >
      {/*
        POSITIONED BY THE MARK'S ANCHOR, NOT BY THE BOX.

        `(296, 288)` has to land on dead viewport centre, and it sits at 50% of
        the mark's width and 90% of its height. So the box is offset by exactly
        that: `-translate-x-1/2 -translate-y-[90%]`. The name inherits it for
        free, because the name is drawn on the same baseline in the same
        viewBox (`docs/07` §3.2).

        The width cap keeps the spectacle from becoming a billboard on an
        ultrawide.
      */}
      <div
        ref={hostRef}
        className="absolute left-1/2 top-1/2 w-[min(84vw,420px)] -translate-x-1/2 -translate-y-[90%] md:w-[min(62vw,720px)]"
      >
        {/*
          THE STAGE — a separate element from the one above on purpose: that div
          owns the composition's offset and this one owns `scale`, so GSAP never
          has to share the `transform` property with a Tailwind class.

          IT WAS CALLED "THE CAMERA" UNTIL 2026-08-22, and the ×17 zoom-in it
          was named for is retired. The separation is still required, for the
          same reason: two authors on one `transform` is the bug, not the scale
          factor.

          IT IS AN HTML ANCESTOR OF THE SVG RATHER THAN A `<g>` INSIDE IT, and
          that survives the retirement too. An `<svg>` clips to its own
          viewport, so a scale applied within the coordinate system is thrown
          away at the box edge. It mattered acutely at ×17 — the mark would have
          grown into an invisible frame — and it still holds at phase 5's 0.82,
          where a `<g>` would leave the mark's outer facets clipped against a
          box that did not shrink with it.

          Its transform origin is set in `reset()` — `50% 90%`, the anchor
          again, which is the same `(296, 288)` that sits at dead viewport
          centre. THAT IDENTITY NO LONGER COUPLES THIS FILE TO `Hero.tsx`: with
          no camera there is no fixed point for the hero to expand out of, and
          `Hero.tsx`'s `50% 50%` arrival is now simply "the hero settles about
          its own centre". The coupling is retired; the pixel is still where
          phase 5 pivots.
        */}
        <div ref={stageRef} style={{ willChange: "transform" }}>
          {/*
            `text-hero-fg` IS NOT DECORATION — WITHOUT IT THE MARK FOLLOWS THE
            THEME WHILE THE PLATE DOES NOT.

            `MonogramMark` fills every path with `currentColor` and its header
            says the call site supplies the colour. Nothing between `<body>` and
            this `<svg>` declared `color`, so it resolved to
            `body { color: var(--color-fg) }` — which flips with the theme,
            while the plate above is pinned `--color-hero-surface` (#07090C) in
            BOTH themes. MEASURED on a production build, `/` at t=900ms:

              dark   #EDEDED on #07090C  17.03:1  (0.5 brighter than intended)
              light  #151515 on #07090C   1.09:1  the mark is not there

            The whole sequence was a dark-grey silhouette on near-black for
            every light-mode visitor. `RevealFooter.tsx`'s stamp
            (`className="block text-hero-fg"`) is the established fix and the
            reason is the same one written there: on a pinned dark surface the
            ink is pinned too.

            Declared cost on Home rather than buried: dark mode moves
            #EDEDED -> #E8EAEC, 17.03:1 -> 16.53:1, dL* 1.15 — at the
            just-noticeable threshold — and it makes this mark identical to the
            reveal footer's and to the hero headline's, which is the correct
            state. Light mode goes 1.09:1 -> 16.53:1.
          */}
          <MonogramMark
            variant="intro"
            className="block h-auto w-full text-hero-fg"
          />
        </div>
      </div>
    </div>
  );
}

export default Intro;
