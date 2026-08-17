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
 * of the site. Two known places will override it locally rather than change it
 * here: Tier 1 hero beats (`DURATION.hero` / `EASE.hero`) and the Ticket 6
 * `layoutId` card morph, which may want a spring instead of a tween.
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
