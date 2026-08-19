/**
 * Contact section copy — Ticket 10.
 *
 * TWO STRINGS, BOTH FIXED UI CHROME. Every link — its label, its visible value
 * and its href — comes from `content/contact.ts`, which is the collection layer
 * and the file that gets hand-edited when LinkedIn arrives. This module exists
 * for the same reason `aboutContent.ts`, `skillsContent.ts`,
 * `projectsContent.ts`, `projectDetailContent.ts`, `experienceContent.ts` and
 * `currentlyLearningContent.ts` do: fixed-arity chrome for one surface is not a
 * collection.
 *
 * AND NO PER-LINK COPY OF ANY KIND. No "preferred", no "fastest way", no
 * response-time promise, no availability statement, no location line, no
 * copyright, no colophon, no "built with". Nothing on this surface may state a
 * fact Saad has not stated.
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
 * Saad's call (G1), made deliberately as the PLAIN option.
 *
 * IT BREAKS THE ONE-WORD REGISTER ON PURPOSE, and the reason is the same one
 * that put `Experience` beside `Trajectory` / `Stack` / `Work` / `In Progress`:
 * this is a SCANNABILITY case, not a voice case. `Contact` is the word someone
 * looks for when they want to hire him, and being distinctive is worth nothing
 * if the person scanning the page for "contact" slides straight past it.
 * `Elsewhere` and `Reach` were both considered and rejected on exactly that.
 *
 * DO NOT "FIX" THIS TOWARD A MORE DISTINCTIVE NOUN LATER. It also sets the
 * section `id` (`contact`), the `aria-labelledby` target (`contact-heading`)
 * and the anchor any future nav points at, so renaming it breaks links.
 */
export const CONTACT_HEADING = "Contact";

/**
 * The closing line. SAAD'S WORDS, supplied 2026-08-19 and reproduced verbatim
 * (.claude/handoff/ticket-10-plan.md G4). Not the implementer's, and not a
 * planner's.
 *
 * WHY THIS ONE, over an availability line and a positioning line: it is the
 * only candidate that does not repeat what About already says. Both others
 * restated the trajectory `aboutContent.ts` beat 3 delivers — the same
 * duplication cut from the project detail pages at Ticket 7's G2. A site that
 * states its positioning twice reads as padded, and this is the last thing a
 * visitor sees.
 *
 * It also claims nothing that needs verifying. "Open to hearing about work in
 * that direction" would be a genuinely useful signal, but it is an availability
 * claim and Saad did not make it. CLAUDE.md rules out the whole generic
 * register this replaces: no "let's build something amazing together", no
 * "always open to new opportunities", no "feel free to reach out".
 */
export const CONTACT_CLOSING_LINE =
  "I read everything that arrives here. Email is fastest.";
