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
 * THE SEQUENCE — seven phases, restored. `docs/06_INTRO_AND_CHROME.md` §2 and
 * `docs/07_SITE_RESTRUCTURE.md` §3.
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
 *   7  2.215 → 3.165  ZOOM IN.   ×17, straight through the viewport and into
 *                                the Hero. THE ZOOM-IN IS THE TRANSITION.
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

import { getHeroStage } from "@/components/hero/heroStage";
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
const ZOOM_OUT_SCALE = 0.82;
/** 6. The breath at the bottom of the zoom-out, before the camera commits. */
const BREATH_S = 0.22;
/** 7. */
const ZOOM_IN_S = 0.95;
const ZOOM_IN_SCALE = 17;
/**
 * The plate dissolves over the back two-thirds of the zoom.
 *
 * NOT AT THE TOP: the mark is still small at that point and would read as an
 * object sitting on the hero rather than as something the camera is moving
 * through. NOT AT THE VERY END EITHER, which is where the original started — a
 * fade confined to the last third meant the hero underneath had finished its
 * own arrival before anyone could see it, and the hand-off collapsed back into
 * the cut this whole sequence exists to avoid.
 */
const PLATE_DISSOLVE_RATIO = 0.66;

/**
 * PHASE 7, OFF HOME. The plate's dissolve when there is no hero stage to point
 * a camera at — `/work` and `/about`.
 *
 * IT IS NOT A SECOND ENDING. It is the same ending with nothing to aim at:
 * phase 7 keeps its curve and loses its property, `power2.in` moving from
 * `scale` to `autoAlpha`. The stage holds at `ZOOM_OUT_SCALE` and the mark
 * fades with the plate it is a child of, at the same rate.
 *
 * WHY THE CAMERA CANNOT COME ALONG, in three parts and none of them taste:
 *
 *   1. THE RECEIVING GEOMETRY DOES NOT EXIST. Home's `scale 1.12 -> 1` at
 *      `50% 50%` lands only because the hero is `h-dvh` at the top of the
 *      document at scroll 0, so the section's centre IS the camera's fixed
 *      point. On `/work` dead viewport centre at scroll 0 is inside the first
 *      card row; on `/about` it is inside the paragraph.
 *   2. A TRANSFORM ON THE PAGE RE-PARENTS THIS PLATE. `transform` creates a
 *      containing block for every `position: fixed` descendant, so a scale
 *      arrival on the page stack would capture the plate that is supposed to be
 *      leaving independently. `PageStack.tsx` states the same rule from its
 *      side.
 *   3. 12% IS SIX AND A HALF TIMES THE SITE'S TRAVEL BUDGET. At 1440 a card
 *      title 700px from centre displaces 84px under `scale 1.12`; the site's
 *      timed reveal travels 13px and its scrub caps at 21px.
 *
 * WHY `power2.in` RATHER THAN `GSAP_EASE.ui`, and it is the same reason phase 7
 * already gives: every shared curve decelerates into its end state, which is
 * right for something arriving and wrong for something leaving. The plate is
 * leaving. It also buys back the one thing this seam cannot remove — in light
 * mode the ground travels L* 2.41 -> 98.99 across ~93% of the viewport, and no
 * mechanic deletes that ramp. On a 0.55s dissolve `GSAP_EASE.ui` is halfway
 * through the lightness change at 193ms; `power2.in` is halfway at 389ms, 2.0x
 * longer, and it delivers 25% rather than 68% of the ramp in the first 275ms.
 *
 * DO NOT APPLY THIS CURVE TO HOME. Home's dissolve has no lightness ramp to
 * shape — `bg-hero-surface` onto `bg-hero-surface`, 1.00:1 in both themes — and
 * `PLATE_DISSOLVE_RATIO` above is tuned against a camera.
 *
 * WHY 0.55s AND NOT LONGER, since longer is gentler: the destination's entrance
 * is fired at the hand-off + 0.20s and its opacity leg is 0.35s, so a longer
 * outgoing half puts the incoming one back behind an opaque plate — the
 * "animates in secret" failure this whole arrangement exists to repair. At
 * 0.75s the entrance would be 85% done at the frame the plate is half gone.
 * 0.55s is the balance point and the tension is real rather than a preference.
 */
