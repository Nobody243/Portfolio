import type { Metadata } from "next";
import Link from "next/link";

import { ProjectStripRow } from "@/components/sections/ProjectStripRow";
import { PageStack } from "@/components/ui/PageStack";
import { STANDALONE_NAV } from "@/components/ui/standaloneNav";
import { projects } from "@/content/projects";

/**
 * `/projects` — the projects index.
 *
 * WHAT IT IS FOR, per `.claude/specs/projects-architecture-spec.md` §3: a full
 * page, not a modal, reachable by direct URL and refreshable, holding one
 * full-width strip row per project. `/work` carries the fanned deck and the
 * rest of the record; this page is the same five projects in a different
 * PRESENTATION, which is what `/work`'s button to it used to say in as many
 * words ("Browse as a list", until 2026-08-27; it reads "Browse All" now)
 * rather than promising more projects.
 *
 * WHAT IS ON IT, AS OF SLICE 4: the heading, the five strip rows in
 * `content/projects.ts`'s own order, and a Close affordance above and below
 * them. Slice 1 shipped the shell alone — heading and one exit — because
 * everything else in the feature pointed at this route and needed a real
 * destination before it could be built or verified: the navbar's active-route
 * grouping, `/work`'s button and Home's button. That shell is now filled in.
 *
 * THE ORDER OF THE ROWS IS `content/projects.ts`'s ARRAY ORDER AND IS NEVER
 * SORTED. `projects` is passed straight to `.map()` below — no filter, no
 * slice, no `featuredProjects`. This page is the exhaustive list by definition,
 * which "Browse as a list" said out loud until 2026-08-27: both surfaces
 * hold the same five, and only the presentation differs.
 *
 * INSIDE `(chrome)`, AND THAT IS FORCED RATHER THAN CHOSEN. Two independent
 * requirements land on the same group. §0.1 wants the Intro to play on load,
 * and the Intro's gate is `IntroProvider`, mounted by
 * `app/(site)/(chrome)/layout.tsx`; `docs/06_INTRO_AND_CHROME.md` §4 scopes the
 * gate to that group and forbids IN CAPITALS applying the per-page navbar
 * fallback to the gate, because a per-page provider remounts on every
 * navigation. §0.4 wants the navbar's WORK entry active here, and the bar is
 * mounted by that same layout. Neither is satisfiable from outside the group.
 *
 * IT DOES NOT SHADOW THE OVERLAY INTERCEPTION, and that was checked at build
 * level rather than assumed. The interceptor's path is
 * `@modal/(.)projects/[slug]` — `(.)` binds to the `projects` segment and the
 * pattern requires a SECOND segment beneath it, so a one-segment `/projects`
 * cannot match it or be matched by it. Route groups contribute no URL segment,
 * so the string `projects` appearing as a directory name under both `(chrome)`
 * (this index) and `(site)` (the `[slug]` detail pages) produces two different
 * URLs and no conflict. The spec's implementation record carries the route
 * table from the probe that proved it.
 *
 * A SERVER COMPONENT WITH NO PROPS AND NO STATE, like `/work` and `/about`.
 * `PageStack` below is STILL the only client boundary on the page, and the
 * strip rows did not add one: `ProjectStripRow` is a server component whose
 * hover-reveal is CSS (`group-hover:` plus `group-has-[a:focus-visible]:`).
 * That file records why Framer was refused there — it has no `focus-within`
 * equivalent, so a keyboard user would have got nothing.
 *
 * NO `<RevealFooter />`, AND THAT IS A RULING RATHER THAN AN OMISSION. Saad,
 * 2026-08-25, on the planner's F.4: `docs/07_SITE_RESTRUCTURE.md` §5 scopes the
 * curtain to Home and Work, and this page is a navigational index that already
 * carries its own explicit exit. A curtain here would put a second exit
 * affordance directly under the one the spec asked for. That is `/about`'s
 * reasoning applied to a second route, and it means `/projects` — like
 * `/about` — has ZERO `contentinfo` landmarks. Valid, and deliberate.
 *
 * NO PAGE-STACK CLASSES ON `<main>` FOR THE SAME REASON. Rule S-6's
 * `relative z-10 bg-base` exists to OCCLUDE the pinned curtain plate. There is
 * no plate on this route, so there is nothing to occlude and adding them would
 * be cargo cult — `/about` states this in full. The empty string below is a
 * decision made here, which is exactly why `PageStack` requires the prop and
 * gives it no default.
 *
 * `fade` IS `true`, matching `/` and `/work`. `/about` passes `false` because
 * it runs a one-shot entrance and a continuously-drawing canvas and was judged
 * to have too many concurrent motion authors; this page has neither, so it
 * takes the site's ordinary route transition.
 *
 * NO `IntroEntrance` WRAPPER, AND THE STRIP ROWS DID NOT CHANGE THAT. That
 * component exists because `Reveal` is `whileInView` at scroll 0, so an
 * above-the-fold unit on a hard load animates in secret behind the Intro's
 * opaque plate. NOTHING ON THIS PAGE IS WRAPPED IN A `Reveal` — not the
 * heading, not either exit, and not a single row — so there is no secret
 * animation to re-key and `IntroEntrance` still reaches exactly TWO ROUTES,
 * `/about` and `/work`. (This said "TWO consumers (`/about`'s units and
 * `/work`'s Projects section)" until 2026-08-25. Both halves moved that day:
 * `Projects` left `/work` in the restructure, and `Certifications.tsx` became a
 * THIRD call-site FILE on the same two routes. The number this page's argument
 * depends on is the ROUTE count, which is unchanged.)
 *
 * THE ROWS TAKING NO REVEAL IS A DECISION, NOT AN OVERSIGHT, and it was the
 * live question when they landed. The design brief specifies an entrance for
 * `/work`'s deck and specifies none here, and this page is the one place where
 * that asymmetry is right: four of the five rows are BELOW the fold at every
 * measured height, so a scroll reveal would fire on scroll like any other
 * list — but the top one or two would animate behind the Intro plate on a hard
 * load, which is precisely the bug `IntroEntrance` exists to repair, and
 * repairing it would mean adopting the whole hand-off mechanism for a
 * navigational index whose job is to be scannable the instant it is visible.
 * Static rows are also what keeps `docs/06_INTRO_AND_CHROME.md`'s
 * entrance-onset condition — "the routes that render an `IntroEntrance`" —
 * true without an edit. If a reveal is ever wanted here, all of that reverses
 * together: the wrapper, `IntroEntrance`'s route/consumer header AND its
 * enumeration-based "NO PATHNAME CHECK" argument, and that `docs/06` line.
 *
 * TOP CLEARANCE UNDER THE FIXED BAR IS A SIDE EFFECT OF THE SEAM, exactly as on
 * `/work`. The navbar is `position: fixed` and takes no space in flow, so the
 * only thing holding content out from under it is the section's `pt-2xl`
 * (89px). `/work` measured the bar at 48 / 64 / 59px across its three
 * breakpoint bands, leaving 41 / 25 / 30px of clear air; this page inherits the
 * same geometry and the same tightest band, 640-767px. RE-MEASURE HERE if
 * either the seam value or the bar's height ever changes — nothing will report
 * it.
 */

