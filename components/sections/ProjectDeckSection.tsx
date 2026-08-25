import Link from "next/link";

import { IntroEntrance } from "@/components/intro/IntroEntrance";
import type { DeckCardProject } from "@/components/sections/FannedDeckPhase1";
import { Cards as FannedDeckPhase1 } from "@/components/sections/FannedDeckPhase1";
import { PROJECT_BUTTON_NAV } from "@/components/sections/projectButtonStyles";
import { DECK_BROWSE_AS_LIST_LABEL } from "@/components/sections/projectDeckContent";
import { WORK_PAGE_HEADING } from "@/components/sections/projectsContent";
import type { Project } from "@/content/types";

/**
 * `/work`'s project section — heading, the fanned deck, and the exit to
 * `/projects`. Tier 2.
 *
 * **THIS REPLACED `<Projects />` ON `/work` ON 2026-08-25.** The two-column
 * card grid is now Home's alone. Both surfaces still render all five projects
 * — the deck here, the strip list on `/projects` — so `docs/07` §5's definition
 * of `/work` as "the complete record" is unchanged; that was the cost of the
 * three-card option and it was not paid.
 *
 * DELIBERATELY A SERVER COMPONENT. The client boundaries are `IntroEntrance`
 * (which renders `Reveal`) and the deck. The deck receives only the FOUR fields
 * it draws — slug, title, oneLiner, coverImage — so `description`, the longest
 * strings in the data file, never crosses into the client bundle. That count
 * said SIX while the retired `ProjectDeck` rendered stacks and link rows; Phase
 * 2's card has neither, so the narrowing got narrower.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * THE `<h1>` IS HERE, AND IT IS VISIBLE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `/work` used to carry an `sr-only` `<h1>Work</h1>` in its page file, because
 * `<Projects />` rendered a visible `<h2>Work</h2>` and a second visible copy
 * would have been a duplicate rather than a hierarchy. With the grid gone this
 * section owns the page's only heading, so the level and the visual weight can
 * finally agree: one real, visible `<h1>`.
 *
 * **THE STRING IS "Projects.", NOT "Work" — HEADING ONLY.** The navbar's label
 * stays `WORK`, the route stays `/work`, and `<title>` stays `PROJECTS_HEADING`
 * ("Work") so the tab, the nav entry and the URL keep agreeing with each other.
 * `projectsContent.ts` carries both strings and the reason they are two.
 *
 * **NOTHING TOOK THE `#work` ANCHOR WITH IT.** That id belongs to `Projects`'
 * `<section>`, which now renders only on Home, so `/#work` still resolves to
 * exactly what it always did. `projectsContent.ts`'s warning that renaming the
 * heading is a multi-file commit is about `PROJECTS_HEADING`, which is not
 * being renamed. Verified: no file in `app/`, `components/`, `lib/` or
 * `content/` links to `/work#...`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * THE ONE-VIEWPORT ARITHMETIC — measured against `innerHeight`, never 1080
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `docs/07` §6: "A DISPLAY RESOLUTION IS NOT A VERIFICATION TARGET.
 * `innerHeight` IS." `/about` shipped a 21px overflow by checking 1080. On a
 * 1920x1080 display a real Chrome window is **945px** of `innerHeight` with no
 * bookmarks bar, 905 with one, 875 with an infobar as well.
 *
 *   fixed navbar strip (>=768)                            59.0   (overlaid; it
 *                                                                is `fixed` and
 *                                                                takes no flow)
 *   `pt-2xl` above the heading                            89.0
 *   `<h1>` `text-h2` 68px x line-height 1.1               74.8
 *   `mt-xl` heading -> deck                               55.0
 *   deck container                                       540.0   (the scaffold
 *                                                                in this slot
 *                                                                is 480 at rest
 *                                                                and 840 when a
 *                                                                card is open —
 *                                                                see the caveat)
 *   `mt-xl` deck -> control                               55.0
 *   "Browse as a list" (13 + 16.8 + 13 + 2x2 border)      46.8
 *   brutal shadow overhang below it                        5.0
 *                                                       ───────
 *   from the top of the viewport                         865.6
 *
 *   at 945 innerHeight   +79.4 clear  ✓
 *   at 905               +39.4 clear  ✓
 *   at 875               + 9.4 clear  ✓
 *   at 860               − 5.6        the shadow crosses the fold by 6px
 *
 * **Accepted at 860** (a bookmarks bar AND an infobar). `/work` is a scrolling
 * document, unlike `/about`, and the requirement is that the interaction fits at
 * standard desktop sizes — at 875 it does, with room. The clear air under the
 * navbar is `89 − 59 = 30px`.
 *
 * **`mt-xl` (55) UNDER THE HEADING, NOT `Projects.tsx`'s `lg:mt-2xl` (89).**
 * That 34px is the entire difference between clearing 875 and not. Do not
 * "harmonise" it back to the grid's rhythm — the grid is on a page with no
 * one-viewport requirement.
 *
 * The section's closing `pb-2xl` (89) sits below the fold by design; the
 * Certifications heading is the scroll cue.
 *
 * **PHASE 1/2/3 CAVEAT — THE 540.0 LINE IS THE RETIRED DECK'S CONTAINER, AND
 * THE SCAFFOLD IN THIS SLOT HAS TWO HEIGHTS RATHER THAN ONE.** The deck's box
 * RESIZES when a card is expanded, because the four cards it throws to
 * `y: 400` reach 795px below the box's top edge at `lg` and would otherwise be
 * clipped by its own `overflow-hidden`. `FannedDeckPhase1.tsx` carries the
 * full extent arithmetic and the measurement behind the animated height.
 *
 * **NEITHER PHASE 2 NOR PHASE 3 CHANGED ANY OF THESE NUMBERS, AND NEITHER HAD
 * TO.** Phase 2 swapped the vendor's placeholder deck for the five real
 * projects and Phase 3 restyled the card to this site's palette, type and
 * spacing; both changed what is INSIDE each card and neither touched the card's
 * layout box. `--width` / `--height` are still 220x300 and 300x400, the drop is
 * still `y: 400` at `scale: 0.7`, and `ACTIVE_SCALE` is still 1.15. The
 * expanded card absorbs its extra content inside its own fixed box — Phase 2 by
 * shrinking its cover, Phase 3 by reserving the space up front and never moving
 * anything — so every figure below still holds and this section's neighbours
 * still move by exactly +360. What ships:
 *
 *   RESTING          480px (`h-120`, the vendor's own box, unchanged)
 *   EXPANDED         800px below 1024 · **840px at `lg`**
 *
 * so the running total from the top of the viewport is:
 *
 *   at rest   89 + 74.8 + 55 + **480** + 55 + 46.8 + 5 = **805.6**
 *   expanded  the same sum with **840** in place of 480 = **1165.6**
 *
 * **THE GROWTH IS REAL BLOCK HEIGHT AND THIS SECTION'S NEIGHBOURS ACTUALLY
 * MOVE.** That is a requirement rather than a side effect — an expanded deck
 * pushes Certifications and Experience down the document; it does not merely
 * paint over them or reserve nothing. Measured on the production build at
 * 1440x900, rest -> expanded:
 *
 *   this section's "Browse as a list"     753.80  -> 1113.80
 *   `#certifications-heading`             991.59  -> 1351.59   (+360.00)
 *   Experience's `<h2>`                  1316.19 -> 1676.19   (+360.00)
 *   `document.scrollHeight`                 2770 ->    3130    (+360)
 *
 * If those offsets were ever equal in the two states, the deck would have been
 * built the wrong way — visually accommodated, not in flow.
 *
 * At rest that is 60px better than the 865.6 above and every clearance in the
 * table gains 60px — 139.4 clear at 945, 99.4 at 905, 69.4 at 875, and **+54.4
 * at 860**, so the one case that was "accepted at −5.6" is comfortably inside
 * the fold for as long as this scaffold is in the slot.
 *
 * **THE EXPANDED STATE DELIBERATELY EXCEEDS ONE VIEWPORT, AND THAT IS FINE.**
 * 1165.6px is 220.6px past a 945 `innerHeight` and 265.6px past 900. `/work`
 * is a scrolling document; the one-screen composition guarantee is `/about`'s
 * and only `/about`'s (`docs/07` §6, and this page's own file header). The
 * requirement here is that the deck's RESTING state — which is what a visitor
 * lands on, and the only state the Intro hands off into — fits without
 * scrolling, and it does, with 69px to spare at 875. When a card is expanded
 * the page simply scrolls. Do not "fix" this by shrinking the expanded box:
 * every pixel of it is holding a card that would otherwise be invisible.
 *
 * The 540.0 figure is left in the table above because it is the number Phase
 * 3's real deck must be measured against again; do not treat 480 or 840 as the
 * new target.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MOTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `IntroEntrance` and NOT `Reveal`, for the reason `Projects.tsx` records: the
 * Intro plays over a hard load of `/work`, and `Reveal` is `whileInView` at
 * scroll 0 — so every above-the-fold unit would fire at ~131ms and be fully
 * settled behind a plate that is still opaque at 2.7s. `IntroEntrance` re-keys
 * them to the hand-off.
 *
 * **ONE WRAPPER AROUND THE WHOLE DECK, NEVER ONE PER CARD.** Per-card reveals on
 * an overlapping fan would show cards sliding through each other. The deck is
 * one object.
 *
 * NO SCRUB, EVER. `docs/07` §5 and `docs/03` both scope scroll-scrubbed
 * animation to Home. This page is normal scroll.
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 2 — THE PROP CONTRACT IS BACK, VERBATIM, AS PHASE 1 PROMISED.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `projects: readonly Project[]` with NO default, deliberately:
 *
 * All five projects, in `content/projects.ts`'s array order — which is
 * strength-first and deliberately NOT date order. This component does not
 * filter, sort or slice, exactly as `Projects` does not: the caller hands over
 * the records it wants rendered, in the order it wants them rendered. There is
 * no default. An omitted list would silently fall back to something, and a page
 * that forgot to pass its list would look correct on nothing.
 *
 * It took no props for the length of Phase 1 only, because the deck below was
 * the vendor scaffold rendering the VENDOR'S OWN placeholder cards and there
 * was nothing for the array to feed.
 *
 * **THE NARROWING TO `DeckCardProject` HAPPENS HERE, NOT AT THE PAGE.** The
 * page's job is "the complete record, in array order"; deciding which FIELDS
 * cross the client boundary is this section's, because it is the thing that
 * knows what the card draws. `ProjectStripRow` splits the same way.
 *
 * `ProjectDeck.tsx` IS STILL ON DISK AND IS DELIBERATELY UNIMPORTED. It is not
 * dead code to be swept — Saad may want to compare the two, and its
 * keyboard/focus handling and its separate expanded PANEL are still wanted:
 * that panel is the structure that fixes the `<a>`-inside-`<button>` problem
 * Phase 2 introduced, and **Phase 3 did not take it on** — Phase 3's brief was
 * the restyle and four measured defects, not the accessibility work, which is
 * enumerated as still open at the end of `FannedDeckPhase1.tsx`'s header. Its
 * hard-cap guard has already been salvaged into `FannedDeckPhase1.tsx`.
 * Do not delete it.
 */
