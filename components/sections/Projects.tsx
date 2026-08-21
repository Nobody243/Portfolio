import { Reveal } from "@/components/ui/Reveal";
import { ProjectCard } from "@/components/sections/ProjectCard";
import { PROJECTS_HEADING } from "@/components/sections/projectsContent";
import type { Project } from "@/content/types";

/**
 * Work — Tier 2. The third section on Home (after Stack, three cards) and the
 * first on `/work` (the full archive, five cards). One component, two pages.
 *
 * IT TAKES ITS LIST AS A PROP AND DOES NOT FILTER, SORT OR SLICE — Phase 3,
 * and the rule is the point. Home passes `featuredProjects`, `/work` passes
 * `projects`; both are ordered by `content/projects.ts`'s array, which is the
 * single source of display order for the whole site. A `featured` prop, a
 * `limit` prop or a `.slice(0, 3)` here would each put a second copy of that
 * decision in a component, where nobody editing the data file would find it.
 * The membership set that picks the three lives in the data file and expresses
 * MEMBERSHIP ONLY, never sequence.
 *
 * DELIBERATELY A SERVER COMPONENT, exactly as About and Skills are. The client
 * boundary is `Reveal` and `ProjectCard`, and `ProjectCard` receives only the
 * five fields a card draws — so no `description` (the longest strings in the
 * data file), no `links` and no `credit` reach the client bundle.
 *
 * COMPOSITION — heading, then a capped two-column grid of however many cards
 * it was handed. Nothing else. No intro sentence, no "click a card"
 * instruction, no project count, no filter chips, no "view all". Filter chips
 * are the single most recognisable portfolio-template control and would be
 * inert theatre here anyway (four of five projects share one `category`). A
 * count is the one register CLAUDE.md bans by name — Skills' `00` is honest
 * because it makes an EMPTY group visible; three or five is not a number that
 * needs announcing.
 *
 * AND STILL NO "VIEW ALL" LINK ON HOME, now that Home shows a subset. The route
 * to the archive is the navbar's WORK entry, which is present on every page and
 * is the site's one answer to "where is everything" — a second, section-local
 * link to the same place would be the template affordance this section has
 * refused since Ticket 6.
 *
 * GRID WIDTH IS A DOCUMENTED DEPARTURE FROM THE 34rem MEASURE — the one place
 * this site has two void widths instead of one, and it is deliberate.
 * About and Skills cap their content at 34rem "so the unpainted right-hand
 * void has one width down the whole page". 34rem (544px) is a READING measure:
 * it exists so a paragraph line runs 60-75 characters. This section contains
 * no paragraph. At 544px the grid would be one column at every breakpoint —
 * five stacked cards down the left third of a 1262px content box, which is a
 * list, not a gallery.
 *
 * So the grid caps at 27rem (432px) below 768px and 57rem (912px) above it.
 * Rule S-1 governs the LEADING EDGE and that is unchanged: the grid starts on
 * the same spine as the hero wordmark's annotation, About's beat labels and
 * Skills' groups. At 1440px the void to the right of the grid is 350px against
 * About's 718px — recorded as a real cost, not hidden.
 *
 * WHY NOT THE FULL 1262px CONTENT BOX, which would remove the second void
 * width entirely: (1) the void is the site's signature and cards draw their own
 * right edge, so a full-width grid of bordered rectangles would paint the right
 * side emphatically, for one section, in the middle of the page — the only
 * section whose composition argues with the other four; (2) width is what
 * damages the covers. A full-width two-column grid is a 615px slot, which puts
 * the SNA cover (a 779px source that cannot be recaptured — the VM lab is
 * decommissioned) at 0.63x of ideal 2x density, visibly soft, on the newest
 * project and the one nearest the stated career direction. The cap holds every
 * slot between 312px and 439px AT 360px AND ABOVE, so SNA's worst case in that
 * range is 0.89x. Below 360px the slot keeps shrinking (278px at 320, 238px on
 * a folded Galaxy Fold) — which is safe in the direction that matters, because
 * a narrower slot makes SNA DENSER, not softer, and `sizes`' calc(100vw - 42px)
 * branch tracks it correctly. Stated precisely because the whole aspect-ratio
 * argument rests on this range, and "every slot on the site" was not true.
 *
 * If the two-void-width effect ever reads badly on a tall scroll-through, the
 * correction is to narrow the gallery TOWARD About's void (max-w-[51rem], slot
 * 380px, SNA 1.02x) — never to widen it. Reject any change that pushes a slot
 * past 470px; that is where SNA falls below 0.83x and the softness becomes the
 * first thing visible on the card.
 *
 * `bg-elevated` PLUS A BORDER, AFTER SKILLS REFUSED BOTH. That refusal was
 * explicit and it named this ticket: Skills.tsx rules out `bg-elevated` and any
 * border because they "would turn a group into a CARD (Ticket 6's affordance)".
 * Using them here is the plan working, not drift. `bg-elevated` alone is not
 * enough — in dark mode it is only DeltaE 2.89 from `bg-base`, less distinct
 * than either tint, because it differs from base only in lightness. The border
 * is what makes a card read as a card on dark. Both live in ProjectCard.tsx.
 *
 * NO TINT. The section background is `bg-base`, like About and Skills. Three
 * reasons, in order: Skills documents leaving `bg-tint-cool` UNSPENT as a live
 * decision, held for a genuinely cloud/infra-leaning block, and a gallery is
 * not one; this section already introduces a new surface (the cards), and a
 * tinted background under tinted-adjacent cards is two figure/ground events
 * competing to do the same job; and only 2 of 5 projects are infra, so a cool
 * section tint would label the whole set as infra work — the exact overclaim
 * CLAUDE.md's positioning rules out.
 *
 * NO ACCENT BEYOND THE CARD BORDER AND THE FOCUS RING. `accent-working` is not
 * on the title, not on the stack, not on the overflow marker,
 * not as a hover text colour and not as a rule or divider. About and Skills
 * both banned accent-on-text because a coloured short string reads as a link —
 * and inside a card that IS a link, an accent title would claim the title is
 * separately clickable when it is the same target. `accent-hero` appears
 * nowhere in any form: it is Tier 1 only, and it is registered outside the
 * `--color-*` namespace precisely so no utility exists for it. Do not route
 * around that with an inline `var(--accent-hero)`.
 *
 * THE SHARED-ELEMENT MORPH SHIPPED IN TICKET 6b, AND NOTHING IN THIS FILE
 * CHANGED FOR IT. Cards still navigate with a plain `<Link>`; the morph is
 * `layoutId` on `ProjectCard`'s cover wrapper plus an intercepting route at
 * `app/(site)/@modal/(.)projects/[slug]/page.tsx` that keeps this section
 * mounted behind the overlay. This gallery has no overlay state, no click
 * handler and no `router.push` — see ProjectCard.tsx for why an "inert, ready
 * for later" `layoutId` was never stubbed here either.
 *
 * STILL NO STAGGER, and 6b did not change that: `STAGGER.card` remains unused
 * for the reason stated below (a jump-link arrival on `#work` renders a row out
 * of order), and the morph staggers nothing — it is one element.
 */