/**
 * `title` IS A LITERAL, and it is the one place on this page where that needs
 * saying. `/work`'s title reads `PROJECTS_HEADING` because that page's visible
 * heading is that constant; this page's heading is its own copy, ruled by Saad
 * on 2026-08-25 in favour of the spec's literal wording over the designer's
 * proposed "All Projects". Two pages one click apart are therefore both headed
 * Projects, and that consequence was accepted knowingly rather than discovered.
 *
 * NO `description` — the root layout's `SITE_DESCRIPTION` is inherited and is
 * still accurate here, exactly as `/work` and `/about` reason. A second one
 * would be new copy, and copy on this site comes from Saad.
 *
 * NO `openGraph`, WHICH IS WHY THERE IS NO `OG_IMAGE` SPREAD. `lib/metadata.ts`
 * states the rule: `openGraph` is resolved per segment and is NOT deep-merged
 * into the parent's, so ANY page that declares one must spread `OG_IMAGE` into
 * it. This page declares none, so it inherits the root's whole `openGraph`
 * object — image included — which is the correct and silent-failure-free
 * outcome. If a per-page `openGraph` is ever added here, that spread is
 * mandatory.
 */
export const metadata: Metadata = {
  title: "Index",
  alternates: { canonical: "/projects" },
};

/**
 * `Close`, and the destination is FIXED.
 *
 * §0.3 is explicit that this control is deliberately asymmetric with the detail
 * pages. Wherever the visitor came from — Home's button or `/work`'s — Close
 * here always goes to `/work`, and it is a `push` rather than a `back()`. The
 * stated consequence, which is the price of the asymmetry rather than a defect:
 * `/` then `/projects` then Close leaves `[/, /projects, /work]` in history, so
 * browser Back from `/work` returns to `/projects`.
 *
 * THE WORD IS RULED, NOT CHOSEN, and it knowingly breaks a rule stated
 * elsewhere. `components/sections/projectDetailContent.ts`'s `CLOSE_LABEL`
 * argues "an overlay closes; it does not navigate" — which is why the overlay
 * owns that word. Saad chose the spec's literal wording here anyway on
 * 2026-08-25, accepting that this is the one place on the site where "Close"
 * means a page-to-page navigation. It is a LOCAL constant and must not be
 * imported from that module: reusing the overlay's constant would drag a
 * comment that contradicts this use along with it.
 *
 * `STANDALONE_NAV` DRESSING, NOT THE BRUTAL SLAB. The slab in
 * `components/about/aboutButtonStyles.ts` is for ACTIONS; a close/back is
 * NAVIGATION, and the site already ships a shared atom for exactly that.
 * A slab here would make the loudest object on a quiet index page a back link.
 *
 * TWO INSTANCES, ABOVE THE HEADING AND BELOW THE LAST ROW, which is
 * `ProjectDetailFrame`'s established top-and-bottom pattern applied to a
 * second page. The second one arrived with the rows and not before: while the
 * page was a heading and an exit alone, two controls 34px apart would have
 * been a duplicated affordance rather than a convenience. With ~1,000px of
 * list between them, one control at the top is not enough — the detail page
 * already solved exactly this.
 *
 * BOTH READ "Close" AND BOTH GO TO `/work`. Two links with the same accessible
 * name and the same destination are correct here rather than ambiguous, and
 * that is the shipped precedent: `OverlayCloseButton` renders top and bottom
 * from one module, and the detail route's `All work` does the same.
 */
