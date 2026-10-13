import { apiRequest } from "./client";

export async function getRoomQuizzes(roomId) {
  return await apiRequest(`/rooms/${roomId}/quizzes`);
}

export async function submitQuizAnswers(roomId, quizId, answers) {
  return await apiRequest(`/rooms/${roomId}/quizzes/${quizId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers })
  });
}

export const submitQuiz = submitQuizAnswers;

/**
 * Ask for a test covering what the learner covered TODAY.
 *
 * Tests are not procreated — a room starts with none, and this is the only way to
 * get one. The backend resolves today's topic from the room's own roadmap, so a
 * week-5 learner gets that week's material rather than the subject's opener.
 */
export async function createTestForToday(roomId) {
  const res = await apiRequest(`/rooms/${roomId}/quizzes`, { method: "POST" });
  return res?.quiz;
}

/**
 * The learner's own results from the last 15 days.
 *
 * Only the requesting user's attempts come back, and the window is applied
 * server-side — the client cannot widen it.
 */
export async function getPastResults(roomId) {
  const res = await apiRequest(`/rooms/${roomId}/quizzes/results`);
  return { results: Array.isArray(res?.results) ? res.results : [], windowDays: res?.windowDays || 15 };
}

