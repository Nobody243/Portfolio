import { ScrubReveal } from "@/components/ui/ScrubReveal";
import { ABOUT_BEATS, ABOUT_HEADING } from "@/components/sections/aboutContent";

/**
 * Trajectory — Tier 2, and the first real-content section on `bg-base`.
 *
 * RENAMED FROM `About.tsx` IN PHASE 3, and only the filename and the export
 * moved: the DOM id is still `trajectory`, the heading is still
 * `ABOUT_HEADING`, and `aboutContent.ts` deliberately stays where it is. The
 * rename resolves a collision rather than a design question — `/about` is now
 * a route with its own page, and two different things called About in the same
 * codebase is how the wrong one gets edited. This section was already headed
 * "Trajectory" and already rendered `id="trajectory"`; the file just caught up.
 *
 * The content module keeps its name on purpose. Renaming it too would touch
 * three exported constants and every comment that cites them, for no gain — and
 * `docs/07`'s `/about` page gets its OWN content module, so there is no second
 * collision waiting.
 *
 * DELIBERATELY A SERVER COMPONENT. `ScrubReveal` is the only client boundary
 * here, which keeps the copy out of the client bundle's critical path.
 *
 * ITS FOUR UNITS SCRUB, THEY DO NOT REVEAL — the <h2> and each of the three
 * beats. It was five until the portrait moved to `/about`.
 * `docs/03_FRONTEND_SPEC.md`, "Scroll-scrub — Home only", scopes the scrub to
 * this section and to Home's three featured project cards, and to nothing else
 * on the site.
 *
 * IT IMPORTS `ScrubReveal` DIRECTLY AND TAKES NO PROP TO CHOOSE, because this
 * section renders on Home and only on Home — there is no second caller to
 * disagree with. `Projects` is shared with `/work` and therefore does take a
 * required `motion` prop. If Trajectory ever gains a second route, it needs the
 * same required prop, never a default: a silently-defaulting motion owner would
 * scrub a page the spec says is normal scroll, and it would look right on the
 * page it was tested on.
 *
 * WHAT CHANGED VISIBLY: the fade is gone here. Each unit rises 21px into place
 * at full opacity, across exactly the span of scroll during which it is
 * arriving on screen, and it runs backwards when you scroll back up. Opacity
 * does not scrub, and the arithmetic that rules it out is in `ScrubReveal.tsx`'s
 * header — a wrapper alpha multiplies through to the `text-fg/70` beat labels
 * below, so the legal range is 0.836 -> 1.0 and too narrow to perceive. Do not
 * reintroduce an opacity leg here to "restore the fade".
 *
 * COMPOSITION — this inherits the hero's left anchor rather than resetting to
 * a centred column. The prose is capped at a 34rem measure and the remaining
 * width is left empty on the right; that void is the site's negative space
 * doing its job, not a gap waiting to be filled. Do not centre the column and
 * do not widen the measure to "use the space".
 *
 * THE RAIL. At >=1024px each beat is a two-column grid: a 144px rail holding
 * only the mono label, and the prose. Below 1024px the rail collapses and the
 * label stacks above its paragraph — attempting the rail at 640px would leave
 * a ~42-character measure, and a cramped measure is worse than a stacked
 * label.
 *
 * THERE IS NO THIRD COLUMN AND NO PHOTO SLOT. A portrait filled one between
 * `95ae847` and this commit; it now lives on `/about`
 * (`components/about/AboutScreen.tsx`), which is the page it was always about —
 * Saad's call, recorded in `.claude/handoff/about-design.md` §9. What that
 * leaves behind is deliberate, and every line of it is a thing not to undo:
 *   - The template is TWO tracks, the 144px rail and the 34rem measure. The
 *     width to their right is unpainted on purpose. That is the COMPOSITION
 *     note above still doing its job, not a slot waiting for a replacement
 *     image.
 *   - The per-beat grids are per-beat again. They had merged into one
 *     three-row grid on the container purely so the photo could span the
 *     beat-1 and beat-2 rows; with no photo there is nothing to span, so the
 *     merge, the `col-span-2` and the duplicated inner template went with it.
 *   - `--breakpoint-photo` was registered in `globals.css` for that column and
 *     for nothing else, so it was deleted in the same commit. `/about` does
 *     NOT adopt it: that page has no 144px rail, so it has ~302px of room at
 *     1024px where this section had 48px, and the portrait rides plain `lg`
 *     there.
 *   - IF A PHOTO IS EVER WANTED HERE AGAIN it costs all of the above in
 *     reverse: a custom breakpoint (declared in `rem` — Rule S-5,
 *     `docs/03_FRONTEND_SPEC.md`), a container-level grid merge, and a fifth
 *     scrub unit. And `display: contents` is still the WRONG shortcut for that
 *     merge: the beat wrapper is animated with a transform, and a transform
 *     does not apply to a `display: contents` box, so every beat would
 *     silently stop moving.
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
export function Trajectory() {
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
        <ScrubReveal>
          {/* Weight is left at the inherited 400. The type scale carries the
              size; a bolder heading would pull Tier 2 toward Tier 1. */}
          <h2 id="trajectory-heading" className="text-h2 text-fg">
            {ABOUT_HEADING}
          </h2>
        </ScrubReveal>

        {/*
          The gap under the title is LARGER than the gap between beats, on
          purpose. The three beats are one continuous argument — foundation,
          systems, direction — and should group as a single block beneath the
          title. Equal gaps would make "Trajectory" read as a fourth peer item
          rather than as the thing the beats argue for.
        */}
        <div className="mt-xl space-y-lg lg:mt-2xl lg:space-y-xl">
          {ABOUT_BEATS.map((beat) => (
            <ScrubReveal
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
              //
              // TWO TRACKS, NOT THREE. The trailing `1fr` that used to sit
              // here existed only to reserve the photo column; with the
              // portrait on `/about` there is nothing to reserve, and the
              // space to the right of the measure is simply unpainted.
              className="lg:grid lg:grid-cols-[var(--spacing-3xl)_minmax(0,34rem)] lg:gap-x-xl"
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

              {/* max-w-[34rem] AND the 34rem track in the grid template above
                  are BOTH required and must move together: the grid column
                  governs >=1024px, this cap governs everything below it, where
                  the rail has collapsed and there is no grid at all. Changing
                  one and not the other silently gives two different measures at
                  two different breakpoints. */}
              {/*
                  `select-text` — THE PROSE, AND ONLY THE PROSE. `<body>` in
                  `app/layout.tsx` carries `select-none` site-wide; this is one
                  of the four narrow exceptions `docs/03`'s selection section
                  enumerates. Saad's rule, 2026-08-28: "long-form prose that
                  exists for someone to read and might reasonably want to quote
                  or copy stays selectable. UI chrome, labels, card teasers, and
                  every image stay non-selectable."

                  ON THIS `<div>` AND NOT ON THE `<p>` INSIDE THE MAP, so it is
                  declared once per beat rather than once per paragraph — a
                  beat that grows a third paragraph inherits it. It is also the
                  reason the `<h3>` beside it is NOT covered: the rail label is
                  chrome, it sits outside this box, and the split falls exactly
                  on the boundary that already existed for the measure.

                  NO IMAGE OVERRIDE IS NEEDED HERE, checked rather than
                  assumed: this box's only children are the `<p>` elements the
                  map emits. If an image is ever added inside it, it takes
                  `select-none` on the `<img>` itself — the pattern
                  `ProjectDetail` uses for the cover and the screenshots.
              */}
              <div className="mt-sm max-w-[34rem] space-y-sm select-text lg:mt-0">
                {/* Index as key: the array is static, never reordered and never
                    filtered. The alternative here is a 400-plus character
                    paragraph as a key, which is stable and correct but makes a
                    reader stop and work out why. */}
                {beat.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-body text-fg">
                    {paragraph}
                  </p>
                ))}
              </div>
            </ScrubReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Trajectory;
