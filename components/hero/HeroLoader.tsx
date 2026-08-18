"use client";

/**
 * The preloader: an 89px hairline track and a mono percentage readout, sitting
 * at exactly the anchor the SCROLL CUE will later occupy — so the hero has one
 * continuously-owned focal point from first paint through to the settled
 * state.
 *
 * The scroll cue, NOT the tagline: these insets are character-for-character
 * HeroHeadline's INSET_CLASSES at every breakpoint (left-md sm:left-xl
 * lg:left-2xl, bottom-lg sm:bottom-xl), while the tagline block sits ~75px
 * higher. The cue is what inherits this spot once the loader retires.
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

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { EASE } from "@/lib/animation/easing";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** Milliseconds before the loader is allowed to appear at all. */
export const DISPLAY_THRESHOLD_MS = 180;

type HeroLoaderProps = {
  /** 0-1. Meaningless when `indeterminate`. */
  progress: number;
  indeterminate: boolean;
  /** False once loading has ended — in either branch. Drives the fade. */
  visible: boolean;
  /** Fired when the fade has actually finished, so the owner can unmount.
   *  The exit therefore depends on this component's own lifecycle rather than
   *  on how long some other phase happens to last. */
  onExited?: () => void;
};

export function HeroLoader({
  progress,
  indeterminate,
  visible,
  onExited,
}: HeroLoaderProps) {
  const reducedMotion = useReducedMotion();

  /**
   * ARMED, not merely "past the threshold" — and once armed it stays armed.
   *
   * Two requirements pull in opposite directions here. The loader must survive
   * past the end of loading so its 0.30s exit fade can play (it is mounted
   * until the hero settles). But it must ALSO never appear if loading finished
   * inside the threshold window — otherwise a fast load would pop the loader
   * onto the screen 180ms in, mid-pull-back, purely because the timer was
   * still pending. That flash is exactly the glitch the threshold exists to
   * prevent, just moved later.
   *
   * So the timer arms the loader only if it is STILL loading when it fires.
   */
  const [armed, setArmed] = useState(false);

  // Written in an effect rather than during render: the timeout below needs
  // the current value at fire time, and putting `visible` in its dependency
  // array would restart the threshold window every time the value changed.
  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  // Same reason as `visibleRef`: the threshold timer must not restart just
  // because the callback identity changed.
  const onExitedRef = useRef(onExited);
  useEffect(() => {
    onExitedRef.current = onExited;
  }, [onExited]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (visibleRef.current) {
        setArmed(true);
      } else {
        // Loading already finished inside the threshold window, so this loader
        // will never appear at all. Retire immediately rather than sitting
        // mounted rendering null for the rest of the session — the owner keys
        // the mount off this callback now, not off a phase.
        onExitedRef.current?.();
      }
    }, DISPLAY_THRESHOLD_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!armed) return null;

  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20"
      initial={{ opacity: 1 }}
      animate={{ opacity: visible ? 1 : 0 }}
      // Belt and braces for the case where the owner removes this element
      // outright (a mid-load drop to the WebGL fallback) rather than letting
      // it fade first.
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE.hero }}
      // Guarded on `!visible`: this also fires for the no-op 1 -> 1 settle on
      // mount, and retiring there would unmount the loader instantly.
      //
      // A 0.30s opacity crossfade is kept under reduced motion deliberately.
      // MotionProvider's own comment states that `reducedMotion="user"` drops
      // transform and layout animation and KEEPS opacity — so the fade is the
      // house position and the hard cut was the inconsistent branch. Opacity
      // is not vestibular motion. A timed settle beat would have been the
      // wrong fix twice over: it is exactly the fabricated-duration category
      // this component's own honesty rules rule out.
      onAnimationComplete={() => {
        if (!visible) onExited?.();
      }}
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
