"use client";

/**
 * Home's scroll-scrub — a SIBLING of `Reveal`, never a variant of it.
 *
 * `Reveal` is a 0.7s IntersectionObserver one-shot: it fires when a threshold
 * is crossed and is then permanently spent. This drives the same idea from
 * scroll POSITION instead of from a timer started by scroll position, so the
 * frame is a pure function of where the page is and it runs backwards when you
 * scroll back up. That change of DRIVER is the whole feature; the property, the
 * direction and the amplitude all stay recognisably what the site already
 * ships.
 *
 * WHY A SECOND COMPONENT AND NOT A PROP ON `Reveal`. Its header is explicit
 * that a new expressive need is "a designer request with reasoning, not a new
 * prop added during implementation". `.claude/handoff/home-scrub-design.md` is
 * that request and its answer, in §6.2, is "not in `Reveal`". `Reveal` is
 * BYTE-IDENTICAL after this ticket, and must stay that way: it owns motion on
 * `/work`, `/about`, every project detail page and Home's Stack section, and a
 * shared prop would let a change here alter all five silently.
 *
 * WHERE IT IS USED — `docs/03_FRONTEND_SPEC.md`, "Scroll-scrub — Home only":
 *   Home -> Trajectory   4 units (h2, 3 beats)   imports this directly
 *   Home -> Projects     4 units (h2, 3 cards)   via `motion="scrub"`
 * Eight scrub units on Home, and it was NINE until 2026-08-22: Trajectory's
 * portrait was a fifth unit there until it moved to `/about`, which is a
 * page with no scrub at all. If a count anywhere still says nine or five,
 * it predates that move.
 * and nowhere else. Home -> Stack stays on `Reveal` deliberately: it is Tier 3,
 * and the discrete-versus-continuous difference between it and its two
 * neighbours IS the tier boundary made visible. If that ever reads as broken,
 * the fix is dropping Stack's opacity leg — never scrubbing Stack.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ONLY `y` SCRUBS. OPACITY NEVER DOES, AT ANY RANGE, ON THE WRAPPER OR ON A
 * CHILD. This is arithmetic, not taste, and it is the load-bearing decision in
 * the whole feature:
 *
 *   1. A scrub abolishes the transient/state distinction the `/70` contrast
 *      floor relies on. A timed reveal may pass THROUGH `opacity: 0` because it
 *      self-completes in 350ms whether or not the visitor does anything. A
 *      scrub has no timer, so every frame persists for exactly as long as the
 *      visitor stops there — every frame is a resting state, and the floor
 *      binds all of them.
 *   2. Element opacity MULTIPLIES through to children. A wrapper at 0.7 over a
 *      `text-fg/70` label renders it at 0.49 — 3.33:1 in light mode, a straight
 *      AA failure. Both sections in range have such a child: Trajectory's beat
 *      labels, and `ProjectCard`'s "+N" stack overflow marker.
 *   3. The legal wrapper range is therefore 0.836 -> 1.0. It is not empty —
 *      saying so invites the disproof, and whoever finds that 0.85 works ships
 *      the multiplication bug. It is dropped because a 16% change spread over
 *      ~400px of scroll is not a fade anyone perceives.
 *
 * WHAT THAT BUYS, and it is the point: every frame of this animation is
 * visually identical to the end state except for up to 21px of vertical
 * position. `y` is the only property in this system with no accessibility
 * floor. There is no frame a visitor can stop on where anything is harder to
 * read than at rest — not dimmed, not blurred, not half-masked, not scaled.
 * "Fully visible" and "fully arrived" are the same instant, by construction.
 *
 * NOTHING MOVES ON X, NOTHING PINS, NOTHING CHANGES DOCUMENT HEIGHT. Hard
 * constraints from `ticket-4-design.md` §3.2, held absolutely. No `x`, no
 * `scale`, no `rotate`, no `filter`, no mask, no colour, no per-word split, no
 * `pin: true`, no `position: sticky`, no progress bar. The page's total scroll
 * length is unchanged by this feature.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

import { DURATION } from "@/lib/animation/easing";
import { GSAP_EASE, gsap } from "@/lib/animation/gsap";

/**
 * 21px, and ONLY on the scrubbed path.
 *
 * `ticket-4-design.md` §3.2 sets 21px as the ceiling and 13px as the shipped
 * value. Spending the ceiling here is not a relaxation of that cap, it is the
 * cap's own reasoning applied to a case it did not contemplate: the stated
 * reason for it is that beyond 21px "the eye tracks moving text instead of
 * reading it", which is a claim about SPEED. A scrubbed 21px cannot outrun a
 * reader, because the reader is driving it and it is at rest whenever they
 * are — and stopping is what reading looks like.
 *
 * Upward only: starts BELOW its resting position and rises to it. Never
 * downward, no overshoot, no `back`/`elastic`, no settle bounce.
 */
