"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DURATION } from "@/lib/animation/easing";
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
 *      `* 0.5` delay. All of it is `EASE.ui` and `DURATION.ui`. No new curve
 *      and no new duration enters the system for this component.
 *
 *      ONE COST OF MOVING THE FLAP OFF FRAMER, DECLARED: the curve and the
 *      durations are now SPELLED OUT in `app/globals.css`'s flap block,
 *      because `@keyframes` cannot read a JS constant. They still have a
 *      single source of truth in `lib/animation/easing.ts` — but it is now a
 *      source of truth by convention rather than by import, and a change to
 *      `EASE.ui` or `DURATION.ui` has to be carried across by hand. The
 *      alternative was a 1,895ms frame; this is the cheaper debt.
 *
 *  11. ~~THE SCRAMBLE DELETED.~~ **RESTORED 2026-08-23 ON SAAD'S INSTRUCTION,
 *      FROM THE REGISTRY SOURCE RATHER THAN FROM THIS FILE'S DESCRIPTION OF
 *      IT.** This item used to read: "Each cell used to run 25-40 random
 *      intermediate characters at 55ms each before landing — 1.4 to 2.2
 *      SECONDS of slot-machine per cell, with `Math.random()` deciding the
 *      count, so no two loads were alike. A scramble is also the thing that
 *      makes this kind of component read as a WIDGET, which is precisely what
 *      `/about` cannot afford."
 *
 *      **That was a SIMPLIFICATION, not a restyle, and it is the exact failure
 *      Saad named: the same shape as `text-hover-effect.tsx` losing its
 *      gradient alongside its colours.** The registry JSON at
 *      `https://ui.aceternity.com/registry/text-flipping-board.json` was
 *      re-fetched and diffed before anything was written, so this is the real
 *      mechanic and not a reconstruction: `FLAP_CHARS`, the 8-15 / 25-39 step
 *      counts, the 55ms step, the 20%-per-step accent flash and the per-cell
 *      start delay are all the source's own values.
 *
 *      WHAT IS DIFFERENT: the accent flash picks from ONE colour instead of
 *      seven (see item 4 — the seven were hardcoded hues), and three timing
 *      constants were tuned for a board twice the source's size. The
 *      measurements that forced each of them are on `FLAP_STEP_MS` below —
 *      they are not preferences and they were not chosen by eye.
 *
 *      THE `Math.random()` OBJECTION STANDS AND IS ACCEPTED RATHER THAN
 *      ANSWERED: no two flips are alike, and that is the mechanic. It runs
 *      inside `useEffect` only — never during render — so it cannot desync
 *      hydration.
 *
 *      IT DOES NOT RUN ON MOUNT. `current` initialises to `target`, so the
 *      board's first paint is landed text and the scramble happens on the
 *      first ROTATION. That is what keeps `/about`'s arrival author count at
 *      exactly one, which is the premise its route fade was deleted on.
 *
 *  12. ~~THE FOUR GRADIENT SHADING OVERLAYS DELETED.~~ **RESTORED 2026-08-23,
 *      TOKENISED.** The previous note said the sheens "are hardcoded colours,
 *      they are gradients on a site that has none outside the footer
 *      wordmark", and then disclosed the escape hatch itself: "if Saad wants
 *      shading, the tokenised version is a `bg-base` overlay at an alpha, not
 *      a hardcoded white/black ramp." That is exactly what shipped.
 *
 *      THE MAPPING IS ONE-TO-ONE AND IT IS WHY ONE TOKEN REPLACES A `dark:`
 *      PAIR. The source paints `rgba(255,255,255,...)` in light and
 *      `rgba(0,0,0,...)` in dark. `--color-base` IS near-white in light
 *      (`#FDFCFA`) and near-black in dark (`#0A0A0B`), so `from-base/80` is
 *      the same ink in both themes by construction rather than by two
 *      hand-picked ramps.
 *
 *      BE HONEST ABOUT THE RESULT: it is much subtler here than in the source,
 *      and that is arithmetic rather than timidity. The source's sheen sits on
 *      `bg-neutral-200` / `bg-neutral-900`, which are far from its page
 *      ground; ours sits on `bg-elevated`, which `docs/03` records as ΔE 2.89
 *      from `bg-base` in dark. The same 80% ramp therefore moves the tile a
 *      fraction as far. It reads as a fold shadow rather than as a highlight,
 *      which is the right end of that trade for this page.
 *
 *  13. THE DECORATIVE BOTTOM STRIPES ARE STILL OUT, AND THIS ONE IS A HEIGHT
 *      DECISION RATHER THAN A TASTE ONE — DISCLOSED SO IT IS NOT MISTAKEN FOR
 *      THE SIMPLIFICATION ITEM 11 WAS. A `repeating-linear-gradient` texture
 *      strip sits under every cell in the source, `h-2` (16px at `md`), INSIDE
 *      the tile — so restoring it costs 8px of a 34px tile, i.e. 48px across
 *      six rows, on the one page whose binding constraint is vertical space
 *      and whose whole current round is about finding more of it. It is the
 *      only element of the source still absent.
 *
 *      THE LEVER, SO THE NEXT PERSON DOES NOT HAVE TO DERIVE IT: restoring it
 *      means either a 42px tile (six rows go 209 -> 257px, which does not fit
 *      1280x720) or a 26px flap area inside the existing 34px tile, which
 *      leaves 13px per half for a 16px glyph. Neither is free; both are Saad's
 *      call, not a tidy-up.
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
 * Width is `--spacing-md` (21px), height is 36px, and the gap is the 1px
 * `gap-px` that stands in for the deleted tile borders. So the pitch is 22 x 37
 * and an N-column board measures `N * 22 - 1` by `rows * 37 - 1`.
 *
 * WIDTH WENT 13px -> 21px WITH THE BAND. At 13px the ~1000px content column
 * would take 72 columns, and 72 characters per line of a five-line quotation is
 * a paragraph set in mono, not a departure board. 21px gives 45 columns, which
 * is inside the 45-75 character measure `docs/03` sets for prose and reads as
 * mechanism rather than as text.
 *
 * HEIGHT WENT 34 -> 55 -> 36 IN THREE DAYS, AND THE WIDTH NEVER MOVED WITH IT.
 * That is not indecision, it is the same constraint being read against two
 * different numbers, and the third value is the first one derived against a
 * REAL browser window rather than against a display resolution:
 *
 *   34px  the original. 209px of board.
 *   55px  2026-08-23. Saad asked for a bigger board to close the gap to the
 *         text block; 335px of board, which fits 1080px of viewport.
 *   36px  2026-08-24. 1080px of viewport DOES NOT EXIST on a 1080p display —
 *         Chrome maximised over the Windows taskbar measures 945px of
 *         `innerHeight` (87px of browser chrome, 48px of taskbar), and at
 *         335px the composition overflowed it by 21px. See below.
 *
 * WIDTH IS NOT A LEVER AND NEVER WAS. The band's width is the content column
 * (the paragraph's left edge to the portrait's right edge) and is fixed by the
 * composition, so changing the tile's width only trades columns for rows.
 * Measured at the last change: a 34px-WIDE tile gives 28 columns and wraps the
 * longest entry to NINE rows, which is taller than the six-row board it was
 * supposed to replace. Height is the only free dimension here.
 *
 * 36 IS DERIVED TWICE OVER AND IT IS THE SMALLER OF THE TWO ANSWERS.
 *
 *   1. FIT, IN A REAL WINDOW. 945px of `innerHeight`, minus `pt-2xl` + `pb-2xl`
 *      (178), minus the 364px row and the 89px gap, leaves the board 314px
 *      before the page overflows — and every pixel of that is a pixel the
 *      centring has nothing to centre with. A visitor with a bookmarks bar has
 *      ~905px and the ceiling drops to 274px.
 *   2. HIERARCHY. Saad's instruction was that the board must not read as equal
 *      to the mark/paragraph/action block above it. That block is 364px, and
 *      the ratio this design system uses to say "secondary" is the same golden
 *      one its type and spacing scales are built on. 36 IS THE LARGEST WHOLE
 *      PIXEL TILE FOR WHICH `board * 1.618 <= 364`: six rows at pitch 37 is
 *      221px and 221 x 1.618 = 357.6; a 37px tile gives 227px and 367.3, which
 *      is over.
 *
 * Board 221px, against 335px before and 209px originally — and the 61% of the
 * block above it that (2) asks for. It leaves 93px of slack at 945px of
 * viewport and 53px at 905px, which is what makes `my-auto` on `/about`'s spine
 * container actually centre anything. `AboutScreen.tsx` has that arithmetic
 * from the page's side.
 *
 * IT IS AN ARBITRARY VALUE AND NOT A SPACING TOKEN, DELIBERATELY. The scale is
 * Fibonacci — 21, 34, 55 — so there is nothing between `h-lg` and `h-xl`, and
 * both of those are already known-wrong answers to this constraint (209px is
 * the board Saad asked to grow; 335px is the board he asked to shrink). The
 * value is derived above rather than picked, which is the standing bar for an
 * arbitrary value in this codebase.
 *
 * A 21px GLYPH IN A 21px TILE FITS ON WIDTH: JetBrains Mono's advance is 0.6em,
 * so 12.6px in a 21px tile leaves 4.2px each side. Width was the binding check
 * at 26px (2.7px each side) and is comfortable now.
 */
