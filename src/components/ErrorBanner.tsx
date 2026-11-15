import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BilingualError } from '../types';

interface ErrorBannerProps {
  error: BilingualError;
  onRetry?: () => void;
  retryDisabled?: boolean;
}

export function ErrorBanner({
  error,
  onRetry,
  retryDisabled = false,
}: ErrorBannerProps) {
  const needsSettings =
    error.code === 'MISSING_KEY' ||
    error.code === 'INVALID_KEY' ||
    error.code === 'PERMISSION_DENIED' ||
    error.code === 'MODEL_NOT_FOUND';

  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50/90 p-5 text-red-950"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-900">
              {error.messageBn}
            </p>
            <p className="text-sm text-red-800">{error.messageEn}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {needsSettings && (
            <Link
              to="/settings"
              className="inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 transition-colors hover:bg-red-100"
            >
              Open Settings
            </Link>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retryDisabled}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              <span>আবার চেষ্টা করুন (Retry)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
