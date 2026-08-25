import Link from "next/link";

import { STANDALONE_NAV } from "@/components/ui/standaloneNav";

import {
  BREADCRUMB_ROOT_LABEL,
  BREADCRUMB_SEPARATOR,
} from "./projectDetailContent";

/**
 * The standalone detail page's breadcrumb — spec §4, design brief §F.4.
 * A SERVER COMPONENT, and it must stay one: it renders inside
 * `ProjectDetailFrame`'s top row, and that file's header records why nothing
 * on that path may drag `<ProjectDetail>` into the client bundle.
 *
 * ------------------------------------------------------------------------
 * IT IS SEEN BY EXACTLY ONE VISITOR: THE COLD ARRIVAL.
 * ------------------------------------------------------------------------
 * Every in-app click on a project is intercepted by
 * `app/(site)/@modal/(.)projects/[slug]/page.tsx` and opens `ProjectOverlay`,
 * whose exit is `router.back()`. So this component never renders for someone
 * mid-session. It renders on a hard load and on a shared link — a recruiter
 * opening a URL out of an email, with no history to go back to and no navbar
 * on this route. That is the whole design constraint: the control has to say
 * WHERE THIS PAGE IS and offer a real destination, not an action.
 *
 * WHICH IS WHY IT IS NOT ALSO RENDERED IN THE OVERLAY. The overlay visitor
 * knows exactly where they are — they can see the page they came from behind
 * the dialog — and `router.back()` returns them to it. A breadcrumb there
 * would be a second, weaker exit next to a working one.
 *
 * ------------------------------------------------------------------------
 * THE CURRENT SEGMENT IS PLAIN TEXT. THIS IS A RULING, NOT AN OVERSIGHT.
 * ------------------------------------------------------------------------
 * Spec §4 originally said "both segments clickable". Saad overrode it on
 * 2026-08-25 (spec, "Small defaults — all four approved", item 4): a link to
 * the page you are already on is a dead control and a tab stop that does
 * nothing. Do NOT "complete" the breadcrumb by wrapping `title` in a `<Link>`.
 * `aria-current="page"` on the span is what states the relationship instead —
 * the same device the design brief's index rail uses for its active entry.
 *
 * ------------------------------------------------------------------------
 * INLINE TEXT FLOW, NOT `flex flex-wrap`. THE ROW'S GEOMETRY DEPENDS ON IT.
 * ------------------------------------------------------------------------
 * The design brief specified `flex flex-wrap items-center gap-x-xs` here and
 * `min-h-[34px]` — two 16.8px line boxes — on the frame's top row. THOSE TWO
 * WERE INCOMPATIBLE, and the arithmetic is why this is inline instead.
 *
 * THE `min-h` WAS REMOVED ON 2026-08-25 (Saad's call — see
 * `ProjectDetailFrame.tsx`, which records the measurement and the ruling), AND
 * THIS BLOCK'S CONCLUSION SURVIVES IT WHILE ITS STAKES CHANGE. Inline flow is
 * still right, but it is no longer protecting a reserved height — it is now
 * what keeps the route's own residual offset at ONE line box instead of two.
 * Read the two bullets below with that substitution: where they say
 * "`min-h-[34px]` would not reserve it", read "the route would fall a further
 * 16.8px behind the overlay".
 *
 * `text-caption` is 12px JetBrains Mono with 0.08em tracking: 12 × 0.6 + 0.96
 * = 8.16px per character, 16.8px per line box (12 × 1.4).
 *
 *   - As FLEX ITEMS, the longest title ("Multi-Floor Call Center Network
 *     Design", 38 chars ≈ 310px) exceeds the space left on line 1 by
 *     "Projects" + "/" and is pushed onto a flex line of its own, where it
 *     wraps internally into two more line boxes. THREE line boxes, 50.4px.
 *     That is 16.8px MORE than the two-box case below, so the route would sit
 *     33.6px under the overlay instead of 16.8px — double the residual the
 *     ruling accepted.
 *   - As ONE INLINE RUN, the whole string ("Projects / Multi-Floor Call Center
 *     Network Design", 48 chars ≈ 392px) breaks at ordinary word boundaries
 *     and fills each line. At 360px the frame's content box is 318px; less the
 *     theme toggle's "Light" (40.8px) and `gap-sm` (13px) that leaves 264px,
 *     and the greedy break is "Projects / Multi-Floor Call" (220px) then
 *     "Center Network Design" (171px). TWO line boxes, 33.6px — one box more
 *     than the overlay's single `Close`, which is the 16.8px residual that was
 *     measured, costed and accepted.
 *
 * A single space between segments is 8.16px in this font — within a rounding
 * error of the `gap-x-xs` (8px) the brief asked for, so the spacing is the
 * brief's without needing the flex container that broke its own number.
 *
 * MEASURED SLACK, so the next person knows how much room this has: at 360px
 * the second line finishes 93px short of the wrap point, and at 320px it
 * finishes 53px short. The ceiling is ~48 characters of title at 360px;
 * today's longest is 38.
 *
 * THAT CEILING IS NOW LOAD-BEARING RATHER THAN A COURTESY. While the frame
 * reserved 34px, a third line box would have overflowed a reservation and been
 * caught by anyone measuring. With no reservation it simply grows the accepted
 * residual from 16.8px to 33.6px, silently, on a page nobody re-measures after
 * adding a project. CHECK THIS NUMBER WHEN ADDING A PROJECT WHOSE TITLE RUNS
 * PAST ~48 CHARACTERS.
 */

