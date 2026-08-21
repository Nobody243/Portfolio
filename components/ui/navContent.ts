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
 * The hrefs are section ids, verified against the sections that own them:
 * `About.tsx` renders `id="trajectory"`, `Projects.tsx` renders `id="work"`.
 */
export const NAV_ITEMS = [
  { label: "About", targetId: "trajectory" },
  { label: "Work", targetId: "work" },
] as const;

/** The centre icon's accessible name. It is a home/top affordance, so it is
 *  named for what it DOES, not for the constellation it draws. */
export const NAV_HOME_LABEL = "Back to top";

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

export const NAV_MENU_OPEN_LABEL = "Open menu";
export const NAV_MENU_CLOSE_LABEL = "Close menu";

/**
 * Look-ups into the real contact data, by label.
 *
 * BY LABEL AND NOT BY INDEX, because `content/contact.ts` states that array
 * order is display order for the Contact section and is free to change; an
 * index would silently start rendering GitHub as the email address. Not by
 * `kind` either — GitHub and LinkedIn are both `"web"`, so that discriminant
 * cannot tell them apart.
 *
 * BOTH MAY BE `undefined`, and every consumer must handle it by rendering
 * NOTHING. That is the same rule the Contact section follows: an absent link is
 * an absent entry, never `href: "#"`, never a disabled-looking item. If Saad
 * ever removes the LinkedIn entry, the navbar loses an icon and stays correct.
 */
const byLabel = (label: string): ContactLink | undefined =>
  contact.find((link) => link.label === label);

export const NAV_EMAIL = byLabel("Email");
export const NAV_LINKEDIN = byLabel("LinkedIn");
