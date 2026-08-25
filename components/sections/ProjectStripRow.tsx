import Image from "next/image";
import Link from "next/link";

import type { Project } from "@/content/types";

/**
 * One full-bleed strip row on `/projects` — the projects-architecture spec §3,
 * built to `.claude/handoff/projects-architecture-design.md` §F.2, §F.3 and
 * §H.2.
 *
 * WHAT A ROW IS: a name at one end of the viewport and its cover arriving at
 * the other, with the distance between them doing the compositional work. That
 * is the whole reason `/projects` is S-1's second named exception in
 * `docs/03_FRONTEND_SPEC.md` — capped at the 1262px spine inside a 1920px
 * window the cover would arrive 329px short of the edge it is supposed to enter
 * from, and the row would read as a wide table.
 *
 * A SERVER COMPONENT, AND IT ADDS NO CLIENT BUNDLE. Every one of the three
 * hover moves below is CSS — `group-hover:` for the pointer, plus
 * `group-has-[a:focus-visible]:` for the keyboard, which is the same device
 * `ProjectCard` uses for its border step. Framer was the alternative and was
 * REJECTED here on a real difference: `ProjectCard` reaches for `whileHover`
 * because its move is a `scale` and `MotionConfig reducedMotion="user"` then
 * drops that transform for free, whereas Framer has no `focus-within`
 * equivalent at all — a keyboard user tabbing this list would get nothing. In
 * CSS the reduced-motion behaviour is spelled out instead (see below), and
 * `/projects` stays a page whose only client boundary is `PageStack`.
 *
 * THE ROW IS A `<Link>` TO `/projects/<slug>` AND THAT OPENS THE OVERLAY, not
 * the standalone detail page. `app/(site)/@modal/(.)projects/[slug]/page.tsx`
 * intercepts the client navigation and renders `ProjectOverlay`; Close there is
 * `router.back()`, which is what makes all three entry points (Home's cards,
 * `/work`'s deck, this list) return to where they came from with no new state.
 * That is Saad's ruling of 2026-08-25 and it is load-bearing for the whole
 * close design. DO NOT "fix" this into an `<a>`, a `router.push`, or a
 * `scroll={false}` variant — an `<a>` is a hard load and would bypass the
 * interceptor silently, which nothing in the build, tsc or lint would report.
 *
 * NO `layoutId` ON THE THUMBNAIL, AND THAT IS A RECORDED RULING RATHER THAN AN
 * OMISSION. `ProjectCard` gives its cover `project-cover-${slug}` so the card
 * morphs into `CoverFrame`'s 912px cover. A 200x125 letterboxed slot cannot:
 * the crop WINDOW itself would change across the projection, so the image would
 * distort rather than morph. On this route the overlay opens with its own fade
 * and nothing else, and an unmatched `layoutId` on the destination simply
 * renders (`ProjectCard` already records that). The named cheap experiment, if
 * the hard cut ever reads badly, is to add the one prop and LOOK at it in a
 * browser — it is not a thing that can be settled by reading.
 */

/**
 * The three fields a row shows, picked off `Project` rather than taking the
 * whole record — same rule and same reason as `ProjectCardProps`: the ~1,400
 * character `description` never has to be reasoned about here, and a rename in
 * `content/types.ts` is a type error rather than a blank row.
 *
 * `index` is NOT content. It is the row's position in `content/projects.ts`,
 * which is deliberate authored order and is never sorted, and it is the only
 * source of the `01`-`05` numeral. Nothing numbers projects in the data file
 * and nothing should.
 */
export type ProjectStripRowProps = Pick<
  Project,
  "slug" | "title" | "coverImage"
> & {
  readonly index: number;
};

