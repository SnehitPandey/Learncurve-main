import { apiRequest, saveAuth, clearAuth } from "./client";

export async function registerUser({ username, emailOrPhone, password }) {
  return await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, emailOrPhone, password })
  });
}

export async function verifyOtp({ emailOrPhone, code }) {
  return await apiRequest("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ emailOrPhone, code })
  });
}

export async function resendOtp({ emailOrPhone }) {
  return await apiRequest("/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ emailOrPhone })
  });
}

export async function completeUserProfile({ emailOrPhone, name, age, education }) {
  const data = await apiRequest("/auth/complete-profile", {
    method: "POST",
    body: JSON.stringify({ emailOrPhone, name, age, education })
  });
  if (data.success && data.token) {
    saveAuth(data);
  }
  return data;
}

export async function loginUser({ email, password, rememberMe }) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe })
  });
  if (data.success && data.token) {
    saveAuth(data);
  }
  return data;
}

export async function getMe() {
  return await apiRequest("/auth/me");
}

export function logoutUser() {
  clearAuth();
}

export async function googleLogin(payload) {
  const data = await apiRequest("/auth/google", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (data.success && data.token) {
    saveAuth(data);
  }
  return data;
}

export async function getGoogleAuthUrl(redirectTo) {
  const qs = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : "";
  return await apiRequest(`/auth/google/url${qs}`);
}

/**
 * Complete a direct Google sign-in.
 *
 * `code` is the authorization code Google sent back and `state` is the signed
 * value the backend minted when the flow started. The code is useless without
 * the client secret, so it is redeemed server-side and the browser never sees a
 * Google token — only the LearnCurve session this returns.
 *
 * Falls back to the Supabase path when `code` is absent, because a Supabase
 * sign-in still arrives here as a hash token instead (email/password sign-in
 * and any still-configured Supabase Google provider).
 */
export async function googleCodeAuth(code, state) {
  const data = await apiRequest("/auth/google/callback", {
    method: "POST",
    body: JSON.stringify({ code, state })
  });
  if (data.success && data.token) {
    saveAuth(data);
  }
  return data;
}

/**
 * Exchange the Supabase session token for a LearnCurve JWT.
 *
 * `accessToken` must be the RAW Supabase access token and nothing else. The
 * backend verifies it with Supabase and derives the account identity from the
 * verified response — it deliberately ignores any email/name/avatar in this
 * body, because a caller could otherwise mint a session for any email address.
 */
export async function supabaseSessionAuth(accessToken) {
  const data = await apiRequest("/auth/supabase/session", {
    method: "POST",
    body: JSON.stringify({ accessToken })
  });
  if (data.success && data.token) {
    saveAuth(data);
  }
  return data;
}

export async function forgotPassword(email) {
  return await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function resetPassword(token, newPassword) {
  return await apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword })
  });
}