const SCRUB_TRAVEL_PX = 21;

/**
 * 13px, mirroring `Reveal`'s `TRAVEL_PX`, for the two TIMED branches below.
 *
 * DELIBERATELY A SECOND DECLARATION, and the duplication is a known, recorded
 * cost rather than an oversight. `Reveal`'s constant is module-private, and
 * this ticket's hardest constraint is that `Reveal` is byte-identical when it
 * ends — so exporting it, or lifting it into `lib/animation/easing.ts` and
 * leaving `Reveal` with a private copy, both trade a smaller problem for a
 * worse one (the second would put a false "source of truth" in a shared file).
 * The other three numbers in these branches — `DURATION.reveal`, its half, and
 * `EASE.reveal` via `GSAP_EASE.reveal` — ARE imported, so this is the only
 * value that can drift. If `Reveal` ever changes it, change it here in the same
 * commit; there is nothing in the type system that will remind you.
 *
 * `Reveal` GREW ONE PROP ON 2026-08-22 AND THIS VALUE DID NOT MOVE. `fadeOnly`
 * suppresses `Reveal`'s `y` leg for one call site (`/about`'s action row, on a
 * page that clips instead of scrolling). It adds no curve, no duration and no
 * distance, and `TRAVEL_PX` is still 13 — so the "byte-identical" constraint
 * this docstring cites is spent in the only way that would not affect it, and
 * the duplication above is still pinned to the same number. Checked at the
 * time; re-check if a second prop is ever added.
 */
const TIMED_TRAVEL_PX = 13;

/**
 * Seconds of catch-up, not a duration: `scrub: <n>` gives the timeline `n`
 * seconds to reach the frame the scroll position implies, which reads as
 * weight. `scrub: true` welds it with zero smoothing.
 *
 * 0.4 rather than higher because Lenis already lerps scroll site-wide, so
 * ScrollTrigger's input arrives pre-smoothed; a large value double-smooths and
 * the second layer stops reading as inertia and starts reading as LAG, i.e. as
 * a performance problem — the worst thing a portfolio's signature motion can be
 * mistaken for. The catch-up also does double duty: during a continuous scroll
 * unit N is still settling while unit N+1's window has opened, so two or three
 * units are in motion at different phases, which is what produces the
 * "animated video" read WITHOUT spending any amplitude.
 *
 * If it ever reads as trailing the wheel rather than as weighted, drop to
 * `true`. Never raise above 0.6.
 */
const SCRUB_CATCH_UP_S = 0.4;

/**
 * The scrub window is the unit's OWN HEIGHT, in pixels of scroll: it opens when
 * the unit's top edge touches the bottom of the viewport and closes when its
 * bottom edge reaches the bottom of the viewport.
 *
 * These two anchors are a DEFINITION, not a tuning — "a unit animates during
 * precisely the interval in which it is partially on screen, and is at its end
 * state for the entire interval in which it is fully on screen." The reflexive
 * `top 85%` / `top 40%` pair decouples "finished animating" from "finished
 * arriving": a tall beat settles while most of it is still below the fold and a
 * short heading is still moving when it is entirely readable. Both defects are
 * invisible on the machine they were tuned on.
 *
 * IT SELF-SCALES, so nothing here is a viewport fraction and nothing needs
 * retuning per breakpoint: a 75px heading gets a 75px window, a 430px card gets
 * 430px. Two units of different heights travel the same 21px over different
 * amounts of scroll, so the taller one visibly moves slower — a depth cue
 * produced by geometry rather than by a magic number, and one that re-derives
 * itself whenever a unit is resized.
 *
 * That effect is currently WEAK ON HOME, and knowing why matters more than the
 * effect does. It was strongest between the Trajectory portrait (580px) and the
 * beats beside it (240px) — a 2.4x ratio in the same viewport. The portrait
 * moved to `/about` in `2cfdb34`, and the eight remaining units are much closer
 * in height, so the parallax is now subtle. NOTHING IS BROKEN and there is
 * nothing to tune: the mechanism is unchanged and re-asserts itself the moment
 * two units of genuinely different heights sit side by side again. Do not
 * "restore" it by hard-coding per-unit distances — that trades the property
 * this paragraph is about for the magic numbers it exists to avoid.
 *
 * DO NOT LENGTHEN THE `end`. `bottom bottom+=anything`, `top 40%` and `+=100%`
 * each allow a fully-visible element to still be mid-scrub, which is exactly
 * the guarantee in this file's header. The `end` anchor is why that guarantee
 * is true; it is not a tuning surface. The one sanctioned lever, if the motion
 * ever reads as nothing happening, is a pre-roll at the START
 * (`"top bottom+=10%"`), which buys overlap by spending amplitude.
 */
