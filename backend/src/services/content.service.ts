import { generateText } from './ai.service';

export interface StudyResource {
  type: 'documentation';
  title: string;
  url: string;
}

export interface TopicContentResult {
  content: string;
  codeExample: string;
  studyResources: StudyResource[];
}

const DOC_LINKS: Array<{ match: RegExp; title: string; url: string }> = [
  {
    match: /\bjavascript\b.*\bvariables\b|\bvariables\b.*\bjavascript\b|\bjs\s+variables\b/i,
    title: 'JavaScript Variables - MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Variables',
  },
  {
    match: /\bjava\b.*\bvariables\b|\bvariables\b.*\bjava\b/i,
    title: 'Java Variables - Oracle Docs',
    url: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/variables.html',
  },
  {
    match: /\bjsx\b/i,
    title: 'Writing Markup with JSX - React Docs',
    url: 'https://react.dev/learn/writing-markup-with-jsx',
  },
  {
    match: /\breact\b/i,
    title: 'React Learn - Official Docs',
    url: 'https://react.dev/learn',
  },
  {
    match: /\bhtml\b/i,
    title: 'HTML Basics - MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics',
  },
  {
    match: /\bcss\b/i,
    title: 'CSS First Steps - MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps',
  },
];

function fallbackDocs(topicTitle: string): StudyResource[] {
  const match = DOC_LINKS.find((entry) => entry.match.test(topicTitle));
  if (match) {
    return [{ type: 'documentation', title: match.title, url: match.url }];
  }

  return [
    {
      type: 'documentation',
      title: 'MDN Learn Web Development',
      url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    },
    {
      type: 'documentation',
      title: 'Oracle Java Tutorials',
      url: 'https://docs.oracle.com/javase/tutorial/',
    },
  ];
}

export async function generateTopicContent(
  topicTitle: string,
  roadmapContext?: string
): Promise<TopicContentResult> {
  const docs = fallbackDocs(topicTitle);

  const prompt = [
    'Return valid JSON only with keys: content, codeExample, studyResources.',
    'Do not include markdown fences.',
    'studyResources must be an array of 1 to 3 items and EVERY item must have type="documentation".',
    'Do not include YouTube/video links. Use direct official documentation links only.',
    `Topic: ${topicTitle}`,
    `Roadmap context: ${roadmapContext ?? ''}`,
    'content: 120-180 words, concise and practical.',
    'codeExample: short realistic snippet matching the topic language.',
  ].join('\n');

  try {
    const raw = await generateText(prompt, 700);
    const parsed = JSON.parse(raw);

    const resources = Array.isArray(parsed.studyResources)
      ? parsed.studyResources
          .filter((r: any) => r && typeof r.url === 'string' && /^https?:\/\//i.test(r.url))
          .map((r: any) => ({
            type: 'documentation' as const,
            title: String(r.title || 'Documentation'),
            url: String(r.url),
          }))
      : [];

    return {
      content:
        typeof parsed.content === 'string' && parsed.content.trim().length > 0
          ? parsed.content
          : `${topicTitle} is an important concept. Mastering it helps you write clearer, safer, and more maintainable code in real projects.`,
      codeExample:
        typeof parsed.codeExample === 'string' && parsed.codeExample.trim().length > 0
          ? parsed.codeExample
          : `// ${topicTitle}\nfunction practiceTopic() {\n  // Implement the core idea here\n}`,
      studyResources: resources.length > 0 ? resources : docs,
    };
  } catch {
    return {
      content: `${topicTitle} is an important concept. Focus on the core idea, practice with small examples, and then apply it in your project context to build confidence.`,
      codeExample: `// ${topicTitle}\nfunction practiceTopic() {\n  // Implement the core idea here\n}`,
      studyResources: docs,
    };
  }
}
