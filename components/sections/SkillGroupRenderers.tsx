import { SkillGlyph } from "@/components/sections/skillLogos";
import type { Skill } from "@/content/types";

/**
 * The two shapes a skill group takes on screen — Ticket 5, revised by Phase 3.
 *
 * WHAT PHASE 3 CHANGED, AND WHAT IT DID NOT. Core Dev gained a 1em monochrome
 * glyph column and became a declared 5-row matrix instead of a wrap-flow; the
 * inter-entry vertical gap unified at 21px across both variants. That is all.
 * `SkillPairList` is untouched, every rule in this header still binds, and the
 * empty-state line lives one level up in `Skills.tsx` so this file keeps its
 * "n = 0, 1 and 6 are one code path" property.
 *
 * NEITHER VARIANT IS A CARD, and `docs/07_SITE_RESTRUCTURE.md` §5 saying "two
 * card variants" does not make one. That doc's own resolution block settles it
 * in favour of this file: "card" there means an ENTRY TREATMENT, not a drawn
 * box. Read the two variants as one system carried by four shared axes, not by
 * a shared rectangle:
 *
 *   Axis            Core Dev                  Systems Foundation
 *   left edge       glyph, on the spine       course name, on the spine
 *   first line      one 25.6px band           one 25.6px band
 *   inter-entry     21px                      21px
 *   subordinate     the glyph, LEFT of it     the note, BELOW it
 *
 * The subordinate voice appears in both — it only changes position. A Core Dev
 * entry is a name with its context to the left; a Systems entry is a name with
 * its context below. Same two parts, same weights, same rhythm, rotated. That
 * is why they read as one system while carrying a 6:1 text-length ratio, and it
 * is why EQUAL HEIGHTS ARE NOT THE GOAL: the two variants are never side by
 * side, so forcing a Core Dev row to a Systems entry's height would buy ten
 * rows of empty space and nothing else.
 *
 * CONSEQUENCE, STATED SO NOBODY "FIXES" IT: Core Dev's NAMES now sit 24px right
 * of Systems Foundation's names, because the glyph is what starts on the spine.
 * The thing that aligns down this section is each entry's leading element, not
 * its first word. Do NOT indent the course names to match.
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
 * Core Dev — a glyph column and a name, in a declared 5-row matrix.
 *
 * WHY A GRID AT ALL. Marks only read as a set when they share a vertical
 * alignment line, and a wrap-flow gives them none. The grid is not decoration
 * and it is not "using the space": it exists to hold the glyph column straight.
 *
 * COLUMN-MAJOR AT >=640px, AND THIS IS THE LOAD-BEARING LINE IN THIS FILE.
 * `content/skills.ts` says leftmost/first reads as strongest. With 1fr tracks
 * the two glyph columns sit ~251px apart while rows are 46.6px apart — a 5.4:1
 * proximity ratio — so the eye groups COLUMNS, not rows, whatever the DOM says.
 * Default row-major would therefore be READ as React, Flutter, JavaScript,
 * Tailwind CSS, Firebase / Next.js, ASP.NET… i.e. the strength-ordered array
 * visibly interleaved and scrambled. Column-major makes the perceived order and
 * the array order the same order, and puts the top five literally in the left
 * column.
 *
 * THIS IS NOT COLUMN BALANCING, and it is not what the old wrap-flow rejected.
 * CSS multi-column and masonry were refused because they reflow items
 * UNPREDICTABLY. `grid-rows-5` plus `grid-auto-flow: column` is a DECLARED
 * matrix: item n lands at row n mod 5, column floor(n / 5), deterministically,
 * with no `order` utility. DOM order is untouched at 1…10, so screen-reader and
 * tab order remain array order. Still no sorting, no reversing, and no
 * shuffling for visual balance.
 *
 * ONE COLUMN BELOW 640px, TWO ABOVE, NEVER THREE OR FOUR. Measured against the
 * 34rem cap: the worst-case cell is 140px ("Tailwind CSS" at 16px mono plus the
 * glyph and its 8px gap), and two 21px-gapped tracks at 360px come to 138px —
 * a 2px overflow, which is what buys the single `sm:` change. Three columns
 * fits above 640px and is rejected because 10 does not divide by 3: it strands
 * Node.js, the last and by declaration weakest entry, alone in a final row,
 * which reads as a layout accident. Four is arithmetically impossible at this
 * measure at every breakpoint.
 *
 * `auto-cols-fr` IS REQUIRED, NOT TIDYING. The second column is IMPLICIT (one
 * explicit track, ten items, five rows), and implicit tracks size to `auto`
 * unless told otherwise — which would hand column 1 all the free space and
 * break both the 251px track measurement and the alignment the grid exists for.
 *
 * GROWTH, so it is not rediscovered later: an 11th entry opens a third column
 * holding one item (160px tracks at 1024px, comfortably over the 140px worst
 * case). Above 12 entries raise `grid-rows` to 6 and then 7 — do NOT let a
 * fourth column appear, because four do not fit at any breakpoint.
 *
 * NO CHIP, NO BORDER, NO SURFACE, NO RADIUS, NO SHADOW, NO HOVER — unchanged
 * from the wrap-flow, and more important now: a grid of brand marks in boxes is
 * exactly the "tech stack card grid" this section has twice been designed away
 * from, and it would counterfeit the project gallery's card affordance.
 */
export function CoreDevGrid({ skills }: SkillGroupRendererProps) {
  return (
    <ul className="grid grid-cols-1 gap-x-md gap-y-md sm:auto-cols-fr sm:grid-flow-col sm:grid-rows-5">
      {skills.map((skill) => (
        // The <li> IS the cell. `items-center` centres the 16px glyph box on
        // the 25.6px line box; `gap-x-xs` is 8px and is an INSIDE-the-object
        // measure with no relationship to the 21px between-object gap — do not
        // "unify" the two. No `min-h`: every cell is exactly one line box by
        // construction, so a declared height would be dead CSS implying a
        // raggedness that cannot occur.
        //
        // (`inline-flex` on a grid item is blockified to `flex` by the spec. It
        // is written as `inline-flex` because that is what the cell is: a run
        // of text with a mark in front of it.)
        <li key={skill.name} className="inline-flex items-center gap-x-xs">
          <SkillGlyph skill={skill} />
          {/* Full-strength `text-fg`, not a muted variant: this is the proof
              group and it should read at full confidence, not as metadata. The
              /70 in this row belongs to the GLYPH, never to the name. */}
          <span className="text-body font-mono text-fg">{skill.name}</span>
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
 * binds a name to its note. `space-y-md` is UNCHANGED by Phase 3 — its 21px is
 * now the whole section's shared inter-entry gap rather than a local choice,
 * which strengthens the ratio rather than disturbing it. Same value, promoted
 * to a rule: if it ever moves, Core Dev's `gap-y-md` moves with it. Nothing else is needed — no bracket, no indent, no
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
