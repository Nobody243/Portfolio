"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";

import { DURATION, EASE } from "@/lib/animation/easing";
import { FONT_SIZE_UNITS } from "@/components/ui/textHoverEffectMetrics";
import { useHoverCapable } from "@/lib/hooks/useHoverCapable";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * An outlined wordmark whose ink is brought to full strength by a
 * cursor-following radial mask.
 *
 * PROVENANCE, AND WHY THE FILE KEEPS ITS INSTALLED NAME. This arrived as
 * Aceternity's `text-hover-effect` registry component (`components.json` pins
 * the `@aceternity` registry). It is kept at its installed path and under its
 * installed export name so the provenance stays greppable — but it is NOT the
 * component that was installed. Roughly the only thing that survives is the
 * IDEA: an outlined wordmark whose stroke is revealed by a cursor-following
 * radial mask. That idea is genuinely right for `RevealFooter`'s plate — no
 * layout cost, no repeat, a defined end state, and it is a LUMINANCE event,
 * which is the vocabulary that surface already speaks.
 *
 * -------------------------------------------------------------------------
 * WHAT WAS CHANGED, AND WHY EACH CHANGE WAS NOT OPTIONAL.
 * -------------------------------------------------------------------------
 * Every one of these is a rule this repo records as MEASURED, not a taste
 * call. `.claude/handoff/master-followup-design.md` §C.0/§C.2.4 is the source.
 *
 *   1. FIVE HEX LITERALS DELETED (`#eab308 #ef4444 #3b82f6 #06b6d4 #8b5cf6`).
 *      `docs/03`'s whole-site sweep records ZERO hex literals in `app/` and
 *      `components/`, and CLAUDE.md allows two accents total. The reveal is now
 *      a luminance step in the surface's own foreground: `currentColor` at the
 *      parent's `/70` for the resting outline, `currentColor` at full strength
 *      through the mask. One hue, no new token, no new colour.
 *
 *      THE CYAN HALF OF THAT REFUSAL WAS OVERTURNED ON 2026-08-23, IN WRITING
 *      AND WITH THE ARITHMETIC. THE TEAL HALF STANDS, UNCHANGED.
 *
 *      It read: "NEITHER CYAN NOR TEAL, AND BOTH WERE REFUSED IN WRITING.
 *      `--accent-hero` cyan inside a 263x144 wordmark is ~9,300px of ink
 *      against the plate's one licensed 34x3px bar (102px) — 91x, which is not
 *      'sparingly'."
 *
 *      THE 9,300 WAS A FILL FIGURE, COMPUTED AGAINST A GEOMETRY THIS COMPONENT
 *      IS FORBIDDEN FROM PAINTING. It is this file's own "roughly five times"
 *      multiple of the outlined 1,860px — i.e. it priced a SOLID-FILLED,
 *      PERMANENT, device-independent wordmark. What Saad asked for, and what
 *      ships, is accent in the HOVER REVEAL ONLY. Recomputed against the real
 *      geometry, in order:
 *
 *        total outlined stroke ink at F=100    ~2,584px   (1,860 x 100/72)
 *        fraction inside the reveal disc       112.3 / 365.2 = 0.307 -> 794px
 *        mean mask alpha over a linear
 *          white->black disc                   exactly 1/3 -> ~265px
 *        cyan-weighted share of that           15.7%      -> ~42px
 *
 *      ~42px OF EFFECTIVE CYAN, present only while a fine pointer rests on the
 *      wordmark, against the licensed bar's 102px which is present 100% of the
 *      time the plate is on screen. That is ~0.4x the bar, not 91x, and it does
 *      not exist at all where `(hover: hover) and (pointer: fine)` is false.
 *      Both of CLAUDE.md's conditions — "sparingly", "on its own dark surface"
 *      — are met, on the plate CLAUDE.md licenses by name.
 *
 *      CYAN ON THE RESTING STROKE IS STILL REFUSED, and that version of the
 *      refusal is still correct: permanent, device-independent, ~1,163px of
 *      cyan. Cyan exists only inside the disc.
 *
 *      TEAL IS STILL REFUSED, AND MORE FIRMLY ON HOVER THAN AT REST. The area
 *      argument does not carry teal, because teal's objection was never area:
 *      `hero-accent` teal means "activate this" and nothing else on this site,
 *      so a 365px wordmark you cannot click that turns teal UNDER THE CURSOR is
 *      the canonical signal of an interactive control, on an `aria-hidden`
 *      non-link. At rest it is a static mistake; on hover it is an active lie.
 *      Do not "harmonise" this to teal later.
 *
 *      THE COLOUR IS GATED ON A REQUIRED `revealAccent` PROP WITH NO DEFAULT.
 *      See the prop's own docstring: this file is one call away from carrying
 *      #00E5FF onto a Tier 2 page, which is the `ParticleGrid` leak in its
 *      exact recorded form.
 *
 *   2. `font-[helvetica]` DELETED, three times. The site has two families and
 *      neither is Helvetica. This takes `font-sans` (Space Grotesk) from the
 *      caller's class, and the weight stays at the inherited 400 for the reason
 *      `RevealFooter`'s own `<h2>` states: the type scale carries the size.
 *
 *   3. `dark:stroke-neutral-800` DELETED. The plate is `bg-hero-surface`,
 *      PINNED DARK IN BOTH THEMES — a `dark:` variant here flips ink on a
 *      ground that does not flip, which is the exact bug `Intro.tsx` records
 *      finding on `MonogramMark` (1.09:1 in light mode). There is no `dark:`
 *      variant anywhere in this file and there must never be one.
 *
 *   4. **THE 4s `strokeDashoffset` DRAW-ON IS BACK (2026-08-26), AND THIS ITEM
 *      USED TO SAY IT WAS "DELETED, NOT RETIMED ... the disqualifying one".**
 *      Saad asked for the vendor component "as it is, with its hover and the
 *      text animation", so the draw ships.
 *
 *      THE OBJECTION WAS NEVER THE ANIMATION, IT WAS THE TRIGGER, and the
 *      objection was right: "the plate is in the viewport from FIRST PAINT,
 *      pinned at the bottom and occluded", so a mount-fired 4s draw finishes
 *      behind the page and is seen by nobody. That is still true and it is why
 *      the vendor's `initial`-on-mount is not what runs here.
 *
 *      WHAT THIS ITEM GOT WRONG was the next sentence: "RETIMING DOES NOT FIX
 *      IT: any trigger that would work is a SCROLL-POSITION DRIVER", against
 *      `RevealFooter`'s ban on "no GSAP, no ScrollTrigger, no parallax, no
 *      scroll-linked value, no `useScroll`". **A one-shot occlusion test is not
 *      a scroll-linked value.** Nothing here is driven BY scroll position: a
 *      passive listener asks `elementFromPoint` whether anything still covers
 *      the wordmark, and the first time the answer is no it sets one boolean
 *      and removes itself. No value is interpolated against scroll, nothing is
 *      pinned, and the listener is gone for the rest of the page's life. That
 *      is a different mechanism from the ones the ban names, and the ban's
 *      reason — a plate whose composition must not move with the scrollbar —
 *      is untouched by it.
 *
 *      IT IS STILL A DEVIATION FROM THE LETTER OF THAT LIST and is recorded as
 *      one rather than argued out of existence.
 *
 *   2. `font-[helvetica]` DELETED, three times. The site has two families and
 *      neither is Helvetica. This takes `font-sans` (Space Grotesk) from the
 *      caller's class, and the weight stays at the inherited 400 for the reason
 *      `RevealFooter`'s own `<h2>` states: the type scale carries the size.
 *
 *   3. `dark:stroke-neutral-800` DELETED. The plate is `bg-hero-surface`,
 *      PINNED DARK IN BOTH THEMES — a `dark:` variant here flips ink on a
 *      ground that does not flip, which is the exact bug `Intro.tsx` records
 *      finding on `MonogramMark` (1.09:1 in light mode). There is no `dark:`
 *      variant anywhere in this file and there must never be one.
 *
 *   4. THE 4s `strokeDashoffset` DRAW-ON IS DELETED, NOT RETIMED, and this is
 *      the disqualifying one. `RevealFooter.tsx` retired three `Reveal`s at
 *      every width for precisely this defect: "the plate is in the viewport
 *      from FIRST PAINT, pinned at the bottom and occluded, so [it] fires
 *      immediately, behind the page, and the sequence finishes before the
 *      visitor sees any of it." A mount-fired 4s stroke draw has that defect
 *      and is worse — it does not even need an IntersectionObserver to be
 *      wrong. RETIMING DOES NOT FIX IT: any trigger that would work (a
 *      ScrollTrigger on the sentinel, a high-threshold IO) is a SCROLL-POSITION
 *      DRIVER, and `RevealFooter`'s header lists "no GSAP, no ScrollTrigger, no
 *      parallax, no scroll-linked value, no `useScroll`" as things that must
 *      stay absent. The wordmark renders in its resting state. It is a fourth
 *      ELEMENT on that plate, not a fourth GESTURE.
 *
 *   5. **THE VENDOR'S RAINBOW SHIPPED FOR ONE DAY AND IS GONE AGAIN. THE RAMP
 *      IS THE PORTFOLIO'S OWN CYAN.** The full sequence, because each step
 *      overruled the one before it and the middle one is the reason several
 *      comments in this file are phrased the way they are:
 *
 *        original   `--accent-hero` cyan, gated behind a `revealAccent` prop.
 *                   This item refused the demo's five hues "permanently".
 *        2026-08-26 Saad asked for the vendor component "as it is". The five
 *                   stops shipped verbatim, the prop was deleted, and
 *                   `--accent-hero` left this file.
 *        2026-08-27 Saad: "change the colors to the portfolio theme." Back to
 *                   `--accent-hero`, now as a three-stop ramp with no prop —
 *                   the palette is not optional in either direction.
 *
 *      **THE TWO-ACCENT EXCEPTION IN CLAUDE.md IS RETIRED BY THIS**, not merely
 *      unused. The rainbow was the only place on the site where more than two
 *      accents appeared; that rule stands unqualified again, and `docs/03`'s
 *      DOM consumer count for `--accent-hero` goes back from ONE to TWO — this
 *      file and the 34x3px bar on the same plate.
 *
 *      THE CONSTRUCTION CAME BACK WITH THE COLOUR. The vendor paints through a
 *      `linearGradient` spanning the whole wordmark; this paints through a
 *      `radialGradient` centred on the cursor. `REVEAL_STOPS` carries why a
 *      one-hue ramp cannot use the vendor's: the middle of the word would show
 *      `currentColor` and read as the effect being broken.
 *
 *      TEAL IS STILL REFUSED, ON HOVER MORE FIRMLY THAN AT REST, and that half
 *      never depended on any of the above — see item 1. It is now MORE binding,
 *      because the footer's own links went teal on hover in the 2026-08-27
 *      redesign: two things a cursor can touch on one plate, one of which is
 *      real. Do not add teal here.
 *
 *      The `radialGradient` that drives the `<mask>` is NOT PAINT: it is a
 *      luminance ramp, never composited onto the plate, and it is byte-identical
 *      to what shipped originally.
 *
 *      THIS SECTION ONCE ENDED "Nothing on screen is ever a gradient: the
 *      wordmark is one flat colour at one of two strengths." That is still
 *      false, and the correction is smaller than it was: at rest the wordmark
 *      is one flat colour at a strength that now CHANGES ONCE on arrival (see
 *      `RECEDE_SECONDS`); under the cursor it is a cyan-cored ramp.
 */

