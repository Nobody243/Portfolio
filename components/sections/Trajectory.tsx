import Image from "next/image";

import portrait from "@/public/images/about/portrait.jpg";
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
 * ITS FIVE UNITS SCRUB, THEY DO NOT REVEAL — the <h2>, the portrait and each of
 * the three beats. `docs/03_FRONTEND_SPEC.md`, "Scroll-scrub — Home only",
 * scopes the scrub to this section and to Home's three featured project cards,
 * and to nothing else on the site.
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
 * THE RAIL. At >=1024px each beat is a three-column grid: a 144px rail holding
 * only the mono label, the prose, and an empty third column. Below 1024px the
 * rail collapses and the label stacks above its paragraph — attempting the rail
 * at 640px would leave a ~42-character measure, and a cramped measure is worse
 * than a stacked label.
 *
 * THE THIRD COLUMN IS THE PHOTO SLOT, and it is now FILLED. It shipped empty
 * with the cost of filling it written down; this is what paying that cost came
 * to, kept here because every line of it is still load-bearing.
 *   - It is `1fr`, so it takes whatever the fixed tracks leave over: about
 *     48px at exactly 1024px, and only a usable ~464px at 1360px. The photo
 *     therefore rides its own `photo:` breakpoint (1360px, registered in globals.css) — NOT `lg`, which
 *     would put a portrait in a 48px column.
 *   - It must span the beat-1 and beat-2 rows, so the per-beat grids MERGED
 *     into one three-row grid on the container. Each beat is now `col-span-2`
 *     carrying a TWO-track inner grid, and the outer and inner templates are
 *     arithmetically identical — 144 + 55 + 544 = 743px either way — so the
 *     rail does not shift when the merge kicks in at 1360px. The two
 *     templates must move together, exactly like the 34rem pair below.
 *   - `display: contents` on the beats is the obvious way to flatten them into
 *     the parent grid and it is WRONG here: the beat wrapper is animated with a
 *     transform, and a transform does not apply to a `display: contents` box, so
 *     every beat would silently stop moving. That was as true of the reveal this
 *     section used to run as it is of the scrub it runs now. That is why this is
 *     col-span-2 plus an inner grid and not the shorter thing.
 *   - Below 1360px the photo is not in this column at all. It is the first
 *     child of the beats container, which places it between the <h2> and beat
 *     1 in plain source order — no `order` utility, and no second <Image> to
 *     keep in sync.
 *   - 4:5 AT EVERY WIDTH, one crop. The note here used to specify 3:2
 *     landscape below the breakpoint; that was written before there was a real
 *     image to test it against. The real one is a standing portrait with the
 *     head near the top of the frame, and a 3:2 crop of it cuts the hair and
 *     both hands. The source is SQUARE, so 4:5 crops width only and the whole
 *     head-to-hands range survives at every size.
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
        <div className="mt-xl space-y-lg lg:mt-2xl lg:space-y-xl photo:grid photo:grid-cols-[var(--spacing-3xl)_minmax(0,34rem)_1fr] photo:gap-x-xl photo:gap-y-xl photo:space-y-0">
          {/*
            FIRST CHILD ON PURPOSE, and the `space-y-0` above is why it can be.
            In flow this lands the photo between the <h2> and beat 1, which IS
            the sub-1360px placement; at 1360px the explicit column/row start
            below lifts it into the slot and the flow position stops mattering.
            `space-y-*` is sibling margin, so it must be zeroed when the
            container turns into a grid or it fights `gap-y`.
          */}
          <ScrubReveal className="photo:col-start-3 photo:row-span-2 photo:row-start-1 photo:self-start">
            {/*
              NO RADIUS, no border, no shadow. Not an omission — there is not a
              single `rounded-*` anywhere in this codebase, and a soft-cornered
              photo would be the one exception announcing itself.

              `sizes` is measured, not guessed, and reads bottom-up:
                <362px    the 320px cap is unreachable, so 100vw - 42px (px-md)
                >=362px   the cap binds -> a flat 320px
                >=1360px  in-slot: 100vw - 178 (px-2xl) - 144 (rail) - 544
                          (measure) - 110 (two gap-x-xl) = 100vw - 976
                >=1440px  the container stops growing at max-w-[1440px], so the
                          slot pins at 464px
              Quality is left at the default 75 and deliberately not raised to
              the 85 next.config.ts also allows: 85 exists for the project
              covers, which are UI screenshots where sharp text on flat fields
              is the worst case for a lossy encoder. This is a soft-edged
              photograph, the exact opposite case.
            */}
            <Image
              src={portrait}
              alt="Muhammad Saad"
              sizes="(min-width: 1440px) 464px, (min-width: 1360px) calc(100vw - 976px), (min-width: 362px) 320px, calc(100vw - 42px)"
              placeholder="blur"
              className="aspect-[4/5] w-full max-w-[320px] object-cover object-[55%_center] photo:max-w-none"
            />
          </ScrubReveal>

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
              // The `min-[1360px]` pair is the merge described in the file
              // header: drop the now-redundant `1fr` (the container owns it)
              // and span the two tracks this beat actually uses. Same total
              // width, same rail, one grid instead of three.
              className="lg:grid lg:grid-cols-[var(--spacing-3xl)_minmax(0,34rem)_1fr] lg:gap-x-xl photo:col-span-2 photo:grid-cols-[var(--spacing-3xl)_minmax(0,34rem)]"
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
              <div className="mt-sm max-w-[34rem] space-y-sm lg:mt-0">
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
