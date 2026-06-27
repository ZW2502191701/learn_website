export function AnswerPanel({
  value,
  onChange,
  revealed,
  onReveal,
  selfScore,
  onSelfScore,
  onNext
}: {
  value: string;
  onChange: (v: string) => void;
  revealed: boolean;
  onReveal: () => void;
  selfScore: number;
  onSelfScore: (score: number) => void;
  onNext: () => void;
}) {
  const scoreLabels = ['完全不会', '模糊', '基本会', '很熟', '秒答'];
  const scoreColors = ['var(--danger)', 'var(--warning)', 'var(--muted)', 'var(--accent)', 'var(--success)'];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>你的回答</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="在此输入你的回答..."
        rows={6}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid var(--line)',
          background: 'var(--surface-2)',
          color: 'var(--text)',
          fontSize: 13,
          lineHeight: 1.6,
          resize: 'vertical'
        }}
      />
      {!revealed ? (
        <button type="button" className="primary-btn" onClick={onReveal}>
          查看参考答案
        </button>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>自评</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {scoreLabels.map((label, i) => (
              <button
                key={i}
                type="button"
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: `1px solid ${selfScore === i ? scoreColors[i] : 'var(--line)'}`,
                  background: selfScore === i ? scoreColors[i] : 'transparent',
                  color: selfScore === i ? '#fff' : 'var(--text)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: selfScore === i ? 600 : 400
                }}
                onClick={() => onSelfScore(i)}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="primary-btn" onClick={onNext}>
            下一题
          </button>
        </div>
      )}
    </div>
  );
}
