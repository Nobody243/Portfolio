"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";
import { cn } from "@/lib/utils";

/**
 * A split-flap board: a fixed grid of fixed-width tiles that flip from the text
 * they were showing to the text they are given.
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
 * =========================================================================
 * THE 1 x 15 BOARD IS RETIRED. THIS FILE ARGUED FOR IT AT LENGTH AND THE
 * ARGUMENT IS NO LONGER TRUE, SO IT IS REPLACED RATHER THAN LEFT STANDING.
 *
 * What it said, on 2026-08-23:
 *
 *   "THE BOARD IS 1 x 15, NOT 6 x 22. The brief's budget is a single 34px line
 *    under `/about`'s portrait... A 6-row board does not fit in 34px at any
 *    tile size."
 *   "15 IS A HARD CAP DERIVED FROM THE NARROWEST COLUMN, not a preference: the
 *    board renders inside the portrait's column, which is 247px at 1024x600."
 *
 * BOTH PREMISES WERE DISSOLVED BY SAAD ON 2026-08-23, in the same decision:
 *
 *   1. The board no longer renders inside the portrait's column. It is a BAND
 *      BELOW the two-column row, spanning the content column — from where the
 *      paragraph starts to where the portrait ends. That is 1017px at `xl`+,
 *      measured, not 247px.
 *   2. The 34px budget came from `/about` being one screen at `lg`+ with a
 *      556.8px text column. The page's one-screen rule now starts at `xl`
 *      (1280px) and the text column is 385px, so the measured band under the
 *      row is 246px at the binding viewport (1280x720) rather than 34px.
 *
 * The 15-character cap was the whole reason `content/flipBoard.ts` refused
 * quotations. It is gone, so that refusal is gone with it, and that file now
 * carries a sourcing rule instead of a length one. Neither change is an
 * oversight to be re-fixed in the other direction.
 * =========================================================================
 *
 * -------------------------------------------------------------------------
 * WHAT WAS CHANGED FROM THE REGISTRY COMPONENT, AND WHY EACH CHANGE WAS NOT
 * OPTIONAL. Items 4-15 are unchanged from the 1 x 15 build and still hold.
 * -------------------------------------------------------------------------
 *
 *   1. THE GRID IS MEASURED, NOT A CONSTANT. `BOARD_ROWS` and `BOARD_COLS`
 *      were module constants of 6 and 22. Neither can be a constant here: the
 *      band's width is the content column, which is 1017px at `xl`+ and 846px
 *      at `lg`, and the row count is however many lines the longest entry wraps
 *      to at that width. So the component measures its own box and derives
 *      both. See `useBoardColumns` and `BOARD_TILE`.
 *
 *      THIS IS A FIT COMPUTATION, NOT A BREAKPOINT, AND THE DIFFERENCE IS THE
 *      RULE `docs/03` STATES: "no behaviour may be specific to a breakpoint".
 *      A `hidden lg:block` on this band would be that breach. Deriving the
 *      grid from the box degrades continuously instead, and it is correct on a
 *      window nobody thought to enumerate.
 *
 *   2. FIXED-WIDTH TILES, NOT A `1fr` GRID. Upstream used
 *      `gridTemplateColumns: repeat(22, 1fr)`, so the tiles stretched to fill
 *      whatever width they were given — which is a different TYPE SIZE at every
 *      viewport, and `docs/03`'s scale has no such step. Here the tile is a
 *      spacing token and the COUNT absorbs the width instead. The leading edge
 *      sits on the paragraph's left edge (the spine) and the remainder — never
 *      more than one tile's pitch — is void on the right, which is the correct
 *      grammar for this site (Rule S-1).
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
 *      the tiles at zero extra ink, where a hairline border on every cell of a
 *      276-cell grid would be the noisiest element on the quiet page.
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
 *      loads were alike. A scramble is also the thing that makes this kind of
 *      component read as a WIDGET, which is precisely what `/about` cannot
 *      afford.
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
 *  14. `wrapText` / `wrapParagraph` / `parseRow` DELETED AND REWRITTEN. The
 *      originals flowed a paragraph across a 6 x 22 grid and parsed colour-tile
 *      tokens. `wrapWords` below is 12 lines, breaks on whitespace only, and
 *      hard-splits a single word longer than the row rather than overflowing
 *      it. No colour tokens exist to parse.
 *
 *  15. REDUCED MOTION HONOURED — see `useReducedMotion` at the call site. This
 *      component's own contribution is that with `flip={false}` it renders the
 *      target text with no flap and no transition at all. `docs/07` §8 requires
 *      a reduced-motion branch of all motion.
 *
 * -------------------------------------------------------------------------
 * THE RESTING STATE IS THE DESIGN.
 * -------------------------------------------------------------------------
 * The board is at rest for the overwhelming majority of its cycle. A settled,
 * fully legible quotation at `text-fg` is what a visitor actually sees; the
 * flip is the transition between two resting frames, not the point of the
 * element.
 *
 * THE HEIGHT IS RESERVED FOR THE LONGEST ENTRY, NOT FOR THE CURRENT ONE, AND
 * THAT IS WHY `entries` IS A PROP RATHER THAN A SINGLE `text`. A board that
 * sized itself to the string it happens to be showing would change height
 * every time it rotated — on a page whose whole brief is stillness, and whose
 * one-screen rule at `xl`+ a height change could break outright. Rows are
 * `max(minRows, longest entry at the measured width)` and short entries pad
 * with blank tiles, which is also what a real split-flap board does.
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
 * Tile geometry, in px, AND EVERY NUMBER IS A SPACING TOKEN RATHER THAN AN
 * ARBITRARY VALUE. The classes and the numbers must agree — the classes lay the
 * grid out, the numbers derive the column count, and a drift between them shows
 * up as a board that overflows its band by one tile.
 *
 * Width is `--spacing-md` (21px), height `--spacing-lg` (34px), and the gap is
 * the 1px `gap-px` that stands in for the deleted tile borders. So the pitch is
 * 22 x 35 and an N-column board measures `N * 22 - 1`.
 *
 * WIDTH WENT 13px -> 21px WITH THE BAND. At 13px the 1017px content column
 * would take 72 columns, and 72 characters per line of a five-line quotation is
 * a paragraph set in mono, not a departure board. 21px gives 46 columns, which
 * is inside the 45-75 character measure `docs/03` sets for prose and reads as
 * mechanism rather than as text.
 *
 * A 16px GLYPH IN A 21px TILE FITS WITH ROOM: JetBrains Mono's advance is 0.6em
 * (9.6px) plus 0.08em tracking (1.28px) = 10.88px, leaving ~5px each side.
 */
