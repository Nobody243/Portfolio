import { Hero } from "@/components/hero/Hero";

export default function Page() {
  return (
    <main>
      <Hero />

      {/*
        TODO(ticket-4): replace this spacer with the About / Trajectory section.

        It exists for three concrete reasons, not as filler: the scroll cue
        needs somewhere to point, the hero's scroll-out frameloop drop is
        unverifiable on a single-viewport page, and so is the Lenis to
        ScrollTrigger sync. It deliberately carries NO copy, no motion and no
        accent — inventing placeholder prose here is exactly what a later
        content ticket owns.

        Ticket 4 note: the hero/About boundary is a HARD colour edge by design,
        with no gradient fade. This section therefore needs generous top
        padding (spacing-3xl) so that edge falls into empty space rather than
        immediately above a heading.
      */}
      <section className="h-dvh w-full bg-base pt-3xl" aria-hidden />
    </main>
  );
}
