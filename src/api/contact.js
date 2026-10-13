import { apiRequest } from "./client";

export async function submitContactForm({ name, email, message }) {
  return await apiRequest("/contact", {
    method: "POST",
    body: JSON.stringify({ name, email, message })
  });
}
