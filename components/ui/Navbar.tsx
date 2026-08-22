"use client";

/**
 * The site navbar. Fixed, transparent, and adaptive.
 *
 * LAYOUT — three clusters, per the spec:
 *
 *   left    the settled "MS" mark + ISLAMABAD, PAKISTAN
 *   centre  ABOUT · [constellation] · WORK
 *   right   the email address as a copy control + the LinkedIn mark
 *
 * IT IS SITE CHROME NOW, NOT A HOMEPAGE COMPONENT. It is mounted by
 * `app/(site)/(chrome)/layout.tsx` and renders on `/`, `/about` and `/work` —
 * all three have shipped — but still never on `/projects/<slug>`. Two
 * consequences run through this file: the centre items are real links rather
 * than scroll calls, and the adaptive palette below can no longer assume there
 * is a hero on the page.
 *
 * THE CENTRE IS ABSOLUTELY CENTRED, not flex-centred, and that is a
 * requirement rather than a preference: the spec asks for the icon to be "in
 * the very center", and a `justify-between` middle cluster sits wherever the
 * left and right clusters leave room — which moves the moment the address
 * changes length or the location label wraps. The container is now FULL-WIDTH
 * with symmetric padding (it was `mx-auto` with a 1440px cap until Phase 0
 * removed both), so its centre IS the viewport centre and
 * `left-1/2 -translate-x-1/2` puts the icon on it exactly. Measured: 720.00 at
 * 1440, 1280.00 at 2560.
 *
 * THE CONCLUSION SURVIVED THE CAP REMOVAL, THE REASON DID NOT. Symmetric
 * padding centres the container either way — but this comment said `mx-auto`
 * was why, and after Phase 0 that was simply false. Recorded because a comment
 * whose conclusion is right and whose reason is wrong is the hardest kind to
 * catch: it reads as verified on every future pass.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LEGIBILITY — the spec's open item, answered.
 *
 * A transparent bar over varying content is the real problem it names, and it
 * has two distinct halves on this site:
 *
 *   1. COLOUR. The bar crosses three different grounds: the hero, which is
 *      `bg-hero-surface` and PINNED DARK in both themes; the mid-page sections
 *      on `bg-base`, which FLIPS (#0A0A0B dark, #FDFCFA light); and the reveal
 *      footer's plate, dark again. (Called "the Contact plate" here until
 *      2026-08-22; `globals.css`'s copy of this paragraph already said reveal
 *      footer.) One fixed colour cannot serve all of them — light
 *      text vanishes on #FDFCFA and dark text vanishes on the hero. So the bar
 *      swaps its palette when it leaves the hero, which is the "adaptive colour
 *      based on what is scrolling behind it" option the spec lists.
 *
 *      ON A PAGE WITH NO HERO — `/work` — there is nothing to swap out of, so
 *      the bar starts in the past-hero palette WITH THE SCRIM, from scroll
 *      position 0, and stays there. That is the CSS default (`globals.css`
 *      makes the hero case the override precisely so a heroless route gets the
 *      safe palette by not carrying an attribute), and the only work here is
 *      making sure the attribute is absent in the SERVER-RENDERED markup too.
 *      Removing it on mount instead would ship one frame of hero-palette bar
 *      over `bg-base` — in light mode that is near-white on warm-white.
 *
 *      Measured, not assumed — and RE-measured on 2026-08-22, because two of
 *      these were rounded in the optimistic direction. Over the hero: `hero-fg`
 *      at 72% composites to #A9ABAD, 8.65:1 on `hero-surface`; `hero-accent` is
 *      8.01:1. Past it: `fg` at 72% composites to #ADADAE, 8.83:1 on dark
 *      `base` — THIS LINE SAID "~9:1" — and to #565655, 7.17:1 on light —
 *      THIS LINE SAID "~8:1", which overstated it by 0.83. `accent-working` is
 *      7.95:1 dark / 5.34:1 light. Every one of those still clears AA for the
 *      12px mono the bar is set in, and the light-mode binding case, 7.17:1,
 *      clears AAA with 2.17 to spare — so nothing moves. The record was wrong,
 *      not the pixels, and a contrast figure nobody can reproduce is worse than
 *      no figure at all: the next reviewer either re-derives it or trusts it.
 *
 *   2. OVERLAP. Adaptive colour fixes contrast against the BACKGROUND. It does
 *      nothing about body text passing UNDERNEATH a fixed bar, and that turned
 *      out to be the real problem rather than the theoretical one: over the
 *      About section the centre cluster lands on a paragraph and both texts
 *      become unreadable. It was screenshotted, not predicted.
 *
 *      "PAST THE HERO" MEANS "NOT ON A DARK PLATE", and since Phase 5 that is
 *      two plates rather than one. The scrim is scoped to
 *      `:not([data-over-hero])`, and the palette effect below now sets that
 *      attribute over the reveal footer as well as over the hero — so the bar
 *      is transparent on both dark surfaces and scrimmed only over `bg-base`,
 *      which is the only ground it was ever needed on.
 *
 *      THE SCRIM, PAST THE HERO ONLY, NOW CARRIES THIS ALONE. That IS a
 *      background fill, and the spec asks for it to be flagged rather than
 *      added quietly, so it is flagged — here, in `globals.css` where the rule
 *      lives, and in `docs/06_INTRO_AND_CHROME.md` §6. OVER THE HERO THE BAR IS
 *      STILL COMPLETELY TRANSPARENT — no fill, no blur — which is where the
 *      transparency reads as design rather than as a bug, and where there is no
 *      running text for it to land on anyway.
 *
 *      THERE USED TO BE A SECOND MITIGATION AND IT HAS BEEN REMOVED: the bar
 *      hid on scroll-down and returned on scroll-up, so while you read downward
 *      there was nothing to overlap. `.claude/handoff/navbar-indicator-design.md`
 *      §2 deletes it, because an active-route indicator on a bar that retracts
 *      while you scroll is invisible exactly when it is doing its job. The
 *      scrim was always the mitigation that covered the hard case — revealed
 *      mid-page, over live text — so what is lost is the quieter reading
 *      experience past the hero, not the legibility fix.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE ACTIVE-ROUTE INDICATOR — a 2px line under whichever centre item is the
 * page you are on, sliding and resizing between the three.
 *
 * IT TRACKS THE ROUTE, NOT A SCROLL POSITION. A scrollspy has nothing to track
 * here: both nav items became routes in Phase 4, and Home's section ids are no
 * longer pointed at by anything in the bar. Because the centre icon is `/`,
 * EVERY PAGE THE BAR APPEARS ON HAS EXACTLY ONE ACTIVE ITEM — which is the
 * property that makes the indicator work at all. A two-item version would show
 * nothing on Home.
 *
 * A LINE, NOT A PILL. `globals.css` deliberately has no radius token, and this
 * is not the feature that earns one.
 *
 * IT IS `aria-hidden`. The real announcement is `aria-current="page"` on the
 * active link; the line is a visual echo of that, never a replacement. The two
 * cannot drift, because the measurement below finds its target BY that
 * attribute rather than by a parallel index.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * THE THEME TOGGLE IS IN THE BAR AT `md` AND UP; THE MOBILE MENU CARRIES IT
 * BELOW. It was removed from the desktop bar once, and
 * `docs/07_SITE_RESTRUCTURE.md` §1 reverses that: with the toggle only in the
 * mobile menu, a desktop visitor on the homepage could not switch themes at
 * all. It is the first child of the right cluster, before the email, so
 * LinkedIn keeps the hard-right anchor.
 *
 * IT CARRIES ITS OWN `hidden md:block`, and that is load-bearing rather than
 * stylistic — the right cluster has NO `md:` gate, each child gates itself.
 * `NavMobileMenu` already renders an instance, so a toggle dropped in here
 * without its own gate ships TWO controls doing the same job below `md`, and
 * neither errors. See `docs/06_INTRO_AND_CHROME.md` §5.
 *
 * `pointer-events-none` ON THE HEADER, `pointer-events-auto` ON THE CLUSTERS.
 * The bar spans the full viewport width and sits over the hero, whose glass
 * wordmark tilts on `pointermove` anywhere in the section. A solid
 * pointer-catching strip across the top would kill that in a band the visitor
 * cannot see, and nothing would error.
 */

