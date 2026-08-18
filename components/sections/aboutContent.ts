/**
 * About / Trajectory copy — Ticket 4.
 *
 * THIS IS CONTENT, NOT CONFIGURATION. Every string below is Saad's, approved
 * verbatim and reproduced character for character. Do not paraphrase it, do
 * not "improve" it, do not add a connective sentence, and do not reword a line
 * to fit a layout. If the layout needs different text, that is a question back
 * to Saad, not an edit here.
 *
 * WHY THIS LIVES BESIDE THE COMPONENT RATHER THAN IN /content:
 * `docs/02_TECHNICAL_ARCHITECTURE.md` build-order step 6 separates the two
 * deliberately — the structured /content layer is a COLLECTION layer, typed
 * against content/types.ts and meant to grow, while this is fixed-arity prose
 * for one section. Three beats is the positioning, not a coincidence. The
 * precedent is components/hero/heroContent.ts, which is exactly this shape.
 *
 * The "edit a file for a year, never rebuild a section" premise still holds:
 * rewriting a beat is a one-file string edit, and About.tsx renders
 * ABOUT_BEATS.map(...) rather than three hand-written blocks.
 *
 * HARD RULES, inherited verbatim from content/types.ts because the failure
 * mode is identical — styling leaking into a data file, where it is hardest to
 * notice, in a file that will be hand-edited for a year:
 *   - Pure data. No "use client", no JSX, no React import, no next/* import.
 *   - NO colour hexes, NO Tailwind class strings, NO font names. Styling is
 *     the consumer's job, always.
 *   - Absent things are ABSENT KEYS — never "", never a placeholder.
 *
 * TWO THINGS THIS COPY ENCODES THAT MUST NOT BE SILENTLY REVERSED:
 *   1. Beat 3 names NO certification, NO course, NO timeline and NO start
 *      date. content/currentlyLearning.ts ships an empty array by deliberate
 *      decision, and naming a cert here would have About contradicting
 *      Currently Learning two screens later. IF A FUTURE EDIT ADDS ONE HERE,
 *      currentlyLearning.ts MUST CHANGE IN THE SAME COMMIT.
 *   2. "final-year IT undergraduate" carries no semester number. "7th
 *      semester" is wrong within months on a site built to be edited for a
 *      year; it is the CV fact, not the site copy.
 *
 * No claim of expertise in security, cloud or DevOps appears anywhere, and the
 * phrase "full-stack developer" appears nowhere — the same rule enforced on
 * the meta description in Ticket 3. "building full-stack at New Web Order"
 * describes the internship work; it is not a job title.
 */

export type AboutBeat = {
  /**
   * Short label, including its `NN / ` prefix. The prefix is PART OF THE
   * CONTENT, not a counter the component generates — a generated counter would
   * drift from the copy the moment a beat is reordered or removed.
   *
   * Keep labels at or under ~17 characters: the rail they sit in is 144px wide
   * and longer strings clip or wrap.
   */
  readonly label: string;
  /**
   * One or more paragraphs, each rendering as its own <p>.
   *
   * Deliberately an array rather than one string with newlines, and never an
   * HTML string: the hero's HERO_TAGLINE_UNITS established the same principle,
   * and it also means dangerouslySetInnerHTML never becomes tempting for
   * emphasis. If a phrase needs emphasis, that is a design change, not a
   * content edit.
   *
   * Every beat currently has exactly one paragraph. The array shape is kept
   * anyway so a future split needs no type change.
   */
  readonly paragraphs: readonly string[];
};

/**
 * Not "About". "Trajectory" is the positioning vocabulary the site already
 * uses, and it states the section's argument in one word.
 */
export const ABOUT_HEADING = "Trajectory";

/**
 * EXACTLY THREE BEATS, in this order: foundation -> systems -> direction.
 *
 * That sequence is the argument the section makes, and it is the same
 * proof -> depth -> direction shape SKILL_GROUPS uses. Reordering them, or
 * adding a fourth, is a positioning change and needs Saad's call.
 */
export const ABOUT_BEATS = [
  {
    label: "01 / FOUNDATION",
    paragraphs: [
      "Most of what I know, I learned by shipping. A search engine that streams 150+ clothing brands through Kafka and Spark. A drone-routing engine where four classical AI algorithms cooperate to plan a delivery run. A text-based Flutter app that argues with you. Plus two months building full-stack at New Web Order — React, Next.js, Tailwind, Supabase. Different stacks, same habit: build it, deploy it, find out what breaks.",
    ],
  },
  {
    label: "02 / SYSTEMS",
    paragraphs: [
      "I'm a final-year IT undergraduate at Bahria University, and the coursework went lower down the stack — operating systems, networks, databases, algorithms, assembly. Two of those became builds rather than papers. A segmented network for a four-floor call center: VLANs per department, ACL-enforced isolation, RIP routing, centralized config backup. And a seven-phase Windows Server deployment covering Active Directory, DNS, DHCP, IIS, Remote Desktop Services and Cisco NAT. Academic work, done hands-on. Not production experience — but not theory either.",
    ],
  },
  {
    label: "03 / DIRECTION",
    paragraphs: [
      "That second thread is the one I'm following. Infrastructure and security is where I'm heading, and the honest position today is early: the coursework built a foundation, the self-directed work is what comes next. What's on this page will change as that happens.",
    ],
  },
] as const satisfies readonly AboutBeat[];
