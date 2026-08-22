"use client";

import { useCallback } from "react";
import { useLenis } from "lenis/react";

/**
 * How far above a section's top the scroll lands, so the navbar is not sitting
 * on the heading it just took you to.
 *
 * IT IS THE BAR'S OWN HEIGHT PLUS A LITTLE AIR. The bar is `py-sm` below
 * `sm` and `py-md` above it, around a 17px MS mark (`NAV_HEIGHT_PX`), so it
 * measures **43px below 640px and 59px at 640px and above**. 76 is the taller
 * case plus 17px of air; on a phone it over-clears by 16px, which reads as
 * breathing room above a heading rather than as an error.
 *
 * THE REASON IT IS A CONSTANT CHANGED, AND THE NEW ONE IS WEAKER — read it
 * before assuming it was checked recently. This block used to say: "it is a
 * constant rather than a measurement for one reason: the bar can be HIDDEN at
 * the moment a link is clicked (it hides on scroll-down), so measuring it would
 * sometimes return zero." Hide-on-scroll was deleted in `3b3fab6`; the bar is
 * permanently visible, so that hazard is gone and a `getBoundingClientRect()`
 * on the header would now return a truthful height every time.
 *
 * WHAT KEEPS IT A CONSTANT is smaller and worth stating plainly: the offset is
 * a design value (clearance + air), not a measurement, and a measurement would
 * only ever give the CURRENT breakpoint's height — reintroducing the 43/59
 * split at the exact moment the extra air is most welcome. It is also read on
 * the reduced-motion native path, where there is no Lenis and no animation
 * frame to measure in. Neither of those is the emphatic reason the old comment
 * had. If a future bar height stops being a two-value step, measuring is a
 * legitimate option and this constant has no argument left against it.
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
