/**
 * The standalone-nav atom — one class string, four consumers.
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
 * consumer, so the trigger has fired. The four are: the detail route's two back
 * links, the 404's two links, the error page's reset button and Home link, and
 * the overlay's two close buttons.
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
 * `accent-working`, NEVER `hero-accent`. All four consumers sit on `bg-base`,
 * which flips with the theme, so the token has to flip with it — 7.95:1 in
 * dark, 5.34:1 in light. `hero-accent` is pinned for the dark plate and would
 * land at ~1.5:1 on `#FDFCFA`.
 *
 * FULL OPACITY, and the `/70` floor is not an option here. `ThemeToggle`
 * records the measurement: `accent-working` at /70 on `bg-base` is ~3.2:1 in
 * light mode and fails WCAG AA for text.
 *
 * `cursor-pointer` IS NOT IN THIS STRING, ON PURPOSE. Tailwind v4's preflight
 * gives `<button>` no pointer cursor but gives `<a href>` one for free, so a
 * `cursor-pointer` here would be inert on three of the four consumers and
 * correct on one. The two `<button>` call sites (`app/error.tsx`'s reset,
 * `ProjectOverlay`'s close) append it themselves, exactly as they did before
 * this extraction.
 */
export const STANDALONE_NAV =
  "text-caption font-mono text-accent-working focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-working";
