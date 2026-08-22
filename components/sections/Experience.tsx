import {
  EXTERNAL_LINK_ON_BASE,
  ExternalLink,
} from "@/components/ui/ExternalLink";
import { Reveal } from "@/components/ui/Reveal";
import {
  EXPERIENCE_HEADING,
  ONGOING_LABEL,
  RANGE_SEPARATOR,
  STACK_LABEL,
} from "@/components/sections/experienceContent";
import { experience } from "@/content/experience";
import { formatMonthYear } from "@/lib/formatMonthYear";

/**
 * Experience — Tier 3. On `/work`, the SECOND section on `bg-base`, directly
 * after the project archive and directly before In Progress. (This said "the
 * fourth section", which it was on the one-page site; the component itself is
 * unchanged and route-agnostic.)
 *
 * DELIBERATELY A SERVER COMPONENT, exactly as About, Skills, Projects and
 * ProjectDetail are. There is no "use client" here and there must not be one:
 * `Reveal` is the only client boundary, so nothing in `content/experience.ts`
 * reaches the client bundle. If `motion/react` ever appears in this file,
 * something has gone wrong.
 *
 * ONE CODE PATH FOR n = 0, n = 1 AND n = 5. The section maps the array, and
 * there is no branch on `.length` anywhere — no `experience.length === 1`, no
 * `<FirstJob>`, no "featured" treatment for the only entry, no "if there is
 * only one, centre it / widen it / put it in a card". Adding job two must be an
 * edit to `content/experience.ts` and nothing else. This is exactly
 * `BuildingTowardList`'s solution to Skills' empty group, rotated: a section
 * built for a list, currently holding one item.
 *
 * NO ENTRY COUNT, and Skills' `00` deliberately does NOT transfer. That count
 * is honest because it makes an EMPTY group visible — the digits are the proof
 * that the code ran and that zero is the answer. `Projects.tsx` then refused a
 * count on a full gallery because volume-as-achievement is the one register
 * CLAUDE.md bans by name. `01` beside one job is worse than either: a number
 * whose only reading is "one", printed on the section a recruiter reads most
 * literally — an apology rendered as a digit. No count, no `01 /` prefix, no
 * numbering of any kind.
 *
 * NO TIMELINE. The reflex layout here is a vertical rail with dots and a
 * connecting line, and it is the single worst choice at n = 1: a timeline with
 * one dot is visibly a timeline missing entries. It also contradicts Rule S-1 —
 * a rail plus the site spine is two competing left edges, which is why Skills
 * refused a rail too. Forbidden: connector lines, dots, chevrons, year gutters,
 * `border-l`, dividers between entries, `<hr>`, and any decoration whose
 * meaning is "there are more of these".
 *
 * WHAT MAKES ONE ENTRY READ AS AN ENTRY rather than as a list that failed to
 * load is stated positively, not by absence: the entry is a composed block with
 * four internal parts (role, company, mono meta line, prose + stack), nothing
 * below it implies truncation (the section's own `pb-2xl` closes it into
 * quiet), there is no `min-h` reserving space for absent siblings, and it is a
 * real `<ul>`/`<li>` so a screen reader announcing "list, 1 item" states the
 * honest current fact.
 *
 * NO TINT, NO BORDER, NO `bg-elevated`, NO CARD. `bg-tint-cool` stays UNSPENT
 * and this section is not where it gets spent: `docs/03_FRONTEND_SPEC.md`
 * reserves cool for cloud/infra-leaning content, and a React / Next.js /
 * Tailwind / Supabase web internship is the LEAST infra-leaning content on the
 * site — painting the site's only cool block here would label the internship as
 * the infra part, which is the exact overclaim CLAUDE.md rules out, in the
 * section read most literally. By the spec's own rule the correct tint would be
 * warm, and Skills already spent warm as the page's single figure/ground event.
 * A border would turn the entry into a CARD, which is Ticket 6's affordance.
 * Neither border family applies: `border-accent-working/30` is for interactive
 * surfaces and `border-fg/25` for image frames, and this section has neither.
 * No radius (no radius token exists), no shadow, no gradient.
 *
 * `accent-hero` APPEARS NOWHERE, in any form. It is Tier 1 only and is
 * registered outside Tailwind's `--color-*` namespace precisely so no utility
 * exists for it; do not route around that with an inline `var(--accent-hero)`.
 * `accent-working` appears exactly once — the company link and its focus ring —
 * and never on ordinary text, because a coloured short string reads as
 * something to click.
 *
 * `/70` IS THE OPACITY FLOOR AND LIGHT MODE IS THE BINDING CONSTRAINT. The
 * muted values here are the date range, the location and the stack label, all
 * `text-fg/70` (8.41:1 dark, 6.69:1 light) and nothing lower. The role, the
 * company, the prose and the stack entries are all primary content at FULL
 * `text-fg`. `docs/03_FRONTEND_SPEC.md` records this defect being caught three
 * times, always because a value was tuned by eye in dark mode where it passes.
 * If something needs to recede further than `/70` allows, it needs a different
 * device — size, weight, position, spacing — not a lower contrast ratio.
 *
 * TIER 3 MOTION BUDGET, IN FULL: the shared `Reveal`, unchanged, at `delay: 0`
 * everywhere. No hover state, no parallax, no scroll-linked value, no stagger,
 * no GSAP, no R3F, and no transform beyond `Reveal`'s own 13px lift. Reduced
 * motion degrades to a pure opacity fade for free via `MotionProvider`.
 */

