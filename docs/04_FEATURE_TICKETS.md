# Feature Ticket List — Muhammad Saad Portfolio

Each ticket is written to be usable directly as a prompt for Claude Code. Priority: **M** = must-have for
launch, **S** = should-have, **N** = nice-to-have.

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

---

### TICKET 4 — About / Trajectory section [M]
**Description:** Build the About section narrating the dev-foundation → systems-coursework →
security/cloud pivot story, per the PRD's user-flow content. Apply Tier 2 motion (scroll-triggered
reveals) per the Frontend Spec.
**Acceptance criteria:** Section reads clearly, motion doesn't block readability, real copy (no
placeholder text), responsive on mobile.
**Dependencies:** Ticket 1.

---

### TICKET 5 — Skills section [M]
**Description:** Build the three-group skills display (Core Dev / Systems Foundation / Currently
Building Toward) reading from `content/skills.ts`. Use the tinted-white background technique sparingly
(from Frontend Spec) to subtly differentiate groups if desired.
**Acceptance criteria:** All three groups render from data, not hardcoded; visually communicates the
positioning without needing explanatory copy; responsive.
**Dependencies:** Tickets 1, 2.

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

---

### TICKET 8 — Experience section [M]
**Description:** Build the Experience section covering the New Web Order internship (React/Next.js/
Tailwind/Supabase, fullstack, 2 months), framed accurately as real professional experience. Tier 3
motion.
**Acceptance criteria:** Accurate, resume-clean content; no exaggeration; responsive.
**Dependencies:** Ticket 1.

---

### TICKET 9 — Currently Learning / In Progress section [M]
**Description:** Build the section reading from `content/currentlyLearning.ts`, displaying current focus
areas honestly (sparse is fine). Include a simple "last updated" note. Tier 3 motion.
**Acceptance criteria:** Renders from data; visually distinct as "in progress" (e.g. status labels) but
not apologetic in tone; trivially editable by updating the data file only.
**Dependencies:** Tickets 1, 2.

---

### TICKET 10 — Contact / close section [M]
**Description:** Build the closing section with real links only (email, GitHub, LinkedIn — remove any
placeholder social links from the old site). Apply the small Tier 1 motion echo (slightly elevated
polish/easing vs. Tier 3, small `accent-hero` touch) so the site doesn't end flat.
**Acceptance criteria:** All links are real and functional; section feels like an intentional closing
beat, not an afterthought.
**Dependencies:** Ticket 1.

---

### TICKET 11 — Theme toggle (light/dark) [M]
**Description:** Implement a theme toggle switching between the dark (default) and light token sets
from the Frontend Spec. Persist the user's preference across sessions.
**Acceptance criteria:** Toggle works across every section without visual bugs (check both tinted-white
backgrounds in light mode); preference persists on reload; no flash-of-wrong-theme on load.
**Dependencies:** Ticket 1.

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
> - `HeroLoader.tsx:167` renders at `text-hero-fg/50` = **4.60:1**. It **passes AA**, and the site's
>   `/70` floor does not reach it — that floor exists because *light mode binds*, and the hero surface
>   is pinned with no light variant. Left as Ticket 3 tuned it.
> - Lighthouse was not run (no tooling available here). Its contrast, heading-order, viewport and
>   reduced-motion checks are covered by direct measurement above; its **performance** scoring is not,
>   and belongs with Ticket 13.

---

### TICKET 13 — Deploy to Vercel [M]
**Description:** Connect the repo to Vercel, configure the production deployment, verify a real domain
or `.vercel.app` URL works end-to-end.
**Acceptance criteria:** Live site loads correctly, all sections and transitions work in production (not
just local dev), performance is acceptable (reasonable Lighthouse scores given the 3D content).
**Dependencies:** Tickets 1–12.

---

### TICKET 14 — Contact form [S]
**Description:** Add a contact form wired to a serverless function or a form service (Resend/Formspree),
per the integration notes in the Technical Architecture Document. API key stored server-side only.
**Acceptance criteria:** Form submits successfully, sender gets a real notification, API key never
exposed client-side, basic spam deterrence (honeypot or simple rate limit) in place.
**Dependencies:** Ticket 13.

---

### TICKET 15 — Resume/CV download [S]
**Description:** Add a PDF resume download synced with site content, linked from the hero or contact
section.
**Acceptance criteria:** PDF is current, downloads correctly, content matches what's on the site.
**Dependencies:** Ticket 13.

---

### TICKET 16 — Lightweight analytics [S]
**Description:** Add Vercel Analytics (or equivalent) to track page views and scroll depth per the
PRD's success metrics.
**Acceptance criteria:** Analytics dashboard shows real traffic data post-launch; no PII collected
beyond standard anonymous analytics.
**Dependencies:** Ticket 13.

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

---
