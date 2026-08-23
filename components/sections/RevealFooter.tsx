import {
  EXTERNAL_LINK_ON_HERO,
  ExternalLink,
} from "@/components/ui/ExternalLink";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { MonogramMark } from "@/components/ui/MonogramMark";
import {
  CONTACT_CLOSING_LINE,
  CONTACT_EDITION_YEAR,
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
 *      MEASURED COMPOSED CONTENT, 2026-08-23: **775.98px** at every width from
 *      1280 up (the composition is width-invariant there), **867.58px** at
 *      1024x600 where the link row wraps, 833.58px at 768x1024 and 811.36px at
 *      360x640. All four are under 900. The old composition measured 793px at
 *      1440, so the plate's CONTENT got 17px SHORTER even as its box got taller
 *      — the `<h2>` demotion and the smaller stamp between them paid for most
 *      of the wordmark.
 *
 * -------------------------------------------------------------------------
 * KNOWN, ACCEPTED RESIDUAL: 775.98px DOES NOT FIT A 768-TALL VIEWPORT.
 * -------------------------------------------------------------------------
 * The design brief budgeted 763.4px and called 1366x768 the binding case with
 * 4.6px of headroom. MEASURED IT IS 775.98px — **7.98px OVER** — so at 1366x768
 * (and 55.98px over at 1280x720) the plate is taller than the scrollport and
 * pins with its top cut off. THIS IS RECORDED AS ACCEPTED, NOT FIXED, and it is
 * not folded into any passing total.
 *
 * THE 12.58px THE BRIEF MISSED, itemised so nobody re-derives it: the link list
 * takes `lg:mt-2xl` (89px) at these widths, not the 55px the budget assumed;
 * the closing line sets on ONE line, not the two it budgeted; and
 * `text-caption`'s line-height is 1.4, not the 1.6 it assumed. Two of those cut
 * the other way, and the net is +12.58.
 *
 * WHY IT IS ACCEPTED. The 7.98px that cannot be on screen at once is `pt-3xl`
 * padding — blank plate. Measured at 1366x768, the cyan bar sits at y = 136 and
 * the entire composition, bar to signature, is visible. The rule this brushes
 * against exists to stop CONTENT becoming unseeable; no content is unseeable.
 *
 * THE TWO LEVERS, NAMED SO THE NEXT READER DOES NOT HAVE TO FIND THEM — and
 * NEITHER WAS APPLIED, deliberately:
 *   1. `pb-3xl` -> `pb-2xl` saves 55px. This file already names that exact edit
 *      as the sanctioned fix for a DIFFERENT symptom (144px of empty plate
 *      reading as nothing in dark mode). Spending it here would retune a value
 *      against a problem it was not chosen for.
 *   2. `STAMP_MARK_PX` 21 -> 17 saves 4px, which is not enough on its own, and
 *      it would shrink a mark that was just demoted and put it exactly on the
 *      17px legibility floor.
 * If the plate ever has to fit 768 exactly, take lever 1 and re-record BOTH
 * symptoms against it.
 *
 * THE SEPARATE NUMBER, DECLARED HERE RATHER THAN DISCOVERED LATER: the document
 * DOES get taller. `min-h-dvh` grows `document.scrollHeight` by
 * `max(0, viewportHeight − composedContentHeight)` — MEASURED at **+124px** at
 * 1440x900, **+24px** at 1280x800, **+190px** at 768x1024, **+664px** at
 * 2560x1440, and **0px** at 1024x600, 1366x768, 1280x720 and 360x640, where the
 * content is already taller than the viewport (or the `md:` gate is off). That
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
            THE ONE CYAN MARK — the site's only DOM path to `--accent-hero`, and
            the only cyan anywhere outside the hero's WebGL canvas.

            Three authorities license it here and nowhere else: CLAUDE.md
            ("Tier 1 ONLY — hero glow/particles/lighting, and sparingly in the
            Contact close beat"), `app/globals.css`'s TIER 1 ACCENT block, and
            .claude/handoff/ticket-3-design.md 11.6.

            READ VIA AN INLINE `var()`, BY DESIGN — NOT A CLASS, NOT A UTILITY,
            NOT A NEW TOKEN. `--accent-hero` is registered OUTSIDE Tailwind's
            `--color-*` namespace precisely so no utility can exist for it, and
            globals.css says in so many words: DO NOT "fix" this by moving it
            into that namespace. The guard's intent is that reaching cyan in the
            DOM is a deliberate, visible, greppable act —
            `grep -rn "accent-hero" components/` returns the hero's
            `outline-hero-accent` (a DIFFERENT token) plus this one line, and a
            reviewer can audit the whole rule in one command.

            THAT ONE COMMAND IS NO LONGER THE WHOLE AUDIT, and this is the one
            place worth saying so. It audits the DOM path, which is what it
            claims and all it ever claimed. It does NOT audit the JS path:
            `ParticleGrid` reads the token by name and is mounted on two routes,
            so when it was generalised from hero-only on 2026-08-22 the cyan
            reached `/about` — a Tier 2 page — while this grep kept returning
            two hits and kept reporting clean. Closed by giving each field
            preset its own property name (`QUIET_FIELD` takes `--field-ink`),
            but the lesson is the count: audit RENDER SITES, not code paths, and
            run `grep -rn "ParticleGrid" components/` beside this one.

            `aria-hidden` and carrying no text: it is a marker of the beat, not
            an affordance. Cyan TEXT was rejected on a stronger ground than
            contrast — a coloured short string reads as something to click, and
            a second link colour would break the locked rule that teal, and only
            teal, means "activate this". #00E5FF on #07090C is 12.96:1, against
            a 3:1 non-text floor.

            `h-3xs` is 3px from `--spacing-3xs`, NOT a literal: in Tailwind v4
            the `--spacing-*` namespace generates size utilities as well as
            spacing ones, and `w-lg` on the same element is the proof.

            IT STAYS EXACTLY ONE 34x3px MARK. The curtain does not license a
            second one, and globals.css's hard constraint is satisfied by the
            SURFACE rather than the size: cyan is ~1.5:1 on `bg-base` and must
            never be a rule or hairline drawn there, but this sits on
            `bg-hero-surface` at 12.96:1, which is the "its own dark surface"
            the rule requires.
          */}
          <span
            aria-hidden="true"
            className="mb-md block h-3xs w-lg"
            style={{ backgroundColor: "var(--accent-hero)" }}
          />

          {/*
            IT IS STILL A REAL `<h2>`, AND IT IS NOW A MONO CAPTION.

            DEMOTED FROM `text-h2` ON 2026-08-23 (~68px x 1.2 = 81.6px down to
            12px x 1.6 = 19.2px, a 62.4px saving) so the wordmark at the bottom
            of the plate can be the largest element without the plate carrying
            two large elements. `aria-labelledby="contact-heading"` keeps
            working, the `contentinfo` landmark keeps its accessible name, and
            nothing invented enters the a11y tree — a heading is allowed to be
            small. Inverting the hierarchy (a 12px mono label above a 144px
            wordmark) reads as deliberate typographic direction rather than as a
            missing heading.

            FULL OPACITY, NOT `/70`. The three link LABELS below are
            `text-caption font-mono text-hero-fg/70`; if the heading took the
            same string it would be indistinguishable from a fourth label. The
            colour decision this element already carried is the one that is
            kept; only the size and the family changed.

            Weight left at the inherited 400, as in every shipped section: the
            type scale carries the size.
          */}
          <h2
            id="contact-heading"
            className="text-caption font-mono text-hero-fg"
          >
            {CONTACT_HEADING}
          </h2>

          {/* Full opacity — this is primary content, not metadata. `34rem` is
              the site's reading measure, used by every shipped section, and it
              is also what bounds the plate's height against a longer line. */}
          <p className="mt-lg max-w-[34rem] text-body text-hero-fg">
            {CONTACT_CLOSING_LINE}
          </p>

          {/*
            A REAL LIST, so a screen reader announces the honest current count
            ("list, 3 items") and n = 4 needs zero markup change.

            THE GAP UNDER THE HEADING IS LARGER THAN THE GAP BETWEEN ITEMS
            (55/89 > 34), so "Contact" does not read as a peer item.

            `flex-wrap` IS THE WHOLE n-SAFETY STORY: one item is one block, four
            items wrap, and nothing balances only at a particular count. 89px
            horizontal at 640px and up is wide enough that the items read as
            separate blocks rather than as a nav bar; 34px vertical when it
            wraps, and 34px between items in the column below 640px, where every
            item sits on the spine.
          */}
          <ul className="mt-xl flex flex-col gap-lg sm:flex-row sm:flex-wrap sm:gap-x-2xl sm:gap-y-lg lg:mt-2xl">
            {/*
              ARRAY ORDER IS DISPLAY ORDER. No sort, no filter, no reverse.
              `content/contact.ts` states that rule; a sort here would be a
              second source of truth for an order the file already shows.

              THE EMAIL IS NOT PROMOTED OUT OF THIS LIST into a large primary
              line, and that was considered. It would require partitioning
              `contact` by `kind` in the consumer, which `content/contact.ts`
              forbids by name, and a partition reintroduces a count-sensitive
              layout: an empty primary block still occupies a flex box and
              leaves a stray 55px gap, so avoiding THAT would need a `.length`
              read — the exact rule the file exists to protect. One list, array
              order, `kind` selects the item's presentation, no branch on count
              anywhere.

              `key` is the href: unique by construction — two links to the same
              destination would be the bug, not the collision.

              `min-w-0` because at 640px and up this is a `flex-row`, and a flex
              item refuses to shrink below its longest word without it. The
              LinkedIn value is 39 characters and is the one that needs it.
            */}
            {contact.map((link) => (
              <li key={link.href} className="min-w-0">
                {/* The same mono caption atom the shipped sections use as
                    META / BLOCK_LABEL, retargeted to the pinned foreground. */}
                <span className="text-caption font-mono text-hero-fg/70">
                  {link.label}
                </span>

                {/*
                  8px binds the label to its value as ONE unit — the same 8px
                  Experience uses to bind company to role.

                  `break-words` because a future `value` is an unknown-length
                  string: 360px minus `px-md` twice leaves 318px, and a wrapped
                  string is ugly while a horizontally scrolling page is a
                  defect.

                  `kind` DRIVES THE PRESENTATION, NOT THE COLOUR. All three
                  branches are teal at `text-body`, so the items read as peers
                  and only the semantics differ. A `mailto:` does NOT open a new
                  tab, so it must not carry `target`, `rel` or the new-tab note
                  — announcing a tab that never opens is a lie, which is exactly
                  why `ContactLink.kind` is an explicit discriminant rather than
                  a `href.startsWith("http")` sniff.

                  THE EMAIL RENDERS THE COPY CONTROL, which is `docs/07` §5's
                  "same click-to-copy as the navbar" and which the old
                  `Contact.tsx` refused. Its objection — a control that is inert
                  until hydration, or forever with JS blocked — was correct and
                  is RETIRED rather than overruled: `CopyEmailButton` now takes
                  an `href` and renders a working `mailto:` anchor until it
                  hydrates. There is no dead control at any point.

                  If in review the copy control is not discoverable AS A
                  CONTROL, the fix is a mono caption hint rendered for
                  `kind === "email"` only, sourced from a new constant in
                  `contactContent.ts` — NOT from `content/contact.ts`, which
                  holds links rather than copy, and NOT by giving the email a
                  different size. If a hint is still not enough, the conclusion
                  is that the control does not belong on this plate at all and
                  the plain `mailto:` stands — not that the list was wrong.
                */}
                <p className="mt-xs text-body">
                  {link.kind === "email" ? (
                    <CopyEmailButton
                      value={link.value}
                      href={link.href}
                      // Matches its two siblings exactly. The underline is not
                      // decoration: `EXTERNAL_LINK_ON_HERO` carries a permanent
                      // one because colour alone must not be a link's only
                      // signal, and neither it nor this has a hover colour step
                      // — `hero-accent` at /70 on #07090C computes to 4.34:1
                      // and fails AA.
                      //
                      // `valueClassName` AND NOT `className`, and that is not
                      // a style preference. On the button, `className` lands on
                      // the `<button>`, and the label sits inside an
                      // `overflow: hidden` mask — a new block formatting
                      // context, which a text decoration does not cross. The
                      // email rendered un-underlined beside two underlined
                      // siblings. Verified by screenshot, not by reasoning.
                      valueClassName="underline underline-offset-4"
                      // NOT appended to the control's own `text-caption
                      // font-mono` — REPLACING it. Tailwind resolves
                      // equal-specificity conflicts by stylesheet source order,
                      // not by class-attribute order, so appending would be a
                      // coin flip that looks right in dev.
                      typeClassName="text-body font-sans"
                    />
                  ) : link.kind === "web" ? (
                    <ExternalLink
                      href={link.href}
                      className={`${EXTERNAL_LINK_ON_HERO} break-words`}
                    >
                      {link.value}
                    </ExternalLink>
                  ) : (
                    <a
                      href={link.href}
                      className={`${EXTERNAL_LINK_ON_HERO} break-words`}
                    >
                      {link.value}
                    </a>
                  )}
                </p>
              </li>
            ))}
          </ul>

          {/*
            THE STAMP, AND WHY THE COMPOSITION ENDS BOTTOM-HEAVY.

            THE CURTAIN IS REVEALED BOTTOM-UP, WHICH INVERTS READING ORDER, and
            that is the single fact the arrangement has to answer. The first
            sliver of plate to appear is its bottom edge, and whatever lives
            there is read first, out of sequence, in a band a few dozen pixels
            tall. A heading or a sentence cannot survive being read that way. A
            STAMP CAN — it is not a sentence, it has no order, and it is
            complete at any size. So the reveal reads as a signature emerging
            from under the page: the wordmark, then the mark and year, then the
            links, then the sentence, then the heading, as the page lifts. By
            the time the plate is fully exposed the composition re-reads
            correctly top-down. Both passes are coherent, which is the only
            arrangement of this content for which that is true.

            THE WORDMARK INHERITED THIS SLOT ON 2026-08-23 AND THE ARGUMENT CAME
            WITH IT, RATHER THAN BEING DELETED. A wordmark is a stamp: it
            satisfies every clause above, and it satisfies the DARK MODE clause
            better than a 34px monogram did. The occlusion edge measures 1.01:1
            in dark mode and is invisible, so the reveal is carried entirely by
            content entering the strip — and the strongest element in the
            composition is now the first thing the strip contains.

            THE ALTERNATIVE REJECTED: the stamp as a letterhead at the TOP of
            the plate. It composes well statically and it kills the copyright
            reading outright. It fails twice — the first sliver would then be
            empty plate, which in dark mode is nearly indistinguishable from
            `bg-base`, so the curtain would open on a band of apparent nothing;
            and THE NAVBAR'S OWN MS MARK IS FIXED AT TOP-LEFT, so a second mark
            at the plate's top-left puts two identical marks in one vertical
            line on every scroll-up. The bottom placement has no collision.

            `mt-xl` (55px) RATHER THAN THE OLD `mt-2xl sm:mt-3xl`. The stamp is
            no longer the plate's closing beat — the wordmark is — so it takes
            the same 55px separation the link list takes from the closing line
            rather than a terminal-sized gap. The 89/144px it used to take is
            what the wordmark's own slot is built out of.
          */}
          <div className="mt-xl flex items-center gap-xs">
            {/*
              `variant="nav"` — the settled mark, static, no third dressing.
              Decided upstream and not reopened.

              `text-hero-fg` AT FULL OPACITY: the mark is `currentColor`. It is
              the smaller of the two stamp elements now, but it is still the
              solid one — the year beside it carries the recession, which is
              what builds hierarchy inside the stamp itself.

              `label={null}` — DECORATIVE, DELIBERATELY, and passed explicitly
              rather than left to the default so the choice is on the record.
              The navbar's mark already carries the accessible name on the same
              page, and a second labelled instance announces "Muhammad Saad"
              twice inside one document. A screen-reader user entering
              `contentinfo` wants the links, which are a real `<ul>` with an
              honest count.

              `block` because an `<svg>` is inline by default and would sit on a
              text baseline with descender space under it, which would throw the
              row's vertical centring off by the descender.

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

            {/*
              THE YEAR — AND IT IS STILL NOT A COPYRIGHT LINE, BUT ONE OF THE
              THREE THINGS THAT KEPT IT ON THE RIGHT SIDE OF THAT LINE CHANGED
              ON 2026-08-23 AND IS REPLACED RATHER THAN QUIETLY DROPPED.

              IT USED TO READ: "1. It sits BELOW the mark, left-aligned to the
              mark's left edge, not beside it. Every copyright line ever written
              is horizontal; a vertical mark-over-date stack is a stamp." That
              was true and it is now false — mark and year sit on ONE ROW, which
              is exactly the horizontal arrangement that sentence warned about.

              WHAT REPLACES IT: the row is no longer the last thing on the
              plate. It sits ABOVE a signature, which makes it a DATE STAMP on a
              signed piece rather than legal furniture appended after the
              content. A copyright line is the last thing in a document by
              definition; this one is not. The demotion to a 21px mark is part
              of the same reading — legal furniture is set at body size, a stamp
              is set small.

              THE OTHER TWO ARE UNCHANGED AND STILL BINDING:
                - It is four digits and nothing else. No `©`, no name, no "All
                  rights reserved", no range, no separator glyph.
                - Nothing on this surface may state a fact Saad has not stated,
                  and a copyright assertion is a claim.

              `gap-xs` is 8px — the same 8px that binds each link's label to its
              value as ONE unit a few lines above, used here for the same job.

              IF IN REVIEW THIS STILL READS AS A COPYRIGHT LINE, THE FIX IS TO
              DELETE THE YEAR and leave the mark alone. It is not to add a
              label, a rule, a border or an explanatory caption — every one of
              those makes it more like legal furniture, not less. A bare mark is
              a perfectly good signature and `docs/07` §5's "stamp/signature
              detail" is satisfied by the mark alone.
            */}
            <p className="text-caption font-mono text-hero-fg/70">
              {CONTACT_EDITION_YEAR}
            </p>
          </div>

          {/*
            THE SIGNATURE. Saad's request, 2026-08-23: the name "sized and
            positioned as the dominant visual element of the footer", with the
            MS mark and year demoted above it into a smaller, secondary detail.

            `aria-hidden`, AND THAT IS NOT AN OVERSIGHT. The name is already in
            the accessibility tree twice on this page — the navbar's mark
            carries it, and the page's `<h1>` carries it — and the
            `MonogramMark` directly above passes `label={null}` at this very
            call site for exactly this reason. A third announcement inside
            `contentinfo` is redundancy, not access. The `<h2>` still names the
            landmark "Contact" and the links are still a real `<ul>` with an
            honest count; the wordmark is invisible to a screen reader and
            nothing is lost by that.

            IT DOES NOT OUT-WEIGH THE THREE LINKS, AND THAT IS ARITHMETIC RATHER
            THAN REASSURANCE — RE-STATED AT THE NEW SIZE ON 2026-08-23, because
            a comment whose conclusion survives while its arithmetic rots is a
            class of defect this repo has already shipped six of.

            Stroke length scales linearly with the type size at a fixed 1.5px
            non-scaling stroke, so the outlined wordmark's ink went from
            ~1,860px at F=72 to ~2,584px at F=100 — where this note previously
            claimed parity with the three link values' ~1,860px. THE EFFECTIVE
            INK WENT DOWN ANYWAY, because the resting alpha fell in the same
            change:

                before   1,860px x 0.70 = 1,302px
                after    2,584px x 0.45 = 1,163px      (-11%)

            The enlargement is PAID FOR by the lightening; they are one change,
            not two competing ones. Solid-filled it would still carry roughly
            five times the outlined figure, which is why it is outlined — not
            because outlined display type looks good. Three more things hold the
            hierarchy independently of the ink:
            it is LAST in the DOM and last on the plate, so at full exposure the
            read is heading, sentence, links, mark+year, signature; it is
            NEUTRAL and un-underlined where the links are teal and permanently
            underlined, so it cannot be mistaken for something to activate; and
            it is invisible to assistive technology.

            THE BOX IS THE WORDMARK, not a full-measure band. `w-fit` plus an
            aspect ratio derives the width from the height and the string's own
            advance, which does three things at once: the leading edge sits on
            the spine (Rule S-1), ~999px of void is left to its right at 1440
            (also Rule S-1 — the void is the site's grammar and this is the
            site's LAST surface), and the hover target is the wordmark rather
            than a 1262px-wide invisible strip across the bottom of the plate.

            THE 2026-08-23 ENLARGEMENT DID NOT TOUCH THIS CLASS, AND THAT IS
            THE WHOLE POINT OF WHERE IT WAS SPENT. Saad asked for a bigger
            signature; the lever taken was `FONT_SIZE_UNITS` 72 -> 100 in
            `textHoverEffectMetrics.ts`, which grows the glyphs INSIDE the
            100-unit viewBox and costs the plate 0px of height. The box class
            below is unchanged, so the "DO NOT RAISE IT WITHOUT RE-MEASURING"
            warning was not triggered — and the plate was re-measured anyway:
            composed content still 775.98px at every width from 1280 up, in 24
            of 24 cases. The wordmark's rendered box went 262.93 x 144 to
            365.18 x 144; only the WIDTH moved.

            `h-2xl sm:h-3xl` — 89px below 640, 144px at 640 and up, and THE SIZE
            IS BOUNDED BY THE SHORTEST SUPPORTED VIEWPORT, NOT THE TALLEST. The
            plate's composed content has to fit inside a 768px-tall laptop
            viewport or the curtain there becomes a crawl over something that
            can never be seen whole — which is reason 1 of the below-768
            carve-out, applied to a laptop. A larger `sm:h-4xl` (233px) was
            available and was declined by Saad on exactly that trade: "accept
            the constrained size, don't spend more of the footer's height budget
            chasing a bigger wordmark." DO NOT RAISE IT WITHOUT RE-MEASURING THE
            PLATE AT 1366x768 AND 1280x720.

            `text-hero-fg` — FULL STRENGTH, AND IT USED TO BE `/70`. The class
            sets `color` for both of the component's layers through
            `currentColor`. The resting outline's recession is now a
            `strokeOpacity` of 0.45 set INSIDE the component (3.91:1 on
            #07090C), not an alpha modifier on a text token out here; that
            constant's docstring carries the arithmetic and the reason the
            mechanism is not interchangeable. The reveal layer paints at full
            strength, so the parent has to BE full strength.

            `revealAccent` IS PASSED, AND CYAN IS LICENSED HERE SPECIFICALLY.
            The standing refusal in `text-hover-effect.tsx` computed cyan at
            ~9,300px of ink against this plate's one licensed 34x3px bar
            (102px) — 91x, "which is not sparingly". THAT WAS COMPUTED AGAINST A
            SOLID RESTING FILL this component does not paint and is forbidden
            from painting. What ships is a stroke ramp inside a masked disc, on
            hover only: ~42px of effective cyan, against the bar's 102px, and
            transient where the bar is permanent. Both of CLAUDE.md's conditions
            — "sparingly" and "on its own dark surface" — are met, on the plate
            CLAUDE.md licenses by name.

            TEAL IS STILL REFUSED, AND MORE FIRMLY ON HOVER THAN AT REST. That
            half of the refusal was never about area: teal means "activate this"
            and nothing else on this site, so a 365px neutral wordmark that
            turns teal UNDER THE CURSOR is the canonical signal of an
            interactive control, on an `aria-hidden` non-link. At rest a teal
            wordmark is a static mistake; on hover it is an active lie. Do not
            "harmonise" this to teal later.

            THIS IS THE SECOND DOM CONSUMER OF `--accent-hero`, and `docs/03`'s
            count was amended from ONE to TWO in the same commit. Both are on
            this plate, both `aria-hidden`, both non-interactive; the bar is
            34x3px and permanent, this one is pointer-transient.
            `grep -rn "accent-hero" components/` now returns three hits instead
            of two, which is the audit still working rather than failing.

            THE ASPECT RATIO IS AN INLINE STYLE, NOT AN ARBITRARY TAILWIND
            VALUE, because it is computed from `WORDMARK_VIEWBOX_UNITS` — the
            same constant the component's `viewBox` takes, itself derived from
            the em advance and the component's own exported `FONT_SIZE_UNITS`.
            Two spellings of one number is how the box and the glyphs drift
            apart.
          */}
          <div
            aria-hidden="true"
            className="mt-md h-2xl w-fit sm:h-3xl"
            style={{ aspectRatio: `${WORDMARK_VIEWBOX_UNITS} / 100` }}
          >
            <TextHoverEffect
              text={WORDMARK_TEXT}
              viewBoxWidth={WORDMARK_VIEWBOX_UNITS}
              revealAccent
              className="text-hero-fg"
            />
          </div>
        </div>
      </footer>
    </>
  );
}

export default RevealFooter;
