/**
 * Navbar copy and link selection.
 *
 * FIXED-ARITY CHROME, not a collection — the same distinction `aboutContent.ts`,
 * `contactContent.ts` and the rest draw. There are exactly two centre items and
 * exactly two right-hand affordances, and that count is a design decision, not
 * data. Adding a third nav item is a layout change (the centre cluster is
 * balanced around the icon), so it must not be possible to do it by appending
 * to an array here and hoping.
 *
 * HARD RULES, inherited verbatim from `content/types.ts` because the failure
 * mode is identical — styling leaking into a copy module, where it is hardest
 * to notice:
 *   - Pure data. No "use client", no JSX, no React import, no next/* import.
 *   - NO colour hexes, NO Tailwind class strings, NO font names. Styling is the
 *     consumer's job, always.
 *   - Absent things are ABSENT, never "" and never a placeholder.
 *
 * The one import below is the site's real contact data, and it is here rather
 * than in the components so that the navbar and the mobile menu provably show
 * the same address. A second literal copy of an email address is a typo waiting
 * for a redesign.
 */

import { contact } from "@/content/contact";
import type { ContactLink } from "@/content/types";

/**
 * The location label. Saad is in Islamabad; this is the only place on the site
 * that says so, and it says nothing more than that.
 *
 * STORED IN SENTENCE CASE and uppercased by CSS at the call site. Storing it
 * shouting would mean a screen reader hears "I S L A M A B A D" in some
 * engine/voice combinations, and it would make the string unusable anywhere the
 * caps treatment is not wanted.
 */
export const NAV_LOCATION = "Islamabad, Pakistan";

/**
 * The two centre items.
 *
 * "ABOUT" IS A KNOWN, DELIBERATE DIVERGENCE FROM THE SECTION'S OWN HEADING, and
 * it is flagged here rather than left to be discovered. `aboutContent.ts` picked
 * `Trajectory` over `About` on purpose and recorded why. A nav label is a
 * different job from a section heading — it is scanned, not read, and "About" is
 * the word a visitor's eye looks for — which is the same scannability argument
 * that put `Contact` beside `Trajectory` / `Stack` / `Work`. The navbar spec
 * asks for ABOUT by name. If that call is reversed, change it HERE and the
 * whole bar follows.
 *
 * BOTH ENTRIES ARE ROUTES. NEITHER IS A SECTION ID ANY MORE, and this header
 * has been corrected rather than left describing the old shape:
 *
 *   - `Work` is `/work`, the page holding the full archive plus Experience and
 *     Currently Learning. Verified against `app/(site)/(chrome)/work/page.tsx`.
 *   - `About` is `/about`, the single quiet screen. Verified against
 *     `app/(site)/(chrome)/about/page.tsx`.
 *
 * THE ASYMMETRY THIS PARAGRAPH USED TO DESCRIBE IS GONE, and the record is kept
 * because it explains a mechanism that is still in the code. Until Phase 4,
 * `About` was an ANCHOR into Home — `/#trajectory`, pointing at the id
 * `Trajectory.tsx` renders — because `/about` did not exist and a nav entry
 * aimed at a route that 404s is worse than a half-routed bar. That page now
 * ships, so the anchor is retired. `Trajectory.tsx` keeps `id="trajectory"`;
 * nothing in the chrome links to it.
 *
 * `Navbar.tsx` AND `NavMobileMenu.tsx` STILL CARRY THE IN-PAGE HASH PATH, and
 * it is now unreachable from this file rather than dead. `inPageTarget()`
 * intercepts a click only when the href is a hash on the page already showing,
 * so that the smooth-scroll offset keeping a heading out from under the bar
 * survives. No entry below matches it today. It is kept because the condition
 * is one line, it fails closed, and the next anchor added here would need it
 * back — deleting it would be a silent regression discovered by a broken jump.
 *
 * BOTH ARE STILL WRITTEN AS FULL HREFS, INCLUDING THE LEADING `/`. That was
 * originally what let the About anchor work from `/work`; with two routes it is
 * simply what `next/link` wants, and a relative form would resolve against
 * whatever segment the visitor is on.
 */
export const NAV_ITEMS = [
  { label: "About", href: "/about" },
  { label: "Work", href: "/work" },
] as const;

/** The centre icon's accessible name. It is a home/top affordance, so it is
 *  named for what it DOES, not for the constellation it draws.
 *
 *  IT IS ROUTE-SHAPED NOW, NOT "Back to top". The icon is a `<Link href="/">`
 *  since the bar started appearing on more than one page — on `/work` "Back to
 *  top" would have been a plain lie, since it leaves the page entirely. "Home"
 *  is true on both, including on Home itself, where it still returns you to the
 *  top.
 *
 *  IT HAS TWO CONSUMERS SINCE 2026-08-22: the bar's centre icon, where it is
 *  the `aria-label` on an icon-only control, and the mobile menu, where it is
 *  the VISIBLE label of a real text entry. Same word, because it is the same
 *  destination and a visitor who uses both should not meet two names for it. */
