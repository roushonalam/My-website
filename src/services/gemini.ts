import { GoogleGenAI, Type, type Content } from '@google/genai';
import {
  DEFAULT_MODEL_ID,
  FALLBACK_MODELS,
  SYSTEM_PROMPT,
} from '../constants/prompts';
import {
  QuizResponseSchema,
  StudyHubResponseSchema,
  StudyPlanResponseSchema,
  type BilingualError,
  type ChatMessage,
  type EducationLevel,
  type ExplanationFormat,
  type ModelOption,
  type OutputLanguage,
  type QuizDifficulty,
  type QuizResponse,
  type StudyHubResponse,
  type StudyPlanResponse,
  type Subject,
} from '../types';
import {
  getApiKey,
  getCachedModels,
  getSettings,
  setCachedModels,
} from './storage';

const REQUEST_TIMEOUT_MS = 45_000;

export class GeminiServiceError extends Error {
  public readonly bilingual: BilingualError;

  constructor(bilingual: BilingualError) {
    super(bilingual.messageEn);
    this.name = 'GeminiServiceError';
    this.bilingual = bilingual;
  }
}

function makeError(
  code: string,
  messageEn: string,
  messageBn: string,
  retryable = true
): GeminiServiceError {
  return new GeminiServiceError({
    code,
    messageEn,
    messageBn,
    retryable,
  });
}

function getClient(overrideKey?: string): GoogleGenAI {
  const apiKey = (overrideKey ?? getApiKey()).trim();
  if (!apiKey) {
    throw makeError(
      'MISSING_KEY',
      'No Google AI Studio API key found. Please add your API key in Settings.',
      'কোনো Google AI Studio API Key পাওয়া যায়নি। অনুগ্রহ করে Settings পেজে গিয়ে আপনার API Key যুক্ত করুন।',
      false
    );
  }
  return new GoogleGenAI({ apiKey });
}

function supportsTemperatureParam(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  // Gemini 4 series models do not accept deprecated sampling parameters like temperature
  if (lower.startsWith('gemini-4-')) {
    return false;
  }
  return true;
}

function buildConfigWithOptionalTemperature(
  modelId: string,
  temperature: number,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  if (supportsTemperatureParam(modelId)) {
    return { ...extra, temperature };
  }
  return extra;
}

