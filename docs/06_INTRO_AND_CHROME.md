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

Seven phases, **2.765s total, on all three routes**. The per-phase split lives in
`components/intro/Intro.tsx` as named constants, which is where it should be
tuned.

> **AMENDED 2026-08-22 — PHASE 7'S CAMERA IS RETIRED, AND THIS IS THE ONE ROW
> THAT CHANGED.** This section read *"Seven phases, **3.17s total** (measured:
> 3.174s from the Intro plate mounting to it unmounting)"*, and row 7 below read
> *"**ZOOM IN** — `scale: 17`, into the Hero | 0.95 | 2.215 | `power2.in`"*.
> That was **Home's** total; `/work` and `/about` already ended on a 0.55s plate
> dissolve, so the site shipped two endings, two totals and one route-dependent
> branch (`getHeroStage()`).
>
> **The dissolve is now the only ending.** One total, one branch fewer, and the
> sequence's last image is the settled mark at `ZOOM_OUT_SCALE` 0.82 on every
> route. Phases 1-6 are untouched, to the millisecond.
>
> **Why.** The camera existed only where a full-viewport hero stage was there to
> aim it at, which is one route out of three; the argument for *not* carrying it
> to the other two ran to 128 lines in `Intro.tsx`. Keeping one route's entrance
> structurally different from the other two — with its own total, its own ending
> and its own DOM read — cost more than the x17 bought.
>
> **What went with it:** `ZOOM_IN_S`, `ZOOM_IN_SCALE`, `PLATE_DISSOLVE_RATIO`,
> the `getHeroStage()` read inside `Intro.tsx` (`Navbar.tsx` still imports it and
> is untouched), and `INTRO_TOTAL_S`'s per-route split.
> **What came with it:** `OFF_HOME_DISSOLVE_S` is renamed `DISSOLVE_S`, and
> `Hero.tsx`'s arrival is re-derived — `ARRIVAL_S` 1.6 -> **1.30s**,
> `ARRIVAL_SCALE` 1.12 -> **1.04**. See the Phase 7 section below.
>
> **Preserved, not deleted:** branch `intro-zoom-in-backup`, tag `intro-zoom-in`
> — the same pair `intro-merge-to-point-backup` / `intro-plan-a` preserves the
> reverted merge-to-a-point sequence. `docs/07` §3 records both.

| | Phase | Duration | Starts | Ease |
|---|---|---|---|---|
| 1 | **HOLD** — "Muhammad Saad", as filled glyph outlines, still | 0.30 | 0.000 | — |
| 2 | **DROP** — the ten non-initials shrink and fade, staggered | 0.35 (+0.015 stagger) | 0.300 | `power2.in` |
| 3 | **SLIDE** — the two survivors close up and re-centre | 0.42 | 0.785 | `power3.inOut` |
| 4 | **MORPH** — text becomes mark, overlapping the slide's tail | 0.40 | 0.995 | `GSAP_EASE.ui` / `.hero` |
| 5 | **ZOOM OUT** — the stage backs off to 0.82 | 0.60 | 1.395 | `GSAP_EASE.hero` |
| 6 | **BREATH** — nothing happens | 0.22 | 1.995 | — |
| 7 | **DISSOLVE** — the stage holds at 0.82, the plate fades out from under the mark | 0.55 | 2.215 | `power2.in` |

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

**Phase 2 is a subtraction, and it fades SYMMETRICALLY IN PLACE.** The ten do
not converge on the anchor, on their word's capital, or on each other. A
monogram is the initials that survived, so the ten are discarded rather than
carried in — and sweeping them into the mark's 64-unit letter gap would rebuild
the overlapping mess `docs/07` §3 reverted and would fill the centre that phase
3 needs empty in order to read as *closing up*. Mechanically that means each
non-initial shrinks about `markX + advanceX / 2` on `BASELINE` (its advance
centre, on the one horizontal all ten share), not about its pen origin. It was
the pen origin — the glyph's bottom-left — until 2026-08-22, which measured as
9–13px of leftward and 7–11px of downward drift per glyph at 1440×900: ten
independent diagonal slips instead of one gesture. Durations, stagger, ease and
`DROP_SCALE` are unchanged by that correction; if the sink ever needs reducing,
`DROP_SCALE` is the only sanctioned lever.

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

