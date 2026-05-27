import type { Cefr } from '@/types';

/** CEFR levels in ascending order. */
export const CEFR_ORDER: readonly Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * CSS color (a `var()` reference) for a CEFR level.
 * A-levels → good (green), B-levels → accent, C-levels → info (blue).
 */
export function cefrColor(cefr: string): string {
  if (!cefr) return 'var(--accent)';
  const l = cefr.toUpperCase();
  if (l.startsWith('A')) return 'var(--good)';
  if (l.startsWith('B')) return 'var(--accent)';
  if (l.startsWith('C')) return 'var(--info)';
  return 'var(--accent)';
}

/** Human-readable label for a CEFR level. */
export function cefrLabel(cefr: string): string {
  if (!cefr) return '';
  const l = cefr.toUpperCase();
  if (l === 'A1') return 'Beginner';
  if (l === 'A2') return 'Elementary';
  if (l === 'B1') return 'Intermediate';
  if (l === 'B2') return 'Upper Intermediate';
  if (l === 'C1') return 'Advanced';
  if (l === 'C2') return 'Mastery';
  return 'Advanced';
}

/**
 * Average CEFR level across a list (e.g. for a paragraph group or a session).
 * Returns `null` when the list contains no valid levels.
 */
export function modeCefr(cefrList: string[]): Cefr | null {
  const order: string[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const valid = cefrList.map((c) => (c || '').toUpperCase()).filter((c) => order.includes(c));
  if (!valid.length) return null;
  const avgIdx = Math.round(
    valid.map((c) => order.indexOf(c)).reduce((a, b) => a + b, 0) / valid.length,
  );
  return order[Math.max(0, Math.min(5, avgIdx))] as Cefr;
}

/** Mastery-bar fill percentage for a CEFR level (prototype's order map). */
const MASTERY_PCT: Record<Cefr, number> = { A1: 16, A2: 32, B1: 50, B2: 66, C1: 82, C2: 100 };

export function masteryPct(cefr: string): number {
  return MASTERY_PCT[(cefr || '').toUpperCase() as Cefr] ?? 50;
}
