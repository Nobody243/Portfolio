import { Hero } from "@/components/hero/Hero";
import { Trajectory } from "@/components/sections/Trajectory";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { RevealFooter } from "@/components/sections/RevealFooter";
import { PageStack } from "@/components/ui/PageStack";
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

        AN OPAQUE BACKGROUND AND `relative z-10` ARE BOTH LOAD-BEARING. Rule
        S-6 in `docs/03_FRONTEND_SPEC.md` states them; this is the enforcement
        point.

        THE OPAQUE BACKGROUND IS `bg-hero-surface` ON THIS ROUTE AND `bg-base`
        ON `/work`, AND THE DIFFERENCE IS A CONTRAST FIX, NOT A COLOUR CHOICE.
        It read `bg-base` here until 2026-08-22 and NOTHING ON THIS PAGE EVER
        SHOWS IT — every section below paints its own background edge to edge,
        so this surface is only ever visible through the route transition's
        fade, which is the whole reason it matters.

        MEASURED, light mode, production build, navigating `/about -> /`:
        `<main>` stays fully opaque (it must — see below) while
        `[data-page-stack]` inside it ramps 0 -> 1 over 350ms. The hero's dark
        surface is INSIDE that fade; the navbar is not. So the bar flipped to
        its hero palette on arrival, correctly, and then sat on a #FDFCFA
        ground for ~150ms while the hero faded up underneath it. Worst sample
        1.85:1 at t=100ms at 375x667 and 2.55:1 at 1440x900, with `/work -> /`
        at 1.98 and 1.21 — the same failure `Navbar.tsx`'s 639x800 case fixed,
        re-created by a different mechanism. Dark mode never dropped below
        10.3:1 at any sample, which is why it shipped.

        `bg-hero-surface` makes the occluder the destination's OWN first-paint
        ground: still opaque, still hiding the plate, and dark behind the bar
        from the first frame — which is what the hero palette is already
        correct for. It needs no timing coordination and no new state.

        THE MID-PAGE CASE IS COVERED BY THE SCRIM, NOT BY LUCK. Arriving here
        at a RESTORED scroll (browser back) puts the bar over `bg-base` with
        the light palette while this dark surface is still showing through the
        fade. That would be the mirror failure, except that
        `[data-nav-root]:not([data-over-hero])` in `globals.css` lays an 80%
        `--color-base` scrim under the bar in exactly that state, so the
        effective ground is not #07090C but #CBCBCA. Measured at the commit
        frame: MS mark 11.25:1 at 375x667, 11.36:1 at 1440x900. If that scrim
        is ever removed or narrowed, THIS LINE HAS TO BECOME SCROLL-AWARE.

        THIS WAS A LITERAL `<main>` UNTIL 2026-08-22, and everything below is
        still true of it — `PageStack` renders the same element with the same
        classes in the same position, so `<footer>` is still a direct child of
        `<body>` and the occlusion below still works exactly as described. What
        it adds is the route transition's fade, on a div INSIDE this element.
        That placement is not stylistic: fading `<main>` itself would fade the
        opaque background this comment is about, and the plate would composite
        straight through the page. `components/ui/PageStack.tsx` carries the
        measurement.

        THE `className` IS PASSED HERE AND HAS NO DEFAULT, deliberately — the
        surface is this page's knowledge, and a default would let a future route
        inherit Rule S-6's classes without knowing it depends on them.

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
        Navbar (z-[55]), Intro (z-50) and AssetLoader (z-[60]) are all outside
        `<main>` and stay above it.

        THAT SENTENCE WAS FALSE UNTIL 2026-08-22, AND IT IS THE MOVE THAT MADE
        IT TRUE. It read "the Navbar (z-40), Intro (z-50) and AssetLoader
        (z-[60]) are all outside `<main>`". The navbar was; the other two were
        NOT — the gate was mounted by `Hero`, which is rendered inside this
        element, so both plates were descendants of this stacking context and
        their z-indices were local to it. MEASURED ancestry of the plate at
        t=600ms: `section` -> the page-stack wrapper -> `main.relative.z-10` ->
        `body`. The consequence was invisible and load-bearing: at z-40 the
        header outranked a trapped z-50 plate, which is why the navbar's whole
        entrance is legible over it.

        `components/intro/IntroProvider.tsx` is mounted by
        `app/(site)/(chrome)/layout.tsx` now, so both plates really are outside
        `<main>` and their z-indices really are body-level — and the header was
        raised to z-[55] IN THE SAME COMMIT to keep the paint order it had by
        accident. `Navbar.tsx` carries the full measurement and the ordering
        requirement. Rule S-4's project overlay is a modal
        `<dialog>` opened with `showModal()`, so it renders in the TOP LAYER and
        is above every z-index on the page — but ONLY because of `showModal()`.
        Opened without it, it would fall behind this stack.

        NO `min-h-[calc(100dvh-…)]` HERE, EVER. That is the reflexive fix for a
        short page under a pinned footer and it is the one that adds phantom
        scroll: it grows `document.scrollHeight`, which every
        `end: "bottom bottom"` on the page resolves against. Sticky needs no
        such help — see Rule S-6's short-page cases.
      */}
      <PageStack className="relative z-10 bg-hero-surface" fade>
        <Hero />
        <Trajectory />
        <Skills />
        {/* THREE CARDS — FOLIO, Aero-Grid, ClashChat, in that order, and the
            order is not written anywhere in this file. `featuredProjects` is
            `content/projects.ts`'s array filtered by a membership SET, so the
            sequence comes from the array and cannot drift from `/work`'s. If
            Home's three should appear differently, reorder the array; that
            reorders both pages, which is the right answer.

            CCN and SNA are archive-only, meaning they are not featured HERE —
            that part is unchanged and is `docs/07` §5's locked decision.

            **THIS SAID THEY "appear only on `/work`, which is therefore the
            ONLY route that links to their detail pages — and the only place
            their card -> overlay morph can be tested at all" UNTIL 2026-08-25.
            All three clauses are now false**, and they went false in two steps
            rather than one. `/projects` shipped a strip row per project, so
            `/work` stopped being the only route that links to their detail
            pages; and the deck replaced `/work`'s grid, so `ProjectCard`'s
            morph — the one this section renders — is now testable ONLY from
            Home, i.e. only on the three featured slugs. `/work`'s morph source
            is the deck's expanded panel cover now; `/projects`' strip
            thumbnails deliberately hold no `layoutId` at all. `ProjectCard.tsx`
            enumerates all three holders of `project-cover-<slug>` and
            `ProjectStripRow.tsx` records why it is not a fourth.

            AND HOME NOW REACHES THEM IN TWO CLICKS. The `Browse All`
            control below the three cards goes to `/projects`, which lists all
            five — so CCN and SNA are no longer off Home's path entirely, they
            are simply not among the cards. `components/sections/Projects.tsx`
            carries the control and the reversal of its own written refusal
            of it.

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
      </PageStack>
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
