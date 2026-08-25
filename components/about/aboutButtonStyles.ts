/**
 * The `/about` action row's three button dressings — CLASS STRINGS ONLY.
 *
 * WHY A SEPARATE MODULE AND NOT CONSTANTS AT THE TOP OF EITHER COMPONENT. The
 * row is split across a server component (`AboutScreen`, which renders the two
 * secondary links) and a client one (`CvAction`, which renders the primary
 * control and the modal's own two buttons). A server component CANNOT import a
 * plain value out of a `"use client"` module — the bundler hands it a client
 * reference proxy, not the string, and the failure is a class name that renders
 * as `[object Object]` rather than an error. A neutral module both sides import
 * is the only shape that works, and it has the side benefit that the three
 * dressings are legible side by side.
 *
 * NOT in `aboutPageContent.ts`: that file's hard rules forbid Tailwind class
 * strings outright, for the same reason `content/types.ts` does.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SQUARE CORNERS, ON PURPOSE. `app/globals.css` ships NO radius token and says
 * so; these are the site's first filled and outlined controls and they are not
 * the place to introduce one.
 *
 * MONO UPPERCASE AT `text-caption`, matching the navbar. The bar is the site's
 * established control voice, and these are only the second and third
 * interactive surfaces on the whole site — they should sound like the first.
 *
 * `px-md py-sm` (21px / 13px) ON ALL THREE, so the row's controls share one
 * box even though only one of them is filled.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE BRUTAL TREATMENT NOW HAS CONSUMERS OUTSIDE `/about`, AND THIS FILE'S
 * NAME LIES ABOUT THAT. As of 2026-08-25 `BUTTON_BASE`, `BRUTAL_SHADOW` and
 * `BRUTAL_MOTION` are exported and imported by
 * `components/sections/projectButtonStyles.ts`, which dresses `/work`'s deck
 * panel controls, and the "Browse as a list" exit that renders on BOTH `/work`
 * and Home. They were module-private until then.
 *
 * SO THE TREATMENT NOW PAINTS ON THREE ROUTES (`/about`, `/work`, `/`) THROUGH
 * TWO DRESSING MODULES, PLUS `components/ui/link-preview.tsx`'s card frame,
 * which imports `BRUTAL_SHADOW` directly. CLAUDE.md's rule is that tier is a
 * property of render sites — generalising a dressing carries it to new pages
 * without anyone typing a token. Checked: every one is a Tier 2/3 surface and
 * nothing here references `--accent-hero` in any form.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE "THIRD SURFACE" TRIGGER HAS FIRED, AND THE MOVE IS OUTSTANDING.
 * ─────────────────────────────────────────────────────────────────────────
 * The three surfaces are `/about`'s action row, `link-preview.tsx`'s card frame,
 * and `/work`'s deck controls (which Home's exit reuses).
 *
 * **THIS BLOCK PREVIOUSLY REPORTED THE TRIGGER AS NOT FIRED, BY COUNTING
 * MODULES THAT IMPORT THE ATOMS RATHER THAN SURFACES — and that count was
 * artificially low for exactly the wrong reason.** `link-preview.tsx` was not an
 * importer on 2026-08-25 because it carried a **verbatim second copy of the
 * five-layer shadow string** as an inline class. So the duplication this file
 * exists to prevent was the very thing keeping the trigger from firing, and
 * `projectButtonStyles.ts`'s "do not paste the class strings here" rule was
 * written while a pasted copy already existed one directory away. That copy is
 * closed: `link-preview.tsx` imports `BRUTAL_SHADOW` now.
 *
 * **WHAT IS STILL OUTSTANDING, STATED PLAINLY RATHER THAN LEFT IMPLICIT:** the
 * three atoms should live in `components/ui/`, and they do not. `link-preview.
 * tsx` — a `components/ui/` primitive — currently reaches into
 * `components/about/` for a class string, which is backwards.
 *
 * **WHY IT WAS NOT DONE IN THE SAME CHANGE.** The move touches this file,
 * `projectButtonStyles.ts`, `link-preview.tsx`, `AboutScreen.tsx` and
 * `CvAction.tsx`; it landed in a session with concurrent agents holding two of
 * those files, where a file move is the least reviewable diff available and
 * cannot be verified by anything the build reports. Closing the duplicate needed
 * one import and is independently correct either way. **The move is Saad's to
 * schedule, and nothing further should be added to these atoms until it
 * happens.**
 *
 * Until then: the three exported strings are site-wide, the three
 * `ABOUT_BUTTON_*` compositions and the two `ABOUT_SCRAMBLE_*` inks are
 * `/about`'s alone, and the file's name lies about all of it.
 *
 * NOTE ON THE CLIENT BOUNDARY, because it is what makes any of this legal: this
 * module is **directive-free on purpose**. `AboutScreen` (server) and
 * `link-preview.tsx` / `ProjectDeck` (client) all import from it, which only
 * works while it has no `"use client"` of its own and no imports that would
 * force one. Do not add either.
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Everything the three share: the box, the voice, and the focus ring.
 *
 * "THE THREE" IS `/about`'s ROW. Since 2026-08-25 this string is also the box
 * for `/work`'s deck controls (Details / GitHub / Live Site) and its "Browse as
 * a list" exit — see the export note in this file's header. The sentence is
 * kept in its original terms because the VALUES were chosen for that row; the
 * later consumers adopted them rather than the other way round.
 *
 * THE FOCUS RING IS `outline-offset-2`, WHICH IS LOAD-BEARING ON THE FILLED
 * ONE. A teal ring drawn ON a teal fill is invisible; offsetting it by 2px puts
 * it on `bg-base`, where `accent-working` is 7.95:1 in dark and 5.34:1 in
 * light. Do not remove the offset to "tighten" the ring.
 */
