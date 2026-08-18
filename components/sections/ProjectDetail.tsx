import Image from "next/image";
import type { StaticImageData } from "next/image";

import { Reveal } from "@/components/ui/Reveal";
import type { Project } from "@/content/types";
import { formatMonthYear } from "@/lib/formatMonthYear";

import {
  GITHUB_LINK_LABEL,
  LINKS_LABEL,
  LIVE_LINK_LABEL,
  NEW_TAB_NOTE,
  SCREENSHOTS_LABEL,
  STACK_LABEL,
} from "./projectDetailContent";

/**
 * One project detail page body — Ticket 7, Tier 3.
 *
 * DELIBERATELY A SERVER COMPONENT. There is no "use client" here and there
 * must not be one: `Reveal` is the only client boundary on this page, exactly
 * as in `About`, `Skills` and `Projects`. That keeps the longest strings on
 * the site (SNA's ~1,400-character description) out of the client bundle, and
 * it is why this file imports nothing from `motion/react`. If `motion` ever
 * appears in this file, something has gone wrong.
 *
 * TAKES THE WHOLE `Project`, not a `Pick<>`. This deliberately differs from
 * `ProjectCard`, which takes five fields so `description` never crosses the
 * client boundary — there is no client boundary here, this page renders nearly
 * every field, and the 6/6b contract line in `docs/04_FEATURE_TICKETS.md`
 * literally names `project={...}`.
 *
 * IT OWNS THE SITE CONTAINER AND NOTHING OUTSIDE IT. No background, no
 * external margin, no `<main>`, no back link. Two reasons, both load-bearing:
 *   1. For Ticket 6b's morph to be continuous, the cover must land at the same
 *      rect inside an overlay as it does on the page — so the spine and its
 *      insets travel with this component, not with the route.
 *   2. `<main>` and the back affordance live in the route file, so 6b can
 *      render this inside a dialog without nesting a second `<main>` and
 *      without a "back to work" link in a context that closes rather than
 *      navigates.
 *
 * DELIBERATELY NOT RENDERED (each with a stated reason, ticket-7-plan.md 1.5):
 * `oneLiner` — G2 removed the deck; FOLIO's one-liner and the opening of its
 * description are near-verbatim, and printing both back to back reads as an
 * editing mistake on the one page whose credibility the tier curve exists to
 * protect. It still supplies the route file's meta description. `category` —
 * four of five projects share `systems-foundation`, so it carries almost no
 * signal, and rendering a human label for it would couple this file to
 * `content/skills.ts` for a string that says nothing. `slug` — URL identity,
 * not display copy.
 *
 * TIER 3 MOTION BUDGET, IN FULL: the shared `Reveal`, unchanged, at `delay: 0`
 * everywhere. No hover state anywhere on this page — not on the images, not on
 * the frames, not on the links. No parallax, no scroll-linked value, no
 * stagger, no GSAP, no R3F. `accent-hero` appears nowhere and mechanically
 * cannot: it is registered outside Tailwind's `--color-*` namespace on purpose.
 * On this page teal means "activate this", and nothing else is teal.
 *
 * NO `layoutId` ANYWHERE IN THIS FILE, not even an inert one. The shared-
 * element morph is Ticket 6b. An unmatched `layoutId` is not free — it still
 * enrols the element in Framer's layout-projection tree and measures it on
 * mount. Same rule `ProjectCard` states at its own cover wrapper.
 */

/**
 * The two content widths, and nothing else. A third would be a new visual rule.
 *
 * 57rem (912px) is the image width, and the `<h1>` takes it too so the title's
 * right edge lands on the cover's — cover and title then read as one captioned
 * object. 34rem (544px) is the reading measure, identical to About and Skills.
 * The step from 912 to 544 at the description is where the page changes gear
 * from identity into reading; that transition is doing work, so do not smooth
 * it out by widening the description or narrowing the `<h1>`.
 */
const IMAGE_WIDTH_CAP = "57rem";

