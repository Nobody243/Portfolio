/**
 * Every string the hero renders, in one place — the single source for both the
 * DOM and the 3D geometry.
 *
 * This is content, not configuration. Do not edit it to fit a layout.
 */

/**
 * The 3D wordmark. All caps, one word, one line.
 *
 * CONSTRAINED BY THE FONT ASSET: the typeface JSON is subset to A-Z plus
 * space. Any character outside that range throws at runtime when TextGeometry
 * looks up the glyph — it does not fail the build. See public/fonts/README.md
 * to regenerate.
 */
export const HERO_WORDMARK = "SAAD";

/**
 * The <h1>. Deliberately the FULL name while the geometry shows the short form.
 *
 * A wordmark rendering a logotype while the heading carries the full name is
 * normal typographic practice, not a content mismatch: a screen-reader or
 * search user gets strictly better information from "Muhammad Saad", and
 * "SAAD" is contained within it. This is also the string that becomes VISIBLE
 * in the WebGL fallback, where there is no logotype to stand in for it.
 */
export const HERO_NAME = "Muhammad Saad";

/**
 * The identity statement, split into its two stagger units.
 *
 * THE SPLIT IS SEMANTIC, NOT VISUAL — do not re-balance it for line length:
 *   - unit 1 is the stance, unit 2 is the destination;
 *   - breaking after "building" would strand "toward" and leave "Engineer
 *     building" reading as an unfinished thought;
 *   - "cybersecurity & cloud." is the entire positioning of the site, and on
 *     its own line it lands with weight instead of trailing off the end of a
 *     sentence.
 *
 * Rendered as two stacking block elements, never a <br>: a <br> cannot reflow
 * on a narrow phone, cannot carry per-unit stagger timing, and cannot be
 * wrapped in the per-unit overflow-hidden box the masked reveal requires.
 *
 * The unit count stays 2 even if a unit reflows internally at 360px.
 */
export const HERO_TAGLINE_UNITS = [
  "Engineer building toward",
  "cybersecurity & cloud.",
] as const;

/** Joined form, for anywhere the statement is needed as one string. */
export const HERO_TAGLINE = HERO_TAGLINE_UNITS.join(" ");
