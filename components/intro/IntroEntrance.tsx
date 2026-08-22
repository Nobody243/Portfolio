"use client";

/**
 * A destination's own entrance units, re-triggered by the Intro's hand-off.
 *
 * TWO CONSUMERS, ONE MECHANISM: `/about`'s four units (`AboutScreen.tsx`) and
 * `/work`'s `Projects` section (`Projects.tsx`, `motion="reveal"` branch only).
 * It was `components/about/AboutEntrance.tsx` and served the first alone; that
 * file already predicted the second in as many words — "if `/work`'s units ever
 * want this, the wrapper is reusable as-is for the same structural reason" —
 * and it turned out to be reusable with no new prop, so it MOVED rather than
 * being copied. It lives in `components/intro/` because the TRIGGER is what it
 * is about, and the trigger belongs to the Intro.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE BUG IT REPAIRS, AND IT IS A BUG THE INTRO'S RELOCATION CREATED.
 *
 * `Reveal` is `whileInView` at `amount: 0.1`, `once: true`. On a hard load the
 * document is at scroll 0 and every above-the-fold unit fires on the first
 * observer tick after mount — at ~t=0, BEHIND AN OPAQUE PLATE that does not
 * start dissolving until ~2.4s.
 *
 * MEASURED before the fix, on a production build at 1440x900, dark:
 *   `/about` — all four units settle at 1.00s (0 / 0.10 / 0.20 / 0.30 +
 *     `DURATION.reveal`), roughly 1.4s before anyone can see the page.
 *   `/work`  — units 0-4 (the "Work" heading and the first four cards) run
 *     131ms to 398ms and are at `y = 0`, `opacity = 1` at the frame the plate
 *     crosses 50%. 100% of the move, spent.
 *
 * The visitor's first sight of either route is a finished page. That is the
 * failure `RevealFooter.tsx` names — a reveal that animates in secret.
 *
 * So the arrival off Home is not an invention; it is the repair.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * NOTHING NEW IS AUTHORED. Same property, same curve, same duration, same
 * `delay` prop — `Reveal` is untouched and stays byte-identical, which
 * `ScrubReveal`'s header requires. What changes is the TRIGGER, and the gate
 * is at the CALL SITE. Each call site swaps `<Reveal>` for `<IntroEntrance>`
 * and changes nothing else.
 *
 * ONSET IS `onHandoff` + 0.20s, WHICH IS `STAGGER.line * 2` — an existing
 * constant, not a new number. The delay is not decoration: the plate's dissolve
 * is 0.55s and `EASE.reveal` is 97.6% done by 56% of its duration, so an
 * entrance fired ON the hand-off would be 97.6% finished at the frame the plate
 * crosses 50% opacity — the secret-animation bug reproduced exactly. Home's
 * incoming half is long and back-loaded so its plate can start late; off Home
 * the incoming half is short and front-loaded, so the ENTRANCE is what has to
 * start late. That is why the two seams are arranged in opposite orders.
 *
 * THE ONSET IS FLAT, WITH NO PER-UNIT STAGGER ADDED HERE, ON EITHER ROUTE.
 * `/about`'s 0 / 0.10 / 0.20 / 0.30 comes from its own call sites and predates
 * this file; `/work` adds none, because `Projects.tsx` refuses an index cascade
 * and the `delay` below is the SAME delay the scroll path uses. A stagger
 * passed here would therefore also land on the scroll-triggered firing of every
 * unit that was below the fold at the hand-off — which is exactly the cascade
 * that file rejects, arriving through the back door. See the scroll-path note
 * further down.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT RE-KEYS `Reveal` RATHER THAN WITHHOLDING IT, AND THAT IS A DELIBERATE
 * DIVERGENCE FROM THE PLAN THAT SPECIFIED IT.
 *
 * The design brief says the call site should hold its `Reveal`s until
 * `arriving`. Implemented literally — `{arriving ? <Reveal>...</Reveal> : null}`
 * — it works, and it costs something the brief did not weigh: `IntroProvider`
 * decides `shouldPlay === true` during PRERENDER (every flag is false on the
 * server, by construction), so `arriving` is false in the static HTML, and the
 * page's entire content — `/about`'s paragraph, action row and portrait, or
 * `/work`'s five project cards — would be absent from the prerendered document
 * rather than present at `opacity: 0` with the `<noscript>` net over it.
 * MEASURED: `/about`'s served `<body>` DOM is 15092 bytes; the four units are
 * most of it.
 *
 * Re-keying keeps the served HTML BYTE-IDENTICAL to today's — a `key` is not
 * markup — and keeps the content in the accessibility tree for the whole
 * sequence. The cost is a subtree remount at hand-off, and it has NO visual
 * signature: the state the remount lands in — `opacity: 0`, `y: 13` — is
 * exactly the state the entrance is supposed to start from, behind a plate that
 * is still fully opaque at that frame.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * WHICH UNITS A CALL SITE WRAPS IS ITS OWN QUESTION, AND THE ANSWER IS "THE
 * ONES THAT CAN BE ABOVE THE FOLD AT SOME VIEWPORT" — not "the ones above the
 * fold at 1440x900". The set is viewport-dependent and the browser's own
 * IntersectionObserver is the only thing that knows it, so this component does
 * not try to: a unit BELOW the fold at the hand-off never fired in the first
 * place, so its fresh instance simply sits at `initial` and reveals on scroll
 * exactly as before. The mechanism self-selects; the call site only has to
 * avoid wrapping units that can never be above the fold at all.
 *
 * MEASURED on `/work` at fourteen viewports, 360x640 through 2560x1440, as the
 * intersection ratio `amount: 0.1` actually tests:
 *
 *   360x640, 375x667       units 0-1     (heading, card 1)
 *   390x844, 414x896       units 0-2
 *   1024x768 .. 1366x768   units 0-2
 *   768x1024, 1440x900,
 *   1536x864, 1920x1080    units 0-4
 *   820x1180, 2560x1440    units 0-5     (the whole Projects section)
 *   every one of them      units 6-7 NEVER  (Experience, top >= 1981px)
 *
 * So `/work` wraps `Projects` and does NOT wrap `Experience`.
 * `CurrentlyLearning` renders `null` today and is not wrapped either. IF THE
 * ARCHIVE EVER SHRINKS BELOW THREE CARDS, re-measure: Experience moves up the
 * page and could enter the fold on a tall viewport, and nothing will report it.
 *
 * THE SCROLL PATH IS NOT FREE, AND THE COST IS DECLARED RATHER THAN BURIED.
 * `arriving` latches true and never goes back, so a unit released by the
 * hand-off keeps `INTRO_ONSET_S` on its `delay` for the rest of the page's
 * life. On a hard load of `/work` at 375x667, cards 2-5 are below the fold,
 * were never part of the entrance, and reveal 0.20s later than they do today
 * when scrolled into view — 0.90s from entering the viewport to settled,
 * against the ~1.0s budget `Reveal`'s header states. On a CLIENT NAVIGATION to
 * `/work` there is no hand-off, `waitedForHandoff` is false, and the scroll
 * path is byte-identical to before this file existed. That 0.20s is the price
 * of not reading the DOM during render, and it is the reason a stagger must not
 * be added through this prop without a mechanism that expires it.
 *
 * NO PATHNAME CHECK, AND NO DOM PREDICATE EITHER. The sanctioned predicate for
 * "is this the route with a hero stage" is a DOM read (`Intro.tsx` uses it to
 * choose between the camera and the dissolve), and a DOM read cannot be done
 * during RENDER without lying on the server. It does not need to be: both call
 * sites are on routes that have no hero stage by construction — `AboutScreen`
 * only renders on `/about`, and `Projects`' `motion="reveal"` branch only
 * renders on `/work` (Home passes `motion="scrub"`, which selects `ScrubReveal`
 * and never reaches this file). That is the same fact the predicate would
 * report. And if it ever DID mount on Home, it would be harmless rather than
 * wrong: the Projects section is far below Home's fold, so the released
 * instance would sit at `initial` and reveal on scroll.
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

type IntroEntranceProps = {
  children: ReactNode;
  /** Passed straight through. `/about`'s four units keep 0 / 0.10 / 0.20 /
   *  0.30; `/work`'s six pass nothing and stay at 0. */
  delay?: number;
  className?: string;
  fadeOnly?: boolean;
};

export function IntroEntrance({
  children,
  delay = 0,
  className,
  fadeOnly = false,
}: IntroEntranceProps) {
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

export default IntroEntrance;
