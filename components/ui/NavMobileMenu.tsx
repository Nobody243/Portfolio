"use client";

/**
 * The mobile navigation. Everything the bar cannot fit at 375px, plus the
 * sub-`md` half of the theme toggle.
 *
 * A NATIVE MODAL `<dialog>`, for the same four reasons `ProjectOverlay` gives:
 * `showModal()` supplies initial focus into the dialog, a real focus trap,
 * Escape-to-dismiss, and inerting of everything behind it — four things a
 * hand-rolled drawer gets wrong, and three of them invisibly.
 *
 * OPAQUE, FULL-VIEWPORT, `bg-base`, NO SCRIM — matching the project overlay
 * exactly. `globals.css` already neutralises the UA's `dialog::backdrop`
 * tint site-wide, so a translucent default cannot leak in. The consequence is
 * the same one recorded there: with no visible backdrop there is nothing to
 * click outside, so dismissal is Escape, the close control, and a nav choice.
 *
 * THE THEME TOGGLE HERE IS THE SUB-`md` INSTANCE, NOT THE ONLY ONE. The bar
 * carries its own at `md` and up (`Navbar.tsx`, first child of the right
 * cluster, `hidden md:block`); this one covers the range where that is hidden
 * and the bar has no room for it anyway. `docs/06_INTRO_AND_CHROME.md` §5 has
 * the full per-surface table.
 *
 * THE TWO NEVER COEXIST ON SCREEN, and the reason is worth stating because
 * nothing enforces it: this dialog is only reachable through a menu button
 * that is `md:hidden`, and the bar's instance only appears at `md` and up. If
 * either gate is ever removed, `/` ships two controls doing the same job with
 * no error of any kind. Test at 375 / 639 / 768 / 1440 / 2560 after touching
 * either.
 *
 * IT USES `THEME_TOGGLE_ON_BASE`, not the bar's `THEME_TOGGLE_IN_NAV`: this
 * dialog is an opaque `bg-base` surface that flips with the theme, so it is a
 * base call site like any other. The nav constant rides `--nav-*`, which is
 * scoped to `[data-nav-root]` and does not reach inside here.
 *
 * IT IS ALWAYS MOUNTED. A `<dialog>` that is only rendered while open cannot be
 * animated out, and — more importantly — `showModal()` on a freshly-mounted
 * element races the layout effect that calls it. `dialog:not([open])` is
 * `display: none` in every UA stylesheet, so an always-mounted closed dialog
 * costs nothing.
 *
 * ONE CONSEQUENCE, WHICH LOOKS LIKE A DEFECT IN A GREP AND IS NOT: on `/about`
 * and `/work` the DOM carries **two** `aria-current="page"` — one in the bar,
 * one here — and a census that counts attributes will flag it every time.
 *
 * MEASURED THROUGH THE ACCESSIBILITY TREE RATHER THAN REASONED ABOUT, on
 * 2026-08-22, via CDP `Accessibility.getFullAXTree`: the tree contains ONE link
 * per internal destination at 1440x900 (ABOUT / Home / WORK — the bar's three,
 * one of them current) and ZERO at 375x667 with this menu closed, because both
 * the closed dialog and the `hidden md:flex` cluster are `display: none` and a
 * `display: none` subtree is not in the tree. Opening the menu at 375 puts
 * exactly three there. So the announcement is never doubled at any width.
 *
 * Recorded here, and in `docs/07` §1.1, so the next census does not "fix" it by
 * conditionally rendering the dialog — which would reintroduce the
 * `showModal()` race this paragraph exists to prevent.
 */

import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { LinkedInIcon, MenuIcon } from "@/components/ui/NavIcons";
import {
  isActiveRoute,
  NAV_EMAIL,
  NAV_HOME_LABEL,
  NAV_HOME_ROUTE,
  NAV_ITEMS,
  NAV_LINKEDIN,
  NAV_LOCATION,
  NAV_MENU_CLOSE_LABEL,
} from "@/components/ui/navContent";
import {
  THEME_TOGGLE_ON_BASE,
  ThemeToggle,
} from "@/components/ui/ThemeToggle";

/** Owned by this component alone. See the block in `globals.css`. */
const SCROLL_LOCK_ATTR = "data-nav-open";
const SCROLLBAR_VAR = "--nav-scrollbar-width";

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * `showModal()` has to run in the same frame as the state change or the dialog
 * paints one frame late; a passive effect runs after the browser has already
 * had a chance to paint. The server branch exists only to silence React's SSR
 * warning — the same shape, and the same reasoning, as `ProjectOverlay`.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * EVERY CLASS HERE UNDOES A UA STYLE, none is decoration. The UA gives a modal
 * dialog `max-width: calc(100% - 6px - 2em)`, matching `max-height`,
 * `width/height: fit-content`, `margin: auto`, `overflow: auto`, a solid border
 * and `1em` of padding. Tailwind's preflight zeroes the border, margin and
 * padding; the rest is undone here.
 */
