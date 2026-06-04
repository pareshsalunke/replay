import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessionsStore';
import {
  CONSTRUCT_TYPES,
  constructFrequency,
  correctionCounts,
  topWeakness,
  cefrTrend,
  insightsSummary,
} from '@/lib/insights';
import { formatDuration } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { BarRow } from '@/components/ui/BarRow';
import { Icon } from '@/components/ui/Icon';
import { CefrTrendChart } from '@/components/insights/CefrTrendChart';
import shared from './screens.module.css';
import styles from './InsightsScreen.module.css';

const TYPE_LABEL: Record<(typeof CONSTRUCT_TYPES)[number], string> = {
  verb: 'Verbs',
  case: 'Cases',
  syntax: 'Syntax',
  vocab: 'Vocabulary',
};

/** Insights — cross-session grammar analytics and CEFR trend. */
export function InsightsScreen() {
  const sessions = useSessionsStore((s) => s.sessions);

  const summary = useMemo(() => insightsSummary(sessions), [sessions]);
  const freq = useMemo(() => constructFrequency(sessions), [sessions]);
  const corr = useMemo(() => correctionCounts(sessions), [sessions]);
  const weak = useMemo(() => topWeakness(sessions, 5), [sessions]);
  const trend = useMemo(() => cefrTrend(sessions), [sessions]);

  const freqMax = Math.max(...CONSTRUCT_TYPES.map((t) => freq[t]), 1);
  const corrMax = Math.max(...CONSTRUCT_TYPES.map((t) => corr[t]), 1);
  const topFreqType = CONSTRUCT_TYPES.reduce((a, b) => (freq[b] > freq[a] ? b : a));

  return (
    <>
      <div className={shared.pageHead}>
        <h1>Insights</h1>
        <p>
          Patterns across every session — which constructs you use, where mistakes recur, and how
          your level trends over time.
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <div className={shared.emptyState}>
            <strong>No insights yet</strong>
            Record and analyze a few sessions to see your trends.
          </div>
        </Card>
      ) : (
        <>
          <div className={styles.summary}>
            <div className={styles.statTile}>
              <span className={styles.kLabel}>Sessions</span>
              <span className={styles.kValue}>{summary.totalSessions}</span>
            </div>
            <div className={styles.statTile}>
              <span className={styles.kLabel}>Constructs</span>
              <span className={styles.kValue}>{summary.totalConstructs}</span>
            </div>
            <div className={styles.statTile}>
              <span className={styles.kLabel}>Corrections</span>
              <span className={styles.kValue}>{summary.totalCorrections}</span>
            </div>
            <div className={styles.statTile}>
              <span className={styles.kLabel}>CEFR</span>
              <span className={styles.cefrRange}>
                {summary.startingCefr ?? '—'}
                <Icon name="arrowRight" size={14} />
                {summary.currentCefr ?? '—'}
              </span>
            </div>
            <div className={styles.statTile}>
              <span className={styles.kLabel}>Speaking time</span>
              <span className={styles.kValue}>{formatDuration(summary.totalSeconds)}</span>
            </div>
          </div>

          <div className={styles.row2}>
            <Card title="Construct frequency">
              <div className={styles.cardBody}>
                {CONSTRUCT_TYPES.map((t) => (
                  <BarRow
                    key={t}
                    name={TYPE_LABEL[t]}
                    pct={(freq[t] / freqMax) * 100}
                    value={freq[t]}
                    accent={t === topFreqType}
                  />
                ))}
                <span className={styles.foot}>Notable constructs flagged across all sessions</span>
              </div>
            </Card>

            <Card title="Needs work · corrections">
              <div className={styles.cardBody}>
                <div className={styles.weakness}>
                  {weak ? (
                    <>
                      <span className={styles.weaknessLabel}>Top weakness · last 5 sessions</span>
                      <span className={styles.weaknessValue}>
                        {TYPE_LABEL[weak.type]} · {weak.count} correction
                        {weak.count !== 1 ? 's' : ''}
                      </span>
                    </>
                  ) : (
                    <span className={styles.weaknessClean}>No corrections flagged — clean sessions.</span>
                  )}
                </div>
                {CONSTRUCT_TYPES.map((t) => (
                  <BarRow
                    key={t}
                    name={TYPE_LABEL[t]}
                    pct={(corr[t] / corrMax) * 100}
                    value={corr[t]}
                    accent={weak?.type === t}
                  />
                ))}
                <span className={styles.foot}>Corrected mistakes by construct type</span>
              </div>
            </Card>
          </div>

          <Card title="CEFR over time">
            <div className={styles.cardBody}>
              <CefrTrendChart points={trend} />
              <span className={styles.foot}>
                {summary.startingCefr ?? '—'} → {summary.currentCefr ?? '—'} across{' '}
                {summary.totalSessions} session{summary.totalSessions !== 1 ? 's' : ''}
              </span>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
