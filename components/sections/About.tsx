import { Reveal } from "@/components/ui/Reveal";
import { ABOUT_BEATS, ABOUT_HEADING } from "@/components/sections/aboutContent";
import { STAGGER } from "@/lib/animation/easing";

/**
 * About / Trajectory — Tier 2, and the first real-content section on `bg-base`.
 *
 * DELIBERATELY A SERVER COMPONENT. `Reveal` is the only client boundary here,
 * which keeps the copy out of the client bundle's critical path.
 *
 * COMPOSITION — this inherits the hero's left anchor rather than resetting to
 * a centred column. The prose is capped at a 34rem measure and the remaining
 * width is left empty on the right; that void is the site's negative space
 * doing its job, not a gap waiting to be filled. Do not centre the column and
 * do not widen the measure to "use the space".
 *
 * THE RAIL. At >=1024px each beat is a three-column grid: a 144px rail holding
 * only the mono label, the prose, and an empty third column. That third column
 * is the photo slot — declared now, empty today, costing nothing (content
 * decision: no photo ships). If a photo ever arrives it drops into an existing
 * column, but note it must span two beat rows, which is the one structural
 * change it forces: the per-beat grids would have to merge into a single
 * three-row grid. Below 1024px the rail collapses and the label stacks above
 * its paragraph — attempting the rail at 640px would leave a ~42-character
 * measure, and a cramped measure is worse than a stacked label.
 *
 * NO ACCENT COLOUR ANYWHERE IN THIS SECTION. That is a decision, not an
 * oversight: the labels are `fg` at 70%, not `accent-working`. Teal on the
 * labels would make an index look like a set of links, and About is the one
 * section whose job is to be read rather than navigated. Also absent by
 * decision: `bg-elevated` and the two tints (reserved for Ticket 5), any
 * horizontal rule or divider (the rail already segments, with content instead
 * of decoration), and `accent-hero`, which is Tier 1 only and mechanically
 * unavailable outside the `--color-*` namespace.
 */
export function About() {
  return (
    <section
      id="trajectory"
      aria-labelledby="trajectory-heading"
      // The hero/About boundary is a HARD colour edge — no gradient, no fade.
      // The generous top padding is what makes that edge land in empty space
      // rather than immediately above the heading.
      className="w-full bg-base pt-2xl pb-2xl sm:pt-3xl"
    >
      <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
        <Reveal>
          {/* Weight is left at the inherited 400. The type scale carries the
              size; a bolder heading would pull Tier 2 toward Tier 1. */}
          <h2 id="trajectory-heading" className="text-h2 text-fg">
            {ABOUT_HEADING}
          </h2>
        </Reveal>

        {/*
          The gap under the title is LARGER than the gap between beats, on
          purpose. The three beats are one continuous argument — foundation,
          systems, direction — and should group as a single block beneath the
          title. Equal gaps would make "Trajectory" read as a fourth peer item
          rather than as the thing the beats argue for.
        */}
        <div className="mt-xl space-y-lg lg:mt-2xl lg:space-y-xl">
          {ABOUT_BEATS.map((beat, index) => (
            <Reveal
              key={beat.label}
              // Only the first beat is staggered, and only against the heading
              // — a per-beat cascade would mean a fast scroller reading a
              // paragraph that is still assembling. Beats 2 and 3 fire on
              // their own intersection with no delay at all.
              delay={index === 0 ? STAGGER.line : 0}
              className="lg:grid lg:grid-cols-[var(--spacing-3xl)_minmax(0,34rem)_1fr] lg:gap-x-xl"
            >
              {/*
                An <h3>, but explicitly NOT heading-sized: it is a mono caption
                that indexes the beat. No `text-transform` — the strings are
                already uppercase in the content module, and transforming in CSS
                would make the DOM text and the rendered text disagree while
                silently "fixing" any future label authored in mixed case.

                The 3px top padding is optical, not arbitrary: the label's
                cap-height row would otherwise float above the paragraph's
                first baseline, because a 12px line box and a 16px line box put
                their cap-tops at different offsets.
              */}
              <h3 className="text-caption font-mono text-fg/70 lg:pt-3xs lg:whitespace-nowrap">
                {beat.label}
              </h3>

              <div className="mt-sm max-w-[34rem] space-y-sm lg:mt-0">
                {beat.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-body text-fg">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default About;
