"use client";

/**
 * `<main>`, and the 0.35s it takes a navigated page to arrive.
 *
 * Moving between `/`, `/about` and `/work` through the navbar read as a default
 * App Router swap: the indicator slid, and the document under it changed
 * between one frame and the next. This makes the change a move. It is the
 * smallest possible transition and that is deliberate — the navigation is
 * already answered by the bar's 240ms indicator, so the page's job is to stop
 * being a cut, not to perform.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THERE IS NO `template.tsx`, AND WHY THE FADE IS NOT ON `<main>` EITHER.
 *
 * The obvious mechanism is `app/(site)/(chrome)/template.tsx` wrapping
 * `{children}` in a `motion.div`. It is wrong three times over:
 *
 *   1. Rule S-6 (`docs/03_FRONTEND_SPEC.md`) forbids anything between `<body>`
 *      and the footer creating a containing block or a clipping context — no
 *      `overflow`, no `transform`, no `filter`, no `will-change: transform`. A
 *      transition wrapper is an element in exactly that position animating
 *      exactly those properties.
 *   2. `docs/02_TECHNICAL_ARCHITECTURE.md`'s page stack requires `<footer>` to
 *      be a DIRECT child of `<body>`, sibling of `<main>` — that is what makes
 *      it the `contentinfo` landmark. A template wrapper breaks that shape, and
 *      `docs/02` records that it breaks it SILENTLY.
 *   3. The stacking-context trap. `opacity < 1` creates a stacking context, so
 *      `<main>`'s `z-10` would become local to the wrapper, and the wrapper at
 *      `z-index: auto` then paints before the footer's `z-0` in DOM order. The
 *      #07090C plate shows through the entire page.
 *
 * THE FOURTH REASON IS THE ONE THAT WAS MISSED, and it is why this file does
 * not simply render `motion.main`. Rule S-6 makes `<main class="relative z-10
 * bg-base">` the ONLY thing occluding the reveal footer's plate, which is
 * `md:sticky md:bottom-0` and therefore pinned behind the page from the first
 * painted frame at every scroll position. MEASURED at 1440x900, scroll 0, on
 * both `/` and `/work`: the plate spans y=107.2 to y=900 — 792.8px of a 900px
 * viewport. Fade `<main>` and its own background fades with it, so the plate
 * composites straight through the page. In light mode it is not subtle: the
 * whole viewport goes dark and the words "Contact" and "I read everything that
 * arrives here" ghost through the project cards. Screenshot:
 * `.claude/handoff/shots/item-2-4/probe-mainOpacity50-work-light.png`.
 *
 * SO: `<main>` STAYS FULLY OPAQUE AND THE FADE GOES ON ITS CHILD.
 *
 *   - `<main>` is byte-identical to what the pages rendered before this file
 *     existed — same element, same classes, same position in the tree, still a
 *     direct sibling of `<footer>`, still `relative z-10 bg-base`. The page
 *     stack's shape is untouched and so is the occlusion guarantee.
 *   - The wrapper below is INSIDE `<main>`, so it is not on the `<body>` →
 *     `<footer>` chain that S-6 governs, and it paints inside `<main>`'s
 *     existing `z-10` stacking context — entirely above the footer's `z-0`
 *     rather than beside it. Reason 3 above is structurally impossible here.
 *   - It animates `opacity` and nothing else. Opacity creates a stacking
 *     context but NEVER a containing block, so `position: fixed` descendants
 *     (the Intro's `fixed inset-0 z-50` plate, and anything added later) are
 *     not re-parented. `transform` and `filter` would re-parent them, which is
 *     the second reason `y` is locked out below.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * OPACITY ONLY. NO `y`, NO `scale`, NO `blur`. The first reason is above. The
 * second is measured rather than stylistic: Next preserves scroll on
 * back/forward, so a translate on a page stack sitting at a restored scroll
 * position would lift the stack off the viewport bottom and expose a strip of
 * that same #07090C plate for the duration of the move. Opacity cannot move
 * anything, so it cannot uncover anything.
 *
 * `DURATION.ui` + `EASE.ui`, AND NO FOURTH CURVE. This is deliberately the
 * exact pair the navbar's active-route indicator already runs on
 * (`INDICATOR_MS = 240`, `EASE.ui`). The line and the page settle on the same
 * curve, which is what makes one click read as one gesture instead of two
 * unrelated animations. The two durations are NOT synced and must not be: 240
 * leading 350 means the chrome confirms the destination before the content
 * resolves, which is what makes the navigation feel answered. `INDICATOR_MS`
 * was derived independently from ~100px of travel; slowing it to match would
 * make the line worse to fix nothing.
 *
 * IT IS NOT ON EVERY ROUTE. `/` and `/work` fade; `/about` does not, by the
 * `fade` prop below. `/about` is the site's one deliberately quiet page and it
 * was running three concurrent motion authors on arrival — a four-unit
 * entrance, this fade, and a canvas that draws continuously. The fade is the
 * one that can go without losing anything the page is for. The cost is real and
 * is not hidden: on a client navigation the particle canvas now appears in a
 * single frame, because the entrance deliberately excludes it. That hard cut is
 * accepted, not solved.
 *
 * ENTER ONLY, AND THE FIRST APPEARANCE NEVER ANIMATES. `arrived` below is the
 * same module-scope-boolean idiom `IntroGate` uses for `played`, and it holds
 * for the same reason: a hard load or refresh instantiates a fresh module
 * graph, a client navigation reuses it. On `/` the Intro owns the first three
 * seconds and a page fade underneath it would double-fade the plate against
 * its own dissolve. There is no EXIT animation either — an exit needs
 * `AnimatePresence` holding the outgoing tree, which fights App Router scroll
 * restoration and doubles the time to a readable page.
 *
 * THE NAVBAR IS NOT IN HERE AND MUST NOT BE. It is rendered by
 * `app/(site)/(chrome)/layout.tsx`, which persists across every navigation
 * inside the group, so its entrance (`yPercent: -100 -> 0`, owned by the
 * Intro's timeline via `NAV_ENTRANCE_ATTR`) structurally CANNOT replay. That
 * placement is the safeguard; there is no guard clause to keep in sync.
 */

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";

