# Master Spec — Navbar, Intro, Home / About / Work Structure

Saad's spec, 2026-08-21, reproduced as the governing document. Tracked in `/docs` rather than
`.claude/` per CLAUDE.md's rule: this constrains every remaining ticket, so it is architecture.

> **Supersedes parts of two earlier docs:**
> - `docs/06_INTRO_AND_CHROME.md` — its navbar **layout** (left/centre/right content) is still
>   correct, but its **spacing model** is replaced by the full-bleed decision in §1. Its Intro
>   **phase-duration table** and the **"zoom-in to scale 17"** handoff mechanic are replaced by the
>   merge-to-point sequence in §3. The Loader-vs-Intro conceptual split in that doc is unchanged.
> - `docs/03_FRONTEND_SPEC.md` — **Rule S-1 is reversed for chrome only.** See §1.
>
> `.claude/handoff/hero-sphere-design.md` is unchanged and remains the source of truth for the
> command sphere. Referenced here, not repeated.

---

## 1. Navbar

**Spacing model — a tracked reversal of Rule S-1.** The navbar no longer shares the site's
1440px-capped inset spine. It goes **full-bleed**: the mark hard against the left viewport edge,
email/LinkedIn hard against the right, with a **small fixed gutter** — deliberately not zero, and not
the old spine inset. Exact value is the designer's.

**Both `docs/03_FRONTEND_SPEC.md` and the navbar's own code comment must be updated** so rule and code
agree. State plainly in both: **chrome is full-bleed; content sections keep the spine.** This project
has been bitten by rule/code mismatches four times; this must not be the fifth.

**Typography uniformity.** Every text element in the bar — ABOUT, WORK, the email address, the
location label — uses one family, one weight, one tracking. No monospace-for-email-but-sans-for-links.
Designer confirms the single combination.

**Layout (revised 2026-08-21 — the theme toggle is back in).** Left: MS mark + "ISLAMABAD, PAKISTAN".
Centre: `ABOUT — [home/tech icon] — WORK`. Right, left-to-right within the cluster: **theme toggle** →
email as click-to-copy text with animated confirmation (not silent) → LinkedIn icon. Email and LinkedIn
keep the hard-right anchor; the toggle sits just inside them without displacing either. Fixed,
transparent.

**Theme toggle — reversal of the earlier "tier-3 / mobile only" call.** The toggle rendered only on
project-detail and error pages, so a desktop visitor had no way to switch themes on Home, About or
Work. That is a real gap, and it returns to the main navbar. **See §9.4 — the "light-mode Hero"
prerequisite attached to this does not hold, and must not gate the toggle.**

**Entrance.** The navbar **slides down from above the viewport**, and this happens **simultaneously**
with the hero expanding out of the Intro's centre point (§3). One coordinated beat, not two sequential
ones.

### 1.1 Active-route indicator (added 2026-08-22)

**§1 above fixes the bar's layout and said nothing about an active state. This adds one, and it binds
any later nav work** — which is why it is here rather than only in
`.claude/handoff/navbar-indicator-design.md`, per CLAUDE.md's rule.

**A 2px line beneath the active centre item, matching that item's width, sliding and resizing between
the three.** The layout contract in §1 is unchanged: same three clusters, same order, same full-bleed
gutter.

| Parameter | Value |
|---|---|
| Element | one absolutely-positioned `<span aria-hidden="true">` inside the centre cluster |
| Height · offset | **2px**, **6px** below the cluster's content box |
| Colour | `var(--nav-accent)` — never a literal; the bar crosses the pinned-dark hero and `bg-base`, which flips |
| Active source | `usePathname()` → `/` = the centre icon, `/about` = ABOUT, `/work` = WORK |
| Geometry | the active item's `getBoundingClientRect()`, differenced against the cluster's |
| Transition | `transform` + `width`, **240ms**, `EASE.ui` from `lib/animation/easing.ts` |
| Reduced motion | **none — it jumps** |
| Breakpoint | **`md` and up only**; below that the cluster is `hidden` and `NavMobileMenu` navigates |
| Re-measure on | route change · resize · `document.fonts.ready` |

**THE CENTRE ICON BEING `/` IS WHAT MAKES THIS WORK.** Every page the bar appears on has exactly one
active item. A two-item version would show nothing on Home. **Do not retarget the icon** without
resolving what Home's indicator becomes.

**`aria-current="page"` on the active link is REQUIRED, and it is the source of truth.** The line is
decorative and `aria-hidden`; the code finds what to measure *by* that attribute, so the two cannot
disagree.

> **THE GAP THIS PARAGRAPH USED TO FLAG IS CLOSED. Do not fix it again.** It read: *"Known gap,
> flagged rather than fixed: `NavMobileMenu`'s links do not carry it, so below `md` there is no 'you
> are here' announcement."* `e915298` added it — `NavMobileMenu.tsx:222` sets `aria-current` from the
> same `isActiveRoute` predicate the desktop bar imports, so the two can never name different pages.
> Below `md` the indicator cluster is `display: none` and this menu is the only navigation there is,
> which is why it mattered. **There is deliberately no Home entry in that menu**, so on `/` nothing
> in it is current; that is the menu listing destinations away from where you are, not a second gap.

**The centre icon carries `px-xs`.** Its 19px box was below the 24px minimum target size, and a 19px
line between a 40.81px one and a 32.64px one (measured at 1440) read as a stray tick. 8px a side takes
the item — and therefore the line — to 35px, which lands it between its two neighbours rather than
under half of either. **The fix is padding the item, never special-casing the line's width**, which
would decouple the line from the thing it points at. (The box is still 19px tall; `py` is deliberately not added,
because it would grow the bar and move the boundary `data-over-hero` uses.)

