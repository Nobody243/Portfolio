/**
 * Theme persistence — ONE definition of the storage key, site-wide.
 *
 * Three consumers, and they cannot share code any other way:
 *   1. `app/layout.tsx` renders `themeInitScript` as a raw inline <script> in
 *      <head>. That script runs before <body> is parsed, i.e. before first
 *      paint, and therefore CANNOT import anything. It is a string built here
 *      from the key constant so the key exists in exactly one place.
 *   2. `components/ui/ThemeToggle.tsx` reads/writes via the helpers below.
 *   3. Any future control that needs the same key.
 *
 * NO "use client" — this module has no React and no module-level side effects,
 * so it is importable from a server component (the layout) and a client one
 * (the toggle) alike. Do not add a directive; it would drag the layout into a
 * client boundary for a string constant.
 *
 * WHY localStorage AND NOT A COOKIE. A cookie would let the server render the
 * correct class and kill the flash with no script at all — and it would opt
 * every route into DYNAMIC rendering, because reading cookies in the root
 * layout is a dynamic API. This site is statically prerendered end to end and
 * that is what makes it CDN-cacheable. Trading the entire static build for an
 * aesthetic preference is the wrong trade; a 130-byte pre-paint script is the
 * right one. `docs/02_TECHNICAL_ARCHITECTURE.md` records this.
 *
 * DARK IS THE DEFAULT FOR EVERY VISITOR. There is deliberately no
 * `prefers-color-scheme` detection anywhere in this file (see the COLOR-SCHEME
 * block in `app/globals.css`) — light is opt-in. That is a positioning
 * decision, not an oversight, and it is why "no stored value" resolves to dark
 * rather than to the OS setting.
 */

/**
 * NAMESPACED ON PURPOSE, not out of hygiene. `localhost:3000` is a single
 * shared origin across every project on this machine, so an unnamespaced
 * `theme` key genuinely collides with other apps in development and produces a
 * "theme changed by itself" bug that reproduces nowhere else.
 */
export const THEME_STORAGE_KEY = "saad-portfolio-theme";

/**
 * The only two strings ever written to storage, and the only two class names
 * ever put on <html>. Anything else read back is treated as absent.
 */
export type Theme = "light" | "dark";

/** The documented default. Used when nothing is stored, when storage throws,
 *  and when a stored value is not one of the two legal strings. */
export const DEFAULT_THEME: Theme = "dark";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Applies a theme to <html> by class, and this is the ONLY place classes are
 * written.
 *
 * REMOVE-THEN-ADD IS NOT OPTIONAL. `app/globals.css` states it: the two classes
 * are mutually exclusive. If both are present, `html.light` (0,1,1) still wins
 * for token VALUES — so the page looks right — but every `dark:` utility in the
 * codebase keeps matching, because the variant is
 * `&:where(.dark, .dark *)`. That is a silent, looks-fine-in-review failure,
 * and it would break this ticket's own label swap first.
 *
 * Touches the DOM only, never storage — the two are separated so the `storage`
 * event listener can apply a theme WITHOUT writing it back and starting a loop.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.remove(theme === "light" ? "dark" : "light");
  root.classList.add(theme);
}

/**
 * The theme currently on <html>. The DOM CLASS IS THE SINGLE SOURCE OF TRUTH —
 * `ThemeToggle` holds no React state, so there is nothing that can disagree
 * with this. Absence of `.dark` means light, which is safe because
 * `applyTheme` and the init script both guarantee exactly one of the two.
 */
export function readAppliedTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Reads the stored preference. Returns `null` for absent, corrupted, or
 * unreadable — the caller decides, and every caller decides `dark`.
 *
 * DELIBERATELY DOES NOT REPAIR STORAGE. Writing `"dark"` back on a corrupt read
 * would mask the bug that produced it, and would create a stored preference for
 * a visitor who never chose one. Reading is a read.
 *
 * try/catch is mandatory: `localStorage` THROWS on access (not returns null) in
 * Safari private browsing, in partitioned or blocked third-party contexts, and
 * when the quota is exhausted.
 *
 * NOTE — `ThemeToggle` DELIBERATELY DOES NOT CALL THIS, and that is not an
 * oversight to be tidied up. The toggle reads the class on <html> instead
 * (`readAppliedTheme`), because the class is what the init script and the
 * cross-tab listener both write, and reading storage instead would reintroduce
 * a second source of truth that can disagree with what is on screen. This is
 * the module's read API for anything that genuinely needs the PREFERENCE (as
 * opposed to the current state) — it has no consumer today.
 */
export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Persists a preference. A throw here degrades to "works for this session,
 * not remembered" — never to a broken control.
 */
export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* Storage unavailable. The class is already applied; only persistence is
       lost. Silently, on purpose: a console error every click for a visitor in
       private browsing is noise about a thing that is working as designed. */
  }
}

/**
 * THE ANTI-FLASH SCRIPT. Rendered verbatim into <head> by `app/layout.tsx` as a
 * classic inline <script> — no `async`, no `defer`, not `type="module"` — which
 * the parser executes SYNCHRONOUSLY, before <body> exists and therefore before
 * the first paint.
 *
 * WHY IT IS NEEDED AT ALL: the served HTML is static on all routes and always
 * carries `class="dark"`. Without this, a returning light-mode visitor gets a
 * full near-black paint and then a flip to warm-white when React hydrates —
 * hundreds of milliseconds later on a throttled connection. That is exactly the
 * flash Ticket 11's acceptance criterion forbids, and it is a
 * returning-visitor-only bug, so it is invisible during ordinary development.
 *
 * WHAT IT DOES, precisely:
 *   - stored value is "light"  -> remove `dark`, add `light`.
 *   - anything else (absent, garbage, or a thrown read) -> NOTHING. The server
 *     already shipped the correct class. Doing nothing in the common case makes
 *     this a no-op for every first-time visitor.
 *
 * The try/catch matters more here than anywhere else in this file: an uncaught
 * throw aborts the script before it sets the class, which breaks the exact
 * anti-flash it exists for.
 *
 * `next/script` is NOT used. `strategy="beforeInteractive"` is injected and
 * hydration-managed rather than emitted verbatim in document order, and
 * document order before <body> is the single property this depends on.
 *
 * INJECTION SURFACE: none. The only interpolation is `THEME_STORAGE_KEY`, an
 * author-controlled literal in this file. No user input, no URL data, and the
 * string contains no `<` so it cannot terminate the script element early.
 *
 * Written on one line and hand-minified because it ships in the document on
 * every request, uncompressed by the bundler.
 */
export const themeInitScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light"){var d=document.documentElement;d.classList.remove("dark");d.classList.add("light")}}catch(e){}`;
