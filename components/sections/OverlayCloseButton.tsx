"use client";

import { STANDALONE_NAV } from "@/components/ui/standaloneNav";

import { useOverlayClose } from "./ProjectOverlay";
import { CLOSE_LABEL } from "./projectDetailContent";

/**
 * The overlay's exit control — Ticket 6b.
 *
 * IT IS THE SAME ATOM AS THE ROUTE'S BACK LINK, CHARACTER FOR CHARACTER, AND
 * THAT IS STRUCTURAL RATHER THAN TIDY. `ProjectDetailFrame` renders this in the
 * exact slot the real route fills with `<Link>All work</Link>`, and the frame's
 * top row is one of the three contributors to the 106/140px the cover sits
 * below the top of the page. Identical type classes mean an identical computed
 * line box, which means an identical row height, which means the cover lands at
 * the same y on both paths. Restyle this — a different size, a pill, an icon,
 * extra padding — and the overlay and the route silently stop matching.
 *
 * A REAL `<button type="button">`, never an `<a href="#">`. It performs an
 * action rather than navigating, so an anchor would lie to a screen reader and
 * break under middle-click. `type="button"` is explicit because the UA default
 * inside any future form is `submit`. `app/error.tsx` makes the same call for
 * the same reason.
 *
 * `cursor-pointer` IS APPENDED HERE, NOT BAKED INTO `STANDALONE_NAV`. Tailwind
 * v4's preflight gives `<button>` no pointer cursor while `<a href>` gets one
 * from the UA, so it belongs at the two button call sites and nowhere else.
 *
 * NO `autoFocus`. The frame renders this node TWICE, top and bottom, so the
 * attribute cannot be scoped to the top instance — and React applies
 * `autoFocus` by calling `.focus()` on commit, so the bottom copy would win and
 * open the overlay scrolled to its foot. `showModal()` already focuses the
 * first focusable descendant, which is the top instance. `ProjectOverlay`
 * carries the long form of this note.
 *
 * `close` COMES FROM CONTEXT, and it has to: this element is created by the
 * intercepting route, which is a SERVER component, so a function cannot be
 * passed to it as a prop. `ProjectOverlay` explains why that matters — the
 * alternative shape drags the entire detail page into the client bundle.
 */
export function OverlayCloseButton() {
  const close = useOverlayClose();

  return (
    <button
      type="button"
      onClick={() => close?.()}
      className={`${STANDALONE_NAV} cursor-pointer`}
    >
      {CLOSE_LABEL}
    </button>
  );
}

export default OverlayCloseButton;
