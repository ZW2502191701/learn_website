export function FollowUpChain({
  followUps,
  onSelect
}: {
  followUps: string[];
  onSelect: (q: string) => void;
}) {
  if (!followUps.length) return null;
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>面试官可能追问</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {followUps.map((q, i) => (
          <button
            key={i}
            type="button"
            className="tag"
            style={{ cursor: 'pointer', fontSize: 12 }}
            onClick={() => onSelect(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
