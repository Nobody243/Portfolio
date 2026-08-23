"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";
import { cn } from "@/lib/utils";

/**
 * A single-line split-flap board: fixed-width tiles that flip from the string
 * they were showing to the string they are given.
 *
 * PROVENANCE, AND WHY THE FILE KEEPS ITS INSTALLED NAME. This arrived as
 * Aceternity's `text-flipping-board` registry component (`components.json` pins
 * the `@aceternity` registry) and it is kept at its installed path and under
 * its installed export name so the provenance stays greppable. It is NOT the
 * component that was installed. What survives is the MECHANISM: two half-height
 * flaps per cell, the outgoing character's top half rotating down and the
 * incoming character's bottom half rotating up, around a fixed split line.
 *
 * Same treatment, and for the same reasons, as `components/ui/text-hover-effect.tsx`
 * — read that file's header for the precedent. What follows is this file's own
 * list.
 *
 * -------------------------------------------------------------------------
 * WHAT WAS CHANGED, AND WHY EACH CHANGE WAS NOT OPTIONAL.
 * -------------------------------------------------------------------------
 *
 *   1. THE BOARD IS 1 x 15, NOT 6 x 22. `BOARD_ROWS` and `BOARD_COLS` were
 *      module constants of 6 and 22 — a 132-cell airport departure board. The
 *      brief's budget is a single 34px line under `/about`'s portrait, and the
 *      whole reason the board is free against that page's height budget is that
 *      it fits in headroom the right column already has and nothing else can
 *      use. A 6-row board does not fit in 34px at any tile size.
 *
 *      15 IS A HARD CAP DERIVED FROM THE NARROWEST COLUMN, not a preference:
 *      the board renders inside the portrait's column, which is 247px at
 *      1024x600. See `TILE_PITCH_PX`.
 *
 *   2. FIXED-WIDTH TILES, NOT A `1fr` GRID. Upstream used
 *      `gridTemplateColumns: repeat(22, 1fr)`, so the tiles stretched to fill
 *      whatever width they were given. Here the leading edge sits on the
 *      portrait's left edge (the local spine) and short strings leave void on
 *      the right, which is the correct grammar for this site — Rule S-1. A
 *      stretched board would be a full-measure band that changes tile size with
 *      the viewport, which is also a different type size at every width.
 *
 *   3. `mx-auto max-w-3xl` DELETED. That is a centred content column and Rule
 *      S-1 is "nothing on this site is ever a centred content column".
 *
 *   4. SEVEN HARDCODED PALETTE COLOURS DELETED (`bg-red-600`, `bg-orange-500`,
 *      `bg-yellow-400`, `bg-green-600`, `bg-blue-600`, `bg-violet-600`,
 *      `bg-white`), together with the random 20%-per-step accent flash that
 *      used them. CLAUDE.md allows two accents site-wide and neither is any of
 *      those. The colour-tile feature went with them — a `COLOR_MAP` of SEVEN
 *      HEX LITERALS (`#D32F2F` ... `#FAFAFA`) and the `{R}`/`{G}`/`{B}` row
 *      syntax that addressed it. `docs/03` records ZERO hex literals in `app/`
 *      and `components/` and that sweep still returns 0.
 *
 *   5. EVERY `dark:` VARIANT DELETED — there were fourteen. This site does not
 *      use Tailwind's `dark:` variant at all: the theme is `html.light` and the
 *      tokens flip underneath. `bg-neutral-200/80 dark:bg-neutral-900` becomes
 *      `bg-elevated`, `text-neutral-800 dark:text-white` becomes `text-fg`, and
 *      both are then correct in both themes by construction rather than by a
 *      pair of hand-picked greys.
 *
 *   6. EVERY `rounded-*` DELETED (`rounded-[2px]`, `md:rounded-[3px]`,
 *      `rounded-t-[3px]`, `rounded-b-[3px]`, `rounded-xl`, `md:rounded-2xl`,
 *      `rounded-tr-sm`...). There is not one `rounded-*` in this codebase and
 *      no radius token exists; a soft-cornered tile would be the exception
 *      announcing itself.
 *
 *   7. `shadow-xl` AND `dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.6)]`
 *      DELETED. `/about`'s brief and `RevealFooter`'s ban list both name
 *      box-shadow; the site has no elevation-by-shadow anywhere.
 *
 *   8. THE TILE BORDERS DELETED, AND THE 1px GAP DOES THEIR JOB. Upstream drew
 *      `border border-neutral-300 md:border-2` on all 132 cells. `docs/03`
 *      warns that `bg-elevated` on `bg-base` is ΔE 2.89 in dark and "may need a
 *      border to register" — the `gap-px` showing `bg-base` through separates
 *      the tiles at zero extra ink, where fifteen hairline borders would be the
 *      noisiest element on the quiet page.
 *
 *   9. `fontSize: "clamp(6px, 2vw, 22px)"` DELETED. A viewport-unit type size
 *      is a different size at every width and `docs/03`'s type scale has no
 *      such step. The glyphs are `text-body` (16px) in `font-mono` (JetBrains
 *      Mono) with the site's `0.08em` mono tracking, uppercase — which a
 *      split-flap board requires anyway. `font-bold` went too: the site's
 *      weight is the inherited 400 and the scale carries the size.
 *
 *  10. TWO ARBITRARY CUBIC-BEZIERS AND FOUR ARBITRARY DURATION MULTIPLIERS
 *      REPLACED BY THE SITE'S OWN. Upstream had `[0.55, 0.055, 0.675, 0.19]`
 *      for the falling flap and `[0.33, 1.55, 0.64, 1]` — an OVERSHOOTING
 *      curve — for the rising one, plus `flipDuration * 0.85`, `* 1.3` and a
 *      `* 0.5` delay. All of it is now `EASE.ui` and `DURATION.ui`. No new
 *      curve and no new duration enters the system for this component.
 *
 *  11. THE SCRAMBLE DELETED. Each cell used to run 25-40 random intermediate
 *      characters at 55ms each before landing — 1.4 to 2.2 SECONDS of slot-
 *      machine per cell, with `Math.random()` deciding the count, so no two
 *      loads were alike. The brief's motion budget is one flip per tile at
 *      `DURATION.ui` with a 0.02s per-tile stagger, i.e. the whole board is
 *      done in 0.35 + 14 x 0.02 = 0.63s. A scramble is also the thing that
 *      makes this kind of component read as a WIDGET, which is precisely what
 *      `/about` cannot afford.
 *
 *  12. THE FOUR GRADIENT SHADING OVERLAYS DELETED. Each flap carried a
 *      `bg-[linear-gradient(...rgba(255,255,255,...))]` sheen with a `dark:`
 *      twin. They are hardcoded colours, they are gradients on a site that has
 *      none outside the footer wordmark's licensed stroke ramp, and the split
 *      line plus the flap's own rotation already reads as a flap.
 *
 *      DISCLOSED RATHER THAN ASSUMED: the design brief did not rule on the
 *      sheen either way. It was dropped on the same grounds as items 4-7 — if
 *      Saad wants shading, the tokenised version is a `bg-base` overlay at an
 *      alpha, not a hardcoded white/black ramp.
 *
 *  13. THE DECORATIVE BOTTOM STRIPES DELETED. A `repeating-linear-gradient`
 *      texture strip under every cell, 8px tall (16px at `md`). It is skeuomorph
 *      texture, it is a gradient, and at a 34px tile it is a quarter of the
 *      element.
 *
 *  14. `wrapText` / `wrapParagraph` / `parseRow` DELETED. They existed to flow a
 *      paragraph across a 6 x 22 grid and to parse colour-tile tokens. One row
 *      of a fixed 15 characters needs `padEnd`.
 *
 *  15. REDUCED MOTION HONOURED — see `useReducedMotion` at the call site. This
 *      component's own contribution is that with `flip={false}` it renders the
 *      target string with no flap and no transition at all. `docs/07` §8
 *      requires a reduced-motion branch of all motion.
 *
 * -------------------------------------------------------------------------
 * THE RESTING STATE IS THE DESIGN.
 * -------------------------------------------------------------------------
 * The board is at rest for 91% of its cycle (6.37s of every 7.0s). A settled,
 * fully legible string at `text-fg` is what a visitor actually sees; the flip is
 * the transition between two resting frames, not the point of the element.
 *
 * IT HAS NO AUDIO AND NEVER DID. The brief asked for `sound: false` and for an
 * audit that the prop gates all audio including any `new Audio()` at module
 * scope. THERE IS NO SUCH PROP AND NO SUCH CODE: the registry component
 * contains zero occurrences of `Audio`, `AudioContext`, `sound` or any asset
 * preload, verified against the fetched registry JSON before installing and
 * again in this file. Recorded because "we set the prop to false" and "there is
 * no audio path" are different claims and only the second one is true.
 */

