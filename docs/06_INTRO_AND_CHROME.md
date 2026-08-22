# 06 — Intro, Loader, and Site Chrome

Decisions in this document govern more than one ticket. Per `CLAUDE.md`, that is
what makes them architecture rather than working notes, and why they live in
`/docs` instead of in a handoff file.

Two things are specified here:

- **§1–§3** — the split between the *Loader* (functional) and the *Intro*
  (choreographed), the Intro's confirmed sequence, and the ordering contract
  between them.
- **§4–§7** — the site navbar: where it renders, where the theme toggle went,
  how legibility is handled, and what is still open.

---

## 1. Loader vs. Intro — they are two things

The codebase used the word "loader" for both. It is now split, and the split is
binding on any future entry, transition, or route-change animation.

| | **Loader** | **Intro** |
|---|---|---|
| Question it answers | "Are the assets ready?" | none — it performs |
| Duration | variable, driven by real progress | fixed, scripted |
| Timing source | `document.fonts.load` / `fonts.ready` | a GSAP timeline |
| Visual budget | utilitarian: a rule and a number | the site's whole Tier 1 spend |
| File | `components/intro/AssetLoader.tsx` | `components/intro/Intro.tsx` |

**Two failure modes, one per column, and both are bugs rather than taste:**

- A Loader that pads its duration "so it feels intentional" is lying to the
  visitor about their own connection. `AssetLoader`'s `progress` is
  settled-tasks over total-tasks with no smoothing, no floor and no minimum
  display time. The one timer in it (`STALL_MS`) can only ever *shorten* the
  wait: it hands off when a font CDN never answers, so a stalled load cannot
  trap someone behind a plate.
- An Intro that tracks asset progress is solving a problem it does not have. By
  the time it plays, the Loader has already guaranteed everything it measures
  against is in. Its timings are entirely about feel.

**What the Loader tracks, and why the list is short.** The two webfonts, at the
two weights used above the fold — the hero tagline (Space Grotesk, `text-h4`)
and the navbar (JetBrains Mono, `text-caption`). **The Intro is no longer one of
the reasons**, and the distinction matters: it used to measure the name at
runtime with canvas `TextMetrics`, and since Phase 1 it renders pre-extracted
outline path data instead and never touches the face. The gate stays because
those two above-the-fold surfaces still need it — `docs/07` §3's D7 box records
this in advance precisely so the Intro's release is not mistaken for the
Loader's. Nothing else is tracked — the hero has been Canvas2D plus
SVG since the R3F scene was removed, so there is no model, texture, WASM or
above-the-fold image to wait on, and the project covers are below the fold and
belong to `next/image`. Blocking the entry animation on those would be the exact
mirror of padding the timer. **Add to `assetTasks()` when that changes**; it is
one function returning an array of promises, and the progress readout is derived
from its length.

`document.fonts.ready` alone is **not** sufficient and this is the subtle part:
`ready` resolves when the font system is idle, and a face nothing has requested
yet makes it idle immediately. `fonts.load(...)` is what requests the face;
`ready` afterwards is what waits for the system to settle. Both are needed, in
that order.

**Naming rule going forward:** a "loader" ticket is about asset readiness and
progress. An "intro" ticket is about the choreographed reveal and its reuse as a
transition. Do not mix the words again.

---

## 2. The Intro's confirmed sequence

> **THE ORIGINAL SEQUENCE IS BACK, 2026-08-22.** This section described a
> five-phase merge-to-a-point for one day. It was built, shipped, captured, found
> broken, and reverted on Saad's instruction. **`docs/07` §3 carries the full
> reversal notice, the frame evidence and the recovery refs** —
> branch `intro-merge-to-point-backup`, tag `intro-plan-a` — and is the
> authority on *why*. This section is the authority on *what*: the phase table,
> the durations and the eases.
>
> **What did NOT revert with it.** The mark is still the faceted one (`docs/07`
> §2), the name is still pre-extracted outlines rather than DOM `<text>`, and
> `AssetLoader` still gates this component. Only the *sequence* went back.

