"use client";

/**
 * `/about`'s four entrance units, re-triggered by the Intro's hand-off.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE BUG IT REPAIRS, AND IT IS A BUG THE INTRO'S RELOCATION CREATED.
 *
 * `Reveal` is `whileInView` at `amount: 0.1`, `once: true`. On a hard load the
 * document is at scroll 0 and every above-the-fold unit fires on the first
 * observer tick after mount — at ~t=0, BEHIND AN OPAQUE PLATE that does not
 * start dissolving until ~2.2s. All four units settle at 1.00s
 * (0 / 0.10 / 0.20 / 0.30 + `DURATION.reveal`), roughly 1.4s before anyone can
 * see the page. The visitor's first sight of `/about` is a finished page.
 *
 * MEASURED before this commit, on a production build: a hard load of `/about`
 * with the Intro playing lands with all four `[data-reveal]` units already at
 * opacity 1. That is the failure `RevealFooter.tsx` names — a reveal that
 * animates in secret.
 *
 * So the arrival off Home is not an invention; it is the repair.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * NOTHING NEW IS AUTHORED. Same property, same curve, same duration, same
 * `delay` prop — `Reveal` is untouched and stays byte-identical, which
 * `ScrubReveal`'s header requires. What changes is the TRIGGER, and the gate
 * is at the CALL SITE, which is this component. `AboutScreen` swaps `<Reveal>`
 * for `<AboutEntrance>` and changes nothing else.
 *
 * ONSET IS `onHandoff` + 0.20s, WHICH IS `STAGGER.line * 2` — an existing
 * constant, not a new number. The delay is not decoration: the plate's dissolve
 * is 0.55s and `EASE.reveal` is 97.6% done by 56% of its duration, so an
 * entrance fired ON the hand-off would be 97.6% finished at the frame the plate
 * crosses 50% opacity — the secret-animation bug reproduced exactly. At +0.20s
 * the first unit is 61.2% remaining at plate-50% and 87.5% done at plate-clear,
 * which matches Home's own margin. Home's incoming half is long and back-loaded
 * so its plate can start late; off Home the incoming half is short and
 * front-loaded, so the ENTRANCE is what has to start late. That is why the two
 * seams are arranged in opposite orders.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT RE-KEYS `Reveal` RATHER THAN WITHHOLDING IT, AND THAT IS A DELIBERATE
 * DIVERGENCE FROM THE PLAN THAT SPECIFIED IT.
 *
 * The design brief says the call site should hold its `Reveal`s until
 * `arriving`. Implemented literally — `{arriving ? <Reveal>…</Reveal> : null}` —
 * it works, and it costs something the brief did not weigh: `IntroProvider`
 * decides `shouldPlay === true` during PRERENDER (every flag is false on the
 * server, by construction), so `arriving` is false in the static HTML, and
 * `/about`'s entire content — the paragraph, the action row, the portrait —
 * would be absent from the prerendered document rather than present at
 * `opacity: 0` with the `<noscript>` net over it. MEASURED: `/about`'s served
 * `<body>` DOM is 15092 bytes; the four units are most of it.
 *
 * Re-keying keeps the served HTML byte-identical to today's and keeps the
 * content in the accessibility tree for the whole sequence. The cost is a
 * subtree remount at hand-off + 0.20s, and it has NO visual signature: the
 * state the remount lands in — `opacity: 0`, `y: 13` — is exactly the state the
 * entrance is supposed to start from, behind a plate that is still 87% opaque
 * at that frame.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * NO PATHNAME CHECK, AND NO DOM PREDICATE EITHER. The sanctioned predicate for
 * "is this the route with a hero stage" is a DOM read (`Intro.tsx` uses it to
 * choose between the camera and the dissolve), and a DOM read cannot be done
 * during RENDER without lying on the server. It does not need to be: this
 * component is only rendered by `AboutScreen`, on a route that has no hero
 * stage by construction — which is the same fact the predicate would report.
 * If `/work`'s units ever want this, the wrapper is reusable as-is for the same
 * structural reason.
 *
 * REDUCED MOTION IS NOT GATED, AND THAT IS HOME'S RULE GENERALISED RATHER THAN
 * AN EXCEPTION TO IT. `Hero.tsx`: "the correct arrival for someone who asked
 * for less motion is to already be here." The reduced path is 0.55s total, so
 * gating would give that visitor a dark plate followed by a page assembling
 * over another second. The units fire on mount and finish behind the plate —
 * the one case on this site where "animates in secret" is the right answer.
 * The 0.20s onset is gated off with it: it exists to keep a 0.70s move in front
 * of a 0.55s dissolve, and under the preference neither is running.
 */

import { useState, type ReactNode } from "react";

import { useIntroHandoff } from "@/components/intro/IntroContext";
import { Reveal } from "@/components/ui/Reveal";
import { STAGGER } from "@/lib/animation/easing";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** `onHandoff` + this. `STAGGER.line * 2`, not a new constant — see the header
 *  for the arithmetic that picked it. */
const INTRO_ONSET_S = STAGGER.line * 2;

type AboutEntranceProps = {
  children: ReactNode;
  /** Passed straight through. The four units keep 0 / 0.10 / 0.20 / 0.30. */
  delay?: number;
  className?: string;
  fadeOnly?: boolean;
};

export function AboutEntrance({
  children,
  delay = 0,
  className,
  fadeOnly = false,
}: AboutEntranceProps) {
  const { arriving } = useIntroHandoff();
  const reducedMotion = useReducedMotion();

  /*
    HELD only while an Intro is actually in front of this page. On a client
    navigation the provider seeds `arriving` true in its first render, so this
    is false from frame 1 and the entrance behaves exactly as it did before this
    file existed — same trigger, same onset of 0.
  */
  const held = !arriving && !reducedMotion;

  /*
    Captured once, so the release can tell "this entrance was waiting for a
    hand-off" from "this entrance was never held". Only the first case gets the
    onset delay. A lazy initialiser rather than a render-time read for the same
    reason `PageStack`'s `firstAppearance` is one: it must not change under a
    re-render.
  */
  const [waitedForHandoff] = useState(() => held);

  return (
    <Reveal
      /*
        THE ONLY MECHANISM IN THIS FILE. Changing the key unmounts the `Reveal`
        and mounts a fresh one, so its `whileInView` observer re-arms and the
        entrance plays from `initial` at the hand-off instead of at mount.
        `once: true` is per-instance, so the new instance is not suppressed by
        the old one having fired.
      */
      key={held ? "held" : "released"}
      delay={delay + (waitedForHandoff && !reducedMotion ? INTRO_ONSET_S : 0)}
      className={className}
      fadeOnly={fadeOnly}
    >
      {children}
    </Reveal>
  );
}

export default AboutEntrance;
