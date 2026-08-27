import {
  EXTERNAL_LINK_ON_HERO_MUTED,
  ExternalLink,
} from "@/components/ui/ExternalLink";
import { LinkPreview } from "@/components/ui/link-preview";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { MonogramMark } from "@/components/ui/MonogramMark";
import {
  CONTACT_CLOSING_LINE,
  CONTACT_COPYRIGHT_LINE,
  CONTACT_HEADING,
  REVEAL_FOOTER_SENTINEL_ID,
} from "@/components/sections/contactContent";
import { contact } from "@/content/contact";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import { FONT_SIZE_UNITS } from "@/components/ui/textHoverEffectMetrics";

/**
 * The reveal footer — Phase 5's curtain, and the end of the document.
 *
 * IT ABSORBED `Contact.tsx`, whose header was a decision record rather than
 * commentary. Everything that file settled is INHERITED HERE UNCHANGED and is
 * repeated below rather than linked, because the file it lived in is gone. The
 * curtain changed this component's GEOMETRY and added TWO content atoms (a mark
 * and a year). It changed nothing else.
 *
 * 2026-08-23 CHANGED THE GEOMETRY AGAIN — the plate is now `md:min-h-dvh` — and
 * added a THIRD content atom, the `SAAD` wordmark, which took over the stamp's
 * closing slot and demoted the mark and year into a single 21px row above it.
 * Both reversals are recorded in place below, in the past tense, rather than
 * being deleted: the viewport-unit ban and the stamp's "not beside it, below
 * it" argument.
 *
 * -------------------------------------------------------------------------
 * THE MECHANIC: `position: sticky; bottom: 0`, NOT `position: fixed`.
 * -------------------------------------------------------------------------
 * `docs/07_SITE_RESTRUCTURE.md` §5 asks for a footer that "sits fixed beneath
 * the page at a lower z-index" so "the last section's content wipes up off it".
 * That describes the EFFECT. `sticky` delivers the identical effect and solves,
 * for free, the two problems §5 itself flags. Rule S-6 in
 * `docs/03_FRONTEND_SPEC.md` is the tracked version of what follows.
 *
 * Three declarations do the whole job — `relative z-0 md:sticky md:bottom-0` on
 * the root, plus `bg-base relative z-10` on the page stack at both call sites.
 * THERE IS NO JAVASCRIPT HERE: no scroll listener, no ScrollTrigger, no
 * ResizeObserver, no measured height, no CSS variable, no negative margin.
 *
 * WHY THAT MATTERS MORE THAN IT SOUNDS: A STICKY ELEMENT OCCUPIES ITS NORMAL
 * FLOW BOX IN FULL. Sticky is the one positioning scheme that does not remove
 * the element from flow — its offset is a paint-time shift, not a layout
 * change. So `document.scrollHeight` is UNCHANGED by the mechanic, exactly 0px
 * of delta, and `ScrollTrigger.refresh()` is NOT REQUIRED. Do not add one "to
 * be safe": a refresh recomputes every trigger on the page and, landing
 * mid-scroll, can visibly re-snap a scrubbed section. §5's implementation flag
 * was written against the NEGATIVE-MARGIN technique, which this rejects, and
 * has been amended in that doc to say so.
 *
 * With `bottom: 0` the browser holds the element's bottom margin edge at the
 * viewport's bottom edge, CLAMPED so the element never leaves its containing
 * block. This footer is the last child of `<body>`, so its containing block
 * ends exactly where its own flow box ends:
 *
 *   - Scrolled anywhere above the end, the plate is pinned at the viewport
 *     bottom, fully occluded by the page stack's opaque `bg-base` at z-10.
 *   - Approaching the end, the page scrolls up off the pinned plate at 1:1.
 *     THE PLATE NEVER MOVES. Travel is 0px. That is the wipe.
 *   - At the end the static position catches up and the element un-sticks at
 *     exactly the coordinates it was already at. NO JUMP, because there is no
 *     offset to release.
 *
 * THE SHORT PAGE IS STRUCTURALLY IMPOSSIBLE TO GET WRONG, which is the single
 * strongest reason to prefer this over `fixed`. A sticky offset may only move
 * an element WITHIN its containing block, so the browser is forbidden from
 * pushing this down toward a viewport bottom that sits below it. A page that
 * does not scroll clamps the plate flush under the last section — no gap, no
 * floating bar, no check needed. A page that barely scrolls shows a sliver of
 * the plate's BOTTOM at rest, which is the signature, which is the one element
 * in the composition designed to be read out of sequence.
 *
 * WHAT MUST NEVER BE PUT ON ANY ANCESTOR OF THIS ELEMENT: `overflow: hidden`,
 * `overflow: clip`, `overflow: auto`, a `transform`, a `filter`, a
 * `perspective`, `will-change: transform`, or `contain: paint`. Each either
 * creates a new containing block for sticky (the pin dies) or a clipping
 * context (the plate is cut), silently. Two live cases were checked and are
 * safe: `globals.css`'s three scroll locks land on `<html>` and only while an
 * overlay/intro/menu is up, when the page is not being scrolled anyway; and
 * `LenisProvider` runs Lenis in `root` mode, which drives the document scroller
 * and renders NO wrapper element. LENIS IN `wrapper`/`content` MODE WOULD
 * TRANSLATE A WRAPPER, MAKING IT THE STICKY CONTAINING BLOCK AND KILLING THIS
 * SILENTLY. Never pass those options.
 *
 * -------------------------------------------------------------------------
 * BELOW 768px THERE IS NO CURTAIN, and it is one responsive class.
 * -------------------------------------------------------------------------
 * `relative z-0 md:sticky md:bottom-0` — same DOM, same content, no branch, no
 * JS height check. Four reasons in order of weight:
 *
 *   1. THE PLATE IS TALLER THAN THE VIEWPORT ON A PHONE (~700px at 360x640). A
 *      sticky-bottom element taller than its scrollport pins with its top cut
 *      off, and the "reveal" becomes a crawl over content that can never be
 *      seen whole.
 *   2. It adopts the floor the site already has. `docs/03`'s scroll-scrub
 *      subsection: "Below 768px there is no scrub... Two behaviours site-wide —
 *      the site's reveal, and Home's desktop scrub — never a third
 *      mobile-specific one." The curtain taking the same 768px floor keeps the
 *      count at two.
 *   3. iOS Safari's collapsing address bar resizes the visual viewport during
 *      momentum scroll. Sticky handles it natively, but the exposed height
 *      would then breathe by ~60px while the visitor is not scrolling — jitter
 *      on the one surface that is supposed to be still.
 *   4. In portrait the revealed strip is nearly square and reads as a panel,
 *      not a curtain.
 *
 * -------------------------------------------------------------------------
 * IT IS A <footer>, A SIBLING OF <main>, NOT A SECTION INSIDE IT.
 * -------------------------------------------------------------------------
 * A <footer> whose nearest ancestor is <body> is the `contentinfo` landmark,
 * and author identification plus links to related documents is the textbook
 * content of that landmark. THE TRAP: a <footer> nested inside <main> is scoped
 * to <main> and is not a landmark at all. Nothing errors, nothing looks
 * different, and the entire benefit silently evaporates. NEITHER `fixed` NOR
 * `sticky` MOVES AN ELEMENT IN THE ACCESSIBILITY TREE, so the curtain is a
 * positioning change and not a nesting change — the landmark survives it
 * intact. EXACTLY ONE `contentinfo` PER PAGE; both call sites comply.
 *
 * `/about` HAS ZERO `contentinfo` LANDMARKS AS A RESULT, and that is a decision
 * rather than an oversight. `docs/07` §5 scopes the curtain to Home and Work,
 * and §6 keeps About "deliberately the one fully quiet page"; About's CTA row
 * already carries GitHub and LinkedIn, so the INFORMATION is present and only
 * the landmark is not. Zero is valid HTML. The minimal fix, if it is ever
 * wanted, is a static non-curtain <footer> on that route — which would break
 * §6's framing, which is why it was not taken.
 *
 * NOTHING COMES AFTER THE LINKS EXCEPT THE STAMP AND THE SIGNATURE. No
 * copyright line, no colophon, no "built with": a copyright line states nothing
 * a visitor needs and nothing in dispute, and a stack brag is the wrong thing
 * on the one surface CLAUDE.md reserves for real links. `CurrentlyLearning`
 * owns the site's only freshness stamp. THE MARK + YEAR IS NOT A COPYRIGHT LINE
 * AND MUST NOT BECOME ONE — see the stamp's own comment below, which records
 * what changed about that argument when the two moved onto one row on
 * 2026-08-23.
 *
 * -------------------------------------------------------------------------
 * THE TWO ACCENTS, AND THE ONE ERROR THIS FILE IS MOST LIKELY TO CONTAIN.
 * -------------------------------------------------------------------------
 * `hero-accent` and `accent-hero` are NEAR-ANAGRAMS FOR DIFFERENT COLOURS, and
 * both directions of the swap render something plausible on a dark panel. THE
 * CURTAIN RAISES THAT RISK RATHER THAN LOWERING IT, because there is more DOM
 * on the plate now and the plate is on screen for far longer:
 *
 *   --color-hero-accent  #14B8A6 teal.  HAS utilities (`text-hero-accent`,
 *                        `outline-hero-accent`). 8.00:1 here. It is the
 *                        AFFORDANCE colour: links, the copy control and focus
 *                        rings, and nothing else on this panel.
 *   --accent-hero        #00E5FF cyan.  Has NO utilities, DELIBERATELY —
 *                        `text-accent-hero` / `bg-accent-hero` do not exist and
 *                        Tailwind renders nothing for an unknown utility rather
 *                        than erroring. It is a MARKER OF THE BEAT, never an
 *                        affordance. 12.96:1 here as a non-text graphic.
 *
 * NEVER `accent-working` ON THIS PANEL, and never `fg`, `on-accent`,
 * `elevated`, `tint-cool` or `tint-warm`. All six are theme-tuned and this
 * surface does not flip: `accent-working` becomes #0F766E in light mode, which
 * lands at ~3.6:1 here against 7.95:1 in dark — one affordance rendering at two
 * strengths for no reason anyone chose, visible only after a theme toggle. This
 * matters MORE now, not less: the plate is on screen for far longer.
 *
 * THE OPACITY FLOOR HERE IS `/70`, AND IT WAS RE-MEASURED RATHER THAN ASSUMED.
 * `/70` is the site floor because LIGHT MODE is the binding constraint — and
 * this surface has no light mode, so that reasoning does not transfer. Against
 * #07090C with #E8EAEC, re-measured 2026-08-22: full 16.53:1 (said 16.68),
 * `/70` 8.17:1 (said 8.21), `/50` 4.63:1 (said 4.60). All three moved because
 * all three descend from the same overstated base. The
 * arithmetic floor is `/50`. SHIP `/70` ANYWAY: one site-wide floor is worth
 * more than a correct-but-different second one, because the second floor is the
 * one a reviewer forgets exists.
 *
 * -------------------------------------------------------------------------
 * THE `Reveal` SEQUENCE IS RETIRED HERE, AT EVERY WIDTH, AND IT IS A REAL LOSS.
 * -------------------------------------------------------------------------
 * Three `Reveal`s at monotonic delays 0 / STAGGER.line / STAGGER.line * 2 used
 * to be one of the three things that made this the Tier 1 echo. A CURTAIN
 * CANNOT USE IntersectionObserver REVEALS: the plate is in the viewport from
 * FIRST PAINT, pinned at the bottom and occluded, so an IO with `Reveal`'s
 * hardcoded `amount: 0.1` fires immediately, behind the page, and the sequence
 * finishes before the visitor sees any of it. THE WIPE REPLACES THE SEQUENCE as
 * gesture #2. Retired at ALL widths, including below 768px where the reveals
 * would technically still work, because two site-wide motion behaviours is the
 * stated budget and it is already spent (the site's reveal + Home's desktop
 * scrub). Written down so nobody "restores" the reveals later and ships a
 * footer that animates in secret.
 *
 * So the three things that make this the SMALL Tier 1 echo are now: the
 * surface, the wipe, and one 34x3px cyan mark.
 *
 * THE SAAD WORDMARK ADDED ON 2026-08-23 IS A FOURTH ELEMENT, NOT A FOURTH
 * GESTURE, and the distinction is what keeps that count at three. It renders in
 * its RESTING STATE — no mount animation, no entrance, no scroll driver. Its
 * only motion is a cursor-following luminance reveal, which is authored by the
 * visitor's own hand and does not exist at all on a device with no hover. The
 * Aceternity component it was adapted from shipped a 4s `strokeDashoffset`
 * draw-on fired on MOUNT; that is the "animates in secret" defect this very
 * paragraph retired the three `Reveal`s for, and it was DELETED rather than
 * retimed — every trigger that would have retimed it correctly is a
 * scroll-position driver, which the list below bans.
 *
 * EXPLICITLY NOT, and each must stay absent: no R3F, no Canvas, no camera, no
 * `three` import, no GSAP, no ScrollTrigger, no parallax, no scroll-linked
 * value, no `useScroll`, no particle field, no glow, no blur, no box-shadow, no
 * radius (no token exists), no hover transform, no counter, no typewriter, no
 * marquee, and NO INFINITE OR REPEATING ANIMATION. The last one is sharper here
 * than it was: a pinned element at the bottom of the page is one the visitor
 * can sit on indefinitely BY CONSTRUCTION.
 *
 * THE GRADIENT BAN WAS NARROWED ON 2026-08-23, NOT DELETED. This list read "no
 * gradient FILL" and `text-hover-effect.tsx` §5 said "Nothing on screen is ever
 * a gradient: the wordmark is one flat colour at one of two strengths." The
 * second sentence is now false and both are amended in the same commit rather
 * than left contradicting the code, the same treatment the viewport-unit ban
 * got two paragraphs above.
 *
 * WHAT IS BANNED, RESTATED: no gradient on any SURFACE of this plate — no
 * gradient plate, no gradient panel, no gradient text fill. WHAT SHIPS: the
 * colour ramp of a 1.5px non-scaling STROKE, inside a cursor-following disc, on
 * the wordmark's reveal layer only, and no second one. It touches no surface,
 * exists only while a fine pointer rests on the wordmark, and is ~42px of
 * accent against the licensed bar's 102px.
 *
 * THE ONE-LINE TEST FOR A FUTURE READER: **a gradient that any visitor can see
 * without moving a pointer is still banned here.**
 *
 * -------------------------------------------------------------------------
 * THE VIEWPORT-UNIT BAN WAS REVERSED ON 2026-08-23. `md:min-h-dvh` NOW SHIPS.
 * -------------------------------------------------------------------------
 * THIS LIST READ "no `100dvh` / `min-h-screen` / any viewport-unit height —
 * NOT EVEN AS A `max-height`" UNTIL 2026-08-23, and `docs/03_FRONTEND_SPEC.md`
 * Rule S-6 said the same in two places. Saad asked for the plate to occupy a
 * full viewport so the curtain matches the hero's visual weight; the reversal
 * is deliberate and the prior reasoning is kept below in the past tense rather
 * than deleted, exactly as hide-on-scroll, the theme toggle and `/about`'s
 * route fade were each reversed on this project.
 *
 * WHAT THE BAN WAS ACTUALLY PROTECTING, AND WHY THAT SURVIVES. Two things:
 *
 *   1. THE Δ=0 GUARANTEE — "toggling the footer between `sticky` and `static`
 *      moves `scrollHeight` by 0px". That is a claim about the POSITIONING
 *      SCHEME, not about the height. Sticky is still the one scheme that does
 *      not remove an element from flow, so the sticky-vs-static delta is still
 *      exactly 0. RE-MEASURED WITH THE CLASS PRESENT rather than assumed:
 *      **0px in 32 of 32 cases** — `/` and `/work`, both themes, at 1440x900,
 *      1280x800, 1024x600, 768x1024, 360x640, 1366x768, 1280x720 and 2560x1440.
 *      Also re-measured: the plate's TRAVEL through a full reveal at 1440x900
 *      is still exactly 0px (top pinned at 0, bottom at 900, across the whole
 *      wipe), and it un-sticks at its static position to the pixel.
 *   2. THE 900px CEILING — "if the plate ever measures more than 900px at
 *      >=1024px, cut content; do not cap the box." AMENDED, in `docs/03` and
 *      below: THE CEILING NOW GOVERNS THE PLATE'S COMPOSED CONTENT HEIGHT, NOT
 *      ITS BOX HEIGHT. `min-h-dvh` sets a floor on the BOX; the content sits
 *      inside it and stays bounded by the same 900px. The rule's purpose is
 *      untouched — it exists to stop CONTENT growing until the reveal becomes a
 *      crawl over something that can never be seen whole, which is also reason
 *      1 of the below-768 carve-out. A box that is exactly one viewport tall
 *      can by definition always be seen whole.
 *
 *      MEASURED COMPOSED CONTENT. The plate was reworked twice on 2026-08-27
 *      and every figure below is a real capture, not arithmetic:
 *
 *      | viewport   | 08-23  | redesign | +h2, merged stamp | vs 900 | vs 768 |
 *      |------------|-------:|---------:|------------------:|-------:|-------:|
 *      | 1440x900   | 775.98 |   732.58 |        **681.78** | 218.22 |  86.22 |
 *      | 1280x800   | 775.98 |   732.58 |        **681.78** | 218.22 |  86.22 |
 *      | 1024x600   | 867.58 |   732.58 |        **681.78** | 218.22 |  86.22 |
 *      | 768x1024   | 833.58 |   866.97 |        **850.91** |  49.09 | -82.91 |
 *      | 360x640    | 811.36 |   782.56 |        **752.38** | 147.62 |  15.62 |
 *      | 1366x768   | 775.98 |   732.58 |        **681.78** | 218.22 |  86.22 |
 *      | 1280x720   | 775.98 |   732.58 |        **681.78** | 218.22 |  86.22 |
 *      | 2560x1440  | 775.98 |   732.58 |        **681.78** | 218.22 |  86.22 |
 *
 *      **THE `<h2>` WENT BACK TO `text-h2` AND COST THE PLATE 0px.** That is
 *      not luck and it is the one number worth understanding here. The heading
 *      grew 19.2 -> 74.8px, +55.6px — but it lives in the LEFT column of a
 *      two-column grid, and at 1440 the left column measures 158.39px against
 *      the link stack's 261.78px. The row's height is the taller of the two, so
 *      the heading spent 55.6px of slack that was already being paid for.
 *      **A grid row is only as tall as its tallest child, so growth in the
 *      shorter column is free until it overtakes the other one** — there is
 *      103.39px of that headroom left at 1440, and the moment it runs out the
 *      next pixel costs a pixel.
 *
 *      THE 50.8px THAT DID COME OFF is the stamp merge: a `mt-2xl` block with a
 *      21px mark row, then a rule, then a 17px copyright line, became one rule
 *      and one row. `contactContent.ts` carries why.
 *
 *      768x1024 IS STILL THE BINDING CASE and still the only one that stacks
 *      the columns, so it is the only one where the heading's 55.6px would be
 *      real — and it fell anyway, by 16.06px, because the merge is worth more.
 *      It sits 49.09px under the ceiling. **If anything is added to this plate,
 *      measure 768x1024 first.**
 *
 *      IT SHIPPED OVER THE CEILING ONCE, EARLIER THE SAME DAY: the redesign's
 *      first version used a flat `gap-2xl` between the columns and measured
 *      900.97px at 768x1024 — 0.97px over — in all four route/theme cases. The
 *      gap is `gap-xl lg:gap-2xl` now, 55px stacked and 89px side by side,
 *      which are the values the composition already used on each axis. Nothing
 *      was cut to fix it.
 *
 * -------------------------------------------------------------------------
 * THE 768-TALL RESIDUAL IS RESOLVED. THIS SECTION USED TO RECORD IT AS
 * "KNOWN, ACCEPTED".
 * -------------------------------------------------------------------------
 * IT READ: "KNOWN, ACCEPTED RESIDUAL: 775.98px DOES NOT FIT A 768-TALL
 * VIEWPORT. The design brief budgeted 763.4px and called 1366x768 the binding
 * case with 4.6px of headroom. MEASURED IT IS 775.98px — 7.98px OVER — so at
 * 1366x768 (and 55.98px over at 1280x720) the plate is taller than the
 * scrollport and pins with its top cut off."
 *
 * **AT 681.78px IT FITS, WITH 86.22px OF HEADROOM AT 1366x768** and it clears
 * 1280x720 too. It first cleared at 732.58px / 35.4px earlier the same day; the
 * stamp merge took it further. That was not the goal of the 2026-08-27 redesign — Saad asked
 * for a two-column layout and an ambient watermark — and it is recorded as a
 * consequence rather than claimed as a fix. The lever that did it is the one
 * the old section did NOT name: taking the wordmark out of flow. The two levers
 * it did name are both still unspent and still available:
 *
 *   1. `pb-3xl` -> `pb-2xl` saves 55px. This file already names that exact edit
 *      as the sanctioned fix for a DIFFERENT symptom (empty plate reading as
 *      nothing in dark mode). Spending it here would retune a value against a
 *      problem it was not chosen for.
 *   2. `STAMP_MARK_PX` 21 -> 17 saves 4px, and it would shrink a mark that was
 *      demoted once already and put it exactly on the 17px legibility floor.
 *
 * IF THE COMPOSITION EVER GROWS AGAIN, 768 IS THE NUMBER TO CHECK FIRST, and
 * the 12.58px the original brief mis-budgeted is worth keeping: the link list
 * took `lg:mt-2xl` (89px) rather than the 55px assumed, the closing line sets
 * on ONE line rather than two, and `text-caption`'s line-height is 1.4 rather
 * than 1.6. Two of those cut the other way; the net was +12.58.
 *
 * THE SEPARATE NUMBER, DECLARED HERE RATHER THAN DISCOVERED LATER: the document
 * DOES get taller. `min-h-dvh` grows `document.scrollHeight` by
 * `max(0, viewportHeight − composedContentHeight)`. RE-DERIVED 2026-08-27
 * against the redesigned composition, because the shorter the content the MORE
 * the floor grows: **+167px** at 1440x900, **+67px** at 1280x800, **+157px** at
 * 768x1024, **+707px** at 2560x1440, **+35px** at 1366x768, and **0px** at
 * 1024x600, 1280x720 and 360x640, where the content is already taller than the
 * viewport (or the `md:` gate is off). It was +124 / +24 / +190 / +664 / 0
 * against the 775.98px composition. **`document.scrollHeight` at 1440x900 is
 * unchanged to the pixel either way** — 5621 before, 5621 after, on `/` —
 * because the floor absorbs exactly what the content gave up. That
 * growth lands entirely AFTER `<main>`'s last child, so no section's own
 * top/bottom moves and every `end: "bottom bottom"` (which is element-relative
 * — `ScrubReveal.tsx`) resolves where it did. The only geometric effect is
 * RUNWAY, and a taller footer gives the last scrubbed unit on `/` more of it,
 * never less. If a trigger is ever added that resolves its `end` against the
 * document or `body` rather than a section, it moves by that delta — that is
 * the one thing to check.
 *
 * `min-h`, NOT `h`: at 1024x600 the plate's natural content is taller than the
 * viewport, and `h-dvh` would clip it. `min-h` only ever grows the box.
 * `md:`-GATED AT THE CURTAIN'S OWN BREAKPOINT: below 768px there is no curtain
 * and the plate is already taller than a phone viewport, so `min-h-dvh` there
 * would append up to a full empty viewport of plate to the bottom of every page
 * on a phone for a curtain that does not exist. ONE BREAKPOINT GOVERNS BOTH THE
 * PIN AND THE HEIGHT — if they ever diverge they are describing different
 * things.
 *
 * THE FLEX LIVES ON THE `<footer>`, NOT ON THE SPINE CONTAINER, and that is a
 * correction to the design brief rather than a preference. `justify-end` on the
 * spine container is a NO-OP: free space in a column flex container is
 * distributed by the container, and the spine div is the item. Putting it on
 * the footer also keeps the S-1 spine string byte-identical to the twelve other
 * sections', which is what the brief wanted from placing the height on the
 * footer in the first place.
 *
 * `justify-end` AND NOT `justify-between`: the slack has to go somewhere, and
 * at 2560x1440 there is ~650px of it. Distributed between the groups, the
 * composition's internal rhythm would become a function of viewport HEIGHT —
 * a viewport-unit layout by another name. Pooled at the BOTTOM (the default),
 * the first thing the curtain reveals is empty plate, and in dark mode the
 * occlusion edge measures 1.01:1 and is invisible, so the curtain would open on
 * a band of apparent nothing — the exact failure that put the stamp at the
 * bottom. `justify-end` puts the slack at the TOP where it is unpainted, and
 * the composition's internal spacing is then fixed at every viewport height.
 *
 * NO PARALLAX ON THE PLATE, and that is a concept decision rather than a budget
 * one. The standard version of this pattern moves the footer up at ~50% of
 * scroll speed and lets it settle. It contradicts the brief's own sentence: the
 * footer is supposed to read as HAVING BEEN THERE BEHIND THE SCREENS THE WHOLE
 * TIME, and a plate that drifts as it appears did not arrive early — it is
 * arriving now. It is also the single most recognisable "premium template"
 * footer in the genre, and it would reintroduce the scroll-linked value the
 * zero-delta guarantee depends on not having.
 *
 * HOW THE CONTENT'S HEIGHT IS BOUNDED: compositionally, and this is unchanged
 * by `md:min-h-dvh` — the class sets a floor on the BOX, and everything below
 * is about what goes IN it. The composed content is the sum of nine known
 * spacing values. The three things that could grow it are more `contact`
 * entries (which wrap into the existing flex row, adding one ROW height per
 * wrap, not one per entry), a longer closing line (capped by `max-w-[34rem]`)
 * and a taller wordmark (`WORDMARK_HEIGHT` below, which is capped by the
 * SHORTEST supported viewport, not the tallest).
 *
 * THE RULE, AMENDED 2026-08-23: if the plate's COMPOSED CONTENT ever measures
 * more than 900px at >=1024px, THE FIX IS TO CUT CONTENT, NOT TO CAP THE BOX.
 * It said "the plate's measured height" until the box acquired a viewport-unit
 * floor, at which point the box height at >=1024px is 900px or more BY
 * CONSTRUCTION and the rule as written was violated the moment the class
 * landed. `docs/03` Rule S-6 carries the same amendment.
 *
 * -------------------------------------------------------------------------
 * REDUCED MOTION: THE CURTAIN DOES NOT CHANGE, AND THAT IS DELIBERATE.
 * -------------------------------------------------------------------------
 * The distinguishing feature of parallax is DIFFERENTIAL RATES. Here there is
 * exactly one rate: the page moves 1:1 with the visitor's scroll, as every page
 * does, and the plate's rate relative to the viewport is zero. NOTHING ON
 * SCREEN MOVES AT A SPEED THE VISITOR DID NOT AUTHOR. There is no `transition`,
 * no `transform`, no `animation`, no duration, no easing curve, no
 * scroll-linked value and no rAF in this component — there is nothing to
 * disable. By exactly this test a `position: fixed` navbar and a sticky table
 * header are also not motion, and this site already ships the former on every
 * route with no reduced-motion branch.
 *
 * The second reason is about correctness rather than taste: a reduced-motion
 * branch here would have to change `position`, which changes layout, which
 * changes `document.scrollHeight` — giving two classes of visitor different
 * document heights and different resolved `end` values for the same nine
 * ScrollTriggers. A MEDIA QUERY THAT FORKS PAGE GEOMETRY IS A MUCH LARGER
 * INTERVENTION THAN REDUCED MOTION IS SUPPOSED TO BE.
 *
 * What does respect reduced motion here, inherited for free: the copy control's
 * label swap drops its 115% travel to 0% and cross-fades in place at
 * `DURATION.micro`. The confirmation is never removed, only the travel. If a
 * real visitor ever reports discomfort, the correct branch is
 * `@media (prefers-reduced-motion: reduce) { footer { position: static } }` —
 * take the geometry divergence knowingly and screenshot both. NOT a fade, NOT a
 * shorter travel, and above all NOT an opacity ramp: a composited wrapper over
 * `text-hero-fg/70` multiplies it below the floor, and `docs/03` puts the floor
 * on RENDERED alpha, not on the token.
 *
 * -------------------------------------------------------------------------
 * SPINE AND SEAM.
 * -------------------------------------------------------------------------
 * RULE S-1 HOLDS BYTE-IDENTICALLY inside the full-bleed plate: the same
 * `mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl` the shipped sections
 * use and the same one the hero uses inside ITS full-bleed dark plate. Holding
 * the spine inside the panel is the main thing that stops this reading as a
 * bolted-on footer bar. Nothing is centred, nothing is right-aligned; the void
 * stays on the right. The cyan bar, the heading, the closing line, the list and
 * the stamp all share one vertical line, and THAT LINE IS WHAT MAKES THE FIRST
 * REVEALED SLIVER LEGIBLE AS PART OF THE PAGE rather than as a new surface.
 *
 * THE TRAP, NAMED: S-1 has a CHROME CARVE-OUT (reversed 2026-08-21 per
 * `docs/07` §1) giving the navbar a two-value inset instead of the spine ramp.
 * A reviewer who sees `position: sticky` here may reason "it is pinned,
 * therefore it is chrome, therefore it takes the carve-out." IT IS NOT CHROME.
 * The carve-out exists because the navbar is a fixed overlay that must not
 * track a scrolling column; THIS PLATE IS THE COLUMN, temporarily pinned. It
 * takes the spine.
 *
 * RULE S-2 DOES NOT APPLY AT THE TOP, under S-2's own explicit permission ("The
 * Contact section may set its own vertical rhythm, and must say so where it
 * does") — recorded in `docs/03_FRONTEND_SPEC.md` as that rule requires. This
 * is the hero's hard colour edge MIRRORED, so it pays exactly what About's
 * opening pays: `pt-2xl sm:pt-3xl`, giving 89 + 144 = 233px across the seam at
 * 640px and up (89 + 89 = 178px below it). THE CURTAIN CREATES NO NEW SEAM —
 * when the plate is fully exposed the relationship is the same static one, so
 * no amendment to S-2 was needed and none should be written. NO GRADIENT FADE,
 * for the hero's reason (near-black to warm-white gradients muddy both colours
 * and are a recognisable hero-fadeout trope) and now for a mechanical one too:
 * during the reveal the "seam" is an OCCLUSION EDGE, and a gradient on the
 * plate's top edge would slide out from under the page as a visible smear
 * rather than staying put.
 *
 * THE OCCLUSION EDGE IS NOT A SEAM AND MUST NOT BE DRESSED LIKE ONE. No shadow
 * under the lifting page, no hairline on the plate's top edge, no scrim. A drop
 * shadow under a lifting page is the genre-standard treatment and is precisely
 * the tell. Measured, the edge is `bg-base` against the plate: 19.45:1 in light
 * mode and 1.01:1 in DARK, the site's default — so IN DARK MODE THE EDGE IS
 * INVISIBLE and the reveal is carried entirely by content entering the strip.
 * That is accepted, not fixed, and it is what determined the arrangement below.
 * Every fix costs more than the problem: a shadow is banned and is the tell, a
 * cyan/teal hairline breaks "one cyan mark" and CLAUDE.md forbids cyan as a
 * hairline near `bg-base` by name, lightening the plate destroys the two-plate
 * rhyme that makes the Tier 1 echo read as a system, and darkening `bg-base` is
 * a site-wide token change to fix one 700px stretch.
 *
 * At the BOTTOM, S-2 does not apply and never did — there is no neighbour
 * below. The bottom padding is symmetric with the top because a plate with a
 * short bottom reads as content that got cut off.
 *
 * -------------------------------------------------------------------------
 * NO `.length` READ ANYWHERE IN THIS FILE.
 * -------------------------------------------------------------------------
 * Not a gate, not a branch, not a conditional class. The list is a column that
 * becomes a WRAPPING row at 640px and up, so n = 1, n = 2 and n = 4 are one
 * code path. No grid with a fixed column count, no `justify-between` (which
 * visibly redistributes when n changes), no separator glyphs. Adding a link is
 * an edit to `content/contact.ts` and nothing here changes.
 */

