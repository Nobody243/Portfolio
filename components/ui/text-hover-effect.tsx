"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";
import { FONT_SIZE_UNITS } from "@/components/ui/textHoverEffectMetrics";
import { useHoverCapable } from "@/lib/hooks/useHoverCapable";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * An outlined wordmark whose ink is brought to full strength by a
 * cursor-following radial mask.
 *
 * PROVENANCE, AND WHY THE FILE KEEPS ITS INSTALLED NAME. This arrived as
 * Aceternity's `text-hover-effect` registry component (`components.json` pins
 * the `@aceternity` registry). It is kept at its installed path and under its
 * installed export name so the provenance stays greppable — but it is NOT the
 * component that was installed. Roughly the only thing that survives is the
 * IDEA: an outlined wordmark whose stroke is revealed by a cursor-following
 * radial mask. That idea is genuinely right for `RevealFooter`'s plate — no
 * layout cost, no repeat, a defined end state, and it is a LUMINANCE event,
 * which is the vocabulary that surface already speaks.
 *
 * -------------------------------------------------------------------------
 * WHAT WAS CHANGED, AND WHY EACH CHANGE WAS NOT OPTIONAL.
 * -------------------------------------------------------------------------
 * Every one of these is a rule this repo records as MEASURED, not a taste
 * call. `.claude/handoff/master-followup-design.md` §C.0/§C.2.4 is the source.
 *
 *   1. FIVE HEX LITERALS DELETED (`#eab308 #ef4444 #3b82f6 #06b6d4 #8b5cf6`).
 *      `docs/03`'s whole-site sweep records ZERO hex literals in `app/` and
 *      `components/`, and CLAUDE.md allows two accents total. The reveal is now
 *      a luminance step in the surface's own foreground: `currentColor` at the
 *      parent's `/70` for the resting outline, `currentColor` at full strength
 *      through the mask. One hue, no new token, no new colour.
 *
 *      THE CYAN HALF OF THAT REFUSAL WAS OVERTURNED ON 2026-08-23, IN WRITING
 *      AND WITH THE ARITHMETIC. THE TEAL HALF STANDS, UNCHANGED.
 *
 *      It read: "NEITHER CYAN NOR TEAL, AND BOTH WERE REFUSED IN WRITING.
 *      `--accent-hero` cyan inside a 263x144 wordmark is ~9,300px of ink
 *      against the plate's one licensed 34x3px bar (102px) — 91x, which is not
 *      'sparingly'."
 *
 *      THE 9,300 WAS A FILL FIGURE, COMPUTED AGAINST A GEOMETRY THIS COMPONENT
 *      IS FORBIDDEN FROM PAINTING. It is this file's own "roughly five times"
 *      multiple of the outlined 1,860px — i.e. it priced a SOLID-FILLED,
 *      PERMANENT, device-independent wordmark. What Saad asked for, and what
 *      ships, is accent in the HOVER REVEAL ONLY. Recomputed against the real
 *      geometry, in order:
 *
 *        total outlined stroke ink at F=100    ~2,584px   (1,860 x 100/72)
 *        fraction inside the reveal disc       112.3 / 365.2 = 0.307 -> 794px
 *        mean mask alpha over a linear
 *          white->black disc                   exactly 1/3 -> ~265px
 *        cyan-weighted share of that           15.7%      -> ~42px
 *
 *      ~42px OF EFFECTIVE CYAN, present only while a fine pointer rests on the
 *      wordmark, against the licensed bar's 102px which is present 100% of the
 *      time the plate is on screen. That is ~0.4x the bar, not 91x, and it does
 *      not exist at all where `(hover: hover) and (pointer: fine)` is false.
 *      Both of CLAUDE.md's conditions — "sparingly", "on its own dark surface"
 *      — are met, on the plate CLAUDE.md licenses by name.
 *
 *      CYAN ON THE RESTING STROKE IS STILL REFUSED, and that version of the
 *      refusal is still correct: permanent, device-independent, ~1,163px of
 *      cyan. Cyan exists only inside the disc.
 *
 *      TEAL IS STILL REFUSED, AND MORE FIRMLY ON HOVER THAN AT REST. The area
 *      argument does not carry teal, because teal's objection was never area:
 *      `hero-accent` teal means "activate this" and nothing else on this site,
 *      so a 365px wordmark you cannot click that turns teal UNDER THE CURSOR is
 *      the canonical signal of an interactive control, on an `aria-hidden`
 *      non-link. At rest it is a static mistake; on hover it is an active lie.
 *      Do not "harmonise" this to teal later.
 *
 *      THE COLOUR IS GATED ON A REQUIRED `revealAccent` PROP WITH NO DEFAULT.
 *      See the prop's own docstring: this file is one call away from carrying
 *      #00E5FF onto a Tier 2 page, which is the `ParticleGrid` leak in its
 *      exact recorded form.
 *
 *   2. `font-[helvetica]` DELETED, three times. The site has two families and
 *      neither is Helvetica. This takes `font-sans` (Space Grotesk) from the
 *      caller's class, and the weight stays at the inherited 400 for the reason
 *      `RevealFooter`'s own `<h2>` states: the type scale carries the size.
 *
 *   3. `dark:stroke-neutral-800` DELETED. The plate is `bg-hero-surface`,
 *      PINNED DARK IN BOTH THEMES — a `dark:` variant here flips ink on a
 *      ground that does not flip, which is the exact bug `Intro.tsx` records
 *      finding on `MonogramMark` (1.09:1 in light mode). There is no `dark:`
 *      variant anywhere in this file and there must never be one.
 *
 *   4. THE 4s `strokeDashoffset` DRAW-ON IS DELETED, NOT RETIMED, and this is
 *      the disqualifying one. `RevealFooter.tsx` retired three `Reveal`s at
 *      every width for precisely this defect: "the plate is in the viewport
 *      from FIRST PAINT, pinned at the bottom and occluded, so [it] fires
 *      immediately, behind the page, and the sequence finishes before the
 *      visitor sees any of it." A mount-fired 4s stroke draw has that defect
 *      and is worse — it does not even need an IntersectionObserver to be
 *      wrong. RETIMING DOES NOT FIX IT: any trigger that would work (a
 *      ScrollTrigger on the sentinel, a high-threshold IO) is a SCROLL-POSITION
 *      DRIVER, and `RevealFooter`'s header lists "no GSAP, no ScrollTrigger, no
 *      parallax, no scroll-linked value, no `useScroll`" as things that must
 *      stay absent. The wordmark renders in its resting state. It is a fourth
 *      ELEMENT on that plate, not a fourth GESTURE.
 *
 *   5. BOTH GRADIENTS RECONSIDERED, AND ON 2026-08-23 A THIRD WAS ADDED.
 *
 *      The demo's rainbow `linearGradient` is gone outright and stays gone —
 *      five hues is the registry component's tell, and multi-hue stops are
 *      refused here permanently. The `radialGradient` that drives the `<mask>`
 *      is NOT PAINT: it is a luminance ramp, never composited onto the plate,
 *      and it is byte-identical to what shipped.
 *
 *      THIS SECTION ENDED "Nothing on screen is ever a gradient: the wordmark
 *      is one flat colour at one of two strengths." THAT SENTENCE IS NOW FALSE
 *      and is rewritten here rather than left standing while the code
 *      contradicts it — the same treatment `RevealFooter`'s viewport-unit ban
 *      got. A second `radialGradient` paints the REVEAL LAYER'S STROKE, ramping
 *      `--accent-hero` at the disc's centre to `currentColor` by 45% of its
 *      radius.
 *
 *      THE NARROWING THAT MAKES `RevealFooter`'s BAN SURVIVABLE: the ban is on
 *      gradient SURFACE FILLS — a gradient plate, a gradient panel, a gradient
 *      text fill. What ships is the colour ramp of a 1.5px stroke inside a
 *      cursor-following disc, which touches no surface and exists only during
 *      hover. THE ONE-LINE TEST: a gradient that any visitor can see without
 *      moving a pointer is still banned here.
 *
 *      REJECTED ALONGSIDE IT, so the next reader does not re-propose them: any
 *      glow, blur or `filter: drop-shadow` on the stroke (`RevealFooter` bans
 *      glow/blur/box-shadow by name, and a glowing cyan wordmark is the single
 *      most recognisable "premium template" footer detail in the genre — the
 *      luminance step IS the effect); animated stop offsets or auto-shifting
 *      hue (a second, self-driving motion author on a plate the visitor can sit
 *      on forever); and the literal-compliance alternative of two nested masked
 *      layers with a flat cyan inner disc, which produces a hard colour edge
 *      mid-glyph and costs a third `<text>` and a second mask to satisfy the
 *      letter of a rule while breaking its spirit.
 *
 *   6. `preserveAspectRatio` SET TO `xMinYMid meet`. Unset it defaults to
 *      `xMidYMid`, which CENTRES the wordmark inside its box — and Rule S-1 is
 *      "nothing on this site is ever a centred content column". `x="0"` +
 *      `textAnchor="start"` put the leading edge on the spine.
 *
 *   7. `strokeWidth` 0.3 USER UNITS -> 1.5 PLUS `vector-effect:
 *      non-scaling-stroke`. 0.3 user units in a 100-unit box rendered at 144px
 *      tall is 0.43px — a sub-pixel hairline, i.e. invisible. `non-scaling-
 *      stroke` makes it exactly 1.5px at EVERY rendered size, which is what a
 *      responsive SVG needs and what the demo lacks; 1.5px is `ScrollCue`'s
 *      existing hairline weight.
 *
 *   8. THE POINTER PATH REBUILT. The demo did `setState` on every `mousemove`
 *      and read `getBoundingClientRect()` in the effect that fired from it — a
 *      forced layout per pointer event on the Tier 1 echo plate. This
 *      coalesces to at most ONE read per animation frame and maps through
 *      `getScreenCTM()`, which honours `preserveAspectRatio` exactly rather
 *      than re-deriving it by hand.
 *
 *   9. HOVER GATED ON CAPABILITY, NOT ON WIDTH. See `HOVER_CAPABLE_QUERY`.
 *
 *  10. REDUCED MOTION HONOURED. See `useReducedMotion` below. The demo had no
 *      branch at all, and `docs/07` §8 requires one of all motion.
 *
 * -------------------------------------------------------------------------
 * THE RESTING STATE IS THE DESIGN. THE REVEAL IS AN ENHANCEMENT.
 * -------------------------------------------------------------------------
 * The outlined wordmark at the parent's `/70` with a 1.5px non-scaling stroke
 * is a complete, intentional composition. The full-strength reveal is a POINTER
 * ENHANCEMENT: nothing is missing without it, no information is behind it, and
 * no visitor is told it exists. A hover effect that is load-bearing is a bug;
 * this one is not.
 *
 * IT STAYS OUTLINED IN BOTH STATES, and that is an ink-budget decision rather
 * than a look. At F=100 the outlined `SAAD` carries ~2,584px of stroke ink
 * against `RevealFooter`'s three link values at `text-body` (~1,860px), and a
 * SOLID-FILLED one would carry roughly five times as much — which would make a
 * decorative signature out-weigh the three links the footer exists to deliver.
 * THE EFFECTIVE FIGURE FELL EVEN AS THE WORDMARK GREW, because the resting
 * alpha fell in the same change: 1,860 x 0.70 = 1,302px before, 2,584 x 0.45 =
 * 1,163px after, i.e. -11%. The reveal moves the stroke from 0.45 to full and
 * ramps its hue; it does not fill the glyphs. DO NOT ADD A `fill`.
 */

