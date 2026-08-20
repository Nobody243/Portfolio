"use client";

/**
 * Is WebGL available at all? Probed ONCE per session, before any <Canvas> is
 * mounted.
 *
 * WHY A PRE-MOUNT PROBE RATHER THAN AN ERROR BOUNDARY — this is the whole
 * reason the hook exists, verified against the installed R3F 9.7 and three
 * 0.185.1 rather than assumed:
 *
 *   1. `new THREE.WebGLRenderer(...)` is called with no try/catch, and the
 *      constructor THROWS when context creation fails.
 *   2. That call sits inside an async `configure()`, reached from an async
 *      `run()` which a layout effect invokes WITHOUT `await` and WITHOUT
 *      `.catch()`.
 *   3. So the failure surfaces as an UNHANDLED PROMISE REJECTION, never as a
 *      render-phase throw — and a React error boundary cannot catch it.
 *
 * The intuitive fix (wrap <Canvas> in a boundary) does not work for the exact
 * case people reach for it. So we do not let the failure happen: if this
 * returns false, <Canvas> is never mounted and the hero renders its fallback.
 *
 * (A boundary is still warranted for a different path — scene CHILDREN that
 * throw are re-thrown outward by R3F's own boundary. That is what
 * components/ui/ErrorBoundary.tsx handles.)
 */

import { useSyncExternalStore } from "react";

/**
 * MODULE SCOPE, and the memoization is MANDATORY rather than an optimisation.
 *
 * `useSyncExternalStore` calls `getSnapshot` on EVERY render. `useReducedMotion`
 * can get away with a live `matchMedia().matches` read because that is cheap and
 * stable. A WebGL probe is neither: creating a canvas, acquiring a context and
 * releasing it on every render churns the very ~16-simultaneous-context budget
 * the release below exists to protect. It would NOT infinite-loop — a boolean is
 * referentially stable — which makes it worse, because it degrades silently
 * instead of erroring.
 */
let cached: boolean | undefined;

function probeOnce(): boolean {
  if (cached !== undefined) return cached;

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");

    // Release the probe context immediately. Browsers cap simultaneous
    // contexts, and the real one is about to be created.
    context?.getExtension("WEBGL_lose_context")?.loseContext();

    cached = !!context;
  } catch {
    cached = false;
  }

  return cached;
}

/**
 * Deliberately a no-op returning a no-op unsubscribe: WebGL support cannot
 * change during a session, so there is nothing to subscribe to.
 *
 * `useSyncExternalStore` is used here purely for its SERVER-SNAPSHOT guarantee
 * — it lets the server render `true` (assume WebGL works) and the client
 * correct after hydration, without the `useState` + `useEffect` shape that Next
 * 16's `react-hooks/set-state-in-effect` rule hard-errors on. This is a
 * legitimate use of the hook, not a copy of `useReducedMotion`'s shape.
 */
const subscribe = () => () => {};

const getSnapshot = () => probeOnce();

/** Assume support during prerender; the client corrects it on hydration. The
 *  hero's <h1> is `sr-only` in the server HTML to match, so the correction is a
 *  class swap rather than a structural change. */
const getServerSnapshot = () => true;

export function useWebGLSupport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useWebGLSupport;
