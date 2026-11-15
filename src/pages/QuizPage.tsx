import {
  ArrowRight,
  Award,
  CheckCircle2,
  HelpCircle,
  Loader2,
  PlusCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiKeyNotice } from '../components/ApiKeyNotice';
import { ErrorBanner } from '../components/ErrorBanner';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { QUIZ_DIFFICULTIES, SUBJECTS } from '../constants/prompts';
import { generateQuiz, mapGeminiError } from '../services/gemini';
import { getApiKey } from '../services/storage';
import type {
  BilingualError,
  QuizDifficulty,
  QuizResponse,
  Subject,
} from '../types';

type OptionKey = 'A' | 'B' | 'C' | 'D';
const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

interface UserAnswerRecord {
  questionId: string;
  selected: OptionKey;
  isCorrect: boolean;
}

export function QuizPage() {
  const hasApiKey = Boolean(getApiKey());

  // Setup state
  const [subject, setSubject] = useState<Subject>('Science');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Medium');
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState<BilingualError | null>(null);

  // Quiz session state
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<UserAnswerRecord[]>([]);
  const [completed, setCompleted] = useState(false);

  const startGeneration = async () => {
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      setValidationError(
        'কুইজ তৈরি করতে অধ্যায় বা টপিকের নাম লিখুন · Please enter a chapter or topic.'
      );
      return;
    }

    setValidationError('');
    setApiError(null);
    setLoading(true);

    try {
      const data = await generateQuiz({
        subject,
        topic: cleanTopic,
        difficulty,
        count: questionCount,
      });
      setQuiz(data);
      setCurrentIndex(0);
      setSelectedOption(null);
      setSubmitted(false);
      setAnswers([]);
      setCompleted(false);
    } catch (err) {
      setApiError(mapGeminiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = (e: FormEvent) => {
    e.preventDefault();
    void startGeneration();
  };

  const currentQuestion = quiz?.questions[currentIndex] ?? null;
  const liveScore = answers.filter((a) => a.isCorrect).length;

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedOption || submitted) return;
    const isCorrect = selectedOption === currentQuestion.correctOption;
    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selected: selectedOption,
        isCorrect,
      },
    ]);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setSubmitted(false);
    } else {
      setCompleted(true);
    }
  };

  const handleRetrySameQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setAnswers([]);
    setCompleted(false);
  };

  const handleNewQuiz = () => {
    setQuiz(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setAnswers([]);
    setCompleted(false);
    setApiError(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
          Smart AI Quiz Generator
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          যেকোনো অধ্যায়ের উপর ৫ বা ১০টি MCQ কুইজ তৈরি করুন এবং উত্তর জমা দেওয়ার পর বিস্তারিত ব্যাখ্যা দেখুন।
        </p>
      </div>

      {!hasApiKey && (
        <div className="mb-6">
          <ApiKeyNotice />
        </div>
      )}

      {apiError && (
        <div className="mb-6">
          <ErrorBanner
            error={apiError}
            onRetry={() => void startGeneration()}
            retryDisabled={loading}
          />
        </div>
      )}

      {/* Stage 1: Setup Form */}
      {!quiz && !loading && (
        <form
          onSubmit={handleSetupSubmit}
          noValidate
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="quiz-subject"
                className="mb-1.5 block text-sm font-semibold text-[#1E1B4B]"
              >
                Subject
              </label>
              <select
                id="quiz-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-sm font-medium text-[#1E1B4B] focus:border-[#4338CA] focus:outline-none"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="quiz-topic"
                className="mb-1.5 block text-sm font-semibold text-[#1E1B4B]"
              >
                Chapter / Topic
              </label>
              <input
                id="quiz-topic"
                type="text"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="e.g. Physics: Newton's Laws or বাংলা ব্যাকরণ: সমাস"
                className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:border-[#4338CA] focus:outline-none"
              />
              {validationError && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                  {validationError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-[#1E1B4B]">
                Difficulty
              </legend>
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
                {QUIZ_DIFFICULTIES.map((diff) => {
                  const active = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setDifficulty(diff)}
                      className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-white text-[#1E1B4B] shadow-sm'
                          : 'text-slate-600 hover:text-[#1E1B4B]'
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-[#1E1B4B]">
                Number of Questions
              </legend>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                {([5, 10] as const).map((cnt) => {
                  const active = questionCount === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setQuestionCount(cnt)}
                      className={`tabular-nums min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-white text-[#1E1B4B] shadow-sm'
                          : 'text-slate-600 hover:text-[#1E1B4B]'
                      }`}
                    >
                      {cnt} Questions
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#4338CA] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3730A3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Generate {questionCount}-Question Quiz</span>
          </button>
        </form>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div
          aria-busy="true"
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm"
        >
          <Loader2 className="h-8 w-8 animate-spin text-[#4338CA]" />
          <p className="mt-4 text-base font-semibold text-[#1E1B4B]">
            Crafting your {questionCount}-question {difficulty} quiz...
          </p>
          <p className="mt-1 text-sm text-slate-500">
            প্রশ্ন এবং ব্যাখ্যাগুলো যাচাই করে তৈরি করা হচ্ছে।
          </p>
        </div>
      )}

      {/* Stage 2: Active Quiz Question (One at a time; correct answer NEVER rendered before submit) */}
      {quiz && !completed && currentQuestion && (
        <div className="space-y-6">
          {/* Progress & Live Score Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-bold text-[#1E1B4B]">{quiz.title}</p>
                <p className="tabular-nums text-xs text-slate-500">
                  Question {currentIndex + 1} of {quiz.questions.length} · {difficulty}
                </p>
              </div>
              <div className="tabular-nums rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-1.5 text-sm font-semibold text-[#1E1B4B]">
                Live Score: {liveScore} / {answers.length}
              </div>
            </div>

            <div
              className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={currentIndex + (submitted ? 1 : 0)}
              aria-valuemin={0}
              aria-valuemax={quiz.questions.length}
            >
              <div
                className="h-full rounded-full bg-[#4338CA] transition-all duration-300"
                style={{
                  width: `${
                    ((currentIndex + (submitted ? 1 : 0)) / quiz.questions.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold leading-snug text-[#1E1B4B] sm:text-xl">
              {currentIndex + 1}. {currentQuestion.question}
            </h2>

            <div className="mt-6 space-y-3" role="radiogroup" aria-label="Answer options">
              {OPTION_KEYS.map((optKey) => {
                const isSelected = selectedOption === optKey;

                // Only reveal correctness styling AFTER submit
                let cardClasses =
                  'border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] hover:border-[#4338CA]/60';
                let badgeClasses = 'border-slate-300 bg-white text-slate-700';

                if (!submitted && isSelected) {
                  cardClasses = 'border-[#4338CA] bg-indigo-50/70 text-[#1E1B4B]';
                  badgeClasses = 'border-[#4338CA] bg-[#4338CA] text-white';
                } else if (submitted) {
                  const isRightAnswer = optKey === currentQuestion.correctOption;
                  if (isRightAnswer) {
                    cardClasses =
                      'border-[#10B981] bg-emerald-50/80 text-emerald-950';
                    badgeClasses = 'border-[#10B981] bg-[#10B981] text-white';
                  } else if (isSelected && !isRightAnswer) {
                    cardClasses = 'border-red-400 bg-red-50/80 text-red-950';
                    badgeClasses = 'border-red-600 bg-red-600 text-white';
                  } else {
                    cardClasses = 'border-slate-200 bg-slate-50 text-slate-500 opacity-80';
                  }
                }

                return (
                  <button
                    key={optKey}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={submitted}
                    onClick={() => setSelectedOption(optKey)}
                    className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border p-4 text-left text-sm font-medium transition-colors disabled:cursor-default sm:text-base ${cardClasses}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${badgeClasses}`}
                      >
                        {optKey}
                      </span>
                      <span>{currentQuestion.options[optKey]}</span>
                    </div>

                    {/* Explicit icon + text feedback ONLY after submit */}
                    {submitted && optKey === currentQuestion.correctOption && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#059669]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Correct</span>
                      </span>
                    )}
                    {submitted &&
                      isSelected &&
                      optKey !== currentQuestion.correctOption && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span>Your Choice</span>
                        </span>
                      )}
                  </button>
                );
              })}
            </div>

            {/* Submit button before answering */}
            {!submitted && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#4338CA] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3730A3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Submit Answer</span>
                </button>
              </div>
            )}

            {/* Post-submit Feedback + Explanation */}
            {submitted && (
              <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
                {selectedOption === currentQuestion.correctOption ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#10B981]" />
                    <span>
                      সঠিক উত্তর! (Correct Answer: Option {currentQuestion.correctOption})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
                    <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                    <span>
                      ভুল উত্তর — সঠিক উত্তর হলো Option {currentQuestion.correctOption}:{' '}
                      {currentQuestion.options[currentQuestion.correctOption]}
                    </span>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                  <p className="mb-1.5 text-xs font-bold text-[#4338CA]">
                    Detailed Explanation · বিস্তারিত ব্যাখ্যা
                  </p>
                  <MarkdownRenderer content={currentQuestion.explanation} />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#4338CA] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3730A3]"
                  >
                    <span>
                      {currentIndex + 1 < quiz.questions.length
                        ? 'Next Question'
                        : 'View Final Results'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stage 3: Final Score & Per-Question Review */}
      {quiz && completed && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10B981]/10 text-[#059669]">
              <Award className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-[#1E1B4B]">
              Quiz Completed!
            </h2>
            <p className="mt-1 text-sm text-slate-600">{quiz.title}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:mx-auto sm:max-w-md">
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <p className="text-xs font-medium text-slate-500">Final Score</p>
                <p className="tabular-nums mt-1 text-2xl font-bold text-[#1E1B4B]">
                  {liveScore} / {quiz.questions.length}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <p className="text-xs font-medium text-slate-500">Accuracy</p>
                <p className="tabular-nums mt-1 text-2xl font-bold text-[#4338CA]">
                  {Math.round((liveScore / quiz.questions.length) * 100)}%
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRetrySameQuiz}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E1B4B] transition-colors hover:border-[#4338CA] hover:text-[#4338CA]"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Retry Quiz (Same Set)</span>
              </button>
              <button
                type="button"
                onClick={handleNewQuiz}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#4338CA] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3730A3]"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Quiz</span>
              </button>
            </div>
          </div>

          {/* Per-question Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#1E1B4B]">
              Per-Question Review · প্রশ্নভিত্তিক পর্যালোচনা
            </h3>
            {quiz.questions.map((q, idx) => {
              const rec = answers[idx];
              const isCorrect = rec?.isCorrect ?? false;
              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-[#1E1B4B]">
                      {idx + 1}. {q.question}
                    </p>
                    {isCorrect ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#059669]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Correct</span>
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>Incorrect</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-slate-600">
                      Your answer:{' '}
                      <strong className={isCorrect ? 'text-[#059669]' : 'text-red-700'}>
                        {rec ? `${rec.selected}. ${q.options[rec.selected]}` : '—'}
                      </strong>
                    </p>
                    {!isCorrect && (
                      <p className="text-[#059669]">
                        Correct answer:{' '}
                        <strong>
                          {q.correctOption}. {q.options[q.correctOption]}
                        </strong>
                      </p>
                    )}
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-100 bg-[#F8FAFC] p-3.5 text-sm">
                    <MarkdownRenderer content={q.explanation} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