async function withTimeout<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        makeError(
          'TIMEOUT',
          'The AI request timed out. Please try again in a moment.',
          'অনুরোধটি সম্পন্ন হতে বেশি সময় লাগছে (Timeout)। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।',
          true
        )
      );
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function mapGeminiError(err: unknown): BilingualError {
  if (err instanceof GeminiServiceError) {
    return err.bilingual;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      code: 'NETWORK_OFFLINE',
      messageEn: 'You appear to be offline. Check your internet connection and retry.',
      messageBn: 'আপনার ইন্টারনেট সংযোগ বিচ্ছিন্ন মনে হচ্ছে। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
      retryable: true,
    };
  }

  const rawMsg =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'Unknown error';
  const lower = rawMsg.toLowerCase();

  const statusMatch = rawMsg.match(/\b(400|401|403|404|429|500|503)\b/);
  const statusCode = statusMatch ? Number(statusMatch[1]) : undefined;

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('invalid api key') ||
    statusCode === 401
  ) {
    return {
      code: 'INVALID_KEY',
      messageEn:
        'Your API key appears invalid. Please verify it in Google AI Studio and update it in Settings.',
      messageBn:
        'আপনার API Key-টি সঠিক নয়। অনুগ্রহ করে Google AI Studio থেকে Key যাচাই করে Settings পেজে আপডেট করুন।',
      retryable: false,
    };
  }

  if (
    lower.includes('permission_denied') ||
    lower.includes('referrer') ||
    statusCode === 403
  ) {
    return {
      code: 'PERMISSION_DENIED',
      messageEn:
        'Access denied (403). Your API key may lack permissions or be restricted for this domain.',
      messageBn:
        'অনুমতি পাওয়া যায়নি (403)। আপনার API Key-এর পারমিশন বা ডোমেইন রেস্ট্রিকশন পরীক্ষা করুন।',
      retryable: false,
    };
  }

  if (
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    statusCode === 429
  ) {
    return {
      code: 'RATE_LIMIT',
      messageEn:
        'Rate limit or quota reached (429). Please wait 20–30 seconds and try again.',
      messageBn:
        'API ব্যবহারের সীমা অতিক্রম করেছে (429 Rate Limit)। অনুগ্রহ করে ২০-৩০ সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।',
      retryable: true,
    };
  }

  if (
    lower.includes('not_found') ||
    lower.includes('is not found') ||
    statusCode === 404
  ) {
    return {
      code: 'MODEL_NOT_FOUND',
      messageEn:
        'The selected model is unavailable for your key. Please choose another model in Settings.',
      messageBn:
        'নির্বাচিত মডেলটি আপনার API Key-এর জন্য উপলব্ধ নয়। অনুগ্রহ করে Settings থেকে অন্য একটি মডেল নির্বাচন করুন।',
      retryable: false,
    };
  }

  if (
    lower.includes('safety') ||
    lower.includes('blocked') ||
    lower.includes('recitation')
  ) {
    return {
      code: 'SAFETY_BLOCK',
      messageEn:
        'The response was blocked by safety filters. Please rephrase your topic clearly for educational use.',
      messageBn:
        'নিরাপত্তা নীতির কারণে উত্তরটি প্রদর্শন করা যায়নি। অনুগ্রহ করে শিক্ষামূলকভাবে বিষয়টি ভিন্নভাবে লিখুন।',
      retryable: true,
    };
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('load failed')
  ) {
    return {
      code: 'NETWORK_ERROR',
      messageEn:
        'Network request to Google Gemini failed. Check your connection or browser extensions and retry.',
      messageBn:
        'Google Gemini সার্ভারে সংযোগ স্থাপন করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
      retryable: true,
    };
  }

  if (statusCode === 400) {
    return {
      code: 'BAD_REQUEST',
      messageEn:
        'The request could not be processed (400). Try simplifying your input or switching models in Settings.',
      messageBn:
        'অনুরোধটি প্রক্রিয়া করা যায়নি (400)। অনুগ্রহ করে ইনপুট সহজ করুন অথবা Settings থেকে মডেল পরিবর্তন করুন।',
      retryable: true,
    };
  }

  return {
    code: 'AI_ERROR',
    messageEn:
      'Something went wrong while contacting Gemini AI. Please try again.',
    messageBn:
      'Gemini AI থেকে উত্তর আনতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    retryable: true,
  };
}

function stripJsonCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function extractTextAndCheckSafety(response: {
  text?: string;
  candidates?: Array<{ finishReason?: string }>;
}): string {
  const finishReason = response.candidates?.[0]?.finishReason;
  if (
    finishReason &&
    ['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII'].includes(
      finishReason
    )
  ) {
    throw makeError(
      'SAFETY_BLOCK',
      'The response was filtered by AI safety policies. Please rephrase your educational prompt.',
      'AI নিরাপত্তা নীতির কারণে উত্তরটি ফিল্টার করা হয়েছে। অনুগ্রহ করে প্রশ্নটি অন্যভাবে লিখুন।',
      true
    );
  }
  const text = response.text?.trim();
  if (!text) {
    throw makeError(
      'EMPTY_RESPONSE',
      'Gemini returned an empty response. Please try again.',
      'AI থেকে কোনো উত্তর পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
      true
    );
  }
  return text;
}

function isDeprecatedOrNonTextModel(id: string): boolean {
  const lower = id.toLowerCase();
  const bannedFragments = [
    'gemini-1.0',
    'gemini-1.5',
    'gemini-2.0',
    'gemini-pro-vision',
    'embedding',
    'imagen',
    'veo',
    'lyria',
    'tts',
    'transcribe',
    'live',
    'aqa',
    'bisect',
    '-image',
    'nano-banana',
    'audio',
  ];
  if (lower === 'gemini-pro') return true;
  return bannedFragments.some((frag) => lower.includes(frag));
}