/*
 * THE CAPABILITY QUERY MOVED TO `lib/hooks/useHoverCapable.ts` ON 2026-08-23,
 * when `/about`'s flip board became its second consumer. It used to be declared
 * here along with its three `useSyncExternalStore` helpers, under a long note
 * whose last line was "DO NOT MIX THE TWO SPELLINGS IN ONE COMPONENT" — which
 * is exactly the hazard a second private copy in a second file would have
 * created, one level up. The hook carries that whole argument now, including
 * why `ParticleGrid`'s width gate is correct where it is and must not be
 * harmonised to this one.
 *
 * WHAT DID NOT CHANGE: the server snapshot is still `false`, and this component
 * still gates only its EVENT HANDLERS, never its markup, so both branches emit
 * identical DOM.
 */

/** The viewBox is `0 0 viewBoxWidth 100`. Height is fixed so the caller only
 *  ever has to supply the string's measured advance. */
const VIEWBOX_HEIGHT = 100;

/** Space Grotesk cap height, em-relative. See `FONT_SIZE_UNITS`. */
const CAP_HEIGHT_RATIO = 0.7;

/**
 * The baseline, placed so the CAP BOX is optically centred in the 100-unit
 * viewBox: `(100 - 50.4) / 2 = 24.8` above the caps, baseline at `75.2`.
 *
 * EXPLICIT, RATHER THAN `dominantBaseline="middle"` AS THE DEMO HAD IT. The
 * `middle` baseline is defined against the font's x-height, which is the wrong
 * reference for an all-caps string and resolves out of the font's baseline
 * table rather than out of anything stated here. This is arithmetic on one
 * measured ratio and it lands the same in every engine.
 */
