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

> **REWRITTEN IN PHASE 1 OF THE RESTRUCTURE.** The four-step sequence this
> section used to describe — name, contraction to the liquid-glass mark, a small
> zoom-out, then a `scale: 17` zoom-in that carried into the hero — is gone.
> `docs/07_SITE_RESTRUCTURE.md` §3 replaced steps 3 and 4 with a contraction to
> a point and an expansion out of it, and §2 retired the glass/liquid mark for
> circuit-trace geometry. The phase split below is the one shipped.
> The old table is in the history; do not restore it piecemeal.
>
> **AMENDED AGAIN — the mark is FACETED and phase C is a CROSSFADE.** The
> circuit-trace mark above was itself replaced, on Saad's call, by eight filled
> quadrilaterals (`docs/07` §2's superseded banner, and
> `.claude/handoff/ms-mark-faceted-design.md`). **Only phase C's mechanism
> changed with it. Every phase boundary, every duration and the 2.35s total are
> untouched** — A, B, D and E are exactly as they were. What is gone is the
> glyph-to-trace morph, the 80/100 split inside C, the node-dot power-up, and
> D's `--ms-stroke` ramp.

Five phases, **2.35s total** (measured: 2.350s from the Intro plate mounting to
it unmounting, on the faceted build; 2.354s on the trace build before it). The per-phase split lives in `components/intro/Intro.tsx` as
named constants, which is where it should be tuned.

| | Phase | Duration | Starts | Ease |
|---|---|---|---|---|
| A | "Muhammad Saad" appears, as **filled glyph outlines** | 0.22 | 0.00 | `power2.out` |
| B | It holds, long enough to register as a name | 0.13 | 0.22 | — |
| C | **The merge** — approach, then a crossfade | 1.05 | 0.35 | see below |
| D | Contraction to a point, then a 0.06 hold on it | 0.44 + 0.06 | 1.40 | `power2.in` |
| E | Hero expansion **and** navbar entrance | 0.45 | 1.90 | `power2.out` |

**A: the name is not DOM `<text>`.** It is Space Grotesk's own contours,
pre-extracted at build time into `components/ui/msMarkGlyphs.ts` and rendered as
**filled** paths, like the mark itself. The old reason for rendering outlines —
that fill and stroke cannot interpolate, so a morph forbade a paint-mode swap —
died with the morph. **The reason it is still right:** outlines put the name and
the mark in ONE coordinate system, so each capital's travel is a tween to the
*identity* transform and it lands on its faceted letter exactly, same baseline,
same cap height, same left edge. DOM text would need a `TextMetrics` baseline
probe to get within a few pixels of that, and this file deleted one already.

**C is three tracks that deliberately do not finish together.** The two capitals
translate and grow to their positions in the mark over `0 → 0.80·C`
(`power2.out`), arriving together at **t = 1.19 — the meeting, at dead centre**.
The other ten glyphs collapse into their own word's initial and fade over the
first 45% of C, staggered outward-in. At the meeting the two capitals
**crossfade** into the faceted letters they have arrived on top of, over 0.15s,
both halves on a LINEAR ramp — two opposed linear opacity ramps sum to a roughly
constant apparent density, whereas eased ones dip in the middle and the dip is
what makes a crossfade read as a flicker. That leaves **0.06s of the settled
mark standing still** before the contraction. **Never let that tail reach
zero**: the merge would land on the same frame the contraction starts and the
mark would never exist as a finished object.

> The 80/100 morph split, the 0.21s morph tail and the node-dot power-up are all
> gone with the trace mark. They are recorded here because the *meeting instant*
> they produced — 1.19 — is unchanged, and someone comparing timelines will
> otherwise assume the phase was retuned. It was not.

**D is ONE tween now.** The wrapper group scales to zero about `(296, 288)` and
that is the whole contraction. The `--ms-stroke` ramp that used to run alongside
it was a correctness requirement for a stroked mark — `non-scaling-stroke` holds
weight constant in device pixels, so a mark collapsing inside a fixed outline
thickens into a blob — and **filled shapes scale their own ink, so it is deleted
rather than retuned.** One consequence: the old hold sat on a visible disc,
because a stroked path at `scale: 0` still paints its round caps; filled shapes
leave nothing. The 60ms hold still stops the contraction and the expansion
reading as one rubber-band motion through zero, which was always its main job.

**E is a two-sided move and all three sides are required.** `Intro` fires
`onHandoff` as the expansion *starts*, not when it ends. `Hero` uses that to
expand out of the contraction pixel — scale `0 → 1` about a `50% 50%` origin,
opacity `0 → 1` — and the **navbar slides down on the same start and the same
duration, from the same timeline**, because `docs/07` §1 and §3 step 6 ask for
one beat rather than two adjacent ones. The shared length is `HANDOFF_S` in
`lib/animation/handoff.ts`; a duration written down twice is a duration until
someone retunes one copy. Collapsing `onHandoff` and `onComplete` into a single
callback turns the seam back into a cut. The plate finishes dissolving at 0.30
of E's 0.45, so the last third of the expansion happens in front of the visitor.

