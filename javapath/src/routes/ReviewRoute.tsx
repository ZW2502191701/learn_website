import { Bookmark, RotateCcw, Sparkles, StickyNote, Zap, Brain, Filter, BarChart3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RouteProps } from '../types';
import { EmptyState, Panel, Tag } from '../components/Primitives';
import { SpacedReviewSession } from '../components/SpacedReviewSession';
import { appData, knowledgeLookup, moduleLookup, questionLookup, scenarioLookup } from '../data/appData';
import { updateWrongNote } from '../lib/storage';
import { rankWrongQuestions, buildTodayReviewQueue } from '../lib/reviewScheduler';
import { upsertProgress } from '../lib/storage';
import { getDueReviews } from '../services/reviewService';
import { useToast } from '../hooks/useToast';

type Tab = 'wrong' | 'favorites' | 'today' | 'spaced';

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
  const [spacedMode, setSpacedMode] = useState(false);
  const ranked = useMemo(() => rankWrongQuestions(state, 20), [state]);
  const todayQueue = useMemo(() => buildTodayReviewQueue(state, 20), [state]);
  const dueReviews = useMemo(() => getDueReviews(state), [state]);

  if (flashcardMode) {
    return <Flashcard items={todayQueue} onClose={() => setFlashcardMode(false)} setState={setState} />;
  }

  if (spacedMode) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <button type="button" className="ghost-btn" onClick={() => setSpacedMode(false)}>
            ← 返回
          </button>
        </div>
        <SpacedReviewSession state={state} setState={setState} onComplete={() => setSpacedMode(false)} />
      </div>
    );
  }

  return (
    <div className="review-grid">
      {/* Tab switcher */}
      <div className="span-12" style={{ display: 'flex', gap: 6, padding: '4px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface-2)', width: 'fit-content' }}>
        {([['today', `今日待复习 (${todayQueue.length})`], ['spaced', `间隔复习 (${dueReviews.length})`], ['wrong', `错题复盘 (${ranked.length})`], ['favorites', `收藏 (${state.favorites.length})`]] as [Tab, string][]).map(([id, label]) => (
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

      {tab === 'spaced' && (
        <Panel title="间隔复习（SM-2）" className="span-12"
          action={dueReviews.length > 0 ? <button className="primary-btn" type="button" style={{ minHeight: 32, padding: '0 12px', fontSize: 13 }} onClick={() => setSpacedMode(true)}><Brain size={14} /> 开始复习</button> : undefined}>
          {dueReviews.length > 0 ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                基于 SM-2 算法自动调度，答对间隔递增，答错重置。当前有 {dueReviews.length} 道题到期。
              </div>
              {dueReviews.slice(0, 10).map((r) => {
                const q = questionLookup.get(r.questionId);
                const mod = moduleLookup.get(r.moduleId);
                const daysOverdue = Math.round((Date.now() - new Date(r.nextReviewAt).getTime()) / 86_400_000);
                return (
                  <div key={r.questionId} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                    <Tag tone="blue">{mod?.title ?? r.moduleId}</Tag>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q?.title ?? r.questionId}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      间隔 {r.intervalDays}天 · EF {r.easeFactor.toFixed(1)}
                    </span>
                    {daysOverdue > 0 && <Tag tone="hot">逾期 {daysOverdue}天</Tag>}
                  </div>
                );
              })}
            </div>
          ) : <EmptyState title="暂无待复习题目" body="答错的题目和需要巩固的知识点会通过 SM-2 算法自动安排复习。" />}
        </Panel>
      )}

      {tab === 'wrong' && (
        <Panel title="错题本" className="span-12"
          action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>共 {state.wrongQuestions.length} 道错题</span>}>
          {ranked.length ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {(() => {
                  const byModule: Record<string, number> = {};
                  for (const w of state.wrongQuestions) {
                    byModule[w.moduleId] = (byModule[w.moduleId] ?? 0) + 1;
                  }
                  return Object.entries(byModule).sort(([, a], [, b]) => b - a).slice(0, 6).map(([modId, count]) => (
                    <div key={modId} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: count >= 3 ? 'var(--danger)' : 'var(--text)' }}>{count}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{moduleLookup.get(modId)?.title ?? modId}</div>
                    </div>
                  ));
                })()}
              </div>

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
