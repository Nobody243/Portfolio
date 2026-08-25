/**
 * The standalone-nav atom — one class string, seven consumers.
 *
 * THE COUNT IS LOAD-BEARING AND MUST BE MAINTAINED. The whole argument for this
 * file's existence is a threshold that was crossed (see below), so a stale
 * number here is not a cosmetic error — it is the justification going quietly
 * out of date. It read FOUR until 2026-08-25, when the `/projects` index and
 * the detail pages' breadcrumb both landed and neither updated it — and SIX
 * until later the same day, when `/work`'s fanned deck added its panel's
 * `Close`.
 *
 * WHAT IT IS: a 12px mono word in `accent-working`, on its own, acting as a
 * navigation exit or a page-level action. No underline, no arrow glyph, no
 * pill, no border, no background. It is deliberately NOT the inline-link
 * treatment — `components/ui/ExternalLink.tsx` owns that one, and it underlines
 * because an inline link inside a paragraph cannot rely on colour alone. A
 * standalone affordance sitting in its own row already reads as a link from its
 * isolation, which is why `app/(site)/projects/[slug]/page.tsx` recorded
 * rejecting the underline here.
 *
 * WHY IT EXISTS NOW AND NOT BEFORE. `app/not-found.tsx` shipped a byte-identical
 * local copy and stated the trigger verbatim: "Extract it the moment a fourth
 * consumer appears — that is the point at which the duplication starts costing
 * more than the refactor." Ticket 6b's overlay close button is the fourth
 * consumer, so the trigger has fired. The four were: the detail route's two
 * back links, the 404's two links, the error page's reset button and Home link,
 * and the overlay's two close buttons.
 *
 * THE SEVEN, AS OF 2026-08-25 — three of them added by the projects-
 * architecture work, and the detail route's own count changed underneath the
 * sentence above. (This heading read SIX and enumerated seven for the length
 * of one slice: the deck's `Close` was appended to the list and to the count
 * at the top of the file, but not to this line or to the contrast note below.
 * Three places, one number — which is exactly why the header opens by saying
 * the count is load-bearing.)
 *
 *   1. `app/(site)/projects/[slug]/page.tsx` — `All work` → `/work`. ONE link
 *      now, not two: since 2026-08-25 the affordance renders only at the foot,
 *      because the breadcrumb took the top row. That file's own header records
 *      it.
 *   2. `app/not-found.tsx` — `All work` and `Home`.
 *   3. `app/error.tsx` — the reset `<button>` and the `Home` link.
 *   4. `components/sections/OverlayCloseButton.tsx` — the overlay's close,
 *      rendered top and bottom from this one module.
 *   5. `app/(site)/(chrome)/projects/page.tsx` — the `/projects` index's fixed
 *      `Close` → `/work`. TWO instances since the strip rows landed on
 *      2026-08-25: one above the heading and one below the last row, which is
 *      `ProjectDetailFrame`'s top-and-bottom pattern on a second page. Both
 *      are anchors, so neither appends `cursor-pointer`.
 *   6. `components/sections/ProjectBreadcrumb.tsx` — the `Projects` segment,
 *      → `/projects`. The trailing segment is deliberately plain text and is
 *      NOT a consumer.
 *   7. `components/sections/ProjectDeck.tsx` — the expanded panel's `Close`,
 *      one of the deck's three exits alongside `Escape` and a click on the
 *      deck's background. A `<button>`, and the FIRST consumer inside a
 *      `"use client"` module — which costs nothing, because this file is pure
 *      strings and has no directive of its own to drag anywhere. **It is also
 *      the first consumer NOT on `bg-base`: the panel is `bg-elevated`. See the
 *      contrast note below, which had to gain a second row because of it.**
 *
 * THE THREE PRE-EXISTING COPIES WERE BYTE-IDENTICAL — verified by string
 * comparison before any of them was deleted, not assumed from reading them.
 * `BACK_LINK` in the detail route, `LINK` in `app/not-found.tsx` and `ACTION`
 * in `app/error.tsx` were the same 134 characters in the same order.
 *
 * WHY THIS FILE AND NOT `components/sections/projectDetailContent.ts`, which
 * ticket-6b-plan.md §4 step 2 suggested: that module's header states as a HARD
 * RULE, inherited from `content/types.ts`, "NO colour hexes, NO Tailwind class
 * strings, NO font names. Styling is the consumer's job, always." Putting a
 * Tailwind class string there would have required deleting that rule, which is
 * a bigger change than adding a file. The COPY (`BACK_LINK_LABEL`,
 * `CLOSE_LABEL`) still lives there, where it belongs; only the styling moved
 * here. This file is the same shape as `THEME_TOGGLE_ON_BASE` and
 * `EXTERNAL_LINK_ON_BASE` — a class-string constant living in `components/ui/`.
 *
 * PURE STRINGS, NO "use client", NO IMPORTS, AND IT MUST STAY THAT WAY.
 * `app/error.tsx` is a Client Component whose header says any shared label it
 * imports must come "only from a pure-string module". This is that module. Add
 * a React import or a `motion` import here and that file's one-dependency
 * guarantee breaks.
 *
 * `accent-working`, NEVER `hero-accent`. Every consumer sits on a surface that
 * FLIPS with the theme, so the token has to flip with it. `hero-accent` is
 * pinned for the dark plate and would land at ~1.5:1 on `#FDFCFA`.
 *
 * **THE SURFACE IS NOT THE SAME EVERYWHERE, AND THIS BLOCK SAID IT WAS.** It
 * read "All seven consumers sit on `bg-base` … 7.95:1 in dark, 5.34:1 in
 * light" until 2026-08-25. Six of them do. **Consumer 7 — the deck panel's
 * `Close` — sits on `bg-elevated`**, which is the panel's own surface, and
 * neither quoted figure applies to it. Computed from `app/globals.css`'s hexes
 * rather than eyeballed:
 *
 *                      dark (#14b8a6)          light (#0f766e)
 *   on `bg-base`       7.95:1 on #0a0a0b       5.34:1 on #fdfcfa
 *   on `bg-elevated`   7.52:1 on #121214       4.98:1 on #f4f4f4
 *
 * **NO ACCESSIBILITY FAILURE, AND THE POINT IS THE PRECISION RATHER THAN THE
 * OUTCOME.** 4.98:1 is the binding case and it clears AA for normal text (4.5:1)
 * with room. `globals.css` already states the 7.5:1 dark figure for
 * `accent-working` on `elevated`; the light one was never written down anywhere,
 * which is how a header could quote a number for a surface it had not checked.
 * **If an eighth consumer lands on a third surface, compute it — do not inherit
 * this table.**
 *
 * FULL OPACITY, and the `/70` floor is not an option here. `ThemeToggle`
 * records the measurement: `accent-working` at /70 on `bg-base` is ~3.2:1 in
 * light mode and fails WCAG AA for text. **That measurement is against
 * `bg-base`, so it does not cover consumer 7 either — and on `bg-elevated` it is
 * WORSE, 2.91:1 in light, which is below even the 3:1 non-text floor. The
 * conclusion holds a fortiori on every surface this atom has reached; the
 * arithmetic behind it does not travel and should be re-run rather than
 * quoted.**
 *
 * `cursor-pointer` IS NOT IN THIS STRING, ON PURPOSE. Tailwind v4's preflight
 * gives `<button>` no pointer cursor but gives `<a href>` one for free, so a
 * `cursor-pointer` here would be redundant on every anchor and is needed only
 * where the consumer renders a `<button>`. There are exactly THREE such call
 * sites — `app/error.tsx`'s reset, `OverlayCloseButton`'s close and the deck
 * panel's `Close` — and all three append it themselves, exactly as the first
 * two did before this extraction. (It said TWO until 2026-08-25; the deck's
 * `Close` is the third, and like the other two it DISMISSES something rather
 * than navigating, which is why the `<button>`/anchor split keeps landing where
 * it does.) The remaining four consumers are all anchors.
 */
export const STANDALONE_NAV =
  "text-caption font-mono text-accent-working focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-working";
