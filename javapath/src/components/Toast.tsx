import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useContext } from 'react';
import { ToastContext } from '../hooks/useToast';
import type { ToastTone } from '../hooks/useToast';

const icons: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};
const colors: Record<ToastTone, string> = {
  success: 'var(--accent)',
  error: 'var(--danger)',
  info: 'var(--blue)',
};

export function ToastStack() {
  const ctx = useContext(ToastContext);
  if (!ctx || !ctx.toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {ctx.toasts.map((t) => {
        const Icon = icons[t.tone];
        return (
          <div key={t.id} className={`toast-item toast-${t.tone}`}>
            <Icon size={16} style={{ color: colors[t.tone], flexShrink: 0 }} />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
