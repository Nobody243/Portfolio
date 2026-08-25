/**
 * Certifications section copy — `/work`.
 *
 * TWO STRINGS, AND THE SECOND ONE IS THE WHOLE SECTION. There is no
 * `content/certifications.ts` because there are no certifications: Saad holds
 * none today and `content/currentlyLearning.ts` is empty, so there is nothing
 * to model, iterate or render. Inventing a data file for an empty set would be
 * scaffolding pretending to be content.
 *
 * **WHEN THE FIRST CERTIFICATION IS REAL**, the honest move is a
 * `content/certifications.ts` shaped like `content/currentlyLearning.ts` (a
 * `readonly Entry[]` with a plain annotation, NOT `as const satisfies`, so
 * `.map()` on an empty array still compiles), and `Certifications.tsx` gates on
 * `.length` exactly as `CurrentlyLearning.tsx` does. Until then this module is
 * the whole thing.
 *
 * HARD RULES, inherited verbatim from `content/types.ts` because the failure
 * mode is identical — styling leaking into a data file, where it is hardest to
 * notice:
 *   - Pure data. No "use client", no JSX, no React import, no next/* import.
 *   - NO colour hexes, NO Tailwind class strings, NO font names.
 *   - Absent things are ABSENT KEYS — never "", never a placeholder.
 */

/**
 * The section heading. Plural, and it stays plural at zero — an empty section
 * headed "Certification" would be stranger than one headed "Certifications",
 * and the count is not the heading's job.
 */
export const CERTIFICATIONS_HEADING = "Certifications";

/**
 * The one line the section renders today.
 *
 * **"Coming soon." AND NOTHING ELSE. THIS IS A CEILING, NOT A STARTING POINT.**
 * It is the spec's own wording (§1.3), kept verbatim precisely so that no copy
 * was invented here. Every longer version anyone will be tempted to write
 * claims something that is not true yet:
 *
 *   "Currently studying for ..."   — nothing is in progress; `content/
 *                                    currentlyLearning.ts` is empty and says so
 *                                    in its own header, confirmed by Saad.
 *   "First certification in 2026"  — a date nobody has committed to.
 *   "Security+ and AWS planned"    — a plan is not a fact, and CLAUDE.md's
 *                                    positioning rules out padding the
 *                                    trajectory with intentions.
 *
 * If a certification is ever genuinely under way, it belongs in
 * `content/currentlyLearning.ts` — which is the living file built for exactly
 * that — and this section acquires real entries rather than better copy.
 *
 * IT IS AUTHORED IN SENTENCE CASE and is NOT transformed in CSS. `Skills.tsx`
 * states the rule: transforming case in CSS makes the DOM text and the rendered
 * text disagree, which is a problem for anything reading the page rather than
 * looking at it.
 */
export const CERTIFICATIONS_PLACEHOLDER_LINE = "Coming soon.";