Seven phases, **3.17s total** (measured: 3.174s from the Intro plate mounting to
it unmounting). The per-phase split lives in `components/intro/Intro.tsx` as
named constants, which is where it should be tuned.

| | Phase | Duration | Starts | Ease |
|---|---|---|---|---|
| 1 | **HOLD** — "Muhammad Saad", as filled glyph outlines, still | 0.30 | 0.000 | — |
| 2 | **DROP** — the ten non-initials shrink and fade, staggered | 0.35 (+0.015 stagger) | 0.300 | `power2.in` |
| 3 | **SLIDE** — the two survivors close up and re-centre | 0.42 | 0.785 | `power3.inOut` |
| 4 | **MORPH** — text becomes mark, overlapping the slide's tail | 0.40 | 0.995 | `GSAP_EASE.ui` / `.hero` |
| 5 | **ZOOM OUT** — the stage backs off to 0.82 | 0.60 | 1.395 | `GSAP_EASE.hero` |
| 6 | **BREATH** — nothing happens | 0.22 | 1.995 | — |
| 7 | **ZOOM IN** — `scale: 17`, into the Hero | 0.95 | 2.215 | `power2.in` |

Phase 2's stagger makes it 0.485s wide for the ten glyphs that leave, which is
why phase 3 starts at 0.785 rather than 0.650. **The count is derived from
`HERO_NAME`, never written down** — and it is 10 rather than the DOM original's
11, because the space is not in `INTRO_GLYPHS` at all (it carries advance, no
ink). Phase 2 is 15ms shorter than the original's as a result. That is the only
duration in the table that is not `f640107`'s verbatim.

**THE ONE INVARIANT THAT MATTERS MORE THAN ANY DURATION HERE: there is never
more than one type scale on screen.** The non-initials leave in phase 2, the
survivors move at a constant scale in phase 3, and the scale change is deferred
to phase 4 — by which point the only things on screen are two letterforms
occupying the same box. The reverted merge grew the two capitals *while* the
other ten were still at name scale, and they collided. Anything that replaces
this sequence later has to preserve the ordering, not just the beats.

**Phase 1: the name is not DOM `<text>`.** It is Space Grotesk's own contours,
pre-extracted at build time into `components/ui/msMarkGlyphs.ts` and rendered as
**filled** paths, like the mark itself. Outlines put the name and the mark in ONE
coordinate system, which is what deletes the `TextMetrics` baseline probe, the
three mirrored mark constants and the measured FLIP that the DOM version needed.
DOM text would put all three back.

**Phase 3 is arithmetic where the original was a measured FLIP.** The DOM Intro
collapsed the non-initial `<span>`s to `display: none`, let the flex row reflow,
and read the survivors' new rects back out. There is no layout inside an SVG to
reflow, so `SLIDE_X` in `msMarkGeometry.ts` computes the same two facts — the
pair set solid on the font's own advance widths, and the pair re-centred in the
box — from the same font metrics. A font swap still moves it. There is also no
`dy` term any more: the measured version corrected `y` because a flexed name can
**wrap** on a narrow viewport, and an SVG scales instead of wrapping.

**Phase 4 is a swap in place, not a dissolve between two sizes.** The parked
pair is advance-centred on `VB_W / 2`, which is `ANCHOR_X`, which is where the
settled mark's ink is centred — and both are rendered at `NAME_SCALE`, so the
cap heights are identical. The mark eases in from 1.1× while the letterforms
swell to 1.04× and fade, which is what makes it read as a replacement from
underneath rather than a switch. It starts at 50% of phase 3, deliberately: the
material changes while the letters are still closing.