/*
 * THE CAPABILITY QUERY MOVED TO `lib/hooks/useHoverCapable.ts` ON 2026-08-23,
 * when `/about`'s flip board became its second consumer. It used to be declared
 * here along with its three `useSyncExternalStore` helpers, under a long note
 * whose last line was "DO NOT MIX THE TWO SPELLINGS IN ONE COMPONENT" — which
 * is exactly the hazard a second private copy in a second file would have
 * created, one level up. The hook carries that whole argument now, including
 * why `ParticleGrid`'s width gate is correct where it is and must not be
 * harmonised to this one.
 *
 * WHAT DID NOT CHANGE: the server snapshot is still `false`, and this component
 * still gates only its EVENT HANDLERS, never its markup, so both branches emit
 * identical DOM.
 */

/** The viewBox is `0 0 viewBoxWidth 100`. Height is fixed so the caller only
 *  ever has to supply the string's measured advance. */
const VIEWBOX_HEIGHT = 100;


/** Space Grotesk cap height, em-relative. See `FONT_SIZE_UNITS`. */
const CAP_HEIGHT_RATIO = 0.7;

/**
 * The baseline, placed so the CAP BOX is optically centred in the 100-unit
 * viewBox: `(100 - 50.4) / 2 = 24.8` above the caps, baseline at `75.2`.
 *
 * EXPLICIT, RATHER THAN `dominantBaseline="middle"` AS THE DEMO HAD IT. The
 * `middle` baseline is defined against the font's x-height, which is the wrong
 * reference for an all-caps string and resolves out of the font's baseline
 * table rather than out of anything stated here. This is arithmetic on one
 * measured ratio and it lands the same in every engine.
 */