const BASELINE_Y = (VIEWBOX_HEIGHT + FONT_SIZE_UNITS * CAP_HEIGHT_RATIO) / 2;

/**
 * The reveal disc's radius, in USER UNITS — 39 of the 100-unit box, so a
 * 78-unit spotlight against a 70-unit cap: roughly one-and-a-bit letters at a
 * time. At a 144px render that is a ~112px disc.
 *
 * IT MUST MOVE WITH `FONT_SIZE_UNITS` AND NOTHING FORCES IT TO. The radius is
 * absolute in the viewBox while the box's rendered height is fixed by a class,
 * so when the type went 72 -> 100 on 2026-08-23 a radius left at 28 would have
 * held the disc at 40.3px while the cap grew to 100.8px — the spotlight
 * silently dropping from the "one-and-a-bit letters" this docstring states to
 * 0.79 of one letter, which reads as a keyhole rather than a reveal. THE
 * INVARIANT IS THE RATIO:
 *
 *     REVEAL_RADIUS_UNITS / (FONT_SIZE_UNITS x CAP_HEIGHT_RATIO)
 *       = 28 / 50.4 = 39 / 70 = 0.5571
 *
 * 28 x 100/72 = 38.89, rounded to 39 (0.5571 against the old 0.5556 — within
 * 0.3%). IF `FONT_SIZE_UNITS` EVER MOVES AGAIN, MOVE THIS WITH IT.
 *
 * USER UNITS AND `gradientUnits="userSpaceOnUse"` TOGETHER. The demo's `20%`
 * against `userSpaceOnUse` resolves against the viewport rather than the
 * viewBox and is ambiguous across engines; a user-unit radius is not.
 */
const REVEAL_RADIUS_UNITS = 39;

/** Stroke weight in CSS px, held constant at every rendered size by
 *  `vector-effect="non-scaling-stroke"`. Matches `ScrollCue`'s hairline. */
const STROKE_PX = 1.5;

/**
 * The resting outline's alpha — 0.45, and THE MECHANISM MATTERS AS MUCH AS THE
 * NUMBER.
 *
 * THE VALUE. 0.45 of `--color-hero-fg` (#E8EAEC) composited on
 * `bg-hero-surface` (#07090C) is #6C6E70, which is **3.91:1**. The caller used
 * to pass `text-hero-fg/70` (8.17:1); Saad asked on 2026-08-23 for a lighter,
 * more background-level resting state to go with the larger size. The next step
 * down, 0.40, computes to 3.31:1 — 0.31 of headroom over the floor, which is
 * the same thin margin this project has twice rejected as an unsafe rule
 * (`docs/03`'s `/60` on `bg-elevated`, and `/50` on this very surface). 0.35 is
 * 2.79:1 and fails outright. **0.45 IS THE FLOOR VALUE HERE AND 0.40 IS NOT A
 * FALLBACK.**
 *
 * THE FLOOR IT IS HELD TO IS 3:1, NOT 4.5:1, AND NOT "NONE". WCAG 1.4.3 exempts
 * logotypes outright and this is a signature wordmark, but "no requirement" is
 * not the standard this site holds: `docs/03` says `aria-hidden` exempts
 * nothing, because 1.4.3 protects a low-vision user looking straight at it. The
 * stricter of the two floors that actually apply to a DECORATIVE element is the
 * site's existing 3:1 non-text floor — the one `HeroHeadline`'s reduced-motion
 * chevron sits on at `/55`. 0.91 of headroom over it.
 *
 * WHY IT IS `strokeOpacity` AND NOT `text-hero-fg/45` ON THE PARENT. A text
 * token carrying a sub-`/70` alpha modifier would breach the letter of
 * `docs/03`'s floor rule, and it is exactly what that spec's whole-site sweep
 * greps for ("Sub-`/70` text opacities: 1"). It is also byte-identical in shape
 * to the loader regression this project just closed, where "the value silently
 * drifted to `/45` (3.90:1, failing)" — a future sweeper would flag it as that
 * bug and would be right to. As a PAINT PROPERTY on a decorative, `aria-hidden`
 * logotype it is categorically the same kind of value as `QUIET_FIELD`'s
 * `nodeAlpha` (0.30 / 0.17), which nobody has ever considered a text-opacity
 * violation because it is not one. The sweep stays clean and the count of
 * sub-`/70` TEXT opacities stays at 1.
 *
 * IT APPLIES TO THE RESTING LAYER ONLY. The masked reveal layer paints at full
 * strength through the gradient, so the rest -> hover ratio widens from 2.02x
 * to 4.23x — which is most of what makes the reveal a larger event at the new
 * size than it was at the old one.
 */
