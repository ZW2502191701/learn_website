import { CheckCircle2, Circle, Clock3, RotateCcw } from 'lucide-react';
import type { ProgressStatus } from '../types';
import { statusLabel } from '../lib/metrics';

export function Panel({
  title,
  action,
  children,
  className = ''
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title || action ? (
        <div className="panel-head">
          {title ? <h2>{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = 'emerald'
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'emerald' | 'amber' | 'blue' | 'slate';
}) {
  return (
    <div className={`kpi-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'hot' | 'blue' | 'green' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

export function ProgressBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  return (
    <div className={`progress-bar ${size}`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function StatusSelect({
  value,
  onChange
}: {
  value: ProgressStatus;
  onChange: (status: ProgressStatus) => void;
}) {
  return (
    <div className="status-select">
      {(['not-started', 'learning', 'mastered', 'review'] as ProgressStatus[]).map((status) => {
        const Icon = status === 'mastered' ? CheckCircle2 : status === 'review' ? RotateCcw : status === 'learning' ? Clock3 : Circle;
        return (
          <button
            type="button"
            key={status}
            className={value === status ? 'active' : ''}
            onClick={() => onChange(status)}
          >
            <Icon size={13} />
            {statusLabel[status]}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}
