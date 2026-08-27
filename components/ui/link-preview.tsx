"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import Image, { type StaticImageData } from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";
import { useState, type MouseEvent, type ReactNode } from "react";

import { BRUTAL_SHADOW } from "@/components/about/aboutButtonStyles";
import { useHoverCapable } from "@/lib/hooks/useHoverCapable";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * A hover card that shows a still of where a link goes.
 *
 * PROVENANCE, AND WHY THE FILE KEEPS ITS INSTALLED NAME. Aceternity's
 * `link-preview` registry component, kept at its installed path and export name
 * so the provenance stays greppable — the rule `text-hover-effect.tsx` states
 * and `hover-border-gradient.tsx` follows. The Radix hover-card plumbing, the
 * spring-tracked horizontal offset and the pop-in transition are all the
 * demo's. Two things are not, and both were blocking.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 1. THE `api.microlink.io` PATH IS DELETED OUTRIGHT, NOT MADE OPTIONAL.
 * ─────────────────────────────────────────────────────────────────────────
 * The demo's default builds `https://api.microlink.io/?url=...&screenshot=true`
 * and renders it, so every hover sends the target URL from the VISITOR'S
 * browser to a third party. On this site that is three separate problems:
 *
 *   - It would be the only runtime external dependency the site has. Every
 *     route here is statically prerendered and CDN-cacheable end to end;
 *     `lib/theme.ts` records that the build refuses to trade that away even for
 *     a cookie read.
 *   - The free tier is IP-rate-limited, so previews stop rendering after some
 *     number of hovers with no error and no fallback. A recruiter scanning the
 *     project pages is exactly the traffic pattern that trips it, and a preview
 *     that works for the first few links and then silently stops is worse than
 *     one that was never there.
 *   - It leaks which links a visitor is considering, to a service that has no
 *     other reason to be in this page.
 *
 * The demo already ships the escape hatch — an `isStatic` / `imageSrc` union —
 * and Saad chose it (2026-08-25). Keeping BOTH paths would leave the network
 * one reachable by forgetting a prop, so the union is gone and an image is the
 * only way to get a preview. `qss`, which existed solely to encode the
 * microlink query string, was uninstalled in the same change.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 2. THE TRIGGER IS `asChild` OVER A REAL `ExternalLink`, NOT AN ANCHOR THIS
 *    FILE WRITES.
 * ─────────────────────────────────────────────────────────────────────────
 * THIS IS THE CHANGE THAT MATTERS MOST AND IT IS INVISIBLE IN A SCREENSHOT.
 * The demo renders `<HoverCardPrimitive.Trigger href={url}>` — a bare anchor
 * with no `target`, no `rel="noopener noreferrer"` and no announced new-tab
 * note. `ExternalLink`'s header states why that exact trio is a component and
 * not a convention: "A missing `rel` is a behaviour/security defect and a
 * missing new-tab note is an accessibility defect, and NEITHER is caught by the
 * compiler, by Lighthouse or by axe — only by a human who happens to look."
 * Wrapping links in the demo's trigger would have reintroduced that defect on
 * every link it touched, and nothing would have gone red.
 *
 * So this component takes NO `url`. It takes the link itself as `children` and
 * hands it to Radix's `asChild`, which merges the trigger's props onto the
 * anchor `ExternalLink` already rendered correctly. One source of truth for
 * link semantics, and `ExternalLink` stays a server component — see below.
 *
 * THE CARD IS NOT A SECOND LINK. The demo wraps its preview image in another
 * `<a href={url}>` — a duplicate of the trigger, carrying the same missing
 * `rel` and adding a second tab stop to the same destination. Here the card is
 * `aria-hidden` and inert: it is a picture of where you are already pointing,
 * the anchor is two pixels away, and a screen reader should hear the link once.
 * The image's `alt` is empty for the same reason, not by oversight.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS DOES NOT DRAG THREE SECTIONS ACROSS THE CLIENT BOUNDARY.
 * ─────────────────────────────────────────────────────────────────────────
 * `ExternalLink`'s header carries a standing warning about adding a hook or
 * `motion/react` to that file: doing so "quietly regresses" its server-component
 * consumers into client components. (The sentence quoted here read "All five
 * consumers are server components..." until 2026-08-25; `/work`'s fanned deck
 * became a SIXTH consumer and is itself `"use client"`, so the header was
 * rewritten to state the rule rather than the roll-call. The rule is unchanged
 * and this paragraph still depends on exactly it.) Nothing was added to
 * `ExternalLink` — it is untouched. A server
 * component may RENDER a `"use client"` component, and children passed into one
 * are rendered on the server and handed over as elements. `ProjectDetail`,
 * `Experience` and `CurrentlyLearning` all stay server components; only this
 * wrapper is client.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE REST OF THE ADAPTATION.
 * ─────────────────────────────────────────────────────────────────────────
 *   `bg-white`, `rounded-xl`, `rounded-lg`, `border-neutral-200
 *   dark:border-neutral-800`, `shadow-xl`, `text-black dark:text-white` — all
 *   deleted. Theme-blind colours, a radius scale this site does not have, and a
 *   `dark:` pair where a token exists. The card now wears the BRUTAL frame the
 *   `/about` controls took on the same day: a 2px `border-brutal-edge` edge and
 *   the stacked five-layer shadow, **imported as `BRUTAL_SHADOW` from
 *   `components/about/aboutButtonStyles.ts` rather than written out here.**
 *   That is deliberate — a floating panel in its own unrelated style would read
 *   as a component from somewhere else, which is exactly what it was.
 *
 *   **THE IMPORT DIRECTION IS BACKWARDS AND IT IS THE STRONGEST ARGUMENT FOR
 *   MOVING THOSE ATOMS.** A `components/ui/` primitive reaching into
 *   `components/about/` for a class string is the wrong way round; the shadow is
 *   a site-wide treatment that happens to live in the file where it was first
 *   needed. The alternative was leaving the duplicate, which is worse — a second
 *   copy of a five-layer shadow is a second source of truth. `aboutButtonStyles.
 *   ts`'s header carries the outstanding move and why it was not done in the
 *   same change.
 *
 *   RAW `<img>` -> `next/image` WITH A STATIC IMPORT. `content/projects.ts`
 *   states the site's rule: "IMAGES ARE STATIC IMPORTS, never string paths. A
 *   missing or misnamed file is then a BUILD ERROR instead of a broken <img> in
 *   production." The `StaticImageData` type below is what enforces it.
 *
 *   THE HIDDEN PRELOAD `<div className="hidden"><img/></div>` IS DELETED. It
 *   existed to warm microlink's cache before the card opened. With a static
 *   import the bytes are already in the build and `next/image` handles the
 *   rest, so it was a duplicate request for a file the page already has.
 *
 *   `handleMouseMove(event: any)` -> typed, AND `event.target` ->
 *   `event.currentTarget`. Not just a lint fix: `target` is whatever node is
 *   under the cursor, so on a link containing any nested element the demo
 *   measures the child's box and the parallax jumps as the pointer crosses it.
 *   `currentTarget` is always the anchor.
 *
 *   REDUCED MOTION HONOURED — `docs/07` §8 requires a branch of all motion and
 *   the demo has none. The card still appears (it is information, not
 *   decoration); the spring, the pop-in scale and the pointer-tracking offset
 *   are all dropped to a plain cross-fade.
 *
 *   NO-HOVER DEVICES GET THE PLAIN LINK. A hover card has no touch affordance,
 *   so on a phone the demo mounts Radix, a spring and an image that can never
 *   be seen. `useHoverCapable` is the site's existing answer to this question.
 */

