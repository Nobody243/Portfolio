"use client";

/**
 * The INTRO — the branded, choreographed reveal. Formerly, and wrongly, called
 * `HeroLoader`.
 *
 * IT IS NOT A LOADER AND IT NEVER WAS. A loader answers "are the assets ready".
 * This answers nothing; it is a scripted timeline with known durations whose
 * only job is how the site feels in its first three seconds. The two were
 * conflated in the old filename, and the conflation had already produced the
 * exact bug `docs/06_INTRO_AND_CHROME.md` §1 warns about — a fixed clock
 * standing in for real progress. `AssetLoader.tsx` is now the loader, it gates
 * this component, and by the time this plays every font it measures against is
 * already in.
 *
 * THE SEQUENCE, as confirmed:
 *
 *   1. "Muhammad Saad" is shown, set and held long enough to read as a name
 *      rather than as a flash.
 *   2. It CONTRACTS to the "MS" mark: everything but the two initials drops
 *      out of the layout, the survivors slide together, and the pair is
 *      handed over to the liquid letterforms — this is the jelly-blob-inside-
 *      the-glyphs beat.
 *   3. A small ZOOM-OUT on the mark. A beat of settling, not a hard cut: the
 *      mark backs off slightly and breathes.
 *   4. A smooth ZOOM-IN that carries straight into the Hero. THE ZOOM-IN IS
 *      THE TRANSITION — not a step that happens before one. The plate never
 *      cuts; the mark accelerates past the viewport while the plate dissolves
 *      and the hero, which has been settling out of its own matching
 *      over-scale the whole time, is simply where the camera arrives.
 *
 * REPLAYABLE BY CONSTRUCTION, and that is a requirement rather than a nicety.
 * The same mark-reveal motion is scheduled to double as a section-transition
 * beat later, so this is not a mount-only animation: the timeline is BUILT
 * FRESH on every play, keyed off `playToken`, and `sequence="mark"` plays the
 * mark half on its own (steps 2–4, no name) which is the shape a transition
 * needs. Nothing about the component assumes it has only ever run once. What
 * it deliberately does NOT own is the scroll lock — see `IntroGate.tsx`.
 *
 * THE SLIDE IN STEP 2 IS A REAL FLIP, MEASURED AT RUNTIME, and it is inherited
 * unchanged from the component this replaces. First rects are recorded, the
 * non-initial spans are collapsed out of the layout, last rects are recorded,
 * and the two initials are offset by the delta and animated back to zero.
 * Nothing here knows a pixel distance, so a font swap or a kerning change
 * cannot silently desynchronise it.
 *
 * NO FLIP PLUGIN. GSAP's Flip would do the slide in fewer lines, but a
 * four-rect manual FLIP is not where a plugin registration earns its keep, and
 * `lib/animation/gsap.ts` exists precisely because an unregistered plugin
 * fails silently in production.
 *
 * WHY GSAP AND NOT FRAMER, given the house rule is "GSAP owns scroll-synced
 * timelines, Framer owns DOM": this IS a timeline — six phases, a stagger, a
 * measured FLIP and a measured hand-off in the middle of it — and expressing it
 * as nested Framer variants with delay arithmetic is how phase boundaries drift
 * apart when one duration is retuned. The rule exists to stop the two libraries
 * producing different CURVES for the same job, and every ease below is one of
 * the shared `GSAP_EASE` curves compiled from `lib/animation/easing.ts`.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";

import { MonogramMark } from "@/components/ui/MonogramMark";
import { HERO_NAME } from "@/components/hero/heroContent";
import { GSAP_EASE, gsap } from "@/lib/animation/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/* -------------------------------------------------------------------------
   Phase durations, seconds. Tuning these is a design act; read the sequence
   comment above before moving any of them, because several overlap on purpose.
------------------------------------------------------------------------- */
const HOLD_S = 0.3;
const DROP_S = 0.35;
const DROP_STAGGER_S = 0.015;
const SLIDE_S = 0.42;
/** Text out, mark in. Overlaps the tail of the slide so the material changes
 *  while the letters are still closing, rather than after they have parked. */
const MORPH_S = 0.4;
/** Step 3. Long and soft — this beat exists to be a pause, so it must not read
 *  as another move. */
