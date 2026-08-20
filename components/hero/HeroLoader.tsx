"use client";

/**
 * The preloader: an opaque plate carrying a flat `SAAD` mark and the real
 * progress readout, wiped away by a circular `clip-path` to reveal the
 * extruded wordmark already rendering behind it.
 *
 * WHAT THE WIPE REVEALS IS LIVE, NOT A STILL. `visible` goes false at exactly
 * the moment the hero enters `revealing`, so the 1.1s wipe and the 1.45s
 * camera pull-back run CONCURRENTLY. The plate opens onto a camera already in
 * motion and the two settle together. Sequencing them instead — wipe, then
 * pull-back — was the other option and it costs 2.5s before the hero is
 * readable, with the site's signature beat hidden behind an opaque plate for
 * the half of it that matters.
 *
 * THE FLAT MARK IS DELIBERATELY FLAT. It is Space Grotesk, the same face the
 * extruded geometry is built from, so the wipe reads as the same word gaining
 * a third dimension rather than as one logo swapping for another. Rendering
 * real `Text3D` here would mean a second WebGL canvas, mounted during the
 * exact window where the first one is compiling shaders.
 *
 * HONESTY RULES, both load-bearing and both PRESERVED from the bar-and-readout
 * loader this replaces:
 *
 * 1. NO MINIMUM DISPLAY DURATION, and no scripted reveal clock. The brief for
 *    this component specified a fixed timeline — mark at 150ms, recolour at
 *    650ms, wipe at 1050ms, done at 2650ms — and a fixed wipe time is a timer
 *    pretending to be progress, which is the one thing this component has
 *    always refused. What is kept is the LOOK; what drives it is the real
 *    event. The wipe fires when loading actually ends, whether that is at
 *    300ms or 6s. The only fixed timings below are the mark's own entrance,
 *    which animates a UI element rather than describing a download.
 *
 *    The display THRESHOLD stays too: if loading finishes inside 180ms the
 *    plate never appears at all and the hero goes straight to its reveal. That
 *    is the honest inverse — it never invents time, it only declines to show a
 *    loader when there was effectively nothing to load.
 *
 * 2. NO WIDTH TRANSITION on the track. The value is real bytes; a 300ms eased
 *    width tween would make a fast load look like a slow one.
 *
 * COLOURS ARE TOKENS. The brief named `#3a4046` and `#bfeeff`; neither ships.
 * CLAUDE.md allows exactly two accents and `globals.css` is the source of
 * truth, so "muted" is `hero-fg` at low alpha and "ice" is `hero-fg` at full
 * strength lit by an `--accent-hero` glow. Same beat, no third accent.
 */

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionTemplate, useMotionValue } from "motion/react";

import { EASE } from "@/lib/animation/easing";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** Milliseconds before the loader is allowed to appear at all. */
export const DISPLAY_THRESHOLD_MS = 180;

/**
 * Set once a plate has actually been shown and wiped. A return visit inside
 * the same tab skips the plate entirely.
 *
 * SESSION, NOT LOCAL, and that is the whole point: the typeface and the
 * compiled shaders are warm in this tab, so a second full play would be
 * theatre over an instant load. A new tab is a cold cache and earns the plate
 * again. Read in an effect and never during render — `sessionStorage` does not
 * exist on the server, and branching on it while rendering is a hydration
 * mismatch.
 */
const SESSION_KEY = "hero-loader-played";

/**
 * Locks document scroll while the plate is up. Reuses the mechanism Ticket 6b
 * established for the project overlay — `overflow: clip` on <html>, declared
 * in `globals.css` — because Lenis does not exist under reduced motion and a
 * JS-only lock would silently do nothing there.
 *
 * No scrollbar-width compensation, unlike the overlay: the hero is the top of
 * the document and the plate covers it edge to edge, so there is no layout
 * behind it to shift.
 */
const SCROLL_LOCK_ATTR = "data-hero-loading";

