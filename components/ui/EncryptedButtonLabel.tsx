"use client";

import { useEffect, useRef, useState } from "react";

import { EncryptedText } from "@/components/ui/encrypted-text";
import { useHoverCapable } from "@/lib/hooks/useHoverCapable";

/**
 * A control's label, scrambled and re-resolved on hover.
 *
 * The effect itself is `components/ui/encrypted-text.tsx`, whose only consumer
 * until now was the hero tagline. Nothing about it is re-implemented here: this
 * file is the TRIGGER, and the trigger is the whole problem.
 *
 * **IT LIVED IN `components/about/` UNTIL 2026-08-27 AND WAS MOVED HERE WHEN
 * `/work` AND HOME BECAME CONSUMERS.** Nothing about the component changed in
 * the move. `aboutButtonStyles.ts`'s header carries a standing note that its
 * shared atoms are in the wrong directory and that a `components/ui/` primitive
 * reaching into `components/about/` is "the wrong way round"; adding
 * `ProjectDeckSection` and `Projects` as importers would have made a SECTION
 * reach into `/about` for a generic control, which is the same defect one level
 * up. Four consumers now, on three routes, none of which is more entitled to
 * own the file than the others. The `ABOUT_SCRAMBLE_*` inks did NOT move with
 * it — see `encryptedClassName` below.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY `cycle` AND NOT `play`.
 * ─────────────────────────────────────────────────────────────────────────
 * `play` is an edge, and it LATCHES. `EncryptedText` guards its start with
 * `run === 0`, and its own docblock states the consequence in as many words:
 * "a consumer that lowered and re-raised `play` cannot restart a finished
 * decrypt." So the obvious `play={hovered}` fires exactly once, on the first
 * hover of the session, and is silently inert forever after — which is the kind
 * of bug that looks like it works when you test it.
 *
 * `cycle` is the mechanism built for repeats: bumping it runs a reverse pass
 * followed by a fresh forward pass, once. It also handles the case that applies
 * here — the label has never been decrypted, so `run` is 0 — because that
 * component explicitly supports `run === 0 -> 2`.
 *
 * A COUNTER, NOT A BOOLEAN, IS ALSO WHY POINTER-OUT NEEDS NO HANDLER. There is
 * nothing to lower. Leaving mid-scramble lets the run finish into the real
 * string rather than freezing it as gibberish, which is the correct end state
 * for a label — and it means a fast pointer sweep across the row cannot strand
 * a control in ciphertext.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THE LISTENER GOES ON `closest("a,button")` RATHER THAN ON THIS SPAN.
 * ─────────────────────────────────────────────────────────────────────────
 * The hover the visitor experiences is the CONTROL's, not the text's. These
 * buttons carry `px-md py-sm` — 21px of padding on each side — so listening on
 * the label would leave the scramble dead across most of the button's area, and
 * moving the pointer from the padding onto the glyphs would fire it mid-press.
 *
 * The alternative was to lift hover state into each consumer and pass it down.
 * That is what makes this worth the `closest` call: `AboutScreen` renders the
 * GitHub and LinkedIn controls and is a SERVER component, and `ExternalLink`
 * renders their anchor and must stay one too — its header carries a standing
 * warning that a hook appearing in it "has quietly regressed three shipped
 * sections into client components". Reaching for the ancestor keeps every
 * handler inside this leaf: `AboutScreen` stays a server component,
 * `ExternalLink` is untouched, and the two controls need no new props.
 *
 * IT DEGRADES TO NOTHING RATHER THAN TO A BROKEN STATE. No hover-capable
 * pointer, no `a`/`button` ancestor, or reduced motion (which `EncryptedText`
 * handles internally) and this renders the plain string. Not a fallback so much
 * as the same DOM with no listener attached.
 */

/**
 * Per-character timings, in milliseconds.
 *
 * THESE ARE NOT THE HERO'S NUMBERS, AND THE DIVERGENCE IS THE POINT.
 * `HeroHeadline.tsx` passes 34 forward / 18 back, and this file used exactly
 * those on 2026-08-25 so the two surfaces would share one cadence. Shipped, it
 * was too quick to register, and Saad asked for longer. The reason it felt
 * abrupt here and does not there is arithmetic rather than taste:
 *
 *   EncryptedText's delays are PER CHARACTER, so the duration a visitor
 *   actually perceives is (delay x length). The tagline's units are 22-24
 *   characters -> about 800ms of forward pass. The longest label on this row is
 *   "LINKEDIN" at 8 -> 272ms at the same rate. Matching the CADENCE gave the
 *   two surfaces totals that differ by 3x.
 *
 * So the TOTAL is matched instead of the rate. At 85ms, an 8-character label
 * takes 680ms forward and 360ms back; the hero's forward pass is ~816ms. The
 * two effects now last about as long as each other, which is what "the same
 * effect" means to someone watching rather than to someone reading the props.
 *
 * `FLIP_MS` DELIBERATELY DID NOT SCALE WITH THE OTHER TWO. It is the
 * re-randomisation rate of the characters that have not landed yet - the churn,
 * not the progress - and slowing it in step would have bought the longer
 * duration at the cost of the thing being legible AS ciphertext: the same few
 * glyphs sitting still for a twelfth of a second each. Held near the hero's 34
 * so the unresolved run keeps boiling while the reveal front moves more slowly
 * across it.
 */
