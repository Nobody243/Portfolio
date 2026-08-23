"use client";

/**
 * THE TWO WIRES THE INTRO HANDS TO THE PAGE — `arriving` and `introDone`.
 *
 * They used to be two `useState`s inside `Hero`, fed by `IntroGate`'s
 * `onHandoff` and `onDone` props, because `Hero` was the thing that mounted the
 * gate. Once the gate is mounted by the `(chrome)` layout it is no longer any
 * page's child, and the two consumers that need those wires — the hero's
 * arrival tween and `HeroHeadline`'s `revealed` gate — are several levels down
 * a tree the gate cannot see. This is that connection, made explicit.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY CONTEXT AND NOT THE TWO ALTERNATIVES.
 *
 * A MODULE-LEVEL CALLBACK REGISTRY (`subscribe`/`emit`) loses on the
 * late-subscriber problem, which is decisive here rather than theoretical: on a
 * client navigation to `/`, `Hero` mounts AFTER the Intro has already finished,
 * so `onHandoff` and `onDone` fired minutes ago. A registry would have to
 * replay its last value to a late subscriber — at which point it is a context
 * wearing a worse hat, with no type safety, hand-rolled bookkeeping React
 * already does, and a lifetime React does not own. It also leaves the coupling
 * with NO structural trace: `grep IntroProvider components/hero/Hero.tsx`
 * finds nothing, which is the invisible-because-unlisted failure CLAUDE.md's
 * "where decisions live" section exists to prevent.
 *
 * A DOM ATTRIBUTE + `CustomEvent` is the right mechanism for the navbar's
 * entrance and the wrong one here, and `lib/animation/handoff.ts` says why
 * without meaning to: "a GSAP timeline can only tween an element it has, so it
 * has to be able to find one." That is a need for an ELEMENT. `revealed=
 * {introDone}` is a RENDER-DRIVING VALUE, and getting a DOM event into a render
 * means mirroring it into `setState` inside an effect — the exact shape
 * `Navbar.tsx` records Next 16's `react-hooks/set-state-in-effect` rule
 * hard-erroring on. The argument runs the other way on this wire.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * THE NO-PROVIDER DEFAULT IS `{ arriving: true, introDone: true }` — "nothing
 * above me is gating me". It is deliberately the PERMISSIVE direction: a `Hero`
 * or a `PageStack` rendered outside `(chrome)` shows its content immediately
 * rather than waiting forever for a hand-off that will never arrive. This
 * default can only ever fail towards showing content, never towards hiding it.
 */

import { createContext, useContext } from "react";

export type IntroPhase = {
  /**
   * True from the instant the Intro's PHASE 7 starts — the frame the plate
   * begins dissolving, while it is still fully opaque — not when it finishes.
   * The overlap between this and that dissolve is what makes the hand-off
   * continuous instead of a cut, so anything that waits for `introDone` to
   * start moving has misread the seam.
   *
   * It read "the instant the Intro's zoom-in STARTS" until 2026-08-22. Same
   * instant; the ×17 camera that used to carry it is retired.
   */
  arriving: boolean;
  /**
   * True once the plate has faded far enough to stop being the GROUND behind
   * fixed chrome. It fires part-way INTO the dissolve, so it sits strictly
   * between `arriving` and `introDone`.
   *
   * IT IS A THIRD WIRE RATHER THAN A REUSE OF EITHER OF THE OTHER TWO, and the
   * reason is that both of those are wrong by a measured amount. `arriving` is
   * the frame the dissolve STARTS, when the plate is still fully opaque:
   * releasing on it makes `Navbar.tsx` paint its 80% `--color-base` scrim over
   * a #07090C plate — the light-slab defect, in miniature. `introDone` is the
   * frame the plate is GONE: holding until then leaves `--color-hero-fg` ink
   * over a ground that has travelled to `--color-base`, which measures 1.18:1
   * in light mode at the last frame. Neither instant is usable, so the release
   * is placed inside the dissolve at `PLATE_GROUND_RATIO` (`Intro.tsx`), where
   * both sides of the swap clear 7:1.
   *
   * THE ONLY CONSUMER IS `Navbar.tsx`. Nothing that RENDERS should read it:
   * it fires mid-tween, so a component that re-rendered on it would commit a
   * DOM change in the middle of the seam. The navbar writes an attribute from a
   * layout effect, which costs no render — see its `ground` object.
   */
  plateCleared: boolean;
  /** True once the gate is finished and unmounted. */
  introDone: boolean;
};

const IntroContext = createContext<IntroPhase>({
  arriving: true,
  plateCleared: true,
  introDone: true,
});

/** Read by `Hero`, by `PageStack`, and by the destination entrances off Home. */
export function useIntroHandoff(): IntroPhase {
  return useContext(IntroContext);
}

/** Exported for `IntroProvider` alone. Everything else reads the hook. */
export const IntroPhaseProvider = IntroContext.Provider;
