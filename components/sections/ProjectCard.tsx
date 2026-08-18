"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";
import type { Project } from "@/content/types";

/**
 * One project card — Ticket 6, Tier 2.
 *
 * "use client" FOR EXACTLY ONE REASON: the cover's hover depth runs through
 * Framer's `whileHover`, and `MotionConfig reducedMotion="user"` in
 * MotionProvider then drops that transform for free. The same effect written
 * as a CSS `hover:scale-` would need a hand-written `motion-reduce:` guard,
 * and that guard is the kind of thing that gets forgotten in a later edit
 * (ticket-6-plan.md §1.12). Nothing else in this file needs the client.
 *
 * PROPS ARE THE FIVE FIELDS A CARD SHOWS, PICKED OFF `Project` — not the whole
 * record. Two consequences, both deliberate: `description` (the longest string
 * in the data file, ~600 chars on SNA) never crosses the server/client
 * boundary, and a rename in `content/types.ts` is a TYPE ERROR here rather
 * than a silently blank card.
 *
 * DELIBERATELY OMITTED FROM THE CARD, each for a stated reason
 * (ticket-6-plan.md §1.6): `category` (four of five projects share one value,
 * so a chip on every card would carry almost no signal — Skills' three groups
 * already express that taxonomy), `credit` (content/types.ts spends 27 lines
 * on how precisely those strings are calibrated; a glance surface is the wrong
 * place to read them — Ticket 7 renders it), `links` (a GitHub link inside a
 * card that is itself a link is a nested-interactive violation and doubles the
 * gallery's tab stops), `description` and `screenshots` (detail-page payload).
 *
 * NO `layoutId` ANYWHERE IN THIS FILE, not even an inert one. The shared-
 * element morph is Ticket 6b, scheduled after Ticket 7 (plan §0.3, G1 =
 * A-split), because the morph's destination geometry is Ticket 7's output. An
 * unmatched `layoutId` is not free: it still enrols the element in Framer's
 * layout-projection tree and measures it on mount. The insertion point is the
 * cover wrapper below, and it is documented there rather than stubbed.
 */

/**
 * Fields this component renders, and the only fields it may render. Adding one
 * here without adding it to the JSX (or the reverse) is caught by tsc.
 */
export type ProjectCardProps = Pick<
  Project,
  "slug" | "title" | "oneLiner" | "stack" | "coverImage"
>;

/**
 * How many `stack` entries a card shows before it truncates.
 *
 * FOUR, NOT THREE, and the data is the argument. At three, Aero-Grid's card
 * reads "Next.js, React, TypeScript" — three frontend names on a project whose
 * story is four AI algorithms. Four adds "FastAPI", which at least breaks the
 * all-frontend read. Four also lets CCN (6 entries) show a genuine majority of
 * its stack, so its `+2` reads as trimming rather than as hiding.
 *
 * Counts today: FOLIO 11, Aero-Grid 14, ClashChat 9, CCN 6, SNA 11. Rendering
 * Aero-Grid's fourteen would turn the card into a data dump and bury the title.
 *
 * Reject four and drop to three if the flow ever runs to THREE lines on any
 * card at 360px (measured: all five run to two).
 */
const STACK_LIMIT = 4;

