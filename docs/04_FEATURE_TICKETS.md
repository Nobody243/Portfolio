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
