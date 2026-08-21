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
 * NOTE: Lenis <-> ScrollTrigger sync is deliberately not wired here yet. It
 * belongs with the first real timeline (Ticket 3, hero) — see LenisProvider.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

import { EASE, type EaseName } from "./easing";

/**
 * MorphSVGPlugin is registered here and NOWHERE ELSE, which is the whole point
 * of this module — an unregistered plugin fails silently in production, and a
 * morph that silently no-ops leaves the Intro's letters translating into a
 * shape they never become.
 *
 * WHY IT EARNS ITS REGISTRATION when `Intro.tsx` explicitly declined Flip's.
 * That file's "NO FLIP PLUGIN" note is not a blanket ban; its stated test is
 * whether a registration earns its keep, and a four-rect manual FLIP did not.
 * This does: `docs/07` §3 step 2 asks for glyph contours to deform into trace
 * polylines with mismatched point counts (16 → 9 and 39 → 11), which is
 * MorphSVG's headline capability and nothing else's. The shipped build is the
 * unrestricted 3.15.0 one.
 */
gsap.registerPlugin(ScrollTrigger, CustomEase, MorphSVGPlugin);

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