function classifyModelTier(id: string, displayName: string): 'Flash (fast)' | 'Pro (high quality)' {
  const combined = `${id} ${displayName}`.toLowerCase();
  if (
    combined.includes('flash') ||
    combined.includes('hydrogen') ||
    combined.includes('lite')
  ) {
    return 'Flash (fast)';
  }
  return 'Pro (high quality)';
}

export async function listModels(
  overrideKey?: string,
  forceRefresh = false
): Promise<{ models: ModelOption[]; fromLiveApi: boolean }> {
  const apiKey = (overrideKey ?? getApiKey()).trim();
  if (!apiKey) {
    return { models: FALLBACK_MODELS, fromLiveApi: false };
  }

  if (!forceRefresh) {
    const cached = getCachedModels();
    if (cached && cached.length > 0) {
      return { models: cached, fromLiveApi: true };
    }
  }

  try {
    const ai = getClient(apiKey);
    const pager = await withTimeout(ai.models.list({ config: { pageSize: 50 } }), 15_000);
    const collected: ModelOption[] = [];
    const seen = new Set<string>();

    for await (const model of pager) {
      const rawName = model.name ?? '';
      const id = rawName.replace(/^models\//, '').trim();
      if (!id || seen.has(id)) continue;

      const actions = model.supportedActions;
      const supportsGenerate =
        !actions || actions.length === 0 || actions.includes('generateContent');

      if (!supportsGenerate) continue;
      if (!id.toLowerCase().includes('gemini')) continue;
      if (isDeprecatedOrNonTextModel(id)) continue;

      seen.add(id);
      const displayName = model.displayName?.trim() || id;
      collected.push({
        id,
        displayName,
        tier: classifyModelTier(id, displayName),
        description: model.description?.trim(),
      });

      if (collected.length >= 25) break;
    }

    if (collected.length === 0) {
      return { models: FALLBACK_MODELS, fromLiveApi: false };
    }

    // Sort Flash models first, then Pro models
    collected.sort((a, b) => {
      if (a.tier !== b.tier) {
        return a.tier === 'Flash (fast)' ? -1 : 1;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    setCachedModels(collected);
    return { models: collected, fromLiveApi: true };
  } catch {
    return { models: FALLBACK_MODELS, fromLiveApi: false };
  }
}

export async function testConnection(
  overrideKey?: string,
  modelId?: string
): Promise<{ ok: true; modelUsed: string; latencyMs: number }> {
  const started = performance.now();
  const ai = getClient(overrideKey);
  const settings = getSettings();
  const model = (modelId || settings.model || DEFAULT_MODEL_ID).trim();

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model,
        contents: 'Reply with a single word: OK',
      }),
      20_000
    );
    extractTextAndCheckSafety(response);
    return {
      ok: true,
      modelUsed: model,
      latencyMs: Math.round(performance.now() - started),
    };
  } catch (err) {
    throw new GeminiServiceError(mapGeminiError(err));
  }
}

export interface ExplainTopicParams {
  subject: Subject;
  level: EducationLevel;
  topic: string;
  format: ExplanationFormat;
  language: OutputLanguage;
}

