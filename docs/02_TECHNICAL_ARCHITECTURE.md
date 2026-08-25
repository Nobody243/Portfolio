# Technical Architecture Document — Muhammad Saad Portfolio

> **RECONSTRUCTED 2026-08-25 — the `/projects` passages in this file are rewrites, not restored
> originals.** A `git-filter-repo` run reset every tracked file to its committed state. Source files
> came back verbatim out of `.next` source maps; **markdown is never bundled, so nothing recovered a
> line of documentation.** Everything here dated 2026-08-25 — the fourth entry in the folder tree,
> the `<main>` recount, the `contentinfo` bullet, the `docs/07`-splits-the-site correction — was
> rewritten from `.claude/specs/projects-architecture-spec.md` (gitignored, and therefore the only
> survivor) and then **verified against the code**: the tree against `app/`, the `fade` call sites
> and `<main>` count against `grep`, the route table against a real `npm run build`. Where the spec
> described intent and the code disagreed, the code won.

## Tech stack, with reasoning

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Saad already knows it from the internship; strong performance/SEO defaults matter since recruiters will cold-load this link |
| Hero visual | **Canvas2D + SVG. No WebGL.** | The hero is a 2D canvas particle field (`components/hero/ParticleGrid.tsx`) plus SVG for the Intro's mark. See the row below for what this replaced and why the packages are gone |
| Scroll-synced animation | GSAP + ScrollTrigger | Industry standard for precisely choreographed scroll timelines — this is what actually drives the Tier 1 → 2 → 3 energy curve |
| Smooth scroll | Lenis | Gives the whole site the "buttery" felt-smoothness that's part of the brief even in the minimal Tier 3 sections |
| Component-level transitions | Framer Motion | Handles the project-card → detail shared-element transition and general UI micro-interactions; kept separate from GSAP so the two don't fight over the same elements |
| Styling | Tailwind CSS | Fast, already known, works well for the restrained Tier 3 sections |
| Hosting | Vercel | Zero-friction with Next.js, already used for other projects (Aero-Grid) |
| Fonts | Space Grotesk (headings/UI), JetBrains Mono (technical accents) | See Frontend Spec doc |

> **The 3D row used to read: "React Three Fiber + drei — Three.js expressed as React components …
> drei supplies common helpers (camera rigs, loaders) so we're not reinventing them."** The R3F hero
> scene (`SaadGlass`, `TextGeometry`, the extruded SAAD wordmark) was replaced during the hero
> rebuild by a Canvas2D particle field and an SVG mark. The four packages —
> `@react-three/drei@10.7.8`, `@react-three/fiber@9.7.0`, `three@0.185.1`, `@types/three@0.185.4` —
> **survived that deletion with zero importers anywhere in the repo**, along with an
> `"overrides": { "three": "$three" }` block whose only job was to pin them and drei's own transitive
> graph (`gainmap-js`, `camera-controls`, `maath`, `meshline`, `stats-gl`). **All of it was
> uninstalled on 2026-08-22.** The build stayed at 16/16 pages, which is the point: nothing was
> using them, and nothing said so.
>
> **`public/fonts/space-grotesk-latin.typeface.json` is NOT part of that removal.** Its extension is
> a three.js convention and it is the one file in the repo that still looks like R3F debris. It is
> read at build time by `scripts/extract-glyph-outlines.mjs` to generate
> `components/ui/msMarkGlyphs.ts`, which drives the Intro's name → MS-mark sequence. Deleting it
> breaks the Intro. `app/layout.tsx` and `public/fonts/README.md` both carry the same warning.

No backend framework, no database, no auth provider — this is a static/content-driven site. If a contact
form is added, it posts to a lightweight serverless function or a third-party form endpoint (see
"Third-party services" below) rather than a custom backend.

## Folder structure

