import { apiRequest } from "./client";

export async function getDuoStatus() {
  return await apiRequest("/duo/status");
}

export async function getDuoShareLink() {
  return await apiRequest("/duo/share-link", {
    method: "POST"
  });
}

export async function connectDuo(inviteLinkOrCode) {
  return await apiRequest("/duo/connect", {
    method: "POST",
    body: JSON.stringify({ inviteLinkOrCode })
  });
}

export async function disconnectDuo() {
  return await apiRequest("/duo/disconnect", {
    method: "DELETE"
  });
}

export async function logDuoActivity() {
  return await apiRequest("/duo/activity", {
    method: "POST"
  });
}
