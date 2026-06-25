import { ArrowRight, Brain, CalendarCheck2, Flame, RotateCcw, Star, Zap } from 'lucide-react';
import { useMemo } from 'react';
import type { RouteProps } from '../types';
import { AccuracyBars, DonutChart, Heatmap, ModuleBars } from '../components/Charts';
import { KpiCard, Panel, ProgressBar, Tag } from '../components/Primitives';
import { appData, knowledgeLookup, moduleLookup } from '../data/appData';
import { daysUntil, overallMastery, recentStudy, recommendedPoints, weakModules } from '../lib/metrics';
import { buildTodayReviewQueue } from '../lib/reviewScheduler';
import { toggleTodayCheckin, upsertProgress } from '../lib/storage';

export function DashboardRoute({ state, setState, goTo }: RouteProps) {
  const mastery = overallMastery(state);
  const recommended = recommendedPoints(state, 5);
  const weak = weakModules(state);
  const recent = recentStudy(state);
  const days = daysUntil(state.targetDate);
  const totalMastered = Object.values(state.progress).filter((item) => item.status === 'mastered').length;
  const todayChecked = state.checkins.includes(new Date().toISOString().slice(0, 10));
  const todayReview = useMemo(() => buildTodayReviewQueue(state, 3), [state]);

  return (
    <div className="page-grid dashboard-grid">
      <section className="dashboard-hero">
        <div>
          <h2>Java 后端进阶学习平台</h2>
          <p>围绕 JVM、并发、集合、数据库、缓存、微服务和大厂面试，把长期学习、刷题、复盘和场景表达放在一个工作台里。</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={() => goTo('interview')}>
            开始模拟面试 <ArrowRight size={16} />
          </button>
          <button type="button" className="ghost-btn" onClick={() => setState((current) => toggleTodayCheckin(current))}>
            <CalendarCheck2 size={16} />
            {todayChecked ? '取消今日打卡' : '今日打卡'}
          </button>
        </div>
      </section>

      {todayReview.length > 0 && (
        <section className="dashboard-review-banner">
          <Zap size={16} />
          <div>
            <strong>今日有 {todayReview.length} 项待复盘</strong>
            <span>{todayReview.map((r) => r.title).join('、')}</span>
          </div>
          <button type="button" className="ghost-btn" onClick={() => goTo('review')}>
            <RotateCcw size={14} />
            去复盘
          </button>
        </section>
      )}

      <div className="kpi-row">
        <KpiCard label="整体进度" value={`${mastery}%`} hint={`${totalMastered}/${appData.knowledgePoints.length} 已掌握`} tone="emerald" />
        <KpiCard label="面试倒计时" value={`${days} 天`} hint={state.targetDate} tone="amber" />
        <KpiCard label="题库规模" value={`${appData.questions.length}`} hint="基础 / 源码 / 场景 / 系统设计" tone="blue" />
        <KpiCard label="错题待复盘" value={`${state.wrongQuestions.length}`} hint={`${state.favorites.length} 个收藏`} tone="slate" />
      </div>

      <Panel title="整体学习进度" className="span-4">
        <div className="progress-overview">
          <DonutChart value={mastery} label="Mastery" />
          <ModuleBars state={state} />
        </div>
      </Panel>

      <Panel title="今日推荐学习任务" className="span-4">
        <div className="task-list">
          {recommended.map(({ point, module }) => (
            <button
              type="button"
              className="task-row"
              key={point.id}
              onClick={() => {
                setState((current) => upsertProgress(current, point.id, 'learning'));
                goTo('modules', point.title);
              }}
            >
              <span className="task-icon">
                <Brain size={15} />
              </span>
              <span>
                <strong>{point.title}</strong>
                <small>{module.title} · {point.estimatedMinutes} min · 难度 {point.difficulty}</small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="当前薄弱模块" className="span-4">
        <div className="weak-list">
          {weak.map(({ module, mastery: value, wrong }) => (
            <div className="weak-row" key={module.id}>
              <div>
                <strong>{module.title}</strong>
                <small>{module.description}</small>
              </div>
              <Tag tone={wrong ? 'hot' : 'neutral'}>{wrong} 错题</Tag>
              <ProgressBar value={value} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="高频知识点入口" className="span-6">
        <div className="shortcut-grid">
          {appData.knowledgePoints
            .filter((point) => point.tags.includes('面试高频'))
            .slice(0, 10)
            .map((point) => (
              <button type="button" key={point.id} onClick={() => goTo('modules', point.title)}>
                <Flame size={15} />
                <span>{point.title}</span>
                <small>{moduleLookup.get(point.moduleId)?.title}</small>
              </button>
            ))}
        </div>
      </Panel>

      <Panel title="刷题正确率" className="span-6">
        <AccuracyBars state={state} />
      </Panel>

      <Panel title="最近学习记录" className="span-6">
        <div className="timeline">
          {recent.length ? (
            recent.map((item) => {
              const point = knowledgeLookup.get(item.knowledgePointId);
              return (
                <div className="timeline-row" key={item.knowledgePointId}>
                  <span />
                  <div>
                    <strong>{point?.title ?? item.knowledgePointId}</strong>
                    <small>{point ? moduleLookup.get(point.moduleId)?.title : ''} · {item.status}</small>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-line">暂无学习记录，先从今日推荐开始。</div>
          )}
        </div>
      </Panel>

      <Panel title="学习热力图" className="span-6" action={<Tag tone="green">{state.checkins.length} 次打卡</Tag>}>
        <Heatmap checkins={state.checkins} />
        <div className="heatmap-caption">
          <Star size={14} />
          连续复习比突击更适合 JVM、并发和数据库这类高追问主题。
        </div>
      </Panel>
    </div>
  );
}