```
/app
  /(site)
    /(chrome)                — the FOUR chrome-bearing routes. The group exists so Navbar +
                               IntroGate mount ONCE in its layout instead of per page
      /page.tsx              — Home: Hero, Trajectory, Skills, Projects (featured three)
      /about/page.tsx        — /about, one screen at lg+; scrolls below lg (docs/07 §6, 2026-08-23)
      /work/page.tsx         — /work: the fanned deck (all five), Certifications,
                               Experience, CurrentlyLearning
      /projects/page.tsx     — /projects, the strip list. INSIDE the group, and the
                               indent is the whole point: this is the one-segment
                               INDEX route, and it is a sibling of the [slug] segment
                               two lines below, which sits OUTSIDE the group
    /projects/[slug]/page.tsx — Project detail pages. NOT in (chrome): no navbar
    /@modal/(.)projects/[slug] — the intercepted overlay for the same URL
  /not-found.tsx
  /error.tsx
  /layout.tsx
  /globals.css
/components
  /hero                      — Hero, HeroHeadline, ParticleGrid (Canvas2D), heroContent
  /intro                     — AssetLoader, Intro, IntroGate, and the three files that
                               decide WHEN the gate mounts: IntroSession (the flags),
                               IntroContext (the arriving/introDone wires) and
                               IntroProvider (mounted by the (chrome) layout). See docs/06
  /about                     — AboutScreen, CvAction, and /about's content + button styles
  /sections                  — Trajectory, Skills, Experience, CurrentlyLearning, Projects,
                               ProjectCard, ProjectDetail(+Frame), ProjectOverlay, RevealFooter,
                               and each one's `*Content.ts` copy file
                               (RevealFooter absorbed the old Contact section in Phase 5 — see
                               "The page stack" below, which is a hard layout requirement rather
                               than a styling preference)
  /ui                        — shared primitives (nav, mark geometry, theme toggle, reveals)
/content
  types.ts                   — shared content types. NOT in the original listing: a deliberate
                               fourth file, because Project.category is typed as SkillGroup and
                               colocating types would force projects.ts to import skills.ts.
                               Flagged in the style of the lib/hooks/ deviation recorded in
                               .claude/handoff/review-fixes-2026-08-17.md.
  projects.ts                — structured project data (see "Content shape" below)
  skills.ts                  — structured skills data, grouped by SkillGroup
  currentlyLearning.ts       — structured "in progress" entries
  experience.ts              — the internship entry
  contact.ts                 — the real links (email, GitHub, LinkedIn)
/lib
  /animation                 — GSAP timeline configs, shared easing curves, the Intro→Hero handoff
  /hero                      — commandSphere.ts, the hero visual's geometry maths
  /hooks                     — useReducedMotion, useSectionScroll
  theme.ts                   — theme storage key, apply/read helpers, and the pre-paint anti-flash
                               script source. Deliberately has NO "use client": it is imported by
                               both the server root layout and the client toggle, and adding a
                               directive would drag the layout into a client boundary for a string.
                               See "Client-side persisted state" below.
  metadata.ts                — the shared OG/Twitter image descriptor
  formatMonthYear.ts         — the one date formatter, shared by Experience and project detail
/scripts
  extract-glyph-outlines.mjs — build-time only. Reads the typeface JSON, writes msMarkGlyphs.ts
/public
  /fonts, /images, /resume, og-hero.png
```

