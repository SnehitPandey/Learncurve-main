/**
 * The signed-in user, read from the session blob the API writes on sign-in.
 *
 * WHY IT IS SHARED
 *   `getCurrentUser` and `getInitials` were private to friendsSection, so the
 *   sidebar had no way to read the learner's name and fell back to a generic
 *   person icon for every account — including ones with a real profile photo.
 *   Two components, one session, one place to read it.
 */

/** Up to two letters, safe on an empty or missing name. */
export const getInitials = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .join("")
    .slice(0, 2) || "?";

/**
 * Current user from localStorage. Always returns an object — a corrupt or absent
 * blob yields the default identity rather than throwing.
 *
 * `avatarUrl` is carried through so any surface can show the real photo. The
 * session stores it as `avatarUrl`; `avatar_url` is accepted as a fallback
 * because older sessions were written before the rename.
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      const name = parsed.name || parsed.username || "Learner";
      return {
        id: parsed.id || "current-user",
        name,
        avatarUrl: parsed.avatarUrl || parsed.avatar_url || "",
        initials: getInitials(name),
        color: "bg-primary/80",
        online: true,
        studying: parsed.interests?.[0] || "Active Study",
        studiedToday: false
      };
    }
  } catch {
    // Corrupt/absent localStorage — fall through to the default identity.
  }
  return {
    id: "current-user",
    name: "Learner",
    avatarUrl: "",
    initials: "LE",
    color: "bg-primary/80",
    online: true,
    studying: "Active Study",
    studiedToday: false
  };
}
