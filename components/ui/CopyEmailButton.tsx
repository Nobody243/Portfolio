"use client";

/**
 * The email address as a control: click it, the address is on your clipboard.
 *
 * THE CONFIRMATION IS THE FEATURE. A copy that succeeds silently is
 * indistinguishable from a copy that failed, so the visitor either copies twice
 * or pastes nothing and assumes the site is broken. The spec calls this out by
 * name and lists three candidate treatments; this is a MASKED LABEL SWAP with a
 * drawn checkmark, and the reasoning is:
 *
 *   - A TOAST was rejected. It puts the feedback somewhere other than the thing
 *     that was clicked, needs a portal and a stacking context, and is the most
 *     template-looking of the three.
 *   - A BARE PULSE was rejected. It confirms that something happened, not that
 *     the right thing happened, and it says nothing at all to a screen reader.
 *   - THE SWAP is the site's existing vocabulary. Every reveal on this site is a
 *     masked slide out of an `overflow-hidden` box — the hero headline's lines,
 *     the section reveals — so the address sliding up and out while "Copied"
 *     slides in from below is the one option that reads as part of the design
 *     system rather than as a widget bolted onto it.
 *
 * THE TWO LABELS ARE GRID-STACKED IN ONE CELL, not absolutely positioned. That
 * makes the box size itself to the WIDER of the two strings permanently, so the
 * swap cannot shift the navbar's right-hand cluster by a pixel. Absolute
 * positioning would collapse the box to the visible label's width and produce a
 * layout jump at 0ms and again at 1800ms.
 *
 * IT IS REUSED ON THE REVEAL FOOTER'S PLATE, WHICH TOOK TWO DECOUPLINGS.
 * Neither would have errored; both would have rendered something plausible.
 *
 *   1. COLOUR. `--nav-fg`, `--nav-fg-dim` and `--nav-accent` used to be defined
 *      ONLY under `[data-nav-root]` in `app/globals.css`. Outside that scope the
 *      declarations are invalid at computed-value time and `color` silently
 *      falls back to inherited/initial — a "Copied" label rendering in the
 *      initial colour on a #07090C plate is invisible. globals.css now also
 *      defines the three under `[data-hero-palette]`, which the footer's root
 *      carries. NO NEW TOKEN: the same three variables, one more scope.
 *
 *   2a. TEXT DECORATION DOES NOT REACH THE LABELS FROM THE BUTTON, and this
 *      was found by screenshot rather than by reasoning. Passing `underline`
 *      through `className` puts it on the `<button>`, and the label lives
 *      inside `<span class="grid overflow-hidden">` — `overflow: hidden`
 *      establishes a new block formatting context, and CSS does not
 *      propagate a text decoration into one. The footer's email therefore
 *      rendered WITHOUT the underline its two sibling links carry, while
 *      the pre-hydration anchor rendered WITH it — the same control looking
 *      like two different things either side of hydration. `valueClassName`
 *      exists for exactly that: it lands on the ADDRESS, in both branches.
 *
 *   2. TYPE. `text-caption font-mono` used to be hardcoded in the class list
 *      below, and appending `text-body font-sans` through `className` is NOT a
 *      fix — Tailwind resolves equal-specificity conflicts by STYLESHEET SOURCE
 *      ORDER, not by the order of the class attribute, so it would have looked
 *      right in dev and been a coin flip in the production build. The type
 *      classes are a prop now, defaulting to the navbar's pair so both navbar
 *      call sites are unchanged.
 *
 * THE PROGRESSIVE-ENHANCEMENT `href`, WHICH RETIRES A REAL OBJECTION.
 * The old `Contact.tsx` refused a copy control on the ground that it "would be
 * INERT UNTIL HYDRATION… (or forever, with JS blocked)". That objection was correct
 * and is answered rather than overruled: with `href` supplied, this renders a
 * plain `<a href="mailto:…">` on the server and swaps to the `<button>` once
 * hydrated. WITH JS BLOCKED THE VISITOR GETS A WORKING MAILTO, NEVER A DEAD
 * CONTROL. `href` is optional so the swap is opt-in, but every call site on the
 * site passes it and a new one should too.
 *
 * `useSyncExternalStore` AND NOT `useState` + `useEffect` FOR THAT SWAP. Next
 * 16's `react-hooks/set-state-in-effect` rule hard-errors on the effect shape —
 * the same reason `useReducedMotion` is written that way and the same reason
 * `Navbar`'s palette is an attribute rather than state. The server snapshot is
 * `false`, so the HTML React hydrates against is the anchor, and the upgrade to
 * the button is a normal post-hydration re-render rather than a mismatch.
 *
 * THREE STATES, NOT TWO, AND THE THIRD IS NOT DECORATION. `navigator.clipboard`
 * is unavailable on insecure origins and can be refused by permission policy.
 * Showing "Copied" when the write rejected would be the site lying about
 * something the visitor is about to rely on. On failure the address is SELECTED
 * instead and the label says so, which leaves a working manual path.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motion } from "motion/react";

import { CheckIcon } from "@/components/ui/NavIcons";
import {
  NAV_COPY_ANNOUNCEMENT,
  NAV_COPY_CONFIRMATION,
  NAV_COPY_FALLBACK,
} from "@/components/ui/navContent";
import { DURATION, EASE } from "@/lib/animation/easing";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * How long the confirmation holds before reverting.
 *
 * Long enough to be seen if the eye was elsewhere at the moment of the click,
 * short enough that the navbar is not still congratulating itself when the
 * visitor has scrolled on. Below ~1.2s it reads as a flicker; above ~2.5s it
 * starts to feel stuck.
 */
