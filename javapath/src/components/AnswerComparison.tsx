import { useState } from 'react';
import { SafeHtml } from './SafeHtml';

interface AnswerComparisonProps {
  userAnswer: string;
  referenceAnswer: string;
  keyPoints: string[];
  onScore: (covered: number, total: number) => void;
}

export function AnswerComparison({ userAnswer, referenceAnswer, keyPoints, onScore }: AnswerComparisonProps) {
  const [checked, setChecked] = useState<boolean[]>(keyPoints.map(() => false));

  const toggleCheck = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
    onScore(next.filter(Boolean).length, keyPoints.length);
  };

  const covered = checked.filter(Boolean).length;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>你的回答</div>
          <div style={{
            padding: 12, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)',
            fontSize: 13, lineHeight: 1.7, minHeight: 100, whiteSpace: 'pre-wrap'
          }}>
            {userAnswer || '（未填写）'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>参考答案</div>
          <div style={{
            padding: 12, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)',
            fontSize: 13, lineHeight: 1.7, minHeight: 100
          }}>
            <SafeHtml html={referenceAnswer} />
          </div>
        </div>
      </div>

      {keyPoints.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
            关键要点覆盖 ({covered}/{keyPoints.length})
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            {keyPoints.map((point, i) => (
              <label key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                borderRadius: 6, cursor: 'pointer', fontSize: 13,
                background: checked[i] ? 'var(--success)' + '15' : 'transparent',
                border: `1px solid ${checked[i] ? 'var(--success)' : 'var(--line)'}`
              }}>
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => toggleCheck(i)}
                  style={{ accentColor: 'var(--success)' }}
                />
                <span>{point}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