**Phase 7 is the transition, not a step before one.** `scale: 17` on an HTML
ancestor of the SVG — **not a `<g>` inside it**, because an `<svg>` clips to its
own viewport and a ×17 scale applied in the coordinate system would be thrown
away at the box edge. The camera's fixed point is `(296, 288)`, i.e. dead
viewport centre, which is the pixel `Hero.tsx` expands out of. The plate
dissolves over the **back two-thirds** of the move: not at the top, where the
mark is still small and would read as an object sitting on the hero rather than
something the camera is moving through; and not confined to the last third,
which is where the original started and which meant the hero had finished
arriving before anyone could see it.

**The handoff is two-sided and all three sides are required.** `Intro` fires
`onHandoff` as the **zoom-in starts**, not when it ends. `Hero` uses that to
begin its arrival, and the **navbar slides down on the same start, from the same
timeline**, because `docs/07` §1 asks for one beat rather than two adjacent
ones. The shared length is `HANDOFF_S` in `lib/animation/handoff.ts`; a duration
written down twice is a duration until someone retunes one copy. Collapsing
`onHandoff` and `onComplete` into a single callback turns the seam back into a
cut. **Measured on the running timeline: the hero's arrival and the navbar's
slide both begin at 2.205s** — within one frame of the zoom-in's 2.215s.

> **CLOSED in `8875803`, one commit after the revert.** This box recorded the
> hero still carrying the merge's arrival — `HANDOFF_S`, 0.45s, tuned for an
> expansion out of a *point* — which against a 0.95s zoom-in left it fully
> settled ~0.42s before the plate cleared.
>
> Restored to `f640107` verbatim: **`scale 1.12 → 1` over 1.6s.** The incoming
> half of a handoff must outlast the outgoing one; 1.6s against 0.95s is that
> margin. `Hero.tsx` no longer imports `HANDOFF_S` — the navbar keeps it, and the
> two share a start instant rather than a duration.
>
> This box also predicted that *"`Hero.tsx`'s header still describes the
> contraction it expanded from, and will need the same pass"*. Half right: the
> constants were fixed in `8875803`, but `ARRIVAL_S`'s own docblock was left
> arguing for the reverted value and was not corrected until `7b3b5d2`. See
> §`docs/07` §3 for the full record.

Phase 7's `power2.in` is a deliberate exception to the shared curves in
`lib/animation/easing.ts`: every shared curve *decelerates* into its end state,
which is right for something **arriving** and wrong for something **leaving**.
The camera commits slowly and then accelerates past the viewport; it is the hero
underneath that decelerates into place. An eased-out zoom would put the brakes on
at the exact frame the move is supposed to be handing over.

**Under `prefers-reduced-motion` none of the seven phases run.** The settled mark fades in
at About-instance size (72px), holds, and cross-fades to the hero and the
navbar: 0.20 + 0.10 + 0.25 = **0.55s** total, measured 0.57s. No name, no
approach, no merge, no contraction.
Someone who asked for less motion is not owed a shorter version of the
spectacle, they are owed its absence. `onHandoff` still fires on that path, so
no consumer has to special-case "the intro did not run".

> **One trap, recorded because it was shipped.** The reduced-motion path
> re-centres the mark's box on its own middle, and it has to do that by writing
> the **`translate`** property — not by GSAP's `xPercent`/`yPercent`. Tailwind v4
> compiles `-translate-x-1/2 -translate-y-[90%]` to the standalone `translate`
> property, which **composes with** `transform` rather than being replaced by it,
> so a GSAP transform adds a second offset to the first and pushes the mark off
> the top of the screen. Same property, or no override.

### Replayability is a requirement, not a nicety

The same mark-reveal motion is scheduled to double as a **section-transition
beat**. `Intro` is therefore built to be re-run:

- the timeline is **built fresh on every play**, keyed off a `playToken` prop;
- a `reset()` runs first, so a second play is identical to the first rather than
  inheriting whatever transform the last one left behind;
- `sequence="mark"` plays **phases 4 through 7** without the name — starting
  from the settled mark — which is the shape a transition wants.

