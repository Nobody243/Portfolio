"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   PHASE 3 (REVISED, THEN REVERTED) — THE CONTENT IS BACK INSIDE THE CARD.
   ═══════════════════════════════════════════════════════════════════════════

   Phase 1 reproduced Aceternity's `interface-crafts-cards` unmodified with the
   vendor's placeholder deck, so a human could answer "does the mechanism work
   in this app at all" in a real browser. Phase 2 swapped in the five real
   projects. Phase 3 restyled the card onto a neutral five-step elevation ramp.
   A revised Phase 3 then moved the description and `Details` OUT of the card
   into a separate panel below the deck — **and Saad rejected that on sight and
   ordered it reverted.** It is preserved on branch `deck-panel-split-backup`
   and tag `deck-panel-split`, and it is NOT what ships.

   ═══ READ THIS BEFORE "FIXING" THE STRUCTURE AGAIN ═══

   The split is the textbook answer to the two bugs below and it is the wrong
   answer here. Saad's ruling, and the reason it is binding:

     "The reference's cards grow IN PLACE, description and Details appear
      WITHIN the expanded card, the other four stay visible fanned below, and
      switching between projects is one click. The split lost all of that.
      That's a different interaction than what was asked for, not a smoother
      version of it."

   All three of those are load-bearing and all three are verified below. **If
   you are about to move content out of this card, you are re-deriving a
   rejected design.** The bugs it was meant to fix are fixed surgically instead:

     `<a>` inside `<button>`   the card is a `<div role="button" tabIndex>`,
                               so a real `<a>` inside it is valid HTML. Zero
                               `button a, a button` matches on the page.
     inactive cards tabbable   `tabIndex={-1}` while another card is open,
                               back to `0` when none is. NOT `inert` and NOT
                               `pointer-events-none` — they stay CLICKABLE,
                               because that is what one-click switching is.

   **NOT CHANGED, AND NOT TO BE CHANGED** — confirmed by Saad in a real browser
   and by live CDP measurement across every phase: the fan rest transforms, the
   tilts, the z-order, the click behaviour, the 400px drop of the inactive
   cards, `ACTIVE_SCALE` 1.15, the rotations, the spring, the JS-driven 1024px
   spacing breakpoint, the animated outer height, the `min-h-120` floor, the
   three `DECK_H_*` constants, `h-120`, `max-w-5xl` and the hard cap.

   **WHAT THE RESTYLE KEPT FROM THE REVISION** — none of it depended on the
   split, and all of it survived the revert: the ten per-project deck faces, the
   borderless card, `rounded-deck`, the full-bleed cover clipped by the card's
   radius, the one-aspect letterbox, `--text-deck-title`, and the CIEDE2000
   correction in §1.

   **WHAT THE REVERT RETIRED, so it is not restored from memory:** `DeckPanel`,
   the `role="group"` region, the deck box fixed at 480 in both states, `inert`
   on dropped cards, and the panel's `text-body` one-liner.

   ───────────────────────────────────────────────────────────────────────────
   1. THE PALETTE — ONE COLOUR PER PROJECT
   ───────────────────────────────────────────────────────────────────────────

   `bg-deck-1` … `bg-deck-5` still name the five surfaces, but **they are now
   bound to the PROJECT and not to the stacking position.** The superseded rule
   is quoted in full at `FAN_PRESENTATION`; `app/globals.css` carries the ten
   hexes, the per-card contrast against `--color-fg`, and the mapping rule that
   re-ordering `content/projects.ts` must re-order the tokens with it.

   **ONE INK, `text-fg`, ON EVERY SURFACE.** Verified rather than assumed, as
   the brief required: the floor is ClashChat at 5.02:1 in dark, AA at any
   size; light runs 14.71 to 16.03. There is no per-card ink and none is needed.

   **NO BORDER.** Removed by name in the brief. It holds — every overlapping
   pair separates at ΔE 7.4+ in light and 9.1+ in dark. Measure that with
   CIEDE2000, never with a WCAG ratio: the ratio is luminance-only, the light
   faces are near-isoluminant and hue-separated, and it reports 1.03:1 on a
   boundary that is plainly visible. That mistake was made here first and the
   correction is written up in `app/globals.css`.

   **THE RADIUS IS `rounded-deck`, THE SITE'S SECOND RADIUS TOKEN**, added on
   Saad's instruction in the same brief. `--radius-photo`'s docblock said a
   second consumer was a decision for Saad and not for an implementer; he took
   it. Still not a scale — two tokens, each naming what it may touch.

   NO SHADOW. `projectButtonStyles.ts` records the split: the brutal offset
   treatment is for CONTROLS, never for content surfaces, and five overlapping
   tilted slabs each casting five shadow layers is the largest possible version
   of the thing that split exists to prevent.

   ───────────────────────────────────────────────────────────────────────────
   2. THE TYPE — AND WHY THE TITLE IS A NEW TOKEN
   ───────────────────────────────────────────────────────────────────────────

   **`text-base` IS A COLOUR UTILITY ON THIS SITE AND IT IS NOT IN THIS FILE.**
   `app/globals.css` defines `--color-base` and no `--text-base`, so Tailwind
   resolves the name against the colour namespace and emits
   `.text-base{color:var(--color-base)}` — no font-size, no line-height. So are
   `text-sm`, `md:text-3xl`, `text-white` and `text-black`: they resolve against
   Tailwind's default scale, which survives alongside this site's and is not it.

     card title  `text-deck-title`  21px / 1.2 / -0.01em, Space Grotesk
     one-liner   `text-body`        16px / 1.6            (in the PANEL)
     Details     `text-caption`     12px / 1.4 / 0.08em + `font-mono uppercase`
     Close       same as Details

   **THE TITLE GREW 16px -> 21px AND 21 IS A CEILING, NOT A PREFERENCE.** The
   brief asked for a larger resting title to fill the card's dead space. The fan
   shows a 180px strip of every card but the last (`CARD_SPACING`), which is
   167px of measure after `lg:px-sm`. Measured in Space Grotesk at this site's
   tracking, the longest unbreakable word in the five titles —
   "Infrastructure" — is 139px at 21px and **173px at 26px**, which is what
   `--text-h4` resolves to at any viewport the deck is actually shown at. So h4
   overflows the strip by 6px and clips, which is the defect this phase existed
   to fix. `--text-deck-title` is h4's floor with the clamp removed; the full
   table is in `app/globals.css`. Going bigger means widening `CARD_SPACING`,
   which is on the do-not-change list.

   **THE ONE-LINER IS `text-caption` + `font-mono`, AND THAT IS A REGISTER
   COMPROMISE RECORDED AS ONE.** `globals.css` pairs caption with JetBrains Mono
   for "labels / stats / tags", not for sentences. It is back inside the card,
   so it is back on the card's measure — 204px below `lg`, 274 at `lg` — and
   `text-body` renders the longest one-liner at 154px of a 204px box. The site
   has no step between 12 and 16. The panel version could afford `text-body`
   because it had the deck's full 1024px column; the card cannot. The remaining
   alternative is shorter copy, which is content, which is Saad's alone.

   **THE TITLE IS `text-body` BELOW `lg` AND `lg:text-deck-title` (21px) AT IT.**
   Not one size at both, and the reason is a height budget rather than taste: on
   the 220x300 card a three-line reservation at 21px costs 20.6px more than at
   16px, and the expanded content needs 216 of the 231px available under the
   cover. Measured at 900 and 768: worst-case slack **24px**, on CCN. At 21px
   there it would overflow and `overflow-hidden` would eat the `Details` link —
   a defect this component has shipped once already.

   ───────────────────────────────────────────────────────────────────────────
   3. THE SPACING
   ───────────────────────────────────────────────────────────────────────────

   `p-2 md:p-4`, `mt-5`, `mt-3`, `max-h-50` and `gap-2` are gone. The card has
   no padding of its own — the cover is full-bleed and the title block carries
   `px-xs lg:px-sm` — and every gap in the panel is `mt-md` / `p-md lg:p-lg`
   off the Fibonacci scale.

   **`h-120` AND `min-h-120` SURVIVE AS THE TWO EXCEPTIONS AND THEY ARE
   DELIBERATE.** Both are 480px — the vendor's resting box and the inner
   positioning wrapper's fixed height — and both are in the do-not-touch list
   because the entire Phase 1b extent arithmetic derives from them. There is no
   480 on the Fibonacci scale, and inventing one to launder a locked constant
   would be worse than the inconsistency. `max-w-5xl` on the inner wrapper is
   the vendor's container and is untouched for the same reason.

   **THE TITLE'S `min-h` RESERVATION IS GONE AND IS NOT TO BE RE-ADDED.** It was
   `min-h-xl lg:min-h-[76px]`, sized to three lines, and it existed to keep the
   description starting at the same height on all five cards. Bottom-anchoring
   supersedes it and gives a better constant — `Details` is now the same
   distance off the card's bottom edge on every card in both states — and it
   removes the ~50px of empty card that the reservation left under the three
   one-line titles, which was on the flagged list. Nor is it needed to keep the
   cover off the title: the cover is fixed-aspect and `shrink-0`, so it cannot
   grow into anything.

   ───────────────────────────────────────────────────────────────────────────
   4. THE TRANSITION — FIXED STRUCTURALLY, AND RE-MEASURED
   ───────────────────────────────────────────────────────────────────────────

   Phase 2's cover was `flex-1 max-h-50`, so its height was a function of the
   text block's height; the description's height was animated on the spring, the
   cover's flex basis re-solved against it every frame, and the cover collapsed
   200 -> 117 while the title travelled 109px.

   **THE TITLE NOW MOVES ON PURPOSE, AND THAT IS NOT THE SAME THING.** Saad
   asked for the name to sit at the bottom of the card and "then transform with
   the content", so the card is `justify-between`, the text block is
   bottom-anchored, and the expanded body's height animates from 0 to **a
   measured pixel value** on the card's own spring — which lifts the title.

   **NOT `"auto"`. THAT WAS TRIED AND IT IS THE THIRD DISTINCT VERSION OF THIS
   BUG.** `CardExpandedBody`'s docblock carries the frame-by-frame trace; the
   short version is that Motion resolved `"auto"` to a target of ~183 when the
   content had always measured 129, then handed the height back to `auto` on
   completion and everything below the title dropped 54px in one frame. Saad
   reported it as "the content glitches to the bottom of the card".

   Phase 2 also animated a height here and that WAS a bug for a third reason
   again: the cover was `flex-1` and re-solved against this block every frame,
   so the screenshot itself scaled 200 -> 117 and the title chased it.

   What holds now: the cover is fixed-aspect and `shrink-0`, the target is a
   number rather than a keyword, and the body's content is pinned to the BOTTOM
   of the collapsing box (`justify-end`) so it is revealed rather than moved.

   RE-VERIFIED ON THE PRODUCTION BUILD in transform-free layout coordinates —
   `getBoundingClientRect` is useless here, because a resting card is rotated up
   to 15 degrees and its bounding box is not its box:

     COVER   [w, h, offsetTop]        274,154,13   one value throughout
     DETAILS bottom, above the card    2px -> 2px  **travel 0.0px**
     TITLE   bottom, above the card    0px -> 132  the intended lift
     body height                       peak 133, settles 129 (no snap)

   Zero travel on `Details` is the invariant; 132px on the title is the feature.
   A title with ONE sampled position would mean it jumped rather than animated,
   and the check asserts against that too. Endpoint measurement would have
   passed all three versions of this bug, which is why this samples the middle.

   ───────────────────────────────────────────────────────────────────────────
   5. LETTERBOXING — ONE SILHOUETTE, NO CROP
   ───────────────────────────────────────────────────────────────────────────

   `content/projects.ts` carries an explicit "DO NOT CROP, and do not swap in a
   simplified diagram" on the CCN cover with no scale qualifier, and Saad
   confirmed it stays authoritative for all five. `object-contain`, always.

   The cover box is ONE fixed aspect per breakpoint, shared by all five, so the
   deck has a single silhouette at any given width — verified, 274x154 on every
   card at `lg` and 204x82 on every card below it — and **the letterbox fill is
   the card's own surface**, because the box declares no background and what
   shows through the bars is literally `bg-deck-N`.

   IT IS INSET ON ALL FOUR SIDES by the card's `p-xs lg:p-sm` and carries
   `rounded-deck` of its own, since it no longer reaches the card's corners to
   be clipped by them.

   **THE TWO RATIOS ARE A HEIGHT BUDGET** set by CCN, whose one-liner is the
   longest of the five — the cover gets what the expanded text block does not
   need. `lg:aspect-[16/9]` leaves 15px of headroom at 300x400; `aspect-[5/2]`
   leaves 4px at 220x300. Measured bars at `lg`, native aspect against the
   1.778 box:

     FOLIO      2.143   13.1px top and bottom
     Aero-Grid  2.130   12.7px
     ClashChat  2.130   12.7px
     CCN        2.674   25.5px   ← the worst case
     SNA        1.971    7.6px

   Every source is wider than the 1.778 box, so all five letterbox and none
   pillarboxes. A squarer box would fill more of the card and cost CCN more bar;
   a wider one would shrink the photo the margin was just added to show off.
   Below `lg` the 2.5 box is inside the sources' range, so SNA pillarboxes there
   and the rest letterbox.

   `style={{ objectFit: "contain" }}` AND NOT ONLY THE CLASS. `next/image` reads
   `objectFit` from the prop or from `style`, never from `className`; with both
   absent the blur placeholder falls through to `background-size: cover` and the
   plate crops while the loaded image letterboxes, producing a visible pop on
   load. `ProjectStripRow.tsx` carries the full diagnosis.

   `sizes` DECLARES THE SCALED WIDTHS: the active card is painted at
   `ACTIVE_SCALE` 1.15, so 300 and 220 become 345 and 253 device-independent
   pixels. `quality={85}` uniformly, never per image. No `priority`: five covers
   competing for the connection is worse than five arriving a beat late, and on
   this route they are behind the Intro plate for ~2.7s regardless.

   ───────────────────────────────────────────────────────────────────────────
   STILL OPEN
   ───────────────────────────────────────────────────────────────────────────

     - **NO MOBILE TREATMENT BELOW 1024.** There is not one `sm:` or `md:`
       utility in this file — the two `lg:` breakpoints are the only ones. At
       220x300 with 70px of card exposed the titles overlap each other and the
       fan is not usable on a phone. The expanded card at least FITS there now
       (verified at 900 and 768, worst-case slack 24px, `Details` visible on all
       five), but fitting is not a treatment. The governing spec asks for a real
       mobile version of the interaction and this is the largest open item.
     - **NO `prefers-reduced-motion` BRANCH.** The spring runs for everyone.
     - **ARIA: A `role="button"` SHOULD NOT CONTAIN FOCUSABLE DESCENDANTS.**
       The HTML is valid and the `Details` link is reachable by Tab, but some
       assistive tech may not surface it while traversing the card as a widget.
       This is the residual of the surgical fix and it is stated rather than
       hidden. The clean answer is `Details` outside the card's hit area, which
       is a design change — and the version that did it by moving all the
       content out is the one that was rejected.
     - **THE DECK STILL OFFERS NO PROJECT LINKS WITH JS OFF — and the anchor
       count no longer shows that.** Since the expanded body is always mounted
       (it has to be, for the `ResizeObserver` to measure it), all five
       `/projects/<slug>` anchors ARE now in `.next/server/app/work.html`, where
       there used to be none. **They are not usable.** Each sits inside
       `style="height:0px;opacity:0"` and carries `inert=""`, both server-
       rendered, so with JavaScript off they are invisible and inactive and the
       only route onward is still the single "Browse All" control. Do not
       read the grep as a fix. Making the deck degrade to real links is a design
       decision, not a cleanup.
     - **ONE DROPPED-ROW TITLE IS CLIPPED.** At rest all five titles are
       completely clear — hit-tested on the actual painted line boxes, widest
       line 157px against the 167px cap. But while a card is open the other four
       collapse to `offsetX * 0.4` (72px apart), and **Aero-Grid loses the tail
       of its title** — one probe in five. Fixing it means changing the drop
       geometry, which is on the do-not-change list.
     - **THE 220x300 CARD HAS 4px OF VERTICAL HEADROOM ON CCN.** Measured
       expanded at 900: cover 82 + text 198 = 280 of 284. The other four have
       21 to 63px. `aspect-[7/3]` was tried and measured **-1px** — it fit only
       by eating a pixel of the card's own bottom padding. **Lengthening any
       one-liner in `content/projects.ts` requires re-measuring this**, and the
       real answer is the mobile treatment that does not exist yet.
     - **FOLIO'S COVER HAS NO EDGE AGAINST FOLIO'S CARD.** `#F5EFEB` and the
       FOLIO screenshot's own cream page background are close enough that the
       image dissolves into the surface in light mode. It is the one card where
       dropping the cover's `border-fg/25` frame costs something visible.
     - The file is still named `FannedDeckPhase1.tsx`. Renaming it touches
       `ProjectDeckSection.tsx` and is not worth a drive-by change.
   ═══════════════════════════════════════════════════════════════════════════ */

