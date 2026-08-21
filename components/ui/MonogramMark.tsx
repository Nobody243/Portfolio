/**
 * The "MS" monogram — ONE geometry, one path dataset, two dressings.
 *
 * The geometry, the weight rule and the reasoning behind both live in
 * `components/ui/msMarkGeometry.ts`. This file is the renderer: it decides
 * nothing about the shape and everything about how a given instance is dressed.
 *
 *   - `variant="nav"` — the SETTLED mark. `currentColor`, no filters, no rAF,
 *     no animation. The navbar renders it at 17px and the About page will
 *     render the same thing at 72px with `accentNodes`; those are not two
 *     variants, they are one variant and a `size`.
 *   - `variant="intro"` — the same dataset in its UNSETTLED state: the full
 *     name as stroked outlines, with the two capitals ready to morph into the
 *     two traces. `Intro.tsx` owns the timeline; this owns the DOM it runs on.
 *
 * WHY THE INTRO STATE LIVES HERE AND NOT IN `Intro.tsx`. `docs/07` §2 asks for
 * every appearance of the mark — mid-morph, contracting, settled in the navbar,
 * static on About — to be literally one artifact, and calls a second SVG a
 * build smell to raise rather than route around. The morph's source is the
 * mark's own dataset (`docs/07` §3.1: "one dataset then holds both the source
 * and the target"), so the component that renders the target renders the source
 * too. What `Intro.tsx` owns is time.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THE NAV DRESSING IS NOT JUST A SMALLER COPY OF THE INTRO ONE, since the
 * spec asks for "the same mark" — the reasons have changed, and the change is
 * worth recording:
 *
 *   1. COLOUR. Still true, still the main one. The navbar crosses `bg-base`,
 *      and `bg-base` FLIPS — #0A0A0B dark, #FDFCFA light. `currentColor` is
 *      what lets the mark inherit the bar's adaptive colour (see `Navbar.tsx`)
 *      instead of fighting it. Hard-coding a token here would look right in
 *      dark mode and vanish against the light-mode hero.
 *   2. SIZE — NARROWED, NOT DROPPED. This header used to say a 2.25-unit rim
 *      is 0.15 CSS pixels at nav size, and that "outlined letterforms do not
 *      survive that reduction; they turn to mush." THAT IS TRUE FOR STROKES
 *      AUTHORED IN VIEWBOX UNITS, which is what the rim was. It is NOT true
 *      here: `vector-effect="non-scaling-stroke"` resolves stroke width before
 *      the viewBox transform, so it is specified in CSS pixels and the 0.053
 *      nav scale factor never touches it. The constraint is kept rather than
 *      deleted because it still binds — anyone adding a rim, a hairline or a
 *      dot radius in USER UNITS will hit exactly the wall it describes.
 *   3. COST. `feTurbulence` is one of the most expensive primitives in SVG and
 *      the navbar is `position: fixed`, composited on every scroll frame for
 *      the whole session. NOTHING IN THIS FILE USES A FILTER ANY MORE — the
 *      glass pane, the accent rim, the displacement map and the liquid blobs
 *      were retired outright with `docs/07` §2's "monochrome throughout the
 *      morph, no gradient or fill animation concurrent with shape animation".
 *      The constraint is recorded so the cost is not reintroduced by someone
 *      who reads "Tier 1" as permission.
 *
 * WHAT SURVIVES ACROSS BOTH, and is the actual "same mark" claim: ONE viewBox
 * (592 × 320, every variant, every state), one path dataset, one weight rule,
 * and the same two-element letter split. The header made that claim before and
 * the code contradicted it — `VB_W` was 560 for the intro and 420 for the nav.
 * It is true now.
 *
 * TWO `<g data-ms-letter>` ELEMENTS, NEVER THE STRING "MS". Splitting the pair
 * is what makes the navbar's hover micro-motion possible — the two letters part
 * slightly and close again, which is the Intro's own contraction played as a
 * two-frame gesture. `Navbar.tsx` reaches them through these hooks, and the
 * Intro drives each letter's approach through the same two. NOTHING ELSE MAY
 * WRITE A TRANSFORM TO THEM: the Intro's contraction targets the wrapper `<g>`
 * above them, precisely so the two transform layers never collide.
 * ─────────────────────────────────────────────────────────────────────────
 */

import type { CSSProperties } from "react";

import {
  INTRO_INITIALS,
  INTRO_REST,
  NAV_HEIGHT_PX,
  NODES,
  NODE_RATIO,
  TRACE,
  VB_H,
  VB_W,
  capFromHeight,
  msStroke,
} from "@/components/ui/msMarkGeometry";

export type MonogramVariant = "intro" | "nav";