const DIALOG =
  "fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-base p-0 text-fg";

/**
 * Shared by all three entries in the list below — Home, About, Work.
 *
 * A CONSTANT RATHER THAN A REPEATED STRING because Home is rendered explicitly
 * and the other two come from a `.map()`, so the class list physically appears
 * twice in the JSX. Two copies of a focus ring is exactly the shape that drifts
 * into one entry losing it.
 *
 * NO HOVER, AND THAT IS THE SITE'S RULE RATHER THAN AN OMISSION. The bar's
 * vocabulary is dim-at-rest escalating to full on hover; these entries are at
 * `text-h3` in solid `text-fg` on an opaque surface, so there is nothing to
 * escalate from. Inventing a fourth hover treatment for "large text on its own
 * surface" is the template tell this menu otherwise avoids.
 */
const MENU_LINK =
  "cursor-pointer text-left text-h3 text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-working";

type NavMobileMenuProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Called with the entry's href and its click event, AFTER the lock has been
   * released. The parent owns what happens next — it closes the menu, and it
   * decides whether to let the link navigate or to intercept it and scroll.
   * The event is forwarded rather than swallowed precisely so it can still be
   * `preventDefault`ed there.
   */
  onNavigate: (href: string, event: ReactMouseEvent) => void;
};