**Phase 7 is the transition, not a step before one.** The stage holds at
`ZOOM_OUT_SCALE` 0.82, where phase 5 left it, and the plate's `autoAlpha` goes
1 -> 0 over `DISSOLVE_S` 0.55s on `power2.in`. The mark takes no tween of its
own: it is a child of the plate and fades with it, at the same rate. There is
**no route branch** — this is the ending on `/`, `/work` and `/about` alike.

> **THIS PARAGRAPH DESCRIBED THE x17 CAMERA UNTIL 2026-08-22.** It read:
> *"`scale: 17` on an HTML ancestor of the SVG — not a `<g>` inside it, because
> an `<svg>` clips to its own viewport... The camera's fixed point is
> `(296, 288)`, i.e. dead viewport centre, which is the pixel `Hero.tsx` expands
> out of. The plate dissolves over the back two-thirds of the move..."* Two of
> those facts outlived the camera and two did not:
>
> - **The stage is still an HTML ancestor of the `<svg>`, not a `<g>` inside it.**
>   Still required at 0.82: a `<g>` would leave the mark's outer facets clipped
>   against a box that did not shrink with it.
> - **`(296, 288)` is still the pivot** — phase 5's, now. `msMarkGeometry.ts`
>   records the point as having worn three hats and now wearing two.
> - **It is NO LONGER the pixel `Hero.tsx` expands out of.** With no camera there
>   is no fixed point to align to, so the hero's `50% 50%` origin means only "the
>   hero settles about its own centre". That coupling — and the fragility warning
>   attached to it — is retired rather than preserved.
> - **`PLATE_DISSOLVE_RATIO` is gone.** The dissolve is not placed inside another
>   move any more; it starts on the hand-off instant and *is* phase 7.

**The handoff is two-sided and all three sides are required.** `Intro` fires
`onHandoff` as **phase 7 starts** — the frame the plate begins dissolving, while
it is still fully opaque — not when it ends. `Hero` uses that to begin its
arrival, and the **navbar slides down on the same start, from the same
timeline**, because `docs/07` §1 asks for one beat rather than two adjacent
ones. `HANDOFF_S` in `lib/animation/handoff.ts` is the **navbar's duration
only**; what the three components share is the **start instant**. Collapsing
`onHandoff` and `onComplete` into a single callback turns the seam back into a
cut. **Measured on the running timeline: the hero's arrival and the navbar's
slide both begin at 2.205s** — within one frame of phase 7's 2.215s.

> This said "as the **zoom-in** starts" and called `HANDOFF_S` "the shared
> length" until 2026-08-22. The instant is unchanged; the tween carrying it is
> the dissolve now, and the length was never actually shared — `Hero.tsx`'s
> `ARRIVAL_S` is 1.30s against the bar's 0.45s, and `handoff.ts` had already
> recorded that from its own side.

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
> **BOTH NUMBERS MOVED AGAIN ON 2026-08-22, when the camera was retired:
> `scale 1.04 -> 1` over 1.30s.** The rule did not change; the outgoing half did.
> The test is *how much of the incoming move remains at the frame the plate
> crosses 50% opacity*, which is 0.4365s under a 0.55s `power2.in` dissolve. At
> 1.60s the arrival is 61.5% done there, against the shipped 71.1%; at **1.30s**
> it is **70.7%**, reproducing the old seam to within 0.4 points, and it cuts the
> post-plate tail from 1.05s to 0.75s. The proportional answer
> (1.6 x 0.55/0.95 = 0.926s) is **wrong** and is recorded in `Hero.tsx` so it can
> be refused: it puts 84.8% of the arrival behind an opaque plate. `ARRIVAL_SCALE`
> 1.12 lost its stated reason outright — *"a camera moving forward hands off to a
> surface that is slightly too close"* — and **1.04** comes from two independent
> arguments: the site's 13px/21px travel budget, and the tagline reveal that now
> runs entirely inside the arrival's tail (14.5px of sideways creep at 1.12
> against 4.85px at 1.04).
>
> This box also predicted that *"`Hero.tsx`'s header still describes the
> contraction it expanded from, and will need the same pass"*. Half right: the
> constants were fixed in `8875803`, but `ARRIVAL_S`'s own docblock was left
> arguing for the reverted value and was not corrected until `7b3b5d2`. See
> §`docs/07` §3 for the full record.

