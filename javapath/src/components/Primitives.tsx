// Thin wrappers — accept existing className so all routes keep working unchanged

export function Button({
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}) {
  const base = variant === 'primary' ? 'primary-btn' : variant === 'danger' ? 'ghost-btn danger' : 'ghost-btn';
  const sm = size === 'sm' ? 'style="min-height:32px;padding:0 10px;font-size:12px"' : '';
  void sm; // size handled via className when needed
  return <button className={`${base} ${className}`} {...props} />;
}

export function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-head">
          {title ? <h2>{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = 'emerald',
  delta,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'emerald' | 'amber' | 'blue' | 'slate';
  delta?: number;
}) {
  const toneClass = tone === 'amber' ? 'tone-amber' : tone === 'blue' ? 'tone-blue' : tone === 'slate' ? 'tone-slate' : '';
  return (
    <div className={`kpi-card ${toneClass}`}>
      <span>{label}</span>
      <strong>
        {value}
        {delta !== undefined && delta !== 0 && (
          <sup style={{ fontSize: 12, color: delta > 0 ? 'var(--accent)' : 'var(--danger)', marginLeft: 4 }}>
            {delta > 0 ? `+${delta}` : delta}
          </sup>
        )}
      </strong>
      <small>{hint}</small>
    </div>
  );
}

export function Tag({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'hot' | 'blue' | 'green';
}) {
  return (
    <span className={`tag${tone === 'hot' ? ' tag-hot' : tone === 'blue' ? ' tag-blue' : tone === 'green' ? ' tag-green' : ''}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  return (
    <div className={`progress-bar${size === 'sm' ? ' sm' : ''}`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

import { CheckCircle2, Circle, Clock3, RotateCcw } from 'lucide-react';
import type { ProgressStatus } from '../types';
import { statusLabel } from '../lib/metrics';

export function StatusSelect({
  value,
  onChange,
}: {
  value: ProgressStatus;
  onChange: (s: ProgressStatus) => void;
}) {
  return (
    <div className="status-select">
      {(['not-started', 'learning', 'mastered', 'review'] as ProgressStatus[]).map((s) => {
        const Icon = s === 'mastered' ? CheckCircle2 : s === 'review' ? RotateCcw : s === 'learning' ? Clock3 : Circle;
        return (
          <button type="button" key={s} className={value === s ? 'active' : ''} onClick={() => onChange(s)}>
            <Icon size={13} /> {statusLabel[s]}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  compact = false,
  action,
}: {
  title: string;
  body?: string;
  compact?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className={`empty-state${compact ? ' compact' : ''}`}>
      <strong>{title}</strong>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ h = 18, w = '100%' }: { h?: number; w?: string | number }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: 6,
        background: 'var(--line)',
        animation: 'pulse 1.4s ease-in-out infinite',
      }}
    />
  );
}
