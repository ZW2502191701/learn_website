import { useCallback, useEffect, useState } from 'react';
import { ProgressBar } from './Primitives';
import { ReviewCard } from './ReviewCard';
import { questionLookup, moduleLookup } from '../data/appData';
import { scheduleReview, buildReviewQueue } from '../services/reviewService';
import type { ReviewScheduleItem, UserState } from '../types';

interface SpacedReviewSessionProps {
  state: UserState;
  setState: React.Dispatch<React.SetStateAction<UserState>>;
  onComplete: () => void;
}

export function SpacedReviewSession({ state, setState, onComplete }: SpacedReviewSessionProps) {
  const [queue, setQueue] = useState<Array<ReviewScheduleItem & { questionTitle: string; moduleTitle: string; daysOverdue: number }>>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Array<{ questionId: string; quality: number }>>([]);

  useEffect(() => {
    const q = buildReviewQueue(state, 15);
    setQueue(q);
  }, [state]);

  const handleScore = useCallback((quality: number) => {
    const item = queue[index];
    if (!item) return;

    setState((cur) => scheduleReview(cur, item.questionId, quality));
    setResults((prev) => [...prev, { questionId: item.questionId, quality }]);

    if (index + 1 >= queue.length) {
      onComplete();
    } else {
      setIndex((i) => i + 1);
    }
  }, [queue, index, setState, onComplete]);

  if (queue.length === 0) {
    return (
      <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>当前没有待复习的题目</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>答错的题目会自动加入复习队列</div>
        <button type="button" className="primary-btn" style={{ marginTop: 16 }} onClick={onComplete}>返回</button>
      </div>
    );
  }

  const current = queue[index];
  const question = questionLookup.get(current.questionId);
  if (!question) return null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          进度: {index + 1} / {queue.length}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          已完成: {results.length} · 平均: {results.length > 0 ? (results.reduce((s, r) => s + r.quality, 0) / results.length).toFixed(1) : '-'}
        </div>
      </div>
      <ProgressBar value={Math.round((index / queue.length) * 100)} />

      <ReviewCard
        question={question}
        moduleTitle={current.moduleTitle}
        daysOverdue={current.daysOverdue}
        onScore={handleScore}
      />
    </div>
  );
}
