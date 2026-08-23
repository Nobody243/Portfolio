# Feature Ticket List — Muhammad Saad Portfolio

Each ticket is written to be usable directly as a prompt for Claude Code. Priority: **M** = must-have for
launch, **S** = should-have, **N** = nice-to-have.

---

> ## WHAT COUNTS AS VERIFICATION — binding on every ticket and every review pass. Added 2026-08-22.
>
> **A number that has not been re-measured against a running production build is UNCONFIRMED, and it
> must be reported as unconfirmed. It may never be folded into a passing total.**
>
> This exists because it was broken in exactly that way. A review of the overnight pass hand-recomputed
> about ten of some six hundred contrast figures, found the rest "internally consistent", and reported
> the whole set as verified. Internal consistency is a property of a document. It cannot detect a value
> that is consistent everywhere and wrong everywhere — which is what four separate defects on this
> project turned out to be, every one of them found only by measuring against real pixels.
>
> Concretely, for any pass that claims a figure:
>
> 1. **`npm run build` then `npx next start`, and measure against that.** `npm run dev` is not a
>    substitute and has already produced a false negative on this project: the Intro's origin bug fired
>    on essentially every save in development under StrictMode and Fast Refresh, and almost never on a
>    real visitor's hard load. Anything judged by watching the dev server needs re-checking.
> 2. **Measure the rendered pixel, not the token.** The value a declaration computes to is not the value
>    the compositor produces — scrims, `backdrop-filter`, alpha compositing and overlapping canvas
>    draws all sit in between. Four of this project's contrast defects were invisible to any check that
>    trusted the declared colour.
> 3. **Both themes, always.** Five defects so far have been dark-mode-only blind spots: the values are
>    two points apart in dark and inverted in light, so a figure computed once is a figure computed for
>    the theme the author happened to be in.
> 4. **State the coverage, and state what was NOT covered.** "616/616 pass" is a useful claim only
>    beside the axes it swept. `docs/06_INTRO_AND_CHROME.md` §6.2.1 is the worked example: 924 states,
>    all of them at rest, missing a 150ms mid-navigation failure and a 37px scroll band.
>
> **A review that cannot re-measure a figure should say so and leave it open.** An unverified number
> reported as verified is worse than no number, because the next reviewer either trusts it or spends
> the same effort discovering it was never checked.

---

> ## AMENDED 2026-08-22 — restructure status pass (the restructure plan's Phase 7)
>
> **`docs/07_SITE_RESTRUCTURE.md` is the governing spec now, and this file predates it.** The
> restructure turned one scrolling page with seven sections into three routes, and several of the
> acceptance criteria below were written against a Home page that no longer holds the thing they
> test. **No ticket is deleted and no shipped criterion is rewritten.** Each affected ticket gets a
> dated note saying what shipped, what `docs/07` superseded, and what stopped applying — the tickets
> are a **build record**, not a live spec, and their value is showing what was asked for at the time.
>
> **A count correction first: this file contains EIGHTEEN tickets, not sixteen.** `CLAUDE.md`'s
> reference list calls them "the 16 build tickets", which was true of the original set; **Ticket 17
> (`og:image`) and Ticket 18 (error / not-found pages) were added later**, in response to gaps found
> during the build, and both have shipped. Anyone auditing "all 16" would silently skip two shipped
> tickets. `CLAUDE.md` is not amended by this pass — flagged here rather than changed.
>
> ### Status of all eighteen, checked against the repo at `23d890d` on branch `hero-rebuild`
>
> | # | Ticket | Status |
> |---|---|---|
> | 1 | Project scaffold [M] | **Shipped; partly superseded.** R3F / drei / three were installed as required and are imported by **no source module**; the packages remain declared in `package.json`. |
> | 2 | Content data layer [M] | **Shipped; untouched by the restructure.** What changed is who consumes it. |
> | 3 | Hero: loader + reveal + 3D scene [M] | **Shipped; superseded in mechanism.** The scene is Canvas2D, not R3F; the "minimal preloader" is now the Loader/Intro split. |
> | 4 | About / Trajectory section [M] | **Shipped; then split across two routes.** |
> | 5 | Skills section [M] | **Shipped, and it survived a proposed replacement.** `docs/07` §5 first specified a four-category logo grid, then retired it back to this ticket's three groups. |
> | 6 / 6b | Projects gallery + card, and the morph [M] | **Shipped; scope superseded.** "Renders all projects" is now true of `/work` only — `/` renders three, deliberately. |
> | 7 | Project detail page [M] | **Shipped; its back affordance was retargeted** from `/#work` (an anchor on Home) to `/work` (a route). |
> | 8 | Experience section [M] | **Shipped; relocated to `/work`.** |
> | 9 | Currently Learning [M] | **Shipped; relocated to `/work`, after Experience.** Renders `null` while its array is empty, which it is. |
> | 10 | Contact / close section [M] | **Shipped, then SUPERSEDED and deleted.** Absorbed into the reveal footer in `23d890d`. |
> | 11 | Theme toggle [M] | **Shipped; its placement was reversed twice** and now lives in the navbar. |
> | 12 | Responsive + accessibility pass [M] | **Shipped for the pre-restructure site. Its coverage is now stale** — see its note. |
> | 13 | Deploy to Vercel [M] | **Shipped.** `app/layout.tsx` carries `metadataBase: https://www.saaddev.top`. Whether *this branch* is what is currently deployed is not verifiable from the repo and is not claimed here. |
> | 14 | Contact form [S] | **NOT BUILT** — no `<form>` element exists anywhere in `app/` or `components/`. The closing beat it was written for no longer exists in that form. |
> | 15 | Resume/CV download [S] | **Shipped, somewhere other than this ticket says** — the View CV control on `/about`, not the hero or the contact section. |
> | 16 | Lightweight analytics [S] | **NOT BUILT** — no `@vercel/analytics` dependency, no analytics call in `app/`, `components/` or `lib/`. This is what makes two of the PRD's success metrics unmeasurable. |
> | 17 | Social preview image [S] | **Shipped, and ONE CRITERION IS NOW FAILING.** `/about` and `/work` both emit an `og:image`, but the asset and its `alt` describe the pre-rebuild hero. See its note. |
> | 18 | Themed error and not-found pages [S] | **Shipped; one live staleness found.** See its note. |
>
> ### THREE PIECES OF SHIPPED WORK HAVE NO TICKET IN THIS FILE, AND ARE NOT BEING BACK-FILLED
>
> **This is why three separate agents reported "no acceptance criteria to assess against."** It was a
> real gap in this file rather than a lapse by any of them, and it is recorded instead of being
> papered over with invented tickets — a ticket written after the fact to describe what was already
> built is not a requirement, it is a description wearing a requirement's clothes, and it would make
> this build record lie about what was asked for in advance.
>
> | Shipped work | Commit | Where its criteria actually live |
> |---|---|---|
> | The navbar's sliding active-route indicator, and the removal of hide-on-scroll | `3b3fab6` | `docs/07` §1.1 — a binding parameter table — plus `docs/06` §6 step 2 and §6.1. Design brief: `.claude/handoff/navbar-indicator-design.md`. |
> | The reveal footer (curtain), which absorbed Ticket 10 | `23d890d` | `docs/07` §5's reveal-footer block and Rule S-6 in `docs/03`. Design brief: `.claude/handoff/reveal-footer-design.md`. |
> | The portrait moving off Trajectory onto `/about` | `2cfdb34` | `docs/07` §6. Design brief: `.claude/handoff/about-design.md`. |
>
> Two things follow, and both are for whoever picks up the next piece of work:
>
> 1. **`.claude/` is gitignored**, so every one of those design briefs can vanish with the session —
>    exactly the failure `CLAUDE.md`'s "where decisions live" rule exists to prevent. In each case the
>    parameters that bind later work were promoted into `docs/07` or `docs/06`, and that promotion is
>    the thing that has to keep happening.
> 2. **The whole restructure ran as Phases 0–7, not as tickets.** `.claude/handoff/restructure-plan.md`
>    §7 holds the phase sequence and §8 holds per-phase acceptance criteria, and the shipped phases
>    have `phase-N-implementation.md` files beside it. If work continues to be planned as phases, this
>    file stops being the place to look for criteria, and the next reader should be told that here
>    rather than discovering it. **That is a live question for Saad, not a decision this note makes.**
>
> ### Two live findings, recorded and NOT fixed — both are code, not docs
>
> 1. **`app/not-found.tsx:94` still sets `WORK_HREF = "/#work"`.** The anchor resolves: `id="work"` is
>    on the `Projects` section, which renders on both routes. But on Home that section is now the
>    **curated three**, so the 404's "All work" link lands on the featured set rather than on the
>    five-project archive at `/work`. `app/(site)/projects/[slug]/page.tsx:191` was retargeted in
>    Phase 2 and this file was not. `components/sections/projectDetailContent.ts:42` documents the old
>    destination too.
> 2. **`app/not-found.tsx`'s container comment claims byte-identity with "`Contact` and the five
>    shipped sections".** `Contact` was deleted in `23d890d`. The class string is still correct; the
>    thing it names as its reference no longer exists.
>
> **BOTH FIXED 2026-08-22.** `WORK_HREF` is `/work`, matching the detail page's `BACK_HREF`, and the
> comment that justified `/#work` is corrected in `not-found.tsx` and in `projectDetailContent.ts`.
> The container comments in `not-found.tsx` AND `app/error.tsx` — the second copy, not listed above —
> now name the reveal footer's inner panel instead of the deleted `Contact`.