/**
 * `projects` is `readonly Project[]`, not `ProjectSlug[]` and not a filter
 * descriptor: the caller hands over the records it wants rendered, in the order
 * it wants them rendered. There is no default value — an omitted list would
 * silently fall back to "all five" and a page that forgot to pass its list
 * would look correct on Home and wrong on nothing, which is the worst kind of
 * bug to find. Making it required means the mistake is a compile error.
 */
type ProjectsProps = {
  projects: readonly Project[];
};

export function Projects({ projects }: ProjectsProps) {
  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      // Rule S-2's standard seam: 89 bottom + 89 top = 178px, uniform at all
      // breakpoints. NO `sm:` variant — About opens larger only because it
      // follows the hero's hard colour edge, which is hero debt and not
      // precedent for the sections after it. Byte-identical to Skills.
      className="w-full bg-base pt-2xl pb-2xl"
    >
      {/* Identical to About's and Skills' container, byte for byte. The spine
          is 21 / 55 / 89px. Only the inner cap differs, and only here — see
          the header. */}
      <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
        <Reveal>
          {/* Weight left at the inherited 400, as in About and Skills: the type
              scale carries the size, and a bolder heading pulls a Tier 2
              section toward Tier 1. */}
          <h2 id="work-heading" className="text-h2 text-fg">
            {PROJECTS_HEADING}
          </h2>
        </Reveal>

        {/*
          A REAL LIST, so a screen reader announces "list, 3 items" on Home
          and "list, 5 items" on `/work` — a genuinely useful count when
          browsing a gallery, and it comes from the markup rather than from a
          number anyone has to keep true. Tailwind's preflight already removes
          the markers.

          THE GAP UNDER THE HEADING IS LARGER THAN THE GAP BETWEEN CARDS
          (55 > 34, 89 > 55), for the same reason it is in About and Skills:
          the five cards are one block beneath the heading, and an equal gap
          would make "Work" read as a sixth peer item.

          ONE UNIFORM GAP IN BOTH AXES at each step, mirroring Skills'
          `space-y-lg lg:space-y-xl`. No `gap-x`/`gap-y` split: with
          wide-aspect covers the cards are broad and short, so an asymmetric
          gap reads as an accident rather than as rhythm.

          COLUMNS GO 1 -> 2 AND NEVER 3. At 1024px a three-column grid inside
          the content box gives 259px slots, where `text-h4` clamps to ~23px
          and "Multi-Floor Call Center Network Design" runs four lines — a card
          that is a title with a picture attached. The 27rem/57rem caps are
          what decouple column count from slot width, so this grid gets
          two-column composition AND three-column image density at once.

          DEFAULT `items-stretch` — DO NOT ADD `items-start`. Stretching is
          load-bearing: both cards in a row take the taller card's height, so
          their borders close on one line even though the covers have different
          native aspects (ProjectCard.tsx). Without it, a row reads as two
          ragged boxes rather than as two pictures of different shapes.

          The cards originally also aligned a bottom date row via `mt-auto`.
          The date was dropped after Ticket 6's review — five dates in a
          stretched column made the deliberate strength-first order (see below)
          read as a broken reverse-chronological sort. Stretching still earns
          its place on the border argument alone; the slack now falls below the
          last line of text inside each card.

          THE LAST ROW IS AN ORPHAN AND STAYS ONE CARD WIDE — at three cards
          and at five, both of which are odd. No `last:col-span-2`, no
          `justify-center`, no `place-items-center`, no "featured" full-width
          treatment: `content/projects.ts` removed `featured` as a field
          deliberately, and a stretched final card would reintroduce it as a
          layout accident — while handing whichever project happens to be last
          the largest frame on the page. A normal card on the spine with void to
          its right is the composition Trajectory and Stack already use.

          IF ANY OF THESE VALUES CHANGE, the `sizes` string in ProjectCard.tsx
          must change in the SAME COMMIT. It encodes the column count, both
          gaps, all three insets and both caps, and a mismatch builds green and
          renders perfectly while doubling the section's image bytes.
        */}
        <ul className="mt-xl grid max-w-[27rem] grid-cols-1 gap-lg md:max-w-[57rem] md:grid-cols-2 lg:mt-2xl lg:gap-xl">
          {/*
            PROP ORDER IS DISPLAY ORDER. No sort, no filter, no reverse, no
            slice, and no `[...projects].sort(...)` — this component renders
            exactly what it was given, exactly in the order it was given.
            content/projects.ts states the order is deliberately NOT date
            order — it is strength-first, SNA is the newest entry and sits last
            on purpose, and there is intentionally no `featured` or `order`
            field because an explicit ordering field that duplicates array
            position is a second source of truth that will drift. Home's three
            arrive already in that order because `featuredProjects` filters the
            same array.

            `key={project.slug}` — stable, unique, and already the URL
            identity.
          */}
          {projects.map((project) => (
            // The <li> sits OUTSIDE the Reveal: Reveal renders a motion.div,
            // and a <div> is not valid as a direct child of a <ul>. `h-full`
            // passes the grid item's stretched height down to the card.
            <li key={project.slug}>
              {/*
                NO DELAY, ON ANY CARD — and no `index % columns` cascade, no
                `STAGGER.card`, no `staggerChildren`. This section is an anchor
                target at `#work`, so a jump can land a whole row on one
                observer tick, and with `index % 2` that renders cards 1 and 3
                before 2 and 4 — out of reading order, on the one path a user
                takes deliberately. It is the identical defect About shipped a
                fix for in dc35cfa and Skills then ratified. Reading `columns`
                in JS would also mean a matchMedia hook: new machinery, a
                hydration surface, and a wrong value on first paint.

                THE SCROLL ITSELF IS THE STAGGER, and with row-by-row entry the
                gallery-level entrance IS staggered. This is the third section
                to land here, which makes it the site's convention rather than
                three separate concessions. Do not "restore" a stagger.

                Reveal is used UNMODIFIED and gains no prop: its header forbids
                growing options, and wrapping the whole grid in one Reveal with
                `staggerChildren` is the failure it names — at `amount: 0.1` a
                five-card mobile stack fires when 200px is visible, so the last
                cards finish animating entirely off-screen and are never seen
                to reveal at all.
              */}
              <Reveal className="h-full">
                <ProjectCard
                  slug={project.slug}
                  title={project.title}
                  oneLiner={project.oneLiner}
                  stack={project.stack}
                  coverImage={project.coverImage}
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Projects;
