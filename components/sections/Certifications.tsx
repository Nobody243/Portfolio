import { IntroEntrance } from "@/components/intro/IntroEntrance";
import {
  CERTIFICATIONS_HEADING,
  CERTIFICATIONS_PLACEHOLDER_LINE,
} from "@/components/sections/certificationsContent";

/**
 * Certifications — Tier 3. On `/work`, the SECOND section on `bg-base`,
 * between the project deck and Experience.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * IT IS A HEADING AND ONE LINE. NO CARD, NO DASHED BOX, NO ICON, NO LOCK GLYPH.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The site's established honest-placeholder pattern is Skills' `00` empty
 * group, and it reads well for one specific reason: **it is typography stating
 * a fact, not a decorated empty state.** Everything the reflex reaches for here
 * — a dashed outline, a padlock, a greyed-out card, a "0 / 3 complete"
 * progress row — announces that the absence is embarrassing and is being
 * dressed. It is not embarrassing; CLAUDE.md's positioning says the sparse
 * trajectory is a FEATURE (visible direction), not something to hide or pad.
 *
 * FORBIDDEN HERE, explicitly, so none of it is re-proposed as an improvement:
 * a card or bordered box of any kind, a dashed or dotted border, a lock/clock/
 * hourglass glyph, a skeleton shimmer, a progress bar or ring, a percentage, a
 * "0" count, an illustration, a "notify me" control, and any tinted background.
 * The section is `bg-base` like its neighbours.
 *
 * **NO `00` COUNT EITHER, AND THAT IS NOT AN INCONSISTENCY WITH SKILLS.**
 * Skills' `00` is honest because it makes an empty group visible INSIDE a
 * section whose other two groups are full — the digits are the proof that the
 * code ran and that zero is the answer, and they only read that way in
 * contrast. Here the whole section is empty, so a `00` beside the heading would
 * be a digit whose only reading is "none", printed twice with the sentence
 * below it. `Experience.tsx` refuses a count for the mirror-image reason.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * THE ONE LINE IS `text-caption font-mono`, AND THERE IS A TENSION WORTH
 * KNOWING ABOUT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The design brief (§J.12) specifies a mono caption. `Skills.tsx` sets ITS
 * empty-group line at `text-body text-fg/70` and argues against mono in as many
 * words: "set in 12px mono it would read as a code comment or a TODO, on the one
 * part of the site whose whole job is to be believed."
 *
 * **BOTH ARE RIGHT, BECAUSE THE TWO STRINGS ARE DIFFERENT KINDS OF THING.**
 * Skills' line is a full sentence with two full stops — a statement, which is
 * why it is set at body scale. This one is two words. Two words at body scale
 * on their own under a `text-h2` heading read as a stranded fragment; at mono
 * caption they read as a status label, which is what "Coming soon." is, and it
 * is the same mono-caption-as-annotation voice Skills, Experience and the deck's
 * kickers already use. **If Saad prefers Skills' treatment, it is a one-class
 * change** (`text-caption font-mono text-fg/70` → `text-body text-fg/70`) and
 * nothing else in this file moves.
 *
 * `/70` is this site's established subordinate ink and sits above the /70 text
 * floor: 6.69:1 on `bg-base` in light mode, which is the binding case.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `IntroEntrance` AND NOT `Reveal` — AND IT WAS `Reveal` UNTIL 2026-08-25, ON
 * AN ARITHMETIC CLAIM THAT WAS NEVER RUN
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The comment at the `<h2>` below used to say this section "is below the fold on
 * every viewport `/work` is designed for, so it is never caught by the Intro
 * plate the way the deck above it is." **That is false on tall displays, and the
 * stack is short enough to check by hand.** Measured off the SHIPPED class
 * strings, at `xl`+ where the deck renders its fan and `text-h2` is at its 68px
 * cap:
 *
 *   `ProjectDeckSection` `pt-2xl`                             89.0
 *   `<h1>` `text-h2` 68 x 1.1                                 74.8
 *   `mt-xl` heading -> deck                                   55.0
 *   deck container `h-[540px]`                               540.0
 *   `mt-xl` deck -> "Browse as a list"                        55.0
 *   the control (13 + 16.8 + 13 + 2x2 border)                 46.8
 *   `ProjectDeckSection` `pb-2xl`                             89.0
 *                                                           ───────
 *   this section's top edge                                  949.6
 *   this section's own `pt-2xl`                               89.0
 *                                                           ───────
 *   THIS `<h2>`'s TOP                                       1038.6
 *
 * `Reveal` fires at `amount: 0.1`, i.e. once 10% of the `<h2>` (7.5px of 74.8)
 * has entered the viewport — **about 1046px of visible document.** The brutal
 * control's 5px shadow overhang is outside the box model and adds nothing.
 *
 * SO THE HEADING IS INSIDE THE FOLD ON ANY WINDOW TALLER THAN ~1046px — which
 * includes 2560x1440 (~1305px of real `innerHeight` after browser chrome), a
 * viewport that sits on `IntroEntrance`'s OWN tested list. There, on a hard
 * load, this heading and "Coming soon." fire on the first observer tick after
 * mount — ~131ms, on the one occasion anyone timed one of these (`IntroEntrance`
 * .tsx, 2026-08-22) — and are fully settled behind a plate that stays opaque
 * until ~2.4s. That is the "animates in secret" defect `IntroEntrance` exists to
 * repair, reintroduced by the restructure: `/work`'s second section used to be
 * Experience below a five-card grid, at a top of >=1981px, and it is now this
 * one at 949.6 — roughly 1030px higher.
 *
 * `IntroEntrance`'s own selection rule is "wrap the units that can be above the
 * fold at SOME viewport", not "at 1440x900" — and it is self-selecting in the
 * other direction: below the fold, a wrapped unit simply sits at `initial` and
 * reveals on scroll exactly as `Reveal` would.
 *
 * **THE COST IS REAL AND IS THE ONE `IntroEntrance` ALREADY DECLARES**: on a
 * hard load, `arriving` latches, so on the common 945px window — where this
 * section IS below the fold — the reveal now carries the 0.30s onset and lands
 * ~316ms after entering the viewport instead of ~216ms. That price is already
 * paid by all three units `ProjectDeckSection` wraps; paying it on two more
 * buys the tall-display fix. On a CLIENT navigation there is no hand-off and
 * nothing changes.
 *
 * **`Experience` BELOW IS DELIBERATELY LEFT ON `Reveal`.** Same arithmetic: this
 * section is 324.6px tall (89 + 74.8 + 55 + 16.8 + 89), so Experience's `<h2>`
 * top is 1363.2 and its trigger is ~1370.7 — clear of the ~1305px a 1440-tall
 * display yields, by 66px. **That margin is arithmetic, not a browser
 * measurement**, and it is the number to re-check if anything above shrinks.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DELIBERATELY A SERVER COMPONENT, exactly as Experience, Skills and
 * CurrentlyLearning are. `IntroEntrance` (which renders `Reveal`) is the only
 * client boundary.
 *
 * IT DOES NOT RETURN `null` THE WAY `CurrentlyLearning` DOES, and the
 * difference is the point: §1 of the spec requires this section to be VISIBLY
 * PRESENT rather than hidden. `CurrentlyLearning` disappears while empty
 * because its own ticket defines "add the first entry to the data file and the
 * section appears" as the mechanism; this one is a promise the page is making
 * on purpose.
 */