/** Block label atom — an `<h4>` by document structure, a mono caption by
 *  register. Identical to About's, Skills' and ProjectDetail's: heading LEVEL
 *  follows the outline (h2 -> h3 -> h4), heading LOOK does not follow the
 *  level. */
const BLOCK_LABEL = "text-caption font-mono text-fg/70";

/** The metadata register: dates and location. Same atom as ProjectDetail's meta
 *  line, `/70` and no lower — see the header. */
const META = "text-caption font-mono text-fg/70";

/** Label -> its content. 13px, stepping to 21px at lg. Byte-identical to Skills
 *  and ProjectDetail. */
const LABEL_GAP = "mt-sm lg:mt-md";

/**
 * The company link — SHARED SINCE TICKET 10.
 *
 * The class string, the focus ring, the `target`/`rel` pair and the `sr-only`
 * new-tab note previously lived here as a deliberate copy of
 * `ProjectDetail.tsx`'s. Ticket 10 extracted all four into
 * `components/ui/ExternalLink.tsx`, which is now the one place any of them
 * changes. Computed styles are unchanged by that move.
 *
 * `text-body` stays local, because the size legitimately differs per call site:
 * here the link wraps the company name inside a `<p>`, while
 * `CurrentlyLearning` passes the constant ALONE so its link inherits `text-h4`
 * from the `<h3>` around it. That is why the shared component owns semantics
 * and the caller owns size.
 *
 * The no-hover-state contrast constraint and the "underline is not decoration"
 * rule are both recorded at the shared component.
 */
const EXTERNAL_LINK = `${EXTERNAL_LINK_ON_BASE} text-body`;

