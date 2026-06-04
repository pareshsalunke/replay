import { CEFR_ORDER, cefrColor } from '@/lib/cefr';
import type { CefrTrendPoint } from '@/lib/insights';
import styles from './CefrTrendChart.module.css';

interface CefrTrendChartProps {
  points: CefrTrendPoint[];
  /** Plot height in px (default 140). */
  height?: number;
}

/** Vertical % position (0 = top) for a CEFR index, with top/bottom padding. */
function yPercent(index: number): number {
  const maxIndex = CEFR_ORDER.length - 1; // 5
  const frac = 1 - index / maxIndex; // higher CEFR → higher on screen
  // Pad 8% top and bottom so dots/labels don't clip.
  return 8 + frac * 84;
}

/** Horizontal % position for a point i of n. */
function xPercent(i: number, n: number): number {
  if (n <= 1) return 50;
  return (i / (n - 1)) * 100;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * CEFR-over-time line chart. Dependency-free: a stretched-viewBox SVG polyline
 * (crisp via non-scaling-stroke) with dots positioned in CSS percentages so
 * they stay round and need no resize measurement.
 */
export function CefrTrendChart({ points, height = 140 }: CefrTrendChartProps) {
  if (points.length === 0) return null;

  const polyline = points
    .map((p, i) => `${xPercent(i, points.length)},${yPercent(p.index)}`)
    .join(' ');

  return (
    <div className={styles.wrap}>
      {/* CEFR axis labels, high → low to match the inverted Y. */}
      <div className={styles.axis} style={{ height }}>
        {[...CEFR_ORDER].reverse().map((level) => (
          <span key={level}>{level}</span>
        ))}
      </div>

      <div className={styles.plotCol}>
        <div className={styles.plot} style={{ height }}>
          {/* Faint horizontal gridlines, one per CEFR band. */}
          {CEFR_ORDER.map((level, i) => (
            <div
              key={level}
              className={styles.grid}
              style={{ top: `${yPercent(i)}%` }}
              aria-hidden="true"
            />
          ))}

          {points.length > 1 && (
            <svg
              className={styles.svg}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points={polyline}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          )}

          {points.map((p, i) => (
            <span
              key={p.sessionId}
              className={styles.dot}
              style={{
                left: `${xPercent(i, points.length)}%`,
                top: `${yPercent(p.index)}%`,
                background: cefrColor(p.cefr),
              }}
              title={`${p.title} · ${p.cefr} · ${shortDate(p.date)}`}
            />
          ))}
        </div>

        {/* X labels: first and last only, to avoid crowding. */}
        <div className={styles.xlabels}>
          <span>{shortDate(points[0].date)}</span>
          {points.length > 1 && <span>{shortDate(points[points.length - 1].date)}</span>}
        </div>
      </div>
    </div>
  );
}
