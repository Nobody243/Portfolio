/**
 * The "MS" monogram — ONE geometry, one path dataset, two dressings.
 *
 * The geometry and the reasoning behind it live in
 * `components/ui/msMarkGeometry.ts`. This file is the renderer: it decides
 * nothing about the shape and everything about how a given instance is dressed.
 *
 *   - `variant="nav"` — the SETTLED mark and nothing else. Two filled letters
 *     in `currentColor`. The navbar renders it at 17px and the About page will
 *     render the same thing at 72px; those are not two variants, they are one
 *     variant and a `size`.
 *   - `variant="intro"` — the same two letters, invisible at first, PLUS the
 *     full name "Muhammad Saad" as filled glyph outlines in the same coordinate
 *     system. `Intro.tsx` owns the timeline; this owns the DOM it runs on.
 *
 * THE VARIANT PROP IS NOT DEAD SURFACE, and it was checked rather than assumed:
 * `intro` renders twelve glyph groups that `nav` must not (twelve extra paths
 * on a `position: fixed` bar, composited every scroll frame, for markup that is
 * permanently invisible there). If the name ever stops being rendered here, the
 * prop goes with it.
 *
 * WHY THE INTRO STATE LIVES HERE AND NOT IN `Intro.tsx`. `docs/07` §2 asks for
 * every appearance of the mark — mid-merge, contracting, settled in the navbar,
 * static on About — to be literally one artifact, and calls a second SVG a
 * build smell to raise rather than route around. The name is the merge's source
 * half and the mark is its target half, so the component that renders the
 * target renders the source too. What `Intro.tsx` owns is time.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NOTHING HERE IS STROKED. That is the faceted rebuild's whole point and it is
 * worth stating in the negative, because three separate mechanisms existed to
 * make a stroked mark survive 17px and all three are gone:
 *
 *   1. `vector-effect="non-scaling-stroke"` — gone. Filled shapes scale their
 *      own ink; there is nothing to hold constant.
 *   2. `--ms-stroke` / `--ms-node` and the contraction's weight ramp — gone.
 *      A non-scaling stroke thickens into a blob as its geometry collapses; a
 *      fill does not, so the contraction is now a plain group scale.
 *   3. Node dots as round-capped micro-segments — gone with the traces.
 *
 *   THE ORIGINAL OBJECTION STILL BINDS, and is kept rather than deleted: a rim
 *   authored in USER UNITS is 0.15 CSS pixels at nav size and turns to mush.
 *   Anyone adding a rim, a hairline or a dot radius in viewBox units will hit
 *   exactly that wall. The mark's answer is not to have one.
 *
 * WHY THE NAV DRESSING IS NOT SIMPLY A SMALLER COPY, since the spec asks for
 * "the same mark":
 *
 *   1. COLOUR. The navbar crosses `bg-base`, and `bg-base` FLIPS — #0A0A0B
 *      dark, #FDFCFA light. `currentColor` is what lets the mark inherit the
 *      bar's adaptive colour (see `Navbar.tsx`) instead of fighting it.
 *      Hard-coding a token here would look right in dark mode and vanish
 *      against the light-mode hero.
 *   2. COST. `feTurbulence` is one of the most expensive primitives in SVG and
 *      the navbar is `position: fixed`, composited on every scroll frame for
 *      the whole session. NOTHING IN THIS FILE USES A FILTER, a gradient or a
 *      rAF — the glass pane, the accent rim, the displacement map and the
 *      liquid blobs were retired outright with `docs/07` §2's "monochrome
 *      throughout, no gradient or fill animation concurrent with shape
 *      animation". The constraint is recorded so the cost is not reintroduced
 *      by someone who reads "Tier 1" as permission.
 *
 * WHAT SURVIVES ACROSS BOTH, and is the actual "same mark" claim: ONE viewBox
 * (592 × 320, every variant, every state), one path dataset, and the same two
 * -element letter split.
 *
 * TWO `<g data-ms-letter>` ELEMENTS, NEVER THE STRING "MS". Splitting the pair
 * is what makes the navbar's hover micro-motion possible — the two letters part
 * slightly and close again, which is the Intro's own contraction played as a
 * two-frame gesture. `Navbar.tsx` reaches them through these hooks. NOTHING
 * ELSE MAY WRITE A TRANSFORM TO THEM: the Intro's contraction targets the
 * wrapper `<g>` above them and its approach targets the NAME's glyph groups, so
 * the three transform layers never collide.
 * ─────────────────────────────────────────────────────────────────────────
 */

import type { CSSProperties } from "react";

import {
  INTRO_GLYPHS,
  LETTER_PATH,
  VB_H,
  VB_W,
} from "@/components/ui/msMarkGeometry";

export type MonogramVariant = "intro" | "nav";

type MonogramMarkProps = {
  variant: MonogramVariant;
  /**
   * Rendered SVG height in CSS pixels. Sets the element's own height and
   * nothing else — with the mark filled, every other dimension follows from the
   * viewBox for free.
   *
   * The Intro omits it: its box is sized responsively in CSS.
   */
  size?: number;
  className?: string;
  /**
   * The accessible name. `null` marks the mark as decorative — correct wherever
   * a visible text label already says the same thing.
   */
  label?: string | null;
};

export function MonogramMark({
  variant,
  size,
  className,
  label = null,
}: MonogramMarkProps) {
  const a11y =
    label === null
      ? ({ "aria-hidden": true } as const)
      : ({ role: "img", "aria-label": label } as const);

  const isIntro = variant === "intro";

  const style =
    size === undefined
      ? undefined
      : ({ height: `${size}px`, width: "auto" } as CSSProperties);

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className={className} style={style} {...a11y}>
      {/* THE WRAPPER EXISTS FOR THE INTRO'S CONTRACTION and is inert everywhere
          else. One transform layer per concern: the contraction scales this,
          the approach translates the name's glyph groups, and the navbar's
          hover translates the two letter groups. None of the three collide. */}
      <g data-ms-wrapper="">
        {/*
          THE NAME — the merge's source half, and only in the Intro.

          Space Grotesk's own contours, pre-extracted at build time, placed by
          `msMarkGeometry.ts` into the MARK's coordinate system and posed back
          into the name layout by `Intro.tsx`. Filled, like everything else: the
          old "nothing is ever filled" rule was a morph constraint and the morph
          is gone.

          IT RENDERS INVISIBLE IN THE MARKUP, NOT IN AN EFFECT. Effects run
          after paint, so a group left at opacity 1 gets one composited frame at
          its SETTLED size and position before the timeline poses it — measured
          at 147ms on a cold load, which is nine frames and unmissable.

          Document order is `INTRO_GLYPHS` order, and `Intro.tsx` indexes
          against it position for position.
        */}
        {isIntro
          ? INTRO_GLYPHS.map((g, i) => (
              <g
                key={`${g.char}-${i}`}
                data-ms-glyph=""
                data-ms-initial={g.letter ?? undefined}
                style={{ opacity: 0 }}
              >
                <path d={g.d} fill="currentColor" fillRule="nonzero" />
              </g>
            ))
          : null}
        {(["m", "s"] as const).map((key) => (
          <g key={key} data-ms-letter={key} style={isIntro ? { opacity: 0 } : undefined}>
            <path d={LETTER_PATH[key]} fill="currentColor" fillRule="nonzero" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export default MonogramMark;
