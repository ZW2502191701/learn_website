import { useMemo } from 'react';
import type { RouteProps } from '../types';
import { Panel, ProgressBar, Tag } from '../components/Primitives';
import { Heatmap } from '../components/Charts';
import { TrendLine } from '../components/ChartsExtended';
import { weeklyTrend, monthlyTrend, moduleBreakdown, errorTrendByCategory, streakStats } from '../services/analyticsService';
import { overallMastery } from '../lib/metrics';

export function AnalyticsRoute({ state }: RouteProps) {
  const weekly = useMemo(() => weeklyTrend(state), [state]);
  const monthly = useMemo(() => monthlyTrend(state), [state]);
  const modules = useMemo(() => moduleBreakdown(state), [state]);
  const errorTrend = useMemo(() => errorTrendByCategory(state), [state]);
  const streaks = useMemo(() => streakStats(state), [state]);
  const mastery = overallMastery(state);

  const weeklyStudyData = weekly.map((d) => ({ label: d.date.slice(5), value: d.studied }));
  const weeklyRateData = weekly.map((d) => ({ label: d.date.slice(5), value: d.correctRate }));

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="kpi-row">
        <div className="kpi-card tone-emerald">
          <div className="kpi-label">当前连续</div>
          <div className="kpi-value">{streaks.current} 天</div>
          <div className="kpi-hint">最长 {streaks.longest} 天</div>
        </div>
        <div className="kpi-card tone-blue">
          <div className="kpi-label">本周打卡</div>
          <div className="kpi-value">{streaks.thisWeek} 天</div>
          <div className="kpi-hint">累计 {streaks.total} 次</div>
        </div>
        <div className="kpi-card tone-amber">
          <div className="kpi-label">整体掌握度</div>
          <div className="kpi-value">{mastery}%</div>
          <div className="kpi-hint">{modules.length} 个模块</div>
        </div>
        <div className="kpi-card tone-slate">
          <div className="kpi-label">错题数</div>
          <div className="kpi-value">{state.wrongQuestions.length}</div>
          <div className="kpi-hint">{state.interviewSessions.length} 次模拟面试</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel title="7 天学习趋势">
          <TrendLine data={weeklyStudyData} height={120} label="每日学习知识点数" />
        </Panel>
        <Panel title="7 天正确率趋势">
          <TrendLine data={weeklyRateData} height={120} label="每日正确率 (%)" />
        </Panel>
      </div>

      <Panel title="模块掌握度">
        <div style={{ display: 'grid', gap: 10 }}>
          {modules.map((mod) => (
            <div key={mod.moduleId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{mod.title}</span>
                <span style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                  <span>掌握 {mod.mastery}%</span>
                  <span>正确率 {mod.correctRate}%</span>
                  <span>{mod.questionCount} 题</span>
                  {mod.wrongCount > 0 && <Tag tone="hot">{mod.wrongCount} 错</Tag>}
                </span>
              </div>
              <ProgressBar value={mod.mastery} />
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel title="错误分布">
          <div style={{ display: 'grid', gap: 6 }}>
            {Object.entries(errorTrend).sort(([, a], [, b]) => b - a).map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span style={{ width: 80, fontSize: 12 }}>{cat}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--surface-2)' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${Math.min(100, (count / Math.max(1, state.wrongQuestions.length)) * 100)}%`,
                    background: count > 3 ? 'var(--danger)' : count > 0 ? 'var(--warning)' : 'var(--line)'
                  }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted)', width: 24, textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="学习热力图">
          <Heatmap checkins={state.checkins} />
        </Panel>
      </div>

      {state.interviewSessions.length > 0 && (
        <Panel title="面试训练记录">
          <div style={{ display: 'grid', gap: 8 }}>
            {state.interviewSessions.slice(-10).reverse().map((s) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
                borderBottom: '1px solid var(--line)', fontSize: 13
              }}>
                <Tag tone="blue">{s.mode}</Tag>
                <span style={{ flex: 1 }}>{s.questionIds.length} 题</span>
                <span style={{ fontWeight: 700, color: (s.overallScore ?? 0) >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                  {s.overallScore ?? '-'} 分
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(s.startedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="30 天学习趋势">
        <TrendLine
          data={monthly.map((d) => ({ label: d.date.slice(5), value: d.studied }))}
          height={150}
          label="每日学习量 (30 天)"
        />
      </Panel>
    </div>
  );
}
