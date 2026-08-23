"use client";

/**
 * The entry gate: Loader, then Intro, then out of the way.
 *
 * THIS FILE IS THE ORDERING RULE MADE EXECUTABLE, and the ordering rule is the
 * entire point of the loader/intro split (`docs/06_INTRO_AND_CHROME.md` §3):
 *
 *   1. `AssetLoader` mounts and tracks REAL readiness. Nothing else exists yet.
 *   2. The moment it reports ready, `Intro` mounts and plays its scripted
 *      sequence. It is never fighting an in-flight download, because there is
 *      no longer one to fight.
 *   3. `Intro`'s PHASE 7 fires `onHandoff` on its first frame, the plate
 *      dissolves over 0.55s while the hero settles in behind it over 1.30s, the
 *      navbar slides in on the same INSTANT (not for the same duration),
 *      `onPlateCleared` fires 65% of the way through that dissolve — so the
 *      bar can swap OFF the plate's palette while the plate is still dark
 *      enough to swap onto its own — and `onDone` retires the gate.
 *      This step said "`Intro`'s zoom-in fires `onHandoff`, the hero settles in
 *      behind the camera out of the mark's anchor pixel" until 2026-08-22, when
 *      the ×17 camera was retired and the dissolve became the only ending on
 *      all three routes. Before that it said "`Intro`'s expansion ... the hero
 *      opens out of the contraction point" — the reverted merge-to-a-point
 *      sequence. The INSTANT has been the same one throughout; only the tween
 *      carrying it has changed.
 *
 * The Intro must never be gated on a timer, and the Loader must never be
 * padded to look intentional. Keeping them as two components with one
 * transition between them is what makes both of those hard to get wrong later.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT NO LONGER DECIDES WHETHER TO PLAY. IT ONLY EXISTS IN ORDER TO PLAY.
 *
 * This file used to own the whole question with one module-scope boolean,
 * `played`, read into state in a lazy initialiser, plus an `alreadyPlayed`
 * branch that fired both callbacks from an effect and rendered `null`. All of
 * that is gone. The decision moved to `IntroProvider`, which reads
 * `shouldPlayIntro()` (`components/intro/IntroSession.tsx`) and simply does not
 * render this component when the answer is no.
 *
 * WHY IT MOVED, in one line: `played` was written only by an Intro that
 * actually RAN, and the only thing that could run one was Home — so a document
 * that entered on `/about` left the flag false and the first click to HOME
 * played the Intro on a CLIENT NAVIGATION, which `docs/07_SITE_RESTRUCTURE.md`
 * §3 forbids. The trigger it states — actual document load or browser refresh,
 * on `/`, `/work` and `/about`, never on `/projects/<slug>` — is now enforced
 * by three flags in one module rather than by this component's mount site.
 *
 * WHAT SURVIVES UNCHANGED, because it was never the broken part: no
 * persistence, of any kind, on any route. `sessionStorage` (this used to read
 * an `intro-played` key through `useSyncExternalStore`) answers "has this TAB
 * seen the intro", which suppresses it across refreshes — the opposite of what
 * §3 asks for, and not retunable into correctness. A returning visitor next
 * week should see the Intro again; it is the site's first impression, and the
 * whole Tier 1 budget was spent on it.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * IT OWNS THE SCROLL LOCK, AND IT IS THE ONLY OWNER. The attribute is set for
 * the WHOLE gate — loader plate and intro plate together — rather than by
 * either child, because two components setting and clearing one attribute is
 * how a document ends up permanently locked when their lifetimes overlap by a
 * frame. `Intro` therefore deliberately does not touch it, which is also what
 * makes it safe to reuse as a section-transition beat somewhere else: a
 * transition that is not covering the whole page has no business locking it.
 */

import { useEffect, useRef, useState } from "react";

import { AssetLoader } from "@/components/intro/AssetLoader";
import { Intro } from "@/components/intro/Intro";
import { markIntroSettled } from "@/components/intro/IntroSession";

/**
 * Locks document scroll while the gate is up. Declared in `globals.css` and
 * shared in MECHANISM (not in attribute) with the project overlay's lock,
 * because under reduced motion there is no Lenis instance and a JS-only lock
 * would silently do nothing for exactly the visitors most likely to notice.
 *
 * IT REACHES `/about` AND `/work` NOW. On `/about` that is close to a no-op at
 * `lg` and up — the page is `lg:h-dvh lg:overflow-hidden` there — and real work
 * below `lg`, where it has scrolled since 2026-08-23. On `/work` it is not a
 * no-op at any width: the archive is a long page, and it is held at the scroll
 * position the document loaded at until the gate retires.
 */
const SCROLL_LOCK_ATTR = "data-intro-active";