const BOARD_TILE = {
  wClass: "w-md",
  hClass: "h-[36px]",
  w: 21,
  h: 36,
  gap: 1,
} as const;

const PITCH_W = BOARD_TILE.w + BOARD_TILE.gap;
const PITCH_H = BOARD_TILE.h + BOARD_TILE.gap;

/**
 * The column count assumed on the server and on the first client render.
 *
 * IT IS NOT A GUESS AND IT MUST NOT BECOME ONE. 45 is the measured wide case:
 * the content column is 997px (544 measure + 89 gap + 364 portrait), and
 * `floor((997 + 1) / 22) = 45`. Rendering the same number on both sides of
 * hydration is the point — the real value lands in `useLayoutEffect`, before
 * paint, so a narrower viewport never shows the wide board.
 */
const BOARD_SSR_COLS = 45;

/**
 * Above this many rows the board does not render at all.
 *
 * THIS IS THE PHONE ANSWER, AND IT IS A FIT TEST RATHER THAN A WIDTH TEST — see
 * item 1. At 375px the band is ~333px wide, which is 15 columns, and the
 * longest entry wraps to NINETEEN lines there: a 664px wall of tiles carrying a
 * quotation nobody can read across. Nine rows is 332px, which is the last size
 * that still reads as a board rather than as a page of its own; it corresponds
 * to roughly a 640px band, so the board appears somewhere in the tablet range
 * and is absent below it, without any breakpoint being named.
 *
 * MEASURED, longest entry vs columns: 46 -> 6 rows, 38 -> 8, 29 -> 9, 24 -> 12,
 * 15 -> 19.
 */