---

### TICKET 1 — Project scaffold [M]
**Description:** Initialize a Next.js (App Router) + TypeScript + Tailwind project. Install and configure
React Three Fiber, drei, GSAP + ScrollTrigger, Lenis, and Framer Motion. Set up the folder structure
exactly as defined in the Technical Architecture Document (`/app`, `/components`, `/content`, `/lib`).
Add the color tokens and font imports (Space Grotesk, JetBrains Mono) from the Frontend Spec into the
Tailwind config / global CSS as CSS variables, with dark mode as default and a light mode variant ready
to toggle.
**Acceptance criteria:** Project builds and runs locally with no errors; theme tokens are usable via
Tailwind classes or CSS variables in both modes; Lenis smooth scroll is active on an empty page.
**Dependencies:** None — this is the first ticket.

> **RESTRUCTURE NOTE 2026-08-22 — shipped; one install no longer describes the site.** Next.js App
> Router, TypeScript, Tailwind, GSAP + ScrollTrigger, Lenis, the `motion` package and both font
> families are all present and in use, and the tokens live in `app/globals.css`, which `CLAUDE.md`
> makes the source of truth for every value.
>
> **React Three Fiber, drei and three are the exception.** They were installed exactly as this ticket
> required, and **no source module in `app/`, `components/`, `lib/` or `content/` imports any of them
> today** — the hero was rebuilt on Canvas2D. All three are still declared in `package.json`
> dependencies. Whether to remove them is a real question with a defensible answer either way, and it
> is **not decided here**: they are recorded as unused, not pruned.
>
> The folder structure is as the Technical Architecture doc defines it, with route groups added by the
> restructure: `app/(site)/(chrome)/` holds `page.tsx`, `about/` and `work/` and mounts the navbar.
> `docs/06` §4 explains why that is a nested route group — groups contribute no URL segment, so
> nothing moved off segment level `/` and the `@modal` intercept still fires.

---