const BASELINE_Y =
  (VIEWBOX_HEIGHT + FONT_SIZE_UNITS * CAP_HEIGHT_RATIO) / 2;

/**
 * The reveal disc's radius, in USER UNITS — 39 of the 100-unit box, so a
 * 78-unit spotlight against a 70-unit cap: roughly one-and-a-bit letters at a
 * time. At a 144px render that is a ~112px disc.
 *
 * IT MUST MOVE WITH `FONT_SIZE_UNITS` AND NOTHING FORCES IT TO. The radius is
 * absolute in the viewBox while the box's rendered height is fixed by a class,
 * so when the type went 72 -> 100 on 2026-08-23 a radius left at 28 would have
 * held the disc at 40.3px while the cap grew to 100.8px — the spotlight
 * silently dropping from the "one-and-a-bit letters" this docstring states to
 * 0.79 of one letter, which reads as a keyhole rather than a reveal. THE
 * INVARIANT IS THE RATIO:
 *
 *     REVEAL_RADIUS_UNITS / (FONT_SIZE_UNITS x CAP_HEIGHT_RATIO)
 *       = 28 / 50.4 = 39 / 70 = 0.5571
 *
 * 28 x 100/72 = 38.89, rounded to 39 (0.5571 against the old 0.5556 — within
 * 0.3%). IF `FONT_SIZE_UNITS` EVER MOVES AGAIN, MOVE THIS WITH IT.
 *
 * USER UNITS AND `gradientUnits="userSpaceOnUse"` TOGETHER. The demo's `20%`
 * against `userSpaceOnUse` resolves against the viewport rather than the
 * viewBox and is ambiguous across engines; a user-unit radius is not.
 */
