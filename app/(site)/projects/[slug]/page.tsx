import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/sections/ProjectDetail";
import { BACK_LINK_LABEL } from "@/components/sections/projectDetailContent";
import {
  ThemeToggle,
  THEME_TOGGLE_ON_BASE,
} from "@/components/ui/ThemeToggle";
import { getProjectBySlug, projectSlugs } from "@/content/projects";

/**
 * Project detail route — Ticket 7, Tier 3.
 *
 * THIS FILE OWNS THE PAGE FRAME AND NOTHING ELSE: `<main>`, the page
 * background, the page's vertical padding, both back links, this route's one
 * `<ThemeToggle>` (Ticket 11), `generateStaticParams`, `generateMetadata` and
 * `notFound()`. Everything below the top row is `<ProjectDetail>`, which owns
 * the site container and the content.
 *
 * THE BACK LINKS ARE DELIBERATELY OUTSIDE `<ProjectDetail>`. That is what
 * reconciles two contracts from the 6/6b split: "the detail's first visual
 * element is the cover image alone inside one wrapper" stays literally true,
 * and in Ticket 6b's overlay a "back to work" link would be wrong anyway — an
 * overlay closes, it does not navigate back, so 6b substitutes a close
 * affordance in the same slot. `<main>` living here is the other half of it:
 * 6b can render `<ProjectDetail>` inside a dialog without nesting a second
 * `<main>`. Do not move either inward.
 *
 * NO PART OF 6b IS BUILT HERE: no `layoutId`, no interception route, no
 * `@modal` slot, no overlay shell, no inert scaffolding.
 */

/**
 * All five detail pages are static at build time. `projectSlugs` already
 * exists in `content/projects.ts` and its comment names this ticket.
 *
 * `export const dynamicParams = false` was considered and REJECTED: it would
 * be a second gate answering the question `notFound()` already answers, and it
 * behaves differently in dev than in prod. One mechanism that works
 * identically everywhere is easier to trust.
 */
export function generateStaticParams() {
  return projectSlugs.map((slug) => ({ slug }));
}

/**
 * DESCRIPTION IS `oneLiner`, NOT `description`.
 *
 * Every `oneLiner` is Saad-authored, one sentence, accurate, specific and
 * 116-130 characters — inside the ~160 that renders in a search result.
 * Truncating the long `description` would produce a sentence Saad did not
 * write, which is the fabrication rule pointed at metadata. It is also the
 * only place `oneLiner` appears on this route: G2 removed the on-page deck
 * because it near-duplicates the opening of FOLIO's description.
 *
 * TITLE IS THE BARE PROJECT NAME. `app/layout.tsx` now carries
 * `template: "%s — Saad"`, so this composes to "FOLIO — Saad" without every
 * page having to write the suffix itself.
 *
 * Returning `{}` for an unknown slug is correct rather than lazy — the page
 * component below calls `notFound()` for the same slug, so no metadata is ever
 * rendered for it.
 *
 * NO `og:image` AND NO `alternates.canonical`. Both need `metadataBase` set to
 * the production origin, which is unknown until the deploy ticket. `og:image`
 * is missing site-wide and is now its own tracked ticket in
 * `docs/04_FEATURE_TICKETS.md` — it is a scheduled gap, not an oversight here.
 */
export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) return {};

  return {
    title: project.title,
    description: project.oneLiner,
  };
}