### TICKET 2 — Content data layer [M]
**Description:** Create `content/types.ts`, `content/projects.ts`, `content/skills.ts`, and
`content/currentlyLearning.ts` using the shapes defined in the Technical Architecture Document.
Populate with real data: FOLIO, Aero-Grid, ClashChat, the Multi-Floor Call Center Network Design
(CCN) and the Secure & Scalable IT Infrastructure build (SNA) for projects; the three skill groups
(Core Dev, Systems Foundation, Currently Building Toward) for skills; and honest current-progress
entries for Currently Learning — where an empty array is a valid and honest answer, not a gap to
fill. Wire each project's `coverImage` and `screenshots` as **static imports** from
`public/images/projects/<slug>/`.
**Acceptance criteria:** All data files export typed arrays; no placeholder/fabricated content;
every project entry has real links where they exist (omit the field, don't fake a URL, where they
don't); **every image is a static import that resolves at build time — a missing or misnamed file
must fail the build, not ship a broken image; every image carries accurate, hand-written `alt` text
describing what is actually on screen.**

> Caveat on the build-failure criterion: it describes a property of the import mechanism, and that
> property is LATENT until something actually imports the content modules. While `/content` has no
> consumer, the static imports are never evaluated during a build, so a renamed file would not fail
> it. Ticket 2 verified the guarantee manually — by deliberately renaming an import path and
> confirming the module-not-found error — which is the only check available at that point. It
> becomes automatic once Ticket 6 renders the gallery. The criterion is correct; it was simply
> written as if it were self-enforcing on the day Ticket 2 shipped, and it was not.
**Dependencies:** Ticket 1.

> **RESTRUCTURE NOTE 2026-08-22 — this ticket is unchanged, and that is worth saying out loud.**
> Nothing in the data shapes moved. What changed is **who consumes them**: `content/projects.ts` now
> also exports `FEATURED_SLUGS` — a membership set, deliberately **not** a `featured` field on any
> entry — and the derived `featuredProjects`, so `/` renders three and `/work` renders all five from
> the same array in the same order.
>
> **The caveat above is now discharged.** The build-failure guarantee was latent while `/content` had
> no consumer; two galleries and five detail routes import the content modules today, so a renamed or
> missing image fails the build rather than shipping broken.

---

### TICKET 3 — Hero section: loader + reveal + 3D scene [M]
**Description:** Build the hero per the Frontend Spec's motion system: a minimal preloader (thin
progress line or percentage counter), a camera pull-back reveal transition using React Three Fiber, and
a staggered headline text reveal once the camera settles. Use `accent-hero` (`#00E5FF`) for any
glow/particle color in this section only. Respect `prefers-reduced-motion` with a simplified fallback
(skip 3D reveal, use a simple fade).
**Acceptance criteria:** Loader displays while assets load, transitions smoothly into the hero on
completion, works on both desktop and mobile viewport sizes, degrades gracefully under
`prefers-reduced-motion`.
**Dependencies:** Ticket 1.

> **RESTRUCTURE NOTE 2026-08-22 — shipped, then superseded in mechanism. The acceptance criteria are
> still met; none of the three named technologies is what meets them.**
>
> - **"a camera pull-back reveal transition using React Three Fiber"** — there is no R3F scene. The
>   hero is one Canvas2D context plus SVG (`components/hero/ParticleGrid.tsx`, with the pure-maths
>   `lib/hero/commandSphere.ts` beside it), and no source module imports `@react-three/fiber`,
>   `@react-three/drei` or `three` anywhere in the repo.
> - **"a minimal preloader (thin progress line or percentage counter)"** — split into two components
>   with two different jobs, per `docs/06` §1: `AssetLoader` answers "are the assets ready?" and
>   `Intro` performs. The Intro's seven-phase sequence and its `scale: 17` zoom-in — which **is** the
>   transition into the hero, not a step before one — are specified in `docs/06` §2 and `docs/07` §3.
> - **`accent-hero` (`#00E5FF`) is still Tier 1 only**, and the hero is a pinned dark plate in both
>   themes on purpose (`docs/07` §9.4).
> - **`prefers-reduced-motion` still degrades**, but to the Intro's 0.55s collapse rather than to
>   "skip 3D reveal, use a simple fade" (`docs/06` §2).

---

### TICKET 4 — About / Trajectory section [M]
**Description:** Build the About section narrating the dev-foundation → systems-coursework →
security/cloud pivot story, per the PRD's user-flow content. Apply Tier 2 motion (scroll-triggered
reveals) per the Frontend Spec.
**Acceptance criteria:** Section reads clearly, motion doesn't block readability, real copy (no
placeholder text), responsive on mobile.
**Dependencies:** Ticket 1.

> **RESTRUCTURE NOTE 2026-08-22 — shipped, then SPLIT ACROSS TWO ROUTES.** The narrative section this
> ticket describes is `components/sections/Trajectory.tsx`, is still on `/`, still Tier 2, still
> `foundation → systems → directions`. What is new is that **`/about` also exists** and carries a
> different thing: one 65-word first-person paragraph, a static MS mark, a portrait and an action row,
> on a single screen that does not scroll at `lg` and up — it scrolls below `lg` as of 2026-08-23, and
> `docs/07` §6 carries that split. `docs/07` §6 holds that paragraph as final approved copy and records
> why the coursework framing is deliberately absent from it — the bio carries the pivot, the Stack
> section carries the proof.
>
> **The portrait moved from Trajectory onto `/about` in `2cfdb34`, and that move had no ticket** — see
> the untracketed-work table at the top of this file.

---

### TICKET 5 — Skills section [M]
**Description:** Build the three-group skills display (Core Dev / Systems Foundation / Currently
Building Toward) reading from `content/skills.ts`. Use the tinted-white background technique sparingly
(from Frontend Spec) to subtly differentiate groups if desired.
**Acceptance criteria:** All three groups render from data, not hardcoded; visually communicates the
positioning without needing explanatory copy; responsive.
**Dependencies:** Tickets 1, 2.

> **RESTRUCTURE NOTE 2026-08-22 — shipped, and it survived a proposed replacement.** `docs/07` §5
> originally specified a **four-category logo grid** including a populated "Security Tooling" group.
> That was **retired, not deferred** (§5 and §9.3): a row of security-tool logos asserts working
> familiarity that `CLAUDE.md`'s positioning rule forbids, and `content/skills.ts` requires every
> Systems Foundation entry to render its `note`, because a course name is not a tool and has no logo.
> **The three groups this ticket asked for are what shipped.**
>
> Two refinements `docs/07` §5 added on top of this ticket's criteria: **two entry treatments, not
> one** — logo cards for Core Dev, name + note for Systems Foundation, sharing one sizing, spacing and
> motion language — and a **designed empty state** for Currently Building Toward, which is one line,
> "Reserved. This is the group that grows.", never a dashed box and never padded. §5's resolution 2
> also corrects this ticket's tier: **Skills is Tier 3**, and "Tier 2" would license exactly the
> hover-and-stagger logo grid the section has twice been designed away from.

---

### TICKET 6 — Projects gallery + card component [M]
**Description:** Build the project gallery reading from `content/projects.ts`. Cards use Tier 2 motion
(hover depth/parallax, staggered scroll-in). Clicking a card triggers a Framer Motion shared-element
(`layoutId`) transition into the detail page.
**Acceptance criteria:** Gallery renders all projects from data; hover and entrance animations work
smoothly at 60fps on a mid-range laptop; transition into detail page feels continuous, not a hard cut;
each card renders its project's `coverImage` through `next/image` using the intrinsic dimensions
carried by `StaticImageData` — no hand-copied width/height, no layout shift.

