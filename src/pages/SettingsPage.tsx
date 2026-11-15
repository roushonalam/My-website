import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useToast } from '../components/Toast';
import { DEFAULT_MODEL_ID, FALLBACK_MODELS } from '../constants/prompts';
import { listModels, mapGeminiError, testConnection } from '../services/gemini';
import {
  getApiKey,
  getSettings,
  isKeyRemembered,
  maskApiKey,
  removeApiKey,
  saveSettings,
  setApiKey,
} from '../services/storage';
import type { AppSettings, ConnectionStatus, ModelOption } from '../types';

export function SettingsPage() {
  const { showToast } = useToast();

  const [savedKey, setSavedKey] = useState<string>(() => getApiKey());
  const [keyInput, setKeyInput] = useState<string>(() => getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [rememberOnDevice, setRememberOnDevice] = useState<boolean>(() =>
    isKeyRemembered()
  );

  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [models, setModels] = useState<ModelOption[]>(FALLBACK_MODELS);
  const [modelsLive, setModelsLive] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string>('');

  const loadAvailableModels = useCallback(
    async (keyToUse?: string, forceRefresh = false) => {
      setLoadingModels(true);
      const res = await listModels(keyToUse, forceRefresh);
      setModels(res.models);
      setModelsLive(res.fromLiveApi);
      setLoadingModels(false);

      // Keep selected model valid if live list returns different models
      setSettings((prev) => {
        const exists = res.models.some((m) => m.id === prev.model);
        if (exists) return prev;
        const preferred =
          res.models.find((m) => m.tier === 'Flash (fast)')?.id ||
          res.models[0]?.id ||
          DEFAULT_MODEL_ID;
        const updated = { ...prev, model: preferred };
        saveSettings(updated);
        return updated;
      });
    },
    []
  );

  useEffect(() => {
    void loadAvailableModels(savedKey, false);
  }, [savedKey, loadAvailableModels]);

  const handleSaveKey = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed) {
      showToast('Please paste a valid Google AI Studio API key first.', 'error');
      return;
    }

    setApiKey(trimmed, rememberOnDevice);
    setSavedKey(trimmed);
    setKeyInput(trimmed);

    const nextSettings: AppSettings = {
      ...settings,
      connectionStatus: 'not_configured',
      lastError: undefined,
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
    setTestFeedback('');

    showToast(
      rememberOnDevice
        ? 'API key saved in localStorage on this device.'
        : 'API key saved for this browser session (sessionStorage).',
      'success'
    );
    void loadAvailableModels(trimmed, true);
  };

  const handleRemoveKey = () => {
    removeApiKey();
    setSavedKey('');
    setKeyInput('');
    setTestFeedback('');
    setModels(FALLBACK_MODELS);
    setModelsLive(false);
    setSettings((prev) => ({
      ...prev,
      connectionStatus: 'not_configured',
      lastError: undefined,
    }));
    showToast('API key removed from browser storage.', 'info');
  };

  const handleTestConnection = async () => {
    const candidateKey = keyInput.trim() || savedKey;
    if (!candidateKey) {
      showToast('Enter and save your API key before testing.', 'error');
      return;
    }

    // Persist key if user modified input before clicking Test
    if (candidateKey !== savedKey) {
      setApiKey(candidateKey, rememberOnDevice);
      setSavedKey(candidateKey);
    }

    setTesting(true);
    setTestFeedback('');

    try {
      const result = await testConnection(candidateKey, settings.model);
      const nextSettings: AppSettings = {
        ...settings,
        connectionStatus: 'connected',
        lastTestedAt: new Date().toISOString(),
        lastError: undefined,
      };
      setSettings(nextSettings);
      saveSettings(nextSettings);
      setTestFeedback(
        `Connected to ${result.modelUsed} (${result.latencyMs} ms).`
      );
      showToast('Gemini API connection verified!', 'success');
      void loadAvailableModels(candidateKey, true);
    } catch (err) {
      const mapped = mapGeminiError(err);
      const nextSettings: AppSettings = {
        ...settings,
        connectionStatus: 'error',
        lastTestedAt: new Date().toISOString(),
        lastError: `${mapped.messageBn} (${mapped.messageEn})`,
      };
      setSettings(nextSettings);
      saveSettings(nextSettings);
      setTestFeedback(`${mapped.messageBn} — ${mapped.messageEn}`);
      showToast('API connection test failed. Check your key or model.', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    showToast('Model and temperature settings saved.', 'success');
  };

  const renderStatusBadge = (status: ConnectionStatus) => {
    if (!savedKey || status === 'not_configured') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          <KeyRound className="h-3.5 w-3.5 text-amber-700" />
          <span>Not configured</span>
        </span>
      );
    }
    if (status === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
          <span>Connected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-900">
        <XCircle className="h-3.5 w-3.5 text-red-600" />
        <span>Error</span>
      </span>
    );
  };

  const temperatureLabel =
    settings.temperature <= 0.3
      ? 'সবচেয়ে নির্ভুল (Accurate)'
      : settings.temperature >= 0.6
        ? 'সৃজনশীল (Creative)'
        : 'ভারসাম্যপূর্ণ (Balanced)';

  const isGemini4Selected = settings.model.toLowerCase().startsWith('gemini-4-');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
            Settings &amp; API Key
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            আপনার Google AI Studio API Key যুক্ত করুন, মডেল নির্বাচন করুন এবং সংযোগ পরীক্ষা করুন।
          </p>
        </div>
        <div>{renderStatusBadge(settings.connectionStatus)}</div>
      </div>

      <div className="space-y-6">
        {/* Security Notice */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#4338CA]" />
            <div className="space-y-1.5 text-sm text-[#1E1B4B]">
              <p className="font-semibold">
                Your key stays in your browser and is sent only to Google. Use a restricted key and avoid shared computers.
              </p>
              <p className="text-xs leading-relaxed text-slate-700">
                Security Tip: In Google AI Studio / Google Cloud Console, restrict your API key by{' '}
                <strong>HTTP referrer (Website restrictions)</strong> to your deployed domain (e.g.,{' '}
                <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">
                  https://your-site.vercel.app/*
                </code>
                ) and enable only the <strong>Generative Language API</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: API Key Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#1E1B4B]">
                Google AI Studio API Key (BYOK)
              </h2>
              {savedKey && (
                <p className="mt-0.5 font-mono text-xs text-slate-500">
                  Active key: {maskApiKey(savedKey)} ({rememberOnDevice ? 'localStorage' : 'sessionStorage'})
                </p>
              )}
            </div>
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:underline"
            >
              <span>Get a Key at Google AI Studio</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Short How-To Steps */}
          <ol className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-xs text-slate-700 sm:grid-cols-3">
            <li>
              <strong className="block text-[#1E1B4B]">1. Open AI Studio</strong>
              Visit aistudio.google.com and sign in with your Google account.
            </li>
            <li>
              <strong className="block text-[#1E1B4B]">2. Create API Key</strong>
              Click &ldquo;Get API key&rdquo; → &ldquo;Create API key&rdquo;.
            </li>
            <li>
              <strong className="block text-[#1E1B4B]">3. Paste &amp; Test</strong>
              Paste below, save, and click &ldquo;Test API Connection&rdquo;.
            </li>
          </ol>

          <form onSubmit={handleSaveKey} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="gemini-api-key"
                className="mb-1.5 block text-sm font-semibold text-[#1E1B4B]"
              >
                API Key
              </label>
              <div className="relative flex items-center">
                <input
                  id="gemini-api-key"
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="AIza..."
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-4 pr-12 font-mono text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:border-[#4338CA] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  className="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-[#1E1B4B]"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={rememberOnDevice}
                onChange={(e) => setRememberOnDevice(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#4338CA] focus:ring-[#4338CA]"
              />
              <span>
                <strong className="font-semibold text-[#1E1B4B]">
                  Remember on this device
                </strong>{' '}
                <span className="text-xs text-slate-500">
                  (Uses localStorage across restarts. Leave unchecked to use sessionStorage only, which clears when the tab closes.)
                </span>
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#4338CA] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3730A3]"
              >
                <KeyRound className="h-4 w-4" />
                <span>Save Key</span>
              </button>

              <button
                type="button"
                onClick={() => void handleTestConnection()}
                disabled={testing}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-[#1E1B4B] transition-colors hover:border-[#4338CA] hover:text-[#4338CA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                    <span>Test API Connection</span>
                  </>
                )}
              </button>

              {savedKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove Key</span>
                </button>
              )}
            </div>
          </form>

          {(testFeedback || settings.lastError) && (
            <div
              role="status"
              className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-medium ${
                settings.connectionStatus === 'connected'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {settings.connectionStatus === 'connected' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
              ) : (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{testFeedback || settings.lastError}</span>
            </div>
          )}
        </section>

        {/* Section 2: Model & Temperature Settings */}
        <form
          onSubmit={handleSaveSettings}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#4338CA]" />
              <h2 className="text-lg font-bold text-[#1E1B4B]">
                Model &amp; Response Preferences
              </h2>
            </div>

            <button
              type="button"
              onClick={() => void loadAvailableModels(savedKey, true)}
              disabled={loadingModels || !savedKey}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] transition-colors hover:border-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingModels ? 'animate-spin' : ''}`}
              />
              <span>Refresh Models</span>
            </button>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="model-select"
                className="text-sm font-semibold text-[#1E1B4B]"
              >
                Gemini Model
              </label>
              <span className="text-xs text-slate-500">
                {modelsLive ? 'Live list from Google AI' : 'Recommended defaults'}
              </span>
            </div>
            <select
              id="model-select"
              value={settings.model}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, model: e.target.value }))
              }
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-sm font-medium text-[#1E1B4B] focus:border-[#4338CA] focus:outline-none"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName} — {m.tier}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Choose <strong>Flash (fast)</strong> for quick daily study &amp; quizzes, or <strong>Pro (high quality)</strong> for complex STEM and long essays.
            </p>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="temperature-slider"
                className="text-sm font-semibold text-[#1E1B4B]"
              >
                Temperature (Creativity)
              </label>
              <span className="tabular-nums rounded-lg border border-slate-200 bg-[#F8FAFC] px-2.5 py-0.5 text-xs font-semibold text-[#4338CA]">
                {settings.temperature.toFixed(2)} · {temperatureLabel}
              </span>
            </div>
            <input
              id="temperature-slider"
              type="range"
              min={0.2}
              max={0.7}
              step={0.05}
              value={settings.temperature}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  temperature: Number(e.target.value),
                }))
              }
              className="h-2 w-full cursor-pointer accent-[#4338CA]"
            />
            <div className="mt-1.5 flex justify-between text-xs text-slate-500">
              <span>0.2 — সবচেয়ে নির্ভুল (Accurate)</span>
              <span>0.7 — সৃজনশীল (Creative)</span>
            </div>
            {isGemini4Selected && (
              <p className="mt-2 text-xs text-slate-500">
                Note: Gemini 4 series models manage sampling internally; this temperature preference is automatically applied when using Gemini 2.5 or Gemini 3 models.
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-[#4338CA] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3730A3]"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
