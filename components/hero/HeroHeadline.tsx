"use client";

/**
 * The hero's DOM layer: heading, identity statement, scroll cue.
 *
 * COMPOSITION — deliberately asymmetric, and this is the decision that most
 * distinguishes the hero from the default. The generic hero is a vertically
 * centred stack (name / tagline / centred cue). Here the command sphere is an
 * object floating in a space and this text is an annotation anchored to the
 * bottom-left of the frame — two different registers, which also quietly
 * reinforces the split between "the canvas is the spectacle" and "the DOM is
 * the content". Bottom-right stays empty; the negative space is load-bearing.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useLenis } from "lenis/react";

import {
  HERO_NAME,
  HERO_SPHERE_DESCRIPTION,
  HERO_TAGLINE_UNITS,
} from "@/components/hero/heroContent";
import { ABOUT_HEADING } from "@/components/sections/aboutContent";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { DURATION, EASE, STAGGER } from "@/lib/animation/easing";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** Shared by both layouts so the cue provably does not move between them. */
const INSET_CLASSES = "left-md sm:left-xl lg:left-2xl bottom-lg sm:bottom-xl";

/**
 * THE DECRYPT'S TWO CADENCES.
 *
 * `TAGLINE_REVEAL_MS` is how long one character waits before the next one locks
 * in, so a unit's decrypt lasts `length × this`. The two units are 24 and 22
 * characters, which at 34ms is **816ms and 748ms**; unit 2 starts one
 * `STAGGER.line` (100ms) later, so the two land 32ms apart and read as one
 * gesture finishing rather than as two effects. That is the whole reason for
 * the number: it is solved from the unit lengths, not chosen for feel. Editing
 * `HERO_TAGLINE_UNITS` changes the arithmetic — the split is fixed at two
 * units, but their lengths are not.
 *
 * `TAGLINE_FLIP_MS` is how fast the unresolved characters churn. 55ms is ~18
 * changes a second: fast enough to read as ciphertext rather than as a slot
 * machine, slow enough that the eye can see individual characters land. It also
 * sets the render rate — `encrypted-text.tsx`'s deviation 6 — at one commit per
 * flip rather than one per frame, so this is ~18 renders a second of ~46 spans
 * for under a second, and nothing during the hand-off.
 *
 * NEITHER BELONGS IN `lib/animation/easing.ts`. That module is the site's
 * motion VOCABULARY, and `DURATION.hero`'s removal note is the standing warning
 * about putting a single sequence's internal timings there: a tuned-sounding
 * constant with no callers reads as load-bearing forever. These two describe
 * one effect in one place.
 */
const TAGLINE_REVEAL_MS = 34;
const TAGLINE_FLIP_MS = 55;

/**
 * THE LINE COMES APART AGAIN EVERY 20 SECONDS, AND REASSEMBLES.
 *
 * Saad's ticket: "can we do a 20s timer for the effect to go in reverse and
 * then again in the text that is there". So a cycle is REVERSE THEN FORWARD,
 * with no pause between the two halves — the line unwinds from its right edge
 * back into ciphertext and immediately resolves again, which reads as one
 * gesture rather than as two events with an unreadable gap in the middle.
 *
 * 20s IS THE FLIP BOARD'S CADENCE. `content/flipBoard.ts`'s
 * `FLIP_BOARD_DWELL_MS` is the same number on `/about`, and matching it is
 * deliberate: this site has one ambient-loop tempo, and two nearby-but-unequal
 * ones would be a decision nobody made.
 *
 * THE REVERSE IS FASTER THAN THE FORWARD — 18ms a character against 34ms — and
 * that asymmetry is the whole reason it reads as a decrypt rather than as a
 * wipe running back and forth. The line falls apart in 0.43s and is put back
 * deliberately over 0.82s. A cycle is therefore ~1.25s including the 0.10s
 * stagger, which leaves the sentence fully legible **94%** of the time.
 *
 * THAT 6% IS THE ONE THING TO WATCH, and it is worth stating plainly because it
 * is the site's positioning statement: a visitor who happens to look at this
 * line during a cycle sees ciphertext. If it ever reads as too much, the lever
 * is `TAGLINE_REPEAT_MS` upward — 30s puts it at 4% — and not the durations,
 * which are what make the effect legible as an effect. Setting it to 0 would
 * also be a clean retirement: the component runs the first decrypt and stops.
 */
