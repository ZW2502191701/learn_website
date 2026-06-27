import { useState } from 'react';
import type { KnowledgePoint, InterviewQuestion, Scenario } from '../types';
import { SafeHtml } from './SafeHtml';
import { buildInterviewVersion, buildFollowUpChain, findRelatedScenarios } from '../lib/contentHelpers';

interface KnowledgeDepthTabsProps {
  kp: KnowledgePoint;
  questions: InterviewQuestion[];
  onNavigateInterview?: (query: string) => void;
  onNavigateScenarios?: () => void;
}

type TabId = 'interview' | 'deep' | 'followup' | 'scenarios';

export function KnowledgeDepthTabs({ kp, questions, onNavigateInterview, onNavigateScenarios }: KnowledgeDepthTabsProps) {
  const [tab, setTab] = useState<TabId>('deep');
  const followUps = buildFollowUpChain(kp, questions);
  const relatedScenarios = findRelatedScenarios(kp);
  const interviewVersion = buildInterviewVersion(kp);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'deep', label: '深度理解' },
    { id: 'interview', label: '面试回答版' },
    { id: 'followup', label: `追问链 (${followUps.length})` },
    { id: 'scenarios', label: `场景 (${relatedScenarios.length})` }
  ];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', paddingBottom: 4 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            style={{
              padding: '6px 12px', fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent', cursor: 'pointer', border: 'none', borderBottomWidth: 2,
              borderBottomStyle: 'solid', borderBottomColor: tab === t.id ? 'var(--accent)' : 'transparent'
            }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'deep' && (
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          {kp.coreConcepts.map((c, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.title}</h4>
              <SafeHtml html={c.body} />
            </div>
          ))}
          {kp.code && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>示例代码</h4>
              <pre style={{
                padding: 12, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)',
                fontSize: 12, lineHeight: 1.6, overflow: 'auto', whiteSpace: 'pre-wrap'
              }}>{kp.code}</pre>
            </div>
          )}
        </div>
      )}

      {tab === 'interview' && (
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', whiteSpace: 'pre-wrap' }}>
            {interviewVersion}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
            提示：面试时按 1-2-3 结构化回答，控制在 2 分钟以内。
          </div>
        </div>
      )}

      {tab === 'followup' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {followUps.length > 0 ? followUps.map(({ question, followUps: fu }, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{question.title}</div>
              {fu.map((f, j) => (
                <div key={j} style={{ fontSize: 12, color: 'var(--muted)', padding: '3px 0', display: 'flex', gap: 6 }}>
                  <span style={{ color: 'var(--accent)' }}>→</span> {f}
                </div>
              ))}
              <button type="button" className="ghost-btn" style={{ fontSize: 11, marginTop: 6 }}
                onClick={() => onNavigateInterview?.(question.title)}>
                去练习
              </button>
            </div>
          )) : <div style={{ color: 'var(--muted)', fontSize: 13 }}>暂无追问链</div>}
        </div>
      )}

      {tab === 'scenarios' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {relatedScenarios.length > 0 ? relatedScenarios.map((s) => (
            <button key={s.id} type="button" style={{
              textAlign: 'left', padding: 12, borderRadius: 8, cursor: 'pointer',
              background: 'var(--surface)', border: '1px solid var(--line)', fontSize: 13
            }} onClick={() => onNavigateScenarios?.()}>
              <strong>{s.title}</strong>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {s.tags.join(' · ')} · 难度 {s.difficulty}/5
              </div>
            </button>
          )) : <div style={{ color: 'var(--muted)', fontSize: 13 }}>暂无关联场景</div>}
        </div>
      )}
    </div>
  );
}
