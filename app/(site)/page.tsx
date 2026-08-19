import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/sections/About";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { Experience } from "@/components/sections/Experience";
import { CurrentlyLearning } from "@/components/sections/CurrentlyLearning";

export default function Page() {
  return (
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
  );
}