/**
 * Two curves that are NOT in `lib/animation/easing.ts`, deliberately.
 *
 * `EASE` is the cross-component vocabulary and its own header says to resist
 * adding a fourth entry without a real reason. These are single-component
 * curves used nowhere else, so promoting them would grow the shared system by
 * two for one consumer. Both come from the brief and are kept at its values.
 */
const EASE_MARK_IN = [0.2, 0.9, 0.3, 1.3] as const; // slight overshoot
const EASE_WIPE = [0.76, 0, 0.24, 1] as const; // heavy in-out

/** Seconds. The mark's entrance — a UI element, not a progress claim. */
const MARK_IN_S = 0.5;
/** Seconds. Recolour + label, starting as the mark lands. */
const MARK_LIT_S = 0.4;
/** Seconds. The circular wipe. */
const WIPE_S = 1.1;
/** Seconds. Reduced-motion crossfade, and the plate's own opacity fallback. */
const FADE_S = 0.3;

type HeroLoaderProps = {
  /** 0-1. Meaningless when `indeterminate`. */
  progress: number;
  indeterminate: boolean;
  /** False once loading has ended — in either branch. Drives the wipe. */
  visible: boolean;
  /** Fired when the wipe has actually finished, so the owner can unmount.
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
   * Two requirements pull in opposite directions here. The plate must survive
   * past the end of loading so its wipe can play. But it must ALSO never
   * appear if loading finished inside the threshold window — otherwise a fast
   * load would pop an opaque plate over an already-visible hero 180ms in,
   * purely because the timer was still pending. That flash is exactly the
   * glitch the threshold exists to prevent, just moved later.
   *
   * So the timer arms the plate only if it is STILL loading when it fires.
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
    // A plate already played in this tab. Retire without ever rendering one —
    // this is the route-nav case (leave `/`, come back, Hero remounts).
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      onExitedRef.current?.();
      return;
    }

    const timer = window.setTimeout(() => {
      if (visibleRef.current) {
        setArmed(true);
      } else {
        // Loading already finished inside the threshold window, so this plate
        // will never appear at all. Retire immediately rather than sitting
        // mounted rendering null for the rest of the session — the owner keys
        // the mount off this callback now, not off a phase.
        //
        // The session flag is NOT written here. Nothing was shown, so there is
        // nothing to avoid repeating, and writing it would suppress the plate
        // on a later visit that genuinely needs one.
        onExitedRef.current?.();
      }
    }, DISPLAY_THRESHOLD_MS);
    return () => window.clearTimeout(timer);
  }, []);

  /* -----------------------------------------------------------------------
     Scroll lock. Attached only once the plate is actually on screen, so a
     sub-threshold load never touches the document at all.
  ----------------------------------------------------------------------- */
  useEffect(() => {
    if (!armed) return;
    const root = document.documentElement;
    root.setAttribute(SCROLL_LOCK_ATTR, "");
    return () => root.removeAttribute(SCROLL_LOCK_ATTR);
  }, [armed]);

  /* -----------------------------------------------------------------------
     The wipe.

     Driven through a motion value and `useMotionTemplate` rather than by
     handing Framer two `clip-path` STRINGS to interpolate. String
     interpolation of `circle()` works until someone changes one side's
     shape or units, at which point it stops animating and silently snaps —
     with no error. A number tweened into a template cannot do that.
  ----------------------------------------------------------------------- */
  const wipeRadius = useMotionValue(150);
  const clipPath = useMotionTemplate`circle(${wipeRadius}% at 50% 50%)`;

  useEffect(() => {
    if (!armed || visible) return;

    // Reduced motion takes the opacity branch below instead. Recording the
    // session flag still happens, on the same terms.
    if (reducedMotion) return;

    const controls = animate(wipeRadius, 0, {
      duration: WIPE_S,
      ease: [...EASE_WIPE],
      onComplete: () => {
        sessionStorage.setItem(SESSION_KEY, "1");
        onExitedRef.current?.();
      },
    });
    return () => controls.stop();
  }, [armed, visible, reducedMotion, wipeRadius]);

  if (!armed) return null;

  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <motion.div
      // z-40, ABOVE the hero's z-30 corner chrome. The plate is opaque and
      // covers the viewport; a theme toggle floating over a loading screen is
      // a leak, not a feature. It was z-20 first and the toggle punched
      // straight through. The wipe then reveals the toggle naturally, because
      // the clip-path removes the plate rather than fading it.
      className="absolute inset-0 z-40 bg-hero-surface"
      // Opacity is the reduced-motion exit AND the belt-and-braces path for a
      // mid-load drop to the WebGL fallback, where the owner removes this
      // element outright rather than letting the wipe run.
      initial={{ opacity: 1 }}
      animate={{ opacity: reducedMotion && !visible ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: FADE_S, ease: EASE.hero }}
      // Only the wipe path uses this; under full motion `clipPath` stays at
      // 150% until the wipe starts, which is a no-op mask over the whole plate.
      style={{ clipPath: reducedMotion ? undefined : clipPath }}
      onAnimationComplete={() => {
        // Guarded on both: this also fires for the no-op 1 -> 1 settle on
        // mount, and under full motion the wipe owns retirement.
        if (reducedMotion && !visible) {
          sessionStorage.setItem(SESSION_KEY, "1");
          onExited?.();
        }
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-lg">
        {/*
          Scale and opacity only — no `y`. A mark that also rises reads as a
          card entering, and this is meant to read as the word resolving into
          focus where it already is, on the spot the extruded one occupies.
        */}
        <motion.span
          className="text-h1 leading-none font-medium"
          initial={{ scale: 0.7, opacity: 0, color: "rgb(232 234 236 / 0.22)" }}
          animate={{
            scale: 1,
            opacity: 1,
            // The "muted -> ice" beat, in tokens. `hero-fg` at full strength is
            // the ice; the glow is what makes it read as lit rather than merely
            // brighter.
            //
            // THIS IS PART OF THE ENTRANCE AND IS NOT GATED ON LOADING ENDING.
            // It was written the other way first — `visible ? muted : lit` —
            // which is wrong in a way that looks right in the source: load
            // completion is also what starts the wipe, so the recolour fired
            // underneath a plate that was already dissolving and no visitor
            // ever saw it. Measured at t=2100ms mid-load, still muted. The
            // brief has this at 650-1050ms, i.e. during the load, and it is an
            // entrance animation on a UI element rather than a claim about
            // bytes, so a fixed delay is legitimate here.
            color: "rgb(232 234 236 / 1)",
            // TWO STOPS, not one. A single 32px/55% shadow was tried and the
            // four glyphs' halos merged into one soft rounded slab behind the
            // word — it read as a lit panel rather than as lit letters. A
            // tight bright stop plus a wide faint one keeps the falloff on the
            // letterforms.
            textShadow:
              "0 0 8px color-mix(in srgb, var(--accent-hero) 40%, transparent), 0 0 28px color-mix(in srgb, var(--accent-hero) 16%, transparent)",
          }}
          transition={{
            scale: { duration: MARK_IN_S, ease: [...EASE_MARK_IN] },
            opacity: { duration: MARK_IN_S, ease: [...EASE_MARK_IN] },
            color: { duration: MARK_LIT_S, ease: EASE.hero, delay: MARK_IN_S },
            textShadow: {
              duration: MARK_LIT_S,
              ease: EASE.hero,
              delay: MARK_IN_S,
            },
          }}
        >
          SAAD
        </motion.span>

        {/*
          The label under the mark IS the progress readout, not a decorative
          caption. The brief asked for "label text fades in under the mark";
          spending that slot on real bytes is what lets the plate look scripted
          without being scripted.
        */}
        <motion.div
          className="flex items-center gap-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: MARK_LIT_S,
            ease: EASE.hero,
            delay: MARK_IN_S,
          }}
        >
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
        </motion.div>
      </div>
    </motion.div>
  );
}

export default HeroLoader;