type MonogramMarkProps = {
  variant: MonogramVariant;
  /**
   * Rendered SVG height in CSS pixels. Drives `--ms-stroke` through the weight
   * rule in `msMarkGeometry.ts`, and sets the element's own height so the two
   * cannot disagree.
   *
   * The Intro omits it: its box is sized responsively in CSS and its weights
   * are measured and then TWEENED, so a static value here would be overwritten
   * on the first frame. The fallback below is only ever the pre-timeline state.
   */
  size?: number;
  /**
   * Paints the node dots `--color-accent-working` instead of `currentColor`.
   * The About instance, and nothing else so far.
   *
   * Colouring ONLY the nodes is the smallest colour surface that still
   * registers, and at 6.5px the discs are large enough to hold their hue. The
   * mark should read as POWERED, not as a link — colouring the whole thing in
   * the working accent would make it look clickable, which it is not.
   *
   * Deliberately unavailable to the navbar: chroma does not survive a 2.75px
   * antialiased disc (it reads as a grey-green smudge in light mode and a dirty
   * highlight in dark), and `--nav-fg` is already the bar's one colour
   * authority — a second, non-escalating source inside the mark would drift out
   * of step with it on exactly the backgrounds the escalation exists for.
   */
  accentNodes?: boolean;
  className?: string;
  /**
   * The accessible name. `null` marks the mark as decorative — correct wherever
   * a visible text label already says the same thing.
   */
  label?: string | null;
};

/** Shared by every drawn path in the mark. `fill="none"` and round everywhere:
 *  the 180° turnaround in the doubled-back traces would spike under a mitre. */
const STROKE_ATTRS = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
};

export function MonogramMark({
  variant,
  size,
  accentNodes = false,
  className,
  label = null,
}: MonogramMarkProps) {
  const heightPx = size ?? NAV_HEIGHT_PX;
  const strokePx = msStroke(capFromHeight(heightPx));

  const a11y =
    label === null
      ? ({ "aria-hidden": true } as const)
      : ({ role: "img", "aria-label": label } as const);

  const isIntro = variant === "intro";

  /* `--ms-stroke` and `--ms-node` are COMPONENT-SCOPED custom properties, not
     design tokens: they carry no meaning outside this component and are set per
     instance on the SVG root, so `globals.css` is not involved and the "no new
     tokens" constraint is not engaged. One property inherited by every child is
     also what makes the Intro's weight ramp a single tween. */
  const style = {
    "--ms-stroke": `${strokePx}px`,
    "--ms-node": `${strokePx * NODE_RATIO}px`,
    ...(size === undefined ? null : { height: `${size}px`, width: "auto" }),
  } as CSSProperties;

  const traceStyle: CSSProperties = { strokeWidth: "var(--ms-stroke)" };
  const nodeStyle: CSSProperties = { strokeWidth: "var(--ms-node)" };

  const letter = (key: "m" | "s") => (
    /*
      THE INTRO'S LETTERS RENDER INVISIBLE, IN THE MARKUP, NOT IN AN EFFECT.

      Effects run after paint, so a group left at opacity 1 gets one composited
      frame at its SETTLED size and position before the Intro's timeline poses
      it into the name — two 311px capitals flashing on screen, measured at
      147ms on a cold load, which is nine frames and unmissable. The ten
      non-initials and the node dots below have the same requirement for the
      same reason. `opacity` and never `stroke-opacity`: the traces are
      doubled-back paths, so a stroke-level fade compounds with itself.
    */
    <g key={key} data-ms-letter={key} style={isIntro ? { opacity: 0 } : undefined}>
      {/*
        ONE PATH PER LETTER, carrying either the trace or — in the Intro's
        opening state — the capital's glyph outline, which is what the trace is
        morphed FROM. Same element, same paint mode, first frame to last.
      */}
      <path
        data-ms-trace={key}
        d={isIntro ? INTRO_INITIALS[key].d : TRACE[key]}
        style={traceStyle}
        {...STROKE_ATTRS}
      />
      {/*
        THE NODES ARE NEVER A MORPH TARGET. Twelve detached micro-subpaths
        reconciled against one closed glyph contour is a topology MorphSVG will
        resolve somehow, and that somehow is dots smeared out of the letter's
        outline. They fade in instead — which is also correct conceptually: the
        nodes are what the letters GAIN when they stop being type and become a
        mark, so they should not exist in the name.
      */}
      <g data-ms-nodes={key} style={isIntro ? { opacity: 0 } : undefined}>
        {NODES[key].map((d, i) => (
          <path
            key={i}
            data-ms-node=""
            d={d}
            style={nodeStyle}
            {...STROKE_ATTRS}
            stroke={accentNodes ? "var(--color-accent-working)" : "currentColor"}
          />
        ))}
      </g>
    </g>
  );

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className={className} style={style} {...a11y}>
      {/* THE WRAPPER EXISTS FOR THE INTRO'S CONTRACTION and is inert everywhere
          else. One transform layer per concern: the contraction scales this,
          the approach scales the letter groups, and the navbar's hover
          translates the same letter groups. None of the three can collide. */}
      <g data-ms-wrapper="">
        {isIntro
          ? INTRO_REST.map((g, i) => (
              /* The ten glyphs that are not initials. They translate into
                 their own word's capital and fade over the first 45% of the
                 approach; they never morph, and they hold the name's stroke
                 weight rather than the ramping one, because a glyph that grew
                 heavier while shrinking out of view would blot. */
              <g key={`${g.char}-${i}`} data-ms-glyph={g.char} style={{ opacity: 0 }}>
                <path
                  d={g.d}
                  style={{ strokeWidth: "var(--ms-glyph-stroke, var(--ms-stroke))" }}
                  {...STROKE_ATTRS}
                />
              </g>
            ))
          : null}
        {letter("m")}
        {letter("s")}
      </g>
    </svg>
  );
}

export default MonogramMark;
