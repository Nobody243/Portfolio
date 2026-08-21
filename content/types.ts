/**
 * Shared content types for the /content data layer — Ticket 2.
 *
 * WHY THIS FILE EXISTS (deviation flag): `docs/02_TECHNICAL_ARCHITECTURE.md`'s
 * folder listing names only projects.ts / skills.ts / currentlyLearning.ts. This
 * fourth file is deliberate: `Project.category` is typed as `SkillGroup`, so
 * colocating types would force projects.ts to import skills.ts — a data file
 * depending on another data file for a type. Flagged in the same style as the
 * `lib/hooks/` deviation recorded in .claude/handoff/review-fixes-2026-08-17.md.
 * Correct this if the reading is wrong.
 *
 * HARD RULES for everything under /content:
 *   - Pure data. No "use client", no JSX, no React import, no runtime next/*
 *     import, no function beyond a trivial lookup.
 *   - NO colour hexes, NO Tailwind class strings, NO font names. A per-entry
 *     `accentColor` or `className` would break the locked two-accent system at
 *     the data layer, where it is hardest to notice. Styling is the consumer's
 *     job, always.
 *   - Absent things are ABSENT KEYS — never "", never "#", never a plausible
 *     placeholder URL. Omitting a field is a valid, expected answer.
 *
 * The one permitted next/* reference is the TYPE-ONLY import below. `import
 * type` is erased at compile time, so it creates no runtime coupling and does
 * not make these files client/server-sensitive.
 */

import type { StaticImageData } from "next/image";

/**
 * The three skill groups. Order is NOT defined here — it lives in
 * SKILL_GROUPS in skills.ts, because the sequence (proof -> depth -> direction)
 * is a positioning decision, not a formatting one.
 */
export type SkillGroup = "core-dev" | "systems-foundation" | "building-toward";

export type LearningStatus = "in-progress" | "planned" | "completed";

/**
 * A project image. `src` is a STATIC IMPORT, not a string path:
 *   import cover from "@/public/images/projects/folio/cover.png";
 *
 * That choice is load-bearing. A misnamed or missing file becomes a BUILD
 * ERROR rather than a broken <img> in production, and StaticImageData carries
 * real width/height so <Image> can reserve space and avoid layout shift
 * without anyone hand-copying dimensions.
 *
 * `alt` is CONTENT, not decoration — it describes what the screenshot actually
 * shows, and must be accurate. It is never auto-generated or left empty.
 */
export interface ProjectImage {
  readonly src: StaticImageData;
  readonly alt: string;
}

/**
 * A detail-page image. Same as ProjectImage plus an optional visible caption.
 *
 * `caption` is distinct from `alt`: alt is the accessible description of what
 * is on screen, caption is visible editorial copy explaining why the shot
 * matters. A caption never substitutes for alt — an image with a caption still
 * needs its own accurate alt text.
 */
export interface Screenshot extends ProjectImage {
  readonly caption?: string;
}

export interface ProjectLinks {
  /** Public repo URL. Omit entirely if none, or if the repo is private —
   *  a private repo is a dead link to a recruiter and counts as none. */
  readonly github?: string;
  /** Live deployment URL, verified currently loading. Omit if none or dead. */
  readonly live?: string;
}

