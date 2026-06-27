import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpressionSectionProps {
  title: string;
  content: string;
  userContent?: string;
  onUserContentChange?: (v: string) => void;
  showExample?: boolean;
  isCode?: boolean;
}

export function ExpressionSection({
  title,
  content,
  userContent = '',
  onUserContentChange,
  showExample: initialShow = false,
  isCode = false
}: ExpressionSectionProps) {
  const [showExample, setShowExample] = useState(initialShow);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
        <button
          type="button"
          className="ghost-btn"
          style={{ fontSize: 11, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={() => setShowExample(!showExample)}
        >
          {showExample ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showExample ? '收起示例' : '查看示例'}
        </button>
      </div>

      {showExample && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          fontSize: 13,
          lineHeight: 1.7,
          whiteSpace: isCode ? 'pre-wrap' : 'normal',
          fontFamily: isCode ? 'monospace' : 'inherit'
        }}>
          {content}
        </div>
      )}

      {onUserContentChange && (
        <textarea
          value={userContent}
          onChange={(e) => onUserContentChange(e.target.value)}
          placeholder="写下你的项目表达..."
          rows={4}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            fontSize: 13,
            lineHeight: 1.6,
            resize: 'vertical'
          }}
        />
      )}
    </div>
  );
}