export const BUTTON_BASE =
  "inline-flex items-center justify-center px-md py-sm text-caption font-mono uppercase " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-working";

/* ───────────────────────────────────────────────────────────────────────────
   THE BRUTAL TREATMENT — adopted 2026-08-25, from Aceternity's Tailwind CSS
   Buttons collection ("Brutal"). Its markup is NOT in the `@aceternity`
   registry: that entry ships only a `ButtonsCard` demo wrapper and pulls
   `@tabler/icons-react` with it. The button itself is a copy-paste class string
   on the collection's page, taken from there verbatim:

     px-8 py-0.5  border-2 border-black dark:border-white uppercase bg-white
     text-black transition duration-200 text-sm
     shadow-[1px_1px_rgba(0,0,0),2px_2px_rgba(0,0,0),3px_3px_rgba(0,0,0),
             4px_4px_rgba(0,0,0),5px_5px_0px_0px_rgba(0,0,0)]
     dark:shadow-[...the same five in rgba(255,255,255)]

   WHAT SURVIVES: the 2px edge, the uppercase voice, the square corners, and the
   stacked 1/2/3/4/5px hard offset shadow that is the whole idea. What changed,
   and why none of it was optional:

     `border-black dark:border-white` AND THE `dark:` SHADOW PAIR -> `border-fg`
     and ONE `var(--color-brutal-edge)` shadow. The demo needs two declarations because
     it names two literal colours; `--color-fg` already IS #ededed in dark and
     #151515 in light, so a single token expresses both. `app/globals.css`
     states that a `dark:` prefix in a component signals a MISSING TOKEN — here
     the token existed and the variant was the workaround.

     `bg-white text-black` -> `bg-base text-fg`. Same reason. The fill has to be
     opaque rather than inherited, because a hard shadow behind a transparent
     control shows through the control.

     `px-8 py-0.5` AND `text-sm` -> the row's own `px-md py-sm` and
     `text-caption font-mono uppercase`, i.e. `BUTTON_BASE` above, untouched.
     The brutal treatment is THE EDGE AND THE SHADOW; taking its padding too
     would have broken the row, which is built on all three controls sharing one
     box. The demo's `uppercase` is already what `BUTTON_BASE` does.

     `transition duration-200` TRANSITIONED NOTHING in the demo — it has no
     hover or active state for it to animate, so it is dead code there. It is
     kept and given something to do: see `BRUTAL_MOTION`.

   ALL THREE CONTROLS ARE 46.8px, BY CONSTRUCTION RATHER THAN BY TUNING.
   `BUTTON_BASE`'s `px-md py-sm` plus `text-caption`'s 16.8px line box is
   42.8px, and every one of the three carries the same `border-2`, so each adds
   the same 4px. There is no longer a second number to keep in sync — an
   earlier revision had View CV wearing a gradient ring whose padding had to be
   hand-matched to this border, and that pairing is gone with it.
─────────────────────────────────────────────────────────────────────────── */