**Prerequisite, shipped in the same commit: hide-on-scroll is gone.** See
`docs/06_INTRO_AND_CHROME.md` §6 step 2. The bar is permanently visible.

---

## 2. The MS Mark

> ### ⚠️ SUPERSEDED 2026-08-21 — the mark is FACETED, not circuit/trace.
>
> The direction below was shipped and then replaced, on Saad's call, after the trace mark spent two
> sessions fighting its own smallest case. Full argument in
> `.claude/handoff/ms-mark-faceted-design.md`; the operative summary:
>
> **The mark is SIX filled polygons — ONE for the M, five for the S with two 45° chamfers at
> diagonally opposite corners.**
>
> **CORRECTED 2026-08-22. This paragraph said "eight quadrilaterals — three bars for the M with 45°
> cut tops", and that M was built, rendered at 17px and rejected.** Magnified from the real raster it
> read as three vertical strokes: a 56-unit cut is 2.98px at nav size, and a diagonal that small with
> nothing on the far side of it is a soft corner rather than a stroke. The M is now one polygon — two
> stems joined by a vee whose mouth is 112 units and which descends 184, so 5.95px and 9.78px at nav.
> `msMarkGeometry.ts` lines 176-192 carry the full reasoning. **A banner that supersedes the trace mark
> was itself overtaken, and did not say so — anyone reading `/docs` alone would have built the wrong
> mark.** Every edge is orthogonal or a true 45°, so
> the PCB-routing discipline that made the trace mark belong to `ParticleGrid` is kept; what is
> dropped is the hairline-and-dots *material*.
>
> **Why, in one line:** a stroked mark needs `non-scaling-stroke`, a contraction-time stroke ramp,
> round-capped micro-segments instead of circles, a floor derived from dot clearance, and a patched
> terminal to stop the S reading as a 5. **A filled mark has none of those problems**, and at 17px its
> bars are 2.98px against the trace's 1.25px stroke.
>
> **What this supersedes, precisely:** the "circuit / trace" direction in this section, the
> `non-scaling-stroke` / node-dot mechanism in §2.1, the morph in §3 step 2 and all of §3.1, and the
> `--ms-stroke` ramp in §3.2's execution note. **Everything else in §2, §2.1, §3 and §3.2 stands** —
> the single-source-of-truth rule, the 17px floor as a number, the monochrome rule, the 592 × 320
> viewBox, the merge at dead centre, the contraction point `(296, 288)` and the two-sided handoff.
>
> The original text is kept below because its *reasoning* still governs: whatever the mark is made of,
> it has to belong to the site's visual system rather than be a fourth unrelated style.

**Direction (SUPERSEDED — see above): circuit / trace.** M and S built from thin connected line
segments with small node-dots at the joints, echoing the particle-network background already built.
Chosen over a geometric/faceted or blocky LED mark specifically so the logo belongs to the site's
existing visual system rather than being a fourth unrelated style.

**Single source of truth.** Designed **once**. Every appearance — mid-merge in the Intro, the
contraction/expansion point, the static navbar version, the About page — is the same artifact at a
different scale or state, never separately hand-matched assets. **If the implementation cannot
literally reuse one component across all these states, that is a build smell to raise, not to route
around silently.**

**Colour.** Monochrome throughout the Intro's merge. No gradient or fill animation concurrent with
shape animation. Any colour on the resting state (navbar, About) is a separate static treatment
applied after the shape has settled.

### 2.1 The 17px floor — promoted from the design brief, because it binds more than one ticket

**The mark's minimum legible rendered height is 17px, and that is a pass/fail, not a preference.**

**THE NUMBER HAS NOW BEEN DERIVED THREE TIMES FROM THREE DIFFERENT FEATURES, AND HAS BEEN 17px EVERY
TIME.** That is worth saying plainly, because a constant whose justification keeps evaporating while
its value holds is exactly the thing a later reader "corrects".

| Derivation | Binding feature | Arithmetic floor | Status |
|---|---|---|---|
| Trace mark | node-dot clearance across the 112-unit letter gap | 16.4px | dead — no dots |
| Three-bar faceted M | that M's 40-unit bar gap | 16.0px | dead — no bars |
| **Live** | **the S's 44-unit gap between its horizontal bars** | **14.5px** | **current** |

Keeping ~2px of air in the S's 44-unit gap needs `44 / 2 = 22` units per pixel, i.e. an arithmetic
floor of **14.5px**. 17px gives **2.34px** of air — about 17% of margin for antialiasing — so the
shipped floor stays where it has always been. `msMarkGeometry.ts`'s `MIN_HEIGHT_PX` is the owner and
carries the same table.

> **CORRECTED 2026-08-22.** This paragraph read *"the M's S's 44-unit bar gap"* — a botched edit — and
> then did the arithmetic with **40**, the retired `M_BAR_GAP`, to reach 16.0px. It also said *"the
> three bars start to fuse and the M reads as a block"*; **the M has not been three bars since the
> faceted rebuild and has no bar gaps at all.** `Navbar.tsx` carried the same dead derivation verbatim
> and was corrected in the same commit. The practical cost was real: Phase 5 renders the mark as the
> footer stamp, and would have refused a size the true floor permits.

**Anything that renders the mark smaller than 17px is a design change, not a layout tweak** — the
navbar, the About page, the reveal-footer stamp, and any future favicon or OG usage. Raise it rather
than shrinking the mark.

**How the mark survives that scale at all — it is filled.** At 17px the bars are **2.98px** wide, so
ink is no longer anywhere near the ~1.25px floor at which a stroke goes entirely to antialiasing; air
is what runs out first, which is why the floor is now derived from a gap rather than from a weight.

