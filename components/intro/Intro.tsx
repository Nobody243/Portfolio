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
 *   A  0.00 → 0.22   "Muhammad Saad" appears, as FILLED GLYPH OUTLINES.
 *   B  0.22 → 0.35   It holds, long enough to read as a name.
 *   C  0.35 → 1.40   THE MERGE. The two capitals travel and grow into the
 *                    mark's own positions while the other ten glyphs collapse
 *                    into their word's initial and fade. The capitals arrive at
 *                    1.19 — the meeting, at dead centre — and CROSSFADE into
 *                    the faceted letters over 0.15s, leaving 0.06s of the
 *                    settled mark standing still before D.
 *   D  1.40 → 1.90   The mark contracts to a point at `(296, 288)` — its own
 *                    seam — then holds there for 60ms.
 *   E  1.90 → 2.35   The hero expands out of that point and the navbar slides
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
 * WHAT CHANGED WITH THE FACETED MARK, and what deliberately did not. The mark
 * is filled shapes now, so there is no path interpolation anywhere: C's old
 * 80/100 morph split and D's `--ms-stroke` ramp are BOTH DELETED, not adapted.
 * `.claude/handoff/ms-mark-faceted-design.md` §8 asks for "a convergence plus a
 * clean crossfade at the meeting point", explicitly preferring it over anything
 * that interpolates paths — simpler and more robust rather than cleverer. Every
 * phase BOUNDARY is unchanged: A, B, D and E are untouched and C still runs
 * 0.35 → 1.40 with the meeting at 1.19.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * THE NAME IS NOT DOM `<text>`, and the reason has changed. It used to be that
 * fill and stroke do not interpolate, so a morph forbade a paint-mode swap.
 * There is no morph. What still holds is that outlines put the name and the
 * mark in ONE coordinate system: each capital's journey is a tween to the
 * IDENTITY transform, so it lands on its faceted letter exactly — same
 * baseline, same cap height, same left edge. That exactness is what makes the
 * crossfade read as one letterform settling into another rather than as two
 * misaligned images dissolving. Everything is filled, name and mark alike.
 *
 * THE `TextMetrics` BASELINE PROBE IS GONE, along with the three mirrored mark
 * constants it fed. An older cut measured DOM letters at runtime to place an
 * SVG `<text>` of the same font on top of them; there is no font size to match
 * and no DOM baseline to align to any more, because both ends of the merge are
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
 * timelines, Framer owns DOM": this IS a timeline — five phases, a stagger, a
 * crossfade and a two-sided handoff in the middle of it — and expressing it as
 * nested Framer variants with delay arithmetic is how phase boundaries drift
 * apart when one duration is retuned.
 *
 * THE EASES ARE GSAP BUILT-INS HERE, NOT THE SHARED `GSAP_EASE` SET, and that
 * is a change from the file this replaces. The timing brief names them
 * individually — `power2.out` for A and E, `power2.in` for D — and its
 * reasoning for D is the one the old file already carried for its zoom-in:
 * every shared curve DECELERATES into its end state, which is right for
 * something arriving and wrong for something leaving. The one place a shared
 * curve still applies is the plate dissolve, which is a UI fade.
 */

import { useEffect, useMemo, useRef } from "react";