export async function explainTopic(
  params: ExplainTopicParams
): Promise<StudyHubResponse> {
  const cleanTopic = params.topic.trim();
  if (!cleanTopic) {
    throw makeError(
      'EMPTY_INPUT',
      'Please enter a topic or question to explain.',
      'অনুগ্রহ করে ব্যাখ্যা করার জন্য একটি টপিক বা প্রশ্ন লিখুন।',
      false
    );
  }

  const ai = getClient();
  const settings = getSettings();

  const languageDirective =
    params.language === 'Bengali'
      ? 'Write all explanations in clear, natural Bengali (বাংলা). Technical terms may include English in parentheses for clarity.'
      : params.language === 'English'
        ? 'Write all explanations in clear, encouraging academic English.'
        : 'Write bilingually: explain clearly in Bengali (বাংলা) paired with key English academic terms and concise English summaries so both languages reinforce understanding.';

  const formatDirective =
    params.format === 'Short Summary'
      ? 'Keep each section concise, crisp, and high-yield (short summary style).'
      : params.format === 'Flashcard Points'
        ? 'Format points as crisp, memorable flashcard-style Q&A or bite-sized revision bullets with bold key terms.'
        : 'Provide a thorough, step-by-step detailed explanation with clear examples and markdown formatting.';

  const prompt = `Explain the following study topic for a student.
Subject: ${params.subject}
Academic Level: ${params.level}
Requested Format: ${params.format}
Language Requirement: ${languageDirective}
Style Requirement: ${formatDirective}

Student Topic / Question:
"""
${cleanTopic}
"""

Use Markdown formatting inside string fields where helpful (bullet points, bold emphasis, inline code or fenced code blocks for programming/math).`;

  const maxAttempts = 3;
  let lastParseError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: settings.model || DEFAULT_MODEL_ID,
          contents: prompt,
          config: buildConfigWithOptionalTemperature(
            settings.model || DEFAULT_MODEL_ID,
            settings.temperature,
            {
              systemInstruction: SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Clear topic title',
                  },
                  simpleExplanation: {
                    type: Type.STRING,
                    description: 'Easy-to-grasp overview in simple language (Markdown)',
                  },
                  conceptDefinition: {
                    type: Type.STRING,
                    description: 'Formal yet clear concept definition (Markdown)',
                  },
                  realWorldAnalogy: {
                    type: Type.STRING,
                    description: 'Relatable everyday analogy (Markdown)',
                  },
                  practicalExamples: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2 to 4 concrete worked examples or code snippets (Markdown)',
                  },
                  importantPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '3 to 6 exam-focused key takeaways (Markdown)',
                  },
                  summary: {
                    type: Type.STRING,
                    description: 'Memorable wrap-up summary (Markdown)',
                  },
                },
                required: [
                  'title',
                  'simpleExplanation',
                  'conceptDefinition',
                  'realWorldAnalogy',
                  'practicalExamples',
                  'importantPoints',
                  'summary',
                ],
              },
            }
          ),
        })
      );

      const rawText = extractTextAndCheckSafety(response);
      const cleaned = stripJsonCodeFences(rawText);
      const parsed = JSON.parse(cleaned);
      return StudyHubResponseSchema.parse(parsed);
    } catch (err) {
      if (err instanceof GeminiServiceError && !err.bilingual.retryable) {
        throw err;
      }
      const mapped = mapGeminiError(err);
      if (
        mapped.code === 'INVALID_KEY' ||
        mapped.code === 'PERMISSION_DENIED' ||
        mapped.code === 'RATE_LIMIT' ||
        mapped.code === 'MODEL_NOT_FOUND' ||
        mapped.code === 'NETWORK_OFFLINE'
      ) {
        throw new GeminiServiceError(mapped);
      }
      lastParseError = err;
    }
  }

  if (lastParseError instanceof GeminiServiceError) {
    throw lastParseError;
  }

  throw makeError(
    'INVALID_JSON',
    'Could not structure the AI explanation cleanly after retries. Please try again.',
    'AI থেকে তথ্যগুলো সঠিকভাবে সাজানো যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
    true
  );
}

export interface GenerateQuizParams {
  subject: Subject;
  topic: string;
  difficulty: QuizDifficulty;
  count: 5 | 10;
}