export const NAV_HOME_LABEL = "Home";

/**
 * Home's href. Third destination, and the only one that is not in `NAV_ITEMS`.
 *
 * IT IS NOT IN THAT ARRAY AND MUST NOT BE PUT THERE. This file's header calls
 * `NAV_ITEMS` fixed-arity chrome for a concrete reason: the bar's centre
 * cluster is ABOUT · [icon] · WORK, balanced AROUND the icon, so a third
 * entry in the array is a layout change rather than a data change. Home is
 * rendered explicitly by both consumers, which is what keeps that true.
 *
 * IT LIVES HERE RATHER THAN IN `Navbar.tsx` BECAUSE IT NOW HAS TWO CONSUMERS,
 * for exactly the reason `isActiveRoute` below gives for itself: two literal
 * `"/"`s in two files is a pair that can drift, and the failure would be a
 * menu entry that never announces itself as current while the bar's does.
 */
export const NAV_HOME_ROUTE = "/";

/** Announced, and shown, after a successful copy. */
export const NAV_COPY_CONFIRMATION = "Copied";
/** Announced to assistive tech. Fuller than the visible swap, because a
 *  screen-reader user does not have the button in front of them for context. */
export const NAV_COPY_ANNOUNCEMENT = "Email address copied to clipboard";
/**
 * The manual-copy fallback. Shown ONLY when the clipboard genuinely refused —
 * an insecure origin, a denied permission, an engine with neither API. The
 * address is selected at that point, so this instruction is actionable rather
 * than an apology.
 */
export const NAV_COPY_FALLBACK = "Press Ctrl/⌘+C";

/**
 * Is this href the page the visitor is currently on?
 *
 * IT LIVES IN THE COPY MODULE BECAUSE IT HAS TWO CONSUMERS AND THEY MUST NOT
 * DISAGREE. `Navbar.tsx` uses it to place `aria-current="page"` — which is also
 * what the sliding indicator queries the DOM for — and `NavMobileMenu.tsx` uses
 * it to mark the same page below `md`. A second local copy of this predicate
 * would be a bar and a menu that can drift into naming different current pages,
 * which is a worse bug than either having none.
 *
 * It breaks none of this file's three hard rules: it is pure string comparison,
 * imports nothing, and touches no React and no styling. The header calls this
 * file "copy and link selection", and selecting which link is current is that.
 *
 * EXACT EQUALITY, NOT A PREFIX MATCH. The three destinations are `/about`, `/`
 * and `/work`, none of which is a parent of another, so a prefix rule would buy
 * nothing today and would quietly make `/` match everything.
 *
 * A HASH HREF IS NEVER ACTIVE, and that guard is not hypothetical. `About` was
 * `/#trajectory` until Phase 4 and the machinery for the next anchor that
 * appears here is still in place, documented above. `"/#trajectory"` is not
 * `"/"`, so it would not match — but the centre icon's `/` WOULD still match on
 * Home at the same time, and two links carrying `aria-current="page"` is a
 * wrong announcement plus an indicator that measures whichever one
 * `querySelector` reaches first. Stating "a jump within a page is not a route"
 * here closes that off before it happens.
 */
export const isActiveRoute = (href: string, pathname: string): boolean =>
  !href.includes("#") && href === pathname;

export const NAV_MENU_OPEN_LABEL = "Open menu";
export const NAV_MENU_CLOSE_LABEL = "Close menu";

/**
 * Look-ups into the real contact data, by label.
 *
 * BY LABEL AND NOT BY INDEX, because `content/contact.ts` states that array
 * order is display order for the reveal footer's link row and is free to
 * change; an index would silently start rendering GitHub as the email
 * address. Not by
 * `kind` either — GitHub and LinkedIn are both `"web"`, so that discriminant
 * cannot tell them apart.
 *
 * BOTH MAY BE `undefined`, and every consumer must handle it by rendering
 * NOTHING. That is the same rule the reveal footer follows: an absent link is
 * an absent entry, never `href: "#"`, never a disabled-looking item. If Saad
 * ever removes the LinkedIn entry, the navbar loses an icon and stays correct.
 */
const byLabel = (label: string): ContactLink | undefined =>
  contact.find((link) => link.label === label);

export const NAV_EMAIL = byLabel("Email");
export const NAV_LINKEDIN = byLabel("LinkedIn");
