import {
  AlertTriangle,
  Bot,
  CalendarDays,
  MessageSquarePlus,
  RotateCcw,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiKeyNotice } from '../components/ApiKeyNotice';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useToast } from '../components/Toast';
import { TUTOR_QUICK_CHIPS } from '../constants/prompts';
import { createStudyPlan, mapGeminiError, tutorChat } from '../services/gemini';
import {
  clearTutorHistory,
  getApiKey,
  getTutorHistory,
  saveTutorHistory,
} from '../services/storage';
import type { ChatMessage } from '../types';

interface LocationState {
  prefilledQuestion?: string;
  autoSend?: boolean;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TutorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const hasApiKey = Boolean(getApiKey());

  const [messages, setMessages] = useState<ChatMessage[]>(() => getTutorHistory());
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [validationError, setValidationError] = useState('');

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    saveTutorHistory(messages);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async (
    textToSend: string,
    options?: { forceStudyPlan?: boolean }
  ) => {
    const clean = textToSend.trim();
    if (!clean) {
      setValidationError(
        'অনুগ্রহ করে একটি প্রশ্ন বা বার্তা লিখুন · Please write a message.'
      );
      return;
    }
    if (sending) return;

    setValidationError('');
    setConfirmClear(false);

    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: clean,
      timestamp: new Date().toISOString(),
    };

    const historySnapshot = [...messages, userMsg];
    setMessages(historySnapshot);
    setInput('');
    setSending(true);

    const isStudyPlanRequest =
      Boolean(options?.forceStudyPlan) ||
      /পড়ার রুটিন|study\s*(plan|routine|schedule)|weekly\s*plan/i.test(clean);

    try {
      const reply = isStudyPlanRequest
        ? await createStudyPlan(clean)
        : await tutorChat(clean, messages);

      const aiMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        isStudyPlan: isStudyPlanRequest,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const mapped = mapGeminiError(err);
      const errMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: `${mapped.messageBn}\n\n${mapped.messageEn}`,
        timestamp: new Date().toISOString(),
        isError: true,
        failedPrompt: clean,
        isStudyPlan: isStudyPlanRequest,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  // Handle prefilled question passed from Landing page
  useEffect(() => {
    const state = (location.state as LocationState | null) ?? null;
    if (state?.prefilledQuestion && !autoSentRef.current) {
      autoSentRef.current = true;
      const q = state.prefilledQuestion;
      const shouldAutoSend = Boolean(state.autoSend);
      navigate('.', { replace: true, state: null });
      if (shouldAutoSend) {
        void sendMessage(q);
      } else {
        setInput(q);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleRetryFailed = (failedMsg: ChatMessage) => {
    if (!failedMsg.failedPrompt || sending) return;
    // Remove the error bubble and resend cleanly
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    void resendPromptOnly(failedMsg.failedPrompt, failedMsg.isStudyPlan);
  };

  const resendPromptOnly = async (promptText: string, isStudyPlan?: boolean) => {
    setSending(true);
    try {
      const reply = isStudyPlan
        ? await createStudyPlan(promptText)
        : await tutorChat(promptText, messages.filter((m) => !m.isError));
      const aiMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        isStudyPlan,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const mapped = mapGeminiError(err);
      const errMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: `${mapped.messageBn}\n\n${mapped.messageEn}`,
        timestamp: new Date().toISOString(),
        isError: true,
        failedPrompt: promptText,
        isStudyPlan,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleConfirmClear = () => {
    clearTutorHistory();
    setMessages([]);
    setConfirmClear(false);
    showToast('Conversation cleared.', 'info');
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
            Live AI Tutor
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            বাংলা ও ইংরেজিতে ব্যক্তিগত মেন্টরের সাথে কথা বলুন, প্যারাগ্রাফ চেক করুন বা পড়ার রুটিন নিন।
          </p>
        </div>

        {messages.length > 0 && (
          <div className="shrink-0">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-red-300 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Conversation</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5">
                <span className="text-xs font-medium text-red-900">
                  Clear all chat history?
                </span>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="rounded-lg bg-red-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-800"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!hasApiKey && (
        <div className="mb-5">
          <ApiKeyNotice compact />
        </div>
      )}

      {/* Quick Chips */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold text-slate-500">
          Quick Prompts · দ্রুত শুরু করুন
        </p>
        <div className="flex flex-wrap gap-2">
          {TUTOR_QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={sending}
              onClick={() =>
                void sendMessage(chip.prompt, {
                  forceStudyPlan: chip.isStudyPlan,
                })
              }
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-[#1E1B4B] shadow-xs transition-colors hover:border-[#4338CA] hover:bg-indigo-50/50 hover:text-[#4338CA] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chip.isStudyPlan && (
                <CalendarDays className="h-3.5 w-3.5 text-[#7C3AED]" />
              )}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Viewport */}
      <div className="flex min-h-[420px] max-h-[60vh] flex-1 flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {messages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4338CA]/10 text-[#4338CA]">
              <MessageSquarePlus className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-base font-bold text-[#1E1B4B]">
              Start a Conversation with EduGenius AI
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">
              Ask any academic question in Bengali or English, or tap one of the quick chips above—such as generating a structured 7-day study routine.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              if (msg.isError) {
                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="max-w-2xl rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-950">
                      <MarkdownRenderer content={msg.content} />
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {msg.failedPrompt && (
                          <button
                            type="button"
                            onClick={() => handleRetryFailed(msg)}
                            disabled={sending}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-red-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>আবার চেষ্টা করুন (Retry)</span>
                          </button>
                        )}
                        <Link
                          to="/settings"
                          className="inline-flex min-h-[36px] items-center rounded-xl border border-red-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100"
                        >
                          Settings
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    isUser ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      isUser
                        ? 'bg-[#4338CA] text-white'
                        : 'bg-[#7C3AED]/10 text-[#7C3AED]'
                    }`}
                  >
                    {isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-[80%] ${
                      isUser
                        ? 'bg-[#1E1B4B] text-white'
                        : 'border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B]'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-start gap-3" aria-live="polite">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED]">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#7C3AED]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#7C3AED] [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#7C3AED] [animation-delay:300ms]" />
                    <span className="ml-1 text-xs font-medium text-slate-500">
                      EduGenius AI উত্তর তৈরি করছে...
                    </span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-[#4338CA] sm:flex-row sm:items-end">
          <label htmlFor="tutor-chat-input" className="sr-only">
            Message EduGenius AI Tutor
          </label>
          <textarea
            id="tutor-chat-input"
            rows={2}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (validationError) setValidationError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder="আপনার প্রশ্ন লিখুন... (Enter পাঠাতে, Shift+Enter নতুন লাইন)"
            className="min-h-[48px] flex-1 resize-none rounded-xl bg-transparent px-3 py-2.5 text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#4338CA] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3730A3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </div>
        {validationError && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-600">
            {validationError}
          </p>
        )}
      </form>
    </div>
  );
}
