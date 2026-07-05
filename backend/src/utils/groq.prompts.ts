import type { RoadmapInput } from '../types/index.d';

const JSON_SYSTEM_PREFIX =
  'You are a helpful AI assistant. You must respond ONLY with valid JSON. Do not include any explanation, markdown, or text outside the JSON object.';

export function buildRoadmapPrompt(
  input: RoadmapInput
): { system: string; user: string } {
  // Determine phase count based on duration
  let phaseGuidance: string;
  if (input.durationWeeks <= 4) {
    phaseGuidance = 'Produce exactly 2 phases.';
  } else if (input.durationWeeks <= 8) {
    phaseGuidance = 'Produce exactly 3 phases.';
  } else {
    phaseGuidance = 'Produce exactly 4 phases.';
  }

  // Skill-level strategy
  let skillStrategy: string;
  switch (input.skillLevel) {
    case 'beginner':
      skillStrategy = 'Emphasise fundamentals and hands-on mini-projects. Build confidence before complexity.';
      break;
    case 'intermediate':
      skillStrategy = 'Emphasise integration and real-world patterns. Skip trivial basics.';
      break;
    case 'advanced':
      skillStrategy = 'Emphasise architecture, performance, and production concerns. Assume strong foundations.';
      break;
  }

  const system = `${JSON_SYSTEM_PREFIX}

ROLE: You are a friendly, encouraging, and highly experienced mentor and curriculum designer.
Your roadmaps are specific, practical, and project-driven. You avoid vague filler content.

TASK: Create a highly structured, project-driven learning roadmap.

CONTEXT:
- Goal: ${input.goal}
- Tech Stack / Topics: ${input.tags.join(', ')}
- Skill Level: ${input.skillLevel}
- Duration: ${input.durationWeeks} weeks
- Strategy: Focus on quick wins early. ${skillStrategy}

STRUCTURE RULES:
- ${phaseGuidance}
- 2-4 milestones per phase
- 3-5 topics per milestone
- Each topic must have estimatedMinutes between 30 and 120

FORBIDDEN:
- Generic topic names like "Introduction to X" or "Getting Started"
- Placeholder or made-up resource URLs
- Resources with URLs — omit the url field entirely, use empty string "" for url
- Vague descriptions like "learn about X" — be specific about WHAT and WHY

REQUIRED:
- Topic titles must describe a concrete skill or deliverable
  e.g. "Build a REST API with Express and JWT Auth" not "Learn Express"
- Descriptions must explain what the student will be able to DO after this topic
- Resources must only reference real, well-known platforms:
  MDN, freeCodeCamp, official docs, The Odin Project, CS50, Fireship

You must respond ONLY with valid JSON. No explanation, no markdown, no text outside the JSON.`;

  const user = `Create a learning roadmap with this JSON structure:
{
  "phases": [
    {
      "phaseId": "p1",
      "title": "...",
      "description": "...",
      "milestones": [
        {
          "milestoneId": "p1-m1",
          "title": "...",
          "description": "...",
          "topics": [
            {
              "topicId": "p1-m1-t1",
              "title": "...",
              "description": "...",
              "estimatedMinutes": 45,
              "resources": [
                { "title": "...", "url": "", "type": "article" }
              ]
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Phase IDs follow pattern: p1, p2, p3...
- Milestone IDs follow pattern: p1-m1, p1-m2, p2-m1...
- Topic IDs follow pattern: p1-m1-t1, p1-m1-t2...
- Resource types must be one of: "article", "video", "docs", "other"
- The total estimated time across all topics should fit within ${input.durationWeeks} weeks assuming 1-2 hours of study per day`;

  return { system, user };
}

export function buildQuizPrompt(
  topic: string,
  coveredMilestones: string[]
): { system: string; user: string } {
  const system = JSON_SYSTEM_PREFIX;

  const milestoneList = coveredMilestones
    .map((m, i) => `${i + 1}. ${m}`)
    .join('\n');

  const user = `Generate a quiz for the learning topic: "${topic}".

The quiz should cover ONLY these completed milestones:
${milestoneList}

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "questionId": "q1",
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 2
    }
  ]
}

Rules:
- Generate exactly 10 questions
- Each question has exactly 4 options
- correctIndex is 0-based (0, 1, 2, or 3)
- Difficulty distribution: 40% easy, 40% medium, 20% hard
- Questions should test understanding, not just memorization
- Question IDs follow pattern: q1, q2, q3... q10`;

  return { system, user };
}

export function buildFocusSummaryPrompt(
  topicTitle: string,
  topicDescription: string,
  durationMinutes: number
): { system: string; user: string } {
  const system = JSON_SYSTEM_PREFIX;

  const user = `A learner just completed a ${durationMinutes}-minute focus session on the following topic:

Title: "${topicTitle}"
Description: "${topicDescription}"

Generate a brief study summary. Return a JSON object with this exact structure:
{
  "summary": "A concise summary of what was likely covered (under 100 words)",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "nextStepSuggestion": "What the learner should study or practice next"
}

Rules:
- Summary must be under 100 words
- Include 3-5 key takeaways
- nextStepSuggestion should be actionable and specific`;

  return { system, user };
}