const BOARD_TILE = {
  wClass: "w-md",
  hClass: "h-lg",
  w: 21,
  h: 34,
  gap: 1,
} as const;

const PITCH_W = BOARD_TILE.w + BOARD_TILE.gap;
const PITCH_H = BOARD_TILE.h + BOARD_TILE.gap;

/**
 * The column count assumed on the server and on the first client render.
 *
 * IT IS NOT A GUESS AND IT MUST NOT BECOME ONE. 46 is the measured `xl`+ case:
 * the content column is 1017px (544 measure + 89 gap + 384 portrait), and
 * `floor((1017 + 1) / 22) = 46`. Rendering the same number on both sides of
 * hydration is the point — the real value lands in `useLayoutEffect`, before
 * paint, so a narrower viewport never shows the wide board.
 */
const BOARD_SSR_COLS = 46;

/**
 * Above this many rows the board does not render at all.
 *
 * THIS IS THE PHONE ANSWER, AND IT IS A FIT TEST RATHER THAN A WIDTH TEST — see
 * item 1. At 375px the band is ~333px wide, which is 15 columns, and the
 * longest entry wraps to NINETEEN lines there: a 664px wall of tiles carrying a
 * quotation nobody can read across. Nine rows is 314px, which is the last size
 * that still reads as a board rather than as a page of its own; it corresponds
 * to roughly a 640px band, so the board appears somewhere in the tablet range
 * and is absent below it, without any breakpoint being named.
 *
 * MEASURED, longest entry vs columns: 46 -> 6 rows, 38 -> 8, 29 -> 9, 24 -> 12,
 * 15 -> 19.
 */
const BOARD_MAX_ROWS = 9;

/** Per-COLUMN onset — every tile in a column flips together, the way a real
 *  board's motor drives a column. 46 columns finish at
 *  `DURATION.ui + 45 * 0.02 = 1.25s`. Per-TILE stagger across a 276-cell grid
 *  would take 5.5s and turn a flip into a performance. */
const TILE_STAGGER_S = 0.02;

/**
 * Break `text` into lines of at most `cols` characters, on whitespace.
 *
 * A word longer than the row is hard-split rather than allowed to overflow —
 * there is no such word in the current content, and a URL pasted in later
 * should truncate the row, not the band.
 */
