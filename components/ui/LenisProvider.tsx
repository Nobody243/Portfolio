"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * Site-wide smooth scroll.
 *
 * `root` means Lenis drives the document scroller and renders NO wrapper
 * element — the rendered DOM is byte-identical whether or not Lenis is mounted.
 * That is what lets `useReducedMotion` flip this branch after hydration without
 * a mismatch warning (see the hook's server-snapshot note).
 *
 * NOTE: GSAP ScrollTrigger is deliberately NOT wired to Lenis here. No
 * ScrollTrigger timelines exist yet; that sync belongs to Ticket 3 (hero), and
 * should import gsap from `lib/animation/gsap.ts` so plugin registration and
 * the shared eases are guaranteed to have run.
 */

export function LenisProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

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
