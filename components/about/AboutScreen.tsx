import Image from "next/image";

import portrait from "@/public/images/about/portrait.jpg";
import { AboutFlipBoard } from "@/components/about/AboutFlipBoard";
import { IntroEntrance } from "@/components/intro/IntroEntrance";
import { CvAction, CvModalHost } from "@/components/about/CvAction";
import { EncryptedButtonLabel } from "@/components/ui/EncryptedButtonLabel";
import {
  ABOUT_BUTTON_SECONDARY,
  ABOUT_SCRAMBLE_ON_BASE,
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
 * THE TWO SUB-`lg` BANDS ARE `calc()` EXPRESSIONS NOW, AND THE STANDING RULE
 * THAT FORBADE THEM IS AMENDED RATHER THAN IGNORED. It read: "EXACT PIXELS,
 * NOT A `vw` EXPRESSION... declaring the band's MAXIMUM only ever over-selects
 * — 247 and 384 land on the same 384 bucket anyway." That argument depended on
 * the band's two ends landing on ONE bucket, which was true while the sub-`lg`
 * portrait was a fixed 112/144px square. It stopped being true on 2026-08-23,
 * when the photograph took the full measure: the `<640` band now runs 318px at
 * 360 to 598px at 640, and declaring its maximum would make a 360px phone at
 * DPR-2 preload a w=1200 derivative to paint 318 CSS px. The expressions are
 * the measure, exactly: `100vw − 2 × px-md (21)` below `sm` and
 * `min(34rem, 100vw − 2 × px-xl (55))` from `sm` to `lg`, which reproduce the
 * recorded 333px at 375, 318px at 360 and 530px at 640.
 *
 * THE `lg` BAND KEEPS ITS EXACT PIXEL VALUE and the old rule's reasoning with
 * it — it is fluid from 247px at 1024 to the cap, and the band's two ends land
 * on one `next/image` bucket.
 *
 * THAT BAND MOVED 384 -> 448 ON 2026-08-23, WITH THE PORTRAIT'S CAP, AND IT IS
 * THE EASY HALF TO FORGET. The declared band and the rendered cap are 800 lines
 * apart in this file; a cap that grows while the band still says `384px` makes
 * every desktop preload a derivative too small for what it paints, and nothing
 * errors. 448 IS NOT ITSELF A `next/image` BUCKET (384 was, which was half of
 * why 384 was chosen), so the selected derivative jumps a bucket: **w=384 ->
 * w=640 at DPR-1 and w=828 -> w=1080 at DPR-2**, roughly 16.5KB -> ~26KB on a
 * `priority` image inside the initial viewport. That cost was accepted
 * deliberately. RE-MEASURED after the change, because the single-request
 * guarantee this whole docstring is about must be re-verified rather than
 * assumed: exactly one image request at every tested viewport and DPR.
 *
 * MEASURED SELECTION, one request in every case — RE-MEASURED after the change,
 * because every sub-`lg` figure in the old list moved: see the item 7 handoff
 * and the commit that carries it.
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
const PORTRAIT_SIZES =
  "(min-width: 1024px) 448px, (min-width: 640px) min(544px, calc(100vw - 110px)), calc(100vw - 42px)";

/**
 * `/about` — one paragraph, three controls, one photograph, and nothing else.
 *
 * IT READ "ONE SCREEN" UNTIL 2026-08-23, AND THAT IS NOW TRUE OF ONLY HALF THE
 * WIDTH RANGE. At `lg` (1024px) and up the page is still exactly one screen and
 * still cannot scroll. Below `lg` it scrolls. Saad took that decision to get the
 * portrait to its full measure as a square, which is arithmetically impossible
 * on a non-scrolling phone — short by 252.7px at 375x667 against 37.3px of
 * slack. `docs/07` §5-6 and `docs/01`, `docs/02`, `docs/04` and `docs/06` are
 * amended to match; the split is in the spec, not only here.
 *
 * THE ONE DELIBERATELY QUIET PAGE ON THE SITE. `docs/07_SITE_RESTRUCTURE.md` §6
 * says so in as many words, and the composition in
 * `.claude/handoff/about-design.md` is built around it. Four absences are
 * DECISIONS, not omissions, and each has a place elsewhere on the site that a
 * later pass might mistake this page for having forgotten:
 *
 * ABSENCE 4 WAS RETIRED ON 2026-08-23 AND IS NOT IN THE LIST BELOW. It read:
 * "It runs the site's standard entrance ONCE, on load, and then NOTHING ON
 * THIS PAGE EVER MOVES AGAIN." That is false as of the flip board under the
 * portrait, which advances a 15-tile split-flap string every 7 seconds on
 * hover-capable devices. Saad asked for it explicitly; `docs/07` §6 and
 * `docs/03`'s motion-drivers section carry the reversal, and
 * `AboutFlipBoard.tsx`'s header carries the four statements it falsifies and
 * the mitigations that were not optional.
 *
 * TWO HALVES OF THAT SENTENCE SURVIVE AND ARE WORTH SEPARATING OUT, because
 * they are what a later reader will otherwise assume died with it:
 *   - **The motion-author count ON ARRIVAL is still exactly one.** The board's
 *     first flip is at 7.0s against a 0.90s settle, so it authors nothing
 *     during the entrance. The deleted route fade is still correctly deleted.
 *   - **The canvas still costs 0 frames per 5 idle seconds**, in both themes,
 *     re-measured after the board landed. `ambient="settled"` is untouched.
 *
 *   1. NO SCROLL — AT `lg` AND UP. `lg:h-dvh` + `lg:overflow-hidden`. Nothing
 *      below the fold there, ever. If content is ever added that does not fit
 *      AT `lg`+, the answer is still to cut it or to re-open the page's design
 *      with Saad, NOT to remove the overflow rule at that width.
 *
 *      THIS ABSENCE WAS UNCONDITIONAL UNTIL 2026-08-23 and it read: "NO SCROLL.
 *      `h-dvh` + `overflow-hidden`. Nothing below the fold, ever." It was
 *      reopened the way it always said it had to be — by Saad, as a design
 *      decision, and not by an implementer working around it. Below `lg` the
 *      page scrolls, because a full-measure square portrait cannot be made to
 *      fit a phone screen that may not: the shortfall was MEASURED at 252.7px
 *      (375x667) and 264.7px (360x640) against 37.3px and 10.3px of slack, and
 *      there is not enough content on the page to cut that much — deleting the
 *      whole 65-word paragraph AND the whole action row frees 407.8px and would
 *      also be deleting the page.
 *
 *      WHAT DID NOT CHANGE: the answer to "it does not fit" is still never
 *      "shrink the type", never "relax the rule locally", and never a new
 *      breakpoint. The split is at `lg`, which this page already turns on.
 *   2. NO REVEAL FOOTER. Home and Work only (§5), and this is UNCHANGED by the
 *      scroll split. The curtain's ScrollTrigger maths need a scrolling page,
 *      and below `lg` this page technically now has one — but §6 keeps the
 *      footer off `/about` as a composition decision, not as a consequence of
 *      the overflow rule. Do not "restore" it below `lg` on the strength of the
 *      mechanism becoming available.
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
 *      `/about` is quiet because it has NO DRIVER OF ITS OWN — no scrub, no
 *      reveal footer, no hover motion, no loop beyond the shared particle
 *      field. It runs the site's standard entrance ONCE, on load, and then
 *      nothing on this page ever moves again. ("No scroll" was the first item
 *      in that list until 2026-08-23. Below `lg` the page scrolls, and the
 *      claim survives because scrolling is not a DRIVER here: nothing on this
 *      page is bound to scroll position — no scrub, no trigger, no parallax,
 *      no sticky. The scroll moves the page and animates nothing.)
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
 * component and not a new prop: `Reveal` is `whileInView` at `amount: 0.1`.
 *
 * AT `lg` AND UP the page is exactly one screen, every unit is already in view,
 * and the first observer tick fires all of them on mount — hard load and client
 * navigation alike. BELOW `lg` the page scrolls, and MEASURED at 375x667 the
 * portrait's top lands at 649.6px with 5.2% of it visible, under the 10%
 * threshold: the three text units still share the mount tick and the portrait
 * reveals on scroll, alone. That is why it carries no delay — see its own note. That satisfies the site's motion rule by construction:
 * same driver (elapsed time), same curve (`EASE.reveal`), same numbers
 * (`y: 13 -> 0` over `DURATION.reveal`, `opacity: 0 -> 1` over half of it), a
 * new TRIGGER. 13px and not 21px — 21 is scrub-only.
 *
 * "ON MOUNT, HARD LOAD AND CLIENT NAVIGATION ALIKE" IS NOW TRUE OF THE CLIENT
 * NAVIGATION ONLY, AND THE FOUR CALL SITES BELOW SAY `IntroEntrance` RATHER
 * THAN `Reveal` BECAUSE OF IT. Since the Intro's gate moved to the `(chrome)`
 * layout, a hard load of this route plays a **2.765s** sequence over it — so
 * "on mount" means all four units finishing at 1.00s behind a fully opaque
 * plate, with the page revealed already assembled. (2.765s, not the 3.17s this
 * paragraph used to say: 3.165s is HOME's seven-phase total, and off Home
 * phase 7 is the plate's 0.55s `autoAlpha` dissolve rather than a 0.95s zoom.
 * `Intro.tsx`'s `INTRO_TOTAL_S` computes the Home figure; `docs/07` §5 carries
 * the off-Home one.) `components/intro/IntroEntrance.tsx`
 * re-triggers them at the Intro's hand-off + 0.30s instead. (It was
 * `components/about/AboutEntrance.tsx` until `/work`'s Projects units needed
 * the identical mechanism; it moved to `components/intro/`, and nothing about
 * this page's four call sites changed but the name.) It is a wrapper
 * around this same `Reveal`, passing this same `delay`: NO new component in the
 * motion sense, no new curve, no new duration, and this page's motion-author
 * count on arrival is still ONE. `Reveal` itself is untouched and stays
 * byte-identical, which `ScrubReveal`'s header requires.
 *
 * FOUR UNITS, CASCADING PER COLUMN: the mark at 0, the paragraph at 0.10 and
 * the action row at 0.20 — document order, monotonic — and the portrait at 0.
 *
 * IT READ "FOUR UNITS AT 0 / 0.10 / 0.20 / 0.30, in document order: the mark's
 * row, the paragraph, the action row, the portrait" UNTIL 2026-08-23. The
 * portrait lost its 0.30 when `/about` gained a scroll below `lg`, because a
 * unit that can be the only thing entering view must not carry a delay that was
 * measured from a cascade it is no longer part of. Its own note has the
 * measurement and the `Projects.tsx` precedent.
 *
 * WHEN THE LAST UNIT SETTLES DEPENDS ON HOW YOU GOT HERE, AND THIS USED TO
 * STATE ONLY THE CHEAPEST CASE ("0.30 + 0.70 = 1.00s, which is exactly
 * `Reveal`'s stated budget"):
 *
 *   client navigation  0.30 + 0.70              = 1.00s   — no Intro, no onset
 *   hard load          0.30 + 0.30 + 0.70       = 1.30s   — + `INTRO_ONSET_S`,
 *                                                            measured 1150ms
 *                                                            to visually
 *                                                            settled
 *
 * The hard-load figure is 30% past `Reveal`'s ~1.0s budget and that overrun is
 * accepted, not overlooked: `IntroEntrance.tsx` declares it as a stated cost of
 * the onset, next to the arithmetic that sets the onset. It was 1.20s while the
 * onset was 0.20s. A unit that settles late but VISIBLY beats one that settles
 * on budget behind an opaque plate, which is the whole reason this page's four
 * call sites say `IntroEntrance`.
 *
 * AN INDEX-SHAPED CASCADE IS LEGAL HERE AND ALMOST NOWHERE ELSE. `STAGGER.line`
 * forbids it "wherever units have independent triggers and a reader may arrive
 * at one deliberately", because the delay is then measured from the wrong
 * origin. `/about` has no anchors into it and every unit still enters on the
 * same tick — see the note on `amount: 0.1` below — which is the condition that
 * docstring names as safe. ("`/about` cannot scroll" was the first clause here
 * until 2026-08-23; it is now true only at `lg`+, and it was never the load-
 * bearing half. What matters is that no reader can arrive at unit 3 without
 * having passed units 1 and 2, and a page with no in-page anchors cannot be
 * entered anywhere but the top.) The delays are written out as multiples rather than derived from a map
 * index so they are auditable at the call site, and they increase
 * monotonically, which is the actual invariant.
 *
 * THE ACTION ROW IS ONE UNIT, NOT THREE. Three buttons arriving one after
 * another is the clearest generic-portfolio tell available on this page, and
 * it would put the last control's arrival past 0.4s for no informational gain.
 * One `Reveal` around the row.
 *
 * THERE IS ONE PORTRAIT NOW, AT EVERY WIDTH, and it is the fourth unit
 * everywhere. This paragraph used to describe two: a mobile one inside the
 * mark's row ("not a fifth unit... it arrives with the mark at delay 0") and a
 * desktop one that was `display: none` below `lg`, which made the page three
 * units below `lg` and four at and above it. The mobile one is deleted. The
 * outcome is the same in the one respect that mattered — the photograph still
 * arrives at delay 0 — but it is now one element, one `<Image>` and one entry
 * in this list at all widths.
 *
 * THE PARTICLE CANVAS DOES NOT PARTICIPATE. It is already drawn when the
 * entrance runs and it is background; fading it would make the page's arrival
 * read as a curtain rather than as content settling.
 *
 * "DRAWN", NOT "DRAWING", SINCE 2026-08-22. The canvas takes
 * `ambient="settled"`, so it paints its one mount frame and then parks — there
 * is no loop behind this entrance to be out of step with it. The substance of
 * the paragraph is unchanged; the tense was load-bearing enough to fix.
 *
 * REDUCED MOTION NEEDS NO SECOND CODE PATH. `MotionProvider`'s
 * `reducedMotion="user"` drops transform and keeps opacity, so the page
 * becomes four fades at 0 / 100 / 200ms — the portrait sharing 0 with the mark
 * — and zero travel. (It read "0 / 100 / 200 / 300ms" while the portrait
 * carried `STAGGER.line * 3`.) THE STAGGER IS
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
 * that absence 1 will not let scroll.
 *
 * THE WHOLE OF THIS SECTION IS NOW AN `lg`+ CONCERN. Below `lg` the page
 * scrolls and clips nothing, so there is no budget there to overrun — the
 * 360x640 and 375x667 rows below describe a layout that no longer exists at
 * those widths. They are kept, unedited, because they are the measurement that
 * bought `fadeOnly` and because the moment anything moves the `lg` split they
 * become live again. MEASURED at the action row's maximum bottom edge during
 * the entrance, on the pre-2026-08-23 layout:
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
 * IT USED TO BE BYTE-IDENTICAL AND IS NO LONGER, and the difference is now
 * ONE CLASS: `my-auto`, the vertical centring, which is not an S-1 concern.
 * The flex classes this note used to name — `lg:flex lg:items-center
 * lg:gap-xl xl:gap-2xl` — moved OFF this element onto an inner row when the
 * flip-board band became a sibling of the two columns, so the deviation is
 * smaller than when `docs/03` swept it, not larger. The four spine classes are
 * untouched; a reviewer diffing the container against Skills' should compare
 * the max-width and the three paddings, not the whole string.
 *
 * THE SPINE CONTAINER IS NOT WHERE `/about` BREAKS RULE S-1. It breaks it one
 * level down, on the row and the three stacked boxes, which are `mx-auto` so
 * the composition is CENTRED inside this spine rather than started on its left
 * inset — 2026-08-24, on Saad's instruction, with `/about` named in `docs/03`
 * as the rule's one exception. The row's own note carries the measurements and
 * the three candidate causes that were ruled out first.
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
      /*
        ONE SCREEN AT `lg` AND UP; A SCROLLING PAGE BELOW IT. That split is a
        DECISION taken by Saad on 2026-08-23 and it reverses `docs/07` §5-6's
        "one screen, does not scroll" for one half of the width range. Both docs
        are amended; this is not a local override of a spec that still says
        otherwise.

        WHY: the portrait was asked for at full measure width, as a square. On a
        page that may not scroll that is arithmetically impossible below `lg` —
        MEASURED, it is short by 252.7px at 375x667 and 264.7px at 360x640,
        against 37.3px and 10.3px of resting slack. Those numbers are not
        obsolete, they are the reason the constraint was lifted: the workaround
        that produced today's 112px in-row portrait existed only to force the
        request inside a constraint that no longer applies below `lg`.

        `lg` (1024px), AND IT IS NOT A NEW BREAKPOINT. It is the one this page
        already turns on — the same value that makes the container a two-column
        row, that the portrait's `lg:hidden`/`hidden lg:block` pair switched at,
        and that `lg:shrink-0` and `lg:flex-1` answer to. The non-scroll rule now
        holds exactly where the two-column composition exists and is released
        exactly where the single column forces the photograph into the flow.
        Rule S-5 is untouched: the site still ships zero custom breakpoints.

        `min-h-dvh` BELOW `lg`, NOT `h-dvh`: the page must still fill the
        viewport when the content is shorter than it, and must be allowed to
        exceed it when it is not. `overflow-hidden` goes with `h-dvh` — a
        scrolling page that clips its own overflow is a page with unreachable
        content, which is the failure `Reveal`'s 13px clip note describes from
        the other side.
      */
      className="relative min-h-dvh w-full bg-base"
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
      {/*
        `relative` IN FLOW BELOW `lg`, `absolute inset-0` AT `lg`, AND THAT
        SPLIT IS A BUG FIX RATHER THAN A TIDY-UP.

        The content is INSIDE this box (see above), so while the box was
        absolutely positioned at every width it contributed NOTHING to the
        section's height. That was invisible while the section was `h-dvh
        overflow-hidden` — the section's height was fixed and the overflow was
        clipped. The moment `/about` gained a scroll below `lg` it stopped being
        invisible: MEASURED at 360x640 before this line, the section stayed
        640px tall while its content ran to 1036px, so `bg-base` and the
        particle canvas — which is `absolute inset-0` OF THIS BOX — both ended
        at 640 and the bottom 396px of the page had no field behind it.

        In flow, this box is sized by the content and the canvas fills all of
        it. `min-h-dvh` keeps it at least a screen tall when the content is
        shorter. At `lg` it is `absolute inset-0` exactly as before, so the
        one-screen composition is byte-identical there.
      */}
      <div className="relative min-h-dvh">
        {/* The same mesh the hero draws, thinned rather than veiled, and in
            `--field-ink` rather than the hero's Tier 1 cyan — see
            `QUIET_FIELD`. THAT SECOND HALF IS WHY THE PRESET NAMES A COLOUR:
            until 2026-08-22 the canvas hardcoded `--accent-hero`, so this line
            painted a full-viewport Tier 1 accent on a Tier 2 page in both
            themes, and nothing at this call site said so.
            `sphere={false}` keeps the command sphere on Home. */}
        <ParticleGrid field={QUIET_FIELD} sphere={false} ambient="settled" />

        {/* `lg:h-full` + `items-center` IS THE CENTRING, AND IT IS NOW `lg`-ONLY.
            Below `lg` this box is sized by its content, so `items-center` is a
            no-op there rather than a centring — which is deliberate. Vertical
            centring of a box TALLER than its container puts the overflow on both
            sides equally, and the half above the top is unreachable by scrolling.
            A scrolling page starts at the top; `pb-2xl` gives its bottom the same
            air the top gets from `pt-xl`. */}
        <div className="relative flex min-h-dvh pt-xl pb-2xl sm:pt-2xl">
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
          <div className="mx-auto my-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
            {/* THE ROW. `lg:flex` turns text-then-portrait into two columns at
                1024px; the band below it is a SIBLING of this, not a child. */}
            {/*
                `lg:w-fit lg:mx-auto` — THE COMPOSITION IS CENTRED IN THE SPINE
                RATHER THAN STARTED ON IT, AND THAT IS A DELIBERATE BREACH OF
                RULE S-1 ON THIS ROUTE ONLY. `docs/03` names `/about` as S-1's
                FIRST NAMED EXCEPTION, which is the condition this file has
                always attached to breaking it: "if S-1 is ever broken here it
                must be broken VISIBLY, with `/about` named in `docs/03`, or
                not at all." (It read "as THE exception" until 2026-08-25, when
                `/projects`' full-bleed strip rows became the second and
                `docs/03` renamed this one. The condition is satisfied either
                way; the definite article was the only false part.)

                WHAT IT FIXES, MEASURED. Saad reported the block sitting left of
                centre. The containers were not the cause and neither was a
                scrollbar — the spine's own margins are symmetric at every
                viewport (240/240 at 1920, 0/0 at 1440, padding 89/89), and at
                1920x945 `/about` has NO SCROLLBAR AT ALL (`clientWidth` 1920,
                `scrollHeight` 945, verified in real Chrome). The cause was that
                the COMPOSITION IS NARROWER THAN ITS CONTAINER and the residual
                was parked on the right by `lg:flex-1` on the portrait:
                544 (measure) + 89 (gap) + 364 (portrait) = 997px of content in
                a 1262px content box. MEASURED painted extents at 1920x945:
                329px of gap on the left and 594px on the right — 265px of skew,
                constant at 1440 and wider, 191px at 1366, 105px at 1280, and 0
                at 1024 where the portrait shrinks to fill.

                THIS FILE ALREADY CALLED THAT VOID A DEFECT ONCE, at 245px:
                "That is not the spine; it is a composition that stops 245px
                early, which is what an unfinished grid looks like." The fix
                taken then was to FILL the container — measure to 640, portrait
                cap to 448 — and it was reverted when the height budget
                tightened, which brought the void back at 265px without the
                reasoning coming back with it.

                FILLING IT IS NO LONGER AVAILABLE, and that is why the answer is
                centring this time rather than width. Reaching 1262px needs
                either a 629px portrait — refused three paragraphs down, "a
                629px square beside a 65-word bio makes this a portrait page
                with a caption" — or the 640 + 448 pair, which makes the row
                448px tall against 364 and spends 84px of the 93px of vertical
                slack the page's centring lives on. It would fix the horizontal
                axis by re-breaking the vertical one.

                WHY THE EXCEPTION IS DEFENSIBLE AND NARROW. `/about` is the only
                route on the site that is a COMPOSED SCREEN rather than a
                scrolling document: it is already centred vertically as one unit
                (`my-auto` above), it has no sections, no reveal footer and no
                scrub. A screen that is centred on one axis and spine-aligned on
                the other is the inconsistency. And S-1 is only VISIBLE as a
                constraint on a section whose content is narrower than the
                spine — MEASURED on the shipped build at 1920, every other
                content section on `/` and `/work` fills its container exactly
                (gap 329 left, 329 right, delta 0), so nothing else on the site
                is affected by this and nothing else needs to change.

                `w-fit`, NOT `justify-center`. `justify-center` would centre the
                two columns inside a row box that still spans the container, so
                the BAND below — which is a sibling and is capped at the content
                column's width — would stay left while the row moved. `w-fit`
                makes the row's box equal its content, so the band's `mx-auto`
                lands on exactly the same edges. VERIFIED: the band's left edge
                is still the paragraph's and its right edge is still the
                portrait's at every viewport.

                IT IS INERT WHERE THE ROW ALREADY FILLS. Below ~1161px the
                portrait shrinks and `fit-content` resolves to the available
                width, so the row is the container and `mx-auto` has nothing to
                distribute — the layout at 1024 is byte-identical to before.
            */}
            <div className="lg:mx-auto lg:flex lg:w-fit lg:items-center lg:gap-xl xl:gap-2xl">
              {/*
              THE MEASURE IS 34rem TO `xl` AND 40rem ABOVE IT, AND THE TWO
              HALVES OF THAT ARE ONE DECISION WITH THE PARAGRAPH'S SIZE.

              WHAT IT FIXES. At 1440 the composed row was 544 (measure) + 89
              (gap) + 384 (portrait) = 1017px inside a 1262px content box,
              leaving 245px — 19.4% of the measure — of trailing void with the
              SMALLEST element on the void side. That is not the spine; it is a
              composition that stops 245px early, which is what an unfinished
              grid looks like. MEASURED at 1440x900 and 2560x1440 before the
              change: 245.00px, in both themes.

              RULE S-1 IS HELD BYTE-IDENTICALLY AND NOTHING IS CENTRED. Saad's
              ask was for the block to sit less to one side; the answer taken is
              to FILL the measure rather than to centre it. Widening the measure
              to 640 and the portrait cap to 448 takes the trailing void to
              85px — 6.7% of the measure, within 4px of one spine unit — which
              reads as a deliberate inset margin rather than as a void the
              composition failed to reach. `lg:justify-center` was refused
              again: under the new geometry it costs only a 42.5px indent off
              the spine rather than the ~122px this file rejected before, and
              42.5px is WORSE — too small to read as centring, too large to read
              as alignment. If S-1 is ever broken here it must be broken
              visibly, with `/about` named in `docs/03`, or not at all.

              WHY THE TYPE HAS TO MOVE WITH IT. At a 640px measure `text-body`
              16px gives ~80 characters per line, past the 75-char readability
              ceiling — i.e. a wider measure at 16px is WORSE typography than
              what shipped. The size step is a CONSEQUENCE of the width, not a
              second taste request: either both move or neither does.

              WHY THE STEP IS GATED AT `xl` AND NOT AT `lg`. The scale has
              nothing between 16 and 26 (x1.618 puts the next rung at 25.9 and
              `globals.css` rounds it to 26), and 26px on a 544px measure wraps
              to 10 lines — an 11-line reserve of 386.1px and a 659.9px text
              column against 511px of available height at 1024x600. Over by
              148.9px. It is a HEIGHT constraint expressed through a WIDTH
              breakpoint because Rule S-5 prefers no new breakpoint and a height
              media query would be a new CLASS of one. `xl` is an existing step;
              the site still ships zero custom breakpoints.
            */}
              {/* `mx-auto lg:mx-0` — the same centring, for the single-column
                half of the page. Below `lg` this box, the portrait and the band
                are three stacked siblings all capped at the 34rem measure, so
                wherever the container is WIDER than 544px the same residual
                appears on the right: MEASURED 246px at 900px and 114px at 768px,
                and 0 at 640 and below where the cap stops binding. One page, one
                rule — the composition is centred at every width rather than at
                the widths someone happened to check.

                `lg:mx-0` because at `lg`+ this is a flex item of a `w-fit` row,
                where an auto margin would absorb free space BEFORE `flex-grow`
                runs. There is no free space in that row, so the class is inert
                either way; it is written out so the interaction is visible
                rather than latent. */}
              <div className="mx-auto max-w-[34rem] lg:mx-0 lg:shrink-0">
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

                IT SHARED ITS ROW BELOW 1024px UNTIL 2026-08-23, and the
                wrapper carried `flex items-center gap-md lg:block` to say so.
                The photograph left that row when `/about` gained a scroll below
                `lg`; the mark is alone at every width now, and the `Reveal` is
                a plain block again with no flex classes to pass through.
              */}
                {/* UNIT 1 of the entrance, delay 0. `Reveal` renders this unit's
                  own `<div>` rather than adding one around it — its
                  `className` is passed straight to the `motion.div`, so the
                  revealed box IS the element the layout sees and the resting
                  geometry is unchanged. It takes no `className` now that the
                  row is gone; `Reveal` handles that, and the omission is
                  deliberate rather than a dropped class. */}
                <IntroEntrance>
                  <MonogramMark
                    variant="nav"
                    label={ABOUT_PAGE_MARK_LABEL}
                    className="h-[56px] w-auto text-fg sm:h-[72px]"
                  />

                  {/*
                  THE IN-ROW PORTRAIT IS GONE, AND WITH IT THIS PAGE'S ONLY
                  TWO-ARTIFACT ROW.

                  It was a 112px square (144 at `sm`) paired with the mark at a
                  fixed 2:1, and it was CORRECT for the constraint it was built
                  under: on a page that may not scroll, stacking the photograph
                  costs its full height while pairing it costs only the
                  difference between the two, and the action row's 1-up + 2-up
                  rearrangement was measured to return 57.79px against the
                  56.0px the pairing added. That whole chain was load-bearing
                  only while `overflow-hidden` was.

                  Below `lg` the page scrolls now (see the section's class), so
                  there is nothing left to force the photograph into a slot it
                  did not want. It takes the full measure as a square, in its own
                  slot, below the action row — which is also what removes the two
                  identical MS marks that sat in one vertical line, the page's
                  own and the navbar's fixed one 55px above it.

                  `shrink-0` and the 2:1 ratio go with it. Do not reintroduce
                  either as a "guard": there is no row left to guard.
                */}
                </IntroEntrance>

                {/*
                THE HEADROOM IS NOT OPTIONAL, AND EVERY FIGURE IN IT IS PER
                BAND. 65 words at `text-body` (16px, 1.6 line-height = 25.6px)
                on a 34rem measure wraps to 5-6 lines. The reserve is SEVEN
                lines (7 x 25.6 = 179px) there, and nine on mobile, because both
                of `docs/07` §6's remaining content notes LENGTHEN this
                paragraph: if C1's coursework qualifier ever returns, or C2's
                referent is named more fully, it grows. A block measured exactly
                to today's word count gets re-measured twice, and the action row
                below moves both times.

                AT `xl` THE RESERVE IS RE-DERIVED, NOT INHERITED. The measure is
                40rem (640px) and the size is `text-h4` there, so leaving
                `sm:min-h-[179px]` in place would have been a `text-body` figure
                guarding `text-h4` copy — reserve in name only. The design brief
                derived the count from an effective average advance of 0.464 em
                (lines = ceil(204.2 x fontSize / measure)) and predicted
                204.2 x 26 / 640 = 8.30 -> 9 lines, with a TEN-line reserve at
                35.1px = 351px.

                THE PREDICTION IS ONE LINE LOW AND THE MEASUREMENT IS RECORDED
                RATHER THAN THE FORMULA DEFENDED. MEASURED off the rendered
                range rects: 9 lines at 1280 (306.37px, 44.6px spare in the
                reserve), and **10 lines at 1440 (350.35px) and at 2560
                (351.00px)** — i.e. AT 1440 AND ABOVE THE TEN-LINE RESERVE IS
                FULLY CONSUMED AND CARRIES ZERO GROWTH HEADROOM. The 351px value
                shipped as specified and the page still fits everywhere (0.00px
                of overflow at all six `lg`+ viewports in both themes, with
                254.2px of slack at 1440x900 and 74.2px at 1280x720), but the
                reserve is no longer doing the job the paragraph above describes
                at those widths.

                SO IF EITHER OF `docs/07` §6'S CONTENT NOTES LANDS, THIS NUMBER
                MOVES FIRST AND IT IS NOT A FREE EDIT. Eleven lines is 386.1px,
                which takes the text column to 591.9px and 1280x720 to 680.9px —
                still inside 720 with 39.1px of slack, and 1024x600 is untouched
                because the step is gated at `xl`. That is the next value, with
                its arithmetic, so nobody has to re-derive it under pressure.

                THE LINE HEIGHT IS THE ONE GENUINELY NEW VALUE IN THIS CHANGE
                AND IT IS FLAGGED AS SUCH. `docs/03` states 1.6 for body and
                1.1-1.2 for headings; 26px LEAD PROSE is neither, and optical
                leading falls as size rises. `text-h4` carries 1.2, which is a
                heading's leading applied to a 65-word paragraph. At `text-h4`'s
                own 1.6 the 10-line reserve would be 416px, which does NOT fit
                1280x720; at 1.35 (35.1px) it is 351px and fits with 74px to
                spare. The fallback of 1.4 with a 9-line reserve also fits, but
                it spends the growth reserve the two content notes above exist
                to protect. The line height was taken and the reserve kept.
                `docs/03`'s type section records the value.

                GROWTH CONSUMES SLACK, IT DOES NOT SHRINK THE TYPE. Fitting a
                longer paragraph by dropping to `text-caption` is the exact
                failure this reserve exists to prevent, and it is unchanged by
                the size going UP at `xl`: growing the type multiplies that
                future growth against a budget that is already the binding
                constraint at 1024x600.
              */}
                {/* UNIT 2, delay `STAGGER.line`. The `<p>` keeps its own
                  `mt-md` / `sm:mt-lg` rather than moving them onto the
                  `Reveal`: the wrapper has no border, padding or inline
                  content, so the paragraph's top margin collapses through it
                  exactly as it did when the `<p>` was a direct child, and a
                  `transform` does not establish a block formatting context
                  that would stop it. Measured: the paragraph's top is
                  unchanged to the hundredth of a pixel. */}
                <IntroEntrance delay={STAGGER.line}>
                  {/* `select-text` — the site's `select-none` (set on
                    `<body>` in `app/layout.tsx`) exempts long-form prose, and
                    this paragraph is the whole of `/about`'s read content. See
                    `docs/03`'s selection section for the four exceptions and
                    what stays locked.

                    ON THE `<p>` ITSELF, which IS the narrowest root here —
                    there is exactly one paragraph on this page. It deliberately
                    does NOT go on the `IntroEntrance` wrapper above: that
                    wrapper is a motion primitive used all over the page, and a
                    selection policy on it would leak to the heading, the
                    action row and the flip board the next time it is reused.

                    THE PORTRAIT IS A SIBLING, NOT A CHILD, so no image
                    override is needed — verified against the tree below, not
                    assumed. */}
                  <p className="mt-md min-h-[230px] text-body text-fg select-text sm:mt-lg sm:min-h-[179px]">
                    {ABOUT_PAGE_PARAGRAPH}
                  </p>
                </IntroEntrance>

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
                {/* `fadeOnly` — THE ONE CALL SITE ON THE SITE. Its original
                  justification was the clip budget: this row was the
                  bottom-most unit on a page that could not scroll at any
                  width, and at 360x640 it had 5.14px of resting slack against
                  `Reveal`'s 13px start offset — 7.86px past the bottom edge
                  for ~80ms, silently clipped.

                  THAT CLIP IS GONE BELOW `lg` AS OF 2026-08-23, because the
                  page scrolls there and `overflow-hidden` went with it. IT
                  STAYS ANYWAY, and the reason is now the one its own last
                  sentence already gave: "UNCONDITIONAL, NOT GATED AT A WIDTH:
                  a media query here would make the row a fourth motion
                  behaviour that exists only below some breakpoint." Gating it
                  at `lg` to "restore" 13px of travel on phones would be
                  exactly that, for a gesture nobody asked for, on the page
                  whose brief is quiet. Removing it outright would put the
                  travel back at `lg` too, where nothing measured it as safe.

                  It is no longer the bottom-most unit anyway: the portrait
                  follows it below `lg`. */}
                {/* `CvModalHost` WRAPS THE ENTRANCE RATHER THAN SITTING INSIDE
                  IT, and the order is the whole fix. `IntroEntrance`'s only
                  mechanism is a `key` that flips at the hand-off, which
                  unmounts everything below it — including, until 2026-08-22,
                  the CV modal's `open` state, so a modal opened during the
                  Intro was destroyed mid-view. Reproduced by keyboard on every
                  run; `CvAction.tsx` carries the capture and the four cases
                  that did NOT reproduce. The host renders no DOM element and
                  the dialog it renders is `position: fixed` in the top layer,
                  so this row's geometry is byte-identical. DO NOT MOVE IT
                  BACK INSIDE. */}
                <CvModalHost>
                  <IntroEntrance
                    delay={STAGGER.line * 2}
                    fadeOnly
                    className="mt-lg flex flex-col items-stretch gap-sm sm:flex-row sm:flex-wrap sm:items-center"
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
                      {/* THE LABEL IS A CLIENT LEAF, THIS FILE IS NOT.
                        `EncryptedButtonLabel` carries `"use client"` and finds
                        its own hover by walking up to the anchor, so neither
                        `AboutScreen` nor `ExternalLink` gains a hook or a prop
                        and both stay server components. That is the standing
                        requirement in `ExternalLink`'s header, not a
                        preference. */}
                      {github ? (
                        <ExternalLink
                          href={github.href}
                          className={ABOUT_BUTTON_SECONDARY}
                        >
                          <EncryptedButtonLabel
                            text={github.label}
                            encryptedClassName={ABOUT_SCRAMBLE_ON_BASE}
                          />
                        </ExternalLink>
                      ) : null}
                      {linkedin ? (
                        <ExternalLink
                          href={linkedin.href}
                          className={ABOUT_BUTTON_SECONDARY}
                        >
                          <EncryptedButtonLabel
                            text={linkedin.label}
                            encryptedClassName={ABOUT_SCRAMBLE_ON_BASE}
                          />
                        </ExternalLink>
                      ) : null}
                    </div>
                  </IntroEntrance>
                </CvModalHost>
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

              THE LAST SENTENCE IS OVERRIDDEN AS OF 2026-08-24 AND THE REST OF
              THE PARAGRAPH IS NOT. Saad reported the composition reading left
              of centre, and it was: 265px of that residual, measured. The row
              is `lg:w-fit lg:mx-auto` now, so the slack is split evenly OUTSIDE
              the composition instead of banked on one side of it — see the
              row's own note for the measurements, the three candidate causes
              that were ruled out, and the terms on which Rule S-1 is broken
              here.

              `lg:flex-1` ITSELF IS UNTOUCHED AND STILL LOAD-BEARING. Between
              1024 and ~1161 the row still fills the container and the portrait
              is still the elastic column that absorbs the difference; only the
              case where the row is NARROWER than the container changed. The
              refusal of `justify-center` also still stands on its own terms —
              it is refused now because it would move the row and leave the band
              behind, which `w-fit` does not do.

              `lg:max-w-[448px]` IS DERIVED, NOT CHOSEN, AND THE DERIVATION
              SURVIVED THE CHANGE RATHER THAN BEING DROPPED BY IT.

              IT READ `lg:max-w-[384px]` UNTIL 2026-08-23, and the reasoning was:
              the text block measures 384.95px tall at `sm` and up (mark 72 +
              mt-lg 34 + paragraph 179.16 + mt-xl 55 + action row 44.8), and a
              square whose side equals that height is the one that terminates on
              the same line as the text under `lg:items-center`, so the row
              reads as a single rectangle.

              THAT RELATIONSHIP IS KEPT BY GROWING THE TEXT COLUMN IN STEP, not
              by abandoning it. At `xl` the paragraph is `text-h4` on a 640px
              measure with a 10-line 351px reserve, so the text column measures
              72 + 34 + 351 + 55 + 44.8 = 556.8px. The portrait cap does NOT go
              to 556.8: the row is width-limited before it is height-limited,
              and 1262 - 640 - 89 = 533 is the widest square 1440 can give it.
              448 is the value that leaves ONE SPINE UNIT of trailing void
              (1262 - 640 - 89 - 448 = 85px, within 4px of `2xl`); 444 would
              land it on exactly 89 and is the uglier number for the same
              result and the same image bucket.

              THE 629px CEILING THIS FILE ALREADY REFUSED IS UNTOUCHED. 448 is
              well inside it, and the refusal's reasoning — "a 629px square
              beside a 65-word bio makes this a portrait page with a caption" —
              still binds anything past ~500.

              THE INVARIANT WORTH KNOWING BEFORE EDITING EITHER COLUMN: the
              two columns are the SAME HEIGHT and neither governs. MEASURED on
              the shipped build at 1920x945: the text column is 364.0px
              (72 mark + 34 + 179.16 paragraph + 34 + 44.8 action row) and the
              portrait is a 364px square, so the row is 364px and the square
              terminates on the text's last line under `lg:items-center` —
              which is the relationship the cap was derived from and is the one
              thing to preserve if either column is ever resized.

              IT IS NO LONGER TRUE THAT EITHER IS FREE AGAINST THE HEIGHT
              BUDGET. This note used to say the row had slack because the text
              column ran to 556.8px at `xl`; that described a 40rem measure and
              a `text-h4` paragraph that are not what ships (34rem and
              `text-body`, at every width). The live budget is in the flip
              board's note at the bottom of this file, measured against a real
              945px browser viewport: the row's 364px is fixed input to it, and
              growing either column comes straight out of the board.

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

              A RADIUS AS OF 2026-08-24, AND NO BORDER, NO FILTER, NO
              DUOTONE, NO HOVER, AND NO `placeholder="blur"`.

              THE FIRST CLAUSE READ "NO RADIUS" AND IS REVERSED BY SAAD, NOT
              WORKED AROUND. It argued: "there is not one `rounded-*` in this
              codebase and a soft-cornered photo would be the exception
              announcing itself." THE PREMISE WAS AND IS TRUE — swept before
              the change, `app/` and `components/` carried ZERO `rounded-*`
              classes and `globals.css` carried no radius token, so the ticket
              asking for "the matching token from the site's established radius
              scale" was asking for something that did not exist. The
              CONCLUSION is Saad's to draw, and he drew the other one.

              `rounded-photo` IS 13px = `--spacing-sm`, off the Fibonacci scale
              the site is built on rather than off Tailwind's default radius
              scale, and it is declared as a ONE-CONSUMER token in
              `app/globals.css` with the four places the old rule was written
              down. It is 3.6% of the 364px side. Read that token before adding
              a second consumer: the guard is the NAME, not the value.

              IT IS ON THE `<img>` ITSELF, NOT ON THE WRAPPER. The wrapper is
              `IntroEntrance`, which owns a `transform`; giving it
              `overflow-hidden` to clip a child that already fills it exactly
              would add a clipping context to the entrance for no gain.
              `border-radius` on a replaced element clips the painted image
              directly, which is verified rather than assumed — see the commit.

              PURELY VISUAL, VERIFIED: the 364px cap, the square aspect, the
              centring and `PORTRAIT_SIZES` are all untouched and were
              re-measured after the change.

              The rest of the list is this page's brief and is unchanged — it
              is the quiet page, and a blur-up placeholder is a filter that
              resolves, which is motion. `priority` is the right answer to the
              pop a blur-up would paper over.

              DELAY 0, NOT `STAGGER.line * 3`, AND THE REASON IS THE SCROLL.

              It was unit 4 at 0.30s while every unit on this page entered on
              the same observer tick — which was guaranteed by the page being
              exactly one screen. Below `lg` it is not: MEASURED, the portrait's
              top lands at 649.6px in a 667px viewport at 375, so 5.2% of it is
              visible against `Reveal`'s `amount: 0.1` and it does NOT fire on
              load. It fires when the visitor scrolls to it — alone.

              A 0.30s delay on a unit with its OWN trigger is the index-shaped
              cascade `STAGGER.line`'s docstring forbids by name, "wherever units
              have independent triggers and a reader may arrive at one
              deliberately", because the delay is then measured from the wrong
              origin. `Projects.tsx` refuses exactly this on `/work` and says so:
              "`IntroEntrance` also accepts `delay`... nothing here passes it,
              and nothing should."

              SO THE CASCADE IS PER COLUMN NOW, and it is still monotonic in
              each: the text column runs 0 / 0.10 / 0.20 in document order, and
              the photograph — a second column at `lg`, a solitary
              scroll-triggered unit below it — runs at 0. At `lg` that reads as
              the two identity artifacts arriving together while the prose
              cascades under them, which is the composition the retired in-row
              pairing was reaching for. `docs/07` §6's "four units at
              0 / 0.10 / 0.20 / 0.30" is amended to match, and so is
              `IntroEntrance.tsx`'s settle-time example, which used this unit.

              THE FLEX
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
              <IntroEntrance
                /*
                IT IS NO LONGER `hidden` BELOW `lg`, AND THAT IS THE WHOLE OF
                ITEM 7. One element at every width instead of two, with the
                mobile one deleted rather than re-sized.

                `max-w-[34rem]` BELOW `lg` MATCHES THE TEXT COLUMN'S MEASURE,
                deliberately. This div is a SIBLING of that column, not a child,
                so without it the square would run to the container's full width
                and be wider than the paragraph above it at any viewport past
                ~586px — a photograph that breaks the spine the whole page is set
                on. "Full width" means the measure, which is what "full width"
                means everywhere else on this site.

                `mt-xl` IS THE SAME STEP THE ACTION ROW TAKES FROM THE PARAGRAPH
                (`sm:mt-xl`), so the page's vertical rhythm below `lg` is one
                scale rather than one scale and an exception. It is zeroed at
                `lg`, where the two are columns of a row and there is no gap of
                this kind between them.
              */
                className="mx-auto mt-xl max-w-[34rem] lg:mx-0 lg:mt-0 lg:max-w-[364px] lg:min-w-[213px] lg:flex-1"
              >
                <Image
                  src={portrait}
                  alt={ABOUT_PAGE_PORTRAIT_ALT}
                  sizes={PORTRAIT_SIZES}
                  priority
                  className="aspect-square w-full rounded-photo object-cover"
                />
              </IntroEntrance>
            </div>

            {/*
              THE COMPOSITION IS TRULY CENTRED NOW, AND THE TWO FLEX SPACERS
              THAT USED TO LIVE HERE ARE GONE.

              WHAT THEY DID AND WHY IT WAS WRONG. They split the leftover
              height 2:1 between "gap above the board" and "margin below it",
              so the gap was 37px at 1280x720 and 279px at 1920x1080 — the
              composition changed proportion with the window instead of being
              one thing that sits in the middle of it. Saad's instruction on
              2026-08-23 was true centring as one composed unit, and a spacer
              that grows is the opposite of a composed unit.

              THE CENTRING IS `my-auto` ON THE SPINE CONTAINER, NOT
              `items-center`, AND THE DIFFERENCE IS THE ONE THIS FILE ALREADY
              LEARNED ONCE. `items-center` on a box TALLER than its container
              puts the overflow on BOTH sides and the half above the top is
              unreachable by scrolling. A flex auto margin resolves to 0 when
              free space is negative, so the same element centres when it fits
              and sits at the top when it does not — which is exactly the
              behaviour a page that may or may not scroll needs.

              THAT PROPERTY IS ALSO WHAT MADE THE CENTRING LOOK BROKEN ON
              2026-08-24 WHEN IT WAS NOT. In a real maximised Chrome window on
              a 1080p display the viewport is 945px, not 1080 — and the
              composition was 788px tall inside 767px of available space, so
              free space was NEGATIVE, both auto margins resolved to 0, and the
              page top-anchored and scrolled exactly as this paragraph says it
              should. The fix was therefore in the height budget and not here:
              nothing about this line changed. Read the band's own note below
              for the arithmetic.

              THE UNITS WERE ALREADY DYNAMIC AND STAY THAT WAY. `min-h-dvh` on
              the box above, `my-auto` here — no fixed pixel height, no
              `100vh`, and nothing anywhere that assumes a screen size. What
              was hardcoded to 1080 was the VERIFICATION, not the CSS.

              THE GAP TO THE BOARD IS A FIXED SPINE STEP (`mt-2xl`, 89px at
              `lg`+), and it stays one through both of the board's resizings.
              It closed when the board grew into it and it did not reopen when
              the board came back down, because 89px between two composed
              regions is a spine step rather than a leftover.
            */}
            {/*
              THE FLIP BOARD, AS A BAND UNDER THE WHOLE ROW.

              IT USED TO LIVE INSIDE THE PORTRAIT'S COLUMN, 34px TALL, AND THE
              MOVE IS THE WHOLE OF THIS ROUND. Saad's instruction on 2026-08-23
              was explicit: "constrain its width to match the existing content
              column — from where the paragraph text starts to where the
              portrait ends", not a narrow box under the photo. That makes it a
              SIBLING of the row rather than a child of one of its columns, and
              it is why the spine container above is no longer the flex row —
              the row is now its own element so the band can sit beside it in a
              column.

              THE WIDTH IS DERIVED AND THE TWO CAPS ARE THE TWO GAPS.
              The content column is `measure + gap + portrait`:

                lg  (1024-1279, `gap-xl`)   544 + 55 + 364 = 963px
                xl+ (1280+,     `gap-2xl`)  544 + 89 + 364 = 997px

              Below those widths the container is narrower than the cap and the
              band simply takes the container — at 1024 the inner box is 846px
              and the content column is 846px, so the cap is inert and correct
              rather than inert and wrong. MEASURED at 1024, 1280, 1440 and
              1920; the band's left edge is the paragraph's and its right edge
              is the portrait's at every one.

              BELOW `lg` IT IS `max-w-[34rem]`, THE MEASURE, for the same reason
              the portrait is: this div is a SIBLING of the text column, not a
              child, so without it the band would run to the container's full
              width and break the spine the rest of the page is set on.

              ITS HEIGHT IS THE PAGE'S ONE ELASTIC DIMENSION, AND ON
              2026-08-24 IT WAS RE-DERIVED AGAINST A REAL BROWSER WINDOW
              RATHER THAN AGAINST A DISPLAY RESOLUTION. That distinction is
              the whole of this round:

              **1920x1080 IS A DISPLAY, NOT A VIEWPORT.** MEASURED on this
              machine, in real Google Chrome maximised on a 1080p screen:
              `outerHeight` 1032 (the Windows taskbar takes 48) and
              `innerHeight` **945** (browser chrome takes another 87). A
              bookmarks bar takes ~40 more. So the page had been verified
              against 135px of viewport that does not exist on the machine it
              was verified for, and at 1920x945 it overflowed by 21px — which
              is also why `my-auto` below looked like it had stopped working.
              It had not; there was simply no free space left to distribute,
              and an auto margin resolves to 0 against negative free space by
              design. THE CENTRING MECHANISM WAS NEVER THE BUG. THE HEIGHT
              BUDGET WAS.

              THE BUDGET, at the real 945px:

                945 - 89 (`pt-2xl`) - 89 (`pb-2xl`)          =  767 available
                    - 364 (row) - 89 (`mt-2xl` gap)          =  314 for tiles

              314px is the ZERO-OVERFLOW ceiling and every pixel of it is a
              pixel the centring has nothing to centre with, so the board is
              sized well under it: six rows at a 36px tile is **221px**, which
              leaves **93px** of slack — 46.5px above the mark and the same
              below the board. `text-flipping-board.tsx`'s `BOARD_TILE` carries
              the other half of that derivation, which is Saad's hierarchy
              instruction: the board must read as secondary to the block above
              it, and 364 / 221 = 1.647 is the golden section this design
              system uses everywhere else to say exactly that.

              IT SURVIVES THE BROWSER CHROME IT WAS PREVIOUSLY BLIND TO.
              MEASURED, 0.00px of overflow and true centring at 945 (no
              bookmarks bar), 905 (bookmarks bar), 875 (+ an infobar) and 860
              — in BOTH themes. The arithmetic floor is 852px of `innerHeight`
              (674px of composition + 178px of padding), which is 180px of
              browser furniture on a 1080p display.

              THE GAP IS `mt-2xl` (89px), A SPINE STEP, and it no longer has to
              be fought for. It was `mt-md` (21px) two rounds ago, for a
              16px-of-slack budget at 1280x720 that no longer binds anything —
              1280x720 is free to scroll now, and the board came down 114px.

              ITS OWN `IntroEntrance` AT DELAY 0, not a fifth cascade index.
              The cascade is per column (text 0 / 0.10 / 0.20, portrait 0) and
              the band is a third region, not a fourth line of the text column;
              a 0.30s delay on it would be the index-shaped cascade
              `STAGGER.line`'s docstring forbids where units have independent
              triggers. Below `lg` it has an independent trigger — it is far
              below the fold on a page that scrolls there.

              WHETHER IT RENDERS AT ALL IS NOT DECIDED HERE. `TextFlippingBoard`
              measures this band and declines past `BOARD_MAX_ROWS`, which keeps
              a 19-row wall of tiles off a 375px screen. That is a fit test on
              the real box, not a breakpoint. Its motion, its gates and the rule
              it reverses are all in `AboutFlipBoard.tsx`. Read that before
              changing anything here.
            */}
            <IntroEntrance className="mx-auto mt-xl max-w-[34rem] lg:mt-2xl lg:max-w-[963px] xl:max-w-[997px]">
              <AboutFlipBoard />
            </IntroEntrance>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutScreen;