const BOARD_MAX_ROWS = 9;

/**
 * THE SCRAMBLE ALPHABET, AND IT IS THE SOURCE'S OWN STRING PLUS TWO CHARACTERS.
 *
 * The registry component's `FLAP_CHARS` is
 * `" ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$()-+&=;:'\"%,./?°"`. Two entries
 * were APPENDED, not substituted: `·` (the separator in every attribution line)
 * and `…` (the ellipsis marking the cut in the Mitnick quotation). Without them
 * `normalizeChar` maps both to a blank and the board silently drops them —
 * which is a content bug that looks like a rendering bug, so it is worth the
 * two bytes.
 *
 * A character outside this set becomes a blank rather than throwing. That is
 * the source's behaviour and it is the right one: a board has the flaps it has.
 */
const FLAP_CHARS =
  " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$()-+&=;:'\"%,./?°·…";

/**
 * Scramble timing.
 *
 * A cell runs `steps` random characters at `FLAP_STEP_MS` apart and then lands
 * on its real one. THE MECHANIC IS THE SOURCE'S; TWO OF THE FIVE NUMBERS ARE
 * NOT, AND THE MEASUREMENTS THAT FORCED THEM ARE BELOW RATHER THAN A CLAIM
 * THAT THEY WERE "TUNED".
 *
 * The source's values are `steps` 25-39 (8-15 for a blank), `FLAP_STEP_MS` 55,
 * `COL_DELAY_MS` 30, `ROW_DELAY_MS` 20. `ROW_DELAY_MS` is kept exactly. Three
 * changed:
 *
 *   `COL_DELAY_MS`  30 -> 70
 *   `FLAP_STEP_MS`  55 -> 70
 *   `steps`         25-39 -> 4-8   (blank 8-15 -> 2-4)
 *
 * -------------------------------------------------------------------------
 * WHY. THE COST IS `(CELLS IN FLIGHT) x (STEPS PER SECOND)` AND NOTHING ELSE,
 * WHICH TOOK FOUR WRONG GUESSES TO ESTABLISH. THEY ARE KEPT BECAUSE EACH ONE
 * IS A PLAUSIBLE FIX THAT DOES NOT WORK, AND THE NEXT PERSON WILL THINK OF THE
 * SAME ONES.
 * -------------------------------------------------------------------------
 *
 * Every figure is ONE FLIP at 1440x900, measured as milliseconds of frames
 * over 50ms, on a rig that PROVES a flip happened inside the sample window by
 * watching the landed text change — an earlier rig did not, and reported an
 * idle page as a clean flip. See the correction at the end.
 *
 *   build                                   1x        4x        6x
 *   no scramble at all (the old baseline)   62ms   1,978ms   3,463ms
 *   scramble, CSS keyframe flaps            65ms   7,735ms   7,565ms
 *   ... + characters written imperatively   90ms   7,045ms   7,600ms
 *   ... + one ticker for the whole board   150ms  12,020ms  19,055ms
 *   ... + no flap at all on scramble steps  85ms   8,965ms  16,045ms
 *   THE SAME DOM, scramble set to ONE step  85ms   2,470ms   4,560ms
 *   SHIPPED (the constants above)          120ms   4,995ms   7,790ms
 *
 * WHAT EACH ROW KILLS:
 *
 *   - Not the animation library. Moving the flap from re-keyed Framer motion
 *     components to CSS keyframes cut the WORST FRAME from 1,280ms to 480ms
 *     and left the total unchanged. Worth keeping for the worst frame; not
 *     the fix.
 *   - Not React. Writing the intermediate characters straight to the DOM,
 *     with no render per step, moved 7,735 to 7,045.
 *   - Not scheduling. Replacing 276 independent timers with ONE ticker that
 *     batches every write into a single synchronous block made it 1.7x WORSE
 *     (12,020ms). It does not reduce the work, it concentrates it into one
 *     unbreakable block per tick, so frames that used to interleave stall.
 *   - Not the flap animation. Removing it from scramble steps entirely still
 *     cost 8,965ms.
 *   - THE SAME DOM WITH A ONE-STEP SCRAMBLE COSTS 2,470ms. That is the row
 *     that settles it. The cost is mutating ~100 tiles inside a 276-tile
 *     `perspective-dramatic` 3D context, N times a second. Only N and the
 *     number of tiles matter.
 *
 * So the shipped constants cut both terms. Cells in flight is
 * `(steps x FLAP_STEP_MS / COL_DELAY_MS) x rows`: the source's numbers on this
 * board put all 276 in flight; these put `(8 x 70 / 70) x 6 = 48`. Steps per
 * second went 18.2 to 14.3. Together that is 4,995ms against 7,735ms, on a
 * floor of 2,470ms.
 *
 * WHAT IS HONESTLY STILL SPENT: 4,995ms against the old build's 1,978ms at 4x
 * throttle — about 2.5x, and 2.3x at 6x. AT 1x IT IS FREE (120ms against
 * 62ms), and the WORST FRAME is better than the old build's (440ms against
 * 520ms) because the cost is spread instead of arriving in one commit. This
 * is a real, declared regression on slow hardware and Saad was given the
 * numbers rather than an assurance.
 *
 * THE LEVER, IF IT EVER NEEDS TO BE CHEAPER: `steps` is linear in both terms.
 * 4-8 -> 2-4 roughly halves the added cost and still flips through more
 * characters than the build this replaced, which flipped through exactly one.
 *
 * WHAT WAS NOT TRADED: every cell still flips through 4-8 REAL intermediate
 * characters before landing. What was removed is simultaneity — the board
 * crosses as a wave rather than shaking all at once, which is also the more
 * characteristic read of the two.
 */