const REVERT_MS = 1800;

/**
 * The navbar's type pair, and the default so both navbar call sites keep their
 * existing computed styles with no prop.
 */
const DEFAULT_TYPE = "text-caption font-mono";

/* -------------------------------------------------------------------------
   "Have we hydrated yet?" as an external store, so the answer costs no
   `setState` in an effect.

   `subscribe` never calls back because the answer never changes after the
   first client render — it returns the required unsubscribe function and
   nothing else. The two snapshots are constant functions rather than inline
   arrows so their identity is stable across renders; an inline
   `() => true` would be a new function every render, which
   `useSyncExternalStore` tolerates but which makes the intent less obvious.
------------------------------------------------------------------------- */
const subscribeNever = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;

type Status = "idle" | "copied" | "failed";

type CopyEmailButtonProps = {
  /** The address. Both the visible label and what lands on the clipboard —
   *  they are the same string by construction, never two literals. */
  value: string;
  /**
   * The `mailto:` for the pre-hydration / no-JS fallback anchor. OMIT IT ONLY
   * IF A DEAD CONTROL IS GENUINELY ACCEPTABLE — it never is on this site.
   * Comes from `content/contact.ts` alongside `value`, never hand-written, so
   * the address and the link can never disagree.
   */
  href?: string;
  className?: string;
  /**
   * The size + family pair. Replaces the default rather than appending to it,
   * because appending cannot win a same-specificity conflict reliably — see
   * decoupling 2 in the header.
   */
  typeClassName?: string;
  /**
   * Applied to the ADDRESS itself — in the button and in the fallback anchor,
   * so the two are indistinguishable. This is where a text decoration has to
   * go: one passed through `className` lands on the `<button>` and never
   * reaches the label, because the mask is an `overflow: hidden` box and a
   * text decoration does not cross into a new block formatting context.
   *
   * NOT APPLIED TO THE CONFIRMATION LABEL, deliberately: "Copied" is an
   * outcome, not a link, and underlining it would claim otherwise. The
   * grid-stacked box sizes to the wider STRING, and a decoration adds no
   * width, so the two labels still cannot shift each other.
   */
  valueClassName?: string;
};

/**
 * Select the address in the page, so a failed clipboard write still leaves the
 * visitor something to press Ctrl/⌘+C on.
 *
 * Guarded rather than assumed: `getSelection` returns null inside some embedded
 * contexts, and `selectAllChildren` throws on a detached node.
 */
function selectContents(el: HTMLElement | null) {
  if (!el) return;
  try {
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.selectAllChildren(el);
  } catch {
    // A failed selection on top of a failed copy is not worth escalating; the
    // label still tells the visitor what to do.
  }
}

