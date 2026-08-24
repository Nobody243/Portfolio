"use client";

/**
 * Scrambled text that resolves, character by character, into the real string.
 *
 * INSTALLED FROM `@aceternity/encrypted-text` AND THEN REWRITTEN. The registry
 * copy is the starting point, not the shipped thing, and the same is true of
 * `text-flipping-board.tsx` and `text-hover-effect.tsx`. What follows is every
 * deviation, with its reason, so that a future `shadcn add --overwrite` can be
 * reconciled instead of silently undoing the lot.
 *
 *   1. THE TRIGGER IS A PROP, NOT `useInView`. The registry component starts
 *      when it scrolls into view, once. Its one consumer here is the hero
 *      tagline, which is above the fold on every viewport — it is in view from
 *      the first frame, so an in-view trigger would fire it during the Intro's
 *      hand-off, which is the exact window the ticket asks it to stay out of.
 *      The trigger is `play`, driven by `Hero.tsx`'s `TAGLINE_BEAT_S`, and it
 *      is an EDGE — see `run`. This also drops the `motion/react` import
 *      entirely: `useInView` was the only thing that needed it, and
 *      `motion.span` was being used for a plain ref.
 *
 *   2. IT RENDERS PLAIN TEXT UNTIL IT IS PLAYING, AND PLAIN TEXT AGAIN ONCE IT
 *      HAS RESOLVED. The registry copy seeds its scramble buffer from
 *      `Math.random()` in a `useRef` initialiser, which runs on the SERVER too
 *      — so the prerendered HTML carried one set of gibberish and hydration
 *      generated a different one. That is a guaranteed hydration mismatch on
 *      every render of the component, in the one place on this site where a
 *      mismatch would be a visible flash. Idle is now the real string, so the
 *      server, the client's first render and the reduced-motion path all emit
 *      identical DOM. `useReducedMotion`'s header states that requirement as
 *      binding on every consumer.
 *
 *      RESOLVING BACK TO PLAIN TEXT ALSO PROTECTS THE TYPOGRAPHY. While it is
 *      running, every character is its own absolutely-positioned box (see 3),
 *      which means no kerning pairs apply. Leaving the headline in that state
 *      forever would permanently degrade a Tier 1 heading to buy an effect that
 *      lasts under a second.
 *
 *   3. THE LINE'S GEOMETRY DOES NOT MOVE WHILE IT SCRAMBLES. Space Grotesk is
 *      proportional, so swapping every character for a random one twenty times
 *      a second changes the line's width twenty times a second: the right edge
 *      breathes, every glyph after the reveal front slides, and on a narrow
 *      viewport a scramble wider than the real string can push the line past
 *      `max-w-[34ch]` and WRAP — a vertical reflow in the middle of the hero's
 *      one text block. So each character occupies a slot sized by the REAL
 *      character (an `invisible` copy holds the width) with the scramble glyph
 *      absolutely positioned at the slot's left edge. Wide glyphs overhang to
 *      the right; nothing reflows.
 *
 *      SPACES ARE NOT SLOTS, deliberately. They stay as ordinary text nodes,
 *      because an `inline-block` space is not a line-break opportunity and the
 *      tagline has to keep wrapping at 360px.
 *
 *   4. `role="text"` IS GONE. It is a non-standard WebKit-only role; it is not
 *      in the ARIA spec and validators flag it. The accessible copy is now an
 *      `sr-only` span holding the real string, with the animating glyphs marked
 *      `aria-hidden` — which is also the only arrangement that guarantees no
 *      assistive technology ever announces the gibberish.
 *
 *   5. REDUCED MOTION COLLAPSES TO THE FINAL STRING. The registry copy has no
 *      reduced-motion path at all. The effect below returns before it schedules
 *      a frame, so nothing animates and nothing is scheduled — the caveat in
 *      `useReducedMotion`'s header (a preference read does not stop a loop; the
 *      consumer has to act on it) is honoured by not starting one. The
 *      preference is also read again in the render test, because it is live and
 *      can be turned on halfway through; see that comment.
 *
 *   6. IT RE-RENDERS ON FLIPS, NOT ON FRAMES. The registry copy calls
 *      `setRevealCount` on every `requestAnimationFrame` — 60 renders a second
 *      of one span per character — while the value it sets only changes every
 *      `revealDelayMs`. State is now written only on a frame that actually
 *      changes something.
 *
 *   7. THE `charset` PROP IS GONE, replaced by four width-banded pools. The
 *      registry copy takes one flat alphabet and draws from it uniformly, which
 *      is what put wide glyphs in narrow slots and made the line overprint
 *      itself. See `BAND_NARROW` for the screenshot that forced it. The prop is
 *      removed rather than kept as an override because a flat charset is
 *      precisely the defect, and this component has one consumer.
 *
 *   8. IT RUNS IN REVERSE TOO. The registry copy resolves once and is finished.
 *      This one takes a `cycle` counter: bump it and the line comes APART from
 *      the right, then reassembles from the left, as one continuous gesture.
 *      Nothing polls between cycles — a settled pass schedules no frame, and
 *      the counter's next value re-runs the effect. See `cycle` for why the
 *      clock belongs to the consumer.
 *
 * DO NOT REUSE THIS COMPONENT WITHOUT ASKING. The ticket that introduced it is
 * explicit that it is a single placement: the site already has the Intro's
 * letter merge and the flip board's character scramble, and a third
 * scramble-family effect in a second location stops reading as a signature.
 */

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * THE POOLS THE SCRAMBLE DRAWS FROM, BANDED BY GLYPH WIDTH. A character is only
 * ever replaced by one of roughly its own width.
 *
 * THIS IS DEVIATION 7 AND IT WAS FORCED BY A SCREENSHOT, not by theory. The
 * first build drew from one flat alphabet, exactly as the registry component
 * does. The slots below hold the LINE still (deviation 3), but they do nothing
 * about what happens INSIDE a slot: a `W` landing in the box reserved for an
 * `i` overhangs it by most of its own width and lands on top of its neighbour.
 * Captured mid-decrypt, the tagline was a pile-up — glyphs visibly overprinting
 * each other, reading as a rendering fault rather than as ciphertext.
 *
 * Banding fixes it without measuring anything: a narrow real character draws a
 * narrow replacement, so the worst overhang is the width spread WITHIN one
 * band, which is a couple of pixels at this size. It also does something the
 * flat alphabet could not — the ciphertext keeps the texture of the real
 * sentence, because tall thin letters stay tall and thin while the word
 * scrambles. The line reads as the same line, encrypted.
 *
 * THE BANDS ARE APPROXIMATE, AND THEY ARE ALLOWED TO BE. They are eyeballed
 * advance widths for a humanist sans — Space Grotesk here — not measured
 * metrics, and nothing downstream depends on them being exact: the slots
 * guarantee the layout regardless, so a mis-banded character costs a pixel or
 * two of overhang and nothing else. A `measureText` pass over the real font
 * would be more precise and is deliberately not taken: it needs the resolved
 * font, which needs a ref, which cannot be read during the render that seeds
 * the first frame.
 *
 * THE SYMBOLS ARE THE ONES THAT OCCUR IN THE COMMAND FRAGMENTS THE SPHERE IS
 * DRAWING BEHIND THIS LINE. Brackets, braces and parentheses are deliberately
 * absent from all four: they read as punctuation rather than as ciphertext, so
 * a line scrambling through them looks like a syntax error.
 */
