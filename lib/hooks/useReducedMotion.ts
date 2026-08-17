"use client";

import { useSyncExternalStore } from "react";

/**
 * Reads the OS `prefers-reduced-motion` setting, live.
 *
 * Extracted here once a third consumer appeared (LenisProvider, SceneCanvas,
 * and Ticket 3's hero timeline), which was the trigger the duplicated copies
 * named for themselves. Lives under `lib/` rather than beside any one component
 * because none of the three owns it: it is a browser-preference read, not
 * scroll, WebGL, or animation code.
 *
 * `useSyncExternalStore`, NOT `useState` + `useEffect`:
 *   - Next 16's `react-hooks/set-state-in-effect` rule hard-errors on the
 *     effect shape.
 *   - It also gives a real server snapshot instead of a first-render lie
 *     corrected one paint later.
 *
 * Server snapshot is `false` — no OS preference exists during prerender, so
 * assume motion is allowed and let the client correct it on hydration. Every
 * consumer must therefore keep both branches emitting IDENTICAL DOM, or that
 * correction becomes a hydration mismatch. Both current consumers satisfy this:
 * LenisProvider's Lenis root renders no wrapper element, and SceneCanvas only
 * changes a Canvas prop.
 *
 * CAVEAT for animation code: this is a preference read, nothing more. It does
 * not stop a `useFrame` callback, a GSAP timeline, or a running interval —
 * whatever consumes it has to act on the value itself.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useReducedMotion;
