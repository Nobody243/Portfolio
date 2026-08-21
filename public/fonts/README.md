# Typeface asset — provenance and reproduction

`space-grotesk-latin.typeface.json` is **outline path data**, not a webfont. Nothing in the DOM is set
in it. DOM text uses next/font's self-hosted woff2, configured in `app/layout.tsx`.

## What it is for

**The Intro's morph source.** `docs/07_SITE_RESTRUCTURE.md` §3 specifies a sequence where the letters
of "Muhammad Saad" deform into the MS mark's circuit traces — "a becoming, not a crossfade." GSAP's
`MorphSVGPlugin` interpolates `path` → `path`, and it happily handles mismatched point and subpath
counts, but it cannot consume `<text>`: `convertToPath()` covers `rect` / `circle` / `ellipse` /
`line` / `polygon` / `polyline` and not text. Something has to supply glyph outlines as path data, and
this file is that something.

Two consequences worth stating, because both are easy to get wrong later:

- **It is read at build time, never at runtime.** No `opentype.js` on the first-paint path. §3.1 of
  `docs/07` rules that out explicitly — a runtime font parser to solve a problem with a static answer.
- **Step 1 of the Intro renders these outlines, not DOM text.** Fill and stroke do not interpolate, so
  a filled name would force a paint-mode swap mid-sequence, and any dressing of that swap is exactly
  the crossfade §3 rules out.

> **This file previously served the 3D hero wordmark** (`SaadGlass`, `TextGeometry`), and this README
> described that purpose — including a note about `Text3D` using `size ≈ 1.4286` to make cap height
> exactly one world unit. **That component and the entire R3F scene are deleted**; the hero is Canvas2D
> plus SVG. The asset survived the deletion unreferenced and its documentation kept describing a live
> dependency that no longer existed. Recorded rather than quietly overwritten, because "the docs
> described something that had been deleted" has now happened seven times on this project.

## Source

| | |
|---|---|
| Family | Space Grotesk, **Regular (400)** |
| File | `ttf/static/SpaceGrotesk-Regular.ttf` |
| Release | **v2.0.0** — `floriankarsten/space-grotesk`, `SpaceGrotesk-2.0.0.zip` |
| unitsPerEm | 1000 |
| OS/2 capHeight | **700** (= 0.7 em) |

Every row above is read out of the downloaded file, not restated from the previous version of this
README. The font's own name table reports `Version 2.000; ttfautohint (v1.8.3)`, subfamily `Regular`,
PostScript name `SpaceGrotesk-Regular`, which is what pins the release.

**Weight is Regular (400)** because no weight is specified anywhere in the project: `layout.tsx`
deliberately omits `weight` so next/font loads the full 300–700 variable axis, and no heading sets a
font-weight utility, so DOM headings render at 400. The Intro's outlines and the DOM text around them
therefore agree. Changing it means re-running the conversion below with a different static TTF —
nothing else in the codebase changes.

## Subset

**`A–Z`, `a–z`, and space. 53 glyphs, ~19 KB uncompressed.**

The previous cut was caps-only, 27 glyphs, and carried this warning: *"if the hero name ever changes to
include a character outside A–Z, this file must be regenerated."* That trap fired the moment the Intro
needed the full name — `Muhammad Saad` needs `u`, `h`, `a`, `m`, `d`, none of which were present.

**Full Latin letters retires the trap rather than moving it.** Regenerating for only the five missing
glyphs would have reset the same warning one character further out. Digits and extended punctuation
are still excluded: they are most of the weight of a full typeface JSON, and no sequence here uses
them. **If a rendered string ever includes a digit or punctuation mark, this file must be
regenerated** — a missing glyph does not fail the build, it throws at runtime when something asks for
it.

## Reproducing this file

Converted with `opentype.js` 2.0.0 via a throwaway script, installed with `--no-save` and not
committed — a permanent build dependency for a one-time conversion is a maintenance liability on a
project meant to be edited for a year with minimal surface.
`gero3.github.io/facetype.js` is the equivalent web tool and produces the same format; it is itself
opentype.js-based. Either route is fine.

Note that `opentype.load()` is deprecated in 2.0.0 and returns `undefined`; use
`opentype.parse(fs.readFileSync(path).buffer)`.

The output encodes paths using three's `FontLoader` command grammar, in **font units with Y up** —
opentype emits Y-down, so every `y` is negated:

```
m x y                    moveTo
l x y                    lineTo
q x y cpx cpy            quadraticCurveTo — END POINT FIRST, then the control point
b x y cp1x cp1y cp2x cp2y  bezierCurveTo — same convention
```

The `q` argument order is the one thing most likely to be got backwards, and getting it wrong
produces a glyph that is subtly wrong rather than obviously broken.

## Regression check — run this after any regeneration

**`M` and `S` are the two glyphs the Intro actually morphs**, so they are the ones that must not drift:

| Glyph | Contours | Commands | Advance |
|---|---|---|---|
| `M` | 1 | 16 `lineTo`, **0 curves** | 865 |
| `S` | 1 | 20 `lineTo` + 31 quadratics | 613 |

Both are single-contour, which is what makes the 1-to-1 morph topologically sound. `M` being pure
straight lines is why it morphs into a straight-segment trace almost for free; `S`'s 31 quadratics are
the expensive half.

When this file was regenerated from caps-only to full Latin, **all 27 original glyphs came out
byte-identical** — not just `M` and `S` — along with `ascender` (984), `descender` (−292),
`boundingBox`, `underlinePosition` and `underlineThickness`. That is the check that proves the
conversion settings did not drift. Reproduce it by diffing the `o` string of every shared glyph
against the previous file before replacing it.
