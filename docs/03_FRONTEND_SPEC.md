# Frontend Specification Document — Muhammad Saad Portfolio

## Color system

**Dark mode (default):**
| Token | Hex | Use |
|---|---|---|
| `bg-base` | `#0A0A0B` | Primary background |
| `text-fg` | `#EDEDED` | Body/heading text |
| `bg-elevated` | `#121214` | Cards / elevated surfaces — one step up from base |
| `bg-tint-cool` | `#0B1116` | Faint blue undertone — reserved for cloud/infra-leaning content blocks, used sparingly |
| `bg-tint-warm` | `#0B120E` | Faint green undertone — reserved for code/dev-leaning content blocks, used sparingly |
| `accent-hero` | `#00E5FF` | Hero 3D glow/particles/lighting, and the small Contact-section echo ONLY |
| `accent-working` | `#14B8A6` | Links, tags, highlights, borders — everywhere else |
| `--field-ink` | `#9EC9D4` | `/about`'s particle field ONLY. Not an accent, no utilities — see below |

**Light mode (toggle):**
| Token | Hex | Use |
|---|---|---|
| `bg-base` | `#FDFCFA` | Primary background (warm neutral) |
| `bg-elevated` | `#F4F4F4` | Cards / elevated surfaces — one step up from base |
| `bg-tint-cool` | `#F4F9FF` | Faint blue-white undertone — reserved for cloud/infra-leaning content blocks or hover states, used sparingly |
| `bg-tint-warm` | `#F8FBF8` | Faint green-white undertone — reserved for code/dev-leaning content blocks, used sparingly |
| `text-fg` | `#151515` | Body/heading text |
| `accent-hero` | `#00E5FF` — same hex as dark mode | Unchanged; renders on the 3D scene's own dark backdrop. See the accent-tuning clarification below |
| `accent-working` | `#0F766E` (dark mode: `#14B8A6`) | Same teal, darkened for contrast — `#14B8A6` on `#FDFCFA` is 2.44:1 and fails AA for text |
| `--field-ink` | `#33474C` (dark mode: `#9EC9D4`) | `/about`'s particle field ONLY. Flips direction with the ground, unlike either accent |

