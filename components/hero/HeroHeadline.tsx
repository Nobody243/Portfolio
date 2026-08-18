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
import { useLenis } from "lenis/react";

import { HERO_NAME, HERO_TAGLINE_UNITS } from "@/components/hero/heroContent";
import { ABOUT_HEADING } from "@/components/sections/aboutContent";
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
          A REAL CONTROL as of Ticket 4, now that there is a real section below
          the hero to scroll to. It is mounted only once the hero has settled:
          a focusable button sitting at opacity 0 would put keyboard focus on
          something invisible, which is worse than not having it.

          `aria-hidden` has moved OFF this wrapper and onto the <svg> — the
          chevron is decoration, but the button is not.
        */}
        <div className={`absolute ${INSET_CLASSES}`}>
          {revealed ? (
            <ScrollCueButton
              active={cueActive && !reducedMotion}
              reducedMotion={reducedMotion}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ScrollCueButton({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  // Undefined under reduced motion — LenisProvider never instantiates Lenis
  // there — which is exactly why the fallback below is not optional.
  const lenis = useLenis();

  const handleClick = () => {
    if (lenis) {
      lenis.scrollTo("#trajectory");
      return;
    }
    // Reduced-motion path: native scroll, and deliberately `behavior: "auto"`.
    // Animating the jump for someone who asked for less motion would defeat
    // the preference at the exact moment it matters most.
    document
      .getElementById("trajectory")
      ?.scrollIntoView({ behavior: "auto" });
  };

  return (
    <button
      type="button"
      // Named from the destination's own approved heading rather than typed
      // here. The label is the ONLY name this control has — there is no
      // visible text — so a literal would be an invented, unreviewed string
      // that no audit could catch: WCAG 2.5.3 compares a label against visible
      // text, and there is none to compare against.
      //
      // It previously read "Scroll to About", which announced a destination
      // that does not exist: the section is headed "Trajectory", and "About"
      // is the exact word the content decision rejected. Importing the
      // constant means the two cannot drift apart again.
      //
      // The import is cheap: aboutContent.ts is a plain data module with no
      // "use client" and no dependencies.
      aria-label={`Scroll to ${ABOUT_HEADING}`}
      onClick={handleClick}
      // `pointer-events-auto` IS LOAD-BEARING. HeroHeadline's outermost
      // container is `pointer-events-none` so the canvas behind it stays
      // interactive; without this the button would be perfectly
      // keyboard-operable and completely mouse-dead — a keyboard audit would
      // pass while a sighted user clicked a control that does nothing, and
      // nothing would error.
      //
      // Focus ring is `hero-accent`, NEVER `accent-working`. This is the first
      // focusable element on the pinned dark hero surface, and it is the
      // consumer whose scheduled existence justified shipping that token:
      // `accent-working` flips to its light-mode value on a surface that does
      // not flip, landing at ~3.6:1 instead of 7.95:1.
      className="pointer-events-auto cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hero-accent"
    >
      <ScrollCue active={active} reducedMotion={reducedMotion} />
    </button>
  );
}

function ScrollCue({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  // A single chevron. Explicitly not: the mouse-body-with-a-dot icon, a double
  // or triple chevron, a bouncing circle, or a line that draws itself downward
  // — all portfolio-template signatures.
  const chevron = (
    <svg
      aria-hidden
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
    // Present and legible, but not moving. Appearing instantly with no fade is
    // correct here; that is the point of this branch.
    //
    // The `visible` guard that used to live here has moved up to the parent,
    // which now mounts this component only once the hero has settled. That
    // guard existed because the chevron otherwise painted at full opacity from
    // first paint, underneath the loader that shares this exact anchor at
    // every breakpoint — mount-gating preserves that, and additionally keeps
    // the button out of the tab order until there is something to scroll to.
    return <div className="text-hero-fg/55">{chevron}</div>;
  }

  return (
    <motion.div
      className="text-hero-fg"
      initial={{ opacity: 0 }}
      animate={
        active
          ? {
                // One continuous downward PASS with fades at both ends, rather
                // than a yo-yo bob — direction and flow instead of a nervous
                // tic. The repeatDelay matters: a gapless loop is a spinner.
              y: [0, 3, 11, 14],
              opacity: [0, 0.55, 0.55, 0],
            }
          : { opacity: 0.55, y: 0 }
      }
      transition={
        active
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
