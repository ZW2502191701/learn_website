import { Clock } from 'lucide-react';
import type { InterviewQuestion } from '../../types';

export function QuestionPanel({
  question,
  index,
  total,
  elapsed
}: {
  question: InterviewQuestion;
  index: number;
  total: number;
  elapsed: number;
}) {
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          第 {index + 1}/{total} 题
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
          <Clock size={12} /> {mins}:{secs.toString().padStart(2, '0')}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
        {question.category} · 难度 {question.difficulty}/5
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5 }}>{question.title}</h3>
    </div>
  );
}
