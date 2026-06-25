import { Bookmark, RotateCcw, Sparkles, StickyNote, Zap } from 'lucide-react';
import { useMemo } from 'react';
import type { RouteProps } from '../types';
import { EmptyState, Panel, Tag } from '../components/Primitives';
import { appData, knowledgeLookup, moduleLookup, questionLookup, scenarioLookup } from '../data/appData';
import { updateWrongNote } from '../lib/storage';
import { rankWrongQuestions, buildTodayReviewQueue } from '../lib/reviewScheduler';

export function ReviewRoute({ state, setState, goTo }: RouteProps) {
  const ranked = useMemo(() => rankWrongQuestions(state, 20), [state]);
  const todayQueue = useMemo(() => buildTodayReviewQueue(state, 6), [state]);

  return (
    <div className="review-grid">
      {/* 今日复习队列 */}
      {todayQueue.length > 0 && (
        <Panel title="今日复习推荐" className="span-12">
          <div className="today-review-queue">
            <div className="today-review-header">
              <Zap size={16} />
              <span>基于错题优先级和收藏状态自动生成，复习越及时效果越好。</span>
            </div>
            <div className="today-review-list">
              {todayQueue.map((item) => (
                <button
                  type="button"
                  key={`${item.type}-${item.id}`}
                  className="today-review-item"
                  onClick={() => goTo(item.route, item.title)}
                >
                  <Tag tone={item.type === 'wrong' ? 'hot' : 'blue'}>
                    {item.type === 'wrong' ? '错题' : '收藏'}
                  </Tag>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.moduleTitle} · {item.reason}</small>
                  </span>
                  <RotateCcw size={14} />
                </button>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* 错题复盘（按优先级排序） */}
      <Panel title="错题复盘" className="span-7">
        {ranked.length ? (
          <div className="review-list">
            {ranked.map((item) => {
              const question = questionLookup.get(item.wrong.questionId);
              return question ? (
                <article className="review-card" key={item.wrong.questionId}>
                  <div>
                    <div className="review-card-head">
                      <Tag tone="hot">{item.moduleTitle}</Tag>
                      <span className="review-priority-score">优先级 {item.priority}</span>
                    </div>
                    <h3>{question.title}</h3>
                    <p>{question.points.slice(0, 2).join('；')}</p>
                    {item.reasons.length > 0 && (
                      <div className="review-reasons">
                        {item.reasons.slice(0, 2).map((reason) => (
                          <Tag key={reason} tone="blue">{reason}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <label className="note-box compact">
                    <span>
                      <StickyNote size={14} />
                      复盘笔记
                    </span>
                    <textarea
                      value={item.wrong.note}
                      onChange={(event) => setState((current) => updateWrongNote(current, item.wrong.questionId, event.target.value))}
                      placeholder="这题为什么错？下次答题先说什么？"
                    />
                  </label>
                  <button className="ghost-btn" type="button" onClick={() => goTo('interview', question.title)}>
                    <RotateCcw size={16} />
                    重新练习
                  </button>
                </article>
              ) : null;
            })}
          </div>
        ) : (
          <EmptyState title="暂无错题" body="在面试训练页把题目标记为错题后，会进入这里复盘。" />
        )}
      </Panel>

      {/* 收藏重点 */}
      <Panel title="收藏重点" className="span-5">
        <div className="favorite-list">
          {state.favorites.length ? (
            state.favorites.map((favorite) => {
              const title =
                favorite.targetType === 'knowledge'
                  ? knowledgeLookup.get(favorite.targetId)?.title
                  : favorite.targetType === 'question'
                    ? questionLookup.get(favorite.targetId)?.title
                    : scenarioLookup.get(favorite.targetId)?.title;
              return (
                <button
                  type="button"
                  key={`${favorite.targetType}-${favorite.targetId}`}
                  onClick={() => goTo(favorite.targetType === 'question' ? 'interview' : favorite.targetType === 'scenario' ? 'scenarios' : 'modules', title)}
                >
                  <Bookmark size={15} />
                  <span>
                    <strong>{title}</strong>
                    <small>{favorite.targetType} · {favorite.createdAt.slice(0, 10)}</small>
                  </span>
                </button>
              );
            })
          ) : (
            <EmptyState title="暂无收藏" body={`可收藏 ${appData.knowledgePoints.length} 个知识点、${appData.questions.length} 道题和 ${appData.scenarios.length} 个场景。`} />
          )}
        </div>
      </Panel>
    </div>
  );
}