const REVEAL_RADIUS_UNITS = 39;

/** Stroke weight in CSS px, held constant at every rendered size by
 *  `vector-effect="non-scaling-stroke"`. Matches `ScrollCue`'s hairline. */
const STROKE_PX = 1.5;

/**
 * The resting outline's alpha — 0.45, and THE MECHANISM MATTERS AS MUCH AS THE
 * NUMBER.
 *
 * THE VALUE. 0.45 of `--color-hero-fg` (#E8EAEC) composited on
 * `bg-hero-surface` (#07090C) is #6C6E70, which is **3.91:1**. The caller used
 * to pass `text-hero-fg/70` (8.17:1); Saad asked on 2026-08-23 for a lighter,
 * more background-level resting state to go with the larger size. The next step
 * down, 0.40, computes to 3.31:1 — 0.31 of headroom over the floor, which is
 * the same thin margin this project has twice rejected as an unsafe rule
 * (`docs/03`'s `/60` on `bg-elevated`, and `/50` on this very surface). 0.35 is
 * 2.79:1 and fails outright. **0.45 IS THE FLOOR VALUE HERE AND 0.40 IS NOT A
 * FALLBACK.**
 *
 * THE FLOOR IT IS HELD TO IS 3:1, NOT 4.5:1, AND NOT "NONE". WCAG 1.4.3 exempts
 * logotypes outright and this is a signature wordmark, but "no requirement" is
 * not the standard this site holds: `docs/03` says `aria-hidden` exempts
 * nothing, because 1.4.3 protects a low-vision user looking straight at it. The
 * stricter of the two floors that actually apply to a DECORATIVE element is the
 * site's existing 3:1 non-text floor — the one `HeroHeadline`'s reduced-motion
 * chevron sits on at `/55`. 0.91 of headroom over it.
 *
 * WHY IT IS `strokeOpacity` AND NOT `text-hero-fg/45` ON THE PARENT. A text
 * token carrying a sub-`/70` alpha modifier would breach the letter of
 * `docs/03`'s floor rule, and it is exactly what that spec's whole-site sweep
 * greps for ("Sub-`/70` text opacities: 1"). It is also byte-identical in shape
 * to the loader regression this project just closed, where "the value silently
 * drifted to `/45` (3.90:1, failing)" — a future sweeper would flag it as that
 * bug and would be right to. As a PAINT PROPERTY on a decorative, `aria-hidden`
 * logotype it is categorically the same kind of value as `QUIET_FIELD`'s
 * `nodeAlpha` (0.30 / 0.17), which nobody has ever considered a text-opacity
 * violation because it is not one. The sweep stays clean and the count of
 * sub-`/70` TEXT opacities stays at 1.
 *
 * IT APPLIES TO THE RESTING LAYER ONLY. The masked reveal layer paints at full
 * strength through the gradient, so the rest -> hover ratio widens from 2.02x
 * to 4.23x — which is most of what makes the reveal a larger event at the new
 * size than it was at the old one.
 */