> **What this listing used to say, and why it was wrong.** Five entries described a site that had
> already changed, and this doc is where someone new starts:
>
> - **`/page.tsx — Hero + all sections composed on one scroll (or routed sections, TBD at build
>   time)`.** That was decided long ago and the decision went the other way: `docs/07` split the
>   site into three routes, and `.claude/specs/projects-architecture-spec.md` §3 added `/projects` as
>   a fourth on 2026-08-25. The "TBD" outlived the decision by the whole restructure. *(This bullet
>   read "`docs/07` splits the site into three routes" — present tense, three — until 2026-08-25.
>   Three at the restructure, four since; the tense is what made it read as a current count rather
>   than a record of what one spec did.)*
> - **`/hero — 3D scene, loader, reveal transition`.** There is no 3D scene, and the loader moved to
>   `/components/intro` in the Loader/Intro split (`docs/06` §1).
> - **`/projects — ProjectCard, ProjectGallery, ProjectDetail`.** The directory still exists, but it
>   is empty apart from a `.gitkeep`; every one of those three components lives in
>   `/components/sections`, and `ProjectGallery` was never built under that name (`Projects.tsx` is
>   the gallery). Left in place rather than deleted, because nothing depends on the answer — but
>   nothing should be added there without moving the rest.
> - **`/lib/three — reusable R3F scene helpers`.** Never created; `lib/hero/` is where the hero's
>   maths actually lives. `docs/03` sent readers to a file inside it as recently as this sweep.
> - **`/public/models`.** An empty `.gitkeep` directory left behind by the deleted 3D scene, removed
>   2026-08-22.
>
> `/components/intro`, `/components/about`, `/lib/hero`, `/lib/hooks`, `/scripts` and the whole
> `(chrome)` route group were real and unlisted.

### The page stack — a required shape, not a preference

Every route that renders `components/sections/RevealFooter.tsx` (today `/` and `/work`) must have
this DOM shape, and getting it wrong fails silently rather than loudly:

```
<body class="flex min-h-full flex-col">      app/layout.tsx
  <header data-nav-root>            z-[55]    the (chrome) layout's Navbar
  <main class="relative z-10 bg-base">        the page stack — OPAQUE, ABOVE
    <div data-page-stack>                     PageStack's fade layer, INSIDE
      … all sections …
    </div>
  </main>
  <div id="reveal-footer-top">                zero-height sentinel, in flow
  <footer class="relative z-0 md:sticky md:bottom-0 bg-hero-surface">
  [the entry gate, while it exists]  z-50 / z-[60]
</body>
```

**The header is `z-[55]`, and the number is defined by sitting between two others.** It was `z-40`
until 2026-08-22, which was correct only by accident: the Intro's `fixed inset-0 z-50` plate used to
be rendered by `Hero`, inside `<main class="relative z-10">`, and a positioned element with a
z-index establishes a stacking context — so the plate's 50 never reached this stack and 40 outranked
it. Moving the gate to the `(chrome)` layout made that z-50 body-level for the first time and would
have inverted the order, putting the bar's entire slide-in behind an opaque plate. Required order,
bottom to top: **`<main>` 10 < Intro plate 50 < header 55 < AssetLoader 60.** Renumber any of them
and 55 has to move with it.

- **`<main>`'s `bg-base` and `z-10` are load-bearing.** The footer is pinned behind the page from
  the first painted frame, and `<main>` is the only thing occluding it. Inheriting the page
  background does **not** work: a background on `html`/`body` propagates to the canvas, which
  paints below every positioned descendant. Without both classes the dark plate shows through every
  section at every scroll position. `docs/03_FRONTEND_SPEC.md`'s **Rule S-6** is the binding
  statement, including the ban on `overflow`/`transform`/`filter` anywhere between `<body>` and the
  footer, and the requirement that Lenis stays in `root` mode.
- **The `<footer>` must stay a direct child of `<body>`,** for two independent reasons: it is the
  `contentinfo` landmark only when its nearest ancestor is `<body>`, and `<body>` is what bounds
  the sticky offset so the plate can never float below the end of the document.
- **The sentinel is `<RevealFooter />`'s own first element** and is not optional. The footer is
  sticky, so its rect reports the pinned position rather than the document position; the sentinel
  is the in-flow element `Navbar.tsx` measures to know when the un-occluded plate reaches the bar.
  Its absence on `/about` is what keeps that route's navbar palette correct with no route check.
- **Neither `/about` nor `/projects` has the footer or the page-stack classes, deliberately.** There
  is no plate to occlude on either, so both have zero `contentinfo` landmarks
  (`docs/07_SITE_RESTRUCTURE.md` §5–6). *(This bullet named `/about` alone and called it "the one
  route with zero `contentinfo` landmarks" until 2026-08-25. `/projects` shipped without a footer on
  a separate ruling — §5 records it — and both pages pass `PageStack` an empty class string for the
  same Rule S-6 reason.)*