export interface Project {
  /** URL-safe, permanent — this becomes /projects/<slug>. */
  readonly slug: string;
  /** Exact display casing. Content, not styling — never normalised. */
  readonly title: string;
  /** One sentence for the gallery card. */
  readonly oneLiner: string;
  /** Fuller write-up for the detail page: problem -> approach -> what was built. */
  readonly description: string;
  /** Canonical vendor casing ("Next.js", "Apache Kafka"). Order is meaningful. */
  readonly stack: readonly string[];
  readonly links: ProjectLinks;
  /** ISO YYYY-MM, completion month. Sortable; components format for display. */
  readonly date: string;
  /** Renamed from the architecture doc's `tier` — see plan §4. `tier` is
   *  reserved project-wide for the Tier 1/2/3 motion system and means nothing
   *  else, anywhere. */
  readonly category: SkillGroup;
  /**
   * Honest credit line. Omit when the work was solely Saad's.
   *
   * Two jobs: shared work is never silently presented as solo work, and where
   * Saad's role was a leading one, it says so plainly ("Team of 4, led by me").
   *
   * TEAM SIZE IS THE TOTAL HEADCOUNT, SAAD INCLUDED. Write "Team of 4", never
   * "Led a team of 4" — the latter reads as four *reports*, i.e. five people,
   * and every count in this file is a total. Saad corrected these on
   * 2026-08-18; do not reintroduce the ambiguous phrasing.
   *
   * PREFER A NUMBER OVER A NAME. Saad's standing instruction is to state how
   * many people were on a project, not who they were. FOLIO is the sole
   * exception and only because that collaborator explicitly consented to being
   * named publicly.
   *
   * A COUNT IS A CLAIM ABOUT CONTRIBUTION, NOT ABOUT ROSTER SIZE. Do not add a
   * team count to a project where the other members did no work — that credits
   * contribution that did not happen, which is the same fabrication rule from
   * CLAUDE.md pointed the other way. Aero-Grid is the case in point: nominally
   * a group of 4, credited as "Led design and development" with no count.
   *
   * It is NOT a job title — it describes what happened on one project, not a
   * position held. Every value must be one Saad has explicitly confirmed, and
   * it never names a collaborator who has not consented to being named.
   */
  readonly credit?: string;
  /**
   * Gallery card image. Named `coverImage`, not `cover`, per
   * docs/02_TECHNICAL_ARCHITECTURE.md (commit 354011f) — `cover` alone reads
   * ambiguously now that a sibling array of images exists, and the two field
   * names should look related.
   *
   * Kept separate from `screenshots` on purpose: the card's pick must never
   * depend on screenshot ordering.
   */
  readonly coverImage: ProjectImage;
  /**
   * Additional detail-page images, in display order (most representative
   * first). Omit the key entirely when a project has no images beyond the
   * cover.
   *
   * Length VARIES per project — 0, 1, or n. Ticket 7 must not hardcode a
   * two-up before/after layout.
   */
  readonly screenshots?: readonly Screenshot[];
}

export interface Skill {
  /** For systems-foundation this is the COURSE name ("Computer Networks"). */
  readonly name: string;
  readonly group: SkillGroup;
  /**
   * Short concept note. Required in practice for systems-foundation, where the
   * agreed format is course name + the specific concepts it covers
   * ("subnetting, routing fundamentals"), so a course name never stands alone
   * as an unexplained claim. Optional elsewhere, and omitted rather than
   * padded — a note on every skill is noise.
   */
  readonly note?: string;
  /**
   * REGISTRY ID ONLY — "react", "next-js". Never markup, never a URL, never a
   * component, never a file path. Added by Phase 3 for the Stack section's
   * Core Dev glyph column.
   *
   * The hard rules at the top of this file are what force that shape: an SVG
   * path is styling, and styling is the consumer's job. The id is resolved by
   * `components/sections/skillLogos.tsx`, which owns the geometry, the 16px
   * box, the `currentColor` fill and the fallback. An unknown id is not an
   * error — it falls through to the fallback glyph — so a typo degrades to the
   * same rendering as an absent key rather than throwing.
   *
   * ABSENT IS A VALID, EXPECTED ANSWER, and today it is the answer for all ten
   * Core Dev entries: no logo assets exist yet. Adding one later is a file drop
   * plus this one field, never a component change.
   */
  readonly logo?: string;
}

export interface LearningEntry {
  readonly title: string;
  readonly status: LearningStatus;
  readonly description: string;
  /** ISO YYYY-MM. */
  readonly startedDate: string;
  /**
   * ISO YYYY-MM. Set when status is "completed".
   *
   * Lifecycle note: a completed item GRADUATES out of this section into
   * skills.ts under "building-toward" rather than lingering here — "Currently
   * Learning" stays literally true, and the achievement stays visible. This
   * field records the transition.
   */
  readonly completedDate?: string;
  readonly link?: string;
}

