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
 *   3. `Intro`'s zoom-in fires `onHandoff`, the hero starts its arrival move,
 *      and `onDone` retires the gate.
 *
 * The Intro must never be gated on a timer, and the Loader must never be
 * padded to look intentional. Keeping them as two components with one
 * transition between them is what makes both of those hard to get wrong later.
 *
 * IT OWNS THE SCROLL LOCK, AND IT IS THE ONLY OWNER. The attribute is set for
 * the WHOLE gate — loader plate and intro plate together — rather than by
 * either child, because two components setting and clearing one attribute is
 * how a document ends up permanently locked when their lifetimes overlap by a
 * frame. `Intro` therefore deliberately does not touch it, which is also what
 * makes it safe to reuse as a section-transition beat somewhere else: a
 * transition that is not covering the whole page has no business locking it.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { AssetLoader } from "@/components/intro/AssetLoader";
import { Intro } from "@/components/intro/Intro";

/**
 * Once per session, not once per page load.
 *
 * `sessionStorage`, deliberately, not `localStorage`: a returning visitor next
 * week SHOULD see the intro again — it is the site's first impression, and
 * suppressing it forever would mean the one moment the whole Tier 1 budget was
 * spent on is invisible to anyone who has ever been here. Within a single
 * session, replaying it on every reload is an obstacle.
 */
const SESSION_KEY = "intro-played";

/**
 * Locks document scroll while the gate is up. Declared in `globals.css` and
 * shared in MECHANISM (not in attribute) with the project overlay's lock,
 * because under reduced motion there is no Lenis instance and a JS-only lock
 * would silently do nothing for exactly the visitors most likely to notice.
 */
const SCROLL_LOCK_ATTR = "data-intro-active";

/**
 * The session read, as an external store rather than `useState` + `useEffect`.
 *
 * Next 16's `react-hooks/set-state-in-effect` rule hard-errors on the obvious
 * shape (read `sessionStorage` in an effect, `setSkipped(true)`), and it is
 * right to: that is a cascading render, and it also renders the plate for one
 * frame before removing it — a visible flash for exactly the returning visitor
 * the flag exists to spare. A lazy `useState` initialiser is not the fix
 * either, because `sessionStorage` does not exist during prerender.
 *
 * This is the pattern `lib/hooks/useReducedMotion.ts` already uses for the same
 * class of problem. `subscribe` is a no-op because nothing else writes this key
 * while the page is alive.
 */
const noopSubscribe = () => () => {};
const readPlayed = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    // Private-mode Safari and locked-down enterprise profiles throw on access
    // rather than returning null. A throw here must mean "play the intro", not
    // "crash the page before it paints".
    return false;
  }
};
/** Prerender has no session, so assume a first visit and let the client
 *  correct it during hydration. */
const readPlayedServer = () => false;

type Phase = "loading" | "playing";

type IntroGateProps = {
  /**
   * Fired as the Intro's zoom-in starts. The destination uses it to begin its
   * own arrival move; the OVERLAP between the two is what makes the hand-off
   * continuous rather than a cut, so this deliberately fires well before
   * `onDone`.
   *
   * On the skip paths — returning visitor, reduced motion — it fires too,
   * immediately, so a consumer never has to special-case "the intro did not
   * run" to know when it may start.
   */
  onHandoff?: () => void;
  /** Fired once the gate is finished and can be unmounted. */
  onDone: () => void;
};

export function IntroGate({ onHandoff, onDone }: IntroGateProps) {
  const alreadyPlayed = useSyncExternalStore(
    noopSubscribe,
    readPlayed,
    readPlayedServer,
  );
  const [phase, setPhase] = useState<Phase>("loading");

  const onHandoffRef = useRef(onHandoff);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onHandoffRef.current = onHandoff;
    onDoneRef.current = onDone;
  }, [onHandoff, onDone]);

  /* Retire immediately on a return visit. This calls parent callbacks rather
     than setting local state, so it is not the cascading-render shape the lint
     rule rejects. */
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
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          // Same reasoning as the read: a storage failure means the intro
          // replays on the next reload, which is a mild annoyance. Letting it
          // throw here would leave the gate mounted forever, which is a dead
          // site.
        }
        onDoneRef.current();
      }}
    />
  );
}

export default IntroGate;
