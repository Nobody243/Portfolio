"use client";

import { useCallback } from "react";
import { useLenis } from "lenis/react";

/**
 * How far above a section's top the scroll lands, so the navbar is not sitting
 * on the heading it just took you to.
 *
 * IT IS THE BAR'S OWN HEIGHT PLUS A LITTLE AIR. The bar is `py-sm` below `sm`
 * and `py-md` above it, around a right-hand cluster that is 22px while the menu
 * button exists and 17px once it does not, so it measures **48px below 640px,
 * 64px from 640 to 767, and 59px at 768 and above**. `Navbar.tsx` derives all
 * three and has the arithmetic.
 *
 * THOSE THREE NUMBERS READ "43px below 640px and 59px at 640px and above" UNTIL
 * 2026-08-22, and the line below this one says in as many words that
 * `Navbar.tsx` owns them and that changing one means changing both. It was not
 * changed when the bar was re-measured, which is exactly the drift that
 * sentence exists to prevent — so it is corrected here rather than restated.
 *
 * 76 IS THE TALLEST CASE PLUS 12px OF AIR (64 + 12). On a phone, where the bar
 * is 48px, it over-clears by 28px, which reads as breathing room above a
 * heading rather than as an error. (This said "plus 17px of air" and "over-
 * clears by 16px", both derived from the 43/59 pair above.)
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
 * only ever give the CURRENT breakpoint's height — reintroducing the 48/64/59
 * split at the exact moment the extra air is most welcome. It is also read on
 * the reduced-motion native path, where there is no Lenis and no animation
 * frame to measure in. Neither of those is the emphatic reason the old comment
 * had. The bar is a THREE-value step rather than the two this paragraph used to
 * assume, which weakens the argument further: measuring is a legitimate option
 * and this constant has no argument left against it.
 *
 * `Navbar.tsx` owns the height this is derived from. Change one, change both.
 *
 * NOTHING READS THIS TODAY. `inPageTarget` in `Navbar.tsx` never returns a
 * target now that both centre items are routes, so the hook is unreachable from
 * the shipped bar. That is why the drift above was behaviourally inert and also
 * why it survived: the wrong number was never wrong on screen.
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