/**
 * The stamp's mark, in CSS pixels — `--spacing-md` on the Fibonacci scale, ONE
 * VALUE AT EVERY BREAKPOINT.
 *
 * DEMOTED FROM 34px (`--spacing-lg`) ON 2026-08-23, and the demotion is what
 * pays for the wordmark below it. Saad's instruction was that "the existing MS
 * mark + year stamp stays as a smaller, secondary detail, not competing with
 * the name for primary visual weight", and a 34px mark directly above a 144px
 * wordmark would have read as two competing marks rather than as a stamp
 * lockup. The design brief gave a 17–21px range; 21px is taken because it is an
 * actual value on the spacing scale and because 17px is the legibility FLOOR
 * (`MIN_HEIGHT_PX` in `msMarkGeometry.ts`) — sitting a shipped size exactly on
 * a floor leaves nothing for a future engine or DPR to give back.
 *
 * At 21px the **S's** 44-unit gap — the tightest clear air anywhere in the mark
 * — holds with 2.89px of it (44 x 21 / 320, against 2.34px at the 17px floor).
 * At the 592x320 viewBox the stamp renders 38.9px wide, comfortable inside the
 * 318px of content available at a 360px viewport.
 *
 * THE DERIVATION UNDER THE OLD 34px WAS WRONG AND THE CORRECTION IS KEPT. It
 * read "the M's 44-unit bar gap holds with ~4.2px of clear air". The M is ONE
 * polygon and has no bar gaps — that was the THREE-BAR faceted M, whose gap was
 * 40 units. Both `Navbar.tsx` and `msMarkGeometry.ts` record the S as what
 * binds, and `docs/07` §2.1 records fixing this identical dead derivation
 * elsewhere. The sentence above points at the constraint that actually governs
 * it, so this resize was measured against the right gap.
 *
 * NO BREAKPOINT RAMP, deliberately: a mark that grows with the viewport reads
 * as a logo lockup rather than as a stamp.
 *
 * A NUMBER AND NOT A CLASS because `MonogramMark` takes `size` as a prop and
 * turns it into an inline height with `width: auto` — the viewBox does the
 * rest.
 */
