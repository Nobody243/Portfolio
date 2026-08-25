# Master Spec — Projects Architecture (Work Page Redesign, /projects, Detail Navigation, Mobile)

> **Status:** received 2026-08-25. Saved here verbatim as the governing brief.
> **This file is a living record.** Update it in place as decisions get made during
> implementation — it should end the project as an accurate record of what was actually
> built, not just what was originally planned. Sections added during the build are marked
> with a `▸ DECIDED` heading and a date.

Use all four subagents (planner, designer, implementer, reviewer) for every phase below.
This is a large, multi-part change — sequence it properly, don't shortcut to a single pass.
Nothing in this document is optional scope; if something below turns out to be infeasible as
written, that's a flag-and-ask situation, not a silent drop.

---

## 0. Architecture — decide before building (Planner)

### 0.1 Routes

- `/work` — existing route, restructured (see §1).
- `/projects` — **new route.** Full page with its own header (not a
  modal/overlay), independently reachable by direct URL, refreshable
  (plays the Intro on load like every other route per the existing
  refresh/routing rules), horizontal strip-list layout (see §3).
- `/projects/[slug]` — existing detail pages, gets new chrome (see §4).

### 0.2 Data model — `content/projects.ts`

Confirm/add explicit fields per project for:
- GitHub repo URL (nullable — not every project has one)
- Live site URL (nullable — not every project has one)

Do not hardcode button visibility in components — derive it from these
fields. Verify accuracy for all 5 current projects (FOLIO, Aero-Grid,
ClashChat, Multi-Floor Call Center Network Design, and the fifth
project) individually before shipping — wrong/missing links on a
portfolio is a real credibility issue.

### 0.3 Close-behavior tracking (the hard technical problem — solve this properly)

A detail page (`/projects/[slug]`) can be entered from **three
different places**, and its Close button must return to a **different
destination depending on which one**:

| Entered from | Close returns to |
|---|---|
| Fanned deck on `/work` | The fanned deck (`/work`) |
| Home's featured-projects section | Home's project section |
| `/projects` strip list | `/projects` |

This means `/projects/[slug]` alone (just the pathname) is not enough
information to know where Close should go — entry context has to be
tracked somehow (e.g. a query param, router state, or a small
client-side "last entry point" mechanism). **Planner: decide the
concrete mechanism and document it here before Implementer builds
against it** — don't leave this to be improvised mid-build.

Separately, and NOT context-dependent: **`/projects` itself has its own
Close button that always goes to `/work`**, regardless of whether the
visitor reached `/projects` from Home or from Work. This is a fixed
destination, intentionally asymmetric with the detail-page behavior
above — implement it as such, not as "return to referrer."

The breadcrumb "Projects / [project name]" on detail pages is separate
from Close: "Projects" always routes to `/projects` (the list),
regardless of entry context. Both segments of the breadcrumb are
clickable.

### 0.4 Navbar active state

`WORK` shows as active (underline present) on `/work`, `/projects`, and
every `/projects/[slug]` page — even though the latter two aren't
literally under `/work`'s URL path. Confirm the navbar's active-route
logic is updated to treat these three route patterns as one group,
rather than relying on exact pathname matching.

---

## 1. `/work` page restructure

- Page `<h1>` changes from "Work" to **"Projects."** Navbar label stays
  `WORK` — this is a heading-only change, not a route/nav rename.
