/**
 * `"2025-05"` -> `"May 2025"`.
 *
 * LIVES IN lib/ RATHER THAN BESIDE ONE COMPONENT because the knowledge in the
 * comments below is worth more than the six lines of code, and it is needed
 * again by Ticket 7's detail page. It was written for Ticket 6's project
 * cards; the cards then dropped the date (rendering five dates in a stretched
 * column made the deliberate strength-first project order read as a broken
 * reverse-chronological sort), and deleting this with them would have thrown
 * away the bug it exists to prevent.
 *
 * CALLERS: `components/sections/ProjectDetail.tsx` (Ticket 7) renders each
 * project's completion month through it, `components/sections/Experience.tsx`
 * (Ticket 8) each end of a role's date range, and
 * `components/sections/CurrentlyLearning.tsx` (Ticket 9) both an entry's dates
 * and the section's last-reviewed stamp. This line previously read "there is
 * currently no caller, that is expected until Ticket 7" and was left stale when
 * Ticket 7 shipped — corrected 2026-08-19, and extended to the two later
 * callers the same day. Keep it accurate: a comment claiming a function is
 * unused is exactly the licence someone needs to delete it.
 *
 * ONE CALLER PASSES "YYYY-MM-DD", not "YYYY-MM": CurrentlyLearning's
 * last-reviewed stamp. The split-and-index below takes the first two segments
 * and ignores the third, so that input yields the month and year and drops the
 * day. That is relied upon deliberately at that call site — do not "fix" it by
 * rejecting longer inputs.
 */

/**
 * Month names. Twelve strings, deterministic, no
 * dependency — and that is the entire point.
 *
 * DO NOT REPLACE THIS WITH `new Date(project.date)`. `date` is `"YYYY-MM"`,
 * which the Date constructor parses as UTC midnight, so every viewer at a
 * negative UTC offset renders the PREVIOUS month: FOLIO's "2025-05" shows
 * "April 2025" in America/New_York, SNA's "2025-12" shows "November 2025",
 * CCN's "2024-12" shows "November 2024". Invisible from Pakistan (UTC+5) and
 * wrong for most of this site's audience. A real defect, verified, not a
 * nitpick.
 *
 * DO NOT REPLACE IT WITH `Intl` / `toLocaleDateString` EITHER, even when
 * constructing from parts: the server's ICU default locale and the browser's
 * locale can disagree, and this string is rendered on both sides of a client
 * boundary — that is a hydration mismatch.
 */
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * `"2025-05"` -> `"May 2025"`. Pure string work: split, index, join.
 *
 * Full month names rather than abbreviations because at 12px mono the longest
 * ("December 2024") is ~94px and fits every slot on the site, and `Dec '24` is
 * a register this site does not use anywhere else.
 *
 * An unrecognised value falls back to the raw string rather than rendering
 * "undefined 2025" — a malformed date should look wrong in review, not
 * plausible.
 */
export function formatMonthYear(isoMonth: string): string {
  const [year, month] = isoMonth.split("-");
  const name = MONTH_NAMES[Number(month) - 1];

  return year !== undefined && name !== undefined
    ? `${name} ${year}`
    : isoMonth;
}
