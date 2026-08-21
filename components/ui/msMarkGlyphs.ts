/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 *   node scripts/extract-glyph-outlines.mjs
 *
 * Space Grotesk glyph outlines for the Intro's morph, converted once at build
 * time from `public/fonts/space-grotesk-latin.typeface.json`. See that file's
 * README for the asset's provenance and
 * `scripts/extract-glyph-outlines.mjs` for what this conversion does and why
 * it is not done in the browser.
 *
 * COORDINATES ARE FONT UNITS WITH Y UP, baseline at y = 0, glyph origin at
 * x = 0 — the font's own space, not the mark's viewBox.
 * `components/ui/msMarkGeometry.ts` places them, and it is the module
 * everything else imports; nothing should read this file directly.
 *
 * EVERY COMMAND IS ABSOLUTE (`M`/`L`/`Q`/`C`/`Z`). That is relied upon:
 * it is what lets a path be transformed by walking its numbers in x,y pairs
 * without a path parser.
 *
 * ONLY THE GLYPHS `HERO_NAME` NEEDS ARE EMITTED. `SOURCE_NAME` below records
 * the string they were generated for, and `msMarkGeometry.ts` checks it
 * against the live `HERO_NAME` in development — a renamed hero would
 * otherwise lose letters silently.
 */

/** The string these glyphs were generated for. */
export const SOURCE_NAME = "Muhammad Saad";

/** Font units per em, from the asset's own `resolution`. */
export const UNITS_PER_EM = 1000;

/** OS/2 cap height, in font units. Every size in the mark is stated against
 *  cap height rather than em, because cap height is what the eye measures. */
export const CAP_HEIGHT = 700;

/** Advance width of the space glyph, in font units. It has no outline, so it
 *  is carried separately rather than as an entry with an empty `d`. */
export const SPACE_ADVANCE = 257;

export type Glyph = {
  /** Advance width in font units. */
  readonly ha: number;
  /**
   * Ink bounds in font units. The mark anchors each capital by its `xMin`
   * rather than by its advance origin, so the trace a letter becomes starts on
   * the same vertical the letterform did — a left side bearing carried into the
   * morph would offset the whole shape by a few units for no reason.
   */
  readonly xMin: number;
  readonly xMax: number;
  /** Absolute-only SVG path data in font units, Y UP, baseline y = 0. */
  readonly d: string;
};

export const GLYPHS: Readonly<Record<string, Glyph>> = {
  "M": { ha: 865, xMin: 80, xMax: 785, d: "M80 0L80 700L240 700L426 53L439 53L625 700L785 700L785 0L704 0L704 645L690 645L505 0L360 0L175 645L161 645L161 0Z" },
  "S": { ha: 613, xMin: 48, xMax: 564, d: "M550 498L550 456L467 456L467 498Q467 574 420 607.5Q373 641 301 641Q232 641 190 610.5Q148 580 148 524Q148 468 187 443Q226 418 296 401L348 388Q408 374 457 351.5Q506 329 535 291Q564 253 564 191Q564 129 533 83Q502 37 445.5 11.5Q389 -14 313 -14Q237 -14 177 13Q117 40 82.5 94.5Q48 149 48 231L48 252L131 252L131 231Q131 143 181.5 101Q232 59 313 59Q395 59 438 96Q481 133 481 189Q481 228 461.5 251Q442 274 407 288.5Q372 303 325 314L273 327Q211 342 164 365Q117 388 91 426Q65 464 65 523Q65 582 94.5 625Q124 668 177.5 691Q231 714 301 714Q372 714 428 690Q484 666 517 617.5Q550 569 550 498Z" },
  "a": { ha: 575, xMin: 50, xMax: 550, d: "M233 -14Q181 -14 139.5 4Q98 22 74 56Q50 90 50 139Q50 189 74 221.5Q98 254 139.5 270.5Q181 287 234 287L399 287L399 323Q399 375 369 405Q339 435 278 435Q219 435 185.5 406Q152 377 141 330L67 354Q78 395 104.5 428.5Q131 462 174 482.5Q217 503 279 503Q372 503 424.5 454.5Q477 406 477 318L477 97Q477 67 505 67L550 67L550 0L481 0Q448 0 428 18.5Q408 37 408 68L408 73L396 73Q385 54 366.5 33.5Q348 13 316 -0.5Q284 -14 233 -14ZM242 54Q313 54 356 95.5Q399 137 399 212L399 223L237 223Q190 223 159.5 202.5Q129 182 129 141Q129 100 160 77Q191 54 242 54Z" },
  "d": { ha: 644, xMin: 59, xMax: 561, d: "M290 -14Q226 -14 173.5 16.5Q121 47 90 103Q59 159 59 238L59 251Q59 329 90 385.5Q121 442 173.5 472.5Q226 503 290 503Q366 503 408 474.5Q450 446 468 412L482 412L482 700L561 700L561 0L484 0L484 81L470 81Q450 44 408 15Q366 -14 290 -14ZM311 56Q386 56 434 104.5Q482 153 482 240L482 249Q482 336 434 384.5Q386 433 311 433Q235 433 187 384.5Q139 336 139 249L139 240Q139 153 187.5 104.5Q236 56 311 56Z" },
  "h": { ha: 613, xMin: 83, xMax: 536, d: "M162 0L83 0L83 700L162 700L162 411L176 411Q187 432 207 452Q227 472 259.5 485Q292 498 342 498Q396 498 440 474.5Q484 451 510 406Q536 361 536 296L536 0L457 0L457 290Q457 363 420.5 396Q384 429 322 429Q252 429 207 382.5Q162 336 162 246Z" },
  "m": { ha: 860, xMin: 83, xMax: 782, d: "M162 0L83 0L83 489L160 489L160 428L174 428Q188 454 220 476Q252 498 310 498Q367 498 402 473Q437 448 454 412L468 412Q484 448 518.5 473Q553 498 616 498Q689 498 735.5 453.5Q782 409 782 331L782 0L703 0L703 324Q703 373 674.5 401.5Q646 430 595 430Q541 430 506.5 395Q472 360 472 294L472 0L393 0L393 324Q393 373 364.5 401.5Q336 430 285 430Q231 430 196.5 395Q162 360 162 294Z" },
  "u": { ha: 612, xMin: 77, xMax: 530, d: "M270 -9Q216 -9 172 14Q128 37 102.5 82Q77 127 77 193L77 489L156 489L156 199Q156 126 192.5 93Q229 60 291 60Q361 60 406 106Q451 152 451 243L451 489L530 489L530 0L453 0L453 83L439 83Q423 48 384 19.5Q345 -9 270 -9Z" },
};

export default GLYPHS;
