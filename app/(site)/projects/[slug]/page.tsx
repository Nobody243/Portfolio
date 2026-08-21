import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectDetailFrame } from "@/components/sections/ProjectDetailFrame";
import { BACK_LINK_LABEL } from "@/components/sections/projectDetailContent";
import { STANDALONE_NAV } from "@/components/ui/standaloneNav";
import { OG_IMAGE } from "@/lib/metadata";
import { getProjectBySlug, projectSlugs } from "@/content/projects";

/**
 * Project detail route — Ticket 7, Tier 3. Rewired by Ticket 6b.
 *
 * THIS FILE NOW OWNS THE ROUTING CONTRACT AND NOTHING VISUAL:
 * `dynamicParams`, `generateStaticParams`, `generateMetadata`, the
 * `getProjectBySlug`/`notFound()` guard, the back link's destination, and the
 * decision that this path renders as `<main>`. Every pixel — the page
 * background, the vertical padding, the top row, the theme toggle, the two
 * affordance slots and `<ProjectDetail>` itself — is
 * `components/sections/ProjectDetailFrame.tsx`.
 *
 * IT USED TO OWN THE FRAME, AND THAT IS THE CHANGE 6b MADE. The frame moved
 * out because `/projects/<slug>` now has TWO rendering paths — this route, and
 * the intercepted overlay at `app/(site)/@modal/(.)projects/[slug]/page.tsx` —
 * and the cover has to land at the same y position in both. Keeping the
 * padding here and compensating for it there is the silent desynchronisation
 * `docs/04_FEATURE_TICKETS.md` warned against by name. ADDING VERTICAL CHROME
 * BACK INTO THIS FILE REINTRODUCES THAT DEFECT; it goes in the frame.
 *
 * THE BACK LINK IS STILL DELIBERATELY OUTSIDE `<ProjectDetail>`, and now it is
 * outside the frame too — it is passed IN as `affordance`. That is what
 * reconciles the two contracts from the 6/6b split: "the detail's first visual
 * element is the cover image alone inside one wrapper" stays literally true,
 * and the overlay passes a Close button into the same slot, because an overlay
 * closes rather than navigating back. `<main>` is likewise a prop rather than
 * markup, so the overlay renders the same frame as a `<div>` without nesting a
 * second landmark.
 *
 * WHAT 6b BUILT, so this header stays checkable: the `@modal` parallel slot
 * and its interception route, `ProjectDetailFrame`, `ProjectOverlay`,
 * `CoverFrame`, and the `layoutId` pair on the card and the cover. What it did
 * NOT build: any scrim, radius, shadow or backdrop-blur token; any second copy
 * of the page's content; any change to this route's static prerendering.
 */

/**
 * All five detail pages are static at build time. `projectSlugs` already
 * exists in `content/projects.ts` and its comment names this ticket.
 *
 * `export const dynamicParams = false` was originally REJECTED here as "a
 * second gate answering the question `notFound()` already answers". THAT WAS
 * WRONG, corrected 2026-08-19 after Ticket 18 measured the difference:
 *
 *   - WITHOUT it, an unknown slug renders this route dynamically and calls
 *     notFound(). Next 16 answers 404 but serves `<html id="__next_error__">`
 *     with an EMPTY <body>, painting only on hydration. With JS blocked,
 *     /projects/<unknown> is a blank white page.
 *   - WITH it, the routing layer 404s before this component runs and the
 *     themed not-found page is fully server-rendered.
 *
 * All five slugs are known at build time and there is no dynamic project
 * source, so nothing is lost by closing the route. The dev-vs-prod difference
 * the old note cited is real but minor beside shipping a blank page.
 *
 * `notFound()` STAYS below. It is not redundant — it is what makes the type
 * narrowing honest, and it is the guard if a slug is removed from
 * content/projects.ts while a link to it survives.
 */
export const dynamicParams = false;

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
 * `og:image` AND `alternates.canonical` ARE NOW BOTH RESOLVED (Ticket 17).
 * Both were blocked on `metadataBase`, which had no correct value until the
 * site had a production origin; it is now set in `app/layout.tsx`.
 *
 * The image IS named here, in `openGraph.images`, and has to be: a segment
 * that declares `openGraph` replaces the root's rather than merging into it.
 * See `lib/metadata.ts`.
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
    // Relative, resolved against `metadataBase`. Hard-coding the origin here
    // would mean two places to change if the domain ever moves.
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      // `article` rather than the root's `website`: this is one dated piece of
      // work, not the site itself.
      type: "article",
      // Both are repeated from the fields above rather than left to fall
      // through. Next resolves `openGraph` per segment, so a partial object
      // here is not merged into the root's — anything this page needs in its
      // preview card, this page states.
      title: project.title,
      description: project.oneLiner,
      siteName: "Muhammad Saad",
      locale: "en_US",
      url: `/projects/${slug}`,
      // REQUIRED, not redundant. `openGraph` is resolved per segment and is not
      // merged into the root's, so declaring the object above without this line
      // strips the image from exactly these five pages — the most shareable
      // URLs on the site — while every other route keeps it. That was the
      // measured behaviour before this line existed.
      images: [OG_IMAGE],
    },
  };
}

/**
 * The back affordance. It is passed to `ProjectDetailFrame` as `affordance`
 * and the frame renders it TWICE — top and bottom, the same node both times.
 *
 * WHY TWICE. THE SHARED-URL VISITOR IS THE WHOLE ARGUMENT, and it is the half
 * that survived. The original reasoning also cited "there is no
 * `app/(site)/layout.tsx` and no site nav": the first clause went stale in
 * Ticket 6b, which had to create that layout to receive the `@modal` slot, and
 * the second went stale when the navbar became site chrome. Neither is load
 * bearing, because the navbar still does NOT render on `/projects/<slug>` —
 * these pages are Tier 3 and `ProjectDetailFrame` owns the top strip.
 *
 * So this link and the browser Back button remain the ONLY routes out — and a
 * visitor arriving from a shared URL (detail pages are the site's most
 * shareable ones) has no back history to the gallery at all. For that visitor
 * a single link 2,000px above the fold is not an exit. It is also the fix for the
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
 * review finds it ambiguous. The class string itself is now `STANDALONE_NAV`
 * in `components/ui/standaloneNav.ts` — Ticket 6b's overlay close button was
 * the fourth consumer of the atom, which is the trigger `app/not-found.tsx`
 * had written down. The computed styles are unchanged; the three shipped
 * copies were verified byte-identical before any was deleted.
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
/**
 * `/work` — the archive page, not `/#work` on Home any more.
 *
 * THIS IS A CORRECTNESS FIX, NOT A TIDY-UP. Home is about to carry three
 * featured projects; CCN and SNA are archive-only. `/#work` would send a
 * visitor who was reading the CCN detail page to a gallery that provably does
 * not contain CCN — the one link on the page whose entire job is "take me back
 * to where this came from", landing them somewhere it demonstrably did not come
 * from. `/work` holds all five and always will.
 *
 * The label above it is still `BACK_LINK_LABEL` ("All work"), which now says
 * exactly what the href does.
 */
const BACK_HREF = "/work";

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
    // `as="main"` IS REQUIRED AND IS THIS FILE'S CALL TO MAKE. The frame has no
    // default for it on purpose: the overlay path passes `"div"`, and a default
    // either way would silently nest or silently drop a landmark. This is the
    // path that owns the page's `<main>`.
    <ProjectDetailFrame
      as="main"
      project={project}
      affordance={
        <Link href={BACK_HREF} className={STANDALONE_NAV}>
          {BACK_LINK_LABEL}
        </Link>
      }
    />
  );
}