Phase 7's `power2.in` is a deliberate exception to the shared curves in
`lib/animation/easing.ts`, and it survives the camera's retirement unchanged:
every shared curve *decelerates* into its end state, which is right for
something **arriving** and wrong for something **leaving**. The plate is
leaving; it is the hero underneath that decelerates into place. An eased-out
exit would put the brakes on at the exact frame the move is supposed to be
handing over.

Off Home the same curve does a **second** job, and that job does not exist on
Home: it shapes a lightness ramp. In light mode the ground travels
L* 2.41 -> 98.99 across ~93% of the viewport as the plate goes. On a 0.55s
dissolve `GSAP_EASE.ui` is halfway through that change at 193ms; `power2.in` is
halfway at **437ms**, and it delivers 12.5% rather than 77.6% of the ramp in the
first 275ms. **On Home the ground is `bg-hero-surface` -> `bg-hero-surface`,
1.00:1 in both themes, so Home's curve rests on the first reason alone.** The
two are stated separately on purpose: a curve that looks inherited is how a
conclusion outlives its argument.

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

**It has an off-Home branch, and it did not until 2026-08-22.** §3 documents a
three-route scope everywhere else on this page, but this contract described only
`/`, so the exit it specified was the one exit that does not happen on two of
the three routes. `docs/07` §5 already carried the off-Home ending; this is the
same fact in the contract that is supposed to be the ordered summary of it.

```
1. AssetLoader mounts
   - tracks real readiness; shows a progress readout only if the wait exceeds
     the grace window, so a warm cache never flashes a bar
   - resolves the moment everything needed is in

2. Intro plays
   - fixed, scripted; never gated on the network again
   - phases 1-6 are IDENTICAL on all three routes

3. Phase 7 -- DISSOLVE, and it is the SAME phase 7 on all three routes.
   The stage holds at ZOOM_OUT_SCALE 0.82 where phase 5 left it, and the
   plate's own autoAlpha goes 1 -> 0 over 0.55s on power2.in. The mark takes
   no tween of its own; it is a child of the plate and fades with it.
   - onHandoff fires on phase 7's FIRST frame, while the plate is still fully
     opaque, and the navbar entrance starts from it (same tween, same 0.45s)
   - ON `/`: the hero's arrival starts from the same instant and runs 1.30s
   - OFF HOME (`/work`, `/about`): the DESTINATION's own above-the-fold
     entrance is re-triggered at onHandoff + 0.30s by
     `components/intro/IntroEntrance.tsx`
   - total 2.765s, on every route

4. IntroGate unmounts
```

> **STEP 3 WAS TWO STEPS, 3a AND 3b, UNTIL 2026-08-22.** 3a was Home's:
> *"phase 7 is ZOOM IN: scale 17 into the Hero, 0.95s, power2.in... total
> 3.165s"*. 3b was the dissolve above, off Home, described as the branch that
> exists because *"there is no hero stage to aim one at"*. **3a is deleted and
> 3b is now simply step 3.** One phase 7, one total, and `getHeroStage()` is no
> longer read inside `Intro.tsx` at all. The retired camera is on branch
> `intro-zoom-in-backup` and tag `intro-zoom-in`.
>
> **The onset asymmetry survives the merge and is NOT an oversight.** Home still
> has no `IntroEntrance` onset and the other two still have 0.30s, because the
> two incoming halves are different moves — see the paragraph immediately below,
> which is amended rather than deleted for the same reason.

