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
 *   3. `Intro`'s expansion fires `onHandoff`, the hero opens out of the
 *      contraction point, the navbar slides in on the same beat, and `onDone`
 *      retires the gate.
 *
 * The Intro must never be gated on a timer, and the Loader must never be
 * padded to look intentional. Keeping them as two components with one
 * transition between them is what makes both of those hard to get wrong later.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHEN IT PLAYS: ON A REAL DOCUMENT LOAD OR REFRESH, AND ONLY THEN.
 *
 * `docs/07_SITE_RESTRUCTURE.md` §3 fixes the trigger and says any visited flag
 * is "removed, not tuned", while also requiring that a client-side navigation
 * back to Home does NOT replay it. Those two are only compatible with an
 * IN-MEMORY, MODULE-SCOPE BOOLEAN:
 *
 *   - A hard load or refresh instantiates a fresh module graph. `played` is
 *     `false`, so the Intro plays. That is the trigger, exactly.
 *   - A client navigation `/` → elsewhere → `/` reuses the same module. `played`
 *     is `true`, so it does not. `IntroGate` is mounted by `Hero`, which is
 *     mounted by Home, so returning to Home genuinely remounts this component —
 *     without the flag the Intro would replay every single time, which is a
 *     regression the pre-restructure single-page site could not even produce.
 *
 * WHAT WAS REMOVED, AND WHY NOT TUNED. This used to read a `sessionStorage`
 * key, `intro-played`, through `useSyncExternalStore`, with a server snapshot,
 * a try/catch for private-mode Safari, and an early-return branch for the
 * "already played" case. All of it is gone. `sessionStorage` answers "has this
 * TAB seen the intro", which deliberately suppresses it across refreshes — the
 * opposite of what §3 now asks for. There is no version of that flag that also
 * replays on refresh, so it could not be retuned into correctness.
 *
 * NO PERSISTENCE IS A FEATURE HERE. A returning visitor next week should see
 * the intro again; it is the site's first impression, and the whole Tier 1
 * budget was spent on it.
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

/**
 * Once per page load. MODULE SCOPE, deliberately — see the header.
 *
 * It is written when the sequence FINISHES rather than when it starts, so a
 * navigation that interrupts the Intro half-way leaves it `false` and the next
 * arrival on Home gets the whole thing rather than a gate that silently
 * disappeared mid-beat.
 */
let played = false;

/**
 * Locks document scroll while the gate is up. Declared in `globals.css` and
 * shared in MECHANISM (not in attribute) with the project overlay's lock,
 * because under reduced motion there is no Lenis instance and a JS-only lock
 * would silently do nothing for exactly the visitors most likely to notice.
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
   * On the skip paths — an Intro that has already played this page load, or
   * reduced motion — it fires too, so a consumer never has to special-case
   * "the intro did not run" to know when it may start.
   */
  onHandoff?: () => void;
  /** Fired once the gate is finished and can be unmounted. */
  onDone: () => void;
};

export function IntroGate({ onHandoff, onDone }: IntroGateProps) {
  /*
    READ ONCE, INTO STATE, AT MOUNT.

    A bare `if (played) return null` in the render body would be read again on
    every re-render — including the one this component's own `onComplete`
    triggers in its parent — so the Intro would vanish from the DOM the instant
    it set the flag, mid-hand-off, taking the dissolving plate with it. A lazy
    `useState` initialiser captures the value the gate mounted with and holds it
    for this instance's whole life. It is also not the cascading-render shape
    Next 16's `react-hooks/set-state-in-effect` rule rejects.

    `played` is module state and identical on both renders of a hydration pass,
    so this is safe to read during render: the server bundle has its own module
    instance and it is always `false` there, which matches a first visit —
    and a client navigation never re-runs prerender.
  */
  const [alreadyPlayed] = useState(() => played);
  const [phase, setPhase] = useState<Phase>("loading");

  const onHandoffRef = useRef(onHandoff);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onHandoffRef.current = onHandoff;
    onDoneRef.current = onDone;
  }, [onHandoff, onDone]);

  /* Retire immediately if the Intro has already run this page load. This calls
     parent callbacks rather than setting local state, so it is not the
     cascading-render shape the lint rule rejects. */
  useEffect(() => {
    if (!alreadyPlayed) return;
    onHandoffRef.current?.();
    onDoneRef.current();
  }, [alreadyPlayed]);

  useEffect(() => {
    if (alreadyPlayed) return;
    const root = document.documentElement;
    root.setAttribute(SCROLL_LOCK_ATTR, "");
    // Cleared in the SAME effect's cleanup, so an unmount mid-sequence — a
    // fast-forward navigation, a hot reload, an error boundary catching
    // something above — cannot strand the document unscrollable.
    return () => root.removeAttribute(SCROLL_LOCK_ATTR);
  }, [alreadyPlayed]);

  if (alreadyPlayed) return null;

  if (phase === "loading") {
    return <AssetLoader onReady={() => setPhase("playing")} />;
  }

  return (
    <Intro
      sequence="full"
      onHandoff={() => onHandoffRef.current?.()}
      onComplete={() => {
        played = true;
        onDoneRef.current();
      }}
    />
  );
}

export default IntroGate;