const REVEAL_MS = 85;
const ENCRYPT_MS = 45;
const FLIP_MS = 42;

export function EncryptedButtonLabel({
  text,
  encryptedClassName,
}: {
  text: string;
  /**
   * REQUIRED, AND DELIBERATELY WITHOUT A DEFAULT - pass the scramble ink that
   * belongs to the SURFACE the control sits on:
   *
   *   `ABOUT_SCRAMBLE_ON_BASE`   / `ABOUT_SCRAMBLE_ON_ACCENT`   (`/about`)
   *   `PROJECT_SCRAMBLE_ON_BASE`                                (`/work`, Home)
   *
   * Each carries its own contrast arithmetic at its own definition. Omission is
   * a type error rather than an invisible scramble on a filled control.
   *
   * **THE `PROJECT_` AND `ABOUT_` ON-BASE INKS ARE THE SAME STRING AND ARE
   * STILL TWO CONSTANTS**, for the reason `projectButtonStyles.ts` already
   * states about the button dressings it duplicates: they are equal by
   * coincidence of surface rather than by intent, and importing an `ABOUT_*`
   * name into `/work` would make `/about` the definition of a control on a page
   * it has nothing to do with. Do not "deduplicate" them.
   */
  encryptedClassName: string;
}) {
  const hoverCapable = useHoverCapable();
  const markerRef = useRef<HTMLSpanElement>(null);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!hoverCapable) return;
    /* The nearest interactive ancestor IS the control — see the header. Every
       consumer puts this directly inside a `<button>` or an `<a>`, so this is
       one hop; the query is written defensively anyway because a null host has
       to mean "no effect", never a crash. */
    const host = markerRef.current?.closest("a,button");
    if (!host) return;

    /* `pointerenter`, NOT `mouseenter`: it does not fire for touch, so a tap on
       a phone that reports hover capability (a hybrid laptop, a tablet with a
       trackpad) cannot scramble a label the visitor is trying to press.
       `pointerenter` also does not bubble, which is what makes one listener on
       the control correct rather than one per descendant. */
    const onEnter = (event: Event) => {
      if ((event as PointerEvent).pointerType === "touch") return;
      setCycle((current) => current + 1);
    };

    host.addEventListener("pointerenter", onEnter);
    return () => host.removeEventListener("pointerenter", onEnter);
  }, [hoverCapable]);

  return (
    /* A PLAIN INLINE SPAN, no class and no `display: contents`.
       `display: contents` was the first instinct and it is wrong here: these
       controls are `inline-flex`, so dissolving this box would promote every
       one of `EncryptedText`'s per-character slots to a flex item of the
       button and hand them all to `justify-center` individually. An ordinary
       inline span is a single flex item, exactly as the bare text node it
       replaces was, so the button's box is unchanged to the pixel. */
    <span ref={markerRef}>
      <EncryptedText
        text={text}
        /* NEVER RAISED. `cycle` drives everything — see the header. Passing
           `hovered` here would work once and then latch. */
        play={false}
        cycle={cycle}
        revealDelayMs={REVEAL_MS}
        encryptDelayMs={ENCRYPT_MS}
        flipDelayMs={FLIP_MS}
        /* THE CIPHERTEXT IS TINTED; THE RESOLVED TEXT IS NOT.
           `revealedClassName` stays unset on purpose - a character that has
           landed should be indistinguishable from one that was never
           scrambled, which means inheriting the control's own ink rather than
           being told what it is. Only the unsettled state gets a colour, and
           it comes from the call site because the row has two surfaces; see
           `ABOUT_SCRAMBLE_ON_BASE` / `ABOUT_SCRAMBLE_ON_ACCENT`. */
        encryptedClassName={encryptedClassName}
      />
    </span>
  );
}

export default EncryptedButtonLabel;