`vector-effect="non-scaling-stroke"`, the round-capped node dots and the `--ms-stroke` custom property
are all **retired with the trace mark** — nothing in `MonogramMark.tsx` is stroked. What that restores
is `MonogramMark.tsx`'s original objection, in its original form: **outlined letterforms do not
survive this reduction; filled ones do.** It still binds for anything authored in **user units** — a
rim, a hairline or a dot radius specified in viewBox units is ~0.05× on screen at nav size. The mark's
answer is not to have one.

### 2.2 The viewBox is unified at 592 × 320 — and one mirrored constant must move with it

`MonogramMark.tsx:34` states that "identical viewBox proportions" is the actual "same mark" claim.
**The shipped code contradicts it four lines below**: `VB_W = { intro: 560, nav: 420 }` against a
shared `VB_H = 320` — 1.75:1 versus 1.31:1. The claim is simply false today. Seventh instance of this
class on the project.

The mark unifies at **592 × 320 for every variant**, which makes that header claim true for the first
time.

> **`Intro.tsx:98` mirrors `MARK_VB_W = 560`, with its own comment reading "MIRRORED FROM
> `MonogramMark.tsx` AND ONLY VALID WHILE THEY MATCH."** The Intro uses it to align SVG glyphs onto DOM
> letters. **It must change in the same commit as the viewBox**, or the alignment drifts silently — the
> exact failure its comment predicts.

---

## 3. Intro

> ### ⛔ SUPERSEDED 2026-08-22 — the merge-to-a-point sequence was built, shipped, found broken in practice, and REVERTED.
>
> **What this section used to specify**, and what the code actually shipped: the name's two capitals
> *travelled and grew* into the mark's positions while the other ten glyphs collapsed and faded, the
> formed mark then *contracted to a point* at `(296, 288)`, and the hero *expanded out of that point*.
> Step 5 said in as many words that this **"replaces the scale-17 zoom entirely"**. **That is now
> reversed.** The seven-phase sequence below — hold, drop, slide, morph, zoom-out, breath, zoom-in — is
> what ships, and the `scale: 17` zoom-in is the transition again.
>
> **Why it was reverted, from capture rather than from taste.** The merge puts two type scales on
> screen at the same time and they collide. At 250ms the name renders correctly as "Muhammad Saad" at
> text scale. By 500ms the M and S have reached full mark scale **while "uhammad" and "aad" are still
> at text scale**, so the two capitals sit on top of the small letters as an overlapping mess. The
> "becoming" never becomes anything. Saad's call: *"the intro is still fucked up so move it back to
> what it was originally — the name merged into MS and then it zooms in to the hero section."*
>
> **The structural property the old sequence has and the merge lost**, which is the actual lesson and
> is binding on anything that replaces this later: the non-initials **leave first**, the survivors
> **then** move at a constant scale, and the scale change is deferred until the only things on screen
> are two letterforms occupying the same box. **There is never more than one type scale on screen.**
> Any future mechanic that grows one glyph while another is still at name scale reproduces this bug.
>
> **Nothing is lost and the reasoning below is not deleted.** The merge-to-point implementation is
> preserved on branch **`intro-merge-to-point-backup`** and tag **`intro-plan-a`**, and its per-phase
> timing brief is `.claude/handoff/intro-timing-design.md` (marked superseded at the top). The mark
> itself is **not** reverted — §2's faceted geometry stays exactly as it is, and the restored sequence
> drives it.

**Trigger — fixed.** Plays on **actual document load or browser refresh only**. Not gated on
asset-load speed. Not skipped by a "seen this session" flag. Client-side route navigation back to Home
from About/Work does **not** replay it. Any existing logic tying Intro visibility to the Loader
resolving, or to a visited flag, is **removed, not tuned**.

> ### ✅ D7 RESOLVED 2026-08-21 — the Loader SURVIVES. Only the coupling goes.
>
> "Not gated on asset-load speed" above means **the Intro's timeline is not driven by progress**. It
> does not mean `AssetLoader` is deleted. `docs/06` §1 already draws this line: *"By the time it plays,
> the Loader has already guaranteed everything it measures against is in. Its timings are entirely
> about feel."* What is removed is the **visited flag** and any logic that lets asset progress shape
> the Intro's *behaviour* — not the readiness gate itself.
>
> **The reason is load-bearing, so it is recorded precisely.** The Loader stays because `docs/06` §1
> scopes it to *"the two webfonts, at the two weights used above the fold. Nothing else."* The hero
> tagline (Space Grotesk, `text-h4`) and the navbar (JetBrains Mono, `text-caption`) are above the fold
> and need those faces **whatever the mark does**.
>
> **Do NOT record "the morph needs Space Grotesk outlines" as the reason.** It is true today and it
> dissolves the moment §3.1's outlines are pre-extracted — after which someone reads that
> justification, observes it no longer holds, and deletes the Loader, taking the tagline's FOUT
> protection with it. That is a conclusion-right / reason-wrong comment, the class this project has
> shipped six of.

### 3.2 The mark's anchor is `(296, 288)`, and the mark is POSITIONED BY IT

Promoted from the design brief because it constrains layout, not just motion.

