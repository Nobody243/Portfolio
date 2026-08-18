import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/sections/About";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";

export default function Page() {
  return (
    <main>
      <Hero />
      <About />
      <Skills />
      <Projects />
    </main>
  );
}
