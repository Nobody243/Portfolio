"use client";

/**
 * Lenis -> ScrollTrigger binding. Site-wide plumbing, not hero code.
 *
 * Deliberately its own component rather than lines inside LenisProvider: every
 * scroll-triggered section from Ticket 4 onward depends on this, so it must
 * survive any hero refactor, and LenisProvider stays free of a GSAP import.
 *
 * WHY ONE LINE IS ENOUGH — and why `scrollerProxy` would be wrong here.
 * `ReactLenis root` drives the REAL document scroller, so `window.scrollY`
 * updates natively and ScrollTrigger's default scroller already works. The
 * binding exists only so ScrollTrigger recomputes on Lenis's interpolated
 * frames instead of one frame late. A scrollerProxy is for the case where
 * Lenis transforms a wrapper element, which `root` mode never does.
 *
 * DO NOT add `gsap.ticker.add(lenis.raf)` without also setting `autoRaf: false`
 * on Lenis. ReactLenis already runs its own rAF; a second ticker-driven loop
 * advancing the same instance produces scroll that feels subtly doubled.
 *
 * THE "OFFICIAL PATTERN" IS THEREFORE HALF-ADOPTED ON PURPOSE, and this is the
 * declined half. GSAP's published snippet is three lines — the `on("scroll")`
 * binding below, `gsap.ticker.add((t) => lenis.raf(t * 1000))`, and
 * `gsap.ticker.lagSmoothing(0)`. Lines two and three only make sense together
 * with `autoRaf: false`, i.e. moving Lenis onto GSAP's ticker; `lagSmoothing(0)`
 * exists to stop GSAP's lag-smoothing from distorting the timestamp it feeds
 * Lenis, and with Lenis on its own rAF there is no such timestamp to distort.
 * Adopting them without the switch is the doubled-advance bug above; adopting
 * them WITH the switch buys one shared clock and costs a site-wide change to
 * the frame pipeline that nothing here needs.
 *
 * VERIFIED 2026-08-22 on a production build, 1440x900: `root` mode confirmed
 * (`<html class="... lenis">`, zero Lenis wrapper elements, `window.scrollY`
 * moves natively 0 -> 400); all eight `ScrubReveal` units on `/` scrub and
 * settle at their `bottom bottom` end while fully visible; the footer's
 * `sticky` vs `static` `scrollHeight` delta is 0px in all twenty cases of
 * `docs/03` Rule S-6; and under reduced motion, with no Lenis instantiated,
 * `Navbar`'s ScrollTrigger still toggles `data-over-hero` on native scroll.
 *
 * REDUCED MOTION: LenisProvider never instantiates Lenis, so `useLenis` yields
 * undefined and this no-ops. ScrollTrigger keeps working on native scroll —
 * verify that path, since it is the one that looks identical until it isn't.
 */

import { useEffect } from "react";
import { useLenis } from "lenis/react";

import { ScrollTrigger } from "@/lib/animation/gsap";

export function ScrollTriggerSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    lenis.on("scroll", ScrollTrigger.update);
    return () => {
      lenis.off("scroll", ScrollTrigger.update);
    };
  }, [lenis]);

  // Fonts swap after first paint and change element heights, which leaves every
  // trigger position computed against a stale layout — the classic symptom of
  // "my ScrollTrigger fires in the wrong place." `document.fonts.ready` is the
  // precise signal; the rAF gives layout one frame to flush after it resolves.
  useEffect(() => {
    let raf = 0;
    let cancelled = false;

    void document.fonts.ready.then(() => {
      if (cancelled) return;
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}

export default ScrollTriggerSync;
