import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/sections/About";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { Experience } from "@/components/sections/Experience";
import { CurrentlyLearning } from "@/components/sections/CurrentlyLearning";
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
    <>
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        {/* Renders NOTHING while content/currentlyLearning.ts is empty — the
            component returns null, so no section, no heading and no seam reach
            the HTML. It is wired here today so that adding the first entry to
            that data file is the only edit needed to make it appear. See the
            header of CurrentlyLearning.tsx for why the empty state lives in
            Skills and not here. */}
        <CurrentlyLearning />
      </main>
      {/* OUTSIDE `<main>`, deliberately — see the fragment comment above.
          Nothing comes after this: no copyright, no colophon. The panel's own
          bottom padding is the end of the document. */}
      <Contact />
    </>
  );
}
