import { apiRequest } from "./client";

export async function createRoom(data) {
  return await apiRequest("/rooms", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function listRooms(filters = {}) {
  const params = new URLSearchParams();
  if (filters.query) params.append("query", filters.query);
  if (filters.skill) params.append("skill", filters.skill);
  if (filters.pace) params.append("pace", filters.pace);
  if (filters.difficulty) params.append("difficulty", filters.difficulty);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const qs = params.toString() ? `?${params.toString()}` : "";
  return await apiRequest(`/rooms${qs}`);
}

export async function getMyRooms() {
  return await apiRequest("/rooms/my-rooms");
}

export async function getRoomDetail(roomId) {
  return await apiRequest(`/rooms/${roomId}`);
}

export async function joinRoom(roomId) {
  return await apiRequest(`/rooms/${roomId}/join`, {
    method: "POST"
  });
}

export async function leaveRoom(roomId) {
  return await apiRequest(`/rooms/${roomId}/leave`, {
    method: "POST"
  });
}

export async function updateRoom(roomId, updates) {
  return await apiRequest(`/rooms/${roomId}`, {
    method: "PUT",
    body: JSON.stringify(updates)
  });
}

export async function deleteRoom(roomId) {
  return await apiRequest(`/rooms/${roomId}`, {
    method: "DELETE"
  });
}

export async function getRoomTasks(roomId) {
  return await apiRequest(`/rooms/${roomId}/tasks`);
}

// `timeSpentMinutes` is optional: callers that do not know the real duration must be
// able to omit it so the backend applies its own fallback instead of crediting a bogus
// flat value to the user's total study hours.
export async function toggleTask(roomId, taskId, completed, timeSpentMinutes) {
  const body = { completed };
  if (typeof timeSpentMinutes === "number" && Number.isFinite(timeSpentMinutes)) {
    body.timeSpentMinutes = timeSpentMinutes;
  }
  return await apiRequest(`/rooms/${roomId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function replanRoadmap(roomId, options = {}) {
  return await apiRequest(`/rooms/${roomId}/roadmap/replan`, {
    method: "POST",
    body: JSON.stringify(options)
  });
}