export function Certifications() {
  return (
    <section
      id="certifications"
      aria-labelledby="certifications-heading"
      // Rule S-2's standard seam: 89 bottom + 89 top = 178px, uniform at all
      // breakpoints. Byte-identical to Skills, Projects and Experience, so this
      // section stacks between the deck and Experience with no seam work.
      className="w-full bg-base pt-2xl pb-2xl"
    >
      {/* Identical to every other section's container, byte for byte. The spine
          is 21 / 55 / 89px. No inner cap: there is no measure to protect — one
          two-word line cannot run long. */}
      <div className="mx-auto w-full max-w-[1440px] px-md sm:px-xl lg:px-2xl">
        <IntroEntrance>
          {/* Weight left at the inherited 400, as in every other section
              heading. `IntroEntrance` and not `Reveal` — this heading's top is
              at 1038.6px and its `amount: 0.1` trigger at ~1046px, which is
              inside the fold on a 1440-tall display. The arithmetic is in this
              file's header; do not "simplify" this back to `Reveal` without
              re-running it. */}
          <h2 id="certifications-heading" className="text-h2 text-fg">
            {CERTIFICATIONS_HEADING}
          </h2>
        </IntroEntrance>

        {/* `mt-xl`, matching the deck section's heading gap rather than
            `Projects.tsx`'s `mt-xl lg:mt-2xl`: there is one line here, and 89px
            of air above two words reads as a section that failed to load. */}
        <IntroEntrance className="mt-xl">
          <p className="text-caption font-mono text-fg/70">
            {CERTIFICATIONS_PLACEHOLDER_LINE}
          </p>
        </IntroEntrance>
      </div>
    </section>
  );
}

export default Certifications;