**Rule:** the two tinted whites are a subtle echo of the cyber(green)/cloud(blue) duality — they should
be used as occasional, quiet background tints (e.g. behind a "Systems Foundation" vs "Currently Building
Toward" skill group), never as competing primary surfaces. If in doubt, default to `bg-base` or
`bg-elevated`. No other accent or neutral colors are introduced anywhere in the system.

> **`--field-ink` is the one addition to that list, and it is not an accent.** Added 2026-08-22.
> `/about` renders the hero's particle mesh at `QUIET_FIELD` density, and until that date the canvas
> hardcoded `--accent-hero`, so a Tier 2/3 page painted a full-viewport field in `#00E5FF` in **both**
> themes. That was never a theme bug: light mode did not inherit a dimmed dark value, it painted the
> identical hex while the ground flipped out from under it. Measured at the shipped `nodeAlpha` of
> 0.28, the composite was ΔL\* **+24.30** against `#0A0A0B` (emitted light, a star) and ΔL\* **−6.00**
> against `#FDFCFA` (a dark speck on warm paper). The direction inverts, which is why lowering the
> opacity could not fix it — it produces fainter dirt.
>
> Teal was refused as the replacement: `globals.css` already draws that line for image frames
> ("keeping these neutral is what lets teal mean *activate this* and nothing else"), and a
> full-viewport non-interactive layer is the largest possible version of that mistake. A pure neutral
> was refused too — grey speckle on near-black is what sensor noise looks like, and a small cool bias
> is the difference between atmosphere and noise.
>
> Registered as `--field-ink`, **outside** the `--color-*` namespace, so `text-field-ink` /
> `bg-field-ink` do not exist — the same mechanical guard `--accent-hero` uses, for the same reason.
> One consumer, `components/hero/ParticleGrid.tsx`, which reads it as canvas channels.
>
> Measured on the shipped build, sampled off the composited canvas at 1440×900 and 375×667:
>
> | | Dark on `#0A0A0B` | Light on `#FDFCFA` |
> |---|---|---|
> | ink | `#9EC9D4` | `#33474C` |
> | `nodeAlpha` | 0.30 | 0.17 |
> | node composite | `#374448`, L\* 27.88, ΔL\* **+25.12**, 1.96:1 | `#DBDEDD`, L\* 88.22, ΔL\* **−10.77**, 1.32:1 |
> | `linkPeakAlpha` | 0.09 | 0.07 |
> | link composite | `#181C1D`, L\* 9.90, ΔL\* **+7.14**, 1.15:1 | `#EFEFED`, L\* 94.40, ΔL\* **−4.59**, 1.12:1 |
> | `linkFalloff` | 1.0 (linear) | **0.6** |
> | `areaPerNode` / `maxNodes` | 8,500 / 160 | 8,500 / 160 — identical |
>
> Three of those need their reason recorded, because each is the opposite of the obvious move:
>
> - **The dark field's weight did not change.** ΔL\* +25.12 against the old cyan's +24.30 — under one
>   L\* point. Only the hue moved. That is the whole design: dark was never the broken half.
> - **The light delta is 43% of dark's, not equal to it.** Matching ΔL\* would put a mid-grey speckle
>   on white, and matching the WCAG ratio lands in the same place. Both metrics are blind to the fact
>   that a light mark on near-black blooms and merges into haze while a dark mark on near-white stays
>   a discrete object.
> - **Density is identical in both themes.** Thinning the light field is the intuitive move and it
>   destroys the triangulation that is the only thing separating the field from noise — `ParticleGrid`
>   records the measured failure at `areaPerNode` 11,000. Density and connectivity are one decision;
>   the correction lives entirely in the ink. The **`linkFalloff` gamma** is the same argument applied
>   to structure: ported linearly, light would hold links only to d ≈ 80px of the 120px `LINK_RADIUS`
>   against dark's 102px, losing the longest third of every link — and the long links are the ones
>   that triangulate. At gamma 0.6 the light threshold returns to d ≈ 101px.
>
> Both node composites stay **below 3:1**, which is the ceiling: this is decoration behind a 65-word
> paragraph, and anything at or above the non-text floor competes with the copy.

> **Both tints ship in BOTH modes.** An earlier version of these tables listed `bg-elevated` and the
> two tints under light mode only, which read as though they were a light-mode technique. They are
> not. Measured against their own base in CIE L\*a\*b\*, the dark tints sit at ΔE ~ 4.0 (cool) and 4.2
> (warm) versus ΔE ~ 4.7 for the light cool tint — comparable. And in dark mode both tints are *more*
> distinct from base than `bg-elevated` is (ΔE 2.89), because the tints differ mostly in chroma while
> `elevated` differs only in lightness. Ticket 6 should know that before assuming `elevated` reads as
> a card surface on dark — it may need a border to register.
>
> Caveat on the measurement: ΔE\*ab is least reliable near black, where both dark values sit on
> CIE Lab's linear branch. Treat these numbers as "clears the bar computationally, proceed on design
> grounds", not as "confirmed visible on every display". Verify tinted blocks on a dim screen.
>
> **LIGHT MODE CONFIRMED 2026-08-19.** `bg-tint-warm` on Skills' Core Dev block was the open question —
> `#F8FBF8` on `#FDFCFA` was expected to be possibly imperceptible, and was accepted in advance as
> acceptable-if-invisible. Rendered against the production build in light mode, **it is clearly
> visible**: the block reads as a deliberate quiet field, not as an absent one. No compensating border
> and no `bg-elevated` mat — both were pre-ruled-out and neither is needed.
>
> `app/globals.css` is the source of truth for all six hexes.

> ### Opacity floor for text: `/70`. And check LIGHT mode, not dark.
>
> **Any text token carrying an alpha modifier (`text-fg/NN`) must be at `/70` or above.** Below that
> it fails WCAG AA (4.5:1) for normal text, and every size on this site is normal text — `text-caption`
> is 12px and `text-body` is 16px, both far under the large-text threshold (18.66px bold / 24px) where
> the 3:1 allowance would apply.
>
> Measured, against the surfaces these actually land on:
>
> | | `bg-base` dark | `bg-base` light | `bg-elevated` dark | `bg-elevated` light |
> |---|---|---|---|---|
> | `/40` | 3.39:1 ✗ | 2.56:1 ✗ | — | — |
> | `/50` | — | — | 4.71:1 ✓ | **3.38:1 ✗** |
> | `/70` | 8.41:1 ✓ | 6.69:1 ✓ | 8.18:1 ✓ | 6.48:1 ✓ |
>
> **`bg-hero-surface` is measured separately, and `/70` still ships. Ticket 10.** This surface
> (`#07090C` with `--color-hero-fg` `#E8EAEC`) is PINNED in both themes, so the light-mode reasoning
> below does not transfer to it and the arithmetic had to be redone:
>
> | | `bg-hero-surface` (pinned, both themes) |
> |---|---|
> | full | 16.5:1 ✓ |
> | `/70` | **8.21:1 ✓** |
> | `/55` | 5.38:1 ✓ |
> | `/50` | 4.60:1 ✓ — 0.10 headroom |
> | `/45` | 3.91:1 ✗ |
>
> The arithmetic floor here is `/50`, not `/70`. **Ship `/70` anyway.** Two reasons: 0.10 of headroom
> is the same thin margin that got `/60` on `bg-elevated` rejected as unsafe below; and one site-wide
> floor is worth more than a correct-but-different second one, because **the second floor is the one a
> reviewer forgets exists.** The reveal footer's link labels are `text-hero-fg/70`
> (`RevealFooter.tsx:460`, `:639`). *That sentence named `Contact.tsx`, which was absorbed into
> `RevealFooter.tsx` in Phase 5 and no longer exists.*
>
> Two existing sub-`/70` values on this surface are NON-TEXT or transient and are not precedent for
> text: `HeroHeadline`'s reduced-motion chevron at `text-hero-fg/55` is an **icon** on the 3:1 floor
> (5.38:1), and the loader's percentage counter at `text-hero-fg/50` (4.60:1) clears AA but sits
> below this rule — flagged, not changed, in Ticket 10; it belongs to whoever revisits the loader.
> *That counter was `HeroLoader.tsx`; the component is `components/intro/AssetLoader.tsx:255` since
> the Loader/Intro split (`docs/06` §1). The `/50` value is still live and still the flagged one —
> it had drifted to `/45` (3.91:1, failing) during the split and was restored, so the flag has now
> earned its keep once.*
>
> **The trap is that dark mode is the default and light mode is the binding constraint.** `/50` on
> `bg-elevated` passes in dark and fails in light, so an opacity tuned by eye in the default theme
> ships an accessibility defect nobody sees. This has now been caught twice — Skills' entry counts at
> `/40`, and the project card's date at `/50` — both in review rather than in design.
>
> `/60` does technically pass on `bg-elevated` light at 4.62:1, but with 0.12 of headroom it is not a
> safe rule. **`/70` is the floor. If an element needs to recede further than `/70` allows, it needs a
> different device — size, weight, position, spacing — not a lower contrast ratio.**
>
> `aria-hidden` does not exempt anything here: it hides an element from screen readers, while 1.4.3
> exists for low-vision users looking straight at it.

> ### `accent-hero` has exactly ONE DOM consumer site-wide — and count RENDER SITES, not code paths. Ticket 10.
>
> **This heading counted code paths, and counting code paths is exactly what let a Tier 1 accent onto
> a Tier 2 page.** Corrected 2026-08-22. The two code paths below were always real and are still real
> — but on 2026-08-22 `ParticleGrid` was generalised from hero-only to take a `field` prop, and the
> `getComputedStyle` read below started executing from **three render sites across two tiers**: the
> Hero (Tier 1, licensed), the reveal footer's echo (Tier 1, licensed), and `/about` (Tier 2, not).
> The audit command this section recommends — `grep -rn "accent-hero" components/` — returned two hits
> throughout and reported clean the entire time, because nobody had to type the token to leak it.
>
> **Audit `grep -rn "ParticleGrid" components/` alongside it.** A component that reads a colour is a
> render site for that colour everywhere it is mounted, and the grep for the token cannot see that.
> The leak is closed: `ParticleFieldTuning` now carries the property name per preset, so `HERO_FIELD`
> says `--accent-hero` and `QUIET_FIELD` says `--field-ink`, and the Tier boundary is a value at the
> call site rather than a comment in the draw pass. Two code paths, **two render sites, one tier.**
>
> `--accent-hero` is registered **outside** Tailwind's `--color-*` namespace, so `text-accent-hero` /
> `bg-accent-hero` **do not exist and never will**. That exclusion is a mechanical guard, not an
> oversight, and it stands: **no `--color-accent-hero`, no `@utility`, no `@theme` entry, and no
> hand-written class in `globals.css`.** Any of those would regenerate a general-purpose handle
> usable from any file — the exact leak the guard prevents, renamed. Tailwind renders *nothing* for
> an unknown utility rather than erroring, which is what makes the guard work.
>
> The hero reaches cyan through `components/hero/ParticleGrid.tsx`'s `readInk()`, which reads
> `getComputedStyle(document.documentElement).getPropertyValue(...)` — the property **named by the
> active preset**, which is `--accent-hero` for `HERO_FIELD` and `--field-ink` for `QUIET_FIELD` —
> and hands the parsed channels to a **Canvas2D** context, not a DOM path.
>
> > **It used to say "once per rebuild", and that was a latent bug rather than a description.**
> > `readInk` ran only inside `build()`, which runs on mount and on a debounced resize; the effect's
> > deps cannot observe a theme flip. Harmless only because `--accent-hero` is theme-exempt, and a
> > shipped bug the moment any field's ink is not. It now also runs from a `MutationObserver` on
> > `<html>`'s class — `lib/theme.ts`'s `applyTheme` is the single writer of that class, including for
> > cross-tab sync, so one observer catches every way the theme can change.
>
> > **This sentence used to send readers to `lib/three/accentHero.ts` — "a JS constant handed to a
> > WebGL material".** There is no `lib/three/` directory and there never was; the hero has been
> > Canvas2D plus SVG since the hero rebuild, and the R3F packages were uninstalled on 2026-08-22.
> > **The rule itself — exactly two code paths reach cyan, one JS and one DOM — is unchanged and was
> > re-verified.** Only the pointer was dead. Note the mechanism also changed shape: it is a *read of
> > the custom property*, not a hardcoded constant, which is why a theme flip cannot desynchronise
> > the canvas from the one DOM consumer below.
>
> **The one licensed DOM path is an inline `style={{ backgroundColor:
> "var(--accent-hero)" }}` on a single 34×3px `aria-hidden` bar in
> `components/sections/RevealFooter.tsx` (the file that absorbed `Contact.tsx` in Phase 5 — the bar
> moved with it and did not multiply; verified 2026-08-22 at exactly 34×3px, `rgb(0, 229, 255)`).** `globals.css` names that mechanism itself ("Read it via
> `var(--accent-hero)` (inline style / CSS) or as a JS constant"), and the point of it is that
> reaching cyan in the DOM must be a **deliberate, visible, greppable act** rather than a class typed
> by muscle memory: `grep -rn "accent-hero" components/` audits the whole rule in one command.
>
> **BEWARE THE NAME.** `hero-accent` (`#14B8A6` teal, HAS utilities) and `accent-hero` (`#00E5FF`
> cyan, has none) are near-anagrams for different colours, and **both directions of the swap render
> something plausible on a dark panel.** Teal is the affordance — links and focus rings. Cyan is a
> marker of a beat and is never interactive, never text, and never on `bg-base`.
>
> `--color-hero-on-accent` is **not** shipped: nothing on this site yet renders text on a filled teal
> or cyan surface. §11.5's rule is unchanged — it ships the moment one does, into the pinned
> three-token block in `globals.css`, never as a loose fourth token elsewhere in the file.

**Accent tuning clarification:** `accent-hero` is fixed across both themes (`#00E5FF`) — it's used only
as a glow/lighting effect on the hero's 3D scene, and as the one bar in the Contact close beat above;
never for text, so text contrast rules don't apply to it.
`accent-working` may be contrast-tuned per theme (e.g. a slightly different exact hex in light vs. dark)
to meet WCAG AA text-contrast requirements against that theme's specific background — this is expected
and correct, not a violation of the design system. The rule is "one consistent teal hue family, tuned
for readability per background," not "one identical hex regardless of background."

## Typography — golden ratio scale

Base unit: `16px` (1rem). Scale multiplier: `×1.618` per step.

| Token | Size | Approx. use |
|---|---|---|
| `text-caption` | `12px` (0.75rem) | Meta labels, tags, timestamps — set in JetBrains Mono |
| `text-body` | `16px` | Base reading size |
| `text-h4` | `~26px` (16 × 1.618) | Sub-headings, card titles |
| `text-h3` | `~42px` (16 × 1.618²) | Section sub-headers |
| `text-h2` | `~68px` (16 × 1.618³) | Section headers |
| `text-h1` | `~110px` (16 × 1.618⁴), clamp() for responsiveness | Hero headline only |

> **`text-caption` deviates from the ratio, on purpose.** A strict 16 ÷ 1.618 lands at ~9.9px, and
> the shipped token is `0.75rem` (12px). At 10px, JetBrains Mono with this scale's `0.08em` tracking
> is below comfortable reading size for the meta labels it is used on — the ratio was serving the
> scale instead of the reader. `app/globals.css` is the source of truth for every token value in this
> table; do not "restore" 10px to satisfy the multiplier.

**Line height:** `1.6` for body text (already near-golden-ratio, keeps long-form reading comfortable).
Headings tighter, around `1.1–1.2`.

**Spacing:** use a Fibonacci-derived scale (approximates the golden ratio and is easier to work with in
practice) for margins/padding/section gaps: `8, 13, 21, 34, 55, 89, 144` (px). This keeps the
heading-to-text relationship and overall rhythm consistent with the ×1.618 type scale rather than
arbitrary spacing values.

### Borders — two families, one rule

**`accent-working` at low opacity marks INTERACTIVE surfaces. Neutral `fg` at low opacity marks
NON-interactive ones.** The colour table above says `accent-working` covers "borders"; that is true of
the interactive family only, and this is the qualification.

| Family | Value | Used on |
|---|---|---|
| Interactive | `border-accent-working/30` | Gallery cards (Ticket 6) — the whole card is a link |
| Neutral | `border-fg/25` | Detail-page cover and screenshot frames (Ticket 7) — static images |

The point of the split is that **teal means "activate this" and nothing else**. A teal frame around a
static screenshot spends the accent on something you cannot click, and once two things wear the same
border a reader stops reading it as a signal. An image frame exists only to stop the picture
dissolving into `bg-base`, which is a boundary job, not an affordance.

> **`border-fg/25` is CONFIRMED — observed, not computed. 2026-08-19.** It was provisional pending a
> real look, because 1.99:1 dark / 1.73:1 light are computed ratios and the CCN and SNA covers are
> light-field images that decide it. Both were rendered against the production build in both themes
> and screenshotted: the hairline holds the image boundary in light mode on both, including where
> CCN's near-white Packet Tracer canvas meets `#FDFCFA`. **No escalation needed. The value stands.**
>
> Recorded for anyone tempted to strengthen it later: the escalation path was `/30` if light covers
> bled, `/20` if it read heavy in dark, and **never** `accent-working` or a `bg-elevated` mat. It was
> not needed.

Recorded here rather than left in a handoff file because it already constrains later work: Ticket 6b
morphs a teal-bordered card into a neutral-bordered cover, and every later ticket putting an image on
`bg-base` inherits the choice.

> **Exercised in Ticket 6b, and the border deliberately does NOT animate.** The morph's travelling
> element carries the destination's `border-fg/25` from frame 1; the card's `border-accent-working/30`
> stays on the card and never participates. That is what Motion does by default with `layoutId` — the
> newly-mounted element renders with its own className and is projected onto the source rect — so it
> needed no code, only a decision not to fight it. A teal→neutral crossfade was rejected: it would put
> `accent-working` around a static image for ~350ms, it would be the site's first accent-to-neutral
> colour transition, and it would blur the exact read the split exists to produce. **The discontinuity
> is the message:** identical borders read as "the card grew", different borders read as "the card
> opened into a page".
>
> Known sub-pixel artefact, recorded so it is not rediscovered as a bug: Motion corrects
> `border-radius` for layout scale but not `border-width`, so a 1px hairline on an element measured at
> 912px and displayed at 428px renders at ~0.47px and grows to 1px across the morph.

### Section layout rules

*Established in Ticket 4 and binding on every section ticket that follows. These lived only in an
untracked handoff file until 2026-08-19; they are site-wide architecture, not one section's notes.*

**Rule S-1 (site spine).** Every section, Tier 2 and Tier 3 alike, aligns its leading edge to the
same left inset inside the same 1440px centred container. **Nothing on this site is ever a centred
content column.** The site's negative space lives on the right. Shipped insets: `px-md` (21px) below
640px, `px-xl` (55px) at 640-1023px, `px-2xl` (89px) at 1024px and above, inside
`mx-auto w-full max-w-[1440px]`.

The hero established this deliberately — its wordmark is an object in a space and the text is an
annotation anchored to the frame. Re-centring any later section would retroactively demote that to an
artefact of the 3D layout rather than a compositional claim.

**S-1's chrome carve-out — REVERSED for chrome only, 2026-08-21, per `docs/07_SITE_RESTRUCTURE.md`
§1.** S-1 originally read "the site has one spine and chrome does not get its own." That is no longer
true of chrome, and the rule is corrected here rather than left to be discovered in a diff.

- **Chrome is full-bleed.** `components/ui/Navbar.tsx` spans the viewport with a single small fixed
  gutter — `px-md` (21px) below 640px, `px-lg` (34px) at 640px and above — and carries **no `mx-auto`
  and no `max-w-[1440px]`**. The mark sits hard left, the LinkedIn icon hard right, at that gutter.
  Vertical padding (`py-sm sm:py-md`) is unchanged.
- **Content sections keep the spine, byte-identically.** Every Tier 2 and Tier 3 section, the detail
  route's frame (S-3), the Contact panel's inner container and the project overlay (S-4) still ship
  `mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl`. **Only the chrome half is reversed.**
  Nothing above changes for content.
- **Why the two do not have to match.** The spine is a compositional claim about where content begins;
  the bar is not content and never aligns to it in the reading sense. Above 1440px they visibly
  diverge — the spine sits 89px in and centred, the bar sits 34px out — and that is the intended
  result, not a defect. If the divergence ever reads as detachment, the fix is a **larger gutter**
  (`px-xl`), never a restored cap: the cap is precisely what §1 removed.
- **Checked at 2560 on 2026-08-21 — it does not read as detachment, and the escalation above is a
  weaker lever than it looks.** Measured: the bar spans `0 → 2560` with a 34px gutter both sides (mark
  left edge `34.00`, LinkedIn right edge `2526.00`, symmetric); the spine's box sits at `560.00` with
  `padding-left: 89px`, so content begins at `649.00`. The divergence is **615px**. Raising the gutter
  to `px-xl` makes it **594px** — a 21px move against a 615px gap, **3.4%**. The divergence is produced
  by the 560px centring offset, and no gutter value can touch that. `px-xl` is therefore the plausible
  fix for the wrong cause: applying it would *look* like the criterion had been discharged without
  discharging it, and would then read as verified on every future pass. **If this ever genuinely needs
  closing, the lever is the spine's cap, not the chrome's gutter** — which is a change to content, and
  so not this rule's to make.
- **The counter-argument, recorded so it is not rediscovered as an oversight.** The gutter was chosen
  proportionally: `21/1440 = 1.46%` was rejected as reading like an accident of margin collapse, and
  `34/1440 = 2.36%` was chosen. But `34/2560 = 1.33%` falls *below* the band that was rejected.
  Honouring that would need a third breakpoint step — an escalating chrome inset, which is precisely
  the spine behaviour §1 removed. **Two values, deliberately, not three.**
- **~~The criterion is also rarer than it sounds.~~ CORRECTED 2026-08-22 — it is not rare at all
  now.** This bullet read: *"`Navbar.tsx` hides the bar on scroll-down (`translate3d(0,-105%,0)`), so
  past the hero the bar and a spine-aligned section are only co-visible at scroll-top or while
  scrolling up. Judge the divergence there, not from a static full-page render."* Hide-on-scroll was
  **deleted** on 2026-08-22 (`.claude/handoff/navbar-indicator-design.md` §2 — the bar gained an
  active-route indicator, which a retracting bar hides exactly when it is useful). **The bar is now
  permanently visible, so the full-bleed chrome and the spine-aligned section below it are co-visible
  at every scroll position.** Judge the divergence from a normal scrolled view, which is the harsher
  test. The rule itself is unchanged; only how easy it is to see was.
- **The carve-out does NOT extend to a pinned content plate. Added 2026-08-22 with Rule S-6.** The
  reveal footer is `position: sticky; bottom: 0`, so it spends most of every page pinned to the
  viewport — and a reviewer may reason *"it is pinned, therefore it is chrome, therefore it takes
  the two-value gutter."* **It is not chrome and it takes the spine.** The carve-out exists because
  the navbar is a fixed overlay that must not track a scrolling column; the reveal footer *is* the
  column, temporarily pinned, and it holds
  `mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl` byte-identically inside its own
  full-bleed plate, exactly as the hero does. **Pinned is not the test. Being chrome is.**
- **Rule and code ship together.** This project has been bitten four times by a spec that described
  something the code stopped doing. The navbar's own container comment states the same carve-out in
  the same words, and both were changed in one commit.

**Rule S-2 (section seam).** The standard seam between two adjacent `bg-base` sections is
`spacing-2xl` bottom + `spacing-2xl` top = **178px, uniform at all breakpoints**. There is exactly one
documented exception: About opens at `spacing-3xl` (144px) at ≥640px, because the hero ends in a hard
`bg-hero-surface` → `bg-base` colour edge with no gradient, and that edge has to land in empty space
rather than immediately above a heading. **Sections that do not follow a hard edge do not pay that
cost** — About's larger opening is hero debt, not precedent. The Contact section (Tier 1 echo, on its
own dark surface) may set its own vertical rhythm, and must say so where it does.

**S-2's Contact exception, exercised and recorded (Ticket 10; the file became
`components/sections/RevealFooter.tsx` in Phase 5).** It ships
`pt-2xl pb-2xl sm:pt-3xl sm:pb-3xl` on a full-bleed `bg-hero-surface` `<footer>`. **The curtain
changed none of these five bullets** — it creates no new seam, because when the plate is fully
exposed the relationship above it is the same static one. No amendment to S-2 was needed for it and
none should be written.

