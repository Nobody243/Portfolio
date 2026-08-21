"use client";

import { useCallback } from "react";
import { useLenis } from "lenis/react";

/**
 * How far above a section's top the scroll lands, so the navbar is not sitting
 * on the heading it just took you to.
 *
 * IT IS THE BAR'S OWN HEIGHT PLUS A LITTLE AIR, and it is a constant rather
 * than a measurement for one reason: the bar can be HIDDEN at the moment a
 * link is clicked (it hides on scroll-down), so measuring it would sometimes
 * return zero and land the heading under a bar that is about to slide back in.
 * A fixed offset is right in both cases.
 *
 * `Navbar.tsx` owns the height this is derived from. Change one, change both.
 */
export const NAV_SCROLL_OFFSET = 76;

/**
 * Scroll to a section by id, through whichever scroll authority is actually
 * running.
 *
 * LENIS FIRST, NATIVE FALLBACK — the same two-branch shape `HeroHeadline`'s
 * scroll cue already uses, and for the same reason: under
 * `prefers-reduced-motion` `LenisProvider` does not instantiate Lenis at all,
 * so `useLenis()` returns null and a Lenis-only implementation would produce a
 * nav whose links silently do nothing for exactly those visitors.
 *
 * The fallback is `behavior: "auto"` deliberately. Animating the jump for
 * someone who asked for less motion would defeat the preference at the moment
 * it matters most.
 */
export function useSectionScroll() {
  const lenis = useLenis();

  return useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (lenis) {
        lenis.scrollTo(el, { offset: -NAV_SCROLL_OFFSET });
        return;
      }

      window.scrollTo({
        // `getBoundingClientRect().top + scrollY` rather than `offsetTop`:
        // `offsetTop` is relative to the nearest positioned ancestor, and the
        // sections on this site are inside wrappers that may or may not be one.
        top: el.getBoundingClientRect().top + window.scrollY - NAV_SCROLL_OFFSET,
        behavior: "auto",
      });
    },
    [lenis],
  );
}

export default useSectionScroll;
