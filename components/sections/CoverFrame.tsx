"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";

/**
 * The detail page's cover wrapper — Ticket 6b's morph DESTINATION.
 *
 * ------------------------------------------------------------------------
 * WHY THIS FILE EXISTS AT ALL.
 * ------------------------------------------------------------------------
 * `layoutId` requires a `motion` component, and `ProjectDetail.tsx` has no
 * `"use client"` and must never get one — it holds the longest strings on the
 * site and its header states that if `motion` ever appears in that file
 * something has gone wrong. That sentence is still true: `motion` appears
 * HERE. This is a one-element client leaf, and `<Image>` is passed in as
 * `children`, so `next/image`'s server-rendered output crosses no boundary and
 * the rest of the detail page stays server-rendered exactly as it was.
 *
 * THIS IS THE ONLY NEW CLIENT BOUNDARY ON THE DETAIL PAGE.
 *
 * ------------------------------------------------------------------------
 * THE ONE-CHILD CONTRACT STILL BINDS. Nothing may be added to this wrapper —
 * no overlay, no gradient scrim, no title, no category badge, no caption, no
 * back link, no "view project" panel. It is a morph target and it needs a
 * stable, meaningful rect. The border is a STYLE passed in via `className`, not
 * a second child, which is what keeps the contract literally true.
 *
 * ------------------------------------------------------------------------
 * THE BORDER DOES NOT ANIMATE, AND THE CARD'S TEAL NEVER PARTICIPATES.
 * ------------------------------------------------------------------------
 * The card's cover wrapper has no border at all — the card ROOT carries
 * `border-accent-working/30`. This wrapper carries `border-fg/25`. They are
 * different colours by design: `docs/03_FRONTEND_SPEC.md` records that the
 * split exists so teal means "activate this" and nothing else, and it names
 * this morph as the reason the choice is site-wide architecture.
 *
 * Mechanically this needs no code: with `layoutId`, the newly-mounted element
 * renders with ITS OWN className and is projected onto the source rect. So the
 * neutral hairline is on the travelling element from frame 1 and the teal
 * border stays on the card, behind the overlay, untouched.
 *
 * A teal→neutral crossfade was rejected outright. It would put
 * `accent-working` around a static image for ~350ms, which is the one thing the
 * two-border-family rule forbids by name; it would be the site's first
 * accent-to-neutral colour transition; and it would blur the read the split
 * exists to produce. `ProjectDetail.tsx` states the intent exactly: identical
 * borders would read as "the card grew", different borders read as "the card
 * opened into a page". THE DISCONTINUITY IS THE MESSAGE.
 *
 * KNOWN ARTEFACT, RECORDED SO IT IS NOT REDISCOVERED AS A BUG: Motion's layout
 * projection corrects `border-radius` for scale but NOT `border-width`. A 1px
 * hairline on an element measured at 912px and displayed at 428px renders at
 * ~0.47px and grows to 1px across the morph. Sub-pixel, on a hairline at /25,
 * on a moving element. Accept it. Do NOT "fix" it by moving the border to a
 * non-layout parent — that puts a second element in the wrapper and breaks the
 * one-child contract above.
 *
 * ------------------------------------------------------------------------
 * TIMING: `DURATION.ui` (0.35s) + `EASE.reveal`. NO NEW CONSTANT.
 * ------------------------------------------------------------------------
 *   - `DURATION.reveal` (0.7s) is too slow for a navigation gesture — this is
 *     the one interaction where perceived responsiveness IS the product.
 *   - `DURATION.micro` (0.2s) is hover feedback; a 2.1x scale across ~500px in
 *     200ms reads as a snap.
 *   - `EASE.ui` is near-symmetric by design and reads mechanical over a large
 *     travel.
 *   - `EASE.reveal` (0.22, 1, 0.36, 1) is the expo-out every Tier 2/3 entrance
 *     already uses: perceived arrival at ~0.15s, settled by 0.35s.
 * A SPRING WAS REJECTED. Its overshoot would push the cover past its final rect
 * — visible against the `<h1>`'s fixed left edge one row below — and it would
 * add a fourth curve family to a three-ease system.
 *
 * Tuning window is 0.30-0.45s. Anything longer is a `DURATION.morph` constant
 * and a motion-system decision, not an inline number.
 *
 * ------------------------------------------------------------------------
 * REDUCED MOTION needs no code here. `MotionConfig reducedMotion="user"` drops
 * transform AND layout animation while keeping opacity, so the cover simply
 * appears at its final rect. That is the correct behaviour and it is why this
 * file contains no media query and no second branch.
 *
 * IT MUST NEVER BE WRAPPED IN A `<Reveal>`, and `ProjectDetail.tsx` states both
 * reasons: it is that page's LCP element and `Reveal` writes `opacity: 0` into
 * server HTML, and a morph target must not have an animating ancestor.
 */
export type CoverFrameProps = {
  /** Slug-scoped, so five cards and one open cover can never contend. */
  layoutId: string;
  /** The frame's border and display. Passed in so the token stays in
   *  `ProjectDetail`, which owns the page's visual decisions. */
  className: string;
  /** `imageWidthCap()`'s `min(57rem, src.width)`. Same reason. */
  style: CSSProperties;
  /** THE `<Image>`, AND NOTHING ELSE. See the one-child contract above. */
  children: ReactNode;
};

export function CoverFrame({
  layoutId,
  className,
  style,
  children,
}: CoverFrameProps) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={{ duration: DURATION.ui, ease: EASE.reveal }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export default CoverFrame;
