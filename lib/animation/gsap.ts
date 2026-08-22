"use client";

/**
 * The ONLY place GSAP should be imported from in this project.
 *
 * GSAP plugins must be registered before use, and registering them at each call
 * site is how you end up with a timeline that silently no-ops in production
 * because tree-shaking dropped an unreferenced plugin. Import `gsap` and
 * `ScrollTrigger` from here and registration is guaranteed to have run.
 *
 * Do NOT import this module from a server component — the "use client"
 * directive turns every export into a client reference, and `gsap.to()` would
 * fail as a non-function. Import it from client components only.
 *
 * Registration is SSR-safe: gsap core, ScrollTrigger and CustomEase all guard
 * their DOM access, so this module evaluating during prerender is harmless.
 *
 * LENIS <-> SCROLLTRIGGER SYNC IS NOT HERE, AND IT IS NOT MISSING EITHER.
 * `components/ui/ScrollTriggerSync.tsx` owns it — the `lenis.on("scroll",
 * ScrollTrigger.update)` binding and the post-webfont `ScrollTrigger.refresh()`
 * — as its own component, so that every scroll-triggered section depends on a
 * thing that survives a hero refactor and `LenisProvider` stays free of a GSAP
 * import. Read that file's header before adding any scroll plumbing; it
 * already rules out `scrollerProxy` and `gsap.ticker.add(lenis.raf)` by name.
 *
 * This note read "deliberately not wired here yet ... belongs with the first
 * real timeline (Ticket 3, hero)" until 2026-08-22. It was written before the
 * sync existed and never updated after it shipped, so a reader looking for the
 * binding found a "not yet" in the module they would naturally check first.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

import { EASE, type EaseName } from "./easing";

/**
 * MORPHSVGPLUGIN WAS REGISTERED HERE AND IS NOT ANY MORE. It had exactly one
 * consumer — the Intro's glyph-contour-to-circuit-trace morph — and the faceted
 * mark rebuild replaced that morph with a convergence and a crossfade, because
 * filled shapes do not need to interpolate into each other. Checked before
 * removal rather than assumed: no `morphSVG` tween exists anywhere in `app/`,
 * `components/` or `lib/`, and the project-card transition in
 * `CoverFrame`/`ProjectOverlay` is Framer Motion's shared-layout, not GSAP.
 *
 * The plugin file is still in `node_modules` (unrestricted 3.15.0). If a real
 * path-to-path morph ever appears, re-register it HERE and nowhere else — an
 * unregistered plugin fails silently in production, which is the whole reason
 * this module exists.
 */
gsap.registerPlugin(ScrollTrigger, CustomEase);

/**
 * GSAP ease names for the shared curves in `easing.ts`.
 *
 * Use these instead of GSAP's built-ins ("power3.out" etc.). The built-ins are
 * close to, but not the same as, the cubic-beziers Framer Motion is using — and
 * a card that eases one way on scroll-in and a different way on hover is the
 * kind of thing that reads as "off" without anyone being able to name why.
 */
export const GSAP_EASE = {
  hero: "site-hero",
  reveal: "site-reveal",
  ui: "site-ui",
} as const satisfies Record<EaseName, string>;

// Compile each shared curve into a named GSAP ease. A cubic-bezier from (0,0)
// to (1,1) with control points (x1,y1) and (x2,y2) is exactly this SVG path,
// so GSAP and Framer Motion end up running mathematically identical curves.
for (const name of Object.keys(GSAP_EASE) as EaseName[]) {
  const [x1, y1, x2, y2] = EASE[name];
  CustomEase.create(GSAP_EASE[name], `M0,0 C${x1},${y1} ${x2},${y2} 1,1`);
}

export { gsap, ScrollTrigger };
