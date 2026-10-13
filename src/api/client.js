const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Memoized in-flight refresh so a burst of parallel 401s shares ONE refresh call
// instead of stampeding the backend with N identical requests.
let refreshPromise = null;

async function performRefresh(refreshToken) {
  try {
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });

    if (!refreshRes.ok) return null;

    const refreshData = await refreshRes.json();
    if (!refreshData?.success || !refreshData?.token) return null;

    localStorage.setItem("token", refreshData.token);

    // The backend reissues the refresh token too, bound to the current session
    // version. Adopting it is what actually keeps the binding: holding the old
    // one would let a later refresh silently un-revive a revoked session.
    if (refreshData.refreshToken) {
      localStorage.setItem("refreshToken", refreshData.refreshToken);
    }

    return refreshData.token;
  } catch (err) {
    console.warn("[API] Token refresh request failed:", err);
    return null;
  }
}

/**
 * Returns a fresh access token, or null when refreshing is impossible
 * (no refresh token, expired refresh token, network failure).
 * Concurrent callers share a single in-flight refresh.
 */
export function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return Promise.resolve(null);

  if (!refreshPromise) {
    refreshPromise = performRefresh(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // If payload is FormData, let browser set Content-Type with boundary
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Check if unauthorized and token might need refresh
    if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh-token")) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        // Retry the original request exactly once with the refreshed token
        const retryRes = await fetch(url, { ...options, headers });
        return await handleResponse(retryRes);
      }

      // Refresh is impossible or was rejected (e.g. the refresh token itself expired).
      // The server resolves those responses with { success: false } and HTTP 200, so the
      // failure must be handled here explicitly - otherwise the stale access token and
      // isLoggedIn="true" survive and every later request dead-ends on a 401.
      clearAuth();
    }

    return await handleResponse(response);
  } catch (error) {
    console.error(`[API] Error on ${endpoint}:`, error);
    throw error;
  }
}

function buildErrorMessage(response, data) {
  const raw =
    data?.error ??
    data?.message ??
    (typeof data === "string" && data.trim() ? data : undefined);

  if (typeof raw === "string") return raw;

  if (raw !== undefined && raw !== null) {
    try {
      return JSON.stringify(raw);
    } catch {
      return response.statusText || `Request failed with status ${response.status}`;
    }
  }

  return response.statusText || `Request failed with status ${response.status}`;
}

async function handleResponse(response) {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(buildErrorMessage(response, data));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function saveAuth({ token, refreshToken, user }) {
  if (token) localStorage.setItem("token", token);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  if (user) localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("isLoggedIn", "true");
  window.dispatchEvent(new Event("storage"));
}

/**
 * Merge freshly-fetched profile fields into the session blob.
 *
 * WHY THIS EXISTS
 *   Every surface that draws a profile picture — the sidebar, the dashboard hero,
 *   the study duo card, in-room chat — reads `getCurrentUser()`, which reads the
 *   `user` blob in localStorage. That blob was written ONCE, at sign-in, by
 *   `saveAuth`. Nothing ever refreshed it, so:
 *
 *     - uploading a new photo updated the Settings page (local state) and the
 *       database, but left the blob's `avatarUrl` empty, so every other surface
 *       stayed blank until the user happened to log out and back in;
 *     - signing in by any path whose response omitted `avatarUrl` produced a
 *       permanently blank avatar with no way to recover short of re-login.
 *
 *   This folds the server's current values over the blob and re-broadcasts, so
 *   long-lived components that already read it update without a reload.
 *
 * Merge, not replace: the blob also carries fields this endpoint does not return
 * (interests, session-only values), and losing them would break other screens.
 */
export function syncSessionUser(profile) {
  if (!profile || typeof profile !== "object") return null;

  let current = {};
  try {
    current = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    current = {};
  }

  // ABSENCE IS NOT A CLEAR.
  //
  // `PUT /api/users/profile` returns a partial user — name, bio, links — and
  // deliberately does NOT include `avatarUrl`. Treating that missing field as
  // empty (the obvious `profile.avatarUrl ?? ""`) wrote `avatarUrl: ""` into the
  // blob, so saving a bio silently erased a perfectly good profile picture from
  // the sidebar, dashboard and duo card at once.
  //
  // Only a field the server actually SENT may overwrite what we hold; otherwise
  // the existing value is kept.
  const incoming = profile.avatarUrl ?? profile.avatar_url;
  const avatarUrl =
    incoming === undefined || incoming === null ? (current.avatarUrl ?? current.avatar_url ?? "") : incoming;

  const merged = { ...current, ...profile, avatarUrl, avatar_url: avatarUrl };

  localStorage.setItem("user", JSON.stringify(merged));
  window.dispatchEvent(new Event("storage"));
  return merged;
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("isLoggedIn");
  window.dispatchEvent(new Event("storage"));
}