- **`<main>` is rendered by `components/ui/PageStack.tsx` on `/`, `/work`, `/projects` AND `/about` —
  all four routes in the `(chrome)` group — and where the route transition runs it fades that
  component's INNER div, never `<main>` itself.** Added 2026-08-22 with the Home ↔ About ↔ Work
  transition; `/projects` joined the group on 2026-08-25 and takes the same `<main>` and the same
  fade.
  (This bullet listed only `/` and `/work` and then added `/about` four bullets later, which read as
  two different claims about the same component. It is one claim: **four** routes render it, and
  **three of them pass `fade`** — `/`, `/work` and `/projects`. `/about` passes `fade={false}`; see
  `docs/03_FRONTEND_SPEC.md` for why. It is NOT every route: `not-found.tsx`, `error.tsx` and
  `/projects/[slug]` render their own `<main>` and do not fade, which makes **four of the site's
  seven `<main>` elements** the `PageStack` ones. That count is restated in three places —
  `app/layout.tsx`, `docs/03_FRONTEND_SPEC.md` and this bullet — and every one of them read
  three-of-six until 2026-08-25, which is the whole argument against restating a count at all.
  Counted here off `grep -rn "<main" app components` and off the four `PageStack` call sites, not
  carried over from either of the others.) Three things about it are load-bearing and one of
  them was found by measurement rather than by reading:

  1. **There is no `template.tsx` and there must not be one.** A `motion.div` wrapping
     `{children}` in `app/(site)/(chrome)/template.tsx` is the obvious mechanism and it breaks the
     shape above outright — `<footer>` stops being a direct child of `<body>`, which this section
     already records as failing silently — while also animating exactly the properties Rule S-6 bans
     between `<body>` and the footer.
  2. **Even a wrapper around `<main>` alone is wrong.** `opacity < 1` creates a stacking context,
     so `<main>`'s `z-10` would become local to the wrapper, and the wrapper at `z-index: auto`
     then paints before the footer's `z-0` in DOM order. The plate shows through the whole page.
  3. **And `<main>` itself must not be the animated element, which is the part that is easy to get
     wrong twice.** `<main>`'s own `bg-base` is the only thing occluding the plate, so fading
     `<main>` fades the occluder. MEASURED at 1440×900, scroll 0: the plate spans y=107.2 to y=900
     on both `/` and `/work`, and at `<main>` opacity 0.5 in light mode the entire viewport goes
     dark with the footer's "Contact" heading legible through the project cards. Putting the fade on
     a child keeps `<main>` fully opaque and paints the fade inside its existing `z-10` stacking
     context, which is above the footer rather than beside it.

  `/about` passes an empty class string — it has no plate to occlude, so Rule S-6's two classes stay
  off it exactly as the bullet above says — and `fade={false}`. Both are REQUIRED props with no
  default, so both stay call-site decisions.

  **Rule S-6's opaque background is not the same colour on every route.** `/work` passes `bg-base`;
  `/` passes `bg-hero-surface`, because on `/` this element is what the navbar sits on for the first
  ~150ms of an arriving route transition and the hero's palette is already correct for a dark
  ground. `app/(site)/(chrome)/page.tsx` carries the measurement. What Rule S-6 requires is that the
  background be OPAQUE, not that it be `bg-base`.

## Content shape (plain English — this replaces a database schema)

There is no database. Content lives in typed data files under `/content`, imported directly into
components. This is what makes "build once, update over the year" actually work — adding a project or
cert later means editing an array, not touching layout code.

