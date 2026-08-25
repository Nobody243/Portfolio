"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   PHASE 3 — THE RESTYLE. THE DESIGN-SYSTEM SUSPENSION IS OVER.
   ═══════════════════════════════════════════════════════════════════════════

   Phase 1 reproduced Aceternity's `interface-crafts-cards` unmodified with the
   vendor's placeholder deck, so a human could answer "does the mechanism work
   in this app at all" in a real browser. Phase 2 swapped in the five real
   projects and trimmed the card to cover + title at rest, plus one line and one
   `Details` action when expanded. **Phase 3 retires the vendor's palette, its
   radius, its spacing and its type, and fixes the four defects Phase 2 measured
   and left open.** Every item on Phase 2's "STILL SUSPENDED" list is closed
   except the ones under "STILL OPEN AFTER PHASE 3" at the end of this header,
   which are accessibility work and were not in this phase's brief.

   **NOT CHANGED, AND NOT TO BE CHANGED** — confirmed by Saad in a real browser
   and by live CDP measurement across Phases 1, 1b and 2: the fan rest
   transforms, the tilts, the z-order, the click behaviour, the 400px drop of
   the inactive cards, the scales (`ACTIVE_SCALE` is still 1.15), the rotations,
   the spring, the JS-driven 1024px spacing breakpoint, the animated outer
   height, the `min-h-120` floor, the three `DECK_H_*` constants and the hard
   cap.

   ───────────────────────────────────────────────────────────────────────────
   1. THE PALETTE — FIVE SURFACES FROM A TWO-ACCENT SYSTEM
   ───────────────────────────────────────────────────────────────────────────

   `bg-orange-500 / bg-stone-200 / bg-blue-500 / bg-purple-500 / bg-neutral-900`
   are gone. So are `[&_h2]:text-white`, `[&_p]:text-black` and
   `[&_a]:text-black` — Tailwind's `--color-white` / `--color-black` are not
   this site's tokens and do not flip with the theme.

   The five cards now take `bg-deck-1` … `bg-deck-5`, **a five-step neutral
   elevation ramp mapped onto the fan's own z-order** — card 1 sits at the
   bottom of the stack and takes the step closest to the page, card 5 sits on
   top and takes the step furthest from it. The ramp climbs lighter in dark and
   darker in light, which is the direction `--color-elevated` already climbs in
   each theme. `app/globals.css` carries the whole decision: the ΔL* per step,
   the per-step contrast against `--color-fg`, the naming guard, and the four
   alternatives that were rejected — including the inverted near-white deck,
   which is the most literal reading of Saad's stated exploration direction and
   is a ten-value change if he wants to see it.

   **ONE INK, `text-fg`, ON ALL FIVE CARDS AND ALL THREE TEXT ELEMENTS.** Not a
   per-card ink, and not the working accent. The ramp's far end is capped
   precisely so `--color-fg` clears AA comfortably on every step in both themes;
   `--color-accent-working` in light (#0f766e) is 4.25:1 on `deck-4` and 3.96:1
   on `deck-5`, so teal appears on a card ONLY as the `border-accent-working/30`
   hairline, which is a boundary rather than text. If teal text is ever wanted
   here, the ramp gets shallower first. Measured live on all five cards in both
   themes, the ink never drops below **11.79:1**.

   **THE TWO BORDERS ARE THE SITE'S TWO BORDER FAMILIES, USED FOR EXACTLY WHAT
   `app/globals.css` SAYS THEY ARE FOR.** The CARD is an interactive surface
   whose whole area is a control, so it takes `border-accent-working/30` — the
   same value and the same argument as `ProjectCard`. The COVER is a
   non-interactive image frame, so it takes `border-fg/25` — the same value and
   the same argument as the detail page's screenshots. Keeping the image frame
   neutral is what lets teal keep meaning "activate this".

   **NO RADIUS, NO SHADOW.** `rounded-2xl` and `rounded-xl` are gone and nothing
   replaced them. `--radius-photo` is the site's only radius and it names one
   consumer, a photograph, which this is not. The brutal offset shadow that
   `/about`'s controls and this section's own "Browse as a list" button carry is
   deliberately NOT applied here: `projectButtonStyles.ts` records the split —
   the treatment is for CONTROLS, never for content surfaces — and five
   overlapping tilted slabs each casting five shadow layers is the largest
   possible version of the thing that split exists to prevent.

   ───────────────────────────────────────────────────────────────────────────
   2. THE TYPE — AND WHY THE TITLE IS `text-body`
   ───────────────────────────────────────────────────────────────────────────

   **`text-base` IS A COLOUR UTILITY ON THIS SITE AND IT IS NOW GONE FROM THIS
   FILE ENTIRELY.** `app/globals.css` defines `--color-base` and no
   `--text-base`, so Tailwind resolves the name against the colour namespace and
   emits `.text-base{color:var(--color-base)}` — no font-size, no line-height.
   Phase 2 removed the `<p>`'s copy and left the `<h2>`'s, because on
   `bg-stone-200` removing it only swapped which theme broke: measured live, the
   title computed `rgb(253,252,250)` in LIGHT (invisible on stone) and
   `rgb(10,10,11)` in dark (legible by luck). With the vendor palette gone there
   is nothing left to swap — the whole component is on the site's scale and the
   ink is one token.

   `text-sm` and `md:text-3xl` are gone too. They worked only because Tailwind's
   default type scale survives alongside this site's; the site defines exactly
   `--text-caption`, `--text-body`, `--text-h4`, `--text-h3`, `--text-h2` and
   `--text-h1`, and nothing else.

     title       `text-body`     16px / 1.6, Space Grotesk (inherited)
     one-liner   `text-caption`  12px / 1.4 / 0.08em + `font-mono`
     Details     `text-caption`  + `font-mono uppercase`

   **THE TITLE IS `text-body` AND NOT `text-h4`, AND THAT IS FORCED BY
   MEASUREMENT RATHER THAN CHOSEN.** Design call 5 requires the title to have
   its own guaranteed, non-overlapping space sized to fit the longest of the
   five, wrapping to two lines where needed. Measured in a real browser at the
   card's real content widths, rendering all five titles:

     measure          188   204   268   284
     text-body         26    26    26    26   (one line, three of five)
       ...CCN          51    51    51    51   (two lines — the worst case)
       ...SNA          51    51    26    26
     text-h4 @1440    125    94    94    62   (CCN: 4 / 3 / 3 / 2 lines)
     text-h4 @900      84    84    56    56   (CCN: 3 / 3 / 2 / 2 lines)

   `text-body` is the ONLY step on this site's scale that holds "Multi-Floor
   Call Center Network Design" to two lines at every width the card is ever
   rendered at. `text-h4` needs three lines at 268 and four at 188, and a
   three-line reservation costs 42px out of a 372px content box on the card with
   the least room to give. The cost is stated plainly: the card's heading is the
   same size as body text elsewhere on the site. On a 300px card that reads as
   proportionate; it is still a deviation from "headings use the `text-h*`
   steps" and it is here because the alternative clips content.

   **THE RESERVATION IS `min-h-xl` (55px), A REAL SPACING TOKEN, NOT A MAGIC
   NUMBER.** Two lines of `text-body` measure 51.2px; `--spacing-xl` is the
   smallest Fibonacci step that covers it. `min-h-[2lh]` was the more expressive
   spelling and was rejected: the `lh` unit needs Safari 16.4+, and a silently
   absent reservation on an older browser is exactly the class of failure this
   component has already shipped once.

   **THE ONE-LINER IS `text-caption` WITH `font-mono`, WHICH IS A REGISTER
   COMPROMISE AND IS RECORDED AS ONE.** `globals.css` pairs caption with
   JetBrains Mono and describes it as the size for "labels / stats / tags", not
   for sentences. But `text-body` renders the longest one-liner at 154px in a
   204px measure — 55% of the entire content box on the small card — and the
   site has no step between 12 and 16. Measured, all five, mono at
   12/1.4/0.08em: 118px worst case at 204, 84px at 268 and 284. That fits;
   `text-body` does not. The remaining alternative is shorter copy, which is
   content, which is Saad's alone.

   ───────────────────────────────────────────────────────────────────────────
   3. THE SPACING
   ───────────────────────────────────────────────────────────────────────────

   `p-2 md:p-4`, `mt-5`, `mt-3`, `max-h-50` and `gap-2` are gone. The card is
   `p-xs lg:p-sm` (8 / 13) and every internal gap is `mt-xs lg:mt-sm` or
   `mt-2xs lg:mt-sm` off the Fibonacci scale.

   **`h-120` AND `min-h-120` SURVIVE AS THE TWO EXCEPTIONS AND THEY ARE
   DELIBERATE.** Both are 480px — the vendor's resting box and the inner
   positioning wrapper's fixed height — and both are in the do-not-touch list
   because the entire Phase 1b extent arithmetic is derived from them. There is
   no 480 on the Fibonacci scale, and inventing one to launder a locked constant
   would be worse than the inconsistency. `max-w-5xl` on the inner wrapper is
   the vendor's container and is untouched for the same reason.

   ───────────────────────────────────────────────────────────────────────────
   4. THE COVER — FIXED ASPECT, AND WHY THAT IS THE FIX FOR THE TRANSITION BUG
   ───────────────────────────────────────────────────────────────────────────

   Phase 2's cover was `flex-1 max-h-50`: it took the leftover space, so its
   height was a function of the text block's height. **Saad reported image and
   content misplacement mid-animation on all five cards, and this was the prime
   suspect. It was confirmed by sampling geometry every 50ms across a real
   expand rather than at its endpoints, which is why the static rest/expanded
   checks had reported clean.** FOLIO, at 1440, `offsetHeight` of the cover and
   `offsetTop` of the title through one expand:

     t (ms)      51   102   152   251   303   352   403   452   502   552   802
     cover h    200   200   195   151   137   128   123   119   118   117   120
     title top  262   244   231   187   173   164   159   155   154   153   156

   The description's height is animated on the spring, the cover's flex basis
   re-solves against it every frame, so **the cover collapsed 200 → 117 and the
   title travelled 109px, both overshooting and settling back** — the spring's
   2.84% overshoot arriving as a visible bounce in the size of the screenshot.
   Both endpoints (200 at rest, ~120 expanded) were individually correct, which
   is exactly why endpoint measurement missed it.

   A second, much smaller contributor was measured at the same time and is NOT
   the bug: the `<h2>`'s `layoutId` gives it a layout projection, computed
   `transform: matrix(1,0,0,1,0,9.48)` at t=51 decaying to `none` by t=603. Nine
   pixels of easing on an element that was genuinely moving 109px. With the
   layout fix below the h2 no longer moves at all, so the projection is a no-op.

   **THE FIX: the cover is a fixed-aspect box and the card is `justify-start`.**
   Nothing above the description has a size that depends on the description, so
   nothing above the description moves during either leg of the transition. The
   description grows into space that was already reserved and already empty.

     below lg   `aspect-[16/5]`    202px wide ->  63.1px tall
     lg and up  `lg:aspect-[5/3]`  272px wide -> 163.2px tall

   `justify-between` was rejected: with a fixed cover it pins the text block to
   the card's bottom edge, so the title travels upward by the description's full
   height on every expand. That is a cleaner motion than the flex chase — a
   rigid block translating rather than a box re-solving — but it is still the
   title moving 100px+, and the invariant asked for is that content stays
   correctly positioned THROUGHOUT, not that it moves smoothly.

   **THE DECLARED COST: at rest the lg card has ~150px of empty surface below
   the title**, which is the space the description occupies when open. That is
   visible on the ~180px of each card the fan leaves exposed. It is the price of
   a layout that does not move, it is a composition question rather than a
   correctness one, and it is Saad's to judge on sight.

   ───────────────────────────────────────────────────────────────────────────
   5. LETTERBOXING — ONE SILHOUETTE, NO CROP
   ───────────────────────────────────────────────────────────────────────────

   `content/projects.ts` carries an explicit "DO NOT CROP, and do not swap in a
   simplified diagram" on the CCN cover with no scale qualifier, and Saad
   confirmed it stays authoritative for all five. So the image is still
   `object-contain` and no screenshot is ever cropped — the five covers run
   1.967 to 2.671 in native aspect and none of them is trimmed to fit.

   What Phase 2 gave up, and this phase gets back, is the SILHOUETTE: its cover
   box was `flex-1`, so the box itself was a different height on every card and
   the five agreed on no edge at all. The box is now one fixed aspect ratio
   shared by all five, the screenshot letterboxes inside it at its true
   proportions, **and the letterbox fill is the card's own surface** — the box
   declares no background, so what shows through the bars is literally
   `bg-deck-N` and cannot drift from it.

   A fill that matches the card exactly is invisible, which would leave the
   shared silhouette invisible too, so the box carries the site's neutral image
   frame — `border-fg/25`, the same hairline the detail-page covers use. That is
   what makes "all five share one outer silhouette" something you can see.
   Below lg the box is wider than every screenshot's aspect, so the bars fall
   left and right; at lg it is narrower, so they fall top and bottom.

   `style={{ objectFit: "contain" }}` AND NOT ONLY THE CLASS. `next/image` reads
   `objectFit` from the prop or from `style`, never from `className`; with both
   absent the blur placeholder falls through to `background-size: cover` and the
   plate crops while the loaded image letterboxes, producing a visible pop on
   load. `ProjectStripRow.tsx` carries the full diagnosis.

   `sizes` DECLARES THE SCALED WIDTHS: the active card is painted at
   `ACTIVE_SCALE` 1.15, so the two content-box widths (202 / 272) become 233 and
   313 device-independent pixels. `quality={85}` uniformly, never per image —
   `ProjectCard`'s stated rule for the same five sources, all UI screenshots
   where sharp text on flat fields is the worst case for lossy encoding. No
   `priority`: five covers competing for the connection is worse than five
   arriving a beat late, and on this route they are behind the Intro plate for
   ~2.7s regardless.

   ───────────────────────────────────────────────────────────────────────────
   6. THE 768–1023 BAND — THE BUG THAT WAS DISMISSED AS COSMETIC
   ───────────────────────────────────────────────────────────────────────────

   Phase 2 flagged this band as "pre-existing vendor behaviour" and did not fix
   it. **Measured at a 900px viewport, CCN's `Details` link sat 51px OUTSIDE the
   card and was clipped away entirely by the card's own `overflow-hidden`.**
   Details is the last element in the content column, so an overflowing column
   costs the card its only action first. Inheriting a defect is still shipping
   it: the vendor's short placeholders never overflowed there and ours did.

   **THE BAND NO LONGER EXISTS. There is not one `md:` utility left inside the
   card.** The vendor raised the title to `text-3xl` at 768 while raising the
   CARD to 300x400 only at 1024, which is what created a band where a 220px card
   was asked to hold 30px headings. The title is now one size at every width and
   the padding steps at `lg` alongside the card's own size, so 768–1023 is
   byte-identical to base and the only breakpoint inside this component is the
   same 1024 the fan's spacing already uses.

   THE BUDGET, which is what every number above is in service of. Content box =
   card, minus the 1px border, minus the padding:

     below lg   202 x 282          lg and up   272 x 372

       cover         63.1            cover        163.2
       + mt-xs        8.0            + mt-sm       13.0
       + title       55.0            + title       55.0   (`min-h-xl`, 2 lines)
       + mt-2xs       5.0            + mt-sm       13.0
       + one-liner  118.0            + one-liner   84.0   (worst of five)
       + mt-2xs       5.0            + mt-sm       13.0
       + Details     17.0            + Details     17.0
                   ───────                       ───────
                     271.1                         358.2
       slack          10.9            slack         13.8

   ───────────────────────────────────────────────────────────────────────────
   STILL OPEN AFTER PHASE 3 — none of it was in this phase's brief
   ───────────────────────────────────────────────────────────────────────────

     - **AN `<a>` NESTED INSIDE A `<button>`.** Invalid HTML, unavoidable inside
       the vendor's expand-the-card-itself structure, verified working by a real
       click. The fix is structural: card = `<button>`, expanded panel = a
       separate `role="group"` region OUTSIDE the button, which the retired
       `ProjectDeck.tsx` already demonstrates. Making the card a `<div>` instead
       is not an alternative — it trades a validity error for the loss of the
       whole deck's keyboard access.
     - No `prefers-reduced-motion` branch, no Escape handler, no focus
       management, no `focus-visible` ring on the card, and inactive cards that
       stay tabbable after being thrown 400px down.
     - No `Details` anchors in the prerendered HTML: they exist only while a card
       is active, so the deck still offers no links with JS off.
     - The file is still named `FannedDeckPhase1.tsx`. Renaming it touches
       `ProjectDeckSection.tsx` and is not worth a drive-by change.
   ═══════════════════════════════════════════════════════════════════════════ */

import Image from "next/image";
import Link from "next/link";

import { DECK_DETAILS_LABEL } from "@/components/sections/projectDeckContent";
import type { Project } from "@/content/types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";

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
  className: string;
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
const ACTIVE_SCALE = 1.15;
const CARD_SPACING = 180;

/**
 * THE FAN, POSITION BY POSITION — the vendor's five `config` blocks, unchanged,
 * zipped against `content/projects.ts` by index. **The five palette strings are
 * NOT the vendor's any more**; see §1 of this file's header.
 *
 * IT LIVES HERE AND NOT IN `content/`. `content/types.ts`'s hard rules forbid
 * colour and class strings in the data layer outright, and a rotation in
 * degrees is presentation by the same argument. A project's position in the fan
 * is a property of the fan, not of the project.
 *
 * **THE RAMP IS ORDERED, NOT ASSORTED, AND THE ORDER IS `zIndex`'s.** `deck-1`
 * … `deck-5` step monotonically away from the page background, and the card
 * carrying step *n* is the card at stacking position *n*. That is the whole
 * reason the ramp is legible as depth rather than as five arbitrary greys, so
 * **do not re-shuffle these five class strings** — reordering them decouples
 * the lightness from the stacking and the deck goes back to looking like five
 * cards that happen to differ. `app/globals.css` states the same rule at the
 * token.
 *
 * `border-accent-working/30` IS ON EVERY CARD AND IS THE SITE'S OWN RULE for a
 * surface whose entire area is a control — the value and the argument are
 * `ProjectCard`'s. The cover inside takes the OTHER family, `border-fg/25`,
 * because an image frame is not an affordance.
 *
 * NO PER-CARD INK. The vendor needed `[&_h2]:text-white` / `[&_p]:text-black`
 * because its surfaces ran from `orange-500` to `stone-200`; every step of this
 * ramp holds `--color-fg` above 11:1 in both themes, so the ink is set once, on
 * the elements, and there is not one arbitrary-variant colour override left in
 * the file.
 */
const FAN_PRESENTATION = [
  {
    className: "bg-deck-1 border-accent-working/30",
    config: { y: -20, x: 0, rotate: -15, zIndex: 2 },
  },
  {
    className: "bg-deck-2 border-accent-working/30",
    config: { y: 20, x: 180, rotate: 8, zIndex: 3 },
  },
  {
    className: "bg-deck-3 border-accent-working/30",
    config: { y: -80, x: 360, rotate: -5, zIndex: 4 },
  },
  {
    className: "bg-deck-4 border-accent-working/30",
    config: { y: 20, x: 540, rotate: 12, zIndex: 5 },
  },
  {
    className: "bg-deck-5 border-accent-working/30",
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
     "Browse as a list" doc offset       753.80  -> 1113.80
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

/** `h-120`. The vendor's resting box, and the inner wrapper's fixed height. */
const DECK_H_REST = 480;
/** 759.1 deepest card + 40.9 breathing room. */
const DECK_H_ACTIVE = 800;
/** 794.9 deepest card + 45.1 breathing room. */
const DECK_H_ACTIVE_LG = 840;

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

  const cardSpring = SPRING;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setActive(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      transition={cardSpring}
      className="relative flex min-h-120 w-full items-start justify-center overflow-hidden"
    >
      <motion.div
        ref={ref}
        onClick={() => setActive(null)}
        className="relative mx-auto flex h-120 w-full max-w-5xl items-center justify-center [--height:300px] [--width:220px] lg:[--height:400px] lg:[--width:300px]"
      >
        {cards.map((card, index) => {
          const offsetX = (index - middle) * spacing;
          return (
            <motion.div key={card.slug}>
              <motion.button
                initial={{
                  x: 0,
                  scale: 0,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(card);
                }}
                animate={{
                  y: isCurrentActive(card)
                    ? 0
                    : isAnyCardActive()
                      ? 400
                      : card.config.y,
                  x: isCurrentActive(card)
                    ? 0
                    : isAnyCardActive()
                      ? offsetX * 0.4
                      : offsetX,
                  rotate: isCurrentActive(card)
                    ? 0
                    : isAnyCardActive()
                      ? 0.2 * card.config.rotate
                      : card.config.rotate,
                  scale: isCurrentActive(card)
                    ? ACTIVE_SCALE
                    : isAnyCardActive()
                      ? 0.7
                      : 1,
                }}
                whileHover={{
                  scale: isCurrentActive(card)
                    ? ACTIVE_SCALE
                    : isAnyCardActive()
                      ? 0.7
                      : 1.05,
                }}
                transition={cardSpring}
                style={{
                  width: `var(--width)`,
                  height: `var(--height)`,
                  marginLeft: `calc(var(--width) / -2)`,
                  marginTop: `calc(var(--height) / -2)`,
                  zIndex: isCurrentActive(card) ? 50 : card.config.zIndex,
                }}
                /* `justify-start`, NOT the vendor's `justify-between` - see §4.
                   With a fixed-aspect cover, `justify-between` would pin the
                   text block to the card's bottom edge and make the title
                   travel the description's full height on every expand.
                   `p-xs lg:p-sm` and the square corners are §1 and §3.
                   `border` is 1px; its colour comes from `card.className`. */
                className={cn(
                  "absolute top-1/2 left-1/2 flex cursor-pointer flex-col items-start justify-start overflow-hidden border p-xs text-fg lg:p-sm",
                  card.className,
                )}
              >
                {/* THE COVER. One fixed aspect ratio shared by all five cards,
                    so the deck has a single silhouette; `object-contain` inside
                    it, so no screenshot is ever cropped. The box declares NO
                    background, which is what makes the letterbox bars the
                    card's own `bg-deck-N` by construction rather than by a
                    second value that could drift from it. `border-fg/25` is the
                    site's neutral image frame - it is what makes the shared
                    silhouette visible, since a fill matching the card exactly
                    is by definition invisible. `shrink-0` keeps the aspect
                    ratio from being negotiated away: if the column ever
                    overflows, it must overflow visibly rather than silently
                    compressing the image. */}
                <div className="relative aspect-[16/5] w-full shrink-0 overflow-hidden border border-fg/25 lg:aspect-[5/3]">
                  <Image
                    src={card.coverImage.src}
                    alt={card.coverImage.alt}
                    fill
                    sizes="(min-width: 1024px) 313px, 233px"
                    placeholder="blur"
                    quality={85}
                    className="object-contain"
                    style={{ objectFit: "contain" }}
                  />
                </div>
                {/* `shrink-0` is load-bearing for the same reason it is on the
                    cover. `w-full` makes the wrap width explicit rather than
                    leaving it to `items-start`'s shrink-to-fit clamp, which
                    resolves to the same number. */}
                <div className="mt-xs w-full shrink-0 lg:mt-sm">
                  {/* `min-h-xl` (55px) IS DESIGN CALL 5: the title's own
                      guaranteed, non-overlapping space, sized to the longest of
                      the five wrapping to two lines. Two lines of `text-body`
                      measure 51.2px. Because the reservation is a MINIMUM and
                      the cover above it is a fixed box, no card's cover can
                      reach the title and no title can be clipped by one. */}
                  <motion.h2
                    layoutId={card.slug + "title"}
                    className="min-h-xl text-left text-body"
                  >
                    {card.title}
                  </motion.h2>
                  <AnimatePresence mode="popLayout">
                    {isCurrentActive(card) && (
                      <motion.div
                        layoutId={card.slug + "description"}
                        initial={{ opacity: 0, x: 20, y: 20, height: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0, height: "auto" }}
                        exit={{ opacity: 0, x: 40, y: 40 }}
                        transition={cardSpring}
                        className="mt-2xs w-full overflow-hidden text-left lg:mt-sm"
                      >
                        {/* `text-caption font-mono` - the site's smallest step,
                            paired with JetBrains Mono as `globals.css`
                            mandates. The register compromise is stated in §2.
                            The ink is inherited `text-fg` from the card; there
                            is no per-card colour override anywhere in this
                            file any more. */}
                        <p className="text-caption font-mono">
                          {card.oneLiner}
                        </p>
                        {/* THE ONE ACTION. GitHub and Live Site are on the
                            detail page, deliberately - see Phase 2's record.
                            `uppercase` is the site's control voice: the label
                            is authored in reading case in
                            `projectDeckContent.ts` and transformed in CSS, so
                            the accessible name stays "Details". */}
                        <Link
                          href={`/projects/${card.slug}`}
                          className="mt-2xs inline-flex items-center gap-xs text-caption font-mono uppercase underline-offset-4 hover:underline lg:mt-sm"
                        >
                          {DECK_DETAILS_LABEL}
                          <DetailsArrowIcon />
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default Cards;
