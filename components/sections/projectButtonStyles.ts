import {
  BRUTAL_MOTION,
  BRUTAL_SHADOW,
  BUTTON_BASE,
} from "@/components/about/aboutButtonStyles";

/**
 * The project deck's control dressings — CLASS STRINGS ONLY.
 *
 * THREE STRINGS, ALL COMPOSED FROM `/about`'s ATOMS, NOT COPIED FROM THEM.
 * `BUTTON_BASE`, `BRUTAL_SHADOW` and `BRUTAL_MOTION` were module-private in
 * `components/about/aboutButtonStyles.ts` until 2026-08-25 and are now exported
 * for exactly this file. **Do not paste the class strings here.** A second copy
 * of a five-layer shadow is a second source of truth, and the two would drift
 * the first time one of them was retuned. That file's header carries the
 * matching note, and the rule it states: a THIRD surface is the point to move
 * the atoms to `components/ui/`.
 *
 * WHY A SEPARATE MODULE AND NOT CONSTANTS IN `ProjectDeck.tsx`. Two reasons,
 * and the first is the same structural one `/about` has. `ProjectDeckSection`
 * is a SERVER component (it renders the heading and the "Browse All"
 * exit) while `ProjectDeck` is a client one, and a server component cannot
 * import a plain value out of a `"use client"` module — the bundler hands it a
 * client reference proxy and the failure is a class name rendering as
 * `[object Object]` rather than an error. Second: the four dressings are only
 * legible as a set when they sit side by side.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THE CONTROLS ARE BRUTAL AND THE CARDS ARE NOT — the one place this
 * feature runs the louder of the site's two languages, per the design brief §E.
 *
 * THE SPLIT IS CONTROLS vs SURFACES AND THE SITE ALREADY DRAWS IT THERE. The
 * brutal treatment landed on `/about`'s three CONTROLS, and
 * `components/ui/link-preview.tsx`'s frame borrowed it. Both are small,
 * bounded, actionable objects. It has never been applied to a content surface,
 * and the deck's cards and panel are content surfaces — they stay flat, square
 * and shadowless (`ProjectDeck.tsx` §D states that in full). Applying a
 * five-layer shadow to five overlapping tilted cards would be the first crack
 * in the site's zero-shadow-tokens discipline; applying it to a button is the
 * treatment doing the job it already has.
 *
 * IT IS AN INLINE ARBITRARY VALUE REFERENCING `--color-brutal-edge`, NOT A
 * `--shadow-*` TOKEN, so "zero shadow tokens site-wide" stays literally true.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * NO NEW COLOUR, NO NEW SIZE, NO NEW SPACING. Every token below is verified
 * against `app/globals.css`: `accent-working`, `on-accent`, `elevated`, `base`,
 * `fg`, `brutal-edge`. Nothing here may reference `--accent-hero` in any form —
 * `/work` is Tier 2/3 and that token is registered outside the `--color-*`
 * namespace precisely so no utility exists for it.
 */

/**
 * **Details** — the panel's primary, and the only filled control in the row.
 *
 * It is an internal `<Link>` to `/projects/<slug>`, which the interceptor at
 * `app/(site)/@modal/(.)projects/[slug]/` turns into `ProjectOverlay`. It is
 * present on every project unconditionally, which is what makes it the primary:
 * GitHub and Live Site are derived from `links` and two of the five projects
 * have neither.
 *
 * `text-on-accent` IS MANDATORY AND IS NOT INTERCHANGEABLE WITH `text-fg`.
 * `--color-on-accent` inverts in the OPPOSITE direction to `--color-fg`, because
 * the surface under it (`accent-working`: #14b8a6 dark, #0f766e light) gets
 * darker in light mode while the page gets lighter. `text-fg` here is 1.9:1 in
 * dark — a failure in the mode nobody toggles out of while implementing.
 * `aboutButtonStyles.ts` carries the same note against the same pairing.
 *
 * THE FOCUS RING KEEPS `outline-offset-2` (it comes from `BUTTON_BASE` and must
 * not be tightened): a teal ring drawn ON a teal fill is invisible. Offset by
 * 2px it lands on the panel's `bg-elevated`, where `accent-working` holds
 * 7.5:1 in dark per `app/globals.css`.
 */
export const PROJECT_BUTTON_PRIMARY = `${BUTTON_BASE} border-2 border-brutal-edge bg-accent-working text-on-accent ${BRUTAL_SHADOW} ${BRUTAL_MOTION}`;

/**
 * **GitHub** and **Live Site** — the panel's two conditional secondaries.
 *
 * ONE DELIBERATE DEVIATION FROM `ABOUT_BUTTON_SECONDARY`: the fill is
 * `bg-elevated`, not `bg-base`. These sit on the expanded panel, whose surface
 * IS `bg-elevated`. A `bg-base` fill there would be a near-invisible ΔE 2.89
 * chip in dark mode and a visibly LIGHTER chip in light mode — a value nobody
 * chose. `/about`'s row sits on `bg-base`, which is why its secondaries are
 * filled with it; the rule in both places is "fill with the surface you are
 * standing on", and it produces two different tokens.
 *
 * The fill has to be opaque rather than inherited for the same reason
 * `/about`'s does: a hard offset shadow behind a transparent control shows
 * through the control.
 *
 * TEXT IS `text-fg`, NOT `text-accent-working`. These are controls, not links —
 * the teal-and-underline treatment is `ExternalLink`'s and belongs to running
 * prose. Both of these ARE external links underneath (they are rendered through
 * `ExternalLink`, which supplies `target`, `rel` and the new-tab note); the
 * dressing is what differs, which is exactly the split that component was built
 * for.
 */