import Image from "next/image";
import Link from "next/link";

import { DECK_DETAILS_LABEL } from "@/components/sections/projectDeckContent";
import { DURATION, EASE } from "@/lib/animation/easing";
import type { Project } from "@/content/types";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * The four fields the deck draws, and no more.
 *
 * A `Pick`, not `Project`, for the reason `ProjectDeckSection.tsx` states: this
 * is a client component, so every field handed to it is serialised into the RSC
 * payload. `description` — by a wide margin the longest strings in the data
 * file — has no business crossing that boundary for a card that never renders
 * it. `ProjectStripRow.tsx` narrows the same way.
 */
export type DeckCardProject = Pick<
  Project,
  "slug" | "title" | "oneLiner" | "coverImage"
>;

type Card = DeckCardProject & {
  surface: string;
  config: {
    y: number;
    x: number;
    rotate: number;
    zIndex: number;
  };
};

type SpringConfig = {
  type: "spring";
  bounce?: number;
  visualDuration?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
};

/* The demo's plain defaults, as ordinary constants. The demo's
   `export const controls` tuning panel is deliberately NOT reproduced — it is
   the Aceternity docs site's own live-tweaking UI, the same category as the
   `tweakpane` dependency already stripped from another vendor component here.
   Do not wire this component to `useDialKit`, `useControls` or `tweakpane`. */
