"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { ReactLenis } from "lenis/react";

/**
 * Site-wide smooth scroll.
 *
 * `root` means Lenis drives the document scroller and renders NO wrapper
 * element — the rendered DOM is byte-identical whether or not Lenis is mounted.
 * That is what lets the reduced-motion branch below flip after hydration
 * without a mismatch warning.
 *
 * NOTE: GSAP ScrollTrigger is deliberately NOT wired to Lenis here. No
 * ScrollTrigger timelines exist yet; that sync belongs to Ticket 3 (hero), and
 * should import gsap from `lib/animation/gsap.ts` so plugin registration and
 * the shared eases are guaranteed to have run.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// There is no OS preference to read on the server; assume motion is allowed and
// let the client correct it. Safe because either branch emits identical DOM.
function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  // Reduced motion: do not instantiate Lenis at all — plain native scroll.
  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        touchMultiplier: 2,
        // Lenis v1 renamed `smoothTouch` to `syncTouch`. Kept off on purpose:
        // smoothed touch scrolling feels laggy/broken on mobile.
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}

export default LenisProvider;
