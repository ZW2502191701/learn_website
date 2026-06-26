import { ArrowRight, Brain, CalendarCheck2, Flame, RotateCcw, Star, Zap } from 'lucide-react';
import { useMemo } from 'react';
import type { RouteProps } from '../types';
import { AccuracyBars, DonutChart, Heatmap, ModuleBars } from '../components/Charts';
import { KpiCard, Panel, ProgressBar, Tag } from '../components/Primitives';
import { appData, knowledgeLookup, moduleLookup } from '../data/appData';
import { daysUntil, overallMastery, recentStudy, recommendedPoints, weakModules } from '../lib/metrics';
import { buildTodayReviewQueue } from '../lib/reviewScheduler';
import { toggleTodayCheckin, upsertProgress } from '../lib/storage';
import { useToast } from '../hooks/useToast';

function calcStreak(checkins: string[]): number {
  const set = new Set(checkins);
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function DashboardRoute({ state, setState, goTo }: RouteProps) {
  const toast = useToast();
  const mastery = overallMastery(state);
  const recommended = recommendedPoints(state, 5);
  const weak = weakModules(state);
  const recent = recentStudy(state);
  const days = daysUntil(state.targetDate);
  const totalMastered = Object.values(state.progress).filter((item) => item.status === 'mastered').length;
  const today = new Date().toISOString().slice(0, 10);
  const todayChecked = state.checkins.includes(today);
  const todayReview = useMemo(() => buildTodayReviewQueue(state, 6), [state]);
  const streak = useMemo(() => calcStreak(state.checkins), [state.checkins]);
  const isNewUser = Object.keys(state.progress).length === 0;

  const handleCheckin = () => {
    setState((cur) => toggleTodayCheckin(cur));
    toast.success(todayChecked ? '已取消今日打卡' : `今日打卡成功 🎉 连续 ${streak + (todayChecked ? -1 : 1)} 天`);
  };

  // Onboarding for new users
  if (isNewUser) {
    return (
      <div className="page-grid dashboard-grid">
        <section className="dashboard-hero" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 24 }}>
          <div>
            <h2>👋 欢迎来到 JavaPath</h2>
            <p>Java 后端工程师的专属学习工作台——面试训练、知识复盘、场景表达，一站直达。</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { icon: '📚', title: '系统学习', body: '11 份 PDF 知识点，章节结构化阅读，标注进度与笔记' },
              { icon: '🎯', title: '面试训练', body: '基础题、源码题、场景题、系统设计——模拟大厂面试节奏' },
              { icon: '🔁', title: '智能复习', body: '错题优先级调度、收藏标记、闪卡模式巩固记忆' },
            ].map((card) => (
              <div key={card.title} className="panel" style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 28 }}>{card.icon}</span>
                <strong>{card.title}</strong>
                <small style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{card.body}</small>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="primary-btn" onClick={() => goTo('modules')}>
              从第一个知识点开始 <ArrowRight size={16} />
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
              设置面试目标：
              <input
                type="date"
                value={state.targetDate}
                onChange={(e) => setState((cur) => ({ ...cur, targetDate: e.target.value }))}
                style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '4px 8px', background: 'var(--surface-2)', color: 'var(--text)' }}
              />
            </label>
          </div>
        </section>
      </div>
    );
  }

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
          <button type="button" className="ghost-btn" onClick={handleCheckin}>
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
            <RotateCcw size={14} /> 去复盘
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
            <button type="button" className="task-row" key={point.id}
              onClick={() => { setState((cur) => upsertProgress(cur, point.id, 'learning')); goTo('modules', point.title); }}>
              <span className="task-icon"><Brain size={15} /></span>
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
          {weak.map(({ module, mastery: val, wrong }) => (
            <div className="weak-row" key={module.id}>
              <div>
                <strong>{module.title}</strong>
                <small>{module.description}</small>
              </div>
              <Tag tone={wrong ? 'hot' : 'neutral'}>{wrong} 错题</Tag>
              <ProgressBar value={val} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="高频知识点入口" className="span-6">
        <div className="shortcut-grid">
          {appData.knowledgePoints.filter((p) => p.tags.includes('面试高频')).slice(0, 10).map((p) => (
            <button type="button" key={p.id} onClick={() => goTo('modules', p.title)}>
              <Flame size={15} /><span>{p.title}</span>
              <small>{moduleLookup.get(p.moduleId)?.title}</small>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="刷题正确率" className="span-6">
        <AccuracyBars state={state} />
      </Panel>

      <Panel title="最近学习记录" className="span-6">
        <div className="timeline">
          {recent.length ? recent.map((item) => {
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
          }) : <div className="empty-line">暂无学习记录，先从今日推荐开始。</div>}
        </div>
      </Panel>

      <Panel title="学习热力图" className="span-6"
        action={<Tag tone="green">{streak > 0 ? `🔥 连续 ${streak} 天` : `${state.checkins.length} 次打卡`}</Tag>}>
        <Heatmap checkins={state.checkins} />
        <div className="heatmap-caption">
          <Star size={14} />
          连续复习比突击更适合 JVM、并发和数据库这类高追问主题。
        </div>
      </Panel>
    </div>
  );
}
