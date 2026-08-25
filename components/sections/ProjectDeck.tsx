"use client";

import { useCallback, useEffect, useId, useRef, useState, type Ref } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "motion/react";

import { ExternalLink } from "@/components/ui/ExternalLink";
import { STANDALONE_NAV } from "@/components/ui/standaloneNav";
import {
  DECK_CLOSE_LABEL,
  DECK_DETAILS_LABEL,
  DECK_GITHUB_LABEL,
  DECK_LIVE_LABEL,
  DECK_PAGER_ITEM_PREFIX,
  DECK_RAIL_LABEL,
} from "@/components/sections/projectDeckContent";
import {
  PROJECT_BUTTON_PRIMARY,
  PROJECT_BUTTON_SECONDARY,
} from "@/components/sections/projectButtonStyles";
import { DURATION, EASE, SPRING } from "@/lib/animation/easing";
import type { Project } from "@/content/types";

/**
 * The fanned project deck — `/work`, Tier 2. It REPLACES the two-column
 * `Projects` grid on that page; `Projects` now renders on Home only.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WHAT THIS IS AND WHERE IT CAME FROM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The interaction is Aceternity's Interface Craft cards
 * (`ui.aceternity.com/labs/interface-crafts-cards`) — a fanned, overlapping
 * deck of tilted cards, one of which scales up into a large readable panel.
 * **We took its INTERACTION and refused its MATERIAL**, on Saad's ruling of
 * 2026-08-25: no rounding, no shadows, no gradients, no per-card colour. See
 * the CHROME block below for the full specification.
 *
 * **THIS IS A PURPOSE-BUILT COMPONENT.** It does not import from — and must
 * never import from — `components/ui/3d-card.tsx`, `comet-card.tsx`,
 * `glare-card.tsx`, `card.tsx`, `wobble-card.tsx`, `card-hover-effect.tsx`,
 * `moving-border.tsx` or `button.tsx`. Those are untracked leftovers of an
 * earlier install, they are Tier 1 gestures, and this is a Tier 2 surface. Saad
 * refused them by name.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * THE ONE MECHANICAL DEPARTURE FROM THE DESIGN BRIEF, AND WHY — read this
 * before "restoring" a `layoutId` on the card or the panel box.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `.claude/handoff/projects-architecture-design.md` §C.7 specifies a shared
 * `layoutId={`deck-card-${slug}`}` on the rest card and the panel, plus a
 * second one on the title. **Neither is built, and both were refused on
 * measurement rather than taste:**
 *
 *   1. **WITHDRAWN 2026-08-25 — IT WAS NOT ACCURATE AND IT IS KEPT HERE RATHER
 *      THAN DELETED, because a reader who remembers it needs to know it was
 *      retracted rather than quietly dropped.** It read: *"It contradicts
 *      §C.7's own exit animation — the clicked card stays MOUNTED for the
 *      length of its exit, holding `deck-card-<slug>` at the same moment the
 *      panel mounts holding it too, and two live holders of one `layoutId` is
 *      undefined behaviour in Motion's projection tree."*
 *
 *      **Motion supports concurrent holders of one `layoutId`.** The
 *      latest-mounted element leads and the previous one follows, and that is
 *      not an edge case here — it is the documented mechanism this site's own
 *      card → overlay morph runs on. `project-cover-<slug>` is held by TWO
 *      elements for the whole length of every overlay open (see below). So the
 *      briefed `deck-card-<slug>` would not have been undefined behaviour, and
 *      claiming it was overstated the case.
 *
 *      The DECISION is unchanged, because reason 2 is sound and sufficient on
 *      its own.
 *   2. **Motion documents layout projection as incompatible with `rotate`, and
 *      this is the whole reason the `layoutId` is refused.**
 *      Four of the five rest cards are rotated (§C.2). Projection measures with
 *      `removeTransform()`, i.e. from the card's UNROTATED box, so the morph
 *      would begin from a position the card is not visibly in — a 2.5°–6° snap
 *      on four of five cards, on this page's most prominent interaction.
 *
 * **The demo itself does not layout-animate its boxes either** — the decode in
 * `.claude/handoff/fanned-deck-reference.md` is explicit: "the card boxes
 * themselves are NOT layout-animated; they are plain `animate` transforms."
 * §2 of the spec says to copy the demo's actual mechanics. So this is a
 * transform choreography: every animated property is `transform` or `opacity`,
 * there is ZERO per-frame layout, and nothing here ever animates `width` or
 * `height`.
 *
 * **ONE `layoutId` SURVIVES AND IT IS NOT THIS ONE:** the expanded panel's
 * cover carries `project-cover-<slug>`, whose partner is `CoverFrame` in the
 * overlay. That is the shared-element morph the site already ships, and it had
 * to move here because `ProjectCard` — its previous holder on `/work` — is no
 * longer on this page.
 *
 * **EXACTLY ONE *SOURCE* CAN EVER BE MOUNTED ON THIS PAGE (there is one panel),
 * WHICH IS NOT THE SAME CLAIM AS "exactly one holder".** This sentence read
 * "one holder" until 2026-08-25 and was false in the exact moment the id exists
 * for: while the overlay is open, the panel's cover AND `CoverFrame` both hold
 * `project-cover-<slug>`, and that two-holder state IS the morph — the
 * newly-mounted holder leads, the previous one follows. The invariant that
 * matters, and the one `ProjectCard` actually states, is that this page
 * contributes at most one holder to that pair. It does: one panel, and the
 * mobile card deliberately carries no id at all (see `DeckCover`).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CHROME — flat, square, and consistent with `ProjectCard`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   Corners      SQUARE. No `rounded-*` anywhere in this file. `app/globals.css`
 *                ships ONE radius, `--radius-photo`, deliberately named for one
 *                consumer so that no radius SCALE can form. Cards are not
 *                photographs. The reference is `rounded-2xl` throughout.
 *   Border       `border-accent-working/30`, stepping to `/55` on hover and
 *                focus — byte-identical to `ProjectCard`, which carries the
 *                measured justification (/20 = 1.44:1, /30 = 1.79:1,
 *                /40 = 2.25:1). These cards are buttons, so they belong to the
 *                INTERACTIVE-surface border family.
 *   Cover frame  `border-fg/25` — the NEUTRAL image-frame family. globals.css:
 *                "keeping these neutral is what lets teal mean 'activate this'
 *                and nothing else."
 *   Surface      `bg-elevated`, as `ProjectCard`. In dark mode it is only
 *                ΔE 2.89 from `bg-base`, which is why the border is load-bearing
 *                rather than decorative.
 *   SHADOW       **NONE, on any card and on the panel.** The site has zero
 *                `--shadow-*` tokens. Five overlapping tilted slabs each wearing
 *                a shadow is mud, and the fan's depth comes entirely from
 *                overlap plus z-index — which is what makes it read as paper
 *                rather than as floating chrome. **This is the obvious wrong
 *                instinct when porting the reference; do not act on it.** The
 *                three action buttons DO wear the brutal treatment, and
 *                `projectButtonStyles.ts` states why controls and surfaces
 *                differ.
 *   `accent-hero` NOWHERE, including via an inline `var(--accent-hero)`. `/work`
 *                is Tier 2/3. The token sits outside the `--color-*` namespace
 *                precisely so no utility exists for it; do not route around it.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NO SCREENSHOT AT REST — a content ruling, not a styling preference
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The rest card is TYPOGRAPHIC: an index numeral, a void, `stack[0]` as a
 * kicker, and the title. The designer opened all five covers and ruled against
 * fanned screenshots on four independent grounds, of which the decisive one is
 * geometric: **only the left ~205px of each card is exposed in the fan, and the
 * left fifth of four of the five covers is blank margin or a sidebar.** The fan
 * would show the worst 80% of every image. The other three: five unrelated
 * palettes carrying ~9 uncontrolled hues on a two-accent site; two covers
 * near-white and two near-black, so no single card treatment can serve them;
 * and a tilted, cropped UI screenshot is the generic-portfolio tell.
 *
 * Already rejected, so they are not re-proposed: duotone/grayscale at rest,
 * a ghosted cover at ~18%, and a solid per-project colour (it needs five
 * colours; there are two).
 *
 * The ~200px of empty `bg-elevated` between the numeral and the bottom block is
 * KEPT, not filled. A card that is a numeral, a void and a name is a confident
 * typographic object on a site whose signature is negative space. A hairline
 * rule at 60% height was rejected as decoration announcing nervousness.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FRAME COST OF THE EXPAND / COLLAPSE — the static budget, and what is still
 * UNMEASURED
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **DECLARED HONESTLY FIRST: no Performance-panel capture was taken.** The
 * acceptance criterion this site holds animated components to — the one
 * `text-flipping-board.tsx` was measured against — is "no frame > 16.7ms over
 * the expand AND the collapse, at 4x CPU throttle, both themes, 1920x1080,
 * worst frame reported rather than an average". That needs a browser, and none
 * was available in the session this component was built in. **It is an
 * outstanding verification item, not a passed one.** Everything below is a
 * static budget: it says what work a frame CAN contain, which is the thing that
 * actually determines whether the capture will be clean.
 *
 * WHAT ANIMATES, AT PEAK (frames 0.12s-0.35s of an expand, when the box
 * transition and the delayed content entrance overlap):
 *
 *   5   fan cards        transform (translate + rotate + scale) and opacity
 *   1   panel            transform (scale) and opacity
 *   2   panel content    transform (translateY) and opacity
 *   1   index rail       transform (translateX) and opacity
 *   ──
 *   9   elements, 18 property writes per frame
 *
 * **EVERY ONE OF THOSE IS `transform` OR `opacity`. THERE IS NO THIRD
 * PROPERTY.** Neither triggers layout or paint — they are composited — so a
 * frame's main-thread work here is 18 inline-style writes plus one style
 * recalculation, on a subtree of ~90 nodes.
 *
 * **AND — the part that matters more — NOTHING IN THE DESKTOP EXPAND OR COLLAPSE
 * READS LAYOUT PER FRAME.** The nine elements above carry no `layout` prop, no
 * `layoutId`, no `getBoundingClientRect`, no `ResizeObserver` and no
 * `matchMedia`, so there is no read-after-write inside the animation — which is
 * the actual mechanism behind almost every blown budget in this class of
 * component. The design brief's `layoutId` version would have measured 6+
 * projection nodes at the start of every expand AND every collapse; refusing it
 * (see the block above) removed that cost as a side effect.
 *
 * **THIS USED TO SAY "THERE IS NO LAYOUT READ ANYWHERE IN THE TRANSITION", AND
 * THE ABSOLUTE WORDING WAS WRONG IN TWO PLACES.** The substance above is
 * unaffected; both exceptions are one-off measurements at a boundary, not
 * per-frame work:
 *
 *   • The panel's cover DOES carry `project-cover-<slug>`, inside the scaling
 *     panel. It is dormant while the deck animates — projection only runs when
 *     its partner (`CoverFrame`) mounts or unmounts, i.e. on an overlay open or
 *     close, which is a different interaction from the expand.
 *   • `DeckStack` (the mobile branch) uses `AnimatePresence mode="popLayout"`,
 *     which IS a layout-projection mode and measures the exiting child once as
 *     it is taken out of flow. That is the swipe, not the expand, and it is one
 *     measure per committed swipe rather than one per frame.
 *
 * If a `layout` prop, a `layoutId` or a `popLayout` is ever added to something
 * that moves DURING the expand, this whole budget stops holding.
 *
 * The one image in the panel is `placeholder="blur"` and `loading="lazy"`, so
 * its decode happens after the transition rather than inside it, and it cannot
 * shift anything: the cover's box is `w-[400px]` with a native aspect from the
 * static import.
 *
 * **THE ONE THING A CAPTURE COULD STILL CATCH** is the spring's tail. `SPRING`
 * is `visualDuration: 0.6` — the PERCEIVED arrival, not the settle — so the
 * animation continues past it at sub-pixel amplitude. Nine composited elements
 * for an extra few hundred milliseconds is cheap, but it is the only part of
 * this that is not bounded by a duration. Look at it in the capture.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FIRST PAINT IS BREAKPOINT-CORRECT WITHOUT JAVASCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The reference reads `matchMedia("(min-width: 1024px)")` in an effect, so its
 * prerendered HTML has desktop spacing at every width. `encrypted-text.tsx`
 * records how seriously that class of mismatch is taken here.
 *
 * **There is no media query in this file at all.** The two layouts are two DOM
 * subtrees switched by CSS (`hidden xl:block` / `xl:hidden`), and each card's
 * rest transform is written into the SSR HTML through Motion's `style={{ x, y,
 * rotate }}` — which serialises to a real `transform` in the markup. Nothing is
 * measured on first paint and nothing moves at hydration.
 *
 * The cost, declared: both subtrees are in the DOM at every width. `display:
 * none` removes the hidden one from the accessibility tree and from the tab
 * order. The hidden subtree carries NO `layoutId`, which is why the two
 * branches can coexist — see the mobile branch for the one place that mattered.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE PART OF THAT COST IS UNVERIFIED AND IS NO LONGER STATED AS FACT.
 * ─────────────────────────────────────────────────────────────────────────────
 * This paragraph asserted that the hidden subtree's `next/image` covers "never
 * download", on the reasoning that a lazy image with no layout box can never
 * intersect the viewport. That reasoning is sound for `IntersectionObserver`,
 * but `loading="lazy"` is NOT an `IntersectionObserver` — it is a browser
 * heuristic, and Chrome's has not reliably skipped `display: none` subtrees.
 * **Nobody has watched the network panel here, so the claim is withdrawn rather
 * than defended.**
 *
 * WHAT THE EXPOSURE ACTUALLY IS, WHICH IS SMALLER THAN THE CLAIM SUGGESTS AND
 * IS ONE-DIRECTIONAL:
 *
 *   at `xl`+   the MOBILE branch is hidden. `DeckStack` renders exactly one
 *              cover — the front card's, i.e. `projects[0]` — at
 *              `sizes` ≈ 870px. So a desktop visitor may be paying for at most
 *              ONE image, not five.
 *   below `xl` the DESKTOP branch is hidden. `DeckFan` renders a cover only
 *              inside `DeckPanel`, which mounts only when a card is activated,
 *              and a `display: none` card cannot be activated. **Zero images.**
 *              There is nothing to check on this side.
 *
 * TO SETTLE IT: load `/work` at 1280+ with an empty cache and look for a
 * `/_next/image?url=…folio…` request. **Do not "fix" it by gating the mobile
 * subtree on a client-side breakpoint** — that is exactly the first-paint
 * mismatch this whole two-subtree design exists to avoid, and it would be
 * trading a possible one-image download for a certain layout flash.
 */