export function ProjectCard({
  slug,
  title,
  oneLiner,
  stack,
  coverImage,
}: ProjectCardProps) {
  const shownStack = stack.slice(0, STACK_LIMIT);

  /**
   * The guard must exist even though no project hits it today — CCN has the
   * fewest entries at 6, so the remainder can only reach 0 if someone edits
   * `content/projects.ts` down to four or fewer, and that file is hand-edited
   * for a year. `+0` must never render.
   */
  const overflowCount = stack.length - shownStack.length;

  return (
    <motion.article
      /*
        `whileHover` carries a VARIANT LABEL, not a property animation: the
        root itself does not move, it just broadcasts "hover" down to the
        cover wrapper below. Framer filters this by pointer type, so a tap on
        a touchscreen cannot strand a card mid-scale.

        `overflow-hidden` LIVES HERE, ON THE ROOT, NOT ON THE COVER WRAPPER.
        The wrapper has to stay a bare single-purpose element (see below), so
        it cannot also be the clip. This works because `scale` is a transform:
        the wrapper's layout box never changes, so nothing below it moves, the
        card's height is unaffected, and the border stays exactly where the
        grid put it. The root clips the 2% overhang at the inner edge of the
        border.

        `relative` is what the stretched link's `after:inset-0` resolves
        against. An element's own `outline` is not clipped by its own
        `overflow: hidden`, and `outline-offset-4` draws entirely outside the
        border box, so the focus ring survives the clip.

        BORDER AT /30, AND IT IS NOT DECORATION-BY-DEFAULT. In dark mode
        `bg-elevated` is only DeltaE 2.89 from `bg-base` (docs/03), so on this
        surface the border IS the card boundary rather than a refinement of
        it. Measured against the page: /20 is 1.44:1 (likely invisible on a dim
        laptop), /30 is 1.79:1 (an edge you see without being able to name the
        colour), /40 is 2.25:1 (starts reading as a drawn teal line). The
        border is decorative in the WCAG sense — the cover and the h3 carry
        the card's meaning — so the 3:1 non-text floor does not bind it and
        must not be chased. If it ever needs adjusting, /20 and /40 are the
        only two steps available.

        HOVER AND FOCUS SHARE ONE BORDER STEP (/55), on purpose: they are
        recognisably the same state. The colour change is done in CSS rather
        than in Framer for two reasons — a colour change is NOT motion and
        must survive `prefers-reduced-motion` (it is the only hover feedback
        left there), and Framer would need a literal colour value while every
        colour here is a theme-flipping CSS variable.

        Tailwind v4's `hover:` is already wrapped in `@media (hover: hover)`,
        so no manual guard is needed. If this is ever swapped for a JS-driven
        hover, that guard becomes mandatory.

        `duration-200` and `ease-in-out` happen to equal DURATION.micro (0.2s)
        and EASE.ui (cubic-bezier(0.4, 0, 0.2, 1)) NUMERICALLY, by
        coincidence, not by reference. Retuning easing.ts will not move these.
      */
      whileHover="hover"
      className="relative flex h-full flex-col overflow-hidden border border-accent-working/30 bg-elevated transition-colors duration-200 ease-in-out hover:border-accent-working/55 has-[a:focus-visible]:border-accent-working/55 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-accent-working"
    >
      {/*
        THE COVER WRAPPER CONTAINS ONLY THE <Image>. Nothing else may be added
        to it — no overlay, no gradient scrim, no category badge, no caption,
        no "View project" hover panel, no play glyph. It is Ticket 6b's morph
        SOURCE and it needs a stable, meaningful rect (plan §0.4). This is also
        where 6b's `layoutId` goes; it is deliberately absent today.

        Scale 1.02, not 1.05: at a 428px slot 1.02 pushes the image edge 4.3px
        past the frame, which reads as the image pressing forward against its
        frame — depth. 1.05 pushes 10.7px, which reads as a zoom, the template
        gesture. There is no lift and no shadow (no shadow token exists), and
        the card's border is what makes the grid read as a grid — a lift would
        take that border off the row's shared top edge for 200ms.

        FOCUS DELIBERATELY DOES NOT SCALE THE COVER. A keyboard user tabbing
        five cards should get a static, instantly-readable indicator; five
        image animations fired by navigation is motion competing with
        wayfinding.
      */}
      <motion.div
        variants={{ hover: { scale: 1.02 } }}
        transition={{ duration: DURATION.micro, ease: EASE.ui }}
      >
        {/*
          NATIVE ASPECT RATIO, EVERY COVER. No `aspect-[...]` box, no
          `object-contain`, no `object-cover`, no letterbox bars. The five
          sources run 1.967 (SNA) to 2.671 (CCN) and three of them are within
          0.4% of each other, so exactly one grid row shows an image-height
          difference at all. Ragged image bottoms are absorbed structurally
          instead: the grid stretches both cards in a row to the taller one and the
          slack falls below the last line of text. (Ticket 6 originally put
          `mt-auto` on a date row so the dates aligned across a row; the date
          was dropped after review, and with it the need for an anchor.)
          `object-cover` is forbidden outright —
          content/projects.ts says "DO NOT CROP" of the CCN topology, which is
          content authority, not taste.

          NO `width`/`height` PROPS, EVER. Both come from the StaticImageData
          the static import carries, which is the acceptance criterion and the
          reason there is no layout shift. `placeholder="blur"` takes the
          blurDataURL from that same import — all five covers are lazy and
          below the fold, and an empty `bg-elevated` rectangle with a hairline
          border is exactly what a BROKEN card looks like, so the blur is what
          makes loading legible as loading.

          NO `priority` ON ANY CARD: all five sit below the fold and would
          compete with the hero's LCP. Loading stays the default lazy.

          `quality={85}` against next/image's default 75, uniformly, never
          per-image: all five covers are UI screenshots, and sharp text on flat
          fields is the worst case for lossy encoding. SNA is a 779px source —
          already the weakest in the set — and would be re-encoded at 75 on top
          of being scaled. Revert to the default if the five covers together
          ever exceed ~600KB transferred.
        */}
        <Image
          src={coverImage.src}
          alt={coverImage.alt}
          /*
            THIS STRING ENCODES THE GRID. It carries the column count, both gap
            values, all three container insets and the 27rem/57rem grid caps.
            Change any of those in Projects.tsx without changing this line and
            the build stays green, the page renders perfectly, and the section
            silently downloads roughly twice the image bytes. Update both in
            one commit.

            Branch by branch, against the measured layout:
              >=1024px  inset 89x2, gap 55, grid capped at 912 -> slot 396-428px
              768-1023  inset 55x2, gap 34, grid capped at 912 -> slot 312-439px
              474-767   one column, capped at 27rem            -> slot 432px
              <474      one column, inset 21x2, under the cap  -> 100vw - 42px

            474px is exactly where `100vw - 42px` crosses the 432px cap — an
            odd-looking number that is not a guess.

            The >=1024px branch over-declares by up to 8% between 1024 and
            1090px (429 against an actual 396). That is deliberate:
            over-declaring fetches a slightly larger candidate, under-declaring
            ships a blurry image.
          */
          sizes="(min-width: 1024px) 429px, (min-width: 768px) calc((100vw - 144px) / 2), (min-width: 474px) 432px, calc(100vw - 42px)"
          placeholder="blur"
          quality={85}
          className="block h-auto w-full"
        />
      </motion.div>

      {/*
        `flex-1` lets the text block absorb whatever height the row's taller
        card imposed, so the card fills its stretched grid cell instead of
        leaving a gap between the block and the card's border. Nothing carries
        `mt-auto` any more — the date did, until it was dropped — so the slack
        simply sits below the last line.

        Padding steps at `xl` (1280px), NOT at `lg`. The slot only reaches its
        428px maximum at ~1090px viewport, so stepping to 34px at 1024px would
        apply the larger padding to a slot that has just SHRUNK (439px at 1023
        -> 396px at 1024), dropping the text measure from 397px to 328px — a
        visible inversion at a breakpoint. At `xl` the slot is already at its
        maximum, so the padding grows where the card grows. This is the first
        `xl:` in the codebase; it is card-internal, and section chrome still
        runs on the site's base/sm/lg ladder.
      */}
      <div className="flex flex-1 flex-col p-md xl:p-lg">
        {/*
          A REAL h3 AT text-h4 — docs/03 names that token for "Sub-headings,
          card titles". Note this is a DIFFERENT use of h3 from About and
          Skills, where h3 is styled down to a mono caption; here the level and
          the visual weight agree, because a card title genuinely is a
          sub-heading.

          THE STRETCHED-LINK PATTERN, NOT A WRAPPER LINK. The Link wraps the
          title text only and throws an `after:absolute after:inset-0`
          pseudo-element across the whole card, so the entire card is clickable
          while the accessible name stays "FOLIO" rather than ~200 characters
          of title + one-liner + four stack entries read aloud on every card. A wrapper link plus a hand-written `aria-label` was rejected
          because a hand-written accessible name drifts from the visible text
          over a year of edits.

          RECORDED TRADE-OFF: the overlay makes the card's body text
          unselectable — a reader cannot copy a one-liner or a technology name
          out of a card. Accepted (plan §1.13).

          A Link, never a div with onClick and never `router.push` from a
          handler: it navigates to a URL, so Enter works natively and no key
          handling is written here.

          `focus-visible:outline-none` on the anchor is not a removed indicator
          — the ring is drawn on the CARD instead, via `has-[a:focus-visible]:`
          above. The operable region is the whole card, so the indicator must
          be too; a 60px ring around a title inside a 400px click target is the
          WCAG 2.4.11 mismatch this avoids. `accent-working`, NOT `hero-accent`
          — this section sits on `bg-base`, which themes, so the ring needs the
          token that themes with it (light mode: #0f766e on #fdfcfa, 5.34:1).
        */}
        <h3 className="text-h4 text-fg">
          <Link
            href={`/projects/${slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {title}
          </Link>
        </h3>

        {/* Tightest gap in the card (13px): the title and the one-liner are
            one statement. */}
        <p className="mt-sm text-body text-fg">{oneLiner}</p>

        {/*
          NOT CHIPS. No background, no border, no padding box, no separator
          glyph — the same atom SkillNameFlow already ships, one size down.
          There is no radius token by decision, so a chip here would be a
          square box, and square boxes in a flow read as tag INPUTS that invite
          a click doing nothing; inside a card that is itself one big click
          target that is worse here than it was in Skills.

          21px column gap against mono's ~7.2px word space at 12px is a 2.9x
          contrast, so "Windows Server 2019" and "Active Directory" never blur
          into one another. The 21px step from the one-liner is a register
          change, sans -> mono, and needs a real gap.

          NO SORT AND NO ALPHABETISING — content/types.ts states stack order is
          meaningful, and it is authored content.

          A ul nested inside the gallery's li is valid and intentional: a
          screen reader announcing "list, 4 items" inside a project card is
          accurate.
        */}
        <ul className="mt-md flex flex-wrap gap-x-md gap-y-xs">
          {shownStack.map((entry) => (
            <li key={entry} className="text-caption font-mono text-fg">
              {entry}
            </li>
          ))}

          {overflowCount > 0 ? (
            // MUST carry the same type classes as its siblings above, even
            // though every glyph inside is already styled. A bare <li> inherits
            // 16px from preflight's `html { line-height: 1.5 }`, giving it a
            // 24px strut against the 16.8px (12px x 1.4) of every technology
            // name beside it — so the marker sat ~4px low on its row and added
            // ~7px to the block. Every card has a remainder (11/14/9/6/11
            // against N=4), so it was visible on all five.
            <li className="text-caption font-mono text-fg/70">
              {/*
                Same device and same reasoning as Skills' `00` count: a bare
                "+7" spoken after four technology names is cryptic, because the
                glyph takes its meaning from sitting at the end of a visual
                row. So the glyph is hidden and an sr-only sibling states the
                same fact in a form that survives being read aloud.

                The reduced opacity is doing real work: it marks the marker as
                NOT a technology, which is the one thing that must not be
                ambiguous in a list of technologies.
              */}
              <span
                aria-hidden="true"
                className="text-caption font-mono text-fg/70"
              >
                {`+${overflowCount}`}
              </span>
              <span className="sr-only">{`and ${overflowCount} more`}</span>
            </li>
          ) : null}
        </ul>

      </div>
    </motion.article>
  );
}

export default ProjectCard;