/**
 * The stacked offset shadow — five shadows, 1px through 5px, all one colour.
 *
 * IT IS FIVE AND NOT ONE 5px SHADOW. Stacking them fills the diagonal, so the
 * result is a solid slab offset down-right rather than a single hard edge with
 * a gap behind it. That is the difference between brutalism and a drop shadow,
 * and it is why the demo writes all five out.
 *
 * NO LAYOUT COST: a box-shadow is outside the box model, so none of this moves
 * anything. It does OVERLAP — 5px down and right — so a control needs 5px of
 * visual clearance from whatever follows it. The action row's `gap-sm` (13px)
 * covers that in both axes at every width.
 */
export const BRUTAL_SHADOW =
  "shadow-[1px_1px_var(--color-brutal-edge),2px_2px_var(--color-brutal-edge),3px_3px_var(--color-brutal-edge),4px_4px_var(--color-brutal-edge),5px_5px_0px_0px_var(--color-brutal-edge)]";

/**
 * HOVER AND PRESS — the one part of the treatment ADDED rather than adapted,
 * and the reason the demo's orphaned `transition duration-200` is kept.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE TRANSITION LIST SAID `transform` UNTIL 2026-08-25 AND MOVED NOTHING.
 * ─────────────────────────────────────────────────────────────────────────────
 * TAILWIND v4 WRITES THE `translate` PROPERTY, NOT `transform` —
 * `.hover\:-translate-x-\[2px\]:hover` emits
 * `--tw-translate-x: calc(2px * -1); translate: var(--tw-translate-x) …`. So
 * `transition-[box-shadow,transform]` listed a property nothing on this control
 * ever sets, and the travel SNAPPED while only the shadow eased.
 *
 * THAT FALSIFIED THE ARITHMETIC BELOW, WHICH IS WHY THIS NOTE IS HERE AND NOT
 * IN A CHANGELOG. The three-state description says the shadow's far corner does
 * not move. With the travel snapping and the shadow easing, the far corner
 * travelled INWARD 2px on hover and eased back out over 200ms — the exact
 * wobble the paired numbers were chosen to prevent. The description was written
 * as measured and was not; it is true as of this fix.
 *
 * Caught by review, not by any check: the class compiles, the utilities all
 * emit, the button visibly reacts to hover, and nothing anywhere goes red. The
 * same Tailwind v4 fact was independently rediscovered in
 * `components/sections/ProjectStripRow.tsx` (`transition-[opacity,translate]`,
 * not `[opacity,transform]`) — twice in one build, so treat any
 * `transition-[…transform…]` in this repo as suspect until checked against the
 * emitted CSS.
 *
 * Aceternity's Brutal button has no hover state and no press state: its
 * `transition duration-200` has nothing to transition, which is the complaint
 * people actually have about the style. The slab now does the thing the style
 * implies. Three states, and the arithmetic between them is the whole trick:
 *
 *   REST   shadow 1..5px, no travel.
 *   HOVER  travel -2px,-2px; shadow extended to 1..7px. Because the box moves
 *          up-left by exactly as much as the shadow lengthens, THE SHADOW'S FAR
 *          CORNER DOES NOT MOVE — the slab reads as lifting off the page rather
 *          than sliding across it, and the control's outer visual bound is
 *          unchanged, so nothing needs extra clearance for the hover state.
 *   PRESS  travel +3px,+3px; shadow collapsed to 1..2px. Slammed down.
 *
 * IT IS A TRANSFORM, NEVER A COLOUR. `ExternalLink` records the site's hover
 * rule and its reason: every step away from full `accent-working` costs
 * contrast, and the light-mode value (#0f766e, 5.34:1) has none to spare. That
 * rule is about COLOUR and it is not weakened here — there is no `hover:bg-`,
 * no `hover:text-` and no `hover:border-` anywhere below. Its accompanying
 * sentence ("never a transform") was written for links in running prose; Saad
 * asked for the animation on these controls on 2026-08-25, and a transform
 * costs zero contrast. `docs/03`'s motion system already names "hover, press"
 * as the micro-interaction tier.
 *
 * `duration-200` IS NOT A NEW NUMBER. It is the demo's own value and it is also
 * exactly `DURATION.micro` (0.2s) from `lib/animation/easing.ts`. It is written
 * as a utility rather than imported because this is a CSS transition inside a
 * class string, not a JS animation — `easing.ts` says in as many words that CSS
 * wants ms and to multiply at the call site rather than duplicate the table.
 *
 * REDUCED MOTION IS HANDLED IN CSS, not by `useReducedMotion`, and that is
 * structural rather than lazy. This module exists precisely so `AboutScreen`
 * can stay a SERVER component; a hook here would drag it and the whole action
 * row across the client boundary for a few pixels of travel. `motion-reduce:`
 * is the same media query with none of that cost.
 *
 * NOTE WHAT SURVIVES REDUCED MOTION: the SHADOWS still change on hover and on
 * press. Only the TRAVEL is dropped. So both states stay legible as states —
 * which is the point of `prefers-reduced-motion`, not "remove the feedback".
 */