export async function generateQuiz(
  params: GenerateQuizParams
): Promise<QuizResponse> {
  const cleanTopic = params.topic.trim();
  if (!cleanTopic) {
    throw makeError(
      'EMPTY_INPUT',
      'Please enter a chapter or topic for the quiz.',
      'কুইজ তৈরি করতে অনুগ্রহ করে একটি অধ্যায় বা টপিক লিখুন।',
      false
    );
  }

  const ai = getClient();
  const settings = getSettings();

  const prompt = `Generate a multiple-choice quiz with EXACTLY ${params.count} distinct questions.
Subject: ${params.subject}
Chapter / Topic: ${cleanTopic}
Difficulty: ${params.difficulty}

Rules:
- Match the language of the student's topic (if Bengali is used, write questions/options/explanations in natural Bengali with English scientific/technical terms where appropriate; if English, write in English).
- Every question MUST have exactly 4 distinct options labeled A, B, C, and D.
- correctOption MUST be exactly one of "A", "B", "C", or "D".
- explanation MUST clearly explain why the correct option is right and why common distractors are wrong.
- Return EXACTLY ${params.count} items in the "questions" array.`;

  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: settings.model || DEFAULT_MODEL_ID,
          contents: prompt,
          config: buildConfigWithOptionalTemperature(
            settings.model || DEFAULT_MODEL_ID,
            settings.temperature,
            {
              systemInstruction: SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        question: { type: Type.STRING },
                        options: {
                          type: Type.OBJECT,
                          properties: {
                            A: { type: Type.STRING },
                            B: { type: Type.STRING },
                            C: { type: Type.STRING },
                            D: { type: Type.STRING },
                          },
                          required: ['A', 'B', 'C', 'D'],
                        },
                        correctOption: {
                          type: Type.STRING,
                          description: 'Must be A, B, C, or D',
                        },
                        explanation: { type: Type.STRING },
                      },
                      required: [
                        'id',
                        'question',
                        'options',
                        'correctOption',
                        'explanation',
                      ],
                    },
                  },
                },
                required: ['title', 'questions'],
              },
            }
          ),
        })
      );

      const rawText = extractTextAndCheckSafety(response);
      const cleaned = stripJsonCodeFences(rawText);
      const parsed = JSON.parse(cleaned);
      const validated = QuizResponseSchema.parse(parsed);

      if (validated.questions.length < params.count) {
        throw new Error(`Expected ${params.count} questions, received ${validated.questions.length}`);
      }

      return {
        title: validated.title,
        questions: validated.questions.slice(0, params.count).map((q, idx) => ({
          ...q,
          id: q.id || `q-${idx + 1}`,
        })),
      };
    } catch (err) {
      const mapped = mapGeminiError(err);
      if (
        mapped.code === 'INVALID_KEY' ||
        mapped.code === 'PERMISSION_DENIED' ||
        mapped.code === 'RATE_LIMIT' ||
        mapped.code === 'MODEL_NOT_FOUND' ||
        mapped.code === 'NETWORK_OFFLINE'
      ) {
        throw new GeminiServiceError(mapped);
      }
      lastError = err;
    }
  }

  if (lastError instanceof GeminiServiceError) {
    throw lastError;
  }

  throw makeError(
    'INVALID_JSON',
    'The AI returned malformed quiz data after 3 attempts. Please retry.',
    'AI থেকে সঠিক কুইজ ফরম্যাট পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
    true
  );
}