import type { MouseEvent as ReactMouseEvent } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { MonogramMark } from "@/components/ui/MonogramMark";
import { NavMobileMenu } from "@/components/ui/NavMobileMenu";
import {
  ConstellationIcon,
  LinkedInIcon,
  MenuIcon,
} from "@/components/ui/NavIcons";
import {
  isActiveRoute,
  NAV_EMAIL,
  NAV_HOME_LABEL,
  NAV_HOME_ROUTE,
  NAV_ITEMS,
  NAV_LINKEDIN,
  NAV_LOCATION,
  NAV_MENU_OPEN_LABEL,
} from "@/components/ui/navContent";
import {
  THEME_TOGGLE_IN_NAV,
  ThemeToggle,
} from "@/components/ui/ThemeToggle";
import { NAV_HEIGHT_PX } from "@/components/ui/msMarkGeometry";
import { getHeroStage } from "@/components/hero/heroStage";
import { useIntroHandoff } from "@/components/intro/IntroContext";
import { REVEAL_FOOTER_SENTINEL_ID } from "@/components/sections/contactContent";
import { NAV_ENTRANCE_ATTR } from "@/lib/animation/handoff";
import { ScrollTrigger } from "@/lib/animation/gsap";
import { EASE } from "@/lib/animation/easing";
import { useSectionScroll } from "@/lib/hooks/useSectionScroll";

/**
 * THE BAR'S BOTTOM EDGE IS NOW MEASURED, NOT APPROXIMATED. There is no constant
 * here any more, and the constant that used to be is worth recording because
 * deleting it fixed a shipped, visible bug.
 *
 * It was `ALWAYS_VISIBLE_ABOVE = 140`, hide-on-scroll's "never hide above this"
 * threshold. That behaviour was deleted; the number survived because the
 * `overHero` palette effect below had borrowed `ALWAYS_VISIBLE_ABOVE / 2` = 70
 * as "the bar's bottom edge". Its own docblock said plainly that 70 ≠ 59 and
 * declined to rename it for that reason — correctly — and then left the
 * approximation in place, which is the part that cost.
 *
 * THE BAR IS NOT 59px. IT IS THREE HEIGHTS, measured on the shipped build:
 *
 *     < 640    48px   `py-sm` 13×2 + a 22px right cluster (the menu button)
 *     640–767  64px   `sm:py-md` 21×2 + the same 22px cluster
 *     >= 768   59px   `sm:py-md` 21×2 + a 17px cluster (the menu button is
 *                     gone at `md`; the text controls are a 17px line box)
 *
 * The centre cluster never contributes: it is `position: absolute` and out of
 * flow, so the row's height is the tallest IN-FLOW child. The old docblock had
 * this right for `>= 768` and generalised it to "at `sm` and up", which is
 * wrong by 5px across the whole 640–767 band.
 *
 * WHAT THE 22px GAP BETWEEN 48 AND 70 ACTUALLY DID, measured light mode,
 * 639×800, `/work` and `/` at MAXIMUM SCROLL — a resting state, not a
 * transient: the reveal footer's static top lands at 50.7px, which is BELOW the
 * 48px bar and ABOVE the 70px threshold. So the bar took the hero palette —
 * #E8EAEC ink — while sitting on #FDFCFA. Measured contrast 1.18:1 for the MS
 * mark and 1.12:1 for the menu button. The bar was invisible.
 *
 * INVISIBLE IN DARK MODE, WHICH IS WHY IT SHIPPED: the same state puts #E8EAEC
 * on #0A0A0B at 16.41:1 against the 16.53:1 it would have had on the plate. A
 * 0.12 difference nobody can see. That is the third defect on this project
 * computed in dark mode only.
 *
 * `getBoundingClientRect().bottom` ON THE HEADER IS EXACT AND SELF-MAINTAINING.
 * The header is `fixed inset-x-0 top-0`, so its bottom edge IS the bar's bottom
 * edge in viewport coordinates. Descendant transforms do not affect it —
 * verified, including the entrance animation on `[data-nav-entrance]`, which is
 * a child and cannot change the parent's border box. Both ScrollTrigger
 * `start`s below are FUNCTIONS so the value is re-resolved on every refresh,
 * which is what carries a resize across the 640 and 768 breakpoints where the
 * height genuinely changes.
 */

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * THE THIRD COPY OF THIS IDIOM IN THE CODEBASE — `NavMobileMenu.tsx` and
 * `ProjectOverlay.tsx` carry the other two, and both spell out the same reason
 * at length: React logs a warning for a layout effect during SSR because the
 * server cannot run one, and the ternary is the standard way to say "this is
 * client-only work" without a `typeof window` check inside the effect body.
 * It is duplicated rather than extracted because all three uses are chrome-
 * local and a shared hook would be a fourth file for eleven characters; if a
 * fourth site appears, extract it then.
 *
 * WHAT NEEDS IT HERE is the adaptive-palette effect, which must write
 * `data-over-hero` in the SAME frame as the route's DOM swap. Its docblock has
 * the measurements.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Set for the duration of ONE forced style recalc, around the write that
 * changes `data-over-hero`, so the bar's ink swaps palette in a single frame
 * instead of cross-fading over 300ms. `apply()` inside the effect below has
 * the measurements and the reasoning.
 *
 * IT IS SPELLED ONCE HERE AND MATCHED ONCE IN `app/globals.css`. There is no
 * import between a `.tsx` and a stylesheet, so this pair can only be kept in
 * step by hand — RENAME THIS AND THE SELECTOR MUST CHANGE IN THE SAME COMMIT.
 * The failure mode is silent: the attribute goes on and off with no rule
 * matching it, and the 300ms cross-fade and its sub-AA midpoint come back with
 * nothing logged. `grep -rn "palette-instant"` finds both sites.
 */
const PALETTE_INSTANT_ATTR = "data-palette-instant";

/* -------------------------------------------------------------------------
   The active-route indicator's numbers.
------------------------------------------------------------------------- */
/** Travel time for the line, in ms. Faster than the bar's `duration-300`
 *  `transition-colors`, deliberately: the line covers a much larger distance,
 *  and 300ms of travel over ~100px reads as lag rather than as motion. */
const INDICATOR_MS = 240;
/**
 * `EASE.ui` compiled to a CSS timing function, from the shared motion
 * vocabulary — "micro-interactions: hover, press, theme toggle. Near-symmetric
 * so it reads as responsive rather than decorative."
 *
 * BUILT FROM THE EXPORT, NOT RETYPED — the control points live in exactly one
 * place. It is applied as an INLINE STYLE rather than a Tailwind `ease-[...]`
 * class for the same reason: a class string interpolated from a constant is
 * invisible to Tailwind's source scanner, which does not error — it emits no
 * rule at all, and the line would silently fall back to the `ease` default.
 */
const INDICATOR_EASE = `cubic-bezier(${EASE.ui.join(", ")})`;

/** Shared by every interactive label in the bar. */
const NAV_ITEM =
  "pointer-events-auto cursor-pointer text-caption font-mono uppercase text-[var(--nav-fg-dim)] transition-colors duration-300 hover:text-[var(--nav-fg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nav-accent)]";

/**
 * The one route with a hero on it, and the centre icon's destination.
 *
 * IMPORTED, NOT DECLARED, SINCE 2026-08-22. It was a local `const "/"` here
 * while the bar was its only consumer; the mobile menu now renders a Home entry
 * too, and two literal `"/"`s in two files can drift into two destinations. The
 * local alias stays so the four readers below still read as prose — it is a
 * rename, not a second source.
 */
const HOME_ROUTE = NAV_HOME_ROUTE;

/**
 * An in-page target, or `null` if following the link is the right thing to do.
 *
 * `NAV_ITEMS` holds full hrefs — today `/about` and `/work`, BOTH REAL ROUTES
 * — so every entry works from every page the bar appears on. This comment said
 * "`/#trajectory` and `/work`"; ABOUT became a route in Phase 4, so no nav item
 * is an anchor any more and the interception below never fires today. IT STAYS:
 * any future `/#…` entry needs it, and a dormant branch is cheaper than
 * rediscovering why the offset matters. But an anchor into Home, clicked
 * WHILE ON HOME, must not be handed to the router: Next would scroll natively,
 * losing both Lenis and `NAV_SCROLL_OFFSET`, and the heading would land
 * underneath the bar that just took you to it. So that one case is intercepted
 * and everything else — every real route, and the same anchor clicked from
 * `/work` — is left alone.
 */
