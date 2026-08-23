"use client";

/**
 * The client boundary that owns the Intro's state and mounts the gate.
 *
 * IT RENDERS NO DOM ELEMENT. A context provider is not an element, and the
 * gate's two plates are `position: fixed` (`Intro.tsx`, `AssetLoader.tsx`), so
 * they are out of flow and are not flex items of `<body className="flex
 * min-h-full flex-col">`. That is what lets this be mounted by
 * `app/(site)/(chrome)/layout.tsx` without breaking that file's stated
 * no-DOM-element rule — `<header>`'s nearest ancestor is still `<body>`, so it
 * is still the `banner` landmark. Precedent for the shape: `MotionProvider`.
 *
 * `{children}` ARE PASSED THROUGH, NOT RE-RENDERED HERE. Server-rendered
 * elements handed to a client component as `children` stay server-rendered —
 * the canonical RSC pattern — which is what keeps the `(chrome)` layout a
 * server component and keeps `/work`'s five project descriptions off the client
 * side of the boundary.
 *
 * THE GATE RENDERS AFTER `{children}`, deliberately: the plate covers the whole
 * viewport, and rendering it last means it wins the paint order inside its own
 * stacking context before any z-index is consulted.
 *
 * IT OWNS THE DECISION, AND THE GATE NO LONGER DOES. `shouldPlayIntro()` is
 * read here, once, in a lazy initialiser — see `IntroSession.tsx` for the rule
 * and the ordering guarantee it depends on. That is a move of responsibility,
 * not a duplication: `IntroGate` used to hold `played` and an `alreadyPlayed`
 * skip path, and both are gone. The gate is now a component that only ever
 * exists in order to play.
 *
 * DECIDING HERE ALSO DELETES THE UNREVEALED FRAME ON EVERY SKIP PATH. The old
 * gate fired `onHandoff` and `onDone` from an EFFECT when it found the flag
 * already set, so a client navigation to `/` committed one frame at
 * `revealed={false}` before the headline appeared. Seeding `phase` from the
 * same read means the headline is revealed in FRAME 1 instead.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { IntroPhaseProvider, type IntroPhase } from "@/components/intro/IntroContext";
import { IntroGate } from "@/components/intro/IntroGate";
import { markIntroStarted, shouldPlayIntro } from "@/components/intro/IntroSession";

export function IntroProvider({ children }: { children: ReactNode }) {
  /*
    READ ONCE PER PROVIDER INSTANCE, IN RENDER, WITH NO WRITE BESIDE IT.

    A lazy initialiser rather than a bare call in the render body: the latter
    would be re-evaluated on every re-render — including the one this provider's
    own `onDone` triggers — and the gate would vanish from the DOM the instant
    the flag flipped, mid-hand-off, taking the dissolving plate with it. The
    read is also pure, which is what makes StrictMode's double render agree with
    itself; the write is in the effect below.
  */
  const [shouldPlay] = useState(shouldPlayIntro);

  /*
    Held as ONE object rather than two booleans so the context value is a single
    stable reference: two `useState`s would mean building a new object on every
    render and waking every consumer for a value that had not changed.

    SEEDED FROM THE DECISION. When there is no Intro to wait for, both wires are
    true from the first render — "nothing is gating you" — which is the same
    value the no-provider default carries, for the same reason.
  */
  const [phase, setPhase] = useState<IntroPhase>(() =>
    shouldPlay
      ? { arriving: false, plateCleared: false, introDone: false }
      : { arriving: true, plateCleared: true, introDone: true },
  );

  /*
    Written at START, and it is the term that keeps `introSettled`'s
    written-at-FINISH property meaningful under a layout-level mount: if this
    provider is ever torn down mid-sequence (an error boundary, Fast Refresh, a
    future non-intercepted exit from `(chrome)`) the next instance sees
    `introStarted` and plays the rest, instead of `documentEntered` swallowing
    the predicate and skipping it.

    NO CLEANUP, deliberately — see `IntroSession.tsx`. Setting an already-true
    boolean to true is idempotent, which is what makes StrictMode's
    mount/unmount/mount harmless.
  */
  useEffect(() => {
    if (shouldPlay) markIntroStarted();
  }, [shouldPlay]);

  /* Functional updates, and stable identities: `IntroGate` stores both in refs
     precisely so a parent re-render cannot restart a running timeline, and
     handing it a fresh closure every render would be working against that. */
  const handleHandoff = useCallback(() => {
    setPhase((p) => (p.arriving ? p : { ...p, arriving: true }));
  }, []);

  /* THE THIRD WIRE, and it fires between the other two — part-way into the
     dissolve, not at either end of it. `IntroContext.tsx` has the two
     measurements that rule out reusing `arriving` or `introDone` for it. */
  const handlePlateCleared = useCallback(() => {
    setPhase((p) => (p.plateCleared ? p : { ...p, plateCleared: true }));
  }, []);

  /* SETS BOTH, and that is a safety property rather than a convenience.
     `plateCleared` is delivered by a `tl.call` inside the dissolve, so a
     timeline killed between the hand-off and that call — an unmount, an error
     boundary, Fast Refresh — would otherwise leave the navbar holding the dark
     plate's palette over a page with no plate on it. Finishing implies the
     plate is gone, so `onDone` closes the wire unconditionally. Both terms are
     monotonic false -> true, so this can never run either one backwards. */
  const handleDone = useCallback(() => {
    setPhase((p) =>
      p.introDone ? p : { ...p, plateCleared: true, introDone: true },
    );
  }, []);

  return (
    <IntroPhaseProvider value={phase}>
      {children}
      {shouldPlay && !phase.introDone ? (
        <IntroGate
          onHandoff={handleHandoff}
          onPlateCleared={handlePlateCleared}
          onDone={handleDone}
        />
      ) : null}
    </IntroPhaseProvider>
  );
}

export default IntroProvider;