const ZOOM_OUT_S = 0.6;
const ZOOM_OUT_SCALE = 0.82;
/** The breath at the bottom of the zoom-out, before the camera commits. */
const BREATH_S = 0.22;
/** Step 4. */
const ZOOM_IN_S = 0.95;
const ZOOM_IN_SCALE = 17;
/** Reduced motion: straight to the formed monogram, then a short crossfade. */
const REDUCED_FADE_S = 0.25;

/**
 * The MonogramMark's own viewBox proportions, needed to place its glyphs on top
 * of the DOM letters. MIRRORED FROM `MonogramMark.tsx` AND ONLY VALID WHILE
 * THEY MATCH — change one and this alignment silently drifts, which is why the
 * measured fallback below exists and why the numbers are named rather than
 * inlined into the arithmetic.
 */
const MARK_VB_W = 560;
const MARK_VB_H = 320;
const MARK_FONT_SIZE = 260;

/**
 * Indices of the characters that survive: the first letter of each word.
 *
 * DERIVED FROM THE STRING, never written down as `[0, 9]`. `HERO_NAME` is
 * content and content moves; a hardcoded pair would keep animating confidently
 * after an edit and simply preserve the wrong letters.
 */
function initialIndices(name: string): Set<number> {
  const out = new Set<number>();
  let atWordStart = true;
  for (let i = 0; i < name.length; i++) {
    const ch = name[i];
    if (ch === " ") {
      atWordStart = true;
      continue;
    }
    if (atWordStart) {
      out.add(i);
      atWordStart = false;
    }
  }
  return out;
}

/**
 * Where the DOM letters' BASELINE actually sits, and how tall their glyphs
 * actually are — measured, because `getBoundingClientRect()` cannot tell you.
 *
 * THE PROBLEM THIS SOLVES. The morph swaps two DOM `<span>`s for an SVG that
 * draws the same two letters. A rect gives the LINE BOX, which includes half-
 * leading above and descender space below; the SVG's glyphs are positioned off
 * a BASELINE. Centre the SVG on the rect's centre and the mark sits a few
 * pixels low — at hero-heading size that is a visible jump in the middle of the
 * one moment on the site nobody is supposed to look away from.
 *
 * Canvas `TextMetrics` is the only API in the platform that reports both, for
 * the same font, without inserting a probe element and forcing a layout.
 *
 * RETURNS NULL RATHER THAN GUESSING when `fontBoundingBox*` is unavailable
 * (older Firefox). The caller falls back to the rect's centre, which is
 * slightly off and entirely usable — a wrong number silently applied would be
 * worse than a known approximation.
 */
function measureGlyphMetrics(el: HTMLElement, text: string) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;

  const cs = getComputedStyle(el);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = ctx.measureText(text);

  const ascent = m.fontBoundingBoxAscent;
  const descent = m.fontBoundingBoxDescent;
  if (typeof ascent !== "number" || typeof descent !== "number") return null;

  return { ascent, descent, fontSizePx: parseFloat(cs.fontSize) };
}

export type IntroSequence = "full" | "mark";

