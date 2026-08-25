/**
 * Project detail page copy — Ticket 7.
 *
 * NINE STRINGS, ALL OF THEM FIXED UI LABELS. (This line read SEVEN until
 * 2026-08-25, when `BREADCRUMB_ROOT_LABEL` and `BREADCRUMB_SEPARATOR` were
 * added for the standalone page's breadcrumb — see the provenance note on the
 * first of them. Update the count when you add one; a stale arity in a header
 * is the cheapest kind of lie for a reader to believe.) Every other word a
 * detail page
 * renders — the title, the description, the credit, the stack entries, the
 * alt texts, the URLs — comes from `content/projects.ts`, which is the
 * collection layer and the file that gets hand-edited for a year. This module
 * exists for the same reason `aboutContent.ts`, `skillsContent.ts` and
 * `projectsContent.ts` do: fixed-arity chrome for one surface is not a
 * collection.
 *
 * The first six were approved by Saad verbatim (ticket-7-plan.md §7, gates G1,
 * G5 and G8; F-D2 in ticket-7-design.md §9 for `GITHUB_LINK_LABEL`). The
 * seventh, `CLOSE_LABEL`, arrived with Ticket 6b and is specified by
 * ticket-6b-plan.md §4 step 12 rather than approved verbatim — that difference
 * is stated rather than smoothed over, and it is at its own constant below. The
 * eighth and ninth, the two breadcrumb strings, have that same provenance one
 * step removed: they are the literal wording of
 * `.claude/specs/projects-architecture-spec.md` §4, which Saad ruled on but did
 * not hand over as approved copy. Do
 * not paraphrase, pluralise, abbreviate or reword any of them to fit a layout.
 * If the layout needs different text, that is a question back to Saad, not an
 * edit here.
 *
 * AND NO PER-PROJECT COPY OF ANY KIND. `content/projects.ts` is authoritative
 * and this module must never shadow it. A "FOLIO is a staging deployment"
 * note, a per-project link label, a per-project caption — none of those belong
 * here; they are fields on the record or they do not exist.
 *
 * HARD RULES, inherited verbatim from content/types.ts because the failure
 * mode is identical — styling leaking into a data file, where it is hardest to
 * notice:
 *   - Pure data. No "use client", no JSX, no React import, no next/* import.
 *   - NO colour hexes, NO Tailwind class strings, NO font names. Styling is
 *     the consumer's job, always.
 *   - Absent things are ABSENT KEYS — never "", never a placeholder.
 */

/**
 * The back affordance, top and bottom of the page.
 *
 * NO ARROW GLYPH. `ProjectCard` already rejected arrow affordances as generic,
 * and the destination name carries the meaning without one. The site ships no
 * icon set, and a bare "←" read aloud is noise.
 *
 * CHANGING THIS IS NOT A LOCAL EDIT. Two files render this label and both must
 * point at the archive: `app/(site)/projects/[slug]/page.tsx` (`BACK_HREF`)
 * and `app/not-found.tsx` (`WORK_HREF`). Both are `/work`.
 *
 * THIS PARAGRAPH USED TO READ: *"Its destination is `/#work`, an id derived
 * from `PROJECTS_HEADING` in `projectsContent.ts` — that file records that
 * renaming 'Work' is a three-file commit, and this page is the third file."*
 * True of the one-page site, wrong since Phase 3: `/#work` is now Home's
 * FEATURED THREE, so an "All work" link pointing there omits CCN and SNA. The
 * destination is a route rather than a heading-derived id, so renaming the
 * heading no longer touches this label's href at all. Corrected 2026-08-22,
 * together with `not-found.tsx`, which was still carrying `/#work`.
 */
export const BACK_LINK_LABEL = "All work";

/**
 * The overlay's close affordance — Ticket 6b, top and bottom of the dialog.
 *
 * It occupies the SAME SLOT as `BACK_LINK_LABEL`: `ProjectDetailFrame` renders
 * one caller-supplied affordance above the cover and one below it, and the
 * route passes the back link where the overlay passes a close button. That is
 * why the two labels live side by side here.
 *
 * `Close`, NOT `Back`, `← Back`, `Back to work`, `All work` or `Done`. An
 * overlay closes; it does not navigate. Reusing `All work` would promise the
 * gallery and deliver a dismissal, and on the real route — reached by refresh
 * or a shared link — the very same slot really does say `All work`, so the two
 * words have to stay distinguishable. `docs/04_FEATURE_TICKETS.md` already
 * words the contract that way: the route "renders a back link above it, which
 * 6b swaps for a close affordance".
 *
 * NO GLYPH. No `×`, no `✕`, no icon. The site ships no icon set, `×` read
 * aloud is "times", and `BACK_LINK_LABEL` above already records rejecting an
 * arrow on the same atom.
 */
