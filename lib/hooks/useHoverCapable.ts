"use client";

import { useSyncExternalStore } from "react";

/**
 * Reads whether the visitor's input device can hover and points precisely,
 * live. A CAPABILITY QUERY, NOT A BREAKPOINT, AND THE SPELLING IS THE POINT.
 *
 * `docs/03` forbids behaviour that is specific to a breakpoint — "a phone gets
 * the site's normal motion language, not a degraded Home. A mobile-only
 * parallax is still a breach under this wording, which is the test of whether
 * the rewrite is honest." This is not a breakpoint: it says "this input device
 * has no hover", which is a statement about the DEVICE rather than about its
 * size, and it is correct on a touch-capable laptop where a width test is not.
 *
 * EXTRACTED HERE ON 2026-08-23, when the second consumer appeared — exactly the
 * trigger `useReducedMotion` beside it names for itself. It was private to
 * `components/ui/text-hover-effect.tsx`, whose own header warns "DO NOT MIX THE
 * TWO SPELLINGS IN ONE COMPONENT"; two components each declaring the query
 * privately is the same hazard one file up, and a query string that drifts
 * between two files silently changes which devices get which behaviour.
 *
 * CONSUMERS:
 *   `components/ui/text-hover-effect.tsx`  the footer wordmark's cursor reveal
 *   `components/about/AboutFlipBoard.tsx`  the flip board's rotation interval
 *
 * `INTERACTIVE_MIN_WIDTH = 768` in `ParticleGrid` gates the particle field's
 * cursor void by WIDTH for the same underlying reason. That is existing and
 * fine, and it must NOT be "harmonised" to this — the field is an `/about`
 * render site with its own recorded argument.
 *
 * `useSyncExternalStore`, not `useState` + `useEffect`, for both of the reasons
 * `useReducedMotion` gives: Next 16's `react-hooks/set-state-in-effect` rule
 * hard-errors on the effect shape, and this gives a real server snapshot rather
 * than a first-render lie corrected one paint later.
 *
 * SERVER SNAPSHOT IS `false` — no input device exists during prerender. Every
 * consumer must therefore keep both branches emitting IDENTICAL DOM, or that
 * correction becomes a hydration mismatch. Both current consumers satisfy it by
 * gating BEHAVIOUR rather than markup: the wordmark gates only its event
 * handlers, and the board gates only its interval. Event handlers and timers
 * are not markup, so gating them cannot mismatch; removing an element would.
 */

export const HOVER_CAPABLE_QUERY = "(hover: hover) and (pointer: fine)";

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(HOVER_CAPABLE_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(HOVER_CAPABLE_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useHoverCapable(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useHoverCapable;
