# Typeface asset — provenance and reproduction

`space-grotesk-latin.typeface.json` is **outline path data**, not a webfont. Nothing in the DOM is set
in it. DOM text uses next/font's self-hosted woff2, configured in `app/layout.tsx`.

## What it is for

**The Intro's name.** `docs/07_SITE_RESTRUCTURE.md` §3 opens the site with "Muhammad Saad", which then
merges into the MS mark. Step 1 renders that name from THESE OUTLINES rather than as DOM `<text>`, and
`components/ui/msMarkGlyphs.ts` is the committed conversion of the glyphs it needs.

**THE REASON CHANGED ON 2026-08-21 AND THE ASSET DID NOT — read this before deleting anything.** This
README used to say the file existed because GSAP's `MorphSVGPlugin` interpolates `path` → `path` and
cannot consume `<text>`, so a morph from letterforms into the mark's circuit traces needed outline
data. **That morph is gone.** The mark is filled faceted shapes now, `MorphSVGPlugin` is no longer
registered, and phase C is a convergence plus a crossfade.

**What keeps the outlines is a different, still-live property:** they put the name and the mark in
**one coordinate system**. `msMarkGeometry.ts` places each glyph at its position in the settled mark,
so a capital's journey through phase C is a tween to the IDENTITY transform — it lands on its faceted
letter exactly, same baseline, same cap height, same left edge. That exactness is what makes the
crossfade read as one letterform settling into another rather than two misaligned images dissolving.
DOM text would need a `TextMetrics` baseline probe to approximate it, and `Intro.tsx` deleted one of
those already.

Two consequences worth stating, because both are easy to get wrong later:

- **It is read at build time, never at runtime.** No `opentype.js` on the first-paint path. §3.1 of
  `docs/07` rules that out explicitly — a runtime font parser to solve a problem with a static answer.
- **The name is FILLED**, like the mark. The old "everything is stroked, nothing is ever filled" rule
  was a morph constraint (fill and stroke do not interpolate) and is void.

> **This file previously served the 3D hero wordmark** (`SaadGlass`, `TextGeometry`), and this README
> described that purpose — including a note about `Text3D` using `size ≈ 1.4286` to make cap height
> exactly one world unit. **That component and the entire R3F scene are deleted**; the hero is Canvas2D
> plus SVG. The asset survived the deletion unreferenced and its documentation kept describing a live
> dependency that no longer existed. Recorded rather than quietly overwritten, because "the docs
> described something that had been deleted" has now happened seven times on this project — and the
> paragraph above is the eighth near-miss, caught deliberately: the asset stayed live, its stated
> reason did not.

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

**`M` and `S` are the two glyphs that have to land on the faceted mark**, so they are the ones that
must not drift:

| Glyph | Contours | Commands | Advance |
|---|---|---|---|
| `M` | 1 | 16 `lineTo`, **0 curves** | 865 |
| `S` | 1 | 20 `lineTo` + 31 quadratics | 613 |

Placed at the mark's cap height these are 258 and 189 viewBox units wide, against the faceted M's 248
and S's 216. **That near-match is the crossfade's whole quality argument** — each capital dissolves
into a shape of its own size in its own place. A regeneration that changed these advances would move
the name off the mark, so they are recorded as the check.

When this file was regenerated from caps-only to full Latin, **all 27 original glyphs came out
byte-identical** — not just `M` and `S` — along with `ascender` (984), `descender` (−292),
`boundingBox`, `underlinePosition` and `underlineThickness`. That is the check that proves the
conversion settings did not drift. Reproduce it by diffing the `o` string of every shared glyph
against the previous file before replacing it.