/**
 * THIS STRING ENCODES THE CONTAINER INSETS AND THE 57rem CAP above.
 *
 * Below 640px the inset is 21x2 -> `100vw - 42px`, always under the cap.
 * 640-1023px the inset is 55x2 -> `100vw - 110px`, which reaches 912 only at
 * 1022px. At >=1024px the inset is 89x2 and the cap binds from a 1090px
 * NOTE the unit mismatch: the cap above is `57rem` while this string says a
 * literal `912px`. They agree only at a 16px root. A user with a 20px default
 * font size gets a 1140px image cap against a 912px `sizes` hint, which flips
 * the safe over-declaration below into an UNDER-declaration and ships them a
 * soft image. Inherited from `max-w-[57rem]` everywhere else on the site (the
 * Projects grid, the `<h1>`), not introduced here — fix it site-wide or not at
 * all, but do not assume the "over-declares" claim below holds at every root
 * size.
 *
 * viewport, so the flat `912px` over-declares by at most 7.8% between 1024 and
 * 1090. Over-declaring is the safe direction (fetch a slightly larger
 * candidate); under-declaring ships a blurry image. Same trade Ticket 6 made.
 *
 * Change either inset or the cap without changing this line and the build
 * stays green, the page renders perfectly, and the route silently downloads
 * roughly twice the image bytes. Same commit, always.
 */
const IMAGE_SIZES =
  "(min-width: 1024px) 912px, (min-width: 640px) calc(100vw - 110px), calc(100vw - 42px)";

/**
 * The image frame. `border border-fg/25` — NEUTRAL, not accent.
 *
 * WHY A BORDER AT ALL: an unframed screenshot bleeds edgelessly into
 * `bg-base`, and it fails in BOTH themes on DIFFERENT projects — ClashChat's
 * dark home screen, ClashChat's cover and both Aero-Grid shots dissolve in
 * dark mode; the CCN Packet Tracer canvas and SNA's Server Manager dashboard
 * dissolve in light mode. A bordered image asserts "this is the artefact",
 * where an unbordered soft one reads as a rendering failure.
 *
 * WHY NOT `border-accent-working/30`, which is the site's one other border:
 *   1. It is byte-identical to the project card's border, and recognition is
 *      not scoped to the current viewport — the user was looking at five of
 *      exactly that teal hairline rectangle a moment ago. Worse, Ticket 6b
 *      MORPHS one of those cards into this cover; identical borders would read
 *      as "the card grew" rather than "the card opened into a page".
 *   2. It dilutes the one job the accent has here. On this page
 *      `accent-working` is on the two back links, the external links and the
 *      focus rings — nowhere else — which makes the rule stateable in one
 *      sentence. A teal frame around a non-interactive image is the one thing
 *      that breaks it. The gallery card gets away with a teal border because
 *      the entire card IS a link; this frame is not.
 *
 * MEASURED, blended against `bg-base`: 1.99:1 dark, 1.73:1 light. For
 * reference `ProjectCard` measured its own `/30` teal at 1.79:1 dark and
 * called it "an edge you see without being able to name the colour".
 *
 * NOT AN OPACITY-FLOOR VIOLATION. The `/70` floor in `docs/03_FRONTEND_SPEC.md`
 * governs TEXT tokens (`text-fg/NN`) against WCAG 1.4.3. This is a decorative
 * non-text border — the same exemption the card's `/30` already relies on.
 * Stated here so a later grep-based review does not flag it.
 *
 * LIGHT MODE IS UNVERIFIED. These ratios are computed from the shipped hexes,
 * not observed on screen; the two images that decide it are the CCN and SNA
 * covers, the only light-field images in the set. Ticket 11 judges it. The
 * escalation path, in order, is: /25 -> /30 if the light-field covers still
 * bleed; /25 -> /20 if the frame reads drawn in dark mode; NOT a switch to
 * `accent-working` at any opacity; NOT a `bg-elevated` mat or inner padding (a
 * mat is more card-like, not less, and it would spend Ticket 6's card surface
 * on a page with no cards).
 *
 * The frame is NOT interactive: no hover border, no cursor, no transition, no
 * title attribute. It changes state for nothing. No radius, because no radius
 * token exists. No `overflow-hidden` — there is no transform on this page, and
 * `box-sizing: border-box` plus `w-full` on the image already keeps the image
 * inside the border box.
 */
const IMAGE_FRAME = "border border-fg/25";

