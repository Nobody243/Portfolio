import Image from "next/image";

import portrait from "@/public/images/about/portrait.jpg";
import { CvAction } from "@/components/about/CvAction";
import {
  ABOUT_BUTTON_SECONDARY,
} from "@/components/about/aboutButtonStyles";
import {
  ABOUT_PAGE_GITHUB_LABEL,
  ABOUT_PAGE_LINKEDIN_LABEL,
  ABOUT_PAGE_MARK_LABEL,
  ABOUT_PAGE_PARAGRAPH,
  ABOUT_PAGE_PORTRAIT_ALT,
} from "@/components/about/aboutPageContent";
import { ParticleGrid, QUIET_FIELD } from "@/components/hero/ParticleGrid";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { MonogramMark } from "@/components/ui/MonogramMark";
import { Reveal } from "@/components/ui/Reveal";
import { contact } from "@/content/contact";
import { STAGGER } from "@/lib/animation/easing";

/**
 * The portrait's `sizes`, SHARED VERBATIM BY BOTH `<Image>` ELEMENTS BELOW,
 * and the sharing is what makes two elements cost one download.
 *
 * THERE ARE TWO ELEMENTS BECAUSE CSS CANNOT REPARENT A NODE. Below 1024px the
 * photograph belongs inside the mark's row; from 1024px up it is a sibling of
 * the whole text block. No arrangement of `order`, `contents` or positioning
 * moves a node between those two parents, so each placement gets its own
 * element and the other is `display: none`. Exactly one is ever rendered.
 *
 * BOTH CARRY THIS FULL THREE-BAND STRING, INCLUDING THE BAND AT WHICH THAT
 * ELEMENT IS HIDDEN. That is not sloppiness — it is the mechanism. `priority`
 * makes each element emit a `<link rel=preload as=image>` carrying
 * `imageSrcSet` + `imageSizes`, and the browser resolves a preload against ITS
 * OWN viewport, not against the CSS that will later hide the element. Because
 * the two strings are identical, Next deduplicates them into a SINGLE preload
 * (verified in the served HTML) and it resolves to exactly the derivative the
 * visible element needs. Narrowing either string to just its own band —
 * `"384px"` on the desktop one being the obvious "tidy-up" — would make a
 * phone preload a desktop derivative it never paints. VERIFIED: exactly one
 * image request at every tested viewport and every tested DPR.
 *
 * EXACT PIXELS, NOT A `vw` EXPRESSION, matching this file's standing rule. The
 * `lg` band is fluid (247px at 1024 growing to the 384px cap at 1161), and
 * declaring the band's MAXIMUM only ever over-selects — 247 and 384 land on
 * the same 384 bucket anyway.
 *
 * MEASURED SELECTION, one request in every case: w=128 at 375/DPR-1, w=256 at
 * 375/DPR-2 and at 640-1023/DPR-1, w=384 at 375/DPR-3 and at every desktop
 * DPR-1, w=828 at desktop DPR-2 (384 x 2 = 768 selects the 828 bucket), w=1200
 * at desktop DPR-3. 828 is the realistic ceiling; 1200 is the true one and is
 * still ~3.4x smaller than the master in each dimension.
 *
 * THE 4096x4096 MASTER IS STRUCTURALLY UNREACHABLE, verified rather than
 * assumed: 4096 exceeds `next/image`'s largest deviceSize (3840), so no bucket
 * resolves to it and the largest URL in the srcset is w=3840. `next/image`
 * also writes that same w=3840 URL into the plain `src` attribute as the
 * no-srcset fallback — it is a RESAMPLED DERIVATIVE, not the master, and no
 * browser that understands `srcset` ever requests it (confirmed: exactly one
 * request per load, always the bucket above). The two ways to break the
 * guarantee are `unoptimized: true` in `next.config.ts` and a raw
 * `<img src={portrait.src}>`. Neither exists; neither may be added.
 */
const PORTRAIT_SIZES = "(min-width: 1024px) 384px, (min-width: 640px) 144px, 112px";

