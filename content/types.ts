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
   * Saad's role was a leading one, it says so plainly ("Led a team of 4").
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
