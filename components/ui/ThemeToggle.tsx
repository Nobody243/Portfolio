"use client";

/**
 * The theme toggle — Ticket 11. SEMANTICS ONLY; the caller owns the colour.
 *
 * ONE INSTANCE VISIBLE PER ROUTE PER BREAKPOINT. On `/` that is the navbar's
 * instance at `md` and up and `NavMobileMenu`'s below it — two in the markup,
 * never two on screen, because each carries its own gate. Everywhere else it is
 * one instance, in flow, at the top.
 *
 * THE TOGGLE IS IN THE NAVBAR AS OF `docs/07_SITE_RESTRUCTURE.md` §1, reversing
 * the earlier "mobile-menu only" call. The gap that reversed it was concrete: a
 * desktop visitor on the homepage had no way to switch themes at all. Two
 * paragraphs of the original reasoning survive that reversal, and one does not:
 *
 * WHAT SURVIVES — a fixed control that crosses several surface contexts cannot
 * carry ITS OWN PLATE, for the reasons below. WHAT CHANGED — the navbar solves
 * that without a plate, because it already owns an escalating palette
 * (`--nav-fg` / `--nav-fg-dim` / `--nav-accent` in `globals.css`) that reads
 * correctly on every ground the bar crosses. The toggle joins that palette
 * rather than inventing a surface. See `THEME_TOGGLE_IN_NAV` below and
 * `docs/06_INTRO_AND_CHROME.md` §5.
 *
 * The original reasoning, still load-bearing for any FUTURE fixed instance
 * outside the bar:
 * Fixed/floating chrome was rejected on a concrete ground rather than on taste:
 * a fixed control crosses three surface contexts on `/` (`bg-hero-surface`,
 * `bg-base`, `bg-hero-surface` again), so it would need a plate of its own —
 * and giving it `bg-hero-surface` would make the pinned plate appear three
 * times, when the reveal footer records that it appearing EXACTLY TWICE, at the
 * two spectacle beats, is what makes it read as a system (the record was
 * written in `Contact.tsx` and moved into `RevealFooter.tsx` with it in Phase
 * 5). Independently: at 360px
 * body text runs the full width inside `px-md`, so an opaque fixed chip in the
 * top-right occludes paragraph text as the page scrolls, on every route.
 *
 * WHY `className` IS REQUIRED AND HAS NO DEFAULT, and why there is no
 * `surface?: "base" | "hero"` prop — same reasoning as `ExternalLink`, which
 * states it at length. A prop with a default does the wrong thing SILENTLY when
 * omitted: defaulting to the base constant on a hero call site renders #0f766e
 * in light mode on a panel that does not flip. Legible, passing the UI floor,
 * and wrong, and visible only after a toggle nobody performs while
 * implementing. Omitting the class is a type error instead.
 *
 * ZERO MOTION, and that is the tier-discipline answer, not an omission. No
 * entrance animation, no `Reveal` (never used in the hero anyway), no hover
 * transform, no layout or transform transition. It is chrome, not content, and
 * it must be operable the instant it is on screen. (`THEME_TOGGLE_IN_NAV` adds
 * `transition-colors duration-300` — a COLOUR transition only, and not this
 * control's: it is what makes the bar's palette cross-fade instead of jumping
 * as the bar leaves the hero, and every other item in that row carries it. It
 * moves nothing and delays no interaction.) The THEME CHANGE ITSELF does not
 * animate either:
 * a cross-fade of every colour on the page is a large motion event no tier
 * licenses, and it is a whole-document repaint over a live WebGL canvas. An
 * instant flip is also what an OS-level theme change does, so it reads as
 * correct rather than cheap.
 *
 * CONSEQUENCE, AND IT IS THE POINT: there is NO `prefers-reduced-motion` code
 * path in this file, because there is no motion to reduce. No second branch is
 * the strongest possible reduced-motion story. Do not add `useReducedMotion`
 * here.
 *
 * NO HOVER STATE IN FLOW — `THEME_TOGGLE_ON_BASE` and `THEME_TOGGLE_ON_HERO`
 * have none, and must not grow one. The only hover device permitted in body
 * content is `hover:decoration-2` (underline thickness), which needs an
 * underline this control does not have; `BACK_LINK` on the detail route has no
 * hover state either.
 *
 * THE BAR IS THE ONE EXCEPTION, and it is not this component inventing one.
 * Every interactive item in the navbar — `NAV_ITEM`, `CopyEmailButton`, the
 * LinkedIn anchor, the centre icon, the menu button — sits at `--nav-fg-dim`
 * and rises to `--nav-fg` on hover. That is the bar's established vocabulary,
 * so `THEME_TOGGLE_IN_NAV` joins it. A single control in that row WITHOUT the
 * lift would read as disabled, which is a worse error than the hover.
 *
 * NO ICON, NO SWITCH TRACK, NO BORDER, NO BACKGROUND, NO RADIUS. There is no
 * icon system on this site (two inline SVGs exist, both in `HeroHeadline`) and
 * there is no radius token. Neither gets introduced for a preference control.
 * `docs/03_FRONTEND_SPEC.md` used to specify "a simple icon-based switch"; that
 * line was corrected in this ticket's commit, because code is the source of
 * truth and the icon system it assumed does not exist.
 */

