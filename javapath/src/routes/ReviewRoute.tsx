import { Bookmark, RotateCcw, Sparkles, StickyNote, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RouteProps } from '../types';
import { EmptyState, Panel, Tag } from '../components/Primitives';
import { appData, knowledgeLookup, moduleLookup, questionLookup, scenarioLookup } from '../data/appData';
import { updateWrongNote } from '../lib/storage';
import { rankWrongQuestions, buildTodayReviewQueue } from '../lib/reviewScheduler';
import { upsertProgress } from '../lib/storage';
import { useToast } from '../hooks/useToast';

type Tab = 'wrong' | 'favorites' | 'today';

function Flashcard({ items, onClose, setState }: {
  items: ReturnType<typeof buildTodayReviewQueue>;
  onClose: () => void;
  setState: RouteProps['setState'];
}) {
  const toast = useToast();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const item = items[idx];
  const point = item ? knowledgeLookup.get(item.id) : null;

  if (!item) {
    return (
      <div className="flashcard-overlay">
        <div className="flashcard-wrap">
          <div className="flashcard"><h2>🎉 本轮复习完成！</h2></div>
          <button className="primary-btn" style={{ justifySelf: 'center' }} onClick={onClose}>返回</button>
        </div>
      </div>
    );
  }

  const handleEval = (score: number) => {
    if (point) {
      setState((cur) => upsertProgress(cur, point.id, score >= 3 ? 'mastered' : score >= 2 ? 'review' : 'learning'));
    }
    toast.success(score >= 3 ? '已标记为掌握' : score >= 2 ? '标记为需复习' : '标记为学习中');
    setIdx((i) => i + 1);
    setFlipped(false);
  };

  return (
    <div className="flashcard-overlay">
      <div className="flashcard-wrap">
        <div className="flashcard-progress">{idx + 1} / {items.length} — {item.moduleTitle}</div>
        <div className="flashcard" onClick={() => setFlipped((v) => !v)}>
          <h2>{item.title}</h2>
          {flipped && point?.coreConcepts[0] && (
            <p>{point.coreConcepts[0].body.replace(/<[^>]+>/g, '').slice(0, 200)}…</p>
          )}
          {!flipped && <p style={{ fontSize: 13, color: 'var(--muted)' }}>点击翻转查看要点</p>}
        </div>
        {flipped ? (
          <div className="flashcard-actions">
            {([['不会', 1], ['模糊', 2], ['基本会', 3], ['完全会', 4]] as [string, number][]).map(([label, score]) => (
              <button key={label} type="button" onClick={() => handleEval(score)}>{label}</button>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <button className="ghost-btn" type="button" onClick={onClose}>退出闪卡</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReviewRoute({ state, setState, goTo }: RouteProps) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('today');
  const [flashcardMode, setFlashcardMode] = useState(false);
  const ranked = useMemo(() => rankWrongQuestions(state, 20), [state]);
  const todayQueue = useMemo(() => buildTodayReviewQueue(state, 20), [state]);

  if (flashcardMode) {
    return <Flashcard items={todayQueue} onClose={() => setFlashcardMode(false)} setState={setState} />;
  }

  return (
    <div className="review-grid">
      {/* Tab switcher */}
      <div className="span-12" style={{ display: 'flex', gap: 6, padding: '4px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface-2)', width: 'fit-content' }}>
        {([['today', `今日待复习 (${todayQueue.length})`], ['wrong', `错题复盘 (${ranked.length})`], ['favorites', `收藏 (${state.favorites.length})`]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} type="button"
            style={{ minHeight: 34, padding: '0 12px', borderRadius: 7, background: tab === id ? 'var(--surface)' : 'transparent', color: tab === id ? 'var(--text)' : 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 700, border: 'none' }}
            onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'today' && (
        <Panel title="今日复习推荐" className="span-12"
          action={todayQueue.length > 0 ? <button className="primary-btn" type="button" style={{ minHeight: 32, padding: '0 12px', fontSize: 13 }} onClick={() => setFlashcardMode(true)}><Sparkles size={14} /> 开始闪卡</button> : undefined}>
          {todayQueue.length > 0 ? (
            <div className="today-review-queue">
              <div className="today-review-header">
                <Zap size={16} />
                <span>基于错题优先级和收藏状态自动生成，复习越及时效果越好。</span>
              </div>
              <div className="today-review-list">
                {todayQueue.map((item) => (
                  <button type="button" key={`${item.type}-${item.id}`} className="today-review-item"
                    onClick={() => goTo(item.route, item.title)}>
                    <Tag tone={item.type === 'wrong' ? 'hot' : 'blue'}>{item.type === 'wrong' ? '错题' : '收藏'}</Tag>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.moduleTitle} · {item.reason}</small>
                    </span>
                    <RotateCcw size={14} />
                  </button>
                ))}
              </div>
            </div>
          ) : <EmptyState title="今日暂无待复习" body="继续学习或刷题后，系统会自动安排复习计划。" />}
        </Panel>
      )}

      {tab === 'wrong' && (
        <Panel title="错题复盘" className="span-12">
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
                          {item.reasons.slice(0, 2).map((r) => <Tag key={r} tone="blue">{r}</Tag>)}
                        </div>
                      )}
                    </div>
                    <label className="note-box compact">
                      <span><StickyNote size={14} /> 复盘笔记</span>
                      <textarea value={item.wrong.note}
                        onChange={(e) => setState((cur) => updateWrongNote(cur, item.wrong.questionId, e.target.value))}
                        placeholder="这题为什么错？下次答题先说什么？" />
                    </label>
                    <button className="ghost-btn" type="button" onClick={() => goTo('interview', question.title)}>
                      <RotateCcw size={16} /> 重新练习
                    </button>
                  </article>
                ) : null;
              })}
            </div>
          ) : <EmptyState title="暂无错题" body="在面试训练页把题目标记为错题后，会进入这里复盘。" />}
        </Panel>
      )}

      {tab === 'favorites' && (
        <Panel title="收藏重点" className="span-12">
          <div className="favorite-list">
            {state.favorites.length ? state.favorites.map((fav) => {
              const title =
                fav.targetType === 'knowledge' ? knowledgeLookup.get(fav.targetId)?.title
                : fav.targetType === 'question' ? questionLookup.get(fav.targetId)?.title
                : scenarioLookup.get(fav.targetId)?.title;
              return (
                <button type="button" key={`${fav.targetType}-${fav.targetId}`}
                  onClick={() => goTo(fav.targetType === 'question' ? 'interview' : fav.targetType === 'scenario' ? 'scenarios' : 'modules', title)}>
                  <Bookmark size={15} />
                  <span><strong>{title}</strong><small>{fav.targetType} · {fav.createdAt.slice(0, 10)}</small></span>
                </button>
              );
            }) : <EmptyState title="暂无收藏" body={`可收藏 ${appData.knowledgePoints.length} 个知识点、${appData.questions.length} 道题和 ${appData.scenarios.length} 个场景。`} />}
          </div>
        </Panel>
      )}
    </div>
  );
}