const STAMP_MARK_PX = 21;

/**
 * THE WORDMARK'S STRING AND ITS ADVANCE, DELIBERATELY ADJACENT — CHANGE ONE AND
 * YOU MUST CHANGE THE OTHER.
 *
 * `SAAD`, NOT `MUHAMMAD SAAD`, and the arithmetic decided it rather than taste.
 * At 72 user units in a 100-unit box, `SAAD` is ~1.83:1 and renders 263px wide
 * at a 144px height; `MUHAMMAD SAAD` is ~6.2:1 and renders ~896px. The spine's
 * content measure at 1440 is 1262px, so `SAAD` leaves ~999px of void to its
 * right — which is exactly the site's grammar — and the long form very nearly
 * eliminates that void on the site's LAST surface, which is the one thing Rule
 * S-1 exists to protect. `Hero.tsx` also already refuses a static wordmark
 * because "a static wordmark sitting here would restate what the Intro just
 * spent its whole duration saying": `SAAD` at the document's end is a
 * SIGNATURE, `MUHAMMAD SAAD` is a restatement. Tracking `SAAD` out to fill the
 * measure was rejected too — 250px of tracking per gap is a fashion-brand
 * lockup and a template move in its own right.
 *
 * THE ADVANCE IS MEASURED, NOT ESTIMATED. Space Grotesk's own horizontal
 * advances, read out of `public/fonts/space-grotesk-latin.typeface.json` at
 * 1000 units/em: S 613 + A 630 + A 630 + D 663 = 2536, i.e. **2.536em**. That
 * em-relative figure is the font fact and it is what is stored below.
 *
 * IT USED TO STORE THE PRODUCT, AND THAT WAS A CROSS-FILE COUPLING HELD
 * TOGETHER BY A COMMENT. Until 2026-08-23 this read
 * `WORDMARK_ADVANCE_UNITS = 182.6`, annotated "at `FONT_SIZE_UNITS` = 72" — a
 * constant in THIS file whose correctness depended on a constant in
 * `text-hover-effect.tsx`. Raising the type size there would have silently
 * invalidated it: the box's `aspectRatio` would stay at the old ratio and the
 * wordmark would either grow dead space on its right (a wrong indent off the
 * spine, which is the failure this whole note exists to prevent) or be squeezed
 * by `meet`. The em advance is now multiplied by the EXPORTED
 * `FONT_SIZE_UNITS`, so the box and the glyphs read one number from one place
 * and cannot drift.
 *
 * THE STORED VALUE ALSO GOT 0.008 UNITS MORE ACCURATE AS A SIDE EFFECT, and it
 * is declared rather than discovered later: 2.536 x 72 = **182.592**, where the
 * old literal was 182.6 — a round-up of the same derivation. At a 144px render
 * that is 0.011px of rendered width.
 *
 * CROSS-CHECKED AGAINST THE SHIPPED WEBFONT, because a converted typeface JSON
 * is not the same artefact as the woff2 the browser loads:
 * `getComputedTextLength()` in Chrome returns **182.38** user units at
 * `FONT_SIZE_UNITS` = 72, i.e. 2.5331em. The 0.0029em difference is 0.3px of
 * trailing dead space at a 144px render, i.e. under half a pixel, and 2.536 is
 * kept because it is the value that can be RE-DERIVED from a file in this repo.
 * If the string changes, re-derive from the JSON and re-check in the browser —
 * do not guess from character count.
 *
 * WHY NOT IN `contactContent.ts` WITH THE OTHER STRINGS. That file's own rules
 * ban font names and styling from it, and a glyph advance is a font metric.
 * Splitting the pair across two files is the failure mode: someone edits the
 * string, the advance silently no longer describes it, and the box grows dead
 * space on the right that reads as a wrong indent off the spine. They stay
 * together, here, with the derivation attached.
 */
