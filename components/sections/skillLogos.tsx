import type { Skill } from "@/content/types";

/**
 * The Core Dev glyph column — Phase 3.
 *
 * A COMPONENT-LAYER REGISTRY, NOT CONTENT. `content/types.ts` states that
 * styling is the consumer's job, always, and an SVG path is styling. So
 * `Skill.logo` carries an ID STRING and this file owns everything else: the
 * geometry, the 16px box, the `currentColor` fill, the accessibility
 * attributes and the fallback. A logo pasted into `content/skills.ts` would
 * break that rule at the layer where it is hardest to notice.
 *
 * NOT AN ICON SYSTEM, AND MUST NOT BE REUSED AS ONE. This site has no icon
 * system by decision; these are brand marks scoped to `Skill.logo` ids. A
 * course, a section heading or a UI control never gets a glyph from here — see
 * SkillGroupRenderers.tsx, which rejects invented iconography by name.
 *
 * MONOCHROME, ALWAYS — `currentColor` at `text-fg/70`, never brand colour.
 * That is the two-accent rule, not a preference: React blue, Flutter cyan,
 * Firebase amber, Supabase green and Next.js black would put six uncontrolled
 * hues into a system whose stated rule is two accents, each with one job.
 * Monochrome also flips with the theme for free — one fill, no per-mode asset —
 * and it keeps the fallback below in the same register as a real mark instead
 * of looking broken.
 *
 * THE MARK IS THE QUIET ELEMENT AND THE NAME IS THE LOUD ONE. Every generic
 * stack section does the opposite. Here the name is the claim and the glyph is
 * only a recognition aid, so the glyph is subordinate at /70 and the name is
 * full-strength `text-fg`. It also stops ten brand marks out-shouting the eight
 * course names in the group below, which would make the proof group read louder
 * than the depth group for purely decorative reasons.
 *
 * INLINE SVG ONLY, NEVER `next/image`. Ten network requests for 16px marks is
 * the wrong trade, and a raster asset cannot inherit `currentColor`. This file
 * has no "use client": it is rendered from a server component and its output
 * ships as HTML, so nothing here reaches the client bundle. Do not add the
 * directive to "make the SVGs work" — they are static markup.
 *
 * NO MOTION OF ANY KIND ON A GLYPH. No path draw-on, no `stroke-dasharray`
 * animation, no scale-in, no rotation, no float, no parallax, no marquee, no
 * grayscale-to-colour (there is no colour to transition to), no `filter`. The
 * glyphs arrive inside their group's single `Reveal` fade and then hold still.
 * Stack is Tier 3.
 *
 * NO HOVER, NO TOOLTIP, NO `title`. A grid of brand marks is the most link-like
 * arrangement on the page and a hover response would confirm a false
 * affordance — nothing in this section is focusable or clickable. A tooltip
 * does not exist on touch, in a screenshot, or reliably to a screen reader; a
 * mark that needs explaining is the wrong mark, and the name is 8px away.
 */

/**
 * id -> geometry. DELIBERATELY EMPTY TODAY.
 *
 * No logo assets exist yet — that is the one outstanding content item on this
 * section (restructure plan §2, Q3), and it is explicitly non-blocking: every
 * entry renders the fallback below, which is a designed state and not a broken
 * one. Dropping a mark in later is one entry here plus one `logo` field in
 * `content/skills.ts`. No component changes, no layout change, no reflow — the
 * glyph box is a fixed 16px whether it holds a mark or a letter.
 *
 * WHEN ADDING A MARK: strip every brand `fill`, `stroke` and `stop-color`
 * attribute, normalise the `viewBox` so the drawing's optical weight is
 * comparable to its neighbours at 16px, and give `paths` the raw `d` strings
 * only. `fill="currentColor"` and the accessibility attributes are applied
 * below, once, so they cannot drift entry to entry.
 *
 * MIXED STATES HAVE A CEILING. Marks and fallback letters may coexist up to
 * about 3 of 10; past that the letters stop reading as fallbacks and start
 * reading as an inconsistent monogram system. Ten of ten letters — today's
 * state — is uniform and therefore fine; five and five is the state to avoid.
 * If the registry ever sits between those, finish the set before shipping.
 */
const SKILL_LOGOS: Record<string, { viewBox: string; paths: readonly string[] }> =
  {};

/**
 * The 16px glyph slot.
 *
 * EXACTLY 1em SQUARE (`size-4`), and not a spacing token: `--spacing-sm` (13px)
 * is too small against an 11.4px cap height and `--spacing-md` (21px) is nearly
 * twice cap height and would dominate the name. One em is the only size that
 * reads as part of the text line rather than as an object beside it.
 *
 * `shrink-0` so a long name can never squeeze the box and shift the section's
 * left spine — the glyph is the element that sits ON the spine, and the name is
 * indented from it, not the reverse.
 *
 * FALLBACK: the entry's first character, uppercased, in mono at `text-caption`,
 * same box, same /70, no border, no fill, no radius. Explicitly NOT a chip —
 * there is no radius token, and a hard-cornered filled box reads as a tag input
 * that invites a click that does nothing. Collisions are irrelevant
 * (Next.js/Node.js both give "N") because the glyph is a placeholder for a
 * mark, not an identifier; the name sits 8px to its right.
 *
 * `aria-hidden` on BOTH branches. A mark and a letter carry no information the
 * adjacent name does not, and announcing "N, Next.js" is noise.
 */
export function SkillGlyph({ skill }: { skill: Skill }) {
  const mark = skill.logo === undefined ? undefined : SKILL_LOGOS[skill.logo];

  if (mark !== undefined) {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={mark.viewBox}
        className="size-4 shrink-0 fill-current text-fg/70"
      >
        {mark.paths.map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="text-caption inline-flex size-4 shrink-0 items-center justify-center font-mono text-fg/70"
    >
      {skill.name.charAt(0).toUpperCase()}
    </span>
  );
}

export default SkillGlyph;
