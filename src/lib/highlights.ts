import type { Highlight } from '@/types';

/** One piece of a sentence: either plain text or a clickable highlight. */
export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'highlight'; text: string; highlight: Highlight };

/**
 * Split `text` into alternating plain-text and highlight segments.
 *
 * Single forward pass: each highlight is located by `indexOf` in the original
 * text, sorted by position, and overlapping highlights are dropped (leftmost
 * wins). This avoids the sequential-replace bug from the prototype where a
 * later highlight could match inside an earlier highlight's injected markup.
 *
 * Returns plain data — the caller renders it as React nodes, so no HTML
 * escaping is needed (React escapes text nodes automatically).
 */
export function computeHighlightSpans(text: string, highlights: Highlight[]): Segment[] {
  if (!highlights || highlights.length === 0) {
    return [{ kind: 'text', text }];
  }

  // Locate each highlight in the original text; drop any not found.
  const positioned = highlights
    .map((h) => ({ h, start: text.indexOf(h.text), len: h.text.length }))
    .filter((item) => item.start >= 0)
    .sort((a, b) => a.start - b.start);

  // Keep only non-overlapping spans (leftmost wins).
  const spans: typeof positioned = [];
  let cursor = 0;
  for (const item of positioned) {
    if (item.start >= cursor) {
      spans.push(item);
      cursor = item.start + item.len;
    }
  }

  // Build alternating segments.
  const segments: Segment[] = [];
  let pos = 0;
  for (const { h, start, len } of spans) {
    if (start > pos) segments.push({ kind: 'text', text: text.slice(pos, start) });
    segments.push({ kind: 'highlight', text: text.slice(start, start + len), highlight: h });
    pos = start + len;
  }
  if (pos < text.length) segments.push({ kind: 'text', text: text.slice(pos) });
  return segments;
}