> **RENAMED 2026-08-22.** This was "the contraction point", and the constants were `CONTRACT_X` /
> `CONTRACT_Y`. The contraction is gone (see §3's superseded banner) but the point survived it,
> because the point was never really about the contraction — the name was. It is now `ANCHOR_X` /
> `ANCHOR_Y` in `components/ui/msMarkGeometry.ts`.

**It wears three hats, and all three are live.**

1. **Composition.** The Intro's mark is positioned so *this point* sits at dead viewport centre —
   **not its bounding box.** The box centre therefore sits ~193px above viewport centre, and the mark
   hangs upper-middle with its baseline running through the centre of the screen. The name has the
   identical requirement, and gets it for free by being drawn on the same baseline in the same
   viewBox.
2. **The text→mark scale.** The settled mark is rendered at `NAME_SCALE` **about this point**, so it
   appears at exactly the cap height of the name it replaces. `x = 296` is the mark's own **ink**
   centre — the M runs 32→280 and the S 344→560 — which is what keeps the pair optically centred at
   any scale and lets the crossfade be a swap in place rather than a dissolve between two sizes.
3. **The camera's fixed point.** The zoom-out and the zoom-in both pivot here, so the move pushes into
   dead viewport centre — which is the pixel `Hero.tsx` expands out of.

`x = 296` also falls inside the 64-unit letter gap, so anything that collapses here drains into the
mark's own seam.

> **RECORDED, NOT DELETED — why the baseline and not the bbox centre.** The original argument was
> about the contraction: collapsing toward `(296, 160)` makes the mark cross itself, because the M's
> outer stems travel in opposite vertical directions and the left stem passes through itself for
> roughly 150ms — a scribble at exactly the beat that is supposed to read as deliberate. That
> particular hazard died with the contraction. The conclusion did not, for hats 1 and 3 above, and the
> argument is kept here so that anyone who reintroduces a collapse knows why the box centre is wrong.

> **ALSO RECORDED — the `--ms-stroke` ramp.** A stroked mark needed a *simultaneous weight ramp*
> whenever it changed scale, because `non-scaling-stroke` holds weight constant in device pixels while
> the geometry shrinks inside it, so the mark thickened into a blob. **Filled shapes scale their own
> ink, so the ramp is deleted, not retuned.** This matters again now: the restored sequence scales the
> mark twice (to `NAME_SCALE`, then by the camera) and neither needs a correction.

### 3.1 Glyph outlines are pre-extracted at build time — a funded step, not an assumption

> **AMENDED 2026-08-21 with the faceted mark. THE OUTLINES STAY; THE MORPH DOES NOT.**
>
> **`MorphSVGPlugin` is no longer registered** (`lib/animation/gsap.ts`). It had exactly one consumer,
> the glyph-to-trace morph, and filled shapes do not interpolate into each other — the merge is a
> convergence plus a crossfade now. Checked before removal: no `morphSVG` tween exists anywhere, and
> the project-card transition is Framer Motion's shared layout, not GSAP.
>
> **Everything else in this section still holds, for a different reason.** The name is still rendered
> from pre-extracted Space Grotesk outlines (`components/ui/msMarkGlyphs.ts`) rather than DOM `<text>`,
> and `opentype.js` still never reaches the browser. The reason is no longer "MorphSVG cannot consume
> `<text>`" — it is that outlines put the name and the mark in **one coordinate system**, so both
> halves of every phase are stated in the same units and there is nothing to measure at runtime. That
> is what keeps a `TextMetrics` baseline probe out of the file. Rendering the name as DOM text would
> put it back.
>
> **AMENDED AGAIN 2026-08-22, when the merge was reverted.** The specific claim above used to be *"each
> capital's journey is a tween to the identity transform and it lands on its faceted letter exactly"*.
> That was the merge's mechanic and it is gone. The one coordinate system now buys two different
> things, and they are worth more than the one it replaced:
>
>   - **The slide is arithmetic instead of a measured FLIP.** The original DOM Intro collapsed the
>     non-initial `<span>`s to `display: none`, let the flex row reflow, and read the survivors' new
>     rects back out. There is no layout inside an SVG to reflow, so `SLIDE_X` computes the same two
>     facts — the pair set solid on the font's own advances, and re-centred in the box — from the same
>     font metrics. A font swap still moves it.
>   - **The crossfade is a swap in place.** The parked pair is advance-centred on `VB_W / 2`, which is
>     `ANCHOR_X`, which is where the settled mark's ink is centred, and both are rendered at
>     `NAME_SCALE`. Same cap height, same centre, no correction term.

`gsap/MorphSVGPlugin.js` is present and is the unrestricted 3.15.0 build (verified: zero trial, Club
or license-key strings). Its headline capability — interpolating paths with mismatched point and
subpath counts — was exactly the old step 2's problem, which made the morph a tooling question rather
than a research one.

**But MorphSVG morphs `path` → `path`, and the Intro's source is `<text>`.** `convertToPath()` handles
`rect` / `circle` / `ellipse` / `line` / `polygon` / `polyline` — **not `text`** (verified against the
shipped plugin). Something must produce outline path data for the letterforms, and that step was
missing from the phase list.

- **Pre-extract the Space Grotesk outlines at build time**, into the same geometry module that holds
  the mark's own geometry. One dataset then holds both halves of the merge, which is what D9's "one
  asset, reused everywhere" actually buys.
- **Do not add `opentype.js` at runtime.** That puts a new dependency on the first-paint path to solve
  a problem with a static answer.
- **Step 1 renders those outlines, not DOM `<text>`** — see the amendment above for the reason, which
  has changed even though the instruction has not.
- Plugin registration, if one is ever needed again, goes through `lib/animation/gsap.ts` and nowhere
  else. That module exists because an unregistered plugin fails **silently in production**.

**Sequence — seven phases, restored 2026-08-22.** The per-phase table with eases lives in
`docs/06_INTRO_AND_CHROME.md` §2; the constants live in `components/intro/Intro.tsx`, which is where
they are tuned. This is the shape, not the tuning.

1. **HOLD.** Full name "Muhammad Saad" appears as filled glyph outlines and is *held still*, long
   enough to read as a name rather than as a flash.
2. **DROP.** The ten non-initials shrink and fade, staggered left to right. Only M and S are left
   standing. **They leave before anything else moves** — that ordering is the whole point of this
   sequence and is the property the reverted merge lost.
3. **SLIDE.** The two survivors close up into a solid "MS" and re-centre. **Scale is untouched here.**
4. **MORPH.** Text becomes mark: the letterforms crossfade into the faceted monogram **at the same cap
   height, on the same centre**. It overlaps the tail of the slide, so the material changes while the
   letters are still closing rather than after they have parked.
   > **The crossfade is still a crossfade, and "a becoming, not a crossfade" is still reversed.** That
   > rule was written for a stroked mark, where a morph was available. A filled mark cannot morph from
   > a letterform without path interpolation nobody needs, and
   > `.claude/handoff/ms-mark-faceted-design.md` §8 states the requirement as *simpler and more robust,
   > not more clever*. What makes it honest rather than a cover-up is that both halves occupy the same
   > box at the same instant — see §3.1.
5. **ZOOM OUT.** A small backing-off of the whole stage. A settling beat, not a second move.
6. **BREATH.** Nothing happens. That is the phase — it is what makes the zoom-in read as a decision.
7. **ZOOM IN.** `scale: 17`, accelerating past the viewport and into the Hero. **The zoom-in IS the
   transition**, not a step that happens before one: the plate never cuts, it dissolves over the back
   two-thirds of the move while the hero arrives underneath.
   - **Simultaneously with the start of step 7**, the navbar slides down (§1) and `Hero` begins its
     arrival. **One beat means ONE START INSTANT, not one duration** — the bar slides in 0.45s
     (`HANDOFF_S` in `lib/animation/handoff.ts`) while the hero settles over 1.6s (`ARRIVAL_S` in
     `Hero.tsx`), because the incoming half of a handoff has to outlast the outgoing one or the seam
     reads as a cut.
     > **This line said "one beat, one shared duration (`HANDOFF_S`)" until 2026-08-22.** That was
     > true of the reverted merge, where the hero bloomed out of a dot in the same 0.45s. When the
     > zoom-in was restored, `Hero.tsx` stopped importing `HANDOFF_S` and said so in capitals; four
     > code comments and this spec line kept asserting the shared duration. A reader acting on this
     > line alone would re-share them and silently reintroduce the early-settle bug.

**Timing.** Total **3.17s**, measured plate-mount to plate-unmount. The `~2.2–2.6s` budget this
section used to set belonged to the reverted merge and does not apply: the zoom-out and the breath are
back, and they cost 0.82s between them. The zoom-in is held at **0.95s**, which is the weight it has
always had.

**THE SEAM IS CLOSED. Both halves now describe the same move** — decided and shipped in `8875803`,
one commit after the revert.

`Hero.tsx` briefly carried the merge's arrival (`scale 0 → 1` over `HANDOFF_S`, 0.45s) because that
expanded out of a *point*. Against a 0.95s zoom-in the hero settled ~0.42s before the plate finished
dissolving, so the camera flew over a surface that had already arrived. Nothing looked broken, which
is why it needed measuring rather than watching.

Restored to `f640107` verbatim: **`scale 1.12 → 1` over 1.6s.** The rule is the one `Hero.tsx` already
stated and lost along with the camera it was written for — the incoming half of a handoff must OUTLAST
the outgoing one, or the seam becomes a cut. 1.6s against 0.95s is that margin, and 1.12 rather than 0
because a camera moving forward hands off to a surface slightly too close that eases back to rest.

**What the three components share is the START INSTANT, not the duration**, and `lib/animation/handoff.ts`
records that from its side. The navbar slides in 0.45s and the hero settles over 1.6s; both begin on
the same frame — measured 2205ms each. "One coordinated beat" is simultaneity of onset, not of length.

**Reduced motion.** Collapses to something minimal — a quick fade to the settled mark plus an instant
hero reveal — rather than the full choreography at a different speed. See §8.

---

## 4. Hero (Command Sphere)

Unchanged. See `.claude/handoff/hero-sphere-design.md`. Referenced only because it shares the hero area
with the Intro's handoff point.

---

## 5. Home Page Structure

**Scroll-scrub scope — confirmed narrow.** Scroll-scrubbed / pinned animation applies to the **Home
page only.** About and Work are normal scroll: no pinning, no scrubbing. This was an open question and
is now closed.

**Trajectory:** `foundation → systems → directions`, then 3 featured projects, then the reveal-footer.

**Stack section — REVISED 2026-08-21. The four-category logo grid is RETIRED, not a fallback.**
`content/skills.ts` rules it out directly and its header comments are binding.

- **Three fixed groups, in this exact order, never re-sorted:** `Core Dev → Systems Foundation →
  Currently Building Toward`. The file states this order *is* the section's argument
  (proof → depth → direction). No merging, hiding or reordering for layout convenience.
- **Two card variants, not one:**
  - **Logo cards** (Core Dev) — icon + name, no note. Declaration order is meaningful (leftmost =
    strongest) and must be preserved, never shuffled for visual balance.
  - **Name + note cards** (Systems Foundation) — these are university **course names**, not tools, and
    there is no logo for a course. Each card shows the name **and** its `note`. The file explicitly
    forbids rendering the name without the note: a bare course name is an unexplained claim.
  - Both share one sizing / spacing / motion language so the section still reads as one system.
- **"Currently Building Toward" is deliberately empty** and must not be padded. It needs a real
  empty-state design — e.g. a dashed/outline placeholder with a short line signalling "reserved, not
  missing" — rather than being hidden. It is meant to visibly fill in over time.
- No ratings, no percentage bars, no proficiency labels.

> ### Three resolutions from the Stack design pass — recorded here because they bind Phase 3 onward
>
> **1. "Card" in this section means an ENTRY TREATMENT, not a bordered box.** §5 above says "two card
> variants"; `SkillGroupRenderers.tsx` says *"a bordered rectangle is a CARD, and the card affordance
> belongs to Ticket 6's"* project gallery. Those flatly contradict each other and the code is right.
> **Neither Stack variant is a bordered rectangle.** They are two entry layouts sharing one left edge,
> one first-line band, one inter-entry rhythm and one subordination rule (`text-fg` primary,
> `text-fg/70` subordinate). Read "variant", not "card", everywhere in §5.
>
> **2. Skills is Tier 3, not "Tier 2/3".** `Skills.tsx:15` says "Tier 2/3"; `docs/03`'s motion section
> lists Skills under Tier 3. Tier 3 governs. This is not pedantry — **"Tier 2" would license hover
> states and stagger on a logo grid**, which is exactly the generic treatment this section has twice
> been designed away from. Correct the source comment when Phase 3 rewrites the file.
>
> **3. The empty state is ONE device: the line, not a dashed box.** The section already speaks on three
> non-overlapping channels — the computed `00` states *quantity*, the line states *intent*, the 55px
> `min-h` states *space held*. A dashed rectangle would state **absence**, which is the one fact the
> group label already supplies. Decisive reason: it is the only part of the treatment that cannot
> survive the first entry — everything else transitions with zero edits, while a dashed box around one
> real cert becomes a card and must be hand-deleted at the moment nobody is thinking about CSS.
>
> Final copy, Saad's, not to be reworded to fit a layout: **"Reserved. This is the group that grows."**
> A `<p>` sibling of the `<dl>` at `text-body text-fg/70` — body scale because it is a full thought with
> two full stops, and `/70` so the emptiest group does not carry the loudest prose in the section.
- Whether Stack sits inside or immediately after the "systems" beat is still open.

*(Per-category logo list remains a content TODO — build with an optional `logo?` field and a name-chip
fallback so implementation never blocks on it.)*

**Projects — LOCKED: Aero-Grid, ClashChat, FOLIO.** The most polished and actually-deployed of the
five; CCN and SNA are not featured on Home. 3 featured, scroll-scrubbed, on Home; the full archive (all
five) lives on Work.

> **Display order is `content/projects.ts` array order**, which is deliberately strength-first and not
> date order: FOLIO → Aero-Grid → ClashChat. The spec lists them in a different order; unless Saad says
> otherwise that is prose, not a re-sort instruction, and the file's "no `featured`/`order` field" rule
> still stands.

**Experience.** Does **not** appear on Home. Lives on Work alongside the full project list — both are
"the complete record", kept together in the quiet readable tier rather than the curated Home narrative.

**Currently Learning — RESOLVED: the Work page, after Experience.** The only placement that costs
nothing today (renders nothing while its array is empty) and stays correct once entries land. About is
a single non-scrolling screen with no room; the reveal-footer's height must stay fixed for its
ScrollTrigger maths.

**Reveal footer (curtain).** **Home and Work only — not About.** The footer sits fixed beneath the page
at a lower z-index; the last section's content wipes up off it as the user scrolls past, so it reads as
having been there behind the screens the whole time. Content reuses existing elements: email (same
click-to-copy as the navbar), LinkedIn, the MS mark, and a stamp/signature detail (mark + year).

> **~~Implementation flag.~~ AMENDED 2026-08-22, after the footer shipped.** The flag read: *"If
> Home's scroll-scrub sections use GSAP ScrollTrigger, the negative-margin curtain technique conflicts
> with ScrollTrigger's height calculations unless sequenced last and followed by
> `ScrollTrigger.refresh()`."* That is **correct about negative margins, and the shipped mechanic does
> not use one.**
>
> **The negative-margin technique is rejected. The shipped mechanic is `position: sticky; bottom: 0`
> on the `<footer>`, with an opaque `relative z-10 bg-base` page stack above it.** A sticky element
> keeps its full normal flow box, so `document.scrollHeight` is unchanged — **measured Δ = 0px across
> both routes, five viewports and both themes** — and **no `ScrollTrigger.refresh()` is required.**
> Do not add one "to be safe": with no geometry change to refresh against it recomputes all nine
> triggers and can visibly re-snap a scrubbed section if it lands mid-scroll. Someone reading only
> this paragraph would have added it in good faith, which is why the flag is corrected rather than
> just satisfied. **Rule S-6 in `docs/03_FRONTEND_SPEC.md` is the full, binding statement.**
>
> **"Build this last" still stands**, for a different reason than the one originally given: the page
> stack's background and z-index touch both routes.
>
> **The click-to-copy email is delivered, and the objection to it was retired rather than overruled.**
> `components/sections/Contact.tsx` had banned a copy control because it would be inert until
> hydration and dead forever with JS blocked. `CopyEmailButton` now takes an optional `href` and
> renders a working `mailto:` anchor until it hydrates, so there is no dead control at any point. The
> navbar adopted the same fallback in the same commit.

---

## 6. About Page

**First-person paragraph — FINAL, approved 2026-08-21. Phase 4's merge gate is CLOSED.**
65 words. "Small yet complete", per the Vlad / Aspect Health bio reference.

> I'm Muhammad Saad, a final-year IT student who ships full-stack products end-to-end — routing
> engines, real-time sync, reactive interfaces that solve real problems. I'm now moving deliberately
> into cloud infrastructure, networking, and security — recently rotating exposed credentials and
> rebuilding the API layer behind a secured proxy on one of my own production apps. Not a security
> engineer yet — methodically building toward being one.

**Both open questions are decided, and the reasoning is recorded so neither is reopened:**

- **C2 — "real hardening work" now names something real.** It points at the ClashChat security pass:
  Firebase key rotation and the Cloudflare Worker proxy that keeps the Groq API key server-side.
  **Both halves are verifiable in this repo**, which is what the no-unverifiable-claims rule requires:
  `content/projects.ts:150` documents the proxy ("Groq API calls route through a privately-hosted
  Cloudflare Worker proxy so the API key never touches the client"), and
  `docs/05_GIT_SECURITY_CHECKLIST.md:35` records the key incident and its remediation.

- **C1 — the coursework framing is deliberately ABSENT, not missing.** The VLAN / ACL / Windows Server
  detail lives in the Stack section's Systems Foundation cards, where `skills.ts` requires each course
  name to carry its concept note. Repeating it in a 65-word bio would duplicate that proof rather than
  reinforce it, and would spend a quarter of the bio on the part of the story the site already
  evidences twice. The bio carries the **pivot**; the Stack carries the **proof**.

  > **Do not "fix" this by adding a coursework qualifier.** The earlier draft named the coursework
  > without saying it was academic, which risked reading as professional experience — that was the real
  > problem, and removing the claim solves it more cleanly than qualifying it. The closing line
  > ("Not a security engineer yet") carries the honesty the qualifier was there to supply.

**Single screen, not scrollable.** Photo + the paragraph above, plus an action row:

`[View CV]   [GitHub]   [LinkedIn]`

- **View CV** — primary, filled, visually heavier. Opens a modal rendering
  `public/resume/Muhammad_Saad_CV.pdf` inline, with a **Download** button pinned at the top of the
  modal using the `download` attribute — an actual file save, distinct from the view action that opened
  it. Esc closes, backdrop click closes, focus trapped while open.
  - **Mobile exception:** inline PDF rendering is unreliable on mobile (iOS Safari commonly forces a
    download instead of displaying). On mobile this button skips the modal and opens the PDF in a new
    tab.
- **GitHub** — secondary/outline, smaller. Main profile, not a repo.
- **LinkedIn** — secondary/outline, smaller. Duplicating the navbar link is **intentional** — the navbar
  is an always-available ambient link, the About row is a recommended next step.

**Visual uniformity, all four confirmed:** a dimmed version of the same particle-network background
(not the command sphere, which stays Home-only); the same teal/cyan accent on hover, links and button
accents with no new palette; the same monospace touches for small labels; and the finished **static**
MS mark placed on the page — static only, no animation. About stays the quiet page.

> **"Static only, no animation" governs THE MARK, and it still holds — narrowed rather than
> reversed, 2026-08-22.** The mark does not draw on, does not morph, does not part its letters on
> hover (that gesture is navbar-only), and does not animate again after the page has arrived. What it
> now does is fade and rise 13px on load, exactly as the paragraph beside it does. The sentence was
> written to stop the Intro's *choreography* reappearing on About, not to exempt one element from the
> page's arrival — an unmoving mark above three units that assemble would read as a bug, not as
> restraint. Recorded narrowly so the next reader does not have to re-litigate it, and so nobody
> "restores" the rule by removing the mark from the entrance.

**Neither scroll-scrub nor the reveal-footer applies to About.** It is deliberately the one fully quiet
page.

> **What "fully quiet" means, stated precisely — amended 2026-08-22.** It was written against
> **scroll-driven** motion and that half is absolute: no scrub, no pinning, no reveal footer, no
> curtain, nothing below the fold, and the page still cannot scroll. What it does NOT mean is that
> the page must be complete in frame 1. `/about` now runs the site's standard `Reveal` once, on load,
> across four units — the mark's row, the paragraph, the action row, the portrait — at
> `STAGGER.line` multiples of 0 / 0.10 / 0.20 / 0.30s, settling at 1.00s, after which nothing on the
> page ever moves again except the particle field.
>
> The premise being replaced is that *quiet means static*. It does not: quiet is a claim about
> amplitude and about what drives the motion. A page that assembles in zero frames while every other
> route on the site fades in is not quieter than its neighbours, it is **discontinuous** with them,
> and that reads as unfinished rather than as calm. The defensible and checkable version:
> **`/about` is quiet because it has no motion driver of its own.** No new curve, no new duration and
> no new colour are introduced — it is `EASE.reveal` with `DURATION.reveal`, fired by a mount instead
> of by an intersection or a scroll position.

---

## 7. Mobile Behaviour

**Home's scroll-scrub becomes Intersection Observer fade/slide-in.** No pinned or scrubbed scrolling on
mobile. Sections animate in as they enter the viewport — more reliable, and it avoids the touch-scroll
plus scroll-jacking failure mode.

**About's CV button** opens the PDF in a new tab directly, skipping the modal (§6).

**Command sphere on mobile:** per the sphere design — 44 fragments, no glow, no cursor interaction.

---

## 8. Cross-Cutting Rules

- **`prefers-reduced-motion` must be respected by all three motion systems**: the Intro (§3), the
  command sphere, and Home's scroll-scrub (§5). Stated once here rather than re-derived per feature.
- **The MS mark is one component, reused everywhere** — Intro, navbar, About.
- **`docs/03` must be updated** for the navbar's full-bleed reversal of Rule S-1, and the navbar's code
  comment must match it.

---

## 9. Conflicts with what is currently built — recorded 2026-08-21, before planning

Verified against the repo, not assumed. **These are not objections to the spec; they are things the
spec does not yet say, and someone has to decide them.**

### 9.1 ~~There are no `/about` or `/work` routes~~ — RESOLVED. Both ship.

> **Marked resolved 2026-08-22, in the style of §9.2 and §9.3.** `/work` shipped in Phase 2 and
> `/about` in Phase 4; the navbar's entries are route links, not section anchors. **Everything below
> is preserved as the pre-planning snapshot it was recorded as** — it is written in the present
> tense about 2026-08-21 and must be read that way, not as a description of the site.

`find app -name page.tsx` returns exactly three: `app/(site)/page.tsx`, `app/(site)/projects/[slug]/page.tsx`,
and the modal intercept. **About and Work do not exist as pages.** Home currently renders `Hero`,
`About`, `Skills`, `Projects`, `Experience`, `CurrentlyLearning` and `Contact` as sections of one page.

Consequences the spec should absorb explicitly:
- The navbar's ABOUT and WORK entries are **section anchors** today (`navContent.ts` documents the
  hrefs as "section ids, verified against the sections that own them"). They become route links.
- `docs/01_PRD.md` and `docs/04_FEATURE_TICKETS.md` describe a one-page site. Both will disagree with
  the built site until amended.
- Ticket 6b's intercepting-route modal opens project detail over **Home's** gallery. If the full
  archive moves to Work, that intercept's parent changes.

### 9.2 ~~Currently Learning has no home~~ — RESOLVED 2026-08-21: Work page, after Experience. See §5.

<details><summary>Original finding, kept for the reasoning</summary>

The spec places Experience on Work and folds Contact into the reveal-footer, but never mentions
`CurrentlyLearning`. It is Ticket 9, it renders from `content/currentlyLearning.ts`, and CLAUDE.md
calls it "the living part of the site" — the visible-trajectory piece. **Deleting it by omission would
remove the mechanism the positioning depends on.** Needs an explicit destination: Work, About, the
footer, or deliberately retired.

</details>

### 9.3 ~~"Security Tooling" conflicts with the positioning rule~~ — RESOLVED 2026-08-21.

The four-category grid is retired; §5 now specifies three groups from `content/skills.ts` with two card
types. **A second conflict surfaced during planning and is folded into that answer:** `skills.ts`
states *"Ticket 5 must never render the name without the note — a bare course name is an unexplained
claim."* Systems Foundation entries are course names, so a pure logo-card treatment could never have
carried that group under **any** of the three options originally offered.

<details><summary>Original finding, kept for the reasoning</summary>

`content/skills.ts` ships three groups — Core Dev, Systems Foundation, **Currently Building Toward with
zero entries, deliberately.** CLAUDE.md is explicit that the empty group is the honest state and must
not be padded, and that the site must not claim expertise not yet held.

The spec's four Stack categories drop **Systems Foundation** (the coursework framing that makes the CCN
and SNA work legible as academic rather than professional) and add **Security Tooling** as a populated
logo group. A row of security-tool logos asserts working familiarity with those tools. Per CLAUDE.md
that is the one claim this site must not make yet.

