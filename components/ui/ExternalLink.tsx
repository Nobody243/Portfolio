/**
 * The shared external link — SEMANTICS ONLY. The caller owns colour and size.
 *
 * Extracted in Ticket 10 from `ProjectDetail.tsx`, `Experience.tsx` and
 * `CurrentlyLearning.tsx`, which had each written the same three-part
 * correctness invariant by hand: `target="_blank"`, `rel="noopener noreferrer"`
 * and the `sr-only` new-tab note. `NEW_TAB_NOTE` itself was triplicated
 * verbatim across the three content modules with nothing keeping the copies in
 * sync. A missing `rel` is a behaviour/security defect and a missing new-tab
 * note is an accessibility defect, and NEITHER is caught by the compiler, by
 * Lighthouse or by axe — only by a human who happens to look. That is what
 * belongs in a component.
 *
 * WHAT DELIBERATELY STAYED AT THE CALL SITE: the accent and the size class.
 * Both legitimately differ, and they differ on two independent axes.
 *
 *   Surface — `accent-working` on `bg-base` (which flips with the theme),
 *   `hero-accent` on `bg-hero-surface` (which is pinned dark in both themes).
 *   `app/globals.css`'s HERO TOKENS block states this as a usage rule.
 *
 *   Size — `Experience` and `ProjectDetail` prepend `text-body`;
 *   `CurrentlyLearning` deliberately omits it so the link inherits `text-h4`
 *   from the `<h3>` it sits inside. Hardcoding a size here would silently
 *   shrink that title to 16px.
 *
 * WHY `className` IS REQUIRED AND HAS NO DEFAULT, and why there is no
 * `surface?: "base" | "hero"` prop. A prop with a default does the wrong thing
 * silently when it is omitted: `surface="base"` defaulted onto a hero-surface
 * call site renders `#0f766e` in light mode on a panel that does not flip —
 * legible, passing the UI floor, and wrong, and visible only after a theme
 * toggle nobody performs while implementing. Omitting the class is a type
 * error instead. The two constants below are exported from this same file so
 * the divergence is readable in one place rather than hidden behind a default.
 *
 * NO `"use client"`, AND THAT IS LOAD-BEARING — but the claim it used to make
 * is now narrower, and the narrowing is the interesting part.
 *
 * IT READ "All FIVE consumers are server components and `Reveal` is the site's
 * only client boundary." **THERE ARE SIX SINCE 2026-08-25 AND THE SIXTH IS A
 * CLIENT COMPONENT**: `components/sections/ProjectDeck.tsx` renders the deck's
 * GitHub and Live Site controls through this component, and the deck is
 * `"use client"` because it owns pointer, keyboard and drag state.
 *
 * **THE ABSENCE OF `"use client"` HERE IS STILL LOAD-BEARING, AND FOR EXACTLY
 * THE SAME REASON.** A module without the directive is usable from BOTH sides:
 * the five server consumers keep it on the server, and the deck pulls it into
 * the client bundle it was already shipping. Adding the directive would flip
 * that — it would drag `AboutScreen`, `CurrentlyLearning`, `Experience`,
 * `ProjectDetail` and `RevealFooter` across the boundary, which is precisely
 * the regression the paragraph was written to prevent. So: if `motion/react` or
 * a hook ever appears in this file, five of the six consumers quietly become
 * client components. The rule survives; only "all consumers are server
 * components" did not.
 *
 * THE COUNT SAID FOUR UNTIL 2026-08-25 AND WAS WRONG BEFORE `/projects`
 * EXISTED — that part was not route drift. The five were `AboutScreen`,
 * `CurrentlyLearning`, `Experience`, `ProjectDetail` and `RevealFooter`; every
 * one was checked against the repo's `"use client"` list and none carries the
 * directive, so THE SUBSTANCE OF THAT PARAGRAPH HELD THE WHOLE TIME — only the
 * number was false. `ProjectDeck` is the sixth, is a real client component, and
 * is the first consumer that makes the "all server" clause false rather than
 * merely miscounted. Recorded rather than silently corrected because a header
 * whose adjacent clause is load-bearing is exactly where a wrong number does
 * the most damage: it invites the reader to distrust the part that matters.
 * `components/ui/link-preview.tsx` quotes this sentence and was corrected in
 * the same change.
 *
 * NOT for internal navigation. `next/link` owns in-app routes; this is for
 * links that leave the site, which is the only case that needs `target`/`rel`
 * at all. A `mailto:` does NOT open a new tab, so it must NOT come through
 * here — see `RevealFooter.tsx` (the old `Contact.tsx`), which renders a plain
 * `<a>` with the same class constant so the two look identical and only the
 * semantics differ.
 */