const RESTING_STROKE_ALPHA = 0.45;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE REVEAL RAMP — THE PORTFOLIO'S OWN ACCENT, NOT THE VENDOR'S RAINBOW.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **THIS BLOCK CARRIED `#eab308 #ef4444 #3b82f6 #06b6d4 #8b5cf6` — the
 * `ui.aceternity.com` demo's five hues — FROM 2026-08-26 TO 2026-08-27.** Saad
 * asked for the vendor component "as it is" and then, one day later, asked for
 * "the colors to the portfolio theme". Both are recorded because the first is
 * what the surrounding comments were written against.
 *
 * WHAT THAT CHANGE ALSO RETIRES: **the two-accent exception in CLAUDE.md.** The
 * rainbow was the site's only place where more than two accents appeared, and
 * that rule now stands unqualified again. `docs/03`'s DOM consumer count for
 * `--accent-hero` goes back from ONE to TWO — this file and the 34x3px bar on
 * the same plate.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT IS CYAN, AND IT IS CYAN BECAUSE THIS IS THE ONE PLATE THAT LICENSES IT.
 * ─────────────────────────────────────────────────────────────────────────
 * "The portfolio theme" on `bg-hero-surface` means exactly two colours, and
 * only one of them may be used here:
 *
 *   `--accent-hero` #00E5FF — TIER 1, licensed by name by CLAUDE.md for the
 *   Contact close beat ("sparingly"), 12.96:1 on #07090C, and NOT an
 *   affordance colour anywhere on the site.
 *
 *   `--color-hero-accent` #14B8A6 — the working teal. **STILL REFUSED HERE,
 *   and the refusal never depended on the rainbow.** Teal means "activate
 *   this" and nothing else on this site, so a wordmark that turns teal under
 *   the cursor is the canonical signal of an interactive control on an
 *   `aria-hidden` non-link. Do not add one. The footer's own links went teal on
 *   hover in the same redesign, which makes this MORE binding, not less: two
 *   things a cursor can touch on one plate, one of which is real.
 *
 * READ VIA `var(--accent-hero)`, WHICH IS THE ONLY WAY TO REACH IT. The token
 * is registered OUTSIDE Tailwind's `--color-*` namespace precisely so that no
 * utility can exist for it — `app/globals.css` says so — which makes every DOM
 * consumer a deliberate, greppable act. This is the second.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THREE STOPS, CENTRED ON THE CURSOR, NOT FIVE LAID ACROSS THE WORD.
 * ─────────────────────────────────────────────────────────────────────────
 * The vendor's construction is a `linearGradient` spanning the whole wordmark,
 * shown through the mask as whatever slice happens to be under the pointer.
 * That works for five contrasting hues and fails for one: with cyan at the ends
 * and `currentColor` in the middle, hovering the middle of the word would show
 * the resting colour and read as the effect being broken.
 *
 * So the ramp goes back to being **CENTRED ON THE DISC** — the construction
 * that shipped before the rainbow and that the `paintId` block below defends at
 * length. Every reveal then has a cyan core and a neutral surround WHEREVER it
 * happens, and the colour is caused by the pointer rather than being a static
 * property of the glyphs that the pointer merely uncovers.
 *
 * `currentColor` AT 45% AND 100% IS NOT PADDING. It is what makes the reveal a
 * SPOTLIGHT rather than a colour swap: the disc's rim matches the resting
 * outline exactly, so the revealed patch has no hard edge against the rest of
 * the word.
 */
const REVEAL_STOPS = [
  { offset: "0%", color: "var(--accent-hero)" },
  { offset: "45%", color: "currentColor" },
  { offset: "100%", color: "currentColor" },
] as const;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE DRAW-IN, AND THE BUG THAT SHIPPED WITH IT ON 2026-08-26.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The vendor animates `strokeDashoffset` 1000 -> 0 against a `strokeDasharray`
 * of 1000 over 4 seconds, `easeInOut`, and the outline writes itself on.
 *
 * **THE 1000 WAS A GUESS AND IT WAS TOO SMALL. MEASURED 2026-08-27: THE "SAAD"
 * OUTLINE IS ~1800 viewBox UNITS, so 1000 covered 56% of it and the wordmark
 * has been rendering AT REST WITH A MISSING MIDDLE ever since** — the pattern
 * is [N on, N off], so at offset 0 units 0-1000 paint, 1000-1800 do not. Only
 * the S and a few closing strokes were ever drawn. It went unnoticed because
 * the hover REVEAL layer carries no dash and paints the whole word, so every
 * screenshot taken to check the effect was of the state that hides the defect.
 *
 * HOW IT WAS MEASURED, since `<text>` has no `getTotalLength()` and cannot be
 * asked directly: set `strokeDasharray = strokeDashoffset = L` (which hides the
 * whole path once L >= its length), screenshot the box, and count non-background
 * pixels. The wordmark's ink reaches zero between L = 1750 (2px left) and
 * L = 1800 (0), against a constant floor from the UI inside the same clip.
 *
 * **THE THRESHOLD IS DERIVED FROM THE STRING NOW, NOT HARDCODED.** The outline
 * scales with the type size and with how many glyphs there are, and both of
 * those are already in `viewBoxWidth` — which is `advance x FONT_SIZE_UNITS`.
 * Measured ratio for "SAAD": 1800 / 253.6 = **7.1**. The factor below is 10, so
 * this string gets 2536 units, i.e. 41% headroom, and a different `text` scales
 * with it instead of silently re-breaking.
 *
 * THE COST OF THAT HEADROOM, STATED: the offset still animates to 0, so the
 * stroke is fully drawn once the offset passes `DASH_UNITS - outlineLength` —
 * at 2.84s of the 4s for "SAAD" — and the last ~1.2s is a no-op. Tuning that
 * out would mean animating to a target computed from the measured length, which
 * is exactly the string-specific magic number this replaced. On a watermark at
 * 0.1 alpha it is not worth the fragility.
 *
 * DO NOT "SIMPLIFY" THIS BACK TO A CONSTANT. A literal here is a number that is
 * correct for one string, fails silently for the next one, and fails in a way
 * that looks like a design choice.
 */
const DASH_UNITS_PER_VIEWBOX_UNIT = 10;
const DRAW_SECONDS = 4;