export const BRUTAL_MOTION =
  "transition-[box-shadow,translate] duration-200 " +
  "hover:-translate-x-[2px] hover:-translate-y-[2px] " +
  "hover:shadow-[1px_1px_var(--color-brutal-edge),2px_2px_var(--color-brutal-edge),3px_3px_var(--color-brutal-edge),4px_4px_var(--color-brutal-edge),5px_5px_var(--color-brutal-edge),6px_6px_var(--color-brutal-edge),7px_7px_0px_0px_var(--color-brutal-edge)] " +
  "active:translate-x-[3px] active:translate-y-[3px] " +
  "active:shadow-[1px_1px_var(--color-brutal-edge),2px_2px_0px_0px_var(--color-brutal-edge)] " +
  "motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 " +
  "motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0";

/**
 * The primary: View CV.
 *
 * SAME SLAB AS THE SECONDARIES, DIFFERENT FILL — and that is the whole
 * hierarchy now. `border-2 border-fg`, the same five-layer `var(--color-brutal-edge)`
 * shadow, the same hover lift and press. The only thing that separates it from
 * GitHub and LinkedIn beside it is that it is filled with `accent-working`
 * instead of `bg-base`. One primary, two secondaries, one visual language.
 *
 * IT WORE A TRAVELLING GRADIENT EDGE (`HoverBorderGradient`) FROM 2026-08-24
 * TO 2026-08-25 and no longer does — Saad's call, and the instruction was
 * explicit that the COLOUR was to stay exactly as it was. It did: the fill is
 * the same `bg-accent-working text-on-accent` the gradient's plate carried, and
 * the same pairing `ABOUT_BUTTON_PRIMARY` shipped with originally. The
 * component file is still installed at `components/ui/hover-border-gradient.tsx`
 * with its full adaptation record; it simply has no call site.
 *
 * `text-on-accent` IS MANDATORY HERE AND IS NOT INTERCHANGEABLE WITH `text-fg`.
 * `--color-on-accent` is #0a0a0b in dark and #fdfcfa in light — it inverts with
 * the theme in the OPPOSITE direction to `--color-fg`, because the surface
 * under it (`accent-working`: #14b8a6 dark, #0f766e light) gets DARKER in light
 * mode while the page gets lighter. `text-fg` here would be #ededed on #14b8a6
 * (1.9:1) in dark and #151515 on #0f766e (2.8:1) in light — both fail, and the
 * dark case fails in the mode nobody toggles out of while implementing.
 *
 * THE EDGE AND THE SHADOW ARE `fg`, NOT `on-accent`, and that is deliberate
 * even though they touch the filled surface. They are drawn OUTSIDE the fill,
 * on `bg-base`, so they are read against the page rather than against the teal
 * — which is the same reason `BUTTON_BASE`'s focus ring is offset by 2px.
 * Matching them to the secondaries is what makes the three read as one set.
 *
 * NO HOVER COLOUR CHANGE, unchanged from the original dressing and for the
 * original reason: every step away from full `accent-working` costs contrast,
 * and the light-mode value has none to spare. The hover is `BRUTAL_MOTION`'s
 * lift and nothing else.
 */