import type { ReactNode } from "react";

/**
 * Appended to the link's accessible name, never rendered visibly.
 *
 * A new tab that is not announced is sprung on a screen-reader user rather than
 * offered. Rendered inside an `sr-only` span with a LEADING SPACE, so the
 * accessible name reads "GitHub (opens in a new tab)", not
 * "GitHub(opens in a new tab)".
 *
 * NOT an `aria-label` on the anchor: a hand-written accessible name that
 * differs from the visible text is drift. This appends to the visible text
 * rather than replacing it.
 *
 * ONE DEFINITION, SITE-WIDE. It previously lived in three content modules at
 * once. If it ever needs to change, it changes here and nowhere else.
 */
export const NEW_TAB_NOTE = "(opens in a new tab)";

/**
 * On `bg-base` (Tier 2/3 sections, which flip with the theme).
 *
 * NO SIZE CLASS — the caller appends `text-body` or lets the link inherit from
 * its heading. This string is the exact INTERSECTION of the three values that
 * shipped before this refactor, so computed styles are unchanged.
 *
 * NO HOVER STATE, and that is a contrast constraint rather than laziness: any
 * hover step that dims the teal needs a value below full `accent-working`, and
 * `accent-working` in light mode (#0f766e) is 5.34:1 on `bg-base` — at /70 it
 * falls to roughly 3.2:1 and fails AA outright. The only permitted hover device
 * anywhere on this site is `hover:decoration-2` (underline thickness): never a
 * colour change, never a background, never a transform.
 *
 * The underline is not decoration — colour alone must not be a link's only
 * signal.
 */
export const EXTERNAL_LINK_ON_BASE =
  "text-accent-working underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-working";

/**
 * On `bg-hero-surface`, which is PINNED DARK IN BOTH THEMES.
 *
 * `hero-accent`, never `accent-working` — `app/globals.css` states this as a
 * usage rule for this surface. `accent-working` flips to #0f766e in light mode,
 * which lands at ~3.6:1 here against 7.95:1 in dark: one affordance rendering
 * at two different strengths for no reason anyone chose. `hero-accent` is
 * 8.00:1 on this surface in both themes.
 *
 * BEWARE THE NAME: `hero-accent` (#14B8A6, teal, HAS Tailwind utilities) and
 * `accent-hero` (#00E5FF, cyan, deliberately has NONE) are near-anagrams for
 * different colours, and both directions of the swap render something
 * plausible. Links and focus rings are teal. Nothing here is ever cyan.
 *
 * NO HOVER STATE, for the same reason as above and it holds on dark too:
 * `hero-accent` at /70 over #07090C computes to 4.34:1, which fails AA.
 */
export const EXTERNAL_LINK_ON_HERO =
  "text-hero-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-accent";

type ExternalLinkProps = {
  /** Absolute URL. This component always opens a new tab, so an in-app route
   *  does not belong here. */
  href: string;
  /**
   * REQUIRED, AND DELIBERATELY WITHOUT A DEFAULT. Pass `EXTERNAL_LINK_ON_BASE`
   * or `EXTERNAL_LINK_ON_HERO`, appending a size class where the call site
   * needs one. Omission is a type error, not a silently wrong colour.
   */
  className: string;
  /** The VISIBLE link text. The new-tab note is appended to it, never
   *  substituted for it. */
  children: ReactNode;
};

export function ExternalLink({ href, className, children }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <span className="sr-only">{` ${NEW_TAB_NOTE}`}</span>
    </a>
  );
}

export default ExternalLink;