/**
 * ===========================================================================
 * THE RECEDE. THE OUTLINE WRITES ITSELF ON AT FULL STRENGTH, THEN FADES BACK.
 * ===========================================================================
 *
 * Saad, 2026-08-27: "I want the text to be outlined first time when you go to
 * the footer and then it reverses and it shows up when you hover on it as it is
 * just like now."
 *
 * SO THE DRAW-IN IS NOW WORTH WATCHING, WHICH IT WAS NOT BEFORE. It ran at the
 * caller's RESTING alpha, and `RevealFooter` sets that to 0.10 (1.22:1) - so a
 * four-second animation played out at a strength nobody could see, and the
 * arrival beat was spent on nothing. It now runs at `drawStrokeAlpha`, holds,
 * and then eases down to `restingStrokeAlpha`. The name announces itself once
 * and then becomes the watermark it is the rest of the time.
 *
 * WHAT "REVERSES" MEANS HERE, STATED BECAUSE THERE ARE TWO READINGS. The other
 * one is un-drawing the stroke - `strokeDashoffset` back to `dashUnits` - which
 * would leave NOTHING at rest and contradict the same brief's "idle state:
 * faint". This reverses the STRENGTH and leaves the outline drawn. If the
 * literal un-draw is ever wanted it is one more channel on the same `animate`,
 * and the idle state has to be reconsidered with it.
 *
 * THE DELAY IS `DRAW_SECONDS`, NOT THE 2.84s AT WHICH THE STROKE VISUALLY
 * FINISHES. `DASH_UNITS_PER_VIEWBOX_UNIT`'s note explains that gap: the dash
 * carries 41% headroom, so the last ~1.16s of the draw is a no-op. Delaying the
 * recede to the full 4s spends that no-op as a HOLD at full strength, which is
 * the beat the animation needed anyway. The two numbers are coupled - if the
 * headroom factor changes, this hold changes with it.
 *
 * 1.5s AND NOT `DURATION.reveal` (0.7s). This is not a scroll reveal; it is a
 * thing settling out of the way, and the site's reveal duration reads as a
 * dismissal at this size. It is a local constant for the same reason the
 * Intro's phase splits are local: one sequence's internal pacing, which nothing
 * else may reuse.
 *
 * UNDER `prefers-reduced-motion` THERE IS NO DRAW AND NO RECEDE - the outline
 * is simply at its resting alpha from the first frame. See the `animate`
 * targets, which fold the preference in rather than branching.
 */
const RECEDE_SECONDS = 1.5;