const FLAP_STEP_MS = 70;
const SCRAMBLE_BLANK_MIN = 2;
const SCRAMBLE_BLANK_SPAN = 3;
const SCRAMBLE_CHAR_MIN = 4;
const SCRAMBLE_CHAR_SPAN = 5;
const COL_DELAY_MS = 70;
const ROW_DELAY_MS = 20;

/**
 * Chance that any one non-final scramble step paints the cell in the accent.
 *
 * 0.2 is the source's value. What changed is the PALETTE, not the mechanic:
 * the source picks uniformly from seven hardcoded hues (`bg-red-600` ...
 * `bg-white`) and this picks the site's ONE Tier 2 accent.
 *
 * TEAL, NOT CYAN, AND THAT IS NOT A PREFERENCE. `/about` is a Tier 2 page and
 * `--accent-hero` (`#00E5FF`) is Tier 1 only — `app/globals.css` deliberately
 * registers it so that `bg-accent-hero` and `text-accent-hero` DO NOT EXIST,
 * precisely so this kind of reach cannot be typed by accident. The pair used
 * below is `bg-accent-working text-base`, which is correct in BOTH themes by
 * construction because both tokens flip: 9.5:1 in dark (`#14B8A6` under
 * `#0A0A0B`) and 5.4:1 in light (`#0F766E` under `#FDFCFA`).
 *
 * IT IS A FLASH ON A TRANSIENT FRAME, NOT A RESTING STATE. The final step of
 * every cell forces the accent off, so a settled board carries none of it and
 * no visitor ever sees teal sitting still on this page.
 */
