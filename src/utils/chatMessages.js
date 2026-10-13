/**
 * Identity rules for room chat messages, shared by the two chat surfaces
 * (the room overlay and the chat modal).
 *
 * WHY THIS EXISTS
 *   A sent message is optimistically appended under a locally generated id and
 *   then confirmed by the server under a different one. Because those ids never
 *   match, a `prev.some(m => m.id === incoming.id)` check cannot see that the
 *   two rows are the same message, and the sender ends up looking at their own
 *   message two or three times.
 *
 *   The overlay was the worst case: it appended the optimistic row and never
 *   reconciled it at all, so the local copy outlived the reload that added the
 *   server's copy. Two independent histories, same sentence.
 *
 * A message is the same message when either side can identify it:
 *   - the server id matches (the common case, once both rows carry one), or
 *   - it is the same author saying the same thing, while one of them is still
 *     the unconfirmed local copy. Matching on content alone would merge two
 *     genuine consecutive "ok" replies, so this only ever collapses a local row
 *     against a confirmed one.
 */

let seq = 0;

/** Collision-free local id — `Date.now()` alone repeats within a millisecond. */
export function createLocalId() {
  return `local-${Date.now()}-${++seq}`;
}

const isLocal = (m) => typeof m?.id === "string" && m.id.startsWith("local-");

/**
 * Collapse a confirmed message onto the row that already represents it.
 *
 * Returns the new list; the input is never mutated.
 */
export function reconcileMessage(prev, incoming) {
  if (!incoming) return prev;

  // Already present by server id — nothing to do.
  if (incoming.id && prev.some((m) => m.id === incoming.id)) return prev;

  const sameAuthor = (m) => !!m.isCurrentUser === !!incoming.isCurrentUser;
  const withoutSupersededLocal = prev.filter(
    (m) => !(isLocal(m) && sameAuthor(m) && m.message === incoming.message)
  );

  // The local row is being replaced by the confirmed one: swap in place so the
  // message does not jump to the bottom of the list.
  const localIndex = prev.findIndex(
    (m) => isLocal(m) && sameAuthor(m) && m.message === incoming.message
  );
  if (localIndex !== -1) {
    const next = [...prev];
    next[localIndex] = { ...incoming, pending: false };
    return next;
  }

  return [...withoutSupersededLocal, incoming];
}

/**
 * Replace a local row with the server's version once the POST returns, and drop
 * any unconfirmed copy the confirmed message supersedes.
 */
export function confirmLocalMessage(prev, localId, saved, fallback) {
  if (!saved || (!saved.id && !saved._id)) {
    return prev.map((m) => (m.id === localId ? { ...m, pending: false } : m));
  }

  const confirmed = {
    id: saved.id || saved._id,
    user: "You",
    message: saved.content || fallback,
    timestamp: saved.createdAt
      ? new Date(saved.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isCurrentUser: true,
    pending: false
  };

  const next = prev.map((m) => (m.id === localId ? confirmed : m));
  // A socket echo may already have delivered this message under the server id,
  // in which case the row we just confirmed IS that echo — keep exactly one.
  return next.filter(
    (m, i) => m.id !== confirmed.id || i === next.findIndex((x) => x.id === confirmed.id)
  );
}
