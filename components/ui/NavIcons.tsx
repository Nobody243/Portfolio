/**
 * The navbar's three glyphs. Presentational, `currentColor`, no state, no
 * "use client" — they are plain functions returning SVG and are safe in either
 * environment.
 *
 * ALL THREE ARE `aria-hidden`. Every one of them sits inside a control that
 * carries its own accessible name (`NAV_HOME_LABEL`, the LinkedIn link's label,
 * the menu button's). A `<title>` here as well would double-announce.
 *
 * `strokeWidth` IS NOT SCALED PER USE. Each is drawn in a 24-unit box at the
 * one size the navbar renders it, so the stroke is tuned once. If a second
 * consumer ever wants one of these at a different size, give it a prop then —
 * not preemptively.
 */

type IconProps = { className?: string };

/**
 * The centre mark: a constellation node cluster.
 *
 * THE CHOICE, STATED, because the spec left it open between "a home icon" and
 * "a tech icon". This is neither a house nor a generic tech glyph — it is the
 * hero's own `ParticleGrid`, which is a mesh of points joined by proximity
 * lines, reduced to five nodes. That makes the centre of the navbar a small
 * quotation of the site's single most distinctive visual, which a house glyph
 * could not be, and it avoids the two obvious template signatures: the house
 * (every portfolio) and the terminal prompt (every developer portfolio).
 *
 * It still READS as home, because of where it is and what it does — dead centre,
 * between the two section links, scrolling to the top. The accessible name says
 * so outright, so nothing depends on a visitor decoding the metaphor.
 *
 * The geometry is deliberately irregular. A symmetric arrangement of five dots
 * reads as a diagram or a dice face; the mesh in the hero is irregular, and so
 * is this.
 */
export function ConstellationIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Edges first, so the nodes sit on top of the line ends rather than the
          lines crossing the dots. */}
      <path d="M4.2 15.8 12 4.6 20 12.4 13.2 19.6 4.2 15.8" />
      <path d="M12 4.6 13.2 19.6" />
      {/* Nodes. Filled, so they read as points of light rather than as rings —
          which is what the particle field actually draws. */}
      <g fill="currentColor" stroke="none">
        <circle cx="4.2" cy="15.8" r="1.55" />
        <circle cx="12" cy="4.6" r="1.55" />
        <circle cx="20" cy="12.4" r="1.55" />
        <circle cx="13.2" cy="19.6" r="1.55" />
      </g>
    </svg>
  );
}

/**
 * The LinkedIn "in" mark.
 *
 * AN ICON, NOT THE WORD, per the spec — and it is the one place on this site
 * where a third-party brand glyph is used. The reason it is acceptable here and
 * nowhere else: the navbar has no room for `linkedin.com/in/muhammad-saad-…`,
 * the Contact section already renders that URL as visible text, and an "in"
 * square is universally legible in a way that an abbreviated URL is not.
 */
export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1-.02 5.02A2.5 2.5 0 0 1 4.98 3.5ZM3.2 9.4h3.56V21H3.2V9.4Zm5.8 0h3.41v1.59h.05c.47-.9 1.64-1.84 3.37-1.84 3.6 0 4.27 2.37 4.27 5.46V21h-3.56v-5.66c0-1.35-.02-3.09-1.88-3.09-1.89 0-2.18 1.47-2.18 2.99V21H9V9.4Z" />
    </svg>
  );
}

/**
 * The copy confirmation's checkmark.
 *
 * `pathLength={1}` NORMALISES THE PATH so the draw-on animation can express its
 * progress as a plain 0..1 dash offset instead of a measured length. Without it
 * the dash numbers would have to be re-derived every time the path is nudged,
 * and a stale number produces a checkmark that stops drawing four-fifths of the
 * way along — which looks like a rendering bug rather than a tuning error.
 */
export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12.5 9.5 18 20 6.5" pathLength={1} />
    </svg>
  );
}

/** The mobile menu's open/close glyph. Two rules that become an X. */
export function MenuIcon({ open, className }: IconProps & { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      aria-hidden="true"
    >
      {/* Two paths that TRANSFORM rather than two icons that swap, so the
          gesture is one continuous move. The rotation origin is the centre of
          the box, which is where both rules already cross. */}
      <path
        d="M4 9h16"
        className="origin-center transition-transform duration-300 motion-reduce:transition-none"
        style={{ transform: open ? "translateY(3px) rotate(45deg)" : undefined }}
      />
      <path
        d="M4 15h16"
        className="origin-center transition-transform duration-300 motion-reduce:transition-none"
        style={{
          transform: open ? "translateY(-3px) rotate(-45deg)" : undefined,
        }}
      />
    </svg>
  );
}
