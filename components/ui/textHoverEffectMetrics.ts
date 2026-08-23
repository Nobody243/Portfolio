/**
 * The wordmark's type size — a plain module, and the split is a React Server
 * Component constraint rather than a preference.
 *
 * `text-hover-effect.tsx` is `"use client"`. `RevealFooter.tsx` is a SERVER
 * component and has to size the wordmark's box from this number. A server
 * component that imports a plain constant from a `"use client"` module does not
 * receive the VALUE — it receives a client reference, which reads as
 * `undefined`. MEASURED, not reasoned: exporting `FONT_SIZE_UNITS` from the
 * component and importing it into `RevealFooter` shipped
 * `style="aspect-ratio:NaN / 100"` into the served HTML, and it type-checked,
 * linted and built clean at 16/16 the whole time. The box simply had no width.
 *
 * So the number lives in a module with no `"use client"` directive, which both
 * sides can read as a value. Same shape and same reason as `msMarkGeometry.ts`
 * sitting beside `MonogramMark.tsx`.
 */

/**
 * The type size, in USER UNITS — 100 of the 100-unit box.
 *
 * It arrived as `text-7xl`'s 72 from the demo, kept as a number rather than as
 * a Tailwind class because inside a `viewBox` it is not a px size at all: it is
 * N user units in a 100-unit-tall box, i.e. it scales with the rendered height.
 * A Tailwind step here would be both wrong and misleading.
 *
 * -------------------------------------------------------------------------
 * 72 -> 100 ON 2026-08-23, AND THE LEVER IS FREE. Saad's request was a
 * dominant signature; this is the route this file's own note (below) said was
 * available. Raising the type size grows the glyphs INSIDE the same 100-unit
 * viewBox — the box's rendered HEIGHT is set by `h-2xl` / `h-3xl` on
 * `RevealFooter`'s wrapper and does not move, and only the WIDTH follows, via
 * `aspectRatio`. So the plate's composed content height is unchanged.
 *
 *   cap px at `h-3xl` = F x 0.7 x 1.44 = 1.008 F ->  72.58px becomes 100.8px
 *   rendered width    = F x 2.536 x 1.44 = 3.652 F -> 262.93px becomes 365.18px
 *
 * MEASURED AFTER THE CHANGE, 6 viewports x 2 themes x `/` and `/work`: the
 * plate's composed content is still 775.98px at every width from 1280 up and
 * `document.scrollHeight` moved 0px in 24 of 24. The known 7.98px overage at
 * 1366x768 is still exactly 7.98px and is still blank `pt-3xl` padding —
 * NEITHER of `RevealFooter`'s two named height levers was spent.
 *
 * GLYPH FIT, so a later raise knows where the wall is. The cap box occupies
 * `0.7F` of 100 units, centred by `BASELINE_Y`, leaving `(100 - 0.7F)/2` units
 * of air each side: 15 units (21.6px) at F=100, against a 0.75px stroke
 * half-width. Vertical clipping does not begin until F ~ 142. Horizontally the
 * binding case is 360px wide, not 1440: at `h-2xl` the measure is 318px and the
 * width is `2.257F`, so F <= 140 fits. F=100 leaves 92px of void there and
 * 897px at 1440, so Rule S-1's right void survives at every width.
 *
 * MEASURED, NOT ASSUMED: Space Grotesk's cap height is 700/1000 em (read out of
 * `public/fonts/space-grotesk-latin.typeface.json`, glyph `H`, which is flat
 * top and bottom so it carries no overshoot). So 100 user units of TYPE SIZE is
 * 70 user units of CAP HEIGHT, and at a 144px-tall render that is a 100.8px
 * cap. Font size and cap height are not the same number and the difference is
 * 1.43x.
 *
 * THE DESIGN BRIEF CONFLATED THE TWO AND ITS CAP FIGURES ARE OVERSTATED BY THAT
 * 1.43x. `master-followup-design.md` §C.2.2/§C.2.3 describe "a 72-unit cap in a
 * 100-unit viewBox" and then derive the string's advance from the same 72 as if
 * it were the em size. Both cannot be true. THE SHIPPED VALUE IS THE EM SIZE,
 * because that is the branch the brief's other numbers agree with — its ~1.8:1
 * aspect (measured 1.826:1), its ~259px rendered width (measured 262.94px) and
 * the right-void arithmetic that Rule S-1 rests on. What does NOT hold is the
 * brief's "103.7px cap / 1.53x `text-h2`": at 72 units the real cap was 72.6px,
 * which is 1.07x `text-h2`. Recorded here so a future resize starts from the
 * right ratio. That note ended "raising the type size to make the cap 103.7px
 * would take the rendered width from 263px to ~376px, which is a composition
 * change and Saad's call, not a correction" — THAT CALL WAS TAKEN ON
 * 2026-08-23, at F=100 rather than the 103 the brief implied, which lands the
 * cap at 100.8px (1.482x `text-h2`, 0.916x `text-h1`) and the width at
 * 365.18px.
 *
 * EXPORTED, AND THE EXPORT IS A COUPLING FIX RATHER THAN A CONVENIENCE.
 * `RevealFooter` has to size its own box from the string's advance, which is
 * `em-advance x FONT_SIZE_UNITS`. Until 2026-08-23 it stored the PRODUCT
 * (`WORDMARK_ADVANCE_UNITS = 182.6`, "derived at `FONT_SIZE_UNITS` = 72") — a
 * constant in one file whose correctness depended on a constant in this one,
 * held together by a comment. Raising the size here would silently invalidate
 * it and the box would grow dead space on its right, which reads as a wrong
 * indent off the spine. The caller now stores the EM-RELATIVE ADVANCE, which is
 * the measured font fact, and multiplies by this. One number, one place.
 */
export const FONT_SIZE_UNITS = 100;
