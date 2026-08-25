"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ReactLenis, useLenis } from "lenis/react";

import { DURATION, EASE } from "@/lib/animation/easing";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * The intercepted project overlay — Ticket 6b. Tier 2 gesture into Tier 3.
 *
 * ------------------------------------------------------------------------
 * WHAT IT IS.
 * ------------------------------------------------------------------------
 * A full-viewport, opaque `<dialog>` on `bg-base` that renders the SAME
 * `ProjectDetailFrame` the real route renders, so the two paths cannot drift.
 * It receives that frame as `children` from the intercepting route, which is a
 * server component — that is what keeps `<ProjectDetail>` and SNA's
 * ~1,400-character description on the server. If this file ever renders
 * `<ProjectDetailFrame>` itself, the whole detail page moves into the client
 * bundle and `ProjectDetail.tsx`'s stated contract breaks silently.
 *
 * ------------------------------------------------------------------------
 * NO SCRIM, NO DIMMING LAYER, NO BACKDROP CLICK. Decided, not omitted.
 * ------------------------------------------------------------------------
 * The overlay is opaque and covers the viewport, so a scrim would tint
 * nothing — and the site ships no scrim, radius, shadow or backdrop-blur token
 * (`app/globals.css` states all four absences). Inventing one for a surface
 * that is already opaque is not a trade this ticket makes. The consequence is
 * stated rather than hidden: THERE IS NO VISIBLE BACKDROP TO CLICK. Dismissal
 * is Escape, the Close control (top and bottom), and the browser Back button —
 * three exits, all keyboard-reachable.
 *
 * ------------------------------------------------------------------------
 * IT IS NOT A CENTRED SHEET, AND THAT IS RULE S-1.
 * ------------------------------------------------------------------------
 * "Nothing on this site is ever a centred content column." A centred modal card
 * would also shrink the cover, which would destroy the geometry parity
 * `ProjectDetailFrame` exists to guarantee. Full viewport, same spine, same
 * insets, same vertical rhythm as the route.
 *
 * ------------------------------------------------------------------------
 * THE PLATFORM DOES THE MODAL WORK. DO NOT HAND-ROLL ANY OF IT.
 * ------------------------------------------------------------------------
 * `dialog.showModal()` supplies, for free, the four things a hand-written
 * modal gets wrong: initial focus into the dialog, a real focus trap,
 * inerting of everything behind it (out of the tab order AND out of the
 * accessibility tree), and — the one that matters most — focus restoration to
 * the element that was focused before `showModal()`, which is the project
 * card's stretched `<Link>`. This component never holds a ref to that link.
 *
 * There is no `aria-modal` here on purpose: `showModal()` implies it, and
 * hand-writing it is how it ends up out of sync with the element's actual
 * state.
 *
 * F8, recorded because it is a real dependency: the frame renders a SECOND
 * `<ThemeToggle>` while the homepage's own toggle is still in the DOM behind
 * the dialog. That is safe ONLY because a modal `<dialog>` inerts the
 * background. It would be a duplicate control and a duplicate a11y node if
 * this were ever switched from `showModal()` to the `open` attribute.
 *
 * ------------------------------------------------------------------------
 * MOTION BUDGET, IN FULL: one uniform scale, one translate, one opacity fade.
 * ------------------------------------------------------------------------
 * The scale and translate are the cover's `layoutId` morph and live in
 * `CoverFrame`. The fade is the surface below, `DURATION.ui` (0.35s) with
 * `EASE.ui`. No spring — `MotionProvider`'s header used to predict one, and it
 * was rejected: a spring's overshoot would push the cover past its final rect,
 * visibly, against the `<h1>`'s fixed left edge one row below, and it would add
 * a fourth curve family to a three-ease system. No stagger (`STAGGER.card`
 * stays unused), no 3D, no GSAP, no scroll-linked value, no parallax, no drag.
 *
 * REDUCED MOTION: everything that makes this work is non-motion —
 * `showModal()`, the scroll lock, focus, Escape, `router.back()`. Only the
 * opacity fade animates, and `MotionConfig reducedMotion="user"` keeps opacity
 * while dropping transform and layout. So under the OS setting the overlay
 * opens and closes correctly and the cover simply appears at its final rect.
 * No second code path is written for it anywhere in this file.
 */

/**
 * `close` is delivered by context rather than as a prop, and that is forced by
 * the architecture rather than chosen for elegance.
 *
 * The close button is created by the INTERCEPTING ROUTE (a server component)
 * and handed to `ProjectDetailFrame` as its `affordance`, so that the frame can
 * stay a server component. A server component cannot pass a function to a
 * client component, so the button cannot receive `close` as a prop. Context
 * works because context is a RUNTIME TREE concern: the button element is
 * rendered inside this provider, whatever module created it.
 *
 * `null` is the default rather than a no-op function, so a `<OverlayCloseButton
 * />` rendered outside an overlay is inert and detectable rather than silently
 * doing nothing.
 */