const CLOSE_LABEL = "Close";
const CLOSE_HREF = "/work";

export default function ProjectsPage() {
  return (
    <PageStack className="" fade>
      {/*
        Rule S-2's standard seam, byte-identical to Skills, Projects and
        Experience: 89 top + 89 bottom. No `sm:` variant.

        RULE S-1'S SECOND NAMED EXCEPTION, AND IT IS IN FORCE AS OF THIS CHANGE.
        There is no `mx-auto`, no `max-w-[1440px]` and no 21/55/89 spine on this
        page. Every block below takes the CHROME gutter instead — `px-md`
        (21px) below 640px, `px-lg` (34px) at 640 and above, the same two values
        `components/ui/Navbar.tsx` uses — because the strip rows' whole design
        is that they run edge to edge, and a spine-aligned heading above
        full-bleed rows would put two different leading edges on one page.
        `docs/03_FRONTEND_SPEC.md` carries the exception and its reasoning;
        the blockquote that used to hold the gap open ("what is actually on
        disk") was DELETED in this same change, and the mechanical
        `max-w-[1440px]` sweep reverted to twelve containers, because this file
        declares none any more. All three were required to move together.

        THE GUTTER IS REPEATED PER BLOCK RATHER THAN HOISTED ONTO THE SECTION,
        and that is forced by what is inside: the `<ul>` must NOT be inset, so
        a single padded wrapper around everything is not available. Three
        blocks carry `px-md sm:px-lg` — the two affordance rows here and the
        row's own inner div in `ProjectStripRow` — and they must stay in step.
      */}
      <section
        aria-labelledby="projects-index-heading"
        className="w-full bg-base pt-2xl pb-2xl"
      >
        {/*
          ═══ THE HEADER BAR — HEADING LEFT, EXIT RIGHT, ONE BASELINE ═══

          The top `Close` used to sit on its own line ABOVE the `<h1>`, which
          matched `ProjectDetailFrame`'s order and did not survive being looked
          at: a bare teal word alone above the heading reads as a stray label
          rather than an exit, and it takes the first fixation on the page away
          from the thing the page is called. It now shares the heading's
          baseline at the far edge, which is what an exit control looks like.

          BOTH EXITS ARE KEPT. `docs/07` has two `Close` affordances on this
          route deliberately, top and bottom, both to `/work`; this moves one,
          it does not remove it.

          IT STACKS AGAIN BELOW `sm`. At 360px the heading and a 12px mono word
          on one line leaves the heading no measure, so the flex row is gated to
          `sm:` and below it the two simply stack — heading first, exit under
          it, which is the order that reads when there is no room to pair them.

          `items-baseline` AND NOT `items-center`: the exit is a 12px mono word
          against a 68px heading, and centring it against that cap height floats
          it in the middle of nothing. The same argument the numeral's
          `lg:items-baseline` makes one file over.

          RIGHT-ALIGNING IT DOES NOT BREAK RULE S-1'S EXCEPTION. That rule is
          about the page having ONE LEADING edge — every block starting at the
          same `px-md sm:px-lg` chrome gutter — and this block still does. The
          exit is aligned to the trailing edge of the same inset, which is the
          gutter's other side, not a second spine.
        */}
        <div className="px-md sm:px-lg">
          {/* A VISIBLE `<h1>`, unlike `/work`'s `sr-only` one. The rows below
              are `<h2>`s, so this `<h1>` is the outline's root and nothing sits
              between it and them.

              ═══ IT SAYS "Index", NOT "Projects", AND THAT IS AN IA FIX ═══

              `/work`'s `<h1>` is "Projects." and this page's was "Projects" —
              two routes, near-identical headings, separated by a full stop, and
              nothing on either page telling you which one you were on. Both
              render the same five projects, so the heading was the only thing
              that could distinguish them and it did not.

              "Index" names what is different: this is the same five, enumerated
              and comparable, with numerals and dates. `metadata.title` moved
              with it, so the tab reads "Index — Saad" rather than a second
              "Projects — Saad" competing with `/work`'s in a bookmark list.

              THE NAVBAR IS UNAFFECTED — it has never linked here (`WORK` shows
              active on this route via `ROUTE_GROUP`), and the only inbound
              control is `/work`'s "Browse All".

              THAT LABEL USED TO CARRY HALF OF THIS ARGUMENT AND NO LONGER
              DOES. It read "Browse as a list" until 2026-08-27, which described
              this page's affordance rather than naming it — so the control and
              the heading were saying two different, complementary things.
              "Browse All" names a SET, which is the same job the heading does.
              The distinction now rests on the heading alone: "Index" against
              `/work`'s "Projects.". That is still enough — it is the visible
              text on the page a visitor is standing on — but it is one signal
              where there were two, so do not weaken the heading as well. */}
          <div className="sm:flex sm:items-baseline sm:justify-between sm:gap-lg">
            <h1 id="projects-index-heading" className="text-h2 text-fg">
              Index
            </h1>
            {/* NOT WRAPPED IN A `Reveal`, matching the detail route's back
                links and for the reason recorded there: this is one of the
                page's two escape hatches, and a navigation exit that fades in
                is worse than one that is simply there. */}
            <Link
              href={CLOSE_HREF}
              className={`${STANDALONE_NAV} mt-lg block sm:mt-0`}
            >
              {CLOSE_LABEL}
            </Link>
          </div>
        </div>

        {/*
          A REAL `<ul>`, so the five rows are announced as "list, 5 items" —
          the same structure `Projects.tsx` ships for the card gallery. The
          `<li>`s are full-bleed and carry their own dividers; the list itself
          has no padding, no border and no background, which is what lets the
          rules touch both viewport edges.

          `mt-2xl` (89px) UNDER THE HEADING. That is Rule S-2's seam value used
          as a within-section step, matching the distance the design brief
          asks for between the heading block and the list.
        */}
        <ul className="mt-2xl">
          {projects.map((project, index) => (
            <ProjectStripRow
              key={project.slug}
              index={index}
              slug={project.slug}
              title={project.title}
              coverImage={project.coverImage}
              date={project.date}
            />
          ))}
        </ul>

        {/*
          THE SECOND EXIT. `mt-2xl` below `lg` and `mt-3xl` (144px) at `lg`+:
          at desktop widths the last row is a 144px band with a cover in it,
          and 89px of air under it is not enough to stop a 12px mono word
          reading as part of that band. Below `lg` the rows are shorter and the
          89px step is already a clear break.
        */}
        <div className="mt-2xl px-md sm:px-lg lg:mt-3xl">
          <Link href={CLOSE_HREF} className={STANDALONE_NAV}>
            {CLOSE_LABEL}
          </Link>
        </div>
      </section>
    </PageStack>
  );
}
