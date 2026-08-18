"use client";

/**
 * The hero's DOM layer: heading, identity statement, scroll cue.
 *
 * COMPOSITION — deliberately asymmetric, and this is the decision that most
 * distinguishes the hero from the default. The generic hero is a vertically
 * centred stack (name / tagline / centred cue). Here the 3D wordmark is an
 * object floating in a space and this text is an annotation anchored to the
 * bottom-left of the frame — two different registers, which also quietly
 * reinforces the split between "the geometry is a logotype" and "the DOM is
 * the content". Bottom-right stays empty; the negative space is load-bearing.
 */

import { motion } from "motion/react";

import { HERO_NAME, HERO_TAGLINE_UNITS } from "@/components/hero/heroContent";
import { DURATION, EASE, STAGGER } from "@/lib/animation/easing";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** Shared by both layouts so the cue provably does not move between them. */
const INSET_CLASSES = "left-md sm:left-xl lg:left-2xl bottom-lg sm:bottom-xl";

type HeroHeadlineProps = {
  /** The staggered reveal is gated on the camera finishing. */
  revealed: boolean;
  /** No 3D layer: the <h1> becomes the visible headline. */
  fallback: boolean;
  /** False when the hero is scrolled out of view or the tab is hidden — an
   *  infinite DOM loop otherwise keeps a rAF alive for the whole page. */
  cueActive: boolean;
};

export function HeroHeadline({
  revealed,
  fallback,
  cueActive,
}: HeroHeadlineProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="relative mx-auto h-full w-full max-w-[1440px]">
        <div
          className={[
            "absolute right-md left-md sm:right-xl sm:left-xl lg:left-2xl",
            // The cue is absolutely positioned at the bottom inset in BOTH
            // layouts, so it is provably in the same place. The live layout
            // therefore has to reserve room for it: the cue's own 20px plus
            // the gap above it. The 1.25rem is the icon's size, not a spacing
            // decision, which is why it is not a spacing token.
            fallback
              ? "top-1/2 -translate-y-[54%]"
              : "bottom-[calc(var(--spacing-lg)+var(--spacing-md)+1.25rem)] sm:bottom-[calc(var(--spacing-xl)+var(--spacing-md)+1.25rem)]",
          ].join(" ")}
        >
          {/*
            ALWAYS in the DOM — only the class changes. Nothing is conditionally
            mounted, so there is no structural hydration mismatch: the server
            renders `sr-only` (matching the "assume WebGL works" server
            snapshot) and a post-hydration class swap is a normal attribute
            update.

            Hidden in the normal path because its visible rendering IS the 3D
            logotype, and two typographic treatments of the same word in one
            viewport is the thing to avoid. When there is no logotype that
            justification evaporates, so it becomes visible — otherwise a
            portfolio hero would show no name at all.
          */}
          <h1
            className={
              fallback
                ? "text-h1 mb-lg text-hero-fg"
                : "sr-only"
            }
          >
            {HERO_NAME}
          </h1>

          <p className="text-h4 max-w-[34ch] text-hero-fg">
            {HERO_TAGLINE_UNITS.map((unit, index) => (
              // Each unit gets its own overflow-hidden line box. The reveal is
              // a MASK — the text emerges from behind a hard edge rather than
              // floating up from an arbitrary offset, which is what makes it
              // read as typographic craft instead of a component-library
              // default. Travel is the line box itself.
              //
              // These are two stacking block elements, never a <br>: a <br>
              // cannot reflow on a narrow phone, cannot carry per-unit stagger
              // timing, and cannot be wrapped in a mask.
              <span key={unit} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "105%", opacity: 0 }}
                  animate={
                    revealed ? { y: "0%", opacity: 1 } : { y: "105%", opacity: 0 }
                  }
                  transition={{
                    y: {
                      duration: 0.7,
                      ease: EASE.hero,
                      delay: index * STAGGER.line,
                    },
                    opacity: {
                      duration: 0.28,
                      ease: EASE.hero,
                      delay: index * STAGGER.line,
                    },
                  }}
                >
                  {unit}
                </motion.span>
              </span>
            ))}
          </p>
        </div>

        {/*
          Decorative in this ticket: `aria-hidden`, no click target. The only
          thing below the hero right now is a spacer, and a control that
          scrolls to an empty placeholder is a dead affordance. Ticket 4
          promotes it to a real <button aria-label="Scroll to About"> — and its
          focus ring must use `hero-accent`, never `accent-working`.
        */}
        <div className={`absolute ${INSET_CLASSES}`} aria-hidden>
          <ScrollCue
            visible={revealed}
            active={cueActive && !reducedMotion}
            reducedMotion={reducedMotion}
          />
        </div>
      </div>
    </div>
  );
}

function ScrollCue({
  visible,
  active,
  reducedMotion,
}: {
  visible: boolean;
  active: boolean;
  reducedMotion: boolean;
}) {
  // A single chevron. Explicitly not: the mouse-body-with-a-dot icon, a double
  // or triple chevron, a bouncing circle, or a line that draws itself downward
  // — all portfolio-template signatures.
  const chevron = (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 9l7 7 7-7" />
    </svg>
  );

  if (reducedMotion) {
    // Present and legible, but not moving.
    return <div className="text-hero-fg/55">{chevron}</div>;
  }

  return (
    <motion.div
      className="text-hero-fg"
      initial={{ opacity: 0 }}
      animate={
        visible
          ? active
            ? {
                // One continuous downward PASS with fades at both ends, rather
                // than a yo-yo bob — direction and flow instead of a nervous
                // tic. The repeatDelay matters: a gapless loop is a spinner.
                y: [0, 3, 11, 14],
                opacity: [0, 0.55, 0.55, 0],
              }
            : { opacity: 0.55, y: 0 }
          : { opacity: 0 }
      }
      transition={
        visible && active
          ? {
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.6,
              times: [0, 0.25, 0.75, 1],
              // Linear on the travel: easing it in AND out makes each pass read
              // as a separate bounce, which is the thing being avoided.
              y: { ease: "linear" },
              opacity: { ease: EASE.ui },
              delay: 0.4,
            }
          : { duration: DURATION.ui, ease: EASE.hero }
      }
    >
      {chevron}
    </motion.div>
  );
}

export default HeroHeadline;