export function NavMobileMenu({
  open,
  onClose,
  onNavigate,
}: NavMobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  /**
   * Release the document. Written as its own function because it is called from
   * TWO places — the effect's cleanup, and synchronously from a nav choice —
   * and both must be idempotent.
   *
   * The synchronous call is not belt-and-braces, it is required. A nav choice
   * closes the menu and scrolls in the same handler; React has not run the
   * cleanup yet at that point, so `overflow: clip` is still on `<html>` and the
   * scroll would land against a document that cannot move. Removing an
   * attribute that is already absent is a no-op, so the cleanup staying the
   * authority costs nothing.
   */
  const unlock = useCallback(() => {
    const html = document.documentElement;
    html.removeAttribute(SCROLL_LOCK_ATTR);
    html.style.removeProperty(SCROLLBAR_VAR);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!open) {
      // `close()` is what fires focus restoration back to the menu button.
      // React removing the `open` attribute would not.
      if (dialog.open) dialog.close();
      unlock();
      return;
    }

    // Measure BEFORE locking — the scrollbar has to still be there to be
    // measured. `window.innerWidth - clientWidth` is 0 on overlay-scrollbar
    // platforms (iOS, Android, macOS by default), which is correct there and is
    // why this is measured rather than assumed.
    const html = document.documentElement;
    html.style.setProperty(
      SCROLLBAR_VAR,
      `${window.innerWidth - html.clientWidth}px`,
    );
    html.setAttribute(SCROLL_LOCK_ATTR, "");
    if (!dialog.open) dialog.showModal();

    return unlock;
  }, [open, unlock]);

  const choose = useCallback(
    (href: string, event: ReactMouseEvent) => {
      unlock();
      onNavigate(href, event);
    },
    [onNavigate, unlock],
  );

  return (
    <dialog
      ref={dialogRef}
      className={DIALOG}
      aria-label="Navigation"
      // Escape fires `cancel` before `close`. Routing it through the parent's
      // state keeps React the single source of truth for `open`; letting the UA
      // close the dialog directly would leave `open` true in React and the menu
      // button stuck reporting `aria-expanded="true"`.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex h-full flex-col px-md py-sm">
        {/* The close control sits where the open control was, so the gesture
            reverses in place rather than sending the thumb somewhere new. */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label={NAV_MENU_CLOSE_LABEL}
            className="cursor-pointer text-fg/70 transition-colors duration-300 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-working"
          >
            <MenuIcon open className="h-[22px] w-[22px]" />
          </button>
        </div>

        {/*
          The sections, at heading scale rather than at the bar's caption size.
          This is a full surface, not a strip — reproducing a 12px mono bar in
          the middle of an empty phone screen would be a miniature of the
          desktop nav instead of a design for this context.
        */}
        {/*
          LINKS, NOT BUTTONS, and the `aria-label` is still "Sections" only
          because the entries still read as sections to a visitor — one of them
          is now a route. `choose` releases the scroll lock FIRST and then hands
          the event to the parent, which either lets the link navigate or
          intercepts it for an in-page scroll. The unlock cannot wait for the
          effect cleanup: `overflow: clip` is still on `<html>` at click time,
          and a scroll into a locked document goes nowhere.
        */}
        <nav aria-label="Sections" className="mt-2xl flex flex-col gap-md">
          {/*
            HOME IS RENDERED EXPLICITLY, NOT APPENDED TO `NAV_ITEMS`, and this
            entry is a REAL NAVIGATION FIX rather than a nicety.

            Until 2026-08-22 there was no way back to `/` below `md` except the
            browser's back button. The bar's centre icon — the site's only Home
            affordance — lives in the `hidden md:flex` cluster, the MS mark is
            deliberately not a link, and this menu mapped `NAV_ITEMS`, which is
            `[About, Work]`. So a phone visitor who reached `/about` or `/work`
            was stranded on a three-page site.

            WHY NOT JUST ADD IT TO THE ARRAY. `navContent.ts` states that
            `NAV_ITEMS` is fixed-arity chrome and that a third entry is a LAYOUT
            change, because the bar's centre cluster is balanced AROUND the
            icon. That is true of the bar and not of this menu, which is a
            vertical list with no symmetry to break — so Home belongs here as
            its own element, and the array keeps both its arity and its reason.

            FIRST, NOT MIDDLE. The bar's order is ABOUT · [icon] · WORK, and the
            icon's central position is a composition decision about a horizontal
            row. Reproducing it as About / Home / Work in a stacked list would
            put the site root in the middle of a list for no reason a reader
            could recover.

            `NAV_HOME_LABEL` and `NAV_HOME_ROUTE` are both imported, and the bar
            uses the same two for the same destination, so the menu cannot come
            to name it differently. `choose` is the same handler the two mapped
            entries use, so the scroll lock is released before navigation here
            exactly as it is there.
          */}
          <Link
            href={NAV_HOME_ROUTE}
            aria-current={
              isActiveRoute(NAV_HOME_ROUTE, pathname) ? "page" : undefined
            }
            onClick={(event) => choose(NAV_HOME_ROUTE, event)}
            className={MENU_LINK}
          >
            {NAV_HOME_LABEL}
          </Link>

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              /* THE SAME ANNOUNCEMENT THE DESKTOP BAR MAKES. Above `md` the
                 sliding indicator is the visual half of this and
                 `aria-current` the spoken half; below `md` the cluster is
                 `display: none` and this menu is the only navigation there is,
                 so without this a screen-reader user loses the current-page
                 signal at exactly the breakpoint where they have least context.
                 The predicate is imported rather than re-derived so the two can
                 never name different pages — see `navContent.ts`.

                 THIS COMMENT USED TO END: "THERE IS NO HOME ENTRY IN THIS MENU,
                 so on `/` nothing here is current, and that is correct rather
                 than a gap: the menu lists destinations away from where you
                 are." The premise is gone — Home is above — and the argument
                 was wrong on its own terms: a menu of "destinations away from
                 where you are" still has to list all of them, and it was
                 missing the one every visitor had already been to. */
              aria-current={isActiveRoute(item.href, pathname) ? "page" : undefined}
              onClick={(event) => choose(item.href, event)}
              className={MENU_LINK}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Everything below is bottom-anchored: the thumb reaches it, and the
            reading order still puts navigation first. */}
        <div className="mt-auto flex flex-col gap-md pb-lg">
          {/* `self-start` is load-bearing: a <button> is a flex ITEM here and
              stretches to the column's full width, and a button centres its own
              text — so without this the address sits in the middle of the
              screen, alone, looking like a heading. */}
          {NAV_EMAIL ? (
            <CopyEmailButton
              value={NAV_EMAIL.value}
              // See the bar's own instance: this is the no-JS / pre-hydration
              // mailto fallback, and `self-start` shrink-wraps the anchor
              // exactly as it shrink-wraps the button, so the swap moves
              // nothing.
              href={NAV_EMAIL.href}
              className="self-start"
            />
          ) : null}

          <div className="flex items-center justify-between">
            {NAV_LINKEDIN ? (
              <a
                href={NAV_LINKEDIN.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${NAV_LINKEDIN.label} (opens in a new tab)`}
                className="text-fg/70 transition-colors duration-300 hover:text-accent-working focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-working"
              >
                <LinkedInIcon className="h-[20px] w-[20px]" />
              </a>
            ) : (
              // Keeps the toggle hard right when LinkedIn is absent, without a
              // conditional on the flex alignment.
              <span />
            )}

            <ThemeToggle className={THEME_TOGGLE_ON_BASE} />
          </div>

          {/* The location line, which the bar drops below `sm`. It is context
              rather than navigation, so it is last and quietest — but quiet
              stops at `/70`.

              IT SHIPPED AT `/55`, WHICH FAILS. Measured 5.50:1 in dark and
              **4.02:1 in light** on `bg-base`; the AA floor for 12px text is
              4.5:1. `docs/03`'s opacity rule is explicit that `/70` is the
              floor and that anything needing to recede further needs a
              different device — size, weight, position — not less contrast.
              Light mode is the binding case again, which is the third time
              on this project: dark passed, so the value looked fine to
              whoever set it in the default theme. */}
          <span className="text-caption font-mono uppercase text-fg/70">
            {NAV_LOCATION}
          </span>
        </div>
      </div>
    </dialog>
  );
}

export default NavMobileMenu;
