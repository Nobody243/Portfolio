/**
 * `/work`'s deck copy — the fixed-arity prose the fanned deck renders.
 *
 * **ONE EXPORT LEAVES `/work`, AS OF 2026-08-25.** `DECK_BROWSE_AS_LIST_LABEL`
 * is read by `components/sections/Projects.tsx` too, which renders on Home —
 * so the `DECK_` prefix is a slight misnomer on that one constant. See its own
 * docstring for why the string is shared rather than copied, and for the
 * relocation this file would want if a third surface ever reads from it. Every
 * other constant here is still the deck's alone.
 *
 * Everything the deck draws that VARIES per project — five titles, five
 * one-liners, five stacks, five covers, five link sets — comes from
 * `content/projects.ts`, which is the collection layer and the file that gets
 * hand-edited for a year. This module exists for the same reason
 * `projectsContent.ts`, `experienceContent.ts` and `skillsContent.ts` do: a
 * control label is fixed-arity prose for one section, not a collection.
 *
 * HARD RULES, inherited verbatim from `content/types.ts` because the failure
 * mode is identical — styling leaking into a data file, where it is hardest to
 * notice:
 *   - Pure data. No "use client", no JSX, no React import, no next/* import.
 *   - NO colour hexes, NO Tailwind class strings, NO font names. Styling is the
 *     consumer's job, always. (`projectButtonStyles.ts` is where the deck's
 *     class strings live.)
 *   - Absent things are ABSENT KEYS — never "", never a placeholder.
 *
 * EVERY LABEL BELOW IS RENDERED UPPERCASE BY `BUTTON_BASE`'s `uppercase`
 * UTILITY AND IS AUTHORED IN ITS READING CASE HERE. That is deliberate and it
 * is the same rule `Skills.tsx` states: transforming in CSS keeps the DOM text
 * and the rendered text in agreement for anything reading the accessible name,
 * while the visual register stays the navbar's mono-uppercase control voice.
 */

/**
 * The panel's primary control. Always present.
 *
 * "Details", not "View project", not "Case study", not "Read more". It names
 * what is behind the control — the detail content — on a surface that is
 * already showing the project's cover, title, one-liner and stack. The other
 * two controls in the row are named for their destinations (GitHub, the live
 * site), so this one is named for its own.
 */
export const DECK_DETAILS_LABEL = "Details";

/**
 * Conditional on `links.github`. The name of the destination, exactly as the
 * destination spells it.
 */
export const DECK_GITHUB_LABEL = "GitHub";

/**
 * Conditional on `links.live`.
 *
 * "Live Site" rather than "Demo" or "Live Demo": FOLIO's deployment is a real
 * staging environment and Aero-Grid's is a real deployed app — "demo" would
 * understate both and is the register `content/projects.ts` avoids.
 */
export const DECK_LIVE_LABEL = "Live Site";

/**
 * The expanded panel's own dismissal.
 *
 * "Close", and here the word means what it means everywhere else on this site —
 * dismiss the thing that is open, stay where you are. (`/projects`' page-level
 * "Close" is the one exception, and it is recorded as such in that route's own
 * file.) It is one of three exits, alongside `Escape` and a click on the deck's
 * own background.
 */
export const DECK_CLOSE_LABEL = "Close";

/**
 * The exit to `/projects`. **TWO CALL SITES SINCE 2026-08-25, NOT ONE:**
 * `/work`'s, below the deck (`ProjectDeckSection`), and Home's, below the three
 * featured cards (`Projects`). One control, two pages, one destination — so one
 * string, imported, rather than two copies that would drift the first time the
 * wording was retuned.
 *
 * **THE CONSTANT'S `DECK_` PREFIX IS THEREFORE A SLIGHT MISNOMER**, and it is
 * left alone deliberately: renaming it, or moving it to
 * `components/sections/projectsContent.ts` (the module that already holds copy
 * for two surfaces), touches this file, `ProjectDeckSection.tsx` and
 * `Projects.tsx` at once for zero rendered change. **If a THIRD surface ever
 * reads this string, that is the point to move it** — the same rule
 * `components/about/aboutButtonStyles.ts` states for its brutal atoms.
 *
 * The label is unchanged on Home even though "View All Projects" would be
 * literally true there (three cards vs five rows). `Projects.tsx` carries that
 * reasoning at its call site; the short version is that the archive is `/work`,
 * which the navbar already offers, so a control promising the archive and
 * delivering `/projects` would be the label lying on the surface where the
 * arithmetic happens to let it get away with it.
 *
 * **"Browse as a list", NOT "View All Projects".** The spec's original label was
 * the second one and it was changed on Saad's ruling of 2026-08-25 for a reason
 * that is worth keeping next to the string: the deck holds all five projects
 * and `/projects` holds the same five, so the list adds a different
 * PRESENTATION, not a different set. A label promising more projects would be
 * untrue, and "every claim on the site must be true and specific" is
 * CLAUDE.md's rule, not a preference. This label names the affordance
 * difference, which is the thing that is actually different.
 *
 * NO COUNT. "Browse all 5 as a list" is volume-as-achievement, the one register
 * CLAUDE.md bans by name, and `projectsContent.ts` already refused a count on
 * the gallery for the same reason.
 */
export const DECK_BROWSE_AS_LIST_LABEL = "Browse as a list";

/**
 * The rail's / pager's accessible group name.
 *
 * The rail (desktop) and the numeral pager (mobile) are the same control at two
 * orientations, so they share one name. It is never rendered visibly — the
 * rail's five project titles and the pager's five numerals are the visible
 * content, and a visible "Projects" heading above them would repeat the
 * section's own `<h1>` one screen-line away.
 */
export const DECK_RAIL_LABEL = "Projects in this deck";

/**
 * Spoken after a pager numeral, which on its own is just a digit pair.
 *
 * Same device as `ProjectCard`'s `+n` overflow marker: the glyph takes its
 * meaning from its position in a row, so the glyph is `aria-hidden` and an
 * `sr-only` sibling states the fact in a form that survives being read aloud.
 * Composed as `${DECK_PAGER_ITEM_PREFIX}${title}`.
 */
export const DECK_PAGER_ITEM_PREFIX = "Show ";
