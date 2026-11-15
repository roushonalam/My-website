import {
  BookOpen,
  Check,
  Copy,
  Download,
  FileText,
  Lightbulb,
  ListChecks,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiKeyNotice } from '../components/ApiKeyNotice';
import { ErrorBanner } from '../components/ErrorBanner';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useToast } from '../components/Toast';
import {
  EDUCATION_LEVELS,
  EXPLANATION_FORMATS,
  OUTPUT_LANGUAGES,
  SUBJECTS,
} from '../constants/prompts';
import { explainTopic, mapGeminiError } from '../services/gemini';
import { getApiKey } from '../services/storage';
import type {
  BilingualError,
  EducationLevel,
  ExplanationFormat,
  OutputLanguage,
  StudyHubResponse,
  Subject,
} from '../types';

const MAX_TOPIC_CHARS = 500;

const SAMPLE_TOPICS = [
  'Quantum Computing সহজ ভাষায় বুঝিয়ে দাও',
  'English Passive Voice নিয়মসহ বলো',
  'Pythagorean Theorem with real-world examples',
  'Recursion in Python / JavaScript',
];

function formatStudyNotesAsMarkdown(
  result: StudyHubResponse,
  meta: { subject: Subject; level: EducationLevel; format: ExplanationFormat; language: OutputLanguage }
): string {
  return `# ${result.title}

- **Subject:** ${meta.subject}
- **Level:** ${meta.level}
- **Format:** ${meta.format}
- **Language:** ${meta.language}

---

## Simple Explanation
${result.simpleExplanation}

## Concept Definition
${result.conceptDefinition}

## Real-world Analogy
${result.realWorldAnalogy}

## Practical Examples
${result.practicalExamples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

## Important Points
${result.importantPoints.map((pt) => `- ${pt}`).join('\n')}

## Summary
${result.summary}
`;
}

function formatStudyNotesAsText(
  result: StudyHubResponse,
  meta: { subject: Subject; level: EducationLevel; format: ExplanationFormat; language: OutputLanguage }
): string {
  return `${result.title}
Subject: ${meta.subject} | Level: ${meta.level} | Format: ${meta.format} | Language: ${meta.language}
============================================================

SIMPLE EXPLANATION
${result.simpleExplanation}

CONCEPT DEFINITION
${result.conceptDefinition}

REAL-WORLD ANALOGY
${result.realWorldAnalogy}

PRACTICAL EXAMPLES
${result.practicalExamples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

IMPORTANT POINTS
${result.importantPoints.map((pt) => `* ${pt}`).join('\n')}

SUMMARY
${result.summary}
`;
}

