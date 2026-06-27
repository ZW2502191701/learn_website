import { useState } from 'react';
import type { InterviewQuestion } from '../types';
import { SafeHtml } from './SafeHtml';
import { Tag } from './Primitives';

interface AnswerVersionTabsProps {
  question: InterviewQuestion;
  showFollowUps?: boolean;
}

type VersionId = 'standard' | 'memorize' | 'deep' | 'oral' | 'project' | 'mistakes';

const VERSIONS: Array<{ id: VersionId; label: string; available: (q: InterviewQuestion) => boolean }> = [
  { id: 'standard', label: '标准答案', available: () => true },
  { id: 'memorize', label: '背诵版', available: (q) => !!q.interviewAnswer },
  { id: 'deep', label: '深度版', available: (q) => !!q.deepAnswer },
  { id: 'oral', label: '口语版', available: (q) => !!q.oralAnswer },
  { id: 'project', label: '项目结合', available: (q) => !!q.projectAnswer },
  { id: 'mistakes', label: '常见错误', available: (q) => (q.commonMistakes?.length ?? 0) > 0 || q.traps.length > 0 }
];

export function AnswerVersionTabs({ question, showFollowUps = true }: AnswerVersionTabsProps) {
  const [active, setActive] = useState<VersionId>('standard');
  const available = VERSIONS.filter((v) => v.available(question));

  if (!available.some((v) => v.id === active)) {
    setActive(available[0]?.id ?? 'standard');
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', paddingBottom: 2, flexWrap: 'wrap' }}>
        {available.map((v) => (
          <button
            key={v.id}
            type="button"
            style={{
              padding: '6px 12px', fontSize: 12, cursor: 'pointer', border: 'none',
              fontWeight: active === v.id ? 700 : 400,
              color: active === v.id ? 'var(--accent)' : 'var(--muted)',
              borderBottom: `2px solid ${active === v.id ? 'var(--accent)' : 'transparent'}`,
              background: 'transparent'
            }}
            onClick={() => setActive(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {active === 'standard' && (
        <div className="answer-body" style={{ fontSize: 13, lineHeight: 1.7 }}>
          <section>
            <h3>参考答案</h3>
            <p><SafeHtml html={question.answer} /></p>
          </section>
          {question.points.length > 0 && (
            <section>
              <h3>答题要点</h3>
              <ul>{question.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </section>
          )}
          {showFollowUps && question.followUps.length > 0 && (
            <section>
              <h3>追问链路</h3>
              <div style={{ display: 'grid', gap: 4 }}>
                {question.followUps.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--muted)', padding: '4px 0', display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--accent)' }}>→</span> {f}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {active === 'memorize' && question.interviewAnswer && (
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ padding: 14, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', whiteSpace: 'pre-wrap' }}>
            {question.interviewAnswer}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
            背诵要点：控制在 30 秒内说完核心结论，再展开 2-3 个细节。
          </div>
        </div>
      )}

      {active === 'deep' && question.deepAnswer && (
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ padding: 14, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', whiteSpace: 'pre-wrap' }}>
            {question.deepAnswer}
          </div>
          {question.sourceCodeAnswer && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>源码视角</div>
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {question.sourceCodeAnswer}
              </div>
            </div>
          )}
        </div>
      )}

      {active === 'oral' && question.oralAnswer && (
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ padding: 14, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
            {question.oralAnswer}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
            口语化表达：像跟同事聊天一样讲出来，不需要太正式，重点是让人听懂。
          </div>
        </div>
      )}

      {active === 'project' && question.projectAnswer && (
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ padding: 14, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', whiteSpace: 'pre-wrap' }}>
            {question.projectAnswer}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
            项目表达结构：业务背景 → 技术问题 → 为什么用这个 → 怎么做的 → 遇到什么坑 → 怎么优化。
          </div>
        </div>
      )}

      {active === 'mistakes' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {question.traps.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--danger)' }}>易错点 / 陷阱</div>
              <div style={{ display: 'grid', gap: 4 }}>
                {question.traps.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 13 }}>
                    <Tag tone="hot">陷阱</Tag> <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {question.commonMistakes && question.commonMistakes.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--warning, var(--danger))' }}>常见错误回答</div>
              <div style={{ display: 'grid', gap: 4 }}>
                {question.commonMistakes.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 13 }}>
                    <span style={{ color: 'var(--danger)' }}>✗</span> <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
