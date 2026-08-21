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
 * every appearance of the mark — mid-sequence, settled in the navbar,
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
 *   2. `--ms-stroke` / `--ms-node` and the weight ramp that rode the Intro's
 *      scale changes — gone. A non-scaling stroke thickens into a blob as its
 *      geometry shrinks; a fill does not, so a plain group scale is correct.
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
 * slightly and close again. `Navbar.tsx` reaches them through these hooks.
 *
 * FOUR TRANSFORM LAYERS, ONE AUTHOR EACH. This is the invariant that keeps two
 * animation systems off the same property, and it is why the DOM below is
 * shaped the way it is rather than flattened:
 *
 *   | Layer                    | Author            | What it does          |
 *   |--------------------------|-------------------|-----------------------|
 *   | the host/stage `<div>`s  | `Intro.tsx`       | the camera zoom       |
 *   | `<g data-ms-glyph>` ×12  | `Intro.tsx`       | the name's own layout |
 *   | `<g data-ms-wrapper>`    | `Intro.tsx`       | text scale → mark     |
 *   | `<g data-ms-letter>` ×2  | `Navbar.tsx`      | the hover gesture     |
 *
 * THE NAME IS OUTSIDE THE WRAPPER, and that is load-bearing rather than
 * cosmetic. The wrapper's job is to render the settled mark at the cap height
 * of the name it is replacing; if the name were inside it, the name would be
 * scaled twice and the crossfade would have nothing to fade between. It used to
 * be inside, because the wrapper's job used to be a contraction that legitimately
 * moved everything — see `docs/07` §3 for why that mechanic was reverted.
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
      {/*
        THE NAME — the Intro's source half, and only in the Intro.

        Space Grotesk's own contours, pre-extracted at build time, placed by
        `msMarkGeometry.ts` into the MARK's coordinate system and posed into the
        name layout by `Intro.tsx`. Filled, like everything else.

        A SIBLING OF THE MARK, NOT A CHILD OF IT. See the transform table in the
        header: the wrapper below carries the text-scale-to-mark-scale change,
        and the name must not inherit it.

        IT RENDERS INVISIBLE IN THE MARKUP, NOT IN AN EFFECT. Effects run after
        paint, so a group left at opacity 1 gets one composited frame at its
        SETTLED size and position before the timeline poses it — measured at
        147ms on a cold load, which is nine frames and unmissable.

        Document order is `INTRO_GLYPHS` order, and `Intro.tsx` indexes against
        it position for position.
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
      {/* THE MARK PROPER — the two letters as ONE object, so the Intro can
          scale and fade the pair without touching either letter's own
          transform. Inert everywhere else; the navbar renders it untouched. */}
      <g data-ms-wrapper="" style={isIntro ? { opacity: 0 } : undefined}>
        {(["m", "s"] as const).map((key) => (
          <g key={key} data-ms-letter={key}>
            <path d={LETTER_PATH[key]} fill="currentColor" fillRule="nonzero" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export default MonogramMark;
