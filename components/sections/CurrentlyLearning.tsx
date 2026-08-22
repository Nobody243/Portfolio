import {
  EXTERNAL_LINK_ON_BASE,
  ExternalLink,
} from "@/components/ui/ExternalLink";
import { Reveal } from "@/components/ui/Reveal";
import {
  IN_PROGRESS_HEADING,
  LAST_REVIEWED_LABEL,
  RANGE_SEPARATOR,
  STARTED_LABEL,
  STATUS_LABELS,
} from "@/components/sections/currentlyLearningContent";
import {
  CURRENTLY_LEARNING_UPDATED,
  currentlyLearning,
} from "@/content/currentlyLearning";
import { formatMonthYear } from "@/lib/formatMonthYear";

/**
 * In Progress — Tier 3. On `/work`, the THIRD section on `bg-base`, directly
 * after Experience: the archive, the internship, then what is in progress.
 * (This said "the fifth section", which it was on the one-page site.)
 *
 * IT RENDERS NOTHING TODAY, BY DECISION, AND THAT IS THE WHOLE TICKET.
 * `content/currentlyLearning.ts` is empty — genuinely, confirmed by Saad on
 * 2026-08-19 — so this component returns `null` and the page goes Experience
 * straight into whatever follows. Adding the first cert to that data file makes
 * the entire section appear with ZERO code changes here. That is Ticket 9's
 * acceptance criterion ("trivially editable by updating the data file only")
 * stated as a mechanism rather than as a promise.
 *
 * WHY NOT AN HONEST EMPTY STATE. `Skills.tsx` renders `00` beside "Currently
 * Building Toward" and carries the visible-trajectory signal in full — the
 * digits are the proof that the code ran and that zero is the answer. A second
 * empty state states the same absence TWICE, in the exact direction the site
 * claims to be heading; once reads as honest, twice starts to read as an
 * apology.
 *
 * THE ARGUMENT IS WEAKER THAN IT WAS AND THE COMMENT MUST NOT PRETEND
 * OTHERWISE. It used to read "given Skills ships one three sections up ...
 * makes THE PAGE state the same absence twice". That was the one-page site.
 * Skills is on `/` and this is on `/work`, so the two can no longer appear on
 * one page at all, and nobody scrolls past both in one gesture. What survives
 * is the weaker form: a visitor who reads `/` and then `/work` still meets the
 * absence twice in one session, a screen apart rather than a scroll apart.
 *
 * SO TREAT THIS AS A DESIGN CALL THAT IS STILL OPEN, NOT AS A RULE. Returning
 * `null` is still what ships and is still what Ticket 9's acceptance criterion
 * describes as a mechanism. But adding an honest empty state here would no
 * longer contradict a stated decision the way it once would — it is Saad's
 * call, and it needs a fresh answer rather than this paragraph's old one.
 *
 * DELIBERATELY A SERVER COMPONENT, exactly as About, Skills, Projects,
 * ProjectDetail and Experience are. There is no "use client" here and there
 * must not be one: `Reveal` is the only client boundary, so nothing in
 * `content/currentlyLearning.ts` reaches the client bundle.
 *
 * ONE CODE PATH FOR n = 1 AND n = 6. The section maps the array, and the only
 * `.length` read in the file is the zero-gate above — there is no
 * `length === 1` branch, no "featured" treatment for a first entry, no count
 * beside the heading (Skills' `00` is honest because it makes an EMPTY group
 * visible; `01` beside one cert is a digit whose only reading is "one"), and no
 * numbering of any kind. Adding entry two must be an edit to
 * `content/currentlyLearning.ts` and nothing else.
 *
 * NO TIMELINE, NO PROGRESS BAR, NO PERCENTAGE. The reflex for a section about
 * unfinished things is a progress indicator, and every version of it is
 * fabrication: `LearningEntry` has no completion fraction, so any bar would be
 * a number nobody measured. A vertical rail with dots is refused for the same
 * reason `Experience` and `Skills` refused it — a rail plus the site spine is
 * two competing left edges, against Rule S-1. Forbidden: connector lines, dots,
 * chevrons, year gutters, `border-l`, dividers between entries, `<hr>`, bars,
 * rings, percentages, and any decoration whose meaning is "there are more of
 * these" or "this is x% done".
 *
 * NOT APOLOGETIC IN TONE — the ticket's words — is carried by what is ABSENT as
 * much as by what is written: no "just started", no "beginner", no "slowly
 * working through", no hedging adverb anywhere in this file, and no copy in
 * `currentlyLearningContent.ts` that explains or excuses the section's size.
 * An entry is stated the same way a job is stated in Experience: title, status,
 * date, what it is.
 *
 * NO TINT, NO BORDER, NO `bg-elevated`, NO CARD. `bg-tint-cool` stays UNSPENT
 * and this section is not where it gets spent either — it would be tempting
 * (`docs/03_FRONTEND_SPEC.md` reserves cool for cloud/infra-leaning content and
 * this section's future content is precisely that), but painting a coloured
 * field around a region that is empty today and sparse tomorrow draws the eye
 * straight to the thinnest part of the page. Skills already spent warm as the
 * page's single figure/ground event, and one tint on the site is the point. A
 * border would turn an entry into a CARD, which is Ticket 6's affordance;
 * neither border family applies, since `border-accent-working/30` is for
 * interactive surfaces and `border-fg/25` for image frames, and this section
 * has neither. No radius (no radius token exists), no shadow, no gradient.
 *
 * `accent-hero` APPEARS NOWHERE, in any form. It is Tier 1 only and is
 * registered outside Tailwind's `--color-*` namespace precisely so no utility
 * exists for it; do not route around that with an inline `var(--accent-hero)`.
 * `accent-working` appears on one thing only — an entry's title when that entry
 * has a `link`, plus its focus ring — and never on the status label, because a
 * coloured short string reads as something to click and a status is not
 * clickable.
 *
 * `/70` IS THE OPACITY FLOOR AND LIGHT MODE IS THE BINDING CONSTRAINT. The
 * muted values here are the status label, the dates and the last-reviewed note,
 * all `text-fg/70` (8.41:1 dark, 6.69:1 light) and nothing lower. The title and
 * the description are primary content at FULL `text-fg`.
 * `docs/03_FRONTEND_SPEC.md` records this defect being caught three times,
 * always because a value was tuned by eye in dark mode where it passes. If
 * something needs to recede further than `/70` allows, it needs a different
 * device — size, weight, position, spacing — not a lower contrast ratio.
 *
 * TIER 3 MOTION BUDGET, IN FULL: the shared `Reveal`, unchanged, at `delay: 0`
 * everywhere. No hover state, no parallax, no scroll-linked value, no stagger,
 * no GSAP, no R3F, and no transform beyond `Reveal`'s own 13px lift. Reduced
 * motion degrades to a pure opacity fade for free via `MotionProvider`.
 */

