import { ArrowRight, BarChart3, BookOpen, Presentation } from 'lucide-react';
import type { InterviewQuestion } from '../types';
import { appData, moduleLookup, scenarioLookup } from '../data/appData';
import { projectExpressions } from '../data/projectExpressions';

interface CrossReferencesProps {
  question: InterviewQuestion;
  onNavigate: (route: string, query?: string) => void;
}

export function CrossReferences({ question, onNavigate }: CrossReferencesProps) {
  const module = moduleLookup.get(question.moduleId);
  const relatedKp = question.knowledgePointId
    ? appData.knowledgePoints.find((kp) => kp.id === question.knowledgePointId)
    : null;

  const relatedScenarios = appData.scenarios.filter(
    (s) => s.moduleIds.includes(question.moduleId) ||
      s.tags.some((t) => question.title.includes(t)) ||
      s.relatedQuestionIds.includes(question.id)
  );

  const relatedExpressions = projectExpressions.filter(
    (e) => e.moduleId === question.moduleId
  );

  const relatedQuestions = appData.questions
    .filter((q) => q.id !== question.id && q.moduleId === question.moduleId && q.knowledgePointId === question.knowledgePointId)
    .slice(0, 3);

  const hasContent = relatedKp || relatedScenarios.length > 0 || relatedExpressions.length > 0 || relatedQuestions.length > 0;
  if (!hasContent) return null;

  return (
    <div style={{ display: 'grid', gap: 10, marginTop: 16, padding: 14, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>关联内容</div>

      {relatedKp && (
        <button
          type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: 'transparent', border: '1px solid var(--line)', fontSize: 13 }}
          onClick={() => onNavigate('modules', relatedKp.title)}
        >
          <BookOpen size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>{relatedKp.title}</strong>
            <small style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>知识点 · {relatedKp.group}</small>
          </span>
          <ArrowRight size={14} />
        </button>
      )}

      {relatedScenarios.slice(0, 2).map((s) => (
        <button
          key={s.id}
          type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: 'transparent', border: '1px solid var(--line)', fontSize: 13 }}
          onClick={() => onNavigate('scenarios', s.title)}
        >
          <BarChart3 size={14} style={{ color: 'var(--blue, var(--accent))', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>{s.title}</strong>
            <small style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>场景实战 · {s.tags.join(' / ')}</small>
          </span>
          <ArrowRight size={14} />
        </button>
      ))}

      {relatedExpressions.slice(0, 1).map((e) => (
        <button
          key={e.id}
          type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: 'transparent', border: '1px solid var(--line)', fontSize: 13 }}
          onClick={() => onNavigate('projectExpression', e.title)}
        >
          <Presentation size={14} style={{ color: 'var(--green, var(--accent))', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>{e.title}</strong>
            <small style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>项目表达 · {module?.title}</small>
          </span>
          <ArrowRight size={14} />
        </button>
      ))}

      {relatedQuestions.length > 0 && (
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>同知识点题目</div>
          {relatedQuestions.map((q) => (
            <button
              key={q.id}
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: 'transparent', border: 'none', fontSize: 12, color: 'var(--accent)' }}
              onClick={() => onNavigate('interview', q.title)}
            >
              <ArrowRight size={12} /> {q.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
