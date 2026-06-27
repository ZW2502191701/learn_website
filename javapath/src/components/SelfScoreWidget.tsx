import { useState } from 'react';

interface SelfScoreWidgetProps {
  onSave: (scores: Record<string, number>) => void;
}

const DIMENSIONS = ['概念清晰度', '代码理解', '边界场景', '面试准备', '能讲给别人'];

export function SelfScoreWidget({ onSave }: SelfScoreWidgetProps) {
  const [scores, setScores] = useState<Record<string, number>>({});

  const handleChange = (dim: string, value: number) => {
    setScores((prev) => ({ ...prev, [dim]: value }));
  };

  const allScored = DIMENSIONS.every((d) => scores[d] !== undefined);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>自我评估</div>
      {DIMENSIONS.map((dim) => (
        <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 80 }}>{dim}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                style={{
                  width: 24, height: 24, borderRadius: 4, fontSize: 11,
                  border: `1px solid ${scores[dim] === v ? 'var(--accent)' : 'var(--line)'}`,
                  background: scores[dim] === v ? 'var(--accent)' : 'transparent',
                  color: scores[dim] === v ? '#fff' : 'var(--text)',
                  cursor: 'pointer'
                }}
                onClick={() => handleChange(dim, v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}
      {allScored && (
        <button type="button" className="primary-btn" style={{ fontSize: 12, padding: '6px 12px', justifySelf: 'start' }}
          onClick={() => onSave(scores)}>
          保存评估
        </button>
      )}
    </div>
  );
}
