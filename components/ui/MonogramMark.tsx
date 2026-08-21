"use client";

/**
 * The "MS" monogram — one geometry, two dressings.
 *
 * THIS IS THE SITE'S MARK, and it exists as a component because it now has two
 * consumers that must not be allowed to draw different letterforms:
 *
 *   - `variant="intro"` — the Tier 1 dressing. Glass pane inside the glyphs, a
 *     bright accent rim, and (with `liquid`) blobs wandering inside the
 *     letterforms. This is the "jelly blob clipped inside the letterforms" beat
 *     that `docs/06_INTRO_AND_CHROME.md` §2 calls the mark-reduction moment.
 *   - `variant="nav"` — the small, SETTLED version the navbar carries. Filled,
 *     `currentColor`, no filters, no rAF.
 *
 * WHY THE NAV VARIANT IS NOT JUST A SMALLER COPY OF THE INTRO ONE, since the
 * spec asks for "the same mark":
 *
 *   1. COLOUR. The intro dressing is built from `--accent-hero` (#00E5FF) and
 *      white-ish glass stops, which only resolve on the hero's own pinned dark
 *      plate. The navbar crosses `bg-base`, and `bg-base` FLIPS — #0A0A0B in
 *      dark, #FDFCFA in light. A cyan-on-white glass pane at 22px is invisible.
 *      `currentColor` is what lets the mark inherit the navbar's adaptive
 *      colour (see `Navbar.tsx`) instead of fighting it.
 *   2. SIZE. A 2.25-unit rim in a 320-unit viewBox is 0.15 CSS pixels at nav
 *      size. Outlined letterforms do not survive that reduction; they turn to
 *      mush. Filled glyphs do.
 *   3. COST. `feTurbulence` is one of the most expensive primitives in SVG.
 *      The navbar is `position: fixed` and therefore composited on every
 *      scroll frame for the entire session. A permanently-running displacement
 *      map there is not a style choice, it is a frame budget spent forever.
 *
 * WHAT SURVIVES ACROSS BOTH, and is the actual "same mark" claim: identical
 * viewBox proportions, identical font, weight, size and letter gap, and the
 * same two-element letter split. The nav mark is the intro mark after it has
 * cooled — which is the relationship the spec describes.
 *
 * TWO `<text>` ELEMENTS, NOT THE STRING "MS". A single text node would kern the
 * pair and give no handle on either letter. Splitting them is what makes the
 * navbar's hover micro-motion possible — the two letters part slightly and
 * close again, which is the Intro's own contraction played as a two-frame
 * gesture — and it is also how the intro dressing keeps the gap constant while
 * the glyphs scale.
 *
 * NOT A COPY OF `SaadGlass`, AND IT MUST NOT BECOME ONE. That component draws a
 * different word, is pointer-driven, reports its glyph box to the particle
 * field and carries a 3D tilt rig. The overlap is the SVG-mask technique, not
 * the behaviour. Sharing the technique by reading its header is correct;
 * sharing an abstraction between them would drag the hero's measurement
 * plumbing into the navbar.
 */

import { useEffect, useId, useRef } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/* -------------------------------------------------------------------------
   Geometry. Everything below is in viewBox units, so the mark is
   resolution-independent and the 22px navbar case is the same geometry as the
   full-viewport intro case, just scaled by CSS.
------------------------------------------------------------------------- */
const VB_H = 320;
/** Matches the hero wordmark's optical size in its own box. */
const FONT_SIZE = 260;
/** Optical gap between the M and the S, since they are no longer kerned. */
const GAP = 8;

/**
 * The intro box is WIDER than the letters need. That headroom is not padding —
 * it is the room the blobs travel through on their way in and out of the
 * glyphs, and the mask is what keeps the overshoot invisible. The nav box is
 * trimmed to the letters, because there is no liquid there and unused width is
 * horizontal layout space taken from the location label beside it.
 */
const VB_W = { intro: 560, nav: 420 } as const;

/** Wander rates for the three blobs, in radians per ms. Deliberately
 *  incommensurate, so the figure never repeats on a visible cycle. */
const BLOB_RATE = [0.00061, 0.00043, 0.00078] as const;
const BLOB_RADIUS = [78, 56, 40] as const;
const TURB_MIN = 0.012;
const TURB_MAX = 0.02;
const TURB_SPEED = 0.0009;

