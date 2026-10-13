import { apiRequest } from "./client";

export async function getRoomMessages(roomId, page = 1, limit = 50) {
  return await apiRequest(`/rooms/${roomId}/messages?page=${page}&limit=${limit}`);
}

export async function sendRoomMessage(roomId, content, attachmentUrl) {
  return await apiRequest(`/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, attachmentUrl })
  });
}