export function StudyHubPage() {
  const { showToast } = useToast();
  const hasApiKey = Boolean(getApiKey());

  const [subject, setSubject] = useState<Subject>('Science');
  const [level, setLevel] = useState<EducationLevel>('HSC');
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState<ExplanationFormat>('Detailed Explanation');
  const [language, setLanguage] = useState<OutputLanguage>('Both');

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState<BilingualError | null>(null);
  const [result, setResult] = useState<StudyHubResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const runGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      setValidationError(
        'অনুগ্রহ করে একটি টপিক বা প্রশ্ন লিখুন · Please enter a topic to explain.'
      );
      return;
    }

    setValidationError('');
    setApiError(null);
    setLoading(true);

    try {
      const data = await explainTopic({
        subject,
        level,
        topic: trimmed,
        format,
        language,
      });
      setResult(data);
    } catch (err) {
      setApiError(mapGeminiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runGenerate();
  };

  const handleCopy = async () => {
    if (!result) return;
    const md = formatStudyNotesAsMarkdown(result, {
      subject,
      level,
      format,
      language,
    });
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      showToast('Study notes copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Unable to copy automatically. Try downloading the file.', 'error');
    }
  };

  const handleDownload = (ext: 'md' | 'txt') => {
    if (!result) return;
    const content =
      ext === 'md'
        ? formatStudyNotesAsMarkdown(result, { subject, level, format, language })
        : formatStudyNotesAsText(result, { subject, level, format, language });
    const slug = result.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'edugenius-notes';
    const blob = new Blob([content], {
      type: ext === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${slug}.${ext}`, 'success');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
          AI Study Hub
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          যেকোনো জটিল টপিক সহজ সংজ্ঞা, বাস্তব উদাহরণ ও পরীক্ষার গুরুত্বপূর্ণ পয়েন্টসহ সাজিয়ে নিন।
        </p>
      </div>

      {!hasApiKey && (
        <div className="mb-6">
          <ApiKeyNotice />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Control Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5 lg:self-start"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="study-subject"
                className="mb-1.5 block text-sm font-semibold text-[#1E1B4B]"
              >
                Subject
              </label>
              <select
                id="study-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm font-medium text-[#1E1B4B] focus:border-[#4338CA] focus:outline-none"
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
                htmlFor="study-level"
                className="mb-1.5 block text-sm font-semibold text-[#1E1B4B]"
              >
                Academic Level
              </label>
              <select
                id="study-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as EducationLevel)}
                className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm font-medium text-[#1E1B4B] focus:border-[#4338CA] focus:outline-none"
              >
                {EDUCATION_LEVELS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="study-topic"
                className="block text-sm font-semibold text-[#1E1B4B]"
              >
                Topic or Question
              </label>
              <span
                className={`tabular-nums text-xs font-medium ${
                  topic.length >= MAX_TOPIC_CHARS ? 'text-red-600' : 'text-slate-500'
                }`}
              >
                {topic.length}/{MAX_TOPIC_CHARS}
              </span>
            </div>
            <textarea
              id="study-topic"
              rows={4}
              maxLength={MAX_TOPIC_CHARS}
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder='যেমন: "Quantum Computing সহজ ভাষায় বুঝিয়ে দাও" অথবা "English Passive Voice নিয়মসহ বলো"'
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5 text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:border-[#4338CA] focus:outline-none"
            />
            {validationError && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                {validationError}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SAMPLE_TOPICS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setTopic(sample);
                    setValidationError('');
                  }}
                  className="rounded-lg border border-slate-200 bg-[#F8FAFC] px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-[#4338CA] hover:text-[#4338CA]"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Format Radio Pills */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[#1E1B4B]">
              Explanation Format
            </legend>
            <div className="flex flex-wrap gap-2">
              {EXPLANATION_FORMATS.map((item) => {
                const active = format === item;
                return (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFormat(item)}
                    className={`min-h-[38px] whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-[#4338CA] bg-[#4338CA] text-white'
                        : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:border-[#4338CA]/50'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Output Language */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[#1E1B4B]">
              Output Language
            </legend>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
              {OUTPUT_LANGUAGES.map((lang) => {
                const active = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setLanguage(lang)}
                    className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-white text-[#1E1B4B] shadow-sm'
                        : 'text-slate-600 hover:text-[#1E1B4B]'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#4338CA] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3730A3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Notes...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Explanation</span>
              </>
            )}
          </button>
        </form>

        {/* Right Output Area */}
        <div className="space-y-6 lg:col-span-7">
          {apiError && (
            <ErrorBanner
              error={apiError}
              onRetry={() => void runGenerate()}
              retryDisabled={loading}
            />
          )}

          {loading && (
            <div
              aria-busy="true"
              aria-label="Generating structured study notes"
              className="space-y-4"
            >
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="mt-4 space-y-2.5">
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-5/6 rounded bg-slate-100" />
                    <div className="h-3 w-4/6 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !result && !apiError && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4338CA]/10 text-[#4338CA]">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#1E1B4B]">
                Structured Study Notes Will Appear Here
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Choose your subject, academic level, and topic on the left. EduGenius AI will organize the response into Simple Explanation, Concept Definition, Real-world Analogy, Practical Examples, Important Points, and Summary.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-5">
              {/* Header + Export Actions */}
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {subject} · {level} · {format} · {language}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-[#1E1B4B]">
                    {result.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] transition-colors hover:border-[#4338CA] hover:text-[#4338CA]"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload('md')}
                    className="inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] transition-colors hover:border-[#4338CA] hover:text-[#4338CA]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>.md</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload('txt')}
                    className="inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] transition-colors hover:border-[#4338CA] hover:text-[#4338CA]"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>.txt</span>
                  </button>
                </div>
              </div>

              {/* 6 Structured Output Cards */}
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-[#1E1B4B]">
                  <Sparkles className="h-4 w-4 text-[#7C3AED]" />
                  <span>Simple Explanation · সহজ ব্যাখ্যা</span>
                </h3>
                <div className="mt-3">
                  <MarkdownRenderer content={result.simpleExplanation} />
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-[#1E1B4B]">
                  <BookOpen className="h-4 w-4 text-[#4338CA]" />
                  <span>Concept Definition · মূল সংজ্ঞা</span>
                </h3>
                <div className="mt-3">
                  <MarkdownRenderer content={result.conceptDefinition} />
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-[#1E1B4B]">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <span>Real-world Analogy · বাস্তব উদাহরণ ও উপমা</span>
                </h3>
                <div className="mt-3">
                  <MarkdownRenderer content={result.realWorldAnalogy} />
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-[#1E1B4B]">
                  Practical Examples · ব্যবহারিক উদাহরণ
                </h3>
                <ul className="mt-3 space-y-3">
                  {result.practicalExamples.map((ex, idx) => (
                    <li
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4"
                    >
                      <MarkdownRenderer content={ex} />
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-[#1E1B4B]">
                  <ListChecks className="h-4 w-4 text-[#10B981]" />
                  <span>Important Points · গুরুত্বপূর্ণ পয়েন্ট</span>
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {result.importantPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4338CA]" />
                      <div className="flex-1">
                        <MarkdownRenderer content={pt} />
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6">
                <h3 className="text-base font-bold text-[#1E1B4B]">
                  Summary · সারসংক্ষেপ
                </h3>
                <div className="mt-2.5">
                  <MarkdownRenderer content={result.summary} />
                </div>
              </article>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
