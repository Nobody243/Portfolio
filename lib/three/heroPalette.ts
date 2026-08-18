/**
 * Hero scene colours that are NOT design tokens — and the reason why, written
 * once so review doesn't flag them as a token violation.
 *
 * The project's discipline is "no raw values, use tokens." These four are a
 * deliberate exception:
 *
 *   - They are MATERIAL AND LIGHT properties, not surface or text colours —
 *     the 3D equivalent of a texture value. Nothing in the DOM ever renders in
 *     them, and nothing ever should.
 *   - Making them CSS custom properties would imply they theme. They must not:
 *     the hero sits on a pinned dark surface with no light variant, so there is
 *     nothing for them to flip to. Worse, a `--color-*` entry would generate
 *     `bg-` / `text-` utilities for values that must never touch the DOM —
 *     exactly the leak the `--accent-hero` naming guard in globals.css exists
 *     to prevent.
 *
 * `accent-hero` is the ONE genuine design token in the scene and stays one: it
 * is read through `readAccentHero()` from CSS, never duplicated here, because
 * Ticket 10 uses the same token again.
 */

/** Wordmark material base colour — near-black, faintly cool.
 *
 *  NEVER accent-hero. A cyan `color` is a flat fill and the single most likely
 *  accent violation in the hero; cyan reaches this mesh only as light (rim),
 *  bounded emissive, and the optional glow. */
export const HERO_TEXT_COLOR = "#101317";

/** Ambient motes — the ~80% of the particle field that is NOT accent.
 *  An all-cyan field is a screensaver and spends the Tier 1 accent on the
 *  cheapest layer in the scene. */
export const HERO_MOTE_COLOR = "#8a9299";

/** Ambient light. Low and cool: it exists to keep unlit faces from crushing to
 *  pure black, not to illuminate anything. */
export const HERO_AMBIENT_COLOR = "#1a1f24";

/** Neutral fill light. The reason the wordmark is legible in a STILL — a hero
 *  that only looks like anything in motion dies in a social preview. */
export const HERO_FILL_COLOR = "#c9d1d6";
