/**
 * Currently Learning / In Progress — Ticket 2.
 *
 * THIS IS THE LIVING FILE. It is meant to be edited by hand as certs, courses
 * and CTFs actually happen — that is its entire purpose. Update
 * CURRENTLY_LEARNING_UPDATED in the same edit.
 *
 * IT SHIPPED EMPTY FROM TICKET 2 UNTIL 2026-08-28, AND THAT WAS THE HONEST
 * ANSWER RATHER THAN A GAP. This paragraph read: "Nothing is genuinely in
 * progress right now. There is deliberately not even a 'planned' entry for the
 * Linux fundamentals work Saad named as a likely start but has not begun — a
 * 'planned' entry for something unstarted is exactly the padding CLAUDE.md and
 * the PRD's non-goals rule out."
 *
 * **THAT RULE IS UNCHANGED AND IS WHY THE ARRAY IS TWO ENTRIES AND NOT FIVE.**
 * Both below are real, both are actually underway, and neither is padded with a
 * syllabus nobody verified. The empty state is not deleted either — the
 * component still returns `null` on an empty array, which is the case this file
 * returns to the moment both graduate into `skills.ts`.
 *
 * **THE SECTION RENDERED FOR THE FIRST TIME WITH THIS EDIT.** Because the empty
 * array made the component return `null`, `#in-progress` was never in `/work`'s
 * served HTML — so no layout measurement anywhere in this repo was taken with
 * this section present. Anything that says otherwise predates 2026-08-28.
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

/**
 * ═══ WHAT THE SCHEMA CANNOT HOLD, FLAGGED RATHER THAN WORKED AROUND ═══
 *
 * `LearningEntry` has `title`, `status`, `description`, `startedDate`, and
 * optional `completedDate` / `link` / `linkPreview`. **It has no field for a
 * PROVIDER, a LEVEL, or a CAREER PATH**, and all three are real, structured
 * facts about both entries below rather than prose about them:
 *
 *     provider     Cisco Networking Academy   (identical for both)
 *     level        Beginner                   (identical for both)
 *     pace         Self-paced                 (identical for both)
 *     career path  Junior Cybersecurity Analyst   (identical for both)
 *
 * They are carried in `description` because that is the only free-text field
 * the type defines. **The type was deliberately NOT widened in this edit** —
 * adding `provider` and `careerPath` would change the render (a provider is a
 * meta-line fact next to the status, not a sentence) and that is a design
 * decision rather than a content one. The cost of leaving it: four facts that
 * are identical across both entries are repeated in two prose blocks, and the
 * career path — which is the thing that makes these two read as ONE deliberate
 * track rather than two unrelated courses — has no structural expression at all.
 *
 * **If a third course from the same path is ever added, widen the type instead
 * of writing the same sentence a third time.**
 *
 * `link` IS UNSET ON BOTH, and that is a refusal rather than an omission. Both
 * courses have public pages on netacad.com, but this file's own rule against
 * inventing content covers URLs: a guessed course URL that 404s is worse than
 * no link, and `link` is documented as optional with "unset is the normal
 * state". Add the real URLs when they are to hand.
 */
export const currentlyLearning: readonly LearningEntry[] = [
  {
    title: "Introduction to Cybersecurity",
    status: "in-progress",
    /* STARTED DATE — SEE THE NOTE AT `CURRENTLY_LEARNING_UPDATED`. This is the
       month the entry was ADDED, not a verified enrolment month; the field is
       required and the section renders it as "Since August 2026". Correct it if
       either course started earlier. */
    startedDate: "2026-08",
    description:
      "Cisco Networking Academy, beginner level, self-paced. Part of the " +
      "Junior Cybersecurity Analyst career path.",
  },
  {
    title: "Networking Basics",
    status: "in-progress",
    /* Same caveat as above. */
    startedDate: "2026-08",
    description:
      "Cisco Networking Academy, beginner level, self-paced. Part of the " +
      "same Junior Cybersecurity Analyst career path — the networking half of " +
      "it, alongside the security course above.",
  },
];

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
 *
 * ONLY THE MONTH AND YEAR EVER RENDER. The value is YYYY-MM-DD, but the
 * section formats it through lib/formatMonthYear.ts, which takes the first two
 * segments — so "2026-08-17" displays as "August 2026". Keep the day anyway:
 * it costs nothing, it makes this constant useful as a record of when the
 * review actually happened, and month precision is the right granularity for a
 * freshness stamp a visitor reads. Noted here rather than only in the
 * component, because this line is what someone edits.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * 2026-08-28: THIS DATE IS VERIFIED. THE TWO `startedDate` VALUES ARE NOT.
 * ──────────────────────────────────────────────────────────────────────────
 * The brief that added the two courses gave their provider, level, pace and
 * career path, and no enrolment date. `startedDate` is REQUIRED by
 * `LearningEntry` and renders as visible text ("Since August 2026"), so it
 * could not simply be left out. Both are set to the month the entries were
 * added, and the assumption is recorded here and at each entry rather than
 * being allowed to pass as a verified fact — this file's whole discipline is
 * that nothing on it is invented. **If either course began earlier, change the
 * two `startedDate` values; nothing else depends on them.**
 */
export const CURRENTLY_LEARNING_UPDATED = "2026-08-28";
