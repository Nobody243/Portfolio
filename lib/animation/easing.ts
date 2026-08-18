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
  /**
   * Tier 1 camera pull-back and hero headline.
   *
   * TUNED IN TICKET 3 against the real scene: 1.6 -> 1.45.
   * `EASE.hero` is an expo-out that covers ~80% of the distance in the first
   * third of the duration, so perceived ARRIVAL happens around 0.5s and the
   * remainder is a sub-pixel settle supplying the weight. At 1.6s that tail
   * starts to read as lag rather than as expense. It also gates the tagline
   * (which waits for the camera to finish), so this value sets time-to-first
   * -readable-word: 1.45s, with the full statement at ~2.25s.
   *
   * Tuning window 1.30-1.70. Test: at t=1.2s nothing should be perceptibly
   * moving. Do not exceed 1.7.
   */
  hero: 1.45,
} as const;

/** Delay between siblings in a staggered sequence, in seconds. */
export const STAGGER = {
  /**
   * Hero headline lines. CURRENTLY TIER 1 ONLY — the hero's two tagline units
   * are its sole consumer.
   *
   * Ticket 4's About section was designed to reuse this for its first beat,
   * which is why no STAGGER.section entry was ever added. It then removed the
   * delay outright: after a scroll-cue click the heading and the first two
   * beats intersect on one observer tick, and a non-zero delay on beat 1 alone
   * made the sequence render backwards. If a Tier 2 section ever wants a
   * stagger again, reuse this rather than inventing a per-section cadence —
   * but read About's comment first, because the same trap applies to anything
   * a jump link can land on.
   *
   * Retuned 0.08 -> 0.10 in Ticket 3.
   *
   * The identity statement is only TWO units, and at 80ms two units read as
   * near-simultaneous. 100ms against a 700ms reveal is a ~14% offset — enough
   * to register as a sequence (the stance arrives, then the direction lands)
   * while staying well inside one gesture.
   */
  line: 0.1,
  /** Project card entrance (Tier 2). */
  card: 0.09,
} as const;