/**
 * Fields the deck renders, and the only fields it may render.
 *
 * Same rule and same reason as `ProjectCardProps`: `description` (the longest
 * strings in the data file, ~600 chars on SNA) and `screenshots` are detail-page
 * payload and never cross into this client bundle. `links` DOES cross, because
 * §0.2 requires the three action buttons to be derived from it rather than
 * hardcoded.
 */
export type DeckProject = Pick<
  Project,
  "slug" | "title" | "oneLiner" | "stack" | "coverImage" | "links"
>;

/* ═══════════════════════════════════════════════════════════════════════════
   GEOMETRY. These are arbitrary-value utilities (`w-[250px]`, `h-[540px]`)
   because 250 / 350 / 205 / 820 / 500 are GEOMETRY, not rhythm. Every gap and
   pad in the composition is a Fibonacci `--spacing-*` name, per globals.css's
   mandate. Do not mix the two up.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * **THE FAN IS HARD-CAPPED AT FIVE CARDS. THIS IS ENFORCED, NOT ADVISORY.**
 *
 * `content/projects.ts` is hand-edited for a year and §3 of the spec says the
 * `/projects` LIST "scales as more are added". The fan does not, and the day a
 * sixth project lands the failure must be loud rather than a broken layout
 * nobody measured. Hence the throw below.
 *
 * THE ARITHMETIC, at the binding viewport (1280px, the `xl` breakpoint where
 * the fan turns on and the spine's insets are at their widest `lg:px-2xl`):
 *
 *   content box            1280 − (89 × 2)                    = 1102px
 *   fan footprint (N=5)    (5−1) × 205 + 250 + 8 rotation bleed = 1078px  ✓ 24px
 *   fan footprint (N=6)    (6−1) × S   + 250 + 8 ≤ 1102  ⇒  S ≤ 168.8px
 *
 * 168.8px is below the **title-legibility floor**, and that floor is a measured
 * string rather than a feeling. The exposed strip of each card is exactly
 * `SPACING` px wide; inside it sit `p-md` (21px) of card padding and the
 * kicker, which is `stack[0]` at `text-caption font-mono` — a JetBrains Mono
 * advance of 8.16px per character at 12px including the 0.08em tracking. The
 * longest kicker in the data is CCN's **"Cisco Packet Tracer", 19 characters =
 * 155.0px**. With 21px of left padding and 4px of clearance before the next
 * card's edge, the strip cannot go below **180px** without wrapping a two-word
 * technology name onto two lines on the card whose title is already the
 * longest on the site.
 *
 *   180px floor  >  168.8px available at N=6.   A sixth card does not fit.
 *
 * SO THE DECK SHIPS AT ITS CAP WITH ZERO HEADROOM. If a sixth project is worth
 * adding, the fan is not the surface that changes — the honest options are
 * (a) the deck shows a curated subset and `/projects` stays the complete
 * record, or (b) the fan is replaced. Both are Saad's calls, not an
 * implementer's, and neither is served by quietly lowering `SPACING`.
 */