export async function createStudyPlan(topicOrGoal: string): Promise<string> {
  const cleanGoal = topicOrGoal.trim() || 'SSC / HSC ও দক্ষতা বৃদ্ধির জন্য সাপ্তাহিক পড়ার রুটিন';
  const ai = getClient();
  const settings = getSettings();

  const prompt = `Create a practical, realistic 7-day structured weekly study routine based on this request:
"${cleanGoal}"

Reply in encouraging Bengali (with English subject terms where natural). Make each day actionable with focused study blocks, realistic durations, and a brief practical tip.`;

  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: settings.model || DEFAULT_MODEL_ID,
          contents: prompt,
          config: buildConfigWithOptionalTemperature(
            settings.model || DEFAULT_MODEL_ID,
            settings.temperature,
            {
              systemInstruction: SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  goal: { type: Type.STRING },
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        day: { type: Type.STRING },
                        focus: { type: Type.STRING },
                        tasks: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        duration: { type: Type.STRING },
                        tip: { type: Type.STRING },
                      },
                      required: ['day', 'focus', 'tasks', 'duration', 'tip'],
                    },
                  },
                  weeklyTip: { type: Type.STRING },
                },
                required: ['title', 'goal', 'days', 'weeklyTip'],
              },
            }
          ),
        })
      );

      const rawText = extractTextAndCheckSafety(response);
      const cleaned = stripJsonCodeFences(rawText);
      const plan: StudyPlanResponse = StudyPlanResponseSchema.parse(JSON.parse(cleaned));

      const tableRows = plan.days
        .map((d) => {
          const taskList = d.tasks.map((t) => `• ${t}`).join(' — ');
          return `| **${d.day}** | ${d.focus} | ${taskList} | ${d.duration} |`;
        })
        .join('\n');

      const dailyTips = plan.days
        .map((d) => `- **${d.day}:** ${d.tip}`)
        .join('\n');

      return `### ${plan.title}

**লক্ষ্য (Goal):** ${plan.goal}

| দিন (Day) | মূল ফোকাস (Focus) | করণীয় (Tasks) | সময় (Duration) |
| :--- | :--- | :--- | :--- |
${tableRows}

#### প্রতিদিনের পরামর্শ (Daily Study Tips)
${dailyTips}

**সাপ্তাহিক মূল টিপস:** ${plan.weeklyTip}`;
    } catch (err) {
      const mapped = mapGeminiError(err);
      if (
        mapped.code === 'INVALID_KEY' ||
        mapped.code === 'PERMISSION_DENIED' ||
        mapped.code === 'RATE_LIMIT' ||
        mapped.code === 'MODEL_NOT_FOUND' ||
        mapped.code === 'NETWORK_OFFLINE'
      ) {
        throw new GeminiServiceError(mapped);
      }
      if (attempt === maxAttempts) {
        throw new GeminiServiceError(mapped);
      }
    }
  }

  throw makeError(
    'INVALID_JSON',
    'Could not generate a structured study plan. Please try again.',
    'সাপ্তাহিক পড়ার রুটিন তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
    true
  );
}

export async function tutorChat(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    throw makeError(
      'EMPTY_INPUT',
      'Please write a message or question for your tutor.',
      'টিউটরকে জিজ্ঞাসা করার জন্য অনুগ্রহ করে একটি প্রশ্ন বা বার্তা লিখুন।',
      false
    );
  }

  const ai = getClient();
  const settings = getSettings();

  // Trim history to the last 12 valid non-error messages for a safe context window
  const safeWindow = history
    .filter((m) => !m.isError && m.content.trim().length > 0)
    .slice(-12);

  // Gemini chat history should start with a user turn and alternate cleanly
  const formattedHistory: Content[] = [];
  for (const msg of safeWindow) {
    const role = msg.role === 'user' ? 'user' : 'model';
    if (formattedHistory.length === 0 && role !== 'user') {
      continue;
    }
    const lastRole = formattedHistory[formattedHistory.length - 1]?.role;
    if (lastRole === role) {
      // Merge consecutive same-role messages to keep valid alternating turns
      const prev = formattedHistory[formattedHistory.length - 1];
      prev.parts = [{ text: `${prev.parts?.[0]?.text ?? ''}\n\n${msg.content}` }];
    } else {
      formattedHistory.push({
        role,
        parts: [{ text: msg.content }],
      });
    }
  }

  // Ensure history doesn't end with a user message before sendMessage
  if (formattedHistory[formattedHistory.length - 1]?.role === 'user') {
    formattedHistory.pop();
  }

  try {
    const chat = ai.chats.create({
      model: settings.model || DEFAULT_MODEL_ID,
      history: formattedHistory,
      config: buildConfigWithOptionalTemperature(
        settings.model || DEFAULT_MODEL_ID,
        settings.temperature,
        {
          systemInstruction: SYSTEM_PROMPT,
        }
      ),
    });

    const response = await withTimeout(
      chat.sendMessage({
        message: cleanMessage,
      })
    );

    return extractTextAndCheckSafety(response);
  } catch (err) {
    throw new GeminiServiceError(mapGeminiError(err));
  }
}
