import { CvAction } from "@/components/about/CvAction";
import {
  ABOUT_BUTTON_SECONDARY,
} from "@/components/about/aboutButtonStyles";
import {
  ABOUT_PAGE_GITHUB_LABEL,
  ABOUT_PAGE_LINKEDIN_LABEL,
  ABOUT_PAGE_MARK_LABEL,
  ABOUT_PAGE_PARAGRAPH,
} from "@/components/about/aboutPageContent";
import { ParticleGrid, QUIET_FIELD } from "@/components/hero/ParticleGrid";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { MonogramMark } from "@/components/ui/MonogramMark";
import { contact } from "@/content/contact";

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
 *   4. NO `Reveal`, and therefore NO CLIENT BOUNDARY except the two that earn
 *      one — the canvas and the CV control. There is nothing to reveal on a
 *      page with no scroll, and a fade on load would be motion for its own sake
 *      on the page whose whole brief is quiet.
 *
 * ALSO ABSENT: the command sphere. §6 pins it to Home. `sphere={false}` below
 * is that rule, written where it can be checked.
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
 * THE SPINE IS BYTE-IDENTICAL TO SKILLS' AND ABOUT'S:
 * `mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl`, content capped at
 * the same `34rem` measure. Chrome went full-bleed in Phase 0 (§1's tracked
 * reversal of Rule S-1); CONTENT SECTIONS KEEP THE SPINE, and this is one.
 */
export function AboutScreen() {
  /* BY LABEL, NEVER BY INDEX. `content/contact.ts` states that its array order
     is display order for the Contact section and is free to change; an index
     here would one day render GitHub's URL under LinkedIn's label. Not by
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
        {/* The same mesh the hero draws, thinned rather than veiled — see
            `QUIET_FIELD`. `sphere={false}` keeps the command sphere on Home. */}
        <ParticleGrid field={QUIET_FIELD} sphere={false} />

        <div className="relative flex h-full items-center pt-xl sm:pt-2xl">
          <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
            <div className="max-w-[34rem]">
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
              */}
              <MonogramMark
                variant="nav"
                label={ABOUT_PAGE_MARK_LABEL}
                className="h-[56px] w-auto text-fg sm:h-[72px]"
              />

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
              <p className="mt-md min-h-[230px] text-body text-fg sm:mt-lg sm:min-h-[179px]">
                {ABOUT_PAGE_PARAGRAPH}
              </p>

              {/*
                THE ACTION ROW — one primary, two secondary, in that order.

                STACKED AND FULL-WIDTH BELOW 640, a row above it. Three
                side-by-side controls inside 333px of mobile measure give each
                ~97px, which truncates "LinkedIn". The column gets full width
                for free: a flex column's default `align-items: stretch` is what
                sizes the children, so no width class is needed on any of the
                three — which matters, because one of them is rendered by a
                different component.
              */}
              <div className="mt-lg flex flex-col items-stretch gap-sm sm:mt-xl sm:flex-row sm:flex-wrap sm:items-center">
                <CvAction />
                {/* `ExternalLink` for the semantics only — `target`, `rel` and
                    the announced new-tab note, which is the whole reason it
                    exists. The dressing is this page's, passed in, exactly as
                    that component's header requires: colour and size always
                    belong to the call site. These are CONTROLS, so they take
                    the outlined button dressing rather than the teal underlined
                    treatment that belongs to links inside prose. */}
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutScreen;
