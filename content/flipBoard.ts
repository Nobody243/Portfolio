import type { FlipBoardEntry } from "@/components/ui/text-flipping-board";

/**
 * The quotations `/about`'s split-flap board rotates through.
 *
 * =========================================================================
 * THE RULE, AND IT IS THE ONLY THING PROTECTING THIS FILE FROM CLAUDE.md's
 * "NO FABRICATED CONTENT, EVER":
 *
 *   EVERY ENTRY MUST BE A REAL QUOTATION, REPRODUCED VERBATIM FROM A PRIMARY
 *   OR NEAR-PRIMARY SOURCE THAT IS NAMED IN ITS `source` FIELD AND WAS READ
 *   BEFORE IT WAS ADDED. Not a quotation site. Not a listicle. Not memory.
 *   If the wording cannot be checked against the cited document, the entry
 *   does not ship.
 *
 * =========================================================================
 *
 * WHY THE BAR IS THAT HIGH. An attributed quotation is the sharpest possible
 * form of the thing CLAUDE.md forbids: it is a specific, checkable claim about
 * what a named real person said, printed under Saad's name. Misattribution is
 * the normal state of security quotations online — every one of the six below
 * appears on aggregator sites in at least one mangled or reassigned form, and
 * two of them were nearly shipped in a wrong version from exactly there. The
 * `source` field is not decoration; it is the audit trail.
 *
 * ONE ENTRY WAS REFUSED FOR FAILING THIS TEST, RECORDED SO IT IS NOT
 * RE-PROPOSED AS AN OVERSIGHT: Bruce Schneier's "security is a process, not a
 * product". It is real and it is his, but it circulates in at least two
 * incompatible wordings ("Security is a process, not a product" and "Security
 * is not a product, but a process"), the Crypto-Gram essay that coined it is
 * titled with a third, and schneier.com would not serve the archive page for a
 * verbatim check. An unverifiable wording of a real quote is still an
 * unverifiable wording. It is the one candidate that got this far and did not
 * ship, and it can be added the moment someone reads the December 1999
 * Crypto-Gram or the "Secrets and Lies" preface directly.
 *
 * WHAT THIS FILE USED TO SAY, so nobody reads the old paragraph and "restores"
 * it. Until 2026-08-23 it held eight terse technical strings (`VLANS`, `ACLS`,
 * `SUBNETTING`, `RIP ROUTING`, `GROUP POLICY`, `UBUNTU/BASH`,
 * `DOCKER COMPOSE`, `APACHE KAFKA`) under a rule that every string appear
 * VERBATIM in `content/skills.ts` or `content/projects.ts`. That rule existed
 * because the board was 1 x 15 tiles and, in its own words, "a quotation that
 * fits in 15 characters is not a quotation". The board is now a band spanning
 * the content column — 46 columns and up to nine rows — so the geometric
 * objection is gone, and Saad chose verified quotations over the terms on
 * 2026-08-23. The terms were never placeholder text and were not replaced for
 * being wrong; they are preserved in git history if they are ever wanted back.
 *
 * NO ASPIRATIONAL FILLER, AND THAT REFUSAL SURVIVES THE FORMAT CHANGE.
 * `ZERO TRUST`, `CI/CD PIPELINE`, `THREAT MODEL` and their neighbours are
 * refused permanently, and so is any unattributed aphorism in the same register
 * ("trust nothing, verify everything"). They are the right DOMAIN and they are
 * exactly the padding CLAUDE.md's positioning section forbids: an unsourced
 * maxim overclaims just as effectively as a sentence and never makes a
 * checkable statement. The rule above already excludes them — every entry needs
 * a named speaker and a named document — and this paragraph exists so nobody
 * adds one by exception.
 *
 * THESE ARE QUOTATIONS, NOT CLAIMS ABOUT SAAD. That is the whole reason they
 * are allowed to name technologies his own content does not: the board is
 * saying what Postel wrote about TCP, not that Saad implements TCP stacks. The
 * old verbatim-from-`skills.ts` rule was answering a different hazard — terse
 * decontextualised terms beside a bio DO read as claims — and it does not
 * transfer.
 *
 * THE ORDER IS FIXED AND MUST NOT BE RANDOMISED ON MOUNT. Two visitors should
 * be able to compare the same page. An obviously-shuffling list is also what
 * makes this kind of component read as a widget.
 *
 * THE DOMAIN SPREAD IS DELIBERATE — two security, two networking, two
 * distributed/cloud. It is the same three-way split as CLAUDE.md's stated
 * direction (Cybersecurity, Cloud Infrastructure, Networking/DevOps), which is
 * what makes the board read as pointed rather than as decoration.
 *
 * LENGTH IS A HARD CONSTRAINT, NOT A PREFERENCE. The board reserves height for
 * the LONGEST entry, and `/about` does not scroll at `xl`+. Measured at the
 * binding viewport (1280x720): 246px of band under the row, of which 34px is
 * the top margin, leaving 212px. Six rows is 209px. So at 46 columns no entry
 * may exceed SIX rows including its attribution — currently 3/4/5/5/6/6.
 * Adding a seventh row overflows a page that is not allowed to scroll. Re-run
 * the wrap before adding anything long.
 */