export function ProjectDeckSection({
  projects,
}: {
  projects: readonly Project[];
}) {
  return (
    <section
      id="work-projects"
      aria-labelledby="work-projects-heading"
      // Rule S-2's standard seam: 89 bottom + 89 top = 178px, uniform at all
      // breakpoints. The TOP `pt-2xl` is also this page's clearance under the
      // permanently-visible fixed navbar, which takes no space in flow —
      // measured, the bar is 48px below 640, 64px from 640 to 767 and 59px at
      // 768 and up, leaving 41 / 25 / 30px of clear air. IF THE SEAM VALUE OR
      // THE BAR'S HEIGHT EVER CHANGES, RE-MEASURE HERE; the 25px band at
      // 640-767 is the tightest.
      className="w-full bg-base pt-2xl pb-2xl"
    >
      {/* Identical to Home's sections' container, byte for byte. The spine is
          21 / 55 / 89px. The deck deliberately declares no inner cap: unlike the
          gallery it is not a reading measure, and its width IS the fan's
          footprint. */}
      <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
        <IntroEntrance>
          {/* Weight left at the inherited 400, as in every other section
              heading: the type scale carries the size, and a bolder heading
              pulls a Tier 2 section toward Tier 1. `text-h2` and not `text-h1`
              — the h1 here is a page heading on a quiet archive page, not a
              hero, and `text-h1` is spent on Home's name. */}
          <h1 id="work-projects-heading" className="text-h2 text-fg">
            {WORK_PAGE_HEADING}
          </h1>
        </IntroEntrance>

        {/* 55, not 89 — see the one-viewport arithmetic in this file's header.
            The gap under the heading is still LARGER than any gap inside the
            deck, so the deck reads as one block beneath the heading rather than
            as a peer of it. */}
        {/* PHASE 3: the five REAL projects, on this site's palette, type scale
            and spacing. The vendor's five-hue palette, its `rounded-*` and its
            numeric spacing are gone; `FannedDeckPhase1.tsx`'s header carries
            what replaced each of them, and the short list of accessibility work
            that is still open. This wrapper, its `mt-xl` and the
            one-wrapper-around-the-whole-deck rule above are unchanged.

            THE `.map` IS THE FIELD NARROWING AND NOTHING ELSE — no filter, no
            sort, no slice, so `content/projects.ts`'s array order reaches the
            fan untouched. Spreading `project` wholesale would put every
            `description` into the client payload for a card that never renders
            one. */}
        <IntroEntrance className="mt-xl">
          <FannedDeckPhase1
            projects={projects.map(
              ({ slug, title, oneLiner, coverImage }): DeckCardProject => ({
                slug,
                title,
                oneLiner,
                coverImage,
              }),
            )}
          />
        </IntroEntrance>

        {/*
          THE EXIT TO `/projects`. On the spine, left-aligned, intrinsic width —
          not full-width, not centred, no arrow glyph, no rule above it. A
          full-bleed button is the template move and `text-center` is zero on
          this site.

          A PLAIN `<Link>`, NOT AN OVERLAY TRIGGER. `/projects` is a real page
          with its own heading and its own Close; only `/projects/<slug>` is
          intercepted.

          THE LABEL IS "Browse as a list" AND THE REASON LIVES WITH THE STRING,
          in `projectDeckContent.ts`. Do not "fix" it back to "View All
          Projects": both surfaces hold the same five projects, so a label
          promising more of them would be untrue.
        */}
        <IntroEntrance className="mt-xl">
          <Link href="/projects" className={PROJECT_BUTTON_NAV}>
            {DECK_BROWSE_AS_LIST_LABEL}
          </Link>
        </IntroEntrance>
      </div>
    </section>
  );
}

export default ProjectDeckSection;