const SPRING: SpringConfig = {
  type: "spring",
  visualDuration: 0.6,
  bounce: 0.25,
};
/**
 * THE OUTER BOX'S HEIGHT GETS A TWEEN, NOT THE CARDS' SPRING, AND THE REASON IS
 * MEASURED RATHER THAN AESTHETIC.
 *
 * ═══ WHAT THIS PROPERTY COSTS ═══
 *
 * `height` on this box is the single most expensive thing the deck animates,
 * because it is the only one that changes DOCUMENT FLOW: every frame, the
 * heading, "Browse All", Certifications, Experience, Currently Learning
 * and the sticky reveal footer all move, and everything that moves repaints.
 * Isolated on the production build with the CPU throttled 6x — driving each
 * animation alone, from the page, with nothing else running:
 *
 *   the outer box height, 570 -> 906     545.7ms main thread   (Paint 232.1ms
 *                                                               over 763 calls)
 *   all five card transforms together    355.4ms main thread   (Paint   9.6ms)
 *
 * The five cards moving, rotating and scaling at once cost LESS than the one
 * box getting taller, and almost none of their cost is paint — that is what
 * `will-change: transform` on the card buys.
 *
 * ═══ WHY A TWEEN FIXES THE JUDDER ═══
 *
 * A spring does not stop; it asymptotes. `SPRING` above overshoots by 2.84% and
 * then spends a long tail creeping back, and on a 336px height change that is
 * a ~9.5px overshoot of the ENTIRE DOCUMENT BELOW, followed by several hundred
 * milliseconds of sub-pixel frames — each one a full reflow and repaint of
 * everything under the deck. Bouncing the page and then juddering it back is
 * exactly what "the content is stuttering when transform" describes.
 *
 * So this one property gets a bounded curve: it starts and it stops. The CARDS
 * keep the spring — they are composited, they cost almost nothing, and the
 * spring is the reference's own feel, which Saad confirmed in a browser and
 * which is on the do-not-change list.
 *
 * `EASE.reveal` and `DURATION.reveal` are the site's own tokens, from
 * `lib/animation/easing.ts`, and this is that file's first consumer inside the
 * deck. 0.7s against the cards' 0.6s visual duration is deliberate: the box has
 * to still be growing when the deepest dropped card arrives, or the card lands
 * against a clip edge that has not finished moving.
 */
const BOX_GROW = {
  duration: DURATION.reveal,
  ease: EASE.reveal,
} as const;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * `restDelta` FOR `scale`, AND WHY THE DEFAULT IS WRONG FOR IT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Saad: "as the content pulls up it goes slightly down with a stutter." It did,
 * and it was one frame wide. Sampling the card's computed transform matrix on
 * every frame of a real expand, the scale channel:
 *
 *   t=351.6ms   1.13918 -> 1.14015   (+0.0010)
 *   t=356.5ms   1.14015 -> 1.14108   (+0.0009)
 *      ... 60 more frames, every step <= 0.001, all upward ...
 *   t=526.5ms   1.15410 -> 1.15000   (-0.0041)   <- FOUR TIMES ANY OTHER STEP,
 *                                                   AND IT REVERSES DIRECTION
 *
 * **A SPRING DOES NOT DO THAT. Motion stopped it and wrote the target.** Its
 * springs finish when the remaining distance drops under `restDelta`, whose
 * default is 0.01 — a sensible pixel tolerance and a terrible one for `scale`,
 * which is dimensionless. On a 400px card, 0.01 of scale is **4px**, so the
 * animation was entitled to end up to 4px away from where it was going and
 * jump the rest. It took 0.0041, which is 1.64px, in one frame, downward, while
 * the card was still travelling up — and everything drawn inside the card moved
 * with it. That is the stutter, exactly as described.
 *
 * 0.0002 is 0.08px on the same card: below one device pixel, so the spring now
 * settles into place instead of arriving at it.
 *
 * **THE BOUNCE IS NOT THE BUG AND IS NOT REMOVED.** The card still overshoots
 * `ACTIVE_SCALE` by ~0.4% and comes back — that is the reference's feel, Saad
 * confirmed it in a browser, and it is on the do-not-change list. What changed
 * is that the last 1.64px of that return is now animated rather than snapped.
 */
const SCALE_REST_DELTA = 0.0002;

/**
 * THE BODY'S GROWTH — the same spring with the bounce taken out.
 *
 * The card's height lifts the title; a bounce on it meant the title rose 1.4px
 * PAST its resting position and then crept back down over ~350ms. Measured, the
 * body wrapper settled at **886.6ms** and the title at **811.5ms**, long after
 * the card itself was done at 526.5 — a slow reverse drift with nothing else
 * moving, which reads as a second, separate motion rather than a tail.
 *
 * `bounce: 0` is critically damped: monotonic, no overshoot, and it stops. The
 * CARD keeps `SPRING` unchanged — the fix is to the one property whose overshoot
 * had nothing to bounce against.
 *
 * ═══ IT MUST STAY A SPRING, AND `BOX_GROW` IS NOT A SUBSTITUTE ═══
 *
 * Giving this the outer box's bounded tween was tried and measured WORSE. The
 * title's position on screen is the sum of two things: its layout position
 * inside the card, which this animates, and the card's own transform, which
 * `SPRING` animates. A 0.7s tween finishes the first at 679ms while the second
 * is still settling out of its overshoot until ~864ms — so the title arrived,
 * then got dragged **16.0px past its resting place and back** by the card
 * moving underneath it, with 2 direction reversals and 4 frame-to-frame jumps
 * over 0.6px. Sharing `visualDuration` with `SPRING` is what keeps the two
 * halves of that sum in step: measured, the title's screen overshoot is
 * **0.0px**.
 */