const OFF_HOME_DISSOLVE_S = 0.55;

/** The navbar's slide, from `lib/animation/handoff.ts` so that the timing and
 *  the DOM contract it depends on stay in one place.
 *
 *  IT IS THE NAVBAR'S DURATION ONLY. This read "Both halves of the handoff.
 *  Shared with `Hero.tsx` and `Navbar.tsx` through one constant" — `Hero.tsx`
 *  stopped importing it when the zoom-in was restored, because the incoming
 *  half has to OUTLAST the outgoing one (its `ARRIVAL_S` is 1.6s against this
 *  0.45s). What the three components share is the START INSTANT. */
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
 * The sequence's full length, DERIVED rather than typed — 3.165s.
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
 * IT IS HOME'S TOTAL. Off Home phase 7 is a 0.55s dissolve rather than a 0.95s
 * camera, so the sequence ends at `T_SETTLED + ZOOM_OUT_S + BREATH_S +
 * OFF_HOME_DISSOLVE_S` = 2.765s. That is deliberate and correct — the whole
 * entry is shorter on the routes that have no hero to arrive into — and it is
 * another reason not to schedule against this constant.
 */
export const INTRO_TOTAL_S =
  T_SETTLED + ZOOM_OUT_S + BREATH_S + ZOOM_IN_S; // 3.165

export type IntroSequence = "full" | "mark";

type IntroProps = {
  /**
   * `"full"` — all seven phases, the first-visit entry.
   * `"mark"` — phases 4 through 7 only, starting from the formed monogram. No
   * name, no drop, no slide: the mark and the camera move that carries you
   * somewhere else, which is the shape a section transition wants.
   */
  sequence?: IntroSequence;
  /**
   * Change this value to replay. A token rather than a boolean so that
   * replaying twice in a row is expressible; a `playing` flag would have to be
   * toggled off and on again, which is a race.
   */
  playToken?: number;
  /**
   * Fired as the ZOOM-IN begins, not when it ends.
   *
   * This is the signal the hero uses to start its own arrival, and the overlap
   * between the two is what makes the handoff continuous instead of a cut.
   * `docs/06` §2 requires it, and collapsing it into `onComplete` turns the
   * seam back into a cut. The navbar rides the same instant.
   */
  onHandoff?: () => void;
  /** Fired once the plate is finished and can be unmounted. */
  onComplete?: () => void;
};