> **Caveat on the shared-element criterion — the morph moved to a new Ticket 6b (decided 2026-08-19,
> ticket-6-plan.md §0, G1 = "A-split").** As written, `layoutId` is not buildable in this install:
> Next 16.3.1 ships no `viewTransition` escape hatch, and an App Router push from `/` to
> `/projects/<slug>` unmounts the gallery before the detail mounts, so the morph has nothing to morph
> *from*. The correct architecture is intercepting + parallel routes
> (`app/(site)/@modal/(.)projects/[slug]/`), which keeps both endpoints in one React tree.
>
> That architecture is deferred rather than dropped, for one reason above the others: the morph's
> destination geometry — where the cover image lands on the detail page, at what width and aspect —
> is **Ticket 7's design output**, and `/projects/[slug]` is still a route stub. Building it now means
> guessing that geometry and retuning it in Ticket 7, and "feels continuous, not a hard cut" cannot be
> judged against scaffolding text.
>
> **Ticket 6 therefore ships the gallery with plain `<Link>` navigation** and deliberately no
> `layoutId`, not even an inert one — an unmatched `layoutId` still enrols the element in Framer's
> layout-projection tree and measures it on mount. **Ticket 6b — interception, the overlay shell,
> focus trapping, scroll lock, and the morph — is scheduled AFTER Ticket 7.** Its interim state is
> the honest downgrade with zero sunk cost: if 6b is never built, nothing needs unwinding.
>
> **Two contract lines this imposes on Ticket 7**, so 6b stays cheap: (1) the route file renders a
> presentational `<ProjectDetail project={…} />`, not inlined JSX, so 6b's overlay can render the same
> component; (2) **`<ProjectDetail>`'s** first visual element is the cover image **alone inside one
> wrapper element** — `<ProjectDetail>` the component, NOT the route: the route legitimately renders
> a back link above it, which 6b swaps for a close affordance — that wrapper is 6b's morph target. Ticket 7 also owes a back affordance pointing at
> `/#work`.
>
> **A third thing 6b must plan for, found in Ticket 7's review:** `<ProjectDetail>` owns the container,
> so the cover's **x and width** travel with the component into an overlay — but `<main>`'s padding
> and the back-link block live in the ROUTE file, so on the real route the cover's top sits roughly
> 106px (mobile) to 140px (≥1024px) below `<main>`. Inside an overlay none of that chrome exists.
> A 6b that nails the horizontal morph will still jump ~140px vertically the moment a user refreshes
> with the overlay open and the interception falls through to the real route. Do not hard-code an
> overlay top inset to compensate — it desynchronises silently the day anyone edits `pt-xl` or
> `mb-lg` in the route file.
>
> **Correction to how that paragraph frames the problem, made while building 6b.** "It will jump
> ~140px the moment a user refreshes" describes a morph artefact, and a refresh is a fresh document —
> there is no morph to jump, and Motion never sees the two states. The real defect is **permanent
> overlay-vs-route parity**: the same project, at the same URL, rendered at two different y positions
> depending on how you arrived. The prescribed fix was right either way; the *test* is different — it
> measures a static y position across a reload, not an animation frame.
>
> ### ✅ TICKET 6b SHIPPED AND VERIFIED IN A BROWSER — 2026-08-19
>
> Commits `45737f3` (frame + nav atom extraction) and `fb074e3` (interception + morph). The
> implementer had no browser and correctly reported the transition as **built but unproven**, per this
> file's own "unmeasured is unproven" standard. It has since been measured with Playwright against a
> production build, and all of it passes:
>
> | Check | Result |
> |---|---|
> | Static prerendering (the abort gate) | **14 pages, every one `●`, zero `ƒ`** — five intercepted variants added, five real routes untouched |
> | **Vertical parity** — the C3 constraint | cover top is **141px in the overlay and 141px on the real route: identical** |
> | Click → URL | `/` → `/projects/folio`, dialog opens |
> | Escape | URL returns to `/`, dialog closes |
> | Focus restoration | returns to the originating card link |
> | Scroll position | restored exactly (3185 → 3185) |
> | Scroll lock | a real wheel gesture does not move the page |
> | Reduced motion | opens, closes, URL correct, zero stranded reveals |
> | Unknown slug | 404 with the themed heading |
>
> **C3 is the one worth noting.** `docs/04` originally framed it as "the cover will jump ~140px on
> refresh". The planner corrected that — a refresh is a fresh document, so Framer never sees two
> states; the real defect was permanent **overlay-vs-route parity**, the same URL rendering at two y
> positions depending on how you arrived. Extracting `ProjectDetailFrame` so both paths render the
> same chrome fixes it by construction rather than by compensation, and the measured 141/141 is that
> working.
>
> One number in the original brief did not survive and was reported rather than glossed: the build
> emits **14** static pages, not 9. Adding a route made 9 arithmetically impossible; the condition
> that actually mattered — every route static, the five real ones untouched — holds.

> **On the other three criteria — corrected 2026-08-19.** An earlier version of this caveat said they
> "were met as written". That overclaimed: two of the three are *"hover and entrance animations work
> smoothly at 60fps on a mid-range laptop"* and *"no layout shift"*, and neither has been measured.
> `tsc`, `lint` and `build` being green proves neither one.
>
> **Verified statically:** the gallery renders every project from `content/projects.ts` with no group
> id or label string in JSX; each cover goes through `next/image` using the intrinsic dimensions
> `StaticImageData` carries, with no hand-copied width/height; `sizes` never under-declares.
>
> **Still needs a browser:** 60fps under a 4x CPU throttle, and CLS = 0 under network throttling.
> Until someone runs those, they are unproven rather than met.

