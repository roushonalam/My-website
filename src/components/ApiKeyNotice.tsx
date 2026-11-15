import { KeyRound, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApiKeyNoticeProps {
  compact?: boolean;
}

export function ApiKeyNotice({ compact = false }: ApiKeyNoticeProps) {
  return (
    <div
      role="region"
      aria-label="API Key Configuration Required"
      className={`rounded-2xl border border-amber-200 bg-amber-50/80 ${
        compact ? 'p-4' : 'p-6'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#1E1B4B]">
              API Key Not Configured · আপনার Gemini API Key যুক্ত করুন
            </h2>
            <p className="text-sm text-slate-700">
              To run real AI explanations, quizzes, or tutoring, add your own Google AI Studio key in Settings. Your key stays in your browser only.
            </p>
          </div>
        </div>

        <Link
          to="/settings"
          className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#4338CA] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3730A3]"
        >
          <span>Configure Key</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
