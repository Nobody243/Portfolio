import { Hero } from "@/components/hero/Hero";
import { Navbar } from "@/components/ui/Navbar";
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
      {/*
        THE NAVBAR LIVES ON `/` AND ONLY ON `/`, and that is a decision rather
        than an oversight — `docs/06_INTRO_AND_CHROME.md` §4 records it.

        Putting it in `app/(site)/layout.tsx` would have put it on the five
        `/projects/<slug>` routes too, where `ProjectDetailFrame` already owns
        the top strip with a back link and a theme toggle. Two fixed bars in the
        same 64px would collide, and the detail pages are Tier 3, where a
        transparent bar with a Tier 1 mark in it is the wrong register. That
        layout also states in its own header that it must render no DOM element;
        this keeps that intact.

        It renders BEFORE `<main>` and as a sibling of it, so `<header>`'s
        nearest ancestor is `<body>` and it is the `banner` landmark. Nested
        inside `<main>` it would be scoped to `<main>` and be no landmark at
        all — the same trap `<Contact />`'s `<footer>` avoids below, for the
        same reason.
      */}
      <Navbar />
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