The eases are deliberate exceptions to the shared curves in
`lib/animation/easing.ts`, for one reason: every shared curve decelerates into
its end state, which is right for something *arriving* and wrong for something
*leaving*. D uses `power2.in`; the expansion uses `power2.out` rather than
`GSAP_EASE.hero`, because easeOutExpo spends 80% of its travel in the first
quarter and — measured on the running timeline — finished the arrival while the
plate was still 74% opaque, i.e. entirely off-screen.

**Under `prefers-reduced-motion` none of A–E runs.** The settled mark fades in
at About-instance size (72px), holds, and cross-fades to the hero and the
navbar: 0.20 + 0.10 + 0.25 = **0.55s** total, measured 0.57s. No name, no
approach, no merge, no contraction.
Someone who asked for less motion is not owed a shorter version of the
spectacle, they are owed its absence. `onHandoff` still fires on that path, so
no consumer has to special-case "the intro did not run".

### Replayability is a requirement, not a nicety

The same mark-reveal motion is scheduled to double as a **section-transition
beat**. `Intro` is therefore built to be re-run:

- the timeline is **built fresh on every play**, keyed off a `playToken` prop;
- a `reset()` runs first, so a second play is identical to the first rather than
  inheriting whatever transform the last one left behind;
- `sequence="mark"` plays **phases D and E** without the name — starting from
  the settled mark — which is the shape a transition wants.

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

## 4. The navbar renders on `/` and only on `/`

It is mounted in `app/(site)/page.tsx`, before `<main>` and as a sibling of it,
so `<header>`'s nearest ancestor is `<body>` and it is the `banner` landmark.

It is **not** in `app/(site)/layout.tsx`, which would have put it on the five
`/projects/<slug>` routes as well. Three reasons:

1. `ProjectDetailFrame` already owns that top strip, with a back link and a
   theme toggle. Two fixed bars in the same 64px collide.
2. Detail pages are **Tier 3**. A transparent bar carrying a Tier 1 mark is the
   wrong register for the surface where recruiters evaluate substance.
3. That layout's own header states it must render no DOM element and no
   wrapper. Mounting the nav at page level keeps that intact.

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

Measured contrast, all clearing AA for the 12px mono the bar is set in:

| | fg (at 72%) | accent |
|---|---|---|
| over hero | ~8.6:1 | 8.00:1 |
| past hero, dark | ~9:1 | 7.95:1 |
| past hero, light | ~8:1 | 5.34:1 |

*Solves:* contrast against the background. *Does not solve:* anything.

**Step 2 — hide on scroll-down, return on scroll-up.** While reading downward
the bar is not there, so there is nothing to overlap; scrolling up — the gesture
that means "I want to navigate" — brings it back. Hysteresis on accumulated
travel (90px down to hide, 50px up to reveal) so trackpad jitter cannot make it
flicker. It stays put above 140px of scroll, and while the mobile menu is open.

*Costs the spec nothing.* *Does not solve:* the bar revealed mid-page over live
text.

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

**This is the open decision on the list below.** If Saad would rather keep the
bar transparent everywhere, the alternative is to drop Step 3 and let Step 2 do
all the work — which means the bar is legible only at the top of the page and
immediately after a scroll-up over whitespace.

---

## 7. Open items

Design calls made here in the absence of a decision. Each is cheap to reverse and
the reversal point is named.

1. **Centre icon — resolved as a constellation node cluster.** The spec left it
   open between a home icon and a tech icon. Neither was chosen literally: this
   is the hero's own `ParticleGrid` reduced to four nodes, so the centre of the
   bar quotes the site's most distinctive visual. It avoids both template
   signatures (the house; the terminal prompt) and still *reads* as home from
   its position and its accessible name (`Back to top`). Change it in
   `components/ui/NavIcons.tsx`.
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
   Verified tab order is About → Back to top → Work → **theme toggle** → email
   → LinkedIn → the hero's scroll cue, which is still short and coherent, so
   this remains a judgement call rather than a violation. Worth adding if the
   chrome grows again.
6. **Repeat-visit plate.** On a same-session revisit the gate's opaque plate
   ships in the server HTML and is removed at hydration, so the hero is covered
   for a few hundred milliseconds. Pre-existing (the old `HeroLoader` had the
   same shape) and nearly invisible, because the plate and the hero are the same
   near-black. The fix, if wanted, is the pattern `app/layout.tsx` already uses
   for the theme: a pre-paint inline script that reads `sessionStorage` and
   stamps an attribute on `<html>`.