/**
 * Once per page load, at module scope — see the header, and `IntroGate.tsx`'s
 * `played` for the same idiom with the same reasoning written out in full.
 *
 * Written in an EFFECT rather than during render, so React's double-invoked
 * render in development stays idempotent and the server never sees it flip.
 * The server cannot run effects at all, which is what guarantees that every
 * prerendered route ships its first appearance unanimated.
 */
let arrived = false;

type PageStackProps = {
  children: ReactNode;
  /**
   * REQUIRED, WITH NO DEFAULT, matching `ThemeToggle` and `ExternalLink`: the
   * surface is the call site's knowledge, not this component's. Every route
   * that renders a reveal footer must pass Rule S-6's `relative z-10 bg-base`,
   * and a default here would let a future page get them by accident and never
   * know it depends on them.
   */
  className: string;
  /**
   * REQUIRED, WITH NO DEFAULT, for the same reason `className` is and for the
   * same reason `Projects` requires `motion`: whether a page should perform on
   * arrival is the page's decision, and a default would let a future route get
   * one silently.
   *
   * `/` and `/work` pass `true`. `/about` passes `false`, and that is a
   * REVERSAL of a measured decision recorded in `docs/03_FRONTEND_SPEC.md` —
   * see that file, and `app/(site)/(chrome)/about/page.tsx`, for the argument
   * that was reversed and why. The short version: the multiplication with the
   * entrance was never the problem (0.70 composited against 0.74 page-alone at
   * ~165ms, four points), the MOTION-AUTHOR COUNT was. `/about` is the one
   * fully quiet page and it was running three concurrent authors.
   *
   * FALSE MAKES THIS COMPONENT A PLAIN `<main>` AND THAT IS THE POINT — same
   * element, same classes, same position, no `initial`, no `animate`, no
   * transition. It is NOT "a fade with duration 0": Framer would still write
   * `opacity` into the style attribute, and the `<noscript>` net in
   * `app/layout.tsx` exists precisely because that is easy to reintroduce
   * without noticing.
   */
  fade: boolean;
};

export function PageStack({ children, className, fade }: PageStackProps) {
  /*
    Captured in `useState`'s initialiser so it is read exactly once per
    instance and cannot change under a re-render. `arrived` is module state and
    is identical on both renders of a hydration pass, so this produces no
    mismatch.
  */
  const [firstAppearance] = useState(() => !arrived);

  /**
   * REDUCED MOTION GETS AN INSTANT SWAP, NOT A SHORTER FADE — and this
   * deliberately diverges from `MotionProvider`'s site-wide
   * `reducedMotion="user"` contract, which drops transform and KEEPS opacity.
   * DO NOT "FIX" IT BACK.
   *
   * That contract is about ELEMENTS entering a page the visitor can already
   * read. This is the DOCUMENT. A whole-page fade means everything on screen
   * is transiently unreadable, which is the one thing an accessibility
   * fallback must not introduce, and the softening it buys is exactly the
   * softening the preference asks a site to stop performing. Same shape of
   * argument as `ScrubReveal`'s recorded reduced-motion asymmetry.
   */
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    arrived = true;
  }, []);

  const fades = fade && !firstAppearance && !prefersReducedMotion;

  return (
    <main className={className}>
      <motion.div
        /*
          `data-page-stack`, and DELIBERATELY NOT `data-reveal`. Two mechanisms,
          two attributes, greppable apart — the same call `ScrubReveal` made for
          `data-scrub-unit`. `app/layout.tsx`'s <noscript> net covers both
          selectors; RENAME THIS AND THAT SELECTOR MUST CHANGE IN THE SAME
          COMMIT.

          Be precise about what the net is for here, because the usual reason
          does not apply. Framer writes `initial` into the server HTML, but this
          component's first appearance never animates, so `initial` is `false`
          on every prerendered route and no hidden state ships today —
          VERIFIED by loading all three routes with scripting disabled. The net
          is insurance against the guard above being loosened later: without it,
          the change that makes the first appearance fade also makes every route
          a blank page for a no-JS visitor, and nothing would report it.
        */
        data-page-stack
        initial={fades ? { opacity: 0 } : false}
        animate={fades ? { opacity: 1 } : undefined}
        transition={fades ? { duration: DURATION.ui, ease: EASE.ui } : undefined}
      >
        {children}
      </motion.div>
    </main>
  );
}

export default PageStack;
