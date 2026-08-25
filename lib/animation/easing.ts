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
   * The site's one stagger cadence. FIVE LIVE CONSUMERS, and the clause that
   * used to head this block — "ONE CONSUMER: the hero's two tagline units
   * (`HeroHeadline.tsx:119`, `:124`). No Tier 2 or Tier 3 section consumes it,
   * and none should" — was false on both counts, and its two line numbers had
   * drifted off the calls they named, which is why this list carries none:
   *
   *   `HeroHeadline.tsx`   Tier 1, the two tagline units, `index * line`
   *   `AboutScreen.tsx`    Tier 2, entrance units 2-4, `line` / `*2` / `*3`
   *   `IntroEntrance.tsx`  the off-Home entrance onset, `* 3`
   *
   * `grep -rn "STAGGER.line" app components lib` is the check, and it is the
   * only one that stays true. `/about`'s three PREDATE the branch that moved
   * the Intro; they were never covered by "no Tier 2 or Tier 3 section
   * consumes it".
   *
   * WHAT THIS CONSTANT ACTUALLY PROTECTS IS SEQUENCING, NOT AMPLITUDE — and
   * the two are easy to conflate because a Tier 1 constant appearing in a
   * Tier 2/3 file LOOKS like an energy-curve violation. It is not one. The
   * invariant below is about DELAY ORDER: monotonic delays are safe, index
   * cascades are not, wherever units have independent triggers. Nothing here
   * governs distance, duration or curve, all three of which stay with the
   * component doing the moving (`Reveal`: 13px, 0.70s, `EASE.reveal`).
   *
   * SO A FLAT ONSET BUILT FROM THIS VALUE DOES NOT MAKE `/work` A TIER 1
   * RENDER SITE. `IntroEntrance` multiplies it by 3 and applies the SAME
   * number to every unit — no index, no cascade, no per-unit increment — which
   * is a translation of the whole group in time, not a stagger at all. It
   * cannot render anything out of order because there is no order to get
   * wrong. Contrast `--field-ink`'s case in `app/globals.css`, which IS an
   * amplitude/tier question: a COLOUR carried to a new tier repaints that
   * tier. A DELAY carried to a new tier delays it. Only one of those is
   * visible as energy.
   *
   * THE HERO HAD IT ALONE ONCE, AND FOR A WHILE IT HAD TWO. The second was the
   * Contact close beat's three blocks, and this
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