/**
 * The board's rotation period, in MILLISECONDS.
 *
 * 12000ms, up from the 7000ms the one-word board used. The entries are now
 * 60-190 characters, i.e. 5-12 seconds of reading, and a dwell shorter than the
 * quotation takes to read is a ticker rather than a board. Six entries at 12s
 * is 72 seconds before a repeat — longer than a realistic visit, so a visitor
 * never sees the loop close.
 *
 * DO NOT GO BELOW 8000 NOW. The flip itself finishes at
 * `DURATION.ui + 45 * TILE_STAGGER_S = 1.25s` across 46 columns, so anything
 * faster spends a visible fraction of the cycle in motion on the quiet page.
 *
 * Milliseconds rather than seconds because its one consumer is `setInterval`.
 * `lib/animation/easing.ts`'s `DURATION` is in seconds for GSAP and Framer and
 * this is deliberately not one of its entries: it is a dwell between two
 * resting states, not the duration of a transition.
 */
export const FLIP_BOARD_DWELL_MS = 12000;

/**
 * The row count the band reserves at `xl`+ regardless of content, so the
 * composition beneath the row is the same rectangle on every load. Six is the
 * measured longest entry at 46 columns; see the length constraint above.
 */
export const FLIP_BOARD_MIN_ROWS = 6;

/** An entry plus the citation that was actually read to verify it. `source` is
 *  never rendered — it exists so the next person can re-check the wording. */
export interface VerifiedFlipBoardEntry extends FlipBoardEntry {
  source: string;
}

export const FLIP_BOARD_ENTRIES: readonly VerifiedFlipBoardEntry[] = [
  {
    // Verbatim from Spafford's own quotations page at Purdue CERIAS, which also
    // records that the book "@Large" misquotes it with titanium and nerve gas.
    // The dash is a HYPHEN in the source, not an em dash; it is left alone.
    text: "The only truly secure system is one that is powered off, cast in a block of concrete and sealed in a lead-lined room with armed guards - and even then I have my doubts.",
    attribution: "Gene Spafford · Scientific American · 1989",
    source:
      "https://spaf.cerias.purdue.edu/quotes.html — orig. A. K. Dewdney, 'Computer Recreations: Of Worms, Viruses and Core War', Scientific American, March 1989, p. 110",
  },
  {
    // Verbatim from the PBS Frontline transcript of the testimony. The sentence
    // continues past "chain" with ": the people who use, administer, operate
    // and account for computer systems that contain protected information." It
    // is cut with an ellipsis because the full sentence wraps to eight rows and
    // the band has six. The ellipsis is the honest form of that cut; deleting
    // it and closing with a full stop would assert an ending the source does
    // not have.
    text: "Companies spend millions of dollars on firewalls, encryption, and secure access devices and it's money wasted because none of these measures address the weakest link in the security chain …",
    attribution: "Kevin Mitnick · US Senate testimony · 2000",
    source:
      "https://www.pbs.org/wgbh/pages/frontline/shows/hackers/whoare/testimony.html — Senate Committee on Governmental Affairs, 2 March 2000",
  },
  {
    text: "The Net interprets censorship as damage and routes around it.",
    attribution: "John Gilmore · Time · 1993",
    source:
      "Philip Elmer-DeWitt, 'First Nation in Cyberspace', Time, 6 December 1993 — provenance traced at https://quoteinvestigator.com/2021/07/12/censor/",
  },
  {
    // Verbatim from the email Lamport archives on his own publications site.
    text: "A distributed system is one in which the failure of a computer you didn't even know existed can render your own computer unusable.",
    attribution: "Leslie Lamport · 1987",
    source:
      "https://lamport.azurewebsites.net/pubs/distributed-system.txt — email to the DEC SRC bulletin board, 28 May 1987",
  },
  {
    // Verbatim from RFC 793 section 2.10, the robustness principle itself.
    text: "TCP implementations will follow a general principle of robustness: be conservative in what you do, be liberal in what you accept from others.",
    attribution: "Jon Postel · RFC 793 · 1981",
    source: "https://www.rfc-editor.org/rfc/rfc793.txt — §2.10, September 1981",
  },
  {
    // Verbatim from Vogels' own blog, section "2. Expect the unexpected".
    text: "Failures are a given and everything will eventually fail over time: from routers to hard disks, from operating systems to memory units corrupting TCP packets, from transient errors to permanent failures.",
    attribution: "Werner Vogels · AWS · 2016",
    source:
      "https://www.allthingsdistributed.com/2016/03/10-lessons-from-10-years-of-aws.html — 11 March 2016",
  },
] as const;