/** The metadata register: status and dates. Same atom as Experience's meta line
 *  and ProjectDetail's, `/70` and no lower — see the header. */
const META = "text-caption font-mono text-fg/70";

/**
 * An entry's title when it links out — SHARED SINCE TICKET 10.
 *
 * The class string, the focus ring, the `target`/`rel` pair and the `sr-only`
 * new-tab note previously lived here as a deliberate third copy of
 * `ProjectDetail.tsx`'s. Ticket 10 extracted all four into
 * `components/ui/ExternalLink.tsx`. Computed styles are unchanged.
 *
 * NO `text-body` SIZE CLASS, which is the one difference from Experience's and
 * ProjectDetail's call sites, and it is why the shared component owns semantics
 * while the CALLER owns size. There the link wraps the company name in a `<p>`;
 * here it wraps the title inside an `<h3 class="text-h4">`, so the size must be
 * INHERITED from the heading. Appending `text-body` here would silently shrink
 * the title to 16px the day an entry has a link — a bug that only appears with
 * data that does not exist yet, which is precisely the class of defect this
 * section was verified against with temporary fixtures.
 *
 * The no-hover-state contrast constraint and the "underline is not decoration"
 * rule are both recorded at the shared component.
 */
const EXTERNAL_LINK = EXTERNAL_LINK_ON_BASE;