const OverlayCloseContext = createContext<(() => void) | null>(null);

/** Read by `OverlayCloseButton`. Returns `null` outside an overlay. */
export function useOverlayClose() {
  return useContext(OverlayCloseContext);
}

/**
 * `useLayoutEffect` ON THE CLIENT, `useEffect` ON THE SERVER — and the reason is
 * the morph, not tidiness.
 *
 * `dialog:not([open])` is `display: none` in every UA stylesheet. `showModal()`
 * therefore has to run BEFORE Framer measures the cover's destination rect,
 * because a `display: none` element measures as a zero box and the morph would
 * start from nothing. A passive `useEffect` runs after the browser has already
 * had a chance to paint and after Motion's read step; a layout effect runs
 * synchronously after mutation and before either. It is still "an effect, not
 * during render", which is the actual requirement for `showModal()`.
 *
 * The server branch exists only to silence React's SSR warning. This subtree is
 * prerendered as part of the intercepting route's RSC payload even though that
 * payload is only ever consumed by a client navigation.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The dialog element itself.
 *
 * EVERY CLASS HERE UNDOES A UA STYLE, none is decoration. The UA gives a modal
 * dialog `max-width: calc(100% - 6px - 2em)`, `max-height` the same,
 * `width/height: fit-content`, `margin: auto`, `overflow: auto`, a solid border,
 * `1em` of padding and `background-color: Canvas` / `color: CanvasText`.
 * Tailwind's preflight already zeroes the border, margin and padding via its
 * universal reset; the rest is undone here.
 *
 * `bg-transparent` IS DELIBERATE AND IS NOT AN OVERSIGHT. The opaque surface is
 * the `motion.div` inside, because the surface is the thing that fades. Putting
 * `bg-base` here as well would give the overlay a background that never
 * animates, and the fade would do nothing.
 *
 * `overflow-hidden` because the inner container is the one and only scroller.
 * No radius, no shadow, no border — none of those tokens exist.
 */
const DIALOG =
  "fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-fg";

/**
 * The overlay's scroll container.
 *
 * `data-lenis-prevent` IS LOAD-BEARING AND MUST NOT BE REMOVED. It is not a
 * nicety about nested smooth scroll — without it the overlay does not scroll
 * with a mouse wheel at all. Read from `lenis`'s source: the root instance
 * binds its wheel listener to `window`, and when it is STOPPED it calls
 * `event.preventDefault()` on every cancellable wheel event in the document,
 * including events over this container. The `data-lenis-prevent` check runs
 * BEFORE that branch and returns early, which is the only thing that lets the
 * default scroll action survive. `LenisProvider` stops the root instance while
 * the overlay is open (see below), so this is exactly the situation.
 *
 * `overscroll-contain` stops a wheel gesture that reaches the end of this
 * container from chaining to the document behind it. `lenis.css` also applies
 * `overscroll-behavior: contain` to `[data-lenis-prevent]`, but only while the
 * root instance carries `lenis-smooth`, so the utility is what makes it hold
 * under reduced motion too.
 *
 * `overflow-y-auto` means this element is a NATIVE scroller in its own right.
 * That is the safety net: if the nested Lenis instance below fails to bind for
 * any reason, the overlay still scrolls, just without smoothing.
 */
const SCROLLER = "h-full w-full overflow-y-auto overscroll-contain";