/**
 * `/about` — one screen, one paragraph, three controls, and nothing else.
 *
 * THE ONE DELIBERATELY QUIET PAGE ON THE SITE. `docs/07_SITE_RESTRUCTURE.md` §6
 * says so in as many words, and the composition in
 * `.claude/handoff/about-design.md` is built around it. Four absences are
 * DECISIONS, not omissions, and each has a place elsewhere on the site that a
 * later pass might mistake this page for having forgotten:
 *
 *   1. NO SCROLL. `h-dvh` + `overflow-hidden`. Nothing below the fold, ever. If
 *      content is ever added that does not fit, the answer is to cut it or to
 *      re-open the page's design with Saad, NOT to remove the overflow rule.
 *   2. NO REVEAL FOOTER. Home and Work only (§5). The curtain's ScrollTrigger
 *      maths need a scrolling page and this page has none.
 *   3. NO SCROLL-SCRUB, NO PINNING. §5 closes that question by name: scrubbed
 *      animation is Home only.
 *   4. NO DRIVER OF ITS OWN. Rewritten 2026-08-22; it read "NO `Reveal`, and
 *      therefore NO CLIENT BOUNDARY except the two that earn one — the canvas
 *      and the CV control. There is nothing to reveal on a page with no
 *      scroll, and a fade on load would be motion for its own sake on the page
 *      whose whole brief is quiet." THE PAGE NOW RUNS ONE `Reveal` PER UNIT ON
 *      LOAD, so that sentence is kept above rather than deleted, because its
 *      premise is the thing that changed and not the conclusion's wording.
 *
 *      The premise was that QUIET MEANS STATIC. It does not — quiet is a claim
 *      about amplitude and about what drives the motion. A page that is
 *      complete in frame 1 while every other route on the site assembles is
 *      not quieter than its neighbours, it is DISCONTINUOUS with them, and a
 *      page that behaves unlike the rest of the site reads as unfinished
 *      rather than as calm. The replacement claim is narrower and checkable:
 *      `/about` is quiet because it has NO DRIVER OF ITS OWN — no scroll, no
 *      scrub, no reveal footer, no hover motion, no loop beyond the shared
 *      particle field. It runs the site's standard entrance ONCE, on load, and
 *      then nothing on this page ever moves again.
 *
 *      Absences 1, 2 and 3 are untouched by that, and so is the client-boundary
 *      count's REASONING even though the count itself moved: `Reveal` is a
 *      client component, so the page now has three kinds of client leaf
 *      (canvas, CV control, reveals) and `AboutScreen` itself is still a
 *      server component rendering server-rendered children into them.
 *
 * ALSO ABSENT: the command sphere. §6 pins it to Home. `sphere={false}` below
 * is that rule, written where it can be checked.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE PORTRAIT ARRIVED HERE FROM TRAJECTORY on 2026-08-22, at Saad's request
 * and per `.claude/handoff/about-design.md` §9. It filled the third column of
 * Home's Trajectory section between `95ae847` and that move; `/about` is the
 * page it was always about. This paragraph used to end "It brings NO motion
 * with it — it is not wrapped in `Reveal`, it does not scrub, and it does not
 * fade in." The middle clause is now false and the outer two are still true:
 * it takes part in the page's one-shot entrance like every other unit, it
 * still does not scrub, and it still has no hover, no filter and no
 * placeholder. See absence 4.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE ENTRANCE — FOUR UNITS, ONE SHOT, THEN STILLNESS.
 *
 * `Reveal`, used UNCHANGED, with the `delay` prop it already has. Not a new
 * component and not a new prop: `Reveal` is `whileInView` at `amount: 0.1`,
 * and on a page that is exactly one screen every unit is already in view, so
 * the first observer tick fires all of them on mount — hard load and client
 * navigation alike. That satisfies the site's motion rule by construction:
 * same driver (elapsed time), same curve (`EASE.reveal`), same numbers
 * (`y: 13 -> 0` over `DURATION.reveal`, `opacity: 0 -> 1` over half of it), a
 * new TRIGGER. 13px and not 21px — 21 is scrub-only.
 *
 * FOUR UNITS AT 0 / 0.10 / 0.20 / 0.30, in document order: the mark's row,
 * the paragraph, the action row, the portrait. Last unit fully settled at
 * 0.30 + 0.70 = 1.00s, which is exactly `Reveal`'s stated budget.
 *
 * AN INDEX-SHAPED CASCADE IS LEGAL HERE AND ALMOST NOWHERE ELSE. `STAGGER.line`
 * forbids it "wherever units have independent triggers and a reader may arrive
 * at one deliberately", because the delay is then measured from the wrong
 * origin. `/about` cannot scroll, has no anchors into it, and every unit
 * always enters on the same tick — the exact condition that docstring names as
 * safe. The delays are written out as multiples rather than derived from a map
 * index so they are auditable at the call site, and they increase
 * monotonically, which is the actual invariant.
 *
 * THE ACTION ROW IS ONE UNIT, NOT THREE. Three buttons arriving one after
 * another is the clearest generic-portfolio tell available on this page, and
 * it would put the last control's arrival past 0.4s for no informational gain.
 * One `Reveal` around the row.
 *
 * THE MOBILE PORTRAIT IS NOT A FIFTH UNIT. Below 1024px it lives inside the
 * mark's row, so it arrives with the mark at delay 0 — which is correct, since
 * the pair is one identity block and splitting it would be the page's only
 * intra-unit stagger. The fourth unit is the DESKTOP portrait, `display: none`
 * below `lg`, so below `lg` the page is three units at 0 / 0.10 / 0.20 and
 * still monotonic.
 *
 * THE PARTICLE CANVAS DOES NOT PARTICIPATE. It is already drawing when the
 * entrance runs and it is background; fading it would make the page's arrival
 * read as a curtain rather than as content settling.
 *
 * REDUCED MOTION NEEDS NO SECOND CODE PATH. `MotionProvider`'s
 * `reducedMotion="user"` drops transform and keeps opacity, so the page
 * becomes four fades at 0 / 100 / 200 / 300ms with zero travel. THE STAGGER IS
 * DELIBERATELY KEPT: it is what every other `Reveal` on the site does under
 * the preference, and giving this one page a private rule would be the
 * inconsistency rather than the fix.
 *
 * THE NO-JS NET IS `Reveal`'s OWN. Framer writes `initial` into the server
 * HTML, so `opacity: 0` genuinely ships; `app/layout.tsx`'s
 * `[data-reveal]{opacity:1!important;transform:none!important}` inside
 * `<noscript>` undoes it, and `Reveal` sets that attribute. Nothing extra is
 * needed here — but nothing may remove it either.
 *
 * THE 13px START POSITION AGAINST THE CLIP BUDGET — measured, and one case
 * does not clear it. Each unit begins 13px BELOW its resting place, so the
 * bottom-most unit needs 13px of resting bottom slack to stay inside the box
 * that absence 1 will not let scroll. MEASURED at the action row's maximum
 * bottom edge during the entrance:
 *
 *     1440x900   0px over        375x667   0px over  (5.64px to spare)
 *     1280x800   0px over        640x800   0px over
 *     1024x600   0px over        768x1024  0px over
 *     390x844    0px over        414x896   0px over
 *     2560x1440  0px over
 *     360x640    7.86px OVER — the two secondaries lose their bottom edge
 *                for ~80ms, at opacity <= 0.7, then settle correctly
 *
 * THE STANDING FALLBACK IS NOW SHIPPED, 2026-08-22: the action row alone
 * passes `fadeOnly` and drops its `y` leg. The paragraph above is kept intact
 * because its measurement is still the reason, and because it named the exact
 * fix that was taken — but its last three sentences are now out of date and
 * are corrected here rather than deleted:
 *
 *   - "It is NOT implemented here because `Reveal` must stay byte-identical."
 *     That constraint was Ticket 6b's, recorded in `ScrubReveal`'s header, and
 *     what it protects is `TRAVEL_PX` not drifting from `TIMED_TRAVEL_PX`.
 *     `fadeOnly` leaves `TRAVEL_PX` at 13 and adds no curve, no duration and no
 *     distance, so the duplication reasoning is untouched. The prohibition was
 *     lifted deliberately, not worked around.
 *   - "NEVER fix this by inventing a smaller travel number, and never by
 *     relaxing `overflow-hidden`." BOTH STILL STAND, and they are the reason
 *     the prop is a boolean rather than a number.
 *
 * Re-measured after the change at all ten viewports, both themes: zero units
 * over the bottom edge anywhere, 360x640 included. The other three units keep
 * their 13px travel; only this row fades. 360x640 has 5.14px of resting slack
 * — it was 4.25px before the portrait landed, so the clip was never a
 * regression the portrait introduced.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * RULE S-2 GENUINELY DOES NOT APPLY HERE, and a reviewer sweeping the site for
 * the 89+89 section seam will notice its absence and should stop here rather
 * than "fix" it. S-2 governs the seam between two adjacent sections. This page
 * has ONE section and no neighbour above or below it. Its vertical placement is
 * centring, not padding.
 *
 * WHAT IS NOT CENTRING IS THE TOP INSET, and it is the one number in this file
 * that the design brief does not supply. The navbar is `position: fixed` and
 * transparent, so it takes no space in flow: a block centred in the raw
 * viewport at 375x667 lands with its mark UNDER the bar's own mark. The block
 * is therefore centred in the area the bar leaves — `pt-xl` (55px) against a
 * ~48px bar on mobile, `sm:pt-2xl` (89px) against a ~64px one from 640px up.
 * Both are spine tokens rather than measured pixels, both clear the bar with
 * air, and 89 is the same inset every other first-section on the site opens
 * with, so the page's top edge reads as native. This is still centring — of the
 * region below the chrome, which is the only region there is.
 *
 * THE SPINE IS THE SAME SPINE SKILLS AND TRAJECTORY USE:
 * `mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl`, content capped at
 * the same `34rem` measure. Chrome went full-bleed in Phase 0 (§1's tracked
 * reversal of Rule S-1); CONTENT SECTIONS KEEP THE SPINE, and this is one.
 *
 * IT USED TO BE BYTE-IDENTICAL AND IS NO LONGER, because the portrait added
 * `lg:flex lg:items-center lg:gap-xl xl:gap-2xl` to the same element. The four
 * spine classes are untouched and Tailwind sorts the added ones in among them;
 * a reviewer diffing the container against Skills' should compare the
 * max-width and the three paddings, not the whole string.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TWO REVERSED RULES, RECORDED RATHER THAN DELETED — 2026-08-22. Both were
 * stated at the portrait's call site in capitals, and both rested on the same
 * premise, which Saad has since overridden.
 *
 *   1. "`hidden lg:block`, AND THE FETCH IS THE POINT." The portrait rendered
 *      from 1024px up and NOWHERE ELSE, and the argument was that there is no
 *      room for it below `lg` that does not clip or force a scroll. The
 *      no-scroll half of that is untouched and absolute — see absence 1. What
 *      changed is the conclusion drawn from it: the portrait now pairs with
 *      the mark in the header row, which costs only the difference between
 *      112px and 56px, and the action row's 1-up + 2-up rearrangement returns
 *      more than that difference. MEASURED at 375x667: the content box was
 *      576.52px tall and is 574.72px — it SHRANK by 1.80px with a photograph
 *      added to it. Bottom slack 17.75px -> 18.64px, top 72.73px -> 73.64px.
 *      The portrait is paid for, not squeezed in.
 *
 *   2. "DO NOT ADD `priority`, AND DO NOT SET `loading=\"eager\"`." That rule
 *      existed to keep a 617KB master off phones, and it was correct while the
 *      image was `display: none` on a phone — `display: none` plus lazy is
 *      genuinely what stopped the fetch. It is obsolete on both halves now.
 *      617,333 bytes is the MASTER's size on disk and was never what shipped:
 *      MEASURED off the optimiser at q=75, 1,286 bytes at w=128 (a DPR-1
 *      phone), 2,884 at w=256 (DPR-2), 4,588 at w=384 (DPR-3) and 16,488 at
 *      w=828 (a DPR-2 desktop), all WebP — the phone case is 0.2% of the
 *      master. And the image now sits inside the initial viewport at every
 *      breakpoint, where `loading="lazy"` fetches it immediately ANYWAY but
 *      without preload priority, which produces a visible pop into an empty
 *      box on a slow connection — the worst possible motion event on the page
 *      whose brief is quiet. `priority` removes it, and `placeholder="blur"`
 *      is still refused: it is the alternative this replaces, not a companion.
 *
 *      IT IS ON BOTH ELEMENTS, AND THAT WAS RE-EXAMINED ON 2026-08-22 RATHER
 *      THAN ASSUMED. The reversal above was written as if the plan had asked
 *      for it; the plan said the opposite, and the reversal was correct but
 *      undisclosed. `priority` on ONE element was measured as the alternative:
 *      at 375, 640 and 1440, at DPR 1 and 2, it gives IDENTICALLY one preload,
 *      one request and the same derivative (w=128 / 256 / 256 / 384 / 384 /
 *      828). So the second `priority` costs nothing — and it is not redundant
 *      either.
 *
 *      WHAT ONE WOULD COST IS A HIDDEN DEPENDENCY. With `priority` on the
 *      mobile element only, the DESKTOP `<img>` — the one actually painted at
 *      1024px and up, inside the initial viewport — carries `loading="lazy"`
 *      and is fast only because a preload emitted by a `display: none` sibling
 *      happened to resolve to the derivative it needs. Delete that sibling, or
 *      narrow its `sizes` to its own band (the "tidy-up" this file already
 *      warns about twenty lines up), and the visible portrait silently becomes
 *      lazy on every desktop. Each element declaring its own loading
 *      requirement is what makes that impossible, and the deduplication above
 *      is what makes it free.
 */