export function ProjectStripRow({
  slug,
  title,
  coverImage,
  index,
}: ProjectStripRowProps) {
  const numeral = String(index + 1).padStart(2, "0");

  return (
    /*
      THE DIVIDER IS `fg/25`, NOT `accent-working/30`, and that is a judgement
      call made against the letter of the border rule rather than in ignorance
      of it. `app/globals.css` splits borders into two families — teal /30 for
      interactive surfaces, neutral /25 for image frames — and a full-bleed rule
      across a clickable row is neither. Six teal lines spanning 1920px would
      make the LIST'S STRUCTURE teal and spend the affordance colour on
      something you cannot click, which is the "a teal frame around something"
      failure globals.css warns about by name. The affordance is carried by the
      row's own hover state instead. Ruled by Saad, 2026-08-25.

      `border-t` ON EVERY ROW PLUS `last:border-b` ON THE LAST — six rules for
      five rows, so the list is closed at both ends. Doing it with `border-b`
      on every row plus a `border-t` on the `<ul>` would look identical and put
      the two edges in two different files.
    */
    <li className="border-t border-fg/25 last:border-b">
      {/*
        `group` AND `relative` BOTH LIVE ON THIS DIV, NOT ON THE `<li>`. The
        stretched link's `after:inset-0` resolves against the nearest positioned
        ancestor, so the positioned element is what defines the hit area; here
        that is the row's full-bleed content box, borders excluded. `group` is
        on the same element so the hover region and the hit region are the same
        rectangle by construction rather than by coincidence.

        HEIGHT: `h-3xl` (144px) AT `lg`+, and it is a real scale step rather
        than an arbitrary value — the 125px cover plus air. Below `lg` the row
        is `py-md` (21px) around whatever the stacked text needs, which runs
        ~102-139px on the longest title at 360px. `lg:py-0` is what stops the
        mobile padding from adding to the fixed height.

        THE GUTTER IS `px-md sm:px-lg`, WHICH IS THE CHROME'S, NOT THE SPINE'S.
        Every row, the `<h1>` and both Close affordances take this same inset —
        one leading edge on the page, never two. See `docs/03`'s S-1 second
        named exception.

        THE FOCUS RING IS DRAWN HERE, ON THE ROW, VIA `has-[a:focus-visible]:`
        — NOT `group-has-`, and the difference is not cosmetic. `group-has-`
        compiles to a DESCENDANT selector (`.group:has(a:focus-visible) .x`),
        so it can never style the group element itself; on this div only the
        bare `has-` form matches. The children below use `group-has-` correctly
        because they ARE descendants. `ProjectCard` draws its ring the same way
        and for the same reason: the operable region is the whole row, so a
        ring around the title inside a 1852px target would be the WCAG 2.4.11
        mismatch this avoids.

        `-outline-offset-2`, INSET RATHER THAN OUTSET. This row is full-bleed,
        so a positive offset would draw the ring's left and right edges outside
        the viewport and a keyboard user would see three sides of a rectangle.
      */}
      <div className="group relative flex items-center gap-md px-md py-md sm:px-lg has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-accent-working lg:h-3xl lg:justify-between lg:py-0">
        {/*
          THE TEXT GROUP. One line at `lg`+ (numeral, then title); stacked
          below it, because at 360px a 38-character title beside a fixed
          numeral column has no measure left to run in.

          `items-baseline` at `lg`+ sits the 12px numeral on the title's first
          baseline. `items-center` would float it against the middle of a
          42px cap height and read as a stray label.
        */}
        <div className="flex flex-col gap-2xs lg:flex-row lg:items-baseline lg:gap-md">
          {/*
            `aria-hidden`, LIKE EVERY OTHER `01` ON THIS SITE. The numeral is
            derived from array position and takes its meaning from sitting at
            the head of a visual row; spoken before each project name it is
            noise. The row's accessible name is the title alone.

            `w-[34px]` IS AN ARBITRARY VALUE ON PURPOSE AND MUST STAY ONE. It
            is numerically `--spacing-lg`, but `w-lg` in Tailwind v4 resolves
            against the `--container-*` scale, not `--spacing-*`, so it would
            silently render a 32rem column. Do not "tidy" this into a token.

            THE COLOUR STEP IS THE ONE PIECE OF HOVER FEEDBACK THAT SURVIVES
            `prefers-reduced-motion`, which is exactly why it is a colour and
            not a move — the identical device, and the identical reasoning, as
            `ProjectCard`'s border step.
          */}
          <span
            aria-hidden="true"
            className="text-caption font-mono text-fg/70 transition-[color] duration-350 ease-in-out group-hover:text-accent-working group-has-[a:focus-visible]:text-accent-working lg:w-[34px]"
          >
            {numeral}
          </span>

          {/*
            A REAL `<h2>`. The page's `<h1>` is "Projects" and nothing sits
            between it and these, so five `<h2>`s are the document outline and
            give a screen-reader user heading navigation across the list.
            `text-h4` at mobile widths and `text-h3` at `lg`+ — the level and
            the visual weight agree at both.

            THE TITLE SHIFTS `+13px` ON HOVER — `translate-x-sm`, the site's
            canonical timed-reveal distance, the same 13px `Reveal` moves. It
            closes the gap toward the arriving cover so the row reads as
            OPENING rather than as a hover highlight.

            THE MOVE IS ON AN INNER `<span>` INSIDE THE ANCHOR, NOT ON THE
            `<h2>`, AND THAT IS A CORRECTNESS FIX RATHER THAN A PREFERENCE.
            Putting it on any ANCESTOR of the stretched link silently breaks
            the stretched link: a non-`none` `translate` makes an element a
            containing block for absolutely-positioned descendants, so the
            anchor's `after:inset-0` would stop resolving against the row and
            start resolving against the moving `<h2>`. The row would be fully
            clickable at rest and — only while hovered, only at `lg`+ — shrink
            its click target to the width of the title. Nothing reports that:
            it type-checks, it lints, it builds, it renders, and it looks
            right in a screenshot. The design brief specifies the title move
            (§F.3) and the stretched link (§F.2) independently and does not
            mention that the two collide; this is where they were reconciled.

            `block`, NOT `inline-block`. `translate` does not apply to a
            non-replaced INLINE box at all, so a bare `<span>` would not move —
            the same silent-nothing failure one level down. `block` is chosen
            over `inline-block` because an inline-block's baseline is its LAST
            line, which would misalign the numeral against a title that wraps
            to two lines at ~1024px; a block box gives the `<h2>` its FIRST
            line as its baseline, which is what `lg:items-baseline` above wants.

            `lg:motion-safe:` AND NOT `motion-reduce:` TO UNDO IT. Gating the
            move ON motion-safe means the reduced-motion branch is the ABSENCE
            of a rule rather than a second rule that has to win a cascade
            argument against the first. Tailwind emits both variants as media
            queries at equal specificity, so "which one wins" would depend on
            the order the compiler happens to sort them in — a thing that is
            true today and unverifiable next quarter. §I of the design brief
            asks for this shift to be dropped entirely under the preference,
            and here it is dropped by never being written. It also means the
            containing-block hazard above cannot fire at all for a visitor who
            asked for less motion, because no `translate` is ever declared.

            `transition-transform` COVERS IT, and that needs saying because it
            looks wrong: Tailwind v4's `translate-x-*` sets the `translate`
            property, NOT `transform`, so transitioning `transform` alone would
            animate nothing. v4's `transition-transform` expands to
            `transform, translate, scale, rotate`, which is why it is correct
            here. Verified against the emitted stylesheet, not assumed.

            `duration-350` and `ease-in-out` EQUAL `DURATION.ui` (0.35s) and
            `EASE.ui` (`cubic-bezier(0.4, 0, 0.2, 1)`) NUMERICALLY, and are not
            references to them. `lib/animation/easing.ts` is data for GSAP and
            Framer; a CSS transition cannot read it. Retuning easing.ts will not
            move these — `ProjectCard` carries the same warning about its
            `duration-200`.
          */}
          <h2 className="text-h4 text-fg lg:text-h3">
            {/*
              THE STRETCHED-LINK PATTERN, exactly as `ProjectCard` ships it:
              the anchor wraps the title text only and throws
              `after:absolute after:inset-0` across the row, so the whole
              full-bleed strip is clickable while the accessible name stays the
              project's title rather than the title plus the cover's alt text.
              The cover keeps its real, authored `alt` because of this — a
              wrapper link around the whole row would have forced the choice
              between a ~200-character accessible name and an empty `alt`, and
              `content/types.ts` forbids the second outright.

              `focus-visible:outline-none` here is not a removed indicator. The
              operable region is the entire row, so the ring is drawn on the row
              instead (`has-[a:focus-visible]:` on the row wrapper), which is
              what keeps the indicator and the target the same object.

              RECORDED TRADE-OFF, inherited from `ProjectCard`: the overlay
              makes the row's text unselectable.
            */}
            <Link
              href={`/projects/${slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              <span className="block transition-transform duration-350 ease-in-out lg:motion-safe:group-hover:translate-x-sm lg:motion-safe:group-has-[a:focus-visible]:translate-x-sm">
                {title}
              </span>
            </Link>
          </h2>
        </div>

        {/*
          THE COVER SLOT, AND IT ALWAYS OCCUPIES ITS BOX. A slot that appeared
          on hover would reflow the row's title measure at 60fps — a layout
          animation, which is the one thing this site's motion rules forbid
          outright. At `lg`+ it is present and transparent; only `opacity` and
          `translate` change.

          `order-first lg:order-last` IS THE WHOLE MOBILE LAYOUT SWITCH. Below
          `lg` the cover leads the row and the text follows it (design §H.2);
          at `lg`+ the cover is the thing arriving at the far edge. DOM order is
          text-then-cover at both widths, so the title is announced first and
          the cover's alt second regardless of which side it is painted on.

          MOBILE DOES NOT HOVER AND DOES NOT TAP-TO-REVEAL. Below `lg` the
          cover is simply always visible at 96x60. Withholding the one piece of
          information that answers "which project is this" behind a tap
          withholds it permanently from anyone who taps once and navigates, and
          a tap-to-reveal-then-tap-to-open row is the classic hover-emulation
          failure. Ruled in design §H.2.

          THE SPLIT IS AT THE `lg` BREAKPOINT, NOT ON HOVER CAPABILITY, AND
          THAT IS DELIBERATE. A `useHoverCapable()` split would render one
          branch on the server and swap it on hydration — here that is a
          visible flash of a cover that then disappears. `pointer-coarse:` was
          the other candidate and is refused for Rule S-5's reason: a
          breakpoint-scoped rule that "should" apply and visibly does not is a
          silent failure. Accepted cost, stated rather than discovered: a
          finger-only tablet at >=1024 landscape sees a row with no cover. It is
          still numeral + name + a full-width tap target.

          UNDER `prefers-reduced-motion` THE COVER STILL APPEARS. It is
          information, not decoration — `link-preview.tsx`'s precedent — so the
          opacity fade is kept at the same 0.35s and only the 21px entrance
          travel is dropped, by the same `motion-safe:` construction as the
          title above.

          `transition-[opacity,translate]`, NOT `[opacity,transform]`. See the
          `<h2>` above: in Tailwind v4 the moved property is `translate`.

          ─────────────────────────────────────────────────────────────────
          `pointer-events-none` IS A BUG FIX AND IS LOAD-BEARING. DO NOT DROP IT.
          ─────────────────────────────────────────────────────────────────
          Without it, A CLICK ON THE COVER DOES NOT NAVIGATE — at `lg`+, in the
          exact moment this design is built around: hover the row, watch the
          cover fade in, click it, nothing happens.

          THE MECHANISM, because it is not obvious and it defeated one review
          pass already. `fill` on the `<Image>` forces `position: relative` on
          this wrapper, which makes it a POSITIONED box with `z-index: auto`.
          The row's stretched link is `after:inset-0` on the `<a>` — also
          positioned, also `z-index: auto` — and it lives inside the FIRST flex
          child. Among positioned `z-index: auto` boxes in one stacking context
          the later one paints on top, and at `lg`+ this wrapper is later in
          both document order AND order-modified order (`lg:order-last`). So the
          cover painted above the link and took the hit test.

          `lg:opacity-0` DOES NOT SAVE IT. Opacity zero still hit-tests, so the
          dead region existed at rest too, before anything was visible.

          WHY THE `<h2>` CONTAINING-BLOCK FIX ABOVE DID NOT COVER THIS. That fix
          reasons about ANCESTORS of the stretched link. This is a SIBLING
          SUBTREE painting over it — a different failure with the same symptom,
          and the same invisibility to `tsc`, ESLint, `next build`, HTML
          readback and every screenshot.

          `ProjectCard.tsx` IS NOT A PRECEDENT HERE, despite shipping the same
          stretched-link device: its cover wrapper is `position: static`, so it
          paints below the pseudo-element. `fill` is what changed the situation,
          and `fill` is new to this row.

          `pointer-events-none` RATHER THAN `after:z-10` on the anchor. Both
          work — the anchor is not a stacking context — but this one states the
          intent (the image is decoration, it is never interactive) and does not
          touch paint order, so it cannot be undone by a future z-index.
        */}
        <div className="pointer-events-none relative order-first h-[60px] w-[96px] shrink-0 transition-[opacity,translate] duration-350 ease-in-out lg:order-last lg:h-[125px] lg:w-[200px] lg:opacity-0 lg:group-hover:opacity-100 lg:group-has-[a:focus-visible]:opacity-100 lg:motion-safe:translate-x-md lg:motion-safe:group-hover:translate-x-0 lg:motion-safe:group-has-[a:focus-visible]:translate-x-0">
          {/*
            `fill` PLUS A FIXED BOX, not intrinsic sizing. The five covers run
            1.967 to 2.671 in aspect and this slot is a constant 1.6, so the
            image has to be told to fill a box the layout owns rather than the
            other way round.

            `object-contain`, NOT `object-cover`, AND THIS OVERRULES THE DESIGN
            BRIEF. Decided 2026-08-25 while Saad was asleep, under the spec's
            standing authorisation; recorded here and in the spec so it can be
            reversed in one word if he disagrees.

            THE CONFLICT. Design §F.2 specified `object-cover object-top`,
            following `link-preview.tsx`, which crops to exactly this box and
            records why ("cropping to a constant box keeps every preview the
            same object"). The brief justified extending that here on the
            grounds that `content/projects.ts`'s "DO NOT CROP" governs the cover
            at CARD and DETAIL scale, which is where it is looked at.

            WHY THE OTHER READING WINS. Go and read the source instruction:
            `content/projects.ts` says "DO NOT CROP, and do not swap in a
            simplified diagram." It carries no scale qualifier. `ProjectCard`
            restates it as "`object-cover` is forbidden outright — content
            /projects.ts says 'DO NOT CROP' of the CCN topology, which is
            CONTENT AUTHORITY, NOT TASTE." Narrowing an unqualified content
            instruction to "card and detail scale" is a reinterpretation of
            content, and that is not the design brief's to make. When a design
            ruling and a content ruling disagree in this repo, content wins —
            that is what "content authority, not taste" means.

            AND THE MEASUREMENT AGREES. CCN's cover is 1600x599. Cropped to this
            slot's 1.6 it keeps the middle 200/334 of its width and discards
            ~40% of a multi-floor topology whose entire subject is HOW MANY
            FLOORS THERE ARE. That is not a cosmetic loss; it is the thumbnail
            misrepresenting what the project is, on the page whose job is to let
            someone choose which project to open.

            THE COST, STATED. `object-contain` letterboxes: each cover renders
            at its own aspect inside a constant box, so the five thumbnails no
            longer share one silhouette. That is the property `link-preview.tsx`
            bought with its crop, and it is genuinely given up here. The box
            still reserves constant space, so nothing reflows.

            THIS CHANGES ONLY THIS SLOT. The card and the detail page are
            untouched — they already show the cover uncropped and were never in
            conflict.

            `sizes` IS CORRECT UNDER `object-contain` ONLY BECAUSE EVERY COVER
            IS WIDER THAN THIS BOX'S 1.6 ASPECT (they run 1.967-2.671), so the
            rendered width is the box width in both bands. A future cover TALLER
            than 1.6 would letterbox left-and-right instead, render narrower
            than the box, and make this string over-declare.

            `sizes` MIRRORS THE TWO SLOT WIDTHS AND NOTHING ELSE. There is no
            fluid branch to encode because neither box is fluid; if either
            number changes, this string changes in the same commit or the page
            silently ships the wrong candidate.

            `quality={85}` uniformly, never per image — `ProjectCard`'s stated
            rule for the same five sources, all of which are UI screenshots
            where sharp text on flat fields is the worst case for lossy
            encoding.

            NO `priority`, deliberately, even though the first row or two are
            above the fold: five covers competing for the connection on a
            navigational index is worse than five covers arriving a beat late,
            and `placeholder="blur"` is what makes that beat legible as loading
            rather than as a broken row.
          */}
          {/*
            `style={{ objectFit: "contain" }}` AND NOT ONLY THE CLASS, AND THE
            REASON IS INSIDE `next/image` RATHER THAN IN CSS.

            `next@16.3.1`'s `get-img-props` reads `objectFit` from the PROP or
            from `style` — never from `className`. With both absent it is
            `undefined`, and `undefined` is a member of that module's
            `INVALID_BACKGROUND_SIZE_VALUES`, so the blur placeholder falls
            through to `background-size: cover` and `getImageBlurSvg` is handed
            `objectFit: undefined` too.

            THE VISIBLE RESULT WAS A POP. While loading, the blurred plate
            covered the whole 200x125 box, CROPPED; on load the sharp image
            snapped to its letterboxed size. For CCN (1600x599) that is a
            125px-tall blur collapsing to a 75px image — five times over on a
            lazily-loaded page whose comment below says the blur exists to make
            loading legible AS loading. Setting it in `style` feeds both the
            background sizing and the SVG's `preserveAspectRatio`, so the plate
            letterboxes with the image.

            THE CLASS STAYS TOO. It is what actually fits the loaded image, it
            is what a reader greps for, and the two cannot disagree.
          */}
          <Image
            src={coverImage.src}
            alt={coverImage.alt}
            fill
            sizes="(min-width: 1024px) 200px, 96px"
            placeholder="blur"
            quality={85}
            className="object-contain"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    </li>
  );
}

export default ProjectStripRow;
