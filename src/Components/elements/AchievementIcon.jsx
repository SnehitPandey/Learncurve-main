import {
  Award,
  Brain,
  Compass,
  Crown,
  Flame,
  Footprints,
  Medal,
  Rocket,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
  Heart,
  Shield
} from "lucide-react";

/**
 * Render an achievement's icon.
 *
 * WHY THIS EXISTS
 *   `achievements.icon` stores a lucide-react icon NAME as a string -
 *   `seedDefaultAchievements` writes "Footprints", "Flame", "Crown",
 *   "Sparkles", "Compass", "Users". Both achievement UIs rendered that string as
 *   text (`{ach.icon}`), so every badge displayed the literal word "Footprints"
 *   in a 2xl span instead of a pictogram. The data was never wrong; it was
 *   never looked up.
 *
 * FALLBACK CHAIN - three cases, in order:
 *   1. A name we recognise -> the real lucide component.
 *   2. A value that is already an emoji -> print it. Someone can seed an emoji
 *      into the table and it should just work.
 *   3. Anything else (unknown name, null, empty) -> Trophy, never a blank gap.
 *
 * A lookup that can miss is the whole risk here, so the default is always a
 * visible icon rather than `undefined`.
 */

const ICONS = {
  Award,
  Brain,
  Compass,
  Crown,
  Flame,
  Footprints,
  Heart,
  Medal,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap
};

/**
 * Case/format-tolerant name lookup. Names arrive from a database column that
 * nothing validates, so "first_step" / "FirstStep" / "footprints" all have to
 * resolve rather than silently falling through to the default.
 */
function resolveIcon(name) {
  if (typeof name !== "string" || !name.trim()) return null;
  if (ICONS[name]) return ICONS[name];

  const key = name.trim().replace(/[\s_-]+/g, "").toLowerCase();
  const match = Object.keys(ICONS).find((k) => k.toLowerCase() === key);
  return match ? ICONS[match] : null;
}

// Emoji / symbol range check, written with explicit escapes. A looser form such
// as "any non-ASCII character" embeds literal control characters in the source
// and trips `no-control-regex` (and makes the file read as binary).
const isEmoji = (value) =>
  typeof value === "string" && /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(value);

export default function AchievementIcon({ icon, size = 20, className = "", locked = false }) {
  const Component = resolveIcon(icon);

  if (Component) {
    return (
      <Component
        size={size}
        className={className}
        // Locked badges stay legible but obviously dormant.
        style={locked ? { opacity: 0.45 } : undefined}
        aria-hidden="true"
      />
    );
  }

  if (isEmoji(icon)) {
    return (
      <span
        aria-hidden="true"
        style={{
          fontSize: size * 1.15,
          lineHeight: 1,
          filter: locked ? "grayscale(1)" : undefined
        }}
      >
        {icon}
      </span>
    );
  }

  return (
    <Trophy
      size={size}
      className={className}
      style={locked ? { opacity: 0.45 } : undefined}
      aria-hidden="true"
    />
  );
}