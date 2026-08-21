"use client";

/**
 * `/about`'s primary control — View CV — and the modal it opens.
 *
 * THE ONLY CLIENT BOUNDARY ON THE PAGE besides the particle canvas. `/about`
 * is otherwise a server component holding one paragraph and two links, and it
 * stays that way: nothing else here needs state.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TWO PATHS, AND THE MOBILE ONE NEVER MOUNTS THE MODAL AT ALL.
 * ─────────────────────────────────────────────────────────────────────────
 * `docs/07_SITE_RESTRUCTURE.md` §6 and §7 both state the exception: inline PDF
 * rendering is unreliable on mobile — iOS Safari commonly forces a download
 * instead of displaying, and an `<iframe>` pointed at a PDF there renders a
 * blank rectangle with no error. So below 768px this renders a plain anchor to
 * the file and the dialog is never constructed.
 *
 * AN `<a>` RATHER THAN A `<button>` THAT CALLS `window.open`. The two are not
 * equivalent on the platform this branch exists for: `window.open` is subject
 * to popup heuristics and returns null when blocked, silently, with no
 * fallback; a real link with `target="_blank"` is never blocked, can be
 * long-pressed, and is the affordance a mobile browser's own UI is built
 * around. The visible dressing is identical, so the swap is invisible.
 *
 * THE BREAKPOINT IS READ WITH `matchMedia`, NOT `innerWidth`, and it is read
 * in an effect — so the server renders the desktop branch and a phone swaps to
 * the anchor on hydration. Both elements carry the same class string and the
 * same label, so nothing moves. The listener is kept live because a desktop
 * window CAN be dragged below 768px with the modal open, and when that happens
 * the modal is closed rather than left rendering a PDF frame the branch says
 * should not exist.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE PLATFORM DOES THE MODAL WORK. NOTHING HERE IS HAND-ROLLED.
 * ─────────────────────────────────────────────────────────────────────────
 * `dialog.showModal()` supplies initial focus, a real focus trap, inerting of
 * the page behind (out of the tab order AND out of the accessibility tree),
 * and Escape. `ProjectOverlay.tsx` states this rule for the site and this file
 * follows it rather than re-deriving it.
 *
 * NO HAND-WRITTEN `aria-modal` OR `role="dialog"`, AND THAT IS A DELIBERATE
 * DEPARTURE FROM THE LETTER OF `.claude/handoff/about-design.md` §6, which
 * lists both. `showModal()` IMPLIES both — a modal `<dialog>` is already
 * exposed as `role=dialog` with `aria-modal=true` — and `ProjectOverlay.tsx`
 * records the site's rule in as many words: *"There is no `aria-modal` here on
 * purpose: `showModal()` implies it, and hand-writing it is how it ends up out
 * of sync with the element's actual state."* The design's requirement is that
 * the thing be exposed as a labelled modal dialog; the platform delivers
 * exactly that, and writing the attributes on top would be the one way to make
 * them wrong later. The label is real and explicit: `aria-labelledby` points at
 * the modal's own heading.
 *
 * FOCUS RETURN IS EXPLICIT, NOT LEFT TO THE PLATFORM, and this is the half of
 * a modal most often missed. `dialog.close()` does restore focus to whatever
 * was focused before `showModal()` — but "whatever was focused" is not reliably
 * the trigger: Safari does not focus a `<button>` on click, so on that engine
 * the pre-open activeElement is `<body>` and the restore lands nowhere. The
 * effect below focuses the trigger by ref instead, keyed on `open` going false.
 *
 * IT FIRES AFTER THE DIALOG IS GONE, WHICH IS WHY IT IS AN EFFECT AND NOT A
 * LINE IN `close()`. Calling `.focus()` on the trigger while the dialog is
 * still open does nothing at all — the page behind a modal dialog is inert and
 * cannot take focus. React runs an unmounting child's effect cleanup before
 * the parent's effects, so by the time this runs the dialog is detached.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NO SCRIM, AND IT IS A SITE RULE RATHER THAN AN OMISSION. `app/globals.css`
 * ships `dialog::backdrop { background: transparent }` and states that this
 * site has deliberately no scrim. §6 of the design specifies the modal's
 * surface exhaustively — `bg-base`, a `/40` accent border, square, capped at
 * `min(90vw, 900px)` x `min(90dvh, 1100px)` — and lists no dimming. The
 * `<dialog>` element itself is stretched to the full viewport so that a click
 * anywhere outside the panel lands on it and closes; that is what "backdrop
 * click" means here, since `::backdrop` itself never receives events.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ABOUT_BUTTON_PRIMARY,
  ABOUT_BUTTON_QUIET,
  ABOUT_BUTTON_SECONDARY,
} from "@/components/about/aboutButtonStyles";
import {
  ABOUT_PAGE_CV_CLOSE_LABEL,
  ABOUT_PAGE_CV_DOWNLOAD_LABEL,
  ABOUT_PAGE_CV_FILENAME,
  ABOUT_PAGE_CV_FRAME_TITLE,
  ABOUT_PAGE_CV_HREF,
  ABOUT_PAGE_CV_LABEL,
  ABOUT_PAGE_CV_MODAL_TITLE,
} from "@/components/about/aboutPageContent";
import { NEW_TAB_NOTE } from "@/components/ui/ExternalLink";

/**
 * The mobile branch, as a media query.
 *
 * `767.98px` RATHER THAN `767px`: viewport widths are fractional on scaled
 * displays and on Windows at non-integer zoom, and `(max-width: 767px)` leaves
 * 767.5px matching NEITHER branch of a `767 / 768` pair. This is the standard
 * off-by-a-hundredth guard, and it makes the boundary exactly §6's "<768px".
 *
 * IT IS THE SAME NUMBER AS `ParticleGrid`'s `INTERACTIVE_MIN_WIDTH` and is
 * NOT imported from it, deliberately. That constant means "this viewport has
 * no hover"; this one means "this engine cannot be trusted to render a PDF
 * inline". They agree today and are about different things, so tying them
 * together would make one of them move for the other's reason.
 */
