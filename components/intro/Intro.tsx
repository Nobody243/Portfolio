"use client";

/**
 * The INTRO — the branded, choreographed reveal.
 *
 * IT IS NOT A LOADER AND IT NEVER WAS. A loader answers "are the assets ready".
 * This answers nothing; it is a scripted timeline with known durations whose
 * only job is how the site feels in its first two and a half seconds.
 * `AssetLoader.tsx` is the loader, it gates this component, and by the time
 * this plays everything it needs is already in.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE SEQUENCE — `docs/07_SITE_RESTRUCTURE.md` §3, split per phase in
 * `.claude/handoff/intro-timing-design.md`:
 *
 *   A  0.00 → 0.22   "Muhammad Saad" appears, as STROKED OUTLINES.
 *   B  0.22 → 0.35   It holds, long enough to read as a name.
 *   C  0.35 → 1.40   THE BECOMING. The two capitals travel to dead centre and
 *                    deform into the mark's traces while still in motion; the
 *                    other ten glyphs collapse into their own word's initial
 *                    and fade. The letters MEET at 1.19 with the shape exactly
 *                    80% resolved, and the last 20% completes with both letters
 *                    stationary.
 *   D  1.40 → 1.90   The mark contracts to a single dot at `(296, 288)` — its
 *                    own seam — then holds there for 60ms.
 *   E  1.90 → 2.35   The hero expands out of that dot and the navbar slides
 *                    down, on the same start and the same duration.
 *
 * WHAT REPLACED THE OLD SHAPE, and why the total fell from ~3.24s to 2.35s:
 * the zoom-out and the breath (0.82s between them) are GONE, not shortened.
 * §3 replaces steps 3–4 with a contraction to a point, so there is no backing-
 * off beat to pay for. Setup only needed a modest trim — 1.47 → 1.40 — and the
 * handoff is held at 0.95s, the exact weight the old `ZOOM_IN_S` had. Reading
 * "trim the early setup harder" as an instruction to absorb the whole saving
 * would leave the name on screen for under half a second, and §3 step 1 asks
 * for it to register as a NAME.
 *
 * DO NOT TUNE THESE INDEPENDENTLY. Phase C's 80/100 split and phase D's stroke
 * ramp are each derived from their own duration; moving one without the other
 * breaks a stated guarantee rather than altering feel.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * NOTHING IS EVER FILLED, FROM THE FIRST FRAME TO THE LAST. The name is not DOM
 * `<text>`; it is Space Grotesk's own contours, pre-extracted at build time and
 * rendered as strokes. Fill and stroke do not interpolate into each other, so a
 * filled name would force a paint-mode swap mid-timeline — and any dressing of
 * that swap is the crossfade §3 step 2 explicitly rules out. One paint mode
 * throughout is what makes "a becoming, not a crossfade" literally true.
 *
 * THE `TextMetrics` BASELINE PROBE IS GONE, along with the three mirrored mark
 * constants it fed. The old morph measured DOM letters at runtime to place an
 * SVG `<text>` of the same font on top of them; there is no font size to match
 * and no DOM baseline to align to any more, because both ends of the morph are
 * path data in one coordinate system. `components/ui/msMarkGeometry.ts` holds
 * that system and every number in it.
 *
 * REPLAYABLE BY CONSTRUCTION. The timeline is BUILT FRESH on every play, keyed
 * off `playToken`, and `sequence="mark"` plays the handoff half alone (D and E,
 * starting from the settled mark) which is the shape a section transition
 * needs. What it deliberately does NOT own is the scroll lock — see
 * `IntroGate.tsx`.
 *
 * WHY GSAP AND NOT FRAMER, given the house rule is "GSAP owns scroll-synced
 * timelines, Framer owns DOM": this IS a timeline — five phases, three
 * staggers, a path morph and a two-sided handoff in the middle of it — and
 * expressing it as nested Framer variants with delay arithmetic is how phase
 * boundaries drift apart when one duration is retuned.
 *
 * THE EASES ARE GSAP BUILT-INS HERE, NOT THE SHARED `GSAP_EASE` SET, and that
 * is a change from the file this replaces. The timing brief names them
 * individually — `power2.out` for A and E, linear for C's morph, `power2.in`
 * for D — and its reasoning for D is the one the old file already carried for
 * its zoom-in: every shared curve DECELERATES into its end state, which is
 * right for something arriving and wrong for something leaving. The one place
 * a shared curve still applies is the plate dissolve, which is a UI fade.
 */

