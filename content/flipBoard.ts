/**
 * The strings `/about`'s flip board rotates through.
 *
 * =========================================================================
 * THE RULE, AND IT IS MECHANICALLY CHECKABLE RATHER THAN A MATTER OF TASTE:
 *
 *   EVERY STRING ON THIS BOARD MUST APPEAR **VERBATIM** IN `content/skills.ts`
 *   OR `content/projects.ts`, MODULO CASE. It is uppercased for the board, and
 *   that is the ONLY transformation allowed. Nothing is elaborated, expanded,
 *   abbreviated or paraphrased. If an entry cannot be traced to one of those
 *   two files by a literal string search, it does not go on the board.
 *
 * =========================================================================
 *
 * WHY VERBATIM AND NOT MERELY "TRUE". The first candidate set was written by
 * elaborating real entries into board-friendly phrases — `VLAN TRUNKING` from
 * "VLANs", `NAT GATEWAY` from "Cisco NAT", `DNS RESOLVER` from "DNS",
 * `DHCP LEASES` from "DHCP". Every one of those is a plausible-sounding claim
 * about a specific sub-topic that nobody has verified Saad worked on, and
 * "plausible-sounding fact nobody verified" is precisely what CLAUDE.md bans by
 * name. Elaboration is where fabrication re-enters a set that was chosen to
 * make fabrication impossible. The verbatim rule removes the judgement call.
 *
 * WHY NOT QUOTATIONS. `TextFlippingBoard`'s geometry caps a string at 15
 * characters (see `BOARD_COLS`), and a quotation that fits in 15 characters is
 * not a quotation — so the component could not display quotes even if sourcing
 * them were free, and it is not: an attributed quote is the sharpest available
 * form of the thing CLAUDE.md forbids, and an unattributed aphorism is the
 * "vague marketing copy" trope it forbids in the next sentence. Saad chose
 * terse unattributed technical strings on 2026-08-23. If he ever wants real
 * quotations he has to supply them with attributions he can stand behind, and
 * the board would then need a different form entirely.
 *
 * NO ASPIRATIONAL TERMS — `ZERO TRUST`, `CI/CD PIPELINE`, `THREAT MODEL` and
 * their neighbours are refused permanently. They are the right DOMAIN and they
 * are exactly the padding CLAUDE.md's positioning section forbids: a word cloud
 * can overclaim just as effectively as a sentence, and it does it without ever
 * making a checkable statement. The verbatim rule above already excludes them,
 * and this paragraph exists so nobody adds one by exception.
 *
 * THE ORDER IS FIXED AND MUST NOT BE RANDOMISED ON MOUNT. Two visitors should
 * be able to compare the same page. An obviously-shuffling list is also what
 * makes this kind of component read as a widget.
 *
 * EIGHT ENTRIES AT A 7s DWELL IS 56 SECONDS BEFORE A REPEAT — longer than a
 * realistic visit, so a visitor never sees the loop close. That is worth more
 * than a larger set.
 *
 * THE BOARD GROWS ON ITS OWN AS THE SITE DOES. When `content/skills.ts`'s
 * "Currently Building Toward" group fills — the living part of the site — its
 * entries become eligible here by the same rule, with no new decision to make.
 *
 * -------------------------------------------------------------------------
 * TRACEABILITY, one line per entry. Re-check these if either source file is
 * edited; a source entry that is renamed silently invalidates its board string.
 *
 *   VLANS            `content/projects.ts`  CCN call-centre network, `stack: ["VLANs"]`
 *   ACLS             `content/projects.ts`  CCN call-centre network, `stack: ["ACLs"]`
 *   SUBNETTING       `content/skills.ts`    Computer Networks, `note: "subnetting, routing, VLANs, ACLs"`
 *   RIP ROUTING      `content/projects.ts`  CCN call-centre network, `stack: ["RIP routing"]`
 *   GROUP POLICY     `content/projects.ts`  SNA enterprise infrastructure, `stack: ["Group Policy"]`
 *   UBUNTU/BASH      `content/projects.ts`  SNA enterprise infrastructure, `stack: ["Ubuntu/Bash"]`
 *   DOCKER COMPOSE   `content/projects.ts`  FOLIO, `stack: ["Docker Compose"]`
 *   APACHE KAFKA     `content/projects.ts`  FOLIO, `stack: ["Apache Kafka"]`
 *
 * ONE ENTRY THAT DID NOT MAKE IT, RECORDED SO IT IS NOT RE-PROPOSED AS AN
 * OVERSIGHT: `Active Directory` is the single most representative term in the
 * SNA build and it is SIXTEEN characters, one over the board's cap. It was not
 * shortened, because shortening is elaboration in the other direction. If Saad
 * wants it, the cap moves to 16 — geometrically that is 223px against the
 * narrowest 247px column, so it fits — and that is his call, not a tidy-up.
 */

/**
 * The board's rotation period, in MILLISECONDS.
 *
 * 7000ms. The bio beside it is ~440 characters, i.e. 25-30 seconds of reading,
 * so a visitor sees roughly four changes per visit and is usually not looking
 * when one happens — it registers as "this page is alive" rather than as a
 * ticker demanding attention. At 3s it is a widget. DO NOT GO BELOW 5000.
 *
 * Milliseconds rather than seconds because its one consumer is `setInterval`.
 * `lib/animation/easing.ts`'s `DURATION` is in seconds for GSAP and Framer and
 * this is deliberately not one of its entries: it is a dwell between two
 * resting states, not the duration of a transition.
 */
export const FLIP_BOARD_DWELL_MS = 7000;

export const FLIP_BOARD_STRINGS = [
  "VLANS",
  "ACLS",
  "SUBNETTING",
  "RIP ROUTING",
  "GROUP POLICY",
  "UBUNTU/BASH",
  "DOCKER COMPOSE",
  "APACHE KAFKA",
] as const;