It deliberately does **not** own the scroll lock (see §3).

---

## 3. The ordering contract

```
1. AssetLoader mounts
   - tracks real readiness; shows a progress readout only if the wait exceeds
     the grace window, so a warm cache never flashes a bar
   - resolves the moment everything needed is in

2. Intro plays
   - fixed, scripted; never gated on the network again

3. Hero expansion and navbar entrance overlap the Intro's phase E
   - onHandoff -> both start while the plate is still dissolving

4. IntroGate unmounts
```

`components/intro/IntroGate.tsx` is the **single owner** of the
`html[data-intro-active]` scroll lock, for the whole gate — both plates. Neither
child touches it. Two components setting and clearing one attribute with
overlapping lifetimes is how a document ends up permanently unscrollable, and it
is also what keeps `Intro` safe to reuse elsewhere: a transition that is not
covering the whole page has no business locking it.

The Intro plays **once per page load** — a **module-scope boolean**, not
`sessionStorage`. **This reverses what this section used to say.** The old rule
was "once per session, so a visitor reloading does not see it again";
`docs/07_SITE_RESTRUCTURE.md` §3 fixes the trigger as *actual document load or
refresh* and requires any visited flag to be removed rather than tuned, while
also requiring that a client-side navigation back to Home does not replay it.
Those two are only compatible with an in-memory flag: a refresh instantiates a
fresh module graph and the Intro plays; a client navigation reuses the same
module and it does not. No storage key is written at all — verified.

---

## 4. The navbar renders on the content routes, and never on `/projects/<slug>`

**REVISED 2026-08-22 (Phase 2).** This section used to be headed "the navbar
renders on `/` and only on `/`", and while the site was one page that was
correct. It is not any more: WORK is a route now, and a bar whose entries point
at pages it does not itself appear on is unusable.

It is mounted in **`app/(site)/(chrome)/layout.tsx`**, a nested route group
holding `page.tsx`, `work/` and — from Phase 4 — `about/`. It renders before
`{children}` and as a sibling of the page's `<main>`, so `<header>`'s nearest
ancestor is still `<body>` and it is still the `banner` landmark. Route groups
contribute no URL segment, so no URL changed and — the part that mattered — the
pages did not move off segment level `/`, which is where
`@modal/(.)projects/[slug]` intercepts. Verified by clicking cards on both `/`
and `/work`, including CCN and SNA, which exist only on `/work`.

It is still **not** in `app/(site)/layout.tsx`, which would have put it on the
five `/projects/<slug>` routes as well. All three original reasons stand, and
all three were only ever about the detail routes:

1. `ProjectDetailFrame` already owns that top strip, with a back link and a
   theme toggle. Two fixed bars in the same 64px collide.
2. Detail pages are **Tier 3**. A transparent bar carrying a Tier 1 mark is the
   wrong register for the surface where recruiters evaluate substance.
3. That layout's own header states it must render no DOM element and no
   wrapper. `(chrome)` is a fragment too, so that is intact one level down.

**If interception ever stops firing, the fallback is to delete `(chrome)/layout.tsx`
and mount `<Navbar />` in each page file** — three JSX lines, zero routing risk.
Routing failures of this kind are silent, so test by clicking a card, never by
typing the URL: a typed URL is a hard load, which by design never intercepts.

---

## 5. Where the theme toggle lives now

**REVISED 2026-08-21 (Phase 0), per `docs/07_SITE_RESTRUCTURE.md` §1: the toggle
is back in the desktop bar.** The original version of this section recorded the
opposite — that the navbar spec removed it from the desktop chrome by name — and
that call is reversed, not softened. It is recorded here rather than in a comment
because it changes behaviour on the site's most-visited surface, and because it
must not be "fixed" later by someone who reads either state as an oversight.