- **It is About's hard edge mirrored,** `bg-base` → `bg-hero-surface` instead of the other way round,
  so it pays exactly what About's opening pays: `pt-2xl sm:pt-3xl`. Seam totals are **178px below
  640px and 233px at 640px and above** (89 + 144 = 233 = `--spacing-4xl`, which the Fibonacci scale
  lands on exactly). The preceding section's `pb-2xl` is **unchanged** — this section absorbs the
  whole cost, as About did.
- **No gradient fade at this seam,** for the same reason as the hero's: near-black ↔ warm-white
  gradients muddy both colours and are a recognisable hero-fadeout trope.
- **The bottom is symmetric with the top** because it is a plate, not a seam — a plate with a short
  bottom reads as content that got cut off. Nothing comes after this section, so the padding is the
  end of the document.
- **During the reveal the top edge is an OCCLUSION EDGE, not a seam, and must not be dressed like
  one.** No shadow under the lifting page, no hairline on the plate's top edge, no scrim. A drop
  shadow under a lifting page is this pattern's most-copied detail and is precisely the tell; a
  gradient there would slide out from under the page as a visible smear rather than staying put.
  Measured, the edge is **19.45:1 in light mode and 1.01:1 in dark** (`#FDFCFA` and `#0A0A0B`
  against `#07090C`), so **in dark mode — the default — the edge is invisible** and the reveal is
  carried entirely by content entering the strip. That is accepted, not fixed: every fix costs more
  than the problem, and it is why the stamp sits at the *bottom* of the plate (S-6).