**Project entry** — one object per project (FOLIO, Aero-Grid, ClashChat, future security projects):
- `slug` — URL-safe identifier, used for the detail page route
- `title`, `oneLiner` — name and a one-sentence description for the gallery card
- `description` — fuller write-up for the detail page (problem, approach, what was built)
- `stack` — array of technologies used
- `links` — object with optional `github` and `live` URLs (omit rather than fabricate if one doesn't exist)
- `date` — when it was built/shipped
- `credit` — optional honest credit line, omitted when the work was solely Saad's. It does two
  things: it stops shared work from being silently presented as solo work, and where Saad's role was
  a leading one it says so plainly ("Led a team of 4"). It is **not** a job title — it describes what
  happened on one project, not a position held. Every value must be one Saad has explicitly
  confirmed. Where a collaborator has not consented to being named publicly, the credit states the
  team size and role without naming anyone — it never guesses at consent.
- `category` — which skill group the project belongs to, typed as `SkillGroup` (useful if projects
  are later filtered). **Renamed from `tier` in Ticket 2.** `tier` is reserved project-wide for the
  Tier 1/2/3 motion system and is never used as a data field name, anywhere. The rename exists so
  `project.tier === "core-dev"` can never sit inside a Tier 2 component next to Tier-2 motion config.
- `coverImage` — the single image the gallery card uses: `{ src, alt }`. **Required** — every project
  has one, so Ticket 6 never needs a no-image fallback card. Kept as a separate field from
  `screenshots` so the card's pick never depends on screenshot ordering; it may point at the same
  file as one of them.
- `screenshots` — ORDERED array of `{ src, alt, caption }` for the detail page. Deliberately an array,
  not one image: a project's interface is not always one view. FOLIO puts its search interface and its
  results view on **separate pages**, and both need capturing and showing — as a small gallery or a
  before/after pair — or the detail page misrepresents how the thing actually works. Single-view
  projects (Aero-Grid, ClashChat) simply have a shorter array, so the detail page must render 1, 2, or
  n images without assuming a pair. `caption` is what labels each view ("Search", "Results"); `alt` is
  the accessibility description and is required, not optional (see Ticket 12).

Image notes — **settled in Ticket 2:**
- Images are **static imports**, not string paths: `import cover from
  "@/public/images/projects/folio/cover.png"`. Chosen over string paths + explicit `width`/`height`
  for two reasons: a missing or misnamed file becomes a **build error** rather than a broken image in
  production, and `StaticImageData` carries real intrinsic dimensions, so `next/image` prevents
  layout shift with nothing hand-copied. `import type { StaticImageData } from "next/image"` is the
  one permitted `next/*` reference under `/content` — it is type-only and erased at compile time.
- Screenshot counts **vary**: 0 for CCN and SNA, 1 for FOLIO, 2 for Aero-Grid and ClashChat. Ticket 7
  must render 0, 1 or n without assuming a pair. Projects with no additional images **omit the
  `screenshots` key entirely** rather than setting `[]`.
- `alt` is content and is required on every image — accurate, hand-written, describing what is
  actually on screen. `caption` is separate, optional, visible editorial copy and never substitutes
  for `alt`.
- **An art-directed image rendered as two mutually exclusive elements gets `priority` on BOTH, and
  the identical `sizes` string on both. Added 2026-08-22 from `/about`'s portrait.** CSS cannot move
  a node between two parents, so a photograph that belongs in different parents at different
  breakpoints is two `<Image>` elements with the other `display: none`. Next deduplicates identical
  preloads, so two `priority` props emit **one** `<link rel=preload as=image>` and produce **one**
  request — measured at 375, 640 and 1440 at DPR 1 and 2, resolving to w=128 / 256 / 256 / 384 / 384
  / 828. Putting `priority` on only one element measures the same today and is still wrong: the
  element it is missing from is the one actually painted at its own breakpoint, it ships
  `loading="lazy"`, and it is fast only as a side effect of a hidden sibling's preload. Both strings
  must also cover **all** bands, including the band at which that element is hidden — a preload
  resolves against the viewport, not against the CSS that will later hide the element.

**Skill entry** — one object per skill:
- `name`, `group` (`"core-dev" | "systems-foundation" | "building-toward"`), optional `note`

**Currently Learning entry** — one object per in-progress item:
- `title`, `status` (`"in-progress" | "planned" | "completed"`), `description`, `startedDate`,
  optional `completedDate`, optional `link` (cert page, course, etc.). Lifecycle: a completed item
  **graduates** out of this section into `skills.ts` under `building-toward` rather than lingering
  here, so "Currently Learning" stays literally true while the achievement stays visible;
  `completedDate` records that transition. An **empty array is a valid, honest state** for this file.

## Client-side persisted state

There is exactly one piece of persisted client state on this site, and it is expected to stay that way.

| Key | Values | Written by | Read by |
|---|---|---|---|
| `saad-portfolio-theme` | `"light"` \| `"dark"` — nothing else is ever written | `components/ui/ThemeToggle.tsx` | the pre-paint script in `app/layout.tsx`, sourced from `lib/theme.ts` |

**`localStorage`, deliberately not a cookie, and this is a build-output decision rather than a
preference.** A cookie would let the server render the correct theme class and remove the
flash-of-wrong-theme with no script at all. It would also make the root layout read a **dynamic API**,
which opts **every route** out of static prerendering and destroys the CDN caching that makes the site
fast. That is a real, permanent cost for an aesthetic nicety. `localStorage` plus a ~130-byte
synchronous inline script in `<head>` keeps the build fully static and kills the flash before first
paint. **Verify the route table still shows every route as static after touching the root layout.**

Rules that go with it, all enforced in `lib/theme.ts`:

- **The key is namespaced on purpose.** `localhost:3000` is one shared origin across every project on
  a dev machine, so a bare `theme` key genuinely collides and produces a bug that reproduces nowhere
  else.
- **Absent, corrupted or unreadable → fall back to `dark`, and write nothing back.** Dark is the
  documented default for every visitor (there is no `prefers-color-scheme` detection anywhere — light
  is opt-in). A defensive re-write would mask the bug that caused it and would create a stored
  preference for someone who never chose one.
- **Every read and every write is inside `try/catch`.** `localStorage` *throws* — it does not return
  null — in Safari private browsing, in partitioned or blocked storage contexts, and at quota. A throw
  must degrade to "works this session, not remembered", never to a crash. This matters most inside the
  inline script, where an uncaught throw aborts it before it sets the class, i.e. breaks the exact
  anti-flash it exists for.
- **The DOM class on `<html>` is the single source of truth.** No React state mirrors the theme.
  `.dark` and `.light` are mutually exclusive: always remove one before adding the other.

## Configuration / environment notes

- No secrets are required for the core site (no auth, no database).
- **No cookies are set by this site.** The one persisted preference above uses `localStorage`, so
  there is no cookie banner obligation and no per-request state.
- If a contact form is added: store the form-handling service's API key (e.g. Resend, Formspree) as an
  environment variable in Vercel's project settings — never commit it to the repo, and never expose it
  client-side (route form submissions through a server action or API route, not directly from the
  browser).
- If analytics is added (Vercel Analytics or similar), no manual API key handling is typically needed —
  confirm against that service's current docs at setup time.
- Standard baseline security hygiene, even without a security document: keep dependencies updated,
  don't expose any `.env` file in the repo (confirm `.gitignore` covers it, per the lesson already
  learned on ClashChat), and if a form endpoint exists, add basic rate-limiting or a honeypot field to
  deter spam — full auth/role-based security modeling isn't applicable since there are no user accounts.

## Build order (repeated from CLAUDE.md for reference)
1. Scaffold routing + empty tier structure
2. Hero 3D scene + loader/reveal (highest-risk, most novel — validate first)
3. Tier 2 sections (About, Projects gallery + transition)
4. Tier 3 sections (Project detail, Skills, Experience, Currently Learning)
5. Polish pass: easing, loading states, responsiveness, accessibility, theme toggle
6. Write final narrative copy last — the hero identity line, the About/Trajectory narrative, the
   Experience framing. The structured `/content` data layer is **not** part of this step: it lands
   early, at Ticket 2, because Tickets 5/6/7/9 are built against real data and their acceptance
   criteria are unverifiable against empty arrays.