/**
 * THE FOURTH CURVE FAMILY, AND IT IS DELIBERATE. This answers the paragraph
 * above `EASE` — "Three curves, one per job. Resist adding a fourth without a
 * real reason" — rather than stepping around it. The resistance was real and it
 * was overruled on the record.
 *
 * WHO DECIDED, AND WHEN: Saad, 2026-08-25, ruling on the projects-architecture
 * design round (`.claude/specs/projects-architecture-spec.md`, "▸ RULED —
 * decision round 2", J.3). The deck on `/work` copies the *interaction* of the
 * Interface Craft reference (`ui.aceternity.com/labs/interface-crafts-cards`),
 * and its motion is the recognisable half of that interaction: cards that
 * settle rather than arrive. A cubic-bezier cannot express settle-with-overshoot
 * at all, so this is not "a fourth ease" — it is a different KIND of curve, and
 * that is exactly why it is named and scoped here instead of being written
 * inline at the call site.
 *
 * THE VALUE IS THE REFERENCE'S OWN, unchanged: `visualDuration: 0.6`,
 * `bounce: 0.25`. It is not re-tuned, because the reason it exists is to match
 * a specific reference and a hand-adjusted approximation of it would be neither
 * the reference nor a house value. `visualDuration` is Framer Motion's
 * perceptual duration (time to the first arrival at the target), not the time
 * to full rest — the tail continues past it.
 *
 * SCOPE: `/work`'s fanned deck, and nothing else. If a second consumer ever
 * appears, that is a motion-system decision to be taken deliberately, the same
 * way this one was.
 *
 * **ONE CONSUMER, AND IT IS REAL AS OF 2026-08-25: `components/sections/
 * ProjectDeck.tsx`.** It is imported ONCE and applied at three call sites
 * inside that one component, all of them the same interaction:
 *
 *   `FanCard`     the fan's rest/expand/collapse transform choreography
 *   `DeckPanel`   the expanded panel's scale-and-fade in and out
 *   `DeckStack`   the mobile stack's swipe settle — the same interaction at
 *                 another orientation, which is why it is not given a
 *                 different curve
 *
 * **A FOURTH USE EXISTS, IT WAS NOT CHOSEN, AND IT IS ENUMERATED HERE BECAUSE A
 * SCOPE LIST THAT QUIETLY OMITS A USE IS WORSE THAN A LONGER ONE:**
 *
 *   `FanCard`     the RETURN leg of the rest card's hover lift. The lift IN is
 *                 `DURATION.micro` + `EASE.ui`, per design §C.9 and per the
 *                 "hover, press" row of `docs/03`'s motion table — that
 *                 transition is declared on the gesture target. Motion applies
 *                 a gesture target's own transition on the way IN only; on
 *                 hover END it re-applies the lower-priority `animate` target,
 *                 which is the deck's choreography and therefore this spring.
 *                 "Hover out" and "re-apply the base target" are the same
 *                 operation, so there is no declarative hook for a different
 *                 curve on that leg.
 *
 * That use is RECORDED rather than sanctioned: it is a consequence of Motion's
 * gesture model, not a design decision, and it must not be cited as precedent
 * for springing another hover. The two ways to remove it were weighed and both
 * were refused in this session because neither could be looked at in a browser
 * — a React hover state would have to distinguish a hover change from a
 * COLLAPSE change or it takes the collapse off the spring, and splitting the
 * card into an outer animated element plus an inner hover target changes both
 * the lift's axis and its stacking context. `ProjectDeck.tsx`'s `whileHover`
 * carries the full note.
 *
 * THE DECK'S CONTENT ENTRANCES ARE **NOT** SPRUNG and that is deliberate: the
 * cover, the text column and the index rail fade in on `DURATION.ui` +
 * `EASE.reveal`, because a fade is not a settle and a bounced opacity is
 * nothing. The spring is on the boxes only.
 *
 * **THE RETRACTION TRIGGER DID NOT FIRE, AND IT IS RECORDED HERE BECAUSE IT WAS
 * REAL.** This block read "ZERO CONSUMERS TODAY — nothing imports it" from the
 * moment it shipped in slice 1 (it briefly read "One consumer", which was false
 * then), and it carried an explicit instruction: if the deck's flat-material
 * ruling meant the deck never actually sprang, this export and its `docs/03`
 * entry were to be RETRACTED rather than relabelled. The deck was built and it
 * springs — the flat ruling governs MATERIAL (radius, shadow, fill) and the
 * spring is MOTION, so the two never collided. Nothing was retracted.
 *
 * `STAGGER.card` above is still at zero and is still kept, and its "if a second
 * unused entry ever joins it, delete both" rule now has nothing to catch: it is
 * once again the only unconsumed constant in this file.
 *
 * IT DOES NOT RETROACTIVELY LICENSE SPRINGS ANYWHERE ELSE, AND TWO EXISTING
 * REFUSALS STAND UNCHANGED:
 *
 *   `components/sections/CoverFrame.tsx` — "A SPRING WAS REJECTED. Its overshoot
 *   would push the cover past its final rect — visible against the `<h1>`'s
 *   fixed left edge one row below."
 *
 *   `components/sections/ProjectOverlay.tsx` — "No spring ... a spring's
 *   overshoot would push the cover past its final rect, visibly, against the
 *   `<h1>`'s fixed left edge one row below."
 *
 * BOTH OF THOSE REFUSALS HAVE TWO REASONS AND ONLY THE SECOND ONE EXPIRED.
 * Each ends with "and it would add a fourth curve family to a three-ease
 * system" — that clause is now spent, and this entry is what spent it. The
 * FIRST reason is a geometric fact about the card → cover morph and is
 * untouched: an overshoot measured against a fixed reference edge one row below
 * is a visible error, and the deck has no such edge to be measured against. Do
 * not read those two files as stale, and do not "unify" the morph onto this
 * spring. If either comment is ever edited, keep the geometric half.
 *
 * TYPED AS DATA, NOT AS FRAMER MOTION'S `Transition`. This file's header states
 * it must stay dependency-free — importing `motion` here would drag it into a
 * client bundle it does not belong in. Framer Motion accepts this object
 * structurally.
 */
export const SPRING = {
  type: "spring",
  /** Perceived arrival, in seconds. Not the settle time. */
  visualDuration: 0.6,
  /** 0 = no overshoot, 1 = very bouncy. The reference's value. */
  bounce: 0.25,
} as const;