import { useEffect, useMemo, useRef } from "react";

import { MonogramMark } from "@/components/ui/MonogramMark";
import {
  BASELINE,
  CONTRACT_X,
  CONTRACT_Y,
  INTRO_GLYPHS,
  INTRO_INITIALS,
  INTRO_REST,
  NAME_CAP_UNITS,
  NAME_SCALE,
  NODE_RATIO,
  TRACE,
  VB_H,
  capFromHeight,
  msStroke,
  type MarkLetter,
} from "@/components/ui/msMarkGeometry";
import { GSAP_EASE, gsap } from "@/lib/animation/gsap";
import { HANDOFF_S, NAV_ENTRANCE_ATTR } from "@/lib/animation/handoff";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/* -------------------------------------------------------------------------
   Phase durations, seconds. Every value is from
   `.claude/handoff/intro-timing-design.md` §7. Read the header before moving
   any of them.
------------------------------------------------------------------------- */
/** A — the name arrives. */
const NAME_IN_S = 0.22;
/** B — it holds. Short, but §3 step 1 asks for the name to register. */
const NAME_HOLD_S = 0.13;
/** C — approach and deformation, the phase the sequence is named for. */
const BECOMING_S = 1.05;

/**
 * WITHIN C, SHAPE AND POSITION MUST NOT FINISH TOGETHER.
 *
 * Translation runs to 0.80·C on `power2.out`; the morph runs the full C,
 * linear. So at the instant the letters meet, the shape is exactly 80%
 * resolved — §3 step 2's figure by arithmetic rather than by feel — and the
 * final 20% completes with both letters STATIONARY at centre.
 *
 * That 0.21s tail is the phase's whole argument. It is what makes "a becoming,
 * not a crossfade" observable rather than asserted: the viewer watches the last
 * of the letterform resolve into trace AFTER motion has stopped, which is the
 * opposite of a swap hidden under movement. NEVER LET THE TAIL REACH ZERO — a
 * morph that completes exactly on arrival reads as a cut disguised by
 * translation, which is the failure the spec names.
 *
 * Linear on the morph is deliberate. Path interpolation already decelerates
 * perceptually because the geometry itself is converging, and an eased morph on
 * top of that reads as hesitation.
 */
const BECOMING_MEET_RATIO = 0.8;

/** The ten non-initials are gone by 45% of C. */
const GLYPH_FADE_RATIO = 0.45;
/**
 * Per-glyph delay, ordered OUTWARD-IN from each word's end — the last letter
 * leaves first. Inward-out leaves the two capitals momentarily alone with a gap
 * where the word was, which reads as deletion rather than as reduction.
 */
const GLYPH_STAGGER_S = 0.014;

/** The power-up. Opacity only, monotonic, one pass, in draw order: a neon-sign
 *  stutter is the most tired move in this visual genre and is ruled out. */
const NODE_STAGGER_S = 0.018;
const NODE_FADE_S = 0.12;

/** D — the contraction, then the beat that makes it read as an arrival. */
const CONTRACT_S = 0.44;
/**
 * THE HOLD IS THE WHOLE BEAT. Without it the contraction and the expansion read
 * as one continuous rubber-band motion through zero. With it, the mark arrives,
 * exists as a point, and then the site opens out of it — and the eye has a
 * fixed thing to be anchored on when the hero starts.
 */
const CONTRACT_HOLD_S = 0.06;

