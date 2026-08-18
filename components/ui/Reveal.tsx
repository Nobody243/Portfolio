"use client";

/**
 * The shared Tier 2/3 scroll reveal. One primitive, used unchanged by About
 * and by Tickets 5, 8, 9 and 10.
 *
 * IT MUST NOT GROW OPTIONS. A `Reveal` with a variant prop per section is how
 * a three-tier motion system turns into seven eases. If a section needs
 * something this cannot express, that is a designer request with reasoning,
 * not a new prop added during implementation.
 *
 * NEVER USED IN THE HERO. Tier 1 has its own curve, its own gating and its own
 * phase machine; reaching for this there would flatten the energy curve the
 * whole site is built around.
 *
 * WHY FRAMER AND NOT GSAP, given the hero uses GSAP: the codebase's split is
 * "GSAP owns scroll-SYNCED timelines, Framer owns DOM". A section reveal is
 * not scroll-synced — it is a one-shot state change triggered by an
 * intersection, with a start, an end and no scrubbing, and it never reads
 * scroll position after it fires. Framer also supplies the entire
 * reduced-motion fallback for free (see below) and is driven by
 * IntersectionObserver, so it cannot be desynchronised by a stale
 * ScrollTrigger cache.
 *
 * REDUCED MOTION is handled globally by MotionProvider's `reducedMotion="user"`,
 * which drops transform and layout animation and KEEPS opacity. So this
 * component needs no media query, no `useReducedMotion` call and no second
 * code path: the same declaration below degrades to a pure opacity fade.
 *
 * THE GUARANTEE THAT MATTERS: nothing may ever be left at `opacity: 0` because
 * an animation did not run. Two distinct failure modes, both handled outside
 * this file, because neither can be fixed from inside it:
 *   1. JS never runs / hydration fails — Framer writes `initial` into the
 *      server-rendered markup, so `opacity: 0` ships in the HTML and would be
 *      permanent. The `<noscript>` net in app/layout.tsx targets [data-reveal]
 *      and undoes it. That is why this component sets that attribute.
 *   2. The trigger can never fire because the element is taller than the
 *      viewport threshold — designed out by the hardcoded `amount` below.
 * Ticket 3 shipped two separate fixes for this class of bug. Do not
 * reintroduce it.
 */

import type { ReactNode } from "react";
import { motion } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";

/**
 * Travel distance, in pixels, mirroring `--spacing-sm` (13px).
 *
 * A literal rather than a token because this is a JS motion value handed to
 * Framer, not a CSS class — the same reason the hero's chevron keyframes are
 * numbers. It is upward-only and deliberately small: the plan caps slide
 * distance at 21px because beyond that the eye tracks moving text instead of
 * reading it.
 */
const TRAVEL_PX = 13;

/**
 * HARDCODED, AND DELIBERATELY NOT A PROP. This is the guard, not a default.
 *
 * `amount` is the fraction of the element that must be visible before the
 * reveal fires. Set it high — or expose it and let a section set it high — and
 * any block taller than the viewport becomes unsatisfiable, so the content
 * stays invisible FOREVER, on short viewports only. That is a bug that will
 * never appear on the machine it was built on.
 *
 * 0.1 against a required ceiling of 0.15, for margin. Worst case in About is
 * beat 2 at ~440px on a 360px-wide phone; at 0.1 the trigger needs 44px in
 * view, which is satisfiable with enormous room to spare.
 *
 * The rule that keeps this true: a Reveal target is always ONE unit — one
 * beat, one heading — never a whole section and never a group. If a future
 * edit wraps something taller than about two screens of copy, the guarantee
 * lapses and this value is not what should change.
 */
const VIEWPORT_AMOUNT = 0.1;

type RevealProps = {
  children: ReactNode;
  /**
   * Seconds. Merged onto the shared transition rather than replacing it.
   *
   * Kept deliberately small everywhere: the budget from a unit entering the
   * viewport to it being fully settled is ~1.0s, and `DURATION.reveal` already
   * spends 0.7s of that. A fast scroller must never be reading a paragraph
   * that is still assembling.
   */
  delay?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      // Consumed by the no-JS net in app/layout.tsx. Do not rename without
      // changing that selector in the same commit.
      data-reveal
      className={className}
      initial={{ opacity: 0, y: TRAVEL_PX }}
      whileInView={{ opacity: 1, y: 0 }}
      // `once` is mandatory, not a preference: a reveal that re-hides and
      // replays on scroll-up is a scroll-toy, and it makes re-reading the
      // section actively hostile.
      viewport={{ once: true, amount: VIEWPORT_AMOUNT }}
      transition={{
        // Both properties ride EASE.reveal — the shared Tier 2/3 curve — but
        // the fade is deliberately FRONT-LOADED at half the transform's
        // duration, so opacity reaches 1 while the element is still settling.
        // The last portion of the movement is then a sub-pixel drift on text
        // that is already fully readable, which is the whole point: motion
        // must not compete with reading.
        //
        // Expressed as a division rather than as 0.35 so it cannot drift if
        // DURATION.reveal is ever retuned.
        opacity: { duration: DURATION.reveal / 2, ease: EASE.reveal, delay },
        y: { duration: DURATION.reveal, ease: EASE.reveal, delay },
      }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
