import type { Cefr, ExportFormat, Session, Settings } from '@/types';

/**
 * localStorage persistence + one-time migration from the old prototype.
 */

const PREFIX = 'replay_';
const OLD_PREFIX = 'sprachjournal_';
const MIGRATED_FLAG = 'replay_migrated';

/** Key suffixes shared by the old (`sprachjournal_`) and new (`replay_`) prefixes. */
const KEYS = {
  deepgram: 'deepgram_key',
  gemini: 'gemini_key',
  localOnly: 'local_only',
  autoDetect: 'auto_detect',
  sessions: 'sessions',
  exportFormat: 'export_format',
  userCefr: 'user_cefr',
} as const;

function get(suffix: string): string | null {
  return localStorage.getItem(PREFIX + suffix);
}

function set(suffix: string, value: string): void {
  localStorage.setItem(PREFIX + suffix, value);
}

/**
 * One-time migration: copy any `sprachjournal_*` values into the matching
 * `replay_*` key when the new key is absent. Old keys are left intact so the
 * original prototype keeps working. Runs at most once (guarded by a flag).
 */
export function migrateLegacyStorage(): void {
  if (localStorage.getItem(MIGRATED_FLAG)) return;
  for (const suffix of Object.values(KEYS)) {
    const newKey = PREFIX + suffix;
    const oldKey = OLD_PREFIX + suffix;
    if (localStorage.getItem(newKey) === null) {
      const oldVal = localStorage.getItem(oldKey);
      if (oldVal !== null) localStorage.setItem(newKey, oldVal);
    }
  }
  localStorage.setItem(MIGRATED_FLAG, '1');
}

/** Load persisted settings, applying defaults for any missing values. */
export function loadSettings(): Settings {
  return {
    deepgramKey: get(KEYS.deepgram) || '',
    geminiKey: get(KEYS.gemini) || '',
    autoDetect: get(KEYS.autoDetect) === '1',
    localStorageOnly: get(KEYS.localOnly) === '1',
    exportFormat: (get(KEYS.exportFormat) as ExportFormat) || 'md',
    userCefr: (get(KEYS.userCefr) as Cefr) || 'B1',
  };
}

/** Persist all settings. */
export function saveSettings(s: Settings): void {
  set(KEYS.deepgram, s.deepgramKey);
  set(KEYS.gemini, s.geminiKey);
  set(KEYS.autoDetect, s.autoDetect ? '1' : '0');
  set(KEYS.localOnly, s.localStorageOnly ? '1' : '0');
  set(KEYS.exportFormat, s.exportFormat);
  set(KEYS.userCefr, s.userCefr);
}

/** Load all saved sessions (newest first, as stored). */
export function loadSessions(): Session[] {
  const raw = get(KEYS.sessions);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Session[]) : [];
  } catch {
    return [];
  }
}

/** Persist all sessions. */
export function saveSessions(sessions: Session[]): void {
  set(KEYS.sessions, JSON.stringify(sessions));
}
