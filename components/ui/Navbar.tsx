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
 * `app/(site)/(chrome)/layout.tsx` and renders on `/` and `/work` (and on
 * `/about` when that ships), but still never on `/projects/<slug>`. Two
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
 *      Two mitigations, in order of how much of the spec they preserve:
 *
 *      THE BAR HIDES ON SCROLL-DOWN AND RETURNS ON SCROLL-UP. While you are
 *      reading downward it is not there at all, so there is nothing to overlap;
 *      the instant you scroll up — the gesture that means "I want to navigate"
 *      — it comes back. This costs the spec nothing.
 *
 *      PAST THE HERO ONLY, IT CARRIES A SCRIM. That IS a background fill, and
 *      the spec asks for it to be flagged rather than added quietly, so it is
 *      flagged — here, in `globals.css` where the rule lives, and in
 *      `docs/06_INTRO_AND_CHROME.md` §6. It covers the one case the other two
 *      cannot: revealed by a scroll-up, mid-page, over live text. OVER THE HERO
 *      THE BAR IS STILL COMPLETELY TRANSPARENT — no fill, no blur — which is
 *      where the transparency actually reads as design rather than as a bug.
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
import { useSectionScroll } from "@/lib/hooks/useSectionScroll";

/* -------------------------------------------------------------------------
   Hide-on-scroll tuning. All three are in CSS pixels of ACCUMULATED travel in
   one direction, which is what gives the behaviour hysteresis: a bar that
   toggled on raw direction would flicker on trackpad jitter and on the tiny
   upward correction at the end of a fling.
------------------------------------------------------------------------- */
/** Downward travel before the bar leaves. */
const HIDE_AFTER = 90;
/** Upward travel before it returns. Shorter, because asking for it back should
 *  feel more responsive than losing it. */
const REVEAL_AFTER = 50;
/** Above this scroll position the bar is always up — the top of the page is
 *  its home and it must not be missing when the page first settles. */
const ALWAYS_VISIBLE_ABOVE = 140;

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
     Hide on scroll-down, return on scroll-up.

     WRITES `style.transform` DIRECTLY. This runs on every scroll frame; a
     `useState` here would re-render the whole bar — including the SVG mark and
     the Framer-animated copy control — dozens of times a second to change one
     transform.
  ----------------------------------------------------------------------- */
  const setHidden = useCallback((hidden: boolean) => {
    const el = headerRef.current;
    if (!el) return;
    el.style.transform = hidden ? "translate3d(0,-105%,0)" : "translate3d(0,0,0)";
    // Exposed so the state is inspectable in devtools and assertable in a test
    // without reading a matrix out of a computed style.
    el.dataset.hidden = hidden ? "true" : "false";
  }, []);

  useEffect(() => {
    // The menu is a full-viewport surface with the document locked behind it.
    // Retracting the bar underneath it would strand the close button.
    if (menuOpen) {
      setHidden(false);
      return;
    }

    let lastY = window.scrollY;
    let travel = 0;

    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        const dy = y - lastY;
        lastY = y;
        if (dy === 0) return;

        // Reset the accumulator whenever the direction reverses, so the
        // thresholds measure travel SINCE the turn rather than net travel.
        if (dy > 0 !== travel > 0) travel = 0;
        travel += dy;

        if (y < ALWAYS_VISIBLE_ABOVE) {
          travel = 0;
          setHidden(false);
          return;
        }
        if (travel > HIDE_AFTER) setHidden(true);
        else if (travel < -REVEAL_AFTER) setHidden(false);
      },
    });

    return () => {
      trigger.kill();
      setHidden(false);
    };
  }, [menuOpen, setHidden]);

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
        // `transition-transform` with `motion-reduce:transition-none`: someone
        // who asked for less motion still gets the overlap protection, just
        // without the slide.
        className="pointer-events-none fixed inset-x-0 top-0 z-40 transition-transform duration-[420ms] ease-out will-change-transform motion-reduce:transition-none"
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
          // IT IS THIS ELEMENT AND NOT `<header>` BECAUSE THE HEADER'S
          // `transform` IS ALREADY TAKEN. `setHidden` writes it directly on
          // every scroll frame; a second author on the same property would be
          // fighting it the first time anyone scrolled during the entrance.
          // Two elements, two transforms, nothing to arbitrate.
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
            aria-label="Sections"
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
              className={NAV_ITEM}
            >
              {NAV_ITEMS[0].label}
            </Link>

            {/* The centre icon is a route link now — `/` from anywhere. Its
                accessible name moved with it: "Back to top" was a lie the
                moment the bar appeared on a second page. */}
            <Link
              href={HOME_ROUTE}
              aria-label={NAV_HOME_LABEL}
              className="pointer-events-auto cursor-pointer text-[var(--nav-fg-dim)] transition-colors duration-300 hover:text-[var(--nav-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nav-accent)]"
            >
              <ConstellationIcon className="h-[19px] w-[19px]" />
            </Link>

            <Link
              href={NAV_ITEMS[1].href}
              onClick={(event) => handleNavClick(NAV_ITEMS[1].href, event)}
              className={NAV_ITEM}
            >
              {NAV_ITEMS[1].label}
            </Link>
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