const BODY_GROW = {
  type: "spring",
  visualDuration: SPRING.visualDuration,
  bounce: 0,
} as const;

const ACTIVE_SCALE = 1.15;
const CARD_SPACING = 180;

/**
 * THE FAN, POSITION BY POSITION — the vendor's five `config` blocks, unchanged,
 * zipped against `content/projects.ts` by index.
 *
 * IT LIVES HERE AND NOT IN `content/`. `content/types.ts`'s hard rules forbid
 * colour and class strings in the data layer outright, and a rotation in
 * degrees is presentation by the same argument. A project's position in the fan
 * is a property of the fan, not of the project.
 *
 * ═══ `surface` IS PER-PROJECT NOW, NOT PER-STACKING-POSITION (2026-08-26) ═══
 *
 * **The rule that used to live here has been REVERSED and must not be restored
 * from memory.** It read, in full: "THE RAMP IS ORDERED, NOT ASSORTED, AND THE
 * ORDER IS `zIndex`'s … the card carrying step *n* is the card at stacking
 * position *n* … do not re-shuffle these five class strings." That was correct
 * for the neutral elevation ramp it described, where lightness encoded DEPTH.
 *
 * Saad replaced that ramp with ten hand-picked hexes, one colour per project,
 * in the Phase 3 brief. `bg-deck-1` is FOLIO's colour because it is FOLIO's,
 * not because FOLIO sits at the bottom of the stack. **So these five strings
 * are now bound to `content/projects.ts`'s ARRAY ORDER and re-ordering that
 * file must re-order `--color-deck-*` in `app/globals.css` with it.** The
 * `config` blocks beside them are still bound to the stacking position and
 * still must not be shuffled.
 *
 * **NO BORDER, ON SAAD'S INSTRUCTION.** `border-accent-working/30` was on every
 * card until 2026-08-26 and the brief removed it by name: "no border — seamless
 * card, background color is the card's only edge definition". It holds: every
 * overlapping pair separates at ΔE 7.4 or better in light and 9.1 or better in
 * dark. **Measure that with CIEDE2000 and not with a WCAG ratio** — the ratio
 * is luminance-only, the light faces are near-isoluminant and separated by hue,
 * and it reports 1.03:1 on a boundary that is plainly visible. `app/globals.css`
 * carries both tables and the reason the first measurement was misleading.
 *
 * NO PER-CARD INK. One `text-fg` on all five, verified rather than assumed:
 * the floor is ClashChat at 5.02:1 in dark, which is AA at any size. The ten
 * per-card figures are tabulated in `app/globals.css`.
 */
const FAN_PRESENTATION = [
  {
    surface: "bg-deck-1",
    config: { y: -20, x: 0, rotate: -15, zIndex: 2 },
  },
  {
    surface: "bg-deck-2",
    config: { y: 20, x: 180, rotate: 8, zIndex: 3 },
  },
  {
    surface: "bg-deck-3",
    config: { y: -80, x: 360, rotate: -5, zIndex: 4 },
  },
  {
    surface: "bg-deck-4",
    config: { y: 20, x: 540, rotate: 12, zIndex: 5 },
  },
  {
    surface: "bg-deck-5",
    config: { y: 20, x: 720, rotate: -5, zIndex: 6 },
  },
] as const;

/**
 * The circle-and-arrow beside "Details". Hand-authored, `currentColor`,
 * `aria-hidden` — the word next to it is the accessible name.
 *
 * NO ICON PACKAGE. `skillLogos.tsx` records the standing reason: this site has
 * no icon system, inline SVG is the answer, and a dependency for one 14px glyph
 * is the wrong trade.
 *
 * Drawn in a 24-unit box: a ring, and an arrow pointing along the reading
 * direction because the control moves you FORWARD into the project rather than
 * out to a third-party site.
 *
 * 14px against a 12px `text-caption` line is deliberate and it does not set the
 * row's height: the label's line box is 16.8px, so the glyph sits inside it and
 * the `Details` row measures 17px flat, which is the figure the budget in §6
 * uses.
 */
function DetailsArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      className="shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.25" />
      <path d="M9.5 12h5.25" />
      <path d="M12.5 9.25 15.25 12l-2.75 2.75" />
    </svg>
  );
}

