import Groq from 'groq-sdk';

// Key 1 — used exclusively for roadmap generation (large, infrequent calls)
export const groqRoadmapClient = new Groq({
  apiKey: process.env.GROQ_API_KEY_ROADMAP,
  timeout: 45 * 1000, // 45 seconds per request
  maxRetries: 0, // We handle retries manually in groqWithRetry
});

// Key 2 — used for quiz generation + focus summaries (smaller, more frequent calls)
export const groqQuizClient = new Groq({
  apiKey: process.env.GROQ_API_KEY_QUIZ,
  timeout: 30 * 1000,
  maxRetries: 0,
});