| Surface | Toggle? |
|---|---|
| Homepage, desktop (`≥768px`) | **yes — in the navbar**, first item of the right cluster, `hidden md:block` |
| Homepage, mobile (`<768px`) | yes — inside the menu (`NavMobileMenu`) |
| `/about` (Phase 4) | yes — the same navbar, same two instances |
| `/work` (Phase 2) | yes — the same navbar, same two instances |
| `/projects/<slug>` (Tier 3) | yes — `ProjectDetailFrame` |
| `/404`, error page | yes |

**Exactly one is ever visible.** Two instances exist in the markup on any page
that renders `<Navbar />`, and they are mutually exclusive by construction: the
bar's is `hidden md:block`, and the menu holding the other is only reachable
through a button that is `md:hidden`. Nothing enforces that pairing, so both
gates have to be re-checked together — verify at 375 / 639 / 768 / 1440 / 2560.

**What reversed it.** The cost this section used to state plainly turned out to
be the whole argument: a desktop visitor on the homepage could not switch themes
without either opening a project or narrowing the window. The hero had carried
the site's single instance, anchored to the top-right inset of the shared
container — the exact rectangle the fixed navbar now occupies — and once the bar
took that rectangle without taking the control, the homepage simply had no
toggle at desktop widths.

**How it avoids the objection in `ThemeToggle`'s header**, which still stands on
its own terms: a fixed control crossing three surface contexts on `/` would need
a plate of its own, and that plate would make the pinned hero surface appear
three times when `Contact.tsx` records that appearing *exactly twice*, at the two
spectacle beats, is what makes it read as a system. The bar needs no plate. It
already owns an escalating palette (`--nav-fg`, `--nav-fg-dim`, `--nav-accent`;
§6, Step 1) that is measured against every ground it crosses, and the toggle
joins it via a third constant, `THEME_TOGGLE_IN_NAV`. Neither
`THEME_TOGGLE_ON_BASE` nor `THEME_TOGGLE_ON_HERO` would do — the bar is over
both surfaces during one scroll, so either would be wrong on one of them
throughout.

**Clicking it over the hero produces the same dark plate, and that is correct.**
`app/globals.css` pins `--color-hero-surface`, `--color-hero-fg` and
`--color-hero-accent` out of the theme deliberately — the hero is a dark context
in both themes, and the file says outright not to "complete the set" by adding
light values. `docs/07` §9.4 records the verification. This is not a half-built
light mode and must not be filed as one.

---

## 6. Navbar legibility — a transparent bar over changing ground

The spec asks for a fixed, transparent bar with **no solid background fill**, and
asks explicitly that a real readability problem be *flagged* rather than quietly
traded away. There is a real one. Here is the whole escalation, in order, with
what each step does and does not solve.

**Step 1 — adaptive colour.** The bar crosses three grounds on `/`: the hero
(`bg-hero-surface`, pinned dark in both themes), the mid-page sections
(`bg-base`, which *flips*), and the Contact plate (dark again). One fixed colour
cannot serve all three. The bar swaps palette at the hero's edge, driven by a
`data-over-hero` attribute and a CSS cascade in `globals.css` — not React state,
which was a `setState`-in-effect the lint rule correctly rejected and which
re-rendered the whole bar to change three strings.

> **AMENDED 2026-08-22 (Phase 2) — this escalation assumed a hero on the page,
> and `/work` has none.** There, the bar is in the past-hero palette *with* the
> scrim from scroll position 0 and never leaves it — which is the CSS default,
> since `globals.css` makes the hero case the override precisely so a heroless
> route is safe by not carrying the attribute. Two things follow, both in
> `Navbar.tsx`: the attribute is decided at **render** so the server markup is
> already right (removing it on mount would ship one frame of hero palette over
> `bg-base` — in light mode, near-white on warm-white), and the hero lookup
> **re-runs on every route change**, because the bar is layout-mounted now and
> does not remount between `/` and `/work`. It reads DOM presence rather than
> the pathname, so an open project overlay — pathname `/projects/<slug>`, Home
> still mounted behind the dialog — keeps the palette it had.