/**
 * THE STROKE RAMP IS A CORRECTNESS REQUIREMENT, NOT POLISH.
 *
 * `vector-effect="non-scaling-stroke"` holds stroke width constant in device
 * pixels REGARDLESS OF SCALE. A mark shrinking toward a point with a fixed
 * weight therefore THICKENS INTO A BLOB as its geometry collapses inside its
 * own outline. Ramping the weight down in lockstep is what keeps it reading as
 * a mark shrinking rather than as an ink spill.
 *
 * The brief states it as 10px → 3.6px, against an Intro mark whose cap it puts
 * at ~386px. The RATIO is what is invariant — 0.36 — and it is applied to
 * whatever weight `msStroke()` actually produces for the rendered box, so the
 * ramp is correct at every viewport instead of only at one.
 */
const STROKE_END_RATIO = 0.36;

/** E — both halves of the handoff. Shared with `Hero.tsx` and `Navbar.tsx`
 *  through one constant, because "simultaneous" written twice is not. */
const EXPAND_S = HANDOFF_S;
/**
 * The plate finishes dissolving BEFORE the expansion does.
 *
 * The old timeline had the hero's arrival finishing while the plate was still
 * 74% opaque — by the time anyone could see it, it had already happened.
 * Front-loading the dissolve is the inverse of that mistake: the last third of
 * the hero's expansion happens in front of the visitor.
 */
const PLATE_DISSOLVE_S = 0.3;

/* Reduced motion: a different, shorter thing — not this sequence slowed down.
   §6 of the timing brief; §8 of `docs/07`. */
const REDUCED_MARK_IN_S = 0.2;
const REDUCED_HOLD_S = 0.1;
const REDUCED_FADE_S = 0.25;
/** The About instance's rendered height. Under reduced motion the mark appears
 *  at About weight — settled, modest, no spectacle — rather than at the Intro's
 *  full Tier 1 scale. */
const REDUCED_MARK_H = 72;

/* Absolute phase boundaries, so the timeline reads the same way the brief's
   table does and nothing depends on the order tweens happen to be added in. */
const T_BECOMING = NAME_IN_S + NAME_HOLD_S; // 0.35
const T_CONTRACT = T_BECOMING + BECOMING_S; // 1.40
const T_EXPAND = T_CONTRACT + CONTRACT_S + CONTRACT_HOLD_S; // 1.90
export const INTRO_TOTAL_S = T_EXPAND + EXPAND_S; // 2.35

export type IntroSequence = "full" | "mark";