export function CopyEmailButton({
  value,
  href,
  className,
  typeClassName = DEFAULT_TYPE,
  valueClassName,
}: CopyEmailButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const hydrated = useSyncExternalStore(
    subscribeNever,
    hydratedSnapshot,
    serverSnapshot,
  );
  const reducedMotion = useReducedMotion();
  const addressRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | null>(null);

  /* One timer, cleared on every new press and on unmount. Without the clear, a
     second click mid-confirmation inherits the first click's revert deadline
     and the label snaps back early. */
  const scheduleRevert = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setStatus("idle"), REVERT_MS);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    try {
      // `writeText` REJECTS rather than throwing synchronously, and it is also
      // absent entirely on insecure origins — so both the optional call and the
      // await have to be inside the try.
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      selectContents(addressRef.current);
      setStatus("failed");
    }
    scheduleRevert();
  }, [value, scheduleRevert]);

  const idle = status === "idle";
  const label =
    status === "failed" ? NAV_COPY_FALLBACK : NAV_COPY_CONFIRMATION;

  /* Reduced motion gets the same information with no travel: the two labels
     cross-fade in place. The confirmation is not optional — it is the point of
     the control — so this branch removes the slide, never the feedback. */
  const transition = reducedMotion
    ? { duration: DURATION.micro, ease: EASE.ui }
    : { duration: DURATION.ui, ease: EASE.ui };
  const outY = reducedMotion ? "0%" : "-115%";
  const inY = reducedMotion ? "0%" : "115%";

  /* THE FALLBACK ANCHOR, and it carries the SAME two class slots so the swap
     is invisible: identical size, family and layout classes, so nothing moves
     when the button replaces it. No `target` and no `rel` — a `mailto:` does
     not open a new tab, and announcing one that never opens is a lie. */
  if (!hydrated && href) {
    return (
      <a
        href={href}
        /* `filter(Boolean)` rather than `?? ""`: an omitted optional prop
           would otherwise leave a stray space in the attribute, which is
           harmless and looks like a bug in view-source. */
        className={[typeClassName, valueClassName, className]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      // The accessible name CONTAINS the visible text, which WCAG 2.5.3
      // requires and which a bare "Copy email" would fail: a speech-input user
      // saying "click saad at saaddev dot top" has to match something.
      //
      // It is also STABLE across all three states. Renaming the control to
      // "Copied" mid-interaction would move it out from under any voice command
      // already in flight and re-announce it as a different button.
      aria-label={`Copy email address ${value}`}
      className={[
        "group relative cursor-pointer",
        typeClassName,
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nav-accent)]",
        className ?? "",
      ].join(" ")}
    >
      {/*
        The mask. `grid` with both children in cell 1/1 is what keeps the width
        fixed; `overflow-hidden` is what makes the vertical travel read as one
        label replacing another rather than two labels drifting past each other.
      */}
      <span className="grid overflow-hidden">
        <motion.span
          className={[
            "col-start-1 row-start-1 whitespace-nowrap text-[var(--nav-fg-dim)] transition-colors duration-300 group-hover:text-[var(--nav-fg)]",
            valueClassName ?? "",
          ].join(" ")}
          animate={{ y: idle ? "0%" : outY, opacity: idle ? 1 : 0 }}
          transition={transition}
        >
          {/* The ref target for the fallback selection is this span, so what
              gets selected is exactly the address and not the whole button. */}
          <span ref={addressRef}>{value}</span>
        </motion.span>

        {/* THE ONLY `--nav-accent` TEXT IN THE BAR, and therefore the only thing
            in it held to the 4.5:1 text floor rather than the 3:1 non-text one
            — every other accent use here is an icon hover, the indicator's 2px
            line, or a focus ring. It clears that floor on every ground the bar
            can reach (5.34:1 on light `bg-base`, 5.02:1 through the scrim over
            a paragraph, 7.95–8.01:1 on both dark plates), and it does so ONLY
            because no solid dark surface ever scrolls under a SCRIMMED bar.
            `app/globals.css`, the `[data-nav-root]:not([data-over-hero])`
            block, has the measurement and the reason the guard is load-bearing.
            Do not read this colour as free. */}
        <motion.span
          className="col-start-1 row-start-1 flex items-center gap-2xs whitespace-nowrap text-[var(--nav-accent)]"
          // Hidden from the accessibility tree in BOTH directions: the button's
          // name is fixed (above) and the outcome is announced once by the live
          // region below. Leaving it exposed would give the control two names.
          aria-hidden="true"
          initial={{ y: inY, opacity: 0 }}
          animate={{ y: idle ? inY : "0%", opacity: idle ? 0 : 1 }}
          transition={transition}
        >
          {/* Only on success. A checkmark next to "Press Ctrl/⌘+C" would be
              claiming the copy worked. */}
          {status === "copied" ? (
            <motion.span className="inline-flex">
              <CheckIcon className="h-[0.9em] w-[0.9em]" />
            </motion.span>
          ) : null}
          {label}
        </motion.span>
      </span>

      {/*
        The announcement, separate from the visual swap.

        `role="status"` is an implicit `aria-live="polite"`, which is correct
        here: the visitor initiated this, so it must not interrupt, and it must
        not be missed either. The element is always in the DOM and only its TEXT
        changes — a live region that mounts at the same moment its content
        appears is frequently not announced at all, because the region did not
        exist to be observed when the change happened.
      */}
      <span role="status" className="sr-only">
        {status === "copied" ? NAV_COPY_ANNOUNCEMENT : ""}
      </span>
    </button>
  );
}

export default CopyEmailButton;
