import type { Metadata } from "next";

import { ProjectDeckSection } from "@/components/sections/ProjectDeckSection";
import { Certifications } from "@/components/sections/Certifications";
import { Experience } from "@/components/sections/Experience";
import { CurrentlyLearning } from "@/components/sections/CurrentlyLearning";
import { RevealFooter } from "@/components/sections/RevealFooter";
import { PageStack } from "@/components/ui/PageStack";
import { PROJECTS_HEADING } from "@/components/sections/projectsContent";
import { projects } from "@/content/projects";

/**
 * `/work` — the complete record.
 *
 * WHAT THIS PAGE IS FOR, per `docs/07_SITE_RESTRUCTURE.md` §5: Home carries the
 * curated narrative, this carries everything. The full archive (all five
 * projects, not the featured three), the internship, and whatever
 * `content/currentlyLearning.ts` holds. Experience and Currently Learning are
 * both "the complete record" and are kept together with it, in the quiet
 * readable tier, rather than interrupting Home.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RESTRUCTURED 2026-08-25 — the section order and what changed
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   1. `ProjectDeckSection`  the `<h1>`, the fanned deck of all five, and the
 *                            "Browse as a list" exit to `/projects`
 *   2. `Certifications`      a heading and one line, visibly present
 *   3. `Experience`          unchanged content, reordered to sit after (2)
 *   4. `CurrentlyLearning`   unchanged; renders nothing while its data is empty
 *   5. `RevealFooter`        the shared curtain, outside `PageStack`
 *
 * **`<Projects />` IS GONE FROM THIS PAGE.** The two-column card grid was
 * replaced by the fanned deck, which holds the same five projects; the grid now
 * renders on Home only. `docs/07` §5's definition of this page as "the complete
 * record" is therefore unchanged — that was the cost of the alternative
 * (a three-card deck) and it was not paid.
 *
 * **`CurrentlyLearning` IS KEPT DELIBERATELY, AND ITS ABSENCE FROM THE SPEC'S
 * ORDER IS NOT AN INSTRUCTION TO DELETE IT.** §1 of the projects-architecture
 * spec lists deck / button / Certifications / Experience / footer and does not
 * mention this section, which has shipped here since Ticket 9 and which
 * CLAUDE.md calls "the living part of the site". Deleting real shipped content
 * on an inference from an omission is not a reversible choice; keeping it is.
 * It sits after Experience, where it always has.
 *
 * A COMPOSITION QUESTION THAT IS OPEN AND SHOULD BE ANSWERED BY LOOKING AT IT:
 * Certifications and Currently Learning are now both near-empty, two sections
 * apart on one page — the first renders a heading and "Coming soon.", the
 * second renders nothing at all today. That reads fine right now precisely
 * because the second one is invisible, but the moment
 * `content/currentlyLearning.ts` gains its first entry the page has two
 * thin sections bracketing Experience. If that reads poorly, the fix is a
 * composition decision (merge them, or move Certifications below Currently
 * Learning), not a code cleanup.
 *
 * TWO PROJECTS EXIST ONLY IN THE DECK AND ON `/projects`. CCN and SNA are
 * archive-only — Phase 3 cut Home to Aero-Grid, ClashChat and FOLIO — so this
 * page and `/projects` are the only routes that link to their detail pages.
 * (This said "the ONLY route" until the `/projects` index shipped.)
 *
 * A SERVER COMPONENT WITH NO PROPS AND NO STATE. Every section below is already
 * a server component with its own client boundaries, so nothing here needs a
 * directive. Those boundaries are `IntroEntrance` (which renders `Reveal`) and
 * `ProjectDeck` in the deck section, `IntroEntrance` again in `Certifications`
 * (it was `Reveal` there until 2026-08-25 — its heading turned out to sit at
 * 1038.6px and to be inside the fold on a 1440-tall display, so it was
 * animating behind the Intro plate; that file's header carries the arithmetic),
 * `Reveal` in `Experience`, and `CopyEmailButton` / `MonogramMark` in
 * `RevealFooter`.
 * `PageStack` below is a client boundary too, and always was.
 *
 * NO PINNING AND NO SCRUBBING, EVER. `docs/07` §5 closes that question by name:
 * scroll-scrubbed animation is Home only. About and Work are normal scroll.
 * `docs/03_FRONTEND_SPEC.md`'s "Scroll-scrub — Home only" says the same thing in
 * the tracked spec. That used to be enforced from this file, through
 * `<Projects motion="reveal" />` — a required prop with no default, precisely so
 * this page could not silently inherit Home's motion. **With the grid gone, that
 * enforcement point is gone with it:** `ProjectDeckSection` has no motion prop
 * because it has exactly one correct answer and no second caller. If this page
 * ever renders a shared-with-Home section again, the required-prop device is the
 * pattern to copy.
 *
 * `<ProjectDeckSection />` IS HANDED THE WHOLE ARRAY, and that is still this
 * page's definition: Home gets `featuredProjects` (three), this gets `projects`
 * (all five). The section filters, sorts and slices nothing, so "the complete
 * record" is enforced by what is passed here rather than by a flag inside a
 * component. Never pass a subset from this page — that is what Home is for.
 * (The deck does carry a HARD CAP at five, which is a ceiling rather than a
 * filter: a sixth project fails the build loudly. `ProjectDeck.tsx`'s
 * `DECK_MAX_CARDS` has the arithmetic.)
 *
 * NO `<Hero />`, which the navbar has to cope with: its palette starts in the
 * past-hero branch here rather than transparent-over-nothing. See `Navbar.tsx`.
 */

