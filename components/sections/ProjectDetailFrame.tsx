import type { ReactNode } from "react";

import { ProjectDetail } from "@/components/sections/ProjectDetail";
import {
  THEME_TOGGLE_ON_BASE,
  ThemeToggle,
} from "@/components/ui/ThemeToggle";
import type { Project } from "@/content/types";

/**
 * The detail page's frame — everything above and below `<ProjectDetail>`.
 * Ticket 6b, Tier 3. A SERVER COMPONENT, and it must stay one.
 *
 * ------------------------------------------------------------------------
 * WHY IT EXISTS: TWO RENDERING PATHS, ONE GEOMETRY.
 * ------------------------------------------------------------------------
 * Ticket 6b gives `/projects/<slug>` two ways to appear — the real route on a
 * refresh or a shared link, and an intercepted overlay on a click from the
 * gallery. `docs/04_FEATURE_TICKETS.md` recorded the hazard before the overlay
 * existed: `<ProjectDetail>` owns the site container, so the cover's x and
 * width travel with it, but `<main>`'s padding, the top row and its `mb-lg`
 * lived in the ROUTE file. That put the cover's top 106px (below 1024px) to
 * 140px (at and above it) beneath `<main>` on the route and at zero in an
 * overlay — the same project, at the same URL, at two different y positions
 * depending on how you arrived.
 *
 * The fix `docs/04` asked for is structural rather than compensatory: "do not
 * hard-code an overlay top inset — it desynchronises silently the day anyone
 * edits `pt-xl` or `mb-lg` in the route file." So the padding, the container,
 * the top row and the bottom row moved HERE, and both paths render this
 * component. There is no inset to keep in sync because there is no inset:
 * editing `pt-xl` below moves the route and the overlay in the same keystroke.
 *
 * IF YOU ARE ABOUT TO ADD VERTICAL CHROME TO THE DETAIL PAGE, IT GOES IN THIS
 * FILE. Adding it to `app/(site)/projects/[slug]/page.tsx` reintroduces the
 * exact defect this component was created to remove, and nothing — not tsc,
 * not lint, not the build — will tell you.
 *
 * ------------------------------------------------------------------------
 * `as` IS REQUIRED AND HAS NO DEFAULT.
 * ------------------------------------------------------------------------
 * `<main>` on the route, `<div>` in the overlay. The same reasoning
 * `ThemeToggle` and `ExternalLink` both spell out for their own required
 * `className`: a default does the wrong thing SILENTLY. Here "silently wrong"
 * means a second `<main>` landmark nested inside the homepage's `<main>` while
 * the overlay is open — invalid, and invisible to every check this project
 * runs. Making the caller state it means the decision is made once per call
 * site, in the open.
 *
 * ------------------------------------------------------------------------
 * `affordance` IS A `ReactNode`, NOT A `variant: "route" | "overlay"` STRING.
 * ------------------------------------------------------------------------
 * A variant string would put the branch inside this file, and the overlay's
 * branch is a `router.back()` call — which needs `"use client"`, which would
 * drag this component, and therefore `<ProjectDetail>`, and therefore SNA's
 * ~1,400-character description, into the client bundle.
 * `ProjectDetail.tsx`'s header names that outcome as the thing that must not
 * happen. As a `ReactNode` the caller owns the control and this file stays a
 * server component; only the overlay's close button is client code.
 *
 * ------------------------------------------------------------------------
 * `breadcrumb` IS A SECOND, OPTIONAL SLOT — AND IT IS ROUTE-ONLY.
 * ------------------------------------------------------------------------
 * Added 2026-08-25 for the projects-architecture spec's §4. When it is
 * supplied it REPLACES `affordance` in the top row; it never adds a row, and
 * `n` in the `justify-between` below stays fixed at two. The overlay passes
 * nothing and is unaffected in structure.
 *
 * It is a separate prop rather than a different `affordance` value because the
 * two slots stopped being interchangeable: the route's top row is now a
 * breadcrumb and its foot is still `All work`, so "both instances are
 * identical by construction" is true of `affordance` — which is still rendered
 * as the same node wherever it appears — and not of the top row as a whole.
 *
 * WHY THE FRAME OWNS IT AND NOT THE ROUTE FILE: the breadcrumb is vertical
 * chrome, and vertical chrome added outside this file is the 106/140px
 * route-vs-overlay offset this component exists to remove. The route supplies
 * the NODE (so this file needs no `variant` string and stays a server
 * component with no branch); this file decides WHERE it sits and what height
 * the row reserves for it.
 *
 * ------------------------------------------------------------------------
 * `affordance` IS RENDERED TWICE ON THE OVERLAY PATH AND ONCE ON THE ROUTE.
 * ------------------------------------------------------------------------
 * (It was twice on both until the breadcrumb landed.) The route's own header
 * explains why the affordance appears twice at
 * all: a shared-link visitor has no back history, and CCN and SNA would
 * otherwise end on a truncated `Built with` block. It used to cite "no site
 * nav" as a third reason — the navbar is site chrome now, so that clause is
 * gone, but it never carried the argument and the behaviour is unchanged.
 * These pages still get no navbar: they sit outside the `(chrome)` route
 * group, deliberately, because this file owns their top strip.
 *
 * DO NOT PASS AN `affordance` NODE THAT NEEDS A UNIQUE `key`, AN `autoFocus`,
 * OR ANY OTHER ONCE-PER-DOCUMENT ATTRIBUTE. Its instances are identical by
 * construction, so a "top instance only" attribute cannot be expressed here —
 * and note this is a statement about `affordance` alone: `breadcrumb` renders
 * exactly once, so the restriction does not reach it. See
 * `ProjectOverlay.tsx`, which records why its close button therefore has no
 * `autoFocus` and relies on `showModal()`'s own initial-focus rule instead.
 *
 * TIER 3 MOTION BUDGET IS UNCHANGED BY THIS FILE: it animates nothing, imports
 * no `motion`, and adds no hover state. The morph lives on the cover
 * (`CoverFrame`) and the fade on the overlay surface (`ProjectOverlay`).
 */