const BAND_NARROW = "iltfjr1!|/.:;,-_";
const BAND_MEDIUM = "acenosuvxyz023456789+=<>?*^~";
const BAND_WIDE = "bdghkpqABCDEFGHJKLNOPQRSTUVXYZ#%&@";
const BAND_BROAD = "mwMW";

/** Which band a real character is replaced from. Unknown characters are medium. */
function poolFor(character: string): string {
  if (BAND_NARROW.includes(character)) return BAND_NARROW;
  if (BAND_BROAD.includes(character)) return BAND_BROAD;
  if (BAND_WIDE.includes(character)) return BAND_WIDE;
  return BAND_MEDIUM;
}

type EncryptedTextProps = {
  /** The real string. Also what assistive technology is given, always. */
  text: string;
  /**
   * The trigger, and it is an EDGE rather than a level: this component has to
   * see `play` go false → true. Mounting with it already true renders the real
   * string and never animates — see the `running` comment for the path that
   * does exactly that and why it should not scramble. Lowering it afterwards
   * does not rewind.
   */
  play: boolean;
  /** Milliseconds to wait after `play` before the first scrambled frame. */
  startDelayMs?: number;
  /** Milliseconds between one character locking in and the next. */
  revealDelayMs?: number;
  /** Milliseconds between one character coming APART and the next, in reverse. */
  encryptDelayMs?: number;
  /** Milliseconds between re-randomisations of the unresolved characters. */
  flipDelayMs?: number;
  /**
   * THE REPEAT, AND IT IS A COUNTER RATHER THAN AN INTERVAL — bump it and this
   * runs the reverse pass followed by a fresh forward pass, once.
   *
   * THE CLOCK IS THE CONSUMER'S, DELIBERATELY, AND THE REASON IS DRIFT. Given a
   * `repeatMs` instead, each instance would time its own cycle, and a cycle's
   * length depends on the string: the tagline's two units are 24 and 22
   * characters, so at 34ms forward and 18ms back they differ by
   * `2 x (34 + 18)` = **104ms per cycle**. One shared 20s interval hides that
   * for exactly one cycle; two private ones accumulate it, and after an hour on
   * an open tab the two lines are ~19s out of step — one scrambling while the
   * other sits still. A counter cannot drift, because there is only one of it.
   *
   * `startDelayMs` still applies on every run, so the units keep their stagger.
   */
  cycle?: number;
  className?: string;
  /** Applied to characters that have not resolved yet. */
  encryptedClassName?: string;
  /** Applied to characters that have. */
  revealedClassName?: string;
};

