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
  /*
   * THERE IS NO `hero` ENTRY ANY MORE, AND ITS ABSENCE IS DELIBERATE.
   *
   * `DURATION.hero` was 1.45s, tuned in Ticket 3 against an R3F camera
   * pull-back, and it documented itself as setting "time-to-first-readable
   * -word". That scene was deleted when the hero became Canvas2D plus SVG, and
   * the constant lost its last executable consumer with it — verified across
   * `app/`, `components/` and `lib/` before removal: zero callers.
   *
   * It survived anyway, with a confident docstring and a mention in
   * `MotionProvider.tsx` naming it as a live Tier 1 override, which is how a
   * dead number reads as load-bearing to everyone who finds it. Both comments
   * moved in the same commit as this removal.
   *
   * `EASE.hero` IS STILL LIVE — `HeroHeadline.tsx` uses it. Only the duration
   * went.
   *
   * WHAT REPLACED IT, for anyone who came here looking: the Intro's timeline
   * constants are local to `components/intro/Intro.tsx`, because they are one
   * sequence's internal phase split and nothing else may reuse them. The one
   * value that genuinely crosses a module boundary is `HANDOFF_S` in
   * `lib/animation/handoff.ts`, with the reasoning for why it is not here.
   * (It read "the SHARED LENGTH of the hero expansion and the navbar
   * entrance". It is the navbar's slide only — 0.45s against the hero's 1.6s
   * `ARRIVAL_S`. What the two share is the start instant.)
   */
} as const;

/** Delay between siblings in a staggered sequence, in seconds. */
export const STAGGER = {
  /**
   * Hero headline lines. ONE CONSUMER: the hero's two tagline units
   * (`HeroHeadline.tsx:119`, `:124`). No Tier 2 or Tier 3 section consumes it,
   * and none should without reading the invariant below.
   *
   * IT HAD TWO. The second was the Contact close beat's three blocks, and this
   * block used to say so and then build a worked example on it (see the
   * invariant below). That sequence — three `Reveal`s at monotonic delays
   * 0 / 0.10 / 0.20 — was RETIRED AT EVERY WIDTH when Contact became the
   * reveal-footer curtain: the plate is in the viewport from first paint,
   * pinned and occluded, so an IntersectionObserver reveal fires behind the
   * page and finishes before anyone sees it. `RevealFooter.tsx:165-177` is the
   * full record and says outright that restoring it would ship a footer that
   * animates in secret. The example below is kept as an EXAMPLE, in the past
   * tense, because it is the clearest statement of the invariant this project
   * has — but it no longer describes anything on screen.
   *
   * Ticket 4's About section was designed to reuse this for its first beat,
   * which is why no STAGGER.section entry was ever added. It then removed the
   * delay outright: after a scroll-cue click the heading and the first two
   * beats intersect on one observer tick, and a non-zero delay on beat 1 alone
   * made the sequence render backwards. If a section ever wants a stagger
   * again, reuse this rather than inventing a per-section cadence — but read
   * About's comment first, because the same trap applies to anything a jump
   * link can land on.
   *
   * THE INVARIANT, stated precisely, because About's case is easy to over-read
   * as "never stagger": DELAYS MUST INCREASE MONOTONICALLY IN DOCUMENT ORDER.
   * About's defect was a NON-MONOTONIC sequence (0 / 0.10 / 0), which renders
   * backwards when a jump lands every unit on one observer tick. Contact's
   * retired 0 / 0.10 / 0.20 could not: increasing delays still play
   * top-to-bottom on a simultaneous tick. An INDEX CASCADE
   * (`delay={index * STAGGER.line}`) is still wrong wherever units have
   * independent triggers and a reader may arrive at one deliberately — the
   * delay is then measured from the wrong origin. It is safe only where the
   * units always enter together, as the Contact bookend panel's three blocks
   * did.
   *
   * Retuned 0.08 -> 0.10 in Ticket 3.
   *
   * The identity statement is only TWO units, and at 80ms two units read as
   * near-simultaneous. 100ms against a 700ms reveal is a ~14% offset — enough
   * to register as a sequence (the stance arrives, then the direction lands)
   * while staying well inside one gesture.
   */
  line: 0.1,
  /**
   * Project card entrance (Tier 2). **ZERO CONSUMERS — nothing imports it.**
   *
   * `Projects.tsx:113` is the standing decision and the reason: a jump-link
   * arrival on `#work` lands a whole row on one observer tick, and an index
   * cascade would then render that row out of order. The scrub did not
   * reintroduce it either — a scrub has no `delay` to stagger with.
   *
   * KEPT, NOT DELETED, and deliberately labelled: the value is the documented
   * cadence for a card grid that ever enters under a single trigger, and its
   * absence from the gallery is a decision worth being able to point at. If a
   * second unused entry ever joins it, delete both — one dead constant with a
   * stated reason is a record; two is a habit.
   */
  card: 0.09,
} as const;
