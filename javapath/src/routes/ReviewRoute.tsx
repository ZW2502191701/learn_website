import { Bookmark, RotateCcw, StickyNote } from 'lucide-react';
import type { RouteProps } from '../App';
import { EmptyState, Panel, Tag } from '../components/Primitives';
import { appData, knowledgeLookup, moduleLookup, questionLookup, scenarioLookup } from '../data/appData';
import { updateWrongNote } from '../lib/storage';

export function ReviewRoute({ state, setState, goTo }: RouteProps) {
  return (
    <div className="review-grid">
      <Panel title="错题复盘" className="span-7">
        <div className="review-list">
          {state.wrongQuestions.length ? (
            state.wrongQuestions.map((wrong) => {
              const question = questionLookup.get(wrong.questionId);
              return question ? (
                <article className="review-card" key={wrong.questionId}>
                  <div>
                    <Tag tone="hot">{moduleLookup.get(wrong.moduleId)?.title}</Tag>
                    <h3>{question.title}</h3>
                    <p>{question.points.slice(0, 2).join('；')}</p>
                  </div>
                  <label className="note-box compact">
                    <span>
                      <StickyNote size={14} />
                      复盘笔记
                    </span>
                    <textarea
                      value={wrong.note}
                      onChange={(event) => setState((current) => updateWrongNote(current, wrong.questionId, event.target.value))}
                      placeholder="这题为什么错？下次答题先说什么？"
                    />
                  </label>
                  <button className="ghost-btn" type="button" onClick={() => goTo('interview', question.title)}>
                    <RotateCcw size={16} />
                    重新练习
                  </button>
                </article>
              ) : null;
            })
          ) : (
            <EmptyState title="暂无错题" body="在面试训练页把题目标记为错题后，会进入这里复盘。" />
          )}
        </div>
      </Panel>

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
