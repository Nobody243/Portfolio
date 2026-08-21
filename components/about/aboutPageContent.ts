/**
 * `/about` copy — Phase 4.
 *
 * THE PARAGRAPH IS FINAL, NOT DRAFT. `docs/07_SITE_RESTRUCTURE.md` §6 records
 * it as "FINAL, approved 2026-08-21", and the commit that closed that gate is
 * `9439435` ("Docs: the About paragraph is final, and Phase 4's merge gate
 * closes"). `.claude/handoff/restructure-plan.md`'s Phase 4 step 2 instructs
 * this header to mark it DRAFT; **that instruction is stale** — it was written
 * while the wording was provisional, and following it now would ship a false
 * statement in a module header. Recorded here rather than silently ignored so
 * the next reader does not "fix" it back.
 *
 * 65 words, and the length is a decision: "small yet complete", per the
 * Vlad / Aspect Health bio reference §6 cites.
 *
 * TWO THINGS THE COPY ENCODES THAT MUST NOT BE SILENTLY REVERSED, both settled
 * in §6 with their reasoning:
 *
 *   1. C1 — THE COURSEWORK FRAMING IS DELIBERATELY ABSENT, not missing. The
 *      VLAN / ACL / Windows Server detail lives in the Stack section's Systems
 *      Foundation entries, where `content/skills.ts` requires each course name
 *      to carry its concept note. Repeating it here would spend a quarter of a
 *      65-word bio duplicating proof the site already gives twice. The bio
 *      carries the PIVOT; the Stack carries the PROOF. Do not "fix" this by
 *      adding a coursework qualifier — the earlier draft named the coursework
 *      without saying it was academic, which risked reading as professional
 *      experience. The closing line carries the honesty that qualifier was for.
 *
 *   2. C2 — "rotating exposed credentials and rebuilding the API layer behind a
 *      secured proxy" NAMES SOMETHING REAL AND VERIFIABLE IN THIS REPO. It is
 *      the ClashChat security pass: `content/projects.ts` documents the
 *      Cloudflare Worker proxy that keeps the Groq API key server-side, and
 *      `docs/05_GIT_SECURITY_CHECKLIST.md` records the key incident and its
 *      remediation. CLAUDE.md's no-unverifiable-claims rule is satisfied by
 *      those two files, not by this one. If either ever stops being true, this
 *      sentence changes.
 *
 * HARD RULES, inherited verbatim from `content/types.ts` and
 * `components/sections/aboutContent.ts` because the failure mode is identical —
 * styling leaking into a copy module, where it is hardest to notice:
 *   - Pure data. No "use client", no JSX, no React import, no next/* import.
 *   - NO colour hexes, NO Tailwind class strings, NO font names. Styling is the
 *     consumer's job, always.
 *   - Absent things are ABSENT KEYS — never "", never a placeholder.
 *
 * NOT `content/`, AND NOT `components/sections/aboutContent.ts` EITHER. The
 * first is the collection layer (typed against `content/types.ts`, meant to
 * grow); this is fixed-arity prose for one page, the same shape as
 * `components/hero/heroContent.ts`. The second name is TAKEN — it holds the
 * Trajectory section's three beats, which are a different piece of writing on a
 * different page. Two files called "about content" one directory apart is a
 * trap, so this one is `aboutPageContent` and every export is `ABOUT_PAGE_*`.
 */

/**
 * Saad's, verbatim, from `docs/07_SITE_RESTRUCTURE.md` §6. Em dashes are the
 * real character (U+2014), not two hyphens; the apostrophes are typographic.
 * Reproduce character for character if this is ever moved.
 */
export const ABOUT_PAGE_PARAGRAPH =
  "I\u2019m Muhammad Saad, a final-year IT student who ships full-stack products " +
  "end-to-end \u2014 routing engines, real-time sync, reactive interfaces that solve " +
  "real problems. I\u2019m now moving deliberately into cloud infrastructure, " +
  "networking, and security \u2014 recently rotating exposed credentials and " +
  "rebuilding the API layer behind a secured proxy on one of my own production " +
  "apps. Not a security engineer yet \u2014 methodically building toward being one.";

/**
 * The accessible name for the page's static MS mark.
 *
 * IT HAS ONE, unlike the navbar's, and the difference is not an oversight: the
 * navbar's mark sits inside a link that already has a text label, so it is
 * decorative there. Here it is the only thing on the page identifying whose
 * page it is, with no adjacent text saying so.
 */
export const ABOUT_PAGE_MARK_LABEL = "Muhammad Saad";

/* --- The action row ------------------------------------------------------
   FIXED ARITY, NOT A COLLECTION, exactly as `components/ui/navContent.ts`
   draws the same distinction. There are three controls: one primary and two
   secondary, in this order. Adding a fourth is a layout decision, not an
   append. The two secondary DESTINATIONS are not here — they are read from
   `content/contact.ts` by label, so the About row and the Contact section can
   never disagree about where GitHub points. Only the labels live here. */

/** The primary control. Opens the CV — in a modal on desktop, a new tab on
 *  mobile. One label for both, because it describes the intent, not the
 *  mechanism. */
export const ABOUT_PAGE_CV_LABEL = "View CV";

/** The modal's own heading, and its accessible name. */
export const ABOUT_PAGE_CV_MODAL_TITLE = "Curriculum vitae";

/** The pinned control inside the modal. Deliberately a DIFFERENT verb from
 *  `ABOUT_PAGE_CV_LABEL`: one is a preview, the other writes a file to disk,
 *  and a visitor should be able to tell which is which from the word alone. */
export const ABOUT_PAGE_CV_DOWNLOAD_LABEL = "Download PDF";

/** The modal's close control. */
export const ABOUT_PAGE_CV_CLOSE_LABEL = "Close";

/**
 * The `<iframe>`'s accessible name.
 *
 * IT IS NOT THE MODAL'S TITLE REPEATED. An untitled iframe is an unlabelled
 * frame in a screen reader's frame list; a frame titled the same as its dialog
 * makes the two indistinguishable there. This one names what is INSIDE the
 * frame and how it is rendered, because "it is a PDF" is the fact a
 * non-visual user most needs before deciding to enter it.
 */
export const ABOUT_PAGE_CV_FRAME_TITLE = "Curriculum vitae, PDF preview";

/**
 * The CV asset, and the filename a download lands as.
 *
 * VERIFIED PRESENT AND COMMITTED: `public/resume/Muhammad_Saad_CV.pdf`. A path
 * to a missing PDF fails as a blank iframe with a green build, so if this
 * string is ever edited, check the file with it.
 *
 * `ABOUT_PAGE_CV_FILENAME` is what the `download` attribute suggests to the
 * browser. It is stated rather than left to default so the saved file is named
 * for its owner even if the served path ever changes.
 */
export const ABOUT_PAGE_CV_HREF = "/resume/Muhammad_Saad_CV.pdf";
export const ABOUT_PAGE_CV_FILENAME = "Muhammad_Saad_CV.pdf";

/** The two secondary controls, by the label they are stored under in
 *  `content/contact.ts`. BY LABEL AND NOT BY INDEX, for the reason
 *  `navContent.ts` gives: array order there is display order for the Contact
 *  section and is free to change. */
export const ABOUT_PAGE_GITHUB_LABEL = "GitHub";
export const ABOUT_PAGE_LINKEDIN_LABEL = "LinkedIn";
