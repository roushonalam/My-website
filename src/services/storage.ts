import { DEFAULT_MODEL_ID } from '../constants/prompts';
import type { AppSettings, ChatMessage, ModelOption } from '../types';

const API_KEY_STORAGE_KEY = 'edugenius_gemini_api_key_v1';
const REMEMBER_FLAG_KEY = 'edugenius_remember_key_v1';
const SETTINGS_STORAGE_KEY = 'edugenius_settings_v1';
const MODELS_CACHE_KEY = 'edugenius_models_cache_v1';
const TUTOR_HISTORY_KEY = 'edugenius_tutor_history_v1';

const MAX_SAVED_MESSAGES = 40;

export function getApiKey(): string {
  try {
    const sessionKey = window.sessionStorage.getItem(API_KEY_STORAGE_KEY);
    if (sessionKey && sessionKey.trim()) {
      return sessionKey.trim();
    }
    const localKey = window.localStorage.getItem(API_KEY_STORAGE_KEY);
    if (localKey && localKey.trim()) {
      return localKey.trim();
    }
    return '';
  } catch {
    return '';
  }
}

export function isKeyRemembered(): boolean {
  try {
    return window.localStorage.getItem(REMEMBER_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setApiKey(key: string, rememberOnDevice: boolean): void {
  const cleanKey = key.trim();
  try {
    window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    window.localStorage.removeItem(REMEMBER_FLAG_KEY);

    if (!cleanKey) {
      return;
    }

    if (rememberOnDevice) {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, cleanKey);
      window.localStorage.setItem(REMEMBER_FLAG_KEY, 'true');
    } else {
      window.sessionStorage.setItem(API_KEY_STORAGE_KEY, cleanKey);
      window.localStorage.setItem(REMEMBER_FLAG_KEY, 'false');
    }
  } catch {
    // Ignore storage quota / privacy mode errors gracefully
  }
}

export function removeApiKey(): void {
  try {
    window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    window.localStorage.removeItem(REMEMBER_FLAG_KEY);
    const current = getSettings();
    saveSettings({
      ...current,
      connectionStatus: 'not_configured',
      lastError: undefined,
    });
  } catch {
    // Ignore storage errors
  }
}

export function maskApiKey(key: string): string {
  const clean = key.trim();
  if (!clean) return '';
  if (clean.length <= 10) return '••••••••';
  return `${clean.slice(0, 6)}••••••••••••${clean.slice(-4)}`;
}

export function getSettings(): AppSettings {
  const keyExists = Boolean(getApiKey());
  const defaultSettings: AppSettings = {
    model: DEFAULT_MODEL_ID,
    temperature: 0.4,
    connectionStatus: keyExists ? 'not_configured' : 'not_configured',
  };

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const temp =
      typeof parsed.temperature === 'number'
        ? Math.min(0.7, Math.max(0.2, parsed.temperature))
        : 0.4;

    return {
      model:
        typeof parsed.model === 'string' && parsed.model.trim()
          ? parsed.model.trim()
          : DEFAULT_MODEL_ID,
      temperature: Number(temp.toFixed(2)),
      connectionStatus: keyExists
        ? parsed.connectionStatus === 'connected' || parsed.connectionStatus === 'error'
          ? parsed.connectionStatus
          : 'not_configured'
        : 'not_configured',
      lastTestedAt: parsed.lastTestedAt,
      lastError: parsed.lastError,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    const clampedTemp = Math.min(0.7, Math.max(0.2, settings.temperature));
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...settings,
        temperature: Number(clampedTemp.toFixed(2)),
      })
    );
  } catch {
    // Ignore storage errors
  }
}

export function getCachedModels(): ModelOption[] | null {
  try {
    const raw = window.sessionStorage.getItem(MODELS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ModelOption[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function setCachedModels(models: ModelOption[]): void {
  try {
    window.sessionStorage.setItem(MODELS_CACHE_KEY, JSON.stringify(models));
  } catch {
    // Ignore storage errors
  }
}

export function getTutorHistory(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(TUTOR_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m) =>
        m &&
        typeof m.id === 'string' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    );
  } catch {
    return [];
  }
}

export function saveTutorHistory(messages: ChatMessage[]): void {
  try {
    // Only persist non-error messages, capped to prevent storage bloat
    const clean = messages.filter((m) => !m.isError).slice(-MAX_SAVED_MESSAGES);
    window.localStorage.setItem(TUTOR_HISTORY_KEY, JSON.stringify(clean));
  } catch {
    // Ignore storage errors
  }
}

export function clearTutorHistory(): void {
  try {
    window.localStorage.removeItem(TUTOR_HISTORY_KEY);
  } catch {
    // Ignore storage errors
  }
}
