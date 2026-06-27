import { useState, useCallback } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import type { ProjectExpression, RouteProps } from '../types';
import { moduleLookup } from '../data/appData';
import { projectExpressions } from '../data/projectExpressions';
import { ExpressionSection } from '../components/ExpressionSection';
import { upsertProjectExpression } from '../lib/storage';
import { useToast } from '../hooks/useToast';

export function ProjectExpressionRoute({ state, setState, goTo }: RouteProps) {
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userInputs, setUserInputs] = useState<Record<string, Record<string, string>>>({});

  const selected = projectExpressions.find((e) => e.id === selectedId) ?? null;

  const sections = selected
    ? [
        { key: 'businessBackground', title: '业务背景', content: selected.businessBackground },
        { key: 'technicalProblem', title: '技术问题', content: selected.technicalProblem },
        { key: 'whyThisTech', title: '为什么选这个技术', content: selected.whyThisTech },
        { key: 'howToDesign', title: '如何设计', content: selected.howToDesign },
        { key: 'coreCode', title: '核心代码', content: selected.coreCode, isCode: true },
        { key: 'issuesFaced', title: '遇到的问题', content: selected.issuesFaced.join('\n') },
        { key: 'optimizations', title: '优化方案', content: selected.optimizations.join('\n') },
        { key: 'followUps', title: '面试官可能追问', content: selected.followUps.join('\n') }
      ]
    : [];

  const handleInputChange = useCallback((sectionKey: string, value: string) => {
    if (!selectedId) return;
    setUserInputs((prev) => ({
      ...prev,
      [selectedId]: {
        ...(prev[selectedId] ?? {}),
        [sectionKey]: value
      }
    }));
  }, [selectedId]);

  const handleSave = useCallback(() => {
    if (!selected) return;
    const inputs = userInputs[selected.id] ?? {};
    const saved: ProjectExpression = {
      ...selected,
      ...Object.fromEntries(Object.entries(inputs).filter(([, v]) => v.trim())),
      id: `user-${selected.id}`
    };
    setState((cur) => upsertProjectExpression(cur, saved));
    toast.success('项目表达已保存');
  }, [selected, userInputs, setState, toast]);

  const grouped = projectExpressions.reduce<Record<string, ProjectExpression[]>>((acc, expr) => {
    const mod = moduleLookup.get(expr.moduleId);
    const group = mod?.title ?? expr.moduleId;
    (acc[group] ??= []).push(expr);
    return acc;
  }, {});

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, minHeight: '70vh' }}>
      <div className="panel" style={{ padding: 12, overflow: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, padding: '4px 8px', marginBottom: 8 }}>项目表达模板</div>
        {Object.entries(grouped).map(([group, exprs]) => (
          <div key={group} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', padding: '4px 8px', fontWeight: 600 }}>{group}</div>
            {exprs.map((expr) => (
              <button
                key={expr.id}
                type="button"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  background: selectedId === expr.id ? 'var(--accent)' : 'transparent',
                  color: selectedId === expr.id ? '#fff' : 'var(--text)',
                  border: 'none',
                  marginBottom: 2
                }}
                onClick={() => setSelectedId(expr.id)}
              >
                {expr.title}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        {selected ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selected.title}</h3>
              <button type="button" className="primary-btn" onClick={handleSave}>
                <Save size={14} /> 保存我的表达
              </button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {sections.map((sec) => (
                <div key={sec.key} className="panel" style={{ padding: 16 }}>
                  <ExpressionSection
                    title={sec.title}
                    content={sec.content}
                    userContent={userInputs[selected.id]?.[sec.key] ?? ''}
                    onUserContentChange={(v) => handleInputChange(sec.key, v)}
                    isCode={sec.isCode}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 14 }}>选择左侧模板开始练习项目表达</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              每个模板包含：业务背景、技术问题、选型理由、设计思路、核心代码、问题解决、面试追问
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