**The two seams are arranged in OPPOSITE ORDERS, and that is not an
inconsistency — even now that the plate leaves identically on all three.** On
`/` the incoming half is long and back-loaded (the hero's **1.30s**
`power2.out`), so it can afford to start on the same frame the plate does. Off
Home the incoming half is short and front-loaded (`EASE.reveal` over 0.70s), so
the *entrance* is what has to start late — hence the 0.30s onset, which Home
still has no counterpart for. (This read "the hero's 1.6s `power2.out`, so the
plate can start leaving late" and referred to "3b's onset... no counterpart in
3a". The plate no longer starts leaving late anywhere; `ARRIVAL_S` was re-derived
to 1.30s against the 0.55s dissolve on exactly the test named in the next
sentence.)
The test both are tuned against is the same one: **at the frame the plate
crosses 50% opacity, how much of the incoming move is still to come?** Fired at
the hand-off with no onset, an off-Home entrance is 98.7% finished at that frame
and animates in secret. `IntroEntrance.tsx` carries the table and the measured
figures.

**Which routes take the 0.30s entrance onset:** `/work` and `/about` — the other two members of the
`(chrome)` group. `projects/[slug]` sits outside the group and shows no Intro at
all, so it has no branch here.

`components/intro/IntroGate.tsx` is the **single owner** of the
`html[data-intro-active]` scroll lock, for the whole gate — both plates.
**It takes JS-measured `padding-right` compensation, on the root AND on
`[data-nav-root]`, as of 2026-08-22.** The lock removes the classic scrollbar,
and the gate unmounts AFTER the plate has dissolved, so without compensation the
scrollbar returns under a fully visible page: measured at 1440x900 in headed
Chromium, 53 elements moved on `/work` and the bar's right cluster jumped 15px
one frame after the plate cleared. The second rule exists because `<header>` is
`fixed` and resolves against the initial containing block, which root padding
cannot reach. `/about` measured `0px` because it did not scroll at any width; since
2026-08-23 it scrolls below `lg`, so a narrowed desktop window DOES have a
scrollbar there — headed, `clientWidth` 885 at 900x800 and 753 at 768x1024 — and
**zero elements still move at the release**, because the compensation is written
against `innerWidth - clientWidth` rather than against a route. Playwright's HEADLESS Chromium uses overlay scrollbars and cannot
reproduce any of this; use headed. Full record in `app/globals.css`. Neither
child touches it. Two components setting and clearing one attribute with
overlapping lifetimes is how a document ends up permanently unscrollable, and it
is also what keeps `Intro` safe to reuse elsewhere: a transition that is not
covering the whole page has no business locking it. **The lock now reaches
`/about` and `/work` too** — close to a no-op on `/about` at `lg` and up, real
work on `/about` below `lg` where it scrolls, and never a no-op on `/work`, which is held at the scroll position it loaded at until the
gate retires.

The Intro plays **once per page load** — an **in-memory module-scope flag**, not
`sessionStorage`. **This reverses what this section used to say.** The old rule
was "once per session, so a visitor reloading does not see it again";
`docs/07_SITE_RESTRUCTURE.md` §3 fixes the trigger as *actual document load or
refresh* and requires any visited flag to be removed rather than tuned, while
also requiring that a client-side navigation back to Home does not replay it.
Those two are only compatible with an in-memory flag: a refresh instantiates a
fresh module graph and the Intro plays; a client navigation reuses the same
module and it does not. No storage key is written at all — verified.

**REVISED 2026-08-22: it is THREE flags in `components/intro/IntroSession.tsx`,
not one boolean in `IntroGate`, and the difference is the route scope.**
`played` was written only by an Intro that actually RAN, and the only thing that
could run one was Home — so a document entering on `/about` left it `false`, and
the first click to HOME played the Intro **on a client navigation**, which §3 of
`docs/07` forbids. Both halves of that were the same defect. The rule now is one
predicate over three monotonic flags, each with one writer:

```
shouldPlayIntro()  ⟺  !introSettled && (!documentEntered || introStarted)
```

- `documentEntered` — written by `<IntroSessionMarker />` in **`app/layout.tsx`**,
  so it fires on **every** route including the ones that never show an Intro. That
  is what stops a document entered through a shared `/projects/<slug>` link from
  playing the Intro when the visitor clicks through to `/work`.