import { MonogramMark } from "@/components/ui/MonogramMark";
import {
  BASELINE,
  CONTRACT_X,
  CONTRACT_Y,
  INTRO_GLYPHS,
  NAME_SCALE,
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
/** C — the approach and the merge, the phase the sequence is named for. */
const BECOMING_S = 1.05;

/**
 * WHERE THE LETTERS MEET, as a fraction of C. 0.80 · 1.05 = 0.84, so the
 * meeting is at t = 1.19 absolute — unchanged from the morph version, because
 * the meeting instant is a layout fact (`docs/07` §3 step 3: the merge lands at
 * dead centre) and not a property of the technique that gets it there.
 *
 * WHAT IS NOT CARRIED OVER. The 80/100 split existed so that the morph was
 * exactly 80% resolved on arrival and the last 20% completed with the letters
 * stationary — a tail that made "a becoming, not a crossfade" observable. There
 * is no morph and no interpolation now, so the split has nothing to split:
 * translation simply ends at the meeting.
 */
const BECOMING_MEET_RATIO = 0.8;

/**
 * THE CROSSFADE, and how the remaining 0.21s of C is spent.
 *
 * The two capitals arrive on their faceted letters — same baseline, same cap
 * height, same left edge, because the name is authored in the mark's own
 * coordinate system — and dissolve into them over 0.15s, leaving 0.06s of the
 * settled mark standing perfectly still before the contraction starts.
 *
 * `ease: "none"` on BOTH halves, and that is the one thing here that is not
 * arbitrary: two opposed linear opacity ramps sum to a roughly constant
 * apparent density, whereas a pair of eased ones dips (both near 50%) or bulges
 * (both near 100%) in the middle. The dip is what makes a crossfade read as a
 * flicker.
 *
 * THE STILL TAIL IS NOT DECORATION. The old tail existed to let the viewer
 * watch a shape resolve after motion stopped; this one exists so the mark is
 * seen SETTLED, as itself, for a beat before it is taken away. Both fail the
 * same way at zero — the merge would land on the same frame the contraction
 * starts, and the mark would never exist as a finished object.
 */
const CROSSFADE_S = 0.15;

/** The ten non-initials are gone by 45% of C. */
const GLYPH_FADE_RATIO = 0.45;
/**
 * Per-glyph delay, ordered OUTWARD-IN from each word's end — the last letter
 * leaves first. Inward-out leaves the two capitals momentarily alone with a gap
 * where the word was, which reads as deletion rather than as reduction.
 */
const GLYPH_STAGGER_S = 0.014;

/** D — the contraction, then the beat that makes it read as an arrival. */
const CONTRACT_S = 0.44;
/**
 * THE HOLD IS THE WHOLE BEAT. Without it the contraction and the expansion read
 * as one continuous rubber-band motion through zero. With it, the mark arrives,
 * the plate is briefly empty, and then the site opens out of the point it
 * arrived at.
 *
 * ONE CONSEQUENCE OF THE FACETED MARK, recorded because it is a real change: a
 * stroked mark at `scale: 0` still painted its round caps, so the old hold sat
 * on a visible disc. Filled shapes have no such residue — they scale to zero
 * area and vanish. The hold's primary job, separating two moves that would
 * otherwise read as one, is unaffected.
 */
const CONTRACT_HOLD_S = 0.06;

/*
 * THE `--ms-stroke` RAMP THAT USED TO LIVE HERE IS DELETED, NOT RETUNED.
 *
 * It was a correctness requirement for a STROKED mark:
 * `vector-effect="non-scaling-stroke"` holds stroke width constant in device
 * pixels regardless of scale, so a mark shrinking toward a point with a fixed
 * weight thickens into a blob as its geometry collapses inside its own outline.
 * The ramp cancelled that.
 *
 * FILLED SHAPES SCALE THEIR OWN INK, so the hazard does not exist and a plain
 * group scale is now correct. Recorded rather than silently dropped, because
 * "there used to be a second tween here" is the kind of thing someone
 * reintroduces by analogy.
 */

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

    /* The faceted mark — the merge's TARGET half. Two groups, no transform
       written to them by this file: the navbar's hover owns their `transform`
       and the contraction owns the wrapper's. All this timeline does to them is
       opacity. */
    const letterEls = letters
      .map((key) => svg.querySelector<SVGGElement>(`[data-ms-letter="${key}"]`))
      .filter((el): el is SVGGElement => el !== null);
    /* The name — document order, which is `INTRO_GLYPHS` order, which is what
       every index below is against. */
    const glyphEls = [...svg.querySelectorAll<SVGGElement>("[data-ms-glyph]")];
    /* The two capitals, by the letter each becomes. A subset of `glyphEls`, so
       nothing here may write a property the whole-name tweens also write. */
    const initialEls = letters
      .map((key) => svg.querySelector<SVGGElement>(`[data-ms-initial="${key}"]`))
      .filter((el): el is SVGGElement => el !== null);
    const wrapper = svg.querySelector<SVGGElement>("[data-ms-wrapper]");
    if (!wrapper || letterEls.length !== letters.length) return;
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
      gsap.set(wrapper, { scale: 1, svgOrigin: `${CONTRACT_X} ${CONTRACT_Y}` });
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
      gsap.set(glyphEls, { display: "none" });
      gsap.set(letterEls, { clearProps: "transform" });
      gsap.set(letterEls, { opacity: 0 });

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
         Opening state: the name, posed into its own layout, invisible; the
         faceted mark sitting at rest underneath it, also invisible.
      --------------------------------------------------------------- */
      gsap.set(glyphEls, { display: "" });
      INTRO_GLYPHS.forEach((g, i) => namePose(glyphEls[i], g.markX, g.nameX));
      gsap.set(glyphEls, { opacity: 0 });
      gsap.set(letterEls, { opacity: 0 });

      // A — the name arrives.
      tl.to(
        glyphEls,
        { opacity: 1, duration: NAME_IN_S, ease: "power2.out" },
        0,
      );

      // B is a gap, not a tween: nothing is animating between 0.22 and 0.35.

      /* ---------------------------------------------------------------
         C — the merge. Three tracks that deliberately do not finish
         together, and the spread between them IS the phase.
      --------------------------------------------------------------- */

      /* 1. The two capitals travel and grow into the mark's own positions,
            arriving together at 0.80·C. The target is the IDENTITY transform
            — `namePose` expressed the opening state against each glyph's own
            mark-space origin precisely so that this tween needs no correction
            term and lands exactly on the faceted letter beneath it. */
      tl.to(
        initialEls,
        {
          x: 0,
          y: 0,
          scale: 1,
          duration: BECOMING_S * BECOMING_MEET_RATIO,
          ease: "power2.out",
        },
        T_BECOMING,
      );

      /* 2. Each word collapses into its own initial and fades, staggered
            outward-in from the word's end, gone by 45% of C. */
      INTRO_GLYPHS.forEach((g, i) => {
        if (g.letter) return; // the two capitals are track 1
        tl.to(
          glyphEls[i],
          {
            x: g.wordNameX - g.markX,
            opacity: 0,
            duration: BECOMING_S * GLYPH_FADE_RATIO,
            ease: "power1.in",
          },
          T_BECOMING + g.fadeOrder * GLYPH_STAGGER_S,
        );
      });

      /* 3. THE CROSSFADE, at the meeting instant. Two linear opacity ramps in
            opposite directions between two shapes that occupy the same box —
            see `CROSSFADE_S`. It finishes 0.06s before the contraction, so the
            mark exists as a finished object for a beat rather than being
            handed straight on to the next phase. */
      const meet = T_BECOMING + BECOMING_S * BECOMING_MEET_RATIO;
      tl.to(initialEls, { opacity: 0, duration: CROSSFADE_S, ease: "none" }, meet);
      tl.to(letterEls, { opacity: 1, duration: CROSSFADE_S, ease: "none" }, meet);
    } else {
      // sequence === "mark": already settled. D and E only.
      gsap.set(glyphEls, { display: "none" });
      gsap.set(letterEls, { clearProps: "transform" });
      gsap.set(letterEls, { opacity: 1 });
    }

    /* -------------------------------------------------------------------
       D — the contraction.

       ONE TWEEN, WHICH IS THE FACETED MARK'S DOING. The wrapper `<g>` scales
       about `(296, 288)` — the baseline, in the 64-unit gap between the two
       letters — and that is the entire contraction. The stroke ramp that used
       to run alongside it is deleted: filled shapes scale their own ink, so
       there is no blob to cancel.

       THE SCALE TARGETS THE WRAPPER, NEVER THE TWO `data-ms-letter` GROUPS.
       Those hooks belong to the navbar's hover gesture; a second author on the
       same transform is how two systems start fighting the moment anyone reuses
       the component.

       `scale: 0` is a defined end state rather than an open-ended shrink: the
       mark converges on one point at dead viewport centre, which is the origin
       the hero then expands out of.
    ------------------------------------------------------------------- */
    tl.to(
      wrapper,
      { scale: 0, duration: CONTRACT_S, ease: "power2.in" },
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
