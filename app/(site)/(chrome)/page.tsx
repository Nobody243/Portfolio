import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/sections/About";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { Contact } from "@/components/sections/Contact";

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
        <About />
        <Skills />
        {/* All five projects, still. The featured-three cut is Phase 3 —
            `content/projects.ts` is untouched by this commit and `Projects`
            takes no props yet. Until then Home and `/work` render the same
            gallery, which is redundant but not wrong. */}
        <Projects />
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
