import { notFound } from "next/navigation";

import { OverlayCloseButton } from "@/components/sections/OverlayCloseButton";
import { ProjectDetailFrame } from "@/components/sections/ProjectDetailFrame";
import { ProjectOverlay } from "@/components/sections/ProjectOverlay";
import { getProjectBySlug, projectSlugs } from "@/content/projects";

/**
 * The intercepting route — Ticket 6b.
 *
 * `(site)` is a route group and contributes no URL segment, so this file sits
 * at segment level `/`, the same level as the pages. `(.)` means "intercept a
 * route at my own level", so `(.)projects/[slug]` intercepts
 * `/projects/[slug]`. `app/(site)/layout.tsx` receives the `@modal` slot and
 * renders it; `@modal/default.tsx` returns `null` for every path where this
 * does not match.
 *
 * `(chrome)` IS ALSO A ROUTE GROUP AND ALSO CONTRIBUTES NO SEGMENT, so the
 * pages moving into `app/(site)/(chrome)/` did not move off level `/` and this
 * still intercepts both of them. That is the assertion to distrust: routing
 * failures here are silent, so it is verified by CLICKING A CARD, never by
 * typing the URL — a typed URL is a hard load, which by design never intercepts
 * and therefore proves nothing either way.
 *
 * INTERCEPTION APPLIES TO CLIENT NAVIGATIONS ONLY. That is the whole design:
 *   - Click a card on `/` OR ON `/work` → the URL becomes `/projects/<slug>`,
 *     this renders as an overlay, and the page you came from stays mounted
 *     behind it (which is what gives the morph something to morph FROM). For
 *     CCN and SNA that page WAS `/work` and only `/work` until 2026-08-25;
 *     `/projects` now lists all five, so they are reachable from two
 *     surfaces like every other project. They remain archive-only
 *     and Home does not link to them, so this path is the ONLY way either of
 *     them is ever seen as an overlay.
 *   - Refresh, or open a shared link, at that URL → no interception, the real
 *     route at `app/(site)/projects/[slug]/page.tsx` renders, fully
 *     prerendered, with real metadata and `All work` back links.
 * `ProjectCard`'s `<Link href={`/projects/${slug}`}>` is UNCHANGED and knows
 * nothing about any of this. Interception is a routing concern; that is why the
 * pre-6b state had zero sunk cost.
 *
 * THIS FILE IS A SERVER COMPONENT AND MUST STAY ONE. It renders
 * `<ProjectDetailFrame>` — also a server component — and passes it to
 * `<ProjectOverlay>` (client) as `children`. If the overlay rendered the frame
 * itself, the frame and therefore `<ProjectDetail>` and therefore SNA's
 * ~1,400-character description would all cross into the client bundle.
 * `ProjectDetail.tsx` names that outcome as the thing that must not happen.
 *
 * NO `generateMetadata` HERE, DELIBERATELY. An intercepted view is a client
 * navigation and the document title is owned by the real route's payload;
 * generating metadata here would be a second source of truth for the same
 * string. Accepted consequence: the tab title while the overlay is open is
 * whatever Next resolves for `/projects/<slug>`.
 *
 * NOTHING VISUAL IS DECIDED HERE. No inset, no offset, no width, no padding.
 * All of it is `ProjectDetailFrame`, which the real route renders too — that is
 * the C3 fix, and hard-coding an overlay inset here is precisely the silent
 * desynchronisation `docs/04_FEATURE_TICKETS.md` warned against.
 */

/**
 * MIRRORS THE REAL ROUTE'S GUARDS, and not for symmetry's sake.
 *
 * With `dynamicParams = false`, an unknown slug arriving here simply DOES NOT
 * MATCH this route, so the navigation falls through to the real route, which
 * 404s at the routing layer and serves the fully server-rendered themed
 * `app/not-found.tsx`. That is the best available failure mode and it costs
 * nothing.
 *
 * WITHOUT it, an unknown slug would render this interception dynamically, call
 * `notFound()` inside a parallel slot, and resolve to the nearest `not-found`
 * boundary — a 404 rendered BESIDE a still-visible `/` or `/work`. Incoherent.
 *
 * `notFound()` below is still not redundant: it is what narrows `project` to
 * `Project` for the JSX, and it is the guard for a slug deleted from
 * `content/projects.ts` while a link to it survives.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return projectSlugs.map((slug) => ({ slug }));
}

export default async function InterceptedProjectPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;

  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <ProjectOverlay>
      {/*
        `as="div"` — the overlay must NOT render a second `<main>`. The
        homepage behind it already has one, and nesting landmarks is invalid in
        a way nothing on this project would catch. The frame has no default for
        `as` precisely so this decision is made in the open, once per call site.

        `affordance` is the close button where the real route passes its `All
        work` link. Same slot, same atom, same computed line box — which is what
        keeps the cover at the same y on both paths.
      */}
      <ProjectDetailFrame
        as="div"
        project={project}
        affordance={<OverlayCloseButton />}
      />
    </ProjectOverlay>
  );
}