/**
 * The card's intrinsic size, in CSS pixels.
 *
 * These are the demo's own 200x125 — near 16:10, which is close enough to a
 * browser viewport that a screenshot of a page reads as one. They are constants
 * rather than props because a per-call-site size would let one preview render
 * at a different scale from the next for no reason anyone chose; `next/image`
 * needs both to reserve the box and avoid a shift when the card opens.
 */
const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = 125;

/** Radix's own delays, kept from the demo. Fast enough not to feel gated,
 *  slow enough that sweeping the pointer across a row of links does not flash
 *  a card per link. */
const OPEN_DELAY_MS = 50;
const CLOSE_DELAY_MS = 100;

type LinkPreviewProps = {
  /**
   * The still to show. A STATIC IMPORT, not a path — see the header.
   *
   * OPTIONAL, AND ABSENCE IS A SUPPORTED STATE RATHER THAN A BUG. Most links on
   * this site have no screenshot yet. With no image this component renders
   * `children` and nothing else — no Radix, no listeners, no wrapper element —
   * so a link without a preview is byte-identical to one that was never wrapped.
   * That is what makes it safe to wrap every external link now and add the
   * images later, one content edit at a time.
   */
  preview?: StaticImageData;
  /** The link itself, already carrying its own `target` / `rel` / new-tab note.
   *  In practice always an `ExternalLink`. */
  children: ReactNode;
};