const COMPACT_QUERY = "(max-width: 767.98px)";

/** The heading's id, and the dialog's accessible name. One dialog exists at a
 *  time on this page, so a literal id is safe. */
const MODAL_TITLE_ID = "about-cv-modal-title";

export function CvAction() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  /** Tracks whether the modal has been open, so the focus-return effect fires
   *  on the close transition only and never on first mount. */
  const hasOpened = useRef(false);

  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_QUERY);
    const sync = () => {
      setCompact(media.matches);
      // A window dragged narrow with the modal open: close it rather than keep
      // a frame alive on the branch that is not supposed to have one.
      if (media.matches) setOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      return;
    }
    if (!hasOpened.current) return;
    hasOpened.current = false;
    triggerRef.current?.focus();
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  if (compact) {
    return (
      <a
        href={ABOUT_PAGE_CV_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className={ABOUT_BUTTON_PRIMARY}
      >
        {ABOUT_PAGE_CV_LABEL}
        <span className="sr-only">{` ${NEW_TAB_NOTE}`}</span>
      </a>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        className={ABOUT_BUTTON_PRIMARY}
        onClick={() => setOpen(true)}
      >
        {ABOUT_PAGE_CV_LABEL}
      </button>
      {/* MOUNTED ONLY WHILE OPEN. `showModal()` cannot be called during render,
          and a `<dialog>` left in the tree closed is still a node the browser
          keeps in the accessibility tree as a hidden dialog. Conditional
          mounting is also what makes the mobile guarantee literal: on that
          branch this line is never reached. */}
      {open ? <CvModal onClose={close} /> : null}
    </>
  );
}

function CvModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const html = document.documentElement;

    /* THE SCROLL LOCK, reusing `html[data-overlay-open]` from
       `app/globals.css` rather than a second mechanism. It is a document-level
       lock and this is its second consumer; the CSS block's comment is updated
       in the same commit to say so.

       The About page does not scroll, so there is normally nothing to lock and
       nothing to compensate — but the modal's own iframe DOES scroll, and
       without the lock a trackpad gesture past the end of the PDF scrolls the
       document behind it. The scrollbar width is measured BEFORE the attribute
       is set, because setting it is what removes the scrollbar. */
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    html.style.setProperty("--overlay-scrollbar-width", `${scrollbarWidth}px`);
    html.setAttribute("data-overlay-open", "");

    /* Escape, the Close button and a backdrop click all end in the SAME native
       `close` event, so the state is synced from that one listener rather than
       from three call sites. Nothing calls `preventDefault` on `cancel`: unlike
       `ProjectOverlay`, there is no exit animation and no history entry to pop,
       so the default close is exactly the wanted behaviour. */
    const onNativeClose = () => onClose();
    dialog.addEventListener("close", onNativeClose);

    if (!dialog.open) dialog.showModal();

    return () => {
      dialog.removeEventListener("close", onNativeClose);
      if (dialog.open) dialog.close();
      html.removeAttribute("data-overlay-open");
      html.style.removeProperty("--overlay-scrollbar-width");
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={MODAL_TITLE_ID}
      /* FULL-VIEWPORT AND TRANSPARENT, so the empty area around the panel is a
         real event target. `::backdrop` never receives clicks, so the standard
         technique is to stretch the dialog itself and compare `event.target`
         against it — anything inside the panel reports the panel's descendant
         instead and is left alone. `max-h-none`/`max-w-none` override the UA's
         `max-height: calc(100% - 6px)`, which would otherwise leave a 3px
         non-closing gutter at each edge. */
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-0 open:flex"
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <div className="flex h-[min(90dvh,1100px)] w-[min(90vw,900px)] flex-col border border-accent-working/40 bg-base">
        {/* THE PINNED HEAD. `shrink-0` so it survives the flex column even when
            the frame below wants the whole box. Download sits FIRST in the
            pair, before Close, because it is the action the modal exists to
            offer and it is the one a keyboard user should reach first after
            the frame. */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-sm border-b border-accent-working/40 px-md py-sm">
          <h2
            id={MODAL_TITLE_ID}
            className="text-caption font-mono uppercase text-fg"
          >
            {ABOUT_PAGE_CV_MODAL_TITLE}
          </h2>
          <div className="flex items-center gap-2xs">
            {/* A FILE SAVE, NOT A SECOND PREVIEW — the `download` attribute is
                the whole point, and the filename is stated so the saved file is
                named for its owner regardless of the served path. Dressed as a
                SECONDARY control on purpose: §6 requires it to be visually
                distinct from the filled View CV that opened the modal, and an
                identical filled button one layer up is the one dressing that
                would not be. */}
            <a
              href={ABOUT_PAGE_CV_HREF}
              download={ABOUT_PAGE_CV_FILENAME}
              className={ABOUT_BUTTON_SECONDARY}
            >
              {ABOUT_PAGE_CV_DOWNLOAD_LABEL}
            </a>
            <button
              type="button"
              className={ABOUT_BUTTON_QUIET}
              onClick={() => dialogRef.current?.close()}
            >
              {ABOUT_PAGE_CV_CLOSE_LABEL}
            </button>
          </div>
        </div>
        {/* `min-h-0` IS LOAD-BEARING: a flex item's default `min-height: auto`
            refuses to shrink below its content, and an iframe's intrinsic
            height is 150px, so without it the frame would never fill the box on
            short viewports. */}
        <iframe
          src={ABOUT_PAGE_CV_HREF}
          title={ABOUT_PAGE_CV_FRAME_TITLE}
          className="min-h-0 w-full flex-1 border-0"
        />
      </div>
    </dialog>
  );
}

export default CvAction;
