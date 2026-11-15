import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  HelpCircle,
  MessageSquareText,
  Send,
  Sparkles,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AUDIENCE_SEGMENTS, DEMO_STATS } from '../constants/prompts';

const FEATURE_CARDS = [
  {
    title: 'Instant Concept Explainer',
    titleBn: 'সহজ ভাষায় কনসেপ্ট ব্যাখ্যা',
    description:
      'Enter any topic in Physics, Math, English, or Programming and receive structured notes with analogies, examples, and downloadable Markdown.',
    to: '/study-hub',
    cta: 'Open AI Study Hub',
    icon: BookOpenCheck,
    accentClass: 'bg-[#4338CA]/10 text-[#4338CA]',
  },
  {
    title: 'Smart AI Quiz Generator',
    titleBn: 'স্মার্ট MCQ কুইজ জেনারেটর',
    description:
      'Practice chapter-specific 5 or 10-question MCQs at Easy, Medium, or Hard difficulty with instant step-by-step explanations after submission.',
    to: '/quiz',
    cta: 'Start Smart Quiz',
    icon: HelpCircle,
    accentClass: 'bg-[#7C3AED]/10 text-[#7C3AED]',
  },
  {
    title: '24/7 Personal AI Tutor',
    titleBn: 'সার্বক্ষণিক ব্যক্তিগত AI টিউটর',
    description:
      'Chat in Bengali or English, check your paragraphs, get math formulas, or generate a structured 7-day weekly study routine anytime.',
    to: '/tutor',
    cta: 'Chat with Tutor',
    icon: MessageSquareText,
    accentClass: 'bg-[#10B981]/10 text-[#059669]',
  },
];

const QUICK_PROMPTS = [
  'নিউটনের তৃতীয় সূত্র উদাহরণসহ বুঝিয়ে দাও',
  'Explain English Passive Voice rules with examples',
  'SSC পরীক্ষার্থীদের জন্য ৭ দিনের পড়ার রুটিন দাও',
];

export function LandingPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleAskSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      setValidationError(
        'অনুগ্রহ করে একটি প্রশ্ন লিখুন · Please enter a question before asking.'
      );
      return;
    }
    setValidationError('');
    navigate('/tutor', {
      state: { prefilledQuestion: trimmed, autoSend: true },
    });
  };

  const handleStarterPrompt = (promptText: string) => {
    navigate('/tutor', {
      state: { prefilledQuestion: promptText, autoSend: true },
    });
  };

  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-[#7C3AED]">
              Bilingual Bengali &amp; English Learning · Powered by Google Gemini
            </p>
            <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-[#1E1B4B] sm:text-5xl sm:leading-[1.12]">
              Learn Smarter. Understand Faster. Grow Further.
            </h1>
            <p className="mt-4 text-lg font-medium text-slate-700 sm:text-xl">
              AI-এর সাহায্যে কঠিন বিষয় শিখুন সহজে, নিজের গতিতে।
            </p>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Built for Class 9–12, SSC/HSC, University, IELTS, Admission &amp; Job exam preparation. Bring your own Google AI Studio key—your data stays in your browser.
            </p>

            {/* Interactive Question Box */}
            <form
              onSubmit={handleAskSubmit}
              noValidate
              className="mt-8 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-2 shadow-sm transition-colors focus-within:border-[#4338CA]"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor="hero-ask-input" className="sr-only">
                  Ask EduGenius AI any study question
                </label>
                <input
                  id="hero-ask-input"
                  type="text"
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  placeholder="যেকোনো প্রশ্ন লিখুন... যেমন: Quantum Computing কী? বা Trigonometry formula"
                  className="min-h-[46px] flex-1 rounded-xl bg-transparent px-4 py-2.5 text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none sm:text-base"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#4338CA] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3730A3]"
                >
                  <Send className="h-4 w-4" />
                  <span>Ask AI</span>
                </button>
              </div>
            </form>

            {validationError && (
              <p role="alert" className="mt-2.5 text-sm font-medium text-red-600">
                {validationError}
              </p>
            )}

            {/* Quick clickable examples */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
              <span className="font-medium text-slate-500">Try asking:</span>
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleStarterPrompt(item)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-[#1E1B4B] transition-colors hover:border-[#4338CA] hover:text-[#4338CA]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Stats Strip */}
      <section aria-label="Sample platform metrics" className="border-b border-slate-200/80 bg-[#1E1B4B] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <span className="text-xs font-medium text-indigo-200">
              Platform Benchmark Targets
            </span>
            <span className="rounded-md border border-indigo-400/40 bg-indigo-950/60 px-2.5 py-0.5 text-xs font-semibold text-indigo-100">
              Demo figures (Illustrative sample metrics)
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {DEMO_STATS.map((stat) => (
              <div key={stat.labelEn} className="space-y-1">
                <p className="tabular-nums text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-indigo-100">
                  {stat.labelBn} · {stat.labelEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three Core Feature Cards */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
            Three Focused Tools for Deep Understanding
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            শেখার প্রতিটি ধাপের জন্য আলাদা AI টুল—ধারণা পরিষ্কার করা থেকে শুরু করে কুইজ প্র্যাকটিস এবং ব্যক্তিগত মেন্টরশিপ।
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-[#4338CA]/40 hover:shadow-md"
              >
                <div>
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.accentClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#1E1B4B]">
                    {card.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-[#7C3AED]">
                    {card.titleBn}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4338CA] group-hover:gap-2.5">
                  <span>{card.cta}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Audience Section */}
      <section className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4338CA]">
                <GraduationCap className="h-4 w-4" />
                <span>Who EduGenius AI Is Built For</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
                Designed for Every Stage of Your Academic Journey
              </h2>
            </div>
            <Link
              to="/settings"
              className="inline-flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2 text-sm font-semibold text-[#1E1B4B] transition-colors hover:border-[#4338CA] hover:text-[#4338CA]"
            >
              <Sparkles className="h-4 w-4 text-[#7C3AED]" />
              <span>Connect Your Gemini Key</span>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {AUDIENCE_SEGMENTS.map((seg) => (
              <div
                key={seg.title}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6"
              >
                <div>
                  <h3 className="text-base font-bold text-[#1E1B4B]">{seg.title}</h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {seg.titleBn}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {seg.description}
                  </p>
                </div>
                <p className="mt-4 border-t border-slate-200/80 pt-3 text-xs font-medium text-slate-500">
                  {seg.examples}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