/**
 * Tile geometry, in px, and BOTH NUMBERS ARE SPACING TOKENS RATHER THAN
 * ARBITRARY VALUES.
 *
 * Height is `--spacing-lg` (34px) — the brief's tile height. Width is
 * `--spacing-sm` (13px) plus the 1px inter-tile gap, so the pitch is 14px and
 * fifteen tiles measure `15 x 14 - 1 = 209px`.
 *
 * THE CAP OF 15 IS DERIVED FROM THE NARROWEST COLUMN THE BOARD EVER RENDERS IN,
 * which is the portrait's 247px at 1024x600 — the `lg` case where the portrait
 * is still elastic. 209px fits with 38px of void after it, and the void is
 * correct rather than leftover (Rule S-1). The brief derived the same cap from
 * a 16px pitch (`floor(247 / 16) = 15`); a 14px pitch reaches the same cap with
 * more air, and using the token means no arbitrary width enters the system.
 *
 * A 16px glyph in a 13px tile fits: JetBrains Mono's advance is 0.6em (9.6px)
 * plus 0.08em tracking (1.28px) = 10.88px, leaving ~1px each side.
 */
const TILE_W_CLASS = "w-sm";
const TILE_H_CLASS = "h-lg";

/** The board is exactly this many tiles wide, always. Strings shorter than this
 *  are padded with blanks; strings longer than this are a content bug and are
 *  truncated rather than allowed to reflow the row. See `BOARD_COLS`' cap
 *  derivation above and the content module's own 15-character rule. */