const DECK_MAX_CARDS = 5;

/**
 * THE BOX TABLE, at `xl`+ (the fan does not exist below it — see `DeckStack`):
 *
 *   rest card        250 x 350   `w-[250px] h-[350px]`
 *   exposed strip    205         = SPACING, the only one of these that is
 *                                computed rather than written as a utility,
 *                                because it multiplies by the card index
 *   container        full spine width x 540   `h-[540px]`, `relative`
 *   card top         (540 - 350) / 2 = 95     `top-[95px]`
 *   panel            820 x 500   `w-[820px] h-[500px]`
 *   panel top        (540 - 500) / 2 = 20     `top-[20px]`
 *   rail             200 wide, left edge at 820 + 55 (`--spacing-xl`) = 875,
 *                    right edge 1075, inside the 1102px content box at 1280
 *
 * **THE CONTAINER NEVER CLIPS.** The fan's tallest rotated bounding box (card 3
 * at 6°, y +16) reaches y = 473.1 inside 540, and the panel's spring overshoot
 * (~2% on a 500px box, i.e. ~5px each side) lands at 15/525. If anything would
 * clip, the geometry is wrong — do not add `overflow-hidden`. The reference has
 * one purely to hide the 400px drop-away we are not building.
 */
const SPACING = 205;

/** The rail's left edge: the panel's width plus one `--spacing-xl`. Kept as a
 *  computed value, not a `left-[875px]` utility, so the panel's width and the
 *  rail's offset cannot drift apart in two different files' worth of grep. */
const RAIL_X = 820 + 55;

/**
 * Rest tilts and vertical offsets — the reference's `+8 / −5 / +12 / −5`
 * sequence at **0.5×**, with card 0 squared off.
 *
 * CARD 0 IS 0° so the leading edge on the spine is a true vertical. A −7.5°
 * card would swing its bottom-left corner ~22px into the gutter and Rule S-1's
 * leading edge would stop being crisp.
 *
 * THE REST ARE HALVED because our cards carry a reading load the reference's do
 * not — a three-line 26px title at 15° is a tilted paragraph. The reference's
 * asymmetric alternation is preserved, so the fan still reads as hand-fanned
 * rather than as a mechanical arc.
 *
 * `y` is measured from the container's centre line, exactly as the reference
 * measures it.
 */
const REST: readonly { readonly rotate: number; readonly y: number }[] = [
  { rotate: 0, y: -20 },
  { rotate: 4, y: 16 },
  { rotate: -2.5, y: -44 },
  { rotate: 6, y: 16 },
  { rotate: -2.5, y: -8 },
];

/**
 * Stacking order, as literal class strings because Tailwind v4 scans source
 * text and cannot see `z-[${2 + i}]`.
 *
 * z CLIMBS WITH INDEX — the reference's rule, and it is load-bearing here in a
 * way it is not there: it makes each card's LEFT strip the exposed one, which
 * is exactly where the title lives. Reversing it would bury every title.
 */
const Z_CLASS = ["z-[2]", "z-[3]", "z-[4]", "z-[5]", "z-[6]"] as const;

/**
 * How many `stack` entries the expanded panel shows before it truncates.
 *
 * FOUR, and the reasoning is `ProjectCard`'s, unchanged — read it there rather
 * than re-deriving it here. Measured at this panel's 318px right column, all
 * five projects wrap to exactly two rows, which is the height budgeted below.
 */
const STACK_LIMIT = 4;

/**
 * Commit thresholds for the mobile swipe. Either one alone commits, so a short
 * flick works as well as a long drag.
 */
const SWIPE_DISTANCE_PX = 60;
const SWIPE_VELOCITY = 400;

/**
 * The mobile card's enter/exit travel, as VARIANTS taking the swipe direction
 * through `AnimatePresence`'s `custom`.
 *
 * IT HAS TO BE `custom` AND NOT A CLOSED-OVER `direction` VARIABLE, and the bug
 * that forces it is easy to miss: `AnimatePresence` keeps the OUTGOING React
 * element as it was last rendered, so an `exit` object built from state would
 * carry the direction from BEFORE the swipe. The first reversal of direction
 * would then throw the leaving card out of the side it should be entering from.
 * `custom` is the documented escape hatch — it is re-read on the exiting child.
 *
 * 110% rather than a measured pixel width: the card's width is the content box
 * and changes at two breakpoints, and a percentage needs no `ResizeObserver`.
 */
const CARD_SWIPE = {
  enter: (dir: number) => ({ x: dir > 0 ? "110%" : "-110%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-110%" : "110%", opacity: 0 }),
} as const;

/**
 * The content entrance inside the panel and the rail.
 *
 * NOT `SPRING`. The spring is the deck's fan/expand curve — the thing that
 * makes the boxes settle rather than arrive. A fade is not a settle.
 * `DURATION.ui` + `EASE.reveal` is the site's Tier 2/3 entrance pair.
 *
 * **THE SECOND HALF OF THAT SENTENCE USED TO READ "and a bounced opacity is
 * nothing", WHICH CONTRADICTED THIS FILE'S OWN CODE.** `DeckPanel` and the
 * mobile `motion.article` both animate `opacity` under `SPRING`. Corrected
 * rather than deleted, because the observation is true and it is the reason the
 * contradiction costs nothing: opacity is clamped to [0,1], so the spring's
 * overshoot past the target is simply not rendered and those two elements fade
 * on the spring's approach alone. That is why nothing was changed in the code
 * here — a per-property `transition` override to take opacity off the spring
 * would add a fourth transition object to buy an effect that is invisible by
 * construction.
 *
 * The real distinction is not "opacity cannot be sprung", it is **what the
 * animation is attached to**: the panel's opacity belongs to a BOX that is
 * arriving, so it rides that box's curve; this constant is for content that is
 * only ever fading, with no box arriving under it.
 *
 * The 0.12s delay is what makes the sequence read as one gesture: the box
 * arrives, then it fills.
 */
const CONTENT_IN = {
  duration: DURATION.ui,
  ease: EASE.reveal,
  delay: 0.12,
} as const;

