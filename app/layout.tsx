import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { IntroSessionMarker } from "@/components/intro/IntroSession";
import { LenisProvider } from "@/components/ui/LenisProvider";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { OG_IMAGE } from "@/lib/metadata";
import { themeInitScript } from "@/lib/theme";

// Both are variable fonts. `weight` is intentionally omitted so next/font loads
// the full variable axis — Space Grotesk's natural range is exactly 300-700.
//
// `/public/fonts` NOW EXISTS, and this comment used to say it never would.
// next/font/google self-hosts both faces below at build time, so no webfont
// file is served from there — but `space-grotesk-latin.typeface.json` lives
// there as OUTLINE PATH DATA, a geometry source rather than a font the browser
// loads. That asset, and its required OFL notice, live in /public/fonts. See
// public/fonts/README.md for provenance and how to regenerate it.
//
// DO NOT DELETE THAT ASSET WITH THE NEXT ROUND OF WEBGL CLEANUP. This comment
// used to say Ticket 3 needed it "as a three.js TYPEFACE JSON for the extruded
// hero wordmark" — that wordmark (`SaadGlass`, `TextGeometry`) and the whole
// R3F scene are gone, and the R3F packages themselves were uninstalled on
// 2026-08-22. The file's EXTENSION still says `.typeface.json`, which is a
// three.js convention, so it reads as three.js debris. It is not: the file is
// consumed at BUILD time by `scripts/extract-glyph-outlines.mjs`, which
// generates `components/ui/msMarkGlyphs.ts` — the Intro's name-to-MS-mark
// sequence. Removing it breaks the Intro's glyph pipeline, not a dead 3D scene.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * ONE STRING, TWO SURFACES. It is the `<meta name="description">` and the
 * `og:description`, and they must not be allowed to drift apart — a link
 * preview that says something different from the search result is the kind of
 * inconsistency nobody notices until it is embarrassing.
 *
 * The phrase "full-stack developer" is deliberately ABSENT and must not be
 * reintroduced. An earlier draft used it and filed the conflict with
 * CLAUDE.md's positioning rule as acceptable because a meta description is a
 * "search-keyword surface". That reasoning was rejected: this is the line that
 * appears beneath the site in every search result and every link preview,
 * which makes it one of the most load-bearing positioning surfaces there is,
 * not a technical field. It stays forward-looking ("heading into"), claiming
 * no expertise Saad does not yet have.
 */
const SITE_DESCRIPTION =
  "Portfolio of Muhammad Saad — software builder and IT undergraduate heading into cybersecurity and cloud infrastructure.";

