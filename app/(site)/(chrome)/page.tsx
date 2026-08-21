import { Hero } from "@/components/hero/Hero";
import { Trajectory } from "@/components/sections/Trajectory";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { Contact } from "@/components/sections/Contact";
import { featuredProjects } from "@/content/projects";

export default function Page() {
  return (
    // A FRAGMENT, so `<Contact />` can render its `<footer>` as a SIBLING of
    // `<main>` rather than a child. That placement is the whole point: a
    // `<footer>` whose nearest ancestor is `<body>` is the `contentinfo`
    // landmark, which is where a screen-reader user goes looking for contact
    // details. Nested inside `<main>` it is scoped to `<main>` and is not a
    // landmark at all — nothing errors, nothing looks different, and the
    // benefit silently evaporates.
    //
    // `<body>` is `flex min-h-full flex-col` (app/layout.tsx). Two flex
    // children is safe: neither has `grow`, so both size to content. Do NOT add
    // `grow` to `<main>` to "pin the footer" — the hero alone is 100dvh, so the
    // page is never short and there is nothing to pin.
    //
    // THE NAVBAR IS NOT HERE ANY MORE. It moved up one level into
    // `app/(site)/(chrome)/layout.tsx` when WORK became a route, because a bar
    // that links to `/work` has to exist on `/work`. It still renders before
    // `<main>` and as a sibling of it, so it is still the `banner` landmark —
    // that layout's header carries the full reasoning, including why it is a
    // nested route group and not `app/(site)/layout.tsx`.
    <>
      <main>
        <Hero />
        <Trajectory />
        <Skills />
        {/* THREE CARDS — FOLIO, Aero-Grid, ClashChat, in that order, and the
            order is not written anywhere in this file. `featuredProjects` is
            `content/projects.ts`'s array filtered by a membership SET, so the
            sequence comes from the array and cannot drift from `/work`'s. If
            Home's three should appear differently, reorder the array; that
            reorders both pages, which is the right answer.

            CCN and SNA are archive-only and appear only on `/work`, which is
            therefore the ONLY route that links to their detail pages — and the
            only place their card -> overlay morph can be tested at all.

            `motion="scrub"` IS THIS PAGE'S DECISION AND IS REQUIRED — the same
            component on `/work` passes `"reveal"`. `docs/03_FRONTEND_SPEC.md`'s
            "Scroll-scrub — Home only" scopes the scrub to Home's Trajectory and
            Home's featured cards, so the page that knows which route it is says
            so. There is no default: omitting it is a compile error rather than
            a page that quietly animates like the wrong one.

            TRAJECTORY ABOVE NEEDS NO SUCH PROP because it renders on Home only
            and imports `ScrubReveal` directly. STACK BETWEEN THEM IS NOT
            SCRUBBED AND THAT IS THE DESIGN — it is Tier 3, it keeps `Reveal`,
            and it pops while its two neighbours track. That
            discrete-versus-continuous difference IS the tier boundary made
            visible. If it ever reads as broken rather than as quiet, the fix is
            dropping Stack's opacity leg, never scrubbing Stack. */}
        <Projects projects={featuredProjects} motion="scrub" />
        {/* EXPERIENCE AND CURRENTLY LEARNING LIVE ON `/work` NOW, per
            `docs/07_SITE_RESTRUCTURE.md` §5: they are "the complete record" and
            belong beside the full archive in the quiet readable tier, not in
            Home's curated narrative. Both components are unchanged and both
            moved in the same commit that created the page that renders them —
            removing them from here first would have made them unreachable. */}
      </main>
      {/* OUTSIDE `<main>`, deliberately — see the fragment comment above.
          Nothing comes after this: no copyright, no colophon. The panel's own
          bottom padding is the end of the document.

          IT ALSO APPEARS ON `/work` FOR NOW, which is temporary and known:
          Phase 5 absorbs this section into the reveal footer that both pages
          share. Same component in both places until then — not a copy. */}
      <Contact />
    </>
  );
}