const WORDMARK_TEXT = "SAAD";
const WORDMARK_ADVANCE_EM = 2.536;

/**
 * The wordmark's `viewBox` width in user units, and the ONLY spelling of it.
 * Both the box's `aspectRatio` and the component's `viewBox` read this, so
 * there is one number rather than two that have to be kept equal by hand.
 */
const WORDMARK_VIEWBOX_UNITS = WORDMARK_ADVANCE_EM * FONT_SIZE_UNITS;

/**
 * THE WATERMARK'S RESTING STROKE ALPHA, passed to `TextHoverEffect` in place of
 * its own `RESTING_STROKE_ALPHA` default of 0.45.
 *
 * Saad's brief: "Idle state: faint (near-invisible, not a clearly readable
 * outline like the current version)."
 *
 * MEASURED ON THIS PLATE, not chosen by eye. `text-hero-fg` is #E8EAEC and the
 * surface is #07090C, so the composite and its contrast are:
 *
 *     0.45  (what shipped)   #6c6e71   3.90:1   readable as a word
 *     0.20                   #343639   1.64:1
 *     0.12                   #222427   1.28:1
 *     0.10  (this)           #1e2022   1.22:1   texture, not text
 *     0.06                   #141619   1.10:1   gone
 *
 * 1.22:1 IS DELIBERATELY BELOW EVERY WCAG FLOOR AND THAT IS NOT A DEFECT HERE.
 * 1.4.3 governs text and 1.4.11 governs UI components and graphics that convey
 * INFORMATION. This layer is `aria-hidden`, carries no information that is not
 * already in the accessibility tree twice, and is not a control — it is the
 * paper's watermark. **It is also why the hover reveal exists**: the same
 * glyphs paint at full strength under the cursor, so the name is legible on
 * demand rather than never.
 *
 * DO NOT REUSE THIS NUMBER FOR THE SIGNATURE FORM of the component if one ever
 * returns. `RESTING_STROKE_ALPHA`'s docstring carries the 3.91:1 arithmetic for
 * that case and the two are answering opposite questions.
 */
