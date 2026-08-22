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

/**
 * The reveal footer — Phase 5's curtain, and the end of the document.
 *
 * IT ABSORBED `Contact.tsx`, whose header was a decision record rather than
 * commentary. Everything that file settled is INHERITED HERE UNCHANGED and is
 * repeated below rather than linked, because the file it lived in is gone. The
 * curtain changed this component's GEOMETRY and added TWO content atoms (a mark
 * and a year). It changed nothing else.
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
 * the plate's BOTTOM at rest, which is the stamp, which is the one element in
 * the composition designed to be read out of sequence.
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
 * NOTHING COMES AFTER THE LINKS EXCEPT THE STAMP. No copyright line, no
 * colophon, no "built with": a copyright line states nothing a visitor needs
 * and nothing in dispute, and a stack brag is the wrong thing on the one
 * surface CLAUDE.md reserves for real links. `CurrentlyLearning` owns the
 * site's only freshness stamp. THE MARK + YEAR IS NOT A COPYRIGHT LINE AND MUST
 * NOT BECOME ONE — see the stamp's own comment below.
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
 * #07090C with #E8EAEC: full 16.68:1, `/70` 8.21:1, `/50` 4.60:1. The
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
 * EXPLICITLY NOT, and each must stay absent: no R3F, no Canvas, no camera, no
 * `three` import, no GSAP, no ScrollTrigger, no parallax, no scroll-linked
 * value, no `useScroll`, no `100dvh` / `min-h-screen` / any viewport-unit
 * height — NOT EVEN AS A `max-height` — no particle field, no glow, no blur, no
 * box-shadow, no gradient, no radius (no token exists), no hover transform, no
 * counter, no typewriter, no marquee, and NO INFINITE OR REPEATING ANIMATION.
 * The last one is sharper here than it was: a pinned element at the bottom of
 * the page is one the visitor can sit on indefinitely BY CONSTRUCTION.
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
 * HOW HEIGHT IS BOUNDED WITHOUT A VIEWPORT UNIT: compositionally. The plate is
 * the sum of eight known spacing values and measures ~790px at 1440px wide. The
 * two things that could grow it are more `contact` entries (which wrap into the
 * existing flex row, adding one ROW height per wrap, not one per entry) and a
 * longer closing line (capped by `max-w-[34rem]`). THE RULE: if the plate's
 * measured height ever exceeds 900px at >=1024px, THE FIX IS TO CUT CONTENT,
 * NOT TO CAP THE BOX.
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
 * The stamp's mark, in CSS pixels — `--spacing-lg` on the Fibonacci scale, ONE
 * VALUE AT EVERY BREAKPOINT.
 *
 * Exactly 2x the navbar's 17px and well clear of the 17px legibility floor
 * (`MIN_HEIGHT_PX` in `msMarkGeometry.ts`), so the **S's** 44-unit gap — the
 * tightest clear air anywhere in the mark — holds with 4.68px of it
 * (44 x 34 / 320, against 2.34px at the 17px floor). At the 592x320 viewBox the
 * stamp renders 62.9px wide, comfortable inside the 318px of content available
 * at a 360px viewport.
 *
 * THE 34px IS RIGHT; THE DERIVATION UNDER IT WAS NOT. This read "the M's
 * 44-unit bar gap holds with ~4.2px of clear air". The M is ONE polygon and has
 * no bar gaps — that was the THREE-BAR faceted M, whose gap was 40 units, which
 * is where the ~4.2px came from (40 x 34 / 320 = 4.25). Both `Navbar.tsx` and
 * `msMarkGeometry.ts` already record the S as what binds, and `docs/07` §2.1
 * records fixing this identical dead derivation elsewhere. Nothing about the
 * size changes; the sentence now points at the constraint that actually
 * governs it, so a future resize is measured against the right gap.
 *
 * NO BREAKPOINT RAMP, deliberately: a mark that grows with the viewport reads
 * as a logo lockup rather than as a stamp.
 *
 * A NUMBER AND NOT A CLASS because `MonogramMark` takes `size` as a prop and
 * turns it into an inline height with `width: auto` — the viewBox does the
 * rest.
 */
