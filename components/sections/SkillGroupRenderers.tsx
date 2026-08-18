import type { Skill } from "@/content/types";

/**
 * The two shapes a skill group takes on screen — Ticket 5.
 *
 * Presentational, stateless, server components. No "use client": nothing here
 * has state, an event handler or a hover treatment, and the 18 strings must
 * stay out of the client bundle.
 *
 * TWO RENDERERS, SELECTED PER GROUP — NOT ONE COMPONENT BRANCHING ON `note`.
 * The obvious implementation is `skill.note ? <WithNote/> : <BareName/>`, and
 * it is rejected (plan §6.1): `note` is optional on every group, so the day
 * someone annotates one Core Dev entry that entry silently changes shape and
 * the group renders nine names and one two-line block. The variation is a
 * property of the GROUP's meaning — a library name versus a course and what it
 * covered — not of any individual record. `Skills.tsx` binds group -> renderer
 * through an exhaustive Record, so a new group is a type error rather than a
 * blank space in production.
 *
 * THE REGISTER RULE that produces the split: JetBrains Mono carries terms,
 * Space Grotesk carries titles. A library name is a term. A course title is a
 * title. A note listing concepts is a run of terms. That is why mono appears
 * here at two sizes without reading as a gimmick.
 *
 * NO HOVER STATES, ANYWHERE IN THIS FILE. Eighteen non-interactive strings that
 * respond to the cursor are eighteen things a reader will try to click. The
 * count of legitimate interactive affordances in this section is zero — a tab
 * pass through Skills must find nothing focusable.
 *
 * NO ACCENT COLOUR and NO BORDERS. Both rules point at the same trap: a
 * bordered rectangle is a CARD, and the card affordance belongs to Ticket 6's
 * project gallery. `globals.css` also defines borders as `accent-working/20`,
 * so a "neutral" border silently spends the accent. Hierarchy here is carried
 * by size, opacity, typeface and position — four axes, all already in the
 * system.
 */

/**
 * Every renderer takes exactly this, so all three are interchangeable in
 * `Skills.tsx`'s `Record<SkillGroup, ComponentType<SkillGroupRendererProps>>`.
 * `getSkillsByGroup` already returns a fresh, non-readonly array — no defensive
 * copy is needed here and none should be added.
 */
export type SkillGroupRendererProps = {
  skills: Skill[];
};

/**
 * Core Dev — a borderless wrap-flow of names.
 *
 * ORDER IS STRENGTH ORDER (content/skills.ts:38), so visual order must be array
 * order: React first, top left, always. `flex flex-wrap` preserves source order
 * strictly. Do NOT reach for CSS columns, masonry, `order`, alphabetical
 * sorting or column balancing — every one of those reflows items out of
 * sequence and destroys a content decision for a layout reason.
 *
 * NO CHIP: no background, no border, no padding box, no radius (there is no
 * radius token, by decision, so a chip here would be a square box — and ten
 * square boxes in a flow read as tag INPUTS, a form control that invites a
 * click that does nothing). Borderless mono names read as a colophon instead:
 * quieter, and more confident than the badge-wall every stack section ships.
 *
 * NO SEPARATOR GLYPH — no interpunct, no slash, no comma. A separator written
 * in JSX is a punctuation decision made in a component and invisible to anyone
 * editing skills.ts. The 21px column gap against mono's ~9.6px word space is a
 * 2.2x contrast, which is enough that "Tailwind CSS" and "Next.js" never blur
 * together.
 */
export function SkillNameFlow({ skills }: SkillGroupRendererProps) {
  return (
    <ul className="flex flex-wrap gap-x-md gap-y-sm">
      {skills.map((skill) => (
        // Full-strength `text-fg`, not a muted variant: this is the proof
        // group and it should read at full confidence, not as metadata.
        <li key={skill.name} className="text-body font-mono text-fg">
          {skill.name}
        </li>
      ))}
    </ul>
  );
}

