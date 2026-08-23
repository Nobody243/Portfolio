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
 * The type size, in USER UNITS — 72 of the 100-unit box.
 *
 * This is `text-7xl`'s 72 from the demo, kept as a number rather than as a
 * Tailwind class because inside a `viewBox` it is not a px size at all: it is
 * 72 user units in a 100-unit-tall box, i.e. it scales with the rendered
 * height. A Tailwind step here would be both wrong and misleading.
 *
 * MEASURED, NOT ASSUMED: Space Grotesk's cap height is 700/1000 em (read out of
 * `public/fonts/space-grotesk-latin.typeface.json`, glyph `H`, which is flat
 * top and bottom so it carries no overshoot). So 72 user units of TYPE SIZE is
 * 50.4 user units of CAP HEIGHT, and at a 144px-tall render that is a 72.6px
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
 * brief's "103.7px cap / 1.53x `text-h2`": the real cap is 72.6px, which is
 * 1.07x `text-h2`. The wordmark is still by a wide margin the largest thing on
 * the plate — the next largest is 16px body text — so the CONCLUSION survives
 * and only the figure was wrong. Recorded here so a future resize starts from
 * the right ratio. Raising the type size to make the cap 103.7px would take the
 * rendered width from 263px to ~376px, which is a composition change and Saad's
 * call, not a correction.
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
export const FONT_SIZE_UNITS = 72;
