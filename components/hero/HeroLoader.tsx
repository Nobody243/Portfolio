"use client";

/**
 * The preloader: an 89px hairline track and a mono percentage readout, sitting
 * at exactly the anchor the tagline will later occupy — so the hero has one
 * continuously-owned focal point from first paint through to the settled state.
 *
 * Not a big centred 0-100 counter, which is both fashionable and generic.
 *
 * HONESTY RULES, both load-bearing:
 *
 * 1. NO MINIMUM DISPLAY DURATION. A minimum hold is a timer pretending to be
 *    progress. Instead there is a display THRESHOLD: if loading finishes inside
 *    180ms the loader never appears at all and the hero goes straight to its
 *    reveal. That is the honest inverse — it never invents time, it only
 *    declines to show a loader when there was effectively nothing to load.
 *    (Below ~150ms an appear-then-disappear registers as a glitch rather than
 *    as information.)
 *
 * 2. NO WIDTH TRANSITION. The value is real bytes; a 300ms eased width tween
 *    would make a fast load look like a slow one, which is a fabricated
 *    progress curve by another route.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { EASE } from "@/lib/animation/easing";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** Milliseconds before the loader is allowed to appear at all. */
export const DISPLAY_THRESHOLD_MS = 180;

type HeroLoaderProps = {
  /** 0-1. Meaningless when `indeterminate`. */
  progress: number;
  indeterminate: boolean;
  /** Drives the exit fade; the loader unmounts when the hero leaves loading. */
  visible: boolean;
};

export function HeroLoader({ progress, indeterminate, visible }: HeroLoaderProps) {
  const reducedMotion = useReducedMotion();
  const [pastThreshold, setPastThreshold] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setPastThreshold(true),
      DISPLAY_THRESHOLD_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

  if (!pastThreshold) return null;

  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20"
      initial={{ opacity: 1 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: EASE.hero }}
    >
      <div className="relative mx-auto h-full w-full max-w-[1440px]">
        <div className="absolute bottom-lg left-md flex items-center gap-sm sm:bottom-xl sm:left-xl lg:left-2xl">
          {/* 89px is spacing-2xl — the track is a Fibonacci-scale measure, not
              an arbitrary width. */}
          <div className="relative h-[2px] w-2xl overflow-hidden bg-hero-fg/12">
            {indeterminate ? (
              // "We cannot measure this", said honestly: a 24px segment
              // traversing the track with a pause at each end. Not a
              // barber-pole, not a pulse, not an infinite spinner — and under
              // reduced motion it does not run at all.
              reducedMotion ? null : (
                <motion.div
                  className="absolute inset-y-0 w-[24px] bg-hero-fg"
                  initial={{ x: 0 }}
                  animate={{ x: [0, 0, 65, 65] }}
                  transition={{
                    duration: 1.6,
                    times: [0, 0.156, 0.844, 1],
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )
            ) : (
              <div
                className="absolute inset-y-0 left-0 bg-hero-fg"
                style={{ width: `${percent}%` }}
              />
            )}
          </div>

          {/* The hero's ONE use of mono, and exactly the licensed one: a
              technical numeric readout. No "%" glyph — the track supplies the
              context. */}
          <span className="text-caption font-mono text-hero-fg/50 tabular-nums">
            {indeterminate ? "--" : percent}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default HeroLoader;