const WATERMARK_RESTING_ALPHA = 0.1;

/**
 * THE ALPHA THE WATERMARK'S ARRIVAL DRAW PLAYS AT, before it recedes to
 * `WATERMARK_RESTING_ALPHA`.
 *
 * Saad, 2026-08-27: "I want the text to be outlined first time when you go to
 * the footer and then it reverses". Without this the four-second draw ran at
 * 0.10 and 1.22:1 - an animation nobody could see, spending the plate's one
 * arrival beat on nothing.
 *
 * 0.45 IS `RESTING_STROKE_ALPHA`'s OWN VALUE and it is the same number for the
 * same reason: #6c6e71 on #07090C is 3.90:1, which is where an outlined
 * wordmark stops being texture and starts being a word. It is deliberately NOT
 * full strength - the name announcing itself is a beat, not a headline, and the
 * three links a few pixels away are the things on this plate meant to be read.
 *
 * THE TWO ALPHAS ARE 4.5x APART, which is what makes the recede legible AS a
 * recede rather than as a dimmer. `RECEDE_SECONDS` in the component carries the
 * timing and what "reverses" was taken to mean.
 */
const WATERMARK_DRAW_ALPHA = 0.45;

/**
 * The outbound arrow on GitHub and LinkedIn — Saad's brief: "a small
 * directional arrow (↗) appended, subtly shifting further up-right on hover —
 * these are the two links that take someone away from the site, so the arrow
 * correctly signals that."
 *
 * NOT THE `↗` CHARACTER (U+2197), AND THAT IS THE ONE DEVIATION FROM THE BRIEF
 * AS WRITTEN. Neither Space Grotesk nor JetBrains Mono ships that codepoint, so
 * it would fall through to whatever the visitor's system happens to substitute
 * — a different weight, a different optical size and a different baseline on
 * every OS, next to type this site controls to the pixel. An inline SVG renders
 * identically everywhere and inherits `currentColor`, so it takes the link's
 * muted-to-accent step for free.
 *
 * `1em` SQUARE, NOT A PIXEL SIZE, so it scales with `text-body` here and with
 * anything else a future caller sets. `DetailsArrowIcon` in
 * `FannedDeckPhase1.tsx` is the site's other inline arrow and this borrows its
 * stroke vocabulary exactly — `strokeWidth` 1.75, round caps and joins,
 * `fill="none"` — so the two read as one hand.
 *
 * THE TRAVEL IS 1px UP AND 1px RIGHT, which is "subtly" taken literally. It is
 * a `translate`, so it costs no layout and cannot reflow the line;
 * `motion-reduce:transition-none` collapses it to an instant step, matching
 * `BRUTAL_MOTION`'s idiom.
 *
 * `aria-hidden` AND `shrink-0`: it duplicates information the anchor already
 * announces — `ExternalLink` appends "(opens in a new tab)" to the accessible
 * name — so announcing it again would be the third statement of one fact.
 *
 * `align-middle` AND A `ml-2xs` (5px) GAP: the SVG is inline, so without the
 * alignment it sits on the text baseline with descender space beneath it and
 * rides visibly low against the value it follows.
 */
function OutboundArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      // `select-none` — AND IT IS NOT DECORATION-FOR-ITS-OWN-SAKE. The arrow
      // is the LAST thing inside the anchor, so a drag across the URL that
      // releases on it put the range's end point inside an `<svg>` and Chrome
      // COLLAPSED THE WHOLE SELECTION: measured 2026-08-28, "" when the drag
      // ended on the arrow, the full URL when it ended 3px earlier. Marking it
      // unselectable makes the range end at the last selectable position
      // instead, so the sweep people actually perform — label to line end —
      // returns the address.
      //
      // It is also just the policy: an icon is chrome, and `docs/03`'s
      // selection section keeps chrome locked everywhere. This is the only
      // place on the site where that rule has a behavioural consequence rather
      // than a cosmetic one.
      className="ml-2xs inline-block shrink-0 align-middle transition-transform duration-200 select-none group-hover:-translate-y-px group-hover:translate-x-px motion-reduce:transition-none"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 16 16 8" />
      <path d="M9.5 8H16v6.5" />
    </svg>
  );
}