const TAGLINE_REPEAT_MS = 20000;
const TAGLINE_ENCRYPT_MS = 18;

type HeroHeadlineProps = {
  /**
   * The hand-off is finished — the Intro's plate is gone.
   *
   * IT NO LONGER GATES THE TAGLINE. It used to gate everything in this
   * component; `taglineBeat` took the identity statement off it, and what is
   * left on this wire is the scroll cue's mount. The two are deliberately not
   * merged: the ticket that introduced the decrypt asks for it to be "purely
   * additive on the tagline, not something that shifts other elements", and a
   * control that only exists once there is something to scroll to is not the
   * thing being retimed.
   */
  revealed: boolean;
  /**
   * The tagline's own beat, deliberately later than `revealed`. `Hero.tsx`'s
   * `TAGLINE_BEAT_S` carries the derivation and the lever.
   */
  taglineBeat: boolean;
  /**
   * No canvas subject: the <h1> becomes the visible headline and this whole
   * block moves from bottom-anchored to vertically centred.
   *
   * THE LIVE HERO PASSES FALSE, and deleting the SAAD wordmark did not change
   * that. It is tempting — there is no visible name on the surface now — but
   * flipping it also moves the tagline, and the name is deliberately delivered
   * by the Intro and carried afterwards by the navbar's MS mark rather than
   * restated here.
   */
  fallback: boolean;
  /**
   * False when the hero is scrolled out of view or the tab is hidden.
   *
   * IT HAS TWO CONSUMERS NOW, which is why it is no longer called `cueActive`.
   * The scroll cue's infinite loop was the first: the note here read "an
   * infinite DOM loop otherwise keeps a rAF alive for the whole page", and that
   * is the same argument, word for word, against a tagline that re-encrypts
   * itself every 20 seconds on a hero nobody is looking at.
   *
   * A CYCLE ALREADY IN FLIGHT IS NOT INTERRUPTED, deliberately — only the
   * interval that would start the NEXT one stops. Killing a running cycle would
   * leave the tagline frozen as half ciphertext for as long as the visitor
   * stayed away, and the state that fixes that is state this component would
   * have to invent. Every cycle that starts, finishes; the worst case is ~1.25s
   * of rAF after the hero leaves the viewport.
   */
  heroActive: boolean;
};