/**
 * One rendered frame of the effect. `reveal < 0` means "not started", which is
 * both the idle state and the server's.
 *
 * `scramble` IS A STRING IN STATE, NOT AN ARRAY IN A REF, and the first draft
 * had it the other way round — the registry component does too. `eslint`
 * rejected it: `react-hooks/refs` forbids reading `ref.current` during render,
 * and a buffer that only exists to be rendered is not what a ref is for. It is
 * also the correct call on the merits, since the buffer changing IS the reason
 * to re-render. The cost is one string allocation per flip — ~18 a second for
 * under a second.
 */
type Progress = { reveal: number; scramble: string };

const IDLE: Progress = { reveal: -1, scramble: "" };

function randomCharacter(pool: string): string {
  return pool.charAt(Math.floor(Math.random() * pool.length));
}

/**
 * THE FIRST FRAME OF CIPHERTEXT, DERIVED FROM THE STRING RATHER THAN DRAWN.
 *
 * IT EXISTS BECAUSE THE EFFECT IS ONE FRAME TOO LATE, AND THAT WAS MEASURED
 * RATHER THAN REASONED ABOUT. Traced per frame on the shipped page, `play`
 * turning true and the first SCRAMBLED frame were **88ms apart** — the commit
 * has to land, then the effect runs, then it schedules a frame, then its
 * `setProgress` commits. The consumer starts its opacity fade on the same
 * commit as `play`, and that fade is `EASE.hero`, which is ~80% travelled at
 * 88ms of its 280ms. So the hero showed the REAL sentence at four-fifths
 * opacity and then scrambled it — text, gibberish, text, which is the one
 * sequence this effect must never read as.
 *
 * Seeding here, during the render that first sees `play`, makes the ciphertext
 * present on the same commit as the fade. The effect's first frame then
 * overwrites it with real randomness and nothing else changes.
 *
 * IT IS A HASH, NOT `Math.random()`, and that is the whole point of it being a
 * separate function. This runs during RENDER: a random draw there is impure,
 * disagrees with itself across StrictMode's double render, and would put a
 * `Math.random()` call back on a path the header's deviation 2 spent its
 * length getting it off. FNV-1a over the character and its index gives a fixed
 * string per input — no two adjacent slots agree, and the same tagline always
 * opens on the same ciphertext, which also makes the effect testable.
 */
function seedScramble(text: string): string {
  let hash = 0x811c9dc5;
  let seeded = "";
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === " ") {
      seeded += " ";
      continue;
    }
    hash ^= text.charCodeAt(i) + i * 131;
    hash = Math.imul(hash, 0x01000193) >>> 0;
    const pool = poolFor(text[i]);
    seeded += pool.charAt(hash % pool.length);
  }
  return seeded;
}

