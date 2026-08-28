"use client";

/**
 * `/about`'s primary control — View CV — and the modal it opens.
 *
 * THE ONLY CLIENT BOUNDARY ON THE PAGE besides the particle canvas. `/about`
 * is otherwise a server component holding one paragraph and two links, and it
 * stays that way: nothing else here needs state.
 *
 * IT IS TWO EXPORTS RATHER THAN ONE, AS OF 2026-08-22, AND THE SPLIT IS A BUG
 * FIX. `CvModalHost` owns the state and renders the dialog; `CvAction` is the
 * trigger. `AboutScreen` wraps the host around the whole action row, OUTSIDE
 * the `IntroEntrance` whose re-key was destroying an open modal. The full
 * reproduction — and the four alternatives that were ruled out by measurement
 * rather than by argument — is at `CvModalHost` below. The host renders no DOM
 * element, so the page's layout is unchanged.
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

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import {
  ABOUT_BUTTON_PRIMARY,
  ABOUT_MODAL_ACTION,
  ABOUT_MODAL_QUIET,
  ABOUT_SCRAMBLE_ON_ACCENT,
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
import { EncryptedButtonLabel } from "@/components/ui/EncryptedButtonLabel";
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

/* ───────────────────────────────────────────────────────────────────────────
   WHY THE STATE IS NOT IN `CvAction` ANY MORE — a reproduced defect, not tidying.

   `AboutScreen` renders `<CvAction />` inside an `<IntroEntrance>`, and
   `IntroEntrance`'s ONLY mechanism is `key={held ? "held" : "released"}`. That
   key flips once, at the Intro's hand-off, and a key change unmounts the whole
   subtree and mounts a fresh one — so every `useState` below it is reset. A
   modal opened before the hand-off was therefore destroyed mid-view: `open`
   went back to `false`, the effect cleanup called `dialog.close()`, and the
   dialog vanished with no visitor action.

   REPRODUCED 2026-08-22 on a production build at 1440x900, headless AND headed,
   on every run: `/about`, Tab to "View CV" (the plate carries no `inert`, so it
   is reachable under an opaque surface), Enter — `showModal()` renders it in the
   TOP LAYER above the plate — then the hand-off destroys it. Also reproduced by
   activating the trigger at t = 900 / 1400 / 1800ms; not reproduced at
   t >= 2500ms, which is where the hand-off lands.

   NOT REPRODUCED, and listed so the next reader does not re-hunt them: an
   ordinary click at eleven instants from 2.5s to 6s; the `767.98px` straddle
   band at ten widths from 740 to 800; Enter and Space on a settled page; a
   client navigation to `/about`; a twelve-second dwell; light theme; a theme
   toggle with the modal open; a drag that starts inside the panel and ends
   outside it; and a click inside the PDF frame.

   THE ONE CASE THAT LOOKS LIKE THE BUG AND IS NOT: dragging the window below
   768px with the modal open closes it. That is `sync()` doing what this file
   already says it does, deliberately.

   THE FIX IS STRUCTURAL RATHER THAN DEFENSIVE. The state moves ABOVE the
   re-keyed boundary into `CvModalHost`, which `AboutScreen` wraps around the
   whole action row. Storing `open` in a module-level variable and restoring it
   on remount was considered and rejected: the remount's `showModal()` runs in a
   passive effect, i.e. AFTER paint, so it would ship one visible frame with no
   dialog — a flash instead of a disappearance.

   `CvModalHost` RENDERS NO DOM ELEMENT, exactly like `IntroProvider`, so the
   `/about` layout is byte-identical. The `<dialog>` it renders while open is
   `position: fixed` and in the top layer, so it is out of flow and is not a
   flex item of the column it now sits in.

   THIS DOES NOT REPLACE THE `inert` FIX, and must not be read as having done
   so. `.claude/handoff/intro-route-scope-report.md` still records that nothing
   is inert while the plate is up, so a keyboard visitor can still reach — and
   now successfully operate — a control they cannot see. That is a separate
   change with a wider blast radius (it also covers tabbing into a project card
   on `/work`) and it is Saad's to take.
─────────────────────────────────────────────────────────────────────────── */
type CvModalState = {
  compact: boolean;
  open: boolean;
  openModal: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

/**
 * THE NO-HOST DEFAULT IS THE MOBILE BRANCH — `compact: true`, `openModal` a
 * no-op. Permissive in the same direction `IntroContext`'s default is: a
 * `CvAction` rendered outside a host degrades to a plain link to the file,
 * which works everywhere, rather than to a button that opens nothing.
 */
const CvModalContext = createContext<CvModalState>({
  compact: true,
  open: false,
  openModal: () => {},
  triggerRef: { current: null },
});

export function CvModalHost({ children }: { children: ReactNode }) {
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
  const openModal = useCallback(() => setOpen(true), []);

  const value = useMemo(
    () => ({ compact, open, openModal, triggerRef }),
    [compact, open, openModal],
  );

  return (
    <CvModalContext.Provider value={value}>
      {children}
      {/* MOUNTED ONLY WHILE OPEN, and only on the branch that has a modal at
          all. `showModal()` cannot be called during render, and a `<dialog>`
          left in the tree closed is still a node the browser keeps in the
          accessibility tree as a hidden dialog. Conditional mounting is also
          what makes the mobile guarantee literal: on that branch this line is
          never reached. */}
      {open && !compact ? <CvModal onClose={close} /> : null}
    </CvModalContext.Provider>
  );
}

export function CvAction() {
  const { compact, openModal, triggerRef } = useContext(CvModalContext);

  /* BOTH BRANCHES CARRY THE SAME DRESSING, which is the rule the header above
     already states: "Both elements carry the same class string and the same
     label, so nothing moves." The branch is decided on hydration, so dressing
     only one of them would make a window dragged across 768px visibly swap
     control styles mid-drag.

     THAT INVARIANT IS WHY THIS IS ONE CONSTANT AND NOT TWO. Between 2026-08-24
     and 2026-08-25 the desktop branch wore a `HoverBorderGradient` and the
     compact one wore a matching two-part dressing to imitate it; keeping those
     two in step was a standing cost with no reader. `ABOUT_BUTTON_PRIMARY` is a
     single string that both branches apply, so they cannot drift. */
  if (compact) {
    return (
      <a
        href={ABOUT_PAGE_CV_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className={ABOUT_BUTTON_PRIMARY}
      >
        <EncryptedButtonLabel
          text={ABOUT_PAGE_CV_LABEL}
          encryptedClassName={ABOUT_SCRAMBLE_ON_ACCENT}
        />
        <span className="sr-only">{` ${NEW_TAB_NOTE}`}</span>
      </a>
    );
  }

  /* THE TRIGGER, AND NOTHING ELSE. The modal is a sibling of the whole action
     row rather than of this button - see `CvModalHost`. This component is
     therefore free to be destroyed and rebuilt by the entrance's re-key, which
     is exactly what happens at the hand-off, without taking the visitor's open
     modal with it.

     `ref` GOES STRAIGHT ONTO THE `<button>` AGAIN. While this was a
     `HoverBorderGradient` the ref had to be forwarded through a wrapper, which
     the registry component did not support until it was adapted to. That
     indirection is gone and the focus-return effect in `CvModalHost` finds the
     element directly. If focus ever stops returning after the modal closes the
     symptom is SILENT - focus lands on `<body>` - so this ref is not
     decoration. */
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="dialog"
      className={ABOUT_BUTTON_PRIMARY}
      onClick={openModal}
    >
      <EncryptedButtonLabel
        text={ABOUT_PAGE_CV_LABEL}
        encryptedClassName={ABOUT_SCRAMBLE_ON_ACCENT}
      />
    </button>
  );
}

function CvModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  /* ─────────────────────────────────────────────────────────────────────────
     WHY A FLAG, AND WHY REMOVING THE LISTENER FIRST IS NOT ENOUGH.

     `HTMLDialogElement.close()` does NOT fire `close` synchronously. The spec
     says to "queue an element task ... to fire an event named close", so the
     event is delivered in a LATER task. That is the standard, not a Chromium
     quirk — every engine behaves this way, which is why the symptom below
     reproduced identically in Firefox, Chrome and Opera.

     Under StrictMode (development only) React runs this effect, tears it down,
     and runs it again. The teardown calls `close()`, which QUEUES the event;
     the second run then attaches a FRESH listener and re-opens; the queued
     event is finally delivered — to that fresh listener — and `onClose()` sets
     `open` to false. The modal opened and closed itself in ~3ms, and the PDF
     `<iframe>` was torn down mid-flight, which is what surfaced as a solid
     black frame and a 0-byte, `NS_ERROR_FAILURE` / `ERR_ABORTED` subdocument.
     Measured on `next dev`, 2026-08-23:

         6223.70ms  removeEventListener(close)   cleanup unhooks listener A
         6223.80ms  CALL close()                 <- the event is QUEUED here
         6226.70ms  addEventListener(close)      second run attaches listener B
         6226.70ms  CALL showModal()             ... and re-opens
         6228.50ms  >> close EVENT delivered     lands on B -> onClose()

     THE OBVIOUS FIX IS THE TRAP. `removeEventListener` ALREADY runs before
     `close()` here and always did — it does not help, because it unhooks
     listener A while the queued event is dispatched against whatever is
     registered when the task RUNS, i.e. listener B. Ordering inside the
     cleanup cannot reach across a task boundary; nothing in the cleanup can.

     So the state sync is made to recognise the event instead. This ref is set
     immediately before any `close()` THIS COMPONENT issues for teardown, and
     the handler consumes it — one flag, one event. A ref is the right carrier
     precisely because it survives the StrictMode cycle: the component instance
     is the same across both effect runs, so the mark written by the first
     run's cleanup is still there when the event lands after the second's.

     REJECTED, so the next reader does not re-try them: inspecting
     `event.target` or `dialog.open` in the handler (the element is the same
     node and is closed in both cases, so neither distinguishes anything);
     leaving the dialog open in the cleanup (a real unmount would then hand the
     top layer back by node removal rather than by an explicit call); and
     syncing from the three call sites instead of one listener — Escape has no
     signal other than this event, and that design is stated above.

     Production has no double-invoke, so none of this ever ran there; the modal
     always worked on a production build, which is exactly why the bug survived
     a previous verification pass.
  ───────────────────────────────────────────────────────────────────────── */
  const teardownClose = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const html = document.documentElement;

    /* THE SCROLL LOCK, reusing `html[data-overlay-open]` from
       `app/globals.css` rather than a second mechanism. It is a document-level
       lock and this is its second consumer; the CSS block's comment is updated
       in the same commit to say so.

       The About page does not scroll at `lg` and up, so there is nothing to
       lock or compensate THERE — but it scrolls below `lg` since 2026-08-23,
       so on a narrowed desktop window this lock and its scrollbar compensation
       are doing real work rather than belt and braces. Either way the modal's
       own iframe DOES scroll, and without the lock a trackpad gesture past the
       end of the PDF scrolls the document behind it. The scrollbar width is measured BEFORE the attribute
       is set, because setting it is what removes the scrollbar. */
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    html.style.setProperty("--overlay-scrollbar-width", `${scrollbarWidth}px`);
    html.setAttribute("data-overlay-open", "");

    /* Escape, the Close button and a backdrop click all end in the SAME native
       `close` event, so the state is synced from that one listener rather than
       from three call sites. Nothing calls `preventDefault` on `cancel`: unlike
       `ProjectOverlay`, there is no exit animation and no history entry to pop,
       so the default close is exactly the wanted behaviour. */
    const onNativeClose = () => {
      // A close this component issued while tearing down is not the visitor
      // closing the modal. Consume the mark and say nothing; see above.
      if (teardownClose.current) {
        teardownClose.current = false;
        return;
      }
      onClose();
    };
    dialog.addEventListener("close", onNativeClose);

    if (!dialog.open) dialog.showModal();

    return () => {
      dialog.removeEventListener("close", onNativeClose);
      if (dialog.open) {
        teardownClose.current = true;
        dialog.close();
      }
      html.removeAttribute("data-overlay-open");
      html.style.removeProperty("--overlay-scrollbar-width");
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={MODAL_TITLE_ID}
      /* FULL-VIEWPORT, so the empty area around the panel is a real event
         target.

         ═══ IT CARRIES THE SCRIM, AND THIS IS NOT A BREACH OF RULE S-4 ═══
         It was `bg-transparent` until 2026-08-28, which meant a 900px panel
         floated over a fully lit `/about` with nothing behind it saying the
         page was inert. `dialog::backdrop` cannot do this job: `globals.css`
         zeroes it site-wide, deliberately, because the PROJECT overlay is an
         opaque full-viewport surface and a UA tint would show in the gap
         before its own fade finishes.

         **Rule S-4's "no scrim" is about that overlay, not about this one, and
         the two are different components.** An opaque full-viewport surface
         has nothing to separate itself from; a panel modal over a live page
         has nothing else. Reading S-4 as a site-wide ban would be reading a
         rule about one component as a rule about a category.

         `bg-hero-surface/70` RATHER THAN `bg-base/70`, and the reason is
         mechanical: `--color-base` FLIPS with the theme, so a base scrim would
         be a WHITE wash in light mode — and the panel is `bg-base` too, so the
         panel would dissolve into its own scrim exactly where separation
         matters most. `--color-hero-surface` is one of the three PINNED
         tokens: `#07090C` in both themes. It is the site's existing "this
         surface does not theme" value, which is precisely what a scrim needs.

         IT WORKS IN BOTH THEMES, BUT ON DIFFERENT THINGS, AND THAT DISTINCTION
         IS WHY THE PANEL STILL NEEDS ITS OWN BORDER. Compositing 70% `#07090C`:

           light GROUND   `#FDFCFA` → `#51514F`   the page goes dark. Obvious.
           dark  GROUND   `#0A0A0B` → `#08090B`   ~1 level. Invisible.
           dark  CONTENT  `#EDEDED` → `#4C4D4E`   16.90:1 down to ~2.0:1.

         So in dark mode the scrim does not darken the PAGE — it is already
         near-black — it darkens everything drawn ON it: the paragraph, the
         headings, the particle field. The page reads as inert either way, which
         is the scrim's actual job.

         **What it cannot do in dark mode is separate the panel from the ground**,
         because `bg-base` `#0A0A0B` and the scrimmed ground `#08090B` are the
         same colour to the eye. That is the `border-fg/25` hairline's job, and
         it is the reason the border below is load-bearing rather than
         decorative. Two mechanisms doing two different jobs, not one mechanism
         with a weak theme.

         Clicking it still closes: `::backdrop` never receives clicks, so the
         standard technique is to stretch the dialog itself and compare
         `event.target` against it — anything inside the panel reports the
         panel's descendant instead and is left alone. A background on this
         element changes nothing about that. `::backdrop` never receives clicks, so the standard
         technique is to stretch the dialog itself and compare `event.target`
         against it — anything inside the panel reports the panel's descendant
         instead and is left alone. `max-h-none`/`max-w-none` override the UA's
         `max-height: calc(100% - 6px)`, which would otherwise leave a 3px
         non-closing gutter at each edge. */
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-center justify-center bg-hero-surface/70 p-0 open:flex"
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      {/* THE PANEL. `border-fg/25` AND NOT `border-accent-working/40`, WHICH IS
          WHAT SHIPPED UNTIL 2026-08-28.

          `app/globals.css`'s BASE block names exactly two border families and
          assigns them by role: `accent-working/30` for INTERACTIVE surfaces
          (the gallery card, whose whole area is a link) and `border-fg/25` for
          NEUTRAL frames (detail covers and screenshots, which are not). **A
          modal panel is a container, not a control** — nothing about its edge
          is clickable — so the teal was spending the affordance colour on the
          one thing on screen you cannot activate, which is the exact failure
          that block's own comment warns about: "a teal frame around a static
          image spends the accent on something you cannot click."

          It was also not doing the job. Teal at 40% over `bg-base` is a
          near-invisible hairline in dark mode, which is where the panel most
          needs an edge: the scrim dims the CONTENT of a dark page but not its
          near-black GROUND, so `#0A0A0B` panel against `#08090B` ground is no
          contrast at all and this hairline is the only thing separating them. `border-fg/25` is the same value
          `ProjectStripRow` and `ProjectDetail`'s image frames use, confirmed on
          a real light-mode render rather than computed.

          NO RADIUS, and that is the site rule rather than an oversight. There
          are exactly two radius tokens, `--radius-photo` and `--radius-deck`,
          each naming its one consumer; nothing else on the site is rounded and
          Rule S-4 bans a radius on the project overlay for the same reason. */}
      <div className="flex h-[min(90dvh,1100px)] w-[min(90vw,900px)] flex-col border border-fg/25 bg-base">
        {/* THE PINNED HEAD. `shrink-0` so it survives the flex column even when
            the frame below wants the whole box. Download sits FIRST in the
            pair, before Close, because it is the action the modal exists to
            offer and it is the one a keyboard user should reach first after
            the frame. */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-sm border-b border-fg/25 bg-elevated px-md py-sm">
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
              className={ABOUT_MODAL_ACTION}
            >
              {ABOUT_PAGE_CV_DOWNLOAD_LABEL}
            </a>
            <button
              type="button"
              className={ABOUT_MODAL_QUIET}
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