Three coherent resolutions, and Saad picks:
1. Keep the four categories but let **Cloud & DevOps** and **Security Tooling** carry only tools he has
   genuinely touched — accepting they may be sparse, which is the same honest-sparse treatment Skills
   already ships.
2. Rename the fourth category to something forward-looking that does not assert current use.
3. Keep three categories, mapping to the existing `skills.ts` groups, and treat the four-way split as
   superseded.

**Whatever is chosen, `content/skills.ts` is the source of truth and changes with it** — the grouping
lives in data, not in the component.

</details>

---

### 9.4 The "light-mode Hero" prerequisite does not hold. Verified 2026-08-21.

§1 attaches a blocking prerequisite to the theme toggle: that the Hero "does not currently have a
working light-theme treatment", and that re-adding the toggle would show "a broken or unstyled Hero in
light mode."

**The gap it describes is real; the prerequisite is not.** The toggle genuinely renders only on
project-detail and error pages today, so the desktop coverage problem stands and the toggle should
return. But the Hero is not missing a light theme — **it deliberately refuses one.**
`app/globals.css:320-324`:

> `--accent-hero` is deliberately NOT overridden … Neither are `--color-hero-surface`,
> `--color-hero-fg` or `--color-hero-accent`: **the hero is a pinned dark context in both themes.
> Their absence here is the whole point, so do not "complete the set" by adding light values.**