- `introStarted` — written by `IntroProvider` when it decides to play.
- `introSettled` — written at **finish**, not at start, so an interrupted run is
  resumed rather than skipped. That property is `played`'s, preserved verbatim.

The read happens once per provider instance, in a lazy `useState` initialiser,
and every write happens in an effect — React runs all renders in a commit before
any effect in that commit, which is what makes the read safe. **A Suspense
boundary, a `loading.tsx` or a `next/dynamic` import between `app/layout.tsx` and
`app/(site)/(chrome)/layout.tsx` would split that commit and this has to be
re-verified.** Zero of all three exist today.

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

**THAT FALLBACK IS FOR THE NAVBAR AND MUST NOT BE APPLIED TO THE ENTRY GATE.**
Since 2026-08-22 this layout also mounts `<IntroProvider>`, which owns the
Intro's state and renders `IntroGate` — see §3. A per-page mount would remount
the gate on every `/` ↔ `/about` ↔ `/work` navigation and rely on a flag to
suppress it every single time, i.e. it would make the exceptional path the common
one. Layout mounting is what makes "never replays on a client navigation"
**structural**: the layout persists across every navigation inside the group, so
the provider does not remount and there is no guard clause to keep in sync. It is
the same safeguard `PageStack.tsx` records for the navbar's entrance.

**The gate's route scope is exactly this group, and that is the point of putting
it here:** `/`, `/work` and `/about` play the Intro on a document load;
`/projects/<slug>`, `not-found` and `error` sit outside the group and never do.
Reason 2 above — Tier 3 is where recruiters evaluate substance — rules the detail
routes out for the gate exactly as it rules them out for the bar, and a shared
project link is the single most likely cold entry point on the site.

`app/(site)/layout.tsx` is still wrong for it for its own stated reason as well:
that file's header says it renders **no provider**, in those words.

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

Measured contrast, all clearing AA for the 12px mono the bar is set in.
**Recomputed 2026-08-22** — the `fg` column was rounded in the optimistic
direction in all three rows and is now exact, with the composite hex given so
it is reproducible rather than trusted:

| | fg (at 72%) | accent |
|---|---|---|
| over hero | **8.65:1** (#A9ABAD) | 8.01:1 |
| past hero, dark | **8.83:1** (#ADADAE) — was written “~9:1” | 7.95:1 |
| past hero, light | **7.17:1** (#565655) — was written “~8:1” | 5.34:1 |

7.17:1 is light mode’s binding case and it still clears AAA with 2.17 to spare.
No pixel changed; the record did.

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

~~`ALWAYS_VISIBLE_ABOVE` (140) **survives**, and not for this reason — the
`data-over-hero` calculation reads `ALWAYS_VISIBLE_ABOVE / 2` as the boundary
the hero's bottom edge crosses. Deleting it with the rest would have broken the
palette swap.~~

**IT IS GONE TOO, 2026-08-22, AND KEEPING IT WAS A SHIPPED BUG.** The sentence
above is right that the palette swap borrowed the number and would have broken
without it. What neither it nor the constant's own docblock priced is that 70px
was never the bar's bottom edge. The bar is **48px below 640, 64px from 640 to
767, and 59px at 768 and up** — three heights, measured, and already written
down in `app/(site)/(chrome)/work/page.tsx` for a different reason.

The 22px gap between the real 48px edge and the assumed 70px one is reachable
and it is a **resting state, not a transient**: at 639×800, `/` and `/work` at
maximum scroll, the reveal footer's static top lands at 50.7px — below the bar,
above the threshold — so the bar takes the hero palette while sitting on
`bg-base`. In light mode that is #E8EAEC on #FDFCFA: **1.18:1 for the MS mark,
1.12:1 for the menu button. The bar is invisible.** In dark mode the same state
measures 16.41:1 against the 16.53:1 it would have had on the plate, which is
why it shipped.

The boundary is now `header.getBoundingClientRect().bottom`, read through a
function so both ScrollTrigger `start`s re-resolve it on refresh and a resize
across 640 or 768 carries. The constant has no readers left and is deleted.

**That fix narrowed the band and did not close it — closed 2026-08-22, second
pass.** The bar's bottom is not where its ink is. The ink row sits `padding-top`
down from the top of the bar — 13px below 640, 21px at and above it — so the
moment the plate's static top crossed the bar's *bottom* the palette flipped
while every glyph was still on `bg-base`. **Measured before: 37px of scroll at
1280×800 light, `/` and `/work` alike, at 1.18:1 on the MS mark; 1px at
1024×600.** Both are resting states, not transients.

The plate boundary is now the bar's **ink top** (`Navbar.tsx`'s `inkTop()` —
header rect plus the row's computed `padding-top`, which is immune to the
Intro's entrance transform in the way a child's rect is not). The hero palette
is taken only once the plate covers all of the ink; until then the **scrimmed**
light palette holds, and that palette is legible over both grounds — an 80%
`--color-base` scrim over #07090C composites to #CCCBCA, where `--nav-fg` is
11.37:1 and `--nav-fg-dim` 5.70:1.

**The hero boundary stays at the bar's bottom, deliberately.** It errs the safe
way: it drops the hero palette while the ink is still on the hero, and the scrim
covers that. Moving it to the ink's bottom edge would make the hero palette
persist as the ink started to leave the hero, which is the failure this whole
section is about.

*Measured after*, 1px scroll steps through the last 140px of `/` and `/work`, at
1440×900, 1280×800, 1024×600, 768×1024, 639×800, 375×667 and 360×640, both
themes, ground taken off a screenshot with the bar's contents hidden so the
scrim is still part of it: **0px of palette band at every one of the 28
combinations**, against 499px before. Worst remaining sample against a flat
ground is 3.37:1 on the indicator (3:1 non-text floor), at 1280×800 light inside
the straddle window.

**What it costs is one bounded case, recorded in `app/globals.css` beside the
scrim rule:** `CopyEmailButton`'s "Copied" renders `--nav-accent` as text at
3.41:1 on that #CCCBCA composite, for at most 38px of scroll and only if the
address is clicked inside it.

**A separate defect surfaced in the same sweep and is NOT fixed.** At 375×667
and 360×640, at maximum scroll on both `/` and `/work`, the reveal footer's
content scrolls under an unscrimmed bar and the MS mark lands directly on it.
Classified row by row at 375×667 light on `/work`: **19px of scroll where the
mark sits on the plate's 34×3px `accent-hero` rule (1.28:1) and 34px where it
sits on the "Contact" heading's own #E8EAEC glyphs (1:1)** — 53px in total,
identical in both themes, because it is a geometry problem and not a palette
one. The bar's palette is CORRECT throughout: `data-over-hero` is set, the mark
is #E8EAEC, and #E8EAEC on the plate itself is 16.53:1. What it is landing on is
content.

That is the OVERLAP problem — the scrim is deliberately off over dark plates —
and it is **unchanged by this fix: 53px before and 53px after.** It needs a
layout answer (clearance at the plate's top below `md`, or a scrim that survives
over the plate at narrow widths), not a threshold. It is also the second thing in
this section that a resting three-stop sweep could not have found: it IS a
resting state, but only at maximum scroll at two viewports.

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

**"Past the hero" now means "not on a dark plate", and there are THREE of those.**
`data-over-hero` is set over the reveal footer and over the Intro's plate as well
as over the hero, so the scrim is suppressed on all three dark surfaces and
applies only over `bg-base` — the only ground it was ever needed on.

> **This said "since Phase 5 there are two of those" until 2026-08-22, and the
> third was a shipped bug rather than a missing sentence.** `Navbar.tsx` derived
> its server-rendered `data-over-hero` from `pathname === "/"` alone, which was
> correct while the Intro only played on Home and wrong on two routes out of
> three once the gate moved to the `(chrome)` layout. MEASURED at 1440×900,
> light, t = 2000ms with the plate up: `/` had the attribute and was transparent
> on `--nav-fg: #e8eaec`; `/work` and `/about` had it ABSENT, so
> `[data-nav-root]:not([data-over-hero])` laid an 80% `--color-base` tint and a
> 10px backdrop blur across the top of an opaque `#07090C` plate. The bar's own
> row is parked at `yPercent: -100` until the hand-off, so what painted was an
> empty light-grey slab — a bar-shaped hole in the Intro — for the whole ~2.2s
> before the plate began to dissolve.
>
> The third ground is `!plateCleared` from `IntroContext`, OR-ed into the same
> attribute, and **it is released INSIDE the dissolve — at `PLATE_GROUND_RATIO`
> = 0.65 of it — rather than at either end.** Both ends were tried and both
> fail, in opposite directions:
>
> | release instant | what fails | measured |
> |---|---|---|
> | `onDone`, plate gone | in light mode the ground under the bar travels `#07090C` → `#FDFCFA` while the bar still carries `#e8eaec` | **1.18:1** at the last frame |
> | `!arriving`, the hand-off frame | the bar's own 80% `--color-base` scrim paints over a plate still at opacity **1.000** — the same light slab as the bug above, at 1/9th the duration | **15 frames (~250ms)** at 1440×900 light on `/work` with the plate ≥0.9 opaque; 16 on `/about`; contrast never failed (11.25:1) |
>
> `!arriving` is what shipped in `fc2f567` and it was corrected the same day.
> 0.65 comes from two independent constraints that agree. `power2.in` is cubic,
> so plate opacity at fraction *u* is 1 − *u*³. **The contrast ceiling** says how
> LATE the swap may be: `#e8eaec` on the composite behind the bar falls to 7:1 at
> *u* = 0.655 and to the 4.5:1 AA floor at *u* = 0.736, so 0.65 leaves the
> outgoing palette at 7.16:1 on its last frame with ~45ms of margin. **The slab
> floor** says how EARLY: the bar's own row tweens `yPercent −100 → 0` over 0.45s
> on `power2.out`, also cubic, so at *u* = 0.65 (t = 358ms) it is **99.1%
> arrived** — the scrim never paints an empty bar, which is what made the
> hand-off-frame version read as a hole punched in the Intro.
>
> **RE-MEASURED after the change, on a production build at 1440×900.** Every rAF
> frame, colours resolved through a canvas: **0** frames with header background
> alpha > 8/255 while plate opacity > 0.9, on `/work` and `/about` in both themes
> (62 before the fix — 15/16/16/15 across those four runs, `/` clean in both).
> Per-frame contrast from the SAME composited CDP frames, ink and ground out of
> one PNG, 156–244 assessed frames per run across the whole plate lifetime:
> **zero frames below 4.5:1**, worst **5.64:1** (light `/work`, the last
> hero-palette frame, `#e8eaec` on the `rgb(90,91,92)` composite — one frame
> later than nominal, which is exactly what the 7:1 design margin was for).
> On `/` the ink never changes across the hand-off at all, because `intro`
> overlaps `hero` there by construction.
>
> The cost is stated rather than hidden: for the last 192ms of the dissolve the
> bar carries its light scrim over a plate still 0.725 → 0 opaque — a `#D9D9D9`
> bar on a ground travelling `#4B4C4D` → `#FDFCFA`. A lighter bar over a visibly
> fading plate, not a bar-shaped hole in an opaque one.

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

Two things about it that were **not** free and had to be fixed on 2026-08-22:
its `background-color` was in neither `transition-property` list, so it snapped
where every sibling cross-faded (invisible in dark, an L\* 67.41 → 44.50 jump in
light); and under reduced motion the variant now **narrows** that list to
`background-color` rather than emptying it, because a colour change is not
motion on this site and every other item in the row cross-fades ungated.

---

## 6.2 The palette, swept — 2026-08-22

Recorded so the next pass does not re-derive it, and because the sweep found a
defect that reading the source did not (see §6's `ALWAYS_VISIBLE_ABOVE` note).

**Method, and it matters.** Contrast is computed against the **actual rendered
ground pixel**, read back from a screenshot, not against the token the ground is
supposed to be. The bar is scrimmed (`color-mix` at 80%) and
`backdrop-filter: blur(10px)`, so the declaration is not what the compositor
produces, and the one real failure below was invisible to any check that trusted
the token. Element colours come from `getComputedStyle`; `color-mix(in oklab, …)`
computes to `oklab(L a b / α)` and is converted to sRGB before compositing.

**Coverage.** 11 elements × 3 routes × up to 3 scroll positions (top / mid /
max) × 6 viewports (375×667, 639×800, 768×1024, 1024×600, 1440×900,
2560×1440) × 2 themes = **924 states, 616 of them with a measurable ratio**
(the rest are `display: none` — see the gate column).

| Element | Floor | min | max | Gate |
|---|---|---|---|---|
| MS mark | 3 (graphic) | 16.16 | 17.81 | always |
| Location label | 4.5 | 6.93 | 8.83 | `sm:inline` |
| ABOUT | 4.5 | 6.22 | 8.87 | `md:flex` cluster |
| WORK | 4.5 | 6.98 | 8.83 | `md:flex` cluster |
| Centre home icon | 3 | 6.98 | 8.87 | `md:flex` cluster |
| Active indicator | 3 (graphic) | 5.10 | 8.01 | `md:flex` cluster |
| Copy-email address | 4.5 | 7.17 | 8.83 | `md:block` |
| “Copied” confirmation | 4.5 | 5.28 | 8.01 | `md:block` |
| LinkedIn icon | 3 | 7.17 | 8.87 | `md:block` |
| Theme toggle | 4.5 | 7.08 | 8.83 | `md:block` |
| Menu button | 3 | 7.15 | 8.83 | `md:hidden` |

**616 / 616 pass.** The binding case is the “Copied” confirmation at 5.28:1 —
the only element in the bar rendering `--nav-accent` as *text*, and the one
`app/globals.css` records as depending on the scrim guard.

**Exactly one theme toggle is visible at every width**, verified as a count
rather than by reading the two class gates: the bar's toggle is measurable in 56
of 84 states and absent in the 28 below `md`; the menu button is the exact
complement, 28 and 56. The mobile menu's own toggle sits inside a closed
`<dialog>`, which is `display: none`.

### 6.2.1 The axis this matrix was missing — added 2026-08-22

**Every state above is a page AT REST, and that is structurally why 924 passing
states did not catch a 150ms contrast failure in the middle of a navigation.**
Three / mid / max scroll are three still frames. The bar's palette, the scrim and
the ground under all of it change during two events that this matrix never
sampled, and BOTH turned out to contain failures the resting sweep could not see:

- **1.01:1** on the location label at t=50ms of `/ → /about` in light, because
  the ink cross-faded between two inverted palettes while the ground it answers
  to snapped. Ten of thirty-two navigations were below AA.
- **1.18:1** on the MS mark across 37px of scroll at 1280×800 in light, at the
  seam where the reveal footer's plate meets the bar.

**So the matrix now has a fourth axis, and a sweep that does not run it is not a
sweep.** In addition to the resting states above:

1. **During every route transition.** All six directed pairs plus back and
   forward, both themes, at least two viewports, sampled at **0 / 50 / 100 / 200
   / 350 / 600ms** after the commit frame, and including the mobile menu's Home
   link. Ground off the composited pixels, ink paired to the SAME frame — see the
   method note below, because two clocks will otherwise report failures that were
   never on screen.
2. **Across every scroll seam, one pixel of scroll at a time.** The hero/`bg-base`
   edge and the plate/`bg-base` edge, through the whole crossing, not at three
   sampled stops. A band 37px wide is invisible to a three-stop sweep and is a
   RESTING state at the viewports where it lands at maximum scroll.

**Method note that costs a re-run if it is skipped.** Ink read with
`getComputedStyle` runs before paint; a CDP screencast frame is timestamped by
the compositor. Within ~8ms of a route commit those two clocks disagree by a
whole frame, and pairing by timestamp reports ink against pixels it was never on.
Paint an in-page clock marker — a small element whose background colour encodes
`performance.now()`, written in the same rAF callback that samples the ink — and
pair by the value read out of the frame. Every figure in this section's 2026-08-22
re-sweep was produced that way.

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