/* ===========================================================================
   CONTAINER SIZING - PHASE 1b. THE ONLY NON-VENDOR *BEHAVIOUR* IN THIS FILE.
   ===========================================================================

   CONFIRMED BY SAAD IN A REAL BROWSER AND BY LIVE MEASUREMENT. Neither Phase 2
   nor Phase 3 changed anything here, and neither had to: the card's LAYOUT box
   is unchanged (300x400 at `lg`), the drop is still `y: 400` at `scale: 0.7`,
   and the rotations and spring are untouched, so every figure below still
   holds. Phase 3 restyled what is INSIDE the card and moved one breakpoint that
   lives inside the card; the fan's geometry never entered the diff.

   WHY THE INNER WRAPPER CAN NEVER GROW. Cards are `absolute; top: 50%;
   margin-top: calc(var(--height) / -2)` inside the INNER positioning wrapper,
   so all five are centred on that wrapper's midpoint. The inner is `h-120` =
   480px, so the midpoint is 240px and it MUST NOT MOVE. Growing the inner from
   480 to ~820 would move the midpoint 240 -> 410 and push every card down
   170px - including the EXPANDED one, which has to stay exactly where it is.
   So the inner stays 480 forever and the OUTER box grows instead.
   `items-start` (was `items-center`) pins the inner's top edge to the outer's
   top edge at any outer height; at rest the two are equal and `items-start`
   renders identically to `items-center`, so the confirmed resting fan is
   untouched.

   `overflow-hidden` STAYS ON THE OUTER, and removing it is not an alternative.
   It is what horizontally clips the two end cards between ~1024 and ~1198px of
   viewport width, which is intended; without it that becomes a horizontal
   scrollbar. And CSS cannot clip one axis only - `overflow-x: hidden` with
   `overflow-y: visible` computes the visible axis to `auto`. So the vertical
   fix has to be HEIGHT.

   ---------------------------------------------------------------------------
   VERTICAL EXTENT, measured downward from the inner wrapper's top edge (y = 0).
   Includes the rotation each card carries and the spring's overshoot, both of
   which a naive y + height/2 sum misses. A w x h box rotated by T has
   half-height (w/2)*sin T + (h/2)*cos T. `bounce: 0.25` is damping ratio
   z = 0.75, whose first peak overshoots its target by exp(-pi*z/sqrt(1-z^2)) =
   2.84%.

                                        base (<1024)     lg (>=1024)
     card --width / --height              220 / 300        300 / 400
     resting fan, top edge                  +1.0            -52.3
     resting fan, bottom edge             +429.6           +486.8
     expanded card, top / bottom      67.5 / 412.5     10.0 / 470.0
     inactive cards, end of drop          +748.9           +785.3
       ...at the spring's peak            +759.1           +794.9  <- the max
     CONTAINER, expanded                   800.0            840.0
     clear air below the deepest card      +40.9            +45.1

   THE TWO CLIPPED RESTING EDGES AT `lg` ARE THE VENDOR'S OWN AND ARE NOT
   TOUCHED HERE. Card 3's bottom corner sits 6.8px below the 480 box and card
   2's top corner 52.3px above it, at rest, in the state Saad confirmed against
   the vendor reference. (Hovering a resting card scales it 1.05 and deepens the
   first to 18.2px.) The rest height is still exactly 480 at every breakpoint.
   Only the ACTIVE height is new.

   ---------------------------------------------------------------------------
   THE GROWTH IS REAL, IN-FLOW BLOCK HEIGHT. THIS IS A REQUIREMENT, NOT AN
   IMPLEMENTATION DETAIL.

   The point is not only that the dropped cards become visible - it is that
   Certifications and Experience are genuinely PUSHED DOWN THE DOCUMENT while a
   card is open. Anything that merely accommodates the cards visually
   (`overflow: visible`, an absolutely-positioned spacer, a transform, a
   negative margin cancelled at rest) would un-clip the cards and leave the flow
   below untouched, which is the wrong build. Measured on the production build
   at 1440x900, rest -> expanded:

     outer wrapper computed height        480px  ->  840px
     outer wrapper offsetHeight             480  ->    840
     INNER wrapper offsetHeight             480  ->    480   (never moves)
     "Browse All" doc offset       753.80  -> 1113.80
     Certifications <h2> doc offset      991.59  -> 1351.59   (+360.00)
     Experience <h2> doc offset         1316.19  -> 1676.19   (+360.00)
     document.scrollHeight                 2770  ->   3130    (+360)

   Those two heading offsets are the proof. If they were equal in both states,
   this would be the wrong build.

   ---------------------------------------------------------------------------
   THE HEIGHT ANIMATES, ON THE CARDS' OWN SPRING. **THAT IS SAAD'S CALL, MADE
   ON VISUAL GROUNDS, IN A REAL BROWSER** - "the animated was good rather than
   instant, it showed smoothness like below the fanned deck section". The
   smooth downward slide of Certifications and Experience is the wanted effect,
   not a side effect to be minimised. **No performance measurement justified
   this choice and none is claimed to.**

   WHAT WAS MEASURED, AND WHAT IT DOES AND DOES NOT SETTLE. An instant-switch
   version was built and both were measured on PRODUCTION builds at 1440x900,
   driving a real browser over CDP and reading `Performance.getMetrics` across
   identical windows.

   The clean comparison is the COLLAPSE, and it is clean for a specific reason:
   the description block animates its height on the way IN, so during an EXPAND
   there is already a per-frame layout that belongs to the card and swamps the
   container. On the way OUT its `exit` is opacity/x/y only, so the container's
   height is the ONLY height in play:

     collapse, identical 2500ms window   animated   instant   idle
       LayoutCount                             68         8      0
       LayoutDuration (ms)                   5.56      0.55      0

   So the animated box does cost ~60 extra layout passes and ~5ms of layout
   across the transition, on itself and on every section after it in flow.
   That is a real cost and it is the honest number.

   THE EXPAND NUMBERS ARE DELIBERATELY NOT QUOTED AS A VERDICT, BECAUSE THEY
   ARE NOT INTERPRETABLE. Animated 66 / 5.92ms against instant 122 / 5.50ms -
   the INSTANT build counting nearly twice the layouts of the animated one is
   the tell that something other than the container dominates them (the
   paragraph tween above, plus the sampler's own per-frame
   `getBoundingClientRect`).

   AND THE THING THAT ACTUALLY MATTERS - FRAME COST DURING THE TRANSITION -
   **COULD NOT BE MEASURED CREDIBLY IN THAT ENVIRONMENT.** Both versions held a
   16.6ms median frame interval with an 18.1 / 18.4ms maximum and dropped
   nothing, but that was a software-rendered headless shell on one developer
   machine, which is not a valid proxy for real hardware under a real
   compositor. Anyone revisiting this should treat "no dropped frames" as
   unproven rather than as evidence.

   THE ONE CHEAP THING THE ANIMATED VERSION STILL DOES: it performs no layout
   READ. The height is written from a spring and nothing calls
   `getBoundingClientRect` in the loop, so it never forces synchronous layout.
   And the five cards are `absolute` against the INNER wrapper, whose height
   never changes, so the growing box does not re-resolve a single card's
   position. What reflows is static flow content below the deck.

   REUSING `cardSpring` IS LOAD-BEARING, NOT TIDINESS. Container and cards then
   share one normalised progress s, so clearance is a function of s alone and
   holds in BOTH directions without being re-proved. Worst card at `lg`
   (index 0), container bottom minus card bottom: s=0 -> +28.0, s=0.5 -> +42.2,
   s=1 -> +54.7, s=1.0284 (peak) -> +55.3. A CSS transition with a fixed
   duration would have to be re-argued per direction, and would be wrong on the
   return, where the container must LAG the cards rather than lead them.

   `min-h-120` IS THE FLOOR AND IT IS LOAD-BEARING - IT FIXES A REAL BUG IN THE
   OBVIOUS IMPLEMENTATION, AND THE BUG WAS MEASURED RATHER THAN PREDICTED. A
   bouncy spring undershoots on the way back down. Sampled every frame of a
   collapse on the shipped build, reading the RAW animated value off
   `element.style.height` alongside the USED height:

     minimum inline animated height     469.79px   (at t = 614.2ms)
     frames with the inline value < 480       32   of 121
     minimum USED height                   480px   <- the floor holding

   Unguarded, that is ~10px below the vendor's own 480 box for half a second at
   exactly the moment the fan returns - clipping the RESTING fan and bobbing
   every section below it. CSS `min-height` wins over `height`, so the box can
   never be shorter than the resting fan; with the guard the used height never
   leaves [480, 850.2] in either direction. It also holds the box at 480 in the
   prerendered HTML, which emits no inline height at all.

   THE ONE NEGATIVE CLEARANCE IS THE PRE-EXISTING ONE, AND IT IS NOT MADE
   WORSE. Card 3 at `lg` sits 6.8px below the box at rest (above). Sampled
   every frame of both transitions, the worst clearance anywhere is **-6.82 on
   the expand and -6.84 on the collapse** - the resting overhang and nothing
   else. No card is ever clipped by more than it already is when the deck is
   idle.

   A SIBLING SPACER IS NOT A THIRD OPTION. The clipping is done by the outer
   box's OWN `overflow-hidden`, so reserving space beside that box un-clips
   nothing; the box still has to be tall enough.
   =========================================================================== */

/* ═══════════════════════════════════════════════════════════════════════════
   THE BOX, AND WHY THE FAN SITS 64px DOWN INSIDE IT
   ═══════════════════════════════════════════════════════════════════════════

   ═══ THE RESTING FAN IS 539px TALL AND IT WAS IN A 480px BOX ═══

   Saad: "the cards are cut off on the top." They were, and by a lot. Measured
   on the production build at 1440, each card's painted box against the deck
   viewport's own edges:

     card 0  FOLIO       top  -12.0   <- cut
     card 1  Aero-Grid   top   41.1
     card 2  ClashChat   top  -52.3   <- cut, and this is the binding one
     card 3  CCN                      bottom  -6.8   <- cut
     card 4  SNA         top   47.7

   A card is 400px tall and up to 300px wide, so a 15-degree tilt paints a box
   `300*sin15 + 400*cos15 = 464px` tall, and the five `config.y` offsets spread
   another 100px on top of that. **The resting fan's true extent is 539.1px,
   from -52.3 to 486.8 in the old box's coordinates** — it never fitted in 480
   and no amount of re-centring would have made it, because the fan is not
   symmetric about its own middle.

   ═══ WHAT FIXES IT ═══

   `FAN_OFFSET_Y` pushes the fan down inside the box, and the box is 570 rather
   than 480. Measured on the production build, worst card in each direction:

                           top clear    bottom clear
     at rest                 13.7          17.2
     with a card hovered      3.1           5.8

   The hover row is why the box is not sized to the resting fan alone.
   `whileHover` scales a resting card to 1.05, so card 2 grows ~10.6px taller
   and card 3 ~11.3px, and a fit with no slack clips on mouse-over. An earlier
   pass at 565/64 measured **1.1px** clear on a hovered card 2 — positive, but
   inside rounding noise, so five more pixels were spent.

   The offset is on the OUTER box and is constant in both states. Making it
   rest-only would move the entire fan 66px the instant a card was clicked.

   ═══ THE COST, AND IT IS SAAD'S TO SPEND ═══

   `ProjectDeckSection.tsx` budgets this section against a real `innerHeight`.
   The deck's resting box was 480 and is now 570, so the section's resting
   height goes 805.6 -> 895.6 from the top of the viewport:

     at 945 innerHeight   +49.4 clear   (was +139.4)
     at 905                +9.4 clear   (was  +99.4)
     at 875               -20.6         (was  +69.4)   <- crosses the fold
     at 860               -35.6

   **A 1920x1080 display with a bookmarks bar still fits; add an infobar too and
   the "Browse All" control drops below the fold by ~21px.** The
   alternative is to reclaim 21px by taking the heading gap from `mt-xl` (55) to
   `mt-lg` (34) — that gap was already cut from 89 for exactly this reason and
   the section's docblock says so — which would clear 875 by 0.4px.
   NOT TAKEN HERE: it is a spacing decision on a section Saad composed, and a
   visibly cut card is a defect on every visit while 875 is a narrower case.

   ═══ THE ACTIVE HEIGHTS MOVE WITH IT ═══

   The four cards thrown `y: 400` at `scale: 0.7` reach 759.1px below the fan's
   own top below `lg` and 794.9 at `lg`; with the fan 66px down they reach 825
   and 861. **They must stay VISIBLE — that is what makes one-click switching
   between projects possible**, which is the interaction the reference has and
   the reason the panel-split version was rejected. So the box grows to hold
   them rather than clipping them away.

   A SIBLING SPACER IS NOT A THIRD OPTION. The clipping is done by the outer
   box's OWN `overflow-hidden`, so reserving space beside that box un-clips
   nothing; the box still has to be tall enough.
   ═══════════════════════════════════════════════════════════════════════════ */

