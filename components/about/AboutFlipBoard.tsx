"use client";

import { useEffect, useState } from "react";

import { TextFlippingBoard } from "@/components/ui/text-flipping-board";
import {
  FLIP_BOARD_DWELL_MS,
  FLIP_BOARD_STRINGS,
} from "@/content/flipBoard";
import { useHoverCapable } from "@/lib/hooks/useHoverCapable";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * `/about`'s flip board — the rotation, the gates, and the reversal it carries.
 *
 * =========================================================================
 * THIS ELEMENT ENDS `/about`'s STATUS AS THE SITE'S ONE FULLY QUIET PAGE, AND
 * NO WORDING MAKES THAT UNTRUE. Saad asked for it explicitly on 2026-08-23.
 * `docs/07` §6 and `docs/03`'s motion-drivers section both carry the reversal,
 * recorded in the same commit as this file rather than left in a handoff note.
 * =========================================================================
 *
 * WHAT BECAME FALSE, so nobody reads the old sentences and "restores" the page:
 *
 *   1. `AboutScreen.tsx`'s absence 4: "nothing on this page ever moves again."
 *   2. `docs/07` §6's third motion property: "NO IDLE ANIMATION AT ALL —
 *      including while the cursor is resting on the page", measured at 301
 *      canvas frames per 5 idle seconds before `ambient="settled"` and 0 after.
 *      **The 0 is still true of the CANVAS and was re-measured after this
 *      landed.** What is no longer true is the page-level claim.
 *   3. `docs/03`: "every timed behaviour is a transient with an end state."
 *      An interval-driven flip is not. It is the same shape as `ParticleGrid`'s
 *      ambient drift, which was converted to `ambient="settled"` on 2026-08-22
 *      at commit-level cost with measurements attached — "an unbounded
 *      autonomous loop with no end state, the only one outside the hero."
 *   4. The motion-author count on arrival was one, which is the premise on
 *      which `/about`'s 0.35s route fade was DELETED. **That count is still
 *      one**: this board's first flip is at 7.0s and the entrance settles at
 *      0.90s, so nothing here authors motion during arrival. It becomes a
 *      second author AFTER arrival, which is the part that is genuinely new.
 *
 * THE MITIGATIONS ARE NOT OPTIONAL AND EACH ANSWERS A SPECIFIC OBJECTION:
 *
 *   - **It stops when the document is hidden.** This is the one that makes
 *     "permanently repeating" survivable: it cannot run unobserved in a
 *     background tab. `visibilitychange`, below.
 *   - **It does not exist under `prefers-reduced-motion: reduce`.** Not a
 *     shorter flip — the correct reduced-motion form of an ambient loop is its
 *     ABSENCE. One string, held forever. The strings are decorative, so nothing
 *     is lost.
 *   - **It is at rest 91% of the time** (6.37s of every 7.0s). The settled,
 *     fully legible string is the design; the flip is the transition between
 *     two resting frames.
 *
 * THE DEVICE GATE IS A CAPABILITY QUERY, NOT A WIDTH, AND THE DIFFERENCE IS THE
 * RULE. `docs/03`: "no behaviour may be specific to a breakpoint — a phone gets
 * the site's normal motion language, not a degraded Home. A mobile-only
 * parallax is still a breach under this wording, which is the test of whether
 * the rewrite is honest." `hidden lg:block`, or `width >= 1024 ? <Board/> :
 * null`, is that breach with the sign flipped. `(hover: hover) and (pointer:
 * fine)` is a statement about the DEVICE, it is the query
 * `text-hover-effect.tsx` already ships and documents at length, and it is
 * correct on a touch laptop where a width test is not.
 *
 * BE HONEST ABOUT WHAT THAT BUYS: a capability query does not truthfully mean
 * "not a phone", and inventing one that did would be the dishonest version of
 * the same breach. What it means here is that a device with no fine pointer
 * does not pay for an animation, and the phone outcome falls out as a
 * CONSEQUENCE of a general rule rather than as a special case — the same shape
 * `ambient="settled"` is praised for.
 *
 * GATE THE INTERVAL, NEVER THE MARKUP. The server snapshot of both hooks is
 * `false`, so removing the board in the un-capable branch would be a hydration
 * mismatch. The DOM is identical in every branch and only the timer differs:
 * the first string renders and simply never advances. `TextFlippingBoard` also
 * takes `flip={false}` there, so no flap element is ever created.
 *
 * NO `key` CHANGE, AND THAT IS DELIBERATE. The obvious way to re-trigger a
 * flip is to re-key the board, and `IntroEntrance` already uses that mechanism
 * on this page. It is the wrong one here: `CvModalHost`'s lesson was learned on
 * this exact page — "anything that unmounts a subtree on a timer will destroy
 * state below it", and a modal opened during the Intro was destroyed mid-view
 * because of it. `TextFlippingBoard`'s cells already re-flip when their
 * `target` prop changes, so passing a new string is enough and nothing
 * unmounts.
 *
 * NO POINTER HANDLERS, so the board cannot swallow `pointermove`.
 * `ParticleGrid` hangs its listener on the stage container and relies on
 * bubbling; a component that called `stopPropagation()` would punch a dead zone
 * into the field exactly where the board sits.
 */
export function AboutFlipBoard({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  const hoverCapable = useHoverCapable();
  const [index, setIndex] = useState(0);

  const rotating = hoverCapable && !reducedMotion;

  useEffect(() => {
    if (!rotating) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer !== null) return;
      timer = setInterval(() => {
        setIndex((n) => (n + 1) % FLIP_BOARD_STRINGS.length);
      }, FLIP_BOARD_DWELL_MS);
    };

    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };

    // Start only if the document is already visible: a page opened in a
    // background tab must not begin the loop it cannot be seen running.
    const onVisibility = () => (document.hidden ? stop() : start());
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [rotating]);

  return (
    <TextFlippingBoard
      text={FLIP_BOARD_STRINGS[index]}
      flip={rotating}
      className={className}
    />
  );
}

export default AboutFlipBoard;
