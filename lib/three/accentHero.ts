/**
 * Tier 1 accent, read from CSS instead of duplicated in JS.
 *
 * `--accent-hero` is declared exactly once, in `app/globals.css`, and it is
 * deliberately registered OUTSIDE Tailwind's `--color-*` namespace so no
 * `bg-accent-hero` / `text-accent-hero` utility exists (see the TIER 1 ACCENT
 * block in that file). Three.js takes colors as values, not classes, so the 3D
 * layer has to read the variable — this function is the one place that does it,
 * which keeps the hex a single source of truth rather than a copy that silently
 * drifts.
 *
 * CLIENT ONLY. Safe inside R3F scene children because `<Canvas>` renders its
 * children through the three reconciler in a layout effect — they never execute
 * during prerender, so `document` is always defined by the time this runs. Do
 * NOT call it from a component that renders on the server.
 *
 * Returns a CSS hex string (e.g. "#00e5ff"), which `THREE.Color` accepts
 * directly. Trimmed because `getPropertyValue` preserves the leading space
 * from the declaration.
 */
export function readAccentHero(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-hero")
    .trim();
}
