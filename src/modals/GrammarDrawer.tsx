import { useCallback, useEffect, useState } from 'react';
import type { ChatMessage, GrammarTarget, GrammarType } from '@/types';
import { useGrammarStore } from '@/store/grammarStore';
import { callGemini, callGeminiStream } from '@/services/gemini';
import { explanationPrompt, gradingPrompt } from '@/services/prompts';
import { trackGrammarDeepDive } from '@/services/analytics';
import { getGeminiKey } from '@/services/apiKeys';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import modal from './modals.module.css';
import styles from './GrammarDrawer.module.css';

const TYPE_COLORS: Record<GrammarType, string> = {
  verb: '#d46a43',
  case: '#3a5a78',
  syntax: '#5a7156',
  vocab: '#8b5e83',
  lexicon: '#8b5e83',
};

const TYPE_LABELS: Record<GrammarType, string> = {
  verb: 'Verb form',
  case: 'Grammatical case',
  syntax: 'Syntactic structure',
  vocab: 'Advanced lexicon',
  lexicon: 'Advanced lexicon',
};

/** Grammar deep-dive drawer — streamed explanation + practice grading. */
export function GrammarDrawer() {
  const isOpen = useGrammarStore((s) => s.isOpen);
  const target = useGrammarStore((s) => s.target);
  const close = useGrammarStore((s) => s.close);

  return (
    <Drawer open={isOpen} onClose={close}>
      {target && (
        <GrammarContent
          key={`${target.word}|${target.sentence}`}
          target={target}
          onClose={close}
        />
      )}
    </Drawer>
  );
}

type ExplState = 'loading' | 'done' | 'error' | 'noKey';

/** Inner content — re-mounts per highlight (keyed), so state is always fresh. */
function GrammarContent({ target, onClose }: { target: GrammarTarget; onClose: () => void }) {
  const geminiKey = getGeminiKey();
  const [explanation, setExplanation] = useState('');
  const [explState, setExplState] = useState<ExplState>('loading');
  const [errorTransient, setErrorTransient] = useState(false);

  const color = TYPE_COLORS[target.type];

  const loadExplanation = useCallback(async () => {
    if (!geminiKey) {
      setExplState('noKey');
      return;
    }
    setExplState('loading');
    setExplanation('');
    let full = '';
    try {
      await callGeminiStream(
        geminiKey,
        explanationPrompt(target.word, target.type, target.sentence),
        (chunk) => {
          full += chunk;
          setExplanation(full);
        },
      );
      setExplState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorTransient(/50[03]|429/.test(msg));
      setExplState('error');
    }
  }, [geminiKey, target]);

  useEffect(() => {
    void loadExplanation();
  }, [loadExplanation]);

  useEffect(() => {
    trackGrammarDeepDive(target.type);
  }, [target.type]);

  return (
    <>
      <div className={styles.head}>
        <span className={styles.kicker}>Grammar deep-dive</span>
        <button className={modal.iconBtn} type="button" onClick={onClose} aria-label="Close">
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className={styles.body}>
        <h2 className={styles.word} style={{ color }}>
          {target.word}
        </h2>

        <div className={styles.typeTags}>
          <Pill style={{ borderColor: `${color}55`, color, background: `${color}12` }}>
            {TYPE_LABELS[target.type]}
          </Pill>
          {target.reason && <Pill>{target.reason}</Pill>}
        </div>

        {target.correction && (
          <div className={`${modal.callout} ${modal.calloutAccent}`}>
            <span className={modal.calloutLabel}>Correction</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{target.correction}</span>
          </div>
        )}

        {target.alternatives.length > 0 && (
          <div className={modal.callout}>
            <span className={modal.calloutLabel}>Alternative phrasings</span>
            <div className={styles.altList}>
              {target.alternatives.map((a, i) => (
                <span key={i}>{a}</span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.explanation}>
          {explState === 'loading' && !explanation && (
            <p className={styles.loadingRow}>
              <Spinner /> Consulting the tutor…
            </p>
          )}
          {explState === 'noKey' && (
            <p className={styles.errorText}>
              Grammar analysis is not configured on this deployment.
            </p>
          )}
          {explState === 'error' && (
            <>
              <p className={styles.errorText}>
                {errorTransient
                  ? 'Gemini is busy — please try again.'
                  : 'Explanation unavailable.'}
              </p>
              <button
                className={styles.retryBtn}
                type="button"
                onClick={() => void loadExplanation()}
              >
                Try again
              </button>
            </>
          )}
          {explanation &&
            explanation
              .split(/\n\n+/)
              .map((para, i) => <p key={i}>{para.trim()}</p>)}
        </div>

        <PracticeSection target={target} geminiKey={geminiKey} />
      </div>
    </>
  );
}

function PracticeSection({ target, geminiKey }: { target: GrammarTarget; geminiKey: string }) {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const chatMessages = useGrammarStore((s) => s.chatMessages);
  const addChatMessage = useGrammarStore((s) => s.addChatMessage);
  const updateChatMessage = useGrammarStore((s) => s.updateChatMessage);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || submitting) return;
    setInput('');
    addChatMessage({ id: crypto.randomUUID(), role: 'user', text, status: 'done' });

    const aiId = crypto.randomUUID();
    addChatMessage({ id: aiId, role: 'ai', text: 'Grading…', status: 'pending' });

    if (!geminiKey) {
      updateChatMessage(aiId, {
        text: 'Grammar grading is not configured on this deployment.',
        status: 'done',
      });
      return;
    }

    setSubmitting(true);
    try {
      const raw = await callGemini(geminiKey, gradingPrompt(text, target.word, target.type));
      const lines = raw.split('\n');
      const correctLine = lines.find((l) => l.startsWith('CORRECT:'));
      const feedbackLine = lines.find((l) => l.startsWith('FEEDBACK:'));
      const isCorrect = correctLine?.includes('true') ?? false;
      const feedback = feedbackLine?.replace('FEEDBACK:', '').trim() || raw;
      updateChatMessage(aiId, { text: feedback, status: 'done', correct: isCorrect });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateChatMessage(aiId, { text: `Grading failed: ${msg}`, status: 'done' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.practiceSection}>
        <div className={styles.practiceLabel}>Practice input</div>
        <input
          className={modal.input}
          placeholder="Write your own sentence using this rule…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSubmit();
          }}
        />
        <Button
          variant="primary"
          className={modal.fullBtn}
          style={{ marginTop: 12 }}
          onClick={() => void handleSubmit()}
          disabled={submitting}
        >
          Submit for analysis
        </Button>
        <div className={styles.privacyRow}>
          <Icon name="lock" size={12} />
          End-to-end · Gemini 2.5 Flash
        </div>
      </div>

      {chatMessages.length > 0 && (
        <div className={styles.chatBubbles}>
          {chatMessages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
        </div>
      )}
    </>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return <div className={styles.bubbleUser}>{message.text}</div>;
  }

  if (message.status === 'pending') {
    return (
      <div className={styles.bubbleAi}>
        <div className={styles.gradingRow}>
          <Spinner /> {message.text}
        </div>
      </div>
    );
  }

  const graded = message.correct !== undefined;
  const cls = [
    styles.bubbleAi,
    graded && (message.correct ? styles.bubbleCorrect : styles.bubbleIncorrect),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      {graded && (
        <div
          className={styles.bubbleResult}
          style={{ color: message.correct ? 'var(--good)' : 'var(--accent)' }}
        >
          {message.correct ? '✓ Correct' : '✗ Incorrect'}
        </div>
      )}
      <p className={styles.bubbleText}>{message.text}</p>
    </div>
  );
}
