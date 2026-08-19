"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";

/**
 * Site-wide Framer Motion defaults.
 *
 * `reducedMotion="user"` is the important half: it makes every `motion`
 * component drop transform/layout animation and keep opacity when the OS
 * setting is on, which is exactly the fallback the Frontend Spec asks for —
 * without each section re-implementing its own media query.
 *
 * The default transition is the Tier 2/3 reveal curve, since that covers most
 * of the site. Two places override it locally rather than changing it here:
 * Tier 1 hero beats (`DURATION.hero` / `EASE.hero`), and Ticket 6b's card→cover
 * morph, which sets `DURATION.ui` + `EASE.reveal` on `CoverFrame`.
 *
 * THAT MORPH SHIPPED AS A TWEEN, NOT A SPRING. This header used to predict "it
 * may want a spring instead of a tween"; the prediction was tested and
 * rejected. A spring's overshoot would push the cover past its final rect —
 * visibly, against the `<h1>`'s fixed left edge one row below — and it would
 * introduce a fourth curve family into a three-ease system. `reducedMotion`
 * below is what turns the whole morph off for a user who asks for that: it
 * drops transform AND layout animation while keeping opacity, so the cover
 * appears at its final rect and the overlay's fade still runs.
 *
 * Renders no DOM element, so it can wrap anything without affecting layout.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: DURATION.reveal, ease: EASE.reveal }}
    >
      {children}
    </MotionConfig>
  );
}

export default MotionProvider;