> ### TICKET 6b — SHIPPED 2026-08-19. The shared-element morph and the overlay.
>
> Built in two commits: the frame/atom extraction, then the interception and the morph. **The
> blocking gate (V1) passed** — all five `/projects/<slug>` routes are still `●` (SSG) after
> interception, and the five intercepted variants prerender statically too. Nothing traded static
> HTML for a transition.
>
> **What shipped:** `app/(site)/layout.tsx` (a fragment, receiving the slot), the `@modal` parallel
> slot with a `null` default, the intercepting route at `@modal/(.)projects/[slug]/`,
> `ProjectDetailFrame` (Rule S-3 in `docs/03`), `ProjectOverlay` (Rule S-4), `CoverFrame`, the
> `layoutId` pair on the card's and the cover's wrappers, and two rules in `app/globals.css`
> (the document scroll lock, a transparent `dialog::backdrop`).
>
> **What did NOT change:** `ProjectCard`'s `<Link>` — interception is a routing concern and the link
> never learns about it, which is why the pre-6b state had zero sunk cost. No new token, no radius,
> no shadow, no scrim, no backdrop-blur. No new easing or duration constant: the morph is
> `DURATION.ui` + `EASE.reveal`, the fade is `DURATION.ui` + `EASE.ui`. `STAGGER.card` is still
> unused. `Reveal` gained no prop.
>
> **Verified without a browser:** `tsc`, `lint` and `build` clean; every utility class used emits
> real CSS (checked against the built stylesheet, since Tailwind renders nothing for an unknown
> utility); the served DOM of all five detail pages and of `/` is **byte-identical to the pre-6b
> build** after normalising chunk hashes, so the frame extraction changed no output; an unknown slug
> still returns a server-rendered 404.
>
> **Still needs a browser, and is therefore unproven rather than met** — the same standard the
> paragraph above applies to Ticket 6: the morph reading as continuous at 1440px; 60fps during it;
> Escape closing the overlay *and* returning the URL; focus returning to the originating card;
> the background genuinely not scrolling, including under touch; refresh parity (the cover at the
> same y on both paths); reduced-motion round trip; the reverse projection when the overlay's cover
> unmounts; and 360px. The implementation handoff lists these individually with what to look for.
>
> **The one honest correction to the plan:** deferring `router.back()` until the exit animation
> finishes does not remove the reverse projection onto the card, it moves it — the cover stays
> mounted for the whole fade, so the projection fires when the gallery is already visible. Named
> fallback if it reads badly: drop the exit animation and call `router.back()` straight out of
> `close()`, accepting a hard cut.

**Dependencies:** Tickets 1, 2.

> ### RESTRUCTURE NOTE 2026-08-22 — the gallery shipped; its FIRST criterion no longer describes `/`.
>
> *"Gallery renders all projects from data"* is now true of **`/work` only**. Home renders **three** —
> FOLIO, Aero-Grid, ClashChat, in `content/projects.ts` array order — and that is `docs/07` §5's
> locked decision, not a regression. The component itself filters, sorts and slices nothing: `/`
> passes `featuredProjects`, `/work` passes `projects`, and the whole difference lives at the two call
> sites. **No project entry carries a `featured` or `order` field**, deliberately, so display order
> cannot drift between the two pages.
>
> **CCN and SNA are archive-only**, which makes `/work` the only route on the site that links to their
> detail pages — and therefore the only place their card → overlay morph can be exercised at all. A
> future test of the morph that only opens Home tests three fifths of it.
>
> **Home's cards are scroll-scrubbed and `/work`'s are not.** `<Projects motion="scrub">` on `/`,
> `motion="reveal"` on `/work`; the prop is required and has no default, so the page that knows which
> route it is has to say so. `docs/07` §5 scopes scrubbing to Home; §7 replaces it with
> Intersection-Observer reveals below `md`.
>
> **6b's intercept is unaffected and was re-verified after the move** — `docs/06` §4 records cards
> being clicked on both `/` and `/work`, including CCN and SNA. The two unmeasured criteria above,
> 60fps under a 4× CPU throttle and CLS = 0, are **still unmeasured**, now across two galleries
> instead of one.

---