const inPageTarget = (href: string, pathname: string): string | null =>
  pathname === HOME_ROUTE && href.startsWith(`${HOME_ROUTE}#`)
    ? href.slice(2)
    : null;

/**
 * A modified click is the visitor asking the browser for a new tab or window,
 * and `preventDefault` would silently swallow that. `button !== 0` catches the
 * middle-click that some engines report through `click`.
 */
const isPlainClick = (event: ReactMouseEvent) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

export function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const scrollToSection = useSectionScroll();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  /**
   * ONE HANDLER FOR BOTH THE BAR AND THE MOBILE MENU, so the two can never
   * disagree about what a nav entry does. The menu passes its own click event
   * through after releasing the scroll lock — see `NavMobileMenu`, where the
   * unlock has to happen synchronously or the scroll lands against a document
   * that cannot move.
   */
  const handleNavClick = useCallback(
    (href: string, event: ReactMouseEvent) => {
      setMenuOpen(false);
      if (!isPlainClick(event)) return;

      const targetId = inPageTarget(href, pathname);
      if (!targetId) return;

      event.preventDefault();
      scrollToSection(targetId);
    },
    [pathname, scrollToSection],
  );

  /* -----------------------------------------------------------------------
     Which ground is behind the bar.

     AN ATTRIBUTE, NOT REACT STATE, and the palette itself lives in
     `globals.css` under `[data-nav-root][data-over-hero]`. Three reasons, in
     order of how much they matter:

       1. The state version was a `setState` inside an effect on the no-hero
          path, which Next 16's `react-hooks/set-state-in-effect` rule
          hard-errors on. It was right to: that is a cascading render.
       2. Changing it re-rendered the whole bar — SVG mark, Framer-animated
          copy control and all — to swap three strings.
       3. The swap becomes a pure CSS cascade, so it cross-fades for free via
          the `transition-colors` each item already carries.

     THE SERVER-RENDERED VALUE IS FROZEN AT MOUNT, deliberately. On `/` the
     attribute ships in the HTML, because the top of the page is the hero and
     that is where the bar starts; on `/work` past the Intro it ships absent, so
     the past-hero palette and its scrim are correct from the first painted
     frame rather than from the first effect. After mount the effect below is
     the ONLY author — which is why this is `useState`-with-an-initialiser and
     not a value recomputed from `pathname` on every render. The bar is mounted
     by the `(chrome)` layout and survives client navigation between `/` and
     `/work`, so a re-rendered attribute would fight the ref-written one; worse,
     during an open project overlay the pathname is `/projects/<slug>` while
     Home is still mounted BEHIND it, hero and all.

     ─────────────────────────────────────────────────────────────────────────
     THE INTRO'S PLATE IS A THIRD GROUND, ADDED 2026-08-22, AND IT WAS A BUG.

     This read `pathname === HOME_ROUTE` alone. That was correct while the
     Intro only played on `/`; once it played on all three routes it was wrong
     on two of them, and the failure was not subtle. MEASURED at 1440x900,
     light, t = 2000ms with the plate up: `/` had `data-over-hero` and was
     transparent with `--nav-fg: #e8eaec`; `/work` and `/about` had the
     attribute ABSENT, so `[data-nav-root]:not([data-over-hero])` painted
     `color-mix(in oklab, var(--color-base) 80%, transparent)` plus a 10px
     backdrop blur across the top of an opaque #07090C plate, with
     `--nav-fg: #151515`.

     AND IT WAS WORSE THAN A LIGHT BAR: the entrance layer inside is parked at
     `yPercent: -100` until the hand-off, so what actually painted was an EMPTY
     light-grey slab — a bar-shaped hole in the Intro, for the whole ~2.2s
     before phase 7 starts. Screenshot: `scratchpad/navwhite-work.png`.

     `!arriving` IS THE TERM, AND THE INSTANT MATTERS MORE THAN THE ATTRIBUTE.
     `arriving` is false only while an Intro is in front of this document and
     has not yet handed off; it is seeded TRUE on a client navigation, so a
     `/work` reached by clicking is unaffected. Releasing the ground at the
     hand-off — rather than at `introDone`, when the plate is finally gone —
     is a contrast decision and it is derived rather than preferred:

       Off Home the plate's dissolve is a LIGHTNESS RAMP. In light mode the
       ground behind this bar travels L* 2.41 -> 98.99 over 0.55s. Hold the
       hero palette across that ramp and #e8eaec ink ends up on a near-white
       ground: at t = 0.50s of 0.55s the composite is ~#C0BFBE and the ink
       measures **1.45:1**. Release at the hand-off instead and the bar takes
       its OWN scrim on the same frame — 80% `--color-base` over whatever the
       plate is doing, which is never darker than ~#CBCBCB in light mode — so
       #151515 stays above 12:1 for every frame of the ramp. The swap itself is
       discrete (see `apply()` below), so there is no midpoint to pass through.

       The cost is stated rather than hidden: for the first ~50ms of the
       dissolve the bar carries its light scrim while its own row is still
       sliding in, i.e. the old empty slab, for about three frames instead of
       for 2.2 seconds. That window is the frame the bar is DEFINED to arrive
       on by `docs/07` §3 step 7, and the alternative — pinning the bar's
       background to `--color-hero-surface` for the plate's whole life — trades
       it for a dark bar sitting over the page as the page appears.
  ----------------------------------------------------------------------- */
  const { arriving } = useIntroHandoff();
  const [initialOverHero] = useState(() => pathname === HOME_ROUTE || !arriving);

  /* -----------------------------------------------------------------------
     RE-RUNS ON EVERY ROUTE CHANGE, and that dependency is load-bearing rather
     than tidy. The bar is layout-mounted now, so it does NOT remount when Home
     gives way to `/work`. With `[]` deps the ScrollTriggers created against
     Home's elements would outlive what they measure, and `/work` would keep
     whatever palette the visitor left Home with — the hero palette, if they
     clicked WORK from the top of the page.

     DOM PRESENCE, NOT `pathname`, DECIDES. `pathname` says when to re-check;
     `getElementById` says what is actually on the page. The two differ in
     exactly one case and it matters: with a project overlay open the pathname
     is `/projects/<slug>` while Home — hero included — is still mounted behind
     the dialog, and the bar should keep the palette it had.

     TWO DARK GROUNDS, NOT ONE, SINCE PHASE 5. `globals.css` always described
     three grounds on `/` — the hero, the mid-page sections, and the dark plate
     at the bottom — but only the hero was ever observed. THE PLATE CASE WAS
     MEASURED RATHER THAN ASSUMED, on the build before the reveal footer landed
     (`/` and `/work`, both themes, at maximum scroll):

       1440x900  plate top  307, bar bottom 59  ->  no overlap
       1280x800  plate top  213, bar bottom 59  ->  no overlap
       1024x600  plate top  -70, bar bottom 59  ->  OVERLAPS BY 129px
        360x640  plate top   -6, bar bottom 48  ->  OVERLAPS BY  54px

     So the failure is NOT the one an over-eager plate observer would cause —
     a bar stuck on the dark palette everywhere, which is what a naive
     "is the plate in the viewport" test would now produce, since the plate is
     pinned from first paint. It is the INVERSE, and it is real: whenever the
     plate is taller than `viewportHeight - barHeight`, its top rises above the
     bar and the bar sits on #07090C still carrying its LIGHT-MODE palette —
     near-#151515 labels under an 80% #FDFCFA scrim, on a near-black surface.
     Short viewports only, but the reveal footer's stamp band adds ~198px of
     plate height, which pulls 1280x800 into the same case.

     THE TEST IS THE PLATE'S STATIC TOP CROSSING THE BAR, and it is measured
     through a SENTINEL rather than through the footer itself, because the
     footer is `md:sticky` and reports its PINNED rect from first paint. The
     sentinel's ABSENCE is the route guard: `/about` renders no reveal footer,
     so no plate trigger is created there.

     A LAYOUT EFFECT, NOT `useEffect`, AND THE REASON IS STRUCTURAL RATHER THAN
     MEASURED — say so plainly, because the difference matters here.

     React flushes passive effects on a scheduler task, so `useEffect` MAY run
     before the next paint and may not. If it does not, the compositor shows one
     frame of the new route under the OLD palette: on `/about -> /` in light
     that is #151515 ink on the hero surface this page now paints from its first
     frame, about 1.05:1 for ~16ms. The window is one frame wide and it is a
     race, not a certainty.

     IT WAS NOT OBSERVED. Sixteen light-mode navigations were re-measured with
     the discrete swap in place and `useEffect` restored — every composited
     frame paired with the ink that was actually on screen in it — and NOTHING
     fell below floor; worst margin identical at 3.37:1 on the indicator against
     its 3:1. So this is not a fix for a reproduced failure. It closes a race by
     construction: a layout effect runs after React's DOM mutation and BEFORE
     paint, so the attribute and the ground it describes are committed together
     and no frame can carry one without the other.

     THE EARLIER VERSION OF THIS COMMENT CLAIMED TWO MEASURED FAILURES HERE
     (1.18:1 and 1.09:1) AND THEY WERE A MEASUREMENT ARTIFACT — the rig paired
     ink read before paint with pixels timestamped by the compositor, two clocks
     that disagree by a frame right at a commit. Recorded rather than quietly
     deleted: the numbers were wrong, the change is still right.

     The ScrollTrigger work below is safe to move with it: it only reads layout
     (which is already up to date at this point) and registers callbacks.
  ----------------------------------------------------------------------- */
  useIsomorphicLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    /* The bar's bottom edge, exactly, at whatever width the bar is currently
       laid out for. A FUNCTION rather than a captured number: the height is 48
       / 64 / 59 across the `sm` and `md` breakpoints, and this effect keys on
       `pathname`, so a captured value would go stale on the first resize that
       crosses one. ALL FOUR READERS call it — the hero trigger's `start` and
       its initial comparison, plus `inkTop()` below — so they cannot drift
       apart, which is the property the old shared constant existed to give,
       kept. (This said "all three" until 2026-08-22 and there were four then
       too; the whole point of the sentence is that readers cannot drift, so an
       off-by-one in it is the exact failure it warns about.) */
    const barEdge = () => el.getBoundingClientRect().bottom;

    /* WHERE THE BAR'S INK STARTS, which is a different line from where the BAR
       starts, and the difference is the whole of the fix below.

       THE BUG IT CLOSES. The plate trigger used to flip the palette the instant
       the plate's static top crossed `barEdge()` — the bar's BOTTOM. At that
       moment not one pixel of ink is over the plate: the ink row sits 21px down
       in a 59px bar, so the bar takes the hero palette (and loses its scrim)
       while every glyph in it is still on `bg-base`. In light mode that is
       #E8EAEC on #FDFCFA. The band is `barEdge - inkTop` px of scroll wide —
       38px at >=768, 43px at 640-767, 35px below 640 — and it is a RESTING
       state, not a transient, at any viewport where the plate is between
       `viewportH - barEdge` and `viewportH` tall.

       This was reported as "strictly better than the 70px constant it
       replaced", which it was, and that is not the bar. The band is now zero:
       the hero palette is taken only when the plate covers ALL of the ink, and
       until then the scrimmed light palette holds — which is legible over BOTH
       grounds, because an 80% `--color-base` scrim over #07090C composites to
       #CCCBCA and `--nav-fg` reads 11.37:1 on it.

       COMPUTED FROM PADDING, NOT FROM A CHILD'S RECT, and that is required
       rather than tidy. The row inside `<header>` is the Intro's entrance
       target: it is translated a full bar-height above the viewport while the
       Intro plays, so its `getBoundingClientRect()` is meaningless then. A
       computed `padding-top` is immune to descendant transforms, exactly as
       `barEdge()`'s use of the fixed header's own rect is.

       IT IS DELIBERATELY THE TOP AND NOT A BAND. The bottom edge of the ink
       would have to account for the active-route indicator, which hangs 6px
       BELOW the centre cluster on a 2px line and only exists at `md`. Nothing
       hangs above the row, so the top is exact at every breakpoint with no
       constant to keep in sync. */
    const inkTop = () => {
      const row = el.firstElementChild;
      const pad = row ? parseFloat(getComputedStyle(row).paddingTop) : 0;
      return el.getBoundingClientRect().top + (Number.isFinite(pad) ? pad : 0);
    };

    /* THREE GROUNDS, ONE ATTRIBUTE. Kept in a plain object rather than in state
       for the reason the whole effect exists: writing the attribute from a ref
       costs no render, and a `setState` here is what Next 16's
       `react-hooks/set-state-in-effect` rule hard-errors on.

       `hero` and `plate` are mutually exclusive in practice — no page puts the
       hero and the reveal footer under the bar at once — but all three are
       OR-ed rather than assumed exclusive, so a page that managed two would
       take the dark palette rather than flicker between two authors of one
       attribute. `intro` OVERLAPS `hero` by construction on `/`, which is
       exactly why it is a third term here and not a fourth author: on Home the
       OR means the attribute simply never changes across the hand-off, and the
       bar's ground goes #07090C -> #07090C with nothing to swap.

       `intro` WAS ADDED 2026-08-22 for the empty-light-slab bug — the block at
       `initialOverHero` above has the measurement, the reason the release
       instant is the hand-off rather than `introDone`, and the cost. */
    const ground = { hero: false, plate: false, intro: !arriving };

    /* THE PALETTE SWAP IS DISCRETE, AND THAT IS A FIX, NOT AN OVERSIGHT.

       Every ink element in the bar carries `transition-colors duration-300`,
       so until 2026-08-22 flipping this attribute CROSS-FADED the ink over
       300ms. The ground it answers to does not cross-fade: the scrim
       (`[data-nav-root]:not([data-over-hero])` in `globals.css`) has no
       transition and snaps in the same frame, and on a route change the page
       under the bar changes at the commit frame.

       A CROSS-FADE BETWEEN TWO INVERTED PALETTES IS UNSAFE AT ITS MIDPOINT and
       cannot be made safe by re-timing it. Halfway between #E8EAEC and #151515
       the ink is mid-grey; on a ground that is either end of that range the
       contrast passes through 1:1. MEASURED, light mode, production build, on
       the shipped cross-fade — the worst sample of each navigation, ground
       taken off the rendered pixels behind the bar:

         1440x900  / -> /about       1.01:1  at t=0 and t=50  (location label)
         1440x900  / -> /work        1.01:1  at t=0 and t=50
         1440x900  /work -> /        1.21:1  at t=100ms   (the email control)
         375x667   / -> /about       1.18:1  at t=0       (the MS mark)
         375x667   /work -> /        1.98:1  at t=100ms
         375x667   /about -> /       1.85:1  at t=100ms

       Ten of thirty-two navigations failed AA, all of them in light mode —
       dark never dropped below 10.3:1, because #0A0A0B and #07090C are two
       points apart and the palette barely moves. That is the FIFTH
       dark-mode-only miss on this project.

       SO THE SWAP IS FORCED THROUGH WITH TRANSITIONS DISABLED. The attribute
       below is read by ONE rule in `globals.css`; `getBoundingClientRect()`
       between the two writes forces the style recalc to happen while it is
       still set, so the new colour is the FIRST computed value the ink ever
       has and no transition is generated. Removing the attribute afterwards
       restores the 300ms curve for hover, which is the only thing left that
       needs it — and which still works, because the colour has not changed
       again by the time the next recalc runs.

       THE INDICATOR IS NOT AFFECTED, BY CONSTRUCTION rather than by a
       `:not()`: its duration is an INLINE style built from `INDICATOR_MS`, and
       an inline declaration outranks the stylesheet rule. Its 240ms slide and
       its `background-color` cross-fade both survive — verified by measuring
       the step count across a route change, not by reading the cascade.

       THE `changed` GUARD IS WHAT KEEPS THIS CHEAP. `apply()` is called from
       both ScrollTriggers, from both `onEnterBack` paths and once on mount, so
       without it a forced layout would run on calls that write nothing. */
    let dark: boolean | null = null;
    const apply = () => {
      const next = ground.hero || ground.plate || ground.intro;
      if (next === dark) return;
      dark = next;

      el.setAttribute(PALETTE_INSTANT_ATTR, "");
      if (next) el.setAttribute("data-over-hero", "");
      else el.removeAttribute("data-over-hero");
      // Forces style + layout to be recomputed NOW, while the attribute above
      // is still on the element. Do not "optimise" this line away.
      el.getBoundingClientRect();
      el.removeAttribute(PALETTE_INSTANT_ATTR);
    };

    /* Collected as closures rather than as trigger instances, so this file
       does not have to name GSAP's instance type just to clean up. */
    const kills: Array<() => void> = [];

    /* ScrollTrigger rather than bare IntersectionObservers: it is already
       bound to Lenis site-wide, and one scroll authority beats two. */
    // The same read, now shared with `Intro.tsx` so the two cannot answer this
    // question differently. See `components/hero/heroStage.ts`.
    const hero = getHeroStage();
    if (hero) {
      // SET THE STATE ONCE, UP FRONT, from where the page actually is. The
      // triggers only fire on CROSSING a boundary, so without this a
      // navigation that arrives already scrolled past the hero — closing an
      // overlay opened from the gallery, say — would sit on the wrong palette
      // until the visitor happened to scroll back up and down again. Each
      // comparison mirrors its own `start` exactly.
      ground.hero = hero.getBoundingClientRect().bottom > barEdge();

      // The boundary is the hero's BOTTOM reaching the bar's bottom edge, not
      // the viewport top — otherwise the palette would swap while the bar is
      // still physically over the last strip of hero surface.
      const trigger = ScrollTrigger.create({
        trigger: hero,
        start: () => `bottom top+=${barEdge()}`,
        onEnter: () => {
          ground.hero = false;
          apply();
        },
        onLeaveBack: () => {
          ground.hero = true;
          apply();
        },
      });
      kills.push(() => trigger.kill());
    }

    const plateTop = document.getElementById(REVEAL_FOOTER_SENTINEL_ID);
    if (plateTop) {
      ground.plate = plateTop.getBoundingClientRect().top <= inkTop();

      // `onEnterBack` IS NOT REDUNDANT WITH `onEnter`. The sentinel is zero
      // height, so ScrollTrigger's default `end` ("bottom top") lands only
      // `inkTop` pixels past `start`; scrolling down through both and back up
      // re-enters through the END, which fires `onEnterBack` and never
      // `onEnter`. Without it the bar would stay on the light palette for the
      // last stretch of every scroll-up off the plate.
      //
      // THAT WINDOW GOT SHORTER WITH THE `inkTop()` MOVE — 21px rather than 59
      // at `md` and up — which makes this branch MORE load-bearing, not less.
      const trigger = ScrollTrigger.create({
        trigger: plateTop,
        start: () => `top top+=${inkTop()}`,
        onEnter: () => {
          ground.plate = true;
          apply();
        },
        onEnterBack: () => {
          ground.plate = true;
          apply();
        },
        onLeaveBack: () => {
          ground.plate = false;
          apply();
        },
      });
      kills.push(() => trigger.kill());
    }

    apply();

    return () => kills.forEach((kill) => kill());
    /* `arriving` IS A DEPENDENCY, AND IT FIRES EXACTLY ONCE PER DOCUMENT.
       It is monotonic false -> true (`IntroProvider`'s `setPhase` never runs it
       back), so this effect re-runs one extra time, at the hand-off, and both
       ScrollTriggers are rebuilt against a page that is at scroll 0 and fully
       laid out. It is deliberately NOT read through a ref: the whole point is
       that the palette must change on that frame, and `apply()` only runs from
       inside this effect. */
  }, [pathname, arriving]);

  /* -----------------------------------------------------------------------
     Where the indicator line sits.

     `useState`, NOT A DIRECT STYLE WRITE. The bar's old hide-on-scroll wrote
     `style.transform` by ref because it ran on every scroll frame; this runs on
     route change, on resize and once when the webfont resolves. Do not copy
     that pattern here — it was a concession to frequency, not a house style.

     `null` MEANS "DO NOT RENDER THE LINE", and it has two live cases:
       - Before the first measurement. The span is INSERTED already at its final
         width and offset, and an inserted element has no previous value to
         transition from — which is how the entrance is protected. Rendering it
         at zero and then sizing it would slide it in from the far left on every
         single page load.
       - With a project overlay open, when `pathname` is `/projects/<slug>` and
         no centre item matches. The overlay is a modal `<dialog>` in the top
         layer, so the bar is not visible then anyway; this just declines to
         guess which item to mark.

     `animated` RIDES ALONG IN THE SAME OBJECT ON PURPOSE. CSS starts a
     transition based on the AFTER-change style, so a geometry change committed
     together with a className that has no `transition-property` does not
     animate — which is exactly what a resize or a font swap should do. Split
     across two state updates it would be a race.
  ----------------------------------------------------------------------- */
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
    animated: boolean;
  } | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    /**
     * `getBoundingClientRect`, DIFFERENCED AGAINST THE CLUSTER — NOT
     * `offsetLeft` / `offsetWidth`.
     *
     * The design brief specifies the offset pair, and it is very nearly right:
     * the `<nav>` is `position: absolute`, so it IS the offsetParent of every
     * item inside it, and the numbers come out in the coordinate space the line
     * is positioned in. But `offsetLeft` and `offsetWidth` ARE ROUNDED TO
     * INTEGERS, and the cluster does not land on a whole pixel — `left-1/2
     * -translate-x-1/2` of an odd-width box puts its left edge on x.77. So the
     * rounded pair shipped a line that was measurably not the item's box.
     * Measured at 1440, dark and light alike:
     *
     *   WORK   item left 762.59 width 32.64   offset pair gave 762.77 / 33.00
     *   ABOUT  item left 644.77 width 40.81   offset pair gave 644.77 / 41.00
     *
     * 0.18px of position and 0.36px of width. Invisible, and still wrong in the
     * one way this indicator must not be: the line is a claim about where an
     * item is, so it should be measured from the item's actual box. With rects
     * both edges agree exactly, at every viewport and in both themes.
     *
     * `clientLeft` is the nav's left border width, which absolute positioning
     * measures from. It is 0 today — the term is there so that adding a border
     * to the cluster later cannot silently shift the line.
     *
     * THE OFFSETS ARE INVARIANT UNDER A PLAIN VIEWPORT RESIZE, measured:
     * byte-identical at 1280 and 1440. The cluster moves with `left-1/2`, but
     * the line moves with it, because the line is inside it too. (The brief
     * gives this as the reason for the resize listener; it is not. The listener
     * is still REQUIRED, for crossing `md` — where the cluster is
     * `display: none` and every measurement collapses to zero — and for browser
     * zoom, which does change item widths.)
     */
    const measure = (mayAnimate: boolean) => {
      // BY `aria-current`, not by an index into a parallel array. The line is
      // a visual echo of that attribute, so finding it this way makes the two
      // impossible to disagree.
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active) {
        setIndicator(null);
        return;
      }
      const activeRect = active.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      const left = activeRect.left - navRect.left - nav.clientLeft;
      const width = activeRect.width;
      setIndicator((prev) => {
        // GEOMETRY DECIDES WHETHER THIS IS A NO-OP, and `animated` is
        // deliberately NOT part of the comparison. That is what fixes a race
        // that was measured, not imagined: `document.fonts.ready` is an
        // ALREADY-RESOLVED promise on every navigation after the first, so its
        // `.then` runs as a microtask right behind the route change's own
        // `measure(true)`. Both updates land in the same batch, the second one
        // carrying `animated: false` and identical numbers — and the line
        // teleported between routes instead of sliding. Returning `prev`
        // untouched when nothing moved makes the ordering irrelevant.
        if (prev && prev.left === left && prev.width === width) return prev;
        // The FIRST appearance never animates, whatever the caller asked for.
        return { left, width, animated: mayAnimate && prev !== null };
      });
    };

    // Mount and route change share this call. `mayAnimate` is true for both and
    // the `prev !== null` guard inside sorts them out: on mount there is no
    // previous line to move, on a route change there is.
    measure(true);

    // THE WEBFONT CASE, which is the one that ships silently wrong. The labels
    // are JetBrains Mono at `text-caption`; measured before the face resolves,
    // "ABOUT" is a fallback-metrics width and the line lands short or long and
    // then never corrects. `document.fonts.ready` resolves either way, load or
    // failure, so this cannot hang. It jumps rather than sliding: it is a
    // correction to a measurement, not a navigation.
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (!disposed) measure(false);
    });

    // rAF-coalesced: a drag-resize fires `resize` far faster than the bar needs
    // re-measuring, and each distinct value here is a real re-render.
    let frame = 0;
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure(false);
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);

  return (
    <>
      <header
        ref={headerRef}
        // `data-nav-root` is what `globals.css` hangs the three palette
        // variables off. `data-over-hero` selects the hero half of that
        // cascade; this SPREAD is its first and last appearance in React —
        // present on a page that has a hero, absent on one that does not, and
        // from here on written by ref alone. `initialOverHero` is frozen at
        // mount for exactly that reason; the block above it has the full case.
        data-nav-root=""
        {...(initialOverHero ? { "data-over-hero": "" } : null)}
        // NO `transition-transform` AND NO `transform` OF ITS OWN. Both went
        // with hide-on-scroll; the element is now permanently at rest and the
        // only thing that moves in the bar is the entrance layer inside it.
        //
        // ─────────────────────────────────────────────────────────────────
        // `z-[55]`, AND THE VALUE IS BETWEEN TWO OTHERS ON PURPOSE. IT WAS
        // `z-40` UNTIL THE INTRO'S GATE MOVED TO THE `(chrome)` LAYOUT.
        //
        // Required body-level order, bottom to top:
        //
        //   <main> 10  <  Intro plate 50  <  header 55  <  AssetLoader 60
        //
        // `z-40` was correct only by accident, and the accident ended with the
        // move. MEASURED before it, on `/` at t=600ms: the plate is `fixed
        // inset-0 z-50` but it was rendered by `Hero`, INSIDE
        // `<main class="relative z-10">` — and `position: relative` with a
        // z-index establishes a stacking context, so the plate's 50 was LOCAL
        // TO `<main>` and never reached the body-level stack. 40 > 10, so the
        // bar painted above the plate no matter what number the plate carried.
        //
        // That was not a defect; it is the shipped seam. Confirmed two ways at
        // t=2611ms with the plate at opacity 1.000: `elementFromPoint` at the
        // ABOUT link's centre returns the link itself, and the screenshot shows
        // the whole bar legible over the opaque plate. The bar travels
        // `y -58.2 -> 0` between t=2344 and t=2744ms and the plate is fully
        // opaque for every frame of it.
        //
        // The move makes the plate a direct child of `<body>`, so its `z-50`
        // becomes a REAL body-level z-index for the first time and the order
        // inverts: at `z-40` the bar would slide in BEHIND an opaque plate and
        // simply be present when the plate cleared. `docs/07` §3 step 6 needs
        // the hero settle and this slide to be one coordinated beat — and that
        // beat would survive in the timeline and vanish from the screen.
        // NOTHING WOULD THROW AND NO TRANSFORM-READING TEST WOULD NOTICE: the
        // tween still runs, the onset delta is still one frame. It is visible
        // only in pixels.
        //
        // 55 rather than raising the plate: it changes ONE number instead of
        // two, and it leaves `z-50` and `z-[60]` — the values `docs/06` §3,
        // `app/(site)/(chrome)/page.tsx` and both intro components quote — where
        // they are. IF THE PLATE OR THE LOADER IS EVER RENUMBERED, THIS HAS TO
        // MOVE WITH THEM; it is the only value on the site that is defined by
        // sitting between two others.
        // ─────────────────────────────────────────────────────────────────
        className="pointer-events-none fixed inset-x-0 top-0 z-[55]"
      >
        {/*
          FULL-BLEED, AND DELIBERATELY NOT THE SITE SPINE.

          This container used to be byte-identical to About / Skills /
          Projects / Experience / Contact and to the detail route's, under
          Rule S-1 — "the site has one spine and chrome does not get its own".
          THAT HALF OF S-1 IS NOW REVERSED. `docs/07_SITE_RESTRUCTURE.md` §1
          takes the chrome off the spine, and `docs/03_FRONTEND_SPEC.md`
          records the carve-out next to the rule itself so the two cannot
          drift: chrome is full-bleed; content sections keep the spine. S-1
          still binds every content section — do NOT "restore" this container
          to match them.

          So: no `mx-auto`, no `max-w-[1440px]`, and one small fixed gutter in
          place of the spine's escalating inset — `px-md` (21px) below 640px,
          `px-lg` (34px) at and above it. Both are existing Fibonacci steps, so
          nothing new is introduced. 21px against a 1440px viewport reads as an
          accident of margin collapse; 34px reads as a chosen edge. Mobile does
          not move because 21px already reads as full-bleed on a bar that is
          tight for room. VERTICAL PADDING IS UNCHANGED.

          THE ABSOLUTE CENTRING BELOW STILL LANDS ON THE VIEWPORT CENTRE, and
          now does so directly rather than by coincidence: with the cap gone
          this element IS the viewport width, so the centre cluster's
          `left-1/2` is the viewport's midpoint. Before, it was the capped
          container's midpoint, which only equalled the viewport's because the
          container was centred with symmetric padding.

          IF AT 2560px THE BAR READS AS DETACHED from the content below it, the
          fix is to RAISE the gutter (`px-xl`), never to restore the cap —
          restoring the cap re-creates the exact thing §1 removed.
        */}
        <div
          // THE ENTRANCE LAYER. The Intro's timeline slides this down from
          // above the viewport as the hero arrives — one timeline, two tweens,
          // SAME START, because `docs/07` §1 and §3 step 6 both ask for one
          // beat rather than two adjacent ones.
          //
          // NOT the same duration, and this comment said "same start, same
          // duration" until 2026-08-22. The bar slides in 0.45s (`HANDOFF_S`)
          // while the hero settles over 1.6s (`ARRIVAL_S`), deliberately: the
          // incoming half of a handoff has to outlast the outgoing one or the
          // seam reads as a cut. Both files say so; this one had not caught up.
          //
          // IT IS THIS ELEMENT AND NOT `<header>`, AND THE ORIGINAL REASON IS
          // NOW VOID. It was that the header's `transform` was already taken:
          // hide-on-scroll wrote it directly on every scroll frame, so a second
          // author on the same property would have been fighting it the first
          // time anyone scrolled during the entrance. Hide-on-scroll is gone
          // and the header's `transform` is free.
          //
          // IT STAYS HERE ANYWAY. Moving a working entrance onto a different
          // element is risk with no gain — `<header>` is `pointer-events-none`
          // and `fixed`, this layer is neither, and the Intro's timeline targets
          // it by attribute. Recorded rather than quietly left stale, because a
          // comment whose reason has evaporated reads as verified forever.
          //
          // NO INITIAL OFFSET IS RENDERED HERE. The bar is visible by default,
          // and the Intro hides it imperatively when it mounts — so a page with
          // no Intro (reduced motion, a client navigation back to Home, or any
          // future route) gets a bar that is simply there, with no flag to keep
          // in sync and no way to strand it off-screen. `lib/animation/handoff.ts`
          // holds the attribute name and the shared duration.
          {...{ [NAV_ENTRANCE_ATTR]: "" }}
          className="relative flex items-center px-md py-sm sm:px-lg sm:py-md"
        >
          {/* ---------------------------------------------------------------
              LEFT — the mark, then the place.
          --------------------------------------------------------------- */}
          <div className="pointer-events-auto flex items-center gap-sm">
            {/*
              NOT A LINK. The centre icon is already the "go home" affordance,
              and two controls that do the same thing in one bar is one more
              thing for a keyboard user to tab past for no gain. This is the
              site's identity, so it is labelled rather than hidden.

              The hover gesture — the two letters part and close again — quotes
              the Intro's phase-3 SLIDE, played in reverse: the Intro closes M
              and S up into a solid pair, and the hover opens that pair back out
              and lets it re-close. (This read "the Intro's own contraction
              played as a two-frame quotation"; the Intro has no contraction
              move — that was the sequence reverted in `1145a00`.)
              It is the reason `MonogramMark` splits M and S into separate
              elements. `group-hover` reaches them through the `data-ms-letter`
              hooks the mark exposes.
            */}
            <span className="group/mark block text-[var(--nav-fg)] transition-colors duration-300">
              <MonogramMark
                variant="nav"
                label="Muhammad Saad"
                // 17px IS A HARD FLOOR, NOT A PREFERENCE, and it lives in
                // `msMarkGeometry.ts` as `NAV_HEIGHT_PX` rather than in a class
                // here, because `docs/07` §2.1 binds more surfaces than this
                // file — About, the reveal-footer stamp, any future favicon.
                //
                // ITS DERIVATION HAS CHANGED TWICE AND THE NUMBER NEVER HAS.
                // The trace mark derived it from node-dot clearance across the
                // 112-unit letter gap; there are no dots now. The three-bar
                // faceted M derived it from that M's 40-unit bar gap; the M is
                // ONE polygon now and has no bar gaps at all.
                //
                // WHAT BINDS TODAY IS THE S'S 44-UNIT GAP between its three
                // horizontal bars — the tightest clear air in the mark. Keeping
                // ~2px of it needs 44 / 2 = 22 units per pixel, an arithmetic
                // floor of 14.5px; 17px gives 2.34px, about 17% of margin.
                // ANYTHING SMALLER IS A DESIGN CHANGE — raise it rather than
                // shrinking the mark. `msMarkGeometry.ts` owns the number.
                //
                // The cap is 13.6px inside this box, unchanged from the trace
                // mark, but the ink is not: bars are 2.98px against the trace's
                // 1.25px stroke, so the left cluster reads heavier than it did.
                // That is the rebuild working, not drift.
                size={NAV_HEIGHT_PX}
                // THE `36px` IS 36 VIEWBOX UNITS, NOT 36 SCREEN PIXELS, and
                // the difference is the whole reason this number looks wrong.
                // A CSS transform on an SVG child resolves in the element's
                // USER coordinate space, so at a 17px-tall render of a
                // 320-unit-tall box one screen pixel is ~18.8 units. The first
                // cut used `14px` and moved the letters seven tenths of a
                // pixel — the gesture compiled, ran, and was invisible.
                // 36 units is ~1.9 screen pixels per letter, so the pair opens
                // by not quite four — with the faceted mark, from a 64-unit
                // letter gap to 136.
                //
                // STILL FLAGGED FOR A FEEL CALL, still not changed: 36 was
                // tuned against a 9.7px cap two marks ago and has survived two
                // rebuilds unexamined. It has to be judged against the rendered
                // bar, so it is left alone here rather than guessed at again.
                className="[&_[data-ms-letter]]:transition-transform [&_[data-ms-letter]]:duration-300 group-hover/mark:[&_[data-ms-letter='m']]:-translate-x-[36px] group-hover/mark:[&_[data-ms-letter='s']]:translate-x-[36px] motion-reduce:[&_[data-ms-letter]]:transition-none"
              />
            </span>

            {/*
              Hidden below `sm`. The bar has four things competing for a 375px
              viewport and this is the one that is context rather than
              navigation — it moves into the mobile menu, where there is room
              for it, rather than being dropped.
            */}
            <span className="hidden text-caption font-mono uppercase text-[var(--nav-fg-dim)] transition-colors duration-300 sm:inline">
              {NAV_LOCATION}
            </span>
          </div>

          {/* ---------------------------------------------------------------
              CENTRE — ABOUT · [icon] · WORK.

              `md:` and up only. Below that the centre cluster and the right
              cluster both move into the menu; keeping a three-item nav on a
              375px bar would mean shrinking the type below the caption size,
              which is the site's floor.
          --------------------------------------------------------------- */}
          <nav
            ref={navRef}
            aria-label="Sections"
            // `absolute` MAKES THIS THE OFFSET PARENT of the three items and of
            // the indicator line, which is what lets the line be positioned in
            // the cluster's own coordinates rather than the viewport's. It is
            // not an extra `relative`: the centring already required it.
            className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 items-center gap-md md:flex"
          >
            {/*
              LINKS, NOT BUTTONS, since WORK became a route. A `<button>` that
              navigates is invisible to every gesture a visitor expects of a
              nav — middle-click, ⌘-click, "copy link address", and the status
              bar that tells them where they are about to go. `handleNavClick`
              hands the router everything except an anchor into the page that
              is already showing, which it scrolls itself so the Lenis easing
              and the nav offset survive.
            */}
            <Link
              href={NAV_ITEMS[0].href}
              onClick={(event) => handleNavClick(NAV_ITEMS[0].href, event)}
              // THE ONLY SOURCE OF TRUTH FOR "YOU ARE HERE" on all three items.
              // The line is decorative and `aria-hidden`; this is the part a
              // screen-reader user actually receives, and it is also what the
              // measurement effect queries for.
              aria-current={isActiveRoute(NAV_ITEMS[0].href, pathname) ? "page" : undefined}
              className={NAV_ITEM}
            >
              {NAV_ITEMS[0].label}
            </Link>

            {/* The centre icon is a route link now — `/` from anywhere. Its
                accessible name moved with it: "Back to top" was a lie the
                moment the bar appeared on a second page.

                `px-xs` IS NOT DECORATION. The icon's box is 19px, which is below
                the 24px minimum target size, and it is also the item the
                indicator has to underline — measured at 1440, ABOUT is 40.81px
                and WORK is 32.64px, so a 19px line between them reads as a stray
                tick. 8px a side takes the target to 35px and the line with it —
                between its two neighbours rather than under half of either — WITHOUT special-casing the line's width, which
                would decouple it from the thing it points at. The box is still
                19px tall; `py` is deliberately not added, because it would grow
                the bar's height and move the boundary the palette swap uses. */}
            <Link
              href={HOME_ROUTE}
              aria-label={NAV_HOME_LABEL}
              aria-current={isActiveRoute(HOME_ROUTE, pathname) ? "page" : undefined}
              className="pointer-events-auto cursor-pointer px-xs text-[var(--nav-fg-dim)] transition-colors duration-300 hover:text-[var(--nav-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nav-accent)]"
            >
              <ConstellationIcon className="h-[19px] w-[19px]" />
            </Link>

            <Link
              href={NAV_ITEMS[1].href}
              onClick={(event) => handleNavClick(NAV_ITEMS[1].href, event)}
              aria-current={isActiveRoute(NAV_ITEMS[1].href, pathname) ? "page" : undefined}
              className={NAV_ITEM}
            >
              {NAV_ITEMS[1].label}
            </Link>

            {/*
              THE INDICATOR. One span, absolutely positioned in the cluster,
              6px below its content box.

              `--nav-accent`, NEVER A LITERAL. The bar crosses the hero's pinned
              dark plate and `bg-base`, which flips with the theme; any fixed
              colour is wrong on one of them. Riding the same escalating
              variable every other control in the bar uses is what keeps the
              line honest on all three grounds.

              IT DID NOT CROSS-FADE "FOR FREE", AND THIS COMMENT USED TO SAY IT
              DID. Riding the variable gets the line the right VALUE; it does
              not get it a transition, because `background-color` was in neither
              `transition-property` list below. Measured on the shipped build at
              1440x900, light mode, crossing the hero boundary at scrollY 840:
              ONE colour step, within one frame of the attribute flip —
              #14B8A6 -> #0F766E, L* 67.41 -> 44.50, a 22.91-point lightness
              jump on the one element in the bar that carries state, while every
              sibling cross-fades over 300ms. Invisible in dark mode, where
              `--color-hero-accent` and dark `--color-accent-working` are the
              same hex and the measured step count is ZERO — which is why it
              shipped. `background-color` is now named in BOTH lists.

              IT DOES NOT EXIST BELOW `md`, and needs no gate of its own to
              achieve that: the cluster it lives in is `hidden md:flex`, so the
              whole thing is `display: none` there and `NavMobileMenu` handles
              navigation. Do NOT reimplement it inside the menu.

              THE TRANSITION IS SPLIT ACROSS `className` AND `style`, AND THE
              SPLIT IS NOT ARBITRARY. Only `transition-property` is a class,
              because that is the one declaration the `motion-reduce:` variant
              has to be able to beat, and an inline `transition-property` would
              outrank any class — someone who asked for less motion would get
              the slide anyway. Duration and timing function are inline because
              both are built from constants at runtime, and Tailwind's scanner
              reads SOURCE TEXT: a class name interpolated from a variable
              compiles, runs, and emits no CSS at all.

              UNDER REDUCED MOTION THE VARIANT NARROWS THE LIST, IT NO LONGER
              EMPTIES IT. It was `motion-reduce:transition-none` — which was
              right while the list was geometry-only, and became wrong the
              moment `background-color` joined it, because it would have put the
              22.91-point lightness snap back for exactly the visitors least
              able to absorb it. `ThemeToggle.tsx` settles which of the two a
              colour change is, in as many words: "a COLOUR transition only… it
              moves nothing and delays no interaction", and "there is NO
              `prefers-reduced-motion` code path in this file, because there is
              no motion to reduce". Every other item in this row carries an
              UNGATED `transition-colors duration-300` and therefore already
              cross-fades under reduced motion. So the reduced branch drops
              `transform` and `width` — the only real motion — and keeps the
              colour, which is what makes the line match its siblings in both
              motion preferences instead of only one.
            */}
            {indicator ? (
              <span
                aria-hidden="true"
                /* THE HOOK FOR THE ONE-FRAME PALETTE SWAP, and the only reason
                   this element needs an attribute at all. `globals.css` uses it
                   to drop `background-color` from the list below for the
                   duration of `apply()`'s forced recalc, so the line's teal
                   jumps with every other ink in the bar while its 240ms
                   geometry slide is left completely alone.

                   THIS IS NOT A REVERSAL OF THE 2026-08-22 FIX ABOVE. That fix
                   put `background-color` INTO the list because the line snapped
                   while every sibling cross-faded — an inconsistency. The
                   siblings do not cross-fade on a palette change any more (see
                   `PALETTE_INSTANT_ATTR`), so keeping the line's colour on a
                   240ms curve would make it the odd one out in the other
                   direction, and it is measurably worse than that: the
                   #14B8A6 -> #0F766E cross-fade passes through #13AE9E, which
                   is 2.72:1 on #FDFCFA and BELOW the 3:1 non-text floor for
                   about 100ms. Both endpoints clear it (8.01:1 over the hero,
                   5.37:1 past it); only the path between them does not.

                   IT STILL CROSS-FADES ON A THEME TOGGLE, which is the other
                   thing that moves this colour and the one the 2026-08-22 note
                   is really about. That change comes from `--color-*` flipping,
                   not from `data-over-hero`, so it never sees this attribute
                   and `transition-[…,background-color]` still governs it. */
                data-nav-indicator=""
                className={
                  "absolute left-0 top-[calc(100%+6px)] h-[2px] bg-[var(--nav-accent)] " +
                  (indicator.animated
                    ? "transition-[transform,width,background-color] motion-reduce:transition-[background-color]"
                    : // A NAMED PROPERTY LIST EXPLICITLY, not "no transition
                      // class". Measured: with the class omitted the computed
                      // `transition-property` is the initial value `all`, and
                      // the inline `transition-duration` below then animates the
                      // supposedly-instant cases — a font swap or a resize would
                      // slide the line over 240ms instead of correcting it.
                      //
                      // IT WAS `transition-none` UNTIL 2026-08-22 AND THAT WAS
                      // THE COLOUR BUG'S LOAD-BEARING HALF. This branch is what
                      // the line carries on a FIRST paint — `animated` is false
                      // until something has moved — so it is the branch in
                      // force the first time a visitor scrolls past the hero,
                      // which is the only time most visitors cross it at all.
                      // `background-color` alone keeps the geometry correction
                      // instant (the reason above still holds verbatim) and
                      // gives the colour the fade it always claimed to have.
                      "transition-[background-color]")
                }
                style={{
                  width: `${indicator.width}px`,
                  transform: `translateX(${indicator.left}px)`,
                  transitionDuration: `${INDICATOR_MS}ms`,
                  transitionTimingFunction: INDICATOR_EASE,
                }}
              />
            ) : null}
          </nav>

          {/* ---------------------------------------------------------------
              RIGHT — the address, then LinkedIn.
          --------------------------------------------------------------- */}
          <div className="ml-auto flex items-center gap-md">
            {/*
              FIRST IN THE CLUSTER, so email and LinkedIn keep the hard-right
              anchor `ml-auto` gives them and the toggle sits just inside.

              `hidden md:block` IS REQUIRED AND IS ITS OWN GATE. This container
              has none — every child here gates itself (`CopyEmailButton` and
              the LinkedIn anchor `hidden md:block`, the menu button
              `md:hidden`). `NavMobileMenu` renders the sub-`md` instance, so
              dropping this in ungated would put two toggles on a 375px screen
              with nothing to catch it. Verified at 375 / 639 / 768 / 1440 /
              2560: exactly one visible at each.

              `THEME_TOGGLE_IN_NAV`, not `_ON_BASE` or `_ON_HERO`. The bar is
              fixed and crosses both grounds, so either of those is wrong on
              one of them for the whole scroll; the nav constant rides
              `--nav-fg` / `--nav-accent` and swaps with the bar. Its own
              comment carries the reasoning.
            */}
            <ThemeToggle className={`${THEME_TOGGLE_IN_NAV} pointer-events-auto hidden md:block`} />

            {/* Both entries may be absent — `navContent.ts` reads them out of
                the real contact data, and the rule there is that an absent link
                is an absent entry rather than a dead one. */}
            {NAV_EMAIL ? (
              <CopyEmailButton
                value={NAV_EMAIL.value}
                // The pre-hydration / no-JS fallback anchor. Free here, and it
                // removes the one real hole in this control: before hydration,
                // and forever with JS blocked, the bar used to show an address
                // that did nothing when clicked. Now it is a working mailto
                // until the button takes over.
                href={NAV_EMAIL.href}
                className="pointer-events-auto hidden md:block"
              />
            ) : null}

            {NAV_LINKEDIN ? (
              <a
                href={NAV_LINKEDIN.href}
                target="_blank"
                // `noopener` is what actually matters — `noreferrer` is carried
                // with it because the two are conventionally paired and the
                // referrer is worth nothing here.
                rel="noopener noreferrer"
                // NOT `ExternalLink`. That component is the INLINE treatment —
                // underlined, with a visible "opens in a new tab" note — which
                // is correct inside a paragraph and wrong for a 17px icon in a
                // chrome bar. The obligation it carries is the new-tab
                // announcement, and that is met by the label below.
                aria-label={`${NAV_LINKEDIN.label} (opens in a new tab)`}
                className="pointer-events-auto hidden text-[var(--nav-fg-dim)] transition-colors duration-300 hover:text-[var(--nav-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nav-accent)] md:block"
              >
                <LinkedInIcon className="h-[17px] w-[17px]" />
              </a>
            ) : null}

            {/* The mobile entry point. Everything the bar cannot fit at 375px
                lives behind it — the centre nav, the email, LinkedIn, the
                location line, and a SECOND copy of the theme toggle above.
                The two toggles never coexist on screen: this bar's is
                `hidden md:block` and the menu is only reachable below `md`. */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={NAV_MENU_OPEN_LABEL}
              aria-expanded={menuOpen}
              className="pointer-events-auto cursor-pointer text-[var(--nav-fg-dim)] transition-colors duration-300 hover:text-[var(--nav-fg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nav-accent)] md:hidden"
            >
              <MenuIcon open={false} className="h-[22px] w-[22px]" />
            </button>
          </div>
        </div>
      </header>

      <NavMobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavClick}
      />
    </>
  );
}

export default Navbar;
