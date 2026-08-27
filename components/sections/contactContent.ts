/**
 * Reveal-footer copy — Ticket 10, extended by Phase 5's curtain.
 *
 * THREE STRINGS AND ONE DOM ID, ALL FIXED UI CHROME. Every link — its label,
 * its visible value and its href — comes from `content/contact.ts`, which is
 * the collection layer and the file that gets hand-edited when LinkedIn
 * arrives. This module exists for the same reason `aboutContent.ts`,
 * `skillsContent.ts`, `projectsContent.ts`, `projectDetailContent.ts`,
 * `experienceContent.ts` and `currentlyLearningContent.ts` do: fixed-arity
 * chrome for one surface is not a collection.
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
export const CONTACT_CLOSING_LINE = "Reach out. I read everything myself.";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * THE LINE ABOVE WAS "I read everything that arrives here. Email is fastest."
 * UNTIL 2026-08-27. SAAD SUPPLIED THE REPLACEMENT VERBATIM IN THE FOOTER
 * REDESIGN BRIEF, AS HE SUPPLIED THE ORIGINAL.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * EVERY TEST THE DOCBLOCK ABOVE APPLIES STILL PASSES, checked rather than
 * assumed: it repeats nothing `aboutContent.ts` says, it makes no availability
 * claim, and it is nowhere near the generic register CLAUDE.md bans by name.
 *
 * ONE THING IT DROPS ON PURPOSE — "Email is fastest." The old line ranked the
 * three channels; the new one does not. That ranking is not lost, it MOVED:
 * the redesign stacks the three links vertically with Email first, and array
 * order is display order (`content/contact.ts`). Position now says what the
 * sentence used to.
 *
 * "Reach out" IS AN IMPERATIVE, which the old line was not, and that is the
 * one register shift. It is not the banned kind — "feel free to reach out" is
 * the padded version and this is not it — but if it ever reads as pushy the
 * fix is Saad's wording, not a re-edit here.
 */

/**
 * The stamp's year. FOUR DIGITS, AND NOTHING ELSE — this is deliberately NOT a
 * copyright line, which `RevealFooter.tsx` bans outright.
 *
 * NOT `new Date().getFullYear()`, AND THAT IS THE WHOLE POINT OF THE CONSTANT.
 * A runtime year inside a prerendered server component freezes at BUILD time
 * anyway, so the dynamic version is not dynamic — it is a silent, undated claim
 * that changes whenever someone happens to redeploy. A constant is greppable,
 * deliberate, and edited by hand like every other piece of content on this
 * site.
 *
 * NAMED FOR WHAT IT IS. It is the year of this edition of the site, not a
 * copyright assertion: no `©`, no name, no "All rights reserved", no range, no
 * separator glyph. `RevealFooter.tsx` sets it BELOW the mark rather than beside
 * it for the same reason — every copyright line ever written is horizontal, and
 * a vertical mark-over-date stack is a stamp.
 *
 * A STRING, NOT A NUMBER, so nothing can arithmetic on it or reformat it with a
 * thousands separator.
 */
export const CONTACT_EDITION_YEAR = "2026";

/**
 * The id of the zero-height sentinel that marks the reveal footer's STATIC top
 * edge, rendered by `RevealFooter.tsx` immediately before the plate.
 *
 * WHY IT EXISTS AT ALL. The plate is `md:sticky md:bottom-0`, so from first
 * paint it is pinned at the bottom of the viewport, occluded by the page stack.
 * Its `getBoundingClientRect()` therefore reports the PINNED position, not the
 * document position — which means ScrollTrigger cannot measure the footer
 * itself and get a useful answer. The sentinel is an ordinary in-flow element
 * sitting exactly where the plate's top edge lives in document coordinates, so
 * it CAN be measured, and it crosses the navbar exactly when the un-occluded
 * plate does.
 *
 * WHAT READS IT: `Navbar.tsx`, to decide the bar's palette — the same way it
 * reads `HERO_SECTION_ID`. Its ABSENCE is meaningful and is the guard: `/about`
 * has no reveal footer, so it has no sentinel, so no trigger is created there.
 * Never render this id anywhere the plate is not directly beneath it.
 */
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE COPYRIGHT LINE — AND IT REVERSES A BAN THIS FILE AND `RevealFooter.tsx`
 * BOTH STATED IN AS MANY WORDS. ADDED 2026-08-27 ON SAAD'S INSTRUCTION.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `CONTACT_EDITION_YEAR` above says the year is "deliberately NOT a copyright
 * line, which `RevealFooter.tsx` bans outright", and that file's stamp comment
 * spelled the ban out: "It is four digits and nothing else. No `©`, no name, no
 * 'All rights reserved', no range, no separator glyph." It gave a reason —
 * "nothing on this surface may state a fact Saad has not stated, and a
 * copyright assertion is a claim."
 *
 * **THE REASON IS RETIRED BY THE INSTRUCTION ITSELF.** The brief asks for a
 * bottom status bar with "© 2026 MS" in it, in those characters. The rule was
 * never that copyright is wrong — it was that nobody but Saad may assert it on
 * his behalf. He asserted it. The claim is now his, which is exactly the
 * condition the rule was protecting.
 *
 * THE YEAR IS INTERPOLATED, NOT RETYPED. `CONTACT_EDITION_YEAR` stays the one
 * source; a literal "2026" here would be a second one, and the two would drift
 * the first time either was updated — which is the whole failure mode that
 * constant's own docblock was written to prevent.
 *
 * ===========================================================================
 * IT SAYS "(c) 2026" AND NOT "(c) 2026 MS", AND THE MS IS NOW THE DRAWN MARK.
 * ===========================================================================
 * IT SHIPPED AS "(c) 2026 MS" ON 2026-08-27 and lost the two letters the same
 * day. Saad, on seeing it: "the MS 2026 and (c) 2026 MS there are two things
 * keep the MS (designed one logo) keep that."
 *
 * THE DUPLICATION WAS FLAGGED WHEN IT SHIPPED and this is the resolution. The
 * plate carried the same fact twice a few pixels apart - a `MonogramMark` beside
 * a bare year, then a rule, then a typed "MS" beside the same year. The two
 * rows are ONE ROW now: the drawn mark, then this line. The mark is the "MS",
 * so setting it in type as well would be captioning a logo with its own name.
 *
 * A FULL NAME WAS NEVER THE ALTERNATIVE. "Muhammad Saad" here would be the
 * third announcement of it in one document - the navbar's mark and the page's
 * `<h1>` already carry it.
 *
 * IT IS THE LAST THING ON THE PLATE, WHICH IS THE POSITION THE STAMP COMMENT
 * ARGUED WAS RESERVED FOR A SIGNATURE. That argument turned on the wordmark
 * being the closing beat; the redesign moves the wordmark BEHIND the content as
 * an ambient watermark, so the closing slot was vacated by the same brief that
 * filled it. `RevealFooter.tsx` carries the full record.
 */
export const CONTACT_COPYRIGHT_LINE = `© ${CONTACT_EDITION_YEAR}`;

export const REVEAL_FOOTER_SENTINEL_ID = "reveal-footer-top";
