import type { ComponentType } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { SKILLS_HEADING } from "@/components/sections/skillsContent";
import {
  BuildingTowardList,
  SkillNameFlow,
  SystemsFoundationList,
  type SkillGroupRendererProps,
} from "@/components/sections/SkillGroupRenderers";
import { SKILL_GROUPS, getSkillsByGroup } from "@/content/skills";
import type { SkillGroup } from "@/content/types";

/**
 * Stack — Tier 2/3, the second section on `bg-base`, directly after About.
 *
 * DELIBERATELY A SERVER COMPONENT, exactly as About is. `Reveal` is the only
 * client boundary, so none of the 18 skill names or 8 notes reaches the client
 * bundle.
 *
 * COMPOSITION — one left-anchored column, three stacked groups, NO RAIL. About
 * puts its beat labels in a 144px rail; that is refused here for a measured
 * reason, not a stylistic one: "Currently Building Toward" is ~204px of mono at
 * 12px and "Systems Foundation" ~147px, so both overflow a 144px rail, and
 * widening the rail to 233px would push Skills' text column to 322px from the
 * spine against About's 199px — the two sections would visibly stop lining up
 * down the page. A rail also solves a PROSE problem Skills does not have: a
 * label above a list is already the natural relationship, because a list has no
 * flow to interrupt. With no rail, the heading, all three labels and all 18
 * items start on one vertical line, which is the strongest available reading of
 * Rule S-1.
 *
 * The shared vocabulary with About is kept where it counts: same container,
 * same insets, same `text-h2` at inherited weight, same mono-caption label
 * atom, same 34rem measure, same Fibonacci rhythm, same four-`Reveal` shape.
 *
 * NO ACCENT COLOUR AND NO BORDERS ANYWHERE IN THIS SECTION, following About and
 * for a stronger reason: 18 short strings laid out in a flow is precisely the
 * shape of a link list, and the first thing a reader does with a coloured word
 * is try to click it. Also absent by decision: `bg-elevated` and any border,
 * both of which would turn a group into a CARD (Ticket 6's affordance), any
 * rule or divider, `accent-hero` (Tier 1 only), and every hover state.
 */

/**
 * Group -> presentation. Exhaustive over `SkillGroup` ON PURPOSE: adding a
 * fourth group to the union without adding a renderer here is a TYPE ERROR
 * rather than a silently blank region in production. Verified by temporarily
 * widening the union; do not loosen this to a `Partial` or an index signature.
 *
 * It lives in the component layer, never in /content — content/types.ts states
 * that styling is the consumer's job, always, and a group -> presentation
 * mapping is styling.
 *
 * `building-toward` intentionally reuses the Systems Foundation pair renderer;
 * see SkillGroupRenderers.tsx for why there is no empty-state component.
 */
const GROUP_RENDERER: Record<
  SkillGroup,
  ComponentType<SkillGroupRendererProps>
> = {
  "core-dev": SkillNameFlow,
  "systems-foundation": SystemsFoundationList,
  "building-toward": BuildingTowardList,
};

/**
 * The one tint that ships: `bg-tint-warm` behind the Core Dev group unit, label
 * row included — a tint covering only the list would fragment the group.
 *
 * WHY ONE AND NOT TWO. The section is 18 short strings in a single column,
 * monotonous by construction, so one quiet field gives it a single
 * figure/ground event and makes Core Dev — the proof group — the anchor. The
 * section then de-saturates as it descends, which is the site's energy curve in
 * miniature. `bg-tint-cool` stays UNSPENT: putting a coloured surface around
 * the group with nothing in it would draw the eye straight to the emptiest
 * region, and the count already handles that region honestly.
 *
 * GEOMETRY: the block starts ON THE SPINE with zero left padding and pads the
 * other three sides, so the colour field's left edge lands exactly on the line
 * the whole site is built on (glyph side-bearings supply the 1-2px optical
 * gap). A negative-margin bleed was rejected because at 360px the container
 * inset is only 21px, so a block extending left by 21px would run to the
 * viewport edge — a full-bleed surface, which is forbidden. This resolution has
 * no breakpoint-dependent behaviour at all. The right edge stops at 34rem: the
 * void on the right is never painted.
 *
 * RHYTHM CONSEQUENCE, DELIBERATE — DO NOT "FIX" IT. The block's own 21px
 * padding adds to the surrounding margins, so the Core Dev -> Systems
 * Foundation boundary reads as 55px (mobile) / 76px (lg) against 34 / 55
 * between groups 2 and 3. The extra separation is correct: it separates the one
 * blocked group from the two plain ones.
 *
 * In light mode this tint is `#f8fbf8` on a `#fdfcfa` base and may be close to
 * imperceptible on some displays. That is an accepted degradation, not a bug:
 * nothing in the section's meaning is carried by it. Do NOT compensate with a
 * border, and do not swap in `bg-elevated`.
 */
const GROUP_SURFACE: Record<SkillGroup, string> = {
  "core-dev": "max-w-[34rem] bg-tint-warm pt-md pr-md pb-md pl-0",
  "systems-foundation": "",
  "building-toward": "",
};

