/**
 * Work section copy — Ticket 6.
 *
 * ONE STRING. Every other word the gallery renders — five titles, five
 * one-liners, five stacks, five dates and five alt texts — comes from
 * `content/projects.ts`, which is the collection layer and the file that gets
 * hand-edited for a year. This module exists for the same reason
 * `aboutContent.ts` and `skillsContent.ts` do: a section heading is
 * fixed-arity prose for one section, not a collection.
 *
 * "Work" is Saad's, approved verbatim (ticket-6-plan.md §3, G2). Do not
 * paraphrase it, do not expand it to "Selected Work" ("selected" implies a
 * larger body being filtered from, and all five projects ship — untrue by the
 * site's own standard), and do not reword it to fit a layout. If the layout
 * needs different text, that is a question back to Saad, not an edit here.
 *
 * CHANGING THIS STRING IS NOT A LOCAL EDIT. The section's `id` is derived from
 * it (`#work`), so it is also a linkable anchor and the destination of Ticket
 * 7's "back to work" affordance. `Projects` is the recorded fallback if `Work`
 * reads as too thin once the cards are on screen — that is a one-string change
 * here PLUS the id in `Projects.tsx` PLUS Ticket 7's back link, in one commit.
 *
 * HARD RULES, inherited verbatim from content/types.ts because the failure mode
 * is identical — styling leaking into a data file, where it is hardest to
 * notice:
 *   - Pure data. No "use client", no JSX, no React import, no next/* import.
 *   - NO colour hexes, NO Tailwind class strings, NO font names. Styling is the
 *     consumer's job, always.
 *   - Absent things are ABSENT KEYS — never "", never a placeholder.
 *
 * NO INTRO SENTENCE, NO SUBHEADING, NO "CLICK A CARD" INSTRUCTION, AND NO
 * PROJECT COUNT. The first three are ruled out by ticket-6-plan.md §1.2 — the
 * card affordance must be visual, and a written instruction is an admission
 * that it is not. The count is ruled out separately: Skills' `00` is honest
 * because it makes an empty group visible, whereas "05 selected works" on a
 * full gallery is volume-as-achievement, the one register CLAUDE.md bans by
 * name. Nothing sits above the grid but the heading.
 *
 * AND NO PER-PROJECT COPY OF ANY KIND. `content/projects.ts` is authoritative
 * and this module must never shadow it.
 */

export const PROJECTS_HEADING = "Work";