export function ProjectOverlay({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const lenis = useLenis();
  const reducedMotion = useReducedMotion();

  /**
   * The overlay owns its own open state, and the URL deliberately lags behind
   * it.
   *
   * `router.back()` on click would unmount this slot IMMEDIATELY — App Router
   * does not wait for an exit animation — so there would be no fade at all.
   * Instead `close()` flips this to `false`, `AnimatePresence` runs the exit,
   * and only `onExitComplete` closes the dialog and pops the history entry. For
   * the ~350ms of the exit the URL is still `/projects/<slug>`, which is
   * correct: the content is still on screen.
   *
   * WHAT THIS DOES *NOT* DO, STATED PLAINLY BECAUSE THE PLAN CLAIMED OTHERWISE.
   * ticket-6b-plan.md §D7 argued that holding open state also avoids an
   * unwanted reverse morph — the card's `layoutId` element is still mounted
   * behind the dialog, so when the lead disappears Motion projects the card
   * from the overlay's rect down to the grid. Reading Motion's projection
   * source says the deferral MOVES that projection rather than removing it:
   * `AnimatePresence` keeps the cover mounted for the whole exit, so the
   * promotion fires when the fade finishes, on a gallery that is by then fully
   * visible. Whether that reads as "the page shrinks back into the card" or as
   * a snap is a judgement only a browser can make — see the plan's V6, and note
   * that the same measurement now applies to the ORDINARY Close path, not just
   * to browser Back.
   *
   * IF IT LOOKS WRONG, the two named fallbacks in order of preference are: drop
   * the exit animation entirely and call `router.back()` straight out of
   * `close()` (a hard cut, no reverse morph at all, one line), or shorten the
   * fade so the two beats overlap. Do not reach for a new duration constant.
   */
  const [open, setOpen] = useState(true);

  /**
   * Releases everything the open sequence took: the document scroll lock, the
   * scrollbar compensation, and the root Lenis instance.
   *
   * IDEMPOTENT ON PURPOSE. It runs on the normal close path (immediately after
   * `dialog.close()`, so the compensating `padding-right` is gone before the
   * page behind is visible again) and again from the effect cleanup, which is
   * what covers the browser-Back path where `close()` never runs.
   */
  const release = useCallback(() => {
    const html = document.documentElement;
    html.removeAttribute("data-overlay-open");
    html.style.removeProperty("--overlay-scrollbar-width");
    lenis?.start();
  }, [lenis]);

  /**
   * OPEN: measure, lock, then show. The order matters — the scrollbar width has
   * to be read while the scrollbar is still there.
   *
   * THE LOCK IS THREE THINGS, NOT ONE, AND ALL THREE ARE NEEDED:
   *
   *   1. `lenis.stop()`. Null-guarded, because under reduced motion
   *      `LenisProvider` does not instantiate Lenis at all and `useLenis()`
   *      returns nothing.
   *   2. `data-overlay-open` on `<html>`, which `app/globals.css` turns into
   *      `overflow: clip`. THIS is the branch that stops NATIVE scrolling —
   *      `LenisProvider` sets `syncTouch: false`, so touch scrolling is native
   *      and `lenis.stop()` does not touch it. A Lenis-only lock is broken on
   *      every phone. It is also the entire lock under reduced motion. And it
   *      is what actually stops the wheel behind a `<dialog>`, since Chrome does
   *      not reliably block document scrolling behind a modal on its own.
   *   3. The measured scrollbar compensation. Removing the scrollbar widens the
   *      viewport by ~15px on Windows and Linux, which shifts every centred
   *      `max-w-[1440px]` container. `window.innerWidth -
   *      document.documentElement.clientWidth` is 0 on overlay-scrollbar
   *      platforms (macOS, iOS, Android), so nothing moves there.
   *
   * THE DOCUMENT'S SCROLL OFFSET IS NEVER TOUCHED. No `scrollTo(0)`, no
   * `position: fixed` body swap. That is what makes closing return the gallery
   * to exactly where it was, which is in turn what makes the reverse morph land
   * on the right card.
   *
   * The cleanup is the safety net for an unmount that did not go through
   * `close()` — pressing browser Back with the overlay open. `dialog.close()`
   * there is what fires focus restoration; React removing an open modal dialog
   * from the DOM does not. The cost is a hard cut with no exit animation on
   * that one path, which is the documented trade.
   */
  useIsomorphicLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const html = document.documentElement;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    html.style.setProperty("--overlay-scrollbar-width", `${scrollbarWidth}px`);
    html.setAttribute("data-overlay-open", "");

    if (!dialog.open) dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
      html.removeAttribute("data-overlay-open");
      html.style.removeProperty("--overlay-scrollbar-width");
    };
  }, []);

  /**
   * Separate from the effect above because `useLenis()` can return `undefined`
   * on the first render and a real instance a tick later; keying this on the
   * instance means the stop still happens when it arrives, and the matching
   * `start()` still happens on unmount.
   */
  useEffect(() => {
    if (!lenis) return;
    lenis.stop();
    return () => {
      lenis.start();
    };
  }, [lenis]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  /**
   * The end of the close sequence. `dialog.close()` first, because that is what
   * restores focus to the card; then the lock is released before the page
   * behind becomes visible; then the history entry pops.
   *
   * `router.back()` RATHER THAN `router.push(...)`: back preserves the
   * gallery's scroll offset AND returns to whichever gallery you came from,
   * which a fixed destination cannot. There are two of them now — Home's
   * featured set and the full archive at `/work`. CCN and SNA were reachable
   * ONLY from `/work` until 2026-08-25, when `/projects` shipped and listed all
   * five; they now have two in-app entry points like everything else, and the
   * sentence this replaces claimed otherwise. The reasoning around it is
   * unaffected — it is about which page a morph starts from, and both pages
   * render a cover that the morph can start from.
   *
   * THE GUARANTEE IS WEAKER THAN IT WAS, AND THE MECHANISM IS UNAFFECTED. This
   * used to say the history was guaranteed to contain `/`. What is still
   * guaranteed is that the previous entry is a page inside this app, because a
   * client navigation from inside it is the only way to reach an intercepted
   * view at all — a hard load of `/projects/<slug>` renders the real route and
   * never mounts this component. Which page that is is no longer knowable here,
   * and `back()` does not need to know.
   *
   * KNOWN HAZARD, AND IT IS THE ONE TO TEST FIRST (plan V3): if
   * `onExitComplete` never fires, the URL is stranded at `/projects/<slug>`
   * with nothing on screen. It fires here because the exit is an opacity tween,
   * and `reducedMotion="user"` keeps opacity animations — it only drops
   * transform and layout. If a reduced-motion round trip ever hangs, the fix is
   * a timeout fallback around this call, and it is deliberately NOT written
   * pre-emptively.
   */
  const handleExitComplete = useCallback(() => {
    dialogRef.current?.close();
    release();
    router.back();
  }, [release, router]);

  const surface = (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {open ? (
        <motion.div
          key="overlay-surface"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.ui, ease: EASE.ui }}
          className="h-full w-full bg-base"
        >
          {/*
            NESTED LENIS, NOT THE ROOT ONE. `<ReactLenis>` without `root`
            renders its own wrapper/content pair and drives that wrapper's
            native scroll, so this is smoothing layered on top of a scroller
            that already works. CLAUDE.md asks for smoothness across the ENTIRE
            site regardless of tier, and a natively-scrolling overlay inside a
            Lenis-scrolling site is a felt seam on the one transition this
            ticket exists to sell.

            SKIPPED ENTIRELY UNDER REDUCED MOTION, mirroring `LenisProvider`'s
            own branch. The two branches emit slightly different DOM (Lenis adds
            one wrapper div), which `useReducedMotion`'s header warns can become
            a hydration mismatch — that warning does not bind here, because this
            subtree is never hydrated from server HTML. Interception applies to
            client navigations only, so the overlay always MOUNTS on the client,
            where `useSyncExternalStore` reads the real value on the first
            render.

            NAMED FALLBACK if the nested instance ever fights the top layer:
            delete the `<ReactLenis>` branch and keep the plain one. Both
            already carry `SCROLLER`, so the overlay loses smoothing and nothing
            else. Do not spend more than one attempt on this — it is the least
            valuable moving part in the ticket.
          */}
          {reducedMotion ? (
            <div className={SCROLLER} data-lenis-prevent>
              {children}
            </div>
          ) : (
            <ReactLenis
              className={SCROLLER}
              data-lenis-prevent
              options={{
                lerp: 0.1,
                duration: 1.2,
                smoothWheel: true,
                touchMultiplier: 2,
                syncTouch: false,
              }}
            >
              {children}
            </ReactLenis>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <OverlayCloseContext.Provider value={close}>
      {/*
        `onCancel` WITH `preventDefault` IS THE SINGLE HIGHEST-RISK LINE IN THIS
        TICKET. Escape fires the dialog's `cancel` event, whose default action
        closes the dialog IMMEDIATELY. If that is allowed to happen, the dialog
        vanishes, the exit animation never runs, `onExitComplete` never fires,
        `router.back()` is never called — and the user is left on
        `/projects/<slug>` looking at the homepage. Preventing the default and
        routing Escape through our own `close()` is what makes the keyboard path
        identical to the button path.

        `aria-labelledby="project-title"` points at the `<h1>` `ProjectDetail`
        already renders and already labels its own `<article>` with. Only one
        project is ever rendered at a time, so the id is unique. The resulting
        nested labelled region (an `<article>` with the same label inside the
        dialog) is slightly redundant in a screen-reader rotor and is accepted:
        the alternative is adding a prop to a shipped component purely to serve
        a transition.

        NO `autoFocus` ANYWHERE. Two reasons, and the first is a bug rather than
        a preference. (1) `ProjectDetailFrame` renders the affordance TWICE, so
        an `autoFocus` on the close button would be on both instances; React
        applies `autoFocus` by calling `.focus()` during commit, so the BOTTOM
        instance would win and the overlay would open scrolled to its foot.
        (2) It is unnecessary: with no autofocus candidate, `showModal()`'s own
        focusing steps focus the first focusable descendant, and the top Close
        button is first in DOM order. The platform rule and the intended result
        already agree.
      */}
      <dialog
        ref={dialogRef}
        aria-labelledby="project-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        className={DIALOG}
      >
        {surface}
      </dialog>
    </OverlayCloseContext.Provider>
  );
}

export default ProjectOverlay;
