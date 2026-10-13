import { apiRequest } from "./client";

export async function getKanbanBoard(roomId) {
  return await apiRequest(`/rooms/${roomId}/kanban`);
}

export async function patchKanbanCard(roomId, cardId, { column, lane }) {
  return await apiRequest(`/rooms/${roomId}/kanban/cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify({ column, lane })
  });
}

export async function getRoadmap(roomId) {
  return await apiRequest(`/rooms/${roomId}/roadmap`);
}

export async function toggleRoadmapTask(roomId, taskId) {
  return await apiRequest(`/rooms/${roomId}/roadmap/tasks/${taskId}`, {
    method: "PATCH"
  });
}