/**
 * Caps an image at 57rem AND at its own intrinsic width, in one declaration.
 *
 * WHY THE INTRINSIC CAP: SNA's cover is 779px, the smallest source in the set
 * and not recapturable. Without this it renders at 912 CSS px — upscaled and
 * visibly soft, on the newest project and the one nearest Saad's stated career
 * direction. Every other image here is >=1600px, so only SNA is affected, and
 * the accepted consequence is that its cover is narrower than the other four
 * above ~1090px. Nobody sees two detail pages at once.
 *
 * This is NOT a hand-copied dimension. `src.width` is the same build-time
 * value `next/image` itself uses, carried by the static import's
 * `StaticImageData` — which is exactly the distinction the "no hand-copied
 * width/height" rule draws. There is still no `width`/`height` prop on any
 * `<Image>` below.
 *
 * WHY `min()` RATHER THAN A `max-w-[57rem]` CLASS PLUS `style={{ maxWidth:
 * src.width }}`: an inline style beats a class, so the plain-style form would
 * SILENTLY DISCARD the 57rem cap on the four images wider than it and let them
 * render at the full container width (1262px at a 1440 viewport). That would
 * break both the "exactly two right edges" rule and the shared `<h1>`/cover
 * right edge. Composing both caps into one CSS `min()` is the only form where
 * both bind. The 57rem term is `IMAGE_WIDTH_CAP` so it stays a single source
 * of truth with the `<h1>` and the screenshots block.
 *
 * CORRECTION (review, 2026-08-19): THAT LAST SENTENCE IS FALSE AND THE REAL
 * COUNT IS FOUR. Tailwind needs a literal, so a runtime constant cannot reach
 * a class. The 912px cap is encoded at:
 *   1. `IMAGE_WIDTH_CAP` here            (covers + screenshot figures)
 *   2. `max-w-[57rem]` on the `<h1>`     (the shared right edge, ~line 272)
 *   3. `max-w-[57rem]` on the Screenshots wrapper (~line 387)
 *   4. the literal `912px` inside `IMAGE_SIZES` above
 * CHANGE ONE, CHANGE ALL FOUR, IN THE SAME COMMIT. Editing only this constant
 * moves the images and strands the `<h1>` and the figures behind them: the page
 * grows a third right edge, the `<h1>`/cover shared edge that section 4.1 calls
 * compositional breaks on four of five pages, and tsc/lint/build all stay
 * green. Nobody sees it without measuring.
 */
function imageWidthCap(src: StaticImageData) {
  return { maxWidth: `min(${IMAGE_WIDTH_CAP}, ${src.width}px)` };
}

/** Block label atom — an `<h2>` by document structure, a mono caption by
 *  register. Identical to About's and Skills' `<h3>`: heading LEVEL follows the
 *  outline, heading LOOK does not follow the level. */
const BLOCK_LABEL = "text-caption font-mono text-fg/70";

/** Label -> its content. 13px, stepping to 21px at lg. Byte-identical to
 *  Skills. */
const LABEL_GAP = "mt-sm lg:mt-md";

/** Explicit, on every focusable element on the page. Matches the site's
 *  shipped treatment. */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-working";

/**
 * External links: accent + underline, never a button.
 *
 * The underline is not decoration — colour alone must not be a link's only
 * signal. Ghost buttons were rejected: the page already carries bordered image
 * frames, two more outlined rectangles is a lot of chrome for Tier 3, and a
 * button implies an in-page action rather than leaving the site.
 *
 * NO HOVER STATE, and that is a contrast constraint rather than laziness: any
 * hover step that dims the teal needs a value below full `accent-working`, and
 * `accent-working` in light mode (#0f766e) is 5.34:1 on `bg-base` — at /70 it
 * falls to roughly 3.2:1 and fails AA outright. There is no safe second teal.
 * If hover feedback ever proves necessary the only permitted device is
 * `hover:decoration-2` (underline thickness): never a colour change, never a
 * background, never a transform.
 */
const EXTERNAL_LINK = `text-body text-accent-working underline underline-offset-4 ${FOCUS_RING}`;

