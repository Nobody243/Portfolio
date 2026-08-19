"use client";

/**
 * The theme toggle — Ticket 11. SEMANTICS ONLY; the caller owns the colour.
 *
 * ONE INSTANCE PER ROUTE, IN FLOW, AT THE TOP. There is no header, no nav and
 * no persistent chrome on this site, and this is its first global control.
 * Fixed/floating chrome was rejected on a concrete ground rather than on taste:
 * a fixed control crosses three surface contexts on `/` (`bg-hero-surface`,
 * `bg-base`, `bg-hero-surface` again), so it would need a plate of its own —
 * and giving it `bg-hero-surface` would make the pinned plate appear three
 * times, when `Contact.tsx` records that it appearing EXACTLY TWICE, at the two
 * spectacle beats, is what makes it read as a system. Independently: at 360px
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
 * transform, no transition. It is chrome, not content, and it must be operable
 * the instant it is on screen. The THEME CHANGE ITSELF also does not animate:
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
 * NO HOVER STATE. The only hover device permitted site-wide is
 * `hover:decoration-2` (underline thickness), which needs an underline this
 * control does not have. `BACK_LINK` on the detail route has no hover state
 * either. Do not invent one.
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

type ThemeToggleProps = {
  /**
   * REQUIRED, AND DELIBERATELY WITHOUT A DEFAULT. Pass `THEME_TOGGLE_ON_BASE`
   * or `THEME_TOGGLE_ON_HERO`. Omission is a type error, not a silently wrong
   * colour on a surface that does not flip.
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
       * CONTROL, the exact failure `Contact.tsx` rejected a copy-to-clipboard
       * button over. `display: none` also takes it out of the tab order and the
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