const RESTING_STROKE_ALPHA = 0.45;

export const TextHoverEffect = ({
  text,
  viewBoxWidth,
  revealAccent,
  className,
}: {
  text: string;
  /**
   * The string's own advance width in user units at `FONT_SIZE_UNITS`, so the
   * box is the wordmark and carries no dead space on either side. The caller
   * supplies it because the caller is the one that knows the string; see
   * `RevealFooter.tsx`'s `WORDMARK_ADVANCE_UNITS` for the derivation from the
   * font's own metrics.
   */
  viewBoxWidth: number;
  /**
   * Whether the cursor reveal ramps through `--accent-hero` cyan — REQUIRED,
   * WITH NO DEFAULT, AND THE ABSENCE OF A DEFAULT IS THE GUARD.
   *
   * This file lives in `components/ui/`, is generically named, and takes a
   * string plus a width: it is one call away from being mounted on a Tier 2
   * page, at which point a defaulted `true` would carry #00E5FF there without
   * anybody typing the token. THAT IS NOT HYPOTHETICAL — it is the
   * `ParticleGrid` leak in its exact recorded form (`docs/03`: a component
   * generalised to a second render site carried the Tier 1 accent to a Tier 2
   * page while `grep -rn "accent-hero" components/` kept returning clean,
   * "because nobody had to type the token to leak it"). The surface a control
   * sits on is the CALL SITE's knowledge, so the call site has to state it.
   *
   * Same idiom and same reasoning as `PageStack`'s `fade`, `ProjectDetailFrame`'s
   * `as` and `ThemeToggle`'s required `className`. `false` puts `currentColor`
   * at every stop, which is exactly the pre-2026-08-23 behaviour.
   */
  revealAccent: boolean;
  /** Sets `color`, which both layers read through `currentColor`. */
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  const hoverCapable = useHoverCapable();
  const reducedMotion = useReducedMotion();

  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({
    cx: viewBoxWidth / 2,
    cy: VIEWBOX_HEIGHT / 2,
  });

  // `useId` rather than a literal: two instances on one page would otherwise
  // share one `<mask>` id, and the second would silently win. Nothing renders
  // two today; nothing should have to check.
  const rawId = useId();
  const maskId = `wordmark-mask-${rawId}`;
  const gradientId = `wordmark-reveal-${rawId}`;
  // A THIRD paint id, derived the same way and for the same reason. Two
  // instances on one page would otherwise share it and the second would
  // silently win.
  const paintId = `wordmark-paint-${rawId}`;

  // Coalesced to one layout read per frame. `getScreenCTM()` honours
  // `preserveAspectRatio` and the viewBox mapping exactly, so there is no
  // hand-rolled scale/offset arithmetic here to drift out of sync with the
  // attributes above.
  const flush = useCallback(() => {
    frameRef.current = null;
    const svg = svgRef.current;
    const point = pendingRef.current;
    if (!svg || !point) return;

    const screenToUser = svg.getScreenCTM()?.inverse();
    if (!screenToUser) return;

    const mapped = new DOMPoint(point.x, point.y).matrixTransform(screenToUser);
    setMaskPosition({ cx: mapped.x, cy: mapped.y });
  }, []);

  const handleMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      pendingRef.current = { x: event.clientX, y: event.clientY };
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(flush);
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Gated on capability, not on width, and only the handlers are gated — the
  // markup below is identical either way. See `getHoverCapableServerSnapshot`.
  const pointerHandlers = hoverCapable
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        onMouseMove: handleMove,
      }
    : undefined;

  // REDUCED MOTION: the TRAVEL goes, the cross-fade stays. That is exactly what
  // `CopyEmailButton` does on this same plate ("drops its 115% travel to 0% and
  // cross-fades in place at DURATION.micro"), and it is the right split here
  // too — the spotlight's position is authored by the visitor's own hand, so
  // making it follow instantly is the reduced-motion answer, not removing it.
  // No new curve and no new duration: `EASE.ui` and `DURATION.micro` are the
  // site's existing micro-interaction vocabulary.
  const followDuration = reducedMotion ? 0 : DURATION.micro;

  // Shared by both layers so they are the same shape to the pixel. Only the
  // colour strength and the mask differ.
  const glyphProps = {
    x: 0,
    y: BASELINE_Y,
    textAnchor: "start" as const,
    fill: "none",
    strokeWidth: STROKE_PX,
    vectorEffect: "non-scaling-stroke" as const,
    fontSize: FONT_SIZE_UNITS,
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewBoxWidth} ${VIEWBOX_HEIGHT}`}
      // Rule S-1: the leading edge is the spine, never a centred column.
      preserveAspectRatio="xMinYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={`block select-none ${className ?? ""}`}
      {...pointerHandlers}
    >
      <defs>
        <motion.radialGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          r={REVEAL_RADIUS_UNITS}
          initial={false}
          animate={maskPosition}
          transition={{ duration: followDuration, ease: EASE.ui }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>

        {/*
          THE PAINT GRADIENT — the one thing on this plate that is a gradient,
          and it is a STROKE RAMP, never a surface. See §5 of the header.

          IT INHERITS `cx`, `cy` AND `r` FROM THE MASK'S GRADIENT VIA `href`,
          AND THAT IS THE MECHANISM RATHER THAN A CONVENIENCE. SVG gradient
          attribute inheritance hands this element the mask's ANIMATED centre
          for free, so there is exactly ONE animator and two consumers. Two
          independently-animated gradients following one pointer can differ by a
          frame, and a one-frame hue desync on a 1.5px stroke is a visible
          shimmer. Only the `<stop>` children are overridden.

          VERIFIED, not assumed: `href` is the SVG2 spelling and the legacy one
          is `xlink:href`. Measured in a headed production Chromium at three
          pointer x-positions, the sampled stroke hue tracks the cursor, which
          is only possible if inheritance resolves AND re-resolves as the
          referenced attributes animate. If a target engine is ever found where
          it does not, the fallback is a second `motion.radialGradient` bound to
          the same `maskPosition` state with the same transition — correct in
          practice, but it is the version with the desync exposure.

          THE RAMP IS CENTRED ON THE CURSOR, NOT LAID ALONG THE WORDMARK. A
          gradient anchored to the glyphs would be a static property OF the
          glyphs, shown through the mask as an arbitrary slice of itself: the
          colour would not be CAUSED by the pointer, and the right-hand letters
          would carry no accent at all at any pointer position. Centred, every
          reveal has a cyan core and a neutral surround wherever it happens.

          NOTHING HERE ANIMATES ON ITS OWN. No stop-offset animation, no hue
          rotation, no drift when the pointer is still. The only animated values
          on this element are the inherited pointer-driven `cx`/`cy`.
        */}
        <radialGradient id={paintId} href={`#${gradientId}`}>
          <stop
            offset="0%"
            stopColor={revealAccent ? "var(--accent-hero)" : "currentColor"}
          />
          <stop offset="45%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" />
        </radialGradient>

        <mask id={maskId}>
          <rect
            x="0"
            y="0"
            width={viewBoxWidth}
            height={VIEWBOX_HEIGHT}
            fill={`url(#${gradientId})`}
          />
        </mask>
      </defs>

      {/* The resting composition. Always painted, at the parent's own colour
          through `currentColor`, held down to `RESTING_STROKE_ALPHA` — 3.91:1
          on #07090C. The alpha is on the PAINT, not on the caller's text token;
          the constant's docstring is why. */}
      <text
        {...glyphProps}
        stroke="currentColor"
        strokeOpacity={RESTING_STROKE_ALPHA}
      >
        {text}
      </text>

      {/* The enhancement: the same outline at FULL strength, shown only through
          the cursor's disc, and ramped from cyan at the disc's centre to
          `currentColor` by 45% of its radius. `opacity` carries the fade in and
          out; the gradient carries the hue. The caller's `text-hero-fg` class
          used to be repeated here to override a `/70` parent — the parent is
          full strength now, so the override is gone rather than left fighting
          the gradient silently. */}
      <motion.text
        {...glyphProps}
        stroke={`url(#${paintId})`}
        mask={`url(#${maskId})`}
        initial={false}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{
          duration: reducedMotion
            ? 0
            : hovered
              ? DURATION.micro
              : DURATION.ui,
          ease: EASE.ui,
        }}
      >
        {text}
      </motion.text>
    </svg>
  );
};

export default TextHoverEffect;