- **Rule S-1 still holds byte-identically INSIDE the panel:**
  `mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl`, exactly as the hero does inside its own
  full-bleed dark plate. Holding the spine inside the panel is the main thing that stops it reading
  as a bolted-on footer bar.
- **It is a `<footer>`, a SIBLING of `<main>`,** so it is the `contentinfo` landmark. A `<footer>`
  nested inside `<main>` is scoped to `<main>` and is not a landmark at all — nothing errors and the
  benefit silently evaporates.

**Rule S-3 (one frame owns the detail page's vertical chrome). Established in Ticket 6b, binding on
every later edit to `/projects/<slug>`.** That URL has two rendering paths — the real route, and the
intercepted overlay at `app/(site)/@modal/(.)projects/[slug]/` — and the cover image has to land at
the same y position in both, because a refresh or a shared link silently swaps one for the other.

`components/sections/ProjectDetailFrame.tsx` is therefore the single owner of everything above and
below `<ProjectDetail>`: the page background, `pt-xl pb-2xl lg:pt-2xl`, the site container, the top
row (affordance + the surface's one `<ThemeToggle>`) and the bottom row. **Both paths render it.**
The route file owns only the routing contract; the overlay owns only the dialog.

- **Vertical chrome added to either route file instead of the frame reintroduces the defect**, and
  nothing — not `tsc`, not `lint`, not the build — will say so. `docs/04` recorded the offset as
  106px below 1024px and 140px at and above it; those numbers are now a consequence of the frame's
  three declarations rather than a measurement anyone has to keep in sync.
- **Two required props, neither with a default.** `as: "main" | "div"` — a default would silently
  nest a second `<main>` landmark under the homepage's while the overlay is open. `affordance:
  ReactNode` — the route passes `All work`, the overlay passes `Close`; a `variant` string instead
  would put a `router.back()` and a `"use client"` inside the frame and drag the whole detail page,
  including SNA's ~1,400-character description, into the client bundle.
- **The affordance is rendered twice**, top and bottom, as the same node. It therefore cannot carry
  a once-per-document attribute — `autoFocus` in particular, which React applies by calling
  `.focus()` on commit, so the bottom copy would win.

**Rule S-4 (the overlay has no scrim, no radius, and three exits). Ticket 6b.** The project overlay
is a full-viewport opaque `<dialog>` on `bg-base`, holding Rule S-1's spine byte-identically inside
it. It is **not** a centred sheet: that would violate S-1 outright and would shrink the cover, which
would destroy the geometry parity S-3 exists to guarantee.

- **No scrim token was invented, and none should be.** The surface is opaque and covers the
  viewport, so a scrim would tint nothing. `dialog::backdrop` is set to transparent in
  `app/globals.css` so the UA's own translucent black never shows.
- **The consequence is that there is no visible backdrop to click.** Dismissal is **Escape, the Close
  control (top and bottom), and browser Back** — three exits, all keyboard-reachable. That is a
  decision, not an omission; a backdrop-click affordance would require a visible backdrop, which
  would require a scrim, which would require a token this site has decided not to have.
- **The modal work is the platform's.** `dialog.showModal()` supplies initial focus, the focus trap,
  background inerting and focus restoration to the originating card link. None of it is hand-rolled,
  and `aria-modal` is not hand-written because `showModal()` implies it.
- **Scroll is locked at the document, not just in Lenis.** `syncTouch: false` means touch scrolling
  is native, and under reduced motion there is no Lenis instance at all, so `html[data-overlay-open]
  { overflow: clip }` is what actually holds — with a JS-measured `padding-right` compensating for
  the removed scrollbar. Never hard-code a scrollbar width.

**Rule S-5 (custom breakpoints are declared in `rem`, never `px`). Established while adding the
portrait to Trajectory, binding on every breakpoint added from here on.**

**The site ships ZERO custom breakpoints.** It shipped exactly one — `--breakpoint-photo: 85rem`
(1360px) — for a single consumer, the portrait that filled Trajectory's third column. The portrait
moved to `/about` on 2026-08-22, where it rides plain `lg`; the breakpoint had no other consumer and
was deleted from `app/globals.css` in the same commit. **The rule outlives it** and binds the next
one added:

- **The unit is not cosmetic.** Tailwind orders breakpoint media queries by comparing their declared
  values, and its own defaults are rem: `lg` is `64rem`, `xl` `80rem`, `2xl` `96rem`. A `px` value
  cannot be ordered against those, so a px breakpoint is emitted **before** every rem one regardless
  of size — `@media (min-width:1360px)` lands ahead of `@media (min-width:64rem)`, and at equal
  specificity `lg:` then wins at every width above the custom breakpoint. Declared in rem it sorts
  into its correct slot between `xl` and `2xl`.
- **This failure is silent in every check the project runs.** It was written as `1360px` first, and
  the consequence was that Trajectory's prose measure collapsed from 544px to 489px above 1360px while
  `tsc`, `eslint` and `next build` all stayed green and the rendered page looked entirely plausible.
  It was caught only by measuring the computed `grid-template-columns` in a real browser. Treat any
  breakpoint-scoped override that "should" apply but visibly does not as this bug until proven
  otherwise, and confirm the emitted `@media` order in the built CSS rather than reasoning about it.
- **Prefer no new breakpoint at all.** Tailwind's five defaults are now the whole system again. A new
  one is a design decision that needs a stated, living consumer — not a convenience — and it is
  deleted along with that consumer, exactly as this one was. A registered breakpoint nothing uses
  reads as available and is dead surface.

**Rule S-6 (the reveal footer is a sticky curtain, and the page stack above it must be opaque).
Phase 5, 2026-08-22. Binding on every route that renders a reveal footer, and on any future
element pinned beneath the page.**

> **This rule shipped as "Rule S-5" and was renumbered to S-6 on 2026-08-22, the same day.** The
> breakpoint rule below took S-5 first (`973a2ca`); the curtain rule was written in `23d890d` by an
> agent that did not have the breakpoint rule in context, so the file carried **two different rules
> both numbered S-5** and read S-1, S-2, S-5, S-3, S-4, S-5. The curtain rule moved — it is the
> newer of the two — and the block was also relocated to sit after S-5 so the file reads in order.
> **If you find "Rule S-5" cited anywhere alongside `sticky`, `bottom: 0`, `relative z-10 bg-base`
> or the reveal footer, it means this rule and predates the renumber.** The ten citing sites in
> code and docs were swept in the same commit; nothing else changed about the rule's content.

`components/sections/RevealFooter.tsx` is `position: sticky;
bottom: 0` at `md` and up. `docs/07_SITE_RESTRUCTURE.md` §5 describes the effect as "fixed beneath
the page"; `sticky` produces the identical effect and is what ships.

- **Three declarations, no JavaScript.** `relative z-0 md:sticky md:bottom-0` on the `<footer>`,
  and `relative z-10 bg-base` on the page stack (`<main>`) at every call site. No scroll listener,
  no `ScrollTrigger`, no `ResizeObserver`, no measured height, no CSS variable, **no negative
  margin**.
- **`document.scrollHeight` changes by exactly 0px, and that is the whole point.** A sticky element
  occupies its normal flow box in full — sticky is the one positioning scheme that does *not*
  remove an element from flow, and its offset is a paint-time shift rather than a layout change.
  **Measured on `/` and `/work` at 1440x900, 1280x800, 1024x600, 768x1024 and 360x640, both
  themes: toggling the footer between `sticky` and `static` moves `scrollHeight` by 0px in all
  twenty cases.** No phantom scroll is added and none is removed, so every `end: "bottom bottom"`
  on the page resolves exactly where it did.
- **`ScrollTrigger.refresh()` is NOT required, and adding it is mildly harmful.** There is no
  post-mount geometry change to refresh against, and a refresh recomputes every trigger on the page
  — landing mid-scroll it can visibly re-snap a scrubbed section. `docs/07` §5's implementation
  flag was written against the *negative-margin* technique, which this rule rejects, and has been
  amended there. (The one refresh that *is* needed is the post-webfont one, which
  `components/ui/ScrollTriggerSync.tsx` already owns.)
- **`<main>` MUST carry `bg-base` explicitly. Inheriting it does not work, and the failure is
  spectacular.** A background on `html`/`body` **propagates to the canvas**, which paints below
  every positioned descendant including the footer — so with no opaque layer of its own, the
  #07090C plate is visible through every section of the page at every scroll position. `z-10` is
  what puts the stack above the footer's `z-0`.
- **Nothing between `<body>` and the footer may create a containing block or a clipping context.**
  No `overflow: hidden`/`clip`/`auto`, no `transform`, no `filter`, no `perspective`, no
  `will-change: transform`, no `contain: paint`. Each of those either kills the pin or cuts the
  plate, silently. **Lenis must stay in `root` mode**: `wrapper`/`content` mode translates a
  wrapper, which becomes the sticky containing block and destroys the effect with no error.
- **The short page needs no handling at all.** A sticky offset may only move an element *within*
  its containing block, and the footer is the last child of `<body>`, so the browser cannot push it
  down toward a viewport bottom below it. A page that does not scroll clamps the plate flush under
  the last section. **Never add `min-h-[calc(100dvh-…)]` to "fix" a short page** — that is the
  reflexive fix and it is the one that grows `scrollHeight`, breaking the guarantee above.
- **No viewport-unit height on the plate, and no parallax on it.** The plate's travel is **0px**;
  the page scrolls off it at 1:1 and that is the entire wipe. A plate that drifts as it appears did
  not arrive early — it is arriving now — which contradicts the one thing the footer is supposed to
  say. Height is bounded compositionally instead: **if the plate ever measures more than 900px at
  ≥1024px, cut content; do not cap the box.** (Measured at Phase 5: 793px at 1440 wide, 787px at
  1280, **870px at 1024**, where the link row wraps.)
- **Reduced motion does not branch here.** There is one rate — the visitor's own — no `transition`,
  no `transform`, no `animation` and no scroll-linked value, so there is nothing to disable. A
  branch would have to change `position`, which changes layout, which would give two classes of
  visitor different document heights and different resolved trigger ends for the same page.
- **Exactly one `contentinfo` per page, and `/about` deliberately has none.** `position` does not
  move an element in the accessibility tree, so the landmark survives the technique intact. `/about`
  renders no reveal footer per `docs/07` §5–6 and therefore has zero `contentinfo` landmarks — a
  recorded decision, not an oversight; its CTA row already carries GitHub and LinkedIn.

**Fonts:**
- Space Grotesk — all headings, UI, body text
- JetBrains Mono — technical labels, tags, stats, stack badges on project cards, hero name treatment
  (used deliberately, not everywhere — overuse turns it into a terminal gimmick)

## Motion system — three-tier energy curve (see CLAUDE.md for full rationale)

**Hero — load-in and reveal (Tier 1, peak):**
1. Minimal preloader while assets/fonts load — a thin progress line or small percentage counter, not a
   generic spinner
2. Reveal transition: camera pull-back preferred (3D scene starts zoomed/abstract, eases into resting
   composition as loader clears) — ties the loading moment directly into the 3D scene rather than being
   a separate decorative step
3. Headline text stagger-reveals immediately after the camera settles
4. `accent-hero` (`#00E5FF`) used for glow/particle color in this moment only

**About/Trajectory + Projects gallery (Tier 2, sustained):**
- Scroll-triggered reveals (fade/slide-in) as sections enter viewport
- Project cards: hover states with subtle depth/parallax, staggered entrance on scroll
- Card → detail transition: shared-element morph (Framer Motion `layoutId`) — the card itself
  visually expands/settles into the detail page rather than a hard route cut

### Scroll-scrub — Home only, and the vocabulary it uses

Added 2026-08-22. This section had no scrub vocabulary at all, which is how Home's scrub reached an
implementer with a name and a scope but no property, range or end state. It binds every section ticket
from here on, so it lives here rather than in a handoff — the same failure that hid Rules S-1 and S-2
until a Ticket 5 review found them.

**Scope: the Home page only, and within it only Trajectory and the featured projects.** Both are
Tier 2. **Stack is Tier 3 and is never scrubbed** — it pops while its neighbours track, and that
discrete-versus-continuous difference IS the tier boundary made visible. If that reads as broken, the
fix is dropping Stack's opacity leg, never scrubbing Stack.

**Property: `y` only, 21px → 0, upward. Opacity never scrubs.**

The 21px ceiling applies to *timed* reveals, where the cap's stated reason is that beyond it "the eye
tracks moving text instead of reading it" — a claim about speed. A scrubbed 21px cannot outrun a
reader, because the reader is driving it and it is at rest whenever they are. **13px stays the value
for every timed reveal on the site.**

**Why opacity is excluded, and it is not the obvious reason.** A scrub abolishes the
transient/state distinction the `/70` floor relies on: a timed reveal may pass through `opacity: 0`
because it self-completes in 350ms, but **every frame of a scrub is a resting frame**, so the floor
binds all of them. And **element opacity MULTIPLIES through to children** — a wrapper at 0.7 over a
`text-fg/70` label renders it at 0.49, which is 3.33:1 in light and fails AA.

Measured, the legal wrapper range is **0.836 → 1.0**. Opacity is dropped because a 16% change spread
over ~400px of scroll is not a fade anyone perceives — **not because no legal range exists.** Stating
it as impossible invites the disproof, and the person who finds 0.85 works ships the multiplication
bug.

> **The floor is on RENDERED alpha, not on the token.** `docs/03`'s opacity rule reasons about tokens
> and says nothing about composited ancestors. Any wrapper carrying an opacity must be checked against
> the *worst child under it*, not against its own value.

**The guarantee this buys, which is the point:** every scrub frame is visually identical to the end
state except for up to 21px of vertical position. Nothing about the animation touches legibility,
contrast, size, sharpness or colour. Fully visible implies fully arrived, by construction.

**Below 768px there is no scrub.** Home uses the same reveals as every other page.

> **This sentence used to end "Two behaviours site-wide — the site's reveal, and Home's desktop
> scrub — never a third mobile-specific one." Corrected 2026-08-22, because the count was already
> false when it was written.** The site also ships the Intro's seven-phase timeline, the navbar's
> 240ms indicator slide, the card → cover `layoutId` morph, the copy-email label swap and the MS
> mark's hover part, and nobody was counting those. The route transition and `/about`'s entrance
> would have made it falser still. The count was a PROXY; this is the thing it was protecting, and
> it is stricter rather than looser:
>
> **Two motion DRIVERS site-wide, and never a third: elapsed time, and scroll position.** Every
> timed behaviour — the section reveal, the route transition, `/about`'s one-shot entrance — is the
> same pair of curves fired by a different trigger (an intersection, a navigation, a mount). Scroll
> POSITION drives exactly one thing on the whole site: Home's desktop `y`-only scrub. **And no
> behaviour may be specific to a breakpoint** — a phone gets the site's normal motion language, not
> a degraded Home. A mobile-only parallax is still a breach under this wording, which is the test of
> whether the rewrite is honest.

**The reveal footer's curtain (Rule S-6) takes the same 768px floor, and for the same reason.**
Below it the footer is a plain in-flow `<footer>` — one responsive class,
`relative z-0 md:sticky md:bottom-0`, same DOM either side. The curtain adopting this floor rather
than inventing its own is the no-behaviour-per-breakpoint rule above, applied. It also happens to be
forced: the plate measures
~790px against a 640px phone viewport, and a sticky-bottom element taller than its scrollport pins
with its top cut off, so the "reveal" becomes a crawl over content that can never be seen whole.

**Reduced motion: neither scrub nor parallax.** A 0.35s opacity fade with no Y, matching
`MotionProvider`'s existing contract.

**Audited end to end on 2026-08-22, and the audit shipped no code.** Home was scrolled from top to
bottom at 2000px/s and at 400px/s at 1440×900, sampling every animation frame; the seams were
measured at 375×667, 639×800, 768×1024, 1440×900 and 2560×1440 in both themes. The numbers, so the
next pass does not re-derive them:

- **Primitive census — eight scrub units on Home and no more.** Four in Trajectory (`<h2>` + three
  beats, importing `ScrubReveal` directly) and four in Projects (`<h2>` + three cards, via
  `motion="scrub"`). Stack contributes four `[data-reveal]` units and **zero** scrub units. `/work`
  measured **eight `[data-reveal]` and zero scrub units** — `motion="reveal"` is doing its job.
- **Every scrub window equals its own unit's height, to the pixel.** Measured
  (height → resolved window, 1440×900): 74.8→75, 179.2→179, 230.3→230, 102.4→102, 74.8→75,
  455.6→456, 455.6→456, 454.5→455. At 768×1024: 51.5→52, 209.0→209, 260.1→260, 132.2→132, 51.5→52,
  421.1→421, 421.1→421, 395.5→396. `y` reads 21 at the window's open, ~10.5 at its midpoint and 0 at
  its close on all sixteen — linear in scroll, which is `ease: "none"` confirmed by measurement
  rather than by reading the call.
- **One measured divergence from the anchors as this section states them, and it errs safe.** The
  resolved window sits **21px later** than the natural geometry, because `gsap.from()` writes the
  displaced start state in the layout effect and ScrollTrigger's first refresh measures the element
  where it then is. Consequence: a unit reaches `y: 0` when its bottom edge is 21px *above* the
  viewport bottom, not level with it. The window's *length* is unaffected, and the guarantee the
  anchors exist to protect — that no unit is still mid-scrub while fully on screen — holds strictly,
  with 21px to spare. Nothing to fix; recorded so it is not rediscovered as a bug.
- **Seams: 178px at every `bg-base` seam, at every viewport, in both themes.** Measured as
  `padding-bottom` of the section above plus `padding-top` of the section below, which is what the
  seam is — the border boxes are flush, so the DOM gap between two sections is 0px everywhere and is
  not the number to read. Home: `trajectory→stack` 89+89, `stack→work` 89+89. `/work`:
  `work→experience` 89+89, `experience→contact` 89+89 below 640 and 89+144 above.
  (`#in-progress` is absent from the DOM entirely — `CurrentlyLearning` returns `null` while
  `content/currentlyLearning.ts` is empty — so `/work` has three seams, not four.)
  **The two exceptions are `sm:`-scoped and therefore do not exist below 640px:** Trajectory's
  hero-debt opening measures `pt` 89 below 640 and 144 above, and the reveal footer measures 89/89
  below 640 and 144/144 above.
- **There is no dead band at any seam, at either speed.** The design note that preceded this audit
  predicted 178px of scroll at each seam in which nothing animates, covered *in perception* by
  `SCRUB_CATCH_UP_S`. Measured, it is covered *in fact*: the set of units not at rest is never empty
  between scrollY 0 and 4141 at 2000px/s, or 0 and 3701 at 400px/s. Units settle in strict document
  order and their tails overlap — 343 / 596 / 876 / 1050 (Trajectory), 1336 / 1523 / 1896 / 2436
  (Stack), 2670 / 3183 / 3183 / 3690 (Projects) at 400px/s. **Exactly one dead band exists on the
  page** and it is the tail: 338px at 2000px/s, 778px at 400px/s, running to max scroll. That is
  Projects' bottom padding plus the reveal footer, which is deliberately unanimated —
  `RevealFooter.tsx` records that a reveal on a pinned, occluded plate animates in secret.
- **A hard cut here means a change of DRIVER, not a missing curve.** There is exactly one on Home and
  it is sanctioned: Stack, time-driven between two position-driven neighbours. There is no
  per-section easing to be inconsistent — `ScrubReveal` scrubs with `ease: "none"` by definition and
  both of its timed branches import `GSAP_EASE.reveal` / `DURATION.reveal`. Nothing was found to fix.
- **Reduced motion, all eight units, at 1440×900 and 375×667:** computed `transform` is `none` at
  every sampled frame and opacity animates from 0. No `y`, no scrub, at either width.
- **Below 768px all eight fall to the timed branch, and its travel measures 13px** — not read from
  `TIMED_TRAVEL_PX` but sampled off the rendered matrix at 375×667 and 767×900. It still matches
  `Reveal`'s private `TRAVEL_PX`, which is the one value in `ScrubReveal.tsx` that can silently
  drift. At 768 the same units measure 21px, so the breakpoint resolves where it claims to.

### Route transition — Home ↔ About ↔ Work

Added 2026-08-22. Navigating between the three routes read as a default App Router swap: the
indicator slid and the document changed between one frame and the next.

| | |
|---|---|
| Property | `opacity`, `0 → 1`. Nothing else — no `y`, no `scale`, no `blur`, no `filter` |
| Duration | `DURATION.ui` = **0.35s**. Measured 330–351ms to the frame at which opacity crosses 0.999, across 32 navigations |
| Curve | `EASE.ui` — the pair the navbar's `INDICATOR_MS = 240` indicator already runs on |
| Direction | **Enter only. No exit animation, and no `AnimatePresence`** |
| First load | **No animation.** Module-scope boolean, `IntroGate`'s `played` idiom inverted |
| Reduced motion | **Instant swap, not a shorter fade** |
| Where | `components/ui/PageStack.tsx`, which renders every route's `<main>` |

**240ms leading 350ms is the correct ordering and must not be "synced".** The chrome confirms the
destination before the content resolves, which is what makes a click feel answered. `INDICATOR_MS`
was derived independently from ~100px of travel; slowing it to 350 would make the line worse to fix
nothing.

**`y` is locked out for two reasons, and neither is taste.** A `transform` on a page-level element
creates a containing block for every `position: fixed` descendant, which would silently re-parent
the Intro's `fixed inset-0 z-50` plate. And Next preserves scroll on back/forward, so a translate at
a restored scroll position would lift the stack off the viewport bottom and expose a strip of the
reveal footer's plate. Opacity creates a stacking context but never a containing block, and it
cannot uncover anything.

**Reduced motion gets an instant swap, which deliberately diverges from `MotionProvider`'s
`reducedMotion="user"` contract (drop transform, keep opacity). Do not "fix" it back.** That
contract is about ELEMENTS entering a page the visitor can already read; this is the DOCUMENT, and a
whole-page fade makes everything transiently unreadable — the one thing an accessibility fallback
must not introduce. Measured: opacity is 1 on the first post-commit frame of all three navigations,
transform `none` throughout.

**Where the fade goes is a Rule S-6 constraint, not a preference — see `docs/02`'s page-stack
section for the measurement.** `<main>` stays fully opaque because it is the only thing occluding
the pinned plate; the fade rides an inner `[data-page-stack]` div, inside `<main>`'s existing `z-10`
stacking context.

**`/about` keeps BOTH the route fade and its four-unit entrance, and that is a measured decision
rather than an oversight.** They cover disjoint things: the entrance deliberately excludes the
particle canvas and the page ground, so dropping the route fade would hard-cut the canvas in while
the content assembled — a change of driver at the exact moment this transition exists to remove one.
Where they do overlap, on the four content units, the two opacity legs multiply. The preceding
design note priced that at 0.25 against 0.5 at the midpoint and called it a deep double fade;
MEASURED at ~165ms after commit it is **0.70 composited against 0.74 for the page alone** — four
percentage points — because `EASE.reveal` is heavily front-loaded and is already at 0.94 by then
while `EASE.ui` is at 0.74. Both legs complete by 350ms and both are transient, so no contrast floor
binds. Do not "fix" it by delaying one leg behind the other.

**Project detail, Skills, Experience, Currently Learning (Tier 3, minimal):**
- Simple fade/slide reveals only, no 3D, no parallax
- Motion exists to support readability (guide the eye), never to compete with it

**Contact/close (small Tier 1 echo):**
- A modest uptick in polish — slightly more deliberate easing, a small `accent-hero` touch — so the
  site doesn't trail off flat after the minimal Tier 3 sections

**Global:** Lenis smooth scroll runs site-wide regardless of tier. Respect
`prefers-reduced-motion` — fall back to simple opacity fades and skip the 3D reveal/parallax for users
who have that OS setting enabled.

## Component styles

- **Buttons:** two variants — primary (filled, `accent-working`) and ghost (outlined/text-only). No
  gradients, no drop-shadow-heavy "glow" buttons outside the hero.
- **Cards (project gallery):** `bg-elevated` in light mode / a very slightly lighter-than-base surface
  in dark mode, generous padding (Fibonacci scale), subtle border using `accent-working` at low opacity
  rather than a hard-color border.
- **Nav:** minimal, likely a slim fixed bar or a corner menu — should not compete with the hero's first
  3 seconds of impact.
- **Theme toggle — SHIPPED IN TICKET 11, and NOT as this line originally specified.** It read "simple
  icon-based switch, persists user preference (local state / cookie, not localStorage per artifact
  constraints if built as an artifact — a real deployed Next.js site can use localStorage normally)."
  Both halves were corrected against what was actually built, because the code is the source of truth:

  - **A 12px JetBrains Mono text button, not an icon switch.** There is **no icon system on this site**
    (two inline SVGs exist, both in `HeroHeadline`) and **no radius token**. A switch needs a visible
    track and knob, which needs a radius; an icon toggle needs an icon set. Introducing either for a
    preference control would make it the site's first non-typographic widget. The shipped control is
    the exact shape of the detail route's `BACK_LINK`: 12px mono, teal, no underline, no border, no
    background, no hover state, and **zero motion** — including the theme flip itself, which is
    instant.
  - **`localStorage`, not a cookie.** The parenthetical above already licensed it ("a real deployed
    Next.js site can use localStorage normally"), and there is a second, harder reason: reading a
    cookie in the root layout is a dynamic API, so it would opt **every** route out of static
    prerendering. Key: `saad-portfolio-theme`. See `docs/02_TECHNICAL_ARCHITECTURE.md`.

  **THREE exported class constants, `className` required with no default** — `THEME_TOGGLE_ON_BASE`
  (`accent-working`), `THEME_TOGGLE_ON_HERO` (`hero-accent`) and `THEME_TOGGLE_IN_NAV` (the bar's
  `--nav-fg` / `--nav-fg-dim` / `--nav-accent` variables). Same pattern and same reasoning as
  `ExternalLink`'s pair: the surface a control sits on is the call site's knowledge, and a defaulted
  surface prop renders a legible-but-wrong colour on the pinned hero plate, visible only after a
  toggle nobody performs while implementing. `error.tsx` and `not-found.tsx` are `bg-base` and take
  `THEME_TOGGLE_ON_BASE`.

  > **This paragraph said "Two exported class constants", and the paragraph that followed it read:
  > *"One in-flow instance per route, at the top, never fixed or floating: a fixed control crosses
  > three surface contexts on `/`, and at 360px an opaque fixed chip occludes body text on every
  > route."* Both were reversed in Phase 0 and this file did not catch up.** `THEME_TOGGLE_IN_NAV`
  > shipped as a third constant (`ThemeToggle.tsx:170`), and the toggle now lives **inside the fixed
  > navbar** on all three chrome routes (`Navbar.tsx:869`, `hidden md:block`), with
  > `NavMobileMenu`'s `THEME_TOGGLE_ON_BASE` instance covering below `md`.
  >
  > **The old rule's reasoning was not wrong — the bar answers it.** A fixed control crossing three
  > surfaces would need a plate of its own, and that plate would put the pinned hero surface on
  > screen a third time when it is supposed to appear exactly twice. The bar needs no plate: it
  > already owns a legibility-escalating palette measured against every ground it crosses, and the
  > third constant rides those variables rather than naming a colour. **`docs/06` §5 is the full
  > record of the reversal**, including the cost that forced it (a desktop visitor on `/` had no way
  > to switch themes at all) and the 375 / 639 / 768 / 1440 / 2560 check that exactly one instance is
  > ever visible. It was recorded there and not here, which is how a tracked design-system doc ended
  > up stating a binding rule the site had already reversed.
  >
  > **`THEME_TOGGLE_ON_HERO` currently has no call site** — verified 2026-08-22, its only remaining
  > mentions are in comments. Flagged, not deleted: it is the correct constant the moment anything
  > in-flow lands on `bg-hero-surface` again, and deleting it would take its documented
  > `hero-accent` / `accent-hero` anagram warning with it.

## Third-party integrations (kept intentionally minimal)

| Service | Purpose | Data sent |
|---|---|---|
| Vercel (hosting) | Deployment | Build output only |
| Optional: Resend or Formspree | Contact form handling, if added | Name/email/message submitted by visitor → routed server-side, never exposes the API key client-side |
| Optional: Vercel Analytics | Lightweight, privacy-respecting page/scroll analytics | Anonymous page-view/interaction events, no PII beyond standard web analytics |

No other third-party services are planned for v1. Anything beyond this list should be added deliberately,
not by default — each additional dependency is another thing to maintain over the "build once, update
over the year" lifespan of this project.