Line 138 adds: *"TICKET 11: all THREE are theme-exempt, not just the surface. A toggle that flips two
of three is worse than one that flips none."* `html` itself is pinned to `--color-hero-surface`.

**Clicking the toggle in light mode therefore does not break the Hero — it produces the same dark
plate, which is the designed behaviour.** The hard `hero-surface → base` colour edge at the Hero/About
boundary is that decision showing its work, not a bug.

**Consequence for sequencing: the theme toggle is NOT blocked on any Hero design work and can ship in
the navbar phase.** Treating a full light-mode scene as a prerequisite gates a small, severable change
behind a large one that may not be wanted at all.

**If the dark plate in light mode is genuinely disliked**, a costed ladder already exists in
`.claude/handoff/ticket-3-design.md` §11.8, cheapest first:

1. Ship the closing bookend and look again — free; it may resolve on its own.
2. Shorten the Hero in light mode only (e.g. `88dvh`) so a band of `#FDFCFA` shows beneath it — reads
   as "a plate on a page" instead of "the page went dark". Cheap.
3. Inset the panel in light mode — needs a radius token, which `globals.css` deliberately ships none
   of. Requires Saad's explicit sign-off.
4. A full light-mode scene variant — **explicitly not recommended** there, and it is what §1's
   prerequisite implicitly asks for.

Walk that ladder from the top, and only if Saad actually objects to the current behaviour.
