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

---

## 2. The MS Mark

**Direction: circuit / trace.** M and S built from thin connected line segments with small node-dots
at the joints, echoing the particle-network background already built. Chosen over a geometric/faceted
or blocky LED mark specifically so the logo belongs to the site's existing visual system rather than
being a fourth unrelated style.

**Single source of truth.** Designed **once**. Every appearance — mid-morph in the Intro, the
contraction/expansion point, the static navbar version, the About page — is the same artifact at a
different scale or state, never separately hand-matched assets. **If the implementation cannot
literally reuse one component across all these states, that is a build smell to raise, not to route
around silently.**

**Colour.** Monochrome throughout the Intro's morph. No gradient or fill animation concurrent with
shape animation. Any colour on the resting state (navbar, About) is a separate static treatment
applied after the shape has settled.

---

## 3. Intro

**Trigger — fixed.** Plays on **actual document load or browser refresh only**. Not gated on
asset-load speed. Not skipped by a "seen this session" flag. Client-side route navigation back to Home
from About/Work does **not** replay it. Any existing logic tying Intro visibility to the Loader
resolving, or to a visited flag, is **removed, not tuned**.

**Sequence (replaces the old phase table):**

1. Full name "Muhammad Saad" appears.
2. Letters begin approaching and deforming toward the mark's final geometry **while still in motion** —
   by the time they meet they should already read as ~80% of the way into the mark's shape. The meeting
   is the final joining beat, not the trigger for a separate swap. **A "becoming", not a crossfade.**
3. The merge point is **dead centre** of the screen. This is a real layout constraint on steps 1–2: the
   name's layout and the letters' approach paths must be designed so the merge lands exactly at centre.
4. Once formed, the mark **contracts to a single point** at that same centre. It does not zoom up.
5. The hero **expands outward from that exact point.** This replaces the scale-17 zoom entirely — a
   single defined origin, not an open-ended scale-up.
6. **Simultaneously** with step 5, the navbar slides down (§1). One beat.

**Timing.** Total **~2.2–2.6s**, down from ~3.2s. Trim the early setup (hold on the name, letter
approach) harder; keep the contraction→expansion handoff near its previous weight (**~0.8s**) — that is
the moment that must read as deliberate rather than rushed. The per-phase split is a design judgment
within that budget, not a fixed table.

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

> **Implementation flag.** If Home's scroll-scrub sections use GSAP ScrollTrigger, the negative-margin
> curtain technique conflicts with ScrollTrigger's height calculations unless sequenced last and
> followed by `ScrollTrigger.refresh()`. **Build this last**, and re-test scroll height after adding it.

---

## 6. About Page

**First-person paragraph — DRAFT, Saad to rewrite in his own cadence before shipping. Not final copy.**
Revised to "small yet complete" per the Vlad / Aspect Health bio reference — ~75 words rather than a
full paragraph.

> I'm Muhammad Saad, a final-year IT student who ships full-stack products end-to-end — routing
> engines, real-time sync, reactive interfaces that solve real problems. I'm now moving deliberately
> into cloud infrastructure, networking, and security: architecting VLAN-segmented network topologies
> with ACLs and dynamic routing, and configuring enterprise Windows Server environments, alongside real
> hardening work on my own production projects. Not a security engineer yet — methodically building
> toward being one.

> **Two things to settle during that rewrite — flagged, not fixed, because this is Saad's copy.**
>
> 1. **The coursework framing is absent.** "Architecting VLAN-segmented network topologies" and
>    "configuring enterprise Windows Server environments" describe the CCN and SNA builds, which are
>    **university coursework**. Home's About beat says so explicitly — *"Academic work, done hands-on.
>    Not production experience — but not theory either."* Without that qualifier this paragraph reads
>    closer to professional experience than the rest of the site allows, and CLAUDE.md's positioning
>    rule is the one thing every ticket has been held to. The closing line does real work here and may
>    be enough; that is Saad's judgement, but it should be a decision rather than an oversight.
> 2. **"real hardening work on my own production projects"** needs to point at something specific and
>    true. ClashChat's Cloudflare Worker proxy — keeping the Groq key off the client — qualifies. If
>    that is what it means, naming it is stronger than the abstraction. If it means more than that, the
>    site's no-unverifiable-claims rule applies.

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

**Neither scroll-scrub nor the reveal-footer applies to About.** It is deliberately the one fully quiet
page.

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

### 9.1 There are no `/about` or `/work` routes. This is a restructure, not a feature.

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