/**
 * One employment entry — ADDED BY TICKET 8. Everything above this comment is
 * Ticket 2's; nothing there was edited, renamed or reordered.
 *
 * REQUIRED: `company`, `role`, `startDate`. Three, deliberately. An entry that
 * cannot state who, what and when is not resume-clean, and making `role`
 * optional would licence an entry that renders an employer and a stack with no
 * statement of what he did.
 *
 * A ROLE IS A JOB TITLE, NOT A DESCRIPTION OF THE WORK. It is only ever a
 * string Saad has confirmed was the actual title. CLAUDE.md's "2-month
 * fullstack internship" describes the work; inferring a title from it — even a
 * plausible one — is fabrication in the one section a recruiter may verify.
 *
 * There is deliberately NO `employmentType` ("Internship" / "Full-time") field:
 * the role title already carries it, and a second source of truth for "was this
 * an internship" is the drift `Project` refused when it dropped `featured` and
 * `order`. No `id` or `slug` either — experience entries have no URL, and
 * consumers key on company + startDate.
 *
 * No `bullets` array. This site has no bullet register anywhere; prose goes in
 * `description` and splits on blank lines exactly as `Project.description` does.
 */
export interface Experience {
  /** Exact display casing. Content, not styling — never normalised. */
  readonly company: string;
  /** The job title, verbatim as it was. See the note above. */
  readonly role: string;
  /** ISO YYYY-MM. Components format it; never `new Date()`, never `Intl`. */
  readonly startDate: string;
  /**
   * ISO YYYY-MM.
   *
   * AN ABSENT KEY MEANS THE ROLE IS ONGOING. That is the one implicit encoding
   * in this type, and it is deliberate: the alternative — `endDate: "present"`
   * — puts a DISPLAY WORD inside a date field, i.e. copy in the data layer,
   * which the hard rules at the top of this file forbid outright. The renderer
   * supplies the label. Unexercised today; the internship ended.
   */
  readonly endDate?: string;
  /** City / area, as Saad states it. Never inferred, never "Remote" by guess. */
  readonly location?: string;
  /** Canonical vendor casing. Order is meaningful and is not sorted. Omit
   *  entirely for a role with no meaningful stack — never pad one. */
  readonly stack?: readonly string[];
  /** What was built, in Saad's words. Blank lines split paragraphs. Omitting
   *  it is a complete answer: nothing substitutes for it. */
  readonly description?: string;
  /** The employer's site, verified loading. Omit if none, dead, or if Saad
   *  would rather not link it — a guessed URL is a fabricated one. */
  readonly url?: string;
}

/**
 * One contact link — ADDED BY TICKET 10. Everything above this comment is
 * Ticket 2's and Ticket 8's; nothing there was edited, renamed or reordered.
 *
 * WHY CONTACT LINKS ARE /content AND NOT SECTION-LOCAL COPY. The test is not
 * "is this portfolio evidence" — it is "does this change without a code change,
 * and is it needed outside the section". Both are yes: LinkedIn arrives by data
 * edit, and `app/layout.tsx` metadata, Ticket 14's form and Ticket 15's CV all
 * want the address and the GitHub URL. A server layout importing a URL out of
 * `components/sections/` is backwards. The heading and the closing line are
 * copy, not data, and stay in `components/sections/contactContent.ts`.
 *
 * ALL FOUR FIELDS ARE REQUIRED AND NOTHING IS DERIVED. Stripping "https://" off
 * `href` to produce a display string would be a formatting function in the data
 * layer, which the hard rules at the top of this file forbid, and it is fragile
 * (trailing slash, "www."). Three strings carry three distinct facts.
 *
 * The absent-keys rule at the top of this file governs this type hardest: a
 * link Saad has not supplied is an ABSENT ENTRY, never an entry with `href:
 * "#"`, `href: ""` or a guessed profile URL. CLAUDE.md forbids placeholder
 * social links by name.
 */
export interface ContactLink {
  /** The register word: "Email", "GitHub". Never the URL, never a sentence. */
  readonly label: string;
  /**
   * The VISIBLE string — the address itself, or host + handle. Never derived
   * from `href`, and never a call to action ("Email me"): the point of showing
   * the literal address is that a dead `mailto:` still leaves something
   * selectable on screen.
   */
  readonly value: string;
  /** Absolute. "mailto:" for an email, "https://" for everything else. */
  readonly href: string;
  /**
   * Discriminant, EXPLICIT rather than sniffed from `href`. "web" renders
   * through `<ExternalLink>` with target/rel and the new-tab note; "email"
   * renders a plain <a>, because a mailto: does not open a tab and announcing
   * one would be a lie. A `boolean external` or a `href.startsWith("http")`
   * check would make a new kind a silent fallthrough; this makes it a compile
   * error.
   */
  readonly kind: "email" | "web";
}
