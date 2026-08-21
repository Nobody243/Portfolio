/**
 * Skills, grouped — Ticket 2.
 *
 * EDIT THIS FILE to add or change a skill. Nothing about the Skills section's
 * layout lives here, and no styling may: see the hard rules in ./types.ts.
 *
 * GROUP ORDER IS A POSITIONING DECISION, NOT A FORMATTING ONE.
 * SKILL_GROUPS runs core-dev -> systems-foundation -> building-toward, which
 * reads proof -> depth -> direction. That sequence is the argument the section
 * makes. Ticket 5 must render the groups in this order and must not re-sort,
 * re-label, merge, or hide one for layout reasons. Moving a skill between
 * groups is a positioning change and needs Saad's call.
 *
 * "CURRENTLY BUILDING TOWARD" IS DELIBERATELY EMPTY. Zero entries is the
 * honest current state, not a bug, not an oversight, and not something to pad
 * with aspirational entries. The group still exists in SKILL_GROUPS and Ticket
 * 5 must still render it — an honest empty treatment is a design problem to
 * solve, not a data problem to work around. It fills in as real certs and
 * projects land, and that visible trajectory is the whole point.
 *
 * NOTE LENGTH IS CAPPED AT 64 CHARACTERS. Above that a note wraps to a second
 * line at >=640px and that entry alone grows taller than its siblings, breaking
 * the uniform 44.8px entry height the Stack section's shared rhythm depends on.
 * The longest note today is 56 characters ("low-level memory addressing,
 * registers, instruction sets"), so there are eight characters of headroom.
 * Trim the concepts rather than letting the entry wrap.
 *
 * SYSTEMS FOUNDATION entries are COURSE names, and `note` carries the concepts
 * the course actually covered. Ticket 5 must never render the name without the
 * note — a bare course name is an unexplained claim.
 */

import type { Skill, SkillGroup } from "./types";

/** Ordered group metadata. Order and labels live here, in content, not in the
 *  Ticket 5 component — see the header. */
export const SKILL_GROUPS = [
  { id: "core-dev", label: "Core Dev" },
  { id: "systems-foundation", label: "Systems Foundation" },
  { id: "building-toward", label: "Currently Building Toward" },
] as const;

export const skills = [
  // --- Core Dev ---------------------------------------------------------
  // Order is meaningful: leftmost/first reads as strongest. No notes here on
  // purpose — a note on every skill is noise.
  { name: "React", group: "core-dev", logo: "react" },
  { name: "Next.js", group: "core-dev", logo: "nextdotjs" },
  { name: "Flutter", group: "core-dev", logo: "flutter" },
  { name: "ASP.NET", group: "core-dev", logo: "dotnet" },
  { name: "JavaScript", group: "core-dev", logo: "javascript" },
  { name: "TypeScript", group: "core-dev", logo: "typescript" },
  { name: "Tailwind CSS", group: "core-dev", logo: "tailwindcss" },
  { name: "Supabase", group: "core-dev", logo: "supabase" },
  { name: "Firebase", group: "core-dev", logo: "firebase" },
  { name: "Node.js", group: "core-dev", logo: "nodedotjs" },

  // --- Systems Foundation -----------------------------------------------
  // `name` is the course; `note` is what it covered. Never render one without
  // the other.
  {
    name: "Computer Networks",
    group: "systems-foundation",
    note: "subnetting, routing, VLANs, ACLs",
  },
  {
    name: "Operating Systems",
    group: "systems-foundation",
    note: "process scheduling, memory management, file systems",
  },
  {
    name: "Database Management Systems",
    group: "systems-foundation",
    note: "relational design, SQL, normalization",
  },
  {
    name: "Object-Oriented Programming",
    group: "systems-foundation",
    note: "design patterns, inheritance, polymorphism (C++)",
  },
  {
    name: "Data Structures & Algorithms",
    group: "systems-foundation",
    note: "complexity analysis, trees, graphs, sorting (C++)",
  },
  {
    name: "Assembly Language",
    group: "systems-foundation",
    note: "low-level memory addressing, registers, instruction sets",
  },
  {
    name: "Big Data Analytics",
    group: "systems-foundation",
    note: "Kafka, Spark, distributed data pipelines",
  },
  {
    name: "Design & Analysis of Algorithms",
    group: "systems-foundation",
    note: "dynamic programming, greedy algorithms, NP-completeness",
  },

  // --- Currently Building Toward ----------------------------------------
  // Intentionally zero entries. See the header before adding anything here.
] as const satisfies readonly Skill[];

/**
 * Skills in a group, in declaration order.
 *
 * Returns a plain (non-readonly-tuple) array, so callers may sort or reverse
 * the result freely — it is a fresh array, not the source data.
 */
export function getSkillsByGroup(group: SkillGroup): Skill[] {
  return skills.filter((skill) => skill.group === group);
}
