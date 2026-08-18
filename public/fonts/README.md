# Hero typeface asset — provenance and reproduction

`space-grotesk-caps.typeface.json` is the extruded-geometry source for the hero wordmark
(`SAAD`). It is **not** a webfont — nothing in the DOM uses it. DOM text uses next/font's
self-hosted woff2, configured in `app/layout.tsx`.

## Source

| | |
|---|---|
| Family | Space Grotesk, **Regular (400)** |
| File | `ttf/static/SpaceGrotesk-Regular.ttf` |
| Release | **v2.0.0** — `floriankarsten/space-grotesk`, `SpaceGrotesk-2.0.0.zip` |
| unitsPerEm | 1000 |
| OS/2 capHeight | **700** (= 0.7 em — this is why `Text3D` uses `size ≈ 1.4286` to make cap height exactly 1.0 world unit; see the design brief §0) |

**Weight is Regular (400)** because no weight is specified anywhere in the project: `layout.tsx`
deliberately omits `weight` so next/font loads the full 300–700 variable axis, and no heading sets a
font-weight utility, so DOM headings render at 400. The 3D wordmark and the WebGL-fallback `<h1>`
therefore render at the same weight, which matters because the fallback is meant to read as the same
composition with the 3D layer removed. Changing it means re-running the conversion below with a
different static TTF — nothing else in the codebase changes.

## Subset

`A–Z` plus space. **27 glyphs, 8.3 KB uncompressed** (~3 KB over the wire with Brotli).

No lowercase, no digits, no punctuation — the wordmark treatment is locked all-caps, and digits plus
extended punctuation are most of the weight of a full typeface JSON.

**If the hero name ever changes to include a character outside `A–Z`, this file must be
regenerated.** A missing glyph does not fail the build — `TextGeometry` throws at runtime when it
cannot find one.

## Reproducing this file

Converted with `opentype.js` 2.0.0 via a throwaway script (installed with `--no-save`, not committed
— a permanent build-time dependency for a one-time conversion is a maintenance liability on a project
meant to be edited for a year with minimal surface).

`gero3.github.io/facetype.js` is the equivalent web tool and produces the same format; it is itself
opentype.js-based. Either route is fine. The output must encode paths using three's `FontLoader`
command grammar:

```
m x y                       moveTo
l x y                       lineTo
q endX endY cX cY           quadraticCurveTo(c, end)
b endX endY c1X c1Y c2X c2Y bezierCurveTo(c1, c2, end)
```

Verified before use: `SAAD` rasterised from this JSON with even-odd fill produced **7 contours**
(S=1, A=2, A=2, D=2), i.e. the counters in `A`, `A` and `D` are real holes rather than filled — which
is the specific failure mode that makes extruded type look subtly wrong.

## License

Space Grotesk is licensed under the SIL Open Font License 1.1. `OFL.txt` is the notice, and OFL 1.1
requires it to travel with any derived font — which this JSON is. **Do not delete it.**