export const BOARD_COLS = 15;

/** Per-tile onset. Fifteen tiles finish at `DURATION.ui + 14 * 0.02 = 0.63s`.
 *  `STAGGER.line` (0.10) would take 1.75s and turn a flip into a performance. */
const TILE_STAGGER_S = 0.02;

/**
 * One cell. Holds the character it is currently showing and, while a flip is
 * running, the one it was showing before.
 */
const FlapCell = React.memo(
  function FlapCell({
    target,
    delay,
    flip,
  }: {
    target: string;
    delay: number;
    /** `false` under reduced motion: the character swaps with no flap at all. */
    flip: boolean;
  }) {
    const [current, setCurrent] = useState(target);
    const [previous, setPrevious] = useState(target);
    const [flipId, setFlipId] = useState(0);
    const currentRef = useRef(target);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      if (target === currentRef.current) return;

      const land = () => {
        setPrevious(currentRef.current);
        currentRef.current = target;
        setCurrent(target);
        setFlipId((n) => n + 1);
      };

      if (!flip || delay === 0) {
        land();
      } else {
        timer.current = setTimeout(land, delay * 1000);
      }

      return () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
      };
    }, [target, delay, flip]);

    // A space would collapse the line box; the glyph slot has to keep its height.
    const show = current === " " ? " " : current;
    const showPrevious = previous === " " ? " " : previous;

    // `h-[200%]` with `top-0` / `bottom-0` puts a full-height glyph inside a
    // half-height clipping box, so the two halves are the same glyph cut once.
    const glyph =
      "absolute inset-x-0 flex select-none items-center justify-center font-mono text-body tracking-[0.08em] text-fg";

    return (
      <div
        className={cn(
          "relative flex flex-col overflow-hidden bg-elevated",
          TILE_W_CLASS,
          TILE_H_CLASS,
        )}
      >
        {/* Top half of the character now showing. */}
        <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden">
          <div className={cn(glyph, "top-0 h-[200%]")}>{show}</div>
        </div>

        {/* Bottom half of the character now showing. */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden">
          <div className={cn(glyph, "bottom-0 h-[200%]")}>{show}</div>
        </div>

        {flip && flipId > 0 ? (
          <>
            {/* The outgoing character's top half, falling. */}
            <motion.div
              key={`t${flipId}`}
              className="absolute inset-x-0 top-0 z-10 h-1/2 origin-bottom overflow-hidden bg-elevated backface-hidden transform-3d"
              initial={{ rotateX: 0 }}
              animate={{ rotateX: -90 }}
              transition={{ duration: DURATION.ui / 2, ease: EASE.ui }}
            >
              <div className={cn(glyph, "top-0 h-[200%]")}>{showPrevious}</div>
            </motion.div>

            {/* The incoming character's bottom half, rising. */}
            <motion.div
              key={`b${flipId}`}
              className="absolute inset-x-0 bottom-0 z-10 h-1/2 origin-top overflow-hidden bg-elevated backface-hidden transform-3d"
              initial={{ rotateX: 90 }}
              animate={{ rotateX: 0 }}
              transition={{
                duration: DURATION.ui / 2,
                delay: DURATION.ui / 2,
                ease: EASE.ui,
              }}
            >
              <div className={cn(glyph, "bottom-0 h-[200%]")}>{show}</div>
            </motion.div>
          </>
        ) : null}

        {/* The split line. `bg-base` so it reads as the gap between two flaps
            rather than as a rule drawn on the tile. */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px -translate-y-[0.5px] bg-base" />
      </div>
    );
  },
  (a, b) => a.target === b.target && a.delay === b.delay && a.flip === b.flip,
);

export interface TextFlippingBoardProps {
  /** The string to display. Uppercased, padded and truncated to `BOARD_COLS`. */
  text: string;
  /**
   * REQUIRED, WITH NO DEFAULT. `false` renders the target string with no flap
   * and no transition — the reduced-motion form of an ambient loop is its
   * absence, and the caller is the one that knows whether the loop is running.
   */
  flip: boolean;
  className?: string;
}

export function TextFlippingBoard({
  text,
  flip,
  className,
}: TextFlippingBoardProps) {
  const cells = text.toUpperCase().slice(0, BOARD_COLS).padEnd(BOARD_COLS, " ");

  return (
    // `perspective` on the row rather than per tile, so all fifteen flaps share
    // one vanishing point instead of each rotating about its own.
    <div
      className={cn("flex w-fit gap-px perspective-dramatic", className)}
      aria-hidden="true"
    >
      {Array.from(cells).map((ch, i) => (
        <FlapCell
          key={i}
          target={ch}
          delay={flip ? i * TILE_STAGGER_S : 0}
          flip={flip}
        />
      ))}
    </div>
  );
}

export default TextFlippingBoard;