type IntroProps = {
  /**
   * `"full"` — A through E, the entry sequence.
   * `"mark"` — D and E only, starting from the settled mark. No name, no
   * approach, no morph: the contraction and the handoff, which is the shape a
   * section transition wants.
   */
  sequence?: IntroSequence;
  /**
   * Change this value to replay. A token rather than a boolean so that
   * replaying twice in a row is expressible; a `playing` flag would have to be
   * toggled off and on again, which is a race.
   */
  playToken?: number;
  /**
   * Fired as the EXPANSION begins, not when it ends.
   *
   * This is the signal the hero uses to start its own arrival, and the overlap
   * between the two is what makes the handoff continuous instead of a cut.
   * `docs/06` §2 requires it, and collapsing it into `onComplete` turns the
   * seam back into a cut. The navbar now rides the same instant.
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
  const markRef = useRef<HTMLDivElement | null>(null);

  /* Callbacks through refs, so a parent re-render that produces new function
     identities cannot restart a running timeline. */
  const onHandoffRef = useRef(onHandoff);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onHandoffRef.current = onHandoff;
    onCompleteRef.current = onComplete;
  }, [onHandoff, onComplete]);

  /** The mark's letters, derived from the geometry module's own derivation of
   *  `HERO_NAME` — never the literal "MS". */
  const letters = useMemo(
    () => INTRO_GLYPHS.filter((g) => g.letter).map((g) => g.letter as MarkLetter),
    [],
  );

  useEffect(() => {
    const plate = plateRef.current;
    const host = markRef.current;
    if (!plate || !host) return;

    const svg = host.querySelector("svg");
    if (!svg) return;

    const letterEls = letters
      .map((key) => svg.querySelector<SVGGElement>(`[data-ms-letter="${key}"]`))
      .filter((el): el is SVGGElement => el !== null);
    const traceEls = letters
      .map((key) => svg.querySelector<SVGPathElement>(`[data-ms-trace="${key}"]`))
      .filter((el): el is SVGPathElement => el !== null);
    const nodeGroups = [...svg.querySelectorAll<SVGGElement>("[data-ms-nodes]")];
    // Document order, which is M's five in trace order then S's six — the draw
    // order the power-up stagger is specified against.
    const nodeEls = [...svg.querySelectorAll<SVGPathElement>("[data-ms-node]")];
    const restEls = [...svg.querySelectorAll<SVGGElement>("[data-ms-glyph]")];
    const wrapper = svg.querySelector<SVGGElement>("[data-ms-wrapper]");
    if (!wrapper || letterEls.length !== letters.length) return;
    if (traceEls.length !== letters.length) return;

    /*
      WEIGHTS ARE MEASURED, NOT WRITTEN DOWN.

      The mark's box is sized in CSS (`min(62vw, 720px)`), so its cap height —
      and therefore every stroke weight in the sequence — depends on the
      viewport. `msMarkGeometry.ts`'s rule maps cap height to weight; this reads
      the box once and applies it. A constant here would be right at exactly one
      window size and quietly wrong at every other, which is the failure
      `non-scaling-stroke` was adopted to prevent in the first place.
    */
    const boxH = svg.getBoundingClientRect().height || VB_H;
    const markStroke = msStroke(capFromHeight(boxH));
    const nameStroke = msStroke((NAME_CAP_UNITS / VB_H) * boxH);
    const dotStroke = markStroke * STROKE_END_RATIO;

    const setStroke = (px: number) =>
      gsap.set(svg, { "--ms-stroke": `${px}px`, "--ms-node": `${px * NODE_RATIO}px` });

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
      gsap.set(wrapper, { scale: 1, svgOrigin: `${CONTRACT_X} ${CONTRACT_Y}` });
      gsap.set(nodeGroups, { opacity: 1 });
      gsap.set(nodeEls, { opacity: 0 });
      if (nav) gsap.set(nav, { yPercent: 0 });
    };

    /** Put a letter or glyph group at its position in the OPENING NAME.
     *
     *  Both poses are expressed against the same origin — the glyph's own ink
     *  origin in the settled mark — so "settled" is the identity transform and
     *  the tween back to it needs no correction term. `svgOrigin` and not
     *  `transformOrigin`: the former is in the SVG's user coordinate system,
     *  which is the space every number in the geometry module is stated in. */
    const namePose = (el: Element, markX: number, x: number) =>
      gsap.set(el, {
        svgOrigin: `${markX} ${BASELINE}`,
        scale: NAME_SCALE,
        x: x - markX,
        y: 0,
      });

    const finish = () => onCompleteRef.current?.();
    const handoff = () => onHandoffRef.current?.();

    /* -------------------------------------------------------------------
       REDUCED MOTION — a fade to the settled mark and an instant reveal.

       Not the sequence at another speed: no name, no approach, no morph, no
       contraction, and the mark never appears mid-ramp. Somebody who asked for
       less motion is not owed a shorter version of the spectacle, they are owed
       its absence.

       THE DOM IS IDENTICAL ON BOTH PATHS, deliberately. `useReducedMotion`
       returns `false` during prerender and corrects on hydration, so a branch
       that rendered different markup would be a hydration mismatch. The size
       and state changes below are all imperative.
    ------------------------------------------------------------------- */
    if (reducedMotion) {
      reset();
      // The box shrinks to the About instance and re-centres on its own middle
      // rather than on the contraction point: with no contraction there is
      // nothing for that offset to serve, and a settled mark hanging above
      // centre would just look misplaced.
      gsap.set(host, { width: "auto", xPercent: -50, yPercent: -50 });
      gsap.set(svg, { height: REDUCED_MARK_H, width: "auto" });
      setStroke(msStroke(capFromHeight(REDUCED_MARK_H)));
      gsap.set(restEls, { display: "none" });
      letters.forEach((key, i) => {
        gsap.set(traceEls[i], { attr: { d: TRACE[key] } });
        gsap.set(letterEls[i], { clearProps: "transform" });
      });
      gsap.set(letterEls, { opacity: 0 });
      gsap.set(nodeEls, { opacity: 1 });

      const tl = gsap.timeline({ onComplete: finish });
      tl.to(letterEls, { opacity: 1, duration: REDUCED_MARK_IN_S, ease: "power2.out" });
      tl.to({}, { duration: REDUCED_HOLD_S });
      tl.to(plate, { autoAlpha: 0, duration: REDUCED_FADE_S, onStart: handoff });
      return () => {
        tl.kill();
      };
    }

    reset();
    gsap.set(svg, { clearProps: "width,height,transform" });
    gsap.set(host, { clearProps: "transform,width" });

    const tl = gsap.timeline({ onComplete: finish });

    if (sequence === "full") {
      /* ---------------------------------------------------------------
         Opening state: the name, in outline, invisible.

         `--ms-glyph-stroke` is set for the ten non-initials and is NOT
         ramped. They keep the name's weight while the two capitals grow into
         the mark's, because a glyph getting heavier while it shrinks out of
         view blots rather than fades.
      --------------------------------------------------------------- */
      gsap.set(svg, { "--ms-glyph-stroke": `${nameStroke}px` });
      setStroke(nameStroke);

      gsap.set(restEls, { display: "" });
      INTRO_REST.forEach((g, i) => namePose(restEls[i], g.markX, g.nameX));
      letters.forEach((key, i) => {
        const g = INTRO_INITIALS[key];
        gsap.set(traceEls[i], { attr: { d: g.d } });
        namePose(letterEls[i], g.markX, g.nameX);
      });

      const nameEls = [...restEls, ...letterEls];
      gsap.set(nameEls, { opacity: 0 });

      // A — the name arrives.
      tl.to(
        nameEls,
        { opacity: 1, duration: NAME_IN_S, ease: "power2.out" },
        0,
      );

      // B is a gap, not a tween: nothing is animating between 0.22 and 0.35.

      /* C — the becoming. Four tracks, all starting together, all ending at
         different times. That spread IS the phase. */
      letters.forEach((key, i) => {
        // Position: arrives at 0.80·C.
        tl.to(
          letterEls[i],
          {
            x: 0,
            y: 0,
            scale: 1,
            duration: BECOMING_S * BECOMING_MEET_RATIO,
            ease: "power2.out",
          },
          T_BECOMING,
        );
        // Shape: runs the whole of C, linear.
        tl.to(
          traceEls[i],
          {
            morphSVG: { shape: TRACE[key], shapeIndex: 0 },
            duration: BECOMING_S,
            ease: "none",
          },
          T_BECOMING,
        );
      });

      // Weight follows the shape, one property, one tween.
      tl.to(
        svg,
        {
          "--ms-stroke": `${markStroke}px`,
          "--ms-node": `${markStroke * NODE_RATIO}px`,
          duration: BECOMING_S,
          ease: "none",
        },
        T_BECOMING,
      );

      // Each word collapses into its own initial.
      INTRO_REST.forEach((g, i) => {
        tl.to(
          restEls[i],
          {
            x: g.wordNameX - g.markX,
            opacity: 0,
            duration: BECOMING_S * GLYPH_FADE_RATIO,
            ease: "power1.in",
          },
          T_BECOMING + g.fadeOrder * GLYPH_STAGGER_S,
        );
      });

      // The power-up, landing on the stationary tail.
      tl.to(
        nodeEls,
        {
          opacity: 1,
          duration: NODE_FADE_S,
          stagger: NODE_STAGGER_S,
          ease: "power2.out",
        },
        T_BECOMING + BECOMING_S * BECOMING_MEET_RATIO,
      );
    } else {
      // sequence === "mark": already settled. D and E only.
      setStroke(markStroke);
      gsap.set(restEls, { display: "none" });
      letters.forEach((key, i) => {
        gsap.set(traceEls[i], { attr: { d: TRACE[key] } });
        gsap.set(letterEls[i], { clearProps: "transform" });
      });
      gsap.set(letterEls, { opacity: 1 });
      gsap.set(nodeEls, { opacity: 1 });
    }

    /* -------------------------------------------------------------------
       D — the contraction.

       The wrapper `<g>` scales about `(296, 288)` — the baseline, in the gap
       between the two letters. NOT a `d` tween toward a degenerate path:
       MorphSVG aimed at an all-points-coincident target is unnecessary work and
       unstable at the limit.

       THE SCALE TARGETS THE WRAPPER, NEVER THE TWO `data-ms-letter` GROUPS.
       Those hooks belong to the navbar's hover gesture and to phase C's
       approach; a third author on the same transform is how two systems start
       fighting the moment anyone reuses the component.

       At `scale: 0` all twelve nodes coincide and the traces are zero-length
       round caps, so the composite final frame is a single disc at dead
       viewport centre — one defined origin for the hero to expand from, with no
       open-ended scale value anywhere.
    ------------------------------------------------------------------- */
    tl.to(
      wrapper,
      { scale: 0, duration: CONTRACT_S, ease: "power2.in" },
      T_CONTRACT,
    );
    tl.to(
      svg,
      {
        "--ms-stroke": `${dotStroke}px`,
        "--ms-node": `${dotStroke * NODE_RATIO}px`,
        duration: CONTRACT_S,
        ease: "power2.in",
      },
      T_CONTRACT,
    );

    /* -------------------------------------------------------------------
       E — the two-sided beat.

       `onHandoff` fires HERE, at the start, and the hero begins expanding while
       the plate is still dissolving. The navbar rides the same instant and the
       same duration, in this timeline, because "simultaneous" arranged as two
       adjacent calls is simultaneous until one of them is retuned.
    ------------------------------------------------------------------- */
    tl.call(handoff, undefined, T_EXPAND);

    if (nav) {
      gsap.set(nav, { yPercent: -100 });
      tl.to(nav, { yPercent: 0, duration: EXPAND_S, ease: "power2.out" }, T_EXPAND);
    }

    tl.to(
      plate,
      { autoAlpha: 0, duration: PLATE_DISSOLVE_S, ease: GSAP_EASE.ui },
      T_EXPAND,
    );
    // The timeline must still be 2.35s long even though the dissolve is shorter
    // than E, so that `onComplete` lands on the phase boundary rather than
    // 0.15s early.
    tl.to({}, { duration: 0 }, INTRO_TOTAL_S);

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
        POSITIONED BY THE CONTRACTION POINT, NOT BY THE BOX.

        `(296, 288)` has to land on dead viewport centre, and it sits at 50% of
        the mark's width and 90% of its height. So the box is offset by exactly
        that: `-translate-x-1/2 -translate-y-[90%]`. The mark therefore hangs in
        the upper-middle of the screen with its baseline running through the
        centre — which is the intended composition, not an offset to correct
        (`docs/07` §3.2). The name inherits it for free, because the name is
        drawn on the same baseline in the same viewBox, which is what makes the
        merge in §3 step 3 land where the contraction begins.

        The width cap keeps the spectacle from becoming a billboard on an
        ultrawide.
      */}
      <div
        ref={markRef}
        className="absolute left-1/2 top-1/2 w-[min(84vw,420px)] -translate-x-1/2 -translate-y-[90%] md:w-[min(62vw,720px)]"
        style={{ willChange: "transform, opacity" }}
      >
        <MonogramMark variant="intro" className="block h-auto w-full" />
      </div>
    </div>
  );
}

export default Intro;