const SCRUB_START = "top bottom";
const SCRUB_END = "bottom bottom";

/**
 * The TIMED branches' trigger point, approximating `Reveal`'s `amount: 0.1` on
 * typical unit heights. Both are "a little of the unit is on screen"; neither
 * is satisfiable-only-on-tall-viewports, which is the failure `Reveal`'s
 * `VIEWPORT_AMOUNT` comment guards against.
 */
const TIMED_START = "top bottom-=5%";

/**
 * 768px is Tailwind's `md` and introduces no new breakpoint. It is where
 * `Projects`' grid already goes one column -> two, so the scrub arrives at the
 * same width the gallery becomes a gallery.
 *
 * Below it, Home behaves EXACTLY like `/work` and `/about`. There is no
 * mobile-specific animation anywhere on this site, and a phone gets the site's
 * normal motion language rather than a degraded Home.
 *
 * THIS SAID "there are two behaviours in total — the site's reveal, and Home's
 * desktop scrub" until 2026-08-22. The count was already false when it was
 * written — the Intro's timeline, the navbar's indicator, the card -> cover
 * morph and the MS mark's hover part were never counted against it — and the
 * route transition and `/about`'s entrance made it falser. `docs/03` now states
 * what the count was a proxy for, and it is stricter rather than looser: TWO
 * MOTION DRIVERS SITE-WIDE, elapsed time and scroll position, and no behaviour
 * specific to a breakpoint. Scroll position drives exactly one thing, and this
 * file is it.
 */
const SCRUB_QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
const TIMED_QUERY = "(max-width: 767px) and (prefers-reduced-motion: no-preference)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * The layout effect is REQUIRED, not tidiness: the displaced start state must
 * be written after mutation and before the browser paints, or a unit that is
 * already in view on load paints at `y: 0` and then jumps to `y: 21` on the
 * next frame. The server branch exists only to silence React's SSR warning —
 * these sections are prerendered.
 */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type ScrubRevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * ONE INSTANCE PER UNIT — one heading, one beat, one card — each owning its
 * own trigger. (The list ended "one portrait" until 2026-08-22; this file's own
 * header records that the portrait moved to `/about`, where the scrub does not
 * run, so it was a fifth unit here and is not one now.) NEVER one wrapping a whole section, and never
 * `staggerChildren`: a section-length window would put the `end` anchor far
 * past `bottom bottom` and break the "shorter than the viewport" invariant
 * outright, and `Projects.tsx` already documents what a group trigger does to
 * the cards at the bottom of the group.
 *
 * THERE IS NO `delay` PROP AND THERE CANNOT BE ONE. A scrub has no timer to
 * delay, so the defect About shipped a fix for — a jump link landing several
 * units on one observer tick and non-monotonic delays rendering the sequence
 * backwards — cannot occur here at all. Each unit's frame is a pure function of
 * `(scrollY, unitTop, unitHeight)`, so arriving by scroll, by anchor jump, by
 * deep link or by refresh mid-page all produce the identical rendered result.
 */