export function ProjectDetail({ project }: { project: Project }) {
  /**
   * Paragraph mechanism, INERT TODAY BY DESIGN. Every description in
   * `content/projects.ts` is currently one paragraph, so this yields a
   * single-element array on all five projects. What it buys: the day Saad adds
   * a blank line to SNA's ~1,400-character slab, it becomes three paragraphs
   * with NO code change — which is the whole point of the content
   * architecture. No implementer may touch the string to make it happen sooner
   * (G3).
   *
   * Keyed by index deliberately: this array is derived from one immutable
   * string, is never reordered, filtered or appended to, and has no stable id
   * to key on. `ProjectCard`'s objection to long-string keys applies here too.
   */
  const paragraphs = project.description.split(/\n{2,}/);

  const { github, live } = project.links;

  return (
    // `aria-labelledby` points at the <h1> below, so the region is announced
    // as the project rather than as an unnamed "article" in a rotor. Every
    // other top-level region on the site names itself the same way
    // (Projects.tsx -> work-heading, Skills.tsx -> stack-heading).
    <article
      aria-labelledby="project-title"
      className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl"
    >
      {/*
        THE COVER WRAPPER CONTAINS ONLY THE <Image>. Nothing else may ever be
        added to it — no overlay, no gradient scrim, no title, no category
        badge, no caption, no back link, no "view project" panel. It is Ticket
        6b's morph DESTINATION and it needs a stable, meaningful rect; this is
        also where 6b's `layoutId` goes, and it is deliberately absent today.
        The border is a STYLE on this element, not a second child, so the
        one-child contract holds.

        IT IS DELIBERATELY NOT WRAPPED IN A <Reveal>, AND MUST NOT BE. Two
        independent reasons, both load-bearing:
          1. It is this page's LCP element, and `Reveal` writes `opacity: 0`
             into the SERVER-RENDERED HTML by design. Wrapping the cover would
             ship the page's largest paint invisible until hydration.
          2. It is 6b's morph target, which must not have an animating
             ancestor — that is work 6b would have to undo.
        This is the same reasoning that keeps `Reveal` out of the hero. The
        comment exists so a later "you missed one" pass does not add it.

        NO `priority` ANYWHERE ELSE ON THIS PAGE: the screenshots are below the
        fold and stay default-lazy.
      */}
      <div
        className={`block ${IMAGE_FRAME}`}
        style={imageWidthCap(project.coverImage.src)}
      >
        <Image
          src={project.coverImage.src}
          alt={project.coverImage.alt}
          sizes={IMAGE_SIZES}
          placeholder="blur"
          quality={85}
          priority
          className="block h-auto w-full"
        />
      </div>

      {/*
        Title block: `<h1>` + meta line, wrapped as ONE `Reveal` because they
        are one heading unit.

        `text-h2`, NOT `text-h1` — `docs/03_FRONTEND_SPEC.md` reserves that
        token for the hero headline, and `text-h2` is already the site's
        largest non-hero step (About, Skills and Projects all set their section
        heading there). Weight stays at the inherited 400, as in all three.
      */}
      <Reveal>
        <h1 id="project-title" className="mt-lg max-w-[57rem] text-h2 text-fg lg:mt-xl">
          {project.title}
        </h1>

        {/*
          21px to the meta line, flat at every breakpoint. Not arbitrary: it is
          precisely the step `ProjectCard` uses between its one-liner and its
          mono stack flow, for the same reason it names there — a register
          change, sans -> mono, needs a real gap. 13px would crowd `text-h2`'s
          descenders at 68px against a 12px caption; 34px would detach the
          metadata from the title it describes.

          `flex-wrap`, not a fixed baseline row: at 360px FOLIO's credit ("Team
          project with Uzair Ahmed — roughly equal contribution", 56 chars at
          12px mono with 0.08em tracking, ~425px) wraps to two lines.

          `formatMonthYear`, never `new Date()` and never `Intl` — that file
          documents both as verified bugs here: "YYYY-MM" parses as UTC
          midnight, so every viewer at a negative UTC offset would see the
          PREVIOUS month, and `Intl` disagrees across the server/client
          boundary. This page is that function's first caller.

          `/70` IS THE FLOOR AND IS WHAT SHIPS — 8.41:1 dark, 6.69:1 light. Do
          not dim this to /50 or /40 to create hierarchy against the title;
          `docs/03` records that exact defect being caught twice already, and
          light mode is the binding constraint, not dark.

          `credit` is written as a branch even though all five projects set one
          — `content/types.ts` marks it optional.
        */}
        <p className="mt-md flex max-w-[34rem] flex-wrap gap-x-md gap-y-2xs">
          <span className="text-caption font-mono text-fg/70">
            {formatMonthYear(project.date)}
          </span>
          {project.credit ? (
            <span className="text-caption font-mono text-fg/70">
              {project.credit}
            </span>
          ) : null}
        </p>
      </Reveal>

      {/*
        Blocks 3-6 in one stack: description -> Screenshots -> Built with ->
        Links.

        AN ABSENT BLOCK RENDERS `null` AT ITS OWN POSITION, never an empty
        wrapper. A `<div>` rendered around a `null` child still collects a
        `space-y` margin and produces exactly the ghost gap the acceptance
        criterion forbids. CCN and SNA must show no trace that a Screenshots or
        Links block exists on other pages.

        THE LADDER DOES NOT ADAPT TO LENGTH and must not be made to. No
        length-conditional spacing, no "if the page is short, grow the
        padding", no `min-h-screen`, no `flex-1` footer push. A page that is
        shorter because the project is smaller is accurate.
      */}
      <div className="mt-xl space-y-xl lg:mt-2xl lg:space-y-2xl">
        {/*
          Description — the page's body copy, and the only block with no label.
          The other three are reference material; a label above the body would
          be redundant.

          FULL OPACITY, never `/70`. It is primary content.

          `space-y-md` (21px) between paragraphs: at `text-body`'s 1.6
          line-height (25.6px), 13px is half a line — too little to read as a
          paragraph break in a 21-line block, which is exactly the case (SNA)
          the split exists for. 21px is ~0.8 of a line: a clear break that is
          not a gap. About uses 13px for short beat paragraphs; this is a
          different job at a different length.
        */}
        <Reveal className="max-w-[34rem] space-y-md">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-body text-fg">
              {paragraph}
            </p>
          ))}
        </Reveal>

        {/*
          Screenshots — 0, 1 or n, with NO hardcoded two-up before/after
          assumption. `screenshots` is an ABSENT KEY on CCN and SNA, not `[]`,
          so optional chaining is the correct test and `.length` also covers a
          future `[]`.

          THIS IS THE ONLY EXPRESSION ON THE PAGE ALLOWED TO READ
          `screenshots.length`. A layout whose column count depends on the
          count — `length === 2 ? ... : ...` — is the hardcoded-pair assumption
          the acceptance criterion forbids, wearing a disguise.

          SINGLE-COLUMN STACK OF FULL-WIDTH FIGURES. No grid, no two-up, no
          masonry, no carousel, no lightbox, no thumbnails-plus-hero. A
          two-column grid would put FOLIO's lone screenshot in a half-width
          orphan at ~439px — exactly gallery-card size, i.e. it would throw
          away the only thing clicking through bought.

          Each figure caps at the same 57rem as the cover, so cover and
          screenshots share one right edge and the page shows exactly two
          distinct right edges (912 images, 544 prose), never three.

          34px BETWEEN FIGURES, FLAT — no `lg:` step. Two screenshots of one
          project are a SET, not two exhibits: ClashChat's `home-dark` /
          `home-light` pair is the case that proves it. At 34px, with each
          figure carrying its own frame, they sit close enough to read as one
          comparison, and the 55/89px block gap above and below closes them off
          as a group. At 55px the inter-figure gap would equal the mobile block
          gap and the pairing would dissolve.

          NO SPECIAL CASE FOR THE DARK/LIGHT PAIR, by any means — not by
          filename, not by alt text, not by index parity. The type already
          ships the correct mechanism (`caption`); using it is a content edit to
          Saad's file, not a component change.
        */}
        {project.screenshots?.length ? (
          <div className="max-w-[57rem]">
            <h2 className={BLOCK_LABEL}>{SCREENSHOTS_LABEL}</h2>

            <div className={`${LABEL_GAP} space-y-lg`}>
              {project.screenshots.map((shot) => (
                /*
                  EACH FIGURE GETS ITS OWN `Reveal`, not one around the block.
                  Two stacked ~430px figures plus the gap is ~894px; at
                  `Reveal`'s hardcoded `amount: 0.1` a single wrapping reveal
                  fires when 90px is visible, so the second figure would finish
                  animating entirely below the fold and never be seen to
                  reveal. That is the exact failure `Projects.tsx` names.

                  THIS IS NOT A STAGGER. Every figure is `delay: 0` and fires
                  on its own intersection; on a desktop viewport both Aero-Grid
                  figures are usually in view at once and enter together. That
                  is correct and is not to be "fixed" with a cascade.

                  Keyed on the static import's `src` — stable, unique, and not a
                  100-character alt string.

                  `alt` comes from the data verbatim. It is CONTENT: never
                  regenerated, never emptied, and never promoted to a visible
                  caption when `caption` is missing (alt is written for a screen
                  reader and reads clumsily on screen).
                */
                <Reveal key={shot.src.src}>
                  <figure
                    className={IMAGE_FRAME}
                    style={imageWidthCap(shot.src)}
                  >
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      sizes={IMAGE_SIZES}
                      placeholder="blur"
                      quality={85}
                      className="block h-auto w-full"
                    />
                    {/*
                      Unexercised today: no project sets a caption (G4 shipped
                      the branch and added none). When one does exist it renders
                      BELOW its image in the site's meta register — never
                      overlaid, never in a tinted strip, never italic (no italic
                      register exists on this site).
                    */}
                    {shot.caption ? (
                      <figcaption className="mt-sm text-caption font-mono text-fg/70">
                        {shot.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}

        {/*
          Built with — the FULL stack, in file order, untruncated.
          `ProjectCard`'s `STACK_LIMIT = 4` is a card device; seeing all of it
          (up to Aero-Grid's 14) is part of what clicking through buys. No sort,
          no alphabetising — `content/types.ts` says order is meaningful.

          NOT CHIPS. There is no radius token by decision, so a chip here is a
          square box, and square boxes in a flow read as tag INPUTS that invite
          a click doing nothing. Same mono-flow atom `ProjectCard` and Skills
          already ship. A real `<ul>`, so a screen reader announces the count.

          21px column gap against JetBrains Mono's ~7.2px word space at 12px is
          a 2.9x contrast, so "Remote Desktop Services" and "WDS" cannot blur
          together.
        */}
        <Reveal className="max-w-[34rem]">
          <h2 className={BLOCK_LABEL}>{STACK_LABEL}</h2>
          <ul className={`${LABEL_GAP} flex flex-wrap gap-x-md gap-y-xs`}>
            {project.stack.map((entry) => (
              <li key={entry} className="text-caption font-mono text-fg">
                {entry}
              </li>
            ))}
          </ul>
        </Reveal>

        {/*
          Links — branch PER KEY, never on whether `links` exists. It is always
          present, as `{}` for CCN and SNA, which is why `content/projects.ts`
          says consumers branch on `links.github` / `links.live`.

          `GitHub` then `Live site`, fixed, on every project. It matches the
          object-literal order in the content file and it puts the durable link
          first — FOLIO's `live` is documented as a staging deployment liable to
          be torn down. A per-project link order would be worse than either
          fixed order.

          NO SEPARATOR GLYPH. `ProjectCard` establishes that this site separates
          with whitespace, not with pipes or bullets. `flex-wrap` so two links
          wrap cleanly at 360px.
        */}
        {github || live ? (
          <Reveal className="max-w-[34rem]">
            <h2 className={BLOCK_LABEL}>{LINKS_LABEL}</h2>
            <div className={`${LABEL_GAP} flex flex-wrap gap-x-md gap-y-sm`}>
              {github ? (
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK}
                >
                  {GITHUB_LINK_LABEL}
                  <span className="sr-only">{` ${NEW_TAB_NOTE}`}</span>
                </a>
              ) : null}
              {live ? (
                <a
                  href={live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK}
                >
                  {LIVE_LINK_LABEL}
                  <span className="sr-only">{` ${NEW_TAB_NOTE}`}</span>
                </a>
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </div>
    </article>
  );
}

export default ProjectDetail;
