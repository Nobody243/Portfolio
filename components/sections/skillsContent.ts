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
 * NO SUBHEADING AND NO INTRO SENTENCE. The section's argument is carried by the
 * group order and by the entry counts the component computes.
 *
 * THE SECOND STRING IS A PHASE 3 REVERSAL, AND IT IS DELIBERATE. Ticket 5's
 * version of this header also banned an EMPTY-GROUP CAPTION, on the reasoning
 * that copy about "Currently Building Toward" being empty would be an apology.
 * `docs/07_SITE_RESTRUCTURE.md` §5's third resolution overrides that, and the
 * distinction it draws is the one that matters: the banned thing was an
 * APOLOGY, and the line below is a CLAIM, in the indicative. The ban stands in
 * its original spirit — no "coming soon", no "watch this space", no "more to
 * come", nothing that implies an entry is imminent or excuses its absence.
 */

export const SKILLS_HEADING = "Stack";

/**
 * The line an EMPTY skill group renders in place of its entries. Saad's, final,
 * and not to be reworded to fit a layout.
 *
 * IT IS NOT GROUP-SPECIFIC COPY. `Skills.tsx` renders it whenever a group's
 * count is zero, keyed on the count and never on `group.id` — so if Core Dev
 * were ever emptied it would say the same honest thing. That is why the name is
 * SKILLS_EMPTY_GROUP_LINE and not SKILLS_BUILDING_TOWARD_LINE, and why it does
 * not live as a field on SKILL_GROUPS: a per-group field would sit unused on
 * two groups out of three, and it is section chrome, not a skill record.
 *
 * WHY IT EARNS ITS PLACE BESIDE THE COMPUTED `00`. The count answers HOW MANY.
 * It cannot answer why, for how long, or whose decision this was — that is
 * copy's job and only copy's. The two never collide because they differ on five
 * axes at once: size, typeface, opacity, position and grammatical form. One is
 * metadata beside a label; this is a sentence in the content region.
 *
 * TWO SENTENCES, TWO FULL STOPS, NO HEDGE. Not "Nothing here yet", not
 * "Coming soon", not a trailing ellipsis. 39 characters, which fits one line at
 * 360px with about 44px to spare; if it is ever revised, the ceiling at that
 * width is roughly 45 characters.
 */
export const SKILLS_EMPTY_GROUP_LINE = "Reserved. This is the group that grows.";