/**
 * The classic scrollbar's width, measured before the lock is applied and read
 * back by the `padding-right` in the same `globals.css` block.
 *
 * IT EXISTS BECAUSE THE RELEASE WAS NEVER COMPENSATED, ONLY THE APPLY. The CSS
 * block used to argue the compensation away with "the plate is opaque … there
 * is nothing visible to shift", which is true of the frame the lock goes ON and
 * says nothing about the frame it comes OFF — by which point the plate has
 * dissolved and the page is being looked at. REPRODUCED at 1440x900 in headed
 * Chromium: at the release frame `clientWidth` goes 1440 -> 1425, the navbar's
 * right cluster (theme toggle, email, LinkedIn) jumps 15px left and its centre
 * cluster jumps 7.5px, one frame after the plate clears.
 *
 * SAME MECHANISM AND SAME VARIABLE SHAPE AS `--nav-scrollbar-width`
 * (`NavMobileMenu.tsx`), whose block in `globals.css` already accepted this
 * exact argument for the menu: "removing the scrollbar would visibly shift the
 * page behind it". MEASURED, never guessed — `innerWidth - clientWidth` is 0 on
 * overlay-scrollbar platforms (iOS, Android, macOS by default) and on `/about`
 * AT `lg` AND UP, which is `lg:h-dvh lg:overflow-hidden` and has no scrollbar
 * to remove — but NOT on `/about` below `lg`, which has scrolled since
 * 2026-08-23 and does have one on a narrowed desktop window. RE-MEASURED
 * HEADED: 900x800 `clientWidth 885`, 768x1024 `clientWidth 753`, and ZERO
 * elements move at the release in either. The compensation was written against
 * `innerWidth - clientWidth` rather than against a route, which is why it
 * needed no change. The `var()` fallback keeps that honest rather than
 * substituting a constant.
 */
const SCROLLBAR_VAR = "--intro-scrollbar-width";

type Phase = "loading" | "playing";

type IntroGateProps = {
  /**
   * Fired as the Intro's expansion starts. The destination uses it to begin its
   * own arrival move; the OVERLAP between the two is what makes the hand-off
   * continuous rather than a cut, so this deliberately fires well before
   * `onDone`.
   *
   * UNDER REDUCED MOTION IT STILL FIRES, on the plate fade's `onStart`, so a
   * consumer never has to special-case "the intro did not run" to know when it
   * may start. The other skip path — "already played this page load" — is not
   * this component's any more: `IntroProvider` seeds both wires true instead of
   * mounting a gate that immediately retires itself.
   */
  onHandoff?: () => void;
  /**
   * Fired PART-WAY INTO the dissolve — on the frame the plate stops being the
   * GROUND behind fixed chrome, which is neither of the other two instants.
   * `Intro.tsx`'s `PLATE_GROUND_RATIO` places it and carries the arithmetic;
   * `IntroContext.tsx` records why it can be neither `onHandoff` nor `onDone`.
   */
  onPlateCleared?: () => void;
  /** Fired once the gate is finished and can be unmounted. */
  onDone: () => void;
};

export function IntroGate({
  onHandoff,
  onPlateCleared,
  onDone,
}: IntroGateProps) {
  const [phase, setPhase] = useState<Phase>("loading");

  const onHandoffRef = useRef(onHandoff);
  const onPlateClearedRef = useRef(onPlateCleared);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onHandoffRef.current = onHandoff;
    onPlateClearedRef.current = onPlateCleared;
    onDoneRef.current = onDone;
  }, [onHandoff, onPlateCleared, onDone]);

  /* UNCONDITIONAL NOW, and that is a simplification rather than a change of
     behaviour: this component is only ever rendered when it is going to play,
     so the `alreadyPlayed` guard this effect used to carry could only ever have
     been false. `globals.css`'s "IntroGate is the SINGLE owner" note stays
     literally true.

     Set and cleared in ONE effect, so an unmount mid-sequence — a fast-forward
     navigation, a hot reload, an error boundary catching something above —
     cannot strand the document unscrollable. Do not split it. */
  useEffect(() => {
    const root = document.documentElement;
    /* MEASURE BEFORE LOCKING — the scrollbar has to still be there to have a
       width. This runs in a passive effect, after the browser has painted the
       plate at least once, so the document is still in its unlocked geometry
       here and the plate is already covering the reflow the lock is about to
       cause. */
    root.style.setProperty(
      SCROLLBAR_VAR,
      `${window.innerWidth - root.clientWidth}px`,
    );
    root.setAttribute(SCROLL_LOCK_ATTR, "");
    return () => {
      root.removeAttribute(SCROLL_LOCK_ATTR);
      root.style.removeProperty(SCROLLBAR_VAR);
    };
  }, []);

  if (phase === "loading") {
    return <AssetLoader onReady={() => setPhase("playing")} />;
  }

  return (
    <Intro
      sequence="full"
      onHandoff={() => onHandoffRef.current?.()}
      onPlateCleared={() => onPlateClearedRef.current?.()}
      onComplete={() => {
        // AT FINISH, NOT AT START — `played`'s one load-bearing property,
        // preserved verbatim under the new mount point. A run interrupted
        // half-way leaves `introSettled` false, and `introStarted` is what
        // then tells the next provider instance to play the rest rather than
        // skip it.
        markIntroSettled();
        onDoneRef.current();
      }}
    />
  );
}

export default IntroGate;