- Section order, top to bottom:
  1. Fanned card deck (§2) — featured projects, 3–5 depending on fit
     (5 preferred if it fits cleanly, don't force it)
  2. "View All Projects" animated button, links to `/projects`
  3. Certifications — **"Coming soon" placeholder**, visibly present,
     not hidden (same visible-placeholder pattern used elsewhere on
     this site for not-yet-real content)
  4. Experience — unchanged content, just reordered to sit after
     Certifications
  5. Footer

## 2. Fanned card deck

Full detail already specified and approved separately — build exactly
as follows:

- Reference: `https://ui.aceternity.com/labs/interface-crafts-cards` —
  fanned, overlapping deck of tilted cards (title strip visible at
  rest); clicking scales one up into a large, fully-readable card while
  the rest stay fanned behind it. **Watch the live demo before
  building** — copy the actual mechanics, don't guess from description.
- Populate with real project content (screenshot, title, description,
  tech-stack tags) from `content/projects.ts` — this is a restyle of
  existing content, not new content.
- **Visual risk to check first:** the demo's cards are flat solid
  colors; these are detailed screenshots. Confirm with Designer that
  several busy screenshots fanned at overlapping angles reads as clean,
  not cluttered. If not, consider a simplified at-rest treatment (solid
  color/duotone, or title-only at rest) with the full screenshot only
  appearing on expand.
- Expanded state shows three conditional action buttons: **Details**
  (always, → `/projects/[slug]`), **GitHub** (only if the project has a
  repo URL), **Live Site** (only if the project has a live URL) — per
  §0.2's data requirement.
- Expanded card sized to comfortably fit screenshot + buttons — enlarge
  from the demo's default rather than cramping content into it.
- The deck-and-expand interaction fits within a single viewport at
  standard desktop sizes (Experience/Certifications below can scroll
  normally) — verify measured, not assumed, at 1920×1080 primary and
  other available viewports.
- Restyle card chrome to the site's palette, not the demo's default.
- `prefers-reduced-motion`: scale/layout transition collapses to a
  simple instant/near-instant state change.
- Measure and report actual frame cost of the scale transition, same
  rigor as other animated components already on this site.

## 3. `/projects` — full strip-list page

- Own header (full page, not a modal), reachable by direct URL,
  refreshable with Intro playing on load (per §0.1).
- Layout: one full-width horizontal strip/row per project, stacked
  vertically (5 rows for 5 projects currently, scales as more are
  added). Each strip shows the project name; on hover, the project's
  screenshot animates in from the right side.
- Clicking a strip **opens the project overlay** (`components/sections/ProjectOverlay.tsx`).
  *Amended 2026-08-25 on Saad's ruling — this line originally read "navigates to that
  project's `/projects/[slug]` page". See ▸ AMENDED below for the reasoning.*
- Own Close button → always `/work` (per §0.3 — fixed, not
  context-dependent).
- Reachable from exactly two places: `/work`'s "View All Projects"
  button (§1), and Home's "View All Projects" button (§5).

## 4. `/projects/[slug]` detail page chrome

> **AMENDED 2026-08-25 on Saad's ruling.** This section now applies to the **standalone-page
> render path only** — a hard load or a shared link. It is not what a visitor sees clicking
> through the site, because every in-app entry opens the overlay instead. The original text of
> the first bullet, "Close button — destination depends on entry context per §0.3's table," is
> superseded: the standalone page has no entry context by construction.

- Close button — a **fixed** destination. The standalone page only ever renders where there is
  no in-app history to return to, so there is nothing to be context-dependent about.
- Breadcrumb: "Projects / [project name]," both segments clickable.
  "Projects" always → `/projects`.
- Design this for someone who **arrived cold** — a recruiter opening a shared link — rather
  than for someone mid-session.

## 5. Home page — "View All Projects" addition

- Add a "View All Projects" button/link below Home's existing 3
  featured-project cards, → `/projects`.
- Treat as a simple static element, not part of Home's scrubbed
  scroll-trajectory system (GSAP ScrollTrigger) — it's a navigational
  exit point, not trajectory content. Don't wire it into the existing
  scrub choreography.
- Detail pages reached from here → Close returns to Home's project
  section (§0.3).

## 6. Mobile — full parity, not a fallback

Every piece above needs a real, considered mobile treatment — this is
not optional or secondary scope:

- **Fanned deck on mobile:** the tilted-overlap interaction likely
  needs real adaptation (a swipeable stack, or a simplified vertical
  arrangement) rather than a shrunk copy of the desktop fan — Designer
  to specify a mobile-appropriate version of the same interaction
  concept, not a literal scaled-down clone.
- **`/projects` strip list on mobile:** confirm the hover-reveal
  screenshot mechanic has a real touch-appropriate equivalent (hover
  doesn't exist on touch) — e.g. tap-to-reveal, or the screenshot always
  visible at a smaller size, Designer's call but must be decided
  explicitly, not left as "hover just won't work."
- **Detail pages and breadcrumb/close** — confirm layout and tap targets
  work at mobile widths.
- **Home's "View All Projects" button** — confirm placement/sizing on
  mobile.
- This should read as a professional, fully-considered mobile
  experience, not a degraded fallback of the desktop design — hold it
  to the same bar as the rest of this site's mobile work.

## 7. Verify & report

- Screenshot the at-rest fanned state and expanded cards (all button
  variants: full, GitHub-only, Live-only, neither, if such variation
  exists across the 5 projects).
- Confirm one-viewport fit for the deck on desktop.
- Confirm `/projects` strip list, hover-reveal, and navigation all work
  correctly.
- Confirm all three Close-destination behaviors independently (deck →
  deck, Home → Home, list → list) plus `/projects`'s own fixed
  close-to-`/work`.
- Confirm breadcrumb navigation.
- Confirm navbar active state on `/work`, `/projects`, and a
  `/projects/[slug]` page.
- Confirm accurate GitHub/Live-site button data per project.
- Confirm reduced-motion fallback.
- Full mobile pass with its own screenshots, not assumed from desktop
  correctness.
- Update this spec file in place with anything that changed from the
  plan during implementation, so it stays an accurate record.

---

# Implementation record

> Everything below this line is added during the build. Nothing above it is edited except
> to correct a factual error, and any such correction is called out explicitly.

## Baseline, as found 2026-08-25 (before any work)

Recorded so that later readers can tell what was inherited from what this change introduced.

**Routes on disk:**

```
app/(site)/layout.tsx
app/(site)/(chrome)/layout.tsx          <- the navbar lives here
app/(site)/(chrome)/page.tsx            <- /
app/(site)/(chrome)/about/page.tsx      <- /about
app/(site)/(chrome)/work/page.tsx       <- /work
app/(site)/projects/[slug]/page.tsx     <- /projects/<slug>, NO navbar (outside (chrome))
app/(site)/@modal/(.)projects/[slug]/page.tsx   <- the intercepted overlay
app/(site)/@modal/default.tsx
```

**Note for the planner:** `/projects` as a new page means adding
`app/(site)/projects/page.tsx` as a SIBLING of the existing
`projects/[slug]/` segment, and it sits alongside an active
`@modal/(.)projects/[slug]` interceptor. The interaction between a new
`/projects` index route and that interception convention has to be checked, not
assumed — this is the first thing to verify, because if it breaks the overlay it
breaks a shipped feature.

**Navbar:** `components/ui/Navbar.tsx` imports an `isActiveRoute` helper and reads
`usePathname()`. §0.4's grouping change lands there. The file already documents that
"during an open project overlay the pathname is `/projects/<slug>`", so overlay-vs-page
pathname ambiguity is a known, previously-handled condition in that file — read its
existing comments before changing the matching logic.

**Content:** `content/projects.ts` holds five projects with `links.github` / `links.live`
already modelled as optional keys on a `ProjectLinks` interface (`content/types.ts`), plus
`links.githubPreview` added 2026-08-25 for link previews. §0.2 may already be satisfied —
verify per project rather than assuming.

## ▸ DECIDED / VERIFIED — §0.2 link liveness, 2026-08-25

The spec asks for per-project link accuracy to be verified individually because "wrong/missing
links on a portfolio is a real credibility issue." The planner is auditing what the CONTENT FILE
claims. Separately, every URL in it was requested over the network on 2026-08-25 and all six
returned **HTTP 200** following redirects:

| Project | github | live |
|---|---|---|
| FOLIO | 200 | 200 |
| Aero-Grid | 200 | 200 |
| ClashChat | 200 | 200 |
| Multi-Floor Call Center Network Design (CCN) | none | none |
| SNA enterprise infrastructure | none | none |

Two caveats that a 200 does not cover, both worth re-checking before ship:

1. **FOLIO's live URL is a staging deployment** and `content/projects.ts` already documents it
   as "liable to be torn down". A 200 today is not a guarantee next month.
2. **Aero-Grid's backend is on Render's free plan** and its own README warns the first request
   after idle takes ~30 seconds to cold-start. The FRONTEND returned 200 promptly; a visitor
   clicking through may still meet a slow first load. Not a broken link, but it is the kind of
   thing worth knowing before pointing a recruiter at it.

**CCN and SNA have neither link, by design** — they are coursework, not deployed software. That
makes the "neither" button variant real rather than hypothetical, which §7's screenshot matrix
depends on: of the four possible variants, only **both** (3 projects) and **neither** (2
projects) actually occur. There is no github-only or live-only project today, so §7's request for
screenshots of those two variants cannot be satisfied with real content — flag rather than fake.

## ▸ VERIFIED — §0.1 route collision, 2026-08-25

**The biggest single risk in §0 is empirically clear at build level.** A throwaway
`app/(site)/projects/page.tsx` stub was added, `next build` run, and the stub deleted (the tree
is back to clean — verified with `git status`). The resulting route table:

```
├   /(.)projects/[slug]        <- interceptor STILL EMITTED, all 5 slugs
│ ├ ● /(.)projects/folio  ...
├ ○ /projects                  <- the new index route
├   /projects/[slug]           <- the full page, all 5 slugs
│ ├ ● /projects/folio     ...
```

So an index route beside `[slug]` **does not shadow or remove the `@modal` interception**, and
`/projects` prerenders statically alongside it. All 16 pages still built.

**What this does NOT prove**, and the implementer must still check in a browser: that
client-side navigation from a `/projects` strip row into `/projects/<slug>` behaves as intended.
The interceptor exists to turn an in-app navigation into an overlay — so a click on a strip row
may well open the OVERLAY rather than the full detail page, which would collide with §3's
"clicking a strip navigates to that project's page" and with §4's breadcrumb/close chrome. Build
output cannot distinguish those. **This is a design/behaviour question the planner's §0.3 answer
has to cover, not a build error.**

Note also that the stub was placed OUTSIDE `(chrome)` — it therefore had no navbar, which
contradicts §0.4's requirement that WORK show active on `/projects`. The real route's placement
in the group hierarchy is the planner's call.

## ▸ DECIDED — §0 architecture, 2026-08-25

Full reasoning: `.claude/handoff/projects-architecture-plan.md` (529 lines). Settled here:

### §0.1 — where `/projects` lives

**`app/(site)/(chrome)/projects/page.tsx`.** Forced, not chosen. §0.1 requires the Intro on load,
and the Intro's gate is `IntroProvider`, mounted by `app/(site)/(chrome)/layout.tsx`; `docs/06` §4
scopes the gate to that route group and forbids in capitals applying the per-page navbar fallback
to it. §0.4's navbar requirement points at the same group independently.

Interception is **not** shadowed — `(.)projects/[slug]` needs two segments and a one-segment
`/projects` cannot match it. Confirmed at build level by the probe recorded above, and there is an
in-repo precedent: `/work` is already inside `(chrome)` and its cards already intercept.
`@modal/default.tsx` needs no change.

### §0.3 — close-context tracking: **history, and no new state at all**

**The mechanism is `router.back()`, which `ProjectOverlay.tsx` already calls.**

The premise that made §0.3 look hard does not hold once `/projects` sits inside `(site)`: every
in-app click into a detail page is intercepted into the overlay, so the overlay is what Close acts
on, and browser history already encodes which of the three surfaces the visitor came from. All
three rows of §0.3's table are satisfied with zero new state — and scroll restoration is what
actually delivers "Home's project section", which a `push("/#work")` could not.

The FULL page has no entry context **by construction**: it only renders on a hard load or a shared
link, where there is no in-app history to return to. It keeps a fixed link.

Rejected, with reasons: **query param** — de-statics the five most-shared URLs, or needs a Suspense
boundary this repo deliberately keeps at zero, and leaks entry context into shared links.
**sessionStorage** — desyncs from Back/Forward and survives refresh, so a stale context outlives
the navigation that created it.

`/projects`'s own Close stays a fixed link to `/work`, exactly as §0.3 specifies — asymmetric on
purpose, not "return to referrer".

### §0.4 — navbar grouping

`components/ui/navContent.ts`, `isActiveRoute`. A blanket prefix match is refused **by name** in
that file's own comments ("would quietly make `/` match everything"), so the change is a one-entry
`ROUTE_GROUP` table keyed on href with `/` deliberately absent — the three match sets stay pairwise
disjoint and the "exactly one active item" invariant holds by construction.

**Declared cost:** this deletes the documented "overlay open, no item matches" null case at
`Navbar.tsx:751-760`, so the indicator becomes visible sliding to WORK for ~175ms during the
overlay's fade-in. That comment gets rewritten in the same commit rather than left to contradict
the code.

### §0.2 — data audit

Reported, not fixed. Both-links: FOLIO, Aero-Grid, ClashChat. Neither: CCN, SNA (`links: {}`,
deliberate). See the link-liveness section above for the network check.

## ▸ AMENDED / RULED — Saad's decisions, 2026-08-25

All five of the planner's open questions are answered. §3 and §4 above are **edited in place**
rather than contradicted down here; the edits are marked.

### F.1 — The overlay wins, everywhere in-app. `[RULED]`

**Every in-app entry point opens `ProjectOverlay.tsx` as it exists today** — a fanned-deck card, a
Home featured card, and a `/projects` strip row alike. Not a page navigation.

Saad's reasoning, recorded because it is the load-bearing argument for the whole close design:
*"That's what makes Close free and correct for all three origins via `router.back()`, and it
avoids building fragile new state just to re-derive something the browser already tracks
natively."*

**The standalone `/projects/[slug]` page exists only for the case that actually needs it** — a
hard load or a shared link, where there is no in-app history to return to. §4's breadcrumb-and-
close chrome is therefore a **standalone-render-path design**, not a thing clicking visitors meet.

Consequence for the build: the deck's expanded "Details" button and the strip rows are overlay
triggers, and whatever dressing they get has to be consistent with the existing morph
(`CoverFrame`'s `layoutId`) rather than fighting it.

### F.2 — Deck vs `/work`'s existing five-card grid `[STILL OPEN]`

**Not yet ruled.** The planner recommends (a) replace — the deck IS `/work`'s project section and
the exhaustive list lives only on `/projects`. Carried into the next decision round together with
the designer's one-viewport measurement, because "3 or 5 cards" and "replace or alongside" are the
same question in practice. **Do not start §1 or §2 implementation until this is answered.**

### F.3 / F.4 `[STILL OPEN]` — carried to the next round with F.2. Both are one-liners.

### F.5 — Material: **STAY FLAT.** `[RULED]`

Adopt the reference's **interaction** (fan, tilt, scale-expand); reject its **material**. No
rounding, no shadows. Saad: *"This site has gone out of its way, repeatedly, to keep
`--radius-photo` a single-consumer exception rather than a reusable scale, and to keep shadows at
zero tokens site-wide — introducing a second rounded+shadowed surface here would be the first real
crack in that discipline, not a component detail."*

The door is explicitly left open — *"if you want the deck to actually look like the reference,
say so explicitly and I'll treat it as a deliberate design-system expansion"* — and it was **not**
taken. Default: `bg-elevated` + a 1px border, matching `ProjectCard`.

> **One fact the ruling should be read against:** `components/about/aboutButtonStyles.ts` gained a
> five-layer HARD OFFSET shadow earlier the same day (the brutal treatment for `/about`'s
> controls), and `components/ui/link-preview.tsx`'s card frame borrows it. It is an inline
> arbitrary value referencing `--color-brutal-edge`, not a `--shadow-*` token — so "zero shadow
> TOKENS" is still literally true, and the site is no longer literally shadow-free. Recorded here
> rather than left for someone to discover a contradiction later.

### The three leftover Aceternity card files — **refused** `[RULED]`

`components/ui/3d-card.tsx`, `comet-card.tsx`, `glare-card.tsx` are untracked leftovers of an
earlier install. Saad: *"none of those three leftover files should end up wired into this."* They
are Tier 1 gestures and this is a Tier 2 surface. The deck is a **purpose-built component**
matching the reference's interaction, not an adaptation of any of them.

### Rule S-1 full-width exception for `/projects` — **approved in advance** `[RULED]`

Saad: *"The whole point of the strip layout is full-width rows; that's not incidental, it's the
design."* Approved now rather than raised mid-build. It gets named explicitly in
`docs/03_FRONTEND_SPEC.md`, **scoped only to `/projects`**, with the reasoning recorded and
deliberately **not generalised** to license full-width elements elsewhere — the same handling
`/about`'s flip-board exception received.

**This is an outstanding work item**: the `docs/03` note does not exist yet. It must be written
before or in the same commit as the strip list.

### §0.1 placement and §0.4's 175ms indicator slide — both confirmed `[RULED]`

Placement: *"agreed, no real alternative."* The indicator slide: *"accept it, not worth
engineering around. A brief, honestly-disclosed cosmetic side effect of a sensible architectural
choice is a fine trade."* No action.

## ▸ RULED — decision round 2, 2026-08-25

Design brief: `.claude/handoff/projects-architecture-design.md` (941 lines). Its §J raised twelve
pushbacks; the four that needed Saad are answered here, the rest are accepted as briefed.

### F.2 / J.4 — **the deck holds ALL FIVE, and the button is relabelled** `[RULED]`

The deck **replaces** `/work`'s existing two-column grid. `docs/07` §5's definition of `/work` as
"the complete record" is therefore **unchanged** — that was the cost of the three-card option and
it is not being paid.

**§1's "View All Projects" button is relabelled "Browse as a list".** The reason is J.4's finding:
with five in both places, `/projects` adds a different PRESENTATION, not a different set — so a
label promising more projects would be untrue. The new label names the affordance difference,
which is the thing that is actually different.

> **J.7 IS NOW LOAD-BEARING AND MUST BE ENFORCED IN CODE.** The fan is hard-capped at five: a
> sixth project needs spacing ≤165px, which is below the title-legibility floor, and the fan
> would silently overflow the spine at 1280. Choosing five means the deck ships **at that cap
> with zero headroom.** The component must carry the limit as an explicit guard with the
> arithmetic in a comment — not a note in a doc — so that the day a sixth project is added the
> failure is loud instead of a broken layout nobody measured.

### J.5 / J.6 — copy stays **exactly as specced** `[RULED]`

`/projects` is headed **"Projects"** and its button reads **"Close"**. The designer proposed "All
Projects" / "All work"; Saad chose the spec's literal wording. Consequences, accepted knowingly:
two pages one click apart are both headed Projects (`/work`'s `<h1>` becomes "Projects." per §1),
and "Close" here is the one place on the site where that word means a page-to-page navigation
rather than dismissing a modal.

### J.3 — **the spring is adopted as a deliberate fourth curve family** `[RULED]`

Saad chose the reference's motion over the three-curve discipline. This is a **design-system
expansion**, handled the way the Rule S-1 exception is: reasoned and documented, not slipped into
a component.

- The value is the demo's own: `{ type: "spring", visualDuration: 0.6, bounce: 0.25 }`.
- It goes into `lib/animation/easing.ts` as a named export beside `EASE` / `DURATION`, with a
  docblock stating it is the fourth family, why it was added, and what it is scoped to.
- It gets a matching note in `docs/03_FRONTEND_SPEC.md`'s motion section.
- **It does NOT retroactively license springs elsewhere.** `CoverFrame.tsx` and
  `ProjectOverlay.tsx` each carry an on-record refusal of a spring; those stand, and the new
  entry's docblock must say so or the next reader will treat them as stale.

### Small defaults — **all four approved** `[RULED]`

1. Standalone detail-page Close → `/work` (fixed; distinct from the breadcrumb's `/projects`).
2. **No reveal footer on `/projects`.**
3. Strip dividers use `fg/25`, not `accent-working/30` — a full-bleed divider on a clickable row
   is neither of globals.css's two border categories, and six teal rules across 1920px would make
   the list's *structure* teal and spend the affordance colour on something unclickable.
4. The breadcrumb's current-project segment is **plain text**, not a link. This overrides §4's
   "both segments clickable": a link to the page you are on is a dead control and a tab stop that
   does nothing.

### Accepted from §J without needing a ruling

- **J.1** — `Projects.tsx` carries a written refusal of the exact Home button §5 adds. The
  reversal is justified (that refusal rested on the navbar being the one answer to "where is
  everything", and the navbar does not link to `/projects`), but **the comment must be amended in
  the same commit**, not left contradicting the shipped page.
- **J.2** — the deck is **left-anchored, not centred**. Forced by Rule S-1. This is the largest
  visual departure from the demo Saad watched; he sees it at first build.
- **J.9** — `aboutButtonStyles.ts`'s `BRUTAL_SHADOW` / `BRUTAL_MOTION` become site-wide the moment
  the deck imports them. Export is right; the file's header must gain a line saying the treatment
  now has consumers outside `/about`, and that a third surface is the point to move it to
  `components/ui/`.
- **J.8** — 1280–1439 is snug (24–27px of margin). Re-measure at 1280 on every change, not only
  at 1920.
- **J.12** — Certifications is a heading plus one mono-caption line on the spine. No card, no
  dashed box, no icon, no lock glyph — matching Skills' `00` empty group, which reads as honest
  because it is typography stating a fact rather than a decorated empty state.
- **The Rule S-3 defect the overlay ruling created:** `ProjectDetailFrame` is shared by both
  render paths, so a breadcrumb wrapping at 360px would put the cover 17px lower on the route than
  in the overlay. Fix is one line — `min-h-[34px]` on the top row in both paths.
- **Strip thumbnails deliberately do NOT carry the `layoutId`.** A 200×125 `object-cover` crop
  projecting onto a 912px uncropped cover changes the crop window mid-animation, which is
  distortion rather than morph.

## ▸ BUILT — Slice 1 (foundations), 2026-08-25

Green. 17/17 static pages; `/projects` present; all five `(.)projects/<slug>` interceptor entries
and all five `/projects/<slug>` pages survive, so interception is confirmed unshadowed in a real
build rather than only in the probe.

| File | What landed |
|---|---|
| `lib/animation/easing.ts` | `SPRING` — the fourth curve family, as plain data (the file's header forbids importing `motion`) |
| `docs/03_FRONTEND_SPEC.md` | S-1's **second** named exception (`/projects` full-bleed) + a new "curve vocabulary, and the fourth family" subsection |
| `components/ui/navContent.ts` | `ROUTE_GROUP` table + the new `isActiveRoute` predicate |
| `components/ui/Navbar.tsx` | the deleted null-case comment rewritten |
| `app/(site)/(chrome)/projects/page.tsx` | the route: spine shell, `<h1>Projects</h1>`, `Close` → `/work` |

**The spring docblock turned out to need a finer distinction than the ruling anticipated, and it
is worth recording.** Both existing refusals carry TWO reasons, not one:

> `CoverFrame.tsx:72` — *"A SPRING WAS REJECTED. Its overshoot would push the cover past its final
> rect — visible against the `<h1>`'s fixed left edge one row below — and it would add a fourth
> curve family to a three-ease system."* `ProjectOverlay.tsx:78-81` makes the same argument.

Only the **systemic** clause ("a fourth curve family") is spent, and `SPRING` is what spent it. The
**geometric** clause is untouched and still standing — the deck has no fixed reference edge below
it to measure overshoot against, which is precisely the difference. The docblock says so, and says
"do not unify the morph onto this spring" and "do not read those two files as stale."

**Verified active-route matching**, run rather than reasoned — exactly one match on every real
route, and `/projects-archive` correctly matches nothing (the trailing-slash guard doing its job).

**Four comment headers that this slice made factually false were corrected in the same change**
(`Navbar.tsx` ×2, `(chrome)/layout.tsx`, `(site)/layout.tsx`). This repo's recorded failure mode.

### ⚠ Open scoping caveat — slice 4 MUST close this

`/projects`' shell shipped **spine-aligned**, while the `docs/03` exception written in the same
slice describes it as **full-bleed**. The gap is currently held open honestly: the doc carries a
blockquote stating that the page ships only a heading and an exit today, that the shell is
spine-aligned, and that the exception **takes effect in the same change as the strip rows** — so
until then `/projects` is not an exception to anything. The page file mirrors it, including *"when
the rows land, the container, the heading and the exit all move to the gutter together — the page
has ONE leading edge, never two."*

**If slice 4 does not perform that move, the doc goes stale in the other direction.** This is the
single most likely thing to be dropped in this build. It is not optional.

### Gotcha for later slices

A deleted route stub leaves a stale entry in `.next/types/validator.ts`, so a bare
`npx tsc --noEmit` can fail on a file nobody touched. It self-heals on the next `next build`. If a
later slice's typecheck fails mysteriously after a route moves — build first, then typecheck.

## ▸ AUTHORITATIVE SLICE TABLE — supersedes the plan's §E, 2026-08-25

**This table is the only valid sequencing.** `.claude/handoff/projects-architecture-plan.md` §E
proposed a different order and is now SUPERSEDED — its numbering assigned slice 3 to the strip
list and slice 4 to the detail chrome. The build did not follow that.

The divergence was introduced by the coordinator when dispatching the implementers, and was NOT
written down, so slice-1 code shipped comments citing "slice 4" for work this table calls slice 5.
That is exactly the drift this file exists to prevent, and it was caught by review rather than by
discipline. Recorded plainly rather than quietly corrected.

| Slice | Scope | State |
|---|---|---|
| **1** | Foundations: `SPRING` in `easing.ts`, the two `docs/03` entries, `navContent.ts` grouping + `Navbar.tsx` comment, minimal `/projects` route | ✅ built, reviewed |
| **2** | `/projects/[slug]` standalone chrome (§4): breadcrumb + fixed Close, and the shared-frame `min-h` fix | ✅ built, reviewed (the `min-h` was then RULED OUT — see below) |
| **3** | **Documentation truth sweep** — every stale route enumeration the new route falsified. See below; this was not in the original plan and is not optional. | ✅ built |
| **4** | `/projects` strip list (§3) + **the full-bleed move** that closes slice 1's scoping caveat | ✅ built, reviewed |
| **5** | `/work` restructure (§1) + the fanned deck (§2) | ✅ built |
| **6** | Home's button (§5) + the §7 verification pass, desktop and mobile | ✅ built. **The §7 pass is PARTIAL BY NECESSITY** — no browser in the environment. `.claude/handoff/projects-architecture-verification.md` marks every item VERIFIED or NEEDS-BROWSER; the screenshot matrix and all mobile screenshots are outstanding |

**Any comment in the codebase citing a slice number must be checked against THIS table.** Slice 1
left two references to "slice 4" in `app/(site)/(chrome)/projects/page.tsx` (~lines 19 and 71) that
mean slice 4 under this table — the strip rows — so they are correct as written. Verify rather
than assume when touching them.

## ▸ FINDING — the real cost of adding a fourth route, 2026-08-25

Review of slice 1 found **fifteen** issues. Thirteen are the same defect wearing different clothes:
**this site documents its own route list in at least eleven places, and adding `/projects` made
every one of them false.** None is a functional regression; all are the failure mode CLAUDE.md's
header records three times over ("invisible-because-unlisted").

The plan predicted some of this (§A.4.5 named CLAUDE.md, `docs/07` and `docs/06` as mandatory
same-commit edits) and slice 1 did not do it. The four headers slice 1 *did* fix were verified
correct; these are the ones it missed:

| File | What is now false |
|---|---|
| `CLAUDE.md:123` | "THE SITE IS THREE PAGES, NOT ONE SCROLL" — four |
| `CLAUDE.md:129-132` | route table has no `/projects` row |
| `CLAUDE.md:134` | "navbar on `/`, `/work` and `/about`" |
| `docs/07:290` | Intro ROUTE SCOPE box — "`/`, `/work` or `/about`… exactly the routes in `(chrome)`" |
| `docs/06:375` | entrance-onset route list |
| `docs/06:484` | Intro-on-load route list |
| `docs/06:504-511` | theme-toggle surface table, no `/projects` row |
| `app/layout.tsx:208-209` | "three of the site's six `<main>` elements" — four of seven |
| `app/layout.tsx:213-216` | "two live consumers" of the fade selector — three |
| `app/globals.css:807-816` | "any of the three content routes" + per-route scroll-lock list |
| `components/intro/IntroGate.tsx:45-47` | trigger enumeration |
| `components/ui/standaloneNav.ts:2,13-19` | "four consumers" — five now, six after slice 4 |
| `components/ui/PageStack.tsx:183` | `fade` call-site enumeration |
| `(chrome)/layout.tsx:63` | "`/` <-> `/work` <-> `/about`" navigation graph — 11 lines below a line that WAS fixed |
| `(chrome)/layout.tsx:58-59` | typo introduced by the edit: "reason reason" |
| `docs/07:1077`, `AboutScreen.tsx:589` | point at `docs/03`'s "ONE exception"; there are now two |

**Two substantive errors, not enumeration drift:**

- **`docs/03:600-601` says `/projects` ships "its two Close affordances". It ships one.** This sits
  inside the blockquote whose entire stated purpose is to record *what is actually on disk* — so
  the honesty mechanism for slice 1's scoping caveat is itself inaccurate.
- **`SPRING` is documented as having "one consumer"; it has zero** until slice 5. This repo has an
  in-house convention for exactly that state eleven lines above it in the same file — `STAGGER.card`
  reads "ZERO CONSUMERS — nothing imports it" and explains why it is kept.

**Also missing, and it is an architecture leak:** the no-reveal-footer ruling for `/projects` lives
only in gitignored `.claude/` and one code comment. `docs/07:642` still reads "Home and Work only —
not About", which stays true in effect but does not record the decision. CLAUDE.md's "where
decisions live" rule says a decision constraining a later ticket moves to `/docs`. Slice 3 does it.

### The reviewer's ruling on slice 1's scoping caveat: **ACCEPT spine-aligned**

Do not make the shell full-bleed early. The exception's whole justification is the strip rows'
geometry — with no rows there is no content the deviation serves, and shipping it now would put a
**third** S-1 sweep deviation on disk with nothing visible to justify it. Two conditions attached:
fix the "two Close affordances" error now, and give the blockquote an **explicit deletion
instruction**, because as written it implies but does not command that the container, the
blockquote and the sweep count all revert together when the rows land.

### Carried to slice 5 as a real risk

If the deck's flat material ruling means it never actually uses `SPRING`, the fourth curve family
will have been added for nothing and both docblocks need retracting rather than updating. Confirm
the spring has a genuine call site at slice-5 design time.

## ▸ BUILT + RULED — Slice 2 (standalone detail chrome), 2026-08-25

Built green, then **partially reverted on Saad's ruling.** Both are recorded because the reverted
version's measurements are what justified the ruling.

### What shipped

| File | What |
|---|---|
| `components/sections/ProjectBreadcrumb.tsx` | NEW. Server component. `<nav aria-label="Breadcrumb">` → `Projects` (a real `<Link>` to `/projects`) · `aria-hidden` `/` · the current project as plain `<span aria-current="page">` |
| `components/sections/ProjectDetailFrame.tsx` | one optional `breadcrumb?: ReactNode` prop, rendered as `{breadcrumb ?? affordance}` — it REPLACES the affordance in the existing top row, so `n` stays 2 and `justify-between` stays safe |
| `app/(site)/projects/[slug]/page.tsx` | passes the breadcrumb |
| `components/sections/projectDetailContent.ts` | `BREADCRUMB_ROOT_LABEL` / `BREADCRUMB_SEPARATOR` — the spec's own words, no copy invented |

**The Close needed no build.** The route already shipped a fixed `All work` → `/work` link, which
*is* §4's fixed Close. Verified by count in the prerendered HTML: exactly one `/projects` link
(the breadcrumb) and exactly one `/work` link.

### Two defects found in the design brief, corrected with measurement

1. **§F.4's `flex flex-wrap` contradicted its own `min-h-[34px]`.** As flex items the 38-char CCN
   title cannot fit beside `Projects /` at 360px, so it is pushed to its own flex line and wraps
   *there* — **three** line boxes, 50.4px, which a 34px reservation would not have covered. Built
   as **one inline text run** instead: breaks at word boundaries, fills each line, two boxes,
   33.6px. A mono space is 8.16px, i.e. the `gap-x-xs` the brief wanted anyway. **The brief's
   number was right and its layout was wrong.**
2. **§F.4's `min-h-[44px] inline-flex` tap target reintroduced S-3**, 10px of it — it makes the
   link an atomic 44px inline box, so the route's row grows and the overlay's does not. Built as
   an absolutely-positioned `::after` (zero layout height; hit-testing resolves to the anchor —
   the same stretched-link device `ProjectCard` ships). It extends **upward only**, because below
   482px the project's own name (plain text, not a link) sits directly under `Projects` and a
   downward box would put an invisible link over it. Its height is **declared** rather than
   inferred from `bottom-0`: an absolutely-positioned child of an *inline* element takes the
   font's content area as its containing block, not the line box, and JetBrains Mono's 1020/−300
   metrics give 15.84px at 12px — so `-top-[28px] bottom-0` would have measured 43.84px and missed
   44 by 0.16px.

### ▸ RULED — `min-h-[34px]` REMOVED. Do not re-add it.

The S-3 equalisation was listed under "Accepted from §J without needing a ruling". **It needed
one, and the measurement is why.** Equalising costs the OVERLAY 17.2px of extra whitespace above
the cover at every width — and the overlay is the path essentially every visitor takes, while the
standalone route renders only on a hard load or a shared link. That spends a permanent, universal
cost on the primary path to remove a mismatch that exists **only below 482px**, between two
renders one visitor is unlikely to see back to back.

Saad's call: leave the overlay untouched. **Declared residual: below 482px the standalone route's
cover sits 16.8px lower than the overlay's.** Above 482px the breadcrumb does not wrap and the two
are already identical.

`gap-sm` SURVIVED the removal. It computes to nothing on the overlay path (`Close` 40.8px + toggle
40.8px in a 318px box leaves ~236px of free space, and `justify-between` distributes free space far
larger than a 13px gap), so the ruling holds in every rendered pixel; only the class attribute
differs. Verified in the built HTML — both paths' top rows are now byte-identical strings.

**A ceiling that was a courtesy is now load-bearing.** While 34px was reserved, a title long enough
to force a third line box would have overflowed a reservation and been caught by anyone measuring.
With no reservation it silently grows the accepted residual from 16.8px to 33.6px. The ceiling is
**~48 title characters at 360px** (today's longest is 38) and it is stated in
`ProjectBreadcrumb.tsx`. **Re-check it when adding a project with a long title.**

### ▸ RULED — the detail page's exit stays **"All work"**, not "Close"

§4 calls it a "Close button". `projectDetailContent.ts` records that on this site `Close` means
*dismiss an overlay* and `All work` means *navigate*; this one navigates. Saad kept the existing
label. Consequence, accepted: `/projects` says "Close" (his earlier ruling) while the detail page
says "All work" — different words for the same kind of page-to-page exit, because the detail
page's word is load-bearing against the overlay that shares its component.

### Coordinator note

Reverting the `min-h` made **five** comments in `ProjectBreadcrumb.tsx` and one block in
`ProjectDetailFrame.tsx` stale — every one of them justified a layout decision by reference to the
reserved height. All were rewritten in the same change rather than left behind. That is the same
failure this build's slice 3 exists to clean up, caught this time before it landed.

## ▸ STANDING AUTHORISATION — 2026-08-25

Saad: *"go with all the decisions i am going to sleep."*

**Slices 4, 5 and 6 proceed autonomously.** Judgment calls that would otherwise have been raised
are the coordinator's to make and MUST be recorded in this file under a `▸ DECIDED (autonomous)`
heading, with the reasoning and the alternative that was rejected, so every one is reviewable on
waking rather than buried in a summary.

**Committing is NOT covered by this authorisation.** The coordinator said in writing "I won't
commit anything without you saying so", and Saad did not answer that question specifically. The
working tree stays uncommitted. Do not commit, do not push, do not branch.

Standing constraints for the autonomous run, unchanged: every slice ends at a green build; zero
hex literals in `app/` and `components/`; no `dark:` variants; no new radius token; no new shadow
token; every token verified against `app/globals.css`; every stale comment corrected in the same
change that falsifies it; reviewer runs after each implementer.

**The one thing to escalate rather than decide:** if the fanned deck turns out not to use `SPRING`
at all, the fourth curve family was added for nothing. Do not quietly retract it and do not quietly
keep it — record the situation prominently for Saad, because adding a fourth curve was HIS explicit
design-system decision and unwinding it is his call, not the coordinator's.

## ▸ BUILT — Slice 3 (documentation truth sweep), 2026-08-25

Zero behaviour change by design, and it was **proved rather than asserted**: the prerendered DOM of
`/`, `/about`, `/work` and `/projects` is identical before and after (all `<script>` bodies and
content-hashed chunk URLs normalised out), and the emitted stylesheet loses no rule any of these
edits caused.

**Every item on the FINDING list above is closed**, plus fourteen the list did not have. Files
touched: `CLAUDE.md`, `README.md`, `docs/01`, `docs/02`, `docs/03`, `docs/04`, `docs/06`, `docs/07`,
`app/layout.tsx`, `app/globals.css`, `app/(site)/(chrome)/layout.tsx`,
`app/(site)/(chrome)/projects/page.tsx`, `components/intro/Intro.tsx`,
`components/intro/IntroGate.tsx`, `components/intro/AssetLoader.tsx`, `components/ui/PageStack.tsx`,
`components/ui/standaloneNav.ts`, `components/ui/Navbar.tsx`, `components/about/AboutScreen.tsx`,
`lib/animation/easing.ts`.

### What the FINDING list did not have

- **`docs/07` §1.1's Active-source row** — *"`/` = the centre icon, `/about` = ABOUT, `/work` =
  WORK"*. Flatly false since slice 1: `/projects` and every `/projects/<slug>` are WORK too. The
  `ROUTE_GROUP` decision, the refusal of a prefix match and the accepted 175ms indicator slide lived
  only in gitignored `.claude/`; they are now in `docs/07` beside the parameter table they govern.
  **This was a second architecture leak of the same kind as the reveal-footer one, and it was not on
  the list.**
- **`docs/02`'s folder tree** — `(chrome)` described as "the three chrome-bearing routes" with no
  `projects/page.tsx` row at all. Added, with the indent distinction between the in-group index and
  the out-of-group `[slug]` called out, because that tree is where a new reader learns the shape.
  (`/error.tsx` was also missing and was added; that gap predates this work.)
- **`docs/02` and `docs/03`** each carried their own copy of `app/layout.tsx`'s "three of six
  `<main>`s, two fade" sentence. All three files said it; all three are fixed.
- **`README.md`** — no `/projects` row in its Routes table, and "currently 16 prerendered pages".
- **`docs/01`** — "v1 is three routes … 16/16 static pages", and "scroll depth … now spans three
  routes". **`docs/04`** — "It is three routes now".
- **`components/intro/Intro.tsx`** — five separate "ON ALL THREE ROUTES" claims about the phase
  table. Replaced with "every route it plays on" rather than "four": there is no route branch in
  phases 1-7, so any count there is a number that goes stale on the next route.
- **`components/intro/AssetLoader.tsx`** — the plate's static-HTML route list.
- **`components/ui/PageStack.tsx`** — "`/` and `/work` fade" and a "loading all three routes"
  verification, on top of the `fade` prop enumeration the list did name.
- **`app/globals.css`** — a SECOND stale enumeration in the navbar-palette block ("on ALL THREE
  content routes"), well below the scroll-lock one the list named.
- **`docs/06`** — the scroll-lock reach paragraph, the `(chrome)` route-group listing, the
  Intro-remount navigation graph and the phase-table counts, none of which were on the list.
- **`app/(site)/(chrome)/projects/page.tsx`** — called `STANDALONE_NAV` "a four-consumer atom".

### The `STANDALONE_NAV` count: SIX, not five

The list predicted "five now, six after slice 4". It is **six already**: slice 2 shipped
`ProjectBreadcrumb.tsx`, whose `Projects` segment is a consumer, and the detail route's own count
went from two links to ONE in the same change (the breadcrumb took the top row). The header now
enumerates all six by file with what each renders, and says plainly that the count is load-bearing
because the whole extraction argument rests on it.

### Corrections to the FINDING list's own claims

- **The "reason reason" typo was NOT introduced by slice 1.** `git show HEAD` has the same words,
  wrapped across two lines; slice 1 re-wrapped the paragraph and made the duplication visible on one
  line. Fixed by inserting the missing "that", which is what the sentence always wanted.
- **`docs/06`'s entrance-onset LIST was right and only its REASON was wrong,** exactly as the list
  said — and the corrected reason is measured rather than reasoned: `/projects`' prerendered HTML
  contains **zero** `[data-reveal]` elements (2 occurrences, both the `<noscript>` selector text,
  against 4 real ones on `/`), so "nothing on it is a `Reveal`" is a fact off the build.

### `SPRING` — zero consumers, and the label needed a distinction

Relabelled in both `lib/animation/easing.ts` and `docs/03` using `STAGGER.card`'s in-house wording.
But `STAGGER.card`'s note also says *"if a second unused entry ever joins it, delete both"*, and that
rule would have fired here if the convention were copied blindly. It does not apply: `STAGGER.card`
is **permanently** unconsumed by a standing decision, `SPRING` is unconsumed **yet**, with a
scheduled call site. Both files now carry that distinction AND the retraction trigger — if the deck's
flat-material ruling means it never springs, the export and the `docs/03` entry are **retracted, not
relabelled**.

### The `docs/03` deletion instruction

Written as three numbered steps that must land in ONE commit: (1) the spine container comes off
`app/(site)/(chrome)/projects/page.tsx` and becomes `px-md sm:px-lg`, no `mx-auto`, no cap; (2) the
blockquote is **deleted, not amended**; (3) the S-1 mechanical sweep reverts from thirteen containers
to twelve. It also states that nothing in the code couples the three, and that shipping (1) without
(2) and (3) is the more dangerous failure — a rule that has quietly started applying reads as though
it never did not.

### One rendered difference exists across this window, and it is NOT slice 3's

`/projects/<slug>` lost `min-h-[34px]` from its top row (and the stylesheet lost
`.min-h-lg{min-height:var(--spacing-lg)}` with it) between slice 3's baseline build and its final
one. `components/sections/ProjectDetailFrame.tsx` was rewritten at 02:47:38 — **after** the baseline
snapshot was taken at 02:43 — recording Saad's ruling to leave the overlay untouched and declare the
sub-482px residual instead. Slice 3 never opened that file. Recorded here so a later reader comparing
builds across this window does not attribute it to the documentation sweep.

### Not fixed, deliberately — flagged instead

- **`components/ui/ExternalLink.tsx`: "All four consumers are server components".** There are FIVE
  (`AboutScreen`, `CurrentlyLearning`, `Experience`, `ProjectDetail`, `RevealFooter`), and it was
  already wrong at `HEAD` — nothing to do with `/projects`. `link-preview.tsx` quotes the same
  sentence. Left alone because the *substance* of the claim (all consumers are server components)
  may still hold even though the count does not, and confirming that is its own check.
- **`README.md`'s `/about` row still reads "One screen, doesn't scroll",** which `CLAUDE.md` and
  `docs/07` §6 both contradict. Pre-existing drift, unrelated to this route.
- **Dated measurements were qualified, never rewritten.** Where a paragraph records a figure taken on
  a specific date against the then-three routes (`app/layout.tsx`'s no-JS captures, `globals.css`'s
  53-element scrollbar table, `docs/06`'s contrast runs), the enumeration now reads "the three routes
  that existed then" rather than silently acquiring a fourth route nobody measured.

## ▸ DECIDED (autonomous) — `Currently Learning` survives the §1 reorder, 2026-08-25

**The gap:** §1 gives `/work`'s section order top to bottom as (1) deck, (2) the button,
(3) Certifications, (4) Experience, (5) Footer. **`Currently Learning` is not in that list** — but
it is a shipped section on `/work` today (Ticket 9), and `CLAUDE.md` calls it "the living part of
the site". The spec never says to remove it.

Two readings, and they differ by whether real shipped content gets deleted:
- The list is EXHAUSTIVE → Currently Learning is being retired, probably folded into Certifications.
- The list orders the sections it is CHANGING → Currently Learning is simply unmentioned.

**Ruling: KEEP IT, placed after Experience, before the footer.** Deleting a shipped section on an
inference drawn from an omission is not a call to make while Saad is asleep, and keeping it is the
reversible direction — restoring deleted content and its comment history costs more than moving a
section later.

**Flagged for Saad, because it is a real composition question rather than a technicality:**
`content/currentlyLearning.ts` is an **empty array** today, and Certifications ships as a
"Coming soon" placeholder. That is potentially TWO near-empty sections stacked, which may read
poorly however honest each one is individually. If the intent was that Certifications REPLACES
Currently Learning, that is a one-line change and the omission was probably deliberate.

## ▸ NOTE — concurrency during the autonomous run, 2026-08-25

Three agents ran at once (slice 4 build, slice 3 review, slice 5 build), with explicit file
exclusions to prevent collision: slice 4 owns `docs/03_FRONTEND_SPEC.md` and
`app/(site)/(chrome)/projects/page.tsx`; slice 5 was told to propose `docs/03` text in its report
rather than edit it, and the coordinator applies it afterwards.

**This is worth recording because it already caused one false alarm.** Slice 3's zero-rendered-
change proof found `/projects/folio` losing `min-h-[34px]` and correctly attributed it to a
concurrent edit rather than to itself. A future reader diffing this session's work should expect
timestamps to interleave.

## ▸ FIXED — slice 3 review findings, 2026-08-25 (coordinator, autonomous)

Review of the documentation sweep found **8 confirmed defects + 4 lower-severity**, including one
the sweep itself introduced. Twelve are closed; three are deferred because slice 4 owns the file.

**The sweep wrote a NEW false statement**, which is the finding worth remembering:
`docs/03:1263-1265` claims `/projects` "is reached from `/work` and from Home". It is reached from
**neither** — `/work`'s button is slice 5 and Home's is slice 6. A repo-wide grep for `"/projects"`
returns three hits and none is an in-app link: the page's own canonical, the `ROUTE_GROUP` value,
and `ProjectBreadcrumb` (which renders only on a cold-loaded detail page). **Today `/projects` is
unreachable from any in-app surface.** The sentence reads as verified because its first clause is
true. This is exactly the class of error the sweep existed to remove — a present-tense claim about
navigation that has not been built. **Deferred to slice 4, which owns `docs/03`.**

Closed by the coordinator (files no running agent owns):

| Finding | Was | Now |
|---|---|---|
| `Intro.tsx:157` | "ONE ending on all three routes" | every route the Intro plays on. **The phrase wraps a line**, which is why the sweep's grep found four copies in that file and missed the fifth |
| `ExternalLink.tsx:35` | "All four consumers are server components" | **five**, and the substance HOLDS — all five verified against the repo's `"use client"` list, none carries it. Wrong before `/projects` existed; not route drift |
| `link-preview.tsx:75` | quotes the same wrong count | corrected — the quote also wraps a line |
| `docs/01_PRD.md` ×4 | opening amendment, headline, route table with no `/projects` row, and the **retired ×17 zoom-in** still described as current | all corrected; the zoom-in was retired 2026-08-22 and this file never got the correction |
| `README.md:30` | `/about` "One screen, doesn't scroll" | matches `CLAUDE.md` and `docs/07` §6 now. The sweep edited two cells of this table and left a third knowingly false |
| `docs/07:506` | "ONE ENDING on all three routes", present tense | every route it plays on. The historical sentence above it left alone |
| `docs/02:107` | "`docs/07` splits the site into three routes" | three at the restructure, four since |
| `globals.css:733` | 53-element scrollbar table, reads exhaustive | dated, and states plainly that `/projects` takes the same lock but **has not been measured** — absent because nobody ran it, not because it scored zero |
| `docs/06:345-349` | ordering contract branched `ON /` vs `OFF HOME (/work, /about)` | `/projects` fell through the taxonomy entirely. Now branches on "renders an `IntroEntrance`", matching §5's rule 40 lines below, which was already correct |

**Verified for the reviewer, which could not run commands:** `git diff -- app/globals.css` confirms
slice 3's edits there are comment-only. The one real declaration in that diff (`--color-brutal-edge`)
predates slice 3 and belongs to the `/about` brutal-button work.

**Residual `all three routes` matches are all correctly historical** — dated measurements and
quoted superseded wording. Checked, not assumed.

### Still open, deferred to whoever owns the file next

- `docs/03:1263-1265` — the false reachability claim above.
- `docs/03:1441-1444` — "the toggle now lives inside the fixed navbar on all three chrome routes".
  Four. `docs/06` §5's equivalent table was fixed; `docs/03` carries a mirror of the same claim.
- `docs/03:278` — "The whole-site theme sweep … all four route shapes". There is a fifth now, and
  **`/projects` has never been through the theme sweep, the no-JS pass, or the scrollbar
  measurement.** Slice 6's §7 verification must add it to all three, and these headers should stop
  calling themselves whole-site until it has.

## ▸ BUILT — Slice 4 (`/projects` strip list + the full-bleed move), 2026-08-25

Green, 17/17. `/`, `/about`, `/work` and `/projects/folio` verified **byte-identical to baseline**
(scripts emptied, hashes normalised); only `/projects` differs.

**The slice-1 scoping caveat is CLOSED** — all three coupled steps done: the spine container came
off (`max-w-[1440px]` 0, `mx-auto` 0 in the prerendered HTML), the `docs/03` blockquote was
**deleted** rather than amended, and the sweep count was re-run mechanically (12 real containers,
`/projects` no longer among them). The second Close shipped, so `docs/03`'s "both Close
affordances" is now true as written.

**Rows open the overlay**, reasoned rather than assumed: `/projects` and `/work` have *identical
layout chains* under `app/(site)/layout.tsx`, which renders `{modal}`; `/work`'s card→overlay is a
shipped verified feature, so `/projects` inherits it by construction. Corroborated off the build —
`projects.rsc` and `work.rsc` each contain the same 3 occurrences of `modal`.

**`IntroEntrance` stays at TWO consumers** — no row takes a `Reveal`, measured: `/projects`
prerenders **zero** real `[data-reveal]` elements. `docs/06`'s blockquote was amended from "pending"
to "the rows landed and took no reveal".

### Five design-brief defects found by meeting real code

**1. The dangerous one — a silent click-target collapse.** §F.3's title translate plus §F.2's
stretched link collide: a non-`none` `translate` makes an element a containing block for
absolutely-positioned descendants, so `translate-x-sm` on the `<h2>` re-parents the anchor's
`after:inset-0` from the row to the moving `<h2>` **while hovered**. The click target would shrink
from the full 1852px strip to the title's box on hover, be correct at rest, and **pass tsc, eslint,
build, HTML readback and any screenshot.** Fixed by moving the translate to a `block` span *inside*
the anchor (`block` not `inline-block`: `translate` does not apply to a non-replaced inline box, and
an inline-block's baseline is its last line, which would misalign the numeral against a wrapped
title under `lg:items-baseline`).

**2. Tailwind v4 `translate-x-*` sets `translate`, not `transform`** — so `transition-[transform]`
would have animated nothing.

**3. §H.2's mobile arithmetic is wrong in three places** (none breaking): the "159px text measure"
is actually the sum of the non-text parts (real measure 201px at 360, 216px at 375); "`text-h4`
22.7px @375" is really 21.05px, clamped to its 21px floor at 360 — 22.7px is `text-h4` at a ~733px
viewport; and the row-height sum omits the numeral the brief itself put above the title (real
worst case ~139px, still ≥2.3× the 44px floor).

**4. §F.2's "one line" is not universal** — at exactly 1024 the CCN title runs ~707px into a 680px
measure and takes two lines. Fits the fixed 144px row with 61px spare; recorded so a wrapped title
at the bottom of the `lg` band is not mistaken for a bug.

### ▸ DECIDED (autonomous) — `object-contain`, overruling the design brief

**Defect 5 was flagged for Saad and is ruled here under the standing authorisation.** One word to
reverse.

Design §F.2 specified `object-cover object-top`, following `link-preview.tsx`, justified on the
grounds that `content/projects.ts`'s "DO NOT CROP" governs the cover *at card and detail scale*.

**The source instruction carries no scale qualifier:** *"DO NOT CROP, and do not swap in a
simplified diagram."* `ProjectCard.tsx` restates it as *"`object-cover` is forbidden outright …
which is CONTENT AUTHORITY, NOT TASTE."* Narrowing an unqualified content instruction to a scale
band is a reinterpretation of content, which is not the design brief's to make. **When a design
ruling and a content ruling disagree here, content wins** — that is what "content authority, not
taste" means.

The measurement agrees: CCN is 1600×599, so a 1.6 crop keeps the middle 200/334 of its width and
discards **~40% of a multi-floor topology whose entire subject is how many floors there are** — on
the page whose job is helping someone choose which project to open.

**The cost is stated, not hidden:** `object-contain` letterboxes, so the five thumbnails no longer
share one silhouette — exactly the property `link-preview.tsx` bought with its crop. The box still
reserves constant space, so nothing reflows. **Only this slot changed**; the card and detail page
already show the cover uncropped and were never in conflict.

### Verification gap carried to slice 6

**No browser is available in this environment.** Mobile widths, hover states and the crop decision
above are verified by arithmetic against the *emitted* CSS and real font metrics — not by
screenshot. §7's pass must confirm visually: the CCN thumbnail, the two-line title at exactly
1024px, and whether the hover reveal reads as "opening".


## ▸ BUILT — Slice 5 (`/work` restructure §1 + the fanned deck §2), 2026-08-25

Green. `tsc` clean, eslint **12 problems (9 errors, 3 warnings) — the baseline, unchanged**, all in
untracked Aceternity vendor files. `next build` 17/17 static pages; the `(.)projects/[slug]`
interceptor and all five `/projects/<slug>` pages survive. The built stylesheet was grepped for **69
utilities by exact escaped selector: zero missing.** Nothing committed.

Section order on `/work`, read back out of the prerendered HTML rather than asserted:
`work-projects -> certifications -> experience`, `<h1>` = "Projects.", five fan cards, the control
reads "Browse as a list", Certifications reads "Coming soon.". Currently Learning correctly emits
nothing while its data file is empty.

### ▸ DECIDED (autonomous) — the `layoutId` on the card/panel box was REFUSED

Design §C.7 specifies a shared `layoutId={`deck-card-${slug}`}` on the rest card and the panel, plus a
second on the title. **Neither is built.** Two reasons, both structural rather than aesthetic, both
written into `ProjectDeck.tsx`'s header:

1. **It contradicts §C.7's own exit animation.** The same section requires the four inactive cards to
   exit through `AnimatePresence`. The card that was just clicked is one of the children leaving that
   set, so it stays MOUNTED for the length of its exit — holding the id at the same moment the panel
   mounts holding it too. Two live holders of one `layoutId` is undefined in Motion's projection tree.
   The brief does not resolve this.
2. **Motion documents layout projection as incompatible with `rotate`,** and four of the five rest
   cards are rotated (§C.2). Projection measures with `removeTransform()`, so the morph would begin
   from the card's UNROTATED box — a 2.5°–6° snap on four of five cards.

**Rejected alternative:** build §C.7 literally and hide the inactive cards instead of unmounting them,
so only one holder exists. That fixes (1) but not (2), and it could not be looked at in a browser this
session — a mis-projected panel would have been a shipped defect nobody measured.

**What was built instead is the demo's own mechanic**, which the reference decode states explicitly:
"the card boxes themselves are NOT layout-animated; they are plain `animate` transforms." §2 says to
copy the demo's actual mechanics. Every animated property is `transform` or `opacity`; there is zero
per-frame layout and zero layout READ, which is strictly cheaper than the briefed version.

`project-cover-<slug>` — the overlay morph — **is** kept, and moved onto the panel's cover exactly as
§C.10 requires, since `ProjectCard` left `/work` with the grid. One holder can ever be mounted.

### ▸ DECIDED (autonomous) — the panel is 820×**500**, not 820×480

§C.5's vertical budget totals 386 against a 412 inner height — but it omits the `Close` control that
§C.9 requires as one of the panel's three exits. That control costs 29.8px (16.8 line box + `mt-sm`),
leaving **9.2px** of slack for the worst-case project (CCN: a 2-line title and a 4-line one-liner).
Growing the panel 20px restores 16.2px and **costs nothing anywhere else** — it sits inside the 540px
container either way, the fan's tallest rotated card still reaches only y = 473.1, and the page's
one-viewport sum is unchanged. Rejected: dropping the action row's `mt-lg` to `mt-md`, which buys the
same 13px by making the panel tighter rather than by using slack the container already reserved.

### ▸ DECIDED (autonomous) — Currently Learning KEPT, after Experience

§1 does not list it. It has shipped on `/work` since Ticket 9 and CLAUDE.md calls it "the living part
of the site". Deleting shipped content on an inference from an omission is irreversible; keeping it is
not. **Composition question left open for Saad and recorded in `/work`'s page file:** Certifications
and Currently Learning are now two near-empty sections bracketing Experience. It reads fine today
*only because the second one is invisible* — the day `content/currentlyLearning.ts` gains its first
entry, the page has two thin sections around a full one.

### ▸ DECIDED (autonomous) — deck card titles are `<h2>`, not `<h3>`

`/work`'s `<h1>` is now the deck section's heading and there is no `<h2>` between it and the cards, so
`<h3>` would have skipped a level. Verified off the built HTML: `h1 → h2 ×6 → h2 Certifications → h2
Experience → h3 → h4 → h2 Contact`, no skips. `ProjectCard` keeps `<h3>` because on Home it genuinely
sits one level deeper.

### FOUR DEFECTS IN THE DESIGN BRIEF, FOUND BY MEASURING

1. **§C.7's `layoutId` is not buildable as specified** — see above. The brief's own exit animation is
   what makes it unbuildable.
2. **§C.5's panel budget omits §C.9's `Close` control.** 386 + 29.8 = 415.8 against a 412 inner
   height: the briefed panel **overflows by 3.8px** at the worst-case project, and nothing in the
   brief catches it because the two sections were costed separately.
3. **§H.1's mobile stack does not peek.** The table gives the two cards behind the front one
   `scale 0.94 / 0.88` with `y −13 / −26`. Scaling a box by `s` about the default CENTRE origin moves
   its top edge DOWN by `H(1 − s) / 2`. At the card's real height (~624px at 375px, measured through
   the brief's own content ladder) that is **18.7px and 37.4px** — both larger than the 13 and 26 the
   brief moves them back up by, so **both slabs sit entirely behind the front card and the stack
   renders as a single card.** Fixed with `transform-origin: top center`, which makes the translate
   the whole offset and pivots the rotation at the visible edge. The brief's numbers are correct once
   the origin is; only the origin was missing.
4. **§C.5's cover heights are slightly off** and one is worth correcting for the record: FOLIO renders
   **188**px at a 400px slot, not 182 (1919×902). The others check out (189 / 189 / 150 / 203), and the
   worst case the budget depends on — SNA at 203 — is right.

Also minor and non-blocking: **§C.4's "3 lines ≈ 90px" for the CCN title in the exposed strip is
optimistic** — at `max-w-[180px]` it wraps to 4 lines (~121px). It fits comfortably either way (the
card's inner height is 308px), so nothing changed.

### The spring: **ADOPTED, AND THE RETRACTION TRIGGER DID NOT FIRE**

`SPRING` has **one consumer**: `components/sections/ProjectDeck.tsx`, imported once and applied at
three call sites — the fan's rest/expand/collapse choreography, the panel's scale-and-fade, and the
mobile stack's swipe settle (the same interaction at another orientation, deliberately not given a
different curve). `lib/animation/easing.ts` was updated from "ZERO CONSUMERS" to that, with the three
sites enumerated and the not-fired trigger recorded.

The deck's **content** entrances are deliberately NOT sprung — cover, text column and index rail fade
on `DURATION.ui` + `EASE.reveal`, because a fade is not a settle. The flat-material ruling and the
spring never collided: one governs MATERIAL, the other MOTION.

**`docs/03_FRONTEND_SPEC.md` still says ZERO CONSUMERS and is owned by slice 4 this window.** Its
correction is in slice 5's report for the coordinator to apply.

### Comments corrected in the same change (the repo's recorded failure mode)

`Projects.tsx` (Home-only now; `motion="reveal"` has zero call sites and is kept-and-labelled like
`STAGGER.card`; J.1's written refusal annotated with the reversal's justification for slice 6),
`ProjectCard.tsx` (three holders of `project-cover-*`, not two), `Experience.tsx` (SECOND → THIRD
section), `CurrentlyLearning.tsx` (THIRD → LAST + the keep-it ruling), `standaloneNav.ts` (six → seven
consumers, TWO → THREE `<button>` call sites), `ExternalLink.tsx` (**"all five consumers are server
components" is now substantively false** — the deck is a client component; the rule was restated so it
still holds), `link-preview.tsx` (it quotes that sentence), `aboutButtonStyles.ts` (§J.9's note),
`README.md` and `docs/01_PRD.md` (`/work` route rows + the primary-path walkthrough).

### Outstanding, and both need a browser

- **No Performance-panel capture.** No browser automation is installed and adding one was out of
  scope. The static budget is in `ProjectDeck.tsx`: 9 animated elements at peak, 18 property writes
  per frame, every one `transform` or `opacity`, and **zero layout reads anywhere in the transition** —
  which is the mechanism behind almost every blown budget in this class of component. The one thing a
  capture could still catch is the spring's tail (`visualDuration` is perceived arrival, not settle).
- **§7's screenshot matrix.** Only two of the four button variants exist in real data (three buttons:
  FOLIO / Aero-Grid / ClashChat; one button: CCN / SNA), as this file already records.

## ▸ FIXED — slice 4 review findings, 2026-08-25 (coordinator, autonomous)

### 1. CRITICAL, and it was a real functional bug — the cover ate the clicks

`ProjectStripRow.tsx` — **a click on the thumbnail did not navigate**, at `lg`+, in the exact moment
the design is built around: hover the row, watch the cover fade in, click it, nothing happens.

`fill` on the `<Image>` forces `position: relative` on its wrapper, making it a positioned box with
`z-index: auto`. The row's stretched link (`after:inset-0` on the `<a>`) is also positioned and also
`z-index: auto`, and lives inside the FIRST flex child. Among positioned `z-index: auto` boxes in
one stacking context the later one paints on top — and at `lg`+ the cover is later in both document
order and order-modified order (`lg:order-last`). **`lg:opacity-0` does not save it**: opacity zero
still hit-tests, so the dead region existed at rest too, before anything was visible.

**Why slice 4's own analysis could not have caught it.** Its `<h2>` containing-block fix reasons
about ANCESTORS of the stretched link. This is a SIBLING SUBTREE painting over it — a different
failure with the same symptom and the same invisibility to `tsc`, ESLint, `next build`, HTML
readback and every screenshot. `ProjectCard.tsx` is not a precedent despite shipping the same
stretched-link device: its cover wrapper is `position: static`. **`fill` is what changed the
situation, and `fill` is new to this row.**

Fixed with `pointer-events-none` on the wrapper, chosen over `after:z-10` because it states the
intent (the image is decoration, never interactive) and cannot be undone by a future z-index.
Verified in the prerendered HTML.

### 2. The blur placeholder cropped while the image letterboxed

`next@16.3.1`'s `get-img-props` reads `objectFit` from the **prop or `style`, never from
`className`** — and `undefined` is a member of its `INVALID_BACKGROUND_SIZE_VALUES`, so the blur
plate fell through to `background-size: cover`. Visible result: a 125px-tall blurred plate snapping
to a 75px sharp image on load, five times over on a lazily-loaded page. Fixed by also passing
`style={{ objectFit: "contain" }}`, which feeds both the background sizing and the SVG's
`preserveAspectRatio`. **Verified: `background-size:contain` in the rendered markup, was `cover`.**

An unintended consequence of the coordinator's own `object-contain` ruling — the ruling stands, its
implementation was incomplete.

### 3. Four files named their own trigger, and this slice fired it

Each said `/projects` "holds nothing under the scroll lock … until the strip rows land". The rows
landed the same day; the page is now ~1280px tall at 1440 and scrolls at every shipped viewport, so
the lock does real work. Fixed in `app/globals.css`, `components/intro/IntroGate.tsx`,
`docs/06_INTRO_AND_CHROME.md` and `docs/01_PRD.md` — the last still described the page as "a heading
and a fixed Close; the strip list is a later slice".

Each correction records that the sentence was true for about an hour, rather than quietly rewriting
it. **A sentence that names its own trigger is the easiest kind to leave stale**, and this build has
now demonstrated that twice.

### 4. The false reachability claim is closed

`docs/03`'s *"`/projects` is reached from `/work` and from Home"* — false on the day it was written
and still false, since both buttons are later slices. Rewritten to state what is true now, with the
original preserved and labelled, because it was introduced **by the documentation sweep whose entire
purpose was removing untrue present-tense claims**. That is the most useful thing about it.

Also closed: `docs/03`'s `fade` call-site enumeration (three consumers, not two) and its "all three
chrome routes" toggle claim (four).

### Answered for the reviewer, which cannot run commands

`translate-x-sm` and `translate-x-md` **do compile** — `.translate-x-sm{--tw-translate-x:var(--spacing-sm);translate:…}`
and the `lg:motion-safe:group-hover:` variant both present in the emitted stylesheet. The title
shift and the cover's 21px entrance are real, not silently inert.

### Left for slice 5 / slice 6

- **`standaloneNav.ts` contradicts itself three ways** — "seven consumers" (line 2), "THE SIX"
  followed by an enumeration of seven (line 29), "All six consumers sit on `bg-base`" (line 75).
  Slice 5 added the seventh and updated only line 2. Its own header says in capitals that the count
  is load-bearing. **Whoever touches it next owns the whole file.**
- **The S-1 sweep count is stale in the OTHER direction now** — slice 5's `Certifications.tsx` and
  `ProjectDeckSection.tsx` are on disk, so the real count is 14, not the twelve `docs/03` claims.
- At `lg`+ the row is a hard `lg:h-3xl` with no overflow guard: three lines of `text-h3` fit
  (123.6px), four would spill silently. Wants the same character-ceiling note `ProjectBreadcrumb`
  carries.
- **Add "does a click on the thumbnail navigate" to §7's browser pass.** It is the one item on that
  list that was a functional bug rather than a judgement call.

## ▸ RESOLVED — the SPRING retraction risk did NOT fire, 2026-08-25

Carried as a live risk from slice 1 to slice 5 and escalated in the standing authorisation as the
one thing not to decide alone. **It resolved itself: the deck springs.**

`SPRING` has a real call site — `ProjectDeck.tsx` imports it once and applies it at three places:
the fan's rest/expand/collapse choreography, the panel's scale-and-fade, and the mobile swipe
settle. The deck's *content* entrances are deliberately NOT sprung (cover, text column and index
rail fade on `DURATION.ui` + `EASE.reveal`) because a fade is not a settle.

**The flat-material ruling and the spring never collided**, which is the thing the risk turned on:
flat governs MATERIAL (radius, shadow, fill), the spring governs MOTION. So the fourth curve family
Saad added on an explicit design-system call is a live part of the system rather than an orphan, and
nothing has to be unwound.

Both `easing.ts` and `docs/03` are updated. `docs/03` also records that the consumer count was wrong
in BOTH directions before this — "One consumer" when there were none (slice 1, caught by review),
then "ZERO CONSUMERS" until the deck landed. A curve family's consumer count is the one number that
decides whether it should exist at all, so both errors are recorded rather than smoothed over.

## ▸ FIXED — coordinator items after slice 5, 2026-08-25

Slice 5 correctly declined to edit `CLAUDE.md` on an agent instruction, and flagged three things it
had not falsified itself. All applied:

| Item | Resolution |
|---|---|
| `CLAUDE.md`'s `/work` route row | Rewritten: deck · `Browse as a list` · Certifications · Experience · Currently Learning · footer, heading "Projects." with the navbar label unchanged, card click opens the overlay |
| `ProjectOverlay.tsx:309` and `@modal/(.)projects/[slug]/page.tsx:29` | Both claimed CCN and SNA are "only ever reached from `/work`". `/projects` lists all five, so they now have two in-app entry points. Neither was falsified by slice 5 — **the `/projects` route did it, three slices earlier** |
| `docs/03`'s S-1 sweep count | **Re-counted independently, comments stripped: 14 real containers across 14 files.** The number moved twice on the same day in opposite directions — `/projects` added spine-aligned (13), moved to full-bleed under the new exception (12), then slice 5's two new sections (14). Stated once with that history rather than adjusted twice |
| `standaloneNav.ts` contradicting itself three ways | "seven consumers" (line 2), "THE SIX" heading over an enumeration of seven (line 29), "All six consumers" (line 75). Slice 5 appended the deck's `Close` to the list and the top count but not the other two. All three now read SEVEN; the header's own opening line says the count is load-bearing, which is exactly why it fell out of sync in three places |

## ▸ NOTE — Certifications and Currently Learning, the open composition question

Slice 5 answered the flag raised when `Currently Learning` was kept: **it reads fine today ONLY
because it renders nothing.** `content/currentlyLearning.ts` is an empty array. The moment it gains
one entry, `/work` has two thin sections bracketing Experience — Certifications ("Coming soon.")
above and a one-item Currently Learning below. **That is the version worth looking at before
deciding**, and it is recorded in `work/page.tsx` as an open question rather than resolved blind.

Second, smaller tension, also recorded rather than resolved: the Certifications line is
`text-caption font-mono` per design §J.12, but **`Skills.tsx` argues against mono for its own empty
line in as many words** — *"set in 12px mono it would read as a code comment or a TODO, on the one
part of the site whose whole job is to be believed."* Slice 5 followed the brief and noted the
conflict; the distinction it drew is that Skills' line is a full sentence (body scale) and this one
is two words (label scale). **It is a one-class change** if Saad prefers Skills' treatment.

## ▸ FIXED — slice 5 review, the two that mattered, 2026-08-25 (coordinator)

### 1. THE THIRD SILENT CLICK-TARGET BUG OF THIS BUILD

The four inactive fan cards animate to `opacity: 0` and stay mounted (deliberately — it is what
lets them fly back). **Opacity zero still hit-tests.** They remained live buttons, `cursor-pointer`
and all, under what reads as empty deck background — and their handler unconditionally re-expands,
so **a click on dead space switched project instead of collapsing the panel.**

Measured at `xl`+ with a panel open: the panel holds x 0–820 and the rail x 875–1075, both `z-30`
and correctly painting above. The invisible live regions were the **55px gutter between them**
(y ~95–445) and the bands above and below the rail's text (x 875–1083). Of the three declared exits,
click-on-background was only reliable to the RIGHT of x≈1083 — **a ~19px strip at 1280.**

Fixed with `pointer-events-none` gated on `anyActive`; `cursor-pointer` moved into the same ternary,
because a pointer cursor over an unclickable region is the visible half of the same lie.

**Three occurrences, three different mechanisms, one class:**

| Where | Mechanism |
|---|---|
| `ProjectStripRow` cover | positioned sibling with `fill` painting over a stretched link |
| `ProjectStripRow` `<h2>` | a `translate` would have re-parented the link as a containing block |
| `ProjectDeck` inactive cards | invisible element never told to stop listening |

**All three passed `tsc`, ESLint, `next build`, HTML readback and every possible screenshot.** The
rule now written into the deck: *if you add anything that goes invisible without unmounting, gate
its pointer events in the same commit.*

### 2. A CLAIM THE COORDINATOR WROTE, CALLED MEASURED, AND HAD WRONG

`BRUTAL_MOTION` shipped `transition-[box-shadow,transform]`. **Tailwind v4 writes the `translate`
property, not `transform`** — `.hover\:-translate-x-\[2px\]:hover` emits
`--tw-translate-x: calc(2px * -1); translate: …`. So the list named a property nothing on the
control ever sets, and **the travel snapped while only the shadow eased.**

That falsified the arithmetic in the docblock beside it. The three-state description says the
shadow's far corner does not move; with the travel snapping and the shadow easing, the far corner
travelled **inward 2px on hover and eased back out over 200ms** — the exact wobble the paired
numbers were chosen to prevent. It was written as measured and was not.

Fixed to `transition-[box-shadow,translate]`; `projectButtonStyles.ts` imports the atom so both
surfaces inherit it. Verified in the emitted CSS.

**The same Tailwind v4 fact was independently rediscovered twice in this build** — slice 4 hit it on
`transition-[opacity,translate]`. Treat any `transition-[…transform…]` in this repo as suspect until
checked against emitted CSS. **Swept: one other occurrence, `Navbar.tsx:1252`, and it is CORRECT** —
the indicator sets `transform: translateX(...)` as an inline style, so `transform` is the right
property there. Checked rather than assumed.

### Answered for the reviewer, which cannot run commands

Cover dimensions read from the PNG headers: **FOLIO 188.0px** at a 400px slot (slice 5 was right,
the design brief's 182 was wrong), aero-grid 188.6, clashchat 188.5, ccn-network 149.8, and
**SNA 203.3 — the binding worst case, as claimed.**

### Delegated — the remaining nine findings

An implementer is closing: the `Certifications` `Reveal` firing behind the Intro plate at
`innerHeight ≳ 1046` (confirmed by arithmetic, real behaviour bug on 2560×1440 and 16:10 laptops);
`IntroEntrance.tsx`'s header falsified throughout and never touched — including a re-measure trigger
that **fired in slice 5** when the archive grid left the page; the fan's hover silently inheriting
`SPRING` as an undeclared fourth use of a deliberately-scoped curve; three inaccurate `ProjectDeck`
comments (notably that "two live holders of one `layoutId` is undefined behaviour" — Motion supports
it, and it is how this site's own morph works, so the decision stands on its rotate reason alone);
`standaloneNav.ts`'s contrast figures being derived against `bg-base` when consumer 7 sits on
`bg-elevated`; and the third-surface trigger for the brutal atoms **having already fired** —
`link-preview.tsx` carries a verbatim second copy of the five-layer shadow, so the warning against a
second copy was written while one existed.


## ▸ BUILT — Slice 6 (Home's `Browse as a list` §5 + the three standing verification passes), 2026-08-25

Green. `tsc` clean, eslint **12 problems (9 errors, 3 warnings) — the baseline, unchanged**, all in
untracked Aceternity vendor files. `npm run build` 17/17 static pages; the `(.)projects/[slug]`
interceptor and all five `/projects/<slug>` pages survive. Nothing committed.

**Only Home changed, and it is proved rather than asserted.** `/about`, `/work`, `/projects` and
`/projects/folio` prerender **byte-identically to the pre-change build** (script bodies emptied,
content-hashed URLs normalised). `/` differs by **exactly one insertion** — the control and its
wrapper — and the **emitted stylesheet is byte-identical** (70,134 bytes both), so the control
introduced **zero new utilities**. All 30 of its class names were grepped in the built CSS by exact
escaped selector: 0 missing.

| File | State | What |
|---|---|---|
| `components/sections/Projects.tsx` | edited | the control, plus the reversal of this file's own written refusal of it |
| `components/sections/projectDeckContent.ts` | comments | `DECK_BROWSE_AS_LIST_LABEL` is a two-call-site constant now |
| `components/sections/projectButtonStyles.ts` | comments | `PROJECT_BUTTON_NAV` is a two-call-site dressing now |
| `components/about/aboutButtonStyles.ts` | comments | the brutal atoms paint on three routes now. **This entry originally read "the 'third surface' trigger counts modules and has not fired" and was SUPERSEDED the same night by a concurrent agent**, correctly: `link-preview.tsx` carried a verbatim second copy of the shadow string rather than importing it, so the module count was artificially low and the trigger HAD fired. That file's header carries the corrected version; this row records that slice 6 got it wrong |
| `app/(site)/(chrome)/page.tsx` | comments | the CCN/SNA reachability paragraph, all three clauses of which were false |
| `content/projects.ts` | comments | "`/work` … the ONLY route that links to their detail pages" |
| `app/layout.tsx` | comments | the no-JS record: `/projects` and the rebuilt `/work` added, and the false "`/work` shows all five cards" corrected |
| `app/globals.css` | comments | the scrollbar-release table, honestly qualified in two places |
| `docs/03`, `docs/01`, `docs/04`, `docs/07` §5, `CLAUDE.md`, `README.md` | edited | the sweep headers, the route rows, the reachability claims |
| `.claude/handoff/projects-architecture-verification.md` | NEW | §7's matrix, every item VERIFIED or NEEDS-BROWSER |

### ▸ DECIDED (autonomous) — Home takes `/work`'s label VERBATIM, and the string is IMPORTED

Saad's ruling of 2026-08-25 relabelled `/work`'s exit "Browse as a list" because the deck and
`/projects` hold the same five projects. **From Home the arithmetic is different — three cards here,
five rows there — so "View All Projects" would have been literally true on this surface.** The
question the ruling did not have to answer was therefore open: do the two surfaces want the same
string?

**Ruled: yes, one string, imported rather than copied.** Two reasons, the second load-bearing:

1. The design brief §G already commits both surfaces to an identical label — *"two pages, one
   control, one destination"*. Saad's ruling changed the STRING, not that identity. Two different
   words for one control pointing at one page is a worse outcome than one slightly modest word.
2. **"View all projects" promises the ARCHIVE, and the archive is `/work`, which the navbar already
   offers.** A control that promises the archive and delivers a differently-presented list of the same
   five is the label doing the lying — which is the exact failure Saad's ruling was correcting, just
   arriving from the other direction. "Browse as a list" is true on both surfaces and stays true if
   Home's featured count ever changes.

**Rejected alternative:** a second constant in `projectsContent.ts` holding the same string, so the
`DECK_` prefix would not be a misnomer on Home. Refused — the two are equal **by intent**, not by
coincidence of surface, so a copy would drift the first time the wording was retuned and the drift
would be invisible until someone opened both pages side by side. (That is the inverse of
`PROJECT_BUTTON_NAV`'s own case, where `bg-base` matches `ABOUT_BUTTON_SECONDARY` by coincidence and
the duplicate constant is correct.) **Declared cost:** the `DECK_` prefix is now a slight misnomer on
one export. Renaming it, or moving it to `projectsContent.ts`, touches three files for zero rendered
change; the constant's own docstring records that **a third surface is the point to move it**.

### ▸ DECIDED (autonomous) — the control is rendered UNCONDITIONALLY, with no prop to suppress it

`Projects.tsx`'s `motion` prop is required-with-no-default precisely so a second caller cannot silently
inherit Home's animation. The symmetric move would have been a required `browseAll` prop.

**Refused, on the asymmetry between the two failure modes.** An omitted `motion` renders a
correct-LOOKING page that animates wrongly — silent, and the exact bug that prop exists to catch. A
second caller inheriting this control renders a **visible duplicate link**, caught by looking at the
page once. Machinery is spent on the silent failure, not the loud one, and today there is no second
caller to spend it for (`/work`'s half of the pair is `ProjectDeckSection`'s, not this component's).
The reasoning is in the file so the next person does not have to re-derive it.

### ▸ VERIFIED — the control is genuinely outside the scrub, off the build rather than by reading the code

§5 requires it to stay out of Home's ScrollTrigger choreography. `data-scrub-unit` count inside
`<section id="work">` in the prerendered HTML is **4** — the `<h2>` and the three cards — and the
control is not one of them; its parent is a plain `<div>`. `ScrubReveal` creates one ScrollTrigger per
instance with `trigger: el`, and there is no section-level trigger on the page, so an element that is
never wrapped cannot be swept in. It also ships at full opacity with no `data-reveal`, so it needs no
`<noscript>` net.

### ▸ FINDING — `--color-brutal-edge` does not flip, and two docblocks say it does

**Found by the theme sweep, and it is not on `/projects`.** The token is declared once, `#8f8f8f`, and
`html.light` deliberately does not override it. Both docblocks in `app/globals.css` state the
non-override correctly and then describe its consequence wrongly: the dark block says light "inherits
the value below … and #151515 on #fdfcfa is the canonical Brutal look", and the `html.light` block
warns that inheriting the dark grey "would wash the edge out to 3.5:1" — which is exactly what
happens. Computed from the real hexes, **`#8f8f8f` on `#fdfcfa` is 3.16:1**.

It **passes** WCAG 1.4.11's 3:1 UI-boundary floor with 0.16 of headroom and is never used as text, so
this is a documentation falsehood and a quality question, **not** an accessibility failure.

**NOTHING WAS CHANGED — changing a colour token is Saad's call**, and this is the same class of
decision as the fourth curve family. It is flagged because the treatment now paints on three routes
and five render sites, and slice 6 added the fifth. If light should get `#151515` as both docblocks
assume, it is one line in `html.light`; if `#8f8f8f` is right in both themes, it is two comment
corrections. Recorded in `docs/03_FRONTEND_SPEC.md` beside the sweep.

### ▸ FINDING — the deck cost `/work` its no-JS access to four of five projects

**Found by the no-JS pass, recorded not fixed.** The fanned deck is five `<button>`s where the old grid
was five `<a>`s, so with scripting off no project is navigable from the deck. All five are *nameable*
(five card `aria-labelledby` titles and five pager `sr-only` names ship in the markup), and the only
project content in the HTML is the mobile stack's front card, FOLIO, whose Details / GitHub / Live Site
links are real anchors and do work.

**The no-JS route to the other four is the `Browse as a list` exit**, which is a plain `<Link>` to a
page that lists all five as real anchors. So `/work` is not a dead end — but that exit is load-bearing
in a way nobody designed it to be, and the same is now true of Home's copy of it. `app/layout.tsx`'s
claim that `/work` "shows all five cards with their covers" was corrected in the same change. **Making
the deck degrade to five links is a design decision, not a comment fix.**

### The three standing passes, honestly

- **Theme sweep — PARTIALLY DONE.** The static rows (hex literals, `dark:`, sub-`/70`, the rendered
  token census) were run across all five route shapes and are clean. The two rows that carry the real
  weight — 348 text nodes against a size-aware contrast floor, 1340 property-instances diffed
  dark-vs-light — are still the 2026-08-22 browser run over four route shapes. `docs/03`'s heading no
  longer calls itself "whole-site … all four route shapes"; it is split by METHOD.
- **No-JS pass — PARTIALLY DONE**, from the prerendered markup. Nobody has *looked* at either page with
  scripting off.
- **Scrollbar-release measurement — NOT DONE, AND NOT DOABLE HERE.** It needs a **headed** browser: the
  block's own text records that headless Chromium's overlay scrollbars make `innerWidth - clientWidth`
  zero, so the mechanism never fires. **No number was invented.** The table now states that `/projects`
  is still unmeasured after this pass too, and that `/`'s 79 is a 2026-08-22 count taken before Home
  grew this control — expected not to shift, not re-run, not to be updated without running it.

### Also flagged, not fixed

- **`docs/03`'s "112 tab stops. Zero problems."** predates `/projects` and the deck; Home gained one
  stop. A dated qualifier was added. Home's new stop is settled by identity (`BUTTON_BASE`'s ring, the
  same constant the sweep verified on `/about`, at 7.95:1 dark / 5.34:1 light on `bg-base`); the deck
  and `/projects` are not settled and need a real tabbing pass.
- **`docs/01`'s primary-path step 1 still describes the retired ×17 zoom-in as current.** Unrelated to
  this build; the spec's slice-3 record claims that file's four zoom-in references were corrected, and
  this is a fifth.

## ▸ FIXED + DECIDED (autonomous) — slice 5 review findings, 2026-08-25

Eight findings closed against the fanned deck / `/work` restructure. Nothing committed. `tsc` clean,
ESLint **12 problems (9 errors, 3 warnings) — the baseline, unchanged**, all in the four untracked
Aceternity vendor files. `next build` 17/17 with the route table intact. `/`, `/about`, `/projects`,
`/projects/folio` and `/work` are **identical to baseline** once `<script>` bodies and content-hashed
chunk URLs are normalised out, and the emitted stylesheet is **byte-identical** — which is also the
strongest available answer to "did any new utility appear": none did, because the CSS did not change
at all.

### 1. BEHAVIOUR BUG — `Certifications` animated behind the Intro plate on tall displays

**Confirmed by arithmetic against the shipped class strings**, read back out of the prerendered HTML
rather than taken from the design brief. The deck section stacks to **949.6px**
(`89 + 74.8 + 55 + 540 + 55 + 46.8 + 89`), so Certifications' `<h2>` top is **1038.6px** and
`Reveal`'s `amount: 0.1` trigger is at **~1046px** of visible document. That is inside the fold at
2560x1440 (~1305px of real `innerHeight`), a viewport on `IntroEntrance`'s own tested list — so the
heading and "Coming soon." fired on the first observer tick and were settled behind a plate that is
opaque until ~2.4s.

**DECIDED (autonomous): swap to `IntroEntrance`, do not merely correct the comment.** That is what
`IntroEntrance`'s own selection rule says ("the units that can be above the fold at SOME viewport"),
and the wrapper is self-selecting in the other direction — below the fold it behaves exactly as
`Reveal` did. **Rejected alternative:** correcting the comment to state the real 1046px threshold and
leaving the defect shipped. That documents a known bug on a tested viewport instead of closing it, and
the fix is two component names.

**Declared cost, and it is the one `IntroEntrance` already declares:** on the common 945px window the
section is below the fold, so its reveal now carries the 0.30s onset — ~316ms in-view-to-visible
instead of ~216ms. Already paid by all three units the deck section wraps.

**`Experience` deliberately left on `Reveal`:** its `<h2>` top is 1363.2 and its trigger ~1370.7,
clear of ~1305 by 66px. **Arithmetic, not a browser measurement** — stated as such in the file, with
the instruction to re-check it if anything above shrinks.

### 2. `IntroEntrance.tsx` was falsified throughout and had never been touched

`docs/06` points at this file as the one that "carries the table and the measured figures". Every
enumeration in it described the retired five-card grid. Corrected following this repo's convention of
**dating and qualifying a measurement rather than inventing a replacement** — no browser was available
and no figure was fabricated:

- The consumer header now reads **two ROUTES, three call-site files** (`AboutScreen`,
  `ProjectDeckSection`, `Certifications`), and states that the old "`/work`'s `Projects` section
  (`motion="reveal"` branch only)" is wrong twice over: `Projects` does not render on `/work`, and
  that branch has **zero call sites anywhere**.
- The **fourteen-viewport intersection table is kept and marked historical**, dated 2026-08-22 against
  the grid, with a plain statement of which figures are stale (every row; the 1981px Experience
  figure, now 1274.2), what would have to be re-run (a browser capture), and what stands in for it
  meanwhile (the arithmetic above). Kept rather than deleted because its SHAPE — that the wrapped set
  is viewport-dependent and the component must not try to predict it — is what the paragraph above it
  rests on, and that is unchanged.
- **The table's own "IF THE ARCHIVE EVER SHRINKS BELOW THREE CARDS, re-measure" trigger is recorded as
  HAVING FIRED and having been missed.** The grid left the page entirely, which is the same hazard
  several times over.
- The two "cards 2-5" penalty measurements are dated and their identifiers marked historical, with the
  distinction stated: the FIGURE is a property of the onset and carries over, the unit names are
  properties of a page that no longer exists.
- The `delay` prop's "`/work`'s six" is now five (three + two), with the old count explained.
- The "NO PATHNAME CHECK" argument's `/work` clause was rebuilt: it rested on `Projects`'
  `motion="reveal"` branch, a code path with no call sites. The two components now named are
  single-route by construction rather than by prop, which is a stronger version of the same guarantee.
- Same-change corrections at the places that point here: `docs/06` (two ROUTES / three files, and the
  pointer sentence now says the table is dated and historical), `app/(site)/(chrome)/projects/page.tsx`
  (x2), `components/intro/Intro.tsx`, `app/(site)/(chrome)/work/page.tsx`.

### 3. The fan's hover inherited `SPRING`, undeclared — both halves of the remedy applied

Confirmed: `whileHover={{ y: rest.y - 13 }}` took the component's `transition={SPRING}`, so a lift
specced at `DURATION.micro` + `EASE.ui` shipped as a 600ms bouncy settle.

**The lift now carries its own `{ duration: DURATION.micro, ease: EASE.ui }`.**

**DECIDED (autonomous): the RETURN leg cannot take that curve, and is ENUMERATED in `easing.ts` rather
than hidden.** A transition inside a gesture target applies on the way in only; on hover end Motion
re-applies the lower-priority `animate` target, and "hover out" and "re-apply the base target" are the
same operation, so there is no declarative hook for a different curve there. `SPRING`'s scope list now
names this fourth use explicitly, as a consequence of Motion's gesture model rather than a design
decision, with "must not be cited as precedent for springing another hover". **Two rejected
alternatives, recorded at both sites:** a React `hovered` state folded into `animate` — the transition
would then have to be chosen per CAUSE, because a flat `anyActive ? SPRING : micro` takes the COLLAPSE
off the spring and the collapse is one of the three uses the spring is actually scoped to; and
splitting the card into an outer animated element plus an inner hover target — structurally clean, but
the lift would compose inside the card's rotation (13px along the card's axis, not the page's) and
`hover:z-20` would move into a stacking context the outer element creates, so a lifted card could be
occluded by its neighbours. Neither is checkable without a browser.

### 4. Three comment errors in `ProjectDeck.tsx`

- **"Exactly one holder ... can ever be mounted" -> one SOURCE.** False in the exact moment the id
  exists for: while the overlay is open the panel's cover AND `CoverFrame` both hold
  `project-cover-<slug>`, and that two-holder state IS the morph. The invariant that actually matters
  is that this page contributes at most one holder to the pair.
- **The `layoutId` refusal's reason 1 is WITHDRAWN, not deleted.** "Two live holders of one `layoutId`
  is undefined behaviour in Motion's projection tree" is not accurate — Motion supports concurrent
  holders (latest-mounted leads, previous follows) and it is the mechanism this site's own card ->
  overlay morph runs on. The original text is quoted, marked withdrawn, and the decision stands on
  reason 2 (`rotate` / `removeTransform()`), which is sound and sufficient alone. `DeckCover`'s
  related refusal was re-argued on the accurate ground: the hazard there is two PERSISTENT holders
  with no transition between them, one inside a `display: none` subtree measuring 0x0.
- **"THERE IS NO LAYOUT READ ANYWHERE IN THE TRANSITION" -> nothing reads layout PER FRAME**, with
  both exceptions named: the panel's cover carries `project-cover-<slug>` inside the scaling panel
  (dormant until its partner mounts — a different interaction), and `DeckStack` uses `AnimatePresence
  mode="popLayout"`, which is a layout-projection mode measuring the exiting child once per committed
  swipe. The substance of the budget is unaffected and the trigger is stated: if a `layout`,
  `layoutId` or `popLayout` is ever added to something that moves DURING the expand, the budget stops
  holding.

### 5. `standaloneNav.ts`'s contrast claim (not its count)

"All seven consumers sit on `bg-base` ... 7.95:1 in dark, 5.34:1 in light" — six do. Consumer 7 is the
deck panel's `Close` and the panel is `bg-elevated`. **Computed from `globals.css`'s hexes rather than
trusted:**

|  | dark | light |
|---|---|---|
| on `bg-base` | 7.95:1 (#14b8a6 on #0a0a0b) | 5.34:1 (#0f766e on #fdfcfa) |
| on `bg-elevated` | **7.52:1** (on #121214) | **4.98:1** (on #f4f4f4) |

The dark figure matches `globals.css`'s own "accent-working holds 7.5:1 on elevated"; the light one
was never written down anywhere, which is how a header could quote a number for a surface nobody had
checked. **No accessibility failure** — 4.98:1 clears AA for normal text with room. The
`/70`-is-not-an-option note below it was also derived against `bg-base`; it now states that on
`bg-elevated` the figure is **2.91:1** in light, i.e. the conclusion holds a fortiori but the
arithmetic does not travel and must be re-run rather than quoted.

### 6. The third-surface trigger HAD fired, and the reason it looked otherwise is the defect itself

`link-preview.tsx:207` carried a **verbatim second copy of the five-layer shadow string** as an inline
class. So `projectButtonStyles.ts`'s "Do not paste the class strings here. A second copy of a
five-layer shadow is a second source of truth" was written while a pasted copy already existed one
directory away — and `aboutButtonStyles.ts`'s header reported the trigger as NOT fired by counting
*modules that import the atoms*, a count the duplication was artificially holding down.

**DECIDED (autonomous): close the duplicate now, defer the move.** `link-preview.tsx` imports
`BRUTAL_SHADOW` (client boundary checked — `aboutButtonStyles.ts` is directive-free on purpose, and
that is now stated in its header as load-bearing rather than incidental). `aboutButtonStyles.ts`
states plainly that the trigger HAS fired, names the three surfaces, and records that the move to
`components/ui/` is **outstanding and Saad's to schedule**, with the strongest argument for it on the
record: a `components/ui/` primitive reaching into `components/about/` for a class string is
backwards. **Rejected alternatives:** (a) performing the move — it touches five files, two of them
held by concurrent agents this session, and a file move is the least reviewable diff available and is
verified by nothing the build reports; (b) leaving the copy and documenting it in both headers — that
keeps a second source of truth for a five-layer shadow alive for the sake of a tidier import graph.

`projectButtonStyles.ts` was **deliberately not edited** (slice 6 owns it this window); its text
remains true as written.

### 7. Three minor items

- **(a) The "a bounced opacity is nothing" contradiction.** `CONTENT_IN`'s docblock used that as its
  reason for not springing, while `DeckPanel` and the mobile card spring their opacity. **Comment
  corrected, code unchanged**, and the observation is why: opacity clamps to [0,1], so the spring's
  overshoot past the target is not rendered and those two elements fade on the spring's approach
  alone. The real distinction is now stated — the panel's opacity belongs to a BOX that is arriving,
  so it rides that box's curve; `CONTENT_IN` is for content with no box arriving under it.
  **Rejected:** a per-property transition override to take opacity off the spring, which adds a fourth
  transition object to buy an effect that is invisible by construction.
- **(b) A `requestAnimationFrame` side effect inside a `setActiveSlug` updater.** A real correctness
  bug — updaters must be pure and StrictMode double-invokes them, so every collapse scheduled two
  `focus()` calls. Rewritten to read `activeSlug` from the closure with a `useCallback` dep and an
  early return, which also makes the container's background click a genuine no-op when nothing is
  open.
- **(c) The expanded deck left its `<ul>`/`<li>`s in the accessibility tree.** The five buttons were
  `aria-hidden` but their list wrapper was not, so a screen reader announced "list, 5 items" with five
  empty items beside the open panel. `aria-hidden` now goes on the `<ul>`. The per-card `aria-hidden`
  is kept alongside `tabIndex={-1}` — an `aria-hidden` ancestor does not make a descendant
  unfocusable, and keeping the pair together is what makes "no focusable descendant inside
  `aria-hidden`" true by construction rather than by reading two attributes in two places. Nothing is
  lost from the tree: the rail is a real `<nav>` carrying all five names.

### 8. The two SUSPECTED items

- **A swipe starting on `Details` / `GitHub` firing that control's click: GUARDED, not verified.**
  Framer's drag does not cancel a descendant's click — the anchor translates with the finger, so
  `pointerdown` and `pointerup` resolve to the same element and a real `click` is dispatched. A
  `draggedRef` set in `onDragStart` and read in `onClickCapture` suppresses it (capture phase, so
  React's dispatch stops before the anchor's own `onClick`; `preventDefault` covers the two
  `ExternalLink` anchors, whose navigation is the browser's default rather than a handler).
  `onDragStart` is the right signal because Motion fires it only once its own drag threshold is
  crossed, so a tap is unaffected and the guard is inert unless a drag actually happened. **Added
  despite being unverified precisely because the cost of being wrong is zero.** For the browser pass:
  swipe starting on `Details`, and a plain tap on `Details`.
- **The hidden mobile `DeckCover` downloading on desktop: RECORDED AS BROWSER-ONLY, claim withdrawn.**
  The header asserted these covers "never download" because a lazy image with no layout box cannot
  intersect the viewport. `loading="lazy"` is a browser heuristic, not an `IntersectionObserver`, and
  Chrome's has not reliably skipped `display: none` subtrees — so the assertion is withdrawn rather
  than defended. **The exposure is narrower than it looked and is one-directional**, which is now
  stated in the file: at `xl`+ the hidden mobile branch renders exactly ONE cover (the front card's,
  `projects[0]`, at `sizes` ~870px); below `xl` the hidden desktop branch renders NONE, because
  `DeckFan`'s only cover is inside `DeckPanel`, which mounts on activation and a `display: none` card
  cannot be activated. To settle: `/work` at 1280+, empty cache, look for the `/_next/image` request.
  **Explicitly forbidden as a "fix": gating the mobile subtree on a client-side breakpoint** — that is
  the first-paint mismatch the two-subtree design exists to avoid.

### Not settled without a browser

The hover RETURN leg's spring (finding 3), the swipe/click guard (8a), the hidden-cover download (8b),
and the Performance-panel capture slice 5 already carried as outstanding. Nothing else is open.

## ▸ BUILT — Slice 6 (Home's button + the standing passes), 2026-08-25

Green, 17/17. Home's control ships directly after the featured `<ul>`, inside the same spine
container, importing `DECK_BROWSE_AS_LIST_LABEL` and `PROJECT_BUTTON_NAV` rather than copying
either. **Emitted CSS byte-identical to the pre-change build (70,134 bytes both) — zero new
utilities.** `/` differs by exactly one insertion; `/about`, `/projects` and the detail pages
unchanged.

**Outside the scrub, verified off the build:** `data-scrub-unit` count inside `<section id="work">`
is 4 (heading + three cards) and the control is not one. `ScrubReveal` makes one ScrollTrigger per
instance with `trigger: el` and there is no section-level trigger, so an unwrapped element cannot be
swept in. §5's requirement met mechanically rather than by intent.

**The label question, answered rather than assumed.** From Home, "View All Projects" would be
literally true — three cards here, five rows there — so the ruling's reasoning does not
automatically transfer. Kept identical anyway: "view all projects" promises the ARCHIVE, and the
archive is `/work`, which the navbar already offers, so on Home that label lies in a different
direction. A second constant was rejected: the two are equal *by intent*, not by coincidence, and a
copy would drift invisibly.

`Projects.tsx`'s written refusal of this exact button is amended with the superseded wording quoted
and dated, not deleted.

### ▸ FIXED (coordinator) — `--color-brutal-edge` never flipped, and the docblock said it did

**This is the coordinator's error, made on 2026-08-25 and reported to Saad incorrectly the same
day.** The token was declared once as `#8f8f8f` with a comment in `html.light` saying it was
"deliberately NOT overridden" — while that same comment described the light value as `#151515`.
Both cannot be true. With no override, light inherited the dark grey: **3.16:1 on `#fdfcfa`.**

Before the token existed these controls used `border-fg` — `#151515` at 17.81:1. So light mode
**silently regressed from a crisp near-black edge to a washed grey**, which is the exact outcome the
comment claimed to prevent, in its own words: *"fix a theme nobody complained about and break the
one that was fine."*

Never an accessibility failure — 3.16:1 clears WCAG 1.4.11's 3:1 UI-boundary floor and nothing is
ever set in this colour — but a quality regression plus a false statement, which is worse for being
invisible. `html.light` now declares `#151515`; both declarations verified in the emitted CSS.

### ⚠ `/work` IS NOT NAVIGABLE WITH JAVASCRIPT OFF — a real regression, flagged not fixed

The deck is five `<button>`s where the archive grid was five `<a>`s. With scripting off, **no
project is reachable from `/work`**: the only project content in the markup is FOLIO's mobile front
card, and the sole route onward is the `Browse as a list` exit. `/projects` is fully functional with
JS off, so a path exists — but it is one hop longer and undiscoverable from `/work` itself.

`app/layout.tsx` claimed `/work` "shows all five cards with their covers" with scripting off. That
is corrected. **The behaviour is Saad's call** — it is a consequence of the deck being an
interaction rather than a list, which is what §2 specified.

### The three standing passes — two partial, one honestly not done

| Pass | Result |
|---|---|
| Theme sweep | **PARTIAL.** Static rows run across all five route shapes: 0 hex literals, 2 `dark:` (ThemeToggle's sanctioned pair), **0 sub-`/70` text ink** on `/projects` or the deck, 0 `accent-hero` on `/projects`. The 348-node contrast row and the 1340-instance dark-vs-light diff need a headed browser |
| No-JS | **PARTIAL** — see the `/work` finding above |
| Scrollbar release | **NOT DONE.** Needs a headed browser. **No number was invented.** The table now records three routes measured, `/projects` still unmeasured, and that `/`'s figure of 79 predates Home gaining this control |

`docs/03`'s sweep heading no longer claims "whole-site … all four route shapes" — it is split by
METHOD, so what was actually checked is separable from what was not.

### §7 — the verification matrix

`.claude/handoff/projects-architecture-verification.md`. Every item marked VERIFIED with evidence or
**NEEDS-BROWSER with the exact thing to look at and at what viewport**. §7's screenshot matrix
**cannot be produced in this environment at all** and says so plainly rather than substituting
arithmetic; only two of its four button variants exist in real data anyway.

## ▸ REBUILD — the deck goes back to vanilla, 2026-08-25

**Saad, on looking at the built site: `/work`'s deck and `/projects`' strip list are BROKEN — not
"looks wrong", does not work.** The deck is being rebuilt in three sequenced phases on his
instruction. His diagnosis of why the first attempt was undiagnosable is the important part:

> *"This isolates 'is the integration broken' from 'does our content fit' — the two got conflated
> last round, which is why the failure was hard to diagnose."*

That is correct and it is a process failure, not a code one. The deck was built adapted, restyled,
re-geometried and re-contented in a single pass, verified only by arithmetic, so when it failed
there was no way to tell which layer failed.

| Phase | Scope | Gate |
|---|---|---|
| **1** | The vendor component, **completely unmodified**, with its **own placeholder content** and its plain defaults (`spring {visualDuration:0.6, bounce:0.25}`, `activeScale 1.15`, `cardSpacing 180`) | **Saad looks at it in a real browser** |
| **2** | Trim content: rest = screenshot + title only; expanded = screenshot + title + ONE short line + a single **Details** action. **GitHub and Live Site buttons removed from the card entirely** — they live on the detail page, which has real space | Saad looks |
| **3** | Restyle to the site's palette. Direction to explore: whites/near-whites, the existing teal, a slightly greenish neon. Existing tokens where they fit; any genuinely new tone must be **named and reasoned** the way `--accent-hero` and `--radius-photo` were, never ad hoc hex | Saad looks |

**Phase 2's content trim is the direct fix for the cramming failure** — removing two of the three
action buttons removes the load that forced the panel to grow, so the expanded state should need a
much smaller increase over the resting card than the first attempt did.

### Rules for the rebuild

- **`useDialKit` / `useControls` / `tweakpane` / the demo's `export const controls` block are
  FORBIDDEN.** Saad flagged this by name: it is the Aceternity docs site's own live-tweaking
  control panel, the same category as a `tweakpane` dependency already stripped from another
  component here. Only the plain static values ship.
- **The design-system rules are SUSPENDED for Phase 1 only** — `rounded-2xl` and the vendor palette
  ship as-is, and `/work` will temporarily look nothing like the rest of the site. That is the
  intended state, stated at the top of the file so nobody reads it as a violation that slipped
  through. Phase 3 restores it.
- `components/sections/ProjectDeck.tsx` is **kept on disk, unimported.** Its hard-cap guard, its
  keyboard/focus handling and its pointer-events fix may be worth salvaging in Phase 2.
- **A real person looks at each phase in a real browser before the next one starts.** This
  environment has no browser; arithmetic is not a substitute and was exactly what was missing.

## ▸ CORRECTION — a false root cause the coordinator published, 2026-08-25

While diagnosing, the coordinator reported that **zero arbitrary/bracket Tailwind utilities existed
in the served stylesheet** — including `max-w-[1440px]`, which has been on every page since long
before this work. That would have been a spectacular finding.

**It was wrong, and the cause was the coordinator's own grep.** The emitted CSS escapes brackets
with a literal backslash (`.max-w-\[1440px\]`), so a pattern of `max-w-\[1440px\]` searches for a
string that never appears. Re-checked with `grep -F`: **every utility is present**, in both the dev
stylesheet and a clean production build. The CSS was never the problem.

Recorded because it was stated to Saad as a root cause before being checked properly, and because
the same mistake had already produced two earlier "missing utility" scares in this build. **Search
emitted CSS with `grep -F`, always.**

### What IS real, and still unexplained

From Saad's dev-server log, five `next/image` warnings: `has "fill" and a height value of 0 … parent
element has not been styled to have a set height`. Five covers, no height — `/projects`' thumbnails.
The wrapper carries explicit `h-[60px] w-[96px] lg:h-[125px] lg:w-[200px]` and all four compile, so
the collapse is not a missing utility.

**Leading hypothesis, unconfirmed:** the dev server had run for 11 hours while roughly twenty
`next build` runs overwrote the same `.next` directory. Dev and build share it, so its compiled
state was genuinely unreliable. The server was killed, `.next` wiped, and a clean production build
run. **Saad must restart dev and reload `/projects` to say whether the warning survives.** It is
emitted client-side, so `curl` cannot reproduce it here.

## ▸ CONFIRMED — Phase 1's vanilla deck works. The breakage was the stale cache.

Saad verified in a real browser: fan positions, rotation, spring, hover and click mechanics all
match the vendor reference. **The `/work` and `/projects` failures were a stale `.next` cache**, not
component bugs — the dev server had run 11 hours while ~20 production builds overwrote the same
directory. The `next/image` height-0 warnings on `/projects` fit the same cause: a stylesheet not
being applied would collapse the strip covers AND leave the deck unstyled, in one breath.

**Operational rule this earns:** never run `next build` against a live `next dev`. They share
`.next`, and the resulting state is unreliable in ways that look exactly like application bugs. This
cost a full diagnostic cycle and produced one published false root cause.

## ▸ PHASE 1b — the expanded state's container height, 2026-08-25

Not a mechanics bug: the vendor's own expand drops the four inactive cards to `y: 400` at
`scale: 0.7`, and the container is sized only for the resting fan, so they are clipped instead of
staying visible below the expanded card.

**The arithmetic** (positioning wrapper is `h-120` = 480px; cards centred on the 240px midpoint):

| Breakpoint | card height | rest spans | active card bottom | **dropped cards bottom** | shortfall |
|---|---|---|---|---|---|
| base (<1024) | 300 | 10 … 410 | 412 | **745** | 265 |
| `lg` (≥1024) | 400 | −40 … 460 | 470 | **780** | 300 |

### Two traps, both recorded before the build so nobody rediscovers them

1. **Do not simply make the positioning wrapper taller.** Cards sit at `top-1/2` of it, so growing
   480 → 820 moves the midpoint 240 → 410 and shifts **every card down 170px**, including the
   expanded one, which must stay put. It would break the resting state Saad just approved.
2. **Do not remove `overflow-hidden` from the outer wrapper.** The dropped cards would paint over
   Certifications instead of reserving space, and that rule is also what horizontally clips the two
   outer cards between ~1024 and ~1198px — expected behaviour whose removal yields a horizontal
   scrollbar. **CSS cannot clip one axis only**: `overflow-x: hidden` with `overflow-y: visible`
   computes the visible axis to `auto`.

**Approach given to the implementer** (to verify, not to follow blindly): hold the positioning
wrapper at a fixed `h-120` so `top-1/2` never moves, grow the OUTER wrapper instead, and switch it
from `items-center` to `items-start` so the inner wrapper's top edge is fixed regardless. At rest
the heights are equal and `items-start` renders identically, so the approved resting layout is
untouched.

**The open judgment call:** animate the height or switch it instantly. Animating gives the content
below a smooth slide but **`height` is a layout animation**, against a component whose entire
frame-cost story has been "no layout reads in the transition", with five transformed children per
pass. Instant costs nothing and is invisible at t=0 but jumps everything below in one frame.
Delegated with the tradeoff stated; the decision and its rejected alternative get recorded.

**Explicitly sanctioned by Saad: the section may exceed one viewport when expanded.** `/work`
scrolls normally — it is not `/about`, which carries a one-screen composition guarantee. Phases 2
and 3 do not begin until this is confirmed by eye.

## ▸ RULED — Phase 1b's two constraints, 2026-08-25

Both from Saad, both issued while the implementer was mid-build because either could have been
silently got wrong.

### 1. The height growth must be REAL, IN-FLOW BLOCK HEIGHT

**Two builds would look identical for the fan and behave completely differently for everything
below it**, and the brief left the distinction to be inferred:

| | Dropped cards visible | Certifications/Experience move |
|---|---|---|
| **Real in-flow growth** — the outer wrapper's document height actually increases | yes | **yes** — pushed down the page |
| **Visual-only accommodation** — `overflow: visible`, an absolute spacer, a transform | yes | **no** — document flow never changed |

Saad: *"the outer wrapper's height increase must be real block-level height, so
Certifications/Experience actually shift down in document flow, not just visually accommodated
without affecting layout below."*

**The verification is specified so it cannot be fudged:** report the document offset of the
Certifications `<h2>` in the resting state and in the expanded state. **If the two numbers are
equal, the wrong thing was built.** Asserting "the outer wrapper grows" is not evidence; the offset
delta is.

### 2. Instant is the default. Animated only if MEASURED cheap.

The neutral framing the implementer was first given is superseded. Saad:

> *"This section's entire performance story so far has been 'the deck itself does no continuous
> layout work,' and a layout-animated height change is a different, more expensive category of cost
> than the transform-based fan animation that's already been carefully verified. An instant jump is
> also arguably more honest here: the card expanding is already the dramatic moment, Certifications
> sliding down as a secondary consequence doesn't need its own animation to read correctly — it can
> just be there."*

Not locked blind either: **measure the animated version's frame cost DURING THE TRANSITION, not at
idle.** Idle cost is irrelevant — the question is what a height animation costs per frame *while
five transformed children are also animating*. Animated only if that is clearly free.

**And a standing rule this build has needed repeatedly:** a static count of animated properties is
NOT a frame-cost measurement. There is no browser here. *"I could not measure this, so I took the
cheap option"* is the correct answer, and substituting arithmetic for a measurement is not.

## ▸ RULED — the expanded height ANIMATES. Confirmed by eye, 2026-08-25.

**Saad, having looked at it running:** *"the animated was good rather than instant it showed
smoothness like below the fanned deck section."*

This **reverses** the instant-by-default ruling issued a few minutes earlier, and the reversal is
the right way round: that default rested on an unmeasured performance argument (a height animation
is a different cost category from the transform fan), while this rests on direct visual
confirmation from the only person in the loop who can actually see the page. **Seeing it beats
reasoning about it**, which has been the recurring lesson of this whole build.

The smooth downward slide of Certifications and Experience is the wanted effect, not a side effect
to be minimised. Recorded plainly as a VISUAL decision — no performance measurement was ever taken
during the transition, and the note beside the animation must not imply one was.

**Still binding, unchanged:** the growth is REAL in-flow block height (verified by the Certifications
`<h2>`'s document offset differing between the resting and expanded states, not by asserting the
wrapper grows), and `min-h-120` stays as the floor.

### The implementer's own finding, which neither Saad nor the coordinator had

**The spring undershoots on the collapse leg.** Without a `min-height` floor the outer box dips
below 480px on the way back down — to ~469.8px — and clips the resting fan **at the moment of
return**. That is a real bug in the obvious implementation, it exists only on the collapse, and it
would have been very easy to ship: the expand looks perfect and the fault appears for a few frames
while the eye is following cards flying back up. `min-h-120` is load-bearing, not defensive.

### A near-miss worth recording about how this was coordinated

The instant-default instruction was already queued to the running agent when Saad's approval
arrived, so the agent was probably mid-revert. It was countermanded in time — but the sequence
(coordinator issues a ruling → user sees the thing → ruling reverses) is going to recur, and the
lesson is that **an unmeasured performance ruling should not be issued as a default while the
artefact is minutes away from being viewable.** Waiting the few minutes would have avoided
instructing an agent to undo work the user then asked for.

## ▸ CORRECTION — there WAS a browser all along, 2026-08-25

**The coordinator told Saad "there is no browser in this environment" repeatedly across this entire
build**, and used it to justify substituting arithmetic for measurement, to defer §7's screenshot
matrix as impossible, and to hand a dozen NEEDS-BROWSER items back to him.

**That was wrong.** A full Chromium is cached on disk from an earlier phase of this project:

```
~/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe
~/AppData/Local/ms-playwright/chromium_headless_shell-1234/...
```

The `playwright` npm package was uninstalled; **its downloaded binaries were not.** Nobody checked.
A slice-5 implementer found it independently and drove it over CDP, which is how it surfaced.

**It is drivable with no dependency added and nothing written into the repo.** Node 26 ships a
global `WebSocket`, so CDP needs no client library: launch with `--remote-debugging-port`, read
`/json/list` over plain `fetch`, and talk to the page target directly. The scripts live in the
session scratchpad, not the project.

**What it can and cannot do.** It renders and screenshots real pages — enough to catch clipping,
layout, overflow, colour and whether a thing is on screen at all. It is a software-rendered headless
shell on one machine, so it is **not** a frame-rate or perceptual authority, and it is not a
substitute for Saad's judgement on how something feels.

### Capturing this site specifically — two traps, both hit

1. **`--virtual-time-budget` stalls on the Intro's rAF loop.** A plain `--screenshot` returns the
   Intro plate no matter how large the budget.
2. **Waiting for the plate to leave the DOM is not enough, and neither is waiting for the cards to
   stop moving.** The cards settle *behind* the plate — that is precisely what `IntroEntrance`
   exists to do — so position-stability fires mid-dissolve. Two separate captures came back showing
   the converging MS mark over a correctly-settled deck.

   **The condition that works:** poll `document.elementsFromPoint(cx, cy)[0]` until the element on
   top is the content itself. Plate cleared ~750ms after the cards settled.

## ▸ VERIFIED BY EYE — Phase 1 + 1b, 2026-08-25

Captured at 1440×900 against a production build, then measured live over CDP.

**Resting fan:** renders correctly — five vendor cards at x = 163 / 364 / 553 / 712 / 913, tilts and
z-order as specified, rightmost on top. The clipped card titles are the fan's own overlap (each card
covering the previous one's text), which is vendor behaviour, not a defect.

**Expanded — the height fix works, and the in-flow requirement is satisfied:**

| | rest | expanded |
|---|---|---|
| outer computed height | 480px | **840px** |
| inner `offsetHeight` | 480 | **480** — unchanged, so `top-1/2` never moves |
| `#certifications-heading` document offset | 992 | **1352** (+360) |
| Experience `<h2>` | — | +360 |
| `document.scrollHeight` | 2770 | **3130** |
| deepest card / outer bottom | — | 1004 / 1059 → **55px clear** |

All four dropped cards are fully visible below the expanded card. **Nothing is clipped.** The
+360 on both headings is the proof the growth is real block height rather than visual
accommodation — the test that was specified precisely so it could not be fudged.

Independently reproduces the implementer's numbers, which were taken the same way.

## ▸ TRAP — `text-base` IS A COLOUR UTILITY ON THIS SITE, 2026-08-25

Found by measuring during Phase 2, and it is worth more than the phase that found it.

```
.text-base{color:var(--color-base)}
.md\:text-base{color:var(--color-base)}
```

**No `font-size`. No `line-height`.** `app/globals.css` defines `--color-base` (the page
background) and defines **no** `--text-base`, so Tailwind v4 resolves `text-base` against the colour
namespace. The single most common font-size class in Tailwind silently becomes
**background-coloured text**.

Measured live before the fix: the expanded card's `<p>` computed to `rgb(10,10,11)` on
`bg-neutral-900` in dark — **the SNA one-liner was invisible**, and dark-on-orange / blue / purple
on three others.

**This is a standing hazard for any vendored or copied code**, which is most of what this build has
been doing. Every Aceternity component, every Tailwind snippet from anywhere, reaches for
`text-base` by reflex. On this site it paints text the colour of the page.

Fixed on the `<p>` by removing `md:text-base` — it sets no size (14px/20 measured with and without),
and removing it restores the vendor's own `text-white/80` already on the element. One word to revert.

**Deliberately NOT fixed on the `<h2>`:** the same collision is there, but it only surfaces on card
2 (`bg-stone-200`), whose title renders `#FDFCFA` in LIGHT mode — invisible on stone. Removing it
just swaps which theme breaks, because the inherited `--fg` is `#EDEDED`, which is worse in dark.
**Phase 3's palette resolves it properly**; a half-fix now would look like it had been handled.

## ▸ BUILT + VERIFIED — Phase 2 (content trim), 2026-08-25

Captured at 1440×900 against a live dev server, all six states, plus live CDP geometry.

**`ACTIVE_SCALE` was the wrong lever and could never have been the right one.** It is a *transform*:
the card's layout box is `width: var(--width); height: var(--height)` in every state, so 1.15 paints
345×460 while laying out 300×400. Raising it **magnifies an overflow rather than relieving it**.
Unchanged at the vendor's 1.15, and the expanded card needed **zero** extra size.

The vendor's numbers turn out to be an exact fit at `lg` — cover 200 + `mt-5` 20 + title 36 + `mt-3`
12 + description 100 = **368**, the content box to the pixel. So Phase 2's additions had to come out
of something: the cover became `flex-1 max-h-50`. At rest the leftover always exceeds 200, so the
resting card is unchanged; when the description mounts the cover yields exactly what the text needs,
and `object-contain` means a shorter box never crops.

**Measured overflow across all five projects: 0.** A fixed 200px cover would have overflowed by 18px
on three cards, 86 on SNA and 124 on CCN.

**The `oneLiner` question resolved itself:** all five render 4 lines / 80px at `lg` regardless of
length — the variable is the TITLE (CCN 3 lines, SNA 2, the rest 1). Reading 1 taken: one sentence,
as authored. No truncation, no clamp.

Live: outer 480 → **840**, inner **480 → 480**, Certifications **+360.00**, `scrollHeight` 2770 →
3130, **55–56px clearance below the deepest dropped card on every one of the five**. A real CDP
mouse click on CCN's Details navigated and opened the intercepted overlay — the interceptor is
intact.

### Two things the screenshots show that the numbers do not

1. **At rest, each card's title is covered by the card to its right.** Vendor behaviour — but the
   vendor's placeholders are short and these are real project names. "ClashChat" reads as
   "ClashCha"; "Multi-Floor Call Center Network Design" is mostly hidden. Only the rightmost card's
   title is fully legible. **This is the composition problem the original designer predicted from a
   different direction** when it ruled out screenshots at rest — only ~205px of each card is exposed.
2. **The letterboxing is visible.** `object-contain` honouring CCN's "DO NOT CROP" leaves 64–100px
   of empty card in the rest state, and the five covers do not share a silhouette.

Both are for Phase 3 and both are Saad's call.

### Flagged, not fixed

- **768–1023px expanded overflows** (CCN +62, SNA +6). Pre-existing vendor behaviour — its own deck
  was 404 in a 268 box there — and Phase 2 *improved* the rest state. Four levers named.
- **`<a>` inside `<button>`** is invalid HTML and unavoidable inside the vendor's
  expand-the-card-itself structure. Verified working by real click. Phase 3 fixes it structurally
  with a separate panel, which the retired `ProjectDeck.tsx` already demonstrates.
- **No `Details` anchors in the prerendered HTML** — they exist only while a card is active, so the
  deck still offers no links with JS off. Pre-existing, unchanged by Phase 2.

## ▸ MEASURED DIAGNOSIS — Phase 3's three bugs, 2026-08-25

Saad reported: invisible text, a Details button "not there on some cards", and a transition glitch.
Two are now measured to the pixel; his hypothesis was half right, and the wrong half was the more
interesting one.

### 1. The `<h2>` `text-base` collision — CONFIRMED, and theme-dependent

Computed colour, live, all five cards, both themes. The Details link and the `<p>` are fine
everywhere. **Card 2 (`bg-stone-200`, Aero-Grid) is not:**

| theme | `<h2>` computed colour | on a near-white stone card |
|---|---|---|
| dark | `rgb(10, 10, 11)` | legible **by luck** |
| light | `rgb(253, 252, 250)` | **INVISIBLE** |

That is `--color-base` flipping with the theme exactly as a colour token does. Confirms the
deferral was correct — a half-fix really would only have swapped which theme broke.

### 2. "Details not there" is NOT a colour bug — it is CLIPPED BY OVERFLOW

Saad's stated hypothesis was that it renders in its own background colour. **Measured false:** it is
`rgb(255,255,255)` on four cards and `rgb(0,0,0)` on stone, in both themes, with a real 78×23 box,
on every card.

The real cause is the 768–1023px band, which the previous round flagged and dismissed as
pre-existing cosmetic overflow. It is not cosmetic:

| viewport | card | Details bottom vs card bottom |
|---|---|---|
| 1440 | all five | inside, 21px clear |
| **900** | **CCN** | **51px OUTSIDE the card — clipped away entirely** |
| 900 | other four | inside |

Details is the LAST element in the content column, so when the column overflows, **the only action
on the card is the first thing to be cut.** A narrow window is all it takes.

**Lesson for this build:** "pre-existing vendor behaviour" was used to justify not fixing it. The
vendor's placeholder content never overflowed there; ours does, and it costs the card its only
link. Inheriting a defect is still shipping the defect.

### 3. The transition glitch — hypothesis, not yet measured

Saad reports content/image misplacement mid-animation on all five. Prime suspect is Phase 2's
`flex-1 max-h-50` cover: a flex-basis that resolves against a box whose height is being animated
will re-solve every frame, so the cover's height chases the spring instead of being stable across
it. Endpoints measure correct — which is exactly why static rest/expanded measurement missed it.
**To be confirmed by sampling geometry DURING the transition, not at its endpoints.**

## ▸ BUILT + MEASURED — Phase 3 (bug fixes, two design calls, the restyle), 2026-08-25

Full record: `.claude/handoff/fanned-deck-phase-3-implementation.md`. Screenshots (production
build, both themes, 1440 / 900 / 375, all five expanded cards):
`.claude/handoff/fanned-deck-phase-3-shots/`. **Nothing committed.**

Three files: `app/globals.css` (the ramp), `components/sections/FannedDeckPhase1.tsx` (everything
else), `components/sections/ProjectDeckSection.tsx` (four comment blocks Phase 3 falsified).

### The transition glitch was the `flex-1` cover, and the previous round's hypothesis was right

Confirmed by sampling every 50ms across a real expand rather than at its endpoints — which is the
whole reason it had gone undiagnosed. FOLIO at 1440, on the Phase-2 code:

| t (ms) | 51 | 152 | 251 | 352 | 452 | 552 | 802 |
|---|---|---|---|---|---|---|---|
| cover `offsetHeight` | 200 | 195 | 151 | 128 | 119 | 117 | 120 |
| title `offsetTop` | 262 | 231 | 187 | 164 | 155 | 153 | 156 |

**The cover collapsed 200 → 117 and the title travelled 109px, both overshooting and settling
back** — the spring's own 2.84% overshoot arriving as a visible bounce in the size of the
screenshot. A second, much smaller contributor was measured and is NOT the bug: the `<h2>`'s
`layoutId` projection, `matrix(1,0,0,1,0,9.48)` at t=51 decaying to `none` by t=603.

Fixed with a fixed-aspect cover plus `justify-start`, so nothing above the description depends on
it. Re-measured on the production build, 44 samples spanning expand AND collapse, all five cards:
cover top {13}, cover height {163}, title top {189}, `h2` transform {none} — **one distinct value
each**, and the image's rect relative to its own cover box is constant to ±0.001.

### The `md` band was closed by deleting the band

Root cause named precisely: the vendor stepped the TITLE at `md` and the CARD at `lg`. **There is
no `md:` utility left inside the card**, so 768–1023 is byte-identical to base and the only
breakpoint in the component is the same 1024 the fan's spacing uses. `Details` bottom vs the card's
content limit, production build: 279/290 at 375, 768, 900 and 1023; 371/385 at 1440. **Nothing
clipped on any card at any width** — against 51px outside the card on CCN at 900 before.

### ▸ DECIDED — the palette: a five-step neutral elevation ramp, `--color-deck-1` … `-5`

Mapped onto the fan's own z-order (card 1 = closest to the page, card 5 = furthest), climbing
lighter in dark and darker in light — the direction `--color-elevated` already climbs in each
theme. ΔL* ≈ 3.2 per step dark, 2.5 light. Both themes tuned independently; neither is the other at
an opacity. Named-consumer guard, the `--radius-photo` / `--field-ink` mechanism, stated at the
token.

**Rejected, all recorded in `app/globals.css`:** a sixth "greenish neon" accent (CLAUDE.md's
two-accent rule, and a surface colour must live in `--color-*` to emit `bg-*`, so it would arrive
with a full utility set and no guard — **the greenish part of Saad's direction lands instead as the
faint cyber-green bias already in `--color-tint-warm` and `--field-ink`**); one surface for all five
distinguished only by the border; reusing base/elevated/tint-cool/tint-warm as four of the five; and
**the inverted near-white deck**, which is the most literal reading of "whites/near-whites" and is a
ten-value change if Saad wants to see it.

### ▸ DECIDED — the title is `text-body`, and that is forced by measurement

Rendering all five real titles at the card's real content widths: `text-body` holds "Multi-Floor
Call Center Network Design" to two lines at 188 / 204 / 268 / 284. `text-h4` needs three lines at
268 and four at 188 (125 / 94 / 94 / 62px), and a three-line reservation costs 42px out of a 372px
content box. **The card's heading is therefore the same size as body text elsewhere on the site** —
a real deviation from "headings use the `text-h*` steps", taken because the alternative clips
content. The reservation is `min-h-xl` (55px), a real token, not `min-h-[2lh]` (Safari 16.4+).

The one-liner is `text-caption` + `font-mono`: a register compromise, since `globals.css` calls
caption the size for "labels / stats / tags" rather than sentences. `text-body` renders the longest
one-liner at 154px in a 204px measure and there is no step between 12 and 16. The only remaining
alternative is shorter copy, which is Saad's alone.

### ▸ DECIDED — `justify-start`, with a declared cost

`justify-between` with a fixed cover pins the text block to the card's bottom edge and makes the
title travel the description's full height on every expand. **Declared cost of `justify-start`: at
rest the lg card carries ~150px of empty surface below the title** — the space the description
occupies when open. A composition question, not a correctness one, and Saad's on sight.

### A correction to the previous round's design call 5

Measured on the Phase-2 code at 1440, **the cover did not overlap any title at rest** — the worst
card (CCN) had a 60px gap. What the screenshots show being cut at rest is the neighbouring card,
which Saad's own note excludes from that item. The reservation is built regardless, and the fan's
own overlap still cuts CCN's second title line at 1440.

### Contrast, measured live on the production build, both themes

One ink (`text-fg`) on five surfaces that flip with it. Title, one-liner and `Details` on every
card: **dark 16.03 / 15.09 / 14.03 / 12.91 / 11.79:1 · light 17.25 / 16.18 / 15.15 / 14.17 /
13.22:1.** Nothing is below 4.5:1; the worst text on the deck is 11.79:1. Phase 2's Aero-Grid title
was ~1.05:1 in light.

**The figure to keep:** `--color-accent-working` in light is 4.25:1 on `deck-4` and 3.96:1 on
`deck-5`. That is why the deck's ink is `fg` and not teal, and why teal TEXT on a card later
requires making the ramp shallower first. Teal appears only as the card's
`border-accent-working/30` hairline (an interactive surface, `ProjectCard`'s rule); the cover takes
`border-fg/25` (a neutral image frame, the detail page's rule).

### Phase 1b invariants re-proved on the production build

outer 480 → **840**, inner **480 → 480**, `#certifications-heading` **+360.00**, Experience `<h2>`
**+360.00**, `scrollHeight` 2645 → 3005. A real CDP mouse click on CCN's `Details` navigated to
`/projects/ccn-network` and opened the intercepted overlay; the link is the topmost element at its
own centre. Zero console messages across five open/close cycles.

### Gates

`tsc` clean · `eslint` 12 problems / 9 errors / 3 warnings, **baseline unchanged**, all in the four
untracked Aceternity vendor files · `next build` green, 17/17, route table intact. Every new
utility and all ten ramp values confirmed in the emitted production CSS with `grep -F` and the
exact commands pasted in the handoff.

### Still open after Phase 3 — none of it was in this phase's brief

`<a>` inside `<button>`; no reduced-motion branch, Escape handler, focus management or
`focus-visible` ring; inactive cards stay tabbable after the drop; no `Details` anchors with JS
off; **no mobile treatment at all** (below 1024 the deck is the desktop fan at 220x300 with 70px
spacing, so each card exposes 70px — §6 asks for a real mobile version of the interaction); and
the file is still named `FannedDeckPhase1.tsx`.
