"use client";

/**
 * The monogram loader: "Muhammad Saad" collapses to "MS".
 *
 * Every letter but the two initials fades and shrinks out of the layout; the
 * M and the S then SLIDE together to close the gap, recolour to the accent,
 * and hand over to the hero.
 *
 * THE SLIDE IS A REAL FLIP, MEASURED AT RUNTIME. First rects are recorded,
 * the non-initial spans are collapsed, last rects are recorded, and the two
 * initials are offset by the delta and animated back to zero. Nothing here
 * knows a pixel distance: the brief's acceptance criteria require the two
 * initials to be identified and moved correctly "regardless of font/kerning
 * changes", and the only way to honour that is to measure after the collapse
 * rather than to compute where the letters ought to end up.
 *
 * NO FLIP PLUGIN. GSAP 3.15's Flip would do this in fewer lines, but a
 * four-rect manual FLIP is not where a plugin registration earns its keep, and
 * `lib/animation/gsap.ts` exists precisely because an unregistered plugin
 * fails silently in production.
 *
 * WHY GSAP AND NOT FRAMER, given the house rule is "GSAP owns scroll-synced
 * timelines, Framer owns DOM": this IS a timeline — five phases, a stagger and
 * a measured FLIP in the middle of it — and expressing it as nested Framer
 * variants with delay arithmetic is how the phase boundaries drift apart when
 * one duration is retuned. The rule exists to stop the two libraries producing
 * different CURVES for the same job; a one-shot intro sequence with no Framer
 * counterpart is not that case.
 *
 * A SCRIPTED CLOCK IS HONEST HERE, AND WAS NOT BEFORE. The loader this
 * replaces refused a fixed timeline because it sat in front of a real download
 * (the Three.js typeface JSON) and a fixed duration would have been a timer
 * impersonating progress. The hero rebuild removed that download along with
 * the 3D scene, so there is now nothing to report and nothing to misrepresent.
 * This is an intro, and an intro is allowed to know how long it is.
 */

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { gsap } from "@/lib/animation/gsap";
import { HERO_NAME } from "@/components/hero/heroContent";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/** Shared with nothing else — the hero is the only surface with a loader. */
const SESSION_KEY = "hero-loader-played";

/**
 * Locks document scroll while the plate is up. Declared in `globals.css` and
 * shared with the project overlay's mechanism, because under reduced motion
 * there is no Lenis instance and a JS-only lock would silently do nothing.
 */
const SCROLL_LOCK_ATTR = "data-hero-loading";

/* Phase durations, seconds. These are the brief's, converted. */
const HOLD_S = 0.1;
const DROP_S = 0.4;
const DROP_STAGGER_S = 0.015;
const SLIDE_S = 0.45;
const RECOLOUR_S = 0.4;
const HANDOFF_S = 0.5;
/** Reduced motion: straight to the formed monogram, then a short crossfade. */
const REDUCED_FADE_S = 0.2;

/**
 * Indices of the characters that survive: the first letter of each word.
 *
 * DERIVED FROM THE STRING, never written down as `[0, 9]`. `HERO_NAME` is
 * content and content moves; a hardcoded pair would keep animating
 * confidently after an edit and simply preserve the wrong letters.
 */
function initialIndices(name: string): Set<number> {
  const out = new Set<number>();
  let atWordStart = true;
  for (let i = 0; i < name.length; i++) {
    const ch = name[i];
    if (ch === " ") {
      atWordStart = true;
      continue;
    }
    if (atWordStart) {
      out.add(i);
      atWordStart = false;
    }
  }
  return out;
}

/**
 * The session read, as an external store rather than as `useState` +
 * `useEffect`.
 *
 * Next 16's `react-hooks/set-state-in-effect` rule HARD-ERRORS on the obvious
 * shape (read `sessionStorage` in an effect, `setSkipped(true)`), and it is
 * right to: that is a cascading render, and it also renders the plate for one
 * frame before removing it, which is a visible flash for exactly the returning
 * visitor the flag exists to spare. A lazy `useState` initialiser is not the
 * fix either — `sessionStorage` does not exist during prerender.
 *
 * `useSyncExternalStore` is the pattern `lib/hooks/useReducedMotion.ts` already
 * uses for the same class of problem: a real server snapshot instead of a
 * first-render lie corrected one paint later. `subscribe` is a no-op because
 * nothing else writes this key while the page is alive.
 */
const noopSubscribe = () => () => {};
const readPlayed = () => sessionStorage.getItem(SESSION_KEY) === "1";
/** Prerender has no session, so assume a first visit and let the client
 *  correct it during hydration. */
const readPlayedServer = () => false;

type HeroLoaderProps = {
  /** Fired once the plate is finished and can be unmounted. */
  onExited?: () => void;
};