export const TextHoverEffect = ({
  text,
  viewBoxWidth,
  align = "leading",
  restingStrokeAlpha = RESTING_STROKE_ALPHA,
  drawStrokeAlpha = RESTING_STROKE_ALPHA,
  className,
}: {
  text: string;
  /**
   * The string's own advance width in user units at `FONT_SIZE_UNITS`, so the
   * box is the wordmark and carries no dead space on either side. The caller
   * supplies it because the caller is the one that knows the string; see
   * `RevealFooter.tsx`'s `WORDMARK_ADVANCE_UNITS` for the derivation from the
   * font's own metrics.
   */
  viewBoxWidth: number;
  /**
   * WHERE THE GLYPHS SIT INSIDE THE BOX. `"leading"` (the default) is Rule S-1
   * — the wordmark's leading edge lands on the spine, which is what every other
   * block on the site does and what this component shipped with.
   *
   * `"center"` EXISTS FOR ONE CALLER AND IS AN OPT-OUT WITH A REASON, not a
   * loosening. `RevealFooter` renders this as a full-bleed AMBIENT WATERMARK
   * behind the plate's content — an absolutely-positioned layer that spans the
   * whole container rather than a block sitting on the spine. A watermark that
   * fills the width has no leading edge to align: it IS the width. Rule S-1
   * governs where BLOCKS begin, and this layer is not in flow.
   *
   * Both values keep `meet`, so the glyphs are always fully inside the box and
   * can never be cropped by it.
   */
  align?: "leading" | "center";
  /**
   * THE RESTING OUTLINE'S ALPHA, defaulting to `RESTING_STROKE_ALPHA`.
   *
   * A PROP RATHER THAN A CONSTANT EDIT, because the two things this component
   * now renders want opposite answers and the constant's own docblock carries
   * the arithmetic for one of them. A wordmark set as a SIGNATURE has to be
   * readable (0.45, 3.90:1). A wordmark set as an ambient WATERMARK behind live
   * content must not be — see `WATERMARK_RESTING_ALPHA` at the call site.
   */
  restingStrokeAlpha?: number;
  /**
   * THE ALPHA THE DRAW-IN PLAYS AT, before it recedes to `restingStrokeAlpha`.
   * Defaults to `RESTING_STROKE_ALPHA` (0.45, 3.90:1 on #07090C), which is the
   * value a SIGNATURE form of this component wants at rest - so a caller that
   * passes neither prop gets the pre-2026-08-27 behaviour with no recede at
   * all, because the two alphas are then equal and the tween is a no-op.
   *
   * IT IS A SEPARATE PROP RATHER THAN A MULTIPLE OF THE RESTING ONE. A ratio
   * would make the readable state a function of the invisible one, which is
   * backwards: the draw has to clear a legibility bar and the idle state has to
   * sit under a distraction bar. Two independent judgements about two different
   * requirements. See `RECEDE_SECONDS`.
   */
  drawStrokeAlpha?: number;
  /** Sets `color`, which both layers read through `currentColor`. */
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  const hoverCapable = useHoverCapable();
  const reducedMotion = useReducedMotion();

  const [hovered, setHovered] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [maskPosition, setMaskPosition] = useState({
    cx: viewBoxWidth / 2,
    cy: VIEWBOX_HEIGHT / 2,
  });

  // `useId` rather than a literal: two instances on one page would otherwise
  // share one `<mask>` id, and the second would silently win. Nothing renders
  // two today; nothing should have to check.
  const dashUnits = viewBoxWidth * DASH_UNITS_PER_VIEWBOX_UNIT;

  const rawId = useId();
  const maskId = `wordmark-mask-${rawId}`;
  const gradientId = `wordmark-reveal-${rawId}`;
  // A THIRD paint id, derived the same way and for the same reason. Two
  // instances on one page would otherwise share it and the second would
  // silently win.
  const paintId = `wordmark-paint-${rawId}`;

  // Coalesced to one layout read per frame. `getScreenCTM()` honours
  // `preserveAspectRatio` and the viewBox mapping exactly, so there is no
  // hand-rolled scale/offset arithmetic here to drift out of sync with the
  // attributes above.
  const flush = useCallback(() => {
    frameRef.current = null;
    const svg = svgRef.current;
    const point = pendingRef.current;
    if (!svg || !point) return;

    /* ONE `getBoundingClientRect` PER FRAME, not one per event — this whole
       function is rAF-coalesced by its callers. The rect is what `hovered` is
       derived from now that the element receives no events of its own; see the
       listener below. */
    const box = svg.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const inside =
      point.x >= box.left &&
      point.x <= box.right &&
      point.y >= box.top &&
      point.y <= box.bottom;
    setHovered(inside);

    /* THE MASK CENTRE IS ONLY UPDATED WHILE INSIDE, and that is not an
       optimisation. Left un-gated, the disc would keep chasing the pointer
       across the rest of the page while the reveal faded out, so the last
       frames of the fade would show the spotlight sliding off sideways. Frozen
       at the exit point, it fades where it was. */
    if (!inside) return;

    const screenToUser = svg.getScreenCTM()?.inverse();
    if (!screenToUser) return;

    const mapped = new DOMPoint(point.x, point.y).matrixTransform(screenToUser);
    setMaskPosition({ cx: mapped.x, cy: mapped.y });
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════
     THE POINTER IS TRACKED ON `window`, NOT ON THIS ELEMENT.
     ═══════════════════════════════════════════════════════════════════════

     IT USED TO BE `onMouseEnter` / `onMouseLeave` / `onMouseMove` ON THE SVG,
     which is the vendor's arrangement and is correct for a component that owns
     its own box. **It stopped being correct on 2026-08-27, when `RevealFooter`
     made this an ambient watermark spanning the whole plate BEHIND the contact
     links**, and Saad's brief made the reason explicit: "`pointer-events-none`
     on the entire component — this is required, not optional, so cursor
     movement over it never blocks clicks on the links in front of it."

     THOSE TWO REQUIREMENTS ARE DIRECTLY OPPOSED ON ONE ELEMENT. `pointer-events:
     none` means this SVG never receives a pointer event, so element handlers
     receive nothing and the reveal is dead — not degraded, absent. Raising the
     links above it with `z-index` would keep the effect alive and would NOT
     satisfy the requirement as written: a full-bleed absolute layer under live
     content is exactly the thing that silently eats clicks the first time
     someone adds a control without checking the stack.

     SO THE LAYER IS INERT AND THE TRACKING MOVED OUT. One passive
     `pointermove` on `window`, rAF-coalesced exactly as before, plus a rect
     test that derives `hovered` from geometry rather than from event delivery.
     Nothing about the SVG's own box changes; what changed is who is listening.

     WHY A RECT TEST IS EXACTLY EQUIVALENT HERE, and where it is not: with
     element handlers, `hovered` meant "the pointer is over this box AND nothing
     is on top of it". With the rect test it means only the first clause — so a
     pointer over a link that sits in front of the watermark now counts as
     hovering the watermark. **That is the wanted behaviour on the one surface
     that uses it**: the watermark is a background, and a background that
     switched off whenever the cursor crossed the text in front of it would
     flicker constantly. A future caller that needs true occlusion semantics
     needs `elementFromPoint`, not this.

     `pointermove` RATHER THAN `mousemove`, and `{ passive: true }`: this
     listener never calls `preventDefault`, and pointer events are the modern
     spelling that also reports pen input. Touch is excluded by
     `hoverCapable` before the listener is ever attached, exactly as the element
     handlers were.

     `pointerleave` ON THE DOCUMENT clears `hovered` when the pointer leaves the
     window entirely — the one case the rect test cannot see, because no further
     moves arrive to tell it. */
  useEffect(() => {
    if (!hoverCapable) return;

    const onMove = (event: PointerEvent) => {
      pendingRef.current = { x: event.clientX, y: event.clientY };
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(flush);
    };
    const onLeave = () => setHovered(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [flush, hoverCapable]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════
     THE DRAW-IN STARTS WHEN THE WORDMARK IS ACTUALLY UNCOVERED, NOT ON MOUNT.
     ═══════════════════════════════════════════════════════════════════════

     The vendor fires its 4-second draw on mount, which is right for a component
     sitting in normal flow. **On this site's only consumer it would be a
     guaranteed no-op.** `RevealFooter` is a sticky curtain, and in that file's
     own words "the plate is in the viewport from FIRST PAINT, pinned at the
     bottom and occluded" — so a mount-triggered draw finishes during page load,
     behind the page, seen by nobody. That file retired its three `Reveal`s for
     exactly this reason and records that `IntersectionObserver` is useless on
     this surface for exactly this reason: an IO threshold fires at load, because
     intersection is not occlusion.

     SO THE TEST IS OCCLUSION, NOT INTERSECTION. `elementFromPoint` at the
     wordmark's own centre returns the topmost painted element there; when that
     is this SVG, nothing is covering it any more. One passive `scroll`
     listener, coalesced to at most once per frame, which removes itself the
     moment it fires.

     UNDER `prefers-reduced-motion` THE DRAW IS SKIPPED: `drawn` goes true
     immediately and the outline is simply there. A four-second self-writing
     line is decoration, which is the opposite of the call the reveal layer
     gets. */
  useEffect(() => {
    /* No `setDrawn(true)` here for the reduced-motion case, deliberately:
       calling setState synchronously in an effect body is a cascading render
       and this repo's ESLint config fails the build on it. The preference is
       folded into the `animate` target instead, where it costs nothing. */
    if (reducedMotion) return;
    const svg = svgRef.current;
    if (!svg) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const box = svg.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) return;
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return;

        /* THE PROBE TARGET IS THE NEAREST HIT-TESTABLE ANCESTOR, NOT THIS SVG.
           ═══════════════════════════════════════════════════════════════════
           This test used to be `svg.contains(top)`, and **making the SVG
           `pointer-events: none` on 2026-08-27 broke it silently**:
           `elementFromPoint` skips elements that are not hit-testable, so it
           could never return this SVG again, `drawn` never went true, and the
           resting outline stayed at full `strokeDashoffset` — i.e. INVISIBLE,
           permanently, with nothing erroring. Caught by reading
           `getComputedStyle(text).strokeDashoffset` off a live page and finding
           it still at its initial value seven seconds after exposure.

           Walking up to the first ancestor that IS hit-testable asks the same
           question about the same point: "is the box this component lives in
           the topmost thing here, or is something painted over it?" For the one
           caller that is the `<footer>` — the wrapper above is
           `pointer-events-none` too — and while the page stack covers the plate
           the topmost element there belongs to the stack, which the footer does
           not contain.

           IT DEGRADES TO THE OLD TEST when a caller leaves the component
           hit-testable: the loop exits immediately and `host` is the SVG. */
        let host: Element | null = svg;
        while (host && getComputedStyle(host).pointerEvents === "none") {
          host = host.parentElement;
        }
        if (!host) return;
        const top = document.elementFromPoint(cx, cy);
        if (!top || !(host.contains(top) || host === top)) return;
        setDrawn(true);
        window.removeEventListener("scroll", onScroll);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion]);

  /* ═══════════════════════════════════════════════════════════════════════
     THE DISC FOLLOWS THE CURSOR INSTANTLY. IT USED TO LAG BY `DURATION.micro`.
     ═══════════════════════════════════════════════════════════════════════

     THIS READ `reducedMotion ? 0 : DURATION.micro` UNTIL 2026-08-27, and that
     0.2s eased catch-up was the perceptible lag Saad reported. The mask centre
     is a `motion` value, so every pointer sample started a 200ms `EASE.ui`
     tween toward the new position; moving the cursor continuously re-targets
     that tween every frame, which is not the same as tracking. The disc rode
     ~200ms behind the hand and never caught up while the hand was moving. On a
     spotlight whose whole premise is that the visitor is holding the light,
     that reads as the effect being slow rather than as smoothing.

     ZERO IS NOT "NO ANIMATION ADDED HERE", IT IS THE ANIMATION REMOVED. The
     position is still updated once per frame, rAF-coalesced by `handleMove`
     above, from a real pointer sample. What is gone is the INTERPOLATION
     BETWEEN samples. The disc is now exactly where the cursor was on the frame
     it is drawn.

     THE REDUCED-MOTION BRANCH WENT WITH IT, AND ITS DISAPPEARANCE IS THE
     STRONGEST VERSION OF THAT BRANCH. It set 0 for reduced motion and argued
     that "making it follow instantly is the reduced-motion answer, not removing
     it" — which was right, and is now what everyone gets. There is no
     interpolation left to reduce, so there is no second path to keep in sync.
     `ThemeToggle.tsx` states the principle: "no second branch is the strongest
     possible reduced-motion story."

     `reducedMotion` IS STILL READ IN THIS FILE — the 4s draw-in honours it, and
     so does the reveal layer's fade. Only the follow stopped needing it. */
  const followDuration = 0;

  // Shared by both layers so they are the same shape to the pixel. Only the
  // colour strength and the mask differ.
  const glyphProps = {
    x: 0,
    y: BASELINE_Y,
    textAnchor: "start" as const,
    fill: "none",
    strokeWidth: STROKE_PX,
    vectorEffect: "non-scaling-stroke" as const,
    fontSize: FONT_SIZE_UNITS,
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewBoxWidth} ${VIEWBOX_HEIGHT}`}
      // Rule S-1 by DEFAULT: the leading edge is the spine, never a centred
      // column. `align="center"` is the one documented opt-out — see the prop.
      preserveAspectRatio={
        align === "center" ? "xMidYMid meet" : "xMinYMid meet"
      }
      xmlns="http://www.w3.org/2000/svg"
      /* `pointer-events-none` ON THE SVG ITSELF, not only at the call site.
         This element receives no pointer events any more — the tracking moved
         to `window` on 2026-08-27 — so leaving it hit-testable would buy
         nothing and would let a future caller place it over live content and
         eat clicks. `RevealFooter` also sets it on the wrapper; the
         guarantee should not depend on a caller remembering. */
      className={`pointer-events-none block select-none ${className ?? ""}`}
    >
      <defs>
        <motion.radialGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          r={REVEAL_RADIUS_UNITS}
          initial={false}
          animate={maskPosition}
          transition={{ duration: followDuration, ease: EASE.ui }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>

        {/*
          THE PAINT GRADIENT — the one thing on this plate that is a gradient,
          and it is a STROKE RAMP, never a surface. See §5 of the header.

          IT INHERITS `cx`, `cy` AND `r` FROM THE MASK'S GRADIENT VIA `href`,
          AND THAT IS THE MECHANISM RATHER THAN A CONVENIENCE. SVG gradient
          attribute inheritance hands this element the mask's ANIMATED centre
          for free, so there is exactly ONE animator and two consumers. Two
          independently-animated gradients following one pointer can differ by a
          frame, and a one-frame hue desync on a 1.5px stroke is a visible
          shimmer. Only the `<stop>` children are overridden.

          VERIFIED, not assumed: `href` is the SVG2 spelling and the legacy one
          is `xlink:href`. Measured in a headed production Chromium at three
          pointer x-positions, the sampled stroke hue tracks the cursor, which
          is only possible if inheritance resolves AND re-resolves as the
          referenced attributes animate. If a target engine is ever found where
          it does not, the fallback is a second `motion.radialGradient` bound to
          the same `maskPosition` state with the same transition — correct in
          practice, but it is the version with the desync exposure.

          THE RAMP IS CENTRED ON THE CURSOR, NOT LAID ALONG THE WORDMARK. A
          gradient anchored to the glyphs would be a static property OF the
          glyphs, shown through the mask as an arbitrary slice of itself: the
          colour would not be CAUSED by the pointer, and the right-hand letters
          would carry no accent at all at any pointer position. Centred, every
          reveal has a cyan core and a neutral surround wherever it happens.

          NOTHING HERE ANIMATES ON ITS OWN. No stop-offset animation, no hue
          rotation, no drift when the pointer is still. The only animated values
          on this element are the inherited pointer-driven `cx`/`cy`.
        */}
        {/* THE REVEAL PAINT.

            IT INHERITS `cx`, `cy` AND `r` FROM THE MASK'S GRADIENT VIA `href`,
            AND THAT IS THE MECHANISM RATHER THAN A CONVENIENCE. SVG gradient
            attribute inheritance hands this element the mask's animated centre
            for free, so there is exactly ONE animator and two consumers. Two
            independently-animated gradients following one pointer can differ by
            a frame, and a one-frame hue desync on a 1.5px stroke is a visible
            shimmer. Only the `<stop>` children are overridden.

            VERIFIED, not assumed: `href` is the SVG2 spelling and the legacy
            one is `xlink:href`. Measured in a headed production Chromium at
            three pointer x-positions, the sampled stroke hue tracks the cursor,
            which is only possible if inheritance resolves AND re-resolves as
            the referenced attributes animate.

            **THIS WAS A `linearGradient` SPANNING THE WHOLE WORDMARK FROM
            2026-08-26 TO 2026-08-27**, which is the vendor's construction and
            is right for five contrasting hues. It is wrong for a one-hue ramp:
            the middle of the word would have shown `currentColor` and read as
            the effect not working. See `REVEAL_STOPS`.

            THE STOPS RENDER ONLY WHILE HOVERED — kept from the vendor, and it
            is not an optimisation: an SVG gradient with no stops paints as
            `none`, so the reveal layer has nothing to show even if its opacity
            were wrong. That is the second of two independent reasons nothing
            colourful can appear at rest.

            NOTHING HERE ANIMATES ON ITS OWN. No stop-offset animation, no hue
            rotation, no drift when the pointer is still. The only animated
            values on this element are the inherited pointer-driven `cx`/`cy`. */}
        <radialGradient id={paintId} href={`#${gradientId}`}>
          {hovered
            ? REVEAL_STOPS.map((stop) => (
                <stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor={stop.color}
                />
              ))
            : null}
        </radialGradient>

        <mask id={maskId}>
          <rect
            x="0"
            y="0"
            width={viewBoxWidth}
            height={VIEWBOX_HEIGHT}
            fill={`url(#${gradientId})`}
          />
        </mask>
      </defs>

      {/* THE RESTING OUTLINE. IT WRITES ITSELF ON AT `drawStrokeAlpha`, HOLDS,
          THEN RECEDES TO `restingStrokeAlpha`.

          `strokeDashoffset` `dashUnits` -> 0 over `DRAW_SECONDS` is the
          vendor's animation and the vendor's timing, started by the exposure
          gate above rather than on mount. `strokeOpacity` is the 2026-08-27
          addition - see `RECEDE_SECONDS` for what "reverses" means here and for
          why its delay is the full `DRAW_SECONDS` rather than the 2.84s at
          which the stroke visually finishes.

          THE ALPHA IS ON THE PAINT, not on the caller's text token, and
          `RESTING_STROKE_ALPHA`'s docstring carries why the two mechanisms are
          not interchangeable.

          `initial={false}` IS DELIBERATELY NOT USED. This is the one animation
          in the file that must play from its `initial`, and both channels start
          there: hidden, and at the strength the draw is meant to be seen at.

          PER-CHANNEL TRANSITIONS RATHER THAN A SECOND PIECE OF STATE. The
          alternative was an `onAnimationComplete` flipping a `settled` boolean,
          which puts a render between the two phases and can drop a frame at the
          handover. A delay is declarative, has no such seam, and cannot strand
          the component in the middle state if it unmounts mid-sequence.

          REDUCED MOTION IS FOLDED INTO THE TARGETS, not branched around them:
          both durations and the delay go to 0, so the outline is simply at its
          resting alpha, fully drawn, on the first frame. */}
      <motion.text
        {...glyphProps}
        stroke="currentColor"
        strokeDasharray={dashUnits}
        initial={{
          strokeDashoffset: dashUnits,
          strokeOpacity: drawStrokeAlpha,
        }}
        animate={{
          strokeDashoffset: drawn || reducedMotion ? 0 : dashUnits,
          strokeOpacity:
            drawn || reducedMotion ? restingStrokeAlpha : drawStrokeAlpha,
        }}
        transition={{
          strokeDashoffset: {
            duration: reducedMotion ? 0 : DRAW_SECONDS,
            ease: "easeInOut",
          },
          strokeOpacity: {
            duration: reducedMotion ? 0 : RECEDE_SECONDS,
            delay: reducedMotion ? 0 : DRAW_SECONDS,
            ease: EASE.ui,
          },
        }}
      >
        {text}
      </motion.text>

      {/* The enhancement: the same outline at FULL strength, shown only through
          the cursor's disc, and ramped from cyan at the disc's centre to
          `currentColor` by 45% of its radius. `opacity` carries the fade in and
          out; the gradient carries the hue. The caller's `text-hero-fg` class
          used to be repeated here to override a `/70` parent — the parent is
          full strength now, so the override is gone rather than left fighting
          the gradient silently. */}
      <motion.text
        {...glyphProps}
        stroke={`url(#${paintId})`}
        mask={`url(#${maskId})`}
        initial={false}
        animate={{ opacity: hovered ? 1 : 0 }}
        /* THE FADE IS ASYMMETRIC, AND THE IN-EDGE IS NOW 0.
           IT WAS `hovered ? DURATION.micro : DURATION.ui` UNTIL 2026-08-27 —
           0.2s in, 0.35s out. The 0.2s in was the SECOND half of the lag the
           follow duration above was the first half of: even with the disc
           tracking perfectly, the layer it reveals took a fifth of a second to
           reach full strength, so the effect still arrived late. Zero means the
           reveal is already at full strength on the first frame the pointer is
           over the box, which is what "instant" has to mean.

           THE OUT-EDGE KEEPS `DURATION.ui`, DELIBERATELY. Fast-in / slow-out is
           the standard shape for a pointer-driven reveal and the two edges are
           answering different questions: arriving must feel like the visitor
           caused it, leaving must not flicker when the pointer crosses the
           box's edge or the wordmark briefly loses the pointer between frames.
           A 0ms out-edge turns every boundary graze into a hard blink. */
        transition={{
          duration: hovered ? 0 : reducedMotion ? 0 : DURATION.ui,
          ease: EASE.ui,
        }}
      >
        {text}
      </motion.text>
    </svg>
  );
};

export default TextHoverEffect;
