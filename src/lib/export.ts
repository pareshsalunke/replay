import type { ExportFormat, Session } from '@/types';
import { formatDuration } from './format';

/** Build a Markdown export with YAML front-matter and an annotated transcript. */
export function buildMarkdown(session: Session): string {
  const date = new Date(session.date);
  const dateLabel = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const duration = formatDuration(session.durationSeconds || 0);
  const sentences = session.sentences || [];
  const verbCount = sentences.reduce(
    (n, s) => n + (s.highlights || []).filter((h) => h.type === 'verb').length,
    0,
  );
  const caseCount = sentences.reduce(
    (n, s) => n + (s.highlights || []).filter((h) => h.type === 'case').length,
    0,
  );

  let md =
    `---\ntitle: ${session.title}\ndate: ${session.date}\nduration: ${duration}\n` +
    `cefr: ${session.overallCefr || '—'}\nsentences: ${sentences.length}\n` +
    `verb_highlights: ${verbCount}\ncase_highlights: ${caseCount}\n---\n\n`;
  md += `# ${session.title} — ${dateLabel}\n\n## Transcript\n\n`;

  sentences.forEach((sent) => {
    const cefr = sent.cefr ? `[${sent.cefr}]` : '';
    md += `**${cefr}** ${sent.text}\n`;
    if (sent.translation) md += `*"${sent.translation}"*\n`;
    if (sent.highlights && sent.highlights.length > 0) {
      sent.highlights.forEach((h) => {
        md += `\`${h.type}\` ${h.text} — ${h.reason}\n`;
      });
    }
    md += '\n';
  });

  md += `---\n*Replay · Gemini 2.5 Flash · Deepgram Nova-3 · ${new Date().toLocaleDateString()}*\n`;
  return md;
}

/** Build a plain-text export — same content, no Markdown syntax. */
export function buildPlainText(session: Session): string {
  const date = new Date(session.date);
  const dateLabel = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const duration = formatDuration(session.durationSeconds || 0);
  const sentences = session.sentences || [];

  let txt = `Replay — Session Export\n${'='.repeat(50)}\n\n`;
  txt +=
    `Title:    ${session.title}\nDate:     ${dateLabel}\n` +
    `Duration: ${duration}\nCEFR:     ${session.overallCefr || '—'}\n\n`;
  txt += `TRANSCRIPT\n${'-'.repeat(30)}\n\n`;

  sentences.forEach((sent) => {
    const cefr = sent.cefr ? `[${sent.cefr}] ` : '';
    txt += `${cefr}${sent.text}\n`;
    if (sent.translation) txt += `  => "${sent.translation}"\n`;
    if (sent.highlights && sent.highlights.length > 0) {
      sent.highlights.forEach((h) => {
        txt += `  [${h.type}] ${h.text}: ${h.reason}\n`;
      });
    }
    txt += '\n';
  });

  txt += `${'='.repeat(50)}\nReplay · Gemini 2.5 Flash · ${new Date().toLocaleDateString()}\n`;
  return txt;
}

/** Download filename, e.g. "replay-2026-05-22-team-standup.md". */
export function exportFilename(session: Session, format: ExportFormat): string {
  const slug = (session.title || 'session')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);
  const dateStr = new Date(session.date).toISOString().slice(0, 10);
  return `replay-${dateStr}-${slug}.${format}`;
}

/**
 * Trigger a browser download of a session as `.md` or `.txt`.
 * The one impure function in this module — a small, self-contained
 * `<a download>` idiom that works from any browser context.
 */
export function downloadSession(session: Session, format: ExportFormat): void {
  if (!session) return;
  const content = format === 'md' ? buildMarkdown(session) : buildPlainText(session);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFilename(session, format);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
