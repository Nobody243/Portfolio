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
 *      on `bg-base`, which FLIPS (#0A0A0B dark, #FDFCFA light); and the Contact
 *      plate, dark again. One fixed colour cannot serve all of them — light
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
 *      Measured, not assumed. Over the hero: `hero-fg` at 72% composites to
 *      ~8.6:1 on `hero-surface`, `hero-accent` is 8.00:1. Past it: `fg` at 72%
 *      is ~9:1 on dark `base` and ~8:1 on light, and `accent-working` is 7.95:1
 *      dark / 5.34:1 light. Every one of those clears AA for the 12px mono the
 *      bar is set in.
 *
 *   2. OVERLAP. Adaptive colour fixes contrast against the BACKGROUND. It does
 *      nothing about body text passing UNDERNEATH a fixed bar, and that turned
 *      out to be the real problem rather than the theoretical one: over the
 *      About section the centre cluster lands on a paragraph and both texts
 *      become unreadable. It was screenshotted, not predicted.
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
import { useCallback, useEffect, useRef, useState } from "react";
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
import { HERO_SECTION_ID } from "@/components/hero/heroContent";
import { NAV_ENTRANCE_ATTR } from "@/lib/animation/handoff";
import { ScrollTrigger } from "@/lib/animation/gsap";
import { EASE } from "@/lib/animation/easing";
import { useSectionScroll } from "@/lib/hooks/useSectionScroll";

/**
 * 140px — and the name is now larger than the job.
 *
 * It was hide-on-scroll's "never hide above this" threshold. That behaviour is
 * gone (see the header comment), and the ONE remaining reader is the `overHero`
 * palette effect below, which uses `ALWAYS_VISIBLE_ABOVE / 2` = 70px as the
 * boundary the hero's bottom edge has to cross. It appears there TWICE — once
 * in the up-front check, once in the ScrollTrigger's `start` — and the whole
 * value of keeping it a named constant is that those two cannot drift apart.
 *
 * DELETING IT WITH THE HIDING WOULD HAVE BROKEN THE PALETTE SWAP, which is a
 * different feature that happened to borrow the number.
 *
 * RENAMING IT IS FINE, BUT ONLY TOGETHER WITH DERIVING IT. 70px is meant to
 * stand in for the bar's bottom edge, and the bar MEASURES 59px at `sm` and up.
 * That number is `py-md` × 2 = 42 plus SEVENTEEN, not plus the 19px centre
 * icon: the centre cluster is `position: absolute` and therefore out of flow,
 * so the row's height comes from the tallest IN-FLOW child, which is the 17px
 * MS mark. 70 ≠ 59, so a name like `NAV_BOTTOM_EDGE` would assert an identity
 * the code cannot back.
 */
const ALWAYS_VISIBLE_ABOVE = 140;

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

/** The one route with a hero on it, and the centre icon's destination. */
const HOME_ROUTE = "/";

/**
 * An in-page target, or `null` if following the link is the right thing to do.
 *
 * `NAV_ITEMS` holds full hrefs — `/#trajectory` and `/work` — so every entry
 * works from every page the bar appears on. But an anchor into Home, clicked
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
     that is where the bar starts; on `/work` it ships absent, so the past-hero
     palette and its scrim are correct from the first painted frame rather than
     from the first effect. After mount the effect below is the ONLY author —
     which is why this is `useState`-with-an-initialiser and not a value
     recomputed from `pathname` on every render. The bar is mounted by the
     `(chrome)` layout and survives client navigation between `/` and `/work`,
     so a re-rendered attribute would fight the ref-written one; worse, during
     an open project overlay the pathname is `/projects/<slug>` while Home is
     still mounted BEHIND it, hero and all.
  ----------------------------------------------------------------------- */
  const [initialOverHero] = useState(() => pathname === HOME_ROUTE);

  /* -----------------------------------------------------------------------
     RE-RUNS ON EVERY ROUTE CHANGE, and that dependency is load-bearing rather
     than tidy. The bar is layout-mounted now, so it does NOT remount when Home
     gives way to `/work`. With `[]` deps the ScrollTrigger created against
     Home's hero would outlive the element it measures, and `/work` would keep
     whatever palette the visitor left Home with — the hero palette, if they
     clicked WORK from the top of the page.

     DOM PRESENCE, NOT `pathname`, DECIDES. `pathname` says when to re-check;
     `getElementById` says what is actually on the page. The two differ in
     exactly one case and it matters: with a project overlay open the pathname
     is `/projects/<slug>` while Home — hero included — is still mounted behind
     the dialog, and the bar should keep the palette it had.
  ----------------------------------------------------------------------- */
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const setOverHero = (over: boolean) => {
      if (over) el.setAttribute("data-over-hero", "");
      else el.removeAttribute("data-over-hero");
    };

    const hero = document.getElementById(HERO_SECTION_ID);
    if (!hero) {
      setOverHero(false);
      return;
    }

    // SET THE STATE ONCE, UP FRONT, from where the page actually is. The
    // trigger below only fires on CROSSING the boundary, so without this a
    // navigation that arrives already scrolled past the hero — closing an
    // overlay opened from the gallery, say — would sit on the wrong palette
    // until the visitor happened to scroll back up and down again. The
    // comparison mirrors `start` below exactly: over the hero for as long as
    // its bottom edge is still below the bar.
    setOverHero(hero.getBoundingClientRect().bottom > ALWAYS_VISIBLE_ABOVE / 2);

    // ScrollTrigger rather than a bare IntersectionObserver: it is already
    // bound to Lenis site-wide, and one scroll authority beats two.
    //
    // The boundary is the hero's BOTTOM reaching the bar's bottom edge, not the
    // viewport top — otherwise the palette would swap while the bar is still
    // physically over the last strip of hero surface.
    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: `bottom top+=${ALWAYS_VISIBLE_ABOVE / 2}`,
      onEnter: () => setOverHero(false),
      onLeaveBack: () => setOverHero(true),
    });

    return () => trigger.kill();
  }, [pathname]);

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
        className="pointer-events-none fixed inset-x-0 top-0 z-40"
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
          // above the viewport as the hero expands — one timeline, two tweens,
          // same start, same duration, because `docs/07` §1 and §3 step 6 both
          // ask for one beat rather than two adjacent ones.
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

              The hover gesture — the two letters part slightly and close again
              — is the Intro's own contraction played as a two-frame quotation.
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
              variable every other control in the bar uses means the line
              cross-fades with them for free.

              IT DOES NOT EXIST BELOW `md`, and needs no gate of its own to
              achieve that: the cluster it lives in is `hidden md:flex`, so the
              whole thing is `display: none` there and `NavMobileMenu` handles
              navigation. Do NOT reimplement it inside the menu.

              THE TRANSITION IS SPLIT ACROSS `className` AND `style`, AND THE
              SPLIT IS NOT ARBITRARY. Only `transition-property` is a class,
              because that is the one declaration `motion-reduce:transition-none`
              has to be able to beat, and an inline `transition-property` would
              outrank any class — someone who asked for less motion would get
              the slide anyway. Duration and timing function are inline because
              both are built from constants at runtime, and Tailwind's scanner
              reads SOURCE TEXT: a class name interpolated from a variable
              compiles, runs, and emits no CSS at all. With
              `transition-property: none` from the reduced-motion class, the two
              inline values are inert, which is the whole point.
            */}
            {indicator ? (
              <span
                aria-hidden="true"
                className={
                  "absolute left-0 top-[calc(100%+6px)] h-[2px] bg-[var(--nav-accent)] " +
                  (indicator.animated
                    ? "transition-[transform,width] motion-reduce:transition-none"
                    : // `transition-none` EXPLICITLY, not "no transition class".
                      // Measured: with the class omitted the computed
                      // `transition-property` is the initial value `all`, and
                      // the inline `transition-duration` below then animates the
                      // supposedly-instant cases — a font swap or a resize would
                      // slide the line over 240ms instead of correcting it.
                      "transition-none")
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