export function Experience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      // Rule S-2's standard seam: 89 bottom + 89 top = 178px, uniform at all
      // breakpoints. NO `sm:` variant — About opens larger only because it
      // follows the hero's hard colour edge, which is hero debt and not
      // precedent for the sections after it. Byte-identical to Skills and
      // Projects.
      className="w-full bg-base pt-2xl pb-2xl"
    >
      {/* Identical to About's, Skills' and Projects' container, byte for byte.
          The spine is 21 / 55 / 89px inside a 1440px centred container. Content
          caps at the site's 34rem reading measure — NOT 57rem, which is the
          image width, and there are no images here — so this section adds no
          new right edge to the page. The void on the right is never painted. */}
      <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
        <Reveal>
          {/* Weight left at the inherited 400, as in About, Skills and
              Projects: the type scale carries the size, and a bolder heading
              pulls a Tier 3 section toward Tier 1. */}
          <h2 id="experience-heading" className="text-h2 text-fg">
            {EXPERIENCE_HEADING}
          </h2>
        </Reveal>

        {/*
          A REAL LIST, so a screen reader announces "list, 1 item" — accurate,
          and the honest current state. It also means n = 2 needs zero markup
          change.

          THE GAP UNDER THE HEADING IS LARGER THAN THE GAP BETWEEN ENTRIES
          (55 > 34, 89 > 55), for the fourth time on this site: the entries are
          one block beneath the heading, and an equal gap would make
          "Experience" read as a peer item. `space-y` is inert at n = 1 and
          correct at n = 2 with no change.
        */}
        <ul className="mt-xl space-y-lg lg:mt-2xl lg:space-y-xl">
          {/*
            ARRAY ORDER IS DISPLAY ORDER. No sort, no filter, no reverse, no
            `[...experience].sort()`. content/experience.ts states the rule the
            other way round — the array is kept reverse-chronological by hand
            and a new role goes at the TOP — because a sort here would be a
            second source of truth for an order the file already shows.

            `key` is company + start month: unique in practice (two stints at
            one employer have different start months) and it adds no field
            duplicating array position.
          */}
          {experience.map((entry) => (
            // The <li> sits OUTSIDE the Reveal: Reveal renders a motion.div,
            // and a <div> is not a valid direct child of a <ul>. Same shape as
            // Projects.tsx. No `h-full` — there is no grid here and nothing to
            // stretch.
            <li key={`${entry.company}-${entry.startDate}`}>
              {/*
                NO DELAY, ON ANY ENTRY — and no `index * STAGGER.line` cascade.
                `#experience` is an anchor target the same way `#stack` and
                `#work` are (Ticket 15's resume link and any future nav point at
                it), so a jump can land the heading and the first entries on a
                single IntersectionObserver tick, and any per-item delay would
                then render the sequence visibly out of order. That is the exact
                defect About shipped a fix for in dc35cfa, which Skills and
                Projects have each since ratified.

                ONE `Reveal` PER ENTRY, not one around the list: `Reveal`'s
                header states a target is always ONE unit, and at its hardcoded
                `amount: 0.1` a single wrapping reveal on a three-entry stack
                would fire while the last entry was still below the fold. Reveal
                is used UNMODIFIED and gains no prop.
              */}
              <Reveal>
                {/* Role as the heading, company directly beneath: three facts,
                    three registers. The role is the title; the company is a
                    primary fact that must not be demoted to 12px mono at /70,
                    because a recruiter scans for the employer name; the dates
                    and location are metadata. `text-h4` (21->26px) is the
                    spec's sub-heading step — `text-h3` would be near section
                    scale for a single item.

                    DO NOT COMPRESS ROLE AND COMPANY INTO ONE HEADING with an em
                    dash: that makes the accessible heading name a compound
                    string and forces a wrap decision at 360px. */}
                <h3 className="text-h4 text-fg">{entry.role}</h3>

                {/* 8px binds the company to the role as one identity block.
                    Full opacity — primary content. */}
                <p className="mt-xs text-body text-fg">
                  {entry.url ? (
                    // The new-tab note is appended to the visible text by
                    // `ExternalLink`, never as an `aria-label` replacing it —
                    // see that component.
                    <ExternalLink href={entry.url} className={EXTERNAL_LINK}>
                      {entry.company}
                    </ExternalLink>
                  ) : (
                    entry.company
                  )}
                </p>

                {/*
                  Meta line — 13px stepping to 21px, the gear change from
                  identity into metadata. `flex-wrap` with `gap-y-2xs` mirrors
                  ProjectDetail's meta paragraph exactly, so a long range plus a
                  location wraps rather than clipping at 360px. The location is
                  a SIBLING span, never concatenated into the date string.

                  `formatMonthYear`, never `new Date()` and never `Intl` — that
                  file documents both as verified bugs here: "YYYY-MM" parses as
                  UTC midnight, so every viewer at a negative UTC offset would
                  see the PREVIOUS month, and `Intl` disagrees across the
                  server/client boundary.

                  THE RANGE IS COMPOSED AT THE CALL SITE. No `formatMonthRange`
                  helper yet and no arithmetic of any kind: a duration is NEVER
                  derived from these two strings. "2 months" subtracted from
                  YYYY-MM is a number nobody verified, the range already says
                  it, and a restated duration is padding.

                  Two `<time>` elements with the separator between them, not one
                  `<time>` around the whole range — a range is not a single
                  datetime value. `YYYY-MM` is a valid HTML month string, so the
                  machine-readable value agrees with the rendered one at no
                  visual cost.

                  An absent `endDate` means the role is ongoing and renders
                  ONGOING_LABEL. Unexercised today.
                */}
                <p className="mt-sm flex max-w-[34rem] flex-wrap gap-x-md gap-y-2xs lg:mt-md">
                  <span className={META}>
                    <time dateTime={entry.startDate}>
                      {formatMonthYear(entry.startDate)}
                    </time>
                    {RANGE_SEPARATOR}
                    {entry.endDate ? (
                      <time dateTime={entry.endDate}>
                        {formatMonthYear(entry.endDate)}
                      </time>
                    ) : (
                      ONGOING_LABEL
                    )}
                  </span>
                  {entry.location ? (
                    <span className={META}>{entry.location}</span>
                  ) : null}
                </p>

                {/*
                  Description — the entry's body copy, and the only block with
                  no label. FULL OPACITY, never `/70`: it is primary content.

                  AN ABSENT BLOCK RENDERS `null` AT ITS OWN POSITION, never an
                  empty wrapper. A `<div>` around a `null` child still collects
                  its margin and produces a ghost gap — the same defect
                  ProjectDetail guards against for CCN and SNA. With no
                  description, the stack block's `mt-lg` closes against the meta
                  line.

                  The blank-line split is the same mechanism ProjectDetail ships
                  and is INERT TODAY: the one description is a single paragraph,
                  so this yields a one-element array. What it buys is that the
                  day Saad adds a blank line, it becomes two paragraphs with no
                  code change. No implementer may touch the string to make that
                  happen sooner. Keyed by index deliberately — the array is
                  derived from one immutable string and is never reordered.

                  `space-y-md` (21px) between paragraphs: ~0.8 of a 25.6px line,
                  a clear break that is not a gap. Same reasoning as
                  ProjectDetail.
                */}
                {entry.description ? (
                  <div className="mt-md max-w-[34rem] space-y-md">
                    {entry.description
                      .split(/\n{2,}/)
                      .map((paragraph, index) => (
                        <p key={index} className="text-body text-fg">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                ) : null}

                {/*
                  Built with — the stack, in file order, untruncated and
                  unsorted. 34px separates a reference block from body copy
                  without ProjectDetail's 55px inter-BLOCK step, which would be
                  too much air inside a single entry.

                  NOT CHIPS. There is no radius token by decision, so a chip
                  here is a square box, and square boxes in a flow read as tag
                  INPUTS that invite a click doing nothing. Same borderless mono
                  flow `SkillNameFlow` and `ProjectDetail` already ship. A real
                  `<ul>`, so a screen reader announces the count.

                  NO SEPARATOR GLYPH — no interpunct, no slash, no comma. A 21px
                  column gap against JetBrains Mono's ~7.2px word space at 12px
                  is a ~2.9x contrast, which ProjectDetail already verified is
                  enough that adjacent terms cannot blur.

                  Branching on `stack?.length` covers both an absent key and a
                  future `[]`, so a role with no meaningful stack renders no
                  label over an empty flow.
                */}
                {entry.stack?.length ? (
                  <div className="mt-lg max-w-[34rem]">
                    <h4 className={BLOCK_LABEL}>{STACK_LABEL}</h4>
                    <ul
                      className={`${LABEL_GAP} flex flex-wrap gap-x-md gap-y-xs`}
                    >
                      {entry.stack.map((technology) => (
                        <li
                          key={technology}
                          className="text-caption font-mono text-fg"
                        >
                          {technology}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Experience;