const STAMP_MARK_PX = 34;

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
        className="relative z-0 w-full bg-hero-surface pt-2xl pb-2xl sm:pt-3xl sm:pb-3xl md:sticky md:bottom-0"
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

          {/* Weight left at the inherited 400, as in every shipped section: the
              type scale carries the size. */}
          <h2 id="contact-heading" className="text-h2 text-hero-fg">
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
            THE STAMP, AND WHY IT IS AT THE BOTTOM RATHER THAN THE TOP.

            THE CURTAIN IS REVEALED BOTTOM-UP, WHICH INVERTS READING ORDER, and
            that is the single fact the arrangement has to answer. The first
            sliver of plate to appear is its bottom edge, and whatever lives
            there is read first, out of sequence, in a band a few dozen pixels
            tall. A heading or a sentence cannot survive being read that way. A
            STAMP CAN — it is not a sentence, it has no order, and it is
            complete at any size. So the reveal reads as a signature emerging
            from under the page: mark, then year, then the links, then the
            sentence, then the heading, as the page lifts. By the time the plate
            is fully exposed the composition re-reads correctly top-down. Both
            passes are coherent, which is the only arrangement of this content
            for which that is true.

            It is also what carries the reveal in DARK MODE, where the occlusion
            edge measures 1.01:1 and is invisible: the strongest element in the
            composition, a solid `text-hero-fg` monogram at 16.68:1, is the
            first thing the strip contains.

            THE ALTERNATIVE REJECTED: the stamp as a letterhead at the TOP of
            the plate. It composes well statically and it kills the copyright
            reading outright. It fails twice — the first sliver would then be
            empty plate, which in dark mode is nearly indistinguishable from
            `bg-base`, so the curtain would open on a band of apparent nothing;
            and THE NAVBAR'S OWN MS MARK IS FIXED AT TOP-LEFT, so a second mark
            at the plate's top-left puts two identical marks in one vertical
            line on every scroll-up. The bottom placement has no collision.

            IF THE 144px OF EMPTY PLATE BELOW THE STAMP EVER READS AS NOTHING in
            dark mode, the fix is to reduce the plate's bottom padding to
            `pb-xl sm:pb-2xl` and record it as a deliberate, curtain-specific
            revision of the symmetry rule. NOT a shadow, NOT a rule, NOT a
            lighter plate.
          */}
          <div className="mt-2xl sm:mt-3xl">
            {/*
              `variant="nav"` — the settled mark, static, no third dressing.
              Decided upstream and not reopened.

              `text-hero-fg` AT FULL OPACITY: the mark is `currentColor`, and
              this is the first thing the reveal shows — a recessed first sight
              is a weak opening. The year below carries the recession instead,
              which also builds hierarchy inside the stamp itself.

              `label={null}` — DECORATIVE, DELIBERATELY, and passed explicitly
              rather than left to the default so the choice is on the record.
              The navbar's mark already carries the accessible name on the same
              page, and a second labelled instance announces "Muhammad Saad"
              twice inside one document. A screen-reader user entering
              `contentinfo` wants the links, which are a real `<ul>` with an
              honest count.

              `block` because an `<svg>` is inline by default and would sit on a
              text baseline with descender space under it, which would make the
              5px bind below inexact.

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
              THE YEAR — AND IT IS NOT A COPYRIGHT LINE. Four digits at the
              bottom-left of a dark footer under a monogram is one layout
              decision away from becoming one, which this file bans outright.
              Three things keep it on the right side of that line:

                1. It sits BELOW the mark, left-aligned to the mark's left edge,
                   not beside it. Every copyright line ever written is
                   horizontal; a vertical mark-over-date stack is a stamp.
                2. It is four digits and nothing else. No `©`, no name, no "All
                   rights reserved", no range, no separator glyph.
                3. It is the last thing in the document and the FIRST thing
                   revealed, so it is framed as the signature on the piece
                   rather than as legal furniture appended after the content.

              `mt-2xs` is 5px — tight enough that the mark and the year are
              unambiguously one object rather than two stacked elements.

              IF IN REVIEW THIS STILL READS AS A COPYRIGHT LINE, THE FIX IS TO
              DELETE THE YEAR and leave the mark alone. It is not to add a
              label, a rule, a border or an explanatory caption — every one of
              those makes it more like legal furniture, not less. A bare mark is
              a perfectly good signature and `docs/07` §5's "stamp/signature
              detail" is satisfied by the mark alone.
            */}
            <p className="mt-2xs text-caption font-mono text-hero-fg/70">
              {CONTACT_EDITION_YEAR}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default RevealFooter;