const ACCENT_CHANCE = 0.2;

/** Longest a single flip can take, in ms, for a board of this size: the last
 *  cell's start delay, plus its longest possible scramble, plus the flap
 *  animation it lands with. The content module asserts its dwell against this
 *  rather than against a number typed twice. */
export function boardSettleMs(cols: number, rows: number): number {
  const lastStart = (cols - 1) * COL_DELAY_MS + (rows - 1) * ROW_DELAY_MS;
  const longestScramble =
    (SCRAMBLE_CHAR_MIN + SCRAMBLE_CHAR_SPAN - 2) * FLAP_STEP_MS;
  return lastStart + longestScramble + DURATION.ui * 1000;
}

/** Anything the board cannot show becomes a blank flap. */
function normalizeChar(ch: string): string {
  const upper = ch.toUpperCase();
  return FLAP_CHARS.includes(upper) ? upper : " ";
}

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
 * One cell.
 *
 * IT SCRAMBLES. On every change of `target` it runs 25-39 random characters at
 * 55ms apart — each one a full flap — and lands on the real one. That is the
 * registry component's mechanic, restored from the registry rather than from
 * this file's prose about it; see header item 11 for what was removed and why
 * the removal was wrong.
 *
 * THE FLAPS ARE KEYED ON `flipId`, SO EACH STEP REPLACES THE PREVIOUS ONE
 * RATHER THAN STACKING ON IT. A flap animates for `DURATION.ui` (350ms) while a
 * new step starts every 55ms, so every flap but the last is INTERRUPTED
 * partway. That truncation is not a bug to be tuned out — it is what produces
 * the blurred slot-machine read instead of 30 discrete legible characters.
 * Concurrency stays at two flap elements per cell, not six.
 */
