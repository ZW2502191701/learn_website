import { ArrowRight, Brain, CalendarCheck2, Flame, RotateCcw, Star, Target, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import type { RouteProps } from '../types';
import { AccuracyBars, DonutChart, Heatmap, ModuleBars } from '../components/Charts';
import { RadarChart } from '../components/ChartsExtended';
import { KpiCard, Panel, ProgressBar, Tag } from '../components/Primitives';
import { appData, knowledgeLookup, moduleLookup } from '../data/appData';
import { daysUntil, overallMastery, recentStudy, weakModules } from '../lib/metrics';
import { buildTodayReviewQueue } from '../lib/reviewScheduler';
import { toggleTodayCheckin, upsertProgress } from '../lib/storage';
import { useToast } from '../hooks/useToast';
import { masteryScore, moduleMasteryEnhanced, forgetRisk } from '../services/masteryService';
import { getDueReviews } from '../services/reviewService';
import { todaysTasks, weakKnowledgePoints, recommendedQuestions, interviewReadinessScore } from '../services/recommendationService';
import { streakStats } from '../services/analyticsService';

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
  const days = daysUntil(state.targetDate);
  const totalMastered = Object.values(state.progress).filter((item) => item.status === 'mastered').length;
  const today = new Date().toISOString().slice(0, 10);
  const todayChecked = state.checkins.includes(today);
  const todayReview = useMemo(() => buildTodayReviewQueue(state, 6), [state]);
  const streak = useMemo(() => calcStreak(state.checkins), [state.checkins]);
  const isNewUser = Object.keys(state.progress).length === 0;

  const tasks = useMemo(() => todaysTasks(state), [state]);
  const weak = useMemo(() => weakKnowledgePoints(state, 5), [state]);
  const recQuestions = useMemo(() => recommendedQuestions(state, 5), [state]);
  const readiness = useMemo(() => interviewReadinessScore(state), [state]);
  const dueReviews = useMemo(() => getDueReviews(state), [state]);
  const streaks = useMemo(() => streakStats(state), [state]);

  const radarData = useMemo(() =>
    appData.modules.slice(0, 8).map((mod) => ({
      label: mod.title.replace('篇', '').replace('虚拟机', 'JVM').slice(0, 4),
      value: moduleMasteryEnhanced(state, mod.id).score
    })),
    [state]
  );

  const handleCheckin = () => {
    setState((cur) => toggleTodayCheckin(cur));
    toast.success(todayChecked ? '已取消今日打卡' : `今日打卡成功 🎉 连续 ${streak + (todayChecked ? -1 : 1)} 天`);
  };

  if (isNewUser) {
    return (
      <div className="page-grid dashboard-grid">
        <section className="dashboard-hero" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 24 }}>
          <div>
            <h2>欢迎来到 JavaPath</h2>
            <p>Java 后端工程师的专属学习工作台——面试训练、知识复盘、场景表达，一站直达。</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { icon: '📚', title: '系统学习', body: '11 份 PDF 知识点，章节结构化阅读，标注进度与笔记' },
              { icon: '🎯', title: '面试训练', body: '基础题、源码题、场景题、系统设计——模拟大厂面试节奏' },
              { icon: '🔁', title: '智能复习', body: '错题优先级调度、收藏标记、间隔复习巩固记忆' }
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
          <p>围绕 JVM、并发、集合、数据库、缓存、微服务和大厂面试，把学习、刷题、复盘和模拟面试放在一个工作台里。</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={() => goTo('interviewRoom')}>
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
        <KpiCard label="整体掌握度" value={`${mastery}%`} hint={`${totalMastered}/${appData.knowledgePoints.length} 已掌握`} tone="emerald" />
        <KpiCard label="面试准备度" value={`${readiness.score}`} hint="满分 100" tone="blue" />
        <KpiCard label="面试倒计时" value={`${days} 天`} hint={state.targetDate} tone="amber" />
        <KpiCard label="待复习" value={`${dueReviews.length}`} hint={`${state.wrongQuestions.length} 错题`} tone="slate" />
      </div>

      <Panel title="今日学习任务" className="span-4">
        <div style={{ display: 'grid', gap: 16 }}>
          {tasks.studies.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>待学习</div>
              <div className="task-list">
                {tasks.studies.map((kp) => (
                  <button type="button" className="task-row" key={kp.id}
                    onClick={() => { setState((cur) => upsertProgress(cur, kp.id, 'learning')); goTo('modules', kp.title); }}>
                    <span className="task-icon"><Brain size={15} /></span>
                    <span>
                      <strong>{kp.title}</strong>
                      <small>{moduleLookup.get(kp.moduleId)?.title} · 掌握度 {masteryScore(state, kp.id)}%</small>
                    </span>
                    <ArrowRight size={15} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {tasks.reviews.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>待复习</div>
              <div className="task-list">
                {tasks.reviews.map((r) => {
                  const q = appData.questions.find((q) => q.id === r.questionId);
                  return (
                    <button type="button" className="task-row" key={r.questionId}
                      onClick={() => goTo('review')}>
                      <span className="task-icon"><RotateCcw size={15} /></span>
                      <span>
                        <strong>{q?.title ?? r.questionId}</strong>
                        <small>{moduleLookup.get(r.moduleId)?.title} · 间隔 {r.intervalDays} 天</small>
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {tasks.studies.length === 0 && tasks.reviews.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: 12 }}>
              今日暂无待办任务，可以去面试训练或场景实战练习。
            </div>
          )}
        </div>
      </Panel>

      <Panel title="知识掌握雷达" className="span-2">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RadarChart data={radarData} size={200} />
        </div>
      </Panel>

      <Panel title="遗忘风险预警" className="span-2"
        action={weak.filter((w) => w.forgetRisk > 50).length > 0 ? <Tag tone="hot"><AlertTriangle size={12} /> 高风险</Tag> : undefined}>
        <div style={{ display: 'grid', gap: 8 }}>
          {weak.filter((w) => w.forgetRisk > 30).slice(0, 5).map((w) => (
            <div key={w.point.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: w.forgetRisk > 60 ? 'var(--danger)' : w.forgetRisk > 40 ? 'var(--warning)' : 'var(--muted)'
              }} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {w.point.title}
              </span>
              <Tag tone={w.forgetRisk > 60 ? 'hot' : 'neutral'}>{w.forgetRisk}%</Tag>
              <button type="button" className="ghost-btn" style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => goTo('modules', w.point.title)}>
                复习
              </button>
            </div>
          ))}
          {weak.filter((w) => w.forgetRisk > 30).length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>当前无高遗忘风险项，继续保持！</div>
          )}
        </div>
      </Panel>

      <Panel title="整体学习进度" className="span-4">
        <div className="progress-overview">
          <DonutChart value={mastery} label="Mastery" />
          <ModuleBars state={state} />
        </div>
      </Panel>

      <Panel title="推荐练习题目" className="span-3">
        <div className="task-list">
          {recQuestions.map(({ question, module, reason }) => (
            <button type="button" className="task-row" key={question.id}
              onClick={() => goTo('interview', question.title)}>
              <span className="task-icon"><Target size={15} /></span>
              <span>
                <strong>{question.title}</strong>
                <small>{module.title} · <Tag tone="blue">{reason}</Tag></small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="面试准备度" className="span-3">
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: readiness.score >= 70 ? 'var(--success)' : readiness.score >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
              {readiness.score}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {readiness.score >= 80 ? '准备充分' : readiness.score >= 60 ? '基本就绪' : readiness.score >= 40 ? '需要加强' : '差距较大'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>综合掌握度、正确率、覆盖率、复盘率</div>
            </div>
          </div>
          {Object.entries(readiness.breakdown).map(([dim, val]) => (
            <div key={dim}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span>{dim}</span>
                <span style={{ color: 'var(--muted)' }}>{val}%</span>
              </div>
              <ProgressBar value={val} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="薄弱模块" className="span-4">
        <div className="weak-list">
          {weakModules(state).map(({ module, mastery: val, wrong }) => (
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

      <Panel title="高频知识点" className="span-4">
        <div className="shortcut-grid">
          {appData.knowledgePoints.filter((p) => p.tags.includes('面试高频')).slice(0, 10).map((p) => (
            <button type="button" key={p.id} onClick={() => goTo('modules', p.title)}>
              <Flame size={15} /><span>{p.title}</span>
              <small>{moduleLookup.get(p.moduleId)?.title}</small>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="刷题正确率" className="span-4">
        <AccuracyBars state={state} />
      </Panel>

      <Panel title="连续学习" className="span-3"
        action={<Tag tone="green"><TrendingUp size={12} /> {streaks.current} 天连续</Tag>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{streaks.current}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>当前连续</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{streaks.longest}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>最长连续</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{streaks.thisWeek}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>本周打卡</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{streaks.total}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>累计打卡</div>
          </div>
        </div>
      </Panel>

      <Panel title="最近学习记录" className="span-5">
        <div className="timeline">
          {recentStudy(state).length ? recentStudy(state).map((item) => {
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

      <Panel title="学习热力图" className="span-4"
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