export type MonogramVariant = "intro" | "nav";

type MonogramMarkProps = {
  variant: MonogramVariant;
  /**
   * Intro only: run the ambient liquid. Ignored by the nav variant, and
   * ignored under `prefers-reduced-motion` in both.
   *
   * DEFAULTS TO FALSE so that a mark rendered without a running timeline is
   * the cheap, still one. The Intro turns it on for the beat that needs it and
   * off again before the hand-off.
   */
  liquid?: boolean;
  className?: string;
  /**
   * The accessible name. `null` marks the mark as decorative — correct
   * wherever a visible text label already says the same thing.
   */
  label?: string | null;
};

export function MonogramMark({
  variant,
  liquid = false,
  className,
  label = null,
}: MonogramMarkProps) {
  const reducedMotion = useReducedMotion();
  const width = VB_W[variant];
  const cx = width / 2;

  /**
   * `useId` per instance, so the navbar's mark and the Intro's mark can be on
   * screen at the same time without their filter ids colliding — which they
   * ARE, for the whole of the hand-off. Sanitised because React ids contain
   * ':' and a bare colon inside `url(#...)` is a parse hazard in some engines.
   * Same precaution `SaadGlass` takes, for the same reason.
   */
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const maskId = `ms-mask-${uid}`;
  const gooId = `ms-goo-${uid}`;
  const flowId = `ms-flow-${uid}`;
  const inkId = `ms-ink-${uid}`;
  const glassId = `ms-glass-${uid}`;
  const blobId = `ms-blob-${uid}`;

  const blobRefs = useRef<Array<SVGCircleElement | null>>([null, null, null]);
  const turbRef = useRef<SVGFETurbulenceElement | null>(null);

  const liquidOn = variant === "intro" && liquid && !reducedMotion;

  /* -----------------------------------------------------------------------
     The ambient tick. Started ONLY while the liquid is on — this is the whole
     cost of the component.

     THE BLOBS ARE NOT POINTER-DRIVEN, unlike the hero wordmark's. This mark
     plays inside a full-viewport plate during a scripted sequence, where there
     may well be no cursor on screen at all; a blob rig that only moves when
     followed would be motionless for most viewers at the exact moment the
     sequence is asking them to look at it. Lissajous paths at incommensurate
     rates give continuous, non-repeating motion with no input at all.
  ----------------------------------------------------------------------- */
  useEffect(() => {
    if (!liquidOn) return;

    let raf = 0;
    let start = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!start) start = now;
      const t = now - start;

      const turb = turbRef.current;
      if (turb) {
        const s = (Math.sin(t * TURB_SPEED) + 1) / 2;
        const f = TURB_MIN + (TURB_MAX - TURB_MIN) * s;
        turb.setAttribute(
          "baseFrequency",
          `${f.toFixed(5)} ${(f * 1.6).toFixed(5)}`,
        );
      }

      BLOB_RATE.forEach((rate, i) => {
        const el = blobRefs.current[i];
        if (!el) return;
        // Amplitudes are fractions of the box, so the figure scales with the
        // viewBox rather than being tuned to one size.
        const x = cx + Math.sin(t * rate) * (width * 0.26);
        const y = VB_H / 2 + Math.cos(t * rate * 1.37 + i) * (VB_H * 0.22);
        el.setAttribute("cx", x.toFixed(2));
        el.setAttribute("cy", y.toFixed(2));
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [liquidOn, cx, width]);

  /* Shared glyph attributes, so the two variants provably draw the same
     letterforms and a change to one cannot silently miss the other. */
  const glyph = {
    y: VB_H / 2,
    dominantBaseline: "central" as const,
    fontSize: FONT_SIZE,
    fontWeight: 500,
    letterSpacing: "-0.03em",
    style: { fontFamily: "var(--font-space-grotesk)" },
  };

  const letters = (fill: string, extra?: Record<string, unknown>) => (
    <>
      <text
        x={cx - GAP / 2}
        textAnchor="end"
        fill={fill}
        data-ms-letter="m"
        {...glyph}
        {...extra}
      >
        M
      </text>
      <text
        x={cx + GAP / 2}
        textAnchor="start"
        fill={fill}
        data-ms-letter="s"
        {...glyph}
        {...extra}
      >
        S
      </text>
    </>
  );

  const a11y =
    label === null
      ? ({ "aria-hidden": true } as const)
      : ({ role: "img", "aria-label": label } as const);

  if (variant === "nav") {
    return (
      <svg viewBox={`0 0 ${width} ${VB_H}`} className={className} {...a11y}>
        {/*
          `currentColor`, NEVER A TOKEN. The navbar sets one colour on its
          subtree and every child inherits it, which is the entire mechanism
          that keeps this mark legible over the hero's pinned dark plate AND
          over `bg-base` in both themes. Hard-coding `text-fg` here would look
          right in dark mode and vanish against the light-mode hero.

          The per-letter transform is driven by CSS from `Navbar.tsx` via the
          `data-ms-letter` hooks — the hover gesture belongs to the control
          that owns the hover, not to the geometry.
        */}
        {letters("currentColor")}
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${VB_H}`}
      className={className}
      overflow="visible"
      {...a11y}
    >
      <defs>
        {/* Black ground, white glyphs: white passes, black blocks. Everything
            inside the masked group is clipped to the letterforms with no
            per-effect containment logic — which is what makes "the liquid
            cannot escape the letters" structural rather than tuned. */}
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width={width} height={VB_H} fill="black" />
          {letters("white")}
        </mask>

        {/* BOTH FILTERS ARE GATED, not merely unreferenced. An inert filter in
            <defs> is nearly free, but "nearly" is not the claim being made —
            when the liquid is off, no turbulence primitive exists at all. */}
        {liquidOn && (
          <>
            <filter id={gooId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b" />
              <feColorMatrix
                in="b"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
              />
            </filter>
            <filter id={flowId}>
              <feTurbulence
                ref={turbRef}
                type="fractalNoise"
                baseFrequency="0.014 0.022"
                numOctaves={3}
                seed={7}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={18}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </>
        )}

        {/* The three gradients are the hero wordmark's, value for value, and
            that is the point: the mark and the wordmark must read as the same
            material. If one is retuned, retune both. */}
        <linearGradient id={glassId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="42%" stopColor="#bfeeff" stopOpacity="0.11" />
          <stop
            offset="100%"
            stopColor="var(--accent-hero)"
            stopOpacity="0.16"
          />
        </linearGradient>
        <linearGradient id={inkId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-hero)" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#7fe9ff" stopOpacity="0.30" />
          <stop
            offset="100%"
            stopColor="var(--accent-hero)"
            stopOpacity="0.60"
          />
        </linearGradient>
        <radialGradient id={blobId}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#bfeeff" stopOpacity="0.75" />
          <stop
            offset="100%"
            stopColor="var(--accent-hero)"
            stopOpacity="0.35"
          />
        </radialGradient>
      </defs>

      {/* The pane. Always present, under everything — this is what makes the
          mark read as glass rather than as an outline waiting to be filled. */}
      <g mask={`url(#${maskId})`}>
        <rect
          x="0"
          y="0"
          width={width}
          height={VB_H}
          fill={`url(#${glassId})`}
        />
      </g>

      {liquidOn && (
        <g mask={`url(#${maskId})`}>
          <rect
            x={-width * 0.2}
            y={-VB_H * 0.5}
            width={width * 1.4}
            height={VB_H * 2}
            fill={`url(#${inkId})`}
            filter={`url(#${flowId})`}
          />
          <g filter={`url(#${gooId})`}>
            {BLOB_RADIUS.map((r, i) => (
              <circle
                key={i}
                ref={(el) => {
                  blobRefs.current[i] = el;
                }}
                r={r}
                cx={cx}
                cy={VB_H / 2}
                fill={`url(#${blobId})`}
              />
            ))}
          </g>
        </g>
      )}

      {/* The rim, LAST. It sat under the liquid first and the blobs painted
          over the inner half of every stroke wherever they welled up — the
          letterforms lost their edge at exactly the moment the effect was most
          active. On glass the edge is where refraction concentrates, so it is
          deliberately brighter and heavier than a plain outline. */}
      {letters("none", {
        stroke: "var(--accent-hero)",
        strokeOpacity: 0.9,
        strokeWidth: 2.25,
      })}
    </svg>
  );
}

export default MonogramMark;
