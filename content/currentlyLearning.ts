/**
 * Currently Learning / In Progress — Ticket 2.
 *
 * THIS IS THE LIVING FILE. It is meant to be edited by hand as certs, courses
 * and CTFs actually happen — that is its entire purpose. Update
 * CURRENTLY_LEARNING_UPDATED in the same edit.
 *
 * IT SHIPS EMPTY, AND THAT IS THE HONEST ANSWER, NOT A GAP.
 * Nothing is genuinely in progress right now. There is deliberately not even a
 * "planned" entry for the Linux fundamentals work Saad named as a likely start
 * but has not begun — a "planned" entry for something unstarted is exactly the
 * padding CLAUDE.md and the PRD's non-goals rule out. Ticket 9 needs an honest
 * empty state (not an apologetic one), and must not break when this array is
 * later non-empty: empty is the current case, not the only case.
 *
 * LIFECYCLE — completed items GRADUATE. A finished cert moves OUT of this array
 * into skills.ts under "building-toward" rather than lingering here as a
 * "completed" entry, so "Currently Learning" stays literally true while the
 * achievement stays visible. `completedDate` records that transition.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE DOES NOT USE `as const satisfies` (do not "fix" this)
 *
 * projects.ts and skills.ts both use `as const satisfies readonly T[]`, and the
 * inconsistency here is deliberate. `[] as const` has element type `never`, so
 * `currentlyLearning.map((entry) => entry.title)` would fail to compile with an
 * error whose cause is genuinely hard to see — and that map call is exactly
 * what Ticket 9 is going to write.
 *
 * A plain annotation is correct for an array that is currently empty and
 * expected to grow. If entries are added later, this annotation keeps working;
 * switching to `as const satisfies` at that point would be a real (and then
 * safe) choice, but it buys nothing here since there are no literals to
 * preserve.
 * ---------------------------------------------------------------------------
 */

import type { LearningEntry } from "./types";

export const currentlyLearning: readonly LearningEntry[] = [];

/**
 * When the content above was last REVIEWED — hand-edited, deliberately not
 * derived from file mtime or git.
 *
 * mtime does not survive a Vercel clone/build, and a git-derived date would
 * need build-time plumbing for one string. An explicit constant also means the
 * date reflects when the content was actually checked, not when a formatting
 * tweak touched the file — which is the honest meaning of "last updated".
 *
 * Update this whenever the array above is reviewed, even if nothing changed:
 * "reviewed and still nothing in progress" is real information.
 */
export const CURRENTLY_LEARNING_UPDATED = "2026-08-17";