/**
 * The back affordance, rendered twice — top and bottom, identical atom.
 *
 * WHY TWICE. There is no `app/(site)/layout.tsx` and no site nav, so this link
 * and the browser Back button are the ONLY routes home — and a visitor
 * arriving from a shared URL (detail pages are the site's most shareable ones)
 * has no back history to the gallery at all. For that visitor a single link
 * 2,000px above the fold is not an exit. It is also the fix for the
 * truncated-ending problem: CCN and SNA end on `Built with`, a 12px mono label
 * over six short words, and a second `All work` gives all five pages the same
 * terminal element regardless of which data block ran last. The page then ends
 * because it has an ending, not because the record ran out.
 *
 * TWO LINKS WITH THE SAME ACCESSIBLE NAME AND THE SAME DESTINATION IS FINE. It
 * is not a WCAG failure and it is genuinely useful in a screen reader's links
 * list on a long page. Do NOT disambiguate them with a hidden suffix — a
 * hand-written accessible name that differs from the visible text is the drift
 * `ProjectCard` already rejected.
 *
 * NO ARROW GLYPH, no pill, no full-width bar, no "Next project ->" pairing, and
 * NO HORIZONTAL RULE above the bottom one: this site ships zero divider rules,
 * and a rule here would be the first, on the quietest page, to solve a problem
 * whitespace already solves. It is the same 12px mono word on the same left
 * edge, separated by 89/144px of nothing — a foot mark, not a widget.
 *
 * NO UNDERLINE, unlike the external links in `ProjectDetail`: this is a
 * standalone nav affordance rather than an inline one, and the accent plus
 * isolation already reads as a link. Add `underline underline-offset-4` only if
 * review finds it ambiguous.
 *
 * NEITHER IS WRAPPED IN A `Reveal`. The top one is above the fold and is the
 * page's only escape hatch; the bottom one is the same affordance. A
 * navigation exit that fades in is worse than one that is simply there — and
 * if the reveal ever failed, the page would have no exit at all.
 *
 * REJECTION CRITERION for the bottom link, to be measured and not assumed: drop
 * it if, at 1440x900, both back links are simultaneously visible in one
 * viewport on any of the five pages. CCN is the shortest page and the one to
 * measure.
 */
const BACK_LINK = `text-caption font-mono text-accent-working focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-working`;

/**
 * `/#work` is the gallery's anchor, and the id is derived from
 * `PROJECTS_HEADING` in `components/sections/projectsContent.ts`. That file
 * records that renaming "Work" is a three-file commit; this is the third file.
 */
const BACK_HREF = "/#work";

/** The site container, byte-identical to About / Skills / Projects and to
 *  `ProjectDetail`'s own `<article>` — Rule S-1's spine. The back links sit on
 *  the same left edge as the cover, the `<h1>` and every block below. */
const CONTAINER = "mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl";

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;

  /**
   * `getProjectBySlug` takes `slug: string`, NOT `ProjectSlug` —
   * `content/projects.ts` says so explicitly and says not to tighten it,
   * precisely so this call site can hand it an arbitrary URL string. After the
   * guard TypeScript narrows `project` to `Project`, which is what makes the
   * rest of this file type-safe with no non-null assertion. Do not write
   * `project!`, and do not render an empty shell for an unknown slug.
   */
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <main className="w-full bg-base pt-xl pb-2xl lg:pt-2xl">
      {/*
        THE TOP ROW CARRIES TWO THINGS AS OF TICKET 11: the back link on the
        spine, and this route's single theme toggle at the mirrored right inset.
        `justify-between` is safe here specifically because n is FIXED AT TWO —
        `Contact.tsx` bans it for a list whose length can change, which this is
        not. At 360px both are 12px mono inside a 318px content box; they cannot
        collide.

        IMPORTING A CLIENT COMPONENT DOES NOT MAKE THIS ROUTE A CLIENT
        COMPONENT. This file, `ProjectDetail` and everything below it stay
        server-rendered; `ThemeToggle` is the route's first client boundary and
        it is a leaf.

        THE BOTTOM BACK-LINK ROW IS UNCHANGED — one toggle per route. A second
        one at the foot would be a second control for a preference already set.
      */}
      <div className={`${CONTAINER} mb-lg flex items-center justify-between`}>
        <Link href={BACK_HREF} className={BACK_LINK}>
          {BACK_LINK_LABEL}
        </Link>
        <ThemeToggle className={THEME_TOGGLE_ON_BASE} />
      </div>

      <ProjectDetail project={project} />

      <div className={`${CONTAINER} mt-2xl lg:mt-3xl`}>
        <Link href={BACK_HREF} className={BACK_LINK}>
          {BACK_LINK_LABEL}
        </Link>
      </div>
    </main>
  );
}
