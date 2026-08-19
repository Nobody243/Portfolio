/**
 * In Progress section copy — Ticket 9.
 *
 * SIX EXPORTS, ALL OF THEM FIXED UI CHROME. Every word about a learning item
 * itself — its title, what it is, when it started, where it links — comes from
 * `content/currentlyLearning.ts`, which is the collection layer and THE LIVING
 * FILE this whole section exists to render. This module exists for the same
 * reason `aboutContent.ts`, `skillsContent.ts`, `projectsContent.ts`,
 * `projectDetailContent.ts` and `experienceContent.ts` do: fixed-arity chrome
 * for one surface is not a collection.
 *
 * AND NO PER-ENTRY COPY OF ANY KIND. `content/currentlyLearning.ts` is
 * authoritative and this module must never shadow it. No example entry, no
 * "nothing yet" caption, no "coming soon", no aspirational placeholder, no
 * explanatory sentence about the section being sparse. That file's header
 * forbids padding at the data layer; adding it here instead would be the same
 * fabrication one directory over.
 *
 * HARD RULES, inherited verbatim from content/types.ts because the failure mode
 * is identical — styling leaking into a data file, where it is hardest to
 * notice:
 *   - Pure data. No "use client", no JSX, no React import, no next/* import.
 *   - NO colour hexes, NO Tailwind class strings, NO font names. Styling is the
 *     consumer's job, always.
 *   - Absent things are ABSENT KEYS — never "", never a placeholder.
 *
 * The one permitted import is the TYPE-ONLY `LearningStatus` below, which is
 * erased at compile time and creates no runtime coupling. It is what makes
 * STATUS_LABELS exhaustive.
 */

import type { LearningStatus } from "@/content/types";

/**
 * `In Progress`, chosen over `Currently Learning` — and the choice is not
 * cosmetic.
 *
 * Two reasons, both deliberate:
 *   1. REGISTER. The site's shipped section names are `Trajectory` / `Stack` /
 *      `Work` / `Experience` — terse nouns. "Currently Learning" is a verb
 *      phrase and the longest heading on the site; at `text-h2` (68px at
 *      1440px) it would wrap on a phone where every sibling heading does not.
 *   2. WHAT THE WORD INVITES. "Learning" asks the reader to weigh this as a
 *      CREDENTIAL — a claim about acquired knowledge — when the section is
 *      deliberately a STATUS: here is what is underway, unfinished, stated
 *      plainly. "In Progress" says the thing without inviting the wrong
 *      evaluation. CLAUDE.md's positioning rule is that this section is a
 *      visible trajectory, not an achievement list.
 *
 * The ticket's own title is "Currently Learning / In Progress", so both names
 * are sanctioned by it; this picks the second half.
 *
 * CHANGING THIS STRING IS NOT A LOCAL EDIT. The section's `id` is derived from
 * it (`#in-progress`), so it is also a linkable anchor — a two-file commit
 * today (this module plus the `id` in `CurrentlyLearning.tsx`), and a three- or
 * four-file one once a nav or Ticket 15's resume link points at it.
 */
export const IN_PROGRESS_HEADING = "In Progress";

/**
 * `LearningStatus` -> the word rendered for it.
 *
 * WHY THIS LIVES HERE AND NOT IN /content: a display string is styling-adjacent
 * and content/types.ts states that styling is the consumer's job, always. The
 * data layer stores `"in-progress"`, a stable machine value that must survive a
 * copy change; this module decides what that reads as on screen. Exactly the
 * split `Experience`'s ONGOING_LABEL makes for an absent `endDate`.
 *
 * EXHAUSTIVE OVER `LearningStatus` ON PURPOSE, the same guard `Skills.tsx` uses
 * for `SkillGroup`: adding a fourth status to the union without adding a label
 * here is a TYPE ERROR rather than a blank space beside an entry in production.
 * Do not loosen this to a `Partial` or an index signature, and do not add a
 * `?? status` fallback at the call site — that would silently print the raw
 * kebab-case key.
 *
 * SENTENCE CASE, NOT TITLE CASE, and that is the one considered difference from
 * Skills' Title Case group labels. `In progress` beside an entry must not read
 * as a repeat of the `In Progress` section heading; these are status VALUES, not
 * titles, and the casing is what distinguishes the two registers at a glance.
 * There is no `capitalize` or `uppercase` class anywhere in the consumer — the
 * strings are authored in their display casing here, so the DOM text and the
 * rendered text never disagree.
 *
 * NOT COLOUR-CODED, and nothing here may be extended to imply that. The site
 * has two accents with one job each; a green "Completed" and an amber
 * "In progress" would be two new semantic colours invented in a data file. The
 * words carry the distinction.
 */
export const STATUS_LABELS: Record<LearningStatus, string> = {
  "in-progress": "In progress",
  planned: "Planned",
  completed: "Completed",
};

/**
 * Prefixes the start month when an entry has no `completedDate`.
 *
 * A bare "March 2026" under a title is ambiguous — started, due, expiring? —
 * and the status word alone does not disambiguate it, because "Planned" plus a
 * lone date reads as a target date rather than as a start. One word fixes it.
 *
 * It is NOT used when `completedDate` is present: a range already says which
 * end is which, and "Started March 2026 – July 2026" is worse English than
 * either shape alone.
 */
export const STARTED_LABEL = "Started";

/**
 * Between the two dates of a range. A SPACED EN DASH (U+2013).
 *
 * DECLARED HERE, not imported from `experienceContent.ts`: one section's
 * content module must never import another's, so the two are duplicated
 * verbatim and change together. Same reasoning as that file — this does not
 * break the "no separator glyph" rule, which governs delimiters BETWEEN LIST
 * ITEMS where whitespace already separates. A range with no connector is not
 * readable, so the connector is part of the value's meaning.
 *
 * Only reachable for a `completed` entry, which the lifecycle in
 * content/currentlyLearning.ts makes a TRANSIENT state — completed items
 * graduate out into skills.ts. It is here so that transient state renders
 * correctly rather than being a gap someone discovers on the day it happens.
 */
export const RANGE_SEPARATOR = " – ";

/**
 * Labels the section's own freshness note, rendered once beneath the entries.
 *
 * `Last reviewed`, NOT `Last updated`, even though the ticket calls it a "last
 * updated" note. The constant it renders — `CURRENTLY_LEARNING_UPDATED` — is
 * documented in content/currentlyLearning.ts as the date the content was last
 * CHECKED, bumped even when nothing changed, precisely because "reviewed and
 * still nothing in progress" is real information. "Updated" would claim a
 * change that may not have happened, which is a small false statement of
 * exactly the kind CLAUDE.md rules out. The label matches the value's meaning.
 *
 * It is a NOTE ABOUT THE SECTION, never about an entry — do not reuse it as a
 * per-entry date label.
 */
export const LAST_REVIEWED_LABEL = "Last reviewed";

/**
 * Appended to an entry link's accessible name, never rendered visibly.
 *
 * A new tab that is not announced is sprung on a screen-reader user rather than
 * offered. The consumer renders it inside an `sr-only` span with a leading
 * space, so the accessible name reads "<the entry's title> (opens in a new
 * tab)". No example cert is named here — there are none, and a plausible one in
 * a comment is the first step toward one in the data file.
 *
 * NOT an `aria-label` on the anchor: a hand-written accessible name that
 * differs from the visible text is drift. This appends to the visible text
 * rather than replacing it. Duplicated verbatim from `experienceContent.ts` and
 * `projectDetailContent.ts` — see CurrentlyLearning.tsx on why the three are
 * not yet shared.
 */
export const NEW_TAB_NOTE = "(opens in a new tab)";
