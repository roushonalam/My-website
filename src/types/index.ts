import { z } from 'zod';

export type Subject =
  | 'Science'
  | 'Mathematics'
  | 'English'
  | 'General Knowledge'
  | 'Programming';

export type EducationLevel =
  | 'Beginner'
  | 'SSC'
  | 'HSC'
  | 'University'
  | 'Job Preparation';

export type ExplanationFormat =
  | 'Short Summary'
  | 'Detailed Explanation'
  | 'Flashcard Points';

export type OutputLanguage = 'Bengali' | 'English' | 'Both';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export const StudyHubResponseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  simpleExplanation: z.string().min(1, 'Simple explanation is required'),
  conceptDefinition: z.string().min(1, 'Concept definition is required'),
  realWorldAnalogy: z.string().min(1, 'Real-world analogy is required'),
  practicalExamples: z
    .array(z.string().min(1))
    .min(1, 'At least one practical example is required'),
  importantPoints: z
    .array(z.string().min(1))
    .min(1, 'At least one important point is required'),
  summary: z.string().min(1, 'Summary is required'),
});

export type StudyHubResponse = z.infer<typeof StudyHubResponseSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1, 'Question cannot be empty'),
  options: z.object({
    A: z.string().min(1, 'Option A cannot be empty'),
    B: z.string().min(1, 'Option B cannot be empty'),
    C: z.string().min(1, 'Option C cannot be empty'),
    D: z.string().min(1, 'Option D cannot be empty'),
  }),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(1, 'Explanation cannot be empty'),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizResponseSchema = z.object({
  title: z.string().min(1),
  questions: z.array(QuizQuestionSchema).min(1),
});

export type QuizResponse = z.infer<typeof QuizResponseSchema>;

export const StudyPlanDaySchema = z.object({
  day: z.string().min(1),
  focus: z.string().min(1),
  tasks: z.array(z.string().min(1)).min(1),
  duration: z.string().min(1),
  tip: z.string().min(1),
});

export const StudyPlanResponseSchema = z.object({
  title: z.string().min(1),
  goal: z.string().min(1),
  days: z.array(StudyPlanDaySchema).min(5).max(7),
  weeklyTip: z.string().min(1),
});

export type StudyPlanResponse = z.infer<typeof StudyPlanResponseSchema>;

export type ModelTier = 'Flash (fast)' | 'Pro (high quality)';

export interface ModelOption {
  id: string;
  displayName: string;
  tier: ModelTier;
  description?: string;
}

export type ConnectionStatus = 'not_configured' | 'connected' | 'error';

export interface AppSettings {
  model: string;
  temperature: number;
  connectionStatus: ConnectionStatus;
  lastTestedAt?: string;
  lastError?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
  failedPrompt?: string;
  isStudyPlan?: boolean;
}

export interface BilingualError {
  code: string;
  messageEn: string;
  messageBn: string;
  retryable: boolean;
}