/** How far the fan sits below the box's top edge. 52.3 of measured overflow,
    plus air for `whileHover`'s 1.05 — a hovered card 2 grows ~10.6px taller and
    is the binding case. Measured hovered: 3.1px clear at the top. */
const FAN_OFFSET_Y = 66;
/** 486.8 lowest resting card + `FAN_OFFSET_Y` + 17.2 breathing room.
    Measured with card 3 hovered, the binding case at the bottom: 5.8px clear. */
const DECK_H_REST = 570;
/** 759.1 deepest dropped card + `FAN_OFFSET_Y` + 40.9 breathing room. */
const DECK_H_ACTIVE = 866;
/** 794.9 deepest dropped card + `FAN_OFFSET_Y` + 45.1 breathing room. */
const DECK_H_ACTIVE_LG = 906;

/**
 * THE EXPANDED BODY — one-liner and `Details`, and the thing whose height
 * lifts the title off the bottom of the card.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * IT ANIMATES TO A MEASURED PIXEL HEIGHT. IT MUST NEVER ANIMATE TO `"auto"`.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `animate={{ height: "auto" }}` shipped here for a few hours and produced the
 * defect Saad reported as "the content glitches to the bottom of the card".
 * Traced on the production build with a `requestAnimationFrame` sampler on
 * CCN — the worst card — reading the wrapper's inline height, its `offsetHeight`
 * and its `scrollHeight` on every frame:
 *
 *   t(ms)     inline height    scrollHeight (the TRUE content height)
 *      27       58.9px         129
 *     157      111.7px         129
 *     502      186.3px         129   ← already 44% past the real height
 *     577      186.6px         129   ← peak
 *    1002      183.1px         129   ← still drifting down, not settled
 *    1012      auto  ->  129px       ← **54px SNAP, in one frame**
 *
 * Two separate faults, and the second is the visible one. Motion resolved
 * `"auto"` to a target of ~183 when the content had always measured 129 —
 * `scrollHeight` reads 129 from the first frame, the `<p>` is 84px tall at a
 * 274px measure the whole time, and `document.fonts.status` is already
 * `loaded` before the click, so nothing reflowed. Then, on completion, Motion
 * hands the inline height back to `auto`, the real value takes over, and
 * everything below the title drops 54px in a single frame. That drop is what
 * reads as content glitching down into the bottom of the card.
 *
 * So the height is measured here instead, with a `ResizeObserver`, and animated
 * to a NUMBER. There is no `"auto"`, nothing to hand back, and nothing to snap.
 * The observer is what keeps it honest across the 1024px breakpoint (the card
 * goes 220x300 -> 300x400 and the one-liner re-wraps), a late webfont, and any
 * edit to the copy in `content/projects.ts`.
 *
 * ═══ THE CONTENT IS PINNED TO THE BOTTOM, NOT THE TOP ═══
 *
 * `justify-end` on the collapsing box. The card is `justify-between`, so this
 * box's BOTTOM edge sits on the card's bottom padding and never moves; anchoring
 * the content to that edge means the one-liner and `Details` **do not travel at
 * all** during the expand, they are only revealed. Anchored to the top — the
 * ordinary flow default — the content would start a full content-height below
 * its final position and ride up into place, which is the same downward motion
 * the `"auto"` bug produced, just intentional. Measured: `Details`' bottom edge
 * holds to within a pixel across the whole animation.
 *
 * ═══ ALWAYS MOUNTED, NEVER `AnimatePresence` ═══
 *
 * It has to be in the DOM at rest for the observer to have something to measure,
 * so it collapses to `height: 0` rather than unmounting, and `AnimatePresence`
 * is gone from this file entirely. `inert` is what makes a collapsed body
 * inactive — it takes `Details` out of the tab order, out of hit-testing and out
 * of the accessibility tree in one attribute, which is exactly the set of things
 * unmounting used to do for free.
 */