/** Two decimal-free numerals, derived from array index. Never authored. */
function numeral(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED PIECES — used by BOTH the desktop panel and the mobile card, so the
   two layouts cannot drift into two different definitions of "a project".
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The cover, in its neutral frame.
 *
 * `layoutId` IS OPTIONAL AND ONLY THE DESKTOP PANEL PASSES IT. Both subtrees are
 * mounted at every width (see the header), so if the mobile card also carried
 * `project-cover-<slug>` this PAGE would contribute two holders of the id at
 * once. **The problem is not concurrency as such** — the overlay morph is
 * itself a two-holder state and works — **it is two PERSISTENT holders with no
 * transition between them, one of which is inside a `display: none` subtree and
 * therefore measures 0×0.** Motion would resolve the pair by lead/follow order
 * and the overlay's cover could project onto an empty rect. The mobile card
 * therefore has none, and on that path the overlay opens with its fade alone —
 * the same treatment, for a related reason, that `/projects`' strip thumbnails
 * were given.
 *
 * THE ONE-CHILD CONTRACT APPLIES VERBATIM when the id is present: this wrapper
 * contains ONLY the `<Image>`. No caption, no badge, no scrim, no border child.
 * The border is a class on the wrapper, exactly as `CoverFrame` does it.
 *
 * NATIVE ASPECT, NO CROP. `content/projects.ts` forbids cropping the CCN
 * topology outright — content authority, not taste — so there is no
 * `aspect-[...]`, no `object-cover` and no letterbox here.
 */
function DeckCover({
  cover,
  sizes,
  layoutId,
}: {
  cover: DeckProject["coverImage"];
  sizes: string;
  layoutId?: string;
}) {
  return (
    <motion.div layoutId={layoutId} className="border border-fg/25">
      <Image
        src={cover.src}
        alt={cover.alt}
        sizes={sizes}
        placeholder="blur"
        // Against next/image's default 75, uniformly, never per-image — every
        // cover is a UI screenshot, and sharp text on flat fields is the worst
        // case for lossy encoding. `ProjectCard` carries the full reasoning.
        quality={85}
        className="block h-auto w-full"
      />
    </motion.div>
  );
}

/**
 * The stack flow — NOT CHIPS.
 *
 * Bare `text-caption font-mono` in a wrapping flow, reused from `ProjectCard`
 * verbatim including the type classes on the `<li>` itself: a bare `<li>`
 * inherits preflight's 24px strut against the 16.8px of every technology name
 * beside it, which sits the overflow marker ~4px low and adds ~7px to the
 * block. That bug is already fixed once; do not reintroduce it by dropping the
 * classes because "the parent already sets them".
 *
 * NO SORT AND NO ALPHABETISING — `content/types.ts` states stack order is
 * meaningful authored content.
 */
function DeckStackTags({ stack }: { stack: readonly string[] }) {
  const shown = stack.slice(0, STACK_LIMIT);
  // The guard must exist even though no project hits it today: CCN has the
  // fewest entries at 6, so the remainder can only reach 0 if someone edits the
  // data file down to four or fewer. `+0` must never render.
  const overflow = stack.length - shown.length;

  return (
    <ul className="flex flex-wrap gap-x-md gap-y-xs">
      {shown.map((entry) => (
        <li key={entry} className="text-caption font-mono text-fg">
          {entry}
        </li>
      ))}
      {overflow > 0 ? (
        <li className="text-caption font-mono text-fg/70">
          {/* Same device as Skills' `00` and `ProjectCard`'s marker: the glyph
              takes its meaning from sitting at the end of a visual row, so it is
              hidden and an sr-only sibling states the same fact in a form that
              survives being read aloud. The reduced opacity marks the marker as
              NOT a technology — the one thing that must not be ambiguous in a
              list of technologies. */}
          <span aria-hidden="true" className="text-caption font-mono text-fg/70">
            {`+${overflow}`}
          </span>
          <span className="sr-only">{`and ${overflow} more`}</span>
        </li>
      ) : null}
    </ul>
  );
}

/**
 * The three action buttons — **derived from `links`, never hardcoded.**
 *
 * Details always; GitHub only if `links.github`; Live Site only if `links.live`.
 * Across the five real projects the only variants that occur are THREE buttons
 * (FOLIO, Aero-Grid, ClashChat) and ONE (CCN and SNA, whose `links` is `{}` by
 * design — they are coursework, not deployed software). There is no
 * github-only or live-only project today; the derivation is written anyway,
 * because the data file is hand-edited for a year.
 *
 * **WITH ONLY DETAILS, THE ROW DOES NOT CENTRE, STRETCH OR GROW.** Details keeps
 * its intrinsic width on the panel's left edge. No disabled chip, no "Repo not
 * public", no "Coming soon", no placeholder of any kind. Absence is an absent
 * key and it renders as absence — the same rule Skills' empty group ships under
 * and `content/types.ts` states outright. For CCN and SNA the only action
 * genuinely IS "read the write-up", and that reads correctly.
 *
 * ORDER IS DETAILS · GITHUB · LIVE SITE, and DOM order = visual order = tab
 * order. Details is the one filled control: it is always present and it is the
 * internal destination. Same one-primary-two-secondaries shape as `/about`'s
 * row.
 *
 * `gap-sm` (13px) IS NOT A ROUNDING OF SOMETHING ELSE. `aboutButtonStyles.ts`
 * records that the brutal treatment's shadow overhangs 5px down and right, and
 * that 13px clears it in both axes — including between the two wrapped rows.
 *
 * **DETAILS OPENS THE OVERLAY, NOT THE STANDALONE PAGE.** It is a plain
 * `next/link` to `/projects/<slug>`; `app/(site)/@modal/(.)projects/[slug]/`
 * intercepts it and `ProjectOverlay` opens, with Close as `router.back()`. No
 * `router.push`, no click handler, no overlay state here — Enter works natively
 * and middle-click still opens a real page.
 */
function DeckActions({ slug, links }: Pick<DeckProject, "slug" | "links">) {
  return (
    <div className="flex flex-wrap gap-sm">
      <Link href={`/projects/${slug}`} className={PROJECT_BUTTON_PRIMARY}>
        {DECK_DETAILS_LABEL}
      </Link>
      {links.github ? (
        <ExternalLink href={links.github} className={PROJECT_BUTTON_SECONDARY}>
          {DECK_GITHUB_LABEL}
        </ExternalLink>
      ) : null}
      {links.live ? (
        <ExternalLink href={links.live} className={PROJECT_BUTTON_SECONDARY}>
          {DECK_LIVE_LABEL}
        </ExternalLink>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE DESKTOP FAN — `xl`+ only
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * One card at rest. A real `<button>` inside a real `<li>`, so the deck
 * announces "list, 5 items" the way `Projects.tsx`'s grid did.
 *
 * **BUTTONS, NOT LINKS.** A rest card expands the panel; it is the panel's
 * `Details` control that navigates. A card that both expands and navigates has
 * two meanings for one click.
 *
 * ACCESSIBLE NAME IS THE TITLE ALONE, via `aria-labelledby` pointing at the
 * card's own visible `<h3>`. Not a hand-written `aria-label` — that drifts from
 * the visible text over a year of edits — and not the default content
 * concatenation, which would read "01 Apache Kafka FOLIO".
 *
 * HOVER IS A 13px LIFT AND A BORDER STEP. No scale: scaling an overlapping
 * rotated card clips its neighbours unevenly, and you LIFT a card out of a fan,
 * you do not zoom it. The lift is Framer (so `MotionConfig reducedMotion="user"`
 * drops it for free); the `/30 → /55` border step is CSS, so it SURVIVES reduced
 * motion and is then the only hover feedback left. That split is `ProjectCard`'s
 * and it is deliberate.
 *
 * `hover:z-20` IS A CLASS, NOT AN INLINE STYLE, so the lift is not occluded by
 * the neighbours stacked above it and no React state is needed to track hover.
 *
 * WHILE ANY CARD IS ACTIVE, HOVER IS SUPPRESSED (the reference's rule, kept) and
 * every card is taken out of the tab order and the accessibility tree. The
 * reference leaves its inactive cards tabbable after throwing them off-screen;
 * that is defect #3 in the decode and this is the fix. They stay MOUNTED rather
 * than unmounting — see the header for why unmounting them is what would break
 * the one interesting `layoutId` on the page.
 */
function FanCard({
  project,
  index,
  isActive,
  anyActive,
  onExpand,
  buttonRef,
}: {
  project: DeckProject;
  index: number;
  isActive: boolean;
  anyActive: boolean;
  onExpand: () => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
}) {
  const rest = REST[index];
  const titleId = `deck-card-title-${project.slug}`;
  const restX = index * SPACING;

  return (
    <li>
      <motion.button
        ref={buttonRef}
        type="button"
        aria-labelledby={titleId}
        aria-hidden={anyActive ? true : undefined}
        tabIndex={anyActive ? -1 : undefined}
        onClick={(event) => {
          // The container's own click collapses the deck; without this a click
          // on a card would expand and immediately collapse it.
          event.stopPropagation();
          onExpand();
        }}
        /*
          THE REST TRANSFORM IS IN `style`, AND THAT IS WHAT MAKES THE SERVER
          HTML CORRECT. Motion serialises `style={{ x, y, rotate }}` into a real
          `transform` on the prerendered element, so the fan is already fanned
          before any JavaScript runs. `initial={false}` then tells Motion to
          adopt the `animate` values without playing a mount animation, so
          hydration is silent.
        */
        style={{ x: restX, y: rest.y, rotate: rest.rotate }}
        initial={false}
        animate={
          anyActive
            ? isActive
              ? // The clicked card slides to the panel's anchor and dissolves
                // as the panel grows over it — it reads as having become the
                // panel, which is the half of the reference's mechanic that
                // survives without layout projection.
                { x: 0, y: 0, rotate: 0, scale: 1, opacity: 0 }
              : { x: restX + 13, y: rest.y, rotate: rest.rotate, scale: 0.96, opacity: 0 }
            : { x: restX, y: rest.y, rotate: rest.rotate, scale: 1, opacity: 1 }
        }
        /*
          THE HOVER CARRIES ITS OWN TRANSITION AND MUST. Without the inline
          `transition` below it would inherit the component's `transition`
          prop — i.e. `SPRING` — and the 13px lift would have been a 600ms
          bouncy settle. It shipped that way on 2026-08-25 and was caught in
          review.

          THREE THINGS SAY IT IS WRONG, AND THEY AGREE: design §C.9 specifies
          this lift at `DURATION.micro` + `EASE.ui`; `docs/03`'s motion table
          names "hover, press" as `EASE.ui`'s job; and `easing.ts`'s docblock
          ENUMERATES `SPRING`'s scope as three call sites — the fan's
          rest/expand/collapse choreography, the panel, and the mobile swipe
          settle. Hover is not among them. A curve family that was added as a
          deliberate, scoped, design-system decision must not acquire a fourth
          use by inheritance; that is precisely what the scoping exists to
          prevent, and inheritance is the one way it can happen without anyone
          typing the name.

          ─────────────────────────────────────────────────────────────────────
          THIS FIXES THE LIFT, NOT THE RETURN, AND THE RESIDUAL IS DECLARED
          RATHER THAN LEFT TO BE REDISCOVERED.
          ─────────────────────────────────────────────────────────────────────
          A `transition` inside a gesture target applies on the way IN only. On
          hover END, Motion re-applies the lower-priority `animate` target — so
          the 13px drop back rides the component `transition`, i.e. `SPRING`,
          and there is no declarative hook for a different curve there because
          "hover out" and "re-apply the base target" are the same operation.
          `easing.ts` records it as `SPRING`'s fourth use rather than pretending
          the scope list is still exhaustive.

          TWO WAYS TO REMOVE IT WERE CONSIDERED AND BOTH WERE REFUSED, with a
          browser pass as the condition for revisiting either:
            • A React `hovered` state folded into `animate`. The transition then
              has to be chosen per CAUSE — hover vs collapse — because a flat
              `anyActive ? SPRING : micro` would take the COLLAPSE off the
              spring, and the collapse is one of the three uses `easing.ts`
              actually scopes the spring to.
            • Splitting the card into a `motion.li` (choreography, SPRING) with
              the `<button>` inside it (hover, micro/ui). Structurally clean,
              but the lift would then compose inside the li's rotation — 13px
              along the card's own axis rather than the page's — and
              `hover:z-20` would move into a stacking context the li creates, so
              the lifted card could be occluded by its neighbours. Two visible
              changes to this page's most prominent interaction, neither
              checkable in this session.
        */
        whileHover={
          anyActive
            ? undefined
            : {
                y: rest.y - 13,
                transition: { duration: DURATION.micro, ease: EASE.ui },
              }
        }
        /*
          `SPRING` — the site's FOURTH curve family, added on Saad's explicit
          design-system decision of 2026-08-25 and scoped, in `easing.ts`'s own
          docblock, to exactly this deck. **This is its call site.** The value is
          the reference's own, unchanged: settle-with-overshoot is the
          recognisable half of the interaction and a cubic-bezier cannot express
          it at all.

          IT DOES NOT LICENSE SPRINGS ANYWHERE ELSE, and in particular it must
          not be unified onto the cover morph: `CoverFrame` and `ProjectOverlay`
          each carry a GEOMETRIC refusal of a spring (overshoot measured against
          the `<h1>`'s fixed left edge one row below), and that half of their
          reasoning is untouched. The deck has no such reference edge — the panel
          overshoots into 20px of its own container slack and the nearest fixed
          element is 55px below it.
        */
        transition={SPRING}
        /*
          ─────────────────────────────────────────────────────────────────────
          `pointer-events-none` WHILE ANY CARD IS ACTIVE. THIS IS A BUG FIX AND
          IT IS LOAD-BEARING. DO NOT DROP IT.
          ─────────────────────────────────────────────────────────────────────
          The four inactive cards animate to `opacity: 0` and STAY MOUNTED (see
          the note above — that is deliberate, it is what lets them fly back).
          But OPACITY ZERO STILL HIT-TESTS. Without this gate they remained
          live buttons, `cursor-pointer` and all, underneath what reads as empty
          deck background — and their handler unconditionally re-expands, so a
          click on dead space SWITCHED PROJECT instead of collapsing.

          MEASURED, at `xl`+ with a panel open: the panel occupies x 0-820 and
          the index rail x 875-1075, both at `z-30` so they correctly paint
          above. The invisible live regions were the 55px gutter BETWEEN them
          (x 820-875, y ~95-445) and the bands above and below the rail's text
          (x 875-1083, y ~95-166 and ~375-445). Of the three declared exits
          below, click-on-background was only reliable to the RIGHT of x~1083 —
          a ~19px strip at 1280.

          THIRD TIME THIS EXACT CLASS OF BUG HAS BEEN CAUGHT IN THIS BUILD, and
          the third different mechanism: `ProjectStripRow`'s cover painted over
          a stretched link as a positioned sibling; its `<h2>` translate would
          have re-parented one as a containing block; this one is simply an
          invisible element that was never told to stop listening. All three
          passed `tsc`, ESLint, `next build`, HTML readback and every possible
          screenshot. **If you add anything to this deck that goes invisible
          without unmounting, gate its pointer events in the same commit.**

          `cursor-pointer` MOVES INTO THE SAME TERNARY rather than staying
          unconditional: a pointer cursor over a region that cannot be clicked
          is the visible half of the same lie.
        */
        className={`${Z_CLASS[index]} ${
          anyActive ? "pointer-events-none" : "cursor-pointer"
        } absolute left-0 top-[95px] flex h-[350px] w-[250px] flex-col justify-between border border-accent-working/30 bg-elevated p-md text-left transition-[border-color] duration-200 ease-in-out hover:z-20 hover:border-accent-working/55 focus-visible:z-20 focus-visible:border-accent-working/55 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-working`}
      >
        {/* Derived from array index, never authored. `aria-hidden` because a
            spoken "zero one" before the title is noise — the `<ul>` already
            supplies "1 of 5". */}
        <span
          aria-hidden="true"
          className="text-caption font-mono text-fg/70"
        >
          {numeral(index)}
        </span>

        <div>
          {/* `stack[0]` IS NOT FILLER. `content/types.ts` records that stack
              order is meaningful authored content, so the first entry is the
              project's own answer to "what is this built on". It gives the
              title a shoulder and it is the same mono-caption-as-label device
              Skills and Experience already use. All five fit one line at
              180px — longest is "Cisco Packet Tracer", 155.0px. */}
          <p className="mb-xs text-caption font-mono text-fg/70">
            {project.stack[0]}
          </p>
          {/* `max-w-[180px]` keeps the title inside the 205px exposed strip so
              no glyph lands under the next card: 21px of `p-md` + 180 = 201,
              four short of the neighbour's leading edge. See DECK_MAX_CARDS.

              IT IS A MAX-WIDTH, NOT A CLIP, AND THE DIFFERENCE MATTERS FOR ONE
              STRING. A single unbreakable word longer than 180px overflows the
              cap rather than being cut. The longest word in the data is SNA's
              "Infrastructure" — 14 characters at `text-h4` (26px at 1920,
              25.2px at 1280) with the scale's own -0.01em tracking, which
              measures ~171px and fits. **Re-check this if a project title ever
              contains a word longer than ~15 characters**; the card's own
              content box is 208px, so there are 28px of tolerance beyond the
              cap before a glyph would reach the next card at all. Do not
              "fix" a future overflow with `truncate` — the site ships no
              ellipsis anywhere. */}
          {/* AN `<h2>`, NOT AN `<h3>`, AND THE LEVEL IS NOT COSMETIC. On
              `/work` the page's `<h1>` is "Projects." and the next headings
              down are Certifications and Experience, both `<h2>`. A project is
              a direct child of this page in exactly the way those are, so
              `<h3>` here would skip a level under an `<h1>` with no `<h2>`
              between them. (`ProjectCard` renders `<h3>` because on Home it
              sits under the section's own `<h2>Work</h2>` — same content, one
              level deeper, because the page around it is deeper.) The VISUAL
              size is `text-h4` either way; docs/03 names that token for card
              titles, and the level and the size are allowed to disagree when
              the document structure says so. */}
          <h2 id={titleId} className="max-w-[180px] text-h4 text-fg">
            {project.title}
          </h2>
        </div>
      </motion.button>
    </li>
  );
}

/**
 * The expanded panel.
 *
 * ═══ THE VERTICAL BUDGET, MEASURED — re-check it on any change ═══
 *
 * 820 × 500, `p-lg` (34) ⇒ inner 752 × 432. Two columns, `gap-lg` (34):
 * cover 400 fixed, text 318.
 *
 * LEFT: the covers render 188 / 189 / 189 / 150 / 203 px tall at a 400px slot
 * (measured off the actual PNG headers). Worst case 203 ≤ 432. ✓ SNA's 779px
 * source at a 400px slot is 1.95× density — BETTER than the 428px grid slot it
 * rendered in before this deck replaced the grid.
 *
 * RIGHT, worst case (CCN: a 38-character title and a 131-character one-liner):
 *
 *   Close row      `text-caption`, 12 × 1.4                      16.8
 *   `mt-sm`                                                      13.0
 *   title          `text-h4` 26px × 1.2, 2 lines                 62.4
 *   `mt-sm`                                                      13.0
 *   oneLiner       `text-body` 16 × 1.6, 4 lines                102.4
 *   `mt-md`                                                      21.0
 *   stack tags     16.8 × 2 rows + `gap-y-xs` 8                  41.6
 *   `mt-lg`                                                      34.0
 *   action row     46.8 × 2 rows + `gap-sm` 13                  106.6
 *   brutal shadow overhang below the last row                     5.0
 *                                                              ───────
 *                                                                415.8 ≤ 432 ✓
 *
 * **THE PANEL IS 500 TALL, NOT THE BRIEF'S 480, AND THAT IS A CORRECTION RATHER
 * THAN A PREFERENCE.** The brief's §C.5 budget totals 386 against a 412 inner
 * height — but it omits the `Close` control its own §C.9 requires as one of the
 * panel's three exits. Adding it costs 29.8px and leaves 9.2px of slack, which
 * is not enough margin for a type-scale change or a longer title. Growing the
 * panel by 20px costs **nothing anywhere else**: it sits inside the 540px
 * container either way, the fan's tallest rotated card still reaches only
 * y = 473.1, and the page's one-viewport sum is unchanged.
 *
 * ═══ WHY `oneLiner` AND NEVER `description` ═══
 *
 * The descriptions run 600–1400 characters and belong on the detail page. This
 * matches `ProjectCard`'s prop selection exactly, and `DeckProject` makes it a
 * type error to do otherwise.
 *
 * ═══ EXITS ═══
 *
 * Three, mirroring Rule S-4's discipline: `Escape`, this `Close`, and a click on
 * the deck container's own background. **There is no document-level `mousedown`
 * listener** — the reference has one, and here it would fire on the navbar and
 * on the "Browse as a list" button too. The `Escape` handler is scoped to the
 * deck's own subtree for the same class of reason: a document listener would
 * collapse the deck behind an open project overlay, and the panel is the
 * mounted holder of `project-cover-<slug>` that the overlay's reverse morph
 * projects back onto.
 */
function DeckPanel({
  project,
  onClose,
  panelRef,
}: {
  project: DeckProject;
  onClose: () => void;
  panelRef: Ref<HTMLDivElement>;
}) {
  const titleId = `deck-panel-title-${project.slug}`;

  return (
    <motion.div
      ref={panelRef}
      // `tabIndex={-1}` so focus can be MOVED here on expand without adding a
      // tab stop. The reference has no focus management at all — defect #2.
      tabIndex={-1}
      role="group"
      aria-labelledby={titleId}
      onClick={(event) => event.stopPropagation()}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={SPRING}
      style={{ transformOrigin: "left center" }}
      className="absolute left-0 top-[20px] z-30 flex h-[500px] w-[820px] gap-lg border border-accent-working/30 bg-elevated p-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-working"
    >
      {/* Keyed on the slug so switching projects from the rail replays the
          entrance rather than swapping text under a static box. No
          `AnimatePresence`: the outgoing content leaves instantly and the
          incoming fades, which is what "panel to panel, no collapse step"
          should feel like. */}
      <motion.div
        key={`${project.slug}-cover`}
        initial={{ opacity: 0, y: 13 }}
        animate={{ opacity: 1, y: 0 }}
        transition={CONTENT_IN}
        className="w-[400px] shrink-0"
      >
        <DeckCover
          cover={project.coverImage}
          sizes="400px"
          layoutId={`project-cover-${project.slug}`}
        />
      </motion.div>

      <motion.div
        key={`${project.slug}-text`}
        initial={{ opacity: 0, y: 13 }}
        animate={{ opacity: 1, y: 0 }}
        transition={CONTENT_IN}
        className="flex min-w-0 flex-1 flex-col"
      >
        {/* Right-aligned in the right column, which IS the panel's padding-box
            corner — the column ends exactly at `p-lg`'s inner edge. On its own
            row rather than beside the title: sharing a row would cut the title
            measure to 264px, and CCN's title needs 2 lines at 318 with only
            ~9% to spare. */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            // `cursor-pointer` is appended here and is not baked into
            // STANDALONE_NAV: preflight gives `<a href>` a pointer cursor for
            // free and `<button>` none, so it belongs at the button call sites.
            className={`${STANDALONE_NAV} cursor-pointer`}
          >
            {DECK_CLOSE_LABEL}
          </button>
        </div>

        {/* `<h2>` for the same reason the rest card's is — see `FanCard`. The
            card behind this panel is `aria-hidden` while it is open, so the two
            never appear in the accessibility tree together. */}
        <h2 id={titleId} className="mt-sm text-h4 text-fg">
          {project.title}
        </h2>
        {/* Tightest gap in the panel: the title and the one-liner are one
            statement. */}
        <p className="mt-sm text-body text-fg">{project.oneLiner}</p>
        {/* 21px is a register change, sans → mono, and needs a real gap. */}
        <div className="mt-md">
          <DeckStackTags stack={project.stack} />
        </div>
        <div className="mt-lg">
          <DeckActions slug={project.slug} links={project.links} />
        </div>
        {/* NO NUMERAL IN THE PANEL. It belongs to the rest card and to the rail,
            which is where a position in a set is information; repeated on the
            open panel it is a digit whose only reading is "the one you clicked".
            The rail states the position, with `aria-current`. */}
      </motion.div>
    </motion.div>
  );
}

/**
 * The index rail — what replaces "the rest stay fanned behind it".
 *
 * ═══ WHY NEITHER THE SPEC'S VERSION NOR THE REFERENCE'S ═══
 *
 * The spec says the inactive cards stay fanned behind the expanded one. At our
 * content size that is not physically available: the panel is 820px wide and the
 * whole fan is 1078px, so an 820px panel on the spine covers cards 0–3 entirely
 * and most of card 4. "Stay fanned behind it" would mean "invisible behind it",
 * which is worse than either alternative because it LOOKS browsable and is not.
 *
 * The reference drops its inactive cards `y: 400`. In our 540px container that
 * puts four cards on top of the "Browse as a list" control 55px below, or
 * requires `overflow-hidden`, which would then clip the fan.
 *
 * ═══ WHAT THIS IS INSTEAD ═══
 *
 * The deck files itself into an index. All five projects stay NAMEABLE, which
 * is the requirement any shrink-the-cards treatment fails: at the reference's
 * 0.7 scale, or a tucked mini-fan at 0.46 (115px wide), four of five
 * destinations become blank chips, and a 115px chip cannot carry "Multi-Floor
 * Call Center Network Design".
 *
 * It also preserves the one thing the reference's drop-away destroys: switching
 * projects WITHOUT collapsing first. And a numbered mono/sans index list is the
 * site's own language — Skills, Experience and `/projects` are all already this.
 * The rail and the mobile pager are literally the same idea at two
 * orientations, which is what makes the mobile treatment parity rather than
 * fallback.
 *
 * THE ACTIVE ENTRY IS NOT A BUTTON. A control that re-opens the panel you are
 * already looking at is a dead control and a tab stop that does nothing. It is
 * inked `text-accent-working` and carries `aria-current="true"`.
 */
function DeckRail({
  projects,
  activeSlug,
  onSelect,
}: {
  projects: readonly DeckProject[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <motion.nav
      aria-label={DECK_RAIL_LABEL}
      initial={{ opacity: 0, x: 13 }}
      animate={{ opacity: 1, x: 0 }}
      // THE EXIT CARRIES ITS OWN TRANSITION AND MUST. `CONTENT_IN` includes a
      // 0.12s delay, which is right on the way IN — the box arrives, then it
      // fills — and wrong on the way out, where it would leave the rail hanging
      // for 120ms after the panel had already gone.
      exit={{ opacity: 0, transition: { duration: DURATION.micro, ease: EASE.ui } }}
      transition={CONTENT_IN}
      onClick={(event) => event.stopPropagation()}
      // `left` is `RAIL_X`, i.e. the panel's width plus one `--spacing-xl`. It
      // is an inline value rather than a `left-[875px]` utility so the two
      // numbers cannot drift apart. `y: "-50%"` is a Motion value, not a
      // `-translate-y-1/2` class, because Motion owns this element's transform
      // and a class would simply be overwritten.
      style={{ left: RAIL_X, y: "-50%" }}
      className="absolute top-1/2 z-30 w-[200px]"
    >
      <ul>
        {projects.map((project, index) => {
          const isActive = project.slug === activeSlug;
          return (
            <li key={project.slug} className="flex gap-x-sm py-xs">
              <span
                aria-hidden="true"
                className={`w-[34px] shrink-0 text-caption font-mono ${
                  isActive ? "text-accent-working" : "text-fg/70"
                }`}
              >
                {numeral(index)}
              </span>
              {isActive ? (
                <span
                  aria-current="true"
                  className="text-body text-accent-working"
                >
                  {project.title}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(project.slug)}
                  className="cursor-pointer text-left text-body text-fg/70 transition-[color] duration-200 ease-in-out hover:text-fg focus-visible:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-working"
                >
                  {project.title}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}

function DeckFan({ projects }: { projects: readonly DeckProject[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const activeIndex = projects.findIndex((p) => p.slug === activeSlug);
  const activeProject = activeIndex >= 0 ? projects[activeIndex] : null;

  /**
   * COLLAPSE RETURNS FOCUS TO THE CARD THAT OPENED THE PANEL. Without this, a
   * keyboard user who expands and then presses Escape is dropped at the top of
   * the document — the reference has no focus management at all (decode defect
   * #2), and "expanding by keyboard must be collapsible by keyboard" is only
   * half the fix.
   *
   * `requestAnimationFrame` because the card is `aria-hidden` and `tabIndex=-1`
   * in the frame the panel is still open; focus has to land after React has
   * committed the collapsed state.
   *
   * **THE `requestAnimationFrame` USED TO SIT INSIDE THE `setActiveSlug`
   * UPDATER, AND THAT WAS A REAL CORRECTNESS BUG RATHER THAN A STYLE POINT.**
   * A state updater must be pure; React explicitly reserves the right to call
   * it more than once, and StrictMode does so on every update in development.
   * Two invocations meant two scheduled `focus()` calls per collapse — harmless
   * today only because they target the same node with the same result, which is
   * exactly the kind of "harmless" that stops being harmless the moment a side
   * effect in an updater does something that does not commute.
   *
   * Reading `activeSlug` from the closure instead costs a `useCallback` dep and
   * nothing else. The early return also makes the container's own background
   * click a genuine no-op when nothing is open, which it previously achieved by
   * dispatching a state update that resolved to the same value.
   */
  const collapse = useCallback(() => {
    if (!activeSlug) return;
    setActiveSlug(null);
    requestAnimationFrame(() => cardRefs.current[activeSlug]?.focus());
  }, [activeSlug]);

  /**
   * FOCUS MOVES INTO THE PANEL ON EXPAND, so the next Tab lands on Close /
   * Details rather than on the card behind it, and so Escape has somewhere
   * sensible to fire from. Only on the transition into an open state — switching
   * projects from the rail deliberately leaves focus on the rail.
   */
  const openedRef = useRef(false);
  useEffect(() => {
    if (activeSlug && !openedRef.current) {
      panelRef.current?.focus();
    }
    openedRef.current = Boolean(activeSlug);
  }, [activeSlug]);

  return (
    <div
      /*
        THE CONTAINER'S OWN CLICK IS ONE OF THE THREE EXITS, and it is a React
        handler on this subtree rather than a `document` `mousedown` listener.
        The reference uses the document, which here would fire on the navbar and
        on the control below the deck. Cards, the panel and the rail all
        `stopPropagation`.

        `onKeyDown` IS SCOPED HERE FOR THE SAME REASON, plus one that is
        load-bearing: `ProjectOverlay` opens as a modal `<dialog>` via
        `showModal()`, which INERTS this subtree — so a scoped handler cannot
        collapse the deck while the overlay is open. That matters because the
        panel is the mounted holder of `project-cover-<slug>`, and the overlay's
        reverse morph on close projects back onto it. A document-level listener
        would have made "press Escape twice quickly" a way to strand that morph.
      */
      onClick={collapse}
      onKeyDown={(event) => {
        if (event.key === "Escape" && activeSlug) {
          event.stopPropagation();
          collapse();
        }
      }}
      className="relative h-[540px]"
    >
      {/*
        `aria-hidden` ON THE LIST, NOT ONLY ON THE FIVE BUTTONS.

        Each `FanCard` already takes `aria-hidden` and `tabIndex={-1}` while a
        panel is open, which removes the CONTROLS — but not the `<ul>` and not
        the five `<li>` wrappers around them. A screen reader therefore
        announced "list, 5 items" followed by five EMPTY items, beside an open
        panel that is the only thing on screen. Hiding the list itself collapses
        the whole subtree in one place.

        THE PER-CARD `aria-hidden` STAYS RATHER THAN BEING REPLACED BY THIS.
        `tabIndex={-1}` is still needed on each button (an `aria-hidden`
        ancestor removes an element from the accessibility tree but does NOT
        make it unfocusable), and keeping the two together is what guarantees
        the "no focusable descendant inside `aria-hidden`" rule holds by
        construction rather than by reading two attributes in two files.

        The rail is the replacement navigation while the panel is open, and it
        is a real `<nav>` with all five names in it — so nothing is lost from
        the accessibility tree here, it moves.
      */}
      <ul aria-hidden={activeSlug !== null ? true : undefined}>
        {projects.map((project, index) => (
          <FanCard
            key={project.slug}
            project={project}
            index={index}
            isActive={project.slug === activeSlug}
            anyActive={activeSlug !== null}
            onExpand={() => setActiveSlug(project.slug)}
            buttonRef={(node) => {
              cardRefs.current[project.slug] = node;
            }}
          />
        ))}
      </ul>

      <AnimatePresence>
        {activeProject ? (
          <DeckPanel
            key="deck-panel"
            project={activeProject}
            onClose={collapse}
            panelRef={panelRef}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeProject ? (
          <DeckRail
            key="deck-rail"
            projects={projects}
            activeSlug={activeProject.slug}
            onSelect={setActiveSlug}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE MOBILE STACK — below `xl`
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * **MOBILE IS NOT A SHRUNK FAN. MOBILE IS THE DESKTOP'S EXPANDED STATE,
 * PERMANENTLY.** One project is open at a time, fully readable, with the rest
 * stacked behind it — which is exactly what the panel plus the index rail is.
 * Same concept, two layouts. That is what makes this parity rather than a
 * fallback.
 *
 * THE FAN IS NOT AVAILABLE HERE AND THAT IS ARITHMETIC, NOT A CONCESSION. At
 * 768px the content box is 658px, so a five-card fan gets 111px of exposed strip
 * per card — below the 180px title-legibility floor derived on `DECK_MAX_CARDS`,
 * at any type size. One adaptation covering 320–1279 is better than three
 * progressively worse fans.
 *
 * THE CARD IS NOT A TAP TARGET; ITS BUTTONS ARE. A card that both drags and
 * navigates on tap misfires constantly.
 *
 * NO WRAP. At index 0 a right-swipe rubber-bands back; at the last index a
 * left-swipe does. A carousel that wraps hides where the list ends.
 *
 * SETTLE IS `SPRING`, the same fourth curve family the fan uses — this is the
 * same interaction at another orientation, and giving it a different curve would
 * make the two read as two components.
 *
 * REDUCED MOTION: **drag is NOT disabled.** Removing an input is not a
 * reduced-motion accommodation. `MotionConfig reducedMotion="user"` drops the
 * settle transform and the card snaps, which is the correct behaviour.
 */
function DeckStack({ projects }: { projects: readonly DeckProject[] }) {
  const [front, setFront] = useState(0);
  const [direction, setDirection] = useState(1);
  const groupId = useId();

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * A SWIPE THAT STARTS ON A BUTTON MUST NOT ALSO ACTIVATE THAT BUTTON.
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * The card is `drag="x"` and the action row (`Details` / `GitHub` /
   * `Live Site`) sits inside it, so a thumb that lands on `Details` and swipes
   * is a plausible gesture rather than a contrived one. Framer's drag does not
   * cancel a descendant's click: the anchor translates WITH the finger, so
   * `pointerdown` and `pointerup` resolve to the same element and the browser
   * dispatches a real `click` at the end of the swipe. On this card that means
   * a swipe can open a project overlay or a new tab.
   *
   * **SUSPECTED RATHER THAN OBSERVED — no browser was available in the session
   * this guard was written in.** It is added anyway because the guard is inert
   * unless a drag actually happened, so the cost of being wrong is zero and the
   * cost of being right is a misfired navigation on the most common mobile
   * gesture on this page. **Confirm it in the §7 browser pass**, on a real touch
   * device: swipe starting on `Details`, and a plain tap on `Details`.
   *
   * `onDragStart` IS THE RIGHT SIGNAL AND A POINTER-DISTANCE CHECK WOULD NOT BE.
   * Motion fires it only once its own drag threshold has been crossed, so a tap
   * that wobbles a pixel or two never sets this and is unaffected. A hand-rolled
   * threshold here would be a second, differently-tuned copy of a number Motion
   * already owns.
   *
   * IT IS CLEARED ON `pointerdown`, NOT ON `dragEnd`. `click` fires AFTER
   * `dragEnd`, so clearing there would clear the flag before the thing it exists
   * to block. The next gesture's `pointerdown` is the first moment it is safe.
   */
  const draggedRef = useRef(false);

  const go = useCallback(
    (next: number, dir: number) => {
      if (next < 0 || next >= projects.length) return;
      setDirection(dir);
      setFront(next);
    },
    [projects.length],
  );

  const onDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info;
      if (offset.x < -SWIPE_DISTANCE_PX || velocity.x < -SWIPE_VELOCITY) {
        go(front + 1, 1);
      } else if (offset.x > SWIPE_DISTANCE_PX || velocity.x > SWIPE_VELOCITY) {
        go(front - 1, -1);
      }
    },
    [front, go],
  );

  const project = projects[front];

  return (
    <div>
      {/* `relative` is what the two peek slabs position against, and it is what
          `mode="popLayout"` needs in order to take the exiting card out of flow
          without collapsing the container. The container's height is the FRONT
          CARD's height — no `h-[...]`, no `min-h`, so a longer one-liner grows
          the card instead of being clipped. */}
      <div className="relative w-full max-w-[57rem]">
        {/* THE TWO PEEK SLABS ARE EMPTY AND `aria-hidden`. They are the edges of
            the cards behind, and edges are all a stack shows. Rendering the real
            next cards behind would put two more copies of every title in the
            DOM for a 13px sliver of visible surface.

            They peek ABOVE, not below, so the stack does not fight the pager
            underneath it. Same chrome as the front card — `bg-elevated`, 1px
            `accent-working/30`, square, NO shadow. A stack's depth comes from
            scale and offset; that is the whole point of a stack. */}
        {[1, 2].map((depth) =>
          front + depth < projects.length ? (
            <div
              key={depth}
              aria-hidden="true"
              className="absolute inset-0 border border-accent-working/30 bg-elevated"
              style={{
                /*
                  `transformOrigin: "top center"` IS LOAD-BEARING AND THE DESIGN
                  BRIEF'S TABLE DOES NOT WORK WITHOUT IT.

                  §H.1 specifies scale 0.94 / 0.88 with y −13 / −26 and says the
                  cards peek ABOVE the front one. With the DEFAULT centre origin
                  they do not peek at all: scaling by `s` moves a box's top edge
                  DOWN by `H(1 − s) / 2`, and this card is ~624px tall at 375px
                  (measured: cover 137 + numeral + a 2-line title + a 4-line
                  one-liner + 3 rows of tags + 2 rows of buttons + `p-md` × 2).
                  That is 18.7px for 0.94 and 37.4px for 0.88 — both LARGER than
                  the 13 and 26 the brief moves them back up by, so both slabs
                  end up entirely behind the front card and the stack renders as
                  a single card. The taller the card, the worse it gets.

                  With the origin at the top, the scale leaves the top edge where
                  it is and the translate is the whole offset: the slabs show
                  exactly 13px and 26px, which is what the table intended. X
                  still scales about the centre, so each slab is inset ~9px and
                  ~19px on both sides — the narrowing that makes it read as
                  depth.

                  The rotation then pivots about that same top-centre point, so
                  the visible edge tilts (±4px across the width) instead of the
                  card swinging as a whole. That is the right pivot for an edge
                  you can only see 13px of.
                */
                transformOrigin: "top center",
                transform:
                  depth === 1
                    ? "translateY(-13px) scale(0.94) rotate(-1.5deg)"
                    : "translateY(-26px) scale(0.88) rotate(2deg)",
                zIndex: depth === 1 ? 2 : 1,
              }}
            />
          ) : null,
        )}

        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.article
            key={project.slug}
            custom={direction}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            // See `draggedRef` above. Capture phase, so React's synthetic
            // dispatch stops before it reaches the anchor's own `onClick` —
            // which is what `next/link` navigates from — and `preventDefault`
            // covers the two `ExternalLink` anchors, whose navigation is the
            // browser's default rather than a handler.
            onPointerDownCapture={() => {
              draggedRef.current = false;
            }}
            onDragStart={() => {
              draggedRef.current = true;
            }}
            onClickCapture={(event) => {
              if (!draggedRef.current) return;
              event.preventDefault();
              event.stopPropagation();
            }}
            variants={CARD_SWIPE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SPRING}
            aria-labelledby={`${groupId}-title`}
            className="relative z-[3] flex touch-pan-y flex-col border border-accent-working/30 bg-elevated p-md"
          >
            <DeckCover
              cover={project.coverImage}
              /*
                THE CARD IS `w-full max-w-[57rem]` AND ITS PADDING IS `p-md`
                (21px each side), so the cover slot is the card width minus 42.
                57rem is the site's existing image width cap (`ProjectDetail`'s
                `imageWidthCap()` and the gallery's grid cap both use it) — not a
                new number. Branch by branch:
                  >=1024  spine inset 89x2, card capped at 912 -> slot <= 870
                  640-1023 inset 55x2, card <= 912             -> 100vw - 152
                  <640     inset 21x2                          -> 100vw - 84
              */
              sizes="(min-width: 1024px) 870px, (min-width: 640px) calc(100vw - 152px), calc(100vw - 84px)"
            />
            <p className="mt-md text-caption font-mono text-fg/70">
              {numeral(front)}
            </p>
            {/* `<h2>`, matching the fan — see `FanCard`. Only one of the two
                branches is ever in the accessibility tree, because the other is
                `display: none`. */}
            <h2 id={`${groupId}-title`} className="mt-xs text-h4 text-fg">
              {project.title}
            </h2>
            <p className="mt-sm text-body text-fg">{project.oneLiner}</p>
            <div className="mt-md">
              <DeckStackTags stack={project.stack} />
            </div>
            <div className="mt-lg">
              <DeckActions slug={project.slug} links={project.links} />
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {/*
        THE PAGER — FIVE NUMERALS, NOT DOTS AND NOT ARROWS.

        This is the desktop index rail rotated: same component idea, same ink
        rules, names visible on desktop and `sr-only` here. It is not the generic
        dot row, it gives one-tap access to ANY project (arrows do not), and it
        is the mouse and keyboard path at 1024–1279 where there is no swipe.

        Every cell is 44 x 44. Footprint at 360px: 5 x 44 + 4 x 13 = 272 <= 318. ✓
      */}
      <nav aria-label={DECK_RAIL_LABEL} className="mt-lg">
        <ul className="flex gap-sm">
          {projects.map((entry, index) => {
            const isActive = index === front;
            return (
              <li key={entry.slug}>
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => go(index, index > front ? 1 : -1)}
                  className={`inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-caption font-mono transition-[color] duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-working ${
                    isActive ? "text-accent-working" : "text-fg/70"
                  }`}
                >
                  {/* The numeral takes its meaning from its position in a row,
                      so it is hidden and the project's own title is what gets
                      spoken. Same device as the `+n` marker above. */}
                  <span aria-hidden="true">{numeral(index)}</span>
                  <span className="sr-only">{`${DECK_PAGER_ITEM_PREFIX}${entry.title}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export function ProjectDeck({ projects }: { projects: readonly DeckProject[] }) {
  if (projects.length > DECK_MAX_CARDS) {
    /*
      A THROW, NOT A `.slice(0, 5)` AND NOT A `console.warn`.

      `/work` is a statically prerendered route, so this fires during
      `next build` and turns a sixth project into a RED BUILD — which is the
      entire point. Truncating would silently drop a project off the page Saad
      just added it to; warning would scroll past in a build log. The arithmetic
      that makes five the ceiling is on `DECK_MAX_CARDS` above, and the message
      points at it rather than restating it wrongly.
    */
    throw new Error(
      `ProjectDeck: the fan holds at most ${DECK_MAX_CARDS} cards and was given ${projects.length}. ` +
        "A sixth card needs a spacing of <=168.8px at the 1280px content box, which is below the " +
        "180px title-legibility floor. See DECK_MAX_CARDS in components/sections/ProjectDeck.tsx " +
        "for the full arithmetic and the two honest ways out.",
    );
  }

  return (
    <>
      {/* Two subtrees, switched by CSS so first paint is correct at every width
          with no JavaScript. See this file's header for the full cost
          accounting, including why only one of them carries a `layoutId`. */}
      <div className="hidden xl:block">
        <DeckFan projects={projects} />
      </div>
      <div className="xl:hidden">
        <DeckStack projects={projects} />
      </div>
    </>
  );
}

export default ProjectDeck;
