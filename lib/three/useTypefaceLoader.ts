"use client";

/**
 * Streaming typeface loader with REAL byte progress.
 *
 * WHY THIS EXISTS INSTEAD OF drei's `useProgress` (verified in the installed
 * packages, not assumed):
 *   - `drei/core/Progress.js` populates its store exclusively from three's
 *     `DefaultLoadingManager` events.
 *   - `drei/core/useFont.js` loads via a bare `await (await fetch(url)).json()`
 *     inside suspend-react. It never touches a three `Loader`, so the
 *     LoadingManager never fires.
 * A preloader bound to `useProgress` would therefore sit at zero and then
 * vanish. The thing being loaded is invisible to that meter.
 *
 * So we own the fetch. The parsed object is handed to `<Text3D font={...} />`
 * as FontData rather than a URL — drei's `loadFontData` returns non-string
 * input as-is, so this does NOT cause a second fetch.
 *
 * HONESTY RULE (governs every number this hook reports): the preloader may
 * only ever show progress we actually measured. When the transfer size cannot
 * be known, this reports `indeterminate` rather than inventing a curve. See
 * the Content-Encoding branch below.
 */

import { useEffect, useState } from "react";
import type { FontData } from "@react-three/drei";

/** 0 -> 0.85 is transfer; 0.85 -> 1 is scene-ready (geometry + shader compile).
 *
 *  This split is a WEIGHTING OF TWO REAL MILESTONES, not a timer. Both
 *  boundaries are real events: the last byte read, and the first frame rendered
 *  after `<Preload all />` has forced shader compilation. Cold-GPU shader
 *  compilation is a genuine slice of time-to-visible and deserves a share of
 *  the bar; pretending it is instant would make the loader lie in the other
 *  direction. */
export const TRANSFER_WEIGHT = 0.85;

export type TypefaceLoadState = {
  /** Parsed typeface, or null until the transfer completes. */
  font: FontData | null;
  /** 0-1, already scaled by TRANSFER_WEIGHT. Meaningless when indeterminate. */
  progress: number;
  /** True when the response gave us no honest way to measure a percentage. */
  indeterminate: boolean;
  /** Transfer finished (success or failure); distinct from scene-ready. */
  done: boolean;
  error: Error | null;
};

export function useTypefaceLoader(url: string): TypefaceLoadState {
  const [state, setState] = useState<TypefaceLoadState>({
    font: null,
    progress: 0,
    indeterminate: false,
    done: false,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Typeface fetch failed: ${res.status}`);

        const lengthHeader = res.headers.get("Content-Length");
        const encoding = res.headers.get("Content-Encoding");
        const total = lengthHeader ? Number(lengthHeader) : 0;

        // The gzip/brotli trap: with a compressed response `Content-Length` is
        // the COMPRESSED size while the reader yields DECOMPRESSED bytes, so a
        // naive ratio sails past 100%. A number we know is wrong is a
        // fabricated claim about loading, so we decline to show one at all.
        const measurable =
          !encoding && Number.isFinite(total) && total > 0 && !!res.body;

        if (!measurable) {
          if (!cancelled) {
            setState((s) => ({ ...s, indeterminate: true }));
          }
          const font = (await res.json()) as FontData;
          if (!cancelled) {
            setState({
              font,
              progress: TRANSFER_WEIGHT,
              indeterminate: true,
              done: true,
              error: null,
            });
          }
          return;
        }

        const reader = res.body!.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.byteLength;
            if (!cancelled) {
              const ratio = Math.min(received / total, 1);
              setState((s) => ({ ...s, progress: ratio * TRANSFER_WEIGHT }));
            }
          }
        }

        const merged = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.byteLength;
        }

        const font = JSON.parse(new TextDecoder().decode(merged)) as FontData;
        if (!cancelled) {
          setState({
            font,
            progress: TRANSFER_WEIGHT,
            indeterminate: false,
            done: true,
            error: null,
          });
        }
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;
        setState((s) => ({
          ...s,
          done: true,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return state;
}

export default useTypefaceLoader;