export const metadata: Metadata = {
  // TITLE TEMPLATE — adopted in Ticket 7 (gate G6).
  //
  // `default` IS BYTE-IDENTICAL to the plain string this field held before,
  // and must stay that way: it is what every page without its own title still
  // renders. Only the shape changed. Verified 2026-08-22: `/about`, `/work`,
  // `/projects/[slug]` and `not-found` all declare their own `title`, so `/` is
  // the one route this string reaches (plus `app/error.tsx`, which cannot
  // export metadata at all). RE-VERIFIED 2026-08-25 with `/projects` added:
  // it declares `title: "Projects"` too, so the conclusion is unchanged and
  // `/` is still the only route reached.
  //
  // This said "including the one-pager at `/`". The site has been a multi-route
  // site since the restructure — four content routes as of 2026-08-25 — and `/`
  // is Home, not the whole site.
  //
  // `template` exists so a page can return the bare thing it is about —
  // `title: project.title` on /projects/[slug] — and get "FOLIO — Saad"
  // composed for it. Without it every page would have to hand-write the
  // suffix, which is how one page eventually ships without it. Next applies a
  // template only to DESCENDANT titles, never to `default` itself, so the
  // site title is not doubled into "Saad — Engineer & Builder — Saad".
  title: {
    default: "Saad — Engineer & Builder",
    template: "%s — Saad",
  },
  description: SITE_DESCRIPTION,

  /**
   * THE PRODUCTION ORIGIN, and the thing every other absolute URL on the site
   * is resolved against. Ticket 17.
   *
   * Until the deploy there was no correct value for this, which is why
   * `og:image` and `alternates.canonical` were both deferred by name in
   * `app/(site)/projects/[slug]/page.tsx` rather than guessed at. It is the
   * apex-with-www form because that is what the custom domain actually serves;
   * pointing it at the `.vercel.app` origin would emit canonicals and OG URLs
   * for a host the site no longer presents itself as.
   *
   * Every relative URL below (`url: "/"`, the per-project canonicals) becomes
   * absolute against this. Get it wrong and nothing errors — the tags simply
   * point somewhere else.
   */
  metadataBase: new URL("https://www.saaddev.top"),

  alternates: { canonical: "/" },

  /**
   * Pages that do NOT declare their own `openGraph` inherit this object whole,
   * image included — which covers `not-found` and `error`. Pages that DO
   * declare one replace it entirely and must spread `OG_IMAGE` themselves; see
   * the header of `lib/metadata.ts` for the measurement that established this.
   */
  openGraph: {
    images: [OG_IMAGE],
    type: "website",
    siteName: "Muhammad Saad",
    locale: "en_US",
    url: "/",
    // Mirrors the `title` field above, template and all, so a page returning a
    // bare `title` gets the same composed string in both places rather than a
    // preview card that disagrees with the tab.
    title: {
      default: "Saad — Engineer & Builder",
      template: "%s — Saad",
    },
    description: SITE_DESCRIPTION,
  },

  /**
   * NO `twitter.images`, deliberately. X falls back to `og:image` when
   * `twitter:image` is absent, so naming the file again here would mean a
   * second copy of a 197KB asset in the repo to say the same thing. The card
   * TYPE does have to be declared — without it X renders the small square
   * `summary` card and crops a 1.91:1 hero into it.
   */
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme class is ALWAYS explicit — "dark" here, swapped for "light" by
    // the theme toggle (Ticket 11, shipped). Token values would flip correctly
    // without it (they key off `:root` and `html.light`), but Tailwind's
    // `dark:` variant matches on a literal `.dark` class: leave it off and
    // every `dark:` utility in the codebase silently never applies. Failing
    // loudly beats failing quietly.
    //
    // THIS STAYS "dark" UNCONDITIONALLY, on every route. It is what the static
    // prerender ships; the pre-paint script in <head> below rewrites it for a
    // returning light-mode visitor. Do not make it dynamic — reading a cookie
    // here would opt every route out of static rendering.
    //
    // suppressHydrationWarning is what makes that rewrite legal: the class React
    // sees on the client differs from the one it rendered on the server.
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          THE ANTI-FLASH SCRIPT — Ticket 11. MUST STAY FIRST IN <head>, and must
          stay a RAW inline <script>.

          A classic inline script (no async, no defer, not type="module") is
          executed synchronously by the parser at the point it appears — before
          <body> is parsed and therefore before the first paint. That ordering
          is the entire mechanism. `next/script` with
          strategy="beforeInteractive" is injected and hydration-managed rather
          than emitted verbatim in document order, so it cannot do this.

          The served HTML is static on every route and always carries
          class="dark" on <html> above. Without this script a returning
          light-mode visitor paints near-black first and flips to warm-white
          when React hydrates — hundreds of ms later on a throttled connection.
          That is a returning-visitor-only bug, invisible in normal
          development, and it is exactly what Ticket 11's acceptance criterion
          forbids.

          The body of the script lives in `lib/theme.ts` so the storage key has
          ONE definition site-wide — the script cannot import, so the string is
          built there from the key constant. It is a static author-controlled
          literal with no user or URL data in it, so there is no injection
          surface.

          `suppressHydrationWarning` on <html> (above) is what lets this rewrite
          the class before React attaches without a warning. It was put there in
          Ticket 1 for this.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/*
          NO-JS NET — THREE RULES, FOUR ATTRIBUTES, ONE PLACE.

          IT SAID "TWO ATTRIBUTES" UNTIL 2026-08-22 and the count was right at
          the time; [data-page-stack] joined Rule 1 when the route transition
          shipped. Rule 1 is one rule about one failure mode, and a second
          component with the same failure mode belongs in it rather than in a
          Rule 3.

          THEN IT SAID "TWO RULES, THREE ATTRIBUTES", LATER THE SAME DAY, AND
          RULE 3 EXISTS AFTER ALL — because a third, genuinely different failure
          mode arrived with the Intro's relocation. It is written up in full
          below rather than folded into Rule 2, precisely so that this count is
          the thing a reader checks.

          Rule 1, [data-reveal] and [data-page-stack] — for every <Reveal> on
          the site, present and future, and for <PageStack>.

          IT SAID "the <PageStack> that every route's <main> now renders" AND
          THAT WAS NEVER TRUE. PageStack renders four of the site's seven
          <main> elements — `/`, `/work`, `/about` and `/projects`.
          `not-found.tsx`, `error.tsx` and `/projects/[slug]` (through
          `ProjectDetailFrame as="main"`) render their own, and none of those
          three fades, so none of them can ship a hidden [data-page-stack] for
          this net to uncover. The net is correct; the sentence describing its
          reach was not.

          THE COUNT READ "three of the site's six" UNTIL 2026-08-25, when
          `/projects` shipped inside `(chrome)` with its own PageStack. A
          paragraph whose entire job is to correct a never-true sentence about
          this net's reach then acquired the same defect — worth noticing more
          than the arithmetic is.

          Since 2026-08-22 `/about` passes `fade={false}` and is the only route
          that does, so the selector currently covers three live consumers —
          `/`, `/work` and, since 2026-08-25, `/projects` — and stays for the
          same insurance reason PageStack's own header gives.

          Framer Motion writes `initial` styles into the SERVER-RENDERED markup
          — that is how it avoids a flash of unstyled content — so
          `opacity: 0` genuinely ships in the HTML. If JS is blocked or
          hydration fails, that opacity is PERMANENT and every revealed section
          is a blank page.

          It is a sighted-no-JS failure specifically: the text stays in the DOM
          and in the accessibility tree, so screen readers and crawlers are
          unaffected and an audit would not catch it.

          Rule 2, [data-theme-toggle] — for the Ticket 11 theme toggle. With JS
          disabled the script above never runs, <html> keeps class="dark", and
          the site is dark and entirely correct — but the toggle is
          server-rendered markup, so it would render and do nothing: a DEAD
          CONTROL. `display: none` hides it AND removes it from the tab order
          and the accessibility tree, so keyboard focus cannot land on
          something inert.

          Rule 3, [data-intro-plate] — for the entry gate's two plates
          (AssetLoader's and Intro's). ADDED 2026-08-22, AND IT CLOSES A
          REGRESSION WE INTRODUCED. `IntroProvider` reads `shouldPlayIntro()`
          during PRERENDER, where every session flag is false by construction,
          so it answers "yes" and AssetLoader's `fixed inset-0 z-[60]` plate
          ships in the static HTML of every route inside `(chrome)` — `/`,
          `/work`, `/about` and, since 2026-08-25, `/projects`. With scripting
          disabled it never advances, never dissolves and never unmounts.
          MEASURED before this rule, 1440x900, scripting off: all three routes
          that existed then were ONE COLOUR — `#07090C` at 100.0% of the
          viewport, zero rows with content. `/projects` was not measured because
          it did not exist; it ships the same plate from the same provider, and
          this rule covers it by attribute rather than by route.

          `/work` AND `/about` RENDERED CORRECTLY WITH SCRIPTING DISABLED BEFORE
          THE INTRO'S GATE MOVED INTO THE `(chrome)` LAYOUT. Those two are ours,
          and this is the fix.

          `/` IS DIFFERENT AND IS FIXED HERE ANYWAY — SAY SO OUT LOUD. Home has
          shipped this blank plate for as long as the gate has existed, so on
          that route this is not a regression repair but a CHANGE OF SHIPPED
          BEHAVIOUR: a no-JS visitor to `/` used to get a near-black rectangle
          and now gets the page. It is the same defect with the same one-line
          fix, so special-casing `/` to stay broken would mean carrying a
          deliberate exception for no reason anyone could defend later.

          IT IS NOT RULE 2'S FAILURE MODE. Rule 2 hides a DEAD CONTROL —
          something interactive that would render and do nothing. This hides a
          DEAD COVER — something non-interactive that would render and never
          leave. `display: none` is the right verb for both, for different
          reasons: the toggle needs to leave the tab order, whereas the plates
          are already `aria-hidden="true"` and unfocusable, so here it is purely
          about paint. Two reasons, two rules.

          WHAT A NO-JS VISITOR GETS AFTER IT, verified with scripting disabled
          at 1440x900 on the three routes that existed when this was written:
          the fully laid-out dark page. Rule 1
          has already undone every `[data-reveal]` opacity, so `/work` shows its
          project section plus Experience, `/about` shows the mark, the
          paragraph, the three CTAs and the portrait, and both reach the reveal
          footer's real Contact links by scrolling.

          **`/work` USED TO SAY "all five cards with their covers" AND THAT IS
          NO LONGER TRUE** — the fanned deck replaced the two-column grid on
          2026-08-25, and a deck is five `<button>`s, not five `<a>`s. Read off
          the prerendered HTML: the fan ships all five cards (numeral, kicker,
          title — no covers at rest, by design) and all five pager numerals, so
          every project is NAMEABLE without JS and none is NAVIGABLE from the
          deck without it; the only project content in the markup is the mobile
          stack's front card, FOLIO, whose Details / GitHub / Live Site links
          are real anchors and do work. **The no-JS route to the other four is
          the `Browse as a list` exit to `/projects`**, which is a plain
          `<Link>` and lists all five as real anchors — so the page is not a
          dead end, but the exit is load-bearing in a way nobody designed it to
          be. Recorded, not fixed: making the deck degrade to five links is a
          design decision, not a comment correction.

          `/projects` AND THE REBUILT `/work` WERE ADDED TO THIS ON 2026-08-25,
          FROM THE PRERENDERED HTML RATHER THAN FROM A BROWSER, and the weaker
          method is stated rather than glossed. What was actually checked, off
          `.next/server/app/*.html`: every element carrying an inline
          `opacity: 0` on either page is either a `[data-reveal]` (7 on `/work`,
          0 on `/projects` — it renders no reveals at all) or sits inside
          `[data-intro-plate]`, so Rules 1 and 3 between them undo every hidden
          state that ships. `/projects` emits 5 real
          `<a href="/projects/<slug>">`, its two `Close` links to `/work` and
          the navbar's links, with no inline opacity on any of them; its strip
          rows' hover reveal is pure CSS (`lg:opacity-0
          lg:group-hover:opacity-100`) and needs no script. The one bare
          `opacity: 0` on each page is AssetLoader's progress row, inside the
          plate Rule 3 hides. **Nobody has yet LOOKED at either page in a
          browser with scripting off** — that is still outstanding, and it is
          the only thing that can catch a layout failure the markup does not
          predict.

          `/` shows the navbar
          and every section from Trajectory down — but its FIRST SCREEN is still
          near-empty, because the hero's particle field is a canvas drawn by JS
          and `HeroHeadline` is gated on `introDone`, which is false in the
          prerender. That is a separate, pre-existing gap and not this rule's to
          close; what this rule changes is that the rest of the page is now
          reachable at all.

          THERE IS EXACTLY ONE THEME WITHOUT JS, and it is dark. `lib/theme.ts`
          has no `prefers-color-scheme` path by design, so the OS preference
          changes nothing — measured both ways, identical pixels. "Both themes"
          is not a test that exists on this path.

          ONE HONEST CAVEAT ON [data-page-stack], because a net whose reason is
          wrong reads as verified forever. PageStack's FIRST appearance never
          animates — that is its module-scope guard, and it is what keeps the
          Intro from fading underneath itself — so `initial` is `false` on every
          prerendered route and, today, NO hidden state actually ships for this
          attribute. Verified by loading all three routes that existed then with
          scripting disabled, and re-verified 2026-08-25 against the prerendered
          HTML of all four: every one of them, `/projects` included, emits a
          bare `data-page-stack="true"` with no inline opacity.
          It is listed anyway because the guard is one line: loosen it
          and every route becomes a blank page for a no-JS visitor, silently.

          A SECOND CAVEAT, ON THE OTHER HALF OF [data-intro-plate], for the same
          reason. Intro.tsx's plate only ever mounts after AssetLoader reports
          ready, which requires JS — so it can never appear in a document that
          has none, and on that element the attribute is insurance rather than a
          live fix. AssetLoader's plate is the one that actually ships. Both
          carry it because the two are one gate and one surface, and an
          attribute on only one of them is the asymmetry that gets "tidied" the
          wrong way later.

          Each rule is keyed to a data attribute its component sets on its root
          (`data-reveal` on Reveal, `data-page-stack` on PageStack,
          `data-theme-toggle` on ThemeToggle, `data-intro-plate` on BOTH
          AssetLoader's plate and Intro's). RENAME ANY OF THEM AND THIS SELECTOR
          MUST CHANGE IN THE SAME COMMIT — this file's own convention, and the
          one failure mode it cannot detect for itself. All four cost nothing at
          runtime.

          Caveat, stated rather than glossed: <noscript> applies only when
          scripting is DISABLED. If JS is enabled but fails to load or throws,
          the toggle is visible and inert — and the entry plate is up forever,
          which is the same caveat with much higher stakes now that Rule 3
          exists. That is true of the whole app and is not this net's job to
          solve.
        */}
        <noscript
          // A static literal, so there is no injection surface — and this form
          // is deliberate rather than lazy. React special-cases <noscript> in
          // `shouldSetTextContent`, so its children are treated as TEXT and are
          // never reconciled on the client; the element form therefore also
          // works, but only by relying on that internal. Passing the CSS as a
          // string states the intent directly and removes any question of a
          // hydration mismatch between a server-rendered <style> element and a
          // client that parses noscript content as raw text.
          //
          // Verified present, verbatim, in the built HTML — not assumed.
          dangerouslySetInnerHTML={{
            __html:
              "<style>[data-reveal],[data-page-stack]{opacity:1!important;transform:none!important}[data-theme-toggle]{display:none!important}[data-intro-plate]{display:none!important}</style>",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        {/*
          THE DOCUMENT-ENTRY MARKER. Renders null, holds no state, one effect,
          no cleanup — see `components/intro/IntroSession.tsx` for the whole
          rule and for why it cannot live anywhere else.

          IT IS HERE, IN THE ROOT LAYOUT, BECAUSE IT HAS TO FIRE ON ROUTES THAT
          NEVER SHOW AN INTRO. The flag it writes means "a route has already
          committed in this document", and that is only true if something mounts
          on every one of them — `/projects/<slug>`, `not-found` and `error`
          included. Those three are exactly the routes that make it useful: a
          document that entered through a shared project link must NOT then play
          the Intro when the visitor clicks through to `/work`, and this is the
          only thing that knows the difference.

          It emits no DOM, so `<body>`'s flex children are unchanged.
        */}
        <IntroSessionMarker />
        <MotionProvider>
          <LenisProvider>{children}</LenisProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