function CardExpandedBody({
  card,
  isActive,
  grow,
}: {
  card: Card;
  isActive: boolean;
  grow: SpringConfig;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setContentHeight(el.offsetHeight);
    measure();
    /* The card's width changes at 1024 and the one-liner re-wraps with it, so a
       height measured once would be wrong on the other side of the breakpoint.
       `ResizeObserver` also covers a webfont arriving late and any edit to the
       copy. */
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      /* `initial={false}` so the collapsed state is the first paint rather than
         an animation from it — five cards must not play a collapse on load. */
      initial={false}
      animate={{
        height: isActive ? contentHeight : 0,
        opacity: isActive ? 1 : 0,
      }}
      transition={grow}
      className="flex flex-col justify-end overflow-hidden text-left"
    >
      <div
        ref={innerRef}
        inert={isActive ? undefined : true}
        className="pt-2xs lg:pt-sm"
      >
        {/* `text-caption font-mono` — the site's smallest step, paired with
            JetBrains Mono as `globals.css` mandates. A register compromise,
            recorded as one: caption is specified for "labels / stats / tags",
            not sentences, but `text-body` renders the longest one-liner at 154px
            in a 204px measure and the site has no step between 12 and 16. The
            ink is inherited `text-fg` from the card. */}
        <p className="text-caption font-mono">{card.oneLiner}</p>
        {/* THE ONE ACTION, AND A VALID ONE — a real `<a>` with no `<button>`
            above it in the tree, which is what the card being a
            `<div role="button">` buys. GitHub and Live Site are on the detail
            page, deliberately: Phase 2's ruling. `stopPropagation` keeps a click
            on the link from also reaching the card and toggling it shut on the
            way out. */}
        <Link
          href={`/projects/${card.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-2xs inline-flex items-center gap-xs text-caption font-mono uppercase underline-offset-4 hover:underline lg:mt-sm"
        >
          {DECK_DETAILS_LABEL}
          <DetailsArrowIcon />
        </Link>
      </div>
    </motion.div>
  );
}

export const Cards = ({
  projects,
}: {
  projects: readonly DeckCardProject[];
}) => {
  const [active, setActive] = useState<Card | null>(null);
  const [spacing, setSpacing] = useState(CARD_SPACING);
  /* Phase 1b. Additive - it reads the SAME query the vendor already watches for
     `spacing` and changes nothing about it. Seeded `true` to match `spacing`'s
     own lg-first default; it cannot flash, because the height it selects is
     only reachable once a card is active, and the effect below has long since
     run by then. */
  const [isLg, setIsLg] = useState(true);

  const ref = useRef<HTMLDivElement>(null);
  /** Every card's node, by slug, so focus can be handed back to whichever one
      was open. A single ref written from a `ref` callback guarded on `isActive`
      looked equivalent and is not: React invokes an inline `ref` with `null`
      and then with the node on EVERY render, so the guard skips both calls for
      the card that has just been deactivated. A map holds every node
      unconditionally and does not depend on that. */
  const cardRefs = useRef(new Map<string, HTMLDivElement | null>());
  /** Remembered one render behind `active` — by the time the closing effect
      runs, `active` is already null. */
  const lastActiveSlug = useRef<string | null>(null);
  /** Set by `close()`, cleared by the effect. FOCUS MUST MOVE AFTER THE STATE
      CHANGE COMMITS: calling `.focus()` inside the `setActive` updater runs it
      during render, React then re-renders, and focus falls to `<body>`. Caught
      by CDP, not by reading the code, which looked correct. */
  const restoreFocus = useRef(false);

  const cardSpring = SPRING;

  const close = useCallback(() => {
    setActive((current) => {
      if (!current) return null;
      /* Only take focus back if it is currently somewhere inside the deck —
         otherwise a click on unrelated page background would yank the caret
         out of whatever the visitor was actually using. */
      if (
        ref.current &&
        document.activeElement &&
        ref.current.contains(document.activeElement)
      ) {
        restoreFocus.current = true;
      }
      return null;
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close]);

  /* ESCAPE — the third exit, alongside a click outside and a click on the open
     card itself. Bound only while a card is open, so this component adds no
     document-level key listener to a page that is merely showing a fan. */
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, close]);

  useEffect(() => {
    if (active) {
      lastActiveSlug.current = active.slug;
      return;
    }
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    const slug = lastActiveSlug.current;
    if (slug) cardRefs.current.get(slug)?.focus({ preventScroll: true });
  }, [active]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setSpacing(mq.matches ? CARD_SPACING : Math.round(CARD_SPACING * 0.39));
      setIsLg(mq.matches);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* THE HARD CAP, salvaged from the retired `ProjectDeck.tsx`. The fan has five
     hand-tuned positions; a sixth project has nowhere to go. Throwing during
     render fails `next build` LOUDLY on this statically-prerendered route,
     which is the whole point - the silent alternative is a deck that quietly
     stops rendering the last project and looks fine in every screenshot.
     FEWER than five is fine: `middle` below re-centres the fan. */
  if (projects.length > FAN_PRESENTATION.length) {
    throw new Error(
      `FannedDeck: ${projects.length} projects but only ${FAN_PRESENTATION.length} fan positions. ` +
        "Add a position to FAN_PRESENTATION in components/sections/FannedDeckPhase1.tsx, " +
        "or reduce what /work passes.",
    );
  }

  const cards: Card[] = projects.map((project, index) => ({
    ...project,
    ...FAN_PRESENTATION[index],
  }));

  const middle = (cards.length - 1) / 2;

  const isAnyCardActive = () => {
    return active?.slug;
  };

  const isCurrentActive = (card: Card) => {
    return active?.slug === card.slug;
  };

  return (
    /* PHASE 1b - the only edited element of the vendor's own two wrappers.
       `h-full` (which resolved to `auto` against a block parent, i.e. to the
       inner wrapper's 480) is gone, replaced by a REAL, IN-FLOW block height on
       the cards' own spring, with a 480 floor; `items-center` is `items-start`
       so the inner never moves. `height` and not a transform, deliberately: the
       point is that the document below actually moves. */
    <motion.div
      animate={{
        height: active
          ? isLg
            ? DECK_H_ACTIVE_LG
            : DECK_H_ACTIVE
          : DECK_H_REST,
      }}
      transition={BOX_GROW}
      /* `min-h-[570px]` IS `DECK_H_REST` AND MUST TRACK IT. It is the height
         before hydration, when `animate` has not yet written an inline height;
         a stale floor would paint a clipped fan for a frame and then jump.
         The fan's offset is `FAN_OFFSET_Y`, applied as an inline style rather
         than a `pt-[64px]` utility so the constant is the only place the number
         lives — Tailwind cannot see a computed class name. */
      style={{ paddingTop: FAN_OFFSET_Y }}
      className="relative flex min-h-[570px] w-full items-start justify-center overflow-hidden"
    >
      <motion.div
        ref={ref}
        onClick={close}
        className="relative mx-auto flex h-120 w-full max-w-5xl items-center justify-center [--height:300px] [--width:220px] lg:[--height:400px] lg:[--width:300px]"
      >
        {cards.map((card, index) => {
          const offsetX = (index - middle) * spacing;
          const isActive = isCurrentActive(card);
          const anyActive = Boolean(isAnyCardActive());
          return (
            <motion.div key={card.slug}>
              {/* ═══ A `<div role="button">`, NOT A `<button>` ═══
                  AND THE CHANGE IS ENTIRELY ABOUT WHAT MAY LIVE INSIDE IT.
                  `Details` is a real `<a href>` and it renders INSIDE the
                  expanded card, which is the interaction the reference has and
                  the one Saad asked for. `<a>` inside `<button>` is invalid
                  HTML; `<a>` inside a `<div role="button">` is not. Nothing
                  else about the element changed — same click target, same
                  cursor, same accessible name, and `onKeyDown` restores by hand
                  the two keys a real `<button>` gives for free.

                  **THE PANEL-SPLIT VERSION IS THE ALTERNATIVE THAT WAS TRIED
                  AND REJECTED**, and it is preserved on branch
                  `deck-panel-split-backup` / tag `deck-panel-split`. It moved
                  the content out of the card into a sibling region, which is
                  the textbook fix and which cost the three things that ARE the
                  interaction: growth in place, the other four staying visible,
                  and one-click switching. Do not re-derive it.

                  **THE KNOWN RESIDUAL, STATED RATHER THAN HIDDEN:** ARIA says a
                  `role="button"` should not contain focusable descendants, so
                  some assistive tech may not surface the inner `Details` link
                  when traversing the card as a widget. It is still reachable by
                  Tab, the card is still one activatable control, and the HTML
                  is now valid — which is the trade Saad chose over losing the
                  interaction. The clean answer to BOTH is the reference's own
                  structure with `Details` promoted out of the card's hit area
                  entirely, and that is a design change, not a fix. */}
              <motion.div
                ref={(node) => {
                  cardRefs.current.set(card.slug, node);
                }}
                role="button"
                /* THE TABBABILITY GATE. An inactive card thrown to the back of
                   the deck is still a real, visible, clickable target — that is
                   what one-click switching needs — but it should not be the
                   next thing Tab lands on while a card is open. `-1` keeps it
                   clickable and programmatically focusable while taking it out
                   of the tab order; `0` comes back the moment nothing is open.
                   NOT `inert` and NOT `pointer-events-none`: both would kill
                   the click, and the click is the feature. */
                tabIndex={anyActive && !isActive ? -1 : 0}
                aria-expanded={isActive}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isActive) close();
                  else setActive(card);
                }}
                /* The two keys `<button>` would have handled. `e.target !==
                   e.currentTarget` is what stops Enter on the inner `Details`
                   link from bubbling up and toggling the card shut on its way
                   out; `preventDefault` on Space stops the page scrolling. */
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  e.stopPropagation();
                  if (isActive) close();
                  else setActive(card);
                }}
                initial={{
                  x: 0,
                  scale: 0,
                }}
                animate={{
                  y: isActive ? 0 : anyActive ? 400 : card.config.y,
                  x: isActive ? 0 : anyActive ? offsetX * 0.4 : offsetX,
                  rotate: isActive
                    ? 0
                    : anyActive
                      ? 0.2 * card.config.rotate
                      : card.config.rotate,
                  scale: isActive ? ACTIVE_SCALE : anyActive ? 0.7 : 1,
                }}
                whileHover={{
                  scale: isActive ? ACTIVE_SCALE : anyActive ? 0.7 : 1.05,
                }}
                /* Per-channel override: `scale` needs a far tighter rest
                   threshold than px values do — see `SCALE_REST_DELTA`. x, y
                   and rotate keep the default, where 0.01 is 0.01px / 0.01deg
                   and already invisible. */
                transition={{
                  ...cardSpring,
                  scale: { ...cardSpring, restDelta: SCALE_REST_DELTA },
                }}
                style={{
                  width: `var(--width)`,
                  height: `var(--height)`,
                  marginLeft: `calc(var(--width) / -2)`,
                  marginTop: `calc(var(--height) / -2)`,
                  zIndex: isActive ? 50 : card.config.zIndex,
                  /* ═══ `will-change: transform` IS A MEASURED FIX, NOT A
                     SUPERSTITION ═══
                     Motion drives these transforms by writing inline style on
                     every frame. That is NOT a CSS animation, so Chrome does
                     not promote the element for it, and each frame the card —
                     screenshot and all — was re-rastered on the main thread.
                     Profiled on the production build, CPU throttled 6x, across
                     one expand/collapse cycle:

                       RasterTask   1824 calls, 232.0ms   ->   627 calls, 45.9ms

                     an 80% cut. Paint for the four DROPPED cards fell to
                     2.7-4.8ms each, from being part of the root document's
                     repaint. The cost is five permanent compositor layers,
                     which on this page is the only heavy thing on screen.
                     CHECKED FOR THE OBVIOUS REGRESSION: a promoted layer
                     scaled to `ACTIVE_SCALE` can render blurry until it is
                     re-rastered. Captured the settled active card's title at
                     7x — the type is crisp. */
                  willChange: "transform",
                }}
                /* `justify-between` — THE COVER IS PINNED TO THE TOP AND THE
                   TEXT BLOCK TO THE BOTTOM, and that is the whole mechanism
                   behind "the name sits at the bottom and then transforms with
                   the content". Because the text block is bottom-anchored, the
                   description growing inside it pushes the TITLE UPWARD; the
                   card's bottom edge never moves and neither does the cover.

                   **PHASE 3 REJECTED `justify-between` AND THAT RULING IS NOW
                   REVERSED.** It was rejected because "the title travels upward
                   by the description's full height on every expand" — which is
                   true, and is now the requested behaviour rather than a
                   defect. What made Phase 2's version a BUG was different and
                   is still fixed: the cover was `flex-1`, so it re-solved
                   against the text block every frame and the image itself
                   scaled. The cover is fixed-aspect and `shrink-0`, so the only
                   thing that moves is the title, deliberately, on the card's
                   own spring.

                   `p-xs lg:p-sm` IS THE MARGIN AROUND THE PHOTO. The cover was
                   full-bleed to three edges until now; Saad asked for a margin
                   all the way around it, so the padding is back on the card and
                   the cover is inset on all four sides. NO BORDER — see
                   `FAN_PRESENTATION`. */
                className={cn(
                  "absolute top-1/2 left-1/2 flex cursor-pointer flex-col justify-between overflow-hidden rounded-deck p-xs text-fg outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-working lg:p-sm",
                  card.surface,
                )}
              >
                {/* ═══ THE COVER — INSET, WITH ITS OWN CORNERS ═══
                    It sits inside the card's `p-xs lg:p-sm`, so there is a
                    margin on all four sides, and it carries `rounded-deck`
                    itself because it no longer reaches the card's own corners
                    to be clipped by them. **This is the third revision of this
                    box and each one was Saad's call on sight:** framed and
                    inset (Phase 3, read as "chopped"), full-bleed to three
                    edges (the revision, no margin at all), and now inset again
                    but with no `border-fg/25` hairline and a radius of its own.
                    The hairline is what made the first version read as a frame
                    inside a frame; the margin is what the full-bleed version
                    lost.

                    ONE FIXED ASPECT PER BREAKPOINT, so the five share one
                    silhouette, and `object-contain` inside it so no screenshot
                    is ever cropped. The box declares no background, so the
                    letterbox bars are literally `bg-deck-N` and cannot drift
                    from the card.

                    **THE TWO RATIOS ARE A HEIGHT BUDGET, NOT A LOOK.** With the
                    text block bottom-anchored, the cover gets whatever the
                    EXPANDED text block does not need — and what it needs is set
                    by ONE card, CCN, whose one-liner is the longest of the five.
                    Measured on the production build, expanded, worst of five:

                      lg      cover 154 + text 205 = 359 of 374   headroom 15
                      900     cover  82 + text 198 = 280 of 284   headroom  4

                    `16/9` and `5/2` are the ratios those two budgets allow, not
                    a look. **`7/3` (87px) WAS TRIED BELOW `lg` AND MEASURED
                    -1px OF HEADROOM ON CCN** — it fit only by eating a pixel of
                    the card's own bottom padding, and one more word in that
                    one-liner would have started clipping `Details` against the
                    card's `overflow-hidden`, which is a defect this component
                    has shipped once already.

                    **4px IS NOT COMFORTABLE AND IT IS THE HONEST NUMBER.** The
                    220x300 card cannot hold a 118px one-liner with room to
                    spare; that is the small card's real constraint and it
                    belongs to the mobile treatment that does not exist yet.
                    LENGTHENING ANY ONE-LINER IN `content/projects.ts` REQUIRES
                    RE-MEASURING THIS. */}
                <div className="relative aspect-[5/2] w-full shrink-0 overflow-hidden rounded-deck lg:aspect-[16/9]">
                  <Image
                    src={card.coverImage.src}
                    alt={card.coverImage.alt}
                    fill
                    sizes="(min-width: 1024px) 315px, 235px"
                    placeholder="blur"
                    quality={85}
                    className="object-contain"
                    /* `next/image` reads `objectFit` from the prop or from
                       `style`, never from `className`; with both absent the
                       blur placeholder falls through to `background-size:
                       cover` and the plate crops while the loaded image
                       letterboxes. `ProjectStripRow.tsx` has the diagnosis. */
                    style={{ objectFit: "contain" }}
                  />
                </div>

                {/* ═══ THE TEXT BLOCK — BOTTOM-ANCHORED ═══
                    `shrink-0` and no `flex-1`: it is exactly as tall as its
                    contents and `justify-between` on the card pins it to the
                    bottom edge. The space between it and the cover is whatever
                    is left over, which at rest is the largest it ever gets and
                    is the gap the composition is built around rather than dead
                    space under the last line. */}
                <div className="w-full shrink-0">
                  {/* ═══ THE TITLE ═══
                      **NO `min-h` RESERVATION ANY MORE.** It had one until now,
                      sized to three lines, to keep the description starting at
                      the same height on all five cards — and it left ~50px of
                      empty card under one-line titles, which was on the flagged
                      list. Bottom-anchoring makes it unnecessary AND gives a
                      better constant: `Details` is now always the same distance
                      off the card's bottom edge, on every card, in both states.
                      The title's own height varies with its line count and that
                      is what lets it sit ON the bottom at rest.

                      Nor is a reservation needed to keep the cover off the
                      title: the cover is a fixed-aspect box with `shrink-0`, so
                      it cannot grow into anything.

                      `lg:max-w-[167px]` IS THE FIX FOR THE CLIPPED TITLES.
                      `CARD_SPACING` is 180, so every card but the last shows a
                      180px strip before the next one paints over it — 167px of
                      measure after the 13px `lg:p-sm`. **Re-verified after the
                      title moved to the bottom of the card**: the covering
                      card's left edge is a SLANTED line, because the fan tilts
                      and vertically offsets every card, so clearance is a
                      function of y and moving the title changes it. Measured on
                      the painted line boxes at the new position, all five are
                      clear.

                      Below `lg` the cap is absent — the strip there is 70px,
                      which cannot hold a word — and the title is `text-body`
                      (16px) rather than 21px, because on the 220x300 card a
                      three-line title at 21px costs 20.6px the height budget
                      does not have. */}
                  <h2 className="text-left text-body lg:max-w-[167px] lg:text-deck-title">
                    {card.title}
                  </h2>

                  {/* ═══ THE CONTENT THAT PUSHES THE TITLE UP ═══
                      Its height animates 0 -> a MEASURED pixel value on the
                      card's own spring, and because the text block is
                      bottom-anchored that growth lifts the title. One motion,
                      not two. `CardExpandedBody`'s docblock carries the trace of
                      what `height: "auto"` did here instead, and why the number
                      is measured rather than named. */}
                  <CardExpandedBody
                    card={card}
                    isActive={isActive}
                    grow={BODY_GROW}
                  />
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default Cards;