import { useEffect } from "react";

import {
  applyTheme,
  DEFAULT_THEME,
  readAppliedTheme,
  storeTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

/**
 * On `bg-base` — Tier 2/3 sections and the detail routes, which flip with the
 * theme.
 *
 * The exact shape of `BACK_LINK` in `app/(site)/projects/[slug]/page.tsx`: 12px
 * mono, teal, no underline. That file records the justification and it applies
 * verbatim here — "a standalone nav affordance rather than an inline one; the
 * accent plus isolation already reads as a link." Teal is the affordance
 * colour, and a button is an affordance.
 *
 * FULL OPACITY. #0f766e on #fdfcfa is 5.34:1 and #14b8a6 on #0a0a0b is 7.95:1.
 * The `/70` floor is not engaged here and must NOT be used to "quieten" this
 * control — at /70 the light value falls to roughly 3.2:1 and fails AA.
 *
 * `cursor-pointer` is required: Tailwind v4's preflight does not give <button>
 * a pointer cursor. `HeroHeadline`'s scroll cue carries it for the same reason.
 */
export const THEME_TOGGLE_ON_BASE =
  "text-caption font-mono text-accent-working cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-working";

/**
 * On `bg-hero-surface`, which is PINNED DARK IN BOTH THEMES.
 *
 * `hero-accent`, never `accent-working`. `accent-working` flips to #0f766e in
 * light mode and lands at ~3.6:1 on this surface against 7.95:1 in dark — one
 * affordance rendering at two different strengths for no reason anyone chose.
 * `hero-accent` is 8.00:1 here in both themes.
 *
 * BEWARE THE NAME: `hero-accent` (#14B8A6, teal, HAS utilities) and
 * `accent-hero` (#00E5FF, cyan, deliberately has NONE) are near-anagrams for
 * different colours and both directions of the swap render something
 * plausible. NOTHING IN THIS COMPONENT IS EVER CYAN.
 *
 * `outline-offset-2`, matching the `ExternalLink` atoms rather than
 * `HeroHeadline`'s scroll cue (`offset-4`, sized for a 20px icon). This is a
 * text-sized control.
 */
export const THEME_TOGGLE_ON_HERO =
  "text-caption font-mono text-hero-accent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-accent";

/**
 * IN THE NAVBAR. A THIRD constant, and neither of the two above is a
 * substitute — picking one is a real bug rather than a preference.
 *
 * The bar is FIXED AND TRAVELS OVER BOTH SURFACES: the pinned-dark hero, and
 * `bg-base` for the whole rest of the page. `THEME_TOGGLE_ON_HERO` would be
 * hero-teal over light `bg-base` past the hero; `THEME_TOGGLE_ON_BASE` would be
 * `accent-working` over the hero, which is the ~3.6:1 light-mode case its own
 * comment above rejects. Either choice is wrong on one of the two grounds for
 * the entire scroll, and neither errors.
 *
 * So it uses THE BAR'S OWN ESCALATING VARIABLES — `--nav-fg-dim`, `--nav-fg`,
 * `--nav-accent` (`app/globals.css`, `[data-nav-root]`) — which resolve to the
 * `--color-fg` family over base and to the `--color-hero-fg` family over the
 * hero, swapping by CSS cascade with no render. Measured there, and corrected
 * on 2026-08-22 alongside the same three figures in `Navbar.tsx`: 72%
 * `hero-fg` composites to 8.65:1 on the hero, 72% `fg` to 8.83:1 on dark base
 * (said "~9:1") and 7.17:1 on light (said "~8:1"). This is a text control, so
 * it is held to the text floor, not the 3:1 non-text one — 7.17:1 is the
 * binding case and it clears AAA.
 *
 * IT IS BYTE-FOR-BYTE THE BAR'S OWN TREATMENT: dim at rest, full `--nav-fg` on
 * hover, `transition-colors duration-300`, and a `--nav-accent` focus ring at
 * `outline-offset-4` — the same shape as `NAV_ITEM`, `CopyEmailButton` and the
 * LinkedIn anchor. `offset-4` rather than the other two constants' `offset-2`
 * BECAUSE IN THE BAR IT MUST MATCH ITS NEIGHBOURS, not the `ExternalLink`
 * atoms. This is the one place where matching the row beats matching the file.
 *
 * BEWARE THE NAME, carried over from `THEME_TOGGLE_ON_HERO` because the hazard
 * is the same one: `hero-accent` (#14B8A6, teal, HAS utilities) and
 * `accent-hero` (#00E5FF, cyan, deliberately has NONE) are near-anagrams for
 * different colours and both directions of the swap render something plausible.
 * NOTHING IN THIS COMPONENT IS EVER CYAN. The nav variables sidestep the trap
 * entirely by naming neither — which is part of the point of using them.
 *
 * `cursor-pointer` for the same reason as the other two: Tailwind v4's preflight
 * gives <button> no pointer cursor.
 */
export const THEME_TOGGLE_IN_NAV =
  "text-caption font-mono cursor-pointer text-[var(--nav-fg-dim)] transition-colors duration-300 hover:text-[var(--nav-fg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nav-accent)]";

type ThemeToggleProps = {
  /**
   * REQUIRED, AND DELIBERATELY WITHOUT A DEFAULT. Pass `THEME_TOGGLE_ON_BASE`,
   * `THEME_TOGGLE_ON_HERO` or `THEME_TOGGLE_IN_NAV`. Omission is a type error,
   * not a silently wrong colour on a surface that does not flip.
   */
  className: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  /**
   * CROSS-TAB SYNC. `storage` fires only in OTHER tabs of the same origin, so
   * there is no feedback loop and no guard needed against reacting to our own
   * write. Two tabs of the same portfolio in different themes is a visible
   * inconsistency and this is the whole fix.
   *
   * This is the ONLY hook in the component. It sets no state — see the note on
   * `handleClick` — so Next 16's `react-hooks/set-state-in-effect` rule is
   * never engaged.
   */
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      // `key === null` means another tab called `localStorage.clear()`. The
      // preference is gone, so fall back to the documented default rather than
      // keeping a theme nothing is storing any more.
      if (event.key === null) {
        applyTheme(DEFAULT_THEME);
        return;
      }

      if (event.key !== THEME_STORAGE_KEY) return;

      // An INVALID value arriving from elsewhere is IGNORED, not reset: a
      // corrupt write in another tab must not flip this one. Removal
      // (`newValue === null`) lands here too and is likewise ignored — a
      // deliberate `removeItem` elsewhere should not yank the theme out from
      // under a page someone is reading.
      if (event.newValue === "light" || event.newValue === "dark") {
        applyTheme(event.newValue);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /**
   * STATELESS. There is no `useState` in this component and React never mirrors
   * the theme — the class on <html> is the single source of truth, written by
   * three things that all agree: the pre-paint script, this handler, and the
   * `storage` listener above. That removes an entire bug class: the
   * server-rendered markup is unconditionally correct, there is no first-render
   * lie, and no React state can drift from the class actually applied.
   */
  const handleClick = () => {
    const next: Theme = readAppliedTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    storeTheme(next);
  };

  return (
    <button
      type="button"
      /**
       * Consumed by the no-JS net in `app/layout.tsx`, which hides this control
       * entirely when scripting is disabled. Do not rename without changing
       * that selector in the same commit.
       *
       * With JS off the init script never runs, <html> keeps `class="dark"`,
       * and the site is dark and completely correct — but this button is
       * server-rendered markup, so it would render and do nothing: a DEAD
       * CONTROL, the exact failure the old `Contact.tsx` rejected a
       * copy-to-clipboard button over. (That objection has since been ANSWERED
       * rather than overruled — see `CopyEmailButton.tsx`'s progressive-
       * enhancement `href` — and the reveal footer ships the button. The
       * dead-control hazard it names is still real, which is why this
       * `display: none` stays.) `display: none` also takes it out of the tab order and the
       * accessibility tree, so keyboard focus never lands on something inert.
       */
      data-theme-toggle
      onClick={handleClick}
      className={className}
    >
      {/*
        THE LABEL IS SWAPPED BY CSS, NOT BY JAVASCRIPT — and this is the one
        `dark:` variant this ticket licenses. `app/globals.css` says a `dark:`
        prefix signals a MISSING TOKEN; this is the sanctioned escape hatch it
        names, because VISIBLE TEXT IS NOT A TOKEN AT ALL and no token could
        express it. If a second `dark:` shows up in this ticket's diff,
        something has gone wrong.

        A JS-chosen label is the second, subtler hydration hazard: the server
        would render one string and the client might need the other.
        `suppressHydrationWarning` is per-element and does not cascade, and
        putting it on the label would make React SKIP PATCHING it — leaving a
        permanently wrong label. Rendering a placeholder until mount gives a
        layout shift and a briefly dead control. Rendering BOTH and letting the
        class choose is correct before hydration (the pre-paint script has
        already set the class), correct with JS disabled, and has zero
        conditional rendering to mismatch.

        THE VISIBLE LABEL IS THE ACTION, NOT THE STATE: it names the theme you
        will GET. Clicking "Light" gives you light.

        `display: none` removes the hidden span from the accessibility tree
        too, so the accessible name is exactly "Switch to Light theme" in dark
        and "Switch to Dark theme" in light.

        NO `aria-label`, NO `aria-pressed`, NO `role="switch"`:
          - `aria-label` — a hand-written accessible name that differs from the
            visible text is drift (`ExternalLink`'s recorded rule). The two
            `sr-only` spans PREPEND and APPEND, so the visible word stays a
            contiguous, in-order subset of the accessible name. Same mechanism
            as `NEW_TAB_NOTE`.
          - `aria-pressed` — there is no non-arbitrary answer to "pressed means
            which theme?", and it would force a constant visible label with no
            visible state indicator.
          - `role="switch"` — needs a visible track and knob, which needs a
            radius token that does not exist, and would be the site's first
            non-typographic widget.
      */}
      <span className="sr-only">Switch to </span>
      <span className="hidden dark:inline">Light</span>
      <span className="inline dark:hidden">Dark</span>
      <span className="sr-only"> theme</span>
    </button>
  );
}

export default ThemeToggle;
