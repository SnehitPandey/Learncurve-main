/**
 * Accent colour application.
 *
 * WHY THIS FILE EXISTS
 * The Settings page let you pick an accent colour, wrote it to `localStorage`
 * and to the server profile — and then nothing read it. `index.css` only ever
 * defined `--color-primary` inside `[data-theme="dark"]` and `:root`, so there
 * was no `data-accent` selector for the app to switch and the swatch click
 * changed nothing visible. Persisting a preference nothing consumes is worse
 * than not offering it: the UI looked like it worked.
 *
 * THE COLOURS LIVE IN CSS, NOT HERE
 * The actual rgb values are declared in `index.css` under `[data-accent="..."]`.
 * This module only owns which key is active and mirrors it onto `<html>`, so
 * there is exactly one definition of each colour and no JS/CSS pair to drift.
 */

/** The accents offered by Settings. Keep in sync with `ACCENTS` in settings.jsx. */
export const ACCENT_KEYS = ["teal", "sky", "indigo", "rose"];

export const DEFAULT_ACCENT = "teal";

const STORAGE_KEY = "accentColor";

/** True for a key we actually ship CSS for; anything else falls back to the default. */
export function isValidAccent(key) {
  return ACCENT_KEYS.includes(key);
}

/**
 * Mirror an accent key onto `<html data-accent>` so `index.css` picks it up.
 * Invalid or missing keys fall back to the default rather than leaving the
 * attribute off, because an absent attribute means "whatever `:root` says",
 * which would silently ignore the user's stored choice.
 */
export function applyAccent(key) {
  const resolved = isValidAccent(key) ? key : DEFAULT_ACCENT;
  document.documentElement.setAttribute("data-accent", resolved);
  localStorage.setItem(STORAGE_KEY, resolved);
  return resolved;
}

/**
 * Apply the stored accent during boot, before first paint of the app.
 *
 * Called once from `main.jsx`. Safe to call when nothing is stored — that is the
 * first-visit case, and it still sets the attribute so the CSS cascade is
 * deterministic from the very first render instead of depending on `:root`.
 */
export function initAccent() {
  return applyAccent(localStorage.getItem(STORAGE_KEY));
}