export function AboutScreen() {
  /* BY LABEL, NEVER BY INDEX. `content/contact.ts` states that its array order
     is display order for the reveal footer's link row and is free to change; an
     index here would one day render GitHub's URL under LinkedIn's label. Not by
     `kind` either — both are `"web"`, so that discriminant cannot tell them
     apart. `navContent.ts` makes the same call for the same reason.

     BOTH MAY BE `undefined`, AND THE ANSWER IS TO RENDER NOTHING. That is the
     site's standing rule for an absent link: never `href: "#"`, never a
     disabled-looking control, never a guessed URL. If Saad removes the LinkedIn
     entry, this row becomes two controls and stays correct. */
  const github = contact.find((link) => link.label === ABOUT_PAGE_GITHUB_LABEL);
  const linkedin = contact.find(
    (link) => link.label === ABOUT_PAGE_LINKEDIN_LABEL,
  );

  return (
    <section
      aria-labelledby="about-heading"
      className="relative h-dvh w-full overflow-hidden bg-base"
    >
      {/*
        THE PAGE HAD NO HEADING AT ALL, AND NO ACCESSIBLE NAME. Not a
        deliberate omission — this file lists four of those (no scroll, no
        footer, no scrub, no `Reveal`) and a heading was not among them.

        It slipped because the restructure plan's landmark checklist is
        meticulous about `<header>`, `<main>` and `<footer>` and never
        mentions headings. So `/about` — the page the whole positioning
        argument lives on, and the one most likely to be deep-linked — shipped
        with nothing for a screen reader's heading shortcut to find.

        `sr-only`, because the visual anchor is the mark and the page is
        deliberately quiet. That matches Home, where `HeroHeadline` renders
        the site's only other `<h1>` the same way.
      */}
      <h1 id="about-heading" className="sr-only">
        About
      </h1>
      {/* THE STAGE. `ParticleGrid` measures its own `parentElement` and hangs
          the pointer listener on it, so this wrapper must be the full-bleed box
          and the content must be INSIDE it — a content layer that were a
          sibling of this div would sit above a canvas whose container never
          saw the pointer, and the field would only respond in the margins.
          Same arrangement as `Hero.tsx`'s stage, for the same reason. */}
      <div className="absolute inset-0">
        {/* The same mesh the hero draws, thinned rather than veiled, and in
            `--field-ink` rather than the hero's Tier 1 cyan — see
            `QUIET_FIELD`. THAT SECOND HALF IS WHY THE PRESET NAMES A COLOUR:
            until 2026-08-22 the canvas hardcoded `--accent-hero`, so this line
            painted a full-viewport Tier 1 accent on a Tier 2 page in both
            themes, and nothing at this call site said so.
            `sphere={false}` keeps the command sphere on Home. */}
        <ParticleGrid field={QUIET_FIELD} sphere={false} />

        <div className="relative flex h-full items-center pt-xl sm:pt-2xl">
          {/* THE SPINE, NOW ALSO THE ROW. `lg:flex` turns the same container
              into text-then-portrait at 1024px.

              THE MEASURE IS NO LONGER THE ELASTIC ONE, AND THAT REVERSAL IS
              THE FIX. Until 2026-08-22 `shrink-0` sat on the PORTRAIT and this
              comment argued for it in as many words: "the portrait is
              fixed-width by design and the measure is the elastic one", so
              between 1024px and ~1091px the container was narrower than
              544 + 89 + 280 and the 34rem measure yielded rather than the
              image shrinking. MEASURED AT 1024x600 BEFORE THE CHANGE: the
              measure was 477px, not 544px, and the paragraph wrapped to eight
              lines instead of seven.

              That trade is backwards for this page. The paragraph is the
              content; the photograph is the enhancement. So `shrink-0` moved
              to the TEXT and the portrait took `flex-1` (basis 0, grow into
              whatever the text leaves, freeze at its cap). Measured after:
              the measure is 544px at 1024, 1091, 1161, 1280, 1440 and 2560,
              and the portrait is the elastic one — 247px at 1024, 314px at
              1091, capped from 1161 up.

              `lg:gap-xl xl:gap-2xl`, NOT `gap-2xl` THROUGHOUT. At 1024 the
              container is 846px, and 544 + 89 + 213 (the portrait's floor)
              is 846 EXACTLY — a row with zero slack is one rounding
              difference from an overflow. At `gap-xl` the same row is 812px
              with 34px in hand. Both are existing spine steps; no new token,
              and the wider gap returns at `xl` where there is room for it. */}
          <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:flex lg:items-center lg:gap-xl lg:px-2xl xl:gap-2xl">
            <div className="max-w-[34rem] lg:shrink-0">
              {/*
                THE MARK IS `variant="nav"` AT A LARGER SIZE — NOT A THIRD
                VARIANT. `MonogramMark.tsx`'s own header says it: "the navbar
                renders it at 17px and the About page will render the same thing
                at 72px; those are not two variants, they are one variant and a
                size." The plan's "its `about` state" means STATE — static, and
                bigger — not a new `variant` value. At 72px the mark is 4.2x the
                17px floor, so none of the small-size clearance reasoning in
                `msMarkGeometry.ts` is in play.

                SIZED BY CLASS RATHER THAN BY THE `size` PROP, because the size
                is responsive (56px below 640, 72px above) and `size` writes a
                single inline `height`, which no breakpoint can override. The
                prop is right for the navbar's one fixed height and wrong here;
                `w-auto` reproduces exactly what it would have set.

                IT CARRIES A REAL LABEL, unlike the navbar's decorative one:
                there is no adjacent text on this page saying whose site it is.

                STATIC. NO ANIMATION ON IT, AT ALL — §6: "static only, no
                animation here; About stays the quiet page."

                IT SHARES ITS ROW BELOW 1024px, and the wrapper below is why.
                See the mobile portrait's own note: the two identity artifacts
                pair at a fixed 2:1, mark first. At `lg` the portrait leaves
                for the second column and `lg:block` puts this element back in
                exactly the block context it had before the row existed.
              */}
              {/* UNIT 1 of the entrance, delay 0. `Reveal` renders the row's
                  own `<div>` rather than adding one around it — its
                  `className` is passed straight to the `motion.div`, so the
                  flex row and the revealed box are the same element and the
                  resting layout is unchanged. Verified: geometry at rest is
                  identical to the pre-entrance build at every viewport. */}
              <Reveal className="flex items-center gap-md lg:block">
                <MonogramMark
                  variant="nav"
                  label={ABOUT_PAGE_MARK_LABEL}
                  className="h-[56px] w-auto text-fg sm:h-[72px]"
                />

                {/*
                  THE PORTRAIT, BELOW 1024px — PAIRED WITH THE MARK, NOT
                  STACKED ABOVE THE PARAGRAPH.

                  Below `lg` the page is one column and there is no second
                  column to put a photograph in. Stacking it would cost its
                  full height; putting it in the mark's row costs only the
                  DIFFERENCE between the two, and it makes a composition
                  rather than an insertion — the site's two identity artifacts
                  on one line. It is exactly 2x the mark's height at both
                  sizes (112/56 below 640, 144/72 above), which is one ratio
                  expressed at two sizes rather than two arbitrary numbers.

                  MARK FIRST, PORTRAIT SECOND. The mark is the page's
                  established visual entry and reading order is not re-ordered
                  for a photograph.

                  NOT A CENTRED CIRCULAR AVATAR ABOVE THE NAME. That is the
                  universal template mobile About page, and this codebase
                  ships no radius token to build it with.

                  `shrink-0` GUARDS THE 2:1, and it never engages today.
                  Measured at 375: 103.59 (mark at h-56, viewBox 592x320) +
                  21 (gap-md) + 112 = 236.59 inside a 333px measure, 96px
                  spare. At 640: 133.19 + 21 + 144 = 298.19 inside 530px, 232
                  spare. Without it, a future longer mark would silently
                  squeeze the photograph out of square rather than overflow.
                */}
                <Image
                  src={portrait}
                  alt={ABOUT_PAGE_PORTRAIT_ALT}
                  sizes={PORTRAIT_SIZES}
                  priority
                  className="aspect-square w-[112px] shrink-0 object-cover sm:w-[144px] lg:hidden"
                />
              </Reveal>

              {/*
                THE HEADROOM IS NOT OPTIONAL. 65 words at `text-body` (16px,
                1.6 line-height = 25.6px) on a 34rem measure wraps to 5-6 lines
                at desktop. The reserve is SEVEN lines (7 x 25.6 = 179px), and
                nine on mobile, because both of `docs/07` §6's remaining content
                notes LENGTHEN this paragraph: if C1's coursework qualifier ever
                returns, or C2's referent is named more fully, it grows. A block
                measured exactly to today's word count gets re-measured twice,
                and the action row below moves both times.

                GROWTH CONSUMES SLACK, IT DOES NOT SHRINK THE TYPE. The measure
                stays 34rem and the size stays `text-body`. Fitting a longer
                paragraph by dropping to `text-caption` is the exact failure
                this reserve exists to prevent.
              */}
              {/* UNIT 2, delay `STAGGER.line`. The `<p>` keeps its own
                  `mt-md` / `sm:mt-lg` rather than moving them onto the
                  `Reveal`: the wrapper has no border, padding or inline
                  content, so the paragraph's top margin collapses through it
                  exactly as it did when the `<p>` was a direct child, and a
                  `transform` does not establish a block formatting context
                  that would stop it. Measured: the paragraph's top is
                  unchanged to the hundredth of a pixel. */}
              <Reveal delay={STAGGER.line}>
                <p className="mt-md min-h-[230px] text-body text-fg sm:mt-lg sm:min-h-[179px]">
                  {ABOUT_PAGE_PARAGRAPH}
                </p>
              </Reveal>

              {/*
                THE ACTION ROW — one primary, two secondary, in that order.

                BELOW 640 IT IS 1-UP + 2-UP: View CV full width on row one,
                GitHub and LinkedIn side by side on row two. It used to be
                three full-width controls stacked, and the comment here
                defended that against THREE-ACROSS: "three side-by-side
                controls inside 333px of mobile measure give each ~97px, which
                truncates LinkedIn". THAT CLAIM IS STILL TRUE and is not what
                changed — three across is still refused. Two across is a
                different sum: MEASURED at 375, (333 - 13) / 2 = 160.0px per
                control against LinkedIn's intrinsic 109.28px (8 glyphs of
                12px mono at 0.6em advance = 57.6, plus 0.08em tracking =
                7.68, plus 2 x 21 padding, plus 2 x 1 border). 50.7px of
                headroom, and 43.2px at 360. Neither control's `scrollWidth`
                exceeds its `clientWidth` at any tested width.

                IT IS ALSO WHAT PAYS FOR THE MOBILE PORTRAIT. Measured at
                375x667: the stacked column was 158.39px tall
                (42.8 + 13 + 44.8 + 13 + 44.8 — the two secondaries are 2px
                taller than the filled primary because they carry a 1px
                border); 1-up + 2-up is 100.60px. The 57.79px returned covers
                the 56.0px the portrait adds to the mark's row, so the page's
                vertical slack does not shrink. And it is the better hierarchy
                independently: one primary and two secondaries IS a 1 + 2, and
                three identical full-width stacked buttons is Tailwind's
                default mobile CTA stack.

                ABOVE 640 NOTHING CHANGED. `sm:contents` dissolves the pair's
                wrapper, so the three controls are direct children of this row
                again and the arrangement is the one that shipped. That is why
                the wrapper is a bare `<div>` — `display: contents` on an
                element with semantics would take them out of the tree with it.

                The column gets full width for free: a flex column's default
                `align-items: stretch` is what sizes the children, so no width
                class is needed on any of the three — which matters, because
                one of them is rendered by a different component and takes no
                `className`.
              */}
              {/* `fadeOnly` — THE ONE CALL SITE ON THE SITE, and the clip
                  budget below is its whole justification. This row is the
                  bottom-most unit on a page that may not scroll, and at
                  360x640 it has 5.14px of resting slack against `Reveal`'s
                  13px start offset. Without this it sits 7.86px past the
                  viewport's bottom edge for ~80ms and is silently clipped.
                  UNCONDITIONAL, NOT GATED AT A WIDTH: a media query here
                  would make the row a fourth motion behaviour that exists
                  only below some breakpoint, which is the "third behaviour"
                  the motion rules forbid. One row fades where three units
                  travel; that is a smaller inconsistency than one row being
                  clipped on the narrowest phone. */}
              <Reveal
                delay={STAGGER.line * 2}
                fadeOnly
                className="mt-lg flex flex-col items-stretch gap-sm sm:mt-xl sm:flex-row sm:flex-wrap sm:items-center"
              >
                <CvAction />
                {/* THE 2-UP PAIR. `grid-cols-2` rather than two `flex-1`
                    children, so the halves are equal by construction and
                    neither secondary needs a width class of its own — the
                    dressing constants stay pure box-and-voice.

                    `sm:contents` IS THE WHOLE MECHANISM and it is the reason
                    this wrapper is allowed to exist: above 640 it stops being
                    a box at all, and GitHub and LinkedIn become direct
                    children of the flex row above, at their natural widths.
                    The alternative — one flat row with `basis-full` on the
                    primary — would need a `className` on `CvAction`, which
                    takes none, and widening its API for a layout detail is
                    the wrong direction.

                    IF ONE LINK IS ABSENT this becomes a two-column grid with
                    one occupied column, i.e. a half-width control. That is
                    correct and deliberate: the row's rule (below) is that a
                    missing contact entry renders nothing at all, never a
                    placeholder, and a lone secondary at half width still
                    reads as a secondary. */}
                <div className="grid grid-cols-2 gap-sm sm:contents">
                  {/* `ExternalLink` for the semantics only — `target`, `rel`
                      and the announced new-tab note, which is the whole reason
                      it exists. The dressing is this page's, passed in,
                      exactly as that component's header requires: colour and
                      size always belong to the call site. These are CONTROLS,
                      so they take the outlined button dressing rather than the
                      teal underlined treatment that belongs to links inside
                      prose. */}
                  {github ? (
                    <ExternalLink
                      href={github.href}
                      className={ABOUT_BUTTON_SECONDARY}
                    >
                      {github.label}
                    </ExternalLink>
                  ) : null}
                  {linkedin ? (
                    <ExternalLink
                      href={linkedin.href}
                      className={ABOUT_BUTTON_SECONDARY}
                    >
                      {linkedin.label}
                    </ExternalLink>
                  ) : null}
                </div>
              </Reveal>
            </div>

            {/*
              THE PORTRAIT, FROM 1024px UP. Everything about it is a decision:

              `lg:ml-auto` IS GONE, AND IT WAS THE ACTUAL DEFECT — not the
              width. At 1440 the content box is 1262px; 544 (measure) + 89
              (gap) + 340 (the old fixed width) left 289px of free space, and
              `ml-auto` absorbed ALL of it into the image's left margin. The
              measured gap between the paragraph and the photograph was
              378px where `gap-2xl` claimed 89. The two stopped reading as a
              pair and read as two objects that had drifted apart, which is
              also what an unfinished grid looks like.

              `lg:flex-1` PUTS THE RESIDUAL ON THE RIGHT INSTEAD, and that is
              the composition rather than a leftover. Three places the slack
              could go: the middle (`ml-auto`, the bug — air inside a pair
              breaks it); into the image (a 629px square beside a 65-word bio
              makes this a portrait page with a caption, and it breaks the
              height relationship below); or the right, over the particle
              field, where air outside a pair binds it. `lg:justify-center`
              would also close the void and is refused for a separate reason:
              it would indent the paragraph ~122px from the spine every other
              section on the site starts on.

              `lg:max-w-[384px]` IS DERIVED, NOT CHOSEN. The text block
              measures 384.95px tall at `sm` and up (mark 72 + mt-lg 34 +
              paragraph 179.16 + mt-xl 55 + action row 44.8). A square whose
              side equals that height is the one that terminates on the same
              line as the text under `lg:items-center`, so the row reads as a
              single rectangle. 384 rather than 385 because 384 is a real
              `next/image` bucket and halves cleanly; the 0.95px shortfall is
              a sub-line rounding, not a misalignment.

              `lg:min-w-[213px]` IS LOAD-BEARING TWICE. It is the floor that
              keeps 544 + 55 + 213 = 812 inside the 846px container at 1024 —
              and it is also what overrides `min-width: auto` on a flex item,
              which for a replaced element resolves to a content-based minimum
              and would otherwise pin the image at its cap forever.

              PLAIN `lg`, NOT A CUSTOM BREAKPOINT. Trajectory needed one
              (`--breakpoint-photo`, now deleted) because its 144px label rail
              left the photo column ~48px at 1024px. This page has no rail: at
              1024px the container gives 846px and the prose takes 544, so
              `lg` is genuinely enough room.

              1:1, AND THAT IS NOT AN AESTHETIC CHOICE. The source file is
              4096x4096. A square box is therefore the only ratio that is not
              a crop, and no crop of this image has been decided.

              NO RADIUS, NO BORDER, NO FILTER, NO DUOTONE, NO HOVER, AND NO
              `placeholder="blur"`. There is not one `rounded-*` in this
              codebase and a soft-cornered photo would be the exception
              announcing itself; the rest is this page's brief — it is the
              quiet page, and a blur-up placeholder is a filter that resolves,
              which is motion. `priority` is the right answer to the pop a
              blur-up would paper over.

              UNIT 4 of the entrance, delay `STAGGER.line * 3`. THE FLEX
              CLASSES LIVE ON THE `Reveal`, NOT ON THE `<img>`, because the
              revealed box is what the flex row now lays out; the image fills
              it with `w-full` and keeps `aspect-square` so the wrapper's
              height still equals its width. `lg:min-w-[213px]` therefore does
              double duty on a `<div>` rather than on a replaced element, and
              it is still what overrides `min-width: auto`.

              IT IS INCLUDED IN THE ENTRANCE RATHER THAN LEFT STATIC. Leaving
              it still while the column beside it rises would make the text's
              motion read as a loading artefact at `lg`+, and it is the last
              unit in document order, which is where the monotonic rule puts
              it. It is not a fifth unit for phones — see the mobile portrait
              above, which arrives with the mark at delay 0.
            */}
            <Reveal
              delay={STAGGER.line * 3}
              className="hidden lg:block lg:min-w-[213px] lg:max-w-[384px] lg:flex-1"
            >
              <Image
                src={portrait}
                alt={ABOUT_PAGE_PORTRAIT_ALT}
                sizes={PORTRAIT_SIZES}
                priority
                className="aspect-square w-full object-cover"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutScreen;
