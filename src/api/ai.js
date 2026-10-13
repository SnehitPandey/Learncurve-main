import { apiRequest } from "./client";

export async function fetchRoomSummary(data) {
  return await apiRequest("/ai/room-summary", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function generateRoadmap(payload) {
  return await apiRequest("/ai/generate-roadmap", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function regenerateModule(payload) {
  return await apiRequest("/ai/regenerate-module", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchStudyBudget(data) {
  return await apiRequest("/ai/budget", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function generateQuiz({ topic, questionCount }) {
  return await apiRequest("/ai/quiz", {
    method: "POST",
    body: JSON.stringify({ topic, questionCount })
  });
}