Measured contrast, all clearing AA for the 12px mono the bar is set in:

| | fg (at 72%) | accent |
|---|---|---|
| over hero | ~8.6:1 | 8.00:1 |
| past hero, dark | ~9:1 | 7.95:1 |
| past hero, light | ~8:1 | 5.34:1 |

*Solves:* contrast against the background. *Does not solve:* anything.

**Step 2 — hide on scroll-down, return on scroll-up. ~~SHIPPED~~ REMOVED
2026-08-22.**

It read: *while reading downward the bar is not there, so there is nothing to
overlap; scrolling up — the gesture that means "I want to navigate" — brings it
back. Hysteresis on accumulated travel (90px down to hide, 50px up to reveal) so
trackpad jitter cannot make it flicker. It stays put above 140px of scroll, and
while the mobile menu is open.*

**It is gone.** `.claude/handoff/navbar-indicator-design.md` §2 deletes it: the
bar now carries an **active-route indicator** (§6.1 below), and an indicator on
a bar that retracts while you scroll is invisible exactly when it is doing its
job. `setHidden`, its ScrollTrigger, `HIDE_AFTER`, `REVEAL_AFTER`, the
`data-hidden` attribute and `<header>`'s `transition-transform` all went with
it. **The bar is permanently visible.**

`ALWAYS_VISIBLE_ABOVE` (140) **survives**, and not for this reason — the
`data-over-hero` calculation reads `ALWAYS_VISIBLE_ABOVE / 2` as the boundary
the hero's bottom edge crosses. Deleting it with the rest would have broken the
palette swap.

*What its removal costs:* the quieter reading experience past the hero. *What it
does not cost:* legibility — Step 3 was always the step that covered the hard
case, and it still does, alone.

**Step 3 — a scrim, past the hero only. THIS IS A DEVIATION FROM THE SPEC.**

It was added after the failure was screenshotted, not predicted: over the About
section the centre cluster lands directly on a paragraph and **both** texts
become unreadable — the nav labels and the sentence underneath them. No amount
of colour tuning fixes two texts occupying the same pixels.

The rule is `[data-nav-root]:not([data-over-hero])`: an 80% `--color-base` tint
(so it flips with the theme) plus a 10px backdrop blur. **Over the hero the bar
is still completely transparent — no fill, no blur** — which is where the
transparency actually reads as design rather than as a defect, and is the part
of the spec's intent worth protecting.

**"Past the hero" now means "not on a dark plate", and since Phase 5 there are
two of those.** `data-over-hero` is set over the reveal footer as well as over
the hero, so the scrim is suppressed on both dark surfaces and applies only over
`bg-base` — the only ground it was ever needed on.

**The plate case was previously UNOBSERVED, not handled.** `Navbar.tsx` bound one
ScrollTrigger, to the hero, and nothing tested the plate at all. Measured on the
pre-Phase-5 build at maximum scroll, the bar overlapped the Contact plate by
**129px at 1024×600** and **54px at 360×640** with the light palette still
applied — near-`#151515` labels under an 80% `#FDFCFA` tint, on a `#07090C`
surface. It did **not** overlap at 1440×900 (−248px) or 1280×800 (−154px), which
is why it went unnoticed; the reveal footer's stamp band adds ~198px of plate
height and pulls 1280×800 into the same case (+46px measured).

The test is a **zero-height sentinel at the plate's static top**, not an
intersection test against the plate: the plate is `md:sticky` and reports its
PINNED rect from first paint, so a naive test would flip the bar dark on every
page at every scroll position. See `docs/03_FRONTEND_SPEC.md` Rule S-6.