function wrapWords(text: string, cols: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= cols) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
    while (line.length > cols) {
      lines.push(line.slice(0, cols));
      line = line.slice(cols);
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * The measured column count for a band of `width` px.
 *
 * `+ gap` because N tiles carry only N-1 gaps: `N * PITCH_W - gap <= width`.
 */
function columnsFor(width: number): number {
  return Math.max(1, Math.floor((width + BOARD_TILE.gap) / PITCH_W));
}

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
    const show = current === " " ? " " : current;
    const showPrevious = previous === " " ? " " : previous;

    // `h-[200%]` with `top-0` / `bottom-0` puts a full-height glyph inside a
    // half-height clipping box, so the two halves are the same glyph cut once.
    const glyph =
      "absolute inset-x-0 flex select-none items-center justify-center font-mono text-body tracking-[0.08em] text-fg";

    return (
      <div
        className={cn(
          "relative flex flex-col overflow-hidden bg-elevated",
          BOARD_TILE.wClass,
          BOARD_TILE.hClass,
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

/** One thing the board can display: a line of text and the source it came from.
 *  Both are rendered on tiles — the attribution is simply the last line or two
 *  of the same grid, not a caption sitting outside it. */
export interface FlipBoardEntry {
  text: string;
  attribution: string;
}

export interface TextFlippingBoardProps {
  /** Every entry the board will ever show. The height is reserved for the
   *  longest of them, so passing only the current one would make the band
   *  resize on every rotation — see the header. */
  entries: readonly FlipBoardEntry[];
  /** Which entry is showing. Changing it is what triggers a flip; nothing
   *  unmounts. */
  index: number;
  /**
   * REQUIRED, WITH NO DEFAULT. `false` renders the target text with no flap
   * and no transition — the reduced-motion form of an ambient loop is its
   * absence, and the caller is the one that knows whether the loop is running.
   */
  flip: boolean;
  /** Floor on the reserved row count, so a band does not shrink below the
   *  composition it was designed into even if every entry is short. */
  minRows?: number;
  className?: string;
}

export function TextFlippingBoard({
  entries,
  index,
  flip,
  minRows = 1,
  className,
}: TextFlippingBoardProps) {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const [cols, setCols] = useState(BOARD_SSR_COLS);

  const measure = useCallback(() => {
    const el = bandRef.current;
    if (!el) return;
    const next = columnsFor(el.clientWidth);
    setCols((prev) => (prev === next ? prev : next));
  }, []);

  // `useLayoutEffect`, not `useEffect`: the real column count has to land
  // before paint or a phone shows one frame of the 46-column server render.
  useLayoutEffect(() => {
    measure();
    const el = bandRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const grids = useMemo(
    () =>
      entries.map((entry) => [
        ...wrapWords(entry.text.toUpperCase(), cols),
        ...wrapWords(entry.attribution.toUpperCase(), cols),
      ]),
    [entries, cols],
  );

  const rows = Math.max(minRows, ...grids.map((g) => g.length));
  const fits = rows <= BOARD_MAX_ROWS;

  const lines = useMemo(() => {
    const grid = grids[index] ?? [];
    return Array.from({ length: rows }, (_, r) =>
      (grid[r] ?? "").padEnd(cols, " "),
    );
  }, [grids, index, rows, cols]);

  return (
    // The measured box is `w-full` and separate from the tiles: it is the band,
    // and the tile grid inside it is `w-fit` so the remainder stays as void on
    // the right rather than stretching the tiles. `overflow-hidden` matters
    // before hydration, when the server's 46 columns are still on screen.
    <div
      ref={bandRef}
      className={cn("w-full overflow-hidden", className)}
      aria-hidden="true"
    >
      {fits ? (
        // `perspective` on the grid rather than per tile, so every flap shares
        // one vanishing point instead of each rotating about its own.
        <div className="flex w-fit flex-col gap-px perspective-dramatic">
          {lines.map((line, r) => (
            <div key={r} className="flex gap-px">
              {Array.from(line).map((ch, c) => (
                <FlapCell
                  key={c}
                  target={ch}
                  delay={flip ? c * TILE_STAGGER_S : 0}
                  flip={flip}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The height a board of `rows` rows occupies, in px. Exported so a call site
 *  can state its own budget arithmetic against the real geometry instead of
 *  restating 35 by hand. */
export function boardHeightPx(rows: number): number {
  return rows * PITCH_H - BOARD_TILE.gap;
}

export default TextFlippingBoard;