export const PROJECT_BUTTON_SECONDARY = `${BUTTON_BASE} border-2 border-brutal-edge bg-elevated text-fg ${BRUTAL_SHADOW} ${BRUTAL_MOTION}`;

/**
 * **Browse All** — the exit to `/projects`. (Labelled "Browse as a list"
 * until 2026-08-27; see `projectDeckContent.ts` for the rename.)
 *
 * **TWO CALL SITES SINCE 2026-08-25, NOT ONE.** `ProjectDeckSection` renders it
 * on `/work` below the deck, and `Projects` renders it on Home below the three
 * featured cards. One control on two pages, one destination, one dressing —
 * which is the whole reason it is a named constant rather than a class string
 * at a call site.
 *
 * `bg-base` IS STILL CORRECT ON BOTH, by the same "fill with the surface you
 * are standing on" rule stated below: Home's project section is `bg-base` too
 * (`Projects.tsx` records the no-tint decision and its three reasons). If a
 * future caller puts this control on `bg-elevated`, it needs
 * `PROJECT_BUTTON_SECONDARY`'s fill, not this one.
 *
 * `bg-base`, not `bg-elevated`, by the same "fill with the surface you are
 * standing on" rule as above: this control sits on the section background, not
 * on the panel. That makes it byte-identical to `ABOUT_BUTTON_SECONDARY`
 * today — and it is still a separate constant, because the two are equal by
 * coincidence of surface rather than by intent, and importing an
 * `ABOUT_BUTTON_*` name into `/work` would make `/about`'s row the definition
 * of a control on a page it has nothing to do with.
 *
 * THE HOVER LIFT AND THE PRESS *ARE* THE "ANIMATED BUTTON" §1 ASKS FOR.
 * `BRUTAL_MOTION` is a real three-state device (rest / lift −2,−2 with the
 * shadow extended to 7px so its far corner does not move / press +3,+3 with the
 * shadow collapsed) and it already carries its own `motion-reduce:` branch.
 * **Do not add a travelling gradient, a moving border, a shimmer or a glow.**
 * `HoverBorderGradient` was removed from `/about`'s primary on Saad's
 * instruction on 2026-08-25; reintroducing that family days later, on a
 * NAVIGATION control, would be drift. `components/ui/moving-border.tsx` is in
 * the same category and is refused by name in the design brief.
 *
 * **THE LABEL SCRAMBLE ADDED ON 2026-08-27 IS NOT A COUNTER-EXAMPLE TO THAT
 * PARAGRAPH.** Saad asked for it by name, and it is a different KIND of thing
 * from the four refused above: those are decorations applied to the button's
 * CHROME — its border, its fill, a light sweeping across it — whereas this
 * happens to the label's own glyphs and is the device `/about`'s controls and
 * the hero tagline already share. It adds no layer, no gradient and no moving
 * geometry; `BRUTAL_MOTION` remains the only thing that moves. It is also
 * width-stable by construction: `BUTTON_BASE` is `font-mono`, so every
 * substituted glyph has the same advance and the button's box cannot change
 * mid-scramble.
 */
export const PROJECT_BUTTON_NAV = `${BUTTON_BASE} border-2 border-brutal-edge bg-base text-fg ${BRUTAL_SHADOW} ${BRUTAL_MOTION}`;

/**
 * THE SCRAMBLE INK for `PROJECT_BUTTON_NAV`'s label — what an UNRESOLVED
 * character is painted in while `EncryptedButtonLabel` is running on the
 * `Browse All` control. Added 2026-08-27 on Saad's instruction ("add the
 * encrypted text effect on browse as a list").
 *
 * `accent-working` ON `bg-base` IS 7.95:1 IN DARK AND 5.34:1 IN LIGHT, so the
 * ciphertext clears AA as text in both themes even though it is `aria-hidden`
 * and never read aloud. That is the same relationship `/about`'s row measured;
 * the control sits on the same surface, so the arithmetic transfers rather than
 * being re-derived.
 *
 * ONLY THE UNSETTLED STATE IS TINTED. There is no `PROJECT_REVEALED_*` to go
 * with it, deliberately: a character that has landed should be
 * indistinguishable from one that was never scrambled, which means inheriting
 * the control's own `text-fg` rather than being told what it is.
 *
 * **BYTE-IDENTICAL TO `ABOUT_SCRAMBLE_ON_BASE`, AND STILL A SEPARATE
 * CONSTANT** — the same call this file already makes for `PROJECT_BUTTON_NAV`
 * itself, which equals `ABOUT_BUTTON_SECONDARY` today. The two are equal by
 * coincidence of surface, not by intent, and importing an `ABOUT_*` name into
 * `/work` and Home would make `/about`'s row the definition of a control on two
 * pages it has nothing to do with. If `/about` ever retunes its ciphertext
 * colour, this one must not move with it silently.
 *
 * THIS IS NOT A LICENCE FOR THE OTHER TWO DRESSINGS. `PROJECT_BUTTON_PRIMARY`
 * and `PROJECT_BUTTON_SECONDARY` have no scramble ink because nothing scrambles
 * on them yet. Add one when a call site needs it, measured against ITS surface
 * — `text-accent-working` on a filled accent is the failure
 * `ABOUT_SCRAMBLE_ON_ACCENT` exists to prevent.
 */
export const PROJECT_SCRAMBLE_ON_BASE = "text-accent-working";
