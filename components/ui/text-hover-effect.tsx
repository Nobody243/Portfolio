"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { motion } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";
import { FONT_SIZE_UNITS } from "@/components/ui/textHoverEffectMetrics";
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
 *      NEITHER CYAN NOR TEAL, AND BOTH WERE REFUSED IN WRITING. `--accent-hero`
 *      cyan inside a 263x144 wordmark is ~9,300px of ink against the plate's
 *      one licensed 34x3px bar (102px) — 91x, which is not "sparingly". And
 *      `hero-accent` teal means "activate this" and nothing else on this site;
 *      a 263px teal wordmark you cannot click is the largest possible version
 *      of that mistake. Do not "improve" this by colouring it.
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
 *   5. BOTH GRADIENTS RECONSIDERED. `RevealFooter` bans "no gradient" alongside
 *      glow/blur/box-shadow/radius. The rainbow `linearGradient` is gone
 *      outright. The `radialGradient` that remains is NOT PAINT — it is the
 *      luminance ramp of an SVG `<mask>`, never composited onto the plate, and
 *      the ban is a ban on gradient FILLS on that surface. Nothing on screen
 *      is ever a gradient: the wordmark is one flat colour at one of two
 *      strengths.
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
 * than a look. Measured against `RevealFooter`'s three link values at
 * `text-body` (~1,860px of ink), an outlined `SAAD` carries a comparable
 * amount and a SOLID-FILLED one would carry roughly five times as much — which
 * would make a decorative signature out-weigh the three links the footer
 * exists to deliver. The reveal moves the stroke from `/70` to full; it does
 * not fill the glyphs. DO NOT ADD A `fill`.
 */

/**
 * A CAPABILITY QUERY, NOT A BREAKPOINT, AND THE SPELLING IS THE POINT.
 *
 * Without it, iOS and Android synthesise `mouseenter` + `mousemove` on tap: a
 * tap anywhere on the wordmark would flash the reveal and leave it stuck on
 * until the next tap elsewhere — sticky hover, the classic mobile artefact, on
 * a decorative element the visitor did not mean to touch.
 *
 * `docs/03` forbids behaviour that is specific to a breakpoint ("a phone gets
 * the site's normal motion language, not a degraded Home"). This is not a
 * breakpoint: it says "this input device has no hover", which is a statement
 * about the DEVICE rather than about its size, and it is correct on a
 * touch-capable laptop where a width test is not.
 *
 * `INTERACTIVE_MIN_WIDTH = 768` in `ParticleGrid` gates the particle field's
 * cursor void by WIDTH for the same underlying reason. That is existing and
 * fine. DO NOT MIX THE TWO SPELLINGS IN ONE COMPONENT, and do not "harmonise"
 * the field's gate to match this one — the field is an `/about` render site.
 */
const HOVER_CAPABLE_QUERY = "(hover: hover) and (pointer: fine)";

function subscribeHoverCapable(onChange: () => void) {
  const mediaQuery = window.matchMedia(HOVER_CAPABLE_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getHoverCapableSnapshot(): boolean {
  return window.matchMedia(HOVER_CAPABLE_QUERY).matches;
}

/**
 * Server snapshot is `false` for the same reason `useReducedMotion`'s is: no
 * input device exists during prerender. The consumer must therefore emit
 * IDENTICAL DOM in both branches — which is why the reveal layer below is
 * always rendered and only the LISTENERS are gated. Event handlers are not
 * markup, so gating them cannot produce a hydration mismatch; removing an
 * element would.
 */
function getHoverCapableServerSnapshot(): boolean {
  return false;
}

function useHoverCapable(): boolean {
  return useSyncExternalStore(
    subscribeHoverCapable,
    getHoverCapableSnapshot,
    getHoverCapableServerSnapshot,
  );
}

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
 * The reveal disc's radius, in USER UNITS — 28 of the 100-unit box, so a
 * 56-unit spotlight against a 50.4-unit cap: roughly one-and-a-bit letters at a
 * time. At a 144px render that is an ~81px disc.
 *
 * USER UNITS AND `gradientUnits="userSpaceOnUse"` TOGETHER. The demo's `20%`
 * against `userSpaceOnUse` resolves against the viewport rather than the
 * viewBox and is ambiguous across engines; a user-unit radius is not.
 */
const REVEAL_RADIUS_UNITS = 28;

/** Stroke weight in CSS px, held constant at every rendered size by
 *  `vector-effect="non-scaling-stroke"`. Matches `ScrollCue`'s hairline. */
const STROKE_PX = 1.5;

export const TextHoverEffect = ({
  text,
  viewBoxWidth,
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
    stroke: "currentColor",
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

      {/* The resting composition. Always painted, at the parent's own colour —
          which `RevealFooter` sets to `text-hero-fg/70`, measured 8.17:1 on
          #07090C. */}
      <text {...glyphProps}>{text}</text>

      {/* The enhancement: the same outline at FULL strength (16.53:1), shown
          only through the cursor's disc. `opacity` rather than a colour swap,
          so there is one painted colour on this surface and one alpha. */}
      <motion.text
        {...glyphProps}
        mask={`url(#${maskId})`}
        className="text-hero-fg"
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
