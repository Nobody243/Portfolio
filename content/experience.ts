/**
 * Employment — Ticket 8.
 *
 * EDIT THIS FILE to add or change a role. Nothing about the Experience
 * section's layout lives here, and no styling may: see the hard rules in
 * ./types.ts.
 *
 * ARRAY ORDER IS DISPLAY ORDER, AND IT IS REVERSE-CHRONOLOGICAL. ADD A NEW ROLE
 * AT THE TOP. There is deliberately no `.sort()` in the component — a sort is a
 * second mechanism producing an order this file already shows, and reading the
 * array top to bottom would stop telling you what the page renders. The
 * instinct when adding job two is to append at the bottom; that renders it
 * last, which is wrong. Add at the top.
 *
 * ONE ENTRY IS NOT A SPECIAL CASE. The section maps this array, so n = 0, n = 1
 * and n = 5 are one code path. Adding a role is an edit to this file and
 * nothing else.
 *
 * EVERY STRING BELOW IS SAAD'S, supplied 2026-08-19 and reproduced verbatim
 * (.claude/handoff/ticket-8-content.md). This is the section a recruiter reads
 * most literally, so the standard is stricter here than anywhere else on the
 * site:
 *   - THE ROLE IS THE ACTUAL JOB TITLE, confirmed by Saad. It was deliberately
 *     withheld from the plan until he stated it, precisely because it is
 *     guessable from CLAUDE.md's "2-month fullstack internship" — which
 *     describes the WORK, not the title. Never infer a title.
 *   - NO VERBS OF SCALE. No "led", "architected", "owned", "drove". No user
 *     counts, no volume, no "secure", no "scalable". None of that was supplied.
 *   - THE PROSE DOES NOT REPEAT THE STRUCTURED FIELDS. Duration, stack, company
 *     and location each render from their own field, so `description` says none
 *     of them again.
 *   - ABSENT KEYS, never "" and never a plausible placeholder. Omitting
 *     `endDate` means the role is ongoing (see ./types.ts).
 *
 * CROSS-SECTION CONSISTENCY: components/sections/aboutContent.ts beat 1 says
 * "two months building full-stack at New Web Order — React, Next.js, Tailwind,
 * Supabase". The dates and stack below must not contradict it. If either ever
 * changes, that is a question to Saad and both files change in the same commit.
 */

import newWebOrderPreview from "@/public/images/experience/new-web-order.png";

import type { Experience } from "./types";

export const experience = [
  {
    company: "New Web Order",
    role: "Fullstack Developer Intern",
    startDate: "2025-06",
    endDate: "2025-08",
    location: "Rawalpindi, DHA Phase 7",
    // Saad's four, in his order.
    //
    // "Tailwind CSS", not "Tailwind" — CANONICAL VENDOR CASING, the rule
    // content/types.ts states for every stack array ("Next.js", "Apache
    // Kafka"). skills.ts already ships "Tailwind CSS", and the two are rendered
    // by sibling components as the same kind of thing: a list of technology
    // names. Two spellings of one technology in one data layer reads as an
    // oversight, and a reader scanning both sections sees it.
    //
    // aboutContent.ts beat 1 says "Tailwind" and STAYS THAT WAY. That is prose
    // in a sentence, where the short form is what a person writes; this is a
    // structured field. The registers are different and the divergence is
    // deliberate — do not "reconcile" them by changing the prose.
    stack: ["React", "Next.js", "Tailwind CSS", "Supabase"],
    // Verified 2026-08-19: HTTP 200, no redirect.
    url: "https://www.newweborder.us/",
    urlPreview: newWebOrderPreview,
    // "Two smaller products" is Saad's own framing and it opens the paragraph
    // on purpose: it sets the scale honestly before a reader forms a bigger
    // impression. Do not soften it, and do not pad what follows.
    description:
      "Two smaller products. CS Academy, for a computer-course provider. And P2P Quick USDT, a peer-to-peer exchange where users message each other directly and trade digital currency person to person. Three days a week onsite, two remote.",
  },
] as const satisfies readonly Experience[];