export function LinkPreview({ preview, children }: LinkPreviewProps) {
  const hoverCapable = useHoverCapable();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  /* The pointer-tracked horizontal offset: the card leans toward the side of
     the link the cursor is on, at half the cursor's own displacement. Kept from
     the demo. The hooks run unconditionally — the early return below is after
     all of them, which is what keeps hook order stable across the two states. */
  const x = useMotionValue(0);
  const translateX = useSpring(x, { stiffness: 100, damping: 15 });

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetFromCentre = event.clientX - rect.left - rect.width / 2;
    x.set(offsetFromCentre / 2);
  };

  /* NO IMAGE, OR NO HOVER: the link alone, in a fragment, with nothing added to
     the DOM. `useHoverCapable` returns false on the server, so this is also the
     branch that renders in the prerendered HTML — a hover-capable client swaps
     to the card on hydration, and since the anchor is identical in both
     branches nothing moves and nothing re-flows. */
  if (!preview || !hoverCapable) return <>{children}</>;

  return (
    <HoverCard.Root
      openDelay={OPEN_DELAY_MS}
      closeDelay={CLOSE_DELAY_MS}
      onOpenChange={setOpen}
    >
      <HoverCard.Trigger asChild onMouseMove={handleMouseMove}>
        {children}
      </HoverCard.Trigger>

      {/*
          ═══ `HoverCard.Portal` — THE FIX FOR A `<div>` INSIDE A `<p>` ═══

          RADIX RENDERS `Content` IN PLACE UNLESS IT IS PORTALLED, so the card's
          `motion.div` was emitted as a SIBLING OF THE TRIGGER, inside whatever
          element wraps the link. `RevealFooter` wraps each contact value in a
          `<p>`, and a `<div>` may not descend from a `<p>` — the parser closes
          the paragraph early, so the server's tree and the client's disagree.
          React logged it on `/` and `/work` on every hover:

            In HTML, <div> cannot be a descendant of <p>.
            This will cause a hydration error.
              ... <RevealFooter> <footer id="contact" data-hero-palette="">

          NOT FIXED BY CHANGING THE FOOTER'S `<p>` TO A `<div>`. That would fix
          one call site and leave the next one to rediscover it — this component
          is meant to be wrapped around any external link on the site, and four
          files already do. The defect is that the card renders inside the
          document flow at all; the portal is the fix at the level the defect
          lives.

          THREE THINGS THAT COULD HAVE BROKEN AND DO NOT, checked rather than
          assumed:

            - THEME. `lib/theme.ts` puts `light`/`dark` on
              `document.documentElement`, so a portal to `<body>` still inherits
              it. Had the class been on a wrapper div, this would have flipped
              every card to the wrong palette.
            - THE FOOTER'S `data-hero-palette` SCOPE. It defines `--nav-fg`,
              `--nav-fg-dim` and `--nav-accent`, which only `CopyEmailButton`
              reads. Nothing in this card resolves against it, so leaving the
              subtree costs nothing. (`bg-base`, `border-brutal-edge` and
              `BRUTAL_SHADOW` are all `:root` tokens.)
            - PAINT ORDER. The footer is `relative z-0` UNDER the page stack's
              `z-10`, so an in-flow card could be occluded by the curtain it
              belongs to. Portalled, it is a late sibling of the app root at
              `z-index: auto` and paints above both.

          POSITIONING IS UNAFFECTED: Radix positions `Content` against the
          trigger's measured rect with fixed positioning, which is viewport-
          relative and does not care where in the tree the node sits.
      */}
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="center"
          sideOffset={10}
          className="[transform-origin:var(--radix-hover-card-content-transform-origin)]"
        >
          <AnimatePresence>
            {open ? (
              <motion.div
                aria-hidden
                /* `BRUTAL_SHADOW`, IMPORTED — NOT PASTED. This attribute carried
                   a verbatim second copy of the five-layer shadow string until
                   2026-08-25, which meant `projectButtonStyles.ts`'s rule ("Do
                   not paste the class strings here. A second copy of a five-layer
                   shadow is a second source of truth") was written while a second
                   copy already existed, one directory away. The two never drifted
                   — they were still byte-identical when this was closed — but the
                   only reason is that nobody retuned the shadow in the eight
                   hours between. */
                className={`border-2 border-brutal-edge bg-base p-0.5 ${BRUTAL_SHADOW}`}
                initial={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 20, scale: 0.6 }
                }
                animate={
                  reducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 20, scale: 0.6 }
                }
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 260, damping: 20 }
                }
                style={reducedMotion ? undefined : { x: translateX }}
              >
                {/* `alt=""` AND `aria-hidden` ON THE WRAPPER: the card duplicates
                    a link that already has a correct accessible name two pixels
                    away. Describing the screenshot here would announce the same
                    destination twice, the second time in words nobody wrote for
                    that purpose. */}
                <Image
                  src={preview}
                  alt=""
                  width={PREVIEW_WIDTH}
                  height={PREVIEW_HEIGHT}
                  /* A FIXED BOX WITH A TOP-ANCHORED CROP, not `h-auto`.
                     The sources are full-page screenshots at roughly 2.1:1 and
                     the card is 1.6:1, so something has to give. `h-auto` was
                     the first attempt and it is wrong: it lets each preview pick
                     its own height from its own source aspect, so the card
                     changes size link to link — LinkedIn's near-square capture
                     would have rendered nearly twice as tall as a GitHub repo's.
                     Cropping to a constant box keeps every preview the same
                     object, and `object-top` decides WHERE the ~24% goes: off the
                     bottom, keeping the header, the identity and the first fold —
                     which is the part that makes a page recognisable at 200px
                     wide. */
                  className="block h-[125px] w-[200px] object-cover object-top"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

export default LinkPreview;
