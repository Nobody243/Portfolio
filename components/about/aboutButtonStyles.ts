/**
 * The `/about` action row's three button dressings — CLASS STRINGS ONLY.
 *
 * WHY A SEPARATE MODULE AND NOT CONSTANTS AT THE TOP OF EITHER COMPONENT. The
 * row is split across a server component (`AboutScreen`, which renders the two
 * secondary links) and a client one (`CvAction`, which renders the primary
 * control and the modal's own two buttons). A server component CANNOT import a
 * plain value out of a `"use client"` module — the bundler hands it a client
 * reference proxy, not the string, and the failure is a class name that renders
 * as `[object Object]` rather than an error. A neutral module both sides import
 * is the only shape that works, and it has the side benefit that the three
 * dressings are legible side by side.
 *
 * NOT in `aboutPageContent.ts`: that file's hard rules forbid Tailwind class
 * strings outright, for the same reason `content/types.ts` does.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SQUARE CORNERS, ON PURPOSE. `app/globals.css` ships NO radius token and says
 * so; these are the site's first filled and outlined controls and they are not
 * the place to introduce one.
 *
 * MONO UPPERCASE AT `text-caption`, matching the navbar. The bar is the site's
 * established control voice, and these are only the second and third
 * interactive surfaces on the whole site — they should sound like the first.
 *
 * `px-md py-sm` (21px / 13px) ON ALL THREE, so the row's controls share one
 * box even though only one of them is filled.
 */

/**
 * Everything the three share: the box, the voice, and the focus ring.
 *
 * THE FOCUS RING IS `outline-offset-2`, WHICH IS LOAD-BEARING ON THE FILLED
 * ONE. A teal ring drawn ON a teal fill is invisible; offsetting it by 2px puts
 * it on `bg-base`, where `accent-working` is 7.95:1 in dark and 5.34:1 in
 * light. Do not remove the offset to "tighten" the ring.
 */
const BUTTON_BASE =
  "inline-flex items-center justify-center px-md py-sm text-caption font-mono uppercase " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-working";

/**
 * The primary: View CV, and the modal's filled sibling if one is ever needed.
 *
 * `text-on-accent` IS MANDATORY HERE AND IS NOT INTERCHANGEABLE WITH `text-fg`.
 * `--color-on-accent` is #0a0a0b in dark and #fdfcfa in light — it inverts with
 * the theme in the OPPOSITE direction to `--color-fg`, because the surface
 * under it (`accent-working`: #14b8a6 dark, #0f766e light) gets DARKER in light
 * mode while the page gets lighter. `text-fg` here would be #ededed on #14b8a6
 * (1.9:1) in dark and #151515 on #0f766e (2.8:1) in light — both fail, and the
 * dark case fails in the mode nobody toggles out of while implementing.
 *
 * This is the token's FIRST consumer on the site. It shipped in Ticket 1 for
 * exactly this case and had no call site until Phase 4.
 *
 * NO HOVER COLOUR CHANGE, matching `ExternalLink`'s rule: every step away from
 * full `accent-working` costs contrast, and the light-mode value has none to
 * spare.
 */
export const ABOUT_BUTTON_PRIMARY = `${BUTTON_BASE} bg-accent-working text-on-accent`;

/**
 * The secondaries: GitHub, LinkedIn, and the modal's Download.
 *
 * BORDER AT `/40`, NOT `/70`. The `/70` floor in this project governs TEXT,
 * which carries a reading load; this is an edge, which carries none. `/40` on
 * `bg-base` is a quiet rule in both themes and keeps the outline from competing
 * with the filled control beside it.
 *
 * TEXT IS `text-fg`, NOT `text-accent-working`. These are controls, not links —
 * the teal-and-underline treatment is `ExternalLink`'s and belongs to running
 * prose. Two of the three ARE external links underneath; the dressing is what
 * differs, which is exactly the split `ExternalLink` was built for (semantics
 * there, colour and size at the call site).
 */
export const ABOUT_BUTTON_SECONDARY = `${BUTTON_BASE} border border-accent-working/40 text-fg`;

/**
 * The modal's Close — the same box, no edge.
 *
 * IT KEEPS `px-md py-sm` so its hit area matches Download's exactly; only the
 * border and the ink weight differ. `text-fg/70` is the site's standard
 * subordinate ink and sits above the /70 text floor.
 */
export const ABOUT_BUTTON_QUIET = `${BUTTON_BASE} text-fg/70`;