export function Intro({
  sequence = "full",
  playToken = 0,
  onHandoff,
  onComplete,
}: IntroProps) {
  const reducedMotion = useReducedMotion();

  const plateRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  /* Callbacks through refs, so a parent re-render that produces new function
     identities cannot restart a running timeline. */
  const onHandoffRef = useRef(onHandoff);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onHandoffRef.current = onHandoff;
    onCompleteRef.current = onComplete;
  }, [onHandoff, onComplete]);

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
      // The camera's fixed point, written here rather than as a Tailwind
      // `origin-` class so that ONE author owns it: GSAP writes this
      // element's `transform`, and a transform origin living in a class is a
      // value nobody sees when they read the tween.
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
      tl.to(plate, { autoAlpha: 0, duration: REDUCED_FADE_S, onStart: handoff });
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
    const tZoomIn = tSettled + ZOOM_OUT_S + BREATH_S;

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

    /* 6. BREATH. Nothing is scheduled between the zoom-out and the zoom-in.
          It is a named phase rather than a `+=0.22` buried in a call signature
          because a designer has to be able to retune it. */

    /* THE ONE BRANCH IN THE SEQUENCE, AND IT IS NOT A PATHNAME CHECK.
       `getHeroStage()` asks the DOM whether this route renders the full-viewport
       stage the camera is aimed at — the same read the navbar's palette uses,
       for the reason its own header gives about an open project overlay. Read
       here, inside the effect, never during render. */
    const heroStage = getHeroStage() !== null;

    /* -------------------------------------------------------------------
       7. ZOOM IN, which IS the transition — ON HOME.

       `power2.in` and not one of the shared curves, and this is the single
       deliberate exception in the file. Every shared curve DECELERATES into its
       end state, which is correct for something ARRIVING. This is the opposite:
       the camera commits slowly and then accelerates past the viewport, and it
       is the HERO underneath that decelerates into place. An eased-out zoom
       here would put the brakes on at the exact frame the move is supposed to
       be handing over, which reads as a stop followed by a cut.

       OFF HOME THERE IS NO TWEEN HERE AT ALL. The stage simply holds at
       `ZOOM_OUT_SCALE`, where phase 5 left it, and phase 7 becomes the plate's
       own dissolve — see `OFF_HOME_DISSOLVE_S`. `onHandoff` still fires on the
       same instant, `tZoomIn`, from that tween's `onStart`, so no consumer has
       to know which exit ran.
    ------------------------------------------------------------------- */
    if (heroStage) {
      tl.to(
        stage,
        {
          scale: ZOOM_IN_SCALE,
          duration: ZOOM_IN_S,
          ease: "power2.in",
          onStart: handoff,
        },
        tZoomIn,
      );
    }

    /* The navbar rides the same instant, in THIS timeline, because
       "simultaneous" arranged as two adjacent calls is simultaneous until one
       of them is retuned. `Hero.tsx` starts its own arrival off `onHandoff`
       above — on the same instant but NOT on the same constant: it runs 1.6s
       so the hero is still settling when the camera leaves. This comment
       claimed "the same shared duration" and "on the same constant" until
       2026-08-22; both were true only of the reverted merge sequence. */
    if (nav) {
      gsap.set(nav, { yPercent: -100 });
      tl.to(
        nav,
        { yPercent: 0, duration: HANDOFF_DURATION_S, ease: "power2.out" },
        tZoomIn,
      );
    }

    if (heroStage) {
      tl.to(
        plate,
        {
          autoAlpha: 0,
          duration: ZOOM_IN_S * PLATE_DISSOLVE_RATIO,
          ease: GSAP_EASE.ui,
        },
        tZoomIn + ZOOM_IN_S * (1 - PLATE_DISSOLVE_RATIO),
      );
    } else {
      /* OFF HOME: the dissolve IS phase 7, so it begins ON the hand-off instant
         rather than two-thirds of the way through a camera move, and it carries
         `onHandoff` because there is no zoom tween left to carry it. The mark
         needs no tween of its own — it is a child of this element and fades
         with it, at the same rate. */
      tl.to(
        plate,
        {
          autoAlpha: 0,
          duration: OFF_HOME_DISSOLVE_S,
          ease: "power2.in",
          onStart: handoff,
        },
        tZoomIn,
      );
    }

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
          THE CAMERA, and it is a separate element from the one above on
          purpose: that div owns the composition's offset and this one owns the
          zoom, so GSAP never has to share the `transform` property with a
          Tailwind class.

          IT IS AN HTML ANCESTOR OF THE SVG RATHER THAN A `<g>` INSIDE IT. An
          `<svg>` clips to its own viewport, so a ×17 scale applied within the
          coordinate system would be thrown away at the box edge — the mark
          would grow into an invisible frame. Scaling the element that CONTAINS
          the svg scales the viewport too, and the plate's `overflow-hidden` is
          then the only thing doing any clipping.

          Its transform origin is set in `reset()` — `50% 90%`, the anchor
          again, so the camera's fixed point is the same `(296, 288)` that sits
          at dead viewport centre, which is the pixel `Hero.tsx` expands out of.
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