export function Skills() {
  return (
    <section
      id="stack"
      aria-labelledby="stack-heading"
      // Rule S-2's standard seam: 89 bottom + 89 top = 178px, uniform at all
      // breakpoints. NO `sm:` variant — About opens larger only because it
      // follows the hero's hard colour edge, and that is hero debt, not
      // precedent for the sections after it.
      className="w-full bg-base pt-2xl pb-2xl"
    >
      {/* Identical to About's container, byte for byte. The spine is 21 / 55 /
          89px, and every group's content is capped at the same 34rem measure
          About uses for prose, so the unpainted right-hand void has one width
          down the whole page rather than two. Do not widen it "to use the
          space". */}
      <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
        <Reveal>
          {/* Weight left at the inherited 400, as in About: the type scale
              carries the size, and a bolder heading pulls a Tier 2/3 section
              toward Tier 1. */}
          <h2 id="stack-heading" className="text-h2 text-fg">
            {SKILLS_HEADING}
          </h2>
        </Reveal>

        {/*
          The gap under the heading is LARGER than the gap between groups
          (55 > 34, 89 > 55), for the same reason it is in About: the three
          groups are one continuous argument — proof, depth, direction — and
          must group as a single block beneath the heading. Equal gaps would
          make "Stack" read as a fourth peer item.
        */}
        <div className="mt-xl space-y-lg lg:mt-2xl lg:space-y-xl">
          {/*
            ITERATE THE DATA. Order and labels come from SKILL_GROUPS in
            content/skills.ts, because the sequence proof -> depth -> direction
            is a positioning decision, not a formatting one. No group id and no
            label string is written in this JSX; three hand-written blocks would
            satisfy the eye and make the data decorative.

            FORBIDDEN, restating content/skills.ts:7-19: no re-sorting (including
            alphabetically WITHIN a group — array order is meaningful), no
            re-labelling, no merging, no hiding, and above all no
            `.filter((g) => getSkillsByGroup(g.id).length > 0)`, which would
            delete the empty group this section exists to show honestly.
          */}
          {SKILL_GROUPS.map((group) => {
            const groupSkills = getSkillsByGroup(group.id);
            const GroupRenderer = GROUP_RENDERER[group.id];

            return (
              // NO DELAY, ON ANY GROUP — and no `index * STAGGER.line` cascade.
              // Skills is anchor-reachable at `#stack`, so a jump can land the
              // heading and two groups on a single observer tick, and any delay
              // would then render the sequence visibly out of order. This is
              // the exact failure About documented at About.tsx:74-94. Do not
              // "restore" a stagger here either.
              //
              // The className carries this group's own surface, exactly as
              // About's carries its beat grid. No new prop, no new variant, and
              // Reveal itself is untouched by this ticket.
              <Reveal key={group.id} className={GROUP_SURFACE[group.id]}>
                <div className="flex items-baseline gap-x-sm">
                  {/* An <h3>, but explicitly NOT heading-sized: a mono caption
                      that names the group. No `text-transform` — the labels are
                      authored in their display casing in the content file, and
                      transforming in CSS would make the DOM text and the
                      rendered text disagree. About's labels are authored
                      uppercase and these are title case; that minor register
                      difference is a one-line CONTENT edit if it ever matters,
                      never an `uppercase` class here.

                      Neither of About's two rail corrections applies: there is
                      no rail to protect with `lg:whitespace-nowrap`, and
                      `lg:pt-3xs` optically aligned a 12px line box sitting
                      BESIDE a 16px one — here the label is above its content,
                      so the same 3px would be an error rather than a fix. */}
                  <h3 className="text-caption font-mono text-fg/70">
                    {group.label}
                  </h3>

                  {/*
                    THE ENTRY COUNT — the section's one computed presentational
                    value, and the whole of the empty-group treatment.

                    It is not copy, and it is not a scoreboard: `00` has no
                    denominator, no target, no bar and no unit noun. NOTHING MAY
                    BE APPENDED TO IT — not "entries", not "/10", not "+". A
                    region that failed to load does not render a computed zero,
                    so the digits are also the proof that the code ran and that
                    zero is the answer. Printed on all three groups so it reads
                    as an index annotation that happens to say `00` once, rather
                    than as an apology aimed at one group.

                    Zero-padded to two digits so all three occupy the same
                    advance width and `00` sits as a peer rather than a ragged
                    anomaly. Above 99 `padStart` is a no-op — no clamping, no
                    "99+". Never stored in content; always computed here.

                    `aria-hidden` because the group heading's accessible name has
                    to stay clean: "Core Dev 10" announced as a heading is worse
                    than useless. This is a visual annotation.
                  */}
                  <span
                    aria-hidden="true"
                    className="text-caption font-mono text-fg/40"
                  >
                    {String(groupSkills.length).padStart(2, "0")}
                  </span>
                </div>

                {/* `min-h` is on ALL THREE content regions, one wrapper class,
                    not an empty-state device. For the first two groups it is
                    inert. For Currently Building Toward it holds 55px of
                    reserved space sized to about one entry (a 25.6px name line
                    plus a 16.8px note line, plus its trailing air) — the group
                    is holding a seat, not an indefinite void, and the section's
                    `pb-2xl` below it means the page ends on quiet rather than
                    snapping shut under the last label, which is the shape that
                    reads as truncation. */}
                <div className="mt-sm min-h-[var(--spacing-xl)] max-w-[34rem] lg:mt-md">
                  <GroupRenderer skills={groupSkills} />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Skills;
