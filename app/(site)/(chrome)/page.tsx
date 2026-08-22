import { Hero } from "@/components/hero/Hero";
import { Trajectory } from "@/components/sections/Trajectory";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { RevealFooter } from "@/components/sections/RevealFooter";
import { featuredProjects } from "@/content/projects";

export default function Page() {
  return (
    // A FRAGMENT, so `<RevealFooter />` can render its `<footer>` as a SIBLING of
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
      {/*
        THE PAGE STACK, AND THE TWO CLASSES THAT KEEP THE CURTAIN HIDDEN.

        `bg-base` AND `relative z-10` ARE BOTH LOAD-BEARING. Rule S-6 in
        `docs/03_FRONTEND_SPEC.md` states them; this is the enforcement point.

        `<RevealFooter />` below is `md:sticky md:bottom-0`, so from the first
        painted frame its #07090C plate is pinned at the bottom of the viewport
        BEHIND this element, waiting. The only thing hiding it is this
        background. Inheriting the page background is NOT enough and that is the
        trap: a background on `<html>`/`<body>` PROPAGATES TO THE CANVAS, which
        paints below every positioned descendant — including the footer. Drop
        either class and the plate is visible through every section of the page
        at every scroll position.

        `relative z-10` also makes this a stacking context, and that is
        contained: `HeroHeadline`'s `z-10` is scoped inside the hero, and the
        Navbar (z-40), Intro (z-50) and AssetLoader (z-[60]) are all outside
        `<main>` and stay above it. Rule S-4's project overlay is a modal
        `<dialog>` opened with `showModal()`, so it renders in the TOP LAYER and
        is above every z-index on the page — but ONLY because of `showModal()`.
        Opened without it, it would fall behind this stack.

        NO `min-h-[calc(100dvh-…)]` HERE, EVER. That is the reflexive fix for a
        short page under a pinned footer and it is the one that adds phantom
        scroll: it grows `document.scrollHeight`, which every
        `end: "bottom bottom"` on the page resolves against. Sticky needs no
        such help — see Rule S-6's short-page cases.
      */}
      <main className="relative z-10 bg-base">
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
          Nothing comes after this: no copyright, no colophon. The plate's own
          bottom padding is the end of the document.

          THIS IS PHASE 5'S REVEAL FOOTER, which absorbed the old `Contact`
          section. The same component renders on `/work` — one component, two
          call sites, never a copy — and deliberately NOT on `/about`, which
          `docs/07_SITE_RESTRUCTURE.md` §6 keeps as the one fully quiet page.

          It renders TWO elements from a fragment: a zero-height sentinel that
          marks the plate's static top for the navbar, and the plate itself.
          Both must stay direct children of `<body>` — the footer because that
          is what makes it the `contentinfo` landmark AND what makes `<body>`
          its sticky containing block, the sentinel because it has to sit in
          normal flow where the footer no longer does. */}
      <RevealFooter />
    </>
  );
}
