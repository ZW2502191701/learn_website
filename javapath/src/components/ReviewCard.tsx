import { useState } from 'react';
import { SafeHtml } from './SafeHtml';
import type { InterviewQuestion } from '../types';

interface ReviewCardProps {
  question: InterviewQuestion;
  moduleTitle: string;
  daysOverdue?: number;
  onScore: (quality: number) => void;
}

const SCORE_BTN = [
  { label: '完全不会', q: 0, color: 'var(--danger)' },
  { label: '模糊', q: 2, color: 'var(--warning)' },
  { label: '基本会', q: 3, color: 'var(--muted)' },
  { label: '很熟', q: 4, color: 'var(--accent)' },
  { label: '秒答', q: 5, color: 'var(--success)' }
];

export function ReviewCard({ question, moduleTitle, daysOverdue, onScore }: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="panel" style={{ padding: 20, display: 'grid', gap: 14, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{moduleTitle} · {question.category}</span>
        {daysOverdue !== undefined && daysOverdue > 0 && (
          <span style={{ fontSize: 11, color: 'var(--danger)' }}>逾期 {daysOverdue} 天</span>
        )}
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5 }}>{question.title}</h3>

      {!revealed ? (
        <button type="button" className="primary-btn" onClick={() => setRevealed(true)}>
          展开答案
        </button>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{
            padding: 14,
            borderRadius: 8,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            fontSize: 13,
            lineHeight: 1.7
          }}>
            <SafeHtml html={question.answer} />
          </div>

          {question.points.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>关键要点</div>
              <ul style={{ margin: 0, paddingInlineStart: 16, fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
                {question.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>你掌握了吗？</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SCORE_BTN.map((btn) => (
                <button
                  key={btn.q}
                  type="button"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: `1px solid ${btn.color}`,
                    background: 'transparent',
                    color: btn.color,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onScore(btn.q)}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = btn.color;
                    (e.target as HTMLElement).style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = 'transparent';
                    (e.target as HTMLElement).style.color = btn.color;
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