export const CLOSE_LABEL = "Close";

/**
 * The technology-list label.
 *
 * `Stack` is genuinely unavailable: it is `SKILLS_HEADING`, and two different
 * things sharing a name two clicks apart is the `Foundations` collision
 * Ticket 5 already rejected once.
 */
export const STACK_LABEL = "Built with";

/** The external-links label. The whole block is absent for CCN and SNA, so it
 *  never labels an empty region. */
export const LINKS_LABEL = "Links";

/**
 * The screenshots label.
 *
 * IT IS A BLOCK NAME, NOT A COUNT. FOLIO has exactly one screenshot and still
 * reads `Screenshots`, the same way `Built with` does not become `Built with
 * 11`. Do NOT "fix" this with a conditional plural: that puts a piece of copy
 * inside a ternary in the component layer, which is precisely what this
 * module exists to prevent. Recorded as finding F-D3 in ticket-7-design.md so
 * it is not rediscovered as an oversight.
 */
export const SCREENSHOTS_LABEL = "Screenshots";

/**
 * The repository link's visible text.
 *
 * `GitHub` rather than `Source`, `Repository` or `Code`: all three repos are
 * on GitHub, so the platform name is the more useful signal — a reader knows
 * immediately what they will get and whether they already have an account
 * there. It is also the exact casing `content/projects.ts` uses in its URLs.
 *
 * REJECTION CRITERION, stated so it is not solved the wrong way later: if a
 * repo is ever hosted somewhere else, this stops being a fixed label and
 * becomes a field on `ProjectLinks` in `content/types.ts`. Do NOT solve that
 * case with a second hardcoded string or a hostname regex.
 */
export const GITHUB_LINK_LABEL = "GitHub";

/**
 * The deployment link's visible text.
 *
 * FOLIO's `live` is a staging deployment (`content/projects.ts` says so). That
 * deployment IS deployed and reachable, which is what "live" claims, so the
 * label is honest. Adding a staging/production field to `content/types.ts` to
 * encode one project's hosting detail is scope creep for no reader benefit —
 * and if that URL ever 404s the honest fix is deleting the key, not
 * relabelling it.
 */
export const LIVE_LINK_LABEL = "Live site";

/**
 * The breadcrumb's root segment — the standalone `/projects/<slug>` page only.
 *
 * SPECIFIED, NOT APPROVED VERBATIM, and that difference is stated rather than
 * smoothed over — the same provenance note `CLOSE_LABEL` carries.
 * `.claude/specs/projects-architecture-spec.md` §4 words the whole control as
 * `"Projects / [project name]"`, so this string and `BREADCRUMB_SEPARATOR`
 * below are the spec's own two fixed pieces of it. The third piece is the
 * project's `title`, which comes from `content/projects.ts` like every other
 * per-project word on the page.
 *
 * IT NAMES A ROUTE, NOT A SECTION. The link goes to `/projects` — the index —
 * and never to `/work`. That separation is deliberate and was ruled on: the
 * page's Close affordance is `BACK_LINK_LABEL` → `/work`, and the breadcrumb is
 * `/projects`, so the two exits do not duplicate each other. Pointing this at
 * `/work` would collapse them into the same destination twice on one page.
 *
 * SEEN BY ONE VISITOR ONLY. Every in-app click on a project opens the overlay
 * at `app/(site)/@modal/(.)projects/[slug]/`, so this label renders only on a
 * hard load or a shared link. It is written for someone who arrived cold and
 * has no history to go back to, which is why it states a place rather than an
 * action.
 */
export const BREADCRUMB_ROOT_LABEL = "Projects";

/**
 * The breadcrumb's separator.
 *
 * A LITERAL SLASH, matching the spec's wording character for character. Not
 * `›`, not `→`, not `»`, not `|`: the site ships no icon set and
 * `BACK_LINK_LABEL` already records rejecting glyph affordances on this
 * surface. A slash also reads as a path, which is what a breadcrumb is.
 *
 * IT IS RENDERED `aria-hidden`. A screen reader announcing "slash" between two
 * names is noise; the `<nav aria-label="Breadcrumb">` landmark and
 * `aria-current="page"` carry the structure instead. That is a decision of the
 * consumer, `ProjectBreadcrumb.tsx`, and is noted here so nobody wraps this
 * string in a label to "fix" the silence.
 */
export const BREADCRUMB_SEPARATOR = "/";