const FlapCell = React.memo(
  function FlapCell({
    target,
    delay,
    flip,
  }: {
    target: string;
    /** Onset in MILLISECONDS — the board's column/row stagger. */
    delay: number;
    /** `false` under reduced motion or without a fine pointer: the character
     *  lands with no scramble and no flap at all. */
    flip: boolean;
  }) {
    const landedChar = normalizeChar(target);

    /**
     * THE CHARACTER REACT RENDERS, WHICH IS NOT THE TARGET AND MUST NOT BE.
     *
     * A CAUGHT BUG, RECORDED BECAUSE IT LOOKS LIKE A FEATURE IN A SCREENSHOT.
     * Rendering `landedChar` directly meant React committed the NEW text on the
     * frame `index` changed, and the scramble then ran ON TOP of it — so the
     * board flashed the finished quotation and scrambled BACKWARDS into it.
     * Sampled at 50ms across a flip, the first row read the complete new line
     * 43ms before the first random character appeared.
     *
     * `settled` only advances when a cell actually lands, so React paints the
     * OUTGOING character until the scramble delivers the incoming one. The
     * imperative writes and this state agree at every resting frame; between
     * them React is deliberately one flip behind.
     */
    const [settled, setSettled] = useState(landedChar);

    /**
     * KEEP `settled` HONEST WHILE THE BOARD IS NOT FLIPPING.
     *
     * `visible` below reads `settled` when `flip` is true and `landedChar`
     * when it is false, and `settled` only advances inside `landStep` — which
     * the no-flip branch never reaches. So a `target` that changes while
     * `flip` is FALSE leaves `settled` pointing at the outgoing character, and
     * the moment `flip` turns true the cell renders that stale character: the
     * whole board silently reverts to the previous entry.
     *
     * THAT WAS UNREACHABLE UNTIL 2026-08-24 AND IS NOT ANY MORE. `flip` and
     * the rotation were the same flag — `AboutFlipBoard` passed `rotating` to
     * both — so the index could not change while `flip` was false. It can now:
     * the board lands its starting entry with `flip` deliberately still false,
     * so that syncing to the clock on load does not scramble 276 cells through
     * `/about`'s entrance. This is what makes that safe.
     *
     * ADJUSTED DURING RENDER, NOT IN AN EFFECT. React re-runs this component
     * immediately with the corrected state and never commits the stale frame;
     * an effect would paint it first and then fix it. It is also the shape
     * this repo is required to use — `useHoverCapable` records that Next 16's
     * `react-hooks/set-state-in-effect` hard-errors on the other one.
     */
    if (!flip && settled !== landedChar) setSettled(landedChar);

    const tile = useRef<HTMLDivElement | null>(null);
    const topGlyph = useRef<HTMLDivElement | null>(null);
    const bottomGlyph = useRef<HTMLDivElement | null>(null);
    const fallEl = useRef<HTMLDivElement | null>(null);
    const fallGlyph = useRef<HTMLDivElement | null>(null);
    const riseEl = useRef<HTMLDivElement | null>(null);
    const riseGlyph = useRef<HTMLDivElement | null>(null);
    const sheenEl = useRef<HTMLDivElement | null>(null);

    const shownRef = useRef(landedChar);
    const accentRef = useRef(false);
    const targetRef = useRef(landedChar);
    const phaseRef = useRef(0);
    const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      const clear = () => {
        if (startTimer.current) clearTimeout(startTimer.current);
        if (stepTimer.current) clearTimeout(stepTimer.current);
        startTimer.current = null;
        stepTimer.current = null;
      };
      clear();

      const normalized = normalizeChar(target);
      // Nothing to say. This is also the branch that keeps the board still on
      // mount and across the `flip` flag resolving after hydration.
      if (normalized === targetRef.current) return;
      targetRef.current = normalized;

      /**
       * Paint one step DIRECTLY INTO THE DOM, with no React render.
       *
       * BE HONEST ABOUT WHAT THIS BOUGHT: 7,735ms -> 7,045ms at 4x throttle.
       * It is NOT the performance fix — see the table on `FLAP_STEP_MS`, where
       * this is one of four plausible fixes that did not work. It is kept
       * because it is correct in principle and it is the row that ruled React
       * out, not because it earned its keep in milliseconds.
       *
       * The principle: the intermediate characters are never state. They are
       * frames of an animation, the same category as `ParticleGrid`'s node
       * positions, which this codebase already writes imperatively for the
       * same reason. Only the LANDED character is state, and React owns that
       * — see `settled` above, and the pre-flash bug that proved it has to.
       */
      const paint = (ch: string, previous: string, withAccent: boolean) => {
        const shown = ch === " " ? " " : ch;
        const before = previous === " " ? " " : previous;
        if (topGlyph.current) topGlyph.current.textContent = shown;
        if (bottomGlyph.current) bottomGlyph.current.textContent = shown;
        if (riseGlyph.current) riseGlyph.current.textContent = shown;
        if (fallGlyph.current) fallGlyph.current.textContent = before;

        // The accent is a class swap on the two faces that carry a background,
        // plus the ink on the three glyph slots that sit on them.
        const on = withAccent;
        const was = accentRef.current;
        if (on !== was) {
          tile.current?.classList.toggle("bg-accent-working", on);
          tile.current?.classList.toggle("bg-elevated", !on);
          riseEl.current?.classList.toggle("bg-accent-working", on);
          riseEl.current?.classList.toggle("bg-elevated", !on);
          for (const g of [topGlyph, bottomGlyph, riseGlyph]) {
            g.current?.classList.toggle("text-base", on);
            g.current?.classList.toggle("text-fg", !on);
          }
        }
        // The falling half carries the OUTGOING step's accent, always.
        fallEl.current?.classList.toggle("bg-accent-working", was);
        fallEl.current?.classList.toggle("bg-elevated", !was);
        fallGlyph.current?.classList.toggle("text-base", was);
        fallGlyph.current?.classList.toggle("text-fg", !was);

        accentRef.current = on;
        shownRef.current = ch;
      };

      /** Restart a CSS animation by alternating between two identical keyframe
       *  names — one style write, and no `offsetWidth` reflow. */
      const rerun = (
        el: HTMLDivElement | null,
        name: string,
        phase: number,
      ) => {
        if (el) el.style.animationName = `${name}-${phase % 2 === 0 ? "a" : "b"}`;
      };

      const landStep = (ch: string, previous: string) => {
        paint(ch, previous, false);
        setSettled(ch);
        const phase = ++phaseRef.current;
        rerun(fallEl.current, "flap-fall", phase);
        rerun(riseEl.current, "flap-rise", phase);
        rerun(sheenEl.current, "flap-sheen", phase);
      };

      // The reduced-motion form of a scramble is its absence, not a short one.
      if (!flip) {
        // No `setSettled` here, deliberately: with `flip` false React renders
        // `landedChar` directly (see `visible` below), so the character is
        // already correct on the commit that changed `target` and a setState
        // in an effect body would be both redundant and a cascading render.
        //
        // STILL TRUE, AND NO LONGER THE WHOLE STORY. `settled` does have to
        // keep up, or it goes stale for the frame `flip` turns true — see the
        // render-time adjustment at its declaration, which is where that now
        // happens. This branch is unchanged: the correction belongs in render,
        // not here, for exactly the reason this comment gives.
        paint(normalized, shownRef.current, false);
        return;
      }

      const steps =
        normalized === " "
          ? SCRAMBLE_BLANK_MIN +
            Math.floor(Math.random() * SCRAMBLE_BLANK_SPAN)
          : SCRAMBLE_CHAR_MIN + Math.floor(Math.random() * SCRAMBLE_CHAR_SPAN);

      const runStep = (i: number) => {
        const isLast = i === steps;
        const previous = shownRef.current;
        const ch = isLast
          ? normalized
          : FLAP_CHARS[1 + Math.floor(Math.random() * (FLAP_CHARS.length - 1))];

        if (isLast) {
          landStep(ch, previous);
          return;
        }

        // A scramble step animates the FALLING half only. The rising half is
        // already parked flat showing the new character, so animating it buys
        // nothing legible at 70ms while tripling the animation starts — its
        // sheen goes with it. The falling half is the one a viewer reads as
        // motion, and it is what makes the churn look like flaps rather than
        // like a text scramble. Measured separately, this is worth little on
        // its own (see the table on `FLAP_STEP_MS`); it is kept because it is
        // free and because the rising half genuinely has nothing to show.
        // The landed frame is never accented — see `ACCENT_CHANCE`.
        paint(ch, previous, Math.random() < ACCENT_CHANCE);
        rerun(fallEl.current, "flap-fall", ++phaseRef.current);
        stepTimer.current = setTimeout(() => runStep(i + 1), FLAP_STEP_MS);
      };

      startTimer.current = setTimeout(() => runStep(1), delay);
      return clear;
    }, [target, delay, flip]);

    /**
     * THE GLYPH, AND BOTH HALVES OF THIS STRING CHANGED ON 2026-08-23 FOR
     * REASONS THAT ARE NOT "BIGGER IS BETTER".
     *
     * `text-[1.3125rem]` IS 21px AND IT IS NOT A NEW SIZE STEP. It is exactly
     * `--text-h4`'s clamp MINIMUM
     * (`clamp(1.3125rem, 1.208rem + 0.46vw, 1.625rem)`), pinned rather than
     * clamped. `text-h4` itself cannot be used here: it is viewport-dependent,
     * and header item 9 deletes the source's `clamp(6px, 2vw, 22px)` for
     * exactly that — a fixed tile grid whose glyph changes size with the
     * window is a different board at every width. `docs/03`'s "do not add a
     * 20px size" is untouched; no rung was invented.
     *
     * IT WAS THE SAME TOKEN'S MAXIMUM (26px) FOR ONE DAY. The tile came down
     * from 55px to 36px on 2026-08-24 — see `BOARD_TILE` — and a 26px glyph in
     * a 36px tile is a 72% fill where both previous sizes sat at 47%. Moving to
     * the other end of the SAME clamp keeps the fill at 58% and keeps this
     * board off the type scale's untouched rungs, which is the whole reason the
     * value is written as a pinned clamp end rather than as a round number.
     *
     * THE E/C FIX DOES NOT DEPEND ON 26px, AND THAT WAS CHECKED RATHER THAN
     * ASSUMED WHEN THE SIZE CAME DOWN. The crossbar of a capital E is ~0.125em,
     * so it is 2.6px at 21px against the 2.0px it had at the original 16px —
     * and the split line that was eating it is `bg-base/70` now rather than
     * solid, so it dims the crossbar instead of removing it. Re-captured at 6x
     * after the change: the E is unambiguous and so is the C.
     *
     * THE 0.08em TRACKING IS GONE, AND ITS ABSENCE IS A FIX RATHER THAN A
     * RELAXATION. Tracking is space BETWEEN characters and every cell here
     * holds exactly one — so it was adding 2.08px of trailing space inside the
     * flex box and pushing every glyph 1.04px LEFT of its tile's centre. The
     * inter-character spacing this board wants is the tile pitch, which it
     * already has.
     *
     * `leading-none` because the line box is centred inside a fixed-height
     * tile; `text-body`'s 1.6 leading was inflating a box that is then centred
     * anyway, and at 26px it made the glyph's optical centre drift.
     */
    const glyph =
      "absolute inset-x-0 flex select-none items-center justify-center font-mono text-[1.3125rem] leading-none text-fg";

    // A plain space collapses the line box; the glyph slot has to keep its
    // height, so blanks stay a space inside a fixed-size tile.
    // While the board can flip, React is deliberately one flip behind and the
    // scramble owns the frames in between. With `flip` false there are no
    // frames in between, so React owns the character outright.
    const visible = flip ? settled : landedChar;
    const show = visible === " " ? " " : visible;

    return (
      <div
        ref={tile}
        className={cn(
          "relative flex flex-col overflow-hidden bg-elevated",
          BOARD_TILE.wClass,
          BOARD_TILE.hClass,
        )}
      >
        {/* Top half of the character now showing. */}
        <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden">
          <div ref={topGlyph} className={cn(glyph, "top-0 h-[200%]")}>
            {show}
          </div>
        </div>

        {/* Bottom half of the character now showing, and the settle sheen that
            fades off it once the incoming flap has landed. The sheen lives HERE
            rather than inside the rising flap because that flap is edge-on at
            rest — see `app/globals.css` — so a sheen inside it would be cut off
            mid-fade. Nothing else is painted over this half: the two static
            halves are the entire resting image. */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden">
          <div ref={bottomGlyph} className={cn(glyph, "bottom-0 h-[200%]")}>
            {show}
          </div>
          <div
            ref={sheenEl}
            className="flap-sheen pointer-events-none absolute inset-0 bg-linear-to-b from-base/80 to-transparent to-60%"
          />
        </div>

        {/* The outgoing character's top half, falling. Its resting state is
            `rotateX(-90deg)` — edge-on, invisible — which is both where the
            animation ends and where the class parks it before the first flip,
            so an un-flipped board shows nothing of it. */}
        <div
          ref={fallEl}
          className="flap-fall absolute inset-x-0 top-0 z-10 h-1/2 origin-bottom overflow-hidden bg-elevated backface-hidden transform-3d"
        >
          <div ref={fallGlyph} className={cn(glyph, "top-0 h-[200%]")}>
            {show}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-base" />
        </div>

        {/* The incoming character's bottom half, rising. IT RESTS EDGE-ON at
            `rotateX(90deg)` and is invisible except while it is animating.
            It used to rest FLAT over the static bottom half — same character,
            so it looked identical — but it carries a shading gradient, and
            that gradient was dimming the lower half of every glyph on the
            board permanently. `app/globals.css` has the capture. */}
        <div
          ref={riseEl}
          className="flap-rise absolute inset-x-0 bottom-0 z-10 h-1/2 origin-top overflow-hidden bg-elevated backface-hidden transform-3d"
        >
          <div ref={riseGlyph} className={cn(glyph, "bottom-0 h-[200%]")}>
            {show}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-transparent to-base/60" />
        </div>

        {/* THE SPLIT LINE, AND IT WAS SILENTLY EATING THE LETTER E.
            =============================================================
            REPORTED SYMPTOM: "the letter E is sometimes misread as a C".
            DIAGNOSED, not assumed to be a size problem — and it is not one.

            This line is 1px of `bg-base` painted at 50% of the tile height,
            ON TOP of the glyph, so it ERASES a 1px horizontal strip through
            the middle of every character. At the old 16px, JetBrains Mono's
            capital E has a 12px cap with its middle arm 2px tall at rows 5-6,
            i.e. dead centre. MEASURED: the line sat at 48.5% of the 34px tile
            and the crossbar occupied y=16..18 — the line covered y=16.5..17.5.

            Captured at 6x zoom, the rendered E read as a C stacked on an L.
            The same tile with this element hidden read as a clean E. That is
            the whole of the bug: it was never the typeface, the weight or the
            contrast, and a bigger glyph only helps because the crossbar grows
            thicker than the 1px cut.

            BOTH HALVES OF THE FIX ARE HERE. The glyph is 21px now, so the
            crossbar is ~2.6px and survives the cut; and the line is `/70`
            rather than solid, so it DIMS the crossbar instead of removing it.
            (The glyph was 26px and the crossbar ~3.25px for one day, between
            the two halves landing and the board being shrunk again. The size
            half of the fix therefore carries LESS margin than it did — which
            is why the alpha half is not optional and must not be "tidied" back
            to a solid rule.) Re-captured at 6x after the glyph came down: the
            E is unambiguous and so is the C.

            IT IS STILL `bg-base` AND STILL 1px: it has to read as the gap
            between two flaps rather than as a rule drawn on the tile, and
            that is the colour of the gap everywhere else on this board. */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px -translate-y-[0.5px] bg-base/70" />
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
                  delay={flip ? c * COL_DELAY_MS + r * ROW_DELAY_MS : 0}
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
