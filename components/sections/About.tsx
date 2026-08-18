import { Reveal } from "@/components/ui/Reveal";
import { ABOUT_BEATS, ABOUT_HEADING } from "@/components/sections/aboutContent";

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
          {ABOUT_BEATS.map((beat) => (
            <Reveal
              key={beat.label}
              // NO DELAY ON ANY BEAT — uniform, and that uniformity is the
              // point. An earlier version staggered beat 1 by STAGGER.line on
              // the reasoning that beats never co-enter the viewport, so only
              // the heading and beat 1 could ever fire together.
              //
              // That holds while SCROLLING and is false after a CUE CLICK: the
              // jump lands heading, beat 1 and beat 2 in view on the same
              // observer tick, so delays of 0 / 0.10 / 0 render "heading and
              // beat 2 together, then beat 1 a tenth of a second later" — a
              // sequence that runs visibly backwards.
              //
              // Nothing is lost on the scroll path: heading and beat 1 cross
              // the threshold roughly 164px of scroll apart, far more than
              // 100ms at any realistic speed, so the delay was already inert
              // there.
              //
              // Do NOT "restore" the stagger, and do NOT reach for
              // `index * STAGGER.line` — an index cascade is rejected by name
              // in the design brief and would make the backwards-ordering
              // worse, not better.
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