type IntroProps = {
  /**
   * `"full"` — steps 1 through 4, the first-visit entry.
   * `"mark"` — steps 2 through 4 only, starting from the formed monogram. This
   * is the shape a section transition wants: no name, just the mark and the
   * zoom that carries you somewhere else.
   */
  sequence?: IntroSequence;
  /**
   * Change this value to replay. It is a token rather than a boolean so that
   * replaying twice in a row is expressible; a `playing` flag would have to be
   * toggled off and on again, which is a race.
   */
  playToken?: number;
  /**
   * Fired as the ZOOM-IN begins, not when it ends. This is the signal the
   * destination uses to start its own arrival move, and the overlap between
   * the two is what makes the hand-off continuous instead of a cut.
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
  const nameRef = useRef<HTMLDivElement | null>(null);
  const markRef = useRef<HTMLDivElement | null>(null);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);

  /* Callbacks through refs, so a parent re-render that produces new function
     identities cannot restart a running timeline. */
  const onHandoffRef = useRef(onHandoff);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onHandoffRef.current = onHandoff;
    onCompleteRef.current = onComplete;
  }, [onHandoff, onComplete]);

  const chars = useMemo(() => [...HERO_NAME], []);
  const initials = useMemo(() => initialIndices(HERO_NAME), []);
  /** The mark's letters, from the same derivation — never the literal "MS". */
  const monogram = useMemo(
    () =>
      [...initials]
        .sort((a, b) => a - b)
        .map((i) => HERO_NAME[i])
        .join(""),
    [initials],
  );

  /**
   * Lay the SVG mark exactly over the two DOM initials.
   *
   * Called after the FLIP has settled, when the survivors are where they will
   * finally be. Everything is derived from a measurement:
   *
   *   - SIZE. The mark is scaled so its rendered font-size equals the DOM's.
   *     `MARK_FONT_SIZE` in a `MARK_VB_W`-wide viewBox means a rendered width
   *     of `domFontSize * MARK_VB_W / MARK_FONT_SIZE` produces glyphs of
   *     identical size — same face, same weight, same pixels.
   *   - VERTICAL. The mark's glyphs hang off `dominantBaseline: central`, which
   *     the SVG spec defines as the midpoint of the font's ascender and
   *     descender. So the point to align is the DOM baseline shifted up by
   *     `(ascent - descent) / 2`, both taken from the measured font metrics.
   *   - HORIZONTAL. Centred on the union of the two survivors' rects. The
   *     mark's 8-unit optical letter gap makes it about two pixels wider than
   *     the DOM pair at this size, so this is centre-aligned rather than
   *     edge-aligned; splitting the difference puts the error at a pixel per
   *     side instead of two on one.
   */
  const placeMark = useCallback(
    (rects: DOMRect[], fontSource: HTMLElement) => {
      const stage = stageRef.current;
      const mark = markRef.current;
      if (!stage || !mark || rects.length === 0) return;

      const stageRect = stage.getBoundingClientRect();
      const left = Math.min(...rects.map((r) => r.left));
      const right = Math.max(...rects.map((r) => r.right));
      const top = Math.min(...rects.map((r) => r.top));
      const bottom = Math.max(...rects.map((r) => r.bottom));

      const metrics = measureGlyphMetrics(fontSource, monogram);
      const fontSizePx = metrics?.fontSizePx ?? bottom - top;
      const width = (fontSizePx * MARK_VB_W) / MARK_FONT_SIZE;
      const height = (width * MARK_VB_H) / MARK_VB_W;

      // The y the SVG's `central` baseline must land on, in viewport coords.
      const centralY = metrics
        ? // baseline, then up by half the ascender/descender span
          top +
          (bottom - top - (metrics.ascent + metrics.descent)) / 2 +
          metrics.ascent -
          (metrics.ascent - metrics.descent) / 2
        : (top + bottom) / 2;

      /*
        THE GLYPHS ARE NOT CENTRED IN THEIR OWN BOX, and centring the box would
        therefore leave the letters visibly off.

        `MonogramMark` anchors the M's END and the S's START at the viewBox
        centre, which centres the GAP between them — but M is materially wider
        than S in this face, so the pair's ink sits left of centre by half the
        difference. At the size this plays it is around nine pixels, which is
        plainly visible against the DOM text it is replacing.

        `getBBox()` and not `getBoundingClientRect()`: the mark carries a scale
        transform for the whole morph, so a screen rect would be measured
        mid-tween and the correction would depend on WHEN it was taken.
        `getBBox()` is in the SVG's own user units and is immune to that. It is
        also why this is a live measurement rather than a constant — the offset
        is a property of the FONT, and a font swap must move it.
      */
      const glyphs = mark.querySelectorAll<SVGGraphicsElement>(
        "text[data-ms-letter]",
      );
      let inkLeft = Infinity;
      let inkRight = -Infinity;
      glyphs.forEach((glyph) => {
        // Throws on a detached or display:none node in some engines.
        try {
          const box = glyph.getBBox();
          inkLeft = Math.min(inkLeft, box.x);
          inkRight = Math.max(inkRight, box.x + box.width);
        } catch {
          /* leave the bounds unset; the guard below falls back to no nudge */
        }
      });
      const inkCentre = (inkLeft + inkRight) / 2;
      const nudgeX = Number.isFinite(inkCentre)
        ? (inkCentre - MARK_VB_W / 2) * (width / MARK_VB_W)
        : 0;

      mark.style.width = `${width}px`;
      mark.style.height = `${height}px`;
      mark.style.left = `${(left + right) / 2 - width / 2 - stageRect.left - nudgeX}px`;
      mark.style.top = `${centralY - height / 2 - stageRect.top}px`;
    },
    [monogram],
  );

  /* -----------------------------------------------------------------------
     The sequence. Rebuilt from scratch on every play.
  ----------------------------------------------------------------------- */
  useEffect(() => {
    const plate = plateRef.current;
    const stage = stageRef.current;
    const name = nameRef.current;
    const mark = markRef.current;
    if (!plate || !stage || !name || !mark) return;

    const all = charRefs.current.filter(Boolean) as HTMLSpanElement[];
    const keep = [...initials]
      .sort((a, b) => a - b)
      .map((i) => charRefs.current[i])
      .filter(Boolean) as HTMLSpanElement[];
    const drop = all.filter((el) => !keep.includes(el));

    // Every play starts from a known state. Without this an interrupted or
    // repeated run inherits whatever transform the last one left behind, and
    // the second play of a "replayable" component is subtly different from the
    // first — the classic reason a reusable sequence gets called one-shot.
    const reset = () => {
      gsap.set(plate, { autoAlpha: 1 });
      gsap.set(stage, { scale: 1, transformOrigin: "50% 50%" });
      gsap.set(all, { clearProps: "all" });
      gsap.set(mark, { autoAlpha: 0, scale: 1.1, transformOrigin: "50% 50%" });
      gsap.set(name, { autoAlpha: 1 });
    };

    const finish = () => onCompleteRef.current?.();

    if (reducedMotion) {
      // The final composition, immediately: monogram formed, no contraction,
      // no zoom, no camera. Then a short crossfade out. Somebody who asked for
      // less motion is not owed a shorter version of the spectacle, they are
      // owed its absence.
      reset();
      gsap.set(drop, { display: "none" });
      placeMark(
        keep.map((el) => el.getBoundingClientRect()),
        keep[0],
      );
      gsap.set(name, { autoAlpha: 0 });
      gsap.set(mark, { autoAlpha: 1, scale: 1 });

      const tl = gsap.timeline({
        onComplete: () => {
          onHandoffRef.current?.();
          finish();
        },
      });
      tl.to(plate, { autoAlpha: 0, duration: REDUCED_FADE_S, delay: 0.2 });
      return () => {
        tl.kill();
      };
    }

    reset();
    const tl = gsap.timeline({ onComplete: finish });

    if (sequence === "full") {
      // 1. Hold, so the name registers as a word rather than as a flash.
      tl.to({}, { duration: HOLD_S });

      // 2a. Everything but the initials leaves.
      tl.to(drop, {
        opacity: 0,
        scale: 0.6,
        duration: DROP_S,
        stagger: DROP_STAGGER_S,
        ease: "power2.in",
      });

      // 2b. FLIP the two survivors together.
      tl.add(() => {
        const first = keep.map((el) => el.getBoundingClientRect());
        // Collapsing to display:none is what actually removes the width;
        // opacity alone leaves the gap and the monogram never closes up.
        gsap.set(drop, { display: "none" });
        const last = keep.map((el) => el.getBoundingClientRect());

        // PLACED BEFORE THE OFFSETS GO ON, and this ordering is load-bearing.
        // `last` is where the letters will FINISH; the moment the FLIP offsets
        // are applied a live `getBoundingClientRect()` reports where they START
        // instead, and the mark lands roughly sixty pixels off — which is what
        // the first cut of this file actually did. Passing the already-measured
        // rects rather than the elements makes that mistake unavailable.
        placeMark(last, keep[0]);

        keep.forEach((el, i) => {
          const dx = first[i].x - last[i].x;
          // Y is measured too rather than assumed zero: on a narrow viewport
          // the name can wrap, and a wrapped FLIP that only corrects X slides
          // the S horizontally onto a different line.
          const dy = first[i].y - last[i].y;
          gsap.set(el, { x: dx, y: dy });
          gsap.to(el, { x: 0, y: 0, duration: SLIDE_S, ease: "power3.inOut" });
        });
      });

      // 2c. The material change. Text out, liquid letterforms in, overlapping
      //     the tail of the slide.
      tl.to(
        name,
        { autoAlpha: 0, scale: 1.04, duration: MORPH_S, ease: GSAP_EASE.ui },
        `+=${SLIDE_S * 0.5}`,
      );
      tl.to(
        mark,
        { autoAlpha: 1, scale: 1, duration: MORPH_S, ease: GSAP_EASE.hero },
        "<",
      );
    } else {
      // sequence === "mark": start already formed. Steps 3 and 4 only.
      gsap.set(drop, { display: "none" });
      tl.add(() =>
        placeMark(
          keep.map((el) => el.getBoundingClientRect()),
          keep[0],
        ),
      );
      tl.set(name, { autoAlpha: 0 });
      tl.to(mark, {
        autoAlpha: 1,
        scale: 1,
        duration: MORPH_S,
        ease: GSAP_EASE.hero,
      });
    }

    // 3. The zoom-out. The whole stage, so the mark backs off as one object.
    //    `GSAP_EASE.hero` is the long front-loaded tail: it arrives quickly and
    //    then almost stops, which is what makes this read as settling rather
    //    than as a second move.
    tl.to(stage, {
      scale: ZOOM_OUT_SCALE,
      duration: ZOOM_OUT_S,
      ease: GSAP_EASE.hero,
    });

    // The breath. An explicit empty tween rather than a delay on the next one,
    // because a named pause is a thing a designer can retune and a `+=0.22`
    // buried in a call signature is not.
    tl.to({}, { duration: BREATH_S });

    // 4. The zoom-in, which IS the transition.
    //
    //    `power2.in` and not one of the shared curves, and this is the single
    //    deliberate exception in the file. Every shared curve decelerates into
    //    its end state, which is correct for something ARRIVING. This is the
    //    opposite: the camera commits slowly and then accelerates past the
    //    viewport, and it is the HERO underneath that decelerates into place.
    //    An eased-out zoom here would put the brakes on at the exact frame the
    //    move is supposed to be handing over, which reads as a stop followed by
    //    a cut — the thing the spec rules out.
    tl.to(stage, {
      scale: ZOOM_IN_SCALE,
      duration: ZOOM_IN_S,
      ease: "power2.in",
      onStart: () => onHandoffRef.current?.(),
    });

    // The plate dissolves over the back two-thirds of the zoom.
    //
    // NOT AT THE TOP: the mark is still small at that point and would read as an
    // object sitting on the hero rather than as something the camera is moving
    // through. NOT AT THE VERY END EITHER, which is where this started — a
    // fade confined to the last third meant the hero underneath had finished
    // its own arrival before anyone could see it, and the hand-off collapsed
    // back into the cut this whole sequence exists to avoid. Two-thirds is the
    // window in which the mark is big enough to be passing the viewer AND the
    // hero still has visible settling left to do.
    tl.to(
      plate,
      { autoAlpha: 0, duration: ZOOM_IN_S * 0.66, ease: GSAP_EASE.ui },
      `-=${ZOOM_IN_S * 0.66}`,
    );

    return () => {
      tl.kill();
    };
  }, [playToken, sequence, reducedMotion, initials, placeMark]);

  return (
    <div
      ref={plateRef}
      // FIXED, not absolute: the plate must cover the VIEWPORT rather than any
      // one section, so nothing can be revealed by a scroll that lands before
      // the lock attaches — and so the navbar, which is also fixed, is covered
      // for the whole sequence rather than floating over it.
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-hero-surface"
      // The whole plate is transient chrome and the name it shows is the <h1>
      // of the page underneath. Announcing it here would read the site's title
      // twice to a screen-reader user, once from content that is about to
      // vanish.
      aria-hidden="true"
    >
      <div
        ref={stageRef}
        className="relative"
        // The zoom runs on this element for the whole sequence, so it is
        // promoted once rather than being promoted and demoted mid-timeline.
        style={{ willChange: "transform" }}
      >
        {/* One span per character, space included, so each can be animated and
            measured independently. `whitespace-pre` keeps the space span from
            being collapsed away before the FLIP has measured it. */}
        <div
          ref={nameRef}
          className="flex whitespace-pre text-h3 font-medium text-hero-fg/70 sm:text-h2"
        >
          {chars.map((ch, i) => (
            <span
              key={i}
              ref={(el) => {
                charRefs.current[i] = el;
              }}
              className="inline-block"
            >
              {ch}
            </span>
          ))}
        </div>

        {/*
          The mark, absolutely positioned INSIDE the stage and laid over the two
          initials by `placeMark`. Inside rather than beside, so the zoom
          transforms the mark and the (already invisible) name as one object and
          there is no second transform to keep in sync.

          `liquid` runs for the whole sequence. It is the expensive layer, and
          the justification is that it is on screen for under three seconds,
          exactly once per session, on the one surface where the site is
          allowed to spend its Tier 1 budget.
        */}
        <div ref={markRef} className="absolute" style={{ willChange: "transform, opacity" }}>
          <MonogramMark
            variant="intro"
            liquid
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default Intro;
