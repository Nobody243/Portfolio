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
 */

import { useCallback, useState, type ReactNode } from "react";

import { IntroPhaseProvider, type IntroPhase } from "@/components/intro/IntroContext";
import { IntroGate } from "@/components/intro/IntroGate";

export function IntroProvider({ children }: { children: ReactNode }) {
  /*
    Held as ONE object rather than two booleans so the context value is a single
    stable reference: two `useState`s would mean building a new object on every
    render and waking every consumer for a value that had not changed.
  */
  const [phase, setPhase] = useState<IntroPhase>({
    arriving: false,
    introDone: false,
  });

  /* Functional updates, and stable identities: `IntroGate` stores both in refs
     precisely so a parent re-render cannot restart a running timeline, and
     handing it a fresh closure every render would be working against that. */
  const handleHandoff = useCallback(() => {
    setPhase((p) => (p.arriving ? p : { ...p, arriving: true }));
  }, []);

  const handleDone = useCallback(() => {
    setPhase((p) => (p.introDone ? p : { ...p, introDone: true }));
  }, []);

  return (
    <IntroPhaseProvider value={phase}>
      {children}
      {!phase.introDone ? (
        <IntroGate onHandoff={handleHandoff} onDone={handleDone} />
      ) : null}
    </IntroPhaseProvider>
  );
}

export default IntroProvider;
