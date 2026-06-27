import type { InterviewReport } from '../../types';
import { ProgressBar } from '../Primitives';

export function SessionReport({
  report,
  onClose
}: {
  report: InterviewReport;
  onClose: () => void;
}) {
  const gradeColor = report.averageScore >= 80 ? 'var(--success)' : report.averageScore >= 60 ? 'var(--accent)' : report.averageScore >= 40 ? 'var(--warning)' : 'var(--danger)';
  const grade = report.averageScore >= 80 ? '优秀' : report.averageScore >= 60 ? '良好' : report.averageScore >= 40 ? '及格' : '需加强';

  return (
    <div className="panel" style={{ maxWidth: 600, margin: '0 auto', display: 'grid', gap: 20, padding: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center' }}>面试报告</h3>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: gradeColor }}>{report.averageScore}</div>
        <div style={{ fontSize: 14, color: gradeColor, fontWeight: 600 }}>{grade}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
          共 {report.totalQuestions} 题，回答 {report.answeredQuestions} 题
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>维度评分</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {Object.entries(report.dimensionScores).map(([dim, score]) => (
            <div key={dim}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span>{dim}</span>
                <span>{score}%</span>
              </div>
              <ProgressBar value={score} />
            </div>
          ))}
        </div>
      </div>

      {report.strengths.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--success)' }}>优势</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {report.strengths.map((s) => (
              <span key={s} className="tag tag-green">{s}</span>
            ))}
          </div>
        </div>
      )}

      {report.weaknesses.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--danger)' }}>待提升</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {report.weaknesses.map((w) => (
              <span key={w} className="tag tag-hot">{w}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>建议</div>
        <ul style={{ margin: 0, paddingInlineStart: 16, fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
          {report.suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <button type="button" className="primary-btn" onClick={onClose} style={{ justifySelf: 'center' }}>
        返回面试训练
      </button>
    </div>
  );
}
