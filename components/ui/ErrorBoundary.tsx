"use client";

/**
 * THE ONLY CLASS COMPONENT IN THIS CODEBASE — and that is deliberate, not an
 * accident or a leftover. React error boundaries require `componentDidCatch` /
 * `getDerivedStateFromError`, which have no hooks equivalent, and no
 * error-boundary library is installed (nor is one worth a dependency for ~20
 * lines).
 *
 * WHAT THIS CATCHES, precisely: errors thrown by React scene children inside
 * <Canvas>. R3F wraps its children in its own boundary and re-throws outward
 * via `setError` -> `if (error) throw error`, so a throwing scene child DOES
 * arrive here as a normal render-phase error.
 *
 * WHAT IT CANNOT CATCH used to be listed here as WebGL context-creation
 * failure, guarded by lib/hooks/useWebGLSupport.ts. Both are gone: the hero
 * rebuild removed R3F, so there is no async renderer setup left to fail
 * outside a render phase. Nothing replaced the hook because nothing needs to —
 * Canvas2D and SVG have no equivalent construction step.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Rendered in place of `children` after an error. */
  fallback?: ReactNode;
  /** Notifies the owner so it can drop to its own fallback presentation. */
  onError?: (error: Error) => void;
};

type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Deliberately still logged: swallowing this would hide a real fault from
    // whoever is debugging, and the fallback is silent by design.
    console.error("Scene error caught by ErrorBoundary:", error, info);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

export default ErrorBoundary;
