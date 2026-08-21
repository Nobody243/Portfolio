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
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { LinkedInIcon, MenuIcon } from "@/components/ui/NavIcons";
import {
  NAV_EMAIL,
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

type NavMobileMenuProps = {
  open: boolean;
  onClose: () => void;
  /** Called with a section id AFTER the lock has been released. */
  onNavigate: (targetId: string) => void;
};

export function NavMobileMenu({
  open,
  onClose,
  onNavigate,
}: NavMobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
    (targetId: string) => {
      unlock();
      onNavigate(targetId);
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
        <nav aria-label="Sections" className="mt-2xl flex flex-col gap-md">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.targetId}
              type="button"
              onClick={() => choose(item.targetId)}
              className="cursor-pointer text-left text-h3 text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-working"
            >
              {item.label}
            </button>
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
            <CopyEmailButton value={NAV_EMAIL.value} className="self-start" />
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
              rather than navigation, so it is last and quietest. */}
          <span className="text-caption font-mono uppercase text-fg/55">
            {NAV_LOCATION}
          </span>
        </div>
      </div>
    </dialog>
  );
}

export default NavMobileMenu;
