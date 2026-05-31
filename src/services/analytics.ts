/**
 * Local-first event tracker. Persists a bounded log of events to localStorage so
 * testers can export their usage; optionally forwards each event to Plausible
 * when running on a real (non-localhost) deployment.
 */

const PREFIX = 'replay_';
const EVENTS_KEY = PREFIX + 'events';
const TESTER_ID_KEY = PREFIX + 'tester_id';
const REAL_COUNT_KEY = PREFIX + 'real_capture_count';
const MAX_EVENTS = 2000;
const REAL_CAPTURE_SECONDS = 60;

/** Flip to true once the Plausible snippet's data-domain is wired up. */
const USE_PLAUSIBLE = false;

type EventProps = Record<string, string | number | boolean>;

interface LoggedEvent {
  ts: string;
  testerId: string;
  event: string;
  props: EventProps;
}

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: EventProps }) => void;
    replayStats?: () => void;
  }
}

function isLocalhost(): boolean {
  const h = window.location.hostname;
  return (
    h === 'localhost' ||
    h.startsWith('127.') ||
    h === '0.0.0.0' ||
    h === '[::1]' ||
    h === '::1'
  );
}

function getTesterId(): string {
  let id = localStorage.getItem(TESTER_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(TESTER_ID_KEY, id);
  }
  return id;
}

function readEvents(): LoggedEvent[] {
  const raw = localStorage.getItem(EVENTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LoggedEvent[]) : [];
  } catch {
    return [];
  }
}

function writeEvents(events: LoggedEvent[]): void {
  // Keep only the most recent MAX_EVENTS to bound localStorage usage.
  const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota exceeded or storage unavailable — drop silently.
  }
}

function readRealCount(): number {
  const raw = localStorage.getItem(REAL_COUNT_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function writeRealCount(n: number): void {
  localStorage.setItem(REAL_COUNT_KEY, String(n));
}

export function track(event: string, props: EventProps = {}): void {
  const entry: LoggedEvent = {
    ts: new Date().toISOString(),
    testerId: getTesterId(),
    event,
    props,
  };
  const events = readEvents();
  events.push(entry);
  writeEvents(events);

  if (USE_PLAUSIBLE && !isLocalhost() && typeof window.plausible === 'function') {
    try {
      window.plausible(event, { props });
    } catch {
      // Plausible errors must not affect the app.
    }
  }
}

export function trackAppOpened(): void {
  track('app_opened', {});
}

export function trackCaptureStarted(): void {
  track('capture_started', {});
}

export function trackCaptureCompleted(context: string, seconds: number): void {
  const real = context !== 'testing' && seconds >= REAL_CAPTURE_SECONDS;
  track('capture_completed', { context, seconds, real });
  if (real) {
    const prior = readRealCount();
    if (prior > 0) track('second_real_capture', { context, seconds });
    writeRealCount(prior + 1);
  }
}

export function trackFeedbackViewed(sentenceCount: number): void {
  track('feedback_viewed', { sentenceCount });
}

export function trackGrammarDeepDive(grammarType: string): void {
  track('grammar_deep_dive', { grammarType });
}

export function trackExport(format: string): void {
  track('export', { format });
}

export function exportUsageLog(): void {
  const testerId = getTesterId();
  const payload = {
    testerId,
    exportedAt: new Date().toISOString(),
    realCaptureCount: readRealCount(),
    events: readEvents(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `replay-usage-${testerId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Dev console helper: window.replayStats() prints a count table to the console.
if (typeof window !== 'undefined') {
  window.replayStats = () => {
    const counts = new Map<string, number>();
    for (const e of readEvents()) counts.set(e.event, (counts.get(e.event) ?? 0) + 1);
    const rows = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([event, count]) => ({ event, count }));
    // eslint-disable-next-line no-console
    console.table(rows);
  };
}