/**
 * `title` IS THE SECTION HEADING CONSTANT, not a second literal — and it is
 * still "Work" even though the page's visible `<h1>` now reads "Projects.".
 *
 * THAT IS DELIBERATE AND IT IS THE SMALLER OF TWO INCONSISTENCIES. The tab, the
 * navbar entry and the URL all say "work"; only the heading says "Projects.",
 * which is the heading-only change Saad ruled. Titling the tab "Projects" would
 * put a second page called Projects one click from `/projects` in a browser's
 * tab strip and in its history, with nothing to tell them apart.
 *
 * Renaming `PROJECTS_HEADING` itself is still a multi-file commit — see
 * `projectsContent.ts`. Renaming `WORK_PAGE_HEADING` is not, and this line is
 * not one of the files it would touch.
 *
 * NO `description` — the root's `SITE_DESCRIPTION` is inherited and is still
 * accurate for this page. A second one would be new copy, and copy is not this
 * commit's to write.
 */
export const metadata: Metadata = {
  title: PROJECTS_HEADING,
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    // A FRAGMENT, for the same reason Home is one: `<RevealFooter />` renders a
    // `<footer>` and it must be a SIBLING of `<main>`, not a child, or it is
    // scoped to `<main>` and stops being the `contentinfo` landmark. Nothing
    // errors and nothing looks different when that is got wrong, which is
    // exactly why it is written down in both files.
    <>
      {/*
        THE PAGE STACK. `bg-base` and `relative z-10` are Rule S-6's two
        mandatory classes and are byte-identical to Home's — the reveal footer
        below is pinned behind this element from the first painted frame, and
        this background is the only thing occluding it. Home's call site carries
        the full reasoning, including why inheriting the body background does
        NOT work (it propagates to the canvas, which paints below positioned
        descendants).

        `PageStack` renders the `<main>` this used to write out literally, and
        renders it identically; it adds the route transition's fade on a child,
        never on `<main>` itself, because `<main>`'s background IS the occluder.
        The class string stays here rather than moving into the component for
        the same reason it is spelled out on Home.
      */}
      <PageStack className="relative z-10 bg-base" fade>
        {/*
          THE PAGE'S `<h1>` IS NOT HERE ANY MORE. It used to be an `sr-only`
          "Work" written out in this file, because `<Projects />` rendered a
          visible `<h2>Work</h2>` and a second visible copy would have been a
          duplicate rather than a hierarchy. With the grid gone,
          `ProjectDeckSection` renders one real, VISIBLE `<h1>` — so the outline
          has a root, the root is on screen, and the level and the visual weight
          finally agree. There is exactly one `<h1>` on this page; the three
          sections below it are all `<h2>`.

          Section order is fixed and is documented in this file's header. Each
          section is `bg-base` with Rule S-2's standard 89/89 seam, so the four
          stack with no seam work needed here.

          THE FIRST SECTION'S `pt-2xl` IS ALSO THIS PAGE'S CLEARANCE UNDER THE
          FIXED NAVBAR, which takes no space in flow. That dual role now lives
          in `ProjectDeckSection.tsx` beside the padding itself, together with
          the measured figures (41 / 25 / 30px of clear air at the three bar
          heights) and the instruction to re-measure if either value moves. It
          was documented here, in the page file, while the first section was a
          component shared with Home that could not state it.
        */}
        {/*
          PHASE 2 — `projects={projects}` IS BACK, exactly as Phase 1 said it
          would be, and the `content/projects` import with it. All five, in
          `content/projects.ts`'s array order, never a subset: the standing
          contract is the paragraph headed "`<ProjectDeckSection />` IS HANDED
          THE WHOLE ARRAY" in this file's header. The SECTION narrows the fields
          before they cross into the client bundle; this page decides the
          RECORDS and nothing else.
        */}
        <ProjectDeckSection projects={projects} />
        <Certifications />
        <Experience />
        {/* Renders NOTHING while `content/currentlyLearning.ts` is empty — the
            component returns `null`, so no section, no heading and no seam
            reach the HTML. That is why this placement costs nothing today and
            is still correct the moment the first entry lands. */}
        <CurrentlyLearning />
      </PageStack>
      {/* THE SAME COMPONENT HOME RENDERS, not a copy. Phase 5 absorbed the old
          `Contact` section into this shared reveal footer, which is exactly
          what this file's earlier comment predicted; the curtain is scoped to
          Home and Work by `docs/07_SITE_RESTRUCTURE.md` §5 and is deliberately
          absent from `/about` and from `/projects`.

          A CONSEQUENCE WORTH KNOWING: `/about` therefore has ZERO `contentinfo`
          landmarks. That is valid HTML and it is a decision, not an oversight —
          §6 keeps About "deliberately the one fully quiet page", its CTA row
          already carries GitHub and LinkedIn, and a static non-curtain footer
          there would break that framing to add a landmark nobody asked for. */}
      <RevealFooter />
    </>
  );
}