/**
 * `/projects`, ALWAYS, AND NEVER `/work`.
 *
 * The page's other exit — `BACK_HREF` in `app/(site)/projects/[slug]/page.tsx`
 * — is `/work`, and the two being different destinations is the point rather
 * than an inconsistency. Saad ruled on 2026-08-25 that the standalone Close
 * goes to `/work` "specifically (over `/projects`) to keep it distinct from the
 * breadcrumb". Point this at `/work` and the page grows two controls that do
 * the same thing.
 *
 * It is a plain string rather than a helper because it is a fixed route, the
 * same way `BACK_HREF` is. There is no route-constants module on this site and
 * this is not the file that should invent one.
 */
const PROJECTS_HREF = "/projects";

/**
 * A 44px TOUCH TARGET THAT COSTS ZERO LAYOUT HEIGHT.
 *
 * A 12px mono word is a 16.8px line box, which is the smallest tap target on
 * the site and less than half of the 44px §6 requires. The obvious fix —
 * `min-h-[44px] inline-flex items-center`, which the design brief itself
 * proposed — makes the link an atomic 44px inline-level box, which forces the
 * frame's top row to 44px on the route while the overlay's stays at its
 * natural 16.8px. That is a 27px Rule S-3 offset introduced BY the
 * accessibility fix, and it survives the `min-h` removal unchanged: an
 * out-of-flow target costs no height on either path, which is the whole point.
 * (This paragraph read "while the overlay's stays 34px" until 2026-08-25, when
 * the frame's reserved height was removed; the mechanism is identical, only
 * the number it is measured against moved.)
 *
 * So the target is an absolutely-positioned `::after` instead. It is outside
 * flow, so it changes no height on either path, and hit-testing on a
 * pseudo-element resolves to its originating element — the same stretched-link
 * device `ProjectCard` already ships (`after:absolute after:inset-0`), one
 * dimension smaller.
 *
 * IT EXTENDS UPWARD ONLY, and that is deliberate. The box runs from 28px above
 * the word down through it — 28px of the frame's `pt-xl` (55px) of empty space,
 * where nothing is interactive and there is no navbar on this route. A
 * symmetric ±14px target would look tidier and would be wrong: below 482px the
 * breadcrumb wraps, and the project's own name — plain text, not a link — sits
 * directly under "Projects". A downward extension would put an invisible link
 * over it, so a tap on the project's own name would navigate away. An
 * asymmetric target that never lies beats a centred one that sometimes does.
 *
 * THE HEIGHT IS DECLARED (`h-[44px]`), NOT INFERRED FROM `bottom-0`, and that
 * is a correction to the obvious version. An absolutely-positioned child of an
 * INLINE element takes that inline's fragment box as its containing block, and
 * an inline box's height is the font's own content area — ascender + descender
 * — NOT the 16.8px line box `line-height` produces. JetBrains Mono's hhea
 * metrics are 1020/−300 per 1000 em, so at 12px that box is 15.84px, and
 * `-top-[28px] bottom-0` would have measured 43.84px: a 44px target that misses
 * by 0.16px, on a number that moves if the font ever changes. Stating 44px
 * outright makes it exact and font-independent; the word still sits inside it,
 * because 28 + 15.84 = 43.84 ≤ 44.
 *
 * NO FOCUS-RING CHANGE. `STANDALONE_NAV`'s `focus-visible:outline` still hugs
 * the 16.8px text box, so the visible indicator matches the visible control
 * rather than a 45px invisible slab — WCAG 2.4.11's point. This is the reason
 * to prefer `::after` over vertical padding, which would have dragged the
 * outline out with it.
 */
const TAP_TARGET_44 =
  "relative after:absolute after:inset-x-0 after:-top-[28px] after:h-[44px]";

export type ProjectBreadcrumbProps = {
  /** The project's own title, straight from `content/projects.ts`. */
  title: string;
};

export function ProjectBreadcrumb({ title }: ProjectBreadcrumbProps) {
  return (
    /*
      `aria-label="Breadcrumb"` is a LANDMARK NAME, not visible copy, which is
      why it is inline here rather than in `projectDetailContent.ts` — the same
      call `Navbar.tsx` makes with `aria-label="Sections"`. It is also the only
      navigation landmark on this route: `/projects/<slug>` sits outside
      `(chrome)` and gets no navbar, deliberately.

      NO `<ol>`/`<li>`. The ARIA breadcrumb pattern's list markup would need
      `display: inline` on both to keep the single text run this row's height
      depends on, and `display` other than `list-item` is exactly what drops
      list semantics in some screen readers — the markup would cost the
      geometry and then not deliver the semantics it was for. Two segments, a
      named landmark and `aria-current` carry it without the list.

      `text-fg/70` on the wrapper inks the separator and the current segment;
      the link overrides it with `accent-working` out of `STANDALONE_NAV`.
      /70 is the site's caption-secondary floor and holds ~8.9:1 in dark and
      ~7:1 in light — the /70 ban recorded on `STANDALONE_NAV` applies to
      `accent-working`, not to `fg`.
    */
    <nav aria-label="Breadcrumb" className="text-caption font-mono text-fg/70">
      <Link
        href={PROJECTS_HREF}
        className={`${STANDALONE_NAV} ${TAP_TARGET_44}`}
      >
        {BREADCRUMB_ROOT_LABEL}
      </Link>{" "}
      <span aria-hidden="true">{BREADCRUMB_SEPARATOR}</span>{" "}
      {/*
        `aria-current="page"` on a non-interactive span is valid — the
        attribute is global — and it is what replaces the link this segment
        deliberately is not.
      */}
      <span aria-current="page">{title}</span>
    </nav>
  );
}

export default ProjectBreadcrumb;
