"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";

import { ScrollTriggerSync } from "@/components/ui/ScrollTriggerSync";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * Site-wide smooth scroll.
 *
 * `root` means Lenis drives the document scroller and renders NO wrapper
 * element — the rendered DOM is byte-identical whether or not Lenis is mounted.
 * That is what lets `useReducedMotion` flip this branch after hydration without
 * a mismatch warning (see the hook's server-snapshot note).
 *
 * ScrollTrigger sync lives in <ScrollTriggerSync />, rendered below rather
 * than implemented here: it is site-wide plumbing for any section that drives
 * a scroll-synced GSAP timeline, and keeping it in its own component keeps
 * this file free of a GSAP import. (It once said "Tickets 4 and 6 depend on"
 * it — neither does. Both shipped on Framer's `Reveal`, which is
 * IntersectionObserver-driven and needs no ScrollTrigger. The plumbing still
 * earns its place: Hero.tsx creates a ScrollTrigger to gate the R3F frameloop,
 * and the post-font refresh below keeps its start/end positions honest.) It is rendered in BOTH branches — under reduced motion there is no
 * Lenis instance to bind, so it no-ops, but it still refreshes ScrollTrigger
 * after fonts settle, which native scroll needs just as much.
 */

export function LenisProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  // Reduced motion: do not instantiate Lenis at all — plain native scroll.
  if (reducedMotion) {
    return (
      <>
        <ScrollTriggerSync />
        {children}
      </>
    );
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
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}

export default LenisProvider;