export const ABOUT_BUTTON_PRIMARY =
  `${BUTTON_BASE} border-2 border-brutal-edge bg-accent-working text-on-accent ${BRUTAL_SHADOW} ${BRUTAL_MOTION}`;

/**
 * The secondaries: GitHub, LinkedIn, and the modal's Download.
 *
 * THIS WAS `border border-accent-working/40 text-fg` UNTIL 2026-08-25, and the
 * reasoning that dressing carried is kept here rather than deleted, because it
 * is the argument to answer if the brutal treatment is ever reverted:
 *
 *   "BORDER AT `/40`, NOT `/70`. The `/70` floor in this project governs TEXT,
 *   which carries a reading load; this is an edge, which carries none. `/40` on
 *   `bg-base` is a quiet rule in both themes and keeps the outline from
 *   competing with the filled control beside it."
 *
 * THAT LAST CLAUSE IS THE REAL TRADE, AND IT WAS MADE DELIBERATELY on Saad's
 * call: a `border-fg` slab under a five-layer shadow DOES compete with the
 * filled control beside it — that is what brutalism is. The primary keeps its
 * own separate device (the travelling gradient edge, `HoverBorderGradient`), so
 * the hierarchy now rests on TREATMENT rather than on loudness.
 *
 * TEXT IS STILL `text-fg`, NOT `text-accent-working`. Unchanged, and the reason
 * is unchanged: these are controls, not links — the teal-and-underline
 * treatment is `ExternalLink`'s and belongs to running prose. Two of the three
 * ARE external links underneath; the dressing is what differs, which is exactly
 * the split `ExternalLink` was built for (semantics there, colour and size at
 * the call site).
 */
export const ABOUT_BUTTON_SECONDARY =
  `${BUTTON_BASE} border-2 border-brutal-edge bg-base text-fg ${BRUTAL_SHADOW} ${BRUTAL_MOTION}`;