### TICKET 7 — Project detail page [M]
**Description:** Build the dynamic `/projects/[slug]` route rendering full project detail (description,
stack, real links, date, and the project's screenshot gallery) per Tier 3 motion rules — clean, minimal, typography-driven, simple fade/slide
reveals only.
**Acceptance criteria:** Each project in the data file has a working detail page; layout is clean and
readable; no 3D or heavy motion present; links open correctly; the screenshot gallery renders
correctly for 0, 1 and n images — CCN and SNA have none beyond their cover, FOLIO has one, Aero-Grid
and ClashChat have two — with no hardcoded two-up before/after assumption.
**Dependencies:** Tickets 2, 6.

> **RESTRUCTURE NOTE 2026-08-22 — shipped; the back affordance was retargeted.** This ticket's
> contract line — "Ticket 7 also owes a back affordance pointing at `/#work`", in Ticket 6's caveat —
> named an **anchor on Home**, because Home was the only place the archive existed. It points at
> **`/work`**, the route, now: `app/(site)/projects/[slug]/page.tsx:191` records the change and the
> reason, which is that `/#work` would land a visitor on the curated three, and two of the five detail
> pages (CCN, SNA) are not in that set at all. Everything else in the ticket stands, including the
> 0 / 1 / n screenshot-gallery criterion.

---

### TICKET 8 — Experience section [M]
**Description:** Build the Experience section covering the New Web Order internship (React/Next.js/
Tailwind/Supabase, fullstack, 2 months), framed accurately as real professional experience. Tier 3
motion.
**Acceptance criteria:** Accurate, resume-clean content; no exaggeration; responsive.
**Dependencies:** Ticket 1.

> **RESTRUCTURE NOTE 2026-08-22 — shipped, then RELOCATED.** The section itself is unchanged; it is on
> **`/work`**, not on `/`. `docs/07` §5: Experience and the full archive are both "the complete record"
> and are kept together in the quiet readable tier rather than interrupting Home's curated narrative.
> Its acceptance criteria are unaffected by the move — what changed is reach, not content, and
> `docs/01_PRD.md`'s amended user flow records that cost.

---

### TICKET 9 — Currently Learning / In Progress section [M]
**Description:** Build the section reading from `content/currentlyLearning.ts`, displaying current focus
areas honestly (sparse is fine). Include a simple "last updated" note. Tier 3 motion.
**Acceptance criteria:** Renders from data; visually distinct as "in progress" (e.g. status labels) but
not apologetic in tone; trivially editable by updating the data file only.
**Dependencies:** Tickets 1, 2.

> **RESTRUCTURE NOTE 2026-08-22 — shipped, then RELOCATED to `/work`, immediately after Experience.**
> `docs/07` §5 and §9.2 chose that placement as the only one costing nothing today:
> `content/currentlyLearning.ts` is an empty array, the component returns `null`, and **no section,
> heading or "last updated" note reaches the HTML at all**. `CURRENTLY_LEARNING_UPDATED` exists and
> has a real caller; it becomes visible with the first entry.
>
> **"Trivially editable by updating the data file only" is the criterion that matters most here, and
> it still holds** — this is the mechanism `CLAUDE.md` calls "the living part of the site", and
> §9.2 records that deleting it by omission would have removed the thing the positioning depends on.

---

### TICKET 10 — Contact / close section [M]
**Description:** Build the closing section with real links only (email, GitHub, LinkedIn — remove any
placeholder social links from the old site). Apply the small Tier 1 motion echo (slightly elevated
polish/easing vs. Tier 3, small `accent-hero` touch) so the site doesn't end flat.
**Acceptance criteria:** All links are real and functional; section feels like an intentional closing
beat, not an afterthought.
**Dependencies:** Ticket 1.

> ### ⛔ SUPERSEDED 2026-08-22 — the section shipped, and has since been ABSORBED AND DELETED.
>
> `components/sections/Contact.tsx` no longer exists. Phase 5 (`23d890d`) replaced it with the
> **reveal footer**: a `position: sticky; bottom: 0` `<footer>` sitting behind an opaque page stack,
> which the last section wipes up off as you scroll past. One component, two call sites — `/` and
> `/work` — and **deliberately not `/about`**, which `docs/07` §6 keeps as the one fully quiet page
> and which therefore has **zero `contentinfo` landmarks**.
>
> **Both of this ticket's acceptance criteria transferred intact and are still met:** the links are
> real (click-to-copy email, LinkedIn, GitHub — no placeholder socials), and the closing beat is more
> emphatically intentional than a static section was.
>
> **One objection recorded in the deleted file was retired rather than overruled**, and it is worth
> keeping: `Contact.tsx` had banned a copy-to-clipboard control because it would be inert before
> hydration and dead forever with JS blocked. `CopyEmailButton` takes an optional `href` and renders a
> working `mailto:` anchor until it hydrates, so there is no dead control at any point. The navbar
> adopted the same fallback in the same commit.
>
> **The reveal footer itself had no ticket** — see the untracketed-work table at the top of this file.

---

### TICKET 11 — Theme toggle (light/dark) [M]
**Description:** Implement a theme toggle switching between the dark (default) and light token sets
from the Frontend Spec. Persist the user's preference across sessions.
**Acceptance criteria:** Toggle works across every section without visual bugs (check both tinted-white
backgrounds in light mode); preference persists on reload; no flash-of-wrong-theme on load.
**Dependencies:** Ticket 1.

> **RESTRUCTURE NOTE 2026-08-22 — shipped; its PLACEMENT was reversed twice and now lives in the
> navbar.** The token switching, the persistence and the no-flash-on-load criteria are unchanged and
> still met. What moved is where the control is:
>
> 1. It began as the hero's single instance, anchored to the top-right inset of the shared container.
> 2. The navbar took that exact rectangle and **not** the control, so a desktop visitor on Home had no
>    way to switch themes at all.
> 3. `docs/07` §1 and `docs/06` §5 reverse it back into the bar: `hidden md:block` in the desktop
>    right cluster, one instance inside `NavMobileMenu` below `md`, **exactly one ever visible**.
>
> **"Works across every section without visual bugs" needs one qualification now.** The Hero renders
> the same dark plate in light mode, and that is designed behaviour, not a bug: `app/globals.css` pins
> `--color-hero-surface`, `--color-hero-fg` and `--color-hero-accent` out of the theme and says
> outright not to "complete the set". `docs/07` §9.4 verifies it and records a costed ladder if the
> dark plate is ever actually disliked. **Do not file it as a half-built light mode.**

---

### TICKET 12 — Responsive + accessibility pass [M]
**Description:** Full responsive pass across mobile/tablet/desktop for every section. Accessibility pass:
keyboard navigation, sufficient color contrast (verify `accent-working` against both background modes),
`prefers-reduced-motion` fallback confirmed site-wide, semantic HTML/ARIA where relevant.
**Acceptance criteria:** No layout breakage at common breakpoints; passes a basic accessibility audit
(e.g. Lighthouse); reduced-motion users get a usable, non-broken experience.
**Dependencies:** Tickets 1–11.

> **AUDIT RUN 2026-08-19 — measured against a production build, not reasoned.** Full record in
> `.claude/handoff/ticket-12-audit.md`; the cross-ticket conclusions are here because that file is
> gitignored.
>
> **Passing:** contrast across 4 routes × 2 themes (zero real failures); horizontal overflow across
> 24 viewport×route×theme combinations (zero); `prefers-reduced-motion` on every route (nothing
> stranded at `opacity: 0`); keyboard order following visual order everywhere; heading outline with no
> skipped levels. Card surfaces in light mode were measured for the first time — `bg-elevated` is a
> 1.073 step against `bg-base` and the `accent-working/30` border is 1.52:1, weaker than dark's 1.73.
> **No change: the surface step carries the card, the border is reinforcement.** Confirmed visually.
>
> **A method note worth keeping.** Tailwind v4 emits `oklab(… / 0.7)` for alpha modifiers, so parsing
> `getComputedStyle().color` as RGB produces a page of false contrast failures. Resolve colours
> through a canvas instead. Also scroll each page fully before asserting, or `Reveal`d elements below
> the fold report `opacity: 0` and read as stranded when they are simply untriggered.
>
> **Still open after this pass, deliberately:**
> - `bg-tint-cool` has no consumer, so light mode cannot be judged for it. It gets judged when it
>   first gets one.
> - ~~`HeroLoader.tsx:167` renders at `text-hero-fg/50` = **4.60:1**. It **passes AA**, and the site's
>   `/70` floor does not reach it — that floor exists because *light mode binds*, and the hero surface
>   is pinned with no light variant. Left as Ticket 3 tuned it.~~ **CLOSED 2026-08-22.** The component
>   is `components/intro/AssetLoader.tsx` since the Loader/Intro split and the counter now renders at
>   `text-hero-fg/70` (8.17:1). The reasoning above was sound and the outcome was still wrong: a
>   second, correct-but-different floor is the one a reviewer forgets exists, which `docs/03` says in
>   as many words. The ratio was also 4.63:1, not 4.60:1 — recomputed with the rest of that family.
> - Lighthouse was not run (no tooling available here). Its contrast, heading-order, viewport and
>   reduced-motion checks are covered by direct measurement above; its **performance** scoring is not,
>   and belongs with Ticket 13.

> **RESTRUCTURE NOTE 2026-08-22 — the audit above is real and its COVERAGE IS NOW STALE.** It ran on
> 2026-08-19 across **four routes**, before the restructure, and everything it measured still stands
> for what it measured. **What it never saw:** `/about`, `/work`, the navbar's active-route indicator,
> the reveal footer and its `contentinfo` landmark (plus About's deliberate zero), Home's
> scroll-scrub, the re-sited theme toggle, and the CV modal's focus trap.
>
> `.claude/handoff/restructure-plan.md` §7 schedules exactly this repeat as **Phase 6** and calls it
> "not optional polish". **No Phase 6 record exists in `.claude/handoff/`, so it is recorded here as
> NOT RUN rather than assumed either way.** One gap is already documented and unfixed: `docs/07` §1.1
> flags that `NavMobileMenu`'s links carry no `aria-current`, so below `md` there is no "you are here"
> announcement.
>
> The method note above — resolve colours through a canvas, scroll each page fully before asserting —
> still applies, and is the reason to reuse that audit's harness rather than start over.

---

### TICKET 13 — Deploy to Vercel [M]
**Description:** Connect the repo to Vercel, configure the production deployment, verify a real domain
or `.vercel.app` URL works end-to-end.
**Acceptance criteria:** Live site loads correctly, all sections and transitions work in production (not
just local dev), performance is acceptable (reasonable Lighthouse scores given the 3D content).
**Dependencies:** Tickets 1–12.

> **RESTRUCTURE NOTE 2026-08-22.** Shipped: `app/layout.tsx:83` sets
> `metadataBase: new URL("https://www.saaddev.top")`, and Ticket 17's record below documents that
> custom domain going live. **What the repo cannot confirm is whether the currently deployed build is
> this branch** — `hero-rebuild` carries the entire restructure and is not `main`. The criterion "all
> sections and transitions work in production, not just local dev" therefore has **not** been
> re-verified against the three-route site, and is not claimed met here.

---

### TICKET 14 — Contact form [S]
**Description:** Add a contact form wired to a serverless function or a form service (Resend/Formspree),
per the integration notes in the Technical Architecture Document. API key stored server-side only.
**Acceptance criteria:** Form submits successfully, sender gets a real notification, API key never
exposed client-side, basic spam deterrence (honeypot or simple rate limit) in place.
**Dependencies:** Ticket 13.

> **RESTRUCTURE NOTE 2026-08-22 — NOT BUILT, and the surface it was written for no longer exists in
> that form.** There is no `<form>` element anywhere in `app/` or `components/`. The closing beat is
> the reveal footer now, whose contact affordance is a **click-to-copy email with a working `mailto:`
> fallback**, plus LinkedIn and GitHub — real links, which is what Ticket 10 asked for and what
> `CLAUDE.md`'s "real links only" rule requires.
>
> **Whether a form is still wanted is Saad's call and is not decided here.** If it is built, the
> integration notes in the Technical Architecture doc and every security criterion above — server-side
> key, honeypot or rate limit — apply unchanged. What needs a new decision is *where it lives*:
> `/about` has no footer, and the reveal footer's height is fixed by design because its ScrollTrigger
> maths depends on it.

---

### TICKET 15 — Resume/CV download [S]
**Description:** Add a PDF resume download synced with site content, linked from the hero or contact
section.
**Acceptance criteria:** PDF is current, downloads correctly, content matches what's on the site.
**Dependencies:** Ticket 13.

> **RESTRUCTURE NOTE 2026-08-22 — SHIPPED, in a place this ticket does not name.** Not "linked from
> the hero or contact section": it is the **View CV** control in `/about`'s action row, which
> `docs/07` §6 specifies as the primary, filled button of `[View CV] [GitHub] [LinkedIn]`. It opens
> `public/resume/Muhammad_Saad_CV.pdf` in a focus-trapped modal with a separate **Download** button
> using the `download` attribute — an actual file save, distinct from the view that opened it — and on
> mobile it skips the modal entirely and opens a new tab, because inline PDF rendering is unreliable
> there.
>
> **The "PDF is current, content matches what's on the site" criterion is not repo-verifiable and is
> not claimed met here.** It is a content check only Saad can make.

---

### TICKET 16 — Lightweight analytics [S]
**Description:** Add Vercel Analytics (or equivalent) to track page views and scroll depth per the
PRD's success metrics.
**Acceptance criteria:** Analytics dashboard shows real traffic data post-launch; no PII collected
beyond standard anonymous analytics.
**Dependencies:** Ticket 13.

> **RESTRUCTURE NOTE 2026-08-22 — NOT BUILT.** No `@vercel/analytics` in `package.json`, and no
> analytics call anywhere in `app/`, `components/` or `lib/`. **This is what makes two of the PRD's
> four success metrics unmeasurable**, and `docs/01_PRD.md`'s amended metrics section now says so
> rather than implying the numbers exist.
>
> **One thing the restructure changed about this ticket's scope:** "page views and scroll depth" was
> written for one page. It is three routes now, plus five detail routes reachable either as a real
> navigation or as an intercepted overlay — and an overlay changes the URL without a document load.
> Whatever is installed has to be told about that, or the site's most shareable surfaces undercount.

---

### TICKET 17 — Social preview image (`og:image`) [S]
**Description:** The site has **no `og:image` anywhere**. Every URL pasted into LinkedIn, Discord,
Slack or a DM previews as text on a blank card — and the project detail pages are the site's most
shareable URLs. For a portfolio whose whole argument is "this is not a template," that is a bad first
impression delivered before anyone reaches the page. Add a static OG image plus per-page `openGraph`
metadata. `ticket-3-design.md` §7.2/§8 deliberately built the hero to be screenshot-publishable —
neutral fill light, legible silhouette at zero motion — precisely so this asset is free to produce.
**Acceptance criteria:** Every route resolves an `og:image`; previews render correctly in at least one
real scraper (LinkedIn Post Inspector or similar); `metadataBase` is set to the production origin; no
image is fabricated or shows content that is not really on the site.
**Dependencies:** Ticket 13 — `metadataBase` must be the real deployed origin, which is not known
until the site is deployed. Raised repeatedly from Ticket 3 onward and written down here so it is not
discovered from a bad link preview after launch.

> ### ✅ TICKET 17 SHIPPED — 2026-08-19
>
> Deployed origin is `https://www.saaddev.top` (custom domain), so `metadataBase` finally had a
> correct value and the two things blocked on it — `og:image` and `alternates.canonical` — both
> landed together.
>
> **The image is a real screenshot of the settled hero**, dark mode, captured at 1200×630 with a 2×
> DPR (2400×1260, 1.905:1, 197KB) from the live site. This is what `ticket-3-design.md` §17.4 asked
> for by name, and §7.2's neutral fill light plus §8's "legible silhouette at zero motion" test are
> why it needed no retouching. The only alteration is the theme toggle, hidden for the capture as
> site chrome rather than hero content. Nothing invented, nothing brightened — the criterion that no
> image may show content that is not really on the site is met literally.
>
> **The one real trap, and the reason `lib/metadata.ts` exists.** The Next file convention
> (`app/opengraph-image.png`) was implemented first and is the idiomatic answer. It is inherited only
> by routes that do **not** declare their own `openGraph` object — and `/projects/[slug]` declares
> one, because title, description, type and canonical are all per-project. Measured result: the five
> project detail pages, *the most shareable URLs on the site*, emitted **no `og:image` at all**, while
> `/` and `not-found` looked perfect. `next build` was green. It surfaced only by grepping the
> generated HTML. `openGraph` is resolved per segment and is **not** deep-merged into the parent's;
> any page declaring it must spread `OG_IMAGE` itself.
>
> **Coverage, measured across every prerendered route:**
>
> | Route | `og:image` | `og:image:alt` | canonical |
> |---|---|---|---|
> | `/` | ✅ | ✅ | `https://www.saaddev.top` |
> | `/projects/<slug>` ×5 | ✅ | ✅ | per-slug, correct |
> | `(.)projects/<slug>` ×5 (intercept) | ✅ | ✅ | homepage — correct, the overlay is not an independently served document |
> | `not-found` | ✅ | ✅ | inherits `/` |
> | `_global-error` | ❌ | ❌ | — |
>
> `_global-error` is Next's internal runtime fallback, not a reachable or shareable URL, and is
> deliberately left alone.
>
> **No `twitter.images` is declared.** X falls back to `og:image`, so naming the file again would put
> a second copy of the asset in the repo to say the same thing. The card *type* is declared, without
> which X renders the small square `summary` card and crops a 1.91:1 hero into it.

> **RESTRUCTURE NOTE 2026-08-22 — the coverage table above predates `/about` and `/work`. Both were
> measured, and both emit an `og:image`.** Neither page declares an `openGraph` object — each sets
> only `title` and `alternates.canonical` — so both inherit the root layout's, which spreads
> `OG_IMAGE`. That is this ticket's own inheritance rule working in the direction it is supposed to.
>
> | Route | `og:image` in the built HTML |
> |---|---|
> | `/about` | ✅ `https://www.saaddev.top/og-hero.png` |
> | `/work` | ✅ `https://www.saaddev.top/og-hero.png` |
>
> Measured by grepping the generated markup of a production build — the same method that caught the
> original per-segment failure, where `next build` was green too.
>
> ### ⚠️ THE ASSET ITSELF IS STALE. `lib/metadata.ts` PREDICTED THIS EXACTLY, AND THE PREDICTION CAME TRUE.
>
> Its header says: *"Regenerate by rescreenshotting, never by editing: if the hero changes, this asset
> is stale, and a preview card that no longer matches the page is worse than a plain one."*
> **The hero has changed since.** In this branch's history `4636d58` (this ticket) precedes `768ce46`
> (the Canvas2D hero rebuild), `0ec74ba` and `f640107` (the command sphere).
>
> `OG_IMAGE.alt` still describes *"the name SAAD as extruded 3D type lit by a cyan rim"*. There is no
> SAAD wordmark in the hero any more — `heroContent.ts` states outright that the `<h1>` "is now the
> only place the name exists in the hero's own DOM ... rather than an oversight left by deleting the
> SAAD wordmark" — and the subject is the command sphere on a Canvas2D field.
>
> **So both the PNG and its alt text describe a hero that is not on the site, which is exactly what
> this ticket's criterion — "no image is fabricated or shows content that is not really on the site" —
> forbids. That criterion is FAILING, not met.** The remedy is a recapture plus a rewritten `alt`;
> that is code and copy rather than docs, so it is recorded here and deliberately not done in this
> pass. **Do not fix it by editing the PNG.**


---

### TICKET 18 — Themed error and not-found pages [S]
**Description:** Two site-wide chrome gaps, grouped because they are the same category of work and
share their copy register. `app/error.tsx` does not exist, so a runtime error in any client component
falls through to Next's default screen; `app/not-found.tsx` does not exist, so an unknown project slug
renders an unthemed 404 sitting off the site's spine. Both should use the shipped tokens, Rule S-1's
left-anchored container, and Tier 3 restraint. Copy is Saad's.
**Acceptance criteria:** A thrown client error renders a themed page with a working recovery action; an
unknown `/projects/<slug>` renders a themed 404 with a link back to `/#work`; both honour Rules S-1
and S-2 and both light and dark themes; no fabricated apology copy.
**Dependencies:** Tickets 1, 7, 11. Flagged in Ticket 3 (`error.tsx`) and Ticket 7 (`not-found.tsx`),
neither of which owned it.
**Inherited from Ticket 11:** both pages are `bg-base`, so each takes **one** `<ThemeToggle>` with
`THEME_TOGGLE_ON_BASE` (`components/ui/ThemeToggle.tsx`). The toggle is one in-flow instance per
route, at the top, right-aligned inside the same `mx-auto w-full max-w-[1440px] px-md sm:px-xl
lg:px-2xl` container the back link uses — never fixed or floating. `className` is required and has no
default; passing `THEME_TOGGLE_ON_HERO` here would render `hero-accent` on a surface that flips.
Without it, a light-mode visitor who hits an error has no way back to light mode on that page.

> **RESTRUCTURE NOTE 2026-08-22 — shipped; ONE LIVE STALENESS, recorded rather than fixed.**
>
> This ticket's criterion reads *"an unknown `/projects/<slug>` renders a themed 404 with a link back
> to `/#work`"*, and that is still literally what the page does: **`app/not-found.tsx:94` sets
> `WORK_HREF = "/#work"`.** The anchor resolves — `id="work"` is on the `Projects` section, which
> renders on both routes — so nothing is broken. **But `/#work` on Home is the curated three now, not
> the archive**, and `/work` is where a visitor who hit a dead project URL should land. The detail
> route was retargeted in Phase 2 and this page was not.
>
> **The fix is a code change, not a docs one, so this note names it and leaves it.**
> `projectDetailContent.ts:42` also documents `/#work` as the destination, and renaming "Work" is
> already recorded there as a multi-file commit — this is one more file in that set.
>
> A second, cosmetic staleness in the same file: its container comment claims byte-identity with
> "`Contact` and the five shipped sections". **`Contact` was deleted in `23d890d`.** The class string
> is still correct; its stated reference no longer exists.
>
> **Both fixed 2026-08-22** — see the resolution note at the top of this file.

---