/**
 * The site container — Rule S-1's spine, byte-identical to About, Skills,
 * Projects, Contact, `app/not-found.tsx`, `app/error.tsx` and
 * `<ProjectDetail>`'s own `<article>`. Both affordances therefore sit on the
 * same left edge as the cover, the `<h1>` and every block below.
 *
 * NOT EXPORTED. The route file used to hold its own copy of this string; it no
 * longer needs one, because it no longer renders anything at page level. If a
 * future surface needs the spine, it copies the literal like every other
 * section does — this is not the site's container abstraction and must not
 * quietly become one.
 */
const CONTAINER = "mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl";

export type ProjectDetailFrameProps = {
  project: Project;
  /** `"main"` on the real route, `"div"` inside the overlay. No default. */
  as: "main" | "div";
  /**
   * The exit control. Rendered at the foot always, and in the top row too
   * unless `breadcrumb` takes that slot.
   */
  affordance: ReactNode;
  /**
   * OPTIONAL, AND SUPPLIED BY THE STANDALONE ROUTE ONLY. Replaces
   * `affordance` in the top row. The overlay omits it — see the header.
   */
  breadcrumb?: ReactNode;
};

export function ProjectDetailFrame({
  project,
  as,
  affordance,
  breadcrumb,
}: ProjectDetailFrameProps) {
  const Root = as;

  return (
    // `select-text` IS THE LARGEST OF THE SITE'S SELECTION EXCEPTIONS — the
    // only one that covers a whole surface rather than one block — and it is
    // here rather than on either consumer BECAUSE this component is the one
    // thing both detail surfaces share. It was the ONLY exception for a few
    // hours on 2026-08-28; `docs/03`'s selection section now carries the full
    // list and is the register to update when one is added. <body> in `app/layout.tsx` carries
    // `select-none` for the whole site — Saad, 2026-08-28, wanted the deck and
    // the strip rows to stop painting selection blue under a browse gesture —
    // and this one line puts it back where reading actually happens.
    //
    // ONE LINE, TWO SURFACES, WHICH IS THE WHOLE REASON THIS FILE EXISTS. The
    // standalone /projects/<slug> route and the intercepted overlay both render
    // this component, so they cannot drift on selection any more than they can
    // on the 106/140px cover offset above. Putting `select-text` on
    // `ProjectDetail`'s <article> instead would have covered the prose but NOT
    // the breadcrumb, the top row or the foot affordance, and putting it on the
    // route and the dialog separately would have been two places to forget.
    //
    // IT COVERS THE AFFORDANCES DELIBERATELY, not incidentally: the exit
    // controls are the only text on this surface a reader might sweep past on
    // the way to a link, and an island of unselectable text inside a selectable
    // page reads as a rendering fault rather than as a policy.
    //
    // INHERITANCE REACHES THE OVERLAY EVEN THOUGH IT IS IN THE TOP LAYER. A
    // modal <dialog> is promoted for PAINT; inherited properties still come
    // from its DOM parent, so `select-none` reaches it from <body> and this
    // undoes it. Verified in a browser on both paths, not reasoned about.
    //
    // `pt-xl pb-2xl lg:pt-2xl` — moved verbatim from the route's <main>.
    // These three values, plus `mb-lg` on the row below, ARE the 106/140px the
    // cover sits below the top of this element. Changing any of them changes
    // both rendering paths at once, which is the entire point.
    <Root className="w-full bg-base pt-xl pb-2xl select-text lg:pt-2xl">
      {/*
        THE TOP ROW CARRIES TWO THINGS: the exit affordance on the spine, and
        this surface's single theme toggle at the mirrored right inset.
        `justify-between` is safe here specifically because n is FIXED AT TWO —
        the reveal footer's link row (the old `Contact.tsx`) bans it for a list
        whose length can change, which this is not. `breadcrumb` does not change
        that count: it REPLACES the affordance in this row rather than joining
        it.

        `gap-sm` (13px) IS NEW AND IT IS NOT COSMETIC. This row used to record
        that "at 360px both are 12px mono inside a 318px content box; they
        cannot collide" — true of a five-character `Close`, and no longer true
        of a breadcrumb, which is a flex item whose text fills whatever width is
        left and therefore ends flush against the toggle. 13px is the site's
        tightest real gap and it is the second line's own wrap allowance.
        ON THE OVERLAY PATH IT RENDERS NOTHING: `Close` (40.8px) plus the toggle
        (40.8px) leaves ~236px of free space at 360px, and `justify-between`
        distributes free space that is already far larger than the gap. That is
        why `gap-sm` SURVIVED the removal of the `min-h` it shipped beside (see
        below): the ruling was "leave the overlay untouched", and a gap that
        computes to nothing there leaves it untouched in every rendered pixel.
        The class attribute differs; the layout does not.

        THERE IS NO `min-h` HERE, AND ITS ABSENCE IS A RULING RATHER THAN AN
        OVERSIGHT. DO NOT "FIX" THIS BY ADDING ONE.

        The design brief (§F.4) specified `min-h-[34px]` on this row — two
        `text-caption` line boxes, 12px × 1.4 = 16.8, ×2 = 33.6, reserved as 34
        — to close a Rule S-3 seam: below 482px the route's breadcrumb wraps to
        two lines while the overlay's single `Close` stays on one, so the cover
        sits 16.8px lower on the route than in the overlay. It was built that
        way, measured, and then REMOVED on Saad's call, 2026-08-25.

        WHAT THE MEASUREMENT SHOWED, AND WHY IT CHANGED THE ANSWER. Reserving
        the height equalises the paths at every width, but it does so by
        charging the OVERLAY 17.2px of extra whitespace above the cover — also
        at every width. The overlay is the path essentially every visitor takes
        (every in-app click into a project is intercepted); the standalone route
        renders only on a hard load or a shared link. So the fix spent a
        permanent, universal cost on the primary path to remove a mismatch that
        exists only below 482px, and only between two renders a single visitor
        is unlikely to see back to back.

        Saad's ruling: leave the overlay untouched. The residual is declared
        rather than hidden — **below 482px the standalone route's cover sits
        16.8px lower than the overlay's.** Above 482px the breadcrumb does not
        wrap and the two paths are already identical, so there is nothing to
        equalise there.

        IF A FUTURE PROJECT TITLE FORCES A THIRD LINE the residual grows to
        33.6px rather than staying at 16.8. `ProjectBreadcrumb` carries the
        arithmetic and states the character ceiling; that ceiling is now load
        bearing for this note, not just for the reserved height it used to
        guard.

        IMPORTING A CLIENT COMPONENT DOES NOT MAKE THIS A CLIENT COMPONENT.
        This file, `ProjectDetail` and everything below stay server-rendered;
        `ThemeToggle` is a leaf, and so is whatever the caller passes as
        `affordance`.

        ONE TOGGLE PER SURFACE — the bottom row deliberately does not get a
        second one. A second control for a preference already set is not a
        convenience. NOTE FOR THE OVERLAY PATH: this renders a second
        `<ThemeToggle>` on screen while the homepage's own toggle still exists
        behind the dialog. That is safe only because a modal `<dialog>` inerts
        the background — the instances behind it leave the tab order and the
        accessibility tree. It is a real dependency on `showModal()` rather
        than on an `open` attribute, and `ProjectOverlay` records it.
      */}
      <div
        className={`${CONTAINER} mb-lg flex items-center justify-between gap-sm`}
      >
        {breadcrumb ?? affordance}
        <ThemeToggle className={THEME_TOGGLE_ON_BASE} />
      </div>

      <ProjectDetail project={project} />

      <div className={`${CONTAINER} mt-2xl lg:mt-3xl`}>{affordance}</div>
    </Root>
  );
}

export default ProjectDetailFrame;
