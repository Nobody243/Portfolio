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
two weights used above the fold. Nothing else — the hero has been Canvas2D plus
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

1. **"Muhammad Saad"** is shown, set, and held long enough to register as a name
   rather than as a flash.
2. It **contracts to the "MS" mark** — every character but the two initials
   drops out of the layout, the survivors slide together, and the pair hands
   over to the liquid letterforms. This is the jelly-blob-inside-the-glyphs
   beat.
3. A **small zoom-out** on the mark. A beat of settling and breathing room, not
   a hard cut.
4. A **smooth zoom-in that carries straight into the Hero.** The zoom-in *is*
   the transition, not a step before one.

**§4 is a two-sided move and both sides are required.** `Intro` fires
`onHandoff` as the zoom-in *starts*, not when it ends. `Hero` uses that to begin
its own arrival — scale `1.12 → 1`, opacity `0 → 1` — so the mark accelerates
out through the viewport while the hero decelerates into place underneath it.
The overlap is the hand-off. Collapsing `onHandoff` and `onComplete` into one
callback turns the seam back into a cut.

Both eases here are deliberate exceptions to the shared curves in
`lib/animation/easing.ts`, for one reason stated twice: every shared curve
decelerates into its end state, which is right for something *arriving* and
wrong for a camera *leaving*. The zoom-in uses `power2.in`; the arrival uses
`power2.out` rather than `GSAP_EASE.hero`, because easeOutExpo spends 80% of its
travel in the first quarter and — measured on the running timeline — finished
the arrival while the plate was still 74% opaque, i.e. entirely off-screen.

**Under `prefers-reduced-motion` none of §1–§4 runs.** The formed monogram is
shown and cross-fades out; there is no contraction, no zoom, and no arrival
tween. Someone who asked for less motion is not owed a shorter version of the
spectacle, they are owed its absence. `onHandoff` still fires on that path, so no
consumer has to special-case "the intro did not run".

### Replayability is a requirement, not a nicety

The same mark-reveal motion is scheduled to double as a **section-transition
beat**. `Intro` is therefore built to be re-run:

- the timeline is **built fresh on every play**, keyed off a `playToken` prop;
- a `reset()` runs first, so a second play is identical to the first rather than
  inheriting whatever transform the last one left behind;
- `sequence="mark"` plays steps 2–4 without the name, which is the shape a
  transition wants.

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

3. Hero arrival overlaps the Intro's zoom-in
   - onHandoff -> the hero starts settling while the plate is still up

4. IntroGate unmounts
```

`components/intro/IntroGate.tsx` is the **single owner** of the
`html[data-intro-active]` scroll lock, for the whole gate — both plates. Neither
child touches it. Two components setting and clearing one attribute with
overlapping lifetimes is how a document ends up permanently unscrollable, and it
is also what keeps `Intro` safe to reuse elsewhere: a transition that is not
covering the whole page has no business locking it.

The Intro plays **once per session** (`sessionStorage`, not `localStorage`) — a
visitor returning next week should see it again; a visitor reloading should not.

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

**The navbar spec removes the theme toggle from the desktop chrome by name.**
This is recorded here rather than in a comment because it changes behaviour on
the site's most-visited surface, and because it must not be "fixed" later by
someone who reads it as an oversight.

| Surface | Toggle? |
|---|---|
| Homepage, desktop (`≥768px`) | **no** |
| Homepage, mobile (`<768px`) | yes — inside the menu |
| `/projects/<slug>` (Tier 3) | yes — `ProjectDetailFrame` |
| `/404`, error page | yes |

**The cost, stated plainly:** a desktop visitor on the homepage cannot switch
themes without either opening a project or narrowing the window. The hero used
to carry the site's single instance, anchored to the top-right inset of the
shared container — which is the exact rectangle the fixed navbar now occupies.
The two cannot both have it, and the spec's call was the navbar.

`ThemeToggle`'s own header explains why it cannot simply become fixed chrome: it
would cross three surface contexts on `/` and would need a plate of its own,
which would make the pinned hero plate appear three times when `Contact.tsx`
records that appearing *exactly twice*, at the two spectacle beats, is what makes
it read as a system.

**If this proves annoying in practice**, the cheapest fix that respects the spec
is to add an instance to the Contact/close section — a Tier 1 echo on its own
dark plate, at the bottom of the page, where a settings-style control is
conventional. That is a content decision, not a bug fix.

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
5. **No skip link.** The bar puts five focusable controls ahead of the page
   content for keyboard users. Verified tab order is About → Back to top → Work
   → email → LinkedIn → the hero's scroll cue, which is short and coherent, so
   this is a judgement call rather than a violation. Worth adding if the chrome
   grows.
6. **Repeat-visit plate.** On a same-session revisit the gate's opaque plate
   ships in the server HTML and is removed at hydration, so the hero is covered
   for a few hundred milliseconds. Pre-existing (the old `HeroLoader` had the
   same shape) and nearly invisible, because the plate and the hero are the same
   near-black. The fix, if wanted, is the pattern `app/layout.tsx` already uses
   for the theme: a pre-paint inline script that reads `sessionStorage` and
   stamps an attribute on `<html>`.
