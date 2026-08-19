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
 * IT IS RENDERED TWICE, top and bottom, and the two instances are the same
 * node. The route's own header explains why the affordance appears twice at
 * all (no site nav, a shared-link visitor has no back history, and CCN and SNA
 * would otherwise end on a truncated `Built with` block). That reasoning is
 * unchanged; only its home moved.
 *
 * DO NOT PASS A NODE THAT NEEDS A UNIQUE `key`, AN `autoFocus`, OR ANY OTHER
 * ONCE-PER-DOCUMENT ATTRIBUTE. Both instances are identical by construction,
 * so a "top instance only" attribute cannot be expressed here — see
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
  /** The exit control, rendered above the cover and again at the foot. */
  affordance: ReactNode;
};

export function ProjectDetailFrame({
  project,
  as,
  affordance,
}: ProjectDetailFrameProps) {
  const Root = as;

  return (
    // `pt-xl pb-2xl lg:pt-2xl` — moved verbatim from the route's `<main>`.
    // These three values, plus `mb-lg` on the row below, ARE the 106/140px the
    // cover sits below the top of this element. Changing any of them changes
    // both rendering paths at once, which is the entire point.
    <Root className="w-full bg-base pt-xl pb-2xl lg:pt-2xl">
      {/*
        THE TOP ROW CARRIES TWO THINGS: the exit affordance on the spine, and
        this surface's single theme toggle at the mirrored right inset.
        `justify-between` is safe here specifically because n is FIXED AT TWO —
        `Contact.tsx` bans it for a list whose length can change, which this is
        not. At 360px both are 12px mono inside a 318px content box; they
        cannot collide.

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
      <div className={`${CONTAINER} mb-lg flex items-center justify-between`}>
        {affordance}
        <ThemeToggle className={THEME_TOGGLE_ON_BASE} />
      </div>

      <ProjectDetail project={project} />

      <div className={`${CONTAINER} mt-2xl lg:mt-3xl`}>{affordance}</div>
    </Root>
  );
}

export default ProjectDetailFrame;
