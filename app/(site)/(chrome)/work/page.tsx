import type { Metadata } from "next";

import { Projects } from "@/components/sections/Projects";
import { Experience } from "@/components/sections/Experience";
import { CurrentlyLearning } from "@/components/sections/CurrentlyLearning";
import { RevealFooter } from "@/components/sections/RevealFooter";
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
 * TWO PROJECTS EXIST ONLY HERE. CCN and SNA are archive-only — Phase 3 cuts
 * Home to Aero-Grid, ClashChat and FOLIO — so this page is the ONLY route on
 * the site that links to their detail pages. It is therefore the only place
 * their card → overlay morph can be tested at all.
 *
 * A SERVER COMPONENT WITH NO PROPS AND NO STATE. Every section below is already
 * a server component with its own client boundaries (`Reveal`, `ProjectCard`),
 * so nothing here needs a directive.
 *
 * NO PINNING AND NO SCRUBBING, EVER. `docs/07` §5 closes that question by name:
 * scroll-scrubbed animation is Home only. About and Work are normal scroll.
 * `docs/03_FRONTEND_SPEC.md`'s "Scroll-scrub — Home only" says the same thing in
 * the tracked spec, and `motion="reveal"` below is where this page enforces it.
 * That prop is REQUIRED and has no default precisely so this page cannot
 * silently inherit Home's motion — the omission would be invisible in review
 * and correct-looking on Home, which is the worst way to find a bug.
 *
 * `<Projects />` IS HANDED THE WHOLE ARRAY, and that is this page's definition:
 * Home gets `featuredProjects` (three), this gets `projects` (all five). The
 * component itself filters, sorts and slices nothing, so "the complete record"
 * is enforced by what is passed here rather than by a flag inside a component.
 * Never pass a subset from this page — that is what Home is for.
 *
 * NO `<Hero />`, which the navbar has to cope with: its palette starts in the
 * past-hero branch here rather than transparent-over-nothing. See `Navbar.tsx`.
 */

/**
 * `title` IS THE SECTION HEADING CONSTANT, not a second literal. Renaming
 * "Work" is already recorded in `projectsContent.ts` as a multi-file commit;
 * this is one more file that must move with it, and reading the constant means
 * it moves for free. The root layout's `%s — Saad` template composes the rest.
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
        THE PAGE STACK. `bg-base` and `relative z-10` are Rule S-5's two
        mandatory classes and are byte-identical to Home's — the reveal footer
        below is pinned behind this element from the first painted frame, and
        this background is the only thing occluding it. Home's call site carries
        the full reasoning, including why inheriting the body background does
        NOT work (it propagates to the canvas, which paints below positioned
        descendants).
      */}
      <main className="relative z-10 bg-base">
        {/*
          THE PAGE OUTLINE STARTED AT `<h2>`. Four sections each render one,
          and nothing above them named the document - an outline with no root.

          `sr-only` and not visible, because `Projects` already renders a
          visible "Work" as its own `<h2>`, and a second visible copy would be
          a duplicate rather than a hierarchy. The mild spoken redundancy is
          the cheap side of the trade; the alternative is threading a
          `headingLevel` prop through a component shared with Home, where the
          `<h1>` is already spent on the hero.
        */}
        <h1 className="sr-only">Work</h1>
        {/* Section order is fixed: the archive, then the internship, then
            what is in progress. Each is `bg-base` with Rule S-2's standard
            89/89 seam, so the three stack with no seam work needed here. */}
        <Projects projects={projects} motion="reveal" />
        <Experience />
        {/* Renders NOTHING while `content/currentlyLearning.ts` is empty — the
            component returns `null`, so no section, no heading and no seam
            reach the HTML. That is why this placement costs nothing today and
            is still correct the moment the first entry lands. */}
        <CurrentlyLearning />
      </main>
      {/* THE SAME COMPONENT HOME RENDERS, not a copy. Phase 5 absorbed the old
          `Contact` section into this shared reveal footer, which is exactly
          what this file's earlier comment predicted; the curtain is scoped to
          Home and Work by `docs/07_SITE_RESTRUCTURE.md` §5 and is deliberately
          absent from `/about`.

          A CONSEQUENCE WORTH KNOWING: `/about` therefore has ZERO `contentinfo`
          landmarks. That is valid HTML and it is a decision, not an oversight —
          §6 keeps About "deliberately the one fully quiet page", its CTA row
          already carries GitHub and LinkedIn, and a static non-curtain footer
          there would break that framing to add a landmark nobody asked for. */}
      <RevealFooter />
    </>
  );
}