export function ScrubReveal({ children, className }: ScrubRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    /*
      `gsap.matchMedia()` rather than a hand-rolled listener: it owns teardown,
      re-evaluation on resize and re-evaluation on an OS-preference change, and
      it keeps all three branches in one declaration where they can be compared.

      `Projects.tsx` rejects "a matchMedia hook" by name — "new machinery, a
      hydration surface, and a wrong value on first paint" — and that objection
      does not transfer here: it was about LAYOUT (a column count read in JS),
      where a wrong first value is a collapsed grid. This governs MOTION only,
      and first paint is the end state either way, so a branch resolving one
      frame late is invisible.
    */
    const mm = gsap.matchMedia();

    // ── Desktop: the scrub. `y` only, linear in scroll, reversible. ──────────
    mm.add(SCRUB_QUERY, () => {
      /*
        `gsap.from()`, NEVER `fromTo()` with a CSS or inline initial. The end
        state is what this component renders in HTML — no inline opacity, no
        inline transform — and GSAP writes the displaced state on top of it in
        this layout effect. So a blocked bundle, a hydration failure or a
        thrown error leaves the page fully readable and correctly positioned,
        which is STRICTLY SAFER than `Reveal`, whose `opacity: 0` genuinely
        ships in the server markup and needs the `<noscript>` net in
        `app/layout.tsx` to undo it. Ticket 3 shipped two separate fixes for the
        "displaced in the HTML and stays displaced" bug class; do not
        reintroduce it.

        `ease: "none"` is mandatory. A scrub is linear in scroll BY DEFINITION —
        the visitor's gesture is the easing — and layering `EASE.reveal` on top
        would make the rate a function of the curve rather than of the scroll.
      */
      gsap.from(el, {
        y: SCRUB_TRAVEL_PX,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: SCRUB_START,
          end: SCRUB_END,
          scrub: SCRUB_CATCH_UP_S,
        },
      });
    });

    // ── <768px: the site's normal one-shot reveal, in GSAP. ─────────────────
    mm.add(TIMED_QUERY, () => {
      /*
        A second DECLARATION of `Reveal`'s behaviour, accepted with its cost
        stated: this cannot render `<Reveal>` instead, because `Reveal` ships
        `opacity: 0` in the server HTML while the scrub path must ship the end
        state, and one component cannot do both in one first paint without a
        visible flash on whichever branch loses.

        The two legs match `Reveal` exactly, front-loading included: opacity
        reaches 1 in half the time the transform takes, so the last of the
        movement is a sub-pixel drift on text that is already fully readable.
        Expressed as a division so it cannot drift if `DURATION.reveal` is
        retuned.
      */
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: TIMED_START, once: true },
      });

      tl.from(
        el,
        { y: TIMED_TRAVEL_PX, duration: DURATION.reveal, ease: GSAP_EASE.reveal },
        0,
      ).from(
        el,
        { opacity: 0, duration: DURATION.reveal / 2, ease: GSAP_EASE.reveal },
        0,
      );
    });

    // ── Reduced motion, at every width: a fade, and nothing else. ────────────
    mm.add(REDUCED_QUERY, () => {
      /*
        NO SCRUB, NO `y`, NO DIFFERENTIAL — and this is not a rule invented for
        Home. It is precisely what `MotionProvider`'s `reducedMotion="user"`
        already produces for every `Reveal` on the site (transform dropped,
        opacity kept), reproduced in the GSAP branch so the two agree. Giving
        Home's two sections a private reduced-motion rule would be the
        inconsistency, not the fix.

        Reversibility is dropped here DELIBERATELY: continuous position-driven
        motion is exactly what the preference asks a site to stop doing, so a
        reduced-motion visitor scrolling up and down sees a still page.

        Note the asymmetry and do not "fix" it — this branch fades from 0 while
        the desktop scrub does not fade at all. A 0.35s timed fade is transient,
        so the contrast floor does not bind it; a scrub frame is a state, so it
        does.
      */
      gsap.from(el, {
        opacity: 0,
        duration: DURATION.reveal / 2,
        ease: GSAP_EASE.reveal,
        scrollTrigger: { trigger: el, start: TIMED_START, once: true },
      });
    });

    /*
      Reverts every tween and kills every ScrollTrigger created inside any
      branch, restoring the end state. This is also what makes React's
      double-invoked effects in development harmless.
    */
    return () => {
      mm.revert();
    };
  }, []);

  return (
    /*
      `data-scrub-unit`, and DELIBERATELY NOT `data-reveal`. The `<noscript>`
      net in `app/layout.tsx` forces `[data-reveal]` back to `opacity: 1;
      transform: none` because Framer writes a hidden initial state into the
      server markup. This component never ships a hidden state, so the net would
      be a no-op here — and its presence would falsely assert that this element
      ships hidden, which is the sort of thing a future audit reads as true. Two
      mechanisms, two attributes, greppable apart.
    */
    <div ref={ref} data-scrub-unit className={className}>
      {children}
    </div>
  );
}

export default ScrubReveal;
