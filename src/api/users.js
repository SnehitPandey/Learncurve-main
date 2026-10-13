import { apiRequest, saveAuth, syncSessionUser } from "./client";

/**
 * Read the profile AND fold it into the session blob.
 *
 * Use this instead of `getUserProfile` wherever the result is shown to the user:
 * the surfaces that draw a profile picture read the blob, not this response, so
 * fetching without syncing leaves them showing whatever was captured at sign-in.
 *
 * Never throws for the sync path — a failed refresh must not break the caller.
 */
export async function getUserProfileAndSync() {
  const result = await apiRequest("/users/profile");
  const profile = result?.user || result;
  if (profile) syncSessionUser(profile);
  return result;
}

export async function getUserProfile() {
  return await apiRequest("/users/profile");
}

/**
 * Days this learner completed their full daily set, for the biweekly calendar.
 *
 * `duo: true` on a date means their study partner completed it too — the
 * different border. Computed server-side so the partner's own study pattern never
 * reaches the browser.
 *
 * Returns `{ days: [] }` on failure rather than throwing: a calendar with no
 * highlights is a perfectly good degraded state, and an error here should not
 * blank the dashboard.
 */
export async function getStudyDays() {
  try {
    const res = await apiRequest("/users/study-days");
    return { days: Array.isArray(res?.days) ? res.days : [] };
  } catch {
    return { days: [] };
  }
}

export async function updateUserProfile(data) {
  const result = await apiRequest("/users/profile", {
    method: "PUT",
    body: JSON.stringify(data)
  });
  // The session blob is the sidebar's and duo card's source of truth, so a name
  // or photo changed here must land in it too or it reverts on next mount.
  const profile = result?.user || result;
  if (profile) syncSessionUser(profile);
  return result;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const result = await apiRequest("/users/avatar", {
    method: "POST",
    body: formData
  });

  // The upload succeeded, so write the new URL into the session blob here rather
  // than leaving it to Settings' local state. Without this the Settings page
  // shows the new photo while the sidebar, dashboard and duo card — which read
  // the blob — keep showing the old blank one until the next full login.
  if (result?.avatarUrl) {
    syncSessionUser({ avatarUrl: result.avatarUrl });
  }

  return result;
}

export async function uploadCV(file) {
  const formData = new FormData();
  formData.append("cv", file);

  return await apiRequest("/users/cv", {
    method: "POST",
    body: formData
  });
}

export async function getCVDownloadUrl(username) {
  const endpoint = username ? `/users/${username}/cv` : "/users/cv";
  return await apiRequest(endpoint);
}

export async function updateUserSettings(settings) {
  return await apiRequest("/users/settings", {
    method: "PUT",
    body: JSON.stringify(settings)
  });
}

export async function changeUserPassword({ currentPassword, newPassword }) {
  const result = await apiRequest("/users/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword })
  });

  // Changing the password revokes every session, including this one. The backend
  // therefore hands back a freshly-signed token for the caller; adopt it so the
  // person who just changed their password is not logged out of the app on their
  // next click. Other devices/tabs keep their now-invalid token, which is the
  // intended effect. Absent when the backend has no token_version column.
  const reissued = result?.token;
  if (reissued) {
    saveAuth({ token: reissued });
  }

  return result;
}

export async function deleteUserAccount(currentPassword) {
  return await apiRequest("/users/account", {
    method: "DELETE",
    // The backend re-verifies the current password before it deletes anything,
    // so this must not be sent empty or the request 400s.
    body: JSON.stringify({ currentPassword })
  });
}

export async function getPublicUserProfile(username) {
  return await apiRequest(`/users/${username}/public`);
}

export async function deleteCV() {
  return await apiRequest("/users/cv", {
    method: "DELETE"
  });
}

export async function getUserAchievements() {
  return await apiRequest("/users/achievements");
}
