/**
 * Experience section copy — Ticket 8.
 *
 * FIVE STRINGS, ALL OF THEM FIXED UI CHROME. Every word about the role itself —
 * the company, the title, the dates, the location, the stack and the prose —
 * comes from `content/experience.ts`, which is the collection layer and the
 * file that gets hand-edited for a year. This module exists for the same reason
 * `aboutContent.ts`, `skillsContent.ts`, `projectsContent.ts` and
 * `projectDetailContent.ts` do: fixed-arity chrome for one surface is not a
 * collection.
 *
 * AND NO PER-ENTRY COPY OF ANY KIND. `content/experience.ts` is authoritative
 * and this module must never shadow it. No "my first role" note, no
 * "internship" qualifier, no intro sentence, no entry count, no
 * "currently seeking" line.
 *
 * HARD RULES, inherited verbatim from content/types.ts because the failure mode
 * is identical — styling leaking into a data file, where it is hardest to
 * notice:
 *   - Pure data. No "use client", no JSX, no React import, no next/* import.
 *   - NO colour hexes, NO Tailwind class strings, NO font names. Styling is the
 *     consumer's job, always.
 *   - Absent things are ABSENT KEYS — never "", never a placeholder.
 */

/**
 * Saad's call, made deliberately as the PLAIN option.
 *
 * The site's established section register is `Trajectory` / `Stack` / `Work` —
 * terse, mildly unexpected nouns — and `Industry`, `Employment` and `Hired`
 * were all on the table and would each have fitted it better. `Experience` is
 * chosen anyway because it is the word a recruiter scans for, and this is the
 * one section where scannability beats register consistency. That trade is the
 * decision; it is not an oversight to be "corrected" back to a wittier noun.
 *
 * CHANGING THIS STRING IS NOT A LOCAL EDIT. The section's `id` is derived from
 * it (`#experience`), so it is also a linkable anchor — a two-file commit today
 * (this module plus the `id` in `Experience.tsx`), and a three- or four-file
 * one once a nav or Ticket 15's resume link points at it.
 */
export const EXPERIENCE_HEADING = "Experience";

/**
 * The technology-list label.
 *
 * `Built with` matches `projectDetailContent.ts` so one vocabulary covers both
 * surfaces. It is DECLARED HERE, not imported from that module: one section's
 * content module must never import another's. `Stack` is unavailable — it is
 * `SKILLS_HEADING`.
 */
export const STACK_LABEL = "Built with";

/**
 * What renders in place of an end date when a role has no `endDate`.
 *
 * UNEXERCISED TODAY — the internship ended, so nothing on the site currently
 * shows this word. It exists because `endDate` being absent is how the data
 * layer encodes "ongoing" (content/types.ts), and the label has to live in the
 * copy layer rather than in the date field. It is the string that renders the
 * day Saad takes a job and does not add an end date.
 */
export const ONGOING_LABEL = "Present";

/**
 * Between the two dates of a range. A SPACED EN DASH (U+2013).
 *
 * This does not break Skills' and ProjectCard's "no separator glyph" rule: that
 * rule governs delimiters BETWEEN LIST ITEMS, where whitespace already
 * separates. A range with no connector — "June 2025 August 2025" — is not
 * readable, so the connector is part of the value's meaning rather than
 * decoration. En dash rather than hyphen is the typographic convention for
 * ranges, and JetBrains Mono carries the glyph.
 *
 * It sits between two content values, which is why it lives beside the copy and
 * not buried in JSX.
 */
export const RANGE_SEPARATOR = " – ";