export function CurrentlyLearning() {
  // THE ZERO-GATE. The only `.length` read in this file, and it is a whole-
  // section gate rather than a layout branch: below this line n = 1 and n = 6
  // travel one path. Returning `null` — not an empty `<section>` — is what
  // keeps `#in-progress` out of the served HTML entirely, so nothing renders a
  // seam, a heading with no body, or 178px of blank page between Experience and
  // whatever follows.
  if (currentlyLearning.length === 0) {
    return null;
  }

  return (
    <section
      id="in-progress"
      aria-labelledby="in-progress-heading"
      // Rule S-2's standard seam: 89 bottom + 89 top = 178px, uniform at all
      // breakpoints. NO `sm:` variant — About opens larger only because it
      // follows the hero's hard colour edge, which is hero debt and not
      // precedent for the sections after it. Byte-identical to Skills,
      // Projects and Experience.
      className="w-full bg-base pt-2xl pb-2xl"
    >
      {/* Identical to About's, Skills', Projects' and Experience's container,
          byte for byte. The spine is 21 / 55 / 89px inside a 1440px centred
          container. Content caps at the site's 34rem reading measure — NOT
          57rem, which is the image width, and there are no images here — so
          this section adds no new right edge to the page. The void on the
          right is never painted. */}
      <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
        <Reveal>
          {/* Weight left at the inherited 400, as in About, Skills, Projects
              and Experience: the type scale carries the size, and a bolder
              heading pulls a Tier 3 section toward Tier 1. */}
          <h2 id="in-progress-heading" className="text-h2 text-fg">
            {IN_PROGRESS_HEADING}
          </h2>
        </Reveal>

        {/*
          A REAL LIST, so a screen reader announces the honest current count.
          It also means n = 2 needs zero markup change.

          THE GAP UNDER THE HEADING IS LARGER THAN THE GAP BETWEEN ENTRIES
          (55 > 34, 89 > 55), for the fifth time on this site: the entries are
          one block beneath the heading, and an equal gap would make
          "In Progress" read as a peer item. `space-y` is inert at n = 1 and
          correct at n = 2 with no change.
        */}
        <ul className="mt-xl space-y-lg lg:mt-2xl lg:space-y-xl">
          {/*
            ARRAY ORDER IS DISPLAY ORDER. No sort, no filter, no reverse, no
            `[...currentlyLearning].sort()`, and above all NO grouping or
            filtering by `status` — a `.filter((e) => e.status === "in-progress")`
            would hide the planned items the data layer deliberately allows, and
            a sort by status would impose a ranking the content file never
            states. The hand-edited order in that file is the order.

            `key` is title + start month: unique in practice (a retake has a
            different start month) and it adds no field duplicating array
            position.
          */}
          {currentlyLearning.map((entry) => (
            // The <li> sits OUTSIDE the Reveal: Reveal renders a motion.div,
            // and a <div> is not a valid direct child of a <ul>. Same shape as
            // Projects.tsx and Experience.tsx. No `h-full` — there is no grid
            // here and nothing to stretch.
            <li key={`${entry.title}-${entry.startedDate}`}>
              {/*
                NO DELAY, ON ANY ENTRY — and no `index * STAGGER.line` cascade.
                `#in-progress` is an anchor target the same way `#stack`,
                `#work` and `#experience` are, so a jump can land the heading
                and the first entries on a single IntersectionObserver tick,
                and any per-item delay would then render the sequence visibly
                out of order. That is the exact defect About shipped a fix for
                in dc35cfa, which Skills, Projects and Experience have each
                since ratified.

                ONE `Reveal` PER ENTRY, not one around the list: `Reveal`'s
                header states a target is always ONE unit, and at its hardcoded
                `amount: 0.1` a single wrapping reveal on a long stack would
                fire while the last entry was still below the fold. Reveal is
                used UNMODIFIED and gains no prop.
              */}
              <Reveal>
                {/* The title is the heading. `text-h4` (21->26px) is the
                    spec's sub-heading step, matching Experience's role — these
                    two sections are peers in the page's outline and must not
                    disagree about entry scale.

                    THE LINK WRAPS THE TITLE rather than sitting on a separate
                    "Course page" line, and that is a content decision: a
                    generic link label would be copy invented here for an entry
                    type nobody has authored yet (a cert page, a syllabus, a
                    CTF profile and a repo do not share one honest noun). The
                    title is the entry's own words, so the accessible name is
                    always right. Same shape as Experience linking the company
                    name.

                    `text-fg` on the <h3> is the unlinked colour; the anchor
                    overrides it and inherits the SIZE. See EXTERNAL_LINK. */}
                <h3 className="text-h4 text-fg">
                  {entry.link ? (
                    // The new-tab note is appended to the visible text by
                    // `ExternalLink`, never as an `aria-label` replacing it —
                    // see that component.
                    <ExternalLink href={entry.link} className={EXTERNAL_LINK}>
                      {entry.title}
                    </ExternalLink>
                  ) : (
                    entry.title
                  )}
                </h3>

                {/*
                  Meta line — 13px stepping to 21px, the gear change from
                  identity into metadata. `flex-wrap` with `gap-y-2xs` mirrors
                  Experience's meta paragraph exactly, so a status plus a long
                  range wraps rather than clipping at 360px.

                  STATUS COMES FIRST, and position is the only device it gets.
                  The ticket asks for it to be "visually distinct as in
                  progress"; leading the metadata line is that distinction. It
                  is NOT colour-coded (two accents, one job each — see the
                  header), NOT boxed (a bordered status is a chip, and a chip is
                  a card at small scale), and NOT full opacity, because it is
                  metadata about the entry rather than the entry itself.

                  `STATUS_LABELS[entry.status]` with no `??` fallback: the
                  Record is exhaustive over `LearningStatus`, so a new status
                  is a compile error rather than a blank span. Do not add a
                  fallback — it would convert that guard into a silent
                  kebab-case leak.

                  `formatMonthYear`, never `new Date()` and never `Intl` — that
                  file documents both as verified bugs here: "YYYY-MM" parses as
                  UTC midnight, so every viewer at a negative UTC offset would
                  see the PREVIOUS month, and `Intl` disagrees across the
                  server/client boundary.

                  TWO DATE SHAPES, ONE PER CASE, and no arithmetic of any kind:
                  a duration is NEVER derived from these two strings, and there
                  is no "3 months in" anywhere. With no `completedDate` the
                  start month is prefixed with STARTED_LABEL, because a lone
                  date under a title reads as a deadline. With one, the pair
                  renders as a range and the prefix would be wrong English. The
                  completed case is TRANSIENT by design — content/
                  currentlyLearning.ts graduates finished items out into
                  skills.ts — and it is built anyway so that day is not a code
                  change.

                  Two `<time>` elements with the separator between them, not one
                  `<time>` around the whole range — a range is not a single
                  datetime value. `YYYY-MM` is a valid HTML month string, so the
                  machine-readable value agrees with the rendered one at no
                  visual cost.
                */}
                <p className="mt-sm flex max-w-[34rem] flex-wrap gap-x-md gap-y-2xs lg:mt-md">
                  <span className={META}>{STATUS_LABELS[entry.status]}</span>
                  <span className={META}>
                    {entry.completedDate ? (
                      <>
                        <time dateTime={entry.startedDate}>
                          {formatMonthYear(entry.startedDate)}
                        </time>
                        {RANGE_SEPARATOR}
                        <time dateTime={entry.completedDate}>
                          {formatMonthYear(entry.completedDate)}
                        </time>
                      </>
                    ) : (
                      <>
                        {STARTED_LABEL}{" "}
                        <time dateTime={entry.startedDate}>
                          {formatMonthYear(entry.startedDate)}
                        </time>
                      </>
                    )}
                  </span>
                </p>

                {/*
                  Description — the entry's body copy, and the only block with
                  no label. FULL OPACITY, never `/70`: it is primary content,
                  and it is REQUIRED on `LearningEntry`, so there is no absent
                  case and no null branch.

                  The blank-line split is the same mechanism ProjectDetail and
                  Experience ship, and is expected to stay INERT: a learning
                  entry is a sentence or two, so this yields a one-element
                  array. What it buys is that the day Saad writes a second
                  paragraph, it becomes two paragraphs with no code change.
                  Keyed by index deliberately — the array is derived from one
                  immutable string and is never reordered.

                  `space-y-md` (21px) between paragraphs: ~0.8 of a 25.6px line,
                  a clear break that is not a gap. Same reasoning as
                  ProjectDetail and Experience.
                */}
                <div className="mt-md max-w-[34rem] space-y-md">
                  {entry.description.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={index} className="text-body text-fg">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Reveal>
            </li>
          ))}
        </ul>

        {/*
          THE LAST-REVIEWED NOTE — one per section, never per entry.

          IT RENDERS INSIDE THE SECTION, so while the array is empty it is
          invisible along with everything else. That is consistent with the
          decision recorded in this file's header and is NOT a defect: a
          freshness stamp on a region that renders nothing is a stamp on
          nothing. It also means `CURRENTLY_LEARNING_UPDATED` has a real caller
          from today — `lib/formatMonthYear.ts` shipped with a "there is
          currently no caller" comment that went stale and nearly invited
          deletion, and an unused export is exactly that same invitation.

          55px / 89px of air above it — larger than the 34/55 between entries —
          so it reads as a footnote to the section rather than as another entry.

          `formatMonthYear` again, and the DAY IS DELIBERATELY DROPPED from the
          visible string: `CURRENTLY_LEARNING_UPDATED` is "YYYY-MM-DD" and that
          helper takes the first two segments, so it renders "August 2026". That
          is the right granularity for a review stamp — a day-precise date on a
          section that changes a few times a year invites the reader to compute
          staleness in days. The `dateTime` attribute carries the FULL ISO date,
          so the machine-readable value stays exact; a `<time>` whose attribute
          is more precise than its text is that element's normal use, not drift.

          No `new Date()` and no `Intl`, per the same hydration and timezone
          bugs documented in lib/formatMonthYear.ts. Nothing here compares the
          date to "now" — there is no "updated 2 days ago", which would be a
          computed value that goes stale on a statically rendered page.
        */}
        <Reveal>
          <p className={`mt-xl max-w-[34rem] lg:mt-2xl ${META}`}>
            {LAST_REVIEWED_LABEL}{" "}
            <time dateTime={CURRENTLY_LEARNING_UPDATED}>
              {formatMonthYear(CURRENTLY_LEARNING_UPDATED)}
            </time>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export default CurrentlyLearning;