export function HeroLoader({ onExited }: HeroLoaderProps) {
  const reducedMotion = useReducedMotion();
  const alreadyPlayed = useSyncExternalStore(
    noopSubscribe,
    readPlayed,
    readPlayedServer,
  );

  const plateRef = useRef<HTMLDivElement | null>(null);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const onExitedRef = useRef(onExited);
  useEffect(() => {
    onExitedRef.current = onExited;
  }, [onExited]);

  const chars = useMemo(() => [...HERO_NAME], []);
  const initials = useMemo(() => initialIndices(HERO_NAME), []);

  /* Retire immediately on a return visit. This calls a parent callback rather
     than setting local state, so it is not the cascading-render shape the lint
     rule rejects. */
  useEffect(() => {
    if (alreadyPlayed) onExitedRef.current?.();
  }, [alreadyPlayed]);

  useEffect(() => {
    if (alreadyPlayed) return;
    const root = document.documentElement;
    root.setAttribute(SCROLL_LOCK_ATTR, "");
    return () => root.removeAttribute(SCROLL_LOCK_ATTR);
  }, [alreadyPlayed]);

  /* -----------------------------------------------------------------------
     The sequence.
  ----------------------------------------------------------------------- */
  useEffect(() => {
    if (alreadyPlayed) return;
    const plate = plateRef.current;
    if (!plate) return;

    const all = charRefs.current.filter(Boolean) as HTMLSpanElement[];
    const keep = [...initials]
      .sort((a, b) => a - b)
      .map((i) => charRefs.current[i])
      .filter(Boolean) as HTMLSpanElement[];
    const drop = all.filter((el) => !keep.includes(el));

    const finish = () => {
      sessionStorage.setItem(SESSION_KEY, "1");
      onExitedRef.current?.();
    };

    if (reducedMotion) {
      // Final state, immediately: monogram already formed and coloured. No
      // letter-by-letter anything, then a short crossfade out.
      gsap.set(drop, { display: "none" });
      gsap.set(keep, { color: "var(--accent-hero)" });
      const tl = gsap.timeline({ onComplete: finish });
      tl.to(plate, { autoAlpha: 0, duration: REDUCED_FADE_S, delay: 0.15 });
      return () => {
        tl.kill();
      };
    }

    const tl = gsap.timeline({ onComplete: finish });

    // 1. Hold, so the name registers as a word rather than as a flash.
    tl.to({}, { duration: HOLD_S });

    // 2. Everything but the initials leaves.
    tl.to(drop, {
      opacity: 0,
      scale: 0.6,
      duration: DROP_S,
      stagger: DROP_STAGGER_S,
      ease: "power2.in",
    });

    // 3. FLIP the two survivors together.
    tl.add(() => {
      const first = keep.map((el) => el.getBoundingClientRect());
      // Collapsing to display:none is what actually removes the width; opacity
      // alone leaves the gap and the monogram never closes up.
      gsap.set(drop, { display: "none" });
      const last = keep.map((el) => el.getBoundingClientRect());

      keep.forEach((el, i) => {
        const dx = first[i].x - last[i].x;
        // Y is measured too and asserted to be zero-ish rather than assumed:
        // on a narrow viewport the name can wrap, and a wrapped FLIP that only
        // corrects X slides the S horizontally onto a different line.
        const dy = first[i].y - last[i].y;
        gsap.set(el, { x: dx, y: dy });
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: SLIDE_S,
          ease: "power3.inOut",
        });
      });
    });

    // 4. Recolour, overlapping the tail of the slide so the monogram arrives
    //    already becoming accent rather than waiting, then changing.
    tl.to(
      keep,
      {
        color: "var(--accent-hero)",
        duration: RECOLOUR_S,
        ease: "power2.out",
      },
      `+=${SLIDE_S * 0.55}`,
    );

    // 5. Hand off.
    //
    //    The brief's preferred ending flies the monogram to "where the
    //    persistent nav logo will live (top-left)". THERE IS NO NAV on this
    //    site — it is a one-pager with no header, stated in three separate
    //    files — so that ending would fly the mark to an empty corner and
    //    leave it there. The brief's own stated fallback is taken instead:
    //    the monogram fades out in place while the hero is revealed beneath.
    tl.to(plate, { autoAlpha: 0, duration: HANDOFF_S, ease: "power2.inOut" });

    return () => {
      tl.kill();
    };
  }, [alreadyPlayed, reducedMotion, initials]);

  if (alreadyPlayed) return null;

  return (
    <div
      ref={plateRef}
      // FIXED, not absolute: the plate must cover the viewport rather than the
      // hero section, so nothing can be revealed by a scroll that lands before
      // the lock attaches.
      className="fixed inset-0 z-50 flex items-center justify-center bg-hero-surface"
      aria-hidden="true"
    >
      {/* One span per character, space included, so each can be animated and
          measured independently. `whitespace-pre` keeps the space span from
          being collapsed away before the FLIP has measured it. */}
      <div className="flex whitespace-pre text-h3 font-medium text-hero-fg/70 sm:text-h2">
        {chars.map((ch, i) => (
          <span
            key={i}
            ref={(el) => {
              charRefs.current[i] = el;
            }}
            className="inline-block"
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

export default HeroLoader;