/**
 * The modal's Close — the brutal edge, NO shadow, and that gap is the point
 * rather than an omission.
 *
 * Download and Close sit side by side in the modal head, and `CvAction` records
 * the requirement in as many words: Close must be visually distinct from the
 * control beside it. Giving both the full five-layer shadow makes them one pair
 * of identical slabs and deletes the distinction the modal was built with.
 *
 * A DIMMER SHADOW WAS THE OTHER OPTION AND WAS REFUSED: `--color-fg` at some
 * fraction is a value nobody chose, in a system whose whole discipline is that
 * every value is a token. So the family is the edge and the voice, and the
 * shadow is what the quiet one does without. It still lifts and presses — `BRUTAL_MOTION`
 * travels it the same distances — so it reads as the same kind of object.
 *
 * IT KEEPS `px-md py-sm` so its hit area matches Download's exactly, and it
 * keeps `text-fg/70`, the site's standard subordinate ink, which sits above the
 * /70 text floor. THE BORDER IS `border-fg/70` TO MATCH THAT INK rather than
 * `border-fg`: a full-strength edge around subordinate text is the one
 * combination that would read as louder than Download rather than quieter.
 */
export const ABOUT_BUTTON_QUIET =
  `${BUTTON_BASE} border-2 border-brutal-edge/70 bg-base text-fg/70 ${BRUTAL_MOTION}`;

/* ───────────────────────────────────────────────────────────────────────────
   THE SCRAMBLE INK - what an UNRESOLVED character is painted in while
   `EncryptedButtonLabel` is running. Resolved characters are never given a
   class: they inherit the control's own ink, which is the whole point.

   IT IS TWO VALUES BECAUSE THE ROW HAS TWO SURFACES, and this is the one place
   the three controls genuinely cannot share a string. The hero's tagline paints
   its unresolved characters in the accent (`hero-accent` on a pinned dark
   plate) and that relationship - ACCENT while unsettled, normal ink once
   settled - is what Saad asked to bring here. It transfers to the two outlined
   controls exactly. It cannot transfer to the filled one: View CV's background
   IS `accent-working`, so accent-on-accent is 1:1 and the scramble would be
   INVISIBLE on the very control the row is built around.

   WHY THESE ARE CONSTANTS IN *THIS* FILE AND NOT IN THE COMPONENT.
   `EncryptedButtonLabel` is a `"use client"` module and `AboutScreen` is a
   server component. A server component cannot import a plain value out of a
   client module - the bundler hands it a client reference proxy, and the
   failure is a class name rendering as `[object Object]` rather than an error.
   That is the same reason this whole file exists; see its header. Do not move
   them "next to the component".

   THE PROP IS REQUIRED AND HAS NO DEFAULT, following `ExternalLink`'s rule for
   the identical hazard: "A prop with a default does the wrong thing silently
   when it is omitted." Defaulting to the on-base value would make a forgotten
   prop on the filled control render an invisible scramble - which looks like
   the effect simply not firing, and is the single hardest failure here to
   notice.
─────────────────────────────────────────────────────────────────────────── */

/**
 * On `bg-base` - GitHub and LinkedIn.
 *
 * The hero relationship, unchanged: `accent-working` is 7.95:1 on base in dark
 * and 5.34:1 in light, so the ciphertext clears AA as text in both themes even
 * though it is `aria-hidden` and never read aloud.
 */
export const ABOUT_SCRAMBLE_ON_BASE = "text-accent-working";

/**
 * On the filled `accent-working` surface - View CV.
 *
 * `text-on-accent` AT /75, which is a LUMINANCE step rather than a hue change,
 * because hue is the one axis this surface has already spent. MEASURED, not
 * eyeballed: #0a0a0b at 75% over #14b8a6 composites to a relative luminance of
 * 0.0290 against the fill's 0.3718, i.e. **5.34:1** - which happens to be the
 * exact figure `accent-working` scores on base in light mode, so the ciphertext
 * is no weaker here than it is on the two controls beside it.
 *
 * /75 AND NOT /60: the softer value was tried first and computes to 3.73:1.
 * That clears the 3:1 non-text floor and fails AA for text, and these ARE
 * glyph shapes a sighted visitor reads even if assistive technology never sees
 * them. The site does not ship text below AA anywhere; a decorative frame is
 * not a licence to start.
 */
export const ABOUT_SCRAMBLE_ON_ACCENT = "text-on-accent/75";
