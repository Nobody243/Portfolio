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
 * IntersectionObserver-driven and needs no ScrollTrigger.)
 *
 * THIS BLOCK CLAIMED "Hero.tsx creates a ScrollTrigger to gate the R3F
 * frameloop" UNTIL 2026-08-22. There is no R3F — the four packages were
 * uninstalled during the hero rebuild and `CLAUDE.md`'s stack line records it.
 * `Hero.tsx` does still create a ScrollTrigger, but it gates `inView` for a
 * Canvas2D loop, and it is no longer the plumbing's main consumer either.
 *
 * WHAT ACTUALLY DEPENDS ON IT, measured on a production build 2026-08-22:
 * eight `ScrubReveal` units on `/` (four in Trajectory, four in Projects) —
 * the site's ONE consumer of scroll position — plus `Navbar`'s two triggers
 * that author `data-over-hero`, plus `Hero`'s `inView` gate. All eight scrub
 * units reach `y: 0 / opacity: 1` by their `bottom bottom` end while fully
 * visible, and `Navbar`'s attribute still toggles under reduced motion, where
 * there is no Lenis at all. The post-font refresh below is what keeps every
 * one of those start/end positions honest.
 *
 * <ScrollTriggerSync /> is rendered in BOTH branches — under reduced motion
 * there is no Lenis instance to bind, so the binding no-ops, but the refresh
 * still runs, which native scroll needs just as much.
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