export function EncryptedText({
  text,
  play,
  startDelayMs = 0,
  revealDelayMs = 50,
  encryptDelayMs = 50,
  flipDelayMs = 50,
  cycle = 0,
  className,
  encryptedClassName,
  revealedClassName,
}: EncryptedTextProps) {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState<Progress>(IDLE);

  /*
    THE CIPHERTEXT IS ON SCREEN ON THE SAME COMMIT AS `play`. `seedScramble`
    carries the measurement that forced this; the shape is the repo's standard
    "adjust state during render" — `AboutFlipBoard`'s `seenStart` and
    `text-flipping-board.tsx`'s `settled` are the other two. React re-runs this
    component immediately with the corrected state and never commits the frame
    in between, which an effect could not do.

    IT LATCHES ON `run === 0` RATHER THAN ON THE EDGE ALONE, so a consumer that
    lowered and re-raised `play` cannot restart a finished decrypt.
  */
  const [seenPlay, setSeenPlay] = useState(play);
  const [seenCycle, setSeenCycle] = useState(cycle);
  const [run, setRun] = useState(0);
  if (play !== seenPlay) {
    setSeenPlay(play);
    if (play && !reducedMotion && run === 0 && text.length > 0) {
      setProgress({ reveal: 0, scramble: seedScramble(text) });
      setRun(1);
    }
  }

  /*
    THE REPEAT EDGE. `run` is both the effect's key and its INSTRUCTION: 1 means
    "forward only", anything above means "reverse, then forward". Every bump
    changes the dep, so the effect tears down and restarts with a fresh closure
    rather than needing a state machine that survives across runs.

    NO SEED HERE, unlike the `play` edge above, and the asymmetry is the point.
    A cycle STARTS from resolved text — `reveal` is already `total`, which the
    render below treats as plain text — so the reverse pass has real text to
    take apart and there is no frame where the wrong thing is on screen. The
    `play` edge had the opposite problem and needed the seed.

    IT DOES NOT REQUIRE A FIRST DECRYPT. `run === 0 -> 2` is what a client
    navigation to `/` takes: the sentence was never decrypted there (no Intro,
    no hand-off, nothing to be a beat against), but the ambient cycle is a
    property of the SURFACE rather than of the entry, so it still runs.
  */
  if (cycle !== seenCycle) {
    setSeenCycle(cycle);
    if (!reducedMotion && text.length > 0) {
      setRun((current) => (current === 0 ? 2 : current + 1));
    }
  }

  /*
    IT TAKES A TRANSITION, NOT A TRUE VALUE, AND THAT IS WHY THE LOOP KEYS ON
    `running` RATHER THAN ON `play`.

    MEASURED, AGAIN. `play` arriving already true at mount is not hypothetical —
    it is what a client navigation back to `/` does: `IntroProvider` seeds both
    hand-off wires true when there is no Intro to play, so `Hero.tsx` hands this
    component `play` true on its first render. Traced, that path scrambled: the
    first frame rendered the real sentence (nothing had seeded the ciphertext),
    the effect then started one frame later and gibberished it. Text, gibberish,
    text — the same defect `seedScramble` exists to prevent, arriving through
    the other door.

    Refusing to start is the right answer rather than seeding harder. The ticket
    asks for this to fire "once per Intro hand-off", and a client navigation is
    not one: there is no plate, no arrival tween and no burst, so there is
    nothing for the tagline to be a distinct beat AGAINST. The visitor gets the
    sentence, immediately, which is what that path has always given them.
  */
  useEffect(() => {
    if (run === 0 || reducedMotion) return;

    const total = text.length;
    if (total === 0) return;

    const glyphs: string[] = new Array(total).fill(" ");
    /* One width band per slot, resolved once. `poolFor` is a few `includes`
       calls, and this runs per character per flip. */
    const pools: string[] = Array.from(text, poolFor);
    const scatter = (from: number) => {
      for (let i = Math.max(0, from); i < total; i += 1) {
        glyphs[i] = text[i] === " " ? " " : randomCharacter(pools[i]);
      }
    };

    let cancelled = false;
    let frame = 0;
    let origin = 0;
    let opened = false;
    let lastFlip = 0;

    /* THE ONE PIECE OF STATE THE TWO PASSES DISAGREE ABOUT IS THE DIRECTION,
       and `reveal` already expresses it. It counts LEADING REAL CHARACTERS, so
       the forward pass drives it 0 -> total and the reverse pass drives it
       total -> 0. The render below needs no idea which is running: ciphertext
       is simply everything from `reveal` rightwards, and the reverse therefore
       eats the line from its END, which is what makes it read as an unwind
       rather than as a second forward wipe. */
    let encrypting = run > 1;
    let reveal = encrypting ? total : 0;

    /* Re-applied per PASS, not per cycle: the stagger between the tagline's two
       units has to survive every repeat, or they converge. Cleared at the
       hand-over below so the forward pass follows its own reverse immediately. */
    let delay = startDelayMs;

    const step = (now: number) => {
      if (cancelled) return;
      if (origin === 0) origin = now;

      const elapsed = now - origin - delay;
      if (elapsed < 0) {
        frame = requestAnimationFrame(step);
        return;
      }

      /* THE FIRST SCRAMBLED FRAME IS ALSO THE FIRST FRAME THE BUFFER EXISTS.
         Filling it here rather than at mount is what keeps the idle render
         free of `Math.random()` — see deviation 2 in the header. */
      if (!opened) {
        opened = true;
        lastFlip = now;
        scatter(0);
      }

      const moved = Math.min(
        total,
        Math.floor(
          elapsed / Math.max(1, encrypting ? encryptDelayMs : revealDelayMs),
        ),
      );
      const nextReveal = encrypting ? total - moved : moved;

      /* ONE FLIP TICK FOR THE WHOLE STRING, not one per character. Giving each
         character its own phase would shimmer rather than strobe, and it was
         tried; it costs a state write on roughly every frame instead of one
         per `flipDelayMs`, and at this duration the difference is not visible
         while the render count is. */
      let flipped = false;
      if (now - lastFlip >= Math.max(0, flipDelayMs)) {
        lastFlip = now;
        flipped = true;
        scatter(nextReveal);
      }

      if (flipped || nextReveal !== reveal) {
        reveal = nextReveal;
        setProgress({ reveal, scramble: glyphs.join("") });
      }

      /* THE HAND-OVER, AND THERE IS NO PAUSE IN IT. The reverse pass runs
         straight into the forward one on the frame it finishes, so a cycle is
         one gesture — the line comes apart and immediately reassembles —
         rather than two events with a gap where a fully-encrypted tagline sits
         on screen being unreadable. `delay` is cleared here because the
         stagger has already been spent at the top of this cycle. */
      if (encrypting && reveal <= 0) {
        encrypting = false;
        origin = 0;
        delay = 0;
      } else if (!encrypting && reveal >= total) {
        /* Settled. Nothing is scheduled and nothing polls: the next bump of
           `cycle` re-runs this whole effect with a fresh closure. */
        return;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
    /* `play` going false is not a rewind: `run` stays where it is, the loop
       keeps going, and `progress` is left where it was. The one consumer never
       lowers it, and a hero tagline that un-resolved itself on a prop change
       would be a defect, not a feature. The REVERSE pass is a different thing
       entirely — it is asked for, it is bounded, and it always ends resolved. */
  }, [
    run,
    reducedMotion,
    text,
    startDelayMs,
    revealDelayMs,
    encryptDelayMs,
    flipDelayMs,
  ]);

  const characters = text.length;

  /* PLAIN TEXT AT BOTH ENDS. Before the first scrambled frame and after the
     last one, this renders exactly what a bare `{text}` would — same node, same
     kerning, no per-character boxes, nothing for a screen reader to skip.

     `reducedMotion` IS IN THIS TEST AND NOT ONLY IN THE EFFECT, because the
     preference is LIVE. Turning it on mid-decrypt kills the loop through the
     effect's cleanup, and without this term `progress` would be left frozen
     wherever it was — a hero tagline stuck as half-ciphertext, permanently, for
     the one visitor who asked for less motion. */
  if (reducedMotion || progress.reveal < 0 || progress.reveal >= characters) {
    return <span className={className}>{text}</span>;
  }

  const slots: ReactNode[] = [];
  for (let i = 0; i < characters; i += 1) {
    const real = text[i];

    /* Spaces stay ordinary text nodes so the line can still break at them. */
    if (real === " ") {
      slots.push(" ");
      continue;
    }

    const revealed = i < progress.reveal;
    slots.push(
      <span key={i} className="relative inline-block">
        {/* Holds the slot open at the REAL character's advance width. */}
        <span className="invisible">{real}</span>
        <span
          className={cn(
            "absolute top-0 left-0",
            revealed ? revealedClassName : encryptedClassName,
          )}
        >
          {revealed ? real : (progress.scramble[i] ?? real)}
        </span>
      </span>,
    );
  }

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{slots}</span>
    </span>
  );
}

export default EncryptedText;
