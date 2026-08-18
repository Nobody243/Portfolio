/**
 * Skills section copy — Ticket 5.
 *
 * ONE STRING. Everything else the section renders — the three group labels,
 * all 18 entries and all 8 notes — comes from `content/skills.ts`, which is the
 * collection layer and the file that gets hand-edited for a year. This module
 * exists for the same reason `aboutContent.ts` does: a section heading is
 * fixed-arity prose for one section, not a collection.
 *
 * "Stack" is Saad's, approved verbatim (ticket-5-plan.md §17). Do not
 * paraphrase it, do not expand it to "Skills & Stack", and do not reword it to
 * fit a layout. If the layout needs different text, that is a question back to
 * Saad, not an edit here. The section's `id` is derived from it (`#stack`), so
 * changing the string is also a change to a linkable anchor.
 *
 * HARD RULES, inherited verbatim from content/types.ts because the failure mode
 * is identical — styling leaking into a data file, where it is hardest to
 * notice:
 *   - Pure data. No "use client", no JSX, no React import, no next/* import.
 *   - NO colour hexes, NO Tailwind class strings, NO font names. Styling is the
 *     consumer's job, always.
 *   - Absent things are ABSENT KEYS — never "", never a placeholder.
 *
 * NO SUBHEADING, NO INTRO SENTENCE, AND NO EMPTY-GROUP CAPTION. The section's
 * argument is carried by the group order and by the entry counts the component
 * computes; explanatory copy about "Currently Building Toward" being empty is
 * ruled out by the ticket's own acceptance criteria. Adding a string here to
 * apologise for that group would undo the design.
 */

export const SKILLS_HEADING = "Stack";
