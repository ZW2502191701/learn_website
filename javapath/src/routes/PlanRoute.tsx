import { CalendarCheck2, Clock3, RotateCcw, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RouteProps } from '../types';
import { Panel, ProgressBar, Tag } from '../components/Primitives';
import { appData, knowledgeLookup, moduleLookup } from '../data/appData';
import { masteryForModule, recommendedPoints } from '../lib/metrics';
import { buildTodayReviewQueue } from '../lib/reviewScheduler';
import { toggleTodayCheckin, upsertProgress } from '../lib/storage';

const planDays = [7, 14, 30, 60] as const;

export function PlanRoute({ state, setState, goTo }: RouteProps) {
  const [days, setDays] = useState<(typeof planDays)[number]>(30);
  const plan = appData.studyPlans.find((item) => item.days === days)!;
  const todayIndex = new Date().getDate() % plan.dailyTasks.length;
  const todayTask = plan.dailyTasks[todayIndex];
  const recommended = recommendedPoints(state, 4);
  const todayReview = useMemo(() => buildTodayReviewQueue(state, 4), [state]);

  return (
    <div className="route-stack">
      <Panel>
        <div className="route-intro">
          <div>
            <h2>复习计划</h2>
            <p>支持 7 / 14 / 30 / 60 天计划，按模块重要性、掌握度和错题自动安排今日任务。</p>
          </div>
          <div className="segmented">
            {planDays.map((item) => (
              <button type="button" key={item} className={days === item ? 'active' : ''} onClick={() => setDays(item)}>
                {item} 天
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="plan-grid">
        <Panel title="今日任务" className="span-6">
          <div className="today-plan">
            <div>
              <strong>Day {todayTask.day}</strong>
              <h3>{todayTask.title}</h3>
              <p>{todayTask.minutes} 分钟 · {todayTask.moduleIds.map((id) => moduleLookup.get(id)?.title).join(' / ')}</p>
            </div>
            <button type="button" className="primary-btn" onClick={() => setState((current) => toggleTodayCheckin(current))}>
              <CalendarCheck2 size={16} />
              每日打卡
            </button>
          </div>
          <div className="task-list">
            {todayTask.taskIds.map((id) => {
              const point = knowledgeLookup.get(id);
              return point ? (
                <button
                  type="button"
                  className="task-row"
                  key={id}
                  onClick={() => {
                    setState((current) => upsertProgress(current, id, 'learning'));
                    goTo('modules', point.title);
                  }}
                >
                  <Clock3 size={15} />
                  <span>
                    <strong>{point.title}</strong>
                    <small>{moduleLookup.get(point.moduleId)?.title} · {point.estimatedMinutes} min</small>
                  </span>
                </button>
              ) : null;
            })}
          </div>
        </Panel>

        <Panel title="智能推荐下一步" className="span-6">
          <div className="task-list">
            {recommended.map(({ point, module }) => (
              <button type="button" className="task-row" key={point.id} onClick={() => goTo('modules', point.title)}>
                <RotateCcw size={15} />
                <span>
                  <strong>{point.title}</strong>
                  <small>{module.title} · 重要度 {module.importance}</small>
                </span>
              </button>
            ))}
          </div>
        </Panel>

        {todayReview.length > 0 && (
          <Panel title="今日复习队列" className="span-6">
            <div className="task-list">
              {todayReview.map((item) => (
                <button
                  type="button"
                  className="task-row"
                  key={`${item.type}-${item.id}`}
                  onClick={() => goTo(item.route, item.title)}
                >
                  <Zap size={15} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.moduleTitle} · {item.reason}</small>
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="模块安排" className="span-12">
          <div className="plan-table">
            {appData.modules.map((module) => {
              const value = masteryForModule(state, module.id);
              return (
                <div className="plan-row" key={module.id}>
                  <span>
                    <strong>{module.title}</strong>
                    <small>{module.estimatedHours} 小时 · {module.tags.join(' / ')}</small>
                  </span>
                  <ProgressBar value={value} />
                  <Tag tone={value < 40 ? 'hot' : value > 75 ? 'green' : 'blue'}>{value}%</Tag>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