/**
 * The name + note pair list, shared by Systems Foundation and Currently
 * Building Toward. Exported only through the two bindings below.
 *
 * `<dl>` / `<dt>` / `<dd>` is the honest markup for terms and their
 * descriptions, and it is what keeps `name` and `note` as SEPARATE ELEMENTS —
 * so no one can concatenate them with a hardcoded em-dash separator. The
 * per-pair `<div>` is valid inside `<dl>` and is what carries the between-pair
 * spacing.
 *
 * The `<dd>` sits directly under its `<dt>` with NO margin, so the two line
 * boxes are adjacent; that adjacency against the 21px inter-pair gap is what
 * binds a name to its note. Nothing else is needed — no bracket, no indent, no
 * rule, no colon, no dash. (Browsers apply `margin-inline-start: 40px` to
 * `dd`; Tailwind v4's Preflight already zeroes it via the universal selector,
 * verified in node_modules/tailwindcss/preflight.css. Do NOT add a defensive
 * `ml-0` — it would be dead CSS implying a bug that does not exist.)
 *
 * The note ALWAYS renders, visibly, adjacent. Never a tooltip, never a hover
 * reveal, never a `title` attribute: a note that only appears on hover does not
 * exist on touch, does not reliably exist to a screen reader, and does not
 * exist in a screenshot.
 *
 * Single column at every breakpoint. Two columns at `lg` would make the reading
 * order ambiguous — column-major or row-major — and array order in these groups
 * is meaningful.
 */
function SkillPairList({
  skills,
  alwaysRenderNote,
}: SkillGroupRendererProps & { alwaysRenderNote: boolean }) {
  return (
    <dl className="space-y-md">
      {skills.map((skill) => (
        <div key={skill.name}>
          {/* Space Grotesk, inherited. Course titles are titles. */}
          <dt className="text-body text-fg">{skill.name}</dt>
          {alwaysRenderNote || skill.note !== undefined ? (
            // Same atom as the group label, in a different position and role:
            // present but subordinate. Resolves through `var(--color-fg)`, so
            // it flips correctly with the theme with no per-mode tuning.
            <dd className="text-caption font-mono text-fg/70">{skill.note}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

/**
 * Systems Foundation — course names with the concepts each course covered.
 *
 * `alwaysRenderNote` IS THE POINT OF THIS BINDING, not a stray flag.
 * content/skills.ts:21-23 states the hard rule: a course name rendered without
 * its note is an unexplained claim. A `skill.note ? … : null` here would
 * satisfy that rule BY ACCIDENT — delete a note by mistake and the entry would
 * degrade into a tidy bare name instead of failing. Rendering the `<dd>`
 * unconditionally means a missing note leaves an empty description in the DOM,
 * which is visible in the output and catchable by review. Do not "tidy" this
 * into a conditional.
 */
export function SystemsFoundationList({ skills }: SkillGroupRendererProps) {
  return <SkillPairList skills={skills} alwaysRenderNote />;
}

/**
 * Currently Building Toward — THE SAME PAIR RENDERER, on purpose.
 *
 * This group ships with ZERO entries and that is the honest current state, not
 * a bug and not something to pad with aspirational placeholders (see the header
 * of content/skills.ts). There is deliberately NO empty-state component: this
 * maps over an array, so n = 0, n = 1 and n = 6 are one code path. When the
 * first cert or lab lands, adding it to skills.ts changes the count from `00`
 * to `01` and renders one pair — no component diff, no CSS diff, nothing to
 * delete. That is the whole design: the emptiness is held by the ordinary group
 * scaffold plus the computed count in Skills.tsx, not by a special case here.
 *
 * Reusing the pair register also means the first real entry arrives already
 * carrying its context — "Security+" standing alone would be exactly the
 * unexplained claim skills.ts warns about for course names.
 *
 * THE ONE DIFFERENCE from Systems Foundation: here the `<dd>` renders only when
 * `note` is present, because `note` is optional on `Skill` and this group's
 * future content is not all guaranteed to need one. That is an optional detail
 * line inside a fixed shape — it does not reopen plan §6.1, which forbade
 * letting the LAYOUT switch on data presence across groups.
 */
export function BuildingTowardList({ skills }: SkillGroupRendererProps) {
  return <SkillPairList skills={skills} alwaysRenderNote={false} />;
}