export function RevealFooter() {
  return (
    <>
      {/*
        THE SENTINEL. Zero height, no content, no styling, and it exists for
        exactly one reader: `Navbar.tsx`.

        The plate below is `md:sticky`, so its `getBoundingClientRect()` reports
        the PINNED position from first paint, not its position in the document.
        ScrollTrigger measures rects, so it cannot be pointed at the footer and
        get a useful answer. This element is ordinary in-flow content sitting at
        exactly the plate's static top edge, so it CAN be measured, and it
        crosses the bar precisely when the UN-OCCLUDED plate does.

        IT MUST STAY OUTSIDE THE STICKY ELEMENT AND OUTSIDE `<main>`. Inside the
        footer it would move with the pin and measure nothing; inside `<main>`
        it would still work today but would break the moment `<main>` grows
        padding below its last section.

        `aria-hidden` IS NOT REDUNDANT BY ACCIDENT: an empty div is already
        invisible to assistive technology, and the attribute is here so that a
        future edit putting content inside it is obviously wrong.
      */}
      <div id={REVEAL_FOOTER_SENTINEL_ID} aria-hidden="true" />

      <footer
        id="contact"
        aria-labelledby="contact-heading"
        // `data-hero-palette` binds --nav-fg / --nav-fg-dim / --nav-accent for
        // the copy control below, which hardcodes all three. Outside a scope
        // that defines them they are invalid at computed-value time and the
        // "Copied" label renders in the initial colour on #07090C — invisible,
        // with nothing erroring. `app/globals.css` carries the reasoning.
        data-hero-palette=""
        // `relative z-0` at every width; `md:sticky md:bottom-0` is the whole
        // curtain. `z-0` is what puts this UNDER the page stack's `z-10`, and
        // the page stack's opaque `bg-base` is what actually hides it — see
        // both call sites. Vertical rhythm is the header's SPINE AND SEAM
        // section: `pt-2xl sm:pt-3xl` mirrors About's opening across the hard
        // colour edge, and the bottom mirrors the top.
        //
        // `md:flex md:min-h-dvh md:flex-col md:justify-end` is the full-height
        // plate, added 2026-08-23. All four are gated at the SAME 768px as the
        // pin, deliberately — one breakpoint governs the curtain and its
        // height. The header's "THE VIEWPORT-UNIT BAN WAS REVERSED" section
        // carries the reasoning, the re-measured Δ=0, the declared
        // `scrollHeight` growth and why the flex is on this element rather than
        // on the spine container. `pt-2xl sm:pt-3xl` is NOT decorative under
        // `justify-end`: it is what provides the top gap in exactly the case
        // where `min-h` does not bind, and `min-height` plus flex-end honours
        // padding on both sides, so the two compose.
        className="relative z-0 w-full bg-hero-surface pt-2xl pb-2xl sm:pt-3xl sm:pb-3xl md:sticky md:bottom-0 md:flex md:min-h-dvh md:flex-col md:justify-end"
      >
        {/* Rule S-1, byte-identical to every shipped section's container —
            inside a full-bleed plate, exactly as the hero does it. The spine is
            21 / 55 / 89px inside a 1440px centred container. */}
        <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
          {/*
            ═══════════════════════════════════════════════════════════════════
            THE POSITIONING CONTEXT FOR THE WATERMARK, AND THE ONE THING THAT
            MAKES THE 2026-08-27 REDESIGN DIFFERENT FROM WHAT WAS HERE BEFORE.
            ═══════════════════════════════════════════════════════════════════

            The wordmark used to be the LAST BLOCK IN FLOW — `mt-md h-2xl
            sm:h-3xl w-fit`, a real box contributing 178px to the plate. It is
            now an absolutely-positioned layer inside this wrapper, spanning the
            whole composition and painting behind it.

            THAT IS A LAYOUT CHANGE AND A HEIGHT CHANGE AT ONCE. Taking 178px
            out of flow and putting a divider and a copyright line back in is
            why the plate's composed content moved; the header's KNOWN RESIDUAL
            section carries the re-measured numbers and the one long-standing
            defect this incidentally fixed.
          */}
          <div className="relative">
            {/*
              ═════════════════════════════════════════════════════════════════
              THE WATERMARK. INERT, FAINT, AND BEHIND EVERYTHING.
              ═════════════════════════════════════════════════════════════════

              `pointer-events-none` IS A REQUIREMENT, NOT A PRECAUTION — Saad's
              words: "this is required, not optional, so cursor movement over it
              never blocks clicks on the links in front of it." A full-bleed
              absolute layer under live content is exactly the thing that
              silently eats clicks the first time someone adds a control without
              checking the stack, and `z-index` alone would not prevent that.

              THE HOVER STILL WORKS, AND THAT IS NOT A CONTRADICTION. The
              component stopped using element handlers in the same change and
              tracks `window`'s pointer instead — its own header carries the
              full reasoning, including why a rect test is the right semantics
              for a background layer and where it would be the wrong ones.

              `inset-0` PLUS `meet` IS WHAT MAKES "FULL-WIDTH, CENTRED" SAFE.
              The SVG fills this wrapper exactly; `preserveAspectRatio="xMidYMid
              meet"` (via `align="center"`) then scales the glyphs to the
              LARGEST size that fits INSIDE it and centres them on both axes. So
              the watermark is as big as the composition allows and can never
              overflow the plate — no measured height, no magic number, and it
              re-fits itself when the content above it reflows.

              `align="center"` IS A DOCUMENTED OPT-OUT FROM RULE S-1, not a
              violation of it. That rule governs where BLOCKS begin; this layer
              is not in flow and has no leading edge to put on the spine. The
              prop's own docblock carries the argument.

              `aria-hidden` IS UNCHANGED AND THE REASON IS UNCHANGED: the name
              is already in the accessibility tree twice on this page — the
              navbar's mark and the page's `<h1>` — and the `MonogramMark` below
              passes `label={null}` for exactly this reason. A third
              announcement inside `contentinfo` is redundancy, not access.
            */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 select-none"
            >
              <TextHoverEffect
                text={WORDMARK_TEXT}
                viewBoxWidth={WORDMARK_VIEWBOX_UNITS}
                align="center"
                restingStrokeAlpha={WATERMARK_RESTING_ALPHA}
                drawStrokeAlpha={WATERMARK_DRAW_ALPHA}
                className="text-hero-fg"
              />
            </div>

            {/* Everything real, above the watermark. `relative z-10` is the
                whole stacking story — one layer up from the `z-0` above it, and
                both inside this wrapper rather than competing with the plate's
                own `z-0` against the page stack's `z-10`. */}
            <div className="relative z-10">
              {/*
                ═══ TWO COLUMNS AT `lg`, ONE BELOW IT ═══

                Saad's brief: identity on the left, the three channels stacked
                on the right. The stated reason for the split is not symmetry —
                it is that the old horizontal three-column link row left the
                watermark nowhere to sit, because a name behind three separate
                columns is fighting all three for the same width.

                `lg:` AND NOT `sm:`, unlike the row it replaces. Two columns of
                prose at 640px would give the closing line a ~280px measure,
                which is far narrower than the 34rem this site sets everywhere.
                The one-column stack below `lg` is the same order, top to
                bottom.

                `gap-xl lg:gap-2xl` — 55px STACKED, 89px SIDE BY SIDE, and the
                two numbers are the ones this composition already used on each
                axis. 89px is the old `sm:gap-x-2xl` between link items
                horizontally; 55px is the `mt-xl` the closing line used to take
                from the `<ul>` beneath it vertically.

                **IT SHIPPED AS A FLAT `gap-2xl` AND THAT BROKE THE 900px
                CONTENT CEILING BY 0.97px AT 768x1024** — measured, 900.97, in
                all four route/theme cases at that viewport. The ceiling is a
                tracked rule (`docs/03` Rule S-6, and this file's header): it
                exists to stop content growing until the reveal becomes a crawl
                over something that can never be seen whole. Nothing was cut to
                fix it; the vertical gap was simply wrong at 89px, because 89 is
                the horizontal value. 866.97px now, with 33px of headroom.
              */}
              <div className="grid gap-xl lg:grid-cols-2 lg:items-start lg:gap-2xl">
                {/* ── LEFT: the identity block ─────────────────────────── */}
                <div>
                  {/*
                    THE ONE CYAN MARK — the site's only DOM path to
                    `--accent-hero`, and the only cyan anywhere outside the
                    hero's canvas.

                    Three authorities license it here and nowhere else:
                    CLAUDE.md ("Tier 1 ONLY — hero glow/particles/lighting, and
                    sparingly in the Contact close beat"), `app/globals.css`'s
                    TIER 1 ACCENT block, and .claude/handoff/ticket-3-design.md
                    11.6.

                    READ VIA AN INLINE `var()`, BY DESIGN — NOT A CLASS, NOT A
                    UTILITY, NOT A NEW TOKEN. `--accent-hero` is registered
                    OUTSIDE Tailwind's `--color-*` namespace precisely so no
                    utility can exist for it, and globals.css says in so many
                    words: DO NOT "fix" this by moving it into that namespace.
                    Reaching cyan in the DOM is meant to be a deliberate,
                    visible, greppable act.

                    THAT GREP IS NOT THE WHOLE AUDIT. It audits the DOM path,
                    which is all it ever claimed. It does NOT audit the JS path:
                    `ParticleGrid` reads the token by name, so when it was
                    generalised on 2026-08-22 the cyan reached `/about` while
                    the grep kept reporting clean. Audit RENDER SITES, not code
                    paths, and run `grep -rn "ParticleGrid" components/` beside
                    it.

                    `aria-hidden` and carrying no text: it is a marker of the
                    beat, not an affordance. Cyan TEXT was rejected on a
                    stronger ground than contrast — a coloured short string
                    reads as something to click, and a second link colour would
                    break the locked rule that teal, and only teal, means
                    "activate this". #00E5FF on #07090C is 12.96:1, against a
                    3:1 non-text floor.

                    `h-3xs` is 3px from `--spacing-3xs`, NOT a literal: in
                    Tailwind v4 the `--spacing-*` namespace generates size
                    utilities as well as spacing ones, and `w-lg` on the same
                    element is the proof.

                    IT STAYS EXACTLY ONE 34x3px MARK. Cyan is ~1.5:1 on
                    `bg-base` and must never be a rule drawn there; this sits on
                    `bg-hero-surface` at 12.96:1, which is the "its own dark
                    surface" the rule requires.
                  */}
                  <span
                    aria-hidden="true"
                    className="mb-md block h-3xs w-lg"
                    style={{ backgroundColor: "var(--accent-hero)" }}
                  />

                  {/*
===============================================
                    IT IS `text-h2` AGAIN, WHICH IS WHERE IT STARTED.
                    ===============================================

                    Saad, 2026-08-27: "I want the contact heading bigger."

                    THE FULL ROUND TRIP, because both moves had reasons and the
                    second one repealed the first:

                      Phase 5      `text-h2`         ~81.6px line box
                      2026-08-23   `text-caption`     19.2px   (-62.4)
                      2026-08-27   `text-h2`         ~74.8px   (+55.6)

                    The demotion existed "so the wordmark at the bottom of the
                    plate can be the largest element without the plate carrying
                    two large elements". THE WORDMARK IS NOT IN FLOW ANY MORE -
                    it is an ambient watermark behind this text at 1.22:1 - so
                    there is no longer a second large element to compete with.
                    The reason lapsed with the layout it was written for.

                    I ARGUED AGAINST THIS ONE DAY AGO, in this comment, on the
                    grounds that "a 68px heading over a faint 400px outline is
                    two large letterforms in one place". Looked at rather than
                    reasoned about, that is wrong: at 1.22:1 the watermark is
                    texture, and a section heading set at the site's own heading
                    size is what every other section here does.

                    `font-mono` IS GONE WITH IT. Every heading on the site is
                    Space Grotesk; JetBrains Mono is for labels, stats and tags
                    (CLAUDE.md's type rule). The mono was part of the caption
                    dressing, not part of the heading.

                    IT COSTS 55.6px AND THE PLATE HAS IT. Composed content was
                    732.58px with 35.4px of headroom under the 768 fit, and the
                    stamp merge below returns ~51px of that. Re-measured, not
                    assumed - the header's table carries the numbers.

                    STILL A REAL `<h2>` AND STILL THE LANDMARK'S NAME.
                    `aria-labelledby="contact-heading"` is untouched, and
                    nothing invented enters the a11y tree.

                    FULL OPACITY, NOT `/70`. It was never at real risk of
                    reading as a fourth link label, and at this size it is not.
                  */}
                  <h2 id="contact-heading" className="text-h2 text-hero-fg">
                    {CONTACT_HEADING}
                  </h2>

                  {/* Full opacity — this is primary content, not metadata.
                      `34rem` is the site's reading measure, used by every
                      shipped section. The line itself changed on 2026-08-27 and
                      `contactContent.ts` carries what it was and why. */}
                  <p className="mt-lg max-w-[34rem] text-body text-hero-fg">
                    {CONTACT_CLOSING_LINE}
                  </p>
                </div>

                {/*
                  ── RIGHT: the three channels, stacked ───────────────────

                  A REAL LIST, so a screen reader announces the honest current
                  count ("list, 3 items") and n = 4 needs zero markup change.

                  A COLUMN AT EVERY WIDTH NOW. It used to be `sm:flex-row
                  sm:flex-wrap`, and `flex-wrap` was carrying the whole n-safety
                  story: one item is one block, four items wrap. A COLUMN IS
                  STRICTLY SAFER THAN THAT — nothing balances at a particular
                  count because nothing is balanced at all, and a fourth entry
                  appends without touching a class.

                  `gap-lg` (34px) IS THE SAME 34px the old layout used between
                  wrapped rows and between items in its own mobile column, so
                  the item rhythm is unchanged; only the axis is.

                  `lg:pt-md` NUDGES THE STACK DOWN so its first label sits near
                  the heading's line rather than level with the 3px cyan bar
                  above it, which would read as the top of a shared row.
                */}
                {/*
                  ═══════════════════════════════════════════════════════
                  `lg:text-right` — THE COLUMN'S TRAILING EDGE, AND IT IS
                  THE SPINE'S RIGHT INSET, NOT A NEW FOOTER MARGIN.
                  ═══════════════════════════════════════════════════════

                  Saad, 2026-08-28: "each link's right edge lands wherever
                  that link's text happens to end — three different lengths,
                  three different ragged right edges ... one column has a true
                  edge, the other doesn't."

                  Three labels and three values of unequal length, all
                  left-aligned, produced SIX ragged right edges against a left
                  column that has one clean one. `text-align: right` inherits,
                  so this one class squares the labels and the values together
                  — they are one unit by construction (the 8px below binds
                  them) and they must stay one unit under alignment too.

                  IT LANDS ON THE SPINE FOR FREE, WHICH IS THE WHOLE REASON
                  THIS IS ONE CLASS. The grid's second column ends exactly at
                  the spine container's content-box right edge, because
                  `lg:grid-cols-2` splits the padded box and nothing here sets
                  a width or a max-width. So the new edge IS `px-2xl` (89px)
                  in from `max-w-[1440px]` — `docs/03` Rule S-1's recorded
                  value, the same one this footer's own container already uses
                  on the left. **No footer-specific margin was invented, and
                  none should be**: if this ever needs to move, the spine moves.

                  `lg:` ONLY, DELIBERATELY. Below 1024px the grid is a single
                  stacked column and there is no second column to mirror.
                  Right-aligning there would set the links flush right while
                  the heading and punchline above them stayed flush left — a
                  split with nothing on the other side of it, which is a
                  different composition rather than the same one narrower.
                  Verified at 768 and 360: unchanged, still left.

                  IT IS ALIGNMENT ONLY. `text-align` moves no box and changes
                  no height, so Rule S-6's 900px content ceiling and the
                  sticky `scrollHeight` guarantee cannot be affected by it —
                  re-measured anyway, because that assumption is exactly the
                  kind this file has been wrong about before.

                  NOT `lg:items-end` ON THE FLEX COLUMN, which would have
                  looked equivalent. That shrinks each `<li>` to its content
                  width, and the `<li>` carries `min-w-0` while the anchors
                  carry `break-words` — i.e. the wrapping behaviour depends on
                  the item being full-width. `text-right` keeps every box
                  where it is and only moves the glyphs.
                */}
                <ul className="flex flex-col gap-lg lg:pt-md lg:text-right">
                  {/*
                    ARRAY ORDER IS DISPLAY ORDER. No sort, no filter, no
                    reverse. `content/contact.ts` states that rule; a sort here
                    would be a second source of truth for an order the file
                    already shows. THE ORDER NOW CARRIES A FACT THE PROSE USED
                    TO — the closing line said "Email is fastest" until
                    2026-08-27, and Email being first in the stack is what says
                    it now. See `contactContent.ts`.

                    THE EMAIL IS STILL NOT PROMOTED OUT OF THIS LIST. It would
                    require partitioning `contact` by `kind` in the consumer,
                    which `content/contact.ts` forbids by name, and a partition
                    reintroduces a count-sensitive layout.

                    `key` is the href: unique by construction — two links to the
                    same destination would be the bug, not the collision.
                  */}
                  {contact.map((link) => (
                    <li key={link.href} className="min-w-0">
                      {/* The same mono caption atom the shipped sections use as
                          META / BLOCK_LABEL, retargeted to the pinned
                          foreground. `/70` is 8.17:1 on this plate. */}
                      <span className="text-caption font-mono text-hero-fg/70">
                        {link.label}
                      </span>

                      {/*
                        8px binds the label to its value as ONE unit — the same
                        8px Experience uses to bind company to role.

                        `kind` DRIVES THE PRESENTATION, NOT THE COLOUR. A
                        `mailto:` does NOT open a new tab, so it must not carry
                        `target`, `rel` or the new-tab note — announcing a tab
                        that never opens is a lie, which is exactly why
                        `ContactLink.kind` is an explicit discriminant rather
                        than a `href.startsWith("http")` sniff.

                        THE EMAIL RENDERS THE COPY CONTROL, which is `docs/07`
                        §5's "same click-to-copy as the navbar". Saad's brief
                        keeps it exactly as it was — "it's copy-to-clipboard,
                        not an outbound link; keep its existing click-to-copy
                        behavior and visual treatment as-is, just repositioned
                        into the vertical stack" — so this branch is untouched
                        by the redesign and takes NEITHER the arrow NOR the new
                        hover treatment. That asymmetry is the point: the arrow
                        means "this leaves the site", and copying an address
                        does not.
                      */}
                      {/*
                        ═════════════════════════════════════════════════════
                        `select-text` ON THE `web` BRANCH ONLY — THE VISIBLE
                        TEXT THERE IS A URL, AND A URL ON SCREEN IS AN
                        INVITATION TO COPY IT.
                        ═════════════════════════════════════════════════════

                        `content/contact.ts` sets `value` to
                        "github.com/Nobody243" and
                        "linkedin.com/in/muhammad-saad-2911702a3", so this is
                        the only place on the site where an ADDRESS is rendered
                        as readable text rather than as a label. Saad,
                        2026-08-28: "same reasoning as the email `mailto:`
                        fallback fix". `<body>` carries `select-none`; see
                        `docs/03`'s selection section for the whole policy.

                        ON THE `<p>` AND NOT ON THE ANCHOR, AND THAT IS A
                        MEASURED CHOICE RATHER THAN A TIDIER ONE. It shipped on
                        the anchor first and the URL still would not
                        drag-select: **Chrome will not START a selection inside
                        a `user-select: none` region**, so a sweep beginning in
                        the whitespace left of the right-aligned URL died before
                        it reached the selectable island. Moving the class one
                        level up makes the whole value line the island, and the
                        drag has somewhere to begin.

                        THE LABEL IS NOT COVERED. `<span>{link.label}</span>` is
                        a SIBLING of this `<p>`, not a child, so "Email",
                        "GitHub" and "LinkedIn" stay locked exactly as the
                        policy requires. That the two are separate elements is
                        what makes this the narrowest root that works.

                        THE `email` BRANCH TAKES IT TOO, AND IT HAD TO. That
                        was the second measurement of the day: with JavaScript
                        blocked the control is a `mailto:` `<a>`, `select-text`
                        on the anchor alone left it UNSELECTABLE by every real
                        gesture, and a triple-click only takes a line when the
                        CONTAINING BLOCK is selectable. So the exception Saad
                        asked for — "the email address remains manually
                        selectable/copyable in the no-JS fallback state" — needs
                        this `<p>`, not just the anchor.
                        Its one hazard is handled at the source: the swap-in
                        confirmation ("Copied", "Press Ctrl/⌘+C") shares a grid
                        cell with the address, so it carries `select-none` in
                        `CopyEmailButton` and cannot land in a clipboard.

                        WHAT THIS DOES NOT BUY, STATED. A drag that STARTS on an
                        `<a>` drags the link rather than selecting it, and a
                        double-click on one does not take the word. That is
                        universal browser behaviour, not a consequence of this
                        policy — verified against the detail page, where the
                        whole surface is `select-text` and its GitHub link
                        behaves identically. Triple-click and select-all both
                        take the URL cleanly, and the copied string is exactly
                        the address.
                      */}
                      <p className="mt-xs text-body select-text">
                        {link.kind === "email" ? (
                          <CopyEmailButton
                            value={link.value}
                            href={link.href}
                            // UNCHANGED FROM WHAT SHIPPED, deliberately — see
                            // the comment above. The underline is not
                            // decoration: colour alone must not be a link's
                            // only signal, and this control has no hover colour
                            // step because `hero-accent` at /70 on #07090C is
                            // 4.31:1 and fails AA.
                            //
                            // `valueClassName` AND NOT `className`: on the
                            // button, `className` lands on the `<button>`, and
                            // the label sits inside an `overflow: hidden` mask
                            // — a new block formatting context, which a text
                            // decoration does not cross. The email rendered
                            // un-underlined beside two underlined siblings.
                            // Verified by screenshot, not by reasoning.
                            valueClassName="underline underline-offset-4"
                            // NOT appended to the control's own `text-caption
                            // font-mono` — REPLACING it. Tailwind resolves
                            // equal-specificity conflicts by stylesheet source
                            // order, not by class-attribute order, so appending
                            // would be a coin flip that looks right in dev.
                            typeClassName="text-body font-sans"
                          />
                        ) : link.kind === "web" ? (
                          /* THE HOVER PREVIEW, on the two real links only.
                             `LinkPreview` wraps rather than replaces:
                             `ExternalLink` still renders the anchor, so
                             `target`, `rel` and the announced new-tab note are
                             unchanged and still come from the one component
                             that owns them. With no `previewImage` set this
                             adds nothing to the DOM at all.

                             NOT ON `/about`'s GITHUB AND LINKEDIN, which read
                             the same two `contact.ts` entries. Saad's call,
                             2026-08-25: "it's only for the links not the
                             buttons". */
                          <LinkPreview preview={link.previewImage}>
                            <ExternalLink
                              href={link.href}
                              className={`${EXTERNAL_LINK_ON_HERO_MUTED} break-words`}
                            >
                              {link.value}
                              <OutboundArrow />
                            </ExternalLink>
                          </LinkPreview>
                        ) : (
                          <a
                            href={link.href}
                            className={`${EXTERNAL_LINK_ON_HERO_MUTED} break-words`}
                          >
                            {link.value}
                          </a>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/*
                ===================================================
                THE STAMP AND THE STATUS BAR ARE ONE ROW, NOT TWO.
                ===================================================

                Saad, 2026-08-27, on seeing them shipped separately: "the MS
                2026 and (c) 2026 MS there are two things keep the MS (designed
                one logo) keep that."

                WHAT WAS THERE FOR ONE DAY, and why it was wrong: a
                `MonogramMark` beside a bare `2026`, then a rule, then a typed
                "MS" beside the same `2026`. **The same fact twice, in two
                typographic registers, separated by a divider** - which is the
                arrangement that makes a reader look for the difference between
                them and not find one. It shipped flagged rather than resolved,
                because both halves had been asked for by name in the same
                brief and the resolution was not mine to pick.

                THE RESOLUTION KEEPS THE DRAWN MARK AND DROPS THE TYPED ONE.
                `contactContent.ts` carries the `(c) 2026` string and the reason:
                the mark IS the "MS", so setting it in type beside itself is
                captioning a logo with its own name.

                WHAT THIS COSTS, STATED. The 2026-08-23 comment defended the
                year on the ground that "A copyright line is the last thing in a
                document by definition; this one is not" - it was a DATE STAMP
                on a signed piece. It is now literally the last thing on the
                plate and it carries a `(c)`, so that defence is spent, not
                weakened. The compensating fact is the one that was always
                load-bearing: **Saad asserted the copyright himself**, so the
                claim is his. Nothing here states a fact he has not stated.

                IT IS ALSO ~51px SHORTER than the two-row version, which is what
                pays for the `<h2>` going back to `text-h2` above. The two
                changes arrived in the same instruction and they fund each
                other; the header's table has the measured totals.
              */}
              {/*
                THE DIVIDER. Saad's brief: "a thin, faint horizontal divider
                (site's real border/divider token, not an arbitrary `white/10`
                value) spanning the section width, sitting above the copyright
                line".

                `hero-fg/15` IS THE REAL TOKEN, AND `brutal-edge` WOULD HAVE
                BEEN THE WRONG ONE - worth stating, because `brutal-edge` is the
                site's named rule colour and is the obvious pick. It is #8f8f8f
                in dark and #151515 in light, i.e. IT FLIPS WITH THE THEME. This
                plate does not: `bg-hero-surface` is pinned #07090c in both
                themes, so a `brutal-edge` rule here would be a 6.12:1 grey line
                in dark and a near-invisible 1.2:1 line in light, on the same
                surface, for no reason anyone chose. That is the exact trap
                `ExternalLink` documents for `accent-working` vs `hero-accent`
                on this surface.

                `hero-fg/15` composites to #292b2e on the plate = 1.40:1, which
                is "faint" as asked. It is a decorative separator rather than a
                UI boundary - 1.4.11 governs components and their states, and a
                divider is neither. The nearest precedent on a theme-flipping
                surface is `ProjectStripRow`'s `border-fg/25`; this is the same
                construction, one step lighter, on the plate's own foreground
                token.

                A `<div role="separator">` RATHER THAN `<hr>`. An `<hr>` is a
                thematic break in CONTENT, and this is a rule between a block
                and its footnote. `role="separator"` with no `aria-orientation`
                defaults to horizontal, and it carries no text so nothing is
                announced.

                `mt-2xl` (89px) ABOVE, `mt-md` (21px) BELOW, deliberately
                ASYMMETRIC. The rule belongs to the row beneath it - it is the
                top edge of the status bar, not a gap between two equal things -
                and equal spacing would read as a divider between peers. 89px is
                the same block separation the stamp row took when it was its own
                block above this rule.
              */}
              <div
                role="separator"
                className="mt-2xl h-px w-full bg-hero-fg/15"
              />

              <div className="mt-md flex items-center gap-xs">
                {/*
                  `variant="nav"` - the settled mark, static, no third dressing.
                  Decided upstream and not reopened.

                  `text-hero-fg` AT FULL OPACITY: the mark is `currentColor`. It
                  is the smaller of the two elements in this row, but it is
                  still the solid one - the line beside it carries the
                  recession, which is what builds hierarchy inside the stamp.

                  `label={null}` - DECORATIVE, DELIBERATELY, and passed
                  explicitly rather than left to the default so the choice is on
                  the record. The navbar's mark already carries the accessible
                  name on the same page, and a second labelled instance
                  announces "Muhammad Saad" twice inside one document. **This
                  matters more now that the mark is the only "MS" on the plate**:
                  the temptation is to label it because it is carrying meaning.
                  Do not. The `<h2>` names the landmark and the links are a real
                  `<ul>` with an honest count.

                  `block` because an `<svg>` is inline by default and would sit
                  on a text baseline with descender space under it, which would
                  throw the row's vertical centring off by the descender.

                  NO HOVER AND NO LETTER-PART GESTURE. `Navbar.tsx` reaches
                  `<g data-ms-letter>` for its hover micro-motion; nothing here
                  touches those hooks. This instance is inert.
                */}
                <MonogramMark
                  variant="nav"
                  size={STAMP_MARK_PX}
                  label={null}
                  className="block text-hero-fg"
                />

                {/* THE COPYRIGHT LINE. `contactContent.ts` carries the ban this
                    reverses, the reason the ban lapsed, why the year is
                    interpolated from `CONTACT_EDITION_YEAR` rather than
                    retyped, and why the "MS" that used to follow it is gone.

                    `text-caption font-mono text-hero-fg/70` - the brief asks
                    for "the site's existing monospace treatment", and this is
                    the exact string the link labels already use on this plate.
                    8.17:1. It is also what the bare year used when it sat here,
                    so the row's own typography did not change at all; only its
                    content did.

                    `gap-xs` is 8px - the same 8px that binds each link's label
                    to its value as ONE unit above, used here for the same job. */}
                <p className="text-caption font-mono text-hero-fg/70">
                  {CONTACT_COPYRIGHT_LINE}
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default RevealFooter;
