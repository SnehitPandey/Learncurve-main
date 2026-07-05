import { groqRoadmapClient, groqQuizClient } from '../config/groq';
import { groqWithRetry } from '../utils/groq.retry';
import {
  buildRoadmapPrompt,
  buildQuizPrompt,
  buildFocusSummaryPrompt,
} from '../utils/groq.prompts';
import { AIServiceError } from '../utils/errors';
import { IRoadmap, IQuizQuestion } from '../models/room.model';
import type { RoadmapInput } from '../types/index.d';

export interface FocusSummaryResult {
  summary: string;
  keyTakeaways: string[];
  nextStepSuggestion: string;
}

export async function generateRoadmap(
  input: RoadmapInput
): Promise<IRoadmap> {
  const { system, user } = buildRoadmapPrompt(input);

  const completion = await groqWithRetry(groqRoadmapClient, (client) =>
    client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 8192,
    })
  );

  const raw = completion.choices[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.phases || !Array.isArray(parsed.phases)) {
      throw new Error('Missing phases array');
    }
    return parsed as IRoadmap;
  } catch {
    throw new AIServiceError('Groq returned malformed roadmap JSON');
  }
}

export async function generateQuiz(
  topic: string,
  coveredMilestones: string[]
): Promise<IQuizQuestion[]> {
  const { system, user } = buildQuizPrompt(topic, coveredMilestones);

  const completion = await groqWithRetry(groqQuizClient, (client) =>
    client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2048,
    })
  );

  const raw = completion.choices[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Missing questions array');
    }
    return parsed.questions as IQuizQuestion[];
  } catch {
    throw new AIServiceError('Groq returned malformed quiz JSON');
  }
}

export async function generateFocusSummary(
  topicTitle: string,
  topicDescription: string,
  durationMinutes: number
): Promise<FocusSummaryResult | null> {
  try {
    const { system, user } = buildFocusSummaryPrompt(
      topicTitle,
      topicDescription,
      durationMinutes
    );

    const completion = await groqWithRetry(groqQuizClient, (client) =>
      client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 512,
      })
    );

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    return {
      summary: parsed.summary ?? '',
      keyTakeaways: parsed.keyTakeaways ?? [],
      nextStepSuggestion: parsed.nextStepSuggestion ?? '',
    };
  } catch (err) {
    // Focus summary must never fail the session — return null on any error
    console.error('[AI] Focus summary generation failed:', err);
    return null;
  }
}

export async function generateText(
  prompt: string,
  maxTokens: number = 256
): Promise<string> {
  const completion = await groqWithRetry(groqQuizClient, (client) =>
    client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a concise learning assistant. Return only the requested output format.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: maxTokens,
    })
  );

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new AIServiceError('Groq returned an empty text response');
  }

  return raw;
}
