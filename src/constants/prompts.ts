import type {
  EducationLevel,
  ExplanationFormat,
  ModelOption,
  OutputLanguage,
  QuizDifficulty,
  Subject,
} from '../types';

export const SYSTEM_PROMPT = `You are EduGenius AI, an elite educational mentor and adaptive tutor.
1. Target: Bengali and English-speaking students (SSC, HSC, University, IELTS, Job exams).
2. Tone: highly encouraging, clear, structured, and pedagogically sound.
3. Behavior: For explanations, break complex topics into 3 levels: Concept Definition, Real-world Analogy, Practical Example. For quizzes, always return strict structured output with Question, Options (A, B, C, D), Correct Answer, and In-depth Explanation. Avoid hallucination; if unsure, say so and politely ask a clarifying question. Reply in the student's language. Maintain proper Bengali-English typography. Encourage understanding rather than just giving answers.`;

export const SUBJECTS: Subject[] = [
  'Science',
  'Mathematics',
  'English',
  'General Knowledge',
  'Programming',
];

export const EDUCATION_LEVELS: EducationLevel[] = [
  'Beginner',
  'SSC',
  'HSC',
  'University',
  'Job Preparation',
];

export const EXPLANATION_FORMATS: ExplanationFormat[] = [
  'Short Summary',
  'Detailed Explanation',
  'Flashcard Points',
];

export const OUTPUT_LANGUAGES: OutputLanguage[] = ['Bengali', 'English', 'Both'];

export const QUIZ_DIFFICULTIES: QuizDifficulty[] = ['Easy', 'Medium', 'Hard'];

export const TUTOR_QUICK_CHIPS: Array<{ label: string; prompt: string; isStudyPlan?: boolean }> = [
  {
    label: 'একটি কঠিন টপিক ব্যাখ্যা করো',
    prompt: 'পদার্থবিজ্ঞান বা জীববিজ্ঞানের একটি গুরুত্বপূর্ণ ও কঠিন টপিক সহজ উদাহরণসহ ব্যাখ্যা করো।',
  },
  {
    label: 'আমার প্যারাগ্রাফ চেক করো',
    prompt: 'আমি একটি ইংরেজি প্যারাগ্রাফ দিচ্ছি—তুমি গ্রামার, ভোকাবুলারি ও স্ট্রাকচার চেক করে উন্নতির পরামর্শ দেবে? (আমি এখনই প্যারাগ্রাফটি লিখছি অথবা একটি উদাহরণ দিয়ে দেখাও কীভাবে চেক করবে।)',
  },
  {
    label: 'একটি গণিতের সূত্র দাও',
    prompt: 'SSC ও HSC পরীক্ষার জন্য গুরুত্বপূর্ণ একটি বীজগণিত বা ত্রিকোণমিতির সূত্র, প্রমাণ ও প্রয়োগ উদাহরণসহ বুঝিয়ে দাও।',
  },
  {
    label: 'IELTS প্রস্তুতিতে সাহায্য করো',
    prompt: 'IELTS Reading এবং Writing Band 7+ পাওয়ার জন্য কার্যকর কৌশল ও দৈনন্দিন প্র্যাকটিস প্ল্যান দাও।',
  },
  {
    label: 'পড়ার রুটিন তৈরি করো',
    prompt: 'পড়ার রুটিন তৈরি করো',
    isStudyPlan: true,
  },
];

export const DEMO_STATS = [
  {
    value: '50,000+',
    labelBn: 'প্রশ্ন সমাধান',
    labelEn: 'Questions Solved',
  },
  {
    value: '10,000+',
    labelBn: 'কুইজ জেনারেট',
    labelEn: 'Quizzes Generated',
  },
  {
    value: '99.4%',
    labelBn: 'সন্তুষ্টি',
    labelEn: 'Learner Satisfaction',
  },
];

export const AUDIENCE_SEGMENTS = [
  {
    title: 'Class 9–12 & SSC/HSC',
    titleBn: 'নবম–দ্বাদশ ও বোর্ড পরীক্ষার্থী',
    description:
      'Break down Physics, Chemistry, Higher Math, and English Grammar into clear bilingual concepts with board-ready practice quizzes.',
    examples: 'Newton’s Laws · Organic Chemistry · Passive Voice',
  },
  {
    title: 'University, Admission & Job Seekers',
    titleBn: 'বিশ্ববিদ্যালয়, ভর্তি ও চাকরির প্রস্তুতি',
    description:
      'Accelerate BCS, Bank, IELTS, and university admission prep with timed MCQ drills, instant explanations, and weekly study schedules.',
    examples: 'Analytical Reasoning · IELTS Writing · CS Fundamentals',
  },
  {
    title: 'Educators & Mentors',
    titleBn: 'শিক্ষক ও মেন্টরবৃন্দ',
    description:
      'Draft structured lesson notes, classroom analogies, and custom formative quizzes in seconds—exportable directly as Markdown or TXT.',
    examples: 'Lesson Handouts · 10-Question Sets · Bilingual Summaries',
  },
];

export const DEFAULT_MODEL_ID = 'gemini-4-hydrogen';

export const FALLBACK_MODELS: ModelOption[] = [
  {
    id: 'gemini-4-hydrogen',
    displayName: 'Gemini 4 Hydrogen (Flash)',
    tier: 'Flash (fast)',
    description: 'Fast everyday explanations, quizzes, and bilingual tutoring',
  },
  {
    id: 'gemini-3.1-flash-lite',
    displayName: 'Gemini 3.1 Flash Lite',
    tier: 'Flash (fast)',
    description: 'Ultra-low-latency model for quick summaries and drills',
  },
  {
    id: 'gemini-4-argon',
    displayName: 'Gemini 4 Argon (Pro)',
    tier: 'Pro (high quality)',
    description: 'Advanced reasoning for complex STEM, coding, and math proofs',
  },
  {
    id: 'gemini-4-carbon',
    displayName: 'Gemini 4 Carbon (Pro)',
    tier: 'Pro (high quality)',
    description: 'Deep analytical reasoning for multi-step academic tasks',
  },
];
