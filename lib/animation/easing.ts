/**
 * Shared motion vocabulary — the single source of truth for easing across BOTH
 * animation libraries on this site.
 *
 * GSAP drives scroll-synced timelines; Framer Motion drives component-level
 * transitions. Left to their own defaults the two produce visibly different
 * curves, which is exactly how a "three-tier energy curve" turns into mush.
 * Everything here is framework-agnostic data: Framer Motion consumes `EASE.*`
 * directly, and `lib/animation/gsap.ts` compiles the same control points into
 * named GSAP eases via CustomEase.
 *
 * This file must stay dependency-free — importing gsap or motion here would
 * force it into a client bundle it doesn't belong in.
 */

/** Cubic-bezier control points, `[x1, y1, x2, y2]`, for a 0,0 -> 1,1 curve. */
export type Bezier = [number, number, number, number];

export type EaseName = "hero" | "reveal" | "ui";

/**
 * Three curves, one per job. Resist adding a fourth without a real reason —
 * a motion system with seven eases reads as inconsistent, not as expressive.
 *
 *   hero   — Tier 1 only. Long, heavily front-loaded tail (easeOutExpo): the
 *            camera pull-back and headline stagger arrive fast and settle slow.
 *   reveal — Tier 2/3 workhorse. Scroll-triggered fades and slides.
 *   ui     — Micro-interactions: hover, press, theme toggle. Near-symmetric so
 *            it reads as responsive rather than decorative.
 */
export const EASE: Record<EaseName, Bezier> = {
  hero: [0.16, 1, 0.3, 1],
  reveal: [0.22, 1, 0.36, 1],
  ui: [0.4, 0, 0.2, 1],
};

/**
 * Durations in SECONDS — the unit both GSAP and Framer Motion expect. (CSS
 * transitions want ms; multiply at the call site rather than duplicating this.)
 *
 * These are deliberate starting values, not spec-derived constants — the
 * Frontend Spec defines the motion *system* but no timings. Expect to tune
 * `hero` against the real 3D scene in Ticket 3.
 */
export const DURATION = {
  /** Hover/press feedback — must feel instant. */
  micro: 0.2,
  /** Toggles, small state changes. */
  ui: 0.35,
  /** Tier 2/3 scroll reveals. */
  reveal: 0.7,
  /** Tier 1 camera pull-back and hero headline. */
  hero: 1.6,
} as const;

/** Delay between siblings in a staggered sequence, in seconds. */
export const STAGGER = {
  /** Hero headline lines (Tier 1). */
  line: 0.08,
  /** Project card entrance (Tier 2). */
  card: 0.09,
} as const;
