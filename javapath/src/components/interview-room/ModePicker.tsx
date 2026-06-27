import type { InterviewMode } from '../../types';
import { BookOpen, Briefcase, Flame, MessageSquare, Mic, Target, Zap } from 'lucide-react';

const MODES: Array<{ id: InterviewMode; label: string; desc: string; icon: typeof Mic }> = [
  { id: 'first-round', label: '一面模式', desc: '基础题 + 八股题，考察核心概念掌握', icon: BookOpen },
  { id: 'second-round', label: '二面模式', desc: '场景题 + 系统设计，考察深度和广度', icon: Target },
  { id: 'hr', label: 'HR 面模式', desc: '项目表达、软技能、职业规划', icon: Briefcase },
  { id: 'big-tech-pressure', label: '大厂高压面', desc: '高难度追问，高强度连续轰炸', icon: Flame },
  { id: 'quick-drill', label: '快速刷题', desc: '5 道随机题目快速过一遍', icon: Zap },
  { id: 'error-review', label: '错题重练', desc: '只练你答错过的题目', icon: MessageSquare },
  { id: 'weak-spot', label: '薄弱点专项', desc: '针对掌握度最低的模块出题', icon: Target }
];

export function ModePicker({ onSelect }: { onSelect: (mode: InterviewMode) => void }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700 }}>选择面试模式</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className="panel"
            style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }}
            onClick={() => onSelect(m.id)}
          >
            <m.icon size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{m.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