**This is the open decision on the list below, and its alternative has narrowed.**
It used to be: if Saad would rather keep the bar transparent everywhere, drop
Step 3 and let Step 2 do all the work. **Step 2 no longer exists**, so dropping
Step 3 now leaves the bar transparent over live text at every scroll position,
with nothing behind it. Reversing the scrim therefore means either accepting
that, or bringing hiding back — which re-breaks the indicator.

---

## 6.1 The active-route indicator (added 2026-08-22)

A **2px line** beneath whichever centre item is the page you are on, sliding and
resizing between the three. Specified in
`.claude/handoff/navbar-indicator-design.md`; the values that bind later work are
recorded in `docs/07_SITE_RESTRUCTURE.md` §1.1 rather than here, because §1 is
where the navbar's contract lives.

The part that belongs in *this* doc is the interaction with the two mechanisms
above: the line's colour is **`--nav-accent`**, the same escalating variable
every other control in the bar rides, so it swaps with the `data-over-hero`
palette for free and is never a fixed hex on a ground that flips. Measured at
1440: `#14b8a6` over the hero in both themes, `#14b8a6` / `#0f766e` past it in
dark / light.

---

## 7. Open items

Design calls made here in the absence of a decision. Each is cheap to reverse and
the reversal point is named.

1. **Centre icon — resolved as a constellation node cluster.** The spec left it
   open between a home icon and a tech icon. Neither was chosen literally: this
   is the hero's own `ParticleGrid` reduced to four nodes, so the centre of the
   bar quotes the site's most distinctive visual. It avoids both template
   signatures (the house; the terminal prompt) and still *reads* as home from
   its position and its accessible name — which is now **`Home`**, not `Back to
   top`: Phase 2 made the icon a `<Link href="/">`, and on `/work` "back to top"
   would have described something it does not do. Change it in
   `components/ui/NavIcons.tsx`; the name is `NAV_HOME_LABEL` in
   `components/ui/navContent.ts`.
2. **Copy confirmation — resolved as a masked label swap plus a checkmark.** A
   toast was rejected (feedback lands somewhere other than the thing clicked); a
   bare pulse was rejected (confirms *something* happened, not that the right
   thing did, and says nothing to a screen reader). The swap is the site's
   existing vocabulary — every reveal here is a masked slide out of an
   `overflow-hidden` box. A third state exists for a genuinely refused clipboard
   write: the address is selected and the label says `Press Ctrl/⌘+C`, because
   showing "Copied" when the write rejected would be the site lying.
3. **Scrim vs. full transparency** — see §6, Step 3.
4. **"ABOUT" vs. "Trajectory".** The bar says ABOUT; the section it scrolls to
   is headed *Trajectory*, a wording `aboutContent.ts` chose deliberately. A nav
   label is scanned rather than read and "About" is the word an eye looks for —
   the same scannability argument that put `Contact` beside `Trajectory` /
   `Stack` / `Work`. The spec asks for ABOUT by name. Reverse it in
   `components/ui/navContent.ts` and the whole bar follows.
5. **No skip link.** The bar puts six focusable controls ahead of the page
   content for keyboard users (five until Phase 0 returned the theme toggle).
   Verified tab order is About → Home → Work → **theme toggle** → email →
   LinkedIn → the hero's scroll cue, which is still short and coherent, so this
   remains a judgement call rather than a violation. **Phase 2 changed what
   those controls are, not how many:** the three centre entries are `<Link>`s
   now rather than buttons, so they gain the browser's own link affordances
   (middle-click, status bar, "copy link address"). Worth adding a skip link if
   the chrome grows again.
6. **Repeat-visit plate.** On a same-session revisit the gate's opaque plate
   ships in the server HTML and is removed at hydration, so the hero is covered
   for a few hundred milliseconds. Pre-existing (the old `HeroLoader` had the
   same shape) and nearly invisible, because the plate and the hero are the same
   near-black. The fix, if wanted, is the pattern `app/layout.tsx` already uses
   for the theme: a pre-paint inline script that reads `sessionStorage` and
   stamps an attribute on `<html>`.
