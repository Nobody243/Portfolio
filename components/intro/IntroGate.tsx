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
 *   3. `Intro`'s zoom-in fires `onHandoff`, the hero settles in behind the
 *      camera out of the mark's anchor pixel, the navbar slides in on the same
 *      INSTANT (not for the same duration), and `onDone` retires the gate.
 *      This step said "`Intro`'s expansion ... the hero opens out of the
 *      contraction point" — the reverted merge-to-a-point sequence.
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
 * IT REACHES `/about` AND `/work` NOW. On `/about` that is close to a no-op —
 * the page is `h-dvh overflow-hidden` and does not scroll. On `/work` it is
 * not: the archive is a long page, and it is held at the scroll position the
 * document loaded at until the gate retires.
 */
const SCROLL_LOCK_ATTR = "data-intro-active";

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
  /** Fired once the gate is finished and can be unmounted. */
  onDone: () => void;
};

export function IntroGate({ onHandoff, onDone }: IntroGateProps) {
  const [phase, setPhase] = useState<Phase>("loading");

  const onHandoffRef = useRef(onHandoff);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onHandoffRef.current = onHandoff;
    onDoneRef.current = onDone;
  }, [onHandoff, onDone]);

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
    root.setAttribute(SCROLL_LOCK_ATTR, "");
    return () => root.removeAttribute(SCROLL_LOCK_ATTR);
  }, []);

  if (phase === "loading") {
    return <AssetLoader onReady={() => setPhase("playing")} />;
  }

  return (
    <Intro
      sequence="full"
      onHandoff={() => onHandoffRef.current?.()}
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