export function HeroHeadline({
  revealed,
  taglineBeat,
  fallback,
  heroActive,
}: HeroHeadlineProps) {
  const reducedMotion = useReducedMotion();

  /*
    THE REPEAT'S CLOCK, AND THERE IS EXACTLY ONE OF IT.

    `EncryptedText`'s `cycle` docblock has the arithmetic; the short version is
    that a cycle's length depends on the string, the two units differ by two
    characters, and two private intervals would drift ~104ms per cycle until the
    lines were seconds out of step. One counter here cannot.

    IT STARTS AT THE BEAT, NOT AT MOUNT, so the first repeat lands 20s after the
    opening decrypt begins rather than 20s after a page load that was still
    playing the Intro. And it is torn down and rebuilt whenever `heroActive`
    changes, which means scrolling back to the hero restarts the full 20s rather
    than firing a cycle on arrival — the tagline should be a thing you notice,
    not a thing that greets you.
  */
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (!taglineBeat || !heroActive || reducedMotion) return;
    const timer = window.setInterval(
      () => setCycle((n) => n + 1),
      TAGLINE_REPEAT_MS,
    );
    return () => window.clearInterval(timer);
  }, [taglineBeat, heroActive, reducedMotion]);

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

            Hidden in the normal path. The justification used to be that its
            visible rendering WAS the 3D logotype and two typographic treatments
            of one word in a viewport is the thing to avoid. The logotype is
            gone, and the reason is now the Intro: it delivers the full name at
            full size and reduces it to the MS mark — the same mark the navbar
            carries afterwards — so the identity is stated as a move rather than
            as a heading. ("contracts it INTO THE NAVBAR'S mark" overstated it:
            the reduction happens on the Intro's own plate, and the navbar's
            mark arrives separately as the bar slides in.) In the fallback
            arrangement there is no such move to lean on, so it becomes visible.
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

          {/*
            THE IDENTITY STATEMENT DECRYPTS. It used to rise on a mask — each
            unit in its own `overflow-hidden` line box, travelling 105% of that
            box over 0.70s — and that mask is GONE rather than layered under
            this. Two reasons, and the first is the ticket's:

              - The scramble IS the reveal now. Running both would put two
                motions on one element inside a window whose whole point is to
                hold ONE beat, which is the pile-up this retiming exists to
                undo.
              - `encrypted-text.tsx` gives every character its own
                absolutely-positioned box while it runs (its deviation 3, so the
                line cannot reflow mid-scramble). A `y` transform on the line
                box above that is a second coordinate space moving underneath a
                set of glyphs that are already being repositioned per frame.

            WHAT SURVIVES OF THE OLD BLOCK: the units are still two stacking
            block elements and never a <br> — a <br> cannot reflow at 360px,
            cannot carry per-unit timing, and could not have carried a
            per-unit `EncryptedText` either. And they still stagger by
            `STAGGER.line`, in document order, which is the monotonic-delay rule
            that constant's docblock states.

            The opacity fade is kept at 0.28s: without it the ciphertext would
            hard-pop into an otherwise settled frame. It is a fade, so it is
            also what a reduced-motion visitor gets — `MotionConfig`'s
            `reducedMotion="user"` drops transforms and keeps opacity, and
            `EncryptedText` independently renders the finished string on that
            path.
          */}
          <p className="text-h4 max-w-[34ch] text-hero-fg">
            {HERO_TAGLINE_UNITS.map((unit, index) => (
              <span key={unit} className="block">
                <motion.span
                  className="block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: taglineBeat ? 1 : 0 }}
                  transition={{
                    duration: 0.28,
                    ease: EASE.hero,
                    delay: index * STAGGER.line,
                  }}
                >
                  <EncryptedText
                    text={unit}
                    play={taglineBeat}
                    // The same offset the fade above uses, so a unit's
                    // ciphertext appears and starts resolving on one schedule
                    // rather than two.
                    startDelayMs={index * STAGGER.line * 1000}
                    revealDelayMs={TAGLINE_REVEAL_MS}
                    encryptDelayMs={TAGLINE_ENCRYPT_MS}
                    flipDelayMs={TAGLINE_FLIP_MS}
                    cycle={cycle}
                    // The unresolved characters are `hero-accent` (#14B8A6,
                    // 8.00:1 on `hero-surface`) and the resolved ones inherit
                    // `text-hero-fg` from the <p>. This is the pinned Tier 1
                    // teal, NEVER `accent-working`: globals.css's hero block
                    // states the rule for this surface, and the scroll cue's
                    // focus ring below is the other consumer of it.
                    //
                    // The colour is doing work, not decoration. The ciphertext
                    // reads as the sphere's material — same accent, same
                    // alphabet — and the sentence resolves OUT of it into the
                    // page's own ink, which is the positioning of the site in
                    // one gesture.
                    encryptedClassName="text-hero-accent"
                  />
                </motion.span>
              </span>
            ))}
          </p>

          {/*
            THE SPHERE'S ONE LINE OF ACCESSIBLE TEXT.

            The canvas is `aria-hidden`, which on its own would leave a screen
            reader with silence exactly where this site spends its one spectacle
            beat. `Skills.tsx` records the same trap and the same fix: hiding a
            visual device is right, hiding it with NOTHING in its place is the
            bug. One sentence stating what is on screen is the substitute — not
            ninety command strings, which would be an unstructured word salad
            spoken ahead of the positioning statement.

            AFTER the tagline, deliberately. The stance gets said first; the
            sphere is decoration that happens to be informative.

            Not `role="img"` + `aria-label` on the <canvas>: support for that
            pattern is inconsistent, and it would put the string outside this
            block, where reading order is actually controlled.
          */}
          <p className="sr-only">{HERO_SPHERE_DESCRIPTION}</p>
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
              active={heroActive && !reducedMotion}
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
